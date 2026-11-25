const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,tap,key,errors,mode})=>{
  const row=name=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(name)+")";
  const saved="JSON.parse(localStorage.getItem('sundownBay.v1')||'{}')";
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-belt-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function load(setup){
    let seed;
    if(setup){
      const returning=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;${setup};u.save();return localStorage.getItem("sundownBay.secondUnit.v1");})()`);
      seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:'localStorage.setItem("sundownBay.secondUnit.v1",'+JSON.stringify(returning)+');'});
    }
    try{
      await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayPortSpur==='object'");
      await js(`window.proof={closed:new Set(),open:new Set(),painted:0,handled:false};
        const draw=drawBayMap;window.drawBayMap=function(ctx,o){
          if(o.mode==='radar'&&o.portSpur){const r=o.portSpur;proof.map=o;proof.rail=r;
            if(r.trip?.phase==='drive')for(const g of r.gates){if(g.angle>.98)proof.closed.add(g.x);if(proof.closed.has(g.x)&&!g.warning)proof.open.add(g.x);}
            if(r.trip?.phase==='unload'&&r.handling)proof.handled=true;
          }return draw(ctx,o);
        };
        const paint=BayPortSpurArt.${mode==="street"?"world":"map"};BayPortSpurArt.${mode==="street"?"world":"map"}=function(...args){
          const out=paint(...args);if(${mode==="street"?"args[0].some(e=>e[0]==='belt/nine')":"args[1].mode==='street'&&args[1].portSpur"})proof.painted++;return out;};
        document.querySelector('#play').click();`);
      await waitFor("proof.rail&&proof.map.player",30000);
    }finally{if(seed)await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});}
  }
  try{
    const place=mode==="street"?"west":"east";
    if(mode==="street"){
      await load('const p={x:-141.5,z:BayPortSpur.track(-144)-.6,yaw:0,garageKey:"coupe@149.00,-22.80"};u.remember(p,p)');
      await waitFor("proof.map.streetCar?.garageKey==='coupe@149.00,-22.80'");
      await waitFor("proof.rail.held&&proof.rail.gates[0].angle>.98&&proof.rail.speed<.04&&proof.rail.x>-156",110000);
      const before=await js("proof.rail.x");await snap("hold");
      await waitFor("proof.rail.gates[0].age>5");assert(Math.abs((await js("proof.rail.x"))-before)<.12);
      await key("keyDown","KeyW");await waitFor("proof.map.streetCar.z>proof.rail.gates[0].z+8",30000);await key("keyUp","KeyW");
      await waitFor("proof.rail.x>-130&&!proof.rail.gates[0].warning",90000);
    }
    await load(`const s=BayPortSpur.${place};delete u.motors[u.lead];u.remember({...s.desk,yaw:Math.PI},null)`);
    await waitFor("document.querySelector('#context').innerText.includes('Crew board')");await tap("KeyF");await waitFor(row("Sign the waybill"));await snap("board");
    await js(row("Sign the waybill")+".click()");await waitFor("proof.rail.at===proof.rail.trip?.start",140000);
    await tap("KeyE");await waitFor("proof.rail.aboard&&proof.rail.trip.phase==='drive'");await snap("cab");
    const balance=await js(saved+".wallet");
    await js(`(()=>{const line=proof.rail,held=new Set();
      function set(codes){
        for(const code of held)if(!codes.includes(code)){dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));held.delete(code);}
        for(const code of codes)if(!held.has(code)){dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true,cancelable:true}));held.add(code);}
      }
      function next(){
        const r=line.trip;if(!r){set([]);return;}const dx=r.target.x-line.x,d=Math.abs(dx);
        let codes=[];
        if(r.phase==='drive'){
          if(d<.82&&line.speed<.16){codes=['KeyF'];}
          else if(Math.sign(dx)!==line.dir&&d>.85){codes=line.speed>.16?['KeyS']:['KeyG'];}
          else if(d<line.speed*line.speed/(2*3.65)+.42||d<.72){codes=['KeyS'];}
          else codes=['KeyW'];
          if(d<15)codes.push('KeyV');
        }else if(r.phase==='unload')codes=['KeyV'];
        set(codes);requestAnimationFrame(next);
      }
      next();})();`);
    await waitFor("proof.closed.size>0&&proof.rail.speed>1",100000);await snap("crossing");
    await waitFor("proof.rail.handling&&proof.rail.trip?.phase==='unload'&&proof.rail.handling.time>.7",165000);await snap("hoist");
    await waitFor("!proof.rail.trip&&"+saved+".freight?.runs===1",30000);
    const receipt=await js(saved+".freight"),observed=await js("({gates:[...proof.closed],reopened:[...proof.open],handled:proof.handled,frames:proof.painted})");
    assert.equal(observed.gates.length,2);assert.equal(observed.reopened.length,2);assert(observed.handled&&observed.frames>15);
    assert.equal(receipt.destination,place==="west"?"market":"shed");assert(receipt.last>=80);assert.equal(await js(saved+".wallet"),balance+65+Math.round(receipt.last*.5));
    await tap("KeyE");await waitFor("!proof.rail.aboard&&!proof.rail.transfer");
    await load();await tap("KeyJ");await waitFor(row("Port Sol Belt"));await js(row("Port Sol Belt")+".click()");
    await waitFor("document.querySelector('#panelBody').innerText.includes('1 signed delivery')");await snap("receipt");
    assert.deepEqual(await js(saved+".freight"),receipt);assert.deepEqual(errors,[]);
    console.log("PASS",mode,"signed at the crew board, boarded Nine, drove and braked through both protected street crossings, aligned the wagon, operated the ice transfer and stepped down. Pay and score survived reload.",{receipt,observed,carClearedTrack:mode==="street"},"Audio starts 0, cursor locks 0.");
  }catch(e){
    console.log("Rail state",await js("JSON.stringify({x:proof?.rail?.x,dir:proof?.rail?.dir,speed:proof?.rail?.speed,held:proof?.rail?.held,phase:proof?.rail?.trip?.phase,at:proof?.rail?.at?.id,hero:proof?.map?.player,gate:proof?.rail?.gates,context:document.querySelector('#context').innerText,objective:document.querySelector('#objective').innerText,panel:document.querySelector('#panelBody').innerText})"));await snap("failure");throw e;
  }finally{for(const code of ["KeyW","KeyS","KeyV","KeyG","KeyF"])await key("keyUp",code);}
};
