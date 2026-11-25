const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const coastKeys=require("./coast-driver.cjs");
module.exports=async({js,send,waitFor,key,tap,errors,mode})=>{
  const state="JSON.parse(localStorage.getItem('sundownBay.v1')||'{}')";
  const button=name=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(name)+")";
  const down=new Set();
  async function hold(codes){
    for(const code of down)if(!codes.includes(code)){await key("keyUp",code);down.delete(code);}
    for(const code of codes)if(!down.has(code)){await key("keyDown",code);down.add(code);}
  }
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-cup-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function load(){
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayCoastCup==='object'");
    await js(`window.proof={driver:{},ranks:[],pass:[],sectors:new Set()};
      const original=drawBayMap;window.drawBayMap=function(c,o){
        if(o.mode==='radar'){
          proof.map=o;const r=o.coastCup;
          if(r?.phase==='race'){
            proof.sectors.add(r.completed+'/'+r.gate);const rank=r.rank(),last=proof.ranks.at(-1);if(rank!==last)proof.ranks.push(rank);
            const order=r.runners.map(a=>a.at);proof.pass[0]=Math.max(proof.pass[0]||0,...order);proof.pass[1]=Math.max(proof.pass[1]||0,Math.min(...order));
          }
        }
        return original(c,o);
      };
      const move=BayCamera.prototype.update;BayCamera.prototype.update=function(...args){const result=move.apply(this,args);proof.yaw=this.yaw;return result;};
      window.coastPilot=${coastKeys.toString()};`);
    await js("document.querySelector('#play').click()");await waitFor("proof.map&&Number.isFinite(proof.yaw)",30000);
  }
  async function walk(x,z){
    const end=Date.now()+40000;
    while(Date.now()<end){
      const k=await js(`(()=>{const p=proof.map.player,h=proof.yaw,dx=${x}-p.x,dz=${z}-p.z,d=Math.hypot(dx,dz);
        if(d<.70)return null;return [dx*Math.sin(h)+dz*Math.cos(h),dx*Math.cos(h)-dz*Math.sin(h)].map(n=>Math.abs(n)>d*.38?Math.sign(n):0)})()`);
      if(!k){await hold([]);return;}
      await hold([k[0]>0?"KeyW":k[0]<0?"KeyS":"",k[1]>0?"KeyD":k[1]<0?"KeyA":""].filter(Boolean));
      await new Promise(f=>setTimeout(f,65));
    }
    throw Error("Could not reach " + x + ", " + z);
  }
  try{
    await js(`(()=>{const g=BayCoastCup.grid;BayMotelParking.write({...g,garageKey:"coupe@149.00,-22.80"},true);
      const u=new BaySecondUnit.Unit();u.met=true;u.remember({x:150.9,z:39.85,yaw:Math.PI},null);u.save();})()`);
    await load();await tap("KeyF");await waitFor(button("Race the field"));await snap("entry");
    await js(button("Race the field")+".click()");await waitFor("document.querySelector('#panel').hidden");
    await walk(144.05,40.8);await walk(144.02,46.1);await tap("KeyE");
    await waitFor("proof.map.player.driving&&proof.map.streetCar?.kind==='coupe'",30000);
    const money=await js(state+".wallet");await tap("KeyH");await waitFor("proof.map.coastCup.phase==='count'");await snap("grid");
    await waitFor("proof.map.coastCup.phase==='race'",30000);
    // Apply input on display frames. A delayed CDP response or screenshot
    // must not keep the accelerator down while traffic crosses the bonnet.
    await js(`(()=>{const held=new Set();let last=-1;
      function set(codes){
        for(const code of held)if(!codes.includes(code)){dispatchEvent(new KeyboardEvent("keyup",{code,key:code.slice(3).toLowerCase(),bubbles:true}));held.delete(code);}
        for(const code of codes)if(!held.has(code)){dispatchEvent(new KeyboardEvent("keydown",{code,key:code.slice(3).toLowerCase(),bubbles:true,cancelable:true}));held.add(code);}
      }
      function frame(){
        const r=proof.map?.coastCup;if(!r||r.phase!=="race"){set([]);return;}
        if(r.clock-last>.035){set(coastPilot(proof.map,proof.driver));last=r.clock;}
        requestAnimationFrame(frame);
      }
      frame();})()`);
    const end=Date.now()+390000;let pack=false,bell=false;
    while(Date.now()<end){
      const data=await js("(()=>{const c=proof.map.coastCup;return {phase:c.phase,clock:c.clock,lap:c.completed};})()");
      if(data.phase!=="race")break;
      if(!pack&&data.clock>3){await snap("field");pack=true;}
      if(!bell&&data.lap===1){await snap("bell");bell=true;}
      await new Promise(f=>setTimeout(f,190));
    }
    await hold([]);await waitFor(state+".clubCup?.last",12000);await tap("KeyJ");await waitFor("!document.querySelector('#panel').hidden");
    const record=await js(state+".clubCup"),stats=await js("({ranks:proof.ranks,sectors:[...proof.sectors],furthest:proof.pass,length:BayCoastCup.length})");
    assert.equal(record.last.car,"Marlin GT");assert.equal(record.starts,1);assert.equal(record.last.time,record.best);assert(record.lap>12&&record.last.time>record.lap);
    assert.equal(await js(state+".wallet"),money+[0,205,130,75][record.last.place]);assert.equal(stats.sectors.length,10);
    assert(stats.furthest[1]>stats.length,"Both rivals must be racing. Distances "+JSON.stringify(stats.furthest));
    assert.equal(record.last.laps.length,2);assert.equal(record.splits.length,10);assert(record.last.field.every(r=>r.time!==null||r.back>=0));
    assert(stats.ranks.length>0);
    await load();await tap("KeyJ");await waitFor(button("Sol Motor Club"));await js(button("Sol Motor Club")+".click()");
    await waitFor("document.querySelector('#panelBody').innerText.includes('"+record.last.plate+"')");await snap("result");
    assert.deepEqual(await js(state+".clubCup"),record);assert.deepEqual(errors,[]);
    console.log("PASS",mode,"met Luz, brought the Marlin GT to the grid, drove both laps using real steering, brake and throttle, crossed every sector and retained the paid result after reload.",record.last,"Positions",stats.ranks,"Rival distances",stats.furthest,"Audio starts 0, cursor locks 0.");
  }catch(e){
    console.log("Race state",await js("JSON.stringify({rivals:proof.map?.coastCup?.runners.map(r=>({at:r.at,blocked:r.blocked,pos:[r.v.x,r.v.z],lane:[r.offset,r.targetOffset],room:r.room,near:proof.map.cars.filter(o=>o!==r.v&&Math.hypot(o.x-r.v.x,o.z-r.v.z)<7).map(o=>[o.kind,o.x,o.z])})),phase:proof.map?.coastCup?.phase,lap:proof.map?.coastCup?.completed,gate:proof.map?.coastCup?.gate,clock:proof.map?.coastCup?.clock,hero:proof.map?.player&&[proof.map.player.x,proof.map.player.z],v:proof.map?.streetCar&&[proof.map.streetCar.x,proof.map.streetCar.z,proof.map.streetCar.yaw,proof.map.streetCar.speed],hud:document.querySelector('#objective').innerText,context:document.querySelector('#context').innerText,panel:document.querySelector('#panelBody').innerText})"));
    await snap("failure");throw e;
  }finally{await hold([]);}
};
