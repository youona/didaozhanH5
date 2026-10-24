#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""把 index.html 连同 css / js / 用到的图片全部内联成一个单文件 HTML。

用法：
    python tools/build_standalone.py
产物：
    index-standalone.html  （双击就能在浏览器里打开，不需要服务器）
"""
import base64
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
OUT = ROOT / "index-standalone.html"

MIME = {
    ".webp": "image/webp",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".woff2": "font/woff2",
}


def data_uri(path: pathlib.Path) -> str:
    raw = path.read_bytes()
    mime = MIME.get(path.suffix.lower(), "application/octet-stream")
    return "data:%s;base64,%s" % (mime, base64.b64encode(raw).decode("ascii"))


def inline_css(match: re.Match) -> str:
    href = match.group(1)
    css_path = (ROOT / href).resolve()
    if not css_path.exists():
        print("  [skip css] %s" % href, file=sys.stderr)
        return match.group(0)
    css = css_path.read_text(encoding="utf-8")

    def repl(mm: re.Match) -> str:
        raw = mm.group(1).strip().strip("'\"")
        if not raw or raw.startswith("data:") or raw.startswith("http"):
            return mm.group(0)
        target = (css_path.parent / raw.split("?")[0]).resolve()
        if not target.exists():
            return mm.group(0)
        return 'url("%s")' % data_uri(target)

    css = re.sub(r"url\(([^)]+)\)", repl, css)
    return "<style>\n%s\n</style>" % css


def inline_js(match: re.Match) -> str:
    src = match.group(1)
    js_path = (ROOT / src).resolve()
    if not js_path.exists():
        print("  [skip js] %s" % src, file=sys.stderr)
        return match.group(0)
    code = js_path.read_text(encoding="utf-8")
    return "<script>\n%s\n</script>" % code


def main() -> int:
    index = ROOT / "index.html"
    if not index.exists():
        print("找不到 index.html", file=sys.stderr)
        return 1
    html = index.read_text(encoding="utf-8")

    html = re.sub(r'<link[^>]*href="([^"]+\.css)"[^>]*>', inline_css, html)
    html = re.sub(r'<script[^>]*src="([^"]+\.js)"[^>]*>\s*</script>', inline_js, html)

    OUT.write_text(html, encoding="utf-8")
    print("ok -> %s  (%.2f MB)" % (OUT.name, OUT.stat().st_size / 1024 / 1024))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
