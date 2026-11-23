/* Predict close passes from the two actors' actual motion, including reversing and sliding. */
(() => {
  "use strict";
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};

  // Intersect the time intervals on the two axes of each footprint. A pedestrian is a disc.
  function arrival(driver,other,ux,uz,speed,horizon,margin){
    const dx=driver.x-other.x,dz=driver.z-other.z;
    if(Math.abs(dx)>44||Math.abs(dz)>44)return Infinity;
    const vx=driver.vx-speed*ux,vz=driver.vz-speed*uz;
    if(dx*vx+dz*vz>=-.12)return Infinity;
    const cs=Math.cos(driver.yaw),sn=Math.sin(driver.yaw),a=driver.footprint||bayCarLayout(driver.kind);
    const b=other.path&&other.kind?bayCarLayout(other.kind):null;
    let enter=0,leave=horizon;
    function axis(x,z){
      const r=a.track*Math.abs(x*cs-z*sn)+a.halfLength*Math.abs(x*sn+z*cs)+margin+
        (b?b.track*Math.abs(x*uz-z*ux)+(b.halfLength+.65)*Math.abs(x*ux+z*uz):.26);
      const d=dx*x+dz*z,rate=vx*x+vz*z;
      if(Math.abs(rate)<.0001)return Math.abs(d)<=r;
      const t1=(-r-d)/rate,t2=(r-d)/rate;
      enter=Math.max(enter,Math.min(t1,t2));leave=Math.min(leave,Math.max(t1,t2));
      return enter<=leave;
    }
    if(!axis(cs,-sn)||!axis(sn,cs))return Infinity;
    if(b&&(!axis(uz,-ux)||!axis(ux,uz)))return Infinity;
    return enter;
  }

  function trafficThreat(driver,v,ux,uz){
    if(!driver||Math.abs(driver.speed)<1.5)return null;
    const dx=driver.x-v.x,dz=driver.z-v.z,front=dx*ux+dz*uz;
    if(front< -1.35||Math.abs(dx)>43||Math.abs(dz)>43)return null;
    const along=driver.vx*ux+driver.vz*uz-v.speed,lateral=driver.vx*uz-driver.vz*ux;
    if(along*along+lateral*lateral<3.6)return null;
    const when=arrival(driver,v,ux,uz,v.speed,1.05,.40);
    if(!Number.isFinite(when))return null;
    const across=dx*uz-dz*ux;
    // A crossing driver is about to occupy the far side. Steer toward the space they leave.
    const side=Math.abs(lateral)>1.15?-Math.sign(lateral):Math.abs(across)>.28?-Math.sign(across):1;
    return {side,when};
  }

  function clearForPerson(p,x,z,driver,cars,people,valid,t){
    if(!valid(x,z,.31))return false;
    for(const v of cars){
      if(v===driver||Math.abs(v.x-x)>8||Math.abs(v.z-z)>8)continue;
      const travel=v.path?v.speed*t:0;
      if(BayDriving.clearance(v,{x:x-Math.sin(v.yaw)*travel,z:z-Math.cos(v.yaw)*travel})<.42)return false;
    }
    for(const other of people){
      if(other===p)continue;
      const ox=other.startle?.endX??other.x,oz=other.startle?.endZ??other.z;
      if((ox-x)**2+(oz-z)**2<.37**2)return false;
    }
    return true;
  }
  function chooseLanding(p,driver,cars,people,valid,speed){
    const ux=driver.vx/speed,uz=driver.vz/speed;
    const dx=p.x-driver.x,dz=p.z-driver.z,sideDist=dx*uz-dz*ux;
    const side=Math.abs(sideDist)>.09?Math.sign(sideDist):p.side;
    const span=clamp(1.05+speed*.049,1.20,2.05);
    let best={x:p.x,z:p.z},score=0;
    for(const sign of [side,-side])for(const bias of [.16,-.46,.76]){
      const unit=1/Math.hypot(1,bias),nx=(sign*uz+bias*ux)*unit,nz=(-sign*ux+bias*uz)*unit;
      let distance=0;
      for(let i=1;i<=6;i++){
        const step=span*i/6,x=p.x+nx*step,z=p.z+nz*step;
        // Never choose a path that first crosses deeper into the stream of traffic.
        if(Math.abs(sideDist)>.28&&sign!==side)break;
        if(!clearForPerson(p,x,z,driver,cars,people,valid,.10+i*.075))break;
        distance=step;
      }
      const value=distance*(1-.17*Math.abs(bias))*(sign===side?1:.88);
      if(value>score){score=value;best={x:p.x+nx*distance,z:p.z+nz*distance};}
    }
    return best;
  }
  function startlePerson(p,dt,driver,cars,people,valid,time){
    let r=p.startle;
    if(!r){
      if(!driver||time<(p.startleAfter||0)||Math.abs(p.x-driver.x)>35||Math.abs(p.z-driver.z)>35)return false;
      const speed=Math.hypot(driver.vx,driver.vz);
      if(speed<1.4)return false;
      const walking=p.moving?p.pace:0;
      const beat=p.reactionBeat??.5;
      const horizon=.59+beat*.09+Math.min(speed*.006,.17);
      const margin=.48+Math.min(speed*.071,1.12);
      if(!Number.isFinite(arrival(driver,p,Math.sin(p.yaw),Math.cos(p.yaw),walking,horizon,margin)))return false;
      const end=chooseLanding(p,driver,cars,people,valid,speed),dx=end.x-p.x,dz=end.z-p.z;
      const face=Math.hypot(dx,dz)>.05?Math.atan2(-dx,-dz):Math.atan2(driver.x-p.x,driver.z-p.z);
      r=p.startle={age:0,fromX:p.x,fromZ:p.z,endX:end.x,endZ:end.z,face,lead:p.side,
        look:Math.atan2(driver.x-p.x,driver.z-p.z),launch:.085+.047*beat,
        duration:.435+.065*beat+(p.role==="runner"?0:.018),height:clamp(.32+speed*.012,.35,.59),guard:0,bend:0,air:0,lift:0};
      p.startleAfter=time+2.6;p.alert=0;p.gesture=0;
    }
    r.age+=dt;
    const launch=r.launch,landing=launch+r.duration,u=clamp((r.age-launch)/r.duration,0,1);
    const travel=u*u*(3-2*u),air=4*u*(1-u);
    const x=r.fromX+(r.endX-r.fromX)*travel,z=r.fromZ+(r.endZ-r.fromZ)*travel;
    // If another car moves into the landing zone mid-flight, finish the hop in place.
    if(!r.stopped&&(x!==p.x||z!==p.z)&&!clearForPerson(p,x,z,driver,cars,people,valid,0))r.stopped=true;
    if(!r.stopped){p.x=x;p.z=z;}
    r.air=air;r.lift=air*r.height;
    r.guard=smooth(0,.15,r.age)*(1-smooth(landing+.17,landing+.65,r.age));
    r.bend=.72*smooth(0,.075,r.age)*(1-smooth(.075,.23,r.age))+
      smooth(landing-.08,landing+.07,r.age)*(1-smooth(landing+.07,landing+.38,r.age));
    if(driver&&r.age>=landing&&Math.hypot(driver.x-p.x,driver.z-p.z)<15)r.face=Math.atan2(driver.x-p.x,driver.z-p.z);
    const towardFeet=Math.atan2(Math.sin(r.face-r.look),Math.cos(r.face-r.look));
    const bearing=r.look+towardFeet*smooth(launch*.35,launch+.19,r.age)-p.yaw;
    p.yaw+=Math.atan2(Math.sin(bearing),Math.cos(bearing))*-Math.expm1(-12*dt);
    p.moving=false;p.gesture=0;
    if(r.age>landing+.68){
      p.startle=null;p.wait=Math.min(p.wait,.30);p.stuck=0;
    }
    return true;
  }
  function hornPulse(v,time){
    const t=time-(v.hornAt??-100);
    if(t<0||t>.68)return 0;
    const beat=t<.26?t/.26:(t-.32)/.36;
    return beat>0&&beat<1?Math.sin(beat*Math.PI):0;
  }
  window.BayStreetReactions={trafficThreat,startlePerson,hornPulse};
})();
