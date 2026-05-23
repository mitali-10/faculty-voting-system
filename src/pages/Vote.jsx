import { useState, useEffect, useRef } from "react";
import emailjs from "@emailjs/browser";
import { useNavigate } from "react-router-dom";

const API = "https://faculty-voting-backend.onrender.com";
const EMAILJS_SERVICE_ID = "service_cit51mn";
const EMAILJS_TEMPLATE_ID_VOTE = "template_vote_confirm";
const EMAILJS_PUBLIC_KEY = "W0z3JWrp38ZyyQWeN";

const FACE_API_CDN = "https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js";
const MODELS_URL = "https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights";

// ─── Timeout Screens ──────────────────────────────────────────────────────────
function TimeoutScreen({ reason, startTime, endTime }) {
  const fmt = (d) => d ? new Date(d).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" }) : "";
  const screens = {
    voting_not_started: { icon: "⏳", title: "Voting Abhi Shuru Nahi Hui", msg: "Voting ka samay abhi nahi aaya hai.", extra: startTime ? { bg: "#f0fdf4", border: "#bbf7d0", color: "#166534", text: `Voting shuru hogi: ${fmt(startTime)}` } : null },
    voting_ended:       { icon: "🔒", title: "Voting Band Ho Gayi",        msg: "Voting ka samay khatam ho gaya hai. Ab aap vote nahi de sakte.", extra: endTime ? { bg: "#fef2f2", border: "#fecaca", color: "#991b1b", text: `Voting band hui: ${fmt(endTime)}` } : null },
    inactive:           { icon: "🚫", title: "Voting Active Nahi Hai",     msg: "Abhi voting allowed nahi hai. Admin se contact karein.", extra: null },
  };
  const s = screens[reason] || screens.inactive;
  return (
    <div style={{ background: "#f9fafb", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: "12px", padding: "48px 36px", maxWidth: "400px", width: "100%", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>{s.icon}</div>
        <h2 style={{ color: "#111827", marginBottom: "8px", fontSize: "1.2rem" }}>{s.title}</h2>
        <p style={{ color: "#6b7280", fontSize: "0.9rem", marginBottom: "20px", lineHeight: 1.6 }}>{s.msg}</p>
        {s.extra && (
          <div style={{ background: s.extra.bg, border: `1px solid ${s.extra.border}`, borderRadius: "8px", padding: "12px", color: s.extra.color, fontSize: "0.88rem" }}>
            <strong>{s.extra.text}</strong>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Face Verification Screen ─────────────────────────────────────────────────
function FaceVerification({ studentData, onVerified }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [step, setStep] = useState("loading"); // loading | ready | scanning | verifying | failed | verified
  const [msg, setMsg] = useState("Face-api models load ho rahe hain...");
  const [failCount, setFailCount] = useState(0);
  const [faceApiLoaded, setFaceApiLoaded] = useState(false);

  // Load face-api.js
  useEffect(() => {
    if (window.faceapi) { setFaceApiLoaded(true); return; }
    const script = document.createElement("script");
    script.src = FACE_API_CDN;
    script.onload = () => setFaceApiLoaded(true);
    script.onerror = () => { setStep("failed"); setMsg("face-api.js load nahi hua. Internet check karein."); };
    document.head.appendChild(script);
  }, []);

  useEffect(() => {
    if (!faceApiLoaded) return;
    const fa = window.faceapi;
    Promise.all([
      fa.nets.tinyFaceDetector.loadFromUri(MODELS_URL),
      fa.nets.faceLandmark68Net.loadFromUri(MODELS_URL),
      fa.nets.faceRecognitionNet.loadFromUri(MODELS_URL),
    ]).then(() => {
      setStep("ready");
      setMsg("Camera start karein aur chehra seedha rakhein");
    }).catch(() => {
      setStep("failed");
      setMsg("Models load nahi hue. Internet check karein.");
    });
  }, [faceApiLoaded]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      streamRef.current = s;
      videoRef.current.srcObject = s;
      setStep("scanning");
      setMsg("Chehra oval ke andar rakho aur Verify dabao");
    } catch (err) {
      setStep("failed");
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        setMsg("❌ Camera permission deny ki gayi hai. Browser address bar mein 🔒 icon click karke Camera = Allow karo, phir page refresh karo.");
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        setMsg("❌ Koi camera nahi mila device mein. Webcam connected hai?");
      } else if (err.name === "NotReadableError") {
        setMsg("❌ Camera already kisi aur app ne use kar rakha hai. Baaki apps band karo aur retry karo.");
      } else if (window.location.protocol !== "https:" && window.location.hostname !== "localhost") {
        setMsg("❌ Camera sirf HTTPS ya localhost pe kaam karta hai. Site ka URL https:// hona chahiye.");
      } else {
        setMsg("❌ Camera nahi khula: " + err.message);
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
  };

  const verify = async () => {
    const fa = window.faceapi;
    if (!fa || !videoRef.current) return;
    setStep("verifying");
    setMsg("Chehra scan ho raha hai...");

    const detection = await fa.detectSingleFace(
      videoRef.current, new fa.TinyFaceDetectorOptions({ inputSize: 320, scoreThreshold: 0.5 })
    ).withFaceLandmarks().withFaceDescriptor();

    if (!detection) {
      setStep("scanning");
      setMsg("Chehra detect nahi hua. Seedhe camera ke saamne baitho aur dobara try karo.");
      return;
    }

    const descriptor = Array.from(detection.descriptor);
    try {
      const res = await fetch(`${API}/api/students/verify-face/${studentData.enrollmentNo}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ faceDescriptor: descriptor }),
      });
      const data = await res.json();
      if (data.success) {
        setStep("verified");
        setMsg("✅ Face verify ho gaya! Voting page khul raha hai...");
        stopCamera();
        setTimeout(() => onVerified(), 1200);
      } else {
        const newFail = failCount + 1;
        setFailCount(newFail);
        setStep("scanning");
        setMsg(`❌ ${data.message} (Attempt ${newFail}/3)`);
        if (newFail >= 3) {
          stopCamera();
          setStep("failed");
          setMsg("3 baar fail ho gaya. Admin se contact karein ya dobara login karein.");
        }
      }
    } catch {
      setStep("scanning");
      setMsg("Server error. Dobara try karein.");
    }
  };

  useEffect(() => () => stopCamera(), []);

  const borderColor = step === "verified" ? "#22c55e" : step === "failed" ? "#ef4444" : step === "verifying" ? "#f59e0b" : "#3b82f6";

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
      <div style={{ background: "white", borderRadius: "16px", padding: "32px", maxWidth: "420px", width: "100%", boxShadow: "0 4px 24px rgba(0,0,0,0.08)", textAlign: "center" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "20px" }}>
          <div style={{ fontSize: "2.2rem", marginBottom: "8px" }}>🔐</div>
          <h2 style={{ margin: "0 0 4px", fontSize: "1.15rem", color: "#1e293b" }}>Face Verification</h2>
          <p style={{ color: "#64748b", fontSize: "0.88rem", margin: 0 }}>
            Vote dene se pehle aapka chehra verify karna zaroori hai
          </p>
        </div>

        {/* Student Info */}
        <div style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px 14px", marginBottom: "18px", fontSize: "0.88rem", color: "#374151", textAlign: "left" }}>
          <strong>👤 {studentData.name || studentData.enrollmentNo}</strong>
          <span style={{ color: "#94a3b8", marginLeft: "8px" }}>{studentData.enrollmentNo}</span>
        </div>

        {/* Camera Box */}
        <div style={{ position: "relative", width: "100%", aspectRatio: "4/3", background: "#0f172a", borderRadius: "12px", overflow: "hidden", marginBottom: "14px", border: `2px solid ${borderColor}`, transition: "border-color 0.3s" }}>
          <video ref={videoRef} autoPlay muted playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover", display: step === "scanning" || step === "verifying" ? "block" : "none" }}
          />
          {/* Oval guide */}
          {(step === "scanning" || step === "verifying") && (
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", pointerEvents: "none" }}>
              <div style={{ width: "150px", height: "190px", border: `2.5px dashed ${borderColor}`, borderRadius: "50%", animation: step === "verifying" ? "pulse 0.6s infinite" : "pulse 1.4s infinite" }} />
            </div>
          )}
          {/* Scanning line */}
          {step === "verifying" && (
            <div style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", width: "150px", height: "2px", background: "linear-gradient(90deg,transparent,#f59e0b,transparent)", animation: "scanline 1s linear infinite", top: "30%" }} />
          )}
          {/* Placeholder */}
          {step !== "scanning" && step !== "verifying" && (
            <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", color: "white" }}>
              <div style={{ fontSize: "3.5rem" }}>
                {step === "loading" ? "⏳" : step === "verified" ? "✅" : step === "failed" ? "❌" : "📷"}
              </div>
            </div>
          )}
        </div>

        <style>{`
          @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
          @keyframes scanline { 0%{top:20%} 100%{top:80%} }
        `}</style>

        {/* Status */}
        <div style={{ padding: "10px 14px", borderRadius: "8px", marginBottom: "16px", fontSize: "0.88rem",
          background: step === "verified" ? "#f0fdf4" : step === "failed" ? "#fef2f2" : step === "verifying" ? "#fffbeb" : step === "scanning" ? "#eff6ff" : "#f8fafc",
          color: step === "verified" ? "#166534" : step === "failed" ? "#991b1b" : step === "verifying" ? "#92400e" : step === "scanning" ? "#1e40af" : "#374151",
          border: `1px solid ${step === "verified" ? "#bbf7d0" : step === "failed" ? "#fecaca" : step === "verifying" ? "#fde68a" : step === "scanning" ? "#bfdbfe" : "#e5e7eb"}`
        }}>
          {msg}
        </div>

        {/* Attempt dots */}
        {failCount > 0 && failCount < 3 && (
          <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginBottom: "12px" }}>
            {[0,1,2].map(i => (
              <div key={i} style={{ width: "10px", height: "10px", borderRadius: "50%", background: i < failCount ? "#ef4444" : "#e5e7eb" }} />
            ))}
          </div>
        )}

        {/* Buttons */}
        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
          {step === "ready" && (
            <button onClick={startCamera} style={{ padding: "10px 28px", background: "#2563eb", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
              📷 Camera Kholo
            </button>
          )}
          {step === "scanning" && (
            <button onClick={verify} style={{ padding: "10px 28px", background: "#059669", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "600", fontSize: "0.9rem" }}>
              🔍 Verify Karo
            </button>
          )}
          {step === "failed" && (
            <button onClick={() => { setFailCount(0); setStep("ready"); setMsg("Camera start karein aur chehra seedha rakhein"); }}
              style={{ padding: "10px 24px", background: "#f3f4f6", color: "#374151", border: "1px solid #d1d5db", borderRadius: "8px", cursor: "pointer", fontSize: "0.9rem" }}>
              🔄 Dobara Try Karo
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Vote Component ──────────────────────────────────────────────────────
function Vote() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState("");
  const [studentData, setStudentData] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [electionStatus, setElectionStatus] = useState(null);
  const [faceVerified, setFaceVerified] = useState(false);

  useEffect(() => {
    const student = JSON.parse(localStorage.getItem("student"));
    if (!student) { navigate("/"); return; }
    if (student.hasVoted === true) { navigate("/result"); return; }
    setStudentData(student);

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
    try {
      const statusRes = await fetch(`${API}/api/election/check`);
      const status = await statusRes.json();
      if (!status.allowed) { setElectionStatus(status); return; }
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

  if (electionStatus && !electionStatus.allowed) {
    const reason = electionStatus.reason?.includes("shuru nahi") ? "voting_not_started"
      : electionStatus.reason?.includes("khatam") ? "voting_ended" : "inactive";
    return <TimeoutScreen reason={reason} startTime={electionStatus.startTime} endTime={electionStatus.endTime} />;
  }

  // ── Face verification gate ──
  if (!faceVerified && studentData) {
    return <FaceVerification studentData={studentData} onVerified={() => setFaceVerified(true)} />;
  }

  // ── Voting UI ──
  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: "40px 20px" }}>

      {/* Verified banner */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", marginBottom: "16px" }}>
        <span style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", padding: "5px 14px", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "600" }}>
          ✅ Face Verified — {studentData?.name || studentData?.enrollmentNo}
        </span>
      </div>

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
                background: "white", width: "210px", padding: "24px 20px", borderRadius: "14px",
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
                {selected === c.id ? "✓ Selected" : "Select"}
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