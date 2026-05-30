/* ============================================================
 *  product.js  —  Joker State 商业版标识与本地存储迁移
 * ============================================================ */

(function () {
  const LEGACY_PREFIX = 'balatro_demo_';
  const LEGACY_DAILY_PREFIX = 'balatro_daily_done_';
  const LEGACY_BOOT = 'balatro_boot_done';

  const Product = {
    id: 'joker_state',
    name: 'Joker State',
    nameCn: '小丑州',
    version: '0.1.0',
    phase: 'alpha',
    tagline: 'American pixel joker deckbuilder',
    steam: {
      platform: 'windows',
      eaPriceUsd: 3.99,
      releasePriceUsd: 5.99,
    },

    storage: {
      save: 'joker_state_save_v1',
      settings: 'joker_state_settings_v1',
      lang: 'joker_state_lang_v1',
      seenJokers: 'joker_state_seen_jokers_v1',
      boot: 'joker_state_boot_done',
      dailyPrefix: 'joker_state_daily_done_',
    },

    legacy: {
      save: 'balatro_demo_save_v1',
      settings: 'balatro_demo_settings_v1',
      lang: 'balatro_demo_lang_v1',
      seenJokers: 'balatro_demo_seen_jokers_v1',
      boot: LEGACY_BOOT,
      dailyPrefix: LEGACY_DAILY_PREFIX,
    },

    migrateKey(newKey, oldKey) {
      try {
        if (localStorage.getItem(newKey) != null) return;
        const old = localStorage.getItem(oldKey);
        if (old != null) localStorage.setItem(newKey, old);
      } catch (e) {}
    },

    migrateDailyDone(seed) {
      const nk = Product.storage.dailyPrefix + seed;
      const ok = Product.legacy.dailyPrefix + seed;
      Product.migrateKey(nk, ok);
      return nk;
    },

    runMigrations() {
      const s = Product.storage;
      const l = Product.legacy;
      Product.migrateKey(s.save, l.save);
      Product.migrateKey(s.settings, l.settings);
      Product.migrateKey(s.lang, l.lang);
      Product.migrateKey(s.seenJokers, l.seenJokers);
      try {
        if (sessionStorage.getItem(s.boot) == null && sessionStorage.getItem(l.boot) != null) {
          sessionStorage.setItem(s.boot, '1');
        }
      } catch (e) {}
    },
  };

  Product.runMigrations();
  window.JokerState = Product;
})();
