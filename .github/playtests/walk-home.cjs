const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function walkHome({js,send,waitFor,tap,key,mode,errors}){
  const port=mode==="street",route=port?"port":"luna",book="JSON.parse(localStorage.getItem(BayWalkHome.key)||'{}')";
  async function shot(name){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-record-home-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function wait(expr,ms){
    try{await waitFor(expr,ms);}catch(err){
      console.log("Playtest state",await js(`(()=>{const q=window.homeQA||{},r=q.r,a=r?.jules;return JSON.stringify({stage:r?.stage,book:r?.book,
        a:a&&[a.x,a.z],h:q.h&&[q.h.x,q.h.z],car:q.car&&[q.car.kind,q.car.x,q.car.z,q.car.speed],context:document.querySelector('#context')?.textContent,
        objective:document.querySelector('#objectiveText')?.textContent,scene:document.querySelector('#chapterLine')?.textContent});})()`));throw err;
    }
  }
  async function launch(){
    await js("window.homeReloadMarker=true");await send("Page.reload");await wait("!window.homeReloadMarker&&document.readyState==='complete'&&typeof BayWalkHome==='object'");
    await js(`window.homeQA={held:new Set()};const q=homeQA;
      const walk=BayWalkHome.Walk.prototype.step;BayWalkHome.Walk.prototype.step=function(dt,e){
        q.r=this;const out=walk.apply(this,arguments);
        if(this.jules.crossing?.entered)q.crossed=true;if(this.jules.crossing&&!this.jules.crossing.entered)q.waited=true;
        if(this.car?.passengerDoor>.52)q.door=true;return out;};
      const rescue=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){q.h=e.hero;q.floor=e.ground;return rescue.apply(this,arguments);};
      const traffic=BayLocals.animatePeople;BayLocals.animatePeople=function(p,dt,driver,cars){q.car=driver;q.cars=cars;return traffic.apply(this,arguments);};
      const camera=BayCamera.prototype.update;BayCamera.prototype.update=function(){q.rig=this;return camera.apply(this,arguments);};
      q.at=(p,x,z)=>Object.assign(p,{x,z,y:q.floor(x,z)});
      function follow(){
        const want=new Set();
        if(q.follow&&q.r?.jules&&q.rig){
          const a=q.r.jules,h=q.h,dx=a.x-h.x,dz=a.z-h.z,y=q.rig.yaw,c=Math.cos(y),s=Math.sin(y),f=dx*s+dz*c,r=dx*c-dz*s;
          if(Math.hypot(dx,dz)>1.85){
            const gate=Math.max(Math.abs(f),Math.abs(r))*.46;if(Math.abs(f)>gate)want.add(f>0?'KeyW':'KeyS');
            if(Math.abs(r)>gate)want.add(r>0?'KeyD':'KeyA');}
        }
        for(const k of q.held)if(!want.has(k))dispatchEvent(new KeyboardEvent('keyup',{code:k}));
        for(const k of want)if(!q.held.has(k))dispatchEvent(new KeyboardEvent('keydown',{code:k}));q.held=want;requestAnimationFrame(follow);
      }requestAnimationFrame(follow);
      document.querySelector('#play').click();true`);
    await wait("q.h&&q.cars?.length&&q.rig");
  }
  // A payroll receipt from the version before this encounter is enough to open it.
  await send("Page.addScriptToEvaluateOnNewDocument",{source:`if(!sessionStorage.getItem('homeFixture')){
    const old=JSON.parse(localStorage.getItem('sundownBay.v1')||'{}');old.collection={last:'${route}',${route}:1,print:1};
    localStorage.setItem('sundownBay.v1',JSON.stringify(old));sessionStorage.setItem('homeFixture','1');}`});
  await launch();await wait("q.r?.book");
  if(port){
    await js("q.at(q.h,151,-27);true");await tap("KeyE");await wait("q.car?.kind==='coupe'",22000);
    await js("q.at(q.car,18,68.8);q.car.yaw=Math.PI/2;BayDriving.settle(q.car);true");await tap("KeyH");
    await wait("document.querySelector('#speech').textContent.includes('How much')");assert.equal(await js("q.r.stage"),"walk");
    await tap("KeyE");await wait("!q.car&&document.querySelector('#mode').textContent==='On foot'",20000);
  }
  await js("q.at(q.h,q.r.jules.x-.55,q.r.jules.z+1);q.rig.reset(q.h);true");
  await wait("document.querySelector('#context').textContent.includes('Walk with Romy')");await tap("KeyF");
  await wait(book+".joined");await shot("sidewalk");
  if(port){
    await tap("KeyH");await wait(book+".told");await js("q.at(q.h,18.2,66.8);true");await tap("KeyE");await wait("q.car?.kind==='coupe'",22000);
    await js("q.at(q.car,q.r.jules.x+1,68.7);q.car.yaw=Math.PI/2;BayDriving.settle(q.car);true");
    await wait("document.querySelector('#context').textContent.includes('Offer Romy')");await tap("KeyH");await wait("q.r.stage==='ride'&&q.door",25000);await shot("lift");
    await js("q.at(q.car,149,-28);q.car.yaw=0;BayDriving.settle(q.car);true");await wait("q.r.stage==='door'",25000);
    await tap("KeyE");await wait("!q.car&&document.querySelector('#mode').textContent==='On foot'",22000);await js("q.at(q.h,153.05,-29.5);true");
  }else{
    await js("q.follow=true");await wait("q.waited",85000);await shot("crossing");await wait("q.r.stage==='door'",240000);
    await js("q.follow=false");assert(await js("q.crossed"));
  }
  await wait("document.querySelector('#context').textContent.includes('Meet Romy at the laundry door')");await tap("KeyF");
  await wait("document.querySelector('#chapterTitle').textContent==='The Long Way Home'");
  await shot("door");await wait("!document.querySelector('#chapterInsert').hidden");await shot("fob");await tap("Enter");
  assert.equal(await js(book+".ending"),port?"ride":"walk");assert(await js(book+".spare"));
  await launch();await wait("q.cars.some(v=>v.kind==='estate'&&v.kept&&v.garageKey==='estate@149.10,-49.00')");
  await js("q.w=q.cars.find(v=>v.garageKey==='estate@149.10,-49.00');const p=BayDriving.world(q.w,-1.65,0);q.at(q.h,p.x,p.z);q.rig.reset(q.h);true");
  await tap("KeyE");await wait("q.car===q.w",22000);const z=await js("q.car.z");
  await key("keyDown","KeyW");try{await wait("Math.abs(q.car.z-("+z+"))>8",12000);}finally{await key("keyUp","KeyW");}
  await shot("wagon");assert.equal(await js("q.cars.filter(v=>v.garageKey===q.w.garageKey).length"),1);
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS The Long Way Home",mode,route,port?"honest answer, passenger lift":"entire walk, crossing signal","laundry scene, saved owner key and drivable estate after reload");
};
