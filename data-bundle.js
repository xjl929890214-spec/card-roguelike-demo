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
  ],

  rankChips: { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':10,'Q':10,'K':10,'A':11 },
  rankOrder: { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 },

  // ============ JOKERS OF AMERICA — 18 张功能小丑 ============
  jokers: [
    { id:'j_chip_stacker',    name:'CHIP STACKER',    name_cn:'筹码堆叠',   rarity:'common',    price:4,  cardNo:'001', theme:'chip-stacker',    type:'per_card_chips',       value:30,  desc:'+30 Chips per card' },
    { id:'j_multiplier',      name:'THE MULTIPLIER',  name_cn:'倍率小丑',   rarity:'uncommon',  price:6,  cardNo:'002', theme:'multiplier',      type:'flat_mult',            value:8,   desc:'+8 Mult' },
    { id:'j_heart_king',      name:'HEART KING',      name_cn:'红心之王',   rarity:'common',    price:4,  cardNo:'003', theme:'heart-king',      type:'per_suit_mult',        suit:'♥', value:3, desc:'Hearts: +3 Mult each' },
    { id:'j_spade_lord',      name:'SPADE LORD',      name_cn:'黑桃领主',   rarity:'uncommon',  price:5,  cardNo:'004', theme:'spade-lord',      type:'per_suit_chips',       suit:'♠', value:15, desc:'Spades: +15 Chips each' },
    { id:'j_diamond_hustler', name:'DIAMOND HUSTLER', name_cn:'方块大亨',   rarity:'rare',      price:8,  cardNo:'005', theme:'diamond-hustler', type:'money_per_suit',     suit:'♦', value:1, desc:'Diamonds: +$1 each' },
    { id:'j_club_baron',      name:'CLUB BARON',      name_cn:'梅花男爵',   rarity:'common',    price:4,  cardNo:'006', theme:'club-baron',      type:'per_suit_chips',       suit:'♣', value:15, desc:'Clubs: +15 Chips each' },
    { id:'j_twin_trouble',    name:'TWIN TROUBLE',    name_cn:'双子麻烦',   rarity:'rare',      price:8,  cardNo:'007', theme:'twin-trouble',    type:'pair_to_three',        desc:'Pair → Three of a Kind' },
    { id:'j_ace_high',        name:'ACE HIGH',        name_cn:'Ace 王牌',   rarity:'uncommon',  price:5,  cardNo:'008', theme:'ace-high',        type:'per_rank_chips',       rank:'A', value:50, desc:'Aces: +50 Chips each' },
    { id:'j_burn_baron',      name:'BURN BARON',      name_cn:'燃烧男爵',   rarity:'rare',      price:8,  cardNo:'009', theme:'burn-baron',      type:'discard_mult',         value:15, desc:'Discard: +15 Mult per card' },
    { id:'j_time_loop',       name:'TIME LOOP',       name_cn:'时间循环',   rarity:'rare',      price:8,  cardNo:'010', theme:'time-loop',       type:'retrigger_first',      desc:'Retrigger first scored card' },
    { id:'j_ol_glory',        name:"OL' GLORY",       name_cn:'老荣耀',     rarity:'legendary', price:15, cardNo:'011', theme:'ol-glory',        type:'cond_mixed_color_x',   value:3,  desc:'×3 Mult on red+black mix' },
    { id:'j_the_house',       name:'THE HOUSE',       name_cn:'庄家',       rarity:'legendary', price:20, cardNo:'012', theme:'the-house',       type:'round_money',          value:5,  desc:'+$5 every round' },
    { id:'j_x_factor',        name:'THE X-FACTOR',    name_cn:'X 因子',     rarity:'rare',      price:8,  cardNo:'013', theme:'x-factor',        type:'x_mult',               value:1.5, desc:'×1.5 Mult after each hand' },
    { id:'j_flush_royale',    name:'FLUSH ROYALE',    name_cn:'同花皇家',   rarity:'uncommon',  price:6,  cardNo:'014', theme:'flush-royale',    type:'on_hand_mult',         hand:'flush', value:50, desc:'+50 Mult on Flush' },
    { id:'j_royal_court',     name:'ROYAL COURT',     name_cn:'皇家宫廷',   rarity:'uncommon',  price:6,  cardNo:'015', theme:'royal-court',     type:'per_face_chips',       value:30, desc:'Face cards: +30 Chips each' },
    { id:'j_extra_hand',      name:'EXTRA HAND',      name_cn:'额外一手',   rarity:'common',    price:4,  cardNo:'016', theme:'extra-hand',      type:'passive_extra_hand',   value:1,  desc:'+1 Hand per round' },
    { id:'j_growth_spurt',    name:'GROWTH SPURT',    name_cn:'成长爆发',   rarity:'rare',      price:8,  cardNo:'017', theme:'growth-spurt',    type:'escalating_mult',      value:1,  desc:'+1 Mult per hand (permanent)' },
    { id:'j_lucky_dice',      name:'LUCKY DICE',      name_cn:'幸运骰子',   rarity:'uncommon',  price:6,  cardNo:'018', theme:'lucky-dice',      type:'chance_x_mult',        chance:0.25, value:2, desc:'25% chance: ×2 Mult' },
  ],

  // ============ 8 Ante × 3 盲注 ============
  ante_base: { 1:300, 2:800, 3:2000, 4:5000, 5:11000, 6:20000, 7:35000, 8:50000 },
  blindTemplate: [
    { id:'small', name:'Small Blind', cn:'小盲注',   mult:1.0, reward:3, skippable:true,  color:'#3B82F6' },
    { id:'big',   name:'Big Blind',   cn:'大盲注',   mult:1.5, reward:4, skippable:true,  color:'#F59E0B' },
    { id:'boss',  name:'Boss Blind',  cn:'Boss盲注', mult:2.0, reward:5, skippable:false, color:'#EF4444' },
  ],

  // ============ 12 Boss 盲注效果 ============
  bosses: [
    { id:'boss_blackout', name:'黑幕',     min_ante:1, type:'hide_card_values',    desc:'手牌背面朝下，出牌时翻开' },
    { id:'boss_chain',    name:'锁链',     min_ante:1, type:'lock_random_card',    desc:'每回合开始锁住 1 张手牌' },
    { id:'boss_rust',     name:'锈蚀',     min_ante:1, type:'debuff_suit', suit:'♣', desc:'梅花牌不计分' },
    { id:'boss_mist',     name:'迷雾',     min_ante:2, type:'debuff_suit', suit:'♥', desc:'红桃牌不计分' },
    { id:'boss_ash',      name:'灰烬',     min_ante:2, type:'debuff_suit', suit:'♠', desc:'黑桃牌不计分' },
    { id:'boss_thorn',    name:'荆棘',     min_ante:2, type:'debuff_suit', suit:'♦', desc:'方块牌不计分' },
    { id:'boss_tightrope',name:'走索人',   min_ante:2, type:'reduce_hands',  value:1, desc:'本盲注 -1 次出牌' },
    { id:'boss_dust',     name:'尘暴',     min_ante:3, type:'reduce_discards', value:2, desc:'本盲注 -2 次弃牌' },
    { id:'boss_house',    name:'高墙',     min_ante:3, type:'first_hand_facedown', desc:'第一手出的牌背面朝下' },
    { id:'boss_clock',    name:'钟摆',     min_ante:3, type:'rotating_debuff',     desc:'每出 1 手轮流禁用一种花色' },
    { id:'boss_serpent',  name:'深海蛇',   min_ante:4, type:'force_hand_size', value:3, desc:'出牌后下次只能抽 3 张' },
    { id:'boss_void',     name:'虚空',     min_ante:6, type:'disable_jokers', final:true, desc:'所有 Joker 失效（终局Boss）' },
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
    { id:'pl_pluto',   name:'冥王星', hand:'high_card',       chips:10, mult:1, price:3 },
    { id:'pl_mercury', name:'水星',   hand:'pair',            chips:15, mult:1, price:3 },
    { id:'pl_uranus',  name:'天王星', hand:'two_pair',        chips:20, mult:1, price:3 },
    { id:'pl_venus',   name:'金星',   hand:'three_of_a_kind', chips:20, mult:2, price:3 },
    { id:'pl_saturn',  name:'土星',   hand:'straight',        chips:30, mult:3, price:3 },
    { id:'pl_jupiter', name:'木星',   hand:'flush',           chips:15, mult:2, price:3 },
    { id:'pl_earth',   name:'地球',   hand:'full_house',      chips:25, mult:2, price:3 },
    { id:'pl_mars',    name:'火星',   hand:'four_of_a_kind',  chips:30, mult:3, price:3 },
    { id:'pl_neptune', name:'海王星', hand:'straight_flush',  chips:40, mult:4, price:3 },
  ],

  // ============ 22 塔罗（公共领域 Major Arcana 名称） ============
  tarots: [
    { id:'t_fool',       name:'愚者',     target:'none',    type:'spawn_last_used',  desc:'生成上次用过的塔罗或行星' },
    { id:'t_magician',   name:'魔术师',   target:'2',       type:'enhance', enh:'lucky',  desc:'2 张牌变为幸运' },
    { id:'t_priestess',  name:'女祭司',   target:'none',    type:'create_planet', count:2, desc:'生成 2 张随机行星' },
    { id:'t_empress',    name:'皇后',     target:'2',       type:'enhance', enh:'mult',   desc:'2 张牌变为倍率' },
    { id:'t_emperor',    name:'皇帝',     target:'none',    type:'create_tarot',  count:2, desc:'生成 2 张随机塔罗' },
    { id:'t_hierophant', name:'教皇',     target:'2',       type:'enhance', enh:'bonus',  desc:'2 张牌变为奖励(+30筹码)' },
    { id:'t_lovers',     name:'恋人',     target:'1',       type:'enhance', enh:'wild',   desc:'1 张牌变为百搭(任意花色)' },
    { id:'t_chariot',    name:'战车',     target:'1',       type:'enhance', enh:'steel',  desc:'1 张牌变为钢铁(在手×1.5)' },
    { id:'t_strength',   name:'力量',     target:'2',       type:'rank_up',  value:1,     desc:'2 张牌点数 +1' },
    { id:'t_hermit',     name:'隐者',     target:'none',    type:'money_double_cap', cap:20, desc:'金币翻倍(上限+$20)' },
    { id:'t_wheel',      name:'命运之轮', target:'none',    type:'random_edition_joker', chance:0.25, desc:'25% 给随机Joker加版本' },
    { id:'t_justice',    name:'正义',     target:'1',       type:'enhance', enh:'glass',  desc:'1 张牌变为玻璃(×2但易碎)' },
    { id:'t_hanged',     name:'倒吊人',   target:'2',       type:'destroy',              desc:'销毁 2 张选中牌' },
    { id:'t_death',      name:'死神',     target:'2',       type:'convert_left_to_right',desc:'左牌变成右牌的复制' },
    { id:'t_temperance', name:'节制',     target:'none',    type:'sum_joker_sell', cap:50, desc:'获得Joker售价总和($50上限)' },
    { id:'t_devil',      name:'恶魔',     target:'1',       type:'enhance', enh:'gold',   desc:'1 张牌变为黄金(回合末+$3)' },
    { id:'t_tower',      name:'高塔',     target:'1',       type:'enhance', enh:'stone',  desc:'1 张牌变为石头(+50筹码无花色)' },
    { id:'t_star',       name:'星星',     target:'3',       type:'convert_suit', suit:'♦', desc:'3 张牌变方块' },
    { id:'t_moon',       name:'月亮',     target:'3',       type:'convert_suit', suit:'♣', desc:'3 张牌变梅花' },
    { id:'t_sun',        name:'太阳',     target:'3',       type:'convert_suit', suit:'♥', desc:'3 张牌变红桃' },
    { id:'t_judgement',  name:'审判',     target:'none',    type:'create_joker', count:1, desc:'生成 1 张随机 Joker' },
    { id:'t_world',      name:'世界',     target:'3',       type:'convert_suit', suit:'♠', desc:'3 张牌变黑桃' },
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
    { id:'ed_base',     name:'普通', weight:96,  effect:'none' },
    { id:'ed_foil',     name:'金箔', weight:2,   effect:'add_chips', value:50,  color:'#60A5FA' },
    { id:'ed_holo',     name:'全息', weight:1.4, effect:'add_mult',  value:10,  color:'#F472B6' },
    { id:'ed_poly',     name:'霓彩', weight:0.5, effect:'x_mult',    value:1.5, color:'#A855F7' },
    { id:'ed_negative', name:'负面', weight:0.1, effect:'no_slot',              color:'#1F2937' },
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
    { id:'v_overstock',   tier:1, name:'进货扩容', price:10, type:'shop_slots', value:1, desc:'商店槽位+1' },
    { id:'v_overstock_2', tier:2, name:'进货扩容+',price:10, requires:'v_overstock', type:'shop_slots', value:1, desc:'商店槽位再+1' },
    { id:'v_clearance',   tier:1, name:'清仓折扣', price:10, type:'shop_discount', value:0.25, desc:'商品价格-25%' },
    { id:'v_liquidation', tier:2, name:'破产清算', price:10, requires:'v_clearance', type:'shop_discount', value:0.25, desc:'商品价格再-25%' },
    { id:'v_hone',        tier:1, name:'技艺打磨', price:10, type:'edition_rate', value:2, desc:'版本出现率×2' },
    { id:'v_glow_up',     tier:2, name:'极致打磨', price:10, requires:'v_hone', type:'edition_rate', value:2, desc:'版本出现率再×2' },
    { id:'v_reroll_sub',  tier:1, name:'刷新补贴', price:10, type:'reroll_discount', value:2, desc:'刷新费-$2' },
    { id:'v_reroll_glut', tier:2, name:'刷新狂欢', price:10, requires:'v_reroll_sub', type:'reroll_discount', value:2, desc:'刷新费再-$2' },
    { id:'v_crystal_ball',tier:1, name:'水晶球',   price:10, type:'consumable_slot', value:1, desc:'消耗位+1' },
    { id:'v_telescope',   tier:1, name:'望远镜',   price:10, type:'guarantee_planet_pack', desc:'天体包必含最常打牌型的行星' },
    { id:'v_observatory', tier:2, name:'天文台',   price:15, requires:'v_telescope', type:'planet_x_mult', value:1.5, desc:'持有行星给对应牌型×1.5倍率' },
    { id:'v_grabber',     tier:1, name:'出牌增手', price:10, type:'extra_hands_perm', value:1, desc:'每回合+1次出牌' },
    { id:'v_nacho_tong',  tier:2, name:'出牌再增', price:10, requires:'v_grabber', type:'extra_hands_perm', value:1, desc:'每回合再+1次出牌' },
    { id:'v_wasteful',    tier:1, name:'弃牌增量', price:10, type:'extra_discards_perm', value:1, desc:'每回合+1次弃牌' },
    { id:'v_recyclomancy',tier:2, name:'回收术',   price:10, requires:'v_wasteful', type:'extra_discards_perm', value:1, desc:'每回合再+1次弃牌' },
    { id:'v_seed_money',  tier:1, name:'种子资金', price:10, type:'interest_cap', value:2, desc:'利息上限+$2' },
    { id:'v_money_tree',  tier:2, name:'摇钱树',   price:20, requires:'v_seed_money', type:'interest_cap', value:4, desc:'利息上限再+$4' },
    { id:'v_antimatter',  tier:2, name:'反物质',   price:20, requires:'v_blank', type:'extra_joker_slot', value:1, desc:'Joker槽位+1' },
  ],

  // ============ 跳过标签（跳过小/大盲注奖励） ============
  tags: [
    { id:'tag_uncommon', name:'罕见Joker', desc:'下次商店出现1张罕见Joker', type:'force_rarity', value:'uncommon' },
    { id:'tag_rare',     name:'稀有Joker', desc:'下次商店出现1张稀有Joker', type:'force_rarity', value:'rare' },
    { id:'tag_foil',     name:'金箔标签',  desc:'下次商店Joker变为金箔版', type:'force_edition', value:'ed_foil' },
    { id:'tag_holo',     name:'全息标签',  desc:'下次商店Joker变为全息版', type:'force_edition', value:'ed_holo' },
    { id:'tag_poly',     name:'霓彩标签',  desc:'下次商店Joker变为霓彩版', type:'force_edition', value:'ed_poly' },
    { id:'tag_negative', name:'负面标签',  desc:'下次商店Joker变为负面版', type:'force_edition', value:'ed_negative' },
    { id:'tag_investment',name:'投资标签', desc:'击败下个Boss后+$25',      type:'money_on_boss', value:25 },
    { id:'tag_voucher',  name:'凭证标签',  desc:'下次商店新增1张凭证',     type:'extra_voucher' },
    { id:'tag_double',   name:'双倍标签',  desc:'复制下一个 Tag',          type:'double_next' },
    { id:'tag_handy',    name:'增手标签',  desc:'本局永久+1次出牌',        type:'extra_hand_perm', value:1 },
  ],

  // ============ 卡包 ============
  packs: [
    { id:'pk_arcana_s', name:'塔罗包·小', kind:'tarot',    price:4, size:3, pick:1 },
    { id:'pk_arcana_m', name:'塔罗包·大', kind:'tarot',    price:6, size:5, pick:2 },
    { id:'pk_celest_s', name:'天体包·小', kind:'planet',   price:4, size:3, pick:1 },
    { id:'pk_celest_m', name:'天体包·大', kind:'planet',   price:6, size:5, pick:2 },
    { id:'pk_std_s',    name:'标准包·小', kind:'card',     price:4, size:3, pick:1 },
    { id:'pk_std_m',    name:'标准包·大', kind:'card',     price:6, size:5, pick:2 },
    { id:'pk_buff_s',   name:'小丑包·小', kind:'joker',    price:4, size:2, pick:1 },
    { id:'pk_buff_m',   name:'小丑包·大', kind:'joker',    price:6, size:3, pick:1 },
  ],

  // ============ 牌组（开局配置） ============
  decks: [
    { id:'deck_red',    name:'红色牌组', perk:'discards_+1', desc:'+1 弃牌/回合' },
    { id:'deck_blue',   name:'蓝色牌组', perk:'hands_+1',    desc:'+1 出牌/回合' },
    { id:'deck_yellow', name:'黄色牌组', perk:'money_+10',   desc:'开局 +$10' },
    { id:'deck_green',  name:'绿色牌组', perk:'no_interest', desc:'无利息但 +$2/未用出牌' },
    { id:'deck_black',  name:'黑色牌组', perk:'joker_+1',    desc:'Joker槽+1 但 -1 出牌' },
    { id:'deck_magic',  name:'魔法牌组', perk:'start_magician_crystal', desc:'起始送魔术师塔罗+水晶球' },
  ],

  // ============ 工具方法 ============
  getBlindScore(ante, blindId) {
    const base = this.ante_base[ante] || 300;
    const tpl = this.blindTemplate.find(b => b.id === blindId);
    return Math.round(base * (tpl ? tpl.mult : 1));
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
  getPack(id)    { return this.packs.find(p => p.id === id); },

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

  rollEdition() {
    const total = this.editions.reduce((s, e) => s + e.weight, 0);
    let r = Math.random() * total;
    for (const e of this.editions) {
      r -= e.weight;
      if (r <= 0) return e;
    }
    return this.editions[0];
  },

  pickBoss(ante) {
    if (ante === 8) {
      const finalBoss = this.bosses.find(b => b.final);
      if (finalBoss) return finalBoss;
    }
    const pool = this.bosses.filter(b => b.min_ante <= ante && !b.final);
    return pool[Math.floor(Math.random() * pool.length)];
  },

  randomTag() {
    return this.tags[Math.floor(Math.random() * this.tags.length)];
  },

  randomTarot() {
    return this.tarots[Math.floor(Math.random() * this.tarots.length)];
  },

  randomPlanet() {
    return this.planets[Math.floor(Math.random() * this.planets.length)];
  },
};

window.JOKERS = window.GameData.jokers;
