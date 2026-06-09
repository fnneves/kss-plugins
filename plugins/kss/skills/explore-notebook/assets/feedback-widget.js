// feedback-widget.js — Alt-click-to-pin inline feedback for explore-notebook pages.
//
// UX:
//   1. Alt-click (Option-click on macOS) any element → feedback popover opens.
//      Normal clicks pass through untouched so links / toggles / <details>
//      still work.
//   2. Popover offers three quick-action buttons + a free-form textarea.
//   3. Submit → POST /feedback, pin marker stays on the element.
//   4. Pins persist in localStorage (keyed by location.pathname).
//   5. A small corner hint announces the affordance once; dismissible.
//
// Talks to the server in server/serve.py.
(function () {
  "use strict";
  if (window.__exhFeedbackInstalled) return;
  window.__exhFeedbackInstalled = true;

  const HINT_KEY = "exh:hint-dismissed";
  let openPin = null;

  // ----- shared helper: reveal-and-scroll-to (used by anchor links) -------
  // Anchor links like href="#km-row-custom_strike" must work even when the
  // target sits inside a hidden tab, a collapsed section, or a closed
  // <details>. Walk the target's ancestor chain and open every container
  // before scrolling. Exposed on window for the article-overlay + messages-
  // panel anchor handlers to share.
  window.__exhRevealTarget = function (target) {
    if (!target) return false;
    // 1. Activate the right tab panel if the target is inside one.
    const panel = target.closest(".tab-panel");
    if (panel && !panel.classList.contains("is-active")) {
      const key = panel.dataset.panel;
      document.querySelectorAll("#platform-tabs .tab").forEach(b => {
        b.setAttribute("aria-selected", b.dataset.tab === key ? "true" : "false");
      });
      document.querySelectorAll(".tab-panel").forEach(p => {
        p.classList.toggle("is-active", p.dataset.panel === key);
      });
    }
    // 2. Expand any collapsed section the target is inside.
    for (let s = target.closest("section.collapsible"); s; s = s.parentElement?.closest("section.collapsible")) {
      s.classList.remove("is-section-collapsed");
      const head = s.querySelector(".sec-head");
      if (head) head.setAttribute("aria-expanded", "true");
    }
    // 3. Open any closed <details> ancestors (fields-collapse + raw-JSON).
    for (let d = target.closest("details"); d; d = d.parentElement?.closest("details")) {
      if (!d.open) d.open = true;
    }
    return true;
  };

  // ----- pin storage ------------------------------------------------------
  // Server is the source of truth. The client fetches /feedback.json on
  // load and on SSE 'feedback' events; localStorage is no longer used.
  // This eliminates the dual-source-of-truth class of bugs (where the
  // server's data evolves but stale client copies persist forever) and
  // makes schema migrations a server-side operation that every browser
  // picks up automatically without needing to hard-reload.
  //
  // `_pinsCache` is an in-memory mirror so repaintAll() doesn't refetch
  // on every DOM mutation event (article open/close, etc).
  let _pinsCache = [];

  async function fetchPins() {
    try {
      const r = await fetch("/feedback.json", { cache: "no-store" });
      if (!r.ok) return _pinsCache;
      const records = await r.json();
      _pinsCache = Array.isArray(records) ? records : [];
      return _pinsCache;
    } catch (err) {
      console.warn("[exh] feedback fetch failed:", err);
      return _pinsCache;
    }
  }

  // Classes that come and go during interaction — never use them in stored
  // selectors or the selector won't match the element on a later visit.
  const EPHEMERAL_CLASSES = new Set([
    "is-open", "is-active", "is-new", "is-collapsed", "is-out", "is-on",
    "is-dragging", "exh-pin-active", "exh-alt-down", "exh-panel-collapsed",
    "exh-has-article", // gets added by the article-overlay decorator
  ]);

  // Best-effort selector for the clicked element: prefer #id, fall back to a
  // short DOM path. Anchors at `.exh-overlay-body` for overlay-content elements
  // so the selector remains valid across overlay close/reopen cycles
  // (`.exh-overlay` itself is removed and re-mounted, so nth-of-type counts
  // relative to body shift unpredictably).
  function selectorFor(el) {
    if (!el || el === document.body) return "body";
    if (el.id) return "#" + CSS.escape(el.id);

    // If the element lives inside an article overlay, anchor the selector
    // at `.exh-overlay-body` (the article content root) instead of `body`.
    const overlayBody = el.closest(".exh-overlay-body");
    const anchor = overlayBody || document.body;
    const anchorSelector = overlayBody ? ".exh-overlay-body" : "body";

    const parts = [];
    let cur = el;
    while (cur && cur !== anchor && parts.length < 5) {
      let p = cur.tagName.toLowerCase();
      if (cur.className && typeof cur.className === "string") {
        const classes = cur.className.trim().split(/\s+/)
          .filter(c => c && !EPHEMERAL_CLASSES.has(c))
          .slice(0, 2);
        if (classes.length) p += "." + classes.map(c => CSS.escape(c)).join(".");
      }
      const sibs = cur.parentElement
        ? Array.from(cur.parentElement.children).filter(c => c.tagName === cur.tagName)
        : [];
      if (sibs.length > 1) p += `:nth-of-type(${sibs.indexOf(cur) + 1})`;
      parts.unshift(p);
      cur = cur.parentElement;
    }
    return anchorSelector + " " + parts.join(" > ");
  }

  // ----- corner hint (one-shot, dismissible) ------------------------------
  function showHintIfNeeded() {
    try { if (localStorage.getItem(HINT_KEY) === "1") return; } catch (_) {}
    const hint = document.createElement("div");
    hint.className = "exh-hint";
    hint.innerHTML = `
      <span class="exh-hint-key">${isMac() ? "⌥" : "Alt"}</span>
      <span class="exh-hint-text">+ click any element to leave feedback</span>
      <button class="exh-hint-close" type="button" aria-label="Dismiss">×</button>
    `;
    document.body.appendChild(hint);
    hint.querySelector(".exh-hint-close").onclick = () => {
      hint.classList.add("is-out");
      setTimeout(() => hint.remove(), 300);
      try { localStorage.setItem(HINT_KEY, "1"); } catch (_) {}
    };
  }
  function isMac() {
    return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent || "");
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", showHintIfNeeded);
  } else {
    showHintIfNeeded();
  }

  // The general-purpose chat composer used to live here as a floating FAB.
  // It moved to the bottom of the messages panel — see messages-panel.js.
  // POST /message stays the same on the server side.

  // ----- Alt-click to open feedback ---------------------------------------
  // Capture phase + altKey gate: normal clicks pass through untouched.
  document.addEventListener("click", (e) => {
    if (!e.altKey) return;
    if (e.target.closest(".exh-popover")) return;
    if (e.target.closest(".exh-hint")) return;
    e.preventDefault();
    e.stopPropagation();
    openPopover(e.target, e.clientX, e.clientY);
  }, true);
  // Suppress the contextmenu on Ctrl-click / right-click handoffs that some
  // browsers map to Alt-click for accessibility. (No-op on standard setups.)
  document.addEventListener("auxclick", (e) => {
    if (e.altKey) { e.preventDefault(); }
  }, true);

  // ----- Alt-down visual feedforward --------------------------------------
  function setAltState(down) {
    document.body.classList.toggle("exh-alt-down", !!down);
  }
  window.addEventListener("keydown", (e) => { if (e.key === "Alt") setAltState(true); });
  window.addEventListener("keyup",   (e) => { if (e.key === "Alt") setAltState(false); });
  window.addEventListener("blur",    () => setAltState(false));

  // ----- popover ----------------------------------------------------------
  function openPopover(target, x, y) {
    closePopover();
    const sel = selectorFor(target);
    const text = (target.innerText || "").trim().slice(0, 80);

    const pop = document.createElement("div");
    pop.className = "exh-popover";
    pop.innerHTML = `
      <div class="exh-pop-head">
        <span class="exh-pop-eyebrow">FEEDBACK</span>
        <span class="exh-pop-target" title="${escapeAttr(sel)}">${escapeHtml(text || sel)}</span>
        <button class="exh-pop-close" type="button" aria-label="Close">×</button>
      </div>
      <div class="exh-pop-quick">
        <button type="button" data-action="keep">keep</button>
        <button type="button" data-action="remove">remove</button>
        <button type="button" data-action="change">change to…</button>
      </div>
      <textarea class="exh-pop-text" placeholder="What should change? (Enter to submit, Shift+Enter for newline)"></textarea>
      <div class="exh-pop-foot">
        <span class="exh-pop-hint">Enter to send · Esc to cancel</span>
        <button class="exh-pop-submit" type="button">Send</button>
      </div>
    `;
    document.body.appendChild(pop);

    // position (clamped to viewport)
    const W = 360, H = 220;
    const vw = window.innerWidth, vh = window.innerHeight;
    const px = Math.max(12, Math.min(x, vw - W - 12));
    const py = Math.max(12, Math.min(y, vh - H - 12));
    pop.style.left = px + "px";
    pop.style.top = py + "px";

    const ta = pop.querySelector(".exh-pop-text");
    let action = "comment";
    ta.focus();

    pop.querySelector(".exh-pop-close").onclick = closePopover;
    pop.querySelectorAll(".exh-pop-quick button").forEach(b => {
      b.onclick = () => {
        pop.querySelectorAll(".exh-pop-quick button").forEach(x => x.classList.remove("is-on"));
        b.classList.add("is-on");
        action = b.dataset.action;
        if (action === "keep" || action === "remove") {
          submit({ target, selector: sel, snippet: text, action, body: "" });
        } else {
          ta.focus();
        }
      };
    });
    pop.querySelector(".exh-pop-submit").onclick = () =>
      submit({ target, selector: sel, snippet: text, action, body: ta.value.trim() });
    ta.addEventListener("keydown", (ev) => {
      if (ev.key === "Enter" && !ev.shiftKey) {
        ev.preventDefault();
        submit({ target, selector: sel, snippet: text, action, body: ta.value.trim() });
      } else if (ev.key === "Escape") {
        closePopover();
      }
    });

    openPin = pop;

    // Highlight the target while the popover is open so the user can
    // see what they're commenting on. Class is removed in closePopover().
    if (_pinnedTarget && _pinnedTarget !== target) {
      _pinnedTarget.classList.remove("exh-pin-active");
    }
    _pinnedTarget = target;
    target.classList.add("exh-pin-active");

    // Outside-click dismissal — same approach as the chat panel.
    setTimeout(() => {
      if (!openPin) return;
      _popOutsideHandler = (e) => {
        if (!openPin) return;
        if (e.target.closest(".exh-popover")) return;
        // An Alt-click means "open a new popover here" — let the alt-click
        // handler take over rather than dismissing this one.
        if (e.altKey) return;
        closePopover();
      };
      document.addEventListener("click", _popOutsideHandler, true);
    }, 0);
  }
  let _popOutsideHandler = null;
  let _pinnedTarget = null;
  function closePopover() {
    if (openPin) { openPin.remove(); openPin = null; }
    if (_pinnedTarget) {
      _pinnedTarget.classList.remove("exh-pin-active");
      _pinnedTarget = null;
    }
    if (_popOutsideHandler) {
      document.removeEventListener("click", _popOutsideHandler, true);
      _popOutsideHandler = null;
    }
  }
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") closePopover(); });

  // ----- submit -----------------------------------------------------------
  async function submit({ target, selector, snippet, action, body }) {
    if (action === "comment" && !body) return; // require text for free-form
    // If the pinned element is inside an open article overlay, stamp the
    // pin with the article's target_selector. Without it, the selector
    // (anchored at .exh-overlay-body) would match any future article and
    // paint a ghost pin on it. See repaintAll().
    const articleTarget = target.closest(".exh-overlay-body")
      ? (window.__exhOpenArticleTarget || null)
      : null;
    const payload = {
      page: location.pathname,
      selector,
      snippet,
      action,
      body,
      articleTarget,
    };
    let serverTs = null;
    try {
      const r = await fetch("/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      serverTs = j && j.record && j.record.ts;
    } catch (err) {
      console.error("[exh] feedback POST failed:", err);
      flashToast("couldn't reach server — is serve.py running?", true);
      return;
    }
    // Paint the pin immediately for visual confirmation. The server-side
    // record (which we just POSTed) is the canonical source — when the SSE
    // 'feedback' broadcast arrives, fetchPins() refreshes the cache. We
    // don't store anything client-side; localStorage is gone.
    const ts = serverTs || new Date().toISOString();
    paintPin(target, action, ts);
    closePopover();
    flashToast("sent ✓");
  }

  // ----- pin painting -----------------------------------------------------
  // Inline SVG icons — render identically on every OS, no font dependency.
  // Each path is sized for a 12x12 viewBox; CSS scales to 10px for visual
  // consistency with the 16px circle.
  const PIN_ICONS = {
    comment: '<path d="M6 1.5 7.4 4.7l3.6.3-2.7 2.4.8 3.5L6 9l-3.1 1.9.8-3.5L1 5l3.6-.3z" stroke-linejoin="round"/>',
    keep:    '<polyline points="2.5,6.5 5,9 9.5,3.5" fill="none" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    remove:  '<g fill="none" stroke-width="1.8" stroke-linecap="round"><line x1="3" y1="3" x2="9" y2="9"/><line x1="9" y1="3" x2="3" y2="9"/></g>',
    change:  '<path d="M2 6c1.2-2 2.8-2 4 0s2.8 2 4 0" fill="none" stroke-width="1.6" stroke-linecap="round"/>',
  };
  function pinIconSvg(action) {
    const body = PIN_ICONS[action] || PIN_ICONS.comment;
    return `<svg viewBox="0 0 12 12" width="10" height="10" stroke="currentColor" fill="currentColor" aria-hidden="true">${body}</svg>`;
  }
  function paintPin(target, action, ts) {
    if (!target) return;
    const marker = document.createElement("span");
    marker.className = "exh-pin exh-pin-" + (action || "comment");
    marker.innerHTML = pinIconSvg(action);
    marker.title = "Click to jump to this comment in the chat";
    if (ts) marker.setAttribute("data-exh-entry-id", ts);
    target.setAttribute("data-exh-pinned", "1");
    target.appendChild(marker);
    marker.addEventListener("click", (e) => {
      // Don't open the article overlay or close the popover when clicking the pin.
      e.preventDefault();
      e.stopPropagation();
      const entryId = marker.getAttribute("data-exh-entry-id");
      if (!entryId) return;
      document.dispatchEvent(new CustomEvent("exh:scroll-to-entry", { detail: { entryId } }));
    });
  }
  async function repaintAll({ refetch = false } = {}) {
    const pins = (refetch || _pinsCache.length === 0) ? await fetchPins() : _pinsCache;
    const openArticle = window.__exhOpenArticleTarget || null;
    // Only paint pins recorded against the current page path. The server
    // stores `page` on every feedback record; if it's missing (older
    // records, manual edits) we fall back to "show it" to avoid losing
    // pins to a schema gap.
    const pageFilter = (p) => !p.page || p.page === location.pathname;
    pins.filter(pageFilter).forEach(pin => {
      try {
        // Article-scoped pins only paint when their article is the one
        // currently open. Page-level pins (no articleTarget) only paint
        // when no article is open — otherwise their generic selectors
        // can match elements inside the overlay too.
        if (pin.articleTarget) {
          if (pin.articleTarget !== openArticle) return;
        } else if (pin.selector && pin.selector.includes("exh-overlay")) {
          // Defensive: server-side cleanup is supposed to have removed
          // these, but skip any that slip through. Match the same broad
          // substring the server uses — selectors can anchor at
          // `.exh-overlay-body`, `div.exh-overlay.is-open ...`, or
          // `article.exh-overlay-card ...` depending on schema vintage.
          return;
        }
        const el = document.querySelector(pin.selector);
        if (el && !el.hasAttribute("data-exh-pinned")) paintPin(el, pin.action, pin.ts);
      } catch (_) {}
    });
  }
  // Initial mount: fetch from server and paint.
  window.addEventListener("load", () => repaintAll({ refetch: true }));
  // Other modules (the article-overlay) dispatch this when new DOM appears
  // so we re-paint pins on freshly-mounted content. Uses cached pins.
  document.addEventListener("exh:repaint-pins", () => repaintAll());

  // Live: subscribe to server feedback broadcasts. When a new feedback
  // record lands (any tab, including this one's own submit), refresh the
  // cache and repaint. EventSource auto-reconnects on disconnect.
  try {
    const es = new EventSource("/events");
    es.addEventListener("feedback", () => repaintAll({ refetch: true }));
  } catch (_) {}

  // ----- toast ------------------------------------------------------------
  function flashToast(msg, isError) {
    const t = document.createElement("div");
    t.className = "exh-toast" + (isError ? " is-error" : "");
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add("is-out"), 1400);
    setTimeout(() => t.remove(), 2000);
  }

  // ----- escape helpers ---------------------------------------------------
  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }
  function escapeAttr(s) { return escapeHtml(s); }
})();
