/* =========================================================
 * 背景音樂
 * - 手機瀏覽器不允許自動播放，所以在使用者第一次點到畫面時開始播放
 * - 右上角音符按鈕可以關掉／打開；關掉後會記住，下次進來也不自動播放
 * - 切到別的 App（例如按下加好友打開 LINE）時暫停，回來後繼續
 *
 * 穩定播放的重點：
 * - 按下播放後，音樂要先下載一小段才會出聲。這段時間按鈕會顯示「載入中」
 *   （外圈轉動），不會誤以為沒反應而再按一次，把正在準備的播放取消掉
 * - 網路不穩讀取失敗時，會自動從原本的位置重試
 * ========================================================= */
(function () {
  const C = window.APP_CONFIG;
  const audio = document.getElementById('bgm');
  const btn = document.getElementById('musicBtn');
  if (!C.MUSIC_SRC || !audio || !btn) return;

  const PREF_KEY = 'xmas-bgm-off';
  const store = {
    get() { try { return localStorage.getItem(PREF_KEY) === '1'; } catch (e) { return false; } },
    set(off) { try { off ? localStorage.setItem(PREF_KEY, '1') : localStorage.removeItem(PREF_KEY); } catch (e) {} },
  };

  const target = C.MUSIC_VOLUME ?? 0.6;
  audio.preload = 'auto';                  // 頁面一打開就先下載開頭，點下去時能更快出聲
  audio.src = `${C.MUSIC_SRC}?v=${C.CONTENT_VERSION}`;
  audio.volume = target;
  btn.hidden = false;

  let wantOn = !store.get();   // 使用者想不想聽
  let pending = false;         // 已經按了播放，正在等音樂出聲
  let playing = false;         // 真的有聲音在播
  let retries = 0;

  /* ---------- 按鈕外觀：播放中／載入中／關閉 ---------- */
  function render() {
    const loading = wantOn && !playing && pending;
    btn.classList.toggle('is-playing', wantOn && playing);
    btn.classList.toggle('is-loading', loading);
    const on = wantOn && (playing || pending);
    btn.setAttribute('aria-pressed', String(on));
    btn.setAttribute('aria-label', on ? '關閉背景音樂' : '播放背景音樂');
  }

  audio.addEventListener('playing', () => { playing = true; pending = false; retries = 0; render(); });
  audio.addEventListener('waiting', () => { playing = false; pending = true; render(); });
  audio.addEventListener('pause',   () => { playing = false; render(); });

  /* 淡入（iPhone 不支援用程式調音量，會直接以原音量播放） */
  let fadeToken = 0;
  function fadeIn() {
    const token = ++fadeToken;
    audio.volume = 0;
    if (audio.volume !== 0) return;          // iOS：volume 是唯讀
    const start = performance.now();
    (function step(now) {
      if (token !== fadeToken) return;
      const p = Math.min((now - start) / 1500, 1);
      audio.volume = target * p;
      if (p < 1 && !audio.paused) requestAnimationFrame(step);
      else audio.volume = target;
    })(start);
  }

  /* ---------- 開始／停止 ---------- */
  function start(fromGesture) {
    wantOn = true;
    if (playing) return;
    if (pending && !fromGesture) return;     // 已經在準備中；但若是使用者剛點的，一定要在這次點擊裡呼叫播放
    pending = true;
    render();
    let p;
    try { p = audio.play(); } catch (e) { p = Promise.reject(e); }
    Promise.resolve(p).then(() => {
      pending = false;
      stopListening();
      if (!wantOn) { audio.pause(); return; } // 等待期間使用者按了關閉
      fadeIn();
      render();
    }, err => {
      pending = false;
      render();
      if (err && err.name === 'AbortError') return;          // 是我們自己暫停的，不算失敗
      if (wantOn) startListening();                           // 瀏覽器還不允許：等下一次點畫面
    });
  }

  function stop() {
    wantOn = false;
    pending = false;
    fadeToken++;
    audio.pause();
    render();
  }

  /* 網路不穩讀取失敗：從原本的位置重試，最多 3 次 */
  audio.addEventListener('error', () => {
    if (!wantOn || retries >= 3) { if (retries >= 3) btn.hidden = true; pending = false; render(); return; }
    retries++;
    const at = audio.currentTime || 0;
    setTimeout(() => {
      audio.load();
      const resume = () => { try { audio.currentTime = at; } catch (e) {} };
      audio.addEventListener('loadedmetadata', resume, { once: true });
      pending = false;
      start();
    }, 800 * retries);
  });

  /* ---------- 第一次點到畫面就開始播放 ----------
   * 手機只把「點擊」算成同意出聲（按下手指的瞬間還不算），所以聽 touchend／click */
  const GESTURES = ['touchend', 'click', 'keydown'];
  function onFirstGesture(e) {
    if (btn.contains(e.target)) return;      // 點的是音符按鈕，交給按鈕自己處理
    if (!wantOn || store.get()) { stopListening(); return; }
    start(true);
  }
  function startListening() {
    GESTURES.forEach(t => document.addEventListener(t, onFirstGesture, { capture: true, passive: true }));
  }
  function stopListening() {
    GESTURES.forEach(t => document.removeEventListener(t, onFirstGesture, true));
  }

  if (wantOn) {
    startListening();
    start();                                 // 電腦版瀏覽器有時允許直接播放
  }
  render();

  /* ---------- 音符按鈕 ---------- */
  btn.addEventListener('click', () => {
    stopListening();
    if (wantOn && (playing || pending)) { store.set(true); stop(); }
    else { store.set(false); start(true); }
  });

  /* ---------- 切到背景時暫停，回來再繼續 ---------- */
  let resumeOnShow = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeOnShow = wantOn && (playing || pending);
      if (resumeOnShow) { fadeToken++; pending = false; audio.pause(); }
    } else if (resumeOnShow) {
      resumeOnShow = false;
      start();                               // 有些手機回來後需要再點一下畫面，會自動等下一次點擊
    }
  });
})();
