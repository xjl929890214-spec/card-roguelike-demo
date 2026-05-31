/* ============================================================
 *  tutorial.js — 首次游玩新手引导
 * ============================================================ */

(function () {
  const KEY = 'joker_state_tutorial_v1';
  const done = {
    gamePlay: false,
    resultCash: false,
    shopNext: false,
    blindPlay: false,
  };

  let root = null;
  let ring = null;
  let tip = null;
  let tipText = null;
  let tipBtn = null;
  let backdrop = null;
  let activeStep = null;
  let targetEl = null;
  let onTargetClick = null;

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) Object.assign(done, JSON.parse(raw));
    } catch (e) {}
  }

  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(done)); } catch (e) {}
  }

  function isCn() {
    return window.I18N?.get?.() === 'cn';
  }

  function msg(en, cn) {
    return isCn() ? cn : en;
  }

  function ensureDom() {
    if (root) return;
    root = document.createElement('div');
    root.id = 'tutorial-root';
    root.className = 'tutorial-root hidden';
    root.innerHTML = `
      <div class="tutorial-backdrop"></div>
      <div class="tutorial-ring" aria-hidden="true"></div>
      <div class="tutorial-tip" role="dialog" aria-live="polite">
        <div class="tutorial-tip-arrow" aria-hidden="true"></div>
        <div class="tutorial-tip-text"></div>
        <button type="button" class="tutorial-tip-btn btn btn-yellow"></button>
      </div>`;
    document.body.appendChild(root);
    backdrop = root.querySelector('.tutorial-backdrop');
    ring = root.querySelector('.tutorial-ring');
    tip = root.querySelector('.tutorial-tip');
    tipText = root.querySelector('.tutorial-tip-text');
    tipBtn = root.querySelector('.tutorial-tip-btn');
    backdrop.addEventListener('click', () => {
      if (activeStep === 'shopNext') hideOverlayOnly();
      else hide();
    });
    tipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (activeStep === 'shopNext') {
        hideOverlayOnly();
        return;
      }
      if (activeStep) complete(activeStep);
      hide();
    });
    window.addEventListener('resize', reposition);
    window.addEventListener('scroll', reposition, true);
  }

  function reposition() {
    if (!targetEl || root?.classList.contains('hidden')) return;
    placeRing(targetEl);
    placeTip(targetEl);
  }

  function placeRing(el) {
    const r = el.getBoundingClientRect();
    const pad = 10;
    ring.style.left = `${r.left - pad}px`;
    ring.style.top = `${r.top - pad}px`;
    ring.style.width = `${r.width + pad * 2}px`;
    ring.style.height = `${r.height + pad * 2}px`;
  }

  function placeTip(el) {
    const r = el.getBoundingClientRect();
    const tipRect = tip.getBoundingClientRect();
    let top = r.bottom + 14;
    let left = r.left + r.width / 2 - tipRect.width / 2;
    if (top + tipRect.height > window.innerHeight - 12) {
      top = r.top - tipRect.height - 14;
    }
    left = Math.max(12, Math.min(left, window.innerWidth - tipRect.width - 12));
    top = Math.max(12, Math.min(top, window.innerHeight - tipRect.height - 12));
    tip.style.left = `${left}px`;
    tip.style.top = `${top}px`;
  }

  function show(stepId, el, text, btnLabel, opts = {}) {
    if (!el || done[stepId]) return;
    ensureDom();
    activeStep = stepId;
    targetEl = el;
    el.classList.add('tutorial-target');
    if (opts.highlightClass) el.classList.add(opts.highlightClass);

    tipText.textContent = text;
    tipBtn.textContent = btnLabel || msg('Got it', '知道了');
    root.classList.remove('hidden');
    requestAnimationFrame(() => {
      placeRing(el);
      placeTip(el);
      requestAnimationFrame(() => placeTip(el));
    });

    if (opts.clickTargetToComplete) {
      onTargetClick = () => complete(stepId);
      el.addEventListener('click', onTargetClick, { once: true });
    }
  }

  function hideOverlayOnly() {
    root?.classList.add('hidden');
    activeStep = null;
  }

  function hide() {
    if (targetEl) {
      targetEl.classList.remove('tutorial-target', 'shop-next-spotlight');
      if (onTargetClick) {
        targetEl.removeEventListener('click', onTargetClick);
        onTargetClick = null;
      }
    }
    root?.classList.add('hidden');
    activeStep = null;
    targetEl = null;
  }

  function complete(stepId) {
    if (!stepId || done[stepId]) return;
    done[stepId] = true;
    save();
    hide();
  }

  function onEnterGame() {
    if (done.gamePlay) return;
    setTimeout(() => {
      const btn = document.getElementById('btnPlay');
      if (!btn || !document.querySelector('#scene-game.active')) return;
      show('gamePlay', btn,
        msg('Select up to 5 cards, then press Play Hand.', '点击手牌选中（最多5张），再按「出牌」。'),
        msg('Got it', '知道了'),
        { clickTargetToComplete: true });
    }, 450);
  }

  function onGamePlayUsed() {
    complete('gamePlay');
  }

  function onShowCashOut() {
    if (done.resultCash) return;
    setTimeout(() => {
      const btn = document.getElementById('toShopBtn');
      if (!btn || document.getElementById('resultModal')?.classList.contains('hidden')) return;
      show('resultCash', btn,
        msg('Cash out to enter the shop and spend your money.', '领取奖励后进入商店，用金币购买强化。'),
        msg('Got it', '知道了'));
    }, 300);
  }

  function onEnterShop() {
    if (done.shopNext) return;
    setTimeout(showShopNext, 350);
  }

  function onShopPurchase() {
    if (done.shopNext) return;
    showShopNext();
  }

  function showShopNext() {
    if (done.shopNext) return;
    const btn = document.getElementById('shopNextRoundBtn');
    if (!btn || !document.querySelector('#scene-shop.active')) return;
    btn.classList.add('shop-next-spotlight');
    if (!root || root.classList.contains('hidden')) {
      show('shopNext', btn,
        msg('Done shopping? Press Next Round to continue your run!', '买好了？点「下一回合」继续挑战！'),
        msg('Got it', '知道了'),
        { highlightClass: 'shop-next-spotlight' });
    }
  }

  function onShopNextClick() {
    const btn = document.getElementById('shopNextRoundBtn');
    btn?.classList.remove('shop-next-spotlight', 'tutorial-target');
    complete('shopNext');
  }

  function onShowBlindSelect() {
    if (done.blindPlay) return;
    setTimeout(() => {
      const btn = document.getElementById('blindPlayBtn');
      if (!btn || !document.querySelector('#scene-blind.active')) return;
      show('blindPlay', btn,
        msg('Start the blind when you are ready.', '准备好了就点「开始挑战」。'),
        msg('Got it', '知道了'),
        { clickTargetToComplete: true });
    }, 300);
  }

  function onBlindPlayUsed() {
    complete('blindPlay');
  }

  load();

  window.Tutorial = {
    onEnterGame,
    onGamePlayUsed,
    onShowCashOut,
    onEnterShop,
    onShopPurchase,
    onShopNextClick,
    onShowBlindSelect,
    onBlindPlayUsed,
    reset() {
      Object.keys(done).forEach((k) => { done[k] = false; });
      save();
    },
  };
})();
