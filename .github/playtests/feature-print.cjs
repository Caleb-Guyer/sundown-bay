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
  await js("q.at(q.v,-143,126);BayDriving.settle(q.v)");
  await waitFor("document.querySelector('#stars').getAttribute('aria-label')==='No heat'",85000);
  await js("q.at(q.v,4.6,63.2);BayDriving.settle(q.v)");
  await waitFor("q.ride.stage==='receipt'",45000);assert(await js("q.exited"));
  const save="JSON.parse(localStorage.getItem('sundownBay.v1'))";
  const record=await js(save+".featurePrint");assert.equal(record.first+record.late,1);assert(record.best>0);
  await snap("house");await tap("Enter");
  await send("Page.reload");await waitFor("!window.printQA&&document.readyState==='complete'");
  assert.deepEqual(await js(save+".featurePrint"),record);
  console.log("PASS Starlite discovery, playable getaway, both animated doors, ending and reload",mode,record);
};