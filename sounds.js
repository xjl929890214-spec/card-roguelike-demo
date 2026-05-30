// ============ WebAudio synthesized sound effects ============
// All sounds are generated procedurally — no external audio files.

(function () {
  let ctx = null;
  function getCtx() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
    }
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Generic tone: freq sweep, gain envelope, optional noise/square shape
  function tone({ freq=440, freqEnd=null, dur=0.1, type='sine', vol=0.2, attack=0.005, decay=null }) {
    const c = getCtx();
    if (!c) return;
    const t0 = c.currentTime;
    const tEnd = t0 + dur;

    const osc = c.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (freqEnd !== null) osc.frequency.exponentialRampToValueAtTime(Math.max(1, freqEnd), tEnd);

    const g = c.createGain();
    g.gain.setValueAtTime(0, t0);
    g.gain.linearRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, decay ? t0 + decay : tEnd);

    osc.connect(g).connect(c.destination);
    osc.start(t0);
    osc.stop(tEnd + 0.02);
  }

  function noiseBurst({ dur=0.08, vol=0.15, filterFreq=4000 }) {
    const c = getCtx();
    if (!c) return;
    const t0 = c.currentTime;
    const buf = c.createBuffer(1, c.sampleRate * dur, c.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = (Math.random() * 2 - 1);
    const src = c.createBufferSource();
    src.buffer = buf;
    const filter = c.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const g = c.createGain();
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(g).connect(c.destination);
    src.start(t0);
    src.stop(t0 + dur);
  }

  const SOUNDS = {
    btn_hover()  { tone({ freq:880, dur:0.04, type:'sine', vol:0.05 }); },
    btn_click()  { tone({ freq:660, freqEnd:440, dur:0.08, type:'square', vol:0.12 }); },
    card_select(){ tone({ freq:900, dur:0.05, type:'triangle', vol:0.1 }); },
    card_play()  { tone({ freq:520, freqEnd:780, dur:0.12, type:'triangle', vol:0.15 }); },
    chip_score() {
      // little ascending pip
      tone({ freq:600 + Math.random()*200, dur:0.06, type:'square', vol:0.08 });
    },
    mult_score() {
      tone({ freq:740, freqEnd:920, dur:0.1, type:'sawtooth', vol:0.12 });
    },
    big_score() {
      const c = getCtx();
      const base = 440;
      [0, 0.06, 0.12].forEach((d, i) => {
        setTimeout(() => tone({ freq: base * (1 + i*0.25), freqEnd: base * (1 + i*0.5), dur:0.15, type:'sawtooth', vol:0.15 }), d*1000);
      });
    },
    win() {
      // ascending arpeggio
      const notes = [523, 659, 784, 1047];
      notes.forEach((n, i) => setTimeout(() => tone({ freq:n, dur:0.2, type:'triangle', vol:0.15 }), i*100));
    },
    lose() {
      tone({ freq:330, freqEnd:110, dur:0.6, type:'sawtooth', vol:0.18 });
    },
    buy() {
      tone({ freq:880, freqEnd:1320, dur:0.12, type:'triangle', vol:0.15 });
    },
    sell() {
      tone({ freq:660, freqEnd:330, dur:0.15, type:'triangle', vol:0.15 });
    },
    discard() {
      noiseBurst({ dur:0.08, vol:0.12, filterFreq:2000 });
    },
    draw() {
      tone({ freq:520, dur:0.04, type:'sine', vol:0.08 });
    },
    scene_in() {
      tone({ freq:220, freqEnd:660, dur:0.3, type:'sine', vol:0.12 });
    },
    coin() {
      tone({ freq:988, dur:0.06, type:'triangle', vol:0.1 });
      setTimeout(() => tone({ freq:1318, dur:0.1, type:'triangle', vol:0.1 }), 50);
    },
  };

  window.Sounds = {
    play(name) {
      const fn = SOUNDS[name];
      if (fn) try { fn(); } catch (e) { /* swallow */ }
    },
  };

  // Unlock audio on first user interaction (browser policy)
  function unlock() {
    getCtx();
    document.removeEventListener('click', unlock);
    document.removeEventListener('keydown', unlock);
  }
  document.addEventListener('click', unlock);
  document.addEventListener('keydown', unlock);
})();
