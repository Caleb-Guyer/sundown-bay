const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async function halfMoon({js,send,waitFor,tap,key,mode}){
  const book="JSON.parse(localStorage.getItem('sundownBay.halfMoon.v1'))";
  const button=text=>"[...document.querySelectorAll('#panelBody button')].find(b=>b.textContent.includes("+JSON.stringify(text)+"))";
  async function click(text){await waitFor("!!("+button(text)+")");await js(button(text)+".click()");}
  async function shot(label){
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88});
    fs.writeFileSync(path.join(dir,mode+"-moon-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  await js(`window.q={};const step=BayApronGoal.Game.prototype.step;
    BayApronGoal.Game.prototype.step=function(dt,e){q.h=e.hero;return step.call(this,dt,e);};
    const swim=BaySwimming.Swim.prototype.step;
    BaySwimming.Swim.prototype.step=function(...args){q.swim=this;q.dry=swim.apply(this,args);return q.dry;};true`);
  await waitFor("!!q.h");
  const place=expr=>js("Object.assign(q.h,(({x,z})=>({x,z}))("+expr+"));true");
  await place("BayTransit.stops[0]");await tap("KeyF");await click("Take the notice");
  assert.equal(await js(book+".pier"),mode==="street"?"north":"south");
  for(let i=0;i<3;i++){
    await place("new BayHalfMoon.Search().site()");
    await waitFor("!!q.swim");await key("keyDown","Space");
    await waitFor("!!new BayHalfMoon.Search().action(q.h,q.swim)",35000);
    if(i===1){await waitFor("document.querySelector('#context').textContent.includes('pouch')");await shot("dive");}
    await tap("KeyF");await waitFor(book+".stage==="+(i+2));await key("keyUp","Space");
    await waitFor("q.swim.depth<.14",30000);
  }
  await place("({x:BaySwimming.coast(q.h.z),z:q.h.z})");await waitFor("q.dry===true");
  await place("BayTransit.stops[0]");await tap("KeyF");await click("Return punch");
  await waitFor("!!document.querySelector('.moon-transfer .punched')");
  await shot("transfer");await click("Fold the transfer");
  await send("Page.reload",{ignoreCache:true});await waitFor("!document.querySelector('#intro')?.hidden && !!window.BayHalfMoon");
  await js("document.querySelector('#play').click()");await tap("Escape");
  await click("Half Moon Transfer");assert.equal(await js("document.querySelector('.moon-transfer .punched').textContent"),"Marlin Motel");
};
