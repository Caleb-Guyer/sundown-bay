const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const nextStep=require("./sidewalk.cjs");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const held=new Set(),sleep=ms=>new Promise(ok=>setTimeout(ok,ms));
  async function hold(codes){
    for(const k of held)if(!codes.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of codes)if(!held.has(k)){await key("keyDown",k);held.add(k);}
  }
  async function observe(){
    await js(`window.nav={nextStep:${nextStep.toString()},films:new Set(),stamps:new Set()};
      const draw=drawBayMap;window.drawBayMap=(c,o)=>{if(o.mode==='radar'){nav.map=o;if(o.streetCar)nav.car=o.streetCar;}return draw(c,o);};
      const update=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const r=update.apply(this,a);nav.yaw=this.yaw;return r;};
      const step=BayStarlite.Theatre.prototype.step;BayStarlite.Theatre.prototype.step=function(...a){nav.theatre=this;return step.apply(this,a);};
      const art=BayStarliteArt;window.BayStarliteArt={...art,
        screen(v,s,c,n){if(v.gl&&c){nav.stamps.add(n);nav.billboard=c;}return art.screen(v,s,c,n);},
        overhead(ctx,x,z,scale,s,t,lit,c,...rest){if(c){nav.stamps.add(nav.theatre?.version);nav.billboard=c;}return art.overhead(ctx,x,z,scale,s,t,lit,c,...rest);}
      };`);
  }
  const saved="JSON.parse(localStorage.getItem('sundownBay.v1')||'{}')";
  async function walk(x,z,r){
    const end=Date.now()+90000;let st;
    while(Date.now()<end){
      st=await js(`(()=>{const p=nav.map.player,t={x:${x},z:${z}};if(Math.hypot(p.x-t.x,p.z-t.z)<${r})return {done:true};
        const q=nav.nextStep(p,t,${r}*.92,nav.map),dx=q.x-p.x,dz=q.z-p.z,h=nav.yaw;
        return {f:dx*Math.sin(h)+dz*Math.cos(h),s:dx*Math.cos(h)-dz*Math.sin(h),d:Math.hypot(dx,dz),x:p.x,z:p.z};})()`);
      if(st.done){await hold([]);return;}
      const c=[];if(Math.abs(st.f)>st.d*.34)c.push(st.f>0?"KeyW":"KeyS");if(Math.abs(st.s)>st.d*.34)c.push(st.s>0?"KeyD":"KeyA");
      await hold(c);await sleep(80);
    }
    throw Error("Walk stalled "+JSON.stringify(st));
  }
  async function snap(name){if(!process.argv.includes("--frames"))return;const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:89});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-"+name+".jpg"),Buffer.from(data,"base64"));}
  async function reload(){await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayStarlite==='object'");await observe();
    await js("document.querySelector('#play').click()");await waitFor("window.nav?.map&&nav.theatre");}
  const row=name=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(name)+")";
  try{
    await observe();await waitFor("nav.map&&Number.isFinite(nav.yaw)");
    await walk(151.1,-38,1.1);await tap("KeyE");await waitFor("nav.car?.kind==='caleta'&&nav.map.player.driving",40000);
    await tap("KeyO");await waitFor("nav.car.softTop>.38&&nav.car.softTop<.88",35000);await snap("spider");
    await waitFor("nav.car.softTop===1",20000);await tap("KeyZ");await snap("spider-cabin");await tap("KeyZ");
    // Use the two-lead parking save for the second leg. Arrive under power
    // through the open lane from Gantry Street and brake beside speaker two.
    await js("(()=>{const u=new BaySecondUnit.Unit();u.met=true;u.remember({x:90,z:-60.05,yaw:0},{garageKey:'caleta@149.00,-38.00'});u.save();})()");
    await reload();await waitFor("nav.car?.kind==='caleta'&&Math.abs(nav.car.x-90)<1&&nav.car.softTop===1",30000);
    await hold(["KeyW"]);await waitFor("nav.car.z>-59.55",30000);await hold(["Space"]);await waitFor("Math.abs(nav.car.speed)<.3",20000);await hold([]);
    await tap("KeyO");await waitFor("nav.car.softTop===0",25000);await tap("KeyF");await waitFor("nav.theatre.visit?.bay===2",18000);
    await waitFor("nav.billboard&&nav.stamps.size>=3",35000);const pixel=await js("nav.billboard.toDataURL()");
    await waitFor(saved+".starlite?.tickets?.length>0",35000);
    assert.notEqual(await js("nav.billboard.toDataURL()"),pixel);await snap("starlite");
    await tap("KeyF");await waitFor("!nav.theatre.visit");await tap("KeyE");await waitFor("!nav.map.player.driving",30000);
    await waitFor("Number.isFinite(nav.yaw)");await walk(84.17,-60.77,1.5);await tap("KeyF");
    await waitFor(row("The Last Pelican"));await js(row("The Last Pelican")+".click()");await waitFor("nav.theatre.run?.id==='pelican'");
    const wallet=await js(saved+".wallet");
    await waitFor("nav.theatre.run.cue==='motor'",45000);await tap("Space");await waitFor("nav.theatre.run.motor>.9",25000);
    await snap("changeover");await waitFor("nav.theatre.run.cue==='change'",45000);await tap("KeyF");await waitFor("nav.theatre.run.done");
    assert(await js("nav.theatre.run.switched"));assert.equal(await js(saved+".wallet"),wallet+65);
    await tap("KeyE");await tap("KeyJ");await waitFor(row("Starlite ticket stubs"));await js(row("Starlite ticket stubs")+".click()");
    await waitFor("document.querySelector('.starlite-ticket')?.width>300");await snap("admit");const ticket=await js("document.querySelector('.starlite-ticket').toDataURL()");
    await reload();await tap("KeyJ");await waitFor(row("Starlite ticket stubs"));await js(row("Starlite ticket stubs")+".click()");
    assert.equal(await js("document.querySelector('.starlite-ticket').toDataURL()"),ticket);
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"street entry, moving fabric top, driver seat, approach to bay two, moving 16 mm film, two-projector changeover, $65 fee and ticket surviving reload. Audio starts 0, cursor locks 0.");
  }catch(err){
    const st=await js("window.nav&&JSON.stringify({pos:nav.map&&[nav.map.player.x,nav.map.player.z],car:nav.car&&[nav.car.kind,nav.car.x,nav.car.z,nav.car.speed,nav.car.softTop],r:nav.theatre?.run,hint:document.querySelector('#context').innerText,toast:document.querySelector('#toast').innerText,panel:document.querySelector('#panel').innerText.slice(0,250),errors:0})");
    console.log("Playtest state",st);await snap("starlite-failure");throw err;
  }finally{await hold([]);}
};
