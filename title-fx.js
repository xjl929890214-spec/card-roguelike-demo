/* ============================================================
 *  title-fx.js  —  首页视觉/交互效果
 *  1) CRT 开机启动序列
 *  2) 鼠标视差 (背景色块 + 卡牌道具)
 *  3) PLAY 按下的 CRT 频道切换过场
 *  4) Logo "A" 方块彩蛋
 *  5) 像素 pip 上升粒子
 * ============================================================ */
(function () {
  const titleScene = document.getElementById('scene-title');
  if (!titleScene) return;

  /* ---------- 1. CRT 开机启动序列 ---------- */
  function bootIntro() {
    const ov = document.createElement('div');
    ov.className = 'boot-overlay';
    ov.innerHTML = `
      <div class="boot-noise"></div>
      <div class="boot-line"></div>
      <div class="boot-text">SYSTEM · BOOTING</div>
    `;
    document.body.appendChild(ov);
    setTimeout(() => ov.remove(), 1400);
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootIntro);
  } else {
    bootIntro();
  }

  /* ---------- 2. 鼠标视差 ---------- */
  // 直接用 CSS `translate` 属性 (与 transform 互不干扰，可叠加在已有动画 transform 上)
  const layers = [
    { sel: '.bg-blob-red',   x:  18, y:  10 },
    { sel: '.bg-blob-blue',  x: -18, y: -10 },
    { sel: '.bg-blob-red2',  x:  10, y:   6 },
    { sel: '.bg-blob-blue2', x: -10, y:  -6 },
    { sel: '.bg-suits',      x:   8, y:   4 },
    { sel: '.title-card-prop.side-left',  x: -22, y: -8 },
    { sel: '.title-card-prop.side-right', x:  22, y: -8 },
    { sel: '.title-wrap',    x:  -4, y:  -3 },
  ];
  const targets = layers.map(l => ({ ...l, els: titleScene.querySelectorAll(l.sel) }));
  let mx = 0, my = 0, tx = 0, ty = 0, raf = null;
  function tick() {
    raf = null;
    tx += (mx - tx) * 0.08;
    ty += (my - ty) * 0.08;
    targets.forEach(t => {
      t.els.forEach(el => {
        el.style.translate = `${tx * t.x}px ${ty * t.y}px`;
      });
    });
    if (Math.abs(mx - tx) > 0.001 || Math.abs(my - ty) > 0.001) {
      raf = requestAnimationFrame(tick);
    }
  }
  titleScene.addEventListener('mousemove', e => {
    const r = titleScene.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width  - 0.5;
    my = (e.clientY - r.top)  / r.height - 0.5;
    if (!raf) raf = requestAnimationFrame(tick);
  });
  titleScene.addEventListener('mouseleave', () => {
    mx = 0; my = 0;
    if (!raf) raf = requestAnimationFrame(tick);
  });

  /* ---------- 3. PLAY → game CRT 频道切换 ---------- */
  function wrapSceneSwitch() {
    if (!window.switchScene || window.__switchSceneWrapped) return;
    const orig = window.switchScene;
    window.switchScene = function (name) {
      const leavingTitle =
        document.querySelector('#scene-title.active') &&
        name !== 'title';
      if (!leavingTitle) { orig(name); return; }
      document.body.classList.add('crt-switching');
      // 中段切换场景，被压扁的画面盖住 swap
      setTimeout(() => orig(name), 230);
      setTimeout(() => document.body.classList.remove('crt-switching'), 540);
    };
    window.__switchSceneWrapped = true;
  }
  // game.js 在自身脚本结尾 export window.switchScene；我们晚于它执行
  if (window.switchScene) wrapSceneSwitch();
  else document.addEventListener('DOMContentLoaded', wrapSceneSwitch);

  /* ---------- 4. Logo "A" 方块彩蛋 ---------- */
  const ace = titleScene.querySelector('.logo-ace');
  if (ace) {
    ace.addEventListener('click', (e) => {
      e.stopPropagation();
      ace.classList.remove('ace-bonk');
      void ace.offsetWidth;
      ace.classList.add('ace-bonk');

      const suits = ['♠','♥','♦','♣'];
      const idx = Math.floor(Math.random() * 4);
      const pip = document.createElement('span');
      pip.className = 'ace-pip';
      pip.textContent = suits[idx];
      if (idx === 1 || idx === 2) pip.classList.add('red');
      // 随机水平偏移，更像迸出来
      pip.style.setProperty('--ace-pip-x', (Math.random() * 60 - 30) + 'px');
      pip.style.setProperty('--ace-pip-r', (Math.random() * 60 - 30) + 'deg');
      ace.appendChild(pip);
      setTimeout(() => pip.remove(), 1200);
      window.Sounds && window.Sounds.play('card_select');
    });
  }

  /* ---------- 5. 像素 pip 上升粒子 ---------- */
  const SUITS = ['♠','♥','♦','♣'];
  function spawnRisingPip() {
    if (!titleScene.classList.contains('active')) return;
    const pip = document.createElement('div');
    const idx = Math.floor(Math.random() * 4);
    pip.className = 'rising-pip' + ((idx === 1 || idx === 2) ? ' red' : '');
    pip.textContent = SUITS[idx];
    pip.style.left = (4 + Math.random() * 92) + 'vw';
    pip.style.fontSize = (10 + Math.random() * 14) + 'px';
    const dur = 16 + Math.random() * 12;
    pip.style.animationDuration = dur + 's';
    pip.style.setProperty('--pip-drift', (Math.random() * 60 - 30) + 'px');
    pip.style.opacity = (0.18 + Math.random() * 0.35).toFixed(2);
    titleScene.appendChild(pip);
    setTimeout(() => pip.remove(), dur * 1000 + 200);
  }
  // 低密度，~3.2s 一次
  setInterval(spawnRisingPip, 3200);
  // 启动时先丢几颗，避免空场
  for (let i = 0; i < 3; i++) setTimeout(spawnRisingPip, i * 800);
})();
