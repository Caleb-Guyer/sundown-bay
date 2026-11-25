/* Passing car stereos share the receiver's live clock and its saved preset. */
(() => {
  "use strict";
  const fm=BayAirwaves,stations=["marea","breaker","sol"];
  const drivers=["Alma Ruiz","Frank Bell","Nadia Pike","Eli Torres"];
  const intro=["My sister called this one in once.","Wait for the drummer on this one.","I keep this station on all the way home.","I used to have the seven-inch."];
  const prefix="sundownBay.windowSong.";
  function cards(){
    const list=[];
    for(const song of Object.values(fm.records)){
      let row;try{row=JSON.parse(localStorage.getItem(prefix+song.id));}catch{}
      if(row&&drivers.includes(row.by)&&stations.includes(row.station)&&typeof row.street==="string"&&row.street.length<48)
        list.push({...row,song});
    }
    return list;
  }
  class Street{
    constructor(people,visible=()=>true){
      this.visible=visible;
      this.cars=[];this.next=0;this.source=null;this.offer=null;this.air=null;
      for(const p of people){
        const v=p.car;if(!v.cityLanes||!["coupe","cab","van","hatch"].includes(v.kind))continue;
        v.fmSticker=stations[v.id%3];fm.preset(v.garageKey,v.fmSticker);this.cars.push(v);
      }
    }
    scan(at,own,t){
      this.source=this.offer=null;let best=19,near=Infinity;
      for(const v of this.cars){
        if(v===own||!v.path||v.owner.phase!=="drive"||Math.abs(v.x-at.x)>19||Math.abs(v.z-at.z)>19)continue;
        const station=fm.stationFor(v.garageKey);if(station==="off")continue;
        const d=Math.hypot(v.x-at.x,v.z-at.z);
        if(d>=19||!this.visible(at,v))continue;
        if(d<best){best=d;this.source=v;}
        const p=BayDriving.local(v,at.x,at.z);
        if(Math.abs(p.x)<1.55||Math.abs(p.x)>(own?6.1:8.1)||Math.abs(p.z)>4.6||Math.abs(v.speed)>5.8||(own&&Math.abs(own.speed)>4.5))continue;
        if(d<near){near=d;this.offer=v;}
      }
      this.next=t+.16;
    }
    step(at,own,t,clock,book,heading){
      if(!at){this.air=this.source=this.offer=null;this.next=0;return;}
      if(t>=this.next)this.scan(at,own,t);
      const v=this.source;
      if(!v||v===own||!v.path){this.air=null;return;}
      const dx=v.x-at.x,dz=v.z-at.z,d=Math.hypot(dx,dz),station=fm.stationFor(v.garageKey);
      const signal=fm.program(station,clock,book),deck=signal.decks[0];
      if(deck){v.windowBeat=(1+Math.cos(deck.beat*Math.PI*2))*.5;v.windowAt=t;}
      const audible=d<19&&station!=="off"&&(!own||fm.stationFor(own.garageKey)!==station);
      this.air=audible?{program:signal,gain:(1-d/19)**1.6*(own?.27:.70),
        pan:Math.max(-.9,Math.min(.9,(dx*Math.cos(heading)-dz*Math.sin(heading))/Math.max(4,d))),
        cutoff:760+(1-d/19)*(own?1300:2900)}:null;
    }
    ask(at,own,t,clock,book){
      this.scan(at,own,t);
      const v=this.offer;if(!v)return null;
      const station=fm.stationFor(v.garageKey),s=fm.program(station,clock,book),song=fm.records[s.track];
      if(!song)return null;
      const row={by:v.owner.name,street:BayStreetNames.through(v,v.yaw)||"the coast road",station};
      let fresh=true;try{fresh=!localStorage.getItem(prefix+song.id);if(fresh)localStorage.setItem(prefix+song.id,JSON.stringify(row));}catch{}
      const familiar=v.windowSong===song.id;v.windowSong=song.id;v.windowAsked=t;
      v.windowSide=Math.sign(BayDriving.local(v,at.x,at.z).x);
      if(Math.abs(v.speed)<3&&(!own||Math.abs(own.speed)<1))v.wait=Math.max(v.wait||0,1.65);
      return {v,station,song,fresh,line:(familiar?"Still on the same side.":intro[v.id%4])+" "+song.title+", "+song.artist+". "+fm.stations[station].frequency+" FM."};
    }
  }
  const palettes={sol:["#c8773b","#fff0b5"],marea:["#216f81","#b7f0db"],breaker:["#723b54","#ffda82"]};
  function sticker(station,paint){
    const [ink,paper]=palettes[station];
    paint([[-.56,.16],[.08,.16],[.08,.52],[-.56,.52]],paper);
    paint([[-.54,.19],[.06,.19],[.06,.49],[-.54,.49]],ink);
    if(station==="breaker"){
      paint([[-.28,.47],[-.11,.47],[-.22,.365],[-.125,.365],[-.36,.21],[-.29,.327],[-.39,.327]],paper);
    }else if(station==="marea"){
      const wave=[[-.49,0],[-.39,.085],[-.22,.015],[-.10,.08],[.015,.05]];
      for(const y of [.255,.37])for(let i=1;i<wave.length;i++){
        const [a,b]=wave[i-1],[c,d]=wave[i];
        paint([[a,y+b],[c,y+d],[c,y+d-.035],[a,y+b-.035]],paper);
      }
    }else{
      paint([[-.39,.31],[-.375,.372],[-.333,.423],[-.255,.445],[-.18,.419],[-.131,.366],[-.123,.31]],paper);
      paint([[-.47,.26],[-.025,.26],[-.025,.286],[-.47,.286]],paper);
    }
  }
  window.BayOpenWindows={Street,cards,sticker};
})();
