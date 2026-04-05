import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://faculty-voting-backend.onrender.com";

function Result() {
  const [candidates, setCandidates] = useState([]);
  const [winner, setWinner] = useState(null);
  const [totalVotes, setTotalVotes] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (!role) { navigate("/"); return; }
    if (role === "student") {
      const studentDataString = localStorage.getItem("student");
      if (!studentDataString) { navigate("/"); return; }
      const studentData = JSON.parse(studentDataString);
      if (!studentData?.hasVoted) {
        alert("Pehle vote dijiye, fir result dekhiye.");
        navigate("/home"); return;
      }
    }
    // candidate role can always see results
    fetch(`${API}/api/results`)
      .then(res => res.json())
      .then(data => {
        const sorted = [...data].sort((a, b) => b.votes - a.votes);
        setCandidates(sorted);
        const total = data.reduce((sum, c) => sum + (c.votes || 0), 0);
        setTotalVotes(total);
      });
  }, [navigate]);

  const handleShowWinner = () => {
    if (candidates.length === 0) return;
    const maxVotes = Math.max(...candidates.map(c => c.votes));
    setWinner(candidates.filter(c => c.votes === maxVotes));
    setShowModal(true);
  };

  const getPhoto = (c) =>
    c.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=120&background=374151&color=fff&rounded=true`;

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", padding: "30px 20px" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto" }}>

        {/* Navbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
          <div>
            <h2 style={{ margin: 0, color: "#111827" }}>Voting Result</h2>
            <p style={{ margin: "4px 0 0", color: "#6b7280", fontSize: "0.88rem" }}>Total Votes: {totalVotes}</p>
          </div>
          <div style={{ display: "flex", gap: "8px" }}>
            <button onClick={() => navigate("/home")}
              style={{ padding: "7px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>
              Home
            </button>
            <button onClick={() => navigate("/")}
              style={{ padding: "7px 16px", borderRadius: "6px", border: "1px solid #d1d5db", background: "white", cursor: "pointer" }}>
              Logout
            </button>
          </div>
        </div>

        {/* Candidate Cards */}
        {candidates.length === 0 ? (
          <p style={{ color: "#9ca3af", textAlign: "center" }}>No results yet.</p>
        ) : (
          candidates.map((c, index) => {
            const percentage = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
            return (
              <div key={c._id} style={{
                background: "white",
                border: index === 0 ? "2px solid #2563eb" : "1px solid #e5e7eb",
                borderRadius: "12px", padding: "18px 20px",
                marginBottom: "12px",
                display: "flex", alignItems: "center", gap: "16px"
              }}>
                {/* Rank Number */}
                <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#6b7280", minWidth: "28px", textAlign: "center" }}>
                  {index + 1}
                </div>

                {/* Photo */}
                <img src={getPhoto(c)} alt={c.name}
                  style={{ width: "62px", height: "62px", borderRadius: "50%", objectFit: "cover", border: "2px solid #e5e7eb", flexShrink: 0 }}
                />

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <div>
                      <div style={{ fontWeight: "600", fontSize: "1rem", color: "#111827" }}>{c.name}</div>
                      {c.qualification && (
                        <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>{c.qualification}</div>
                      )}
                      <div style={{ color: "#6b7280", fontSize: "0.82rem" }}>{c.subject || c.department}</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontWeight: "700", fontSize: "1.2rem", color: "#111827" }}>{c.votes}</div>
                      <div style={{ color: "#9ca3af", fontSize: "0.8rem" }}>{percentage}%</div>
                    </div>
                  </div>
                  {/* Progress Bar */}
                  <div style={{ background: "#e5e7eb", borderRadius: "99px", height: "6px" }}>
                    <div style={{
                      background: index === 0 ? "#2563eb" : "#9ca3af",
                      height: "100%", borderRadius: "99px",
                      width: `${percentage}%`, transition: "width 1s ease"
                    }} />
                  </div>
                </div>
              </div>
            );
          })
        )}

        {/* Show Winner Button */}
        <button onClick={handleShowWinner}
          style={{ width: "100%", marginTop: "12px", padding: "12px", background: "#1e293b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
          Show Winner
        </button>

      </div>

      {/* Winner Modal */}
      {showModal && winner && winner.length > 0 && (
        <div style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "20px" }}>
          <div style={{ background: "white", borderRadius: "16px", maxWidth: "400px", width: "100%", overflow: "hidden" }}>

            {/* Header */}
            <div style={{ background: "#1e293b", padding: "20px 24px", textAlign: "center", color: "white" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: "700" }}>Winner</div>
              <div style={{ fontSize: "0.85rem", color: "#94a3b8", marginTop: "2px" }}>CSE Department Faculty Election</div>
            </div>

            {winner.map((w) => (
              <div key={w._id} style={{ padding: "28px 24px", textAlign: "center" }}>

                {/* Photo */}
                <img src={getPhoto(w)} alt={w.name}
                  style={{ width: "110px", height: "110px", borderRadius: "50%", objectFit: "cover", border: "3px solid #2563eb", marginBottom: "16px" }}
                />

                {/* Name */}
                <div style={{ fontSize: "1.4rem", fontWeight: "700", color: "#111827", marginBottom: "4px" }}>
                  {w.name}
                </div>

                {w.qualification && (
                  <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "2px" }}>{w.qualification}</div>
                )}

                <div style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "20px" }}>
                  {w.subject || w.department}
                </div>

                {/* Vote Info */}
                <div style={{ background: "#f3f4f6", borderRadius: "10px", padding: "16px", marginBottom: "20px" }}>
                  <div style={{ fontSize: "2rem", fontWeight: "800", color: "#111827" }}>{w.votes}</div>
                  <div style={{ color: "#6b7280", fontSize: "0.85rem" }}>
                    votes — {totalVotes > 0 ? ((w.votes / totalVotes) * 100).toFixed(1) : 0}% of total
                  </div>
                </div>

                <div style={{ color: "#6b7280", fontSize: "0.85rem", marginBottom: "20px" }}>
                  Congratulations! You have been elected as the Faculty Representative of CSE Department.
                </div>

                <button onClick={() => setShowModal(false)}
                  style={{ width: "100%", padding: "11px", background: "#1e293b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600" }}>
                  Close
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Result;