/* ============================================================
 *  settings.js  —  设置面板
 *  - 主标题页 OPTIONS 按钮 / 游戏内 Options 侧栏按钮 都会打开
 *  - 控制音量、静音、震动反馈
 *  - 设置自动存到 localStorage，下次打开自动恢复
 * ============================================================ */

(function () {
  const KEY = window.JokerState?.storage?.settings || 'joker_state_settings_v1';

  const defaults = {
    volume: 0.35,
    musicVolume: 0.32,
    muted: false,
    shake: true,
  };

  function loadSettings() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return { ...defaults };
      return { ...defaults, ...JSON.parse(raw) };
    } catch (e) { return { ...defaults }; }
  }

  function persist(s) {
    try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) {}
  }

  const settings = loadSettings();

  // 应用到 Sounds 模块
  function apply() {
    if (window.Sounds) {
      window.Sounds.volume = settings.volume;
      window.Sounds.musicVolume = settings.musicVolume ?? defaults.musicVolume;
      window.Sounds.muted = settings.muted;
      window.Sounds.applyVolumes?.();
    }
    document.documentElement.dataset.shake = settings.shake ? 'on' : 'off';
  }
  apply();

  // ---------- 注入样式 ----------
  const css = `
.settings-modal { position: fixed; inset: 0; background: rgba(0,0,0,0.65); display:none; align-items:center; justify-content:center; z-index: 20000; font-family: 'VT323', monospace; }
.settings-modal.show { display:flex; }
.settings-card {
  width: 380px; max-width: 92vw;
  background: #1a2030;
  border: 4px solid #f4f1e8;
  border-radius: 14px;
  box-shadow: 0 8px 0 rgba(0,0,0,0.6), 0 0 0 4px #000;
  padding: 22px 26px 26px;
  color: #f4f1e8;
}
.settings-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 16px;
  letter-spacing: 2px;
  text-align: center;
  margin-bottom: 18px;
  text-shadow: 2px 2px 0 #000;
  color: #fcd34d;
}
.settings-row { display:flex; align-items:center; justify-content:space-between; padding: 10px 4px; border-bottom: 1px dashed rgba(244,241,232,0.18); }
.settings-row:last-of-type { border-bottom: none; }
.settings-label { font-size: 20px; }
.settings-value { font-size: 18px; opacity: 0.7; min-width: 48px; text-align: right; }
.settings-range { width: 160px; accent-color: #f4c84a; }
.settings-toggle {
  width: 56px; height: 28px; border-radius: 14px;
  background: #4a4030;
  position: relative; cursor: pointer;
  transition: background 0.15s ease;
}
.settings-toggle.on { background: #2a8c54; }
.settings-toggle::after {
  content: ''; position: absolute;
  top: 3px; left: 3px;
  width: 22px; height: 22px;
  background: #f4f1e8; border-radius: 50%;
  transition: left 0.15s ease;
  box-shadow: 0 2px 0 rgba(0,0,0,0.3);
}
.settings-toggle.on::after { left: 31px; }
.settings-actions { display:flex; gap: 10px; margin-top: 22px; justify-content: center; }
.settings-actions .btn { padding: 10px 22px; font-size: 18px; }
.settings-danger {
  margin-top: 14px; text-align: center;
  font-size: 14px; opacity: 0.6;
  cursor: pointer; text-decoration: underline;
}
.settings-danger:hover { opacity: 1; color: #ff6a5a; }
`;
  const styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.appendChild(styleEl);

  // ---------- 注入 DOM ----------
  const modal = document.createElement('div');
  modal.className = 'settings-modal';
  modal.innerHTML = `
    <div class="settings-card">
      <div class="settings-title">OPTIONS</div>

      <div class="settings-row">
        <span class="settings-label">音效 / SFX</span>
        <input type="range" class="settings-range" id="setVolume" min="0" max="100" />
        <span class="settings-value" id="setVolumeVal">0%</span>
      </div>

      <div class="settings-row">
        <span class="settings-label">音乐 / Music</span>
        <input type="range" class="settings-range" id="setMusicVolume" min="0" max="100" />
        <span class="settings-value" id="setMusicVolumeVal">0%</span>
      </div>

      <div class="settings-row">
        <span class="settings-label">静音 / Mute</span>
        <div class="settings-toggle" id="setMute"></div>
      </div>

      <div class="settings-row">
        <span class="settings-label">震动反馈 / Shake</span>
        <div class="settings-toggle" id="setShake"></div>
      </div>

      <div class="settings-actions">
        <button class="btn btn-blue" id="setTest">试听</button>
        <button class="btn btn-yellow" id="setClose">CLOSE</button>
      </div>

      <div class="settings-danger" id="setWipe">清除存档 (Clear save)</div>
    </div>
  `;
  document.body.appendChild(modal);

  // ---------- 控件初始化 ----------
  const $vol  = modal.querySelector('#setVolume');
  const $volV = modal.querySelector('#setVolumeVal');
  const $mvol  = modal.querySelector('#setMusicVolume');
  const $mvolV = modal.querySelector('#setMusicVolumeVal');
  const $mute = modal.querySelector('#setMute');
  const $shake = modal.querySelector('#setShake');
  const $test = modal.querySelector('#setTest');
  const $close = modal.querySelector('#setClose');
  const $wipe  = modal.querySelector('#setWipe');

  function syncControls() {
    $vol.value = Math.round(settings.volume * 100);
    $volV.textContent = $vol.value + '%';
    $mvol.value = Math.round((settings.musicVolume ?? defaults.musicVolume) * 100);
    $mvolV.textContent = $mvol.value + '%';
    $mute.classList.toggle('on', settings.muted);
    $shake.classList.toggle('on', settings.shake);
  }
  syncControls();

  $vol.addEventListener('input', () => {
    settings.volume = parseInt($vol.value, 10) / 100;
    $volV.textContent = $vol.value + '%';
    apply(); persist(settings);
  });
  $mvol.addEventListener('input', () => {
    settings.musicVolume = parseInt($mvol.value, 10) / 100;
    $mvolV.textContent = $mvol.value + '%';
    apply(); persist(settings);
  });
  $mute.addEventListener('click', () => {
    settings.muted = !settings.muted;
    $mute.classList.toggle('on', settings.muted);
    apply(); persist(settings);
    if (!settings.muted && window.Sounds) Sounds.play('btn_click');
  });
  $shake.addEventListener('click', () => {
    settings.shake = !settings.shake;
    $shake.classList.toggle('on', settings.shake);
    apply(); persist(settings);
  });
  $test.addEventListener('click', () => {
    if (!window.Sounds) return;
    ['chip_pop','mult_pop','joker_trigger','coin'].forEach((n,i)=>setTimeout(()=>Sounds.play(n), i*200));
  });
  $close.addEventListener('click', closeModal);
  $wipe.addEventListener('click', () => {
    if (!confirm('确定要清除所有存档？此操作不可撤销。')) return;
    if (window.Save) Save.clear();
    localStorage.removeItem(KEY);
    location.reload();
  });
  modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && modal.classList.contains('show')) closeModal();
  });

  function openModal() {
    syncControls();
    modal.classList.add('show');
    if (window.Sounds) Sounds.play('btn_click');
  }
  function closeModal() {
    modal.classList.remove('show');
    if (window.Sounds) Sounds.play('btn_hover');
  }

  // 标题 OPTIONS 由 game.js handleTitleAction → Settings.open() 统一处理

  window.Settings = {
    open: openModal,
    close: closeModal,
    get: () => ({ ...settings }),
  };
})();
