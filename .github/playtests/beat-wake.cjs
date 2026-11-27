const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function beatWake({js,send,tap,key,waitFor,mode,errors}){
  const snap=async name=>{
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:87});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-wake-"+name+".jpg"),Buffer.from(data,"base64"));
  };
  await js(`window.wakeQA={};const q=wakeQA;
    const service=BayFirstCrossing.Service.prototype.step;
    BayFirstCrossing.Service.prototype.step=function(dt,t,h){q.h=h;q.boat=this;return service.apply(this,arguments);};
    const locals=BayLocals.animatePeople;
    BayLocals.animatePeople=function(people,dt,car,cars){q.car=car;q.cars=cars;q.feet=arguments[9];return locals.apply(this,arguments);};
    const race=BayWakeClock.Run.prototype.step;
    BayWakeClock.Run.prototype.step=function(){q.r=this;return race.apply(this,arguments);};
    q.at=(p,x,z,yaw=0)=>{Object.assign(p,{x,z,y:.12,yaw});};
    q.d=BayWakeClock.clocks;`);
  await waitFor("!!q.h&&q.cars?.length>0");
  await js("q.v=q.cars[0];const door=BayDriving.world(q.v,-2.2,0);q.at(q.h,door.x,door.z)");
  await tap("KeyE");await waitFor("q.car===q.v",25000);
  await js("q.at(q.v,143.4,q.d[0].line.z);BayDriving.settle(q.v)");
  await tap("KeyH");await waitFor("q.r?.phase==='road'",140000);
  await key("keyDown","KeyW");try{await waitFor("q.v.speed>4",20000);}finally{await key("keyUp","KeyW");}
  await waitFor("!document.querySelector('#wakeTiming').hidden&&document.querySelector('#wakeWater').value>0");
  assert.equal(await js("q.boat.phase"),"sail");await snap("road");
  await js("q.at(q.v,143.4,92);BayDriving.settle(q.v)");await waitFor("q.r.phase==='pier'");
  await tap("KeyE");await waitFor("q.feet===q.h",20000);
  await js("q.at(q.h,q.d[1].punch.x-1,q.d[1].punch.z)");
  await waitFor("document.querySelector('#context').textContent.includes('Punch your road time')");
  await tap("KeyN");await waitFor("q.r.road!==null");await snap("punch");
  await waitFor("BayWakeClock.badge(q.v.garageKey)>0",115000);
  const result=await js("({road:q.r.road,water:q.r.water,plate:q.v.garageKey})");
  assert(result.road<result.water);assert.equal(result.water,3400);
  assert.equal(await js("BayWakeClock.badge(q.cars[1].garageKey)||0"),0);
  await js("const side=BayDriving.world(q.v,-2.2,0);q.at(q.h,side.x,side.z)");
  await tap("KeyE");await waitFor("q.car===q.v",20000);
  if(await js("document.querySelector('#driverGlass').hidden"))await tap("KeyZ");
  await waitFor("!document.querySelector('#wakeBadge').hidden");
  if(mode==="overhead")assert(await js("document.querySelector('#wakeBadge').getBoundingClientRect().bottom<=innerHeight-(innerHeight<460?114:145)"),"Both speed and gear stay visible");
  assert(await js("document.querySelector('#wakeBadge').getBoundingClientRect().bottom<document.querySelector('.shortcuts').getBoundingClientRect().top"),"The dashboard badge clears the keyboard shortcuts");
  await snap("brass");
  await js(`const navStep=BayMinuteCard.Run.prototype.step;
    BayMinuteCard.Run.prototype.step=function(){q.nav=this;
      if(this.vehicle.passengerDoor>.3){if(this.phase==="boarding")q.entered=true;if(this.phase==="pin")q.exited=true;}
      return navStep.apply(this,arguments);};true`);
  await waitFor("document.querySelector('#context').textContent.includes('Invite Romy')");
  await tap("KeyL");await waitFor("q.nav?.phase==='choose'",35000);assert(await js("q.entered&&q.nav.ride.aboard"));
  const route=mode==="street"?"linen":"luna";
  await tap(route==="linen"?"Digit1":"Digit2");await waitFor("q.nav.phase==='ready'");
  await js("q.v.yaw=Math.PI");await key("keyDown","KeyW");
  try{await waitFor("q.nav.phase==='running'");}finally{await key("keyUp","KeyW");}
  for(let i=0;i<3;i++){
    // Stage at each approach and drive through the width of the actual timing stripe.
    await js(`const g${i}=q.nav.gates[${i}];q.at(q.v,g${i}.x-.6,g${i}.z+6,Math.PI);BayDriving.settle(q.v);true`);
    await key("keyDown","KeyW");
    try{await waitFor("q.nav.leg>"+i,22000);}finally{await key("keyUp","KeyW");}
    if(!i){await waitFor("!document.querySelector('#minuteSheet').hidden");await snap("navigator");}
  }
  await js("q.at(q.v,144,q.d[0].post.z,Math.PI);BayDriving.settle(q.v);true");
  await waitFor("BayMinuteCard.book.last?.marks.length===3",35000);
  const card=await js("BayMinuteCard.book.last");assert.equal(card.route,route);assert.equal(card.from,1);
  assert(await js("q.exited&&q.v.passengerDoor===0"));
  await tap("KeyE");await waitFor("q.feet===q.h",25000);
  await js("q.at(q.h,q.d[0].post.x+.4,q.d[0].post.z+.65)");
  await waitFor("document.querySelector('#context').textContent.includes('timing book')");
  await tap("KeyF");await waitFor("document.querySelector('#panelBody').textContent.includes('Last card')");
  await snap("book");
  await send("Page.reload");await waitFor("!window.wakeQA&&typeof BayWakeClock==='object'");
  assert.equal(await js("BayWakeClock.badge("+JSON.stringify(result.plate)+")"),result.road);
  assert.equal(await js("BayWakeClock.best(0)"),result.road);assert.deepEqual(errors,[]);
  assert.deepEqual(await js("BayMinuteCard.book.best["+JSON.stringify("1/"+route)+"]"),card);
  console.log("PASS On the Minute",mode,route,"passenger boards and exits, three rolling punches, signed card at the clock after reload",JSON.stringify(card));
  console.log("PASS Beat the Wake",mode,"actual ferry departure, accelerated in traffic, parked exit, punch, return to free roam, winning car badge after reload",JSON.stringify(result));
};
