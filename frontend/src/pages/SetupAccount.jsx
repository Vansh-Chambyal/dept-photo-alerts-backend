import { useEffect, useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../AuthContext";

export default function SetupAccount() {
  const location = useLocation();
  const navigate = useNavigate();
  const { login } = useAuth();
  const phone = location.state?.phone;
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [pin, setPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!phone) return;
    api
      .listDepartments()
      .then(setDepartments)
      .catch(() => setError("Could not load departments."));
  }, [phone]);

  if (!phone) return <Navigate to="/login" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!/^\d{4,8}$/.test(pin)) {
      setError("PIN must be 4-8 digits.");
      return;
    }
    if (pin !== confirmPin) {
      setError("PINs don't match.");
      return;
    }
    if (!departmentId) {
      setError("Pick a department.");
      return;
    }
    setLoading(true);
    try {
      const result = await api.setPin({ phone_number: phone, pin, department_id: departmentId });
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
      <h1>Set up your account</h1>
      <p>First time here — pick your department and a PIN.</p>
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="department">Department</label>
          <select
            id="department"
            value={departmentId}
            onChange={(e) => setDepartmentId(e.target.value)}
            required
          >
            <option value="" disabled>
              Choose your department
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="pin">Choose a PIN (4-8 digits)</label>
          <input
            id="pin"
            type="password"
            inputMode="numeric"
            placeholder="New PIN"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label htmlFor="confirmPin">Confirm PIN</label>
          <input
            id="confirmPin"
            type="password"
            inputMode="numeric"
            placeholder="Confirm PIN"
            value={confirmPin}
            onChange={(e) => setConfirmPin(e.target.value)}
            required
          />
        </div>
        {error && <p className="error-banner">{error}</p>}
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? "Setting up…" : "Finish setup"}
        </button>
      </form>
    </div>
  );
}