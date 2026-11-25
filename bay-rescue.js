/* One ambulance works the city whether someone takes the shift or watches it pass. */
(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),limit=(n,a,b)=>Math.max(a,Math.min(b,n));
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),ease=u=>u*u*(3-2*u);
  const lerp=(a,b,u)=>a+(b-a)*u;
  const cases=[
    {id:"dani",name:"Dani Vela",role:"skater",place:"Marlin Motel",x:148.85,z:-14,dir:0,base:135,
      ask:"I told Luz I could clear the last stair. Can somebody take my board? It keeps rolling into traffic.",road:"My brother painted those wheels with a toothbrush. Don't let him hear how I landed.",thanks:"Luz brought the board over. Not a scratch on it. Figures.",item:"skateboard"},
    {id:"tomas",name:"Tomás Ledo",role:"fishmonger",place:"Port Sol fish market",x:-139.05,z:-94,dir:0,base:148,
      ask:"Can you flag Anaïs? My stall's covered. My sister already put a CLOSED sign on the ice.",road:"I've opened that stall every morning since '82. My sister's been waiting all that time for a turn.",thanks:"My sister sold out before lunch. Please don't tell her I said that.",item:"fish crate"},
    {id:"pearl",name:"Pearl Quinn",role:"gardener",place:"Old Palms Flowers",x:-77.10,z:-122,dir:2,base:142,
      ask:"The shop girls called Rescue Four. Sit with me a second? Those little yellow things are for my granddaughter.",road:"Bea keeps saying marigolds won't sell in November. Watch that front window tomorrow.",thanks:"Bea saved a pot of marigolds for the receiving room. Look by the window.",item:"seed tray"}
  ];
  for(const c of cases){
    c.yaw=c.dir*Math.PI/2;c.berth={x:c.x,z:c.z,dir:c.dir,yaw:c.yaw};
    c.wait={...BayDriving.world(c,4.18,-1.85),yaw:c.yaw-Math.PI/2};
    c.pickup={...BayDriving.world(c,2.98,-2.12),yaw:c.yaw};
  }
  function read(raw){
    const count={},best={};for(const c of cases){
      count[c.id]=Number.isSafeInteger(raw?.count?.[c.id])?limit(raw.count[c.id],0,99999):0;
      best[c.id]=Number.isSafeInteger(raw?.best?.[c.id])?limit(raw.best[c.id],0,100):0;
    }
    const slip=raw?.streetSlip;
    const streetSlip=slip&&typeof slip.name==="string"&&typeof slip.place==="string"&&["traffic","shots"].includes(slip.reason)?
      {name:slip.name.slice(0,56),place:slip.place.slice(0,64),reason:slip.reason,assisted:slip.assisted===true}:null;
    return {...(streetSlip?{streetSlip}:{}),count,best,next:Number.isInteger(raw?.next)?limit(raw.next,0,cases.length-1):0,last:cases.some(c=>c.id===raw?.last)?raw.last:null};
  }
  const track=BayCab.track;
  const actor=(role,name,p)=>Object.assign(BayMotorCourt.actor(role,p,"out"),{role,name,y:p.y??.077,action:"idle",seat:0,seatMode:null});
  const waitingSeat={x:-98.65,z:57.72,y:.16,yaw:Math.PI/2};
  const dischargeWalk=[{x:-94.0,z:52.30},{x:-91.65,z:52.31},{x:-91.65,z:57.81},{x:-97.63,z:57.78},waitingSeat];
  const loaded=(v,ground)=>({...BayAmbulanceArt.point(v,-.14,.975,-1.43,ground(v.x,v.z)),yaw:v.yaw});
  function apron(v,ground){const p=BayDriving.world(v,-.14,-4.55);return {...p,y:ground(p.x,p.z)+.94,yaw:v.yaw};}
  const roadside=["ready","release","outbound","scene","rear","sceneRoll","toPatient","transfer","toTruck","loading","board"];
  const instructions={release:"Gil is handing over the driver’s seat",dock:"Park and meet Anaïs at the back",sceneRoll:"Lower the wheels",clinicRoll:"Lower the wheels at receiving",ready:"Sign on or let the regular crew take the call",outbound:"Bring Rescue 4 to the marked curb",scene:"Let the crew open the rear doors",rear:"Roll the stretcher out of the rear doors",toPatient:"Bring the stretcher alongside the patient",transfer:"Help Anaïs settle the patient",toTruck:"Return the stretcher to the rear doors",loading:"Secure the stretcher on its rails",board:"Take the driver’s seat",return:"Bring the patient to Palm County Clinic",clinic:"Meet the crew at the rear doors",clinicRear:"Take the stretcher into receiving",toBed:"Wheel the patient through the open receiving door",handoff:"Stay for the handover",rest:"The unit is back in service"};
  // Search a short corridor around the current route only after a traffic standstill.
  // Work is spread across simulation ticks. Moving cars are checked again at each wheel step.
  function workAround(s,dt,env){
    const v=s.v,l=s.line;
    if(!s.detour&&!s.search&&s.blocked<2.2)return false;
    if(!s.detour&&!s.search){
      if((s.retryIn=(s.retryIn||0)-dt)>0)return false;
      const first={i:0,j:0,cost:0,via:null,x:v.x,z:v.z,yaw:v.yaw,at:s.cursor,offset:s.lateral};
      s.search={start:s.cursor,side:s.lateral,open:[first],best:new Map([["0/0",0]]),seen:0};
    }
    if(s.search){
      const g=s.search;
      for(let k=0;k<4&&g.open.length;k++){
        let best=0;
        for(let n=1;n<g.open.length;n++)if(g.open[n].cost-g.open[n].i<g.open[best].cost-g.open[best].i)best=n;
        const p=g.open.splice(best,1)[0];g.seen++;
        if(p.i>=5&&Math.abs(p.offset)<1.2){
          s.detour=[];for(let a=p;a.via;a=a.via)s.detour.unshift(a);
          s.search=null;break;
        }
        for(const dir of [1,-1])for(const shift of [0,-1,1]){
          const i=p.i+dir,j=p.j+shift,off=g.side+j*1.2,at=g.start+i*2.7;
          if(i< -4||i>8||Math.abs(off)>5.8||at<0||at>=l.length-.4)continue;
          const cost=p.cost+(dir<0?2.5:1)+Math.abs(shift)*.25+Math.abs(off)*.04,key=i+"/"+j;
          if(cost>=(g.best.get(key)??Infinity))continue;
          const mid=l.sample(at),x=mid.x+Math.cos(mid.yaw)*off,z=mid.z-Math.sin(mid.yaw)*off;
          const yaw=mid.yaw+limit(turn(mid.yaw,Math.atan2((x-p.x)*dir,(z-p.z)*dir)),-.36,.36);
          let clear=true;
          for(let u=.25;u<=1;u+=.25)if(!env.carClear(v,{kind:v.kind,x:lerp(p.x,x,u),z:lerp(p.z,z,u),yaw:p.yaw+turn(p.yaw,yaw)*u})){clear=false;break;}
          if(clear){g.best.set(key,cost);g.open.push({i,j,at,offset:off,x,z,yaw,cost,via:p});}
        }
      }
      if(s.search&&(!g.open.length||g.seen>150)){s.search=null;s.retryIn=1.4;}
      if(!s.detour){v.speed=v.vx=v.vz=0;return !!s.search;}
    }
    if(!s.detour)return false;
    const p=s.detour[0],d=gap(v,p),u=Math.min(1,dt*2.8/Math.max(.01,d));
    const q={kind:v.kind,x:lerp(v.x,p.x,u),z:lerp(v.z,p.z,u),yaw:v.yaw+turn(v.yaw,p.yaw)*u};
    if(!env.carClear(v,q)){s.detour=null;s.search=null;s.retryIn=.4;v.speed=v.vx=v.vz=0;return true;}
    v.vx=(q.x-v.x)/dt;v.vz=(q.z-v.z)/dt;v.speed=(p.i<p.via.i?-1:1)*d*u/dt;
    v.reversing=v.speed<0;v.wheelSpin=(v.wheelSpin||0)+v.speed*dt/.382;
    Object.assign(v,q);s.cursor=lerp(s.cursor,p.at,u);s.lateral=lerp(s.lateral,p.offset,u);
    if(u===1){s.detour.shift();if(!s.detour.length){s.detour=null;s.blocked=0;v.reversing=false;}}
    return true;
  }
  function followResponse(service,dt,env){
      const v=service.v,line=service.line,at=service.cursor,left=line.length-at,nearEnd=left<9;
      if(service.call?.source&&workAround(service,dt,env))return;
      const mid=line.sample(at),aim=line.sample(at+Math.min(9,left)),bend=Math.abs(turn(mid.yaw,aim.yaw));
      const closeBay=gap(v,service.site.bay)<25;
      const routine=!v.responseLights&&service.phase==="return"&&env.returningGap;
      if(routine&&(service.gapLine!==line||(service.gapScan-=dt)<=0)){
        service.gapLine=line;service.gapScan=.14;service.gapEnd=at+env.returningGap(v,line,at);
      }
      const space=routine?Math.max(0,service.gapEnd-at):Infinity;
      const cruise=nearEnd?Math.max(.8,left*.94):closeBay?6.2:bend>.45?7.9:routine?10.8:17.8;
      const roadSpeed=Math.min(cruise,Math.sqrt(6.4*space));
      const ahead=line.sample(Math.min(line.length,at+6.6)),warn=env.obstacle(v,ahead,mid.yaw);
      const passing=warn||Math.abs(service.lateral)>.15&&env.obstacle(v,line.sample(at+2.5),mid.yaw);
      const desired=passing&&space>15&&!nearEnd&&!closeBay?-2.67:0;
      const offset=lerp(service.lateral,desired,1-Math.exp(-dt*2.4)),speed=lerp(Math.max(0,v.speed),roadSpeed,1-Math.exp(-dt*1.5));
      const next=Math.min(line.length,at+speed*dt,at+space),q=line.sample(next);
      const pose={kind:v.kind,x:q.x+Math.cos(q.yaw)*offset,z:q.z-Math.sin(q.yaw)*offset,yaw:v.yaw+turn(v.yaw,q.yaw)*(1-Math.exp(-dt*11))};
      if(!env.carClear(v,pose)){
        service.blocked+=dt;v.brakes=1;v.speed=Math.max(0,v.speed-15*dt);v.vx=v.vz=0;
        if(service.phase==="outbound"&&nearEnd&&service.blocked>=(service.nextBerthTry||.72)){
          service.nextBerthTry=service.blocked+.8;
          const alt=service.freeBerth(env);if(alt){service.startDock(true,alt);return;}
        }
        // A yielding driver can be stopped halfway across our lane. Ease sideways on the open road.
        if(space>15&&!nearEnd&&!closeBay){for(const side of [-1,1]){
          const l=service.lateral+side*dt*1.65;if(Math.abs(l)>3.7)continue;
          const p={kind:v.kind,x:mid.x+Math.cos(mid.yaw)*l,z:mid.z-Math.sin(mid.yaw)*l,yaw:v.yaw};
          if(env.carClear(v,p)){service.lateral=l;v.x=p.x;v.z=p.z;break;}
        }}return;
      }
      service.blocked=0;service.nextBerthTry=0;v.vx=(pose.x-v.x)/dt;v.vz=(pose.z-v.z)/dt;v.brakes=space<.3||roadSpeed+1<v.speed?1:0;
      v.wheelSpin=(v.wheelSpin||0)+(next-at)/.382;Object.assign(v,pose,{speed:(next-at)/dt});service.cursor=next;service.lateral=offset;
      if(next>=line.length-.03)service.startDock(service.phase==="outbound");
    }

  function yieldTo(unit,key,v,ux,uz,remaining,offset,time){
      const dx=v.x-unit.x,dz=v.z-unit.z,range=Math.hypot(dx,dz);
      if(unit.responseLights&&range<48&&Math.abs(unit.speed)>1.1){
        const sx=Math.sin(unit.yaw),sz=Math.cos(unit.yaw),along=dx*sx+dz*sz,across=Math.abs(dx*sz-dz*sx),alignment=ux*sx+uz*sz;
        let style=null;
        if(Math.abs(alignment)>.71&&along> -3.7&&across<7&&along<44)style="shoulder";
        else if(Math.abs(alignment)<.5){const cross=-(dx*sz-dz*sx)/(ux*sz-uz*sx),ahead=along+cross*alignment;
          if(cross>5.0&&cross<23&&ahead>1&&ahead<38)style="cross";}
        if(style){v[key]={style,until:time+.75};}
      }
      const y=v[key];if(!y)return null;
      if(!unit.responseLights||y.until<time){v[key]=null;return null;}
      if(y.style==="cross")return {goal:0,max:Math.max(0,Math.min(4.3,(remaining-8)*.95)),cross:true};
      const goal=2.03*limit((remaining-.8)/5,0,1);
      return {goal,max:Math.abs(goal-offset)>.35?3.9:.18,cross:false};
    }
  class Service{
    constructor(v,site,memory){
      this.v=v;this.site=site;this.saved=memory;this.index=memory.next;this.joined=false;this.holding=false;this.phase="ready";this.age=0;this.wait=10;
      this.medic=actor("medic","Anaïs Park",v);this.driver=actor("driver","Gil Navarro",v);this.dispatcher=actor("dispatcher","Cleo Moss",site.dispatcher);
      this.nurse=actor("dispatcher","Ora Bell",site.nurse);this.nurse.y=.16;this.nurse.action="idle";
      const last=cases.find(c=>c.id===memory.last);
      if(last){this.waiting=actor(last.role,last.name,waitingSeat);this.waiting.seatHeight=.51;this.waiting.action="sit";}
      this.cot={...loaded(v,()=>.077),fold:1,occupied:false,travel:0};this.baySeats();this.startCase();
    }
    startCase(call=cases[this.index]){
      this.call=call;this.patient=(!call.source&&this.deferredPerson)||actor(call.role,call.name,call.wait);
      if(!call.source)this.deferredPerson=null;this.patient.action="sit";this.patient.seatHeight=.39;
      this.grade=100;this.previousSpeed=0;this.talked=false;this.cot.patient=this.patient;this.cot.patientRole=this.call.role;this.cot.occupied=false;
      this.cot.fold=1;this.rail=null;this.holding=false;this.rolling=0;this.v.rearOpen=0;this.v.responseLights=false;this.go("ready");
    }
    requestStreet(person,reason,place,berth,palette){
      if(!berth||!person.down||person.down.assigned||this.pendingStreet||this.call.source===person||gap(person,berth)>24)return false;
      const name=person.name||person.curbName||place+" "+(person.role==="runner"?"runner":person.role==="courier"?"courier":"local");
      // Park with the rear doors facing the pickup. The cot stays alongside the patient's body.
      const yaw=berth.yaw,side=BayDriving.local(berth,person.x,person.z).x<0?1:-1;
      const pickup={...BayDriving.world({...person,yaw},side*.65,.40),yaw};
      const call={...berth,berth,wait:{x:person.x,z:person.z,yaw:person.yaw},pickup,id:"street",name,role:"street",
        source:person,palette,style:person.style,place,reason,ask:"I can hear the siren. Would you stay until they get here?",
        road:"The window rattles every time we take a corner. How much farther is the clinic?",
        thanks:reason==="traffic"?"Somebody brought my shoe in. It was still in the road when they closed the doors.":"I remember Gil asking my name. That was the first quiet minute I'd had all night."};
      person.down.assigned=true;this.pendingStreet=call;this.streetAge=0;return true;
    }
    takeStreet(dt,env){
      const next=this.pendingStreet;if(!next)return;
      this.streetAge+=dt;
      if(!next.source.down||this.streetAge>150){if(next.source.down)next.source.down.assigned=false;this.pendingStreet=null;return;}
      if(this.joined||this.manual||this.reclaim||this.queued)return;
      let from=null,lead=null;
      if(this.phase==="outbound"&&!this.call.source&&gap(this.v,this.call)>22){
        // Keep the unit on the current lane until a straight section allows a new route.
        const q=this.line.sample(this.cursor+3),dir=(Math.round(q.yaw/(Math.PI/2))+4)%4;
        if(!env.street(this.v)||Math.abs(turn(q.yaw,dir*Math.PI/2))>.20||gap(q,this.v)<1)return;
        from={...q,dir};lead={x:this.v.x,z:this.v.z};
      }else if(this.phase!=="rest"&&this.phase!=="ready")return;
      if(!this.call.source&&this.phase!=="rest")this.deferredPerson=this.patient;
      this.pendingStreet=null;this.startCase(next);this.patient.palette=next.palette;this.patient.style=next.style;
      this.patient.careThanks=next.thanks;this.patient.source=next.source;this.patient.seatHeight=.03;
      this.dispatch(true);
      if(from)this.line=track([lead,...BayCab.route(from,next.berth).pts]);
    }
    baySeats(){this.seat(this.medic,"right");this.seat(this.driver,"left");}
    seat(a,side){a.seatMode=side;a.seat=1;a.path=[];a.action="ride";a.door=null;}
    go(phase){this.phase=phase;this.age=0;this.cartPath=null;}
    get traveling(){return this.phase==="outbound"||this.phase==="return";}
    get goal(){return this.phase==="outbound"?this.call.berth:this.site.bay;}
    get pushing(){return ["toPatient","toTruck","toBed"].includes(this.phase);}
    get atScene(){return roadside.includes(this.phase)||this.phase==="dock"&&this.dock.out;}
    get bodyVisible(){if(this.call.source&&this.atScene&&this.phase!=="transfer")return false;return !this.cot.occupied&&(this.atScene||this.phase==="handoff");}
    get progress(){return this.phase==="transfer"?limit(this.age/2,0,1):this.phase==="handoff"?1-limit(this.age/2.3,0,1):0;}
    get instruction(){return instructions[this.phase];}
    guide(){
      if(!this.line||!this.manual||!this.traveling)return null;
      const v=this.v,l=this.line,q=l.closest(v);if(q.gap>17)return null;
      const rem=l.length-q.at,start=l.sample(q.at+3),points=[v],home=this.phase==="return";
      let cue="";
      for(let d=4;d<rem;d+=5){
        const p=l.sample(q.at+d);points.push(p);const diff=turn(start.yaw,p.yaw);
        if(!cue&&Math.abs(diff)>.76)cue=(diff>0?"Right":"Left")+" onto "+BayStreetNames.through(p,p.yaw)+" in "+Math.round(d)+" m";
      }
      points.push(this.goal);
      return {points,meters:rem,turn:rem<28?(home?"North driveway · Park facing south":"Pull in beside "+this.call.name):cue||"Continue to "+(home?this.site.name:this.call.place)};
    }
    aisle(){
      const s=this.site;
      return {entry:s.toBay,exit:s.fromBay};
    }
    route(out){
      const a=this.aisle(),entry=a.entry,exit=a.exit,curb=out?this.call.berth:{x:this.v.x,z:this.v.z,dir:this.call.dir};
      const start={...exit.at(-1),dir:2},end={...entry[0],dir:2};
      return track(out?[this.v,...exit,...BayCab.route(start,curb).pts]:[this.v,...BayCab.route(curb,end).pts,...entry]);
    }
    dispatch(out,manual=false){
      this.detour=this.search=null;this.retryIn=0;this.v.reversing=false;
      this.line=this.route(out);this.cursor=0;this.lateral=0;this.blocked=0;this.manual=manual;this.v.responseLights=true;this.previousSpeed=0;this.go(out?"outbound":"return");
      if(manual){this.lastRoad=null;this.trace=[{x:this.v.x,z:this.v.z}];}
    }
    recruit(atDesk){
      if(this.joined||!(atDesk?this.phase==="ready"||this.phase==="rest":["ready","outbound","scene","rear","sceneRoll","toPatient"].includes(this.phase)))return false;
      if(this.phase==="rest"){if(!this.call.source)this.index=(this.index+1)%cases.length;this.startCase();}
      this.joined=true;
      if(this.phase==="ready"&&atDesk){this.manual=true;this.go("release");}
      else if(this.phase==="ready")this.dispatch(true);
      return true;
    }
    leave(){
      this.joined=false;this.holding=false;this.rolling=0;
      if(this.manual){this.reclaim=true;this.v.responseLights=false;}
    }
    stop(){BayDriving.settle(this.v);this.v.brakes=1;}
    access(){return this.joined&&((this.traveling&&this.manual)||this.phase==="board");}
    canPark(){
      if(!this.traveling||!this.manual||Math.abs(this.v.speed)>=1.65||Math.abs(turn(this.v.yaw,this.goal.yaw))>=1.02)return false;
      if(this.phase==="return")return gap(this.v,this.goal)<6;
      const q=BayDriving.local(this.goal,this.v.x,this.v.z);return Math.abs(q.x)<4.5&&Math.abs(q.z)<9.5;
    }
    park(env){
      if(!this.canPark())return false;
      const out=this.phase==="outbound",end=out?this.freeBerth(env):this.goal;
      if(!end)return false;this.startDock(out,end);return true;
    }
    freeBerth(env){
      const c=this.call.berth,v=this.v;
      let best=null,score=Infinity,alternate=null,alternateScore=Infinity;
      for(const side of [0,-1.45,-2,-2.7,1.2])for(const offset of [0,2.4,3.5,4.3,6.6,-3.3,-6.6,9.6,-9.6]){
        const p={...BayDriving.world(c,side,offset),kind:v.kind,yaw:c.yaw};
        if(gap(v,p)>10.8)continue;
        const rear=BayDriving.world(p,-.14,-4.55),pickup=this.call.pickup;
        const value=gap(rear,pickup)+Math.abs(side)*.28;
        if(value>=score||![.25,.5,.75,1].every(u=>env.carClear(v,{kind:v.kind,x:lerp(v.x,p.x,u),z:lerp(v.z,p.z,u),yaw:v.yaw+turn(v.yaw,c.yaw)*u})))continue;
        if(env.cartLane&&!env.cartLane(v,rear,pickup)){if(value<alternateScore){alternate=p;alternateScore=value;}continue;}
        score=value;best=p;
      }
      return best||alternate;
    }
    startDock(out,end=out?this.call.berth:this.site.bay){
      this.dock={out,start:{x:this.v.x,z:this.v.z,yaw:this.v.yaw},end};
      this.stop();this.v.responseLights=false;this.go("dock");
    }
    walk(a,dest,dt,env,speed=2.3){
      if(gap(a,dest)<.07){a.motion.step(dt,0,0);return true;}
      a.action="walk";return BayCarAccess.walkPath(a,a.motion,[dest],dt,env.ground,speed);
    }
    doorPoint(side){const q=BayCarAccess.outside(bayCarLayout(this.v.kind),side);return BayDriving.world(this.v,q.x,q.z);}
    door(a,side,inside,dt,env){
      if(!a.door){a.door={side,inside,feet:this.doorPoint(side),p:inside?0:1};if(!inside)a.seatMode=null;}
      const d=a.door;
      if(inside&&d.p===0&&!this.walk(a,d.feet,dt,env))return false;
      d.p=limit(d.p+(inside?dt:-dt)/1.3,0,1);a.action="door";
      BayCarAccess.pose(this.v,side,d.p,a,a.motion,env.ground,dt,side===1);
      if(d.p!==(inside?1:0))return false;
      a.door=null;if(inside)this.seat(a,side===1?"right":"left");else{a.seatMode=null;a.action="idle";a.motion.reset();}
      return true;
    }
    placeSeats(dt,env){
      const v=this.v,g=env.ground(v.x,v.z);
      for(const a of [this.driver,this.medic]){
        if(!a.seatMode||a.door)continue;
        const rear=a.seatMode==="back",s=bayCarLayout(v.kind),x=rear?.68:a.seatMode==="left"?-s.seatX:s.seatX,z=rear?-1.23:s.seatZ;
        Object.assign(a,BayDriving.world(v,x,z),{y:g+.008,yaw:v.yaw+(rear?-Math.PI/2:0)});
        const r=a.motion.ride||(a.motion.ride={handle:[0,.98,.15]});
        Object.assign(r,{side:a.seatMode==="left"?-1:1,seat:1,seatY:rear?.88:s.seatY,floor:s.floorY,steer:v.steer||0,inner:1,outer:1,duck:0,latchDip:0,reach:0,pull:0,passenger:a.seatMode!=="left"});a.motion.step(dt,0,0);a.action="ride";
      }
    }
    driveAI(dt,env){followResponse(this,dt,env);}
    getPatientSide(){return {...this.call.pickup};}
    cotGoal(env){return this.phase==="toPatient"?this.getPatientSide():this.phase==="toTruck"?apron(this.v,env.ground):this.site.bed;}
    latch(env){return BayRescueCrew.handler(this.cot,"foot",env.ground(this.cot.x,this.cot.z));}
    canRoll(env){return gap(env.hero,this.latch(env))<2.55;}
    putCot(q,dt,env){
      const a=this.cot,dist=gap(a,q);a.travel+=dist;a.wheelSpin=a.travel/.073;
      a.x=q.x;a.z=q.z;a.yaw=q.yaw;a.y=env.ground(q.x,q.z)+.94;a.speed=dist/Math.max(dt,.001);
      if(this.holding){const h=env.hero,f=this.latch(env),old=h.yaw;Object.assign(h,f);h.y=env.ground(h.x,h.z);env.motion.step(dt,dist,turn(old,h.yaw)/dt);}
    }
    push(dt,env){
      const a=this.cot,dest=this.cotGoal(env);
      if(!this.joined){
        const h=this.latch(env);if(gap(this.medic,h)>.42){this.walk(this.medic,h,dt,env);return;}
        if(!this.cartPath){
          const start=BayDriving.local(this.v,a.x,a.z),end=BayDriving.local(this.v,dest.x,dest.z);
          const corner=BayDriving.world(this.v,2.95,-4.56);
          const round=this.phase!=="toBed"&&(start.z> -3.7&&end.z< -3.7||end.z> -3.7&&start.z< -3.7);
          this.cartPath=round?[corner,dest]:[dest];
        }
        const target=this.cartPath[0],d=gap(a,target);
        if(d<.14){this.cartPath.shift();if(!this.cartPath.length)this.deliver(env);return;}
        const ang=Math.atan2(target.x-a.x,target.z-a.z),step=Math.min(d,dt*1.85);
        this.putCot({x:a.x+Math.sin(ang)*step,z:a.z+Math.cos(ang)*step,yaw:a.yaw+turn(a.yaw,ang)*Math.min(1,dt*3)},dt,env);
      }else if(this.holding){
        const drive=env.axis("w"),steer=env.axis("d");
        this.rolling=lerp(this.rolling,drive*(drive<0?1.46:2.58),1-Math.exp(-dt*7));
        const yaw=a.yaw+steer*dt*(1.92-Math.min(.55,Math.abs(this.rolling)*.19));
        const q={x:a.x+Math.sin(yaw)*dt*this.rolling,z:a.z+Math.cos(yaw)*dt*this.rolling,yaw};
        const h=BayRescueCrew.handler({...a,...q},"foot",0);
        const clear=[h,q,BayDriving.world(q,0,.85),BayDriving.world(q,0,-.83)].every(p=>env.cotClear(p.x,p.z,this.v));
        if(clear)this.putCot(q,dt,env);else{this.rolling=0;env.motion.step(dt,0,0);}
      }
      const aSide=this.joined?"side":"foot",handler=BayRescueCrew.handler(a,aSide,env.ground(a.x,a.z));
      if(this.walk(this.medic,handler,dt,env,3.7)||gap(this.medic,handler)<.38){Object.assign(this.medic,handler);this.medic.action=this.joined?"side":"push";}
    }
    deliver(env){
      const a=this.cot,dest=this.cotGoal(env);if(gap(a,dest)>(this.phase==="toTruck"?2.35:1.95))return false;
      const from={x:a.x,z:a.z,y:a.y,yaw:a.yaw};this.holding=false;this.rolling=0;
      this.snap={from,to:{...dest,y:env.ground(dest.x,dest.z)+.94}};env.motion.handTarget=null;
      if(this.phase==="toTruck"){this.beginRail(true,env);return true;}
      if(this.phase==="toPatient"){if(this.call.source?.down)this.call.source.down.inCare=true;this.go("transfer");this.patient.action="transfer";}
      else{
        this.go("handoff");this.cot.occupied=false;this.releaseStreet(this.recovering);this.recovering=null;
        Object.assign(this.patient,this.site.cot,{y:env.ground(this.site.cot.x,this.site.cot.z)});this.patient.seatHeight=this.site.cot.y-this.patient.y;this.patient.action="transfer";
      }return true;
    }
    beginRail(inside,env){
      const a=this.cot;this.rail={inside,from:{x:a.x,y:a.y,z:a.z,yaw:a.yaw},to:inside?loaded(this.v,env.ground):apron(this.v,env.ground)};
      this.holding=false;this.rolling=0;this.go(inside?"loading":this.phase==="clinicRear"?"clinicRoll":"sceneRoll");
    }
    slide(from,to,u){
      const a=this.cot;for(const k of ["x","z","y"])if(Number.isFinite(to[k]))a[k]=lerp(from[k],to[k],u);
      a.yaw=from.yaw+turn(from.yaw,to.yaw)*u;
    }
    action(env){
      if(this.phase==="ready")return false;
      if(this.traveling&&env.driving())return this.park(env);
      if(env.driving()||env.transition())return false;
      if((this.phase==="rear"||this.phase==="clinicRear")&&gap(env.hero,apron(this.v,env.ground))<3){
        this.beginRail(false,env);return true;
      }
      if(this.pushing){
        if(this.holding){if(!this.deliver(env)){this.holding=false;this.rolling=0;env.motion.handTarget=null;}return true;}
        if(this.canRoll(env)){this.holding=true;this.putCot(this.cot,1/60,env);return true;}
      }return false;
    }
    target(env){
      if(this.traveling)return this.manual?(env.driving()?{...this.goal,name:this.phase==="outbound"?this.call.place+" · patient curb":"Palm County Clinic · ambulance bay"}:{...this.doorPoint(-1),name:"Rescue 4 · driver's door"}):{...this.call.wait,name:this.call.name+" · "+this.call.place};
      if(this.phase==="release"||this.phase==="board")return {...this.doorPoint(-1),name:"Rescue 4 · driver’s door"};
      if(this.pushing){const q=this.holding?this.cotGoal(env):this.latch(env);return {...q,name:this.holding?(this.phase==="toPatient"?this.call.name:this.phase==="toTruck"?"Rear loading rails":"Receiving bed"):"Stretcher handles"};}
      return {...(["handoff","rest"].includes(this.phase)?this.site.bed:apron(this.v,env.ground)),name:this.phase==="handoff"?"Receiving room":"Rescue 4 · rear step"};
    }
    finished(env){
      const c=this.call;this.patient.action="sit";this.recovering=this.patient;
      this.discharge=0;
      const participated=this.joined;
      if(c.source){
        this.saved.streetSlip={name:c.name,place:c.place,reason:c.reason,assisted:participated};
        env.admitted(c,participated);
      }else if(participated){
        const grade=Math.round(this.grade),pay=c.base+Math.round(grade*.55);
        this.saved.count[c.id]=Math.min(99999,this.saved.count[c.id]+1);this.saved.best[c.id]=Math.max(this.saved.best[c.id],grade);
        this.saved.last=c.id;this.saved.next=(this.index+1)%cases.length;env.paid(c,pay,grade);
      }
      this.joined=this.manual=this.holding=false;this.wait=34;this.v.responseLights=false;this.go("resetCot");
    }
    followRear(a,dt,env){
      const v=this.v,side=a===this.driver?-1:1,local=BayDriving.local(v,a.x,a.z);
      const next=local.z> -3.5?BayDriving.world(v,side*1.65,-3.65):apron(v,env.ground);
      return this.walk(a,next,dt,env)&&local.z<=-3.5;
    }
    rearSeat(a,inside,dt,env){
      const v=this.v,local=BayDriving.local(v,a.x,a.z);
      if(inside&&!a.boardTime){
        if(local.z> -3.5){this.followRear(a,dt,env);return false;}
        if(!this.walk(a,BayDriving.world(v,.67,-4.24),dt,env))return false;
      }
      if(!a.boardTime){
        a.boardTime={u:inside?0:1};a.seatMode=null;a.motion.reset();
      }
      const t=a.boardTime;t.u=limit(t.u+(inside?dt:-dt)/1.23,0,1);
      const u=ease(t.u),p=BayDriving.world(v,.67,lerp(-4.24,-1.23,u)),ground=env.ground(v.x,v.z);
      Object.assign(a,p,{y:ground+.71*ease(limit(t.u*1.6,0,1))-.71*ease(limit((t.u-.59)/.41,0,1)),yaw:v.yaw-t.u*Math.PI/2});
      a.action="walk";a.motion.step(dt,dt*1.8,0);
      if(t.u!==(inside?1:0))return false;
      a.boardTime=null;if(inside)this.seat(a,"back");return true;
    }
    boardCrew(dt,env){
      const v=this.v;
      if(!this.medic.seatMode){
        const loc=BayDriving.local(v,this.medic.x,this.medic.z);
        if(loc.z< -2.9&&loc.x<1.33){this.walk(this.medic,BayDriving.world(v,1.64,-3.4),dt,env);return false;}
        if(!this.door(this.medic,1,true,dt,env))return false;
      }
      if(this.joined){
        if(this.driver.seatMode==="back")return true;
        return this.rearSeat(this.driver,true,dt,env);
      }else{
        if(this.driver.seatMode==="left")return true;
        const loc=BayDriving.local(v,this.driver.x,this.driver.z);
        if(loc.z< -2.91&&loc.x> -1.33){this.walk(this.driver,BayDriving.world(v,-1.62,-3.45),dt,env);return false;}
        return this.door(this.driver,-1,true,dt,env);
      }return false;
    }
    step(dt,env){
      this.takeStreet(dt,env);
      this.age+=dt;const v=this.v,a=this.cot,p=this.phase;this.placeSeats(dt,env);
      if(a.fold===1&&!this.rail)Object.assign(a,loaded(v,env.ground));
      if(this.recovering)this.dischargePatient(dt,env);
      this.dispatcher.action="desk";this.dispatcher.motion.step(dt,0,0);
      if(this.reclaim){
        if(env.driving()||env.transition())return;
        this.reclaim=false;
        if(this.traveling&&this.manual){
          this.stop();this.manual=false;
          const end=this.goal,atRoad=env.street(v),road=atRoad||this.lastRoad,back=atRoad?[]:[...(this.trace||[])].reverse();
          if(road){
            const dest=this.phase==="outbound"?end:{...this.aisle().entry[0],dir:2};
            this.line=track([v,...back,...BayCab.route(road,dest).pts,...(this.phase==="return"?this.aisle().entry:[])]);
          }else this.line=track([v,...back,...this.line.pts]);
          this.cursor=0;this.lateral=0;
          this.resuming=this.phase;this.go("reclaim");
        }
      }
      if(p==="ready"){if(this.age>=this.wait)this.dispatch(true);return;}
      if(p==="release"||p==="reclaim"){
        if(p==="release"){
          if(this.driver.seatMode==="left"||this.driver.door){if(!this.door(this.driver,-1,false,dt,env))return;}
          v.rearOpen=Math.min(1,v.rearOpen+dt*1.4);
          if(this.driver.seatMode!=="back"&&!this.rearSeat(this.driver,true,dt,env))return;
          this.go("pullOut");return;
        }
        if(this.driver.seatMode==="back"||this.driver.boardTime){
          v.rearOpen=Math.min(1,v.rearOpen+dt*1.4);if(v.rearOpen<1||!this.rearSeat(this.driver,false,dt,env))return;
        }
        if(this.boardCrew(dt,env)){v.rearOpen=Math.max(0,v.rearOpen-dt*1.4);if(!v.rearOpen){v.responseLights=true;this.go(this.resuming);}}return;
      }
      if(p==="pullOut"){v.rearOpen=Math.max(0,v.rearOpen-dt*1.4);if(!v.rearOpen){
        this.dispatch(true,this.joined);
        if(!this.joined&&this.driver.seatMode==="back"){this.resuming="outbound";this.go("reclaim");}
      }return;}
      if(this.traveling){
        if(this.manual){
          if(!env.driving())return;
          if(gap(v,this.trace.at(-1))>2.4){const road=env.street(v);if(road){this.lastRoad=road;this.trace.length=0;}
            this.trace.push({x:v.x,z:v.z});}
          if(p==="return"){
            const speed=Math.abs(v.speed),hard=Math.max(0,(this.previousSpeed-speed)/dt-10.5);
            const corner=Math.max(0,Math.abs(v.yawRate||0)*speed-6.8);
            this.grade=limit(this.grade-(hard*.29+corner*.65)*dt,0,100);this.previousSpeed=speed;
            if(!this.talked&&speed>7){this.talked=true;env.say(this.call.name,this.call.road);}
          }
        }else this.driveAI(dt,env);return;
      }
      if(p==="dock"){
        const {start,end,out}=this.dock,u=ease(limit(this.age/1.25,0,1)),pose={kind:v.kind,x:lerp(start.x,end.x,u),z:lerp(start.z,end.z,u),yaw:start.yaw+turn(start.yaw,end.yaw)*u};
        if(env.carClear(v,pose))Object.assign(v,pose);
        if(u===1){this.manual=false;this.go(out?"scene":"clinic");}return;
      }
      if(p==="scene"||p==="clinic"){
        const atHome=p==="clinic";
        if(this.medic.seatMode||this.medic.door){if(!this.door(this.medic,1,false,dt,env))return;}
        if(this.driver.seatMode==="left"||this.driver.door){if(!this.door(this.driver,-1,false,dt,env))return;}
        if(this.driver.seatMode==="back"||this.driver.boardTime){
          v.rearOpen=Math.min(1,v.rearOpen+dt*1.4);if(v.rearOpen<1||!this.rearSeat(this.driver,false,dt,env))return;
        }
        const hold=BayDriving.world(v,-1.64,-3.42);
        if(gap(this.driver,hold)>.16)this.walk(this.driver,hold,dt,env);else this.driver.action="idle";
        if(!this.followRear(this.medic,dt,env))return;
        v.rearOpen=Math.min(1,v.rearOpen+dt*1.4);
        if(v.rearOpen>=1){this.go(atHome?"clinicRear":"rear");if(this.joined)env.say("Anaïs Park",atHome?"Receiving’s through that wide door. Take the foot end, I’ve got the rail.":"Come round the back. Take the foot end when we get the wheels down.");}return;
      }
      if(p==="rear"||p==="clinicRear"){if(!this.joined&&this.age>.9)this.beginRail(false,env);return;}
      if(p==="sceneRoll"||p==="clinicRoll"||p==="loading"){
        const r=this.rail,u=limit(this.age/1.85,0,1);this.slide(r.from,r.to,ease(u));
        a.fold=r.inside?ease(limit((u-.18)/.73,0,1)):1-ease(limit((u-.10)/.71,0,1));
        const m=this.medic,h=BayRescueCrew.handler(a,"foot",env.ground(a.x,a.z)),at=BayDriving.local(v,h.x,h.z);
        const cap=BayDriving.world(v,0,-3.28),canReach=at.z< -2.98;
        this.walk(m,canReach?h:cap,dt,env,3.8);
        if(canReach&&gap(m,h)<.33){Object.assign(m,h);m.action="push";}else if(!canReach)m.action="idle";
        if(u===1){this.rail=null;if(p==="loading"){this.go("board");}
          else{this.go(p==="sceneRoll"?"toPatient":"toBed");if(this.joined&&gap(env.hero,this.latch(env))<3){this.holding=true;this.putCot(a,dt,env);}}}return;
      }
      if(this.pushing){this.push(dt,env);return;}
      if(p==="transfer"||p==="handoff"){
        this.slide(this.snap.from,this.snap.to,ease(limit(this.age/.7,0,1)));this.patient.action="transfer";
        const side=BayRescueCrew.handler(a,"side",env.ground(a.x,a.z));
        if(this.walk(this.medic,side,dt,env)||gap(this.medic,side)<.26){Object.assign(this.medic,side);this.medic.action="check";}
        if(p==="handoff"){this.nurse.yaw+=turn(this.nurse.yaw,Math.atan2(a.x-this.nurse.x,a.z-this.nurse.z))*Math.min(1,dt*3);this.nurse.action="check";}
        if(this.age>=(p==="transfer"?2:2.3)){
          if(p==="transfer"){a.occupied=true;this.go("toTruck");if(this.joined){env.say("Anaïs Park","Turn the handles back toward the ambulance. Gil's got the doors.");}}
          else{this.nurse.action="idle";this.finished(env);}
        }return;
      }
      if(p==="board"){
        if(!this.boardCrew(dt,env))return;
        v.rearOpen=Math.max(0,v.rearOpen-dt*1.45);if(v.rearOpen>0)return;
        this.dispatch(false,this.joined);return;
      }
      if(p==="resetCot"){
        const dest=apron(v,env.ground),d=gap(a,dest),u=Math.min(1,dt*1.65/Math.max(.001,d));
        this.putCot({x:lerp(a.x,dest.x,u),z:lerp(a.z,dest.z,u),yaw:a.yaw+turn(a.yaw,v.yaw)*dt*2.5},dt,env);
        Object.assign(this.medic,BayRescueCrew.handler(a,"foot",env.ground(a.x,a.z)));this.medic.action="push";
        if(d<.12){this.rail={from:{...a},to:loaded(v,env.ground)};this.go("stow");}return;
      }
      if(p==="stow"){const u=limit(this.age/1.55,0,1);this.slide(this.rail.from,this.rail.to,ease(u));a.fold=ease(u);
        if(u===1){this.rail=null;this.go("close");}return;}
      if(p==="close"){if(this.boardCrew(dt,env)){v.rearOpen=Math.max(0,v.rearOpen-dt*1.4);if(v.rearOpen===0)this.go("rest");}return;}
      if(p==="rest"&&this.age>this.wait){if(!this.call.source)this.index=(this.index+1)%cases.length;this.startCase();this.wait=4;}
    }
    releaseStreet(a){
      if(a?.source?.down){a.source.down=null;a.source.wait=1;a.source.moving=false;}
    }
    dischargePatient(dt,env){
      const a=this.recovering;this.discharge+=dt;
      if(this.discharge<27){a.motion.step(dt,0,0);return;}
      if(this.discharge<28.2){a.action="rise";a.progress=(this.discharge-27)/1.2;return;}
      if(!a.dischargePath)a.dischargePath=dischargeWalk.slice();
      const stop=a.dischargePath[0];if(!this.walk(a,stop,dt,env,1.2))return;
      a.dischargePath.shift();if(a.dischargePath.length)return;
      Object.assign(a,waitingSeat,{seatHeight:.51,action:"sit"});this.releaseStreet(this.waiting);this.waiting=a;this.recovering=null;
    }
    map(c,opt,px,py,s,visible,t){
      const v=this.v,isStreet=opt.mode==="street",cot=this.cot;
      if(!isStreet){
        if(visible(px(v.x),py(v.z),11))BayAmbulanceArt.map(c,opt,px,py,s,v,t);
        if(!this.joined&&(this.bodyVisible||this.call.source)&&this.atScene&&visible(px(this.patient.x),py(this.patient.z),10)){
          const x=px(this.patient.x),y=py(this.patient.z);c.save();c.fillStyle="#3c6966";c.strokeStyle="#ead9b6";c.lineWidth=1.1;
          c.beginPath();c.arc(x,y,4.2,0,Math.PI*2);c.fill();c.stroke();c.fillStyle="#f2dfac";c.fillRect(x-.7,y-2.5,1.4,2.8);c.fillRect(x-.7,y+1,1.4,1.2);c.restore();
        }return;
      }
      if((cot.fold<.995||v.rearOpen>.01)&&visible(px(cot.x),py(cot.z),5*s))BayRescueCrew.cotMap(c,opt,px,py,s,cot,t);
      const actors=[this.dispatcher,this.nurse,this.medic,this.driver];if(this.deferredPerson)actors.push(this.deferredPerson);
      if(this.bodyVisible)actors.push(this.patient);
      if(this.recovering&&(!this.bodyVisible||this.recovering!==this.patient))actors.push(this.recovering);
      if(this.waiting&&!actors.includes(this.waiting))actors.push(this.waiting);
      for(const a of actors)if(!a.seatMode&&!BayPalmClinic.occludesActor(a,opt.player)&&visible(px(a.x),py(a.z),3*s))BayRescueCrew.personMap(c,opt,px,py,s,a,t,a.role,a.action,cot,a.action==="transfer"?this.progress:a.progress||0);
      if(this.holding)BayRescueCrew.personMap(c,opt,px,py,s,opt.player,t,"player","push",cot);
    }
    yielding(v,ux,uz,remaining,offset,time){return yieldTo(this.v,"rescueYield",v,ux,uz,remaining,offset,time);}
  }
  window.BayRescue={Service,followResponse,yieldTo,read,cases,apron,track,instructions};
})();
