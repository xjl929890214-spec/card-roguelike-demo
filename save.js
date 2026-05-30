/* ============================================================
 *  save.js  —  本地存档系统
 *  - 自动每 2 秒保存进行中的局
 *  - 切换标签 / 关闭页面前也保存一次
 *  - 标题页若检测到存档，自动插入 "CONTINUE" 按钮
 *  - 依赖 game.js 暴露的 state、startNewRun、switchScene、render*
 * ============================================================ */

(function () {
  const KEY = 'balatro_demo_save_v1';
  const SAVE_INTERVAL_MS = 2000;

  const Save = {
    write() {
      if (!window.state) return;
      try {
        const data = {
          version: 2,
          ts: Date.now(),
          baseDeck: state.baseDeck,
          deck: state.deck,
          hand: state.hand,
          jokers: state.jokers,
          consumables: state.consumables,
          jokerSlots: state.jokerSlots,
          consumableSlots: state.consumableSlots,
          handStats: state.handStats,
          money: state.money,
          handsMax: state.handsMax,       handsLeft: state.handsLeft,
          discardsMax: state.discardsMax, discardsLeft: state.discardsLeft,
          discardsUsedThisRound: state.discardsUsedThisRound,
          handsPlayedThisRound: state.handsPlayedThisRound,
          totalHandsPlayed: state.totalHandsPlayed,
          roundScore: state.roundScore,
          blindScore: state.blindScore,
          ante: state.ante,
          blind: state.blind,
          bossId: state.bossId,
          reroll: state.reroll,
          ownedVouchers: [...(state.ownedVouchers || [])],
          lastUsedPlanet: state.lastUsedPlanet,
          lastUsedTarot: state.lastUsedTarot,
        };
        localStorage.setItem(KEY, JSON.stringify(data));
      } catch (e) { console.warn('[Save] write failed', e); }
    },

    read() {
      try {
        const raw = localStorage.getItem(KEY);
        if (!raw) return null;
        return JSON.parse(raw);
      } catch (e) { return null; }
    },

    has() {
      try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
    },

    clear() {
      try { localStorage.removeItem(KEY); } catch (e) {}
    },

    restore() {
      const s = Save.read();
      if (!s || !window.state) return false;
      const G = window.GameData;
      state.baseDeck     = s.baseDeck || [];
      state.deck         = s.deck || [];
      state.hand         = s.hand || [];
      state.selected     = new Set();
      state.jokers       = s.jokers || [];
      state.consumables  = s.consumables || [];
      state.jokerSlots   = s.jokerSlots ?? 5;
      state.consumableSlots = s.consumableSlots ?? 2;
      state.handStats    = s.handStats || {};
      state.money        = s.money ?? (G?.economy.starting_money ?? 4);
      state.handsMax     = s.handsMax ?? 4; state.handsLeft = s.handsLeft ?? state.handsMax;
      state.discardsMax  = s.discardsMax ?? 3; state.discardsLeft = s.discardsLeft ?? state.discardsMax;
      state.discardsUsedThisRound = s.discardsUsedThisRound ?? 0;
      state.handsPlayedThisRound  = s.handsPlayedThisRound ?? 0;
      state.totalHandsPlayed      = s.totalHandsPlayed ?? 0;
      state.roundScore   = s.roundScore ?? 0;
      state.blindScore   = s.blindScore ?? 300;
      state.ante         = s.ante ?? 1;
      state.blind        = s.blind ?? 'small';
      state.bossId       = s.bossId ?? null;
      state.reroll       = s.reroll ?? (G?.economy.reroll_initial_cost ?? 5);
      state.ownedVouchers = new Set(s.ownedVouchers || []);
      state.lastUsedPlanet = s.lastUsedPlanet ?? null;
      state.lastUsedTarot  = s.lastUsedTarot  ?? null;
      return true;
    },
  };

  // 自动保存：只在游戏 / 商店场景时触发
  setInterval(() => {
    const inGame = document.querySelector('#scene-game.active')
                 || document.querySelector('#scene-shop.active');
    if (inGame) Save.write();
  }, SAVE_INTERVAL_MS);

  // 切走 / 关闭页面时强制保存
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Save.write();
  });
  window.addEventListener('beforeunload', () => Save.write());

  // 在标题页插入 CONTINUE 按钮（若有存档）
  function injectContinueButton() {
    if (!Save.has()) return;
    const menu = document.querySelector('.title-menu');
    if (!menu || menu.querySelector('[data-action="continue"]')) return;
    const playBtn = menu.querySelector('[data-action="play"]');
    if (!playBtn) return;

    const btn = document.createElement('button');
    btn.className = 'btn btn-yellow big';
    btn.dataset.action = 'continue';
    btn.textContent = 'CONTINUE';
    playBtn.insertAdjacentElement('beforebegin', btn);

    btn.addEventListener('mouseenter', () => window.Sounds && Sounds.play('btn_hover'));
    btn.addEventListener('click', () => {
      window.Sounds && Sounds.play('btn_click');
      if (!Save.restore()) return;
      if (typeof switchScene === 'function') switchScene('game');
      if (typeof renderHand === 'function') renderHand();
      if (typeof renderJokers === 'function') renderJokers();
      if (typeof renderStats === 'function') renderStats();
    });

    // PLAY 按钮的语义改为"新游戏"：开新局前清掉旧存档
    playBtn.addEventListener('click', () => Save.clear(), { capture: true });
  }

  // 失败重开时也清存档
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t && t.id === 'toShopBtn' && t.textContent === 'Restart') {
      Save.clear();
    }
  }, true);

  document.addEventListener('DOMContentLoaded', injectContinueButton);
  if (document.readyState !== 'loading') injectContinueButton();

  window.Save = Save;
})();
