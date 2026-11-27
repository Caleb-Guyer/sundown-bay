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
  async function checkCity(label){
    const proof=await js("("+require("./city-index.cjs").toString()+")(recQA.view,recQA,comparePixels)");
    console.log("PERF city indices "+label,JSON.stringify(proof));
    assert(proof.counts[1]<proof.counts[0]&&proof.ranges[1]===1&&proof.ranges[0]>1);
    assert(proof.pixels.painted>300&&proof.pixels.silhouette<proof.pixels.painted*.001&&proof.pixels.recolored<proof.pixels.painted*.005);
    const wallGrid=await js("("+require("./wall-grid.cjs").toString()+")(recQA.view)");
    console.log("PERF wall grid "+label,JSON.stringify(wallGrid));
    if(wallGrid.indexed)assert(wallGrid.queries>0&&wallGrid.candidates[1]<wallGrid.candidates[0]);
    await js(`recQA.sceneryDraws=new Map();recQA.sceneryReady=false;
      recQA.view.draw=function(name,...args){
        if(this.models.get(name)?.worldSections&&!this.casting&&!this.effectPass&&!args[7]&&!args[9]&&!args.slice(0,6).some(Boolean))
          recQA.sceneryDraws.set(name,[name,...args]);
        return BayView.prototype.draw.call(this,name,...args);};
      requestAnimationFrame(()=>requestAnimationFrame(()=>{delete recQA.view.draw;recQA.sceneryReady=true;}));`);
    await waitFor("recQA.sceneryReady");
    const scenery=await js("("+require("./scenery-indices.cjs").toString()+")(recQA.view,[...recQA.sceneryDraws.values()],recQA,comparePixels)");
    console.log("PERF scenery indices "+label,JSON.stringify(scenery));
    if(scenery.pixels.painted){
      assert(scenery.counts[1]<=scenery.counts[0]&&scenery.runs[1]<=scenery.runs[0]);
      assert(scenery.pixels.silhouette<=Math.ceil(scenery.pixels.painted*.001)&&scenery.pixels.recolored<=Math.ceil(scenery.pixels.painted*.005));
    }
    await js(`{recQA.surfaceResult=null;recQA.wallResult=null;
      const omitted=new Map();let checked=0;
      recQA.view.trafficVisible=function(x,y,z){
        checked++;if(!BayView.prototype.trafficVisible.call(this,x,y,z))omitted.set(x+"/"+z,{x,y,z});
        return true;
      };
      recQA.view.drawOpaque=function(items){delete this.drawOpaque;
        delete this.trafficVisible;
        const cars=Array.from(omitted.values());
        const rejected=items.filter(([name,x,y,z,,,,,body])=>{
          if(body&&omitted.has(body.x+"/"+body.z))return true;
          if(name.startsWith("traffic-shell/")||name.startsWith("traffic-brakes/"))return omitted.has(x+"/"+z);
          return name==="traffic-driver"&&cars.some(v=>Math.hypot(v.x-x,v.y-y,v.z-z)<2);
        });
        // Draw the entire rejected set against the city. A passing pedestrian or
        // a different car must never cover up an erroneous early rejection.
        const draw=list=>()=>{this.draw("city");this.drawOpaque(list);};
        const batch=this.streetBatch,detail=batch?.distanceDetail;
        if(batch)batch.distanceDetail=function(...args){this.buildDetail=false;return detail.apply(this,args);};
        try{
          recQA.trafficProof={low:this.scale<=.65,checked,skipped:omitted.size,parts:rejected.length,
            pixels:comparePixels(this,[],draw([]),draw(rejected),true)};
        }finally{if(batch)batch.distanceDetail=detail;}
        recQA.surfaceResult=(${require("./street-surface.cjs").toString()})(this,items,comparePixels);
        recQA.wallResult=(${require("./street-walls.cjs").toString()})(this,items,comparePixels,recQA);
        recQA.paintResult=(${require("./frame-paint.cjs").toString()})(this,items,comparePixels,freezeStreet);
        return this.drawOpaque(items);};}`);
    await waitFor("!!recQA.surfaceResult",40000);
    const result=await js("recQA.surfaceResult");console.log("PERF solid street "+label,JSON.stringify(result));
    const walls=await js("recQA.wallResult");console.log("PERF street walls "+label,JSON.stringify(walls));
    const traffic=await js("recQA.trafficProof");console.log("PERF traffic visibility "+label,JSON.stringify(traffic));
    assert(traffic.pixels.painted>10000&&traffic.pixels.silhouette===0&&traffic.pixels.maxError<=2);
    if(traffic.low&&label==="motel")assert(traffic.checked>0&&traffic.skipped>0&&traffic.parts>=traffic.skipped);
    const paint=await js("recQA.paintResult");console.log("PERF frame paint "+label,JSON.stringify(paint));
    for(const p of paint)assert(p.pixels.painted>10000&&p.pixels.silhouette===0&&p.pixels.maxError<=2);
    assert(walls.pixels.painted>10000&&walls.pixels.silhouette===0&&walls.pixels.recolored<=Math.ceil(walls.pixels.painted*.0001));
    assert(result.litCalls>0&&result.modelCalls>0);
    assert(result.sizes[1].height===result.sizes[2].height&&result.sizes[2].width<result.sizes[1].width);
    const aspect=await js("({picture:recQA.view.basis.aspect,screen:innerWidth/innerHeight,film:recQA.view.canvas.bayFrameAspect})");
    assert(Math.abs(aspect.picture-aspect.screen)<.01&&aspect.film===aspect.picture);
    for(const frame of result.comparisons){
      assert(frame.painted>10000&&frame.silhouette===0&&frame.recolored<=Math.ceil(frame.painted*.0001));
    }
    assert(result.directPixels.painted>600&&result.directPixels.silhouette===0&&result.directPixels.recolored<=Math.ceil(result.directPixels.painted*.0001));
    assert.equal(await js("recQA.view.gl.getError()"),0);
  }
  async function loadFootAt(point,facing=1.57){
    const before=await send("Page.addScriptToEvaluateOnNewDocument",{source:`const data=JSON.parse(localStorage.getItem('sundownBay.secondUnit.v1'));
      data[data.lead]=Object.assign({},${JSON.stringify(point)},{yaw:${facing},ride:''});localStorage.setItem('sundownBay.secondUnit.v1',JSON.stringify(data));`});
    await send("Page.reload");await ready();await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:before.identifier});
    await js("document.querySelector('#play').click()");
  }
  async function checkReturningPin(point,name){
    await loadFootAt(point);
    const objective="document.getElementById('objectiveText').textContent.includes("+JSON.stringify(name)+")";
    await waitFor(objective);
    await tap("Escape");
    const locate="[...document.querySelectorAll('#panelBody button')].find(b=>b.innerText.includes('Locate story'))";
    await waitFor(locate);
    assert((await js(locate+".innerText")).includes(name));
    await js(locate+".click()");await waitFor("document.getElementById('panel').hidden&&"+objective);
    console.log("PASS returning Play and Locate story both mark",name,mode);
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
    const callers=new Map();
    for(const frame of profile.nodes)for(const id of frame.children||[])callers.set(id,frame);
    function location(frame){return (frame.callFrame.functionName||"anonymous")+"@"+(1+frame.callFrame.lineNumber);}
    console.log("PERF CPU",mode,profile.nodes.filter(n=>n.hitCount).sort((a,b)=>b.hitCount-a.hitCount).slice(0,22)
      .map(n=>[n,callers.get(n.id),callers.get(callers.get(n.id)?.id)].filter(Boolean).map(location).join(" <- ")+" "+n.hitCount).join(", "));
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
      const pose=await js("("+require("./crowd-motion.cjs").toString()+")()");
      console.log("PERF citizen joint poses",JSON.stringify(pose));
      assert(pose.compared>1000000&&pose.worst<.000002);
    }
    if(mode==="overhead"){
      const atlas=fs.readFileSync(path.join(__dirname,"../../atlas.js"),"utf8");
      const tiles=atlas.replace("  function castBuildings(","  window.tiles={patch:groundPatch,image:staticImage};\n  function castBuildings(");
      const snapshots=tiles.replace("patch?.spare||mapSurface","patch?.canvas||mapSurface").replace("patch={spare:patch?.image,image:canvas,","patch?.image.close?.();patch={canvas,image:freezeSurface(canvas),");
      const factory=s=>"(function(window){"+s+";return window.tiles;})({})";
      await js(`const baseMap=drawBayMap;window.drawBayMap=function(ctx,state){if(state.mode==="street"){
        recQA.ground={solids:state.solids,signals:state.signals};window.drawBayMap=baseMap;}return baseMap(ctx,state);};true`);
      await waitFor("recQA.ground?.solids.length>0");
      const blocks=await js("("+require("./ground-drive.cjs").toString()+")("+factory(snapshots)+","+factory(tiles)+",recQA.ground)");
      console.log("PERF ground drive snapshots versus canvases",JSON.stringify(blocks));
      assert(blocks.maxError===0&&blocks.painted>1e6&&blocks.builds[0]>6&&blocks.builds[0]===blocks.builds[1]);
      const expose=atlas.replace("  function castBuildings(","  window.patch=groundPatch;\n  function castBuildings(");
      const ground=await js("("+require("./ground-window.cjs").toString()+")((function(window){"+expose+";return window.patch;})({}))");
      console.log("PERF overhead block pixels",JSON.stringify(ground));
      const people=await js("("+require("./sidewalk-prints.cjs").toString()+")((function(window){"+atlas.replace("  function castBuildings(","  window.person=personSprite;\n  function castBuildings(")+";return window.person;})({}))");
      console.log("PERF sidewalk poses",JSON.stringify(people));
      for(const pose of people.poses)assert(pose.ink>1500&&pose.fills[0]>200&&!pose.fills[1]&&pose.overlap>.88&&pose.meanError<22);
      assert(people.walking>500&&people.gestures===0);
      const lot=await js("("+require("./starlite-lot.cjs").toString()+")()");
      console.log("PERF Starlite lot",JSON.stringify(lot));
      const projection=await js("("+require("./drive-in-projection.cjs").toString()+")()");
      console.log("PERF drive-by projection",JSON.stringify(projection));
      for(const p of projection){
        assert.deepEqual(p.widths,[416,p.displayed===48?144:208]);assert.equal(p.seated,416);
        assert(p.paths[1]<p.paths[0]*.65,"Distant palm geometry "+JSON.stringify(p.paths));
        assert(p.reused&&p.distinct===35&&p.meanError<12,"Roadside projection "+JSON.stringify(p));
      }
      const lamps=await js("("+require("./traffic-prints.cjs").toString()+")()");
      console.log("PERF traffic lamps",JSON.stringify(lamps));
      assert(lamps.cars===48&&lamps.overlap>.93&&lamps.error<22&&lamps.live);
      const grime=await js("("+require("./road-grime.cjs").toString()+")()");
      console.log("PERF road grime",JSON.stringify(grime));
      assert(grime.compared===35&&grime.changed===20&&grime.removed>200&&grime.worst<.34);
      for(const v of lot)assert(v.original.paths>50&&v.cached.paths<=5&&v.cached.images===1&&v.overlap>.98&&v.error<5);
      for(const sample of ground)assert(sample.changed<sample.pixels*.001&&sample.meanError<.12,"Block transition "+JSON.stringify(sample));
      const wheel=await js("("+require("./wheel-map.cjs").toString()+")()");
      console.log("PERF Coast Wheel",JSON.stringify(wheel));
      for(const p of wheel){
        assert(p.overlap>.96&&p.error<6,"Coast Wheel ink at scale "+p.scale);
        if(p.scale<10){assert.equal(p.cached.drawImage,0);assert(p.original.stroke-p.cached.stroke>=60);}
        else if(p.scale<=16){assert(p.cached.drawImage>=9&&p.original.stroke-p.cached.stroke>190);}
        else assert.deepEqual(p.cached,p.original);
      }
      const scenery=await js("("+require("./street-scenery.cjs").toString()+")()");
      console.log("PERF overhead scenery",JSON.stringify(scenery));
      for(const p of scenery){
        assert(p.ink>20&&p.overlap>.90&&p.error<17,"Street scenery ink "+p.name+" at "+p.scale+": "+JSON.stringify(p));
        assert(p.to<p.from*.68,"Street scenery command count "+p.name);
      }
      const roof=await js("("+require("./motel-roof.cjs").toString()+")()");
      console.log("PERF motel roof",JSON.stringify(roof));
      for(const p of roof){
        assert(p.original.stroke>40&&p.cached.stroke===0&&p.cached.drawImage===1);
        assert(p.overlap>.99&&p.meanChannelError<3);
      }
    }
    if(mode==="street"){
      const film=await js("("+require("./street-projection.cjs").toString()+")(recQA.view)");
      console.log("PERF street drive-in screen",JSON.stringify(film));
      assert(film.away===0&&film.rear===0&&film.noUpload&&film.uploaded);
      for(const s of film.shots)assert(s.width>0&&s.painted>80&&s.coverage===0&&s.error<10);
      assert(film.shots[0].widths[1]<416&&film.shots[2].widths[1]===416);
      // Keep the camera parked outside the motel and alternate both submission
      // paths on the same runner. Discard the first frame of each block.
      await js(`const batchDraw=BayView.prototype.drawOpaque;
        const comparePixels=(${require("./street-pixels.cjs").toString()});
        const freezeStreet=(${require("./street-uploads.cjs").freeze.toString()});
        const programs=(${require("./street-programs.cjs").street.toString()});
        const sunPrograms=(${require("./street-programs.cjs").sun.toString()});
        const updateSun=recQA.view.updateSun;
        recQA.view.updateSun=function(weather,dusk){
          updateSun.call(this,weather,dusk);
          if(this.sunStrength<.006||!this.models.get('city')?.sunMesh||!this.sunTarget?.ok)return;
          this.updateSun=updateSun;recQA.shadowProof=sunPrograms(this,weather,dusk,updateSun);
        };
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
            q.programs=programs(this,items,batchDraw,freezeStreet,comparePixels);
            q.placements=(${require("./street-placements.cjs").toString()})(this,items,batchDraw,comparePixels);
            const batch=this.streetBatch,pose=batch.repeatedPose,flush=batch.flush,detail=batch.distanceDetail;
            const indices=[],samplePath=useDetail=>function(list){
              const before=recQA.vertices;recQA.samples=true;
              if(!useDetail)batch.distanceDetail=()=>null;
              try{batchDraw.call(this,list);}finally{batch.distanceDetail=detail;recQA.samples=false;}
              indices.push(recQA.vertices-before);
            };
            const silhouette=comparePixels(this,items,samplePath(true),samplePath(false));
            q.detail={indices,pixels:silhouette,bytes:batch.detailBytes};
            const actors=items.filter(([name])=>this.models.get(name)?.actorStream);
            const submitted=[],drawActors=indexed=>function(list){
              let vertices=0;const originals=new Map();
              batch.flush=function(){vertices+=this.used;return flush.call(this);};
              try{
                for(const item of list){
                  const m=this.models.get(item[0]);
                  if(!indexed&&!originals.has(m)){
                    originals.set(m,[m.indices,m.batchSources,m.vertexCount]);m.indices=m.batchSources=null;m.vertexCount=m.count;
                  }
                  batch.append(item);
                }
                batch.flush();
              }finally{batch.flush=flush;for(const [m,a] of originals)[m.indices,m.batchSources,m.vertexCount]=a;}
              submitted.push(vertices);
            };
            q.animated={pixels:comparePixels(this,actors,drawActors(true),drawActors(false)),submitted};
            const props=items.filter(([name,,,,,,,,car,,vapor])=>{const m=this.models.get(name);
              return m?.count&&!m.dynamic&&!m.sections&&!car&&!vapor&&m.count<=batch.indices.length&&m.vertexCount<=batch.vertices.length/6;});
            const times=[[],[]],counts=[0,0];let hits=0,triIndices=0;
            // A shared mesh can face two directions in this same snapshot. Start each
            // timed pass with identical hidden-face selections and distance meshes.
            const models=new Set(props.map(([name])=>this.models.get(name)));
            const sides=[...models].map(m=>[m,m.exterior,m.wantedSide]);
            const resetSides=()=>{for(const [m,exterior,wantedSide] of sides){m.exterior=exterior;m.wantedSide=wantedSide;}};
            const buildDetail=batch.buildDetail,residentBase=batch.residentBase;
            try{
              batch.buildDetail=false;
              batch.residentBase=()=>-1; // Measure CPU pose copies without submitting a GPU batch.
              batch.flush=function(){triIndices+=this.count;this.count=this.used=0;};
              for(let i=0;i<16;i++){
                const enabled=[0,3].includes(i%4)?1:0;
                batch.repeatedPose=enabled?function(...args){const p=pose.apply(this,args);if(p?.vertices)hits++;return p;}:()=>null;
                resetSides();triIndices=0;const start=performance.now();
                for(let k=0;k<4;k++){for(const p of props)batch.append(p);batch.flush();}
                if(i>=4)times[enabled].push((performance.now()-start)/4);counts[enabled]=triIndices/4;
              }
            }finally{resetSides();batch.buildDetail=buildDetail;batch.residentBase=residentBase;batch.flush=flush;batch.repeatedPose=pose;batch.count=batch.used=0;}
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
      const programs=await js("recQA.compare.programs");console.log("PERF street shader changes",JSON.stringify(programs));
      const places=await js("recQA.compare.placements");console.log("PERF resident scenery",JSON.stringify(places));
      assert(places.hits>0&&places.pixels.painted>350&&places.pixels.changed===0&&places.streamed.indices===places.retained.indices);
      assert(programs.image.painted>500&&programs.image.changed===0&&programs.restored.every(Boolean));
      assert(programs.binds[1]<programs.binds[0]);
      const sun=await js("recQA.shadowProof");console.log("PERF sunlight geometry",JSON.stringify(sun));
      assert(sun.painted>1000&&sun.changed===0&&sun.vertexBytes[1]<sun.vertexBytes[0]);
      assert(pixels.painted>350&&pixels.silhouette<pixels.painted*.01&&pixels.recolored<pixels.painted*.015);
      const poses=await js("recQA.compare.poses");console.log("PERF stationary scenery",JSON.stringify(poses));
      assert(poses.hits>0&&poses.bytes>0&&poses.bytes<=3*1024*1024&&poses.indices[0]===poses.indices[1]);
      const detail=await js("recQA.compare.detail");console.log("PERF distance detail",JSON.stringify(detail));
      assert(detail.indices[1]<detail.indices[0]&&detail.bytes<=4*1024*1024);
      assert(detail.pixels.silhouette<detail.pixels.painted*.01&&detail.pixels.recolored<detail.pixels.painted*.015);
      const animated=await js("recQA.compare.animated");console.log("PERF animated characters",JSON.stringify(animated));
      assert(animated.submitted[1]>0&&animated.submitted[1]<animated.submitted[0]*.85);
      assert(animated.pixels.painted>0&&animated.pixels.silhouette===0&&animated.pixels.recolored===0);
      await js(`const streams=recQA.view.streetBatch.buffers,single=[streams[0]];
        const uploadTrial=recQA.uploadTrial={frame:0,times:[[],[]],cpu:[[],[]],bytes:[0,0],whole:[0,0]};
        const batch=recQA.view.streetBatch,update=batch.uploadStream;
        batch.uploadStream=function(target,source,length,history){
          const bytes=update.call(this,target,source,length,history),k=source.BYTES_PER_ELEMENT===2?1:0;
          uploadTrial.bytes[k]+=bytes;uploadTrial.whole[k]+=length*source.BYTES_PER_ELEMENT;return bytes;
        };
        BayView.prototype.drawOpaque=function(items){
          const q=uploadTrial,n=q.frame++,block=Math.floor(n/8),ring=[0,3].includes(block%4)?1:0,b=this.streetBatch;
          if(n===64){
            b.buffers=streams;b.nextBuffer=0;BayView.prototype.drawOpaque=batchDraw;batch.uploadStream=update;
            Object.assign(q,(${require("./street-uploads.cjs").toString()})(this,items,batchDraw,comparePixels,freezeStreet));
            return batchDraw.call(this,items);
          }
          const start=performance.now();
          if(n%8>=2)q.times[ring].push(start-q.last);
          q.last=start;b.buffers=ring?streams:single;if(!ring)b.nextBuffer=0;
          batchDraw.call(this,items);if(n%8>=2)q.cpu[ring].push(performance.now()-start);
        };`);
      await waitFor("!!recQA.uploadTrial.image",55000);
      const uploads=await js(`(()=>{const q=recQA.uploadTrial,median=a=>a.sort((x,y)=>x-y)[a.length>>1];
        return {frameMs:q.times.map(median),submitMs:q.cpu.map(median),pixels:q.image,fullUpload:q.reference,batches:q.batches,bytes:q.bytes,whole:q.whole,slots:recQA.view.streetBatch.buffers.length};
      })()`);
      console.log("PERF scenery uploads single and triple",JSON.stringify(uploads));
      assert.equal(uploads.slots,3);assert(uploads.batches>0);
      assert(uploads.pixels.painted>350&&uploads.pixels.silhouette===0&&uploads.pixels.recolored===0);
      assert(uploads.fullUpload.painted>350&&uploads.fullUpload.changed===0&&uploads.fullUpload.silhouette===0);
      assert(uploads.bytes[0]<=uploads.whole[0]&&uploads.bytes[1]<=uploads.whole[1]);
      await checkCity("motel");
      assert.equal(await js("recQA.view.gl.getError()"),0);
    }
    await tap("KeyF");await waitFor(book+".stage==='ride'");await tap("KeyE");
    await waitFor("recQA.director.scene?.id==='boarded'",90000);await snap("passenger");
    await waitFor("!document.querySelector('#gloveLatch').hidden");
    if(mode==="street")await tap("Space");else await js("document.querySelector('#gloveLatch').click()");
    await waitFor(book+".repairTag&&recQA.director.scene.age>recQA.director.scene.tagAt+1&&document.querySelector('#chapterLine').textContent.includes('Eight dollars')");
    await snap("repair-tag");
    await waitFor("document.querySelector('#chapterLine').textContent.includes("+JSON.stringify(aboard?"blue tin":"crackers")+")");
    const pick=aboard?"wheel":"luna",mapOpen="!document.querySelector('#roadChoices').hidden";
    await waitFor(mapOpen);
    const coachQuote=await require("./coach-interview.cjs")({js,waitFor,tap,send,snap,book,aboard});
    await tap(aboard?"ArrowRight":"ArrowLeft");
    await waitFor("document.querySelector('#roadChoices [aria-pressed=true]').dataset.road==="+JSON.stringify(pick));
    await snap("road-map");
    if(aboard)await tap("Space");else await js("document.querySelector('#roadChoices [data-road=luna]').click()");
    await waitFor("document.querySelector('#chapterFilm').hidden&&"+book+".photoRoad==="+JSON.stringify(pick));
    await send("Input.dispatchKeyEvent",{type:"keyDown",code:"KeyN",key:"N",modifiers:8,windowsVirtualKeyCode:78});
    await send("Input.dispatchKeyEvent",{type:"keyUp",code:"KeyN",key:"N",modifiers:8,windowsVirtualKeyCode:78});
    await waitFor(mapOpen);await tap("ArrowRight");await tap("Escape");await waitFor("document.querySelector('#chapterFilm').hidden");
    assert.equal(await js(book+".photoRoad"),pick);
    console.log("PASS read Mara's map, marked",pick,"and folded a preview away without redirecting the car");
    await js("recQA.frames=[];recQA.samples=true;recQA.start=[recQA.subject.x,recQA.subject.z]");
    await key("keyDown","KeyW");
    try{
      await waitFor("recQA.frames.length>=36&&Math.hypot(recQA.subject.x-recQA.start[0],recQA.subject.z-recQA.start[1])>4",45000);
    }finally{await key("keyUp","KeyW");}
    await js("recQA.samples=false");
    console.log("PERF drive",mode,await js("(()=>{const a=recQA.frames.sort((a,b)=>a-b);return {median:a[Math.floor(a.length*.5)],p95:a[Math.floor(a.length*.95)],samples:a.length,metres:Math.round(Math.hypot(recQA.subject.x-recQA.start[0],recQA.subject.z-recQA.start[1]))};})()"));
    await js(`const drawMap=window.drawBayMap;window.drawBayMap=function(context,state){if(state.streetCar)recQA.map=state;return drawMap(context,state);};`);
    if(aboard){
      await waitFor("!!recQA.map?.streetCar");await parkAt({x:149.50,z:8});
      await waitFor("document.querySelector('#context').innerText.includes('Look at Mara’s contact print')",30000);
      await tap("KeyN");await waitFor("document.querySelector('#chapterLine').textContent.includes('slide the contact')");
      await tap("Escape");assert(!(await js(book+".sleeve")));
      await tap("KeyN");await key("keyDown","Space");
      try{await waitFor(book+".sleeve===true");await snap("sleeve");}finally{await key("keyUp","Space");}
      await tap("Enter");await waitFor("document.querySelector('#chapterFilm').hidden");
      console.log("PASS Mara's contact print in the passenger seat, closed unread and opened to the third bolt");
    }
    const film="JSON.parse(localStorage.getItem(BayLotNegative.key)||'{}')",place=aboard?"wheel":"luna";
    await waitFor("!!recQA.map?.streetCar");
    await parkAt(aboard?{x:146,z:103}:{x:-2,z:37});
    assert.equal(await js("BayLotNegative.passengerSubject(recQA.map.streetCar)"),null);
    await js("recQA.sensorCalls=recQA.previewCalls=0;const sensor=BayRideFilm.Scenery.prototype.paint;BayRideFilm.Scenery.prototype.paint=function(...args){if(args[0].id==='maraGlass')recQA.previewCalls++;else recQA.sensorCalls++;return sensor.apply(this,args);};");
    await waitFor("document.querySelector('#context').innerText.includes('Look through Mara’s finder')");
    await tap("KeyP");await waitFor("recQA.previewCalls>0&&!document.querySelector('#maraFinder').hidden");
    const glass=await js("(()=>{const r=document.querySelector('#maraGlass').getBoundingClientRect();return {x:r.x+r.width*.69,y:r.y+r.height*.42};})()");
    await send("Input.dispatchMouseEvent",{type:"mousePressed",...glass,button:"left",buttons:1,clickCount:1});
    await send("Input.dispatchMouseEvent",{type:"mouseReleased",...glass,button:"left",clickCount:1});
    await tap("Digit3");
    await waitFor("recQA.map.story?.finder?.zoom===1.55&&recQA.map.story.finder.pan>.08&&recQA.map.story.motion.ride.windowLift>.9");
    await snap("window-finder");
    await key("keyDown","KeyW");
    try{
      await waitFor("document.querySelector('#context').innerText.includes('Give Mara the shot')",25000);
      assert((await js("document.querySelector('#objectiveText').textContent")).includes(aboard?"Coast Wheel":"Cine Luna"));
      await tap("KeyN");await waitFor(film+".latent?.place==="+JSON.stringify(place));
    }finally{await key("keyUp","KeyW");}
    assert.equal(await js(book+".photoRoad"),"");
    assert.equal(await js("recQA.sensorCalls"),0,"the shutter does no scene rasterization on the moving frame");
    const shot=await js(film+".latent"),subject=await js("BaySecondSeat.find("+JSON.stringify(place)+").subject");
    const dx=subject.x-shot.eye.x,dz=subject.z-shot.eye.z;
    assert(Math.abs(shot.eye.focal-1.55*Math.min(2.8,Math.hypot(dx,dz)/(place==="wheel"?15:8)))<.00001);
    assert(shot.eye.yaw-Math.atan2(dx,dz)>.08,"the saved negative keeps the player's horizontal framing");
    await js("BayRideFilm.Scenery.prototype.paint=sensor");
    console.log("PASS Frame 13 exposed through the passenger window at",place,"with the chosen framing and deferred print development.");
    // Start both drives in a clear northbound lane beyond the parked club cars, then use
    // the keyboard for the whole recorded minute.
    await waitFor("!!recQA.map?.streetCar");
    const start=await js(`(()=>{const map=recQA.map,v=map.streetCar;
      const others=map.cars.concat(map.motos?.all||[],map.transit?.bus||[]).filter(o=>o!==v);
      for(const at of [38,46,54,30,62,70,78,86])for(const lane of [1.7,3.7,-1.5]){
        const p=BayCoastCup.sample(at,lane);
        if(others.some(o=>{const q=BayDriving.local(p,o.x,o.z);return Math.abs(q.x)<2.6&&q.z> -6&&q.z<13;}))continue;
        return {x:p.x,z:p.z};
      }throw Error("Could not stage a clear northbound start");})()`);
    await parkAt(start);console.log("PERF drive start",mode,start);
    await tap("Escape");await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('One-minute frame check')).click()");
    await waitFor("document.querySelector('#panel').hidden&&recQA.map?.streetCar");
    const checkId=mode==="street"?"Street drive":"Overhead drive";
    await js(`const driveKeys=(${require("./coast-driver.cjs").toString()});
      const mem={cruise:true},held=new Set();recQA.driving=true;recQA.blocks=new Set();
      const timing=recQA.timing={physics:0,traffic:0,oldPhysics:0,oldTraffic:0,seconds:0,trafficSeconds:0,frame:0};
      const physics=BayPavement.Street.prototype.physics,people=BayLocals.animatePeople;
      BayPavement.Street.prototype.physics=function(d,...args){timing.frame+=d;timing.physics++;timing.seconds+=d;return physics.call(this,d,...args);};
      BayLocals.animatePeople=function(p,d,...args){timing.traffic++;timing.trafficSeconds+=d;return people.call(this,p,d,...args);};
      function countOldSteps(){
        let left=timing.frame,ambient=0;timing.frame=0;
        while(left>.00001){
          const d=Math.min(left,1/60);ambient+=d;timing.oldPhysics++;
          if(ambient>=1/30-.00001||left-d<.00001){timing.oldTraffic++;ambient=0;}
          left-=d;
        }
      }
      function driveLoop(t){
        countOldSteps();
        const map=recQA.map,v=map.streetCar;
        if(v)recQA.blocks.add(Math.floor(v.x/36)+','+Math.floor(v.z/36));
        else{recQA.driving=false;recQA.interruption=document.querySelector('#toast').innerText||'Driver left the car';}
        const wanted=new Set(recQA.driving?driveKeys({...map,coastCup:{phase:'race',clock:t/1000}},mem):[]);
        for(const code of held)if(!wanted.has(code)){dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.delete(code);}
        for(const code of wanted)if(!held.has(code)){dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));held.add(code);}
        if(recQA.driving)requestAnimationFrame(driveLoop);
      }requestAnimationFrame(driveLoop);`);
    const result="JSON.parse(localStorage.getItem('sundownBay.frameCheck.v1')||'{}')["+JSON.stringify(checkId)+"]";
    try{await waitFor("recQA.interruption||"+result,100000);}finally{await js("recQA.driving=false;countOldSteps();BayPavement.Street.prototype.physics=physics;BayLocals.animatePeople=people;true");}
    assert.equal(await js("recQA.interruption||null"),null,"The full measurement must stay behind the wheel");
    const minute=await js(result),blocks=await js("recQA.blocks.size");
    console.log("PERF minute drive",mode,JSON.stringify({...minute,blocks}));assert(minute.seconds>=60&&minute.metres>120&&blocks>=4);
    const timing=await js("recQA.timing");console.log("PERF city clock",mode,JSON.stringify(timing));
    assert(timing.seconds>45&&Math.abs(timing.trafficSeconds-timing.seconds)<.00001);
    assert(timing.physics<=timing.oldPhysics&&timing.traffic<=timing.oldTraffic);
    assert(minute.device.startsWith("Linux · "+(mode==="street"?"WebGL":"Canvas 2D"))&&Number.isInteger(minute.slowestSecond));
    if(mode==="street")await checkCity("after drive");
    await snap("drive");await tap("Escape");await waitFor("document.querySelector('#panelBody').innerText.includes('95th percentile')");await tap("Escape");
    async function parkAt(point){
      await js(`(()=>{const v=recQA.map.streetCar;Object.assign(v,{x:${point.x},z:${point.z},yaw:0,path:null});BayDriving.settle(v);})()`);
    }
    if(mode==="overhead"){
      await parkAt(start);await js("("+require("./traffic-drive.cjs").toString()+")(recQA);recQA.driving=true;requestAnimationFrame(driveLoop);");
      await waitFor("!!recQA.trafficDrive",65000);
      const traffic=await js("recQA.trafficDrive");console.log("PERF paired traffic drive",JSON.stringify(traffic));
      assert(traffic.cached>0&&traffic.metres>12&&traffic.frames.every(n=>n>=40));
    }
    await parkAt({x:-149.5,z:-91});await waitFor("document.querySelector('#context').innerText.includes('Mara’s camera')");
    await tap("KeyF");await waitFor("recQA.map.story?.field==='walk'&&recQA.map.story.progress===0");
    await js(`recQA.walkMara=(x,z)=>{
      let held=new Set();recQA.atMark=false;
      const tick=()=>{const a=recQA.map.story.mara,yaw=recQA.rig.yaw,dx=x-a.x,dz=z-a.z;
        const across=dx*Math.cos(yaw)-dz*Math.sin(yaw),forward=dx*Math.sin(yaw)+dz*Math.cos(yaw),want=new Set();
        if(Math.hypot(dx,dz)>.14){
          if(Math.abs(across)>Math.abs(forward)*.43)want.add(across>0?'KeyD':'KeyA');
          if(Math.abs(forward)>Math.abs(across)*.43)want.add(forward>0?'KeyW':'KeyS');
        }
        for(const code of held)if(!want.has(code))dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
        for(const code of want)if(!held.has(code))dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
        held=want;if(want.size)requestAnimationFrame(tick);else recQA.atMark=true;
      };tick();
    };`);
    const walkMara=async(x,z)=>{
      await js("recQA.walkMara("+x+","+z+")");
      try{await waitFor("recQA.atMark",20000);}
      catch(error){const position=await js("recQA.map.story?.mara");throw Error("Mara at "+JSON.stringify(position)+" walking to "+x+", "+z+". "+error.message);}
    };
    await walkMara(await js("recQA.map.story.mara.x"),-94.1);await walkMara(-151.55,-94.1);await walkMara(-151.55,-89.35);
    await waitFor("document.querySelector('#context').textContent.includes('ask Luis')");
    await tap("KeyH");const quote=aboard?"aboard":"ashore";
    await waitFor("!document.querySelector('#speech').hidden&&document.querySelector('#speech span').textContent===BayLotNegative.quotes."+quote);
    await snap("location");
    if(aboard)await walkMara(-151.55,-91.75);
    await tap("KeyF");await waitFor("document.querySelector('.finder-cross.locked')");
    assert.equal(await js("recQA.map.story.roll.stance.x===recQA.map.story.mara.x"),true);
    await snap("lens");await tap("Space");await waitFor("document.querySelector('.file-notice')?.hidden===false");
    if(aboard){
      await waitFor("document.querySelector('.finder-status')?.textContent.includes('Can we match it')");
      await tap("KeyH");
      await waitFor("document.querySelector('.finder-status')?.textContent.includes('tin in focus')");
      if(await js(book+".repairTag"))assert(await js("document.querySelector('.finder-status').textContent.includes('new catch')"));
      await snap("portrait");
      await tap("Space");await waitFor("document.querySelector('.file-portrait')?.hidden===false");await tap("Digit2");
    }else await tap("Digit1");
    const selected=await js(film+".pending");assert.equal(selected.frame,aboard?"14B":"14A");assert.equal(selected.quote,quote);
    const driverPrint=await js(film+".windowPending");assert.equal(driverPrint.place,place);
    assert(driverPrint.image.startsWith("data:image/jpeg;base64,/9j/")&&driverPrint.image.length>1500);
    assert(selected.image.startsWith("data:image/jpeg;base64,/9j/")&&selected.image.length>1500);
    await waitFor("!document.querySelector('#chapterFilm').hidden");await tap("Enter");
    await waitFor("document.querySelector('#panelBody figcaption')?.textContent.includes("+JSON.stringify(selected.frame)+")");await snap("proof");
    await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes("+JSON.stringify(aboard?"Make a print":"Go live")+")).click()");
    await waitFor("recQA.map.story.phase==='delivery'&&recQA.map.story.field==='walk'");
    assert.equal(await js("recQA.map.story.remaining"),aboard?0:105);
    await tap("KeyE");await waitFor("recQA.map.story.field===''&&recQA.map.story.progress===1");
    console.log("PASS walked Mara around the actual car, chose a camera position and filed Luis’s "+quote+" caption before returning to the wheel.");
    await parkAt(await js("BayExposure.routes["+JSON.stringify(route)+"]"));
    await waitFor(film+".published?.frame==="+JSON.stringify(selected.frame),45000);
    assert.deepEqual(await js(film+".published"),selected);assert.equal(await js(film+".pending"),null);
    await waitFor("document.querySelector('#chapterSlug').textContent.includes('FRAME 13')");await snap("window-print");
    await waitFor("document.querySelector('#chapterWho').textContent==='Marta Leal · Port Sol'");
    assert.equal(await js("document.querySelector('#chapterLine').textContent"),await js("BayExposure.interviewCopy("+book+".coachEdition).line"));
    assert.deepEqual(await js(book+".coachEdition"),coachQuote);await snap("six-edition");await tap("Enter");
    assert.deepEqual(await js(film+".windowPrint"),driverPrint);
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
    const display=await js("BayOutsideCopy.sites.find(s=>s.route==="+JSON.stringify(route)+")");
    const corner={x:display.x-1.85,z:display.z-.65};
    await loadFootAt(corner);await waitFor("document.querySelector('#context').innerText.includes('outside copy')");
    await tap("KeyF");await waitFor("document.querySelector('.hang-copy:enabled')");
    const cropControls=await js(`(()=>{
      const panel=document.querySelector('#panelBody');
      for(const [name,value] of [['zoom',1.8],['cx',.74],['cy',.28]]){
        const range=panel.querySelector('input[name='+name+']');range.value=value;range.dispatchEvent(new Event('input'));
      }
      return Array.from(panel.querySelectorAll('output'),o=>o.textContent);
    })()`);
    assert.deepEqual(cropControls,["1.80×","74%","28%"]);
    await js("window.originalNegative=new Image();originalNegative.src="+film+".published.image");
    await waitFor("originalNegative.naturalWidth>0");
    assert.equal(await js(`(()=>{
      const original=originalNegative,proof=document.createElement('canvas');proof.width=608;proof.height=342;
      const g=proof.getContext('2d'),width=Math.min(original.width,original.height*16/9)/1.8,height=width*9/16;
      g.drawImage(original,(original.width-width)*.74,(original.height-height)*.28,width,height,0,0,608,342);
      const sample=g.getImageData(0,0,608,342).data;
      const mounted=document.querySelector('#panelBody canvas').getContext('2d').getImageData(16,52,608,342).data;
      for(let i=0;i<sample.length;i+=97)if(Math.abs(mounted[i]-sample[i])>2)return false;
      return true;
    })()`),true);
    assert((await js("document.querySelector('#panelBody canvas').getAttribute('aria-label')")).includes(await js("BayLotNegative.quotes."+quote)));
    await snap("outside-copy");
    const expected=await js("document.querySelector('#panelBody canvas').toDataURL()");
    await js("document.querySelector('.hang-copy').click()");await waitFor("document.querySelector('#panel').hidden");
    const postedCopy="JSON.parse(localStorage.getItem(BayOutsideCopy.key))["+JSON.stringify(route)+"]";
    assert.deepEqual(await js(postedCopy),{...selected,zoom:1.8,cx:.74,cy:.28});
    await loadFootAt(corner);await waitFor("document.querySelector('#context').innerText.includes('outside copy')");
    if(mode==="street"){
      await js("const drawCase=BayView.prototype.drawPrint;BayView.prototype.drawPrint=function(name,canvas,...args){if(name==='outside-case/face'&&!window.casePixels)window.casePixels=canvas.toDataURL();return drawCase.call(this,name,canvas,...args);};");
      await waitFor("!!window.casePixels");assert.equal(await js("casePixels=== "+JSON.stringify(expected)),true);
    }else{
      await js("const drawCase=BayOutsideCopy.map;BayOutsideCopy.map=function(c,x,y,s,site,copy){if(copy)window.casePlotted=copy.frame;return drawCase.apply(this,arguments);};");
      await waitFor("window.casePlotted==="+JSON.stringify(selected.frame));
    }
    await waitFor("!document.querySelector('#speech').hidden&&document.querySelector('#speech strong').textContent==="+JSON.stringify(display.reader),65000);
    await js("window.readerPainted=false;requestAnimationFrame(()=>requestAnimationFrame(()=>{window.readerPainted=true;}))");await waitFor("window.readerPainted");
    await snap("outside-case");
    await tap("KeyF");await waitFor("document.querySelector('.hang-copy:enabled')");
    assert.equal(await js("document.querySelector('#panelBody canvas').toDataURL()==="+JSON.stringify(expected)),true);
    await js("document.querySelector('#panelBody input[name=zoom]').focus()");
    for(const type of ["keyDown","keyUp"])await send("Input.dispatchKeyEvent",{type,key:"ArrowLeft",code:"ArrowLeft",windowsVirtualKeyCode:37});
    assert.equal(await js("document.querySelector('#panelBody output').textContent"),"1.75×");
    await tap("Escape");assert.equal(await js(postedCopy+".zoom"),1.8);
    console.log("PASS outside copy, exact published crop, street reader, reload and unsaved edit at "+display.name);
    await require("./pavement-show.cjs")({js,tap,key,waitFor,snap,mode,route,selected,loadFootAt});
    await loadFootAt({x:-151.9,z:-88.85});await waitFor("document.querySelector('#context').innerText.includes('dispatch copy')");
    await tap("KeyF");await waitFor("document.querySelector('#chapterWho').textContent==='Dalia’s departure book'");
    assert.equal((await js(book)).morning.luis,aboard?"aboard":"ashore");await tap("Escape");
    await require("./last-transfer.cjs")({js,tap,waitFor,snap,mode,book,loadFootAt});
    await checkReturningPin({x:-151.1,z:-74},"Dalia Cruz · First Crossing");
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
    await tap("KeyN");const bell="rideTest.bellWatch.round";
    await waitFor(bell+"?.phase==='echo'&&!document.querySelector('#luzBells').hidden");
    const cadence=await js(bell+".target");
    assert.equal(await js(bell+".name"),credit==="crew"?"Night shift":"Dalia Cruz");await snap("after-watch");
    async function strike(gaps){
      await tap("KeyH");
      for(const [i,gap] of gaps.entries()){
        await waitFor(bell+".hits.length==="+(i+1)+"&&"+bell+".age-"+bell+".hits["+i+"]>="+(gap-.02));
        await tap("KeyH");
      }
    }
    await strike([cadence[1],cadence[2]-cadence[1]]);await waitFor(bell+".phase==='own'");
    await strike([.62,.95]);await waitFor(book+".bells?.rounds===1");
    const ownCall=await js(book+".bells");
    assert(ownCall.gaps.every((n,i)=>Math.abs(n-[62,95][i])<22));
    assert(ownCall.best[await js("rideTest.departure")]<=44);
    await waitFor("Math.abs(rideTest.u-.5)<.13",95000);await tap("KeyH");await waitFor("rideTest.rider.bell");await snap("deck");
    await waitFor("rideTest.rider.phase==='line'",90000);await snap("quay");
    await key("keyDown","Space");await waitFor("window.letGo&&"+book+".trips===1",35000);await key("keyUp","Space");
    assert.equal((await js(book)).clean,1);await send("Page.reload");await ready();assert.equal((await js(book)).trips,1);
    const front=await js("(()=>{const b=BayTransit.stops[0].berth,p=BayDriving.world(b,4,7);return {...p,yaw:Math.atan2(b.x-p.x,b.z-p.z)};})()");
    await loadFootAt(front,front.yaw);assert.deepEqual(await js(book+".bells"),ownCall);
    await js(`window.busStrokes=[];const ring=BayLandingBells.Watch.prototype.ring;
      BayLandingBells.Watch.prototype.ring=function(place,emit){if(place==='coach')busStrokes.push(this.reply.age);return ring.call(this,place,emit);};`);
    await send("Input.dispatchKeyEvent",{type:"keyDown",code:"KeyH",key:"H",modifiers:8,windowsVirtualKeyCode:72});
    await key("keyUp","KeyH");await waitFor("busStrokes.length>0");await snap("coach-call");
    await waitFor("busStrokes.length===3");const stamps=await js("busStrokes");
    for(const [i,n] of ownCall.gaps.entries())assert(Math.abs(stamps[i+1]-stamps[i]-n/100)<.055);
    console.log("PASS After-watch bell",mode,credit,"echoed, composed, reloaded and answered by Coach 608",JSON.stringify(ownCall));
    const voice=credit==="crew"?"luis":"dalia";
    await checkReturningPin({x:157,z:103},"Room Tone · Mara at Sol FM");
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
    await loadFootAt({x:149.03,z:-10.91});await waitFor("document.querySelector('#context').innerText.includes('Bay Wire')");
    await tap("KeyF");await waitFor("document.querySelector('.bay-front-page')?.getAttribute('aria-label')?.includes('Mara Vega')");
    const press=new RegExp(aboard?"Two lunches":"Public landing");
    assert(press.test(await js("document.querySelector('.bay-front-page').getAttribute('aria-label')")));
    await waitFor("!!BayStreetEditionArt.cover(window.newFrame??=JSON.parse(localStorage.getItem(BayLotNegative.key)).published)");
    await snap("news-box");
    await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('Fold a copy')).click()");
    const pocket="JSON.parse(localStorage.getItem(BayPavement.archiveKey)).at(-1)";
    assert.deepEqual(await js(pocket+".pierPhoto"),selected);
    await send("Page.reload");await ready();await js("document.querySelector('#play').click()");
    await tap("KeyJ");await waitFor("document.querySelector('#panelBody').innerText.includes('Folded copies')");
    await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('Folded copies')).click()");
    await waitFor("document.querySelector('.bay-front-page')?.getAttribute('aria-label')?.includes('Photograph by Mara Vega')");
    console.log("PASS news box, Mara "+selected.frame+" street edition, folded and reopened after reload");
    await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('Show Luis')).click()");
    await loadFootAt({x:-153.5,z:-89.7});await waitFor("document.querySelector('#context').innerText.includes('Show Luis')");
    await tap("KeyF");await waitFor("document.querySelector('#chapterTitle').textContent==='The First Copy'");await snap("luis");
    await waitFor("!document.querySelector('#chapterInsert').hidden&&document.querySelector('#chapterLine').textContent.includes('ink')");
    await snap("inscription");await tap("Enter");await waitFor("document.querySelector('#chapterFilm').hidden");
    await send("Page.reload");await ready();await js("document.querySelector('#play').click()");await tap("KeyJ");
    const button=term=>"Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes("+JSON.stringify(term)+"))";
    await waitFor("!!"+button("Folded copies"));await js(button("Folded copies")+".click()");await js(button("Luis’s note")+".click()");
    assert((await js("document.querySelector('.bay-front-page').getAttribute('aria-label')")).includes(aboard?"orange":"left-handed"));
    await js(button("Luis’s note")+".click()");assert.deepEqual(await js(pocket+".pierPhoto"),selected);
    console.log("PASS The First Copy, signed at the gate and read on the reverse after reload");
    const service=mode==="street"?"shift":"clinic";
    await loadFootAt(await js("BayFirstCrossing.stop("+book+".berth)"));
    await waitFor("document.querySelector('#context').innerText.includes('Board Luz')");
    await js(`window.hearQA={goal:null,held:new Set()};
      const advance=BayFirstCrossing.Service.prototype.step;
      BayFirstCrossing.Service.prototype.step=function(...a){
        const q=hearQA;if(q.goal&&this.rider&&a[3]){
          const p=BayLandingOrder.people[q.goal],dx=p.x-this.rider.x,dz=p.z-this.rider.z;
          const yaw=a[3].yaw-this.yaw,c=Math.cos(yaw),s=Math.sin(yaw),x=dx*c-dz*s,z=dx*s+dz*c,want=new Set();
          if(Math.hypot(dx,dz)<.65)q.goal=null;
          else{const gate=.44*Math.max(Math.abs(x),Math.abs(z));
            if(Math.abs(x)>gate)want.add(x>0?'KeyD':'KeyA');if(Math.abs(z)>gate)want.add(z>0?'KeyW':'KeyS');}
          for(const k of q.held)if(!want.has(k))dispatchEvent(new KeyboardEvent('keyup',{code:k,bubbles:true}));
          for(const k of want)if(!q.held.has(k))dispatchEvent(new KeyboardEvent('keydown',{code:k,bubbles:true}));
          q.held=want;
        }
        q.boat=this;return advance.apply(this,a);
      };`);
    await tap("KeyF");await waitFor("hearQA.boat?.rider?.phase==='sail'",35000);
    async function visit(id){
      await js("hearQA.goal="+JSON.stringify(id));await waitFor("!hearQA.goal",18000);
      assert.equal(await js("BayLandingOrder.nearby(hearQA.boat.rider)"),id);
      assert(await js("BayLandingOrder.deckClear(hearQA.boat.book,hearQA.boat.rider.x,hearQA.boat.rider.z)"));await tap("KeyF");
    }
    await visit("clerk");assert.equal(await js("document.querySelector('#chapterFilm').hidden"),true);
    for(const id of (aboard?["shift","clinic"]:["clinic","shift"])){
      await visit(id);await waitFor(book+".hearing."+id);
      await waitFor("document.querySelector('#speech').innerText.includes("+JSON.stringify(id==="shift"?"last crate":"bus door")+")");
    }
    await snap("hearing");await visit("clerk");
    await waitFor("document.querySelector('#chapterLine').textContent.includes('Which service')");
    await snap("order");await tap("Escape");assert.equal((await js(book)).hearing.draft,"");
    await tap("KeyF");await tap(aboard?"Digit2":"Digit1");await waitFor(book+".hearing.draft==="+JSON.stringify(service));
    assert.equal((await js(book)).hearing.filed,false);
    await waitFor("hearQA.boat.rider.phase==='line'",95000);await tap("KeyF");
    await waitFor(book+".hearing.filed&&document.querySelector('#chapterTitle').textContent==='The Public Slip'",22000);
    await snap("posted");await waitFor("document.querySelector('#chapterLine').textContent.includes("+JSON.stringify(aboard?"either pier":"timetable")+")");
    await tap("Enter");await loadFootAt({x:-153.1,z:-91});
    await waitFor("document.querySelector('#context').innerText.includes('public landing order')");await tap("KeyF");
    await waitFor("document.querySelector('#chapterLine').textContent.includes('Public access recorded')");
    assert.equal(await js("BayLandingOrder.charter("+book+")"),service);
    await tap("Digit1");assert.equal((await js(book)).hearing.draft,service);await tap("Enter");
    console.log("PASS The Public Slip",service,"moving-deck testimony, paper order, mooring, ending, posted deed after reload");
    await require("./landing-run.cjs")({js,waitFor,tap,snap,loadFootAt,book,service});
    await loadFootAt(await js("BayCab.cinema"));
    await js(`const moveRoom=BayCineRoom.move;BayCineRoom.move=function(room,...a){window.lobby=room;return moveRoom(room,...a);};
      const referencePrint=new Image();referencePrint.src=${film}.windowPrint.image;
      const program=BayCineProgram;let currentReel;
      window.BayCineProgram={...program,frame(t,options){return currentReel=program.frame(t,options);}};
      for(const method of ['world','map']){
        const draw=BayCineRoom[method];BayCineRoom[method]=function(...a){
          const result=draw.apply(this,a);
          window.aisleFrame=a[1].seatBlend>.998&&a[4]===currentReel?.canvas?currentReel:null;return result;
        };
      }`);
    await tap("KeyF");await waitFor("!!window.lobby");
    async function walkLobby(code,condition){
      await key("keyDown",code);try{await waitFor(condition);}finally{await key("keyUp",code);}
    }
    await walkLobby("KeyW","lobby.z>=-5.55");await walkLobby("KeyA","lobby.x<=-2.35");
    await tap("KeyF");const loan="[...document.querySelectorAll('#panelBody button')].find(b=>b.innerText.includes('Lend the projectionist'))";
    await waitFor(loan);await js(loan+".click()");assert.equal(await js(film+".onScreen"),true);
    await walkLobby("KeyD","Math.abs(lobby.x)<.32");await walkLobby("KeyW","BayCineRoom.action(lobby)==='seat'");
    await tap("KeyF");await waitFor("window.aisleFrame?.id==='frame-13'&&aisleFrame.elapsed>2&&aisleFrame.elapsed<4.5");
    const photoError=await js(`(()=>{const frame=aisleFrame.canvas;
      const canvas=document.createElement('canvas');canvas.width=32;canvas.height=18;
      const ctx=canvas.getContext('2d',{willReadFrequently:true});ctx.drawImage(referencePrint,0,0,32,18);
      const expected=ctx.getImageData(0,0,32,18).data;
      ctx.drawImage(frame,18*frame.width/416,0,380*frame.width/416,213.75*frame.height/234,0,0,32,18);
      const actual=ctx.getImageData(0,0,32,18).data;
      let sum=0;for(let i=0;i<actual.length;i++)if(i%4!==3)sum+=Math.abs(actual[i]-expected[i]);
      return sum/(32*18*3);})()`);
    assert(photoError<13,"the screen shows the saved passenger-window exposure, RGB error "+photoError);
    await snap("window-screen");
    console.log("PASS kept the driver's print through reload, lent it in the lobby and saw Frame 13 from an aisle seat.");
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    await loadFootAt(await js("BayTransit.stops.find(s=>s.id==='port')"));
    await waitFor("document.querySelector('#context').innerText.includes('Marta’s field tape')");await tap("KeyF");
    assert.deepEqual(await js(book+".coachCopies.port"),coachQuote);
    const tapeButton="[...document.querySelectorAll('#panelBody button')].find(b=>b.innerText.includes('Side A · Coach 608'))";
    await waitFor(tapeButton);await snap("six-timetable");await js(tapeButton+".click()");
    await waitFor("document.querySelector('#speech').textContent.includes('Marta’s note')");
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"Six Sharp departure, gangway or sailing bell, carbon and Mara callback; Public Record, First Crossing, Room Tone edit, car radio broadcast and Dalia’s response",route,credit);
  }catch(e){
    console.log("Campaign state",await js("JSON.stringify({book:"+book+",who:document.querySelector('#chapterWho').textContent,line:document.querySelector('#chapterLine').textContent,hint:document.querySelector('#context').innerText,at:window.recQA?.hero&&[recQA.hero.x,recQA.hero.z],goal:window.recQA?.goal,panel:document.querySelector('#panelTitle').innerText})"));
    if(errors.length)console.log("Runtime errors",errors.slice(0,3));
    await snap("failure");throw e;
  }
};
