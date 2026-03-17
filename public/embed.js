/**
 * Dew Widget Embed
 * Usage: <script src="https://your-vercel-app.vercel.app/embed.js?biz=YOUR_BIZ_ID"></script>
 */
(function () {
  var biz = new URLSearchParams(document.currentScript.src.split("?")[1] || "").get("biz") || "default";
  var base = new URL(document.currentScript.src).origin;

  var iframe = document.createElement("iframe");
  iframe.src = base + "?biz=" + encodeURIComponent(biz);
  iframe.allow = "clipboard-write";
  iframe.setAttribute("allowtransparency", "true");

  Object.assign(iframe.style, {
    position: "fixed",
    bottom: "0",
    right: "0",
    width: "420px",
    height: "640px",
    border: "none",
    background: "transparent",
    zIndex: "2147483647",
    pointerEvents: "none",
  });

  // allow clicks through to the iframe only over the widget area
  iframe.onload = function () {
    iframe.style.pointerEvents = "auto";
  };

  document.body.appendChild(iframe);
})();
