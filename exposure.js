/* Last Exposure. Mara walks both ends of the ride and stays with the car she boarded. */
(() => {
  "use strict";
  const job={id:"exposure",name:"Last Exposure",by:"Mara Vega",desc:"Drive a local photographer to Port Sol before the pier changes hands.",pay:300};
  const pickup={x:153,z:-21.5,name:"Marlin Motel"};
  const dock={x:-149.5,z:-91,name:"Lot 14, Port Sol"};
  const routes={
    live:{name:"Sol FM van",x:149.5,z:119,stand:{x:152.6,z:117.6},pay:425,
      headline:"Lot 14 sale breaks on Sol FM",edition:"Sol FM led the evening bulletin with Mara Vega’s photograph. By the weather report, listeners were already gathering at the pier."},
    print:{name:"Cine Luna",x:5.1,z:54.8,stand:{x:8.0,z:54.8},pay:300,
      headline:"Cine Luna puts the pier on screen",edition:"Before tonight’s double feature, the projectionist put Mara Vega’s photograph on the screen. Someone in the back row recognized the signature."}
  };
  const props=[
    {kind:"van",x:154.8,z:119,yaw:0,w:2.10,d:4.54,top:3.44},
    {kind:"kiosk",x:9.2,z:54.8,yaw:-Math.PI/2,w:.93,d:1.24,top:1.97},
    {kind:"notice",x:-154.3,z:-91,yaw:Math.PI/2,w:.25,d:2.24,top:2.19}
  ];
  const liveTime=55;
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const stopped=v=>Math.hypot(v.vx,v.vz)<.85&&Math.abs(v.speed)<.85;
  const turn=(from,to,dt)=>from+Math.atan2(Math.sin(to-from),Math.cos(to-from))*-Math.expm1(-15*dt);
  class Run {
    constructor(){
      this.mara={...pickup,yaw:-1.9,y:.076};this.motion=new BayPlayerMotion();
      this.phase="pickup";this.ride=null;this.path=[];this.progress=0;this.route="";this.remaining=0;
      this.aim={x:.43,y:.58};this.remarked=false;this.warnedHeat=false;this.warnedFlat=false;this.warnedClock=false;
    }
    target(car){
      if(this.ride&&this.ride!==car)return {x:this.ride.x,z:this.ride.z,name:"Mara’s car"};
      if(this.phase==="pickup"||this.phase==="approach"||this.phase==="board")return pickup;
      return routes[this.route]||dock;
    }
    objective(car){
      if(this.ride&&this.ride!==car)return "Get back in Mara’s car";
      switch(this.phase){
        case "pickup":return car?"Pull up beside Mara":"Take a car and pick up Mara";
        case "approach":case "board":return "Wait for Mara to get in";
        case "port":return "Park by the Lot 14 notice at Port Sol";
        case "choice":return "Decide where to take the photograph";
        case "delivery":return "Take Mara to "+routes[this.route].name;
        default:return "Wait for Mara to make the handoff";
      }
    }
    holds(v){return this.ride===v&&["approach","board","exit","handoff"].includes(this.phase);}
    atDock(car){return !!car&&this.ride===car&&distance(car,dock)<9&&stopped(car);}
    interaction(car){return this.atDock(car)?({port:"viewfinder",choice:"contact"})[this.phase]||"":"";}
    focus(){const sign=BayExposureArt.photoNotice;return Math.abs(this.aim.x-sign.x)<=sign.width*.32&&Math.abs(this.aim.y-sign.y)<=sign.height*.36;}
    expose(){if(this.phase!=="port"||!this.focus())return false;this.phase="choice";return true;}
    choose(route){if(this.phase!=="choice"||!Object.hasOwn(routes,route))return false;
      this.route=route;this.remaining=route==="live"?liveTime:0;this.phase="delivery";return true;}
    dispose(){if(this.ride)this.ride.passengerDoor=0;}
    walk(dt,ground){
      const p=this.mara,q=this.path[0];if(!q)return true;
      const dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz),step=Math.min(len,dt*2.85);
      const old=p.yaw;
      if(len>.001){p.x+=dx*step/len;p.z+=dz*step/len;p.yaw=turn(old,Math.atan2(dx,dz),dt);}
      p.y=ground(p.x,p.z);this.motion.step(dt,step,(p.yaw-old)/dt);
      if(len<=step+.001)this.path.shift();
      return !this.path.length;
    }
    pose(dt,ground){BayCarAccess.pose(this.ride,1,this.progress,this.mara,this.motion,ground,dt,true);}
    step(dt,car,transfer,doorPlan,ground){
      if(this.phase==="pickup"){
        this.motion.step(dt,0,0);
        if(!car||transfer||!stopped(car)||distance(car,this.mara)>8.5)return;
        const plan=doorPlan(car,false,this.mara,1);if(!plan)return;
        this.ride=car;this.path=plan.points;this.phase="approach";
      }else if(this.phase==="approach"){
        if(this.walk(dt,ground))this.phase="board";
      }else if(this.phase==="board"||this.phase==="exit"){
        const entering=this.phase==="board";
        this.progress=Math.max(0,Math.min(1,this.progress+(entering?1:-1)*dt/1.5));this.pose(dt,ground);
        if(entering&&this.progress===1){this.phase="port";return "boarded";}
        if(!entering&&this.progress===0){this.motion.reset();this.phase="handoff";}
      }else if(this.phase==="handoff"){
        if(this.walk(dt,ground)){this.phase="done";return "complete";}
      }else if(this.phase!=="done"){
        this.pose(dt,ground);
        if(this.phase==="port"&&!this.remarked&&distance(this.ride,dock)<53){
          this.remarked=true;return "docks";
        }
        if(this.phase!=="delivery")return;
        if(this.route==="live"){
          this.remaining=Math.max(0,this.remaining-dt);
          if(!this.remaining){this.route="print";return "late";}
        }
        const drop=routes[this.route];
        if(car!==this.ride||transfer||!stopped(car)||distance(car,drop)>7.5)return;
        const plan=doorPlan(car,false,drop.stand,1);if(!plan)return;
        this.path=plan.points.slice(0,-1).reverse().concat(drop.stand);this.phase="exit";
      }
    }
  }
  window.BayExposure={job,dock,pickup,routes,props,liveTime,Run};
})();
