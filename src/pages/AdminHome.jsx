import { useEffect, useState } from "react";

const API = "https://faculty-voting-backend.onrender.com";

function DonutChart({ voted, total }) {
  const pct = total > 0 ? (voted / total) * 100 : 0;
  const r = 54, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (pct / 100) * circ;

  return (
    <svg width="128" height="128" viewBox="0 0 128 128">
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e5e7eb" strokeWidth="14" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#2563eb" strokeWidth="14"
        strokeDasharray={`${dash} ${circ}`} strokeDashoffset={circ / 4}
        strokeLinecap="round" style={{ transition: "stroke-dasharray 1s ease" }} />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="18" fontWeight="700" fill="#111827">{Math.round(pct)}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="#6b7280">Voted</text>
    </svg>
  );
}

function BarChart({ candidates, totalVotes }) {
  if (!candidates.length) return null;
  const max = Math.max(...candidates.map(c => c.votes), 1);
  const colors = ["#2563eb", "#7c3aed", "#059669", "#dc2626", "#d97706"];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
      {candidates.map((c, i) => {
        const pct = totalVotes > 0 ? ((c.votes / totalVotes) * 100).toFixed(1) : 0;
        const barW = max > 0 ? (c.votes / max) * 100 : 0;
        return (
          <div key={c._id}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
              <span style={{ fontSize: "0.82rem", color: "#374151", fontWeight: "500" }}>{c.name}</span>
              <span style={{ fontSize: "0.82rem", color: "#6b7280" }}>{c.votes} votes ({pct}%)</span>
            </div>
            <div style={{ background: "#f3f4f6", borderRadius: "99px", height: "10px" }}>
              <div style={{ background: colors[i % colors.length], height: "100%", borderRadius: "99px", width: `${barW}%`, transition: "width 1s ease" }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AdminHome() {
  const [stats, setStats] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [totalVotes, setTotalVotes] = useState(0);
  const [electionStatus, setElectionStatus] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchAll = async () => {
    try {
      const [statsRes, resultsRes, statusRes] = await Promise.all([
        fetch(`${API}/api/admin/stats`),
        fetch(`${API}/api/results`),
        fetch(`${API}/api/election/check`)
      ]);
      const statsData = await statsRes.json();
      const resultsData = await resultsRes.json();
      const statusData = await statusRes.json();
      if (statsData.success) setStats(statsData.stats);
      const sorted = [...resultsData].sort((a, b) => b.votes - a.votes);
      setCandidates(sorted);
      setTotalVotes(resultsData.reduce((s, c) => s + (c.votes || 0), 0));
      setElectionStatus(statusData);
      setLastUpdated(new Date().toLocaleTimeString("en-IN"));
    } catch { console.error("Fetch error"); }
  };

  useEffect(() => {
    fetchAll();
    const interval = setInterval(fetchAll, 30000); // auto refresh every 30 sec
    return () => clearInterval(interval);
  }, []);

  const getPhoto = (c) => c.photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&size=60&background=374151&color=fff&rounded=true`;

  const maxVotes = candidates.length > 0 ? candidates[0].votes : 0;
  const leaders = candidates.filter(c => c.votes === maxVotes && maxVotes > 0);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
        <div>
          <h2 style={{ margin: 0, color: "#111827" }}>Dashboard</h2>
          <p style={{ margin: "2px 0 0", color: "#6b7280", fontSize: "0.82rem" }}>
            CSE Department Faculty Election
            {lastUpdated && <span style={{ marginLeft: "10px" }}>• Last updated: {lastUpdated}</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {electionStatus && (
            <span style={{ padding: "4px 12px", borderRadius: "99px", fontSize: "0.78rem", fontWeight: "600",
              background: electionStatus.allowed ? "#f0fdf4" : "#fef2f2",
              color: electionStatus.allowed ? "#166534" : "#991b1b",
              border: electionStatus.allowed ? "1px solid #bbf7d0" : "1px solid #fecaca"
            }}>
              {electionStatus.allowed ? "Voting Active" : "Voting Band"}
            </span>
          )}
          <button onClick={fetchAll}
            style={{ padding: "7px 14px", background: "white", border: "1px solid #d1d5db", borderRadius: "6px", cursor: "pointer", fontSize: "0.85rem" }}>
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "12px", marginBottom: "20px" }}>
          {[
            { label: "Total Students", value: stats.totalStudents, color: "#2563eb", bg: "#eff6ff" },
            { label: "Voted", value: stats.totalVoted, color: "#16a34a", bg: "#f0fdf4" },
            { label: "Not Voted", value: stats.totalNotVoted, color: "#d97706", bg: "#fffbeb" },
            { label: "Candidates", value: candidates.length, color: "#7c3aed", bg: "#f5f3ff" },
          ].map(s => (
            <div key={s.label} style={{ background: "white", border: "1px solid #e5e7eb",
             borderRadius: "10px", padding: "16px 18px" }}>
              <div style={{ fontSize: "2rem", fontWeight: "800", color: s.color }}>{s.value}</div>
              <div style={{ fontSize: "0.78rem", color: "#6b7280", marginTop: "2px" }}>{s.label}</div>
              <div style={{ marginTop: "8px", background: "#f3f4f6", borderRadius: "99px", height: "4px" }}>
                <div style={{ background: s.color, height: "100%", borderRadius: "99px",
                   width: stats.totalStudents > 0 ? `${Math.min((s.value / stats.totalStudents) * 100, 100)}%` : "0%", 
                   transition: "width 1s" }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "16px" }}>

        {/* Donut Chart */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontWeight: "600", color: "#111827", marginBottom: "16px", fontSize: "0.9rem" }}>Voter Turnout</div>
          <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
            <DonutChart voted={stats?.totalVoted || 0} total={stats?.totalStudents || 0} />
            <div>
              <div style={{ marginBottom: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2563eb" }} />
                  <span style={{ fontSize: "0.82rem", color: "#374151" }}>Voted: <strong>{stats?.totalVoted || 0}</strong></span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#e5e7eb" }} />
                  <span style={{ fontSize: "0.82rem", color: "#374151" }}>Pending: <strong>{stats?.totalNotVoted || 0}</strong></span>
                </div>
              </div>
              <div style={{ fontSize: "0.78rem", color: "#9ca3af" }}>Total: {stats?.totalStudents || 0} students</div>
            </div>
          </div>
        </div>

        {/* Leader */}
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
          <div style={{ fontWeight: "600", color: "#111827", marginBottom: "16px", fontSize: "0.9rem" }}>
            {leaders.length > 1 ? `Current Leaders (Tie — ${maxVotes} votes each)` : "Current Leader"}
          </div>
          {leaders.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {leaders.map(leader => (
                <div key={leader._id} style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                  <img src={getPhoto(leader)} alt={leader.name}
                    style={{ width: "52px", height: "52px", borderRadius: "50%", objectFit: "cover",
                     border: "3px solid #2563eb" }} />
                  <div>
                    <div style={{ fontWeight: "700", color: "#111827", fontSize: "0.95rem" }}>{leader.name}</div>
                    {leader.qualification && <div style={{ color: "#6b7280", fontSize: "0.78rem" }}>{leader.qualification}</div>}
                    <div style={{ color: "#6b7280", fontSize: "0.78rem" }}>{leader.subject || leader.department}</div>
                    <div style={{ fontWeight: "700", color: "#2563eb", marginTop: "2px", fontSize: "0.9rem" }}>
                      {leader.votes} votes
                      <span style={{ color: "#6b7280", fontWeight: "400", fontSize: "0.78rem", marginLeft: "6px" }}>
                        ({totalVotes > 0 ? ((leader.votes / totalVotes) * 100).toFixed(1) : 0}%)
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: "#9ca3af", fontSize: "0.88rem" }}>Koi votes nahi hain abhi.</p>
          )}
        </div>
      </div>

      {/* Bar Chart */}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "20px" }}>
        <div style={{ fontWeight: "600", color: "#111827", marginBottom: "16px", fontSize: "0.9rem" }}>
          Vote Distribution — All Candidates
        </div>
        {candidates.length > 0 ? (
          <BarChart candidates={candidates} totalVotes={totalVotes} />
        ) : (
          <p style={{ color: "#9ca3af", fontSize: "0.88rem" }}>No data yet.</p>
        )}
      </div>

    </div>
  );
}

export default AdminHome;