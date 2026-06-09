#!/usr/bin/env python3
"""
article.py — attach a click-to-open article to an element on the page.

Renders markdown to design-system HTML via render-reply.js, then POSTs
to /article on the running server.  The page receives the article over
SSE and starts treating the target element as clickable; clicking it
opens a centered modal overlay with the article content.

Usage:
    # Attach an article to a specific element
    python article.py \
      --target '#poly-market section .finding:nth-of-type(2)' \
      --title 'The double-naming structure' \
      < article.md

    # Inline markdown
    python article.py --target '#section-04' --title 'Hello' \
      -m '### Title\\n\\nbody'

    # Render only, do not POST
    python article.py --target '...' --title '...' --dry-run < article.md

The script exits non-zero on render or POST failure.
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


def post_article(host: str, port: int, payload: dict) -> dict:
    url = f"http://{host}:{port}/article"
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
        raise SystemExit(f"POST /article → HTTP {e.code}")
    except urllib.error.URLError as e:
        raise SystemExit(f"POST /article → {e.reason}. Is serve.py running on {host}:{port}?")


def _resolve_server(html_path: str | None, port: int | None, host: str) -> tuple[str, int, str | None]:
    """
    Return (host, port, served_html_abs_path). Same defense as reply.py:
    no silent default port. Prefer --html which reads the sidecar.
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
        "There is no default port: a wrong default would cause articles to silently "
        "land on another page."
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--target", required=True,
                    help="CSS selector identifying the element to attach the article to.")
    ap.add_argument("--title", required=True,
                    help="Title shown in the overlay header.")
    ap.add_argument("-m", "--md", help="Markdown source. If omitted, reads stdin.")
    ap.add_argument("--page", default="/", help="Page path (default: /).")
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
        "target_selector": args.target,
        "title": args.title,
        "html": html,
        "md": md,
        "page": args.page,
    }
    result = post_article(host, port, payload)
    where = f" (page: {served_path})" if served_path else ""
    sys.stderr.write(f"article attached → target={args.target!r}  id={result.get('id')} @ {host}:{port}{where}\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
