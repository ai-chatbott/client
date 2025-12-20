"use client";

import { useState } from "react";
import { preconnect } from "react-dom";

  const SESSION_ID = "demo-session";

export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Welcome to Beauty Shohre Studio! What’s your name?",
    },
  ]);
  const [name, setName] = useState("")


  async function send() {
    const text = input.trim();
    if (!text) return;

    //if name is not set yet, treat first message as name
      if (!name) {
      setName(text);
      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        {
          role: "bot",
          text: `Hello, ${text}! I’m the Beauty Shohre Studio assistant. How can I help you today?`,
        },
      ]);
      setInput("");
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
  const BOT_NAME = "Shohre";


  function renderText(text) {
  return text
    .replace(
      /book online/gi,
      `<a href="https://beautyshohrestudio.ca/booking" target="_blank" style="color:#4da3ff;text-decoration:underline;">book online</a>`
    )
    .replace(
      /call or text Shohre at (\d{3}[- ]?\d{3}[- ]?\d{4})/gi,
      `<a href="tel:$1" style="color:#4da3ff;text-decoration:underline;">call or text Shohre at $1</a>`
    )
    .replace(
      /website gallery/gi,
      `<a href="https://beautyshohrestudio.ca/#gallery" target="_blank" style="color:#4da3ff;text-decoration:underline;">website gallery</a>`
    )
    .replace(
      /Instagram/gi,
      `<a href="https://www.instagram.com/beautyshohre_studio" target="_blank" style="color:#4da3ff;text-decoration:underline;">Instagram</a>`
    )
;
}


  return (
    <div id="ai-chat-widget">
    <main style={{ maxWidth: 600, margin: "40px auto", fontFamily: "system-ui" }}>
      <h1>AI Chatbot Demo</h1>

      <div style={{ border: "1px solid #ddd", padding: 12, minHeight: 300, marginTop: 16 }}>
        {messages.map((m, i) => (
        <div
          key={i}
          style={{ marginBottom: 12 }}
        >
          <b>{m.role === "user" ? "You" : BOT_NAME}:</b>{" "}
          <span dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
        </div>
      ))}
      </div>

      <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={name ? "How can we help you today?" : "Please enter your name"}
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
