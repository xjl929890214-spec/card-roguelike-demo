/* ============================================================
 *  particles.js  —  独立 canvas 粒子层
 *  - 击败盲注 → 撒彩色纸屑
 *  - 购买/获得金币 → 金币雨
 *  - Joker 触发 → 黄色火花
 *  - 完全独立的覆盖层，pointer-events:none，不阻挡任何交互
 *  - 通过包装 Sounds.play 与监听 .joker-card.triggered 来感知事件
 * ============================================================ */

(function () {
  // ---------- 创建 canvas ----------
  const canvas = document.createElement('canvas');
  canvas.id = 'fx-canvas';
  Object.assign(canvas.style, {
    position: 'fixed',
    inset: '0',
    pointerEvents: 'none',
    zIndex: '9000',
  });
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width  = innerWidth  * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width  = innerWidth + 'px';
    canvas.style.height = innerHeight + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  addEventListener('resize', resize);

  // ---------- 粒子池 ----------
  const particles = [];

  function rand(a, b) { return a + Math.random() * (b - a); }

  function spawnConfetti(x, y, count = 80) {
    const colors = ['#f4c84a', '#c8302a', '#1d6fb8', '#2a8c54', '#f4f1e8', '#ff6a5a'];
    for (let i = 0; i < count; i++) {
      particles.push({
        kind: 'confetti',
        x, y,
        vx: rand(-6, 6),
        vy: rand(-12, -4),
        gravity: 0.35,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.3, 0.3),
        size: rand(6, 12),
        color: colors[(Math.random() * colors.length) | 0],
        life: rand(1800, 2600),
        born: performance.now(),
      });
    }
  }

  function spawnCoins(x, y, count = 16) {
    for (let i = 0; i < count; i++) {
      particles.push({
        kind: 'coin',
        x: x + rand(-20, 20),
        y: y + rand(-10, 10),
        vx: rand(-3, 3),
        vy: rand(-9, -3),
        gravity: 0.45,
        rot: rand(0, Math.PI * 2),
        vr: rand(-0.2, 0.2),
        size: rand(10, 16),
        life: rand(900, 1400),
        born: performance.now(),
      });
    }
  }

  function spawnSparks(x, y, count = 20) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(2, 6);
      particles.push({
        kind: 'spark',
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - 1,
        gravity: 0.15,
        size: rand(2, 4),
        color: Math.random() < 0.6 ? '#fcd34d' : '#fff7c2',
        life: rand(400, 800),
        born: performance.now(),
      });
    }
  }

  // ---------- 渲染 ----------
  function tick() {
    const now = performance.now();
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      const age = now - p.born;
      if (age > p.life) { particles.splice(i, 1); continue; }
      const t = age / p.life;
      p.vy += p.gravity;
      p.x += p.vx;
      p.y += p.vy;
      if (p.vr) p.rot += p.vr;

      ctx.globalAlpha = 1 - t;
      if (p.kind === 'confetti') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size/2, -p.size/4, p.size, p.size/2);
        ctx.restore();
      } else if (p.kind === 'coin') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        const w = p.size * Math.abs(Math.cos(p.rot * 1.5));
        ctx.fillStyle = '#f4c84a';
        ctx.strokeStyle = '#8a6a18';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(2, w), p.size, 0, 0, Math.PI*2);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#8a6a18';
        ctx.font = `bold ${p.size}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        if (w > p.size * 0.5) ctx.fillText('$', 0, 1);
        ctx.restore();
      } else if (p.kind === 'spark') {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * (1 - t * 0.5), 0, Math.PI*2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;
    requestAnimationFrame(tick);
  }
  tick();

  // ---------- 事件感知 ----------
  function center(el) {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width/2, y: r.top + r.height/2 };
  }

  // 包装 Sounds.play
  function wrapSounds() {
    if (!window.Sounds || window.Sounds._fxWrapped) return;
    const orig = Sounds.play.bind(Sounds);
    Sounds.play = function (name) {
      orig(name);
      if (name === 'blind_win') {
        const cx = innerWidth / 2;
        spawnConfetti(cx, innerHeight * 0.4, 120);
        setTimeout(() => spawnConfetti(cx - 120, innerHeight * 0.5, 40), 150);
        setTimeout(() => spawnConfetti(cx + 120, innerHeight * 0.5, 40), 280);
      } else if (name === 'purchase' || name === 'coin') {
        const moneyEl = document.querySelector('#shopMoney') || document.querySelector('#money');
        if (moneyEl) {
          const p = center(moneyEl);
          spawnCoins(p.x, p.y, 14);
        }
      }
    };
    Sounds._fxWrapped = true;
  }
  wrapSounds();
  // 二次保险：如果 Sounds 还没就绪，每 100ms 再试一次（持续 1 秒）
  let tries = 10;
  const wrapTimer = setInterval(() => {
    if (--tries <= 0 || (window.Sounds && Sounds._fxWrapped)) clearInterval(wrapTimer);
    else wrapSounds();
  }, 100);

  // 监听 Joker 触发动画
  function watchJokerRow() {
    const row = document.querySelector('#jokerRow');
    if (!row) { setTimeout(watchJokerRow, 200); return; }
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type !== 'attributes') continue;
        const el = m.target;
        if (el.classList && el.classList.contains('triggered')) {
          const p = center(el);
          spawnSparks(p.x, p.y - 10, 18);
        }
      }
    });
    obs.observe(row, { attributes: true, subtree: true, attributeFilter: ['class'] });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', watchJokerRow);
  } else {
    watchJokerRow();
  }

  window.FX = { confetti: spawnConfetti, coins: spawnCoins, sparks: spawnSparks };
})();
