const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { spawn } = require("node:child_process");
const corner = process.argv.includes("--corner");
const luggage = process.argv.includes("--luggage");
const green = process.argv.includes("--on-green");
const junction = process.argv.includes("--junction");
const threads = process.argv.includes("--threads");
const neighbors = process.argv.includes("--neighbors");
const partnerDrive = process.argv.includes("--partner-drive");
const pavement = process.argv.includes("--pavement");
const starlite = process.argv.includes("--starlite");
const engineSeven = process.argv.includes("--engine-seven");
const play = require(junction ? "./junction.cjs" : engineSeven ? "./engine-seven.cjs" : starlite ? "./starlite.cjs" : pavement ? "./pavement.cjs" : partnerDrive ? "./partner-drive.cjs" : neighbors ? "./neighbors.cjs" : threads ? "./threads.cjs" : green ? "./on-green.cjs" : luggage ? "./luggage.cjs" : corner ? "./corner.cjs" : "./curb-wire-public.cjs");

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
  assert.equal(process.platform, "linux", "Browser playtests run on GitHub's Linux machines");
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
  function disconnect(reason) {
    for (const finish of [...pending.values()]) finish({ error: { message: reason } });
  }
  for (const pipe of [chrome.stdio[3], chrome.stdio[4]]) {
    pipe.on("error", e => disconnect("Chrome pipe closed: " + e.message));
  }
  chrome.once("exit", (code, signal) => disconnect("Chrome exited (" + (signal || code) + ")"));
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
  function send(method, params = {}, sessionId = session, timeout = 18000) {
    const id = ++seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => { pending.delete(id); reject(Error("Timeout in " + method)); }, timeout);
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
    // Chrome starts with a clean blank tab. A cold hosted worker can take a while
    // to initialize its software GPU before the first DevTools reply.
    const { targetInfos } = await send("Target.getTargets", {}, "", 75000);
    const page = targetInfos.find(t => t.type === "page" && t.url === "about:blank")
      || await send("Target.createTarget", { url: "about:blank" }, "", 75000);
    session = (await send("Target.attachToTarget", { targetId: page.targetId, flatten: true }, "", 75000)).sessionId;
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
    const jumps = process.argv.includes("--picture-jumps");
    const cup = process.argv.includes("--coast-cup");
    const houseLights = process.argv.includes("--house-lights");
    const bumpers = process.argv.includes("--bumpers");
    const angling = process.argv.includes("--red-cork");
    const freight = process.argv.includes("--port-spur");
    const caps = process.argv.includes("--summer-caps");
    const lanes = process.argv.includes("--boulevard");
    const windows = process.argv.includes("--open-windows");
    const beat = process.argv.includes("--ocean-beat");
    const carbon = process.argv.includes("--carbon-copies");
    if (!windows && !junction && !lanes && !caps && !freight && !angling && !bumpers && !houseLights && !cup && !beat && !carbon && !jumps && !corner && !luggage && !green && !threads && !neighbors && !partnerDrive && !pavement && !starlite && !engineSeven) await tap("KeyM");
    const activity = windows ? require("./open-windows.cjs") : lanes ? require("./boulevard.cjs") : caps ? require("./summer-caps.cjs") : freight ? require("./port-spur.cjs") : angling ? require("./red-cork.cjs") : bumpers ? require("./bumpers.cjs") : houseLights ? require("./house-lights.cjs") : cup ? require("./coast-cup.cjs") : beat ? require("./ocean-beat.cjs") : carbon ? require("./carbon-copies.cjs") : jumps ? require("./picture-jumps.cjs") : play;
    await activity({ js, send, waitFor, key, tap, errors, mode, local: false });
    assert.equal(await js("!!document.pointerLockElement"), false);
    assert.equal(await js("audioStarts+cursorRequests"), 0);
    console.log("Verified public bundle " + asset);
  } finally {
    if (chrome.exitCode === null) chrome.kill();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
