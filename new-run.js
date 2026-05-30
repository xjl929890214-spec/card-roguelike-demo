/* ============================================================
 *  new-run.js  —  新局配置（Balatro 轮播式 Stake / Deck）
 * ============================================================ */

(function () {
  const G = () => window.GameData;
  const $ = (s) => document.querySelector(s);

  function dailySeedForDate(d = new Date()) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `DAILY${y}${m}${day}`;
  }

  function dailyDoneKey(seed) {
    return `balatro_daily_done_${seed}`;
  }

  const DailyRun = {
    getSeed: dailySeedForDate,

    getConfig(d = new Date()) {
      const data = G();
      if (!data) return { deckId: 'deck_red', stakeId: 'stake_white', seed: dailySeedForDate(d) };
      const decks = data.decks;
      const stakes = data.stakes;
      const day = d.getDay();
      return {
        deckId: decks[day % decks.length].id,
        stakeId: stakes[Math.min(2 + (day % 3), stakes.length - 1)].id,
        seed: dailySeedForDate(d),
      };
    },

    isCompleted(seed) {
      return localStorage.getItem(dailyDoneKey(seed)) === '1';
    },

    markCompleted(seed) {
      localStorage.setItem(dailyDoneKey(seed || dailySeedForDate()), '1');
    },

    renderPane() {
      const cfg = this.getConfig();
      const deck = G()?.getDeck(cfg.deckId);
      const stake = G()?.getStake(cfg.stakeId);
      const done = this.isCompleted(cfg.seed);

      const dateEl = $('#dailyDate');
      const seedEl = $('#dailySeed');
      const cfgEl = $('#dailyConfig');
      const statusEl = $('#dailyStatus');
      const btn = $('#dailyStartBtn');

      const today = new Date();
      if (dateEl) {
        dateEl.textContent = today.toLocaleDateString('en-US', {
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
        });
      }
      if (seedEl) seedEl.textContent = cfg.seed;
      if (cfgEl) {
        cfgEl.innerHTML = `
          <div class="daily-row"><span>Deck</span><strong>${deck?.name_cn || deck?.name || '—'}</strong></div>
          <div class="daily-row"><span>Stake</span><strong>${stake?.name_cn || stake?.name || '—'}</strong></div>
          <div class="daily-row"><span>Goal</span><strong>Beat Ante 8</strong></div>`;
      }
      if (statusEl) {
        statusEl.textContent = done ? '✓ Completed today' : 'Not completed yet';
        statusEl.classList.toggle('done', done);
        statusEl.classList.remove('hidden');
      }
      if (btn) {
        btn.textContent = done ? 'Play Again' : 'Play Daily';
        btn.disabled = false;
      }
    },

    start() {
      const cfg = this.getConfig();
      window.Sounds?.play('btn_click');
      if (window.Save) Save.clear();
      if (typeof startNewRun === 'function') {
        startNewRun({
          deckId: cfg.deckId,
          stakeId: cfg.stakeId,
          isSeededRun: true,
          isDailyRun: true,
          seed: cfg.seed,
        });
      }
      NewRun.close();
    },
  };

  const NewRun = {
    deckIdx: 0,
    stakeIdx: 0,
    isSeededRun: false,
    seed: '',
    activeTab: 'new',

    deckId() {
      return G()?.decks[this.deckIdx]?.id || 'deck_red';
    },

    stakeId() {
      return G()?.stakes[this.stakeIdx]?.id || 'stake_white';
    },

    open() {
      const decks = G()?.decks || [];
      const stakes = G()?.stakes || [];
      this.deckIdx = Math.max(0, decks.findIndex(d => d.id === (window.state?.deckId || 'deck_red')));
      if (this.deckIdx < 0) this.deckIdx = 0;
      this.stakeIdx = Math.max(0, stakes.findIndex(s => s.id === (window.state?.stakeId || 'stake_white')));
      if (this.stakeIdx < 0) this.stakeIdx = 0;
      this.isSeededRun = false;
      this.seed = '';
      this.activeTab = 'new';
      this.render();
      document.body.classList.add('newrun-open');
      $('#newRunModal')?.classList.remove('hidden');
    },

    close() {
      document.body.classList.remove('newrun-open');
      $('#newRunModal')?.classList.add('hidden');
    },

    setTab(tab) {
      this.activeTab = tab;
      this.render();
    },

    shiftStake(delta) {
      const n = G()?.stakes?.length || 0;
      if (!n) return;
      this.stakeIdx = ((this.stakeIdx + delta) % n + n) % n;
      this.renderCarousel();
      window.Sounds?.play('btn_hover');
    },

    shiftDeck(delta) {
      const n = G()?.decks?.length || 0;
      if (!n) return;
      this.deckIdx = ((this.deckIdx + delta) % n + n) % n;
      this.renderCarousel();
      window.Sounds?.play('btn_hover');
    },

    renderCarousel() {
      const stakes = G()?.stakes || [];
      const decks = G()?.decks || [];
      const stake = stakes[this.stakeIdx];
      const deck = decks[this.deckIdx];

      const stakePanel = $('#stakePanel');
      if (stakePanel && stake) {
        stakePanel.innerHTML = `
          <div class="stake-chip-lg" style="background:${stake.color || '#fff'}">♣</div>
          <div class="carousel-name">${stake.name_cn || stake.name}</div>
          <div class="carousel-desc">${stake.desc_cn || stake.desc}</div>`;
      }

      const deckPanel = $('#deckPanel');
      if (deckPanel && deck) {
        deckPanel.innerHTML = `
          <div class="deck-back-lg" style="background:linear-gradient(145deg,${deck.color || '#555'},#111)"></div>
          <div class="carousel-name">${deck.name_cn || deck.name}</div>
          <div class="carousel-desc">${deck.desc_cn || deck.desc}</div>`;
      }

      const dots = $('#deckDots');
      if (dots) {
        dots.innerHTML = decks.map((_, i) =>
          `<span class="carousel-dot${i === this.deckIdx ? ' active' : ''}"></span>`
        ).join('');
      }
    },

    render() {
      const modal = $('#newRunModal');
      if (!modal) return;

      modal.querySelectorAll('.newrun-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === this.activeTab);
      });

      const body = $('#newrunConfigBody');
      const cont = $('#newrunContinuePane');
      const daily = $('#newrunDailyPane');
      const actions = $('#newrunMainActions');
      if (body) body.classList.toggle('hidden', this.activeTab !== 'new');
      if (cont) cont.classList.toggle('hidden', this.activeTab !== 'continue');
      if (daily) daily.classList.toggle('hidden', this.activeTab !== 'daily');
      if (actions) actions.classList.toggle('hidden', this.activeTab !== 'new');

      if (this.activeTab === 'continue') {
        const hasSave = window.Save?.has?.();
        const msg = $('#newrunContinueMsg');
        const btn = $('#newrunContinueBtn');
        if (msg) msg.textContent = hasSave ? 'Resume your saved run?' : 'No saved run found.';
        if (btn) btn.classList.toggle('hidden', !hasSave);
        return;
      }
      if (this.activeTab === 'daily') {
        DailyRun.renderPane();
        return;
      }

      this.renderCarousel();

      const toggle = $('#seedToggle');
      const warn = $('#seedWarn');
      const seedVal = $('#seedValue');
      if (toggle) toggle.checked = this.isSeededRun;
      if (warn) warn.classList.toggle('hidden', !this.isSeededRun);
      if (seedVal) seedVal.textContent = this.isSeededRun && this.seed ? this.seed : '';
    },

    confirm() {
      window.Sounds?.play('btn_click');
      const seed = this.isSeededRun
        ? (this.seed || window.generateRunSeed?.() || 'DEMO')
        : '';
      if (window.Save) Save.clear();
      if (typeof startNewRun === 'function') {
        startNewRun({
          deckId: this.deckId(),
          stakeId: this.stakeId(),
          isSeededRun: this.isSeededRun,
          isDailyRun: false,
          seed,
        });
      }
      this.close();
    },

    continueRun() {
      window.Sounds?.play('btn_click');
      if (!window.Save?.restore()) return;
      this.close();
      switchScene?.('game');
      renderHand?.();
      renderJokers?.();
      renderConsumables?.();
      renderStats?.();
      renderTagBar?.();
    },
  };

  function bind() {
    $('#newRunStart')?.addEventListener('click', () => NewRun.confirm());
    $('#newRunCancel')?.addEventListener('click', () => {
      window.Sounds?.play('btn_click');
      NewRun.close();
    });
    $('#newRunModal')?.addEventListener('click', (e) => {
      if (e.target?.id === 'newRunModal') NewRun.close();
    });

    $('#stakePrev')?.addEventListener('click', () => NewRun.shiftStake(-1));
    $('#stakeNext')?.addEventListener('click', () => NewRun.shiftStake(1));
    $('#deckPrev')?.addEventListener('click', () => NewRun.shiftDeck(-1));
    $('#deckNext')?.addEventListener('click', () => NewRun.shiftDeck(1));

    document.querySelectorAll('.newrun-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        window.Sounds?.play('btn_click');
        NewRun.setTab(btn.dataset.tab);
      });
    });

    $('#seedToggle')?.addEventListener('change', (e) => {
      NewRun.isSeededRun = e.target.checked;
      if (NewRun.isSeededRun && !NewRun.seed) {
        NewRun.seed = window.generateRunSeed?.() || 'DEMO';
      }
      NewRun.render();
    });

    $('#seedEnter')?.addEventListener('click', () => {
      window.Sounds?.play('btn_click');
      const input = prompt('Enter seed:', NewRun.seed || '');
      if (input == null) return;
      NewRun.seed = input.trim().toUpperCase().slice(0, 12);
      NewRun.isSeededRun = !!NewRun.seed;
      NewRun.render();
    });

    $('#seedPaste')?.addEventListener('click', async () => {
      window.Sounds?.play('btn_click');
      try {
        const text = await navigator.clipboard.readText();
        NewRun.seed = String(text).trim().toUpperCase().slice(0, 12);
        NewRun.isSeededRun = !!NewRun.seed;
        NewRun.render();
      } catch (e) {
        alert('Cannot access clipboard');
      }
    });

    $('#newrunContinueBtn')?.addEventListener('click', () => NewRun.continueRun());
    $('#dailyStartBtn')?.addEventListener('click', () => DailyRun.start());
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bind);
  } else {
    bind();
  }

  window.NewRun = NewRun;
  window.DailyRun = DailyRun;
})();
