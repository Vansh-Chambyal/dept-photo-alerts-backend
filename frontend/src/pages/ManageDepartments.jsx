import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import AdminTabs from "../components/AdminTabs";

export default function ManageDepartments() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [error, setError] = useState("");

  function refresh() {
    api.listDepartments().then(setDepartments).catch((err) => setError(err.message));
  }

  useEffect(refresh, []);

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    if (!newName.trim()) return;
    try {
      await api.createDepartment(newName.trim(), token);
      setNewName("");
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleRename(id) {
    setError("");
    try {
      await api.renameDepartment(id, editingName.trim(), token);
      setEditingId(null);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleDelete(id) {
    setError("");
    if (!confirm("Delete this department? This only works if no users are assigned to it.")) return;
    try {
      await api.deleteDepartment(id, token);
      refresh();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <>
      <h1>Departments</h1>
      <AdminTabs active="/admin/departments" />
      {error && <p className="error-banner">{error}</p>}

      {departments.map((d) => (
        <div className="list-row" key={d.id}>
          {editingId === d.id ? (
            <>
              <input value={editingName} onChange={(e) => setEditingName(e.target.value)} autoFocus />
              <button className="btn btn-secondary" onClick={() => handleRename(d.id)}>
                Save
              </button>
              <button className="btn btn-text" onClick={() => setEditingId(null)}>
                Cancel
              </button>
            </>
          ) : (
            <>
              <div className="list-row-main">
                <span className="list-row-title">{d.name}</span>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setEditingId(d.id);
                  setEditingName(d.name);
                }}
              >
                Rename
              </button>
              <button className="btn btn-text" onClick={() => handleDelete(d.id)}>
                Delete
              </button>
            </>
          )}
        </div>
      ))}

      <form onSubmit={handleCreate} className="inline-form">
        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="New department name" />
        <button type="submit" className="btn btn-secondary">
          Add
        </button>
      </form>
    </>
  );
}
