/* ============================================================
 *  menu.js  —  暂停菜单 / Run Info / Collection / Quit
 *  - ESC 切换暂停（游戏 / 商店场景）
 *  - 侧栏 Options 按钮打开暂停菜单
 *  - 暂停菜单：Resume / Audio / Run Info / Main Menu / New Run
 *  - 标题页 COLLECTION / QUIT 入口
 *  - 返回主菜单时保留存档；点 PLAY 才开始新局
 * ============================================================ */

(function () {
  function sfx(n) {
    if (window.Sounds && typeof Sounds.play === 'function') Sounds.play(n);
  }
  function inGameScene() {
    return !!(document.querySelector('#scene-game.active')
           || document.querySelector('#scene-shop.active'));
  }
  function isResultOpen() {
    const m = document.getElementById('resultModal');
    return m && !m.classList.contains('hidden');
  }

  // ---------- 样式 ----------
  const css = `
.menu-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.72); display:none;
  align-items:center; justify-content:center; z-index: 200; font-family: 'VT323', monospace; }
.menu-modal.show { display:flex; }
.menu-card {
  background: #1a2832;
  border: 4px solid #f4f1e8;
  border-radius: 14px;
  box-shadow: 0 8px 0 rgba(0,0,0,0.6), 0 0 0 4px #000;
  padding: 24px 32px;
  min-width: 320px;
  max-width: 92vw;
  text-align: center;
  color: #f4f1e8;
}
.menu-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 20px;
  letter-spacing: 2px;
  color: #fcd34d;
  margin-bottom: 16px;
  text-shadow: 2px 2px 0 #000;
}
.menu-buttons { display:flex; flex-direction: column; gap: 10px; margin-top: 6px; }
.menu-buttons .btn { width: 100%; font-size: 16px; padding: 12px 18px; }

.confirm-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.72); display:none;
  align-items:center; justify-content:center; z-index: 9998; font-family:'VT323',monospace; }
.confirm-modal.show { display:flex; }
.confirm-card {
  background:#1a2832; border:4px solid #f4f1e8; border-radius:14px;
  padding:22px 28px; max-width: 360px; text-align:center; color:#f4f1e8;
  box-shadow: 0 8px 0 rgba(0,0,0,0.6), 0 0 0 4px #000;
}
.confirm-text { font-size: 20px; line-height: 1.4; margin-bottom: 18px; }
.confirm-actions { display:flex; gap: 10px; justify-content: center; }
.confirm-actions .btn { padding: 10px 22px; font-size: 16px; }

.handinfo-card { width: 460px; }
.handinfo-table { width: 100%; border-collapse: collapse; font-size: 18px; margin: 4px 0 12px; }
.handinfo-table th, .handinfo-table td {
  padding: 6px 8px;
  border-bottom: 1px dashed rgba(244,241,232,0.18);
  text-align: left;
}
.handinfo-table th {
  font-family:'Press Start 2P', monospace; font-size: 10px; color:#fcd34d;
}
.handinfo-table td.right, .handinfo-table th.right { text-align: right; }
.handinfo-chips { color:#5aafe8; font-weight:bold; }
.handinfo-mult { color:#ff7b6a; font-weight:bold; }

.collection-card { width: 540px; }
.collection-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; padding: 4px 0 14px; }
.collection-item { text-align: center; }
.collection-item img { width: 78px; height: 100px; image-rendering: pixelated; border-radius: 6px; }
.ci-name { font-size: 14px; margin-top: 4px; color:#fcd34d; }
.ci-eff  { font-size: 14px; color:#cfe; line-height:1.2; }

.pause-hint {
  position: fixed; right: 14px; bottom: 12px;
  font-size: 14px; color:#fff; opacity: 0.45;
  pointer-events: none; z-index: 50;
  font-family: 'VT323', monospace;
  text-shadow: 1px 1px 0 #000;
}
`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------- 通用确认 ----------
  let confirmCb = null;
  const confirmEl = document.createElement('div');
  confirmEl.className = 'confirm-modal';
  confirmEl.innerHTML = `
    <div class="confirm-card">
      <div class="confirm-text" id="confirmText">?</div>
      <div class="confirm-actions">
        <button class="btn btn-red"  id="confirmYes">确定</button>
        <button class="btn btn-blue" id="confirmNo">取消</button>
      </div>
    </div>`;
  document.body.appendChild(confirmEl);
  confirmEl.querySelector('#confirmYes').addEventListener('click', () => {
    sfx('btn_click');
    confirmEl.classList.remove('show');
    const cb = confirmCb; confirmCb = null;
    if (cb) cb();
  });
  confirmEl.querySelector('#confirmNo').addEventListener('click', () => {
    sfx('btn_hover');
    confirmEl.classList.remove('show');
    confirmCb = null;
  });
  confirmEl.addEventListener('click', e => {
    if (e.target === confirmEl) { confirmEl.classList.remove('show'); confirmCb = null; }
  });
  function ask(text, cb) {
    confirmEl.querySelector('#confirmText').textContent = text;
    confirmCb = cb;
    confirmEl.classList.add('show');
  }

  // ---------- 暂停菜单 ----------
  const pause = document.createElement('div');
  pause.className = 'menu-modal';
  pause.innerHTML = `
    <div class="menu-card">
      <div class="menu-title">PAUSED</div>
      <div class="menu-buttons">
        <button class="btn btn-blue"   data-pause="resume">Resume</button>
        <button class="btn btn-yellow" data-pause="audio">Audio Options</button>
        <button class="btn btn-green"  data-pause="info">Run Info</button>
        <button class="btn btn-red"    data-pause="title">Main Menu</button>
        <button class="btn btn-red"    data-pause="newrun">New Run</button>
      </div>
    </div>`;
  document.body.appendChild(pause);

  function openPause()  { if (!isPauseOpen()) { pause.classList.add('show'); sfx('btn_click'); } }
  function closePause() { pause.classList.remove('show'); sfx('btn_hover'); }
  function isPauseOpen(){ return pause.classList.contains('show'); }

  pause.addEventListener('click', e => { if (e.target === pause) closePause(); });

  pause.querySelectorAll('[data-pause]').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.pause;
      sfx('btn_click');
      if (action === 'resume') { closePause(); return; }
      if (action === 'audio')  { closePause(); window.Settings && Settings.open(); return; }
      if (action === 'info')   { closePause(); openHandInfo(); return; }
      if (action === 'title') {
        ask('返回主菜单？当前进度会保留，可在标题页 CONTINUE 继续。', () => {
          closePause();
          if (window.Save) Save.write();
          if (typeof switchScene === 'function') switchScene('title');
          injectContinue();
        });
        return;
      }
      if (action === 'newrun') {
        ask('开始全新一局？当前进度会被丢弃。', () => {
          closePause();
          if (window.Save) Save.clear();
          removeContinueButton();
          if (typeof startNewRun === 'function') startNewRun();
        });
        return;
      }
    });
  });

  // ---------- Run Info（牌型表）----------
  const handInfo = document.createElement('div');
  handInfo.className = 'menu-modal';
  handInfo.innerHTML = `
    <div class="menu-card handinfo-card">
      <div class="menu-title">POKER HANDS</div>
      <table class="handinfo-table">
        <thead>
          <tr>
            <th>Hand</th>
            <th class="right">Chips</th>
            <th class="right">Mult</th>
          </tr>
        </thead>
        <tbody id="handInfoBody"></tbody>
      </table>
      <div class="menu-buttons">
        <button class="btn btn-yellow" id="handInfoClose">CLOSE</button>
      </div>
    </div>`;
  document.body.appendChild(handInfo);

  function openHandInfo() {
    const types = window.HAND_TYPES;
    const order = ['STRFLUSH','QUADS','FULL','FLUSH','STRAIGHT','TRIPS','TWO_PAIR','PAIR','HIGH'];
    const body  = handInfo.querySelector('#handInfoBody');
    if (types) {
      body.innerHTML = order.map(k => {
        const t = types[k];
        return `<tr>
          <td>${t.name}</td>
          <td class="right handinfo-chips">${t.chips}</td>
          <td class="right handinfo-mult">x${t.mult}</td>
        </tr>`;
      }).join('');
    }
    handInfo.classList.add('show');
  }
  function closeHandInfo() { handInfo.classList.remove('show'); }
  handInfo.querySelector('#handInfoClose').addEventListener('click', () => { sfx('btn_click'); closeHandInfo(); });
  handInfo.addEventListener('click', e => { if (e.target === handInfo) closeHandInfo(); });

  // ---------- Collection（小丑图鉴）----------
  const collection = document.createElement('div');
  collection.className = 'menu-modal';
  collection.innerHTML = `
    <div class="menu-card collection-card">
      <div class="menu-title">COLLECTION</div>
      <div class="collection-grid" id="collectionGrid"></div>
      <div class="menu-buttons">
        <button class="btn btn-yellow" id="collectionClose">CLOSE</button>
      </div>
    </div>`;
  document.body.appendChild(collection);

  function openCollection() {
    const defs = window.JOKER_DEFS || {};
    const grid = collection.querySelector('#collectionGrid');
    grid.innerHTML = Object.entries(defs).map(([id,d]) => `
      <div class="collection-item">
        <img src="${d.img}" alt="${d.name}" onerror="this.style.opacity=0.2">
        <div class="ci-name">${d.name}</div>
        <div class="ci-eff">${d.eff}</div>
      </div>`).join('');
    collection.classList.add('show');
  }
  function closeCollection() { collection.classList.remove('show'); }
  collection.querySelector('#collectionClose').addEventListener('click', () => { sfx('btn_click'); closeCollection(); });
  collection.addEventListener('click', e => { if (e.target === collection) closeCollection(); });

  // ---------- Quit 退出提示 ----------
  const goodbye = document.createElement('div');
  goodbye.className = 'menu-modal';
  goodbye.innerHTML = `
    <div class="menu-card">
      <div class="menu-title">SEE YOU NEXT RUN</div>
      <div style="font-size:18px;line-height:1.5;margin-bottom:14px;">
        浏览器无法直接关闭页面。<br>关闭这个标签页可以彻底退出。
      </div>
      <div class="menu-buttons">
        <button class="btn btn-yellow" id="goodbyeBack">Back</button>
      </div>
    </div>`;
  document.body.appendChild(goodbye);
  goodbye.querySelector('#goodbyeBack').addEventListener('click', () => { sfx('btn_click'); goodbye.classList.remove('show'); });
  goodbye.addEventListener('click', e => { if (e.target === goodbye) goodbye.classList.remove('show'); });

  // ---------- 主菜单：CONTINUE 按钮的注入/移除 ----------
  function injectContinue() {
    if (!window.Save || !Save.has()) return;
    const menu = document.querySelector('.title-menu');
    if (!menu) return;
    if (menu.querySelector('[data-action="continue"]')) return;
    const playBtn = menu.querySelector('[data-action="play"]');
    if (!playBtn) return;
    const btn = document.createElement('button');
    btn.className = 'btn btn-yellow big';
    btn.dataset.action = 'continue';
    btn.textContent = 'CONTINUE';
    playBtn.insertAdjacentElement('beforebegin', btn);
    btn.addEventListener('mouseenter', () => sfx('btn_hover'));
    btn.addEventListener('click', () => {
      sfx('btn_click');
      if (!window.Save || !Save.restore()) return;
      if (typeof switchScene === 'function') switchScene('game');
      if (typeof renderHand   === 'function') renderHand();
      if (typeof renderJokers === 'function') renderJokers();
      if (typeof renderStats  === 'function') renderStats();
    });
  }
  function removeContinueButton() {
    const btn = document.querySelector('[data-action="continue"]');
    if (btn) btn.remove();
  }

  // ---------- 绑定 ----------
  function wire() {
    // ESC：根据当前最上层弹窗逐层关闭，最终在游戏场景切换暂停
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (confirmEl.classList.contains('show'))   { confirmEl.classList.remove('show'); confirmCb = null; return; }
      if (handInfo.classList.contains('show'))    { closeHandInfo(); return; }
      if (collection.classList.contains('show'))  { closeCollection(); return; }
      if (goodbye.classList.contains('show'))     { goodbye.classList.remove('show'); return; }
      if (document.querySelector('.settings-modal.show')) return; // settings.js 自己处理
      if (isResultOpen()) return; // 结算弹窗不允许 ESC 跳过
      if (!inGameScene()) return;
      if (isPauseOpen()) closePause(); else openPause();
    });

    // 侧栏 Options 按钮 -> 暂停菜单
    document.querySelectorAll('.options-btn').forEach(btn => {
      btn.addEventListener('click', () => { sfx('btn_click'); openPause(); });
    });

    // Run Info 按钮 -> 牌型表
    document.querySelectorAll('.run-info').forEach(btn => {
      btn.addEventListener('click', () => { sfx('btn_click'); openHandInfo(); });
    });

    // 标题：COLLECTION
    document.querySelectorAll('[data-action="collection"]').forEach(btn => {
      btn.addEventListener('click', () => { sfx('btn_click'); openCollection(); });
    });

    // 标题：QUIT
    document.querySelectorAll('[data-action="quit"]').forEach(btn => {
      btn.addEventListener('click', () => {
        sfx('btn_click');
        try { window.close(); } catch (e) {}
        setTimeout(() => { if (!window.closed) goodbye.classList.add('show'); }, 50);
      });
    });

    // 标题 PLAY 点击时清掉旧存档（避免与 save.js 内的逻辑漏掉）
    document.querySelectorAll('[data-action="play"]').forEach(btn => {
      btn.addEventListener('click', () => {
        if (window.Save) Save.clear();
        removeContinueButton();
      }, { capture: true });
    });

    // 屏幕角落显示提示
    if (!document.querySelector('.pause-hint')) {
      const hint = document.createElement('div');
      hint.className = 'pause-hint';
      hint.textContent = 'ESC = Pause';
      document.body.appendChild(hint);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', wire);
  } else {
    wire();
  }

  window.PauseMenu = { open: openPause, close: closePause, askConfirm: ask, showQuit: () => goodbye.classList.add('show') };
})();
