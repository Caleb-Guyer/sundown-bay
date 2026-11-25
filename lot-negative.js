/* Mara's 35 mm camera at the public landing. Coordinates are in the street scene. */
(() => {
  "use strict";
  const key="sundownBay.maraFilm.v1";
  const subject={x:-154.05,z:-88.87,yaw:1.72};
  const notice=BayExposure.props.find(p=>p.kind==="notice");
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const captions={"14A":"Notice of sale, Port Sol public landing","14B":"Luis Vega with his brother’s lunch tin"};
  const locations={
    wheel:{name:"Coast Wheel",caption:"North Boardwalk from the passenger window",reply:"Got the red gondola. Dad could pick it out from halfway across the bay.",
      inscription:"For the driver. He used to count the cabins till our boat tied up. — Mara"},
    luna:{name:"Cine Luna",caption:"Cine Luna from the passenger window",reply:"Look at that gold trim. Same color as the ticket stubs he kept in the visor.",
      inscription:"For the driver. Two balcony seats, every payday. I still have the stubs. — Mara"}
  };
  function jpeg(f){return typeof f?.image==="string"&&f.image.length<=96000&&/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(f.image);}
  function readFrame(f){
    return f&&Object.hasOwn(captions,f.frame)&&jpeg(f)?{frame:f.frame,image:f.image}:null;
  }
  function readWindow(f){return f?.frame==="13"&&Object.hasOwn(locations,f.place)&&jpeg(f)?{frame:"13",place:f.place,image:f.image}:null;}
  function passengerSubject(v){
    if(!v||v.speed<1.3||v.speed>13||Math.abs(v.yawRate)>.52)return null;
    for(const id of ["wheel","luna"]){
      const brief=BaySecondSeat.find(id),p=brief.subject,dx=p.x-v.x,dz=p.z-v.z;
      // Each frontage is visible from its boulevard. Measure the angle from the passenger door.
      if(Math.abs(v.x-(id==="wheel"?144:0))>6.5||Math.abs(dz)>(id==="wheel"?21:14))continue;
      const range=Math.hypot(dx,dz);
      if((dx*Math.cos(v.yaw)-dz*Math.sin(v.yaw))>.82*range)return brief;
    }
    return null;
  }
  function passengerEye(v,brief){
    const layout=bayCarLayout(v.kind),c=Math.cos(v.yaw),s=Math.sin(v.yaw);
    const x=v.x+layout.seatX*c+layout.seatZ*s,z=v.z-layout.seatX*s+layout.seatZ*c,y=v.y+layout.seatY+.72;
    const p=brief.subject,dx=p.x-x,dz=p.z-z,range=Math.hypot(dx,dz);
    return {x,y,z,yaw:Math.atan2(dx,dz),pitch:Math.atan2(p.y-y,range),focal:Math.min(2.8,range/(brief.id==="wheel"?15:8))};
  }
  function readLatent(f){
    if(!f||!Object.hasOwn(locations,f.place)||!f.eye||!["x","y","z","yaw","pitch","focal"].every(k=>Number.isFinite(f.eye[k]))||
      ![f.time,f.night,f.rain,f.angle].every(Number.isFinite)||!Array.isArray(f.traffic)||f.traffic.length>48)return null;
    if(!f.traffic.every(v=>v&&[v.x,v.z,v.yaw,v.track,v.length].every(Number.isFinite)&&typeof v.kind==="string"&&typeof v.color==="string"))return null;
    return f;
  }
  class Archive {
    constructor(){let s;try{s=JSON.parse(localStorage.getItem(key));}catch{}
      this.pending=readFrame(s?.pending);this.published=readFrame(s?.published);this.day=Number.isSafeInteger(s?.day)&&s.day>0?s.day:0;
      this.windowPending=readWindow(s?.windowPending);this.windowPrint=readWindow(s?.windowPrint);
      this.latent=this.windowPending?null:readLatent(s?.latent);
      this.onScreen=!!this.windowPrint&&s?.onScreen===true;this.inEdition=!!this.windowPrint&&s?.inEdition===true;}
    write(){try{localStorage.setItem(key,JSON.stringify({pending:this.pending,published:this.published,day:this.day,windowPending:this.windowPending,windowPrint:this.windowPrint,onScreen:this.onScreen,inEdition:this.inEdition,latent:this.latent}));}catch{}}
    wind(brief,vehicle,hours,wheel,time,cars){
      if(this.windowPending||this.latent)return false;
      const traffic=[];
      for(const v of cars){
        if(v===vehicle||Math.abs(v.x-vehicle.x)>44||Math.abs(v.z-vehicle.z)>44)continue;
        traffic.push({x:v.x,z:v.z,yaw:v.yaw,kind:v.kind,color:v.color,track:v.footprint?.track||.9,length:v.footprint?.halfLength||2.1});
        if(traffic.length===48)break;
      }
      this.latent=readLatent({place:brief.id,eye:passengerEye(vehicle,brief),time,night:hours.night,rain:hours.rain,angle:wheel.angle||0,traffic});
      if(!this.latent)return false;this.write();return true;
    }
    lend(lent){this.onScreen=!!this.windowPrint&&lent===true;this.write();}
    exposeWindow(place,image){
      const f=readWindow({frame:"13",place,image});if(this.windowPending||!f)return false;
      this.windowPending=f;this.latent=null;this.write();return true;
    }
    file(f){this.pending=readFrame(f);this.write();}
    deliver(day=0){
      this.published=this.pending;this.pending=null;this.day=day;this.inEdition=!!this.windowPending;
      if(this.windowPending){this.windowPrint=this.windowPending;this.windowPending=null;this.onScreen=false;}
      this.write();
    }
  }
  const decoded=new WeakMap();
  function photo(f){
    if(!f||typeof Image==="undefined")return null;
    let img=decoded.get(f);
    if(!img){img=new Image();decoded.set(f,img);img.src=f.image;}
    return img;
  }
  class Roll {
    constructor(){this.pan=.045;this.tilt=.035;this.focal=1.97;this.raise=0;this.asked=false;this.frames={};}
    eye(ground){return {x:-150.90,z:-91.18,y:ground+1.55,yaw:-Math.PI/2+this.pan,pitch:this.tilt,focal:this.focal};}
    turn(dx,dy){this.pan=clamp(this.pan+dx,-.36,.97);this.tilt=clamp(this.tilt+dy,-.34,.28);}
    aim(u,v){this.turn(Math.atan((u-.5)*32/(9*this.focal)),Math.atan((.5-v)*2/this.focal));}
    zoom(delta){this.focal=clamp(this.focal+delta,1.48,3.9);}
    ask(useMark=false){
      if(!this.frames["14A"]||this.asked)return false;
      this.asked=true;this.focal=3.2;this.tilt=-.064;
      if(useMark)this.matchPrint();
      return true;
    }
    matchPrint(){const eye=this.eye(0);this.pan=Math.atan2(subject.x-eye.x,subject.z-eye.z)+Math.PI/2;this.focal=3.2;this.tilt=-.064;}
    ready(project,ground){
      const inside=(p,dx,dy)=>p&&Math.abs(p.x-.5)<dx&&Math.abs(p.y-.5)<dy;
      if(!this.frames["14A"]){
        const y=ground(notice.x,notice.z);
        return inside(project(notice.x,y+1.68,notice.z),.18,.2)&&[-1.10,1.10].every(d=>inside(project(notice.x,y+1.68,notice.z+d),.48,.49));
      }
      if(!this.asked||this.raise<.99||this.frames["14B"])return false;
      const y=ground(subject.x,subject.z);
      return inside(project(subject.x,y+1.62,subject.z),.19,.34)&&inside(project(subject.x+.28,y+1.06,subject.z-.22),.45,.44);
    }
    expose(canvas,project,ground){
      if(!this.ready(project,ground))return false;
      const image=BayMeetPhoto.capture(canvas,null,.5,.5,16/9,true);if(!image)return false;
      const frame=this.frames["14A"]?"14B":"14A";this.frames[frame]={frame,image};return true;
    }
  }
  // Use the same actor rig, clothes and metal lunch tins as Dalia's departure.
  // Bake the poses on first sight. Nothing animates or allocates during a city drive.
  function porter(g,step,paper){
    const mesh=new BayPlayerMesh(["#926349","#a59569","#414f54"],"local"),motion=new BayPlayerMotion(),f=step/6;
    motion.handTarget={x:.24,y:1.29,z:.30,weight:f};motion.step(1/60,0,0);mesh.update(motion);
    for(const v of mesh.vertices)g.vertices.push(v);
    for(let i=0;i<2;i++){
      const hand=[0,0,0];mesh.sides[i].forearm.map(mesh.sides[i].handPivot,hand);
      const [x,y,z]=hand,col=i?"#426e83":"#637a60";
      if(paper&&i){
        g.box(x,y-.022,z+.061,.245,.016,.195,"#e9dfc6");
        g.box(x-.082,y-.011,z+.061,.050,.005,.155,"#8b8878");
        g.box(x+.030,y-.011,z+.097,.13,.005,.056,"#546165");
        continue;
      }
      g.box(x,y-.213,z,.27,.20,.19,col);g.box(x,y-.106,z,.282,.036,.20,"#c8c2aa");
      g.box(x,y-.258,z,.272,.018,.193,"#e1cc9a");g.box(x,y-.099,z+.106,.052,.065,.018,"#b48d52");
      for(const side of [-1,1])g.box(x+side*.071,y-.052,z,.017,.096,.022,"#504d41");
      g.box(x,y-.006,z,.16,.019,.024,"#504d41");
    }
  }
  function actor(list,model,ground,raise=0,paper=false){
    const step=Math.round(clamp(raise,0,1)*6),name=(paper?"lot-porter-paper/":"lot-porter/")+step;
    model(name,g=>porter(g,step,paper));list.push([name,subject.x,ground(subject.x,subject.z),subject.z,subject.yaw]);
  }
  window.BayLotNegative={key,Archive,Roll,actor,subject,notice,photo,captions,readFrame,locations,passengerSubject,passengerEye};
})();
