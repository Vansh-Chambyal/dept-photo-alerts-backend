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
      {/* Added the logo image next to the brand text */}
      <Link to="/" className="navbar-brand" style={{ textDecoration: 'none', color: 'inherit', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img 
          src="/Jindal Steel Logo 2025.jpg" 
          alt="Jindal Steel Logo" 
          style={{ height: '30px', width: 'auto', borderRadius: '4px' }} 
        />
        Jindal Steel Fabrication Tracker {user?.is_admin && <span className="badge">ADMIN</span>}
      </Link>

      <div className="navbar-links">
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