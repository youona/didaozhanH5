/* intro.js — 序章显影：版画从暗到亮、标题逐字压下、导语与按钮随后浮出
   只作用于第 0 段；第一次播完整版，之后（含"从头看"）播轻量版。 */
(function () {
  var DD = window.DD;
  if (!DD) return;

  var reduce = !!(DD.motion && DD.motion.reduce);
  var firstDone = false;

  function splitChars(el) {
    var text = el.textContent || '';
    el.textContent = '';
    var spans = [];
    for (var i = 0; i < text.length; i++) {
      var ch = text.charAt(i);
      if (ch === ' ' || ch === '\n') {
        el.appendChild(document.createTextNode(ch));
        continue;
      }
      var s = document.createElement('span');
      s.textContent = ch;
      s.style.display = 'inline-block';
      s.style.willChange = 'transform, opacity';
      el.appendChild(s);
      spans.push(s);
    }
    return spans;
  }

  function appear(el, delay, y, dur) {
    if (!el) return;
    el.style.willChange = 'transform, opacity';
    el.animate([
      { opacity: 0, transform: 'translateY(' + (y || 16) + 'px)' },
      { opacity: 1, transform: 'translateY(0)' }
    ], {
      duration: dur || 720,
      delay: delay,
      easing: (DD.motion && DD.motion.EASE) || 'cubic-bezier(.23,.65,.27,1)',
      fill: 'both'
    });
  }

  function playLight(sec) {
    var bg = sec.querySelector('.sc-bg');
    if (bg) {
      bg.animate(
        [{ filter: 'brightness(.55)' }, { filter: 'brightness(1)' }],
        { duration: 900, easing: 'ease-out', fill: 'both' }
      );
    }
    appear(sec.querySelector('.sc-kicker'), 60, 10, 620);
    appear(sec.querySelector('.sc-title'), 140, 18, 760);
    appear(sec.querySelector('.sc-lede'), 320, 14, 720);
    appear(sec.querySelector('.btn--enter'), 460, 10, 620);
  }

  function playFull(sec) {
    var bg = sec.querySelector('.sc-bg');
    if (bg) {
      bg.animate([
        { filter: 'blur(9px) saturate(.45) brightness(.42)', transform: 'scale(1.075)' },
        { filter: 'blur(0px) saturate(1) brightness(1)', transform: 'scale(1)' }
      ], {
        duration: 1500,
        easing: (DD.motion && DD.motion.EASE_SOFT) || 'cubic-bezier(.33,.1,.25,1)',
        fill: 'both'
      });
    }

    var title = sec.querySelector('.sc-title');
    var spans = title ? splitChars(title) : [];
    spans.forEach(function (s, i) {
      s.animate([
        { opacity: 0, transform: 'translateY(34px) rotate(1.6deg)' },
        { opacity: 1, transform: 'translateY(0) rotate(0)' }
      ], {
        duration: 820,
        delay: 300 + i * 78,
        easing: (DD.motion && DD.motion.EASE) || 'cubic-bezier(.23,.65,.27,1)',
        fill: 'both'
      });
    });

    appear(sec.querySelector('.sc-kicker'), 120, 12, 700);
    appear(sec.querySelector('.sc-lede'), 300 + spans.length * 78 + 220, 16, 760);
    appear(sec.querySelector('.btn--enter'), 300 + spans.length * 78 + 420, 12, 700);
    var src = sec.querySelector('.sc-src');
    if (src) appear(src, 300 + spans.length * 78 + 560, 8, 640);
  }

  function init() {
    DD.stage.on('scene', function (e) {
      var sec = e.el;
      if (!sec || sec.dataset.i !== '0') return;
      var already = sec.dataset.introPlayed === '1';
      if (!already && !firstDone) {
        firstDone = true;
        playFull(sec);
      } else {
        playLight(sec);
      }
      sec.dataset.introPlayed = '1';
    });
  }

  DD.modules = DD.modules || [];
  DD.modules.push({ init: init });
})();
