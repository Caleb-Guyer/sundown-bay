const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,tap,key,mode,errors})=>{
  async function shot(name){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-record-clean-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  await js(`window.passQA={};const p=passQA;
    const meet=BayLocals.animatePeople;BayLocals.animatePeople=function(w,dt,v,cars){p.car=v;p.cars=cars;return meet.apply(this,arguments);};
    const rescue=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){p.h=e.hero;return rescue.apply(this,arguments);};
    const frame=BayCamera.Roadside.prototype.frame;BayCamera.Roadside.prototype.frame=function(v){
      const q=frame.apply(this,arguments);p.eye=q;if(q){p.lens=this;p.shots=this.shot;}return q;};
    const step=BayCleanThrough.Reel.prototype.update;BayCleanThrough.Reel.prototype.update=function(){
      const result=step.apply(this,arguments);p.reel=this;
      if(p.staged&&this.run?.gaps&&!p.through){p.through=true;
        dispatchEvent(new KeyboardEvent("keyup",{code:"KeyW"}));dispatchEvent(new KeyboardEvent("keydown",{code:"Space"}));}
      return result;};true`);
  await waitFor("p.h&&p.cars?.length");
  await js("Object.assign(p.h,{x:151,z:-27});true");await tap("KeyE");await waitFor("p.car?.kind==='coupe'",25000);
  await js("p.pair=("+require("./pass-traffic.cjs").toString()+")(p.car,p.cars);p.staged=true;true");
  await key("keyDown","ShiftLeft");await tap("KeyC");await key("keyUp","ShiftLeft");
  await waitFor("p.eye&&p.shots===1");
  await shot("tripod");
  if(mode==="street"){
    await js(`const opaque=BayView.prototype.drawOpaque;BayView.prototype.drawOpaque=function(items){
      const batch=this.streetBatch;if(!batch)return opaque.apply(this,arguments);
      BayView.prototype.drawOpaque=opaque;const calls=[],writer=batch.writeIndices;
      batch.writeIndices=function(...args){calls.push(args);return writer.apply(this,args);};
      try{opaque.apply(this,arguments);}finally{delete batch.writeIndices;}
      p.topology=(${require("./batch-indices.cjs").toString()})(batch,calls);
    };true`);
    await waitFor("p.topology",20000);
    const report=await js("p.topology");assert(report.meshes>1&&report.elements>1000&&report.copyBytes<=524288);
    console.log("PERF traffic mesh indices",JSON.stringify(report));
  }
  await key("keyDown","KeyW");
  try{
    await waitFor("p.through&&!document.querySelector('#passScore').hidden&&document.querySelector('#passScore').textContent.includes('Double gap')",23000);
    assert.match(await js("document.querySelector('#passScore').textContent"),/Double gap/);await shot("gap");
    await waitFor("p.reel.best?.gaps===1",16000);
  }catch(e){console.log("Playtest state",await js("JSON.stringify({driver:[p.car?.x,p.car?.z,p.car?.speed],pair:p.pair.map(v=>[v.x,v.z,v.speed]),score:p.reel?.run?.score,best:p.reel?.best?.score})"));throw e;}
  finally{await key("keyUp","KeyW");await key("keyUp","Space");}
  const card=await js("p.reel.best");assert.equal(card.passes,2);assert(card.score>=450&&card.frames.length>12);assert.equal(card.street,"Biscayne Street");
  assert(card.cover?.startsWith("data:image/jpeg;base64,/9j/"));assert(await js("p.shots>=2"));
  await key("keyDown","ShiftLeft");await tap("KeyC");await key("keyUp","ShiftLeft");
  assert(await js("p.lens.vehicle===null"));
  await js("window.passPage=true");await send("Page.reload");await waitFor("!window.passPage&&document.readyState==='complete'&&typeof BayCleanThrough==='object'");
  await js("document.querySelector('#play').click()");await waitFor("!document.querySelector('#hud').hidden");await tap("KeyJ");
  const row="Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('Clean Through'))";
  await waitFor("!!("+row+")");await js(row+".click()");await waitFor("!!document.querySelector('input[aria-label=\"Clean Through film position\"]')");
  const slider="document.querySelector('input[aria-label=\"Clean Through film position\"]')";
  await waitFor("Number("+slider+".value)>80");await js(slider+".value=525;"+slider+".dispatchEvent(new Event('input'));true");
  assert(await js(slider+".getBoundingClientRect().bottom<=document.querySelector('#panelBody').getBoundingClientRect().bottom"));
  await shot("reel");assert.equal(await js("JSON.parse(localStorage.getItem(BayCleanThrough.key)).score"),card.score);
  const cover="document.querySelector('img[alt^=\"Romy’s roadside\"]')";
  await waitFor(cover+"?.naturalWidth===400");await js(cover+".scrollIntoView({block:'center'});true");await shot("cover");
  await tap("Escape");
  await js(`window.railQA={};const rail=railQA,rs=BayRescue.Service.prototype.step;
    BayRescue.Service.prototype.step=function(dt,e){rail.hero=e.hero;return rs.apply(this,arguments);};
    const traffic=BayLocals.animatePeople;BayLocals.animatePeople=function(w,dt,v){rail.car=v;return traffic.apply(this,arguments);};
    const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(){rail.cam=this;return cam.apply(this,arguments);};
    const draw=BayCleanThrough.Reel.prototype.print;BayCleanThrough.Reel.prototype.print=function(t,near){
      const p=draw.apply(this,arguments);if(p&&near)rail.rev=p.rev;return p;};true`);
  await waitFor("rail.hero&&rail.cam");
  await waitFor("rail.car?.kind==='coupe'");await tap("KeyE");
  await waitFor("document.querySelector('#mode').textContent==='On foot'&&!rail.car",15000);
  await js("Object.assign(rail.hero,{x:BayCarbonCopies.rail.x,z:BayCarbonCopies.rail.z+2.7,y:BayCarbonCopies.apronY,yaw:Math.PI});rail.cam.reset(rail.hero);true");
  try{await waitFor("document.querySelector('#context').textContent.includes('Watch Clean Through')");}
  catch(e){console.log("Playtest state",await js("JSON.stringify([rail.hero.x,rail.hero.z,rail.car?.kind,document.querySelector('#mode').textContent,document.querySelector('#context').textContent])"));throw e;}
  if(mode==="street"){await waitFor("rail.rev>=2");await shot("screen");}
  await tap("KeyF");await waitFor("!!"+slider);
  const rowWith=label=>"Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.textContent.includes("+JSON.stringify(label)+"))";
  await js(rowWith("Take envelope")+".click();true");
  const record="JSON.parse(localStorage.getItem('sundownBay.latePlate.v1'))";
  assert.equal(await js(record+".packet.street"),"Biscayne Street");
  await js("Object.assign(rail.hero,BayCurbWire.desk.stand,{yaw:BayCurbWire.desk.yaw+Math.PI});rail.cam.reset(rail.hero);true");
  await waitFor("document.querySelector('#context').textContent.includes('Portside envelope')");await tap("KeyF");
  const proof="document.querySelector('canvas[aria-label^=\"Bay Wire late edition proof\"]')";
  await waitFor(proof+"?.getContext('2d').getImageData(20,20,1,1).data[3]===255");
  if(mode==="street"){
    const wide=await js(proof+".toDataURL()");await js(rowWith("Turn proof")+".click();true");
    await waitFor(proof+"?.getContext('2d').getImageData(20,20,1,1).data[3]===255");assert.notEqual(await js(proof+".toDataURL()"),wide);
  }
  await waitFor(proof+"?.getContext('2d').getImageData(20,20,1,1).data[3]===255");
  await js(`const page=BayCleanThrough.PictureDesk.prototype.page;
    BayCleanThrough.PictureDesk.prototype.page=function(c,p,crop){const result=page.apply(this,arguments);
      if(result&&c.width===128)rail.aired=crop;return result;};true`);
  await shot("edition");await js(rowWith("Print edition")+".click();true");
  assert.equal(await js(record+".issue.crop"),mode==="street"?"driver":"street");
  await waitFor("rail.aired==="+JSON.stringify(mode==="street"?"driver":"street"));
  await js("window.plateReload=true;true");await send("Page.reload");
  await waitFor("!window.plateReload&&document.readyState==='complete'&&typeof BayCleanThrough==='object'");
  await js("document.querySelector('#play').click();true");await waitFor("!document.querySelector('#hud').hidden");
  await tap("KeyJ");await waitFor("!!("+rowWith("On the Curb")+")");await js(rowWith("On the Curb")+".click();true");
  await js(rowWith("Late Plate")+".click();true");
  await waitFor(proof+"?.getContext('2d').getImageData(20,20,1,1).data[3]===255");
  assert.equal(await js(record+".packet"),null);
  console.log("PASS Late Plate",mode,"physical Portside envelope and desk handoff, proof chosen and published, archived photograph reopened after reload");
  await tap("Escape");
  await require("./room-call.cjs")({js,send,tap,key,waitFor,shot,mode});
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS Roadside camera",mode,"driver-controlled cuts, printed traffic photograph, saved cover after reload, camera released");
  console.log("PASS Clean Through",mode,card.score,"points, double gap under driver input, five clear seconds, saved moving traffic reel and scrub after reload");
};
