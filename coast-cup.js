/* Two club cars share the live traffic circuit. All three finish orders use
   the same stripe, and the player's sectors have to be crossed in sequence. */
(() => {
  "use strict";
  const stripe={x:144,z:39.5,yaw:0,name:"Ocean timing stripe"};
  const grid={x:145.5,z:48,yaw:0,name:"Northbound grid · Ocean Drive"};
  const desk={x:151.25,z:40.7,name:"Sol Motor Club · Timing stand"};
  const drivers=[
    {name:"Pili Ramos",number:7,kind:"hatch",paint:"#308b83",home:45.6,lane:2,top:18.1,power:7.5,grip:10.8},
    {name:"Vic Calder",number:4,kind:"coupe",paint:"#aa5343",home:52.6,lane:-1.6,top:22.8,power:8.8,grip:8.2}
  ];
  const gates=[
    {x:144,z:126,yaw:0,name:"North Boardwalk",turn:"Left at the boardwalk"},
    {x:99,z:144,yaw:-Math.PI/2,name:"Marina bend",turn:"Left onto the marina road"},
    {x:72,z:25,yaw:Math.PI,name:"Neon Mile",turn:"Left onto Marquee"},
    {x:121,z:0,yaw:Math.PI/2,name:"Marquee",turn:"Left onto Ocean Drive"},
    stripe
  ];
  const job={id:"coast-cup",name:"Coastline Circuit",by:"Luz Quintero"};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const blend=(a,b,t)=>({x:a.x+(b.x-a.x)*t,z:a.z+(b.z-a.z)*t});
  const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const points=[stripe],corners=[{x:144,z:144},{x:72,z:144},{x:72,z:0},{x:144,z:0}];
  for(const [i,b] of corners.entries()){
    const a=corners[(i+3)%4],c=corners[(i+1)%4],entry=blend(b,a,6.8/gap(b,a)),exit=blend(b,c,6.8/gap(b,c));
    for(let j=0;j<=12;j++){const t=j/12;points.push(blend(blend(entry,b,t),blend(b,exit,t),t));}
  }
  const track=BayCab.track([...points,stripe]),length=track.length;
  for(const g of gates)g.at=g===stripe?length:track.closest(g).at;
  function sample(at,offset=0){
    const p=track.sample(((at%length)+length)%length);
    p.x+=Math.cos(p.yaw)*offset;p.z-=Math.sin(p.yaw)*offset;return p;
  }
  // Budget braking room before each bend once for the two different cars.
  // Pili carries more corner speed. Vic makes up time on the long straights.
  for(const d of drivers)d.paces=Array.from({length:Math.ceil(length)},(_,at)=>{
    let pace=d.top;
    for(let ahead=0;ahead<=28;ahead+=2){
      const radians=Math.abs(angle(sample(at+ahead-1).yaw,sample(at+ahead+1).yaw));
      if(radians>.005)pace=Math.min(pace,Math.sqrt(d.grip*2/radians+2*9*ahead));
    }
    return pace;
  });
  function crossing(previous,now,g){
    const a=BayDriving.local(g,previous.x,previous.z),b=BayDriving.local(g,now.x,now.z);
    if(a.z>=0||b.z<0||b.z-a.z<.00001)return null;
    const t=-a.z/(b.z-a.z);return Math.abs(a.x+(b.x-a.x)*t)<=8.25?t:null;
  }
  function read(raw){
    const valid=t=>Number.isFinite(t)&&t>0&&t<600;
    const s=raw?.last,place=s?.place;
    const last=s&&[1,2,3].includes(place)&&valid(s.time)&&valid(s.lap)&&typeof s.car==="string"&&typeof s.plate==="string"?
      {place,time:s.time,lap:s.lap,car:s.car.slice(0,44),plate:s.plate.slice(0,12)}:null;
    if(last){
      if(typeof s.id==="string"&&s.id.length<=40)last.id=s.id;
      if(Array.isArray(s.laps)&&s.laps.length===2&&s.laps.every(valid))last.laps=s.laps.slice();
      if(Array.isArray(s.field)&&s.field.length===2&&s.field.every(e=>e&&(e.time===null||valid(e.time))&&Number.isFinite(e.back)&&e.back>=0&&e.back<=2*length+10)){
        last.field=s.field.map(e=>({time:e.time,back:e.back}));
      }
    }
    const splits=raw?.splits;
    return {known:!!raw?.known,splits:Array.isArray(splits)&&splits.length===2*gates.length&&splits.every((t,i)=>valid(t)&&(!i||t>splits[i-1]))?splits.slice():[],
      starts:Number.isSafeInteger(raw?.starts)&&raw.starts>=0?raw.starts:0,
      wins:Number.isSafeInteger(raw?.wins)&&raw.wins>=0?raw.wins:0,best:valid(raw?.best)?raw.best:0,lap:valid(raw?.lap)?raw.lap:0,last};
  }
  class Cup{
    constructor(cars){
      this.phase="parked";this.player=null;this.clock=0;this.gate=0;this.completed=0;
      this.runners=cars.map((v,i)=>{const d=drivers[i];return {v,d,at:d.home-stripe.z,offset:v.x-stripe.x,
        targetOffset:d.lane,scan:0,speed:0,blocked:0,parked:true,time:null};});
    }
    staged(v){
      return v&&!v.serviceCar&&!v.meetCar&&Math.abs(v.speed)<1&&Math.abs(angle(v.yaw,0))<.48&&
        v.x>=140.6&&v.x<=147.4&&Math.abs(v.z-grid.z)<4.3;
    }
    start(v){
      if(this.phase!=="parked"||!this.staged(v))return false;
      this.phase="count";this.player=v;this.clock=0;this.count=3;this.gate=this.completed=0;
      this.lastLap=0;this.laps=[];this.splits=[];this.split=0;this.previous={x:v.x,z:v.z};this.progress=v.z-stripe.z;this.finish=null;
      for(const r of this.runners){
        r.at=r.v.z-stripe.z;r.offset=r.v.x-stripe.x;r.targetOffset=r.d.lane;r.scan=r.speed=r.blocked=r.backIn=r.avoidFor=0;r.parked=false;r.time=null;r.homeAt=2*length+r.d.home-stripe.z;
      }
      return true;
    }
    cancel(){
      if(this.phase==="count"){this.phase="parked";for(const r of this.runners)r.parked=true;}
      else if(this.phase==="race"){
        this.phase="return";for(const r of this.runners)if(!r.parked){
          const home=r.d.home-stripe.z;
          if(r.speed<2.5&&gap(r.v,{x:149.12,z:r.d.home})<1){r.parked=true;BayDriving.settle(r.v);}
          else r.homeAt=Math.ceil((r.at-home)/length)*length+home;
        }
      }
      this.player=null;
    }
    calcProgress(p){
      const at=track.closest(p),start=this.gate?gates[this.gate-1].at:0,end=gates[this.gate].at;
      const local=this.gate===0&&at.at>length-10?0:at.at;
      return this.completed*length+clamp(local,start,end);
    }
    rank(){
      return 1+this.runners.filter(r=>r.time!==null?this.finish===null||r.time<this.finish:r.at>this.progress).length;
    }
    battle(){
      const [a,b]=this.runners,r=Math.abs(a.at-this.progress)<Math.abs(b.at-this.progress)?a:b;
      const d=Math.round(r.at-this.progress),name=r.d.name.split(" ")[0];
      return Math.abs(d)<3?"Alongside "+name:name+" "+Math.abs(d)+" m "+(d>0?"ahead":"back");
    }
    guide(){
      const gate=gates[this.gate],from=clamp(this.progress-this.completed*length,0,gate.at),points=[this.player];
      for(let d=from+4;d<gate.at;d+=6)points.push(sample(d,2.1));
      points.push(gate);return {points,meters:Math.max(0,gate.at-from),turn:gate.turn||"Take the stripe on Ocean Drive"};
    }
    runner(r,dt,e){
      if(r.parked)return;
      const v=r.v,d=r.d,remaining=r.homeAt-r.at;
      const finishing=r.time!==null||this.phase==="return"&&this.finish===null;
      const parking=finishing&&remaining<26;
      r.avoidFor=Math.max(0,r.avoidFor-dt);
      if(r.blocked>.72&&r.avoidFor===0&&remaining>5){
        r.avoidOffset=r.offset;r.avoidFor=2.6;r.backIn=.78;r.blocked=0;
      }
      if(r.backIn>0){
        const reverse=Math.min(r.at+.5,2.55*dt),p=sample(r.at-reverse,r.offset);
        if(e.clear(v,p)){r.at-=reverse;v.vx=(p.x-v.x)/dt;v.vz=(p.z-v.z)/dt;Object.assign(v,p);v.speed=-reverse/dt;v.wheelSpin-=reverse/.32;}
        else{r.backIn=0;v.speed=v.vx=v.vz=0;}
        v.reversing=true;v.brakes=.6;r.speed=0;r.backIn-=dt;r.scan=0;return;
      }
      v.reversing=false;
      r.scan-=dt;
      if(r.scan<=0){
        r.scan=.22;
        // Compare usable road ahead in each lane. A small switching cost keeps
        // a driver from weaving behind a car that is already moving away.
        const offsets=parking&&remaining<7?[5.12]:parking?[5.12,d.lane,0,-2.6,3.3]:[d.lane,2.8,-2.6,0,4.7,-4.7];
        let best=-Infinity;
        for(const off of offsets){
          let clear=0;
          for(const n of [.8,3.5,7,11,16]){
            if(!e.clear(v,sample(r.at+Math.min(n,remaining),off)))break;clear=n;
          }
          const shift=clamp(off-r.offset,-.26,.26);
          const canMerge=e.clear(v,sample(r.at+.12,r.offset+shift))||e.clear(v,sample(r.at,r.offset+shift));
          const preferred=parking?5.12:d.lane;
          const score=clear-.32*Math.abs(off-r.offset)-(parking?.68:.24)*Math.abs(off-preferred)-
            (canMerge?0:17)-(r.blocked>.38&&Math.abs(off-r.offset)<.65?19:0)-
            (r.avoidFor>0&&Math.abs(off-r.avoidOffset)<1.45?14:0);
          if(score>best){best=score;r.targetOffset=off;r.room=clear;}
        }
      }
      const cap=finishing?13:d.top,corner=Math.min(cap,d.paces[Math.floor((r.at%length+length)%length)]);
      let pace=Math.min(corner,parking?Math.sqrt(Math.max(0,remaining)*9):cap);
      if(r.room<11)pace=Math.min(pace,r.room<3?3:6+r.room*.55);
      const old=r.speed;
      r.speed+=clamp(pace-r.speed,-12*dt,d.power*dt);
      let advance=Math.min(r.speed*dt,remaining);
      const shift=clamp(r.targetOffset-r.offset,-3.9*dt,3.9*dt);
      let offset=r.offset+shift,q=sample(r.at+advance,offset);
      if(!e.clear(v,q)){
        // Keep moving laterally into a verified gap even in a stopped queue.
        advance=0;q=sample(r.at,offset);
        if(!e.clear(v,q)){offset=r.offset;q=sample(r.at,offset);}
        r.speed=Math.max(0,r.speed-25*dt);
      }
      r.blocked=advance<.005?r.blocked+dt:0;
      const prev=r.at,x=v.x,z=v.z,yaw=v.yaw;r.at+=advance;r.offset=offset;
      v.x=q.x;v.z=q.z;v.yaw=q.yaw;v.vx=(v.x-x)/dt;v.vz=(v.z-z)/dt;v.speed=advance/dt;
      v.wheelSpin=(v.wheelSpin||0)+advance/.32;v.steer=clamp(angle(yaw,v.yaw)*.23/dt,-.49,.49);
      v.lean=clamp(-v.steer*v.speed*.018,-.09,.09);v.brakes=Number(pace<old-.2||advance<.01);
      if(r.time===null&&(this.phase==="race"||this.finish!==null)&&r.at>=2*length){
        r.time=this.clock-dt+dt*clamp((2*length-prev)/(r.at-prev||1),0,1);
      }
      if(remaining<.07&&Math.abs(r.offset-5.12)<.17||finishing&&remaining<4&&r.blocked>1.4&&r.offset>4.2){
        r.parked=true;BayDriving.settle(v);
      }
    }
    step(dt,e){
      if(this.phase==="parked")return;
      if(this.phase==="count"){
        this.count-=dt;if(this.count>0)return;
        this.phase="race";this.previous={x:this.player.x,z:this.player.z};return "go";
      }
      this.clock+=dt;
      const classified=this.phase==="return"&&this.finish!==null&&this.runners.some(r=>r.time===null);
      for(const r of this.runners)this.runner(r,dt,e);
      if(this.phase==="return"){
        if(this.runners.every(r=>r.parked))this.phase="parked";
        if(classified&&this.runners.some(r=>r.time!==null&&r.time>=this.clock-dt-.000001))return "classified";
        return;
      }
      const v=this.player,g=gates[this.gate],t=crossing(this.previous,v,g);
      this.previous.x=v.x;this.previous.z=v.z;
      if(t!==null){
        const time=this.clock-dt+dt*t;this.split=time;this.splits.push(time);
        if(++this.gate===gates.length){
          this.laps.push(time-this.lastLap);this.lastLap=time;this.gate=0;this.completed++;
          if(this.completed===2){
            this.finish=time;this.progress=2*length;this.place=this.rank();this.phase="return";this.player=null;return "finish";
          }
          this.progress=length;return "lap";
        }
      }
      this.progress=this.calcProgress(v);
      if(this.clock>290){this.cancel();return "timeout";}
      return t===null?null:"sector";
    }
  }
  window.BayCoastCup={job,desk,grid,stripe,gates,drivers,track,length,sample,read,Cup};
})();
