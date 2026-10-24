/* poster.js — 尾声：Canvas 生成分享海报 */
(function () {
  const DD = (window.DD = window.DD || {});
  DD.modules = DD.modules || [];

  const W = 750;
  const H = 1334;

  let canvas, ctx, btn;
  let seed = 1;

  function rnd() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  function drawNet(cx, cy, w, h) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // 四条干线：十字街
    ctx.strokeStyle = 'rgba(140, 47, 36, .5)';
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2); ctx.lineTo(0, h / 2);
    ctx.moveTo(-w / 2, 0); ctx.lineTo(w / 2, 0);
    ctx.stroke();

    // 支线：从干线探出去的折线，户通户、村连村
    ctx.strokeStyle = 'rgba(93, 71, 44, .42)';
    ctx.lineWidth = 2;
    const branches = [
      [-w / 2 + 28, 0, -w / 2 + 28, -h * 0.30, -w * 0.20, -h * 0.30],
      [-w / 2 + 62, 0, -w / 2 + 62, h * 0.26],
      [-w * 0.30, 0, -w * 0.30, h * 0.34],
      [w * 0.26, 0, w * 0.26, -h * 0.28],
      [w / 2 - 42, 0, w / 2 - 42, h * 0.30, w * 0.12, h * 0.30],
      [0, -h * 0.36, w * 0.34, -h * 0.36],
      [0, h * 0.38, -w * 0.36, h * 0.38],
      [w * 0.44, -h * 0.12, w * 0.44, -h * 0.44]
    ];
    branches.forEach(function (b) {
      ctx.beginPath();
      ctx.moveTo(b[0], b[1]);
      for (let i = 2; i < b.length; i += 2) ctx.lineTo(b[i], b[i + 1]);
      ctx.stroke();
    });

    // 十字街口
    ctx.fillStyle = 'rgba(140, 47, 36, .85)';
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();
  }

  function draw() {
    if (!ctx) return;
    seed = 11 + Math.floor(Math.random() * 9000);

    // 纸
    ctx.fillStyle = '#efe6d4';
    ctx.fillRect(0, 0, W, H);

    // 纸纹
    for (let i = 0; i < 2600; i++) {
      const x = rnd() * W;
      const y = rnd() * H;
      ctx.fillStyle = 'rgba(93, 71, 44, ' + (0.012 + rnd() * 0.03).toFixed(3) + ')';
      ctx.fillRect(x, y, 1 + rnd() * 2, 1 + rnd() * 2);
    }

    // 边框
    ctx.strokeStyle = 'rgba(93, 71, 44, .5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(36, 36, W - 72, H - 72);
    ctx.strokeStyle = 'rgba(140, 47, 36, .55)';
    ctx.lineWidth = 1;
    ctx.strokeRect(48, 48, W - 96, H - 96);

    // 顶部小字
    ctx.fillStyle = '#8c2f24';
    ctx.font = '22px "Songti SC", "SimSun", serif';
    ctx.textAlign = 'center';
    ctx.fillText('1 9 4 2   ·   冀   中   平   原', W / 2, 132);

    // 标题
    ctx.fillStyle = '#241d15';
    ctx.font = 'bold 128px "Songti SC", "SimSun", serif';
    ctx.fillText('地道战', W / 2, 300);

    // 英文 / 副题
    ctx.fillStyle = '#7a6650';
    ctx.font = '26px "Songti SC", "SimSun", serif';
    ctx.fillText('地 下 长 城', W / 2, 356);

    // 线条
    ctx.strokeStyle = 'rgba(140, 47, 36, .5)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(W / 2 - 110, 392);
    ctx.lineTo(W / 2 + 110, 392);
    ctx.stroke();

    // 网
    drawNet(W / 2, 640, 300, 300);

    // 主句
    ctx.fillStyle = '#2c2318';
    ctx.font = '40px "Songti SC", "SimSun", serif';
    ctx.fillText('地上没路了，', W / 2, 900);
    ctx.fillText('就往土里走。', W / 2, 962);

    // 引用
    ctx.fillStyle = '#7a6650';
    ctx.font = '22px "Songti SC", "SimSun", serif';
    ctx.fillText('“单口井，双口井，多口井，', W / 2, 1058);
    ctx.fillText('慢慢这么发展，连成一片了。”', W / 2, 1094);

    // 底部
    ctx.fillStyle = '#8c2f24';
    ctx.font = '20px "Songti SC", "SimSun", serif';
    ctx.fillText('冉 庄 地 道 战 遗 址 · 地 下 保 留 三 千 米', W / 2, 1206);

    ctx.fillStyle = 'rgba(93, 71, 44, .55)';
    ctx.font = '17px "PingFang SC", "Microsoft YaHei", sans-serif';
    ctx.fillText('画面为版画示意，非史料影像', W / 2, 1252);
  }

  function init() {
    canvas = document.getElementById('poster');
    btn = document.getElementById('btn-poster');
    if (!canvas) return;
    ctx = canvas.getContext('2d');
    draw();
    if (btn) btn.addEventListener('click', function () { draw(); if (DD.audio) DD.audio.tap(0.7); });

    var saveBtn = document.getElementById('btn-save');
    if (saveBtn) saveBtn.addEventListener('click', function () {
      var label = saveBtn.textContent;
      try {
        var a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = '地道战-地下长城.png';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        if (DD.audio) DD.audio.ok();
        saveBtn.textContent = '已保存';
      } catch (err) {
        if (DD.audio) DD.audio.wrong();
        saveBtn.textContent = '保存失败';
      }
      setTimeout(function () { saveBtn.textContent = label; }, 1800);
    });
    DD.stage.on('scene', function (e) {
      if (e.i === 7) draw();
    });
  }

  DD.modules.push({ init: init });
})();
