/* ============================================================
 *  collection.js  —  Joker 图鉴
 *  - 标题页 COLLECTION 按钮打开
 *  - 展示 game.js 里 JOKERS 全列表
 *  - 未拥有过的 Joker 显示为锁定状态（灰色 + ???）
 *  - "拥有过"状态保存在 localStorage（每当 buyJoker 或新局开始时记录）
 * ============================================================ */

(function () {
  const SEEN_KEY = 'balatro_demo_seen_jokers_v1';

  function loadSeen() {
    try { return new Set(JSON.parse(localStorage.getItem(SEEN_KEY) || '[]')); }
    catch (e) { return new Set(); }
  }
  function saveSeen(s) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s])); } catch (e) {}
  }

  const seen = loadSeen();

  // 自动收录：监听 state.jokers 变化
  function recordCurrentJokers() {
    if (!window.state || !state.jokers) return;
    let changed = false;
    for (const j of state.jokers) {
      if (j && j.id && !seen.has(j.id)) {
        seen.add(j.id); changed = true;
      }
    }
    if (changed) saveSeen(seen);
  }
  setInterval(recordCurrentJokers, 1500);

  // ---------- 注入样式 ----------
  const css = `
.collection-modal {
  position: fixed; inset: 0; background: rgba(0,0,0,0.78);
  display:none; align-items:center; justify-content:center;
  z-index: 20000; font-family: 'VT323', monospace;
}
.collection-modal.show { display:flex; }
.collection-card {
  width: 720px; max-width: 94vw; max-height: 86vh; overflow:hidden;
  display:flex; flex-direction:column;
  background: #1a2030;
  border: 4px solid #f4f1e8;
  border-radius: 14px;
  box-shadow: 0 8px 0 rgba(0,0,0,0.6), 0 0 0 4px #000;
}
.collection-head {
  display:flex; align-items:center; justify-content:space-between;
  padding: 16px 22px;
  border-bottom: 2px solid rgba(244,241,232,0.2);
}
.collection-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 14px;
  letter-spacing: 2px;
  color: #fcd34d;
  text-shadow: 2px 2px 0 #000;
}
.collection-counter { font-size: 18px; color:#f4f1e8; opacity:0.75; }
.collection-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 12px;
  padding: 20px;
  overflow-y: auto;
}
.coll-joker {
  background: #2a3148;
  border: 2px solid #6a7090;
  border-radius: 8px;
  padding: 10px;
  text-align: center;
  color: #f4f1e8;
  position: relative;
  transition: transform 0.15s ease;
}
.coll-joker:hover { transform: translateY(-3px); }
.coll-joker.locked { opacity: 0.55; filter: grayscale(0.9); }
.coll-joker .ca-art { font-size: 38px; line-height: 1; margin: 4px 0 6px; }
.coll-joker .ca-name { font-size: 16px; font-weight: bold; margin-bottom: 4px; }
.coll-joker .ca-desc { font-size: 13px; opacity: 0.78; min-height: 32px; }
.coll-joker .ca-rarity {
  position: absolute; top: 4px; right: 6px;
  font-size: 11px; padding: 1px 6px; border-radius: 6px;
  background: rgba(0,0,0,0.45);
}
.coll-joker.r-common   .ca-rarity { color: #9CA3AF; }
.coll-joker.r-uncommon .ca-rarity { color: #3B82F6; }
.coll-joker.r-rare     .ca-rarity { color: #EF4444; }
.collection-footer {
  padding: 12px 22px;
  border-top: 2px solid rgba(244,241,232,0.2);
  display:flex; justify-content: center;
}
.collection-footer .btn { padding: 8px 22px; font-size: 18px; }
`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------- 注入 DOM ----------
  const modal = document.createElement('div');
  modal.className = 'collection-modal';
  modal.innerHTML = `
    <div class="collection-card">
      <div class="collection-head">
        <div class="collection-title">JOKER COLLECTION</div>
        <div class="collection-counter" id="collCounter">0 / 0</div>
      </div>
      <div class="collection-grid" id="collGrid"></div>
      <div class="collection-footer">
        <button class="btn btn-yellow" id="collClose">CLOSE</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);

  const grid    = modal.querySelector('#collGrid');
  const counter = modal.querySelector('#collCounter');
  const closeBtn = modal.querySelector('#collClose');

  function render() {
    const list = (window.JOKERS || []);
    grid.innerHTML = '';
    let owned = 0;
    for (const j of list) {
      const isSeen = seen.has(j.id);
      if (isSeen) owned++;
      const card = document.createElement('div');
      card.className = `coll-joker r-${j.rarity || 'common'}${isSeen ? '' : ' locked'}`;
      card.innerHTML = `
        <span class="ca-rarity">${(j.rarity || 'common').toUpperCase()}</span>
        <div class="ca-art">${isSeen ? (j.art || '🃏') : '❔'}</div>
        <div class="ca-name">${isSeen ? j.name : '???'}</div>
        <div class="ca-desc">${isSeen ? (j.desc || '') : '尚未拥有'}</div>
      `;
      grid.appendChild(card);
    }
    counter.textContent = `${owned} / ${list.length}`;
  }

  function open() {
    recordCurrentJokers();
    render();
    modal.classList.add('show');
    if (window.Sounds) Sounds.play('btn_click');
  }
  function close() {
    modal.classList.remove('show');
    if (window.Sounds) Sounds.play('btn_hover');
  }

  closeBtn.addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) close();
  });

  function wire() {
    document.querySelectorAll('[data-action="collection"]').forEach(btn => {
      btn.addEventListener('click', open);
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wire);
  else wire();

  window.Collection = { open, close, seen: () => new Set(seen) };
})();
