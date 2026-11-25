const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");

module.exports=async({js,send,waitFor,tap,key,errors,mode})=>{
  const coupe="coupe@149.00,-22.80";
  async function start(x,z,yaw){
    const saved=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;u.remember({x:${x},z:${z},yaw:${yaw}},{garageKey:"${coupe}"});u.save();return localStorage.getItem(BaySecondUnit.key);})()`);
    const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:"localStorage.setItem('sundownBay.secondUnit.v1',"+JSON.stringify(saved)+");localStorage.setItem('sundownBay.clock.v1','1300');"});
    try{
      await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayRoadLights==='object'");
      await js(`window.lit={};
        const update=BayRoadLights.Field.prototype.update;
        BayRoadLights.Field.prototype.update=function(t,focus,own,cars,...rest){
          const result=update.call(this,t,focus,own,cars,...rest);
          lit.field=this;lit.t=t;lit.own=own;lit.hatch=cars.find(v=>v.id===9);
          if(lit.hatch?.headlightFlash!=null&&BayBoulevardLanes.flash(lit.hatch,t)&&this.glare.get(lit.hatch)?.asked===lit.hatch.headlightFlash)lit.reply=true;
          return result;};
        const begin=BayView.prototype.begin;
        BayView.prototype.begin=function(...args){const result=begin.apply(this,args);if(this.basis&&args[2]&&!args[5])lit.view=this;return result;};
        const draw=window.drawBayMap;
        window.drawBayMap=function(ctx,state){if(state.mode==='street')lit.map=state;return draw(ctx,state);};
        document.querySelector('#play').click();`);
      await waitFor("lit.own?.garageKey==='"+coupe+"'&&lit.field.enabled",35000);
    }finally{await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});}
  }
  async function switchBeams(){
    await key("keyDown","ShiftLeft");try{await tap("KeyL");}finally{await key("keyUp","ShiftLeft");}
  }
  async function snap(label){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:91});
    if(process.argv.includes("--frames")){
      const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
      fs.writeFileSync(path.join(dir,mode+"-lights-"+label+".jpg"),Buffer.from(data,"base64"));
    }
    return data;
  }
  // Measure the displayed pavement, after the street shader or the overhead compositor.
  async function roadReading(label){
    const points=await js(`(()=>{const points=[],v=lit.own,m=lit.map;
      for(const d of [14,17,20,23,26,29,32,35])for(const across of [-1.2,-.45,.55,1.3]){
        const x=v.x+across,z=v.z+d;
        let xy;
        if(!document.querySelector('#world').hidden){xy=lit.view.project(x,.15,z);if(!xy)continue;}
        else{const c=document.querySelector('#overhead'),dx=(x-m.cx)*m.scale,dy=(m.cz-z)*m.scale,co=Math.cos(m.rotation||0),si=Math.sin(m.rotation||0);
          xy={x:(.5+(co*dx+si*dy)/c.width)*innerWidth,y:(.5+(co*dy-si*dx)/c.height)*innerHeight};}
        if(xy.x>.25*innerWidth&&xy.x<.75*innerWidth&&xy.y>.17*innerHeight&&xy.y<.83*innerHeight)points.push([xy.x/innerWidth,xy.y/innerHeight]);
      }return points;})()`);
    assert(points.length>=6,"Road is in frame "+JSON.stringify(points));
    const data=await snap(label);
    await js(`lit.samples=null;{const image=new Image();image.onload=()=>{const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d');ctx.drawImage(image,0,0);
      lit.samples=${JSON.stringify(points)}.map(([x,y])=>{const p=ctx.getImageData(Math.floor(x*c.width)-1,Math.floor(y*c.height)-1,3,3).data;let sum=0;for(let i=0;i<p.length;i+=4)sum+=p[i+2];return sum/9;});};image.src='data:image/jpeg;base64,${data}';}`);
    await waitFor("!!lit.samples");return js("lit.samples");
  }
  try{
    await start(146,183,0);
    if(mode==="overhead")for(let i=0;i<5;i++)await tap("Minus");
    const t=await js("lit.t");await waitFor("lit.t>"+(t+2.8));
    assert.equal(await js("lit.field.intensity(146,218)"),0);
    const dipped=await roadReading("dipped");
    await switchBeams();await waitFor("lit.own.mainBeam&&lit.field.intensity(146,218)>.35");
    const highTime=await js("lit.t");await waitFor("lit.t>"+(highTime+2.1));
    const high=await roadReading("high");
    const avg=a=>a.reduce((sum,v)=>sum+v,0)/a.length;
    assert(avg(high)>avg(dipped)+9,"Visible blue channel at the same road coordinates "+JSON.stringify([avg(dipped),avg(high)]));
    await tap("KeyZ");const dashAt=await js("lit.t");await waitFor("lit.t>"+(dashAt+2.7));await snap("dash");
    await switchBeams();await waitFor("!lit.own.mainBeam&&lit.field.intensity(146,218)===0");
    await tap("KeyL");await waitFor("lit.own.headlightFlash>0&&lit.field.intensity(146,218)>.35");
    await waitFor("lit.t>lit.own.headlightFlash+1&&lit.field.intensity(146,218)===0");
    await start(59,1,-Math.PI*.5);await switchBeams();await waitFor("lit.reply",60000);
    await snap("reply");await switchBeams();await waitFor("!lit.own.mainBeam");
    assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"dipped/high pavement blue",avg(dipped).toFixed(1),avg(high).toFixed(1),"distant shoulder lit, manual flash cleared, oncoming Tideway driver flashed back, muted.");
  }catch(e){
    console.log("Lighting state",await js("JSON.stringify({field:window.lit?.field?.version,own:lit.own&&[lit.own.x,lit.own.z,lit.own.yaw,lit.own.mainBeam],t:lit.t,reply:lit.reply,glare:lit.hatch&&lit.field?.glare.get(lit.hatch),at:lit.hatch&&[lit.hatch.x,lit.hatch.z],map:!!lit.map,view:!!lit.view})"));
    await snap("failure");throw e;
  }
};
