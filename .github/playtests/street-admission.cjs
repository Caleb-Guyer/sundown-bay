const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function admission({js,send,tap,waitFor,errors,mode}){
  async function snap(label){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-record-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  async function watch(label,condition,seconds){
    const start=Date.now();let next=start+15000;
    while(Date.now()-start<seconds*1000){
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
    const work=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,env){
      care.service=this;care.hero=env.hero;care.floor=env.ground;return work.apply(this,arguments);};
    const people=BayLocals.animatePeople;BayLocals.animatePeople=function(list){care.people=list;return people.apply(this,arguments);};
    const update=BayCamera.prototype.update;BayCamera.prototype.update=function(){care.rig=this;return update.apply(this,arguments);};
    care.at=(h,x,z,yaw=0)=>Object.assign(h,{x,z,y:care.floor(x,z),yaw});
    care.status=()=>JSON.stringify({phase:care.service.phase,age:Math.round(care.service.age),
      blocked:Math.round(care.service.blocked),cursor:Math.round(care.service.cursor),length:Math.round(care.service.line?.length),
      xy:[care.service.v.x,care.service.v.z].map(Math.round),speed:Math.round(care.service.v.speed),frames:care.frames,
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
  await send("Page.reload");await waitFor("!window.careQA&&document.readyState==='complete'&&typeof BayRescue==='object'");
  assert.deepEqual(await js("BayRescue.read(JSON.parse(localStorage.getItem('sundownBay.v1')).rescue).streetSlip"),record);
  assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
  console.log("PASS flagged Rescue 4, saw the ambulance and occupied stretcher, received the same named walker at the clinic and retained the street slip after reload",mode,name);
};
