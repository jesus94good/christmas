#!/usr/bin/env python3
"""
內容表（Excel / Google Sheets）→ data/content.json

直接使用你們的「內容頁」表格格式，第一列標題需包含：
  介紹頻道、頁面、問候、內容、結語、按鈕連結
  - 頁面：例如「禮物一：平安的禮物」（冒號後面是網頁上的大標題）
  - 文字裡的換行會照樣顯示；空一行＝段落間距

用法（三選一）：
  python3 tools/sheet_to_json.py 內容表.xlsx                 # Excel（讀「內容頁」工作表）
  python3 tools/sheet_to_json.py 下載的檔案.csv               # Google Sheets → 檔案 → 下載 → CSV
  python3 tools/sheet_to_json.py "https://docs.google.com/.../pub?output=csv"   # 發佈到網路的 CSV

注意：網頁字體是從設計稿取出的源泉圓體，只包含目前內容用到的字。
新增的字如果不在裡面，會自動改用相近的圓體顯示（Chiron GoRound TC）。
"""
import csv, io, json, re, sys, urllib.request
from pathlib import Path

TOTAL = 8
NUM = "一二三四五六七八"
CHANNEL = {1: "禱告時光", 0: "晚安好好睡"}
LINK = {1: "https://lihi.cc/dymMh", 0: "https://lin.ee/jm2Dt1k"}
BUTTON = {1: "點這裡，加「禱告時光」為好友", 0: "點這裡，每晚與你分享睡前故事"}
OUT = Path(__file__).resolve().parent.parent / "data" / "content.json"


def read_rows(src: str):
    if src.lower().endswith(".xlsx"):
        import openpyxl
        wb = openpyxl.load_workbook(src, data_only=True)
        ws = wb["內容頁"] if "內容頁" in wb.sheetnames else wb.active
        rows = [[("" if v is None else str(v)) for v in r] for r in ws.iter_rows(values_only=True)]
    else:
        text = (urllib.request.urlopen(src).read().decode("utf-8-sig") if src.startswith("http")
                else Path(src).read_text(encoding="utf-8-sig"))
        rows = list(csv.reader(io.StringIO(text)))
    head = [h.strip() for h in rows[0]]
    return [dict(zip(head, r)) for r in rows[1:] if any(c.strip() for c in r)]


def clean(t: str) -> str:
    t = (t or "").replace("\r\n", "\n").replace("\r", "\n")
    t = "\n".join(line.strip() for line in t.split("\n"))
    t = re.sub(r"\n{3,}", "\n\n", t)          # 多個空行 → 一個段落間距
    return t.strip()


def main():
    if len(sys.argv) != 2:
        print(__doc__); sys.exit(1)

    items, problems, seen = [], [], set()
    for row in read_rows(sys.argv[1]):
        page = (row.get("頁面") or "").strip()
        m = re.match(r"禮物([一二三四五六七八1-8])\s*[：:]\s*(.+)", page)
        if not m:
            continue
        k = m.group(1)
        n = NUM.index(k) + 1 if k in NUM else int(k)
        if n in seen:
            problems.append(f"禮物{NUM[n-1]}重複出現"); continue
        seen.add(n)

        channel = CHANNEL[n % 2]
        sheet_channel = (row.get("介紹頻道") or "").strip()
        if sheet_channel and sheet_channel.replace("好好好睡", "好好睡") != channel:
            problems.append(f"禮物{NUM[n-1]}：頻道寫「{sheet_channel}」，依單雙數應為「{channel}」")

        item = {
            "gift": n,
            "channel": channel,
            "title": m.group(2).strip(),
            "greeting": clean(row.get("問候")),
            "body": clean(row.get("內容")),
            "closing": clean(row.get("結語")),
            "button": BUTTON[n % 2],
            "link": (row.get("按鈕連結") or "").strip() or LINK[n % 2],
        }
        for key, label in (("greeting", "問候"), ("body", "內容"), ("closing", "結語")):
            if not item[key]:
                problems.append(f"禮物{NUM[n-1]}：「{label}」是空的")
        items.append(item)

    missing = [NUM[i - 1] for i in range(1, TOTAL + 1) if i not in seen]
    if missing:
        problems.append("找不到的禮物：" + "、".join(missing))

    items.sort(key=lambda r: r["gift"])
    OUT.write_text(json.dumps(items, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"✅ 已寫入 {OUT}（{len(items)} 份禮物）")
    for p in problems:
        print("⚠️ ", p)
    print("提醒：記得把 js/config.js 的 CONTENT_VERSION +1 再推送。")


if __name__ == "__main__":
    main()
