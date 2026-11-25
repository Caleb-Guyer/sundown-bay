const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function streetAction({js,send,waitFor,key,tap,mode,errors}){
  async function snap(name){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-record-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  await js(`window.fightQA={};const q=fightQA;
    const foot=BaySoftSand.Beach.prototype.attend;BaySoftSand.Beach.prototype.attend=function(dt,t,h,f){q.h=h;q.floor=f;return foot.apply(this,arguments);};
    const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(){q.rig=this;return cam.apply(this,arguments);};
    const walk=BayLocals.animatePeople;BayLocals.animatePeople=function(people,dt,driver,cars){q.people=people;q.cars=cars;q.car=driver;return walk.apply(this,arguments);};
    const payroll=BayPayroll.Ride.prototype.step;BayPayroll.Ride.prototype.step=function(){
      const result=payroll.apply(this,arguments);q.ride=this;
      if(this.stage==="enter"&&this.car.passengerDoor>.65)q.boardDoor=true;
      if(this.stage==="exit"&&this.car.passengerDoor>.65)q.exitDoor=true;
      return result;};
    const fire=BayStreetAction.Action.prototype.fire;BayStreetAction.Action.prototype.fire=function(){q.action=this;return fire.apply(this,arguments);};
    const map=BayStreetAction.map;BayStreetAction.map=function(c,a){if(a.marks.length)q.marksDrawn=true;return map.apply(this,arguments);};
    const world=BayView.prototype.draw;BayView.prototype.draw=function(name){if(name==="street-stain")q.marksDrawn=true;return world.apply(this,arguments);};
    q.at=(p,x,z)=>Object.assign(p,{x,z,y:q.floor(x,z)});`);
  await waitFor("fightQA.h&&fightQA.rig&&fightQA.cars?.length");
  await js("fightQA.at(fightQA.h,153.8,-30.6)");
  await tap("KeyF");await waitFor("document.querySelector('#chapterTitle').textContent==='Last Collection'");
  await snap("collection-romy");await waitFor("!document.querySelector('#chapterInsert').hidden");
  assert(await js("document.querySelector('#chapterLine').textContent.includes('stamp')"));
  await snap("collection-envelope");await tap("Enter");
  await js("fightQA.at(fightQA.h,151,-27);fightQA.rig.reset(fightQA.h)");
  await tap("KeyE");await waitFor("fightQA.car?.kind==='coupe'",20000);
  await js("BayDriving.settle(fightQA.car);fightQA.at(fightQA.car,151,-13);fightQA.car.yaw=0");
  await waitFor("fightQA.ride?.stage==='enter'&&fightQA.car.passengerDoor>.2",30000);await snap("collection-boarding");
  await waitFor("document.querySelector('#chapterLine').textContent.includes('cake')",25000);assert(await js("q.boardDoor&&q.ride.seat===1"));await snap("collection-passenger");await tap("Enter");
  const port=mode==="street",route=port?"port":"luna",name=port?"Vic at the scales":"Marisol Vale";
  await tap(port?"Digit2":"Digit1");await waitFor("document.querySelector('#objectiveText').textContent.includes("+JSON.stringify(port?"Port Sol":"Cine Luna")+")");
  await js("q.at(q.car,-143,126);BayDriving.settle(q.car)");
  await waitFor("document.querySelector('#stars').getAttribute('aria-label')==='No heat'",75000);
  await js("q.at(q.car,"+(port?"-138,-73":"6,66")+");q.car.yaw=0;BayDriving.settle(q.car)");
  await waitFor("q.ride.stage==='exit'||q.ride.stage==='deliver'",30000);
  await waitFor("q.ride.stage==='receipt'",30000);assert(await js("q.exitDoor&&q.ride.receiver.name==="+JSON.stringify(name)));
  await snap("collection-handoff");await tap("Enter");
  assert.equal(await js("JSON.parse(localStorage.getItem('sundownBay.v1')).collection.last"),route);
  console.log("PASS Jules walked in, opened both doors, carried the tin to "+name+" and completed "+route,mode);
  // Reload to free roam at the motel. The test supplies encounter positions in an empty block.
  await send("Page.reload");await waitFor("!window.fightQA&&document.readyState==='complete'&&typeof BayStreetAction==='object'");
  await js("document.querySelector('#play').click()");
  await js(`window.impactQA={};const q=impactQA;
    const foot=BaySoftSand.Beach.prototype.attend;BaySoftSand.Beach.prototype.attend=function(dt,t,h,f){q.h=h;q.floor=f;return foot.apply(this,arguments);};
    const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(){q.rig=this;return cam.apply(this,arguments);};
    const walk=BayLocals.animatePeople;BayLocals.animatePeople=function(people,dt,driver,cars){q.people=people;q.car=driver;q.cars=cars;return walk.apply(this,arguments);};
    const map=BayStreetAction.map;BayStreetAction.map=function(c,a){if(a.marks.length)q.marksDrawn=true;return map.apply(this,arguments);};
    const world=BayStreetAction.world;BayStreetAction.world=function(a,items,...rest){const r=world.apply(this,arguments);if(items.some(o=>o[0]==='street-stain'))q.marksDrawn=true;return r;};
    q.at=(p,x,z)=>Object.assign(p,{x,z,y:q.floor(x,z)});`);
  await waitFor("impactQA.h&&impactQA.rig&&impactQA.cars?.length");
  const clerk=await js("BayPayroll.stops["+JSON.stringify(route)+"]");
  await js("q.at(q.h,"+clerk.x+","+clerk.z+");q.rig.reset(q.h)");await tap("KeyF");
  await waitFor("document.querySelector('#panel').dataset.screen==='payroll-receipt'&&!document.querySelector('#panel').hidden");
  await snap("collection-copy");await tap("Escape");
  console.log("PASS visited "+name+" and read the signed receipt after reloading",mode);
  await js(`q.at(q.h,72,40);q.h.yaw=0;q.rig.reset(q.h);q.p=q.people.find(p=>!p.name&&!p.palmManaged);q.at(q.p,72,46);q.p.wait=55;`);
  await tap("Digit1");await waitFor("!document.querySelector('#streetWeapon').hidden");
  await tap("Space");await waitFor("!!impactQA.p.down&&impactQA.marksDrawn");
  assert(await js("document.querySelector('#streetWeapon').textContent.includes('7 / 8')"));
  await snap("street-impact");await tap("Digit2");
  await send("Input.dispatchMouseEvent",{type:"mousePressed",x:506,y:315,button:"left",clickCount:1});
  await send("Input.dispatchMouseEvent",{type:"mouseReleased",x:506,y:315,button:"left",clickCount:1});
  await waitFor("document.querySelector('#streetWeapon').textContent.includes('2 / 3')");await tap("Digit0");
  await js("q.at(q.h,151,-27)");await tap("KeyE");await waitFor("impactQA.car?.kind==='coupe'",22000);
  await js(`BayDriving.settle(q.car);q.at(q.car,72,38);q.car.yaw=0;q.person=q.people.find(p=>p!==q.p&&!p.name&&!p.palmManaged&&!p.down);
    const impact=BayStreetAction.Action.prototype.bumper;BayStreetAction.Action.prototype.bumper=function(v,people,ground){
      if(!q.placed&&v===q.car&&v.speed>6){q.placed=true;q.at(q.person,v.x,v.z+1.8);}
      return impact.apply(this,arguments);
    };`);
  await key("keyDown","KeyW");try{await waitFor("!!impactQA.person.down",15000);}finally{await key("keyUp","KeyW");}
  await snap("bumper-impact");assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
  console.log("PASS sidearm and scattergun by keyboard and free mouse, pedestrian falls, visible blood and a moving-car impact; muted and cursor-free",mode);
};
