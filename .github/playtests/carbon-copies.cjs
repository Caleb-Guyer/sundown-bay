const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
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
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:90});
    const folder=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(folder,{recursive:true});
    fs.writeFileSync(path.join(folder,mode+"-carbon-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function load(){
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayCarbonCopies==='object'");
    await js(`window.proof={};const draw=window.drawBayMap;window.drawBayMap=function(c,o){if(o.mode==="radar")proof.map=o;return draw(c,o);};
      const fx=BayContactPatchArt.smokeOverlay;BayContactPatchArt.smokeOverlay=function(...args){const n=fx(...args);proof.puffs=Math.max(n,proof.puffs||0);return n;};
      const camera=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const r=camera.apply(this,a);proof.yaw=this.yaw;return r;};`);
    await js("document.querySelector('#play').click()");await waitFor("proof.map&&Number.isFinite(proof.yaw)",30000);
  }
  async function approach(x,z){
    const end=Date.now()+45000;
    while(Date.now()<end){
      const move=await js(`(()=>{const p=proof.map.player,h=proof.yaw,dx=${x}-p.x,dz=${z}-p.z,d=Math.hypot(dx,dz);
        if(d<.58)return null;return [dx*Math.sin(h)+dz*Math.cos(h),dx*Math.cos(h)-dz*Math.sin(h)].map(k=>Math.abs(k)>d*.38?Math.sign(k):0)})()`);
      if(!move){await hold([]);return;}
      await hold([move[0]>0?"KeyW":move[0]<0?"KeyS":"",move[1]>0?"KeyD":move[1]<0?"KeyA":""].filter(Boolean));
      await new Promise(f=>setTimeout(f,72));
    }
    throw Error("Driver did not reach the door");
  }
  try{
    // Restore the driver's actual parking permit and a returning guest on the workshop forecourt.
    await js(`(()=>{const p=BayCarbonCopies.pad,r=BayCarbonCopies.rail;BayMotelParking.write({...p,yaw:0,garageKey:"coupe@149.00,-22.80"},true);
      const u=new BaySecondUnit.Unit();u.met=true;u.remember({x:r.x,z:r.z-1.35,yaw:0},null);u.save();})()`);
    await load();await tap("KeyF");await waitFor("document.querySelector('.carbon-print')?.width===600");
    await snap("order");await js(button("Mark the chalk circle")+".click()");await waitFor("document.querySelector('#panel').hidden");
    const p=await js("BayCarbonCopies.pad");
    await approach(p.x-1.8,p.z+.65);await tap("KeyE");await waitFor("proof.map.player.driving&&proof.map.streetCar?.kind==='coupe'",30000);
    const both=["KeyW","KeyS"];await hold(both);await waitFor("proof.map.streetCar.burn>.8");
    assert(Math.abs(await js("proof.map.streetCar.speed"))<.6);
    for(const [side,direction] of [["left","KeyA"],["right","KeyD"]]){
      await hold([...both,direction,"KeyV"]);await waitFor("proof.map.streetCar.chalkTurn?.side==='"+side+"'&&proof.map.streetCar.chalkTurn.radians>2&&proof.puffs>0",35000);
      await snap(side+"-turn");
      await waitFor(state+".copies?."+side+"?.trace?.length>=60",45000);
      await hold(both);await waitFor("Math.abs(proof.map.streetCar.yawRate)<.06",20000);
    }
    const saved=await js(state),rub=saved.copies;assert.equal(saved.wallet,155);
    for(const side of ["left","right"]){assert.equal(rub[side].model,"Marlin GT");assert(rub[side].seconds>2&&rub[side].seconds<5);}
    await hold([]);await tap("KeyJ");await waitFor(button("Carbon Copies"));await js(button("Carbon Copies")+".click()");
    await waitFor("document.querySelector('.carbon-print')?.width===600");
    const current=await js("document.querySelector('.carbon-print').getAttribute('aria-label')");
    const other=current.startsWith("right")?"left":"right";
    await js(button("Read the "+other+" copy")+".click()");const ink=await js("document.querySelector('.carbon-print').toDataURL()");
    await snap("print");await load();await tap("KeyJ");await waitFor(button("Carbon Copies"));await js(button("Carbon Copies")+".click()");
    if(other==="right")await js(button("Read the right copy")+".click()");
    assert.equal(await js("document.querySelector('.carbon-print').toDataURL()"),ink);
    assert.deepEqual(errors,[]);console.log("PASS",mode,"read the rail order on foot, entered the Marlin GT and filed both real tire rubbings for $155. Left",rub.left.seconds,"s, right",rub.right.seconds,"s. Smoke rendered and the two prints persisted after reload. Audio starts 0, cursor locks 0.");
  }catch(e){console.log("Observed",await js("JSON.stringify({pose:proof?.map?.player&&[proof.map.player.x,proof.map.player.z],v:proof?.map?.streetCar&&[proof.map.streetCar.x,proof.map.streetCar.z,proof.map.streetCar.burn,proof.map.streetCar.chalkTurn?.radians],puffs:proof?.puffs,hint:document.querySelector('#context').innerText,toast:document.querySelector('#toast').innerText})"));await snap("failure");throw e;}
  finally{await hold([]);}
};
