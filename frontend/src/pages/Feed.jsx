import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import { createClient } from "@supabase/supabase-js";

// Initialize the Supabase client to open the Realtime WebSocket
// It automatically grabs the credentials from your frontend .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function Feed() {
  const { user, token } = useAuth();
  const [photos, setPhotos] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // 1. Initial Data Fetch (Runs once when the page loads)
  useEffect(() => {
    Promise.all([api.listPhotos(token), api.listDepartments()])
      .then(([p, d]) => {
        setPhotos(p);
        setDepartments(d);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  // 2. Supabase Realtime Listener (Stays open to catch instant updates)
  useEffect(() => {
    if (!user) return;

    // Dynamically build the configuration
    const realtimeConfig = {
      event: 'INSERT',
      schema: 'public',
      table: 'photos',
    };

    // If it is a normal user, restrict the listener to ONLY their department ID
    if (!user.is_admin && user.department_id) {
      realtimeConfig.filter = `department_id=eq.${user.department_id}`;
    }

    const channel = supabase
      .channel('realtime-feed')
      .on('postgres_changes', realtimeConfig, (payload) => {
        console.log("Real-time photo received!", payload.new);
        
        // Instantly push the new photo to the top of the state array
        setPhotos((prevPhotos) => [payload.new, ...prevPhotos]);
      })
      .subscribe();

    // Cleanup: Disconnect the channel when they log out or leave the screen
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  function deptName(id) {
    return departments.find((d) => d.id === id)?.name || "Unknown department";
  }

  // 3. Handle Deleting a Photo
  const handleDelete = async (photoId) => {
    // Ask for confirmation so they don't accidentally click it
    if (!window.confirm("Are you sure you want to delete this photo?")) return;
    
    try {
      await api.deletePhoto(photoId, token);
      // Remove it from the screen immediately without needing to refresh
      setPhotos(photos.filter((p) => p.id !== photoId)); 
    } catch (err) {
      alert(err.message);
    }
  };

  if (loading) {
    return (
      <div className="screen-centered">
        <p>Loading…</p>
      </div>
    );
  }

  return (
    <>
      <h1>{user?.is_admin ? "All photos" : "Your department"}</h1>
      {error && <p className="error-banner">{error}</p>}
      {!error && photos.length === 0 && (
        <div className="empty-state">
          <h3>Nothing here yet</h3>
          <p>New photos will show up the moment an admin sends one to your department.</p>
        </div>
      )}
      {photos.map((p) => (
        <div className="card" key={p.id}>
          <img className="card-photo" src={p.image_url} alt={p.caption || "Sent photo"} />
          <div className="card-body">
            <span className="card-dept">{deptName(p.department_id)}</span>
            {p.caption && <p className="card-caption">{p.caption}</p>}
            <p className="card-time">{new Date(p.created_at).toLocaleString()}</p>
            
            {/* 4. Delete Button (Visible to Admins Only) */}
            {user?.is_admin && (
              <button 
                onClick={() => handleDelete(p.id)} 
                style={{ 
                  color: '#dc3545', 
                  marginTop: '10px', 
                  cursor: 'pointer', 
                  background: 'none', 
                  border: 'none', 
                  padding: '5px 0',
                  fontWeight: '600',
                  fontSize: '14px'
                }}
              >
                Delete Photo
              </button>
            )}
          </div>
        </div>
      ))}
      {user?.is_admin && (
        <button className="fab" onClick={() => navigate("/admin/send")} aria-label="Send a photo">
          +
        </button>
      )}
    </>
  );
}