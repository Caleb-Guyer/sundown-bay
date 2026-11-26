/* Curbside approach and the continuous standing-to-seated pose, played both ways. */
(() => {
  "use strict";
  const {world,local}=BayDriving;
  const mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  function outside(s,side){return {x:side*(s.hingeX+.43),z:s.back-.12};}
  function swinging(s,side,angle,x,z){
    const a=-side*angle,c=Math.cos(a),n=Math.sin(a),hx=side*s.hingeX;
    return {x:hx+(x-hx)*c+(z-s.hingeZ)*n,z:s.hingeZ-(x-hx)*n+(z-s.hingeZ)*c};
  }
  function canOpen(v,s,side,clear){
    const curb=outside(s,side);
    for(const p of [curb,{x:curb.x+side*.68,z:curb.z+.18}]){
      const w=world(v,p.x,p.z);if(!clear(w.x,w.z,.30))return false;
    }
    for(let i=0;i<=6;i++)for(const f of [.15,.55,1]){
      const tip=swinging(s,side,i/6*1.13,side*s.hingeX,mix(s.hingeZ,s.back,f));
      const w=world(v,tip.x,tip.z);if(!clear(w.x,w.z,.13))return false;
    }
    return true;
  }
  function pathLength(v,s,points,clear){
    let length=0,depth=-Infinity;
    for(let j=1;j<points.length;j++){
      const a=points[j-1],b=points[j],d=Math.hypot(b.x-a.x,b.z-a.z),steps=Math.max(1,Math.ceil(d/.22));
      for(let i=0;i<=steps;i++){
        const x=mix(a.x,b.x,i/steps),z=mix(a.z,b.z,i/steps),w=world(v,x,z);
        if(!clear(w.x,w.z,.28))return Infinity;
        const hull=Math.max(Math.abs(x)-s.track,Math.abs(z)-s.halfLength);
        if(hull<.20&&((j===1&&i===0)?false:hull<Math.min(.20,depth)-.001))return Infinity;
        depth=hull;
      }
      length+=d;
    }
    return length;
  }
  function plan(v,hero,exiting,clear,requiredSide=0){
    const s=bayCarLayout(v.kind),start=local(v,hero.x,hero.z);
    let best=null,cost=Infinity;
    for(const side of [-1,1]){
      if(requiredSide&&side!==requiredSide)continue;
      if(!canOpen(v,s,side,clear))continue;
      const curb=outside(s,side);
      if(exiting)return {side,points:[]};
      const flank=s.track+.42,len=s.halfLength+.43,entrySide=start.x<0?-1:1;
      const paths=[[start,curb]];
      for(const end of [-len,len]){
        const far={x:entrySide*flank,z:end},near={x:side*flank,z:end};
        paths.push([start,near,curb]);
        if(entrySide!==side)paths.push([start,far,near,curb]);
      }
      for(const path of paths){
        const d=pathLength(v,s,path,clear)+(side===1?.70:0);
        if(d<cost){cost=d;best={side,points:path.slice(1).map(q=>world(v,q.x,q.z))};}
      }
    }
    return best;
  }
  function pose(v,side,p,hero,m,ground,dt,passenger=false){
    const s=bayCarLayout(v.kind),bodyY=ground(v.x,v.z)+.008;
    const r=m.ride||(m.ride={handle:[0,0,0]});
    r.side=side;r.seatY=s.seatY;r.floor=s.floorY;r.steer=v.steer;r.passenger=passenger;
    if(p===1){
      // Once the door latches, the occupant moves with the chassis.
      const x=(passenger?side:-1)*s.seatX,pt=world(v,x,s.seatZ);
      hero.x=pt.x;hero.z=pt.z;hero.y=bodyY;hero.yaw=v.yaw;
      if(passenger)v.passengerDoor=0;else{v.doorAngle=0;v.doorSide=side;}
      r.seat=r.inner=r.outer=1;r.latchDip=r.duck=r.reach=r.pull=0;
      r.handle[0]=side*s.grabX-x;r.handle[1]=s.grabY;r.handle[2]=s.grabZ-s.seatZ;
      r.brace=passenger?smooth(.02,.09,v.pitch||0):0;
      r.sway=passenger?Math.max(-1,Math.min(1,(v.yawRate||0)*(v.speed||0)/12)):0;
      m.step(dt,0,0);return;
    }
    r.brace=r.sway=0;
    const curb=outside(s,side);
    const open=smooth(.13,.37,p)*(1-smooth(.585,.935,p)),door=1.13*open;
    const seat=smooth(.33,.79,p),across=side>0&&!passenger?smooth(.85,1,p):0;
    const latch=smooth(0,.10,p)*(1-smooth(.205,.35,p));
    const pull=smooth(.48,.635,p)*(1-smooth(.855,.955,p));
    const stepAside=Math.sin(door)*(1-.35*open)*(1-smooth(.35,.63,p));
    const outsideHandle=swinging(s,side,door,side*s.handleX,s.handleZ);
    const insideHandle=swinging(s,side,door,side*s.grabX,s.grabZ);
    let x=mix(curb.x,side*s.seatX,seat)+side*(s.hingeZ-s.handleZ)*stepAside;
    let z=mix(curb.z,s.seatZ,seat)+.20*stepAside;
    // The hips follow the moving handhold until the weight is on the seat.
    x=mix(x,outsideHandle.x+side*.32,latch);
    z=mix(z,outsideHandle.z-.24,latch);
    x=mix(x,insideHandle.x-side*.39,pull)-2*s.seatX*across;
    z=mix(z,insideHandle.z-.27,pull);
    const pt=world(v,x,z),twist=-side*.63*(1-smooth(.26,.75,p))+side*.64*smooth(.27,.48,p)*(1-smooth(.53,.82,p));
    hero.x=pt.x;hero.z=pt.z;hero.y=mix(ground(pt.x,pt.z),bodyY,seat);
    hero.yaw=v.yaw+twist;
    if(passenger)v.passengerDoor=door;else{v.doorAngle=door;v.doorSide=side;}
    r.seat=seat;
    r.latchDip=latch*Math.max(.06,.97-s.handleY);
    r.duck=latch*.84+
      smooth(.20,.46,p)*(1-smooth(.56,.86,p));
    r.inner=smooth(.29,.68,p);r.outer=smooth(.53,.88,p);
    r.reach=smooth(.006,.105,p)*(1-smooth(.215,.33,p));
    r.pull=pull;
    const inside=p>.425,handle=inside?insideHandle:outsideHandle;
    const c=Math.cos(twist),n=Math.sin(twist);
    r.handle[0]=(handle.x-x)*c-(handle.z-z)*n;
    r.handle[1]=bodyY+(inside?s.grabY:s.handleY)-hero.y;
    r.handle[2]=(handle.x-x)*n+(handle.z-z)*c;
    m.step(dt,0,0);
  }
  function walkPath(actor,motion,path,dt,ground,speed=2.85){
    const q=path[0];if(!q)return true;
    const dx=q.x-actor.x,dz=q.z-actor.z,len=Math.hypot(dx,dz),step=Math.min(len,dt*speed);
    const old=actor.yaw;
    if(len>.001){
      actor.x+=dx*step/len;actor.z+=dz*step/len;
      const turn=Math.atan2(dx,dz)-old;
      actor.yaw=old+Math.atan2(Math.sin(turn),Math.cos(turn))*-Math.expm1(-15*dt);
    }
    actor.y=ground(actor.x,actor.z);motion.step(dt,step,dt?(actor.yaw-old)/dt:0);
    if(len<=step+.001)path.shift();return !path.length;
  }
  window.BayCarAccess={plan,pose,outside,walkPath};
})();
