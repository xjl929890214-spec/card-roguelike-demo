/* ============================================================
 *  dev-nav.js  —  UI 悬浮球 · 界面快速跳转（左下角）
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
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: 3px solid #fcd34d;
  background: linear-gradient(145deg, #2a3148, #1a2030);
  box-shadow: 0 4px 0 #000, 0 0 12px rgba(252,211,77,0.35);
  color: #fcd34d;
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  line-height: 1.25;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  pointer-events: auto;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  user-select: none;
}
.dev-nav-ball:hover { transform: scale(1.06); box-shadow: 0 4px 0 #000, 0 0 18px rgba(252,211,77,0.55); }
.dev-nav-ball.open {
  background: linear-gradient(145deg, #4a1848, #2a1038);
  border-color: #ff2d6a;
  color: #ffe566;
}

.dev-nav-panel {
  position: absolute;
  left: 0;
  bottom: 56px;
  width: 236px;
  max-height: min(78vh, 560px);
  overflow-y: auto;
  background: rgba(12, 16, 28, 0.97);
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
  font-size: 8px;
  color: #fcd34d;
  letter-spacing: 1px;
  margin-bottom: 4px;
  text-shadow: 1px 1px 0 #000;
}
.dev-nav-where {
  font-size: 14px;
  color: #7dd3fc;
  margin-bottom: 8px;
  padding: 4px 6px;
  background: rgba(0,0,0,0.35);
  border-radius: 6px;
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
  font-size: 15px;
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
.dev-nav-item.accent-vegas {
  border-color: rgba(255, 45, 106, 0.45);
  background: rgba(58, 24, 48, 0.9);
}
.dev-nav-item.accent-vegas:hover { border-color: #ff2d6a; }
.dev-nav-panel::-webkit-scrollbar { width: 6px; }
.dev-nav-panel::-webkit-scrollbar-thumb { background: rgba(252,211,77,0.35); border-radius: 3px; }
`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  function $(sel) { return document.querySelector(sel); }

  function activeSceneLabel() {
    const el = document.querySelector('.scene.active');
    if (!el) return '—';
    const id = el.id.replace('scene-', '');
    const map = {
      title: '标题页',
      blind: '盲注选择',
      game: '对局',
      shop: '商店',
    };
    return map[id] || id;
  }

  function updateWhere() {
    const w = $('#devNavWhere');
    if (w) w.textContent = `当前：${activeSceneLabel()}`;
  }

  function closeAllOverlays() {
    document.body.classList.remove('newrun-open');
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
    window.CardGallery?.close?.();
    window.NewRun?.close?.();
    window.Casino?.close?.();
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
    window.renderTagBar?.();
  }

  function goBlindSelect() {
    closeAllOverlays();
    ensureRun();
    window.showBlindSelect?.();
    updateWhere();
  }

  function goScene(name) {
    closeAllOverlays();
    if (name === 'blind') {
      goBlindSelect();
      return;
    }
    if (name !== 'title') ensureRun();
    window.switchScene?.(name);
    if (name === 'game') renderGameUI();
    if (name === 'shop') previewShop();
    updateWhere();
  }

  function previewShop() {
    ensureRun();
    window.rollShop?.();
    window.switchScene?.('shop');
    window.renderShop?.();
    window.updateShopCasinoBadge?.();
    const money = $('#shopMoney');
    const score = $('#shopRoundScore');
    if (money) money.textContent = `$${window.state?.money ?? 0}`;
    if (score) score.textContent = String(window.state?.roundScore ?? 0);
    updateWhere();
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
    updateWhere();
  }

  function previewPack() {
    closeAllOverlays();
    ensureRun();
    previewShop();
    const G = window.GameData;
    const pack = G?.packs?.find(p => p.kind === 'joker') || G?.packs?.[0];
    if (pack && typeof window.openPack === 'function') window.openPack(pack);
    updateWhere();
  }

  const DEV_MAX_MONEY = 999999;

  function maxMoney() {
    ensureRun();
    if (!window.state) return;
    state.money = DEV_MAX_MONEY;
    window.renderStats?.();
    const m = $('#money');
    const sm = $('#shopMoney');
    if (m) m.textContent = `$${state.money}`;
    if (sm) sm.textContent = `$${state.money}`;
    window.renderShop?.();
    window.updateShopCasinoBadge?.();
    window.Sounds?.play?.('coin');
    const w = $('#devNavWhere');
    if (w) w.textContent = `当前：${activeSceneLabel()} · $${DEV_MAX_MONEY}`;
  }

  function slotsSandbox() {
    maxMoney();
    if (window.state) state.casinoSpinsUsed = 0;
    window.Casino?.setSlotsFree?.(true);
    previewShop();
    window.Casino?.open?.();
    window.Casino?.setTab?.('slots');
    updateWhere();
  }

  const NAV = [
    {
      group: '主场景',
      items: [
        { label: '标题页', run: () => goScene('title') },
        { label: '新局配置', run: () => { closeAllOverlays(); window.NewRun?.open?.(); updateWhere(); } },
        { label: '盲注选择', run: goBlindSelect },
        { label: '对局', run: () => goScene('game') },
        { label: '商店', run: () => goScene('shop') },
      ],
    },
    {
      group: '赌场 / 经济',
      items: [
        { label: '金币拉满 ($999999)', accent: 'vegas', run: maxMoney },
        { label: '老虎机无限玩', accent: 'vegas', run: slotsSandbox },
        { label: 'Vegas 转盘', accent: 'vegas', run: () => { window.Casino?.setSlotsFree?.(false); previewShop(); window.Casino?.open?.(); window.Casino?.setTab?.('wheel'); updateWhere(); } },
        { label: 'Vegas 老虎机', accent: 'vegas', run: slotsSandbox },
        { label: '回合结算', run: previewResultWin },
      ],
    },
    {
      group: '弹窗 / 菜单',
      items: [
        { label: 'Game Over', run: () => { closeAllOverlays(); ensureRun(); window.GameOver?.show?.(false); updateWhere(); } },
        { label: '通关胜利', run: () => { closeAllOverlays(); ensureRun(); window.GameOver?.show?.(true); updateWhere(); } },
        { label: '失败结算(旧)', run: () => { closeAllOverlays(); ensureRun(); window.switchScene?.('game'); window.showRoundFail?.(); updateWhere(); } },
        { label: '开包选牌', run: previewPack },
        { label: 'Run Info', run: () => { closeAllOverlays(); ensureRun(); window.switchScene?.('game'); window.showRunInfo?.(); updateWhere(); } },
        { label: '暂停菜单', run: () => { closeAllOverlays(); ensureRun(); window.switchScene?.('game'); window.PauseMenu?.open?.(); updateWhere(); } },
        { label: '牌型表', run: () => { closeAllOverlays(); window.PauseMenu?.openHandInfo?.(); updateWhere(); } },
        { label: '图鉴', run: () => { closeAllOverlays(); window.Collection?.open?.(); updateWhere(); } },
        { label: '设置', run: () => { closeAllOverlays(); window.Settings?.open?.(); updateWhere(); } },
        { label: '退出提示', run: () => { closeAllOverlays(); window.PauseMenu?.showQuit?.(); updateWhere(); } },
      ],
    },
    {
      group: '资源页',
      items: [
        { label: '卡牌资源库', run: () => { closeAllOverlays(); window.CardGallery?.open?.(); updateWhere(); } },
        { label: '小丑展示页', run: () => { window.open('joker-cards.html', '_blank'); } },
      ],
    },
  ];

  const root = document.createElement('div');
  root.className = 'dev-nav-root';
  root.innerHTML = `
    <div class="dev-nav-panel" id="devNavPanel">
      <div class="dev-nav-head">JOKER STATE · 跳转</div>
      <div class="dev-nav-where" id="devNavWhere">当前：—</div>
    </div>
    <button type="button" class="dev-nav-ball" id="devNavBall" title="界面跳转 (Esc 关闭)">GO</button>
  `;
  document.body.appendChild(root);

  const panel = root.querySelector('#devNavPanel');
  const ball = root.querySelector('#devNavBall');

  const groupsHtml = NAV.map(g => `
    <div class="dev-nav-group">
      <div class="dev-nav-label">${g.group}</div>
      ${g.items.map(it => `
        <button type="button" class="dev-nav-item${it.accent ? ` accent-${it.accent}` : ''}"
          data-id="${it.label}">${it.label}</button>`).join('')}
    </div>`).join('');
  panel.insertAdjacentHTML('beforeend', groupsHtml);

  const actionMap = new Map();
  NAV.forEach(g => g.items.forEach(it => actionMap.set(it.label, it.run)));

  let open = false;
  function setOpen(v) {
    open = v;
    panel.classList.toggle('show', open);
    ball.classList.toggle('open', open);
    if (open) updateWhere();
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

  const obs = new MutationObserver(() => {
    if (open) updateWhere();
  });
  document.querySelectorAll('.scene').forEach(s => {
    obs.observe(s, { attributes: true, attributeFilter: ['class'] });
  });

  updateWhere();
  window.DevNav = { open: () => setOpen(true), close: () => setOpen(false), goScene, updateWhere, maxMoney, slotsSandbox };
})();
