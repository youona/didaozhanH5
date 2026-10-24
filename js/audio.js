/* audio.js — WebAudio 纯合成音效，不依赖任何音频文件 */
(function () {
  const DD = (window.DD = window.DD || {});

  let ctx = null;
  let master = null;
  let muted = false;
  let windNodes = null;

  function ensure() {
    if (ctx) {
      if (ctx.state === 'suspended') ctx.resume();
      return ctx;
    }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    try {
      ctx = new AC();
    } catch (e) {
      return null;
    }
    master = ctx.createGain();
    master.gain.value = 0.85;
    master.connect(ctx.destination);
    return ctx;
  }

  function now() { return ctx ? ctx.currentTime : 0; }

  function noise(sec) {
    const len = Math.max(1, Math.floor(ctx.sampleRate * sec));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = (last + 0.02 * w) / 1.02;
      d[i] = last * 3.2;
    }
    return buf;
  }

  function envGain(t0, peak, attack, decay) {
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay);
    return g;
  }

  /* 铜钟：基频 + 三个非整数泛音 + 敲击瞬态 */
  function bell(vol) {
    if (!ensure() || muted) return;
    const t = now();
    const v = vol == null ? 1 : vol;
    const partials = [
      [523, 'sine', 0.34, 2.9],
      [1049, 'triangle', 0.16, 2.1],
      [1571, 'sine', 0.09, 1.4],
      [2093, 'sine', 0.05, 0.9]
    ];
    partials.forEach(function (p, k) {
      const o = ctx.createOscillator();
      o.type = p[1];
      o.frequency.setValueAtTime(p[0], t);
      o.frequency.exponentialRampToValueAtTime(p[0] * 0.985, t + p[3]);
      const g = envGain(t, p[2] * v, 0.008 + k * 0.002, p[3]);
      o.connect(g);
      g.connect(master);
      o.start(t);
      o.stop(t + p[3] + 0.1);
    });
    const n = ctx.createBufferSource();
    n.buffer = noise(0.08);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 2600;
    bp.Q.value = 1.2;
    const ng = envGain(t, 0.13 * v, 0.004, 0.09);
    n.connect(bp); bp.connect(ng); ng.connect(master);
    n.start(t);
  }

  /* 枪声：噪声爆发 + 低频 thump + 短回声 */
  function gun(vol) {
    if (!ensure() || muted) return;
    const t = now();
    const v = vol == null ? 1 : vol;

    const n = ctx.createBufferSource();
    n.buffer = noise(0.22);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.setValueAtTime(4200, t);
    lp.frequency.exponentialRampToValueAtTime(600, t + 0.18);
    const ng = envGain(t, 0.5 * v, 0.003, 0.19);
    n.connect(lp); lp.connect(ng); ng.connect(master);
    n.start(t);

    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(120, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.16);
    const og = envGain(t, 0.42 * v, 0.004, 0.17);
    o.connect(og); og.connect(master);
    o.start(t); o.stop(t + 0.24);

    const n2 = ctx.createBufferSource();
    n2.buffer = noise(0.3);
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.frequency.value = 900;
    const g2 = envGain(t + 0.2, 0.07 * v, 0.02, 0.26);
    n2.connect(bp); bp.connect(g2); g2.connect(master);
    n2.start(t + 0.2);
  }

  /* 刨土 / 落土 */
  function dig(vol) {
    if (!ensure() || muted) return;
    const t = now();
    const v = vol == null ? 1 : vol;
    const n = ctx.createBufferSource();
    n.buffer = noise(0.14);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 420 + Math.random() * 260;
    lp.Q.value = 0.9;
    const g = envGain(t, 0.2 * v, 0.006, 0.12);
    n.connect(lp); lp.connect(g); g.connect(master);
    n.start(t);
  }

  /* 轻点 */
  function tap(vol) {
    if (!ensure() || muted) return;
    const t = now();
    const v = vol == null ? 1 : vol;
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(560, t + 0.05);
    const g = envGain(t, 0.09 * v, 0.003, 0.06);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.1);
  }

  /* 翻页 */
  function page(vol) {
    if (!ensure() || muted) return;
    const t = now();
    const v = vol == null ? 1 : vol;
    const n = ctx.createBufferSource();
    n.buffer = noise(0.09);
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 2200;
    const g = envGain(t, 0.1 * v, 0.004, 0.07);
    n.connect(hp); hp.connect(g); g.connect(master);
    n.start(t);
  }

  /* 正确 / 错误 */
  function ok(vol) {
    if (!ensure() || muted) return;
    const t = now();
    const v = vol == null ? 1 : vol;
    [660, 990].forEach(function (f, k) {
      const o = ctx.createOscillator();
      o.type = 'sine';
      o.frequency.value = f;
      const g = envGain(t + k * 0.09, 0.14 * v, 0.01, 0.28);
      o.connect(g); g.connect(master);
      o.start(t + k * 0.09); o.stop(t + k * 0.09 + 0.4);
    });
  }

  function wrong(vol) {
    if (!ensure() || muted) return;
    const t = now();
    const v = vol == null ? 1 : vol;
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.setValueAtTime(190, t);
    o.frequency.exponentialRampToValueAtTime(96, t + 0.26);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 700;
    const g = envGain(t, 0.17 * v, 0.01, 0.26);
    o.connect(lp); lp.connect(g); g.connect(master);
    o.start(t); o.stop(t + 0.36);
  }

  /* 环境风：循环噪声 + 缓慢起伏 */
  function wind(on) {
    if (!ensure()) return;
    if (on && !windNodes && !muted) {
      const src = ctx.createBufferSource();
      src.buffer = noise(4);
      src.loop = true;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 420;
      const g = ctx.createGain();
      g.gain.value = 0.0001;
      g.gain.exponentialRampToValueAtTime(0.055, now() + 2.4);
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = ctx.createGain();
      lfoGain.gain.value = 0.022;
      lfo.connect(lfoGain); lfoGain.connect(g.gain);
      src.connect(lp); lp.connect(g); g.connect(master);
      src.start(); lfo.start();
      windNodes = { src: src, g: g, lfo: lfo };
    } else if (!on && windNodes) {
      const w = windNodes;
      windNodes = null;
      try {
        w.g.gain.cancelScheduledValues(now());
        w.g.gain.setValueAtTime(w.g.gain.value, now());
        w.g.gain.exponentialRampToValueAtTime(0.0001, now() + 1.2);
        setTimeout(function () {
          try { w.src.stop(); w.lfo.stop(); } catch (e) {}
        }, 1400);
      } catch (e) {}
    }
  }

  function setMuted(v) {
    muted = !!v;
    if (muted) wind(false);
    if (master && ctx) {
      master.gain.cancelScheduledValues(ctx.currentTime);
      master.gain.setValueAtTime(muted ? 0.0001 : 0.85, ctx.currentTime);
    }
    if (!muted && windNodes) wind(true);
  }

  function unlock() { ensure(); }

  DD.audio = {
    unlock: unlock,
    bell: bell,
    gun: gun,
    dig: dig,
    tap: tap,
    page: page,
    ok: ok,
    wrong: wrong,
    wind: wind,
    setMuted: setMuted,
    isMuted: function () { return muted; }
  };
})();
