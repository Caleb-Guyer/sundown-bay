/* Kit's portable reel machine measures the source in the world and keeps the take itself. */
(() => {
  "use strict";
  const job={id:"marsh-line",name:"The Marsh Line",by:"Kit Bell"};
  const notes={
    spoonbills:"Follow Shell Levee to the little hide. Those pink birds clack their bills before they lift off.",
    windpump:"Pull off just north of the bridge. The old pump squeaks on the downstroke. Catch that.",
    trawler:"Go out to the end of our pier. Wait for the shrimp boat to come round under power."
  };
  const wrap=n=>Math.atan2(Math.sin(n),Math.cos(n)),limit=(v,a,b)=>Math.max(a,Math.min(b,v)),unit=v=>limit(v,0,1);
  function archive(raw){
    const reels={};
    for(const {id} of BayCutWildlife.sources){
      const record=raw?.[id],tape=BayCutTape.read(record?.tape);
      if(!tape||tape.id!==id||!Number.isInteger(record.score)||record.score<45||record.score>100)continue;
      reels[id]={score:record.score,minute:Number.isFinite(record.minute)?limit(Math.floor(record.minute),0,1439):1080,tape};
    }return reels;
  }
  const reelKey=id=>"sundownBay.fieldReel.v1."+id;
  function restore(reels){
    for(const {id} of BayCutWildlife.sources){
      try{
        const record=archive({[id]:JSON.parse(localStorage.getItem(reelKey(id))||"null")})[id];
        if(record&&(!reels[id]||record.score>reels[id].score))reels[id]=record;
      }catch{}
    }return reels;
  }
  function keep(id,record){
    try{localStorage.setItem(reelKey(id),JSON.stringify(record));}catch{}
  }
  const title=id=>BayCutWildlife.sources.find(s=>s.id===id)?.name||id;
  class Run{
    constructor(source){
      this.source=source;this.phase="find";this.yaw=0;this.pitch=0;this.armed=true;this.slice=null;
      this.take=null;this.signal=null;
    }
    raise(actor){
      this.phase="listen";this.yaw=actor.yaw;this.pitch=.025;this.slice=null;this.armed=true;this.signal=null;
    }
    lower(){this.phase="find";this.slice=null;this.signal=null;}
    aim(dx,dy){this.yaw=wrap(this.yaw+dx);this.pitch=limit(this.pitch+dy,-.80,.88);}
    target(){return this.phase==="return"?BayCut.station:this.source.site;}
    sense(actor,time,weather,noise){
      const s=BayCutWildlife.pose(this.source.id,time,weather),dx=s.x-actor.x,dz=s.z-actor.z,d=Math.hypot(dx,dz);
      const yaw=wrap(Math.atan2(dx,dz)-this.yaw),pitch=Math.atan2(s.y-(actor.y+1.51),Math.max(.1,d))-this.pitch;
      const off=Math.hypot(yaw*Math.cos(this.pitch),pitch),alignment=Math.exp(-4.7*off*off);
      const reach=1-unit(d/this.source.range)**1.7,clarity=unit(1-noise),pulse=unit(s.strength);
      const level=unit(alignment*reach*(.24+.76*pulse)*(.6+.4*clarity));
      return {id:this.source.id,phase:time,level,pan:limit(Math.sin(yaw)*1.7,-1,1),noise:unit(noise),monitor:true,
        yaw,pitch,reach,alignment,clarity,pulse};
    }
    step(time,actor,weather,noise,button){
      this.signal=this.sense(actor,time,weather,noise);
      if(!button){this.slice=null;this.armed=true;return null;}
      if(!this.armed)return null;
      if(!this.slice)this.slice={at:time,levels:[],pans:[],noise:[],alignment:0,clarity:0,reach:0};
      const s=this.slice;
      while(s.levels.length<BayCutTape.frames&&time+.00001>=s.at+s.levels.length/BayCutTape.rate){
        const sample=this.sense(actor,s.at+s.levels.length/BayCutTape.rate,weather,noise);
        s.levels.push(sample.level);s.pans.push(sample.pan);s.noise.push(sample.noise);
        s.alignment+=sample.alignment;s.clarity+=sample.clarity;s.reach+=sample.reach;
      }
      if(time<s.at+BayCutTape.frames/BayCutTape.rate)return null;
      const n=s.levels.length,mean=s.levels.reduce((a,b)=>a+b,0)/n;
      const quality=s.alignment/n*.46+mean*.29+s.clarity/n*.13+s.reach/n*.12;
      const score=Math.round(100*quality);
      const ok=score>=45&&mean>.14&&s.alignment/n>=.45&&s.reach/n>.12;
      this.slice=null;this.armed=false;
      if(!ok)return "noise";
      const tape=BayCutTape.capture(this.source.id,s.at,s.levels,s.pans,s.noise);
      if(!tape)return "noise";
      this.take={score,tape,minute:Math.floor(weather.minute)};this.phase="review";return "take";
    }
    deliver(reels){
      if(this.phase!=="return"||!this.take)return null;
      const id=this.source.id,last=reels[id],best=!last||this.take.score>last.score;
      if(best)reels[id]=this.take;
      this.phase="aired";
      return {id,take:this.take,best,first:!last,pay:(last?55:125)+Math.round(this.take.score*(last ? .50 : 1))};
    }
  }
  function waveform(canvas,levels,progress=1){
    const g=canvas?.getContext?.("2d");if(!g)return;
    const w=canvas.width,h=canvas.height,y=h*.50;
    g.fillStyle="#203838";g.fillRect(0,0,w,h);g.strokeStyle="#41534b";g.lineWidth=1;
    for(let i=1;i<8;i++){const x=w*i/8;g.beginPath();g.moveTo(x,0);g.lineTo(x,h);g.stroke();}
    g.fillStyle="#7f987b";g.fillRect(0,y,w,1);const step=w/BayCutTape.frames;
    for(let i=0;i<levels.length;i++){
      const v=unit(levels[i]/255),r=Math.max(1.2,v*h*.45);g.fillStyle=i/levels.length<=progress?"#efd594":"#688476";
      g.fillRect((i+.17)*step,y-r,Math.max(1,step*.63),r*2);
    }
  }
  window.BayMarshLine={job,notes,title,archive,restore,keep,Run,waveform};
})();
