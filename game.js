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
  const view=new BayView($("world")), cityMesh=new BayMesh(),waterMesh=new BayMesh(),city=buildBayCity(cityMesh,waterMesh);
  view.add("city",cityMesh);cityMesh.vertices.length=0;view.add("bay-water",waterMesh);waterMesh.vertices.length=0;
  const solids=city.solids, sound=window.BaySound,garage=city.garage;
  for(const prop of BayExposure.props)solids.push({...prop,bottom:0,streetProp:true});
  for(const prop of BayMercadoArt.blocks)solids.push({...prop,bottom:0,top:prop.h,streetProp:true});
  solids.push(BayMotelParking.stop,...BayCutArt.blocks,...BayCutWildlife.blocks);
  solids.push(...BayRecoveryArt.blocks);
  const locations=[
    {x:151,z:-13,name:"Marlin Motel"}, {x:6,z:66,name:"Cine Luna"},
    {x:-138,z:-73,name:"Port Sol"}, {x:-66,z:-137,name:"El Mercado"},
    {x:139,z:140,name:"North Boardwalk"},garage
  ];
  const bay=BayMarina,marinaJob={id:"regatta",name:"Breakwater Run",by:"Paz Ríos",desc:"Meet Paz on the water. Pick an outboard and race between the channel marks.",pay:220};
  const boats=[bay.vessel("needle"),bay.vessel("mako"),bay.vessel("needle")],clubBoat=bay.vessel("rival");
  const civilianFleet=[...boats,clubBoat];
  boats.forEach((v,i)=>bay.moor(v,i===2?BayCut.dock:bay.docks[0],i===1?1:-1));
  Object.assign(clubBoat,{x:298,z:34,yaw:0});
  const cruiseMarks=[{x:298,z:126},{x:372,z:135},{x:387,z:-91},{x:307,z:-81}];
  let skiff=null,deckStep=null,cruiseLeg=0,regattaResult=null,chartMode="city",hullChoice="needle",courseChoice="jetty";
  let swim=null,surfArtReady=false,reefReady=false;
  let ferryScene=null,ferryReceipt=null,ferryMesh=null,ferryMeshMotion=null;
  const shorePins=bay.docks.map(d=>({...d,x:d.footX+1.4}));
  const cutGate={kind:"county-road",x:144,z:170,name:"Ocean Drive north · To Pelican Cut"};
  locations.push(...shorePins,{...BayMarlinRoom.outside,kind:"room"},{...BayMercadoArt.counter,kind:"counter"},BaySurfPatrol.tower,BayCab.cinema);
  const genres=BayDriving.cars;
  const paints=["#de6f62","#42afa5","#e6b77d","#718dac","#f0d8a9","#976e9a"];
  const resprayPrice=75;
  const parts=[
    {id:"engine",name:"Engine tune",price:250,detail:"18% more engine power for quicker acceleration."},
    {id:"tires",name:"Sport tires",price:125,detail:"25% more cornering grip on pavement."}
  ];
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
  const chase=new BayPursuit(axes,solids.concat(BayHarborPatrol.sightCover)),crashContacts=new Map();
  const harbor=new BayHarborPatrol(chase);
  const backup=new BayBackup(chase,(city.cameraObstacles||[]).concat(BayCutArt.camera));
  let airBeam=null;
  const repairSeconds=2;
  let serviceVehicle=null,serviceTime=0,paintPreview=null;
  let skidLast=null,transfer=null,streetTime=2.4,hornReady=0,lastTrafficHorn=-12,speechTill=0;
  const hero={x:151,z:-27,y:.076,yaw:-.18};
  const motion=new BayPlayerMotion(),playerMesh=view.gl?new BayPlayerMesh(personColors[0]):null;
  let dashResult=null,ghostMesh=null,maraMesh=null,lastMaraMotion=null;
  const idlePose=new BayPlayerMotion();
  if(playerMesh)view.add("player",playerMesh,true);
  const cam={x:153,y:3.2,z:-33,yaw:-.18,pitch:-.16};
  const cameraRig=new BayCamera(solids.concat(city.cameraObstacles||[],BayCutArt.camera));
  const skyPainter=new BaySky($("sky"));
  const meet=new BayNightMeet.Meet(),julesMotion=new BayPlayerMotion(),julesBody={};
  let meetReceipt=null,julesMesh=null,takeArtReady=false;
  const cameraSnap=()=>cameraRig.reset(skiff||car||hero);
  const blankSave=()=>({wallet:0,paid:0,best:0,tuned:false,tapes:[],rides:0,juneReturned:false,dash:null,resprays:{},upgrades:Object.create(null),edition:"",regatta:{},ferryLine:"",meet:BayNightMeet.read(null),stunt:null,plates:BayPlates.read(null),fieldReels:{},shore:BaySwimming.read(null),cab:BayCab.read(null),bodywork:BayRecovery.readBody(null),recovery:BayRecovery.read(null)});
  const posterKey="sundownBay.cineLunaPoster.v1";
  function storedPoster(){
    try{const record=JSON.parse(localStorage.getItem(posterKey)||"null");return BayTakePoster.valid(record)?record:null;}
    catch{return null;}
  }
  function readSave(){
    const result=blankSave();result.stunt=storedPoster();
    try{const raw=JSON.parse(localStorage.getItem("sundownBay.v1")||"null");if(!raw||typeof raw!=="object")return result;
      for(const k of ["wallet","paid","best","rides"])if(Number.isFinite(raw[k])&&raw[k]>=0)result[k]=raw[k];
      result.tuned=raw.tuned===true;result.tapes=Array.isArray(raw.tapes)?[...new Set(raw.tapes.filter(n=>Number.isInteger(n)&&n>=0&&n<5))]:[];
      result.dash=BayBeachDash.readRecord(raw.dash);
      result.regatta=bay.readRecords(raw.regatta);
      result.meet=BayNightMeet.read(raw.meet);
      result.plates=BayPlates.read(raw.plates);
      result.shore=BaySwimming.read(raw.shore);
      result.cab=BayCab.read(raw.cab);
      result.bodywork=BayRecovery.readBody(raw.bodywork);result.recovery=BayRecovery.read(raw.recovery);
      result.fieldReels=BayMarshLine.archive(raw.fieldReels);
      result.fieldQueue=BayCutTape.read(raw.fieldQueue);
      if(BayFerry.routes.some(r=>r.id===raw.ferryLine))result.ferryLine=raw.ferryLine;
      if(Object.hasOwn(BayExposure.routes,raw.edition))result.edition=raw.edition;
      if(raw.resprays&&typeof raw.resprays==="object"&&!Array.isArray(raw.resprays)){
        result.resprays=Object.fromEntries(Object.entries(raw.resprays).filter(([,color])=>finishes.some(f=>f.color===color)));
      }
      if(raw.upgrades&&typeof raw.upgrades==="object"&&!Array.isArray(raw.upgrades)){
        for(const [key,fitted] of Object.entries(raw.upgrades)){
          if(fitted?.engine===true||fitted?.tires===true)result.upgrades[key]={engine:fitted.engine===true,tires:fitted.tires===true};
        }
      }
      result.juneReturned=raw.juneReturned===true&&result.tapes.includes(0);return result;
    }catch{return result;}
  }
  const save=readSave();
  const watchCrew=new BaySurfPatrol.Watch(save.shore.next);
  BayMarshLine.restore(save.fieldReels);
  const clockKey="sundownBay.clock.v1";
  let clockStart;
  try{const value=localStorage.getItem(clockKey);if(value!=null&&value!=="")clockStart=Number(value);}catch{}
  const hours=new BayHours.Clock(clockStart);
  let savedAt=hours.total,room=null,recentDiner=null,roomArtReady=false,marketArtReady=false,cineArtReady=false,cabArtReady=false;
  let cutArtReady=false,onAir=null,ambientField=null,ambientAt=-1;
  function saveTime(){
    try{localStorage.setItem(clockKey,String(hours.total));savedAt=hours.total;}catch{}
  }
  addEventListener("pagehide",()=>{if(play)saveTime();});
  function persist(){
    // Keep large movie stills separate so saves from an older open tab cannot erase the poster.
    try{const {stunt,...progress}=save;localStorage.setItem("sundownBay.v1",JSON.stringify(progress));}catch{/* Session progress is still available. */}
  }
  addEventListener("storage",ev=>{
    if(ev.key?.startsWith("sundownBay.fieldReel.v1.")){BayMarshLine.restore(save.fieldReels);return;}
    if(ev.key!==posterKey)return;
    const record=storedPoster();if(record&&(!save.stunt||record.distance>save.stunt.distance))save.stunt=record;
    else if(record&&save.stunt&&record.distance<save.stunt.distance)try{localStorage.setItem(posterKey,JSON.stringify(save.stunt));}catch{}
  });
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
    if(v.serviceCar)parts.windshield=new BayMesh();
    buildBayCar(shell,v.kind,v.color,parts);
    const install=(name,mesh)=>{const key=v.model+"/"+name;view.add(key,mesh);return key;};
    const rig={shell:install("body",shell),brakes:install("brake",parts.brakes),reverse:install("reverse",parts.reverse),doors:{},wheels:{}};
    if(parts.windshield)rig.windshield=install("windshield",parts.windshield);
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
  const valid=(x,z,r=.42)=>(x>=-184+r&&x<=210-r&&z>=-182+r&&z<=182-r||z>176&&BayCut.land(x,z,r))
    &&!solids.some(s=>Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r);
  // Bring any sidewalk collectible that overlaps a facade out onto its nearest street.
  for(const t of tapes){if(!valid(t.x,t.z,.65)){const ax=nearestAxis(t.x),az=nearestAxis(t.z);if(Math.abs(ax-t.x)<Math.abs(az-t.z))t.x=ax+5.5;else t.z=az+5.5;}}
  function addCar(kind,color,x,z,yaw,path=null,pace=0){
    // The original spawn identifies the same car even after it moves or the fleet is reordered.
    const garageKey=kind+"@"+x.toFixed(2)+","+z.toFixed(2);
    color=save.resprays[garageKey]||color;
    const upgrades=save.upgrades[garageKey]||{engine:false,tires:false};
    const v={id:nextId++,kind,color,garageKey,upgrades,x,z,yaw,path,pace,corner:1,model:carSkin(kind,color),speed:0,vx:0,vz:0,wait:0,used:false,blocked:0,lean:0};
    if(save.bodywork[garageKey]){
      v.damage={...save.bodywork[garageKey]};
      v.wantsCurb=!!path&&v.damage[BayRecovery.worst(v)]>=.55;
    }
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
  const countyLoop=BayCut.circuit();
  for(const [i,kind,color,pace] of [[3,"van","#91ab99",5.4],[10,"hatch","#b99a72",5.9]]){
    const a=countyLoop[i],j=(i+1)%countyLoop.length,b=countyLoop[j];
    const v=addCar(kind,color,a.x,a.z,Math.atan2(b.x-a.x,b.z-a.z),countyLoop,pace);
    v.corner=j;v.speed=pace;
  }
  addCar("hatch","#bc875f",186,321,-1.93);
  const taxiStart=BayCab.stops.marlin,taxi=addCar("cab","#d5a955",taxiStart.x,taxiStart.z,taxiStart.yaw);
  taxi.serviceCar=true;
  const cabs=new BayCab.Service(taxi,save.cab);
  const recoveryYard=BayRecoveryArt.yard,ws=recoveryYard.truck;
  const wrecker=addCar("wrecker","#45847b",ws.x,ws.z,ws.yaw);
  const recovery=new BayRecovery.Service(wrecker,BayRecovery.calls.map(c=>addCar(c.kind,c.color,c.x,c.z,c.yaw)),save.recovery);
  const tow=recovery.lift,dispatchPin={...recoveryYard.della,kind:"recovery-desk",name:"Della Moss · Portside Recovery"};
  locations.push(dispatchPin);
  const roadDrivers=new Map();
  let personalCar=null;
  function restoreParking(){
    const entry=BayMotelParking.read(cars);if(!entry)return;
    const v=entry.v;
    for(const spot of [entry,BayMotelParking.bay,v]){
      const pose={kind:v.kind,x:spot.x,z:spot.z,yaw:spot.yaw};
      if(!fitsCar(v,pose.x,pose.z,pose.yaw)||cars.some(other=>other!==v&&dist(other,pose)<6&&BayDriving.contact(pose,other)))continue;
      Object.assign(v,pose,{path:null,used:true,flatSide:entry.flatSide,flatAxle:entry.flatSide?entry.flatAxle:null,flatLoad:entry.flatSide?1:0});
      BayDriving.settle(v);personalCar=v;break;
    }
  }
  restoreParking();
  // The retired $250 tune covered every car in this fleet. Carry that purchase into each car's record once.
  if(save.tuned){
    for(const v of cars){v.upgrades.engine=true;save.upgrades[v.garageKey]=v.upgrades;}
    save.tuned=false;persist();
  }
  const pos=()=>active?.take?.subject()||(cabs.booking?.stage==="ride"?taxi:null)||skiff||car||hero;
  function cameraSubject(){
    if(cabs.playerHeld){
      const f=cabs.booking.seat;
      return {x:hero.x+(taxi.x-hero.x)*f,z:hero.z+(taxi.z-hero.z)*f,yaw:hero.yaw};
    }
    if(deckStep)return hero;
    if(!transfer)return pos();
    const f=motion.ride?.seat||0,v=transfer.v;
    return {x:hero.x+(v.x-hero.x)*f,z:hero.z+(v.z-hero.z)*f,yaw:hero.yaw};
  }
  const district=(p)=>BayCut.area(p)?(p.x>BayCut.coast(p.z)+2?"Pelican Sound":"Pelican Cut"):p.x>335?"Outer Sound":p.x>216?"Breakwater Bay":p.x>158?"Sol Beach":p.x>112?"Ocean Drive":p.x< -102&&p.z<10?"Port Sol":p.z< -92?"El Mercado":p.z>96&&p.x>43?"Boardwalk":p.x< -65?"Old Palms":"Neon Mile";
  const formatVehicle=v=>genres[v.kind].name;
  function footLevel(x,z){
    const pier=x>=184.3&&bay.landing(x,z);if(pier)return pier.level;
    if(x>205&&BaySwimming.wetSand(x,z)&&x>BaySwimming.coast(z)-1.2)return Math.max(-.82,BaySwimming.floor(x,z));
    if(z>181)return BayCut.height(x,z);
    if(x>166.45)return .007;
    if(x>159.5)return .082;
    if(x>=151)return .076;
    const dx=Math.abs(x-nearestAxis(x)),dz=Math.abs(z-nearestAxis(z));
    if((dx<6.9&&Math.abs(dz-8.3)<1.1)||(dz<6.9&&Math.abs(dx-8.3)<1.1))return .109;
    return Math.min(dx,dz)<7 ? .040 : .077;
  }
  function resetFeet(){swim=null;motion.reset();hero.y=footLevel(hero.x,hero.z);}
  function note(head,line,seconds=3.2){
    $("toast").children[0].textContent=head;$("toast").children[1].textContent=line;$("toast").hidden=false;toastTill=elapsed+seconds;
  }
  function playStart(){
    if(play)return;play=true;$("intro").hidden=true;$("hud").hidden=false;document.activeElement?.blur();cameraSnap();
    if(save.shore.carried)waypoint={...BaySurfPatrol.tower};
    try{if(localStorage.getItem("sundownBay.audio")==="on"){radio=sound.setEnabled(true);$("audioKey").querySelector("span").textContent=radio?"Sol FM":"Sound off";}}catch{}
    captureMouse();note("Marlin Motel","Room 14 is yours. "+(personalCar?"Your "+formatVehicle(personalCar)+" is marked on the map.":cars[0].color===paints[0]?"Keys are in the coral coupe.":"Your "+formatVehicle(cars[0])+" is out front."),4.3);
  }
  const onStreetFeet=()=>play&&!room&&!cabs.playerHeld&&!car&&!skiff&&!swim&&!transfer&&!deckStep&&motion.jumpTime<0;
  const atWatchBoard=()=>onStreetFeet()&&!heat&&dist(hero,BaySurfPatrol.tower)<3.2;
  const siteById=id=>BaySwimming.sites.find(s=>s.id===id);
  function diveFind(){
    if(!swim?.underwater||swim.exit||save.shore.carried||active)return null;
    return BaySwimming.sites.find(s=>!save.shore.returned.includes(s.id)&&dist(hero,s)<2.2&&Math.abs(hero.y-BaySwimming.floor(s.x,s.z)-.18)<1.42);
  }
  function nearBeachRegular(){
    if(!play||car||skiff||room||cabs.playerHeld||transfer||deckStep||swim?.exit||swim?.underwater)return null;
    return watchCrew.actors.find(p=>dist(hero,p)<2.8&&p!==watchCrew.call?.swimmer);
  }
  function coastAction(){
    if(swim?.exit)return true;
    if(watchCrew.towing){watchCrew.release();speak("Tali Moreno","I’ve got the float. I’ll take it from here.");lastHud=-10;return true;}
    if(!active&&!heat&&watchCrew.grab(hero,swim)){
      lastHud=lastMap=-10;speak(watchCrew.call.slip.name,"I'll hold the float. Take me back to the beach.");return true;
    }
    const found=diveFind();
    if(found){
      save.shore.carried=found.id;persist();sound.cue("found");waypoint={...BaySurfPatrol.tower};
      note(found.name,"Bring it to the lost-and-found pegs at the lifeguard tower.",3.8);lastHud=lastMap=-10;return true;
    }
    if(atWatchBoard()&&!active){openPanel("surf-watch");return true;}
    if(!active){
      const person=nearBeachRegular();
      if(person){
        const s=BaySurfPatrol.slips[person.index];
        const line=person===watchCrew.tali?(watchCrew.alert?"Keep an eye on the raised hand beyond the flags.":"Folks pin things they’ve lost to the board at my tower. Take a look.") :
          save.shore.helps[s.style]?s.thanks:s.line;
        speak(person.name,line);return true;
      }
    }return false;
  }
  function stepBeach(dt){
    const event=watchCrew.step(dt,streetTime,pos(),swim);
    if(event==="player-home"){
      const person=watchCrew.last;save.shore.helps[person.style]++;save.shore.next=watchCrew.next;save.wallet+=95;save.paid++;
      persist();sound.cue("paid");note("Sol Beach patrol","Beach club stipend  ·  +$95",4);speak(person.name,BaySurfPatrol.slips[watchCrew.index].thanks);
      lastHud=lastMap=-10;
    }else if(event==="guard-home"){
      save.shore.next=watchCrew.next;persist();
      if(!active&&!room&&dist(pos(),watchCrew.tali)<30)note("Sol Beach patrol","Tali brought "+watchCrew.last.name+" back to shore.",3);
    }else if(event==="whistle"){
      const d=dist(pos(),watchCrew.call.swimmer);
      if(!room&&d<87){sound.cue("shore-whistle",{distance:d});lastHud=lastMap=-10;}
    }
  }
  const byKit=()=>onStreetFeet()&&!heat&&dist(hero,BayCut.station)<3.15;
  const byListeningSite=()=>active?.field?.phase==="find"&&onStreetFeet()&&dist(hero,active.field.source.site)<8;
  const listening=()=>active?.field?.phase==="listen";
  function startField(source){
    if(active||!byKit())return;
    active={job:BayMarshLine.job,field:new BayMarshLine.Run(source)};waypoint=null;
    closePanel();speak("Kit Bell",BayMarshLine.notes[source.id]);
  }
  function fieldAction(){
    const field=active?.field;
    if(listening()){field.lower();cameraSnap();}
    else if(byListeningSite()){
      field.raise(hero);keys.clear();resetPointer();motion.reset();$("speech").hidden=true;
    }else if(byKit()&&field?.phase==="return"){
      BayMarshLine.restore(save.fieldReels);
      const ticket=field.deliver(save.fieldReels);if(!ticket)return false;
      if(ticket.best)BayMarshLine.keep(ticket.id,ticket.take);
      save.wallet+=ticket.pay;save.paid++;save.fieldQueue=ticket.take.tape;persist();active=null;waypoint=null;
      sound.cue("paid");note("Sol FM paid "+cash(ticket.pay),field.source.name+"  ·  "+ticket.take.score+"/100"+(ticket.best?"  ·  Filed as your best":""),4);
      speak("Kit Bell","That’s the one. I’ll run your tape on Sol the next time you get behind the wheel.");
    }else if(byKit()&&!active)openPanel("field-desk");
    else return false;
    lastHud=lastMap=-10;return true;
  }
  function runTape(tape){
    if(!tape)return;
    sound.playField(tape);onAir={tape,at:elapsed};
    lastHud=-10;
  }
  function fieldSignal(){
    if(swim?.underwater)return null;
    if(listening())return active.field.signal;
    const p=pos();if(room||!BayCut.area(p))return null;
    if(streetTime<ambientAt+.18){if(ambientField)ambientField.phase=streetTime;return ambientField;}
    ambientAt=streetTime;ambientField=null;let best=.025;
    for(const s of BayCutWildlife.sources){
      const at=BayCutWildlife.pose(s.id,streetTime,hours),d=dist(p,at);
      const level=at.strength*clamp(1-d/s.range,0,1)**1.45;
      if(level<=best)continue;best=level;
      const yaw=angle(isTop()?cameraRig.yaw:cam.yaw,Math.atan2(at.x-p.x,at.z-p.z));
      ambientField={id:s.id,phase:streetTime,pan:Math.sin(yaw),noise:0,level,monitor:false};
    }return ambientField;
  }
  function stepField(dt){
    if(onAir&&elapsed-onAir.at>3.6)onAir=null;
    if(save.fieldQueue&&(car||skiff)&&!room&&!transfer&&!deckStep){
      runTape(save.fieldQueue);save.fieldQueue=null;persist();
    }
    if(!listening())return;
    const f=active.field,turn=Number(held("ArrowRight","KeyD"))-Number(held("ArrowLeft","KeyA")),tilt=Number(held("ArrowUp","KeyW"))-Number(held("ArrowDown","KeyS"));
    f.aim((turn+pointer.edgeX*.69)*dt*1.30,tilt*dt*.73);hero.yaw=f.yaw;
    let noise=.045+hours.rain*.24;
    for(const v of cars)if(v.speed>1&&Math.abs(v.x-hero.x)<18&&Math.abs(v.z-hero.z)<18)noise+=clamp(1-dist(v,hero)/18,0,1)*.48;
    const event=f.step(streetTime,hero,hours,Math.min(.91,noise),held("Space"));
    if(event==="noise")note("Mostly background","Release Space, turn toward the signal, and roll again.",2.7);
    if(event==="take")openPanel("field-proof");
  }
  const byRoomDoor=()=>onStreetFeet()&&!active&&!heat&&dist(hero,BayMarlinRoom.outside)<2.45;
  const byCounter=()=>onStreetFeet()&&!active&&!heat&&dist(hero,BayMercadoArt.counter)<2.85;
  const atGuestParking=()=>play&&!active&&!heat&&!transfer&&!room&&car&&!car.meetCar&&Math.hypot(car.vx,car.vz)<.55&&BayMotelParking.inside(car);
  function carPin(){
    if(!personalCar||car===personalCar)return null;
    return {kind:"your-car",x:personalCar.x,z:personalCar.z,name:"Your "+formatVehicle(personalCar)};
  }
  function roomAction(){
    if(room?.kind==="cinema")return BayCineRoom.action(room);
    let nearest=null,best=1.35;
    for(const [name,point] of Object.entries(BayMarlinRoom.points)){
      const gap=dist(room,point);if(gap<best){nearest=name;best=gap;}
    }
    return nearest;
  }
  function enterRoom(){
    if(!byRoomDoor())return;
    room={...BayMarlinRoom.spawn,pitch:-.09,stride:0,bob:0};
    keys.clear();resetPointer();$("targetTag").hidden=true;$("speech").hidden=true;
    note("Marlin Motel · 14","Your key sticks. Give it a little lift on the way out.",3.4);
    lastHud=lastMap=-10;hud();
  }
  function leaveRoom(){
    if(!room)return;
    const cinema=room.kind==="cinema";
    room=null;Object.assign(hero,cinema?{x:BayCab.cinema.x-.32,z:BayCab.cinema.z,yaw:-Math.PI/2}:{x:BayMarlinRoom.outside.x+.36,z:BayMarlinRoom.outside.z,yaw:Math.PI/2});
    resetFeet();cameraSnap();resetPointer();keys.clear();lastHud=lastMap=-10;hud();
  }
  function walkRoom(dt){
    const f=Number(held("KeyW","ArrowUp"))-Number(held("KeyS","ArrowDown"));
    const s=Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    const across=Number(held("KeyC"))-Number(held("KeyQ"));
    const swivel=(across*1.70+pointer.edgeX*1.45)*dt;
    if(room.kind==="cinema"){
      if(swivel)BayCineRoom.look(room,swivel/.00325,0);
      BayCineRoom.move(room,dt,f,s,held("ShiftLeft","ShiftRight"));return;
    }
    room.yaw+=swivel;
    const step=2.45*dt/Math.max(1,Math.hypot(f,s)),sin=Math.sin(room.yaw),cos=Math.cos(room.yaw);
    const x=room.x+step*(sin*f+cos*s),z=room.z+step*(cos*f-sin*s),oldX=room.x,oldZ=room.z;
    if(BayMarlinRoom.clear(x,room.z,.23))room.x=x;
    if(BayMarlinRoom.clear(room.x,z,.23))room.z=z;
    const distance=Math.hypot(room.x-oldX,room.z-oldZ);
    room.stride+=distance*4.9;room.bob=ease(room.bob,distance>0?.025:0,9,dt);
  }
  function useRoom(){
    const action=roomAction();
    if(room.kind==="cinema"){
      if(action==="exit")leaveRoom();else if(action==="seat")BayCineRoom.seat(room);else if(action==="rise")BayCineRoom.rise(room);
      else if(action==="program")openPanel("cine-program");lastHud=-10;return;
    }
    if(action==="door")leaveRoom();
    else if(action==="bed"||action==="desk")openPanel("room-"+action);
  }
  function clockPin(place){
    if(watchCrew.towing||cabs.booking)return;
    waypoint={...place};closePanel();note("City map",place.name,2.8);
  }
  function dinerIsOut(person){
    return active?.plate?.customer===person||recentDiner?.customer===person&&recentDiner.until>elapsed||
      hours.market==="open"||hours.market==="setup"&&(person.id==="bel"||person.id==="davi");
  }
  function dinerNearby(){
    if(!onStreetFeet()||heat)return null;
    const who=active?.plate?.customer;
    if(active)return who&&dist(hero,who)<2.7?who:null;
    return BayPlates.regulars.find(person=>dinerIsOut(person)&&dist(hero,person)<2.45);
  }
  function takeOrder(customer){
    if(!byCounter()||hours.market!=="open"||!BayPlates.orders(hours,save.plates).includes(customer))return;
    active={job:BayPlates.job,plate:new BayPlates.Run(customer)};waypoint=null;lastGuide=null;
    closePanel();lastHud=lastMap=-10;note("Rosario’s counter",customer.dish+" for "+customer.name+".",3.5);
    speak("Rosario León",customer.ticket);
  }
  function greetDiner(person){
    if(active?.plate?.customer===person){
      const receipt=active.plate.deliver(save.plates);if(!receipt)return;
      active=null;recentDiner={customer:person,until:elapsed+35};save.wallet+=receipt.amount;save.paid++;persist();saveTime();
      sound.cue("paid");note("An Extra Plate","+"+cash(receipt.amount)+"  ·  "+cash(receipt.tip)+" tip",4.6);
      speak(person.name,receipt.line);lastHud=lastMap=-10;return;
    }
    const lines={davi:"Rosario wraps my dinner in last week's listings. Got the ending spoiled that way once.",
      bel:"I can hear when Rosario opens. The delivery bike backfires right outside the office.",
      lenny:"I give it till six before that griddle smell makes it across the docks.",
      alma:"Best light on the rail comes just before the dinner crowd.",
      ivo:"Try the night counter over at El Mercado. Tell her I sent you."};
    speak(person.name,save.plates.visits[person.id]?person.again:lines[person.id]);
  }
  function enterable(){
    if(swim||cabs.playerHeld)return null;
    let best=null,d=5.1;
    for(const v of cars){const n=dist(hero,v);if(!v.meetCar&&!v.serviceCar&&!v.onLift&&!v.recoveryOwner&&!roadDrivers.get(v)?.seated&&recovery.onBench?.car!==v&&n<d&&(!v.path||v.speed<4)){best=v;d=n;}}
    return best;
  }
  function talk(){
    if(byRoomDoor()){enterRoom();return;}
    if(byCounter()){openPanel("market");return;}
    const diner=dinerNearby();if(diner){greetDiner(diner);return;}
    if(canJoinTake()){openPanel("take-brief");return;}
    if(atTakePoster()){openPanel("take-poster");return;}
    if(canRideWithJules()){boardJules();return;}
    const p=BayLocals.closestSpeaker(walkers,hero),contact=nearbyJobContact(p);
    if(contact){startJob(contact.id);return;}
    if(!active&&!car&&dist(hero,course[0])<4){startJob("dash");return;}
    if(!active&&!car&&dist(hero,maraOnBreak())<3){
      if(save.edition)openPanel("edition");else startJob("exposure");return;
    }
    if(!p)return;
    if(!p.external){p.wait=Math.max(p.wait,4.6);p.alert=1.9;p.yaw=Math.atan2(hero.x-p.x,hero.z-p.z);}
    let text;
    if(p.name==="June"&&save.tapes.includes(0)){
      if(!save.juneReturned){
        save.juneReturned=true;save.wallet+=35;persist();sound.cue("paid");note("Motel demo","June slipped you $35.",3.4);
        text="There it is! That's my brother on drums. Here, let me buy you dinner.";
      }else text="Side A is the band. Side B is eight minutes of my dad asking if it's recording.";
    }else if(heat>1)text="Those lights behind you? They're getting closer.";
    else if(p.fieldSource){
      const score=save.fieldReels[p.fieldSource]?.score;
      if(score&&p.heardScore!==score){
        p.heardScore=score;text=p.fieldSource==="trawler"?"Kit says you taped Little Dot. My mother wants a copy.":"Kit played me your birds. I counted five by ear.";
      }else text=p.lines[p.spoken++%p.lines.length];
    }
    else{const index=p.spoken++;text=save.edition&&index%3===0?
      (save.edition==="live"?"Heard the pier story on Sol FM. My aunt’s already down there.":"Saw the pier on the big screen last night. Whole theater went quiet."):p.lines[index%p.lines.length];}
    speak(p.name,text);
  }
  function speak(name,text){const el=$("speech");el.children[0].textContent=name;el.children[1].textContent=text;el.hidden=false;speechTill=elapsed+6;}
  function honk(){
    if(elapsed<hornReady)return;hornReady=elapsed+.67;sound.cue("horn");
    if(canChallenge()){beginMeet("driver");return;}
    if(takeCurbFare())return;
    for(const p of walkers){if(dist(p,car)<16){p.alert=1.35;p.gesture=1;p.yaw=Math.atan2(car.x-p.x,car.z-p.z);}}
    for(const v of cars){if(v!==car&&v.path&&dist(v,car)<9){v.wait=Math.max(v.wait,.42);}}
  }
  const byCinema=()=>onStreetFeet()&&!active&&!heat&&dist(hero,BayCab.cinema)<2.3;
  let projectionStart=streetTime,lateReelListed=!!save.cab.reel;
  const filmOptions=()=>({stunt:save.stunt,edition:save.edition,second:!!save.cab.reel,
    deliveredBy:save.cab.reel==="player"?"You and Walt Dunn":"Mina Ortiz and Walt Dunn"});
  const cabWindow=()=>cabs.booking?.stage==="ride"&&cabs.booking.window&&!isTop();
  function cabRank(){
    if(!onStreetFeet()||active||heat||cabs.booking||watchCrew.towing)return null;
    const stand=cabs.nearRank(hero);if(stand)return stand;
    if(dist(taxi,hero)>14)return null;
    const rank=cabs.curbHail(hero,chase.road(hero));
    return rank&&valid(rank.stand.x,rank.stand.z,.32)?rank:null;
  }
  function takeCurbFare(){
    if(!car||transfer||active||heat||car.meetCar||car===wrecker&&(tow.target||recovery.held(car)))return false;
    const p=cabs.nearbyFare(car);
    if(!p||!cabs.accept(p,car,doorPlan(car,false,p,1)))return false;
    active={job:{id:"curb-fare",name:"A lift for "+p.name.split(" ")[0],by:p.name},cabFare:p};
    waypoint=null;lastHud=lastMap=-10;speak(p.name,p.to.id===p.job?p.ask:p.back);return true;
  }
  function cabAction(){
    if(cabs.playerHeld)return true;
    if(takeCurbFare())return true;
    if(byCinema()){
      cabs.cancelBooking();room=Object.assign(BayCineRoom.create(),{kind:"cinema"});
      keys.clear();resetPointer();$("targetTag").hidden=$("speech").hidden=true;lastHud=lastMap=-10;hud();return true;
    }
    if(cabRank()){openPanel("cab-rank");return true;}
    if(!onStreetFeet()||active||cabs.booking)return false;
    const p=cabs.people.find(p=>["wait","work"].includes(p.phase)&&dist(p,hero)<2.6);
    if(!p)return false;
    speak(p.name,p.phase==="work"?p.thanks:p.to.id===p.job?p.ask:p.back);return true;
  }
  function cabClearance(v,yaw,l,remaining){
    const sn=Math.sin(yaw),cs=Math.cos(yaw);let space=Infinity,stuck=null;
    const obstacle=(q,width,buffer)=>{
      if(q===v||Math.abs(q.x-v.x)>23||Math.abs(q.z-v.z)>23)return;
      const x=q.x-v.x,z=q.z-v.z,f=x*sn+z*cs,side=x*cs-z*sn;
      if(f<=.09||Math.abs(side)>width||f-buffer>=space)return;
      space=Math.max(0,f-buffer);stuck=q;
    };
    for(const q of cars)obstacle(q,1.67,4.50);
    for(const q of patrol)obstacle(q,1.87,4.80);
    for(const q of walkers)obstacle(q,.98,2.35);
    if(!car&&!room&&!cabs.playerHeld)obstacle(hero,1.08,2.45);
    if(stuck&&remaining>9&&space<9&&((stuck.kind&&!stuck.path&&!stuck.meetCar&&Math.abs(stuck.speed)<.5)||l.block>2.1)){
      const beside={x:v.x-cs*2.4+sn*2.5,z:v.z+sn*2.4+cs*2.5};
      if(fitsCar(v,beside.x,beside.z,yaw)&&!cars.some(q=>q!==v&&q!==stuck&&dist(beside,q)<3.2)){
        l.passUntil=l.at+Math.max(8,space+8);space=Math.max(space,2.6);
      }
    }
    for(const signal of BayStreetArt.signals){
      const x=signal.x-v.x,z=signal.z-v.z,f=x*sn+z*cs;
      if(f>7.2&&f<24&&Math.abs(x*cs-z*sn)<4.3&&Math.abs(cs)>.7!==((streetTime+signal.offset)%14<7))space=Math.min(space,Math.max(0,f-9.6));
    }
    return {gap:space,pass:l.at<(l.passUntil||0)};
  }
  function cabBerth(stop,approaching){
    for(const along of [0,-5.4,5.4,-7.2,7.2]){
      const x=stop.x+Math.sin(stop.yaw)*along,z=stop.z+Math.cos(stop.yaw)*along;
      if(along&&approaching&&((x-approaching.x)*Math.sin(stop.yaw)+(z-approaching.z)*Math.cos(stop.yaw)<2.2||dist({x,z},stop.stand)>9.1))continue;
      const pose={kind:"cab",x,z,yaw:stop.yaw};
      if(fitsCar(taxi,x,z,stop.yaw)&&!cars.some(v=>v!==taxi&&dist(v,pose)<6&&BayDriving.contact(pose,v))){
        return along?{...stop,x,z}:stop;
      }
    }
    return stop;
  }
  const cabEnvironment={hero,motion,ground:footLevel,door:doorPlan,clearance:cabClearance,berth:cabBerth,
    hail:p=>!active&&!cabs.booking&&!heat&&!room&&elapsed>speechTill+1&&
      (onStreetFeet()?dist(p,hero)<3.4:car&&!transfer&&Math.abs(car.speed)<3.5&&dist(car,p)<9),
    nearCurb:v=>BayCab.streetStop(v,chase.road(v))||{id:"roadside",name:"Roadside",stand:BayDriving.world(v,2.1,-1)}};
  function cabEvent(event,p){
    lastHud=lastMap=-10;
    if(event==="delivered"){
      if(!lateReelListed&&save.cab.reel){
        const earlier=BayCineProgram.describe({...filmOptions(),second:false}).reduce((n,f)=>n+f.seconds,0);
        projectionStart=streetTime-mod(streetTime-projectionStart,earlier);lateReelListed=true;
      }
      if(p.personal){
        const tip=Math.max(0,30-10*p.jolt),pay=p.pay+tip;
        save.wallet+=pay;save.paid++;active=null;sound.cue("paid");
        note("Fare paid",cash(p.pay)+(tip?"  ·  "+cash(tip)+" smooth-ride tip":""),4);speak(p.name,p.to.id===p.job?p.thanks:"Right here is perfect. I owe you one.");
      }else if(!active&&!room&&dist(pos(),p)<22)speak(p.name,p.to.id===p.job?p.thanks:"Thanks, Mina. See you on the next one.");
      persist();
    }else if(event==="hail")speak(p.name,p.to.id===p.job?p.ask:p.back);
    else if(event==="boarded")note(p.name,p.to.name+"  ·  Stop beside the curb",3);
    else if(event==="remark")speak(p.name,p.road);
    else if(event==="ready")speak("Mina Ortiz","Seventeen, right here. Hop in on the passenger side.");
    else if(event==="moving")speak("Mina Ortiz",p.to.id==="luna"?"Cine Luna it is. Walt always saves me an aisle seat.":"I know the way to "+p.to.name+". Sit back.");
    else if(event==="window-talk")speak("Mina Ortiz",({luna:"My dad took me to the Luna every Sunday. Third row, on the aisle.",marlin:"If Rosario asks, I’ve had dinner. She’s already fed me twice today.",wheel:"That snare by the wheel? That’s Otis. Even with the window up I can tell.",flowers:"Bea puts a sprig of mint in every bunch she wraps. Whole cab smells of it."})[p.to.id]);
    else if(event==="left-rank")note("Bay Cab","Mina released the booking when you left the rank.",2.6);
    else if(event==="arrived"){
      save.wallet-=Math.min(save.wallet,p.price);persist();resetFeet();cameraSnap();keys.clear();
      note("Cab 17",p.price?cash(p.price)+" fare  ·  "+cabs.location.name:"First ride on the house  ·  "+cabs.location.name,4);
    }
  }
  const byDella=()=>onStreetFeet()&&dist(hero,recovery.della)<3.15;
  function keepBodywork(v){
    if(!v.garageKey||v.meetCar||v.recoveryOwner)return;
    if(BayRecovery.worst(v))save.bodywork[v.garageKey]={...v.damage};
    else delete save.bodywork[v.garageKey];
    if(v===personalCar)BayMotelParking.write(v);
  }
  function dent(v,x,z,speed){
    if(!BayRecovery.impact(v,x,z,speed))return;
    keepBodywork(v);
    if(v.path&&!v.recoveryOwner&&v.damage[BayRecovery.worst(v)]>=.55)v.wantsCurb=true;
  }
  function towable(v){
    if(!v||v===wrecker||v.path||v.kind==="cruiser"||v.meetCar||v.serviceCar||roadDrivers.get(v)?.seated||recovery.onBench?.car===v)return false;
    if(v.recoveryOwner)return recovery.call?.p.car===v&&recovery.call.p.phase==="passenger";
    return v!==active?.ferry?.ride&&v!==active?.story?.ride&&!cabs.people.some(p=>p.ride===v);
  }
  function towClear(v,q){
    if(!fitsCar(v,q.x,q.z,q.yaw))return false;
    const probe={...q,kind:v.kind};
    if(BayDriving.contact(probe,wrecker))return false;
    for(const other of cars)if(other!==v&&other!==wrecker&&dist(other,q)<6.6&&BayDriving.contact(probe,other))return false;
    for(const unit of patrol)if(dist(unit,q)<6.6&&BayDriving.contact(probe,unit))return false;
    return true;
  }
  function liftAction(){
    if(car!==wrecker||transfer)return false;
    if(!BayRecovery.parked(wrecker)){note("Portside Recovery","Come to a stop to work the lift.",2);return true;}
    const p=recovery.call?.p,vehicle=tow.nearest(cars,towable,p?.car);
    if(p&&dist(wrecker,p.car)<13&&p.phase!=="passenger"&&tow.state==="down"){note(p.name,"Give me a second to get aboard.",2);return true;}
    const action=tow.operate(vehicle);
    if(action==="align")note("Wheel lift","Line up behind the front tires. Hold V to look down the boom.",2.5);
    if(action==="deploy")note("Wheel lift","Back the crossbar under the front tires. Press G to raise them.",3.5);
    if(action){lastHud=lastMap=-10;}
    return true;
  }
  function recoveryWalkway(a,b,v){
    const obstacles=[v,wrecker].filter((o,i,list)=>o&&list.indexOf(o)===i);
    const clear=(x,z)=>valid(x,z,.23)&&obstacles.every(o=>BayDriving.clearance(o,{x,z})>.21);
    const nodes=[a,b];
    for(const o of obstacles){
      const s=bayCarLayout(o.kind);
      for(const x of [-s.track-.52,s.track+.52])for(const z of [-s.halfLength-.54,s.halfLength+.54]){
        const q=BayDriving.world(o,x,z);if(clear(q.x,q.z))nodes.push(q);
      }
    }
    const visited=new Set(),cost=nodes.map(()=>Infinity),prev=[];cost[0]=0;
    for(;;){
      let i=-1,min=Infinity;
      for(let j=0;j<nodes.length;j++)if(!visited.has(j)&&cost[j]<min){i=j;min=cost[j];}
      if(i<0)return null;
      if(i===1){const path=[];for(let j=1;j!==0;j=prev[j])path.unshift(nodes[j]);return path;}
      visited.add(i);
      for(let j=1;j<nodes.length;j++){
        if(visited.has(j))continue;
        const a=nodes[i],b=nodes[j],d=dist(a,b),count=Math.max(1,Math.ceil(d/.37));
        if(min+d>=cost[j])continue;
        let open=true;for(let k=1;k<=count;k++){const t=k/count;if(!clear(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)){open=false;break;}}
        if(open){cost[j]=min+d;prev[j]=i;}
      }
    }
  }
  function leaveRecoveryYard(p){
    const v=p.car,down=Math.cos(v.yaw)<-.2;
    const way=down?[{x:-82,z:-28},{x:-77.2,z:-32},{x:-74.5,z:-35},{x:-74.48,z:-42,dir:2}]:
      [{x:-85.6,z:-7.0},{x:-84.7,z:-4.2},{x:-82,z:-2.7},{x:-79,z:-2.48,dir:1}];
    const end={...p.slip,dir:p.slip.yaw===0?0:2},route=BayCab.route(way.at(-1),end);
    v.path=[{x:v.x,z:v.z},...way,...route.pts.slice(1)];v.corner=1;v.pace=8.1;v.wait=.45;v.blocked=0;v.reaction=null;v.wantsCurb=false;
  }
  const recoveryEnv={ground:footLevel,door:doorPlan,driver:()=>car,heat:()=>heat,
    walkway:recoveryWalkway,offscreen:p=>dist(pos(),p)>105&&dist(pos(),p.car)>105,
    roadside:(p,v)=>dist(p,v)<16?BayDriving.world(v,2.8,0):BayCab.streetStop(p,chase.road(p))?.stand||{x:p.x,z:p.z},
    depart:leaveRecoveryYard,returned:p=>{
      const v=p.car;
      if(v.path&&!(v.corner===0||v.corner>=v.path.length-1&&dist(v,p.slip)<.35))return false;
      if(v.path){v.path=null;BayDriving.settle(v);v.yaw=p.slip.yaw;}
      return true;
    }};
  function takeRecovery(p){
    if(active||heat||watchCrew.towing||cabs.booking||!recovery.accept(p))return;
    active={job:{id:"recovery",name:"Portside Recovery",by:"Della Moss"},recovery:true};waypoint=null;
    if(panel)closePanel();lastMap=lastHud=-10;
    if(dist(pos(),p)<5)speak(p.name,p.slip.ask);
    else speak("Della Moss",p.name+"’s waiting on "+p.slip.place+". Take my wrecker. The lift switch is by the gear lever.");
  }
  function recoveryAction(){
    if(transfer||room||swim||skiff||deckStep||cabs.playerHeld||watchCrew.towing||heat)return false;
    if(byDella()&&!active){openPanel("recovery-desk");return true;}
    const caller=onStreetFeet()&&!active?recovery.offer(hero):null;
    if(caller){takeRecovery(caller);return true;}
    if(!active&&!cabs.booking&&car===wrecker&&!tow.target&&BayRecovery.parked(car)&&!inServiceBay(car)&&!atGuestParking()){openPanel("recovery-desk");return true;}
    if(!active&&onStreetFeet()){
      const p=recovery.people.find(p=>p.phase==="home"&&dist(p,hero)<2.7);if(p){speak(p.name,p.slip.thanks);return true;}
      for(const [v,p] of roadDrivers)if(!p.seated&&dist(p,hero)<2.8){
        speak("Stranded driver",v.damage?.front>.6?"The hood’s steaming. Della at Portside has a truck that’ll take it.":"I’ve got my hazards on. Know the tow yard over at Portside Tire?");
        if(!waypoint){waypoint={...dispatchPin};lastHud=lastMap=-10;}return true;
      }
    }
    return false;
  }
  function recoveryEvent(event,p){
    lastMap=lastHud=-10;
    if(event==="attached")note("Front wheels secured","Take wide corners. Stop and press G to set the car down.",3);
    else if(event==="blocked")note("Wheel lift","Something is beside the car. Straighten the approach and try again.",2.6);
    else if(event==="released"){
      if(p===personalCar)BayMotelParking.write(p);
      if(recovery.handoff(p,recoveryEnv))speak("Della Moss","Right there. Set her down and give me room by the hood.");
      else if(BayRecovery.dropReady(p)&&heat)note("Portside Tire","Lose the patrol, then bring the car back on the lift.",3.4);
      else if(BayRecovery.dropReady(p)&&BayRecovery.worst(p))note("Portside Tire","Leave Della a clear path beside the front wheels.",3);
      else note("Wheel lift","Car on the ground.",2);
    }else if(event==="aboard"&&recovery.call?.p===p)speak(p.name,"I’m in. Back the lift up to the front tires.");
    else if(event==="remark")speak(p.name,p.slip.riding);
    else if(event==="straightened"){
      p.roadside=p.wantsCurb=false;p.pullOver=null;keepBodywork(p);persist();
      if(!p.recoveryOwner)note("Portside Tire",formatVehicle(p)+" back in shape. The keys are yours.",3.4);
    }else if(event==="finished"){
      const {p:owner,call}=p,tip=Math.max(0,30-call.jolts*10);
      if(active?.recovery)active=null;save.wallet+=owner.slip.pay+tip;save.paid++;persist();sound.cue("paid");
      speak(owner.name,owner.slip.thanks);note("Recovery paid",cash(owner.slip.pay)+(tip?"  ·  "+cash(tip)+" careful tow":""),4.6);
    }
  }
  function boardable(){
    if(swim)return null;
    const dock=bay.landing(hero.x,hero.z);if(!dock||motion.jumpTime>=0)return null;
    return boats.find(v=>v.dock===dock&&dist(v,hero)<5.1)||null;
  }
  function vacant(v,dock,side){return !boats.some(o=>o!==v&&o.dock===dock&&o.side===side);}
  function returnBoat(v,first){
    for(const d of [first,...bay.docks.filter(d=>d!==first)])for(const side of [-1,1]){
      if(vacant(v,d,side)){bay.moor(v,d,side);return;}
    }
  }
  function nearestMooring(v){
    let best=null,range=6;
    for(const dock of bay.docks)for(const side of [-1,1]){
      if(!vacant(v,dock,side))continue;
      const d=dist(v,bay.berth(dock,side));
      if(d<range){best={dock,side};range=d;}
    }return best;
  }
  function openToSwim(x,z,depth){
    if(!BaySwimming.water(x,z))return false;
    if(depth<1.18&&bay.landing(x,z,-.13)||Math.hypot(x-bay.beacon.x,z-bay.beacon.z)<4.5)return false;
    for(const v of civilianFleet)if(BaySwimming.insideHull(v,x,z,depth))return false;
    for(const v of harbor.units)if(BaySwimming.insideHull(v,x,z,depth))return false;
    const ferry=ferryScene?.ship;
    if(ferry&&depth<1.65&&BaySwimming.insideHull(ferry,x,z,0,3.22,9.3))return false;
    for(const [sx,sz,size,yaw] of bay.sails)if(Math.abs(x-sx)<6&&Math.abs(z-sz)<6&&BaySwimming.insideHull({x:sx,z:sz,yaw},x,z,depth,1.1*size,2.55*size))return false;
    if(z>292&&Math.abs(x-284)<18&&depth<2.7){
      const h=BayCutWildlife.trawlerHull(streetTime,hours);
      if(BaySwimming.insideHull(h,x,z,0,h.halfWidth+.18,h.halfLength+.18))return false;
    }
    return true;
  }
  function enterSurf(height=0){
    if(active?.dash)dropJob();
    swim=new BaySwimming.Swim(hero,height);swim.vx=motion.vx;swim.vz=motion.vz;motion.reset();
    hero.y=BaySwimming.surfaceY(hero,streetTime);sound.cue("splash");lastHud=lastMap=-10;
  }
  function seaExit(){
    if(!swim||swim.depth>.55||swim.exit)return null;
    let best=null,range=2.65;
    for(const l of BaySwimming.ladders){
      const d=dist(hero,l);
      if(d<range&&hero.x>l.x-.24){best={type:"ladder",l,end:{x:l.x-.82,z:l.z,y:l.y,yaw:-Math.PI/2}};range=d;}
    }
    for(const v of boats){
      if(Math.abs(v.speed)>2.1||dist(hero,v)>4.9)continue;
      for(const [sx,sz] of [[-1.25,-.9],[1.25,-.9],[0,-2.8]]){
        const grab=BayDriving.world(v,sx,sz),d=dist(hero,grab);if(d>=range)continue;
        best={type:"board",v,grab,end:seatPoint(v)};range=d;
      }
    }return best;
  }
  function seaTransfer(a){
    if(watchCrew.towing){note("Sol Beach patrol","Bring the swimmer to the shallows, or press F to let Tali take over.",2.8);return;}
    a.f=0;a.start={...hero,y:hero.y-1.25};swim.exit=a;keys.clear();lastHud=-10;
  }
  function overGunwale(){
    if(active?.ferry){note("Inez Cruz","Let’s finish the crossing first.",2.4);return false;}
    const v=skiff;
    for(const [x,z] of [[1.72,-1],[-1.72,-1],[0,-3.45]]){
      const water=BayDriving.world(v,x,z);if(!openToSwim(water.x,water.z,0))continue;
      const seat=seatPoint(v);skiff=null;regattaResult=null;Object.assign(v,{speed:0,vx:0,vz:0,yawRate:0,throttle:0});
      motion.reset();swim=new BaySwimming.Swim(hero);
      swim.exit={type:"launch",v,start:{...seat,y:v.y+.12},end:{...water,y:BaySwimming.surfaceY(water,streetTime)-1.25,yaw:Math.atan2(water.x-v.x,water.z-v.z)},f:0};
      keys.clear();lastHud=-10;return true;
    }
    note("At the helm","Move the hull clear of the pier to go over the side.",2.5);return false;
  }
  function stepSeaTransfer(dt){
    const a=swim.exit,duration=a.type==="launch"?.83:a.type==="board"?1.16:1.34;
    a.f=Math.min(1,a.f+dt/duration);
    const f=a.f*a.f*(3-2*a.f),end=a.type==="board"?seatPoint(a.v):a.end;
    hero.x=a.start.x+(end.x-a.start.x)*f;hero.z=a.start.z+(end.z-a.start.z)*f;
    hero.y=a.start.y+(end.y-a.start.y)*f+Math.sin(a.f*Math.PI)*(a.type==="launch"?.32:.15);
    hero.yaw=a.start.yaw+angle(a.start.yaw,end.yaw)*f;
    if(a.f<1)return;
    if(a.type==="launch"){
      swim.exit=null;hero.y=BaySwimming.surfaceY(hero,streetTime);sound.cue("splash");note("Over the side","Swim back to the hull and press E to climb aboard.",3);
    }else if(a.type==="board"){
      const v=a.v,d=v.dock,side=v.side;swim=null;skiff=v;v.dock=null;hullChoice=v.kind;
      if(d)active?.ferry?.reserveBoat(v,d,side);
      pilot(v,1,dt);Object.assign(hero,seatPoint(v));note(bay.hulls[v.kind].name,"Back at the helm.",2);
    }else{resetFeet();note(a.l.dock.name,"Back on the boards.",2);}
    lastMap=lastHud=-10;
  }
  function swimStep(dt){
    if(swim.exit){stepSeaTransfer(dt);return;}
    const f=Number(held("KeyW","ArrowUp"))-Number(held("KeyS","ArrowDown")),r=Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    const yaw=cameraRig.yaw,control={x:Math.sin(yaw)*f+Math.cos(yaw)*r,z:Math.cos(yaw)*f-Math.sin(yaw)*r,
      dive:held("Space"),fast:held("ShiftLeft","ShiftRight"),towing:watchCrew.towing};
    const wasUnder=swim.underwater;
    if(swim.step(dt,hero,streetTime,control,openToSwim)){resetFeet();lastHud=-10;}
    else if(wasUnder!==swim.underwater){lastHud=-10;if(!swim.underwater)sound.cue("splash");}
  }
  function pilot(v,f,dt){
    const r=motion.ride||(motion.ride={handle:[0,0,0]});
    Object.assign(r,{side:-1,seat:f,seatY:.62,floor:.25,steer:v.steer,inner:f,outer:f,duck:0,latchDip:0,reach:0,pull:0,passenger:false});
    motion.step(dt,0,0);
  }
  function seatPoint(v){
    const p=chassisPoint(v,-.38,0,-.35,v.y);return {x:p.x,z:p.z,y:p.y,yaw:v.yaw};
  }
  function useLanding(){
    if(!skiff){
      const v=boardable();if(!v)return;
      if(active?.dash)dropJob();
      deckStep={v,entering:true,f:0,start:{...hero},dock:v.dock,side:v.side};regattaResult=null;
    }else{
      const crossing=active?.ferry;
      if(crossing&&(crossing.waitingAtDock(skiff)||crossing.phase==="jump")){note("Inez Cruz","Give me a second to get across.",2);return;}
      if(active?.regatta){note("Outboard club","Finish the race or leave it through Jobs to dock.",2.7);return;}
      const berth=nearestMooring(skiff);
      if(Math.hypot(skiff.vx,skiff.vz)>2.1){note("At the helm",berth?"Ease below 4 knots to tie up.":"Ease below 4 knots to go over the side.",3);return;}
      if(!berth){overGunwale();return;}
      deckStep={v:skiff,entering:false,f:0,start:{...seatPoint(skiff)},origin:{x:skiff.x,z:skiff.z,yaw:skiff.yaw},...berth};
      skiff.speed=skiff.vx=skiff.vz=0;
    }
    keys.clear();lastHud=-10;
  }
  function stepLanding(dt){
    const a=deckStep,v=a.v,d=a.dock;
    a.f=Math.min(1,a.f+dt/.88);const t=a.f*a.f*(3-2*a.f),seat=a.entering?t:1-t;
    if(!a.entering){const m=bay.berth(d,a.side);v.x=a.origin.x+(m.x-a.origin.x)*t;v.z=a.origin.z+(m.z-a.origin.z)*t;v.yaw=a.origin.yaw+angle(a.origin.yaw,m.yaw)*t;}
    const to=a.entering?seatPoint(v):{x:d.x+.7,z:d.z+a.side*(d.headD*.5-.77),y:d.level,yaw:-a.side*Math.PI*.5};
    hero.x=a.start.x+(to.x-a.start.x)*t;hero.z=a.start.z+(to.z-a.start.z)*t;
    hero.y=a.start.y+(to.y-a.start.y)*t+Math.sin(Math.PI*t)*.21;hero.yaw=a.start.yaw+angle(a.start.yaw,to.yaw)*t;
    pilot(v,seat,dt);
    if(a.f<1)return;
    if(a.entering){skiff=v;v.dock=null;hullChoice=v.kind;active?.ferry?.reserveBoat(v,d,a.side);note(bay.hulls[v.kind].name,"W to open the throttle  ·  Space to trim out",3);}
    else{bay.moor(v,d,a.side);skiff=null;regattaResult=null;resetFeet();note(d.name,"Lines secured.",2);}
    deckStep=null;lastHud=lastMap=-10;
  }
  function openRaceSheet(){
    if(transfer||deckStep)return;
    if(heat){note("Outboard club","Lose your wanted stars before joining the club launch.",3);return;}
    if(active){note("Outboard club","Finish or drop your current job to join a race.",3);return;}
    openPanel("marina");
  }
  function castOff(kind,courseId,racing){
    if(heat||active||transfer||deckStep||watchCrew.towing)return false;
    const home=skiff?.dock||bay.landing(hero.x,hero.z)||bay.docks[0];
    const v=(skiff?.kind===kind?skiff:null)||boats.find(b=>b.kind===kind&&b.dock===home)||boats.find(b=>b.kind===kind),c=bay.courses.find(b=>b.id===courseId);
    if(!v||!c)return false;
    if(skiff&&skiff!==v)returnBoat(skiff,home);
    if(car){BayDriving.settle(car);car=null;}
    skiff=v;hullChoice=kind;courseChoice=courseId;dashResult=regattaResult=null;waypoint=null;resetFeet();
    if(racing){active={job:marinaJob,regatta:new bay.Race(c,v,clubBoat)};}
    else{
      const dock=v.dock||home,preferred=v.side||1,side=vacant(v,dock,preferred)?preferred:-preferred;
      bay.moor(v,dock,side);v.dock=null;v.x+=2.3;
    }
    pilot(v,1,1/60);Object.assign(hero,seatPoint(v));keys.clear();cameraSnap();closePanel();
    if(racing)note(c.name,"Pass between the red and green marks.",2.4);
    else note(bay.hulls[kind].name,"W to throttle  ·  A/D to steer  ·  Hold Space to trim",4);
    return true;
  }
  function finishRegatta(r){
    const c=r.course,first=r.rivalTime===null||r.playerTime<=r.rivalTime,pay=first?c.purse:90,key=c.id+"/"+skiff.kind;
    const old=save.regatta[key]||0,best=!old||r.playerTime<old;
    if(best)save.regatta[key]=r.playerTime;
    save.wallet+=pay;save.paid++;persist();
    regattaResult={c,kind:skiff.kind,first,pay,time:r.playerTime,best:save.regatta[key],record:best};active=null;
    sound.cue("paid");openPanel("regatta-result");
  }
  function stepWater(dt){
    const race=active?.regatta;
    if(ferryScene)ferryScene.ship.step(dt,streetTime);
    const input=skiff&&{gas:held("KeyW","ArrowUp"),back:held("KeyS","ArrowDown"),steer:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft")),trim:held("Space")};
    if(input&&active?.ferry)active.ferry.helm(skiff,input,held("KeyF"));
    if(race){
      const event=race.step(dt,streetTime,input);
      if(event==="finish"){finishRegatta(race);return;}
      if(event==="gate"){lastHud=lastMap=-10;sound.cue("job");}
    }else if(skiff&&!deckStep){bay.helm(skiff,dt,input.gas,input.back,input.steer,input.trim,streetTime);bay.disturb(skiff,clubBoat,streetTime);bay.separate(skiff,clubBoat);}
    if(!race){
      if(dist(clubBoat,cruiseMarks[cruiseLeg])<10)cruiseLeg=(cruiseLeg+1)%cruiseMarks.length;
      bay.follow(clubBoat,cruiseMarks[cruiseLeg],11,dt,streetTime);
    }
    for(const v of boats)if(v!==skiff||deckStep)bay.pose(v,streetTime,dt);
    if(skiff&&!deckStep){
      for(const v of boats)if(v!==skiff)bay.separate(skiff,v);
      if(skiff.z>289&&Math.abs(skiff.x-284)<19)bay.clearWorkingHull(skiff,BayCutWildlife.trawlerHull(streetTime,hours));
      Object.assign(hero,seatPoint(skiff));pilot(skiff,1,dt);
    }
  }
  function switchCar(){
    if(cabs.booking){
      if(cabs.booking.stage==="ready"){
        if(dist(hero,taxi)<8.8&&cabs.board(hero,doorPlan(taxi,false,hero,1))){keys.clear();lastHud=-10;}
        else note("Cab 17","Walk around to Mina’s passenger door.",2);
        return;
      }
      if(cabs.playerHeld){if(cabs.askOut())speak("Mina Ortiz","Sure. I’ll pull into the next clear curb.");return;}
    }
    if(swim){const a=seaExit();if(a)seaTransfer(a);return;}
    if(active?.take)return;
    if(transfer||deckStep)return;
    if(!car&&canRideWithJules()){boardJules();return;}
    if(active?.meet&&meet.role==="photo"){note("Jules","We’ll pull over at Cine Luna.",2);return;}
    if(active?.meet&&meet.role==="driver"){note("Romy Vale","Finish in the car you brought. J opens your phone.",2.5);return;}
    if(skiff||!car&&boardable()){useLanding();return;}
    const v=car||enterable();
    if(v&&(active?.story?.holds(v)||active?.ferry?.holds(v)||cabs.holds(v)||recovery.held(v)))return;
    if(!v){note("On foot","Walk up to a parked or stopped car.",1.9);return;}
    if(car&&Math.max(Math.abs(v.speed),Math.hypot(v.vx,v.vz))>4){note("Driver's seat","Slow down to step out.",1.8);return;}
    if(!car&&motion.jumpTime>=0){note("Driver's seat","Land beside the car.",1.5);return;}
    const passenger=!!car&&v===meet.jules;
    const approach=doorPlan(v,!!car,hero,passenger?1:0);
    if(!approach){note("Driver's seat",car?"Both doors need more room.":"Walk around to a clear door.",2);return;}
    if(cabs.booking)cabs.cancelBooking();
    if(active?.dash){active=null;note("Low Tide Dash","You left the course.",2);}
    dashResult=null;skidLast=null;
    transfer={v,passenger,exiting:!!car,side:approach.side,points:approach.points,next:0,
      parked:!car||Math.hypot(v.vx,v.vz)<.16,p:car?1:0,aligned:!!car,turnTime:0};
    if(!car){BayDriving.settle(v);v.reaction=null;v.hornAt=-100;}
    lastHud=-10;
  }
  function doorPlan(v,exiting,actor=hero,side=0){
    const clear=(x,z,r)=>{
      if(!valid(x,z,r))return false;
      for(const o of (patrol.length?cars.concat(patrol):cars)){
        if(o===v||Math.abs(o.x-x)>3||Math.abs(o.z-z)>3)continue;
        if(BayDriving.clearance(o,{x,z})<r)return false;
      }
      return true;
    };
    if(actor===hero&&(active?.story?.ride===v||active?.ferry?.ride===v||active?.cabFare?.ride===v||v===wrecker&&recovery.people.some(p=>p.ride===v)))side=-1;
    return BayCarAccess.plan(v,actor,exiting,clear,side);
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
    BayCarAccess.pose(v,a.side,a.p,hero,motion,footLevel,dt,a.passenger);
    if(a.exiting?a.p>0:a.p<1)return;
    if(a.passenger)v.passengerDoor=0;else v.doorAngle=0;
    transfer=null;lastHud=-10;lastMap=-10;skidLast=null;
      if(a.exiting){car=null;resetFeet();BayDriving.settle(v);if(v===personalCar)BayMotelParking.write(v);return;}
    const borrowed=!!v.path;v.path=null;v.roadside=v.wantsCurb=false;v.pullOver=null;v.used=true;car=v;
    if(a.passenger){beginMeet("photo");return;}
    if(borrowed){addHeat(1);note("Dispatch","A driver called in the switch.",2.3);}
  }
  function clearPatrol(){patrol.length=0;boxed=0;lastIncident=-100;crashContacts.clear();chase.reset();backup.reset();harbor.reset();}
  function addHeat(n){
    const prev=heat;heat=Math.min(5,heat+n);lastIncident=elapsed;
    chase.report(pos(),skiff?.vx??car?.vx??motion.vx,skiff?.vz??car?.vz??motion.vz,!!skiff);lastHud=-10;
    if(!prev)sound.cue("heat");
  }
  function reportCrash(other,inward,closing){
    if(inward<4||closing<5.8||crashContacts.has(other))return;
    crashContacts.set(other,true);
    if(active?.cabFare?.phase==="ride"&&active.cabFare.ride===car)active.cabFare.jolt++;
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
    BayFerry.job,
    BayExposure.job,
    marinaJob,
    {id:"dash",name:"Low Tide Dash",by:"Sol Beach Lifeguards",desc:"Race your ghost from the boardwalk to the lifeguard tower. Each clean hurdle earns an extra $15.",pay:90},
    {id:"getaway",name:"The Marlin Job",by:"Jules",desc:"Pick up your partner at the motel. Bring the car to Port Sol while the city is looking for you.",pay:320},
    {id:"fare",name:"Last Fare",by:"Bay Cab",desc:"Pick up a local and take them across town. A quick ride earns a bigger tip.",pay:150},
    {id:"tape",name:"Dead Air",by:"Sol FM",desc:"Meet Nia on foot at Cine Luna. Get the master tape to the DJ on the North Boardwalk.",pay:185},
    {id:"race",name:"Coastline Circuit",by:"Sol Motor Club",desc:"Run four checkpoints along the coast and race your best time.",pay:205}
  ];
  const jobContacts=[
    {...BayFerry.pickup,id:"ferry",name:"Inez Cruz · Marlin Motel",prompt:"Ask Inez about the ferry"},
    {id:"getaway",name:"Jules · Marlin Motel",x:venues.motel.x+1.1,z:venues.motel.z,yaw:-1.6,style:2,role:"local",prompt:"Meet Jules for The Marlin Job"},
    {id:"fare",name:"Bay Cab dispatch",x:80.4,z:19,yaw:-1.4,style:5,role:"local",prompt:"Ask Bay Cab for a fare"},
    {id:"tape",name:"Nia · Cine Luna",x:venues.cinema.x+1.1,z:venues.cinema.z,yaw:-1.6,style:4,role:"courier",prompt:"Talk to Nia about the master tape"},
    {id:"race",name:"Sol Motor Club · Ocean Drive",x:152.4,z:4.8,yaw:-1.8,style:3,role:"runner",prompt:"Enter the Coastline Circuit"}
  ];
  const meetPin={id:"night-meet",x:-109,z:-5,name:"Portside After Dark"};
  const takePin={id:"one-good-take",x:-98,z:-6.1,name:"Romy Vale · One Good Take"};
  const jobSites=[...jobContacts,{...BayExposure.pickup,id:"exposure",name:"Mara Vega · Marlin Motel"},{...course[0],id:"dash",name:"Lifeguards’ chalk line"},meetPin,takePin,BayCut.station];
  function availableJobPins(){
    if(!play||active)return [];
    return jobSites.filter(s=>(s.id!=="ferry"||!ferryScene)&&(s.id!=="exposure"||!save.edition)
      &&(![meetPin,takePin].includes(s)||meet.phase==="sleep"||meet.phase==="idle")&&(s.id!=="getaway"||!meet.rival));
  }
  function nearbyJobContact(speaker){
    if(!play||active||car||skiff||transfer||deckStep)return null;
    let closest=null,range=speaker?Math.min(2.8,dist(hero,speaker)):2.8;
    for(const contact of jobContacts){
      if(contact.id==="ferry"&&ferryScene)continue;
      const d=dist(hero,contact);if(d<range){range=d;closest=contact;}
    }
    return closest;
  }
  function startJob(id){
    if(active||watchCrew.towing||cabs.playerHeld)return;
    cabs.cancelBooking();
    const j=jobs.find(v=>v.id===id);if(!j)return;
    if(room)leaveRoom();
    if(id==="regatta"){openRaceSheet();return;}
    if(deckStep)return;
    if(id==="ferry"){if(!transfer)openPanel("ferry");return;}
    regattaResult=null;
    dashResult=null;
    if(id==="exposure"){
      active={job:j,story:new BayExposure.Run()};waypoint=null;closePanel();
      note("Last Exposure","Marlin Motel  ·  Ocean Drive",3.6);
      speak(j.by,"See the camera bag? That’s me. Bring the car around. I need a shot down at the port.");return;
    }
    if(id==="dash"){
      active={job:j,stops:course,index:0,clock:0,running:false,dash:null,ghost:null,showGhost:false};
      waypoint=null;closePanel();sound.cue("job");
      if(!car&&!skiff&&!transfer&&!heat&&dist(hero,course[0])<35)lineUpDash();
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
    if(car||skiff||deckStep||heat)return;
    if(active?.dash){lineUpDash();return;}
    if(!active&&dashResult&&elapsed<dashResult.until){
      startJob("dash");if(!active.dash)lineUpDash();
    }
  }
  function advanceDash(dt){
    if(car||skiff||deckStep)return;
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
  const freeTowTarget={...recoveryYard.drop,kind:"recovery-drop",name:"Portside handoff lane"};
  const currentTarget=()=>watchCrew.towing?watchCrew.target():active?.recovery?recovery.target(car):cabs.booking||active?.cabFare?cabs.target(car):active?.field?active.field.target():active?.plate?active.plate.customer:active?.take?BayTake.runway:active?.meet?meet.target():active?.ferry?active.ferry.target(car,skiff):active?.regatta?active.regatta.target():active?.story?active.story.target(car):active?active.stops[active.index]:car===wrecker&&tow.target&&(BayRecovery.worst(tow.target)||tow.target.flatSide)?freeTowTarget:waypoint;
  function streetTarget(){
    const target=currentTarget();
    return target&&(active?.recovery||target===freeTowTarget||target.kind==="recovery-desk")&&dist(pos(),target)<14?null:target;
  }
  let lastGuide=null;
  function roadGuide(target){
    if(active?.meet){
      if(meet.role!=="driver")return null;
      return {points:[car,...meet.route.gates.slice(meet.gate)],meters:dist(car,target),turn:meet.gate===meet.route.gates.length-1?"Finish northbound under the marquee":"Checkpoint "+(meet.gate+1)+" of "+meet.route.gates.length};
    }
    if(!car||!target||dist(car,target)<13||active?.dash||active?.ferry?.phase==="pier")return null;
    if(lastGuide&&lastGuide.tx===target.x&&lastGuide.tz===target.z&&dist(car,lastGuide)<3)return lastGuide;
    const start=chase.road(car),end=chase.road(target);
    const streets=[start,...chase.route({...start,yaw:car.yaw},end)];
    const road=[];
    for(const point of streets){
      const a=road.at(-2),b=road.at(-1);
      if(b&&dist(b,point)<.1)continue;
      if(a&&((a.x===b.x&&b.x===point.x)||(a.z===b.z&&b.z===point.z)))road.pop();
      road.push(point);
    }
    const points=[{x:car.x,z:car.z},...road,target];let meters=0;
    for(let i=1;i<points.length;i++)meters+=dist(points[i-1],points[i]);
    let turn="";
    if(road.length>=3){
      const [a,b,c]=road;
      const side=(b.z-a.z)*(c.x-b.x)-(b.x-a.x)*(c.z-b.z);
      if(side)turn=(side>0?"↱ Right":"↰ Left")+" on "+BayStreetNames.segment(b,c)+" in "+Math.max(1,Math.round(dist(a,b)))+" m";
    }
    if(BayCut.area(car)&&road.length>1){
      const at=BayCut.nearest(car.x,car.z),next=road.find(p=>BayCut.nearest(p.x,p.z).route.id!==at.route.id&&dist(p,car)>6);
      turn=next?"Follow "+at.route.name+" toward "+BayCut.nearest(next.x,next.z).route.name:"Follow "+at.route.name;
    }
    return lastGuide={x:car.x,z:car.z,tx:target.x,tz:target.z,points,meters,turn};
  }
  function dropJob(){
    if(active?.recovery)recovery.abandon();
    if(active?.cabFare)cabs.leaveFare();
    if(active?.field){cameraSnap();lastHud=lastMap=-10;}
    if(active?.take){wrapTake();return;}
    if(active?.meet)endMeet("drop");
    active?.story?.dispose();
    if(active?.ferry){active.ferry.dispose();ferryScene=ferryReceipt=null;}
    active=null;
  }
  function canChallenge(){
    return meet.phase==="idle"&&!active&&!heat&&car&&!car.meetCar&&!transfer&&!inServiceBay(car)&&dist(car,meet.rival)<14&&Math.abs(car.speed)<7;
  }
  function canRideWithJules(){
    return meet.phase==="idle"&&!active&&!car&&!transfer&&!deckStep&&!skiff&&!heat&&motion.jumpTime<0&&dist(hero,meet.jules)<5.2;
  }
  function canJoinTake(){
    return meet.phase==="idle"&&!active&&!car&&!skiff&&!transfer&&!deckStep&&!heat&&motion.jumpTime<0&&dist(hero,meet.rival)<4.7;
  }
  const romyAtMeet=()=>BayDriving.world(meet.rival,1.50,-.40);
  function atTakePoster(){
    return play&&!car&&!skiff&&!transfer&&!deckStep&&!active&&dist(hero,BayTakePoster.place)<3.2;
  }
  function startTake(longMark=active?.take?.longMark||false){
    const prior=active?.take;
    if(!prior&&(!canJoinTake()||panel!=="take-brief"))return;
    if(prior?.phase==="landed"&&!prior.receipt){prior.afterPrint="retry";return;}
    const r=new BayTake.Run(prior?prior.number+1:1,longMark&&!!save.stunt);
    active={job:BayTake.job,take:r};waypoint=null;dashResult=null;keys.clear();
    r.lookYaw=r.lookPitch=0;r.cut=true;closePanel();
    $("speech").hidden=true;$("toast").hidden=true;lastHud=lastMap=-10;hud();
  }
  function wrapTake(){
    const r=active?.take;if(!r)return;
    if(r.phase==="landed"&&!r.receipt){r.afterPrint="wrap";return;}
    active=null;
    const p=BayTakePoster.place;
    Object.assign(hero,{x:p.x,z:p.z,yaw:Math.PI/2});resetFeet();cameraSnap();
    lastHud=lastMap=-10;
  }
  function swapTake(){
    const r=active?.take;if(!r||!r.swap())return;
    r.cut=true;r.lookYaw=r.lookPitch=0;resetPointer();lastHud=lastMap=-10;hud();
  }
  function stepTake(dt){
    const r=active.take;
    // Stretch the director's first switch cue while keeping both vehicles on the same clock.
    if(r.phase==="rolling"&&r.role==="jules"&&!r.coupe.speed&&Math.abs(r.direction().gap)<3.1)dt*=.4;
    r.step(dt,{gas:held("KeyW","ArrowUp"),brake:held("KeyS","ArrowDown","Space"),
      steer:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"))});
    if(r.phase==="miss"&&r.endTime>=1&&!r.receipt){
      r.receipt={paid:0,record:false};openPanel("take-result");
    }
    if(r.phase==="landed"&&r.endTime>.85&&r.receipt&&!r.reviewed){
      r.reviewed=true;openPanel("take-result");
    }
  }
  function printTake(r,source,sky){
    if(r.phase!=="landed"||r.receipt)return;
    const prior=storedPoster();if(prior&&(!save.stunt||prior.distance>save.stunt.distance))save.stunt=prior;
    const paid=80+Math.round(r.distance*4),record=!save.stunt||r.distance>save.stunt.distance;
    let image=null;
    if(record){
      image=BayMeetPhoto.capture(source,sky,.5,.5,4/3,true);
      if(!image){
        // If WebGL was lost at the cut, print the same airborne pose with the street renderer.
        const negative=document.createElement("canvas");negative.width=640;negative.height=480;
        const state=collectMap("street",0,0,8);setTakeMap(state,r.approach||r.peak,negative.width,negative.height,true);
        const ctx=negative.getContext("2d");if(ctx){drawBayMap(ctx,state);image=BayMeetPhoto.capture(negative,null,.5,.5,4/3,true);}
      }
      if(image){
        save.stunt={distance:r.distance,image,take:r.number};
        try{localStorage.setItem(posterKey,JSON.stringify(save.stunt));}catch{/* The case still displays the session record. */}
      }
    }
    r.receipt={paid,record:record&&!!image,filmLost:record&&!image};save.wallet+=paid;save.paid++;persist();lastHud=-10;
    if(r.afterPrint==="retry")startTake();else if(r.afterPrint==="wrap")wrapTake();
  }
  function boardJules(){
    const v=meet.jules,plan=doorPlan(v,false,hero,1);
    if(!plan){note("Jules","Come round to the passenger door.",2.3);return;}
    active={job:BayNightMeet.job,meet:true};meet.phase="boarding";meet.role="photo";meetReceipt=null;waypoint=null;
    transfer={v,passenger:true,exiting:false,side:1,points:plan.points,next:0,parked:true,p:0,aligned:false,turnTime:0};
    speak("Jules","Mara left her camera in the glove box. Get Romy and the theater sign in one shot.");
  }
  function beginMeet(role){
    meet.start(role,save.meet);meet.lastZ=car?.z??0;
    if(role==="ambient")return;
    active={job:BayNightMeet.job,meet:true};waypoint=null;meetReceipt=null;
    save.meet.lastRoute=meet.route.name;persist();lastHud=lastMap=-10;
    if(role==="driver"){
      BayDriving.settle(car);speak("Romy Vale",meet.route===BayNightMeet.routes[0]?
        "Up past the foundry. First one under the Cine Luna lights buys the other a ticket.":
        "Mercado way this time. See you at the movies.");
    }
    note(meet.route.name,role==="driver"?"Cine Luna in 90 seconds. Hit the marked turns.":"Jules drives. Frame Romy under the Cine Luna marquee.",3.3);
  }
  function endMeet(reason){
    const role=meet.role,wasPhoto=role==="photo",finished=reason==="finish",route=meet.route?.name;
    const won=finished&&role==="driver"&&(meet.rivalTime===null||meet.clock<=meet.rivalTime);
    if(transfer?.passenger){
      if(transfer.p>0&&!transfer.exiting){transfer.exiting=true;transfer.aligned=true;transfer.points=[];transfer.next=0;}
      else{transfer.v.passengerDoor=0;transfer=null;resetFeet();}
    }
    meet.phase=role==="driver"&&finished?"coasting":"finished";meet.shotPending=false;meet.age=0;
    if(meet.jules)BayDriving.settle(meet.jules);if(meet.rival&&meet.phase!=="coasting")BayDriving.settle(meet.rival);
    active=null;lastHud=lastMap=-10;
    if(wasPhoto&&car===meet.jules){
      const plan=doorPlan(car,true,hero,1)||doorPlan(car,true);
      if(plan)transfer={v:car,passenger:true,exiting:true,side:plan.side,points:[],next:0,parked:true,p:1,aligned:true,turnTime:0};
      cameraSnap();
    }
    if(reason==="drop")return;
    const pay=wasPhoto?(meet.photo?100+meet.photo.score:0):won?260:finished?75:0;
    if(!wasPhoto){
      save.meet.winner=won?"you":BayNightMeet.rivalName;
      if(finished)save.meet.best[route]=Math.min(save.meet.best[route]||Infinity,meet.clock);
    }else if(meet.photo)save.meet.cover=meet.photo;
    if(pay){save.wallet+=pay;save.paid++;}
    persist();meetReceipt={role,route,won,pay,finished,time:meet.clock,photo:meet.photo};
    if(pay)sound.cue("paid");
    openPanel("meet-result");
  }
  function meetGreeting(){
    return save.meet.winner==="you"?"Still got that movie ticket you won off me? Give me a rematch.":
      save.meet.winner===BayNightMeet.rivalName?"There’s my second-place finisher. Want another run?":
      save.meet.ambientWinner==="Jules"?"Jules beat me to the lights. Your turn?":save.meet.ambientWinner?"Ask Jules who got to the movies first. Want a run?":"Beep if you’re racing. Come talk to me if you want to drive in a movie.";
  }
  function stepMeet(dt){
    const p=pos(),home=dist(p,meet.shop);
    const present=meet.phase!=="sleep",participating=!!active?.meet;
    const duskTarget=participating||present&&meet.role&&meet.near(p)?1:(!active&&!skiff?clamp((102-home)/46,0,1):0);
    meet.dusk=ease(meet.dusk,duskTarget,1.3,dt);
    if(meet.phase==="sleep"){
      if(!active&&!transfer&&!deckStep&&!skiff&&home<71){
        meet.spawn((kind,color,x,z,yaw)=>{
          const free=[0,3,-3,6,-6].find(dx=>!cars.some(v=>Math.abs(v.x-x-dx)<4.7&&Math.abs(v.z-z)<1.9));
          return addCar(kind,color,x+(free||0),z,yaw);
        });
        julesMotion.reset();
      }else return;
    }
    const remove=v=>{const i=cars.indexOf(v);if(i>=0)cars.splice(i,1);};
    if(!participating&&car!==meet.jules&&!transfer?.passenger&&(
      meet.phase==="idle"&&(home>92||active)||meet.phase==="finished"&&home>67&&!meet.near(p)||
      meet.phase==="finished"&&home<55&&dist(p,meet.rival)>60||
      meet.phase==="coasting"&&!meet.near(p)&&dist(p,meet.finish)>85||
      meet.role==="ambient"&&meet.phase!=="finished"&&!meet.near(p))){
      meet.clear(remove);return;
    }
    meet.age+=dt;
    if(meet.phase==="idle"){
      if(!active&&!heat&&dist(p,meet.rival)<22){
        if(!meet.greeted){meet.greeted=true;speak("Romy Vale",meetGreeting());}
        if(car&&!transfer)meet.passed=true;
      }
      if(!active&&!heat&&car&&!transfer&&meet.passed&&dist(car,meet.rival)>28&&Math.abs(car.speed)>3)beginMeet("ambient");
    }
    if(meet.phase==="finished"&&home>60&&!meet.near(p)&&car!==meet.jules&&!transfer?.passenger){meet.clear(remove);return;}
    if(meet.phase==="countdown"||meet.phase==="running"||meet.phase==="coasting"){
      const gate=meet.gate,event=meet.step(dt,car,cars,fitsCar);
      if(gate!==meet.gate){lastHud=lastMap=-10;sound.cue("job");}
      if(event==="parked"){meet.phase="finished";BayDriving.settle(meet.rival);}
      else if(event==="ambient-finish"){
        meet.phase="finished";meet.age=0;
        save.meet.ambientWinner=meet.lines[1].time!==null&&(meet.rivalTime===null||meet.lines[1].time<meet.rivalTime)?"Jules":BayNightMeet.rivalName;persist();
        BayDriving.settle(meet.jules);BayDriving.settle(meet.rival);
      }else if(event){endMeet(event);return;}
    }
    if(meet.jules){
      const v=meet.jules,ride=meet.role==="photo"||meet.role==="ambient";
      if(ride&&meet.board>0)BayCarAccess.pose(v,-1,meet.board,julesBody,julesMotion,footLevel,dt);
      else{
        const q=BayDriving.world(v,-1.37,-.12);
        Object.assign(julesBody,q,{y:footLevel(q.x,q.z),yaw:v.yaw+1.29});julesMotion.step(dt,0,0);
      }
      if(car===v&&!transfer)BayCarAccess.pose(v,1,1,hero,motion,footLevel,dt,true);
    }
  }
  function shooting(){return active?.meet&&meet.role==="photo"&&car===meet.jules&&!transfer&&meet.phase==="running";}
  function aimMeet(dx,dy){
    if(isTop()){meet.aimX=clamp(meet.aimX+dx/innerWidth,.06,.94);meet.aimY=clamp(meet.aimY+dy/innerHeight,.06,.94);}
    else{meet.lookYaw=clamp(meet.lookYaw+dx*.003*cameraRig.sensitivity,-1.9,1.9);meet.lookPitch=clamp(meet.lookPitch-dy*.0025*cameraRig.sensitivity,-.67,.67);}
  }
  function shutter(){if(shooting()&&(!meet.lastShot||elapsed-meet.lastShot>.23))meet.shotPending=true;}
  function finishMeetFrame(source,sky,project){
    const finder=$("meetFinder");finder.hidden=!shooting()||!!panel;
    if(finder.hidden)return;
    const r=BayMeetPhoto.crop(source.width,source.height,meet.aimX,meet.aimY);
    for(const [key,val] of [["left",r.x],["top",r.y],["width",r.w],["height",r.h]])finder.style[key]=val*100+"%";
    const rival=meet.rival,sign=BayNightMeet.marquee;
    const score=BayMeetPhoto.score({crop:r,rival:project(rival.x,.83,rival.z),marquee:project(sign.x,sign.y,sign.z),distance:dist(rival,sign)});
    finder.classList.toggle("in-frame",score>0);
    if(meet.shotPending){
      meet.shotPending=false;meet.lastShot=elapsed;meet.shots++;
      const image=score&&BayMeetPhoto.capture(source,sky,meet.aimX,meet.aimY);
      if(image&&score>(meet.photo?.score||0))meet.photo={score,image,route:meet.route.name,rival:BayNightMeet.rivalName};
      meet.feedback=image?"Frame "+meet.shots+"  ·  "+score+"/100":score?"Camera couldn’t save this frame":"Need Romy and the Cine Luna sign together";
      finder.classList.remove("release");void finder.offsetWidth;finder.classList.add("release");
    }
    $("filmRoll").textContent=(elapsed-meet.lastShot<2&&meet.feedback)||("M. VEGA   /   "+String(meet.shots+1).padStart(2,"0")+(score?"   •   IN FRAME":""));
  }
  function maraOnBreak(){return BayExposure.routes[save.edition]?.stand||BayExposure.pickup;}
  function advanceExposure(dt){
    const story=active.story,event=story.step(dt,car,transfer,doorPlan,footLevel);
    if(!event){
      if(car!==story.ride||!car||!["port","delivery"].includes(story.phase)||elapsed<speechTill)return;
      if(heat&&!story.warnedHeat){story.warnedHeat=true;speak("Mara Vega","Those lights for us? I’m putting the film in my sock.");}
      else if(car.flatSide&&!story.warnedFlat){story.warnedFlat=true;speak("Mara Vega","Feel that pull? Portside Tire can put a fresh one on.");}
      else if(story.route==="live"&&story.remaining<16&&!story.warnedClock){story.warnedClock=true;speak("Mara Vega","That’s the station van with the dish. The bulletin’s almost on.");}
      return;
    }
    lastHud=lastMap=-10;
    if(event==="complete"){
      const route=BayExposure.routes[story.route];save.wallet+=route.pay;save.paid++;save.edition=story.route;
      persist();dropJob();sound.cue("paid");speak("Mara Vega",save.edition==="live"?"Hear that? Top of the hour. That’s our pier.":"Front row’s on me. Wait till they see what’s on that screen.");
      note("Last Exposure complete","+"+cash(route.pay)+"  ·  Read Bay Wire on your phone (J)",5.4);
    }else speak("Mara Vega",({boarded:"Port Sol. The sale goes to a vote tonight. I want a picture of what they nailed to that fence.",
      docks:"There, by the crane. Red sign on the fence. Pull in and I’ll get the camera.",
      late:"They’ve gone to the weather. Take me to Cine Luna. The projectionist owes me one."})[event]);
  }
  function ferryLanding(){
    return bay.docks.slice(0,2).find(d=>boats.some(v=>v.dock===d))||bay.docks.find(d=>boats.some(v=>v.dock===d))||bay.docks[0];
  }
  function replayFromMotel(){
    if(skiff)returnBoat(skiff,bay.docks[0]);
    if(car)BayDriving.settle(car);
    car=skiff=transfer=deckStep=null;skidLast=null;heat=0;clearPatrol();
    const motel=BayFerry.pickup;
    if(!cars.some(v=>!v.path&&dist(v,motel)<8.5)){
      const ride=ferryReceipt?.run.ride||cars[0];
      for(const [x,z] of [[149,-22.8],[148,-28],[146.6,-23.5],[146.5,-31]]){
        const probe={kind:ride.kind,x,z,yaw:0};
        if(fitsCar(ride,x,z,0)&&!cars.some(v=>v!==ride&&BayDriving.contact(probe,v))){
          Object.assign(ride,{x,z,yaw:0,path:null,passengerDoor:0,doorAngle:0});BayDriving.settle(ride);break;
        }
      }
    }
    Object.assign(hero,{x:151,z:-27,yaw:-.18});resetFeet();cameraSnap();
  }
  function beginFerry(hard,replay=false){
    if(active||transfer||deckStep||watchCrew.towing)return;
    if(replay)replayFromMotel();
    const route=BayFerry.nextRoute(save.ferryLine);
    ferryScene=new BayFerry.Run(route,hard,ferryLanding());active={job:BayFerry.job,ferry:ferryScene};
    save.ferryLine=route.id;persist();
    waypoint=dashResult=regattaResult=ferryReceipt=null;closePanel();sound.cue("job");
    note("Last Ferry Out",route.name+"  ·  "+cash(ferryScene.pay),3.5);
    speak("Inez Cruz","I’ve got the red lunch tin. Pull up to the motel. I can still make the Paloma.");
  }
  function finishFerry(run,reason){
    if(active?.ferry!==run)return;
    const paid=reason==="landed"?run.pay:0;
    if(paid){save.wallet+=paid;save.paid++;persist();sound.cue("paid");}
    run.dispose();run.linger=0;ferryReceipt={run,reason,paid};active=null;
    if(reason==="busted")ferryScene=null;
    lastHud=lastMap=-10;openPanel("ferry-result");
  }
  function advanceFerry(dt){
    const run=ferryScene,ship=run.ship;
    if(skiff&&!deckStep)ship.separate(skiff);
    ship.separate(clubBoat);for(const v of harbor.units)ship.separate(v);
    if(active?.ferry!==run){
      run.linger+=dt;
      if(run.phase==="aboard")run.onDeck(dt);
      else if(run.phase==="missed"&&run.boat)Object.assign(run.rider,BayDriving.world(run.boat,.43,-.44),{y:run.boat.y+.02,yaw:run.boat.yaw});
      if(run.linger>22&&dist(pos(),ship)>110)ferryScene=null;
      return;
    }
    let event;
    if(run.phase==="water")event=run.water(dt,deckStep?null:skiff,backup.air,heat);
    else if(run.phase==="jump")event=run.cross(dt);
    else if(run.phase==="aboard"){
      run.onDeck(dt);run.linger+=dt;if(run.linger>=1.25)finishFerry(run,"landed");return;
    }else{
      if(run.phase==="drive"&&!boats.some(v=>v.dock===run.dock))run.dock=ferryLanding();
      event=run.land(dt,car,transfer,doorPlan,footLevel);
    }
    if(!event)return;
    lastHud=lastMap=-10;
    if(event==="drive")speak("Inez Cruz",run.dock.name+". Drop me by the entrance. The Paloma’s already on the "+ship.route.name+" run.");
    else if(event==="pier")speak("Inez Cruz","I’ll take the gangway. Grab a boat at the end of the pier.");
    else if(event==="cast"){
      if(run.hard&&heat<5)addHeat(5-heat);
      speak("Inez Cruz",run.hard?"Air One’s on our charter. Line me up at the amber gate while the light’s on us.":"There she is. Put me by the amber gate on her left side. I’ll do the jumping.");
    }else if(event==="report"){addHeat(5-heat);note("Paloma bridge","Air One, we have your boat alongside.",3);}
    else if(event==="jump")speak("Inez Cruz","Hold that line. Here I go.");
    else if(event==="landed")speak("Inez Cruz","Made it! And I didn’t spill my coffee.");
    else if(event==="missed")finishFerry(run,"missed");
  }
  function advanceJob(dt){
    if(active?.field||active?.cabFare||active?.recovery||cabs.booking)return;
    if(active?.plate){active.plate.step(dt);return;}
    if(active?.take)return;
    if(active?.meet)return;
    if(ferryScene){const running=!!active?.ferry;advanceFerry(dt);if(running)return;}
    const p=pos();
    if(active?.regatta)return;
    if(active?.story){advanceExposure(dt);return;}
    if(transfer){if(active?.running)active.clock+=dt;return;}
    if(!active){
      if(waypoint&&waypoint.kind!=="dive-site"&&!(waypoint.kind==="surf-tower"&&save.shore.carried)&&dist(p,waypoint)<5){
        if(waypoint.kind!=="garage"||!car?.flatSide)note("City map","Waypoint reached.",1.7);
        waypoint=null;
      }
      return;
    }
    if(active.job.id==="dash"){advanceDash(dt);return;}
    if(skiff||deckStep){if(active.running)active.clock+=dt;return;}
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
    if(!valid(x,z,r)&&!bay.landing(x,z,r)&&!(x>205&&(BaySwimming.wetSand(x,z)||openToSwim(x,z,0)||
      bay.landing(hero.x,hero.z,-.18)&&bay.landing(x,z,-.28))))return false;
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
    if(hero.x>208&&!bay.landing(hero.x,hero.z,-.15)&&BaySwimming.water(hero.x,hero.z)&&
      hero.x>BaySwimming.coast(hero.z)+2.65&&motion.lift<.16)enterSurf(Math.max(0,hero.y+motion.lift));
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
    const v=car,oldX=v.x,oldZ=v.z,oldYaw=v.yaw,surface=v.z>181?BayCut.surface(v.x,v.z)*(1-.13*hours.wet):v.x>166.45?.55:(nearStreet(v.x,v.z)?1:.84)*(1-.13*hours.wet);
    if(active?.story?.holds(v)||active?.ferry?.holds(v)||cabs.holds(v)||recovery.held(v))parking=true;
    if(serviceVehicle===v&&!heat&&!held("KeyW","ArrowUp","KeyS","ArrowDown"))parking=true;
    const steering=parking?0:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    BayDriving.step(v,dt,!parking&&held("KeyW","ArrowUp"),!parking&&held("KeyS","ArrowDown"),steering,!parking&&held("Space"),surface,v.upgrades.engine,parking);
    if(!parking&&v.z>181&&(Math.abs(v.speed)>.45||v.throttle>.10))v.vz-=9.81*BayCut.grade(v.x,v.z)*dt;
    if(Math.abs(v.yaw-oldYaw)>.00001&&!fitsCar(v,v.x,v.z,v.yaw)&&fitsCar(v,v.x,v.z,oldYaw)){v.yaw=oldYaw;v.yawRate*=.3;}
    let impact=0,wallX=0,wallZ=0;
    const x=v.x+v.vx*dt,z=v.z+v.vz*dt;
    if(x!==v.x){if(fitsCar(v,x,v.z,v.yaw))v.x=x;else{impact=Math.abs(v.vx);wallX=v.vx;v.vx*=-.10;}}
    if(z!==v.z){if(fitsCar(v,v.x,z,v.yaw))v.z=z;else{impact=Math.max(impact,Math.abs(v.vz));wallZ=v.vz;v.vz*=-.10;}}
    if(impact>5&&bumpLock<=0){
      dent(v,wallX,wallZ,impact);if(recovery.call&&tow.target)recovery.call.jolts++;
      active?.plate?.jolt(impact);sound.cue("hit");bumpLock=.7;persist();lastHud=-10;
    }
    for(const other of (patrol.length?cars.concat(patrol):cars)){
      if(other===v||v===wrecker&&other===tow.target)continue;
      const hit=BayDriving.contact(v,other);
      if(!hit){if(crashContacts.has(other)&&dist(v,other)>6.3)crashContacts.delete(other);continue;}
      const {nx,nz,depth}=hit,out=Math.min(.45,depth+.012);
      if(fitsCar(v,v.x+nx*out,v.z+nz*out,v.yaw)){v.x+=nx*out;v.z+=nz*out;}
      const inward=Math.max(0,-v.vx*nx-v.vz*nz),pace=other.path||other.serviceCar||other.meetCar||other.kind==="cruiser"?other.speed:0;
      const closing=inward+pace*(nx*Math.sin(other.yaw)+nz*Math.cos(other.yaw));
      if(closing>6&&inward>2&&!parking&&!crashContacts.has(other)&&bumpLock<=0){
        dent(v,-nx,-nz,closing);dent(other,nx,nz,closing);
        if(recovery.call&&tow.target)recovery.call.jolts++;
        persist();lastHud=-10;
      }
      if(!parking)reportCrash(other,inward,closing);
      v.vx+=nx*inward*1.10;v.vz+=nz*inward*1.10;v.yawRate*=Math.exp(-3*dt);other.wait=1.4;
      if(closing>4.8&&bumpLock<=0){active?.plate?.jolt(closing);sound.cue("hit");bumpLock=.7;}
    }
    if(backup.driveThrough(v,dt,oldX,oldZ,oldYaw)){
      const side=v.flatSide<0?"left":"right";
      note(tireStatus(v),"Pulling "+side+". Steer "+(v.flatSide<0?"right":"left")+" to hold your line.",3.3);
      lastHud=-10;
    }
    if(v===wrecker&&!tow.step(dt,towClear,recoveryEvent)){
      Object.assign(v,{x:oldX,z:oldZ,yaw:oldYaw,vx:0,vz:0,speed:0,yawRate:0,brakes:1});
      if(elapsed>(tow.scrapeAt??-10)+3){tow.scrapeAt=elapsed;note("Trailer clearance","The car needs a wider turn. Ease back and straighten the truck.",2.5);}
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
      if(v===personalCar)BayMotelParking.write(v);
    note(garage.name,fixed+" tire replaced.",3);
  }
  function serviceLift(v){
    if(v!==serviceVehicle)return 0;
    const p=serviceTime/repairSeconds,t=clamp(Math.min(p,1-p)*4.5,0,1);
    return .15*t*t*(3-2*t);
  }
  function readyForShop(v){
    return v&&v===car&&!heat&&!transfer&&!v.flatSide&&inServiceBay(v)&&Math.hypot(v.vx,v.vz)<=.8;
  }
  function fixBody(v){
    const charge=BayRecovery.price(v);
    if(panel!=="upgrades"||!readyForShop(v)||!charge||save.wallet<charge)return false;
    v.damage=BayRecovery.condition();v.wantsCurb=v.roadside=false;v.pullOver=null;
    save.wallet-=charge;keepBodywork(v);persist();lastHud=-10;return true;
  }
  function buyRespray(v,finish){
    if(panel!=="respray"||!readyForShop(v)||!finishes.includes(finish)||finish.color===v.color||save.wallet<resprayPrice)return false;
    v.model=carSkin(v.kind,finish.color);
    v.color=finish.color;save.resprays[v.garageKey]=v.color;save.wallet-=resprayPrice;persist();
    closePanel();note(garage.name,formatVehicle(v)+" · "+finish.name+"  −"+cash(resprayPrice),3.4);
    return true;
  }
  function fitPart(v,part){
    if(panel!=="upgrades"||!readyForShop(v)||!parts.includes(part)||v.upgrades[part.id]||save.wallet<part.price)return false;
    v.upgrades[part.id]=true;save.upgrades[v.garageKey]=v.upgrades;
    save.wallet-=part.price;persist();lastHud=-10;
    return true;
  }
  function spaceToSwerve(v,x,z,yaw,ahead,checkPlayer=false){
    const county=z>181?BayCut.nearest(x,z):null;
    const apron=v.recoveryOwner&&x>-92&&x<-69&&z>-39&&z<2;
    if(!apron&&(county?county.d>county.route.halfWidth-.55:Math.min(Math.abs(x-nearestAxis(x)),Math.abs(z-nearestAxis(z)))>5.95)||!fitsCar(v,x,z,yaw))return false;
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
  function shoulder(v,ux,uz,offset,remaining){
    if(remaining<24||v.z>174||Math.abs(ux*uz)>.04)return null;
    const yaw=Math.atan2(ux,uz),run=12,side=2.8-offset;
    for(let i=1;i<=5;i++){
      const f=i/5;
      if(!spaceToSwerve(v,v.x+f*(ux*run+uz*side),v.z+f*(uz*run-ux*side),yaw,f))return null;
    }
    return {x:v.x+ux*run,z:v.z+uz*run};
  }
  function stopAtCurb(v){
    v.pullOver=null;v.path=null;v.reaction=null;v.wantsCurb=false;v.roadside=true;BayDriving.settle(v);
    const s=bayCarLayout(v.kind),stand=BayDriving.world(v,s.track+1.7,s.axles[1]+.38);
    roadDrivers.set(v,{x:v.x,z:v.z,y:footLevel(v.x,v.z),yaw:v.yaw,seat:1,seated:true,side:0,stand,
      motion:new BayPlayerMotion(),path:[],style:1+v.id%(personColors.length-1)});
  }
  function stepRoadDrivers(dt){
    for(const [v,p] of roadDrivers){
      if(p.seated){
        if(!p.side){const plan=doorPlan(v,true,p,-1)||doorPlan(v,true,p,1);if(!plan)continue;p.side=plan.side;}
        p.seat=Math.max(0,p.seat-dt/1.55);BayCarAccess.pose(v,p.side,p.seat,p,p.motion,footLevel,dt);
        if(!p.seat){p.seated=false;p.motion.reset();p.path=recoveryWalkway(p,p.stand,v)||[];}
      }else if(p.path.length)BayCarAccess.walkPath(p,p.motion,p.path,dt,footLevel,1.65);
      else if(!v.roadside||v.onLift||v===car||dist(p,v)>12){
        if(dist(p,pos())>65){roadDrivers.delete(v);continue;}p.motion.step(dt,0,0);
      }else{p.yaw+=angle(p.yaw,Math.atan2(v.x-p.x,v.z-p.z))*Math.min(1,dt*3);p.motion.step(dt,0,0);}
    }
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
      if(v.wantsCurb&&!v.pullOver&&streetTime>=(v.curbCheck||0)){
        v.curbCheck=streetTime+1;v.pullOver=shoulder(v,ux,uz,offset,remaining);
      }
      const stop=v.pullOver,run=stop?(stop.x-v.x)*ux+(stop.z-v.z)*uz:Infinity;
      if(stop&&run<.10){stopAtCurb(v);continue;}
      if(driver&&!stop&&!v.reaction&&streetTime>=(v.reactAfter||0)){
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
      const maximum=stop?Math.min(4.6,Math.max(.36,run*.94)):evading?(response.offset?v.pace*.52:0):v.pace;
      const pace=v.wait>0?0:Math.min(maximum,clearance*1.24);
      v.speed=ease(v.speed,pace,pace<v.speed?(evading?6.2:4.1):1.7,dt);
      let step=Math.min(remaining,clearance,run,v.speed*dt);
      const goal=stop?2.8:evading?response.offset*clamp((remaining-.4)/4,0,1):0;
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
    if(roadDrivers.size)stepRoadDrivers(dt);
    BayLocals.animatePeople(play?walkers:titleWalkers,dt,driver,cars,BayStreetArt.signals,streetTime,
      (x,z,r)=>valid(x,z,r)||z>310&&bay.landing(x,z,r));
    if(p.z>215)for(const w of walkers){
      if(!w.fieldSource||!w.wait||w.alert>0||w.startle||w.fieldSource==="trawler"&&w.x<229)continue;
      const subject=BayCutWildlife.pose(w.fieldSource,streetTime,hours);
      w.yaw+=angle(w.yaw,Math.atan2(subject.x-w.x,subject.z-w.z))*Math.min(1,dt*3.5);
    }
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
    const p=pos(),vx=skiff?.vx??car?.vx??swim?.vx??motion.vx,vz=skiff?.vz??car?.vz??swim?.vz??motion.vz;
    const dock=!car&&(deckStep?.dock||bay.landing(p.x,p.z)),afloat=!!(skiff||swim),waterside=afloat||!!dock;
    const submerged=!!swim&&swim.depth>1.2;
    if(!chase.lastSeen)chase.report(p,vx,vz,afloat);
    const desired=heat>=3?3:2,mobile=patrol.length-(backup.roadblock?.units.length||0);
    if(!waterside&&(!mobile||chase.sighted)&&!chase.searching&&chase.reinforceIn<=0&&mobile<desired)dispatch(mobile);
    harbor.update(heat,dt,streetTime,p,deckStep?null:skiff||(swim?hero:null),dock,civilianFleet,submerged);
    if(p.z>277)for(const unit of harbor.units)if(unit.z>289&&Math.abs(unit.x-284)<19)bay.clearWorkingHull(unit,BayCutWildlife.trawlerHull(streetTime,hours));
    backup.fly(heat,dt,p,submerged);
    chase.observe(patrol,p,vx,vz,heat,dt,harbor.sighted||!!backup.air?.sees,afloat,submerged);
    backup.updateBlock(heat,dt,p,blockSiteClear,patrol,!waterside);
    // Road units cover the last landing while the launches take the water call.
    const k=chase.lastSeen,roadTarget=k.afloat&&harbor.dock?{x:harbor.dock===BayCut.dock?190:144,z:harbor.dock.z,yaw:0,vx:0,vz:0}:k;
    let closest=harbor.closest,visibleGap=afloat&&!deckStep?harbor.inContact:Infinity;
    for(const v of patrol){
      if(v.role==="roadblock")backup.park(v,dt,clearCruiser);
      else chase.move(v,heat,dt,clearCruiser,roadTarget);
      const gap=dist(v,p);closest=Math.min(closest,gap);if(v.sees)visibleGap=Math.min(visibleGap,gap);
    }
    chase.closestUnit=closest;
    boxed=visibleGap<8.4&&Math.hypot(vx,vz)<3.4?boxed+dt:Math.max(0,boxed-dt*1.7);
    if(boxed>5.3){const fine=Math.min(save.wallet,65);save.wallet-=fine;persist();if(transfer){transfer.v.doorAngle=0;transfer=null;}if(car)BayDriving.settle(car);
      if(skiff)returnBoat(skiff,bay.docks[0]);
      const missed=active?.ferry;car=skiff=deckStep=null;skidLast=null;hero.x=151;hero.z=-27;hero.yaw=0;resetFeet();dashResult=null;heat=0;clearPatrol();cameraSnap();note("Back at the Marlin",fine?"Patrol fine  •  "+cash(fine):"Patrol let you off with a warning.",4.5);
      if(missed)finishFerry(missed,"busted");else dropJob();return;}
    if(chase.searching&&chase.unseen-1.05>=chase.searchTime(heat)){
      heat=0;clearPatrol();lastHud=-10;note("Pursuit lost","Bay Patrol called off the search.",3.5);
    }
  }
  function isTop(){return manualTop||!view.gl||view.lost;}
  function shotEye(take){
    const c=take.coupe,t=take.truck,x=(c.x+t.x)/2,z=(c.z+t.z+3.8)/2;
    const focus=[{x:c.x,y:c.y+.65,z:c.z},{x:t.x,y:1.44,z:t.z},{x:t.x,y:1.9,z:t.z+4.7}];
    const flats=take.palms.map(p=>({...p,w:2.35,d:1.6,bottom:0,top:4.1}));
    const obstacles=cameraRig.obstacles.concat(flats);
    let eye,clearest=-1;
    for(const [side,dz,height] of [[1,-2.4,6.1],[1,4.5,7.7],[-1,3.7,7],[-1,-5,6.5]]){
      const candidate={x:x+side*12.8,y:height,z:z+dz,focal:Math.min(1.37,innerWidth/innerHeight*1.48)};
      const clear=Math.min(...focus.map(p=>BayCamera.safeFraction(p,candidate,obstacles)));
      if(clear>clearest){eye=candidate;clearest=clear;}if(clear>.999)break;
    }
    eye.yaw=Math.atan2(x-eye.x,z-eye.z);eye.pitch=Math.atan2((c.y+1.8)*.5-eye.y,Math.hypot(x-eye.x,z-eye.z));return eye;
  }
  function setTakeMap(state,run,w,h,still=false){
    const c=run.coupe,t=run.truck,weight=still?.50:run.role==="jules"?.66:.34;
    state.cx=c.x+(t.x-c.x)*weight;state.cz=c.z+(t.z-c.z)*weight+2.2;
    const spread=Math.hypot(c.x-t.x,c.z-t.z);
    state.scale=Math.min(h/(still?Math.max(20,spread+13):Math.max(33,spread*1.65+12)),w/28);
    state.rotation=still?-.37:run.lookYaw||0;state.player=null;state.target=null;state.take=run;
  }
  function takeCamera(r,dt){
    const v=r.subject(),truck=r.role==="jules",turn=Number(held("KeyC"))-Number(held("KeyQ"));
    r.lookYaw+=(turn+pointer.edgeX*.7)*dt*1.65;
    const yaw=v.yaw+.20+r.lookYaw+(held("KeyV")?Math.PI:0),boom=(truck?12:9)*cameraRig.zoom;
    const pivot={x:v.x,y:v.y+(truck?1.8:1.0),z:v.z};
    const ideal={x:v.x-Math.sin(yaw)*boom,z:v.z-Math.cos(yaw)*boom,y:pivot.y+boom*(.34+r.lookPitch)};
    const f=BayCamera.safeFraction(pivot,ideal,cameraRig.obstacles);
    const diff=r.cut?1:-Math.expm1(-16*dt);r.cut=false;
    cam.x+=(pivot.x+(ideal.x-pivot.x)*f-cam.x)*diff;cam.z+=(pivot.z+(ideal.z-pivot.z)*f-cam.z)*diff;
    cam.y+=(Math.max(.50,pivot.y+(ideal.y-pivot.y)*f)-cam.y)*diff;
    const x=pivot.x+Math.sin(yaw)*3,z=pivot.z+Math.cos(yaw)*3;
    cam.yaw=Math.atan2(x-cam.x,z-cam.z);cam.pitch=Math.atan2(pivot.y+.23-cam.y,Math.hypot(x-cam.x,z-cam.z));cam.focal=1.45;
  }
  function radioToggle(){radio=sound.setEnabled(!radio);try{localStorage.setItem("sundownBay.audio",radio?"on":"off");}catch{}$("audioKey").querySelector("span").textContent=radio?"Sol FM":"Sound off";if(!panel)note("Bay radio",radio?"Sol FM  •  After Hours":"Sound off",1.7);}
  function moveCamera(dt,t){
    if(!play){
      const drift=Math.sin(t*.051);
      cam.x=157.5+drift*1.1;cam.z=-46.5+Math.sin(t*.039)*2;
      cam.y=3.75;cam.yaw=-.63+drift*.07;cam.pitch=-.075;cam.focal=1.48;
      return;
    }
    if(panel)return;
    if(listening()){
      const f=active.field;Object.assign(cam,{x:hero.x,z:hero.z,y:hero.y+1.51,yaw:f.yaw,pitch:f.pitch,focal:1.42});return;
    }
    if(room){
      if(room.kind==="cinema"){Object.assign(cam,BayCineRoom.camera(room,innerWidth/innerHeight));return;}
      cam.x=room.x;cam.z=room.z;cam.y=1.53+Math.sin(room.stride)*room.bob;
      cam.yaw=room.yaw;cam.pitch=room.pitch;cam.focal=1.31;return;
    }
    if(car===wrecker&&!transfer&&held("KeyV")){
      const job=recovery.onBench?.car,close=job&&dist(wrecker,job)<17;
      let eye=BayDriving.world(wrecker,2.55,-1.68),aim=BayDriving.world(wrecker,0,-5.32);
      if(close){
        const mech=recovery.della,s=bayCarLayout(job.kind),side=BayDriving.local(job,mech.x,mech.z).x<0?-1:1;
        eye=BayDriving.world(job,side*(s.track+2.95),s.axles[1]-1.85);
        aim=BayDriving.world(job,side*(s.track+.15),s.axles[1]);
      }
      cam.x=eye.x;cam.z=eye.z;cam.y=footLevel(eye.x,eye.z)+(close?2.06:3.05);
      cam.yaw=Math.atan2(aim.x-eye.x,aim.z-eye.z);cam.pitch=Math.atan2((close?.88:.42)-cam.y,dist(eye,aim));cam.focal=close?1.40:1.10;return;
    }
    if(cabWindow()){
      const b=cabs.booking,s=bayCarLayout(taxi.kind);
      b.pan=clamp(b.pan+((Number(held("KeyC"))-Number(held("KeyQ")))*1.7+pointer.edgeX*1.45)*dt,-1.82,1.65);
      const eye=chassisPoint(taxi,s.seatX,s.seatY+.70,s.seatZ+.105,footLevel(taxi.x,taxi.z)+.008);
      Object.assign(cam,{...eye,yaw:taxi.yaw+b.pan,pitch:b.tilt+taxi.pitch,focal:1.24});return;
    }
    if(active?.take){takeCamera(active.take,dt);return;}
    if(active?.meet&&meet.role==="photo"&&car===meet.jules&&!transfer){
      const v=meet.jules,r=meet.rival,m=BayNightMeet.marquee;
      const across=Number(held("ArrowRight"))-Number(held("ArrowLeft")),up=Number(held("ArrowDown"))-Number(held("ArrowUp"));
      if(across||up)aimMeet(across*dt*360,up*dt*280);
      const eye=BayDriving.world(v,.87,.31);
      cam.x=eye.x;cam.z=eye.z;cam.y=footLevel(v.x,v.z)+1.20;
      const bearing=p=>Math.atan2(p.x-eye.x,p.z-eye.z);
      const tilt=(p,y)=>Math.atan2(y-cam.y,Math.max(.5,dist(eye,p)));
      const blend=.5*clamp((42-dist(r,m))/20,0,1),face=bearing(r),pitch=tilt(r,.83);
      cam.yaw=face+angle(face,bearing(m))*blend+meet.lookYaw;
      cam.pitch=pitch+(tilt(m,m.y)-pitch)*blend+meet.lookPitch;cam.focal=1.13;
      return;
    }
    const keyOrbit=(held("KeyC")?1:0)-(held("KeyQ")?1:0);
    if(keyOrbit)cameraRig.orbit(keyOrbit*dt*525,0,elapsed);
    if(pointer.edgeX)cameraRig.orbit(pointer.edgeX*dt*445,0,elapsed);
    const subject=cameraSubject();
    cameraRig.update(cam,subject,cabs.playerHeld?taxi:deckStep?.v||skiff||transfer?.v||car,dt,elapsed,{rear:held("KeyV"),swim,lift:motion.lift,ground:!skiff&&subject.z>181?footLevel(subject.x,subject.z):0,
      seat:cabs.playerHeld?cabs.booking.seat:transfer||deckStep?(motion.ride?.seat||0):undefined});
  }
  function collectMap(modeName,cx,cz,scale){
    const take=active?.take,driving=(!!car||!!take)&&!transfer;
    const displayCar=paintPreview||car;
    const allTraffic=modeName==="atlas"?patrol:cars.filter(v=>!driving||v!==car||car===meet.jules).concat(patrol);
    const p=transfer||deckStep||cabs.playerHeld?hero:pos();
    const peds=[];
    if(modeName==="street"){
      const people=play?walkers.concat(jobContacts.filter(c=>c.style!==undefined&&c.id!==active?.job.id&&!(meet.rival&&c.id==="getaway"))):walkers;
      for(const w of people)if(!take||!BayTake.onSet(w))peds.push({x:w.x,z:w.z,yaw:w.yaw,shirt:personColors[w.style][1],skin:personColors[w.style][0],startle:w.startle,iceBox:w.fieldSource==="trawler"&&w.index<=6&&w.index>0});
      if(play)for(const w of BayPlates.regulars)if(dinerIsOut(w))peds.push({x:w.x,z:w.z,yaw:w.yaw,shirt:personColors[w.style][1],skin:personColors[w.style][0]});
      if(play)peds.push({...BayCut.station,yaw:-2.3,shirt:"#bea56b",skin:"#91654b"});
      for(const p of roadDrivers.values())if(!p.seated)peds.push({x:p.x,z:p.z,yaw:p.yaw,shirt:personColors[p.style][1],skin:personColors[p.style][0]});
      if(meet.phase==="idle")peds.push({...romyAtMeet(),yaw:meet.rival.yaw-1.2,shirt:personColors[1][1],skin:personColors[1][0]});
      if(meet.jules&&(!(meet.role==="photo"||meet.role==="ambient")||meet.board<.6))
        peds.push({...julesBody,shirt:personColors[2][1],skin:personColors[2][0]});
    }
    return {mode:modeName,cx,cz,scale,solids,player:{x:p.x,z:p.z,yaw:p.yaw,driving,kind:car?.kind,color:displayCar?.color||"#99ebc6",motion,damage:car?.damage,towRig:car?.towRig,
      steer:car?.steer,brakes:car?.brakes,handbrake:car?.handbrake,reversing:car?.reversing,flatSide:car?.flatSide,passengerDoor:car?.passengerDoor,inCabin:(!!transfer||cabs.playerHeld)&&(motion.ride?.seat||0)>.54},skids,story:active?.story,
      cabService:play?cabs:null,cineSecond:!!save.cab.reel,recovery:play?recovery:null,
      marina:{boats,rival:clubBoat,patrol:harbor.units,player:skiff,race:active?.regatta,bayChart:chartMode==="bay"},aboard:!!skiff&&!deckStep,
      swim:swim?.actor(hero),submerged:!!swim?.underwater,patrol:play?watchCrew:null,returned:save.shore.returned,found:save.shore.carried?save.shore.returned.concat(save.shore.carried):save.shore.returned,
      field:active?.field,countyChart:chartMode==="cut",cars:take?allTraffic.filter(v=>!BayTake.onSet(v)):allTraffic,peds,jobPins:modeName==="radar"||modeName==="atlas"&&chartMode!=="bay"?availableJobPins():[],
      tapes:tapes.filter((_,i)=>!save.tapes.includes(i)),target:take||modeName==="street"&&(shooting()||listening())?null:modeName==="street"?streetTarget():currentTarget(),route:modeName==="street"?null:roadGuide(currentTarget()),mara:play?maraOnBreak():null,places:locations,elapsed,time:streetTime,
      meet:meet.rival?meet:null,dusk:cityDusk(),weather:hours,indoors:!!room,plate:active?.plate,lastDiner:recentDiner,
      personal:carPin(),
      photograph:shooting(),take,stuntRecord:save.stunt,
      searchPoint:heat&&chase.searching?chase.lastSeen:null,
      roadblock:skiff?null:backup.roadblock,air:backup.air,ferry:ferryScene,ferryActive:!!active?.ferry,inez:play?ferryScene?.rider||BayFerry.pickup:null,
      dashIndex:active?.job.id==="dash"?active.index:null,dashRun:active?.dash||dashResult?.run,ghost:active?.showGhost?active.ghost:null,
      signals:BayStreetArt.signals,streetActors:modeName==="street"?BayStreetArt.overview(streetTime):[],cameraYaw:isTop()?(take?.lookYaw??cameraRig.yaw+cameraRig.lookBack):cam.yaw};
  }
  function drawMini(){
    if(room)return;
    const c=$("mini"),p=cameraSubject();drawBayMap(c.getContext("2d"),collectMap("radar",p.x,p.z,c.width/(112+52*cameraRig.carBlend)));
  }
  function atlasFrame(){return chartMode==="cut"?{cx:188,cz:254,span:265}:chartMode==="bay"?{cx:309,cz:0,span:463}:{cx:13,cz:0,span:448};}
  function paintAtlas(){
    const c=$("bigmap");if(!c)return;const frame=atlasFrame();
    return drawBayMap(c.getContext("2d"),collectMap("atlas",frame.cx,frame.cz,c.width/frame.span));
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
  function roadBody(v){
    const grade=v.z>181?BayCut.grade(v.x,v.z):0;if(!grade)return v;
    return {...v,pitch:(v.pitch||0)-Math.atan(grade*Math.cos(v.yaw)),lean:(v.lean||0)-Math.atan(grade*Math.sin(v.yaw))};
  }
  function addRig(list,v,ground){
    const rig=vehicleRig(v),s=bayCarLayout(v.kind);
    const phase=v===serviceVehicle?serviceTime/repairSeconds:0;
    const flat=(v.flatLoad||0)*(1-clamp((phase-.55)*4,0,1));
    const bodyGround=ground-flat*.045;
    list.push([rig.shell,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean,0,v]);
    if(rig.windshield&&(!v.serviceCar||!cabWindow()))list.push([rig.windshield,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean,0,v]);
    if(v.serviceCar&&cabWindow())list.push([BayCabArt.dashboard(model,cabs.booking.price),v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean,.28]);
    for(const side of [-1,1]){
      const hinge=chassisPoint(v,side*s.hingeX,0,s.hingeZ,bodyGround);
      const open=Math.max(side===v.doorSide?v.doorAngle:0,side===1?v.passengerDoor||0:0);
      list.push([rig.doors[side],hinge.x,hinge.y,hinge.z,v.yaw-side*open,v.pitch,v.lean,0,v,side]);
      for(const axle of s.axles){
        const damaged=side===v.flatSide&&axle===v.flatAxle;
        const out=damaged&&phase>0 ? .33*Math.sin(Math.PI*clamp((phase-.22)/.54,0,1))**2 : 0;
        const w=BayDriving.world(v,side*(s.track-.085+out),axle);
        const drop=damaged?flat*s.wheel*.25:0;
        const wheel=v.onLift?chassisPoint(v,side*(s.track-.085+out),s.wheel-drop,axle,ground):{...w,y:ground+s.wheel-drop};
        list.push([rig.wheels[side],wheel.x,wheel.y,wheel.z,v.yaw+(axle>0?v.steer:0),v.wheelSpin+(v.onLift?v.pitch:0)]);
      }
    }
    if(v.brakes>.18||v.handbrake>.48)list.push([rig.brakes,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean,0,v]);
    if(v.reversing)list.push([rig.reverse,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean,0,v]);
  }
  function drawFerry(list,see,t){
    if(!play)return;
    const run=ferryScene,f=run?.ship,p=run?.rider||BayFerry.pickup;
    if(f&&see(f,230)){
      if(!models.has("paloma-ferry"))BayFerryArt.install(model);
      list.push(["paloma-ferry",f.x,f.y,f.z,f.yaw,f.pitch,f.lean]);
      if(t%1.4<.94)list.push(["paloma-gate",f.x,f.y,f.z,f.yaw,f.pitch,f.lean]);
      for(const w of f.wake){
        if(!see(w,105))continue;
        const spread=1.7+(t-w.at)*1.65;
        for(const s of [-1,1])view.draw("marina-foam",w.x+s*Math.cos(w.yaw)*spread,.092,w.z-s*Math.sin(w.yaw)*spread,w.yaw-s*.31);
      }
      if(active?.ferry===run&&run.phase==="water"&&dist(pos(),f)<110){
        model("paloma-berth",g=>{
          for(const x of [-1.3,1.3])for(const z of [-3.1,3.1]){
            g.box(x,.012,z-Math.sign(z)*.43,.10,.025,.92,"#f6c36f");
            g.box(x-Math.sign(x)*.28,.012,z,.65,.025,.10,"#f6c36f");
          }
        });
        view.draw("paloma-berth",f.gate.x,.14,f.gate.z,f.yaw);
      }
    }
    if(!see(p,105))return;
    if(!ferryMesh){ferryMesh=new BayPlayerMesh(BayFerryPassengerArt.palette,"ferry-engineer");view.add("inez",ferryMesh,true);}
    const pose=run?.motion||idlePose;
    if(ferryMeshMotion!==pose){ferryMeshMotion=pose;ferryMesh.lastRevision=-1;}
    if(ferryMesh.update(pose))view.updateAnimated("inez");
    if(run?.phase==="drive"){
      const v=run.ride,s=bayCarLayout(v.kind),seat=chassisPoint(v,s.seatX,0,s.seatZ,footLevel(v.x,v.z)+.008+serviceLift(v));
      list.push(["inez",seat.x,seat.y,seat.z,v.yaw,v.pitch,v.lean]);
    }else{
      const v=run?.phase==="water"||run?.phase==="missed"?run.boat:null;
      list.push(["inez",p.x,p.y+pose.lift,p.z,p.yaw,v?.pitch||0,v?.lean||0]);
    }
  }
  function cityDusk(){
    const setLight=active?.meet?meet.dusk:meet.dusk*.25;
    return Math.max(hours.night,setLight);
  }
  function drawCabStreet(list,see,t,dt){
    if(!play)return;
    if(!cabArtReady){BayCabArt.install(model);cabArtReady=true;}
    if(see(taxi,64)){
      const driver=cabs.driver??={id:"mina",motion:new BayPlayerMotion()};
      BayCarAccess.pose(taxi,-1,1,driver,driver.motion,footLevel,dt);
      drawLocal(driver);
    }
    for(const p of cabs.people)if(p.phase!=="booth"&&see(p,74))drawLocal(p);
    BayCabArt.world(view,list,see,t,hours,cabs,!!save.cab.reel);
    function drawLocal(p){
      const key="cab-person/"+p.id;
      if(!p.mesh){
        p.mesh=new BayPlayerMesh(BayCabArt.colors[p.id],BayCabArt.roles[p.id]);
        BayCabArt.dress(p.mesh,p.id);view.add(key,p.mesh,true);
      }
      const animated=p.mesh.update(p.motion),posed=BayCabArt.pose(p,t);
      if(animated||posed)view.updateAnimated(key);
      list.push([key,p.x,p.y+p.motion.lift,p.z,p.yaw,p.ride?.pitch||0,p.ride?.lean||0]);
    }
  }
  let recoveryArtReady=false;
  function drawRoadCrew(list,see,t){
    if(!play)return;
    for(const [v,p] of roadDrivers){
      if(see(v,83)&&v.roadside&&v!==car&&!v.onLift&&t%1.05<.49){
        const s=bayCarLayout(v.kind),key="hazards/"+v.kind;
        model(key,g=>{for(const end of [-1,1])for(const side of [-1,1])g.box(side*(s.track-.145),.59,end*(s.halfLength-.08),.19,.095,.12,"#ffbf57");});
        list.push([key,v.x,footLevel(v.x,v.z)+.008,v.z,v.yaw]);
      }
      if(!see(p,66))continue;
      const key="road-driver/"+v.id;
      if(!p.mesh){p.mesh=new BayPlayerMesh(personColors[p.style]);view.add(key,p.mesh,true);}
      if(p.mesh.update(p.motion))view.updateAnimated(key);
      list.push([key,p.x,p.y+p.motion.lift,p.z,p.yaw]);
    }
    if(!recoveryArtReady){BayRecoveryArt.install(model);BayWreckerArt.install(model);recoveryArtReady=true;}
    for(const p of [recovery.della,...recovery.people]){
      if(!see(p,72))continue;
      const key="recovery-local/"+p.id;
      if(!p.mesh){
        p.mesh=new BayPlayerMesh(BayRecoveryArt.colors[p.id],BayRecoveryArt.roles[p.id]);
        BayRecoveryArt.dress(p.mesh,p.id);view.add(key,p.mesh,true);
      }
      const moved=p.mesh.update(p.motion),working=BayRecoveryArt.pose(p,t);
      if(moved||working)view.updateAnimated(key);
      list.push([key,p.x,p.y+p.motion.lift,p.z,p.yaw,p.ride?.pitch||0,p.ride?.lean||0]);
    }
    BayRecoveryArt.world(list,see,t,hours,recovery);
    if(see(wrecker,135))BayWreckerArt.world(list,wrecker,tow,t,footLevel(wrecker.x,wrecker.z)+.008);
  }
  function marlinArt(){
    if(!roomArtReady){BayMarlinRoom.install(model);BayMotelParking.install(model);roomArtReady=true;}
  }
  function surfArt(){
    if(surfArtReady)return;
    BaySurfArt.install(model);BaySwimmerArt.install(model,view);surfArtReady=true;
  }
  function shorePeople(list,see,t,submerged){
    if(watchCrew.call&&see(watchCrew.call.swimmer,submerged?28:84))BaySwimmerArt.worldLine(list,watchCrew,swim?.actor(hero),t);
    for(const p of watchCrew.actors){
      if(!see(p,submerged?28:84))continue;
      if(p.wet)BaySwimmerArt.world(list,p,t,hours);
      else if(!submerged){
        const frame=p.pace>.12?1+Math.floor((p.phase%(Math.PI*2))*6/(Math.PI*2)):0;
        const key="shore-person/"+p.style+"/"+frame;
        model(key,g=>buildBayPerson(g,...BaySwimmerArt.colors[p.style],frame?(frame-1)*Math.PI/3+.25:0,p===watchCrew.tali?"runner":"local",0));
        list.push([key,p.x,p.y,p.z,p.yaw]);
      }
    }
  }
  function sailHulls(list,see){
    for(const [x,z,size,yaw] of bay.sails){
      if(!see({x,z},48))continue;
      const name="moored-sail-hull/"+size;
      model(name,g=>{
        const ring=[[-.90,-2],[.90,-2],[.79,.75],[.60,1.55],[0,3.15],[-.60,1.55],[-.79,.75]];
        const at=([u,v],beam,height)=>[u*beam*size,height*size,v*size];
        for(let i=0;i<ring.length;i++){
          const a=ring[i],b=ring[(i+1)%ring.length];
          g.quad(at(a,1,.36),at(b,1,.36),at(b,.91,.07),at(a,.91,.07),"#ded1b2");
          g.quad(at(a,.91,.07),at(b,.91,.07),at(b,.20,-.40),at(a,.20,-.40),"#4c706c");
        }
        g.box(0,-.43*size,-.04*size,.15*size,.44*size,1.58*size,"#435c5b");
      });
      list.push([name,x,0,z,yaw]);
    }
  }
  function renderDive(eye,t){
    surfArt();
    if(!reefReady){
      BayReefArt.install(model);
      model("water-ceiling",g=>g.quad([-92,.23,-92],[-92,.23,92],[92,.23,92],[92,.23,-92],"#93cfba"));
      reefReady=true;
    }
    view.begin(eye,cityDusk(),hours,null,t);view.draw("water-ceiling",eye.x,0,eye.z);
    const list=[],see=(p,r)=>Math.abs(p.x-eye.x)<r&&Math.abs(p.z-eye.z)<r;
    const found=save.shore.carried?save.shore.returned.concat(save.shore.carried):save.shore.returned;
    BayReefArt.world(view,list,eye,t,hours,found);BaySurfArt.ladders(list,see);
    for(const v of [...civilianFleet,...harbor.units])if(see(v,29)){
      if(!models.has("marina-needle"))BayMarinaArt.install(model);
      list.push(["marina-"+v.kind,v.x,v.y,v.z,v.yaw,v.pitch,v.lean]);
    }
    const ferry=ferryScene?.ship;
    if(ferry&&see(ferry,36)){
      if(!models.has("paloma-ferry"))BayFerryArt.install(model);
      list.push(["paloma-ferry",ferry.x,ferry.y,ferry.z,ferry.yaw,ferry.pitch,ferry.lean]);
    }
    if(see({x:284,z:318},43)){
      const boat=BayCutWildlife.pose("trawler",t,hours);
      if(!models.has("cut-little-dot"))BayCutWildlife.install(model);
      list.push(["cut-little-dot",boat.x,boat.y-2.16,boat.z,boat.yaw,boat.pitch,boat.roll]);
    }
    sailHulls(list,see);shorePeople(list,see,t,true);BaySwimmerArt.world(list,swim.actor(hero),t,hours);
    for(const a of list)view.draw(...a);
    $("targetTag").hidden=true;
  }
  function paperBag(list,person,t,walking){
    model("rosario-bag",g=>{
      g.box(0,.16,0,.29,.31,.21,"#c6955e");g.box(0,.08,.107,.29,.046,.014,"#945046");
      g.box(0,.327,0,.285,.038,.14,"#dfb37c");
      for(const x of [-.061,.061])g.box(x,.363,0,.018,.087,.029,"#664e3c");
      g.box(0,.40,0,.135,.019,.029,"#664e3c");
    });
    const p=BayDriving.world(person,.34,.08),swing=walking?Math.sin(motion.phase||0)*Math.min(.055,Math.hypot(motion.vx,motion.vz)*.012):0;
    list.push(["rosario-bag",p.x,footLevel(p.x,p.z)+.57+swing,p.z,person.yaw,.025*Math.sin(t*1.25)]);
  }
  function renderWorld(dt,t){
    moveCamera(dt,t);
    const run=active?.take,replay=run?.phase==="landed"&&(run.endTime>=.32||!!run.afterPrint);
    const printing=replay&&!run.receipt,film=replay?(run.approach||run.peak):run;
    const top=isTop(),scene=$("world"),map=$("overhead");scene.hidden=top;map.hidden=!top;
    BayCoastArt.rain($("rain"),play&&!room&&!swim?.underwater?hours:null,t,top,cam.yaw);
    if(room){
      const cinema=room.kind==="cinema",show=cinema?BayCineProgram.frame(t-projectionStart,filmOptions()):null;
      if(cinema)room.projectionist=cabs.people.some(p=>p.phase==="booth");
      if(top){
        const ratio=Math.min(1,1120/innerWidth,740/innerHeight),w=Math.round(innerWidth*ratio),h=Math.round(innerHeight*ratio);
        if(map.width!==w||map.height!==h){map.width=w;map.height=h;}
        if(cinema)BayCineRoom.map(map.getContext("2d"),room,t,hours,show.canvas);
        else BayMarlinRoom.map(map.getContext("2d"),room,hours);
      }else{
        if(cinema){
          if(!cineArtReady){BayCineRoom.install(model);cineArtReady=true;}
          view.begin(cam,0);BayCineRoom.world(view,room,t,hours,show.canvas,show.revision);
        }else{marlinArt();view.begin(cam,0);BayMarlinRoom.draw(view,hours);}
      }
      $("targetTag").hidden=true;return;
    }
    const besideTicket=paintPreview&&innerWidth>=900&&innerHeight>=490;
    if(top){
      const ratio=Math.min(1,1120/innerWidth,740/innerHeight),w=Math.round(innerWidth*ratio),h=Math.round(innerHeight*ratio);
      if(map.width!==w||map.height!==h){map.width=w;map.height=h;}
      const p=play?cameraSubject():{x:65,z:0};
      const photo=shooting(),yaw=photo?meet.jules.yaw:play&&!paintPreview?cameraRig.yaw+cameraRig.lookBack:0;
      const ahead=play&&!paintPreview?(swim?2.8:7+4*cameraRig.carBlend)*(1-cameraRig.elevation):0;
      const span=swim?(swim.underwater?23:34):73+25*cameraRig.carBlend;
      let scale=play?clamp(h/(span*cameraRig.zoom),2,35):h/237;
      if(paintPreview)scale=h/24;
      const offset=besideTicket?w*.14/scale:0;
      const state=collectMap("street",p.x+Math.sin(yaw)*ahead-offset,p.z+Math.cos(yaw)*ahead,scale);
      if(photo){
        const r=meet.rival,m=BayNightMeet.marquee,blend=.48*clamp((45-dist(r,m))/20,0,1);
        state.cx=r.x+(m.x-r.x)*blend;state.cz=r.z+(m.z-r.z)*blend;state.scale=clamp(h/50,4,17);
      }
      state.rotation=yaw;
      if(car===wrecker&&!transfer&&held("KeyV")){
        const v=recovery.onBench?.car,q=v&&dist(wrecker,v)<17?v:tow.jaw();state.cx=q.x;state.cz=q.z;state.scale=h/(q===v?12:17);state.rotation=state.cameraYaw=wrecker.yaw;
      }
      if(listening()){
        const f=active.field,reach=f.source.id==="trawler"?33:13;
        state.cx=hero.x+Math.sin(f.yaw)*reach;state.cz=hero.z+Math.cos(f.yaw)*reach;
        state.rotation=state.cameraYaw=f.yaw;state.scale=h/(f.source.id==="trawler"?81:49);
      }
      if(film)setTakeMap(state,film,w,h,replay);
      drawBayMap(map.getContext("2d"),state);$("targetTag").hidden=true;
      if(printing)printTake(run,map,null);
      finishMeetFrame(map,null,(x,y,z)=>{
        const dx=(x-state.cx)*state.scale,dy=(state.cz-z)*state.scale,c=Math.cos(yaw),n=Math.sin(yaw);
        return {x:.5+(c*dx+n*dy)/w,y:.5+(-n*dx+c*dy)/h};
      });return;
    }
    if(swim?.underwater){renderDive(cam,t);return;}
    let eye=replay?(run.cinemaEye??=shotEye(film)):cam;
    if(paintPreview){
      // Look across the open bay from the entrance, leaving the driver's mouse camera intact.
      const v=paintPreview,side=v.x>=garage.x?-1:1;
      const x=garage.x+side*(garage.halfWidth-.65),z=Math.max(garage.z+garage.halfDepth-.85,v.z+4.7);
      const y=v.kind==="van"?2.7:2.3,aimY=bayCarLayout(v.kind).glass[5]*.56;
      eye={x,y,z,yaw:Math.atan2(v.x-x,v.z-z)-(besideTicket?.23:0),
        pitch:Math.atan2(aimY-y,Math.hypot(v.x-x,v.z-z)),focal:1.73};
    }
    const dusk=cityDusk();
    view.begin(eye,dusk,hours,run?.subject()||car);
    skyPainter.draw(view,eye,t,dusk,hours);
    view.drawWater(t);view.draw("city");
    const see=(o,limit)=>Math.abs(o.x-eye.x)<limit&&Math.abs(o.z-eye.z)<limit;
    if(play&&see(recoveryYard.drop,125)){
      if(!recoveryArtReady){BayRecoveryArt.install(model);BayWreckerArt.install(model);recoveryArtReady=true;}
      BayRecoveryArt.ground(view,see);
    }
    if(see(garage,125)){
      const color=heat?"#ef856e":serviceVehicle?"#ffbf68":"#9ae5b7",name="garage-lamp/"+color;
      model(name,g=>g.box(0,0,0,.87,.25,.05,color));
      view.draw(name,garage.x-3.70,4.28,garage.z+garage.halfDepth+.42);
    }
    for(const k of skids)if(elapsed-k.time<20&&see(k,100))view.draw("skid",k.x,k.z>181?footLevel(k.x,k.z)+.04:.079,k.z,k.yaw);
    const visible=[],owned=transfer?.v||car;
    const atSea=play&&(eye.x>105||swim);
    if(atSea){surfArt();BaySurfArt.world(view,visible,see,t,hours,watchCrew,save.shore.returned);sailHulls(visible,see);}
    if(see({x:150,z:292},184)){
      if(!cutArtReady){BayCutArt.install(model);BayCutWildlife.install(model);cutArtReady=true;}
      BayCutArt.world(view,see,hours,t);BayCutWildlife.world(visible,see,hours,t);
    }
    if(see(BayMarlinRoom.outside,105)){
      marlinArt();BayMarlinRoom.outsideWorld(visible,see,hours);
      const bay=BayMotelParking.bay;view.draw("marlin-parking",bay.x,0,bay.z);
    }
    if(see(BayMercadoArt.counter,110)){
      if(!marketArtReady){BayMercadoArt.install(model);marketArtReady=true;}
      BayMercadoArt.world(visible,see,hours,t,personSkin);
    }
    if(play){
      for(const person of BayPlates.regulars){
        if(!dinerIsOut(person)||!see(person,75))continue;
        const fed=recentDiner?.customer===person&&elapsed<recentDiner.until;
        visible.push([personSkin(person.style,person.role,0,fed?2:active?.plate?.customer===person?1:0),person.x,.15,person.z,person.yaw]);
        if(fed)paperBag(visible,person,t,false);
      }
      if(active?.plate&&onStreetFeet())paperBag(visible,hero,t,true);
    }
    if((film||meet.phase==="idle")&&!takeArtReady){BayTakeArt.install(model);takeArtReady=true;}
    if(film)BayTakeArt.world(visible,film,see,footLevel,t);
    if(meet.phase==="idle"){
      const romy=romyAtMeet();BayTakeArt.inviteWorld(visible,meet.rival,see);
      if(see(romy,74))visible.push([personSkin(1,"courier",0,1),romy.x,footLevel(romy.x,romy.z),romy.z,meet.rival.yaw-1.2]);
    }
    if(meet.rival){
      if(!models.has("meet-shop"))BayMeetArt.install(model);
      BayMeetArt.drawWorld(visible,meet,t,see,footLevel);
      if(see(julesBody,78)&&!shooting()){
        if(!julesMesh){julesMesh=new BayPlayerMesh(personColors[2]);view.add("meet-jules-person",julesMesh,true);}
        if(julesMesh.update(julesMotion))view.updateAnimated("meet-jules-person");
        const leaning=meet.phase==="idle"||meet.role==="driver";
        visible.push(["meet-jules-person",julesBody.x,julesBody.y+julesMotion.lift,julesBody.z,julesBody.yaw,leaning?.09:0,leaning?-.045:0]);
      }
    }
    BayMarinaView.drawWorld(view,model,visible,boats,clubBoat,harbor.units,active?.regatta,see,t);
    drawFerry(visible,see,t);
    const hideActor=cabWindow()||listening()||cameraRig.hideActor&&!paintPreview;
    const story=active?.story;
    for(const prop of BayExposure.props)if(see(prop,120)){
      if(!models.has("exposure-van"))BayExposureArt.install(model);
      visible.push(["exposure-"+prop.kind,prop.x,footLevel(prop.x,prop.z),prop.z,prop.yaw]);
    }
    const mara=story?.mara||maraOnBreak(),partnerMotion=story?.motion||idlePose;
    if(play&&see(mara,95)&&!(hideActor&&car&&story?.ride===car&&story.progress===1)){
      if(!maraMesh){maraMesh=new BayPlayerMesh(BayExposureArt.palette,"photographer");view.add("mara",maraMesh,true);}
      if(lastMaraMotion!==partnerMotion){maraMesh.lastRevision=-1;lastMaraMotion=partnerMotion;}
      if(maraMesh.update(partnerMotion))view.updateAnimated("mara");
      if(story?.progress===1){
        const v=story.ride,s=bayCarLayout(v.kind),p=chassisPoint(v,s.seatX,0,s.seatZ,footLevel(v.x,v.z)+.008+serviceLift(v));
        visible.push(["mara",p.x,p.y,p.z,v.yaw,v.pitch,v.lean]);
      }else visible.push(["mara",mara.x,(mara.y??footLevel(mara.x,mara.z))+partnerMotion.lift,mara.z,mara.yaw??-1.9]);
    }
    for(const v of cars)if(see(v,160)&&!(film&&BayTake.onSet(v))&&!(v===car&&!transfer&&hideActor)){
      const ground=footLevel(v.x,v.z)+.008+serviceLift(v)+(v.towLift||0),body=roadBody(v);
      if(v===owned||v===story?.ride||v===active?.ferry?.ride||v===active?.cabFare?.ride||v===taxi||v===wrecker||v.onLift||v.doorAngle>.01)addRig(visible,v===owned&&paintPreview?paintPreview:body,ground);
      else{
        visible.push([v.model,v.x,ground,v.z,v.yaw,body.pitch,body.lean,0,v]);
        if((v.path&&!v.recoveryOwner||v===meet.rival&&meet.phase!=="idle")&&see(v,52)){
          const s=bayCarLayout(v.kind),p=chassisPoint(body,-s.seatX,s.seatY,s.seatZ,ground);
          visible.push(["traffic-driver",p.x,p.y,p.z,v.yaw,body.pitch,body.lean]);
          if(v.brakes>.35){
            const key="traffic-brakes/"+v.kind;model(key,g=>buildBayBrakeLights(g,v.kind));
            visible.push([key,v.x,ground,v.z,v.yaw,body.pitch,body.lean,0,v]);
          }
        }
      }
      if(v.damage&&see(v,76))BayBodyworkArt.world(visible,model,body,ground,t);
    }
    if(play)for(const contact of jobContacts){
      if(contact.style===undefined||active?.job.id===contact.id||meet.rival&&contact.id==="getaway"||!see(contact,72))continue;
      visible.push([personSkin(contact.style,contact.role,0,1),contact.x,footLevel(contact.x,contact.z),contact.z,contact.yaw]);
    }
    for(const p of walkers){
      if(!see(p,91)||film&&BayTake.onSet(p))continue;
      const feet=p.fieldSource?footLevel(p.x,p.z)+.055:.15;
      if(p.startle){
        if(!p.recoilMesh){
          p.recoilMesh=new BayPlayerMesh(personColors[p.style],p.role);p.recoilKey="recoil/"+walkers.indexOf(p);
          view.add(p.recoilKey,p.recoilMesh,true);
        }
        p.recoilMesh.startle(p.startle);view.updateAnimated(p.recoilKey);
        visible.push([p.recoilKey,p.x,feet+p.startle.lift,p.z,p.yaw]);
      }else visible.push([personSkin(p.style,p.role,poseFor(p),p.gesture||0),p.x,feet,p.z,p.yaw]);
      if(p.fieldSource==="trawler"&&p.index>0&&p.index<=6&&see(p,49)){
        model("fish-camp-icebox",g=>{
          g.box(0,0,0,.46,.31,.32,"#5d8d8d");g.box(0,.168,0,.48,.05,.34,"#e7dbba");
          g.pole([-.19,.19,0],[-.16,.32,0],.012,"#6d7166",4);g.pole([.19,.19,0],[.16,.32,0],.012,"#6d7166",4);
          g.box(0,.32,0,.34,.029,.034,"#947f62");
        });
        const hand=BayDriving.world(p,.35,.06);visible.push(["fish-camp-icebox",hand.x,feet+.59+.02*Math.sin(p.phase),hand.z,p.yaw]);
      }
    }
    drawCabStreet(visible,see,t,dt);
    drawRoadCrew(visible,see,t);
    if(active&&!story&&!active.cabFare&&!active.recovery&&!active.regatta&&active.job.id!=="race"&&active.job.id!=="dash"&&(active.index===0||active.job.id==="tape")){
      const m=currentTarget();if(see(m,98)){const style=active.job.id==="tape"?(active.index?3:4):2;visible.push([personSkin(style,active.job.id==="tape"?"courier":"local",0,1),m.x+1.1,.15,m.z,-1.6]);}
    }
    for(const v of patrol)if(see(v,150)){
      const ground=footLevel(v.x,v.z)+.01;
      v.visual??=carSkin("cruiser","#293e52");
      visible.push([v.visual,v.x,ground,v.z,v.yaw,0,v.lean,0,v]);
      if(v.damage&&see(v,76))BayBodyworkArt.world(visible,model,v,ground,t);
      if(v.brakes>.42){
        model("patrol-brakes",g=>buildBayBrakeLights(g,"cruiser"));
        visible.push(["patrol-brakes",v.x,ground,v.z,v.yaw,0,v.lean,0,v]);
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
    if(!swim&&!hideActor&&playerMesh&&!shooting()&&!film){
      if(playerMesh.update(motion))view.updateAnimated("player");
      if(skiff&&!deckStep){
        const p=seatPoint(skiff);visible.push(["player",p.x,p.y,p.z,skiff.yaw,skiff.pitch,skiff.lean]);
      }else if(car&&!transfer){
        const s=bayCarLayout(car.kind),body=roadBody(car),p=chassisPoint(body,(car===meet.jules?1:-1)*s.seatX,0,s.seatZ,footLevel(car.x,car.z)+.008+serviceLift(car));
        visible.push(["player",p.x,p.y,p.z,car.yaw,body.pitch,body.lean]);
      }else visible.push(["player",hero.x,hero.y+motion.lift,hero.z,hero.yaw]);
    }
    if(view.beginShadow()){
      for(const a of visible)if(Math.abs(a[1]-eye.x)<65&&Math.abs(a[3]-eye.z)<65)view.draw(...a);
      BayStreetArt.draw(view,streetTime,cam,true);
      view.endShadow();
    }else{
      for(const v of cars)if(see(v,83)&&!(film&&BayTake.onSet(v)))view.draw("shadowCar",v.x,v.z>181?footLevel(v.x,v.z)+.05:.145,v.z,v.yaw);
      for(const v of patrol)if(see(v,83))view.draw("shadowCar",v.x,v.z>181?footLevel(v.x,v.z)+.05:.145,v.z,v.yaw);
      if(!car&&!skiff&&!swim&&!film)view.draw("shadowFoot",hero.x,hero.y+.025,hero.z,hero.yaw);
    }
    if(atSea){shorePeople(visible,see,t,false);if(swim)BaySwimmerArt.world(visible,swim.actor(hero),t,hours);}
    if(active?.field&&!listening()&&!swim&&!car&&!skiff&&!transfer&&!deckStep&&cutArtReady)
      BayCutWildlife.carryRecorder(visible,hero,hero.y+motion.lift,t);
    drawCourse(see);
    for(const a of visible)view.draw(...a);
    if(marketArtReady)BayMercadoArt.light(view,see,hours);
    if(play)BayTakePoster.world(view,model,save.stunt,see);
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
    const tar=shooting()||listening()||film?null:streetTarget();
    if(tar){if(active?.meet&&meet.role==="driver"&&Number.isFinite(tar.yaw)){
        model("meet-turn",g=>{
          for(const z of [-2.6,-.8]){
            for(const side of [-1,1])g.quad([0,.095,z+.85],[side*1.03,.095,z+.08],[side*1.03,.095,z-.37],[0,.095,z+.37],"#ffdb95",1);
          }
        });
        view.draw("meet-turn",tar.x,0,tar.z,tar.yaw,0,0,.50);
        view.draw("destRing",tar.x,0,tar.z);
      }else if(active?.job.id!=="dash"&&!active?.regatta&&tar.kind!=="ferry-gate"){
        const ground=tar.z>181?footLevel(tar.x,tar.z):0;view.draw("destRing",tar.x,ground,tar.z);view.draw("beacon",tar.x,ground+2.6+Math.sin(t*3)*.17,tar.z,eye.yaw);
      }
      const mark=view.project(tar.x,3.6+(tar.z>181?footLevel(tar.x,tar.z):0),tar.z),label=$("targetTag");
      if(play&&!panel&&mark&&mark.x>48&&mark.x<innerWidth-48&&mark.y>55&&mark.y<innerHeight-75&&dist(pos(),tar)>9){
        label.hidden=false;label.style.left=mark.x+"px";label.style.top=mark.y+"px";label.textContent=(tar.kind==="ferry-gate"?"PALOMA · ":"")+Math.round(dist(pos(),tar))+" m";
      }else label.hidden=true;
    }else $("targetTag").hidden=true;
    if(a&&a.light>.01&&see(a,190)){
      if(!airBeam){airBeam=new BayPatrolArt.Searchlight();view.add("air-beam",airBeam,true);}
      airBeam.update(a,backup.lamp(a));view.updateAnimated("air-beam");view.drawSearchlight("air-beam");
    }
    if(listening())BayCutWildlife.micView(view,eye,t,!!active.field.slice);
    finishMeetFrame(scene,$("sky"),(x,y,z)=>{const q=view.project(x,y,z);return q&&{x:q.x/innerWidth,y:q.y/innerHeight};});
    if(printing)printTake(run,scene,$("sky"));
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
  function regattaHud(r){
    $("regattaHud").hidden=!r;
    const signal=$("raceStart");signal.hidden=!r||(!r.count&&r.time>1.1);
    if(!r)return;
    if(!signal.hidden)signal.textContent=r.count?String(Math.ceil(r.count)):"GO";
    const gate=r.target(),back=(skiff.x-gate.x)*gate.nx+(skiff.z-gate.z)*gate.nz>2;
    $("raceCourse").textContent=r.course.name;$("racePlace").textContent=r.count?"GRID":r.leading()?"1st / 2":"2nd / 2";
    $("raceTime").textContent=watch(r.time);$("raceGate").textContent="Gate "+(r.index+1)+" / "+r.course.gates.length;
    $("raceGuide").textContent=(r.time-r.lastBrush<1?"Buoy clipped":back?"Circle back":r.index===r.course.gates.length-1?"Finish line":"Next gate")+" · "+Math.round(dist(skiff,gate))+" m";
    $("raceArrow").style.transform="rotate("+angle(isTop()?cameraRig.yaw+cameraRig.lookBack:cam.yaw,Math.atan2(gate.x-skiff.x,gate.z-skiff.z))+"rad)";
  }
  function takeHud(r){
    const box=$("takeHud");box.hidden=!r;if(!r)return;
    const jules=r.role==="jules",dir=r.direction();
    $("takeNumber").textContent=(r.longMark?"LONG MARK   /   ":"")+"TAKE "+String(r.number).padStart(2,"0");
    $("takeName").textContent=jules?"Jules · Flatbed":"Romy · No. 27";
    let line="",cue="",ready=false;
    if(r.phase==="landed"){line="Four wheels down";cue=r.distance.toFixed(1)+" m";}
    else if(r.phase==="miss"){line="Cut!";cue=r.reason;}
    else if(r.phase==="air"){line="Airborne";cue=jules?"A / D to bring the bed under Romy":"A / D trim   ·   G to adjust the truck";}
    else if(r.phase==="marks"&&jules){line="Roll the flatbed";cue="Hold W. Keep it held through the green G cue.";}
    else if(jules&&r.coupe.speed>0){line="Bring the bed under Romy";cue="W / S pace   ·   A / D lane   ·   G switch";}
    else if(jules){
      if(Math.abs(dir.lane)>1.05){line=dir.lane>0?"Move the truck left":"Move the truck right";cue="Line the bed up with the center of the ramp.";}
      else if(Math.abs(dir.gap)<=2){line="G  ·  Switch now";cue="Keep W held for Romy";ready=true;}
      else if(dir.gap>2){line=dir.gap<6?"Get ready to switch":"Bring the truck up to its mark";cue="Hold W   ·   Watch for the green G cue";}
      else{line="Truck ahead of its mark";cue="Hold S to reduce pace   ·   G to take over Romy";}
    }else{
      line=r.onRamp?"Stay straight over the lip":"Aim for the ramp";
      cue=r.onRamp?"G puts you back in the flatbed":dir.gap>3?"Bed behind   ·   Ease off W or tap S":dir.gap< -3?"Bed ahead   ·   Hold W to close the gap":"Line looks good   ·   Hold W";
      ready=!r.onRamp&&Math.abs(dir.gap)<=3&&Math.abs(dir.lane)<1.05;
    }
    box.setAttribute("data-ready",String(ready));
    $("takeAction").textContent=line;$("takeCue").textContent=cue;
  }
  function hud(){
    const b=cabs.booking,fare=active?.cabFare,p=pos(),tar=currentTarget();
    const area=room?.kind==="cinema"?"Cine Luna":room?"Marlin Motel · 14":district(p);
    $("district").textContent=area;$("money").textContent=cash(save.wallet);
    $("cityTime").textContent=BayHours.time(hours.minute);$("miniButton").hidden=!!room;
    const roadCar=b?.stage==="ride"?taxi:car,road=roadCar&&!active?.take?BayStreetNames.through(roadCar,roadCar.yaw):"";
    $("streetName").hidden=!road||road===area;$("streetName").textContent=road;
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
    const marineNear=harbor.units.length&&(skiff||swim||deckStep||bay.landing(p.x,p.z));
    $("blockCall").hidden=!marineNear&&!blockNear;
    $("blockCall").className=marineNear?"dispatch-call marine":"dispatch-call";
    if(marineNear){
      $("blockCall").textContent="Harbor Patrol · "+(harbor.units.length===1?"1 launch":harbor.units.length+" launches");
    }else if(blockNear){
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
    $("mode").textContent=deckStep?(deckStep.entering?"Boarding":"Tying up"):skiff?bay.hulls[skiff.kind].name:transfer?(transfer.exiting?"Stepping out":transfer.passenger?"Riding with Jules":"Taking the wheel"):car===meet.jules&&car?"Passenger seat":car?formatVehicle(car):"On foot";
    const call=watchCrew.call,diving=!!swim?.underwater,swimmer=call?.slip.name.split(" ")[0];
    if(swim)$("mode").textContent=swim.exit?(swim.exit.type==="launch"?"Over the side":"Climbing aboard"):diving?"Free diving":watchCrew.towing?"On the float":"Swimming";
    if(cabs.playerHeld)$("mode").textContent=b.stage==="ride"?"Cab 17 · Passenger":b.stage==="out"?"Stepping out":"Boarding Cab 17";
    $("diveGauge").hidden=!swim||!!swim.exit||(!diving&&swim.air>.992);
    if(!$("diveGauge").hidden){
      const airLeft=Math.round(swim.air*100);
      $("swimDepth").textContent=swim.depth>.25?swim.depth.toFixed(1)+" m":"Surface";
      $("swimAir").style.width=airLeft+"%";$("swimAir").parentElement?.setAttribute("aria-valuenow",String(airLeft));
      $("airLabel").textContent=swim.forced?"Coming up for air":"Air "+airLeft+"%";$("diveGauge").className=airLeft<28?"low":"";
    }
    const hearCall=call&&!room&&!heat&&!active&&!watchCrew.towing&&!diving&&p.x>145&&dist(p,call.swimmer)<90;
    $("watchCall").hidden=!hearCall;
    if(hearCall)$("watchMessage").textContent=call.phase==="guard"?"Tali is bringing "+swimmer+" ashore":swimmer+" is waving by the "+call.slip.flag.toLowerCase()+" · "+Math.round(dist(p,call.swimmer))+" m";
    const damaged=car&&BayRecovery.worst(car);
    $("tireCall").hidden=(!car?.flatSide&&(!damaged||car.damage[damaged]<.17))||!!transfer;
    if(!$("tireCall").hidden)$("tireCall").textContent=car.flatSide?tireStatus(car):BayRecovery.faultText(car);
    $("speed").innerHTML=skiff&&!deckStep?'<em class="gear">'+(skiff.speed<-.6?"ASTERN":skiff.trim>.35?"TRIM UP":"AHEAD")+'</em>'+Math.round(Math.abs(skiff.speed)*1.944)+"<small>KN</small>":
      car&&!transfer?'<em class="gear">'+(car.reversing?"R":"D"+car.gear)+'</em>'+Math.round(Math.abs(car.speed)*2.237)+"<small>MPH</small>":"";
    const ferry=active?.ferry,meter=$("ferryMeter");
    meter.hidden=!ferry||ferry.phase!=="water"||skiff!==ferry.boat||dist(p,ferry.ship.gate)>30;
    if(!meter.hidden){
      const progress=Math.round(100*ferry.hold/BayFerry.holdTime);
      meter.style.setProperty("--hold",progress+"%");meter.setAttribute("aria-valuenow",String(progress));
    }
    const stunt=active?.take;
    dashHud();regattaHud(active?.regatta);takeHud(stunt);$("objective").hidden=!tar||!!active?.dash||!!active?.regatta||!!stunt;
    if(stunt){
      $("mode").textContent="One Good Take";
      $("speed").innerHTML=Math.round(stunt.subject().speed*2.237)+"<small>MPH</small>";
    }
    if(tar&&!active?.dash&&!active?.regatta&&!stunt){
      const story=active?.story,deadline=story?.route==="live"&&story.phase==="delivery";
      $("objectiveTag").textContent=active?active.job.name+(ferry?.phase==="water"?"  /  Last call "+watch(Math.ceil(ferry.remaining)).split(".")[0]:deadline?"  /  On air in "+Math.ceil(story.remaining)+" s":active.job.id==="race"&&active.running?"  /  "+watch(active.clock):""):"Map pin";
      let verb="Reach ";if(active&&active.job.id!=="race")verb=active.index===0?"Pick up at ":"Drop off at ";
      if(active?.job.id==="tape")verb=active.index===0?"Meet Nia at ":"Meet the DJ at ";
      const destination=ferry?ferry.objective(car,skiff):story?story.objective(car):active?.job.id==="dash"?"Meet the lifeguards at the chalk line":verb+tar.name;
      const guide=roadGuide(tar);
      const meters=Math.round(guide?.meters??dist(p,tar));
      $("objectiveText").textContent=destination+(ferry&&meters<10?"":"  ·  "+meters+" m");
      $("roadTurn").textContent=guide?.turn||(ferry?.phase==="water"?(meters>30?ferry.ship.route.name+"  ·  Port side":"Paloma "+Math.round(ferry.ship.speed*1.944)+" kn  ·  You "+Math.round(Math.abs(skiff?.speed||0)*1.944)+" kn"):"");
      if(active?.recovery&&recovery.call){
        $("objectiveTag").textContent="Portside Recovery  /  "+recovery.call.p.name;
        $("objectiveText").textContent=recovery.jobText(car)+(meters>15?"  ·  "+meters+" m":"");
        $("roadTurn").textContent=guide?.turn||((tow.target||recovery.onBench)?"Handoff lane beside the shop":recovery.call.p.slip.place);
      }else if(tar===freeTowTarget){
        $("objectiveTag").textContent="Portside Tire";
        $("objectiveText").textContent=BayRecovery.dropReady(tow.target)?"Set the car down in the striped lane":"Tow the "+formatVehicle(tow.target)+" to Della  ·  "+meters+" m";
      }else if(b){
        $("objectiveTag").textContent="Bay Cab  /  Unit 17";
        $("objectiveText").textContent=b.stage==="waiting"?"Wait by the curb at "+b.from.name:b.stage==="ready"?"Mina is here · Board the yellow cab":b.stage==="out"?"Step out at "+cabs.location.name:b.stage==="ride"?(b.early?"Mina is pulling over":"Riding to "+b.to.name)+"  ·  "+meters+" m":"Take the passenger seat";
        $("roadTurn").textContent=b.stage==="waiting"?(cabs.trip?"Mina is finishing a fare":"Mina is on the way"):(b.price?cash(b.price)+" fare":"First ride on the house");
      }else if(fare){
        $("objectiveTag").textContent=fare.name+"  /  "+(fare.to.id===fare.job?"Going to work":"Heading back");
        $("objectiveText").textContent=fare.phase==="out"?"Leave room at the passenger door":fare.phase==="walk"?fare.name.split(" ")[0]+" is walking in":fare.phase!=="ride"?"Wait for "+fare.name.split(" ")[0]+" to board":fare.ride!==car?"Return to the car you picked them up in":"Stop at "+fare.to.name+"  ·  "+meters+" m";
        if(fare.phase!=="ride")$("roadTurn").textContent="";
      }else if(watchCrew.towing){
        $("objectiveTag").textContent="Sol Beach patrol";$("objectiveText").textContent="Bring "+swimmer+" back to the shallows · "+meters+" m";
        $("roadTurn").textContent="Swim toward the sand with the float";
      }else if(tar.kind==="dive-site"){
        $("objectiveTag").textContent=siteById(tar.id).name;
        $("objectiveText").textContent=tar.name+" · "+meters+" m";
        $("roadTurn").textContent="Look on the bottom, about "+Math.round(-BaySwimming.floor(tar.x,tar.z))+" m down";
      }else if(tar.kind==="surf-tower"&&save.shore.carried){
        $("objectiveTag").textContent="Sol Beach lost and found";$("objectiveText").textContent="Return the "+siteById(save.shore.carried).name.toLowerCase();
      }
    }
    if(active?.plate){
      const order=active.plate,c=order.customer,guide=roadGuide(c);
      $("objectiveTag").textContent="Rosario’s counter  /  "+order.condition();
      $("objectiveText").textContent=c.name+" · "+c.place+"  ·  "+Math.round(guide?.meters??dist(p,c))+" m";
      $("roadTurn").textContent=guide?.turn||c.dish;
    }
    const field=active?.field,monitor=listening();
    $("fieldHud").hidden=$("micSight").hidden=!monitor;
    if(monitor){
      const m=field.signal,rolling=field.slice;
      $("fieldName").textContent=field.source.name;
      $("fieldRoll").textContent=rolling?"● REC":"STBY";$("fieldRoll").className=rolling?"rolling":"";
      $("fieldNeedle").style.width=Math.round(100*(m?.level||0))+"%";
      $("fieldLength").style.width=Math.round(100*(rolling?.levels.length||0)/BayCutTape.frames)+"%";
      $("fieldAim").textContent=!m?"Find the signal":Math.abs(m.yaw)>.19?(m.yaw<0?"← Turn left":"Turn right →"):
        Math.abs(m.pitch)>.15?(m.pitch>0?"↑ Tilt up":"↓ Tilt down"):rolling?"Rolling · hold steady":"On signal · hold Space";
    }
    $("fieldRadio").hidden=!onAir||monitor;
    if(onAir&&!monitor){
      $("fieldCredit").textContent=BayMarshLine.title(onAir.tape.id)+"  /  Your recording";
      BayMarshLine.waveform($("airWave"),onAir.tape.levels,clamp((elapsed-onAir.at)/2.6,0,1));
    }
    if(field){
      $("objective").hidden=monitor;
      if(!monitor){
        $("objectiveTag").textContent="The Marsh Line  /  Sol FM";
        $("objectiveText").textContent=(field.phase==="return"?"Bring the take to Kit Bell":"Record "+field.source.name+" at "+field.source.site.name)+"  ·  "+Math.round(roadGuide(tar)?.meters??dist(p,tar))+" m";
      }
    }
    if(active?.meet){
      const driver=meet.role==="driver",signal=$("raceStart"),seconds=Math.max(0,Math.ceil(BayNightMeet.limit-meet.clock));
      signal.hidden=meet.phase!=="countdown"&&!(driver&&meet.clock<.85&&meet.phase==="running");
      if(!signal.hidden)signal.textContent=meet.phase==="countdown"?String(Math.max(1,Math.ceil(meet.count))):"GO";
      $("objectiveTag").textContent=meet.phase==="boarding"?"Portside After Dark":meet.route.name+(driver?"   /   "+seconds+" s":"   /   Mara’s camera");
      $("objectiveText").textContent=driver?tar.name+"  ·  "+Math.round(dist(p,tar))+" m":"Photograph Romy under the Cine Luna sign";
      const best=driver&&save.meet.best[meet.route.name];
      $("roadTurn").textContent=driver?(meet.rivalTime!==null?"Romy crossed in "+raceWatch(meet.rivalTime):
        (meet.leading(car)?"1st / 2":"2nd / 2")+"   ·   Gate "+(meet.gate+1)+"/"+meet.route.gates.length+(best?"   ·   Best "+watch(best):"")):
        meet.photo?"Best frame   "+meet.photo.score+"/100":meet.phase==="boarding"?"Board Jules’s coupe":"Aim with the mouse or arrows   ·   X to recenter";
    }
    const nearby=car?null:enterable(),speaker=car?null:BayLocals.closestSpeaker(walkers,hero),contact=nearbyJobContact(speaker);
    const atShop=car&&Math.abs(car.x-garage.x)<10
      &&car.z>=garage.z-garage.halfDepth&&car.z<garage.z+garage.halfDepth+15;
    const hint=$("context");hint.className=serviceVehicle?"servicing":"";
    if(serviceVehicle)hint.style.setProperty("--repair-fill",String(clamp(serviceTime/repairSeconds,0,1)));
    const diner=dinerNearby();
    const waiting=!active&&!heat&&car?cabs.nearbyFare(car):null;
    const motorist=!active&&!heat&&onStreetFeet()?recovery.offer(hero):null;
    const pastCaller=!active&&!heat&&onStreetFeet()?recovery.people.find(p=>p.phase==="home"&&dist(p,hero)<2.7):null;
    if(room?.kind==="cinema"){
      const use=roomAction();$("objective").hidden=true;$("mode").textContent=room.seated?"In your seat":"Auditorium";$("speed").textContent="";
      contextHint(use?"F":"",use==="exit"?"Step outside Cine Luna":use==="seat"?"Take this seat":use==="rise"?"Get up":use==="program"?"Read tonight’s program":room.transition?"":"Walk down the aisle to find a seat");
    }else if(room){
      const use=roomAction();$("objective").hidden=true;$("mode").textContent="Room 14";$("speed").textContent="";
      contextHint(use?"F":"",use==="door"?"Step out to Ocean Drive":use==="bed"?"Set the alarm":use==="desk"?"Read the note on your desk":"Walk to the bed, the desk or the door");
    }else if(b){
      const riding=b.stage==="ride",nearDoor=dist(hero,taxi)<8.8;
      contextHint(b.stage==="ready"&&nearDoor||riding&&!b.early?"E":b.stage==="waiting"?"J":"",
        b.stage==="ready"?(nearDoor?"Get into Cab 17":"Walk to Cab 17’s passenger door"):riding?(b.early?"Stopping at the next curb":"Ask Mina to pull over")+(isTop()?"":cabWindow()?"  ·  F  Outside view":"  ·  F  Passenger view"):b.stage==="waiting"?"Booking details":"Passenger door");
    }else if(transfer||deckStep||active?.regatta||swim?.exit)contextHint("","");
    else if(car===wrecker&&!inServiceBay(car)&&!atGuestParking()&&(!active||active.recovery)){
      if(recovery.onBench&&dist(car,recovery.onBench.car)<17)contextHint("V","Watch Della at work");
      else if(tow.busy)contextHint("",({raising:"Raising the front wheels",lowering:"Lowering the car",deploy:"Extending the wheel lift",fold:"Folding the wheel lift"})[tow.state]);
      else if(recovery.held(car))contextHint("","Passenger door · "+(recovery.call?.p.name||"Roadside pickup"));
      else if(tow.state==="haul")contextHint("G",BayRecovery.dropReady(tow.target)?"Set down in Della’s handoff lane":BayRecovery.parked(car)?"Lower the car here":"Stop to set the car down  ·  V look back");
      else if(tow.state==="down"){
        const v=tow.nearest(cars,towable,recovery.call?.p.car),g=tow.guide(v);
        const hint=!g?"Fold the empty lift":g.aligned?(BayRecovery.parked(car)?"Raise the front wheels":"Stop over the front wheels"):
          g.heading>.55?"Face the same way as the other car":Math.abs(g.x)>1.22?"Move the crossbar "+(g.x<0?"left":"right"):
          g.z<0?"Back up "+Math.abs(g.z).toFixed(1)+" m":"Pull forward "+Math.abs(g.z).toFixed(1)+" m";
        contextHint(!g||g.aligned?"G":"V",hint);
      }else contextHint("G","Lower the wheel lift"+(!active&&BayRecovery.parked(car)?"  ·  F  Dispatch radio":""));
    }else if(byDella()&&!active&&!heat)contextHint("F","Talk to Della Moss · Recovery calls");
    else if(motorist)contextHint("F","Offer roadside help to "+motorist.name);
    else if(pastCaller)contextHint("F","Catch up with "+pastCaller.name);
    else if(onStreetFeet()&&!active&&!heat&&Array.from(roadDrivers.values()).some(p=>!p.seated&&dist(p,hero)<2.8))contextHint("F","Check on the driver");
    else if(swim){
      const out=seaExit(),find=diveFind();
      if(watchCrew.towing)contextHint("F","Let Tali take the float");
      else if(!active&&!heat&&watchCrew.offer(hero,swim))contextHint("F","Take the float with "+swimmer);
      else if(find)contextHint("F","Pick up the "+find.name.toLowerCase());
      else if(out)contextHint("E",out.type==="ladder"?"Climb the ladder · "+out.l.dock.name:"Climb aboard the "+bay.hulls[out.v.kind].name);
      else if(swim.covered)contextHint("",swim.forced?"Following the edge to open water":"Swim past the edge to surface");
      else if(swim.forced)contextHint("","Coming up for air");
      else if(!active&&nearBeachRegular())contextHint("F","Talk to "+nearBeachRegular().name);
      else if(diving)contextHint("Space","Release to surface · Shift to swim faster");
      else contextHint("Space","Hold to dive  ·  Shift to swim faster");
    }
    else if(byCinema())contextHint("F","Step inside Cine Luna");
    else if(waiting)contextHint(BayCab.stopped(car)?"H":"","Offer "+waiting.name.split(" ")[0]+" a ride to "+waiting.to.name+(BayCab.stopped(car)?"":" · Pull over first"));
    else if(cabRank())contextHint("F","Hail Bay Cab");
    else if(fare&&cabs.holds(car))contextHint("","Passenger door · "+fare.name);
    else if(!active&&atWatchBoard())contextHint("F",save.shore.carried?"Return the "+siteById(save.shore.carried).name.toLowerCase():"Read the lifeguard’s lost-and-found board");
    else if(!active&&nearBeachRegular())contextHint("F","Talk to "+nearBeachRegular().name);
    else if(monitor)contextHint("Space","Hold to roll  ·  Mouse or arrows to aim  ·  F lower");
    else if(byListeningSite())contextHint("F","Raise Kit’s field mic");
    else if(byKit()&&(!active||field?.phase==="return"))contextHint("F",field?"Give Kit the tape":"Talk to Kit Bell · Sol FM");
    else if(field&&car&&dist(car,tar)<16)contextHint("E","Park and continue on foot");
    else if(stunt)contextHint("G","Switch driver  ·  T  Retake");
    else if(shooting())contextHint("Space","Take photo  ·  Click also works");
    else if(active?.meet)contextHint("","");
    else if(car&&car===meet.jules)contextHint("E","Leave the passenger seat");
    else if(atGuestParking())contextHint("F",car===personalCar?"Room 14 parking permit":"Keep this car · Room 14 guest parking");
    else if(byRoomDoor())contextHint("F","Unlock Room 14");
    else if(byCounter())contextHint("F",hours.market==="open"?"See Rosario’s orders":hours.market==="setup"?"Talk to Rosario":"Read the counter hours");
    else if(diner)contextHint("F",active?.plate?"Hand "+diner.name+" the bag":"Talk to "+diner.name);
    else if(car&&active?.plate&&dist(car,active.plate.customer)<15)contextHint("E","Park and hand over the order on foot");
    else if(canJoinTake())contextHint("F","Talk to Romy about One Good Take");
    else if(atTakePoster())contextHint("F","Look at the Cine Luna poster");
    else if(canRideWithJules())contextHint("F","Ride shotgun with Jules  ·  Bring Mara’s camera");
    else if(canChallenge())contextHint("H","Race Romy to Cine Luna");
    else if(!active&&!heat&&meet.phase==="idle"&&!car&&dist(hero,meet.rival)<22)contextHint("","Romy takes horn challenges  ·  Walk to Jules’s teal coupe to ride");
    else if(skiff){
      const mooring=nearestMooring(skiff);
      if(ferry?.waitingAtDock(skiff))contextHint("","Wait for Inez to board");
      else if(ferry?.phase==="water"&&skiff===ferry.boat&&dist(skiff,ferry.ship.gate)<30)contextHint("F","Hold to match speed · A / D to steer");
      else if(boxed>1)contextHint("","Patrol alongside · "+Math.ceil(5.3-boxed)+" s");
      else if(mooring)contextHint(Math.abs(skiff.speed)<2.1?"E":"","Tie up at "+mooring.dock.name+(Math.abs(skiff.speed)>=2.1?" · Slow below 4 kn":""));
      else if(!ferry&&Math.hypot(skiff.vx,skiff.vz)<=2.1)contextHint("E",heat?"Go over the side":"Go over the side · F race desk");
      else if(heat)contextHint("V","Look astern");
      else if(!tar)contextHint("M","Find a landing  ·  F  Race the bay");else contextHint("","");
    }
    else if(!car&&bay.landing(hero.x,hero.z)===BayCut.dock){
      const v=boardable();
      if(speaker?.fieldSource)contextHint("F","Talk to "+speaker.name+(v?"  ·  E board "+bay.hulls[v.kind].name:""));
      else if(v)contextHint("E","Board "+bay.hulls[v.kind].name);else contextHint("","Follow the boards out to the float");
    }else if(!car&&bay.landing(hero.x,hero.z)){
      const v=boardable();if(v)contextHint("E","Board "+bay.hulls[v.kind].name+(heat||ferry?"":"  ·  F  Race desk"));
      else if(heat||ferry)contextHint("","Head out along the pier to a boat");
      else contextHint("F","Outboard club  ·  Walk to a boat to board");
    }
    else if(car&&ferry?.holds(car))contextHint("","Inez Cruz  ·  Passenger door");
    else if(car&&ferry?.phase==="pier")contextHint("E","Get out and follow Inez down the pier");
    else if(car&&ferry?.phase==="pickup"&&dist(car,ferry.rider)<12)contextHint("","Stop with room by the passenger door");
    else if(active?.story?.interaction(car))contextHint("F",active.story.phase==="choice"?"Choose where to deliver the photo":"Use Mara’s camera");
    else if(car&&active?.story?.holds(car))contextHint("","Mara Vega  ·  "+(active.story.progress===0&&active.story.phase==="handoff"?"Delivering the photo":"Passenger door"));
    else if(car&&active?.story&&dist(car,tar)<12)contextHint("",active.story.phase==="port"?"Stop beside the red sign":"Stop with room by the passenger door");
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
      if(heat)contextHint("","Lose the cops for shop service");
      else if(readyForShop(car))contextHint("F","Portside Tire · Upgrades & paint");
      else contextHint("",inServiceBay(car)?"Stop for garage service":"Pull in for upgrades & paint");
    }
    else if(active?.dash)contextHint("","");
    else if(tar&&active?.job.id==="dash"&&car&&dist(p,tar)<13)contextHint("E","Park and line up on foot");
    else if(contact)contextHint("F",contact.prompt);
    else if(!car&&!active&&dist(hero,course[0])<4)contextHint("F","Line up for Low Tide Dash");
    else if(!car&&!active&&dist(hero,maraOnBreak())<3)contextHint("F",save.edition?"Read Mara’s Bay Wire story":"Meet Mara Vega");
    else if(tar&&active?.job.id==="tape"&&car&&dist(p,tar)<12)contextHint("E","Park and meet the contact on foot");
    else if(tar&&active&&!field&&!active.story&&!active.plate&&!ferry&&active.job.id!=="tape"&&active.job.id!=="dash"&&dist(p,tar)<12&&(!car||(active.job.id!=="race"&&Math.abs(car.speed)>7)))contextHint("",car?"Slow down at the marker":"Bring a car to the marker");
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
    if(panel==="field-proof"&&active?.field?.phase==="review"){active.field.phase="return";cameraSnap();}
    if(panel==="take-result"&&active?.take?.receipt)wrapTake();
    paintPreview=null;
    panel="";$("panel").hidden=true;$("shade").hidden=true;$("hud").hidden=!play;keys.clear();resetPointer();sound.pause(false);document.activeElement?.blur();lastHud=-10;lastMap=-10;captureMouse();
  }
  function makeButton(title,detail,right,fn,className="row-action"){
    const b=document.createElement("button"),block=document.createElement("span"),strong=document.createElement("strong"),small=document.createElement("small"),end=document.createElement("em");
    b.className=className;strong.textContent=title;small.textContent=detail;end.textContent=right;block.append(strong,small);b.append(block,end);b.addEventListener("click",fn);return b;
  }
  function signedNote(body,line,signature){
    const card=document.createElement("div"),text=document.createElement("p"),by=document.createElement("span");
    card.className="room-note";text.textContent=line;by.textContent=signature;card.append(text,by);body.append(card);
  }
  function showSurfBoard(body){
    const board=document.createElement("div");board.className="surf-slips";body.append(board);
    for(const s of BaySwimming.sites){
      const filed=save.shore.returned.includes(s.id),holding=save.shore.carried===s.id;
      const row=makeButton(s.name,holding?s.owner+" left "+cash(s.pay)+" for its return.":s.clue,
        filed?"On the peg":holding?"Return · "+cash(s.pay):"Mark spot",()=>{
          if(!atWatchBoard()||active||save.shore.returned.includes(s.id))return;
          if(save.shore.carried===s.id){
            save.shore.returned.push(s.id);save.shore.carried="";save.wallet+=s.pay;
            if(waypoint?.kind==="surf-tower")waypoint=null;
            persist();sound.cue("paid");closePanel();note("Back on the peg",s.owner+" left you "+cash(s.pay)+" for the "+s.name.toLowerCase()+".",4);
          }else if(!save.shore.carried)clockPin({id:s.id,x:s.x,z:s.z,name:s.place,kind:"dive-site"});
        },"row-action surf-slip");
      const tag=document.createElement("b");tag.className="claim-tag";tag.textContent=s.owner+" · "+s.place;
      row.children[0].prepend(tag);row.disabled=filed||!!save.shore.carried&&!holding;row.classList.toggle("filed",filed);
      board.append(row);
    }
  }
  function showReel(body,record){
    const slip=document.createElement("div"),wave=document.createElement("canvas"),caption=document.createElement("span");
    slip.className="field-slip";wave.width=400;wave.height=53;wave.setAttribute("aria-label","Waveform of your recorded take");
    caption.textContent=BayHours.time(record.minute)+"   /   2.6 sec   /   "+record.score+" of 100";
    slip.append(wave,caption);body.append(slip);BayMarshLine.waveform(wave,record.tape.levels);
  }
  function fieldDesk(body){
    signedNote(body,"The weather desk keeps borrowing my bird tape. Pick something out there and bring me a fresh piece. You’ll hear it under the tide report.","Kit Bell, field producer");
    for(const source of BayCutWildlife.sources){
      const last=save.fieldReels[source.id];
      body.append(makeButton(source.name,source.site.name+" · "+BayMarshLine.notes[source.id],last?"Best "+last.score:"Take the mic",()=>startField(source)));
    }
  }
  function showDesk(body){
    signedNote(body,"If you're headed across town tonight, stop by the counter. Somebody on late shift always needs a plate. South side of El Mercado, under the striped awnings. I start serving at six.","Rosario");
    body.append(makeButton("Rosario’s night counter","Pin the counter on your city map.","Set waypoint",()=>clockPin(BayMercadoArt.counter)));
    const pin=carPin();
    body.append(pin?makeButton(pin.name,"Your guest permit. Parked in "+district(pin)+".","Locate",()=>clockPin(pin)):
      makeButton("Guest parking","Stop in the space painted 14 outside your door to keep a personal car.","Find the space",()=>clockPin(BayMotelParking.bay)));
    if(save.plates.served){
      const list=document.createElement("ul");list.className="order-history";list.setAttribute("aria-label","Rosario’s delivery slips");
      for(const c of BayPlates.regulars)if(save.plates.visits[c.id]){
        const row=document.createElement("li");row.textContent=c.name+" · "+c.place+" · "+save.plates.visits[c.id]+(save.plates.visits[c.id]===1?" supper":" suppers");list.append(row);
      }body.append(list);
    }
  }
  function showAlarm(body){
    const now=document.createElement("p");now.className="market-hours";now.textContent="The bedside clock reads "+BayHours.time(hours.minute)+".";body.append(now);
    for(const [m,label,detail] of [[420,"Breakfast","Morning light on Ocean Drive."],[720,"Noon","The sun is high over the bay."],[1090,"Dinner shift","Rosario’s griddle is hot."],[15,"After midnight","Catch the last of the night shift."]]){
      body.append(makeButton(label,detail,BayHours.time(m),()=>{
        if(!room||roomAction()!=="bed")return;
        hours.wake(m);saveTime();closePanel();note("Marlin Motel",BayHours.time(hours.minute)+"  ·  The alarm clicks off.",3.2);hud();
      }));
    }
  }
  function showCounter(body){
    if(hours.market!=="open"){
      signedNote(body,hours.market==="setup"?"I’m heating the plancha. Come back at six and you can take the first order.":"On the night shift? Hot plates six in the evening to two in the morning. Leave my blue thermos on the hook.","Rosario");
      body.append(makeButton("Marlin Motel · Room 14","Set the bedside alarm for the dinner shift.","Set waypoint",()=>clockPin(BayMarlinRoom.outside)));return;
    }
    const intro=document.createElement("p");intro.className="market-hours";
    intro.textContent=save.plates.served?"Rosario tears two fresh slips from the pad. “Pick one. I’ll wrap it.”":"“Taking the car? Pick a slip. They’ll be waiting outside on their break.”";body.append(intro);
    for(const c of BayPlates.orders(hours,save.plates)){
      const detail=c.name+" · "+c.place+". "+(c.care==="steady"?"Keep the bag upright.":"Get it there hot.");
      body.append(makeButton(c.dish,detail,cash(c.base)+" + tip",()=>takeOrder(c),"jobcard"));
    }
  }
  function radioButton(){return makeButton("Sol FM & city sounds","Music, engines, surf and street sounds.",radio?"On":"Off",()=>{radioToggle();openPanel("pause",true);});}
  function ferryTicket(body,route){
    const c=document.createElement("canvas");c.className="ferry-ticket";c.width=760;c.height=190;
    c.setAttribute("role","img");c.setAttribute("aria-label","Paloma boarding ticket for "+route.name);
    if(c.getContext?.("2d"))BayFerryPassengerArt.ticket(c,route.name);
    body.append(c);
  }
  function ferryBrief(body,replay){
    const route=BayFerry.nextRoute(save.ferryLine);ferryTicket(body,route);
    const msg=document.createElement("p");msg.className="ferry-brief";
    msg.textContent="“I’ve got the engine-room keys and the Paloma just left. Meet me outside the Marlin. We can catch her from the pier.” — Inez Cruz";
    body.append(msg,
      makeButton("Standard sailing","Drive Inez to the pier. After casting off, you have 105 seconds to catch the amber gate on the ferry’s left side.","$450",()=>beginFerry(false,replay)),
      makeButton("Five-star sailing","You have 85 seconds at sea. Harbor Patrol gives chase. Inez jumps while Air One’s light is on your boat.","$900",()=>beginFerry(true,replay)));
  }
  function showFerryReceipt(body){
    const {run,reason,paid}=ferryReceipt;ferryTicket(body,run.ship.route);
    const slip=document.createElement("div"),label=document.createElement("strong"),sum=document.createElement("span");
    slip.className="ferry-receipt";label.textContent=paid?"Fare received":"Fare missed";sum.textContent=(paid?"+":"")+cash(paid);
    slip.append(label,sum);const detail=document.createElement("p");detail.className="ferry-brief";
    detail.textContent=(reason==="busted"?"Bay Patrol stopped the trip.":paid?"Inez made it aboard in "+run.waterTime.toFixed(1)+" seconds at sea.":"The Paloma closed its boarding gate.")+" Wallet "+cash(save.wallet)+".";
    body.append(slip,detail,makeButton("Back to the bay","Continue from here.","Resume",closePanel),
      makeButton("Replay from the motel","Start the next sailing at the Marlin with your earnings and clear stars.","Next sailing",()=>openPanel("ferry-replay")));
  }
  function marinaSheet(body){
    body.append($("marinaSheet").content.cloneNode(true));
    const sel=body.querySelector("#clubCourse"),buttons=[],list=body.querySelector(".hull-list"),chart=body.querySelector(".club-chart canvas");
    const entry=body.querySelector(".club-race");
    for(const c of bay.courses){const opt=document.createElement("option");opt.value=c.id;opt.textContent=c.name;sel.append(opt);}
    sel.value=courseChoice;
    for(const kind of ["needle","mako"]){
      const b=document.createElement("button"),icon=document.createElement("canvas"),name=document.createElement("strong"),detail=document.createElement("small");
      const spec=bay.hulls[kind];icon.width=104;icon.height=64;icon.setAttribute("aria-hidden","true");
      BayMarinaArt.drawMap(icon.getContext("2d"),kind,51,33,12,Math.PI/2);
      b.type="button";b.value=kind;b.className="hull-choice";name.textContent=spec.name;detail.textContent=spec.detail;
      b.append(icon,name,detail);b.onclick=()=>{hullChoice=kind;refresh();};list.append(b);buttons.push(b);
    }
    function refresh(){
      const c=bay.courses.find(c=>c.id===courseChoice),best=save.regatta[c.id+"/"+hullChoice];
      BayMarinaView.chart(chart,c);chart.setAttribute("aria-label",c.name+" course chart. "+c.detail);
      body.querySelector(".chart-course").textContent=c.detail;body.querySelector(".chart-distance").textContent=c.gates.length+" gates · "+c.length+" m";
      body.querySelector(".club-record").textContent=best?"Boat record "+raceWatch(best):"First run in this boat";
      for(const b of buttons)b.setAttribute("aria-pressed",String(b.value===hullChoice));
      entry.textContent="Race Paz · "+cash(c.purse);
    }
    sel.onchange=()=>{courseChoice=sel.value;refresh();};entry.onclick=()=>castOff(hullChoice,courseChoice,true);
    body.querySelector(".club-cruise").onclick=()=>castOff(hullChoice,courseChoice,false);refresh();
  }
  function showRegattaResult(body,r){
    const slip=document.createElement("div"),time=document.createElement("strong"),pay=document.createElement("span"),detail=document.createElement("p");
    slip.className="result-slip";time.textContent=raceWatch(r.time);pay.textContent="+"+cash(r.pay);slip.append(time,pay);
    detail.className="finish-detail";detail.textContent=bay.hulls[r.kind].name+" · "+(r.record?"New boat record":"Boat record "+raceWatch(r.best))+" · Wallet "+cash(save.wallet);
    body.append(slip,detail,makeButton("Race again","Same course and boat. Another shot at Paz.","Rematch",()=>castOff(r.kind,r.c.id,true)),
      makeButton("Change course or boat","Open the outboard club race sheet.","Race desk",openRaceSheet),makeButton("Keep cruising","The helm is yours. Tie up at either landing.","Resume",closePanel));
  }
  function showPhoto(body){
    body.append($("exposureProof").content.cloneNode(true));
    const c=body.querySelector("canvas");BayExposureArt.drawPhoto(c.getContext("2d"),c.width,c.height);
  }
  function showViewfinder(body,story){
    body.append($("exposureCamera").content.cloneNode(true));
    const canvas=body.querySelector("canvas"),cross=body.querySelector(".finder-cross"),status=body.querySelector(".finder-status");
    BayExposureArt.drawPhoto(canvas.getContext("2d"),canvas.width,canvas.height);
    function aim(x,y){
      story.aim.x=clamp(x,.04,.96);story.aim.y=clamp(y,.06,.94);
      cross.style.left=story.aim.x*100+"%";cross.style.top=story.aim.y*100+"%";cross.classList.toggle("locked",story.focus());
      status.textContent=story.focus()?"Lot 14 in focus.":"Frame the red Lot 14 sign.";
    }
    function shutter(){if(panel!=="viewfinder"||active?.story!==story)return;
      if(story.expose()){openPanel("contact");return;}
      status.textContent="The sale notice needs to be in the brackets.";
    }
    canvas.addEventListener("pointerdown",e=>{
      const box=canvas.getBoundingClientRect();aim((e.clientX-box.left)/box.width,(e.clientY-box.top)/box.height);canvas.focus();
    });
    canvas.addEventListener("keydown",e=>{
      const dir={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.code];
      if(dir){e.preventDefault();aim(story.aim.x+dir[0]*.02,story.aim.y+dir[1]*.02);}
      else if(e.code==="Space"||e.code==="Enter"){e.preventDefault();if(!e.repeat)shutter();}
    });
    body.querySelector(".shutter").onclick=shutter;aim(story.aim.x,story.aim.y);canvas.focus({preventScroll:true});
  }
  function chooseExposure(route){
    if(!active?.story?.choose(route))return;
    closePanel();speak("Mara Vega",route==="live"?"Sol FM’s van is on the North Boardwalk. Get me there before the weather.":"Cine Luna. Pull up by the yellow film slot. They’ll put this on the big screen.");
  }
  function showPartsTicket(body,v){
    body.append($("partsTicket").content.cloneNode(true));
    const wallet=body.querySelector(".parts-wallet"),list=body.querySelector(".parts-list"),receipt=body.querySelector(".parts-receipt");
    body.querySelector(".parts-model").textContent=formatVehicle(v);
    paintPreview=v;lastMenuPaint=-Infinity;
    const buttons=parts.map(part=>{
      const row=makeButton(part.name,part.detail,"",()=>{
        if(!fitPart(v,part))return;
        refresh();receipt.textContent=part.name+" fitted · −"+cash(part.price);
        receipt.focus({preventScroll:true});
      },"part-order");
      list.append(row);return row;
    });
    const quote=BayRecovery.price(v);let repair;
    if(quote){
      repair=makeButton("Straighten bodywork",BayRecovery.faultText(v)+". Straighten the panels and replace damaged cooling parts.",cash(quote),()=>{
        if(!fixBody(v))return;openPanel("upgrades",true);note(garage.name,"Bodywork repaired · −"+cash(quote),3);
      },"part-order");
      list.append(repair);
    }
    function refresh(){
      wallet.textContent=cash(save.wallet);
      if(repair)repair.disabled=save.wallet<quote;
      parts.forEach((part,i)=>{
        const button=buttons[i],owned=v.upgrades[part.id],short=part.price-save.wallet;
        button.disabled=owned||short>0;button.classList.toggle("fitted",owned);
        button.querySelector("em").textContent=owned?"✓ Fitted":"Fit · "+cash(part.price);
        button.setAttribute("aria-label",part.name+(owned?", fitted":", install for "+cash(part.price)));
        button.querySelector("small").textContent=part.detail+(!owned&&short>0?" Need "+cash(short)+" more.":"");
      });
    }
    refresh();
  }
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
  function showCabDestinations(body){
    const from=cabRank();
    for(const to of Object.values(BayCab.stops)){
      if(from.id===to.id||dist(from,to)<10)continue;
      const price=cabs.quote(from,to),afford=price<=save.wallet;
      const button=makeButton(to.name,({marlin:"Room 14 and the Sol Beach flags",luna:"Theater entrance on Neon Mile",flowers:"Bea’s flower shop in Old Palms",wheel:"The bandstand by the wheel"})[to.id],
        price?cash(price):"On the house",()=>{
          const curb=cabRank();if(!curb||cabs.quote(curb,to)>save.wallet||!cabs.request(curb,to))return;
          waypoint=null;closePanel();lastHud=lastMap=-10;
          if(cabs.booking.stage==="ready")cabEvent("ready",cabs.booking);
          else speak("Bay Cab dispatch","Seventeen has your call. Wait by the curb.");
        });
      button.disabled=!afford;body.append(button);
    }
  }
  function showCineProgram(body){
    for(const reel of BayCineProgram.describe(filmOptions())){
      const row=document.createElement("p"),title=document.createElement("strong");
      row.className="cine-listing";title.textContent=reel.title;
      row.append(title,document.createTextNode(reel.credit+"  ·  "+reel.seconds+" s"));body.append(row);
    }
    const foot=document.createElement("p");foot.className="edition-copy";
    foot.textContent="Continuous showing. Take any open aisle seat.";body.append(foot);
  }
  function openPanel(next,redraw=false){
    if(!play)return;if(panel===next&&!redraw){closePanel();return;}
    if(next==="cab-rank"&&!cabRank()||next==="cine-program"&&(room?.kind!=="cinema"||roomAction()!=="program"))return;
    if(next==="recovery-desk"&&(active||heat||cabs.booking||(!byDella()&&!(car===wrecker&&!transfer&&BayRecovery.parked(car)))))return;
    if((next==="room-bed"||next==="room-desk")&&(!room||"room-"+roomAction()!==next)||next==="market"&&!byCounter())return;
    if(next==="guest-parking"&&!atGuestParking())return;
    if(next==="surf-watch"&&(!atWatchBoard()||active))return;
    if(next==="field-desk"&&(active||!byKit())||next==="field-proof"&&active?.field?.phase!=="review")return;
    if(panel==="field-proof"&&next!=="field-proof"&&active?.field?.phase==="review"){active.field.phase="return";cameraSnap();}
    if(next==="take-brief"&&!canJoinTake()||next==="take-result"&&!active?.take?.receipt||next==="take-poster"&&!atTakePoster())return;
    if(panel==="take-result"&&next!=="take-result"&&active?.take?.receipt)wrapTake();
    if(next==="map"&&!redraw)chartMode=BayCut.area(pos())?"cut":skiff||swim?"bay":"city";
    if(next==="regatta-result"&&!regattaResult)return;
    if(next==="ferry-result"&&!ferryReceipt)return;
    if(next==="meet-result"&&!meetReceipt||next==="meet-cover"&&!save.meet.cover)return;
    if((next==="ferry"||next==="ferry-replay")&&active)return;
    const shop=next==="respray"||next==="upgrades";
    if((next==="viewfinder"||next==="contact")&&active?.story?.interaction(car)!==next)return;
    if(next==="edition"&&!save.edition)return;
    if(shop){
      if(!readyForShop(car))return;
      BayDriving.settle(car);
    }
    if(listening()){active.field.slice=null;active.field.armed=true;}
    onAir=null;paintPreview=null;$("shade").className=shop?"paint-shade":"";
    panel=next;keys.clear();releaseMouse();sound.pause(true);$("hud").hidden=true;$("shade").hidden=false;$("panel").hidden=false;$("panel").setAttribute("data-screen",shop?"garage":next);
    const b=$("panelBody");b.replaceChildren();$("closePanel").focus({preventScroll:true});
    let title="",kicker="";
    if(shop){
      title=garage.name;kicker="Port Sol  /  Service bay";
      b.append($("shopNav").content.cloneNode(true));
      for(const button of b.querySelectorAll(".shop-nav button")){
        button.setAttribute("aria-pressed",String(button.value===next));
        button.onclick=()=>{if(panel!==button.value){openPanel(button.value);$("panelBody").querySelector(".shop-nav [aria-pressed='true']").focus();}};
      }
      if(next==="respray")showPaintTicket(b,car);else showPartsTicket(b,car);
    }else if(next==="recovery-desk"){
      title="Roadside calls";kicker="Portside Tire  /  Della Moss";
      const board=recovery.board();
      signedNote(b,board.length?"“Pick a call. Take the green wrecker, bring the driver along, and leave their car between the stripes by my bench.”":
        "“The board's clear. Take the truck if you want to bring a bent car in yourself.”","Della");
      for(const p of board)b.append(makeButton(p.name+" · "+p.slip.place,BayRecovery.faultText(p.car)+" on a "+formatVehicle(p.car)+".",cash(p.slip.pay)+" + tip",()=>takeRecovery(p)));
      if(recovery.completed){
        const strip=document.createElement("p");strip.className="statline";
        strip.textContent=BayRecovery.calls.filter(c=>save.recovery.visits[c.id]).map(c=>c.name+" · "+save.recovery.visits[c.id]+" filed"+(save.recovery.best[c.id]?" · Best "+watch(save.recovery.best[c.id]):"")).join("   /   ");b.append(strip);
      }
    }else if(next==="cab-rank"){
      title="Where to?";kicker=cabRank().name+"  /  Bay Cab";showCabDestinations(b);
    }else if(next==="cine-program"){
      title="Tonight at Cine Luna";kicker="Projection booth  /  Continuous program";showCineProgram(b);
    }else if(next==="surf-watch"){
      title="Lost and found";kicker="Sol Beach patrol  /  Station 03";showSurfBoard(b);
    }else if(next==="field-desk"){
      title="The Marsh Line";kicker="Sol FM  /  Pelican Cut";fieldDesk(b);
    }else if(next==="field-proof"){
      const f=active.field;title=f.source.name;kicker="Field tape  /  "+f.source.site.name;showReel(b,f.take);
      b.append(makeButton("Keep this take","Return to Kit at the field station to put it on the radio.","Pack up",closePanel),
        makeButton("Roll another","Stay here and record a fresh pass.","Retake",()=>{f.take=null;f.raise(hero);closePanel();}));
    }else if(next==="field-archive"){
      title="The Marsh Line";kicker="Sol FM  /  Your field tapes";
      for(const src of BayCutWildlife.sources){
        const record=save.fieldReels[src.id];if(!record)continue;
        b.append(makeButton(src.name,src.site.name+" · Best field recording","Play tape",()=>{closePanel();runTape(record.tape);}));showReel(b,record);
      }
    }else if(next==="guest-parking"){
      title="Guest parking";kicker="Marlin Motel  /  Room 14";
      const v=car,tag=document.createElement("p");tag.className="market-hours";
      tag.textContent=personalCar?"The permit is in your "+formatVehicle(personalCar)+".":"The desk has one parking permit in your name.";b.append(tag);
      b.append(makeButton(v===personalCar?"Update parking spot":"Keep the "+formatVehicle(v),
        "The map remembers where you leave this car, even after you close the game.",personalCar&&v!==personalCar?"Transfer permit":"Room 14",()=>{
          if(!atGuestParking()||car!==v)return;
          personalCar=v;BayMotelParking.write(v,true);closePanel();note("Room 14 parking",formatVehicle(v)+"  ·  Guest permit on the dash.",3.4);
        }));
    }else if(next==="room-bed"){
      title="Set the alarm";kicker="Marlin Motel  /  Room 14";showAlarm(b);
    }else if(next==="room-desk"){
      title="A note from Rosario";kicker="Marlin Motel  /  Room 14";showDesk(b);
    }else if(next==="market"){
      title="Rosario’s night counter";kicker="El Mercado  /  6 PM – 2 AM";showCounter(b);
    }else if(next==="take-brief"){
      title="One Good Take";kicker="Cine Luna  /  Picture cars";
      const brief=document.createElement("p");brief.className="take-quote";
      brief.textContent="“I promised the director four wheels on Jules’s truck. The palm trees are plywood. Try to miss them.”";
      b.append(brief);
      const controls=document.createElement("div");controls.className="take-marks";
      for(const [name,direction] of [["Jules","Hold W to roll the flatbed. Keep W held and tap G on the green cue."],["Romy","Drive the red coupe up the ramp. A / D steer. G switches back to Jules, even in the air."]]){
        const row=document.createElement("p"),label=document.createElement("b");label.textContent=name;row.append(label,document.createTextNode(direction));controls.append(row);
      }
      b.append(controls,makeButton("Roll cameras","Land on the moving bed. Your longest clean jump gets the theater poster.","Start take",()=>startTake(false)));
      if(save.stunt)b.append(makeButton("Use the long mark","A longer run-up for a bigger jump.","Long take",()=>startTake(true)));
    }else if(next==="take-poster"){
      title="One Good Take";kicker="Cine Luna  /  Poster case";
      const poster=document.createElement("canvas");poster.className="take-print";b.append(poster);BayTakePoster.paint(poster,save.stunt);
      b.append(makeButton("Back to the street","Close the poster case.","Continue",closePanel));
    }else if(next==="take-result"){
      const r=active.take,ticket=r.receipt;
      title=ticket.paid?"Print it!":"Cut!";kicker="One Good Take  /  Take "+r.number;
      const line=document.createElement("p");line.className="take-quote";
      if(ticket.paid){
        line.textContent=r.distance.toFixed(1)+" m   ·   "+cash(ticket.paid)+(ticket.record?"   ·   New Cine Luna poster":ticket.filmLost?"   ·   Camera readback unavailable":"   ·   Best "+save.stunt.distance.toFixed(1)+" m");
        b.append(line);
        if(save.stunt){const print=document.createElement("canvas");print.className="take-print";b.append(print);BayTakePoster.paint(print,save.stunt);}
      }else{line.textContent=r.reason;b.append(line);}
      b.append(makeButton("Retake","Reset both picture cars to their marks.","T",()=>startTake()));
      if(save.stunt)b.append(makeButton(r.longMark?"Use the short mark":"Use the long mark",r.longMark?"Return to the original run-up.":"Start farther back for a longer jump.","Change mark",()=>startTake(!r.longMark)));
      b.append(makeButton("Wrap the shoot","Step out by the Cine Luna poster case.","Finish",closePanel));
    }else if(next==="meet-result"||next==="meet-cover"){
      const r=meetReceipt,cover=next==="meet-cover"?save.meet.cover:r.photo;
      kicker=next==="meet-cover"?"Cine Luna  /  Bay Wire":r.route+"  /  Portside After Dark";
      title=next==="meet-cover"?"Night edition":r.role==="photo"?(cover?"You made the cover":"End of the roll"):r.won?"First to the lights":r.finished?"Romy took the line":"Time’s up";
      if(cover){
        const print=document.createElement("canvas");print.className="night-edition";b.append(print);BayMeetPhoto.cover(print,cover);
      }
      if(next==="meet-result"){
        const text=document.createElement("p");text.className="finish-detail";
        text.textContent=r.role==="photo"?(cover?"Bay Wire paid "+cash(r.pay)+" for your cover shot. Photo score "+cover.score+"/100.":"Next time, catch the red coupe and theater sign together. Jules will give you another ride."):
          (r.finished?raceWatch(r.time)+"  ·  Personal best "+raceWatch(save.meet.best[r.route])+"  ·  "+cash(r.pay):"The 90-second clock ran out. Romy will be back at Portside Tire.");
        b.append(text);
      }
      b.append(makeButton("Back to the city",next==="meet-cover"?"Put the paper away.":"Head out from here.","Continue",closePanel));
    }else if(next==="ferry"||next==="ferry-replay"){
      title="Last Ferry Out";kicker="Inez Cruz  /  Marlin Motel";ferryBrief(b,next==="ferry-replay");
    }else if(next==="ferry-result"){
      title=ferryReceipt.paid?"Made the sailing":"Missed the sailing";kicker="M/V Paloma  /  Last Ferry Out";showFerryReceipt(b);
    }else if(next==="marina"){
      title="Breakwater Run";kicker="Marlin Pier  /  Sundown Outboard Club";marinaSheet(b);
    }else if(next==="regatta-result"){
      const r=regattaResult;title=r.first?"First across the line":"Second across the line";kicker=r.c.name+"  /  Official finish";showRegattaResult(b,r);
    }else if(next==="viewfinder"){
      title="Mara’s camera";kicker="Last Exposure  /  Port Sol";showViewfinder(b,active.story);
    }else if(next==="contact"){
      title="Who gets the picture?";kicker="Last Exposure  /  Frame 14A";showPhoto(b);
      b.append(makeButton("Go live","Reach the Sol FM van before its next bulletin. 55 seconds.","$425",()=>chooseExposure("live")),
        makeButton("Make a print","Take the negative to Cine Luna for tonight’s screening. No deadline.","$300",()=>chooseExposure("print")));
    }else if(next==="edition"){
      const article=BayExposure.routes[save.edition];title=article.headline;kicker="Bay Wire  /  Evening edition";showPhoto(b);
      const copy=document.createElement("p");copy.className="edition-copy";copy.textContent=article.edition;b.append(copy,makeButton("Burner phone","Return to your contacts.","Back",()=>openPanel("jobs")));
    }else if(next==="jobs"&&cabs.booking){
      const booking=cabs.booking;
      title="Bay Cab";kicker="Mina Ortiz  /  Unit 17";
      b.append(makeButton(booking.to.name,booking.from.name+" pickup · "+(booking.price?cash(booking.price):"First ride on the house"),"Back",closePanel));
      if(!cabs.playerHeld)b.append(makeButton("Cancel the cab","Release Cab 17 for other fares.","Cancel ride",()=>{cabs.cancelBooking();closePanel();lastHud=lastMap=-10;}));
      else if(booking.stage==="ride"&&!booking.early)b.append(makeButton("Next curb, please","Mina will find a place to stop.","Pull over",()=>{if(cabs.askOut())speak("Mina Ortiz","Coming right up.");closePanel();}));
    }else if(next==="jobs"){
      title="Burner phone";kicker="Contacts  /  Sundown Bay";
      if(watchCrew.towing){
        b.append(makeButton("Sol Beach patrol","Bring "+watchCrew.call.slip.name+" into shallow water.","Keep swimming",closePanel),
          makeButton("Hand off the float","Tali will swim out and bring them in.","Let go",()=>{watchCrew.release();closePanel();}));
      }else if(active){
        const line=document.createElement("p");line.textContent=active.take?"One Good Take is shooting behind Cine Luna. Press G on set to switch drivers.":active.job.by+" has you on "+active.job.name+". Your next stop is "+currentTarget().name+".";b.append(line);
        b.append(makeButton("Back to the city","Keep the current job active.","Resume",closePanel),makeButton("Drop this job",active.take?"Leave the closed set at Cine Luna.":"Stay where you are and choose another contact.","Cancel job",()=>{dropJob();openPanel("jobs",true);}));
      }else for(const j of jobs)b.append(makeButton(j.name,j.by+"  ·  "+j.desc,j.id==="ferry"?"$450–900":j.id==="exposure"?"$300–425":j.id==="regatta"?"Race desk":cash(j.pay)+(["fare","dash"].includes(j.id)?"+":""),()=>startJob(j.id),j.id==="exposure"||j.id==="ferry"?"jobcard story-job":"jobcard"));
      if(save.edition)b.append(makeButton("Bay Wire",BayExposure.routes[save.edition].headline,"Read edition",()=>openPanel("edition")));
      if(save.meet.cover)b.append(makeButton("Bay Wire · Night edition","Your photograph from Cine Luna.","Read cover",()=>openPanel("meet-cover")));
      if(!active&&!watchCrew.towing)b.append(makeButton("Rosario León","Night counter at El Mercado. Serving from 6 PM to 2 AM.","Set waypoint",()=>clockPin(BayMercadoArt.counter)),
        makeButton("Kit Bell · Sol FM","Find the field producer at the fish camp, north of Ocean Drive.","Set waypoint",()=>clockPin(BayCut.station)),
        makeButton("Tali Moreno","The striped lifeguard tower across from the Marlin. The lost-and-found board faces the bay.","Set waypoint",()=>clockPin(BaySurfPatrol.tower)),
        makeButton("Della Moss · Portside Recovery","Find Della at the workbench beside the green wrecker.","Set waypoint",()=>clockPin(dispatchPin)));
      if(Object.keys(save.fieldReels).length)b.append(makeButton("Field tape library","Best takes you’ve filed with Sol FM.","Listen",()=>openPanel("field-archive")));
      const personalPin=carPin();
      if(!active&&!watchCrew.towing&&personalPin)b.append(makeButton(personalPin.name,"Last parked in "+district(personalPin)+".","Locate car",()=>clockPin(personalPin)));
      if(!active&&!watchCrew.towing)b.append(makeButton("Portside After Dark","Find Romy’s stunt shoot and the night races at Portside Tire.","Set waypoint",()=>{waypoint={...meetPin};closePanel();note("Jules","Teal coupe for a ride. Walk up to Romy’s red 27 for the shoot.",3);}));
      const stats=document.createElement("div");stats.className="statline";stats.textContent="Jobs done "+save.paid+"  /  Best circuit "+(save.best?watch(save.best):"—")+(save.dash?"  /  Best dash "+raceWatch(save.dash.splits.at(-1)):"");b.append(stats);
    }else if(next==="map"){
      title=chartMode==="bay"?"Offshore chart":chartMode==="cut"?"Pelican Cut":"City map";kicker="Palm Coast  /  Street atlas";
      const tabs=document.createElement("nav");tabs.className="atlas-views";tabs.setAttribute("aria-label","Map area");
      for(const [id,name] of [["city","City streets"],["cut","Pelican Cut"],["bay","Offshore chart"]]){
        const tab=document.createElement("button");tab.textContent=name;tab.setAttribute("aria-pressed",String(id===chartMode));
        tab.onclick=()=>{if(chartMode!==id){chartMode=id;openPanel("map",true);}};tabs.append(tab);
      }b.append(tabs);
      const wrap=document.createElement("div");wrap.className="map-wrap";const c=document.createElement("canvas");c.id="bigmap";c.width=704;c.height=624;c.tabIndex=0;c.setAttribute("aria-label","City map. Choose a destination from the list below or click the map.");wrap.append(c);
      const jobPins=chartMode==="bay"?[]:availableJobPins().filter(v=>chartMode==="cut"?BayCut.area(v):!BayCut.area(v));
      const legend=document.createElement("div");legend.className="map-legend";
      legend.innerHTML="<span>▲ You</span><span><em>◇</em> Waypoint</span><span>⚓ Landing</span>"+
        (chartMode==="cut"?"<span>○ Listening spot</span>":chartMode==="bay"?"<span>● Gull Light</span>"+(active?.ferry?"<span>▰ Paloma</span>":""):"<span><b>▣</b> Radio tape</span><span>🔧 Portside Tire</span><span>⚿ Room 14</span>")+
        (jobPins.length?"<span>! Job contact</span>":"");wrap.append(legend);b.append(wrap);
      const garageBounds=paintAtlas();
      const list=document.createElement("select");list.setAttribute("aria-label","Choose a map destination");
      const initial=document.createElement("option");initial.textContent=cabs.booking?"Following Cab 17":watchCrew.towing?"Returning the swimmer to shore":active?"Following the current job":"Choose a destination";initial.value="";list.append(initial);
      const landings=bay.docks.map(d=>({...bay.berth(d,vacant(skiff,d,1)?1:-1),name:d.name}));
      const ownPin=carPin();
      const countyStops=[BayCut.station,...BayCutWildlife.sources.map(s=>s.site),skiff?landings[2]:shorePins[2],cutGate];
      const ranks=Object.values(BayCab.stops).map(s=>({...s.stand,name:"Bay Cab · "+s.name}));
      const places=chartMode==="cut"?countyStops.concat(ownPin&&BayCut.area(ownPin)?[ownPin]:[]):chartMode==="city"?locations.filter(p=>!BayCut.area(p)).concat(jobPins,ranks,[BayMotelParking.bay,cutGate],ownPin?[ownPin]:[],save.stunt?[BayTakePoster.place]:[]):[...landings,{x:bay.beacon.x+11,z:bay.beacon.z,name:"Gull Light"}];
      places.forEach((v,i)=>{const opt=document.createElement("option");opt.value=i;opt.textContent=v.name;list.append(opt);});list.disabled=!!active||!!cabs.booking||watchCrew.towing;
      list.onchange=()=>{if(list.value!==""){waypoint={...places[Number(list.value)]};closePanel();note("Map pin",waypoint.name,2);}};
      b.append(list);c.addEventListener("click",ev=>{if(active||cabs.booking||watchCrew.towing)return;const rect=c.getBoundingClientRect(),frame=atlasFrame(),scale=c.width/frame.span;
        const mx=(ev.clientX-rect.left)/rect.width*c.width,my=(ev.clientY-rect.top)/rect.height*c.height;
        const wx=frame.cx+(mx-c.width/2)/scale,wz=frame.cz+(c.height/2-my)/scale;
        const pin={x:clamp(wx,-181,207),z:clamp(wz,-179,179)};
        const nearDock=bay.docks.find(d=>Math.hypot((chartMode==="bay"?d.x:d.footX+1.4)-wx,d.z-wz)<11);
        const venue=Math.hypot(wx-recoveryYard.drop.x,wz-recoveryYard.drop.z)<4?dispatchPin:locations.find(p=>["room","counter","surf-tower","theater","recovery-desk"].includes(p.kind)&&Math.hypot(p.x-wx,p.z-wz)<4)||ranks.find(p=>Math.hypot(p.x-wx,p.z-wz)<4.5);
        let jobPin=null,hitRadius=6;
        for(const site of jobPins){const gap=Math.hypot(site.x-wx,site.z-wz);if(gap<hitRadius){jobPin=site;hitRadius=gap;}}
        if(nearDock)waypoint={...(skiff||chartMode==="bay"?landings[bay.docks.indexOf(nearDock)]:shorePins[bay.docks.indexOf(nearDock)])};
        else if(ownPin&&Math.hypot(ownPin.x-wx,ownPin.z-wz)<4)waypoint={...ownPin};
        else if(venue)waypoint={...venue};
        else if(jobPin)waypoint={...jobPin};
        else if(chartMode==="city"&&dist(cutGate,{x:wx,z:wz})<7)waypoint={...cutGate};
        else if(chartMode==="cut"){
          const close=countyStops.find(p=>Math.hypot(p.x-wx,p.z-wz)<6);
          if(close)waypoint={...close};
          else if(valid(wx,wz,.42)||bay.landing(wx,wz)||bay.navigable(wx,wz))waypoint={x:wx,z:wz,name:district({x:wx,z:wz})};
          else {const p=BayCut.nearest(wx,wz);waypoint={x:p.x,z:p.z,name:p.route.name};}
        }
        else if(chartMode==="bay"&&wx>215){let x=clamp(wx,219,424);const z=clamp(wz,-179,179);while(!bay.navigable(x,z)&&x<425)x++;
          waypoint={x,z,name:Math.hypot(wx-bay.beacon.x,wz-bay.beacon.z)<9?"Gull Light":"Bay waypoint"};}
        else if(garageBounds&&mx>=garageBounds.left&&mx<=garageBounds.right&&my>=garageBounds.top&&my<=garageBounds.bottom)waypoint={...garage};
        else{waypoint=valid(pin.x,pin.z,.36)?pin:chase.road(pin);waypoint.name=district(waypoint);}
        closePanel();note("Map pin",waypoint.name,2);});
    }else{
      title="Paused";kicker="Sundown Bay  /  "+district(pos());const stats=document.createElement("div");stats.className="statline";stats.textContent=cash(save.wallet)+"  /  Jobs "+save.paid+"  /  Tapes "+save.tapes.length+" of 5";b.append(stats);
      const keysList=document.createElement("div");keysList.className="controls";const allControls=[["WASD / ↑↓←→","Move, drive or swim"],["Mouse","Look around"],["E","Enter, exit or climb aboard"],["Shift","Sprint or swim faster"],["S / ↓","Brake, then reverse"],["Space","Jump, handbrake or hold to dive"],["H / F","Horn / interact"],["J / M","Jobs / map"],["Q / C","Keyboard look"],["V / X","Look back / recenter"],["+ / −","Camera distance"]];
      for(const [key,text] of allControls){const span=document.createElement("span"),k=document.createElement("kbd");k.textContent=key;span.append(k,document.createTextNode(text));keysList.append(span);}b.append(keysList);
      b.append(makeButton("Back to the city","Resume free roam or your current job.","Resume",closePanel));
      const gfx=makeButton("Camera view",!view.gl||view.lost?"Lightweight overhead rendering is active.":"Third-person street view or the overhead map.",isTop()?"Overhead":"Street",()=>{manualTop=!manualTop;saveCamera();openPanel("pause",true);});gfx.disabled=!view.gl||view.lost;
      const assist=makeButton("Driving camera",cameraRig.assist?"Eases toward the road after you look around.":"Holds your mouse direction. Press X to face the road.",cameraRig.assist?"Follow":"Free look",()=>{cameraRig.assist=!cameraRig.assist;saveCamera();openPanel("pause",true);});
      const sensitivity=makeButton("Mouse sensitivity","Adjust horizontal and vertical look speed.",cameraRig.sensitivity<1?"Low":cameraRig.sensitivity>1?"High":"Normal",()=>{cameraRig.sensitivity=cameraRig.sensitivity===1?1.38:(cameraRig.sensitivity>1 ? .72 : 1);saveCamera();openPanel("pause",true);});
      b.append(gfx,assist,sensitivity,radioButton());
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
    if(cabWindow()){
      const b=cabs.booking;b.pan=clamp(b.pan+clamp(dx,-240,240)*.00325*cameraRig.sensitivity,-1.82,1.65);
      b.tilt=clamp(b.tilt-clamp(dy,-160,160)*.00255*cameraRig.sensitivity,-.62,.49);
    }else if(room?.kind==="cinema")BayCineRoom.look(room,dx*cameraRig.sensitivity,dy*cameraRig.sensitivity);
    else if(room){
      room.yaw+=clamp(dx,-240,240)*.00325*cameraRig.sensitivity;
      room.pitch=clamp(room.pitch-clamp(dy,-160,160)*.0027*cameraRig.sensitivity,-.95,.81);
    }else if(listening()){
      active.field.aim(clamp(dx,-240,240)*.00325*cameraRig.sensitivity,-clamp(dy,-160,160)*.00255*cameraRig.sensitivity);
    }else if(active?.take){
      const r=active.take;r.lookYaw+=clamp(dx,-240,240)*.00325*cameraRig.sensitivity;
      r.lookPitch=clamp(r.lookPitch+clamp(dy,-150,150)*.0024*cameraRig.sensitivity,-.25,.70);
    }else if(shooting())aimMeet(dx,dy);else cameraRig.orbit(dx,dy,elapsed);
  });
  function zoomWheel(e){
    if(!play||panel||e.ctrlKey)return;e.preventDefault();
    const units=e.deltaY*(e.deltaMode===1?15:e.deltaMode===2?innerHeight:1);cameraRig.changeZoom(clamp(units*.0015,-.17,.17));saveCamera();
  }
  for(const canvas of [$("world"),$("overhead")]){
    canvas.addEventListener("mouseleave",()=>{if(!pointer.locked)resetPointer();});
    canvas.addEventListener("click",()=>{captureMouse();shutter();});
    canvas.addEventListener("wheel",zoomWheel,{passive:false});
  }
  $("world").addEventListener("webglcontextlost",()=>releaseMouse());
  const handled=new Set(["KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight","Space","KeyE","KeyF","KeyG","KeyH","KeyT","KeyV","KeyX","KeyQ","KeyC","KeyM","KeyJ","KeyR","Equal","Minus","NumpadAdd","NumpadSubtract","Escape","Enter","ShiftLeft","ShiftRight"]);
  addEventListener("keydown",ev=>{
    if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
    if(!play){if(ev.code==="Enter"&&!ev.repeat){ev.preventDefault();playStart();}return;}
    if(panel){
      if(panel==="take-result"&&ev.code==="KeyT"&&!ev.repeat){ev.preventDefault();startTake();return;}
      if((ev.code==="Escape"||ev.code==="KeyM"||ev.code==="KeyJ")&&!ev.repeat){ev.preventDefault();if(ev.code==="Escape"){if(performance.now()-pointer.nativeEscape>210)closePanel();}else openPanel(ev.code==="KeyM"?"map":"jobs");return;}
      if(ev.code==="Tab"){const controls=[...$("panel").querySelectorAll("button:not(:disabled),select:not(:disabled),[tabindex='0']")];if(!controls.length)return;
        if((ev.shiftKey&&document.activeElement===controls[0])||(!ev.shiftKey&&document.activeElement===controls.at(-1))){ev.preventDefault();controls[ev.shiftKey?controls.length-1:0].focus();}}
      return;
    }
    if(!handled.has(ev.code))return;
    if((ev.code==="Enter"||ev.code==="Space")&&document.activeElement?.matches("button"))return;
    ev.preventDefault();keys.add(ev.code);if(ev.repeat)return;
    if(room){
      if(ev.code==="KeyF")useRoom();
      else if(ev.code==="KeyX"){room.yaw=0;room.pitch=-.09;}
      else if(ev.code==="KeyM")openPanel("map");
      else if(ev.code==="KeyJ")openPanel("jobs");
      else if(ev.code==="KeyR")radioToggle();
      else if(ev.code==="Escape")openPanel("pause");
      return;
    }
    if(cabs.booking?.stage==="ride"&&ev.code==="KeyF"&&!isTop()){
      const b=cabs.booking;b.window=!b.window;b.pan=.12;b.tilt=-.10;lastHud=-10;return;
    }
    if(cabWindow()&&ev.code==="KeyX"){cabs.booking.pan=.12;cabs.booking.tilt=-.10;return;}
    if(cabs.playerHeld&&["Space","KeyF","KeyH","KeyT","KeyG"].includes(ev.code))return;
    if(ev.code==="KeyF"&&!transfer&&!deckStep&&(fieldAction()||coastAction()||recoveryAction()||cabAction()))return;
    if(ev.code==="KeyG"&&!active?.take&&liftAction())return;
    if(swim&&["Space","KeyF","KeyH","KeyT","KeyG"].includes(ev.code))return;
    if(listening()&&["Space","KeyE","KeyH","KeyX","KeyT"].includes(ev.code))return;
    if(active?.take){
      if(ev.code==="KeyG"){swapTake();return;}
      if(ev.code==="KeyT"){startTake();return;}
      if(ev.code==="KeyX"){active.take.lookYaw=active.take.lookPitch=0;return;}
      if(["KeyE","KeyF","KeyH","Space"].includes(ev.code))return;
    }
    if(ev.code==="KeyE")switchCar();else if(ev.code==="KeyJ")openPanel("jobs");else if(ev.code==="KeyM")openPanel("map");else if(ev.code==="KeyR")radioToggle();else if(ev.code==="Escape")openPanel("pause");
    else if(ev.code==="KeyX"){if(shooting()){meet.lookYaw=meet.lookPitch=0;meet.aimX=meet.aimY=.5;}else cameraRig.recenter(pos().yaw,elapsed);}
    else if(ev.code==="KeyH"&&car&&!transfer&&car!==meet.jules)honk();
    else if(ev.code==="Space"&&shooting())shutter();
    else if(ev.code==="Space"&&!car&&!skiff&&!transfer&&!deckStep)motion.jump();
    else if(ev.code==="KeyT"&&!transfer&&!deckStep){if(skiff&&regattaResult&&!active)castOff(regattaResult.kind,regattaResult.c.id,true);else retryDash();}
    else if(ev.code==="KeyF"&&!transfer&&!deckStep){
      if(car)openPanel(atGuestParking()?"guest-parking":active?.story?.interaction(car)||"upgrades");
      else if(!skiff&&bay.landing(hero.x,hero.z)===BayCut.dock)talk();
      else if(skiff||bay.landing(hero.x,hero.z)){if(!active?.regatta&&!active?.ferry)openRaceSheet();}
      else talk();
    }
    else if(["Equal","NumpadAdd","Minus","NumpadSubtract"].includes(ev.code)){cameraRig.changeZoom(["Equal","NumpadAdd"].includes(ev.code)?-.12:.12);saveCamera();}
  });
  addEventListener("keyup",ev=>keys.delete(ev.code));
  addEventListener("blur",()=>{keys.clear();resetPointer();if(play&&!panel)openPanel("pause");});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){keys.clear();if(play)saveTime();if(play&&!panel)openPanel("pause");}});
  let last=performance.now(),lateSeconds=0,spareSeconds=0,lastIntroPaint=0,lastMenuPaint=0;
  function tuneStreetResolution(seconds,streetView){
    if(!streetView||seconds<=0||seconds>.16){lateSeconds=spareSeconds=0;return;}
    if(seconds>1/29){
      lateSeconds=Math.min(1,lateSeconds+seconds*(seconds>.048?1.5:1));
      spareSeconds=0;
    }else{
      lateSeconds=Math.max(0,lateSeconds-seconds*.7);
      spareSeconds=seconds<1/48?Math.min(9,spareSeconds+seconds):0;
    }
    if(lateSeconds>=.82&&view.scale>.64){
      view.scale=Math.max(.64,Math.round((view.scale-.12)*100)/100);
      lateSeconds=spareSeconds=0;
    }else if(spareSeconds>=9&&view.scale<1){
      view.scale=Math.min(1,Math.round((view.scale+.06)*100)/100);
      lateSeconds=spareSeconds=0;
    }
  }
  function tick(now){
    requestAnimationFrame(tick);
    if(document.hidden){last=now;return;}
    // Sample each display frame in play. Throttle only the title and pause screens.
    if(!play){if(now-lastIntroPaint<1000/30-.9)return;lastIntroPaint=now;}
    const raw=Math.max(0,(now-last)/1000),dt=clamp(raw,0,.10);last=now;
    if(!panel)streetTime+=dt;
    if(!play){traffic(dt);motion.step(dt,0,0);}
    if(play&&!panel){
      elapsed+=dt;hours.step(dt);if(hours.total-savedAt>=20)saveTime();
      bumpLock=Math.max(0,bumpLock-dt);
      // Small steps keep steering and collision response consistent on slower hardware.
      let left=dt;while(left>.00001&&!panel){
        const d=Math.min(left,car||skiff||active?.take?1/60:1/45);
        if(car!==wrecker&&tow.busy)tow.step(d,towClear,recoveryEvent);
        if(room){walkRoom(d);traffic(d);cabs.step(d,cabEnvironment,cabEvent);recovery.step(d,recoveryEnv,recoveryEvent);stepBeach(d);left-=d;continue;}
        if(active?.take)stepTake(d);else if(deckStep)stepLanding(d);else if(transfer)stepTransfer(d);
        else if(swim)swimStep(d);
        else if(car){if(car!==meet.jules&&!(active?.meet&&meet.phase==="countdown"))drive(d);}
        else if(!cabs.playerHeld&&!skiff&&!listening())walk(d);
        stepWater(d);traffic(d);cabs.step(d,cabEnvironment,cabEvent);recovery.step(d,recoveryEnv,recoveryEvent);pursuit(d);stepMeet(d);advanceJob(d);serviceGarage(d);stepBeach(d);left-=d;
      }
      if(!room&&!cabs.playerHeld&&!swim&&!active?.take&&!transfer&&!skiff&&!deckStep)checkTapes();const p=pos(),speed=Math.abs(active?.take?.subject().speed??skiff?.speed??car?.speed??(cabs.playerHeld?taxi.speed:0));
      if(!panel)stepField(dt);
      sound.update({speed,driving:!!active?.take||!!car||!!skiff,boating:!!skiff,swimming:!!swim,depth:swim?.depth||0,stroke:swim?.pace||0,field:fieldSignal(),heat,siren:heat?clamp(1-chase.closestUnit/103,0,1):0,time:elapsed,coast:clamp((p.x-100)/93,0,1),
        rotor:backup.air?backup.air.light*clamp(1-Math.hypot(backup.air.x-p.x,backup.air.y,backup.air.z-p.z)/110,0,1):0,
        docks:clamp(1-Math.hypot(p.x+142,p.z+76)/94,0,1),skid:car?.slip||0});
      if(elapsed-lastHud>.10){hud();lastHud=elapsed;}if(elapsed-lastMap>.09){drawMini();lastMap=elapsed;}
    }
    if(panel&&now-lastMenuPaint<300)return;lastMenuPaint=now;
    tuneStreetResolution(raw,play&&!panel&&!isTop());
    renderWorld(dt,streetTime);
  }
  // Show a first frame before the browser schedules its animation loop.
  renderWorld(1/60,0);requestAnimationFrame(tick);
})();
