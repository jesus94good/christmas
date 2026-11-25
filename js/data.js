/* =========================================================
 * 共用：讀取內容、單雙數判斷
 * ========================================================= */
(function () {
  const C = window.APP_CONFIG;

  /** 單數 → prayer（禱告時光）；雙數 → goodnight（晚安好好睡） */
  function typeOf(n) {
    return n % 2 === 1 ? 'prayer' : 'goodnight';
  }

  /** 轉成 1–TOTAL 的整數，不合法回傳 null */
  function parseGift(value) {
    const s = String(value ?? '').trim();
    if (!/^\d{1,2}$/.test(s)) return null;
    const n = parseInt(s, 10);
    return n >= 1 && n <= C.TOTAL ? n : null;
  }

  /** 簡易 CSV 解析（支援引號、逗號、儲存格內換行） */
  function parseCSV(text) {
    const rows = []; let row = []; let cell = ''; let q = false;
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (q) {
        if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
        else if (ch === '"') q = false;
        else cell += ch;
      } else if (ch === '"') q = true;
      else if (ch === ',') { row.push(cell); cell = ''; }
      else if (ch === '\n' || ch === '\r') {
        if (ch === '\r' && text[i + 1] === '\n') i++;
        row.push(cell); rows.push(row); row = []; cell = '';
      } else cell += ch;
    }
    if (cell !== '' || row.length) { row.push(cell); rows.push(row); }
    const head = (rows.shift() || []).map(h => h.trim());
    return rows
      .filter(r => r.some(v => v.trim() !== ''))
      .map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
  }

  function normalize(list) {
    const map = {};
    list.forEach(item => {
      const n = parseInt(item.gift, 10);
      if (!n) return;
      map[n] = { ...item, gift: n, type: item.type || typeOf(n) };
    });
    return map;
  }

  let cache = null;
  /** 讀取全部內容，回傳 { 1: {...}, 2: {...}, ... } */
  async function loadContent() {
    if (cache) return cache;
    if (C.SHEET_CSV_URL) {
      try {
        const res = await fetch(C.SHEET_CSV_URL, { cache: 'no-store' });
        if (!res.ok) throw new Error(res.status);
        cache = normalize(parseCSV(await res.text()));
        return cache;
      } catch (e) {
        console.warn('Google Sheets 讀取失敗，改讀 content.json', e);
      }
    }
    const res = await fetch(`data/content.json?v=${C.CONTENT_VERSION}`);
    if (!res.ok) throw new Error('content.json 讀取失敗');
    cache = normalize(await res.json());
    return cache;
  }

  /** 純文字 → 段落 HTML（空行分段、單行換行保留），並跳脫特殊字元 */
  function toParagraphs(text) {
    const esc = s => s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    return String(text || '')
      .split(/\n\s*\n/)
      .map(p => p.trim())
      .filter(Boolean)
      .map(p => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
      .join('');
  }

  window.App = { typeOf, parseGift, loadContent, toParagraphs };
})();
