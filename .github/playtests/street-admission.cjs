const assert=require("node:assert/strict");
module.exports=async function admission({js,send,tap,waitFor,snap,errors,mode}){
  await send("Page.reload");await waitFor("!window.impactQA&&document.readyState==='complete'&&typeof BayRescue==='object'");
  await js(`window.careQA={};const care=careQA;
    const work=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,env){
      care.service=this;care.hero=env.hero;care.floor=env.ground;const out=work.apply(this,arguments);return out;};
    const people=BayLocals.animatePeople;BayLocals.animatePeople=function(list){care.people=list;return people.apply(this,arguments);};
    const update=BayCamera.prototype.update;BayCamera.prototype.update=function(){care.rig=this;return update.apply(this,arguments);};
    care.at=(h,x,z,yaw=0)=>Object.assign(h,{x,z,y:care.floor(x,z),yaw});`);
  await js("document.querySelector('#play').click()");
  await waitFor("care.hero&&care.people?.length&&care.rig&&care.service");
  await js(`care.at(care.hero,72,40);care.rig.reset(care.hero);
    care.person=care.people.find(p=>p.name&&!p.onTour&&!p.palmManaged);care.at(care.person,72,46);care.person.wait=80;`);
  await tap("Digit1");await tap("Space");await waitFor("care.service.call.source===care.person");
  const name=await js("care.person.name");await tap("Digit0");
  await js("care.at(care.hero,73.8,45.8)");await tap("KeyH");
  await waitFor("document.querySelector('#objectiveText').textContent.includes('Rescue 4')");
  await js("care.at(care.hero,62.4,43.2,1.48);care.rig.reset(care.hero)");
  try{
    await waitFor("care.service.phase==='rear'||care.service.phase==='sceneRoll'||care.service.phase==='toPatient'",130000);
    await js("care.at(care.hero,66.5,43.5,1.23);care.rig.reset(care.hero)");
    await snap("rescue-curb");
    await waitFor("care.service.cot.occupied&&care.service.phase==='toTruck'",80000);
    assert(await js("care.person.down.inCare&&care.service.cot.patient.name===care.person.name"));
    await snap("rescue-lift");
    await waitFor("JSON.parse(localStorage.getItem('sundownBay.v1')||'{}').rescue?.streetSlip",180000);
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
