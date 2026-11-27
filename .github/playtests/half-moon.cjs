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
    const advance=BayStarlite.Theatre.prototype.step;
    BayStarlite.Theatre.prototype.step=function(dt){q.projector=this;return advance.call(this,dt);};
    const project=BayStarlite.Theatre.prototype.frame;
    BayStarlite.Theatre.prototype.frame=function(options,booked,...args){
      if(options.moonTake&&!this.run){q.options=options;q.bill=this.show(BayCineProgram.describe(options),booked).reel.id;}
      return project.call(this,options,booked,...args);};
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
  await place("BayStarlite.booth");await tap("KeyF");await click("Record live sound");
  const run="q.projector.run.dub";
  await waitFor(run+".age>1");await shot("bell");
  for(const [i,code] of ["KeyH","Space"].entries()){
    await waitFor(run+".age >= "+run+".beats["+i+"]-.07",25000);
    await tap(code);assert.notEqual(await js(run+".marks["+i+"]"),null);
  }
  await shot("punch");
  await waitFor(book+".take?.length===2",18000);assert(await js(run+".score>=60"));
  await tap("KeyE");await waitFor("!q.projector.run");
  // Look at Ada's program again from the booth, with the public projector running.
  await waitFor("q.bill==='last-boat' || q.projector.onScreen==='last-boat'");
  await tap("KeyF");await waitFor("!!("+button("Live Foley")+")");await tap("Escape");
  const proof=await js(`(() => {
    const theatre=new BayStarlite.Theatre(),rec=${book},opts={moonPier:rec.pier,moonTake:rec.take};
    const ordinary=new OffscreenCanvas(416,234).getContext('2d',{willReadFrequently:true});
    const printed=new OffscreenCanvas(416,234).getContext('2d',{willReadFrequently:true});
    let diff=0,count=0,hits=0;
    for(const age of [.3,rec.take[0]/100,5.8,rec.take[1]/100,11.8]){
      theatre.clock=age;ordinary.drawImage(theatre.frame(opts,'last-boat',416),0,0);
      const sheet=theatre.frame(opts,'last-boat',416,true);printed.drawImage(sheet,0,0);
      if(sheet===theatre.frame(opts,'last-boat',416,true))hits++;
      const a=ordinary.getImageData(0,0,416,234).data,b=printed.getImageData(0,0,416,234).data;
      for(let k=0;k<a.length;k++){diff=Math.max(diff,Math.abs(a[k]-b[k]));if(a[k]!==b[k])count++;}
    }
    const cinema=BayCineProgram.frame(5.8,opts);
    const sources=[new BayStarlite.Theatre(),new BayStarlite.Theatre()],timings=[[],[]];
    for(let i=0;i<36;i++)for(const v of (i%4===1||i%4===2?[1,0]:[0,1])){
      const p=sources[v],out=v?printed:ordinary,start=performance.now();p.clock=i*.1;
      for(let j=0;j<3;j++){
        const image=p.frame({},'coast',72,!!v);out.save();out.translate(75+j*9,51);
        out.rotate(i*.027);out.drawImage(image,-36,-14,72,28);out.restore();out.getImageData(69,49,4,4);
      }
      if(i>=4)timings[v].push(performance.now()-start);
    }
    return {diff,count,hits,bitmap:theatre.print instanceof ImageBitmap,cinema:cinema.id,
      projectionMedianMs:timings.map(a=>a.sort((x,y)=>x-y)[a.length>>1])};
  })()`);
  assert(proof.bitmap&&proof.hits===5&&proof.diff<=1&&proof.cinema==="last-boat",JSON.stringify(proof));
  console.log("PASS Ada's two live Foley cues",mode,JSON.stringify(proof));
  await send("Page.reload",{ignoreCache:true});await waitFor("!document.querySelector('#intro')?.hidden && !!window.BayHalfMoon");
  await js("document.querySelector('#play').click()");await tap("Escape");
  await click("Half Moon Transfer");assert.equal(await js("document.querySelector('.moon-transfer .punched').textContent"),"Marlin Motel");
  assert.equal(await js(book+".take.length"),2);
};
