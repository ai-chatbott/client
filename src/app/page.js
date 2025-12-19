"use client";

import { useState } from "react";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([]);

  async function send() {
    const text = input.trim();
    if (!text) return;

    // show user UI
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    // request backend
    const res = await fetch("http://127.0.0.1:8000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });

    const data = await res.json();

    // respond bot UI
    setMessages((prev) => [...prev, { role: "bot", text: data.reply }]);
  }

  return (
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
  );
}
