/* fortify.js — 第四段「五防：水毒火钻破」改成布防：把五个机关拖到地道剖面上。
   classic script，只挂 window.DD，不 import / 不联网。

   剖面图：assets/webp/a02-crack.webp（原图 1400×764，木刻版画风）
     上层  地面土层 + 贴着地面走的那条通道（左右各一道木门框，就是通道口），
           正中一道竖直裂缝从地面直通下来；
     中层  洞室的地板梁；
     下层  左右砖拱洞室、正中的过道和那扇门、靠右的砖拱洞室；
     底层  贯穿全图的那条圆拱干道，中间一个井口挂着水桶。

   画框取 1180×514：图按 1180 宽铺开（高 644），上下各裁 65px——
   正好切掉顶上的纸边和底下的黑土，图本身不改。

   下面五个位置用**原图百分比**（x/1400、y/764），百分比相对图而不是相对画框，
   所以以后改 CSS 里裁多少，这里不用动。 */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];

  const IDLE = '五个位置，五样用处——放对一处，这里就说为什么。';

  const PIECES = [
    {
      id: 'fanyan',
      name: '翻眼',
      seal: '眼',
      tag: '双层导毒口',
      /* 图注：剖面正中那道竖直裂缝（原图 x 610–760、y 35–360）的底口。
         上层通道走到这儿拐下去，裂缝把地面和下层打穿——水、毒都顺着这里往下灌。 */
      x: 46.8, y: 43.2,
      why: '翻眼是上下两层错开的口：水毒从上头灌下来，顺着翻眼落到下层，人躲在上层，水最后从井里排走。'
    },
    {
      id: 'firewall',
      name: '挡火墙',
      seal: '火',
      tag: '挡烟防火',
      /* 图注：左边那道木门框围起来的通道口（原图 x 95–165、y 170–330），
         通道贴着地面走，敌人堵在门口点火，烟就从这儿往里灌。 */
      x: 11.8, y: 32.5,
      why: '敌人守在洞口放火，烟要顺着通道往里灌。洞口砌一道挡火墙，火和烟过不去，洞里还能待人。'
    },
    {
      id: 'throat',
      name: '卡口',
      seal: '卡',
      tag: '最窄一处',
      /* 图注：下层左洞室和正中过道之间那道又窄又矮的拱门（原图 x 490–515、y 450–550），
         全图洞身收得最紧的地方。 */
      x: 35.9, y: 65.2,
      why: '卡口把洞身收到只容一个人过。敌人进来只能一个一个钻，队形展不开，枪也端不平。'
    },
    {
      id: 'pit',
      name: '陷坑',
      seal: '坑',
      tag: '翻板落人',
      /* 图注：下层正中过道的地面（原图 x 770–860、y 540–575，粮囤和砖柱之间那片踩实的土），
         翻板就盖在这儿。 */
      x: 56.8, y: 72.3,
      why: '主通道地面盖一块翻板，底下是深坑。踩上去整块翻下去，后头跟上的人也堵在口上。'
    },
    {
      id: 'port',
      name: '瞭望孔',
      seal: '孔',
      tag: '高房射击孔',
      /* 图注：右边砖拱洞室壁上那个小方窗（原图 x 960–990、y 415–450），
         就在洞口上方的土墙上，能看也能打。 */
      x: 69.6, y: 56.3,
      why: '洞口上方的土墙上留一个瞭望孔：平时看路口，来了敌人把枪伸出去打。孔小，外头打不着里头。'
    }
  ];

  let root = null;      // #quiz
  let board = null;     // 剖面画框
  let canvas = null;    // 图 + 投放位（1180×644，画框里上移 65px）
  let tray = null;      // 左边的机关列
  let ledger = null;    // 右上角的布防册
  let whyEl = null;
  let nEl = null;
  let mEl = null;

  const cardEls = Object.create(null);
  const slotEls = Object.create(null);
  let placed = Object.create(null);
  let selected = null;
  let misses = 0;
  let finished = false;
  let goTimer = 0;
  let drag = null;

  function byId(id) {
    for (let i = 0; i < PIECES.length; i++) if (PIECES[i].id === id) return PIECES[i];
    return null;
  }

  function filled() {
    let n = 0;
    for (let i = 0; i < PIECES.length; i++) if (placed[PIECES[i].id]) n++;
    return n;
  }

  /* ------------------------------------------------------------------ 建 DOM */

  function buildTray() {
    tray.innerHTML = '';
    PIECES.forEach(function (p) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'ft-card';
      b.dataset.id = p.id;
      b.innerHTML = '<span class="ft-seal">' + p.seal + '</span>' +
        '<span class="ft-txt"><b>' + p.name + '</b><i>' + p.tag + '</i></span>';
      b.addEventListener('pointerdown', onDown);
      // 键盘 Enter / 空格会补一个 detail 为 0 的 click；鼠标点击在上面 onDown 里处理
      b.addEventListener('click', function (e) {
        if (e.detail === 0) toggleSelect(p.id);
      });
      tray.appendChild(b);
      cardEls[p.id] = b;
    });
  }

  function buildSlots() {
    canvas.innerHTML = '';
    PIECES.forEach(function (p, k) {
      const s = document.createElement('button');
      s.type = 'button';
      s.className = 'ft-slot';
      s.dataset.id = p.id;
      s.style.left = p.x + '%';
      s.style.top = p.y + '%';
      s.setAttribute('aria-label', '投放位 ' + (k + 1));
      s.innerHTML = '<span class="ft-token">' + p.seal + '</span>';
      s.addEventListener('click', onSlotClick);
      canvas.appendChild(s);
      slotEls[p.id] = s;
    });
  }

  function buildLedger(sec) {
    ledger = document.createElement('div');
    ledger.className = 'ft-ledger';
    ledger.innerHTML =
      '<div class="ft-led-h"><span class="ft-led-k">布 防</span>' +
      '<span class="ft-led-c">已布 <b class="ft-n">0</b> / 5　·　试错 <b class="ft-m">0</b> 次</span></div>' +
      '<p class="ft-led-t">把五个机关拖到图上；点一下卡片、再点位置也行。放错了不扣命，不限次数。</p>' +
      '<p class="ft-why is-idle">' + IDLE + '</p>';
    sec.appendChild(ledger);
    whyEl = ledger.querySelector('.ft-why');
    nEl = ledger.querySelector('.ft-n');
    mEl = ledger.querySelector('.ft-m');
  }

  /* ------------------------------------------------------------------ 状态 */

  function say(text, tone) {
    if (!whyEl) return;
    whyEl.textContent = text;
    whyEl.classList.toggle('is-good', tone === 'good');
    whyEl.classList.toggle('is-bad', tone === 'bad');
    whyEl.classList.toggle('is-idle', !tone);
    if (!DD.motion) return;
    DD.motion.motion(whyEl, [
      { opacity: 0, transform: 'translate3d(0,8px,0)' },
      { opacity: 1, transform: 'translate3d(0,0,0)' }
    ], { duration: 420, easing: DD.motion.EASE_SOFT, fill: 'none' });
  }

  function setSelected(id) {
    if (selected && cardEls[selected]) cardEls[selected].classList.remove('is-selected');
    selected = id || null;
    if (selected && cardEls[selected]) cardEls[selected].classList.add('is-selected');
    if (board) board.classList.toggle('is-aiming', !!selected);
  }

  function toggleSelect(id) {
    if (finished || placed[id]) return;
    if (selected === id) {
      setSelected(null);
      if (DD.audio) DD.audio.tap(0.5);
      return;
    }
    setSelected(id);
    if (DD.audio) DD.audio.tap(0.8);
    const p = byId(id);
    if (p) say('「' + p.name + '」——点图上的一个投放位。', '');
  }

  function place(id) {
    if (placed[id] || finished) return;
    placed[id] = true;
    const s = slotEls[id];
    if (s) s.classList.add('is-done');
    const c = cardEls[id];
    if (c) {
      c.classList.add('is-placed');
      c.disabled = true;
      c.style.transform = '';
    }
    if (DD.audio) DD.audio.ok(0.9);
    const p = byId(id);
    if (p) say(p.name + '：' + p.why, 'good');
    if (nEl) nEl.textContent = String(filled());
    if (filled() >= PIECES.length) complete();
  }

  function mistake(msg) {
    misses++;
    if (DD.stage && DD.stage.mistake) DD.stage.mistake(1);
    if (mEl) {
      mEl.textContent = String(misses);
      if (DD.motion) DD.motion.bump(mEl, { to: 1.4, duration: 240 });
    }
    if (DD.audio) DD.audio.wrong(0.9);
    say(msg || '这儿不对——再想想。', 'bad');
  }

  function complete() {
    if (finished) return;
    finished = true;
    if (board) board.classList.add('is-clear');
    say('水、毒、火、钻、破——五样都堵上了。', 'good');
    if (DD.audio) DD.audio.bell(0.5);
    DD.stage.markDone(4);
    clearTimeout(goTimer);
    goTimer = setTimeout(function () {
      goTimer = 0;
      if (DD.stage.index === 4) DD.stage.go(5);
    }, 2200);
  }

  function reset() {
    clearTimeout(goTimer);
    goTimer = 0;
    drag = null;
    finished = false;
    placed = Object.create(null);
    misses = 0;
    setSelected(null);
    if (board) board.classList.remove('is-clear');
    PIECES.forEach(function (p) {
      const c = cardEls[p.id];
      const s = slotEls[p.id];
      if (c) {
        c.classList.remove('is-placed', 'is-selected', 'is-dragging');
        c.disabled = false;
        c.style.transform = '';
        if (c.getAnimations) {
          c.getAnimations().forEach(function (a) {
            try { a.cancel(); } catch (e) {}
          });
        }
      }
      if (s) s.classList.remove('is-done', 'is-hot');
    });
    if (nEl) nEl.textContent = '0';
    if (mEl) mEl.textContent = '0';
    say(IDLE, '');
  }

  /* ------------------------------------------------------------------ 拖拽 */

  function stageScale() {
    const st = document.getElementById('stage');
    if (!st) return 1;
    const w = st.getBoundingClientRect().width;
    return w > 0 ? w / 1672 : 1;
  }

  /* 指针底下是哪个投放位（跳过已经填好的），都够不着就返回 null */
  function slotAt(x, y) {
    const pad = 16;
    let best = null;
    let bestD = 0;
    PIECES.forEach(function (p) {
      const s = slotEls[p.id];
      if (!s || placed[p.id]) return;
      const r = s.getBoundingClientRect();
      if (x < r.left - pad || x > r.right + pad || y < r.top - pad || y > r.bottom + pad) return;
      const cx = (r.left + r.right) / 2;
      const cy = (r.top + r.bottom) / 2;
      const d = (x - cx) * (x - cx) + (y - cy) * (y - cy);
      if (!best || d < bestD) {
        best = p.id;
        bestD = d;
      }
    });
    return best;
  }

  function clearHot() {
    PIECES.forEach(function (p) {
      const s = slotEls[p.id];
      if (s) s.classList.remove('is-hot');
    });
  }

  function onDown(e) {
    const card = e.currentTarget;
    const id = card.dataset.id;
    if (!id || finished || placed[id]) return;
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    drag = {
      id: id,
      card: card,
      x0: e.clientX,
      y0: e.clientY,
      dx: 0,
      dy: 0,
      moved: false,
      pid: e.pointerId,
      k: stageScale()
    };
    card.classList.add('is-dragging');
    try { card.setPointerCapture(e.pointerId); } catch (err) {}
    window.addEventListener('pointermove', onMove, { passive: true });
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onCancel);
  }

  function onMove(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const k = drag.k || 1;
    const dx = (e.clientX - drag.x0) / k;
    const dy = (e.clientY - drag.y0) / k;
    if (!drag.moved) {
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return;   // 手抖当点击
      drag.moved = true;
      // 真开始拖了才掐掉入场动画（只是点一下的话，让它自己走完）
      if (drag.card.getAnimations) {
        drag.card.getAnimations().forEach(function (a) {
          try { a.cancel(); } catch (err) {}
        });
      }
    }
    drag.dx = dx;
    drag.dy = dy;
    drag.card.style.transform =
      'translate3d(' + dx.toFixed(1) + 'px,' + dy.toFixed(1) + 'px,0)';
    const hit = slotAt(e.clientX, e.clientY);
    PIECES.forEach(function (p) {
      const s = slotEls[p.id];
      if (s) s.classList.toggle('is-hot', p.id === hit);
    });
  }

  function onUp(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag;
    drag = null;
    offDrag();
    d.card.classList.remove('is-dragging');

    if (!d.moved) {
      d.card.style.transform = '';
      toggleSelect(d.id);
      return;
    }
    const hit = slotAt(e.clientX, e.clientY);
    if (hit === d.id) {
      snap(d);
      return;
    }
    if (hit) {
      recoil(d);
      mistake(byId(d.id) ? '「' + byId(d.id).name + '」不放这儿——再想想。' : null);
      return;
    }
    returnCard(d);          // 落在图上别处：弹回去，不算错
  }

  function onCancel(e) {
    if (!drag || e.pointerId !== drag.pid) return;
    const d = drag;
    drag = null;
    offDrag();
    d.card.classList.remove('is-dragging');
    returnCard(d);
  }

  function offDrag() {
    window.removeEventListener('pointermove', onMove);
    window.removeEventListener('pointerup', onUp);
    window.removeEventListener('pointercancel', onCancel);
    clearHot();
  }

  /* 放对了：卡片飞进投放位、落成朱砂印 */
  function snap(d) {
    const slot = slotEls[d.id];
    const card = d.card;
    const k = d.k || 1;
    const cr = card.getBoundingClientRect();
    const sr = slot ? slot.getBoundingClientRect() : null;
    let tx = d.dx;
    let ty = d.dy;
    if (sr) {
      tx = d.dx + ((sr.left + sr.width / 2) - (cr.left + cr.width / 2)) / k;
      ty = d.dy + ((sr.top + sr.height / 2) - (cr.top + cr.height / 2)) / k;
    }
    if (selected === d.id) setSelected(null);
    card.style.transform = '';
    place(d.id);
    if (!DD.motion) return;
    DD.motion.motion(card, [
      { opacity: 1, transform: 'translate3d(' + d.dx + 'px,' + d.dy + 'px,0) scale(1)' },
      { opacity: 0.15, transform: 'translate3d(' + tx + 'px,' + ty + 'px,0) scale(.5)' }
    ], { duration: 400, easing: DD.motion.EASE, fill: 'none' });
  }

  /* 放错了：卡片弹回原位、抖一下 */
  function recoil(d) {
    const card = d.card;
    card.style.transform = '';
    if (!DD.motion) return;
    DD.motion.motion(card, [
      { transform: 'translate3d(' + d.dx + 'px,' + d.dy + 'px,0)' },
      { transform: 'translate3d(-9px,0,0)' },
      { transform: 'translate3d(8px,0,0)' },
      { transform: 'translate3d(-5px,0,0)' },
      { transform: 'translate3d(0,0,0)' }
    ], { duration: 460, easing: 'ease-in-out', fill: 'none' });
  }

  function returnCard(d) {
    const card = d.card;
    card.style.transform = '';
    if (!DD.motion) return;
    if (!d.dx && !d.dy) return;
    DD.motion.motion(card, [
      { transform: 'translate3d(' + d.dx + 'px,' + d.dy + 'px,0)' },
      { transform: 'translate3d(0,0,0)' }
    ], { duration: 280, easing: DD.motion.EASE, fill: 'none' });
  }

  /* 点选流：先点卡片，再点投放位 */
  function onSlotClick(e) {
    const id = e.currentTarget.dataset.id;
    if (!id || finished || placed[id]) return;
    if (!selected) {
      if (DD.audio) DD.audio.tap(0.6);
      say('先从左边点一个机关，再点位置。', 'bad');
      return;
    }
    if (selected === id) {
      const c = cardEls[id];
      setSelected(null);
      if (c) {
        c.classList.remove('is-selected');
        c.classList.add('is-placed');
        c.disabled = true;
        c.style.transform = '';
      }
      place(id);
      return;
    }
    const c = cardEls[selected];
    const p = byId(selected);
    if (c && DD.motion) DD.motion.shake(c, { duration: 420 });
    mistake(p ? '「' + p.name + '」不放这儿——再想想。' : null);
  }

  /* ------------------------------------------------------------------ 入场 */

  function enterAnim() {
    if (!DD.motion) return;
    PIECES.forEach(function (p, k) {
      const c = cardEls[p.id];
      if (!c) return;
      DD.motion.motion(c, [
        { opacity: 0, transform: 'translate3d(-16px,0,0)' },
        { opacity: 1, transform: 'translate3d(0,0,0)' }
      ], {
        duration: 460,
        delay: 60 + k * 55,
        easing: DD.motion.EASE_SOFT,
        fill: 'backwards'
      });
    });
    if (ledger) DD.motion.inUp(ledger, { duration: 620, dy: 18 });
  }

  /* ------------------------------------------------------------------ 启动 */

  function init() {
    const sec = document.querySelector('.scene[data-i="4"]');
    root = document.getElementById('quiz');
    if (!root || !sec) return;
    if (root.dataset.ft === '1') return;          // 只建一次
    root.dataset.ft = '1';
    root.innerHTML = '';
    root.classList.add('ft');

    const wrap = document.createElement('div');
    wrap.className = 'ft-wrap';
    wrap.innerHTML =
      '<div class="ft-tray"></div>' +
      '<div class="ft-board"><div class="ft-pic"><div class="ft-canvas"></div></div></div>';
    root.appendChild(wrap);

    tray = wrap.querySelector('.ft-tray');
    board = wrap.querySelector('.ft-board');
    canvas = wrap.querySelector('.ft-canvas');

    buildTray();
    buildSlots();
    buildLedger(sec);

    DD.stage.on('scene', function (e) {
      if (e.reset) {
        reset();
        return;
      }
      if (e.i !== 4) {
        clearTimeout(goTimer);
        goTimer = 0;
        return;
      }
      enterAnim();
    });
  }

  DD.modules.push({ init: init });
})();
