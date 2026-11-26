const assert=require("node:assert/strict");
module.exports=async function passing({js,waitFor,key,snap,mode}){
  // Use one local from the live crowd and one straight piece of Ocean sidewalk.
  await js(`q.at(q.hero,153.5,-14.7,Math.PI);q.rig.reset(q.hero);
    q.local=q.crowd.find(w=>!w.name&&!w.fieldSource&&!w.palmManaged&&!w.onTour);
    q.original={...q.local};
    Object.assign(q.local,{x:153.5,z:-20.3,path:[[153.5,-6,1],[153.5,-24,1]],index:0,offset:0,yaw:0,wait:0,stuck:0,alert:0,pace:1.55,phase:0});
    q.gap=Infinity;q.poses=new Set();q.topPoses=new Set();
    const walk=BayLocals.animatePeople;BayLocals.animatePeople=function(){
      const r=walk.apply(this,arguments),p=q.local;
      if(p.passing)q.gaveWay=true;
      if(q.gaveWay)q.gap=Math.min(q.gap,Math.hypot(p.x-q.hero.x,p.z-q.hero.z));
      return r;
    };
    const pose=BayWalkCycle.prototype.pose;BayWalkCycle.prototype.pose=function(body,phase,weight){
      const result=pose.apply(this,arguments);
      if(q.local.walkModels&&Array.from(q.local.walkModels.values()).some(m=>m.vertices===body))q.poses.add(Math.round(1000*phase));
      return result;
    };
    const map=window.drawBayMap;window.drawBayMap=function(c,opt){
      if(opt.mode==="street"){const p=opt.peds?.find(p=>p.x===q.local.x&&p.z===q.local.z);if(p)q.topPoses.add(Math.round(p.stride*1000));}
      return map.apply(this,arguments);
    };
    const list=BayView.prototype.drawStreetList;
    BayView.prototype.drawStreetList=function(items){
      if(items.length&&this.scale<=.75&&items[0][0].startsWith("shadow")&&!q.shadow){
        const gl=this.gl,pixels=(${require("./street-pixels.cjs").toString()}),counts=[];
        const measure=batched=>function(rows){
          let calls=0;const arrays=gl.drawArrays,elements=gl.drawElements;
          gl.drawArrays=function(){calls++;return arrays.apply(gl,arguments);};
          gl.drawElements=function(){calls++;return elements.apply(gl,arguments);};
          try{if(batched)list.call(this,rows);else for(const row of rows)this.draw(...row);}
          finally{gl.drawArrays=arrays;gl.drawElements=elements;}
          counts.push(calls);
        };
        const result=pixels(this,items,measure(true),measure(false),true);
        if(counts[0]>2&&result.painted>8)q.shadow={counts,pixels:result};
      }
      if(items.some(row=>row[0].startsWith("sidewalk/far/")))q.far=true;
      return list.call(this,items);
    };`);
  await key("keyDown","KeyW");try{await waitFor("q.gaveWay",25000);}finally{await key("keyUp","KeyW");}
  await snap("sidewalk-pass");
  try{await waitFor("q.local.z>q.hero.z+1.65",22000);}
  catch(error){
    console.log("Sidewalk state",await js("({player:[q.hero.x,q.hero.z],walker:[q.local.x,q.local.z],shoulder:q.local.passing,gap:q.gap,index:q.local.index,poses:q.poses.size,overhead:q.topPoses.size})"));
    throw error;
  }
  assert(await js("q.gap>.5"),"pedestrian passes beside the player");
  const poses=await js(mode==="street"?"q.poses.size":"q.topPoses.size");assert(poses>=8,"continuous pedestrian gait");
  if(mode==="street"){
    await waitFor("!!q.shadow&&q.far",55000);
    const shadow=await js("q.shadow");assert.equal(shadow.counts[1],1);
    assert(shadow.pixels.silhouette<=Math.max(3,shadow.pixels.painted*.004));
    console.log("PERF sidewalk shadows",JSON.stringify(shadow));
  }
  if(mode==="overhead"){
    const report=await js("("+require("./traffic-prints.cjs").toString()+")()");
    console.log("PERF overhead traffic",JSON.stringify(report));
    assert(report.cars===48&&report.overlap>.93&&report.error<22&&report.live);
  }
  await js("Object.assign(q.local,q.original);true");
  console.log("PASS walked toward a moving local, saw a clear shoulder pass and a continuous gait",mode,poses);
};
