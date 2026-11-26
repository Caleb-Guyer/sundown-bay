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
  async function click(name){
    const button="[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(name)+")";
    await wait(button);await js(button+".click()");
  }
  await js("BayDriving.settle(q.w);true");await tap("KeyL");
  await wait("document.querySelector('#chapterTitle').textContent==='Rabbit Ears'");
  await wait("!document.querySelector('#chapterInsert').hidden");
  await js("q.sleeveReady=false;requestAnimationFrame(()=>requestAnimationFrame(()=>{q.sleeveReady=true;}));true");
  await wait("q.sleeveReady");
  assert(await js(`(()=>{const actual=document.querySelector('#chapterInsert'),sample=document.createElement('canvas');BayWalkHome.sleeve(sample);
    if(actual.width!==sample.width||actual.height!==sample.height)return false;
    const pixels=c=>c.getContext('2d').getImageData(0,0,c.width,c.height).data,a=pixels(actual),b=pixels(sample);
    return a.every((value,i)=>value===b[i]);})()`),"Marisol’s visor sleeve stays on screen");
  await shot("sleeve");await tap("Enter");
  assert.equal(await js("BayWalkHome.reelState()"),"sleeve");
  await js(`const film=BayWalkHome.movie;BayWalkHome.movie=function(c,t){q.reelTime=t;return film(c,t);};
    q.at(q.w,90,-61);q.w.yaw=0;BayDriving.settle(q.w);true`);
  if(!port)await js(`const atlas=window.drawBayMap;window.drawBayMap=function(c,o){
    const result=atlas.apply(this,arguments);
    if(!q.screenPixels&&c.canvas.id==='overhead'&&o.starliteVisit?.family&&q.reelTime>=7){
      const w=c.canvas.width,h=c.canvas.height,s=o.scale,site=o.starlite,frame=o.starliteFrame();
      const x=w/2+(site.x-o.cx-4.52)*s,y=h/2-(site.z-o.cz+10.09)*s;
      const source=document.createElement('canvas');source.width=w;source.height=h;const ref=source.getContext('2d');
      ref.drawImage(frame,x,y,9.04*s,5.08*s);
      const sample=ctx=>ctx.getImageData(Math.ceil(x)+2,Math.ceil(y)+2,Math.floor(9.04*s)-5,Math.floor(5.08*s)-5).data;
      const a=sample(c),b=sample(ref);let changed=0;
      for(let i=0;i<a.length;i+=4)if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>22)changed++;
      q.screenPixels={count:a.length/4,changed};
    }
    return result;
  };true`);
  await key("keyDown","KeyW");try{await wait("q.w.z>=-59.8",12000);}finally{await key("keyUp","KeyW");}
  await js("BayDriving.settle(q.w);true");await wait("BayStarlite.bay(q.w)===2");await tap("KeyF");
  await wait("q.reelTime>2.5&&q.reelTime<6.5",22000);await shot("rabbit");
  await wait("q.reelTime>=7.2",22000);await shot("hands");
  if(!port){
    const proof=await js("q.screenPixels");assert(proof?.count>3500&&proof.changed<proof.count*.01,JSON.stringify(proof));
    console.log("PASS unobstructed drive-in projection",JSON.stringify(proof));
  }
  await wait("BayWalkHome.reelState()==='screened'",38000);
  await click(port?"Let the Luna show it":"Keep it in the family");
  await launch();await wait("q.h");
  assert.equal(await js("BayWalkHome.reelState()"),port?"luna":"family");
  assert(await js("JSON.parse(localStorage.getItem('sundownBay.v1')).starlite.tickets.some(t=>t.id==='rabbit'&&t.bay===2&&t.plate)"));
  if(await js("!!q.car")){await tap("KeyE");await wait("!q.car&&document.querySelector('#mode').textContent==='On foot'");}
  await js(`const moving=BayCineRoom.move;BayCineRoom.move=function(r,...a){q.room=r;return moving(r,...a);};
    const program=BayCineProgram;window.BayCineProgram={...program,frame(...a){const f=program.frame(...a);q.show=f.id;return f;}};
    q.at(q.h,BayCab.cinema.x,BayCab.cinema.z);true`);
  await tap("KeyF");await wait("q.room&&!q.room.transition");await js("Object.assign(q.room,BayCineRoom.points.program);true");await tap("KeyF");
  await wait("!document.querySelector('#panel').hidden");
  assert.equal(await js("document.querySelector('#panelBody').innerText.includes('Rabbit Ears')"),port);
  if(port){
    await click("Cue Rabbit Ears");await js("Object.assign(q.room,BayCineRoom.points.aisle);true");await tap("KeyF");
    await wait("q.room.seated&&!q.room.transition&&q.show==='rabbit'");await shot("cinema");
  }
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS The Long Way Home",mode,route,port?"honest answer, passenger lift":"entire walk, crossing signal","laundry scene, saved owner key and drivable estate after reload");
  console.log("PASS Rabbit Ears",mode,"visor scene, drive into bay two, projected family film, ticket and",port?"actual Cine Luna screening":"private print absent from public bill","after reload");
};
