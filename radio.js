(() => {
  'use strict';

  const beat = 60 / 96;
  const stepLength = beat / 4;
  const hz = note => 440 * 2 ** ((note - 69) / 12);
  const unit = value => Math.min(1, Math.max(0, Number(value) || 0));
  const voices = new Set();
  const harmony = [
    { bass: 38, keys: [54, 57, 61, 64] }, { bass: 37, keys: [52, 56, 59, 64] },
    { bass: 35, keys: [50, 54, 57, 61] }, { bass: 40, keys: [50, 56, 61, 66] },
    { bass: 42, keys: [52, 57, 61, 68] }, { bass: 37, keys: [52, 56, 59, 69] },
    { bass: 31, keys: [54, 59, 62, 69] }
  ];
  // After Hours, an original 32-bar radio cut. Notes are [sixteenth, MIDI pitch, duration in sixteenths].
  const chart = [4, 3, 0, 1, 2, 3, 4, 5, 0, 3, 0, 1, 2, 3, 4, 5, 0, 3, 4, 6, 2, 3, 0, 1, 2, 3, 4, 5, 0, 3, 0, 3];
  const verse = [
    [[3,69,2.4],[7,66,4.8],[14,64,1.7]], [[1,64,6.3],[11,68,3.3]],
    [[6,69,2],[9,73,5.5]], [],
    [[1,73,2],[4,69,2.3],[8,68,5.6]], [[0,64,7.1]],
    [[6,66,2],[9,69,2.5],[13,71,2.2]], [[1,68,5.2]]
  ];
  const refrain = [
    [[0,73,2.1],[3,69,2.5],[7,76,6.9]], [[1,73,4.8],[9,71,2.1],[12,68,3.4]],
    [[0,71,2],[3,66,2.5],[7,74,7.3]], [[1,73,5.3],[12,68,2.7]],
    [[0,73,2.1],[3,69,2.5],[7,76,4.8],[13,78,2]], [[1,76,6.7],[11,73,3.1]],
    [[1,69,2.5],[5,66,2.5],[9,73,5.8]], [[0,71,4.5],[8,69,5.8]]
  ];
  const bridge = [[[2,68,8.5]], [], [[0,66,4],[7,69,3.7]], [[2,68,5.6]]];
  const badge = [[0,76],[0.17,73],[0.36,81],[0.62,78]];
  const cueNotes = { job: [61, 66, 69], paid: [66, 69, 73, 78], heat: [67, 60] };
  const beds = new Map();
  const bedsByName = {
    engine: ['sawtooth', 'lowpass', 0.59], skid: ['noise', 'bandpass', 1.8], tire: ['triangle', 'lowpass', 0.62],
    surf: ['noise', 'lowpass', 0.52], street: ['noise', 'lowpass', 0.8], quay: ['sine', 'lowpass', 0.6],
    rotor: ['rotor', 'lowpass', 0.70]
  };

  let context, master, music, instruments, effects, ambience, hats, noise, waves;
  let enabled = false, paused = false;
  let driving = false, boating = false, speed = 0, heat = 0, siren = 0, rotor = 0, coast = 0, docks = 0, skid = 0;
  let nextStep = 0, step = 0, nextMix = 0, skidSince = null, nextGull = 0, nextPortSound = 0;
  let nextHorn = 0, nextTrafficHorn = 0, nextSiren = 0, seed = 87533, portBell = true, worldTime = 0;

  function random() {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed / 4294967296;
  }

  function gainNode(destination, amount) {
    const node = context.createGain();
    node.gain.value = amount;
    node.connect(destination);
    return node;
  }

  function initialize() {
    if (context) return true;
    const Audio = window.AudioContext || window.webkitAudioContext;
    if (!Audio) return false;
    try {
      context = new Audio();
      master = gainNode(context.destination, 0);
      music = gainNode(master, 0.66);
      instruments = gainNode(music, 1);
      effects = gainNode(master, 0.88);
      ambience = gainNode(master, 0.74);
      hats = context.createBiquadFilter();
      hats.type = 'highpass';
      hats.frequency.value = 4100;
      hats.Q.value = 0.45;
      hats.connect(music);

      const echo = context.createDelay(0.5);
      echo.delayTime.value = beat * 0.375;
      instruments.connect(echo);
      echo.connect(gainNode(music, 0.135));

      const rate = Math.min(context.sampleRate, 24000);
      const length = Math.floor(rate * 2.3);
      noise = context.createBuffer(1, length, rate);
      const samples = noise.getChannelData(0);
      for (let i = 0; i < length; i++) samples[i] = random() * 2 - 1;
      const shape = partials => context.createPeriodicWave(new Float32Array(partials.length), Float32Array.from(partials));
      waves = {
        reed: shape([0, 1, 0.31, 0.21, 0.075, 0.095, 0.025]),
        tine: shape([0, 1, 0.2, 0.28, 0.06, 0.04]),
        bass: shape([0, 1, 0.44, 0.2, 0.13, 0.06]),
        horn: shape([0, 0.68, 1, 0.57, 0.39, 0.21, 0.13, 0.07]),
        rotor: shape([0, .15, .30, .56, .87, 1, .86, .63, .42, .23, .11])
      };
      return true;
    } catch {
      if (context) context.close().catch(() => {});
      context = null;
      return false;
    }
  }

  function release(voice) {
    voice.source.onended = null;
    voice.source.disconnect();
    voice.envelope.disconnect();
    if (voice.filter) voice.filter.disconnect();
    if (voice.key && beds.get(voice.key) === voice) beds.delete(voice.key);
    voices.delete(voice);
  }

  function strike(source, destination, start, length, volume, attack, sustain = 0) {
    const envelope = gainNode(destination, 0);
    const end = start + length;
    envelope.gain.setValueAtTime(0.0001, start);
    envelope.gain.exponentialRampToValueAtTime(volume, start + attack);
    if (sustain) {
      const releaseAt = end - Math.min(0.24, length * 0.27);
      const decayAt = Math.min(releaseAt, start + attack + 0.10);
      envelope.gain.exponentialRampToValueAtTime(volume * sustain, decayAt);
      envelope.gain.setValueAtTime(volume * sustain, releaseAt);
    }
    envelope.gain.exponentialRampToValueAtTime(0.0001, end);
    source.connect(envelope);
    const voice = { source, envelope };
    voices.add(voice);
    source.onended = () => release(voice);
    source.start(start);
    source.stop(end + 0.01);
  }

  function oscillator(shape, frequency, start) {
    const source = context.createOscillator();
    if (waves[shape]) source.setPeriodicWave(waves[shape]);
    else source.type = shape;
    source.frequency.setValueAtTime(frequency, start);
    return source;
  }

  function tone(destination, frequency, start, length, volume, shape = 'sine', slide = 0, attack = 0.008, sustain = 0) {
    const source = oscillator(shape, frequency, start);
    if (slide) source.frequency.exponentialRampToValueAtTime(slide, start + length * 0.84);
    strike(source, destination, start, length, volume, attack, sustain);
  }

  function hiss(start, length, volume) {
    const source = context.createBufferSource();
    source.buffer = noise;
    strike(source, hats, start, length, volume, 0.003);
  }

  function stationIdent(start) {
    for (const [offset, note] of badge) {
      const length = offset > 0.6 ? 0.89 : 0.3;
      tone(instruments, hz(note), start + offset, length, 0.115, 'tine', 0, 0.014, 0.22);
      tone(instruments, hz(note + 12), start + offset, length * 0.55, 0.025);
    }
  }

  function melody(note, start, length, bright) {
    const pitch = hz(note);
    const reed = oscillator('reed', pitch * 0.985, start);
    reed.frequency.exponentialRampToValueAtTime(pitch, start + 0.048);
    if (length > 0.52) {
      // A player leans into a held note; short answers stay straight.
      let raised = true;
      for (let t = 0.23; t < length - 0.09; t += 0.108) {
        reed.frequency.linearRampToValueAtTime(pitch * (raised ? 1.0036 : 0.9974), start + t);
        raised = !raised;
      }
    }
    strike(reed, instruments, start, length, bright ? 0.097 : 0.078, 0.032, 0.66);
  }

  function playDrums(bar, tick, at, full, sparse) {
    const fill = bar === 9 || bar === 17 || bar === 21 || bar === 29;
    if (tick === 0 || (!sparse && (tick === 9 || (full && bar % 2 && tick === 6)))) {
      tone(music, 114, at, 0.23, 0.21, 'sine', 43, 0.003);
    }
    if (tick === 4 || (tick === 12 && !sparse)) {
      tone(music, 336, at + 0.006, 0.08, 0.066, 'triangle', 194, 0.003);
      hiss(at + 0.011, full ? 0.145 : 0.085, full ? 0.10 : 0.064);
    }
    if ((!sparse && tick % 4 === 2) || (sparse && tick === 10)) {
      const open = full && tick === 14 && !fill;
      hiss(at + 0.014, open ? 0.20 : 0.065, tick === 6 ? 0.059 : 0.042);
    }
    if (full && (tick === 3 || (bar % 2 && tick === 11))) {
      tone(music, tick === 3 ? 227 : 271, at + 0.008, 0.16, 0.065, 'sine', tick === 3 ? 178 : 213);
    }
    if (fill && (tick === 12 || tick === 14 || tick === 15)) {
      const pitch = tick === 12 ? 201 : tick === 14 ? 160 : 127;
      tone(music, pitch, at, 0.19, tick === 15 ? 0.12 : 0.095, 'tine', pitch * 0.69);
    }
  }

  function radioStep(index, start) {
    const bar = Math.floor(index / 16) % chart.length;
    const tick = index % 16;
    const at = start + (tick % 2 ? 0.013 : 0);
    const chord = harmony[chart[bar]];
    const chorus = (bar >= 10 && bar < 18) || (bar >= 22 && bar < 30);
    const breakdown = bar >= 18 && bar < 22;
    const sparse = breakdown || bar < 2 || bar >= 30;
    if (bar === 0 && tick === 0) stationIdent(at);
    if (bar === 0 && tick < 8) return;

    playDrums(bar, tick, at, chorus, sparse);
    if (tick === 0 || (sparse ? tick === 10 : tick === 7 || tick === 10 || (chorus && tick === 14))) {
      const offset = tick === 7 ? 7 : tick === 14 ? 12 : 0;
      const length = tick === 0 ? (sparse ? 1.05 : 0.66) : 0.31;
      tone(music, hz(chord.bass + offset), at, length, 0.15, 'bass', 0, 0.012, 0.40);
    }
    if (tick === (sparse ? 0 : 2) || (chorus && tick === 10) || (!sparse && bar % 2 && tick === 12)) {
      const length = sparse ? 1.70 : tick === 2 ? 0.81 : 0.31;
      chord.keys.forEach((note, i) => {
        tone(instruments, hz(note), at + i * 0.006, length, 0.042, 'tine', 0, 0.022, sparse ? 0.53 : 0.28);
      });
    }
    let phrase;
    if (bar >= 2 && bar < 10) phrase = verse[bar - 2];
    if (chorus) phrase = refrain[(bar - (bar < 18 ? 10 : 22)) % 8];
    if (breakdown) phrase = bridge[bar - 18];
    if (phrase) {
      for (const [when, pitch, duration] of phrase) {
        if (when === tick) melody(pitch, at + 0.017, duration * stepLength, chorus);
      }
    }
    if (bar === 31 && tick === 13) tone(instruments, hz(68), at, 0.32, 0.045, 'tine');
  }

  function mixBed(key, bus, now, volume, cutoff, pitch = 0) {
    let voice = beds.get(key);
    if (volume < 0.001) {
      if (voice) {
        beds.delete(key);
        voice.envelope.gain.setTargetAtTime(0, now, 0.035);
        voice.source.stop(now + 0.19);
      }
      return;
    }
    if (!voice) {
      const [shape, type, resonance] = bedsByName[key];
      const filter = context.createBiquadFilter();
      const envelope = gainNode(bus, 0);
      const source = shape === 'noise' ? context.createBufferSource() : oscillator(shape, pitch, now);
      if (shape === 'noise') { source.buffer = noise; source.loop = true; }
      filter.type = type;
      filter.Q.value = resonance;
      filter.frequency.value = cutoff;
      source.connect(filter);
      filter.connect(envelope);
      voice = { source, envelope, filter, key };
      voices.add(voice);
      beds.set(key, voice);
      source.onended = () => release(voice);
      if (shape === 'noise') source.start(now, random() * 1.7);
      else source.start(now);
    }
    voice.envelope.gain.setTargetAtTime(volume, now, 0.12);
    voice.filter.frequency.setTargetAtTime(cutoff, now, 0.14);
    if (pitch) voice.source.frequency.setTargetAtTime(pitch, now, 0.10);
  }

  function gull(at, pitch, power) {
    const length = 0.44;
    const bird = oscillator('reed', pitch * 0.77, at);
    bird.frequency.exponentialRampToValueAtTime(pitch * 1.12, at + 0.09);
    bird.frequency.exponentialRampToValueAtTime(pitch * 0.96, at + 0.18);
    bird.frequency.exponentialRampToValueAtTime(pitch * 1.015, at + 0.235);
    bird.frequency.exponentialRampToValueAtTime(pitch * 0.60, at + 0.405);
    strike(bird, ambience, at, length, power, 0.055, 0.38);
  }

  function environmentalSounds(now) {
    if (coast < 0.38) nextGull = now + 3.2;
    if (coast >= 0.38 && now >= nextGull) {
      const pitch = 1080 + 310 * random();
      const power = coast * (driving ? 0.026 : 0.044);
      gull(now + 0.01, pitch, power);
      if (random() > 0.30) gull(now + 0.61, pitch * 0.94, power * 0.70);
      nextGull = now + 10 + random() * 13;
    }
    if (docks < 0.42) nextPortSound = now + 2.5;
    if (docks >= 0.42 && now >= nextPortSound) {
      const power = docks * (driving ? 0.043 : 0.061);
      if (portBell) {
        const detune = 0.98 + random() * 0.035;
        tone(ambience, 342 * detune, now + 0.01, 1.35, power, 'sine', 0, 0.014);
        tone(ambience, 846 * detune, now + 0.014, 0.75, power * 0.43);
        tone(ambience, 1170 * detune, now + 0.015, 0.31, power * 0.24);
      } else {
        tone(ambience, 115, now + 0.02, 1.6, power * 0.67, 'horn', 119, 0.29, 0.66);
        tone(ambience, 174, now + 0.07, 1.42, power * 0.33, 'horn', 177, 0.24, 0.62);
      }
      portBell = !portBell;
      nextPortSound = now + 10.3 + random() * 11;
    }
    if (heat <= 0) nextSiren = now + 1.2;
    if (heat > 0 && siren > 0.035 && now >= nextSiren) {
      tone(effects, 415, now + 0.01, 0.46, 0.043 * siren, 'sine', 651, 0.095, 0.64);
      tone(effects, 638, now + 0.46, 0.50, 0.036 * siren, 'sine', 389, 0.08, 0.58);
      nextSiren = now + 3.3 - siren * 1.5 + random() * .4;
    }
  }

  function mix(now) {
    if (now < nextMix) return;
    nextMix = now + 0.085;
    const velocity = Math.min(1, speed / 38);
    const inside = driving && !boating ? 0.57 : 1;
    const swell = (0.5 + 0.5 * Math.sin(worldTime * 0.90 + 0.8 * Math.sin(worldTime * 0.27))) ** 1.7;
    const passing = (0.5 + 0.5 * Math.sin(worldTime * 0.71 + 2 * Math.sin(worldTime * 0.19))) ** 2;
    music.gain.setTargetAtTime(driving ? 0.71 : 0.47, now, 0.18);
    mixBed('surf', ambience, now, coast * inside * (0.033 + 0.096 * swell), 540 + 1650 * swell);
    mixBed('street', ambience, now, (1 - coast * 0.8) * inside * (0.029 + 0.042 * passing), 175 + 450 * passing);
    mixBed('quay', ambience, now, docks * inside * 0.019, 205, 100 + passing * 5);

    const gear = Math.min(3, Math.floor(speed / 10));
    const revs = boating ? 54 + 2.8 * speed + 1.4 * Math.sin(worldTime * 5.8) : 43 + 11 * gear + Math.min(11, speed - gear * 10) * 3.6;
    mixBed('engine', effects, now, driving ? 0.060 + velocity * 0.038 : 0, 185 + 410 * velocity, revs);
    if (driving && speed > 4 && skid > 0.12) {
      if (skidSince === null) skidSince = now;
    } else skidSince = null;
    const slip = skidSince === null ? 0 : skid * unit((now - skidSince - 0.12) * 4.5);
    mixBed('skid', effects, now, slip * 0.15, 1050 + 900 * slip);
    mixBed('tire', effects, now, slip * 0.037, 1700, 580 + velocity * 206 + 35 * Math.sin(worldTime * 9));
    mixBed('rotor', effects, now, rotor * .10, 215 + 230 * rotor, 14.5 + .35 * Math.sin(worldTime * .8));
    environmentalSounds(now);
  }

  function update(state = {}) {
    driving = Boolean(state.driving);
    boating = Boolean(state.boating);
    speed = Math.abs(Number(state.speed) || 0);
    heat = Number(state.heat) || 0;
    siren = unit(state.siren);
    rotor = unit(state.rotor);
    coast = unit(state.coast);
    docks = unit(state.docks);
    skid = unit(state.skid);
    if (!enabled || paused || !context || context.state !== 'running') return;
    const now = context.currentTime;
    worldTime = Number.isFinite(state.time) ? state.time : now;
    // A backgrounded tab should resume on one beat, never play a backlog.
    if (nextStep < now - 0.12) nextStep = now + 0.02;
    while (nextStep < now + 0.11) {
      radioStep(step++, nextStep);
      nextStep += stepLength;
    }
    mix(now);
  }

  function cue(name, source = {}) {
    if (!enabled || paused || !context || context.state !== 'running') return;
    const at = context.currentTime + 0.012;
    if (name === 'horn' || name === 'trafficHorn') {
      const local = name === 'horn';
      if (at < (local ? nextHorn : nextTrafficHorn)) return;
      if (local) nextHorn = at + 0.32;
      else nextTrafficHorn = at + 0.52;
      const pitch = local ? 408 : source.kind === 'van' ? 285 : source.kind === 'hatch' ? 388 : 346;
      const power = local ? 0.155 : 0.116 / (1 + (source.distance || 0) * .045);
      const pulses = local ? [[0,.285]] : [[0,.175],[.31,.265]];
      for (const [delay,length] of pulses) for (const ratio of [1, 1.242]) {
        const onset=at+delay, horn=oscillator('horn',pitch*ratio*.948,onset);
        horn.frequency.exponentialRampToValueAtTime(pitch*ratio,onset+.024);
        strike(horn,effects,onset,length,power*(ratio===1?1:.8),.014,.82);
      }
      return;
    }
    if (name === 'hit') {
      tone(effects, 76, at, 0.16, 0.19, 'triangle', 31);
      hiss(at, 0.09, 0.10);
      return;
    }
    if (name === 'enter') {
      tone(effects, 105, at, 0.15, 0.18, 'tine', 43);
      tone(effects, 537, at + 0.065, 0.054, 0.068, 'triangle', 270, 0.003);
      return;
    }
    const notes = cueNotes[name];
    if (!notes) return;
    notes.forEach((note, i) => {
      tone(effects, hz(note), at + i * 0.085, 0.26, 0.105, 'sine');
    });
  }

  function sleep() {
    if (!context) return;
    master.gain.cancelScheduledValues(context.currentTime);
    master.gain.setValueAtTime(0, context.currentTime);
    for (const voice of voices) { voice.source.stop(); release(voice); }
    skidSince = null;
    context.suspend().catch(() => {});
  }

  function wake() {
    const now = context.currentTime;
    nextMix = now;
    nextStep = now + 0.035;
    nextGull = now + 4.2;
    nextPortSound = now + 3.1;
    nextSiren = now + 1.1;
    nextHorn = nextTrafficHorn = now;
    master.gain.cancelScheduledValues(now);
    master.gain.setTargetAtTime(0.73, now, 0.035);
    context.resume().catch(() => {});
  }

  function setEnabled(value) {
    const wanted = Boolean(value);
    if (wanted && !initialize()) return false;
    if (wanted === enabled) {
      if (wanted && !paused && context.state === 'suspended') wake();
      return enabled;
    }
    enabled = wanted;
    if (enabled && !paused) wake();
    else sleep();
    return enabled;
  }

  function pause(value) {
    if (paused === Boolean(value)) return;
    paused = Boolean(value);
    if (!enabled) return;
    if (paused) sleep();
    else wake();
  }

  window.BaySound = Object.freeze({ setEnabled, update, cue, pause });
})();
