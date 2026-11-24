/* Romy's location book records the car that actually leaves each loading ramp. */
(() => {
  "use strict";
  const sites=[
    {id:"marlin",name:"Salt Print",area:"Sol Promenade",hint:"Look for the sun-faded camera trailer on the promenade across from the Marlin. Approach from the south.",x:162,z:-16,yaw:0,width:5.2,length:7.6,rise:1.65,min:13,max:32,base:.082},
    {id:"foundry",name:"Off the Clock",area:"Foundry Road",hint:"Head south along the east side of Foundry, beyond Gantry, for the steel wedge.",x:-134,z:-109,yaw:Math.PI,width:5.6,length:8.2,rise:2.05,min:18,max:38,base:.077},
    {id:"port",name:"Dry Dock",area:"Port Sol",hint:"Find the timber ramp just south of Tideway, on the port side of Foundry. Approach from the south.",x:-131,z:-14,yaw:0,width:5.4,length:8.4,rise:2.25,min:22,max:43,base:.077}
  ];
  for(const s of sites){
    s.sn=Math.sin(s.yaw);s.cs=Math.cos(s.yaw);s.grade=s.rise/s.length;
    s.runup={...BayDriving.world(s,0,-s.length-22),name:s.name+" · Run-up"};
    s.toe=BayDriving.world(s,0,-s.length);
  }
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v)),round=n=>Math.round(n*100)/100;
  function deck(x,z){
    for(const s of sites){
      const dx=x-s.x,dz=z-s.z;
      if(Math.abs(dx)>11||Math.abs(dz)>11)continue;
      const along=dx*s.sn+dz*s.cs;
      if(along>=-s.length&&along<=0&&Math.abs(dx*s.cs-dz*s.sn)<=s.width*.5)return s;
    }
    return null;
  }
  function elevation(s,x,z){return clamp(s.rise+((x-s.x)*s.sn+(z-s.z)*s.cs)*s.grade,0,s.rise);}
  function along(s,v){return (v.x-s.x)*s.sn+(v.z-s.z)*s.cs;}
  function across(s,v){return (v.x-s.x)*s.cs-(v.z-s.z)*s.sn;}
  function canEnter(v,x,z){
    const s=deck(x,z);if(!s)return true;
    const height=elevation(s,x,z);
    if(height<.36||v.jumpFlight?.height>=s.base+height-.25)return true;
    return deck(v.x,v.z)===s;
  }
  function read(raw){
    const book={known:!!raw?.known,best:{}};
    for(const s of sites){
      const r=raw?.best?.[s.id];
      if(!r||![r.distance,r.peak,r.seconds].every(n=>Number.isFinite(n)&&n>0)||r.seconds>12||r.peak>30||r.distance>s.max+1||
        typeof r.model!=="string"||!Array.isArray(r.trace)||r.trace.length<2||r.trace.length>96)continue;
      if(!r.trace.every(p=>Array.isArray(p)&&p.length===2&&p.every(n=>Number.isFinite(n)&&Math.abs(n)<150)))continue;
      const kind=Object.hasOwn(BayDriving.cars,r.kind)?r.kind:Object.keys(BayDriving.cars).find(id=>BayDriving.cars[id].name===r.model)||"coupe";
      const color=/^#[a-f0-9]{6}$/i.test(r.color)?r.color:"#de6f62";
      book.best[s.id]={distance:r.distance,seconds:r.seconds,peak:r.peak,model:r.model.slice(0,55),kind,color,trace:r.trace.map(p=>p.slice())};
      book.known=true;
    }
    return book;
  }
  function airControl(v,dt,steer){
    const f=v.jumpFlight;
    // The tires carry no cornering or braking force in the air. Trim only changes body attitude.
    f.spin+=(steer*.88-f.spin)*-Math.expm1(-3.1*dt);v.yaw+=f.spin*dt;
    v.wheelSpin+=v.speed*dt/bayCarLayout(v.kind).wheel;v.slip=0;
    v.steer+=(steer*.30-v.steer)*-Math.expm1(-5*dt);
  }
  function takeoff(v,s,old,dt,eligible){
    const prev=along(s,old),now=along(s,v),forward=v.vx*s.sn+v.vz*s.cs;
    const height=elevation(s,old.x,old.z);
    if(height<.24)return;
    const fromLip=prev<=0&&now>=0&&forward>0;
    const fraction=fromLip?clamp(-prev/(now-prev||1),0,1):0;
    const lift=fromLip?s.rise:height,ratio=Math.cos(v.yaw-s.yaw);
    v.jumpFlight={site:s,height:s.base+lift,vy:forward*s.grade,pitch:-Math.atan(s.grade)*ratio,
      spin:v.yawRate||0,time:0,nextSample:.05,peak:lift,trace:[[fromLip?0:prev,lift,0]],
      eligible:eligible&&fromLip&&ratio>.80&&Math.abs(across(s,v))+bayCarLayout(v.kind).track<=s.width*.5,clipped:false};
    return dt*(1-fraction);
  }
  function finish(v,f,q,clean){
    const s=f.site,shape=bayCarLayout(v.kind),delta=v.yaw-s.yaw,bodyWidth=shape.track*Math.abs(Math.cos(delta))+shape.halfLength*Math.abs(Math.sin(delta));
    const wheelReach=Math.max(...shape.axles.map(Math.abs))*Math.abs(Math.cos(delta))+shape.track*Math.abs(Math.sin(delta));
    const distance=along(s,q),side=Math.abs(across(s,q));
    let miss="";
    if(f.clipped||!clean)miss="Something caught the car before the landing.";
    else if(distance-wheelReach<s.min)miss="Landed short. Carry more speed up the ramp.";
    else if(distance+wheelReach>s.max)miss="Past the far stripe. Ease off earlier.";
    else if(side+bodyWidth>s.width*.5||Math.cos(delta)<.94)miss="Set all four wheels down straight inside the paint.";
    const samples=f.trace,trace=[];
    for(let i=0,k=1;i<samples.length;i++){
      const t=f.time*i/(samples.length-1);
      while(k<samples.length-1&&samples[k][2]<t)k++;
      const a=samples[k-1],b=samples[k],u=clamp((t-a[2])/(b[2]-a[2]||1),0,1);
      trace.push([round(a[0]+(b[0]-a[0])*u),round(a[1]+(b[1]-a[1])*u)]);
    }
    const result={site:s,eligible:f.eligible,miss,distance:round(distance),peak:round(f.peak),seconds:round(f.time),trace};
    v.jumpFlight=null;v.pitchRate=clamp(-f.vy*.13,.15,1.5);v.pitch=clamp(f.pitch,-.17,.18);
    v.jumpCompression={time:0,depth:clamp(-f.vy*.010,.025,.14)};
    return result;
  }
  function step(v,old,dt,ground,eligible,hit){
    if(v.jumpCompression){v.jumpCompression.time+=dt;if(v.jumpCompression.time>.44)v.jumpCompression=null;}
    const landedOn=deck(v.x,v.z);
    if(!v.jumpFlight){
      const previous=deck(old.x,old.z);
      if(!previous||landedOn===previous)return null;
      dt=takeoff(v,previous,old,dt,eligible);
      if(!v.jumpFlight)return null;
    }
    const f=v.jumpFlight,s=f.site,was=f.height,oldVy=f.vy;
    f.clipped||=hit;
    const floor=ground(v.x,v.z);
    // Solve contact within the frame so distance and time agree at different refresh rates.
    const predicted=was+oldVy*dt-4.905*dt*dt;
    const landed=predicted<=floor&&oldVy-9.81*dt<=0;
    const used=landed?clamp((oldVy+Math.sqrt(Math.max(0,oldVy*oldVy+19.62*(was-floor))))/9.81,0,dt):dt;
    f.height=landed?floor:was+oldVy*used-4.905*used*used;f.vy=oldVy-9.81*used;
    f.time+=used;f.peak=Math.max(f.peak,f.height-s.base);
    const flightAngle=clamp(-Math.atan2(f.vy,Math.max(6,Math.hypot(v.vx,v.vz))),-.34,.31);
    f.pitch+=(flightAngle-f.pitch)*-Math.expm1(-3.2*used);
    const q=landed?{x:v.x-v.vx*(dt-used),z:v.z-v.vz*(dt-used)}:v;
    if((f.time>=f.nextSample||landed)&&f.trace.length<96){
      f.trace.push([along(s,q),Math.max(0,f.height-s.base),f.time]);f.nextSample=f.time+.05;
    }
    return landed?finish(v,f,q,!hit):null;
  }
  function saveLanding(book,result,v,model){
    if(!result.eligible||result.miss)return 0;
    const {site,distance,peak,seconds,trace}=result,previous=book.best[site.id];
    if(previous&&previous.distance>=distance)return 0;
    book.known=true;book.best[site.id]={distance,peak,seconds,trace,model,kind:v.kind,color:v.color};
    return previous?0:80+(sites.every(s=>book.best[s.id])?90:0);
  }
  const complete=book=>sites.every(s=>book?.best?.[s.id]);
  window.BayPictureJumps={sites,deck,elevation,along,across,canEnter,read,airControl,step,saveLanding,complete};
})();
