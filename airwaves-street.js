/* The receivers share the station clock. The desk feeds that same pair of channels. */
(() => {
  "use strict";
  const fm=BayAirwaves,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  class Radio{
    constructor(book){
      this.book=book;this.device=null;this.station="sol";this.showUntil=0;this.nextNews=0;
      this.wire="";this.newsUntil=0;this.newsAt=-1;this.facts=null;this.queue=[];this.issue=0;
      this.mix=null;this.approach=null;this.close=true;this.lastKey="";this.dialPainted="";
      this.state={mixing:false,beat:0,incomingBeat:0,blend:0,activeDeck:false,station:"sol",ready:true};
    }
    headlines(save,clock,bridge,now,water,localReport){
      if(now<this.newsAt)return;this.newsAt=now+1;
      const current=[save.buttonwood.runs,save.stunt?.distance||0,save.edition,save.brisas.classes.house.wins,save.cab.reel];
      if(this.facts){
        const before=this.facts,last=save.buttonwood.last;
        if(current[0]>before[0]&&last)this.queue.push("Benji’s scale at Buttonwood just counted "+last.count+" keepers off Pip 16.");
        if(current[1]>before[1])this.queue.push("Cine Luna’s new jump poster has Romy sailing "+Number(current[1]).toFixed(1)+" metres.");
        if(current[2]&&current[2]!==before[2])this.queue.push(current[2]==="live"?"Mara Vega brought us her photograph of the Lot 14 notice at Port Sol.":"Cine Luna is running Mara Vega’s Lot 14 photograph before the feature.");
        if(current[3]>before[3])this.queue.push("Nico just signed another First Switch card at Las Brisas. Ask him to show you the stripe.");
        if(current[4]&&!before[4])this.queue.push("Walt’s second reel made it to Cine Luna. After the Last Tram is on the bill.");
      }
      this.facts=current;if(this.queue.length>5)this.queue.splice(0,this.queue.length-5);
      if(!this.device||this.station==="off"||this.mix||now<this.nextNews)return;
      const reports=[];
      if(bridge.phase!=="road")reports.push("Salt Creek’s road gates are down. Inez is working the span.");
      const road=water?.report();
      if(road)reports.push(road);
      else if(clock.rain>.44)reports.push("Rain on the studio window. Ocean Drive’s taking a soaking.");
      if(clock.market==="open")reports.push("Rosario’s counter is open at El Mercado. Ask her which plate is still hot.");
      if(current[0]&&save.buttonwood.last)reports.push("Buttonwood’s last landing was "+save.buttonwood.last.count+" keepers. Benji kept the slip.");
      if(current[1])reports.push("Cine Luna’s stunt poster is up. Look for Romy’s number 27 on the way in.");
      reports.push("Ivo’s got two turntables out behind the Sol van on the North Boardwalk.");
      reports.push("Marta’s Route 6 runs the Marlin, Mercado, Port Sol and Cine Luna.");
      const local=this.station==="sol"&&localReport;
      this.wire=local||this.queue.shift()||reports[this.issue++%reports.length];this.newsUntil=now+7;this.nextNews=now+38;
      return !!local;
    }
    update(device,clock,now){
      const station=fm.stationFor(device);
      if(device!==this.device||station!==this.station){
        this.device=device;this.station=station;this.showUntil=device?now+7:0;this.newsUntil=0;this.nextNews=now+10;
      }
      const mix=this.mix;
      const signal=mix&&!this.approach?{key:"booth",decks:mix.decks(),booth:true}:fm.program(device?station:"sol",clock,this.book);
      if(signal.key!==this.lastKey){if(device)this.showUntil=now+5;this.lastKey=signal.key;}
      this.signal=signal;
      const art=this.state;
      art.mixing=!!mix&&!this.approach;art.beat=art.mixing?mix.beat:clock*96/60;
      art.incomingBeat=art.mixing?mix.incomingBeat:0;art.blend=art.mixing?mix.blend:0;
      art.bpm=art.mixing?mix.bpm:96;art.incomingBpm=art.mixing?mix.tempo:100;
      art.tempoOffset=art.mixing?mix.tempo/fm.records[mix.slot.to].bpm-1:0;
      art.activeDeck=!!(art.mixing&&mix.running);art.ready=!art.mixing||mix.stage==="cue";
      art.station=art.mixing?fm.records[mix.slot.from].station:"sol";art.incomingStation=art.mixing?fm.records[mix.slot.to].station:"marea";
    }
    readout($,now,quiet,relay=null){
      const strip=$("receiverCard"),desk=$("boothReadout"),mix=this.mix;
      $("hud").classList.toggle("fm-mixing",!!mix&&!this.approach);
      $("dialKey").hidden=!this.device||!!mix;
      const bulletin=relay?.show&&this.station==="sol";
      strip.hidden=!this.device||!!mix||quiet||!this.signal||!bulletin&&now>=Math.max(this.showUntil,this.newsUntil);
      if(!strip.hidden){
        const s=fm.stations[this.station],signal=this.signal;
        $("receiverStation").textContent=s.frequency?s.frequency+" FM  /  "+s.name:s.name;
        $("receiverTitle").textContent=bulletin?"Room Tone":signal.title;
        const bite=bulletin&&BayRoomTone.lines[relay.clip?.id];
        $("receiverCredit").textContent=bulletin?(bite?bite[0]:"Mara Vega · Port Sol"):signal.credit;
        const wire=$("receiverWire");wire.hidden=bulletin?!bite:now>=this.newsUntil||this.station==="off";
        if(!wire.hidden)wire.textContent=bulletin?bite[1]:s.host+"  /  "+this.wire;
        if(this.dialPainted!==this.station){BayAirwavesDial.receiver($("radioScale"),this.station);this.dialPainted=this.station;}
      }
      desk.hidden=!mix||!!this.approach;
      if(!desk.hidden){
        const a=fm.records[mix.slot.from],b=fm.records[mix.slot.to],done=mix.result;
        $("boothA").textContent=a.title+" · "+a.bpm;
        $("boothB").textContent=b.title+" · "+mix.tempo.toFixed(1);
        $("boothStatus").textContent=done?(mix.receipt?.aired?"On the air":"Practice take")+" · "+done.score+"/100":
          !mix.running?"Set B to "+a.bpm+" BPM. Cue on A’s first beat.":"Deck B is running · "+Math.round(mix.blend*100)+"% across";
        $("boothTip").textContent=done?done.note:mix.running?"A / D  crossfade     W / S  trim":"W / S  tempo     Space  start B";
      }
    }
    hands(hero,motion,dt){
      const mix=this.mix;if(!mix||this.approach)return;
      const p=BayAirwavesBooth.site.controlPoints;
      const rate=1-Math.exp(-11*dt);
      mix.posture=Math.min(1,(mix.posture||0)+dt*3.2);
      mix.slide=(mix.slide||0)+((mix.trimDir?1:0)-(mix.slide||0))*rate;
      const reaching=mix.running?1:mix.slide;
      mix.leftReach=mix.running?(mix.leftReach||0)+(reaching-(mix.leftReach||0))*rate:mix.slide;
      const hand=(a,b,t)=>{const x=a.x+(b.x-a.x)*t,z=a.z+(b.z-a.z)*t,q=BayDriving.local(hero,x,z);
        return {x:q.x,y:a.y+(b.y-a.y)*t+.025*Math.sin(t*Math.PI)-hero.y,z:q.z,weight:mix.posture};};
      motion.console={amount:mix.posture,shift:mix.slide,left:hand(p.left,p.fader(mix.blend),mix.leftReach),right:hand(p.right,p.pitch,mix.slide)};
    }
    camera(cam,zoom){
      const site=BayAirwavesBooth.site,m=this.mix,target={x:site.x+.04,y:1.09,z:site.z+.04};
      const rear=this.close?1.29:2.81,side=this.close?-.82:-2.62,sn=Math.sin(m.pan),cs=Math.cos(m.pan);
      const eye={x:target.x+rear*cs+side*sn,y:(this.close?2.58:2.13)+m.tilt,z:target.z+side*cs-rear*sn};
      const x=target.x-eye.x,z=target.z-eye.z;
      Object.assign(cam,{...eye,yaw:Math.atan2(x,z),pitch:Math.atan2(target.y-eye.y,Math.hypot(x,z)),focal:clamp(1.42/zoom,1.03,1.9)});
    }
  }
  window.BayAirwavesStreet={Radio};
})();
