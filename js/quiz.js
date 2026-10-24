/* quiz.js — 第四段：五防判断 */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];

  let root, idx = 0, locked = false, done = false, goTimer = 0;

  function list() { return DD.content.quiz; }

  function render() {
    const q = list()[idx];
    if (!q) return;
    locked = false;

    const card = document.createElement('div');
    card.className = 'quiz-card';
    card.innerHTML =
      '<p class="quiz-no">第 <b>' + (idx + 1) + '</b> / ' + list().length + ' 题</p>' +
      '<p class="quiz-q">' + q.q + '</p>' +
      '<div class="quiz-opts"></div>' +
      '<p class="quiz-why" aria-live="polite"></p>';

    const box = card.querySelector('.quiz-opts');
    q.options.forEach(function (o, k) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'quiz-opt';
      b.innerHTML = '<span class="quiz-key">' + String.fromCharCode(65 + k) + '</span><span>' + o.t + '</span>';
      b.addEventListener('click', function () { pick(b, o, card); });
      box.appendChild(b);
    });

    root.innerHTML = '';
    root.appendChild(card);
    if (DD.motion) DD.motion.inUp(card, { duration: 620, dy: 22 });
  }

  function pick(btn, opt, card) {
    if (locked) return;
    const q = list()[idx];
    const why = card.querySelector('.quiz-why');

    if (opt.ok) {
      locked = true;
      btn.classList.add('is-right');
      card.querySelectorAll('.quiz-opt').forEach(function (b) { b.disabled = true; });
      if (why) why.textContent = q.why;
      if (DD.audio) DD.audio.ok(0.75);
      idx++;
      setTimeout(function () {
        if (idx >= list().length) finish();
        else render();
      }, 1600);
    } else {
      btn.classList.add('is-wrong');
      if (why) why.textContent = '不对。' + q.why;
      if (DD.audio) DD.audio.wrong(0.7);
      if (DD.motion) DD.motion.shake(btn);
      btn.disabled = true;
    }
  }

  function finish() {
    if (done) return;
    done = true;
    const wrap = document.createElement('div');
    wrap.className = 'quiz-end';
    wrap.innerHTML = '<p>五防都答对了。</p>';
    root.innerHTML = '';
    root.appendChild(wrap);
    if (DD.audio) DD.audio.bell(0.4);
    DD.stage.markDone(4);
    goTimer = setTimeout(function () {
      if (DD.stage.index === 4) DD.stage.go(5);
    }, 2200);
  }

  function reset() {
    clearTimeout(goTimer);
    goTimer = 0;
    idx = 0;
    done = false;
    locked = false;
    render();
  }

  function init() {
    root = document.getElementById('quiz');
    if (!root) return;
    render();
    DD.stage.on('scene', function (e) {
      if (e.reset) { reset(); return; }
      if (e.i !== 4) { clearTimeout(goTimer); goTimer = 0; }
    });
  }

  DD.modules.push({ init: init });
})();
