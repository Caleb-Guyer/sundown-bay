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
      const scene=BayPublicRecord.Story.prototype.step;BayPublicRecord.Story.prototype.step=function(...args){const changed=scene.apply(this,args);recQA.director=this;return changed;};
      const begin=BayView.prototype.begin;BayView.prototype.begin=function(...args){
        recQA.view=this;
        if(this.multiDraw&&!recQA.batchesWrapped){
          recQA.batchesWrapped=true;
          for(const [name,countAt] of [["multiDrawArraysWEBGL",3],["multiDrawElementsWEBGL",1]]){
            const ext=this.multiDraw,draw=ext[name];
            ext[name]=function(...args){
              if(recQA.samples){
                const counts=args[countAt],offset=args[countAt+1],runs=args[args.length-1];
                let vertices=0;for(let i=0;i<runs;i++)vertices+=counts[offset+i];
                recQA.batches=(recQA.batches||0)+1;recQA.ranges=(recQA.ranges||0)+runs;
                recQA.vertices=(recQA.vertices||0)+vertices;
                const n=recQA.object;recQA.geometry[n]=(recQA.geometry[n]||0)+vertices;
              }
              return draw.apply(this,args);
            };
          }
        }
        return begin.apply(this,args);
      };
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
    await waitFor("recQA.director?.beat()?.watch==='work'&&!document.querySelector('#dispatchClock').hidden");await snap("watch");
    const aboard=mode==="street";
    if(aboard){
      await key("keyDown","Space");
      try{
        await waitFor("recQA.director.watch.crossing");await tap("KeyH");assert.equal(await js(book+"?.morning||null"),null);
        await waitFor("recQA.director.watch.travel>=.47");await snap("gangway");await waitFor("recQA.director.watch.travel===1");
      }finally{await key("keyUp","Space");}
      await waitFor("recQA.director.watch.gate<.035");
    }
    await tap("KeyH");await waitFor(book+"?.morning?.luis==="+JSON.stringify(aboard?"aboard":"ashore"));
    await waitFor("recQA.director.beat()?.art==='watchCopy'");await snap("docket");
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
        drawCalls:Math.round(((recQA.calls||0)+(recQA.batches||0))/a.length),batches:Math.round((recQA.batches||0)/a.length),batchedRanges:Math.round((recQA.ranges||0)/a.length),
        vertices:Math.round((recQA.vertices||0)/a.length),width:document.querySelector('#'+(recQA.view?'world':'overhead')).width};})()`);
    assert.equal(perf.base.sum,perf.indexed.sum);assert(perf.indexed.candidates<perf.base.candidates*.18);
    console.log("PERF",mode,JSON.stringify(perf));
    if(mode==="street"){
      // Keep the camera parked outside the motel and alternate both submission
      // paths on the same runner. Discard the first frame of each block.
      await js(`const batchDraw=BayView.prototype.drawOpaque;
        const comparePixels=(${require("./street-pixels.cjs").toString()});
        recQA.compare={block:-1,frames:[],stream:[],separate:[],calls:{stream:0,separate:0},indices:{stream:0,separate:0}};
        BayView.prototype.drawOpaque=function(items){
          const q=recQA.compare;
          if(!q||q.block>=8)return batchDraw.call(this,items);
          const frame=q.frames.length,block=Math.floor(frame/10);
          const path=[0,3].includes(block%4)?'stream':'separate',now=performance.now();
          if(frame%10>=2&&q.previous)q[path].push(now-q.previous);
          q.previous=now;q.block=block;q.frames.push(path);
          if(block>=8){
            q.pixels=comparePixels(this,items,batchDraw);
            const batch=this.streetBatch,pose=batch.repeatedPose,flush=batch.flush;
            const props=items.filter(([name,,,,,,,,car,,vapor])=>{const m=this.models.get(name);
              return m?.count&&!m.dynamic&&!m.sections&&!car&&!vapor&&m.count<=batch.indices.length&&m.vertexCount<=batch.vertices.length/6;});
            const times=[[],[]],counts=[0,0];let hits=0,triIndices=0;
            try{
              batch.flush=function(){triIndices+=this.count;this.count=this.used=0;};
              for(let i=0;i<16;i++){
                const enabled=[0,3].includes(i%4)?1:0;
                batch.repeatedPose=enabled?function(...args){const p=pose.apply(this,args);if(p?.vertices)hits++;return p;}:()=>null;
                triIndices=0;const start=performance.now();
                for(let k=0;k<4;k++){for(const p of props)batch.append(p);batch.flush();}
                if(i>=4)times[enabled].push((performance.now()-start)/4);counts[enabled]=triIndices/4;
              }
            }finally{batch.flush=flush;batch.repeatedPose=pose;batch.count=batch.used=0;}
            q.poses={props:props.length,hits,bytes:batch.poseBytes,indices:counts,medianMs:times.map(a=>a.sort((x,y)=>x-y)[a.length>>1])};
            return batchDraw.call(this,items);
          }
          const before=(recQA.calls||0)+(recQA.batches||0),vertices=recQA.vertices||0;recQA.samples=true;
          if(path==='stream')batchDraw.call(this,items);else for(const item of items)this.draw(...item);
          recQA.samples=false;q.calls[path]+=(recQA.calls||0)+(recQA.batches||0)-before;
          q.indices[path]+=(recQA.vertices||0)-vertices;
        };`);
      await waitFor("recQA.compare.block===8",55000);
      const pair=await js(`(()=>{BayView.prototype.drawOpaque=batchDraw;const p=recQA.compare;
        return Object.fromEntries(['stream','separate'].map(k=>{const a=p[k].sort((a,b)=>a-b);
          return [k,{median:a[a.length>>1],p95:a[Math.floor(a.length*.95)],draws:p.calls[k]/40,
            indices:Math.round(p.indices[k]/40),samples:a.length}];}));})()`);
      console.log("PERF paired motel",JSON.stringify(pair));
      assert(pair.stream.draws<pair.separate.draws*.85,"street geometry shares submissions");
      const pixels=await js("recQA.compare.pixels");console.log("PERF same-frame pixels",JSON.stringify(pixels));
      assert(pixels.painted>350&&pixels.silhouette<pixels.painted*.01&&pixels.recolored<pixels.painted*.015);
      const poses=await js("recQA.compare.poses");console.log("PERF stationary scenery",JSON.stringify(poses));
      assert(poses.hits>0&&poses.bytes>0&&poses.bytes<=3*1024*1024&&poses.indices[0]===poses.indices[1]);
      assert.equal(await js("recQA.view.gl.getError()"),0);
    }
    await tap("KeyF");await waitFor(book+".stage==='ride'");await tap("KeyE");
    await waitFor("recQA.director.scene?.id==='boarded'",90000);await snap("passenger");
    await waitFor("document.querySelector('#chapterLine').textContent.includes("+JSON.stringify(aboard?"blue tin":"crackers")+")");await tap("Enter");
    await waitFor("document.querySelector('#chapterFilm').hidden");
    await js("recQA.frames=[];recQA.samples=true;recQA.start=[recQA.subject.x,recQA.subject.z]");
    await key("keyDown","KeyW");
    try{
      await waitFor("recQA.frames.length>=36&&Math.hypot(recQA.subject.x-recQA.start[0],recQA.subject.z-recQA.start[1])>4",45000);
    }finally{await key("keyUp","KeyW");}
    await js("recQA.samples=false");
    console.log("PERF drive",mode,await js("(()=>{const a=recQA.frames.sort((a,b)=>a-b);return {median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],samples:a.length,metres:Math.round(Math.hypot(recQA.subject.x-recQA.start[0],recQA.subject.z-recQA.start[1]))};})()"));
    await js(`const drawMap=window.drawBayMap;window.drawBayMap=function(context,state){if(state.streetCar)recQA.map=state;return drawMap(context,state);};`);
    await tap("Escape");await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('One-minute frame check')).click()");
    await waitFor("document.querySelector('#panel').hidden&&recQA.map?.streetCar");
    const checkId=mode==="street"?"Street drive":"Overhead drive";
    await js(`const driveKeys=(${require("./coast-driver.cjs").toString()});
      const mem={},held=new Set();recQA.driving=true;recQA.blocks=new Set();
      function driveLoop(t){
        const map=recQA.map,v=map.streetCar;recQA.blocks.add(Math.floor(v.x/36)+','+Math.floor(v.z/36));
        const wanted=new Set(recQA.driving?driveKeys({...map,coastCup:{phase:'race',clock:t/1000}},mem):[]);
        for(const code of held)if(!wanted.has(code)){dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.delete(code);}
        for(const code of wanted)if(!held.has(code)){dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));held.add(code);}
        if(recQA.driving)requestAnimationFrame(driveLoop);
      }requestAnimationFrame(driveLoop);`);
    const result="JSON.parse(localStorage.getItem('sundownBay.frameCheck.v1')||'{}')["+JSON.stringify(checkId)+"]";
    try{await waitFor(result,100000);}finally{await js("recQA.driving=false");}
    const minute=await js(result),blocks=await js("recQA.blocks.size");
    console.log("PERF minute drive",mode,JSON.stringify({...minute,blocks}));assert(minute.seconds>=60&&minute.metres>120&&blocks>=4);
    await snap("drive");await tap("Escape");await waitFor("document.querySelector('#panelBody').innerText.includes('95th percentile')");await tap("Escape");
    async function parkAt(point){
      await js(`(()=>{const v=recQA.map.streetCar;Object.assign(v,{x:${point.x},z:${point.z},yaw:0,path:null});BayDriving.settle(v);})()`);
    }
    await parkAt({x:-149.5,z:-91});await waitFor("document.querySelector('#context').innerText.includes('Mara’s camera')");
    await tap("KeyF");await waitFor("document.querySelector('.finder-cross.locked')");
    await snap("lens");await tap("Space");await waitFor("document.querySelector('.file-notice')?.hidden===false");
    if(aboard){
      await tap("KeyH");for(let i=0;i<8;i++)await tap("ArrowRight");
      await waitFor("document.querySelector('.finder-status')?.textContent.includes('tin in focus')");await snap("portrait");
      await tap("Space");await waitFor("document.querySelector('.file-portrait')?.hidden===false");await tap("Digit2");
    }else await tap("Digit1");
    const film="JSON.parse(localStorage.getItem(BayLotNegative.key)||'{}')";
    const selected=await js(film+".pending");assert.equal(selected.frame,aboard?"14B":"14A");
    assert(selected.image.startsWith("data:image/jpeg;base64,/9j/")&&selected.image.length>1500);
    await waitFor("!document.querySelector('#chapterFilm').hidden");await tap("Enter");
    await waitFor("document.querySelector('#panelBody figcaption')?.textContent.includes("+JSON.stringify(selected.frame)+")");await snap("proof");
    await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes("+JSON.stringify(aboard?"Make a print":"Go live")+")).click()");
    await parkAt(await js("BayExposure.routes["+JSON.stringify(route)+"]"));
    await waitFor(film+".published?.frame==="+JSON.stringify(selected.frame),45000);
    assert.deepEqual(await js(film+".published"),selected);assert.equal(await js(film+".pending"),null);
    await waitFor("!document.querySelector('#chapterFilm').hidden");await tap("Enter");
    console.log("PASS Lot 14 shutter, "+selected.frame+" handoff to "+route+", exact "+selected.image.length+"-byte data URL retained.");
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
    await loadFootAt({x:-151.9,z:-88.85});await waitFor("document.querySelector('#context').innerText.includes('dispatch copy')");
    await tap("KeyF");await waitFor("document.querySelector('#chapterWho').textContent==='Dalia’s departure book'");
    assert.equal((await js(book)).morning.luis,aboard?"aboard":"ashore");await tap("Escape");
    await loadFootAt({x:-151.1,z:-86.6});await waitFor("document.querySelector('#context').innerText.includes('Dalia Cruz')");
    await tap("KeyF");await waitFor("document.querySelector('#chapterTitle').innerText==='First Crossing'",30000);
    await waitFor("!document.querySelector('#chapterInsert').hidden&&document.querySelector('#chapterWho').textContent==='Dalia Cruz'");await snap("ticket");await tap("Enter");
    const gate=await js("BayFirstCrossing.stop("+book+".berth)");await loadFootAt(gate);
    await waitFor("document.querySelector('#context').innerText.includes('Board Luz')");
    await js(`const move=BayFirstCrossing.Service.prototype.step;BayFirstCrossing.Service.prototype.step=function(...a){
      window.rideTest=this;const result=move.apply(this,a);
      if(this.rider?.charge>=this.goal()&&!window.letGo){window.letGo=true;dispatchEvent(new KeyboardEvent('keyup',{code:'Space',bubbles:true}));}
      return result;};`);
    await tap("KeyF");await waitFor("window.rideTest?.rider?.phase==='sail'",35000);
    assert.equal(await js("['objective','jobKey','watchCall'].every(id=>document.getElementById(id).hidden)"),true);
    assert.equal(await js("document.querySelector('#mode').textContent"),"M/V Luz · Passenger");
    await key("keyDown","KeyD");try{await waitFor("Math.hypot(rideTest.rider.x+.8,rideTest.rider.z)>.27",16000);}finally{await key("keyUp","KeyD");}
    await waitFor("Math.abs(rideTest.u-.5)<.13",95000);await tap("KeyH");await waitFor("rideTest.rider.bell");await snap("deck");
    await waitFor("rideTest.rider.phase==='line'",90000);await snap("quay");
    await key("keyDown","Space");await waitFor("window.letGo&&"+book+".trips===1",35000);await key("keyUp","Space");
    assert.equal((await js(book)).clean,1);await send("Page.reload");await ready();assert.equal((await js(book)).trips,1);
    const voice=credit==="crew"?"luis":"dalia";
    await loadFootAt(await js("BayRoomTone.site"));await waitFor("document.querySelector('#context').innerText.includes('Room Tone')");
    await js("const wind=BayRoomTone.Edit.prototype.move;BayRoomTone.Edit.prototype.move=function(...a){window.reelTest=this;return wind.apply(this,a);};");
    await tap("KeyF");await waitFor("document.querySelector('#chapterTitle').textContent==='Room Tone'");await snap("van");
    await tap("Enter");await waitFor("window.reelTest?.kind==='splice'");
    const bite=await js("BayRoomTone.speakers.find(s=>s.id==='"+voice+"')");
    async function windTo(t){await key("keyDown","KeyD");try{await waitFor("reelTest.head>="+t);}finally{await key("keyUp","KeyD");}}
    await windTo(bite.start-.82);await tap("Space");await windTo(bite.end+.17);await tap("Space");
    assert.equal(await js("reelTest.cut?.who"),voice);await tap("KeyH");
    await waitFor("document.querySelector('#chapterWho').textContent===BayRoomTone.lines['"+voice+"'][0]");await snap("reel");
    await tap("Enter");await waitFor(book+".cut?.who==='"+voice+"'");
    await loadFootAt({x:140.60,z:123});await js("const update=BayAirwavesStreet.Radio.prototype.update;BayAirwavesStreet.Radio.prototype.update=function(...a){window.receiverTest=this;return update.apply(this,a);};const playRelay=BayRoomTone.Relay.prototype.step;BayRoomTone.Relay.prototype.step=function(...a){window.airTest=this;return playRelay.apply(this,a);};");
    await tap("KeyE");await waitFor("window.receiverTest?.device",35000);
    for(let i=0;i<4&&await js("receiverTest.station!=='sol'");i++){await tap("BracketRight");}
    await waitFor("receiverTest.station==='sol'&&document.querySelector('#receiverTitle').textContent==='Room Tone'");
    await js("window.leftAt=airTest.at");await tap("BracketRight");await waitFor("!airTest.station&&!airTest.clip&&airTest.at>leftAt+.36");await tap("BracketLeft");
    await waitFor("airTest.station&&airTest.clip&&airTest.at>leftAt+.36");
    await key("keyDown","KeyW");try{
      await waitFor("document.querySelector('#receiverCredit').textContent===BayRoomTone.lines['"+voice+"'][0]",30000);await snap("broadcast");
    }finally{await key("keyUp","KeyW");}
    await waitFor(book+".airings>=1");await loadFootAt({x:-151.1,z:-86.6});await waitFor("document.querySelector('#context').innerText.includes('Dalia')");
    await tap("KeyF");await waitFor("document.querySelector('#speech').innerText.includes('"+(voice==="dalia"?"toast":"lunch tins")+"')");
    assert.equal(await js("typeof BayRoomSamples"),"undefined");await js("loadRoomVoices()");await waitFor("window.BayRoomSamples");
    const signal=await js(`(()=>{const sink=new OfflineAudioContext(1,128,11025);
      const pcm=BayRoomVoices.buffer(sink,'${voice}').getChannelData(0);return pcm.reduce((v,x)=>v+x*x,0)/pcm.length;})()`);assert(signal>.0001);
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"Six Sharp departure, gangway or sailing bell, carbon and Mara callback; Public Record, First Crossing, Room Tone edit, car radio broadcast and Dalia’s response",route,credit);
  }catch(e){console.log("Campaign state",await js("JSON.stringify({book:"+book+",who:document.querySelector('#chapterWho').textContent,line:document.querySelector('#chapterLine').textContent,hint:document.querySelector('#context').innerText,at:window.recQA?.hero&&[recQA.hero.x,recQA.hero.z],goal:window.recQA?.goal,panel:document.querySelector('#panelTitle').innerText})"));await snap("failure");throw e;}
};
