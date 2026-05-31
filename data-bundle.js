/* ============================================================
 *  data-bundle.js  —  全部游戏数据 + 静态查询工具
 *  分支1 接入：在 game.js 之前加 <script src="data-bundle.js"></script>
 *  访问：window.GameData
 *
 *  双击 index.html 可直接跑（无 fetch，无 CORS 问题）
 * ============================================================ */

window.GameData = {

  // ============ 牌型分数表 ============
  hands: [
    { id:'high_card',       name:'高牌',       en:'High Card',       chips:5,   mult:1 },
    { id:'pair',            name:'一对',       en:'Pair',            chips:10,  mult:2 },
    { id:'two_pair',        name:'两对',       en:'Two Pair',        chips:20,  mult:2 },
    { id:'three_of_a_kind', name:'三条',       en:'Three of a Kind', chips:30,  mult:3 },
    { id:'straight',        name:'顺子',       en:'Straight',        chips:30,  mult:4 },
    { id:'flush',           name:'同花',       en:'Flush',           chips:35,  mult:4 },
    { id:'full_house',      name:'葫芦',       en:'Full House',      chips:40,  mult:4 },
    { id:'four_of_a_kind',  name:'四条',       en:'Four of a Kind',  chips:60,  mult:7 },
    { id:'straight_flush',  name:'同花顺',     en:'Straight Flush',  chips:100, mult:8 },
    { id:'royal_flush',     name:'皇家同花顺', en:'Royal Flush',     chips:100, mult:8 },
    { id:'five_of_a_kind',  name:'五条',       en:'Five of a Kind',  chips:120, mult:12 },
    { id:'flush_house',     name:'同花葫芦',   en:'Flush House',     chips:140, mult:14 },
    { id:'flush_five',      name:'同花五',     en:'Flush Five',      chips:160, mult:16 },
  ],

  rankChips: { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10,'A':11 },
  rankOrder: { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 },

  // ============ Joker State — jokers ============
  jokers: [
    { id:'j_chip_stacker',    name:'CHIP STACKER',    name_cn:'筹码堆叠',   rarity:'common',    price:4,  cardNo:'001', theme:'chip-stacker',    type:'per_card_chips',       value:30,  desc:'+30 Chips per card', desc_cn:'每张计分牌 +30 筹码' },
    { id:'j_multiplier',      name:'THE MULTIPLIER',  name_cn:'倍率小丑',   rarity:'uncommon',  price:6,  cardNo:'002', theme:'multiplier',      type:'flat_mult',            value:8,   desc:'+8 Mult', desc_cn:'+8 倍率' },
    { id:'j_heart_king',      name:'HEART KING',      name_cn:'红心之王',   rarity:'common',    price:4,  cardNo:'003', theme:'heart-king',      type:'per_suit_mult',        suit:'♥', value:3, desc:'Hearts: +3 Mult each', desc_cn:'每张红桃计分牌 +3 倍率' },
    { id:'j_spade_lord',      name:'SPADE LORD',      name_cn:'黑桃领主',   rarity:'uncommon',  price:5,  cardNo:'004', theme:'spade-lord',      type:'per_suit_chips',       suit:'♠', value:15, desc:'Spades: +15 Chips each', desc_cn:'每张黑桃计分牌 +15 筹码' },
    { id:'j_diamond_hustler', name:'DIAMOND HUSTLER', name_cn:'方块大亨',   rarity:'rare',      price:8,  cardNo:'005', theme:'diamond-hustler', type:'money_per_suit',     suit:'♦', value:1, desc:'Diamonds: +$1 each', desc_cn:'每张方块计分牌 +$1' },
    { id:'j_club_baron',      name:'CLUB BARON',      name_cn:'梅花男爵',   rarity:'common',    price:4,  cardNo:'006', theme:'club-baron',      type:'per_suit_chips',       suit:'♣', value:15, desc:'Clubs: +15 Chips each', desc_cn:'每张梅花计分牌 +15 筹码' },
    { id:'j_twin_trouble',    name:'TWIN TROUBLE',    name_cn:'双子麻烦',   rarity:'rare',      price:8,  cardNo:'007', theme:'twin-trouble',    type:'pair_to_three',        desc:'Pair → Three of a Kind', desc_cn:'对子升档为三条（改判牌型）' },
    { id:'j_ace_high',        name:'ACE HIGH',        name_cn:'Ace 王牌',   rarity:'uncommon',  price:5,  cardNo:'008', theme:'ace-high',        type:'per_rank_chips',       rank:'A', value:50, desc:'Aces: +50 Chips each', desc_cn:'每张 A 计分牌 +50 筹码' },
    { id:'j_burn_baron',      name:'BURN BARON',      name_cn:'燃烧男爵',   rarity:'rare',      price:8,  cardNo:'009', theme:'burn-baron',      type:'discard_mult',         value:15, desc:'Discard: +15 Mult per card', desc_cn:'每弃 1 张牌，下次出牌 +15 倍率' },
    { id:'j_time_loop',       name:'TIME LOOP',       name_cn:'时间循环',   rarity:'rare',      price:8,  cardNo:'010', theme:'time-loop',       type:'retrigger_first',      desc:'Retrigger first scored card', desc_cn:'首张计分牌额外结算一次' },
    { id:'j_ol_glory',        name:'DUAL STRIKE',     name_cn:'双色强击',   rarity:'legendary', price:15, cardNo:'011', theme:'ol-glory',        type:'cond_mixed_color_x',   value:3,  desc:'×3 Mult on red+black mix', desc_cn:'红+黑混色出牌时 ×3 倍率' },
    { id:'j_the_house',       name:'PIT BOSS',        name_cn:'场主管',     rarity:'legendary', price:20, cardNo:'012', theme:'the-house',       type:'round_money',          value:5,  desc:'+$5 every round', desc_cn:'每回合开始 +$5' },
    { id:'j_x_factor',        name:'THE X-FACTOR',    name_cn:'X 因子',     rarity:'rare',      price:8,  cardNo:'013', theme:'x-factor',        type:'x_mult',               value:1.5, desc:'×1.5 Mult after each hand', desc_cn:'出牌结算时 ×1.5 倍率' },
    { id:'j_flush_royale',    name:'FLUSH ROYALE',    name_cn:'同花皇家',   rarity:'uncommon',  price:6,  cardNo:'014', theme:'flush-royale',    type:'on_hand_mult',         hand:'flush', value:50, desc:'+50 Mult on Flush', desc_cn:'打出同花时 +50 倍率' },
    { id:'j_royal_court',     name:'ROYAL COURT',     name_cn:'皇家宫廷',   rarity:'uncommon',  price:6,  cardNo:'015', theme:'royal-court',     type:'per_face_chips',       value:30, desc:'Face cards: +30 Chips each', desc_cn:'每张 J/Q/K 计分牌 +30 筹码' },
    { id:'j_extra_hand',      name:'EXTRA HAND',      name_cn:'额外一手',   rarity:'common',    price:4,  cardNo:'016', theme:'extra-hand',      type:'passive_extra_hand',   value:1,  desc:'+1 Hand per round', desc_cn:'每回合 +1 次出牌' },
    { id:'j_growth_spurt',    name:'GROWTH SPURT',    name_cn:'成长爆发',   rarity:'rare',      price:8,  cardNo:'017', theme:'growth-spurt',    type:'escalating_mult',      value:1,  desc:'+1 Mult per hand (permanent)', desc_cn:'每次出牌永久叠 +1 倍率' },
    { id:'j_lucky_dice',      name:'LUCKY DICE',      name_cn:'幸运骰子',   rarity:'uncommon',  price:6,  cardNo:'018', theme:'lucky-dice',      type:'chance_x_mult',        chance:0.25, value:2, desc:'25% chance: ×2 Mult', desc_cn:'25% 几率 ×2 倍率' },
  ],

  // ============ 8 Ante × 3 盲注 ============
  /* 目标分曲线（原创数值）；高 Ante 略放缓便于通关 */
  ante_base: { 1:200, 2:750, 3:1900, 4:4800, 5:10000, 6:18000, 7:31000, 8:44000 },

  /* 每 Ante 额外资源（防高分局无手牌可出） */
  ante_help: {
    1: { hands: 1 },
    4: { hands: 1 },
    6: { hands: 1, discards: 1 },
    7: { hands: 1, discards: 1 },
    8: { hands: 1, discards: 1 },
  },
  blindTemplate: [
    { id:'small', name:'Small Blind', cn:'小盲注',   mult:1.0, reward:3, skippable:true,  color:'#1e9060' },
    { id:'big',   name:'Big Blind',   cn:'大盲注',   mult:1.5, reward:4, skippable:true,  color:'#F59E0B' },
    { id:'boss',  name:'Boss Blind',  cn:'Boss盲注', mult:2.0, reward:5, skippable:false, color:'#EF4444' },
  ],

  // ============ 12 Boss 盲注效果 ============
  bosses: [
    { id:'boss_warmup',   name:'Warm-Up',    name_cn:'热身',     min_ante:1, type:'none',                desc:'No extra effect (tutorial)', desc_cn:'无额外效果（新手关）', ante_only:1 },
    { id:'boss_blackout', name:'Blackout',   name_cn:'黑幕',     min_ante:1, type:'hide_card_values',    desc:'Cards face-down until played', desc_cn:'手牌背面朝下，出牌时翻开' },
    { id:'boss_chain',    name:'The Chain',  name_cn:'锁链',     min_ante:1, type:'lock_random_card',    desc:'Lock 1 random card each round', desc_cn:'每回合开始锁住 1 张手牌' },
    { id:'boss_rust',     name:'Rust',       name_cn:'锈蚀',     min_ante:1, type:'debuff_suit', suit:'♣', desc:'Clubs do not score', desc_cn:'梅花牌不计分' },
    { id:'boss_mist',     name:'Mist',       name_cn:'迷雾',     min_ante:2, type:'debuff_suit', suit:'♥', desc:'Hearts do not score', desc_cn:'红桃牌不计分' },
    { id:'boss_ash',      name:'Ash',        name_cn:'灰烬',     min_ante:2, type:'debuff_suit', suit:'♠', desc:'Spades do not score', desc_cn:'黑桃牌不计分' },
    { id:'boss_thorn',    name:'Thorn',      name_cn:'荆棘',     min_ante:2, type:'debuff_suit', suit:'♦', desc:'Diamonds do not score', desc_cn:'方块牌不计分' },
    { id:'boss_tightrope',name:'Tightrope',  name_cn:'走索人',   min_ante:2, type:'reduce_hands',  value:1, desc:'-1 Hand this blind', desc_cn:'本盲注 -1 次出牌' },
    { id:'boss_dust',     name:'Dust',       name_cn:'尘暴',     min_ante:3, type:'reduce_discards', value:2, desc:'-2 Discards this blind', desc_cn:'本盲注 -2 次弃牌' },
    { id:'boss_house',    name:'The House',  name_cn:'高墙',     min_ante:3, type:'first_hand_facedown', desc:'First hand played face-down', desc_cn:'第一手出的牌背面朝下' },
    { id:'boss_clock',    name:'The Clock',  name_cn:'钟摆',     min_ante:3, type:'rotating_debuff',     desc:'Rotate debuffed suit each hand', desc_cn:'每出 1 手轮流禁用一种花色' },
    { id:'boss_serpent',  name:'Serpent',    name_cn:'深海蛇',   min_ante:4, type:'force_hand_size', value:3, desc:'Next draw: only 3 cards', desc_cn:'出牌后下次只能抽 3 张' },
    { id:'boss_needle',   name:'The Needle', name_cn:'针眼',     min_ante:4, type:'set_hands_max', value:1, desc:'Only 1 Hand this blind', desc_cn:'本盲注仅 1 次出牌' },
    { id:'boss_shackle',  name:'Shackle',    name_cn:'镣铐',     min_ante:5, type:'no_discards',         desc:'No Discards this blind', desc_cn:'本盲注无法弃牌' },
    { id:'boss_pillar',   name:'Pillar',     name_cn:'石柱',     min_ante:5, type:'debuff_rank_below', value:5, desc:'2–4 ranks do not score', desc_cn:'2–4 点牌不计分' },
    { id:'boss_void',     name:'The Void',   name_cn:'虚空',     min_ante:8, type:'disable_jokers', final:true, desc:'Final: Jokers silent; +3 Hands +1 Discard', desc_cn:'终局：Joker 静默，但本局 +3 出牌 +1 弃牌' },
  ],

  // ============ 经济与回合 ============
  economy: {
    starting_money: 4,
    hands_per_round: 4,
    discards_per_round: 3,
    hand_size: 8,
    money_per_unused_hand: 1,
    interest_per_5: 1,
    interest_cap: 5,
    reroll_initial_cost: 5,
    reroll_increment: 1,
  },

  // ============ 12 行星 ============
  planets: [
    { id:'pl_pluto',   name:'Pluto',   name_cn:'冥王星', hand:'high_card',       chips:10, mult:1, price:3 },
    { id:'pl_mercury', name:'Mercury', name_cn:'水星',   hand:'pair',            chips:15, mult:1, price:3 },
    { id:'pl_uranus',  name:'Uranus',  name_cn:'天王星', hand:'two_pair',        chips:20, mult:1, price:3 },
    { id:'pl_venus',   name:'Venus',   name_cn:'金星',   hand:'three_of_a_kind', chips:20, mult:2, price:3 },
    { id:'pl_saturn',  name:'Saturn',  name_cn:'土星',   hand:'straight',        chips:30, mult:3, price:3 },
    { id:'pl_jupiter', name:'Jupiter', name_cn:'木星',   hand:'flush',           chips:15, mult:2, price:3 },
    { id:'pl_earth',   name:'Earth',   name_cn:'地球',   hand:'full_house',      chips:25, mult:2, price:3 },
    { id:'pl_mars',    name:'Mars',    name_cn:'火星',   hand:'four_of_a_kind',  chips:30, mult:3, price:3 },
    { id:'pl_neptune', name:'Neptune', name_cn:'海王星', hand:'straight_flush',  chips:40, mult:4, price:3 },
    { id:'pl_ceres',   name:'Ceres',   name_cn:'谷神星', hand:'flush_house',     chips:40, mult:4, price:3 },
    { id:'pl_planetx', name:'Planet X',name_cn:'X行星',  hand:'five_of_a_kind',  chips:35, mult:3, price:3 },
    { id:'pl_eros',    name:'Eros',    name_cn:'阋神星', hand:'flush_five',      chips:35, mult:3, price:3 },
  ],

  // ============ 22 塔罗（公共领域 Major Arcana 名称） ============
  tarots: [
    { id:'t_fool',       name:'The Fool',       name_cn:'愚者',     target:'none',    type:'spawn_last_used',  desc:'Create last Tarot or Planet used', desc_cn:'生成上次用过的塔罗或行星' },
    { id:'t_magician',   name:'The Magician',   name_cn:'魔术师',   target:'2',       type:'enhance', enh:'e_lucky',  desc:'2 cards → Lucky', desc_cn:'2 张牌变为幸运' },
    { id:'t_priestess',  name:'High Priestess', name_cn:'女祭司',   target:'none',    type:'create_planet', count:2, desc:'Create 2 random Planets', desc_cn:'生成 2 张随机行星' },
    { id:'t_empress',    name:'The Empress',    name_cn:'皇后',     target:'2',       type:'enhance', enh:'e_mult',   desc:'2 cards → Mult', desc_cn:'2 张牌变为倍率' },
    { id:'t_emperor',    name:'The Emperor',    name_cn:'皇帝',     target:'none',    type:'create_tarot',  count:2, desc:'Create 2 random Tarots', desc_cn:'生成 2 张随机塔罗' },
    { id:'t_hierophant', name:'Hierophant',     name_cn:'教皇',     target:'2',       type:'enhance', enh:'e_bonus',  desc:'2 cards → Bonus (+30 Chips)', desc_cn:'2 张牌变为奖励(+30筹码)' },
    { id:'t_lovers',     name:'The Lovers',     name_cn:'恋人',     target:'1',       type:'enhance', enh:'e_wild',   desc:'1 card → Wild', desc_cn:'1 张牌变为百搭(任意花色)' },
    { id:'t_chariot',    name:'The Chariot',    name_cn:'战车',     target:'1',       type:'enhance', enh:'e_steel',  desc:'1 card → Steel (×1.5 in hand)', desc_cn:'1 张牌变为钢铁(在手×1.5)' },
    { id:'t_strength',   name:'Strength',       name_cn:'力量',     target:'2',       type:'rank_up',  value:1,     desc:'2 cards rank +1', desc_cn:'2 张牌点数 +1' },
    { id:'t_hermit',     name:'The Hermit',     name_cn:'隐者',     target:'none',    type:'money_double_cap', cap:20, desc:'Double $ (max +$20)', desc_cn:'金币翻倍(上限+$20)' },
    { id:'t_wheel',      name:'Wheel of Fortune',name_cn:'命运之轮', target:'none',    type:'random_edition_joker', chance:0.25, desc:'25%: add Edition to random Joker', desc_cn:'25% 给随机Joker加版本' },
    { id:'t_justice',    name:'Justice',        name_cn:'正义',     target:'1',       type:'enhance', enh:'e_glass',  desc:'1 card → Glass (×2, fragile)', desc_cn:'1 张牌变为玻璃(×2但易碎)' },
    { id:'t_hanged',     name:'The Hanged Man', name_cn:'倒吊人',   target:'2',       type:'destroy',              desc:'Destroy 2 selected cards', desc_cn:'销毁 2 张选中牌' },
    { id:'t_death',      name:'Death',          name_cn:'死神',     target:'2',       type:'convert_left_to_right',desc:'Left card becomes copy of right', desc_cn:'左牌变成右牌的复制' },
    { id:'t_temperance', name:'Temperance',     name_cn:'节制',     target:'none',    type:'sum_joker_sell', cap:50, desc:'Gain sum of Joker sell values (max $50)', desc_cn:'获得Joker售价总和($50上限)' },
    { id:'t_devil',      name:'The Devil',      name_cn:'恶魔',     target:'1',       type:'enhance', enh:'e_gold',   desc:'1 card → Gold (+$3 end of round)', desc_cn:'1 张牌变为黄金(回合末+$3)' },
    { id:'t_tower',      name:'The Tower',      name_cn:'高塔',     target:'1',       type:'enhance', enh:'e_stone',  desc:'1 card → Stone (+50 Chips)', desc_cn:'1 张牌变为石头(+50筹码无花色)' },
    { id:'t_star',       name:'The Star',       name_cn:'星星',     target:'3',       type:'convert_suit', suit:'♦', desc:'3 cards → Diamonds', desc_cn:'3 张牌变方块' },
    { id:'t_moon',       name:'The Moon',       name_cn:'月亮',     target:'3',       type:'convert_suit', suit:'♣', desc:'3 cards → Clubs', desc_cn:'3 张牌变梅花' },
    { id:'t_sun',        name:'The Sun',        name_cn:'太阳',     target:'3',       type:'convert_suit', suit:'♥', desc:'3 cards → Hearts', desc_cn:'3 张牌变红桃' },
    { id:'t_judgement',  name:'Judgement',      name_cn:'审判',     target:'none',    type:'create_joker', count:1, desc:'Create 1 random Joker', desc_cn:'生成 1 张随机 Joker' },
    { id:'t_world',      name:'The World',      name_cn:'世界',     target:'3',       type:'convert_suit', suit:'♠', desc:'3 cards → Spades', desc_cn:'3 张牌变黑桃' },
  ],

  // ============ 卡牌强化 ============
  enhancements: [
    { id:'e_bonus', name:'奖励', color:'#60A5FA', effect:'add_chips', value:30, desc:'计分+30筹码' },
    { id:'e_mult',  name:'倍率', color:'#EF4444', effect:'add_mult',  value:4,  desc:'计分+4倍率' },
    { id:'e_wild',  name:'百搭', color:'#A855F7', effect:'any_suit',            desc:'视为任意花色' },
    { id:'e_glass', name:'玻璃', color:'#67E8F9', effect:'x_mult_break', value:2, break:0.25, desc:'×2倍率，25%碎裂' },
    { id:'e_steel', name:'钢铁', color:'#9CA3AF', effect:'x_mult_in_hand', value:1.5, desc:'在手×1.5倍率' },
    { id:'e_stone', name:'石头', color:'#78716C', effect:'stone',  value:50, desc:'+50筹码，无花色无点数' },
    { id:'e_gold',  name:'黄金', color:'#FBBF24', effect:'money_eor', value:3,  desc:'回合末若在手+$3' },
    { id:'e_lucky', name:'幸运', color:'#34D399', effect:'lucky',  chance_mult:0.2, val_mult:20, chance_money:0.067, val_money:20, desc:'20%+20倍率，6.7%+$20' },
  ],

  // ============ 版本（牌/Joker 通用） ============
  editions: [
    { id:'ed_base',     name:'Base',       name_cn:'普通', weight:96,  effect:'none' },
    { id:'ed_foil',     name:'Foil',       name_cn:'金箔', weight:2,   effect:'add_chips', value:50,  color:'#60A5FA' },
    { id:'ed_holo',     name:'Holographic',name_cn:'全息', weight:1.4, effect:'add_mult',  value:10,  color:'#F472B6' },
    { id:'ed_poly',     name:'Polychrome', name_cn:'霓彩', weight:0.5, effect:'x_mult',    value:1.5, color:'#A855F7' },
    { id:'ed_negative', name:'Negative',   name_cn:'负面', weight:0.1, effect:'no_slot',              color:'#1F2937' },
  ],

  // ============ 封印（仅扑克牌） ============
  seals: [
    { id:'s_red',    name:'红封印', color:'#DC2626', effect:'retrigger',        desc:'计分时再触发1次' },
    { id:'s_blue',   name:'蓝封印', color:'#3B82F6', effect:'create_planet_eor',desc:'回合末在手生成对应行星' },
    { id:'s_gold',   name:'金封印', color:'#FBBF24', effect:'money_on_score', value:3, desc:'计分时+$3' },
    { id:'s_purple', name:'紫封印', color:'#A855F7', effect:'create_tarot_on_discard', desc:'被弃时生成1张塔罗' },
  ],

  // ============ 18 凭证（商店永久升级） ============
  vouchers: [
    { id:'v_overstock',   tier:1, name:'Overstock',    name_cn:'进货扩容', price:10, type:'shop_slots', value:1, desc:'+1 shop slot', desc_cn:'商店槽位+1' },
    { id:'v_overstock_2', tier:2, name:'Overstock+',   name_cn:'进货扩容+',price:10, requires:'v_overstock', type:'shop_slots', value:1, desc:'+1 more shop slot', desc_cn:'商店槽位再+1' },
    { id:'v_clearance',   tier:1, name:'Clearance',    name_cn:'清仓折扣', price:10, type:'shop_discount', value:0.25, desc:'-25% shop prices', desc_cn:'商品价格-25%' },
    { id:'v_liquidation', tier:2, name:'Liquidation',  name_cn:'破产清算', price:10, requires:'v_clearance', type:'shop_discount', value:0.25, desc:'-25% more off prices', desc_cn:'商品价格再-25%' },
    { id:'v_hone',        tier:1, name:'Hone',         name_cn:'技艺打磨', price:10, type:'edition_rate', value:2, desc:'Edition rate ×2', desc_cn:'版本出现率×2' },
    { id:'v_glow_up',     tier:2, name:'Glow Up',      name_cn:'极致打磨', price:10, requires:'v_hone', type:'edition_rate', value:2, desc:'Edition rate ×2 again', desc_cn:'版本出现率再×2' },
    { id:'v_reroll_sub',  tier:1, name:'Reroll Subsidy',name_cn:'刷新补贴', price:10, type:'reroll_discount', value:2, desc:'Reroll cost -$2', desc_cn:'刷新费-$2' },
    { id:'v_reroll_glut', tier:2, name:'Reroll Glut',  name_cn:'刷新狂欢', price:10, requires:'v_reroll_sub', type:'reroll_discount', value:2, desc:'Reroll cost -$2 more', desc_cn:'刷新费再-$2' },
    { id:'v_crystal_ball',tier:1, name:'Crystal Ball',name_cn:'水晶球',   price:10, type:'consumable_slot', value:1, desc:'+1 Consumable slot', desc_cn:'消耗位+1' },
    { id:'v_telescope',   tier:1, name:'Telescope',    name_cn:'望远镜',   price:10, type:'guarantee_planet_pack', desc:'Planet pack includes most-played hand', desc_cn:'星体包必含最常打牌型的行星' },
    { id:'v_observatory', tier:2, name:'Observatory',  name_cn:'天文台',   price:15, requires:'v_telescope', type:'planet_x_mult', value:1.5, desc:'Planets in hand: ×1.5 Mult on that hand type', desc_cn:'持有行星给对应牌型×1.5倍率' },
    { id:'v_grabber',     tier:1, name:'Grabber',      name_cn:'出牌增手', price:10, type:'extra_hands_perm', value:1, desc:'+1 Hand per round', desc_cn:'每回合+1次出牌' },
    { id:'v_nacho_tong',  tier:2, name:'Nacho Tong',   name_cn:'双巧手',   price:10, requires:'v_grabber', type:'extra_hands_perm', value:1, desc:'+1 more Hand per round', desc_cn:'每回合再+1次出牌' },
    { id:'v_wasteful',    tier:1, name:'Wasteful',     name_cn:'弃牌增量', price:10, type:'extra_discards_perm', value:1, desc:'+1 Discard per round', desc_cn:'每回合+1次弃牌' },
    { id:'v_recyclomancy',tier:2, name:'Recyclomancy', name_cn:'回收术',   price:10, requires:'v_wasteful', type:'extra_discards_perm', value:1, desc:'+1 more Discard per round', desc_cn:'每回合再+1次弃牌' },
    { id:'v_seed_money',  tier:1, name:'Seed Money',   name_cn:'种子资金', price:10, type:'interest_cap', value:2, desc:'Interest cap +$2', desc_cn:'利息上限+$2' },
    { id:'v_money_tree',  tier:2, name:'Money Tree',   name_cn:'摇钱树',   price:20, requires:'v_seed_money', type:'interest_cap', value:4, desc:'Interest cap +$4 more', desc_cn:'利息上限再+$4' },
    { id:'v_antimatter',  tier:2, name:'Antimatter',   name_cn:'反物质',   price:20, requires:'v_crystal_ball', type:'extra_joker_slot', value:1, desc:'+1 Joker slot', desc_cn:'Joker槽位+1' },
  ],

  // ============ 跳过标签（跳过小/大盲注奖励） ============
  tags: [
    { id:'tag_uncommon', name:'Uncommon Tag', name_cn:'罕见Joker', desc:'Next shop: 1 Uncommon Joker', desc_cn:'下次商店出现1张罕见Joker', type:'force_rarity', value:'uncommon' },
    { id:'tag_rare',     name:'Rare Tag',     name_cn:'稀有Joker', desc:'Next shop: 1 Rare Joker', desc_cn:'下次商店出现1张稀有Joker', type:'force_rarity', value:'rare' },
    { id:'tag_foil',     name:'Foil Tag',     name_cn:'金箔标签',  desc:'Next shop Joker becomes Foil', desc_cn:'下次商店Joker变为金箔版', type:'force_edition', value:'ed_foil' },
    { id:'tag_holo',     name:'Holo Tag',     name_cn:'全息标签',  desc:'Next shop Joker becomes Holo', desc_cn:'下次商店Joker变为全息版', type:'force_edition', value:'ed_holo' },
    { id:'tag_poly',     name:'Poly Tag',     name_cn:'霓彩标签',  desc:'Next shop Joker becomes Polychrome', desc_cn:'下次商店Joker变为霓彩版', type:'force_edition', value:'ed_poly' },
    { id:'tag_negative', name:'Negative Tag', name_cn:'负面标签',  desc:'Next shop Joker becomes Negative', desc_cn:'下次商店Joker变为负面版', type:'force_edition', value:'ed_negative' },
    { id:'tag_investment',name:'Investment Tag',name_cn:'投资标签', desc:'+$25 after next Boss', desc_cn:'击败下个Boss后+$25', type:'money_on_boss', value:25 },
    { id:'tag_voucher',  name:'Voucher Tag',  name_cn:'凭证标签',  desc:'Next shop: +1 Voucher', desc_cn:'下次商店新增1张凭证', type:'extra_voucher' },
    { id:'tag_double',   name:'Double Tag',   name_cn:'双倍标签',  desc:'Duplicate next Tag', desc_cn:'复制下一个 Tag', type:'double_next' },
    { id:'tag_handy',    name:'Handy Tag',    name_cn:'增手标签',  desc:'+1 Hand this run', desc_cn:'本局永久+1次出牌', type:'extra_hand_perm', value:1 },
    { id:'tag_economy',  name:'Economy Tag',  name_cn:'经济标签',  desc:'+$10 on next shop', desc_cn:'下次商店进入+$10', type:'money_on_shop', value:10 },
    { id:'tag_orbital',  name:'Orbital Tag',  name_cn:'星轨标签',  desc:'Gain Planet for most-played hand', desc_cn:'获得最常打牌型的行星', type:'planet_most_played' },
    { id:'tag_charm',    name:'Charm Tag',    name_cn:'护符标签',  desc:'Gain 1 random Tarot', desc_cn:'获得1张随机塔罗', type:'free_tarot' },
    { id:'tag_meteor',   name:'Meteor Tag',   name_cn:'流星标签',  desc:'Gain 2 random Planets', desc_cn:'获得2张随机行星', type:'free_planets', value:2 },
    { id:'tag_coupon',   name:'Coupon Tag',   name_cn:'优惠券标签',desc:'Next Voucher half price', desc_cn:'下次凭证半价', type:'voucher_discount', value:0.5 },
    { id:'tag_garbage',  name:'Garbage Tag',  name_cn:'垃圾标签',  desc:'Destroy 2 random cards in deck', desc_cn:'销毁牌组中2张随机牌', type:'destroy_deck', value:2 },
    { id:'tag_standard', name:'标准标签',  desc:'获得1个巨型标准包',        type:'free_pack', packKind:'card', packTier:'mega' },
    { id:'tag_joker',    name:'王牌标签',  desc:'获得1个巨型王牌包',        type:'free_pack', packKind:'joker', packTier:'mega' },
    { id:'tag_jumbo',    name:'巨型标签',  desc:'获得1个随机巨型包',        type:'free_pack', packKind:'random', packTier:'mega' },
    { id:'tag_topup',    name:'补满标签',  desc:'金币至少变为$5',           type:'top_up_money', value:5 },
    { id:'tag_boss',     name:'Boss标签',  desc:'Boss盲注重掷',             type:'boss_reroll' },
    { id:'tag_skip',     name:'跳过标签',  desc:'下次跳过盲注额外获得1 Tag', type:'bonus_skip' },
    { id:'tag_legendary',name:'传说标签',  desc:'下次商店出现1张传说Joker', type:'force_rarity', value:'legendary' },
  ],

  // ============ 卡包（tier: s/m/mega，权重见 rollShopPacks） ============
  packs: [
    { id:'pk_arcana_s', name:'秘术包·小', kind:'tarot',    tier:'s',    price:4, size:3, pick:1 },
    { id:'pk_arcana_m', name:'秘术包·大', kind:'tarot',    tier:'m',    price:6, size:5, pick:2 },
    { id:'pk_arcana_x', name:'秘术包·巨', kind:'tarot',    tier:'mega', price:8, size:5, pick:2 },
    { id:'pk_celest_s', name:'星体包·小', kind:'planet',   tier:'s',    price:4, size:3, pick:1 },
    { id:'pk_celest_m', name:'星体包·大', kind:'planet',   tier:'m',    price:6, size:5, pick:2 },
    { id:'pk_celest_x', name:'星体包·巨', kind:'planet',   tier:'mega', price:8, size:5, pick:2 },
    { id:'pk_std_s',    name:'标准包·小', kind:'card',     tier:'s',    price:4, size:3, pick:1 },
    { id:'pk_std_m',    name:'标准包·大', kind:'card',     tier:'m',    price:6, size:5, pick:2 },
    { id:'pk_std_x',    name:'标准包·巨', kind:'card',     tier:'mega', price:8, size:5, pick:2 },
    { id:'pk_buff_s',   name:'王牌包·小', kind:'joker',    tier:'s',    price:4, size:2, pick:1 },
    { id:'pk_buff_m',   name:'王牌包·大', kind:'joker',    tier:'m',    price:6, size:3, pick:1 },
    { id:'pk_buff_x',   name:'王牌包·巨', kind:'joker',    tier:'mega', price:8, size:4, pick:2 },
  ],

  packTierWeight: { s: 8, m: 4, mega: 1 },

  // ============ 难度注（Stake）— 8 档累积效果 ============
  stakeModTier: {
    no_small_reward: 2,
    fast_ante: 3,
    eternal_jokers: 4,
    less_discards: 5,
    faster_ante: 6,
    perishable_jokers: 7,
    rental_jokers: 8,
  },

  stakes: [
    { id:'stake_white',  name:'Smoke Stake',  name_cn:'雾注', color:'#f4f1e8', tier:1, desc:'Base Difficulty', desc_cn:'基础难度' },
    { id:'stake_red',    name:'Scarlet Stake', name_cn:'绯注', color:'#ef4444', tier:2, desc:'Small Blind gives no reward money', desc_cn:'小盲注无奖励金' },
    { id:'stake_green',  name:'Viridian Stake',name_cn:'翠注', color:'#22c55e', tier:3, desc:'Required score scales faster for each Ante', desc_cn:'每个 Ante 所需分数增长更快' },
    { id:'stake_black',  name:'Onyx Stake',   name_cn:'墨注', color:'#374151', tier:4, desc:'30% shop Jokers are Eternal', desc_cn:'商店 Joker 30% 为永恒（不可出售）' },
    { id:'stake_blue',   name:'Azure Stake',  name_cn:'蓝注', color:'#3b82f6', tier:5, desc:'−1 Discard', desc_cn:'−1 弃牌' },
    { id:'stake_purple', name:'Violet Stake', name_cn:'紫注', color:'#a855f7', tier:6, desc:'Required score scales even faster for each Ante', desc_cn:'每个 Ante 所需分数增长更快（加强）' },
    { id:'stake_orange', name:'Amber Stake',  name_cn:'琥珀注', color:'#f97316', tier:7, desc:'30% shop Jokers are Perishable', desc_cn:'商店 Joker 30% 为易腐（5 回合后失效）' },
    { id:'stake_gold',   name:'Gilded Stake', name_cn:'金注', color:'#fbbf24', tier:8, desc:'30% shop Jokers are Rental', desc_cn:'商店 Joker 30% 为租赁（每回合 −$3）' },
  ],

  // ============ 牌组（开局配置） ============
  decks: [
    { id:'deck_red',    name:'Crimson Deck', name_cn:'深红牌组', color:'#c0392b', perk:'discards_+1', desc:'+1 Discard each round', desc_cn:'每回合 +1 弃牌' },
    { id:'deck_blue',   name:'Azure Deck',   name_cn:'碧蓝牌组', color:'#2980b9', perk:'hands_+1',    desc:'+1 Hand each round', desc_cn:'每回合 +1 出牌' },
    { id:'deck_yellow', name:'Amber Deck',   name_cn:'琥珀牌组', color:'#d4a017', perk:'money_+10',   desc:'Start with extra $10', desc_cn:'开局 +$10' },
    { id:'deck_green',  name:'Jade Deck',    name_cn:'翡翠牌组', color:'#27ae60', perk:'no_interest', desc:'No interest, +$2 per unused Hand', desc_cn:'无利息，未用出牌每张 +$2' },
    { id:'deck_black',  name:'Obsidian Deck',name_cn:'黑曜牌组', color:'#2c3e50', perk:'joker_+1',    desc:'+1 Joker slot, −1 Hand', desc_cn:'+1 Joker 槽，−1 出牌' },
    { id:'deck_magic',  name:'Arcane Deck',  name_cn:'奥术牌组', color:'#8e44ad', perk:'start_magic', desc:'+1 Consumable slot & 2× Fool', desc_cn:'+1 消耗位，2×愚者塔罗' },
  ],

  // ============ 工具方法 ============
  getBlindScore(ante, blindId, stakeId = 'stake_white') {
    const base = this.ante_base[ante] || 300;
    const tpl = this.blindTemplate.find(b => b.id === blindId);
    const score = base * (tpl ? tpl.mult : 1);
    return Math.round(score * this.getAnteScoreMult(stakeId, ante));
  },
  getStake(id) { return this.stakes.find(s => s.id === id) || this.stakes[0]; },
  getDeck(id)  { return this.decks.find(d => d.id === id) || this.decks[0]; },
  getStakeTier(stakeId) { return this.getStake(stakeId)?.tier || 1; },
  hasStakeMod(stakeId, mod) {
    const need = this.stakeModTier[mod];
    if (!need) return false;
    return this.getStakeTier(stakeId) >= need;
  },
  getAnteScoreMult(stakeId, ante) {
    const tier = this.getStakeTier(stakeId);
    let extra = 0;
    if (tier >= 3) extra += Math.max(0, ante - 1) * 0.12;
    if (tier >= 6) extra += Math.max(0, ante - 1) * 0.12;
    return 1 + extra;
  },
  getHand(id)    { return this.hands.find(h => h.id === id); },
  getJoker(id)   { return this.jokers.find(j => j.id === id); },
  getTarot(id)   { return this.tarots.find(t => t.id === id); },
  getPlanet(id)  { return this.planets.find(p => p.id === id); },
  getBoss(id)    { return this.bosses.find(b => b.id === id); },
  getEnhance(id) { return this.enhancements.find(e => e.id === id); },
  getEdition(id) { return this.editions.find(e => e.id === id); },
  getSeal(id)    { return this.seals.find(s => s.id === id); },
  getVoucher(id) { return this.vouchers.find(v => v.id === id); },
  getTag(id)     { return this.tags.find(t => t.id === id); },
  getPack(id)     { return this.packs.find(p => p.id === id); },

  getPackByKindTier(kind, tier) {
    return this.packs.find(p => p.kind === kind && p.tier === tier);
  },

  randomMegaPack() {
    const kinds = ['tarot', 'planet', 'card', 'joker'];
    const kind = kinds[Math.floor(Math.random() * kinds.length)];
    return this.getPackByKindTier(kind, 'mega') || this.packs.find(p => p.tier === 'mega');
  },

  randomJoker(rarity = null) {
    let pool = this.jokers;
    if (rarity) pool = pool.filter(j => j.rarity === rarity);
    else {
      const r = Math.random() * 100;
      const tier = r < 70 ? 'common' : r < 95 ? 'uncommon' : r < 99.5 ? 'rare' : 'legendary';
      pool = this.jokers.filter(j => j.rarity === tier);
    }
    if (!pool.length) pool = this.jokers;
    return pool[Math.floor(Math.random() * pool.length)];
  },

  rollShopJokers(n, excludeIds = []) {
    const pool = this.jokers.filter(j => !excludeIds.includes(j.id));
    const out = [];
    while (out.length < n && pool.length) {
      const i = Math.floor(Math.random() * pool.length);
      out.push(pool.splice(i, 1)[0]);
    }
    return out;
  },

  rollShopPacks(count = 2) {
    const weights = this.packTierWeight;
    const pool = [...this.packs];
    const out = [];
    while (out.length < count && pool.length) {
      let total = 0;
      const wlist = pool.map(p => {
        const w = weights[p.tier] || weights.s || 1;
        total += w;
        return w;
      });
      let r = Math.random() * total;
      let idx = 0;
      for (let i = 0; i < pool.length; i++) {
        r -= wlist[i];
        if (r <= 0) { idx = i; break; }
      }
      out.push({ ...pool.splice(idx, 1)[0] });
    }
    return out;
  },

  rollEdition(rateMult = 1) {
    const weighted = this.editions.map(e => ({
      ...e,
      w: e.id === 'ed_base' ? e.weight : e.weight * rateMult,
    }));
    const total = weighted.reduce((s, e) => s + e.w, 0);
    let r = Math.random() * total;
    for (const e of weighted) {
      r -= e.w;
      if (r <= 0) return e;
    }
    return this.editions[0];
  },

  getAnteHelp(ante) {
    return this.ante_help[ante] || null;
  },

  pickBoss(ante) {
    if (ante === 1) {
      const warmup = this.bosses.find(b => b.id === 'boss_warmup');
      if (warmup) return warmup;
    }
    if (ante >= 8) {
      const finalBoss = this.bosses.find(b => b.final);
      if (finalBoss) return finalBoss;
    }
    const harshBefore = {
      2: ['boss_needle', 'boss_shackle'],
      3: ['boss_needle', 'boss_shackle'],
      4: ['boss_needle'],
      5: ['boss_serpent'],
    };
    const block = new Set();
    for (let a = 2; a <= ante; a++) {
      (harshBefore[a] || []).forEach(id => block.add(id));
    }
    let pool = this.bosses.filter(b =>
      b.min_ante <= ante && !b.final && !b.ante_only && !block.has(b.id)
    );
    if (!pool.length) {
      pool = this.bosses.filter(b => b.min_ante <= ante && !b.final && !b.ante_only);
    }
    return pool[Math.floor(Math.random() * pool.length)];
  },

  randomTag() {
    const t = this.tags[Math.floor(Math.random() * this.tags.length)];
    return { ...t };
  },

  randomTarot() {
    return this.tarots[Math.floor(Math.random() * this.tarots.length)];
  },

  randomPlanet() {
    const p = this.planets[Math.floor(Math.random() * this.planets.length)];
    return { ...p };
  },

  itemLabel(item) {
    if (!item) return '';
    const cn = window.I18N?.get?.() === 'cn';
    return cn ? (item.name_cn || item.name || '') : (item.name_en || item.name || item.name_cn || '');
  },

  itemDesc(item) {
    if (!item) return '';
    const cn = window.I18N?.get?.() === 'cn';
    return cn ? (item.desc_cn || item.desc || '') : (item.desc_en || item.desc || item.desc_cn || '');
  },
};

window.JOKERS = window.GameData.jokers;
