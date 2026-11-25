const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const nextStep=require("./sidewalk.cjs");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const sleeve="JSON.parse(localStorage.getItem(BayHouseLights.key)||'{}')";
  const bank="JSON.parse(localStorage.getItem('sundownBay.v1')||'{}')";
  const selected=new Set(),pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  const row=title=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(title)+")";
  async function click(title){const q=row(title);await waitFor(q);await js(q+".click()");}
  async function hold(codes){
    for(const c of selected)if(!codes.includes(c)){await key("keyUp",c);selected.delete(c);}
    for(const c of codes)if(!selected.has(c)){await key("keyDown",c);selected.add(c);}
  }
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:87}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-house-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function load(){
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayHouseLights==='object'");
    await js(`window.proof={next:${nextStep.toString()}};
      const paint=drawBayMap; window.drawBayMap=(g,o)=>{if(o.mode==='radar')proof.map=o;return paint(g,o);};
      const update=BayCamera.prototype.update;BayCamera.prototype.update=function(...args){const r=update.apply(this,args);proof.yaw=this.yaw;return r;};
      const updateRoom=BayCineRoom.move;BayCineRoom.move=function(r,...args){proof.room=r;return updateRoom(r,...args);};
      const grade=BaySecondUnit.grade;BaySecondUnit.grade=(...args)=>{const r=grade(...args);proof.subject=r?.id;return r;};
      const film=BayHouseLights.paint;BayHouseLights.paint=(...args)=>{proof.dissolve=args[4];return film(...args);};
      const view=BayView.prototype.updateSun;BayView.prototype.updateSun=function(...args){view.apply(this,args);proof.light={s:this.sunStrength,key:this.sunKey,ok:this.sunTarget?.ok};};
      document.querySelector('#play').click();`);
    await waitFor("proof.map&&Number.isFinite(proof.yaw)");
  }
  async function walk(target,r,inside=false){
    const end=Date.now()+65000;let step;
    while(Date.now()<end){
      step=await js(`(()=>{const t=(${target}),p=${inside?"proof.room":"proof.map.player"},h=${inside?"p.yaw":"proof.yaw"};
        if(Math.hypot(p.x-t.x,p.z-t.z)<${r})return null;const q=${inside?"t":"proof.next(p,t,"+r+",proof.map)"};
        const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);return {f:(dx*Math.sin(h)+dz*Math.cos(h))/d,s:(dx*Math.cos(h)-dz*Math.sin(h))/d,x:p.x,z:p.z};})()`);
      if(!step){await hold([]);return;}
      const codes=[];if(Math.abs(step.f)>.37)codes.push(step.f>0?"KeyW":"KeyS");if(Math.abs(step.s)>.37)codes.push(step.s>0?"KeyD":"KeyA");
      await hold(codes);await pause(70);
    }
    throw Error("Walk stalled "+JSON.stringify(step)+" target "+target);
  }
  const desk="({x:8.65,z:34.8})",corner="({x:-8.1,z:40.6})";
  async function callSheet(){await tap("KeyF");await click("House Lights");}
  async function expose(side){
    await tap("KeyP");await waitFor("!document.querySelector('#scoutFinder').hidden");await tap("KeyF");
    await waitFor("proof.subject==='marquee'");if(side==="night"){await tap("KeyG");await tap("KeyG");}
    await snap(side);await tap("Space");await waitFor(sleeve+"."+side+"?.image.length>1500");
    await tap("KeyP");
  }
  try{
    // A returning character at the folding desk. All travel, waiting and exposures use game controls.
    await js("(()=>{const u=new BaySecondUnit.Unit();u.met=true;u.lead='frankie';u.remember({x:8.65,z:34.8,yaw:0},null);u.save();localStorage.setItem('sundownBay.clock.v1','860');})()");
    await load();await callSheet();await click("Take the assignment");await walk(corner,.72);
    if(mode==="street")assert(await js("proof.light?.ok&&proof.light.s>.7"),"daylight shadow map is complete");
    await expose("day");await walk(desk,.7);await callSheet();await click("Wait for the late show");
    await walk(sleeve+".day",.68);await expose("night");assert.equal(await js(sleeve+".day.image==="+sleeve+".night.image"),false);
    await walk(desk,.7);await callSheet();await click("Thread both exposures");await waitFor("document.querySelector('.luna-proof img:last-child')?.naturalWidth");
    assert.equal(await js(bank+".wallet"),140);await snap("sleeve");await load();
    await tap("KeyJ");await click("House Lights");await waitFor("document.querySelector('.luna-proof img:last-child')?.naturalWidth");await tap("Escape");
    await walk("BayCab.cinema",1.05);await tap("KeyF");await waitFor("proof.room");
    await walk("BayCineRoom.points.program",.89,true);await tap("KeyF");await click("Cue House Lights");
    await walk("({x:0,z:-4.2})",.45,true);await walk("({x:0,z:-2.3})",.36,true);await tap("KeyF");
    await waitFor("proof.room.seated&&proof.dissolve>.3&&proof.dissolve<.95",28000);await snap("screen");
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"walked to the opposite sidewalk, matched two real marquee exposures across shifts, received $140, reopened the stored prints and watched the dissolve from an aisle seat. Zero audio starts and cursor locks.");
  }catch(e){console.log("Playtest state",await js("JSON.stringify({p:proof.map?.player&&[proof.map.player.x,proof.map.player.z],room:proof.room&&[proof.room.x,proof.room.z],hint:document.querySelector('#context').innerText,panel:document.querySelector('#panelBody').innerText.slice(0,230),subject:proof.subject,light:proof.light,dissolve:proof.dissolve})"));await snap("failure");throw e;}
  finally{await hold([]);}
};
