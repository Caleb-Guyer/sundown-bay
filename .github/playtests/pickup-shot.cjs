const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,key,tap,waitFor,mode,errors})=>{
  const selector=name=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.textContent.includes("+JSON.stringify(name)+"))";
  async function click(name){
    const button=selector(name);
    try{await waitFor("!!("+button+")");}catch(error){
      await snap("stopped");
      throw Error(error.message+" · "+await js("JSON.stringify({panel:document.querySelector('#panel').getAttribute('data-screen'),context:document.querySelector('#context').innerText,film:!!BayTakeSplice.negative(),phase:q.run?.phase})"));
    }
    await js(button+".click()");
  }
  async function snap(label){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:90}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-splice-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  async function observe(){
    await js(`window.q={};const rescue=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){q.hero=e.hero;return rescue.apply(this,arguments);};
      const move=BayCineRoom.move;BayCineRoom.move=function(r,...args){q.room=r;return move(r,...args);};
      const program=BayCineProgram;window.BayCineProgram={...program,frame(...args){const f=program.frame(...args);if(q.room){q.id=f.id;q.age=f.elapsed;}return f;}};`);
    await waitFor("!!q.hero");
  }
  const surface="document.querySelector('#panelBody canvas.timing-film')";
  await observe();
  await js(`const spawn=BayNightMeet.Meet.prototype.spawn;BayNightMeet.Meet.prototype.spawn=function(...args){spawn.apply(this,args);q.meet=this;};
    Object.assign(q.hero,{x:-110,z:-14});
    const step=BayTake.Run.prototype.step;BayTake.Run.prototype.step=function(dt,controls){
      q.run=this;step.call(this,dt,controls);
      if(this.role==='jules'&&this.phase==='rolling'&&this.direction().gap<.3){
        for(const type of ['keydown','keyup'])dispatchEvent(new KeyboardEvent(type,{code:'KeyG',bubbles:true,cancelable:true}));
      }
    };`);
  await waitFor("q.meet?.rival");
  await js("Object.assign(q.hero,BayDriving.world(q.meet.rival,1.5,-.4))");
  await waitFor("document.querySelector('#context').textContent.includes('Romy')");await tap("KeyF");await click("Roll cameras");
  await key("keyDown","KeyW");
  try{await waitFor("q.run?.phase==='landed'||q.run?.phase==='miss'",32000);}finally{await key("keyUp","KeyW");}
  assert.equal(await js("q.run.phase"),"landed",await js("q.run.reason"));
  await click("Wrap the shoot");await tap("KeyF");await click("Jules’s cutting bench");
  assert(await js(`[...document.querySelectorAll('#panelBody button,#panelBody input')].every(el=>{
    const r=el.getBoundingClientRect(),p=document.querySelector('#panel').getBoundingClientRect();
    return r.width>0&&r.left>=p.left&&r.right<=p.right&&r.top>=p.top&&r.bottom<=Math.min(p.bottom,innerHeight);
  })`),"Every editing control fits on the initial screen");
  const negative=await js("BayTakeSplice.negative()");assert.equal(negative.pier,mode==="street"?"aboard":"ashore");
  const t=await js("BayTakeSplice.target(BayTakeSplice.negative())");
  await js(`q.seek=n=>{const s=document.querySelector('#panelBody input[type=range]');s.value=n;s.dispatchEvent(new Event('input'));};
    q.seek(${negative.lip});`);
  await snap("curb");await js("q.seek("+t+")");const wide=await js(surface+".toDataURL()");
  await click("Splice here");const close=await js(surface+".toDataURL()");
  await js("q.seek("+negative.frames.at(-1)[0]+")");await snap("truck");assert.notEqual(wide,close);
  await click("Send this cut upstairs");assert.equal(await js("BayTakeSplice.release().at"),t);
  await send("Page.reload",{ignoreCache:true});await waitFor("document.readyState==='complete'&&!!window.BayTakeSplice");
  assert.deepEqual(await js("BayTakeSplice.release().film"),negative);await js("document.querySelector('#play').click()");await observe();
  await js("Object.assign(q.hero,BayCab.cinema)");await tap("KeyF");await waitFor("!!q.room");
  await js("Object.assign(q.room,BayCineRoom.points.program)");await tap("KeyF");await click("Thread your cut");
  await js("Object.assign(q.room,BayCineRoom.points.aisle)");await tap("KeyF");
  await waitFor("q.room.seated&&!q.room.transition&&q.id==='stunt'&&q.age>BayTakeSplice.negative().lip/BayTakeSplice.speed",22000);await snap("house");
  await tap("KeyF");await waitFor("!q.room.seated&&!q.room.transition");
  await js("Object.assign(q.room,BayCineRoom.points.exit)");await tap("KeyF");
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS",mode,"drove both cars, landed",negative.distance,"m, cut",negative.frames.length,"recorded poses at",t,"for",negative.pier,"and watched the saved print in the auditorium");
  // Return to an outdoor save at the old city boundary and walk towards the bend.
  const pose={x:-158,z:-195.7,yaw:-Math.PI/2};
  const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:`{
    const u=JSON.parse(localStorage.getItem('sundownBay.secondUnit.v1')||'{}');
    u.met=true;u.lead='guest';u.guest=${JSON.stringify(pose)};u.motors={};
    localStorage.setItem('sundownBay.secondUnit.v1',JSON.stringify(u));}`});
  await send("Page.reload");await waitFor("document.readyState==='complete'&&!!window.BayCityEdge");
  await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});
  await js("document.querySelector('#play').click()");await observe();
  await waitFor("Math.hypot(q.hero.x+158,q.hero.z+195.7)<1");
  await key("keyDown","KeyW");
  try{await waitFor("Math.hypot(q.hero.x+158,q.hero.z+195.7)>3");}finally{await key("keyUp","KeyW");}
  assert(await js("BayCityEdge.closest(q.hero,true).d<5.8"));
  await snap("canal-bend");await tap("KeyM");await waitFor("document.querySelector('#panelBody canvas')");await snap("canal-map");
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  console.log("PASS",mode,"resumed beyond the former south limit, walked Canal Road and opened the city map");
};
