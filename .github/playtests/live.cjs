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
const publicSite = "https://caleb-guyer.github.io/sundown-bay/";
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function liveRelease(html,timeout) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    try {
      const response = await fetch(publicSite + "?playtest=" + Date.now(), {
        cache: "no-store", signal: AbortSignal.timeout(10000)
      });
      if (response.ok && (await response.text())===html) return true;
    } catch { /* A failed deployment must not prevent collecting gameplay evidence. */ }
    await delay(4000);
  }
  return false;
}
async function serveCheckout(html, root) {
  const files = new Map([["","index.html"],["index.html","index.html"],["sundown.js","sundown.js"],
    ["style.css","style.css"],["wordmark.svg","wordmark.svg"]]);
  const sources=JSON.parse(html.match(/<script type="application\/json" id="game-sources">([\s\S]*?)<\/script>/)[1]);
  for(const name of sources){assert(/^[\w-]+\.js$/.test(name));files.set(name,name);}
  const types = {".html":"text/html",".js":"application/javascript",".css":"text/css",".svg":"image/svg+xml"};
  const server = require("node:http").createServer((req,res) => {
    const name = files.get(req.url.split("?")[0].slice(1));
    if (!name) { res.writeHead(404).end(); return; }
    res.setHeader("Content-Type",types[path.extname(name)] + "; charset=utf-8");
    fs.createReadStream(path.join(root,name)).pipe(res);
  });
  await new Promise((resolve,reject)=>{server.once("error",reject);server.listen(0,"127.0.0.1",resolve);});
  server.unref();
  return server;
}

async function run() {
  assert.equal(process.platform, "linux", "Browser playtests run on GitHub's Linux machines");
  assert.equal(process.env.GITHUB_ACTIONS, "true", "Use a hosted runner for browser tests");
  assert(["overhead", "street"].includes(mode));
  const compare=process.argv.includes("--compare-drive");
  const root=path.resolve(__dirname,"../..",compare&&process.argv.includes("--baseline")?"baseline-release":".");
  const html = fs.readFileSync(path.join(root,"index.html"), "utf8");
  const asset = html.match(/<script src="(sundown\.js\?v=[a-f0-9]+)"/)[1];
  const server = !compare&&await liveRelease(html,45000) ? null : await serveCheckout(html,root);
  const site = server ? "http://127.0.0.1:" + server.address().port + "/" : publicSite;
  console.log("Playtesting " + (server ? "runner checkout" : "GitHub Pages") + " · " + asset);
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
      if(${!process.argv.includes("--public-record")}&&!localStorage.getItem("sundownBay.publicRecord.v1"))localStorage.setItem("sundownBay.publicRecord.v1",JSON.stringify({intro:true,stage:"meet"}));
      for (const name of ["requestPointerLock", "webkitRequestPointerLock", "mozRequestPointerLock"]) {
        const native=Element.prototype[name];
        Object.defineProperty(Element.prototype, name, {value(...args) { ++window.cursorRequests;
          if(${process.argv.includes("--mouse-look")}&&native)return native.apply(this,args);
          throw Error("Unexpected cursor capture"); }});
      }
      for (const name of ["AudioContext", "webkitAudioContext"]) if (window[name]) {
        window[name] = class { constructor() { ++window.audioStarts; throw Error("Audio started"); } };
      }
    ` });
    await send("Page.navigate", { url: site + "?playtest=" + Date.now() });
    await waitFor("document.readyState==='complete' && typeof BayCurbWire==='object'");
    assert(await js(`(()=>{const rect=document.querySelector('#intro').getBoundingClientRect();
      return rect.x===0&&rect.y===0&&rect.width===innerWidth&&rect.height===innerHeight&&
        getComputedStyle(document.querySelector('#sky')).position==='absolute';})()`),"Title and sky fill the viewport");
    assert.deepEqual(await js("performance.getEntriesByType('resource').map(e=>e.name).filter(n=>new URL(n).pathname.endsWith('.js'))"), [site + asset]);
    if (mode === "overhead") await send("Emulation.setCPUThrottlingRate", { rate: 4 });
    assert.equal(await js("document.querySelectorAll('#intro button').length"), 1);
    await js("document.querySelector('#play').click()");
    await waitFor("!document.querySelector('#hud').hidden");
    assert.equal(await js("document.querySelector('#world').hidden"), mode === "overhead");
    if(compare){
      const drive=await require("../benchmarks/drive.cjs")({js,send,tap,waitFor,mode});
      assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
      assert(!await js("!!document.pointerLockElement"));
      console.log("Paired release drive",asset,JSON.stringify(drive));
      fs.appendFileSync(path.join(process.env.RUNNER_TEMP,"bay-drives.jsonl"),JSON.stringify({asset,...drive})+"\n");
      return;
    }
    assert(await js(`(()=>{const surface=document.querySelector('${mode==="street"?"#world":"#overhead"}');
      const rect=surface.getBoundingClientRect();return rect.x===0&&rect.y===0&&rect.width===innerWidth&&rect.height===innerHeight;})()`),"Play surface fills the viewport");
    const jumps = process.argv.includes("--picture-jumps");
    const cup = process.argv.includes("--coast-cup");
    const houseLights = process.argv.includes("--house-lights");
    const bumpers = process.argv.includes("--bumpers");
    const angling = process.argv.includes("--red-cork");
    const freight = process.argv.includes("--port-spur");
    const caps = process.argv.includes("--summer-caps");
    const lanes = process.argv.includes("--boulevard");
    const wheel=process.argv.includes("--one-wheel"),mouseLook=process.argv.includes("--mouse-look");
    const windows = process.argv.includes("--open-windows");
    const needle = process.argv.includes("--needle-drop");
    const rank = process.argv.includes("--ring-twice");
    const lights = process.argv.includes("--road-lights");
    const sand = process.argv.includes("--soft-sand");
    const campaign = process.argv.includes("--public-record");
    const beat = process.argv.includes("--ocean-beat");
    const carbon = process.argv.includes("--carbon-copies");
    const featurePrint=process.argv.includes("--feature-print");
    const footPursuit=process.argv.includes("--foot-pursuit");
    const cleanThrough=process.argv.includes("--clean-through");
    const walkHome=process.argv.includes("--walk-home"),pressRun=process.argv.includes("--press-run");
    const airReplay=process.argv.includes("--last-seen");
    const action=process.argv.includes("--street-action"),admission=process.argv.includes("--admission");
    if (!pressRun && !mouseLook && !wheel && !cleanThrough && !walkHome && !airReplay && !featurePrint && !footPursuit && !admission && !action && !campaign && !sand && !lights && !rank && !needle && !windows && !junction && !lanes && !caps && !freight && !angling && !bumpers && !houseLights && !cup && !beat && !carbon && !jumps && !corner && !luggage && !green && !threads && !neighbors && !partnerDrive && !pavement && !starlite && !engineSeven) await tap("KeyM");
    const activity = needle ? require("./needle-drop.cjs") : windows ? require("./open-windows.cjs") : lanes ? require("./boulevard.cjs") : caps ? require("./summer-caps.cjs") : freight ? require("./port-spur.cjs") : angling ? require("./red-cork.cjs") : bumpers ? require("./bumpers.cjs") : houseLights ? require("./house-lights.cjs") : cup ? require("./coast-cup.cjs") : beat ? require("./ocean-beat.cjs") : carbon ? require("./carbon-copies.cjs") : jumps ? require("./picture-jumps.cjs") : play;
    await (pressRun ? require("./press-run.cjs") : mouseLook ? require("./mouse-look.cjs") : wheel ? require("./one-wheel.cjs") : cleanThrough ? require("./clean-through.cjs") : walkHome ? require("./walk-home.cjs") : airReplay ? require("./last-seen.cjs") : featurePrint ? require("./feature-print.cjs") : footPursuit ? require("./foot-pursuit.cjs") : admission ? require("./street-admission.cjs") : action ? require("./street-action.cjs") : campaign ? require("./public-record.cjs") : sand ? require("./soft-sand.cjs") : lights ? require("./road-lights.cjs") : rank ? require("./ring-twice.cjs") : activity)({ js, send, waitFor, key, tap, errors, mode, local: false });
    assert.equal(await js("!!document.pointerLockElement"), false);
    assert.equal(await js("audioStarts"), 0);
    assert.equal(await js("cursorRequests"), mouseLook?2:0);
    if(server){
      console.log("Verified runner checkout " + asset);
      assert(await liveRelease(html,30000),"Pages has not published the tested release");
      const response=await fetch(publicSite+asset,{signal:AbortSignal.timeout(20000)});
      assert(response.ok);
      assert(fs.readFileSync(path.join(__dirname,"../../sundown.js")).equals(Buffer.from(await response.arrayBuffer())));
    }
    console.log("Verified public bundle " + asset);
  } finally {
    server?.close();
    if (chrome.exitCode === null) chrome.kill();
  }
}
run().catch(error => { console.error(error); process.exitCode = 1; });
