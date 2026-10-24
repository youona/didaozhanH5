/* cards.js — 第三段：八张洞口伪装翻卡 */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];

  const NEED = 6;

  let root, hintEl, flipped = 0, done = false, goTimer = 0;

  function build() {
    root.innerHTML = '';
    DD.content.cards.forEach(function (c, k) {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'dcard';
      btn.dataset.id = c.id;
      btn.setAttribute('aria-label', c.name + '：翻过来看看');
      btn.innerHTML =
        '<span class="dcard-inner">' +
          '<span class="dcard-face dcard-front">' +
            '<span class="dcard-no">' + String(k + 1).padStart(2, '0') + '</span>' +
            '<b>' + c.front + '</b>' +
            '<span class="dcard-tag">' + c.tag + '</span>' +
            '<span class="dcard-flip">翻</span>' +
          '</span>' +
          '<span class="dcard-face dcard-back">' +
            '<p>' + c.back + '</p>' +
          '</span>' +
        '</span>';
      btn.addEventListener('click', function () { turn(btn, c); });
      root.appendChild(btn);
    });
  }

  function turn(btn, c) {
    if (btn.classList.contains('is-flipped')) return;
    btn.classList.add('is-flipped');
    flipped++;
    if (DD.audio) DD.audio.tap(0.7);
    if (DD.motion) DD.motion.bump(btn, { to: 1.04, duration: 320 });

    if (flipped === 1 && hintEl) hintEl.textContent = '洞口就藏在平时天天用的东西底下。';
    if (flipped >= NEED) {
      if (flipped === NEED) {
        if (hintEl) hintEl.textContent = '这些洞口，敌人翻十遍也翻不全。';
        if (DD.audio) DD.audio.ok(0.7);
        complete();
      }
      return;
    }
    if (hintEl) {
      hintEl.textContent = '已经翻了 ' + flipped + ' 张，再翻 ' + (NEED - flipped) + ' 张。';
    }
  }

  function complete() {
    if (done) return;
    done = true;
    DD.stage.markDone(3);
    goTimer = setTimeout(function () {
      if (DD.stage.index === 3) DD.stage.go(4);
    }, 2200);
  }

  function reset() {
    clearTimeout(goTimer);
    goTimer = 0;
    flipped = 0;
    done = false;
    root.querySelectorAll('.dcard').forEach(function (b) { b.classList.remove('is-flipped'); });
    if (hintEl) hintEl.textContent = '把每张卡翻过来，看看它藏的是什么';
  }

  function init() {
    root = document.getElementById('cards');
    hintEl = document.getElementById('cards-hint');
    if (!root) return;
    build();
    DD.stage.on('scene', function (e) {
      if (e.reset) { reset(); return; }
      if (e.i !== 3) { clearTimeout(goTimer); goTimer = 0; }
    });
  }

  DD.modules.push({ init: init });
})();
