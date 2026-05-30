/* ============================================================
 *  game-over.js  —  结算统计页（Game Over / Victory）
 * ============================================================ */
(function () {
  function sfx(n) {
    if (window.Sounds?.play) Sounds.play(n);
  }

  function fmt(n) {
    return Number(n || 0).toLocaleString('en-US');
  }

  const el = document.createElement('div');
  el.id = 'gameOverModal';
  el.className = 'modal-overlay hidden';
  el.innerHTML = `
    <div class="gameover-box">
      <div class="gameover-title" id="goTitle">GAME OVER</div>
      <div class="gameover-layout">
        <div class="gameover-stats" id="goStats"></div>
        <div class="gameover-defeat">
          <div class="defeat-label">Defeated By</div>
          <div class="defeat-chip" id="goDefeatChip">
            <span id="goDefeatName">Big Blind</span>
          </div>
        </div>
      </div>
      <div class="gameover-seed-row">
        <span>Seed</span>
        <span id="goSeed">—</span>
        <button type="button" class="btn btn-blue mini" id="goCopySeed">Copy</button>
      </div>
      <div class="gameover-actions">
        <button type="button" class="btn btn-red big" id="goNewRun">New Run</button>
        <button type="button" class="btn btn-yellow big" id="goMainMenu">Main Menu</button>
      </div>
    </div>`;
  document.body.appendChild(el);

  function statRow(label, value, colorClass = '') {
    return `<div class="go-stat-row">
      <span class="go-stat-label">${label}</span>
      <span class="go-stat-value ${colorClass}">${value}</span>
    </div>`;
  }

  function show(victory) {
    const s = window.state;
    if (!s) return;
    const rs = s.runStats || {};
    const discoveries = (window.Collection?.getSeenCount?.() ?? 0) - (rs.discoveriesAtStart || 0);

    el.querySelector('#goTitle').textContent = victory
      ? (s.isDailyRun ? 'DAILY CLEAR!' : 'YOU WIN!')
      : 'GAME OVER';
    el.querySelector('#goTitle').classList.toggle('victory', !!victory);

    const defeatName = victory ? 'Joker State — 8 Antes' : (rs.defeatedBy || 'Blind');
    el.querySelector('#goDefeatName').textContent = defeatName;
    const chip = el.querySelector('#goDefeatChip');
    if (chip) {
      chip.className = 'defeat-chip' + (victory ? ' victory' : '');
    }

    const bestTag = rs.bestHandScore > 0 ? '<span class="go-tag">High score!</span>' : '';
    el.querySelector('#goStats').innerHTML = [
      statRow('Best Hand', `${fmt(rs.bestHandScore)} ${bestTag}`, 'val-red'),
      statRow('Most Played Hand', window.getMostPlayedHandLabel?.() || '—'),
      statRow('Cards Played', fmt(rs.cardsPlayed), 'val-blue'),
      statRow('Cards Discarded', fmt(rs.cardsDiscarded), 'val-red'),
      statRow('Cards Purchased', fmt(rs.cardsPurchased), 'val-orange'),
      statRow('Times Rerolled', fmt(rs.rerolls), 'val-green'),
      statRow('New Discoveries', fmt(Math.max(0, discoveries)), 'val-white'),
      statRow('Ante', String(s.ante), 'val-orange'),
      statRow('Round', String(rs.runRound || s.ante), 'val-orange'),
    ].join('');

    const seedDisplay = s.isSeededRun && s.seed ? s.seed : (s.seed || 'RANDOM');
    el.querySelector('#goSeed').textContent = seedDisplay;

    if (window.TitleStats?.recordRunEnd) TitleStats.recordRunEnd(s, victory);
    if (window.Save) Save.clear();
    victory ? sfx('win') : sfx('lose');
    el.classList.remove('hidden');
  }

  function hide() {
    el.classList.add('hidden');
  }

  el.querySelector('#goCopySeed')?.addEventListener('click', () => {
    sfx('btn_click');
    const seed = el.querySelector('#goSeed')?.textContent || '';
    if (!seed || seed === 'RANDOM') return;
    navigator.clipboard?.writeText(seed).catch(() => {});
  });

  el.querySelector('#goNewRun')?.addEventListener('click', () => {
    sfx('btn_click');
    hide();
    if (window.NewRun?.open) NewRun.open();
    else if (typeof startNewRun === 'function') startNewRun();
  });

  el.querySelector('#goMainMenu')?.addEventListener('click', () => {
    sfx('btn_click');
    hide();
    if (typeof switchScene === 'function') switchScene('title');
    window.TitleStats?.render?.();
  });

  el.addEventListener('click', (e) => {
    if (e.target === el) hide();
  });

  window.GameOver = { show, hide };
})();
