"use client";

import { useState } from "react";
import { preconnect } from "react-dom";

  const SESSION_ID = "demo-session";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);
  const [name, setName] = useState("")


  async function send() {
    const text = input.trim();
    if (!text) return;

    //if name is not set yet, treat first message as name
    if (!name){
      setName(text);
      setMessages((prev)=> [
        ...prev,
        {role: "bot", text: `Nice to meet you, ${text}! How can I help you today?`}
      ])
      setInput("")
      return;
    }

    // show user UI
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    try {
    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ session_id: SESSION_ID, text, name }),
    });

    if (!res.ok) {
      const errText = await res.text();
      setMessages((prev) => [
        ...prev,
        { role: "bot", text: `Server error (${res.status}): ${errText}` },
      ]);
      return;
    }

    const data = await res.json();
    setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
  } catch (e) {
    setMessages((prev) => [
      ...prev,
      { role: "bot", text: "Network error. Is the backend running?" },
    ]);
  }
  }

  return (
    <div id="ai-chat-widget">
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>AI Chatbot Demo</h1>

      <div style={{ border: "1px solid #ddd", padding: 12, minHeight: 300, marginTop: 16 }}>
        {messages.map((m, i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <b>{m.role === "user" ? "You" : "Bot"}:</b> {m.text}
          </div>
        ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          style={{ flex: 1, padding: 10 }}
          onKeyDown={(e) => {
            if (e.key === "Enter") send();
          }}
        />
        <button onClick={send} style={{ padding: "10px 14px" }}>
          Send
        </button>
      </div>
    </main>
    </div>
  );
}
