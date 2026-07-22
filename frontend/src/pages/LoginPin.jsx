import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function LoginPin() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const phone = location.state?.phone;
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!phone) return <Navigate to="/login" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result = await api.login({ phone_number: phone, pin });
      login(result.access_token);
      navigate("/feed", { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="screen-centered">
      {/* Inserted Logo */}
      <img 
        src="/Jindal Steel Logo 2025.jpg" 
        alt="Jindal Steel Fabrication Logo" 
        className="login-logo" 
        style={{ maxWidth: '250px', margin: '0 auto 20px', display: 'block' }} 
      />
      
      <p className="eyebrow">{phone}</p>
      <h1>Enter your PIN</h1>
      <p>Welcome back.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="pin">PIN</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            placeholder="••••"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && <p className="error-banner">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Signing in…" : "Sign in"}
        </button>
        <button type="button" className="btn btn-text" onClick={() => navigate("/login")}>
          Use a different number
        </button>
      </form>
    </div>
  );
}