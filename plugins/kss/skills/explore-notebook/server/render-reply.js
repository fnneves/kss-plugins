#!/usr/bin/env node
/**
 * render-reply.js — convert markdown (with editorial primitives) to HTML.
 *
 * Reads markdown from stdin or --md flag.
 * Writes sanitized HTML to stdout.
 *
 * Primitives (Tier 1):
 *   :::finding       → <div class="finding">…</div>
 *   :::verdict pass  → <div class="verdict is-pass">…</div>
 *   :::verdict fail  → <div class="verdict is-fail">…</div>
 *   :::verdict warn  → <div class="verdict is-info">…</div>   (warn maps to is-info — sky)
 *   :::card          → <div class="card">…</div>
 *   :::card-rec      → <div class="card card-rec">…</div>     (clay border + "Recommended")
 *
 * Inline pills:
 *   [tone:label] →  <span class="pill pill-{tone}">label</span>
 *   tones: clay, olive, sky, oat, slate, used, unused, critical, info, pass, fail, warn
 */

"use strict";

const path = require("path");
const fs   = require("fs");

const VENDOR = path.join(__dirname, "vendor", "node_modules");
const MarkdownIt = require(path.join(VENDOR, "markdown-it"));
const container  = require(path.join(VENDOR, "markdown-it-container"));

const PILL_TONES = new Set([
  "clay", "olive", "sky", "oat", "slate",
  "used", "unused", "critical", "info",
  "pass", "fail", "warn",
]);

// ---------- read input -----------------------------------------------------
function readStdinSync() {
  return fs.readFileSync(0, "utf8");
}

const argv = process.argv.slice(2);
let mdSrc = null;
for (let i = 0; i < argv.length; i++) {
  if (argv[i] === "--md") { mdSrc = argv[i + 1]; i++; }
}
if (mdSrc == null) mdSrc = readStdinSync();

// ---------- configure markdown-it ------------------------------------------
const md = new MarkdownIt({
  html: false,         // do NOT pass through raw HTML — keeps replies safe
  linkify: true,
  breaks: false,
  typographer: false,
});

// helper: register a container that maps `:::name <maybe-variant>` to a div
function registerContainer(name, classFn) {
  md.use(container, name, {
    validate(params) {
      return params.trim().split(/\s+/, 1)[0] === name;
    },
    render(tokens, idx) {
      const tok = tokens[idx];
      if (tok.nesting === 1) {
        const info = tok.info.trim();
        const variant = info.slice(name.length).trim();
        const cls = classFn(variant);
        return `<div class="${cls}">\n`;
      }
      return "</div>\n";
    },
  });
}

registerContainer("finding",  ()        => "finding");
registerContainer("card",     ()        => "card");
registerContainer("card-rec", ()        => "card card-rec");
registerContainer("verdict",  (variant) => {
  const v = (variant || "").toLowerCase();
  if (v === "pass") return "verdict is-pass";
  if (v === "fail") return "verdict is-fail";
  if (v === "warn" || v === "info") return "verdict is-info";
  return "verdict";
});

// inline pill rule:  [tone:label]
// Skips matches where the bracket pair already looks like a markdown link.
md.inline.ruler.before("link", "exh_pill", (state, silent) => {
  const start = state.pos;
  if (state.src.charCodeAt(start) !== 0x5B /* [ */) return false;

  const close = state.src.indexOf("]", start + 1);
  if (close < 0) return false;
  const inside = state.src.slice(start + 1, close);
  const m = inside.match(/^([a-z]+):([^\[\]]+)$/);
  if (!m) return false;
  const tone = m[1].toLowerCase();
  const label = m[2].trim();
  if (!PILL_TONES.has(tone) || !label) return false;

  // peek ahead — if the next char is "(", treat this as a markdown link
  // and let the link rule handle it.
  if (state.src.charCodeAt(close + 1) === 0x28 /* ( */) return false;

  if (!silent) {
    const open = state.push("exh_pill_open", "span", 1);
    open.attrs = [["class", "pill pill-" + tone]];
    const t = state.push("text", "", 0);
    t.content = label;
    state.push("exh_pill_close", "span", -1);
  }
  state.pos = close + 1;
  return true;
});

// ---------- render ---------------------------------------------------------
let html = md.render(mdSrc);

// Soft cap: 4096 bytes of HTML (server enforces 2KB; this is a generous
// shoulder so the server doesn't reject borderline output).
if (Buffer.byteLength(html, "utf8") > 8192) {
  process.stderr.write("render-reply: WARN rendered HTML > 8KB; consider splitting.\n");
}

process.stdout.write(html);
