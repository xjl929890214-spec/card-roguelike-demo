/* ============================================================
 *  casino.js — 商店 Vegas Corner（转盘 + 老虎机）
 *  每店共 2 次游玩机会（转盘/老虎机共用）
 * ============================================================ */

(function () {
  const WIN_ODDS_BOOST = 1.5;

  const WHEEL = {
    maxPlaysPerShop: 2,
    bets: [
      { cost: 5, minAnte: 1, label: 'Nickel' },
      { cost: 10, minAnte: 3, label: 'Dime' },
      { cost: 20, minAnte: 5, label: 'High Roller' },
    ],
    segments: [
      { id: 'cash_8', label: '$8', icon: '◆', flavor: 'Baby jackpot!', weight: 33, color: '#c41e3a' },
      { id: 'cash_15', label: '$15', icon: '7', flavor: 'Vegas baby!', weight: 18, color: '#1c1917' },
      { id: 'tarot', label: 'TAROT', icon: '☽', flavor: 'Mystic luck!', weight: 23, color: '#eab308' },
      { id: 'planet', label: 'STAR', icon: '★', flavor: 'Stars align!', weight: 23, color: '#0f766e' },
      { id: 'coupon', label: '-$3', icon: '♦', flavor: "Manager's special!", weight: 18, color: '#be123c' },
      { id: 'head_start', label: '+30', icon: '▲', flavor: 'Running start!', weight: 15, color: '#292524' },
      { id: 'oops', label: 'OOPS', icon: '·', flavor: 'House chuckles.', weight: 8, color: '#ca8a04' },
      { id: 'bust', label: 'BUST', icon: '✕', flavor: 'House takes half!', weight: 2, color: '#450a0a' },
    ],
  };

  const SLOTS = {
    bets: [
      { cost: 3, minAnte: 1, label: 'Nickel' },
      { cost: 6, minAnte: 3, label: 'Dime' },
      { cost: 12, minAnte: 5, label: 'High Roller' },
    ],
    symbols: [
      { id: 'cherry', name: 'Cherry', symClass: 'sym-cherry', fruitClass: 'px-fruit-cherry', weight: 26, payout: 5 },
      { id: 'lemon', name: 'Lemon', symClass: 'sym-lemon', fruitClass: 'px-fruit-lemon', weight: 22, payout: 7 },
      { id: 'orange', name: 'Orange', symClass: 'sym-orange', fruitClass: 'px-fruit-orange', weight: 18, payout: 9 },
      { id: 'grape', name: 'Grape', symClass: 'sym-grape', fruitClass: 'px-fruit-grape', weight: 14, payout: 12 },
      { id: 'melon', name: 'Melon', symClass: 'sym-melon', fruitClass: 'px-fruit-melon', weight: 10, payout: 16 },
      { id: 'star', name: 'Star', symClass: 'sym-star', fruitClass: 'px-fruit-star', weight: 5, payout: 24 },
    ],
  };

  const BULB_COUNT = 24;
  const SLOT_ITEM_H = 88;
  const LABEL_RADIUS = 78;

  let spinning = false;
  let activeTab = 'wheel';
  let wheelBuilt = false;
  let bulbsBuilt = false;
  function $(s) { return document.querySelector(s); }
  function slotsDevFree() { return !!window.devSlotsFree; }
  function sfx(n) { window.Sounds?.play?.(n); }
  function gameRand() { return window.gameRand?.() ?? Math.random(); }

  function pickWeighted(pool) {
    const total = pool.reduce((s, x) => s + (x.weight || 1), 0);
    let r = gameRand() * total;
    for (const item of pool) {
      r -= item.weight || 1;
      if (r <= 0) return item;
    }
    return pool[pool.length - 1];
  }

  function playsLeft() {
    if (activeTab === 'slots' && slotsDevFree()) return 99;
    const used = window.state?.casinoSpinsUsed ?? 0;
    return Math.max(0, WHEEL.maxPlaysPerShop - used);
  }

  function resetForShop() {
    if (!window.state) return;
    state.casinoSpinsUsed = 0;
  }

  function getBets(tab) {
    const pool = tab === 'slots' ? SLOTS.bets : WHEEL.bets;
    return pool.filter(b => (window.state?.ante ?? 1) >= b.minAnte);
  }

  function updateMoneyUI() {
    const el = $('#shopMoney');
    if (el && window.state) el.textContent = `$${state.money}`;
  }

  function renderResult(msg, kind) {
    const el = $('#casinoResult');
    if (!el) return;
    el.className = `casino-result ${kind || 'neutral'}`;
    el.innerHTML = msg;
  }

  function renderPlaysMeta() {
    const meta = $('#casinoSpinsLeft');
    if (meta) {
      meta.textContent = activeTab === 'slots' && slotsDevFree() ? '∞' : String(playsLeft());
    }
    window.updateShopCasinoBadge?.();
  }

  function renderBetButtons() {
    const boxId = activeTab === 'slots' ? '#slotBets' : '#casinoBets';
    const box = $(boxId);
    if (!box || !window.state) return;
    const left = playsLeft();
    const labelPull = activeTab === 'slots' ? 'PULL' : 'SPIN';

    box.innerHTML = '';
    const freeSlots = activeTab === 'slots' && slotsDevFree();
    getBets(activeTab).forEach((bet) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'casino-bet-btn';
      const afford = freeSlots || state.money >= bet.cost;
      btn.disabled = spinning || (!freeSlots && left <= 0) || !afford;
      btn.innerHTML = freeSlots
        ? `${labelPull} FREE<span class="bet-tag">∞ plays</span>`
        : `${labelPull} $${bet.cost}<span class="bet-tag">${bet.label}</span>`;
      btn.addEventListener('click', () => {
        if (activeTab === 'slots') doSlotPull(bet.cost);
        else doWheelSpin(bet.cost);
      });
      box.appendChild(btn);
    });
    renderPlaysMeta();
  }

  function usePlay(cost) {
    if (!window.state) return false;
    if (activeTab === 'slots' && slotsDevFree()) {
      renderBetButtons();
      return true;
    }
    if (playsLeft() <= 0 || state.money < cost) return false;
    state.money -= cost;
    state.casinoSpinsUsed = (state.casinoSpinsUsed || 0) + 1;
    updateMoneyUI();
    renderBetButtons();
    return true;
  }

  /* —— Wheel —— */
  function buildBulbRing(ringId, count, builtFlag) {
    const ring = $(ringId);
    if (!ring || builtFlag.value) return;
    ring.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const bulb = document.createElement('span');
      bulb.className = 'wheel-bulb';
      bulb.style.setProperty('--bulb-angle', `${(360 / count) * i}deg`);
      bulb.style.setProperty('--bulb-delay', `${(i * 0.05).toFixed(2)}s`);
      ring.appendChild(bulb);
    }
    builtFlag.value = true;
  }

  const wheelBulbsFlag = { value: false };
  const slotBulbsFlag = { value: false };
  const shopWheelBulbsFlag = { value: false };
  let shopWheelBuilt = false;

  function buildShopWheelLogo() {
    const wheel = $('#shopWheelLogo');
    if (!wheel || shopWheelBuilt) return;
    const segs = WHEEL.segments;
    const n = segs.length;
    const step = 100 / n;
    const parts = segs.map((s, i) => `${s.color} ${i * step}% ${(i + 1) * step}%`);
    wheel.style.background = `conic-gradient(from ${-90 - 180 / n}deg, ${parts.join(', ')})`;
    wheel.innerHTML = `
      <div class="wheel-inner-ring" aria-hidden="true"></div>
      <div class="wheel-hub" aria-hidden="true"><span class="hub-7">7</span></div>`;
    shopWheelBuilt = true;
  }

  function initShopVegasPromo() {
    buildShopWheelLogo();
    buildBulbRing('#shopWheelBulbRing', 16, shopWheelBulbsFlag);
  }

  function buildWheelFace() {
    const wheel = $('#casinoWheel');
    if (!wheel || wheelBuilt) return;
    const segs = WHEEL.segments;
    const n = segs.length;
    const step = 100 / n;
    const parts = segs.map((s, i) => `${s.color} ${i * step}% ${(i + 1) * step}%`);
    wheel.style.background = `conic-gradient(from ${-90 - 180 / n}deg, ${parts.join(', ')})`;
    wheel.innerHTML = `
      <div class="wheel-inner-ring" aria-hidden="true"></div>
      <div class="wheel-hub" aria-hidden="true"><span class="hub-7">7</span></div>`;
    const ring = document.createElement('div');
    ring.className = 'wheel-label-ring';
    segs.forEach((s, i) => {
      const ang = (i + 0.5) * (360 / n) - 90;
      const lbl = document.createElement('span');
      lbl.className = 'wheel-orbit-label';
      const dark = ['#1c1917', '#292524', '#450a0a', '#0f766e'].includes(s.color);
      lbl.classList.toggle('wheel-lbl-dark', dark);
      lbl.innerHTML = `<span class="wl-icon">${s.icon || '·'}</span><span class="wl-text">${s.label}</span>`;
      lbl.style.transform = `rotate(${ang}deg) translate(0, -${LABEL_RADIUS}px) rotate(${-ang}deg)`;
      ring.appendChild(lbl);
    });
    wheel.appendChild(ring);
    wheelBuilt = true;
  }

  function spinToIndex(idx) {
    const wheel = $('#casinoWheel');
    if (!wheel) return Promise.resolve();
    const n = WHEEL.segments.length;
    const segAngle = 360 / n;
    const current = parseFloat(wheel.dataset.rotation || '0') || 0;
    const target = current + 360 * 5 + (360 - idx * segAngle - segAngle / 2);
    const stage = wheel.closest('.wheel-stage');
    stage?.classList.add('is-spinning');
    wheel.classList.add('spinning');
    wheel.style.transform = `rotate(${target}deg)`;
    wheel.dataset.rotation = String(target);
    return new Promise((resolve) => setTimeout(resolve, 4200)).finally(() => {
      stage?.classList.remove('is-spinning');
      wheel.classList.remove('spinning');
    });
  }

  function applyWheelReward(seg, betCost) {
    const st = window.state;
    if (!st) return { title: '—', body: '', kind: 'neutral' };

    switch (seg.id) {
      case 'cash_8':
        st.money += 8;
        return { title: 'KA-CHING!', body: `+$8 (bet $${betCost})`, kind: 'win' };
      case 'cash_15':
        st.money += 15;
        return { title: 'BIG WIN!', body: `+$15 — ${seg.flavor}`, kind: 'win' };
      case 'tarot': {
        const t = window.GameData?.randomTarot?.();
        if (t && st.consumables.length < st.consumableSlots) {
          st.consumables.push({ kind: 'tarot', def: t });
          window.renderConsumables?.();
          return { title: 'MYSTIC LUCK', body: `Got ${t.name || 'Tarot'}!`, kind: 'win' };
        }
        st.money += 5;
        return { title: 'FULL POCKETS', body: 'No slot — +$5 instead.', kind: 'neutral' };
      }
      case 'planet': {
        const p = window.GameData?.randomPlanet?.();
        if (p && st.consumables.length < st.consumableSlots) {
          st.consumables.push({ kind: 'planet', def: p });
          window.renderConsumables?.();
          return { title: 'STAR ALIGN', body: `Got ${p.name || 'Planet'}!`, kind: 'win' };
        }
        st.money += 5;
        return { title: 'FULL POCKETS', body: 'No slot — +$5 instead.', kind: 'neutral' };
      }
      case 'coupon':
        st.casinoShopCredit = (st.casinoShopCredit || 0) + 3;
        return { title: 'COUPON!', body: 'Next shop buy: -$3', kind: 'win' };
      case 'head_start':
        st.pendingBlindChips = (st.pendingBlindChips || 0) + 30;
        return { title: 'RUNNING START', body: '+30 score next blind', kind: 'win' };
      case 'bust': {
        const loss = Math.floor(st.money * 0.5);
        st.money = Math.max(0, st.money - loss);
        return { title: 'BUST!', body: `House took $${loss}.`, kind: 'lose' };
      }
      default:
        return { title: 'OOPS', body: seg.flavor, kind: 'neutral' };
    }
  }

  async function doWheelSpin(cost) {
    if (spinning || !usePlay(cost)) {
      if (!spinning && playsLeft() > 0 && state.money < cost) {
        sfx('lose');
        renderResult('<strong>SHORT ON COINS</strong>Need more $!', 'lose');
      }
      return;
    }
    spinning = true;
    sfx('btn_click');
    renderResult('<strong>SPINNING...</strong>Wheel goes brrrr...', 'neutral');
    const seg = pickWeighted(WHEEL.segments);
    const idx = WHEEL.segments.findIndex(s => s.id === seg.id);
    sfx('card_play');
    await spinToIndex(idx >= 0 ? idx : 0);
    const out = applyWheelReward(seg, cost);
    if (out.kind === 'win') sfx('win');
    else if (out.kind === 'lose') sfx('lose');
    else sfx('coin');
    updateMoneyUI();
    window.renderShop?.();
    renderResult(`<strong>${out.title}</strong>${out.body}<br><em>${seg.flavor}</em>`, out.kind);
    spinning = false;
    renderBetButtons();
  }

  /* —— Slots（像素水果 · 滚轴 · 三连相同才吐钱）—— */
  function fruitHtml(sym) {
    return `<div class="slot-strip-item ${sym.symClass}"><span class="px-fruit ${sym.fruitClass}" role="img" aria-label="${sym.name}"></span></div>`;
  }

  function pickSlotSymbol(matchId) {
    const pool = SLOTS.symbols.map((s) => ({
      ...s,
      weight: (s.weight || 1) * (matchId && s.id === matchId ? WIN_ODDS_BOOST : 1),
    }));
    return pickWeighted(pool);
  }

  function wait(ms) {
    return new Promise((r) => setTimeout(r, ms));
  }

  function initReelStrip(reelIdx, sym) {
    const strip = $(`#slotStrip${reelIdx}`);
    if (!strip) return;
    const s = sym || pickSlotSymbol();
    strip.innerHTML = fruitHtml(s);
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';
  }

  async function scrollReel(reelIdx, finalSym, delayMs) {
    const reel = document.querySelector(`.slot-reel[data-reel="${reelIdx}"]`);
    const strip = $(`#slotStrip${reelIdx}`);
    if (!reel || !strip) return;

    await wait(delayMs);
    const spinLen = 10 + Math.floor(gameRand() * 8);
    const items = [];
    for (let i = 0; i < spinLen; i++) items.push(pickSlotSymbol());
    items.push(finalSym);
    strip.innerHTML = items.map((s) => fruitHtml(s)).join('');

    const offset = spinLen * SLOT_ITEM_H;
    const duration = 0.55 + reelIdx * 0.22;
    strip.style.transition = 'none';
    strip.style.transform = 'translateY(0)';
    reel.classList.add('spinning');
    await wait(30);
    strip.style.transition = `transform ${duration}s cubic-bezier(0.12, 0.85, 0.22, 1)`;
    strip.style.transform = `translateY(-${offset}px)`;
    await wait(duration * 1000 + 80);
    reel.classList.remove('spinning');
    reel.classList.add('stopping');
    sfx('coin');
    await wait(280);
    reel.classList.remove('stopping');
    initReelStrip(reelIdx, finalSym);
  }

  function evaluateSlots(s1, s2, s3) {
    const st = window.state;
    if (!st) return { title: '—', body: '', kind: 'neutral' };

    if (s1.id === s2.id && s2.id === s3.id) {
      const pay = s1.payout || 5;
      st.money += pay;
      return {
        title: 'TRIPLE MATCH!',
        body: `Three ${s1.name}s — +$${pay}`,
        kind: 'win',
      };
    }

    return {
      title: 'NO MATCH',
      body: 'Need three of the same fruit.',
      kind: 'lose',
    };
  }

  async function doSlotPull(cost) {
    if (spinning || !usePlay(cost)) {
      if (!spinning && !slotsDevFree() && playsLeft() > 0 && state.money < cost) {
        sfx('lose');
        renderResult('<strong>SHORT ON COINS</strong>Need more $!', 'lose');
      }
      return;
    }
    spinning = true;
    sfx('btn_click');
    renderResult('<strong>PULL...</strong>Reels rolling...', 'neutral');

    const r1 = pickSlotSymbol();
    const r2 = pickSlotSymbol(r1.id);
    const r3 = pickSlotSymbol(r1.id);

    await scrollReel(0, r1, 120);
    await scrollReel(1, r2, 0);
    await scrollReel(2, r3, 0);

    const out = evaluateSlots(r1, r2, r3);
    if (out.kind === 'win') sfx('win');
    else sfx('lose');

    updateMoneyUI();
    window.renderShop?.();
    renderResult(`<strong>${out.title}</strong>${out.body}`, out.kind);
    spinning = false;
    renderBetButtons();
  }

  /* —— Tabs & open —— */
  function setTab(tab) {
    if (spinning) return;
    activeTab = tab === 'slots' ? 'slots' : 'wheel';
    document.querySelectorAll('.casino-tab').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.casinoTab === activeTab);
    });
    $('#casinoPanelWheel')?.classList.toggle('hidden', activeTab !== 'wheel');
    $('#casinoPanelWheel')?.classList.toggle('active', activeTab === 'wheel');
    $('#casinoPanelSlots')?.classList.toggle('hidden', activeTab !== 'slots');
    $('#casinoPanelSlots')?.classList.toggle('active', activeTab === 'slots');
    renderBetButtons();
    const hint = activeTab === 'slots'
      ? '<strong>PIXEL FRUITS</strong>Three alike = cash'
      : '<strong>LUCKY WHEEL</strong>Pick a bet. Good luck!';
    renderResult(hint, 'neutral');
  }

  function open() {
    if (!document.querySelector('#scene-shop.active')) return;
    const wheel = $('#casinoWheel');
    if (wheel) {
      wheel.innerHTML = '';
      wheel.style.transform = '';
      wheel.dataset.rotation = '0';
      wheelBuilt = false;
    }
    buildBulbRing('#wheelBulbRing', BULB_COUNT, wheelBulbsFlag);
    buildWheelFace();
    [0, 1, 2].forEach((i) => initReelStrip(i, pickSlotSymbol()));
    setTab('wheel');
    $('#casinoModal')?.classList.remove('hidden');
    sfx('btn_click');
  }

  function close() {
    if (spinning) return;
    $('#casinoModal')?.classList.add('hidden');
    sfx('btn_click');
  }

  function bind() {
    $('#shopCasinoBtn')?.addEventListener('click', () => {
      if (document.querySelector('#scene-shop.active')) open();
    });
    $('#casinoCloseBtn')?.addEventListener('click', close);
    $('#casinoModal')?.addEventListener('click', (e) => {
      if (e.target?.id === 'casinoModal' && !spinning) close();
    });
    document.querySelectorAll('.casino-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        sfx('btn_hover');
        setTab(btn.dataset.casinoTab);
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { bind(); initShopVegasPromo(); });
  } else {
    bind();
    initShopVegasPromo();
  }

  function setSlotsFree(on) {
    window.devSlotsFree = !!on;
    if (window.devSlotsFree && window.state) state.casinoSpinsUsed = 0;
    renderPlaysMeta();
    if (!$('#casinoModal')?.classList.contains('hidden')) renderBetButtons();
  }

  window.Casino = {
    WHEEL,
    SLOTS,
    open,
    close,
    resetForShop,
    playsLeft,
    setTab,
    setSlotsFree,
    slotsDevFree,
    getShopCredit() {
      return window.state?.casinoShopCredit || 0;
    },
    consumeShopCredit(amount) {
      if (!window.state?.casinoShopCredit) return amount;
      const off = Math.min(amount - 1, state.casinoShopCredit);
      state.casinoShopCredit -= off;
      return Math.max(1, amount - off);
    },
  };

  window.resetCasinoForShop = resetForShop;
  window.updateShopCasinoBadge = function updateShopCasinoBadge() {
    const btn = $('#shopCasinoBtn');
    if (!btn) return;
    const badge = btn.querySelector('.shop-casino-badge');
    if (slotsDevFree()) {
      if (badge) badge.textContent = 'slots ∞';
      btn.disabled = false;
      btn.classList.remove('is-maxed');
      btn.style.opacity = '1';
      return;
    }
    const used = window.state?.casinoSpinsUsed ?? 0;
    const left = Math.max(0, WHEEL.maxPlaysPerShop - used);
    if (badge) {
      badge.textContent = left > 0
        ? (window.I18N?.t?.(`${left} plays left`, `可玩 ${left} 次`) ?? `${left} plays left`)
        : (window.I18N?.t?.('come back next shop', '下店再来') ?? 'come back next shop');
    }
    btn.disabled = left <= 0;
    btn.classList.toggle('is-maxed', left <= 0);
    btn.style.opacity = left <= 0 ? '0.55' : '1';
  };
})();
