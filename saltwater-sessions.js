/* The band keeps time on the city clock. The cassette stores the player's strokes, including fills. */
(() => {
  "use strict";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const pt=(x,z)=>({x,z}),near=(a,b,r)=>gap(a,b)<r;
  const songs=BayShellScore.songs,byId=id=>songs.find(s=>s.id===id);
  const drives=[
    {x:5.1,z:41,name:"Cine Luna marquee",line:"They printed my name upside down the first time we played there. I still have the poster."},
    {x:144,z:163,name:"Ocean Drive overlook",line:"Ben used to make me sing into a bait bucket on this road. Said the echo made us sound expensive."},
    {x:149.1,z:82,name:"North Boardwalk curb",line:"There’s our little shell. You can drop me here, or we can take another lap."}
  ];
  const count=n=>Number.isSafeInteger(n)?clamp(n,0,999999):0;
  function read(raw){
    const best={};
    for(const s of songs){
      const r=raw?.best?.[s.id];
      if(!r||!Number.isInteger(r.score)||r.score<55||r.score>100||!Array.isArray(r.notes)||!r.notes.length||r.notes.length>220)continue;
      if(!r.notes.every(n=>Number.isFinite(n?.at)&&n.at>=0&&n.at<s.bars*4&&Number.isInteger(n.pad)&&n.pad>=0&&n.pad<3))continue;
      best[s.id]={score:r.score,chain:count(r.chain),june:r.june===true,notes:r.notes.map(n=>({at:n.at,pad:n.pad})).sort((a,b)=>a.at-b.at)};
    }
    return {met:raw?.met===true,shows:count(raw?.shows),best,last:Object.hasOwn(best,raw?.last)?raw.last:Object.keys(best)[0]||"",drives:count(raw?.drives)};
  }
  class Take{
    constructor(song,june){
      this.song=song;this.june=june;this.phase="seat";this.beat=-4;this.seated=0;this.notes=song.pattern.map(n=>({...n,state:0}));
      this.hits=[];this.chain=0;this.longest=0;this.landed=0;this.points=0;this.extra=0;this.feedback="";this.feedbackTime=0;this.lastPad=-1;
      this.elapsedNotes=0;this.expiredNotes=0;
    }
    strike(pad){
      if(this.phase!=="play"||this.beat<0||this.beat>=this.song.bars*4)return;
      if(this.hits.length<220)this.hits.push({at:Math.min(this.song.bars*4-1/96,Math.round(this.beat*96)/96),pad});
      let target=null,d=.285;
      for(const n of this.notes){
        const error=Math.abs(n.at-this.beat);if(!n.state&&n.pad===pad&&error<d){d=error;target=n;}
      }
      this.lastPad=pad;this.feedbackTime=.59;
      if(!target){this.extra++;this.feedback="Fill";return;}
      target.state=1;const tight=d<.145;
      this.landed++;this.points+=tight?1:.76;this.chain++;this.longest=Math.max(this.chain,this.longest);
      this.feedback=tight?"In the pocket":this.beat<target.at?"Early":"Late";
    }
    advance(dt){
      this.feedbackTime=Math.max(0,this.feedbackTime-dt);
      this.beat+=dt*this.song.bpm/60;if(this.beat>=0)this.phase="play";
      while(this.elapsedNotes<this.notes.length&&this.notes[this.elapsedNotes].at<=this.beat)this.elapsedNotes++;
      while(this.expiredNotes<this.elapsedNotes&&this.notes[this.expiredNotes].at<this.beat-.285){
        const n=this.notes[this.expiredNotes++];if(!n.state){n.state=-1;this.chain=0;}
      }
      return this.beat>=this.song.bars*4+.12;
    }
    finish(){
      const score=clamp(Math.round(100*(this.points-Math.max(0,this.extra-4)*.40)/Math.max(1,this.notes.length)),0,100);
      this.phase="result";this.score=score;return {score,chain:this.longest,june:this.june,notes:this.hits};
    }
  }
  function performer(id,p,work){
    return {...p,y:p.y??.007,yaw:p.yaw??-Math.PI/2,id,work,age:0,join:work==="kit"?1:0,motion:new BayPlayerMotion(),path:[],seat:0,ride:null};
  }
  function followPath(p,points,speed,dt,env){
    if(!points.length)return true;
    if(env.yieldToCar(p,points[0])){p.motion.step(dt,0,0);return false;}
    return BayCarAccess.walkPath(p,p.motion,points,dt,env.ground,speed);
  }
  function routeFor(a,b,v,env){return env.walkway(a,b,v)||[];}
  const porch=pt(153.8,-25.4),walkway=pt(162.3,81.8);
  class Band{
    constructor(local,memory){
      this.memory=memory;this.site=BaySoundShell.site;this.local=local;
      this.june=performer("june",local,"case");this.june.state="motel";this.june.spoken=new Set();
      this.ben=performer("ben",this.site.kit,"kit");this.lena=performer("lena",this.site.lena,"bass");
      this.fans=Array.from({length:4},(_,i)=>{
        const home=pt(168.7+i*.87,66.2+i*1.6);
        const rail=pt(177.5+(i%2)*1.43,79.3+i*2.05);
        return Object.assign(performer("fan"+i,home,""),{home,rail,here:false,wants:false,delay:i*2.7});
      });
      this.performers=[this.june,this.ben,this.lena,...this.fans];this.song=songs[0];this.beat=0;this.strikes=[20,20,20];
      this.crowd=.18;this.tape=null;this.onAir=false;this.playing=false;this.take=null;this.outing="";this.driveIndex=0;this.driveWait=0;
    }
    state(state){const j=this.june;j.state=state;j.age=0;j.path=[];j.retry=0;j.goal=null;}
    invite(outing){
      const j=this.june;if(j.ride||this.take)return false;
      this.memory.met=true;this.outing=outing;this.driveIndex=this.memory.drives%drives.length;this.driveWait=0;
      this.local.onTour=true;j.work="case";this.state("follow");return true;
    }
    destination(driver){
      const j=this.june;
      if(this.take)return {...this.site.kit,name:"Ben’s drum kit"};
      if(this.outing==="drive")return {...drives[this.driveIndex]};
      if(j.ride&&driver)return {x:149.1,z:82,name:"Sound Shell loading curb",kind:"band-curb"};
      return {...this.site.board,name:j.state==="shell"?"Sound Shell set list":"North Boardwalk · Sol Sound Shell"};
    }
    instruction(v){
      const j=this.june;
      if(this.outing==="drive")return j.state==="ride"?"Cruise to "+drives[this.driveIndex].name:j.ride?"Passenger door":"Take a walk with June, or pull up a car";
      if(this.take)return "Sit in with the band";
      if(j.state==="shell")return "Meet Ben at the set list beside the ramp";
      if(j.state==="ride")return "Stop on the beach side of Ocean Drive by the Sound Shell";
      if(j.state==="toShell")return "Follow June up the stage ramp";
      if(j.ride)return j.state==="out"?"Give June room to step out":"June is taking the passenger seat";
      return v?"Let June reach the passenger door":"Walk to the Sound Shell with June, or give her a lift";
    }
    holds(v){return !!v&&this.june.ride===v&&["door","in","out"].includes(this.june.state);}
    headFor(want,env){
      const j=this.june,stage=want==="shell",target=stage?this.site.june:porch;
      this.state(stage?"toShell":"home");j.work="case";this.local.onTour=true;
      const marks=[];
      if(stage&&gap(j,this.site.front)<17)marks.push(this.site.call,this.site.front);
      else if(!stage&&gap(j,this.site.front)<15)marks.push(this.site.front,this.site.call,walkway);
      else if(j.x<151&&j.z<0&&j.z> -55)marks.push(pt(134.75,-8.6),pt(153.7,-8.6));
      if(stage&&gap(j,this.site.front)>=17)marks.push(walkway,this.site.call,this.site.front);
      if(!stage&&j.z>0)marks.push(pt(160,62),pt(159.8,-9),pt(153.8,-9));
      marks.push(target);j.destinations=marks;
    }
    leave(env){
      this.outing="";const j=this.june;
      if(j.ride){j.parting=true;return;}
      if(j.state!=="shell"&&j.state!=="motel")this.headFor(env.night()?"shell":"motel",env);
    }
    passenger(dt,env){
      const j=this.june,v=j.ride;
      if(!v)return;
      if(j.state==="door"){
        if(!followPath(j,j.path,2.7,dt,env))return;
        this.state("in");j.seat=0;
      }
      if(j.state==="in"||j.state==="out"){
        const entering=j.state==="in";j.seat=clamp(j.seat+(entering?dt/1.45:-dt/1.46),0,1);
        BayCarAccess.pose(v,1,j.seat,j,j.motion,env.ground,dt,true);
        if(entering?j.seat<1:j.seat>0)return;
        v.passengerDoor=0;if(entering){this.state("ride");env.line("June","Got it. The case fits right across my knees.");return;}
        j.ride=null;j.motion.reset();j.work="case";
        if(j.parting){j.parting=false;this.headFor(env.night()?"shell":"motel",env);}
        else if(this.outing==="shell"&&near(j,this.site.board,33))this.headFor("shell",env);
        else this.state("follow");
        return;
      }
      BayCarAccess.pose(v,1,1,j,j.motion,env.ground,dt,true);
      const stop=BayCab.stopped(v),access=env.transfer(),driver=env.driver(),atCurb=v.x>147&&v.x<158&&Math.abs(v.z-82)<9;
      if(this.outing==="drive"&&stop&&gap(v,drives[this.driveIndex])<10&&this.driveWait<=0){
        env.line("June",drives[this.driveIndex].line);this.driveIndex=(this.driveIndex+1)%drives.length;this.memory.drives++;this.driveWait=9;env.save();
      }
      const drop=j.parting||driver!==v&&!access||access?.v===v&&access.exiting||this.outing==="shell"&&atCurb&&j.age>.9;
      if(stop&&drop&&env.door(v,true,j,1)){this.state("out");return;}
      if(!drop&&j.age>5&&this.driveWait<=0){
        const id=env.district(v);
        const lines={"Port Sol":"Those cranes keep better time than our old drummer.","Pelican Cut":"You can hear the frogs from the last house out here, even with the engine on.","Neon Mile":"That alley next to Luna was our first green room.","Boardwalk":"I can usually tell who’s tuning up from this corner.","Ocean Drive":"See the old motel sign? That’s the picture on the sleeve."};
        if(lines[id]&&!j.spoken.has(id)){j.spoken.add(id);env.line("June",lines[id]);}
      }
    }
    stepJune(dt,env){
      const j=this.june,l=this.local;j.age+=dt;this.driveWait=Math.max(0,this.driveWait-dt);
      if(j.state==="motel"){
        const d=gap(j,l);Object.assign(j,{x:l.x,z:l.z,y:env.ground(l.x,l.z),yaw:l.yaw});j.motion.step(dt,d,0);
        if(env.night()&&j.age>18&&!env.busyWithJune())this.headFor("shell",env);
        return;
      }
      if(j.ride)this.passenger(dt,env);
      else if(j.state==="shell"){
        j.work=this.take&&["count","play"].includes(this.take.phase)&&!this.take.june?"clap":"guitar";
        j.motion.step(dt,0,0);
        if(!this.outing&&!this.take&&!env.night()&&j.age>56)this.headFor("motel",env);
      }else if(j.state==="toShell"||j.state==="home"){
        if(!j.path.length){
          const dest=j.destinations[0];
          if(!dest){
            if(j.state==="toShell"){this.state("shell");j.work="guitar";j.yaw=this.site.june.yaw;}
            else{this.state("motel");j.work="case";l.index=1;l.wait=9;l.onTour=false;}
          }else if(gap(j,dest)<.25)j.destinations.shift();
          else if((j.retry-=dt)<=0){j.path=routeFor(j,dest,null,env);j.retry=.7;}
        }
        if(j.path.length)followPath(j,j.path,2.6,dt,env);
      }else if(j.state==="follow"){
        const driver=env.driver(),a=env.hero;
        if(this.outing==="shell"&&gap(j,this.site.board)<14&&!driver){this.headFor("shell",env);}
        else if(driver&&env.available(driver)&&!env.transfer()&&gap(j,driver)<9&&BayCab.stopped(driver)){
          const access=env.door(driver,false,j,1);
          if(access){this.state("door");j.path=access.points;j.ride=driver;j.seat=0;env.line("June","One second. Let me get the passenger door.");}
          else if(j.age>3&&!j.blocked){j.blocked=true;env.line("June","Can you leave a little space on my side?");}
        }else{
          const target=driver||a,d=gap(j,target);
          if(d>1.94){
            const offset=BayDriving.world(target,driver?2.25:.79,driver?-.3:-1.02);
            if((j.retry-=dt)<=0&&(!j.path.length||!j.goal||gap(j.goal,offset)>1.8)){
              j.path=routeFor(j,offset,driver,env);j.retry=.53;j.goal=offset;
            }
            followPath(j,j.path,d>6?6.7:d>3.3?4.25:2.5,dt,env);
          }else{j.path=[];j.motion.step(dt,0,0);j.yaw+=Math.atan2(Math.sin(a.yaw-j.yaw),Math.cos(a.yaw-j.yaw))*Math.min(1,dt*2);}
        }
      }
      l.x=j.x;l.z=j.z;l.yaw=j.yaw;
    }
    crowdStep(dt,env){
      const close=gap(env.driver()||env.hero,this.site.front)<75||this.playing;
      const night=env.night(),threat=env.driver();
      for(let i=0;i<this.fans.length;i++){
        const p=this.fans[i];p.age+=dt;
        if(threat&&Math.abs(threat.speed)>2.2&&gap(threat,p)<6)p.retreat=3.3;
        const scared=(p.retreat||0)>0;if(scared)p.retreat=Math.max(0,p.retreat-dt);
        const want=!scared&&(night||this.playing||i===0||i===1&&this.june.state==="shell");
        if(want!==p.wants){p.wants=want;p.delay=.3+i*.48;p.path=[];}
        if(p.wants!==p.here){
          if((p.delay-=dt)>0)continue;
          if(!p.path.length){const goal=p.wants?p.rail:p.home;p.path=[goal];}
          p.work="";if(followPath(p,p.path,scared?3.6:1.21+i*.12,dt,env)){p.here=p.wants;p.yaw=p.here?Math.PI/2:-.65;}
        }else if(close){p.work=p.here?(i%2||this.crowd>.66?"clap":"dance"):"";p.motion.step(dt,0,0);}
      }
    }
    begin(id,hero,motion,env){
      const song=byId(id);if(!song||this.take)return false;
      this.tape=null;this.onAir=false;this.take=new Take(song,this.june.state==="shell");this.song=song;
      this.take.waitForJune=this.outing==="shell"&&!this.june.ride&&near(this.june,this.site.front,26);
      if(this.june.state==="follow")this.headFor("shell",env);
      this.ben.path=[];this.take.wait=0;this.player={id:"player",x:hero.x,y:hero.y,z:hero.z,yaw:hero.yaw,motion,work:"",join:0,age:0};
      this.player.path=[];this.playing=false;return true;
    }
    retake(){
      if(this.take?.phase!=="result")return false;
      this.take=new Take(this.song,this.june.state==="shell");this.take.phase="count";this.beat=-4;this.playing=true;
      this.strikes=[20,20,20];return true;
    }
    stopTake(hero,motion){
      this.take=null;this.playing=false;this.player=null;
      this.ben.path=[];motion.reset();
    }
    drum(pad,env){
      const take=this.take;if(!take||!["count","play"].includes(take.phase))return;
      this.strikes[pad]=0;take.strike(pad);env.hit(pad);
    }
    lineUp(dt,env){
      const {ben,site,player:p,take}=this,hero=env.hero,m=env.motion;
      if(ben.join>0){ben.join=Math.max(0,ben.join-dt*2.2);ben.motion.step(dt,0,0);return;}
      if(!near(ben,site.ben,.11)){
        if(!ben.path.length)ben.path=routeFor(ben,site.ben,null,env);
        ben.work="";followPath(ben,ben.path,2.02,dt,env);return;
      }
      ben.work="shaker";ben.yaw=site.ben.yaw;
      if(!take.stoolRoute){const path=routeFor(hero,site.kit,null,env);if(!path.length&&!near(hero,site.kit,.12))return;p.path=path;take.stoolRoute=true;}
      if(!BayCarAccess.walkPath(hero,m,p.path,dt,env.ground,2.38)){Object.assign(p,{x:hero.x,y:hero.y,z:hero.z,yaw:hero.yaw});return;}
      const d=Math.atan2(Math.sin(site.kit.yaw-hero.yaw),Math.cos(site.kit.yaw-hero.yaw));hero.yaw+=d*Math.min(1,dt*12);
      if(Math.abs(d)<.13){p.work="kit";p.join=clamp(p.join+dt*2.2,0,1);}
      Object.assign(p,{x:hero.x,y:hero.y,z:hero.z,yaw:hero.yaw});m.step(dt,0,0);
      if(p.join===1&&(!take.waitForJune||this.june.state==="shell")){
        take.june=this.june.state==="shell";take.phase="count";this.beat=take.beat;this.playing=true;this.strikes=[20,20,20];
      }
    }
    step(dt,env){
      this.stepJune(dt,env);this.crowdStep(dt,env);this.ben.age+=dt;this.lena.age+=dt;this.lena.motion.step(dt,0,0);
      for(let i=0;i<3;i++)this.strikes[i]=Math.min(30,this.strikes[i]+dt);
      const take=this.take;
      if(take){
        this.player.age+=dt;
        if(take.phase==="seat"){this.lineUp(dt,env);return;}
        if(take.phase==="leave"){
          const p=this.player,h=env.hero;
          if(p.join>0){p.join=Math.max(0,p.join-dt*2.4);env.motion.step(dt,0,0);return;}
          p.work="";
          if(!take.exitPath)take.exitPath=near(h,this.site.kit,1.4)?routeFor(h,this.site.kitEntry,null,env):[];
          const done=BayCarAccess.walkPath(h,env.motion,take.exitPath,dt,env.ground,2);
          Object.assign(p,{x:h.x,y:h.y,z:h.z,yaw:h.yaw});if(done)env.left();return;
        }
        if(take.phase==="count"||take.phase==="play"){
          const ended=take.advance(dt);this.beat=take.beat;
          const response=.27+.73*Math.min(1,take.landed/Math.max(1,take.elapsedNotes));
          this.crowd+=(response-this.crowd)*Math.min(1,dt*3);
          env.motion.step(dt,0,0);this.ben.motion.step(dt,0,0);
          if(ended){const result=take.finish();this.playing=false;env.finished(take,result);}
        }
        return;
      }
      const b=this.ben;
      if(!near(b,this.site.kit,.09)&&near(env.hero,this.site.kit,.75)){b.motion.step(dt,0,0);}
      else if(!near(b,this.site.kit,.09)){
        if(!b.path.length)b.path=routeFor(b,this.site.kit,null,env);
        b.work="";followPath(b,b.path,1.65,dt,env);
      }else{b.work="kit";b.yaw=this.site.kit.yaw;b.join=clamp(b.join+dt*2.2,0,1);b.motion.step(dt,0,0);}
      const before=this.beat;this.beat+=dt*this.song.bpm/60;
      if(this.beat>=this.song.bars*4){this.beat=0;this.song=env.night()?songs[1]:songs[0];}
      for(const n of this.song.pattern)if((n.at>before||this.beat<before)&&n.at<=this.beat)this.strikes[n.pad]=0;
      this.crowd+=((env.night()?.74:.25)-this.crowd)*dt;
    }
    playTape(id){
      const data=this.memory.best[id],song=byId(id);if(!data||!song)return false;
      this.tape={id,song,data,beat:0};this.onAir=true;return true;
    }
    audio(dt,p,env){
      if(this.tape){
        const t=this.tape;
        if(!env.deck()||t.beat>=t.song.bars*4){this.tape=null;this.onAir=false;}
        else {const beat=t.beat;t.beat+=dt*t.song.bpm/60;return {source:"tape",song:t.id,beat,gain:.88,pan:0,live:false,mutedPads:true,guitar:t.data.june,playback:t.data.notes};}
      }
      if(this.take&&["seat","result","leave"].includes(this.take.phase))return null;
      const d=gap(p,this.site.kit);if(d>55||env.indoors())return null;
      const gain=clamp(1-d/57,0,1)**1.35;
      const right=(this.site.kit.x-p.x)*Math.cos(env.yaw())-(this.site.kit.z-p.z)*Math.sin(env.yaw());
      return {source:"stage",song:this.song.id,beat:this.beat,gain,pan:clamp(right/Math.max(6,d),-.85,.85),live:this.playing,mutedPads:this.playing,practice:!this.playing&&!env.night(),guitar:this.take?this.take.june:this.june.state==="shell",playback:null};
    }
  }
  window.BaySessions={Band,Take,read,drives,byId};
})();
