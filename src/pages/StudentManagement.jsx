import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = "service_cit51mn";
const EMAILJS_TEMPLATE_ID = "template_ivx5de5";
const EMAILJS_PUBLIC_KEY = "W0z3JWrp38ZyyQWeN";

const API = "https://faculty-voting-backend.onrender.com";
const VOTE_LINK = "https://faculty-voting-system-mitali.vercel.app/";

const FACE_API_CDN = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const MODELS_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

const emptyForm = { enrollmentNo: "", name: "", email: "", password: "" };

// ─── Face Modal ───────────────────────────────────────────────────────────────
function FaceRegisterModal({ student, onClose, onSuccess }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const intervalRef = useRef(null);

  const [status, setStatus] = useState("loading"); // loading | ready | scanning | captured | saving | done | error
  const [msg, setMsg] = useState("face-api models load ho rahe hain...");
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);

  // Load face-api.js script dynamically
  useEffect(() => {
    if (window.faceapi) { setFaceApiLoaded(true); return; }
    const script = document.createElement("script");
    script.src = FACE_API_CDN;
    script.onload = () => setFaceApiLoaded(true);
    script.onerror = () => { setStatus("error"); setMsg("face-api.js load nahi hua. Internet check karein."); };
    document.head.appendChild(script);
  }, []);

  // Load models once script is ready
  useEffect(() => {
    if (!faceApiLoaded) return;
    const fa = window.faceapi;
    Promise.all([
      fa.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      fa.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      fa.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ]).then(() => {
      setStatus("ready");
      setMsg("Camera start karein");
    }).catch(() => {
      setStatus("error");
      setMsg("Models load nahi hue. Internet connection check karein.");
    });
  }, [faceApiLoaded]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = s;
      videoRef.current.srcObject = s;
      setStatus("scanning");
      setMsg("Chehra oval ke andar rakho — scanning...");
    } catch (err) {
      setStatus("error");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMsg("❌ Camera permission deny ki gayi. Browser address bar mein 🔒 icon click karke Camera = Allow karo, phir retry karo.");
      } else if (err.name === "NotFoundError") {
        setMsg("❌ Device mein camera nahi mila. Webcam connected hai?");
      } else if (err.name === "NotReadableError") {
        setMsg("❌ Camera busy hai — koi aur app use kar raha hai. Baaki apps band karo.");
      } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        setMsg("❌ Camera ke liye HTTPS zaroori hai. Site https:// pe honi chahiye.");
      } else {
        setMsg("❌ Camera error: " + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
  };

  const captureFace = async () => {
    const fa = window.faceapi;
    const video = videoRef.current;
    if (!video || !fa) return;
    setMsg("Chehra detect ho raha hai...");
    const detection = await fa.detectSingleFace(
      video, new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    ).withFaceLandmarks().withFaceDescriptor();

    if (!detection) {
      setMsg("Chehra nahi mila. Seedhe camera ke saamne baitho aur dobara try karo.");
      return;
    }
    const descriptor = Array.from(detection.descriptor);
    stopCamera();
    setStatus("saving");
    setMsg("Face data save ho raha hai...");

    try {
      const res = await fetch(`${API}/api/students/save-face/${student._id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceDescriptor: descriptor }),
      });
      const data = await res.json();
      if (data.success) {
        setStatus("done");
        setMsg("Face successfully register ho gaya! ✓");
        setTimeout(() => { onSuccess(); onClose(); }, 1500);
      } else {
        setStatus("error");
        setMsg(data.message || "Save error");
      }
    } catch {
      setStatus("error");
      setMsg("Server error. Dobara try karein.");
    }
  };

  useEffect(() => { return () => stopCamera(); }, []);

  const overlayColor = status === "done" ? "#22c55e" : status === "error" ? "#ef4444" : status === "scanning" ? "#3b82f6" : "#94a3b8";

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "14px", padding: "28px", maxWidth: "420px", width: "100%" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <h3 style={{ margin: 0, fontSize: "1rem" }}>📸 Face Register — {student.name || student.enrollmentNo}</h3>
          <button onClick={() => { stopCamera(); onClose(); }} style={{ background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer", color: "#6b7280" }}>✕</button>
        </div>

        {/* Video Box */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#0f172a", borderRadius: "10px", overflow: "hidden", marginBottom: "14px" }}>
          <video ref={videoRef} autoPlay muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover", display: status === "scanning" || status === "ready" ? "block" : "none" }} />
          <canvas ref={canvasRef} style={{ display: "none" }} />
          {/* Oval overlay */}
          {(status === "scanning") && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: "160px", height: "200px", border: `2.5px dashed ${overlayColor}`, borderRadius: "50%", animation: "pulse 1.2s infinite" }} />
            </div>
          )}
          {/* Placeholder when camera off */}
          {status !== "scanning" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white" }}>
              <div style={{ fontSize: "3rem", marginBottom: "8px" }}>
                {status === "loading" ? "⏳" : status === "done" ? "✅" : status === "error" ? "❌" : "📷"}
              </div>
            </div>
          )}
        </div>

        <style>{`@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>

        {/* Status message */}
        <div style={{ padding: "10px 14px", borderRadius: "8px", marginBottom: "14px", fontSize: "0.88rem", textAlign: "center",
          background: status === "done" ? "#f0fdf4" : status === "error" ? "#fef2f2" : status === "scanning" ? "#eff6ff" : "#f8fafc",
          color: status === "done" ? "#166534" : status === "error" ? "#991b1b" : status === "scanning" ? "#1e40af" : "#374151",
          border: `1px solid ${status === "done" ? "#bbf7d0" : status === "error" ? "#fecaca" : status === "scanning" ? "#bfdbfe" : "#e5e7eb"}`
        }}>{msg}</div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px" }}>
          {status === "ready" && (
            <button onClick={startCamera} style={{ flex: 1, padding: "9px", background: "#2563eb", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
              📷 Camera Kholo
            </button>
          )}
          {status === "scanning" && (
            <button onClick={captureFace} style={{ flex: 1, padding: "9px", background: "#059669", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
              📸 Capture & Save
            </button>
          )}
          {status === "error" && (
            <button onClick={() => { setStatus("ready"); setMsg("Camera start karein"); }} style={{ flex: 1, padding: "9px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "7px", cursor: "pointer", fontSize: "0.9rem" }}>
              🔄 Dobara Try Karo
            </button>
          )}
          <button onClick={() => { stopCamera(); onClose(); }} style={{ padding: "9px 16px", background: "white", color: "#374151", border: "1px solid #d1d5db", borderRadius: "7px", cursor: "pointer", fontSize: "0.9rem" }}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
function StudentManagement() {
  const [form, setForm] = useState(emptyForm);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [sendingEmail, setSendingEmail] = useState(false);
  const [faceModal, setFaceModal] = useState(null); // student object or null
  const mountedRef = useRef(true);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/students/all`);
      const data = await res.json();
      if (mountedRef.current) setStudents(Array.isArray(data) ? data : []);
    } catch {
      if (mountedRef.current) setMessage({ text: "Server not responding", type: "error" });
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    fetchStudents();
    return () => { mountedRef.current = false; };
  }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3500);
  };

  const sendEmail = async (email, name, enrollmentNo, password) => {
    if (!email) return;
    try {
      setSendingEmail(true);
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: email, to_name: name || enrollmentNo,
        enrollment_no: enrollmentNo, password, vote_link: VOTE_LINK,
      }, EMAILJS_PUBLIC_KEY);
      showMessage("Email sent to " + email, "success");
    } catch {
      showMessage("Student saved but email failed.", "error");
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAdd = async () => {
    if (!form.enrollmentNo.trim() || !form.password.trim()) {
      showMessage("Enrollment No and Password required", "error"); return;
    }
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/students/add`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enrollmentNo: form.enrollmentNo.trim(), name: form.name.trim(), email: form.email.trim(), password: form.password.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Student added successfully", "success");
        if (form.email.trim()) await sendEmail(form.email.trim(), form.name.trim(), form.enrollmentNo.trim(), form.password.trim());
        setForm(emptyForm);
        fetchStudents();
      } else {
        showMessage(data.message, "error");
      }
    } catch { showMessage("Server Error", "error"); }
    finally { setLoading(false); }
  };

  const handleUpdate = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/students/update/${editId}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Student updated", "success");
        if (form.password.trim() && form.email.trim()) await sendEmail(form.email.trim(), form.name.trim(), form.enrollmentNo.trim(), form.password.trim());
        setForm(emptyForm); setEditId(null);
        fetchStudents();
      } else { showMessage(data.message, "error"); }
    } catch { showMessage("Server Error", "error"); }
    finally { setLoading(false); }
  };

  const handleEdit = (s) => {
    setEditId(s._id);
    setForm({ enrollmentNo: s.enrollmentNo, name: s.name || "", email: s.email || "", password: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this student?")) return;
    try {
      const res = await fetch(`${API}/api/students/delete/${id}`, { method: "DELETE" });
      const data = await res.json();
      if (data.success) { showMessage("Student deleted", "success"); fetchStudents(); }
      else showMessage(data.message, "error");
    } catch { showMessage("Delete error", "error"); }
  };

  const handleToggle = async (id) => {
    try {
      await fetch(`${API}/api/students/toggle/${id}`, { method: "PUT" });
      fetchStudents();
    } catch { showMessage("Error", "error"); }
  };

  const filtered = students.filter(s =>
    s.enrollmentNo?.toLowerCase().includes(search.toLowerCase()) ||
    s.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.email?.toLowerCase().includes(search.toLowerCase())
  );

  const faceRegistered = students.filter(s => s.faceDescriptor && s.faceDescriptor.length === 128).length;

  return (
    <div style={{ padding: "20px" }}>
      {faceModal && (
        <FaceRegisterModal
          student={faceModal}
          onClose={() => setFaceModal(null)}
          onSuccess={fetchStudents}
        />
      )}

      <h2 style={{ marginBottom: "4px" }}>Student Management</h2>
      <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "0.9rem" }}>
        Total: {students.length} &nbsp;|&nbsp;
        Voted: {students.filter(s => s.hasVoted).length} &nbsp;|&nbsp;
        Pending: {students.filter(s => !s.hasVoted).length} &nbsp;|&nbsp;
        <span style={{ color: faceRegistered === students.length && students.length > 0 ? "#059669" : "#d97706" }}>
          Face Registered: {faceRegistered}/{students.length}
        </span>
      </p>

      {message.text && (
        <div style={{ padding: "10px 14px", borderRadius: "6px", marginBottom: "14px",
          background: message.type === "success" ? "#f0fdf4" : "#fef2f2",
          color: message.type === "success" ? "#166534" : "#991b1b",
          border: message.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca", fontSize: "0.9rem" }}>
          {message.text}
        </div>
      )}

      {/* Form */}
      <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "10px", marginBottom: "24px", border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0, marginBottom: "14px", fontSize: "1rem" }}>
          {editId ? "Edit Student" : "Add Student"}
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>Enrollment No *</label>
            <input type="text" placeholder="101" value={form.enrollmentNo}
              onChange={(e) => setForm(f => ({ ...f, enrollmentNo: e.target.value }))}
              disabled={!!editId}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", background: editId ? "#f3f4f6" : "white", fontSize: "0.9rem" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>Name</label>
            <input type="text" placeholder="Student name" value={form.name}
              onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>Email</label>
            <input type="email" placeholder="student@gmail.com" value={form.email}
              onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }}
            />
          </div>
          <div>
            <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>
              Password {editId ? "(blank = no change)" : "*"}
            </label>
            <input type="text" placeholder={editId ? "New password (optional)" : "Set password"} value={form.password}
              onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
              style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }}
            />
          </div>
        </div>
        {form.email && (
          <p style={{ color: "#2563eb", fontSize: "0.82rem", marginBottom: "10px" }}>
            Credentials will be emailed to: {form.email}
          </p>
        )}
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={editId ? handleUpdate : handleAdd} disabled={loading || sendingEmail}
            style={{ padding: "8px 20px", background: "#1e293b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
            {sendingEmail ? "Sending email..." : loading ? "Saving..." : editId ? "Save Changes" : "Add Student"}
          </button>
          {editId && (
            <button onClick={() => { setEditId(null); setForm(emptyForm); }}
              style={{ padding: "8px 16px", background: "white", color: "#374151", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" }}>
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* Search */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Student List ({filtered.length})</h3>
        <input type="text" placeholder="Search..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.88rem", width: "220px" }}
        />
      </div>

      {/* Table */}
      {loading && students.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No students found.</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", background: "white", borderRadius: "10px", overflow: "hidden", border: "1px solid #e5e7eb", fontSize: "0.9rem" }}>
          <thead>
            <tr style={{ background: "#1e293b", color: "white" }}>
              {["#", "Enrollment No", "Name", "Email", "Face", "Status", "Vote", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => {
              const hasFace = s.faceDescriptor && s.faceDescriptor.length === 128;
              return (
                <tr key={s._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "10px 14px", color: "#9ca3af" }}>{i + 1}</td>
                  <td style={{ padding: "10px 14px", fontWeight: "600" }}>{s.enrollmentNo}</td>
                  <td style={{ padding: "10px 14px", color: "#374151" }}>{s.name || "—"}</td>
                  <td style={{ padding: "10px 14px", color: "#6b7280" }}>{s.email || "—"}</td>
                  {/* Face Status */}
                  <td style={{ padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ background: hasFace ? "#f0fdf4" : "#fef9c3", color: hasFace ? "#166534" : "#854d0e", padding: "2px 8px", borderRadius: "99px", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {hasFace ? "✓ Registered" : "✗ Pending"}
                      </span>
                      <button onClick={() => setFaceModal(s)}
                        title={hasFace ? "Face update karo" : "Face register karo"}
                        style={{ padding: "3px 8px", background: hasFace ? "#eff6ff" : "#fef2f2", border: hasFace ? "1px solid #bfdbfe" : "1px solid #fecaca", color: hasFace ? "#1e40af" : "#991b1b", borderRadius: "5px", cursor: "pointer", fontSize: "0.78rem", whiteSpace: "nowrap" }}>
                        {hasFace ? "📷 Update" : "📷 Register"}
                      </button>
                    </div>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: s.isActive ? "#f0fdf4" : "#fef2f2", color: s.isActive ? "#166534" : "#991b1b", padding: "2px 8px", borderRadius: "99px", fontSize: "0.8rem" }}>
                      {s.isActive ? "Active" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{ background: s.hasVoted ? "#eff6ff" : "#fefce8", color: s.hasVoted ? "#1e40af" : "#854d0e", padding: "2px 8px", borderRadius: "99px", fontSize: "0.8rem" }}>
                      {s.hasVoted ? "Voted" : "Pending"}
                    </span>
                  </td>
                  <td style={{ padding: "8px 14px" }}>
                    <div style={{ display: "flex", gap: "6px" }}>
                      <button onClick={() => handleEdit(s)}
                        style={{ padding: "4px 10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "5px", cursor: "pointer", fontSize: "0.82rem" }}>
                        Edit
                      </button>
                      <button onClick={() => handleToggle(s._id)}
                        style={{ padding: "4px 10px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "5px", cursor: "pointer", fontSize: "0.82rem" }}>
                        {s.isActive ? "Disable" : "Enable"}
                      </button>
                      <button onClick={() => handleDelete(s._id)}
                        style={{ padding: "4px 10px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "5px", cursor: "pointer", fontSize: "0.82rem" }}>
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentManagement;