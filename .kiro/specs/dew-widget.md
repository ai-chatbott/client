# Dew — AI Chat Widget

## Overview

Dew is an embeddable AI front-desk chat widget for small businesses. It consists of:

- A **Next.js 16 client** that renders the chat UI and is embeddable via an `<iframe>` snippet
- A **FastAPI server** that handles conversation logic, persists chat history in SQLite, and calls the Google Gemini API

Businesses are identified by a `biz_id` query param (`?biz=<id>`). Each business has a `.txt` knowledge file (used as the AI system prompt context) and a `.json` metadata file (name, assistant name, phone, links).

---

## Architecture

```
embed.js (injected on client site)
  └─ <iframe src="https://dew.vercel.app?biz=acme">
       └─ Next.js page (DewWidget component)
            ├─ GET /business/:biz_id   → business metadata (name, links, phone)
            ├─ GET /history            → restore prior conversation
            └─ POST /chat              → send message, get AI reply
```

### Server (`server/`)

| File | Purpose |
|---|---|
| `main.py` | FastAPI app — routes, prompt assembly, Gemini call |
| `models.py` | SQLAlchemy models: `ChatSession`, `ChatMessage` |
| `db.py` | SQLite engine + session factory (WAL mode) |
| `businesses/*.txt` | Business knowledge base (system prompt context) |
| `businesses/*.json` | Business UI metadata (name, assistantName, phone, links) |

Routes:
- `GET /business/{biz_id}` — returns `{ businessName, assistantName, phone, links }`
- `POST /chat` — body: `{ session_id, text, biz_id, name? }` → `{ reply }`
- `GET /history?session_id=&biz_id=` → `{ messages: [{role, text}] }`
- `GET /version` → `{ version }`

### Client (`client/`)

| File | Purpose |
|---|---|
| `src/app/page.js` | `DewWidget` — the full chat UI component |
| `src/app/page.module.css` | Scoped CSS with design tokens |
| `src/app/layout.js` | Root layout + metadata |
| `public/embed.js` | Iframe injection script for third-party sites |
| `public/dew.png` | Bot avatar image |

---

## Key Behaviors

- Session ID is persisted in `localStorage` per `biz_id`
- First message is treated as the user's name (stored locally + sent to server)
- Last 6 messages are sent as conversation context to Gemini
- Bot replies are linkified client-side using `biz.links` and `biz.phone`
- Widget is responsive: full-screen on mobile (`max-width: 420px`)
- CORS is configured via `ALLOWED_ORIGINS` env var + Vercel wildcard regex

---

## Environment Variables

### Server (`.env`)
```
GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash   # optional, default shown
ALLOWED_ORIGINS=http://localhost:3000,https://yourapp.vercel.app
```

### Client (`.env.local`)
```
NEXT_PUBLIC_API_BASE=https://your-server.onrender.com
```

---

## Adding a New Business

1. Create `server/businesses/<biz_id>.txt` with business info (hours, services, FAQs, etc.)
2. Create `server/businesses/<biz_id>.json`:
```json
{
  "businessName": "Acme Salon",
  "assistantName": "Dew",
  "phone": "555-123-4567",
  "links": {
    "booking": "https://acme.com/book",
    "instagram": "https://instagram.com/acme",
    "website": "https://acme.com"
  }
}
```
3. Embed on client site:
```html
<script src="https://your-dew-app.vercel.app/embed.js?biz=acme"></script>
```

---

## Running Locally

```bash
# Server
cd server
pip install -r requirements.txt
uvicorn main:app --reload

# Client
cd client
npm install
npm run dev
```

---

## Current Businesses

| biz_id | Business |
|---|---|
| `default` | Demo Business |
| `beautyshohre` | Beauty Shohre |
| `beiraghian` | Beiraghian |
