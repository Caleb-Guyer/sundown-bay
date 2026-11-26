const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,waitFor:wait,tap,key,send,mode,errors})=>{
  async function waitFor(condition,timeout){
    try{await wait(condition,timeout);}
    catch(error){
      const state=await js(`(()=>{const q=window.airQA||{},a=q.air,c=q.car;
        return {heat:q.heat,car:c&&[c.kind,c.x,c.z,c.speed],blocker:q.blocker&&[q.blocker.x,q.blocker.z],
          air:a&&[a.x,a.z,a.sees,a.lit],samples:q.reel?.take?.samples?.length,context:document.querySelector('#context')?.textContent,
          panel:document.querySelector('#panelBody')?.textContent?.slice(0,220)};})()`);
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
    const tape=BayCurbWire.AirReel.prototype.step;BayCurbWire.AirReel.prototype.step=function(){q.reel=this;return tape.apply(this,arguments);};
    q.place=(v,x,z)=>{BayDriving.settle(v);Object.assign(v,{x,z,yaw:0});};true`);
  await waitFor("q.h&&q.cars?.length");await js("Object.assign(q.h,{x:151,z:-27});true");await tap("KeyE");
  await waitFor("q.car?.kind==='coupe'",22000);
  await js("q.blocker=q.cars.find(v=>v!==q.car&&!v.path&&!v.serviceCar&&!v.meetCar&&!v.guestId&&['coupe','hatch','sedan'].includes(v.kind));q.place(q.blocker,144,74);true");
  for(let i=0;i<8&&(await js("q.heat||0"))<5;i++){
    await js("q.place(q.blocker,144,74);q.place(q.car,144,61);true");
    await waitFor("q.car.z<62");await new Promise(r=>setTimeout(r,240));
    await js("q.car.vz=q.car.speed=15");await key("keyDown","KeyW");
    try{await waitFor("q.car.z>68",12000);}finally{await key("keyUp","KeyW");}
    await new Promise(r=>setTimeout(r,720));
  }
  assert.equal(await js("q.heat"),5,"Five distinct vehicle impacts escalate to Air One");
  await js("q.place(q.blocker,72,109);q.place(q.car,144,77);q.car.speed=q.car.vz=8;true");
  await js(`q.cruising=true;requestAnimationFrame(function cruise(){
    if(!q.cruising||!q.car)return;
    const throttle=q.car.speed<8;
    if(throttle!==!!q.throttle){q.throttle=throttle;dispatchEvent(new KeyboardEvent(throttle?'keydown':'keyup',{code:'KeyW',key:'w'}));}
    requestAnimationFrame(cruise);
  });true`);
  try{await waitFor("q.reel?.take?.samples.length>=9",24000);}
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
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS five-star collision pursuit, moving Air One camera, escaped search, archived replay, scrub and last-seen map pin",mode,clip.frames.length);
};
