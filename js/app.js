/* =========================================================
 * 單頁切換：#gift-N 顯示第二層，沒有 # 顯示問候頁
 * 整個活動只有一個頁面，所以背景音樂換畫面時不會中斷
 * ========================================================= */
(function () {
  const C = window.APP_CONFIG;
  const NUM = ['', '一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  const home = document.getElementById('screenHome');
  const giftScreen = document.getElementById('screenGift');
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  let homeScrollY = 0;        // 回到禮物堆時，回到原本捲動的位置
  let openedFromHome = false; // 是不是從禮物堆點進來的（決定「返回」怎麼做）

  function giftFromHash() {
    const m = location.hash.match(/^#gift-(\d{1,2})$/);
    return m ? App.parseGift(m[1]) : null;
  }

  /* ---------- 切換畫面 ---------- */
  function route() {
    const n = giftFromHash();
    if (n) showGift(n);
    else showHome();
  }

  function showHome() {
    document.body.classList.remove('is-picking');
    document.querySelectorAll('.is-picked').forEach(a => a.classList.remove('is-picked'));
    giftScreen.hidden = true;
    home.hidden = false;
    document.title = '聖誕快樂｜領取一份祝福';
    window.scrollTo(0, homeScrollY);
  }

  function showGift(n) {
    if (!home.hidden) homeScrollY = window.scrollY;
    home.hidden = true;
    giftScreen.hidden = false;
    window.scrollTo(0, 0);
    renderGift(n);
  }

  /* ---------- 點禮物：先播小動畫，再切換 ---------- */
  document.querySelectorAll('.gift').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      if (document.body.classList.contains('is-picking')) return;
      openedFromHome = true;
      const go = () => { location.hash = a.getAttribute('href'); };
      if (reduce) return go();
      document.body.classList.add('is-picking');
      a.classList.add('is-picked');
      setTimeout(go, 420);
    });
  });

  /* ---------- 返回禮物堆 ---------- */
  document.getElementById('backLink').addEventListener('click', e => {
    e.preventDefault();
    if (openedFromHome) {
      openedFromHome = false;
      history.back();                                   // 跟手機的返回鍵效果一樣
    } else {
      history.pushState(null, '', location.pathname + location.search);  // 直接打開禮物連結的人
      route();
    }
  });

  window.addEventListener('hashchange', route);
  window.addEventListener('popstate', () => { if (!location.hash) route(); });

  /* ---------- 第二層內容 ---------- */
  const $ = id => document.getElementById(id);

  /* 依設計稿斷行：每一行放在自己的一列，空行保留成段落間距 */
  function setLines(el, text) {
    el.textContent = '';
    if (!text) return;
    text.split('\n').forEach(line => {
      const ln = document.createElement('span');
      ln.className = 'ln';
      ln.textContent = line || '\u00a0';
      el.appendChild(ln);
    });
  }

  /* 有些手機會把字放大（系統字級、LINE 的字體大小設定），
     原本排好的一行就會被擠成兩行。這裡量每一行的實際寬度，
     只要有一行放不下，就把內文整體等比例縮小到剛好放得下。 */
  function fitText() {
    if (giftScreen.hidden) return;
    giftScreen.style.setProperty('--fit', '1');
    let scale = 1;
    ['gGreeting', 'gBody', 'gClosing'].forEach(id => {
      const block = $(id);
      const cs = getComputedStyle(block);
      const avail = block.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      block.querySelectorAll('.ln').forEach(ln => {
        const w = ln.scrollWidth;
        if (avail > 0 && w > avail + 1) scale = Math.min(scale, avail / w);
      });
    });
    if (scale < 1) giftScreen.style.setProperty('--fit', (scale * 0.98).toFixed(4));
  }
  let fitTimer;
  window.addEventListener('resize', () => { clearTimeout(fitTimer); fitTimer = setTimeout(fitText, 150); });

  function renderGift(n) {
    const type = App.typeOf(n);
    const typeCfg = C.TYPES[type];
    giftScreen.dataset.type = type;
    giftScreen.dataset.gift = String(n);

    const img = $('giftImg');
    img.src = `img/gifts/gift${n}.webp`;
    img.alt = `禮物${NUM[n] || n}`;

    ['gTitle', 'gGreeting', 'gBody', 'gClosing'].forEach(id => { $(id).textContent = ''; });
    giftScreen.style.setProperty('--fit', '1');
    $('lineBtn').hidden = true;

    App.loadContent().then(all => {
      if (giftFromHash() !== n) return;            // 已經切到別的畫面
      const item = all[n];
      if (!item) { $('gGreeting').textContent = '這份禮物還在包裝中，請稍後再來'; return; }

      $('gTitle').textContent = item.title || '';
      setLines($('gGreeting'), item.greeting);
      setLines($('gBody'), item.body);
      setLines($('gClosing'), item.closing);
      $('gBody').parentElement.hidden = !item.body;
      document.title = `${item.title || '你的禮物'}｜聖誕快樂`;

      const btn = $('lineBtn');
      btn.href = item.link || typeCfg.link;
      btn.textContent = item.button || `加入「${item.channel || typeCfg.label}」`;
      btn.hidden = false;

      fitText();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fitText);
    }).catch(err => {
      console.error(err);
      $('gGreeting').textContent = '禮物打開失敗，請檢查網路後重新整理';
    });
  }

  // 從 bfcache 回來時清除點選動畫
  window.addEventListener('pageshow', () => document.body.classList.remove('is-picking'));

  route();
})();
