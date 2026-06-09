#!/usr/bin/env python3
"""
reply.py — send a markdown reply to the running explore-notebook server.

Renders markdown to design-system HTML via render-reply.js, then POSTs
to /reply on the server.  The page receives the fragment over SSE and
appends it to the messages panel.

Usage:
    # markdown via -m flag
    python reply.py -m "Going with B. :::finding\\n#### Why\\nbecause…\\n:::"

    # markdown via stdin (multi-line, easier for real authoring)
    python reply.py < my_reply.md

    # specify which user comment this answers
    python reply.py --in-reply-to <comment_id> -m "..."

    # custom server port
    python reply.py --port 7777 -m "..."

The script exits non-zero if rendering or POST fails.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
RENDERER = HERE / "render-reply.js"


def render_markdown(md: str) -> str:
    """Shell out to render-reply.js. Returns the rendered HTML string."""
    if not RENDERER.is_file():
        raise SystemExit(f"render-reply.js missing at {RENDERER}")
    proc = subprocess.run(
        ["node", str(RENDERER)],
        input=md.encode("utf-8"),
        capture_output=True,
        check=False,
    )
    if proc.returncode != 0:
        sys.stderr.write(proc.stderr.decode("utf-8", "replace"))
        raise SystemExit(f"render-reply.js exited {proc.returncode}")
    return proc.stdout.decode("utf-8").rstrip()


def post_reply(host: str, port: int, payload: dict) -> dict:
    url = f"http://{host}:{port}/reply"
    body = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=body,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        sys.stderr.write(e.read().decode("utf-8", "replace") + "\n")
        raise SystemExit(f"POST /reply → HTTP {e.code}")
    except urllib.error.URLError as e:
        raise SystemExit(f"POST /reply → {e.reason}. Is serve.py running on {host}:{port}?")


def _resolve_server(html_path: str | None, port: int | None, host: str) -> tuple[str, int, str | None]:
    """
    Return (host, port, served_html_abs_path).

    Resolution order:
      1. If --html is given, read the sidecar `.exh-server.json` next to it.
      2. Else, if --port is given, use (host, port) as-is. served_html is unknown.
      3. Else, fail loudly — no silent default. The 7777 default trap is what
         caused replies to land on the wrong page in the past.
    """
    if html_path:
        p = Path(html_path).resolve()
        sidecar = p.parent / ".exh-server.json" if p.is_file() else Path(html_path).resolve() / ".exh-server.json"
        if not sidecar.is_file():
            raise SystemExit(
                f"--html given but no sidecar at {sidecar}.\n"
                f"Is serve.py running on that file? If so, the sidecar should appear next to it.\n"
                f"Otherwise pass --port explicitly."
            )
        data = json.loads(sidecar.read_text(encoding="utf-8"))
        # Verify the sidecar matches the requested file.
        if Path(data.get("html", "")).resolve() != p:
            raise SystemExit(
                f"sidecar at {sidecar} says it's serving {data.get('html')!r}, "
                f"not {p!s}. Refusing to send."
            )
        return data.get("host", "127.0.0.1"), int(data["port"]), data.get("html")
    if port is not None:
        return host, port, None
    raise SystemExit(
        "must pass either --html <path-to-served-html> (recommended; auto-resolves port "
        "from sidecar) or --port <n> explicitly.\n"
        "There is no default port: a wrong default would cause replies to silently "
        "land in another page's transcript."
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("-m", "--md", help="Markdown source. If omitted, reads stdin.")
    ap.add_argument("--in-reply-to", help="ID/ts of the user comment this answers.")
    ap.add_argument("--page", default="/", help="Page path for context (default: /).")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=None,
                    help="Server port. Prefer --html for auto-resolution; --port is for fallback.")
    ap.add_argument("--html", default=None,
                    help="Path to the HTML the server is serving. Reads sidecar next to it for port.")
    ap.add_argument("--dry-run", action="store_true",
                    help="Render only; print HTML to stdout, do not POST.")
    args = ap.parse_args()

    md = args.md if args.md is not None else sys.stdin.read()
    md = md.strip()
    if not md:
        raise SystemExit("nothing to send (empty markdown)")

    html = render_markdown(md)
    if not html.strip():
        raise SystemExit("renderer produced empty HTML")

    if args.dry_run:
        sys.stdout.write(html)
        if not html.endswith("\n"):
            sys.stdout.write("\n")
        return 0

    host, port, served_path = _resolve_server(args.html, args.port, args.host)
    payload = {
        "html": html,
        "md": md,
        "in_reply_to": args.in_reply_to,
        "page": args.page,
    }
    result = post_reply(host, port, payload)
    where = f" (page: {served_path})" if served_path else ""
    sys.stderr.write(f"reply sent → id {result.get('id')} @ {host}:{port}{where}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
