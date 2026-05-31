/* ============================================================
 *  card-gallery.js — 全部卡牌贴图资源浏览（DEV）
 * ============================================================ */
(function () {
  const TABS = [
    { id: 'all', label: '全部' },
    { id: 'joker', label: '小丑' },
    { id: 'planet', label: '星球' },
    { id: 'tarot', label: '塔罗' },
    { id: 'voucher', label: '凭证' },
  ];

  const TYPE_LABEL = {
    joker: '小丑',
    planet: '星球',
    tarot: '塔罗',
    voucher: '凭证',
  };

  function buildEntries() {
    const G = window.GameData;
    if (!G) return [];
    const out = [];
    for (const j of G.jokers || []) out.push({ type: 'joker', def: j });
    for (const p of G.planets || []) out.push({ type: 'planet', def: p });
    for (const t of G.tarots || []) out.push({ type: 'tarot', def: t });
    for (const v of G.vouchers || []) out.push({ type: 'voucher', def: v });
    return out;
  }

  function artPath(type, id) {
    return window.CardArt ? CardArt.src(type, id) : `assets/cards/${type}/${id}.png`;
  }

  function renderFace(entry) {
    const { type, def } = entry;
    if (!window.CardArt) return `<div class="cg-placeholder">${def.name || def.id}</div>`;
    if (type === 'joker') return CardArt.joker(def);
    if (type === 'planet') return CardArt.planet(def);
    if (type === 'tarot') return CardArt.tarot(def);
    if (type === 'voucher') return CardArt.voucher(def);
    return `<div class="cg-placeholder">${def.name || def.id}</div>`;
  }

  function displayName(def) {
    return window.GameData?.itemLabel?.(def) || def.name || def.id;
  }

  const css = `
.card-gallery-modal {
  position: fixed; inset: 0; z-index: 19999;
  background: rgba(0,0,0,0.82);
  display: none; align-items: center; justify-content: center;
  font-family: 'VT323', monospace;
  padding: 12px;
}
.card-gallery-modal.show { display: flex; }
.cg-panel {
  width: min(960px, 96vw); max-height: 90vh;
  display: flex; flex-direction: column;
  background: #1a2030; border: 4px solid #f4f1e8;
  border-radius: 14px; box-shadow: 0 8px 0 #000;
  overflow: hidden;
}
.cg-head {
  display: flex; flex-wrap: wrap; align-items: center; gap: 10px;
  padding: 14px 18px; border-bottom: 2px solid rgba(244,241,232,0.2);
}
.cg-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 11px; color: #fcd34d; letter-spacing: 1px;
  text-shadow: 1px 1px 0 #000;
}
.cg-stats { font-size: 16px; color: #8ab4d4; flex: 1; min-width: 140px; }
.cg-stats strong { color: #34d399; }
.cg-stats .cg-miss { color: #f87171; margin-left: 8px; }
.cg-close {
  padding: 6px 14px; border: 2px solid #f4f1e8; border-radius: 8px;
  background: #2a3148; color: #f4f1e8; font-size: 16px; cursor: pointer;
}
.cg-close:hover { border-color: #fcd34d; color: #fcd34d; }
.cg-tabs {
  display: flex; flex-wrap: wrap; gap: 6px;
  padding: 10px 18px; border-bottom: 2px solid rgba(244,241,232,0.12);
}
.cg-tab {
  padding: 5px 12px; border: 2px solid rgba(244,241,232,0.25);
  border-radius: 8px; background: rgba(42,49,72,0.9);
  color: #f4f1e8; font-size: 15px; cursor: pointer;
}
.cg-tab.active { border-color: #fcd34d; color: #fcd34d; background: #3a2848; }
.cg-tab .cg-tab-n { opacity: 0.65; margin-left: 4px; font-size: 13px; }
.cg-body { overflow-y: auto; padding: 16px 18px; flex: 1; }
.cg-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(108px, 1fr));
  gap: 12px;
}
.cg-cell {
  background: #2a3148; border: 2px solid #6a7090; border-radius: 8px;
  padding: 8px; text-align: center; position: relative;
}
.cg-cell.cg-has-art { border-color: #34d399; }
.cg-cell.cg-no-art { border-color: #f87171; opacity: 0.92; }
.cg-art {
  width: 92px; height: 138px; margin: 0 auto 6px;
  position: relative;
}
.cg-art .card-art { width: 100%; height: 100%; }
.cg-placeholder {
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  background: linear-gradient(180deg, #22d3ee30, #0a0a14);
  border: 2px solid #22d3ee; border-radius: 6px;
  font-size: 14px; color: #67e8f9; padding: 4px;
}
.cg-name { font-size: 14px; color: #f4f1e8; line-height: 1.2; margin-bottom: 2px; }
.cg-id { font-size: 11px; color: #8ab4d4; word-break: break-all; }
.cg-type-tag {
  position: absolute; top: 4px; left: 4px;
  font-size: 10px; padding: 1px 5px; border-radius: 4px;
  background: rgba(0,0,0,0.55); color: #fcd34d;
}
.cg-badge {
  position: absolute; top: 4px; right: 4px;
  font-size: 10px; padding: 1px 5px; border-radius: 4px;
}
.cg-badge.ok { background: #065f46; color: #6ee7b7; }
.cg-badge.miss { background: #7f1d1d; color: #fca5a5; }
.cg-path {
  font-size: 10px; color: #6b7280; margin-top: 4px;
  cursor: pointer; text-decoration: underline;
}
.cg-path:hover { color: #fcd34d; }
.cg-empty { text-align: center; color: #8ab4d4; font-size: 18px; padding: 40px; }
`;
  const style = document.createElement('style');
  style.textContent = css;
  document.head.appendChild(style);

  const modal = document.createElement('div');
  modal.className = 'card-gallery-modal no-i18n';
  modal.innerHTML = `
    <div class="cg-panel">
      <div class="cg-head">
        <div class="cg-title">CARD ART · 资源库</div>
        <div class="cg-stats" id="cgStats">—</div>
        <button type="button" class="cg-close" id="cgClose">关闭</button>
      </div>
      <div class="cg-tabs" id="cgTabs"></div>
      <div class="cg-body"><div class="cg-grid" id="cgGrid"></div></div>
    </div>
  `;
  document.body.appendChild(modal);

  const tabsEl = modal.querySelector('#cgTabs');
  const gridEl = modal.querySelector('#cgGrid');
  const statsEl = modal.querySelector('#cgStats');
  let tab = 'all';
  const artOk = new Map();

  function probeArt(entries) {
    artOk.clear();
    for (const e of entries) {
      const path = artPath(e.type, e.def.id);
      if (!path) {
        artOk.set(e.def.id, false);
        continue;
      }
      const img = new Image();
      img.onload = () => { artOk.set(e.def.id, true); renderGrid(); updateStats(); };
      img.onerror = () => { artOk.set(e.def.id, false); renderGrid(); updateStats(); };
      img.src = path;
    }
  }

  function filtered(entries) {
    if (tab === 'all') return entries;
    return entries.filter(e => e.type === tab);
  }

  function countWithArt(entries) {
    let n = 0;
    for (const e of entries) {
      if (artOk.get(e.def.id)) n++;
    }
    return n;
  }

  function updateStats() {
    const all = buildEntries();
    const list = filtered(all);
    const total = list.length;
    const ok = countWithArt(list);
    const miss = total - ok;
    const missHtml = miss > 0 ? `<span class="cg-miss">缺 ${miss}</span>` : '';
    statsEl.innerHTML = `贴图 <strong>${ok}</strong> / ${total}${missHtml}`;
    for (const t of TABS) {
      const el = tabsEl.querySelector(`[data-tab="${t.id}"]`);
      if (!el) continue;
      const sub = t.id === 'all' ? all : all.filter(e => e.type === t.id);
      const subOk = countWithArt(sub);
      el.querySelector('.cg-tab-n').textContent = `${subOk}/${sub.length}`;
    }
  }

  function renderTabs(entries) {
    tabsEl.innerHTML = TABS.map(t => {
      const sub = t.id === 'all' ? entries : entries.filter(e => e.type === t.id);
      return `<button type="button" class="cg-tab${tab === t.id ? ' active' : ''}" data-tab="${t.id}">
        ${t.label}<span class="cg-tab-n">${sub.length}</span>
      </button>`;
    }).join('');
    tabsEl.querySelectorAll('.cg-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        tab = btn.dataset.tab;
        renderTabs(entries);
        renderGrid();
        updateStats();
      });
    });
  }

  function renderGrid() {
    const entries = filtered(buildEntries());
    if (!entries.length) {
      gridEl.innerHTML = '<div class="cg-empty">暂无数据（需加载 data-bundle.js）</div>';
      return;
    }
    gridEl.innerHTML = entries.map(e => {
      const id = e.def.id;
      const has = artOk.has(id) ? artOk.get(id) : null;
      const cls = has === true ? 'cg-has-art' : has === false ? 'cg-no-art' : '';
      const badge = has === true
        ? '<span class="cg-badge ok">有图</span>'
        : has === false
          ? '<span class="cg-badge miss">缺图</span>'
          : '<span class="cg-badge miss">…</span>';
      const path = artPath(e.type, id) || '(无贴图路径)';
      return `
        <div class="cg-cell ${cls}" data-id="${id}">
          <span class="cg-type-tag">${TYPE_LABEL[e.type]}</span>
          ${badge}
          <div class="cg-art">${renderFace(e)}</div>
          <div class="cg-name">${displayName(e.def)}</div>
          <div class="cg-id">${id}</div>
          ${path !== '(无贴图路径)' ? `<div class="cg-path" data-path="${path}" title="点击复制路径">${path}</div>` : ''}
        </div>`;
    }).join('');
    gridEl.querySelectorAll('.cg-path').forEach(el => {
      el.addEventListener('click', () => {
        navigator.clipboard?.writeText(el.dataset.path).catch(() => {});
      });
    });
  }

  function open() {
    const entries = buildEntries();
    tab = 'all';
    renderTabs(entries);
    renderGrid();
    statsEl.textContent = '检测贴图中…';
    modal.classList.add('show');
    probeArt(entries);
    window.Sounds?.play?.('btn_click');
  }

  function close() {
    modal.classList.remove('show');
    window.Sounds?.play?.('btn_hover');
  }

  modal.querySelector('#cgClose').addEventListener('click', close);
  modal.addEventListener('click', (e) => { if (e.target === modal) close(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) close();
  });

  window.CardGallery = { open, close, buildEntries, artPath };
})();
