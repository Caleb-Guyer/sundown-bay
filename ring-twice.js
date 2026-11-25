/* The cab phones double as request lines. Only the handset at the landmark can finish a call. */
(() => {
  "use strict";
  const streets={
    wheel:{caller:"Otis Reed",station:"breaker",clue:"Go north up Ocean. Look for eight colored seats turning above the boardwalk.",short:"Eight turning seats above the boardwalk",thanks:"For the crew who grease that wheel before anybody's awake."},
    luna:{caller:"Walt Dunn",station:"sol",clue:"Find the gold canopy on Luna Boulevard. They tear your ticket just beyond the cab phone.",short:"The gold movie canopy on Luna Boulevard",thanks:"For the two people who always stay through the credits."},
    flowers:{caller:"Bea Salas",station:"marea",clue:"Head west, then south to Old Palms. Look for the flower shop where we wrap the stems in yesterday’s sports page.",short:"The flower shop in Old Palms",thanks:"For my sister, who kept the flowers watered all summer."},
    marlin:{caller:"Vera Cordero",station:"sol",clue:"There’s a fish in lights over the motel on Ocean. I need the cab phone on the beach side of that block.",short:"The motel with a fish in lights on Ocean",thanks:"For the night clerk and everybody coming in off the road."}
  };
  const routes={marlin:["wheel","luna"],wheel:["luna","flowers"],luna:["flowers","marlin"],flowers:["marlin","wheel"]};
  const key="sundownBay.ringTwice.v1",ids=Object.keys(routes);
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function read(){
    let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch{}
    const cards={};
    for(const from of ids)for(const to of routes[from]){
      const id=from+"/"+to,c=raw?.cards?.[id];
      if(c&&Number.isFinite(c.best)&&c.best>0&&Number.isSafeInteger(c.runs)&&c.runs>0&&
        BayAirwaves.stations[streets[to].station].songs.includes(c.song))cards[id]={best:c.best,runs:c.runs,song:c.song,
          solo:Number.isFinite(c.solo)&&c.solo>0?c.solo:null,relay:Number.isFinite(c.relay)&&c.relay>0?c.relay:null};
    }
    const a=raw?.active,active=a&&ids.includes(a.from)&&routes[a.from].includes(a.to)&&Number.isFinite(a.start)&&a.start>=0?
      {from:a.from,to:a.to,start:a.start,lead:a.lead==="frankie"?"frankie":"guest",relay:a.relay===true}:null;
    return {cards,active};
  }
  class Phones{
    constructor(){
      this.book=read();this.sites=ids.map(id=>({id,...BayCabArt.rankLocation(BayCab.stops[id])}));
      this.near=null;this.bell=null;this.lifted=false;this.nextRing=0;this.silentUntil=0;
    }
    get run(){return this.book.active;}
    refresh(){this.book=read();this.lifted=false;}
    save(){try{localStorage.setItem(key,JSON.stringify(this.book));}catch{}}
    seconds(now){return this.run?Math.max(0,Math.ceil(this.run.start+155-now)):0;}
    scan(at,now,live,foot){
      const site=at&&this.sites.find(s=>distance(at,s)<26);
      this.near=foot&&site&&distance(at,site)<2.55?site:null;
      if(this.run&&(!this.seconds(now)||now<this.run.start-.5)){
        this.book.active=null;this.lifted=false;this.silentUntil=now+8;this.save();this.bell=null;return "expired";
      }
      if(!this.near||this.near.id!==this.run?.to)this.lifted=false;
      const old=this.bell;
      this.bell=site&&!this.lifted&&now>=this.silentUntil&&(this.run?site.id===this.run.to:live&&now%24<13)?site:null;
      if(this.bell&&(this.bell!==old||now>=this.nextRing)){
        this.rings=this.bell===old?this.rings+1:1;this.nextRing=now+3.7;this.rang=now;return "ring";
      }
      return "";
    }
    pulse(id,now){
      if(this.bell?.id!==id)return false;
      const age=now-this.rang;return age>=0&&(age<.39||age>.59&&age<.98);
    }
    answer(now,lead){
      if(!this.near)return "";
      if(this.run){
        if(this.near.id!==this.run.to)return this.near.id===this.run.from?"repeat":"wrong";
        this.bell=null;this.lifted=true;return "pick";
      }
      const from=this.near.id,[a,b]=routes[from],count=id=>this.book.cards[from+"/"+id]?.runs||0;
      this.book.active={from,to:count(a)<=count(b)?a:b,start:now,lead,relay:false};this.bell=null;this.save();return "start";
    }
    dedicate(index,now){
      const r=this.run;
      if(!r||!this.lifted||this.near?.id!==r.to||!this.seconds(now)||![0,1].includes(index))return null;
      const info=streets[r.to],song=BayAirwaves.stations[info.station].songs[index],id=r.from+"/"+r.to,prior=this.book.cards[id];
      const time=Math.max(.1,Math.round((now-r.start)*10)/10);
      const mode=r.relay?"relay":"solo";
      this.book.cards[id]={...prior,best:Math.min(time,prior?.best??Infinity),song,runs:(prior?.runs||0)+1,[mode]:Math.min(time,prior?.[mode]??Infinity)};
      this.book.active=null;this.lifted=false;this.bell=null;this.silentUntil=now+12;this.save();
      BayAirwaves.requestSong(song,now,info.caller);
      return {info,song,time,mode};
    }
  }
  window.BayRingTwice={Phones,streets,key};
})();
