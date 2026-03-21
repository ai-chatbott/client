"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import styles from "./page.module.css";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "https://server-vwfd.onrender.com";

// ── helpers ───────────────────────────────────────────────────────────────────

function getBizId() {
  if (typeof window === "undefined") return "default";
  return new URLSearchParams(window.location.search).get("biz") || "default";
}

function getOrCreateId(key) {
  if (typeof window === "undefined") return "anon";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function linkify(text, biz) {
  if (!biz) return text;
  const { links = {}, phone = "" } = biz;

  const rules = [
    [/book online/gi,     links.booking,   "book online"],
    [/website gallery/gi, links.gallery,   "website gallery"],
    [/instagram/gi,       links.instagram, "Instagram"],
    [/our website/gi,     links.website,   "our website"],
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

  // auto-linkify bare URLs not already inside an <a>
  out = out.replace(
    /(?<!href=")(https?:\/\/[^\s<>"]+)/g,
    `<a href="$1" target="_blank" rel="noreferrer" class="dew-link">$1</a>`
  );

  return out;
}

// ── component ─────────────────────────────────────────────────────────────────

function isEmbedded() {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("embed") === "1";
}

export default function DewWidget() {
  const bizId     = useMemo(() => getBizId(), []);
  const sessionId = useMemo(() => getOrCreateId(`dew_session_${bizId}`), [bizId]);
  const embedded  = useMemo(() => isEmbedded(), []);

  const [open, setOpen] = useState(false);
  const [biz,      setBiz]      = useState(null);
  const [input,    setInput]    = useState("");
  const [messages, setMessages] = useState([
    { id: "init", role: "assistant", text: "Hi! How can I help you today?" },
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
  }, [bizId]);

  // restore history
  useEffect(() => {
    fetch(`${API_BASE}/history?session_id=${encodeURIComponent(sessionId)}&biz_id=${encodeURIComponent(bizId)}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.messages?.length) {
          setMessages(d.messages.map((m, i) => ({ ...m, id: `hist-${i}` })));
        }
      })
      .catch(() => {});
  }, [bizId, sessionId]);

  // scroll to bottom
  useEffect(() => {
    if (open) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, open]);

  async function send(overrideText) {
    const text = (overrideText || input).trim();
    if (!text || loading) return;
    setInput("");

    setMessages(prev => [...prev, { id: `u-${Date.now()}`, role: "user", text }]);
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, biz_id: bizId, text }),
      });

      if (!res.ok) {
        throw new Error(`Server error ${res.status}`);
      }

      const data = await res.json();
      setMessages(prev => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: data.reply }]);
    } catch (err) {
      const isNetwork = err instanceof TypeError;
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: "assistant",
          text: isNetwork
            ? "Network error — please check your connection and try again."
            : "Something went wrong. Please try again in a moment.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {(open || embedded) && (
        <div
          className={embedded ? styles.panelEmbedded : styles.panel}
          role="dialog"
          aria-label="Dew chat assistant"
        >
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <img src="/dew.png" alt="" className={styles.avatar} aria-hidden="true" />
              <div>
                <div className={styles.botName}>{BOT_NAME}</div>
                {biz?.businessName && (
                  <div className={styles.bizName}>{biz.businessName}</div>
                )}
              </div>
            </div>
            <button
              className={styles.closeBtn}
              onClick={() => embedded ? window.parent.postMessage("dew:close", "*") : setOpen(false)}
              aria-label="Close chat"
            >
              <CloseIcon />
            </button>
          </div>

          <div className={styles.messages} aria-live="polite" aria-atomic="false">
            {messages.map(m => (
              <div key={m.id} className={`${styles.bubble} ${m.role === "user" ? styles.user : styles.bot}`}>
                <span dangerouslySetInnerHTML={{ __html: linkify(m.text, biz) }} />
              </div>
            ))}
            {/* quick replies — show after greeting, hide once user sends a message */}
            {biz?.quickReplies?.length > 0 && messages.length <= 1 && !loading && (
              <div className={styles.quickReplies}>
                {biz.quickReplies.map((q, i) => (
                  <button key={i} className={styles.quickReply} onClick={() => send(q)}>
                    {q}
                  </button>
                ))}
              </div>
            )}
            {loading && (
              <div className={`${styles.bubble} ${styles.bot}`} aria-label="Dew is typing">
                <span className={styles.typing}><span /><span /><span /></span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className={styles.inputRow}>
            <div className={styles.inputInner}>
                <input
                className={styles.input}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => e.key === "Enter" && send()}
                placeholder="Ask something…"
                disabled={loading}
                autoFocus
                aria-label="Chat input"
                maxLength={500}
              />
              <button
                className={styles.sendBtn}
                onClick={() => send()}
                disabled={loading || !input.trim()}
                aria-label="Send message"
              >
                <SendIcon />
              </button>
            </div>
          </div>
        </div>
      )}

      {!embedded && (
        <button
          className={`${styles.fab} ${open ? styles.fabOpen : ""}`}
          onClick={() => setOpen(o => !o)}
          aria-label={open ? "Close chat" : "Chat with Dew"}
          aria-expanded={open}
        >
          {open
            ? <CloseIcon size={22} />
            : <img src="/dew.png" alt="Dew" className={styles.fabImg} />
          }
        </button>
      )}
    </>
  );
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
