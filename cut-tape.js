/* Pelican Cut's field recorder. Live monitoring and saved takes share the same source reels. */
(() => {
  'use strict';

  const rate = 10, frames = 26, sampleRate = 12000;
  const durations = { spoonbills: 8, windpump: 7.8, trawler: 20, wind: 8 };
  // The reels line up again every 26 minutes, so the save only needs a millisecond offset.
  const period = 1560;
  const sources = ['spoonbills', 'windpump', 'trawler'];
  const cache = new Map();
  const tau = Math.PI * 2;
  const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
  const wrap = (v, n) => ((v % n) + n) % n;
  const hasSource = id => sources.includes(id);

  function random(seed) {
    return () => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      return seed / 2147483648 - 1;
    };
  }

  function overdub(reel, start, duration, sample) {
    const offset = Math.round(start * sampleRate);
    const count = Math.round(duration * sampleRate);
    for (let i = 0; i < count; i++) {
      reel[(offset + i) % reel.length] += sample(i / sampleRate, i / count);
    }
  }

  function knock(reel, at, pitch, volume, decay, rough) {
    overdub(reel, at, Math.min(0.65, 7 / decay), t => {
      const phase = tau * t * pitch;
      const ring = Math.sin(phase) + 0.43 * Math.sin(phase * 2.48) + 0.19 * Math.sin(phase * 4.32);
      const attack = Math.min(1, t * 900);
      return volume * attack * (ring * Math.exp(-t * decay) + rough() * 0.61 * Math.exp(-t * 270));
    });
  }

  function spoonbills(reel, rough) {
    // The pair trade low croaks and paired bill snaps. Wings brush the reeds between calls.
    const calls = [
      [0.16, 0.40, 310, 0.29], [0.68, 0.28, 254, 0.21], [1.74, 0.34, 287, 0.30],
      [2.48, 0.28, 342, 0.19], [3.22, 0.36, 258, 0.30], [4.27, 0.31, 299, 0.23],
      [4.72, 0.29, 282, 0.26], [5.78, 0.41, 325, 0.31], [6.46, 0.22, 264, 0.18],
      [7.28, 0.35, 300, 0.27]
    ];
    for (const [at, volume, pitch, duration] of calls) {
      let phase = 0;
      overdub(reel, at, duration, (t, u) => {
        const breath = Math.sin(Math.PI * u);
        phase += tau * pitch * (0.83 + 0.32 * breath - 0.08 * u + 0.034 * Math.sin(t * 65)) / sampleRate;
        const call = Math.sin(phase) + 0.38 * Math.sin(phase * 2.01) + 0.14 * Math.sin(phase * 3.86);
        const throat = 0.62 + 0.38 * Math.sin(phase * 0.21) ** 2;
        return volume * breath ** 1.45 * (call * throat + rough() * 0.12);
      });
    }
    for (const at of [0.04, 0.46, 1.43, 2.25, 3.66, 4.13, 5.35, 6.24, 7.68]) {
      knock(reel, at, 763, 0.28, 112, rough);
      knock(reel, at + 0.060 + (at % 1) * 0.025, 1055, 0.20, 154, rough);
    }
    for (const at of [0.95, 2.87, 4.95, 6.94]) {
      let air = 0;
      overdub(reel, at, 0.35, (_, u) => {
        air += (rough() - air) * 0.23;
        return 0.14 * air * Math.sin(Math.PI * u) ** 2 * (0.38 + 0.62 * Math.sin(u * 7.7) ** 2);
      });
    }
  }

  function windpump(reel, rough) {
    // Six strokes of the rocker. The return pin ticks against two different pieces of iron.
    const backlash = [0, 0.026, -0.014, 0.018, -0.009, 0.012];
    for (let stroke = 0; stroke < backlash.length; stroke++) {
      const at = stroke * 1.3;
      let phase = 0;
      overdub(reel, at + 0.42, 0.58, (t, u) => {
        const tension = Math.sin(u * Math.PI);
        phase += tau * (175 + 108 * tension + 9 * Math.sin(u * 23) + 7 * stroke) / sampleRate;
        const scrape = Math.sin(phase) + 0.58 * Math.sin(phase * 2.97) + 0.38 * Math.sin(phase * 5.07);
        return 0.21 * tension ** 1.25 * (scrape * (0.70 + 0.30 * Math.sin(t * 97)) + rough() * 0.20);
      });
      knock(reel, at + 0.975, 441, 0.36, 22, rough);
      knock(reel, at + 1.044 + backlash[stroke], 923, 0.18, 65, rough);
      knock(reel, at + 0.24, 227, 0.23, 43, rough);
    }
  }

  function trawler(reel, rough) {
    // One cylinder pulse as a wavetable keeps the first pass cheap on a Chromebook.
    const steps = 1024;
    const crank = new Float32Array(steps + 1), exhaust = new Float32Array(steps + 1);
    for (let i = 0; i <= steps; i++) {
      const stroke = (i % steps) / steps, p = tau * stroke;
      exhaust[i] = (1 - stroke) ** 7;
      crank[i] = 0.18 * Math.sin(p) + 0.18 * Math.sin(2 * p + 0.4) +
        0.105 * Math.sin(4 * p) + 0.061 * Math.sin(7 * p) + 0.10 * exhaust[i] * Math.sin(11 * p);
    }
    const rotation = t => 30 * t + 0.32 * Math.sin(tau * t / 20) + 0.061 * Math.sin(tau * t / 2);
    const load = t => 0.71 + 0.29 * (0.5 + 0.5 * Math.cos(tau * 1.65 * t)) ** 5;
    const block = sampleRate / 100;
    let air = 0, previousRotation = rotation(0), previousLoad = load(0);
    for (let start = 0; start < reel.length; start += block) {
      const time = (start + block) / sampleRate;
      const nextRotation = rotation(time), nextLoad = load(time);
      for (let j = 0; j < block; j++) {
        const f = j / block;
        const cycle = previousRotation + (nextRotation - previousRotation) * f;
        const phase = (cycle - Math.floor(cycle)) * steps;
        const i = Math.floor(phase), blend = phase - i;
        const motor = crank[i] + (crank[i + 1] - crank[i]) * blend;
        const pulse = exhaust[i] + (exhaust[i + 1] - exhaust[i]) * blend;
        air += (rough() - air) * 0.32;
        reel[start + j] = motor * (previousLoad + (nextLoad - previousLoad) * f) + pulse * 0.28 * air;
      }
      previousRotation = nextRotation;
      previousLoad = nextLoad;
    }
    for (const at of [0.22, 1.91, 3.70, 5.17, 6.94, 8.8, 10.3, 12.7, 14.1, 16.3, 18.7]) {
      knock(reel, at, 652, 0.21, 30, rough);
      knock(reel, at + 0.115, 966, 0.13, 45, rough);
    }
  }

  function wind(reel, rough) {
    let low = 0, mid = 0;
    for (let i = 0; i < reel.length; i++) {
      const n = rough(), t = i / sampleRate;
      low += (n - low) * 0.026;
      mid += (n - mid) * 0.22;
      const gust = 0.45 + 0.27 * Math.sin(tau * t / 8 + 0.4) + 0.16 * Math.sin(tau * t / 2);
      reel[i] = gust * (2.2 * low + 0.30 * mid);
    }
  }

  function signal(id) {
    if (!hasSource(id) && id !== 'wind') return null;
    if (cache.has(id)) return cache.get(id);
    const reel = new Float32Array(Math.round(sampleRate * durations[id]));
    const rough = random(4709 + 971 * (sources.indexOf(id) + 1));
    const synthesize = { spoonbills, windpump, trawler, wind };
    synthesize[id](reel, rough);
    for (let i = 0; i < reel.length; i++) {
      const fade = Math.min(1, i / 70, (reel.length - 1 - i) / 70);
      reel[i] = clamp(reel[i] * fade, -0.96, 0.96);
    }
    cache.set(id, reel);
    return reel;
  }

  function hasFrames(values) {
    return (Array.isArray(values) || ArrayBuffer.isView(values)) && values.length === frames;
  }

  function validChannel(values, min, max) {
    if (!hasFrames(values)) return false;
    for (const value of values) {
      if (!Number.isInteger(value) || value < min || value > max) return false;
    }
    return true;
  }

  function read(raw) {
    if (!raw || !hasSource(raw.id) || !Number.isInteger(raw.offset) || raw.offset < 0 || raw.offset >= period * 1000) return null;
    if (!validChannel(raw.levels, 0, 255) || !validChannel(raw.pans, -127, 127)) return null;
    if (raw.noise != null && !validChannel(raw.noise, 0, 255)) return null;
    return {
      id: raw.id, offset: raw.offset,
      levels: Array.from(raw.levels), pans: Array.from(raw.pans),
      noise: raw.noise ? Array.from(raw.noise) : new Array(frames).fill(0)
    };
  }

  function quantize(values, min, scale) {
    if (!hasFrames(values)) return null;
    const bytes = [];
    for (const value of values) {
      if (!Number.isFinite(value)) return null;
      bytes.push(Math.round(clamp(value, min, 1) * scale) || 0);
    }
    return bytes;
  }

  function capture(id, seconds, levels, pans, interference) {
    if (!hasSource(id) || !Number.isFinite(seconds)) return null;
    const gain = quantize(levels, 0, 255);
    const stereo = pans == null ? new Array(frames).fill(0) : quantize(pans, -1, 127);
    const noise = interference == null ? new Array(frames).fill(0) : quantize(interference, 0, 255);
    if (!gain || !stereo || !noise) return null;
    return { id, offset: wrap(Math.round(wrap(seconds, period) * 1000), period * 1000), levels: gain, pans: stereo, noise };
  }

  function render(raw) {
    const tape = read(raw);
    if (!tape) return null;
    const subject = signal(tape.id);
    const windReel = tape.noise.some(n => n > 0) ? signal('wind') : null;
    const samplesPerFrame = sampleRate / rate;
    const count = samplesPerFrame * frames;
    const left = new Float32Array(count), right = new Float32Array(count);
    const sourceAt = Math.round(tape.offset * sampleRate / 1000);
    const gains = tape.pans.map((pan, frame) => {
      const angle = (pan / 127 + 1) * Math.PI / 4;
      const volume = tape.levels[frame] / 255;
      return [volume * Math.cos(angle), volume * Math.sin(angle), 0.56 * tape.noise[frame] / 255];
    });
    for (let frame = 0; frame < frames; frame++) {
      const a = gains[frame], b = gains[Math.min(frame + 1, frames - 1)];
      for (let j = 0; j < samplesPerFrame; j++) {
        const i = frame * samplesPerFrame + j, k = sourceAt + i, t = j / samplesPerFrame;
        const fade = Math.min(1, i / 64, (count - 1 - i) / 100);
        const dry = subject[k % subject.length];
        const air = windReel ? windReel[k % windReel.length] * (a[2] + (b[2] - a[2]) * t) : 0;
        left[i] = (dry * (a[0] + (b[0] - a[0]) * t) + air) * fade;
        right[i] = (dry * (a[1] + (b[1] - a[1]) * t) + air) * fade;
      }
    }
    return { left, right };
  }

  window.BayCutTape = Object.freeze({ rate, frames, sampleRate, period, hasSource, capture, read, render, signal });
})();
