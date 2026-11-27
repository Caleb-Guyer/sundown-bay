const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function admission({js,send,tap,key,waitFor,errors,mode}){
  async function snap(label){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-record-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  async function watch(label,condition,seconds){
    const start=Date.now();let next=start+15000;
    while(Date.now()-start<seconds*1000){
      if(label==="response lights")await js(`if(Math.hypot(care.hero.x-62.4,care.hero.z-43.2)>56){
        care.at(care.hero,62.4,43.2,1.23);care.rig.reset(care.hero);}`);
      if(await js(condition))return;
      if(Date.now()>=next){console.log("PERF rescue",mode,label,await js("care.status()"));next+=15000;}
      await new Promise(resolve=>setTimeout(resolve,250));
    }
    throw Error("Timed out watching "+label+" "+await js("care.status()"));
  }
  async function frameCrew(){
    await js(`care.at(care.hero,66.5,43.5,1.23);care.rig.reset(care.hero);
      care.framed=false;requestAnimationFrame(()=>requestAnimationFrame(()=>care.framed=true));`);
    await waitFor("care.framed");
  }
  await js(`window.careQA={};const care=careQA;
    const green=BayOnGreen.Club.prototype.step;BayOnGreen.Club.prototype.step=function(){care.surf=this.sites[0].v;return green.apply(this,arguments);};
    const work=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,env){
      care.service=this;care.hero=env.hero;care.floor=env.ground;return work.apply(this,arguments);};
    const people=BayLocals.animatePeople;BayLocals.animatePeople=function(list){care.people=list;return people.apply(this,arguments);};
    const update=BayCamera.prototype.update;BayCamera.prototype.update=function(){care.rig=this;return update.apply(this,arguments);};
    const clock=BayHours.Clock.prototype.step;BayHours.Clock.prototype.step=function(dt){
      if(!care.clock){care.clock=this;this.wake(1290);}return clock.call(this,dt);};
    const paint=BayRoadLights.Field.prototype.paint;care.sides=new Set();
    BayRoadLights.Field.prototype.paint=function(x,z,s,c,length,spread,rgb,gain,blocks){
      const v=care.service?.v;
      if(!v?.responseLights||spread!==.73||rgb[0]!==142||Math.hypot(v.x-x,v.z-z)>2.5)return paint.apply(this,arguments);
      const col=Math.floor((x+3.5*s-this.left)*this.size/this.span),row=Math.floor((this.north-z-3.5*c)*this.size/this.span);
      const i=(row*this.size+col)*4,was=this.pixels[i];
      paint.apply(this,arguments);
      if(col>=0&&row>=0&&col<this.size&&row<this.size&&this.pixels[i]>was+16){
        care.sides.add(Math.sign(s*Math.cos(v.yaw)-c*Math.sin(v.yaw)));
        if(Math.hypot(v.x-care.hero.x,v.z-care.hero.z)<32)care.nearLamps=true;
      }
    };
    care.at=(h,x,z,yaw=0)=>Object.assign(h,{x,z,y:care.floor(x,z),yaw});
    care.status=()=>JSON.stringify({phase:care.service.phase,age:Math.round(care.service.age),
      blocked:Math.round(care.service.blocked),cursor:Math.round(care.service.cursor),length:Math.round(care.service.line?.length),
      xy:[care.service.v.x,care.service.v.z].map(Math.round),speed:Math.round(care.service.v.speed),frames:care.frames,sides:[...care.sides],near:!!care.nearLamps,
      hero:[care.hero.x,care.hero.z].map(Math.round),width:document.querySelector("#world").width,
      panel:document.querySelector("#panel").hidden?"":document.querySelector("#panel").dataset.screen});
    care.frames=0;function sample(){care.frames++;requestAnimationFrame(sample);}requestAnimationFrame(sample);`);
  await waitFor("care.hero&&care.people?.length&&care.rig&&care.service");
  await js(`care.at(care.hero,72,40);care.rig.reset(care.hero);
    care.person=care.people.find(p=>p.name&&!p.onTour&&!p.palmManaged);care.at(care.person,72,46);care.person.wait=80;`);
  await tap("Digit1");await tap("Space");await waitFor("care.service.call.source===care.person");
  const name=await js("care.person.name");await tap("Digit0");
  await js("care.at(care.hero,73.8,45.8)");await tap("KeyH");
  await waitFor("document.querySelector('#objectiveText').textContent.includes('Rescue 4')");
  await js("care.at(care.hero,62.4,43.2,1.48);care.rig.reset(care.hero)");
  try{
    await watch("response lights","care.nearLamps&&care.sides.size===2",145);
    await snap("rescue-lamps");console.log("PASS both Rescue 4 light banks cast red light on the nearby street during its night response",mode);
    await watch("arrival","['scene','rear','sceneRoll','toPatient'].includes(care.service.phase)",150);
    await frameCrew();
    await snap("rescue-curb");
    await watch("stretcher","care.service.cot.occupied&&care.service.phase==='toTruck'",85);
    assert(await js("care.person.down.inCare&&care.service.cot.patient.name===care.person.name"));
    await frameCrew();await snap("rescue-lift");
    await watch("receiving","JSON.parse(localStorage.getItem('sundownBay.v1')||'{}').rescue?.streetSlip",190);
  }catch(err){
    console.log("Playtest state",await js("({phase:care.service.phase,age:care.service.age,blocked:care.service.blocked,xy:[care.service.v.x,care.service.v.z],cot:[care.service.cot.x,care.service.cot.z],call:care.service.call.name,issue:document.querySelector('#toast').innerText,errors:"+JSON.stringify(errors)+"})"));
    await snap("rescue-curb");throw err;
  }
  const record=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).rescue.streetSlip");assert.equal(record.name,name);assert.equal(record.assisted,false);
  await js("care.at(care.hero,BayPalmClinic.site.desk.x,BayPalmClinic.site.desk.z);care.rig.reset(care.hero)");await tap("KeyF");
  await waitFor("document.querySelector('#panelBody').textContent.includes('The Laundry Line')");
  await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.textContent.includes('The Laundry Line')).click()");
  await waitFor("document.querySelector('#chapterTitle').textContent==='The Laundry Line'");
  await waitFor("document.querySelector('#chapterInsert').getAttribute('aria-label')?.includes('Marlin laundry claim')");
  const front=await js("document.querySelector('#chapterInsert').toDataURL()");
  await snap("linen-order");
  await waitFor("document.querySelector('#chapterInsert').getAttribute('aria-label')?.includes('pencilled message')");
  assert.notEqual(await js("document.querySelector('#chapterInsert').toDataURL()"),front);
  await snap("linen-reverse");await tap("Enter");
  await js("care.p=BayClinicLaundry.targets.call;care.at(care.hero,care.p.x-.54,care.p.z+.15);care.rig.reset(care.hero)");
  await waitFor("document.querySelector('#objectiveText').textContent.includes('Hold L')");
  await key("keyDown","KeyL");
  try{await waitFor("document.querySelector('#objectiveText').textContent.includes('Two rings')",15000);}
  finally{await key("keyUp","KeyL");}
  const order="JSON.parse(localStorage.getItem('sundownBay.v1')).rescue.laundry";
  await waitFor(order+".stage==='collect'");
  await js("care.p=BayClinicLaundry.targets.collect;care.at(care.hero,care.p.x-3.3,care.p.z);care.rig.reset(care.hero);care.surfBay={x:care.surf.x,z:care.surf.z};Object.assign(care.surf,{x:151.6,z:-31})");
  await waitFor("document.querySelector('#context kbd')?.textContent==='F' && document.querySelector('#context').textContent.includes('Take the parcel from Romy  ·  E  Take SURF 13')");
  await snap("linen-curb");await tap("KeyF");
  await waitFor(order+".stage==='return'");await snap("linen-parcel");
  assert.equal(await js("care.surf.owner.phase"),"drive");await js("Object.assign(care.surf,care.surfBay)");
  await send("Page.reload");await waitFor("!window.careQA&&document.readyState==='complete'&&typeof BayRescue==='object'");
  await js(`window.linenQA={};const old=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){linenQA.h=e.hero;return old.apply(this,arguments);};
    document.querySelector('#play').click();`);
  await waitFor("linenQA.h&&document.querySelector('#objectiveTag').textContent.includes('The Laundry Line')");
  await js("Object.assign(linenQA.h,BayPalmClinic.site.desk)");await tap("KeyF");
  await waitFor("document.querySelector('#chapterTitle').textContent==='One shirt, one comb'");
  await waitFor("!document.querySelector('#chapterInsert').hidden&&document.querySelector('#chapterInsert').getAttribute('aria-label')?.endsWith('filed')");
  assert.equal(await js("document.querySelector('#chapterTitle').textContent"),"");
  assert.equal((await js(order)).patient,name);await snap("linen-received");await tap("Enter");
  assert.equal((await js(order)).stage,"filed");
  console.log("PASS rang the laundry from the Marlin cab phone, took Romy's parcel, resumed delivery after reload and signed the same patient's tag at Palm County",mode);
  await send("Page.reload");await waitFor("!window.linenQA&&document.readyState==='complete'&&typeof BayRescue==='object'");
  assert.deepEqual(await js("BayRescue.read(JSON.parse(localStorage.getItem('sundownBay.v1')).rescue).streetSlip"),record);
  await js(`window.doorQA={};const racer=BayOnGreen.Club.prototype.step;
    BayOnGreen.Club.prototype.step=function(dt,t,v){doorQA.hatch=this.sites[0].v;doorQA.driver=v;return racer.apply(this,arguments);};
    const rescue=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){doorQA.hero=e.hero;return rescue.apply(this,arguments);};
    document.querySelector('#play').click();`);
  await waitFor("doorQA.hatch&&doorQA.hero");
  assert.equal(await js("doorQA.hatch.plate"),"SURF 13");
  assert(await js("BayDriving.clearance(doorQA.hatch,BayClinicLaundry.targets.collect)>4"));
  await js("Object.assign(doorQA.hatch,{x:151.6,z:-31});Object.assign(doorQA.hero,{x:150.5,z:-30.6})");await tap("KeyE");
  await waitFor("doorQA.hatch.owner.phase==='out'");await snap("surf-door");
  await waitFor("doorQA.driver===doorQA.hatch&&doorQA.hatch.owner.displaced&&!doorQA.hatch.owner.ride",20000);
  const at=await js("doorQA.hatch.z");await key("keyDown","KeyW");
  try{await waitFor("doorQA.hatch.z>"+(at+1.5));}finally{await key("keyUp","KeyW");}
  console.log("PASS took Lena’s parked SURF 13 through the door, left her on the sidewalk and drove it",mode);
  assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
  console.log("PASS flagged Rescue 4, saw the ambulance and occupied stretcher, received the same named walker at the clinic and retained the street slip after reload",mode,name);
};
