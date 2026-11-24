const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,key,tap,waitFor,mode,errors})=>{
  const delay=ms=>new Promise(r=>setTimeout(r,ms)),held=new Set();
  async function controls(...next){
    for(const k of held)if(!next.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of next)if(!held.has(k)){await key("keyDown",k);held.add(k);}
  }
  async function snap(label){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:90});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  const observer=`
    window.gridSeen=window.driverSeen=window.finishSeen=window.onGreen=false;
    const drawMap=window.drawBayMap;window.drawBayMap=function(c,o){
      if(o.mode==="radar"&&o.green){window.club=o.green;window.ride=o.streetCar;window.site=club.sites[0];}
      return drawMap(c,o);
    };
    const pass=BayOnGreen.Club.prototype.step;BayOnGreen.Club.prototype.step=function(dt,t,...rest){
      const event=pass.call(this,dt,t,...rest);
      if(event==="go")window.onGreen=BayCrosswalk.lamps(this.run.s.signal,t)==="ns";
      return event;
    };
    const art=BayOnGreenArt;window.BayOnGreenArt={...art,
      car(...a){if(a[2].greenId==="ocean"&&a[4]>.1)driverSeen=true;return art.car(...a);},
      carMap(...a){if(a[4].greenId==="ocean"&&a[5]>.1)driverSeen=true;return art.carMap(...a);},
      finish(...a){if(a[3]==="ocean"&&a[4]>0&&a[5]>1)finishSeen=true;return art.finish(...a);},
      finishMap(...a){if(a[5]==="ocean"&&a[6]>0&&a[7]>1)finishSeen=true;return art.finishMap(...a);}
    };
  `;
  async function lineUp(){
    let q;const deadline=Date.now()+65000;
    while(Date.now()<deadline){
      q=await js("({d:BayOnGreen.line-ride.z,v:ride.speed,x:ride.x,stage:club.run?.phase,heat:document.querySelector('#stars').getAttribute('aria-label')})");
      if(Math.abs(q.d)<1.3&&Math.abs(q.v)<.55){await controls();return;}
      const target=Math.abs(q.d)<.70?0:Math.sign(q.d)*Math.min(4.3,Math.sqrt(5*Math.abs(q.d)));
      if(q.v<target-.35)await controls("KeyW");else if(q.v>target+.35)await controls("KeyS");else await controls();
      await delay(55);
    }
    throw Error("Waiting for the grid "+JSON.stringify(q));
  }
  try{
    await js(observer);await waitFor("window.site");await tap("KeyE");await waitFor("!!window.ride",35000);
    await lineUp();await waitFor("club.run?.phase==='offer'");await tap("KeyH");
    await waitFor("club.run?.phase==='armed'&&driverSeen",65000);
    const staged=await js("({x:site.v.x,z:site.v.z,dx:Math.abs(ride.x-site.v.x),gap:Math.abs(ride.z-site.v.z)})");
    assert(staged.dx>2&&staged.dx<5.6&&staged.gap<3.1,JSON.stringify(staged));await snap("grid");
    await waitFor("club.run?.phase==='running'&&onGreen",150000);await controls("KeyW");
    await waitFor("JSON.parse(localStorage.getItem('sundownBay.v1')||'{}').green?.cards?.ocean?.runs===1",45000);
    await controls("KeyS");await waitFor("Math.abs(ride.speed)<1.5",40000);await controls();
    assert(await js("finishSeen"));const card=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).green.cards.ocean");
    assert(["first","second"].includes(card.slip.result)&&card.slip.time>1&&card.slip.reaction>=0);assert.equal(card.runs,1);
    assert.equal(await js("Math.hypot(site.v.x-"+staged.x+",site.v.z-("+staged.z+"))>22"),true);
    await tap("KeyJ");await js("[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('On Green · Timing slips')).click()");
    await waitFor("document.querySelector('.green-slip .slip-time')?.textContent.includes(' s')");await snap("slip");
    const paper=await js("document.querySelector('.green-slip').innerText");assert(paper.includes(card.slip.plate)&&paper.includes("Lena Ríos"));
    assert.equal(await js("audioStarts+cursorRequests"),0);
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayOnGreen==='object'");
    assert.equal(await js("BayOnGreen.read(JSON.parse(localStorage.getItem('sundownBay.v1')).green).cards.ocean.best"),card.slip.time);
    assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
    console.log("PASS live",mode,"drove from the Marlin, staged alongside the numbered hatch, launched on the working green, crossed the timing clock and recovered the printed slip after reload.",card.slip.result,card.slip.time.toFixed(2));
  }finally{await controls();}
};
