const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const corner = process.argv.includes("--corner");
const luggage = process.argv.includes("--luggage");
const green = process.argv.includes("--on-green");
const play = require(green ? "./on-green.cjs" : luggage ? "./luggage.cjs" : corner ? "./corner.cjs" : "./curb-wire-public.cjs");

const mode = process.argv[2];
const site = "https://caleb-guyer.github.io/sundown-bay/";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function waitForRelease() {
  const html = fs.readFileSync(path.join(__dirname, "../../index.html"), "utf8");
  const asset = html.match(/<script src="(sundown\.js\?v=[a-f0-9]+)"/)[1];
  const end = Date.now() + 210000;
  while (Date.now() < end) {
    const response = await fetch(site + "?playtest=" + Date.now(), {
      cache: "no-store", signal: AbortSignal.timeout(15000)
    });
    if (response.ok && (await response.text()).includes(asset)) return asset;
    await delay(4000);
  }
  throw Error("Pages did not serve " + asset + " within the deployment window");
}

async function run() {
  assert.equal(process.env.GITHUB_ACTIONS, "true", "Use a hosted runner for browser tests");
  assert(["overhead", "street"].includes(mode));
  const asset = await waitForRelease();
  const profile = fs.mkdtempSync(path.join(process.env.RUNNER_TEMP, "bay-wire-"));
  const chrome = spawn("google-chrome", [
    "--headless", "--mute-audio", "--window-size=1024,640", "--no-first-run",
    "--disable-sync", "--disable-extensions", "--disable-background-networking",
    "--remote-debugging-pipe", "--user-data-dir=" + profile,
    ...(mode === "street" ? ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] : ["--disable-webgl"]),
    "about:blank"
  ], { stdio: ["ignore", "ignore", "inherit", "pipe", "pipe"] });
  const pending = new Map(), errors = [];
  let seq = 0, session = "", buffer = "";
  chrome.stdio[4].setEncoding("utf8");
  chrome.stdio[4].on("data", chunk => {
    buffer += chunk;
    let cut;
    while ((cut = buffer.indexOf("\0")) >= 0) {
      const message = JSON.parse(buffer.slice(0, cut));
      buffer = buffer.slice(cut + 1);
      if (message.method === "Runtime.exceptionThrown") {
        const error = message.params.exceptionDetails;
        errors.push(error.exception?.description || error.text);
      }
      pending.get(message.id)?.(message);
    }
  });
  function send(method, params = {}, sessionId = session) {
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(Error("Timeout in " + method)); }, 18000);
      pending.set(id, reply => {
        clearTimeout(timer); pending.delete(id);
        if (reply.error) reject(Error(reply.error.message)); else resolve(reply.result);
      });
      chrome.stdio[3].write(JSON.stringify({ id, method, params, ...(sessionId && { sessionId }) }) + "\0");
    });
  }
  async function js(expression) {
    const result = await send("Runtime.evaluate", { expression, returnByValue: true });
    if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text);
    return result.result.value;
  }
  async function waitFor(expression, timeout = 15000) {
    const end = Date.now() + timeout;
    while (Date.now() < end) { if (await js(expression)) return; await delay(65); }
    throw Error("Timed out waiting for " + expression + "\n" + errors.join("\n"));
  }
  function key(type, code) {
    const value = code.startsWith("Key") ? code.slice(3).toLowerCase() : code;
    return send("Input.dispatchKeyEvent", { type, code, key: value, windowsVirtualKeyCode: code === "Escape" ? 27 : code.charCodeAt(3) });
  }
  async function tap(code) { await key("keyDown", code); await key("keyUp", code); }
  try {
    const { targetId } = await send("Target.createTarget", { url: "about:blank" });
    session = (await send("Target.attachToTarget", { targetId, flatten: true })).sessionId;
    await send("Page.enable"); await send("Runtime.enable");
    await send("Page.addScriptToEvaluateOnNewDocument", { source: `
      window.audioStarts = window.cursorRequests = 0;
      localStorage.setItem("sundownBay.audio", "off");
      for (const name of ["requestPointerLock", "webkitRequestPointerLock", "mozRequestPointerLock"]) {
        Object.defineProperty(Element.prototype, name, {value() { ++window.cursorRequests; throw Error("Cursor lock requested"); }});
      }
      for (const name of ["AudioContext", "webkitAudioContext"]) if (window[name]) {
        window[name] = class { constructor() { ++window.audioStarts; throw Error("Audio started"); } };
      }
    ` });
    await send("Page.navigate", { url: site + "?playtest=" + Date.now() });
    await waitFor("document.readyState==='complete' && typeof BayCurbWire==='object'");
    assert.deepEqual(await js("performance.getEntriesByType('resource').map(e=>e.name).filter(n=>new URL(n).pathname.endsWith('.js'))"), [site + asset]);
    if (mode === "overhead") await send("Emulation.setCPUThrottlingRate", { rate: 4 });
    assert.equal(await js("document.querySelectorAll('#intro button').length"), 1);
    await js("document.querySelector('#play').click()");
    await waitFor("!document.querySelector('#hud').hidden");
    assert.equal(await js("document.querySelector('#world').hidden"), mode === "overhead");
    if (!corner && !luggage && !green) await tap("KeyM");
    await play({ js, send, waitFor, key, tap, errors, mode, local: false });
    assert.equal(await js("!!document.pointerLockElement"), false);
    console.log("Verified public bundle " + asset);
  } finally {
    if (chrome.exitCode === null) chrome.kill();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
