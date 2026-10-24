/* dig.js — 第一段：按住拖动刨土 */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];

  let root, shaft, depthEl, hintEl, barFill, grainBox;
  let depth = 0;
  let dragging = false;
  let lastX = 0;
  let accum = 0;
  let done = false;
  let goTimer = 0;
  let grainAt = 0;

  function conf() { return DD.content.dig; }
  function T() { return conf().target; }

  // 刨土时井口甩出来的土粒
  function grains(n) {
    if (!grainBox || !shaft) return;
    const box = grainBox.getBoundingClientRect();
    const s = shaft.getBoundingClientRect();
    const cx = s.left + s.width / 2 - box.left;
    const cy = s.top + 10 - box.top;
    for (let i = 0; i < n; i++) {
      const g = document.createElement('i');
      g.className = 'dig-grain';
      const w = 8 + Math.random() * 9;
      g.style.width = w.toFixed(1) + 'px';
      g.style.height = (w * 0.68).toFixed(1) + 'px';
      g.style.left = (cx + (Math.random() - 0.5) * 54).toFixed(1) + 'px';
      g.style.top = (cy + (Math.random() - 0.5) * 14).toFixed(1) + 'px';
      grainBox.appendChild(g);
      const dx = (Math.random() - 0.5) * 200;
      const dy = 40 + Math.random() * 130;
      const an = g.animate([
        { opacity: 0, transform: 'translate3d(0,0,0) scale(.55) rotate(0deg)' },
        { opacity: .95, offset: .18 },
        { opacity: 0, transform: 'translate3d(' + dx.toFixed(0) + 'px,' + dy.toFixed(0) + 'px,0) scale(1) rotate(' + (Math.random() * 220 - 110).toFixed(0) + 'deg)' }
      ], {
        duration: 620 + Math.random() * 420,
        easing: 'cubic-bezier(.32,.6,.4,1)'
      });
      an.onfinish = function () { g.remove(); };
    }
  }

  function paint() {
    if (!root) return;
    const p = Math.min(1, depth / T());
    root.style.setProperty('--p', p.toFixed(3));
    if (depthEl) depthEl.textContent = depth.toFixed(1);
    if (barFill) barFill.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    if (hintEl && !done) {
      hintEl.textContent =
        depth < 0.03 ? '按住画面左右拖动，把土刨出来'
        : depth < T() * 0.55 ? '土往下走，人往深处去'
        : '快了，再刨两下';
    }
  }

  function finish() {
    if (done) return;
    done = true;
    if (hintEl) hintEl.textContent = '通了。这一口，只有一个人躲。';
    if (DD.audio) { DD.audio.dig(1); DD.audio.bell(0.45); }
    DD.stage.markDone(1);
    goTimer = setTimeout(function () {
      if (DD.stage.index === 1) DD.stage.go(2);
    }, 2000);
  }

  function add(dx) {
    if (done) return;
    depth += Math.abs(dx) * conf().stepPerPx;
    accum += Math.abs(dx);
    if (accum > 30) {
      accum = 0;
      if (DD.audio) DD.audio.dig(0.45);
    }
    const now = performance.now();
    if (now - grainAt > 90) {
      grainAt = now;
      grains(4 + (Math.random() < .5 ? 2 : 0));
    }
    paint();
    if (depth >= T()) finish();
  }

  function onDown(e) {
    if (done) return;
    dragging = true;
    lastX = e.clientX;
    root.classList.add('is-digging');
    if (root.setPointerCapture) {
      try { root.setPointerCapture(e.pointerId); } catch (err) {}
    }
  }

  function onMove(e) {
    if (e.buttons === 0) { onUp(); return; }
    if (!dragging) return;
    const x = e.clientX;
    add(x - lastX);
    lastX = x;
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    root.classList.remove('is-digging');
  }

  function reset() {
    clearTimeout(goTimer);
    goTimer = 0;
    depth = 0;
    accum = 0;
    done = false;
    paint();
    if (hintEl) hintEl.textContent = '按住画面左右拖动，把土刨出来';
  }

  function mount() {
    root = document.getElementById('dig');
    if (!root) return;
    shaft = document.getElementById('dig-shaft');
    depthEl = document.getElementById('dig-depth');
    hintEl = document.getElementById('dig-hint');
    barFill = document.getElementById('dig-bar-fill');
    grainBox = document.getElementById('dig-grains');

    paint();

    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
  }

  DD.modules.push({
    init: function () {
      mount();
      DD.stage.on('scene', function (e) {
        if (e.reset) { reset(); return; }
        if (e.i !== 1) { clearTimeout(goTimer); goTimer = 0; return; }
        if (DD.stage.state.done.indexOf(1) < 0) reset();
      });
    }
  });
})();
