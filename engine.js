/* ============================================================
 *  engine.js  —  纯游戏逻辑层（无 DOM 操作）
 *  分支1 在 game.js 之前引入：
 *     <script src="data-bundle.js"></script>
 *     <script src="engine.js"></script>
 *     <script src="game.js"></script>
 *  调用：window.Engine.scoreHand(...)、window.Engine.applyTarot(...) 等
 *
 *  核心 API：
 *    Engine.createRun(opts)            创建新 run 状态
 *    Engine.startBlind(state, blind)   进入盲注（应用Boss效果）
 *    Engine.evalHand(cards)            判断牌型 → {type, scoringCards}
 *    Engine.scoreHand(state, played)   完整计分 → {chips,mult,total,steps[]}
 *    Engine.discard(state, indices)    弃牌
 *    Engine.applyTarot(state, t, idxs) 使用塔罗
 *    Engine.applyPlanet(state, p)      使用行星
 *    Engine.rollShop(state)            刷新商店
 *    Engine.endRound(state)            结算回合 → {moneyGained,breakdown[]}
 *    Engine.advanceBlind(state)        进入下一盲注
 * ============================================================ */

(function () {
  const D = window.GameData;
  if (!D) { console.error('[Engine] 缺少 data-bundle.js'); return; }

  const Engine = {};

  // =================================================================
  // 1. 牌型识别
  // =================================================================
  Engine.evalHand = function (cards) {
    if (!cards.length) return { type: D.hands[0], scoringCards: [] };

    // 石头牌不参与牌型判断（仅加固定筹码）
    const playable = cards.filter(c => !(c.enh === 'e_stone'));
    const stones   = cards.filter(c =>   c.enh === 'e_stone');

    if (!playable.length) {
      return { type: D.hands[0], scoringCards: stones };
    }

    const byRank = {};
    for (const c of playable) (byRank[c.rank] ||= []).push(c);
    const groups = Object.values(byRank).sort((a, b) => b.length - a.length);
    const sizes = groups.map(g => g.length);

    // 同花判断：百搭(wild)可算作任意花色
    let sameSuit = false;
    if (playable.length >= 5) {
      for (const suit of ['♠', '♥', '♦', '♣']) {
        if (playable.every(c => c.suit === suit || c.enh === 'e_wild')) {
          sameSuit = true; break;
        }
      }
    }

    // 顺子判断
    const vals = [...new Set(playable.map(c => D.rankOrder[c.rank]))].sort((a, b) => a - b);
    let isStraight = false;
    if (vals.length >= 5) {
      for (let i = 0; i <= vals.length - 5; i++) {
        if (vals[i + 4] - vals[i] === 4) { isStraight = true; break; }
      }
      // A-2-3-4-5
      if (!isStraight && vals.includes(14) && [2,3,4,5].every(v => vals.includes(v))) isStraight = true;
    }

    const isRoyal = isStraight && sameSuit && vals.includes(14) && vals.includes(13) && vals.includes(12);

    const pick = (id, scoring) => ({ type: D.getHand(id), scoringCards: [...scoring, ...stones] });

    if (isRoyal)                              return pick('royal_flush',     playable);
    if (isStraight && sameSuit)               return pick('straight_flush',  playable);
    if (sizes[0] === 4)                       return pick('four_of_a_kind',  groups[0]);
    if (sizes[0] === 3 && sizes[1] === 2)     return pick('full_house',      [...groups[0], ...groups[1]]);
    if (sameSuit)                             return pick('flush',           playable);
    if (isStraight)                           return pick('straight',        playable);
    if (sizes[0] === 3)                       return pick('three_of_a_kind', groups[0]);
    if (sizes[0] === 2 && sizes[1] === 2)     return pick('two_pair',        [...groups[0], ...groups[1]]);
    if (sizes[0] === 2)                       return pick('pair',            groups[0]);

    const highest = playable.reduce((a, b) => D.rankOrder[a.rank] > D.rankOrder[b.rank] ? a : b);
    return pick('high_card', [highest]);
  };

  // =================================================================
  // 2. Joker 效果表（每个 type → ctx 修改函数）
  //    ctx: { chips, mult, scoringCards, playedCards, state, joker, breakdown }
  // =================================================================
  const JokerEffects = {

    flat_mult(ctx) {
      ctx.mult += ctx.joker.value;
      pushStep(ctx, `+${ctx.joker.value} 倍率`, 'mult');
    },

    per_suit_mult(ctx) {
      const n = ctx.scoringCards.filter(c => c.suit === ctx.joker.suit || c.enh === 'e_wild').length;
      if (n > 0) {
        ctx.mult += ctx.joker.value * n;
        pushStep(ctx, `+${ctx.joker.value * n} 倍率 (${n}×${ctx.joker.suit})`, 'mult');
      }
    },

    on_hand_mult(ctx) {
      if (handContains(ctx.handType.id, ctx.joker.hand)) {
        ctx.mult += ctx.joker.value;
        pushStep(ctx, `+${ctx.joker.value} 倍率`, 'mult');
      }
    },

    on_hand_chips(ctx) {
      if (handContains(ctx.handType.id, ctx.joker.hand)) {
        ctx.chips += ctx.joker.value;
        pushStep(ctx, `+${ctx.joker.value} 筹码`, 'chips');
      }
    },

    cond_le_3(ctx) {
      if (ctx.playedCards.length <= 3) {
        ctx.mult += ctx.joker.value;
        pushStep(ctx, `+${ctx.joker.value} 倍率 (≤3张)`, 'mult');
      }
    },

    cond_per_discard(ctx) {
      const n = ctx.state.discardsLeft;
      if (n > 0) {
        ctx.chips += ctx.joker.value * n;
        pushStep(ctx, `+${ctx.joker.value * n} 筹码 (${n}×剩余弃牌)`, 'chips');
      }
    },

    cond_no_discard(ctx) {
      if (ctx.state.discardsLeft === 0) {
        ctx.mult += ctx.joker.value;
        pushStep(ctx, `+${ctx.joker.value} 倍率 (无弃牌)`, 'mult');
      }
    },

    cond_no_discard_used(ctx) {
      if (ctx.state.discardsLeft === ctx.state.discardsMax) {
        ctx.mult += ctx.joker.value;
        pushStep(ctx, `+${ctx.joker.value} 倍率 (未弃牌)`, 'mult');
      }
    },

    per_card_chips(ctx) {
      const n = ctx.scoringCards.length;
      ctx.chips += ctx.joker.value * n;
      pushStep(ctx, `+${ctx.joker.value * n} 筹码 (${n}张牌)`, 'chips');
    },

    per_face_chips(ctx) {
      const n = ctx.scoringCards.filter(c => ['J','Q','K'].includes(c.rank)).length;
      if (n > 0) {
        ctx.chips += ctx.joker.value * n;
        pushStep(ctx, `+${ctx.joker.value * n} 筹码 (${n}人头)`, 'chips');
      }
    },

    per_money_mult(ctx) {
      const add = Math.min(ctx.state.money * ctx.joker.value, ctx.joker.cap || 999);
      if (add > 0) {
        ctx.mult += add;
        pushStep(ctx, `+${add} 倍率 (金币)`, 'mult');
      }
    },

    random_mult(ctx) {
      const r = ctx.joker.min + Math.floor(Math.random() * (ctx.joker.max - ctx.joker.min + 1));
      ctx.mult += r;
      pushStep(ctx, `+${r} 倍率 (随机)`, 'mult');
    },

    escalating_mult(ctx) {
      ctx.joker.stack = (ctx.joker.stack || 0) + ctx.joker.value;
      if (ctx.joker.stack > 0) {
        ctx.mult += ctx.joker.stack;
        pushStep(ctx, `+${ctx.joker.stack} 倍率 (累积)`, 'mult');
      }
    },

    x_mult(ctx) {
      const before = ctx.mult;
      ctx.mult = Math.round(ctx.mult * ctx.joker.value * 10) / 10;
      pushStep(ctx, `×${ctx.joker.value} 倍率 (${before}→${ctx.mult})`, 'xmult');
    },

    x_mult_limited(ctx) {
      ctx.joker.usesLeft = ctx.joker.usesLeft ?? ctx.joker.uses;
      if (ctx.joker.usesLeft > 0) {
        ctx.mult = Math.round(ctx.mult * ctx.joker.value * 10) / 10;
        ctx.joker.usesLeft--;
        pushStep(ctx, `×${ctx.joker.value} 倍率 (剩${ctx.joker.usesLeft})`, 'xmult');
      }
    },

    escalating_x(ctx) {
      const n = ctx.scoringCards.filter(c => c.suit === ctx.joker.suit).length;
      if (n > 0) {
        ctx.joker.xMult = (ctx.joker.xMult || 1) + ctx.joker.value * n;
        ctx.mult = Math.round(ctx.mult * ctx.joker.xMult * 10) / 10;
        pushStep(ctx, `×${ctx.joker.xMult} 倍率 (累积)`, 'xmult');
      }
    },

    cond_same_color_x(ctx) {
      const colors = new Set(ctx.playedCards.map(c => (c.suit === '♥' || c.suit === '♦') ? 'red' : 'black'));
      if (colors.size === 1) {
        ctx.mult = Math.round(ctx.mult * ctx.joker.value * 10) / 10;
        pushStep(ctx, `×${ctx.joker.value} 倍率 (全同色)`, 'xmult');
      }
    },

    money_per_rank(ctx) {
      const n = ctx.scoringCards.filter(c => c.rank === ctx.joker.rank).length;
      if (n > 0) {
        ctx.moneyGain = (ctx.moneyGain || 0) + ctx.joker.value * n;
        pushStep(ctx, `+$${ctx.joker.value * n} (${n}×${ctx.joker.rank})`, 'money');
      }
    },

    mult_from_deck(ctx) {
      const add = Math.floor(ctx.state.deck.length * ctx.joker.value);
      if (add > 0) {
        ctx.mult += add;
        pushStep(ctx, `+${add} 倍率 (牌堆${ctx.state.deck.length})`, 'mult');
      }
    },

    passive_extra_hand() {/* 已在 createRun/startBlind 处理 */},
  };

  function handContains(played, required) {
    // 例如打出葫芦也算包含三条/对子
    const m = {
      pair:            ['pair','two_pair','three_of_a_kind','full_house','four_of_a_kind'],
      two_pair:        ['two_pair','full_house'],
      three_of_a_kind: ['three_of_a_kind','full_house','four_of_a_kind'],
      straight:        ['straight','straight_flush','royal_flush'],
      flush:           ['flush','straight_flush','royal_flush'],
    };
    return (m[required] || [required]).includes(played);
  }

  function pushStep(ctx, label, kind) {
    ctx.breakdown.push({
      source: ctx.joker ? ctx.joker.name : (ctx.cardLabel || ''),
      label, kind, chips: ctx.chips, mult: ctx.mult,
    });
  }

  // =================================================================
  // 3. 单张计分牌的强化/版本/封印效果
  // =================================================================
  function applyCardEffects(card, ctx) {
    // 基础点数筹码（石头牌走 enh 分支）
    if (card.enh !== 'e_stone') {
      const baseChip = D.rankChips[card.rank] || 0;
      ctx.chips += baseChip;
      ctx.cardLabel = `${card.rank}${card.suit}`;
      pushStep(ctx, `+${baseChip} 筹码`, 'chips');
    }

    // Enhancement
    if (card.enh) {
      const enh = D.getEnhance(card.enh);
      if (enh) {
        switch (enh.effect) {
          case 'add_chips':
            ctx.chips += enh.value;
            pushStep(ctx, `+${enh.value} 筹码 (${enh.name})`, 'chips'); break;
          case 'add_mult':
            ctx.mult += enh.value;
            pushStep(ctx, `+${enh.value} 倍率 (${enh.name})`, 'mult'); break;
          case 'x_mult_break':
            ctx.mult = Math.round(ctx.mult * enh.value * 10) / 10;
            pushStep(ctx, `×${enh.value} 倍率 (${enh.name})`, 'xmult');
            if (Math.random() < enh.break) ctx.brokenCards.push(card); break;
          case 'stone':
            ctx.chips += enh.value;
            pushStep(ctx, `+${enh.value} 筹码 (石头)`, 'chips'); break;
          case 'lucky':
            if (Math.random() < enh.chance_mult) {
              ctx.mult += enh.val_mult;
              pushStep(ctx, `+${enh.val_mult} 倍率 (幸运)`, 'mult');
            }
            if (Math.random() < enh.chance_money) {
              ctx.moneyGain = (ctx.moneyGain || 0) + enh.val_money;
              pushStep(ctx, `+$${enh.val_money} (幸运)`, 'money');
            } break;
        }
      }
    }

    // Edition
    if (card.edition) {
      const ed = D.getEdition(card.edition);
      if (ed) {
        if (ed.effect === 'add_chips') { ctx.chips += ed.value; pushStep(ctx, `+${ed.value} 筹码 (${ed.name})`, 'chips'); }
        if (ed.effect === 'add_mult')  { ctx.mult  += ed.value; pushStep(ctx, `+${ed.value} 倍率 (${ed.name})`, 'mult'); }
        if (ed.effect === 'x_mult')    {
          ctx.mult = Math.round(ctx.mult * ed.value * 10) / 10;
          pushStep(ctx, `×${ed.value} 倍率 (${ed.name})`, 'xmult');
        }
      }
    }

    // Seal
    if (card.seal === 's_gold') {
      ctx.moneyGain = (ctx.moneyGain || 0) + 3;
      pushStep(ctx, `+$3 (金封印)`, 'money');
    }
    if (card.seal === 's_red') {
      // 再触发一次（递归 1 次）
      const copy = { ...card, seal: null };
      applyCardEffects(copy, ctx);
    }
    ctx.cardLabel = '';
  }

  // =================================================================
  // 4. 完整计分主流程
  // =================================================================
  Engine.scoreHand = function (state, playedCards) {
    const { type: handType, scoringCards: rawScoring } = Engine.evalHand(playedCards);

    // 应用 Boss debuff_suit / debuff_rank
    const boss = state.currentBoss;
    let scoringCards = rawScoring.filter(c => !isDebuffed(c, boss, state));

    // 应用行星等级
    const lvl = state.handLevels[handType.id] || 0;
    const planet = D.planets.find(p => p.hand === handType.id);
    const lvlChips = planet ? planet.chips * lvl : 0;
    const lvlMult  = planet ? planet.mult  * lvl : 0;

    const ctx = {
      chips: handType.chips + lvlChips,
      mult:  handType.mult  + lvlMult,
      scoringCards, playedCards, state,
      handType, joker: null, brokenCards: [],
      breakdown: [{ source: handType.name, label: `基础 ${ctx0().c}×${ctx0().m}`, kind: 'base', chips: 0, mult: 0 }],
    };
    function ctx0() { return { c: handType.chips + lvlChips, m: handType.mult + lvlMult }; }
    ctx.breakdown[0].chips = ctx.chips;
    ctx.breakdown[0].mult  = ctx.mult;

    // 每张计分牌：基础筹码 + enhancement + edition + seal
    for (const card of scoringCards) {
      ctx.joker = null;
      applyCardEffects(card, ctx);
    }

    // 钢铁牌：在手未出的强化
    for (const card of (state.hand || [])) {
      if (card.enh === 'e_steel' && !playedCards.includes(card)) {
        ctx.mult = Math.round(ctx.mult * 1.5 * 10) / 10;
        ctx.cardLabel = '';
        ctx.joker = null;
        pushStep(ctx, `×1.5 倍率 (钢铁在手)`, 'xmult');
      }
    }

    // Joker 从左到右触发
    const bossDisablesJokers = boss && boss.type === 'disable_jokers';
    if (!bossDisablesJokers) {
      for (const j of state.jokers) {
        const fn = JokerEffects[j.type];
        if (fn) {
          ctx.joker = j;
          fn(ctx);
        }
      }
    }

    const total = Math.floor(ctx.chips * ctx.mult);
    return {
      chips: ctx.chips,
      mult: ctx.mult,
      total,
      breakdown: ctx.breakdown,
      moneyGain: ctx.moneyGain || 0,
      brokenCards: ctx.brokenCards,
      handType,
      scoringCards,
    };
  };

  function isDebuffed(card, boss, state) {
    if (!boss) return false;
    if (boss.type === 'debuff_suit' && card.suit === boss.suit) return true;
    if (boss.type === 'rotating_debuff') {
      const order = ['♠','♥','♦','♣'];
      const i = (state.handsPlayed || 0) % 4;
      if (card.suit === order[i]) return true;
    }
    return false;
  }

  // =================================================================
  // 5. Run / Blind 状态管理
  // =================================================================
  Engine.createRun = function (opts = {}) {
    const eco = D.economy;
    return {
      ante: 1,
      blindIdx: 0,
      money: eco.starting_money,
      jokers: [],
      consumables: [],
      vouchers: [],
      tags: [],
      jokerSlots: 5,
      consumableSlots: 2,
      handsMax: eco.hands_per_round,
      discardsMax: eco.discards_per_round,
      handsLeft: eco.hands_per_round,
      discardsLeft: eco.discards_per_round,
      handSize: eco.hand_size,
      handsPlayed: 0,
      discardsUsed: 0,
      handLevels: {},
      deck: [],
      hand: [],
      lockedIdx: -1,
      roundScore: 0,
      blindScore: D.getBlindScore(1, 'small'),
      currentBoss: null,
      shopRerollCost: eco.reroll_initial_cost,
      ...opts,
    };
  };

  Engine.startBlind = function (state) {
    const blind = D.blindTemplate[state.blindIdx];
    state.handsLeft    = state.handsMax;
    state.discardsLeft = state.discardsMax;
    state.handsPlayed  = 0;
    state.discardsUsed = 0;
    state.roundScore   = 0;
    state.blindScore   = D.getBlindScore(state.ante, blind.id);
    state.lockedIdx    = -1;
    state.currentBoss  = blind.id === 'boss' ? D.pickBoss(state.ante) : null;

    // 应用 Boss 一次性 debuff
    if (state.currentBoss) {
      const b = state.currentBoss;
      if (b.type === 'reduce_hands')    state.handsLeft    = Math.max(1, state.handsLeft - b.value);
      if (b.type === 'reduce_discards') state.discardsLeft = Math.max(0, state.discardsLeft - b.value);
    }

    // 应用永久 Joker 加成（time_thief 等）
    for (const j of state.jokers) {
      if (j.type === 'passive_extra_hand') state.handsLeft += j.value;
    }

    // 应用凭证永久效果
    for (const v of state.vouchers) {
      if (v.type === 'extra_hands_perm')    state.handsLeft    += v.value;
      if (v.type === 'extra_discards_perm') state.discardsLeft += v.value;
    }
    return blind;
  };

  Engine.discard = function (state, indices) {
    if (!indices.length || state.discardsLeft <= 0) return false;
    state.hand = state.hand.filter((_, i) => !indices.includes(i));
    state.discardsLeft--;
    state.discardsUsed++;
    return true;
  };

  // =================================================================
  // 6. 道具 / 商店
  // =================================================================
  Engine.applyPlanet = function (state, planet) {
    state.handLevels[planet.hand] = (state.handLevels[planet.hand] || 0) + 1;
  };

  Engine.applyTarot = function (state, tarot, targetIndices = []) {
    const targets = targetIndices.map(i => state.hand[i]);
    switch (tarot.type) {
      case 'enhance':
        for (const c of targets) c.enh = tarot.enh; break;
      case 'rank_up':
        for (const c of targets) {
          const order = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
          const i = order.indexOf(c.rank);
          c.rank = order[Math.min(order.length - 1, i + tarot.value)];
        } break;
      case 'destroy':
        state.hand = state.hand.filter((_, i) => !targetIndices.includes(i)); break;
      case 'convert_left_to_right':
        if (targets.length === 2) {
          targets[0].rank = targets[1].rank;
          targets[0].suit = targets[1].suit;
        } break;
      case 'convert_suit':
        for (const c of targets) c.suit = tarot.suit; break;
      case 'create_planet':
        for (let i = 0; i < (tarot.count || 1); i++) {
          if (state.consumables.length < state.consumableSlots) state.consumables.push({ ...D.randomPlanet(), kind: 'planet' });
        } break;
      case 'create_tarot':
        for (let i = 0; i < (tarot.count || 1); i++) {
          if (state.consumables.length < state.consumableSlots) state.consumables.push({ ...D.randomTarot(), kind: 'tarot' });
        } break;
      case 'create_joker':
        if (state.jokers.length < state.jokerSlots) state.jokers.push({ ...D.randomJoker() }); break;
      case 'money_double_cap':
        const add = Math.min(state.money, tarot.cap || 20);
        state.money += add; break;
      case 'sum_joker_sell':
        const sum = Math.min(state.jokers.reduce((s, j) => s + Math.floor(j.price / 2), 0), tarot.cap || 50);
        state.money += sum; break;
      case 'random_edition_joker':
        if (state.jokers.length && Math.random() < (tarot.chance || 0.25)) {
          const j = state.jokers[Math.floor(Math.random() * state.jokers.length)];
          const eds = ['ed_foil','ed_holo','ed_poly'];
          j.edition = eds[Math.floor(Math.random() * eds.length)];
        } break;
    }
    return true;
  };

  Engine.rollShop = function (state) {
    const slots = 2 + state.vouchers.filter(v => v.type === 'shop_slots').reduce((s, v) => s + v.value, 0);
    const ownedIds = state.jokers.map(j => j.id);
    const jokers = D.rollShopJokers(slots, ownedIds);
    const packs = [...D.packs].sort(() => Math.random() - 0.5).slice(0, 2);

    // 凭证：每个 Ante 第一次商店出现 1 张未购买的
    const ownedV = new Set(state.vouchers.map(v => v.id));
    const availV = D.vouchers.filter(v => {
      if (ownedV.has(v.id)) return false;
      if (v.requires && !ownedV.has(v.requires)) return false;
      return true;
    });
    const voucher = availV.length ? availV[Math.floor(Math.random() * availV.length)] : null;

    const discount = state.vouchers.filter(v => v.type === 'shop_discount').reduce((s, v) => s + v.value, 0);
    const priceMod = (p) => Math.max(1, Math.round(p * (1 - discount)));

    return {
      jokers: jokers.map(j => ({ ...j, price: priceMod(j.price) })),
      packs:  packs.map(p =>  ({ ...p, price: priceMod(p.price) })),
      voucher,
    };
  };

  Engine.rerollShop = function (state) {
    const discount = state.vouchers.filter(v => v.type === 'reroll_discount').reduce((s, v) => s + v.value, 0);
    const cost = Math.max(0, state.shopRerollCost - discount);
    if (state.money < cost) return null;
    state.money -= cost;
    state.shopRerollCost += D.economy.reroll_increment;
    return Engine.rollShop(state);
  };

  Engine.openPack = function (pack) {
    const out = [];
    for (let i = 0; i < pack.size; i++) {
      switch (pack.kind) {
        case 'tarot':  out.push({ ...D.randomTarot(),  kind: 'tarot'  }); break;
        case 'planet': out.push({ ...D.randomPlanet(), kind: 'planet' }); break;
        case 'joker':  out.push({ ...D.randomJoker(),  kind: 'joker'  }); break;
        case 'card':
          out.push({
            rank: ['2','3','4','5','6','7','8','9','10','J','Q','K','A'][Math.floor(Math.random()*13)],
            suit: ['♠','♥','♦','♣'][Math.floor(Math.random()*4)],
            kind: 'card',
          });
          break;
      }
    }
    return { items: out, pick: pack.pick };
  };

  // =================================================================
  // 7. 回合结算 / Ante 推进
  // =================================================================
  Engine.endRound = function (state) {
    const blind = D.blindTemplate[state.blindIdx];
    const breakdown = [];
    let total = 0;

    // 盲注奖励
    breakdown.push({ label: `${blind.cn} 奖励`, value: blind.reward });
    total += blind.reward;

    // 未用出牌
    if (state.handsLeft > 0) {
      const v = state.handsLeft * D.economy.money_per_unused_hand;
      breakdown.push({ label: `剩余出牌 ×${state.handsLeft}`, value: v });
      total += v;
    }

    // 利息
    const capExtra = state.vouchers.filter(v => v.type === 'interest_cap').reduce((s, v) => s + v.value, 0);
    const cap = D.economy.interest_cap + capExtra;
    const interest = Math.min(Math.floor(state.money / 5), cap);
    if (interest > 0) {
      breakdown.push({ label: `利息`, value: interest });
      total += interest;
    }

    // 黄金牌（在手回合末 +$3）
    for (const c of state.hand) {
      if (c.enh === 'e_gold') {
        breakdown.push({ label: `黄金牌`, value: 3 });
        total += 3;
      }
    }

    state.money += total;
    return { moneyGained: total, breakdown };
  };

  Engine.advanceBlind = function (state) {
    state.blindIdx++;
    if (state.blindIdx > 2) {
      state.blindIdx = 0;
      state.ante++;
    }
    state.shopRerollCost = D.economy.reroll_initial_cost;
  };

  Engine.skipBlind = function (state) {
    const blind = D.blindTemplate[state.blindIdx];
    if (!blind.skippable) return null;
    const tag = D.randomTag();
    state.tags.push(tag);
    Engine.advanceBlind(state);
    return tag;
  };

  Engine.isVictory = function (state) {
    return state.ante > 8;
  };

  // =================================================================
  // 8. 默认牌组生成
  // =================================================================
  Engine.makeStandardDeck = function () {
    const suits = ['♠','♥','♦','♣'];
    const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
    const deck = [];
    for (const s of suits) for (const r of ranks) deck.push({ rank: r, suit: s });
    return shuffle(deck);
  };

  Engine.shuffle = shuffle;
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  window.Engine = Engine;
})();
