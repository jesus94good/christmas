# 聖誕節活動網站

QR Code → 問候頁（選 8 個禮物之一）→ 禮物內容頁（單數：禱告時光／雙數：晚安好好睡）→ 加 LINE 好友
全程有背景音樂，兩層在同一個頁面裡切換，所以音樂不會中斷。

## 檔案說明

| 檔案 | 用途 | 之後要改嗎 |
|---|---|---|
| `index.html` | 唯一的頁面：問候頁＋禮物內容頁 | 通常不用 |
| `data/content.json` | 8 份禮物的文字（標題、問候、內容、結語、按鈕文字、連結） | 改文字時 |
| `data/內容表.csv` | 和上面同樣的內容，用你們的表格格式；改文字時從這份開始 | 改文字時 |
| `js/config.js` | 全站設定：兩個頻道的預設連結、背景音樂、內容版本號 | 偶爾 |
| `css/style.css` | 所有樣式；內容頁每個禮物的顏色與禮物位置在「第二層」那一段 | 很少 |
| `music/bgm.mp3` | 背景音樂「聖誕背景音樂」（約 21 分鐘，循環播放） | — |
| `fonts/xmas-*.woff2` | 源泉圓體（從設計稿取出，只含內容頁用到的字） | — |
| `img/greeting.webp`、`img/gift-bg.webp` | 問候頁，直接由設計稿輸出 | 設計稿改了就重新輸出 |
| `img/sparkles.webp` | 內容頁頂部的星星與雪花（由設計稿取出） | — |
| `img/gifts/gift1–8.webp` | 8 個禮物插圖 | — |
| `img/og.jpg`、`img/icon.png` | LINE／社群分享縮圖、網站圖示 | 可換 |
| `js/data.js` `js/app.js` `js/music.js` | 程式邏輯（內容讀取、畫面切換、背景音樂） | 不用動 |
| `tools/` | 內容表轉 JSON、轉換背景音樂、產生 QR Code | — |

## 網址

- 問候頁：`https://你的帳號.github.io/christmas/`
- 直接打開某個禮物：在網址後面加 `#gift-1` 到 `#gift-8`

## 內容頁

依「聖誕節網頁_內容頁排版」設計稿等比例製作：頂部星星雪花＋會跳動的禮物、標題、白線、問候、內容卡片、結語、加好友按鈕。

| 禮物 | 標題 | 底色 | 按鈕 | 連結 |
|---|---|---|---|---|
| 一 | 平安的禮物 | 紅 | 點這裡，加「禱告時光」為好友 | https://lihi.cc/dymMh |
| 二 | 喜樂的禮物 | 綠 | 點這裡，每晚與你分享睡前故事 | https://lin.ee/jm2Dt1k |
| 三 | 恩典的禮物 | 紅 | 點這裡，加「禱告時光」為好友 | https://lihi.cc/dymMh |
| 四 | 愛的禮物 | 綠 | 點這裡，每晚與你分享睡前故事 | https://lin.ee/jm2Dt1k |
| 五 | 信心的禮物 | 紅 | 點這裡，加「禱告時光」為好友 | https://lihi.cc/dymMh |
| 六 | 豐盛的禮物 | 綠 | 點這裡，每晚與你分享睡前故事 | https://lin.ee/jm2Dt1k |
| 七 | 盼望的禮物 | 紅 | 點這裡，加「禱告時光」為好友 | https://lihi.cc/dymMh |
| 八 | 溫柔的禮物 | 綠 | 點這裡，每晚與你分享睡前故事 | https://lin.ee/jm2Dt1k |

- 文字的斷行和設計稿相同；單數頁置中、雙數頁靠左
- 左上角的返回鍵是設計稿外另加的，方便回到禮物堆（手機的返回鍵也可以）

## 修改文字

1. 用 Excel 或 Google Sheets 打開 `data/內容表.csv`，修改「問候／內容／結語」（儲存格裡的換行會照樣顯示，空一行＝段落間距）
2. 存檔（Google Sheets：檔案 → 下載 → CSV；Excel 可直接存 .xlsx）
3. 執行 `python3 tools/sheet_to_json.py 內容表.csv`（或 `.xlsx`），會更新 `data/content.json` 並列出缺漏
4. `js/config.js` 的 `CONTENT_VERSION` +1，推送到 GitHub

字體只包含目前內容用到的字；新加的字如果不在裡面，會自動改用外觀相近的圓體（Chiron GoRound TC）。

## 背景音樂

- 手機瀏覽器不允許網頁一打開就自動出聲，所以音樂會在使用者**第一次點到畫面**時開始播放（點禮物、點任何地方都算；單純滑動不算）
- 循環播放；右上角的音符按鈕可以關掉／打開，關掉後會記住
- 切到別的 App（例如按加好友打開 LINE）時會暫停，回來後繼續
- 換音樂：`bash tools/prep_music.sh 你的音樂檔.wav`（Mac 需先 `brew install ffmpeg`），再把 `CONTENT_VERSION` +1

## 部署到 GitHub Pages

1. 在 GitHub 建立新的 repo（例如 `christmas`），設為 Public
2. 把整個資料夾上傳（或用 `git push`）
3. repo → Settings → Pages → Source 選 `Deploy from a branch`，Branch 選 `main` / `(root)` → Save
4. 約 1 分鐘後網址會是 `https://你的帳號.github.io/christmas/`

## QR Code

```
pip install segno
python3 tools/make_qr.py https://你的帳號.github.io/christmas/
```

輸出 `qr/qr.svg`（印刷）與 `qr/qr.png`（數位），網址會自動帶上 `?src=qr`。**印刷前務必用 LINE 掃描與手機相機各實測一次。**

## 上線前檢查清單

- [x] 8 份禮物內容已放入
- [x] 背景音樂已換成正式音樂
- [ ] 實機測試：LINE 內建瀏覽器、iPhone Safari、Android Chrome
- [ ] 8 個禮物都點得到、返回正常、音樂換畫面不中斷、音符按鈕可以關
- [ ] 8 個加好友按鈕都連到正確的帳號
- [ ] QR Code 實際掃描測試
