/* ============================================================
 *  title-stats.js  —  主菜单 BEST RUN 统计
 * ============================================================ */
(function () {
  const META_KEY = 'joker_state_meta_v1';

  function load() {
    try {
      return JSON.parse(localStorage.getItem(META_KEY) || '{}') || {};
    } catch (e) {
      return {};
    }
  }

  function save(meta) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(meta));
    } catch (e) {}
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  function fmtTime(sec) {
    const s = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }

  const TitleStats = {
    recordRunEnd(state, victory) {
      if (!state) return;
      const rs = state.runStats || {};
      const meta = load();
      const score = rs.bestHandScore || 0;
      meta.highScore = Math.max(meta.highScore || 0, score);
      meta.bestAnte = Math.max(meta.bestAnte || 0, state.ante || 0);
      if (victory && (state.ante >= 8 || state.isDailyRun)) {
        meta.winStreak = (meta.winStreak || 0) + 1;
        meta.wins = (meta.wins || 0) + 1;
      } else if (!victory) {
        meta.winStreak = 0;
      }
      meta.statesCleared = Math.max(meta.statesCleared || 0, Math.max(0, (state.ante || 1) - 1));
      meta.playTimeSec = (meta.playTimeSec || 0) + Math.floor((rs.runTimeSec || 0));
      save(meta);
      TitleStats.render();
    },

    render() {
      const meta = load();
      const map = {
        titleStatScore: meta.highScore ? fmt(meta.highScore) : '—',
        titleStatAnte: meta.bestAnte ? String(meta.bestAnte) : '—',
        titleStatStreak: meta.winStreak != null ? String(meta.winStreak) : '—',
        titleStatStates: meta.statesCleared != null ? String(meta.statesCleared) : '—',
        titleStatTime: meta.playTimeSec ? fmtTime(meta.playTimeSec) : '—',
      };
      Object.keys(map).forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.textContent = map[id];
      });
    },
  };

  document.addEventListener('DOMContentLoaded', () => TitleStats.render());
  window.TitleStats = TitleStats;
})();
