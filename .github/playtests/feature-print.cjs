const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function featurePrint({js,send,waitFor,key,tap,mode}){
  async function snap(name){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-record-print-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  await js(`window.printQA={};const q=printQA;
    const attend=BaySoftSand.Beach.prototype.attend;
    BaySoftSand.Beach.prototype.attend=function(dt,t,h,f){q.h=h;q.floor=f;return attend.apply(this,arguments);};
    const walk=BayLocals.animatePeople;BayLocals.animatePeople=function(people,dt,car,cars){
      q.car=car;q.cars=cars;return walk.apply(this,arguments);};
    const ride=BayPayroll.Ride.prototype.step;BayPayroll.Ride.prototype.step=function(){
      const event=ride.apply(this,arguments);if(this.film){q.ride=this;
        if(this.stage==="enter"&&this.car.passengerDoor>.3)q.boarded=true;
        if(this.stage==="exit"&&this.car.passengerDoor>.3)q.exited=true;}
      return event;};
    q.at=(p,x,z,yaw=0)=>Object.assign(p,{x,z,y:q.floor(x,z),yaw});`);
  await waitFor("q.h&&q.cars?.length");await js("q.at(q.h,84.17,-60.77)");
  await tap("KeyF");await waitFor("document.querySelector('#panelBody').textContent.includes('Before the Feature')");
  await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.textContent.includes('Before the Feature')).click()");
  await waitFor("document.querySelector('#chapterTitle').textContent==='Before the Feature'");
  await waitFor("!document.querySelector('#chapterInsert').hidden");await snap("negative");await tap("Enter");
  await js("q.v=q.cars.find(v=>v.plate==='ADA 16');const door=BayDriving.world(q.v,-2.2,0);q.at(q.h,door.x,door.z)");
  await tap("KeyE");await waitFor("q.car===q.v",30000);
  await waitFor("q.ride?.aboard",30000);assert(await js("q.boarded"));
  await snap("pickup");
  await key("keyDown","KeyW");try{await waitFor("Math.abs(q.v.speed)>4",20000);}finally{await key("keyUp","KeyW");}
  if(mode==="street"){
    await js("q.at(q.v,4.2,56.9);BayDriving.settle(q.v);q.v.speed=q.v.vz=6.4");
    await waitFor("document.querySelector('#objectiveText').textContent.includes('Toss the reel')",20000);
    await tap("KeyH");
    await waitFor("JSON.parse(localStorage.getItem('sundownBay.v1'))?.featurePrint?.rolling===1",10000);
    assert(await js("document.querySelector('#chapterFilm').hidden&&document.querySelector('#stars').getAttribute('aria-label')!=='No heat'"));
    await snap("catch");
  }
  await js("q.at(q.v,-143,126);BayDriving.settle(q.v)");
  await waitFor("document.querySelector('#stars').getAttribute('aria-label')==='No heat'",85000);
  if(mode==="street"){
    await waitFor("!document.querySelector('#chapterFilm').hidden",35000);
  }else{
    await js("q.at(q.v,4.6,63.2);BayDriving.settle(q.v)");
    await waitFor("q.ride.stage==='receipt'",45000);assert(await js("q.exited"));
  }
  const save="JSON.parse(localStorage.getItem('sundownBay.v1'))";
  const record=await js(save+".featurePrint");assert.equal(record.first+record.late,1);assert(record.best>0);
  await snap("house");await tap("Enter");
  await send("Page.reload");await waitFor("!window.printQA&&document.readyState==='complete'");
  assert.deepEqual(await js(save+".featurePrint"),record);
  await js(`window.boothQA={};const bq=boothQA;
    const rescue=BayRescue.Service.prototype.step;
    BayRescue.Service.prototype.step=function(dt,e){bq.hero=e.hero;bq.ground=e.ground;return rescue.apply(this,arguments);};
    const move=BayCineRoom.move;BayCineRoom.move=function(r,...args){bq.room=r;return move(r,...args);};
    const program=BayCineProgram;window.BayCineProgram={...program,frame(...args){
      const show=program.frame(...args);bq.show=show.id;bq.elapsed=show.elapsed;return show;
    }};
    bq.at=(p)=>Object.assign(bq.hero,{x:p.x,y:bq.ground(p.x,p.z),z:p.z});
    document.querySelector('#play').click();`);
  const click=async name=>{
    const button="[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(name)+")";
    await waitFor(button);await js(button+".click()");
  };
  async function enter(){
    await js("bq.room=null;bq.at(BayCab.cinema)");await tap("KeyF");await waitFor("bq.room?.ada");
  }
  await waitFor("bq.hero");
  if(await js("document.querySelector('#mode').textContent!=='On foot'")){
    await tap("KeyE");await waitFor("document.querySelector('#mode').textContent==='On foot'");
  }
  await enter();
  await js("Object.assign(bq.room,BayCineRoom.points.program)");await tap("KeyF");await click("Hold It There");
  await js("Object.assign(bq.room,BayCineRoom.points.aisle)");await tap("KeyF");
  await waitFor("bq.room.seated&&!bq.room.transition&&bq.show==='soler-gate'");
  for(let i=0;i<12;i++)await tap("KeyA");
  await tap("Space");await waitFor("bq.room.reader?.start===0");
  const end=mode==="street"?10:6;
  for(let i=0;i<end;i++)await tap("KeyD");
  await waitFor("bq.elapsed==="+end/2);await snap("projector");await tap("Space");
  await waitFor(save+".featurePrint.pair?.end==="+end);
  await tap("KeyF");await waitFor("!bq.room.seated&&!bq.room.transition");
  await js("Object.assign(bq.room,BayCineRoom.points.exit)");await tap("KeyF");
  await js("bq.at({x:150.02,z:-10.9})");await tap("KeyF");await click("Fold a copy for later");
  await waitFor("document.querySelector('.bay-front-page')?.getAttribute('aria-label').includes('frames 183 and "+(183+end)+"')");
  await tap("Escape");await enter();
  await js("Object.assign(bq.room,{x:.41,z:BayCineRoom.adaChair.z})");await tap("KeyN");
  const pocket="JSON.parse(localStorage.getItem(BayPavement.archiveKey))";
  await waitFor(pocket+".at(-1).adaSigned");await js("document.querySelector('.bay-front-page').scrollIntoView({block:'end'})");
  await snap("clipping");
  await send("Page.reload");await waitFor("!window.boothQA&&document.readyState==='complete'");
  assert(await js(pocket+".at(-1).adaSigned"));assert.equal(await js(save+".featurePrint.pair.end"),end);
  console.log("PASS two printed frames verified on the house projector, on a folded paper and signed by Ada after the return trip",mode,end);
  console.log("PASS Starlite discovery, playable getaway, both animated doors, ending and reload",mode,record);
};
