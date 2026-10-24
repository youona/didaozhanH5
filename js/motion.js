/* motion.js — Web Animations API 封装 */
(function () {
  const DD = (window.DD = window.DD || {});

  const EASE = 'cubic-bezier(.23,.65,.27,1)';
  const EASE_SOFT = 'cubic-bezier(.33,.1,.25,1)';
  // 动画一律照播：这里的动效是交互反馈（翻卡、甩土、电流），
  // 系统「减少动态效果」不再让它们静默跳过。
  const reduce = false;

  function motion(el, keyframes, opts) {
    if (!el) return null;
    const o = opts || {};
    const duration = o.duration == null ? 600 : o.duration;
    const delay = o.delay || 0;
    const easing = o.easing || EASE;
    const fill = o.fill || 'both';
    if (duration <= 0) {
      const last = Array.isArray(keyframes) ? keyframes[keyframes.length - 1] : keyframes;
      if (last && last.opacity != null) el.style.opacity = last.opacity;
      return null;
    }
    return el.animate(keyframes, { duration, delay, easing, fill });
  }

  function inUp(el, opts) {
    const o = opts || {};
    const dy = o.dy == null ? 34 : o.dy;
    const dx = o.dx == null ? 0 : o.dx;
    return motion(
      el,
      [
        { opacity: 0, transform: 'translate3d(' + dx + 'px,' + dy + 'px,0)' },
        { opacity: 1, transform: 'translate3d(0,0,0)' }
      ],
      { duration: o.duration || 780, delay: o.delay || 0, easing: EASE_SOFT }
    );
  }

  function fade(el, from, to, opts) {
    const o = opts || {};
    return motion(el, [{ opacity: from }, { opacity: to }], {
      duration: o.duration || 600,
      delay: o.delay || 0,
      easing: o.easing || EASE_SOFT
    });
  }

  function stagger(els, opts) {
    const o = opts || {};
    const list = Array.prototype.slice.call(els);
    list.forEach(function (el, k) {
      inUp(el, {
        duration: o.duration || 760,
        delay: (o.from || 0) + k * (o.step == null ? 80 : o.step),
        dy: o.dy == null ? 30 : o.dy
      });
    });
    return list.length;
  }

  function flip(el, opts) {
    const o = opts || {};
    return motion(
      el,
      [
        { transform: 'perspective(1400px) rotateY(0deg)' },
        { transform: 'perspective(1400px) rotateY(180deg)' }
      ],
      { duration: o.duration || 820, easing: EASE, delay: o.delay || 0 }
    );
  }

  function shake(el, opts) {
    const o = opts || {};
    return motion(
      el,
      [
        { transform: 'translate3d(0,0,0)' },
        { transform: 'translate3d(-10px,0,0)' },
        { transform: 'translate3d(9px,0,0)' },
        { transform: 'translate3d(-6px,0,0)' },
        { transform: 'translate3d(0,0,0)' }
      ],
      { duration: o.duration || 420, easing: 'ease-in-out' }
    );
  }

  function bump(el, opts) {
    const o = opts || {};
    return motion(
      el,
      [
        { transform: 'scale(1)' },
        { transform: 'scale(' + (o.to || 1.12) + ')' },
        { transform: 'scale(1)' }
      ],
      { duration: o.duration || 380, easing: EASE }
    );
  }

  DD.motion = {
    motion: motion,
    inUp: inUp,
    fade: fade,
    stagger: stagger,
    flip: flip,
    shake: shake,
    bump: bump,
    EASE: EASE,
    EASE_SOFT: EASE_SOFT,
    reduce: reduce
  };
})();
