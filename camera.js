/* Orbit and chase camera, sharing one continuous rig when entering or leaving a car. */
(() => {
  "use strict";
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  const wrap=x=>Math.atan2(Math.sin(x),Math.cos(x));
  const smooth=(a,b,rate,dt)=>a+(b-a)*-Math.expm1(-rate*dt);
  const overhang=v=>Math.max(0,(v?.footprint?.halfLength||0)-2);
  const chaseBoom=(v,blend,pace)=>4.55+blend*(2.25+pace*1.35+overhang(v)*2.55);
  // Sweep a small near-plane volume along the boom, including its height under awnings.
  function safeFraction(start,end,obstacles) {
    const dx=end.x-start.x,dy=end.y-start.y,dz=end.z-start.z;
    const len=Math.hypot(dx,dy,dz);
    if(len<.001)return 1;
    let limit=1;
    for(const o of obstacles){
      let entry=0,exit=limit;
      const pad=.23;
      const wx=o.w*.5+pad,wz=o.d*.5+pad;
      if(Math.min(start.x,end.x)>o.x+wx||Math.max(start.x,end.x)<o.x-wx||
         Math.min(start.z,end.z)>o.z+wz||Math.max(start.z,end.z)<o.z-wz)continue;
      const slab=(origin,dir,lo,hi)=>{
        if(Math.abs(dir)<.00001)return origin>lo&&origin<hi;
        let a=(lo-origin)/dir,b=(hi-origin)/dir;if(a>b)[a,b]=[b,a];
        entry=Math.max(entry,a);exit=Math.min(exit,b);return entry<=exit;
      };
      if(slab(start.x,dx,o.x-wx,o.x+wx)&&slab(start.z,dz,o.z-wz,o.z+wz)&&
         slab(start.y,dy,(o.bottom??0)-pad,(o.top??65)+pad)){
        // The pivot can brush a narrow pole. Let the camera leave its expanded hull.
        if(entry===0&&exit<.10)continue;
        limit=Math.min(limit,Math.max(0,entry-.07/len));
      }
    }
    return limit;
  }
  class BayCamera {
    constructor(obstacles,staticCity=false) {
      this.obstacles=obstacles;
      this.space=staticCity?new BayStreetSpace(obstacles,20):null;
      this.zoom=1;this.assist=false;this.sensitivity=1;
      this.reset({x:151,z:-27,yaw:0});
    }
    reset(subject,yaw=subject.yaw) {
      this.anchor={x:subject.x,z:subject.z};this.jumpLift=0;
      const long=overhang(subject)>0;
      this.yaw=this.wantedYaw=yaw;this.elevation=this.wantedElevation=long?.34:.255;
      this.distance=(long?chaseBoom(subject,1,0):4.6)*this.zoom;this.safeDistance=this.distance;
      this.lastLook=-20;this.manualAim=false;this.lastCarYaw=null;this.carBlend=long?1:0;this.lookBack=0;
      this.reversing=0;this.behindCar=false;this.hideActor=false;this.diving=false;
    }
    orbit(dx,dy,time) {
      if(Math.abs(dx)+Math.abs(dy)<.02)return;
      this.wantedYaw+=clamp(dx,-240,240)*.00325*this.sensitivity;
      this.wantedElevation=clamp(this.wantedElevation+clamp(dy,-180,180)*.0027*this.sensitivity,this.diving?-.65:-.13,1.03);
      this.lastLook=time;this.manualAim=true;
    }
    changeZoom(amount){this.zoom=clamp(this.zoom+amount,.68,1.65);}
    recenter(heading,time){this.wantedYaw=this.yaw+wrap(heading-this.yaw);this.wantedElevation=.255;this.lastLook=time-.8;this.manualAim=false;}
    update(out,subject,vehicle,dt,time,options={}) {
      const speed=vehicle?Math.abs(vehicle.speed):0, pace=clamp(speed/31,0,1);
      const swim=options.swim;
      this.diving=!!swim?.underwater;
      if(!this.diving)this.wantedElevation=Math.max(-.13,this.wantedElevation);
      this.carBlend=smooth(this.carBlend,options.seat??(vehicle?1:0),5.2,dt);
      const b=this.carBlend;
      if(vehicle){
        const changed=this.lastCarYaw===null;
        const turn=changed?0:wrap(vehicle.yaw-this.lastCarYaw);this.lastCarYaw=vehicle.yaw;
        this.reversing=vehicle.speed< -2.7?Math.min(1,this.reversing+dt):0;
        if(this.reversing>.65)this.behindCar=true;
        if(vehicle.speed>2.4)this.behindCar=false;
        // A keyboard-only drive follows the road. After a look, hold that bearing until X.
        if(options.seat===undefined&&(this.assist||!this.manualAim)&&time-this.lastLook>2.15&&(speed>2.4||changed)){
          const direction=vehicle.yaw+(this.behindCar?Math.PI:0);
          this.wantedYaw+=turn*.34;
          this.wantedYaw+=wrap(direction-this.wantedYaw)*-Math.expm1(-(this.behindCar?1.75:2.35)*dt);
        }
      }else{this.lastCarYaw=null;this.reversing=0;this.behindCar=false;}
      this.yaw+=wrap(this.wantedYaw-this.yaw)*-Math.expm1(-28*dt);
      this.elevation=smooth(this.elevation,this.wantedElevation,24,dt);
      this.lookBack=smooth(this.lookBack,options.rear?Math.PI:0,12,dt);
      const heading=this.yaw+this.lookBack,sn=Math.sin(heading),cs=Math.cos(heading);
      const anchor=this.anchor;
      anchor.x=smooth(anchor.x,subject.x,17,dt);anchor.z=smooth(anchor.z,subject.z,17,dt);
      // Keep a lagged anchor on the subject's side when it rounds a corner.
      this.jumpLift=smooth(this.jumpLift,vehicle?0:(options.lift||0)*.39,12,dt);
      const ground=options.ground||0,pivotY=swim?subject.y+(swim.exit?1.22:.15):ground+(options.skate ? .84 : options.court?1.59:1.26)+(.10+.43*overhang(vehicle))*b+this.jumpLift;
      const realPivot={x:subject.x,y:pivotY,z:subject.z};
      const anchorEye={x:anchor.x,y:pivotY,z:anchor.z};
      const nearby=(a,b)=>this.space?this.space.near(a.x,a.z,Math.max(Math.abs(a.x-b.x),Math.abs(a.z-b.z))+.24):this.obstacles;
      const free=safeFraction(realPivot,anchorEye,nearby(realPivot,anchorEye));
      const pivot={x:subject.x+(anchor.x-subject.x)*free,y:pivotY,z:subject.z+(anchor.z-subject.z)*free};
      this.distance=smooth(this.distance,(swim?(this.diving?3.35:4.25):options.flight?12.2+pace*2.8:options.skate?4.2+Math.min(1.3,speed*.11):options.court?5.35:chaseBoom(vehicle,b,pace))*this.zoom,6.5,dt);
      const shoulder=.47*(1-b),radius=this.distance,flat=Math.cos(this.elevation)*radius;
      const xOff=-sn*flat+cs*shoulder,zOff=-cs*flat-sn*shoulder;
      const yOff=Math.sin(this.elevation)*radius+.20*b;
      const minHeight=swim&&!swim.exit ? .40 : ground+.46;
      const eyeHeight=(x,z,y)=>this.diving?clamp(y,Math.min(-.17,BaySwimming.floor(x,z)+.29),-.15):Math.max(minHeight,y);
      const ideal={x:pivot.x+xOff,z:pivot.z+zOff};
      ideal.y=eyeHeight(ideal.x,ideal.z,pivot.y+yOff);
      let clearance=safeFraction(pivot,ideal,nearby(pivot,ideal))*radius;
      if(this.diving)for(let part=.2;part<=1;part+=.2){
        if(BaySwimming.floor(pivot.x+xOff*part,pivot.z+zOff*part)>-.54){clearance=Math.min(clearance,radius*(part-.15));break;}
      }
      this.safeDistance=clearance<this.safeDistance?clearance:smooth(this.safeDistance,clearance,5.6,dt);
      const ratio=clamp(this.safeDistance/radius,0,1);
      const lift=(1-clamp(this.safeDistance/(vehicle?3.8:2.1),0,1))*(vehicle?2.65:.72);
      const eye={x:pivot.x+xOff*ratio,z:pivot.z+zOff*ratio};
      eye.y=eyeHeight(eye.x,eye.z,pivot.y+yOff*ratio+lift);
      const safe=safeFraction(pivot,eye,nearby(pivot,eye));
      out.x=pivot.x+(eye.x-pivot.x)*safe;out.y=pivot.y+(eye.y-pivot.y)*safe;out.z=pivot.z+(eye.z-pivot.z)*safe;
      if(swim)out.y=eyeHeight(out.x,out.z,out.y);
      const lead=b*(.70+pace*2.25), ahead=.38+lead;
      const aimX=pivot.x+sn*ahead+cs*shoulder*.75,aimZ=pivot.z+cs*ahead-sn*shoulder*.75;
      const aimY=pivot.y+(swim?0:.27+b*.24);
      out.yaw=Math.atan2(aimX-out.x,aimZ-out.z);
      out.pitch=Math.atan2(aimY-out.y,Math.max(.15,Math.hypot(aimX-out.x,aimZ-out.z)));
      out.focal=options.court?1.19:1.56-b*(.04+.145*pace);
      this.hideActor=vehicle ? Math.hypot(out.x-subject.x,out.z-subject.z)<1.55&&out.y-ground<(vehicle.kind==="van"?2.9:1.85)
                             : Math.hypot(out.x-subject.x,out.z-subject.z)<.53&&out.y-ground<2.18;
    }
  }
  // The tripod stays on its mark while the driver passes it. Cut on travel,
  // a turn, or a blocked sightline so waiting at a light holds the same shot.
  class Roadside {
    constructor(rig){this.rig=rig;this.stop();}
    stop(){this.vehicle=null;this.mark=null;this.shot=0;this.retry=0;}
    start(v){this.stop();this.vehicle=v;}
    clear(p,q){
      const reach=Math.max(Math.abs(p.x-q.x),Math.abs(p.z-q.z))+.3;
      const obstacles=this.rig.space?this.rig.space.near(p.x,p.z,reach):this.rig.obstacles;
      return safeFraction(p,q,obstacles)===1;
    }
    frame(v,ground,dt){
      if(v!==this.vehicle||!v)return null;
      const y=ground(v.x,v.z),p={x:v.x,y:y+1,z:v.z};
      const direction=v.speed< -1?-1:1,heading=v.yaw+(direction<0?Math.PI:0);
      const sn=Math.sin(heading),cs=Math.cos(heading);
      let m=this.mark;
      if(m){
        const forward=(m.x-v.x)*m.sn+(m.z-v.z)*m.cs;
        if(forward< -9||Math.hypot(m.x-v.x,m.z-v.z)>36||
           Math.abs(v.speed)>2&&Math.abs(wrap(heading-m.heading))>.93||!this.clear(p,m)){
          this.mark=m=null;
        }
      }
      if(!m){
        this.retry=Math.max(0,this.retry-dt);if(this.retry>0)return null;
        const side=this.shot%2?-1:1,high=this.shot%2===1;
        for(const [ahead,offset,lift] of [[high?14:18,side*(high?9:7),high?4.8:1.75],
          [15,-side*7,2.7],[8,side*6,3.8],[6,-side*5,4.4]]){
          const x=v.x+sn*ahead+cs*offset,z=v.z+cs*ahead-sn*offset;
          const q={x,y:Math.max(y,ground(x,z))+lift,z,heading,sn,cs};
          if(!this.clear(p,q))continue;
          this.mark=m=q;this.shot++;break;
        }
        if(!m){this.retry=.25;return null;}
      }
      const lead=Math.min(2.6,Math.abs(v.speed)*.11);
      const cx=v.x+sn*lead,cz=v.z+cs*lead,range=Math.hypot(cx-m.x,cz-m.z);
      return {x:m.x,y:m.y,z:m.z,yaw:Math.atan2(cx-m.x,cz-m.z),
        pitch:Math.atan2(p.y-m.y,range),focal:clamp(1.23+range*.038,1.45,2.25),
        cx,cz,span:clamp(15+range*.49,18,32)};
    }
  }
  BayCamera.Roadside=Roadside;
  BayCamera.safeFraction=safeFraction;
  window.BayCamera=BayCamera;
})();
