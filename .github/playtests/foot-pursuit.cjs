const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function footPursuit({js,send,waitFor,tap,mode,errors}){
  async function snap(name){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-record-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  await js(`window.footQA={};const q=footQA;
    const round=BayOceanBeat.Round.prototype.step;BayOceanBeat.Round.prototype.step=function(dt,e){q.round=this;return round.apply(this,arguments);};
    const work=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){q.hero=e.hero;q.floor=e.ground;return work.apply(this,arguments);};
    const crowd=BayLocals.animatePeople;BayLocals.animatePeople=function(list){q.crowd=list;return crowd.apply(this,arguments);};
    const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(){q.rig=this;return cam.apply(this,arguments);};
    const spawn=BayPursuit.prototype.spawn;BayPursuit.prototype.spawn=function(){
      const v=spawn.apply(this,arguments);
      if(v&&!q.v){q.v=v;Object.assign(v,{x:142,z:-8,speed:1,yaw:0});}return v;
    };
    const step=BayPursuit.prototype.stepFoot;BayPursuit.prototype.stepFoot=function(v){
      const result=step.apply(this,arguments);
      if(v===q.v&&this.foot){q.officer=this.foot;if(v.doorAngle>.5)q.opened=true;
        if(this.foot.phase==="follow"&&Math.hypot(v.x-this.foot.actor.x,v.z-this.foot.actor.z)>3)q.walked=true;}
      return result;
    };
    q.at=(a,x,z,yaw)=>Object.assign(a,{x,z,y:q.floor(x,z),yaw});`);
  await waitFor("q.hero&&q.rig&&q.crowd?.length");await js(`q.at(q.hero,146,0,0);q.rig.reset(q.hero);
    const p=q.crowd.find(w=>!w.name&&!w.onTour&&!w.palmManaged);q.at(p,146,6,0);p.wait=70;`);
  await tap("Digit1");await tap("Space");await waitFor("!!q.v");await tap("Digit0");
  await js("q.hero.yaw=Math.atan2(-4,-8);q.rig.reset(q.hero);true");
  await waitFor("q.opened&&q.walked",30000);await snap("foot-stop");
  await waitFor("document.querySelector('#chapterTitle').textContent==='The Carbon Drawer'",35000);
  await waitFor("!document.querySelector('#chapterInsert').hidden");await snap("foot-copy");
  const copy=await js("JSON.parse(localStorage.getItem('sundownBay.v1')).releaseCopy");
  assert.equal(copy.street,"Ocean Drive");assert.equal(copy.number,1);assert(copy.stars>0);
  await tap("Enter");
  assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
  await send("Page.reload");await waitFor("!window.footQA&&typeof BayOceanBeat==='object'&&document.readyState==='complete'");
  await js(`document.querySelector('#play').click();window.copyQA={};const r=BayRescue.Service.prototype.step;
    BayRescue.Service.prototype.step=function(dt,e){copyQA.h=e.hero;copyQA.floor=e.ground;return r.apply(this,arguments);};
    const b=BayOceanBeat.Round.prototype.step;BayOceanBeat.Round.prototype.step=function(){copyQA.beat=this;return b.apply(this,arguments);};`);
  await waitFor("copyQA.h&&copyQA.beat?.standing()");
  await js("const a=copyQA.beat.actor;Object.assign(copyQA.h,{x:a.x+.7,z:a.z,y:copyQA.floor(a.x+.7,a.z)});true");
  await tap("KeyF");await waitFor("document.querySelector('#panel').dataset.screen==='patrol-copy'&&!document.querySelector('#panel').hidden");
  assert.equal(await js("document.querySelector('#panelBody canvas').getAttribute('aria-label').includes('Ocean Drive')"),true);
  console.log("PASS responding officer used the cruiser door, chased the player, issued a release copy and Solís retrieved it after reload",mode);
};
