import { useNavigate } from "react-router-dom";

function Success() {
  const navigate = useNavigate();
  const studentData = JSON.parse(localStorage.getItem("student"));

  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh" }}>

      {/* Navbar */}
      <div style={{ background: "#1e293b", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ color: "white", fontWeight: "600", fontSize: "1rem" }}>Faculty Voting System</span>
        <div style={{ display: "flex", gap: "16px" }}>
          <button onClick={() => navigate("/home")}
            style={{ background: "transparent", color: "#cbd5e1", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
            Home
          </button>
          <button onClick={() => navigate("/result")}
            style={{ background: "transparent", color: "#cbd5e1", border: "none", cursor: "pointer", fontSize: "0.9rem" }}>
            Result
          </button>
          <button onClick={() => { localStorage.clear(); navigate("/"); }}
            style={{ background: "#334155", color: "white", border: "none", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "0.9rem" }}>
            Logout
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "80vh" }}>
        <div style={{ background: "white", padding: "44px 48px", borderRadius: "12px", border: "1px solid #e5e7eb", textAlign: "center", width: "380px" }}>

          <div style={{ width: "56px", height: "56px", background: "#f0fdf4", border: "2px solid #bbf7d0", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px", fontSize: "1.5rem" }}>
            ✓
          </div>

          <h2 style={{ margin: "0 0 10px", color: "#111827", fontWeight: "700" }}>Vote Submitted</h2>

          <p style={{ color: "#6b7280", fontSize: "0.95rem", marginBottom: "8px" }}>
            Thank you, <strong style={{ color: "#111827" }}>{studentData?.name || studentData?.enrollmentNo}</strong>
          </p>
          <p style={{ color: "#9ca3af", fontSize: "0.88rem", marginBottom: "28px" }}>
            Your vote has been recorded successfully.
          </p>

          <button onClick={() => navigate("/result")}
            style={{ width: "100%", padding: "11px", background: "#1e293b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.95rem" }}>
            View Results
          </button>

        </div>
      </div>

    </div>
  );
}

export default Success;
