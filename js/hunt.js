/* hunt.js — 三·藏 的追加关：村里找洞口
 *
 * 挂在第 3 段（data-key="hide"，翻卡段）上。翻卡解锁之后，第 3 段里出现
 * 「下地找洞口 →」的入口；点开是一张 a05-holes 四格版画，45 秒里找 8 个伪装洞口。
 *
 * 规矩：
 *   - 不改 cards.js / stage.js / index.html；只读 #cards 的类名来判断翻卡是否完成。
 *   - 这一段的完成条件仍然是翻卡，这里不 markDone(3)，也不替玩家跳段。
 *   - 全部坐标用百分比，挂在段容器里的任务层上，不用 position: fixed。
 */
(function () {
  var DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];
  DD.extra = DD.extra || {};

  var N = 8;              // 洞口数
  var ROUND_MS = 45000;   // 45 秒
  var PENALTY_MS = 2000;  // 猜错扣 2 秒
  var PEEK_MS = 5000;     // 要一次提示扣 5 秒
  var NEED_FLIP = 6;      // 翻卡完成门槛（跟 cards.js 的 NEED 一致，这里只用来判断解锁）
  var QUICK_MS = 240;     // 连点保护，避免一次双击扣 4 秒

  /* 8 个点：全部对着 assets/webp/a05-holes.webp（1400×764，2×2 四格）上真实画着的东西。
     名字就是画面上那件东西，不再硬套史实八样——图上没有柜子、没有织布机，
     硬叫它们「面柜」「织布机下」玩家会对着墙找。
     四格画面：左上 锅台（两口锅 + 灶膛 + 带木梯的大洞口）、
     右上 炕席（掀开的席子 + 席下长缝 + 右侧大洞 + 木箱）、
     左下 井口（水桶 + 大石头 + 方井 + 红砖框）、
     右下 木箱（箱里稻草 + 右侧方口）。 */
  var SPOTS = [
    { name: '锅台', x: 42.6, y: 33.0 },  // 左上：锅右边那个带木梯的大洞口
    { name: '灶膛', x: 14.0, y: 46.0 },  // 左上：灶下的柴火口
    { name: '炕席', x: 66.5, y: 28.5 },  // 右上：掀起来的席子底下那道长缝
    { name: '炕沿', x: 83.6, y: 33.5 },  // 右上：炕边那个大洞口
    { name: '木箱', x: 87.5, y: 14.5 },  // 右上：角上那个木箱
    { name: '井口', x: 37.0, y: 74.5 },  // 左下：方井正中
    { name: '砖台', x: 30.0, y: 64.0 },  // 左下：井口红砖框的左上角
    { name: '草堆', x: 62.0, y: 78.0 }   // 右下：稻草堆中间
  ];

  var entryBox = null;
  var entryBtn = null;
  var entryNote = null;

  var layer = null;
  var fieldEl = null;
  var clockEl = null;
  var secEl = null;
  var foundEl = null;
  var msgEl = null;
  var resultTitle = null;
  var resultSub = null;

  var spots = [];          // { el, name, no, found }
  var foundCount = 0;
  var running = false;     // 一轮是否还在计时
  var hunting = false;     // 任务层是否开着（cards.js 的自动跳段靠这个让路）
  var ended = false;       // 这一轮是不是正常结算过（决定入口下面那句小字）
  var deadline = 0;
  var clockId = 0;
  var resultId = 0;
  var msgId = 0;
  var lastJudge = 0;
  var rawGo = null;
  var observer = null;
  var entryReady = false;   // 入口已经亮出来（翻够 6 张或有存档）
  var lastInputAt = 0;      // 最后一次玩家操作的时间戳，用来区分「自动跳」和「玩家自己要走」
  var blockNextAuto = false; // 只拦紧接着那一次 cards 发起的自动跳段

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  /* ---------------------------------------------------------------- 入口 */
  function buildEntry(scene) {
    entryBox = document.createElement('div');
    entryBox.className = 'hunt-entry';
    entryBox.innerHTML =
      '<p class="hunt-entry-kicker">翻卡之外 · 附加关</p>' +
      '<button class="hunt-entry-btn" type="button"><span>下地找洞口</span><i aria-hidden="true">→</i></button>' +
      '<p class="hunt-entry-note"></p>';
    scene.appendChild(entryBox);

    entryBtn = entryBox.querySelector('.hunt-entry-btn');
    entryNote = entryBox.querySelector('.hunt-entry-note');
    entryBtn.addEventListener('click', function () {
      if (DD.audio) DD.audio.tap(0.7);
      open();
    });
  }

  function setEntry(on) {
    if (!entryBox) return;
    entryBox.classList.toggle('is-on', !!on);
  }

  /* ---------------------------------------------------------------- 任务层 */
  function buildLayer(scene) {
    layer = document.createElement('div');
    layer.className = 'hunt';
    layer.id = 'hunt';
    layer.setAttribute('role', 'dialog');
    layer.setAttribute('aria-label', '村里找洞口：45 秒内找齐 ' + N + ' 个洞口');
    layer.innerHTML =
      '<div class="hunt-photo" aria-hidden="true"></div>' +
      '<div class="hunt-veil" aria-hidden="true"></div>' +
      '<div class="hunt-field" id="hunt-field"></div>' +
      '<div class="hunt-hud">' +
        '<p class="hunt-clock"><b id="hunt-sec">45</b><i>秒</i></p>' +
        '<span class="hunt-hud-sep" aria-hidden="true"></span>' +
        '<p class="hunt-tally">已找到 <b id="hunt-found">0</b> <em>/ ' + N + '</em></p>' +
      '</div>' +
      '<p class="hunt-msg" id="hunt-msg"></p>' +
      '<button class="hunt-peek" type="button">给个提示 <i>−5 秒</i></button>' +
      '<button class="hunt-quit" type="button">先不找</button>' +
      '<p class="hunt-tip">洞口就藏在锅台、炕席、井台这些天天用的东西底下——点那件东西，看它后面有没有洞。<span>【示意】版画复原，非史料影像</span></p>' +
      '<div class="hunt-result" id="hunt-result">' +
        '<b id="hunt-result-title"></b>' +
        '<span id="hunt-result-sub"></span>' +
      '</div>';
    scene.appendChild(layer);

    fieldEl = layer.querySelector('#hunt-field');
    clockEl = layer.querySelector('.hunt-clock');
    secEl = layer.querySelector('#hunt-sec');
    foundEl = layer.querySelector('#hunt-found');
    msgEl = layer.querySelector('#hunt-msg');
    resultTitle = layer.querySelector('#hunt-result-title');
    resultSub = layer.querySelector('#hunt-result-sub');

    buildSpots();

    layer.querySelector('.hunt-quit').addEventListener('click', function () {
      if (DD.audio) DD.audio.tap(0.5);
      close();
    });

    layer.querySelector('.hunt-peek').addEventListener('click', function (ev) {
      ev.stopPropagation();
      peek();
    });

    /* 一次点击判定：点在 8 个热点上算找着，点在别处算踩空。
       热点是 56×56 的圆按钮，平时透明，所以点不点得中全看位置。 */
    layer.addEventListener('click', function (ev) {
      if (!running) return;
      var t = ev.target;
      if (!t || !t.closest) return;
      if (t.closest('.hunt-hud, .hunt-quit, .hunt-peek, .hunt-result, .hunt-tip')) return;
      var sp = t.closest('.hunt-spot');
      if (sp) {
        judge(Number(sp.getAttribute('data-k')));
        return;
      }
      miss();
    });
  }

  function buildSpots() {
    SPOTS.forEach(function (s, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'hunt-spot';
      b.setAttribute('data-k', String(k));
      b.setAttribute('aria-label', '找一找');
      b.style.left = s.x + '%';
      b.style.top = s.y + '%';
      b.innerHTML =
        '<span class="hunt-ring" aria-hidden="true"></span>' +
        '<span class="hunt-tag" hidden></span>';
      fieldEl.appendChild(b);
      spots.push({ el: b, name: s.name, no: pad2(k + 1), found: false });
    });
  }

  /* ---------------------------------------------------------------- 判定 */
  function judge(k) {
    var s = spots[k];
    if (!running || !s || s.found) return;
    var now = Date.now();
    if (now - lastJudge < QUICK_MS) return;
    lastJudge = now;

    s.found = true;
    foundCount++;
    s.el.classList.add('is-found');
    s.el.disabled = true;
    s.el.setAttribute('aria-label', '第 ' + s.no + ' 个洞口：' + s.name);

    var tag = s.el.querySelector('.hunt-tag');
    tag.hidden = false;
    tag.innerHTML = '<span class="hunt-tag-in"><i>' + s.no + '</i><b>' + s.name + '</b></span>';
    if (DD.motion) DD.motion.inUp(tag.firstChild, { dy: 8, duration: 440 });

    burst(s.el);
    if (foundEl) foundEl.textContent = String(foundCount);
    if (DD.audio) DD.audio.ok(0.6);
    if (foundCount >= N) endRound(true);
  }

  function burst(el) {
    var ring = el.querySelector('.hunt-ring');
    if (ring && DD.motion) {
      DD.motion.motion(
        ring,
        [
          { opacity: 0.95, transform: 'scale(.34)' },
          { opacity: 0, transform: 'scale(3.3)' }
        ],
        { duration: 760, easing: DD.motion.EASE }
      );
      DD.motion.bump(el, { to: 1.16, duration: 380 });
    }
  }

  /* 给个提示：随机挑一个没找到的洞口闪一下，代价 5 秒 */
  function peek() {
    if (!running) return;
    var rest = spots.filter(function (s) { return !s.found; });
    if (!rest.length) return;
    var s = rest[Math.floor(Math.random() * rest.length)];
    deadline -= PEEK_MS;
    s.el.classList.add('is-peek');
    clearTimeout(s.peekTimer);
    s.peekTimer = setTimeout(function () { s.el.classList.remove('is-peek'); }, 1400);
    if (DD.audio) DD.audio.tap(0.5);
    flash('在这儿看看 · 扣 5 秒');
    tick();
  }

  function miss() {
    deadline -= PENALTY_MS;
    lastJudge = Date.now();
    if (DD.audio) DD.audio.wrong(0.5);
    if (DD.motion) DD.motion.shake(layer, { duration: 380 });
    flash('踩空了 · 扣 2 秒');
    tick();
  }

  function flash(text) {
    if (!msgEl) return;
    clearTimeout(msgId);
    msgEl.textContent = text;
    msgEl.classList.add('is-on');
    msgId = setTimeout(function () {
      msgEl.classList.remove('is-on');
      msgId = 0;
    }, 1000);
  }

  /* ---------------------------------------------------------------- 计时 */
  function startClock() {
    stopClock();
    deadline = Date.now() + ROUND_MS;
    tick();
    clockId = setInterval(tick, 120);
  }

  function stopClock() {
    if (clockId) {
      clearInterval(clockId);
      clockId = 0;
    }
  }

  function tick() {
    if (!running) return;
    var left = deadline - Date.now();
    if (secEl) secEl.textContent = String(Math.max(0, Math.ceil(left / 1000)));
    if (clockEl) clockEl.classList.toggle('is-low', left <= 10000);
    if (left <= 0) endRound(false);
  }

  /* ---------------------------------------------------------------- 开局 / 收场 */
  function open() {
    if (!layer || running) return;
    if (!DD.stage || DD.stage.index !== 3) return;

    resetRound();
    hunting = true;
    running = true;
    layer.classList.add('is-on');
    layer.classList.remove('is-over', 'is-result');
    startClock();
    if (DD.audio) DD.audio.page(0.4);
  }

  function resetRound() {
    spots.forEach(function (s) {
      s.found = false;
      s.el.classList.remove('is-found', 'is-peek');
      clearTimeout(s.peekTimer);
      s.el.disabled = false;
      s.el.setAttribute('aria-label', '找一找');
      var tag = s.el.querySelector('.hunt-tag');
      if (tag) {
        tag.hidden = true;
        tag.innerHTML = '';
      }
    });
    foundCount = 0;
    ended = false;
    lastJudge = 0;
    if (foundEl) foundEl.textContent = '0';
    if (resultTitle) resultTitle.textContent = '';
    if (resultSub) resultSub.textContent = '';
    if (msgEl) {
      msgEl.classList.remove('is-on');
      msgEl.textContent = '';
    }
    if (clockEl) clockEl.classList.remove('is-low');
    if (secEl) secEl.textContent = String(ROUND_MS / 1000);
  }

  function endRound(win) {
    if (!running) return;
    running = false;
    ended = true;
    stopClock();
    clearTimeout(resultId);
    resultId = 0;

    if (layer) layer.classList.add('is-over', 'is-result');
    if (resultTitle) resultTitle.textContent = '找到了 ' + foundCount + ' 个';
    if (resultSub) {
      resultSub.textContent = win
        ? '八个洞口，一个不差。'
        : '还有 ' + (N - foundCount) + ' 个洞口没露头。';
    }
    if (DD.audio) {
      if (win) DD.audio.bell(0.55);
      else DD.audio.tap(0.5);
    }
    /* 结算条停 3 秒，然后自己收起，回翻卡界面；不跳段。 */
    resultId = setTimeout(close, 3000);
  }

  function close() {
    clearTimeout(resultId);
    resultId = 0;
    clearTimeout(msgId);
    msgId = 0;
    stopClock();
    running = false;
    hunting = false;
    lastJudge = 0;

    if (layer) layer.classList.remove('is-on', 'is-over', 'is-result');
    if (msgEl) {
      msgEl.classList.remove('is-on');
      msgEl.textContent = '';
    }
    if (entryNote) {
      if (ended && foundCount > 0) {
        entryNote.textContent = foundCount >= N
          ? '这一轮八个都找着了。'
          : '上一轮找到 ' + foundCount + ' 个。';
      } else if (!foundCount) {
        entryNote.textContent = '本轮 0 个，再下去一趟？';
      }
    }
  }

  function hardReset() {
    close();
    foundCount = 0;
    ended = false;
    entryReady = false;
    resetRound();
    if (entryNote) entryNote.textContent = '';
    setEntry(false);
  }

  /* ---------------------------------------------------------------- 解锁判断 */
  function flipped() {
    var box = document.getElementById('cards');
    return box ? box.querySelectorAll('.dcard.is-flipped').length : 0;
  }

  function unlocked() {
    var st = DD.stage && DD.stage.state;
    if (st && st.done && st.done.indexOf(3) >= 0) return true;
    return flipped() >= NEED_FLIP;
  }

  /* cards.js 翻完 6 张后 2.2 秒会自己 DD.stage.go(4)——本来是把人带去下一段，
     可入口刚亮出来就被带走了，玩家根本点不着。所以只拦「紧接着那一次、且 500ms
     内没有玩家操作」的跳段，拦一次就消费掉；玩家自己点导航、按方向键、hash 定位
     都照常放行。洞口层开着的时候（hunting）一律拦住。 */
  function guardAutoAdvance() {
    if (!DD.stage || rawGo) return;
    rawGo = DD.stage.go;
    DD.stage.go = function (i, opts) {
      if (opts && opts.silent) return rawGo.call(DD.stage, i, opts);
      if (DD.stage.index === 3 && (i | 0) === 4) {
        if (hunting) return;
        if (blockNextAuto && Date.now() - lastInputAt > 500) {
          blockNextAuto = false;
          return;
        }
      }
      return rawGo.call(DD.stage, i, opts);
    };
  }

  /* 翻卡完成的那一刻插一脚：监听 #cards 里的 class 变化，翻满 6 张就亮入口 */
  function watchCards() {
    var box = document.getElementById('cards');
    if (!box || !window.MutationObserver) return;
    observer = new MutationObserver(function () {
      if (!DD.stage || DD.stage.index !== 3) return;
      if (flipped() >= NEED_FLIP) {
        entryReady = true;
        blockNextAuto = true;
        setEntry(true);
      }
    });
    observer.observe(box, { attributes: true, attributeFilter: ['class'], subtree: true });
  }

  /* 记住玩家最后一次动手的时间：导航/方向键/点击都算，用来和 cards 的自动跳区分 */
  function trackInput() {
    function mark() { lastInputAt = Date.now(); }
    window.addEventListener('pointerdown', mark, true);
    window.addEventListener('keydown', mark, true);
    window.addEventListener('wheel', mark, { capture: true, passive: true });
  }

  function onScene(e) {
    if (!e) return;
    if (e.reset) {
      hardReset();
      return;
    }
    if (e.i !== 3) {
      if (running || hunting) close();
      entryReady = false;
      blockNextAuto = false;
      setEntry(false);
      return;
    }
    var on = unlocked();
    entryReady = on;
    setEntry(on);
  }

  /* ---------------------------------------------------------------- 启动 */
  function init() {
    if (entryBox) return;
    var scene = document.querySelector('.scene[data-i="3"]');
    if (!scene || !DD.stage) return;
    guardAutoAdvance();
    buildEntry(scene);
    buildLayer(scene);
    watchCards();
    trackInput();
    DD.stage.on('scene', onScene);
  }

  DD.modules.push({ init: init });

  DD.extra.hunt = {
    open: open,
    close: close,
    total: N,
    spots: SPOTS,
    get playing() { return running; }
  };
})();
