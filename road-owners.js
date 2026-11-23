(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const names=["Alma Ruiz","Frank Bell","Nadia Pike","Eli Torres"];
  class Owners{
    constructor(cars){
      this.people=[];
      for(const v of cars){
        if(!v.path||v.serviceCar||v.meetCar||v.recoveryOwner)continue;
        if(v.path.length===4)BayMotorCourt.roundLoop(v);
        const id=v.id%4,p=BayMotorCourt.actor("road"+id,v,"drive");
        Object.assign(p,{name:names[id],car:v,route:v.path,seat:1});v.owner=p;this.people.push(p);
      }
    }
    yieldSeat(v,entry,env){
      const p=v.owner;if(!p||p.phase!=="drive"||!v.path)return true;
      const out=env.door(v,true,p,-entry.side)||env.door(v,true,p,entry.side);
      if(!out)return false;
      p.side=out.side;p.seat=1;p.route=v.path;p.oldCorner=v.corner;p.ride=v;p.displaced=true;
      p.stand=env.sidewalk(v,p.side);p.spot={x:v.x,z:v.z};
      BayMotorCourt.phase(p,"out");entry.owner=p;v.path=null;v.indicator=0;return true;
    }
    exit(p,dt,env){
      const v=p.car;
      if(!BayMotorCourt.open(p,v,false,dt,env))return;
      p.ride=null;BayMotorCourt.phase(p,"walk");BayMotorCourt.walkTo(p,p.stand,v,env);
    }
    step(dt,env){
      for(const p of this.people){
        const v=p.car;
        if(p.phase==="drive"||p.stranded)continue;
        p.age+=dt;
        if(p.phase==="out"){
          if(!env.held(v))this.exit(p,dt,env);
        }else if(p.phase==="walk"){
          if(!BayMotorCourt.move(p,dt,env,2.55))continue;
          BayMotorCourt.phase(p,"phone");p.yaw=Math.atan2(v.x-p.x,v.z-p.z);
        }else if(p.phase==="phone"||p.phase==="upset"){
          p.motion.step(dt,0,0);
          if(p.phase==="phone"&&p.age>5.5)BayMotorCourt.phase(p,"upset");
          if(p.age<2||env.held(v)||gap(v,p)>32||!env.reclaimable(v)||!env.canRejoin(p))continue;
          const dest=BayDriving.world(v,p.side*(bayCarLayout(v.kind).track+.75),-.2);
          if(!BayMotorCourt.walkTo(p,dest,v,env))continue;
          BayMotorCourt.phase(p,"return");
        }else if(p.phase==="return"){
          if(env.held(v)){BayMotorCourt.phase(p,"upset");continue;}
          if(!BayMotorCourt.move(p,dt,env,1.75))continue;
          const access=env.door(v,false,p);
          if(!access){BayMotorCourt.phase(p,"upset");continue;}
          p.path=access.points;p.side=access.side;BayMotorCourt.phase(p,"approach");
        }else if(p.phase==="approach"){
          if(!BayMotorCourt.move(p,dt,env,1.6))continue;
          BayMotorCourt.phase(p,"in");
        }else if(p.phase==="in"){
          if(!BayMotorCourt.open(p,v,true,dt,env))continue;
          env.rejoin(p);p.ride=v;p.displaced=false;BayMotorCourt.phase(p,"drive");
        }
      }
    }
    nearby(hero){return this.people.find(p=>!p.stranded&&["upset","phone"].includes(p.phase)&&gap(hero,p)<2.8);}
  }
  window.BayRoadOwners=Owners;
})();
