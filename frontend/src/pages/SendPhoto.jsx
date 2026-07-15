import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import AdminTabs from "../components/AdminTabs";

export default function SendPhoto() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [caption, setCaption] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    api
      .listDepartments()
      .then(setDepartments)
      .catch(() => setError("Could not load departments."));
  }, []);

  function handleFile(e) {
    const f = e.target.files?.[0];
    setFile(f || null);
    setPreview(f ? URL.createObjectURL(f) : null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("");
    if (!file || !departmentId) {
      setError("Pick a department and a photo first.");
      return;
    }
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("department_id", departmentId);
      if (caption) formData.append("caption", caption);
      formData.append("file", file);
      await api.sendPhoto(formData, token);
      setStatus("Sent — everyone in that department has been notified.");
      setFile(null);
      setPreview(null);
      setCaption("");
      setDepartmentId("");
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  }

  return (
    <>
      <h1>Send a photo</h1>
      <AdminTabs active="/admin/send" />
      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="dept">Department</label>
          <select id="dept" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)} required>
            <option value="" disabled>
              Choose a department
            </option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        </div>

        <label htmlFor="photo">
          {preview ? (
            <img src={preview} alt="Selected" className="image-preview" />
          ) : (
            <div className="image-picker">
              <p>Tap to take or choose a photo</p>
              <p>JPEG, PNG, or WEBP — up to 8MB</p>
            </div>
          )}
        </label>
        <input
          id="photo"
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          style={{ display: "none" }}
        />

        <div className="field">
          <label htmlFor="caption">Caption (optional)</label>
          <input
            id="caption"
            type="text"
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="What's this about?"
          />
        </div>

        {error && <p className="error-banner">{error}</p>}
        {status && <p className="success-banner">{status}</p>}

        <button type="submit" className="btn btn-primary" disabled={sending}>
          {sending ? "Sending…" : "Send to department"}
        </button>
      </form>
    </>
  );
}
