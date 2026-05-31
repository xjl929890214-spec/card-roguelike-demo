/* ============================================================
 *  title-fx.js  —  首页视觉/交互效果（轻量版，不阻塞点击）
 * ============================================================ */
(function () {
  const titleScene = document.getElementById('scene-title');
  if (!titleScene) return;

  function syncTitleCrtClass() {
    const on = titleScene.classList.contains('active');
    document.body.classList.toggle('title-crt-active', on);
    document.body.classList.toggle('on-title', on);
  }
  syncTitleCrtClass();
  const obs = new MutationObserver(syncTitleCrtClass);
  obs.observe(titleScene, { attributes: true, attributeFilter: ['class'] });

  /* ---------- 1. 短开机动画（仅首次，不挡点击） ---------- */
  function bootIntro() {
    try {
      const bootKey = window.JokerState?.storage?.boot || 'joker_state_boot_done';
      if (sessionStorage.getItem(bootKey)) return;
      sessionStorage.setItem(bootKey, '1');
    } catch (e) {}

    const ov = document.createElement('div');
    ov.className = 'boot-overlay boot-overlay--title';
    ov.innerHTML = `
      <div class="boot-noise"></div>
      <div class="boot-line"></div>
      <div class="boot-text boot-text--phase1">SYSTEM · BOOTING</div>
      <div class="boot-text boot-text--phase2">JOKER STATE</div>
    `;
    document.body.appendChild(ov);
    setTimeout(() => ov.remove(), 1200);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootIntro);
  } else {
    bootIntro();
  }

  /* ---------- 2. 鼠标视差（仅标题页激活时） ---------- */
  const isAssetTitle = titleScene.classList.contains('title-style-assets');
  const layers = isAssetTitle
    ? [
      { sel: '.title-skyline-wrap', x: 0, y: 2 },
      { sel: '.title-brand',        x: 0, y: -4 },
      { sel: '.title-menu',         x: 0, y: 2 },
    ]
    : titleScene.classList.contains('title-style-a')
    ? [
      { sel: '.bg-blob-red',   x:  14, y:   8 },
      { sel: '.bg-blob-blue',  x: -14, y:  -8 },
      { sel: '.bg-blob-red2',  x:   8, y:   5 },
      { sel: '.bg-blob-blue2', x:  -8, y:  -5 },
      { sel: '.title-brand',   x:   0, y:  -6 },
      { sel: '.title-menu',    x:   0, y:   4 },
    ]
    : [
      { sel: '.bg-blob-red',   x:  18, y:  10 },
      { sel: '.bg-blob-blue',  x: -18, y: -10 },
      { sel: '.bg-blob-red2',  x:  10, y:   6 },
      { sel: '.bg-blob-blue2', x: -10, y:  -6 },
      { sel: '.bg-suits',      x:   8, y:   4 },
      { sel: '.title-card-prop.side-left',  x: -22, y: -8 },
      { sel: '.title-card-prop.side-right', x:  22, y: -8 },
    ];
  const targets = layers.map(l => ({ ...l, els: titleScene.querySelectorAll(l.sel) }));
  let mx = 0, my = 0, tx = 0, ty = 0, raf = null;

  function tick() {
    raf = null;
    if (!titleScene.classList.contains('active')) return;
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
    if (!titleScene.classList.contains('active')) return;
    const r = titleScene.getBoundingClientRect();
    mx = (e.clientX - r.left) / r.width  - 0.5;
    my = (e.clientY - r.top)  / r.height - 0.5;
    if (!raf) raf = requestAnimationFrame(tick);
  });

  titleScene.addEventListener('mouseleave', () => {
    mx = 0; my = 0;
    if (!raf) raf = requestAnimationFrame(tick);
  });

  /* ---------- 3. 场景切换：立即切场景，仅保留视觉特效 ---------- */
  function wrapSceneSwitch() {
    if (!window.switchScene || window.__switchSceneWrapped) return;
    const orig = window.switchScene;
    window.switchScene = function (name) {
      const leavingTitle =
        document.querySelector('#scene-title.active') &&
        name !== 'title';
      orig(name);
      if (leavingTitle) {
        document.body.classList.add('crt-switching');
        setTimeout(() => document.body.classList.remove('crt-switching'), 540);
      }
    };
    window.__switchSceneWrapped = true;
  }

  if (window.switchScene) wrapSceneSwitch();
  else document.addEventListener('DOMContentLoaded', wrapSceneSwitch);

  /* ---------- 4. Logo "A" 方块彩蛋 ---------- */
  const ace = titleScene.querySelector('.title-logo-card');
  if (ace) {
    ace.style.cursor = 'pointer';
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
      pip.style.setProperty('--ace-pip-x', (Math.random() * 60 - 30) + 'px');
      pip.style.setProperty('--ace-pip-r', (Math.random() * 60 - 30) + 'deg');
      ace.appendChild(pip);
      setTimeout(() => pip.remove(), 1200);
      window.Sounds && window.Sounds.play('card_select');
    });
  }

  /* ---------- 5. 低密度 pip 粒子（标题页才生成） ---------- */
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
    const host = titleScene.querySelector('.title-bg') || titleScene;
    host.appendChild(pip);
    setTimeout(() => pip.remove(), dur * 1000 + 200);
  }

  setInterval(spawnRisingPip, 5500);

  /* ---------- 6. 标题故障闪烁（随机强 glitch） ---------- */
  const titleLogo = titleScene.querySelector('.title-logo');
  if (titleLogo) {
    function burstGlitch() {
      if (!titleScene.classList.contains('active')) return;
      titleLogo.classList.remove('title-glitch-hit');
      void titleLogo.offsetWidth;
      titleLogo.classList.add('title-glitch-hit');
      setTimeout(() => titleLogo.classList.remove('title-glitch-hit'), 380);
    }
    setInterval(() => {
      if (!titleScene.classList.contains('active')) return;
      if (Math.random() < 0.55) burstGlitch();
    }, 5200 + Math.random() * 2800);
    setTimeout(burstGlitch, 1800);
  }
})();
