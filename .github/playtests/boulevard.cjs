const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,key,tap,errors,mode})=>{
  const savedKey="sundownBay.secondUnit.v1";
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const folder=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(folder,{recursive:true});
    fs.writeFileSync(path.join(folder,mode+"-lanes-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function load(x,z,yaw){
    const returning=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;
      u.remember({x:${x},z:${z},yaw:${yaw}},{garageKey:"coupe@149.00,-22.80"});u.save();return localStorage.getItem("${savedKey}");})()`);
    const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem("+JSON.stringify(savedKey)+","+JSON.stringify(returning)+");"});
    try{
      await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayBoulevardLanes==='object'");
      await js(`window.road={left:false,right:false,touched:false,entered:false,flashed:false,litFrames:0};
        const draw=drawBayMap;window.drawBayMap=function(c,o){if(o.mode==='radar'&&o.streetCar){road.map=o;road.car=o.streetCar;}else if(o.streetCar)road.streetMap=o;return draw(c,o);};
        const glance=BayDriversView.prototype.glanceToward,sample=BayDriversView.prototype.sampleRear;
        BayDriversView.prototype.glanceToward=function(...args){glance.apply(this,args);road.glance=this.glance;};
        BayDriversView.prototype.sampleRear=function(...args){road.reflecting=this.lens;try{return sample.apply(this,args);}finally{road.reflecting=null;}};
        const original=BayBoulevardLanes.update;BayBoulevardLanes.update=function(v,ctx){
          const s=original(v,ctx),p=ctx.player;if(!s||!p)return s;
          if(s.change?.obstacle===p)road.passer=v;
          if(road.passer===v){
            if(s.signal===-1)road.left=true;
            if(road.left&&v.x>p.x+4&&s.signal===1)road.right=true;
            if(road.right&&s.lane>2.5&&!s.change)road.returned=true;
            if(Math.abs(v.x-p.x)<2){road.beside=true;road.separation=Math.abs(v.z-p.z);}
            road.touched||=!!BayDriving.contact(v,p);
          }
          if(s.yield?.player===p){
            road.friend=v;road.friendAt??=ctx.time;road.issuedSpeed??=v.speed;
            road.slowest=Math.min(road.slowest??99,v.speed);road.flashed||=BayBoulevardLanes.flash(v,ctx.time);
            road.entered||=s.yield.entered;
          }
          if(road.friend===v){road.clock=ctx.time;road.touched||=!!BayDriving.contact(v,p);if(road.entered&&!s.yield)road.resumed=true;}
          return s;};
        const art=BayStreetCars.${mode==="street"?"world":"map"};
        BayStreetCars.${mode==="street"?"world":"map"}=function(...args){
          const start=args[0].length,r=art(...args);${mode==="street"?"if(args[2]===road.friend&&road.reflecting===-1&&args[0].slice(start).some(a=>a[0]==='registry/flash/'+args[2].kind))road.litFrames++;":"if(args[1]===road.friend&&road.glance<-.9&&BayBoulevardLanes.flash(args[1],args[5]))road.litFrames++;"}return r;};
        document.querySelector('#play').click();`);
      await waitFor("road.car?.garageKey==='coupe@149.00,-22.80'");
    }finally{await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});}
  }
  try{
    // The hatch and the other motorists begin on the live city's usual circuits.
    await load(53,-5.12,Math.PI/2);await key("keyDown","Space");await key("keyDown","KeyV");
    await waitFor("road.left&&road.passer.x>road.car.x-7",50000);await snap("approach");
    await key("keyUp","KeyV");await waitFor("road.beside&&road.passer.x>road.car.x+2",40000);await snap("pass");
    await waitFor("road.returned",75000);await key("keyUp","Space");
    assert(await js("road.separation>2.2&&!road.touched"));assert.equal(await js("audioStarts+cursorRequests"),0);
    // On Ocean, pull out from a real returning driver's spot using only the driving controls.
    await load(149.45,-24.6,0);await tap("KeyZ");await tap("Comma");await waitFor("road.car.indicator===-1");
    await key("keyDown","ShiftLeft");await key("keyDown","Period");await waitFor("road.glance>.99&&road.car.indicator===-1");await snap("mirror-right");
    await key("keyUp","Period");await key("keyDown","Comma");await waitFor("road.glance<-.99&&road.car.indicator===-1");
    await waitFor("!!BayBoulevardLanes.candidate(road.car,road.map.cars,road.map.time)",45000);await tap("KeyH");await waitFor("!!road.friend&&road.litFrames>0");
    await snap("mirror-left");await key("keyUp","Comma");await key("keyUp","ShiftLeft");await waitFor("road.glance===0&&road.clock-road.friendAt>1.0");
    await js(`(()=>{const held=new Set();function set(next){
        for(const k of held)if(!next.includes(k)){dispatchEvent(new KeyboardEvent('keyup',{code:k,bubbles:true}));held.delete(k);}
        for(const k of next)if(!held.has(k)){dispatchEvent(new KeyboardEvent('keydown',{code:k,bubbles:true,cancelable:true}));held.add(k);}}
      function steer(){const v=road.car;
        if(road.clock-road.friendAt>16){set([]);return;}
        if(road.resumed&&Math.abs(v.x-146.5)<.6&&Math.cos(v.yaw)>.985)road.braking=true;
        if(road.braking&&Math.abs(v.speed)<.45){set([]);road.parked=true;return;}
        const aim=Math.min(.43,Math.max(-.43,(146.5-v.x)*.32)),delta=Math.atan2(Math.sin(aim-v.yaw),Math.cos(aim-v.yaw))-(v.yawRate||0)*.22;
        const next=[];if(road.braking)next.push('Space');else if(v.speed<6.4)next.push('KeyW');
        if(Math.abs(delta)>.028)next.push(delta<0?'KeyA':'KeyD');set(next);requestAnimationFrame(steer);}
      steer();})();`);
    await waitFor("road.parked&&road.car.indicator===0",50000);await snap("merged");
    const result=await js("({yielded:road.issuedSpeed-road.slowest,flashed:road.flashed,litFrames:road.litFrames,touched:road.touched,x:road.car.x,heading:road.car.yaw})");
    assert(result.yielded>.35&&result.flashed&&!result.touched);assert(Math.abs(result.x-146.5)<1.1);assert.deepEqual(errors,[]);
    console.log("PASS",mode,"a regular Tideway hatch signalled out around a stopped coupe, passed beside it, and rejoined the outer lane. On Ocean Drive a motorist flashed twice, slowed for the player's signal and horn, and released the gap after the keyboard merge.",result,"Audio starts 0, cursor locks 0.");
  }catch(e){
    console.log("Boulevard state",await js("JSON.stringify({car:window.road?.car&&[road.car.x,road.car.z,road.car.yaw,road.car.indicator],pass:window.road?.passer&&[road.passer.id,road.passer.x,road.passer.z,road.left,road.right,road.returned],friend:window.road?.friend&&[road.friend.id,road.friend.x,road.friend.z,road.clock-road.friendAt,road.entered,road.resumed,road.slowest,road.litFrames],hint:document.querySelector('#context').innerText})"));await snap("failure");throw e;
  }finally{for(const code of ["Space","KeyW","KeyS","KeyA","KeyD","KeyV","Comma","Period","ShiftLeft"])await key("keyUp",code);}
};
