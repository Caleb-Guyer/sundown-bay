const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,tap,errors,mode})=>{
  const relay=mode==="street",crew="sundownBay.secondUnit.v1";
  async function snap(id){
    if(!process.argv.includes("--frames"))return;
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:89});
    fs.writeFileSync(path.join(dir,mode+"-phone-"+id+".jpg"),Buffer.from(data,"base64"));
  }
  const places=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;
    u.remember({x:153.45,z:-41.32,yaw:0},null,"guest");u.remember({x:153.44,z:126.25,yaw:0},null,"frankie");u.save();
    return localStorage.getItem(BaySecondUnit.key);})()`);
  const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem("+JSON.stringify(crew)+","+JSON.stringify(places)+");"});
  try{
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayRingTwice==='object'");
    await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});
    await js(`window.qa={steps:0,bells:0,held:new Set(),yaw:0,legs:[]};
      const camera=BayCamera.prototype.update;
      BayCamera.prototype.update=function(...args){const out=camera.apply(this,args);qa.yaw=this.yaw;return out};
      const scan=BayRingTwice.Phones.prototype.scan;
      BayRingTwice.Phones.prototype.scan=function(at,...args){const signal=scan.call(this,at,...args);
        qa.phones=this;qa.at=at;qa.now=args[0];qa.steps++;if(signal==='ring')qa.bells++;
        if(at&&qa.walking){
          const dest=qa.legs[0],want=new Set();
          if(this.near?.id==='wheel')qa.legs.length=0;
          else if(dest&&Math.hypot(at.x-dest[0],at.z-dest[1])<.7)qa.legs.shift();
          else if(dest){
            const dx=dest[0]-at.x,dz=dest[1]-at.z,c=Math.cos(qa.yaw),s=Math.sin(qa.yaw);
            const f=dx*s+dz*c,r=dx*c-dz*s,gate=Math.max(Math.abs(f),Math.abs(r))*.45;
            if(Math.abs(f)>gate)want.add(f>0?'KeyW':'KeyS');
            if(Math.abs(r)>gate)want.add(r>0?'KeyD':'KeyA');
            if(Math.hypot(dx,dz)>3)want.add('ShiftLeft');
          }
          for(const code of qa.held)if(!want.has(code))dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
          for(const code of want)if(!qa.held.has(code))dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
          qa.held=want;if(!qa.legs.length)qa.walking=false;
        }return signal;};
      document.querySelector('#play').click();`);
    await waitFor("qa.phones?.near?.id==='marlin'&&qa.bells>0",45000);
    await snap("ring");await tap("KeyL");
    await waitFor("qa.phones.run?.to==='wheel'&&!document.querySelector('#ringSlip').hidden&&qa.phones.talk?.amount>.8");
    assert((await js("document.querySelector('#ringClue').textContent")).includes("boardwalk"));await snap("clue");
    if(relay){await tap("KeyY");await waitFor("qa.phones.run?.relay&&qa.phones.near?.id==='wheel'",65000);}
    else{
      await js("qa.legs=[[166,-41.32],[166,126.25],[153.44,126.25]];qa.walking=true");
      await waitFor("!qa.walking&&qa.phones.near?.id==='wheel'",210000);
    }
    await tap("KeyL");await waitFor("qa.phones.lifted&&document.querySelector('#context').innerText.includes('Salt Chrome')");
    await snap("pick");await tap("Digit2");await waitFor("!!qa.phones.book.cards['marlin/wheel']");
    const card=await js("qa.phones.book.cards['marlin/wheel']");
    assert.equal(card.song,"salt-chrome");assert(card[relay?"relay":"solo"]>0);
    const sig=await js("BayAirwaves.program('breaker',qa.now,BayAirwaves.read({}))");
    assert.equal(sig.track,card.song);assert(sig.credit.includes("Otis Reed"));
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayRingTwice==='object'");
    await js("document.querySelector('#play').click()");await waitFor("!document.querySelector('#hud').hidden");
    await tap("KeyJ");await waitFor("Array.from(document.querySelectorAll('#panelBody button')).some(b=>b.innerText.includes('Ring Twice'))");
    await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('Ring Twice')).click()");
    await waitFor("document.querySelector('#panelBody').innerText.includes('Otis Reed')");await snap("slip");
    assert((await js("document.querySelector('#panelBody').innerText")).includes(relay?"Relay":"Solo"));
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,relay?"Passed the clue to Frankie using Y":"Ran the Ocean Drive route on foot with keyboard input",card,"The chosen record and its named radio dedication aired, and the route slip survived reload.");
  }catch(e){
    console.log("Phone state",await js("JSON.stringify({at:window.qa?.at&&[qa.at.x,qa.at.z],near:window.qa?.phones?.near?.id,run:window.qa?.phones?.run,legs:window.qa?.legs,yaw:window.qa?.yaw,hint:document.querySelector('#context').innerText})"));
    await snap("failure");throw e;
  }
};
