import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../api";

export default function LoginPhone() {
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cleanPhone = phone.trim();
      const result = await api.checkPhone(cleanPhone);
      if (!result.exists) {
        setError("That number isn't registered yet. Ask your administrator to add it.");
        return;
      }
      if (result.has_pin) {
        navigate("/login/pin", { state: { phone: cleanPhone } });
      } else {
        navigate("/setup", { state: { phone: cleanPhone } });
      }
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
      
      {/* Updated Title */}
      <h1>Jindal Steel Fabrication tracker</h1>
      <p className="eyebrow">Sign in with your phone</p>
      
      <p>Enter the number your administrator has on file.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="phone">Phone number</label>
          <input
            id="phone"
            type="tel"
            placeholder="+91 98765 43210"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            autoFocus
          />
        </div>
        {error && <p className="error-banner">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Checking…" : "Continue"}
        </button>
      </form>
    </div>
  );
}