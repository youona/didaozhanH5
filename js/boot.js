/* boot.js — 启动：舞台缩放、竖屏旋转、全局按钮、模块初始化 */
(function () {
  const DD = window.DD;
  const STAGE_W = 1672;
  const STAGE_H = 941;

  let lastPortrait = null;
  let lastW = 0;
  let lastH = 0;
  let rafId = 0;

  function viewport() {
    const de = document.documentElement;
    const vv = window.visualViewport;
    // 手机上 window.innerHeight 把地址栏也算进去，地址栏一收一放就变，
    // 用它会让舞台跟着缩放、按钮跟着跳位。以可见区域为准。
    const w = Math.round(vv && vv.width ? vv.width : (de.clientWidth || window.innerWidth));
    const h = Math.round(vv && vv.height ? vv.height : (de.clientHeight || window.innerHeight));
    return { w: w, h: h };
  }

  function fit() {
    const vp = viewport();
    const vw = vp.w;
    const vh = vp.h;
    const rotor = document.getElementById('rotor');
    const stage = document.getElementById('stage');
    if (!rotor || !stage || !vw || !vh) return;

    // 视口没真的变就别碰 DOM
    if (vw === lastW && vh === lastH) return;
    lastW = vw;
    lastH = vh;

    const portrait = vh > vw * 1.06 && vw < 1024;
    const W = portrait ? vh : vw;
    const H = portrait ? vw : vh;

    rotor.style.width = W + 'px';
    rotor.style.height = H + 'px';
    rotor.classList.toggle('is-portrait', portrait);
    document.body.classList.toggle('is-portrait', portrait);

    const s = Math.min(W / STAGE_W, H / STAGE_H);
    stage.style.transform = 'translate(-50%,-50%) scale(' + s.toFixed(4) + ')';

    const hint = document.getElementById('rotate-hint');
    if (hint) hint.classList.toggle('is-on', portrait);
    lastPortrait = portrait;
  }

  function scheduleFit() {
    if (rafId) return;
    rafId = requestAnimationFrame(function () { rafId = 0; fit(); });
  }

  function applyMute(m) {
    if (DD.audio) DD.audio.setMuted(m);
    const btn = document.getElementById('btn-mute');
    if (btn) {
      btn.setAttribute('aria-pressed', String(!!m));
      btn.textContent = m ? '音效 关' : '音效 开';
    }
    DD.stage.state.muted = !!m;
    DD.stage.save();
  }

  function init() {
    fit();
    window.addEventListener('resize', scheduleFit, { passive: true });
    window.addEventListener('orientationchange', function () { setTimeout(fit, 260); });
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', scheduleFit, { passive: true });
    }

    // 首次交互解锁音频
    function unlock() {
      if (DD.audio) DD.audio.unlock();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    }
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });

    // 静音开关
    const muteBtn = document.getElementById('btn-mute');
    if (muteBtn) {
      muteBtn.addEventListener('click', function () { applyMute(!DD.audio.isMuted()); });
    }

    // 从头看
    const restart = document.getElementById('btn-restart');
    if (restart) {
      restart.addEventListener('click', function () {
        try { localStorage.removeItem('didao-ds.v1'); } catch (e) {}
        DD.stage.state.done = [];
        DD.stage.state.last = 0;
        if (DD.stage.resetStats) DD.stage.resetStats();
        document.querySelectorAll('.nav-dots li').forEach(function (li) { li.classList.remove('is-done'); });
        DD.stage.go(0, { silent: true });
        DD.stage.emit('scene', { i: 0, el: document.querySelector('.scene[data-i="0"]'), prev: null, reset: true });
      });
    }

    // 进村
    const enter = document.getElementById('btn-enter');
    if (enter) {
      enter.addEventListener('click', function () {
        if (DD.audio) DD.audio.bell(0.55);
        DD.stage.markDone(0);
        DD.stage.go(1);
      });
    }

    // 走到尾段也算完成，首尾两个圆点才会亮
    DD.stage.on('scene', function (e) {
      if (e.i === 7) DD.stage.markDone(7);
    });

    // 键盘翻页
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') DD.stage.go(DD.stage.index + 1);
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') DD.stage.go(DD.stage.index - 1);
    });

    // 模块先注册监听
    (DD.modules || []).forEach(function (m) {
      try { if (m.init) m.init(); } catch (e) { console.warn('[module init]', e); }
    });

    DD.stage.init();

    if (DD.stage.state.muted) applyMute(true);

    DD.stage.fire();

    // #0 … #7 直接定位（截图验收 / 分享定位用）
    const h = (location.hash || '').replace(/^#/, '');
    if (/^[0-7]$/.test(h)) {
      const n = parseInt(h, 10);
      if (n !== DD.stage.index) {
        DD.stage.go(n, { silent: true });
        DD.stage.emit('scene', { i: n, el: document.querySelector('.scene[data-i="' + n + '"]'), prev: null });
      }
    }

    const loader = document.getElementById('loader');
    let hidden = false;
    function hideLoader() {
      if (hidden) return;
      hidden = true;
      if (loader) loader.classList.add('is-done');
      document.body.classList.remove('booting');
    }
    // 等图解码完再收 loader：手机上 2MB 的单文件解码比桌面慢得多，
    // 定时 260ms 就收会让人看见半张图。
    if (document.readyState === 'complete') {
      hideLoader();
    } else {
      window.addEventListener('load', hideLoader, { once: true });
      // 兜底：网慢/图坏了也别一直卡着
      setTimeout(hideLoader, 2500);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  DD.boot = { fit: fit };
})();
