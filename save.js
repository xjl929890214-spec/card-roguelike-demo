/* ============================================================
 *  save.js  —  本地存档系统
 * ============================================================ */

(function () {
  const KEY = window.JokerState?.storage?.save || 'joker_state_save_v1';
  const SAVE_INTERVAL_MS = 2000;

  function blindIdxFromBlind(blind) {
    return { small: 0, big: 1, boss: 2 }[blind] ?? 0;
  }

  function getRunPhase() {
    if (document.querySelector('#scene-shop.active')) return 'shop';
    if (document.querySelector('#scene-game.active')) return 'playing';
    if (document.querySelector('#scene-blind.active')) return 'blind';
    return 'playing';
  }

  function resumeRunPhase(phase) {
    if (state.ante > 8) {
      Save.clear();
      if (window.GameOver?.show) GameOver.show(true);
      else if (window.showVictory) showVictory();
      return;
    }
    if (phase === 'blind') {
      showBlindSelect?.();
      return;
    }
    if (phase === 'shop') {
      rollShop?.();
      switchScene?.('shop');
      renderShop?.();
      const m = document.querySelector('#shopMoney');
      if (m) m.textContent = `$${state.money}`;
      return;
    }
    switchScene?.('game');
    renderHand?.();
    renderJokers?.();
    renderConsumables?.();
    renderStats?.();
    renderTagBar?.();
  }

  const Save = {
    write() {
      if (!window.state) return;
      try {
        const data = {
          version: 3,
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
          blindIdx: state.blindIdx,
          bossId: state.bossId,
          runPhase: getRunPhase(),
          casinoSpinsUsed: state.casinoSpinsUsed ?? 0,
          pendingBlindChips: state.pendingBlindChips ?? 0,
          casinoShopCredit: state.casinoShopCredit ?? 0,
          reroll: state.reroll,
          rerollDiscountPerm: state.rerollDiscountPerm,
          ownedVouchers: [...(state.ownedVouchers || [])],
          shopJokerSlots: state.shopJokerSlots,
          shopDiscount: state.shopDiscount,
          editionRateMult: state.editionRateMult,
          interestCapBonus: state.interestCapBonus,
          hasTelescope: state.hasTelescope,
          hasObservatory: state.hasObservatory,
          handPlayCounts: state.handPlayCounts,
          tags: state.tags,
          tagQueue: state.tagQueue,
          tagInvestment: state.tagInvestment,
          deckId: state.deckId,
          stakeId: state.stakeId,
          seed: state.seed,
          isSeededRun: state.isSeededRun,
          noInterest: state.noInterest,
          deckGreen: state.deckGreen,
          unusedHandBonus: state.unusedHandBonus,
          runStats: state.runStats,
          lastUsedPlanet: state.lastUsedPlanet,
          lastUsedTarot: state.lastUsedTarot,
          stakeId: state.stakeId,
          deckId: state.deckId,
          selectedDeckId: state.selectedDeckId,
          seed: state.seed,
          isSeededRun: state.isSeededRun,
          noInterest: state.noInterest,
          deckGreen: state.deckGreen,
          unusedHandBonus: state.unusedHandBonus,
          runStats: state.runStats,
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
      state.blindIdx     = s.blindIdx ?? blindIdxFromBlind(state.blind);
      state.bossId       = s.bossId ?? null;
      state.reroll       = s.reroll ?? (G?.economy.reroll_initial_cost ?? 5);
      state.rerollDiscountPerm = s.rerollDiscountPerm ?? 0;
      state.ownedVouchers = new Set(s.ownedVouchers || []);
      state.shopJokerSlots = s.shopJokerSlots ?? 2;
      state.shopDiscount = s.shopDiscount ?? 0;
      state.editionRateMult = s.editionRateMult ?? 1;
      state.interestCapBonus = s.interestCapBonus ?? 0;
      state.hasTelescope = s.hasTelescope ?? false;
      state.hasObservatory = s.hasObservatory ?? false;
      state.handPlayCounts = s.handPlayCounts || {};
      state.tags = s.tags || [];
      state.tagQueue = s.tagQueue || [];
      state.tagInvestment = s.tagInvestment ?? false;
      state.lastUsedPlanet = s.lastUsedPlanet ?? null;
      state.lastUsedTarot  = s.lastUsedTarot  ?? null;
      state.stakeId = s.stakeId ?? 'stake_white';
      state.deckId = s.deckId ?? s.selectedDeckId ?? 'deck_red';
      state.selectedDeckId = s.selectedDeckId ?? state.deckId;
      state.seed = s.seed ?? '';
      state.isSeededRun = s.isSeededRun ?? false;
      state.noInterest = s.noInterest ?? false;
      state.deckGreen = s.deckGreen ?? false;
      state.unusedHandBonus = s.unusedHandBonus ?? (G?.economy.money_per_unused_hand ?? 1);
      state.runStats = s.runStats || state.runStats;
      if (state.isSeededRun && state.seed) setRunSeed?.(state.seed);
      state.runPhase = s.runPhase || 'playing';
      state.casinoSpinsUsed = s.casinoSpinsUsed ?? 0;
      state.pendingBlindChips = s.pendingBlindChips ?? 0;
      state.casinoShopCredit = s.casinoShopCredit ?? 0;
      return true;
    },

    resume() {
      if (!Save.restore()) return false;
      resumeRunPhase(state.runPhase || 'playing');
      return true;
    },
  };

  setInterval(() => {
    const active = document.querySelector('#scene-game.active')
                 || document.querySelector('#scene-shop.active')
                 || document.querySelector('#scene-blind.active');
    if (active) Save.write();
  }, SAVE_INTERVAL_MS);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) Save.write();
  });
  window.addEventListener('beforeunload', () => Save.write());

  function injectContinueButton() {
    if (!Save.has()) return;
    const menu = document.querySelector('.title-menu');
    if (!menu || menu.querySelector('[data-action="continue"]')) return;
    const playBtn = menu.querySelector('[data-action="play"]');
    if (!playBtn) return;

    const btn = document.createElement('button');
    btn.className = 'title-btn title-btn-play title-btn-continue';
    btn.dataset.action = 'continue';
    btn.textContent = 'CONTINUE';
    playBtn.insertAdjacentElement('beforebegin', btn);

    btn.addEventListener('mouseenter', () => window.Sounds && Sounds.play('btn_hover'));
    btn.addEventListener('click', () => {
      window.Sounds && Sounds.play('btn_click');
      if (Save.resume) Save.resume();
      else if (Save.restore()) resumeRunPhase('playing');
    });

    playBtn.addEventListener('click', () => {
      if (window.NewRun?.open) return;
      Save.clear();
    }, { capture: true });
  }

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
