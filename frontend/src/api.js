import { useEffect, useState } from "react";
import { api } from "../api";
import { useAuth } from "../AuthContext";
import AdminTabs from "../components/AdminTabs";
import { Camera, CameraResultType, CameraSource } from "@capacitor/camera";

export default function SendPhoto() {
  const { token } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [departmentId, setDepartmentId] = useState("");
  const [caption, setCaption] = useState("");
  const [fileBlob, setFileBlob] = useState(null);
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

  // Triggered when tapping the "Tap to take or choose a photo" card
  async function selectImage() {
    setError("");
    try {
      const image = await Camera.getPhoto({
        quality: 70, // Compresses the file, dropping it from ~15MB to ~1MB
        allowEditing: false,
        resultType: CameraResultType.Uri, // Safely loads URI instead of heavy Base64
        source: CameraSource.Prompt, // Let's user choose: Take Photo or Choose from Gallery
      });

      if (image && image.webPath) {
        setPreview(image.webPath);

        // Convert the local file path into a safe Blob for upload
        const response = await fetch(image.webPath);
        const blob = await response.blob();
        setFileBlob(blob);
      }
    } catch (err) {
      // Handles user canceling the camera/gallery picker
      console.log("Camera canceled or failed", err);
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setStatus("");
    
    if (!fileBlob || !departmentId) {
      setError("Pick a department and a photo first.");
      return;
    }
    
    setSending(true);
    try {
      const formData = new FormData();
      formData.append("department_id", departmentId);
      if (caption) formData.append("caption", caption);
      
      // Send our optimized Blob file
      formData.append("file", fileBlob, "upload.jpg");

      await api.sendPhoto(formData, token);
      setStatus("Sent — everyone in that department has been notified.");
      setFileBlob(null);
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

        {/* Tapping this container now launches the native Mobile camera prompt */}
        <div onClick={selectImage} style={{ cursor: "pointer" }}>
          {preview ? (
            <img src={preview} alt="Selected" className="image-preview" />
          ) : (
            <div className="image-picker">
              <p>Tap to take or choose a photo</p>
              <p>Auto-optimized for rapid high-speed upload</p>
            </div>
          )}
        </div>

        <div className="field" style={{ marginTop: "1rem" }}>
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