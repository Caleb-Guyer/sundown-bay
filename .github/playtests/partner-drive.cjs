const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

module.exports = async ({js, send, waitFor, tap, errors, mode}) => {
  const cheapSeats=process.argv.includes("--cheap-seats"),guest=cheapSeats&&mode==="overhead";
  // Load a returning pair at the Marlin curb through the game's normal save reader.
  await js(`(() => {
    const u=new BaySecondUnit.Unit();
    u.met=true;u.lead=${guest?'"frankie"':'"guest"'};u.remember(BaySecondUnit.home.guest,null,u.lead);
    u.remember({x:152,z:-25,yaw:0},null,u.other);u.save();
  })()`);
  await send("Page.reload");
  await waitFor("document.readyState==='complete' && typeof BayWindowSeat==='object'");
  await js(`window.drivePhases=new Set();
    const paintRadar=drawBayMap;
    window.drawBayMap=function(ctx,o){
      if(o.mode==='radar'&&o.crew){
        window.crew=o.crew;window.radar=o;
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
    if(cheapSeats){
      const who=guest?"guest":"frankie",memory="BayOffClock.cheapSeats."+who;
      await tap("KeyG");await choose("The Cheap Seats");await waitFor("radar.target?.kind==='cheap-seats'");
      await js(`{
        const dest=${memory},v=crew.afternoon.vehicle;
        Object.assign(v,{x:dest.x+(dest.x<50?-2.3:2.3),z:dest.z+(dest.x<50?-21:21),yaw:dest.x<50?0:Math.PI});
        BayDriving.settle(v);
        const driver=(${require("./road-driver.cjs").toString()}),line=BayRescue.track([{x:v.x,z:v.z},dest]),held=new Set();
        window.memoryTest={distance:0,lead:0};let prev={x:v.x,z:v.z};
        function advance(){
          memoryTest.distance+=Math.hypot(v.x-prev.x,v.z-prev.z);prev={x:v.x,z:v.z};
          memoryTest.lead=Math.max(memoryTest.lead,Math.hypot(radar.cx-radar.player.x,radar.cz-radar.player.z));
          const close=Math.hypot(dest.x-v.x,dest.z-v.z)<4&&Math.abs(v.speed)<.6;
          const wanted=new Set(close?[]:driver(v,line,dest,true,radar.cars).filter(k=>k!=='park'));
          for(const k of held)if(!wanted.has(k)){dispatchEvent(new KeyboardEvent('keyup',{code:k,bubbles:true}));held.delete(k);}
          for(const k of wanted)if(!held.has(k)){dispatchEvent(new KeyboardEvent('keydown',{code:k,bubbles:true}));held.add(k);}
          if(close)memoryTest.done=true;else requestAnimationFrame(advance);
        }requestAnimationFrame(advance);
      }`);
      await waitFor("memoryTest.done&&document.querySelector('#context').innerText.includes('Cheap Seats')",55000);
      assert(await js("memoryTest.distance>15&&memoryTest.lead>1"));
      assert(await js("Math.cos(radar.rotation-radar.streetCar.yaw)>.95"));
      await tap("KeyF");await waitFor("!document.querySelector('#chapterFilm').hidden");
      await snapshot("cheap-seats");await waitFor("document.querySelector('#chapterFilm').hidden",65000);
      assert.equal(await js("localStorage.getItem('sundownBay.cheapSeats."+who+"')"),"1");
      assert.equal(await js("crew.afternoon.vehicle.garageKey"),ride);assert(await js("crew.afternoon.seated"));
      assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
      console.log("PASS",mode,"The Cheap Seats",who,"steered to the marked curb, watched the passenger scene and kept the memory and car. Muted, no lock.",await js("memoryTest"));
      return;
    }
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
