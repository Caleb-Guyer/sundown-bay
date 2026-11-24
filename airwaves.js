/* Station clocks use the city's running time. Leaving a car does not stop a record. */
(() => {
  "use strict";
  const records=BayAirwavesScore.tracks;
  const stations={
    sol:{name:"Sol FM",frequency:"88.3",host:"Ivo Vidal",songs:["after-hours","side-door"],offset:17},
    marea:{name:"Marea",frequency:"94.7",host:"Pili Cruz",songs:["mango-wire","late-ferry"],offset:34},
    breaker:{name:"Breaker",frequency:"103.9",host:"Wes Pike",songs:["dry-county","salt-chrome"],offset:11},
    off:{name:"Radio off",frequency:"",songs:[]}
  };
  const presets=["sol","marea","breaker","off"];
  const slots=[
    {id:"motel",name:"Motel hour",from:"after-hours",to:"late-ferry",note:"Ivo pencilled 96 on the first sleeve. Slow the ferry record to meet it.",fee:65},
    {id:"lastbus",name:"Last bus home",from:"mango-wire",to:"side-door",note:"Pili wants the piano to come in over the congas. Bring the second record up to speed.",fee:90},
    {id:"salt",name:"Rust on the needle",from:"dry-county",to:"salt-chrome",note:"Two loud guitars and one kick drum between them. Give Wes a clean handover.",fee:85}
  ];
  const slotById=Object.fromEntries(slots.map(s=>[s.id,s]));
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),wrap=(n,m)=>((n%m)+m)%m;
  const distanceToBeat=(n,period)=>Math.abs(wrap(n+period*.5,period)-period*.5);
  const duration=id=>records[id].bars*240/records[id].bpm;
  function readTake(raw,id){
    if(!raw||!Object.hasOwn(slotById,id)||!Number.isInteger(raw.score)||raw.score<64||raw.score>100||
      !Number.isInteger(raw.start)||raw.start<0||raw.start>=records[slotById[id].from].bars*400||
      !Number.isInteger(raw.end)||raw.end<795||raw.end>3215||!Number.isFinite(raw.tempo)||raw.tempo<65||raw.tempo>165||
      !Array.isArray(raw.points)||raw.points.length!==Math.ceil(raw.end/25)+1)return null;
    let beat=-1;
    const points=[];
    for(const p of raw.points){
      if(!Array.isArray(p)||p.length!==2||!Number.isInteger(p[0])||p[0]<beat||p[0]>4300||
        !Number.isInteger(p[1])||p[1]<0||p[1]>100)return null;
      points.push([p[0],p[1]]);beat=p[0];
    }
    if(points[0][0]!==0||points[0][1]!==0||points.at(-1)[1]!==100)return null;
    return {id,score:raw.score,start:raw.start,end:raw.end,tempo:raw.tempo,points};
  }
  function read(raw){
    const sets={};
    for(const s of slots){const take=readTake(raw?.sets?.[s.id],s.id);if(take)sets[s.id]=take;}
    const featured=sets[raw?.featured]?.id||Object.keys(sets)[0]||"";
    const encore=raw?.encore;
    return {sets,featured,met:raw?.met===true||!!featured,request:sets[raw?.request]?.id||"",
      rev:Number.isSafeInteger(raw?.rev)&&raw.rev>=0?raw.rev:0,
      encore:encore&&Object.hasOwn(sets,encore.id)&&Number.isFinite(encore.at)&&encore.at>=0?{id:encore.id,at:encore.at}:null};
  }
  function deck(id,beat,tempo,level,key){return {id,beat,tempo,level,key};}
  function pairDecks(slot,beat,incoming,tempo,blend,running,key){
    return [deck(slot.from,beat,records[slot.from].bpm,Math.cos(blend*Math.PI/2),key+"-a"),
      running?deck(slot.to,incoming,tempo,Math.sin(blend*Math.PI/2),key+"-b"):null];
  }
  class Mix{
    constructor(slot){
      this.slot=slot;this.bpm=records[slot.from].bpm;this.tempo=records[slot.to].bpm;
      this.station=records[slot.from].station;this.incomingStation=records[slot.to].station;
      this.beat=16;this.incomingBeat=0;this.blend=0;this.running=false;this.stage="cue";
      this.reel=0;this.cueError=0;this.tempoHold=0;this.trimDir=0;this.detail="";this.result=null;
      this.pan=0;this.tilt=0;
    }
    trim(dir){
      this.tempo=clamp(Math.round((this.tempo+dir*.5)*2)/2,Math.floor(records[this.slot.to].bpm*.8),Math.ceil(records[this.slot.to].bpm*1.2));
    }
    cue(){
      if(this.result||this.blend>.12)return false;
      this.reel++;this.running=true;this.stage="blend";this.incomingBeat=0;this.blend=0;
      this.start=this.beat;this.points=[[0,0]];this.nextMark=.25;this.errorSum=0;this.tempoSum=0;this.weight=0;this.rewind=0;
      this.cueError=distanceToBeat(this.beat,4);this.detail="";return true;
    }
    step(dt,trim,fade){
      if(dt<=0)return;
      const rate=this.bpm/60,advance=dt*rate;
      if(this.result){this.beat+=advance;this.incomingBeat+=dt*this.tempo/60;return;}
      if(trim!==this.trimDir){this.trimDir=trim;this.tempoHold=.29;if(trim)this.trim(trim);}
      else if(trim){this.tempoHold-=dt;while(this.tempoHold<=0){this.trim(trim);this.tempoHold+=.105;}}
      const priorBeat=this.beat,priorB=this.incomingBeat,priorFader=this.blend;
      this.beat+=advance;if(!this.running)return;
      this.incomingBeat+=dt*this.tempo/60;
      this.blend=clamp(this.blend+fade*advance/8,0,1);
      this.rewind+=Math.max(0,priorFader-this.blend);
      const overlap=.1+Math.sin(this.blend*Math.PI);
      this.weight+=overlap*dt;
      this.errorSum+=distanceToBeat(this.beat-this.incomingBeat,1)*overlap*dt;
      this.tempoSum+=Math.abs(this.tempo-this.bpm)*overlap*dt;
      const age=this.beat-this.start;
      while(this.nextMark<=age+1e-7&&this.points.length<130){
        const f=clamp((this.start+this.nextMark-priorBeat)/advance,0,1);
        this.points.push([Math.round(100*(priorB+(this.incomingBeat-priorB)*f)),Math.round(100*(priorFader+(this.blend-priorFader)*f))]);
        this.nextMark+=.25;
      }
      if(this.blend>=.999||age>=32){
        const crossed=this.blend>=.999,timing=this.errorSum/Math.max(.001,this.weight),tempo=this.tempoSum/Math.max(.001,this.weight);
        const score=clamp(Math.round(100-Math.min(43,this.cueError*32)-Math.min(32,timing*78)-Math.min(30,tempo*3.7)-Math.min(10,this.rewind*17)),0,100);
        const end=Math.round(age*100);
        this.points[Math.ceil(end/25)]=[Math.round(this.incomingBeat*100),crossed?100:Math.round(this.blend*100)];
        this.result={id:this.slot.id,score:crossed?score:Math.min(score,55),start:Math.round(wrap(this.start,records[this.slot.from].bars*4)*100)%(records[this.slot.from].bars*400),end,tempo:this.tempo,points:this.points,
          note:!crossed?"The eight bars ran out before the handover.":this.cueError>.34?"The second record missed beat one.":tempo>1.2?"The two records drifted apart.":timing>.16?"The drums landed a little apart.":"The two kicks land together."};
        this.stage="finished";this.running=true;
      }
    }
    decks(){
      const channels=pairDecks(this.slot,this.beat,this.incomingBeat,this.tempo,this.blend,this.running,"booth/"+this.slot.id);
      if(channels[1])channels[1].key+="/"+this.reel;
      return channels;
    }
  }
  // Each quarter beat on tape holds the actual incoming platter position and the fader position.
  const lead=8,tail=16;
  function tapeLength(take){const s=slotById[take.id];return (lead+take.end/100+tail)*60/records[s.from].bpm;}
  function tapeProgram(take,age,key){
    const s=slotById[take.id],bpm=records[s.from].bpm,phase=age*bpm/60-lead,p=take.points;
    const end=take.end/100,at=clamp(phase,0,end),i=Math.min(Math.floor(at*4),p.length-2);
    const length=Math.min(.25,end-i*.25),f=clamp((at-i*.25)/length,0,1);
    const a=p[i],b=p[i+1],after=Math.max(0,phase-end);
    const tempo=phase>=end?take.tempo:clamp((b[0]-a[0])*.01/length*bpm,records[s.to].bpm*.8,records[s.to].bpm*1.2);
    const incoming=(a[0]+(b[0]-a[0])*f)/100+after*take.tempo/bpm;
    return {key,station:"sol",track:phase<end*.5?s.from:s.to,
      title:s.name,credit:"Your Boardwalk mix · "+take.score+"/100",age,custom:true,
      decks:pairDecks(s,wrap(take.start/100+phase,records[s.from].bars*4),incoming,tempo,(a[1]+(b[1]-a[1])*f)/100,phase>=0,key)};
  }
  function program(station,time,book){
    const channel=stations[station];if(!channel||station==="off")return {key:"off",station:"off",track:"",title:"Radio off",credit:"Engine and street sounds",age:0,decks:[]};
    if(station==="sol"&&book.encore){
      const take=book.sets[book.encore.id],age=time-book.encore.at;
      if(take&&age>=0&&age<tapeLength(take))return tapeProgram(take,age,"encore/"+book.encore.at);
    }
    const featured=station==="sol"?book.sets[book.featured]:null,tracks=channel.songs;
    const songTime=duration(tracks[0])+duration(tracks[1]),span=songTime+(featured?tapeLength(featured):0);
    const clock=time-1068+channel.offset,cycle=Math.floor(clock/span),position=wrap(clock,span),base=station+"/"+cycle+"/";
    if(featured&&position>=songTime)return tapeProgram(featured,position-songTime,base+featured.id);
    const second=position>=duration(tracks[0]),id=tracks[second?1:0],age=position-(second?duration(tracks[0]):0),r=records[id],key=base+id;
    return {key,station,track:id,title:r.title,credit:r.artist,age,decks:[deck(id,age*r.bpm/60,r.bpm,1,key)]};
  }
  function stamp(book,result){
    const clean=readTake(result,result.id);if(!clean)return {aired:false,pay:0};
    const prior=book.sets[clean.id],best=!prior||clean.score>prior.score;
    if(best)book.sets[clean.id]=clean;
    book.featured=book.request=clean.id;book.met=true;
    return {aired:true,best,pay:prior?0:slotById[clean.id].fee};
  }
  const radioKeys=new Map();
  function stationFor(id){
    if(!id)return "sol";
    if(!radioKeys.has(id)){
      let saved;try{saved=localStorage.getItem("sundownBay.receiver."+id);}catch{}
      radioKeys.set(id,presets.includes(saved)?saved:"sol");
    }return radioKeys.get(id);
  }
  function tune(id,dir){
    if(!id)return null;const value=presets[wrap(presets.indexOf(stationFor(id))+dir,presets.length)];radioKeys.set(id,value);
    try{localStorage.setItem("sundownBay.receiver."+id,value);}catch{}return value;
  }
  function refreshPreset(key){const prefix="sundownBay.receiver.";if(key?.startsWith(prefix))radioKeys.delete(key.slice(prefix.length));}
  window.BayAirwaves={stations,slots,slotById,records,read,Mix,program,stamp,stationFor,tune,refreshPreset,tapeLength,distanceToBeat};
})();
