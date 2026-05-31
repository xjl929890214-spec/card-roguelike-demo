/* ============================================================
 *  bgm.js — 原创 procedural 背景音乐（Web Audio，无外部音频文件）
 *  风格参考：noir lounge / lo-fi casino（非任何第三方曲目）
 * ============================================================ */
(function () {
  const BPM = 102;
  const BEAT = 60 / BPM;
  const LOOP_BARS = 4;
  const LOOP_BEATS = LOOP_BARS * 4;

  const CHORDS = [
    [57, 60, 64, 67],
    [62, 65, 69, 72],
    [53, 57, 60, 64],
    [64, 68, 71, 74],
  ];
  const BASS = [45, 50, 41, 52];
  const MELODY = [
    69, null, 72, 69, null, 74, 72, null,
    74, null, 76, 74, null, 72, 69, null,
  ];

  const MOODS = {
    title: { lpf: 3000, chordVol: 0.12, bassVol: 0.16, drumVol: 0.08, melVol: 0.06, noise: 0.01 },
    run:   { lpf: 4200, chordVol: 0.15, bassVol: 0.2,  drumVol: 0.12, melVol: 0.09, noise: 0.016 },
    shop:  { lpf: 4800, chordVol: 0.16, bassVol: 0.18, drumVol: 0.1,  melVol: 0.1,  noise: 0.012 },
  };

  let out = null;
  let lpf = null;
  let noiseSrc = null;
  let noiseGain = null;
  let playing = false;
  let mood = 'title';
  let beatIdx = 0;
  let nextBeatTime = 0;
  let timer = null;
  let started = false;

  function midiToHz(n) {
    return 440 * Math.pow(2, (n - 69) / 12);
  }

  function setupChain() {
    const ctx = window.Sounds?.getCtx?.();
    const bus = window.Sounds?.getBgmBus?.();
    if (!ctx || !bus || out) return ctx;

    lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.Q.value = 0.6;
    lpf.connect(bus);
    out = lpf;

    const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * 0.35;
    noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = buf;
    noiseSrc.loop = true;
    noiseGain = ctx.createGain();
    noiseGain.gain.value = 0;
    const nF = ctx.createBiquadFilter();
    nF.type = 'highpass';
    nF.frequency.value = 800;
    noiseSrc.connect(nF).connect(noiseGain).connect(out);
    noiseSrc.start();

    applyMood();
    return ctx;
  }

  function applyMood() {
    const m = MOODS[mood] || MOODS.run;
    if (lpf) lpf.frequency.setTargetAtTime(m.lpf, lpf.context.currentTime, 0.4);
    if (noiseGain) noiseGain.gain.setTargetAtTime(m.noise, noiseGain.context.currentTime, 0.4);
  }

  function playRhodes(ctx, notes, t, dur, vol) {
    if (!out || vol <= 0) return;
    notes.forEach((midi, i) => {
      const hz = midiToHz(midi);
      const g = ctx.createGain();
      const v = vol * (1 - i * 0.12);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(v, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      g.connect(out);

      ['sine', 'triangle'].forEach((type, j) => {
        const o = ctx.createOscillator();
        o.type = type;
        o.frequency.value = hz * (j ? 2.01 : 1);
        o.connect(g);
        o.start(t);
        o.stop(t + dur + 0.05);
      });
    });
  }

  function playBass(ctx, midi, t, dur, vol) {
    if (!out || vol <= 0) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.008);
    g.gain.setValueAtTime(vol * 0.85, t + 0.04);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    g.connect(out);
    const o = ctx.createOscillator();
    o.type = 'triangle';
    o.frequency.setValueAtTime(midiToHz(midi), t);
    o.connect(g);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  function playMelody(ctx, midi, t, vol) {
    if (!out || vol <= 0) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0, t);
    g.gain.linearRampToValueAtTime(vol, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.001, t + BEAT * 0.85);
    g.connect(out);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.value = midiToHz(midi);
    o.connect(g);
    o.start(t);
    o.stop(t + BEAT);
  }

  function playKick(ctx, t, vol) {
    if (!out || vol <= 0) return;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.14);
    g.connect(out);
    const o = ctx.createOscillator();
    o.type = 'sine';
    o.frequency.setValueAtTime(110, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    o.connect(g);
    o.start(t);
    o.stop(t + 0.16);
  }

  function playHat(ctx, t, vol) {
    if (!out || vol <= 0) return;
    const len = 0.04;
    const buf = ctx.createBuffer(1, ctx.sampleRate * len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = 7000;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.35, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + len);
    src.connect(f).connect(g).connect(out);
    src.start(t);
    src.stop(t + len);
  }

  function scheduleBeat(ctx, globalBeat, t) {
    const m = MOODS[mood] || MOODS.run;
    const bar = Math.floor(globalBeat / 4) % LOOP_BARS;
    const beatInBar = globalBeat % 4;
    const loopBeat = globalBeat % LOOP_BEATS;

    if (beatInBar === 0) {
      playRhodes(ctx, CHORDS[bar], t, BEAT * 3.6, m.chordVol);
    }

    const bassPattern = [0, 7, 4, 7];
    playBass(ctx, BASS[bar] + bassPattern[beatInBar], t, BEAT * 0.92, m.bassVol * 0.9);

    if (beatInBar === 0 || beatInBar === 2) playKick(ctx, t, m.drumVol);
    if (beatInBar === 1 || beatInBar === 3) playKick(ctx, t + BEAT * 0.02, m.drumVol * 0.55);
    playHat(ctx, t + BEAT * 0.5, m.drumVol);
    playHat(ctx, t + BEAT * 0.75, m.drumVol * 0.65);

    const mel = MELODY[loopBeat];
    if (mel != null) playMelody(ctx, mel, t + BEAT * 0.12, m.melVol);
  }

  function tick() {
    const ctx = setupChain();
    if (!ctx || !playing) return;

    const now = ctx.currentTime;
    while (nextBeatTime < now + 0.12) {
      scheduleBeat(ctx, beatIdx, nextBeatTime);
      beatIdx += 1;
      nextBeatTime += BEAT;
    }
  }

  function start() {
    const ctx = setupChain();
    if (!ctx || playing) return;
    playing = true;
    started = true;
    beatIdx = 0;
    nextBeatTime = ctx.currentTime + 0.08;
    tick();
    timer = setInterval(tick, 25);
  }

  function stop() {
    playing = false;
    if (timer) { clearInterval(timer); timer = null; }
  }

  function setMood(name) {
    if (!MOODS[name] || mood === name) return;
    mood = name;
    applyMood();
  }

  function syncScene() {
    if (document.querySelector('#scene-shop.active')) setMood('shop');
    else if (document.querySelector('#scene-game.active, #scene-blind.active')) setMood('run');
    else setMood('title');
  }

  function unlock() {
    setupChain();
    if (!started && !document.querySelector('#scene-title.active')) start();
    else if (!started) start();
  }

  function observeScenes() {
    document.querySelectorAll('.scene').forEach(el => {
      new MutationObserver(syncScene).observe(el, { attributes: true, attributeFilter: ['class'] });
    });
    syncScene();
  }

  function tryAutostart() {
    unlock();
    if (!playing) start();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', observeScenes);
  } else {
    observeScenes();
  }

  document.addEventListener('click', tryAutostart, { once: true });
  document.addEventListener('keydown', tryAutostart, { once: true });

  window.BGM = { start, stop, setMood, unlock, syncScene };
})();
