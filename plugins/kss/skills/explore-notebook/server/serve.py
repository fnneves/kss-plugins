#!/usr/bin/env python3
"""
explore-notebook interactive server.

Serves one HTML file (and its co-located assets) with two affordances:

  1. Live reload — the page subscribes to /events (Server-Sent Events);
     when the HTML or any sibling .css/.js/.json file changes on disk,
     all open tabs hard-reload.
  2. Feedback capture — the page POSTs comment objects to /feedback;
     the server appends one JSON line per comment to feedback.jsonl
     next to the served HTML.

Usage:
    python serve.py PATH_TO_HTML [--port 7777]

Stdlib only. No external deps.
"""
from __future__ import annotations

import argparse
import json
import mimetypes
import os
import queue
import re
import sys
import threading
import time
from datetime import datetime, timezone
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

# -- globals set in main() --------------------------------------------------
SERVE_DIR: Path = Path()
ENTRY_HTML: str = ""
FEEDBACK_PATH: Path = Path()
MESSAGES_PATH: Path = Path()
REPLIES_PATH: Path = Path()
ARTICLES_PATH: Path = Path()
SUBSCRIBERS: "list[queue.Queue[str]]" = []
SUBS_LOCK = threading.Lock()
_REPLY_COUNTER = 0
_REPLY_COUNTER_LOCK = threading.Lock()


def _new_reply_id() -> str:
    global _REPLY_COUNTER
    with _REPLY_COUNTER_LOCK:
        _REPLY_COUNTER += 1
        return f"r{int(time.time())}-{_REPLY_COUNTER}"


_ARTICLE_COUNTER = 0
_ARTICLE_COUNTER_LOCK = threading.Lock()


def _new_article_id() -> str:
    global _ARTICLE_COUNTER
    with _ARTICLE_COUNTER_LOCK:
        _ARTICLE_COUNTER += 1
        return f"a{int(time.time())}-{_ARTICLE_COUNTER}"


def _load_jsonl(path: Path) -> list[dict]:
    if not path.exists():
        return []
    out: list[dict] = []
    for line in path.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line:
            continue
        try:
            out.append(json.loads(line))
        except Exception:
            continue
    return out


# -- file watcher -----------------------------------------------------------
# href/src URL extraction — match link rel=stylesheet, script src, and a small
# set of common attributes that load page-dependent files. Absolute URLs and
# anything outside SERVE_DIR are filtered out.
_REF_RE = re.compile(
    r"""(?:href|src)\s*=\s*["']([^"']+)["']""",
    re.IGNORECASE,
)


def _referenced_files() -> set[str]:
    """Return the set of file names in SERVE_DIR that the entry HTML actually
    references via <link href> / <script src>. Plus the entry HTML itself."""
    out: set[str] = {ENTRY_HTML}
    try:
        html = (SERVE_DIR / ENTRY_HTML).read_text(encoding="utf-8", errors="ignore")
    except FileNotFoundError:
        return out
    for ref in _REF_RE.findall(html):
        # skip absolute / external / anchor / data URIs
        if ref.startswith(("http://", "https://", "//", "#", "data:", "/")):
            continue
        # normalise to file name (last path segment, no query/hash)
        name = ref.split("?", 1)[0].split("#", 1)[0].rsplit("/", 1)[-1]
        if name:
            out.add(name)
    return out


def watch_loop(poll_seconds: float = 0.4) -> None:
    """Poll mtimes of the entry HTML, sibling files it references, AND
    every injected asset under the skill's assets/ dir. Broadcast a
    'reload' event whenever any change. Re-derives each tick."""

    def snapshot() -> dict[str, float]:
        out: dict[str, float] = {}
        # 1. Files in SERVE_DIR referenced by the entry HTML
        for name in _referenced_files():
            p = SERVE_DIR / name
            if p.is_file():
                try:
                    out[p.name] = p.stat().st_mtime
                except FileNotFoundError:
                    pass
        # 2. Every injected helper asset — editing them is editing the
        # page's runtime, so they should trigger reload too.
        for url, asset_path in INJECTED_FILES.items():
            if asset_path.is_file():
                try:
                    out["__exh__" + url] = asset_path.stat().st_mtime
                except FileNotFoundError:
                    pass
        return out

    last = snapshot()
    while True:
        time.sleep(poll_seconds)
        try:
            curr = snapshot()
        except Exception:
            continue
        if curr != last:
            changed = sorted(
                set(curr) ^ set(last)
                | {k for k in curr if k in last and curr[k] != last[k]}
            )
            broadcast(f"event: reload\ndata: {json.dumps({'changed': changed})}\n\n")
            last = curr


def broadcast(sse_message: str) -> None:
    with SUBS_LOCK:
        dead: list[queue.Queue[str]] = []
        for q in SUBSCRIBERS:
            try:
                q.put_nowait(sse_message)
            except queue.Full:
                dead.append(q)
        for q in dead:
            SUBSCRIBERS.remove(q)


# -- request handler --------------------------------------------------------
class Handler(BaseHTTPRequestHandler):
    # quieter logs
    def log_message(self, fmt: str, *args) -> None:  # noqa: N802
        sys.stderr.write(
            f"[{self.log_date_time_string()}] {self.address_string()} {fmt % args}\n"
        )

    # ----- GET --------------------------------------------------------------
    def do_GET(self) -> None:  # noqa: N802
        url = urlparse(self.path)
        path = url.path

        if path == "/":
            self._serve_file(SERVE_DIR / ENTRY_HTML)
            return

        if path == "/events":
            self._serve_sse()
            return

        if path == "/feedback.json":
            self._serve_feedback_dump()
            return

        if path == "/replies.json":
            self._serve_jsonl_dump(REPLIES_PATH)
            return

        if path == "/articles.json":
            self._serve_articles_dump()
            return

        if path == "/transcript.json":
            self._serve_transcript()
            return

        if path == "/state":
            self._handle_state_get(url)
            return

        # any other path: serve from SERVE_DIR, no traversal allowed.
        rel = path.lstrip("/")
        candidate = (SERVE_DIR / rel).resolve()
        try:
            candidate.relative_to(SERVE_DIR.resolve())
        except ValueError:
            self.send_error(403, "Outside serve dir")
            return
        if not candidate.is_file():
            self.send_error(404, "Not found")
            return
        self._serve_file(candidate)

    # ----- POST -------------------------------------------------------------
    def do_POST(self) -> None:  # noqa: N802
        url = urlparse(self.path)
        if url.path == "/feedback":
            self._handle_post(kind="feedback", path=FEEDBACK_PATH)
            return
        if url.path == "/message":
            self._handle_post(kind="message", path=MESSAGES_PATH)
            return
        if url.path == "/reply":
            self._handle_reply()
            return
        if url.path == "/article":
            self._handle_article()
            return
        if url.path == "/state":
            self._handle_state_post(url)
            return
        self.send_error(404, "Not found")

    # ----- /state — server-side page state ---------------------------------
    # GET  /state[?file=NAME.json]  → returns the file's JSON content, or {}
    # POST /state[?file=NAME.json]  → atomic-writes the body as NAME.json
    #
    # Filename is restricted: ^[A-Za-z0-9_-]+\.json$. Default state.json.
    # Files always live directly in SERVE_DIR (no subdirs, no traversal).
    # Soft cap 1MB body so a runaway page can't fill disk.
    _STATE_FILE_RE = re.compile(r"^[A-Za-z0-9_-]+\.json$")
    _STATE_MAX_BYTES = 1024 * 1024

    def _state_path(self, url) -> Path | None:
        from urllib.parse import parse_qs
        q = parse_qs(url.query or "")
        name = (q.get("file") or ["state.json"])[0]
        if not self._STATE_FILE_RE.match(name):
            return None
        return SERVE_DIR / name

    def _handle_state_get(self, url) -> None:
        path = self._state_path(url)
        if path is None:
            self.send_error(400, "Bad state filename")
            return
        body = "{}"
        if path.exists():
            try:
                body = path.read_text(encoding="utf-8")
                json.loads(body)  # validate
            except Exception:
                body = "{}"
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body.encode("utf-8"))

    def _handle_state_post(self, url) -> None:
        path = self._state_path(url)
        if path is None:
            self.send_error(400, "Bad state filename")
            return
        length = int(self.headers.get("Content-Length", "0"))
        if length > self._STATE_MAX_BYTES:
            self.send_error(413, f"state exceeds {self._STATE_MAX_BYTES} bytes")
            return
        raw = self.rfile.read(length) if length else b""
        try:
            parsed = json.loads(raw.decode("utf-8"))
        except Exception as exc:
            self.send_error(400, f"Bad JSON: {exc}")
            return
        # Atomic write: tmp file in same dir, then os.replace.
        tmp = path.with_suffix(path.suffix + ".tmp")
        try:
            tmp.write_text(json.dumps(parsed, ensure_ascii=False, indent=2), encoding="utf-8")
            os.replace(tmp, path)
        except Exception as exc:
            try: tmp.unlink()
            except Exception: pass
            self.send_error(500, f"Write failed: {exc}")
            return
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "file": path.name, "bytes": len(raw)}).encode("utf-8"))

    def _handle_article(self) -> None:
        """Accept an article: {target_selector, title, html, md?}.
        Persist to articles.jsonl, broadcast SSE 'article' event."""
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception as exc:
            self.send_error(400, f"Bad JSON: {exc}")
            return

        target = payload.get("target_selector") or ""
        title = payload.get("title") or ""
        html = payload.get("html") or ""
        if not isinstance(target, str) or not target.strip():
            self.send_error(400, "missing target_selector")
            return
        if not isinstance(html, str) or not html.strip():
            self.send_error(400, "missing html")
            return
        # Articles are longer-form than replies — 16KB cap.
        if len(html.encode("utf-8")) > 16 * 1024:
            self.send_error(413, "article HTML exceeds 16KB cap")
            return

        record = {
            "id": _new_article_id(),
            "ts": datetime.now(timezone.utc).isoformat(),
            "target_selector": target,
            "title": title,
            "html": html,
            "md": payload.get("md"),
            "page": payload.get("page") or "/",
        }
        with ARTICLES_PATH.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record) + "\n")

        broadcast(
            "event: article\n"
            f"data: {json.dumps(record)}\n\n"
        )

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "id": record["id"]}).encode("utf-8"))

    def _handle_reply(self) -> None:
        """Accept an assistant reply: {html, md?, in_reply_to?, page?}.
        Persist to replies.jsonl, broadcast SSE 'reply' event for live render."""
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception as exc:
            self.send_error(400, f"Bad JSON: {exc}")
            return

        html = payload.get("html") or ""
        if not isinstance(html, str) or not html.strip():
            self.send_error(400, "missing html")
            return

        # Soft cap: 2KB rendered HTML per reply
        if len(html.encode("utf-8")) > 2048:
            self.send_error(413, "reply HTML exceeds 2KB cap")
            return

        record = {
            "id": _new_reply_id(),
            "ts": datetime.now(timezone.utc).isoformat(),
            "html": html,
            "md": payload.get("md"),
            "in_reply_to": payload.get("in_reply_to"),
            "page": payload.get("page") or "/",
        }
        with REPLIES_PATH.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record) + "\n")

        # Broadcast to all SSE subscribers so the page renders live.
        broadcast(
            "event: reply\n"
            f"data: {json.dumps(record)}\n\n"
        )

        # Quiet stdout — replies originate from the assistant, no need to
        # echo them back as Monitor notifications.
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps({"ok": True, "id": record["id"]}).encode("utf-8"))

    def _handle_post(self, *, kind: str, path: Path) -> None:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b""
        try:
            payload = json.loads(raw.decode("utf-8"))
        except Exception as exc:
            self.send_error(400, f"Bad JSON: {exc}")
            return

        record = {
            "ts": datetime.now(timezone.utc).isoformat(),
            **payload,
        }
        with path.open("a", encoding="utf-8") as fh:
            fh.write(json.dumps(record) + "\n")

        # Push to stdout so the harness surfaces it as a chat notification
        # in the parent agent's conversation. One compact line per POST.
        body = (record.get("body") or "").replace("\n", " ").strip()[:240]
        if kind == "feedback":
            action = (record.get("action") or "comment")
            selector = (record.get("selector") or "?")[:80]
            snippet = (record.get("snippet") or "").replace("\n", " ").strip()[:60]
            print(
                f"[feedback] {action} on {selector}"
                + (f" — “{body}”" if body else "")
                + (f"  [{snippet}]" if snippet else ""),
                flush=True,
            )
        else:  # message
            print(f"[message] {body or '(empty)'}", flush=True)

        # Broadcast over SSE so the chat panel can render this entry live
        # in every open tab without waiting for a reload.
        broadcast(
            f"event: {kind}\n"
            f"data: {json.dumps(record)}\n\n"
        )

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        # Echo the canonical record so the client can use the server's ts/id
        # to link pins to panel entries.
        self.wfile.write(json.dumps({"ok": True, "record": record}).encode("utf-8"))

    # ----- helpers ----------------------------------------------------------
    def _serve_file(self, path: Path) -> None:
        try:
            data = path.read_bytes()
        except FileNotFoundError:
            self.send_error(404, "Not found")
            return

        ctype, _ = mimetypes.guess_type(str(path))
        if ctype is None:
            ctype = "application/octet-stream"

        # inject our two helper scripts into the entry HTML
        if path.name == ENTRY_HTML and ctype.startswith("text/html"):
            data = self._inject_helpers(data)

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _inject_helpers(self, html: bytes) -> bytes:
        # Per-asset cache-buster: each injected URL gets a ?v=<mtime>
        # query string. When a file changes on disk, the URL changes,
        # so browsers must refetch rather than reuse the cached copy.
        def v(name: str) -> str:
            p = INJECTED_FILES.get(name)
            try:
                return f"?v={int(p.stat().st_mtime)}" if p else ""
            except Exception:
                return ""
        urls = [
            ("/__exh/live-reload.js",      "script"),
            ("/__exh/feedback-widget.css", "link"),
            ("/__exh/feedback-widget.js",  "script"),
            ("/__exh/messages-panel.css",  "link"),
            ("/__exh/messages-panel.js",   "script"),
            ("/__exh/article-overlay.css", "link"),
            ("/__exh/article-overlay.js",  "script"),
        ]
        parts = []
        for url, tag in urls:
            href = url + v(url)
            if tag == "script":
                parts.append(f'<script src="{href}" defer></script>')
            else:
                parts.append(f'<link rel="stylesheet" href="{href}">')
        snippet = ("\n".join(parts) + "\n</body>").encode("utf-8")
        if b"</body>" in html:
            return html.replace(b"</body>", snippet, 1)
        return html + b"\n" + snippet

    def _serve_sse(self) -> None:
        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.send_header("Cache-Control", "no-cache")
        self.send_header("Connection", "keep-alive")
        self.end_headers()

        q: queue.Queue[str] = queue.Queue(maxsize=32)
        with SUBS_LOCK:
            SUBSCRIBERS.append(q)
        try:
            # initial hello
            self.wfile.write(b"event: hello\ndata: {}\n\n")
            self.wfile.flush()
            while True:
                try:
                    msg = q.get(timeout=15)
                    self.wfile.write(msg.encode("utf-8"))
                    self.wfile.flush()
                except queue.Empty:
                    # keepalive
                    self.wfile.write(b": keepalive\n\n")
                    self.wfile.flush()
        except (BrokenPipeError, ConnectionResetError):
            pass
        finally:
            with SUBS_LOCK:
                if q in SUBSCRIBERS:
                    SUBSCRIBERS.remove(q)

    def _serve_feedback_dump(self) -> None:
        self._serve_jsonl_dump(FEEDBACK_PATH)

    def _serve_jsonl_dump(self, path: Path) -> None:
        records = _load_jsonl(path)
        data = json.dumps(records).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _serve_articles_dump(self) -> None:
        """Return a {selector: article_record} map — newest article per selector."""
        by_selector: dict[str, dict] = {}
        for r in _load_jsonl(ARTICLES_PATH):
            sel = r.get("target_selector")
            if not sel:
                continue
            # Last-write-wins
            by_selector[sel] = r
        data = json.dumps(by_selector).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)

    def _serve_transcript(self) -> None:
        """Interleave feedback + messages + replies in one timeline."""
        out: list[dict] = []
        for path, kind in (
            (FEEDBACK_PATH, "feedback"),
            (MESSAGES_PATH, "message"),
            (REPLIES_PATH, "reply"),
        ):
            for r in _load_jsonl(path):
                r = dict(r)
                r["_kind"] = kind
                out.append(r)
        out.sort(key=lambda r: r.get("ts") or "")
        data = json.dumps(out).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


# -- injected asset routing -------------------------------------------------
ASSET_DIR = Path(__file__).resolve().parent.parent / "assets"
INJECTED_FILES = {
    "/__exh/live-reload.js": ASSET_DIR / "live-reload.js",
    "/__exh/feedback-widget.js": ASSET_DIR / "feedback-widget.js",
    "/__exh/feedback-widget.css": ASSET_DIR / "feedback-widget.css",
    "/__exh/messages-panel.js": ASSET_DIR / "messages-panel.js",
    "/__exh/messages-panel.css": ASSET_DIR / "messages-panel.css",
    "/__exh/article-overlay.js": ASSET_DIR / "article-overlay.js",
    "/__exh/article-overlay.css": ASSET_DIR / "article-overlay.css",
}


def _patch_handler() -> None:
    """Splice the injected-asset route into Handler.do_GET."""
    orig_do_get = Handler.do_GET

    def patched(self: Handler) -> None:  # type: ignore[no-redef]
        url = urlparse(self.path)
        if url.path in INJECTED_FILES:
            p = INJECTED_FILES[url.path]
            if not p.is_file():
                self.send_error(404, f"asset missing: {url.path}")
                return
            ctype, _ = mimetypes.guess_type(str(p))
            data = p.read_bytes()
            self.send_response(200)
            self.send_header("Content-Type", ctype or "application/octet-stream")
            self.send_header("Cache-Control", "no-store")
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
            return
        orig_do_get(self)

    Handler.do_GET = patched  # type: ignore[assignment]


def _cleanup_orphan_feedback() -> None:
    """One-shot at startup: drop feedback records that anchor inside an article
    overlay but predate the `articleTarget` schema field.

    These records have selectors like ``.exh-overlay-body div.finding:nth-of-type(1)``
    and no ``articleTarget`` key. Without an article identity they can't be
    scoped to the article they were created in, so on the client they paint
    as ghost pins on every freshly-opened article. Drop them once on the
    server so every browser that hits ``/feedback.json`` gets the corrected
    data — no client-side migration required.

    Writes a tagged backup (`feedback.jsonl.pre-orphan-cleanup`) so the
    original is recoverable if someone needs it.
    """
    if not FEEDBACK_PATH.exists():
        return
    records = _load_jsonl(FEEDBACK_PATH)
    # An "orphan" is any feedback record taken inside an article overlay
    # but missing the `articleTarget` field that scopes it. The selector
    # might anchor at `.exh-overlay-body` directly (newer pins) or at
    # `div.exh-overlay.is-open ...` / `article.exh-overlay-card ...`
    # (older pins from before the overlay-body anchor was added). All of
    # them have `exh-overlay` somewhere in the selector string, so a
    # substring check catches every shape.
    def _is_orphan(r: dict) -> bool:
        sel = r.get("selector")
        if not isinstance(sel, str):
            return False
        if r.get("articleTarget"):
            return False
        return "exh-overlay" in sel

    cleaned = [r for r in records if not _is_orphan(r)]
    dropped = len(records) - len(cleaned)
    if dropped == 0:
        return
    backup = FEEDBACK_PATH.with_suffix(FEEDBACK_PATH.suffix + ".pre-orphan-cleanup")
    if not backup.exists():
        backup.write_bytes(FEEDBACK_PATH.read_bytes())
    with FEEDBACK_PATH.open("w", encoding="utf-8") as f:
        for r in cleaned:
            f.write(json.dumps(r) + "\n")
    print(f"  cleanup: dropped {dropped} orphan overlay-pin record(s) "
          f"(backup at {backup.name})")


# -- main -------------------------------------------------------------------
def main() -> int:
    global SERVE_DIR, ENTRY_HTML, FEEDBACK_PATH, MESSAGES_PATH, REPLIES_PATH, ARTICLES_PATH

    ap = argparse.ArgumentParser()
    ap.add_argument("html", help="Path to the HTML file to serve")
    ap.add_argument("--port", type=int, default=7777)
    ap.add_argument(
        "--feedback",
        default=None,
        help="Feedback JSONL path (default: <html_dir>/feedback.jsonl)",
    )
    ap.add_argument(
        "--messages",
        default=None,
        help="Messages JSONL path (default: <html_dir>/messages.jsonl)",
    )
    ap.add_argument(
        "--replies",
        default=None,
        help="Replies JSONL path (default: <html_dir>/replies.jsonl)",
    )
    ap.add_argument(
        "--articles",
        default=None,
        help="Articles JSONL path (default: <html_dir>/articles.jsonl)",
    )
    args = ap.parse_args()

    html_path = Path(args.html).resolve()
    if not html_path.is_file():
        print(f"error: not a file: {html_path}", file=sys.stderr)
        return 2

    SERVE_DIR = html_path.parent
    ENTRY_HTML = html_path.name
    FEEDBACK_PATH = (
        Path(args.feedback).resolve()
        if args.feedback
        else SERVE_DIR / "feedback.jsonl"
    )
    MESSAGES_PATH = (
        Path(args.messages).resolve()
        if args.messages
        else SERVE_DIR / "messages.jsonl"
    )
    REPLIES_PATH = (
        Path(args.replies).resolve()
        if args.replies
        else SERVE_DIR / "replies.jsonl"
    )
    ARTICLES_PATH = (
        Path(args.articles).resolve()
        if args.articles
        else SERVE_DIR / "articles.jsonl"
    )

    _patch_handler()
    _cleanup_orphan_feedback()

    watcher = threading.Thread(target=watch_loop, daemon=True)
    watcher.start()

    # Sidecar pidfile so reply.py / article.py can resolve the correct port
    # from the HTML path alone — defeats the cross-port-contamination trap
    # where two serve.py instances are running and reply.py defaults to the
    # wrong one and silently lands replies in someone else's transcript.
    sidecar_path = SERVE_DIR / ".exh-server.json"
    sidecar = {
        "pid": os.getpid(),
        "port": args.port,
        "host": "127.0.0.1",
        "html": str(html_path),
        "started_at": datetime.now(timezone.utc).isoformat(),
    }
    try:
        sidecar_path.write_text(json.dumps(sidecar, indent=2), encoding="utf-8")
    except OSError as e:
        print(f"warning: could not write {sidecar_path}: {e}", file=sys.stderr)
        sidecar_path = None

    srv = ThreadingHTTPServer(("127.0.0.1", args.port), Handler)
    url = f"http://127.0.0.1:{args.port}/"
    print(f"explore-notebook: serving {html_path}")
    print(f"  open:     {url}")
    print(f"  feedback: {FEEDBACK_PATH}")
    print(f"  messages: {MESSAGES_PATH}")
    print(f"  replies:  {REPLIES_PATH}")
    print(f"  articles: {ARTICLES_PATH}")
    if sidecar_path:
        print(f"  sidecar:  {sidecar_path}  (port discovery for reply.py / article.py)")
    print("  Ctrl-C to stop.")
    try:
        srv.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        srv.server_close()
        if sidecar_path:
            try:
                sidecar_path.unlink()
            except OSError:
                pass
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
