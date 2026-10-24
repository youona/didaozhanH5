/* shooter.js — 第五段：打一枪换一个地方（限时点击） */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];

  let root, field, timeEl, hitEl, msgEl, startBtn;
  let running = false, hits = 0, left = 0, raf = 0, last = 0, lastSpawn = 0;
  let goTimer = 0;

  function conf() { return DD.content.shooter; }

  function fmt(t) { return (Math.max(0, t)).toFixed(1); }

  function paint() {
    if (timeEl) timeEl.textContent = fmt(left);
    if (hitEl) hitEl.textContent = String(hits);
  }

  function spawn() {
    if (!running) return;
    const t = document.createElement('button');
    t.type = 'button';
    t.className = 'target';
    const pad = 90;
    const x = pad + Math.random() * (field.clientWidth - pad * 2);
    const y = pad + Math.random() * (field.clientHeight - pad * 2);
    t.style.left = x + 'px';
    t.style.top = y + 'px';
    t.innerHTML = '<span class="target-ring"></span><span class="target-dot"></span>';

    let alive = true;
    const life = 1150 + Math.random() * 500;
    const kill = setTimeout(function () {
      if (!alive) return;
      alive = false;
      t.classList.add('is-gone');
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);
    }, life);

    t.addEventListener('click', function () {
      if (!alive) return;
      alive = false;
      clearTimeout(kill);
      hits++;
      paint();
      t.classList.add('is-hit');
      if (DD.audio) DD.audio.gun(0.55);
      if (DD.motion) DD.motion.bump(t, { to: 1.5, duration: 300 });
      setTimeout(function () { if (t.parentNode) t.parentNode.removeChild(t); }, 260);

      if (msgEl) {
        const lines = conf().hitLines;
        msgEl.textContent = lines[Math.min(lines.length - 1, Math.floor(hits / 3))];
      }
      if (hits >= 8) finish(true);
    });

    field.appendChild(t);
  }

  function tick(now) {
    if (!running) return;
    const dt = (now - last) / 1000;
    last = now;
    left -= dt;
    if (left <= 0) {
      left = 0;
      paint();
      finish(false);
      return;
    }
    paint();

    if (now - lastSpawn > 620) {
      lastSpawn = now;
      spawn();
      if (hits > 4) spawn();
    }
    raf = requestAnimationFrame(tick);
  }

  function start() {
    if (running) return;
    running = true;
    hits = 0;
    left = conf().seconds;
    last = performance.now();
    lastSpawn = 0;
    if (startBtn) startBtn.style.display = 'none';
    if (msgEl) msgEl.textContent = '别贪枪，打完就走。';
    field.querySelectorAll('.target').forEach(function (t) { t.parentNode.removeChild(t); });
    paint();
    if (DD.audio) DD.audio.tap(0.8);
    raf = requestAnimationFrame(tick);
  }

  function finish(win) {
    if (!running && !win) return;
    running = false;
    cancelAnimationFrame(raf);
    field.querySelectorAll('.target').forEach(function (t) { t.parentNode.removeChild(t); });
    if (msgEl) {
      msgEl.innerHTML = win
        ? '命中 ' + hits + ' 个。' + conf().filmLine
        : '时间到，命中 ' + hits + ' 个。';
    }
    if (DD.audio) DD.audio.ok(0.6);
    DD.stage.markDone(5);

    // 打完了还有下半场：敌人退下去又摸回来，得敲钟把信传出去。
    // 警报模块在就交给它，不在才走原来的自动跳段，保证单独跑也不错。
    if (win && DD.extra && DD.extra.alarm && typeof DD.extra.alarm.start === 'function') {
      goTimer = setTimeout(function () {
        if (DD.stage.index === 5) DD.extra.alarm.start();
      }, 1400);
      return;
    }

    goTimer = setTimeout(function () {
      if (DD.stage.index === 5) DD.stage.go(6);
    }, win ? 2600 : 2400);
  }

  /* 离场：停掉倒计时/raf，清干净靶子和定时器，恢复初始态 */
  function leave() {
    running = false;
    cancelAnimationFrame(raf);
    clearTimeout(goTimer);
    goTimer = 0;
    if (field) field.querySelectorAll('.target').forEach(function (t) { t.parentNode.removeChild(t); });
    if (startBtn) startBtn.style.display = '';
    hits = 0;
    left = conf().seconds;
    paint();
  }

  function reset() {
    running = false;
    hits = 0;
    left = conf().seconds;
    cancelAnimationFrame(raf);
    clearTimeout(goTimer);
    goTimer = 0;
    if (field) field.querySelectorAll('.target').forEach(function (t) { t.parentNode.removeChild(t); });
    if (startBtn) startBtn.style.display = '';
    if (msgEl) msgEl.textContent = '';
    paint();
  }

  function init() {
    root = document.getElementById('shooter');
    if (!root) return;
    field = document.getElementById('shooter-field');
    timeEl = document.getElementById('shooter-time');
    hitEl = document.getElementById('shooter-hit');
    msgEl = document.getElementById('shooter-msg');
    startBtn = document.getElementById('shooter-start');
    if (startBtn) startBtn.addEventListener('click', start);
    left = conf().seconds;
    paint();

    DD.stage.on('scene', function (e) {
      if (e.reset) { reset(); return; }
      if (e.i !== 5) leave();
    });
  }

  DD.modules.push({ init: init });
})();
