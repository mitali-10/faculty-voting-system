import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";

const EMAILJS_SERVICE_ID = "service_cit51mn";
const EMAILJS_TEMPLATE_ID = "template_ivx5de5";
const EMAILJS_PUBLIC_KEY = "W0z3JWrp38ZyyQWeN";

const API = "https://faculty-voting-backend.onrender.com";
const VOTE_LINK = "http://10.227.192.11:3000/vote";

const emptyForm = { enrollmentNo: "", name: "", email: "", password: "" };

function StudentManagement() {
  const [form, setForm] = useState(emptyForm);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editId, setEditId] = useState(null);
  const [search, setSearch] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });
  const [sendingEmail, setSendingEmail] = useState(false);
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
        to_email: email,
        to_name: name || enrollmentNo,
        enrollment_no: enrollmentNo,
        password: password,
        vote_link: VOTE_LINK,
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
        method: "POST",
        headers: { "Content-Type": "application/json" },
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
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (data.success) {
        showMessage("Student updated", "success");
        if (form.password.trim() && form.email.trim()) await sendEmail(form.email.trim(), form.name.trim(), form.enrollmentNo.trim(), form.password.trim());
        setForm(emptyForm); setEditId(null);
        fetchStudents();
      } else {
        showMessage(data.message, "error");
      }
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

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "4px" }}>Student Management</h2>
      <p style={{ color: "#6b7280", marginBottom: "20px", fontSize: "0.9rem" }}>
        Total: {students.length} &nbsp;|&nbsp; Voted: {students.filter(s => s.hasVoted).length} &nbsp;|&nbsp; Pending: {students.filter(s => !s.hasVoted).length}
      </p>

      {message.text && (
        <div style={{ padding: "10px 14px", borderRadius: "6px", marginBottom: "14px", background: message.type === "success" ? "#f0fdf4" : "#fef2f2", color: message.type === "success" ? "#166534" : "#991b1b", border: message.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca", fontSize: "0.9rem" }}>
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
            <input type="text" placeholder="e.g. 0901CS211001" value={form.enrollmentNo}
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
              {["#", "Enrollment No", "Name", "Email", "Status", "Vote", "Actions"].map(h => (
                <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: "600", fontSize: "0.85rem" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((s, i) => (
              <tr key={s._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                <td style={{ padding: "10px 14px", color: "#9ca3af" }}>{i + 1}</td>
                <td style={{ padding: "10px 14px", fontWeight: "600" }}>{s.enrollmentNo}</td>
                <td style={{ padding: "10px 14px", color: "#374151" }}>{s.name || "—"}</td>
                <td style={{ padding: "10px 14px", color: "#6b7280" }}>{s.email || "—"}</td>
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
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default StudentManagement;
