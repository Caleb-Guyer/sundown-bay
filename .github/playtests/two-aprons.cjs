const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function twoAprons({js,send,waitFor,tap,key,mode,errors}){
  async function shot(name){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:90});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-aprons-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  await js(`window.q={};const advance=BayApronGoal.Game.prototype.step;
    BayApronGoal.Game.prototype.step=function(dt,e){
      q.g=this;q.h=e.hero;q.car=e.car;q.cars=e.traffic;
      const result=advance.call(this,dt,e);
      if(result==="returned")q.returned=true;
      // Release the same keys at the same game-time markers on both renderers.
      const a=this.round;
      if(q.armed&&a?.phase==="set"&&a.charging){
        const ev=(type,code)=>window.dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
        if(!q.started&&a.power>=.32&&q.dir){q.started=true;ev("keydown",q.dir);}
        if(q.started&&Math.abs(a.aim)>=q.target){ev("keyup",q.dir);q.started=false;q.dir=null;}
        if(a.power>=q.power){if(q.dir)ev("keyup",q.dir);ev("keyup","Space");q.armed=false;}
      }
      return result;};true`);
  await waitFor("q.cars?.length>0");
  await js("q.v=q.cars[0];const d=BayDriving.world(q.v,-2.2,0);Object.assign(q.h,d);true");
  await tap("KeyE");await waitFor("q.car===q.v",25000);
  await js("Object.assign(q.v,{x:146.5,z:-24,yaw:Math.PI});BayDriving.settle(q.v);true");
  await key("keyDown","KeyW");try{await waitFor("q.g.phase==='loose'",18000);}finally{await key("keyUp","KeyW");}
  await shot("road");
  await js("Object.assign(q.v,{x:149,z:-22.8,yaw:0});BayDriving.settle(q.v);true");await tap("KeyE");
  await waitFor("!q.car&&Math.hypot(q.g.ball.vx,q.g.ball.vz)<.05");
  await js("Object.assign(q.h,{x:q.g.ball.x-.7,z:q.g.ball.z,yaw:Math.PI/2});true");
  await waitFor("document.querySelector('#context').textContent.includes('Pass the ball')");await tap("KeyF");
  await waitFor("q.returned&&q.g.phase==='invited'");assert.equal(await js("q.g.book.returns"),1);
  await js("Object.assign(q.h,BayApronGoal.mark);true");await waitFor("document.querySelector('#context').textContent.includes('three penalties')");
  await tap("KeyF");await waitFor("q.g.round?.phase==='set'");
  for(const [i,[sign,target,power]] of [[1,.56,.67],[0,0,.35],[-1,.56,.68]].entries()){
    if(i)await waitFor("q.g.round?.phase==='set'");
    if(i===0)await shot("spot");
    await js(`Object.assign(q,{armed:true,started:false,dir:${JSON.stringify(sign===0?null:sign>0?"KeyD":"KeyA")},target:${target},power:${power}});true`);
    await key("keyDown","Space");await waitFor("q.g.round?.shots.length==="+(i+1));await key("keyUp","Space");
  }
  const goals=await js("q.g.round.shots.slice()");assert(goals.includes("goal"));assert.equal(goals[1],"saved");
  await waitFor("!q.g.round");await shot("chalk");
  const saved=await js("q.g.book");assert.equal(saved.scores.guest.last,goals.filter(n=>n==="goal").length);
  await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayApronGoal==='object'");
  assert.deepEqual(await js("new BayApronGoal.Game().book"),saved);assert.deepEqual(errors,[]);
  console.log("PASS Two Aprons",mode,"drive-by, road ball, pass to Paz, keeper commits, three shots and chalk after reload",goals);
};
