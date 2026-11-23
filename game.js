(() => {
  "use strict";
  const $=id=>document.getElementById(id), tau=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z), mod=(v,n)=>(v%n+n)%n;
  const angle=(a,b)=>mod(b-a+Math.PI,tau)-Math.PI;
  const ease=(value,to,rate,dt)=>value+(to-value)*(1-Math.exp(-rate*dt));
  const axes=[-144,-72,0,72,144], nearestAxis=v=>axes.reduce((a,b)=>Math.abs(a-v)<Math.abs(b-v)?a:b);
  const nearStreet=(x,z)=>Math.min(Math.abs(nearestAxis(x)-x),Math.abs(nearestAxis(z)-z))<9;
  const cash=n=>"$"+Math.round(n).toLocaleString("en-US");
  const watch=t=>Math.floor(t/60)+":"+String(Math.floor(t%60)).padStart(2,"0")+"."+Math.floor(t*10)%10;
  const raceWatch=t=>{
    const n=Math.round(t*100);return Math.floor(n/6000)+":"+String(Math.floor(n/100)%60).padStart(2,"0")+"."+String(n%100).padStart(2,"0");
  };
  const deltaText=d=>Math.abs(d)<.005?"Level with best":Math.abs(d).toFixed(2)+" s "+(d<0?"ahead":"behind");
  const course=BayBeachDash.gates;
  const view=new BayView($("world")), cityMesh=new BayMesh(), city=buildBayCity(cityMesh);
  view.add("city",cityMesh);cityMesh.vertices.length=0;
  const solids=city.solids, sound=window.BaySound,garage=city.garage;
  const locations=[
    {x:151,z:-13,name:"Marlin Motel"}, {x:6,z:66,name:"Cine Luna"},
    {x:-138,z:-73,name:"Port Sol"}, {x:-66,z:-137,name:"El Mercado"},
    {x:139,z:140,name:"North Boardwalk"},garage
  ];
  const genres=BayDriving.cars;
  const paints=["#de6f62","#42afa5","#e6b77d","#718dac","#f0d8a9","#976e9a"];
  const resprayPrice=75;
  const finishes=[
    {name:"Motel Coral",color:paints[0]}, {name:"Sea Glass",color:paints[1]},
    {name:"Marina Blue",color:"#426bae"}, {name:"Taxi Gold",color:"#eeb452"},
    {name:"Night Orchid",color:"#9860a4"}, {name:"Pearl White",color:"#eee9da"}
  ];
  const personColors=[
    ["#af7353","#30a292","#eff1d1"],["#754b39","#e99c78","#344557"],
    ["#dbab87","#f6d695","#536071"],["#925c46","#7287ba","#ede3ba"],
    ["#c58166","#f19793","#305c60"],["#694737","#a3c49d","#435772"]
  ];
  const models=new Set(), keys=new Set(), cars=[], walkers=BayLocals.makeWalkers(), patrol=[], skids=[];
  const titleWalkers=walkers.filter(p=>p.name!=="June");
  let nextId=1, play=false, panel="", elapsed=0, active=null, waypoint=null, car=null, heat=0, lastIncident=-100, boxed=0, bumpLock=0, lastHud=-10, lastMap=-10, lastHint="", toastTill=0, radio=false, manualTop=false;
  const chase=new BayPursuit(axes,solids),crashContacts=new Map();
  const backup=new BayBackup(chase,city.cameraObstacles||[]);
  let airBeam=null;
  const repairSeconds=2;
  let serviceVehicle=null,serviceTime=0,paintPreview=null;
  let skidLast=null,transfer=null,streetTime=2.4,hornReady=0,lastTrafficHorn=-12,speechTill=0;
  const hero={x:151,z:-27,y:.076,yaw:-.18};
  const motion=new BayPlayerMotion(),playerMesh=view.gl?new BayPlayerMesh(personColors[0]):null;
  let dashResult=null,ghostMesh=null;
  if(playerMesh)view.add("player",playerMesh,true);
  const cam={x:153,y:3.2,z:-33,yaw:-.18,pitch:-.16};
  const cameraRig=new BayCamera(solids.concat(city.cameraObstacles||[]));
  const skyPainter=new BaySky($("sky"));
  const cameraSnap=()=>cameraRig.reset(car||hero);
  const blankSave=()=>({wallet:0,paid:0,best:0,tuned:false,tapes:[],rides:0,juneReturned:false,dash:null,resprays:{}});
  function readSave(){
    try{const raw=JSON.parse(localStorage.getItem("sundownBay.v1")||"null");if(!raw||typeof raw!=="object")return blankSave();
      const result=blankSave();for(const k of ["wallet","paid","best","rides"])if(Number.isFinite(raw[k])&&raw[k]>=0)result[k]=raw[k];
      result.tuned=raw.tuned===true;result.tapes=Array.isArray(raw.tapes)?[...new Set(raw.tapes.filter(n=>Number.isInteger(n)&&n>=0&&n<5))]:[];
      result.dash=BayBeachDash.readRecord(raw.dash);
      if(raw.resprays&&typeof raw.resprays==="object"&&!Array.isArray(raw.resprays)){
        result.resprays=Object.fromEntries(Object.entries(raw.resprays).filter(([,color])=>finishes.some(f=>f.color===color)));
      }
      result.juneReturned=raw.juneReturned===true&&result.tapes.includes(0);return result;
    }catch{return blankSave();}
  }
  const save=readSave();
  function persist(){try{localStorage.setItem("sundownBay.v1",JSON.stringify(save));}catch{/* Browser ephemeral storage still permits a full session. */}}
  try{
    const prefs=JSON.parse(localStorage.getItem("sundownBay.camera")||"{}");
    if(Number.isFinite(prefs.zoom))cameraRig.zoom=clamp(prefs.zoom,.68,1.65);
    if([.72,1,1.38].includes(prefs.sensitivity))cameraRig.sensitivity=prefs.sensitivity;
    cameraRig.assist=prefs.assist===true;manualTop=prefs.overhead===true;
  }catch{/* The session can still use all camera controls. */}
  function saveCamera(){try{localStorage.setItem("sundownBay.camera",JSON.stringify({zoom:cameraRig.zoom,sensitivity:cameraRig.sensitivity,assist:cameraRig.assist,overhead:manualTop}));}catch{}}
  function model(name,build){if(!view.gl||models.has(name))return;const g=new BayMesh();build(g);view.add(name,g);models.add(name);}
  function carSkin(kind,color){const key=kind+color;model(key,g=>buildBayCar(g,kind,color));return key;}
  const vehicleRigs=new Map();
  function vehicleRig(v){
    if(vehicleRigs.has(v.model))return vehicleRigs.get(v.model);
    const pair=()=>({[-1]:new BayMesh(),1:new BayMesh()});
    const parts={doors:pair(),wheels:pair(),brakes:new BayMesh(),reverse:new BayMesh()},shell=new BayMesh();
    buildBayCar(shell,v.kind,v.color,parts);
    const install=(name,mesh)=>{const key=v.model+"/"+name;view.add(key,mesh);return key;};
    const rig={shell:install("body",shell),brakes:install("brake",parts.brakes),reverse:install("reverse",parts.reverse),doors:{},wheels:{}};
    for(const side of [-1,1]){
      rig.doors[side]=install("door"+side,parts.doors[side]);
      rig.wheels[side]=install("wheel"+side,parts.wheels[side]);
    }
    vehicleRigs.set(v.model,rig);return rig;
  }
  model("traffic-driver",g=>{g.box(0,.23,0,.32,.34,.18,"#627c76");g.box(0,.51,0,.164,.21,.15,"#a0795d");g.box(0,.61,-.006,.174,.076,.16,"#433b39");});
  model("horn-wave",g=>{
    for(const side of [-1,1])for(let i=0;i<5;i++){
      const rim=(j,r)=>{const a=(j/5-.5)*1.30;return [side*(.12+Math.cos(a)*r),Math.sin(a)*r,0];};
      g.quad(rim(i,.47),rim(i+1,.47),rim(i+1,.56),rim(i,.56),"#ffe39a");
      g.quad(rim(i,.69),rim(i+1,.69),rim(i+1,.755),rim(i,.755),"#ffcd79");
    }
  });
  BayStreetArt.install(model);
  BayBeachDash.install(model);
  function personSkin(style,role,pose,gesture=0){
    const key="person/"+role+"/"+style+"/"+pose+"/"+gesture;
    model(key,g=>buildBayPerson(g,...personColors[style],pose===0?0:(pose-1)*Math.PI/2+Math.PI/4,role,gesture));return key;
  }
  const poseFor=(p)=>p.moving?1+Math.floor(mod(p.phase,tau)/tau*4):0;
  model("flash-red",g=>g.box(-.232,1.585,-.17,.403,.125,.222,"#fff3b5"));
  model("flash-blue",g=>g.box(.232,1.585,-.17,.403,.125,.222,"#c2fcff"));
  function disc(name,w,d,color){
    model(name,g=>{for(let i=0;i<12;i++){const a=i/12*tau,b=(i+1)/12*tau;g.tri([0,0,0],[Math.cos(a)*w,0,Math.sin(a)*d],[Math.cos(b)*w,0,Math.sin(b)*d],color);}});
  }
  disc("shadowCar",1.15,2.27,"#454b50");disc("shadowFoot",.39,.24,"#665e60");
  model("skid",g=>g.quad([-.095,0,-.4],[.095,0,-.4],[.095,0,.4],[-.095,0,.4],"#454550"));
  function ring(name,color,radius){
    model(name,g=>{for(let j=0;j<28;j++){if(j%7===6)continue;const a=j*tau/28,b=(j+1)*tau/28,inner=radius-.24;
      g.quad([Math.sin(a)*radius,.14,Math.cos(a)*radius],[Math.sin(b)*radius,.14,Math.cos(b)*radius],[Math.sin(b)*inner,.14,Math.cos(b)*inner],[Math.sin(a)*inner,.14,Math.cos(a)*inner],color);}});
  }
  ring("destRing","#85ffe2",3.4);ring("contactRing","#ffbb7a",2.8);
  model("beacon",g=>{g.tri([-.5,.55,0],[.5,.55,0],[0,-.02,0],"#adffe0");g.tri([-.3,.5,-.16],[.3,.5,-.16],[0,.18,-.16],"#176462");});
  function cassette(g,blueDot){
    g.box(0,0,0,.93,.59,.23,"#ffba76");
    for(const side of [-1,1]){
      g.box(0,.055,side*.125,.79,.32,.03,"#294c52");
      g.box(-.22,.055,side*.149,.115,.115,.035,"#f6dcac");g.box(.22,.055,side*.149,.115,.115,.035,"#f6dcac");
      g.box(0,-.19,side*.132,.47,.07,.03,"#ed865f");
      if(blueDot)for(let i=0;i<8;i++){
        const a=i*tau/8,b=(i+1)*tau/8,z=side*.148;
        g.tri([0,.075,z],[.078*Math.cos(a),.075+.078*Math.sin(a),z],[.078*Math.cos(b),.075+.078*Math.sin(b),z],"#70c8ff");
      }
    }
  }
  model("tape",g=>cassette(g,false));model("motel-tape",g=>cassette(g,true));
  const tapes=[
    {x:155,z:-55,name:"Motel demo"},{x:186,z:83,name:"Saltwater sessions"},{x:-7,z:137,name:"Last picture show"},
    {x:-151,z:-104,name:"Dockside dub"},{x:-82,z:-149,name:"Market mixtape"}
  ];
  const valid=(x,z,r=.42)=>x>=-184+r&&x<=210-r&&z>=-182+r&&z<=182-r&&!solids.some(s=>Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r);
  // Bring any sidewalk collectible that overlaps a facade out onto its nearest street.
  for(const t of tapes){if(!valid(t.x,t.z,.65)){const ax=nearestAxis(t.x),az=nearestAxis(t.z);if(Math.abs(ax-t.x)<Math.abs(az-t.z))t.x=ax+5.5;else t.z=az+5.5;}}
  function addCar(kind,color,x,z,yaw,path=null,pace=0){
    // The original spawn identifies the same car even after it moves or the fleet is reordered.
    const paintKey=kind+"@"+x.toFixed(2)+","+z.toFixed(2);
    color=save.resprays[paintKey]||color;
    const v={id:nextId++,kind,color,paintKey,x,z,yaw,path,pace,corner:1,model:carSkin(kind,color),speed:0,vx:0,vz:0,wait:0,used:false,blocked:0,lean:0};
    BayDriving.settle(v);v.doorSide=-1;v.doorAngle=0;cars.push(v);return v;
  }
  function laneLoop(ix,iz,w,d,reverse){
    let pts=[[axes[ix],axes[iz]],[axes[ix+w],axes[iz]],[axes[ix+w],axes[iz+d]],[axes[ix],axes[iz+d]]];
    if(reverse)pts=pts.reverse();
    const side=(a,b)=>{const dx=b[0]-a[0],dz=b[1]-a[1],s=Math.hypot(dx,dz);return [dz/s*2.5,-dx/s*2.5];};
    return pts.map((p,i)=>{const a=side(pts[(i+3)%4],p),b=side(p,pts[(i+1)%4]);return{x:p[0]+a[0]+b[0],z:p[1]+a[1]+b[1]};});
  }
  addCar("coupe",paints[0],149.0,-22.8,-.015); addCar("cab","#eeb452",77.2,19,Math.PI);
  addCar("van",paints[4],-149,-83,Math.PI);addCar("hatch",paints[1],-64,5.0,Math.PI/2);
  addCar("coupe",paints[3],12,77.1,Math.PI/2);addCar("van",paints[5],-66.8,-118,0);
  addCar("hatch",paints[2],139,123,Math.PI);addCar("cab","#eeb452",-21,-149,Math.PI/2);
  const loops=[[2,2,2,1,false],[3,1,1,2,true],[1,2,2,2,false],[0,0,2,2,true],[0,2,2,1,true],[1,0,3,1,false],[0,1,1,3,false],[1,1,2,1,false],[2,0,2,2,true],[1,3,3,1,false],[0,0,4,4,true]];
  loops.forEach(([ix,iz,w,d,rev],i)=>{
    const path=laneLoop(ix,iz,w,d,rev),j=i%4,k=(j+1)%4,f=.15+(i%5)*.14,a=path[j],b=path[k],kind=["hatch","coupe","cab","van"][i%4];
    const v=addCar(kind,kind==="cab"?"#edb758":paints[(i+1)%6],a.x+(b.x-a.x)*f,a.z+(b.z-a.z)*f,Math.atan2(b.x-a.x,b.z-a.z),path,5+(i%5)*.55);v.corner=k;
  });
  // Stagger opposite lanes at the beachfront. The first intersection is already in use when you arrive.
  const rushHour=[[3,1,1,2,true,1,.72,"cab"],[3,1,1,2,false,1,.22,"hatch"],[2,2,2,1,false,0,.65,"van"],
    [0,1,2,2,false,2,.30,"coupe"],[1,1,1,2,true,0,.45,"hatch"],[2,0,1,2,false,1,.65,"cab"]];
  rushHour.forEach(([ix,iz,w,d,rev,j,f,kind],i)=>{const path=laneLoop(ix,iz,w,d,rev),k=(j+1)%4,a=path[j],b=path[k];
    const v=addCar(kind,kind==="cab"?"#e4ad4a":paints[(i+2)%6],a.x+(b.x-a.x)*f,a.z+(b.z-a.z)*f,Math.atan2(b.x-a.x,b.z-a.z),path,6.0+i*.44);v.corner=k;v.speed=v.pace;});
  const pos=()=>car||hero;
  function cameraSubject(){
    if(!transfer)return pos();
    const f=motion.ride?.seat||0,v=transfer.v;
    return {x:hero.x+(v.x-hero.x)*f,z:hero.z+(v.z-hero.z)*f,yaw:hero.yaw};
  }
  const district=(p)=>p.x>158?"Sol Beach":p.x>112?"Ocean Drive":p.x< -102&&p.z<10?"Port Sol":p.z< -92?"El Mercado":p.z>96&&p.x>43?"Boardwalk":p.x< -65?"Old Palms":"Neon Mile";
  const formatVehicle=v=>genres[v.kind].name;
  function footLevel(x,z){
    if(x>184.5&&Math.abs(z+119)<2.25)return .356;
    if(x>166.45)return .007;
    if(x>159.5)return .082;
    if(x>=151)return .076;
    const dx=Math.abs(x-nearestAxis(x)),dz=Math.abs(z-nearestAxis(z));
    if((dx<6.9&&Math.abs(dz-8.3)<1.1)||(dz<6.9&&Math.abs(dx-8.3)<1.1))return .109;
    return Math.min(dx,dz)<7 ? .040 : .077;
  }
  function resetFeet(){motion.reset();hero.y=footLevel(hero.x,hero.z);}
  function note(head,line,seconds=3.2){
    $("toast").children[0].textContent=head;$("toast").children[1].textContent=line;$("toast").hidden=false;toastTill=elapsed+seconds;
  }
  function playStart(){
    if(play)return;play=true;$("intro").hidden=true;$("hud").hidden=false;document.activeElement?.blur();cameraSnap();
    try{if(localStorage.getItem("sundownBay.audio")==="on"){radio=sound.setEnabled(true);$("audioKey").querySelector("span").textContent=radio?"Sol FM":"Sound off";}}catch{}
    captureMouse();note("Marlin Motel",cars[0].color===paints[0]?"Keys are in the coral coupe.":"Your "+formatVehicle(cars[0])+" is out front.",3.3);
  }
  function enterable(){
    let best=null,d=5.1;
    for(const v of cars){const n=dist(hero,v);if(n<d&&(!v.path||v.speed<4)){best=v;d=n;}}
    return best;
  }
  function talk(){
    if(!active&&!car&&dist(hero,course[0])<4){startJob("dash");return;}
    const p=BayLocals.closestSpeaker(walkers,hero);if(!p)return;
    if(!p.external){p.wait=Math.max(p.wait,4.6);p.alert=1.9;p.yaw=Math.atan2(hero.x-p.x,hero.z-p.z);}
    let text;
    if(p.name==="June"&&save.tapes.includes(0)){
      if(!save.juneReturned){
        save.juneReturned=true;save.wallet+=35;persist();sound.cue("paid");note("Motel demo","June slipped you $35.",3.4);
        text="There it is! That's my brother on drums. Here, let me buy you dinner.";
      }else text="Side A is the band. Side B is eight minutes of my dad asking if it's recording.";
    }else text=heat>1?"Those lights behind you? They're getting closer.":p.lines[p.spoken++%p.lines.length];
    const el=$("speech");el.children[0].textContent=p.name;el.children[1].textContent=text;el.hidden=false;speechTill=elapsed+5.5;
  }
  function honk(){
    if(elapsed<hornReady)return;hornReady=elapsed+.67;sound.cue("horn");
    for(const p of walkers){if(dist(p,car)<16){p.alert=1.35;p.gesture=1;p.yaw=Math.atan2(car.x-p.x,car.z-p.z);}}
    for(const v of cars){if(v!==car&&v.path&&dist(v,car)<9){v.wait=Math.max(v.wait,.42);}}
  }
  function switchCar(){
    if(transfer)return;
    const v=car||enterable();
    if(!v){note("On foot","Walk up to a parked or stopped car.",1.9);return;}
    if(car&&Math.max(Math.abs(v.speed),Math.hypot(v.vx,v.vz))>4){note("Driver's seat","Slow down to step out.",1.8);return;}
    if(!car&&motion.jumpTime>=0){note("Driver's seat","Land beside the car.",1.5);return;}
    const approach=doorPlan(v,!!car);
    if(!approach){note("Driver's seat",car?"Both doors need more room.":"Walk around to a clear door.",2);return;}
    if(active?.dash){active=null;note("Low Tide Dash","You left the course.",2);}
    dashResult=null;skidLast=null;
    transfer={v,exiting:!!car,side:approach.side,points:approach.points,next:0,
      parked:!car||Math.hypot(v.vx,v.vz)<.16,p:car?1:0,aligned:!!car,turnTime:0};
    if(!car){BayDriving.settle(v);v.reaction=null;v.hornAt=-100;}
    lastHud=-10;
  }
  function doorPlan(v,exiting){
    const clear=(x,z,r)=>{
      if(!valid(x,z,r))return false;
      for(const o of (patrol.length?cars.concat(patrol):cars)){
        if(o===v||Math.abs(o.x-x)>3||Math.abs(o.z-z)>3)continue;
        if(BayDriving.clearance(o,{x,z})<r)return false;
      }
      return true;
    };
    return BayCarAccess.plan(v,hero,exiting,clear);
  }
  function stepTransfer(dt){
    const a=transfer,v=a.v;
    if(!a.parked){
      drive(dt,true);if(Math.hypot(v.vx,v.vz)>.14)return;
      const plan=doorPlan(v,true);
      if(!plan){transfer=null;note("Driver's seat","Give the doors a little more room.",2);return;}
      a.side=plan.side;a.parked=true;
    }
    if(a.exiting)BayDriving.step(v,dt,false,false,0,false,1,false,true);
    if(a.next<a.points.length){
      const q=a.points[a.next],dx=q.x-hero.x,dz=q.z-hero.z,len=Math.hypot(dx,dz);
      const step=Math.min(len,dt*3.55);
      if(len>.002){
        const facing=hero.yaw;hero.x+=dx*step/len;hero.z+=dz*step/len;
        hero.yaw+=angle(facing,Math.atan2(dx,dz))*-Math.expm1(-16*dt);
        hero.y=ease(hero.y,footLevel(hero.x,hero.z),24,dt);
        motion.step(dt,step,(hero.yaw-facing)/Math.max(dt,.0001));
      }
      if(len<=step+.002)a.next++;
      return;
    }
    if(!a.aligned){
      a.turnTime+=dt;const wanted=v.yaw-a.side*.63;
      hero.yaw+=angle(hero.yaw,wanted)*-Math.expm1(-20*dt);
      motion.step(dt,0,0);
      if(Math.abs(angle(hero.yaw,wanted))<.025||a.turnTime>.27)a.aligned=true;
      return;
    }
    const was=a.p;
    a.p=clamp(a.p+(a.exiting?-dt/1.42:dt/1.57),0,1);
    if((was>.13&&a.p<=.13)||(was<.935&&a.p>=.935))sound.cue("enter");
    BayCarAccess.pose(v,a.side,a.p,hero,motion,footLevel,dt);
    if(a.exiting?a.p>0:a.p<1)return;
    v.doorAngle=0;transfer=null;lastHud=-10;lastMap=-10;skidLast=null;
    if(a.exiting){car=null;resetFeet();BayDriving.settle(v);return;}
    const borrowed=!!v.path;v.path=null;v.used=true;car=v;
    if(borrowed){addHeat(1);note("Dispatch","A driver called in the switch.",2.3);}
  }
  function clearPatrol(){patrol.length=0;boxed=0;lastIncident=-100;crashContacts.clear();chase.reset();backup.reset();}
  function addHeat(n){
    const prev=heat;heat=Math.min(5,heat+n);lastIncident=elapsed;
    chase.report(pos(),car?car.vx:motion.vx,car?car.vz:motion.vz);lastHud=-10;
    if(!prev)sound.cue("heat");
  }
  function reportCrash(other,inward,closing){
    if(inward<4||closing<5.8||crashContacts.has(other))return;
    crashContacts.set(other,true);
    if(!heat&&elapsed-lastIncident>25){
      lastIncident=elapsed;note("Traffic call","Driver reported the crash. Another wreck will bring patrol.",3.6);return;
    }
    const prior=heat;addHeat(1);
    if(prior<5&&heat===5)note("Bay Patrol","Air One, join the search.",3);
    else if(prior<4&&heat===4)note("Bay Patrol","Spike crews on standby.",3);
    else if(prior<3&&heat===3)note("Bay Patrol","Set up a roadblock on the next approach.",3);
    else note("Bay Patrol",!prior?"Multiple wrecks near "+district(pos())+". Units responding.":"Another collision called in.",3);
  }
  const venues={wheel:{x:139,z:140,name:"Boardwalk Pier"},motel:locations[0],cinema:locations[1],port:locations[2],market:locations[3]};
  const jobs=[
    {id:"dash",name:"Low Tide Dash",by:"Sol Beach Lifeguards",desc:"Race your ghost from the boardwalk to the lifeguard tower. Each clean hurdle earns an extra $15.",pay:90},
    {id:"getaway",name:"The Marlin Job",by:"Jules",desc:"Pick up your partner at the motel. Bring the car to Port Sol while the city is looking for you.",pay:320},
    {id:"fare",name:"Last Fare",by:"Bay Cab",desc:"Pick up a local and take them across town. A quick ride earns a bigger tip.",pay:150},
    {id:"tape",name:"Dead Air",by:"Sol FM",desc:"Meet Nia on foot at Cine Luna. Get the master tape to the DJ on the North Boardwalk.",pay:185},
    {id:"race",name:"Coastline Circuit",by:"Sol Motor Club",desc:"Run four checkpoints along the coast and race your best time.",pay:205}
  ];
  function startJob(id){
    if(active)return;
    const j=jobs.find(v=>v.id===id);if(!j)return;
    dashResult=null;
    if(id==="dash"){
      active={job:j,stops:course,index:0,clock:0,running:false,dash:null,ghost:null,showGhost:false};
      waypoint=null;closePanel();sound.cue("job");
      if(!car&&!transfer&&!heat&&dist(hero,course[0])<35)lineUpDash();
      else note(j.by,"Meet us on foot at the chalk line.",3.2);
      return;
    }
    let stops;
    if(id==="getaway")stops=[venues.motel,venues.port];
    if(id==="tape")stops=[venues.cinema,venues.wheel];
    if(id==="fare"){
      const order=[[3,4],[1,0],[4,2],[0,3],[2,1]],pair=order[save.rides%order.length];stops=pair.map(n=>locations[n]);
    }
    if(id==="race")stops=[{x:144,z:0,name:"Start on Ocean Drive"},{x:144,z:139,name:"Boardwalk turn"},{x:72,z:141,name:"Marina bend"},{x:72,z:1,name:"Neon Mile turn"},{x:141,z:0,name:"Ocean Drive finish"}];
    active={job:j,stops,index:0,clock:0,running:false};waypoint=null;closePanel();sound.cue("job");
    const brief={getaway:"“Meet me outside the Marlin. Bring wheels.”",fare:"Dispatch sent the pickup.",tape:"“I'm outside the cinema. Come grab the master tape.”",race:"Roll through the start marker to begin."};
    note(j.by,brief[id]);
  }
  function lineUpDash(){
    const start=course[0];
    hero.x=start.x-start.nx*1.75;hero.z=start.z-start.nz*1.75;hero.yaw=start.yaw;
    resetFeet();cameraSnap();
    active.index=0;active.clock=0;active.running=false;
    active.dash=new BayBeachDash.Run(hero);
    active.ghost=save.dash?.trace?new BayBeachDash.Ghost(save.dash.trace):null;active.showGhost=false;
    if(ghostMesh)ghostMesh.lastRevision=-1;
    $("toast").hidden=true;$("speech").hidden=true;lastHud=-10;lastMap=-10;
  }
  function retryDash(){
    if(car||heat)return;
    if(active?.dash){lineUpDash();return;}
    if(!active&&dashResult&&elapsed<dashResult.until){
      startJob("dash");if(!active.dash)lineUpDash();
    }
  }
  function advanceDash(dt){
    if(car)return;
    if(!active.dash){if(dist(hero,course[0])<3.6)lineUpDash();return;}
    const run=active.dash,event=run.step(dt,hero,motion);
    active.index=run.index;active.clock=run.clock;active.running=run.index>0;
    if(event?.type==="finish"){
      const previous=save.dash?.splits.at(-1)??null,record=previous===null||run.clock<previous;
      if(record)save.dash={splits:run.splits,trace:run.trace};
      const pay=active.job.pay+15*run.clean;save.wallet+=pay;save.paid++;persist();
      dashResult={run,previous,record,pay,until:elapsed+25};active=null;
      sound.cue("paid");lastHud=-10;lastMap=-10;return;
    }
    if(event){sound.cue("job");lastHud=-10;lastMap=-10;}
    active.showGhost=!!(active.ghost&&active.running&&active.ghost.update(run.clock));
  }
  function finishJob(){
    const {job,clock}=active;let amount=job.pay,msg="";
    if(job.id==="fare"){const tip=Math.round(clamp(90-clock,0,80));amount+=tip;save.rides++;msg=" • "+cash(tip)+" tip";}
    if(job.id==="race"){const record=!save.best||clock<save.best;if(record)save.best=clock;msg=" • "+watch(clock)+(record?"  NEW BEST":"");}
    save.wallet+=amount;save.paid++;persist();active=null;sound.cue("paid");note("Job complete","+"+cash(amount)+msg,5);
  }
  const currentTarget=()=>active?active.stops[active.index]:waypoint;
  function advanceJob(dt){
    const p=pos();
    if(transfer){if(active?.running)active.clock+=dt;return;}
    if(!active){
      if(waypoint&&dist(p,waypoint)<5){
        if(waypoint.kind!=="garage"||!car?.flatSide)note("City map","Waypoint reached.",1.7);
        waypoint=null;
      }
      return;
    }
    if(active.job.id==="dash"){advanceDash(dt);return;}
    if(active.running)active.clock+=dt;
    const j=active.job,t=currentTarget(),isRace=j.id==="race";
    if(j.id==="tape"){if(car||dist(p,t)>3.6)return;}
    else if(!car||dist(p,t)>(isRace?9:7.7)||(!isRace&&Math.abs(car.speed)>7))return;
    if(active.index===active.stops.length-1){finishJob();return;}
    active.index++;active.running=true;sound.cue("job");
    if(j.id==="getaway"){addHeat(2);note("Jules","“Port Sol. I'll show you the loading bay when I see the crane.”",4);}
    else if(j.id==="fare")note("Passenger","“"+active.stops[1].name+", please.”",3);
    else if(j.id==="tape")note("Nia","“The DJ's waiting by the pier. Hand it to him in person.”",4);
    else note("Coastline Circuit",active.index===1?"Clock started. Follow the mint gates.":"Checkpoint "+(active.index-1)+" of 4",1.8);
  }
  function checkTapes(){
    tapes.forEach((t,i)=>{if(!save.tapes.includes(i)&&dist(pos(),t)<3.05){
      save.tapes.push(i);save.wallet+=45;persist();sound.cue("paid");
      note("Pirate radio tape "+save.tapes.length+"/5",i===0?"Blue-dot demo  ·  +$45. Find June at the Marlin.":t.name+"  •  +$45",4);
    }});
  }
  const held=(...codes)=>codes.some(k=>keys.has(k));
  function footClear(x,z,r){
    if(!valid(x,z,r))return false;
    for(const v of (patrol.length?cars.concat(patrol):cars)){
      if(Math.abs(v.x-x)>3||Math.abs(v.z-z)>3)continue;
      const gap=BayDriving.clearance(v,{x,z});
      if(gap<.17&&gap<BayDriving.clearance(v,hero)-.0001)return false;
    }
    return true;
  }
  function tryMove(p,dx,dz,r){
    let hit=false; if(footClear(p.x+dx,p.z,r))p.x+=dx;else hit=true;
    if(footClear(p.x,p.z+dz,r))p.z+=dz;else hit=true;return hit;
  }
  function walk(dt){
    const f=(held("KeyW","ArrowUp")?1:0)-(held("KeyS","ArrowDown")?1:0),r=(held("KeyD","ArrowRight")?1:0)-(held("KeyA","ArrowLeft")?1:0);
    const yaw=cameraRig.yaw,dx=Math.sin(yaw)*f+Math.cos(yaw)*r,dz=Math.cos(yaw)*f-Math.sin(yaw)*r,n=Math.hypot(dx,dz);
    const speed=(held("ShiftLeft","ShiftRight")?7.1:3.65)*(1-.70*motion.stumble/.65);
    const tx=n?speed*dx/n:0,tz=n?speed*dz/n:0;
    const rate=motion.lift>.08?(n?7:3.4):(n?(speed>4?14:26):21),blend=-Math.expm1(-rate*dt);
    // Integrate the eased velocity over the step so different frame rates cover the same ground.
    const stepX=tx*dt+(motion.vx-tx)*blend/rate,stepZ=tz*dt+(motion.vz-tz)*blend/rate;
    motion.vx+=(tx-motion.vx)*blend;motion.vz+=(tz-motion.vz)*blend;
    const oldX=hero.x,oldZ=hero.z,oldYaw=hero.yaw;
    if(stepX||stepZ)tryMove(hero,stepX,stepZ,.36);
    const movedX=hero.x-oldX,movedZ=hero.z-oldZ,distance=Math.hypot(movedX,movedZ);
    if(movedX===0||(!n&&Math.abs(motion.vx)<.004))motion.vx=0;
    if(movedZ===0||(!n&&Math.abs(motion.vz)<.004))motion.vz=0;
    if(n){
      const direction=distance>.0002?Math.atan2(movedX,movedZ):Math.atan2(dx,dz);
      hero.yaw+=angle(hero.yaw,direction)*-Math.expm1(-14*dt);
    }
    hero.y=ease(hero.y,footLevel(hero.x,hero.z),27,dt);
    motion.step(dt,distance,dt?(hero.yaw-oldYaw)/dt:0);
  }
  function fitsCar(v,x,z,yaw){
    const s=bayCarLayout(v.kind),r=s.track-.075,reach=s.halfLength-r-.05,dx=Math.sin(yaw)*reach,dz=Math.cos(yaw)*reach;
    return valid(x,z,r)&&valid(x+dx,z+dz,r)&&valid(x-dx,z-dz,r);
  }
  function skidMarks(v,surface){
    if(v.slip<.30||surface<.8){skidLast=null;return;}
    const shape=bayCarLayout(v.kind),axle=BayDriving.world(v,0,shape.axles[0]);
    if(!skidLast){skidLast=axle;return;}
    const dx=axle.x-skidLast.x,dz=axle.z-skidLast.z,d=Math.hypot(dx,dz);
    if(d<.49)return;
    const yaw=Math.atan2(dx,dz),count=Math.min(5,Math.ceil(d/.7));
    for(let i=1;i<=count;i++)for(const side of [-1,1]){
      const f=(i-.5)/count;
      skids.push({x:skidLast.x+dx*f+Math.cos(v.yaw)*side*(shape.track-.085),
        z:skidLast.z+dz*f-Math.sin(v.yaw)*side*(shape.track-.085),yaw,time:elapsed});
    }
    if(skids.length>96)skids.splice(0,skids.length-96);skidLast=axle;
  }
  function drive(dt,parking=false){
    const v=car,oldX=v.x,oldZ=v.z,oldYaw=v.yaw,surface=v.x>166.45?.55:nearStreet(v.x,v.z)?1:.84;
    if(serviceVehicle===v&&!heat&&!held("KeyW","ArrowUp","KeyS","ArrowDown"))parking=true;
    const steering=parking?0:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    BayDriving.step(v,dt,!parking&&held("KeyW","ArrowUp"),!parking&&held("KeyS","ArrowDown"),steering,!parking&&held("Space"),surface,save.tuned,parking);
    if(Math.abs(v.yaw-oldYaw)>.00001&&!fitsCar(v,v.x,v.z,v.yaw)&&fitsCar(v,v.x,v.z,oldYaw)){v.yaw=oldYaw;v.yawRate*=.3;}
    let impact=0;
    const x=v.x+v.vx*dt,z=v.z+v.vz*dt;
    if(x!==v.x){if(fitsCar(v,x,v.z,v.yaw))v.x=x;else{impact=Math.abs(v.vx);v.vx*=-.10;}}
    if(z!==v.z){if(fitsCar(v,v.x,z,v.yaw))v.z=z;else{impact=Math.max(impact,Math.abs(v.vz));v.vz*=-.10;}}
    if(impact>5&&bumpLock<=0){sound.cue("hit");bumpLock=.7;}
    for(const other of (patrol.length?cars.concat(patrol):cars)){
      if(other===v)continue;
      const hit=BayDriving.contact(v,other);
      if(!hit){if(crashContacts.has(other)&&dist(v,other)>6.3)crashContacts.delete(other);continue;}
      const {nx,nz,depth}=hit,out=Math.min(.45,depth+.012);
      if(fitsCar(v,v.x+nx*out,v.z+nz*out,v.yaw)){v.x+=nx*out;v.z+=nz*out;}
      const inward=Math.max(0,-v.vx*nx-v.vz*nz),pace=other.path||other.kind==="cruiser"?other.speed:0;
      const closing=inward+pace*(nx*Math.sin(other.yaw)+nz*Math.cos(other.yaw));
      if(!parking)reportCrash(other,inward,closing);
      v.vx+=nx*inward*1.10;v.vz+=nz*inward*1.10;v.yawRate*=Math.exp(-3*dt);other.wait=1.4;
      if(closing>4.8&&bumpLock<=0){sound.cue("hit");bumpLock=.7;}
    }
    if(backup.driveThrough(v,dt,oldX,oldZ,oldYaw)){
      const side=v.flatSide<0?"left":"right";
      note(tireStatus(v),"Pulling "+side+". Steer "+(v.flatSide<0?"right":"left")+" to hold your line.",3.3);
      lastHud=-10;
    }
    BayDriving.signedSpeed(v);skidMarks(v,surface);
    BayCarAccess.pose(v,v.doorSide,1,hero,motion,footLevel,dt);
  }
  function inServiceBay(v){
    const x=Math.abs(v.x-garage.x),z=v.z-garage.z;
    if(x>garage.halfWidth||Math.abs(z)>garage.halfDepth)return false;
    const shape=bayCarLayout(v.kind),sn=Math.abs(Math.sin(v.yaw)),cs=Math.abs(Math.cos(v.yaw));
    const across=cs*shape.track+sn*shape.halfLength,along=sn*shape.track+cs*shape.halfLength;
    return x+across<=garage.halfWidth+.12&&z+along<=garage.halfDepth-.18;
  }
  function serviceGarage(dt){
    const v=car;
    if(!v?.flatSide||heat||transfer||!inServiceBay(v)||Math.hypot(v.vx,v.vz)>1.6||held("KeyW","ArrowUp","KeyS","ArrowDown")){
      serviceVehicle=null;serviceTime=0;return;
    }
    if(serviceVehicle!==v){serviceVehicle=v;serviceTime=0;}
    serviceTime+=dt;
    if(serviceTime+1e-6<repairSeconds)return;
    const fixed=tirePosition(v);
    v.flatSide=0;v.flatAxle=null;v.flatLoad=0;BayDriving.settle(v);
    serviceVehicle=null;serviceTime=0;lastHud=lastMap=-10;
    note(garage.name,fixed+" tire replaced.",3);
  }
  function serviceLift(v){
    if(v!==serviceVehicle)return 0;
    const p=serviceTime/repairSeconds,t=clamp(Math.min(p,1-p)*4.5,0,1);
    return .15*t*t*(3-2*t);
  }
  function readyForPaint(v){
    return v&&v===car&&!heat&&!transfer&&!v.flatSide&&inServiceBay(v)&&Math.hypot(v.vx,v.vz)<=.8;
  }
  function buyRespray(v,finish){
    if(panel!=="respray"||!readyForPaint(v)||!finishes.includes(finish)||finish.color===v.color||save.wallet<resprayPrice)return false;
    v.model=carSkin(v.kind,finish.color);
    v.color=finish.color;save.resprays[v.paintKey]=v.color;save.wallet-=resprayPrice;persist();
    closePanel();note(garage.name,formatVehicle(v)+" · "+finish.name+"  −"+cash(resprayPrice),3.4);
    return true;
  }
  function spaceToSwerve(v,x,z,yaw,ahead,checkPlayer=false){
    if(Math.min(Math.abs(x-nearestAxis(x)),Math.abs(z-nearestAxis(z)))>5.95||!fitsCar(v,x,z,yaw))return false;
    const probe={kind:v.kind,x,z,yaw};
    if(backup.roadblock?.units.some(u=>BayDriving.contact(probe,u)))return false;
    for(const other of cars){
      if(other===v||(other===car&&!checkPlayer)||Math.abs(other.x-x)>11||Math.abs(other.z-z)>11)continue;
      const travel=other.path?other.speed*ahead:0;
      const at=travel?{kind:other.kind,x:other.x+Math.sin(other.yaw)*travel,z:other.z+Math.cos(other.yaw)*travel,yaw:other.yaw}:other;
      if(BayDriving.contact(probe,at))return false;
    }
    for(const w of walkers){
      if(Math.abs(w.x-x)>6||Math.abs(w.z-z)>6)continue;
      if(BayDriving.clearance(probe,w)<.65)return false;
      if(w.startle&&BayDriving.clearance(probe,{x:w.startle.endX,z:w.startle.endZ})<.65)return false;
    }
    return true;
  }
  function chooseSwerve(v,ux,uz,offset,remaining,preferred){
    if(v.speed<1.5||remaining<3)return 0;
    const size=v.kind==="van"?1.35:1.78,yaw=Math.atan2(ux,uz);
    for(const side of [preferred,-preferred]){
      const target=size*side;
      let clear=true;
      for(let i=1;i<=4&&clear;i++){
        const f=i/4,t=f*.85,d=Math.min(remaining,v.speed*t*.80),lat=(target-offset)*f;
        clear=spaceToSwerve(v,v.x+ux*d+uz*lat,v.z+uz*d-ux*lat,yaw+side*.26*Math.sin(f*Math.PI),t);
      }
      if(clear)return target;
    }
    return 0;
  }
  function trafficHonk(v){
    v.hornAt=streetTime;
    if(streetTime-lastTrafficHorn<.52)return;
    lastTrafficHorn=streetTime;sound.cue("trafficHorn",{kind:v.kind,distance:dist(v,car)});
  }
  function traffic(dt){
    const p=pos(),driver=play&&car&&!transfer?car:null;
    for(const v of cars){
      if(!v.path||v===car||v===transfer?.v)continue;
      const t=v.path[v.corner],from=v.path[(v.corner+v.path.length-1)%v.path.length];
      const dx=t.x-from.x,dz=t.z-from.z,n=Math.hypot(dx,dz)||1,ux=dx/n,uz=dz/n;
      const remaining=(t.x-v.x)*ux+(t.z-v.z)*uz,offset=(v.x-from.x)*uz-(v.z-from.z)*ux;
      if(remaining<.045){v.corner=(v.corner+1)%v.path.length;continue;}
      v.wait=Math.max(0,v.wait-dt);
      if(driver&&!v.reaction&&streetTime>=(v.reactAfter||0)){
        const threat=BayStreetReactions.trafficThreat(driver,v,ux,uz);
        if(threat){
          v.reaction={until:streetTime+.65+threat.when*.54,offset:chooseSwerve(v,ux,uz,offset,remaining,threat.side)};
          v.reactAfter=streetTime+3.4+(v.id%4||0)*.19;
          trafficHonk(v);
        }
      }
      let clearance=Infinity,redAhead=false;
      const ahead=(q,width,gap)=>{
        const rx=q.x-v.x,rz=q.z-v.z,front=rx*ux+rz*uz;
        if(front>.10&&front<20&&Math.abs(rx*uz-rz*ux)<width)clearance=Math.min(clearance,Math.max(0,front-gap));
      };
      ahead(p,car?1.95:1.55,car?4.65:3.1);
      if(transfer){
        const a=transfer,s=bayCarLayout(a.v.kind);
        ahead(hero,1.5,3);ahead(BayDriving.world(a.v,a.side*(s.hingeX+.65),s.back),1.45,3);
      }
      for(const other of cars)if(other!==v&&other!==car)ahead(other,1.75,4.65);
      for(const unit of patrol)ahead(unit,unit.role==="roadblock"?3.1:1.85,4.7);
      if(backup.roadblock&&!backup.roadblock.rail.hit)ahead(backup.roadblock.rail,2.55,3);
      for(const w of walkers)if(Math.abs(w.x-v.x)<17&&Math.abs(w.z-v.z)<17)ahead(w,1.15,2.95);
      const vertical=Math.abs(uz)>.7;
      for(const s of BayStreetArt.signals){
        const rx=s.x-v.x,rz=s.z-v.z,d=rx*ux+rz*uz,side=Math.abs(rx*uz-rz*ux);
        if(side<4.4&&d>7.1&&d<24&&vertical!==((streetTime+s.offset)%14<7)){
          clearance=Math.min(clearance,Math.max(0,d-9.7));redAhead=true;
        }
      }
      const response=v.reaction,evading=response&&streetTime<response.until,before=v.speed;
      const maximum=evading?(response.offset?v.pace*.52:0):v.pace;
      const pace=v.wait>0?0:Math.min(maximum,clearance*1.24);
      v.speed=ease(v.speed,pace,pace<v.speed?(evading?6.2:4.1):1.7,dt);
      let step=Math.min(remaining,clearance,v.speed*dt);
      const goal=evading?response.offset*clamp((remaining-.4)/4,0,1):0;
      const lateralLimit=step*(evading?.72:.48);
      let lateral=clamp((goal-offset)*-Math.expm1(-(evading?5.6:3.9)*dt),-lateralLimit,lateralLimit);
      const x=v.x+ux*step,z=v.z+uz*step;
      if((response||Math.abs(lateral)>.00001)&&step>0&&!spaceToSwerve(v,x+uz*lateral,z-ux*lateral,v.yaw,0,true)){
        if(!lateral||!spaceToSwerve(v,x,z,v.yaw,0,true)){step=0;v.speed=0;}
        lateral=0;
      }
      v.x+=ux*step+uz*lateral;v.z+=uz*step-ux*lateral;
      if(step<.0001&&clearance<.1)v.speed=0;
      v.blocked=v.speed<.4?v.blocked+dt:0;
      if(driver&&!response&&!redAhead&&v.blocked>3&&v.blocked<4&&dist(v,driver)<8&&streetTime-lastTrafficHorn>10){
        const gap=BayDriving.local(v,driver.x,driver.z);
        if(gap.z>0&&Math.abs(gap.x)<1.65)trafficHonk(v);
      }
      v.brakes=ease(v.brakes||0,(evading||pace<before-.35||clearance<.35)?1:0,12,dt);
      const steer=step>.0001?Math.atan2(lateral,step):0;
      const turn=angle(v.yaw,Math.atan2(ux,uz)+steer)*-Math.expm1(-8*dt);
      v.yaw+=turn;v.lean=ease(v.lean||0,clamp(turn/Math.max(dt,.001)*v.speed*.017,-.09,.09),7,dt);
      if(response&&!evading&&Math.abs(offset)<.09)v.reaction=null;
    }
    BayLocals.animatePeople(play?walkers:titleWalkers,dt,driver,cars,BayStreetArt.signals,streetTime,valid);
  }
  function clearCruiser(unit,x,z,yaw){
    const probe={kind:"cruiser",x,z,yaw};
    if(!fitsCar(probe,x,z,yaw)||dist(probe,chase.road(probe))>6.2)return false;
    for(const group of [cars,patrol])for(const other of group){
      if(other===unit||Math.abs(other.x-x)>5.5||Math.abs(other.z-z)>5.5)continue;
      const hit=BayDriving.contact(probe,other);
      if(hit&&(!unit||hit.depth>=(BayDriving.contact(unit,other)?.depth||0)))return false;
    }
    if(!car&&BayDriving.clearance(probe,hero)<.5)return false;
    return true;
  }
  function blockSiteClear(b){
    if(dist(pos(),b)<43||!clearCruiser(null,b.open.x,b.open.z,b.yaw))return false;
    for(const u of b.units){
      if(!clearCruiser(null,u.x,u.z,u.yaw)||walkers.some(w=>dist(u,w)<4&&BayDriving.clearance(u,w)<.65))return false;
      if(u.post&&!clearCruiser(null,u.post.x,u.post.z,u.yaw))return false;
    }
    if(BayDriving.contact(...b.units))return false;
    for(const prop of [b.rail,...b.cones]){
      if(!valid(prop.x,prop.z,.3)||walkers.some(w=>dist(w,prop)<1))return false;
      for(const group of [cars,patrol])for(const v of group){
        if(dist(v,prop)<5&&BayDriving.clearance(v,prop)<(prop===b.rail?1.65:.36))return false;
      }
    }
    return true;
  }
  function dispatch(slot){
    const v=chase.spawn(chase.lastSeen,slot,(x,z,yaw)=>clearCruiser(null,x,z,yaw));
    if(v){v.visual=carSkin("cruiser","#293e52");patrol.push(v);}
    chase.reinforceIn=v?2.35:.8;
  }
  function pursuit(dt){
    if(!heat)return;
    const p=pos(),vx=car?car.vx:motion.vx,vz=car?car.vz:motion.vz;
    if(!chase.lastSeen)chase.report(p,vx,vz);
    const desired=heat>=3?3:2,mobile=patrol.length-(backup.roadblock?.units.length||0);
    if((!mobile||chase.sighted)&&!chase.searching&&chase.reinforceIn<=0&&mobile<desired)dispatch(mobile);
    backup.fly(heat,dt,p);chase.observe(patrol,p,vx,vz,heat,dt,!!backup.air?.sees);
    backup.updateBlock(heat,dt,p,blockSiteClear,patrol);
    let closest=Infinity,visibleGap=Infinity;
    for(const v of patrol){
      if(v.role==="roadblock")backup.park(v,dt,clearCruiser);
      else chase.move(v,heat,dt,clearCruiser);
      const gap=dist(v,p);closest=Math.min(closest,gap);if(v.sees)visibleGap=Math.min(visibleGap,gap);
    }
    chase.closestUnit=closest;
    boxed=visibleGap<8.4&&Math.hypot(vx,vz)<3.4?boxed+dt:Math.max(0,boxed-dt*1.7);
    if(boxed>5.3){const fine=Math.min(save.wallet,65);save.wallet-=fine;persist();if(transfer){transfer.v.doorAngle=0;transfer=null;}if(car)BayDriving.settle(car);car=null;skidLast=null;hero.x=151;hero.z=-27;hero.yaw=0;resetFeet();active=null;dashResult=null;heat=0;clearPatrol();cameraSnap();note("Back at the Marlin",fine?"Patrol fine  •  "+cash(fine):"Patrol let you off with a warning.",4.5);return;}
    if(chase.searching&&chase.unseen-1.05>=chase.searchTime(heat)){
      heat=0;clearPatrol();lastHud=-10;note("Pursuit lost","Bay Patrol called off the search.",3.5);
    }
  }
  function isTop(){return manualTop||!view.gl||view.lost;}
  function radioToggle(){radio=sound.setEnabled(!radio);try{localStorage.setItem("sundownBay.audio",radio?"on":"off");}catch{}$("audioKey").querySelector("span").textContent=radio?"Sol FM":"Sound off";if(!panel)note("Bay radio",radio?"Sol FM  •  After Hours":"Sound off",1.7);}
  function moveCamera(dt,t){
    if(!play){
      const drift=Math.sin(t*.051);
      cam.x=157.5+drift*1.1;cam.z=-46.5+Math.sin(t*.039)*2;
      cam.y=3.75;cam.yaw=-.63+drift*.07;cam.pitch=-.075;cam.focal=1.48;
      return;
    }
    if(panel)return;
    const keyOrbit=(held("KeyC")?1:0)-(held("KeyQ")?1:0);
    if(keyOrbit)cameraRig.orbit(keyOrbit*dt*525,0,elapsed);
    if(pointer.edgeX)cameraRig.orbit(pointer.edgeX*dt*445,0,elapsed);
    cameraRig.update(cam,cameraSubject(),transfer?.v||car,dt,elapsed,{rear:held("KeyV"),lift:motion.lift,
      seat:transfer?(motion.ride?.seat||0):undefined});
  }
  function collectMap(modeName,cx,cz,scale){
    const driving=!!car&&!transfer;
    const displayCar=paintPreview||car;
    const allTraffic=modeName==="atlas"?patrol:cars.filter(v=>!driving||v!==car).concat(patrol);
    const p=transfer?hero:pos();
    return {mode:modeName,cx,cz,scale,solids,player:{x:p.x,z:p.z,yaw:p.yaw,driving,kind:car?.kind,color:displayCar?.color||"#99ebc6",motion,
      steer:car?.steer,brakes:car?.brakes,handbrake:car?.handbrake,reversing:car?.reversing,flatSide:car?.flatSide,inCabin:!!transfer&&(motion.ride?.seat||0)>.54},skids,
      cars:allTraffic,peds:modeName==="street"?walkers.map(w=>({x:w.x,z:w.z,yaw:w.yaw,shirt:personColors[w.style][1],skin:personColors[w.style][0],startle:w.startle})):[],
      tapes:tapes.filter((_,i)=>!save.tapes.includes(i)),target:currentTarget(),places:locations,elapsed,time:streetTime,
      searchPoint:heat&&chase.searching?chase.lastSeen:null,
      roadblock:backup.roadblock,air:backup.air,
      dashIndex:active?.job.id==="dash"?active.index:null,dashRun:active?.dash||dashResult?.run,ghost:active?.showGhost?active.ghost:null,
      signals:BayStreetArt.signals,streetActors:modeName==="street"?BayStreetArt.overview(streetTime):[],cameraYaw:isTop()?cameraRig.yaw+cameraRig.lookBack:cam.yaw};
  }
  function drawMini(){
    const c=$("mini"),p=cameraSubject();drawBayMap(c.getContext("2d"),collectMap("radar",p.x,p.z,c.width/(112+52*cameraRig.carBlend)));
  }
  function paintAtlas(){
    const c=$("bigmap");if(!c)return;const s=c.width/448;
    return drawBayMap(c.getContext("2d"),collectMap("atlas",13,0,s));
  }
  function drawCourse(see){
    const run=active?.dash||(dashResult&&elapsed<dashResult.until?dashResult.run:null);
    const count=run||active?.job.id==="dash"?course.length:1;
    for(let i=0;i<count;i++){
      const gate=course[i];if(!see(gate,108))continue;
      const ground=footLevel(gate.x,gate.z);
      view.draw("dash-"+gate.type,gate.x,ground,gate.z,gate.yaw);
      if(gate.type==="rail"){
        const at=run?.clips.get(i),fall=at==null?0:clamp((run.clock-at)/.28,0,1);
        view.draw("dash-bar",gate.x+gate.nx*.44*fall,ground+BayBeachDash.barHeight-.41*fall*fall,
          gate.z+gate.nz*.44*fall,gate.yaw,fall*1.25,.027*Math.sin(fall*Math.PI));
      }
      if(active?.job.id==="dash"&&i===active.index)view.draw("dash-guide",gate.x,ground,gate.z,gate.yaw);
    }
  }
  function chassisPoint(v,x,y,z,ground){
    const cp=Math.cos(v.pitch),sp=Math.sin(v.pitch),cr=Math.cos(v.lean),sr=Math.sin(v.lean);
    const py=y*cp-z*sp,pz=y*sp+z*cp;
    const p=BayDriving.world(v,x*cr-py*sr,pz);p.y=ground+x*sr+py*cr;return p;
  }
  function addRig(list,v,ground){
    const rig=vehicleRig(v),s=bayCarLayout(v.kind);
    const phase=v===serviceVehicle?serviceTime/repairSeconds:0;
    const flat=(v.flatLoad||0)*(1-clamp((phase-.55)*4,0,1));
    const bodyGround=ground-flat*.045;
    list.push([rig.shell,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean]);
    for(const side of [-1,1]){
      const hinge=chassisPoint(v,side*s.hingeX,0,s.hingeZ,bodyGround);
      const open=side===v.doorSide?v.doorAngle:0;
      list.push([rig.doors[side],hinge.x,hinge.y,hinge.z,v.yaw-side*open,v.pitch,v.lean]);
      for(const axle of s.axles){
        const damaged=side===v.flatSide&&axle===v.flatAxle;
        const out=damaged&&phase>0 ? .33*Math.sin(Math.PI*clamp((phase-.22)/.54,0,1))**2 : 0;
        const w=BayDriving.world(v,side*(s.track-.085+out),axle);
        const drop=damaged?flat*s.wheel*.25:0;
        list.push([rig.wheels[side],w.x,ground+s.wheel-drop,w.z,v.yaw+(axle>0?v.steer:0),v.wheelSpin]);
      }
    }
    if(v.brakes>.18||v.handbrake>.48)list.push([rig.brakes,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean]);
    if(v.reversing)list.push([rig.reverse,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean]);
  }
  function renderWorld(dt,t){
    moveCamera(dt,t);
    const top=isTop(),scene=$("world"),map=$("overhead");scene.hidden=top;map.hidden=!top;
    const besideTicket=paintPreview&&innerWidth>=900&&innerHeight>=490;
    if(top){
      const ratio=Math.min(1,1120/innerWidth,740/innerHeight),w=Math.round(innerWidth*ratio),h=Math.round(innerHeight*ratio);
      if(map.width!==w||map.height!==h){map.width=w;map.height=h;}
      const p=play?cameraSubject():{x:65,z:0};
      const yaw=play&&!paintPreview?cameraRig.yaw+cameraRig.lookBack:0;
      const ahead=play&&!paintPreview?(7+4*cameraRig.carBlend)*(1-cameraRig.elevation):0;
      let scale=play?clamp(h/((73+25*cameraRig.carBlend)*cameraRig.zoom),2,16):h/237;
      if(paintPreview)scale=h/24;
      const offset=besideTicket?w*.14/scale:0;
      const state=collectMap("street",p.x+Math.sin(yaw)*ahead-offset,p.z+Math.cos(yaw)*ahead,scale);
      state.rotation=yaw;
      drawBayMap(map.getContext("2d"),state);$("targetTag").hidden=true;return;
    }
    let eye=cam;
    if(paintPreview){
      // Look across the open bay from the entrance, leaving the driver's mouse camera intact.
      const v=paintPreview,side=v.x>=garage.x?-1:1;
      const x=garage.x+side*(garage.halfWidth-.65),z=Math.max(garage.z+garage.halfDepth-.85,v.z+4.7);
      const y=v.kind==="van"?2.7:2.3,aimY=bayCarLayout(v.kind).glass[5]*.56;
      eye={x,y,z,yaw:Math.atan2(v.x-x,v.z-z)-(besideTicket?.23:0),
        pitch:Math.atan2(aimY-y,Math.hypot(v.x-x,v.z-z)),focal:1.73};
    }
    view.begin(eye);
    skyPainter.draw(view,eye,t);
    view.draw("city");
    const see=(o,limit)=>Math.abs(o.x-eye.x)<limit&&Math.abs(o.z-eye.z)<limit;
    if(see(garage,125)){
      const color=heat?"#ef856e":serviceVehicle?"#ffbf68":"#9ae5b7",name="garage-lamp/"+color;
      model(name,g=>g.box(0,0,0,.87,.25,.05,color));
      view.draw(name,garage.x-3.70,4.28,garage.z+garage.halfDepth+.42);
    }
    for(const k of skids)if(elapsed-k.time<20&&see(k,100))view.draw("skid",k.x,.079,k.z,k.yaw);
    const visible=[],owned=transfer?.v||car;
    const hideActor=cameraRig.hideActor&&!paintPreview;
    for(const v of cars)if(see(v,160)&&!(v===car&&!transfer&&hideActor)){
      const ground=footLevel(v.x,v.z)+.008+serviceLift(v);
      if(v===owned)addRig(visible,paintPreview||v,ground);
      else{
        visible.push([v.model,v.x,ground,v.z,v.yaw,0,v.lean]);
        if(v.path&&see(v,52)){
          const s=bayCarLayout(v.kind),p=BayDriving.world(v,-s.seatX,s.seatZ);
          visible.push(["traffic-driver",p.x,ground+s.seatY,p.z,v.yaw,0,v.lean]);
          if(v.brakes>.35){
            const key="traffic-brakes/"+v.kind;model(key,g=>buildBayBrakeLights(g,v.kind));
            visible.push([key,v.x,ground,v.z,v.yaw,0,v.lean]);
          }
        }
      }
    }
    for(const p of walkers){
      if(!see(p,91))continue;
      if(p.startle){
        if(!p.recoilMesh){
          p.recoilMesh=new BayPlayerMesh(personColors[p.style],p.role);p.recoilKey="recoil/"+walkers.indexOf(p);
          view.add(p.recoilKey,p.recoilMesh,true);
        }
        p.recoilMesh.startle(p.startle);view.updateAnimated(p.recoilKey);
        visible.push([p.recoilKey,p.x,.15+p.startle.lift,p.z,p.yaw]);
      }else visible.push([personSkin(p.style,p.role,poseFor(p),p.gesture||0),p.x,.15,p.z,p.yaw]);
    }
    if(active&&active.job.id!=="race"&&active.job.id!=="dash"&&(active.index===0||active.job.id==="tape")){
      const m=currentTarget();if(see(m,98)){const style=active.job.id==="tape"?(active.index?3:4):2;visible.push([personSkin(style,active.job.id==="tape"?"courier":"local",0,1),m.x+1.1,.15,m.z,-1.6]);}
    }
    for(const v of patrol)if(see(v,150)){
      const ground=footLevel(v.x,v.z)+.01;
      v.visual??=carSkin("cruiser","#293e52");
      visible.push([v.visual,v.x,ground,v.z,v.yaw,0,v.lean]);
      if(v.brakes>.42){
        model("patrol-brakes",g=>buildBayBrakeLights(g,"cruiser"));
        visible.push(["patrol-brakes",v.x,ground,v.z,v.yaw,0,v.lean]);
      }
    }
    const b=backup.roadblock,a=backup.air;
    if((a||b)&&!models.has("patrol-board"))BayPatrolArt.install(model);
    if(b&&see(b,150)){
      const r=b.rail,y=footLevel(r.x,r.z)+.04,tilt=r.fall*1.48;
      visible.push(["patrol-board",r.x,y,r.z,b.yaw,tilt]);
      if(!r.hit&&t%1<.52)visible.push(["patrol-amber",r.x,y,r.z,b.yaw]);
      for(const c of b.cones)visible.push(["patrol-cone",c.x,footLevel(c.x,c.z)+.025,c.z,c.yaw,(c.fall||0)*1.5]);
      if(b.strip)visible.push(["patrol-spikes",b.strip.x,footLevel(b.strip.x,b.strip.z)+.02,b.strip.z,b.yaw]);
    }
    if(a&&see(a,190)){
      const hub=chassisPoint(a,0,BayPatrolArt.mast,-.22,a.y),tail=chassisPoint(a,...BayPatrolArt.tail,a.y);
      visible.push(["patrol-air",a.x,a.y,a.z,a.yaw,a.pitch,a.lean],
        ["patrol-rotor",hub.x,hub.y,hub.z,a.yaw+a.rotor,a.pitch,a.lean],
        ["patrol-tail",tail.x,tail.y,tail.z,a.yaw,a.rotor*2.5+a.pitch,a.lean]);
    }
    if(!hideActor&&playerMesh){
      if(playerMesh.update(motion))view.updateAnimated("player");
      if(car&&!transfer){
        const s=bayCarLayout(car.kind),p=chassisPoint(car,-s.seatX,0,s.seatZ,footLevel(car.x,car.z)+.008+serviceLift(car));
        visible.push(["player",p.x,p.y,p.z,car.yaw,car.pitch,car.lean]);
      }else visible.push(["player",hero.x,hero.y+motion.lift,hero.z,hero.yaw]);
    }
    if(view.beginShadow()){
      for(const a of visible)if(Math.abs(a[1]-eye.x)<65&&Math.abs(a[3]-eye.z)<65)view.draw(...a);
      BayStreetArt.draw(view,streetTime,cam,true);
      view.endShadow();
    }else{
      for(const v of cars)if(see(v,83))view.draw("shadowCar",v.x,.145,v.z,v.yaw);
      for(const v of patrol)if(see(v,83))view.draw("shadowCar",v.x,.145,v.z,v.yaw);
      if(!car)view.draw("shadowFoot",hero.x,hero.y+.025,hero.z,hero.yaw);
    }
    drawCourse(see);
    for(const a of visible)view.draw(...a);
    BayStreetArt.draw(view,streetTime,cam);
    for(const v of cars){
      const pulse=BayStreetReactions.hornPulse(v,streetTime);
      if(pulse>.10&&v.path&&see(v,47))view.draw("horn-wave",v.x,footLevel(v.x,v.z)+bayCarLayout(v.kind).glass[5]+.32+pulse*.16,v.z,eye.yaw);
    }
    for(const v of patrol)if(see(v,110))view.draw(Math.floor(t*5.5)%2?"flash-red":"flash-blue",v.x,footLevel(v.x,v.z)+.01,v.z,v.yaw,0,v.lean);
    tapes.forEach((o,i)=>{if(!save.tapes.includes(i)&&see(o,72))view.draw(i===0?"motel-tape":"tape",o.x,1.1+Math.sin(t*2+i)*.12,o.z,t*1.3+i);});
    if(active?.showGhost&&see(active.ghost,90)&&dist(hero,active.ghost)>.75){
      const r=active.ghost;
      if(!ghostMesh){ghostMesh=new BayPlayerMesh(personColors[0]);view.add("dash-ghost",ghostMesh,true);}
      if(ghostMesh.update(r.motion))view.updateAnimated("dash-ghost");
      view.drawGhost("dash-ghost",r.x,footLevel(r.x,r.z)+r.motion.lift,r.z,r.yaw);
    }
    const tar=currentTarget();
    if(tar){if(active?.job.id!=="dash"){view.draw("destRing",tar.x,0,tar.z);view.draw("beacon",tar.x,2.6+Math.sin(t*3)*.17,tar.z,eye.yaw);}
      const mark=view.project(tar.x,3.6,tar.z),label=$("targetTag");
      if(play&&!panel&&mark&&mark.x>48&&mark.x<innerWidth-48&&mark.y>55&&mark.y<innerHeight-75&&dist(pos(),tar)>9){
        label.hidden=false;label.style.left=mark.x+"px";label.style.top=mark.y+"px";label.textContent=Math.round(dist(pos(),tar))+" m";
      }else label.hidden=true;
    }else $("targetTag").hidden=true;
    if(a&&a.light>.01&&see(a,190)){
      if(!airBeam){airBeam=new BayPatrolArt.Searchlight();view.add("air-beam",airBeam,true);}
      airBeam.update(a,backup.lamp(a));view.updateAnimated("air-beam");view.drawSearchlight("air-beam");
    }
  }
  function contextHint(k,label){
    const signature=k+label;if(lastHint===signature)return;lastHint=signature;
    const box=$("context");box.replaceChildren();if(!label)return;
    if(k){const key=document.createElement("kbd");key.textContent=k;box.append(key);}box.append(document.createTextNode(label));
  }
  function dashHud(){
    if(dashResult&&elapsed>=dashResult.until)dashResult=null;
    const result=dashResult,run=active?.dash||result?.run,box=$("dashHud");
    box.hidden=!run;if(!run)return;
    const best=save.dash?.splits.at(-1),i=run.index,total=course.length-1;
    const bearing=$("dashBearing");bearing.hidden=!!result;
    if(!result){
      const g=course[i],heading=Math.atan2(g.x-hero.x,g.z-hero.z);
      bearing.style.transform="rotate("+angle(cameraRig.yaw+cameraRig.lookBack,heading)+"rad)";
    }
    $("dashTime").textContent=raceWatch(run.clock);
    $("dashBest").textContent=best?"BEST "+raceWatch(best):"";
    $("dashCount").textContent=result?"FINISH":i?"GATE "+i+"/"+total:"START";
    let line,split="";
    if(result){
      line=(result.record?(result.previous===null?"First time on the board":"New personal best"):"Finished")+"  ·  +"+cash(result.pay);
      split=run.clean+" of 2 hurdles clean"+(result.previous!==null?"  ·  "+deltaText(run.clock-result.previous):"");
    }else if(!i){
      line="Cross the chalk line to start.";split=active.ghost?"Mint runner = your best run":"Hold Shift to sprint. Space to jump.";
    }else{
      const gate=course[i],distance=dist(hero,gate);
      const missed=distance<13&&(hero.x-gate.x)*gate.nx+(hero.z-gate.z)*gate.nz>.7;
      line=missed?"Circle back through the front of the gate":(gate.type==="rail"?"Jump the hurdle":gate.name)+"  ·  "+Math.ceil(distance)+" m";
      const last=run.lastSplit;
      if(last&&run.clock-last.time<2.7){
        const ref=save.dash?.splits[last.index];split=last.label+(ref?"  ·  "+deltaText(last.time-ref):"");
      }else if(gate.type==="rail")split="Space to jump";
      else if(gate.type==="finish")split="Through the checkered banner";
    }
    $("dashLine").textContent=line;
    if($("dashSplit").textContent!==split)$("dashSplit").textContent=split;
    $("dashRetry").hidden=!!heat||(!result&&!i);
    $("dashRetry").querySelector("span").textContent=result?"Run again":"Restart";
  }
  function tirePosition(v){return (v.flatAxle>0?"Front ":"Rear ")+(v.flatSide<0?"left":"right");}
  function tireStatus(v){return tirePosition(v)+" flat";}
  function hud(){
    const p=pos(),tar=currentTarget(),area=district(p);$("district").textContent=area;$("money").textContent=cash(save.wallet);
    $("stars").innerHTML='<span class="on">'+"★".repeat(heat)+'</span>'+"☆".repeat(5-heat);
    $("stars").setAttribute("aria-label",heat?heat+" of 5 heat":"No heat");
    const status=$("pursuitStatus");status.hidden=!heat;
    $("stars").className=status.className=heat&&chase.searching?"searching":"";
    if(heat){
      const duration=chase.searchTime(heat),remaining=clamp(duration-chase.unseen+1.05,0,duration);
      const label=chase.searching?"Searching · "+Math.ceil(remaining)+" s":chase.sighted?"In pursuit":"Units responding";
      if($("pursuitLabel").textContent!==label)$("pursuitLabel").textContent=label;
      status.style.setProperty("--remaining",String(remaining/duration));
    }
    const roadblock=backup.roadblock,air=backup.air;
    const cleared=roadblock?.clearedAt;
    const blockNear=roadblock&&dist(p,roadblock)<145&&(cleared===undefined||roadblock.age-cleared<2);
    $("blockCall").hidden=!blockNear;
    if(blockNear){
      const strip=roadblock.strip;
      const ahead=strip&&(strip.x-p.x)*roadblock.dx+(strip.z-p.z)*roadblock.dz>0;
      $("blockCall").textContent=cleared!==undefined?"Roadblock cleared":ahead?
        "Spike strip · "+Math.round(dist(p,strip))+" m":"Roadblock · "+Math.round(dist(p,roadblock))+" m";
    }
    $("airCall").hidden=!air;
    if(air){
      $("airCall").className=air.sees?"dispatch-call tracking":"dispatch-call";
      $("airCall").textContent=air.light<.8?"Air One inbound":air.sees?"Air One · visual contact":"Air One · sweeping";
    }
    $("mode").textContent=transfer?(transfer.exiting?"Stepping out":"Taking the wheel"):car?formatVehicle(car):"On foot";
    $("tireCall").hidden=!car?.flatSide||!!transfer;
    if(!$("tireCall").hidden)$("tireCall").textContent=tireStatus(car);
    $("speed").innerHTML=car&&!transfer?'<em class="gear">'+(car.reversing?"R":"D"+car.gear)+'</em>'+Math.round(Math.abs(car.speed)*2.237)+"<small>MPH</small>":"";
    dashHud();$("objective").hidden=!tar||!!active?.dash;
    if(tar&&!active?.dash){
      $("objectiveTag").textContent=active?active.job.name+(active.job.id==="race"&&active.running?"  /  "+watch(active.clock):""):"Map pin";
      let verb="Reach ";if(active&&active.job.id!=="race")verb=active.index===0?"Pick up at ":"Drop off at ";
      if(active?.job.id==="tape")verb=active.index===0?"Meet Nia at ":"Meet the DJ at ";
      const destination=active?.job.id==="dash"?"Meet the lifeguards at the chalk line":verb+tar.name;
      $("objectiveText").textContent=destination+"  ·  "+Math.round(dist(p,tar))+" m";
    }
    const nearby=car?null:enterable(),speaker=car?null:BayLocals.closestSpeaker(walkers,hero);
    const atShop=car&&Math.abs(car.x-garage.x)<10
      &&car.z>=garage.z-garage.halfDepth&&car.z<garage.z+garage.halfDepth+15;
    const hint=$("context");hint.className=serviceVehicle?"servicing":"";
    if(serviceVehicle)hint.style.setProperty("--repair-fill",String(clamp(serviceTime/repairSeconds,0,1)));
    if(transfer)contextHint("","");
    else if(boxed>1)contextHint("","Patrol closing in  ·  "+Math.ceil(5.3-boxed)+" s");
    else if(serviceVehicle)contextHint("","Changing "+tirePosition(car).toLowerCase()+" tire");
    else if(atShop&&car.flatSide){
      let prompt="Release the pedals for tire service";
      if(heat)prompt="Lose the cops for tire service";
      else if(!inServiceBay(car))prompt="Pull into the open bay";
      else if(Math.abs(car.speed)>1.6)prompt="Stop for tire service";
      contextHint("",prompt);
    }
    else if(atShop){
      if(heat)contextHint("","Lose the cops to respray");
      else if(readyForPaint(car))contextHint("F","Respray car  ·  "+cash(resprayPrice));
      else contextHint("",inServiceBay(car)?"Stop for a respray":"Pull into the bay for a respray");
    }
    else if(active?.dash)contextHint("","");
    else if(tar&&active?.job.id==="dash"&&car&&dist(p,tar)<13)contextHint("E","Park and line up on foot");
    else if(!car&&!active&&dist(hero,course[0])<4)contextHint("F","Line up for Low Tide Dash");
    else if(tar&&active?.job.id==="tape"&&car&&dist(p,tar)<12)contextHint("E","Park and meet the contact on foot");
    else if(tar&&active&&active.job.id!=="tape"&&active.job.id!=="dash"&&dist(p,tar)<12&&(!car||(active.job.id!=="race"&&Math.abs(car.speed)>7)))contextHint("",car?"Slow down at the marker":"Bring a car to the marker");
    else if(speaker){
      const action=speaker.name==="June"&&save.tapes.includes(0)&&!save.juneReturned?"Give June her demo":"Talk to "+speaker.name;
      contextHint("F",action+(nearby?"  ·  E  Take "+formatVehicle(nearby):""));
    }
    else if(nearby)contextHint("E","Enter "+formatVehicle(nearby));
    else if(car&&!active&&Math.abs(car.speed)<.7&&elapsed<23)contextHint("E","Step out");
    else contextHint("","");
    if(!$("toast").hidden&&elapsed>toastTill)$("toast").hidden=true;
    if(!$("speech").hidden&&elapsed>speechTill)$("speech").hidden=true;
  }
  function closePanel(){
    paintPreview=null;
    panel="";$("panel").hidden=true;$("shade").hidden=true;$("hud").hidden=!play;keys.clear();resetPointer();sound.pause(false);document.activeElement?.blur();lastHud=-10;lastMap=-10;captureMouse();
  }
  function makeButton(title,detail,right,fn,className="row-action"){
    const b=document.createElement("button"),block=document.createElement("span"),strong=document.createElement("strong"),small=document.createElement("small"),end=document.createElement("em");
    b.className=className;strong.textContent=title;small.textContent=detail;end.textContent=right;block.append(strong,small);b.append(block,end);b.addEventListener("click",fn);return b;
  }
  function radioButton(){return makeButton("Sol FM & city sounds","Music, engines, surf and street sounds.",radio?"On":"Off",()=>{radioToggle();openPanel("pause",true);});}
  function showPaintTicket(body,v){
    body.append($("paintTicket").content.cloneNode(true));
    const ticket=selector=>body.querySelector(selector);
    const colors=ticket(".paint-options"), buy=ticket(".paint-buy"), sample=ticket("canvas");
    const caption=ticket(".paint-caption"),balance=ticket(".paint-balance");
    ticket(".paint-model").textContent=formatVehicle(v);
    ticket(".paint-wallet").textContent=cash(save.wallet);
    buy.textContent="Respray · "+cash(resprayPrice);
    let selected;
    function preview(finish){
      selected=finish;
      const color=finish?.color||v.color,current=color===v.color,name=finish?.name||"Factory paint";
      // Only the renderer sees this copy. The parked car keeps its paid finish until checkout.
      paintPreview={...v,color,model:carSkin(v.kind,color)};lastMenuPaint=-Infinity;
      for(const chip of colors.children)chip.setAttribute("aria-pressed",String(chip.value===color));
      caption.textContent=(current?"On this car · ":"Preview · ")+name;
      drawBayPaintSample(sample,v.kind,color);
      const shortfall=resprayPrice-save.wallet;
      buy.disabled=current||shortfall>0;
      balance.textContent=shortfall>0?"Earn "+cash(shortfall)+" more from jobs.":current?"Choose a different color to respray.":cash(save.wallet-resprayPrice)+" after respray";
    }
    for(const finish of finishes){
      const chip=document.createElement("button");
      chip.type="button";chip.className="paint-chip";chip.value=finish.color;chip.textContent=finish.name;
      chip.setAttribute("aria-label",finish.name);
      chip.style.setProperty("--finish",finish.color);
      chip.addEventListener("click",()=>preview(finish));colors.append(chip);
    }
    buy.addEventListener("click",()=>buyRespray(v,selected));
    preview(finishes.find(f=>f.color===v.color));
  }
  function openPanel(next,redraw=false){
    if(!play)return;if(panel===next&&!redraw){closePanel();return;}
    if(next==="respray"){
      if(!readyForPaint(car))return;
      BayDriving.settle(car);
    }
    paintPreview=null;$("shade").className=next==="respray"?"paint-shade":"";
    panel=next;keys.clear();releaseMouse();sound.pause(true);$("hud").hidden=true;$("shade").hidden=false;$("panel").hidden=false;$("panel").setAttribute("data-screen",next);
    const b=$("panelBody");b.replaceChildren();$("closePanel").focus({preventScroll:true});
    let title="",kicker="";
    if(next==="respray"){
      title="Paint shop";kicker=garage.name+"  /  Port Sol";showPaintTicket(b,car);
    }else if(next==="jobs"){
      title="Burner phone";kicker="Contacts  /  Sundown Bay";
      if(active){
        const line=document.createElement("p");line.textContent=active.job.by+" has you on "+active.job.name+". Your next stop is "+currentTarget().name+".";b.append(line);
        b.append(makeButton("Back to the city","Keep the current job active.","Resume",closePanel),makeButton("Drop this job","Stay where you are and choose another contact.","Cancel job",()=>{active=null;openPanel("jobs",true);}));
      }else for(const j of jobs)b.append(makeButton(j.name,j.by+"  ·  "+j.desc,cash(j.pay)+(["fare","dash"].includes(j.id)?"+":""),()=>startJob(j.id),"jobcard"));
      const stats=document.createElement("div");stats.className="statline";stats.textContent="Jobs done "+save.paid+"  /  Best circuit "+(save.best?watch(save.best):"—")+(save.dash?"  /  Best dash "+raceWatch(save.dash.splits.at(-1)):"");b.append(stats);
    }else if(next==="map"){
      title="City map";kicker="Palm Coast  /  Street atlas";
      const wrap=document.createElement("div");wrap.className="map-wrap";const c=document.createElement("canvas");c.id="bigmap";c.width=704;c.height=624;c.tabIndex=0;c.setAttribute("aria-label","City map. Choose a destination from the list below or click the map.");wrap.append(c);
      const legend=document.createElement("div");legend.className="map-legend";legend.innerHTML="<span>▲ You</span><span><em>◇</em> Waypoint</span><span><b>▣</b> Radio tape</span><span>🔧 Tires &amp; paint</span>";wrap.append(legend);b.append(wrap);
      const garageBounds=paintAtlas();
      const list=document.createElement("select");list.setAttribute("aria-label","Choose a map destination");
      const initial=document.createElement("option");initial.textContent=active?"Following the current job":"Choose a destination";initial.value="";list.append(initial);
      locations.forEach((v,i)=>{const opt=document.createElement("option");opt.value=i;opt.textContent=v.name;list.append(opt);});list.disabled=!!active;
      list.onchange=()=>{if(list.value!==""){waypoint={...locations[Number(list.value)]};closePanel();note("Map pin",waypoint.name,2);}};
      b.append(list);c.addEventListener("click",ev=>{if(active)return;const rect=c.getBoundingClientRect(),scale=c.width/448;
        const mx=(ev.clientX-rect.left)/rect.width*c.width,my=(ev.clientY-rect.top)/rect.height*c.height;
        const wx=13+(mx-c.width/2)/scale,wz=(c.height/2-my)/scale;
        const pin={x:clamp(wx,-181,207),z:clamp(wz,-179,179)};
        if(garageBounds&&mx>=garageBounds.left&&mx<=garageBounds.right&&my>=garageBounds.top&&my<=garageBounds.bottom)waypoint={...garage};
        else{waypoint=valid(pin.x,pin.z,.36)?pin:nearestRoadPoint(pin);waypoint.name=district(waypoint);}
        closePanel();note("Map pin",waypoint.name,2);});
    }else{
      title="Paused";kicker="Sundown Bay  /  "+district(pos());const stats=document.createElement("div");stats.className="statline";stats.textContent=cash(save.wallet)+"  /  Jobs "+save.paid+"  /  Tapes "+save.tapes.length+" of 5";b.append(stats);
      const keysList=document.createElement("div");keysList.className="controls";const allControls=[["WASD / ↑↓←→","Walk or drive"],["Mouse","Look around"],["E","Enter / exit car"],["Shift","Sprint on foot"],["S / ↓","Brake, then reverse"],["Space","Jump / handbrake"],["H / F","Horn / talk"],["J / M","Jobs / map"],["Q / C","Keyboard look"],["V / X","Look back / recenter"],["+ / −","Camera distance"]];
      for(const [key,text] of allControls){const span=document.createElement("span"),k=document.createElement("kbd");k.textContent=key;span.append(k,document.createTextNode(text));keysList.append(span);}b.append(keysList);
      b.append(makeButton("Back to the city","Resume free roam or your current job.","Resume",closePanel));
      const gfx=makeButton("Camera view",!view.gl||view.lost?"Lightweight overhead rendering is active.":"Third-person street view or the overhead map.",isTop()?"Overhead":"Street",()=>{manualTop=!manualTop;saveCamera();openPanel("pause",true);});gfx.disabled=!view.gl||view.lost;
      const assist=makeButton("Driving camera",cameraRig.assist?"Eases toward the road after you look around.":"Holds your mouse direction. Press X to face the road.",cameraRig.assist?"Follow":"Free look",()=>{cameraRig.assist=!cameraRig.assist;saveCamera();openPanel("pause",true);});
      const sensitivity=makeButton("Mouse sensitivity","Adjust horizontal and vertical look speed.",cameraRig.sensitivity<1?"Low":cameraRig.sensitivity>1?"High":"Normal",()=>{cameraRig.sensitivity=cameraRig.sensitivity===1?1.38:(cameraRig.sensitivity>1 ? .72 : 1);saveCamera();openPanel("pause",true);});
      b.append(gfx,assist,sensitivity,radioButton());
      const tune=makeButton("Garage tune",save.tuned?"Performance tune fitted to all your rides.":"More acceleration and a higher top speed in every ride.",save.tuned?"Fitted":"$250",()=>{if(save.wallet<250||save.tuned)return;save.wallet-=250;save.tuned=true;persist();openPanel("pause",true);});tune.disabled=save.tuned||save.wallet<250;b.append(tune);
    }
    $("panelTitle").textContent=title;$("panelKicker").textContent=kicker;
  }
  $("play").addEventListener("click",playStart);$("closePanel").addEventListener("click",closePanel);$("shade").addEventListener("click",closePanel);
  $("jobKey").onclick=()=>openPanel("jobs");$("miniButton").onclick=()=>openPanel("map");$("pauseKey").onclick=()=>openPanel("pause");
  $("audioKey").onclick=()=>{radioToggle();document.activeElement?.blur();};
  $("dashRetry").onclick=()=>{retryDash();document.activeElement?.blur();};
  const pointer={locked:false,requesting:false,x:null,y:null,edgeX:0,nativeEscape:-10000};
  const lookSurface=()=>isTop()?$("overhead"):$("world");
  function resetPointer(){pointer.x=null;pointer.y=null;pointer.edgeX=0;}
  function captureMouse(){
    const c=lookSurface();
    if(!play||panel||document.hidden||document.pointerLockElement===c||pointer.requesting||!c.requestPointerLock)return;
    if(window.navigator?.userActivation&&!navigator.userActivation.isActive)return;
    try{
      pointer.requesting=true;
      const request=c.requestPointerLock();
      if(request?.catch)request.catch(()=>{pointer.requesting=false;});
    }catch{pointer.requesting=false;}
  }
  function releaseMouse(){resetPointer();if(document.pointerLockElement===$("world")||document.pointerLockElement===$("overhead"))document.exitPointerLock?.();}
  document.addEventListener("pointerlockerror",()=>{pointer.requesting=false;});
  document.addEventListener("pointerlockchange",()=>{
    const previous=pointer.locked;pointer.locked=document.pointerLockElement===$("world")||document.pointerLockElement===$("overhead");pointer.requesting=false;resetPointer();
    if(pointer.locked&&(panel||document.pointerLockElement!==lookSurface()))releaseMouse();
    else if(previous&&!pointer.locked&&play&&!panel){
      pointer.nativeEscape=performance.now();openPanel("pause");
    }
  });
  document.addEventListener("mousemove",e=>{
    if(!play||panel||document.hidden)return;
    const canvas=lookSurface(),locked=document.pointerLockElement===canvas;
    if(!locked&&e.target!==canvas){resetPointer();return;}
    let dx=e.movementX||0,dy=e.movementY||0;
    if(!locked){
      if(pointer.x!==null){dx=e.clientX-pointer.x;dy=e.clientY-pointer.y;}
      else{dx=0;dy=0;}
      pointer.x=e.clientX;pointer.y=e.clientY;
      // An embedded browser may decline pointer lock. The outer 18 pixels allow a full turn.
      const edge=18;pointer.edgeX=e.clientX<edge?-(1-e.clientX/edge):e.clientX>innerWidth-edge?1-(innerWidth-e.clientX)/edge:0;
    }
    cameraRig.orbit(dx,dy,elapsed);
  });
  function zoomWheel(e){
    if(!play||panel||e.ctrlKey)return;e.preventDefault();
    const units=e.deltaY*(e.deltaMode===1?15:e.deltaMode===2?innerHeight:1);cameraRig.changeZoom(clamp(units*.0015,-.17,.17));saveCamera();
  }
  for(const canvas of [$("world"),$("overhead")]){
    canvas.addEventListener("mouseleave",()=>{if(!pointer.locked)resetPointer();});
    canvas.addEventListener("click",captureMouse);
    canvas.addEventListener("wheel",zoomWheel,{passive:false});
  }
  $("world").addEventListener("webglcontextlost",()=>releaseMouse());
  const handled=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight","Space","KeyE","KeyF","KeyH","KeyT","KeyV","KeyX","KeyQ","KeyC","KeyM","KeyJ","KeyR","Equal","Minus","NumpadAdd","NumpadSubtract","Escape","Enter","ShiftLeft","ShiftRight"]);
  addEventListener("keydown",ev=>{
    if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
    if(!play){if(ev.code==="Enter"&&!ev.repeat){ev.preventDefault();playStart();}return;}
    if(panel){
      if((ev.code==="Escape"||ev.code==="KeyM"||ev.code==="KeyJ")&&!ev.repeat){ev.preventDefault();if(ev.code==="Escape"){if(performance.now()-pointer.nativeEscape>210)closePanel();}else openPanel(ev.code==="KeyM"?"map":"jobs");return;}
      if(ev.code==="Tab"){const controls=[...$("panel").querySelectorAll("button:not(:disabled),select:not(:disabled),[tabindex='0']")];if(!controls.length)return;
        if((ev.shiftKey&&document.activeElement===controls[0])||(!ev.shiftKey&&document.activeElement===controls.at(-1))){ev.preventDefault();controls[ev.shiftKey?controls.length-1:0].focus();}}
      return;
    }
    if(!handled.has(ev.code))return;
    if((ev.code==="Enter"||ev.code==="Space")&&document.activeElement?.matches("button"))return;
    ev.preventDefault();keys.add(ev.code);if(ev.repeat)return;
    if(ev.code==="KeyE")switchCar();else if(ev.code==="KeyJ")openPanel("jobs");else if(ev.code==="KeyM")openPanel("map");else if(ev.code==="KeyR")radioToggle();else if(ev.code==="Escape")openPanel("pause");
    else if(ev.code==="KeyX")cameraRig.recenter(pos().yaw,elapsed);
    else if(ev.code==="KeyH"&&car&&!transfer)honk();
    else if(ev.code==="Space"&&!car&&!transfer)motion.jump();
    else if(ev.code==="KeyT"&&!transfer)retryDash();
    else if(ev.code==="KeyF"&&!transfer){if(car)openPanel("respray");else talk();}
    else if(["Equal","NumpadAdd","Minus","NumpadSubtract"].includes(ev.code)){cameraRig.changeZoom(["Equal","NumpadAdd"].includes(ev.code)?-.12:.12);saveCamera();}
  });
  addEventListener("keyup",ev=>keys.delete(ev.code));
  addEventListener("blur",()=>{keys.clear();resetPointer();if(play&&!panel)openPanel("pause");});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){keys.clear();if(play&&!panel)openPanel("pause");}});
  let last=performance.now(),slow=0,lastIntroPaint=0,lastMenuPaint=0;
  function tick(now){
    requestAnimationFrame(tick);
    if(document.hidden){last=now;return;}
    // Sample each display frame in play. Throttle only the title and pause screens.
    if(!play){if(now-lastIntroPaint<1000/30-.9)return;lastIntroPaint=now;}
    const raw=Math.max(0,(now-last)/1000),dt=clamp(raw,0,.10);last=now;
    if(!panel)streetTime+=dt;
    if(!play){traffic(dt);motion.step(dt,0,0);}
    if(play&&!panel){
      elapsed+=dt;bumpLock=Math.max(0,bumpLock-dt);
      // Small steps keep steering and collision response consistent on slower hardware.
      let left=dt;while(left>.00001){const d=Math.min(left,car?1/60:1/45);if(transfer)stepTransfer(d);else if(car)drive(d);else walk(d);traffic(d);pursuit(d);advanceJob(d);serviceGarage(d);left-=d;}
      if(!transfer)checkTapes();const p=pos(),speed=Math.abs(car?.speed||0);
      sound.update({speed,driving:!!car,heat,siren:heat?clamp(1-chase.closestUnit/103,0,1):0,time:elapsed,coast:clamp((p.x-100)/93,0,1),
        rotor:backup.air?backup.air.light*clamp(1-Math.hypot(backup.air.x-p.x,backup.air.y,backup.air.z-p.z)/110,0,1):0,
        docks:clamp(1-Math.hypot(p.x+142,p.z+76)/94,0,1),skid:car?.slip||0});
      if(elapsed-lastHud>.10){hud();lastHud=elapsed;}if(elapsed-lastMap>.09){drawMini();lastMap=elapsed;}
    }
    if(panel&&now-lastMenuPaint<300)return;lastMenuPaint=now;
    if(play&&!panel&&raw>.032)slow++;else slow=Math.max(0,slow-1);
    if(slow>54&&view.scale>.65){view.scale=Math.max(.65,view.scale-.12);slow=0;}
    renderWorld(dt,streetTime);
  }
  // Show a first frame before the browser schedules its animation loop.
  renderWorld(1/60,0);requestAnimationFrame(tick);
})();
