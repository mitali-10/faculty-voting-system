import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";

const API = "https://faculty-voting-backend.onrender.com";
const EMAILJS_SERVICE_ID = "service_cit51mn";
const EMAILJS_TEMPLATE_ID = "template_ivx5de5";
const EMAILJS_PUBLIC_KEY = "W0z3JWrp38ZyyQWeN";
const VOTE_LINK = "https://faculty-voting-system-mitali.vercel.app/";

function Settings() {
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [winner, setWinner] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [tab, setTab] = useState("results");
  const [requests, setRequests] = useState([]);
  const [config, setConfig] = useState({ startTime: "", endTime: "", isActive: true });
  const [newPasswords, setNewPasswords] = useState({});
  const [emailInputs, setEmailInputs] = useState({});
  const [allStudents, setAllStudents] = useState([]);
  const [modal, setModal] = useState(null);
  const [reminderMsg, setReminderMsg] = useState("Aapne abhi tak vote nahi diya hai. Kripya jald se jald apna vote dein!");
  const [sendingEmails, setSendingEmails] = useState(false);

  const fetchData = async () => {
    try {
      const [statsRes, resultsRes, reqRes, studentsRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`),
        fetch(`${API}/api/results`),
        fetch(`${API}/api/auth/reset-requests`),
        fetch(`${API}/api/students/all`)
      ]);
      const statsData = await statsRes.json();
      const resultsData = await resultsRes.json();
      const reqData = await reqRes.json();
      const studentsData = await studentsRes.json();

      if (statsData.success) setStats(statsData.stats);
      const sorted = [...resultsData].sort((a, b) => b.votes - a.votes);
      setCandidates(sorted);
      setTotalVotes(resultsData.reduce((sum, c) => sum + (c.votes || 0), 0));
      if (reqData.success) setRequests(reqData.requests);
      if (Array.isArray(studentsData)) setAllStudents(studentsData);

      try {
        const cfgRes = await fetch(`${API}/api/election/config`);
        const cfgData = await cfgRes.json();
        if (cfgData.success && cfgData.config) {
          setConfig({
            startTime: cfgData.config.startTime ? new Date(cfgData.config.startTime).toISOString().slice(0, 16) : "",
            endTime: cfgData.config.endTime ? new Date(cfgData.config.endTime).toISOString().slice(0, 16) : "",
            isActive: cfgData.config.isActive ?? true
          });
        }
      } catch { }
    } catch { console.error("Fetch error"); }
  };

  useEffect(() => { fetchData(); }, []);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: "", type: "" }), 3000);
  };

  const handleReset = async () => {
    if (!window.confirm("Reset all votes? This cannot be undone.")) return;
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/admin/reset-votes`, { method: "POST" });
      const data = await res.json();
      if (data.success) { showMessage(data.message, "success"); setWinner(null); fetchData(); }
      else showMessage(data.message, "error");
    } catch { showMessage("Server error", "error"); }
    finally { setLoading(false); }
  };

  const handleShowWinner = () => {
    if (candidates.length === 0) return;
    const max = Math.max(...candidates.map(c => c.votes));
    setWinner(candidates.filter(c => c.votes === max));
  };

  const handleSaveConfig = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/api/election/config`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ startTime: config.startTime || null, endTime: config.endTime || null, isActive: config.isActive })
      });
      const data = await res.json();
      if (data.success) showMessage("Schedule save ho gaya!", "success");
      else showMessage(data.message || "Error saving", "error");
    } catch { showMessage("Server error", "error"); }
    finally { setLoading(false); }
  };

  const handleResolve = async (r) => {
    const newPass = newPasswords[r._id];
    if (!newPass || !newPass.trim()) { showMessage("Pehle naya password daalo", "error"); return; }
    try {
      // Update password
      const userId = r.userId;
      const isCandidate = r.name?.includes("[CANDIDATE]") || r.userType === "candidate";
      if (isCandidate) {
        await fetch(`${API}/api/admin/candidates/update/${userId}`, {
          method: "PUT", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ password: newPass.trim() })
        });
      } else {
        // Find student by enrollmentNo and update
        const students = await (await fetch(`${API}/api/students/all`)).json();
        const student = students.find(s => s.enrollmentNo === userId);
        if (student) {
          await fetch(`${API}/api/students/update/${student._id}`, {
            method: "PUT", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password: newPass.trim() })
          });
        }
      }
      // Mark resolved
      await fetch(`${API}/api/auth/reset-requests/${r._id}/resolve`, { method: "PUT" });
      // Send email
      const emailToUse = r.email || emailInputs[r._id]?.trim();
      if (emailToUse) {
        try {
          await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: emailToUse,
            to_name: r.name?.replace("[CANDIDATE]", "").replace("[STUDENT]", "").trim() || r.userId,
            enrollment_no: r.userId,
            password: newPass.trim(),
            vote_link: VOTE_LINK,
          }, EMAILJS_PUBLIC_KEY);
          showMessage("Password updated & email sent!", "success");
        } catch { showMessage("Password updated but email failed", "error"); }
      } else {
        showMessage("Password updated! Email nahi mili — neeche email dal ke dobara try karein.", "error");
      }
      setNewPasswords(p => { const n = { ...p }; delete n[r._id]; return n; });
      fetchData();
    } catch { showMessage("Error resolving request", "error"); }
  };

  const handleSendReminders = async () => {
    const notVoted = allStudents.filter(s => !s.hasVoted && s.email);
    if (notVoted.length === 0) { showMessage("Koi student nahi mila jis par email ho", "error"); return; }
    if (!window.confirm(`${notVoted.length} students ko reminder bhejni hai?`)) return;
    setSendingEmails(true);
    let sent = 0, failed = 0;
    for (const s of notVoted) {
      try {
        await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
          to_email: s.email,
          to_name: s.name || s.enrollmentNo,
          enrollment_no: s.enrollmentNo,
          password: s.password || "—",
          vote_link: VOTE_LINK,
          custom_message: reminderMsg
        }, EMAILJS_PUBLIC_KEY);
        sent++;
      } catch { failed++; }
    }
    setSendingEmails(false);
    showMessage(`${sent} emails bhej di! ${failed > 0 ? `${failed} fail.` : ""}`, "success");
  };

  const getModalStudents = () => {
    if (modal === "all") return allStudents;
    if (modal === "voted") return allStudents.filter(s => s.hasVoted);
    if (modal === "notVoted") return allStudents.filter(s => !s.hasVoted);
    return [];
  };

  const getPhoto = (c) => c.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)
  }&size=60&background=374151&color=fff&rounded=true`;

  const tabs = [
    ["results", "Results"],
    ["reset", "Reset Election"],
    ["requests", `Password Requests${requests.length > 0 ? ` (${requests.length})` : ""}`],
    ["schedule", "Election Schedule"]
  ];

  return (
    <div style={{ padding: "20px" }}>
      <h2 style={{ marginBottom: "20px" }}>Settings</h2>

      {message.text && (
        <div style={{ padding: "10px 14px", borderRadius: "6px", marginBottom: "16px", background: message.type === "success" ? "#f0fdf4" : "#fef2f2", color: message.type === "success" ? "#166534" : "#991b1b", border: message.type === "success" ? "1px solid #bbf7d0" : "1px solid #fecaca", fontSize: "0.9rem" }}>
          {message.text}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", marginBottom: "24px" }}>
        {tabs.map(([val, label]) => (
          <button key={val} onClick={() => setTab(val)}
            style={{ padding: "9px 20px", border: "none", background: "transparent", cursor: "pointer", 
            fontWeight: tab === val ? "600" : "400", color: tab === val ? "#111827" : "#6b7280", 
            borderBottom: tab === val ? "2px solid #1e293b" : "2px solid transparent", fontSize: "0.9rem" }}>
            {label}
          </button>
        ))}
      </div>

      {/* Results Tab */}
      {tab === "results" && (
        <div>
          {stats && (
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginBottom: "20px" }}>
              {[
                { label: "Total Students", value: stats.totalStudents, key: "all", color: "#2563eb" },
                { label: "Voted", value: stats.totalVoted, key: "voted", color: "#16a34a" },
                { label: "Not Voted", value: stats.totalNotVoted, key: "notVoted", color: "#d97706" },
                { label: "Total Votes", value: totalVotes, key: null, color: "#7c3aed" },
              ].map(s => (
                <div key={s.label} onClick={() => s.key && setModal(s.key)}
                  style={{ background: "white", border: "1px solid #e5e7eb", padding: "14px 18px", 
                  borderRadius: "8px", textAlign: "center", minWidth: "110px", cursor: s.key ? "pointer" : "default" }}>
                  <div style={{ fontSize: "1.6rem", fontWeight: "800", color: s.color }}>{s.value}</div>
                  <div style={{ fontSize: "0.78rem", color: "#6b7280" }}>{s.label}</div>
                  {s.key && <div style={{ fontSize: "0.7rem", color: "#9ca3af" }}>click to view</div>}
                </div>
              ))}
            </div>
          )}

          {/* Reminder */}
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px 18px",
             marginBottom: "20px" }}>
            <div style={{ fontWeight: "600", color: "#111827", 
              marginBottom: "8px", fontSize: "0.9rem" }}>Send Reminder to Pending Students</div>
            <div style={{ color: "#6b7280", fontSize: "0.82rem", marginBottom: "10px" }}>
              ({allStudents.filter(s => !s.hasVoted && s.email).length} students with email)
            </div>
            <textarea value={reminderMsg} onChange={e => setReminderMsg(e.target.value)} rows={2}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1px solid #d1d5db",
               fontSize: "0.85rem", resize: "vertical", boxSizing: "border-box", marginBottom: "10px", fontFamily: "inherit" }} />
            <button onClick={handleSendReminders} disabled={sendingEmails}
              style={{ padding: "8px 20px", background: "#1e293b", color: "white", border: "none", borderRadius: "6px", 
              cursor: "pointer", fontWeight: "600", fontSize: "0.88rem" }}>
              {sendingEmails ? "Bhej raha hai..." : "Send Reminder Email"}
            </button>
          </div>

          {candidates.map((c, index) => {
            const percentage = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
            return (
              <div key={c._id} style={{ background: "white", border: index === 0 ? "2px solid #2563eb" : "1px solid #e5e7eb",
              
               padding: "14px 16px", marginBottom: "10px", borderRadius: "10px",
                display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{ fontWeight: "700", color: "#9ca3af", minWidth: "20px" }}>{index + 1}</div>
                <img src={getPhoto(c)} alt={c.name} style={{ width: "50px", height: "50px", borderRadius: "50%", 
                  objectFit: "cover", border: "1px solid #e5e7eb" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <div>
                      <div style={{ fontWeight: "600", color: "#111827" }}>{c.name}</div>
                      <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>{c.subject || c.department}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "700", color: "#111827" }}>{c.votes} votes</div>
                      <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{percentage}%</div>
                    </div>
                  </div>
                  <div style={{ background: "#e5e7eb", borderRadius: "99px", height: "6px" }}>
                    <div style={{ background: index === 0 ? "#2563eb" : "#9ca3af", height: "100%", 
                      borderRadius: "99px", width: `${percentage}%` }} />
                  </div>
                </div>
              </div>
            );
          })}

          <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
            <button onClick={handleShowWinner}
              style={{ padding: "9px 20px", background: "#1e293b", color: "white", border: "none",
               borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
              Show Winner
            </button>
            <button onClick={() => { fetchData(); setWinner(null); }}
              style={{ padding: "9px 16px", background: "white", border: "1px solid #d1d5db",
               borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" }}>
              Refresh
            </button>
          </div>

          {winner && winner.map(w => (
            <div key={w._id} style={{ marginTop: "16px", background: "#f9fafb", 
            border: "1px solid #e5e7eb", borderRadius: "10px", padding: "20px", 
            display: "flex", alignItems: "center", gap: "16px" }}>
              <img src={getPhoto(w)} alt={w.name} style={{ width: "70px", height: "70px",
                
                borderRadius: "50%", objectFit: "cover", border: "2px solid #2563eb" }} />
              <div>
                <div style={{ fontSize: "0.82rem", color: "#6b7280", marginBottom: "2px" }}>Winner</div>
                <div style={{ fontSize: "1.2rem", fontWeight: "700", color: "#111827" }}>{w.name}</div>
                {w.qualification && <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{w.qualification}</div>}
                <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>{w.subject || w.department}</div>
                <div style={{ fontWeight: "600", color: "#2563eb", marginTop: "4px", fontSize: "0.9rem" }}>
                  {w.votes} votes — {totalVotes > 0 ? ((w.votes / totalVotes) * 100).toFixed(1) : 0}%
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reset Tab */}
      {tab === "reset" && (
        <div style={{ maxWidth: "440px" }}>
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "24px" }}>
            <h3 style={{ marginTop: 0, color: "#111827", fontSize: "1rem" }}>Reset Election</h3>
            <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "12px" }}>
              Sab votes delete ho jayenge aur students dobara vote kar sakenge.
            </p>
            {stats && <p style={{ color: "#991b1b", fontSize: "0.85rem",
               marginBottom: "16px" }}>Currently {stats.totalVoted} students ne vote diya hai.</p>}
            <button onClick={handleReset} disabled={loading}
              style={{ padding: "9px 20px", background: "#dc2626", color: "white",
               border: "none", borderRadius: "6px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
              {loading ? "Resetting..." : "Reset All Votes"}
            </button>
          </div>
        </div>
      )}

      {/* Password Requests Tab */}
      {tab === "requests" && (
        <div style={{ maxWidth: "620px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>Password Reset Requests</h3>
          <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "16px" }}>Naya password set karke email bhejo.</p>
          {requests.length === 0 ? (
            <p style={{ color: "#9ca3af" }}>Koi pending request nahi hai.</p>
          ) : (
            requests.map(r => (
              <div key={r._id} style={{ background: "white", border: "1px solid #e5e7eb", 
              borderRadius: "8px", padding: "14px 16px", marginBottom: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontWeight: "600", color: "#111827", fontSize: "0.9rem" }}>{r.name || r.userId}</div>
                    <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>ID: <strong>{r.userId}</strong></div>
                    {r.email 
                      ? <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>Email: {r.email}</div>
                      : <input type="email" placeholder="Email daalo"
                          value={emailInputs[r._id] || ""}
                          onChange={e => setEmailInputs(p => ({ ...p, [r._id]: e.target.value }))}
                          style={{ padding: "4px 8px", borderRadius: "5px", border: "1px solid #fbbf24", 
                            fontSize: "0.78rem", width: "180px", marginTop: "2px" }} />
                    }
                    <div style={{ color: "#9ca3af", fontSize: "0.78rem", marginTop: "2px" }}>
                      {new Date(r.createdAt).toLocaleDateString("en-IN")}
                    </div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", flexShrink: 0 }}>
                    <input type="text" placeholder="Naya password"
                      value={newPasswords[r._id] || ""}
                      onChange={e => setNewPasswords(p => ({ ...p, [r._id]: e.target.value }))}
                      style={{ padding: "6px 10px", borderRadius: "5px", border: "1px solid #d1d5db",
                       fontSize: "0.82rem", width: "150px" }} />
                    <button onClick={() => handleResolve(r)}
                      style={{ padding: "6px 12px", background: "#1e293b", color: "white", border: "none",
                       borderRadius: "5px", cursor: "pointer", fontSize: "0.82rem", textAlign: "center" }}>
                      Set & Email
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Election Schedule Tab */}
      {tab === "schedule" && (
        <div style={{ maxWidth: "480px" }}>
          <h3 style={{ margin: "0 0 4px", fontSize: "1rem" }}>Election Schedule</h3>
          <p style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "20px" }}
          >Is time ke beech hi students vote de sakenge.</p>

          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px",
             padding: "16px 18px", marginBottom: "12px", display: "flex", justifyContent: "space-between", 
             alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: "600", color: "#111827", fontSize: "0.9rem" }}>Voting Active</div>
              <div style={{ color: "#6b7280", fontSize: "0.8rem" }}>Off karne se koi vote nahi de sakta</div>
            </div>
            <div onClick={() => setConfig(c => ({ ...c, isActive: !c.isActive }))}
              style={{ width: "44px", height: "24px", borderRadius: "99px", 
                background: config.isActive ? "#16a34a" : "#d1d5db", 
              cursor: "pointer", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ width: "18px", height: "18px", borderRadius: "50%", background: "white",
                 position: "absolute", top: "3px", left: config.isActive ? "23px" : "3px", 
                 transition: "left 0.2s", boxShadow: "0 1px 3px rgba(0,0,0,0.2)" }} />
            </div>
          </div>

          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px 18px",
             marginBottom: "10px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", color: "#6b7280", 
              marginBottom: "8px", fontWeight: "500" }}>Voting Start Time</label>
            <input type="datetime-local" value={config.startTime}
              onChange={e => setConfig(c => ({ ...c, startTime: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", 
              border: "1px solid #d1d5db", fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
          </div>

          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px 18px",
             marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "0.82rem", 
              color: "#6b7280", marginBottom: "8px", fontWeight: "500" }}>Voting End Time</label>
            <input type="datetime-local" value={config.endTime}
              onChange={e => setConfig(c => ({ ...c, endTime: e.target.value }))}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "7px", border: "1px solid #d1d5db", 
              fontSize: "0.9rem", outline: "none", boxSizing: "border-box" }} />
          </div>

          {(config.startTime || config.endTime) && (
            <div style={{ background: "#f9fafb", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "12px 14px",
             marginBottom: "16px", fontSize: "0.85rem", color: "#374151", lineHeight: 1.7 }}>
              {config.startTime && <div>Shuru: <strong>{new Date(config.startTime).toLocaleString("en-IN")}</strong></div>}
              {config.endTime && <div>Band: <strong>{new Date(config.endTime).toLocaleString("en-IN")}</strong></div>}
              <div style={{ color: config.isActive ? "#166534" : "#991b1b", fontWeight: "500" }}>
                Status: {config.isActive ? "Active" : "Inactive"}
              </div>
            </div>
          )}

          <button onClick={handleSaveConfig} disabled={loading}
            style={{ padding: "10px 24px", background: "#1e293b", color: "white", border: "none", borderRadius: "8px",
             cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
            {loading ? "Saving..." : "Save Schedule"}
          </button>
        </div>
      )}

      {/* Student List Modal */}
      {modal && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", 
        zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "14px", width: "100%", maxWidth: "540px", maxHeight: "80vh",
             overflow: "hidden", display: "flex", flexDirection: "column" }}>
            <div style={{ padding: "18px 20px", borderBottom: "1px solid #e5e7eb", display: "flex", 
              justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "1rem", color: "#111827" }}>
                  {modal === "all" ? "All Students" : modal === "voted" ? "Voted Students" : "Not Voted Students"}
                </div>
                <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>{getModalStudents().length} students</div>
              </div>
              <button onClick={() => setModal(null)}
                style={{ background: "none", border: "none", fontSize: "1.3rem", cursor: "pointer",
                 color: "#6b7280" }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", flex: 1, padding: "12px 16px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "#f9fafb" }}>
                    {["#", "Name", "Enrollment", "Vote"].map(h => (
                      <th key={h} style={{ padding: "8px 10px", textAlign: "left", color: "#6b7280", fontWeight: "600", 
                        fontSize: "0.78rem", borderBottom: "1px solid #e5e7eb" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {getModalStudents().map((s, i) => (
                    <tr key={s._id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "8px 10px", color: "#9ca3af" }}>{i + 1}</td>
                      <td style={{ padding: "8px 10px", fontWeight: "500" }}>{s.name || "—"}</td>
                      <td style={{ padding: "8px 10px", color: "#374151" }}>{s.enrollmentNo}</td>
                      <td style={{ padding: "8px 10px" }}>
                        <span style={{ background: s.hasVoted ? "#eff6ff" : "#fefce8", 
                          color: s.hasVoted ? "#1e40af" : "#854d0e", padding: "2px 8px",
                           borderRadius: "99px", fontSize: "0.78rem" }}>
                          {s.hasVoted ? "Voted" : "Pending"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Settings;