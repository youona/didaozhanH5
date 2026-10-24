/* puzzle.js — 第二段：七段地道拖进图里拼成十字街 */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];

  const W = 1200;
  const H = 560;

  const SEGMENTS = [
    { id: 'p1', d: 'M600 74 L600 280', label: '十字街 · 北' },
    { id: 'p2', d: 'M600 280 L950 280', label: '十字街 · 东' },
    { id: 'p3', d: 'M600 280 L600 486', label: '十字街 · 南' },
    { id: 'p4', d: 'M600 280 L250 280', label: '十字街 · 西' },
    { id: 'p5', d: 'M600 404 L430 512 L296 512', label: '南支线' },
    { id: 'p6', d: 'M600 168 L786 82', label: '北支线' },
    { id: 'p7', d: 'M862 280 L1006 196 L1116 196', label: '通村口' }
  ];

  let svg, tray, countEl, hintEl;
  let placed = Object.create(null);
  let total = 0;
  let finished = false;
  let ghost = null;
  let active = null;
  let goTimer = 0;

  function ns(tag) {
    return document.createElementNS('http://www.w3.org/2000/svg', tag);
  }

  function makeSvgLine(d, cls) {
    const p = ns('path');
    p.setAttribute('d', d);
    p.setAttribute('class', cls);
    p.setAttribute('fill', 'none');
    p.setAttribute('stroke-linecap', 'round');
    p.setAttribute('stroke-linejoin', 'round');
    return p;
  }

  function buildSvg() {
    svg.innerHTML = '';
    const defs = ns('defs');
    const glow = ns('filter');
    glow.setAttribute('id', 'pz-glow');
    glow.setAttribute('x', '-40%');
    glow.setAttribute('y', '-40%');
    glow.setAttribute('width', '180%');
    glow.setAttribute('height', '180%');
    const blur = ns('feGaussianBlur');
    blur.setAttribute('stdDeviation', '7');
    blur.setAttribute('result', 'b');
    const merge = ns('feMerge');
    const m1 = ns('feMergeNode'); m1.setAttribute('in', 'b');
    const m2 = ns('feMergeNode'); m2.setAttribute('in', 'SourceGraphic');
    merge.appendChild(m1); merge.appendChild(m2);
    glow.appendChild(blur); glow.appendChild(merge);
    defs.appendChild(glow);
    svg.appendChild(defs);

    // 内容整体放大，让地图铺满可视区（拖拽落点判断只看 svg 外框，不受影响）
    const inner = ns('g');
    inner.setAttribute('class', 'pz-inner');
    inner.setAttribute('transform', 'translate(600 280) scale(1.36 1) translate(-600 -280)');
    svg.appendChild(inner);

    // 底图：完整网，暗色虚线，给人一个位置参照
    SEGMENTS.forEach(function (s) {
      const base = makeSvgLine(s.d, 'pz-base');
      inner.appendChild(base);
    });

    // ---- 村庄底图：街巷 · 院落 · 树 · 井 · 炮楼 · 标注 ----
    // 参照冉庄平面：十字街贯穿，房屋沿街成排，村外庄稼地与炮楼。
    // 全部挂在 pz-map 下，只做底衬，不参与交互。
    const map = ns('g');
    map.setAttribute('class', 'pz-map');

    // 村外庄稼地：几道田垄弧线
    [[168, 128, 336, 118], [168, 468, 336, 470], [884, 116, 1150, 126], [884, 476, 1150, 466],
     [168, 158, 330, 150], [168, 496, 330, 498], [890, 150, 1150, 158], [890, 506, 1150, 496]].forEach(function (c) {
      const p = ns('path');
      p.setAttribute('d', 'M' + c[0] + ' ' + c[1] + ' Q' + ((c[0] + c[2]) / 2) + ' ' + (c[1] - 22) + ' ' + c[2] + ' ' + c[3]);
      p.setAttribute('class', 'pz-field');
      map.appendChild(p);
    });

    // 街巷
    ['M252 280 L1116 280', 'M600 74 L600 512', 'M380 204 L380 378', 'M762 160 L762 400',
     'M470 160 L470 244', 'M700 318 L700 420', 'M840 210 L840 350'].forEach(function (d) {
      const p = ns('path');
      p.setAttribute('d', d);
      p.setAttribute('class', 'pz-street');
      map.appendChild(p);
    });

    // 院落：沿街成排，[x, y, w, h]
    const HOUSES = [
      [432, 182, 34, 20], [476, 178, 30, 22], [514, 184, 36, 18], [558, 180, 28, 20], [596, 176, 32, 22],
      [430, 236, 30, 18], [472, 240, 34, 16], [514, 234, 28, 20], [556, 238, 32, 18],
      [434, 320, 32, 18], [476, 316, 28, 20], [518, 322, 34, 16], [560, 318, 30, 20],
      [432, 376, 34, 18], [476, 380, 30, 16], [518, 374, 28, 20], [558, 378, 32, 18],
      [640, 196, 20, 28], [664, 200, 18, 26], [688, 192, 22, 30],
      [640, 330, 18, 30], [664, 336, 22, 26], [690, 328, 20, 28],
      [300, 208, 20, 30], [326, 214, 18, 26],
      [300, 330, 22, 28], [326, 338, 18, 26],
      [782, 356, 24, 18], [808, 360, 20, 16],
      [880, 250, 26, 18], [906, 246, 22, 20], [930, 254, 24, 16],
      [852, 320, 22, 26], [878, 326, 18, 24],
      [946, 330, 20, 22], [972, 336, 24, 18],
      [186, 248, 22, 18], [212, 320, 20, 20], [178, 364, 24, 16]
    ];
    HOUSES.forEach(function (h) {
      const r = ns('rect');
      r.setAttribute('x', h[0]);
      r.setAttribute('y', h[1]);
      r.setAttribute('width', h[2]);
      r.setAttribute('height', h[3]);
      r.setAttribute('class', 'pz-house');
      map.appendChild(r);
      const horizontal = h[2] >= h[3];
      const ridge = ns('path');
      ridge.setAttribute('d', horizontal
        ? 'M' + h[0] + ' ' + (h[1] + h[3] / 2) + ' L' + (h[0] + h[2]) + ' ' + (h[1] + h[3] / 2)
        : 'M' + (h[0] + h[2] / 2) + ' ' + h[1] + ' L' + (h[0] + h[2] / 2) + ' ' + (h[1] + h[3]));
      ridge.setAttribute('class', 'pz-house-ridge');
      map.appendChild(ridge);
    });

    // 树（椭圆校正 .735 抵消横向拉伸，看起来还是圆的）
    [[396, 160, 9], [540, 148, 7], [644, 148, 8], [420, 412, 8], [600, 432, 9], [742, 420, 7], [300, 262, 8], [886, 302, 7], [212, 300, 6]].forEach(function (t) {
      const e = ns('ellipse');
      e.setAttribute('cx', t[0]);
      e.setAttribute('cy', t[1]);
      e.setAttribute('rx', (t[2] * 0.735).toFixed(1));
      e.setAttribute('ry', t[2]);
      e.setAttribute('class', 'pz-tree');
      map.appendChild(e);
      const stem = ns('path');
      stem.setAttribute('d', 'M' + t[0] + ' ' + (t[1] + t[2]) + ' L' + t[0] + ' ' + (t[1] + t[2] + 7));
      stem.setAttribute('class', 'pz-tree-stem');
      map.appendChild(stem);
    });

    // 水井：双圈
    [[562, 298, 7], [700, 308, 6], [382, 252, 5]].forEach(function (w) {
      [1, 0.55].forEach(function (k) {
        const e = ns('ellipse');
        e.setAttribute('cx', w[0]);
        e.setAttribute('cy', w[1]);
        e.setAttribute('rx', (w[2] * k * 0.735).toFixed(1));
        e.setAttribute('ry', (w[2] * k).toFixed(1));
        e.setAttribute('class', 'pz-well');
        map.appendChild(e);
      });
    });

    // 村外炮楼（塔身 + 垛口 + 射击孔），画在村东，避开右栏 chips
    [[1012, 124], [1024, 402]].forEach(function (t) {
      const g = ns('g');
      const body = ns('rect');
      body.setAttribute('x', t[0] - 13);
      body.setAttribute('y', t[1] - 10);
      body.setAttribute('width', 26);
      body.setAttribute('height', 36);
      body.setAttribute('class', 'pz-tower');
      g.appendChild(body);
      const top = ns('path');
      top.setAttribute('d', 'M' + (t[0] - 15) + ' ' + (t[1] - 10) +
        ' L' + (t[0] - 15) + ' ' + (t[1] - 21) +
        ' L' + (t[0] - 6) + ' ' + (t[1] - 21) +
        ' L' + (t[0] - 6) + ' ' + (t[1] - 14) +
        ' L' + (t[0] + 6) + ' ' + (t[1] - 14) +
        ' L' + (t[0] + 6) + ' ' + (t[1] - 21) +
        ' L' + (t[0] + 15) + ' ' + (t[1] - 21) +
        ' L' + (t[0] + 15) + ' ' + (t[1] - 10) + ' Z');
      top.setAttribute('class', 'pz-tower');
      g.appendChild(top);
      const hole = ns('rect');
      hole.setAttribute('x', t[0] - 4);
      hole.setAttribute('y', t[1] + 6);
      hole.setAttribute('width', 8);
      hole.setAttribute('height', 9);
      hole.setAttribute('class', 'pz-tower-hole');
      g.appendChild(hole);
      map.appendChild(g);
    });

    // 地名标注（scale(.735 1) 抵消横向拉伸，字才不会扁）
    [['十字街', 606, 264], ['炮 楼', 1044, 122], ['庄稼地', 300, 452], ['村 口', 1082, 300]].forEach(function (l) {
      const t = ns('text');
      t.setAttribute('class', 'pz-label');
      t.setAttribute('transform', 'translate(' + l[1] + ' ' + l[2] + ') scale(.735 1)');
      t.textContent = l[0];
      map.appendChild(t);
    });

    inner.appendChild(map);

    // 十字街中心点
    const hub = ns('circle');
    hub.setAttribute('cx', '600');
    hub.setAttribute('cy', '280');
    hub.setAttribute('r', '9');
    hub.setAttribute('class', 'pz-hub');
    inner.appendChild(hub);

    // 七段
    SEGMENTS.forEach(function (s) {
      const g = ns('g');
      g.setAttribute('class', 'pz-piece');
      g.dataset.id = s.id;
      const p = makeSvgLine(s.d, 'pz-line');
      g.appendChild(p);
      inner.appendChild(g);
    });
  }

  function buildTray() {
    tray.innerHTML = '';
    SEGMENTS.forEach(function (s) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'pz-chip';
      b.dataset.id = s.id;
      b.innerHTML = '<span class="pz-chip-dot"></span><span class="pz-chip-txt">' + s.label + '</span>';
      b.addEventListener('pointerdown', function (e) { startDrag(e, s, b); });
      b.addEventListener('click', function (e) {
        if (e.detail === 0) place(s.id);
      });
      tray.appendChild(b);
    });
  }

  function startDrag(e, s, btn) {
    if (placed[s.id] || finished) return;
    e.preventDefault();
    active = { s: s, btn: btn, sx: e.clientX, sy: e.clientY };
    ghost = btn.cloneNode(true);
    ghost.classList.add('pz-ghost');
    document.body.appendChild(ghost);
    moveGhost(e.clientX, e.clientY);

    window.addEventListener('pointermove', dragMove, { passive: true });
    window.addEventListener('pointerup', dragUp);
    window.addEventListener('pointercancel', dragUp);
  }

  function moveGhost(x, y) {
    if (!ghost) return;
    ghost.style.left = x + 'px';
    ghost.style.top = y + 'px';
  }

  function dragMove(e) {
    moveGhost(e.clientX, e.clientY);
  }

  function dragUp(e) {
    window.removeEventListener('pointermove', dragMove);
    window.removeEventListener('pointerup', dragUp);
    window.removeEventListener('pointercancel', dragUp);
    if (ghost && ghost.parentNode) ghost.parentNode.removeChild(ghost);
    ghost = null;
    if (!active) return;
    const s = active.s;
    const sx = active.sx;
    const sy = active.sy;
    active = null;

    const cx = typeof e.clientX === 'number' ? e.clientX : sx;
    const cy = typeof e.clientY === 'number' ? e.clientY : sy;
    const r = svg.getBoundingClientRect();
    const inside = cx >= r.left - 40 && cx <= r.right + 40 && cy >= r.top - 40 && cy <= r.bottom + 40;
    const tiny = Math.abs(cx - sx) < 6 && Math.abs(cy - sy) < 6;

    if (inside || tiny) place(s.id);
  }

  function place(id) {
    if (placed[id] || finished) return;
    placed[id] = true;
    total++;

    const g = svg.querySelector('.pz-piece[data-id="' + id + '"]');
    if (g) {
      g.classList.add('is-on');
      const p = g.querySelector('path');
      if (p) {
        const len = p.getTotalLength();
        p.style.strokeDasharray = len + ' ' + len;
        p.style.strokeDashoffset = String(len);
        requestAnimationFrame(function () {
          p.style.transition = 'stroke-dashoffset .95s cubic-bezier(.23,.65,.27,1)';
          p.style.strokeDashoffset = '0';
        });
      }
      if (DD.motion) DD.motion.bump(g, { to: 1.06, duration: 420 });
    }

    const chip = tray.querySelector('.pz-chip[data-id="' + id + '"]');
    if (chip) {
      chip.classList.add('is-placed');
      chip.disabled = true;
    }

    if (DD.audio) DD.audio.tap(0.8);
    if (countEl) countEl.textContent = String(total);

    if (total >= SEGMENTS.length) complete();
  }

  // 拼成之后，一道光从十字街口沿着每条路往外跑
  function sparks() {
    const lines = svg.querySelectorAll('.pz-line');
    if (!lines.length) return;
    Array.prototype.forEach.call(lines, function (p, i) {
      let len = 0;
      try { len = p.getTotalLength(); } catch (err) { return; }
      if (!len) return;
      const s = p.cloneNode(false);
      s.setAttribute('class', 'pz-spark');
      s.style.strokeDasharray = '42 ' + (len + 42);
      s.style.strokeDashoffset = String(len + 42);
      p.parentNode.appendChild(s);
      const an = s.animate([
        { strokeDashoffset: String(len + 42) },
        { strokeDashoffset: '-42' }
      ], { duration: 1550, delay: i * 90, easing: 'ease-in-out', fill: 'both' });
      an.onfinish = function () { setTimeout(function () { s.remove(); }, 240); };
    });
  }

  function complete() {
    if (finished) return;
    finished = true;
    const hub = svg.querySelector('.pz-hub');
    if (hub) hub.classList.add('is-lit');
    const box = document.getElementById('puzzle');
    if (box) box.classList.add('is-complete');
    if (hintEl) hintEl.textContent = DD.content.puzzle.done;
    if (DD.audio) { DD.audio.bell(0.6); DD.audio.ok(0.8); }
    sparks();
    DD.stage.markDone(2);
    goTimer = setTimeout(function () {
      if (DD.stage.index === 2) DD.stage.go(3);
    }, 2200);
  }

  function reset() {
    clearTimeout(goTimer);
    goTimer = 0;
    finished = false;
    placed = Object.create(null);
    total = 0;
    if (countEl) countEl.textContent = '0';
    if (hintEl) hintEl.textContent = '把七段地道拖进图里，拼成十字街那张网';
    const box = document.getElementById('puzzle');
    if (box) box.classList.remove('is-complete');
    svg.querySelectorAll('.pz-piece').forEach(function (g) {
      g.classList.remove('is-on');
      const p = g.querySelector('path');
      if (p) { p.style.transition = 'none'; p.style.strokeDasharray = ''; p.style.strokeDashoffset = ''; }
    });
    const hub = svg.querySelector('.pz-hub');
    if (hub) hub.classList.remove('is-lit');
    tray.querySelectorAll('.pz-chip').forEach(function (c) { c.classList.remove('is-placed'); c.disabled = false; });
  }

  function init() {
    svg = document.getElementById('puzzle-svg');
    tray = document.getElementById('puzzle-tray');
    countEl = document.getElementById('puzzle-count');
    hintEl = document.getElementById('puzzle-hint');
    if (!svg || !tray) return;
    buildSvg();
    buildTray();

    DD.stage.on('scene', function (e) {
      if (e.reset) { reset(); return; }
      if (e.i !== 2) { clearTimeout(goTimer); goTimer = 0; }
    });
  }

  DD.modules.push({ init: init });
})();
