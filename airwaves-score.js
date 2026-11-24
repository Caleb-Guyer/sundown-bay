/* Original station records. Each chart is scored in sixteenths and can be joined mid-bar. */
(() => {
  "use strict";

  const catalogue = [
    ["after-hours", "After Hours", "Sol FM House Band", "sol", 96],
    ["side-door", "Side Door", "Ida Voss Trio", "sol", 92],
    ["mango-wire", "Mango Wire", "Loma Cuatro", "marea", 108],
    ["late-ferry", "Late Ferry", "Maribel y los Pasos", "marea", 100],
    ["dry-county", "Dry County", "The Spare Lugs", "breaker", 124],
    ["salt-chrome", "Salt Chrome", "Switchglass", "breaker", 132]
  ];
  const tracks = Object.create(null);
  for (const [id, title, artist, station, bpm] of catalogue) {
    tracks[id] = Object.freeze({id, title, artist, station, bpm, bars:32});
  }

  class Measure {
    constructor(number, tempo) {
      this.number = number;
      this.unit = 15 / tempo;
      this.steps = Array.from({length:16}, () => []);
    }
    note(at, pitch, length, gain, shape, slide, attack=.006, sustain=0) {
      const index = Math.floor(at);
      this.steps[index].push({offset:(at-index)*this.unit, pitch, length:length*this.unit,
        gain, shape, slide, attack, sustain});
    }
    noise(at, length, gain, from, to) {
      const index = Math.floor(at);
      this.steps[index].push({offset:(at-index)*this.unit, length:length*this.unit, gain, from, to});
    }
  }

  function handDrum(m, at, note, velocity, open) {
    m.note(at, note+.7, open?1.62:.57, .083*velocity, "sine", note-.65, .003, open?.24:0);
    m.noise(at+.025, open?.29:.36, (open?.025:.046)*velocity, 1930, 830);
  }
  function kick(m, at, strength) {
    m.note(at, 55, 1.45, .183*strength, "sine", 29, .003);
  }
  function snare(m, at, strength, brush=false) {
    m.note(at, 53, .62, .069*strength, "triangle", 43, .003);
    m.noise(at+.045, brush?1.18:.98, (brush?.085:.128)*strength, brush?2750:3120, brush?1210:980);
  }
  function pluckedBass(m, at, note, length, strength=1) {
    m.note(at, note, length, .145*strength, "bass", undefined, .009, .38);
  }
  function rolledKeys(m, at, pitches, length, strength) {
    pitches.forEach((pitch, i) => {
      m.note(at+i*.04, pitch, length-i*.04, .042*strength, "tine", undefined, .013, .36);
    });
  }

  // Side Door. Ida comps below her melody. Her drummer waits until the first chorus
  // to trade the stick on the snare rim for the whole head.
  const sideChords = [
    [41, [56, 60, 63, 67]],  // Fm9
    [37, [53, 56, 60, 63]],  // Dbmaj9
    [36, [55, 58, 63, 68]],  // Abmaj9/C
    [39, [55, 61, 65, 72]],  // Eb13
    [34, [49, 53, 56, 60]],  // Bbm9
    [44, [55, 60, 63, 70]],  // Abmaj9
    [43, [53, 59, 63, 68]],  // G7 altered
    [36, [52, 58, 61, 67]]   // C7b9
  ];
  const sideForm = [0,1,2,3, 0,1,2,3, 4,1,6,7, 5,3,4,1, 5,3,6,7, 1,2,4,7, 5,3,4,1, 0,6,7,0];
  const sideVerse = [
    [[2,68,2.8],[6,70,1.8],[10,72,4.5]], [[3,70,2],[7,68,5.2]],
    [[6,67,3],[11,70,2],[14,72,1.6]], [[2,67,5.4]],
    [[1,65,3.5],[7,68,1.6],[11,72,2.1]], [[2,75,2.8],[7,72,5]],
    [[3,71,2.5],[10,68,1.9],[13,65,2]], [[1,64,5.8],[11,67,2]]
  ];
  const sideHook = [
    [[0,75,3.6],[5,72,1.5],[8,77,4.8]], [[2,75,2.6],[6,70,1.7],[11,67,3.6]],
    [[0,72,3],[5,68,2],[9,65,4.8]], [[2,68,2.8],[7,72,5]],
    [[0,75,3.6],[5,72,1.5],[8,77,3.4],[13,79,1.6]], [[2,75,2.6],[6,70,1.7],[10,67,4]],
    [[1,71,3.4],[6,68,2],[10,65,3]], [[1,64,5.1],[10,67,2.5]]
  ];
  function sideDoor(m, bar) {
    const [bass, keys] = sideChords[sideForm[bar]];
    const nextBass = sideChords[sideForm[(bar+1)%32]][0];
    const keysOnly = bar<2 || (bar>=20 && bar<22);
    const chorus = (bar>=12 && bar<20) || (bar>=24 && bar<31);
    rolledKeys(m, keysOnly?0:1.15, keys, keysOnly?7.7:4.65, keysOnly?1.06:.86);
    if (bar!==31) rolledKeys(m, chorus?9.19:10.15, keys, chorus?3.2:2.1, chorus?.80:.62);
    if (bar===31) {
      pluckedBass(m, 0, bass, 5, 1.01);
      m.note(1.15, 72, 4.45, .105, "tine", undefined, .013, .28);
      m.note(10.2, 67, 2, .069, "tine");
      m.note(14.18, 68, 1.7, .074, "tine");
      return;
    }
    if (!keysOnly) {
      pluckedBass(m, .06, bass, chorus?3.7:5.7);
      if (bar%2 || chorus) pluckedBass(m, 6.06, bass+7, 1.5, .78);
      pluckedBass(m, chorus?8:10.05, bass+12, chorus?2.9:2.3, .81);
      if (bar%2) pluckedBass(m, 14.12, nextBass===bass?bass+7:nextBass-1, 1.38, .70);
      kick(m, 0, .93);
      if (bar%2 || chorus) kick(m, chorus?9.17:10.04, .68);
    }
    for (const tick of [2,6,10,14]) {
      if (keysOnly && tick!==6 && tick!==14) continue;
      const open = tick===14 && chorus && bar%2===0;
      m.noise(tick+.14, open?1.17:.46, (tick===6?.055:.037)*(keysOnly?.63:1), 6850, open?3500:4210);
    }
    for (const tick of [4,12]) {
      if (chorus) snare(m, tick+.15, tick===12?.91:.83, true);
      else if (!keysOnly || tick===12)
        m.note(tick+.16, 73, .43, .048, "triangle", 61, .002);
    }
    if (bar%8===3 && bar>3) {
      m.noise(15.18, .47, .032, 2200, 1280);
      m.note(15.2, 57, .43, .044, "triangle", 52, .003);
    }
    const line = chorus ? sideHook[(bar>=24?bar-24:bar-12)%8] : sideVerse[(bar+4)%8];
    if (bar===0 || bar===20) return;
    for (const [at, pitch, length] of line) {
      const late = at%2?.21:.1;
      m.note(at+late, pitch, length, chorus?.093:.083, "tine", undefined, .012, .32);
      if (chorus && length>4) m.note(at+late+.045, pitch-12, length*.91, .033, "triangle", undefined, .016, .36);
    }
  }

  // Mango Wire. The bass anticipates the next harmony at the end of the bar.
  // The two halves of the clave keep their order through the percussion break.
  const mangoChords = [
    [41,[56,60,63]], [46,[57,62,65]], [39,[55,58,62]],
    [36,[52,58,62]], [44,[55,60,63]], [37,[53,56,60]]
  ];
  const mangoForm = [0,0,1,3, 0,1,2,3, 0,1,4,3, 5,1,2,3, 5,1,0,3, 0,0,1,3, 5,1,2,3, 0,1,3,0];
  const mangoCalls = [
    [[2,72,2.4],[6,75,2.0],[11,77,3.4]], [[1,74,1.7],[5,72,3.6]],
    [[4,70,2.5],[8,74,1.4],[11,77,3.5]], [[2,76,4.7]],
    [[2,72,1.55],[5,75,2.1],[9,77,4.2]], [[1,79,2.1],[5,77,2.3],[11,74,2.7]],
    [[4,75,2.2],[8,72,1.7],[12,70,2.8]], [[2,67,3.8],[11,70,2.5]]
  ];
  const mangoCoro = [
    [[0,77,2.45],[3,80,1.5],[6,77,2.0],[10,75,3.25]], [[2,77,2.5],[6,74,3.9]],
    [[0,75,2.3],[3,77,1.7],[7,79,2.3],[11,77,2.6]], [[2,76,4.1],[12,72,2]],
    [[0,77,2.3],[3,80,1.5],[6,77,2.0],[10,75,2],[14,77,1.3]], [[2,79,2.5],[6,77,2.8]],
    [[2,75,2.4],[6,72,2.2],[10,68,3.8]], [[2,67,3.5],[10,70,1.5],[13,72,2.2]]
  ];
  function mangoWire(m, bar) {
    const [root, grip] = mangoChords[mangoForm[bar]];
    const next = mangoChords[mangoForm[(bar+1)%32]][0];
    const percussionBreak = bar>=20 && bar<23;
    const coro = (bar>=12 && bar<20) || bar>=24;
    for (const tick of (bar%2?[4,8]:[0,6,12])) {
      m.note(tick+.045, 87, .40, .075, "sine", 83, .002);
      m.note(tick+.065, 98, .22, .029, "triangle", 91, .002);
    }
    handDrum(m, 4.05, 58, .72, false);
    handDrum(m, 10.07, 55, .65, false);
    handDrum(m, 12.05, 51, .91, true);
    if (bar%2) handDrum(m, 14.08, 53, .92, true);
    if (percussionBreak || bar%8===7) {
      handDrum(m, 2.1, 62, .67, false);
      handDrum(m, 7.18, 60, .75, true);
      handDrum(m, 15.12, 58, .73, false);
    }
    for (const tick of [2,6,10,14]) {
      m.noise(tick+.03, tick%8===6?.58:.38, tick%8===6?.041:.030, 6260, 3490);
      if (coro && (tick===6 || tick===14))
        m.note(tick+.08, 79, .59, .036, "triangle", 72, .003);
    }
    if (percussionBreak) return;
    if (bar===0 || bar===4 || bar===23) pluckedBass(m, .03, root, 3.95, .98);
    pluckedBass(m, 6.04, root+7, 3.2, .89);
    if (bar%2) pluckedBass(m, 10.07, root+12, 1.5, .76);
    pluckedBass(m, 14.04, next, 5.2, 1.05);
    for (const tick of (bar%2?[2,6,11,14]:[2,7,10,14])) {
      const pick = tick===14?mangoChords[mangoForm[(bar+1)%32]][1]:grip;
      const upper = tick<8?1:2;
      m.note(tick+.075, pick[upper]+12, 1.08, .066, "triangle", undefined, .003, .28);
      m.note(tick+.125, pick[upper-1]+12, .88, .045, "tine", undefined, .004, .18);
    }
    if (bar<3 || bar===23) return;
    const line = coro?mangoCoro[(bar>=24?bar-24:bar-12)%8]:mangoCalls[(bar+4)%8];
    for (const [at,pitch,length] of line) {
      m.note(at+.09, pitch, length, coro?.078:.073, "horn", undefined, .021, .47);
      if (coro && (length>=3 || at===0)) {
        const lower = grip.slice().reverse().find(note=>note+12<pitch-1);
        m.note(at+.145, lower===undefined?grip[2]:lower+12, length*.90, .046, "reed", undefined, .024, .43);
      }
    }
  }

  // Late Ferry is a bolero with a single nylon-string player and a melodica.
  // A quiet note at the top of a guitar arpeggio rings across the next bass pickup.
  const ferryChords = [
    [38,[53,57,62,65]], [34,[53,57,62,65]], [43,[55,58,62,65]],
    [33,[52,55,61,64]], [41,[53,57,60,64]], [36,[52,55,58,64]],
    [31,[53,58,62,67]], [40,[52,55,58,62]]
  ];
  const ferryForm = [0,1,6,3, 0,0,1,3, 0,2,7,3, 4,5,2,3, 1,4,7,3, 2,1,7,3, 0,2,1,3, 1,7,3,0];
  const ferryVerse = [
    [[3,69,4.6],[10,67,1.8],[13,65,2.6]], [[3,64,3.0],[8,65,6.1]],
    [[5,65,2.6],[10,69,3.3]], [[1,67,3.5],[9,64,4.8]],
    [[3,69,4.2],[9,72,2.7],[13,74,2.6]], [[2,70,4.0],[9,69,4.3]],
    [[3,67,3.4],[9,64,2.1],[13,62,2.3]], [[3,61,6.5]]
  ];
  const ferryRefrain = [
    [[1,72,6.4],[10,69,2.8]], [[2,67,3.8],[9,70,4.9]],
    [[1,74,5.8],[9,70,2.0],[13,67,1.9]], [[2,69,5.8]],
    [[1,70,5.6],[9,72,3.2]], [[2,69,3.1],[7,65,5.7]],
    [[1,67,5],[9,64,3.7]], [[3,61,5.3],[12,64,2.4]]
  ];
  function nylon(m, at, pitch, length, velocity) {
    m.note(at, pitch, length, .079*velocity, "triangle", undefined, .003, .29);
    m.note(at+.038, pitch+12, Math.min(length,.76), .019*velocity, "tine", undefined, .002);
  }
  function lateFerry(m, bar) {
    const [root, strings] = ferryChords[ferryForm[bar]];
    const next = ferryChords[ferryForm[(bar+1)%32]][0];
    const swell = bar>=12 && bar<20;
    const interlude = bar>=20 && bar<24;
    pluckedBass(m, .08, root, bar===31?8.25:5.5, .88);
    if (bar===31) {
      for (let i=0;i<4;i++) nylon(m, 1+i*.67, strings[i], 7.7-i*.45, .86);
      m.note(2.15, 62, 7.8, .084, "reed", undefined, .053, .56);
      return;
    }
    pluckedBass(m, 6.10, root+7, 2.5, .66);
    if (bar%2===1) pluckedBass(m, 12.1, next+(root<next?-1:1), 2.65, .74);
    else pluckedBass(m, 11.05, root+12, 2.74, .72);
    const picking = bar%2===0?[[0,0],[3,1],[6,3],[9,2],[12,1],[14,2]]:
      [[1,0],[4,2],[7,1],[10,3],[13,2]];
    for (const [tick,string] of picking) {
      nylon(m, tick+.11, strings[string], string===3?3.55:2.4, string===3?.94:.78);
    }
    if (bar>1) {
      handDrum(m, 4.10, 63, .48, false);
      handDrum(m, 9.04, 57, .55, true);
      if (bar%2===0) handDrum(m, 12.14, 60, .47, false);
      if (swell || bar%4===3) handDrum(m, 14.13, 55, .63, true);
      m.noise(2.14, 1.3, .041, 4420, 1910);
      if (swell) m.noise(10.12, 1.68, .043, 4190, 1770);
    }
    if (bar<3) return;
    const line = swell?ferryRefrain[bar-12]:ferryVerse[(bar+4)%8];
    for (const [at,pitch,length] of line) {
      if (interlude) nylon(m, at+.17, pitch, length, 1.04);
      else m.note(at+.16, pitch, length, .092, "reed", length>5?pitch-.27:undefined, .047, .59);
    }
  }

  // Dry County. The guitar and bass share the low riff, then separate when the
  // chorus opens up. The four bars before its return are in half time.
  const dryRoots = [40,40,43,45, 40,40,43,45, 40,43,38,47, 45,43,40,40,
    45,48,38,47, 40,43,45,47, 45,43,40,40, 48,38,47,40];
  const dryLead = [
    [[2,64,2],[6,67,2],[10,69,3.2]], [[4,67,1.8],[8,62,4.1]],
    [[2,64,1.7],[5,67,1.5],[8,71,4.0]], [[6,67,2.3],[11,64,3.4]],
    [[2,69,2.2],[6,72,2],[10,74,3.1]], [[3,72,2.2],[7,67,3.8]],
    [[2,69,2.3],[6,66,2],[11,62,2.7]], [[1,66,3.0],[8,63,4.3]]
  ];
  function garageGrip(m, at, root, length, velocity) {
    m.note(at, root+12, length, .061*velocity, "sawtooth", undefined, .004, .38);
    m.note(at+.055, root+19, length*.91, .057*velocity, "triangle", undefined, .003, .32);
  }
  function floorTom(m, at, pitch, strength) {
    m.note(at, pitch+4, 1.45, .118*strength, "sine", pitch-1, .003, .18);
    m.noise(at+.025, .34, .040*strength, 1340, 640);
  }
  function dryCounty(m, bar) {
    const root = dryRoots[bar], next = dryRoots[(bar+1)%32];
    const chorus = (bar>=12 && bar<20) || (bar>=24 && bar<31);
    const half = bar>=20 && bar<24;
    if (bar===31) {
      for (const tick of [0,3,6]) {
        garageGrip(m, tick+.04, root, tick===6?4.68:1.23, 1.05);
        pluckedBass(m, tick, root, tick===6?4.4:1.2, .94);
        kick(m, tick, .93);
      }
      floorTom(m, 14, 45, .94);
      floorTom(m, 15, 42, .77);
      return;
    }
    const strokes = half?[0,6,12]:chorus?[0,3,6,8,11,14]:[0,2,6,8,10,14];
    for (const at of strokes) {
      const muted = !half && !chorus && (at===2 || at===10);
      const climb = !chorus && !half && at===10?3:(!chorus && at===14?5:0);
      const len = half?(at===12?2.65:3.85):chorus?(at===8?2.65:1.68):muted?.64:1.23;
      garageGrip(m, at+.037, root+climb, len, muted?.65:.94);
      if (at===0 || at===8 || (!chorus && at===14) || half || (chorus && at===6))
        pluckedBass(m, at, root+climb, half?3.7:chorus?2.6:1.8, at===0?1.0:.83);
    }
    if (chorus && bar%2) pluckedBass(m, 14.05, next+(root<=next?-1:1), 1.41, .79);
    kick(m, 0, 1.08);
    if (half) {
      kick(m, 6, .64);
      snare(m, 8.07, 1.03);
    } else {
      if (bar%2) kick(m, 6, .70);
      kick(m, 8, .92);
      snare(m, 4.07, .96);
      snare(m, 12.07, 1.03);
    }
    for (const at of (half?[0,6,12]:[0,2,4,6,8,10,12,14])) {
      const open = chorus && at===14 && bar%2;
      m.noise(at+.025, open?1.73:.46, at%4?.039:.051, open?6100:7630, open?2460:3900);
    }
    if (bar%8===3 || bar===23) {
      floorTom(m, 13.05, 50, .88);
      floorTom(m, 15.08, 45, .92);
    }
    if (chorus) {
      for (const [at,pitch,length] of dryLead[(bar>=24?bar-24:bar-12)%8]) {
        m.note(at+.085, pitch, length, .066, "reed", length>3?pitch+.8:undefined, .004, .54);
        if (length>3) m.note(at+.13, pitch+7, length*.90, .026, "sawtooth", undefined, .007, .27);
      }
    } else if (bar%4===3 && !half && bar>3) {
      m.note(9.04, root+24, 1.7, .072, "reed", undefined, .004, .46);
      m.note(12.08, root+22, 2.65, .071, "reed", root+19, .006, .47);
    }
  }

  // Salt Chrome. Single-coil picking, a short spring return and a low baritone
  // guitar take turns stating the tune. The middle section moves into D major.
  const saltRoots = [35,35,31,42, 35,33,31,42, 35,38,40,42, 38,33,31,42,
    38,33,40,42, 31,38,40,42, 35,33,31,42, 35,38,42,35];
  const saltTune = [
    [[0,71,1.25],[2,74,1.25],[4,78,3.25],[9,76,1.4],[12,74,3.2]],
    [[2,73,1.3],[4,69,3.3],[10,73,2.7],[14,76,1.4]],
    [[0,74,1.45],[3,71,1.4],[6,67,4.3],[13,69,1.65]],
    [[0,73,2.35],[4,70,2.5],[10,66,4.1]],
    [[0,71,1.25],[2,74,1.25],[4,78,2.2],[8,81,3.6],[14,78,1.4]],
    [[2,78,1.4],[5,76,2.4],[10,74,3.85]],
    [[1,76,2],[5,79,2.75],[10,78,1.6],[13,76,2.0]],
    [[2,73,2.3],[6,70,2.1],[10,66,4.55]]
  ];
  const saltOpen = [
    [[0,78,4.2],[6,81,2.9],[11,78,3.35]], [[1,76,2.6],[5,73,2.9],[11,69,3.3]],
    [[0,74,3.3],[5,71,1.8],[8,67,4.6]], [[2,70,2.1],[6,73,2.3],[10,78,3.6]],
    [[0,81,3.6],[5,78,3.6],[11,74,2.8]], [[1,76,2.45],[5,73,2.9],[11,69,3.1]],
    [[0,76,4],[6,79,2.6],[11,76,2.6]], [[1,78,3],[6,73,2.4],[10,70,3.4]]
  ];
  function pickedWire(m, at, pitch, length, velocity, spring) {
    m.note(at+.035, pitch, length, .090*velocity, "reed", length>3?pitch-.38:undefined, .004, .38);
    m.note(at+.06, pitch+12, Math.min(.50,length*.55), .020*velocity, "tine", undefined, .002);
    if (spring) m.note(at+.81, pitch, Math.min(2.9,length*.78), .032*velocity, "triangle", pitch-.13, .007, .20);
  }
  function saltChrome(m, bar) {
    const root = saltRoots[bar];
    const open = bar>=12 && bar<20;
    const low = bar>=20 && bar<24;
    if (bar===31) {
      pickedWire(m, 0, 71, 3.6, 1.0, true);
      pickedWire(m, 6, 66, 2.1, .88, false);
      m.note(10.07, 59.5, 4.8, .10, "reed", 57.5, .009, .40);
      pluckedBass(m, 0, root, 5, 1.04);
      pluckedBass(m, 10, root, 3.75, .83);
      floorTom(m, 0, 43, .98);
      floorTom(m, 10, 43, .83);
      return;
    }
    for (const [at,interval,length] of (low?[[0,0,4.6],[6,7,2.6],[10,0,3.6]]:
      [[0,0,2.5],[3,0,1.0],[6,7,1.55],[8,12,2.4],[11,7,1.1],[14,7,1.5]]))
      pluckedBass(m, at, root+interval, length, at===0?.94:.74);
    kick(m, 0, .95);
    if (!low) kick(m, bar%2?10:8, .82);
    if (bar<3 || low) {
      floorTom(m, 4, 49, .85);
      floorTom(m, 12, 44, .85);
    } else {
      snare(m, 4.045, .84);
      snare(m, 12.045, .90);
    }
    for (const tick of [2,6,10,14])
      m.noise(tick+.06, open&&tick===14?1.65:.68, open?.051:.039, 7180, open?2910:4250);
    if (open && bar%2===0)
      m.noise(.06, 2.65, .075, 6350, 2190);
    if (bar%4===3 && !low) {
      m.noise(13.08, .43, .065, 2200, 1190);
      floorTom(m, 15.02, 50, .76);
    }
    const melody = open?saltOpen[bar-12]:saltTune[(bar+4)%8];
    for (const [at,note,length] of melody) {
      const pitch = low || bar<2?note-12:note;
      pickedWire(m, at, pitch, length, low?.9:1.02, length>2.5);
      if (open && length>=3) {
        // Repick the sustained string with a quieter upstroke.
        pickedWire(m, at+1, pitch, length-1.02, .64, false);
      }
    }
  }

  const arrangements = {"side-door":sideDoor, "mango-wire":mangoWire, "late-ferry":lateFerry,
    "dry-county":dryCounty, "salt-chrome":saltChrome};
  const cached = Object.create(null);
  function play(id, step, start, api) {
    const track = tracks[id];
    if (!track || id==="after-hours" || !Number.isFinite(step)) return false;
    const span = track.bars*16;
    const index = ((Math.floor(step)%span)+span)%span;
    const bar = Math.floor(index/16);
    const measures = cached[id] || (cached[id]=[]);
    let measure = measures.find(entry=>entry.number===bar);
    if (!measure) {
      measure = new Measure(bar,track.bpm);
      arrangements[id](measure,bar);
      // Both turntables may play different parts of the same record at once.
      measures.unshift(measure);
      if (measures.length>2) measures.pop();
    }
    for (const e of measure.steps[index%16]) {
      const at = start+e.offset;
      if (e.pitch===undefined) api.noise(at,e.length,e.gain,e.from,e.to);
      else api.note(e.pitch,at,e.length,e.gain,e.shape,e.slide,e.attack,e.sustain);
    }
    return true;
  }
  window.BayAirwavesScore = Object.freeze({tracks:Object.freeze(tracks),play});
})();
