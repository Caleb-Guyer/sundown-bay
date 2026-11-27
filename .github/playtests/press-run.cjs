const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,tap,mode,errors})=>{
  const book="JSON.parse(localStorage.getItem(BayPublicRecord.key))";
  const morning=mode==="street"?"aboard":"ashore";
  await js(`localStorage.setItem(BayPublicRecord.key,JSON.stringify({intro:true,stage:"negative",morning:{luis:"${morning}",second:21600}}));`);
  async function launch(){
    await js("window.pressPage=true");await send("Page.reload");
    await waitFor("!window.pressPage&&document.readyState==='complete'&&typeof BayExposure==='object'");
    await js(`window.news={};const q=news,map=drawBayMap;window.drawBayMap=function(c,s){q.map=s;return map(c,s);};
      const service=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){q.hero=e.hero;return service.call(this,dt,e);};
      document.getElementById('play').click();true`);
    await waitFor("q.hero&&q.map?.pressVan");
    await js("Object.assign(q.hero,BayExposure.pickup);true");await waitFor("document.querySelector('#context').innerText.includes('Last Exposure')");
    await tap("KeyF");await waitFor("q.map.story?.phase==='pickup'");
    await js("Object.assign(q.hero,{x:147.6,z:-22.6});true");await tap("KeyE");
    await waitFor("q.map.story?.progress===1",30000);
  }
  await launch();await waitFor("document.querySelector('#panelTitle').textContent.includes('Who gets the picture')");
  await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('Go live')).click()");
  await tap("KeyN");await waitFor("q.map.story?.trackPress");
  // Put both cars on the existing northbound run-in. The traffic AI and player
  // coasting physics drive independently from the horn until the film changes hands.
  await js(`const story=q.map.story,v=story.ride,p=story.press;
    BayDriving.settle(p);Object.assign(p,{x:p.path[0].x,z:-46,yaw:0,corner:0,speed:p.pace,wait:0,reaction:null});
    BayDriving.settle(v);
    Object.assign(v,{x:p.x-2.57,z:p.z+bayCarLayout(p.kind).seatZ-bayCarLayout(v.kind).seatZ,yaw:0,speed:p.pace+.65,vz:p.pace+.65});
    q.start=p.z;q.startCar=v.z;
    if(story.relayHint(v)!=='Pass the film')throw Error(story.relayHint(v));
    dispatchEvent(new KeyboardEvent('keydown',{code:'KeyH'}));dispatchEvent(new KeyboardEvent('keyup',{code:'KeyH'}));
    const step=story.advancePass;story.advancePass=function(){const event=step.apply(this,arguments);
      if(!event&&this.canister()&&this.motion.ride.coverArm)q.animated=true;return event;};true`);
  try{await waitFor("q.map.story.pressMPH>0",18000);}
  catch(err){console.log("Missed press run",await js("({speed:v.speed,pace:p.speed,car:[v.x,v.z,v.yaw],van:[p.x,p.z,p.yaw],hint:story.relayHint(v),phase:story.phase,age:story.passAge})"));throw err;}
  const mph=await js("story.pressMPH");assert(await js("q.animated&&p.z-q.start>4&&v.z-q.startCar>4"));
  assert.equal(await js(book+".deskHold"),mph);
  if(process.argv.includes("--frames")){
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:88}),dir=path.join(__dirname,"curb-wire-proof");
    fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,mode+"-press-run.jpg"),Buffer.from(data,"base64"));
  }
  await launch();await waitFor("q.map.story?.phase==='delivery'&&q.map.story.pressMPH>0");
  assert.equal(await js("q.map.story.pressMPH"),mph);
  await js("const v=q.map.story.ride;BayDriving.settle(v);Object.assign(v,{x:149.5,z:119,yaw:0});true");
  await waitFor("document.querySelector('#chapterWho').textContent.includes('Jo Bell')",30000);
  assert((await js("document.querySelector('#chapterLine').textContent")).includes(morning==="aboard"?"Luis made the boat":"Luis missed the boat"));
  assert.equal(await js("JSON.parse(localStorage.getItem('sundownBay.v1')).pressMPH"),mph);assert.equal(await js(book+".deskHold"),0);
  assert.deepEqual(errors,[]);console.log("PASS press van, moving handoff at",mph,"mph, reload, paid studio delivery and",morning,"broadcast in",mode);
};
