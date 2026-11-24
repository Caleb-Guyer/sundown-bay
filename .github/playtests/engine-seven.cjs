const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const nextStep=require("./sidewalk.cjs"),pilot=require("./road-driver.cjs");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const keys=new Set(),sleep=ms=>new Promise(f=>setTimeout(f,ms)),driver=mode==="overhead";
  const record="JSON.parse(localStorage.getItem('sundownBay.v1')||'{}')";
  const row=label=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(label)+")";
  async function hold(codes){
    for(const c of keys)if(!codes.includes(c)){await key("keyUp",c);keys.delete(c);}
    for(const c of codes)if(!keys.has(c)){await key("keyDown",c);keys.add(c);}
  }
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:89}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function observe(){
    await js(`window.nav={nextStep:${nextStep.toString()},pilot:${pilot.toString()},yielded:new Set(),phases:new Set()};
      const dm=drawBayMap;window.drawBayMap=(ctx,o)=>{if(o.mode==='radar'){nav.map=o;nav.car=o.streetCar;for(const v of o.cars)if(v.sevenYield)nav.yielded.add(v.id);}return dm(ctx,o);};
      const u=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const r=u.apply(this,a);nav.yaw=this.yaw;return r;};
      const st=BayEngineSeven.Company.prototype.step;BayEngineSeven.Company.prototype.step=function(...a){nav.co=this;const r=st.apply(this,a);nav.phases.add(this.phase);if(this.water)nav.flowed=true;return r;};`);
  }
  async function reload(){await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayEngineSeven==='object'");await observe();
    await js("document.querySelector('#play').click()");await waitFor("nav.co&&nav.map&&Number.isFinite(nav.yaw)",26000);}
  async function walk(target,r){
    const end=Date.now()+100000;let st;
    while(Date.now()<end){
      st=await js(`(()=>{const p=nav.map.player,t=(${target});if(Math.hypot(p.x-t.x,p.z-t.z)<${r})return {done:true};
        const q=nav.nextStep(p,t,${r}*.94,nav.map),dx=q.x-p.x,dz=q.z-p.z,h=nav.yaw;
        return {f:dx*Math.sin(h)+dz*Math.cos(h),s:dx*Math.cos(h)-dz*Math.sin(h),d:Math.hypot(dx,dz),p:[p.x,p.z],t:[t.x,t.z]};})()`);
      if(st.done){await hold([]);return;}
      const c=[];if(Math.abs(st.f)>st.d*.35)c.push(st.f>0?"KeyW":"KeyS");if(Math.abs(st.s)>st.d*.35)c.push(st.s>0?"KeyD":"KeyA");
      await hold(c);await sleep(75);
    }
    throw Error("Walk stalled "+JSON.stringify(st));
  }
  try{
    if(driver){
      await js("(()=>{const u=new BaySecondUnit.Unit();u.met=true;u.remember(BayEngineSeven.desk,null);u.save();})()");await reload();
      await tap("KeyF");await waitFor(row("Marlin laundry cart"));await js(row("Marlin laundry cart")+".click()");
      await waitFor("nav.co.manual");await walk("BayDriving.world(nav.co.v,-1.95,1.38)",1);
      await tap("KeyE");await waitFor("nav.car?.kind==='pumper'&&nav.map.player.driving",40000);
      await tap("KeyH");assert(await js("nav.co.v.responseLights"));await snap("station");
      const end=Date.now()+230000;let parked=false;
      while(Date.now()<end){
        const input=await js(`(()=>{const c=nav.co,v=c.v;if(c.canPark())return ['park'];if(Math.hypot(v.x-c.call.road.x,v.z-c.call.road.z)<5)return ['Space'];
          return nav.pilot(v,c.line,c.call.road,true,nav.map.cars);})()`);
        if(input.includes("park")){parked=true;break;}
        await hold(input);await sleep(70);
      }
      await hold([]);assert(parked,"The driver reached the call");await tap("KeyF");await waitFor("nav.co.phase==='unroll'||nav.co.phase==='working'");
      await tap("KeyE");await waitFor("!nav.map.player.driving",30000);
    }else{
      await observe();await waitFor("nav.map&&nav.co&&Number.isFinite(nav.yaw)");
      await tap("KeyE");await waitFor("nav.car?.kind==='coupe'&&nav.map.player.driving",35000);
      await tap("KeyE");await waitFor("!nav.map.player.driving&&document.querySelector('#context').innerText.indexOf('Step out')<0",30000);
    }
    await walk("BayEngineSeven.calls[0].stand",1);
    await waitFor("nav.co.phase==='working'",140000);await waitFor("document.querySelector('#context').innerText.includes('branch line')",18000);
    await snap("seven-arrival");await tap("KeyF");await waitFor("nav.co.holding",15000);
    for(const target of [-1,0,1]){
      const before=await js("nav.co.aimX"),s=target<before?"KeyA":"KeyD";
      await hold(["Space",s]);await waitFor("nav.co.aimX"+(s==="KeyA"?"<=":">=")+(target+(s==="KeyA"?.06:-.06)),12000);await hold(["Space"]);
      if(target===-1){await waitFor("!!nav.co.water",18000);await snap("branch");}
      await waitFor("nav.co.levels["+(target+1)+"]<.001",40000);
    }
    await hold([]);await waitFor(record+".engineSeven?.log?.length>0",15000);
    assert.equal(await js(record+".engineSeven.log.at(-1).fee"),105);
    assert(await js("nav.flowed&&nav.phases.has('outbound')&&nav.phases.has('unroll')&&nav.phases.has('working')"));
    if(!driver)assert(await js("nav.yielded.size>0"),"civilian traffic made room");
    await tap("KeyJ");await waitFor(row("Engine 7 daybook"));await js(row("Engine 7 daybook")+".click()");
    await waitFor("document.querySelector('.company-return')?.width>400");await snap("daybook");
    const docket=await js("document.querySelector('.company-return').toDataURL()");await reload();
    await tap("KeyJ");await waitFor(row("Engine 7 daybook"));await js(row("Engine 7 daybook")+".click()");
    assert.equal(await js("document.querySelector('.company-return').toDataURL()"),docket);
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,driver?"signed on, drove Engine 7 on city streets and set the pump brake":"watched a real crew respond from the Marlin, with civilian drivers yielding","; carried line, swept three pockets, earned $105 and read the same return slip after reload. Audio starts 0, cursor locks 0.");
  }catch(e){
    console.log("Playtest state",await js("JSON.stringify({p:nav.map&&[nav.map.player.x,nav.map.player.z],v:nav.co&&[nav.co.v.x,nav.co.v.z,nav.co.v.speed,nav.co.v.yaw],phase:nav.co?.phase,m:nav.co?.manual,lead:nav.co?.mate,fire:nav.co?.levels,held:nav.co?.holding,aim:nav.co?.aimX,hint:document.querySelector('#context').innerText,toast:document.querySelector('#toast').innerText,errors:0})"));
    await snap("seven-failure");throw e;
  }finally{await hold([]);}
};
