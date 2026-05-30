/* ============================================================
 *  game.js  —  核心玩法
 *  依赖 window.GameData (data-bundle.js) 与 window.Sounds (sounds.js)
 * ============================================================ */

const G = window.GameData;

// ============ 基础常量 ============
const SUITS = ['♠', '♥', '♦', '♣'];
const SUIT_COLORS = { '♠':'black', '♥':'red', '♦':'red', '♣':'black' };
const RANKS = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
const RANK_CHIPS = G.rankChips;
const RANK_ORDER = G.rankOrder;
const FACE_RANKS = new Set(['J','Q','K']);

// 卡牌强化 / 版本 / 封印的视觉色
const RARITY_COLOR = {
  common:    '#5aafe8',
  uncommon:  '#34d399',
  rare:      '#ef4444',
  legendary: '#fbbf24',
};

// ============ 状态 ============
const state = {
  baseDeck: [],                    // 玩家"全套"牌（含补充包加的）
  deck: [], hand: [], selected: new Set(),
  jokers: [],
  consumables: [],
  jokerSlots: 5,
  consumableSlots: 2,

  handStats: {},                   // { handId: { level, chipsBonus, multBonus } }

  money: 4,
  handsMax: 4, handsLeft: 4,
  discardsMax: 3, discardsLeft: 3,
  discardsUsedThisRound: 0,
  handsPlayedThisRound: 0,
  totalHandsPlayed: 0,

  roundScore: 0,
  blindScore: G.getBlindScore(1, 'small'),
  ante: 1,
  blind: 'small',                  // 'small' | 'big' | 'boss'
  bossId: null,
  bossRotateIdx: 0,
  lockedHandKey: null,             // 锁链 boss 锁住的牌 key

  reroll: G.economy.reroll_initial_cost,
  rerollDiscountPerm: 0,
  _pendingPayout: 0,

  shopJokers: [], shopVoucher: null, shopVouchers: [], shopPacks: [], shopConsumables: [],
  shopBought: new Set(),
  ownedVouchers: new Set(),

  shopJokerSlots: 2,
  shopDiscount: 0,
  editionRateMult: 1,
  interestCapBonus: 0,
  hasTelescope: false,
  hasObservatory: false,
  handPlayCounts: {},
  tags: [],
  tagQueue: [],
  tagInvestment: false,
  blindIdx: 0,
  selectedDeckId: 'deck_red',
  stakeId: 'stake_white',
  deckId: 'deck_red',
  seed: '',
  isSeededRun: false,
  isDailyRun: false,
  noInterest: false,
  deckGreen: false,
  unusedHandBonus: 1,

  lastUsedTarot: null,

  casinoSpinsUsed: 0,
  pendingBlindChips: 0,
  casinoShopCredit: 0,
  lastUsedPlanet: null,
  pendingDiscardMult: 0,

  runStats: {
    bestHandScore: 0,
    bestHandName: '',
    cardsPlayed: 0,
    cardsDiscarded: 0,
    cardsPurchased: 0,
    rerolls: 0,
    runRound: 0,
    discoveriesAtStart: 0,
    defeatedBy: '',
  },
};

window.state = state;

// ============ 工具 ============
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function sfx(n) { window.Sounds?.play(n); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randInt(min, max) { return Math.floor(gameRand() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(gameRand() * arr.length)]; }
function uid() { return Math.random().toString(36).slice(2, 9); }
function cardKey(c) { return c._k ||= uid(); }

let _rngState = null;
function hashSeedStr(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function gameRand() {
  if (_rngState == null) return Math.random();
  _rngState = (Math.imul(_rngState, 1664525) + 1013904223) >>> 0;
  return _rngState / 4294967296;
}
window.gameRand = gameRand;
function setRunSeed(seed) {
  if (!seed) { _rngState = null; return; }
  _rngState = hashSeedStr(String(seed)) || 1;
}
function generateRunSeed() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 8; i++) out += chars[Math.floor(Math.random() * chars.length)];
  return out;
}
function getStakeMult() {
  return G.getAnteScoreMult(state.stakeId, state.ante);
}
function hasStakeMod(mod) {
  return G.hasStakeMod(state.stakeId, mod);
}
function rollStakeSticker(j) {
  if (hasStakeMod('rental_jokers') && gameRand() < 0.3) {
    j._sticker = 'rental';
    return;
  }
  if (hasStakeMod('perishable_jokers') && gameRand() < 0.3) {
    j._sticker = 'perishable';
    j._perishLeft = 5;
    return;
  }
  if (hasStakeMod('eternal_jokers') && gameRand() < 0.3) {
    j._sticker = 'eternal';
  }
}
function isJokerActive(j) {
  return j && !j._perished;
}
function tickPerishableJokers() {
  for (const j of state.jokers) {
    if (j._sticker !== 'perishable' || j._perished) continue;
    j._perishLeft = (j._perishLeft ?? 5) - 1;
    if (j._perishLeft <= 0) j._perished = true;
  }
}
function chargeRentalJokers() {
  let total = 0;
  for (const j of state.jokers) {
    if (j._sticker === 'rental') total += 3;
  }
  if (total) {
    state.money = Math.max(0, state.money - total);
    showPopup(`Rental −$${total}`, '#f87171', 18);
  }
}
function getCurrentRound() {
  const blindOff = { small: 1, big: 2, boss: 3 }[state.blind] || 1;
  return Math.max(1, (state.ante - 1) * 3 + blindOff);
}
function resetRunStats(defeatedBy = '') {
  const seenCount = window.Collection?.getSeenCount?.() ?? 0;
  state.runStats = {
    bestHandScore: 0,
    bestHandName: '',
    cardsPlayed: 0,
    cardsDiscarded: 0,
    cardsPurchased: 0,
    rerolls: 0,
    runRound: 0,
    discoveriesAtStart: seenCount,
    defeatedBy,
  };
}
function recordHandScore(gained, handName) {
  if (gained > state.runStats.bestHandScore) {
    state.runStats.bestHandScore = gained;
    state.runStats.bestHandName = handName;
  }
}
function getMostPlayedHandLabel() {
  const entries = Object.entries(state.handPlayCounts);
  if (!entries.length) return '—';
  entries.sort((a, b) => b[1] - a[1]);
  const [handId, count] = entries[0];
  const hand = G.getHand(handId);
  return `${hand?.en || hand?.name || handId} (${count})`;
}
function applyDeckPerk(deck) {
  state.noInterest = false;
  state.deckGreen = false;
  state.unusedHandBonus = G.economy.money_per_unused_hand;
  switch (deck.perk) {
    case 'discards_+1':
      state.discardsMax += 1;
      state.discardsLeft += 1;
      break;
    case 'hands_+1':
      state.handsMax += 1;
      state.handsLeft += 1;
      break;
    case 'money_+10':
      state.money += 10;
      break;
    case 'no_interest':
      state.noInterest = true;
      state.deckGreen = true;
      state.unusedHandBonus = 2;
      break;
    case 'joker_+1':
      state.jokerSlots += 1;
      state.handsMax = Math.max(1, state.handsMax - 1);
      state.handsLeft = Math.min(state.handsLeft, state.handsMax);
      break;
    case 'start_magic': {
      state.consumableSlots += 1;
      const crystal = G.getSpectral('sp_crystal_ball');
      const fool = G.getTarot('t_fool');
      if (crystal) state.consumables.push({ kind:'spectral', def: crystal });
      if (fool) {
        state.consumables.push({ kind:'tarot', def: fool });
        if (state.consumables.length < state.consumableSlots) {
          state.consumables.push({ kind:'tarot', def: fool });
        }
      }
      break;
    }
  }
}
function applyStakeModifiers() {
  if (hasStakeMod('less_discards')) {
    state.discardsMax = Math.max(0, state.discardsMax - 1);
    state.discardsLeft = Math.min(state.discardsLeft, state.discardsMax);
  }
}

function normalizeEnh(enh) {
  if (!enh) return null;
  const map = { lucky:'e_lucky', mult:'e_mult', bonus:'e_bonus', wild:'e_wild', steel:'e_steel',
    glass:'e_glass', stone:'e_stone', gold:'e_gold' };
  return map[enh] || enh;
}
function isWildCard(c) { return normalizeEnh(c.enh) === 'e_wild'; }
function isNegativeJoker(j) { return j._edition === 'ed_negative'; }
function effectiveJokerCount() {
  return state.jokers.filter(j => !isNegativeJoker(j)).length;
}
function canAddJoker() { return effectiveJokerCount() < state.jokerSlots; }
window.canAddJoker = canAddJoker;
function shopPrice(base) {
  return Math.max(1, Math.floor(base * (1 - state.shopDiscount)));
}
function finalShopCharge(base) {
  let p = shopPrice(base);
  if (window.Casino?.consumeShopCredit) p = Casino.consumeShopCredit(p);
  return p;
}
function getInterestCap() {
  return G.economy.interest_cap + state.interestCapBonus;
}
function rollEditionForShop() {
  const ed = G.rollEdition(state.editionRateMult);
  return ed.id === 'ed_base' ? null : ed.id;
}
function applyEditionScoring(editionId, chips, mult) {
  if (!editionId || editionId === 'ed_base') return { chips, mult };
  const ed = G.getEdition(editionId);
  if (!ed) return { chips, mult };
  if (ed.effect === 'add_chips') return { chips: chips + ed.value, mult };
  if (ed.effect === 'add_mult')  return { chips, mult: mult + ed.value };
  if (ed.effect === 'x_mult')    return { chips, mult: round1(mult * ed.value) };
  return { chips, mult };
}
function getRerollBase() {
  return Math.max(0, G.economy.reroll_initial_cost - (state.rerollDiscountPerm || 0));
}
function eligibleVouchers() {
  return G.vouchers.filter(v => !state.ownedVouchers.has(v.id)
    && (!v.requires || state.ownedVouchers.has(v.requires)));
}

// ============ 牌型分数 ============
function getHandStats(handId) {
  if (!state.handStats[handId]) state.handStats[handId] = { level:1, chipsBonus:0, multBonus:0 };
  return state.handStats[handId];
}
function levelUpHandFromPlanet(planetDef) {
  const s = getHandStats(planetDef.hand);
  s.level += 1;
  s.chipsBonus += planetDef.chips;
  s.multBonus += planetDef.mult;
}
function getHandScore(handId) {
  const base = G.getHand(handId);
  const st = getHandStats(handId);
  return {
    chips: base.chips + st.chipsBonus,
    mult:  base.mult  + st.multBonus,
    level: st.level,
    name:  base.name,
    en:    base.en,
  };
}

// ============ 牌组 ============
function newBaseDeck() {
  const d = [];
  for (const s of SUITS) for (const r of RANKS) {
    d.push({ rank:r, suit:s, color:SUIT_COLORS[s], enh:null });
  }
  return d;
}
function shuffle(arr) {
  for (let i=arr.length-1; i>0; i--) {
    const j = Math.floor(gameRand()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function resetDeckForBlind() {
  state.deck = shuffle(state.baseDeck.map(c => ({ ...c, _k: uid() })));
}
function handSizeTarget() {
  const boss = getBoss();
  if (boss?.type === 'force_hand_size') return boss.value || 3;
  return G.economy.hand_size;
}

function swapHandWithDeck(hand, handIdx, deck, deckIdx) {
  const out = hand[handIdx];
  hand[handIdx] = deck[deckIdx];
  deck.splice(deckIdx, 1);
  deck.push(out);
}

function ensureHandPair(hand, deck, preferRanks) {
  if (hand.length < 2 || !deck.length) return false;
  const counts = {};
  for (const c of hand) counts[c.rank] = (counts[c.rank] || 0) + 1;

  const ranks = preferRanks || [...new Set(hand.map(c => c.rank))];
  for (const rank of ranks) {
    if ((counts[rank] || 0) >= 2) continue;
    const hi = hand.findIndex(c => c.rank === rank);
    const di = deck.findIndex(c => c.rank === rank);
    if (hi < 0 || di < 0) continue;
    swapHandWithDeck(hand, hi, deck, di);
    return true;
  }
  return false;
}

function biasFriendlyHand(hand, deck) {
  const prefer = ['A', 'K', 'Q', 'J', '10', ...RANKS];
  const counts = {};
  for (const c of hand) counts[c.rank] = (counts[c.rank] || 0) + 1;
  const hasPair = Object.values(counts).some(n => n >= 2);

  if (!hasPair) ensureHandPair(hand, deck, prefer);
  else if (gameRand() < 0.4) ensureHandPair(hand, deck, prefer);
}

function applyAnteProgressionHelp() {
  const help = G.getAnteHelp?.(state.ante);
  if (help?.hands) state.handsLeft += help.hands;
  if (help?.discards) state.discardsLeft += help.discards;
  const boss = getBoss();
  if (boss?.final && boss.type === 'disable_jokers') {
    state.handsLeft += 3;
    state.discardsLeft += 1;
  }
}

function drawTo(n) {
  n = n ?? handSizeTarget();
  while (state.hand.length < n && state.deck.length > 0) {
    state.hand.push(state.deck.pop());
    sfx('draw');
  }
  if (state.hand.length >= n && state.ante <= 2 && state.blind === 'small') {
    biasFriendlyHand(state.hand, state.deck);
  }
}

// ============ 牌型识别 ============
function effectiveSuit(c)  { return isWildCard(c) ? '*' : c.suit; }
function isStoneCard(c)    { return normalizeEnh(c.enh) === 'e_stone'; }
function effectiveOrder(c) { return isStoneCard(c) ? -1 : RANK_ORDER[c.rank]; }

function evalHand(cards) {
  if (!cards.length) return { handId:'high_card', scoringIdx:[] };
  const ranked = cards.filter(c => !isStoneCard(c));
  const byRank = {};
  for (const c of ranked) (byRank[c.rank] ||= []).push(c);
  const groups = Object.values(byRank).sort((a,b)=>b.length-a.length);
  const sizes = groups.map(g=>g.length);

  // 同花：5+ 张，全部花色相同 或 wild
  let sameSuit = false;
  if (cards.length >= 5) {
    let suitSet = null;
    for (const c of cards) {
      if (isWildCard(c)) continue;
      if (!suitSet) suitSet = c.suit;
      else if (suitSet !== c.suit) { suitSet = false; break; }
    }
    sameSuit = !!suitSet;
  }

  // 顺子
  let isStraight = false, isRoyal = false;
  if (ranked.length >= 5) {
    const vals = [...new Set(ranked.map(c=>RANK_ORDER[c.rank]))].sort((a,b)=>a-b);
    for (let i=0; i<=vals.length-5; i++) {
      if (vals[i+4]-vals[i]===4) { isStraight=true; break; }
    }
    if (!isStraight && vals.includes(14) && [2,3,4,5].every(v=>vals.includes(v))) isStraight=true;
    if (isStraight && vals.includes(14) && [10,11,12,13].every(v=>vals.includes(v))) isRoyal=true;
  }

  let handId, scoringCards;
  if (isStraight && sameSuit && isRoyal)       { handId='royal_flush';     scoringCards=cards; }
  else if (isStraight && sameSuit)             { handId='straight_flush';  scoringCards=cards; }
  else if (sizes[0]===5)                       { handId='five_of_a_kind';  scoringCards=groups[0]; }
  else if (sizes[0]===3 && sizes[1]===2 && sameSuit) {
    handId='flush_house'; scoringCards=[...groups[0], ...groups[1]];
  }
  else if (sizes[0]===4)                       { handId='four_of_a_kind';  scoringCards=groups[0]; }
  else if (sameSuit && cards.length===5 && !isStraight) {
    handId='flush_five'; scoringCards=cards;
  }
  else if (sizes[0]===3 && sizes[1]===2)       { handId='full_house';      scoringCards=[...groups[0], ...groups[1]]; }
  else if (sameSuit)                           { handId='flush';           scoringCards=cards; }
  else if (isStraight)                         { handId='straight';        scoringCards=cards; }
  else if (sizes[0]===3)                       { handId='three_of_a_kind'; scoringCards=groups[0]; }
  else if (sizes[0]===2 && sizes[1]===2)       { handId='two_pair';        scoringCards=[...groups[0], ...groups[1]]; }
  else if (sizes[0]===2)                       { handId='pair';            scoringCards=groups[0]; }
  else {
    const highest = ranked.length
      ? ranked.reduce((a,b)=>RANK_ORDER[a.rank]>RANK_ORDER[b.rank]?a:b)
      : cards[0];
    handId='high_card'; scoringCards=[highest];
  }
  // 石头牌总是计入计分
  const stoneCards = cards.filter(isStoneCard);
  const scoringIdx = [...scoringCards, ...stoneCards].map(c => cards.indexOf(c)).filter(i=>i>=0);
  return { handId, scoringIdx };
}

// ============ Boss 效果查询 ============
function getBoss() { return state.blind === 'boss' && state.bossId ? G.getBoss(state.bossId) : null; }

function isCardDebuffed(card) {
  const boss = getBoss();
  if (!boss) return false;
  if (boss.type === 'debuff_suit' && card.suit === boss.suit) return true;
  if (boss.type === 'debuff_rank_below' && !isStoneCard(card)) {
    const v = RANK_ORDER[card.rank];
    if (v > 0 && v < (boss.value || 5)) return true;
  }
  if (boss.type === 'rotating_debuff') {
    const idx = state.bossRotateIdx % SUITS.length;
    if (card.suit === SUITS[idx]) return true;
  }
  return false;
}
function isCardLocked(card) {
  return state.lockedHandKey && cardKey(card) === state.lockedHandKey;
}

// ============ 渲染 ============
function renderHand() {
  const container = $('#handCards');
  if (!container) return;
  container.innerHTML = '';
  const sel = [...state.selected].sort((a,b)=>a-b);
  const boss = getBoss();
  const hideAll = boss?.type === 'hide_card_values';

  state.hand.forEach((card, idx) => {
    const el = document.createElement('div');
    el.className = `card ${card.color}`;
    if (state.selected.has(idx)) el.classList.add('selected');
    if (isCardDebuffed(card))   el.classList.add('debuffed');
    if (isCardLocked(card))     el.classList.add('locked');
    if (card.enh)               el.classList.add(`enh-${normalizeEnh(card.enh)}`);
    if (card._edition)          el.classList.add(`ed-${card._edition.replace('ed_','')}`);
    if (card._seal)             el.classList.add(`seal-${card._seal.replace('s_','')}`);
    if (hideAll)                el.classList.add('facedown');
    el.dataset.idx = idx;

    const order = sel.indexOf(idx);
    if (hideAll) {
      el.innerHTML = `<div class="card-back">?</div>${order>=0?`<div class="sel-badge">${order+1}</div>`:''}`;
    } else {
      el.innerHTML = `
        <div class="rank-tl">${card.rank}</div>
        <div class="suit-tl">${card.suit}</div>
        <div class="suit-center">${card.suit}</div>
        <div class="rank-br">${card.rank}</div>
        <div class="suit-br">${card.suit}</div>
        ${card.enh ? `<div class="enh-tag">${enhLabel(card.enh)}</div>` : ''}
        ${order >= 0 ? `<div class="sel-badge">${order+1}</div>` : ''}
      `;
    }
    el.addEventListener('click', () => toggleSelect(idx));
    enableDragReorder(el, idx);
    container.appendChild(el);
  });
  updateHandtypePreview();
  $('#deckCount') && ($('#deckCount').textContent = `${state.deck.length}/${state.baseDeck.length}`);
  $('#topProgressDeck') && ($('#topProgressDeck').textContent = `${state.deck.length}/${state.baseDeck.length}`);
  $('#topProgressHands') && ($('#topProgressHands').textContent = `Hands ${state.handsPlayedThisRound}/${state.handsMax}`);
}

function enhLabel(e) {
  return { e_bonus:'+30', e_mult:'×M', e_wild:'★', e_glass:'X2', e_steel:'1.5', e_stone:'■', e_gold:'$', e_lucky:'?' }[e] || '';
}

function revealCardEl(card, el) {
  if (!el || !card) return;
  el.classList.remove('facedown');
  el.innerHTML = `
    <div class="rank-tl">${card.rank}</div>
    <div class="suit-tl">${card.suit}</div>
    <div class="suit-center">${card.suit}</div>
    <div class="rank-br">${card.rank}</div>
    <div class="suit-br">${card.suit}</div>
    ${card.enh ? `<div class="enh-tag">${enhLabel(normalizeEnh(card.enh))}</div>` : ''}`;
}

function jokerCardHTML(j) {
  const face = window.CardArt
    ? CardArt.joker(j)
    : (() => {
        const color = RARITY_COLOR[j.rarity] || '#5aafe8';
        return `<div class="joker-fallback" style="--rc:${color}">
          <div class="jf-icon">★</div>
          <div class="jf-name">${j.name}</div>
        </div>`;
      })();
  return `
    ${face}
    <div class="joker-tooltip">
      <div class="tooltip-name">${j.name}</div>
      <div class="tooltip-eff">${j.desc}</div>
      ${j._edition ? `<div class="ed-badge">${G.getEdition(j._edition)?.name || ''}</div>` : ''}
      ${j._uses != null ? `<div class="tooltip-eff">剩余次数: ${j._uses}</div>` : ''}
      <div class="tooltip-sell">右键卖出 $${sellPriceOf(j)}</div>
    </div>
  `;
}

function sellPriceOf(j) { return Math.max(1, Math.floor((j.price ?? 3) / 2)); }

function renderJokers() {
  const row = $('#jokerRow');
  if (!row) return;
  row.innerHTML = `<div class="slot-label">JOKERS <span id="jokerCount">${effectiveJokerCount()}/${state.jokerSlots}</span></div>`;
  state.jokers.forEach((j, i) => {
    const el = document.createElement('div');
    el.className = 'joker-card-img';
    el.draggable = true;
    el.dataset.jidx = i;
    el.innerHTML = jokerCardHTML(j);
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); sellJoker(i); });
    el.addEventListener('dragstart', (e) => {
      el.classList.add('joker-dragging');
      e.dataTransfer.setData('text/plain', String(i));
    });
    el.addEventListener('dragend', () => el.classList.remove('joker-dragging'));
    el.addEventListener('dragover', (e) => { e.preventDefault(); el.classList.add('joker-drag-over'); });
    el.addEventListener('dragleave', () => el.classList.remove('joker-drag-over'));
    el.addEventListener('drop', (e) => {
      e.preventDefault();
      el.classList.remove('joker-drag-over');
      const from = Number(e.dataTransfer.getData('text/plain'));
      const to = i;
      if (Number.isNaN(from) || from === to) return;
      const [moved] = state.jokers.splice(from, 1);
      state.jokers.splice(to, 0, moved);
      renderJokers();
    });
    row.appendChild(el);
  });
}

function consumableCardHTML(c) {
  const kindColors = { planet:'#60a5fa', tarot:'#a855f7', spectral:'#22d3ee' };
  const kindIcons = { planet:'⊕', tarot:'★', spectral:'◈' };
  const color = kindColors[c.kind] || '#a855f7';
  const icon = kindIcons[c.kind] || '★';
  const face = window.CardArt && c.kind !== 'spectral'
    ? (c.kind === 'planet' ? CardArt.planet(c.def) : CardArt.tarot(c.def))
    : (() => {
        return `<div class="consum-face" style="background:linear-gradient(180deg,${color}30,#0a0a14);border-color:${color}">
          <div class="consum-icon" style="color:${color}">${icon}</div>
          <div class="consum-name">${c.def.name}</div>
        </div>`;
      })();
  return `
    ${face}
    <div class="joker-tooltip">
      <div class="tooltip-name">${c.def.name}</div>
      <div class="tooltip-eff">${c.def.desc}</div>
      <div class="tooltip-sell">点击使用 / 右键卖出 $${Math.max(1, Math.floor((c.def.price||3)/2))}</div>
    </div>
  `;
}

function renderConsumables() {
  const inGame = $('#scene-game').classList.contains('active');
  const rowId = inGame ? '#consumablesRow' : '#shopConsumablesRow';
  const countId = inGame ? '#consumablesCount' : '#shopConsumablesCount';
  const row = $(rowId);
  if (!row) return;
  row.innerHTML = inGame
    ? `<div class="slot-label">CONSUMABLES <span id="consumablesCount">${state.consumables.length}/${state.consumableSlots}</span></div>`
    : '';
  state.consumables.forEach((c, i) => {
    const el = document.createElement('div');
    el.className = 'joker-card-img consumable-card';
    el.innerHTML = consumableCardHTML(c);
    el.addEventListener('click', () => useConsumable(i));
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); sellConsumable(i); });
    row.appendChild(el);
  });
  if ($(countId) && !inGame) $(countId).textContent = `${state.consumables.length}/${state.consumableSlots}`;
}

function renderStats() {
  $('#money')        && ($('#money').textContent = `$${state.money}`);
  $('#handsLeft')    && ($('#handsLeft').textContent = state.handsLeft);
  $('#discardsLeft') && ($('#discardsLeft').textContent = state.discardsLeft);
  $('#roundScore')   && ($('#roundScore').textContent = state.roundScore);
  $('#blindScore')   && ($('#blindScore').textContent = state.blindScore);
  $('#ante')         && ($('#ante').textContent = state.ante);
  $('#round')        && ($('#round').textContent = (state.ante - 1) * 3 + ({small:1,big:2,boss:3}[state.blind]));
  renderBlindHeader();
}

function renderBlindHeader() {
  const tpl = G.blindTemplate.find(b => b.id === state.blind);
  if (!tpl) return;
  const header = $('#scene-game .blind-card-header');
  const chip   = $('#scene-game .blind-chip');
  const reward = $('#scene-game .blind-info-reward');
  if (!header || !chip || !reward) return;
  header.textContent = tpl.name;
  header.style.background = tpl.color;
  const boss = getBoss();
  chip.innerHTML = state.blind === 'boss'
    ? `<span style="font-size:14px;color:#ff4a3a;">BOSS</span><span style="font-size:7px;">${boss?.name || ''}</span>`
    : `<span>${state.blind === 'small' ? 'SMALL' : 'BIG'}</span><span>BLIND</span>`;
  chip.style.background = state.blind === 'boss'
    ? 'radial-gradient(circle at 30% 30%, #ff5a4a, #6a1a14)'
    : (state.blind === 'big'
        ? 'radial-gradient(circle at 30% 30%, #f5c84a, #8a5a10)'
        : 'radial-gradient(circle at 30% 30%, #5aafe8, #2a6090)');
  reward.innerHTML = `Reward: <span class="dollar">${'$'.repeat(tpl.reward)}</span>`;
}

function toggleSelect(idx) {
  if (state.selected.has(idx)) state.selected.delete(idx);
  else if (state.selected.size < 5) state.selected.add(idx);
  sfx('card_select');
  renderHand();
}
function getSelectedCards() {
  return [...state.selected].sort((a,b)=>a-b).map(i => state.hand[i]);
}
function updateHandtypePreview() {
  const sel = getSelectedCards();
  const nameEl = $('#handtypeName');
  if (!nameEl) return;
  if (!sel.length) {
    nameEl.textContent = '—';
    $('#htChips').textContent = '0'; $('#htMult').textContent = '0';
    return;
  }
  const { handId } = evalHand(sel);
  const s = getHandScore(handId);
  nameEl.textContent = `${s.name} ★${s.level}`;
  $('#htChips').textContent = s.chips;
  $('#htMult').textContent  = s.mult;
}

// ============ 拖动排序 ============
function enableDragReorder(el, idx) {
  el.draggable = true;
  el.addEventListener('dragstart', (e) => {
    el.classList.add('dragging');
    e.dataTransfer.setData('text/plain', String(idx));
    e.dataTransfer.effectAllowed = 'move';
  });
  el.addEventListener('dragend',   () => el.classList.remove('dragging'));
  el.addEventListener('dragover',  (e) => { e.preventDefault(); el.classList.add('drag-over'); });
  el.addEventListener('dragleave', () => el.classList.remove('drag-over'));
  el.addEventListener('drop', (e) => {
    e.preventDefault();
    el.classList.remove('drag-over');
    const from = Number(e.dataTransfer.getData('text/plain'));
    if (Number.isNaN(from) || from === idx) return;
    const moved = state.hand.splice(from, 1)[0];
    state.hand.splice(idx, 0, moved);
    const oldSel = new Set(state.selected);
    state.selected = new Set();
    if (oldSel.has(from)) state.selected.add(idx);
    renderHand();
  });
}

// ============ 出牌 / 计分 ============
async function playHand() {
  if (!state.selected.size || state.handsLeft <= 0) return;
  // 锁链 boss：不允许出锁住的牌
  for (const i of state.selected) {
    if (isCardLocked(state.hand[i])) { sfx('lose'); return; }
  }
  sfx('card_play');

  const playedIdxs   = [...state.selected].sort((a,b)=>a-b);
  const playedCards  = playedIdxs.map(i => state.hand[i]);
  let { handId, scoringIdx } = evalHand(playedCards);

  const bossDisable = getBoss()?.type === 'disable_jokers';
  if (!bossDisable && handId === 'pair' && state.jokers.some(j => j.type === 'pair_to_three')) {
    handId = 'three_of_a_kind';
    showPopup('TWIN TROUBLE!', '#a855f7', 22);
    await sleep(280);
  }

  const cardEls = [...$('#handCards').querySelectorAll('.card')];
  const isFirstPlayHand = state.handsPlayedThisRound === 0;
  const firstHandHidden = isFirstPlayHand && getBoss()?.type === 'first_hand_facedown';
  playedIdxs.forEach(i => cardEls[i].classList.add('playing'));
  if (firstHandHidden) {
    playedIdxs.forEach(i => {
      const el = cardEls[i];
      if (!el) return;
      el.classList.add('facedown');
      el.innerHTML = '<div class="card-back">?</div>';
    });
    showPopup('THE HOUSE!', '#ef4444', 20);
    await sleep(220);
  }
  await sleep(firstHandHidden ? 120 : 350);

  const base = getHandScore(handId);
  let chips = base.chips;
  let mult  = base.mult;
  if (state.pendingDiscardMult) {
    mult += state.pendingDiscardMult;
    showPopup(`+${state.pendingDiscardMult} Mult (Burn)`, '#c05621', 20);
    state.pendingDiscardMult = 0;
    await sleep(200);
  }
  $('#handtypeName').textContent = `${base.name} ★${base.level}`;
  $('#htChips').textContent = chips; $('#htMult').textContent = mult;
  syncScoreSidebar(chips, mult);
  setScorePhase('HAND TYPE');
  await sleep(280);

  state.handsPlayedThisRound += 1;
  state.totalHandsPlayed += 1;
  state.handPlayCounts[handId] = (state.handPlayCounts[handId] || 0) + 1;

  const allSameColor = playedCards.every(c => c.color === playedCards[0].color);
  const hasRed = playedCards.some(c => c.color === 'red');
  const hasBlack = playedCards.some(c => c.color === 'black');
  const mixedColors = hasRed && hasBlack;
  const scoringCards = scoringIdx.map(i => playedCards[i]);
  const hasTimeLoop = !bossDisable && state.jokers.some(j => j.type === 'retrigger_first');

  setScorePhase('CARDS');
  async function scoreOneCard(card, cardEl, isRetrigger) {
    if (isCardDebuffed(card)) {
      cardEl?.classList.add('debuffed-flash');
      showPopup('DEBUFFED', '#888', 18);
      await sleep(220);
      return;
    }
    cardEl?.classList.add('scoring');
    revealCardEl(card, cardEl);

    let cardChips = isStoneCard(card) ? 50 : RANK_CHIPS[card.rank];
    const enh = normalizeEnh(card.enh);
    chips += cardChips;
    flash('#htChips', chips);
    showPopup(`+${cardChips}`, '#5aafe8');
    sfx('chip_score');
    await sleep(160);

    if (card._edition) {
      const edOut = applyEditionScoring(card._edition, chips, mult);
      const dChips = edOut.chips - chips, dMult = edOut.mult - mult;
      chips = edOut.chips; mult = edOut.mult;
      if (dChips) { flash('#htChips', chips); showPopup(`+${dChips} Ed`, '#60a5fa'); await sleep(140); }
      if (dMult)  { flash('#htMult', mult); showPopup(`+${dMult} Ed`, '#f472b6'); await sleep(140); }
    }

    if (enh === 'e_bonus') {
      chips += 30; flash('#htChips', chips);
      showPopup('+30', '#60a5fa'); sfx('chip_score'); await sleep(160);
    }
    if (enh === 'e_mult') {
      mult += 4; flash('#htMult', mult);
      showPopup('+4 Mult', '#ef4444'); sfx('mult_score'); await sleep(160);
    }
    if (enh === 'e_glass') {
      mult *= 2; mult = round1(mult); flash('#htMult', mult);
      showPopup('×2 Mult', '#67e8f9'); sfx('mult_score'); await sleep(160);
      if (Math.random() < 0.25) {
        card._break = true;
        showPopup('SHATTER', '#67e8f9', 18);
      }
    }
    if (enh === 'e_lucky') {
      if (Math.random() < 0.2)  { mult += 20; flash('#htMult', mult); showPopup('+20 Mult', '#34d399'); await sleep(160); }
      if (Math.random() < 0.067){ state.money += 20; renderStats(); showPopup('+$20', '#fbbf24'); await sleep(160); }
    }
    if (card._seal === 's_gold') {
      state.money += 3; renderStats();
      showPopup('+$3 Seal', '#fbbf24'); sfx('coin'); await sleep(160);
    }

    cardEl?.classList.remove('scoring');
    if (!isRetrigger && card._seal === 's_red') {
      showPopup('RETRIGGER', '#dc2626', 18);
      sfx('joker_trigger');
      await sleep(120);
      await scoreOneCard(card, cardEl, true);
    }
  }

  for (let ci = 0; ci < scoringCards.length; ci++) {
    const card = scoringCards[ci];
    const localIdx = playedCards.indexOf(card);
    const cardEl   = cardEls[playedIdxs[localIdx]];
    await scoreOneCard(card, cardEl);
    if (ci === 0 && hasTimeLoop) {
      showPopup('TIME LOOP!', '#a855f7', 20);
      sfx('joker_trigger');
      await sleep(180);
      await scoreOneCard(card, cardEl);
    }
  }

  // 手牌上的钢铁牌：仅计分时 ×1.5（未打出的牌）
  for (const c of state.hand) {
    if (normalizeEnh(c.enh) === 'e_steel' && !playedCards.includes(c)) {
      mult = round1(mult * 1.5);
      flash('#htMult', mult);
      showPopup('×1.5 Steel', '#9ca3af'); sfx('mult_score'); await sleep(180);
    }
  }

  // 天文台：持有对应牌型的行星消耗品时 ×1.5
  if (state.hasObservatory) {
    const hasPlanet = state.consumables.some(c =>
      c.kind === 'planet' && c.def.hand === handId);
    if (hasPlanet) {
      mult = round1(mult * 1.5);
      flash('#htMult', mult);
      showPopup('×1.5 Observatory', '#60a5fa', 20);
      sfx('mult_score'); await sleep(220);
    }
  }

  // Joker 触发（除非 Boss 禁用）
  if (!bossDisable) {
    setScorePhase('JOKERS');
    for (let ji = 0; ji < state.jokers.length; ji++) {
      const j = state.jokers[ji];
      if (!isJokerActive(j)) continue;
      if (j.type === 'pair_to_three' || j.type === 'retrigger_first') continue;
      highlightJoker(ji, true);
      if (j._edition && j._edition !== 'ed_base') {
        const bc = chips, bm = mult;
        const edOut = applyEditionScoring(j._edition, chips, mult);
        chips = edOut.chips; mult = edOut.mult;
        if (chips !== bc || mult !== bm) {
          flash('#htChips', chips); flash('#htMult', mult);
          syncScoreSidebar(chips, mult);
          showPopup(G.getEdition(j._edition)?.name || 'Edition', '#f472b6', 18);
          await sleep(180);
        }
      }
      const out = await applyJoker(j, { chips, mult, scoringCards, handId, playedCards, allSameColor, mixedColors });
      chips = out.chips; mult = out.mult;
      syncScoreSidebar(chips, mult);
      highlightJoker(ji, false);
    }
  }

  setScorePhase('TOTAL');
  const gained = Math.floor(chips * mult);
  state.roundScore += gained;
  state.runStats.cardsPlayed += playedCards.length;
  recordHandScore(gained, base.name);
  showPopup(`+${gained}`, '#f5c84a', 38);
  sfx('big_score');
  await sleep(700);
  setScorePhase('');

  // 销毁碎裂的玻璃牌（从 baseDeck 中移除）
  for (const c of scoringCards) {
    if (c._break) {
      const idx = state.baseDeck.findIndex(bc => bc.rank===c.rank && bc.suit===c.suit && bc.enh===c.enh);
      if (idx >= 0) state.baseDeck.splice(idx, 1);
    }
  }

  // 移除已出的手牌、补齐手牌
  state.hand = state.hand.filter((_, i) => !state.selected.has(i));
  state.selected.clear();
  drawTo();
  state.handsLeft -= 1;

  // 钟摆 boss：每出一手轮换花色
  if (getBoss()?.type === 'rotating_debuff') state.bossRotateIdx += 1;

  renderHand(); renderStats();

  if (state.roundScore >= state.blindScore)      setTimeout(showCashOut, 400);
  else if (state.handsLeft <= 0)                 setTimeout(showRoundFail, 400);
}

function round1(n) { return Math.round(n * 10) / 10; }

function discardHand() {
  if (!state.selected.size || state.discardsLeft <= 0) return;
  if (getBoss()?.type === 'no_discards') { sfx('lose'); return; }
  for (const i of state.selected) {
    if (isCardLocked(state.hand[i])) { sfx('lose'); return; }
  }
  const discardCount = state.selected.size;
  const discarded = [...state.selected].sort((a,b)=>a-b).map(i => state.hand[i]);
  sfx('discard');
  state.hand = state.hand.filter((_, i) => !state.selected.has(i));
  state.selected.clear();
  drawTo();
  state.discardsLeft -= 1;
  state.discardsUsedThisRound += 1;
  state.runStats.cardsDiscarded += discardCount;

  for (const c of discarded) {
    if (c._seal === 's_purple' && state.consumables.length < state.consumableSlots) {
      state.consumables.push({ kind:'tarot', def: G.randomTarot() });
      showPopup('Purple Seal → Tarot', '#a855f7', 16);
      renderConsumables();
    }
  }

  if (getBoss()?.type !== 'disable_jokers') {
    for (const j of state.jokers) {
      if (j.type === 'discard_mult') {
        state.pendingDiscardMult += discardCount * j.value;
        showPopup(`+${discardCount * j.value} Mult next hand`, '#c05621', 18);
      }
    }
  }

  renderHand(); renderStats();
}

function flash(sel, val) {
  const el = $(sel); if (!el) return;
  el.textContent = val;
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}
function syncScoreSidebar(chips, mult) {
  if ($('#chipsVal')) $('#chipsVal').textContent = chips;
  if ($('#multVal'))  $('#multVal').textContent = mult;
}
function setScorePhase(text) {
  const el = $('#scorePhase');
  if (!el) return;
  el.textContent = text || '';
  el.classList.toggle('active', !!text);
}
function highlightJoker(idx, on) {
  const row = $('#jokerRow');
  if (!row) return;
  const cards = row.querySelectorAll('.joker-card-img');
  cards.forEach((el, i) => el.classList.toggle('joker-scoring', on && i === idx));
}
function showPopup(text, color, size=28) {
  const el = $('#scorePopup'); if (!el) return;
  el.textContent = text; el.style.color = color; el.style.fontSize = size + 'px';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

// ============ Joker 效果引擎 ============
async function applyJoker(j, ctx) {
  let { chips, mult, scoringCards, handId, playedCards, allSameColor, mixedColors } = ctx;
  const showMult = (v) => { mult = round1(v); flash('#htMult', mult); showPopup(`+${v - ctx.mult} Mult`, '#ef4444'); sfx('mult_score'); };
  const showChips = (v) => { chips = v; flash('#htChips', chips); showPopup(`+${v - ctx.chips} Chips`, '#5aafe8'); sfx('chip_score'); };
  const showXMult = (factor) => { mult = round1(mult * factor); flash('#htMult', mult); showPopup(`×${factor} Mult`, '#a855f7'); sfx('mult_score'); };

  switch (j.type) {
    case 'flat_mult': {
      mult += j.value; flash('#htMult', round1(mult));
      showPopup(`+${j.value} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); break;
    }
    case 'per_suit_mult': {
      const n = scoringCards.filter(c => effectiveSuit(c) === j.suit || isWildCard(c)).length;
      if (n) { mult += n * j.value; flash('#htMult', mult);
        showPopup(`+${n * j.value} Mult`, '#ef4444'); sfx('mult_score'); await sleep(240); } break;
    }
    case 'per_suit_chips': {
      const n = scoringCards.filter(c => effectiveSuit(c) === j.suit).length;
      if (n) { chips += n * j.value; flash('#htChips', chips);
        showPopup(`+${n * j.value} Chips`, '#5aafe8'); sfx('chip_score'); await sleep(220); } break;
    }
    case 'money_per_suit': {
      const n = scoringCards.filter(c => effectiveSuit(c) === j.suit).length;
      if (n) { state.money += n * j.value; renderStats();
        showPopup(`+$${n * j.value}`, '#fbbf24'); sfx('coin'); await sleep(220); } break;
    }
    case 'per_rank_chips': {
      const n = scoringCards.filter(c => c.rank === j.rank).length;
      if (n) { chips += n * j.value; flash('#htChips', chips);
        showPopup(`+${n * j.value} Chips`, '#5aafe8'); sfx('chip_score'); await sleep(220); } break;
    }
    case 'on_hand_mult': {
      if (handId === j.hand) { mult += j.value; flash('#htMult', mult);
        showPopup(`+${j.value} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); } break;
    }
    case 'on_hand_chips': {
      if (handId === j.hand) { chips += j.value; flash('#htChips', chips);
        showPopup(`+${j.value} Chips`, '#5aafe8'); sfx('chip_score'); await sleep(220); } break;
    }
    case 'cond_le_3': {
      if (playedCards.length <= 3) { mult += j.value; flash('#htMult', mult);
        showPopup(`+${j.value} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); } break;
    }
    case 'cond_per_discard': {
      const n = state.discardsLeft;
      if (n) { chips += n * j.value; flash('#htChips', chips);
        showPopup(`+${n*j.value} Chips`, '#5aafe8'); sfx('chip_score'); await sleep(220); } break;
    }
    case 'cond_no_discard': {
      if (state.discardsLeft === 0) { mult += j.value; flash('#htMult', mult);
        showPopup(`+${j.value} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); } break;
    }
    case 'per_card_chips': {
      const n = scoringCards.length;
      if (n) { chips += n * j.value; flash('#htChips', chips);
        showPopup(`+${n*j.value} Chips`, '#5aafe8'); sfx('chip_score'); await sleep(220); } break;
    }
    case 'per_face_chips': {
      const n = scoringCards.filter(c => FACE_RANKS.has(c.rank)).length;
      if (n) { chips += n * j.value; flash('#htChips', chips);
        showPopup(`+${n*j.value} Chips`, '#5aafe8'); sfx('chip_score'); await sleep(220); } break;
    }
    case 'per_money_mult': {
      const add = Math.min(j.cap || 999, state.money * j.value);
      if (add > 0) { mult += add; flash('#htMult', mult);
        showPopup(`+${add} Mult`, '#fbbf24'); sfx('mult_score'); await sleep(220); } break;
    }
    case 'random_mult': {
      const add = randInt(j.min, j.max);
      if (add > 0) { mult += add; flash('#htMult', mult);
        showPopup(`+${add} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); } break;
    }
    case 'escalating_mult': {
      j._stack = (j._stack || 0) + j.value;
      mult += j._stack; flash('#htMult', mult);
      showPopup(`+${j._stack} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); break;
    }
    case 'x_mult': {
      mult = round1(mult * j.value); flash('#htMult', mult);
      showPopup(`×${j.value} Mult`, '#a855f7'); sfx('mult_score'); await sleep(280); break;
    }
    case 'escalating_x': {
      const n = scoringCards.filter(c => effectiveSuit(c) === j.suit).length;
      if (n) j._xstack = (j._xstack || 1) + j.value * n;
      const factor = j._xstack || 1;
      if (factor !== 1) { mult = round1(mult * factor); flash('#htMult', mult);
        showPopup(`×${factor.toFixed(1)} Mult`, '#a855f7'); sfx('mult_score'); await sleep(280); } break;
    }
    case 'cond_same_color_x': {
      if (allSameColor) { mult = round1(mult * j.value); flash('#htMult', mult);
        showPopup(`×${j.value} Mult`, '#a855f7'); sfx('mult_score'); await sleep(280); } break;
    }
    case 'cond_mixed_color_x': {
      if (mixedColors) { mult = round1(mult * j.value); flash('#htMult', mult);
        showPopup(`×${j.value} Mult`, '#a855f7'); sfx('mult_score'); await sleep(280); } break;
    }
    case 'chance_x_mult': {
      if (Math.random() < (j.chance || 0.25)) {
        mult = round1(mult * j.value); flash('#htMult', mult);
        showPopup(`×${j.value} Lucky!`, '#ecc94b'); sfx('mult_score'); await sleep(280);
      } break;
    }
    case 'pair_to_three':
    case 'retrigger_first':
    case 'discard_mult':
    case 'round_money':
      break;
    case 'passive_extra_hand':    break; // 在 setupBlind 应用
    case 'money_per_rank': {
      const n = scoringCards.filter(c => c.rank === j.rank).length;
      if (n) { state.money += n * j.value; renderStats();
        showPopup(`+$${n*j.value}`, '#fbbf24'); sfx('coin'); await sleep(220); } break;
    }
    case 'mult_from_deck': {
      const add = round1(state.deck.length * j.value);
      if (add > 0) { mult += add; flash('#htMult', mult);
        showPopup(`+${add} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); } break;
    }
    case 'cond_no_discard_used': {
      if (state.discardsUsedThisRound === 0) { mult += j.value; flash('#htMult', mult);
        showPopup(`+${j.value} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); } break;
    }
    case 'x_mult_limited': {
      if (j._uses == null) j._uses = j.uses;
      if (j._uses > 0) {
        mult = round1(mult * j.value); flash('#htMult', mult);
        showPopup(`×${j.value} Mult (${j._uses-1})`, '#a855f7'); sfx('mult_score');
        j._uses -= 1;
        if (j._uses === 0) {
          await sleep(280);
          const idx = state.jokers.indexOf(j);
          if (idx >= 0) { state.jokers.splice(idx, 1); renderJokers(); }
        }
        await sleep(280);
      } break;
    }
  }
  return { chips, mult };
}

// ============ 回合结束 ============
function showCashOut() {
  sfx('win');
  const tpl = G.blindTemplate.find(b => b.id === state.blind);
  let blindReward = tpl?.reward || 0;
  if (hasStakeMod('no_small_reward') && state.blind === 'small') blindReward = 0;
  const handsBonus = state.handsLeft * state.unusedHandBonus;
  const interest = state.noInterest ? 0
    : Math.min(getInterestCap(), Math.floor(state.money / 5) * G.economy.interest_per_5);
  const goldBonus = state.hand.filter(c => normalizeEnh(c.enh) === 'e_gold').length * 3;
  let investmentBonus = 0;
  if (state.tagInvestment && state.blind === 'boss') {
    investmentBonus = 25;
    state.tagInvestment = false;
  }
  for (const c of state.hand) {
    if (c._seal === 's_blue' && state.consumables.length < state.consumableSlots) {
      const pl = G.randomPlanet();
      state.consumables.push({ kind:'planet', def: pl });
    }
  }
  const total = blindReward + handsBonus + interest + goldBonus + investmentBonus;
  state._pendingPayout = total;

  $('#resultTitle').textContent = `${tpl.name} Defeated!`;
  $('#resultScore').textContent = state.roundScore;

  const sub = $('#resultSub');
  sub.innerHTML = `
    <div class="payout-row"><span>${tpl.name} Reward</span><span>${'$'.repeat(blindReward)}</span></div>
    <div class="payout-row"><span>Hands Left ($${state.unusedHandBonus} ea)</span><span>${handsBonus ? '$'.repeat(handsBonus) : '—'}</span></div>
    <div class="payout-row"><span>Interest ($1/$5, max $${getInterestCap()})</span><span>${interest ? '$'.repeat(interest) : '—'}</span></div>
    ${goldBonus ? `<div class="payout-row"><span>Gold Cards</span><span>${'$'.repeat(goldBonus)}</span></div>` : ''}
    ${investmentBonus ? `<div class="payout-row"><span>Investment Tag</span><span>$${investmentBonus}</span></div>` : ''}
    <div class="payout-total">Total: <span class="dollar">$${total}</span></div>
  `;
  $('#toShopBtn').textContent = 'Cash Out';
  $('#resultModal').classList.remove('hidden');
}

function showRoundFail() {
  const tpl = G.blindTemplate.find(b => b.id === state.blind);
  const boss = getBoss();
  const defeatedBy = state.blind === 'boss' && boss
    ? boss.name
    : (tpl?.name || 'Blind');
  state.runStats.defeatedBy = defeatedBy;
  state.runStats.runRound = getCurrentRound();
  if (window.GameOver?.show) {
    GameOver.show(false);
    return;
  }
  sfx('lose');
  $('#resultTitle').textContent = 'Defeated.';
  $('#resultScore').textContent = state.roundScore;
  $('#resultSub').innerHTML = `Reached Ante ${state.ante}`;
  $('#toShopBtn').textContent = 'Restart';
  $('#resultModal').classList.remove('hidden');
}

function goToShop() {
  chargeRentalJokers();
  tickPerishableJokers();
  state.money += state._pendingPayout || 0;
  state._pendingPayout = 0;
  for (const j of state.jokers) {
    if (j.type === 'round_money') state.money += j.value;
  }
  onBlindWon();
  sfx('coin');
  $('#resultModal').classList.add('hidden');
  if (state.ante > 8) {
    Save?.clear?.();
    showVictory();
    return;
  }
  consumeTagsForShop();
  applyTagEnterShop();
  rollShop();
  switchScene('shop');
  renderShop();
  $('#shopMoney').textContent = `$${state.money}`;
  $('#shopRoundScore').textContent = state.roundScore;
  window.updateShopCasinoBadge?.();
  if (state._tagPendingPacks?.length) {
    setTimeout(() => openPack(state._tagPendingPacks.shift()), 400);
  }
}

// ============ 商店 ============
function rollShop() {
  const n = state.shopJokerSlots || 2;
  state.shopJokers = G.rollShopJokers(n, state.jokers.map(j => j.id));
  for (const j of state.shopJokers) {
    if (!j._edition) {
      const ed = rollEditionForShop();
      if (ed) j._edition = ed;
    }
    rollStakeSticker(j);
  }
  state.shopPacks = G.rollShopPacks(2);
  const vouchers = eligibleVouchers();
  state.shopVoucher = vouchers.length ? pick(vouchers) : null;
  state.shopVouchers = state.shopVoucher ? [state.shopVoucher] : [];
  state.shopBought.clear();
  window.resetCasinoForShop?.();
}

function consumeTagsForShop() {
  const pending = [...state.tagQueue, ...state.tags];
  state.tags = [];
  state.tagQueue = [];
  for (const tag of pending) applyTagEffect(tag);
}

function applyTagEffect(tag) {
  if (!tag) return;
  switch (tag.type) {
    case 'force_rarity': {
      const j = { ...G.randomJoker(tag.value) };
      const ed = rollEditionForShop();
      if (ed) j._edition = ed;
      rollStakeSticker(j);
      state._tagBonusJoker = j;
      break;
    }
    case 'force_edition':
      state._tagForceEdition = tag.value;
      break;
    case 'extra_voucher': {
      const pool = eligibleVouchers().filter(v => v.id !== state.shopVoucher?.id);
      if (pool.length) state._tagExtraVoucher = pick(pool);
      break;
    }
    case 'money_on_boss':
      state.tagInvestment = true;
      break;
    case 'double_next': {
      const next = G.randomTag();
      state.tagQueue.push(next);
      break;
    }
    case 'extra_hand_perm':
      state.handsMax += tag.value || 1;
      state.handsLeft += tag.value || 1;
      break;
    case 'money_on_shop':
      state._tagShopMoney = (state._tagShopMoney || 0) + (tag.value || 10);
      break;
    case 'planet_most_played':
      state._tagOrbitalPlanet = true;
      break;
    case 'free_tarot':
      state._tagFreeTarot = true;
      break;
    case 'free_spectral':
      state._tagFreeSpectral = true;
      break;
    case 'free_planets': {
      state._tagFreePlanets = (state._tagFreePlanets || 0) + (tag.value || 2);
      break;
    }
    case 'voucher_discount':
      state.tagVoucherDiscount = tag.value || 0.5;
      break;
    case 'free_pack': {
      const kind = tag.packKind === 'random' ? null : tag.packKind;
      const tier = tag.packTier || 'mega';
      let pack = kind
        ? G.getPackByKindTier(kind, tier)
        : G.randomMegaPack();
      if (pack) {
        state._tagPendingPacks = state._tagPendingPacks || [];
        state._tagPendingPacks.push({ ...pack });
      }
      break;
    }
    case 'boss_reroll':
      state._tagBossReroll = true;
      break;
    case 'bonus_skip':
      state._tagBonusSkip = true;
      break;
  }
}

function destroyRandomDeckCards(n) {
  let left = n || 2;
  while (left > 0 && state.baseDeck.length > 8) {
    const idx = Math.floor(gameRand() * state.baseDeck.length);
    const [rem] = state.baseDeck.splice(idx, 1);
    const match = c => c.rank === rem.rank && c.suit === rem.suit;
    state.deck = state.deck.filter(c => !match(c));
    state.hand = state.hand.filter(c => !match(c));
    left--;
  }
}

function applyTagImmediate(tag) {
  if (!tag) return;
  switch (tag.type) {
    case 'destroy_deck':
      destroyRandomDeckCards(tag.value || 2);
      showPopup(`-${tag.value || 2} cards`, '#888', 18);
      break;
    case 'top_up_money': {
      const floor = tag.value || 5;
      const before = state.money;
      state.money = Math.max(state.money, floor);
      if (state.money > before) showPopup(`Top up +$${state.money - before}`, '#fbbf24', 18);
      renderStats();
      break;
    }
  }
}

function applyTagEnterShop() {
  if (state._tagShopMoney) {
    state.money += state._tagShopMoney;
    showPopup(`+$${state._tagShopMoney} Tag`, '#fbbf24', 20);
    state._tagShopMoney = 0;
  }
  if (state._tagOrbitalPlanet) {
    const topHand = Object.entries(state.handPlayCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const pl = topHand
      ? G.planets.find(p => p.hand === topHand) || G.randomPlanet()
      : G.randomPlanet();
    if (state.consumables.length < state.consumableSlots) {
      state.consumables.push({ kind:'planet', def: { ...pl } });
    }
    state._tagOrbitalPlanet = false;
  }
  if (state._tagFreeTarot && state.consumables.length < state.consumableSlots) {
    state.consumables.push({ kind:'tarot', def: G.randomTarot() });
    state._tagFreeTarot = false;
  }
  if (state._tagFreeSpectral && state.consumables.length < state.consumableSlots) {
    state.consumables.push({ kind:'spectral', def: G.randomSpectral() });
    state._tagFreeSpectral = false;
  }
  const nPlanets = state._tagFreePlanets || 0;
  if (nPlanets) {
    for (let i = 0; i < nPlanets && state.consumables.length < state.consumableSlots; i++) {
      state.consumables.push({ kind:'planet', def: G.randomPlanet() });
    }
    state._tagFreePlanets = 0;
  }
}

function gainTag(tagDef) {
  const tag = { ...tagDef };
  if (tag.type === 'double_next') {
    applyTagEffect(tag);
    const next = G.randomTag();
    showTagPopup(next);
    applyTagEffect(next);
    applyTagImmediate(next);
  } else {
    state.tags.push(tag);
    showTagPopup(tag);
    applyTagImmediate(tag);
  }
  renderTagBar();
}

function showTagPopup(tag) {
  showPopup(`TAG: ${tag.name}`, '#34d399', 22);
}

function renderTagBar() {
  const all = [...state.tags, ...state.tagQueue];
  const html = all.length
    ? all.map(t => `<span class="tag-chip" title="${t.desc}">${t.name}</span>`).join('')
    : '';
  for (const id of ['tagBar', 'tagBarGame', 'tagBarShop']) {
    const bar = $(`#${id}`);
    if (!bar) continue;
    if (!all.length) { bar.classList.add('hidden'); bar.innerHTML = ''; }
    else { bar.classList.remove('hidden'); bar.innerHTML = html; }
  }
}

function showDeckViewer() {
  const grid = $('#deckGrid');
  const modal = $('#deckModal');
  if (!grid || !modal) return;
  $('#deckModalCount').textContent = state.baseDeck.length;
  grid.innerHTML = '';
  const sorted = [...state.baseDeck].sort((a, b) =>
    RANK_ORDER[b.rank] - RANK_ORDER[a.rank] || a.suit.localeCompare(b.suit));
  for (const card of sorted) {
    const el = document.createElement('div');
    el.className = `card ${card.color}`;
    if (card.enh) el.classList.add(`enh-${normalizeEnh(card.enh)}`);
    el.innerHTML = `
      <div class="rank-tl">${isStoneCard(card) ? '■' : card.rank}</div>
      <div class="suit-tl">${isStoneCard(card) ? '' : card.suit}</div>
      ${card.enh ? `<div class="enh-tag">${enhLabel(normalizeEnh(card.enh))}</div>` : ''}`;
    grid.appendChild(el);
  }
  modal.classList.remove('hidden');
}

function finishTagShopBonuses() {
  if (state._tagBonusJoker) {
    state.shopJokers.unshift(state._tagBonusJoker);
    state._tagBonusJoker = null;
  }
  if (state._tagForceEdition) {
    for (let i = 0; i < state.shopJokers.length; i++) {
      if (!state.shopBought.has('j' + i)) {
        state.shopJokers[i]._edition = state._tagForceEdition;
        break;
      }
    }
    state._tagForceEdition = null;
  }
  if (state._tagExtraVoucher) {
    state.shopVouchers.push(state._tagExtraVoucher);
    state._tagExtraVoucher = null;
  }
}

function renderShop() {
  finishTagShopBonuses();
  const items = $('#shopItems');
  if (!items) return;
  items.innerHTML = '';

  state.shopJokers.forEach((j, idx) => {
    if (state.shopBought.has('j'+idx)) return;
    const price = j._sticker === 'rental' ? 1 : finalShopCharge(j.price);
    const sticker = j._sticker
      ? `<div class="joker-sticker joker-sticker-${j._sticker}">${j._sticker}</div>` : '';
    const wrap = document.createElement('div');
    wrap.className = 'shop-item';
    wrap.innerHTML = `
      <div class="price-tag">$${price}</div>
      <div class="joker-card-img shop-joker">${sticker}${jokerCardHTML(j)}</div>
    `;
    wrap.querySelector('.joker-card-img').addEventListener('click', () => buyJoker(j, idx, wrap, price));
    items.appendChild(wrap);
  });

  const vSlot = $('#voucherSlot');
  vSlot.innerHTML = '';
  (state.shopVouchers.length ? state.shopVouchers : [state.shopVoucher]).filter(Boolean).forEach((v, vi) => {
    if (!v || state.ownedVouchers.has(v.id)) return;
    let vPrice = finalShopCharge(v.price);
    if (state.tagVoucherDiscount) {
      vPrice = Math.max(1, Math.floor(vPrice * (1 - state.tagVoucherDiscount)));
    }
    const wrap = document.createElement('div');
    wrap.className = 'shop-item';
    wrap.innerHTML = `
      <div class="price-tag">${state.tagVoucherDiscount ? `<s>$${shopPrice(v.price)}</s> ` : ''}$${vPrice}</div>
      <div class="joker-card-img voucher-card-img" data-vi="${vi}">
        ${window.CardArt ? CardArt.voucher(v) : `<div class="voucher-card">${v.name}<div class="voucher-desc">${v.desc}</div></div>`}
      </div>`;
    wrap.querySelector('.voucher-card, .voucher-card-img')?.addEventListener('click', () => buyVoucher(v, vi, vPrice));
    vSlot.appendChild(wrap);
  });

  // 卡包
  const boosters = $('#boosters');
  boosters.innerHTML = '';
  state.shopPacks.forEach((p, idx) => {
    if (state.shopBought.has('p'+idx)) return;
    const pPrice = finalShopCharge(p.price);
    const clsMap = { joker:'buffoon', card:'standard', planet:'celestial', tarot:'arcana', spectral:'spectral' };
    const cls = clsMap[p.kind] || 'arcana';
    const mega = p.tier === 'mega';
    const wrap = document.createElement('div');
    wrap.className = 'shop-item';
    wrap.innerHTML = `
      <div class="price-tag">$${pPrice}</div>
      <div class="booster-pack ${cls}${mega ? ' mega' : ''}">${p.name.replace(/·/g,'<br>')}</div>
    `;
    wrap.querySelector('.booster-pack').addEventListener('click', () => buyPack(p, idx, wrap, pPrice));
    boosters.appendChild(wrap);
  });

  document.querySelectorAll('.shop-action-btn').forEach(btn => {
    btn.onclick = () => {
      sfx('btn_click');
      const act = btn.dataset.shopAction;
      if (act === 'casino') {
        window.Casino?.open?.();
        return;
      }
      if (act === 'next' || btn.textContent.includes('Next')) showBlindSelect();
      else if (act === 'reroll') doReroll();
    };
  });
  window.updateShopCasinoBadge?.();
  document.querySelectorAll('.reroll-cost').forEach(el => el.textContent = `$${shopPrice(state.reroll)}`);
  renderConsumables();
  renderTagBar();
}

function doReroll() {
  const cost = finalShopCharge(state.reroll);
  if (state.money < cost) return;
  state.money -= cost;
  state.reroll += G.economy.reroll_increment;
  state.runStats.rerolls += 1;
  rollShop();
  $('#shopMoney').textContent = `$${state.money}`;
  renderShop();
}

function buyJoker(j, idx, wrap, price) {
  price = price ?? (j._sticker === 'rental' ? 1 : finalShopCharge(j.price));
  if (state.money < price || !canAddJoker()) return;
  state.money -= price;
  state.runStats.cardsPurchased += 1;
  const copy = { ...j };
  if (copy._sticker === 'perishable' && copy._perishLeft == null) copy._perishLeft = 5;
  state.jokers.push(copy);
  state.shopBought.add('j'+idx);
  sfx('buy');
  $('#shopMoney').textContent = `$${state.money}`;
  wrap.remove();
  renderJokers();
}

function buyVoucher(v, vi, price) {
  if (!v || state.ownedVouchers.has(v.id)) return;
  price = price ?? finalShopCharge(v.price);
  if (state.tagVoucherDiscount) {
    price = Math.max(1, Math.floor(price * (1 - state.tagVoucherDiscount)));
    state.tagVoucherDiscount = 0;
  }
  if (state.money < price) return;
  state.money -= price;
  state.ownedVouchers.add(v.id);
  applyVoucher(v);
  if (vi === 0) state.shopVoucher = null;
  state.shopVouchers = state.shopVouchers.filter(x => x.id !== v.id);
  sfx('buy');
  $('#shopMoney').textContent = `$${state.money}`;
  renderShop();
}

function applyVoucher(v) {
  switch (v.type) {
    case 'shop_slots':
      state.shopJokerSlots += v.value || 1;
      break;
    case 'shop_discount':
      state.shopDiscount = Math.min(0.75, state.shopDiscount + (v.value || 0));
      break;
    case 'edition_rate':
      state.editionRateMult *= v.value || 2;
      break;
    case 'interest_cap':
      state.interestCapBonus += v.value || 0;
      break;
    case 'guarantee_planet_pack':
      state.hasTelescope = true;
      break;
    case 'planet_x_mult':
      state.hasObservatory = true;
      break;
    case 'extra_joker_slot':
      state.jokerSlots += v.value;
      renderJokers();
      break;
    case 'consumable_slot':
      state.consumableSlots += v.value;
      renderConsumables();
      break;
    case 'extra_hands_perm':
      state.handsMax += v.value;
      state.handsLeft += v.value;
      renderStats();
      break;
    case 'extra_discards_perm':
      state.discardsMax += v.value;
      state.discardsLeft += v.value;
      renderStats();
      break;
    case 'reroll_discount':
      state.rerollDiscountPerm = (state.rerollDiscountPerm || 0) + (v.value || 0);
      state.reroll = Math.max(0, state.reroll - (v.value || 0));
      break;
  }
}

function sellJoker(idx) {
  const j = state.jokers[idx]; if (!j) return;
  if (j._sticker === 'eternal') { sfx('lose'); return; }
  state.money += sellPriceOf(j);
  state.jokers.splice(idx, 1);
  sfx('sell'); renderJokers(); renderStats();
}

function sellConsumable(idx) {
  const c = state.consumables[idx]; if (!c) return;
  state.money += Math.max(1, Math.floor((c.def.price||3)/2));
  state.consumables.splice(idx, 1);
  sfx('sell'); renderConsumables(); renderStats();
}

// ============ 补充包 ============
function buyPack(p, idx, wrap, price) {
  price = price ?? finalShopCharge(p.price);
  if (state.money < price) return;
  state.money -= price;
  state.shopBought.add('p'+idx);
  sfx('buy');
  $('#shopMoney').textContent = `$${state.money}`;
  wrap.remove();
  openPack(p);
}

function openPack(p) {
  const cards = [];
  for (let i = 0; i < p.size; i++) cards.push(rollPackItem(p.kind));
  if (p.kind === 'planet' && state.hasTelescope) {
    const topHand = Object.entries(state.handPlayCounts).sort((a,b)=>b[1]-a[1])[0]?.[0];
    if (topHand) {
      const match = G.planets.find(pl => pl.hand === topHand);
      if (match && !cards.some(c => c.def?.id === match.id)) {
        cards[0] = { kind:'planet', def: match };
      }
    }
  }
  showPackModal(p, cards);
}

function rollPackItem(kind) {
  if (kind === 'tarot')    return { kind:'tarot',    def: G.randomTarot() };
  if (kind === 'planet')   return { kind:'planet',   def: G.randomPlanet() };
  if (kind === 'spectral') return { kind:'spectral', def: G.randomSpectral() };
  if (kind === 'joker')    return { kind:'joker',    def: G.randomJoker() };
  // card: random rank+suit, 25% 几率带强化
  const r = pick(RANKS), s = pick(SUITS);
  const enh = Math.random() < 0.25 ? pick(G.enhancements).id : null;
  return { kind:'card', def:{ rank:r, suit:s, color:SUIT_COLORS[s], enh, name: `${r}${s}${enh?'·强化':''}` , desc: enh ? `带强化: ${G.getEnhance(enh).desc}` : '普通扑克牌' } };
}

function showPackModal(pack, items) {
  const modal = $('#packModal');
  $('#packTitle').textContent = pack.name;
  $('#packSub').textContent = `挑选 ${pack.pick} 张`;
  const list = $('#packCards');
  list.innerHTML = '';
  let picked = 0;
  items.forEach((it, i) => {
    const el = document.createElement('div');
    el.className = 'pack-card';
    el.innerHTML = packCardHTML(it);
    el.addEventListener('click', () => {
      if (el.classList.contains('taken') || picked >= pack.pick) return;
      if (!acquireItem(it)) { sfx('lose'); return; }
      el.classList.add('taken');
      picked += 1;
      sfx('buy');
      if (picked >= pack.pick) setTimeout(closePack, 500);
    });
    list.appendChild(el);
  });
  modal.classList.remove('hidden');
  $('#packSkip').onclick = closePack;
}

function packCardHTML(it) {
  if (it.kind === 'joker') {
    return `<div class="joker-card-img" style="width:90px;height:120px">${jokerCardHTML(it.def)}</div>`;
  }
  if (it.kind === 'card') {
    const c = it.def;
    const colorClass = c.color === 'red' ? 'red' : 'black';
    return `
      <div class="card ${colorClass}" style="width:80px;height:112px;${c.enh?`outline:2px solid ${G.getEnhance(c.enh).color}`:''}">
        <div class="rank-tl">${c.rank}</div>
        <div class="suit-tl">${c.suit}</div>
        <div class="suit-center">${c.suit}</div>
        <div class="rank-br">${c.rank}</div>
        <div class="suit-br">${c.suit}</div>
        ${c.enh ? `<div class="enh-tag">${enhLabel(c.enh)}</div>` : ''}
      </div>`;
  }
  if (it.kind === 'tarot' || it.kind === 'planet') {
    return `<div class="joker-card-img consumable-card" style="width:90px;height:138px">${consumableCardHTML({ kind: it.kind, def: it.def })}</div>`;
  }
  return `<div class="joker-card-img" style="width:90px;height:138px">${jokerCardHTML(it.def)}</div>`;
}

function acquireItem(it) {
  if (it.kind === 'joker') {
    if (!canAddJoker()) return false;
    const j = { ...it.def };
    if (!j._edition) {
      const ed = rollEditionForShop();
      if (ed) j._edition = ed;
    }
    state.jokers.push(j);
    renderJokers();
    return true;
  }
  if (it.kind === 'card') {
    state.baseDeck.push({ rank: it.def.rank, suit: it.def.suit, color: it.def.color, enh: it.def.enh });
    return true;
  }
  // tarot / planet
  if (state.consumables.length >= state.consumableSlots) return false;
  state.consumables.push({ kind: it.kind, def: it.def });
  renderConsumables();
  return true;
}

function closePack() {
  $('#packModal').classList.add('hidden');
  if (state._tagPendingPacks?.length) {
    setTimeout(() => openPack(state._tagPendingPacks.shift()), 300);
    return;
  }
  renderShop();
}

// ============ 使用消耗品 ============
function useConsumable(idx) {
  const c = state.consumables[idx]; if (!c) return;
  const ok = c.kind === 'planet' ? usePlanet(c.def) : useTarot(c.def);
  if (!ok) { sfx('lose'); return; }
  if (c.kind === 'planet') state.lastUsedPlanet = c.def.id;
  else state.lastUsedTarot = c.def.id;
  state.consumables.splice(idx, 1);
  sfx('buy');
  renderConsumables(); renderHand(); renderStats();
}

function usePlanet(def) {
  levelUpHandFromPlanet(def);
  showPopup(`${def.name} ★`, '#60a5fa', 30);
  return true;
}

function useTarot(def) {
  const sel = getSelectedCards();
  const needTarget = def.target && def.target !== 'none';
  if (needTarget) {
    const need = Number(def.target);
    if (sel.length !== need) return false;
  }
  switch (def.type) {
    case 'enhance': {
      sel.forEach(c => { c.enh = normalizeEnh(def.enh); syncBaseDeckEnh(c); });
      break;
    }
    case 'rank_up': {
      sel.forEach(c => {
        const idx = RANKS.indexOf(c.rank);
        if (idx >= 0 && idx < RANKS.length - 1) { c.rank = RANKS[idx + 1]; syncBaseDeckRank(c); }
      });
      break;
    }
    case 'destroy': {
      sel.forEach(c => {
        const i = state.baseDeck.findIndex(bc => bc.rank===c.rank && bc.suit===c.suit && bc.enh===c.enh);
        if (i >= 0) state.baseDeck.splice(i, 1);
      });
      state.hand = state.hand.filter(c => !sel.includes(c));
      state.selected.clear();
      drawTo();
      break;
    }
    case 'convert_suit': {
      sel.forEach(c => { c.suit = def.suit; c.color = SUIT_COLORS[def.suit]; syncBaseDeckSuit(c); });
      break;
    }
    case 'convert_left_to_right': {
      const [a, b] = sel; if (!a || !b) return false;
      a.rank = b.rank; a.suit = b.suit; a.color = b.color; a.enh = b.enh;
      syncBaseDeckFull(a);
      break;
    }
    case 'create_planet': {
      const n = def.count || 1;
      for (let i = 0; i < n && state.consumables.length < state.consumableSlots; i++) {
        state.consumables.push({ kind:'planet', def: G.randomPlanet() });
      }
      break;
    }
    case 'create_tarot': {
      const n = def.count || 1;
      for (let i = 0; i < n && state.consumables.length < state.consumableSlots; i++) {
        state.consumables.push({ kind:'tarot', def: G.randomTarot() });
      }
      break;
    }
    case 'create_joker': {
      if (!canAddJoker()) return false;
      const j = { ...G.randomJoker() };
      const ed = rollEditionForShop();
      if (ed) j._edition = ed;
      state.jokers.push(j);
      renderJokers();
      break;
    }
    case 'money_double_cap': {
      const add = Math.min(def.cap || 20, state.money);
      state.money += add;
      break;
    }
    case 'sum_joker_sell': {
      const sum = state.jokers.reduce((s, j) => s + sellPriceOf(j), 0);
      state.money += Math.min(def.cap || 50, sum);
      break;
    }
    case 'spawn_last_used': {
      if (state.consumables.length >= state.consumableSlots) return false;
      if (state.lastUsedPlanet) state.consumables.push({ kind:'planet', def: G.getPlanet(state.lastUsedPlanet) });
      else if (state.lastUsedTarot) state.consumables.push({ kind:'tarot', def: G.getTarot(state.lastUsedTarot) });
      else return false;
      break;
    }
    case 'random_edition_joker': {
      if (state.jokers.length && Math.random() < (def.chance || 0.25)) {
        const j = pick(state.jokers);
        j._edition = pick(G.editions.filter(e => e.id !== 'ed_base')).id;
      }
      break;
    }
    default: return false;
  }
  return true;
}

// 同步 baseDeck（让塔罗修改在新一轮也保留）
function syncBaseDeckEnh(handCard) {
  const i = state.baseDeck.findIndex(bc => bc.rank===handCard.rank && bc.suit===handCard.suit && bc.enh==null);
  if (i >= 0) state.baseDeck[i].enh = handCard.enh;
}
function syncBaseDeckRank(handCard) {
  // 简化：找一张同花色的最低牌替换为新点数
  const i = state.baseDeck.findIndex(bc => bc.suit===handCard.suit && bc.enh==handCard.enh);
  if (i >= 0) state.baseDeck[i].rank = handCard.rank;
}
function syncBaseDeckSuit(handCard) {
  const i = state.baseDeck.findIndex(bc => bc.rank===handCard.rank && bc.enh==handCard.enh);
  if (i >= 0) { state.baseDeck[i].suit = handCard.suit; state.baseDeck[i].color = handCard.color; }
}
function syncBaseDeckFull(handCard) {
  const i = state.baseDeck.findIndex(bc => bc._k === handCard._k);
  if (i >= 0) { state.baseDeck[i].rank=handCard.rank; state.baseDeck[i].suit=handCard.suit; state.baseDeck[i].color=handCard.color; state.baseDeck[i].enh=handCard.enh; }
}

// ============ Boss / Blind 流转 ============
function blindIdFromIdx(idx) {
  return ['small', 'big', 'boss'][idx] || 'small';
}

function onBlindWon() {
  if (state.blind === 'small') state.blindIdx = 1;
  else if (state.blind === 'big') {
    state.blindIdx = 2;
    state.bossId = G.pickBoss(state.ante).id;
  } else if (state.blind === 'boss') {
    state.blindIdx = 0;
    state.ante += 1;
    state.bossId = null;
  }
}

function showBlindSelect() {
  if (state.ante > 8) { showVictory(); return; }
  const blindId = blindIdFromIdx(state.blindIdx);
  if (blindId === 'boss' && !state.bossId) state.bossId = G.pickBoss(state.ante).id;
  if (blindId === 'boss' && state._tagBossReroll) {
    state.bossId = G.pickBoss(state.ante).id;
    state._tagBossReroll = false;
    showPopup('Boss rerolled!', '#ef4444', 18);
  }

  const tpl = G.blindTemplate.find(b => b.id === blindId);
  const score = G.getBlindScore(state.ante, blindId, state.stakeId);
  const boss = blindId === 'boss' ? G.getBoss(state.bossId) : null;

  $('#blindSelectTitle').textContent = tpl?.cn || tpl?.name || 'Blind';
  $('#blindSelectScore').textContent = score;
  $('#blindSelectReward').textContent = '$'.repeat(tpl?.reward || 0);
  $('#blindSelectAnte').textContent = `${state.ante} / 8`;
  $('#blindSelectDesc').textContent = boss ? `${boss.name}: ${boss.desc}` : (tpl?.cn || '');
  $('#blindSkipBtn').classList.toggle('hidden', !tpl?.skippable);

  renderTagBar();
  switchScene('blind');
}

function playSelectedBlind() {
  state.blind = blindIdFromIdx(state.blindIdx);
  setupBlind();
  switchScene('game');
  sfx('scene_in');
}

function skipSelectedBlind() {
  const blindId = blindIdFromIdx(state.blindIdx);
  const tpl = G.blindTemplate.find(b => b.id === blindId);
  if (!tpl?.skippable) return;
  gainTag({ ...G.randomTag() });
  if (state._tagBonusSkip) {
    gainTag({ ...G.randomTag() });
    state._tagBonusSkip = false;
  }
  state.blindIdx += 1;
  if (state.blindIdx === 2) state.bossId = G.pickBoss(state.ante).id;
  if (state.blindIdx >= 3) {
    state.blindIdx = 0;
    state.ante += 1;
    state.bossId = null;
  }
  if (state.ante > 8) { showVictory(); return; }
  sfx('btn_click');
  showBlindSelect();
}

function startNextBlind() {
  showBlindSelect();
}

function setupBlind() {
  state.blind = blindIdFromIdx(state.blindIdx);
  state.blindScore = G.getBlindScore(state.ante, state.blind, state.stakeId);
  state.runStats.runRound = getCurrentRound();
  state.handsLeft = state.handsMax;
  state.discardsLeft = state.discardsMax;
  state.discardsUsedThisRound = 0;
  state.handsPlayedThisRound = 0;
  state.roundScore = state.pendingBlindChips || 0;
  if (state.pendingBlindChips > 0) {
    state.pendingBlindChips = 0;
    showPopup('Casino head-start!', '#f97316', 16);
  }

  // Joker 被动：每回合 +1 出牌
  for (const j of state.jokers) if (j.type === 'passive_extra_hand') state.handsLeft += j.value;

  // Boss 减出牌/减弃牌
  const boss = getBoss();
  if (boss?.type === 'reduce_hands')    state.handsLeft    = Math.max(1, state.handsLeft - boss.value);
  if (boss?.type === 'set_hands_max')   state.handsLeft    = Math.max(1, boss.value || 1);
  if (boss?.type === 'reduce_discards') state.discardsLeft = Math.max(0, state.discardsLeft - boss.value);
  if (boss?.type === 'no_discards')     state.discardsLeft = 0;

  applyAnteProgressionHelp();

  resetDeckForBlind();
  state.hand = [];
  state.selected.clear();
  state.reroll = getRerollBase();
  state.bossRotateIdx = 0;
  state.lockedHandKey = null;
  drawTo();

  // 锁链 boss：随机锁住一张
  if (boss?.type === 'lock_random_card' && state.hand.length) {
    state.lockedHandKey = cardKey(pick(state.hand));
  }

  if (boss?.type === 'force_hand_size') {
    const lim = $('#topProgressDeck');
    if (lim) lim.textContent = `Hand ${handSizeTarget()} max · ${state.deck.length}/${state.baseDeck.length}`;
  }
  renderHand(); renderJokers(); renderConsumables(); renderStats();
}

function showVictory() {
  state.runStats.runRound = getCurrentRound();
  state.runStats.defeatedBy = state.isDailyRun ? 'Daily Victory' : 'Victory';
  if (state.isDailyRun && window.DailyRun?.markCompleted) DailyRun.markCompleted(state.seed);
  if (window.GameOver?.show) {
    GameOver.show(true);
    return;
  }
  $('#resultTitle').textContent = 'YOU WIN!';
  $('#resultScore').textContent = '★';
  $('#resultSub').innerHTML = 'Joker State — 8 Antes cleared';
  $('#toShopBtn').textContent = 'Restart';
  $('#resultModal').classList.remove('hidden');
}

// ============ 场景切换 ============
function switchScene(name) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  const el = $(`#scene-${name}`);
  if (el) el.classList.add('active');
  document.body.classList.toggle('crt-gameplay',
    name === 'game' || name === 'shop' || name === 'blind');
}

// ============ Run Info ============
function showRunInfo() {
  const box = $('#handLevelList');
  if (!box) return;
  box.innerHTML = '';
  for (const h of G.hands) {
    const st = getHandStats(h.id);
    const eff = getHandScore(h.id);
    const row = document.createElement('div');
    row.className = 'hand-level-row';
    row.innerHTML = `
      <div class="hl-name">${h.name} <span class="hl-lvl">★${eff.level}</span></div>
      <div class="hl-score">
        <span class="hl-chips">${eff.chips}</span>
        <span class="hl-x">×</span>
        <span class="hl-mult">${eff.mult}</span>
      </div>
    `;
    box.appendChild(row);
  }
  $('#runInfoModal').classList.remove('hidden');
}

// ============ 新游戏 ============
function startNewRun(config = {}) {
  const stake = G.getStake(config.stakeId || state.stakeId || 'stake_white');
  const deck = G.getDeck(config.deckId || state.deckId || 'deck_red');
  const seed = config.isSeededRun
    ? (config.seed || generateRunSeed())
    : '';

  state.stakeId = stake.id;
  state.deckId = deck.id;
  state.selectedDeckId = deck.id;
  state.isSeededRun = !!config.isSeededRun;
  state.isDailyRun = !!config.isDailyRun;
  state.seed = seed;
  setRunSeed(state.isSeededRun ? state.seed : null);

  state.baseDeck = newBaseDeck();
  state.money = G.economy.starting_money;
  state.handsMax = G.economy.hands_per_round; state.handsLeft = state.handsMax;
  state.discardsMax = G.economy.discards_per_round; state.discardsLeft = state.discardsMax;
  state.roundScore = 0;
  state.ante = 1;
  state.blindIdx = 0;
  state.blind = 'small';
  state.bossId = null;
  state.handStats = {};
  state.jokers = [ { ...G.getJoker('j_chip_stacker') } ];
  state.consumables = [];
  state.pendingDiscardMult = 0;
  state.jokerSlots = 5;
  state.consumableSlots = 2;
  state.shopJokerSlots = 2;
  state.shopDiscount = 0;
  state.editionRateMult = 1;
  state.interestCapBonus = 0;
  state.hasTelescope = false;
  state.hasObservatory = false;
  state.handPlayCounts = {};
  state.tags = [];
  state.tagQueue = [];
  state.tagInvestment = false;
  state.tagVoucherDiscount = 0;
  state._tagBossReroll = false;
  state._tagBonusSkip = false;
  state.isDailyRun = false;
  state.reroll = G.economy.reroll_initial_cost;
  state.rerollDiscountPerm = 0;
  state.shopBought.clear();
  state.ownedVouchers.clear();
  state.lastUsedTarot = null; state.lastUsedPlanet = null;
  state.casinoSpinsUsed = 0;
  state.pendingBlindChips = 0;
  state.casinoShopCredit = 0;

  applyDeckPerk(deck);
  applyStakeModifiers();
  resetRunStats('');

  showBlindSelect();
}

// ============ 标题页按钮（事件委托，避免装饰层/子元素吞点击） ============
function handleTitleAction(action) {
  switch (action) {
    case 'play':
      if (window.NewRun?.open) {
        NewRun.open();
      } else {
        if (window.Save) Save.clear();
        startNewRun();
      }
      break;
    case 'continue':
      if (window.Save?.resume) {
        if (!Save.resume()) return;
      } else if (!Save.restore()) {
        return;
      } else if (state.ante > 8) {
        Save.clear();
        showVictory();
      } else {
        switchScene('game');
        renderHand();
        renderJokers();
        renderConsumables();
        renderStats();
        renderTagBar();
      }
      break;
    case 'options':
      window.Settings?.open();
      break;
    case 'collection':
      window.Collection?.open();
      break;
    case 'quit':
      if (window.PauseMenu?.showQuit) {
        PauseMenu.showQuit();
      } else {
        try { window.close(); } catch (e) {}
      }
      break;
  }
}

function bindTitleMenu() {
  document.addEventListener('click', (e) => {
    const scene = document.querySelector('#scene-title.active');
    if (!scene) return;
    const btn = e.target.closest('[data-action]');
    if (!btn || !scene.contains(btn)) return;
    e.preventDefault();
    e.stopPropagation();
    sfx('btn_click');
    handleTitleAction(btn.dataset.action);
  }, true);
}

// ============ 初始化 ============
function init() {
  bindTitleMenu();
  $('#btnPlay')   ?.addEventListener('click', () => { sfx('btn_click'); playHand(); });
  $('#btnDiscard')?.addEventListener('click', () => { sfx('btn_click'); discardHand(); });

  $('#sortRank')?.addEventListener('click', () => {
    sfx('btn_hover');
    state.hand.sort((a,b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
    state.selected.clear(); renderHand();
  });
  $('#sortSuit')?.addEventListener('click', () => {
    sfx('btn_hover');
    state.hand.sort((a,b) => a.suit.localeCompare(b.suit) || RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
    state.selected.clear(); renderHand();
  });

  $('#toShopBtn')?.addEventListener('click', () => {
    sfx('btn_click');
    if ($('#toShopBtn').textContent === 'Restart') {
      $('#resultModal').classList.add('hidden');
      switchScene('title');
    } else goToShop();
  });

  // Run Info：侧边栏的 Run Info 按钮（游戏/商店两处都有）
  document.querySelectorAll('.run-info').forEach(btn => {
    btn.addEventListener('click', () => { sfx('btn_click'); showRunInfo(); });
  });
  $('#runInfoClose')?.addEventListener('click', () => {
    sfx('btn_click'); $('#runInfoModal').classList.add('hidden');
  });

  document.querySelectorAll('.btn').forEach(b =>
    b.addEventListener('mouseenter', () => sfx('btn_hover'))
  );

  // 关闭遮罩点击外部
  document.querySelectorAll('.modal-overlay').forEach(m => {
    m.addEventListener('click', (e) => {
      if (e.target === m && m.id === 'runInfoModal') m.classList.add('hidden');
    });
  });

  $('#blindPlayBtn')?.addEventListener('click', () => { sfx('btn_click'); playSelectedBlind(); });
  $('#blindSkipBtn')?.addEventListener('click', () => { sfx('btn_click'); skipSelectedBlind(); });
  $('#deckModalClose')?.addEventListener('click', () => {
    sfx('btn_click'); $('#deckModal')?.classList.add('hidden');
  });
  document.querySelectorAll('.deck-pile').forEach(pile => {
    pile.addEventListener('click', () => { sfx('btn_click'); showDeckViewer(); });
  });

  document.addEventListener('keydown', (e) => {
    if ($('#scene-blind')?.classList.contains('active')) {
      if (e.code === 'Space' || e.key === 'Enter') { e.preventDefault(); playSelectedBlind(); }
      else if (e.key === 's' || e.key === 'S') skipSelectedBlind();
      return;
    }
    if (!$('#scene-game').classList.contains('active')) return;
    if (e.code === 'Space') { e.preventDefault(); playHand(); }
    else if (e.key === 'x' || e.key === 'X') discardHand();
    else if (e.key === 'd' || e.key === 'D') showDeckViewer();
    else if (e.key === 's' || e.key === 'S') {
      state.hand.sort((a,b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
      state.selected.clear(); renderHand();
    }
  });
}

init();

// 暴露给 save.js / settings.js 等
window.generateRunSeed = generateRunSeed;
window.setRunSeed = setRunSeed;
window.getMostPlayedHandLabel = getMostPlayedHandLabel;
window.startNewRun = startNewRun;
window.switchScene = switchScene;
window.renderHand = renderHand;
window.renderJokers = renderJokers;
window.renderConsumables = renderConsumables;
window.renderStats = renderStats;
window.showRunInfo = showRunInfo;
window.renderShop = renderShop;
window.rollShop = rollShop;
window.openPack = openPack;
window.startNextBlind = startNextBlind;
window.showBlindSelect = showBlindSelect;
window.playSelectedBlind = playSelectedBlind;
window.skipSelectedBlind = skipSelectedBlind;
window.showVictory = showVictory;
window.showRoundFail = showRoundFail;
window.showDeckViewer = showDeckViewer;
window.renderTagBar = renderTagBar;
