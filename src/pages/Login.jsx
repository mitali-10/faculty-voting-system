import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API = "https://faculty-voting-backend.onrender.com";

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600;700&display=swap');

  * { box-sizing: border-box; margin: 0; padding: 0; }

  .login-root {
    font-family: 'Sora', sans-serif;
    min-height: 100vh;
    background: #0f1117;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    position: relative;
    overflow: hidden;
  }

  .bg-glow {
    position: fixed;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.18;
    pointer-events: none;
  }
  .bg-glow-1 { width: 500px; height: 500px; background: #4f46e5; top: -100px; left: -100px; }
  .bg-glow-2 { width: 400px; height: 400px; background: #0ea5e9; bottom: -80px; right: -80px; }

  .card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 20px;
    padding: 40px 36px;
    width: 100%;
    max-width: 400px;
    backdrop-filter: blur(20px);
    position: relative;
    z-index: 1;
    animation: fadeUp 0.5s ease both;
  }

  @keyframes fadeUp {
    from { opacity: 0; transform: translateY(24px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .logo-row {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 28px;
  }
  .logo-icon {
    width: 36px; height: 36px;
    background: linear-gradient(135deg, #4f46e5, #0ea5e9);
    border-radius: 10px;
    display: flex; align-items: center; justify-content: center;
    font-size: 18px;
  }
  .logo-text { color: #fff; font-size: 1rem; font-weight: 600; letter-spacing: -0.3px; }
  .logo-sub { color: #64748b; font-size: 0.75rem; margin-top: 1px; }

  .screen-title {
    color: #f1f5f9;
    font-size: 1.25rem;
    font-weight: 700;
    margin-bottom: 6px;
    letter-spacing: -0.4px;
  }
  .screen-sub {
    color: #64748b;
    font-size: 0.82rem;
    margin-bottom: 24px;
    line-height: 1.5;
  }

  .role-tabs {
    display: flex;
    background: rgba(255,255,255,0.05);
    border-radius: 10px;
    padding: 4px;
    gap: 3px;
    margin-bottom: 22px;
  }
  .role-tab {
    flex: 1; padding: 8px 6px;
    border: none; border-radius: 7px;
    cursor: pointer; font-size: 0.82rem;
    font-family: 'Sora', sans-serif;
    font-weight: 500;
    transition: all 0.2s;
    background: transparent;
    color: #64748b;
  }
  .role-tab.active {
    background: linear-gradient(135deg, #4f46e5, #0ea5e9);
    color: white;
  }

  .field { margin-bottom: 16px; }
  .field label { display: block; font-size: 0.78rem; color: #94a3b8; margin-bottom: 6px; font-weight: 500; letter-spacing: 0.3px; text-transform: uppercase; }
  .field input {
    width: 100%; padding: 11px 14px;
    background: rgba(255,255,255,0.06);
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px;
    color: #f1f5f9; font-size: 0.9rem;
    font-family: 'Sora', sans-serif;
    outline: none; transition: border 0.2s;
  }
  .field input:focus { border-color: #4f46e5; }
  .field input::placeholder { color: #475569; }

  .forgot-link {
    background: none; border: none;
    color: #6366f1; font-size: 0.8rem;
    cursor: pointer; padding: 0;
    font-family: 'Sora', sans-serif;
    float: right; margin-top: -10px; margin-bottom: 20px;
  }
  .forgot-link:hover { color: #818cf8; text-decoration: underline; }

  .btn-primary {
    width: 100%; padding: 12px;
    background: linear-gradient(135deg, #4f46e5, #0ea5e9);
    color: white; border: none; border-radius: 10px;
    cursor: pointer; font-weight: 600; font-size: 0.92rem;
    font-family: 'Sora', sans-serif;
    transition: opacity 0.2s, transform 0.1s;
    margin-top: 4px;
  }
  .btn-primary:hover { opacity: 0.9; }
  .btn-primary:active { transform: scale(0.98); }
  .btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

  .btn-ghost {
    background: none; border: none;
    color: #64748b; font-size: 0.82rem;
    cursor: pointer; padding: 0;
    font-family: 'Sora', sans-serif;
    display: flex; align-items: center; gap: 4px;
    margin-bottom: 22px;
  }
  .btn-ghost:hover { color: #94a3b8; }

  .btn-secondary {
    width: 100%; padding: 11px;
    background: rgba(255,255,255,0.06);
    color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1);
    border-radius: 10px; cursor: pointer; font-weight: 500;
    font-size: 0.88rem; font-family: 'Sora', sans-serif;
    transition: background 0.2s; margin-top: 8px;
  }
  .btn-secondary:hover { background: rgba(255,255,255,0.1); }

  .msg {
    padding: 10px 14px; border-radius: 8px;
    margin-bottom: 16px; font-size: 0.83rem; line-height: 1.4;
  }
  .msg.success { background: rgba(16,185,129,0.1); color: #6ee7b7; border: 1px solid rgba(16,185,129,0.2); }
  .msg.error { background: rgba(239,68,68,0.1); color: #fca5a5; border: 1px solid rgba(239,68,68,0.2); }

  .choice-card {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 12px; padding: 16px;
    cursor: pointer; margin-bottom: 10px;
    transition: border 0.2s, background 0.2s;
  }
  .choice-card:hover { border-color: #4f46e5; background: rgba(79,70,229,0.08); }
  .choice-title { color: #f1f5f9; font-size: 0.9rem; font-weight: 600; margin-bottom: 3px; }
  .choice-desc { color: #64748b; font-size: 0.78rem; }

  .info-box {
    background: rgba(255,255,255,0.04);
    border: 1px solid rgba(255,255,255,0.08);
    border-radius: 10px; padding: 14px;
    margin-bottom: 18px; font-size: 0.83rem; color: #94a3b8; line-height: 1.6;
  }

  .divider { height: 1px; background: rgba(255,255,255,0.07); margin: 18px 0; }

  .success-icon {
    width: 56px; height: 56px;
    background: rgba(16,185,129,0.15);
    border: 1px solid rgba(16,185,129,0.3);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 1.5rem; margin: 0 auto 18px;
  }
`;

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ text: "", type: "" });

  // screens: login | choice | change | request | done
  const [screen, setScreen] = useState("login");
  const [forgotRole, setForgotRole] = useState("student");
  const [forgotId, setForgotId] = useState("");
  const [oldPass, setOldPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [doneMsg, setDoneMsg] = useState("");
  // Admin forgot
  const [adminOtpSent, setAdminOtpSent] = useState(false);
  const [adminOtpInput, setAdminOtpInput] = useState("");
  const [adminNewPass, setAdminNewPass] = useState("");
  const [adminConfirmPass, setAdminConfirmPass] = useState("");
  const [adminForgotUser, setAdminForgotUser] = useState("");

  const showMsg = (text, type) => {
    setMsg({ text, type });
    setTimeout(() => setMsg({ text: "", type: "" }), 4000);
  };

  const goTo = (s) => { setMsg({ text: "", type: "" }); setScreen(s); };

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) { showMsg("ID aur password dono zaroori hain", "error"); return; }
    setLoading(true);
    try {
      if (role === "admin") {
        try {
          const res = await fetch(`${API}/api/admin-auth/login`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username: username.trim(), password: password.trim() })
          });
          const data = await res.json();
          if (data.success) {
            localStorage.setItem("role", "admin");
            navigate("/admin");
          } else showMsg(data.message || "Invalid credentials", "error");
        } catch {
          // Fallback if admin-auth route not available
          if (username === "AdminMitali" && password === "@Mitali10") {
            localStorage.setItem("role", "admin");
            navigate("/admin");
          } else showMsg("Invalid admin credentials", "error");
        }
        return;
      }
      if (role === "student") {
        const res = await fetch(`${API}/api/students/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ enrollmentNo: username.trim(), password: password.trim() })
        });
        const data = await res.json();
        if (data.success && data.student) {
          localStorage.setItem("role", "student");
          localStorage.setItem("student", JSON.stringify(data.student));
          navigate(data.student.hasVoted ? "/result" : "/home");
        } else showMsg(data.message || "Login failed", "error");
        return;
      }
      if (role === "candidate") {
        const res = await fetch(`${API}/api/admin/candidates/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ candidateLoginId: username.trim(), password: password.trim() })
        });
        const data = await res.json();
        if (data.success) {
          localStorage.setItem("role", "candidate");
          localStorage.setItem("candidate", JSON.stringify(data.candidate));
          navigate("/candidate-dashboard");
        } else showMsg(data.message || "Login failed", "error");
      }
    } catch { showMsg("Server se connect nahi ho pa raha", "error"); }
    finally { setLoading(false); }
  };

  const handleAdminSendOtp = async () => {
    if (!adminForgotUser.trim()) { showMsg("Admin username daalo", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin-auth/send-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminForgotUser.trim() })
      });
      const data = await res.json();
      if (data.success) {
        // Send OTP via EmailJS
        try {
          const emailjs = (await import("@emailjs/browser")).default;
          await emailjs.send("service_cit51mn", "template_ivx5de5", {
            to_email: data.email,
            to_name: "Admin",
            enrollment_no: adminForgotUser,
            password: data.otp,
            vote_link: "https://faculty-voting-system-mitali.vercel.app/"
          }, "W0z3JWrp38ZyyQWeN");
        } catch { console.log("Email send failed but OTP generated"); }
        setAdminOtpSent(true);
        showMsg("OTP aapki email par bhej di gayi hai!", "success");
      } else showMsg(data.message, "error");
    } catch { showMsg("Server error", "error"); }
    finally { setLoading(false); }
  };

  const handleAdminResetPass = async () => {
    if (!adminOtpInput.trim()) { showMsg("OTP daalo", "error"); return; }
    if (adminNewPass.length < 4) { showMsg("Password kam se kam 4 characters", "error"); return; }
    if (adminNewPass !== adminConfirmPass) { showMsg("Passwords match nahi kar rahe", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/admin-auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: adminForgotUser.trim(), otp: adminOtpInput.trim(), newPassword: adminNewPass })
      });
      const data = await res.json();
      if (data.success) {
        setDoneMsg("Admin password reset ho gaya! Naye password se login karein.");
        setAdminOtpSent(false); setAdminOtpInput(""); setAdminNewPass(""); setAdminConfirmPass(""); setAdminForgotUser("");
        goTo("done");
      } else showMsg(data.message, "error");
    } catch { showMsg("Server error", "error"); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async () => {
    if (!forgotId.trim()) { showMsg("ID daalna zaroori hai", "error"); return; }
    if (!oldPass.trim()) { showMsg("Purana password daalna zaroori hai", "error"); return; }
    if (newPass.length < 4) { showMsg("Naya password kam se kam 4 characters", "error"); return; }
    if (newPass !== confirmPass) { showMsg("Naya password aur confirm password alag hain", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/change-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: forgotId.trim(), userType: forgotRole, oldPassword: oldPass, newPassword: newPass })
      });
      const data = await res.json();
      if (data.success) { setDoneMsg("Password successfully change ho gaya! Ab login kar sakte hain."); goTo("done"); }
      else showMsg(data.message, "error");
    } catch { showMsg("Server error", "error"); }
    finally { setLoading(false); }
  };

  const handleForgotRequest = async () => {
    if (!forgotId.trim()) { showMsg("ID daalna zaroori hai", "error"); return; }
    setLoading(true);
    try {
      const res = await fetch(`${API}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: forgotId.trim(), userType: forgotRole })
      });
      const data = await res.json();
      if (data.success) { setDoneMsg("Request admin ke paas pahunch gayi. Admin jald hi aapka password reset karega."); goTo("done"); }
      else showMsg(data.message, "error");
    } catch { showMsg("Server error", "error"); }
    finally { setLoading(false); }
  };

  return (
    <>
      <style>{styles}</style>
      <div className="login-root">
        <div className="bg-glow bg-glow-1" />
        <div className="bg-glow bg-glow-2" />

        <div className="card">
          <div className="logo-row">
            <div className="logo-icon">🗳</div>
            <div>
              <div className="logo-text">Faculty Voting System</div>
              <div className="logo-sub">CSE Department</div>
            </div>
          </div>

          {msg.text && <div className={`msg ${msg.type}`}>{msg.text}</div>}

          {/* ===== LOGIN ===== */}
          {screen === "login" && (
            <>
              <div className="screen-title">Welcome back</div>
              <div className="screen-sub">Apna role select karein aur login karein</div>

              <div className="role-tabs">
                {["student", "candidate", "admin"].map(r => (
                  <button key={r} className={`role-tab ${role === r ? "active" : ""}`}
                    onClick={() => { setRole(r); setUsername(""); setPassword(""); setMsg({ text: "", type: "" }); }}
                    style={{ textTransform: "capitalize" }}>
                    {r === "student" ? "Student" : r === "candidate" ? "Candidate" : "Admin"}
                  </button>
                ))}
              </div>

              <div className="field">
                <label>{role === "student" ? "Enrollment No" : role === "candidate" ? "Candidate ID" : "Username"}</label>
                <input type="text"
                  placeholder={role === "student" ? "e.g. 0901CS211001" : role === "candidate" ? "e.g. CAN001" : "Admin username"}
                  value={username} onChange={e => setUsername(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleLogin()}
                />
              </div>

              <div className="field">
                <label>Password</label>
                <div style={{ position: "relative" }}>
                  <input type={showPass ? "text" : "password"} placeholder="Password daalo"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && handleLogin()}
                    style={{ paddingRight: "44px" }}
                  />
                  <button onClick={() => setShowPass(p => !p)}
                    style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#475569", fontSize: "1rem" }}>
                    {showPass ? "🙈" : "👁"}
                  </button>
                </div>
              </div>

              <button className="forgot-link" onClick={() => {
                if (role === "admin") { setAdminForgotUser(username); goTo("adminForgot"); }
                else { setForgotRole(role === "candidate" ? "candidate" : role); goTo("choice"); }
                setMsg({ text: "", type: "" });
              }}>
                Forgot password?
              </button>
              <div style={{ clear: "both" }} />

              <button className="btn-primary" onClick={handleLogin} disabled={loading}>
                {loading ? "Logging in..." : "Login →"}
              </button>
            </>
          )}

          {/* ===== FORGOT CHOICE ===== */}
          {screen === "choice" && (
            <>
              <button className="btn-ghost" onClick={() => goTo("login")}>← Wapas Login</button>
              <div className="screen-title">Password Reset</div>
              <div className="screen-sub">Apni situation choose karein</div>

              <div className="field">
                <label>Role</label>
                <div className="role-tabs" style={{ marginBottom: "0" }}>
                  {["student", "candidate"].map(r => (
                    <button key={r} className={`role-tab ${forgotRole === r ? "active" : ""}`}
                      onClick={() => setForgotRole(r)} style={{ textTransform: "capitalize" }}>
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              <div className="field" style={{ marginTop: "16px" }}>
                <label>{forgotRole === "student" ? "Enrollment No" : "Candidate ID"}</label>
                <input type="text" placeholder="Apna ID daalo"
                  value={forgotId} onChange={e => setForgotId(e.target.value)} />
              </div>

              <div className="divider" />

              <div className="choice-card" onClick={() => goTo("change")}>
                <div className="choice-title">Purana password yaad hai</div>
                <div className="choice-desc">Old password use karke naya set karein</div>
              </div>
              <div className="choice-card" onClick={() => goTo("request")}>
                <div className="choice-title">Purana password bhool gaya</div>
                <div className="choice-desc">Admin ko request bhejein — vo reset karega</div>
              </div>
            </>
          )}

          {/* ===== CHANGE PASSWORD ===== */}
          {screen === "change" && (
            <>
              <button className="btn-ghost" onClick={() => goTo("choice")}>← Wapas</button>
              <div className="screen-title">Password Change</div>
              <div className="screen-sub">Purana password verify karke naya set karein</div>

              <div className="info-box">
                <span style={{ color: "#6366f1" }}>{forgotRole === "student" ? "Enrollment" : "Faculty ID"}:</span> {forgotId || "—"}
              </div>

              <div className="field">
                <label>Old Password</label>
                <input type="password" placeholder="Purana password" value={oldPass} onChange={e => setOldPass(e.target.value)} />
              </div>
              <div className="field">
                <label>New Password</label>
                <input type="password" placeholder="Naya password (min 4 chars)" value={newPass} onChange={e => setNewPass(e.target.value)} />
              </div>
              <div className="field">
                <label>Confirm New Password</label>
                <input type="password" placeholder="Naya password dobara" value={confirmPass} onChange={e => setConfirmPass(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleChangePassword()} />
              </div>

              <button className="btn-primary" onClick={handleChangePassword} disabled={loading}>
                {loading ? "Saving..." : "Password Change Karo"}
              </button>
            </>
          )}

          {/* ===== ADMIN REQUEST ===== */}
          {screen === "request" && (
            <>
              <button className="btn-ghost" onClick={() => goTo("choice")}>← Wapas</button>
              <div className="screen-title">Admin Request</div>
              <div className="screen-sub">Admin aapka password reset karega aur email pe bhejega</div>

              <div className="info-box">
                <div><span style={{ color: "#6366f1" }}>Role:</span> <span style={{ textTransform: "capitalize" }}>{forgotRole}</span></div>
                <div><span style={{ color: "#6366f1" }}>{forgotRole === "student" ? "Enrollment No" : "Candidate ID"}:</span> {forgotId || "—"}</div>
              </div>

              <div style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: "20px", lineHeight: 1.6 }}>
                Yeh request admin ke Settings panel mein dikhegi. Admin aapka password reset karke email pe bhejega.
              </div>

              <button className="btn-primary" onClick={handleForgotRequest} disabled={loading}>
                {loading ? "Bhej raha hai..." : "Request Bhejo →"}
              </button>
            </>
          )}

          {/* ===== ADMIN FORGOT ===== */}
        {screen === "adminForgot" && (
          <>
            <button className="btn-ghost" onClick={() => { goTo("login"); setAdminOtpSent(false); }}>← Wapas Login</button>
            <div className="screen-title">Admin Password Reset</div>
            <div className="screen-sub">OTP aapki registered email par bheja jaayega</div>

            {!adminOtpSent ? (
              <>
                <div className="field">
                  <label>Admin Username</label>
                  <input type="text" placeholder="Admin username" value={adminForgotUser}
                    onChange={e => setAdminForgotUser(e.target.value)} className="field" style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#f1f5f9",fontSize:"0.9rem",fontFamily:"Sora,sans-serif",outline:"none"}} />
                </div>
                <button className="btn-primary" onClick={handleAdminSendOtp} disabled={loading} style={{marginTop:"8px"}}>
                  {loading ? "Bhej raha hai..." : "OTP Bhejo Email Par →"}
                </button>
              </>
            ) : (
              <>
                <div className="info-box">OTP aapki email par bhej di gayi hai.</div>
                <div className="field">
                  <label>OTP (6 digits)</label>
                  <input type="text" placeholder="Email par aaya OTP daalo" value={adminOtpInput}
                    onChange={e => setAdminOtpInput(e.target.value)}
                    style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#f1f5f9",fontSize:"0.9rem",fontFamily:"Sora,sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"14px"}} />
                </div>
                <div className="field">
                  <label>New Password</label>
                  <input type="password" placeholder="Naya password" value={adminNewPass}
                    onChange={e => setAdminNewPass(e.target.value)}
                    style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#f1f5f9",fontSize:"0.9rem",fontFamily:"Sora,sans-serif",outline:"none",boxSizing:"border-box",marginBottom:"14px"}} />
                </div>
                <div className="field" style={{marginBottom:"20px"}}>
                  <label>Confirm Password</label>
                  <input type="password" placeholder="Dobara naya password" value={adminConfirmPass}
                    onChange={e => setAdminConfirmPass(e.target.value)}
                    style={{width:"100%",padding:"11px 14px",background:"rgba(255,255,255,0.06)",border:"1px solid rgba(255,255,255,0.1)",borderRadius:"10px",color:"#f1f5f9",fontSize:"0.9rem",fontFamily:"Sora,sans-serif",outline:"none",boxSizing:"border-box"}} />
                </div>
                <button className="btn-primary" onClick={handleAdminResetPass} disabled={loading}>
                  {loading ? "Saving..." : "Password Reset Karo"}
                </button>
                <button className="btn-secondary" onClick={() => { setAdminOtpSent(false); setAdminOtpInput(""); }}>
                  OTP Dobara Bhejo
                </button>
              </>
            )}
          </>
        )}

        {/* ===== DONE ===== */}
          {screen === "done" && (
            <div style={{ textAlign: "center" }}>
              <div className="success-icon">✓</div>
              <div className="screen-title" style={{ textAlign: "center" }}>Ho gaya!</div>
              <div style={{ color: "#64748b", fontSize: "0.85rem", marginBottom: "24px", lineHeight: 1.6 }}>{doneMsg}</div>
              <button className="btn-primary" onClick={() => {
                setScreen("login"); setOldPass(""); setNewPass(""); setConfirmPass(""); setForgotId(""); setMsg({ text: "", type: "" });
              }}>
                Login Page par Jao →
              </button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}
