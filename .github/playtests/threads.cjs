const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const held=new Set(),delay=ms=>new Promise(ok=>setTimeout(ok,ms));
  async function controls(keys){
    for(const k of held)if(!keys.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of keys)if(!held.has(k)){await key("keyDown",k);held.add(k);}
  }
  async function walk(x,z,r=.74){
    const end=Date.now()+80000;let p;
    while(Date.now()<end){
      p=await js("({x:me.x,z:me.z,h:heading,hint:document.querySelector('#context').innerText})");
      const dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);
      if(d<r){await controls([]);return;}
      const f=dx*Math.sin(p.h)+dz*Math.cos(p.h),s=dx*Math.cos(p.h)-dz*Math.sin(p.h),keys=[];
      if(Math.abs(f)>d*.34)keys.push(f>0?"KeyW":"KeyS");if(Math.abs(s)>d*.34)keys.push(s>0?"KeyD":"KeyA");
      await controls(keys);await delay(62);
    }
    throw Error("Walk to "+x+","+z+" stalled "+JSON.stringify(p));
  }
  async function click(text){
    const query="[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes("+JSON.stringify(text)+"))";
    await waitFor(query+"&&!"+query+".disabled");await js(query+".click()");
  }
  async function snap(label){
    if(!process.argv.includes("--frames"))return;
    const shot=await send("Page.captureScreenshot",{format:"jpeg",quality:90}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-"+label+".jpg"),Buffer.from(shot.data,"base64"));
  }
  const hook=`
    window.heading=0;window.wornSeen=false;window.printSeen=false;
    const draw=window.drawBayMap;window.drawBayMap=function(c,o){
      if(o.mode==='radar')window.me=o.player;
      return draw(c,o);
    };
    const update=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const out=update.apply(this,a);window.heading=this.yaw;return out;};
    const mesh=BayView.prototype.draw;BayView.prototype.draw=function(n,...a){if(n==='low-tide/guest/pitlane')window.wornSeen=true;return mesh.call(this,n,...a);};
    const art=BayThreadsArt;window.BayThreadsArt={...art,map(...a){if(a[5]==='pitlane')window.wornSeen=true;return art.map(...a);}};
    const print=BayView.prototype.drawPrint;BayView.prototype.drawPrint=function(n,...a){
      if(n==='low-tide-customer-proof')window.printSeen=true;return print.call(this,n,...a);
    };
    const frame=BayThreadsStall;window.BayThreadsStall={...frame,map(...a){if(a[6])window.printSeen=true;return frame.map(...a);}};
  `;
  const record="JSON.parse(localStorage.getItem('sundownBay.v1'))",panel="document.querySelector('#panel').dataset.screen";
  async function stall(){await walk(155.2,-24,.62);await tap("KeyF");await waitFor(panel+"==='threads'&&!document.querySelector('#panel').hidden");}
  try{
    await js(hook);await waitFor("window.me");await stall();await click("No. 13 pit jacket");
    assert(await js("document.querySelector('.threads-buy').disabled"));
    const front=await js("document.querySelector('.threads-glass').toDataURL()");await click("Turn right");assert.notEqual(await js("document.querySelector('.threads-glass').toDataURL()"),front);
    await snap("mirror");await click("Tideline polo");await click("Keep it");await waitFor(record+".threads.wear.guest==='tideline'");
    // Cross at the Marlin loading curb and approach the curtain north of the bus shelter.
    await walk(151,-27);await walk(135.8,-27.2);await walk(136,-36.6);await walk(133.16,-37.65,.50);await tap("KeyF");
    await waitFor("!document.querySelector('#fotoFinder').hidden");await waitFor("document.querySelector('#fotoCounter').textContent.includes('2 / 3')",50000);await tap("Digit2");
    await waitFor("document.querySelector('#fotoCounter').textContent.includes('3 / 3')",50000);await tap("Digit3");
    await waitFor(panel+"==='foto-album'&&!document.querySelector('#panel').hidden",50000);
    const strip=await js("new BayOffClock.Album().records[0]");assert(strip.solo&&strip.looks.guest==="tideline");assert.deepEqual(strip.poses,[0,1,2]);await snap("strip");await tap("Escape");
    await walk(136,-36.6);await walk(135.8,-27.2);await walk(151,-27);await stall();await click("See briefs");await click("Hand in");await waitFor(record+".wallet===65&&"+record+".threads.featured==='marlin'");
    await tap("KeyF");await waitFor(panel+"==='threads'");await click("No. 13 pit jacket");await click("Buy · $55");await waitFor(record+".wallet===10&&"+record+".threads.wear.guest==='pitlane'");
    await waitFor("wornSeen&&printSeen",35000);await tap("KeyX");await snap("exchange");
    assert.equal(await js("audioStarts+cursorRequests"),0);await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayLowTide==='object'");
    const restored=await js(record);assert.equal(restored.threads.wear.guest,"pitlane");assert.equal(restored.threads.wear.frankie,"street");assert.deepEqual(restored.threads.prints.marlin,strip);assert.equal(restored.wallet,10);
    await js("document.querySelector('#play').click()");await js(hook);await waitFor("wornSeen&&printSeen",40000);
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS live",mode,"rotated the fitted jacket, took the free polo, made three solo poses, earned $65, bought the $55 jacket and verified the worn outfit and displayed print after reload.");
  }finally{await controls([]);}
};
