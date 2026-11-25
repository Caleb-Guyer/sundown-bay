const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const nextStep=require("./sidewalk.cjs");
module.exports=async({js,send,waitFor,key,tap,mode,errors})=>{
  const held=new Set(),sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
  async function hold(codes){
    for(const code of held)if(!codes.includes(code)){await key("keyUp",code);held.delete(code);}
    for(const code of codes)if(!held.has(code)){await key("keyDown",code);held.add(code);}
  }
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-caps-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  async function walk(dest,r){
    const end=Date.now()+50000;
    while(Date.now()<end){
      const v=await js(`(()=>{const p=n.map.player,t=${dest};if(Math.hypot(t.x-p.x,t.z-p.z)<${r})return null;
        const q=n.route(p,t,${r}*.89,n.map),dx=q.x-p.x,dz=q.z-p.z,h=n.yaw;
        return [dx*Math.sin(h)+dz*Math.cos(h),dx*Math.cos(h)-dz*Math.sin(h),Math.hypot(dx,dz)];})()`);
      if(!v){await hold([]);return;}
      const [f,x,l]=v,c=[];if(Math.abs(f)>.32*l)c.push(f>0?"KeyW":"KeyS");if(Math.abs(x)>.32*l)c.push(x>0?"KeyD":"KeyA");
      await hold(c);await sleep(80);
    }
    throw Error("Walk stalled toward "+dest);
  }
  try{
    const start=await js(`(()=>{const s=BaySummerCaps.sites[0],u=new BaySecondUnit.Unit();u.met=true;
      u.remember({x:s.x,z:s.z-8.4,yaw:0},{garageKey:"coupe@149.00,-22.80"});u.save();return localStorage.getItem("sundownBay.secondUnit.v1");})()`);
    const init=await send("Page.addScriptToEvaluateOnNewDocument",{source:'localStorage.setItem("sundownBay.secondUnit.v1",'+JSON.stringify(start)+');'});
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BaySummerCaps==='object'");
    await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:init.identifier});
    await js(`window.n={route:${nextStep.toString()},wet:0,height:0,flow:0,burstFrames:0,fanFrames:0};
      const draw=drawBayMap;window.drawBayMap=function(c,o){if(o.mode==='radar'&&o.summerCaps){n.map=o;n.net=o.summerCaps;n.s=n.net.posts[0];n.car=o.streetCar||n.car;
        n.wet=Math.max(n.wet,n.car?.glassSplash||0);n.height=Math.max(n.height,n.s.cap?.y||0);n.flow=Math.max(n.flow,n.s.pool.depth);}return draw(c,o);};
      const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const t=cam.apply(this,a);n.yaw=this.yaw;return t;};
      const paint=BaySummerCapsArt.${mode==="street"?"world":"map"};BaySummerCapsArt.${mode==="street"?"world":"map"}=function(...args){const out=paint(...args);
        if(${mode==="street"?"args[0].some(item=>item[0].startsWith('summer/burst/'))":"args[1].mode==='street'&&n.s?.flow==='burst'&&n.s.pressure>.5"})n.burstFrames++;
        if(${mode==="street"?"args[0].some(item=>item[0].startsWith('summer/fan/'))":"args[1].mode==='street'&&n.s?.flow==='fan'&&n.s.pressure>.5"})n.fanFrames++;
        return out;};
      document.querySelector('#play').click();`);
    await waitFor("n.map?.player.driving&&n.car.garageKey==='coupe@149.00,-22.80'");
    await hold(["KeyW"]);await waitFor("n.s.mode==='burst'&&n.wet>.30",40000);
    await hold(["KeyS"]);await waitFor("n.car.speed<-.8&&n.car.z<n.s.z-5.5",30000);
    await hold(["KeyW"]);await waitFor("n.car.speed>-.20",20000);await hold([]);
    await waitFor("n.s.cap?.rest&&n.s.pressure>.9");await snap("jet");
    assert(await js("n.height>1.1&&n.wet>.30&&n.flow>.30&&n.burstFrames>1"));
    await tap("KeyE");await waitFor("!n.map.player.driving");await walk("n.s.button",1.25);
    await waitFor("document.querySelector('#context').innerText.includes('Stop the water')");await tap("KeyF");await waitFor("n.s.mode==='closed'");
    await walk("n.s.cap",1.21);await tap("KeyL");await waitFor("n.net.hand===n.s");await snap("carry");
    await walk("n.s",1.29);await tap("KeyL");await waitFor("n.s.mode==='idle'&&n.net.book.marlin===1");
    await walk("n.s.button",1.23);await tap("KeyF");await waitFor("n.s.mode==='fan'&&n.fanFrames>=3");await snap("shower");
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BaySummerCaps==='object'&&BaySummerCaps.readBook().marlin===1");
    assert.deepEqual(errors,[]);console.log("PASS",mode,"drove into the Marlin cap, saw it tumble and fill the gutter, soaked the windshield, backed away, exited, shut off the burst, retrieved and refitted the cap, then ran the shower. Repair survived reload. Audio starts 0, cursor locks 0.");
  }catch(error){
    console.log("Caps state",await js("JSON.stringify({car:window.n?.car&&[n.car.x,n.car.z,n.car.speed],p:window.n?.map?.player&&[n.map.player.x,n.map.player.z,n.map.player.driving],post:window.n?.s&&[n.s.mode,n.s.age,n.s.cap?.x,n.s.cap?.z,n.s.cap?.rest],wet:window.n?.wet,flow:window.n?.flow,burstFrames:window.n?.burstFrames,context:document.querySelector('#context').innerText})"));
    await snap("failure");throw error;
  }finally{await hold([]);}
};
