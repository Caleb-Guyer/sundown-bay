// Walk the shipped route with keyboard input. Observe both the crossing controller and its rendered lights.
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const held=new Set(),delay=ms=>new Promise(r=>setTimeout(r,ms));
  async function controls(codes){
    for(const k of held)if(!codes.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of codes)if(!held.has(k)){await key("keyDown",k);held.add(k);}
  }
  async function walk(getTarget,radius,done="false",seconds=42){
    const end=Date.now()+seconds*1000;let p;
    while(Date.now()<end){
      p=await js("(()=>{const q="+getTarget+";return {x:me.x,z:me.z,h:head,tx:q.x,tz:q.z,done:"+done+",stage:trip.stage,bea:[trip.bea.x,trip.bea.z,trip.bea.index,trip.bea.coffeePause],phases:[...phases],time:simTime}})()");
      const dx=p.tx-p.x,dz=p.tz-p.z,d=Math.hypot(dx,dz),codes=[];
      if(p.done||d<radius&&done==="false"){await controls([]);return;}
      if(d>=radius){
        const f=dx*Math.sin(p.h)+dz*Math.cos(p.h),s=dx*Math.cos(p.h)-dz*Math.sin(p.h);
        if(Math.abs(f)>d*.35)codes.push(f>0?"KeyW":"KeyS");if(Math.abs(s)>d*.35)codes.push(s>0?"KeyD":"KeyA");
      }
      await controls(codes);await delay(55);
    }
    throw Error("Walk timed out "+JSON.stringify(p));
  }
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const image=await send("Page.captureScreenshot",{format:"jpeg",quality:88}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-"+name+".jpg"),Buffer.from(image.data,"base64"));
  }
  const hooks=`
    window.phases=new Set();window.crossed=new Set();window.peaks=[0,0];window.framed=false;window.minScale=1;
    window.seenGreen=false;window.seenRed=false;window.badLight=false;
    const originalMap=window.drawBayMap;window.drawBayMap=function(c,o){
      if(o.mode==="radar"&&o.coffee){
        window.me=o.player;window.trip=o.coffee;window.simTime=o.time;
        const r=trip.bea.crossing;if(r?.entered&&trip.stage==="walk")crossed.add(r.axis);
      }if(o.mode==="street"&&o.coffee?.stage==="sip"&&c.canvas.height/o.scale<7)framed=true;
      return originalMap(c,o);
    };
    const updateCamera=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const result=updateCamera.apply(this,a);window.head=this.yaw;return result;};
    const beginView=BayView.prototype.begin;BayView.prototype.begin=function(eye,...rest){
      minScale=Math.min(minScale,this.scale);
      if(window.trip?.stage==="sip"&&eye.y<2.3&&Math.hypot(eye.x-BayPalmCoffee.site.x,eye.z-BayPalmCoffee.site.z)<3.4)framed=true;
      return beginView.call(this,eye,...rest);
    };
    const art=window.BayCrosswalkArt,method=${JSON.stringify(mode==="street"?"world":"map")};
    window.BayCrosswalkArt={...art,[method](...a){
      const sig=a[method==="world"?1:4],phase=a[method==="world"?2:5],time=a[method==="world"?3:6];
      if(sig.x===144&&window.trip?.stage==="walk"){phases.add(phase);
        if(phase==="walk"||phase==="finish"){seenRed=true;if(BayCrosswalk.lamps(sig,time)!=="red")badLight=true;}
        else if(BayCrosswalk.lamps(sig,time)!=="red")seenGreen=true;
      }return art[method](...a);
    }};
    const cups=window.BayPalmCoffeeArt;window.BayPalmCoffeeArt={...cups,[method](...a){
      const h=a.at(-1);window.peaks=peaks.map((v,i)=>Math.max(v,h[i]));return cups[method](...a);
    }};
  `;
  try{
    await js(hooks);await waitFor("window.me&&Number.isFinite(window.head)");
    await walk("BayPalmCoffee.home",1.5);await tap("KeyF");await waitFor("trip.stage==='walk'");
    await walk("trip.bea",1.25,"trip.stage==='table'",350);await snap("window");
    const stats=await js("({phases:[...phases],crossed:[...crossed],seenGreen,seenRed,badLight})");
    assert.deepEqual(stats.crossed.sort(),["x","z"]);assert(stats.phases.includes("walk")&&stats.phases.includes("finish")&&stats.seenGreen&&stats.seenRed&&!stats.badLight,JSON.stringify(stats));
    await walk("({x:BayPalmCoffee.site.x+.1,z:BayPalmCoffee.site.z-1.35})",.55);
    await walk("({x:BayPalmCoffee.guest.x,z:BayPalmCoffee.site.z-1.32})",.55);
    await walk("BayPalmCoffee.guest",.44);await tap("KeyF");await waitFor("trip.stage==='sip'");
    await waitFor("peaks[0]>.8&&peaks[1]>.35&&framed",30000);
    assert((await js("document.querySelector('#context').textContent")).includes("Put the cup down"));await snap("coffee");
    await waitFor("trip.cups===1&&trip.stage===''",30000);
    const scale=await js("minScale");
    assert.equal(await js("audioStarts+cursorRequests"),0);
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayPalmCoffee==='object'");
    assert.equal(await js("new BayPalmCoffee.Break({}).cups"),1);
    assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
    console.log("PASS live",mode,"walked from the Marlin, crossed both streets with Bea, watched both lights hold traffic, lifted both cups and recovered the visit after reload. Minimum render scale",scale);
  }finally{await controls([]);}
};
