const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,waitFor:wait,tap,key,send,mode,errors})=>{
  async function waitFor(condition,timeout){
    try{await wait(condition,timeout);}
    catch(error){
      const state=await js(`(()=>{const q=window.airQA||{},a=q.air,c=q.car;
        return {heat:q.heat,car:c&&[c.kind,c.x,c.z,c.speed],blocker:q.blocker&&[q.blocker.x,q.blocker.z],
          air:a&&[a.x,a.z,a.sees,a.lit],hits:q.hits,encounter:q.encounter,samples:q.reel?.take?.samples?.length,context:document.querySelector('#context')?.textContent,
          panel:document.querySelector('#panelBody')?.textContent?.slice(0,220),
          roads:typeof roadsQA==="undefined"?null:{car:roadsQA.driver?.kind,hand:roadsQA.crew?.hand,assigned:roadsQA.crew?.assigned,
            cones:roadsQA.crew?.site?.cones.map(c=>c.by),hero:[roadsQA.hero?.x,roadsQA.hero?.z]}};})()`);
      console.log("Playtest state",JSON.stringify(state));throw error;
    }
  }
  async function snap(name){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:90}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-record-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  const book="JSON.parse(localStorage.getItem(BayCurbWire.key)||'{}')";
  await js(`window.airQA={};const q=airQA;
    const rescue=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){q.h=e.hero;return rescue.apply(this,arguments);};
    const crowd=BayLocals.animatePeople;BayLocals.animatePeople=function(p,dt,driver,all){q.car=driver;q.cars=all;return crowd.apply(this,arguments);};
    const fly=BayBackup.prototype.fly;BayBackup.prototype.fly=function(level){q.heat=level;const r=fly.apply(this,arguments);q.air=this.air;return r;};
    const bump=BayCurbWire.Column.prototype.bump;q.hits=0;
    BayCurbWire.Column.prototype.bump=function(){q.hits++;return bump.apply(this,arguments);};
    const tape=BayCurbWire.AirReel.prototype.step;BayCurbWire.AirReel.prototype.step=function(){q.reel=this;return tape.apply(this,arguments);};
    q.place=(v,x,z)=>{BayDriving.settle(v);Object.assign(v,{x,z,yaw:0});};true`);
  await waitFor("q.h&&q.cars?.length");await js("Object.assign(q.h,{x:151,z:-27});true");await tap("KeyE");
  await waitFor("q.car?.kind==='coupe'",22000);
  await js("q.parked=q.cars.filter(v=>v!==q.car&&!v.path&&!v.serviceCar&&!v.meetCar&&!v.guestId&&['coupe','hatch','cab','van'].includes(v.kind));q.home=q.parked.map(v=>({x:v.x,z:v.z,yaw:v.yaw}));true");
  // Keep the last three impacts on a single stretch of the coastal road. After
  // dispatch the coupe drives on from the sighting the helicopter actually got.
  await js(`const blocks=[[72,74],[0,-55],[-72,65],[144,32],[144,52],[144,74],[144,95],[144,110]];
    q.encounter=0;q.cruising=true;let before=-1,dispatched=false;
    function throttle(on){if(on===!!q.throttle)return;q.throttle=on;dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:'KeyW',key:'w'}));}
    requestAnimationFrame(function driveRoute(){
      if(!q.cruising||!q.car){throttle(false);return;}
      if(dispatched){throttle(q.car.speed<8);}
      else if(q.heat===5){
        q.parked.forEach((v,i)=>{BayDriving.settle(v);Object.assign(v,q.home[i]);});
        q.place(q.car,q.car.x,q.car.z);q.car.speed=q.car.vz=8;dispatched=true;throttle(false);
      }else if(q.hits!==before&&q.encounter<blocks.length){
        before=q.hits;
        const i=q.encounter++,[x,z]=blocks[i];q.blocker=q.parked[i%q.parked.length];
        q.place(q.blocker,x,z);q.place(q.car,x,z-13);q.car.vz=q.car.speed=15;throttle(true);
      }
      requestAnimationFrame(driveRoute);
    });true`);
  try{
    await waitFor("q.heat===5",30000);
    await waitFor("q.reel?.take?.samples.length>=9",30000);
  }
  finally{await js("q.cruising=false");await key("keyUp","KeyW");}
  assert.equal(await js(book+".air||null"),null);await snap("air-contact");
  await js("q.place(q.car,-144,-110);true");
  await waitFor(book+".air?.type==='air'",75000);
  const clip=await js(book+".air");assert(clip.frames.every(f=>f[1][0]>0));
  assert(clip.flight.length===clip.frames.length&&clip.flight.some(p=>p[2]!==clip.flight[0][2]));
  await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayCurbWire==='object'&&!window.airQA");
  await js("document.querySelector('#play').click()");await tap("KeyJ");
  const btn=label=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.textContent.includes("+JSON.stringify(label)+"))";
  await waitFor(btn("On the Curb"));await js(btn("On the Curb")+".click()");
  if(!await js("document.querySelector('canvas.curb-film')?.getAttribute('aria-label').includes('Last Seen')"))await js(btn("Last Seen · Air One")+".click()");
  await waitFor("document.querySelector('canvas.curb-film')?.getAttribute('aria-label').includes('Last Seen')");
  await js("const s=document.querySelector('.curb-transport input');s.value=(+s.max*.47);s.dispatchEvent(new Event('input'));true");
  await snap("air-replay");
  await js("s.value=s.max;s.dispatchEvent(new Event('input'));true");await snap("air-last-visual");
  await js(btn("Last place on camera")+".click()");assert.equal(await js(book+".air.id"),clip.id);
  // Reload restored the same closure that was left by the pursuit above.
  const roads="JSON.parse(localStorage.getItem(BayLastCone.key)).site";
  const site=await js(roads);assert.equal(site.cones.length,4);assert(site.street);
  await js(`const roadsQA={};const moveCrew=BayLastCone.Crew.prototype.step;
    BayLastCone.Crew.prototype.step=function(){roadsQA.crew=this;return moveCrew.apply(this,arguments);};
    const paramedic=BayRescue.Service.prototype.step;
    BayRescue.Service.prototype.step=function(dt,e){roadsQA.hero=e.hero;return paramedic.apply(this,arguments);};
    const crowdStep=BayLocals.animatePeople;
    BayLocals.animatePeople=function(people,dt,driver){roadsQA.driver=driver;return crowdStep.apply(this,arguments);};
    const coneHint=BayLastCone.Crew.prototype.hint;
    BayLastCone.Crew.prototype.hint=function(p){roadsQA.onFoot=true;return coneHint.call(this,p);};
    true`);
  await waitFor("roadsQA.hero&&roadsQA.crew&&Object.hasOwn(roadsQA,'driver')",20000);
  if(await js("!!roadsQA.driver")){
    await js("BayDriving.settle(roadsQA.driver);true");await tap("KeyE");
    await waitFor("!roadsQA.driver&&!document.querySelector('#context').textContent.includes('Step out')",16000);
  }
  await waitFor("roadsQA.onFoot",16000);
  await js(`const rc=roadsQA.crew,h=roadsQA.hero,r=rc.site.rack;
    Object.assign(h,{x:r.x,z:r.z});true`);
  await waitFor("!document.querySelector('#game').classList.contains('in-chapter')");
  for(let attempt=0;attempt<4;attempt++){
    const id=await js("rc.nearest(r,40)");if(id<0)break;
    await js("Object.assign(h,{x:rc.site.cones["+id+"].x,z:rc.site.cones["+id+"].z});true");
    await waitFor("document.querySelector('#context').textContent.includes('Pick up the cone')");
    await tap("KeyL");await waitFor("rc.hand==="+id);
    if(attempt===0){
      await js("Object.assign(h,BayDriving.world(r,0,4.5));true");
      await key("keyDown","KeyL");
      await js(`requestAnimationFrame(function aim(){
        if(rc.charge===null)return;
        if(rc.range()<Math.hypot(h.x-r.x,h.z-r.z)-.27){requestAnimationFrame(aim);return;}
        dispatchEvent(new KeyboardEvent("keyup",{code:"KeyL",key:"l"}));
      });true`);
      await waitFor("rc.site.cones["+id+"].by==='player'",16000);await key("keyUp","KeyL");
      await snap("county-cart");
    }else{
      await js("Object.assign(h,BayDriving.world(r,-.8,.2));true");await tap("KeyL");
      await waitFor("rc.site.cones["+id+"].by==='player'");
    }
  }
  await waitFor("rc.site.cones.every(c=>c.by!=='ground')",65000);
  assert(await js("rc.book.best>=3.5&&JSON.parse(localStorage.getItem('sundownBay.v1')).threads.owned.includes('roadcrew')"));
  await js("Object.assign(h,{x:rc.worker.x+.4,z:rc.worker.z+.65});true");await tap("KeyF");
  await waitFor("document.querySelector('#game').classList.contains('in-chapter')");await snap("county-wrap");
  await waitFor("document.querySelector('#chapterLine').textContent.includes('vest on the handle')");await snap("county-inez");
  await waitFor("!document.querySelector('#game').classList.contains('in-chapter')",22000);
  console.log("PASS actual pursuit closure, saved city worksite, timed cone toss, lane reopening, wardrobe reward and cinematic",mode,site.street);
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS five-star collision pursuit, moving Air One camera, escaped search, archived replay, scrub and last-seen map pin",mode,clip.frames.length);
};
