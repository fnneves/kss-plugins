// messages-panel.js — left-side transcript panel for explore-notebook.
//
// Mounts a collapsible panel on the left edge of the page. Loads existing
// transcript (feedback + messages + replies) on page load, then subscribes
// to /events SSE 'reply' events so new assistant replies render live.
//
// Talks to:
//   GET  /transcript.json   → backfill of all records, kind-tagged
//   SSE  /events 'reply'    → live append of new assistant replies
//
(function () {
  "use strict";
  if (window.__exhMessagesInstalled) return;
  window.__exhMessagesInstalled = true;

  const LS_COLLAPSED = "exh:panel:collapsed";
  const LS_WIDTH     = "exh:panel:width";
  const MIN_WIDTH = 280;
  const MAX_WIDTH = 720;

  // ----- panel DOM --------------------------------------------------------
  const panel = document.createElement("aside");
  panel.className = "exh-msg-panel";
  panel.innerHTML = `
    <header class="exh-msg-head">
      <span class="exh-msg-eyebrow">CHAT</span>
    </header>
    <div class="exh-msg-body"></div>
    <form class="exh-msg-input" autocomplete="off">
      <textarea
        class="exh-msg-textarea"
        rows="2"
        placeholder="Type a message (Enter to send, Shift+Enter for newline)"></textarea>
      <button class="exh-msg-send" type="submit" aria-label="Send">↑</button>
    </form>
    <div class="exh-msg-resize" aria-label="Resize chat panel" title="Drag to resize"></div>
  `;
  document.body.appendChild(panel);
  const body = panel.querySelector(".exh-msg-body");
  const inputForm = panel.querySelector(".exh-msg-input");
  const textarea = panel.querySelector(".exh-msg-textarea");
  const sendBtn = panel.querySelector(".exh-msg-send");
  const resizeHandle = panel.querySelector(".exh-msg-resize");

  // ----- resize-to-drag ---------------------------------------------------
  try {
    const w = parseInt(localStorage.getItem(LS_WIDTH) || "", 10);
    if (Number.isFinite(w) && w >= MIN_WIDTH && w <= MAX_WIDTH) {
      document.documentElement.style.setProperty("--exh-panel-w", w + "px");
    }
  } catch (_) {}

  let dragging = false;
  resizeHandle.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    dragging = true;
    resizeHandle.classList.add("is-dragging");
    document.body.classList.add("exh-msg-resizing");
    e.preventDefault();
  });
  document.addEventListener("mousemove", (e) => {
    if (!dragging) return;
    let w = Math.max(MIN_WIDTH, Math.min(MAX_WIDTH, e.clientX));
    document.documentElement.style.setProperty("--exh-panel-w", w + "px");
  });
  document.addEventListener("mouseup", () => {
    if (!dragging) return;
    dragging = false;
    resizeHandle.classList.remove("is-dragging");
    document.body.classList.remove("exh-msg-resizing");
    const w = parseInt(getComputedStyle(document.documentElement).getPropertyValue("--exh-panel-w"), 10);
    try { localStorage.setItem(LS_WIDTH, String(w)); } catch (_) {}
  });

  // Toggle lives OUTSIDE the panel so it stays clickable when the panel
  // is translated off-screen. Anchored to the left edge.
  const toggleBtn = document.createElement("button");
  toggleBtn.className = "exh-msg-toggle";
  toggleBtn.type = "button";
  toggleBtn.setAttribute("aria-label", "Toggle chat panel");
  document.body.appendChild(toggleBtn);

  try {
    if (localStorage.getItem(LS_COLLAPSED) === "1") {
      panel.classList.add("is-collapsed");
      document.body.classList.add("exh-panel-collapsed");
    }
  } catch (_) {}

  function paintToggle() {
    const collapsed = panel.classList.contains("is-collapsed");
    toggleBtn.textContent = collapsed ? "›" : "‹";
    toggleBtn.title = collapsed ? "Open chat" : "Close chat";
  }
  toggleBtn.onclick = () => {
    const collapsed = !panel.classList.contains("is-collapsed");
    panel.classList.toggle("is-collapsed", collapsed);
    document.body.classList.toggle("exh-panel-collapsed", collapsed);
    try { localStorage.setItem(LS_COLLAPSED, collapsed ? "1" : "0"); } catch (_) {}
    paintToggle();
  };
  paintToggle();

  // ----- chat input -------------------------------------------------------
  async function sendMessage(body) {
    if (!body) return;
    try {
      const r = await fetch("/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ page: location.pathname, body }),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
    } catch (err) {
      console.error("[exh] message POST failed:", err);
      flash("couldn't reach server", true);
      return;
    }
    flash("sent");
  }
  inputForm.addEventListener("submit", (ev) => {
    ev.preventDefault();
    const v = textarea.value.trim();
    if (!v) return;
    sendMessage(v);
    textarea.value = "";
    textarea.focus();
  });
  textarea.addEventListener("keydown", (ev) => {
    if (ev.key === "Enter" && !ev.shiftKey) {
      ev.preventDefault();
      inputForm.requestSubmit();
    }
  });

  // Tiny ephemeral toast inside the panel
  function flash(msg, isError) {
    const t = document.createElement("div");
    t.className = "exh-msg-flash" + (isError ? " is-error" : "");
    t.textContent = msg;
    panel.appendChild(t);
    setTimeout(() => t.classList.add("is-out"), 900);
    setTimeout(() => t.remove(), 1300);
  }

  // ----- render helpers ---------------------------------------------------
  function fmtTime(iso) {
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
    } catch (_) { return ""; }
  }
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function entryEl(rec) {
    const kind = rec._kind || (rec.html ? "reply" : "message");
    const div = document.createElement("div");
    div.className = "exh-msg-entry exh-msg-" + kind;
    div.dataset.id = rec.id || rec.ts || "";

    const time = fmtTime(rec.ts || "");
    const isMe = (kind === "reply");
    const author = isMe ? "ASSISTANT" : "YOU";

    if (kind === "reply") {
      // HTML is pre-rendered by the server (from markdown). Trust the server.
      div.innerHTML = `
        <div class="exh-msg-meta">
          <span class="exh-msg-author">${author}</span>
          <span class="exh-msg-time">${time}</span>
        </div>
        <div class="exh-msg-content">${rec.html || ""}</div>
      `;
    } else if (kind === "feedback") {
      const action = rec.action || "comment";
      const selectorShort = (rec.selector || "?").split(" > ").slice(-2).join(" › ");
      div.innerHTML = `
        <div class="exh-msg-meta">
          <span class="exh-msg-author">${author}</span>
          <span class="pill pill-${pillForAction(action)}">${escapeHtml(action)}</span>
          <span class="exh-msg-time">${time}</span>
        </div>
        <div class="exh-msg-target" title="${escapeHtml(rec.selector || "")}">on <code>${escapeHtml(selectorShort)}</code></div>
        ${rec.body ? `<div class="exh-msg-body-text">${escapeHtml(rec.body)}</div>` : ""}
      `;
    } else { // message
      div.innerHTML = `
        <div class="exh-msg-meta">
          <span class="exh-msg-author">${author}</span>
          <span class="exh-msg-time">${time}</span>
        </div>
        <div class="exh-msg-body-text">${escapeHtml(rec.body || "")}</div>
      `;
    }
    return div;
  }

  function pillForAction(action) {
    return ({
      keep: "olive",
      remove: "clay",
      change: "sky",
      comment: "info",
    })[action] || "info";
  }

  // Avoid double-rendering an entry we already painted.
  const seen = new Set();
  function append(rec, opts = {}) {
    const key = rec.id || rec.ts;
    if (key && seen.has(key)) return;
    if (key) seen.add(key);
    const el = entryEl(rec);
    body.appendChild(el);
    if (opts.scroll !== false) body.scrollTop = body.scrollHeight;
  }

  // ----- anchor-link flash (panel reply contains href="#some-id") --------
  // Reveal the target (open its tab / collapsed section / details), then
  // scroll smoothly and flash. We can't trust browser-default scrolling
  // because the target may be inside an inactive tab or a closed details.
  panel.addEventListener("click", (ev) => {
    const a = ev.target.closest("a[href^='#']");
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    if (!id) return;
    const target = document.getElementById(id);
    if (!target) return;
    ev.preventDefault();
    if (window.__exhRevealTarget) window.__exhRevealTarget(target);
    // Give the layout a moment to settle after tab/details toggles, then scroll.
    setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "center" });
      target.classList.add("exh-link-target-flash");
      setTimeout(() => target.classList.remove("exh-link-target-flash"), 1800);
    }, 60);
  });

  // ----- jump-to-entry (from .exh-pin clicks on the page) ----------------
  document.addEventListener("exh:scroll-to-entry", (ev) => {
    const id = ev.detail && ev.detail.entryId;
    if (!id) return;
    // Open the panel if collapsed
    if (panel.classList.contains("is-collapsed")) {
      panel.classList.remove("is-collapsed");
      document.body.classList.remove("exh-panel-collapsed");
      paintToggle();
    }
    // Try exact data-id match first; fall back to startswith for ISO ts variants.
    let entry = body.querySelector(`.exh-msg-entry[data-id="${CSS.escape(id)}"]`);
    if (!entry) {
      for (const e of body.querySelectorAll(".exh-msg-entry")) {
        if (e.dataset.id && e.dataset.id.startsWith(id)) { entry = e; break; }
      }
    }
    if (!entry) return;
    // Manually compute the scroll position so we KNOW we're scrolling
    // .exh-msg-body and not some ancestor. scrollIntoView walks up to
    // the nearest scroll container and was overshooting.
    const containerRect = body.getBoundingClientRect();
    const entryRect = entry.getBoundingClientRect();
    const currentTop = body.scrollTop;
    // Entry top relative to body's scroll origin
    const entryTopInBody = (entryRect.top - containerRect.top) + currentTop;
    // Center the entry vertically in the body viewport
    const targetScrollTop = entryTopInBody - (body.clientHeight / 2) + (entryRect.height / 2);
    body.scrollTo({ top: Math.max(0, targetScrollTop), behavior: "smooth" });
    entry.classList.add("is-new");
    setTimeout(() => entry.classList.remove("is-new"), 1800);
  });

  // ----- backfill ---------------------------------------------------------
  async function backfill() {
    try {
      const r = await fetch("/transcript.json", { cache: "no-store" });
      const records = await r.json();
      for (const rec of records) append(rec, { scroll: false });
      body.scrollTop = body.scrollHeight;
    } catch (err) {
      console.warn("[exh] transcript backfill failed:", err);
    }
  }

  // ----- live SSE 'reply' (and optional 'message'/'feedback') ------------
  function subscribeLive() {
    // Reuse the page's existing EventSource via a tiny shared shim — both
    // live-reload.js and this file open /events. EventSource multiplexes
    // server-side fine.
    let es;
    try { es = new EventSource("/events"); }
    catch (_) { return; }

    // Live append for all three entry kinds. The server broadcasts one
    // SSE event per POST: 'feedback' for Alt-click pins, 'message' for
    // chat-input sends, 'reply' for assistant replies.
    function liveAppender(kind, autoExpand) {
      return (ev) => {
        try {
          const rec = JSON.parse(ev.data);
          rec._kind = kind;
          append(rec);
          const el = body.lastElementChild;
          if (el) {
            el.classList.add("is-new");
            setTimeout(() => el.classList.remove("is-new"), 1500);
          }
          if (autoExpand && panel.classList.contains("is-collapsed")) {
            panel.classList.remove("is-collapsed");
            document.body.classList.remove("exh-panel-collapsed");
            paintToggle();
          }
        } catch (err) { console.warn(`[exh] bad ${kind} payload:`, err); }
      };
    }
    es.addEventListener("reply",    liveAppender("reply",    true));
    es.addEventListener("feedback", liveAppender("feedback", false));
    es.addEventListener("message",  liveAppender("message",  false));

    // Reconnection is handled by live-reload.js's EventSource; ours has its
    // own reconnect since SSE auto-reconnects by default in browsers.
  }

  // ----- start ------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { backfill(); subscribeLive(); });
  } else {
    backfill();
    subscribeLive();
  }
})();
