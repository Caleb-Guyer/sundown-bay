const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,tap,key,waitFor,mode,errors})=>{
  const carKey="coupe@149.00,-22.80";
  async function snap(label){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:91}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-sand-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  const places=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;
    u.remember({x:179,z:-6,yaw:Math.PI/2},{garageKey:"${carKey}"});
    u.remember({x:183.37,z:-12,yaw:-Math.PI/2},null);u.save();return localStorage.getItem(BaySecondUnit.key);})()`);
  const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem('sundownBay.secondUnit.v1',"+JSON.stringify(places)+");localStorage.setItem('sundownBay.clock.v1','960');"});
  async function legs(points){
    await js("sandQA.legs="+JSON.stringify(points));await waitFor("sandQA.legs===null",110000);
  }
  try{
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BaySoftSand==='object'");
    await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});
    await js(`window.sandQA={yaw:0,held:new Set(),legs:null,match:false,under:0,best:0};
      const camera=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const out=camera.apply(this,a);sandQA.yaw=this.yaw;return out;};
      const advance=BaySoftSand.Beach.prototype.attend;
      BaySoftSand.Beach.prototype.attend=function(dt,t,hero,...rest){
        const out=advance.call(this,dt,t,hero,...rest),q=sandQA;
        q.b=this;q.hero=hero;q.t=t;
        if(this.phase==='unload'&&this.v.doorAngle>.15)q.door=true;
        if(this.pushing&&this.thrust>.65)q.braced=true;
        const desired=new Set();
        if(q.match&&this.pushing&&this.forward)desired.add('KeyW');
        if(q.legs){
          const p=q.legs[0],dx=p[0]-hero.x,dz=p[1]-hero.z;
          if(Math.hypot(dx,dz)<.42){q.legs.shift();if(!q.legs.length)q.legs=null;}
          else{
            const c=Math.cos(q.yaw),s=Math.sin(q.yaw),f=dx*s+dz*c,r=dx*c-dz*s,gate=Math.max(Math.abs(f),Math.abs(r))*.45;
            if(Math.abs(f)>gate)desired.add(f>0?'KeyW':'KeyS');if(Math.abs(r)>gate)desired.add(r>0?'KeyD':'KeyA');
          }
        }
        for(const code of q.held)if(!desired.has(code))dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
        for(const code of desired)if(!q.held.has(code))dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
        q.held=desired;return out;};
      const grip=BaySoftSand.Beach.prototype.surface;
      BaySoftSand.Beach.prototype.surface=function(v,...args){const g=grip.call(this,v,...args);
        if(v.garageKey==='${carKey}'){sandQA.own=v;if(g?.boards>.95)sandQA.under++;sandQA.best=Math.max(sandQA.best,Math.abs(v.speed));}return g;};
      document.querySelector('#play').click();`);
    await waitFor("sandQA.b&&document.querySelector('#context').innerText.includes('tailgate')");await snap("tailgate");
    await tap("KeyF");await waitFor("sandQA.b.pushing");await tap("KeyE");await waitFor("!sandQA.b.pushing");await tap("KeyF");
    await js("sandQA.match=true");await waitFor("sandQA.braced&&sandQA.b.advance>.4",45000);await snap("push");
    await waitFor("sandQA.b.phase==='stand'&&sandQA.door",70000);assert(await js("sandQA.b.strokes>=2&&sandQA.b.ruts.length>8"));
    await legs([[180.7,-15.2],[173.1,-15.2],[169.6,-14.6]]);
    await waitFor("document.querySelector('#context').innerText.includes('Borrow')");await snap("rack");await tap("KeyF");await waitFor("sandQA.b.carry");
    await legs([[173.7,-15.1],[177.2,-12.9],[178.4,-8.15]]);
    await waitFor("document.querySelector('#context').innerText.includes('drive wheels')");await tap("KeyF");
    await waitFor("sandQA.b.book.boards&&!sandQA.b.carry&&sandQA.b.feet.length>=6");
    const saved=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).sand");
    assert(saved.open&&saved.boards&&Math.abs(saved.boards.z+6)<.1);await snap("boards");
    await tap("KeyE");await waitFor("!!sandQA.own&&sandQA.under>0",40000);await key("keyDown","KeyW");
    try{await waitFor("sandQA.own.x>187&&sandQA.best>3",30000);}finally{await key("keyUp","KeyW");}
    await key("keyDown","Space");try{await waitFor("Math.abs(sandQA.own.speed)<.5",15000);}finally{await key("keyUp","Space");}
    await snap("tracks");assert(await js("sandQA.b.ruts.some(r=>r.b.x>181&&r.b.z> -8)"));
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BaySoftSand==='object'");
    const reloaded=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).sand");assert.deepEqual(reloaded,saved);
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"timed the tailgate push, watched Ro get out, carried and wedged the pair, launched the parked coupe and left tire ruts; Ro and the boards survived reload.",saved);
  }catch(e){
    console.log("Beach state",await js("JSON.stringify({at:window.sandQA?.hero&&[sandQA.hero.x,sandQA.hero.z],yaw:sandQA?.yaw,phase:sandQA?.b?.phase,rack:sandQA?.b?.rack(),b:sandQA?.b&&[sandQA.b.v.x,sandQA.b.advance,sandQA.b.pushing,sandQA.b.carry],legs:sandQA?.legs,own:sandQA?.own&&[sandQA.own.x,sandQA.own.z],hint:document.querySelector('#context').innerText})"));
    await snap("failure");throw e;
  }
};
