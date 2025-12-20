"use client";

import { useEffect, useMemo, useState } from "react";

const SESSION_KEY = "bss_session_id";
const NAME_KEY = "bss_name";
const BOT_NAME = "Shohre";

function getSessionId() {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

export default function Home() {
  const sessionId = useMemo(() => getSessionId(), []);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [messages, setMessages] = useState([
    { role: "bot", text: "Hello! Welcome to Beauty Shohre Studio. What’s your name?" },
  ]);

  // Load saved name + chat history on refresh
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setName(savedName);

    fetch(`http://localhost:8000/history?session_id=${sessionId}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.messages?.length) setMessages(data.messages);
      })
      .catch(() => {});
  }, [sessionId]);

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
      );
  }

  async function send() {
    const text = input.trim();
    if (!text) return;

    // Step 1: capture name once
    if (!name) {
      setName(text);
      localStorage.setItem(NAME_KEY, text);

      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        { role: "bot", text: `I'm Beauty Shohre Assistant. How can I help you today, ${text}?` },
      ]);
      setInput("");
      return;
    }

    // UI: user message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    try {
      const res = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, text, name }),
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
    } catch {
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
              <b>{m.role === "user" ? "You" : BOT_NAME}:</b>{" "}
              <span dangerouslySetInnerHTML={{ __html: renderText(m.text) }} />
            </div>
          ))}
        </div>

        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={name ? "Type your question…" : "Please enter your name"}
            style={{ flex: 1, padding: 10 }}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} style={{ padding: "10px 14px" }}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
