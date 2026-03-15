import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";

const API = "http://10.227.192.11:5000";

function CandidateDashboard() {
  const navigate = useNavigate();
  const [candidateData, setCandidateData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState(null);
  const [showWinner, setShowWinner] = useState(false);
  const [tab, setTab] = useState("home");
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });
  const [electionStatus, setElectionStatus] = useState(null);
  const fileRef = useRef();

  useEffect(() => {
    const role = localStorage.getItem("role");
    const candidate = JSON.parse(localStorage.getItem("candidate") || "null");
    if (!role || role !== "candidate" || !candidate) { navigate("/"); return; }
    setCandidateData(candidate);
    setEditForm({ name: candidate.name || "", subject: candidate.subject || "", qualification: candidate.qualification || "", photo: candidate.photo || "", preview: candidate.photo || "" });
    fetchData(candidate);
  }, [navigate]);

  const fetchData = async (candidate) => {
    try {
      const [resultsRes, statusRes] = await Promise.all([
        fetch(`${API}/api/results`),
        fetch(`${API}/api/election/check`)
      ]);
      const results = await resultsRes.json();
      const status = await statusRes.json();
      const sorted = [...results].sort((a, b) => b.votes - a.votes);
      setCandidates(sorted);
      setTotalVotes(results.reduce((s, c) => s + (c.votes || 0), 0));
      setElectionStatus(status);

      // Update my votes
      const me = sorted.find(c => c._id === candidate._id || c.name === candidate.name);
      if (me) {
        const updated = { ...candidate, votes: me.votes };
        setCandidateData(updated);
        localStorage.setItem("candidate", JSON.stringify(updated));
      }
    } catch { console.error("Fetch error"); }
  };

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 3000);
  };

  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { alert("Max 2MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setEditForm(f => ({ ...f, photo: reader.result, preview: reader.result }));
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await fetch(`${API}/api/admin/candidates/update/${candidateData._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name, subject: editForm.subject, qualification: editForm.qualification, photo: editForm.photo })
      });
      const data = await res.json();
      if (data.success) {
        const updated = { ...candidateData, ...editForm };
        setCandidateData(updated);
        localStorage.setItem("candidate", JSON.stringify(updated));
        setEditMode(false);
        showMsg("Profile update ho gayi!", "success");
        fetchData(updated);
      } else showMsg(data.message, "error");
    } catch { showMsg("Server error", "error"); }
    finally { setSaving(false); }
  };

  const getPhoto = (name, photo) =>
    photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "C")}&size=100&background=374151&color=fff&rounded=true`;

  const myRank = candidates.findIndex(c => c._id === candidateData?._id || c.name === candidateData?.name) + 1;
  const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
      {/* Navbar */}
      <div style={{ background: "#1e293b", padding: "13px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "white", fontWeight: "600" }}>Faculty Voting System</span>
        <div style={{ display: "flex", gap: "8px" }}>
          <button onClick={() => navigate("/result")}
            style={{ background: "transparent", color: "#cbd5e1", border: "none", cursor: "pointer", fontSize: "0.88rem" }}>
            Result
          </button>
          <button onClick={() => { localStorage.clear(); navigate("/"); }}
            style={{ padding: "6px 14px", background: "#334155", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.88rem" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ maxWidth: "700px", margin: "0 auto", padding: "28px 20px" }}>

        {msg.text && (
          <div style={{ padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", background: msg.type === "success" ? "#f0fdf4" : "#fef2f2", color: msg.type === "success" ? "#166534" : "#991b1b", border: msg.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca", fontSize: "0.88rem" }}>
            {msg.text}
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
          {[["home", "Home"], ["results", "Live Results"], ["winner", "Winner"]].map(([val, label]) => (
            <button key={val} onClick={() => setTab(val)}
              style={{ padding: "9px 20px", border: "none", background: "transparent", cursor: "pointer", fontWeight: tab === val ? "600" : "400", color: tab === val ? "#111827" : "#6b7280", borderBottom: tab === val ? "2px solid #1e293b" : "2px solid transparent", fontSize: "0.9rem" }}>
              {label}
            </button>
          ))}
        </div>

        {/* HOME TAB */}
        {tab === "home" && candidateData && (
          <div>
            {!editMode ? (
              <>
                {/* Profile Card */}
                <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px", display: "flex", gap: "20px", alignItems: "center", marginBottom: "16px" }}>
                  <img src={getPhoto(candidateData.name, candidateData.photo)} alt={candidateData.name}
                    style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb", flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#111827" }}>{candidateData.name}</div>
                    {candidateData.qualification && <div style={{ color: "#6b7280", fontSize: "0.88rem" }}>{candidateData.qualification}</div>}
                    {candidateData.subject && <div style={{ color: "#6b7280", fontSize: "0.88rem" }}>Subject: {candidateData.subject}</div>}
                    <div style={{ color: "#9ca3af", fontSize: "0.82rem", marginTop: "4px" }}>ID: {candidateData.candidateLoginId}</div>
                  </div>
                  <button onClick={() => setEditMode(true)}
                    style={{ padding: "7px 16px", background: "white", border: "1px solid #d1d5db", borderRadius: "7px", cursor: "pointer", fontSize: "0.85rem", flexShrink: 0 }}>
                    Edit Profile
                  </button>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "12px", marginBottom: "16px" }}>
                  {[
                    { label: "My Votes", value: candidateData.votes || 0, color: "#2563eb" },
                    { label: "My Rank", value: myRank > 0 ? `#${myRank}` : "—", color: "#7c3aed" },
                    { label: "Total Votes", value: totalVotes, color: "#059669" }
                  ].map(s => (
                    <div key={s.label} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                      <div style={{ fontSize: "1.8rem", fontWeight: "800", color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px" }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Election Status */}
                {electionStatus && (
                  <div style={{ background: electionStatus.allowed ? "#f0fdf4" : "#fef2f2", border: electionStatus.allowed ? "1px solid #bbf7d0" : "1px solid #fecaca", borderRadius: "10px", padding: "14px 18px" }}>
                    <div style={{ fontWeight: "600", color: electionStatus.allowed ? "#166534" : "#991b1b", fontSize: "0.88rem" }}>
                      {electionStatus.allowed ? "Voting Chal Rahi Hai" : "Voting Band Hai"}
                    </div>
                    <div style={{ color: electionStatus.allowed ? "#15803d" : "#b91c1c", fontSize: "0.82rem", marginTop: "2px" }}>
                      {electionStatus.allowed
                        ? electionStatus.endTime ? `Band hogi: ${fmt(electionStatus.endTime)}` : ""
                        : electionStatus.reason}
                    </div>
                  </div>
                )}

                <button onClick={() => fetchData(candidateData)}
                  style={{ marginTop: "12px", padding: "7px 16px", background: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                  Refresh
                </button>
              </>
            ) : (
              /* Edit Profile */
              <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "24px" }}>
                <h3 style={{ marginTop: 0, fontSize: "1rem", marginBottom: "20px" }}>Edit Profile</h3>
                <div style={{ display: "flex", gap: "20px", alignItems: "flex-start", flexWrap: "wrap" }}>
                  <div style={{ textAlign: "center" }}>
                    <div onClick={() => fileRef.current.click()}
                      style={{ width: "90px", height: "90px", borderRadius: "50%", border: "2px dashed #d1d5db", cursor: "pointer", overflow: "hidden", background: "#f3f4f6", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "6px" }}>
                      {editForm.preview
                        ? <img src={editForm.preview} alt="preview" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        : <span style={{ color: "#9ca3af", fontSize: "0.75rem", textAlign: "center" }}>Click<br />Upload</span>}
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoChange} />
                  </div>
                  <div style={{ flex: 1, minWidth: "200px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                      {[
                        { label: "Name", key: "name", placeholder: "Dr. Raj Sharma" },
                        { label: "Subject", key: "subject", placeholder: "Data Structures" },
                        { label: "Qualification", key: "qualification", placeholder: "PhD, M.Tech" }
                      ].map(f => (
                        <div key={f.key}>
                          <label style={{ display: "block", marginBottom: "4px", fontSize: "0.82rem", color: "#374151" }}>{f.label}</label>
                          <input type="text" placeholder={f.placeholder} value={editForm[f.key]}
                            onChange={e => setEditForm(ef => ({ ...ef, [f.key]: e.target.value }))}
                            style={{ padding: "8px 10px", borderRadius: "6px", border: "1px solid #d1d5db", width: "100%", boxSizing: "border-box", fontSize: "0.88rem" }} />
                        </div>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button onClick={handleSaveProfile} disabled={saving}
                        style={{ padding: "8px 20px", background: "#1e293b", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.88rem" }}>
                        {saving ? "Saving..." : "Save Changes"}
                      </button>
                      <button onClick={() => setEditMode(false)}
                        style={{ padding: "8px 14px", background: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.88rem" }}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* LIVE RESULTS TAB */}
        {tab === "results" && (
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div>
                <h3 style={{ margin: 0 }}>Live Results</h3>
                <p style={{ color: "#6b7280", fontSize: "0.82rem", margin: "2px 0 0" }}>Total votes: {totalVotes}</p>
              </div>
              <button onClick={() => fetchData(candidateData)}
                style={{ padding: "7px 14px", background: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
                Refresh
              </button>
            </div>
            {candidates.map((c, index) => {
              const percentage = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
              const isMe = c._id === candidateData?._id || c.name === candidateData?.name;
              return (
                <div key={c._id} style={{ background: "white", border: isMe ? "2px solid #2563eb" : index === 0 ? "2px solid #1e293b" : "1px solid #e5e7eb", borderRadius: "10px", padding: "14px 16px", marginBottom: "10px", display: "flex", alignItems: "center", gap: "14px" }}>
                  <div style={{ fontWeight: "700", color: "#9ca3af", minWidth: "20px" }}>{index + 1}</div>
                  <img src={getPhoto(c.name, c.photo)} alt={c.name} style={{ width: "48px", height: "48px", borderRadius: "50%", objectFit: "cover", border: "1px solid #e5e7eb" }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div>
                        <span style={{ fontWeight: "600", color: "#111827" }}>{c.name}</span>
                        {isMe && <span style={{ marginLeft: "8px", background: "#eff6ff", color: "#1e40af", padding: "1px 8px", borderRadius: "99px", fontSize: "0.75rem" }}>You</span>}
                        <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>{c.subject}</div>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: "700", color: "#111827" }}>{c.votes}</div>
                        <div style={{ color: "#9ca3af", fontSize: "0.78rem" }}>{percentage}%</div>
                      </div>
                    </div>
                    <div style={{ background: "#e5e7eb", borderRadius: "99px", height: "6px" }}>
                      <div style={{ background: isMe ? "#2563eb" : index === 0 ? "#1e293b" : "#9ca3af", height: "100%", borderRadius: "99px", width: `${percentage}%`, transition: "width 1s" }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* WINNER TAB */}
        {tab === "winner" && (
          <div>
            <h3 style={{ marginBottom: "16px" }}>Election Winner</h3>
            <button onClick={() => {
              const max = Math.max(...candidates.map(c => c.votes));
              setWinner(candidates.filter(c => c.votes === max));
              setShowWinner(true);
            }}
              style={{ padding: "10px 24px", background: "#1e293b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem", marginBottom: "20px" }}>
              Show Winner
            </button>
            {showWinner && winner && winner.map(w => (
              <div key={w._id} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "28px", textAlign: "center" }}>
                <img src={getPhoto(w.name, w.photo)} alt={w.name}
                  style={{ width: "100px", height: "100px", borderRadius: "50%", objectFit: "cover", border: "3px solid #2563eb", marginBottom: "16px" }} />
                <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "4px" }}>Winner</div>
                <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#111827" }}>{w.name}</div>
                {w.qualification && <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{w.qualification}</div>}
                <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "16px" }}>{w.subject}</div>
                <div style={{ background: "#f3f4f6", borderRadius: "8px", padding: "14px" }}>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111827" }}>{w.votes}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{totalVotes > 0 ? ((w.votes / totalVotes) * 100).toFixed(1) : 0}%</div>
                </div>
                {(w._id === candidateData?._id || w.name === candidateData?.name) && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "10px", marginTop: "14px", color: "#166534", fontSize: "0.88rem" }}>
                    Congratulations! Aap winner hain!
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default CandidateDashboard;
