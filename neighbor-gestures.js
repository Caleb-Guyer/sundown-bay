/* Boardwalk hellos. The shoulder and wrist stay on the same rig as the walker or driver. */
(() => {
  "use strict";
  const spans = {wave:1.65, point:2.4, guard:1.65, driver:1.45};
  const duration = kind => spans[kind] || 0;
  const limit = (x,a,b) => Math.min(b,Math.max(a,x));
  function smooth(x){const v=limit(x,0,1);return v*v*(3-2*v);}
  const mix=(a,b,t)=>a+(b-a)*t;
  const poses = new WeakMap();

  // Coordinates are right, up and forward, relative to the gesturing shoulder.
  function sample(actor,event){
    if(!event || !duration(event.kind) || !Number.isFinite(event.age))return null;
    const span=event.duration>0?event.duration:duration(event.kind);
    const u=event.age/span;
    if(u<=0 || u>=1)return null;
    const kind=event.kind,local=Number.isFinite(event.bearing)?event.bearing-(actor.yaw||0):0;
    let side=event.side===-1?-1:1;
    if(kind==="driver")side=-1;
    else if(kind==="point"&&!event.side&&Math.abs(Math.sin(local))>.15)side=Math.sign(Math.sin(local));
    const amount=smooth(u/(kind==="point"?.17:.22))*smooth((1-u)/.27);
    let x,y,z;
    const beat=Math.sin((u-.21)*Math.PI*6.2);
    if(kind==="point"){
      // A little overshoot, then the wrist settles on the actual compass bearing.
      const reach=.397+.011*Math.sin(Math.PI*limit((u-.16)/.24,0,1));
      x=Math.sin(local)*reach;y=.026+.060*(1-smooth((u-.18)/.30));z=Math.cos(local)*reach;
    }else if(kind==="guard"){
      // Palm up in front of the shoulder, then one small, dismissive push.
      const out=.5-.5*Math.cos(Math.PI*2*limit((u-.2)/.54,0,1));
      x=side*(.023+.054*out);y=.045+.021*out;z=.236+.079*out;
    }else if(kind==="driver"){
      x=side*(.312+.013*beat);y=.139+.047*beat;z=.050+.026*Math.cos(u*17);
    }else{
      x=side*(.153+.071*beat);y=.208+.029*Math.cos((u-.16)*13);z=.078+.023*beat;
    }
    return {kind,side,x,y,z,amount};
  }

  function armPose(limb,sample){
    const a=limb.shoulder,k=limb.elbow,h=limb.hand;
    // Recover both joints from the original pose, including the wheel or the arm swing.
    limb.arm.map(limb.forearm.pivot,k);limb.forearm.map(limb.handPivot,h);
    const w=sample.amount,side=limb.side;
    const dx=mix(h[0]-a[0],sample.x,w),dy=mix(h[1]-a[1],sample.y,w),dz=mix(h[2]-a[2],sample.z,w);
    const raw=Math.max(.00001,Math.hypot(dx,dy,dz)),nx=dx/raw,ny=dy/raw,nz=dz/raw;
    const upper=limb.arm.length,lower=limb.forearm.length,d=limit(raw,Math.abs(upper-lower)+.001,upper+lower-.001);
    const along=(upper*upper-lower*lower+d*d)/(2*d);
    const ox=mix(k[0]-a[0],side*.25,w),oy=mix(k[1]-a[1],-.112,w),oz=mix(k[2]-a[2],-.097,w);
    const dot=nx*ox+ny*oy+nz*oz,ex=ox-nx*dot,ey=oy-ny*dot,ez=oz-nz*dot;
    const bend=Math.sqrt(Math.max(0,upper*upper-along*along))/Math.max(.00001,Math.hypot(ex,ey,ez));
    k[0]=a[0]+nx*along+ex*bend;k[1]=a[1]+ny*along+ey*bend;k[2]=a[2]+nz*along+ez*bend;
    h[0]=a[0]+nx*d;h[1]=a[1]+ny*d;h[2]=a[2]+nz*d;
    limb.arm.aim(a,k);limb.forearm.aim(k,h);
  }

  function pose(mesh,motion,actor,event){
    let cache=poses.get(mesh);
    if(cache&&cache.motion!==motion&&mesh.lastRevision===motion.revision)mesh.lastRevision=-1;
    const changed=mesh.update(motion),s=sample(actor,event);
    if(cache){
      if(!changed && cache.motion===motion && cache.rev===motion.revision){
        cache.limb.arm.m.set(cache.upper);cache.limb.forearm.m.set(cache.lower);
        if(!s){mesh.skin();poses.delete(mesh);return true;}
      }else if(!s){poses.delete(mesh);return changed;}
    }
    if(!s)return changed;
    if(!cache){
      cache={upper:new Float32Array(12),lower:new Float32Array(12)};
      poses.set(mesh,cache);
    }
    const limb=mesh.sides[s.side<0?0:1];
    cache.motion=motion;cache.rev=motion.revision;cache.limb=limb;
    cache.upper.set(limb.arm.m);cache.lower.set(limb.forearm.m);
    armPose(limb,s);mesh.skin();return true;
  }

  function stroke(c,x,z,X,Z,width,color){
    c.beginPath();c.moveTo(x,z);c.lineTo(X,Z);c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function hand(c,x,z,r,skin){
    c.beginPath();c.arc(x,z,r,0,Math.PI*2);c.fillStyle=skin;c.fill();
  }
  function map(c,x,y,k,actor,event){
    const s=sample(actor,event);if(!s)return;
    const side=s.side,skin=actor.skin||(actor.lead==="frankie"?"#af7659":"#b68160");
    const shirt=actor.shirt||window.BayThreadsArt?.colors[actor.kit]||"#398e86";
    const shoulder=side*.207,elbow=shoulder+side*.145*s.amount;
    const reach=s.kind==="point"?1.17:1;
    // The overhead sprites use a wider silhouette so limbs still read on small screens.
    const wrist=shoulder+mix(.067*side,s.x*reach+(s.kind==="wave"?.085*side:0),s.amount);
    const forward=mix(.01,s.z*reach+.21*s.y,s.amount);
    c.save();c.translate(x,y);c.scale(k,k);c.rotate(actor.yaw||0);
    c.lineCap="round";c.globalAlpha*=smooth(s.amount*5);
    const ez=-forward*.30+.044,ex=mix(elbow,wrist,.33);
    stroke(c,shoulder,.016,ex,ez,.120,shirt);
    stroke(c,ex,ez,wrist,-forward,.079,skin);hand(c,wrist,-forward,s.kind==="guard"?.071:.055,skin);
    if(s.kind==="point")stroke(c,wrist,-forward,wrist+s.x*.16,-forward-s.z*.16,.035,skin);
    c.restore();
  }
  function mapDriver(c,px,py,k,car,event,skin="#b68160",shirt="#398e86"){
    const s=sample(car,event);if(!s||s.kind!=="driver")return;
    const layout=bayCarLayout(car.kind),edge=-layout.track+.075;
    // Only the portion at or outside the sill can be seen through the roof from above.
    c.save();c.translate(px(car.x),py(car.z));c.rotate(car.yaw||0);c.scale(k,k);c.lineCap="round";
    const z=-layout.seatZ-.025,reach=smooth((s.amount-.36)/.64),elbow=edge-.093*reach;
    c.globalAlpha*=reach;
    stroke(c,edge+.024,z,elbow,z+.048*reach,.137,shirt);
    const x=elbow-.10*reach,y=z-s.z*1.8*reach;
    stroke(c,elbow,z+.048*reach,x,y,.089,skin);hand(c,x,y,.065,skin);
    c.restore();
  }

  // The first-person wheel has its own high-detail hands, separate from the street rig.
  // Move its existing left hand and sleeve, leaving the other grip and instruments alone.
  const cockpits=new WeakMap();
  function cockpit(r,a,v,event){
    const samplePose=sample(v,event),was=cockpits.get(r);
    if(!was&&samplePose?.kind!=="driver")return false;
    const s=samplePose?.kind==="driver"?samplePose:null,amount=s?.amount||0;
    const hand=was?.hand||r.parts.find(p=>p.type==="hand");
    const arm=was?.arm||r.parts.find(p=>p.type==="arm"&&p.side<0);
    if(!hand||!arm)return false;
    if(s){if(!was)cockpits.set(r,{arm,hand});}else cockpits.delete(r);
    const w=a.wheel,tiltC=Math.cos(w.tilt),tiltS=Math.sin(w.tilt);
    const wheelAngle=-limit((v.steer||0)*3.6,-1.98,1.98);
    const turn=1.14*Math.tanh(wheelAngle/1.27),co=Math.cos(turn),si=Math.sin(turn);
    const [hx,hy,hz]=arm.wrist,wx=hx*co-hy*si,wy=hx*si+hy*co;
    const startX=w.x+wx,startY=w.y+wy*tiltC-hz*tiltS,startZ=w.z+wy*tiltS+hz*tiltC;
    const edge=-a.s.track,tx=mix(startX,edge-.029+(s?s.x+.312:0),amount);
    const ty=mix(startY,Math.min(a.roof-.105,a.ey.y+(s?s.y-.135:0)),amount)+.085*amount*(1-amount);
    const tz=mix(startZ,a.ey.z+.089+(s?s.z:0),amount);
    const gripAngle=2.85,radX=Math.cos(gripAngle),radY=Math.sin(gripAngle),src=r.rest,out=r.vertices;
    for(let i=hand.first;i<hand.end;i+=6){
      const x=src[i]*co-src[i+1]*si,y=src[i]*si+src[i+1]*co,z=src[i+2];
      const dx=src[i]-hx,dy=src[i+1]-hy,dz=src[i+2]-hz;
      const radial=dx*radX+dy*radY,tangent=dx*radY-dy*radX;
      // Rotate the palm towards the window. Uncurl the leading fingers as they lift.
      const fingers=smooth((dz-.024)/.038)*smooth((tangent+.01)/.048)*.029;
      out[i]=tx+mix(w.x+x-startX,-dz-.22*tangent,amount);
      out[i+1]=ty+mix(w.y+y*tiltC-z*tiltS-startY,tangent-radial*.24+fingers,amount);
      out[i+2]=tz+mix(w.z+y*tiltS+z*tiltC-startZ,-radial,amount);
    }
    const bx=mix(a.ey.x-.224,edge+.122,amount),by=mix(a.ey.y-.393,a.sill+.015,amount);
    const bz=mix(a.ey.z+.036,a.ey.z-.017,amount),dx=tx-bx,dy=ty-by,dz=tz-bz;
    const flat=Math.hypot(dx,dz)||1,len=Math.hypot(dx,dy,dz)||1;
    const ux=dz/flat,uz=-dx/flat,vx=dy/len*uz,vy=flat/len,vz=-dy/len*ux;
    for(let i=arm.first;i<arm.end;i+=6){
      const x=src[i],y=src[i+1],f=src[i+2];
      out[i]=bx+f*dx+x*ux+y*vx;out[i+1]=by+f*dy+y*vy;out[i+2]=bz+f*dz+x*uz+y*vz;
    }
    return true;
  }
  window.BayNeighborGestures=Object.freeze({duration,pose,map,mapDriver,cockpit});
})();
