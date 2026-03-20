/**
 * Dew Widget Embed
 * Usage: <script src="https://your-vercel-app.vercel.app/embed.js?biz=YOUR_BIZ_ID"></script>
 */
(function () {
  if (document.getElementById("dew-widget-iframe")) return; // prevent double-init

  var src  = document.currentScript.src;
  var biz  = new URLSearchParams(src.split("?")[1] || "").get("biz") || "default";
  var base = new URL(src).origin;

  var iframe = document.createElement("iframe");
  iframe.id  = "dew-widget-iframe";
  iframe.src = base + "?biz=" + encodeURIComponent(biz);
  iframe.setAttribute("allowtransparency", "true");
  iframe.setAttribute("title", "Dew chat assistant");

  Object.assign(iframe.style, {
    position:   "fixed",
    bottom:     "0",
    right:      "0",
    width:      "420px",
    height:     "640px",
    border:     "none",
    background: "transparent",
    zIndex:     "2147483647",
    colorScheme: "normal",
  });

  document.body.appendChild(iframe);
})();
