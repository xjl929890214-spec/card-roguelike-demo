/* ============================================================
 *  dev-nav.js  —  开发用界面快速跳转（左下角悬浮球）
 * ============================================================ */

(function () {
  const css = `
.dev-nav-root {
  position: fixed;
  left: 14px;
  bottom: 14px;
  z-index: 99990;
  font-family: 'VT323', monospace;
  pointer-events: none;
}
.dev-nav-ball {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  border: 3px solid #fcd34d;
  background: linear-gradient(145deg, #2a3148, #1a2030);
  box-shadow: 0 4px 0 #000, 0 0 12px rgba(252,211,77,0.35);
  color: #fcd34d;
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  line-height: 1.2;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}
.dev-nav-ball:hover { transform: scale(1.06); box-shadow: 0 4px 0 #000, 0 0 18px rgba(252,211,77,0.55); }
.dev-nav-ball.open { background: linear-gradient(145deg, #3a2848, #2a1838); border-color: #ff7b6a; color: #ff7b6a; }

.dev-nav-panel {
  position: absolute;
  left: 0;
  bottom: 56px;
  width: 220px;
  max-height: min(72vh, 520px);
  overflow-y: auto;
  background: rgba(16, 22, 32, 0.96);
  border: 3px solid #f4f1e8;
  border-radius: 12px;
  box-shadow: 0 6px 0 rgba(0,0,0,0.65), 0 0 0 3px #000;
  padding: 10px;
  opacity: 0;
  visibility: hidden;
  transform: translateY(8px) scale(0.96);
  transition: opacity 0.18s ease, transform 0.18s ease, visibility 0.18s;
  pointer-events: none;
}
.dev-nav-panel.show {
  opacity: 1;
  visibility: visible;
  transform: translateY(0) scale(1);
  pointer-events: auto;
}
.dev-nav-head {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #fcd34d;
  letter-spacing: 1px;
  margin-bottom: 8px;
  text-shadow: 1px 1px 0 #000;
}
.dev-nav-group { margin-bottom: 8px; }
.dev-nav-group:last-child { margin-bottom: 0; }
.dev-nav-label {
  font-size: 13px;
  color: #8ab4d4;
  margin-bottom: 4px;
  padding-left: 2px;
  letter-spacing: 1px;
}
.dev-nav-item {
  display: block;
  width: 100%;
  text-align: left;
  padding: 7px 10px;
  margin-bottom: 4px;
  border: 2px solid rgba(244,241,232,0.25);
  border-radius: 8px;
  background: rgba(42, 49, 72, 0.85);
  color: #f4f1e8;
  font-size: 16px;
  cursor: pointer;
  pointer-events: auto;
  transition: background 0.12s, border-color 0.12s, transform 0.12s;
}
.dev-nav-item:hover {
  background: rgba(58, 68, 98, 0.95);
  border-color: #fcd34d;
  transform: translateX(2px);
}
.dev-nav-item:active { transform: translateX(1px) scale(0.98); }
.dev-nav-panel::-webkit-scrollbar { width: 6px; }
.dev-nav-panel::-webkit-scrollbar-thumb { background: rgba(252,211,77,0.35); border-radius: 3px; }
`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function $(sel) { return document.querySelector(sel); }

  function closeAllOverlays() {
    document.querySelectorAll('.modal-overlay').forEach(m => m.classList.add('hidden'));
    document.querySelectorAll('.menu-modal.show, .confirm-modal.show').forEach(m => {
      m.classList.remove('show');
    });
    document.querySelectorAll('.settings-modal.show, .collection-modal.show').forEach(m => {
      m.classList.remove('show');
    });
    window.Settings?.close?.();
    window.PauseMenu?.close?.();
    window.Collection?.close?.();
  }

  function ensureRun() {
    if (!window.state && typeof window.startNewRun === 'function') {
      window.startNewRun();
    }
  }

  function renderGameUI() {
    window.renderHand?.();
    window.renderJokers?.();
    window.renderConsumables?.();
    window.renderStats?.();
  }

  function goScene(name) {
    closeAllOverlays();
    if (name !== 'title') ensureRun();
    window.switchScene?.(name);
    if (name === 'game') renderGameUI();
    if (name === 'shop') previewShop();
  }

  function previewShop() {
    ensureRun();
    window.rollShop?.();
    window.switchScene?.('shop');
    window.renderShop?.();
    const money = $('#shopMoney');
    const score = $('#shopRoundScore');
    if (money) money.textContent = `$${window.state?.money ?? 0}`;
    if (score) score.textContent = String(window.state?.roundScore ?? 0);
  }

  function previewResultWin() {
    closeAllOverlays();
    ensureRun();
    window.switchScene?.('game');
    renderGameUI();
    $('#resultTitle').textContent = 'Small Blind Defeated!';
    $('#resultScore').textContent = '420';
    $('#resultSub').innerHTML = `
      <div class="payout-row"><span>Small Blind Reward</span><span>$$</span></div>
      <div class="payout-row"><span>Hands Left ($1 ea)</span><span>$$</span></div>
      <div class="payout-total">Total: <span class="dollar">$4</span></div>`;
    $('#toShopBtn').textContent = 'Cash Out';
    $('#resultModal').classList.remove('hidden');
  }

  function previewPack() {
    closeAllOverlays();
    ensureRun();
    previewShop();
    const G = window.GameData;
    const pack = G?.packs?.find(p => p.kind === 'joker') || G?.packs?.[0];
    if (pack && typeof window.openPack === 'function') window.openPack(pack);
  }

  const NAV = [
    {
      group: '场景',
      items: [
        { label: '标题页', run: () => goScene('title') },
        { label: '游戏局', run: () => goScene('game') },
        { label: '商店', run: () => goScene('shop') },
      ],
    },
    {
      group: '弹窗',
      items: [
        { label: '回合结算', run: previewResultWin },
        { label: '失败结算', run: () => { closeAllOverlays(); ensureRun(); window.switchScene?.('game'); window.showRoundFail?.(); } },
        { label: '通关胜利', run: () => { closeAllOverlays(); ensureRun(); window.switchScene?.('game'); window.showVictory?.(); } },
        { label: '开包选牌', run: previewPack },
        { label: 'Run Info', run: () => { closeAllOverlays(); ensureRun(); window.switchScene?.('game'); window.showRunInfo?.(); } },
        { label: '暂停菜单', run: () => { closeAllOverlays(); ensureRun(); window.switchScene?.('game'); window.PauseMenu?.open?.(); } },
        { label: '牌型表', run: () => { closeAllOverlays(); window.PauseMenu?.openHandInfo?.(); } },
        { label: '图鉴', run: () => { closeAllOverlays(); window.Collection?.open?.(); } },
        { label: '设置', run: () => { closeAllOverlays(); window.Settings?.open?.(); } },
        { label: '退出提示', run: () => { closeAllOverlays(); window.PauseMenu?.showQuit?.(); } },
      ],
    },
    {
      group: '其他',
      items: [
        { label: '小丑卡展示页', run: () => { window.open('joker-cards.html', '_blank'); } },
      ],
    },
  ];

  const root = document.createElement('div');
  root.className = 'dev-nav-root';
  root.innerHTML = `
    <div class="dev-nav-panel" id="devNavPanel"></div>
    <button type="button" class="dev-nav-ball" id="devNavBall" title="界面跳转">UI</button>
  `;
  document.body.appendChild(root);

  const panel = root.querySelector('#devNavPanel');
  const ball = root.querySelector('#devNavBall');

  panel.innerHTML = `<div class="dev-nav-head">DEV · 界面跳转</div>` +
    NAV.map(g => `
      <div class="dev-nav-group">
        <div class="dev-nav-label">${g.group}</div>
        ${g.items.map(it => `<button type="button" class="dev-nav-item" data-id="${it.label}">${it.label}</button>`).join('')}
      </div>`).join('');

  const actionMap = new Map();
  NAV.forEach(g => g.items.forEach(it => actionMap.set(it.label, it.run)));

  let open = false;
  function setOpen(v) {
    open = v;
    panel.classList.toggle('show', open);
    ball.classList.toggle('open', open);
  }

  ball.addEventListener('click', (e) => {
    e.stopPropagation();
    setOpen(!open);
  });

  panel.addEventListener('click', (e) => {
    const btn = e.target.closest('.dev-nav-item');
    if (!btn) return;
    e.stopPropagation();
    const fn = actionMap.get(btn.dataset.id);
    if (fn) fn();
    setOpen(false);
  });

  document.addEventListener('click', (e) => {
    if (!open) return;
    if (root.contains(e.target)) return;
    setOpen(false);
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && open) setOpen(false);
  });
})();
