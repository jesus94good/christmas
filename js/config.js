/* =========================================================
 * 聖誕節活動｜全站設定
 * 上線前只需要改這個檔案，其他程式不用動。
 * ========================================================= */
window.APP_CONFIG = {
  // 禮物數量
  TOTAL: 8,

  // 內容版本號：每次更新 content.json、音樂或圖片後 +1，避免使用者看到舊快取
  CONTENT_VERSION: 11,

  // 內容來源
  //   留空 ''  → 讀取 data/content.json（建議，最快最穩）
  //   填網址   → 直接讀 Google Sheets「發佈到網路」的 CSV 連結；讀取失敗時自動改讀 content.json
  SHEET_CSV_URL: '',

  // 背景音樂（留空 '' 就不播放、也不顯示音符按鈕）
  MUSIC_SRC: 'music/bgm.mp3',
  MUSIC_VOLUME: 0.6,   // 0–1；iPhone 不支援用程式調音量，會以檔案原音量播放

  // 單數禮物 → 禱告時光；雙數禮物 → 晚安好好睡
  // content.json 每一篇也可以自己填 link，有填的話以那篇為準
  TYPES: {
    prayer:    { label: '禱告時光',   link: 'https://lihi.cc/dymMh' },
    goodnight: { label: '晚安好好睡', link: 'https://lin.ee/jm2Dt1k' },
  },
};
