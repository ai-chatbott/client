"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

// ── helpers ──────────────────────────────────────────────────────────────────

function getBizId() {
  if (typeof window === "undefined") return "default";
  return new URLSearchParams(window.location.search).get("biz") || "default";
}

function getOrCreateId(key) {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

// ── component ─────────────────────────────────────────────────────────────────

export default function DewWidget() {
  const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://server-vwfd.onrender.com";

  const bizId      = useMemo(() => getBizId(), []);
  const SESSION_KEY = useMemo(() => `dew_session_${bizId}`, [bizId]);
  const NAME_KEY    = useMemo(() => `dew_name_${bizId}`, [bizId]);
  const sessionId   = useMemo(() => getOrCreateId(SESSION_KEY), [SESSION_KEY]);

  const [open, setOpen]       = useState(false);
  const [biz, setBiz]         = useState(null);
  const [name, setName]       = useState("");
  const [input, setInput]     = useState("");
  const [messages, setMessages] = useState([
    { role: "assistant", text: "Hi! What's your name?" },
  ]);
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  const BOT_NAME = biz?.assistantName || "Dew";

  // fetch business meta
  useEffect(() => {
    fetch(`${API_BASE}/business/${bizId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => setBiz(d))
      .catch(() => {});
  }, [API_BASE, bizId]);

  // load saved name + history
  useEffect(() => {
    const saved = localStorage.getItem(NAME_KEY);
    if (saved) setName(saved);

    fetch(`${API_BASE}/history?session_id=${encodeURIComponent(sessionId)}&biz_id=${encodeURIComponent(bizId)}`)
      .then(r => r.json())
      .then(d => { if (d?.messages?.length) setMessages(d.messages); })
      .catch(() => {});
  }, [API_BASE, sessionId, bizId, NAME_KEY]);

  // scroll to bottom on new messages
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput("");

    // name capture
    if (!name) {
      setName(text);
      localStorage.setItem(NAME_KEY, text);
      setMessages(prev => [
        ...prev,
        { role: "user", text },
        { role: "assistant", text: `Nice to meet you, ${text}! I'm ${BOT_NAME}. How can I help you today?` },
      ]);
      return;
    }

    setMessages(prev => [...prev, { role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, biz_id: bizId, text, name }),
      });
      const data = await res.json();
      setMessages(prev => [...prev, { role: "assistant", text: data.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: "assistant", text: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Chat panel */}
      {open && (
        <div className={styles.panel}>
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <img src="/dew.png" alt="Dew" className={styles.avatar} />
              <div>
                <div className={styles.botName}>{BOT_NAME}</div>
                {biz?.businessName && (
                  <div className={styles.bizName}>{biz.businessName}</div>
                )}
              </div>
            </div>
            <button className={styles.closeBtn} onClick={() => setOpen(false)} aria-label="Close chat">
              <CloseIcon />
            </button>
          </div>

          <div className={styles.messages}>
            {messages.map((m, i) => (
              <div key={i} className={`${styles.bubble} ${m.role === "user" ? styles.user : styles.bot}`}>
                <span dangerouslySetInnerHTML={{ __html: linkify(m.text, biz) }} />
              </div>
            ))}
            {loading && (
              <div className={`${styles.bubble} ${styles.bot}`}>
                <span className={styles.typing}><span /><span /><span /></span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className={styles.inputRow}>
            <input
              className={styles.input}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder={name ? "Ask something…" : "Your name…"}
              disabled={loading}
              autoFocus
            />
            <button className={styles.sendBtn} onClick={send} disabled={loading || !input.trim()} aria-label="Send">
              <SendIcon />
            </button>
          </div>
        </div>
      )}

      {/* Floating button */}
      <button
        className={`${styles.fab} ${open ? styles.fabOpen : ""}`}
        onClick={() => setOpen(o => !o)}
        aria-label={open ? "Close chat" : "Open chat"}
      >
        {open ? <CloseIcon size={22} /> : <img src="/dew.png" alt="Dew" className={styles.fabImg} />}
      </button>
    </>
  );
}

// ── link injection ────────────────────────────────────────────────────────────

function linkify(text, biz) {
  if (!biz) return text;
  const { links = {}, phone = "" } = biz;

  const rules = [
    [/book online/gi, links.booking, "book online"],
    [/website gallery/gi, links.gallery, "website gallery"],
    [/instagram/gi, links.instagram, "Instagram"],
    [/our website/gi, links.website, "our website"],
  ];

  let out = text;
  for (const [re, url, label] of rules) {
    if (url) out = out.replace(re, `<a href="${url}" target="_blank" rel="noreferrer" class="dew-link">${label}</a>`);
  }

  if (phone) {
    out = out.replace(
      /call or text.*?(\d[\d\s\-().]{6,}\d)/gi,
      `<a href="tel:${phone}" class="dew-link">call or text us at ${phone}</a>`
    );
  }

  return out;
}

// ── icons ─────────────────────────────────────────────────────────────────────

function CloseIcon({ size = 18 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden="true">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="22" y1="2" x2="11" y2="13" />
      <polygon points="22 2 15 22 11 13 2 9 22 2" />
    </svg>
  );
}
