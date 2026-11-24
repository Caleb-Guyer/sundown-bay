const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const delay=ms=>new Promise(r=>setTimeout(r,ms)),held=new Set();
  async function controls(next){
    for(const k of held)if(!next.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of next)if(!held.has(k)){await key("keyDown",k);held.add(k);}
  }
  const observe=`
    window.head=0;window.bagDrawn=false;window.bootDrawn=false;window.framed=false;
    const map=window.drawBayMap;window.drawBayMap=function(c,o){
      if(o.mode==="radar"&&o.luggage){
        window.me=o.player;window.bell=o.luggage;window.ride=o.streetCar;
        window.auto=ride||o.cars.find(v=>v.garageKey==="coupe@149.00,-22.80");
      }
      if(o.mode==="street"&&o.luggage?.amount>.96&&c.canvas.height/o.scale<7)framed=true;
      return map(c,o);
    };
    const update=BayCamera.prototype.update;BayCamera.prototype.update=function(...args){
      const result=update.apply(this,args);window.head=this.yaw;return result;
    };
    const draw=BayView.prototype.draw;BayView.prototype.draw=function(name,...a){
      if(!this.casting&&typeof name==="string"){
        if(name==="marlin-case-band"&&window.auto&&window.bell?.items?.[1]==="band"){
          const s=BayLuggageBootArt.slots(auto.kind)[1],p=BayDriving.world(auto,s.x,s.z);
          if(Math.hypot(a[0]-p.x,a[2]-p.z)<.15)bagDrawn=true;
        }
        if(name.endsWith("/trunk")&&a[4]>.95)bootDrawn=true;}
      return draw.call(this,name,...a);
    };
    const begin=BayView.prototype.begin;BayView.prototype.begin=function(eye,...args){
      if(window.bell?.amount>.96&&window.auto){
        const p=BayDriving.world(auto,0,-bayCarLayout(auto.kind).halfLength);
        if(eye.y>1.3&&eye.y<3.6&&Math.hypot(eye.x-p.x,eye.z-p.z)<3.6)framed=true;
      }
      return begin.call(this,eye,...args);
    };
    const mapCase=BayLuggageBootArt.map;BayLuggageBootArt.map=function(...a){
      if(a[5]>.9){bootDrawn=true;if(a[6]?.includes("band"))bagDrawn=true;}return mapCase(...a);
    };
  `;
  async function hook(){
    await js(observe);await waitFor("window.me&&window.auto&&Number.isFinite(head)");
  }
  async function walk(expr,radius=.66){
    let p;const until=Date.now()+48000;
    while(Date.now()<until){
      p=await js("(()=>{const q="+expr+";return {x:me.x,z:me.z,h:head,tx:q.x,tz:q.z,hint:document.querySelector('#context').innerText}})()");
      const dx=p.tx-p.x,dz=p.tz-p.z,d=Math.hypot(dx,dz);
      if(d<radius){await controls([]);return;}
      const f=dx*Math.sin(p.h)+dz*Math.cos(p.h),s=dx*Math.cos(p.h)-dz*Math.sin(p.h),keys=[];
      if(Math.abs(f)>d*.34)keys.push(f>0?"KeyW":"KeyS");
      if(Math.abs(s)>d*.34)keys.push(s>0?"KeyD":"KeyA");
      await controls(keys);await delay(55);
    }
    throw Error("Walk timed out "+JSON.stringify(p));
  }
  async function snap(label){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:87}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  const tail="BayDriving.world(auto,0,-bayCarLayout(auto.kind).halfLength-.8)";
  const at=(state)=>"bell.book.bags.band.at==="+JSON.stringify(state);
  try{
    await hook();await walk("BayLeftLuggage.counter",.65);await tap("KeyF");await waitFor("!document.querySelector('#panel').hidden&&document.querySelector('#panelTitle').innerText==='Left luggage'");
    await snap("claim");await tap("Digit1");await waitFor(at("hand"));await walk(tail);
    await tap("KeyK");await waitFor("bell.amount>.96");await tap("Digit2");await waitFor(at("boot")+"&&bell.items[1]==='band'&&bootDrawn&&bagDrawn&&framed",30000);
    await snap("boot");await tap("KeyK");await tap("KeyJ");
    await js("[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('Marlin claim stubs')).click()");
    assert((await js("document.querySelector('#panel').innerText")).includes("Trunk slot 2"));
    await js("[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('Mark guest')).click()");
    await walk("BayDriving.world(auto,-1.75,-bayCarLayout(auto.kind).halfLength-.68)");
    await walk("BayDriving.world(auto,-1.65,-.15)");await tap("KeyE");await waitFor("!!window.ride",35000);
    const start=await js("ride.z");await controls(["KeyW"]);await waitFor("ride.z>"+(start+2.2),25000);
    await controls(["Space"]);await waitFor("Math.abs(ride.speed)<1.8",20000);await controls([]);await tap("KeyE");await waitFor("!ride&&bell.book.parks[auto.garageKey]?.z>"+(start+1.75),35000);
    const parked=await js("({x:auto.x,z:auto.z,yaw:auto.yaw})");assert.equal(await js("audioStarts+cursorRequests"),0);
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayLeftLuggage==='object'");
    await js("document.querySelector('#play').click()");await hook();
    assert.equal(await js(at("boot")),true);assert(Math.abs(await js("auto.z")-parked.z)<.25);
    await walk(tail);await tap("KeyK");await waitFor("bell.amount>.96");await tap("Digit2");await waitFor(at("hand"));
    await walk("BayLeftLuggage.foot(BayLeftLuggage.tags[0])",.8);await tap("KeyF");await waitFor(at("done"));
    await waitFor("document.querySelector('#toast').innerText.includes('signed')");await snap("handoff");
    assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
    console.log("PASS live",mode,"accepted claim 17, used slot two, drove and parked the car, recovered that trunk after reload and gave Pip his case.");
  }finally{await controls([]);}
};
