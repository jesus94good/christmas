#!/usr/bin/env python3
"""
產生活動入口 QR Code（SVG 給印刷、PNG 給社群／簡報）

用法：
  pip install segno
  python3 tools/make_qr.py https://帳號.github.io/christmas/

會自動在網址加上 ?src=qr，方便之後分辨流量來源。
輸出：qr/qr.svg、qr/qr.png
容錯等級使用 H（約 30%），中間可以放小 logo 而不影響掃描。
"""
import sys
from pathlib import Path
from urllib.parse import urlsplit, urlunsplit, parse_qsl, urlencode

import segno

OUT = Path(__file__).resolve().parent.parent / "qr"


def with_src(url: str) -> str:
    p = urlsplit(url)
    q = dict(parse_qsl(p.query))
    q.setdefault("src", "qr")
    return urlunsplit((p.scheme, p.netloc, p.path, urlencode(q), p.fragment))


def main():
    if len(sys.argv) != 2 or not sys.argv[1].startswith("http"):
        print(__doc__); sys.exit(1)
    url = with_src(sys.argv[1])
    OUT.mkdir(exist_ok=True)
    qr = segno.make(url, error="h", micro=False)
    qr.save(OUT / "qr.svg", scale=10, border=4, dark="#1f3a2e")
    qr.save(OUT / "qr.png", scale=20, border=4, dark="#1f3a2e")
    print(f"✅ QR Code 內容：{url}")
    print(f"   {OUT/'qr.svg'}（印刷用）")
    print(f"   {OUT/'qr.png'}（數位用）")
    print("⚠️  印刷前請先用手機（LINE 掃描 + 相機）實際掃一次。")


if __name__ == "__main__":
    main()
