/* stage.js — 分段切换、进度、导航、事件总线 */
(function () {
  const DD = (window.DD = window.DD || {});
  const KEY = 'didao-ds.v1';
  const TOTAL = 8;

  const listeners = Object.create(null);
  let scenes = [];
  let cur = -1;
  let state = { done: [], last: 0, muted: false, stats: { startedAt: 0, mistakes: 0 } };

  function on(name, fn) {
    (listeners[name] || (listeners[name] = [])).push(fn);
    return function () {
      const a = listeners[name] || [];
      const k = a.indexOf(fn);
      if (k >= 0) a.splice(k, 1);
    };
  }

  function emit(name, payload) {
    const a = listeners[name] || [];
    for (let i = 0; i < a.length; i++) {
      try { a[i](payload); } catch (e) { console.warn('[stage]', name, e); }
    }
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      if (s && typeof s === 'object') {
        state.done = Array.isArray(s.done) ? s.done : [];
        state.last = typeof s.last === 'number' ? s.last : 0;
        state.muted = !!s.muted;
        if (s.stats && typeof s.stats === 'object') {
          const t = Number(s.stats.startedAt);
          const m = Number(s.stats.mistakes);
          state.stats.startedAt = isFinite(t) && t > 0 ? t : 0;
          state.stats.mistakes = isFinite(m) && m >= 0 ? m : 0;
        }
      }
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {}
  }

  function markDone(i) {
    if (state.done.indexOf(i) < 0) {
      state.done.push(i);
      save();
    }
    const dot = document.querySelector('.nav-dots li[data-i="' + i + '"]');
    if (dot) dot.classList.add('is-done');
  }

  /* 记一次失误（放错位置、敲空铃……）。只做累加，不惩罚，结算页要用。 */
  function mistake(n) {
    const k = Number(n);
    state.stats.mistakes += isFinite(k) && k > 0 ? k : 1;
    save();
  }

  /* 重开一局：进度、用时、失误一起清零 */
  function resetStats() {
    state.stats = { startedAt: Date.now(), mistakes: 0 };
    save();
  }

  function updateNav() {
    const dots = document.querySelectorAll('.nav-dots li');
    dots.forEach(function (li) {
      const i = Number(li.dataset.i);
      li.classList.toggle('is-active', i === cur);
      li.classList.toggle('is-done', state.done.indexOf(i) >= 0);
    });
    const prev = document.getElementById('nav-prev');
    const next = document.getElementById('nav-next');
    if (prev) prev.disabled = cur <= 0;
    if (next) next.disabled = cur >= TOTAL - 1;
    const nav = document.getElementById('nav');
    if (nav) nav.classList.toggle('is-on', cur > 0 || state.done.length > 0);
  }

  function buildNav() {
    const ol = document.getElementById('nav-dots');
    if (!ol) return;
    ol.innerHTML = '';
    for (let i = 0; i < TOTAL; i++) {
      const li = document.createElement('li');
      li.dataset.i = String(i);
      const b = document.createElement('button');
      b.type = 'button';
      b.setAttribute('aria-label', '第 ' + (i + 1) + ' 段');
      b.addEventListener('click', function () { go(i); });
      li.appendChild(b);
      ol.appendChild(li);
    }
  }

  function enterScene(el) {
    const items = el.querySelectorAll(
      '.sc-kicker, .sc-title, .sc-lede, .sc-src, .dig, .puzzle, .cards, .cards-hint, .quiz, .shooter, .poem, .poster-wrap, .poster-note, .btn--enter'
    );
    if (DD.motion) DD.motion.stagger(items, { step: 70, dy: 26, duration: 760 });
  }

  function go(i, opts) {
    const o = opts || {};
    i = Math.max(0, Math.min(TOTAL - 1, i | 0));
    if (i === cur) return;
    const prev = scenes[cur];
    const next = scenes[i];
    if (!next) return;

    if (prev) prev.classList.remove('is-active');
    next.classList.add('is-active');
    if (next.dataset.key) document.body.dataset.scene = next.dataset.key;
    cur = i;

    state.last = i;
    save();
    updateNav();

    if (!o.silent) {
      if (DD.audio) DD.audio.page(0.6);
      enterScene(next);
    }
    emit('scene', { i: i, el: next, prev: prev });
  }

  function init() {
    scenes = Array.prototype.slice.call(document.querySelectorAll('.scene'));
    buildNav();
    load();
    if (!state.stats.startedAt) {
      state.stats.startedAt = Date.now();
      save();
    }

    const dots = document.querySelectorAll('.nav-dots li');
    dots.forEach(function (li) {
      if (state.done.indexOf(Number(li.dataset.i)) >= 0) li.classList.add('is-done');
    });

    document.getElementById('nav-prev').addEventListener('click', function () { go(cur - 1); });
    document.getElementById('nav-next').addEventListener('click', function () { go(cur + 1); });

    const first = Math.max(0, Math.min(TOTAL - 1, state.last | 0));
    cur = first;
    scenes[first].classList.add('is-active');
    if (scenes[first].dataset.key) document.body.dataset.scene = scenes[first].dataset.key;
    updateNav();
  }

  function fire() {
    if (cur < 0) return;
    emit('scene', { i: cur, el: scenes[cur], prev: null });
    enterScene(scenes[cur]);
  }

  DD.stage = {
    init: init,
    fire: fire,
    go: go,
    on: on,
    emit: emit,
    markDone: markDone,
    mistake: mistake,
    resetStats: resetStats,
    get index() { return cur; },
    get total() { return TOTAL; },
    get state() { return state; },
    save: save
  };
})();
