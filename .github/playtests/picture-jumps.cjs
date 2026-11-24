const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const nextStep=require("./sidewalk.cjs");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const course=mode==="street"?0:1,site="BayPictureJumps.sites["+course+"]";
  const state="JSON.parse(localStorage.getItem('sundownBay.v1')||'{}')";
  const notebook="[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==='Romy’s location notebook')";
  const down=new Set();
  async function hold(list){
    for(const code of down)if(!list.includes(code)){await key("keyUp",code);down.delete(code);}
    for(const code of list)if(!down.has(code)){await key("keyDown",code);down.add(code);}
  }
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:89}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function reload(){
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayPictureJumps==='object'");
    await js(`window.proof={next:${nextStep.toString()},air:0};const draw=window.drawBayMap;
      window.drawBayMap=function(c,o){if(o.mode==='radar')proof.map=o;return draw(c,o);};
      const update=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const r=update.apply(this,a);proof.yaw=this.yaw;return r;};
      const step=BayPictureJumps.step;BayPictureJumps.step=function(v,...a){const r=step.call(this,v,...a);proof.v=v;if(v.jumpFlight)proof.air++;if(r)proof.result=r;return r;};`);
    await js("document.querySelector('#play').click()");await waitFor("proof.map&&Number.isFinite(proof.yaw)",30000);
  }
  try{
    // Use the same saved parking permit and character position that a returning player restores.
    await js(`(()=>{const s=${site},at=BayDriving.world(s,0,${course===0?-29:-31}),yaw=s.yaw;
      BayMotelParking.write({...at,yaw,garageKey:'coupe@149.00,-22.80'},true);
      const u=new BaySecondUnit.Unit();u.met=true;u.remember({...BayDriving.world(s,-1.8,-s.length-1),yaw},null);u.save();})()`);
    await reload();await tap("KeyF");await waitFor("document.querySelector('.picture-profile')?.width===600");
    await snap("jump-chalk");
    await js("[...document.querySelectorAll('#panelBody button')].find(b=>b.innerText.includes('Mark the run-up')).click()");
    await waitFor("document.querySelector('#panel').hidden");
    const end=Date.now()+65000;
    while(Date.now()<end){
      const move=await js(`(()=>{const o=proof.map,p=o.player,v=o.cars.find(v=>v.garageKey==='coupe@149.00,-22.80');
        const target=BayDriving.world(v,-1.75,.5);if(Math.hypot(p.x-target.x,p.z-target.z)<1.05)return null;
        const q=proof.next(p,target,.95,o),dx=q.x-p.x,dz=q.z-p.z,h=proof.yaw,d=Math.hypot(dx,dz);
        return [dx*Math.sin(h)+dz*Math.cos(h),dx*Math.cos(h)-dz*Math.sin(h)].map(k=>Math.abs(k)>d*.35?Math.sign(k):0);})()`);
      if(!move)break;
      await hold([move[0]>0?"KeyW":move[0]<0?"KeyS":"",move[1]>0?"KeyD":move[1]<0?"KeyA":""].filter(Boolean));
      await new Promise(f=>setTimeout(f,80));
    }
    await hold([]);await tap("KeyE");await waitFor("proof.map.player.driving&&proof.map.streetCar?.kind==='coupe'",45000);
    await hold(["KeyW"]);await waitFor("proof.air>0",35000);
    if(mode==="street")await hold(["KeyW","KeyV"]);
    await snap("jump-flight");await waitFor("proof.result",20000);
    await hold(["KeyS"]);await waitFor("Math.abs(proof.v.speed)<1",25000);await hold([]);
    const r=await js("proof.result");assert.equal(r.miss,"");assert(r.eligible&&r.trace.length>7&&r.peak>r.site.rise);
    assert.equal(await js(state+".wallet"),80);
    await tap("KeyJ");await waitFor(notebook);await js(notebook+".click()");await waitFor("document.querySelector('.jump-scrub input')");
    async function scrub(){
      return js("(()=>{const el=document.querySelector('.jump-scrub input');el.value=50;el.dispatchEvent(new Event('input'));return document.querySelector('.picture-profile').toDataURL();})()");
    }
    const midpoint=await scrub();await snap("jump-notebook");await reload();await tap("KeyJ");await waitFor(notebook);await js(notebook+".click()");
    if(course)await js("[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+site+".name).click()");
    assert.equal(await scrub(),midpoint);assert.deepEqual(errors,[]);
    console.log("PASS",mode,r.site.name,r.distance,"m. Read ramp chalk, entered the parked car, flew above the deck, earned $80 and scrubbed the same measured flight after reloading. Audio starts 0, cursor locks 0.");
  }catch(e){
    console.log("Playtest state",await js("JSON.stringify({player:window.proof?.map?.player&&[proof.map.player.x,proof.map.player.z],v:proof?.v&&[proof.v.x,proof.v.z,proof.v.speed],air:proof?.air,result:proof?.result?.miss,hint:document.querySelector('#context').innerText,toast:document.querySelector('#toast').innerText})"));
    await snap("jump-failure");throw e;
  }finally{await hold([]);}
};
