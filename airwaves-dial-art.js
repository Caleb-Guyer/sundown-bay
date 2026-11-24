/* Printed scales and moving hardware for the dash receiver and the Boardwalk decks. */
(() => {
  "use strict";

  const stations = {
    __proto__: null,
    off: {label: "OFF", light: "#c7c3ac", freq: null},
    sol: {label: "SOL FM", light: "#9ce7cd", freq: 88.3},
    marea: {label: "MAREA", light: "#ffa289", freq: 94.7},
    breaker: {label: "BREAKER", light: "#f4d27b", freq: 103.9}
  };
  const presets = [
    {key: "off", x: 4, width: 33}, {key: "sol", x: 39, width: 58},
    {key: "marea", x: 99, width: 61}, {key: "breaker", x: 162, width: 74}
  ];
  const receiverPaint = new WeakMap(), deckPlates = new WeakMap();
  const mono = 'Consolas, "Liberation Mono", monospace';
  const sans = '"Arial Narrow", Arial, sans-serif';
  const dialX = mhz => 39 + (mhz - 88) * 9.32;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function ink(c, color, x, y, w, h) {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  }
  function type(c, label, x, y, font, color, align = "center") {
    c.font = font;
    c.fillStyle = color;
    c.textAlign = align;
    c.textBaseline = "alphabetic";
    c.fillText(label, x, y);
  }
  function triangle(c, color, x1, y1, x2, y2, x3, y3) {
    c.fillStyle = color;
    c.beginPath();
    c.moveTo(x1, y1);
    c.lineTo(x2, y2);
    c.lineTo(x3, y3);
    c.closePath();
    c.fill();
  }
  function context(canvas) {
    const c = canvas?.width && canvas.height && canvas.getContext?.("2d");
    return c && typeof c.setTransform === "function" && typeof c.fillText === "function" ? c : null;
  }

  function receiver(canvas, station, slot) {
    const c = context(canvas);
    if (!c) return;
    const preset = stations[station] || stations.off;
    const freq = preset.freq && Number.isFinite(slot) && slot >= 88 && slot <= 108 ? slot : preset.freq;
    const w = canvas.width, h = canvas.height;
    const last = receiverPaint.get(canvas);
    if (last && last.preset === preset && last.freq === freq && last.w === w && last.h === h) return;
    receiverPaint.set(canvas, {preset, freq, w, h});
    c.save();
    c.setTransform(w / 240, 0, 0, h / 40, 0, 0);

    // The scale lives behind smoked glass. The silver rule under it is also the stop for the keys.
    ink(c, "#52615b", 0, 0, 240, 40);
    ink(c, "#d0c7a6", 0, 0, 240, 1);
    ink(c, "#182d2c", 2, 2, 236, 20);
    ink(c, "#223935", 3, 3, 234, 11);
    ink(c, "#708571", 31.5, 19.5, 198.5, .6);
    type(c, "FM", 6, 15.3, 'italic bold 14px Georgia, serif', "#eadbb0", "left");
    for (let i = 0; i <= 40; i++) {
      const mhz = 88 + i / 2, x = dialX(mhz);
      const major = i % 8 === 0, y = major ? 12 : i % 2 === 0 ? 14.7 : 17;
      ink(c, major ? "#e7dbb8" : "#91a899", x - .42, y, major ? 1.1 : .8, 19.6 - y);
      if (major) type(c, mhz, x, 10.7, "bold 9.5px " + mono, "#e5dfc4");
    }
    if (freq !== null) {
      const x = dialX(freq);
      ink(c, "#102724", x + 1, 12.2, 1.8, 9);
      ink(c, preset.light, x - .8, 12.2, 1.6, 9);
      triangle(c, preset.light, x - 2.7, 11.5, x + 2.7, 11.5, x, 15.1);
    }
    ink(c, "#a69e81", 2, 22, 236, 1);
    ink(c, "#1b2928", 2, 23, 236, 15);
    for (const key of presets) {
      const item = stations[key.key], selected = item === preset;
      const x = key.x, width = key.width, y = selected ? 25.2 : 24;
      ink(c, selected ? "#26322f" : "#5c6660", x, y, width, 12.4);
      ink(c, selected ? "#728477" : "#919485", x + .6, y, width - 1.2, .9);
      ink(c, selected ? "#536158" : "#35453e", x + 1, y + 11, width - 2, 1);
      ink(c, selected ? item.light : "#35423b", x + 3.7, y + 3.1, 2.8, 5.5);
      type(c, item.label, x + width / 2 + 2, y + 9.7, "bold 9.5px " + sans, selected ? item.light : "#f0e9ce");
    }
    ink(c, "#273633", 0, 39, 240, 1);
    c.restore();
  }

  const stripX = 30, cell = 60, faderLeft = 39, faderRight = 301;

  function deckPlate(c) {
    ink(c, "#c6c2a7", 0, 0, 340, 88);
    ink(c, "#a3ac99", 0, 1.4, 340, 84.8);
    ink(c, "#c6cbb7", .8, 2, 338.4, .8);
    ink(c, "#647266", 0, 85.7, 340, 2.3);
    // Both strips share a registration line. A downbeat lines up vertically on both decks.
    for (let i = 0; i < 4; i++) {
      const x = stripX + i * cell;
      type(c, String(i + 1), x + 9, 11.2, "bold 10px " + mono, "#2d4039");
      ink(c, "#5e7163", x + .5, 5.6, 1, 7.3);
      if (i === 0) ink(c, "#5e7163", x + 2.6, 5.6, .9, 7.3);
    }
    type(c, "BPM", 308, 11.1, "bold 9px " + sans, "#374a40");
    ink(c, "#6c7a69", 275.5, 14, 1, 38);
    for (let row = 0; row < 2; row++) {
      const y = 15 + row * 20;
      type(c, row === 0 ? "A" : "B", 15.5, y + 13.8, 'bold italic 17px Georgia, serif', "#263e39");
      ink(c, "#d7d5bb", stripX - 1, y, cell * 4 + 2, 17.8);
      ink(c, "#263832", stripX, y, cell * 4, 16.6);
      for (let i = 0; i < 4; i++) {
        const x = stripX + cell * i;
        ink(c, "#354941", x + 2, y + 2, cell - 3.4, 12.6);
        ink(c, i === 0 ? "#92a592" : "#677e6e", x + 2, y + 2, 1.2, 12.6);
        if (i === 0) ink(c, "#879a87", x + 4, y + 2, 1, 12.6);
        for (let j = 1; j < 4; j++) ink(c, "#65806c", x + j * cell / 4, y + 14 - (j === 2 ? 4 : 2), .85, j === 2 ? 4 : 2);
      }
      ink(c, "#d9d5b9", 283, y, 50, 17.8);
      ink(c, "#34473c", 283, y, 50, 16.6);
    }

    // The slot is cut into the same faceplate as the two dark beat windows.
    ink(c, "#7a8978", 5, 56, 330, 1);
    ink(c, "#c3c9b5", 5, 57, 330, .8);
    type(c, "A", 24, 77.3, 'bold italic 14px Georgia, serif', "#34493f");
    type(c, "B", 316, 77.3, 'bold italic 14px Georgia, serif', "#34493f");
    for (let i = 0; i <= 16; i++) {
      const x = faderLeft + (faderRight - faderLeft) * i / 16;
      const height = i === 8 ? 7 : i % 4 === 0 ? 5 : 2.6;
      ink(c, i === 8 ? "#2c443a" : "#607365", x - .5, 69.6 - height, i === 8 ? 1.6 : 1, height);
    }
    ink(c, "#cfd0b8", faderLeft - 4.5, 70.8, faderRight - faderLeft + 9, 5.7);
    ink(c, "#283b32", faderLeft - 4, 71, faderRight - faderLeft + 8, 4.4);
    ink(c, "#15291f", faderLeft - 3, 71.7, faderRight - faderLeft + 6, 1.6);
    ink(c, "#506557", (faderLeft + faderRight) / 2 - .5, 77.2, 1.2, 4.2);
  }

  function plateFor(canvas) {
    const w = canvas.width, h = canvas.height;
    const prior = deckPlates.get(canvas);
    if (prior && prior.w === w && prior.h === h) return prior;
    const copy = typeof OffscreenCanvas === "function" ? new OffscreenCanvas(w, h) : canvas.ownerDocument?.createElement("canvas");
    if (copy) { copy.width = w; copy.height = h; }
    const c = context(copy);
    if (c) {
      c.setTransform(w / 340, 0, 0, h / 88, 0, 0);
      deckPlate(c);
    }
    const plate = {w, h, face: c ? copy : null};
    deckPlates.set(canvas, plate);
    return plate;
  }

  function beatStrip(c, y, beats, live, bpm, light) {
    const position = Number.isFinite(beats) ? (beats % 4 + 4) % 4 : 0;
    const index = Math.floor(position), f = position - index;
    const x = stripX + index * cell, travel = cell - 8;
    // The pointer crosses one window per quarter note. Dim, stationary tape B can be cued in silence.
    c.globalAlpha = live ? .33 : .13;
    ink(c, light, x + 2, y + 2, cell - 3.4, 12.6);
    c.globalAlpha = 1;
    if (live) ink(c, light, x + 4, y + 4.5, Math.max(1.5, travel * f), 2.3);
    if (index === 0) {
      ink(c, light, x + 2, y + 2, 1.2, 12.6);
      ink(c, light, x + 4, y + 2, 1, 12.6);
    }
    const tip = x + 4.5 + travel * f;
    ink(c, live ? "#fff4d6" : "#a9b7a0", tip - .65, y + 3, 1.3, 10.2);
    if (live) triangle(c, light, tip - 2.4, y + 2.2, tip + 2.4, y + 2.2, tip, y + 5.8);
    const tempo = Number.isFinite(bpm) && bpm > 0 ? (Math.round(bpm * 10) / 10).toString() : "–";
    type(c, tempo, 308.2, y + 12.7, "bold 12.7px " + mono, live ? light : "#c0cab1");
  }

  function decks(canvas, s) {
    const c = context(canvas);
    if (!c || !s) return;
    const plate = plateFor(canvas);
    c.save();
    c.setTransform(1, 0, 0, 1, 0, 0);
    if (plate.face) c.drawImage(plate.face, 0, 0);
    c.setTransform(plate.w / 340, 0, 0, plate.h / 88, 0, 0);
    if (!plate.face) deckPlate(c);
    beatStrip(c, 15, s.beat, true, s.bpm, (stations[s.station] || stations.sol).light);
    beatStrip(c, 35, s.incomingBeat, !!s.running, s.tempo, (stations[s.incomingStation] || stations.marea).light);
    const blend = Number.isFinite(s.blend) ? clamp(s.blend, 0, 1) : 0;
    const x = faderLeft + (faderRight - faderLeft) * blend;
    ink(c, "#657561", x - 7, 67, 15.5, 14.8);
    ink(c, "#39483f", x - 8.2, 65.1, 16.4, 15.4);
    ink(c, "#deca9c", x - 7.5, 65.8, 15, 12.9);
    ink(c, "#f1e2be", x - 6.8, 66.2, 13.6, 2.1);
    ink(c, "#b6a17a", x - 6.8, 77.2, 13.6, 1.4);
    ink(c, "#4c5242", x - .7, 66.7, 1.4, 11.8);
    c.restore();
  }

  window.BayAirwavesDial = Object.freeze({receiver, decks});
})();
