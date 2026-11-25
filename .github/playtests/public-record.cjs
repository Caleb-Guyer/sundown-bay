const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const route=mode==="street"?"print":"live",credit=mode==="street"?"crew":"signed";
  async function snap(label){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:90}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-record-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  async function ready(){await waitFor("document.readyState==='complete'&&typeof BayPublicRecord==='object'");}
  const book="JSON.parse(localStorage.getItem(BayPublicRecord.key)||'{}')";
  async function loadFootAt(point){
    const before=await send("Page.addScriptToEvaluateOnNewDocument",{source:`const data=JSON.parse(localStorage.getItem('sundownBay.secondUnit.v1'));
      data[data.lead]=Object.assign({},${JSON.stringify(point)},{yaw:1.57,ride:''});localStorage.setItem('sundownBay.secondUnit.v1',JSON.stringify(data));`});
    await send("Page.reload");await ready();await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:before.identifier});
    await js("document.querySelector('#play').click()");
  }
  try{
    await waitFor("!document.querySelector('#chapterFilm').hidden");
    await js(`window.recQA={frames:[],held:new Set(),now:0,points:[],samples:false};
      const camera=BayCamera.prototype.update;BayCamera.prototype.update=function(...args){const out=camera.apply(this,args);recQA.rig=this;recQA.subject=args[1];recQA.yaw=this.yaw;return out;};
      const scene=BayPublicRecord.Story.prototype.step;BayPublicRecord.Story.prototype.step=function(dt){const changed=scene.call(this,dt);recQA.director=this;return changed;};
      const begin=BayView.prototype.begin;BayView.prototype.begin=function(...args){recQA.view=this;return begin.apply(this,args);};
      recQA.geometry={};const objectDraw=BayView.prototype.draw;BayView.prototype.draw=function(name,...args){recQA.object=name;return objectDraw.call(this,name,...args);};
      if(window.WebGLRenderingContext){
        const gl=WebGLRenderingContext.prototype;
        for(const [name,countAt] of [["drawArrays",2],["drawElements",1]]){const draw=gl[name];gl[name]=function(...args){
          if(recQA.samples){recQA.calls=(recQA.calls||0)+1;recQA.vertices=(recQA.vertices||0)+args[countAt];
            const n=recQA.object;recQA.geometry[n]=(recQA.geometry[n]||0)+args[countAt];}return draw.apply(this,args);};}
      }
      const attend=BaySoftSand.Beach.prototype.attend;
      BaySoftSand.Beach.prototype.attend=function(dt,t,hero,...rest){const out=attend.call(this,dt,t,hero,...rest),q=recQA;
        q.hero=hero;q.now=t;if(!q.goal)return out;
        const dx=q.goal[0]-hero.x,dz=q.goal[1]-hero.z,want=new Set();
        if(Math.hypot(dx,dz)<.29)q.goal=null;
        else{const c=Math.cos(q.yaw),s=Math.sin(q.yaw),f=dx*s+dz*c,r=dx*c-dz*s,gate=Math.max(Math.abs(f),Math.abs(r))*.46;
          if(Math.abs(f)>gate)want.add(f>0?'KeyW':'KeyS');if(Math.abs(r)>gate)want.add(r>0?'KeyD':'KeyA');}
        for(const code of q.held)if(!want.has(code))dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
        for(const code of want)if(!q.held.has(code))dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
        q.held=want;return out;};
      let last=performance.now();function sample(t){if(recQA.samples)recQA.frames.push(t-last);last=t;requestAnimationFrame(sample);}requestAnimationFrame(sample);`);
    await snap("port");
    await waitFor("!document.querySelector('#chapterInsert').hidden&&document.querySelector('#chapterLine').textContent.includes('sale notice')",70000);await snap("notice");
    await waitFor("document.querySelector('#chapterLine').textContent.includes('coral coupe')",60000);await snap("key");
    await waitFor("document.querySelector('#chapterFilm').hidden&&recQA.hero&&recQA.rig",60000);
    assert((await js(book)).intro);
    await send("Profiler.enable");await send("Profiler.start");
    await js("recQA.samples=true;recQA.goal=[151.65,-22.85]");
    await waitFor("!recQA.goal&&document.querySelector('#context').innerText.includes('Mara Vega')",45000);
    await waitFor("recQA.frames.length>=48",60000);await js("recQA.samples=false");
    const {profile}=await send("Profiler.stop");await send("Profiler.disable");
    console.log("PERF CPU",mode,profile.nodes.filter(n=>n.hitCount).sort((a,b)=>b.hitCount-a.hitCount).slice(0,18)
      .map(n=>(n.callFrame.functionName||"line "+n.callFrame.lineNumber)+" "+n.hitCount).join(", "));
    const perf=await js(`(()=>{const rig=recQA.rig,all=rig.obstacles,poses=[];
      for(let i=0;i<640;i++){const x=(i*17%372)-181,z=(i*41%359)-180;poses.push([{x,y:1.45,z},{x:x+7*Math.sin(i),y:4.3,z:z-7*Math.cos(i)}]);}
      const run=indexed=>{let sum=0,n=0;const t=performance.now();for(let k=0;k<3;k++)for(const [a,b] of poses){
        const c=indexed?rig.space.near(a.x,a.z,8):all;sum+=BayCamera.safeFraction(a,b,c);n+=c.length;}
        return {ms:performance.now()-t,sum,candidates:n/(poses.length*3)};};run(false);run(true);
      const base=run(false),indexed=run(true),a=recQA.frames.slice().sort((a,b)=>a-b);
      return {base,indexed,frameMedian:a[Math.floor(a.length*.5)],frameP95:a[Math.min(a.length-1,Math.floor(a.length*.95))],samples:a.length,
        drawCalls:Math.round((recQA.calls||0)/a.length),vertices:Math.round((recQA.vertices||0)/a.length),width:document.querySelector('#'+(recQA.view?'world':'overhead')).width};})()`);
    assert.equal(perf.base.sum,perf.indexed.sum);assert(perf.indexed.candidates<perf.base.candidates*.18);
    console.log("PERF",mode,JSON.stringify(perf));
    if(mode==="street")console.log("PERF draws",await js("Object.entries(recQA.geometry).sort((a,b)=>b[1]-a[1]).slice(0,15).map(([n,v])=>n+' '+Math.round(v/recQA.frames.length)).join(', ')"));
    await tap("KeyF");await waitFor(book+".stage==='ride'");await tap("KeyE");
    await waitFor("recQA.director.scene?.id==='boarded'",90000);await snap("passenger");await tap("Enter");
    await waitFor("document.querySelector('#chapterFilm').hidden");
    await js("recQA.frames=[];recQA.samples=true;recQA.start=[recQA.subject.x,recQA.subject.z]");
    await key("keyDown","KeyW");
    try{
      await waitFor("recQA.frames.length>=36&&Math.hypot(recQA.subject.x-recQA.start[0],recQA.subject.z-recQA.start[1])>4",45000);
    }finally{await key("keyUp","KeyW");}
    await js("recQA.samples=false");
    console.log("PERF drive",mode,await js("(()=>{const a=recQA.frames.sort((a,b)=>a-b);return {median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],samples:a.length,metres:Math.round(Math.hypot(recQA.subject.x-recQA.start[0],recQA.subject.z-recQA.start[1]))};})()"));
    // Load a delivered legacy save through the normal startup path and play its sequel on foot.
    const save=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;u.remember({x:-151.05,z:-87.8,yaw:-Math.PI/2},null);u.save();
      const data=JSON.parse(localStorage.getItem('sundownBay.v1')||'{}');data.edition='${route}';data.wallet=347;
      return [localStorage.getItem(BaySecondUnit.key),JSON.stringify(data)];})()`);
    const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem('sundownBay.secondUnit.v1',"+JSON.stringify(save[0])+");localStorage.setItem('sundownBay.v1',"+JSON.stringify(save[1])+");"});
    await send("Page.reload");await ready();await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});
    await js("document.querySelector('#play').click()");await waitFor("document.querySelector('#context').innerText.includes('timetable')");
    await tap("Escape");await waitFor("Array.from(document.querySelectorAll('#panelBody button')).some(b=>b.innerText.includes('Watch scene'))");
    await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('Watch scene')).click()");
    await waitFor("!document.querySelector('#chapterFilm').hidden");await snap("edition");await tap("Enter");await tap("KeyF");
    await waitFor("document.querySelector('#chapterWho').textContent==='Mara Vega'&&document.querySelector('#chapterLine').textContent.includes('sweep')");
    await key("keyDown","Space");await key("keyDown","KeyD");
    try{await waitFor("document.querySelector('#chapterLine').textContent.includes('credit')",40000);}finally{await key("keyUp","KeyD");await key("keyUp","Space");}
    await snap("dispatch");await tap(credit==="crew"?"Digit2":"Digit1");await waitFor(book+".stage==='filed'");assert.equal((await js(book)).credit,credit);
    await waitFor("document.querySelector('#chapterTitle').textContent.includes('Six O’Clock')",45000);await snap("boat");
    await waitFor("document.querySelector('#chapterFilm').hidden",20000);
    await send("Page.reload");await ready();await js("document.querySelector('#play').click()");
    await waitFor("document.querySelector('#chapterFilm').hidden&&document.querySelector('#hud').hidden===false");
    assert.equal((await js(book)).credit,credit);assert.equal(await js("JSON.parse(localStorage.getItem('sundownBay.v1')).wallet"),347);
    await loadFootAt({x:-151.1,z:-86.6});await waitFor("document.querySelector('#context').innerText.includes('Dalia Cruz')");
    await tap("KeyF");await waitFor("document.querySelector('#chapterTitle').innerText==='First Crossing'",30000);await snap("ticket");await tap("Enter");
    const gate=await js("BayFirstCrossing.stop("+book+".berth)");await loadFootAt(gate);
    await waitFor("document.querySelector('#context').innerText.includes('Board Luz')");
    await js(`const move=BayFirstCrossing.Service.prototype.step;BayFirstCrossing.Service.prototype.step=function(...a){
      window.rideTest=this;const result=move.apply(this,a);
      if(this.rider?.charge>=this.goal()&&!window.letGo){window.letGo=true;dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));}
      return result;};`);
    await tap("KeyF");await waitFor("window.rideTest?.rider?.phase==='sail'",35000);
    await key("keyDown","KeyD");try{await waitFor("Math.hypot(rideTest.rider.x+.8,rideTest.rider.z)>.27",16000);}finally{await key("keyUp","KeyD");}
    await waitFor("Math.abs(rideTest.u-.5)<.13",95000);await tap("KeyH");await waitFor("rideTest.rider.bell");await snap("deck");
    await waitFor("rideTest.rider.phase==='line'",90000);await snap("quay");
    await key("keyDown","Space");await waitFor("window.letGo&&"+book+".trips===1",35000);await key("keyUp","Space");
    assert.equal((await js(book)).clean,1);await send("Page.reload");await ready();assert.equal((await js(book)).trips,1);
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"Public Record, Dalia’s ticket, moving ferry deck, channel reply, mooring cast, arrival on foot and persistent passage",route,credit);
  }catch(e){console.log("Campaign state",await js("JSON.stringify({book:"+book+",who:document.querySelector('#chapterWho').textContent,line:document.querySelector('#chapterLine').textContent,hint:document.querySelector('#context').innerText,at:window.recQA?.hero&&[recQA.hero.x,recQA.hero.z],goal:window.recQA?.goal,panel:document.querySelector('#panelTitle').innerText})"));await snap("failure");throw e;}
};
