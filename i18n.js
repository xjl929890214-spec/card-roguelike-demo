/* ============================================================
 *  i18n.js  —  中英文切换
 *  - 左下角浮动按钮 EN / CN
 *  - 仅翻译静态 UI；跳过动态游戏区，避免 MutationObserver 死循环
 * ============================================================ */

(function () {
  const KEY = window.JokerState?.storage?.lang || 'joker_state_lang_v1';
  const SKIP_SEL = [
    '.collection-modal', '.card-gallery-modal', '.settings-modal', '#i18n-toggle',
    '.pixel-joker', '.joker-card-img', '.joker-tooltip', '.card-art',
    '.hand-cards', '#handCards', '#jokerRow', '#scorePopup',
    '.card', '.shop-item', '.modal-box', '.no-i18n',
  ].join(', ');

  const dict = {
    'PLAY':       { cn: '开 始' },
    'OPTIONS':    { cn: '选 项' },
    'QUIT':       { cn: '退 出' },
    'COLLECTION': { cn: '图 鉴' },
    'CONTINUE':   { cn: '继 续' },
    'Profile':    { cn: '档案' },
    'Small Blind': { cn: '小盲注' },
    'Big Blind':   { cn: '大盲注' },
    'Boss Blind':  { cn: 'Boss盲注' },
    'SMALL':       { cn: '小' },
    'BIG':         { cn: '大' },
    'BLIND':       { cn: '盲' },
    'BOSS':        { cn: 'Boss' },
    'Score at least': { cn: '需达到' },
    'Reward:':     { cn: '奖励:' },
    'Round\nscore':{ cn: '本轮\n分数' },
    'Round score': { cn: '本轮分数' },
    'Run\nInfo':   { cn: '本局\n信息' },
    'Run Info':    { cn: '本局信息' },
    'Options':     { cn: '选项' },
    'Hands':       { cn: '出牌' },
    'Discards':    { cn: '弃牌' },
    'Ante':        { cn: '回合' },
    'Round':       { cn: '局' },
    'Play Hand':   { cn: '出牌' },
    'Sort Hand':   { cn: '排序' },
    'Rank':        { cn: '点数' },
    'Suit':        { cn: '花色' },
    'Discard':     { cn: '弃牌' },
    'SHOP':        { cn: '商店' },
    'SUPPLY':      { cn: '补给站' },
    'Restock for the run': { cn: '备战下一关' },
    'Improve your run!': { cn: '增强你的牌组！' },
    'Next\nRound': { cn: '下一\n回合' },
    'Next Round':  { cn: '下一回合' },
    'Reroll':      { cn: '刷新' },
    'VOUCHER':     { cn: '券' },
    'JOKERS':      { cn: '王牌' },
    'CONSUMABLES': { cn: '消耗品' },
    'JOKER\nPACK':     { cn: '王牌\n卡包' },
    'MYSTIC\nPACK':    { cn: '秘术\n卡包' },
    'STAR\nPACK':      { cn: '星体\n卡包' },
    'STANDARD\nPACK': { cn: '标准\n卡包' },
    'Round Complete!':       { cn: '本轮通关！' },
    'Small Blind Defeated!': { cn: '击败小盲注！' },
    'Big Blind Defeated!':   { cn: '击败大盲注！' },
    'Boss Blind Defeated!':  { cn: '击败Boss盲注！' },
    'Defeated.':             { cn: '失败' },
    'Better luck next time': { cn: '下次好运' },
    'Cash Out':              { cn: '领取奖励' },
    'Restart':               { cn: '重新开始' },
    'Play Blind':            { cn: '开始挑战' },
    'Skip → Tag':            { cn: '跳过·领标签' },
    'Skip':                  { cn: '跳过' },
    'Close':                 { cn: '关闭' },
    'Deck':                  { cn: '牌组' },
    'Pick 1':                { cn: '选 1 张' },
    'Pack':                  { cn: '卡包' },
    'Back to Shop':          { cn: '返回商店' },
    'New Run':               { cn: '新局' },
    'Daily Run':             { cn: '每日挑战' },
    'RUN SETUP':             { cn: '开局设置' },
    'New Run Setup':         { cn: '配置新局' },
    'Seeded Run':            { cn: '种子局' },
    'Enter Seed':            { cn: '输入种子' },
    'Paste Seed':            { cn: '粘贴种子' },
    'Stake':                 { cn: '赌注' },
    '★ VEGAS CORNER ★':      { cn: '★ 娱乐角 ★' },
    'WHEEL · SLOTS':         { cn: '转盘 · 老虎机' },
    'WHEEL':                 { cn: '转盘' },
    'SLOTS':                 { cn: '老虎机' },
    '2 plays left':          { cn: '可玩 2 次' },
    '2 plays':               { cn: '2 次机会' },
    'come back next shop':   { cn: '下店再来' },
    'slots ∞':               { cn: '老虎机 ∞' },
    'Open Vegas Corner':     { cn: '打开娱乐角' },
    'HAND TYPE':             { cn: '牌型' },
    'CARDS':                 { cn: '卡牌' },
    'TOTAL':                 { cn: '合计' },
    'YOU WIN!':              { cn: '通关胜利！' },
    'High Card':      { cn: '高牌' },
    'Pair':           { cn: '对子' },
    'Two Pair':       { cn: '两对' },
    'Three of a Kind':{ cn: '三条' },
    'Straight':       { cn: '顺子' },
    'Flush':          { cn: '同花' },
    'Full House':     { cn: '葫芦' },
    'Four of a Kind': { cn: '四条' },
    'Straight Flush': { cn: '同花顺' },
  };

  const reverse = {};
  for (const en in dict) reverse[dict[en].cn] = en;

  let lang = document.documentElement.lang?.startsWith('zh') ? 'cn' : 'en';
  try { lang = localStorage.getItem(KEY) || lang; } catch (e) {}

  const ORIG_ATTR = '__i18n_orig__';
  let applying = false;
  let debounceTimer = null;

  function shouldSkip(node) {
    const el = node.nodeType === Node.TEXT_NODE ? node.parentElement : node;
    return !!(el && el.closest && el.closest(SKIP_SEL));
  }

  function translateNode(node) {
    if (shouldSkip(node)) return;

    if (node.nodeType === Node.TEXT_NODE) {
      const cur = node.nodeValue;
      if (!cur || !cur.trim()) return;

      if (!node[ORIG_ATTR]) {
        const trimmed = cur.trim();
        if (dict[trimmed]) node[ORIG_ATTR] = trimmed;
        else if (reverse[trimmed]) node[ORIG_ATTR] = reverse[trimmed];
        else { node[ORIG_ATTR] = null; return; }
      }

      const origEN = node[ORIG_ATTR];
      if (!origEN) return;
      const target = (lang === 'cn') ? (dict[origEN] && dict[origEN].cn) : origEN;
      if (!target) return;

      const m = cur.match(/^(\s*)([\s\S]*?)(\s*)$/);
      const next = (m ? m[1] : '') + target + (m ? m[3] : '');
      if (node.nodeValue !== next) node.nodeValue = next;
      return;
    }

    if (node.nodeType !== Node.ELEMENT_NODE) return;
    for (const child of node.childNodes) translateNode(child);
  }

  function applyAll() {
    if (applying) return;
    applying = true;
    try {
      document.documentElement.lang = lang === 'cn' ? 'zh-CN' : 'en';
      document.documentElement.classList.toggle('lang-cn', lang === 'cn');
      translateNode(document.body);
    } finally {
      applying = false;
    }
  }

  function scheduleApply() {
    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(applyAll, 80);
  }

  const toggle = document.createElement('button');
  toggle.id = 'i18n-toggle';
  toggle.type = 'button';
  Object.assign(toggle.style, {
    position: 'fixed',
    left: '14px',
    bottom: '14px',
    zIndex: '10000',
    padding: '6px 14px',
    fontFamily: "'VT323', monospace",
    fontSize: '16px',
    letterSpacing: '1px',
    background: '#1a2030',
    color: '#fcd34d',
    border: '2px solid #f4f1e8',
    borderRadius: '8px',
    cursor: 'pointer',
    boxShadow: '0 3px 0 rgba(0,0,0,0.6)',
  });

  function refreshToggle() {
    toggle.textContent = (lang === 'cn') ? '中 / EN' : 'EN / 中';
  }

  toggle.addEventListener('click', () => {
    lang = (lang === 'cn') ? 'en' : 'cn';
    try { localStorage.setItem(KEY, lang); } catch (e) {}
    refreshToggle();
    applyAll();
    if (document.querySelector('#scene-shop.active') && window.renderShop) renderShop();
    if (document.querySelector('#scene-game.active')) {
      window.renderJokers?.();
      window.renderConsumables?.();
      window.renderStats?.();
    }
    if (document.querySelector('#scene-blind.active')) window.showBlindSelect?.();
    const newRun = document.getElementById('newRunModal');
    if (newRun && !newRun.classList.contains('hidden')) window.NewRun?.render?.();
    if (window.Sounds) Sounds.play('btn_click');
  });

  refreshToggle();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(toggle));
  } else {
    document.body.appendChild(toggle);
  }

  function start() {
    applyAll();
    const obs = new MutationObserver((muts) => {
      for (const m of muts) {
        if (m.type !== 'childList' || !m.addedNodes.length) continue;
        for (const n of m.addedNodes) {
          if (n.nodeType === Node.ELEMENT_NODE && n.matches?.(SKIP_SEL)) return;
          if (n.parentElement?.closest?.(SKIP_SEL)) continue;
          scheduleApply();
          return;
        }
      }
    });
    obs.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.I18N = {
    set(l) { lang = l; refreshToggle(); applyAll(); },
    get() { return lang; },
    t(en, cn) { return lang === 'cn' ? (cn ?? dict[en]?.cn ?? en) : en; },
    add(en, cn) { dict[en] = { cn }; reverse[cn] = en; applyAll(); },
    refresh: applyAll,
  };
})();
