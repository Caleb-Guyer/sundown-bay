const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const nextStep=require("./sidewalk.cjs");

module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const held=new Set(),sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
  async function hold(codes){
    for(const k of held)if(!codes.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of codes)if(!held.has(k)){await key("keyDown",k);held.add(k);}
  }
  async function walkTo(target,r){
    const end=Date.now()+105000;let st;
    while(Date.now()<end){
      st=await js(`(()=>{const p=nav.map.player,t=(${target});if(!t)return {missing:true};
        if(Math.hypot(t.x-p.x,t.z-p.z)<${r})return {done:true};
        const q=nav.nextStep(p,t,${r}*.87,nav.map),dx=q.x-p.x,dz=q.z-p.z,h=nav.yaw;
        return {f:dx*Math.sin(h)+dz*Math.cos(h),s:dx*Math.cos(h)-dz*Math.sin(h),d:Math.hypot(dx,dz),x:p.x,z:p.z,tx:t.x,tz:t.z};
      })()`);
      if(st.done||st.missing){await hold([]);return !!st.done;}
      const codes=[];if(Math.abs(st.f)>st.d*.3)codes.push(st.f>0?"KeyW":"KeyS");if(Math.abs(st.s)>st.d*.3)codes.push(st.s>0?"KeyD":"KeyA");
      await hold(codes);await sleep(75);
    }
    throw Error("Walk stalled "+JSON.stringify(st));
  }
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:89});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  const row=t=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(t)+")";
  try{
    await js(`window.nav={nextStep:${nextStep.toString()},phases:new Set()};
      const paint=drawBayMap;window.drawBayMap=function(c,o){if(o.mode==='radar'){nav.map=o;nav.st=o.pavement;nav.p=o.pavement.props[0];if(o.streetCar)nav.car=o.streetCar;}return paint(c,o);};
      const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const r=cam.apply(this,a);nav.yaw=this.yaw;return r;};
      const fn=BayPavement.Street.prototype.attendants;BayPavement.Street.prototype.attendants=function(...args){
        const ret=fn.apply(this,args),p=this.props[0];nav.phases.add(p.phase);if(p.worker.bit)nav.workerCarried=true;return ret;};`);
    await waitFor("window.nav?.p&&Number.isFinite(nav.yaw)");
    await tap("KeyE");await waitFor("nav.map.player.driving",35000);await hold(["KeyW"]);
    await waitFor("nav.p.phase==='moving'||nav.p.phase==='down'",55000);
    await waitFor("nav.car.z>-5.1||nav.car.speed<1",16000);await hold(["KeyS"]);
    await waitFor("Math.abs(nav.car.speed)<1.5",16000);await hold([]);await snap("spill");
    assert.equal(await js("nav.st.bits.filter(b=>b.p===nav.p).length"),4);
    await tap("KeyE");await waitFor("!nav.map.player.driving",18000);
    await waitFor("nav.st.bits.some(b=>b.rest)",22000);
    const loose="nav.st.bits.filter(b=>b.p===nav.p&&b.rest&&!b.carrier&&Math.hypot(b.x-nav.p.x,b.z-nav.p.z)>2.35).sort((a,b)=>Math.hypot(a.x-nav.map.player.x,a.z-nav.map.player.z)-Math.hypot(b.x-nav.map.player.x,b.z-nav.map.player.z))[0]";
    if(await walkTo(loose,1.32)){await tap("KeyL");}
    if(await js("!!nav.st.hand")){
      await tap("KeyF");await waitFor("document.querySelector('.bay-front-page')");await tap("Escape");
      await waitFor("nav.p.phase==='upright'",70000);await walkTo("nav.p",1.5);await tap("KeyL");await waitFor("!nav.st.hand");
    }
    await waitFor("nav.p.phase==='upright'&&nav.p.stock===4&&nav.workerCarried",175000);
    await walkTo("nav.p",1.45);await tap("KeyF");await waitFor("document.querySelector('.bay-front-page')");
    const page="document.querySelector('.bay-front-page')",paper=await js(page+".toDataURL()");
    assert(paper.length>15000);assert(await js(page+".getAttribute('aria-label').includes('The Last Pelican')"));await snap("broadsheet");
    await js(row("Fold a copy for later")+".click()");await waitFor("JSON.parse(localStorage.getItem(BayPavement.archiveKey))?.length===1");
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayPavement==='object'");
    await js("document.querySelector('#play').click()");await tap("KeyJ");await waitFor(row("Folded copies"));await js(row("Folded copies")+".click()");
    assert.equal(await js(page+".toDataURL()"),paper);assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    // A returning driver's parked coupe on North Boardwalk. Drive from the saved
    // spot using the same controls, observing the worker and the five loose oranges.
    await js(`(() => {
      const u=new BaySecondUnit.Unit();u.met=true;
      u.remember({x:151.57,z:80,yaw:0},{garageKey:"coupe@149.00,-22.80"});u.save();
    })()`);
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayPavement==='object'");
    await js(`window.fruitTest={hop:0,spilled:0};
      const work=BayPavement.Street.prototype.attendants;
      BayPavement.Street.prototype.attendants=function(...a){const res=work.apply(this,a),p=this.props.find(p=>p.id==='boardwalk');
        fruitTest.hop=Math.max(fruitTest.hop,p.worker.startle?.lift||0);
        const loose=this.bits.filter(b=>b.p===p&&b.kind==='orange');fruitTest.spilled=Math.max(fruitTest.spilled,loose.length);
        fruitTest.rest=loose.filter(b=>b.rest).length;return res;};
      document.querySelector('#play').click();`);
    await waitFor("!document.querySelector('#hud').hidden");await hold(["KeyW"]);
    await waitFor("fruitTest.spilled===5&&fruitTest.hop>.12",50000);await hold([]);
    await snap("fruit");await waitFor("fruitTest.rest>=3",35000);
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"news box spill, real restock, daily and folded paper; five bouncing oranges and a Boardwalk vendor jumping clear. Audio starts 0, cursor locks 0.");
  }catch(err){
    const state=await js("window.nav?.p&&JSON.stringify({p:[nav.p.x,nav.p.z,nav.p.phase,nav.p.stock],w:[nav.p.worker.x,nav.p.worker.z],bits:nav.st.bits.map(b=>[b.x,b.z,b.rest,!!b.carrier]),held:!!nav.st.hand,at:nav.map.player.x+','+nav.map.player.z,hint:document.querySelector('#context').innerText,car:nav.car&&[nav.car.x,nav.car.z,nav.car.speed]})");
    throw Error(err.message+" Playtest state "+state);
  }finally{await hold([]);}
};
