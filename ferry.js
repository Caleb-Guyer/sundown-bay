/* Last Ferry Out. The boarding gate and the passenger move with the same ship the player sees. */
(() => {
  "use strict";
  const job={id:"ferry",name:"Last Ferry Out",by:"Inez Cruz",desc:"Pick up the Paloma’s relief engineer and catch the ferry with a speedboat.",pay:450};
  const pickup={x:152.3,z:-25.8,name:"Marlin Motel"};
  const routes=[
    {id:"gull",name:"Gull Light Passage",x:330,z:-4,rx:53,rz:118,speed:7.5,direction:1,start:3.64},
    {id:"north",name:"North Channel",x:308,z:61,rx:31,rz:80,speed:7.1,direction:-1,start:3.45},
    {id:"south",name:"Outer Sound Crossing",x:356,z:-48,rx:47,rz:94,speed:8.2,direction:1,start:4.20}
  ];
  const {world,local}=BayDriving;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,f)=>a+(b-a)*f;
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const gap=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
  const stopped=v=>Math.hypot(v.vx,v.vz)<.85&&Math.abs(v.speed)<.85;
  const gateX=-5.55,gateZ=-3,holdTime=2;
  function nextRoute(last){return routes[(routes.findIndex(r=>r.id===last)+1)%routes.length];}
  function onRoute(r,a){return {x:r.x+r.rx*Math.sin(a),z:r.z+r.rz*Math.cos(a)};}
  function boatPose(m,f,dt){
    const pose=m.ride||(m.ride={handle:[0,0,0]});
    Object.assign(pose,{side:1,seat:f,seatY:.62,floor:.25,steer:0,inner:f,outer:f,duck:0,latchDip:0,reach:0,pull:0,passenger:true});
    m.step(dt,0,0);
  }
  function boardwalk(d){return {x:d.footX+1,z:d.z};}
  function pierHead(d){return {x:d.x+.65,z:d.z};}
  function seat(v){return {...world(v,.43,-.44),y:v.y+.02,yaw:v.yaw};}
  class Ship {
    constructor(route){
      this.route=route;this.angle=route.start;this.speed=route.speed;this.wake=[];this.wakeAt=-10;
      this.chart=Array.from({length:49},(_,i)=>onRoute(route,i*Math.PI/24));this.step(0,0);
    }
    step(dt,t){
      const r=this.route,arc=a=>Math.hypot(r.rx*Math.cos(a),r.rz*Math.sin(a));
      const travel=this.speed*r.direction*dt;
      this.angle=(this.angle+travel/arc(this.angle+travel/(2*arc(this.angle))))%(2*Math.PI);
      const a=this.angle,ratio=this.speed*r.direction/arc(a);
      Object.assign(this,onRoute(r,a));this.vx=r.rx*Math.cos(a)*ratio;this.vz=-r.rz*Math.sin(a)*ratio;
      this.yaw=Math.atan2(this.vx,this.vz);this.y=.10+.055*Math.sin(t*1.12+a);
      this.pitch=.006*Math.sin(t*.91);this.lean=.009*Math.cos(t*1.18);
      this.gate={...world(this,gateX,gateZ),kind:"ferry-gate",name:"Paloma’s boarding gate"};
      while(this.wake.length&&t-this.wake[0].at>3.25)this.wake.shift();
      if(dt&&t-this.wakeAt>.22){this.wake.push({...world(this,0,-8.6),at:t,yaw:this.yaw,pace:.75});this.wakeAt=t;}
    }
    separate(v){
      if(!v||v.dock||gap(this,v)>15)return;
      const p=local(this,v.x,v.z),heading=v.yaw-this.yaw;
      let depth=0,nx=0,nz=0;
      // Two rounded hulls. Sample the launch along its keel and slide only its inward velocity.
      for(const end of [-1.85,0,1.85]){
        const x=p.x+end*Math.sin(heading),z=p.z+end*Math.cos(heading);
        const dz=z-clamp(z,-5.9,5.35),d=Math.hypot(x,dz),overlap=4.02-d;
        if(overlap>depth){depth=overlap;nx=d>.001?x/d:(p.x<0?-1:1);nz=d>.001?dz/d:0;}
      }
      if(!depth)return;
      const c=Math.cos(this.yaw),s=Math.sin(this.yaw),x=nx*c+nz*s,z=-nx*s+nz*c;
      if(BayMarina.fits(v.x+x*depth,v.z+z*depth,v.yaw)){v.x+=x*depth;v.z+=z*depth;}
      const inward=(v.vx-this.vx)*x+(v.vz-this.vz)*z;
      if(inward<0){
        v.vx-=inward*x;v.vz-=inward*z;v.speed=v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw);
        if(inward< -4)v.lift=Math.max(v.lift,.15);
      }
    }
  }
  class Run {
    constructor(route,hard,dock){
      this.ship=new Ship(route);this.hard=hard;this.dock=dock;
      this.rider={...pickup,y:.076,yaw:-1.75};this.motion=new BayPlayerMotion();
      this.phase="pickup";this.ride=null;this.boat=null;this.path=[];this.seatBlend=0;
      this.hold=0;this.jumpTime=0;this.waterTime=0;this.remaining=hard?85:105;this.linger=0;
      this.guidance="";this.matched=false;
    }
    get pay(){return job.pay*(this.hard?2:1);}
    parking(){return {x:this.dock.footX-4.5,z:this.dock.z-4,name:this.dock.name+" entrance"};}
    holds(v){return this.ride===v&&["approach","carBoard","carExit"].includes(this.phase);}
    waitingAtDock(v){return v&&v===this.boat&&(this.phase==="pier"||this.phase==="boatBoard");}
    target(car,skiff){
      if(this.phase==="pickup"||this.phase==="approach"||this.phase==="carBoard")return pickup;
      if(this.phase==="drive"||this.phase==="carExit"){
        if(this.ride!==car)return {x:this.ride.x,z:this.ride.z,name:"Inez’s car"};
        return this.parking();
      }
      if(this.phase==="pier"||this.phase==="boatBoard"){
        return {...pierHead(this.dock),name:this.dock.name};
      }
      if(this.boat&&skiff!==this.boat)return {x:this.boat.x,z:this.boat.z,name:"Inez’s speedboat"};
      return this.ship.gate;
    }
    objective(car,skiff){
      switch(this.phase){
        case "pickup":return car?"Stop beside Inez at the Marlin Motel":"Take a car and pick up Inez";
        case "approach":case "carBoard":return "Wait for Inez to buckle up";
        case "drive":return this.ride===car?"Park at the entrance to "+this.dock.name:"Get back in Inez’s car";
        case "carExit":return "Wait for Inez to step out";
        case "pier":return car?"Leave the car and board a speedboat":this.boat?"Wait for Inez on the pier":"Board a speedboat at "+this.dock.name;
        case "boatBoard":return "Inez is climbing aboard";
        case "jump":return "Inez is crossing to the Paloma";
        case "aboard":return "Inez made the sailing";
        default:return skiff!==this.boat?"Return to Inez’s speedboat":this.guidance||"Catch the Paloma";
      }
    }
    reserveBoat(v,d,side){
      if(this.phase!=="pier"||d!==this.dock||this.boat)return;
      this.boat=v;
      this.path.push({x:d.x+.7,z:d.z+side*(d.headD*.5-.76)});
    }
    helm(v,input,assist){
      if(this.waitingAtDock(v)){input.gas=input.back=input.trim=false;input.steer=0;return;}
      if(!assist||this.phase!=="water"||v!==this.boat||gap(v,this.ship.gate)>30||Math.abs(wrap(v.yaw-this.ship.yaw))>.8)return;
      const along=local(this.ship,v.x,v.z).z;
      const wanted=this.ship.speed+clamp((gateZ-along)*.30,-1.9,2.4);
      input.gas=v.speed<wanted-.12;input.back=v.speed>wanted+.55;input.trim=false;
    }
    land(dt,car,transfer,doorPlan,ground){
      const actor=this.rider,m=this.motion;
      if(this.phase==="pickup"){
        m.step(dt,0,0);
        if(!car||transfer||!stopped(car)||gap(car,actor)>8.5)return;
        const plan=doorPlan(car,false,actor,1);if(!plan)return;
        this.ride=car;this.path=plan.points;this.phase="approach";
      }else if(this.phase==="approach"){
        if(BayCarAccess.walkPath(actor,m,this.path,dt,ground))this.phase="carBoard";
      }else if(this.phase==="carBoard"||this.phase==="carExit"){
        const boarding=this.phase==="carBoard";
        this.seatBlend=clamp(this.seatBlend+(boarding?1:-1)*dt/1.45,0,1);
        BayCarAccess.pose(this.ride,1,this.seatBlend,actor,m,ground,dt,true);
        if(boarding&&this.seatBlend===1){this.phase="drive";return "drive";}
        if(!boarding&&this.seatBlend===0){m.reset();this.phase="pier";return "pier";}
      }else if(this.phase==="drive"){
        BayCarAccess.pose(this.ride,1,1,actor,m,ground,dt,true);
        if(car!==this.ride||transfer||!stopped(car)||gap(car,this.parking())>11)return;
        const foot=boardwalk(this.dock),plan=doorPlan(car,false,foot,1);if(!plan)return;
        this.path=plan.points.slice(0,-1).reverse().concat(foot,pierHead(this.dock));this.phase="carExit";
      }else if(this.phase==="pier"){
        if(this.path.length)BayCarAccess.walkPath(actor,m,this.path,dt,ground,4.4);else m.step(dt,0,0);
        if(!this.path.length&&this.boat){this.phase="boatBoard";this.boardFrom={...actor};}
      }else if(this.phase==="boatBoard"){
        this.seatBlend=Math.min(1,this.seatBlend+dt/1.05);
        const f=this.seatBlend*this.seatBlend*(3-2*this.seatBlend),a=this.boardFrom,b=seat(this.boat);
        actor.x=mix(a.x,b.x,f);actor.z=mix(a.z,b.z,f);actor.y=mix(a.y,b.y,f)+.24*Math.sin(f*Math.PI);
        actor.yaw=a.yaw+wrap(b.yaw-a.yaw)*f;boatPose(m,f,dt);
        if(this.seatBlend===1){this.phase="water";return "cast";}
      }
    }
    water(dt,skiff,air,heat){
      const v=this.boat,f=this.ship;this.waterTime+=dt;this.remaining=Math.max(0,this.remaining-dt);
      Object.assign(this.rider,seat(v));boatPose(this.motion,1,dt);
      if(!this.remaining){this.phase="missed";return "missed";}
      const p=local(f,v.x,v.z),range=gap(f.gate,v),bearing=Math.abs(wrap(v.yaw-f.yaw));
      const alongside=p.x< -4&&p.x> -8.5&&Math.abs(p.z-gateZ)<4.5;
      const relative=Math.hypot(v.vx-f.vx,v.vz-f.vz);
      const lit=!this.hard||(heat===5&&air?.sees&&Math.hypot(air.spotX-v.x,air.spotZ-v.z)<air.radius);
      this.matched=skiff===v&&!v.dock&&alongside&&bearing<.5&&relative<3.05&&lit;
      this.hold=this.matched?Math.min(holdTime,this.hold+dt):0;
      if(this.hold>=holdTime-.00001){
        this.phase="jump";this.jumpTime=0;return "jump";
      }
      if(range>25)this.guidance="Catch the Paloma";
      else if(!alongside)this.guidance="Come alongside the amber gate";
      else if(bearing>=.5)this.guidance="Point the bow the same way as the ferry";
      else if(relative>=3.05)this.guidance="Match the ferry’s speed";
      else if(!lit)this.guidance="Hold alongside for Air One’s light";
      else this.guidance="Hold steady for Inez";
      if(this.hard&&heat<5&&skiff===v&&range<42)return "report";
    }
    cross(dt){
      const f=this.ship,m=this.motion,r=this.rider,last=this.jumpTime;
      this.jumpTime+=dt;
      const start=seat(this.boat),end=world(f,-2.55,gateZ),takeoff=.30;
      if(this.jumpTime<takeoff){
        const stand=1-this.jumpTime/takeoff;
        Object.assign(r,start);r.y+=.31*(1-stand);r.yaw=this.boat.yaw+Math.PI*.5*(1-stand);
        boatPose(m,stand,dt);return;
      }
      if(last<takeoff||!this.takeoff){
        this.takeoff={...start,y:start.y+.31,vx:this.boat.vx,vz:this.boat.vz};
        m.ride=null;m.jump();
      }
      const age=this.jumpTime-takeoff,u=clamp(age/.73,0,1),blend=u*u*(3-2*u),a=this.takeoff;
      r.x=mix(a.x+a.vx*age,end.x,blend);r.z=mix(a.z+a.vz*age,end.z,blend);
      r.y=mix(a.y,f.y+.94,blend);r.yaw=f.yaw+Math.PI*.5;m.step(dt,0,0);
      if(this.jumpTime>=1.39){this.phase="aboard";return "landed";}
    }
    onDeck(dt){
      const p=world(this.ship,-2.55,gateZ);
      Object.assign(this.rider,p,{y:this.ship.y+.94,yaw:this.ship.yaw+Math.PI*.5});
      this.motion.step(dt,0,0);
    }
    dispose(){if(this.ride)this.ride.passengerDoor=0;}
  }
  window.BayFerry={job,routes,pickup,nextRoute,holdTime,Ship,Run};
})();
