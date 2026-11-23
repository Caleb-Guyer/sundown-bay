(() => {
  "use strict";
  const art=BayCoastWheelArt,places=BayBoardwalkArt.places;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=v=>Math.max(0,Math.min(1,v));
  const soften=t=>t*t*(3-2*t),tau=Math.PI*2;
  const ramp={x:172.31,z:112.5},turnstile={x:176.92,z:112.5},landing={x:179.52,z:112.5};
  const marks=[[173.77,108.65],[174.72,109.44],[175.72,109.84],[176.72,110.19]];
  const names=["Miri Ward","Len Ward","Fay Ellis","Vic Cruz"];
  const rail=[[168.5,110.3],[169.4,110.7],[168.6,118.6],[170.1,120.7]];
  const at=p=>({x:p[0],z:p[1]});
  function read(v){
    const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1e7):0;
    const best={};for(const k of ["Northbound","Southbound"])if(Number.isFinite(v?.best?.[k])&&v.best[k]>0)best[k]=v.best[k];
    return {rides:count(v?.rides),runs:count(v?.runs),passes:count(v?.passes),best};
  }
  class Wheel{
    constructor(){
      this.angle=0;this.stops=0;this.age=.50;this.loading=0;this.gateOpen=1;this.stopped=true;
      this.seats=Array.from({length:8},()=>[null,null,null]);
    }
    step(dt,hold){
      this.age+=dt;
      if(this.stopped){
        if(hold)this.age=Math.min(this.age,2.40);
        this.gateOpen=Math.min(1,clamp(this.age/.43+.03),clamp((3.05-this.age)/.65));
        if(this.age>=3.05){this.stopped=false;this.age=0;this.gateOpen=0;}
      }else{
        const u=clamp(this.age/3.35);this.angle=(this.stops+soften(u))*tau/8;
        if(u===1){this.stops++;this.loading=(8-this.stops%8)%8;this.stopped=true;this.age=0;}
      }
    }
    get open(){return this.stopped&&this.gateOpen>.79;}
  }
  function foot(p,points,speed,dt,ground){
    const q=points[0];if(!q)return true;
    const dx=q.x-p.x,dz=q.z-p.z,l=Math.hypot(dx,dz),step=Math.min(l,dt*speed);
    if(l>.001){
      p.x+=dx/l*step;p.z+=dz/l*step;
      const yaw=Math.atan2(dx,dz);p.yaw+=Math.atan2(Math.sin(yaw-p.yaw),Math.cos(yaw-p.yaw))*-Math.expm1(-13*dt);
    }
    p.y=q.deck?1.32:ground(p.x,p.z);p.motion.ride=null;p.motion.step(dt,step,0);
    if(l-step<=.015)points.shift();
    return !points.length;
  }
  function sit(p,s,u,dt){
    p.y=s.y;p.yaw=s.yaw;
    p.motion.ride={seat:u,side:-1,seatY:.47,floor:0,steer:0,passenger:true,latchDip:0,duck:0,inner:u,outer:u,reach:0,pull:0,handle:[0,0,0]};
    p.motion.step(dt,0,0);
  }
  class Service{
    constructor(history){
      this.wheel=new Wheel();this.history=history;this.completed=history.runs;this.boarding=false;this.run=null;
      this.mags={...places.mags,id:"mags",name:"Mags Duran",phase:"counter",phaseAge:0,y:.007,motion:new BayPlayerMotion()};
      this.people=["miri","len","fay","vic"].map((id,i)=>({...at(marks[i]),id,index:i,name:names[i],y:.007,yaw:Math.PI,
        phase:"queue",seat:i%2,motion:new BayPlayerMotion(),path:[],timer:i===2?4:17}));
      this.player=null;this.punch=0;this.tickets=0;this.familyCar=null;this.pan=Math.PI*.43;this.tilt=-.18;this.outside=false;
    }
    price(){return this.history.rides===0||this.history.passes>0?0:8;}
    deliver(run){
      const h=this.history,quick=run.clock<=run.limit;
      h.runs++;h.passes++;const best=h.best[run.leg];
      if(!best||run.clock<best)h.best[run.leg]=run.clock;
      this.completed=h.runs;this.tickets++;this.punch=2.0;this.mags.phase="punch";this.mags.phaseAge=0;this.run=null;
      const first=this.people[0];if(first.phase==="queue"){first.phase="punch";first.path=[{x:173.57,z:107.99}];}
      return quick?155:115;
    }
    approach(p){
      const offset=p.index%2*.33;
      p.phase="walk";p.path=[{x:171.65-offset,z:110.72},ramp,{x:176.92-offset,z:112.48+offset*.80}];
    }
    join(hero,motion){
      if(this.player)return false;
      this.player={id:"player",x:hero.x,y:hero.y,z:hero.z,yaw:hero.yaw,seat:2,motion,phase:"walk",
        path:[turnstile],fare:this.price(),requested:false};this.pan=Math.PI*.43;this.tilt=-.18;this.outside=false;return true;
    }
    exit(){
      const p=this.player;if(!p)return;
      if(p.phase==="walk"||p.phase==="gate"){this.player=null;p.motion.reset();return "cancel";}
      if(p.phase==="ride"){p.requested=true;return "request";}
    }
    board(p,car){
      const w=this.wheel;p.car=car;p.boarded=w.stops;p.phase="board";p.blend=0;w.seats[car][p.seat]=p.id;
      const s=art.seat(w,car,p.seat);
      p.path=[{...landing,deck:true},{x:s.x,z:s.z,deck:true}];
    }
    depart(p){
      const w=this.wheel,s=art.seat(w,p.car,p.seat);
      w.seats[p.car][p.seat]=null;p.phase="leave";p.blend=1;
      p.path=[{...landing,z:s.z,deck:true},{...turnstile,deck:true},ramp,{x:171.20,z:113.05}];
      if(p.id!=="player")p.path.push(at(rail[p.index]));
    }
    clearCrossing(){
      return [this.player,...this.people].some(p=>p&&(p.phase==="board"||p.phase==="leave"&&p.x>178.37));
    }
    stepActor(p,dt,env){
      const isPlayer=p.id==="player",w=this.wheel;
      if(p.phase==="queue"||p.phase==="watch"){
        if(p.phase==="watch"){
          p.timer-=dt;if(p.timer<=0){p.phase="return";p.path=[{x:171.1,z:110},at(marks[p.index])];}
        }else if(p.index>=2){p.timer-=dt;if(p.timer<=0)this.approach(p);}
        p.motion.step(dt,0,0);return;
      }
      if(p.phase==="punch"){if(p.path.length)foot(p,p.path,1.6,dt,env.ground);else{p.yaw=Math.PI;p.motion.step(dt,0,0);}return;}
      if(p.phase==="return"){
        if(foot(p,p.path,1.46,dt,env.ground)){p.phase="queue";p.timer=10+p.index*2;p.yaw=Math.PI;}
      }else if(p.phase==="walk"){
        if(foot(p,p.path,isPlayer?2.6:1.86,dt,env.ground))p.phase="gate";
      }else if(p.phase==="gate"){
        p.yaw=Math.PI*.5;p.motion.step(dt,0,0);
        if(!w.open||w.seats[w.loading][p.seat]||this.people.some(a=>a.phase==="leave"&&a.x>178.37))return;
        if(isPlayer&&(this.punch>0||this.boarding&&this.familyCar===null))return;
        if(!isPlayer&&p.index<2){
          if(this.familyCar===null){
            const pair=this.people.slice(0,2);if(!pair.every(a=>a.phase==="gate")||w.seats[w.loading].slice(0,2).some(Boolean))return;
            this.familyCar=w.loading;for(const a of pair)this.board(a,w.loading);return;
          }
          return;
        }
        if(!isPlayer&&this.boarding&&this.familyCar===null)return;
        if(isPlayer&&!env.pay(p.fare)){this.player=null;return;}
        this.board(p,w.loading);
      }else if(p.phase==="board"){
        if(p.path.length){foot(p,p.path,2.55,dt,env.ground);return;}
        const s=art.seat(w,p.car,p.seat);p.blend=clamp(p.blend+dt/.58);sit(p,s,soften(p.blend),dt);
        if(p.blend===1){p.phase="ride";if(isPlayer)env.event("seated",p);}
      }else if(p.phase==="ride"){
        const s=art.seat(w,p.car,p.seat);p.x=s.x;p.z=s.z;sit(p,s,1,dt);
        const climbed=w.stops-p.boarded;
        if(p.id==="miri")p.photo=Math.max(0,Math.min(1,(s.y-17)/3.4));
        if(isPlayer&&climbed!==p.lastStop){
          p.lastStop=climbed;if(climbed===2||climbed===4)env.event(climbed===2?"passing":"summit",p);
        }
        if(w.open&&p.car===w.loading&&climbed>=8)this.depart(p);
      }else if(p.phase==="leave"){
        if(p.blend>0){p.blend=clamp(p.blend-dt/.44);sit(p,art.seat(w,p.car,p.seat),soften(p.blend),dt);return;}
        if(foot(p,p.path,2.3,dt,env.ground)){
          p.motion.reset();
          if(isPlayer){this.player=null;env.event("ashore",p);}
          else{p.phase="watch";p.timer=16+p.index*3;p.yaw=1.2;}
        }
      }
    }
    step(dt,env){
      const w=this.wheel;w.step(dt,this.clearCrossing());
      this.punch=Math.max(0,this.punch-dt);this.mags.phase=this.punch?"punch":"counter";this.mags.phaseAge=this.punch?2-this.punch:0;this.mags.motion.step(dt,0,0);
      if(!this.punch&&this.tickets&&this.people.slice(0,2).every(p=>p.phase==="punch"||p.phase==="queue")){
        this.tickets--;this.familyCar=null;this.boarding=true;for(const p of this.people.slice(0,2))this.approach(p);
      }
      if(this.boarding&&this.people.slice(0,2).every(p=>p.phase==="ride"))this.boarding=false;
      for(const p of this.people)this.stepActor(p,dt,env);
      const p=this.player;
      if(p){this.stepActor(p,dt,env);Object.assign(env.hero,{x:p.x,y:p.y,z:p.z,yaw:p.yaw});}
    }
  }
  window.BayBoardwalk={Service,read};
})();
