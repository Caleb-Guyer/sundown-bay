/* Three neighborhood timing crews share a rule: the junction gives the start. */
(() => {
  "use strict";
  const routes=[
    {id:"ocean",street:"Ocean Drive",driver:"Lena Ríos",kind:"hatch",color:"#388f90",plate:"SURF 13",x:144,z:0,yaw:0,finish:54,landmark:"Palm timing clock",pay:65,pace:27,pull:16.4,delay:.26,
      invite:"See the little clock past the Palm? My brother says a hatch can beat anything to that post.",win:"Okay, he owes me lunch. Keep that slip.",lose:"That's lunch on my brother. Come back around and we'll swap stories."},
    {id:"luna",street:"Luna Boulevard",driver:"Mo Lyle",kind:"coupe",color:"#994a46",plate:"ROW 24",x:0,z:0,yaw:0,finish:45,landmark:"Cine Luna clock",pay:85,pace:28.7,pull:19.5,delay:.19,
      invite:"From this light to the stage door. The early show lets out in a minute.",win:"Photo finish? No need. I saw your bumper.",lose:"That coupe was an usher's car before it was mine. Still makes the early show."},
    {id:"port",street:"Gantry Street",driver:"Caro Pike",kind:"stepside",color:"#cc9954",plate:"DOCK 38",x:-72,z:-72,yaw:-Math.PI/2,finish:59,landmark:"Foundry clock",pay:105,pace:31,pull:22,delay:.14,
      invite:"Bet you didn't expect a dock truck. First nose to the yard clock.",win:"That's a proper launch. I'll chalk your time on my lunch pail.",lose:"All that dock work'll teach you to catch a green. See you on the next one."}
  ];
  const line=-12.80;
  const roadPoint=(r,lane,f)=>({...BayDriving.world(r,lane,f),yaw:r.yaw});
  for(const r of routes){
    r.home=roadPoint(r,7.6,-31);r.grid=roadPoint(r,3.1,line);
    r.post={...roadPoint(r,7.90,r.finish),name:r.landmark,kind:"timing-clock"};
    r.target={...roadPoint(r,3.1,r.finish),name:r.landmark,kind:"green-finish"};
  }
  const route=id=>routes.find(r=>r.id===id);
  function invitation(r,last,plate){
    if(!last)return r.invite;
    const other=last.plate&&plate&&plate!==last.plate;
    if(r.id==="ocean"){
      if(other)return "Hey, what happened to "+last.plate+"? Pull up. My brother wants a look at this one.";
      if(last.time&&signedThird(last.manual))return "My brother drew your "+last.time.toFixed(2)+" and both shift marks on the fridge. Same two changes today?";
      if(last.result==="early")return "I heard those tires before the light changed last time. Watch the lamp with me.";
      if(last.result==="first"&&last.time)return "My brother wrote "+last.time.toFixed(2)+" on his lunch bag. Give me another shot at it?";
      return "Still got your slip from the Palm? I've got mine in the visor. Line up.";
    }
    if(r.id==="luna"){
      if(other)return "You changed cars. I remember "+last.plate+" under that marquee. Same stage door?";
      if(last.result==="early")return "Wait for your cue this time. That red slip won't get you into the matinee.";
      if(last.result==="first")return "The usher asked me who beat me out front. I told her you'd come back.";
      return "The projectionist can see the clock from upstairs. Let's give her another finish.";
    }
    if(other)return "That's a different rig. I had "+last.plate+" chalked on my lunch pail.";
    if(last.result==="early")return "You're quicker than the lamp. Give it the first move this time.";
    if(last.result==="first"&&last.time)return "Still got your "+last.time.toFixed(2)+" chalked on the pail. Haven't rubbed it off yet.";
    return "The yard crew says the old truck still has it. Want to take that up with them?";
  }
  const finite=(n,min,max)=>Number.isFinite(n)&&n>=min&&n<=max;
  const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
  const wrapped=n=>Math.atan2(Math.sin(n),Math.cos(n));
  function readFilm(f){
    if(!f||!Object.hasOwn(BayDriving.cars,f.kind)||!/^#[0-9a-f]{6}$/i.test(f.color)||!Array.isArray(f.shots)||f.shots.length<2||f.shots.length>18)return null;
    let last=-1;
    for(const a of f.shots){
      if(!Array.isArray(a)||a.length!==7||!finite(a[0],0,45000)||a[0]<=last||
        ![1,4].every(i=>finite(a[i],-220,80)&&finite(a[i+1],-24,24)&&finite(a[i+2],-3.15,3.15)))return null;
      last=a[0];
    }
    return {kind:f.kind,color:f.color,plate:typeof f.plate==="string"?f.plate.slice(0,10):"",shots:f.shots.map(a=>a.slice())};
  }
  function exposure(r,p,v,ms){
    const a=relative(r,p),b=relative(r,v);
    return [ms,a.z-r.finish,a.x,wrapped(p.yaw-r.yaw),b.z-r.finish,b.x,wrapped(v.yaw-r.yaw)];
  }
  function contactPrint(a,previous,now,hit){
    const last=now.map((v,i)=>previous[i]+(i===3||i===6?wrapped(v-previous[i]):v-previous[i])*hit);
    last[3]=wrapped(last[3]);last[6]=wrapped(last[6]);
    const stamp=Math.round(last[0]),shots=a.shots.filter(frame=>Math.round(frame[0])<stamp);
    shots.push(last);
    return {kind:a.p.kind,color:a.p.color,plate:BayStreetCars.plateFor(a.p),shots:shots.map(frame=>frame.map((n,i)=>i===0?Math.round(n):Math.round(n*1000)/1000))};
  }
  function readChanges(changes){
    if(!Array.isArray(changes))return null;
    if(changes.length>10||!changes.every((p,i)=>p&&Number.isInteger(p.to)&&p.to>=1&&p.to<=5&&Number.isInteger(p.from)&&Math.abs(p.from-p.to)===1&&p.from>=1&&p.from<=5&&finite(p.rpm,700,7100)&&finite(p.at,0,46)&&(!i||p.at>=changes[i-1].at)))return null;
    return changes.map(({at,from,to,rpm})=>({at,from,to,rpm}));
  }
  function signedThird(changes){
    return !!(changes?.length>=2&&changes[0].from===1&&changes[0].to===2&&changes[1].to===3&&changes[1].from===2&&
      BayDriving.powerBand(changes[0].rpm)&&BayDriving.powerBand(changes[1].rpm));
  }
  function readSlip(s){
    if(!s||!["first","second","early"].includes(s.result))return null;
    return {result:s.result,time:finite(s.time,1,50)?s.time:null,reaction:finite(s.reaction,0,45)?s.reaction:null,
      manual:readChanges(s.manual),launch:["cold","ready","hot"].includes(s.launch)?s.launch:null,toThirty:finite(s.toThirty,.1,45)?s.toThirty:null,
      car:typeof s.car==="string"?s.car.slice(0,26):"",plate:typeof s.plate==="string"?s.plate.slice(0,10):"",
      token:typeof s.token==="string"?s.token.slice(0,60):"",film:readFilm(s.film)};
  }
  function read(raw){
    const book={rev:count(raw?.rev),last:"",cards:{}};
    for(const r of routes){
      const c=raw?.cards?.[r.id];if(!c||!count(c.runs))continue;
      const runs=count(c.runs),wins=Math.min(runs,count(c.wins)),faults=Math.min(runs-wins,count(c.faults));
      const slip=readSlip(c.slip),previous=readSlip(c.bestSlip),best=finite(c.best,1,50)?c.best:null;
      const ink=c.autograph,marks=readChanges(ink?.marks);
      const autograph=signedThird(marks)&&finite(ink.time,1,50)&&typeof ink.plate==="string"?{time:ink.time,plate:ink.plate.slice(0,10),marks:marks.slice(0,2)}:null;
      book.cards[r.id]={autograph,runs,wins,faults,best,slip,manualBest:finite(c.manualBest,1,50)?c.manualBest:null,signed:c.signed===true,bestSlip:previous?.film&&previous.time===best&&previous.token!==slip?.token?previous:null,
        reaction:finite(c.reaction,0,45)?c.reaction:null};
    }
    if(Object.hasOwn(book.cards,raw?.last))book.last=raw.last;
    return book;
  }
  function file(book,id,slip){
    const card=book.cards[id]||{runs:0,wins:0,faults:0,best:null,reaction:null,slip:null};
    if(!route(id)||card.slip?.token===slip.token||card.bestSlip?.token===slip.token)return false;
    if(card.slip?.film&&card.slip.time===card.best)card.bestSlip=card.slip;
    card.runs++;if(slip.result==="first")card.wins++;if(slip.result==="early")card.faults++;
    if(slip.time!=null&&slip.time<=(card.best??Infinity)){card.best=slip.time;card.bestSlip=null;}
    if(slip.reaction!=null)card.reaction=Math.min(card.reaction??Infinity,slip.reaction);
    if(slip.manual&&slip.time!=null){
      card.manualBest=Math.min(card.manualBest??Infinity,slip.time);
      if(signedThird(slip.manual)){
        card.signed=true;
        if(!card.autograph)card.autograph={plate:slip.plate,time:slip.time,marks:slip.manual.slice(0,2).map(p=>({...p}))};
      }
    }
    card.slip={...slip};book.cards[id]=card;book.last=id;book.rev++;return true;
  }
  function leg(v,points,pace,yaw){
    v.path=[{x:v.x,z:v.z},...points];v.corner=1;v.finiteRoute=true;v.finiteYaw=yaw;v.pace=pace;
    for(let i=0;i<points.length;i++){
      const bend=points[i].yieldAt;
      if(bend)BayJunctionTurns.remember(v.path,i+1,...bend);
    }
    v.reaction=null;v.pullOver=null;v.wantsCurb=false;v.wait=0;v.blocked=0;
  }
  // Turn around the adjacent city block and pull back into the original parking place.
  // Square corners stay on the correct side of each successive two-way street.
  function homeward(s,lane){
    const r=s.route,p=(d,f)=>roadPoint(r,d,f);
    const points=[p(lane,65),p(lane,69),p(lane-1.2,72.7),p(-2.7,74.5),p(-69,74.5),p(-72.8,73.1),p(-74.5,69),
      p(-74.5,-68.5),p(-73,-72.9),p(-69,-74.5),p(-2,-74.5),p(1,-73.2),p(2.5,-69),
      p(5.8,-65),p(7.6,-53),r.home];
    // Drivers merge back into the ordinary order of traffic on their lap home.
    points[0].yieldAt=[p(lane,0),p(lane,74.5),points[4]];
    points[4].yieldAt=[points[3],p(-74.5,74.5),points[7]];
    points[7].yieldAt=[points[6],p(-74.5,-74.5),points[10]];
    points[10].yieldAt=[points[9],p(2.5,-74.5),p(2.5,-31)];
    return points;
  }
  function laneChange(a,lane,run){
    const {s}=a,r=s.route,v=s.v,q=relative(r,v),path=homeward(s,lane);
    // The finish beam is a timing line. Keep the passing line usable through
    // the run-out, up to the first point of the returning driver's circuit.
    if(q.z+run>=relative(r,path[0]).z-.25)return false;
    leg(v,[roadPoint(r,lane,q.z+run),...path],v.pace,r.yaw);a.lane=lane;return true;
  }
  function relative(r,v){return BayDriving.local(r,v.x,v.z);}
  function lined(r,p){
    const q=relative(r,p);
    return Math.abs(Math.atan2(Math.sin(p.yaw-r.yaw),Math.cos(p.yaw-r.yaw)))<.44&&q.x>.45&&q.x<6.8&&Math.abs(q.z-line)<2.55&&Math.abs(p.speed)<1.5;
  }
  const nose=(r,v)=>relative(r,v).z+bayCarLayout(v.kind).halfLength*Math.cos(v.yaw-r.yaw);
  const crossed=(x0,x1,at)=>x0<at&&x1>=at?(at-x0)/(x1-x0):null;
  class Club{
    constructor(make,signals){
      this.sites=routes.map(r=>{
        const v=make(r.kind,r.color,r.home.x,r.home.z,r.yaw);
        v.greenId=r.id;v.plate=r.plate;
        return {route:r,v,signal:signals.find(s=>s.x===r.x&&s.z===r.z),out:false,flash:0,clock:0};
      });
      this.run=null;this.cooldown=0;
    }
    challenge(p){
      if(!p||this.cooldown)return null;
      for(const s of this.sites){
        if(s.out||s.v.path||Math.abs(p.x-s.route.x)>30||Math.abs(p.z-s.route.z)>30)continue;
        const q=relative(s.route,p);
        if(q.x>.3&&q.x<7.1&&q.z>=-21&&q.z<line+2.6&&Math.abs(p.speed)<5&&Math.cos(p.yaw-s.route.yaw)>.9)return s;
      }
      return null;
    }
    approach(s,p){
      // Join from the curb whenever there is room for both cars. This also keeps
      // the approach clear of the traffic queue forming behind the player.
      const r=s.route,local=relative(r,p),lane=local.x<4.45?Math.max(5.55,local.x+2.46):1.45;
      const stop=roadPoint(r,lane,line);
      leg(s.v,[roadPoint(r,lane,line-5.7),stop],5.6,r.yaw);
      this.run={s,p,lane,stop,phase:"offer",accepted:false,age:0,staged:0,clock:0,react:null,opponent:null,rolled:0,
        token:Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10)};
    }
    accept(){const a=this.run;if(!a||a.phase!=="offer"||a.accepted)return false;a.accepted=true;return true;}
    leave(){
      const a=this.run;if(!a)return;
      const s=a.s,v=s.v;
      if(a.phase!=="running"){
        // Clear the player at the light, then merge before the first curb parking.
        const r=s.route,through=2.55;
        leg(v,[roadPoint(r,a.lane,2),roadPoint(r,through,15),...homeward(s,through)],6.3,r.yaw);
      }
      s.runOut=a.phase==="running"&&a.film&&nose(s.route,v)<s.route.finish+2?a:null;
      v.greenRacing=!!s.runOut;v.pace=s.runOut?s.route.pace:7.7;s.out=true;this.run=null;this.cooldown=3;
    }
    step(dt,t,p,eligible,gas=false){
      this.cooldown=Math.max(0,this.cooldown-dt);
      for(const s of this.sites){
        s.flash=Math.max(0,s.flash-dt);
        if(s.runOut&&nose(s.route,s.v)>=s.route.finish+2){s.runOut=null;s.v.greenRacing=false;s.v.pace=7.7;}
        if(s.out&&!s.v.path)s.out=false;
      }
      const a=this.run;
      if(!a){const s=eligible&&this.challenge(p);if(s){this.approach(s,p);return "offer";}return;}
      const {s}=a,r=s.route,v=s.v;a.age+=dt;
      if(!eligible||p!==a.p){this.leave();return "cancel";}
      const q=relative(r,p);
      if(a.phase!=="running"){
        if(Math.abs(q.x)>10||q.z< -35||q.z>line+5.2||a.age>70){this.leave();return "cancel";}
        const green=BayCrosswalk.lamps(s.signal,t)===(Math.abs(Math.cos(r.yaw))>.7?"ns":"ew");
        const gap=Math.hypot(v.x-a.stop.x,v.z-a.stop.z);
        const alongside=v.path&&v.corner===v.path.length-1&&v.blocked>.6&&gap<2.25&&Math.abs(relative(r,v).z-q.z)<2.35;
        // A driver can acknowledge the grid from the queue, then edge up as it
        // clears. A green already in progress while they're moving is not a start.
        if(v.path&&(gap<.20||alongside&&v.blocked>12)){v.path=null;BayDriving.settle(v);v.brakes=1;}
        if(a.phase==="offer"){
          if(!a.accepted||v.path&&!alongside||!lined(r,p)||Math.abs(q.x-a.lane)<2)return;
          a.staged+=dt;if(a.staged<.20)return;
          a.start=nose(r,p);a.phase="armed";a.sawRed=!green&&!v.path;return "armed";
        }
        if(!green&&!v.path)a.sawRed=true;
        if(green&&a.sawRed&&!v.path){
          a.manual=p.manual&&p.gear===1&&!p.reversing?[]:null;
          a.phase="running";a.prev=nose(r,p);a.rivalPrev=nose(r,v);s.clock=0;a.lastSpeed=Math.max(0,p.speed);
          a.frame=exposure(r,p,v,0);a.shots=[a.frame];a.nextPhoto=90;
          leg(v,homeward(s,a.lane),0,r.yaw);v.wait=r.delay;v.greenRacing=true;
          return "go";
        }
        if(nose(r,p)>a.start+.85||q.z>line+3)return "early";
        if(q.z<line-4||Math.abs(q.x-a.lane)<1.6){this.leave();return "cancel";}
        return;
      }
      const before=a.clock;a.clock+=dt;if(!a.film)s.clock=a.clock;
      v.pace=Math.min(r.pace,Math.max(0,a.clock-r.delay)*r.pull);
      const now=nose(r,p),other=nose(r,v),driverCross=crossed(a.prev,now,r.finish),rivalCross=crossed(a.rivalPrev,other,r.finish);
      const cleanCross=q.x>=-6.6&&q.x<=7.2&&Math.cos(p.yaw-r.yaw)>.65;
      if(!a.film){
        const frame=exposure(r,p,v,a.clock*1000);
        const hit=Math.min(cleanCross?(driverCross??Infinity):Infinity,rivalCross??Infinity);
        if(Number.isFinite(hit)){
          a.film=contactPrint(a,a.frame,frame,hit);s.flash=1.7;s.clock=before+dt*hit;
        }else if(frame[0]>=a.nextPhoto){
          a.shots.push(frame);if(a.shots.length>16)a.shots.shift();a.nextPhoto=frame[0]+90;
        }
        a.frame=frame;
      }
      if(a.react===null&&gas){a.react=before;a.launch=BayDriving.tireState(p);}
      const speed=Math.max(0,p.speed),thirty=30/2.237;
      if(a.react!==null&&a.toThirty==null&&a.lastSpeed<thirty&&speed>=thirty)
        a.toThirty=before+(thirty-a.lastSpeed)/(speed-a.lastSpeed)*dt-a.react;
      a.lastSpeed=speed;
      if(a.opponent===null&&rivalCross!==null)a.opponent=before+dt*rivalCross;
      a.prev=now;a.rivalPrev=other;
      if(driverCross!==null&&cleanCross){
        a.clock=before+dt*driverCross;
        return a.opponent===null||a.clock<=a.opponent?"first":"second";
      }
      if(Math.abs(q.x)>12||q.z<line-8||q.z>r.finish+6||a.clock>45){this.leave();return "cancel";}
    }
  }
  window.BayOnGreen={signedThird,routes,route,line,roadPoint,relative,nose,lined,invitation,read,file,laneChange,Club};
})();
