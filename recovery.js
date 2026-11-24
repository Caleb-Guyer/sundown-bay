/* Portside bodywork, wheel-lift geometry and the people on Della's dispatch board. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),ease=t=>t*t*(3-2*t);
  const zones=["front","rear","left","right"];
  const calls=[
    {id:"iona",name:"Iona Bell",place:"Ocean Drive",kind:"hatch",color:"#a6baa9",x:150.15,z:-91,yaw:0,stand:{x:152.7,z:-90},pay:165,
      fault:{front:.83,right:.27},ask:"That cloud is coming from my hood. Could you get my Riva to Della? The paint in the back is still wet.",
      riding:"I painted the heron on the juice stand. My dad did the lettering underneath it.",thanks:"That hood shuts with one finger again. I’ve got a heron to finish."},
    {id:"rafa",name:"Rafa Soto",place:"Old Palms",kind:"van",color:"#caa46d",x:-77,z:34,yaw:Math.PI,stand:{x:-80.65,z:34.5},pay:190,
      fault:{front:.67,left:.50},ask:"My van’s had a disagreement with a loading dock. The radio on the seat is the only thing in it that still works.",
      riding:"That’s a valve radio in my bag. If its owner asks, the hum is period correct.",thanks:"A straight wing and a quiet fan. Here, the next coffee is mine."},
    {id:"liv",name:"Liv Park",place:"North Boardwalk",kind:"coupe",color:"#9b8caa",x:150.15,z:97,yaw:0,stand:{x:152.6,z:96.1},pay:180,
      fault:{front:.36,rear:.83,right:.31},ask:"Everybody at the rink watched me reverse into that post. Could we get the coupe to Portside before the second session?",
      riding:"These aren't mine. A kid left them on the rail on Saturday. I’m keeping them behind the counter.",thanks:"First song tonight is for Della. She always asks for something fast."}
  ];
  function condition(raw){
    const d={};for(const k of zones)d[k]=Number.isFinite(raw?.[k])?Math.round(clamp(raw[k],0,1)*100)/100:0;
    return d;
  }
  function readBody(raw){
    const result=Object.create(null);
    for(const [id,record] of Object.entries(raw&&typeof raw==="object"?raw:{})){
      if(!/^(coupe|hatch|cab|van|wrecker|cayo|marea|solena|estate|stepside)@-?\d{1,3}\.\d\d,-?\d{1,3}\.\d\d$/.test(id))continue;
      const d=condition(record);if(zones.some(k=>d[k]>0))result[id]=d;
    }
    return result;
  }
  function read(raw){
    const visits={},best={};
    for(const c of calls){
      visits[c.id]=Number.isSafeInteger(raw?.visits?.[c.id])?clamp(raw.visits[c.id],0,99999):0;
      const t=raw?.best?.[c.id];if(Number.isFinite(t)&&t>0&&t<40000)best[c.id]=t;
    }
    return {visits,best};
  }
  function impact(v,dx,dz,speed){
    if(speed<6.0||!Number.isFinite(speed)||!Number.isFinite(v.yaw))return false;
    const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),norm=Math.hypot(dx,dz);if(norm<.01)return false;
    const across=(dx*cs-dz*sn)/norm,along=(dx*sn+dz*cs)/norm;
    const d=v.damage??=condition(),force=clamp((speed-4.2)*.035,.065,.81);let changed=false;
    for(const [zone,f] of [[across<0?"left":"right",Math.abs(across)],[along<0?"rear":"front",Math.abs(along)]]){
      if(f<.31)continue;
      const next=Math.min(1,Math.round(100*(d[zone]+force*f*f))/100);
      if(next>d[zone]){d[zone]=next;changed=true;}
    }
    return changed;
  }
  function worst(v){
    const d=v?.damage;if(!d)return null;
    let chosen="front";for(const k of zones)if(d[k]>d[chosen])chosen=k;
    return d[chosen]>=.055?chosen:null;
  }
  function price(v){
    if(!worst(v))return 0;
    return 5*Math.ceil((12+zones.reduce((n,k)=>n+v.damage[k],0)*34)/5);
  }
  const wheelNames={front:"hood",rear:"rear bumper",left:"left side",right:"right side"};
  const faultText=v=>{const k=worst(v);if(!k)return "Bodywork straight";return v.damage.front>=.72?"Radiator steaming":(v.damage[k]>.5?"Crumpled ":"Dented ")+wheelNames[k];};
  const parked=v=>v&&Math.abs(v.speed)<1.05&&Math.hypot(v.vx,v.vz)<1.05;
  class Lift{
    constructor(truck){
      this.truck=truck;this.state="stowed";this.target=null;this.extension=0;this.lift=1;this.latch=0;this.angle=0;this.time=0;
      truck.towRig=this;
    }
    get busy(){return ["deploy","raising","lowering","fold"].includes(this.state);}
    jaw(){return BayDriving.world(this.truck,0,BayWreckerArt.jaw(this).z);}
    guide(v){
      if(!v)return null;
      const s=bayCarLayout(v.kind),q=BayDriving.world(v,0,s.axles[1]),t=this.truck;
      const loc=BayDriving.local(t,q.x,q.z),x=loc.x,z=loc.z-BayWreckerArt.jaw({extension:1,lift:0}).z,heading=Math.abs(angle(t.yaw,v.yaw));
      return {x,z,range:Math.hypot(x,z),aligned:Math.abs(x)<1.23&&Math.abs(z)<1.72&&heading<.55,heading};
    }
    nearest(cars,canTow,preferred){
      if(preferred&&canTow(preferred)&&gap(this.truck,preferred)<19)return preferred;
      let best=null,range=13;
      for(const v of cars){
        if(!canTow(v)||gap(v,this.truck)>18)continue;
        const g=this.guide(v);if(g.range<range){range=g.range;best=v;}
      }
      return best;
    }
    operate(v){
      if(this.busy||!parked(this.truck))return "";
      this.time=0;
      if(this.state==="stowed"){this.state="deploy";return this.state;}
      if(this.state==="haul"){this.state="lowering";return this.state;}
      if(this.state!=="down")return "";
      if(!v){this.state="fold";return this.state;}
      if(!parked(v)||!this.guide(v).aligned)return "align";
      this.target=v;this.start={x:v.x,z:v.z,yaw:v.yaw};BayDriving.settle(v);
      this.state="raising";v.onLift=true;return this.state;
    }
    // The grounded rear axle rolls toward the moving front pivot. It cuts the corner
    // on a forward turn and swings out when the driver backs up.
    trailerPose(v){
      const s=bayCarLayout(v.kind),jaw=this.jaw(),rear=BayDriving.world(v,0,s.axles[0]);
      const bearing=Math.atan2(jaw.x-rear.x,jaw.z-rear.z);
      const yaw=this.truck.yaw+clamp(angle(this.truck.yaw,bearing),-1.19,1.19);
      const pitch=-Math.atan2(this.lift*.68,s.axles[1]-s.axles[0]);
      const reach=s.axles[1]*Math.cos(pitch);
      return {x:jaw.x-Math.sin(yaw)*reach,z:jaw.z-Math.cos(yaw)*reach,yaw,pitch,lift:-s.axles[0]*Math.sin(-pitch)};
    }
    setPose(v,next,dt){
      const dx=next.x-v.x,dz=next.z-v.z,step=Math.hypot(dx,dz);
      v.vx=dx/dt;v.vz=dz/dt;v.x=next.x;v.z=next.z;v.yaw=next.yaw;v.pitch=next.pitch;v.towLift=next.lift;
      v.speed=(dx*Math.sin(v.yaw)+dz*Math.cos(v.yaw)<0?-1:1)*step/dt;
      v.wheelSpin=(v.wheelSpin+v.speed*dt/bayCarLayout(v.kind).wheel)%(Math.PI*2);
      this.angle=angle(this.truck.yaw,v.yaw);
    }
    step(dt,clear,emit){
      this.time+=dt;
      const v=this.target;
      if(this.state==="haul"){
        const next=this.trailerPose(v);if(!clear(v,next))return false;
        this.setPose(v,next,dt);return true;
      }
      if(!this.busy)return true;
      if(this.state==="deploy"||this.state==="fold"){
        const deploy=this.state==="deploy",u=ease(clamp(this.time/1.15,0,1));
        this.extension=deploy?u:1-u;this.lift=1-this.extension;
        if(u===1)this.state=deploy?"down":"stowed";return true;
      }
      const raising=this.state==="raising",u=clamp(this.time/1.52,0,1),height=raising?u:1-u;
      this.lift=ease(clamp((height-.25)/.75,0,1));this.latch=ease(clamp(height/.36,0,1));
      const next=this.trailerPose(v);
      if(raising){
        const f=ease(clamp(u/.62,0,1));next.x=this.start.x+(next.x-this.start.x)*f;next.z=this.start.z+(next.z-this.start.z)*f;
        next.yaw=this.start.yaw+angle(this.start.yaw,next.yaw)*f;
        if(!clear(v,next)){
          Object.assign(v,this.start);this.release();this.state="down";this.extension=1;this.lift=0;emit("blocked",v);return true;
        }
      }
      this.setPose(v,next,dt);
      if(u===1){
        if(raising){this.state="haul";this.truck.towLoad=true;emit("attached",v);}
        else{this.release();this.state="fold";this.time=0;emit("released",v);}
      }
      return true;
    }
    release(){
      if(this.target){this.target.onLift=false;this.target.towLift=0;BayDriving.settle(this.target);}
      this.truck.towLoad=false;this.target=null;this.start=null;this.angle=this.latch=0;
    }
  }
  function person(id,name,spot,yaw,phase){
    return {id,name,x:spot.x,z:spot.z,y:.08,yaw,phase,motion:new BayPlayerMotion(),path:[],seat:0,ride:null,age:0};
  }
  const yard=()=>BayRecoveryArt.yard;
  function dropReady(v){
    if(!parked(v))return false;
    const d=yard().drop,s=bayCarLayout(v.kind),sn=Math.abs(Math.sin(v.yaw)),cs=Math.abs(Math.cos(v.yaw));
    return Math.abs(v.x-d.x)+cs*s.track+sn*s.halfLength<2.49&&Math.abs(v.z-d.z)+sn*s.track+cs*s.halfLength<7.92;
  }
  class Service{
    constructor(truck,cars,memory){
      this.truck=truck;this.lift=new Lift(truck);this.memory=memory;this.call=null;this.onBench=null;
      this.completed=Object.values(memory.visits).reduce((n,v)=>n+v,0);
      this.della=person("della","Della Moss",yard().della,yard().della.yaw,"bench");
      this.people=calls.map((c,i)=>{
        const v=cars[i],home=memory.visits[c.id]>0;
        v.recoveryOwner=c.id;v.damage=condition(home?null:c.fault);
        return Object.assign(person(c.id,c.name,c.stand,c.yaw-Math.PI/2,home?"home":"waiting"),{car:v,slip:c,cool:home?58+24*i:0});
      });
    }
    board(){return this.people.filter(p=>p.phase==="waiting").sort((a,b)=>this.memory.visits[a.id]-this.memory.visits[b.id]);}
    accept(p){
      if(this.call||this.onBench||!p||p.phase!=="waiting"||this.people.some(w=>w.ride===this.truck))return false;
      p.offCall=false;this.call={p,seconds:0,jolts:0,remark:false};return true;
    }
    offer(p){return this.people.find(w=>w.phase==="waiting"&&gap(w,p)<3.0);}
    held(v){return !!v&&(v===this.truck&&(this.lift.busy||this.people.some(p=>p.ride===v&&["approach","boarding","leaving"].includes(p.phase)))||this.onBench?.car===v);}
    target(playerCar){
      const c=this.call;if(!c)return null;const p=c.p;
      if(this.onBench||["walk","pickup","driving","home"].includes(p.phase))return {...yard().drop,name:"Portside handoff lane"};
      if(playerCar!==this.truck)return {x:this.truck.x,z:this.truck.z,name:"Della’s wrecker"};
      if(p.phase==="waiting"&&gap(p,p.car)>15)return {x:p.x,z:p.z,name:p.name+" · Curbside pickup"};
      return this.lift.target===p.car?{...yard().drop,name:"Portside handoff lane"}:{x:p.car.x,z:p.car.z,name:p.name+" · "+p.slip.place};
    }
    jobText(playerCar){
      const p=this.call?.p;if(!p)return "";
      if(this.onBench)return this.della.phase==="repair"?"Della is straightening the "+(p.car.kind==="van"?"van":"car"):"Give Della room beside the hood";
      if(["walk","pickup"].includes(p.phase))return "Wait for "+p.name.split(" ")[0]+" to take the keys";
      if(playerCar!==this.truck)return "Get in Della’s wrecker";
      if(p.phase==="waiting"&&gap(p,p.car)>15)return "Pick up "+p.name+" at the curb";
      if(this.lift.target===p.car)return dropReady(p.car)?"Lower the car onto the striped lane":gap(p.car,yard().drop)<10?"Straighten the car between Della’s stripes":"Tow "+p.name.split(" ")[0]+" to Portside";
      if(gap(playerCar,p.car)>17)return "Pick up "+p.name+" at "+p.slip.place;
      if(p.phase==="approach"||p.phase==="boarding")return "Let "+p.name.split(" ")[0]+" into the passenger seat";
      return this.lift.state==="stowed"?"Lower the wheel lift":"Back the lift up to the front tires";
    }
    abandon(){
      const p=this.call?.p;if(!p)return;
      this.call=null;if(this.onBench?.p===p||p.fixed||p.phase==="waiting")return;
      p.offCall=true;
      if(p.phase==="approach"){p.ride=null;p.phase="walk";p.path=[];}
    }
    handoff(v,env){
      if(!dropReady(v)||this.onBench||env.heat()||(!worst(v)&&!v.flatSide))return false;
      const p=this.people.find(owner=>owner.car===v)||null;
      if(p&&p!==this.call?.p&&(!p.offCall||p.ride!==this.truck&&gap(p,v)>18))return false;
      const s=bayCarLayout(v.kind);let path=null;
      for(const side of [-1,1]){
        const corner=BayDriving.world(v,side*(s.track+.52),s.axles[1]+.12);
        const way=env.walkway(this.della,corner,v);if(way&&(!path||way.length<path.length))path=way;
      }
      if(!path)return false;
      if(p)p.offCall=false;
      this.onBench={car:v,p,duration:0};this.della.phase="walk";this.della.path=path;
      return true;
    }
    step(dt,env,emit){
      if(this.call)this.call.seconds+=dt;
      for(const p of this.people)this.stepOwner(p,dt,env,emit);
      const tech=this.della,bench=this.onBench;
      if(tech.phase==="walk"||tech.phase==="return"){
        if(BayCarAccess.walkPath(tech,tech.motion,tech.path,dt,env.ground,1.60)){
          tech.phase=bench?"repair":"bench";tech.yaw=bench?Math.atan2(bench.car.x-tech.x,bench.car.z-tech.z):yard().della.yaw;
        }
      }else tech.motion.step(dt,0,0);
      if(tech.phase==="repair"&&bench){
        bench.duration+=dt;
        if(bench.duration>=4.2){
          bench.car.damage=condition();bench.car.flatSide=0;bench.car.flatLoad=0;bench.car.flatAxle=null;
          emit("straightened",bench.car);this.onBench=null;tech.phase="return";tech.path=env.walkway(tech,yard().della,bench.car)||[yard().della];
          if(bench.p){bench.p.fixed=true;if(bench.p.phase==="waiting")this.walkToCar(bench.p);}
        }
      }
    }
    walkToCar(p){p.phase="walk";p.path=[];p.ride=null;p.seat=0;}
    stepOwner(p,dt,env,emit){
      p.age+=dt;const selected=p===this.call?.p,v=this.truck;
      if(p.phase==="home"){
        p.cool-=dt;p.motion.step(dt,0,0);
        if(p.cool<0&&!this.call&&!this.onBench&&env.offscreen(p)){
          p.car.damage=condition(p.slip.fault);p.phase="waiting";p.fixed=false;p.age=0;
        }return;
      }
      if(p.phase==="waiting"){
        p.motion.step(dt,0,0);
        if(selected&&env.driver()===v&&parked(v)&&gap(v,p)<13&&this.lift.state!=="lowering"){
          let path=env.door(v,false,p,1)?.points;
          if(!path&&env.door(v,true,p,1)){
            const curb=BayCarAccess.outside(bayCarLayout(v.kind),1);
            path=env.walkway(p,BayDriving.world(v,curb.x,curb.z),p.car);
          }
          if(path){p.phase="approach";p.path=path;p.ride=v;p.seat=0;}
        }return;
      }
      if(p.phase==="approach"){
        if(BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground)){p.phase="boarding";p.age=0;}return;
      }
      if(p.phase==="boarding"||p.phase==="leaving"){
        const entering=p.phase==="boarding";p.seat=clamp(p.seat+(entering?1:-1)*dt/1.55,0,1);
        BayCarAccess.pose(v,1,p.seat,p,p.motion,env.ground,dt,true);
        if(entering&&p.seat===1){p.phase="passenger";p.age=0;emit("aboard",p);}
        if(!entering&&p.seat===0){p.motion.reset();this.walkToCar(p);}return;
      }
      if(p.phase==="passenger"){
        BayCarAccess.pose(v,1,1,p,p.motion,env.ground,dt,true);
        if(selected&&!this.call.remark&&p.age>10&&Math.abs(v.speed)>5){this.call.remark=true;emit("remark",p);}
        if((this.onBench?.p===p||p.fixed||p.offCall&&this.lift.target!==p.car)&&parked(v)&&env.door(v,true,p,1)){p.phase="leaving";p.age=0;}
        return;
      }
      if(p.phase==="walk"){
        if(p.offCall){
          if(!p.path.length){
            const shore=env.roadside(p,p.car);p.path=env.walkway(p,shore,p.car)||[];
          }
          if(BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground,1.8)){p.phase="waiting";p.offCall=false;}
          return;
        }
        if(!p.fixed){
          if(!p.path.length&&gap(p,yard().della)>.6)p.path=env.walkway(p,yard().della,p.car)||[];
          BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground,1.7);return;
        }
        const plan=env.door(p.car,false,p,-1);
        if(plan){p.phase="pickup";p.path=plan.points;p.seat=0;p.ride=p.car;}
        else{
          if(!p.path.length){
            const approach=BayDriving.world(p.car,-bayCarLayout(p.car.kind).track-1.15,-1);
            p.path=env.walkway(p,approach,p.car)||[];
          }
          BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground,1.72);
        }
        return;
      }
      if(p.phase==="pickup"){
        if(p.path.length){BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground,1.85);return;}
        p.seat=clamp(p.seat+dt/1.5,0,1);BayCarAccess.pose(p.car,-1,p.seat,p,p.motion,env.ground,dt);
        if(p.seat===1){
          if(selected){const call=this.call;this.call=null;this.memory.visits[p.id]++;this.completed++;
            this.memory.best[p.id]=Math.min(this.memory.best[p.id]||Infinity,call.seconds);emit("finished",{p,call});}
          p.phase="driving";p.age=0;env.depart(p);
        }return;
      }
      if(p.phase==="driving"){
        BayCarAccess.pose(p.car,-1,1,p,p.motion,env.ground,dt);
        if(env.returned(p)&&env.door(p.car,true,p,-1)){p.phase="parking";p.seat=1;}
        return;
      }
      if(p.phase==="parking"){
        p.seat=clamp(p.seat-dt/1.50,0,1);BayCarAccess.pose(p.car,-1,p.seat,p,p.motion,env.ground,dt);
        if(!p.seat){p.ride=null;p.motion.reset();p.phase="off";p.path=env.walkway(p,p.slip.stand,p.car)||[p.slip.stand];}return;
      }
      if(p.phase==="off"&&BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground,1.72)){
        p.phase="home";p.cool=115;p.yaw=p.slip.yaw-Math.PI/2;
      }
    }
  }
  window.BayRecovery={calls,condition,readBody,read,impact,worst,faultText,price,parked,dropReady,Lift,Service};
})();
