const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

module.exports = async ({js, send, waitFor, tap, errors, mode}) => {
  // Load a returning pair at the Marlin curb through the game's normal save reader.
  await js(`(() => {
    const u=new BaySecondUnit.Unit();
    u.met=true;u.remember(BaySecondUnit.home.guest,null,"guest");
    u.remember({x:152,z:-25,yaw:0},null,"frankie");u.save();
  })()`);
  await send("Page.reload");
  await waitFor("document.readyState==='complete' && typeof BayWindowSeat==='object'");
  await js(`window.drivePhases=new Set();
    const paintRadar=drawBayMap;
    window.drawBayMap=function(ctx,o){
      if(o.mode==='radar'&&o.crew){
        window.crew=o.crew;
        if(crew.outing)drivePhases.add(crew.outing.phase);
      }
      return paintRadar(ctx,o);
    };
    document.querySelector('#play').click()`);
  const row = title => "[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent===" + JSON.stringify(title) + ")";
  async function choose(title) {
    await waitFor(row(title));await js(row(title)+".click()");
  }
  async function snapshot(label) {
    if (!process.argv.includes("--frames")) return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:87});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  try {
    await waitFor("window.crew?.met");
    await tap("KeyG");await waitFor("crew.afternoon.active");
    await tap("KeyE");await waitFor("crew.afternoon.seated",35000);
    const ride=await js("crew.afternoon.vehicle.garageKey");
    await tap("KeyG");await choose("You drive");await choose("North Boardwalk");
    await waitFor("crew.outing?.phase==='ready'",45000);
    assert.equal(await js("crew.outing.vehicle.garageKey"),ride);
    await tap("KeyE");
    await waitFor("crew.outing?.phase==='ride'&&crew.outing.vehicle.speed>3",35000);
    await waitFor("document.querySelector('#mode').textContent==='Riding with Frankie Prado'");
    await snapshot("passenger");
    await waitFor("crew.outing?.phase==='park'",170000);
    assert.equal(await js("localStorage.getItem('sundownBay.drives.frankie.wheel')"),"1");
    assert(await js("Math.abs(crew.outing.vehicle.z-123)<15"));
    await tap("KeyG");await choose("Choose on the city map");
    await waitFor("document.querySelector('#panelBody select:not(:disabled)')");
    await js(`const list=document.querySelector('#panelBody select');
      list.value=[...list.options].find(o=>o.textContent==='Bay Cab · Marlin Motel').value;
      list.dispatchEvent(new Event('change'))`);
    await choose("Bay Cab · Marlin Motel");
    await waitFor("crew.outing?.phase==='ride'&&crew.outing.leg.at>9",40000);await tap("KeyE");
    await waitFor("crew.outing?.early");
    await waitFor("!crew.outing&&crew.afternoon.active&&crew.afternoon.phase==='foot'",140000);
    const parked=await js("new BaySecondUnit.Unit().motors.frankie");
    assert.equal(parked.ride,ride);assert(Math.abs(parked.z+43.5)>14);
    assert(await js("drivePhases.has('driver-in')&&drivePhases.has('in')&&drivePhases.has('ride')&&drivePhases.has('park')&&drivePhases.has('out')"));
    await snapshot("curbwalk");
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"two-person handoff, named destination, saved visit, city-map second leg, early stop and shared walk. Audio starts 0, cursor locks 0.");
  } catch (error) {
    console.log("Playtest state",await js(`JSON.stringify({outing:window.crew?.outing?.phase,leg:crew?.outing?.leg?.at,
      active:crew?.afternoon.active,phase:crew?.afternoon.phase,context:document.querySelector('#context').innerText,
      hud:document.querySelector('#objectiveText').textContent,panel:document.querySelector('#panelBody').innerText,seen:[...drivePhases]})`));
    throw error;
  }
};
