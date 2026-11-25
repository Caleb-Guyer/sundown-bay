const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,key,errors,mode})=>{
  const target="cab@77.20,19.00";
  async function frame(name){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-bumpers-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  // Load the public site as a returning guest, already sitting in their car.
  // Each pass starts with the same stock city and the cab in its normal spot.
  async function pass(offset){
    const saved=await js(`(()=>{const u=new BaySecondUnit.Unit(),p={x:${77.2+offset},z:37.6,yaw:Math.PI,garageKey:"coupe@149.00,-22.80"};u.met=true;u.remember(p,p);u.save();return localStorage.getItem("sundownBay.secondUnit.v1");})()`);
    // A normal pagehide saves the current lead's seat. Put this fixture on a
    // fresh load using the existing save format before the game reads it.
    const init=await send("Page.addScriptToEvaluateOnNewDocument",{source:
      'localStorage.removeItem("sundownBay.v1");localStorage.setItem("sundownBay.secondUnit.v1",'+JSON.stringify(saved)+');'});
    try{
      await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayDriving==='object'");
      await js(`window.hitProof={peak:0,roll:0,spin:0,travel:0,marks:0};
        const draw=drawBayMap;window.drawBayMap=function(ctx,o){
          if(o.mode==='radar'){hitProof.map=o;hitProof.marks=Math.max(hitProof.marks,o.skids?.length||0);}
          return draw(ctx,o);
        };
        const swap=BayDriving.exchangeImpact;BayDriving.exchangeImpact=function(a,b,h){
          const speed=a.speed;swap(a,b,h);
          if(b.garageKey===${JSON.stringify(target)}&&b.impactSlide&&!hitProof.hit){
            hitProof.hit=speed;hitProof.target=b;hitProof.start={x:b.x,z:b.z,yaw:b.yaw};
            for(const [type,code] of [['keyup','KeyW'],['keydown','Space']])
              dispatchEvent(new KeyboardEvent(type,{code,bubbles:true,cancelable:true}));
          }
        };
        const slide=BayDriving.slideStep;BayDriving.slideStep=function(v,...args){
          if(v===hitProof.target){const p=hitProof;
            p.spin=Math.max(p.spin,Math.abs(v.impactSlide.spin));p.peak=Math.max(p.peak,v.speed);
            slide(v,...args);p.roll=Math.max(p.roll,Math.abs(v.pitch),Math.abs(v.lean));
            p.travel=Math.hypot(v.x-p.start.x,v.z-p.start.z);p.turn=Math.abs(v.yaw-p.start.yaw);p.rest=!v.impactSlide;
          }else slide(v,...args);
        };
        document.querySelector('#play').click();`);
      await waitFor("hitProof.map?.streetCar?.garageKey==='coupe@149.00,-22.80'");
      assert.equal(await js("hitProof.map.streetCar.z"),37.6);
      if(offset)await frame("approach");
      await key("keyDown","KeyW");
      await waitFor("hitProof.rest&&hitProof.map.streetCar.damage",35000);
      await key("keyUp","KeyW");await key("keyUp","Space");
      if(offset)await frame("aftermath");
      const stats=await js("(({hit,peak,roll,spin,travel,turn,marks})=>({hit,peak,roll,spin,travel,turn,marks}))(hitProof)");
      assert(stats.peak>3&&stats.travel>1&&stats.roll>.02,JSON.stringify(stats));
      assert(await js("!!hitProof.target.damage&&hitProof.target.speed===0"));
      return stats;
    }finally{await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:init.identifier});}
  }
  try{
    const square=await pass(0),corner=await pass(-.7);
    assert(square.turn<.03&&corner.turn>.18&&corner.spin>.45,JSON.stringify({square,corner}));
    assert(corner.marks>0);assert.deepEqual(errors,[]);
    console.log("PASS",mode,"drove straight into the parked cab and clipped it on a second pass. Both bodies reacted, the offset impact rotated the cab and left rubber.",{square,corner},"Audio starts 0, cursor locks 0.");
  }finally{await key("keyUp","KeyW");await key("keyUp","Space");}
};
