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
  const fieldBuffers = new Map(), fieldVoices = new Map();
  const bedsByName = {
    engine: ['sawtooth', 'lowpass', 0.59], exhaust: ['triangle','lowpass',.65], skid: ['noise', 'bandpass', 1.8], tire: ['triangle', 'lowpass', 0.62],
    surf: ['noise', 'lowpass', 0.52], street: ['noise', 'lowpass', 0.8], quay: ['sine', 'lowpass', 0.6],
    piston: ['sawtooth','lowpass',0.62], rotor: ['rotor', 'lowpass', 0.70], undertow: ['noise','lowpass',0.58],
    washJet: ['noise','bandpass',.74], washPump: ['triangle','lowpass',.61],
    blade: ['noise','bandpass',1.16], spindle: ['triangle','lowpass',.65],
    spanDrive: ['sawtooth','lowpass',.60], spanChain: ['noise','bandpass',1.08]
  };

  let context, master, music, instruments, effects, ambience, hats, noise, waves;
  let openAir, submergedBus, waterFilter;
  let enabled = false, paused = false;
  let floatEngine=0,floatThrottle=0,rescueLevel=0,nextRescue=0;
  let driving = false, boating = false, speed = 0, heat = 0, siren = 0, rotor = 0, coast = 0, docks = 0, skid = 0;
  let nextStep = 0, step = 0, nextMix = 0, skidSince = null, nextGull = 0, nextPortSound = 0;
  let nextHorn = 0, nextTrafficHorn = 0, nextSiren = 0, seed = 87533, portBell = true, worldTime = 0;
  let swimming = false, waterDepth = 0, strokeEffort = 0, lastImmersion = 0;
  let nextStroke = 0, nextWhistle = 0, nextSplash = 0;
  let broadcast = null, queuedTape = null, shell = null;
  let washBus, washBearing = 2, bladePhase = NaN, bladeAt = -1;
  let nextDrawBell = 0, nextPacketWhistle = 0;

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
      openAir = gainNode(master, 1);
      submergedBus = gainNode(master, 0);
      waterFilter = context.createBiquadFilter();
      waterFilter.type = 'lowpass';
      waterFilter.frequency.value = 690;
      waterFilter.Q.value = 0.58;
      waterFilter.connect(submergedBus);
      const scene = gainNode(openAir, 1);
      scene.connect(waterFilter);
      music = gainNode(scene, 0.66);
      instruments = gainNode(music, 1);
      effects = gainNode(scene, 0.88);
      ambience = gainNode(scene, 0.74);
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
      shell = window.BayShellScore?.createPlayer(context, scene, strike) || null;
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
    if (voice.panner) voice.panner.disconnect();
    if (voice.key && beds.get(voice.key) === voice) beds.delete(voice.key);
    if (voice.slot && fieldVoices.get(voice.slot) === voice) fieldVoices.delete(voice.slot);
    if (voice.group) voice.group.delete(voice);
    if (broadcast === voice) broadcast = null;
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
    return voice;
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
  function waterNoise(bus, start, length, volume, high, low) {
    const source = context.createBufferSource(), filter = context.createBiquadFilter();
    source.buffer = noise;
    filter.type = 'bandpass';
    filter.Q.value = 0.73;
    filter.frequency.setValueAtTime(high, start);
    filter.frequency.exponentialRampToValueAtTime(low, start + length * .86);
    filter.connect(bus);
    const voice = strike(source, filter, start, length, volume, .012, .38);
    voice.filter = filter;
  }
  function whistlePulse(start, length, volume, pitch) {
    const reed = oscillator('sine', pitch * .84, start);
    reed.frequency.exponentialRampToValueAtTime(pitch, start + .034);
    for (let t = .055; t < length - .043; t += .038) {
      reed.frequency.linearRampToValueAtTime(pitch * 1.012, start + t);
      reed.frequency.linearRampToValueAtTime(pitch * .984, start + t + .015);
    }
    reed.frequency.exponentialRampToValueAtTime(pitch * .83, start + length);
    strike(reed, effects, start, length, volume, .023, .78);
    waterNoise(effects, start, length * .76, volume * .65, 2400, 3400);
  }
  function swimMix(now, swell, passing) {
    const immersion = swimming ? unit((waterDepth - .17) / .92) : 0;
    if (immersion !== lastImmersion) {
      openAir.gain.setTargetAtTime(1 - immersion, now, .09);
      submergedBus.gain.setTargetAtTime(immersion * .83, now, .10);
      waterFilter.frequency.setTargetAtTime(780 - 420 * immersion, now, .14);
      lastImmersion = immersion;
    }
    if (immersion || beds.has('undertow')) mixBed('undertow', master, now, immersion * (.053 + .021 * swell), 143 + 28 * passing);
    if (!swimming) return;
    if (strokeEffort < .09) {
      nextStroke = now + .08;
    } else if (now >= nextStroke) {
      const power = .03 + .052 * strokeEffort;
      if (waterDepth > .47) {
        // Bubbles close to the ear rise in pitch as the street falls behind.
        for (let i = 0; i < 3; i++) {
          const pitch = 176 + i * 74 + random() * 58;
          tone(master, pitch, now + i * .069, .067 + i * .012, power * (.43 - i * .08), 'sine', pitch * 1.54, .005);
        }
      } else {
        waterNoise(ambience, now, .24, power * 1.48, 1450 + random() * 660, 365);
        tone(ambience, 96, now + .012, .14, power * .60, 'sine', 51, .009);
      }
      nextStroke = now + .98 - .48 * strokeEffort;
    }
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

  function mixBed(key, bus, now, volume, cutoff, pitch = 0, response = .12) {
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
    voice.envelope.gain.setTargetAtTime(volume, now, response);
    voice.filter.frequency.setTargetAtTime(cutoff, now, response + .02);
    if (pitch) voice.source.frequency.setTargetAtTime(pitch, now, Math.min(.10, response));
  }

  function mixWasher(now, state) {
    const amount = unit(state.washSpray);
    if (amount < .01 && !beds.has('washJet') && !beds.has('washPump')) return;
    if (!washBus) {
      washBus = context.createStereoPanner ? context.createStereoPanner() : ambience;
      if (washBus !== ambience) washBus.connect(ambience);
    }
    const bearing = Math.max(-1, Math.min(1, Number(state.washPan) || 0));
    if (washBus.pan && Math.abs(bearing-washBearing) > .009) {
      washBus.pan.setTargetAtTime(bearing, now, .065); washBearing = bearing;
    }
    const load = .5 + .5*Math.sin(worldTime*16.9+.57*Math.sin(worldTime*5.2));
    const jet = amount*(state.inCabin ? .052 : .105), motor = amount*(state.inCabin ? .021 : .035);
    mixBed('washJet', washBus, now, jet*(.91+.09*load), (state.inCabin ? 1440 : 3220)+load*280, 0, .043);
    mixBed('washPump', washBus, now, motor, state.inCabin ? 245 : 490, 97+5*load, .065);
  }

  function bridgeFalloff(distance, reach) {
    return Number.isFinite(distance) ? unit(1 - Math.max(0, distance) / reach) ** 1.5 : 0;
  }

  function mixDrawbridge(now, state) {
    const draw = state.bridge, phase = draw?.phase;
    const moving = phase === 'raising' || phase === 'lowering';
    const warning = phase === 'warning' && draw.gates < .999 || phase === 'release' && draw.gates > .001;
    const cabin = driving && !boating ? (state.inCabin ? .54 : .73) : 1;
    const bell = warning ? cabin * bridgeFalloff(draw.distance, 99) : 0;
    if (bell < .012) nextDrawBell = 0;
    else if (now >= nextDrawBell) {
      // A solenoid strikes one side of the same iron bell on every return.
      const at = now + .008;
      tone(ambience, 731, at, .55, bell * .11, 'sine', 726, .003);
      tone(ambience, 1263, at, .25, bell * .049, 'sine', 1250, .002);
      tone(ambience, 2031, at, .09, bell * .023, 'sine', 2000, .002);
      nextDrawBell = (nextDrawBell > now - .17 ? nextDrawBell : at) + .74;
    }
    if (!moving && !beds.has('spanDrive') && !beds.has('spanChain')) return;
    const near = moving ? cabin * bridgeFalloff(draw.distance, 60) : 0;
    const travel = Math.sin(Math.PI * unit(draw?.lift));
    const teeth = .5 + .5 * Math.sin(worldTime * 19);
    const load = near * (.54 + .46 * travel);
    mixBed('spanDrive', ambience, now, load * .044, 270 + travel * 130, (phase === 'raising' ? 66 : 59) + travel * 11, .12);
    mixBed('spanChain', ambience, now, load * (.012 + .017 * teeth), 620 + 350 * teeth, 0, .044);
  }

  function mixWipers(now, state) {
    const phase = driving && Number.isFinite(state.wiper) ? state.wiper : 0;
    if (phase <= 0 && !Number.isFinite(bladePhase)) return;
    const elapsed = now-bladeAt;
    if (elapsed < .029) return;
    const delta = phase-bladePhase;
    bladePhase = phase > 0 ? phase : NaN; bladeAt = now;
    // The blade travels fastest halfway across the glass, then reverses at each end.
    // A parked integer phase or switching vehicles must not initiate another pass.
    if (!(delta > .00002 && elapsed < .42 && delta < elapsed*2.2+.02)) {
      if (beds.has('blade')) mixBed('blade', effects, now, 0, 900);
      if (beds.has('spindle')) mixBed('spindle', effects, now, 0, 230);
      return;
    }
    const turn = phase % 1, movement = Math.abs(Math.sin(2*Math.PI*turn));
    const forward = turn < .5, pace = Math.min(1.25, delta/elapsed);
    const glass = (state.inCabin ? 1 : .23) * (.65+.33*pace);
    const friction = movement*(forward ? .065 : .050);
    mixBed('blade', effects, now, .0013+glass*friction, (forward ? 990 : 680)+movement*570, 0, .023);
    mixBed('spindle', effects, now, .0011+glass*(.004+.011*movement), 378, (forward ? 177 : 153)+movement*37, .030);
  }

  function fieldBuffer(id) {
    if (!fieldBuffers.has(id)) {
      const reel = window.BayCutTape.signal(id);
      const buffer = context.createBuffer(1, reel.length, window.BayCutTape.sampleRate);
      buffer.getChannelData(0).set(reel);
      fieldBuffers.set(id, buffer);
    }
    return fieldBuffers.get(id);
  }

  function mixFieldVoice(slot, id, volume, pan, phase, now) {
    let voice = fieldVoices.get(slot);
    const audible = id && volume > 0.002;
    if (voice) {
      // Pauses and slow frames can put a looping Web Audio source ahead of the world clock.
      const elapsed = now - voice.started;
      const duration = voice.source.buffer.duration;
      const drift = (phase - voice.phase - elapsed) % duration;
      if (!audible || voice.id !== id || Math.min(Math.abs(drift), duration - Math.abs(drift)) > 0.18) {
        fieldVoices.delete(slot);
        voice.envelope.gain.setTargetAtTime(0, now, 0.018);
        voice.source.stop(now + 0.085);
        voice = null;
      }
    }
    if (!audible) return;
    if (!voice) {
      const source = context.createBufferSource();
      source.buffer = fieldBuffer(id);
      source.loop = true;
      const envelope = gainNode(ambience, 0);
      const panner = context.createStereoPanner ? context.createStereoPanner() : null;
      if (panner) {
        panner.pan.value = pan;
        source.connect(panner);
        panner.connect(envelope);
      } else source.connect(envelope);
      voice = { source, envelope, panner, slot, id, phase, started: now };
      fieldVoices.set(slot, voice);
      voices.add(voice);
      source.onended = () => release(voice);
      const duration = source.buffer.duration;
      source.start(now, ((phase % duration) + duration) % duration);
    }
    voice.envelope.gain.setTargetAtTime(volume, now, 0.045);
    if (voice.panner) voice.panner.pan.setTargetAtTime(pan, now, 0.045);
  }

  function mixField(field, now) {
    const id = window.BayCutTape?.hasSource(field?.id) ? field.id : null;
    const monitoring = Boolean(id && field.monitor);
    const volume = monitoring ? 0.91 : (driving ? 0.35 : 0.55);
    const phase = Number.isFinite(field?.phase) ? field.phase : worldTime;
    const pan = Math.max(-1, Math.min(1, Number(field?.pan) || 0));
    mixFieldVoice('subject', id, volume * unit(field?.level), pan, phase, now);
    mixFieldVoice('wind', id && 'wind', volume * unit(field?.noise) * 0.56 * Math.SQRT2, 0, phase, now);
    return monitoring;
  }

  function startBroadcast(now) {
    const samples = window.BayCutTape.render(queuedTape);
    queuedTape = null;
    if (!samples) return;
    if (broadcast) {
      broadcast.envelope.gain.setTargetAtTime(0, now, 0.008);
      broadcast.source.stop(now + 0.040);
    }
    const source = context.createBufferSource();
    source.buffer = context.createBuffer(2, samples.left.length, window.BayCutTape.sampleRate);
    source.buffer.getChannelData(0).set(samples.left);
    source.buffer.getChannelData(1).set(samples.right);
    const filter = context.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3900;
    filter.Q.value = 0.58;
    const envelope = gainNode(effects, 0.91);
    source.connect(filter);
    filter.connect(envelope);
    const voice = { source, envelope, filter };
    broadcast = voice;
    voices.add(voice);
    source.onended = () => release(voice);
    source.start(now + 0.015);
    nextMix = now;
  }

  function playField(raw) {
    if (!enabled || paused || !context || !window.BayCutTape) return false;
    const tape = window.BayCutTape.read(raw);
    if (!tape) return false;
    // Closing the listening-booth panel can leave resume() pending for one frame.
    queuedTape = tape;
    if (context.state === 'running') startBroadcast(context.currentTime);
    return true;
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
    if(rescueLevel>.035&&now>=nextRescue){
      tone(effects,652,now+.01,.48,.030*rescueLevel,"triangle",669,.055,.64);
      tone(effects,508,now+.50,.48,.029*rescueLevel,"triangle",495,.055,.64);nextRescue=now+1.16;
    }
    if (heat <= 0) nextSiren = now + 1.2;
    if (heat > 0 && siren > 0.035 && now >= nextSiren) {
      tone(effects, 415, now + 0.01, 0.46, 0.043 * siren, 'sine', 651, 0.095, 0.64);
      tone(effects, 638, now + 0.46, 0.50, 0.036 * siren, 'sine', 389, 0.08, 0.58);
      nextSiren = now + 3.3 - siren * 1.5 + random() * .4;
    }
  }

  function mix(now, state, band) {
    if (now < nextMix) return;
    nextMix = now + 0.085;
    const velocity = Math.min(1, speed / 38);
    const inside = driving && !boating ? 0.57 : 1;
    const swell = (0.5 + 0.5 * Math.sin(worldTime * 0.90 + 0.8 * Math.sin(worldTime * 0.27))) ** 1.7;
    const passing = (0.5 + 0.5 * Math.sin(worldTime * 0.71 + 2 * Math.sin(worldTime * 0.19))) ** 2;
    swimMix(now, swell, passing);
    const monitoring = mixField(state.field, now);
    const radioVolume = broadcast ? 0.10 : monitoring ? 0.13 : driving ? 0.71 : 0.47;
    music.gain.setTargetAtTime(radioVolume * (1 - band), now, broadcast || monitoring || band ? 0.075 : 0.18);
    if (broadcast) broadcast.envelope.gain.setTargetAtTime(.91 * (1 - band), now, .065);
    mixBed('surf', ambience, now, coast * inside * (0.033 + 0.096 * swell), 540 + 1650 * swell);
    mixBed('street', ambience, now, (1 - coast * 0.8) * inside * (0.029 + 0.042 * passing), 175 + 450 * passing);
    mixBed('quay', ambience, now, docks * inside * 0.019, 205, 100 + passing * 5);

    const gear = Math.min(3, Math.floor(speed / 10));
    const revs = boating ? 54 + 2.8 * speed + 1.4 * Math.sin(worldTime * 5.8) : 43 + 11 * gear + Math.min(11, speed - gear * 10) * 3.6;
    const moto=state.motorcycle, scooter=moto?.kind==='paloma', rpm=moto?.rpm||0;
    const dealer=state.dealerEngine,fastback=dealer?.kind==='cayo';
    const load=dealer?.throttle||0,ratio=dealer?speed/BayDriving.cars[dealer.kind].top:0;
    const pitch=dealer?unit(ratio/[.23,.42,.62,.83,1][dealer.gear-1]+load*.08):0;
    const firing=(fastback?34:52)+(fastback?79:119)*pitch;
    mixBed('engine',effects,now,driving?(moto ? .035+.036*rpm : .060+velocity*.038)*(dealer?.shift ? .65 : 1):0,
      moto?(scooter?330:240)+rpm*670:dealer?(fastback?145:235)+pitch*420+load*160:185+410*velocity,
      moto?(scooter?77:44)+(scooter?160:120)*rpm:dealer?firing:revs);
    if(dealer||beds.has('exhaust'))mixBed('exhaust',effects,now,dealer ? .022+load*.029 : 0,
      fastback?240:520,fastback?firing*.5+.65*Math.sin(worldTime*8):firing*1.5);
    if (driving && speed > 4 && skid > 0.12) {
      if (skidSince === null) skidSince = now;
    } else skidSince = null;
    const slip = skidSince === null ? 0 : skid * unit((now - skidSince - 0.12) * 4.5);
    mixBed('skid', effects, now, slip * 0.15, 1050 + 900 * slip);
    mixBed('tire', effects, now, slip * 0.037, 1700, 580 + velocity * 206 + 35 * Math.sin(worldTime * 9));
    mixBed('piston', effects, now, floatEngine*(.025+.040*floatThrottle), 180+450*floatThrottle, 34+53*floatThrottle+.45*Math.sin(worldTime*5.1));
    mixBed('rotor', effects, now, rotor * .10, 215 + 230 * rotor, 14.5 + .35 * Math.sin(worldTime * .8));
    mixWasher(now, state);
    mixDrawbridge(now, state);
    environmentalSounds(now);
  }

  function update(state = {}) {
    driving = Boolean(state.driving);
    boating = Boolean(state.boating);
    speed = Math.abs(Number(state.speed) || 0);
    heat = Number(state.heat) || 0;
    siren = unit(state.siren);rescueLevel=unit(state.rescueLevel);
    rotor = unit(state.rotor);floatEngine=unit(state.floatEngine);floatThrottle=unit(state.floatThrottle);
    coast = unit(state.coast);
    docks = unit(state.docks);
    skid = unit(state.skid);
    swimming = Boolean(state.swimming);
    waterDepth = swimming ? Math.max(0, Number(state.depth) || 0) : 0;
    strokeEffort = swimming ? unit(state.stroke) : 0;
    if (!enabled || paused || !context || context.state !== 'running') return;
    const now = context.currentTime;
    worldTime = Number.isFinite(state.time) ? state.time : now;
    if (queuedTape) startBroadcast(now);
    const band = shell ? shell.update(state.shell, now) : 0;
    // A backgrounded tab should resume on one beat, never play a backlog.
    if (nextStep < now - 0.12) nextStep = now + 0.02;
    while (nextStep < now + 0.11) {
      if (band < .999) radioStep(step, nextStep);
      step++;
      nextStep += stepLength;
    }
    mixWipers(now, state);
    mix(now, state, band);
  }

  function cue(name, source = {}) {
    if (!enabled || paused || !context || context.state !== 'running') return;
    if (name === 'shell-hit') { if (shell) shell.hit(source,context.currentTime); return; }
    const at = context.currentTime + 0.012;
    if(name.startsWith('brisas-')){
      const gain=Math.max(0,1-(source.distance||0)/32)*.09;
      if(name==='brisas-pump'){tone(effects,96,at,.14,gain*.68,'triangle',179,.011);waterNoise(effects,at,.063,gain*.34,740,510);}
      else if(name==='brisas-bell'){tone(effects,1440,at,.33,gain*.68,'sine',1431,.002);tone(effects,2162,at,.15,gain*.26,'sine',2150,.002);}
      else{tone(effects,83,at,.098,gain*(source.force||.4),'triangle',47,.002);}
      return;
    }
    if(name.startsWith('pool-')){
      const near=Math.max(0,1-(source.distance||0)/29),gain=near*Math.min(.12,.035+.025*(source.force||0));
      if(name==='pool-pocket'){tone(effects,142,at,.12,gain,'triangle',68,.002);waterNoise(effects,at+.022,.062,gain*.60,780,280);}
      else if(name==='pool-rail'){tone(effects,240,at,.048,gain*.72,'triangle',122,.002);}
      else{tone(effects,name==='pool-cue'?770:1130,at,.037,gain,'sine',477,.001);waterNoise(effects,at,.019,gain*.53,3600,1250);}
      return;
    }
    if (name.startsWith('skate-')) {
      const rolling = name === 'skate-lock', rough = name === 'skate-bail', landing = name === 'skate-land';
      const length = rolling ? .28 : rough ? .23 : .07;
      waterNoise(effects, at, length, rough ? .11 : .065, rolling ? 3400 : 1900, rolling ? 1050 : 440);
      if (!rolling) tone(effects, landing ? 124 : 235, at, .08, .055, 'triangle', 72, .002);
      return;
    }
    if (name === 'bus-bell' || name === 'bus-door') {
      const near = Math.max(0, 1 - (source.distance || 0) / 34) ** 1.4;
      if (name === 'bus-bell') {
        tone(effects, 687, at, .22, .065*near, 'sine', 685, .005);
        tone(effects, 1027, at+.025, .18, .028*near, 'sine', 1021, .006);
      } else {
        waterNoise(effects, at, .41, .085*near, 2200, 610);
        tone(effects, 119, at+.39, .10, .045*near, 'triangle', 66, .004);
      }
      return;
    }
    if (name === 'packet-whistle') {
      const near = bridgeFalloff(source.distance, 130) * (driving && !boating ? .68 : 1);
      if (at < nextPacketWhistle || near < .012) return;
      nextPacketWhistle = at + 3;
      for (const [delay, length] of [[0,.30],[.50,.44]]) {
        const start = at + delay;
        tone(ambience, 164, start, length, .133 * near, 'horn', 170, .052, .81);
        tone(ambience, 221, start + .022, length - .03, .056 * near, 'reed', 228, .058, .77);
        waterNoise(ambience, start, .15, .045 * near, 1150, 510);
      }
      return;
    }
    if (name.startsWith('court-')) {
      const near = Math.max(0, 1 - (source.distance || 0) / 34) ** 1.5;
      if (name === 'court-rim') {
        tone(effects, 683, at, .19, .053 * near, 'triangle', 639, .002);
        tone(effects, 1011, at + .012, .095, .028 * near, 'sine', 981, .002);
      } else if (name === 'court-basket') {
        waterNoise(effects, at, .135, .053 * near, 2050, 730);
      } else {
        const board = name === 'court-glass';
        tone(effects, board ? 213 : 135, at, board ? .16 : .11, .10 * near, 'sine', board ? 103 : 60, .003);
        waterNoise(effects, at, .041, .036 * near, 960, 270);
      }
      return;
    }
    if (name === 'cycle-bell') {
      for (const [delay, power] of [[0,.095],[.106,.055]]) {
        tone(effects, 1376, at + delay, .29, power, 'sine', 1362, .002);
        tone(effects, 3440, at + delay, .12, power * .34, 'sine', 3425, .002);
      }
      return;
    }
    if (name === 'splash') {
      if (at < nextSplash) return;
      nextSplash = at + .25;
      const near = 1 / (1 + Math.max(0, source.distance || 0) * .075);
      tone(effects, 127, at, .21, .116 * near, 'sine', 43, .013);
      waterNoise(effects, at + .013, .34, .22 * near, 2900, 420);
      waterNoise(effects, at + .13, .28, .095 * near, 1800, 740);
      return;
    }
    if (name === 'shore-whistle') {
      if (at < nextWhistle) return;
      nextWhistle = at + 1.6;
      const power = .083 / (1 + Math.max(0, source.distance || 0) * .041);
      whistlePulse(at, .15, power, 1850);
      whistlePulse(at + .235, .30, power * .92, 1960);
      return;
    }
    if (name === 'found') {
      tone(effects, 921, at, .14, .085, 'tine', 884, .004);
      tone(effects, 1423, at + .068, .24, .047, 'sine', 1400, .006);
      return;
    }
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
    queuedTape = null;
    bladePhase = NaN; bladeAt = -1; washBearing = 2;
    if (!context) return;
    if (shell) shell.stop(context.currentTime);
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
    nextWhistle = nextSplash = nextStroke = now;
    nextDrawBell = nextPacketWhistle = 0;
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

  window.BaySound = Object.freeze({ setEnabled, update, cue, pause, playField });
})();
