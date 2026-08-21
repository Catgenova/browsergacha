// Sound: every cue synthesized, no audio files.
//
// A handful of oscillators and noise bursts suit a pixel game better
// than samples, and they cost nothing to ship — the whole soundtrack is
// this file. Cues are short, shaped to avoid the click you get from
// starting or stopping a waveform at non-zero amplitude.
//
// Browsers refuse to start audio until the player has interacted with
// the page, so the context is created lazily on the first cue AFTER a
// real gesture and resumed if it was suspended.

const Sound = (() => {
  const KEY = 'bg_muted';
  let ctx = null;
  let master = null;
  let muted = false;
  try { muted = localStorage.getItem(KEY) === '1'; } catch (e) { /* no storage */ }

  // An AoE that hits seven units fires seven identical cues in the same
  // millisecond, which sums to a distorted spike rather than a louder
  // hit. Collapse repeats of the same cue inside a short window.
  const lastAt = new Map();
  const MIN_GAP = 0.045; // seconds

  function ready() {
    if (muted) return false;
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      try {
        ctx = new AC();
        master = ctx.createGain();
        master.gain.value = 0.22; // headroom: cues overlap constantly
        master.connect(ctx.destination);
      } catch (e) { return false; }
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx.state !== 'suspended';
  }

  // One shaped tone. `slide` bends the pitch over the life of the note,
  // which is most of the character in a blip this short.
  function tone(freq, { dur = 0.09, type = 'square', gain = 1, slide = 1, delay = 0 } = {}) {
    const t0 = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slide !== 1) osc.frequency.exponentialRampToValueAtTime(freq * slide, t0 + dur);
    // Attack fast, decay to (near) silence: ramping to exactly 0 is
    // undefined for an exponential ramp, hence the epsilon.
    env.gain.setValueAtTime(0.0001, t0);
    env.gain.exponentialRampToValueAtTime(gain, t0 + 0.006);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(env);
    env.connect(master);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  // Filtered white noise — impacts, deaths, the shing of a crit.
  function noise({ dur = 0.12, gain = 0.7, from = 1800, to = 200, q = 1, delay = 0 } = {}) {
    const t0 = ctx.currentTime + delay;
    const n = Math.floor(ctx.sampleRate * dur);
    const buf = ctx.createBuffer(1, n, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < n; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = q;
    filter.frequency.setValueAtTime(from, t0);
    filter.frequency.exponentialRampToValueAtTime(Math.max(40, to), t0 + dur);
    const env = ctx.createGain();
    env.gain.setValueAtTime(gain, t0);
    env.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter);
    filter.connect(env);
    env.connect(master);
    src.start(t0);
    src.stop(t0 + dur);
  }

  const CUES = {
    hit()    { noise({ dur: 0.1, from: 1400, to: 180, gain: 0.55 });
               tone(180, { dur: 0.07, type: 'square', gain: 0.25, slide: 0.6 }); },
    crit()   { noise({ dur: 0.16, from: 3200, to: 300, gain: 0.7, q: 0.8 });
               tone(520, { dur: 0.13, type: 'sawtooth', gain: 0.32, slide: 0.45 }); },
    heal()   { tone(660, { dur: 0.12, type: 'sine', gain: 0.3, slide: 1.5 });
               tone(990, { dur: 0.14, type: 'sine', gain: 0.18, slide: 1.33, delay: 0.05 }); },
    ward()   { tone(300, { dur: 0.18, type: 'triangle', gain: 0.26, slide: 1.6 }); },
    death()  { tone(220, { dur: 0.34, type: 'sawtooth', gain: 0.3, slide: 0.28 });
               noise({ dur: 0.3, from: 700, to: 60, gain: 0.4 }); },
    // Two chords: the game's whole reward loop lands on this one.
    victory() { [523, 659, 784, 1047].forEach((f, i) =>
                 tone(f, { dur: 0.34, type: 'triangle', gain: 0.3, delay: i * 0.075 })); },
    defeat()  { [392, 330, 262].forEach((f, i) =>
                 tone(f, { dur: 0.38, type: 'triangle', gain: 0.28, delay: i * 0.13 })); },
    levelup() { [660, 880, 1320].forEach((f, i) =>
                 tone(f, { dur: 0.16, type: 'square', gain: 0.22, delay: i * 0.06 })); },
    // Rising sparkle for a rare pull; the higher the rarity the further
    // the run climbs, so the ear learns the tell before the card turns.
    summon(rarity = 3) {
      const steps = Math.max(2, Math.min(6, rarity));
      for (let i = 0; i < steps; i++) {
        tone(440 * Math.pow(1.26, i), {
          dur: 0.13, type: 'triangle', gain: 0.22, delay: i * 0.055,
        });
      }
    },
    click() { tone(880, { dur: 0.035, type: 'square', gain: 0.12, slide: 1.2 }); },
  };

  function play(name, arg) {
    if (!CUES[name] || !ready()) return;
    const now = ctx.currentTime;
    if (now - (lastAt.get(name) || -1) < MIN_GAP) return;
    lastAt.set(name, now);
    try { CUES[name](arg); } catch (e) { /* a dead cue must never stop a fight */ }
  }

  return {
    play,
    isMuted() { return muted; },
    setMuted(on) {
      muted = !!on;
      try { localStorage.setItem(KEY, muted ? '1' : '0'); } catch (e) {}
      if (muted && ctx) { try { ctx.suspend(); } catch (e) {} }
      return muted;
    },
    toggle() { return this.setMuted(!muted); },
    cueNames() { return Object.keys(CUES); },
  };
})();
