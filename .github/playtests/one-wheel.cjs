const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,tap,key,mode,errors})=>{
  const file="JSON.parse(localStorage.getItem('sundownBay.v1'))";
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-one-wheel-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function observe(){
    await js(`window.wheelQA={};const q=wheelQA,step=BaySecondSeat.Fleet.prototype.step;
      BaySecondSeat.Fleet.prototype.step=function(dt,e){q.f=this;q.hero=e.hero;return step.apply(this,arguments);};`);
    await waitFor("wheelQA.hero");
  }
  try{
    // Arrive on foot at a bike parked on Tideway. Only ride controls move it after mounting.
    for(const kind of ["paloma","heron"]){
      if(kind==="heron"){
        await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BaySecondSeat==='object'");
        await js("document.querySelector('#play').click()");
      }
      await observe();
      await js(`q.b=q.f.bikes.find(b=>b.kind===${JSON.stringify(kind)});Object.assign(q.b,{x:24,z:-2.52,yaw:Math.PI/2});
        Object.assign(q.hero,BayMotoRiders.placement(q.b,"pilot",1,0,q.b.y));true`);
      await waitFor("document.querySelector('#context').textContent.includes('Ride the')");await tap("KeyE");await waitFor("q.f.pilot");
      await key("keyDown","KeyW");await waitFor("q.b.speed>5");await key("keyDown","ShiftLeft");
      await js(`q.pulling=true;q.landed=false;q.sampling=true;
        function pull(wanted){if(q.pulling!==wanted){dispatchEvent(new KeyboardEvent(wanted?'keydown':'keyup',{code:'ShiftLeft',bubbles:true,cancelable:true}));q.pulling=wanted;}}
        function feather(){
          const run=q.b.oneWheel;
          if(run){
            q.peak=Math.max(q.peak||0,run.angle);
            if(q.allowLand&&run.metres>34)q.landing=true;
            if(q.landing||run.angle>.62)pull(false);else if(run.angle<.43)pull(true);
          }else if(q.peak){pull(false);q.landed=true;return;}
          if(q.sampling)requestAnimationFrame(feather);
        }feather();`);
      await waitFor("q.peak>.43&&q.b.oneWheel?.metres>4");
      if(kind==="heron")await snap("balance");await js("q.allowLand=true");
      await waitFor("q.landed",20000);await key("keyUp","ShiftLeft");await key("keyUp","KeyW");
      await key("keyDown","Space");await waitFor("q.b.speed<.25");await key("keyUp","Space");
      await tap("KeyE");await waitFor("!q.f.player");
      assert(await js(file+".moto.wheel."+kind+".metres>=34"));assert.equal(await js("audioStarts+cursorRequests"),0);
    }
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BaySecondSeat==='object'");
    await js("document.querySelector('#play').click()");await observe();
    await js("Object.assign(q.hero,BayCoastCamera.site.prints);true");
    await waitFor("document.querySelector('#context').textContent.includes('print window')");
    await tap("KeyF");const button="Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.textContent.includes('Two Pockets'))";
    await waitFor("!!("+button+")");await snap("register");await js(button+".click()");
    await waitFor("document.querySelector('#chapterTitle').textContent==='Two Pockets'");await snap("counter");
    await waitFor("document.querySelector('#chapterLine').textContent.includes('other side of the window')");
    await waitFor("document.querySelector('#chapterFilm').hidden");assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
    console.log("PASS",mode,"both loaner bikes lifted, balanced and landed from keyboard input. Both measured distances survived reload and unlocked Inés’s Two Pockets film at the print window.",await js(file+".moto.wheel"));
  }catch(error){console.log("Wheel state",await js("JSON.stringify({b:q.b&&[q.b.kind,q.b.x,q.b.z,q.b.speed,q.b.wheelLift,q.b.impact],pose:q.f?.player?.stage,peak:q.peak,landing:q.landing,hint:document.querySelector('#context').textContent})"));await snap("failure");throw error;}
  finally{for(const code of ["ShiftLeft","KeyW","Space"])await key("keyUp",code);}
};
