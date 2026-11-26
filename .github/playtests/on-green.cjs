const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const oceanDriver=require("./ocean-driver.cjs");
module.exports=async({js,send,key,tap,waitFor,mode,errors})=>{
  const delay=ms=>new Promise(r=>setTimeout(r,ms)),held=new Set();
  async function controls(...next){
    for(const k of held)if(!next.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of next)if(!held.has(k)){await key("keyDown",k);held.add(k);}
  }
  async function snap(label){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:90});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  const manual=process.argv.includes("--manual");
  const observer=`
    window.driverSeen=window.finishSeen=window.onGreen=false;
    const drawMap=window.drawBayMap;window.drawBayMap=function(c,o){
      if(o.mode==="radar"&&o.green){window.club=o.green;window.ride=o.streetCar;window.site=club.sites[0];window.traffic=o.cars;}
      return drawMap(c,o);
    };
    const pass=BayOnGreen.Club.prototype.step;BayOnGreen.Club.prototype.step=function(dt,t,...rest){
      const event=pass.call(this,dt,t,...rest);
      if(${manual}&&this.run?.phase==="running"&&!event){
        const p=rest[0];
        if(p.gear<5&&BayDriving.powerBand(BayDriving.engineRpm(p))){
          dispatchEvent(new KeyboardEvent("keydown",{code:"Quote",bubbles:true,cancelable:true}));
          dispatchEvent(new KeyboardEvent("keyup",{code:"Quote",bubbles:true}));
        }
      }
      if(event==="go")window.onGreen=BayCrosswalk.lamps(this.run.s.signal,t)==="ns";
      return event;
    };
    if(${manual}){
      window.cabinPaints=window.shiftPaints=0;
      const seat=window.BayDriversSeat;
      const capture=v=>{if(v.manual){++cabinPaints;if(v.gateTime>0)++shiftPaints;}};
      window.BayDriversSeat={...seat,draw(...a){capture(a[2]);return seat.draw(...a);},compact(...a){capture(a[1]);return seat.compact(...a);}};
    }
    const art=BayOnGreenArt;window.BayOnGreenArt={...art,
      car(...a){if(a[2].greenId==="ocean"&&a[4]>.1)driverSeen=true;return art.car(...a);},
      carMap(...a){if(a[4].greenId==="ocean"&&a[5]>.1)driverSeen=true;return art.carMap(...a);},
      finish(...a){if(a[3]==="ocean"&&a[4]>0&&a[5]>1)finishSeen=true;return art.finish(...a);},
      finishMap(...a){if(a[5]==="ocean"&&a[6]>0&&a[7]>1)finishSeen=true;return art.finishMap(...a);}
    };
  `;
  async function lineUp(){
    let q;const deadline=Date.now()+65000;
    while(Date.now()<deadline){
      q=await js("({d:BayOnGreen.line-ride.z,v:ride.speed,x:ride.x,stage:club.run?.phase,heat:document.querySelector('#stars').getAttribute('aria-label')})");
      if(Math.abs(q.d)<1.3&&Math.abs(q.v)<.55){await controls();return;}
      const target=Math.abs(q.d)<.70?0:Math.sign(q.d)*Math.min(4.3,Math.sqrt(5*Math.abs(q.d)));
      if(q.v<target-.35)await controls("KeyW");else if(q.v>target+.35)await controls("KeyS");else await controls();
      await delay(55);
    }
    throw Error("Waiting for the grid "+JSON.stringify(q));
  }
  try{
    await js(observer);await waitFor("window.site");await tap("KeyE");await waitFor("!!window.ride",35000);
    if(manual){
      await controls("ShiftLeft");await tap("KeyZ");await controls();await tap("KeyZ");
      await waitFor("ride.manual&&window.cabinPaints>0&&document.querySelector('#speed .five-speed')",35000);
    }
    await lineUp();await waitFor("club.run?.phase==='offer'");await tap("KeyH");
    await waitFor("club.run?.phase==='armed'&&driverSeen",130000);
    const staged=await js("({x:site.v.x,z:site.v.z,dx:Math.abs(ride.x-site.v.x),gap:Math.abs(ride.z-site.v.z)})");
    assert(staged.dx>2&&staged.dx<5.6&&staged.gap<3.1,JSON.stringify(staged));await snap("grid");
    const brakeLaunch=process.argv.includes("--brake-launch");
    if(brakeLaunch)await controls("KeyS","KeyW");
    await waitFor("club.run?.phase==='running'&&onGreen",210000);
    if(brakeLaunch){
      await waitFor("club.run.clock>.24&&ride.burn>.6");
      assert.equal(await js("club.run.react"),null);assert(Math.abs(await js("ride.speed"))<.5);
    }
    const returnLap=process.argv.includes("--return-lap");
    if(returnLap||manual){
      await controls();
      await js(`window.oceanKeys=(${oceanDriver.toString()});window.driveOcean=function(leg,end){
        const pressed=new Set(),memory={raceSpeed:${manual?17:11.5}};
        function drive(){
          const v=ride,done=leg==='race'?club.run?.phase!=='running':v.x>154.2&&Math.abs(v.speed)<.3;
          const next=done?[]:oceanKeys(v,leg,end,traffic,memory);
          for(const k of pressed)if(!next.includes(k)){dispatchEvent(new KeyboardEvent('keyup',{code:k,bubbles:true}));pressed.delete(k);}
          for(const k of next)if(!pressed.has(k)){dispatchEvent(new KeyboardEvent('keydown',{code:k,bubbles:true,cancelable:true}));pressed.add(k);}
          if(done){if(leg==='curb')window.curbParked=true;return;}
          requestAnimationFrame(drive);
        }
        drive();
      };driveOcean('race',0);`);
    }else await controls("KeyW");
    await waitFor("!club.run||JSON.parse(localStorage.getItem('sundownBay.v1')||'{}').green?.cards?.ocean?.runs===1",165000);
    assert(await js("JSON.parse(localStorage.getItem('sundownBay.v1')||'{}').green?.cards?.ocean?.runs===1"),"Race ended before the player's bumper reached the clock");
    await controls("KeyS");await waitFor("Math.abs(ride.speed)<1.5",40000);await controls();
    assert(await js("finishSeen"));const card=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).green.cards.ocean");
    assert(["first","second"].includes(card.slip.result)&&card.slip.time>1&&card.slip.reaction>=0);assert.equal(card.runs,1);
    if(brakeLaunch)assert(card.slip.reaction>=.24&&card.slip.toThirty>.4&&card.slip.toThirty<3.8&&["cold","ready","hot"].includes(card.slip.launch));
    if(process.argv.includes("--return-lap")){
      // The finish is on an open street. Pull onto the apron by the clock so
      // the player's car leaves both the crossing and its exit usable.
      await js("driveOcean('curb',ride.z+9)");
      await waitFor("window.curbParked&&ride.x>154.2",75000);
    }
    if(!manual)await waitFor("!site.runOut&&(!site.out||Math.hypot(site.v.x-"+staged.x+",site.v.z-("+staged.z+"))>48)",90000);
    if(process.argv.includes("--return-lap")){
      await waitFor("!site.out&&!site.v.path&&Math.hypot(site.v.x-site.route.home.x,site.v.z-site.route.home.z)<.15",300000);
      assert(await js("club.challenge({...site.route.grid,speed:0})===site"));
      console.log("PASS",mode,"Lena drove the full return circuit in live city traffic and parked at the starting light for a rematch.");
    }
    await tap("KeyJ");await js("[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('On Green · Timing slips')).click()");
    await waitFor("document.querySelector('.green-slip .slip-time')?.textContent.includes(' s')");await snap("slip");
    const paper=await js("document.querySelector('.green-slip').innerText");assert(paper.includes(card.slip.plate)&&paper.includes("Lena Ríos"));
    if(manual){
      assert(card.autograph&&card.signed&&card.manualBest===card.slip.time,JSON.stringify(card.slip.manual));
      assert.deepEqual(card.autograph.marks,card.slip.manual.slice(0,2));
      assert(paper.includes("SHIFT RECORDER")&&paper.includes("Third by the sign"));
      assert(await js("shiftPaints>0"),"No shift was rendered in the driver's seat");
      await js("[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('Room on the Fridge')).click()");
      await waitFor("document.querySelector('#chapterTitle').textContent==='Room on the Fridge'");
      await waitFor("document.querySelector('#chapterLine').textContent.includes('Dad did this stretch')",35000);
      assert((await js("document.querySelector('#chapterLine').textContent")).includes(card.autograph.plate));
      await snap("fridge");await tap("Enter");await tap("KeyJ");
      await js("[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('On Green · Timing slips')).click()");
    }
    if(brakeLaunch)assert(paper.includes("0–30 MPH")&&paper.includes(card.slip.toThirty.toFixed(2)));
    await js("[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('View replay')).click()");
    await waitFor("!!document.querySelector('.timing-film-controls input')");
    const last=card.slip.film.shots.at(-1),k=card.slip.result==="first"?1:4;
    const half=await js("bayCarLayout("+JSON.stringify(k===1?card.slip.film.kind:"hatch")+").halfLength");
    assert(Math.abs(last[k]+half*Math.cos(last[k+2]))<.02);
    const endImage=await js("document.querySelector('.timing-film').toDataURL()");await snap("beam");
    await js("document.querySelector('.timing-film-controls button').click()");
    await waitFor("Number(document.querySelector('.timing-film-controls input').value)>30&&Number(document.querySelector('.timing-film-controls input').value)<940");
    await js("document.querySelector('.timing-film-controls button').click()");
    assert.notEqual(await js("document.querySelector('.timing-film').toDataURL()"),endImage);
    assert.equal(await js("audioStarts+cursorRequests"),0);
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayOnGreen==='object'");
    const restored=await js("BayOnGreen.read(JSON.parse(localStorage.getItem('sundownBay.v1')).green).cards.ocean");
    assert.equal(restored.best,card.slip.time);assert.deepEqual(restored.slip.film.shots,card.slip.film.shots);
    if(manual){
      assert.deepEqual(restored.autograph,card.autograph);
      await js("document.querySelector('#play').click()");await js(observer);await waitFor("window.site");
      await tap("KeyE");await waitFor("window.ride?.manual&&document.querySelector('#speed .five-speed')",35000);
      console.log("PASS",mode,"manual selector restored on the starter car; signed slip and kitchen cutscene verified.",JSON.stringify(card.autograph));
    }
    if(brakeLaunch){assert.equal(restored.slip.toThirty,card.slip.toThirty);console.log("Brake release",restored.slip.reaction.toFixed(2),"s, 0–30 mph",restored.slip.toThirty.toFixed(2),"s on",restored.slip.launch,"rear tires. Audio starts 0, cursor locks 0.");}
    assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
    console.log("PASS live",mode,"drove from the Marlin, staged alongside the numbered hatch, launched on the working green, crossed the timing clock and recovered the printed slip after reload.",card.slip.result,card.slip.time.toFixed(2));
  }catch(error){
    const state=await js("window.site&&({stage:club.run?.phase,driver:ride&&[ride.x,ride.z,ride.speed],rival:[site.v.x,site.v.z,site.v.speed,site.v.corner,site.v.blocked],returning:site.out,through:!!site.runOut,waiting:site.v.leftWait&&[site.v.leftWait.held,site.v.leftWait.committed,site.v.leftWait.turn.junction],near:traffic.filter(v=>v!==site.v&&Math.hypot(v.x-site.v.x,v.z-site.v.z)<28).map(v=>[v.id,v.kind,v.x,v.z,v.yaw,v.speed,v.blocked,v.leftWait?.held,v.leftWait?.committed])})").catch(()=>null);
    throw Error(error.message+" · timing camera state "+JSON.stringify(state),{cause:error});
  }finally{await controls();}
};
