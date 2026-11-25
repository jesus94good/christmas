/* =========================================================
 * 背景音樂
 * - 手機瀏覽器不允許自動播放，所以在使用者第一次碰到畫面時開始播放
 * - 右上角音符按鈕可以關掉／打開；關掉後會記住，下次進來也不自動播放
 * - 切到別的 App（例如按下加好友打開 LINE）時暫停，回來後繼續
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
  audio.src = `${C.MUSIC_SRC}?v=${C.CONTENT_VERSION}`;
  audio.volume = target;
  btn.hidden = false;

  // 音樂檔讀不到就把按鈕藏起來，不影響其他功能
  audio.addEventListener('error', () => { btn.hidden = true; stopListening(); });

  function updateButton() {
    const playing = !audio.paused;
    btn.classList.toggle('is-playing', playing);
    btn.setAttribute('aria-pressed', String(playing));
    btn.setAttribute('aria-label', playing ? '關閉背景音樂' : '播放背景音樂');
  }
  audio.addEventListener('play', updateButton);
  audio.addEventListener('pause', updateButton);

  /* 淡入（iPhone 不支援用程式調音量，會直接以原音量播放） */
  function fadeIn() {
    audio.volume = 0;
    if (audio.volume !== 0) return;          // iOS：volume 是唯讀
    const start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / 1500, 1);
      audio.volume = target * p;
      if (p < 1 && !audio.paused) requestAnimationFrame(step);
    })(start);
  }

  function play() {
    return audio.play().then(() => { fadeIn(); return true; }, () => false);
  }

  /* ---------- 第一次碰到畫面就開始播放 ---------- */
  const GESTURES = ['pointerdown', 'touchend', 'click', 'keydown'];
  function onFirstGesture(e) {
    if (btn.contains(e.target)) return;      // 點的是音符按鈕，交給按鈕自己處理
    if (store.get()) { stopListening(); return; }
    play().then(ok => { if (ok) stopListening(); });
  }
  function startListening() {
    GESTURES.forEach(t => document.addEventListener(t, onFirstGesture, { capture: true, passive: true }));
  }
  function stopListening() {
    GESTURES.forEach(t => document.removeEventListener(t, onFirstGesture, true));
  }

  if (!store.get()) {
    startListening();
    play().then(ok => { if (ok) stopListening(); });   // 電腦版瀏覽器有時允許直接播放
  }
  updateButton();

  /* ---------- 音符按鈕 ---------- */
  btn.addEventListener('click', () => {
    stopListening();
    if (audio.paused) { store.set(false); play(); }
    else { store.set(true); audio.pause(); }
  });

  /* ---------- 切到背景時暫停，回來再繼續 ---------- */
  let resumeOnShow = false;
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      resumeOnShow = !audio.paused;
      if (resumeOnShow) audio.pause();
    } else if (resumeOnShow) {
      resumeOnShow = false;
      // 有些手機回來後需要再碰一下畫面才能播放
      play().then(ok => { if (!ok && !store.get()) startListening(); });
    }
  });
})();
