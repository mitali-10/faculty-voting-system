import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";

const API = "https://faculty-voting-backend.onrender.com";
const EMAILJS_SERVICE_ID = "service_cit51mn";
const EMAILJS_TEMPLATE_ID = "template_ivx5de5";
const EMAILJS_PUBLIC_KEY = "W0z3JWrp38ZyyQWeN";
const VOTE_LINK = "https://faculty-voting-system-mitali.vercel.app/";

const emptyForm = { name: "", subject: "", qualification: "", photo: "", preview: "", email: "", candidateLoginId: "", password: "" };

function VotingManagement() {
  const [form, setForm] = useState(emptyForm);
  const [candidates, setCandidates] = useState([]);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const fileRef = useRef();

  const fetchCandidates = async () => {
    try {
      const res = await fetch(`${API}/api/results`);
      const data = await res.json();
      setCandidates(data);
    } catch { console.error("Fetch error"); }
  };

  useEffect(() => { fetchCandidates(); }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3500);
  };

  const sendEmail = async (email, name, loginId, password) => {
    if (!email) return;
    try {
      await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
        to_email: email,
        to_name: name || loginId,
        enrollment_no: loginId,
        password: password,
        vote_link: VOTE_LINK,
      }, EMAILJS_PUBLIC_KEY);
    } catch { console.log("Email failed"); }
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Photo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setForm(f => ({ ...f, photo: reader.result, preview: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.subject) { showMessage("Name and Subject required", "error"); return; }
    try {
      setLoading(true);
      const url = editId ? `${API}/api/admin/candidates/update/${editId}` : `${API}/api/admin/candidates/add`;
      const method = editId ? "PUT" : "POST";
      const body = {
        name: form.name, subject: form.subject,
        qualification: form.qualification, photo: form.photo,
        email: form.email
      };
      if (editId) {
        if (form.candidateLoginId.trim()) body.candidateLoginId = form.candidateLoginId.trim();
        if (form.password.trim()) body.password = form.password.trim();
      } else {
        if (form.candidateLoginId.trim()) body.candidateLoginId = form.candidateLoginId.trim();
        if (form.password.trim()) body.password = form.password.trim();
      }

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const data = await res.json();
      if (data.success) {
        showMessage(data.message, "success");
        // Email send on add
        if (!editId && form.email.trim()) {
          const loginId = form.candidateLoginId.trim() || data.candidate?.candidateLoginId || "";
          const pass = form.password.trim() || "candidate@123";
          await sendEmail(form.email.trim(), form.name.trim(), loginId, pass);
          showMessage("Candidate added & email sent!", "success");
        }
        // Email send on edit if password changed
        if (editId && form.password.trim() && form.email.trim()) {
          await sendEmail(form.email.trim(), form.name.trim(), form.candidateLoginId.trim(), form.password.trim());
          showMessage("Updated & new password emailed!", "success");
        }
        setForm(emptyForm); setEditId(null);
        if (fileRef.current) fileRef.current.value = "";
        fetchCandidates();
      } else {
        showMessage(data.message, "error");
      }
    } catch { showMessage("Server error", "error"); }
    finally { setLoading(false); }
  };

  const handleEdit = (c) => {
    setEditId(c._id);
    setForm({ name: c.name, subject: c.subject || "", qualification: c.qualification || "", photo: c.photo || "", preview: c.photo || "", email: c.email || "", candidateLoginId: c.candidateLoginId || "", password: "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Remove this candidate?")) return;
    try {
      const res = await fetch(`${API}/api/admin/candidates/delete/${id}`, { method: "DELETE" });
      const data = await res.json();
      showMessage(data.message, "success");
      if (editId === id) { setEditId(null); setForm(emptyForm); }
      fetchCandidates();
    } catch { showMessage("Delete failed", "error"); }
  };

  const getPhoto = (c) => c.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=60&background=374151&color=fff&rounded=true`;

  const filtered = candidates.filter(c =>
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "4px" }}>Voting Management</h2>
      <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "0.9rem" }}>
        Candidates add karein — Login ID/Password se candidate login kar sakta hai.
      </p>

      {message.text && (
        <div style={{ padding: "10px 14px", borderRadius: "6px", marginBottom: "14px", background: message.type === "success" ? "#f0fdf4" : "#fef2f2", color: message.type === "success" ? "#166534" : "#991b1b", border: message.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca", fontSize: "0.9rem" }}>
          {message.text}
        </div>
      )}

      {/* Form */}
      <div style={{ background: "#f9fafb", padding: "20px", borderRadius: "10px", marginBottom: "24px", border: "1px solid #e5e7eb" }}>
        <h3 style={{ marginTop: 0, marginBottom: "16px", fontSize: "1rem" }}>
          {editId ? "Edit Candidate" : "Add Candidate"}
        </h3>

        <div style={{ display: "flex", gap: "24px", alignItems: "flex-start", flexWrap: "wrap" }}>
          {/* Photo */}
          <div style={{ textAlign: "center" }}>
            <div onClick={() => fileRef.current.click()}
              style={{ width: "90px", height: "90px", borderRadius: "50%", border: "2px dashed #d1d5db", cursor: "pointer", overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px" }}>
              {form.preview
                ? <img src={form.preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                : <span style={{ color: "#9ca3af", fontSize: "0.78rem", textAlign: "center" }}>Click to<br />upload</span>}
            </div>
            <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
            <div style={{ fontSize: "0.75rem", color: "#9ca3af" }}>Max 2MB</div>
            {form.preview && (
              <button onClick={() => setForm(f => ({ ...f, photo: "", preview: "" }))}
                style={{ marginTop: "4px", padding: "2px 8px", background: "white", border: "1px solid #d1d5db", borderRadius: "4px", cursor: "pointer", fontSize: "0.75rem", color: "#6b7280" }}>
                Remove
              </button>
            )}
          </div>

          {/* Fields */}
          <div style={{ flex: 1, minWidth: "200px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "12px" }}>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>Name *</label>
                <input type="text" placeholder="e.g. Dr. Raj Sharma" value={form.name}
                  onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>Subject *</label>
                <input type="text" placeholder="e.g. Data Structures" value={form.subject}
                  onChange={(e) => setForm(f => ({ ...f, subject: e.target.value }))}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>Qualification</label>
                <input type="text" placeholder="e.g. PhD, M.Tech" value={form.qualification}
                  onChange={(e) => setForm(f => ({ ...f, qualification: e.target.value }))}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>Email</label>
                <input type="email" placeholder="candidate@gmail.com" value={form.email}
                  onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>
                  Login ID {editId ? "" : "(blank = auto)"}
                </label>
                <input type="text" placeholder={editId ? "CAN001" : "auto: CAN001"} value={form.candidateLoginId}
                  onChange={(e) => setForm(f => ({ ...f, candidateLoginId: e.target.value }))}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }} />
              </div>
              <div>
                <label style={{ display: "block", marginBottom: "4px", fontSize: "0.85rem", color: "#374151" }}>
                  Password {editId ? "(blank = no change)" : "(blank = auto)"}
                </label>
                <input type="text" placeholder={editId ? "Naya password" : "auto: candidate@123"} value={form.password}
                  onChange={(e) => setForm(f => ({ ...f, password: e.target.value }))}
                  style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.9rem" }} />
              </div>
            </div>

            {form.email && !editId && (
              <p style={{ color: "#2563eb", fontSize: "0.82rem", marginBottom: "10px" }}>
                Credentials will be emailed to: {form.email}
              </p>
            )}

            <div style={{ display: "flex", gap: "8px" }}>
              <button onClick={handleSubmit} disabled={loading}
                style={{ padding: "8px 20px", background: "#1e293b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
                {loading ? "Saving..." : editId ? "Save Changes" : "Add Candidate"}
              </button>
              {editId && (
                <button onClick={() => { setEditId(null); setForm(emptyForm); if (fileRef.current) fileRef.current.value = ""; }}
                  style={{ padding: "8px 16px", background: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" }}>
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* List */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <h3 style={{ margin: 0, fontSize: "1rem" }}>Candidate List ({filtered.length})</h3>
        <input type="text" placeholder="Search..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ padding: "7px 12px", borderRadius: "6px", border: "1px solid #d1d5db", fontSize: "0.88rem", width: "200px" }} />
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#9ca3af" }}>No candidates found.</p>
      ) : (
        filtered.map((c) => (
          <div key={c._id} style={{ background: "white", border: "1px solid #e5e7eb", padding: "14px 16px", marginBottom: "8px", borderRadius: "8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <img src={getPhoto(c)} alt={c.name} style={{ width: "46px", height: "46px", borderRadius: "50%", objectFit: "cover", border: "1px solid #e5e7eb" }} />
              <div>
                <div style={{ fontWeight: "600", color: "#111827" }}>{c.name}</div>
                {c.qualification && <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>{c.qualification}</div>}
                <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>{c.subject}</div>
                {c.email && <div style={{ color: "#6b7280", fontSize: "0.78rem" }}>{c.email}</div>}
                {c.candidateLoginId
                  ? <div style={{ color: "#2563eb", fontSize: "0.78rem" }}>ID: {c.candidateLoginId}</div>
                  : <div style={{ color: "#f59e0b", fontSize: "0.78rem" }}>Login ID set nahi</div>}

                  
              </div>
              <span style={{ background: "#eff6ff", color: "#1e40af", padding: "2px 8px", borderRadius: "99px", fontSize: "0.8rem" }}>
                {c.votes} votes
              </span>
            </div>


            <div style={{ display: "flex", gap: "6px" }}>
              <button onClick={() => handleEdit(c)}
                style={{ padding: "5px 12px", background: "#f3f4f6", border: "1px solid #d1d5db", borderRadius: "5px", cursor: "pointer", fontSize: "0.82rem" }}>
                Edit
              </button>
              <button onClick={() => handleDelete(c._id)}
                style={{ padding: "5px 12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", borderRadius: "5px", cursor: "pointer", fontSize: "0.82rem" }}>
                Remove
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default VotingManagement;