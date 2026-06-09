// article-overlay.js — click-to-open article overlay for explore-notebook.
//
// Maintains a {selector: article} map fed by /articles.json on mount and
// SSE 'article' events live. When the user plain-clicks an element whose
// selector has an attached article, opens a centered modal overlay with
// the article HTML, blurs the page behind it, and dims the backdrop.
//
// Plain click only — Alt-click stays bound to the feedback popover.
//
(function () {
  "use strict";
  if (window.__exhArticleInstalled) return;
  window.__exhArticleInstalled = true;

  // Map from selector → article record. Last-write-wins.
  const articles = new Map();
  // Reverse cache: WeakMap from element → article record (to skip re-query
  // when the user re-clicks the same element).
  const elementHit = new WeakMap();

  let openOverlay = null;

  // ----- backfill ---------------------------------------------------------
  async function backfill() {
    try {
      const r = await fetch("/articles.json", { cache: "no-store" });
      const data = await r.json();
      for (const [sel, rec] of Object.entries(data)) {
        articles.set(sel, rec);
      }
      decorateAll();
    } catch (err) {
      console.warn("[exh] articles backfill failed:", err);
    }
  }

  // ----- live SSE ---------------------------------------------------------
  function subscribeLive() {
    let es;
    try { es = new EventSource("/events"); } catch (_) { return; }
    es.addEventListener("article", (ev) => {
      try {
        const rec = JSON.parse(ev.data);
        if (rec.target_selector) {
          articles.set(rec.target_selector, rec);
          decorateAll();
        }
      } catch (err) { console.warn("[exh] bad article payload:", err); }
    });
  }

  // ----- decorate elements that have articles ----------------------------
  function decorateAll() {
    document.querySelectorAll("[data-exh-has-article]").forEach(el => {
      el.removeAttribute("data-exh-has-article");
      el.classList.remove("exh-has-article");
    });
    for (const sel of articles.keys()) {
      let el;
      try { el = document.querySelector(sel); } catch (_) { continue; }
      if (!el) continue;
      el.setAttribute("data-exh-has-article", "1");
      el.classList.add("exh-has-article");
      elementHit.set(el, articles.get(sel));
    }
  }

  // ----- click handler ----------------------------------------------------
  document.addEventListener("click", (e) => {
    if (e.altKey) return; // alt-click belongs to the feedback popover
    if (e.target.closest(".exh-popover")) return;
    if (e.target.closest(".exh-chat-panel")) return;
    if (e.target.closest(".exh-chat-fab")) return;
    if (e.target.closest(".exh-msg-panel")) return;
    if (e.target.closest(".exh-msg-toggle")) return;
    if (e.target.closest(".exh-overlay")) return;
    // Pins win over articles. This handler is in CAPTURE phase, so the
    // pin's own bubble-phase stopPropagation() can't help — we have to
    // bail here ourselves or the article opens before the pin scroll-to-
    // entry fires.
    if (e.target.closest(".exh-pin")) return;
    // Native interactive controls keep their behavior. <summary> toggles its
    // parent <details>; <a href> navigates; form controls do their thing.
    // Without this, clicking a disclosure summary inside an article-attached
    // element would open the article instead of expanding the disclosure.
    if (e.target.closest("summary, a[href], button, input, select, textarea, label")) return;

    // walk up from target to find an element with an attached article
    let cur = e.target;
    while (cur && cur !== document.body) {
      if (cur.hasAttribute && cur.hasAttribute("data-exh-has-article")) {
        const rec = elementHit.get(cur) || articles.get(findSelectorFor(cur));
        if (rec) {
          e.preventDefault();
          e.stopPropagation();
          openArticle(rec);
          return;
        }
      }
      cur = cur.parentElement;
    }
  }, true);

  function findSelectorFor(el) {
    for (const sel of articles.keys()) {
      try {
        if (document.querySelector(sel) === el) return sel;
      } catch (_) {}
    }
    return null;
  }

  // ----- overlay ----------------------------------------------------------
  function openArticle(rec) {
    closeArticle();
    const overlay = document.createElement("div");
    overlay.className = "exh-overlay";
    overlay.innerHTML = `
      <div class="exh-overlay-backdrop"></div>
      <article class="exh-overlay-card" role="dialog" aria-modal="true">
        <header class="exh-overlay-head">
          <span class="exh-overlay-eyebrow">ARTICLE</span>
          <h2 class="exh-overlay-title">${escapeHtml(rec.title || "Untitled")}</h2>
          <button class="exh-overlay-close" type="button" aria-label="Close">×</button>
        </header>
        <div class="exh-overlay-body">${rec.html || ""}</div>
      </article>
    `;
    document.body.appendChild(overlay);
    document.body.classList.add("exh-overlay-open");
    openOverlay = overlay;

    // Publish the currently-open article's identity so the feedback widget
    // can scope pins to this specific article. Without this, an overlay-body-
    // relative selector stored on article A would match any future article B,
    // producing ghost pins on every freshly-opened article. See feedback-
    // widget.js submit()/repaintAll().
    window.__exhOpenArticleTarget = rec.target_selector || null;

    overlay.querySelector(".exh-overlay-close").onclick = closeArticle;
    overlay.querySelector(".exh-overlay-backdrop").onclick = closeArticle;

    // In-article anchor links (href="#some-id") should close the overlay
    // first, then scroll to the target on the page behind. Otherwise the
    // browser jumps the (scrollable) overlay body to its own internal anchor
    // (or nowhere) — and even if it works, the user is left looking at a
    // blurred article instead of the linked content. Pull-back-to-page UX.
    overlay.querySelectorAll(".exh-overlay-body a[href^='#']").forEach(a => {
      a.addEventListener("click", (ev) => {
        const href = a.getAttribute("href") || "";
        const id = href.slice(1);
        if (!id) return;
        const target = document.getElementById(id);
        if (!target) return;
        ev.preventDefault();
        closeArticle();
        // Wait for the close animation, then reveal+scroll. Use the page's
        // natural scroll, not scrollIntoView from inside the (about-to-be-
        // removed) overlay body. window.__exhRevealTarget (in feedback-
        // widget.js) opens any tab/section/details ancestors first.
        setTimeout(() => {
          if (window.__exhRevealTarget) window.__exhRevealTarget(target);
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.classList.add("exh-link-target-flash");
          setTimeout(() => target.classList.remove("exh-link-target-flash"), 1800);
        }, 260);
      });
    });

    // Trap Escape
    const onKey = (ev) => {
      if (ev.key === "Escape") {
        closeArticle();
        document.removeEventListener("keydown", onKey, true);
      }
    };
    document.addEventListener("keydown", onKey, true);

    // Reveal animation: card scales/fades in next tick
    requestAnimationFrame(() => overlay.classList.add("is-open"));

    // Ask the feedback widget to repaint pins so any existing pins inside
    // the overlay's article content are restored (selectors persisted in
    // localStorage match against this freshly-mounted DOM).
    document.dispatchEvent(new CustomEvent("exh:repaint-pins"));
  }

  function closeArticle() {
    if (!openOverlay) return;
    openOverlay.classList.remove("is-open");
    document.body.classList.remove("exh-overlay-open");
    const o = openOverlay;
    openOverlay = null;
    window.__exhOpenArticleTarget = null;
    setTimeout(() => { try { o.remove(); } catch (_) {} }, 220);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  // ----- mount ------------------------------------------------------------
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => { backfill(); subscribeLive(); });
  } else {
    backfill();
    subscribeLive();
  }
})();
