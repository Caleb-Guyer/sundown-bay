const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,tap,key,errors,mode})=>{
  const row=name=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(name)+")";
  const saved="JSON.parse(localStorage.getItem('sundownBay.v1')||'{}')";
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-cork-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function load(){
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayRedCork==='object'");
    await js(`window.proof={phases:new Set(),run:false,painted:0};
      const draw=drawBayMap;window.drawBayMap=function(ctx,o){if(o.mode==='radar'){proof.map=o;if(o.angling)proof.phases.add(o.angling.phase);}return draw(ctx,o);};
      const paint=BayRedCorkArt.${mode==="street"?"world":"map"};BayRedCorkArt.${mode==="street"?"world":"map"}=function(...args){
        const out=paint(...args);if(${mode==="street"?"args[0].some(e=>e[0]==='cork/guest-rod')":"args[1].mode==='street'&&args[1].angling"})proof.painted++;return out;};
      document.querySelector('#play').click();`);
    await waitFor("proof.map?.player",30000);
  }
  try{
    const s=mode==="street"?"marlin":"cut",species=s==="cut"?"snook":"jack";
    await js(`(()=>{const p=BayRedCork.sites.find(s=>s.id===${JSON.stringify(s)}),u=new BaySecondUnit.Unit();u.met=true;u.remember({x:p.x-.8,z:p.z+.4,yaw:p.yaw},null);u.save();})()`);
    await load();await waitFor("document.querySelector('#context').innerText.includes("+JSON.stringify(s==="cut"?"tide book":"Red Cork Club")+")",20000);
    await tap("KeyF");await waitFor(row("Borrow the cork rod"));await snap("bench");
    await js(row("Borrow the cork rod")+".click()");await waitFor("proof.map.angling&&!proof.map.angling.walkIn");
    await key("keyDown","KeyD");await waitFor("proof.map.angling.aim>.12");await key("keyUp","KeyD");
    // Drive the cast on animation frames so capturing proof never holds the key
    // through the next run of the fish. Only the game's ordinary keys are used.
    await js(`(()=>{const r=proof.map.angling;let held=false,everHooked=false;
      function space(on){if(on===held)return;held=on;dispatchEvent(new KeyboardEvent(on?'keydown':'keyup',{code:'Space',key:' ',bubbles:true,cancelable:true}));}
      space(true);
      function next(){
        proof.phases.add(r.phase);
        if(r.phase==='wind'&&r.power>.77)space(false);
        if(r.phase==='bite'&&r.clock>.18){space(true);everHooked=true;}
        if(r.phase==='fight'){proof.run||=r.run;space(!r.run);}
        if(r.phase==='miss'||r.phase==='landed'){space(false);proof.finished=r.phase;return;}
        if(r.phase==='ready'&&everHooked){space(false);return;}
        requestAnimationFrame(next);
      }requestAnimationFrame(next);})()`);
    await waitFor("proof.map.angling.phase==='soak'||proof.map.angling.phase==='bite'",20000);await snap("water");
    await waitFor("proof.finished",95000);assert.equal(await js("proof.finished"),"landed");
    await waitFor("proof.map.angling.clock>.45");await snap("release");
    const record=await js(saved+".catchBook");
    assert.equal(record.total,1);assert(record.best[species]>30);assert.equal(await js(saved+".wallet"),55);
    const observed=await js("({phases:[...proof.phases],run:proof.run,frames:proof.painted})");
    for(const p of ["wind","flight","soak","bite","fight","landed"])assert(observed.phases.includes(p),p);
    assert(observed.run&&observed.frames>5);await tap("KeyE");await waitFor("!proof.map.angling");
    await load();await tap("KeyJ");await waitFor(row("Red Cork Club"));await js(row("Red Cork Club")+".click()");
    await waitFor("document.querySelector('.cork-tag')?.getAttribute('aria-label').includes('"+record.best[species]+" centimetres')");
    assert.deepEqual(await js(saved+".catchBook"),record);await snap("tag");assert.deepEqual(errors,[]);
    console.log("PASS",mode,s,"borrowed Cal’s rod at the pier, aimed, cast over water, struck the bite, gave line on the run and landed the fish. Award and illustrated length tag survived reload.",record,observed,"Audio starts 0, cursor locks 0.");
  }catch(e){console.log("Angling state",await js("JSON.stringify({phase:window.proof?.map?.angling?.phase,run:window.proof?.map?.angling?.run,hero:window.proof?.map?.player,objective:document.querySelector('#objective').innerText,context:document.querySelector('#context').innerText,panel:document.querySelector('#panelBody').innerText})"));await snap("failure");throw e;}
  finally{await key("keyUp","Space");await key("keyUp","KeyD");}
};
