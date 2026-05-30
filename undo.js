/* ============================================================
 *  undo.js  —  撤销选牌
 *  - Ctrl/Cmd + Z 撤销最近一次"选/取消选/排序"操作
 *  - 出牌、弃牌、新一轮会清空撤销栈（不可越过去）
 *  - 仅撤销 state.selected 与 state.hand 顺序，不撤销已结算分数
 * ============================================================ */

(function () {
  const STACK_LIMIT = 30;
  const history = [];

  function snapshot() {
    if (!window.state) return;
    history.push({
      selected: [...state.selected],
      handOrder: state.hand.map(c => ({ rank: c.rank, suit: c.suit, color: c.color })),
    });
    if (history.length > STACK_LIMIT) history.shift();
  }

  function clear() { history.length = 0; }

  function restore() {
    if (!window.state || !history.length) return false;
    const prev = history.pop();
    state.selected.clear();
    prev.selected.forEach(i => state.selected.add(i));
    if (prev.handOrder) {
      // 用快照里的顺序重排手牌（仅按 rank+suit 匹配，不变更卡引用之外的内容）
      const remaining = [...state.hand];
      const reorder = [];
      for (const target of prev.handOrder) {
        const idx = remaining.findIndex(c => c.rank === target.rank && c.suit === target.suit);
        if (idx >= 0) reorder.push(remaining.splice(idx, 1)[0]);
      }
      if (reorder.length === state.hand.length) state.hand = reorder;
    }
    if (typeof renderHand === 'function') renderHand();
    if (window.Sounds) Sounds.play('btn_hover');
    return true;
  }

  // 在 toggleSelect 调用之前抓快照（捕获阶段）
  document.addEventListener('click', (e) => {
    const card = e.target.closest && e.target.closest('#handCards .card');
    if (card) snapshot();
  }, true);

  // 排序也算一次可撤销动作
  ['#sortRank', '#sortSuit'].forEach(sel => {
    document.addEventListener('click', (e) => {
      if (e.target.matches(sel)) snapshot();
    }, true);
  });

  // 出牌、弃牌、进入商店/新一轮：清空撤销栈
  document.addEventListener('click', (e) => {
    if (e.target.id === 'btnPlay' || e.target.id === 'btnDiscard') clear();
    if (e.target.id === 'toShopBtn') clear();
    if (e.target.closest && e.target.closest('.shop-action-btn')) clear();
  }, true);

  // 快捷键
  document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
      e.preventDefault();
      restore();
    }
  });

  window.Undo = { snapshot, restore, clear, depth: () => history.length };
})();
