/* ============================================================
 *  i18n.js  —  中英文切换
 *  - 左下角浮动按钮 EN / CN
 *  - 翻译表覆盖：标题菜单、侧栏标签、按钮、模态框、商店标签
 *  - 通过 MutationObserver 自动重译动态注入的节点
 *  - 偏好保存在 localStorage
 * ============================================================ */

(function () {
  const KEY = 'balatro_demo_lang_v1';
  const dict = {
    // 标题菜单
    'PLAY':       { cn: '开 始' },
    'OPTIONS':    { cn: '选 项' },
    'QUIT':       { cn: '退 出' },
    'COLLECTION': { cn: '图 鉴' },
    'CONTINUE':   { cn: '继 续' },
    'Profile':    { cn: '档案' },

    // 侧栏
    'Small Blind': { cn: '小盲注' },
    'Big Blind':   { cn: '大盲注' },
    'Boss Blind':  { cn: 'Boss盲注' },
    'SMALL':       { cn: '小' },
    'BLIND':       { cn: '盲' },
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

    // 出牌区
    'Play Hand':   { cn: '出牌' },
    'Sort Hand':   { cn: '排序' },
    'Rank':        { cn: '点数' },
    'Suit':        { cn: '花色' },
    'Discard':     { cn: '弃牌' },

    // 商店
    'SHOP':        { cn: '商店' },
    'Improve your run!': { cn: '增强你的牌组！' },
    'Next\nRound': { cn: '下一\n回合' },
    'Reroll':      { cn: '刷新' },
    'VOUCHER':     { cn: '券' },
    'BUFFOON\nPACK':  { cn: '小丑\n卡包' },
    'STANDARD\nPACK': { cn: '标准\n卡包' },

    // 结算 / 模态
    'Round Complete!':       { cn: '本轮通关！' },
    'Small Blind Defeated!': { cn: '击败小盲注！' },
    'Big Blind Defeated!':   { cn: '击败大盲注！' },
    'Boss Blind Defeated!':  { cn: '击败Boss盲注！' },
    'Defeated.':             { cn: '失败' },
    'Better luck next time': { cn: '下次好运' },
    'Cash Out':              { cn: '领取奖励' },
    'Restart':               { cn: '重新开始' },

    // 牌型（用于面板预览）
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

  // 反向表：CN -> EN
  const reverse = {};
  for (const en in dict) reverse[dict[en].cn] = en;

  let lang = 'en';
  try { lang = localStorage.getItem(KEY) || 'en'; } catch (e) {}

  // 收集"原始 EN 文本"的标记 —— 第一次见到该节点时记下来
  const ORIG_ATTR = '__i18n_orig__';

  function translateNode(node) {
    if (node.nodeType === Node.TEXT_NODE) {
      const raw = node[ORIG_ATTR];
      const cur = node.nodeValue;
      if (!raw) {
        const trimmed = cur && cur.trim();
        if (!trimmed) return;
        // 既匹配 EN 又匹配 CN 的反向，确保来回切都行
        if (dict[trimmed]) {
          node[ORIG_ATTR] = trimmed;
        } else if (reverse[trimmed]) {
          node[ORIG_ATTR] = reverse[trimmed];
        } else {
          node[ORIG_ATTR] = null; // 标记已检查过、无翻译
          return;
        }
      }
      const origEN = node[ORIG_ATTR];
      if (!origEN) return;
      const target = (lang === 'cn') ? (dict[origEN] && dict[origEN].cn) : origEN;
      if (target && node.nodeValue !== target) {
        // 保留原文本中的空白前后缀
        const m = cur.match(/^(\s*)([\s\S]*?)(\s*)$/);
        node.nodeValue = (m ? m[1] : '') + target + (m ? m[3] : '');
      }
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    // 跳过自身 UI（图鉴 / 设置 / 浮动按钮）
    if (node.closest && node.closest('.collection-modal, .settings-modal, #i18n-toggle')) return;
    for (const child of node.childNodes) translateNode(child);
  }

  function applyAll() { translateNode(document.body); }

  // ---------- 浮动切换按钮 ----------
  const toggle = document.createElement('button');
  toggle.id = 'i18n-toggle';
  Object.assign(toggle.style, {
    position: 'fixed',
    left: '14px',
    bottom: '14px',
    zIndex: '10000',
    padding: '6px 14px',
    fontFamily: "'Press Start 2P', monospace",
    fontSize: '11px',
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
    if (window.Sounds) Sounds.play('btn_click');
  });
  refreshToggle();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => document.body.appendChild(toggle));
  } else {
    document.body.appendChild(toggle);
  }

  // ---------- 首次翻译 + 监听动态内容 ----------
  function start() {
    applyAll();
    const obs = new MutationObserver((muts) => {
      let need = false;
      for (const m of muts) {
        if (m.type === 'childList' && m.addedNodes.length) need = true;
        else if (m.type === 'characterData') need = true;
      }
      if (need) applyAll();
    });
    obs.observe(document.body, { childList: true, subtree: true, characterData: true });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }

  window.I18N = {
    set(l) { lang = l; refreshToggle(); applyAll(); },
    get() { return lang; },
    add(en, cn) { dict[en] = { cn }; reverse[cn] = en; applyAll(); },
  };
})();
