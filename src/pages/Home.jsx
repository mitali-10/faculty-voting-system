import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://faculty-voting-backend.onrender.com";

function Home() {
  const navigate = useNavigate();
  const [role, setRole] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [electionStatus, setElectionStatus] = useState(null);

  useEffect(() => {
    const savedRole = localStorage.getItem("role");
    if (!savedRole) { navigate("/"); return; }
    setRole(savedRole);

    try {
      if (savedRole === "student") {
        const s = localStorage.getItem("student");
        if (!s || s === "undefined") { navigate("/"); return; }
        const parsed = JSON.parse(s);
        setStudentData(parsed);

        // Backend se fresh data lo
        fetch(`${API}/api/students/all`)
          .then(r => r.json())
          .then(students => {
            const arr = Array.isArray(students) ? students : [];
            const fresh = arr.find(st => st.enrollmentNo === parsed.enrollmentNo);
            if (fresh) {
              setStudentData(fresh);
              localStorage.setItem("student", JSON.stringify(fresh));
            }
          }).catch(() => {});

        fetch(`${API}/api/election/check`)
          .then(r => r.json())
          .then(d => setElectionStatus(d))
          .catch(() => setElectionStatus({ allowed: true }));
      }
      if (savedRole === "faculty") {
        const f = localStorage.getItem("faculty");
        if (!f || f === "undefined") { navigate("/"); return; }
      }
    } catch { localStorage.clear(); navigate("/"); }
  }, [navigate]);

  const handleVote = () => navigate("/vote");
  const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>
      {/* Navbar */}
      <div style={{ background: "#1e293b", padding: "13px 28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "white", fontWeight: "600", fontSize: "1rem" }}>Faculty Voting System</span>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {role === "student" && !studentData?.hasVoted && (
            <button onClick={handleVote}
              style={{ padding: "6px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.88rem", fontWeight: "600" }}>
              Vote Now
            </button>
          )}
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

      <div style={{ maxWidth: "720px", margin: "0 auto", padding: "28px 20px" }}>

        {/* Banner */}
        <div style={{ background: "linear-gradient(135deg, #1e293b, #334155)", borderRadius: "14px", padding: "28px 32px", marginBottom: "20px", color: "white" }}>
          <div style={{ fontSize: "0.78rem", color: "#94a3b8", marginBottom: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>CSE Department</div>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.4rem" }}>
            Welcome, {studentData?.name || studentData?.enrollmentNo || "User"}
          </h2>
          <p style={{ color: "#94a3b8", margin: 0, fontSize: "0.88rem" }}>Faculty Voting System Portal</p>
        </div>

        {/* Student Profile */}
        {role === "student" && studentData && (
          <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px 24px", marginBottom: "14px" }}>
            <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "14px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>My Profile</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "2px" }}>Name</div>
                <div style={{ fontWeight: "600", color: "#111827" }}>{studentData.name || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "2px" }}>Enrollment No</div>
                <div style={{ fontWeight: "600", color: "#111827" }}>{studentData.enrollmentNo}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "2px" }}>Email</div>
                <div style={{ fontWeight: "600", color: "#111827" }}>{studentData.email || "—"}</div>
              </div>
              <div>
                <div style={{ fontSize: "0.75rem", color: "#9ca3af", marginBottom: "2px" }}>Vote Status</div>
                <span style={{
                  background: studentData.hasVoted ? "#eff6ff" : "#fefce8",
                  color: studentData.hasVoted ? "#1e40af" : "#854d0e",
                  padding: "3px 12px", borderRadius: "99px", fontSize: "0.82rem", fontWeight: "600"
                }}>
                  {studentData.hasVoted ? "✓ Voted" : "Pending"}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Election Status */}
        {role === "student" && studentData?.hasVoted ? (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", borderRadius: "10px", padding: "14px 18px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ fontWeight: "600", color: "#1e40af" }}>Aapne vote de diya hai!</div>
            <button onClick={() => navigate("/result")}
              style={{ padding: "7px 16px", background: "#2563eb", color: "white", border: "none", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}>
              Result Dekho
            </button>
          </div>
        ) : role === "student" && electionStatus && (
          !electionStatus.allowed ? (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "10px", padding: "14px 18px", marginBottom: "14px" }}>
              <div style={{ fontWeight: "600", color: "#991b1b", marginBottom: "4px" }}>Voting Available Nahi Hai</div>
              <div style={{ color: "#b91c1c", fontSize: "0.85rem" }}>{electionStatus.reason}</div>
              {electionStatus.startTime && (
                <div style={{ color: "#991b1b", fontSize: "0.82rem", marginTop: "4px" }}>Shuru hogi: <strong>{fmt(electionStatus.startTime)}</strong></div>
              )}
            </div>
          ) : (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "10px", padding: "14px 18px", marginBottom: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "600", color: "#166534" }}>Voting Chal Rahi Hai!</div>
                {electionStatus.endTime && (
                  <div style={{ color: "#15803d", fontSize: "0.82rem", marginTop: "2px" }}>Band hogi: <strong>{fmt(electionStatus.endTime)}</strong></div>
                )}
              </div>
              <button onClick={handleVote}
                style={{ padding: "8px 20px", background: "#16a34a", color: "white", border: "none", borderRadius: "7px", cursor: "pointer", fontWeight: "600", fontSize: "0.88rem" }}>
                Vote Karo
              </button>
            </div>
          )
        )}

        {/* Info Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          {[
            { title: "CSE Department", desc: "Computer Science & Engineering department skilled developers, researchers aur innovators produce karta hai." },
            { title: "About Faculty", desc: "Hamare professors vast knowledge ke saath quality education aur research opportunities provide karte hain." },
            { title: "Subjects & Labs", desc: "Algorithms, OS, DBMS, AI aur aur bhi subjects modern labs ke saath." },
            { title: "Voting Process", desc: "Apni pasand ke faculty ko vote do aur department representative choose karo." }
          ].map(c => (
            <div key={c.title} style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontWeight: "600", color: "#111827", marginBottom: "6px", fontSize: "0.9rem" }}>{c.title}</div>
              <div style={{ color: "#6b7280", fontSize: "0.82rem", lineHeight: 1.6 }}>{c.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Home;
