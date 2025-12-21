"use client";

import { useEffect, useMemo, useState } from "react";

function getBizId() {
  if (typeof window === "undefined") return "default";
  const p = new URLSearchParams(window.location.search);
  return p.get("biz") || "default";
}

function getOrCreateId(storageKey) {
  if (typeof window === "undefined") return "server";
  let id = localStorage.getItem(storageKey);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(storageKey, id);
  }
  return id;
}

export default function Home() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://server-vwfd.onrender.com";

  const bizId = useMemo(() => getBizId(), []);

  // ✅ per-biz storage keys so sessions don't mix between clients
  const SESSION_KEY = useMemo(() => `bss_session_id_${bizId}`, [bizId]);
  const NAME_KEY = useMemo(() => `bss_name_${bizId}`, [bizId]);

  const sessionId = useMemo(() => getOrCreateId(SESSION_KEY), [SESSION_KEY]);

  // ✅ you were calling setBiz without state; now it's real
  const [biz, setBiz] = useState(null);

  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hello! What’s your name?" },
  ]);

  // Load business config (name/assistant/links/phone)
  useEffect(() => {
    fetch(`${API_BASE}/business/${bizId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => setBiz(data))
      .catch(() => setBiz(null));
  }, [API_BASE, bizId]);

  const BOT_NAME = biz?.assistantName || "Assistant";

  // Load saved name + chat history
  useEffect(() => {
    if (typeof window === "undefined") return;

    const savedName = localStorage.getItem(NAME_KEY);
    if (savedName) setName(savedName);

    // ✅ history now includes biz_id (so backend can separate)
    fetch(`${API_BASE}/history?session_id=${encodeURIComponent(sessionId)}&biz_id=${encodeURIComponent(bizId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.messages?.length) setMessages(data.messages);
      })
      .catch(() => {});
  }, [API_BASE, sessionId, bizId, NAME_KEY]);

  function renderText(text) {
    // ✅ keep your "keyword link" logic, but make URLs dynamic from biz config
    const bookingUrl = biz?.links?.booking || "#";
    const galleryUrl = biz?.links?.gallery || "#";
    const instagramUrl = biz?.links?.instagram || "#";
    const phone = biz?.phone || "";

    return text
      .replace(
        /book online/gi,
        bookingUrl === "#"
          ? "book online"
          : `<a href="${bookingUrl}" target="_blank" rel="noreferrer" style="color:#4da3ff;text-decoration:underline;">book online</a>`
      )
      .replace(
        /call or text Shohre at (\d{3}[- ]?\d{3}[- ]?\d{4})/gi,
        phone
          ? `<a href="tel:${phone}" style="color:#4da3ff;text-decoration:underline;">call or text us at ${phone}</a>`
          : `call or text us`
      )
      .replace(
        /website gallery/gi,
        galleryUrl === "#"
          ? "website gallery"
          : `<a href="${galleryUrl}" target="_blank" rel="noreferrer" style="color:#4da3ff;text-decoration:underline;">website gallery</a>`
      )
      .replace(
        /Instagram/gi,
        instagramUrl === "#"
          ? "Instagram"
          : `<a href="${instagramUrl}" target="_blank" rel="noreferrer" style="color:#4da3ff;text-decoration:underline;">Instagram</a>`
      );
  }

  async function send() {
    const text = input.trim();
    if (!text) return;

    // Step 1: capture name once (keep your logic)
    if (!name) {
      setName(text);
      localStorage.setItem(NAME_KEY, text);

      setMessages((prev) => [
        ...prev,
        { role: "user", text },
        { role: "assistant", text: `I'm ${BOT_NAME}. How can I help you today, ${text}?` },
      ]);
      setInput("");
      return;
    }

    // UI: user message
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInput("");

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },

        // ✅ you MUST send biz_id because backend expects it
        body: JSON.stringify({ session_id: sessionId, biz_id: bizId, text, name }),
      });

      if (!res.ok) {
        const errText = await res.text();
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: `Server error (${res.status}): ${errText}` },
        ]);
        return;
      }

      const data = await res.json();
      setMessages((prev) => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: "Network error. Please try again." },
      ]);
    }
  }

  return (
    <div id="ai-chat-widget">
      <main style={{ maxWidth: 600, margin: "20px auto", fontFamily: "system-ui" }}>
        {/* ✅ remove “Demo” */}
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontWeight: 700 }}>
            {biz?.businessName ? `${biz.businessName} Assistant` : "Assistant"}
          </div>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            Ask about services, booking, pricing basics, and policies.
          </div>
        </div>

        <div style={{ border: "1px solid #ddd", padding: 12, minHeight: 320, borderRadius: 12 }}>
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
            style={{ flex: 1, padding: 10, borderRadius: 10, border: "1px solid #ddd" }}
            onKeyDown={(e) => e.key === "Enter" && send()}
          />
          <button onClick={send} style={{ padding: "10px 14px", borderRadius: 10 }}>
            Send
          </button>
        </div>
      </main>
    </div>
  );
}
