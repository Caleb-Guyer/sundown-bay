/* Measure the game's stereo graph in PCM memory. No playback device is connected. */
module.exports=async function stereoRender(js,waitFor){
  await js(`void (async()=>{
    const code=await (await fetch("radio.js?stereo="+Date.now())).text();
    const rate=24000,seconds=1.8;
    async function render(pan){
      const sink=new OfflineAudioContext(2,Math.round(rate*seconds),rate);let now=0;
      const clock=new Proxy(sink,{get(target,key){
        if(key==="currentTime")return now;
        if(key==="state")return "running";
        if(["resume","suspend","close"].includes(key))return ()=>Promise.resolve();
        const value=Reflect.get(target,key,target);return typeof value==="function"?value.bind(target):value;
      }});
      const isolated={AudioContext:class{constructor(){return clock;}},BayAirwavesScore};
      const sound=Function("window",code+";return window.BaySound")(isolated);
      if(!sound.setEnabled(true))throw Error("Offline stereo graph unavailable");
      for(let i=0;i<seconds*60;i++){
        now=i/60;
        const program={decks:[{id:"mango-wire",key:"marea/pcm",beat:20+now*1.8,tempo:108,level:1}]};
        sound.update({time:now,streetListening:true,radioProgram:program,
          passingRadio:pan===null?null:{program,gain:.5,cutoff:2300,pan}});
      }
      return sink.startRendering();
    }
    const quiet=await render(null),left=await render(-.82),right=await render(.82);
    function level(track,ear){
      const a=track.getChannelData(ear),b=quiet.getChannelData(ear);let sum=0,count=0;
      for(let i=rate*.30;i<a.length;i++){sum+=(a[i]-b[i])**2;count++;}
      return Math.sqrt(sum/count);
    }
    return [level(left,0),level(left,1),level(right,0),level(right,1)];
  })().then(levels=>window.stereoResult={levels},error=>window.stereoResult={error:String(error)})`);
  await waitFor("!!window.stereoResult");
  const result=await js("window.stereoResult");
  if(result.error)throw Error(result.error);
  return result.levels;
};
