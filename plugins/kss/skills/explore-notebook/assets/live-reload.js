// live-reload.js — subscribe to /events SSE stream and reload on change.
(function () {
  "use strict";
  if (window.__exhLiveReloadInstalled) return;
  window.__exhLiveReloadInstalled = true;

  let backoff = 500;
  let es = null;

  function connect() {
    try {
      es = new EventSource("/events");
    } catch (err) {
      console.warn("[exh] EventSource unavailable; live reload disabled");
      return;
    }

    es.addEventListener("hello", () => {
      backoff = 500;
    });

    es.addEventListener("reload", () => {
      console.log("[exh] reload event — reloading");
      window.location.reload();
    });

    es.onerror = () => {
      console.warn("[exh] SSE disconnected; reconnecting in", backoff, "ms");
      try { es.close(); } catch (_) {}
      es = null;
      setTimeout(connect, backoff);
      backoff = Math.min(backoff * 2, 8000);
    };
  }

  connect();
})();
