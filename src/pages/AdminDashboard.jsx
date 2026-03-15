import { useState } from "react";
import AdminHome from "./AdminHome";
import StudentManagement from "./StudentManagement";
import VotingManagement from "./VotingManagement";
import Settings from "./Settings";
import Result from "./Result";

function AdminDashboard() {
  const [activePage, setActivePage] = useState("home");

  const renderPage = () => {
    switch (activePage) {
      case "students": return <StudentManagement />;
      case "voting": return <VotingManagement />;
      case "settings": return <Settings />;
      case "result": return <Result />;
      default: return <AdminHome />;
    }
  };

  const sideItem = (page, label) => (
    <p onClick={() => setActivePage(page)}
      style={{ cursor: "pointer", padding: "8px 10px", borderRadius: "6px", marginBottom: "4px", background: activePage === page ? "rgba(255,255,255,0.1)" : "transparent", color: activePage === page ? "white" : "#94a3b8", fontSize: "0.9rem" }}>
      {label}
    </p>
  );

  return (
    <div>
      {/* Navbar */}
      <div style={{ background: "#0f172a", color: "white", padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 style={{ margin: 0, fontSize: "1.1rem" }}>CSE Admin Panel</h2>
        <div>
          <button onClick={() => setActivePage("home")}
            style={{ background: "transparent", color: "white", border: "none", cursor: "pointer", padding: "6px 14px", fontSize: "0.9rem" }}>
            Home
          </button>
          <button onClick={() => setActivePage("result")}
            style={{ background: "transparent", color: "white", border: "none", cursor: "pointer", padding: "6px 14px", fontSize: "0.9rem" }}>
            Result
          </button>
          <button onClick={() => { localStorage.clear(); window.location.href = "/"; }}
            style={{ background: "transparent", color: "white", border: "none", cursor: "pointer", padding: "6px 14px", fontSize: "0.9rem" }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ display: "flex" }}>
        {/* Sidebar */}
        <div style={{ width: "220px", minHeight: "100vh", background: "#1e293b", color: "white", padding: "20px" }}>
          <h3 style={{ color: "#94a3b8", fontSize: "0.75rem", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "16px" }}>Dashboard</h3>
          {sideItem("students", "Student Management")}
          {sideItem("voting", "Voting Management")}
          {sideItem("settings", "Settings")}
        </div>

        {/* Main Content */}
        <div style={{ flex: 1, padding: "20px", background: "#f9fafb", minHeight: "100vh" }}>
          {renderPage()}
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;