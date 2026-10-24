/* poem.js — 第六段：补《就义辞》缺的字 */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];

  const BLANK = '志未酬';
  const POOL = ['志', '未', '酬', '血', '染', '休', '鳞', '囚', '山', '河'];

  let root, filled = [], done = false, goTimer = 0;

  function shuffle(a) {
    const arr = a.slice();
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    }
    return arr;
  }

  function lineHtml(line) {
    if (line.indexOf(BLANK) < 0) return line;
    const before = line.slice(0, line.indexOf(BLANK));
    const after = line.slice(line.indexOf(BLANK) + BLANK.length);
    let slots = '';
    for (let i = 0; i < BLANK.length; i++) {
      slots += '<span class="poem-slot" data-k="' + i + '"></span>';
    }
    return before + slots + after;
  }

  function build() {
    const p = DD.content.poem;
    const rows = p.lines.map(function (pair, r) {
      return '<p class="poem-line">' + lineHtml(pair[0]) + '<br>' + lineHtml(pair[1]) + '</p>';
    }).join('');

    root.innerHTML =
      '<div class="poem-sheet">' +
        '<p class="poem-title">就义辞</p>' +
        '<div class="poem-body">' + rows + '</div>' +
        '<p class="poem-hint">把缺的三个字填回去</p>' +
        '<div class="poem-pool"></div>' +
        '<p class="poem-note">' + p.note + '</p>' +
      '</div>';

    const pool = root.querySelector('.poem-pool');
    shuffle(POOL).forEach(function (ch) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'poem-key';
      b.textContent = ch;
      b.addEventListener('click', function () { pick(ch, b); });
      pool.appendChild(b);
    });
  }

  function pick(ch, btn) {
    if (done) return;
    const need = BLANK[filled.length];
    if (ch !== need) {
      if (DD.audio) DD.audio.wrong(0.5);
      if (DD.motion) DD.motion.shake(btn, { duration: 380 });
      if (DD.stage && DD.stage.mistake) DD.stage.mistake(1);
      return;
    }
    const slot = root.querySelector('.poem-slot[data-k="' + filled.length + '"]');
    filled.push(ch);
    if (slot) {
      slot.textContent = ch;
      slot.classList.add('is-filled');
      if (DD.motion) DD.motion.inUp(slot, { duration: 520, dy: 14 });
    }
    btn.classList.add('is-used');
    btn.disabled = true;
    if (DD.audio) DD.audio.tap(0.9);

    if (filled.length >= BLANK.length) finish();
  }

  function finish() {
    if (done) return;
    done = true;
    const sheet = root.querySelector('.poem-sheet');
    if (sheet) sheet.classList.add('is-done');
    const hint = root.querySelector('.poem-hint');
    if (hint) hint.textContent = '山河未复志未酬。';
    if (DD.audio) { DD.audio.bell(0.5); }
    DD.stage.markDone(6);
    goTimer = setTimeout(function () {
      if (DD.stage.index === 6) DD.stage.go(7);
    }, 2600);
  }

  function reset() {
    clearTimeout(goTimer);
    goTimer = 0;
    filled = [];
    done = false;
    build();
  }

  function init() {
    root = document.getElementById('poem');
    if (!root) return;
    build();
    DD.stage.on('scene', function (e) {
      if (e.reset) { reset(); return; }
      if (e.i !== 6) { clearTimeout(goTimer); goTimer = 0; }
    });
  }

  DD.modules.push({ init: init });
})();
