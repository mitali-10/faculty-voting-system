import { useState, useRef, useEffect } from "react";

const API = "https://faculty-voting-backend.onrender.com";

function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "Hi! Main aapki voting system mein help kar sakti hoon. Kya jaanna chahte hain?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setMessages(prev => [...prev, { role: "user", text: userMessage }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(`${API}/api/ai/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage })
      });
      const data = await res.json();
      
      setMessages(prev => [...prev, { 
        role: "ai", 
        text: data.success ? data.reply : "Sorry, kuch error aa gaya." 
      }]);
    } catch {
      setMessages(prev => [...prev, { role: "ai", text: "Server se connect nahi ho pa raha." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") handleSend();
  };

  return (
    <>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button onClick={() => setIsOpen(true)}
          style={{
            position: "fixed", bottom: "24px", right: "24px",
            width: "56px", height: "56px", borderRadius: "50%",
            background: "#1e293b", color: "white", border: "none",
            cursor: "pointer", fontSize: "1.4rem", boxShadow: "0 4px 14px rgba(0,0,0,0.25)",
            zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center"
          }}>
          💬
        </button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div style={{
          position: "fixed", bottom: "24px", right: "24px",
          width: "340px", height: "460px", background: "white",
          borderRadius: "14px", boxShadow: "0 8px 30px rgba(0,0,0,0.2)",
          zIndex: 1000, display: "flex", flexDirection: "column", overflow: "hidden"
        }}>

          {/* Header */}
          <div style={{
            background: "#1e293b", padding: "14px 18px", color: "white",
            display: "flex", justifyContent: "space-between", alignItems: "center"
          }}>
            <div>
              <div style={{ fontWeight: "600", fontSize: "0.92rem" }}>Voting Assistant</div>
              <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>AI Powered</div>
            </div>
            <button onClick={() => setIsOpen(false)}
              style={{ background: "none", border: "none", color: "white", fontSize: "1.1rem", cursor: "pointer" }}>
              ✕
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
            {messages.map((m, i) => (
              <div key={i} style={{
                alignSelf: m.role === "user" ? "flex-end" : "flex-start",
                background: m.role === "user" ? "#2563eb" : "#f3f4f6",
                color: m.role === "user" ? "white" : "#111827",
                padding: "9px 13px", borderRadius: "12px",
                maxWidth: "80%", fontSize: "0.85rem", lineHeight: "1.4"
              }}>
                {m.text}
              </div>
            ))}
            {loading && (
              <div style={{ alignSelf: "flex-start", background: "#f3f4f6", padding: "9px 13px", borderRadius: "12px", fontSize: "0.85rem", color: "#9ca3af" }}>
                Type kar rahi hai...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "12px", borderTop: "1px solid #e5e7eb", display: "flex", gap: "8px" }}>
            <input type="text" placeholder="Apna sawal likho..."
              value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              style={{ flex: 1, padding: "8px 12px", borderRadius: "8px", border: "1px solid #d1d5db", fontSize: "0.85rem", outline: "none" }} />
            <button onClick={handleSend} disabled={loading}
              style={{ padding: "8px 14px", background: "#1e293b", color: "white", border: "none", borderRadius: "8px", cursor: "pointer", fontSize: "0.85rem", fontWeight: "600" }}>
              →
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default Chatbot;