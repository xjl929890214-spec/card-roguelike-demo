/* ============================================================
 *  card-art.js — 统一像素卡面（Joker PNG / 凭证·行星 CSS 像素画）
 * ============================================================ */
(function () {
  const BASE = 'assets/cards/';
  const RATIO = '2/3';
  const PIXEL_PLANETS = new Set(['pl_ceres', 'pl_planetx', 'pl_eros']);

  const RARITY_BG = {
    common: '#2a3148',
    uncommon: '#1e3a5f',
    rare: '#3b1f4a',
    legendary: '#4a3a10',
    planet: '#1a3050',
    tarot: '#2a1840',
  };

  const VOUCHER_ICON = {
    shop_slots: 'icon-crate',
    shop_discount: 'icon-tag',
    edition_rate: 'icon-spark',
    reroll_discount: 'icon-reroll',
    consumable_slot: 'icon-gem',
    guarantee_planet_pack: 'icon-scope',
    planet_x_mult: 'icon-orbit',
    extra_hands_perm: 'icon-hand',
    extra_discards_perm: 'icon-discard',
    interest_cap: 'icon-coin',
    extra_joker_slot: 'icon-joker',
  };

  function isCn() {
    return window.I18N?.get?.() === 'cn';
  }

  function esc(s) {
    return String(s || '').replace(/</g, '&lt;');
  }

  function src(type, id, ver) {
    return `${BASE}${type}/${id}.png?v=${ver || '2'}`;
  }

  function handLabel(handId) {
    const h = window.GameData?.hands?.find(x => x.id === handId);
    if (!h) return handId || '';
    return isCn() ? h.name : (h.en || h.name);
  }

  function wrap(type, id, rarity, label, ver) {
    const leg = rarity === 'legendary' ? ' ca-legend-glow' : '';
    const bg = RARITY_BG[rarity] || RARITY_BG.common;
    return `<div class="card-art ca-${type} rarity-${rarity || 'common'}${leg}" data-card-id="${id}" style="aspect-ratio:${RATIO};--ca-bg:${bg}">
      <img class="ca-img" src="${src(type, id, ver)}" alt="" draggable="false" loading="lazy" width="400" height="600" onerror="this.classList.add('ca-broken')">
      <div class="ca-fallback"><span class="ca-fallback-name">${esc(label)}</span></div>
    </div>`;
  }

  function pixelVoucher(v) {
    const tier = v.tier >= 2 ? 2 : 1;
    const icon = VOUCHER_ICON[v.type] || 'icon-star';
    const tag = isCn() ? '凭证' : 'PASS';
    const name = esc(window.GameData?.itemLabel?.(v) || v.name);
    const desc = esc(window.GameData?.itemDesc?.(v) || v.desc || '');
    const tierMark = tier >= 2 ? '★★' : '★';
    return `<div class="card-art ca-voucher px-card px-voucher px-v-tier-${tier}" data-card-id="${v.id}" style="aspect-ratio:${RATIO}">
      <div class="px-v-ticket">
        <div class="px-v-notch px-v-notch-tl"></div>
        <div class="px-v-notch px-v-notch-tr"></div>
        <div class="px-v-notch px-v-notch-bl"></div>
        <div class="px-v-notch px-v-notch-br"></div>
        <div class="px-v-strip" aria-hidden="true"></div>
        <div class="px-v-head">${tag}</div>
        <div class="px-v-body">
          <div class="px-v-glyph ${icon}" aria-hidden="true"></div>
          <div class="px-v-name">${name}</div>
        </div>
        <div class="px-v-foot">
          <span class="px-v-tier">${tierMark}</span>
          <span class="px-v-desc">${desc}</span>
        </div>
      </div>
    </div>`;
  }

  function planetHue(id) {
    const map = {
      pl_pluto: '#c8b8a8', pl_mercury: '#b8b0a0', pl_uranus: '#88d8f0',
      pl_venus: '#f0c878', pl_saturn: '#e8c868', pl_jupiter: '#d89858',
      pl_earth: '#68a878', pl_mars: '#d85848', pl_neptune: '#5888e8',
      pl_ceres: '#a89878', pl_planetx: '#9898d8', pl_eros: '#e87898',
    };
    return map[id] || '#88a8d8';
  }

  function pixelPlanet(p) {
    const hue = planetHue(p.id);
    const hand = esc(handLabel(p.hand));
    const name = esc(window.GameData?.itemLabel?.(p) || p.name);
    const chips = p.chips ?? '';
    const mult = p.mult ?? '';
    return `<div class="card-art ca-planet px-card px-planet" data-card-id="${p.id}" style="aspect-ratio:${RATIO};--px-planet:${hue}">
      <div class="px-p-frame">
        <div class="px-p-stars" aria-hidden="true"></div>
        <div class="px-p-orbit" aria-hidden="true"></div>
        <div class="px-p-ball" aria-hidden="true"></div>
        <div class="px-p-ring" aria-hidden="true"></div>
        <div class="px-p-label">${name}</div>
        <div class="px-p-hand">${hand}</div>
        <div class="px-p-stats"><span>${chips}</span><span class="px-p-x">×</span><span>${mult}</span></div>
      </div>
    </div>`;
  }

  function pixelTarot(t) {
    const name = esc(window.GameData?.itemLabel?.(t) || t.name);
    const desc = esc((window.GameData?.itemDesc?.(t) || t.desc || '').slice(0, 16));
    const num = (t.id || '').replace('t_', '').slice(0, 3).toUpperCase();
    return `<div class="card-art ca-tarot px-card px-tarot" data-card-id="${t.id}" style="aspect-ratio:${RATIO}">
      <div class="px-t-frame">
        <div class="px-t-border" aria-hidden="true"></div>
        <div class="px-t-sigil" aria-hidden="true">☽</div>
        <div class="px-t-code">${esc(num)}</div>
        <div class="px-t-name">${name}</div>
        <div class="px-t-desc">${desc}</div>
      </div>
    </div>`;
  }

  window.CardArt = {
    src,
    has(type, id) { return !!(type && id); },

    joker(j) {
      return wrap('joker', j.id, j.rarity, j.name, j.cardNo || '1');
    },

    planet(p) {
      if (PIXEL_PLANETS.has(p.id)) return pixelPlanet(p);
      return wrap('planet', p.id, 'planet', p.name, p.hand);
    },

    tarot(t) {
      return wrap('tarot', t.id, 'tarot', t.name, t.id);
    },

    voucher(v) {
      return pixelVoucher(v);
    },

    pixelVoucher,
    pixelPlanet,
    pixelTarot,
  };
})();
