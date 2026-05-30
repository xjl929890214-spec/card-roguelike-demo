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

// 现有美术资源映射（其余 Joker 使用 CSS 占位卡面）
const JOKER_IMG = {
  j_basic:      'assets/joker_silly.png',
  j_steel_will: 'assets/joker_ghost.png',
};

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
  blindScore: 300,
  ante: 1,
  blind: 'small',                  // 'small' | 'big' | 'boss'
  bossId: null,
  bossRotateIdx: 0,
  lockedHandKey: null,             // 锁链 boss 锁住的牌 key

  reroll: G.economy.reroll_initial_cost,
  _pendingPayout: 0,

  shopJokers: [], shopVoucher: null, shopPacks: [], shopConsumables: [],
  shopBought: new Set(),
  ownedVouchers: new Set(),

  lastUsedTarot: null,
  lastUsedPlanet: null,
};

window.state = state;

// ============ 工具 ============
const $  = (s) => document.querySelector(s);
const $$ = (s) => document.querySelectorAll(s);
function sfx(n) { window.Sounds?.play(n); }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
function randInt(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function uid() { return Math.random().toString(36).slice(2, 9); }
function cardKey(c) { return c._k ||= uid(); }

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
    const j = Math.floor(Math.random()*(i+1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
function resetDeckForBlind() {
  state.deck = shuffle(state.baseDeck.map(c => ({ ...c, _k: uid() })));
}
function drawTo(n) {
  while (state.hand.length < n && state.deck.length > 0) {
    state.hand.push(state.deck.pop());
    sfx('draw');
  }
}

// ============ 牌型识别 ============
function effectiveSuit(c)  { return c.enh === 'wild' ? '*' : c.suit; }
function isStoneCard(c)    { return c.enh === 'stone'; }
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
      if (c.enh === 'wild') continue;
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
  else if (sizes[0]===4)                       { handId='four_of_a_kind';  scoringCards=groups[0]; }
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
    if (card.enh)               el.classList.add(`enh-${card.enh}`);
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

function jokerCardHTML(j) {
  const img = JOKER_IMG[j.id];
  const color = RARITY_COLOR[j.rarity] || '#5aafe8';
  const face = img
    ? `<img src="${img}" alt="${j.name}" draggable="false">`
    : `<div class="joker-fallback" style="--rc:${color}">
         <div class="jf-icon">★</div>
         <div class="jf-name">${j.name}</div>
       </div>`;
  return `
    ${face}
    <div class="joker-tooltip">
      <div class="tooltip-name">${j.name}</div>
      <div class="tooltip-eff">${j.desc}</div>
      ${j._uses != null ? `<div class="tooltip-eff">剩余次数: ${j._uses}</div>` : ''}
      <div class="tooltip-sell">右键卖出 $${sellPriceOf(j)}</div>
    </div>
  `;
}

function sellPriceOf(j) { return Math.max(1, Math.floor((j.price ?? 3) / 2)); }

function renderJokers() {
  const row = $('#jokerRow');
  if (!row) return;
  row.innerHTML = `<div class="slot-label">JOKERS <span id="jokerCount">${state.jokers.length}/${state.jokerSlots}</span></div>`;
  state.jokers.forEach((j, i) => {
    const el = document.createElement('div');
    el.className = 'joker-card-img';
    el.innerHTML = jokerCardHTML(j);
    el.addEventListener('contextmenu', (e) => { e.preventDefault(); sellJoker(i); });
    row.appendChild(el);
  });
}

function consumableCardHTML(c) {
  const isPlanet = c.kind === 'planet';
  const color = isPlanet ? '#60a5fa' : '#a855f7';
  const icon = isPlanet ? '⊕' : '★';
  return `
    <div class="consum-face" style="background: linear-gradient(180deg, ${color}30, #0a0a14); border-color: ${color};">
      <div class="consum-icon" style="color:${color}">${icon}</div>
      <div class="consum-name">${c.def.name}</div>
    </div>
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
  if (!header) return;
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
  const { handId, scoringIdx } = evalHand(playedCards);

  const cardEls = [...$('#handCards').querySelectorAll('.card')];
  playedIdxs.forEach(i => cardEls[i].classList.add('playing'));
  await sleep(350);

  const base = getHandScore(handId);
  let chips = base.chips;
  let mult  = base.mult;
  $('#handtypeName').textContent = `${base.name} ★${base.level}`;
  $('#htChips').textContent = chips; $('#htMult').textContent = mult;

  state.handsPlayedThisRound += 1;
  state.totalHandsPlayed += 1;

  const allSameColor = playedCards.every(c => c.color === playedCards[0].color);
  const scoringCards = scoringIdx.map(i => playedCards[i]);

  // 逐张计分
  for (const card of scoringCards) {
    const localIdx = playedCards.indexOf(card);
    const cardEl   = cardEls[playedIdxs[localIdx]];
    if (isCardDebuffed(card)) {
      cardEl?.classList.add('debuffed-flash');
      showPopup('DEBUFFED', '#888', 18);
      await sleep(220);
      continue;
    }
    cardEl?.classList.add('scoring');

    let cardChips = isStoneCard(card) ? 50 : RANK_CHIPS[card.rank];
    chips += cardChips;
    flash('#htChips', chips);
    showPopup(`+${cardChips}`, '#5aafe8');
    sfx('chip_score');
    await sleep(160);

    // 强化效果
    if (card.enh === 'e_bonus') {
      chips += 30; flash('#htChips', chips);
      showPopup('+30', '#60a5fa'); sfx('chip_score'); await sleep(160);
    }
    if (card.enh === 'e_mult') {
      mult += 4; flash('#htMult', mult);
      showPopup('+4 Mult', '#ef4444'); sfx('mult_score'); await sleep(160);
    }
    if (card.enh === 'e_glass') {
      mult *= 2; mult = round1(mult); flash('#htMult', mult);
      showPopup('×2 Mult', '#67e8f9'); sfx('mult_score'); await sleep(160);
      if (Math.random() < 0.25) {
        card._break = true;
        showPopup('SHATTER', '#67e8f9', 18);
      }
    }
    if (card.enh === 'e_lucky') {
      if (Math.random() < 0.2)  { mult += 20; flash('#htMult', mult); showPopup('+20 Mult', '#34d399'); await sleep(160); }
      if (Math.random() < 0.067){ state.money += 20; renderStats(); showPopup('+$20', '#fbbf24'); await sleep(160); }
    }

    cardEl?.classList.remove('scoring');
  }

  // 手牌上的"钢铁牌"也在计分时×1.5
  for (const c of state.hand) {
    if (c.enh === 'e_steel') {
      mult = round1(mult * 1.5);
      flash('#htMult', mult);
      showPopup('×1.5 Steel', '#9ca3af'); sfx('mult_score'); await sleep(180);
    }
  }

  // Joker 触发（除非 Boss 禁用）
  const bossDisable = getBoss()?.type === 'disable_jokers';
  if (!bossDisable) {
    for (const j of state.jokers) {
      const out = await applyJoker(j, { chips, mult, scoringCards, handId, playedCards, allSameColor });
      chips = out.chips; mult = out.mult;
    }
  }

  const gained = Math.floor(chips * mult);
  state.roundScore += gained;
  showPopup(`+${gained}`, '#f5c84a', 38);
  sfx('big_score');
  await sleep(700);

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
  drawTo(8);
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
  for (const i of state.selected) {
    if (isCardLocked(state.hand[i])) { sfx('lose'); return; }
  }
  sfx('discard');
  state.hand = state.hand.filter((_, i) => !state.selected.has(i));
  state.selected.clear();
  drawTo(8);
  state.discardsLeft -= 1;
  state.discardsUsedThisRound += 1;
  renderHand(); renderStats();
}

function flash(sel, val) {
  const el = $(sel); if (!el) return;
  el.textContent = val;
  el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash');
}
function showPopup(text, color, size=28) {
  const el = $('#scorePopup'); if (!el) return;
  el.textContent = text; el.style.color = color; el.style.fontSize = size + 'px';
  el.classList.remove('show'); void el.offsetWidth; el.classList.add('show');
}

// ============ Joker 效果引擎 ============
async function applyJoker(j, ctx) {
  let { chips, mult, scoringCards, handId, playedCards, allSameColor } = ctx;
  const showMult = (v) => { mult = round1(v); flash('#htMult', mult); showPopup(`+${v - ctx.mult} Mult`, '#ef4444'); sfx('mult_score'); };
  const showChips = (v) => { chips = v; flash('#htChips', chips); showPopup(`+${v - ctx.chips} Chips`, '#5aafe8'); sfx('chip_score'); };
  const showXMult = (factor) => { mult = round1(mult * factor); flash('#htMult', mult); showPopup(`×${factor} Mult`, '#a855f7'); sfx('mult_score'); };

  switch (j.type) {
    case 'flat_mult': {
      mult += j.value; flash('#htMult', round1(mult));
      showPopup(`+${j.value} Mult`, '#ef4444'); sfx('mult_score'); await sleep(220); break;
    }
    case 'per_suit_mult': {
      const n = scoringCards.filter(c => effectiveSuit(c) === j.suit || c.enh === 'wild').length;
      if (n) { mult += n * j.value; flash('#htMult', mult);
        showPopup(`+${n * j.value} Mult`, '#ef4444'); sfx('mult_score'); await sleep(240); } break;
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
  const blindReward = tpl.reward;
  const handsBonus = state.handsLeft * G.economy.money_per_unused_hand;
  const interest = Math.min(G.economy.interest_cap, Math.floor(state.money / 5) * G.economy.interest_per_5);
  // 黄金牌：手上每张回合末 +$3
  const goldBonus = state.hand.filter(c => c.enh === 'e_gold').length * 3;
  const total = blindReward + handsBonus + interest + goldBonus;
  state._pendingPayout = total;

  $('#resultTitle').textContent = `${tpl.name} Defeated!`;
  $('#resultScore').textContent = state.roundScore;

  const sub = $('#resultSub');
  sub.innerHTML = `
    <div class="payout-row"><span>${tpl.name} Reward</span><span>${'$'.repeat(blindReward)}</span></div>
    <div class="payout-row"><span>Hands Left ($1 ea)</span><span>${handsBonus ? '$'.repeat(handsBonus) : '—'}</span></div>
    <div class="payout-row"><span>Interest ($1/$5, max $${G.economy.interest_cap})</span><span>${interest ? '$'.repeat(interest) : '—'}</span></div>
    ${goldBonus ? `<div class="payout-row"><span>Gold Cards</span><span>${'$'.repeat(goldBonus)}</span></div>` : ''}
    <div class="payout-total">Total: <span class="dollar">$${total}</span></div>
  `;
  $('#toShopBtn').textContent = 'Cash Out';
  $('#resultModal').classList.remove('hidden');
}

function showRoundFail() {
  sfx('lose');
  $('#resultTitle').textContent = 'Defeated.';
  $('#resultScore').textContent = state.roundScore;
  $('#resultSub').innerHTML = `Reached Ante ${state.ante}`;
  $('#toShopBtn').textContent = 'Restart';
  $('#resultModal').classList.remove('hidden');
}

function goToShop() {
  state.money += state._pendingPayout || 0;
  state._pendingPayout = 0;
  sfx('coin');
  $('#resultModal').classList.add('hidden');
  rollShop();
  switchScene('shop');
  renderShop();
  $('#shopMoney').textContent = `$${state.money}`;
  $('#shopRoundScore').textContent = state.roundScore;
}

// ============ 商店 ============
function rollShop() {
  state.shopJokers = G.rollShopJokers(2, state.jokers.map(j => j.id));
  state.shopPacks = shuffle([...G.packs]).slice(0, 2);
  state.shopVoucher = pick(G.vouchers.filter(v => !state.ownedVouchers.has(v.id) && !v.requires));
  state.shopBought.clear();
}

function renderShop() {
  const items = $('#shopItems');
  if (!items) return;
  items.innerHTML = '';

  state.shopJokers.forEach((j, idx) => {
    if (state.shopBought.has('j'+idx)) return;
    const wrap = document.createElement('div');
    wrap.className = 'shop-item';
    wrap.innerHTML = `
      <div class="price-tag">$${j.price}</div>
      <div class="joker-card-img shop-joker">${jokerCardHTML(j)}</div>
    `;
    wrap.querySelector('.joker-card-img').addEventListener('click', () => buyJoker(j, idx, wrap));
    items.appendChild(wrap);
  });

  // 凭证
  $('#voucherSlot').innerHTML = state.shopVoucher
    ? `<div class="shop-item">
         <div class="price-tag">$${state.shopVoucher.price}</div>
         <div class="voucher-card">${state.shopVoucher.name}
           <div class="voucher-desc">${state.shopVoucher.desc}</div>
         </div>
       </div>`
    : '';
  if (state.shopVoucher) {
    $('#voucherSlot .voucher-card').addEventListener('click', () => buyVoucher());
  }

  // 卡包
  const boosters = $('#boosters');
  boosters.innerHTML = '';
  state.shopPacks.forEach((p, idx) => {
    if (state.shopBought.has('p'+idx)) return;
    const cls = p.kind === 'joker' ? 'buffoon' : p.kind === 'card' ? 'standard' : p.kind === 'planet' ? 'celestial' : 'arcana';
    const wrap = document.createElement('div');
    wrap.className = 'shop-item';
    wrap.innerHTML = `
      <div class="price-tag">$${p.price}</div>
      <div class="booster-pack ${cls}">${p.name.replace('·','<br>')}</div>
    `;
    wrap.querySelector('.booster-pack').addEventListener('click', () => buyPack(p, idx, wrap));
    boosters.appendChild(wrap);
  });

  document.querySelectorAll('.shop-action-btn').forEach(btn => {
    btn.onclick = () => {
      sfx('btn_click');
      if (btn.textContent.includes('Next')) startNextBlind();
      else doReroll();
    };
  });
  document.querySelectorAll('.reroll-cost').forEach(el => el.textContent = `$${state.reroll}`);
  renderConsumables();
}

function doReroll() {
  if (state.money < state.reroll) return;
  state.money -= state.reroll;
  state.reroll += G.economy.reroll_increment;
  rollShop();
  $('#shopMoney').textContent = `$${state.money}`;
  renderShop();
}

function buyJoker(j, idx, wrap) {
  if (state.money < j.price || state.jokers.length >= state.jokerSlots) return;
  state.money -= j.price;
  state.jokers.push({ ...j });
  state.shopBought.add('j'+idx);
  sfx('buy');
  $('#shopMoney').textContent = `$${state.money}`;
  wrap.remove();
}

function buyVoucher() {
  const v = state.shopVoucher; if (!v) return;
  if (state.money < v.price) return;
  state.money -= v.price;
  state.ownedVouchers.add(v.id);
  applyVoucher(v);
  state.shopVoucher = null;
  sfx('buy');
  $('#shopMoney').textContent = `$${state.money}`;
  renderShop();
}

function applyVoucher(v) {
  switch (v.type) {
    case 'shop_slots':           break;
    case 'extra_joker_slot':     state.jokerSlots += v.value; renderJokers(); break;
    case 'consumable_slot':      state.consumableSlots += v.value; renderConsumables(); break;
    case 'extra_hands_perm':     state.handsMax += v.value; state.handsLeft += v.value; renderStats(); break;
    case 'extra_discards_perm':  state.discardsMax += v.value; state.discardsLeft += v.value; renderStats(); break;
    case 'reroll_discount':      state.reroll = Math.max(0, state.reroll - v.value); break;
  }
}

function sellJoker(idx) {
  const j = state.jokers[idx]; if (!j) return;
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
function buyPack(p, idx, wrap) {
  if (state.money < p.price) return;
  state.money -= p.price;
  state.shopBought.add('p'+idx);
  sfx('buy');
  $('#shopMoney').textContent = `$${state.money}`;
  wrap.remove();
  openPack(p);
}

function openPack(p) {
  const cards = [];
  for (let i = 0; i < p.size; i++) cards.push(rollPackItem(p.kind));
  showPackModal(p, cards);
}

function rollPackItem(kind) {
  if (kind === 'tarot')  return { kind:'tarot',  def: G.randomTarot() };
  if (kind === 'planet') return { kind:'planet', def: G.randomPlanet() };
  if (kind === 'joker')  return { kind:'joker',  def: G.randomJoker() };
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
  // tarot / planet
  return `<div class="joker-card-img consumable-card" style="width:90px;height:120px">${consumableCardHTML({ kind: it.kind, def: it.def })}</div>`;
}

function acquireItem(it) {
  if (it.kind === 'joker') {
    if (state.jokers.length >= state.jokerSlots) return false;
    state.jokers.push({ ...it.def });
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
      sel.forEach(c => { c.enh = def.enh; syncBaseDeckEnh(c); });
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
      drawTo(8);
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
      if (state.jokers.length >= state.jokerSlots) return false;
      state.jokers.push({ ...G.randomJoker() });
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
function startNextBlind() {
  if (state.blind === 'small') state.blind = 'big';
  else if (state.blind === 'big') { state.blind = 'boss'; state.bossId = G.pickBoss(state.ante).id; }
  else {
    state.blind = 'small';
    state.ante += 1;
    if (state.ante > 8) { showVictory(); return; }
  }
  setupBlind();
  switchScene('game');
  sfx('scene_in');
}

function setupBlind() {
  state.blindScore = G.getBlindScore(state.ante, state.blind);
  state.handsLeft = state.handsMax;
  state.discardsLeft = state.discardsMax;
  state.discardsUsedThisRound = 0;
  state.handsPlayedThisRound = 0;
  state.roundScore = 0;

  // Joker 被动：每回合 +1 出牌
  for (const j of state.jokers) if (j.type === 'passive_extra_hand') state.handsLeft += j.value;

  // Boss 减出牌/减弃牌
  const boss = getBoss();
  if (boss?.type === 'reduce_hands')    state.handsLeft    = Math.max(1, state.handsLeft - boss.value);
  if (boss?.type === 'reduce_discards') state.discardsLeft = Math.max(0, state.discardsLeft - boss.value);

  resetDeckForBlind();
  state.hand = [];
  state.selected.clear();
  state.reroll = G.economy.reroll_initial_cost;
  state.bossRotateIdx = 0;
  state.lockedHandKey = null;
  drawTo(8);

  // 锁链 boss：随机锁住一张
  if (boss?.type === 'lock_random_card' && state.hand.length) {
    state.lockedHandKey = cardKey(pick(state.hand));
  }

  renderHand(); renderJokers(); renderConsumables(); renderStats();
}

function showVictory() {
  $('#resultTitle').textContent = 'YOU WIN!';
  $('#resultScore').textContent = '★';
  $('#resultSub').innerHTML = 'Beat all 8 Antes';
  $('#toShopBtn').textContent = 'Restart';
  $('#resultModal').classList.remove('hidden');
}

// ============ 场景切换 ============
function switchScene(name) {
  document.querySelectorAll('.scene').forEach(s => s.classList.remove('active'));
  $(`#scene-${name}`).classList.add('active');
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
function startNewRun() {
  state.baseDeck = newBaseDeck();
  state.money = G.economy.starting_money;
  state.handsMax = G.economy.hands_per_round; state.handsLeft = state.handsMax;
  state.discardsMax = G.economy.discards_per_round; state.discardsLeft = state.discardsMax;
  state.roundScore = 0;
  state.ante = 1; state.blind = 'small';
  state.bossId = null;
  state.handStats = {};
  state.jokers = [ { ...G.getJoker('j_basic') } ];
  state.consumables = [];
  state.jokerSlots = 5;
  state.consumableSlots = 2;
  state.reroll = G.economy.reroll_initial_cost;
  state.shopBought.clear();
  state.ownedVouchers.clear();
  state.lastUsedTarot = null; state.lastUsedPlanet = null;
  setupBlind();
  switchScene('game');
  sfx('scene_in');
}

// ============ 初始化 ============
function init() {
  document.querySelectorAll('#scene-title .btn').forEach(btn => {
    btn.addEventListener('click', () => {
      sfx('btn_click');
      if (btn.dataset.action === 'play') startNewRun();
    });
  });
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

  document.addEventListener('keydown', (e) => {
    if (!$('#scene-game').classList.contains('active')) return;
    if (e.code === 'Space') { e.preventDefault(); playHand(); }
    else if (e.key === 'x' || e.key === 'X') discardHand();
    else if (e.key === 's' || e.key === 'S') {
      state.hand.sort((a,b) => RANK_ORDER[b.rank] - RANK_ORDER[a.rank]);
      state.selected.clear(); renderHand();
    }
  });
}

init();

// 暴露给 save.js / settings.js 等
window.GameData = G;
window.startNewRun = startNewRun;
window.switchScene = switchScene;
window.renderHand = renderHand;
window.renderJokers = renderJokers;
window.renderConsumables = renderConsumables;
window.renderStats = renderStats;
window.showRunInfo = showRunInfo;
