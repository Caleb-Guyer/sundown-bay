const assert=require("node:assert/strict");

// Start at the actual title button, in a new browser profile. Count only pier
// frames submitted by the game's selected renderer, including the cold shot.
module.exports=async function pierFrames({js,send,waitFor,key,tap,mode,asset}){
  assert.equal(await js("localStorage.getItem(BayPublicRecord.key)"),null);
  await js(`window.pierQA={shots:{},first:null};
    const director=BayPublicRecord.Story.prototype.step;
    BayPublicRecord.Story.prototype.step=function(...args){
      const changed=director.apply(this,args);pierQA.scene=this;return changed;
    };
    const artist=${mode==="street"?"BaySixSharp":"BaySixSharpArt"},method=${JSON.stringify(mode==="street"?"street":"overhead")},paint=artist[method];
    artist[method]=function(...args){
      const shot=pierQA.scene?.beat()?.watch;
      if(shot){
        const now=performance.now(),row=pierQA.shots[shot]??=[];
        row.push(now);pierQA.first??=now-pierQA.start;
      }
      return paint.apply(this,args);
    };
    pierQA.start=performance.now();document.querySelector("#play").click();true`);
  await waitFor("pierQA.shots.work?.length>=2",60000);
  const aboard=mode==="street";
  if(aboard){
    await key("keyDown","Space");
    try{await waitFor("pierQA.scene.watch.travel===1",45000);}finally{await key("keyUp","Space");}
    await waitFor("pierQA.scene.watch.gate<.035");
  }
  await waitFor("performance.now()-pierQA.shots.work[0]>=8500");
  await tap("KeyH");
  const book="JSON.parse(localStorage.getItem(BayPublicRecord.key)||'{}')";
  await waitFor(book+".morning?.luis==="+JSON.stringify(aboard?"aboard":"ashore"));
  await waitFor("pierQA.scene.beat()?.art==='watchCopy'",45000);
  const measurements=await js("({shots:pierQA.shots,first:pierQA.first,viewport:[innerWidth,innerHeight],cpu:navigator.hardwareConcurrency,ram:navigator.deviceMemory})");
  assert.equal(measurements.cpu,2);assert.equal(measurements.ram,4);
  for(const [name,times] of Object.entries(measurements.shots)){
    assert(times.length>=2,name);
    const intervals=times.slice(1).map((t,i)=>t-times[i]).sort((a,b)=>a-b),duration=times.at(-1)-times[0];
    console.log("PERF pier shot",asset,mode,name,JSON.stringify({frames:times.length,seconds:+(duration/1000).toFixed(2),
      fps:+(intervals.length*1000/duration).toFixed(1),median:+intervals[Math.ceil(intervals.length*.5)-1].toFixed(1),
      p95:+intervals[Math.ceil(intervals.length*.95)-1].toFixed(1),firstPaintMs:Math.round(measurements.first)}));
  }
  assert.deepEqual(Object.keys(measurements.shots),["wide","work","away"]);
  await waitFor("document.querySelector('#chapterFilm').hidden&&"+book+".intro",90000);
  const departure=await js(book+".morning");await send("Page.reload");
  await waitFor("document.readyState==='complete'&&typeof BayPublicRecord==='object'");
  await js("document.querySelector('#play').click()");
  await waitFor("document.querySelector('#intro').hidden&&document.querySelector('#chapterFilm').hidden");
  assert.deepEqual(await js(book+".morning"),departure);
  console.log("PASS pier departure and returning save",mode,JSON.stringify(departure));
};
