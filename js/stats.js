/* stats.js — 尾段：战果结算。
   只读别人的 DOM 和 DD.stage.state.stats，不动任何既有节点；
   玩家走到第 7 段（today）600ms 后，在段容器里淡入一张旧账簿。 */
window.DD = window.DD || {};
(function () {
  const DD = window.DD;
  DD.modules = DD.modules || [];

  // 防重复引入：index.html 若两次加载本文件，第二次求值直接退出。
  if (DD.extra && DD.extra.stats && DD.extra.stats.installed) return;

  const HOLD = 600;
  const TITLE = '1942 年，冉庄守住了一次。';
  const DIRECT = '你是直接到这里的，这一路的东西还没走过。';

  let panel = null;
  let titleEl = null;
  let listEl = null;
  let timer = 0;
  let closeTimer = 0;
  let seq = 0;
  let t0 = Date.now();
  let peakHits = 0;

  /* ---------- 取数 ---------- */

  function textOf(id) {
    const el = document.getElementById(id);
    return el ? String(el.textContent || '').trim() : '';
  }

  function intOf(id, max) {
    const n = parseInt(textOf(id), 10);
    if (!isFinite(n) || n < 0) return 0;
    return max == null ? n : Math.min(max, n);
  }

  function stageStats() {
    const s = DD.stage && DD.stage.state && DD.stage.state.stats;
    return s && typeof s === 'object' ? s : {};
  }

  /* startedAt 优先；没有就用本模块自己开页的时刻兜底，并标“本局”。 */
  function timeValue() {
    const raw = stageStats().startedAt;
    let start = 0;
    if (typeof raw === 'number') {
      start = raw;
    } else if (typeof raw === 'string') {
      const n = Number(raw);
      start = isFinite(n) ? n : Date.parse(raw);
    }
    const now = Date.now();
    if (start > 0 && start <= now) return { ms: now - start, own: false };
    return { ms: t0 ? Math.max(0, now - t0) : 0, own: true };
  }

  /* 打靶模块离场时会把 #shooter-hit 归零，所以记峰值，别只在尾段读一次。 */
  function noteHits(v) {
    const n = parseInt(v, 10);
    if (isFinite(n) && n > peakHits) peakHits = n;
  }

  function watchHits() {
    const el = document.getElementById('shooter-hit');
    if (!el) return;
    noteHits(el.textContent);
    if (typeof MutationObserver !== 'function') return;
    const obs = new MutationObserver(function (records) {
      for (let i = 0; i < records.length; i++) {
        const r = records[i];
        if (r.type === 'characterData') {
          noteHits(r.oldValue);
          noteHits(r.target && r.target.data);
        } else {
          const gone = r.removedNodes || [];
          for (let k = 0; k < gone.length; k++) noteHits(gone[k].textContent);
          noteHits(el.textContent);
        }
      }
    });
    obs.observe(el, { childList: true, characterData: true, characterDataOldValue: true, subtree: true });
  }

  function read() {
    const depth = Math.max(0, Math.min(3, parseFloat(textOf('dig-depth')) || 0));
    const puzzle = intOf('puzzle-count', 7);
    const cards = document.querySelectorAll('.dcard.is-flipped').length;
    const hits = Math.max(peakHits, intOf('shooter-hit'));
    const poem = document.querySelectorAll('.poem-slot.is-filled').length;
    const mistakes = Math.max(0, parseInt(stageStats().mistakes, 10) || 0);
    const t = timeValue();
    const empty = depth < 0.05 && puzzle === 0 && cards === 0 && hits === 0 && poem === 0 && mistakes === 0;
    return {
      depth: depth,
      puzzle: puzzle,
      cards: cards,
      hits: hits,
      poem: poem,
      mistakes: mistakes,
      ms: t.ms,
      own: t.own,
      empty: empty
    };
  }

  /* ---------- 画账簿 ---------- */

  function minuteText(ms) {
    if (ms < 60000) return { num: '不到 1', unit: '分钟' };
    return { num: String(Math.floor(ms / 60000)), unit: '分钟' };
  }

  function addRow(label, num, unit, tag) {
    const row = document.createElement('div');
    row.className = 'dds-row';

    const dt = document.createElement('dt');
    dt.textContent = label;

    const dd = document.createElement('dd');
    const b = document.createElement('b');
    b.className = 'dds-num';
    b.textContent = String(num);
    dd.appendChild(b);

    if (unit) {
      const u = document.createElement('i');
      u.className = 'dds-unit';
      u.textContent = unit;
      dd.appendChild(u);
    }
    if (tag) {
      const t = document.createElement('span');
      t.className = 'dds-tag';
      t.textContent = tag;
      dd.appendChild(t);
    }

    row.appendChild(dt);
    row.appendChild(dd);
    listEl.appendChild(row);
  }

  function renderBill(v) {
    const t = minuteText(v.ms);
    titleEl.textContent = TITLE;
    panel.classList.remove('is-direct');
    listEl.innerHTML = '';
    addRow('用时', t.num, t.unit, v.own ? '（本局）' : '');
    addRow('挖到的深度', v.depth.toFixed(1), '米');
    addRow('拼上的地道', v.puzzle + ' / 7', '段');
    addRow('点开的洞口', v.cards, '个');
    addRow('命中的靶', v.hits, '个');
    addRow('补回的字', v.poem, '个');
    addRow('错误次数', v.mistakes, '次');
  }

  function renderDirect() {
    listEl.innerHTML = '';
    titleEl.textContent = DIRECT;
    panel.classList.add('is-direct');
  }

  function build() {
    if (panel) return;
    const scene = document.querySelector('.scene[data-i="7"]');
    if (!scene) return;

    const el = document.createElement('aside');
    el.className = 'dds is-off';
    el.id = 'dd-stats';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.setAttribute('aria-label', '战果结算');
    el.setAttribute('aria-hidden', 'true');
    el.innerHTML =
      '<div class="dds-top">' +
        '<span class="dds-kicker">战果</span>' +
        '<span class="dds-top-rule" aria-hidden="true"></span>' +
        '<button class="dds-close" type="button" aria-label="合上战果结算">合上</button>' +
      '</div>' +
      '<p class="dds-title"></p>' +
      '<dl class="dds-list"></dl>' +
      '<p class="dds-note">以上数字来自你这一路的选择，不是史实战绩</p>';

    scene.appendChild(el);
    panel = el;
    titleEl = el.querySelector('.dds-title');
    listEl = el.querySelector('.dds-list');

    // 点一下就收起，不弹窗、不挡后面的海报按钮
    el.addEventListener('click', function (ev) {
      ev.stopPropagation();
      close();
    });
    const btn = el.querySelector('.dds-close');
    if (btn) {
      btn.addEventListener('click', function (ev) {
        ev.stopPropagation();
        close();
      });
    }
  }

  /* ---------- 出现 / 收起 ---------- */

  function flash() {
    timer = 0;
    if (!panel || !DD.stage || DD.stage.index !== 7) return;

    const v = read();
    if (v.empty) renderDirect();
    else renderBill(v);

    clearTimeout(closeTimer);
    closeTimer = 0;
    panel.classList.remove('is-off', 'is-closing');
    panel.removeAttribute('aria-hidden');
    // 先落回初始 opacity:0，再挂 is-on，保证每次都是淡入
    void panel.offsetWidth;
    panel.classList.add('is-on');
    if (DD.audio) DD.audio.page(0.55);
  }

  function schedule() {
    clearTimeout(timer);
    const mine = ++seq;
    timer = setTimeout(function () {
      if (mine !== seq) return;
      flash();
    }, HOLD);
  }

  function hideNow() {
    clearTimeout(timer);
    timer = 0;
    seq++;
    clearTimeout(closeTimer);
    closeTimer = 0;
    if (!panel) return;
    panel.classList.remove('is-on', 'is-closing');
    panel.classList.add('is-off');
    panel.setAttribute('aria-hidden', 'true');
  }

  function close() {
    if (!panel || !panel.classList.contains('is-on')) return;
    clearTimeout(timer);
    timer = 0;
    seq++;
    panel.classList.remove('is-on');
    panel.classList.add('is-closing');
    if (DD.audio) DD.audio.tap(0.6);
    clearTimeout(closeTimer);
    closeTimer = setTimeout(function () {
      closeTimer = 0;
      if (!panel) return;
      if (!panel.classList.contains('is-on')) {
        panel.classList.add('is-off');
        panel.setAttribute('aria-hidden', 'true');
      }
      panel.classList.remove('is-closing');
    }, 640);
  }

  function reset() {
    hideNow();
    t0 = Date.now();
    peakHits = 0;
    // 本局簿记归零；stage.js 以后若补 stats，也一并从这一刻重新计
    const s = stageStats();
    if (s) {
      s.startedAt = Date.now();
      s.mistakes = 0;
    }
  }

  /* ---------- 接线 ---------- */

  function onScene(e) {
    if (!e) return;
    if (e.reset) {
      reset();
      return;
    }
    const tail = e.i === 7 || (e.el && e.el.dataset && e.el.dataset.key === 'today');
    if (!tail) {
      hideNow();
      return;
    }
    build();
    if (!panel) return;
    if (panel.classList.contains('is-on')) return;
    schedule();
  }

  function init() {
    build();
    watchHits();
    DD.stage.on('scene', onScene);
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') close();
    });
    // 正常启动时这里是 -1；只有后挂脚本/手工 init 时才会已经是 7
    if (DD.stage && DD.stage.index === 7) schedule();
  }

  DD.modules.push({ init: init });
  DD.extra = DD.extra || {};
  DD.extra.stats = { show: flash, close: close, read: read, installed: true };
})();
