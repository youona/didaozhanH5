/* alarm.js — 警报传递：打靶之后，敌人摸上来，要在节拍上敲钟把信传出去
   由 shooter.js 在 markDone(5) 之后调用 DD.extra.alarm.start()，成功后自己 go(6)。 */
(function () {
  var DD = window.DD;
  if (!DD) return;

  var TOTAL = 8;        // 八拍
  var NEED = 6;         // 命中六拍算传出去
  var GAP = 700;        // 拍间隔
  var TRAVEL = 2100;    // 从右侧走到判定线的时间（毫秒）
  var WINDOW = 240;     // 判定容差（±毫秒）

  var layer = null, track = null, lane = null, countEl = null, msgEl = null, askEl = null;
  var running = false;
  var raf = 0, t0 = 0, spawned = 0, hits = 0, notes = [], goTimer = 0;

  function el(tag, cls, text) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (text != null) n.textContent = text;
    return n;
  }

  function ensure() {
    var host = document.querySelector('.scene[data-i="5"]');
    if (!host) return false;
    if (layer && host.contains(layer)) return true;

    layer = el('div', 'alarm');
    layer.setAttribute('aria-hidden', 'true');

    askEl = el('div', 'alarm-ask');
    askEl.appendChild(el('p', 'alarm-tip', '敌人退下去又摸回来了。村口的铃就在你手边。'));
    askEl.appendChild(el('p', 'alarm-sub', '跟着节拍敲：点画面，或者按空格。敲偏了，信就断在半路。'));
    var goBtn = el('button', 'btn alarm-go', '开始传信');
    goBtn.type = 'button';
    askEl.appendChild(goBtn);
    layer.appendChild(askEl);

    track = el('div', 'alarm-track');
    track.appendChild(el('div', 'alarm-line'));
    lane = el('div', 'alarm-lane');
    track.appendChild(lane);
    track.appendChild(el('div', 'alarm-bell', '铃'));
    layer.appendChild(track);

    countEl = el('div', 'alarm-count');
    countEl.innerHTML = '<b>0</b> / ' + NEED;
    layer.appendChild(countEl);

    msgEl = el('div', 'alarm-msg', '');
    layer.appendChild(msgEl);

    host.appendChild(layer);

    goBtn.addEventListener('click', function (ev) {
      ev.stopPropagation();
      begin();
    });
    layer.addEventListener('pointerdown', function (ev) {
      if (ev.target === goBtn) return;
      if (!running) return;
      ev.preventDefault();
      hit();
    });

    return true;
  }

  function judgeX() {
    var r = track.getBoundingClientRect();
    return r.width * 0.16;   // 判定线在左侧 16%
  }

  function spawnNote(i) {
    var n = el('div', 'alarm-note');
    lane.appendChild(n);
    var note = { i: i, at: t0 + GAP * i + TRAVEL, done: false, node: n };
    notes.push(note);

    var dist = lane.clientWidth - judgeX();
    n.animate([
      { transform: 'translateX(' + lane.clientWidth + 'px)' },
      { transform: 'translateX(' + judgeX() + 'px)' }
    ], { duration: TRAVEL + GAP * i, easing: 'linear', fill: 'both' });
    return note;
  }

  function hit() {
    if (!running) return;
    var now = performance.now();
    var best = null, bestDiff = 1e9;
    for (var k = 0; k < notes.length; k++) {
      var n = notes[k];
      if (n.done) continue;
      var d = Math.abs(n.at - now);
      if (d < bestDiff) { bestDiff = d; best = n; }
    }
    if (best && bestDiff <= WINDOW) {
      best.done = true;
      hits++;
      best.node.classList.add('is-hit');
      countEl.innerHTML = '<b>' + hits + '</b> / ' + NEED;
      if (DD.audio) DD.audio.bell();
      msgEl.textContent = bestDiff < 90 ? '正着。' : '赶上了。';
      if (hits >= NEED && running) finish(true);
    } else {
      if (DD.audio) DD.audio.wrong();
      if (DD.stage && DD.stage.mistake) DD.stage.mistake(1);
      msgEl.textContent = '这一下敲空了。';
      layer.classList.remove('is-miss');
      void layer.offsetWidth;
      layer.classList.add('is-miss');
    }
  }

  function tick() {
    if (!running) return;
    var now = performance.now();
    var elapsed = now - t0;
    var shouldHave = Math.min(TOTAL, Math.floor(elapsed / GAP) + 1);
    while (spawned < shouldHave) { spawnNote(spawned); spawned++; }
    if (elapsed > GAP * (TOTAL - 1) + TRAVEL + WINDOW) { finish(hits >= NEED); return; }
    raf = requestAnimationFrame(tick);
  }

  function open() {
    if (!ensure()) return;
    reset();
    layer.classList.add('is-live');
    layer.classList.remove('is-over');
    askEl.classList.remove('is-off');
    track.classList.remove('is-on');
    countEl.classList.remove('is-on');
    msgEl.textContent = '';
  }

  function begin() {
    if (!ensure()) return;
    reset();
    running = true;
    layer.classList.add('is-live');
    askEl.classList.add('is-off');
    track.classList.add('is-on');
    countEl.classList.add('is-on');
    msgEl.textContent = '';
    t0 = performance.now() + 700;   // 留一拍给玩家反应
    raf = requestAnimationFrame(tick);
  }

  function finish(ok) {
    running = false;
    cancelAnimationFrame(raf);
    track.classList.remove('is-on');
    countEl.classList.remove('is-on');
    layer.classList.add('is-over');
    if (ok) {
      if (DD.audio) DD.audio.ok();
      msgEl.textContent = '钟声一站一站传下去，邻村的人听见了。';
      goTimer = setTimeout(function () {
        if (DD.stage && DD.stage.index === 5) DD.stage.go(6);
      }, 2400);
    } else {
      if (DD.audio) DD.audio.wrong();
      msgEl.textContent = '信断在半路——敌人已经摸到了村口。';
      if (DD.stage && DD.stage.index === 5) {
        goTimer = setTimeout(function () {
          if (DD.stage.index === 5) DD.stage.go(6);
        }, 2600);
      }
    }
  }

  function reset() {
    running = false;
    cancelAnimationFrame(raf);
    clearTimeout(goTimer);
    goTimer = 0;
    hits = 0;
    spawned = 0;
    notes = [];
    if (!layer) return;
    layer.classList.remove('is-live', 'is-over', 'is-miss');
    if (lane) lane.innerHTML = '';
    if (countEl) { countEl.innerHTML = '<b>0</b> / ' + NEED; countEl.classList.remove('is-on'); }
    if (track) track.classList.remove('is-on');
    if (askEl) askEl.classList.remove('is-off');
    if (msgEl) msgEl.textContent = '';
  }

  function init() {
    DD.stage.on('scene', function (e) {
      if (e.i !== 5) {
        if (running) reset();
        return;
      }
      reset();
      if (e.reset) return;
      ensure();
    });

    document.addEventListener('keydown', function (e) {
      if (!running) return;
      if (e.code === 'Space' || e.key === ' ') {
        e.preventDefault();
        hit();
      }
    });
  }

  DD.extra = DD.extra || {};
  DD.extra.alarm = { start: open, open: open, begin: begin, reset: reset };
  DD.modules = DD.modules || [];
  DD.modules.push({ init: init });
})();
