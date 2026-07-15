import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../AuthContext";

export default function NavBar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav className="navbar">
      {/* 1. Make the logo a clickable link back to the feed (/) */}
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold' }}>
        Jindal Steel Fabrication Tracker {user?.is_admin && <span className="badge">ADMIN</span>}
      </Link>

      <div className="navbar-links">
        {/* 2. Add a direct Feed button for easy navigation */}
        {user && <Link to="/" style={{ marginRight: '15px' }}>Feed</Link>}
        
        {user?.is_admin && (
          <Link to="/admin/send" style={{ marginRight: '15px' }}>Manage</Link>
        )}
        
        {user && (
          <button onClick={handleLogout} className="btn-link">Log out</button>
        )}
      </div>
    </nav>
  );
}