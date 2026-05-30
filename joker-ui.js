/* ============================================================
 *  joker-ui.js — 与 CardArt 共用 assets/cards/joker/{id}.png
 * ============================================================ */
(function () {
  const ART_BASE = 'assets/cards/joker/';

  const RARITY_LABEL = {
    common: 'COMMON',
    uncommon: 'UNCOMMON',
    rare: 'RARE',
    legendary: 'LEGENDARY',
  };

  function artSrc(j) {
    if (window.CardArt) return CardArt.src('joker', j.id, j.cardNo || '1');
    return `${ART_BASE}${j.id}.png?v=${j.cardNo || '1'}`;
  }

  function render(j, opts = {}) {
    if (!j || !j.id) return '';
    if (window.CardArt) return CardArt.joker(j);
    const rarity = j.rarity || 'common';
    const compact = opts.compact ? ' pj-compact' : '';
    const name = j.name || j.name_cn || 'JOKER';
    const leg = rarity === 'legendary' ? ' pj-legendary-glow' : '';
    return `
<div class="pixel-joker-img rarity-${rarity}${compact}${leg}" data-joker-id="${j.id}" style="aspect-ratio:2/3">
  <img class="pj-card-art" src="${artSrc(j)}" alt="${name}" draggable="false" loading="lazy" width="400" height="600">
</div>`;
  }

  window.JokerUI = { render, artSrc, RARITY_LABEL, ART_BASE };
})();
