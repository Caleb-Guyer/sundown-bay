/* A public bus runs one continuous right-hand circuit. The relief driver uses the same bus and doors. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mod=(n,d)=>(n%d+d)%d;
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const ease=n=>{n=clamp(n,0,1);return n*n*(3-2*n);};
  const world=(v,x,z)=>BayDriving.world(v,x,z);
  const coach=BayCityBusArt;
  const footprint={track:coach.halfWidth,halfLength:coach.halfLength,axles:coach.axles,wheel:coach.radius};
  const handling={top:20.2,power:5.3,brake:11.8,grip:12.2,balance:.52,steer:.76,response:5.2,roll:.054};
  const cabinFloor=coach.floor,toSeat=q=>({...q,top:q.y});
  const driverSeat=toSeat(coach.driver),[riderSeat,crewSeat,...seats]=coach.seats.map(toSeat);
  const doors={front:coach.doors.front.z,rear:coach.doors.rear.z};
  function stop(id,name,x,z,dir,style,right=2.48){
    const berth={x,z,yaw:dir*Math.PI/2,dir},p=world(berth,right,doors.front);
    return {...p,y:.076,yaw:berth.yaw,kind:"bus-stop",id,name:"Route 6 · "+name,short:name,style,berth,right};
  }
  const stops=[stop("marlin","Marlin Motel",138.55,-39,2,"marlin"),stop("mercado","El Mercado",-51,-138.55,3,"market"),
    stop("port","Port Sol",-138.55,-47,0,"harbor"),stop("luna","Cine Luna",16,66.55,1,"cine",2.05)];
  const cast=[
    {id:"inezabel",name:"Belén Sierra",style:2,home:0,to:1,prop:"basket",hello:"The first guavas go to Rosario. I kept the soft ones for the motel.",thanks:"My basket made the turn better than I did."},
    {id:"lon",name:"Lon Bell",style:5,home:0,to:2,prop:"tin",hello:"Port Sol, please. The dock clock’s been six minutes fast since June.",thanks:"Right outside the gate. See you on the way home."},
    {id:"miki",name:"Miki Sáenz",style:3,home:1,to:3,prop:"film",hello:"That little tin is the trailer. The feature went over yesterday.",thanks:"I can still make the first reel."},
    {id:"noor",name:"Noor Vale",style:4,home:2,to:0,prop:"bag",hello:"Folded sheets going out, saltwater towels coming back. Same run every day.",thanks:"The Marlin can have its good pillowcases back."},
    {id:"ruben",name:"Rubén Díaz",style:1,home:3,to:1,prop:"bag",hello:"Rosario saves me the last roll. Nobody at the theater bakes bread like that.",thanks:"Right on the corner. I’ll bring Marta one."},
    {id:"alba",name:"Alba Font",style:2,home:0,to:3,prop:"tickets",hello:"Dad printed the balcony tickets on the backs of the blue ones. Both sides count.",thanks:"The box office has its roll for tonight."}
  ];
  function read(raw){
    const n=k=>Number.isSafeInteger(raw?.[k])?clamp(raw[k],0,1000000):0;
    const stamps=stops.map(s=>s.id).filter(id=>Array.isArray(raw?.stamps)&&raw.stamps.includes(id));
    const best={};for(const s of stops){const v=raw?.best?.[s.id];if(Number.isInteger(v)&&v>=0&&v<=100)best[s.id]=v;}
    return {runs:n("runs"),rides:n("rides"),delivered:n("delivered"),stamps,best};
  }
  // The corner radius is measured at the bus center. The smooth pull-in keeps the long tail on asphalt.
  function buildTrack(){
    const corners=[[141.5,-141.5],[-141.5,-141.5],[-141.5,69.5],[141.5,69.5]],r=9;
    const start={x:141.5,z:-39},pieces=[];let last=start,length=0;
    function straight(to){
      const len=gap(last,to),yaw=Math.atan2(to.x-last.x,to.z-last.z);
      pieces.push({p:last,yaw,len,at:length});length+=len;last=to;
    }
    let yaw=Math.PI;
    for(const [x,z] of corners){
      const dx=Math.sin(yaw),dz=Math.cos(yaw),rightX=dz,rightZ=-dx;
      const entry={x:x-dx*r,z:z-dz*r};straight(entry);
      const center={x:entry.x+rightX*r,z:entry.z+rightZ*r},len=r*Math.PI/2;
      pieces.push({p:entry,center,yaw,len,at:length});length+=len;
      last={x:x+rightX*r,z:z+rightZ*r};yaw+=Math.PI/2;
    }
    straight(start);
    function sample(distance){
      const s=mod(distance,length),q=pieces.find(p=>s<p.at+p.len)||pieces.at(-1),d=s-q.at;
      const a=q.yaw+(q.center?d/r:0),sn=Math.sin(a),cs=Math.cos(a);
      if(q.center)return {x:q.center.x-cs*r,z:q.center.z+sn*r,yaw:a};
      let x=q.p.x+d*sn,z=q.p.z+d*cs,bearing=a;
      for(const stop of stops){
        if(Math.abs(turn(a,stop.yaw))>.01)continue;
        const t=(x-stop.berth.x)*sn+(z-stop.berth.z)*cs;
        if(Math.abs(t)>=20)continue;
        const u=clamp((20-Math.abs(t))/19,0,1),offset=2.95*ease(u);
        x+=cs*offset;z-=sn*offset;bearing+=Math.atan(-Math.sign(t)*2.95*6*u*(1-u)/19);
      }
      return {x,z,yaw:bearing};
    }
    const marks=[];for(let d=0;d<length;d+=3)marks.push({...sample(d),at:d});
    function closest(p){
      let nearest=marks[0],best=Infinity;
      for(const q of marks){const d=(q.x-p.x)**2+(q.z-p.z)**2;if(d<best){nearest=q;best=d;}}
      const along=(p.x-nearest.x)*Math.sin(nearest.yaw)+(p.z-nearest.z)*Math.cos(nearest.yaw);
      return mod(nearest.at+clamp(along,-3,3),length);
    }
    marks.push({...sample(0),at:length});
    for(const stop of stops)stop.at=stop===stops[0]?0:closest(stop.berth);
    return {length,marks,sample,closest,forward:(from,to)=>mod(to-from,length)};
  }
  const track=buildTrack();
  const workPaths=[
    [[135.85,-34.2],[135.75,-31.5],[132.4,-30.05],[131.25,-29.52]],
    [[-47.7,-135.45],[-43.2,-135.05],[-38.05,-134.62]],
    [[-130.6,-49.3],[-129.9,-59.32],[-110.35,-59.36]],
    [[12.3,63.5],[10.82,60.25],[10.8,54.8],[10.15,38]]
  ];
  const queue=(s,i)=>world(s,.12+(i%2)*.42,-(i%3)*.66);
  function actor(info,x,z){
    return {...info,x,z,y:.076,yaw:0,motion:new BayPlayerMotion(),stage:"wait",path:[],seat:null,sit:0,clock:0};
  }
  function setPath(p,stage,path){p.stage=stage;p.path=path;p.clock=0;}
  function spot(bus,x,z,y=cabinFloor){return {...world(bus,x,z),y:bus.y+y};}
  function mounted(p){return ["board","sitting","ride","standing","alight","trade","rising"].includes(p.stage);}
  function approach(p,dt,rate){
    const q=p.path[0];if(!q)return true;
    const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz),f=Math.min(1,rate*dt/Math.max(.0001,d));
    if(d>.025)p.yaw+=turn(p.yaw,Math.atan2(dx,dz))*-Math.expm1(-11*dt);
    p.x+=dx*f;p.z+=dz*f;p.y+=(q.y-p.y)*f;p.motion.step(dt,d*f,0);
    if(f>=1){p.y=q.y;p.path.shift();}return !p.path.length;
  }
  function seatPose(person,bus,dt){
    const seat=person.seat;if(!seat)return;
    const pt=world(bus,seat.x,seat.z);
    person.x=pt.x;person.z=pt.z;person.y=bus.y+cabinFloor;
    person.yaw+=turn(person.yaw,bus.yaw)*-Math.expm1(-13*dt);
    const m=person.motion,r=m.ride||(m.ride={side:1,handle:[0,0,0],duck:0,latchDip:0,reach:0,pull:0});
    r.seat=r.inner=r.outer=ease(person.sit);r.seatY=seat.top-cabinFloor;r.floor=seat.top>1.1?.16:0;
    r.passenger=seat!==driverSeat;r.steer=bus.steer||0;m.step(dt,0,0);
  }
  const benchAnchor={x:0,z:0,top:cabinFloor+.47};
  function benchPose(p,dt){
    const a=p.bench,base={x:a.x,z:a.z,y:a.y-.47-cabinFloor,yaw:a.yaw,steer:0};
    const reserved=p.seat;p.seat=benchAnchor;seatPose(p,base,dt);p.seat=reserved;
  }
  function stopOffset(bus,s){
    const p=BayDriving.local(s.berth,bus.x,bus.z);
    return {side:p.x,along:p.z,angle:turn(s.yaw,bus.yaw)};
  }
  class Line{
    constructor(memory){
      this.memory=memory;this.current=0;this.next=1;this.at=0;this.phase="dwell";this.dwell=23;
      this.bus={...stops[0].berth,kind:"routebus",y:.045,color:"#4b8f86",footprint,handling,door:1,signal:0,request:false,upgrades:{},serviceCar:true};
      BayDriving.settle(this.bus);this.bus.brake=1;this.bus.wheel=0;
      this.driver=actor({id:"marta",name:"Marta Leal",style:1},0,0);Object.assign(this.driver,{seat:driverSeat,sit:1,stage:"ride",yaw:this.bus.yaw});
      this.people=cast.map((c,i)=>{const q=queue(stops[c.home],i);return {...actor(c,q.x,q.z),from:c.home,destination:c.to,order:i,yaw:stops[c.home].yaw-Math.PI/2};});
      for(const p of this.people)if(p.id==="alba"){
        const [x,z]=workPaths[p.from].at(-1);Object.assign(p,{x,z,stage:"work",clock:-65,yaw:Math.PI/2});
      }else if(p.order%2===1){
        p.bench=BayBusStopArt.seats(stops[p.from])[p.order%3];p.sit=1;benchPose(p,0);
      }
      this.player=null;this.flag=null;this.shift=null;this.inside=false;this.pan=0;this.tilt=0;this.scan=0;this.space=Infinity;this.block=0;
      this.offset=0;this.passUntil=0;this.requested=false;this.waitFast=false;this.returning=null;this.dockScore=0;
    }
    get stop(){return stops[this.current];}
    get target(){return stops[this.next];}
    get driving(){return !!this.player&&this.player.seat===driverSeat&&this.player.stage==="ride"&&!!this.shift;}
    get aboard(){return !!this.player;}
    get engaged(){return !!(this.player||this.flag);}
    near(p,r=3.6){return stops.find(s=>gap(s,p)<r);}
    nextDistance(){return this.phase==="road"||this.phase==="manual"?track.forward(this.at,this.target.at):0;}
    distanceTo(s){
      if(this.phase!=="road"&&this.phase!=="manual"&&this.stop===s)return 0;
      return track.forward(this.at,s.at);
    }
    docked(s){return this.phase==="dwell"&&this.stop===s&&this.bus.door>.94;}
    flagAt(s,role,fast=false){
      if(this.player||!s||!["rider","driver"].includes(role))return false;
      this.flag={s,role};this.waitFast=fast;return true;
    }
    cancelFlag(){this.flag=null;this.waitFast=false;}
    board(env,role="rider"){
      const s=this.stop,b=this.bus,p=env.hero;
      if(this.player||!this.docked(s)||gap(p,s)>4.10||!env.free())return false;
      const at=BayDriving.local(b,p.x,p.z);
      if(at.x<.82)return false;
      this.cancelFlag();this.inside=false;this.pan=.15;this.tilt=-.07;
      this.player={id:"player",x:p.x,y:p.y,z:p.z,yaw:p.yaw,motion:env.motion,path:[],sit:0,role,stage:"queue",seat:role==="driver"?driverSeat:riderSeat,from:this.current,ridden:0};
      if(role==="driver"){this.shift={origin:this.current,served:0,rough:0,delivered:0,release:false};this.driver.stage="standing";this.driver.nextSeat=crewSeat;}
      this.dwell=Math.max(this.dwell,2);env.line("Marta Leal",role==="driver"?"Your turn. Close the doors with F when the aisle’s clear. I’ll call out the stops.":"Grab the window seat. Pull the cord with F before your stop.");
      return true;
    }
    beginBoard(p,env){
      const b=this.bus,s=this.stop,front=doors.front;
      const sidewalk=world(b,s.right,front);
      const path=[{...sidewalk,y:env.ground(sidewalk.x,sidewalk.z)},spot(b,1.33,front,.21),spot(b,.86,front),spot(b,.08,front),
        spot(b,.08,p.seat.z),spot(b,p.seat.x,p.seat.z)];
      if(p.bench){setPath(p,"rising",[p.bench.approach,...path]);return;}
      setPath(p,"board",path);
    }
    beginOut(p,env){
      const b=this.bus,z=p.role==="driver"?doors.front:doors.rear,curb=world(b,this.stop.right,z);
      const end=env.exit(b,z)||{...curb,y:env.ground(curb.x,curb.z)};
      setPath(p,"alight",[spot(b,.05,p.seat.z),spot(b,.05,z),spot(b,.88,z),spot(b,1.33,z,.21),end]);
    }
    ring(env){
      if(this.player?.stage!=="ride"||this.shift)return false;
      if(this.phase==="dwell"&&this.bus.door>.94)return this.wantOut(env);
      if(!this.requested){
        const s=this.phase==="open"?this.stop:this.target;
        this.requested=this.bus.request=true;env.cue("bus-bell");env.line("Marta Leal",s.short+". I’ve got your stop.");
      }
      return true;
    }
    reserveConnection(stop){
      const p=this.player;
      if(p?.role!=="rider"||p.stage!=="ride"||!stops.includes(stop))return false;
      p.connection=stop.id;
      this.requested=this.bus.request=p.ridden>0&&this.stop===stop&&["open","dwell"].includes(this.phase);
      return true;
    }
    wantOut(env){
      const p=this.player;if(!p||p.stage!=="ride")return false;
      if(this.phase==="dwell"&&this.bus.door>.94){
        if(this.shift&&this.shift.origin!==this.current){env.line("Marta Leal","Let the last person through. I’ll sign your trip here.");return false;}
        p.stage="standing";p.nextSeat=null;this.inside=false;this.waitFast=false;this.requested=this.bus.request=false;return true;
      }
      if(!this.shift)return this.ring(env);
      if(Math.abs(this.bus.speed)>.46){env.line("Marta Leal","Bring us to a stop first. I’ll take the seat back.");return false;}
      if(!env.exit(this.bus,doors.front)){env.line("Marta Leal","Give the door a bit of space on the right.");return false;}
      this.shift.release=true;this.phase="handoff";this.requested=false;this.inside=false;return true;
    }
    takeDoors(env){
      if(!this.driving)return false;
      if(this.phase==="dwell"){
        if(this.busy()||this.pending()){env.line("Marta Leal","Hold the doors. Someone’s still coming through.");return true;}
        this.service(env);
        this.phase="close";env.cue("bus-door");return true;
      }
      if(this.phase!=="manual")return true;
      const q=stopOffset(this.bus,this.target);
      if(Math.abs(this.bus.speed)>.62||Math.abs(q.side)>1.18||Math.abs(q.along)>2.85||Math.abs(q.angle)>.26){
        env.line("Marta Leal",this.dockHint());return true;
      }
      const clean=100-17*Math.abs(q.side)-5*Math.abs(q.along)-25*Math.abs(q.angle)-4*this.shift.rough;
      this.dockScore=Math.round(clamp(clean,0,100));this.arrive(env);return true;
    }
    dockHint(){
      const q=stopOffset(this.bus,this.target);if(gap(this.bus,this.target.berth)>20)return "Follow the line to "+this.target.short+".";
      if(Math.abs(q.angle)>.26)return "Face the same way as the curb arrows.";
      if(q.along< -2.85)return "Roll forward "+Math.round(-q.along)+" m to the stop.";
      if(q.along>2.85)return "Ease back "+Math.round(q.along)+" m to the stop.";
      if(q.side< -1.18)return "Bring the front door closer to the curb.";
      if(q.side>1.18)return "Ease left off the sidewalk.";
      return Math.abs(this.bus.speed)>.62?"Brake to stop beside the pole.":"F opens the doors.";
    }
    busy(){return !!(this.player&&this.player.stage!=="ride"||this.driver.stage!=="ride"||this.people.some(p=>mounted(p)&&p.stage!=="ride"));}
    pending(){return this.people.some(p=>p.stage==="ride"&&p.destination===this.current||p.stage==="wait"&&p.from===this.current&&this.emptySeat());}
    emptySeat(){return seats.find(s=>!this.people.some(p=>p.seat===s));}
    arrive(env){
      this.current=this.next;this.next=(this.current+1)%stops.length;this.at=this.stop.at;this.phase="open";this.dwell=4.4;this.passUntil=this.offset=0;
      BayDriving.settle(this.bus);this.bus.signal=1;this.bus.brake=1;env.cue("bus-door");
      if(this.player?.role==="rider"){
        this.player.ridden++;
        if(this.player.connection===this.stop.id){this.requested=this.bus.request=true;env.cue("bus-bell");}
      }
      if(this.player?.role==="rider")env.line("Marta Leal",this.stop.short+". "+(this.requested?"Your stop. Back door.":"Change here, or stay on for "+this.target.short+"."));
    }
    sendWork(p,env){
      const nodes=workPaths[this.current].map(([x,z])=>({x,z}));
      const path=nodes.map(q=>({...q,y:env.ground(q.x,q.z)}));p.from=this.current;p.destination=this.current===p.home?p.to:p.home;
      setPath(p,"street",path);p.seat=null;
    }
    workName(index){return ["Marlin arcade","market counter","port office","Cine Luna doors"][index];}
    returnToStop(p,ground){
      const s=stops[p.from],via=workPaths[p.from].slice(0,-1).reverse().map(([x,z])=>({x,z}));
      via.push(world(s.berth,2.35,doors.rear),world(s.berth,2.36,1.15),queue(s,p.order));
      setPath(p,"back",via.map(q=>({...q,y:ground(q.x,q.z)})));
    }
    peopleStep(dt,env){
      const b=this.bus,travellers=this.player?[this.driver,...this.people,this.player]:[this.driver,...this.people];
      for(const p of travellers){
        if(p.stage==="ride"){seatPose(p,b,dt);continue;}
        if(p.stage==="rising"||p.stage==="wait"&&p.bench){
          if(p.stage==="rising")p.sit=Math.max(0,p.sit-dt/.44);
          benchPose(p,dt);if(!p.sit){p.bench=null;p.motion.ride=null;p.stage="board";}continue;
        }
        if(p.stage==="wait"||p.stage==="queue"||p.stage==="work"){
          p.motion.step(dt,0,0);
          if(p.stage==="work"&&(p.clock+=dt)>24+p.order*4){
            this.returnToStop(p,env.ground);
          }
          continue;
        }
        if(p.stage==="sitting"||p.stage==="standing"){
          const down=p.stage==="sitting";p.sit=clamp(p.sit+(down?1:-1)*dt/.45,0,1);seatPose(p,b,dt);
          if(down&&p.sit===1){p.stage="ride";if(p===this.player){this.inside=true;this.pan=p.role==="driver"?0:.52;}}
          if(!down&&!p.sit){
            p.motion.ride=null;
            if(p===this.driver){
              const old=p.seat;p.seat=p.nextSeat;setPath(p,"trade",[spot(b,.06,old.z),spot(b,.06,p.seat.z),spot(b,p.seat.x,p.seat.z)]);
            }else this.beginOut(p,env);
          }
          continue;
        }
        const stage=p.stage;
        const walking=stage==="back"||stage==="street";
        const rate=stage==="board"||stage==="alight"||stage==="trade"?2.05:1.42;
        if(!approach(p,dt,walking?rate*(env.walkPace?.(p)??1):rate))continue;
        if(stage==="board"||stage==="trade"){p.stage="sitting";p.sit=0;}
        else if(stage==="street"){p.stage="work";p.clock=0;p.yaw=stops[p.from].yaw+Math.PI/2;}
        else if(stage==="back"){p.stage="wait";p.yaw=stops[p.from].yaw-Math.PI/2;}
        else if(stage==="alight"&&p===this.player){
          Object.assign(env.hero,{x:p.x,y:p.y,z:p.z,yaw:b.yaw+Math.PI/2});env.motion.ride=null;env.motion.reset();
          const punched=p.role==="rider"&&p.ridden>0;
          if(punched){this.memory.rides++;if(!this.memory.stamps.includes(this.stop.id))this.memory.stamps.push(this.stop.id);env.save();}
          if(this.shift){this.shift=null;this.driver.stage="standing";this.driver.nextSeat=driverSeat;}
          this.player=null;this.inside=false;this.dwell=Math.max(this.dwell,1.5);env.left(punched?this.stop:null,p.connection);
        }else if(stage==="alight"){
          if(this.shift){this.shift.delivered++;if(gap(env.hero,p)<12)env.line(p.name,p.thanks);}
          this.sendWork(p,env);
        }
      }
      const player=this.player;if(player)Object.assign(env.hero,{x:player.x,y:player.y,z:player.z,yaw:player.yaw});
    }
    service(env){
      const p=this.player,out=this.people.find(p=>p.stage==="ride"&&p.destination===this.current);
      if(p?.stage==="queue"&&this.driver.stage==="ride"&&!this.people.some(q=>q.stage==="board"||q.stage==="sitting")){
        this.beginBoard(p,env);return;
      }
      if(this.busy())return;
      if(out){out.stage="standing";return;}
      if(this.requested&&p?.role==="rider"&&p.stage==="ride"){this.wantOut(env);this.requested=this.bus.request=false;return;}
      const next=this.people.find(p=>p.stage==="wait"&&p.from===this.current),seat=this.emptySeat();
      if(next&&seat){next.seat=seat;this.beginBoard(next,env);if(this.player)env.line(next.name,next.hello);return;}
      if(this.shift&&this.dockScore!==null&&this.shift.origin!==this.current){
        const w=this.shift,score=this.dockScore,pay=75+Math.round(score*.48)+w.delivered*6;
        this.memory.runs++;this.memory.delivered+=w.delivered;this.memory.best[this.stop.id]=Math.max(score,this.memory.best[this.stop.id]??0);
        w.served++;w.origin=this.current;w.rough=w.delivered=0;this.dockScore=null;env.pay(pay,score,this.stop);
      }
    }
    releaseForBust(){
      this.cancelFlag();this.requested=this.bus.request=false;
      if(!this.player)return;
      const driver=!!this.shift;this.player=null;this.shift=null;this.inside=false;
      if(driver){
        this.driver.motion.ride=null;this.driver.seat=driverSeat;
        const b=this.bus,p=this.driver;setPath(p,"trade",[spot(b,.06,p.seat.z),spot(b,p.seat.x,p.seat.z)]);p.sit=0;
        this.phase="handoff";BayDriving.settle(b);
      }
    }
    resumeRoute(env){
      const b=this.bus,at=track.closest(b),lane=track.sample(at),offset=BayDriving.local(lane,b.x,b.z);
      if(gap(b,lane)<3.6&&Math.abs(turn(b.yaw,lane.yaw))<.75&&Math.abs(offset.z)<.35){
        this.at=at;this.offset=offset.x;this.returning=null;
      }else{this.offset=0;this.returning=env.rejoin(b,this.target);}
      this.passUntil=0;this.phase="close";env.cue("bus-door");
    }
    autoDrive(dt,env){
      const b=this.bus,r=this.returning,remaining=r?r.path.length-r.at:this.nextDistance();
      const sample=d=>r?r.path.sample(Math.min(r.path.length,r.at+d)):track.sample(this.at+d);
      const look=sample(8),sharp=Math.abs(turn(b.yaw,look.yaw));this.scan-=dt;
      if(this.scan<=0){
        this.scan=.13;const traffic=env.gap(b,sample(2.5).yaw,remaining,this);
        this.space=traffic.space;if(traffic.pass)this.passUntil=Math.max(this.passUntil,15);
      }
      const before=b.speed,max=Math.min(13.6,Math.sqrt(6.4*remaining),Math.sqrt(6*this.space),13/(1+sharp*2.2));
      b.speed+=clamp(max-b.speed,-5.2*dt,2.45*dt);const d=Math.min(remaining,this.space,b.speed*dt);
      this.space=Math.max(0,this.space-d);
      this.passUntil=Math.max(0,this.passUntil-d);const offset=this.passUntil>0&&remaining>12?-2.72:0;
      const candidate=sample(d),nextOffset=this.offset+clamp(offset-this.offset,-2.35*dt,2.35*dt);
      const q=world(candidate,nextOffset,0);const oldYaw=b.yaw;
      const yaw=b.yaw+turn(b.yaw,candidate.yaw)*-Math.expm1(-12*dt);
      if(!env.safe(b,q.x,q.z,yaw)){b.speed=b.vx=b.vz=0;this.block+=dt;return;}
      this.block=this.space<1?this.block+dt:0;
      if(r)r.at+=d;else this.at=mod(this.at+d,track.length);this.offset=nextOffset;
      b.vx=(q.x-b.x)/dt;b.vz=(q.z-b.z)/dt;b.x=q.x;b.z=q.z;
      b.yaw=yaw;b.steer=clamp(turn(oldYaw,b.yaw)/dt*.43,-.55,.55);b.wheelSpin+=d/.45;
      b.brake=b.brakes=max<before-.10||remaining<3||this.space<.7?1:0;b.signal=remaining<19?1:sharp>.14?1:0;
      if(remaining-d<.025){
        // A relief handback can start from anywhere a driver pulled up. Finish that trip at a real stop.
        this.returning=null;Object.assign(b,{x:this.target.berth.x,z:this.target.berth.z,yaw:this.target.yaw});this.arrive(env);
      }
    }
    step(dt,env){
      const b=this.bus;b.y=env.ground(b.x,b.z);this.peopleStep(dt,env);
      if(this.phase==="road")this.autoDrive(dt,env);
      else if(this.phase==="manual"){
        const before=b.speed;env.drive(dt,this);this.scan-=dt;
        if(this.scan<=0){this.scan=.18;this.at=track.closest(b);}
        if(before>3&&before-b.speed>Math.max(5*dt,.18))this.shift.rough=Math.min(14,this.shift.rough+dt*3.5);
        b.signal=gap(b,this.target.berth)<22?1:b.steer>.28?1:b.steer<-.28?-1:0;b.brake=b.brakes;
      }else{
        b.speed=b.vx=b.vz=0;b.brake=1;b.signal=1;
        if(this.phase==="open"||this.phase==="handoff"){
          b.door=Math.min(1,b.door+dt/.82);
          if(b.door===1&&this.phase==="open")this.phase="dwell";
          if(b.door===1&&this.phase==="handoff"){
            if(this.player?.stage==="ride"){this.player.stage="standing";this.player.nextSeat=null;}
            if(!this.player&&this.driver.stage==="ride")this.resumeRoute(env);
          }
        }else if(this.phase==="dwell"){
          this.service(env);
          if(this.flag?.s===this.stop){
            this.waitFast=false;
            if(!env.free()||!this.board(env,this.flag.role)){env.line("Marta Leal","Meet me on the sidewalk by the front door.");this.cancelFlag();}
          }
          this.dwell=Math.max(0,this.dwell-dt);
          if(!this.dwell&&!this.shift&&!this.busy()&&!this.pending()){this.phase="close";env.cue("bus-door");}
        }else if(this.phase==="close"){
          b.door=Math.max(0,b.door-dt/.89);
          if(!b.door){
            this.phase=this.driving?"manual":"road";this.dockScore=null;this.scan=0;this.space=Infinity;
            b.signal=-1;
          }
        }
      }
      b.wheel=b.wheelSpin;b.y=env.ground(b.x,b.z);
      if(this.player?.stage==="ride"){seatPose(this.player,b,0);Object.assign(env.hero,{x:this.player.x,y:this.player.y,z:this.player.z,yaw:this.player.yaw});}
    }
  }
  window.BayTransit={Line,read,track,stops,seats,driverSeat,riderSeat,doors,footprint,stopOffset,mounted};
})();
