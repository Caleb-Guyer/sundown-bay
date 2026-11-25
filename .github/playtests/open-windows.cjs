const assert=require("node:assert/strict");
const fs=require("node:fs"),path=require("node:path");

module.exports=async({js,send,waitFor,tap,mode,errors})=>{
  const savedKey="sundownBay.secondUnit.v1",coupe="coupe@149.00,-22.80";
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-stereo-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function begin(inside){
    const save=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;
      u.remember({x:42,z:${inside?-6.95:-9.15},yaw:${inside?Math.PI/2:0}},${inside?' {garageKey:'+JSON.stringify(coupe)+'}':'null'});u.save();
      return localStorage.getItem("${savedKey}");})()`);
    const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem("+JSON.stringify(savedKey)+","+JSON.stringify(save)+");"});
    try{
      await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayOpenWindows==='object'");
      await js(`window.streetFM={pan:[],asked:0};
        const step=BayOpenWindows.Street.prototype.step;
        BayOpenWindows.Street.prototype.step=function(...args){const out=step.apply(this,args);
          const f=streetFM;f.street=this;f.at=args[0];f.own=args[1];f.clock=args[3];
          if(this.source?.id===9&&this.air){f.pan.push(this.air.pan);f.program=this.air.program;}
          f.car=this.cars.find(v=>v.id===9);
          return out;};
        const ask=BayOpenWindows.Street.prototype.ask;
        BayOpenWindows.Street.prototype.ask=function(...args){const a=ask.apply(this,args);
          if(a){streetFM.answer={id:a.v.id,station:a.station,song:a.song.id,by:a.v.owner.name};streetFM.asked++;}return a;};
        document.querySelector('#play').click();`);
      await waitFor(inside?"streetFM.own?.garageKey==='"+coupe+"'":"!!streetFM.at&&!streetFM.own");
    }finally{await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});}
  }
  async function ask(){
    await waitFor("streetFM.street?.offer?.id===9&&document.querySelector('#context').innerText.includes('playing')",65000);
    await tap("Slash");await waitFor("streetFM.asked>0");
    const result=await js("streetFM.answer");assert.equal(result.station,"marea");
    assert.equal(await js("document.querySelector('#speech strong').textContent"),result.by);
    assert(await js("!document.querySelector('#speech').hidden&&document.querySelector('#speech span').textContent.includes('94.7')"));return result;
  }
  async function phone(){
    await tap("KeyJ");await waitFor("Array.from(document.querySelectorAll('#panelBody button')).some(b=>b.innerText.includes('Open Windows'))");
    await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('Open Windows')).click()");
    await waitFor("!!document.querySelector('.window-record')");
  }
  try{
    await begin(false);
    const a=await ask();await snap("curb");
    await waitFor("streetFM.pan.some(p=>p>.16)&&streetFM.pan.some(p=>p<-.16)",65000);
    await begin(true);
    const entries=await js("BayOpenWindows.cards().map(c=>[c.song.id,c.street,c.by])");
    assert(entries.some(c=>c[0]===a.song&&c[1]==="Tideway"&&c[2]===a.by));
    const b=await ask();
    assert.equal(await js("BayAirwaves.stationFor(streetFM.own.garageKey)"),b.station);
    await waitFor("document.querySelector('#receiverStation').innerText.includes('94.7')");
    await snap("dial");await phone();await snap("sleeve");
    await js("document.querySelector('.window-record').click()");
    await waitFor("document.querySelector('#receiverCredit').innerText.includes('Listener request')");
    const [leftL,leftR,rightL,rightR]=await require("./stereo-render.cjs")(js,waitFor);
    assert(leftL>.003&&rightR>.003&&leftL>leftR*2&&rightR>rightL*2,"Directional music in offline PCM: "+[leftL,leftR,rightL,rightR]);
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"a real passing hatch crossed the listener’s stereo field; the driver identified the record at the sidewalk and again beside the coupe. The coupe matched 94.7 FM. A saved street credit survived reload and the phone request played on the public receiver.",a,b,"Offline left/right PCM",leftL,leftR,rightL,rightR);
  }catch(e){
    console.log("Street radio",await js("JSON.stringify({at:streetFM.at&&[streetFM.at.x,streetFM.at.z],car:streetFM.car&&[streetFM.car.x,streetFM.car.z,streetFM.car.speed],source:streetFM.street?.source?.id,offered:streetFM.street?.offer?.id,pan:[Math.min(...streetFM.pan),Math.max(...streetFM.pan)],hint:document.querySelector('#context').innerText,answer:streetFM.answer})"));
    await snap("failure");throw e;
  }
};
