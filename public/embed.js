/**
 * Dew Widget Embed
 * Usage: <script src="https://your-vercel-app.vercel.app/embed.js?biz=YOUR_BIZ_ID"></script>
 */
(function () {
  if (document.getElementById("dew-widget-iframe")) return;

  var src  = document.currentScript
    ? document.currentScript.src
    : (document.querySelector('script[src*="embed.js"]') || {}).src || "";
  var biz  = new URLSearchParams(src.split("?")[1] || "").get("biz") || "default";
  var base = new URL(src).origin;

  // ── iframe (panel) ──────────────────────────────────────────────────────
  var iframe = document.createElement("iframe");
  iframe.id  = "dew-widget-iframe";
  iframe.src = base + "/?biz=" + encodeURIComponent(biz) + "&embed=1";
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("title", "Dew chat assistant");

  Object.assign(iframe.style, {
    position:   "fixed",
    bottom:     "100px",
    right:      "24px",
    width:      "380px",
    height:     "580px",
    border:     "none",
    background: "transparent",
    zIndex:     "2147483646",
    colorScheme: "normal",
    borderRadius: "16px",
    boxShadow:  "0 8px 32px rgba(91,155,213,0.22),0 2px 8px rgba(0,0,0,0.08)",
    display:    "none",
    transition: "opacity 0.2s",
  });

  // ── FAB (bubble) ────────────────────────────────────────────────────────
  var fab = document.createElement("button");
  fab.id  = "dew-widget-fab";
  fab.setAttribute("aria-label", "Chat with Dew");

  Object.assign(fab.style, {
    position:     "fixed",
    bottom:       "24px",
    right:        "24px",
    width:        "60px",
    height:       "60px",
    borderRadius: "50%",
    border:       "none",
    background:   "transparent",
    cursor:       "pointer",
    zIndex:       "2147483647",
    padding:      "0",
    filter:       "drop-shadow(0 4px 12px rgba(91,155,213,0.3))",
  });

  var img = document.createElement("img");
  img.src = base + "/dew.png";
  img.alt = "Dew";
  Object.assign(img.style, { width: "60px", height: "60px", borderRadius: "50%", objectFit: "cover" });
  fab.appendChild(img);

  // ── toggle logic ────────────────────────────────────────────────────────
  var open = false;

  function show() {
    open = true;
    iframe.style.display = "block";
    fab.style.display = "none";
  }

  function hide() {
    open = false;
    iframe.style.display = "none";
    fab.style.display = "block";
  }

  fab.addEventListener("click", show);

  window.addEventListener("message", function (e) {
    if (e.data === "dew:close") hide();
  });

  document.body.appendChild(iframe);
  document.body.appendChild(fab);
})();
