import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import AdminTabs from "../components/AdminTabs";

export default function ManageUsers() {
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");

  function refresh() {
    Promise.all([api.listUsers(token), api.listDepartments()])
      .then(([u, d]) => {
        setUsers(u);
        setDepartments(d);
      })
      .catch((err) => setError(err.message));
  }

  useEffect(refresh, []);

  function deptName(id) {
    return departments.find((d) => d.id === id)?.name;
  }

  async function handleWhitelist(e) {
    e.preventDefault();
    setError("");
    setStatus("");
    try {
      await api.whitelist(phone.trim(), token);
      setStatus(`${phone.trim()} can now log in.`);
      setPhone("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRemove(id) {
    setError("");
    if (!confirm("Remove this user? They will no longer be able to log in.")) return;
    try {
      await api.removeUser(id, token);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1>Users</h1>
      <AdminTabs active="/admin/users" />
      {error && <p className="error-banner">{error}</p>}
      {status && <p className="success-banner">{status}</p>}

      {users.map((u) => (
        <div className="list-row" key={u.id}>
          <div className="list-row-main">
            <span className="list-row-title">{u.phone_number}</span>
            <span className="list-row-meta">
              {u.is_admin ? "Administrator" : deptName(u.department_id) || "No department yet"}
              {!u.has_pin && " · hasn't logged in yet"}
            </span>
          </div>
          {!u.is_admin && (
            <button className="btn btn-text" onClick={() => handleRemove(u.id)}>
              Remove
            </button>
          )}
        </div>
      ))}

      <form onSubmit={handleWhitelist} className="inline-form">
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+91 98765 43210"
          required
        />
        <button type="submit" className="btn btn-secondary">
          Grant access
        </button>
      </form>
    </>
  );
}
