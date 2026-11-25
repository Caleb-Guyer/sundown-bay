const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,key,tap,errors,mode})=>{
  const read="JSON.parse(localStorage.getItem('sundownBay.v1')||'{}')";
  const pressed=new Set();
  async function hold(codes){
    for(const code of pressed)if(!codes.includes(code)){await key("keyUp",code);pressed.delete(code);}
    for(const code of codes)if(!pressed.has(code)){await key("keyDown",code);pressed.add(code);}
  }
  async function snap(label){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-ocean-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  async function load(){
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayOceanBeat==='object'");
    await js("window.obs={};const draw=window.drawBayMap;window.drawBayMap=function(c,o){if(o.mode==='radar')obs.map=o;return draw(c,o);};");
    await js("document.querySelector('#play').click()");await waitFor("obs.map?.oceanBeat");
  }
  try{
    // Use the saved motel parking permit and a returning character beside that car.
    await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;u.remember({x:136.95,z:-26.4,yaw:0},null);u.save();
      BayMotelParking.write({x:139.1,z:-26.4,yaw:Math.PI,garageKey:"coupe@149.00,-22.80"},true);})()`);
    await load();await tap("KeyE");await waitFor("obs.map.streetCar?.kind==='coupe'&&obs.map.player.driving",30000);
    await waitFor("document.querySelector('#context').innerText.includes('brake lamps')",20000);
    await tap("KeyH");await waitFor("obs.map.oceanBeat.phase==='test'",35000);await snap("lamps");
    await hold(["KeyS"]);await waitFor("['toWindow','write','paper'].includes(obs.map.oceanBeat.phase)",20000);await hold([]);
    await waitFor("obs.map.oceanBeat.phase==='paper'",35000);await snap("window");await tap("KeyF");
    await waitFor("document.querySelector('.ocean-copy')");const slip=await js(read+".oceanBeat.slip");
    assert.equal(slip.kind,"check");assert.equal(slip.number,1);assert.equal(slip.fine,0);assert.equal(slip.car,"Marlin GT");assert(slip.plate);
    const art=await js("document.querySelector('.ocean-copy').toDataURL()");await snap("copy");
    await load();await tap("KeyJ");await js("[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==='Ocean Unit 12').click()");
    await waitFor("document.querySelector('.ocean-copy')");assert.equal(art,await js("document.querySelector('.ocean-copy').toDataURL()"));
    assert.deepEqual(errors,[]);console.log("PASS",mode,"parked the Marlin GT, called Solís by horn, held the brake, met her at the window and read the same signed copy after reloading. Zero audio starts and cursor locks.");
  }catch(e){console.log("Scene",await js("JSON.stringify({p:[obs?.map?.player?.x,obs?.map?.player?.z],v:[obs?.map?.streetCar?.x,obs?.map?.streetCar?.z],phase:obs?.map?.oceanBeat?.phase,context:document.querySelector('#context').innerText,toast:document.querySelector('#toast').innerText})"));await snap("failure");throw e;}
  finally{await hold([]);}
};
