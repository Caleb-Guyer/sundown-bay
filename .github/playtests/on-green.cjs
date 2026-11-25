const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
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
  const observer=`
    window.driverSeen=window.finishSeen=window.onGreen=false;
    const drawMap=window.drawBayMap;window.drawBayMap=function(c,o){
      if(o.mode==="radar"&&o.green){window.club=o.green;window.ride=o.streetCar;window.site=club.sites[0];window.traffic=o.cars;}
      return drawMap(c,o);
    };
    const pass=BayOnGreen.Club.prototype.step;BayOnGreen.Club.prototype.step=function(dt,t,...rest){
      const event=pass.call(this,dt,t,...rest);
      if(event==="go")window.onGreen=BayCrosswalk.lamps(this.run.s.signal,t)==="ns";
      return event;
    };
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
    await controls("KeyW");
    if(process.argv.includes("--return-lap"))await js(`(()=>{
      const pressed=new Set();let target=null;
      function steer(){
        const race=window.club.run?.phase==='running',v=window.ride;
        if(v&&v.z>7&&target===null)target=traffic.some(q=>q!==site.v&&q.z>20&&q.z<62&&Math.abs(q.x-146.45)<1.95&&q.speed<15)?144.0:146.45;
        const goal=v&&target!==null?Math.max(-.25,Math.min(.25,(target-v.x)*.17)):0;
        const delta=v?Math.atan2(Math.sin(goal-v.yaw),Math.cos(goal-v.yaw)):0;
        for(const [code,side] of [['KeyA',-1],['KeyD',1]]){
          const want=race&&target!==null&&delta*side>.027;
          if(want&&!pressed.has(code)){pressed.add(code);dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true,cancelable:true}));}
          if(!want&&pressed.delete(code))dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
        }
        if(race)requestAnimationFrame(steer);
      }
      steer();
    })()`);
    await waitFor("JSON.parse(localStorage.getItem('sundownBay.v1')||'{}').green?.cards?.ocean?.runs===1",45000);
    await controls("KeyS");await waitFor("Math.abs(ride.speed)<1.5",40000);await controls();
    assert(await js("finishSeen"));const card=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).green.cards.ocean");
    assert(["first","second"].includes(card.slip.result)&&card.slip.time>1&&card.slip.reaction>=0);assert.equal(card.runs,1);
    if(brakeLaunch)assert(card.slip.reaction>=.24&&card.slip.toThirty>.4&&card.slip.toThirty<3.8&&["cold","ready","hot"].includes(card.slip.launch));
    if(process.argv.includes("--return-lap")){
      // The finish is on an open street. Pull over beyond the parked coupe so
      // the player's car leaves both the crossing and its exit usable.
      await js(`(()=>{const held=new Set(),end=Math.max(118,ride.z+12);window.curbParked=false;
        function keyboard(next){
          for(const k of held)if(!next.includes(k)){dispatchEvent(new KeyboardEvent('keyup',{code:k,bubbles:true}));held.delete(k);}
          for(const k of next)if(!held.has(k)){dispatchEvent(new KeyboardEvent('keydown',{code:k,bubbles:true,cancelable:true}));held.add(k);}
        }
        function drive(){
          const v=ride,lane=v.z<99?146.7:150.65,aim=Math.max(-.37,Math.min(.37,(lane-v.x)*.21));
          const delta=Math.atan2(Math.sin(aim-v.yaw),Math.cos(aim-v.yaw));
          const speed=Math.min(7.5,Math.sqrt(Math.max(0,5*(end-v.z)))),next=[];
          if(v.z>end-1&&Math.abs(v.speed)<.5){keyboard([]);window.curbParked=true;return;}
          if(v.speed<speed-.35)next.push('KeyW');if(v.speed>speed+.25)next.push('KeyS');
          if(Math.abs(delta)>.025)next.push(delta>0?'KeyD':'KeyA');keyboard(next);requestAnimationFrame(drive);
        }
        drive();
      })()`);
      await waitFor("curbParked&&ride.x>149.5",75000);
    }
    await waitFor("!site.runOut&&(!site.out||Math.hypot(site.v.x-"+staged.x+",site.v.z-("+staged.z+"))>48)",90000);
    if(process.argv.includes("--return-lap")){
      await waitFor("!site.out&&!site.v.path&&Math.hypot(site.v.x-site.route.home.x,site.v.z-site.route.home.z)<.15",300000);
      assert(await js("club.challenge({...site.route.grid,speed:0})===site"));
      console.log("PASS",mode,"Lena drove the full return circuit in live city traffic and parked at the starting light for a rematch.");
    }
    await tap("KeyJ");await js("[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('On Green · Timing slips')).click()");
    await waitFor("document.querySelector('.green-slip .slip-time')?.textContent.includes(' s')");await snap("slip");
    const paper=await js("document.querySelector('.green-slip').innerText");assert(paper.includes(card.slip.plate)&&paper.includes("Lena Ríos"));
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
    if(brakeLaunch){assert.equal(restored.slip.toThirty,card.slip.toThirty);console.log("Brake release",restored.slip.reaction.toFixed(2),"s, 0–30 mph",restored.slip.toThirty.toFixed(2),"s on",restored.slip.launch,"rear tires. Audio starts 0, cursor locks 0.");}
    assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
    console.log("PASS live",mode,"drove from the Marlin, staged alongside the numbered hatch, launched on the working green, crossed the timing clock and recovered the printed slip after reload.",card.slip.result,card.slip.time.toFixed(2));
  }catch(error){
    const state=await js("window.site&&({stage:club.run?.phase,driver:ride&&[ride.x,ride.z,ride.speed],rival:[site.v.x,site.v.z,site.v.speed,site.v.corner,site.v.blocked],returning:site.out,through:!!site.runOut,waiting:site.v.leftWait&&[site.v.leftWait.held,site.v.leftWait.committed,site.v.leftWait.turn.junction],near:traffic.filter(v=>v!==site.v&&Math.hypot(v.x-site.v.x,v.z-site.v.z)<28).map(v=>[v.id,v.kind,v.x,v.z,v.yaw,v.speed,v.blocked,v.leftWait?.held,v.leftWait?.committed])})").catch(()=>null);
    throw Error(error.message+" · timing camera state "+JSON.stringify(state),{cause:error});
  }finally{await controls();}
};
