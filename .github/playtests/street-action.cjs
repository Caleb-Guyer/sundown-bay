const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function streetAction({js,send,waitFor,key,tap,mode,errors}){
  async function snap(name){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-record-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  const button=text=>"Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.textContent.includes("+JSON.stringify(text)+")).click()";
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
  await js("q.at(q.car,-143,96);q.car.yaw=0;BayDriving.settle(q.car)");
  await key("keyDown","KeyW");
  try{await waitFor("q.ride.photoOffered&&document.querySelector('#context').textContent.includes('photograph')",24000);
    await tap("KeyN");await waitFor("JSON.parse(localStorage.getItem('sundownBay.v1')).collection.print===1");
  }finally{await key("keyUp","KeyW");}
  await js(`q.at(q.car,72,84);q.car.yaw=0;BayDriving.settle(q.car);
    q.blocker=q.cars.find(v=>v!==q.car&&!v.path&&!v.serviceCar&&!v.meetCar&&!v.guestId&&['coupe','hatch','sedan'].includes(v.kind));
    if(!q.blocker)throw Error('No parked car for payroll collision');
    q.back={x:q.blocker.x,z:q.blocker.z,y:q.blocker.y,yaw:q.blocker.yaw};q.at(q.blocker,72,110);q.blocker.yaw=0;BayDriving.settle(q.blocker);true`);
  await key("keyDown","KeyW");
  try{await waitFor("q.ride.envelopes&&!document.querySelector('#wageEnvelopes').hidden",22000);}
  finally{await key("keyUp","KeyW");}
  await js("Object.assign(q.blocker,q.back);BayDriving.settle(q.blocker);q.at(q.car,-143,126);BayDriving.settle(q.car);true");
  await key("keyDown","KeyU");
  try{await waitFor("q.ride.envelopes.count===1");}
  finally{await key("keyUp","KeyU");}
  await snap("payroll-footwell");
  if(port){await key("keyDown","KeyU");try{await waitFor("q.ride.envelopes.count===3");}finally{await key("keyUp","KeyU");}}
  const gathered=await js("q.ride.envelopes.count");assert(port?gathered===3:gathered>0&&gathered<3);
  await js("q.at(q.car,-143,126);BayDriving.settle(q.car)");
  await waitFor("document.querySelector('#stars').getAttribute('aria-label')==='No heat'",75000);
  await js("q.at(q.car,"+(port?"-138,-73":"6,66")+");q.car.yaw=0;BayDriving.settle(q.car)");
  await waitFor("q.ride.stage==='exit'||q.ride.stage==='deliver'",30000);
  await waitFor("q.ride.stage==='receipt'",30000);assert(await js("q.exitDoor&&q.ride.receiver.name==="+JSON.stringify(name)));
  assert.equal(await js("document.querySelector('#chapterLine').textContent"),await js("BayPayroll.deliveryLine("+JSON.stringify(route)+","+gathered+")"));
  await snap("collection-handoff");await tap("Enter");
  assert.equal(await js("JSON.parse(localStorage.getItem('sundownBay.v1')).collection.last"),route);
  console.log("PASS Jules walked in, opened both doors, carried the tin to "+name+" and completed "+route,mode);
  await js("q.at(q.car,-109,-17);q.car.yaw=0;BayDriving.settle(q.car);true");
  await waitFor("document.querySelector('#context').textContent.includes('Upgrades & paint')");await tap("KeyF");
  await waitFor("document.querySelector('#panelBody').textContent.includes('County-band scanner')");
  const balance=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).wallet");
  await js(button("County-band scanner"));await waitFor("q.car.upgrades.scanner");
  assert.equal(await js("JSON.parse(localStorage.getItem('sundownBay.v1')).wallet"),balance-90);
  await tap("Escape");await tap("Backslash");
  await waitFor("!document.querySelector('#countyReceiver').hidden&&/Rescue 4|Cleo Moss/.test(document.querySelector('#countySource').textContent)");
  await snap("county-four");
  await tap("KeyF");await waitFor("document.querySelector('#panelBody').textContent.includes('Say Again, Four')");
  await js(button("Say Again, Four"));await waitFor("document.querySelector('#chapterTitle').textContent==='Say Again, Four'");
  await snap("county-loan");await tap("Enter");
  const book="JSON.parse(localStorage.getItem('sundownBay.v1')).countyRelay";
  async function sendTone(site,condition){
    await js("q.stop=BayCountyRelay.sites["+JSON.stringify(site)+"];q.at(q.car,q.stop.x,q.stop.z);BayDriving.settle(q.car);true");
    await waitFor("document.querySelector('#objectiveText').textContent.includes('Hold backslash')");
    await key("keyDown","Backslash");try{await waitFor(condition,18000);}finally{await key("keyUp","Backslash");}
  }
  await sendTone("luna",book+".next==='motel'");
  const rooftop=port?"market":"motel";await tap(port?"Digit2":"Digit1");
  await sendTone(rooftop,book+".cover==="+JSON.stringify(rooftop));
  assert.equal(await js("JSON.parse(localStorage.getItem('sundownBay.v1')).wallet"),balance-90+65);
  await waitFor("document.querySelector('#chapterLine').textContent.includes('signature')");
  await snap("county-signed");await tap("Enter");await tap("Backslash");
  await waitFor("document.querySelector('#countyWords').textContent.includes('relay ·')");
  assert.equal(await js("performance.getEntriesByType('resource').filter(r=>r.name.includes('county-audio.js')).length"),0);
  console.log("PASS Cleo's in-world work order, two curb signal checks, signed "+rooftop+" relay and live range, no muted voice download",mode);
  // Reload the parked car and step out before visiting the signed receipt on foot.
  await send("Page.reload");await waitFor("!window.fightQA&&document.readyState==='complete'&&typeof BayStreetAction==='object'");
  await js("document.querySelector('#play').click()");
  await js(`window.impactQA={};const q=impactQA;
    const rescue=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){q.h=e.hero;q.floor=e.ground;return rescue.apply(this,arguments);};
    const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(){q.rig=this;return cam.apply(this,arguments);};
    const walk=BayLocals.animatePeople;BayLocals.animatePeople=function(people,dt,driver,cars){q.people=people;q.car=driver;q.cars=cars;return walk.apply(this,arguments);};
    const map=BayStreetAction.map;BayStreetAction.map=function(c,a){if(a.marks.length)q.marksDrawn=true;return map.apply(this,arguments);};
    const world=BayStreetAction.world;BayStreetAction.world=function(a,items,...rest){const r=world.apply(this,arguments);if(items.some(o=>o[0]==='street-stain'))q.marksDrawn=true;return r;};
    q.at=(p,x,z)=>Object.assign(p,{x,z,y:q.floor(x,z)});`);
  await waitFor("impactQA.h&&impactQA.rig&&impactQA.cars?.length");
  if(await js("document.querySelector('#mode').textContent!=='On foot'")){
    await tap("KeyE");await waitFor("document.querySelector('#mode').textContent==='On foot'&&!q.car");
  }
  const clerk=await js("BayPayroll.stops["+JSON.stringify(route)+"]");
  await js("q.at(q.h,"+clerk.x+","+clerk.z+");q.rig.reset(q.h)");await tap("KeyF");
  await waitFor("document.querySelector('#panel').dataset.screen==='payroll-receipt'&&!document.querySelector('#panel').hidden");
  assert(await js("document.querySelector('#panelBody').textContent.includes('"+gathered+" of 3 back in the tin')"));
  console.log("PASS recovered "+gathered+" envelopes after a driving impact and kept the handoff on the signed counter copy",mode);
  await snap("collection-copy");
  await js(button("Keep the Meter Running"));
  await waitFor("BayMeterRunning.read()?.stage==='search'");
  await js(`q.fare=q.cars.find(v=>v.garageKey===BayMeterRunning.read().car);
    const p=BayDriving.world(q.fare,6,9);q.at(q.h,p.x,p.z);q.rig.reset(q.h);true`);
  await waitFor("document.querySelector('#context').textContent.includes('Wave down')");
  await tap("KeyH");await waitFor("document.querySelector('#objectiveText').textContent.includes('Meet Neve')",55000);
  await js("Object.assign(q.h,BayMeterRunning.windowPoint(q.fare));q.rig.reset(q.h);true");
  await waitFor("document.querySelector('#context').textContent.includes('Talk to Neve')");await tap("KeyF");
  await waitFor("document.querySelector('#chapterLine').textContent.includes('Thirty-eight')",30000);
  await snap("neve-window");
  await waitFor("document.querySelector('#panel').dataset.screen==='fare-window'&&!document.querySelector('#panel').hidden",30000);
  await js(button(port?"Take it to the night desk":"Hand it to Neve"));
  if(port){
    await waitFor("BayMeterRunning.read().stage==='return'");
    await js("Object.assign(q.h,BayMeterRunning.desk);q.rig.reset(q.h);true");
    await waitFor("document.querySelector('#context').textContent.includes('with Bea')");await tap("KeyF");
  }
  await waitFor("!document.querySelector('#chapterInsert').hidden&&document.querySelector('#chapterInsert').getAttribute('aria-label')?.includes('Bay Cab trip sheet')",30000);
  await snap("neve-carbon");await tap("Enter");
  await js("Object.assign(q.h,BayMeterRunning.desk);q.rig.reset(q.h);true");await tap("KeyN");
  await waitFor("document.querySelector('#panel').dataset.screen==='fare-copy'&&!document.querySelector('#panel').hidden");
  assert.equal(await js("BayMeterRunning.read().stage"),port?"desk":"neve");
  await tap("Escape");console.log("PASS",mode,"moving payroll cab, curb stop, Neve's window scene and signed night desk copy",port?"desk":"window");
  console.log("PASS visited "+name+" and read the signed receipt after reloading",mode);
  await js("q.bea=q.people.find(p=>p.coffeeRegular);q.at(q.h,q.bea.x+.55,q.bea.z);q.rig.reset(q.h)");
  await waitFor("document.querySelector('#context').textContent.includes('Show Bea')");await tap("KeyF");
  await waitFor("document.querySelector('#panel').dataset.screen==='shift-print'");await snap("night-shift-front");
  await js(button("Turn the photograph"));await waitFor("document.querySelector('#panelBody canvas').getAttribute('aria-label').includes('dedication')");
  await js(button("Ask Bea"));await waitFor("JSON.parse(localStorage.getItem('sundownBay.v1')).collection.print===2&&document.querySelector('#panelBody canvas').getAttribute('aria-label').includes('Tino')");
  await snap("night-shift-caption");await tap("Escape");
  console.log("PASS took the night shift photograph from Jules while driving, brought it to Bea after reload and kept her signed caption",mode);
  await js(`q.at(q.h,72,40);q.h.yaw=0;q.rig.reset(q.h);q.p=q.people.find(p=>!p.name&&!p.palmManaged);q.at(q.p,72,46);q.p.wait=55;`);
  await tap("Digit1");await waitFor("!document.querySelector('#streetWeapon').hidden");
  await tap("Space");await waitFor("!!impactQA.p.down&&impactQA.marksDrawn");
  assert(await js("document.querySelector('#streetWeapon').textContent.includes('7 / 8')"));
  await snap("street-impact");await tap("Digit2");
  await send("Input.dispatchMouseEvent",{type:"mousePressed",x:506,y:315,button:"left",clickCount:1});
  await send("Input.dispatchMouseEvent",{type:"mouseReleased",x:506,y:315,button:"left",clickCount:1});
  await waitFor("document.querySelector('#streetWeapon').textContent.includes('2 / 3')");await tap("Digit0");
  await js("q.parked=q.cars.find(c=>c.kind==='coupe'&&c.upgrades?.scanner);q.door=BayDriving.world(q.parked,-bayCarLayout(q.parked.kind).track-1,0);q.at(q.h,q.door.x,q.door.z);q.rig.reset(q.h);true");
  await tap("KeyE");await waitFor("impactQA.car===impactQA.parked",22000);
  assert(await js("q.car.upgrades.scanner"));await tap("Backslash");
  await waitFor("!document.querySelector('#countyReceiver').hidden&&!/Rescue 4|Cleo Moss/.test(document.querySelector('#countySource').textContent)");
  await snap("county-patrol");console.log("PASS spent job money on the coupe receiver, heard Rescue 4, reloaded and received the live pursuit",mode);
  await js(`BayDriving.settle(q.car);q.at(q.car,72,38);q.car.yaw=0;q.person=q.people.find(p=>p!==q.p&&!p.name&&!p.palmManaged&&!p.down);
    const impact=BayStreetAction.Action.prototype.bumper;BayStreetAction.Action.prototype.bumper=function(v,people,ground){
      if(!q.placed&&v===q.car&&v.speed>6){q.placed=true;q.at(q.person,v.x,v.z+1.8);}
      return impact.apply(this,arguments);
    };`);
  await key("keyDown","KeyW");try{await waitFor("!!impactQA.person.down",15000);}finally{await key("keyUp","KeyW");}
  await snap("bumper-impact");assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
  console.log("PASS sidearm and scattergun by keyboard and free mouse, pedestrian falls, visible blood and a moving-car impact; muted and cursor-free",mode);
  // The existing wanted driver stays in the coupe. Start the road stop close to its responding units.
  await js(`q.at(q.car,148.8,32);q.car.yaw=0;BayDriving.settle(q.car);
    const slip=BayCabArt.meterSlip;BayCabArt.meterSlip=function(canvas){
      const result=slip.apply(this,arguments);q.voucherImage=canvas.toDataURL();
      requestAnimationFrame(()=>requestAnimationFrame(()=>requestAnimationFrame(()=>{q.checkedSlip=canvas.toDataURL()===q.voucherImage?"match":"changed";})));return result;
    };
    const move=BayPursuit.prototype.move,placed=new WeakSet();BayPursuit.prototype.move=function(v){
      if(!placed.has(v)){placed.add(v);Object.assign(v,{x:148.8,z:26.2,yaw:0,speed:0});}
      return move.apply(this,arguments);};true`);
  await waitFor("document.querySelector('#chapterTitle').textContent==='Last Fare on the Meter'",42000);
  await snap("meter-plate");await waitFor("!document.querySelector('#chapterInsert').hidden");
  assert(await js("document.querySelector('#chapterInsert').getAttribute('aria-label').includes('Ocean Drive')"));
  await waitFor("q.checkedSlip");assert.equal(await js("q.checkedSlip"),"match","Mina’s actual printed voucher stays visible");
  await snap("meter-slip");await tap("Enter");
  await send("Page.reload");await waitFor("!window.impactQA&&document.readyState==='complete'&&typeof BayCab==='object'");
  await js(`window.meterQA={};const m=meterQA;
    const svc=BayCab.Service.prototype.step;BayCab.Service.prototype.step=function(dt,e){m.service=this;m.h=e.hero;m.floor=e.ground;return svc.apply(this,arguments);};
    const crowd=BayLocals.animatePeople;BayLocals.animatePeople=function(list,dt,driver,fleet){
      m.people=list;m.car=driver;m.lost=fleet.find(v=>v.garageKey===JSON.parse(localStorage.getItem('sundownBay.v1')).meterCopy.key);return crowd.apply(this,arguments);};
    document.querySelector('#play').click();true`);
  await waitFor("m.h&&m.lost");assert(await js("Math.hypot(m.lost.x-148.8,m.lost.z-32)<2"));
  await js("Object.assign(m.h,BayCab.stops.marlin.stand);true");await tap("KeyF");
  await waitFor("document.querySelector('#panelBody').textContent.includes('Use free ride')");
  await js(button("Use free ride"));await waitFor("m.service.booking?.stage==='ready'",70000);await tap("KeyE");
  await waitFor("m.service.booking?.stage==='ride'&&document.querySelector('#roadTurn').textContent.includes('Mina’s voucher')",18000);await snap("meter-ride");
  await waitFor("JSON.parse(localStorage.getItem('sundownBay.v1')).meterCopy.spent",90000);
  assert(await js("Math.hypot(m.h.x-m.lost.x,m.h.z-m.lost.z)<20"));
  await js("Object.assign(m.h,BayDriving.world(m.lost,-2.4,0));true");await tap("KeyE");
  await waitFor("m.car===m.lost&&JSON.parse(localStorage.getItem('sundownBay.v1')).meterCopy.found",20000);
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS Last Fare on the Meter: arrested in the coupe, read its voucher, reloaded, rode Cab 17 and took back the same plate",mode);
  await tap("KeyH");
  await waitFor("document.querySelector('#speech').textContent.includes('There goes my free ride')",10000);
  assert(await js("Math.abs(m.service.vehicle.hornAt-m.lost.hornAt-.56)<.25"));
  await snap("meter-hello");assert.equal(await js("audioStarts+cursorRequests"),0);
  console.log("PASS Mina recognized the recovered plate on the street and answered the driver's horn",mode);
  await js(`m.ren=m.people.find(p=>p.name==='Ren');Object.assign(m.car,{x:148.65,z:32,yaw:0});BayDriving.settle(m.car);
    Object.assign(m.ren,{x:153.5,z:33,yaw:Math.PI,wait:90});true`);
  await tap("KeyN");await waitFor("localStorage.getItem('sundownBay.neighbors.guest.ren.met')==='1'");
  await js("m.car.z=64;true");await waitFor("!m.ren.neighborPose&&!m.ren.neighborTalking");
  await js("Object.assign(m.car,{x:148.65,z:43,yaw:Math.PI,speed:14,vz:-14,vx:0});true");
  await tap("KeyH");await waitFor("m.ren.hornPose?.kind==='wave'&&m.ren.hornPose.age>.22",10000);await snap("horn-wave");
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS met Ren through the car window, drove on and received a recognition wave on the return pass",mode);
  const bouquet=mode==="street"?"marlin":"wheel",markOther=bouquet==="marlin"?"Digit2":"Digit1";
  await waitFor("m.service.florist?.phase==='wait'",95000);
  await js(`m.bea=m.service.florist;m.park=s=>{BayDriving.settle(m.car);Object.assign(m.car,{x:s.x,z:s.z,yaw:s.yaw});};
    m.park(m.bea.from);true`);
  await waitFor("document.querySelector('#context').textContent.includes('anniversary flowers')");await tap("KeyH");
  await waitFor("m.bea.phase==='ride'&&document.querySelector('#objectiveTag').textContent.includes('Extra Chair')",25000);
  await tap(markOther);await waitFor("m.bea.to.id==="+JSON.stringify(bouquet==="marlin"?"wheel":"marlin"));
  await js("m.park(BayCab.stops["+JSON.stringify(bouquet)+"]);true");
  await waitFor("document.querySelector('#chapterTitle').textContent==='The Extra Chair'&&!document.querySelector('#chapterFilm').hidden",30000);
  await snap("flower-seat");await waitFor("!document.querySelector('#chapterInsert').hidden");
  assert(await js("document.querySelector('#chapterInsert').getAttribute('aria-label').includes('anniversary flowers')"));
  await snap("flower-tag");await tap("Enter");
  await send("Page.reload");await waitFor("!window.meterQA&&document.readyState==='complete'&&typeof BayCab==='object'");
  await js(`window.giftQA={};const ga=giftQA;
    const step=BayCab.Service.prototype.step;BayCab.Service.prototype.step=function(dt,env){ga.h=env.hero;ga.cab=this;return step.apply(this,arguments);};
    const bandStep=BaySessions.Band.prototype.step;BaySessions.Band.prototype.step=function(){ga.band=this;return bandStep.apply(this,arguments);};
    const world=BayView.prototype.draw;BayView.prototype.draw=function(id){if(id==='anniversary-chair')ga.chair=true;return world.apply(this,arguments);};
    document.querySelector('#play').click();true`);
  await waitFor("ga.h&&ga.cab");assert.equal(await js("ga.cab.memory.bunch"),bouquet);
  if(await js("document.querySelector('#mode').textContent!=='On foot'")){
    await tap("KeyE");await waitFor("document.querySelector('#mode').textContent==='On foot'");
  }
  await js("const chair=BayCab.chairs[ga.cab.memory.bunch];Object.assign(ga.h,{x:chair.x,z:chair.z-.82,yaw:0});true");
  try{await waitFor("document.querySelector('#context').textContent.includes('flower card')");}
  catch(e){
    console.log("Flower visit",await js("({x:ga.h.x,z:ga.h.z,seat:ga.cab.memory.bunch,prompt:document.querySelector('#context').textContent,mode:document.querySelector('#mode').textContent,errors:"+JSON.stringify(errors)+"})"));
    await snap("flower-prompt");throw e;
  }
  await tap("KeyF");
  await waitFor("document.querySelector('#chapterTitle').textContent==='The other side'");
  await waitFor("!document.querySelector('#chapterInsert').hidden");
  assert(await js("document.querySelector('#chapterInsert').getAttribute('aria-label').includes("+JSON.stringify(bouquet==="marlin"?"pillow":"Otis")+")"));
  await snap("flower-reply");assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  await tap("Enter");await waitFor("JSON.parse(localStorage.getItem('sundownBay.v1')).cab.waltz&&ga.band");
  await js("Object.assign(ga.h,ga.band.site.board);true");await tap("KeyF");
  await waitFor("document.querySelector('#panelBody').textContent.includes('The Wheel Keeps Time')");
  await js(button("The Wheel Keeps Time"));await waitFor("ga.band.take?.phase==='count'",30000);
  assert.equal(await js("ga.band.take.song.beats"),24);
  await js(`ga.nextBeat=0;function playWaltz(){const t=ga.band.take;if(!t||t.phase==='result')return;
    if(t.phase==='play')while(ga.nextBeat<t.notes.length&&t.notes[ga.nextBeat].at<=t.beat){
      const code=['KeyA','KeyS','KeyD'][t.notes[ga.nextBeat++].pad];
      for(const evt of ['keydown','keyup'])window.dispatchEvent(new KeyboardEvent(evt,{code,bubbles:true,cancelable:true}));
    }requestAnimationFrame(playWaltz);
  }requestAnimationFrame(playWaltz);true`);
  await waitFor("ga.band.take?.beat>3");await snap("waltz-stage");
  await waitFor("ga.band.take?.phase==='result'",85000);await snap("waltz-cassette");
  const recording=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).band.best['wheel-waltz']");
  assert(recording.score>=85&&recording.notes.length===await js("ga.band.take.song.pattern.length"));
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS played Bea’s eight-bar waltz on the Sound Shell kit and saved the cassette",mode,recording.score,recording.notes.length);
  console.log("PASS Mina handed over Bea's fare, the passenger took the unmarked "+bouquet+" curb and her handwritten answer survived reload",mode);
};
