#!/usr/bin/env bash
# 把背景音樂（wav / m4a / mp3 / aac / aiff / flac）轉成網頁用的 music/bgm.mp3
#   - 立體聲 112kbps：音樂品質足夠，一分鐘約 0.8MB
#   - 音量標準化到 -18 LUFS：當背景音樂剛好，不會太大聲
#
# 用法：
#   brew install ffmpeg        # Mac 第一次需要
#   bash tools/prep_music.sh 你的音樂檔.wav

set -euo pipefail
SRC="${1:?請提供音樂檔路徑}"
OUT="$(cd "$(dirname "$0")/.." && pwd)/music/bgm.mp3"
mkdir -p "$(dirname "$OUT")"

ffmpeg -loglevel error -y -i "$SRC" -vn -ac 2 -ar 44100 -b:a 112k \
  -af "loudnorm=I=-18:TP=-1.5:LRA=11" -map_metadata -1 "$OUT"

echo "✅ 已輸出 $OUT（$(du -h "$OUT" | cut -f1)）"
echo "提醒：記得把 js/config.js 的 CONTENT_VERSION +1 再推送。"
