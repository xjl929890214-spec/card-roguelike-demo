/* ============================================================
 *  card-art.js — 统一像素卡面（Joker / Planet / Tarot / Voucher）
 *  比例 2:3，资源路径 assets/cards/{type}/{id}.png
 *  无贴图时显示文字占位（避免空白卡面）
 * ============================================================ */
(function () {
  const BASE = 'assets/cards/';
  const RATIO = '2/3';

  const RARITY_BG = {
    common: '#2a3148',
    uncommon: '#1e3a5f',
    rare: '#3b1f4a',
    legendary: '#4a3a10',
    planet: '#1a3050',
    tarot: '#2a1840',
  };

  function src(type, id, ver) {
    return `${BASE}${type}/${id}.png?v=${ver || '1'}`;
  }

  function wrap(type, id, rarity, label, ver) {
    const leg = rarity === 'legendary' ? ' ca-legend-glow' : '';
    const bg = RARITY_BG[rarity] || RARITY_BG.common;
    const safeLabel = (label || id || '').replace(/</g, '');
    return `<div class="card-art ca-${type} rarity-${rarity || 'common'}${leg}" data-card-id="${id}" style="aspect-ratio:${RATIO};--ca-bg:${bg}">
      <img class="ca-img" src="${src(type, id, ver)}" alt="" draggable="false" loading="lazy" width="400" height="600" onerror="this.classList.add('ca-broken')">
      <div class="ca-fallback"><span class="ca-fallback-name">${safeLabel}</span></div>
    </div>`;
  }

  window.CardArt = {
    src,
    has(type, id) { return !!(type && id); },

    joker(j) {
      return wrap('joker', j.id, j.rarity, j.name, j.cardNo || '1');
    },

    planet(p) {
      return wrap('planet', p.id, 'planet', p.name, p.hand);
    },

    tarot(t) {
      return wrap('tarot', t.id, 'tarot', t.name, t.id);
    },

    voucher(v) {
      const tier = v.tier >= 2 ? 'rare' : 'uncommon';
      return wrap('voucher', v.id, tier, v.name, v.tier);
    },
  };
})();
