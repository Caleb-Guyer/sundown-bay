/* Original charts from June Mora's book. Time is measured in quarter notes. */
(() => {
  'use strict';

  const padNames = ['K', 'S', 'H'];
  function drumChart(bars) {
    const pattern = [];
    bars.forEach((bar, measure) => {
      [...bar.replaceAll(' ', '')].forEach((mark, sixteenth) => {
        const pad = padNames.indexOf(mark);
        if (pad >= 0) pattern.push({at: measure * 4 + sixteenth / 4, pad});
      });
    });
    return pattern;
  }

  // Guitar grips list the strings from low to high. Each bass cell gives the
  // beat, the sounding pitch and the note's duration.
  const jetty = {
    id: 'jetty', name: 'Out on the Jetty', bpm: 96, bars: 8,
    grips: [[55,59,64],[54,59,62],[52,55,62],[54,57,64],
            [55,59,64],[55,60,64],[54,60,64],[55,59,62]],
    bass: [
      [[0,43,1.10],[1.5,50,.36],[2,47,.78],[3.5,45,.32]],
      [[0,42,1.23],[2,47,.64],[3,50,.70]],
      [[0,40,1.10],[1.5,47,.36],[2,43,.81],[3.5,41,.33]],
      [[0,38,1.62],[2,45,.56],[3,42,.45],[3.5,43,.27]],
      [[0,36,1.05],[1.5,43,.40],[2,40,.82],[3.5,38,.33]],
      [[0,45,1.28],[2,48,.71],[3,43,.58]],
      [[0,38,1.12],[1.5,45,.34],[2,48,.45],[2.75,45,.44],[3.5,42,.32]],
      [[0,43,1.72],[2.5,47,.31],[3,50,.47]]
    ],
    // June plays the first answer at the tail of the first bar and waits two bars to answer it.
    phrases: [
      [[2.75,71,.42],[3.5,69,.65]], [],
      [[.5,67,.43],[1.25,69,.24],[1.75,74,1.22]], [[2.5,66,.43],[3,64,.75]],
      [[2.75,71,.44],[3.5,67,.68]], [[1.5,64,.71]],
      [[1,69,.42],[1.75,71,.68],[2.75,69,.27],[3.25,66,.50]],
      [[0,67,1.78],[2.5,62,.44]]
    ],
    strums: [[.5,.56,.87],[1.5,.23,.64],[2.5,.39,.76],[3.5,.24,.60]],
    pattern: drumChart([
      'K--- S-H- K--- S---', 'K-H- S--- K--- S-H-',
      'K--- S-H- K--- S-H-', 'K-H- S--- K-H- S---',
      'K--- S-H- K--- S---', 'K-H- S--- K--- S-H-',
      'K--- S-H- K-H- S-H-', 'K--- S--- K-H- S---'
    ])
  };
  const neon = {
    id: 'neon', name: 'Neon After Rain', bpm: 112, bars: 8,
    grips: [[59,62,66],[57,62,66],[57,61,64],[55,59,64],
            [59,62,67],[57,61,66],[57,60,64],[54,57,63]],
    bass: [
      [[0,40,.66],[1.25,47,.43],[2.5,52,.38],[3.25,43,.36]],
      [[0,38,.98],[1.5,45,.38],[2.25,50,.50],[3.5,42,.30]],
      [[0,37,.64],[1.25,44,.44],[2.5,49,.42],[3.5,47,.29]],
      [[0,36,1.43],[2.25,43,.51],[3,47,.44]],
      [[0,40,.65],[1.25,47,.40],[2.5,55,.38],[3.25,50,.40]],
      [[0,42,1.05],[1.5,49,.43],[2.25,45,.70],[3.5,43,.28]],
      [[0,45,.76],[1.5,48,.38],[2.25,43,.56],[3.25,40,.40]],
      [[0,35,1.28],[1.75,42,.48],[2.75,47,.44],[3.5,39,.30]]
    ],
    phrases: [
      [[.75,71,.32],[1.5,74,.47],[2.5,73,.28],[3.25,69,.54]], [],
      [[.75,69,.34],[1.5,73,.49],[2.75,76,.63]], [[1.75,71,1.18]],
      [[.75,74,.32],[1.5,78,.43],[2.5,76,.31],[3.25,71,.53]],
      [[1.25,69,.49],[2.75,66,.65]], [[.75,72,.51],[1.75,69,.72]],
      [[1.5,66,.37],[2.25,63,.49],[3.25,66,.45]]
    ],
    strums: [[.75,.24,.86],[1.75,.22,.69],[2.25,.30,.83],[3.5,.23,.72]],
    pattern: drumChart([
      'K-H- S--K --H- S-H-', 'K--H S-H- -K-- SH--',
      'K-H- S--K --H- S-H-', 'K--- S--H K-H- S--H',
      'K-H- S--K --H- S-H-', 'KH-- S-H- -K-- S-H-',
      'K--H S-H- -K-H S-H-', 'K-H- S--- --KH S---'
    ])
  };

  function voicesFor(song) {
    const events = [];
    for (let bar = 0; bar < song.bars; bar++) {
      const base = bar * 4;
      for (const [at, note, length] of song.bass[bar]) {
        events.push({at: base + at, kind: 'bass', note, length, velocity: at === 0 ? 1 : .82});
      }
      song.strums.forEach(([at, length, velocity], i) => {
        if (bar === 7 && i === 3) return;
        events.push({at: base + at, kind: 'grip', notes: song.grips[bar], length, velocity, up: i % 2 === 1});
      });
      for (const [at, note, length] of song.phrases[bar]) {
        events.push({at: base + at, kind: 'line', note, length, velocity: .92});
      }
    }
    return events.sort((a,b) => a.at - b.at);
  }

  const songs = [jetty, neon].map(score => ({
    id: score.id, name: score.name, bpm: score.bpm, bars: score.bars,
    pattern: score.pattern, accompaniment: voicesFor(score)
  }));
  const catalogue = new Map(songs.map(s => [s.id, s]));
  const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
  const clampGain = x => clamp(Number(x) || 0, 0, 1);
  const empty = [];

  function visit(notes, from, to, bars, repeat, play) {
    if (!notes.length || to <= 0 || from >= to) return;
    const span = bars * 4;
    const begin = repeat ? Math.floor(Math.max(0, from) / span) * span : 0;
    for (let base = begin; base < to; base += span) {
      let lo = 0, hi = notes.length;
      while (lo < hi) {
        const mid = (lo + hi) >> 1;
        if (base + notes[mid].at < from) lo = mid + 1; else hi = mid;
      }
      for (let i = lo; i < notes.length && base + notes[i].at < to; i++) play(notes[i], base + notes[i].at);
      if (!repeat) return;
    }
  }

  // A short, pitched delay line models a picked string. Fractional delay keeps the
  // upper register in tune. A few reusable roots cover both instruments' ranges.
  function pluck(context, midi, bass) {
    const rate = Math.min(22050, context.sampleRate);
    const hz = 440 * 2 ** ((midi - 69) / 12);
    const period = rate / hz, delay = Math.floor(period - .5), fine = period - .5 - delay;
    const first = delay + 2, length = Math.ceil(rate * (bass ? 1.48 : 1.73));
    const buffer = context.createBuffer(1, length, rate), s = buffer.getChannelData(0);
    let seed = (midi + 11) * 7919, filtered = 0, mean = 0;
    for (let i = 0; i < first; i++) {
      const p = i / first, pick = bass ? .34 : .18;
      const string = 2 * (p < pick ? p / pick : (1 - p) / (1 - pick)) - 1;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      filtered += ((seed / 2147483648 - 1) - filtered) * (bass ? .26 : .76);
      s[i] = (bass ? .82 : .57) * string + (bass ? .11 : .40) * filtered;
      mean += s[i] / first;
    }
    for (let i = 0; i < first; i++) s[i] -= mean;
    const loss = bass ? .9959 : .9968;
    for (let i = first; i < length; i++) {
      const j = i - delay;
      const a = s[j] * (1-fine) + s[j-1] * fine;
      const b = s[j-1] * (1-fine) + s[j-2] * fine;
      s[i] = (a+b) * (.5 * loss);
    }
    return buffer;
  }

  function percussion(context, pad) {
    const rate = Math.min(24000, context.sampleRate), tau = Math.PI * 2;
    const length = [.34,.22,.115,.07][pad], count = Math.ceil(rate * length);
    const buffer = context.createBuffer(1,count,rate), s = buffer.getChannelData(0);
    let seed = (pad+1)*18313, phase = 0, low = 0, last = 0;
    for (let i = 0; i < count; i++) {
      const t = i / rate;
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
      const white = seed / 2147483648 - 1;
      low += (white-low) * (pad === 2 ? .61 : .27);
      const wire = white-low;
      if (pad === 0) {
        phase += tau/rate * (46 + 102*Math.exp(-t*56) + 22*Math.exp(-t*12));
        s[i] = .87*Math.sin(phase)*Math.exp(-t*12.2) + .11*wire*Math.exp(-t*180);
      } else if (pad === 1) {
        const head = .45*Math.sin(tau*t*187)*Math.exp(-t*34) + .19*Math.sin(tau*t*296)*Math.exp(-t*44);
        const buzz = (.73*wire + .15*last) * Math.exp(-t*22) * (.87 + .13*Math.sin(tau*t*84));
        s[i] = head + buzz;
      } else if (pad === 2) {
        const brass = .19*Math.sin(tau*t*3691) + .13*Math.sin(tau*t*4687) + .11*Math.sin(tau*t*6235);
        s[i] = (.83*wire + brass) * Math.exp(-t*42);
      } else {
        s[i] = (.50*Math.sin(tau*t*927)+.32*Math.sin(tau*t*1821)+.24*wire)*Math.exp(-t*78);
      }
      last = wire;
      s[i] *= Math.min(1, i/(.0006*rate), (count-i)/(.008*rate));
    }
    return buffer;
  }

  // The radio owns the AudioContext, master mute, voice cleanup and scene buses.
  // No sample or node is allocated until the band is actually audible.
  function createPlayer(context, scene, strike) {
    const samples = new Map(), owned = new Set();
    let output, pan, filter, guitar, bass, drums, transport, replaySource, replaySong, replayPart = empty;
    let lastGain = -1, lastPan = 2;
    function makeBus(destination, amount) {
      const b = context.createGain(); b.gain.value = amount; b.connect(destination); return b;
    }
    function open() {
      if (output) return;
      output = makeBus(scene,0);
      pan = context.createStereoPanner ? context.createStereoPanner() : null;
      if (pan) pan.connect(output);
      filter = context.createBiquadFilter(); filter.type = 'lowpass'; filter.Q.value = .62; filter.connect(pan || output);
      bass = makeBus(filter,1); drums = makeBus(filter,1); guitar = makeBus(filter,1);
      const slap = context.createDelay(.18); slap.delayTime.value = .068;
      guitar.connect(slap); slap.connect(makeBus(filter,.115));
    }
    function sample(key, build) {
      if (!samples.has(key)) samples.set(key,build());
      return samples.get(key);
    }
    function play(buffer, bus, start, length, volume, rate, attack, sustain) {
      const source = context.createBufferSource(); source.buffer = buffer; source.playbackRate.value = rate;
      const voice = strike(source,bus,start,length,volume,attack,sustain);
      voice.group = owned; owned.add(voice);
    }
    function string(note, start, duration, volume, low) {
      const root = low ? (note < 39 ? 35 : note < 46 ? 42 : 50) : (note < 58 ? 54 : note < 66 ? 62 : note < 73 ? 69 : 76);
      const buf = sample((low ? 'b' : 'g')+root,() => pluck(context,root,low));
      const pitch = 2 ** ((note-root)/12);
      play(buf,low ? bass : guitar,start,Math.min(duration,buf.duration/pitch),volume,pitch,low ? .007 : .003,low ? .76 : .56);
    }
    function playPad(pad, time, velocity) {
      const buf = sample('d'+pad,() => percussion(context,pad));
      const level = [.42,.40,.38,.30][pad];
      play(buf,drums,time,buf.duration-.001,level*velocity,1,.001,.95);
    }
    function mix(state, now) {
      const volume = clampGain(state.gain) * (state.practice && state.source === 'stage' && !state.live ? .66 : 1);
      const stereo = clamp(Number(state.pan) || 0,-1,1);
      if (Math.abs(volume-lastGain) > .002 || state.source !== transport?.source) {
        output.gain.setTargetAtTime(volume,now,.042);
        filter.frequency.setTargetAtTime(state.source === 'tape' ? 5650 : 1600 + 7300*Math.sqrt(volume),now,.06);
        lastGain = volume;
      }
      if (pan && Math.abs(stereo-lastPan) > .008) { pan.pan.setTargetAtTime(stereo,now,.042); lastPan = stereo; }
    }
    function hush(now) {
      for (const voice of owned) {
        voice.envelope.gain.cancelScheduledValues(now);
        voice.envelope.gain.setTargetAtTime(.0001,now,.008);
        voice.source.stop(now+.040);
      }
      owned.clear();
    }
    function stop(now) {
      if (output && (transport || owned.size)) {
        hush(now); output.gain.setTargetAtTime(0,now,.025);
      }
      transport = null; replaySource = replaySong = null; replayPart = empty; lastGain = -1; lastPan = 2;
    }
    function part(state, song) {
      if (Array.isArray(state.playback)) {
        if (state.playback !== replaySource || song !== replaySong) {
          replaySource = state.playback;
          replaySong = song;
          const notes = replaySource.filter(n => Number.isFinite(n?.at) && n.at >= 0 && n.at < song.bars*4 &&
            Number.isInteger(n.pad) && n.pad >= 0 && n.pad < 3).sort((a,b) => a.at-b.at);
          if (notes.length !== replayPart.length || notes.some((n,i) => n.at !== replayPart[i].at || n.pad !== replayPart[i].pad)) replayPart = notes;
        }
        return replayPart;
      }
      return state.live || state.mutedPads || state.source === 'tape' ? empty : song.pattern;
    }
    function update(state, now) {
      const song = catalogue.get(state?.song);
      if (!song || !Number.isFinite(state.beat) || clampGain(state.gain) < .003) { if (transport) stop(now); return 0; }
      const rate = song.bpm/60, span = song.bars*4;
      const repeat = state.source === 'stage' && !state.live;
      if (!repeat && state.beat >= span) { if (transport) stop(now); return 0; }
      open(); mix(state,now);
      const isTape = Array.isArray(state.playback), drumPart = part(state,song);
      let same = transport && transport.song === song && transport.source === state.source &&
        transport.live === !!state.live && transport.tape === isTape && transport.guitar === (state.guitar !== false) &&
        transport.muted === !!state.mutedPads && transport.drumPart === drumPart;
      let offset = same ? transport.offset : 0;
      if (same && repeat && transport.raw > span-.8 && transport.raw <= span && state.beat >= 0 && state.beat < .8) offset += span;
      const at = state.beat + offset;
      if (same) {
        const elapsed = now-transport.now;
        const drift = Math.abs(at-transport.at-elapsed*rate);
        same = at >= transport.at-.015 && elapsed >= 0 && elapsed < .46 && drift < .28;
      }
      if (!same) {
        if (transport) hush(now);
        transport = {song,source:state.source,live:!!state.live,tape:isTape,guitar:state.guitar !== false,muted:!!state.mutedPads,drumPart,cursor:at-.035};
      }
      const from = Math.max(transport.cursor, at-.07), to = Math.max(from, at+.123*rate);
      const time = position => now + Math.max(.004,(position-at)/rate);
      if (from < 0 && state.live) {
        for (let i = Math.max(-4,Math.ceil(from)); i < Math.min(0,to); i++) playPad(3,time(i),i === -4 ? 1 : .72);
      }
      visit(song.accompaniment,from,to,song.bars,repeat,(n,pos) => {
        const start = time(pos), seconds = n.length/rate;
        if (n.kind === 'bass') { string(n.note,start,seconds,.31*n.velocity,true); return; }
        if (state.guitar === false) return;
        if (n.kind === 'line') { string(n.note,start+.007,seconds,.21*n.velocity,false); return; }
        if (state.practice && !state.live && state.source === 'stage' && n.up) return;
        for (let i = 0; i < n.notes.length; i++) {
          const idx = n.up ? n.notes.length-1-i : i;
          string(n.notes[idx],start+i*.009,seconds,.091*n.velocity*(1-i*.07),false);
        }
      });
      visit(drumPart,from,to,song.bars,repeat,(n,pos) => {
        const accent = isTape ? 1 : (n.pad === 2 ? .76 : 1) * (pos % 1 ? .87 : 1);
        playPad(n.pad,time(pos),accent);
      });
      Object.assign(transport,{cursor:to,at,raw:state.beat,offset,now});
      return state.source === 'tape' || state.live ? 1 : clampGain(state.gain*1.58);
    }
    function hit(state, now) {
      if (!Number.isInteger(state?.pad) || state.pad < 0 || state.pad > 2 || clampGain(state.gain ?? 1) < .003) return;
      open(); mix({gain:state.gain ?? 1,pan:state.pan,source:'stage',live:true},now);
      playPad(state.pad,now+.004,1);
    }
    return {update,hit,stop};
  }
  window.BayShellScore = {songs,createPlayer};
})();
