const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");

module.exports=async({js,send,key,tap,waitFor,errors,mode})=>{
  const store="sundownBay.secondUnit.v1";
  const saved=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;
    u.remember({x:69.5,z:15,yaw:Math.PI},{garageKey:"coupe@149.00,-22.80"});u.save();
    return localStorage.getItem("${store}");})()`);
  const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem("+JSON.stringify(store)+","+JSON.stringify(saved)+");"});
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:89});
    const folder=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(folder,{recursive:true});
    fs.writeFileSync(path.join(folder,mode+"-junction-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  try{
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayJunctionTurns==='object'");
    await js(`window.crossing={playerLit:0,driverLit:0,waveFrames:0,touched:false,low:99,high:0};
      const distance=BayJunctionTurns.distance;BayJunctionTurns.distance=function(v,all,p,t,...route){
        const room=distance(v,all,p,t,...route);
        if(!p)return room;
        const s=crossing;s.player=p;
        if(!s.driver&&BayJunctionTurns.waitingDriver(p,[v]))s.driver=v;
        if(s.driver===v){
          s.t=t;s.touched||=!!BayDriving.contact(p,v);
          if(v.leftWait?.held&&v.speed<.4)s.stopAt??=t;
          if(v.thankedAt!=null)s.replied=true;
          if(s.replied&&v.x<63&&Math.abs(v.z-2.5)<.5)s.cleared=true;
        }
        return room;
      };
      const mode=${JSON.stringify(mode)},art=mode==='street'?'world':'map',draw=BayStreetCars[art];
      BayStreetCars[art]=function(...args){
        const result=draw(...args),s=crossing,v=args[mode==='street'?2:1],t=args[mode==='street'?4:5];
        if((v===s.player||v===s.driver)&&BayBoulevardLanes.flash(v,t)){
          if(mode==='overhead'||args[0].some(a=>a[0]==='registry/flash/'+v.kind))s[v===s.player?'playerLit':'driverLit']++;
        }
        return result;
      };
      const fn=mode==='street'?'pose':'mapActor',pose=BayMotorists[fn];BayMotorists[fn]=function(...args){
        const result=pose(...args),a=args[1],t=args[mode==='street'?2:5],s=crossing;
        if(s.driver&&a.car===s.driver){
          if(mode==='street'){
            const hand=BayMotorists.hand(a,-1);
            if(hand&&!s.replied)s.low=Math.min(s.low,hand.y-a.y);
            if(hand&&t-s.driver.thankedAt>.2&&t-s.driver.thankedAt<1.2)s.high=Math.max(s.high,hand.y-a.y);
          }
          if(t-s.driver.thankedAt>.10&&t-s.driver.thankedAt<1.4)s.waveFrames++;
        }
        return result;
      };document.querySelector('#play').click();`);
    await key("keyDown","Space");
    await waitFor("crossing.stopAt&&crossing.t-crossing.stopAt>.65&&document.querySelector('#context').innerText.includes('Flash')",60000);
    await snap("waiting");await tap("KeyL");
    await waitFor("crossing.playerLit>0&&crossing.driverLit>0&&crossing.waveFrames>0",30000);await snap("thanks");
    await waitFor("crossing.cleared",40000);await snap("turn");
    const result=await js("({driver:crossing.driver.owner.name,x:crossing.driver.x,z:crossing.driver.z,handRise:crossing.low<99?crossing.high-crossing.low:null,touched:crossing.touched,playerMoved:Math.hypot(crossing.player.x-69.5,crossing.player.z-15),playerLit:crossing.playerLit,driverLit:crossing.driverLit,waveFrames:crossing.waveFrames})");
    assert(!result.touched&&result.playerMoved<.3&&result.x<63);
    if(mode==="street")assert(result.handRise>.10,JSON.stringify(result));
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,result.driver,"stopped on Tideway's approach, saw the player's L-key headlight flash, raised a hand and cleared the opposite lane.",result,"Audio starts 0, cursor locks 0.");
  }catch(error){
    console.log("Junction state",await js("window.crossing&&JSON.stringify({p:crossing.player&&[crossing.player.x,crossing.player.z],v:crossing.driver&&[crossing.driver.id,crossing.driver.x,crossing.driver.z,crossing.driver.speed],stop:crossing.stopAt,t:crossing.t,reply:crossing.replied,wave:crossing.waveFrames,lamps:[crossing.playerLit,crossing.driverLit],hint:document.querySelector('#context').innerText})"));
    await snap("failure");throw error;
  }finally{
    await key("keyUp","Space");await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});
  }
};
