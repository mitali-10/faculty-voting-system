import { useState, useEffect } from "react";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";

const API = "https://faculty-voting-backend.onrender.com";
const EMAILJS_SERVICE_ID = "service_cit51mn";
const EMAILJS_TEMPLATE_ID_VOTE = "template_vote_confirm"; // alag template vote confirmation ke liye
const EMAILJS_PUBLIC_KEY = "W0z3JWrp38ZyyQWeN";

function TimeoutScreen({ reason, startTime, endTime }) {
  const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";

  if (reason === "voting_not_started") {
    return (
      <div style={{ background: "#f9fafb", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "48px 36px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>⏳</div>
          <h2 style={{ color: "#111827", marginBottom: "8px", fontSize: "1.2rem" }}>Voting Abhi Shuru Nahi Hui</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "20px", lineHeight: 1.6 }}>
            Voting ka samay abhi nahi aaya hai.
          </p>
          {startTime && (
            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px", color: "#166534", fontSize: "0.88rem" }}>
              Voting shuru hogi: <strong>{fmt(startTime)}</strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (reason === "voting_ended") {
    return (
      <div style={{ background: "#f9fafb", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "48px 36px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
          <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🔒</div>
          <h2 style={{ color: "#111827", marginBottom: "8px", fontSize: "1.2rem" }}>Voting Band Ho Gayi</h2>
          <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "20px", lineHeight: 1.6 }}>
            Voting ka samay khatam ho gaya hai. Ab aap vote nahi de sakte.
          </p>
          {endTime && (
            <div style={{ background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "12px", color: "#991b1b", fontSize: "0.88rem" }}>
              Voting band hui: <strong>{fmt(endTime)}</strong>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Generic inactive
  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "48px 36px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>🚫</div>
        <h2 style={{ color: "#111827", marginBottom: "8px", fontSize: "1.2rem" }}>Voting Active Nahi Hai</h2>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", lineHeight: 1.6 }}>
          Abhi voting allowed nahi hai. Admin se contact karein.
        </p>
      </div>
    </div>
  );
}

function Vote() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [electionStatus, setElectionStatus] = useState(null); // null=checking, obj=result

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student"));
    if (!student) { navigate("/"); return; }
    if (student.hasVoted === true) { navigate("/result"); return; }
    setStudentData(student);

    // Check election status first
    Promise.all([
      fetch(`${API}/api/election/check`).then(r => r.json()),
      fetch(`${API}/api/results`).then(r => r.json())
    ]).then(([status, candidatesData]) => {
      setElectionStatus(status);
      setCandidates(candidatesData);
      setLoading(false);
    }).catch(() => {
      setElectionStatus({ open: false, reason: "Server se connect nahi ho pa raha" });
      setLoading(false);
    });
  }, [navigate]);

  const handleSubmit = async () => {
    if (!selected) { alert("Pehle candidate choose karein!"); return; }

    // Re-check status before submitting
    try {
      const statusRes = await fetch(`${API}/api/election/check`);
      const status = await statusRes.json();
      if (!status.allowed) {
        setElectionStatus(status);
        return;
      }
    } catch { alert("Server error. Dobara try karein."); return; }

    try {
      const res = await fetch(`${API}/api/vote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidateId: selected, studentId: studentData._id })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem("student", JSON.stringify({ ...studentData, hasVoted: true }));
        // Send vote confirmation email
        if (studentData.email) {
          const chosenCandidate = candidates.find(c => c.id === selected);
          try {
            await emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID_VOTE, {
              to_email: studentData.email,
              to_name: studentData.name || studentData.enrollmentNo,
              enrollment_no: studentData.enrollmentNo,
              candidate_name: chosenCandidate?.name || "Selected Candidate",
              vote_time: new Date().toLocaleString("en-IN")
            }, EMAILJS_PUBLIC_KEY);
          } catch { console.log("Email send failed — vote still recorded"); }
        }
        navigate("/success");
      } else {
        alert(data.message || "Already voted!");
        navigate("/result");
      }
    } catch { alert("Server error. Please try again."); }
  };

  const getPhoto = (c) => c.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=120&background=2563eb&color=fff&rounded=true`;

  if (loading) {
    return (
      <div style={{ background: "#f9fafb", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <p style={{ color: "#6b7280" }}>Loading...</p>
      </div>
    );
  }

  // If voting not open — show timeout screen
  if (electionStatus && !electionStatus.allowed) {
    const reason = electionStatus.reason?.includes("shuru nahi") ? "voting_not_started"
      : electionStatus.reason?.includes("khatam") ? "voting_ended"
      : "inactive";
    return <TimeoutScreen reason={reason} startTime={electionStatus.startTime} endTime={electionStatus.endTime} />;
  }

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: "40px 20px" }}>
      <h2 style={{ textAlign: "center", marginBottom: "8px" }}>Faculty Voting Panel</h2>
      <p style={{ textAlign: "center", color: "#64748b", marginBottom: "30px", fontSize: "0.9rem" }}>
        Apna candidate choose karein aur vote submit karein
      </p>

      {candidates.length === 0 ? (
        <p style={{ textAlign: "center", color: "#94a3b8" }}>No candidates available.</p>
      ) : (
        <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
          {candidates.map((c) => (
            <div key={c._id} onClick={() => setSelected(c.id)}
              style={{
                background: "white", width: "210px", padding: "24px 20px",
                borderRadius: "14px",
                boxShadow: selected === c.id ? "0 6px 20px rgba(37,99,235,0.2)" : "0 2px 10px rgba(0,0,0,0.08)",
                textAlign: "center", cursor: "pointer",
                border: selected === c.id ? "3px solid #2563eb" : "2px solid transparent",
                transition: "all 0.2s", transform: selected === c.id ? "scale(1.03)" : "scale(1)"
              }}
            >
              <img src={getPhoto(c)} alt={c.name}
                style={{ width: "100px", height: "100px", borderRadius: "50%", marginBottom: "14px", objectFit: "cover", border: selected === c.id ? "3px solid #2563eb" : "3px solid #e2e8f0" }}
              />
              <h3 style={{ margin: "0 0 4px", fontSize: "1rem", color: "#1e293b" }}>{c.name}</h3>
              {c.qualification && (
                <div style={{ color: "#7c3aed", fontSize: "0.8rem", fontWeight: "600", marginBottom: "4px" }}>{c.qualification}</div>
              )}
              <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "12px" }}>{c.subject}</div>
              <div style={{
                padding: "5px 14px", borderRadius: "99px", display: "inline-block",
                background: selected === c.id ? "#2563eb" : "#f1f5f9",
                color: selected === c.id ? "white" : "#64748b",
                fontSize: "0.82rem", fontWeight: "600"
              }}>
                {selected === c.id ? "Selected" : "Select"}
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ textAlign: "center", marginTop: "40px" }}>
        <button onClick={handleSubmit}
          style={{ background: selected ? "#2563eb" : "#94a3b8", padding: "14px 44px", fontSize: "1rem", borderRadius: "10px", border: "none", cursor: selected ? "pointer" : "not-allowed", fontWeight: "600", color: "white", transition: "0.2s" }}>
          Submit Vote
        </button>
        {!selected && <p style={{ color: "#94a3b8", marginTop: "8px", fontSize: "0.85rem" }}>Pehle candidate select karein</p>}
      </div>
    </div>
  );
}

export default Vote;
