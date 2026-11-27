const assert=require("node:assert/strict");

module.exports=async function chromebook({js,send,tap,waitFor,mode,asset}){
  const view=mode==="street"?"Street":"Overhead";
  console.log("PERF constrained browser",asset,await js("[innerWidth,innerHeight,navigator.hardwareConcurrency,navigator.deviceMemory]"));
  await js(`window.walkTest={};
    const beatStep=BayOceanBeat.Round.prototype.step;
    BayOceanBeat.Round.prototype.step=function(dt,e){walkTest.beat=e;return beatStep.apply(this,arguments);};
    const rescueStep=BayRescue.Service.prototype.step;
    BayRescue.Service.prototype.step=function(dt,e){walkTest.hero=e.hero;return rescueStep.apply(this,arguments);};
    const follow=BayCamera.prototype.update;
    BayCamera.prototype.update=function(){walkTest.rig=this;return follow.apply(this,arguments);};true`);
  await waitFor("Boolean(walkTest.hero&&walkTest.beat&&walkTest.rig)");
  // Start beside the Marlin. Only movement keys move the walker during timing.
  await js("Object.assign(walkTest.hero,{x:162.8,z:-42});walkTest.rig.reset(walkTest.hero);true");
  await tap("Escape");
  await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('One-minute frame check')).click()");
  await waitFor("document.getElementById('panel').hidden");
  await js(`const walkKeys=new Set();walkTest.last=0;walkTest.bearing=1;
    function pavement(t){
      const q=walkTest,p=q.hero;
      if(!q.last)q.last=t;
      const dt=Math.min(.15,(t-q.last)/1000);q.last=t;
      q.rig.orbit(130*dt*Math.cos(t/3600),0,t/1000);
      if(p.z>25)q.bearing=-1;if(p.z< -43)q.bearing=1;
      const dx=Math.max(-1,Math.min(1,(162.8-p.x)*.65)),dz=q.bearing,h=q.rig.yaw;
      const f=dx*Math.sin(h)+dz*Math.cos(h),s=dx*Math.cos(h)-dz*Math.sin(h),wanted=new Set();
      if(!q.stop&&Math.abs(f)>.36)wanted.add(f>0?"KeyW":"KeyS");
      if(!q.stop&&Math.abs(s)>.36)wanted.add(s>0?"KeyD":"KeyA");
      for(const code of walkKeys)if(!wanted.has(code)){dispatchEvent(new KeyboardEvent("keyup",{code}));walkKeys.delete(code);}
      for(const code of wanted)if(!walkKeys.has(code)){dispatchEvent(new KeyboardEvent("keydown",{code}));walkKeys.add(code);}
      if(!q.stop)requestAnimationFrame(pavement);
    }requestAnimationFrame(pavement);true`);
  const result=id=>"JSON.parse(localStorage.getItem('sundownBay.frameCheck.v1')||'{}')["+JSON.stringify(id)+"]";
  let walk;
  try{await waitFor("Boolean("+result(view+" walk")+")",105000);walk=await js(result(view+" walk"));}
  finally{await js("walkTest.stop=true");}
  console.log("PERF constrained walk",asset,JSON.stringify(walk));
  const drive=await require("./drive.cjs")({js,send,tap,waitFor,mode});
  console.log("PERF constrained drive",asset,JSON.stringify(drive));

  // Stage a five-star dispatch, then leave the police and vehicle physics live.
  // Measure only while the player is driving and wanted. A bust ends the sample.
  await js(`const report=walkTest.beat;for(let i=0;i<5;i++)report.call();
    if(report.wanted()!==5)throw Error("Five-star dispatch failed");
    const pursuit={times:[],air:0,units:0,start:performance.now(),last:null,metres:0};
    pair.stop=false;requestAnimationFrame(driver);
    function chaseFrame(t){
      const car=report.driver(),r=pair.map;
      const active=car&&report.wanted()>0&&document.getElementById("chapterFilm").hidden;
      if(active&&pursuit.last!==null){
        pursuit.times.push(t-pursuit.last);pursuit.metres+=Math.hypot(car.x-pursuit.x,car.z-pursuit.z);
        if(r.air)pursuit.air++;pursuit.units=Math.max(pursuit.units,(r.cars||[]).filter(v=>v.kind==="cruiser").length);
      }
      if(car){pursuit.x=car.x;pursuit.z=car.z;}pursuit.last=t;
      if(active&&t-pursuit.start<60000){requestAnimationFrame(chaseFrame);return;}
      pair.stop=true;
      const samples=pursuit.times,ms=samples.reduce((a,b)=>a+b,0),buckets=new Uint32Array(Math.floor(ms/1000));
      let elapsed=0;for(const frame of samples){elapsed+=frame;const i=Math.ceil(elapsed/1000)-1;if(i>=0&&i<buckets.length)buckets[i]++;}
      samples.sort((a,b)=>a-b);walkTest.chase={seconds:ms/1000,frames:samples.length,fps:1000*samples.length/ms,
        median:samples[Math.ceil(.5*samples.length)-1],p95:samples[Math.ceil(.95*samples.length)-1],
        slowestSecond:buckets.length?Math.min(...buckets):null,metres:pursuit.metres,airFrames:pursuit.air,patrol:pursuit.units};
    }requestAnimationFrame(chaseFrame);true`);
  await waitFor("Boolean(walkTest.chase)",100000);
  const chase=await js("walkTest.chase");
  console.log("PERF constrained pursuit",asset,JSON.stringify(chase));
  assert(walk.seconds>=60&&walk.metres>=30,"Walk must cover the street");
  assert(chase.seconds>2&&chase.frames>12,"A moving wanted sample is required");
};
