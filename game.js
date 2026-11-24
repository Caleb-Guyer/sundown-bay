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
  const rideScenery=new BayRideFilm.Scenery(cityMesh.vertices);
  view.add("city",cityMesh);cityMesh.vertices.length=0;view.add("bay-water",waterMesh);waterMesh.vertices.length=0;
  const gullSite=BayGullMotors.site,palmSite=BayPalmDiner.site,brisasSite=BayBrisas.site;let gull=null,works=null;
  const boatYard=BayButtonwoodYard.site,potJob={id:"pot-run",name:"Pot Run",by:"Alda Santana"};
  const solids=city.solids, sound=window.BaySound,garage=city.garage;
  for(const prop of BayExposure.props)solids.push({...prop,bottom:0,streetProp:true});
  for(const prop of BayMercadoArt.blocks)solids.push({...prop,bottom:0,top:prop.h,streetProp:true});
  solids.push(BayMotelParking.stop,...BayCutArt.blocks,...BayCutWildlife.blocks);
  solids.push(...BayRecoveryArt.blocks,...BayCoastWheelArt.blocks,...BayBoardwalkArt.blocks);
  solids.push(...BayCourtPlaces.blocks,...BayCourtBench.blocks,...BayValetPlaces.blocks,...BaySoundShell.blocks);
  const radioSite=BayAirwavesBooth.site,radioPin={...radioSite.stand,kind:"radio-booth",name:"Sol FM · Boardwalk broadcast van"};
  solids.push(...BayButtonwoodYard.blocks,...radioSite.blocks,...BayRainWalk.blocks);
  solids.push({...BaySecondUnit.desk,w:.70,d:1.28,bottom:0,top:1.14,streetProp:true});
  solids.push(...BayBrisas.blocks,...BayPalmDiner.blocks,{x:palmSite.table.x,z:palmSite.table.z,w:1.546,d:2.816,bottom:0,top:.99,streetProp:true});
  solids.push(...BayGullMotors.blocks,...BayCoastCamera.blocks,...BayPalmaWash.blocks,...BayDrawbridgeArt.blocks);
  const signBench={x:133,z:-55.6,w:1.92,d:.72,bottom:0,top:.99,streetProp:true};
  const toolChest={x:131.54,z:-55.65,w:.62,d:.54,bottom:0,top:.69,streetProp:true};
  const roofDesk={x:126.65,z:-45,w:.64,d:1.28,bottom:12.07,top:13.12,streetProp:true};
  const roofBoxes=BayMarlinRoofArt.blocks.concat(roofDesk);
  const stairBlocks=BayMarlinRoofArt.groundBlocks.slice(1);
  solids.push(BayMarlinRoofArt.groundBlocks[0],signBench,toolChest);
  solids.push(...BayBusStopArt.blocks(BayTransit.stops));
  solids.push(...BaySkateSpots.blocks,...BayGullKey.blocks,...BayPalmClinic.blocks);
  const locations=[
    {x:151,z:-13,name:"Marlin Motel"}, {x:6,z:66,name:"Cine Luna"},
    {x:-138,z:-73,name:"Port Sol"}, {x:-66,z:-137,name:"El Mercado"},
    {x:139,z:140,name:"North Boardwalk"},garage
  ];
  const bay=BayMarina,marinaJob={id:"regatta",name:"Breakwater Run",by:"Paz Ríos",desc:"Meet Paz on the water. Pick an outboard and race between the channel marks.",pay:220};
  boatYard.dock.guest={x:boatYard.dock.x,z:boatYard.dock.z+3.18,yaw:Math.PI/2};
  bay.docks.push(boatYard.dock);
  BaySwimming.ladders.push({id:boatYard.dock.id,dock:boatYard.dock,x:boatYard.dock.x+boatYard.dock.headW*.5,z:boatYard.dock.z,y:boatYard.dock.level});
  const bridge=new BayDrawbridge.Crossing(),bridgeSite=BayDrawbridge.site;
  const bridgeJob={id:"bridge-watch",name:"The Salt Creek Watch",by:"Inez Soria"};
  BayCut.setSpanSignal(()=>bridge.phase!=="road");bay.setChannelGate((x,z)=>bridge.waterOpenAt(x,z));
  const boats=[bay.vessel("needle"),bay.vessel("mako"),bay.vessel("needle")],clubBoat=bay.vessel("rival");
  const postalSkiff=bay.vessel("mako");
  const civilianFleet=[...boats,postalSkiff,clubBoat];
  boats.forEach((v,i)=>bay.moor(v,i===2?BayCut.dock:bay.docks[0],i===1?1:-1));
  bay.moor(postalSkiff,BayGullKey.sites[0],1);boats.push(postalSkiff);
  Object.assign(clubBoat,{x:298,z:34,yaw:0});
  const cruiseMarks=[{x:298,z:126},{x:372,z:135},{x:387,z:-91},{x:307,z:-81}];
  let skiff=null,deckStep=null,cruiseLeg=0,regattaResult=null,chartMode="city",hullChoice="needle",courseChoice="jetty";
  let swim=null,surfArtReady=false,reefReady=false;
  let ferryScene=null,ferryReceipt=null,ferryMesh=null,ferryMeshMotion=null;
  const shorePins=bay.docks.map(d=>({...d,x:d.footX+1.4}));
  const cutGate={kind:"county-road",x:144,z:170,name:"Ocean Drive north · To Pelican Cut"};
  locations.push(...shorePins.filter(d=>d.id!==boatYard.dock.id),{...BayMarlinRoom.outside,kind:"room"},{...BayMercadoArt.counter,kind:"counter"},BaySurfPatrol.tower,BayCab.cinema);
  const genres=BayDriving.cars;
  const paints=["#de6f62","#42afa5","#e6b77d","#718dac","#f0d8a9","#976e9a"];
  const resprayPrice=75;
  const parts=[
    {id:"engine",name:"Engine tune",price:250,detail:"18% more engine power for quicker acceleration."},
    {id:"tires",name:"Sport tires",price:125,detail:"25% more cornering grip on pavement."},
    {id:"hydraulics",name:"Las Brisas switch kit",price:120,detail:"Four hydraulic switches fitted to this car. Use 1–4 to work the suspension."}
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
  const upperCover=(city.cameraObstacles||[]).filter(o=>BayRooftops.near(o.x,o.z)&&o.bottom>=11.8);
  const chase=new BayPursuit(axes,solids.concat(BayHarborPatrol.sightCover,upperCover)),crashContacts=new Map();
  const harbor=new BayHarborPatrol(chase);
  const backup=new BayBackup(chase,(city.cameraObstacles||[]).concat(BayCutArt.camera,BayMarlinRoofArt.camera),BayRooftops.lightFloor);
  let airBeam=null;
  const repairSeconds=2;
  let serviceVehicle=null,serviceTime=0,paintPreview=null;
  let skidLast=null,transfer=null,streetTime=2.4,hornReady=0,lastTrafficHorn=-12,speechTill=0;
  const hero={role:"player",x:151,z:-27,y:.076,yaw:-.18};
  const roofs=new BayRooftops.Traversal();
  const motion=new BayPlayerMotion(),kits=new Map();
  hero.motion=motion;
  Object.defineProperty(hero,"motion",{value:motion});
  let playerMesh=view.gl?new BayPlayerMesh(personColors[0]):null,playerModel="player";
  let dashResult=null,ghostMesh=null,maraMesh=null,lastMaraMotion=null;
  const idlePose=new BayPlayerMotion();
  if(playerMesh){kits.set("street",playerMesh);view.add("player",playerMesh,true);}
  const cam={x:153,y:3.2,z:-33,yaw:-.18,pitch:-.16};
  const cameraRig=new BayCamera(solids.concat(city.cameraObstacles||[],BayCutArt.camera,BayValetPlaces.cameraBlocks,BaySoundShell.cameraBlocks,BayPalmaWash.cameraBlocks,BayDrawbridgeArt.camera,BayMarlinRoofArt.camera,roofDesk,BayBusStopArt.cameraBlocks(BayTransit.stops),BayGullKey.cameraBlocks,BayPalmClinic.cameraBlocks,BayCoastCamera.cameraBlocks,BayGullMotors.cameraBlocks,BayPalmDiner.cameraBlocks,BayBrisas.cameraBlocks,BayButtonwoodYard.cameraBlocks));
  const driverSeat=new BayDriversView();
  const skyPainter=new BaySky($("sky"));
  const meet=new BayNightMeet.Meet(),julesMotion=new BayPlayerMotion(),julesBody={};
  let meetReceipt=null,julesMesh=null,takeArtReady=false;
  const cameraSnap=()=>cameraRig.reset(airLine.player&&!airLine.transfer?airLine.plane:motos.bike||skiff||car||cycles.riding||skate.rider||hero);
  const blankSave=()=>({wallet:0,paid:0,best:0,tuned:false,tapes:[],rides:0,juneReturned:false,dash:null,resprays:{},upgrades:Object.create(null),edition:"",regatta:{},ferryLine:"",meet:BayNightMeet.read(null),stunt:null,plates:BayPlates.read(null),fieldReels:{},shore:BaySwimming.read(null),cab:BayCab.read(null),bodywork:BayRecovery.readBody(null),recovery:BayRecovery.read(null)});
  const posterKey="sundownBay.cineLunaPoster.v1";
  function storedPoster(){
    try{const record=JSON.parse(localStorage.getItem(posterKey)||"null");return BayTakePoster.valid(record)?record:null;}
    catch{return null;}
  }
  function readSave(){
    const result=blankSave();result.stunt=storedPoster();result.bikes=BayPedal.read(null);result.boardwalk=BayBoardwalk.read(null);result.courts=BayPickup.read(null);result.valet=BayMotorCourt.read(null);
    result.band=BaySessions.read(null);result.palma=BayPalma.read(null);result.bridge=BayDrawbridge.read(null);result.neon=BayMarlinNeon.read(null);
    result.windowBest={};result.windowJobs=0;result.transit=BayTransit.read(null);result.airwaves=BayAirwaves.read(null);
    result.buttonwood=BayButtonwood.read(null);result.brisas=BayBrisasClub.read(null);result.palm=BayPalmLeague.read(null);result.gull=BayGullSales.read(null);result.moto=BaySecondSeat.read(null);result.rescue=BayRescue.read(null);result.skate=BaySkate.read(null);result.airmail=BayPelicanAir.read(null);
    try{const raw=JSON.parse(localStorage.getItem("sundownBay.v1")||"null");if(!raw||typeof raw!=="object")return result;
      for(const k of ["wallet","paid","best","rides"])if(Number.isFinite(raw[k])&&raw[k]>=0)result[k]=raw[k];
      result.windowJobs=Number.isSafeInteger(raw.windowJobs)&&raw.windowJobs>=0?raw.windowJobs:0;
      for(const b of BayWindowSeat.briefs){const score=raw.windowBest?.[b.id];if(Number.isInteger(score)&&score>0&&score<=100)result.windowBest[b.id]=score;}
      result.tuned=raw.tuned===true;result.tapes=Array.isArray(raw.tapes)?[...new Set(raw.tapes.filter(n=>Number.isInteger(n)&&n>=0&&n<5))]:[];
      result.dash=BayBeachDash.readRecord(raw.dash);
      result.regatta=bay.readRecords(raw.regatta);
      result.meet=BayNightMeet.read(raw.meet);
      result.plates=BayPlates.read(raw.plates);
      result.shore=BaySwimming.read(raw.shore);
      result.cab=BayCab.read(raw.cab);
      result.bikes=BayPedal.read(raw.bikes);result.boardwalk=BayBoardwalk.read(raw.boardwalk);
      result.courts=BayPickup.read(raw.courts);
      result.valet=BayMotorCourt.read(raw.valet);
      result.band=BaySessions.read(raw.band);
      result.palma=BayPalma.read(raw.palma);
      result.bridge=BayDrawbridge.read(raw.bridge);
      result.neon=BayMarlinNeon.read(raw.neon);
      result.transit=BayTransit.read(raw.transit);result.airwaves=BayAirwaves.read(raw.airwaves);
      result.buttonwood=BayButtonwood.read(raw.buttonwood);result.brisas=BayBrisasClub.read(raw.brisas);result.palm=BayPalmLeague.read(raw.palm);result.gull=BayGullSales.read(raw.gull);result.moto=BaySecondSeat.read(raw.moto);result.rescue=BayRescue.read(raw.rescue);result.skate=BaySkate.read(raw.skate);result.airmail=BayPelicanAir.read(raw.airmail);
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
          if(fitted?.engine===true||fitted?.tires===true||fitted?.hydraulics===true)result.upgrades[key]={engine:fitted.engine===true,tires:fitted.tires===true,hydraulics:fitted.hydraulics===true};
        }
      }
      result.juneReturned=raw.juneReturned===true&&result.tapes.includes(0);return result;
    }catch{return result;}
  }
  const save=readSave();
  const rainWalk=new BayRainWalk.Walk(),negatives=new BayWindowSeat.Negatives();
  const unit=new BaySecondUnit.Unit(),scoutDesk=BaySecondUnit.desk,otherMotion=new BayPlayerMotion();
  const unitPin={...BaySecondUnit.home.frankie,kind:"scout",name:"Cine Luna · Location desk"};
  const otherBody={...BaySecondUnit.home[unit.other],motion:otherMotion};let windowRide=null,otherCar=null,scoutSheet=0,houseCard=null,houseFrame=null;
  const broadcastDesk=new BayAirwavesStreet.Radio(save.airwaves);
  const palm=new BayPalmLeague.House(palmSite,walkers,save.palm),palmPin={...palmSite.outside,kind:"palm-diner",name:"Palm Diner · House table"};
  locations.push(palmPin);
  const studio=BayCoastCamera.site,motos=new BaySecondSeat.Fleet(studio,save.moto,new BayRideFilm.Book(save.moto.last));
  locations.push({...studio.counter,kind:"camera-shop",name:studio.name});hero.motion=motion;
  const airLine=new BayPelicanAir.Line(save.airmail);airLine.reader=new BayAirPost.TideReader();
  const airStops=BayGullKey.sites,airPins=airStops.map(s=>({...s.desk,id:s.id,name:s.name,kind:"air-dock"}));
  const airCrew=airStops.map((s,i)=>({...s.clerk,site:s,name:i?"Liv Bell":"Milo Soto",role:i?"post":"runner",motion:new BayPlayerMotion()}));
  const airRoofs=solids.concat(city.cameraObstacles||[],BayGullKey.cameraBlocks).filter(o=>o.top>2);
  locations.push(...airPins);
  const transit=new BayTransit.Line(save.transit);
  for(const p of [transit.driver,...transit.people])[p.skin,p.shirt]=personColors[p.style];
  locations.push(...BayTransit.stops);
  let transitArtReady=false;
  const skate=new BaySkate.Session(save.skate),skateTape=new BaySkateFilm.Recorder();
  const skatePins=skate.crew.map(c=>({...c.site.stand,id:c.site.id,kind:"skate-spot",name:c.site.name+" · Skate spot"}));
  locations.push(...skatePins);let skateArtReady=false,skateProof=null,skateReel=null;
  const skateKey="sundownBay.curbCut.v1";
  function loadSkateReel(){
    try{const f=JSON.parse(localStorage.getItem(skateKey)||"null");return BaySkateFilm.valid(f)?f:null;}catch{return null;}
  }
  skateReel=loadSkateReel();
  const neon=new BayMarlinNeon.Service(save.neon),neonJob={id:"marlin-neon",name:"Vacancy in Lights",by:"Vera Cordero"};
  const neonPin={...neon.bench,x:134.48,z:-55.76};
  locations.push(neonPin);
  let roofArtReady=false,roofZoom=0,guestRig=null;
  const guestMotion=new BayPlayerMotion();
  const band=new BaySessions.Band(walkers.find(p=>p.name==="June"),save.band);
  locations.push(band.site.board);
  let bandArtReady=false,kitCam=0;
  let pickup=null,courtArtReady=false;
  const courts=BayCourtPlaces.sites.map(site=>new BayPickup.Court(site,save.courts[site.id],courtEvent));
  const courtPins=courts.map(g=>({...BayCourtBench.spot(g.site),id:g.site.id,kind:"pickup-court",name:g.site.name}));
  locations.push(...courtPins);
  function wearKit(id){
    if(!view.gl)return;
    if(unit.lead==="frankie"){
      const token="frankie/"+id;
      if(!kits.has(token)){const mesh=new BayPlayerMesh(BayScoutArt.colors,"local");BayScoutArt.dress(mesh);BayCourtPlayers.kit(mesh,id);view.add(token,mesh,true);kits.set(token,mesh);}
      playerMesh=kits.get(token);playerModel=token;playerMesh.lastRevision=-1;return;
    }
    const key=id==="street"?"player":"player-kit/"+id;
    if(!kits.has(id)){
      const mesh=new BayPlayerMesh(personColors[0]);BayCourtPlayers.kit(mesh,id);view.add(key,mesh,true);kits.set(id,mesh);
    }
    playerMesh=kits.get(id);playerModel=key;playerMesh.lastRevision=-1;
  }
  wearKit(save.courts.equipped);
  const cycles=new BayPedal.Fleet(save.bikes),boardwalk=new BayBoardwalk.Service(save.boardwalk);
  const coastGate=BayCoastWheelArt.gate,ticketWindow={...BayBoardwalkArt.places.counter,kind:"wheel-window",name:"Coast Wheel ticket window"};
  const bikePin={...BayBoardwalkArt.places.marlin,kind:"bike-rack",name:"Marlin bicycle rack"};
  locations.push(ticketWindow,bikePin);
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
    flushRoadDirt();if(play&&works&&(works.dirty||works.saved.working))writeButtonwood();if(car&&(club.remember(car)||gull?.record(car)||car.stockId&&gull?.saved.loan?.kind===car.kind))persist();
  }
  addEventListener("pagehide",()=>{if(play){saveCrewPlace();saveTime();if(save.airmail.bag||save.gull.titles.length||save.gull.loan)persist();}});
  function flushRoadDirt(){
    const changed=cars.filter(v=>BayPalma.storeCar(v,save.palma));
    if(!changed.length)return;
    try{
      const key="sundownBay.v1",latest=JSON.parse(localStorage.getItem(key)||"null")||{};
      latest.palma??={};latest.palma.soil??={};
      for(const v of changed)latest.palma.soil[v.garageKey]=save.palma.soil[v.garageKey];
      localStorage.setItem(key,JSON.stringify(latest));
    }catch{}
  }
  function syncBrisas(latest){
    if(!latest?.brisas||!(latest.brisas.rev>save.brisas.rev))return;
    Object.assign(save.brisas,BayBrisasClub.read(latest.brisas));
    if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
    if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    lastHud=lastMap=-10;
  }
  function syncPalm(latest){
    if(!latest?.palm||!(latest.palm.rev>save.palm.rev))return false;
    Object.assign(save.palm,BayPalmLeague.read(latest.palm));
    if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
    if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    lastHud=lastMap=-10;return true;
  }
  function syncGarage(latest){
    if(!latest?.gull||latest.gull.rev<=save.gull.rev)return false;
    Object.assign(save.gull,BayGullSales.read(latest.gull));
    if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
    if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    lastHud=lastMap=-10;return true;
  }
  function syncWindowWork(latest){
    if(!Number.isSafeInteger(latest?.windowJobs)||latest.windowJobs<=save.windowJobs)return;
    save.windowJobs=latest.windowJobs;
    for(const b of BayWindowSeat.briefs){const score=latest.windowBest?.[b.id];if(Number.isInteger(score)&&score>0&&score<=100)save.windowBest[b.id]=Math.max(score,save.windowBest[b.id]||0);}
    if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
    if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    lastHud=lastMap=-10;
  }
  function syncProgress(latest){
    syncWindowWork(latest);syncGarage(latest);syncPalm(latest);syncBrisas(latest);syncButtonwood(latest);syncRadioBook(latest);
  }
  function persist(){
    try{syncProgress(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
    if(gull&&car)gull.remember(car);
    save.airmail.progress=airLine.receiptInProgress();
    for(const v of cars)BayPalma.storeCar(v,save.palma);
    // Keep large movie stills separate so saves from an older open tab cannot erase the poster.
    try{const {stunt,...progress}=save;localStorage.setItem("sundownBay.v1",JSON.stringify(progress));}catch{/* Session progress is still available. */}
  }
  addEventListener("storage",ev=>{
    if(ev.key===BayWindowSeat.key){negatives.refresh();lastHud=-10;}
    if(ev.key===BayRainWalk.key){rainWalk.book=BayRainWalk.read();lastHud=-10;}
    if(ev.key===BaySecondUnit.filmKey){unit.film=BaySecondUnit.loadFilm();houseFrame=null;}
    BayAirwaves.refreshPreset(ev.key);
    if(ev.key==="sundownBay.v1"){try{syncProgress(JSON.parse(ev.newValue));}catch{}return;}
    if(ev.key===BayRideFilm.key){const book=new BayRideFilm.Book(save.moto.last);motos.film.prints=book.prints;if(!motos.job&&!motos.develop)motos.film.pending=book.pending;lastHud=-10;return;}
    if(ev.key===skateKey){const f=loadSkateReel();if(f&&(!skateReel||f.score>skateReel.score))skateReel=f;return;}
    if(ev.key?.startsWith("sundownBay.fieldReel.v1.")){BayMarshLine.restore(save.fieldReels);return;}
    if(ev.key!==posterKey)return;
    const record=storedPoster();if(record&&(!save.stunt||record.distance>save.stunt.distance))save.stunt=record;
    else if(record&&save.stunt&&record.distance<save.stunt.distance)try{localStorage.setItem(posterKey,JSON.stringify(save.stunt));}catch{}
  });
  try{
    const prefs=JSON.parse(localStorage.getItem("sundownBay.camera")||"{}");
    if(Number.isFinite(prefs.zoom))cameraRig.zoom=clamp(prefs.zoom,.68,1.65);
    if([.72,1,1.38].includes(prefs.sensitivity))cameraRig.sensitivity=prefs.sensitivity;
    cameraRig.assist=prefs.assist===true;manualTop=prefs.overhead===true;driverSeat.enabled=prefs.seat===true;
    if(["auto","on","off"].includes(prefs.wipers))driverSeat.mode=prefs.wipers;
  }catch{/* The session can still use all camera controls. */}
  function saveCamera(){try{localStorage.setItem("sundownBay.camera",JSON.stringify({zoom:cameraRig.zoom,sensitivity:cameraRig.sensitivity,assist:cameraRig.assist,overhead:manualTop,seat:driverSeat.enabled,wipers:driverSeat.mode}));}catch{}}
  function model(name,build){if(rideScenery.collecting)rideScenery.remember(name,build);if(!view.gl||models.has(name))return;const g=new BayMesh();build(g);view.add(name,g);models.add(name);}
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
  const valid=(x,z,r=.42,blocks=solids)=>(x>=-184+r&&x<=210-r&&z>=-182+r&&z<=182-r||z>176&&BayCut.land(x,z,r)||x>204&&BayButtonwoodYard.onRamp(x,z,r))
    &&(z<231||bridge.roadOpenAt(x,z,r))
    &&!blocks.some(s=>Math.abs(x-s.x)<s.w/2+r&&Math.abs(z-s.z)<s.d/2+r);
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
    BayDriving.settle(v);BayPalma.fitCar(v,save.palma);v.doorSide=-1;v.doorAngle=0;cars.push(v);return v;
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
  const countyReturn=BayCut.circuit(true);
  for(const [i,kind,color,pace] of [[4,"hatch","#79918e",5.1],[8,"coupe","#b67966",6.2]]){
    const a=countyReturn[i],j=(i+1)%countyReturn.length,b=countyReturn[j];
    const v=addCar(kind,color,a.x,a.z,Math.atan2(b.x-a.x,b.z-a.z),countyReturn,pace);v.corner=j;v.speed=pace;
  }
  // The original fish-camp car keeps its garage record in its new gravel parking space.
  const campHatch=addCar("hatch","#bc875f",186,321,-1.93);
  Object.assign(campHatch,{x:185.2,z:330.1});
  const taxiStart=BayCab.stops.marlin,taxi=addCar("cab","#d5a955",taxiStart.x,taxiStart.z,taxiStart.yaw);
  taxi.serviceCar=true;
  const cabs=new BayCab.Service(taxi,save.cab);
  const recoveryYard=BayRecoveryArt.yard,ws=recoveryYard.truck;
  const wrecker=addCar("wrecker","#45847b",ws.x,ws.z,ws.yaw);
  const recovery=new BayRecovery.Service(wrecker,BayRecovery.calls.map(c=>addCar(c.kind,c.color,c.x,c.z,c.yaw)),save.recovery);
  const tow=recovery.lift,dispatchPin={...recoveryYard.della,kind:"recovery-desk",name:"Della Moss · Portside Recovery"};
  locations.push(dispatchPin);
  const clinic=BayPalmClinic.site,unit4=addCar("ambulance","#e9e1cd",clinic.bay.x,clinic.bay.z,clinic.bay.yaw);
  unit4.serviceCar=true;const rescue=new BayRescue.Service(unit4,clinic,save.rescue);
  locations.push({...clinic.desk,kind:"clinic",name:clinic.name+" · Rescue 4"});
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
  const boulevardTraffic=[["estate","#82978b",3,2,1,1,true,1,.49],["stepside","#a96550",2,2,2,2,false,0,.32],
    ["estate","#a37f56",1,0,1,3,false,3,.63],["stepside","#7a9d99",0,1,2,2,true,2,.42]];
  for(const [kind,color,ix,iz,w,d,rev,j,f] of boulevardTraffic){
    const path=laneLoop(ix,iz,w,d,rev),k=(j+1)%4,a=path[j],b=path[k];
    const v=addCar(kind,color,a.x+(b.x-a.x)*f,a.z+(b.z-a.z)*f,Math.atan2(b.x-a.x,b.z-a.z),path,kind==="estate"?6.3:5.9);
    v.corner=k;v.speed=v.pace;
  }
  const owners=new BayRoadOwners(cars),valet=new BayMotorCourt.Service(addCar,save.valet);
  const wash=new BayPalma.Wash(addCar,save.palma),washJob={id:"palma",name:"Palma Hand Wash",by:"Elia Mena"};
  const washPin={...wash.site.till,id:"palma",kind:"car-wash",name:"Palma Hand Wash"};
  locations.push(washPin);
  const gullStock=Object.fromEntries(BayGullSales.kinds.map(k=>{const p=gullSite.display[k];return [k,addCar(k,BayGullSales.specs[k].color,p.x,p.z,p.yaw)];}));
  gull=new BayGullSales.Lot(gullSite,gullStock,save.gull);if(!personalCar)restoreParking();
  const plum=addCar("solena","#805980",brisasSite.pad.x,brisasSite.pad.z,brisasSite.pad.yaw);
  const gold=addCar("solena","#c59c5b",brisasSite.second.x,brisasSite.second.z,brisasSite.second.yaw);
  plum.plate="PLUM 64";gold.plate="BRISA 64";gold.brisasLead=gold.serviceCar=true;
  const club=new BayBrisasClub.Club(brisasSite,plum,gold,BayBrisas.cast(),save.brisas);
  const workTruck=addCar("stepside","#97a998",boatYard.truck.x,boatYard.truck.z,boatYard.truck.yaw);
  workTruck.plate="PIP 16";const pip=bay.vessel("pip");
  works=new BayButtonwood.Works(boatYard,workTruck,pip,save.buttonwood);BayButtonwoodStreet.crew(works);
  const scoutCar=addCar("hatch","#bd8a50",5.14,38.65,0);
  if(!personalCar)restoreParking();
  locations.push(unitPin);
  locations.push(brisasSite.marker,boatYard.marker,boatYard.slipMarker,radioPin,{...BayDriving.world(BayRainWalk.racks[0],0,1.05),name:"Marlin · Umbrella stand",kind:"shelter"});
  const gullPin={...gullSite.desk,kind:"motor-sales",name:gullSite.name};locations.push(gullPin);
  const streetMotorists=[...owners.people,...valet.guests,valet.staff],keyMapActor={motion};
  let motorArtReady=false;
  locations.push(BayValetPlaces.desk);
  for(const b of cycles.bikes)if(save.bikes[b.id]&&!cycleClear(b.x,b.z,b))Object.assign(b,BayBoardwalkArt.places[b.id],{name:b.name});
  // The retired $250 tune covered every car in this fleet. Carry that purchase into each car's record once.
  if(save.tuned){
    for(const v of cars){v.upgrades.engine=true;save.upgrades[v.garageKey]=v.upgrades;}
    save.tuned=false;persist();
  }
  const pos=()=>(windowRide?.held&&windowRide.seat===1?windowRide.vehicle:null)||(motos.player?.stage==="ride"?motos.bike:null)||(airLine.player&&!airLine.transfer?airLine.plane:null)||active?.take?.subject()||(transit.player?.stage==="ride"?transit.bus:null)||(cabs.booking?.stage==="ride"?taxi:null)||skiff||car||(!cycles.transfer&&cycles.riding)||skate.rider||hero;
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
  const district=(p)=>BayGullKey.siteAt(p.x,p.z)?.name??(BayCut.area(p)?(p.x>BayCut.coast(p.z)+2?"Pelican Sound":"Pelican Cut"):p.x>335?"Outer Sound":p.x>216?"Breakwater Bay":p.x>158?"Sol Beach":p.x>112?"Ocean Drive":p.x< -102&&p.z<10?"Port Sol":p.z< -92?"El Mercado":p.z>96&&p.x>43?"Boardwalk":p.x< -65?"Old Palms":"Neon Mile");
  const formatVehicle=v=>genres[v.kind].name;
  function footLevel(x,z){
    const yard=BayButtonwoodYard.surface(x,z);if(yard!=null)return yard;
    const lot=BayBrisas.floor(x,z);if(lot!=null)return lot;
    const lunch=BayPalmDiner.floor(x,z);if(lunch!=null)return lunch;
    const floor=BayGullMotors.floor(x,z);if(floor!=null)return floor;
    const counter=BayCoastCamera.floor(x,z);if(counter!=null)return counter;
    const receiving=BayPalmClinic.floor(x,z);if(receiving!=null)return receiving;
    const postal=BayGullKey.floor(x,z);if(postal!=null)return postal;
    const slab=BaySkateSpots.floor(x,z,true);if(slab!==null)return slab;
    if(x>139&&x<162&&z>281&&z<312){const dock=BayDrawbridge.landingLevel(x,z);if(dock!=null)return dock;}
    if(x>153&&x<175&&z>-102&&z<-83){const pad=BayPalmaWash.floorLevel(x,z);if(pad!=null)return pad;}
    if(x>178&&x<194&&z>75&&z<91){const floor=BaySoundShell.floor(x,z);if(floor!=null)return floor;}
    if((x>172&&x<192&&z>-69&&z<-43)||(x>-64&&x<-42&&z>-107&&z<-89)){
      const level=BayCourtPlaces.floor(x,z)??BayCourtBench.floor(x,z);if(level!=null)return level;
    }
    if(x>171&&x<183&&z>109&&z<115){const y=BayCoastWheelArt.floor(x,z);if(y!=null)return y;}
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
  function resetFeet(){swim=null;roofs.reset();motion.reset();hero.y=footLevel(hero.x,hero.z);}
  function note(head,line,seconds=3.2){
    $("toast").children[0].textContent=head;$("toast").children[1].textContent=line;$("toast").hidden=false;toastTill=elapsed+seconds;
  }
  function playStart(){
    if(play)return;play=true;gull.restore(cars,gullEnv);restoreBrisasCar();restoreButtonwood();$("intro").hidden=true;$("hud").hidden=false;document.activeElement?.blur();cameraSnap();
    if(save.airmail.bag){startMailJob();Object.assign(hero,(save.airmail.island?airStops[1]:airStops[0]).desk);resetFeet();cameraSnap();}
    else if(save.airmail.island){Object.assign(hero,airStops[1].desk);resetFeet();cameraSnap();}
    if(save.buttonwood.working&&!active){active={buttonwood:true,job:potJob};resumeButtonwood();cameraSnap();}
    if(unit.met)restoreCrew();
    if(save.shore.carried&&!active)waypoint={...BaySurfPatrol.tower};
    try{if(localStorage.getItem("sundownBay.audio")==="on"){radio=sound.setEnabled(true);$("audioKey").querySelector("span").textContent=radio?"Sound on":"Sound off";}}catch{}
    if(active?.airmail){note("Mail in hand",airLine.leaflet()[0]+" · "+airLine.mailTo.name,4);return;}
    if(save.airmail.island){note("Gull Key","Liv is at the post office. Fern 3 calls at the south float.",3.5);return;}
    if(active?.buttonwood){note("Alda’s tide book",BayButtonwood.sheets[save.buttonwood.sheet].name+" · Your next stop is marked.",4);return;}
    if(unit.met){note(BaySecondUnit.names[unit.lead],district(pos())+" · Y switch characters"+(unit.lead==="frankie"?" · P location camera":""),3.8);return;}
    note("Marlin Motel","Room 14 is yours. "+(personalCar?"Your "+formatVehicle(personalCar)+" is marked on the map.":cars[0].color===paints[0]?"Keys are in the coral coupe.":"Your "+formatVehicle(cars[0])+" is out front."),4.3);
  }
  const freeFeet=()=>play&&!windowRide?.held&&!palm.match&&!palm.playerSeat&&!gull?.exchange&&!motos.player&&!motos.job?.swapping&&!rescue.holding&&!airLine.aboard&&!room&&!transit.aboard&&!cabs.playerHeld&&!cycles.riding&&!skate.rider&&!boardwalk.player&&!pickup&&!band.take&&!car&&!skiff&&!swim&&!transfer&&!deckStep;
  const onStreetFeet=()=>freeFeet()&&!broadcastDesk.mix&&!roofs.raised&&motion.jumpTime<0;
  function unitRoadCar(v){
    return !!v?.garageKey&&v!==wrecker&&v!==workTruck&&v!==unit4&&v!==taxi&&!v.serviceCar&&!v.meetCar&&!v.guestId&&!v.washGuest&&!v.onLift&&!v.recoveryOwner&&(!v.stockId||!!gull.record(v))&&works.trailer.hitched!==v;
  }
  function crewFree(){
    return play&&!active&&!heat&&!room&&!transfer&&!deckStep&&!cabs.booking&&!transit.engaged&&!watchCrew.towing&&!rainWalk.trip&&!valet.onDuty&&!serviceVehicle&&!neon.testing&&!wash.hasWand()&&!gull.engaged&&!save.airmail.bag&&(car?unitRoadCar(car):onStreetFeet());
  }
  function saveCrewPlace(){
    if(unit.met&&crewFree()){unit.remember(car||hero,car);unit.save();}
  }
  function unitFeet(p,id){
    for(const radius of [0,1.4,2.7,4])for(let i=0;i<(radius?8:1);i++){
      const x=p.x+Math.sin(i*Math.PI/4)*radius,z=p.z+Math.cos(i*Math.PI/4)*radius;
      if(valid(x,z,.38)&&!cars.some(v=>dist(v,{x,z})<1.45))return {x,z,y:footLevel(x,z),yaw:p.yaw};
    }
    const h=BaySecondUnit.home[id];return {...h,y:footLevel(h.x,h.z)};
  }
  function restoreCrew(){
    const parked=new Map();
    for(const p of Object.values(unit.motors)){
      const v=cars.find(v=>v.garageKey===p.ride);
      if(!unitRoadCar(v))continue;
      for(const offset of [0,3,-3,6,-6]){
        const x=p.x+Math.sin(p.yaw)*offset,z=p.z+Math.cos(p.yaw)*offset;
        if(!fitsCar(v,x,z,p.yaw)||cars.some(o=>o!==v&&Math.abs(o.x-x)<7&&Math.abs(o.z-z)<7&&BayDriving.contact({...v,x,z,yaw:p.yaw},o)))continue;
        BayDriving.settle(v);Object.assign(v,{x,z,yaw:p.yaw,path:null,used:true,flatSide:p.flat,flatAxle:p.flat?p.axle:null,flatLoad:p.flat?1:0});
        parked.set(p.ride,v);break;
      }
    }
    otherCar=parked.get(unit.places[unit.other].ride)||null;
    const off=otherCar||unitFeet(unit.places[unit.other],unit.other);
    Object.assign(otherBody,{x:off.x,z:off.z,y:footLevel(off.x,off.z),yaw:off.yaw});
    if(active||save.airmail.island)return;
    car=parked.get(unit.places[unit.lead].ride)||null;Object.assign(hero,unitFeet(unit.places[unit.lead],unit.lead));resetFeet();
    if(car)BayCarAccess.pose(car,-1,1,hero,motion,footLevel,0);
    wearKit(save.courts.equipped);cameraSnap();
  }
  const crewDeskNear=()=>onStreetFeet()&&dist(hero,scoutDesk)<2.65&&dist(hero,scoutDesk)<dist(hero,BayCab.cinema);
  const crewPhoneNear=()=>onStreetFeet()&&dist(hero,BaySecondUnit.phone)<3.15;
  function beginCrewSwitch(){
    if(!crewFree()||unit.transition){note("Second Unit","Finish this outing before switching drivers.",2.8);return;}
    if(!unit.met&&!crewDeskNear()&&!crewPhoneNear())return;
    if(panel)closePanel();unit.met=true;unit.eye=null;rainWalk.open=false;keys.clear();resetPointer();saveCrewPlace();
    unit.transition={braking:true};lastHud=-10;
  }
  function crewFlight(t){
    const start=pos(),end=otherCar||otherBody;
    Object.assign(t,{a:{x:start.x,z:start.z},b:{x:end.x,z:end.z,yaw:end.yaw},eye:{...cam},age:0,braking:false});
  }
  function exchangeLeads(){
    const out=car||hero,wasCar=car,incoming=otherCar,dest={...otherBody};
    unit.remember(out,car);unit.lead=unit.other;
    Object.assign(otherBody,{x:out.x,z:out.z,y:footLevel(out.x,out.z),yaw:out.yaw});otherCar=wasCar;
    otherMotion.reset();otherMotion.ride=null;car=incoming;Object.assign(hero,{x:dest.x,z:dest.z,yaw:dest.yaw});
    resetFeet();motion.ride=null;
    if(car)BayCarAccess.pose(car,-1,1,hero,motion,footLevel,0);
    wearKit(save.courts.equipped);skidLast=null;driverSeat.center();driverSeat.mirrorAt=-Infinity;
    unit.remember(car||hero,car);unit.save();cameraSnap();lastHud=lastMap=-10;
  }
  function crewAerial(){
    const tr=unit.transition,q=BaySecondUnit.travel(tr),e=tr.eye,b=tr.b;
    const ground=footLevel(b.x,b.z),d=car||otherCar?6.5:4.8;
    const targetX=b.x-Math.sin(b.yaw)*d,targetZ=b.z-Math.cos(b.yaw)*d;
    const f=q.s;
    Object.assign(cam,{x:e.x+(targetX-e.x)*f,y:e.y+(ground+2.6-e.y)*f+q.high,z:e.z+(targetZ-e.z)*f,
      yaw:e.yaw+angle(e.yaw,b.yaw)*f,pitch:e.pitch+(-.24-e.pitch)*f-1.17*Math.sin(Math.PI*q.u),focal:(e.focal||1.4)*(1-f)+1.4*f});
  }
  function scoutLook(dx,dy){const l=unit.eye;if(l?.window){if(dx||dy){l.adjusted=true;l.pan=clamp(l.pan+dx,-3.09,3.09);l.pitch=clamp(l.pitch+dy,-.85,1.22);l.reach=clamp(l.reach+dy*19,5,62);}return;}if(l){l.yaw+=clamp(dx,-.7,.7);l.pitch=clamp(l.pitch+clamp(dy,-.5,.5),-1.12,.92);hero.yaw=l.yaw;}}
  function crewStep(dt){
    if(windowRide){
      const r=windowRide;if(!r.held&&(heat||dist(hero,r.pickup.stand)>54)){endWindowRide();return;}
      otherBody.raised=0;
      if(unit.eye?.window){
        const l=unit.eye,dx=Number(held("ArrowRight","KeyC"))-Number(held("ArrowLeft","KeyQ"))+pointer.edgeX*.72;
        scoutLook(dx*dt*1.5,(Number(held("ArrowUp"))-Number(held("ArrowDown")))*dt*.95);l.yaw=r.vehicle.yaw+l.pan;l.flash=Math.max(0,l.flash-dt*4.5);
      }return;
    }
    if(otherCar)BayCarAccess.pose(otherCar,-1,1,otherBody,otherMotion,footLevel,dt);
    else{
      otherBody.y=footLevel(otherBody.x,otherBody.z);otherMotion.step(dt,0,0);
      if(dist(hero,otherBody)<5&&dist(hero,otherBody)>.65)otherBody.yaw+=angle(otherBody.yaw,Math.atan2(hero.x-otherBody.x,hero.z-otherBody.z))*(-Math.expm1(-1.4*dt));
    }
    otherBody.raised=unit.other==="frankie"&&!otherCar?clamp((Math.sin(streetTime*.62)-.52)*5,0,1):0;
    const tr=unit.transition;
    if(tr){
      if(!crewFree()){unit.transition=null;cameraSnap();return;}
      if(tr.braking){if(car&&Math.abs(car.speed)>.27)return;if(car)BayDriving.settle(car);crewFlight(tr);}
      tr.age+=dt;
      if(tr.age>=.825&&!tr.swapped){tr.swapped=true;exchangeLeads();}
      if(tr.age>=1.65){unit.transition=null;cameraSnap();note(BaySecondUnit.names[unit.lead],district(pos())+(unit.lead==="frankie"?" · P raises your camera":" · Y calls Frankie"),3.8);}
    }else if(unit.eye){
      if(!crewFree()){unit.eye=null;cameraSnap();return;}
      const dx=Number(held("ArrowRight","KeyC"))-Number(held("ArrowLeft","KeyQ"))+pointer.edgeX*.75;
      scoutLook(dx*dt*1.55,(Number(held("ArrowUp"))-Number(held("ArrowDown")))*dt*1.12);
      motion.step(dt,0,0);unit.eye.flash=Math.max(0,unit.eye.flash-dt*4.5);
    }else if(unit.met){unit.nextSave-=dt;if(unit.nextSave<=0){unit.nextSave=3;saveCrewPlace();}}
  }
  function crewKeys(code){
    if(windowRide)return windowInput(code);
    if(unit.transition)return code!=="Escape"&&code!=="KeyR";
    if(unit.eye){
      if(code==="KeyP"||code==="Escape"||code==="KeyJ"){unit.eye=null;cameraSnap();resetPointer();if(code==="KeyJ")openPanel("unit-roll");}
      else if(code==="Space")unit.eye.fire=true;
      else if(code==="KeyZ"||code==="KeyV")unit.eye.zoom=unit.eye.zoom>=3?1:Math.min(3,Math.round(unit.eye.zoom)+1);
      return code!=="KeyR";
    }
    if(code==="KeyY"&&(unit.met||crewPhoneNear()||crewDeskNear())){
      if(!crewFree()){note("Second Unit","Call back when you’re free and clear.",2.6);return true;}
      if(unit.met)beginCrewSwitch();else openPanel("unit-sheet");return true;
    }
    if(code==="KeyF"&&crewDeskNear()&&crewFree()){openPanel("unit-sheet");return true;}
    if(code==="KeyP"&&unit.lead==="frankie"&&onStreetFeet()&&crewFree()){
      const sign=BayNightMeet.marquee,angleToSign=Math.atan2(sign.x-hero.x,sign.z-hero.z);
      unit.eye={yaw:dist(hero,scoutDesk)<4?angleToSign:cam.yaw,pitch:dist(hero,scoutDesk)<4?.17:0,zoom:1,fire:false,flash:0};
      rainWalk.open=false;motion.vx=motion.vz=0;resetPointer();lastHud=-10;return true;
    }
    return false;
  }
  function crewHint(){
    if(windowRide)return windowHint();
    if(unit.transition){contextHint("Y",unit.transition.braking?"Pulling over":"Second Unit · "+BaySecondUnit.names[unit.transition.swapped?unit.lead:unit.other]);return true;}
    if(unit.eye){contextHint("Space","Shutter · Arrows aim · Z zoom · P lower");return true;}
    if(!crewFree())return false;
    if(crewDeskNear()){contextHint("F","Frankie’s location desk · "+(unit.met?"Select a print":"Meet the scout"));return true;}
    if(!unit.met&&crewPhoneNear()){contextHint("Y","Pick up Frankie’s call · F Bay Cab");return true;}
    return false;
  }
  const crewBodies=new Map();
  function drawCrew(list,see,t){
    if(see(scoutDesk,90))BayScoutArt.worldDesk(list,model,scoutDesk,t);
    if(!see(otherBody,68))return;
    const id=unit.other,frank=id==="frankie",key="second-unit/"+id;
    let mesh=crewBodies.get(id);
    if(!mesh){mesh=new BayPlayerMesh(frank?BayScoutArt.colors:personColors[0],frank?"local":"driver");if(frank)BayScoutArt.dress(mesh);view.add(key,mesh,true);crewBodies.set(id,mesh);}
    let changed=mesh.update(otherMotion);
    const raised=otherBody.raised||0;
    if(frank)changed=BayScoutArt.cameraPose(mesh,otherBody,t,raised)||changed;
    if(changed)view.updateAnimated(key);
    if(otherCar&&(!windowRide||windowRide.driverSeat===1))drawInSeat(list,key,otherCar,-1);
    else{list.push([key,otherBody.x,otherBody.y,otherBody.z,otherBody.yaw]);if(frank)BayScoutArt.cameraProp(list,model,otherBody,mesh,t,raised);}
  }
  function scoutMapView(state,w,h){
    const l=unit.eye,reach=l.window?l.reach:(12+l.pitch*10)/l.zoom;state.cx=hero.x+Math.sin(l.yaw)*reach;state.cz=hero.z+Math.cos(l.yaw)*reach;
    state.rotation=state.cameraYaw=l.yaw;state.scale=h*l.zoom/(l.window?46:35);
    state.target=null;state.waypoint=null;state.jobPins=[];state.ghost=null;
  }
  function scoutMapProject(s,w,h){
    const c=Math.cos(s.rotation),n=Math.sin(s.rotation);
    return (x,y,z)=>{const dx=(x-s.cx)*s.scale,dy=(s.cz-z)*s.scale;return {x:.5+(c*dx+n*dy)/w,y:.5+(-n*dx+c*dy)/h};};
  }
  function scoutSight(eye,subject){
    const dx=subject.x-eye.x,dz=subject.z-eye.z,dy=subject.y-eye.y,reach=Math.hypot(dx,dz);
    for(const o of solids){
      if(o.x+o.w/2<Math.min(eye.x,subject.x)||o.x-o.w/2>Math.max(eye.x,subject.x)||o.z+o.d/2<Math.min(eye.z,subject.z)||o.z-o.d/2>Math.max(eye.z,subject.z))continue;
      let a=0,b=1-1.4/Math.max(1.5,reach);
      for(const [p,d,m,r] of [[eye.x,dx,o.x,o.w/2],[eye.z,dz,o.z,o.d/2],[eye.y,dy,((o.top??12)+(o.bottom||0))/2,((o.top??12)-(o.bottom||0))/2]]){
        if(Math.abs(d)<.0001){if(Math.abs(p-m)>r){b=-1;break;}}else{const lo=(m-r-p)/d,hi=(m+r-p)/d;a=Math.max(a,Math.min(lo,hi));b=Math.min(b,Math.max(lo,hi));}
      }
      if(a<=b)return false;
    }
    return true;
  }
  function scoutSubjects(){
    if(unit.eye?.window){const b=windowRide.brief;return [{...windowSubject(b),id:b.id,title:b.subject,range:b.range,ideal:b.ideal}];}
    const list=[],add=(id,p,up,range,ideal)=>list.push({id,x:p.x,z:p.z,y:footLevel(p.x,p.z)+up,range,ideal});
    add("marquee",BayNightMeet.marquee,BayNightMeet.marquee.y,60,14);add("partner",otherBody,otherCar?1.2:1.35,34,5);
    add("six",transit.bus,1.7,54,15);
    if(bridge.lift>.15)add("span",BayDrawbridge.center,4+7*bridge.lift,100,35);
    for(const w of walkers)if(w.canopy>.5&&dist(w,hero)<30)add("rain",w,1.66,30,8);
    return list;
  }
  function scoutDevelop(source,sky,project){
    const l=unit.eye,gate=BayMeetPhoto.crop(source.width,source.height,.5,.5,1.5,true);
    if(l.fire||l.check==null||elapsed-l.check>.13){
      l.check=elapsed;l.subject=BaySecondUnit.grade(scoutSubjects(),project,gate,l.window?windowEye():{x:hero.x,y:hero.y+1.61,z:hero.z},isTop()?()=>true:scoutSight);
    }
    if(l.fire){l.fire=false;
      const districtName=district(hero),photo=BayMeetPhoto.capture(source,sky,.5,.5,1.5,true);
      const r=unit.expose(photo,{title:l.subject?.title||districtName+" street study",score:l.subject?.score||0,by:BaySecondUnit.names[unit.lead],district:districtName,minute:Math.floor(hours.minute),day:hours.day+1});
      if(r&&l.window&&l.subject&&windowRide.phase==="ride"&&!windowRide.early&&Math.abs(windowRide.vehicle.speed)>1.5&&r.score>(windowRide.best?.score||0))windowRide.best=r;
      if(r){scoutSheet=r.number;l.flash=1;l.last="Filed #"+r.number+" · "+r.title+(unit.filmStored?"":" · this session");}else l.last="Frame missed · try the shutter again";
    }
    const canvas=$("scoutFinder"),w=Math.min(1100,innerWidth),h=Math.max(1,Math.round(w*innerHeight/innerWidth));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    BayScoutPrints.frame(canvas.getContext("2d"),w,h,{title:l.last||(l.window?windowRide.brief.title:"Prado · Second Unit"),subject:l.subject?.title||"Street study",zoom:l.zoom,framed:!!l.subject,flash:l.flash,aspect:1.5,windowPan:l.window&&!isTop()?l.pan:null,time:streetTime});
  }
  function scoutHouseCard(){
    const r=unit.film.pinned;if(!r)return null;
    if(houseFrame!==r){
      houseFrame=r;houseCard=null;const im=new Image();im.onload=()=>{if(houseFrame!==r)return;
        const paper=document.createElement("canvas");paper.width=256;paper.height=256;
        const c=paper.getContext("2d");c.drawImage(im,0,0,256,256);houseCard=paper;};im.src=r.image;
    }
    return houseCard;
  }
  function windowCurb(p){return BayCab.streetStop(p,chase.road(p));}
  function windowLayby(p){
    const s=windowCurb(p),v=windowRide?.vehicle;
    if(!s||!v||!fitsCar(v,s.x,s.z,s.yaw))return null;
    const probe={kind:v.kind,x:s.x,z:s.z,yaw:s.yaw};
    return cars.some(o=>o!==v&&dist(o,s)<6.6)||dist(transit.bus,s)<8||!doorPlan(probe,true,hero,1)?null:s;
  }
  function crewCarForCall(){
    const v=otherCar||cars.find(c=>c.garageKey===unit.motors[unit.other]?.ride)||(unit.other==="frankie"?scoutCar:cars[0]);
    if(!unitRoadCar(v)||v===car||v.path||v.owner?.phase==="in"||!BayCab.stopped(v)||!windowCurb(v))return null;
    return v;
  }
  function crewParkingRoom(v,x,z,yaw,people=true){
    if(!fitsCar(v,x,z,yaw))return false;
    const at={kind:v.kind,x,z,yaw};
    if(cars.some(o=>o!==v&&Math.abs(o.x-x)<6.5&&Math.abs(o.z-z)<6.5&&BayDriving.contact(at,o)))return false;
    if(dist(at,transit.bus)<9&&BayDriving.contact(at,transit.bus))return false;
    if(people&&walkers.some(p=>!p.palmPassenger&&Math.abs(p.x-x)<4&&Math.abs(p.z-z)<4&&BayDriving.clearance(at,p)<.33))return false;
    return true;
  }
  function crewRoadClear(v,yaw,leg,remaining){
    const normal=cabClearance(v,yaw,leg,remaining);
    if(remaining>12||normal.gap>remaining||leg.stopAt)return normal;
    // At parking speed use the actual curved path. A car beyond the bay can still be in the driver's forward sightline.
    const count=Math.max(1,Math.ceil(remaining/.55));
    for(let i=1;i<=count;i++){
      const ahead=remaining*i/count,p=leg.route.sample(leg.at+ahead),off=leg.offset*Math.max(0,1-ahead/3);
      const x=p.x+Math.cos(p.yaw)*off,z=p.z-Math.sin(p.yaw)*off;
      if(!crewParkingRoom(v,x,z,p.yaw))return {gap:Math.max(0,ahead-1.05),pass:false};
    }
    return {gap:Infinity,pass:false};
  }
  function settleAtCurb(r){
    const v=r.vehicle,l=r.leg,remaining=(l.stopAt??l.route.length)-l.at;
    if(remaining>12||l.block<2.8||v.speed>.45||Math.cos(v.yaw-l.end.yaw)<.68)return false;
    const stop=l.end,side=(v.x-stop.x)*Math.cos(stop.yaw)-(v.z-stop.z)*Math.sin(stop.yaw);
    if(Math.abs(side)>3.4||!crewParkingRoom(v,v.x,v.z,v.yaw,false)||!doorPlan(v,true,hero,1))return false;
    BayDriving.settle(v);r.location={...stop,x:v.x,z:v.z,yaw:v.yaw};r.leg=null;return true;
  }
  function windowBoard(body){
    if(!unit.met)return;
    const p=windowCurb(hero),v=crewCarForCall(),driver=BaySecondUnit.names[unit.other];
    if(!crewFree()||!onStreetFeet()||!p||!v){
      signedNote(body,!p?"Call me from a sidewalk on the city grid. I need a curb where I can pull in.":!v?"Leave my car on a city street when you switch back. I’ll bring it around.":"Call from the sidewalk when you're free.","Second Unit");return;
    }
    signedNote(body,negatives.reel?"Your three negatives are in the projector. Cue the short at the case in the Cine Luna lobby.":"Bring me one moving frame from each corner. I’ve saved you a slot before the main feature.","Cine Luna projection booth");
    for(const b of BayWindowSeat.briefs){
      const best=Math.max(save.windowBest[b.id]||0,negatives.frames[b.id]?.score||0),card=document.createElement("canvas");card.className="window-slip";
      BayWindowSlip.paint(card,b,{driver,best,completed:best>0});
      const row=makeButton(b.title,"Plus a framing bonus", "Call "+(unit.other==="frankie"?"Frankie":"your driver"),()=>startWindowRide(b));
      row.classList.add?.("window-order");row.prepend(card);body.append(row);
    }
  }
  function startWindowRide(brief){
    const v=crewCarForCall(),curb=windowCurb(hero);
    if(!unit.met||!v||!curb||!crewFree()||!onStreetFeet()||unit.transition)return;
    let path=[];
    if(v!==otherCar){
      const door=doorPlan(v,false,otherBody,-1);
      if(door)path=door.points;
      else{
        const outer=BayCarAccess.outside(bayCarLayout(v.kind),-1),at=BayDriving.world(v,outer.x,outer.z);
        path=motorWalkway(otherBody,at,v);
        if(!path||!doorPlan(v,true,otherBody,-1)){signedNote($("panelBody"),"I can’t reach my door from here. Move my car somewhere clear on my next shift.",BaySecondUnit.names[unit.other]);return;}
      }
    }
    const waitingHere=v===otherCar&&dist(hero,v)<8.5&&doorPlan(v,false,hero,1);
    const from=waitingHere?{...curb,x:v.x,z:v.z,yaw:v.yaw,stand:{x:hero.x,z:hero.z}}:cabBerth(curb,null,v);
    const start=windowCurb(v);saveCrewPlace();
    windowRide=new BayWindowSeat.Run(v,brief,from,start,path,v===otherCar);
    windowRide.berth=(stop,approaching)=>cabBerth(stop,approaching,v);
    active={job:{id:"window-seat",name:"Window Seat",by:"Cine Luna"},windowRide:true};
    unit.eye=null;rainWalk.open=false;keys.clear();closePanel();lastHud=lastMap=-10;
    speak(BaySecondUnit.names[unit.other],"Stay by the curb. I'll come in the "+formatVehicle(v)+". You get the window.");
  }
  function windowTarget(){return windowRide?.target||null;}
  function windowSubject(b){
    return isTop()&&b.id==="wheel"?{...b.point,...BayCoastWheelArt.mapPoint(b.point)}:b.point;
  }
  function aimPassenger(){
    const r=windowRide,l=unit.eye,p=windowSubject(r.brief),at=windowEye();
    l.pan=clamp(angle(r.vehicle.yaw,Math.atan2(p.x-at.x,p.z-at.z)),-2.9,2.9);
    l.pitch=clamp(Math.atan2(p.y-at.y,dist(at,p)),-.75,1.18);l.reach=clamp(dist(at,p),6,54);l.yaw=r.vehicle.yaw+l.pan;
  }
  function windowEye(){
    const v=windowRide.vehicle,s=bayCarLayout(v.kind),q=BayDriving.world(v,s.track+.10,s.seatZ+.09);
    return {...q,y:footLevel(q.x,q.z)+s.seatY+.72};
  }
  function raiseWindowFinder(){
    const r=windowRide;unit.eye={window:true,yaw:r.vehicle.yaw+1.28,pan:1.28,pitch:.10,reach:24,zoom:1,flash:0,fire:false};
    if(dist(r.vehicle,r.brief.point)<r.brief.range+15)aimPassenger();
    resetPointer();lastHud=-10;
  }
  function windowRideEvent(event){
    const r=windowRide,v=r.vehicle,driver=BaySecondUnit.names[unit.other];
    if(event==="driver-in"){otherCar=v;v.used=true;unit.remember(v,v,unit.other);unit.save();}
    if(event==="ready"){note(driver,"I’m here. Walk up and press E for the passenger seat.",3.4);}
    if(event==="boarded"){raiseWindowFinder();speak(driver,"Camera’s by the seat. The house wants "+r.brief.subject+" from the road.");}
    if(event==="road"&&!r.cued)speak(driver,r.brief.line);
    if(event==="mark"){speak(driver,r.brief.call);if(unit.eye&&!unit.eye.adjusted)aimPassenger();}
    if(event==="stopped"){unit.eye=null;resetPointer();cameraSnap();note(r.brief.title,r.early?"Pulling over.":(r.best?"Got the frame. ":"Want another pass? ")+"G goes around again. E steps out.",4);}
    if(event==="done")endWindowRide(true);
    lastHud=lastMap=-10;
  }
  function endWindowRide(finished=false){
    const r=windowRide;if(!r)return;
    const v=r.vehicle;BayDriving.settle(v);v.doorAngle=v.passengerDoor=0;
    if(r.driverSeat===1){otherCar=v;unit.remember(v,v,unit.other);}
    else{otherCar=null;otherMotion.reset();otherMotion.ride=null;
      if(r.driverSeat>0)Object.assign(otherBody,unitFeet(BayDriving.world(v,-bayCarLayout(v.kind).track-.66,0),unit.other));
      unit.remember(otherBody,null,unit.other);}
    if(r.held&&r.seat>.01)Object.assign(hero,unitFeet(BayDriving.world(v,bayCarLayout(v.kind).track+.85,0),unit.lead));
    windowRide=null;unit.eye=null;active=null;resetFeet();motion.ride=null;keys.clear();resetPointer();cameraSnap();
    unit.remember(hero,null);unit.save();
    if(finished&&r.best){
      try{syncProgress(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
      const premiered=!negatives.reel;negatives.keep(r.brief,r.best);
      const pay=r.brief.pay+Math.round(r.best.score*.6);save.windowBest[r.brief.id]=Math.max(save.windowBest[r.brief.id]||0,r.best.score);
      save.wallet+=pay;save.paid++;save.windowJobs++;persist();sound.cue("paid");note(r.brief.title,"Print #"+r.best.number+" · "+r.best.score+"/100 · "+cash(pay)+(premiered&&negatives.reel?" · Your three-frame short is on the Cine Luna bill":" from Cine Luna")+(negatives.stored?"":" · Negative held for this session"),5);
    }else if(finished)note("Window Seat","The car is here whenever you want another run.",3);
    lastHud=lastMap=-10;
  }
  function windowInput(code){
    const r=windowRide;
    if(code==="KeyE"){
      if(r.phase==="ready"){
        if(r.board(hero,doorPlan(r.vehicle,false,hero,1))){keys.clear();lastHud=-10;}
        else note("Window Seat","Walk up to the passenger door.",2.3);
      }else if(r.phase==="park"){if(doorPlan(r.vehicle,true,hero,1))r.pullOver(windowCurb);else note("Passenger door","The curb is blocked. G takes another pass.",3);}
      else if(r.phase==="ride"&&r.pullOver(windowLayby))speak(BaySecondUnit.names[unit.other],"Sure. I’ll find a curb.");
      return true;
    }
    if(code==="KeyG"&&r.phase==="park"){r.early=false;r.roll();raiseWindowFinder();lastHud=-10;return true;}
    if(code==="KeyP"&&(r.phase==="ride"||r.phase==="park")){if(unit.eye){unit.eye=null;resetPointer();cameraSnap();}else raiseWindowFinder();return true;}
    if(unit.eye){
      if(code==="KeyF"){aimPassenger();return true;}
      if(code==="Space"){unit.eye.fire=true;return true;}
      if(code==="KeyZ"||code==="KeyV"){unit.eye.zoom=unit.eye.zoom>=3?1:Math.min(3,Math.round(unit.eye.zoom)+1);return true;}
      if(code==="Escape"){unit.eye=null;cameraSnap();return true;}
    }
    if(["KeyM","Escape","KeyJ","KeyR","BracketLeft","BracketRight"].includes(code))return false;
    if(!r.held&&["KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","ShiftLeft","ShiftRight","KeyC","KeyQ"].includes(code))return false;
    return true;
  }
  function windowHint(){
    const r=windowRide,driver=BaySecondUnit.names[unit.other];
    if(r.phase==="ready")contextHint("E","Ride with "+driver+" · Passenger door");
    else if(r.phase==="ride")contextHint(unit.eye?"Space":"P",unit.eye?"Shutter · F sight subject · Arrows aim · Z zoom · P lower":"Raise camera · E ask to pull over");
    else if(r.phase==="park")contextHint("E","Step out"+(r.best?" and collect the fee":"")+" · G another pass");
    else if(r.held)contextHint("",r.phase==="out"?"Stepping out":"Getting into the passenger seat");
    else contextHint("J",driver+" is "+(r.phase==="collect"?"on the way · "+Math.round(dist(r.vehicle,r.pickup))+" m":"getting the car"));
    return true;
  }
  function scoutPanel(body,sheet){
    if(sheet){
      const other=BaySecondUnit.names[unit.other];
      if(crewFree()&&(unit.met||crewDeskNear()||crewPhoneNear()))body.append(makeButton(unit.met?"Switch to "+other:"Take Frankie’s call",unit.met?"Pick up where they are in "+district(otherCar||otherBody)+".":"“The Rialto people want postcards. I want the town we actually live in. Come find me outside Cine Luna.”","Switch",beginCrewSwitch));
      if(unit.met)body.append(makeButton("Window Seat","Call your partner to drive a moving location shoot for Cine Luna.","See assignments",()=>openPanel("window-orders")),makeButton("Find "+other,district(otherCar||otherBody),"Set waypoint",()=>clockPin({...otherBody,kind:"scout",name:other})),
        makeButton("Location prints","Your six latest frames. Cine Luna keeps a separate copy of the house selection.","Open roll",()=>openPanel("unit-roll")));
      signedNote(body,"Watch for Marta’s six, rain on a borrowed umbrella, the span going up, the marquee, or the other driver. Take the frame while it’s there. P unpacks the camera on foot. Space trips the shutter.","Frankie Prado");return;
    }
    const frames=unit.film.frames;
    if(!frames.length){signedNote(body,"Nothing developed yet. Take my camera for a walk.","Frankie");return;}
    const i=Math.max(0,frames.findIndex(r=>r.number===(scoutSheet||frames.at(-1).number))),r=frames[i];
    const paper=document.createElement("canvas");paper.className="scout-card";BayScoutPrints.print(paper,r);body.append(paper);
    if(frames.length>1)body.append(makeButton("Previous print","Frame "+(i+1)+" of "+frames.length,"Turn back",()=>{scoutSheet=frames[(i-1+frames.length)%frames.length].number;openPanel("unit-roll",true);}),
      makeButton("Next print","The six most recent exposures stay on the roll.","Turn over",()=>{scoutSheet=frames[(i+1)%frames.length].number;openPanel("unit-roll",true);}));
    if(crewDeskNear())body.append(makeButton(unit.film.pinned?.number===r.number?"On the Cine Luna bill":"Put this print on the bill","Show this frame at the location desk and on the cinema screen before the feature.","Mount print",()=>{
      if(crewDeskNear()&&unit.mount(r.number)){houseFrame=null;note("Cine Luna",r.title+" · House selection"+(unit.filmStored?"":" · this session"),3);openPanel("unit-roll",true);}
    }));
    else body.append(makeButton("Cine Luna location desk","Bring the print to the folding desk outside Cine Luna.","Set waypoint",()=>clockPin(unitPin)));
  }
  function canCarryUmbrella(){return !unit.eye&&!unit.transition&&freeFeet()&&!broadcastDesk.mix&&!roofs.raised&&!active&&!heat&&!transit.flag&&!cabs.booking&&!watchCrew.towing&&!exchangingKey()&&!save.airmail.bag;}
  function umbrellaKey(code){
    if((code!=="KeyU"&&code!=="KeyG")||!canCarryUmbrella())return false;
    if(code==="KeyG"){
      if(rainWalk.trip)return true;
      const line=rainWalk.offer(hero,transit,footLevel);if(!line)return false;
      if($("toast").children[0].textContent==="Marlin loan stand")$("toast").hidden=true;
      speak(rainWalk.trip.p.name,line);lastHud=-10;return true;
    }
    if(!rainWalk.trip&&BayRainWalk.nearRack(hero)){openPanel("umbrella");return true;}
    if(!rainWalk.book.borrowed)return false;
    rainWalk.open=!rainWalk.open;lastHud=-10;return true;
  }
  function umbrellaPanel(body){
    const rack=BayRainWalk.nearRack(hero);if(!rack)return;
    const book=rainWalk.book;
    const take=style=>{rainWalk.borrow(rack,style);closePanel();note("Marlin loan stand","U folds the umbrella. Offer to walk with a Route 6 rider using G.",4);};
    body.append(makeButton("Marlin stripe","Canvas loan umbrella. Leave it at any Route 6 shelter.","Take",()=>take(0)));
    if(Object.keys(book.notes).length)body.append(makeButton("Guava print","A second canopy from the riders’ collection.","Take",()=>take(1)));
    if(book.borrowed)body.append(makeButton("Hang yours up","Return the borrowed umbrella to this stand.","Return",()=>{rainWalk.returnLoan();closePanel();}));
    if(!Object.keys(book.notes).length)signedNote(body,"Taking the blue tickets to the six from Room 14. If you’re walking my way, leave a little room on your right.","Alba Font");
    for(const [id,score] of Object.entries(book.notes))signedNote(body,BayRainWalk.trips[id].signed,BayRainWalk.trips[id].name+" · "+score+"% under cover");
  }
  function umbrellaHint(){
    if(!canCarryUmbrella())return false;
    const t=rainWalk.trip;
    if(t){contextHint("G","Hold to walk beside "+t.p.name.split(" ")[0]+" · "+t.place+" · U fold");return true;}
    const person=rainWalk.nearby(hero,transit),rack=BayRainWalk.nearRack(hero);
    if(person){contextHint("G","Share your umbrella with "+person.name+(rack?" · U loan stand":""));return true;}
    if(rack){contextHint("U","Umbrella loan stand · "+rack.name);return true;}
    return false;
  }
  function stepUmbrella(dt){
    const end=rainWalk.step(dt,hero,canCarryUmbrella(),hours.rain);motion.canopy=rainWalk.amount;
    if(end){speak(end.p.name,end.line);if(end.score)note("Signed loan card",end.score+"% under cover · Guava print at the loan stand",3.5);lastHud=-10;}
  }
  function skateStand(){
    if(heat||cabs.booking||watchCrew.towing||active&&!active.skate)return null;
    if(onStreetFeet()||skate.rider&&!skate.rider.flying&&skate.rider.speed<1.6)return skate.nearStand(hero);
    return null;
  }
  const skateCarried=()=>!rainWalk.open&&rainWalk.amount<.02&&!save.airmail.bag&&!!save.skate.deck&&freeFeet()&&!roofs.action&&!wash.work&&!exchangingKey()&&!listening()&&!active?.field;
  function skateTarget(){
    const w=skate.run,s=w.site,finish=w.phase==="roll"||w.phase==="tail";
    return {...(finish?s.finish:s.start),kind:"skate-spot",name:finish?"White finish stripe":"Chalk start · "+s.name};
  }
  function skateReelButton(){
    return makeButton("Curb Cut · Your best line",BaySkateFilm.title(skateReel.site)+"  /  "+skateReel.score+" points","Watch dub",()=>openPanel("skate-reel"));
  }
  function skateHud(){
    const r=skate.rider,w=skate.run,ph=w?.phase;
    const card=$("skateTicket"),meter=$("skateBalance");card.hidden=false;$("objective").hidden=true;
    $("skateHeading").textContent=w?"Curb Cut":r.style==="market"?"Mercado deck":"Seafern deck";
    $("skateState").textContent=ph==="roll"?"● REC  "+w.score:ph==="tail"?"ROLL OUT":w?w.site.name:"Free skate";
    card.classList.toggle("recording",ph==="roll");$("mode").textContent=r?"Skateboard":"Carrying deck";
    $("speed").textContent="";meter.hidden=!(r?.manualM||r?.grind);
    if(!meter.hidden)meter.style.setProperty("--balance",clamp(((r.balance||0)+1)*50,1,99)+"%");
    let label="",hint="",line="";
    if(ph==="mark"){line="Walk or roll to the chalk cross";label="F";hint="Set your front wheels on the mark";}
    else if(ph==="set"){line="Setting the board";hint="Face down the rail";}
    else if(ph==="ready"){line=w.call?w.call.name+"  /  +$40":"Camera standing by";label="W";hint="Push to start  ·  V filmer’s view";}
    else if(ph==="miss"){line="Cut  /  "+w.why;label="T";hint="Retake from the chalk cross  ·  J leave job";}
    else if(ph==="review"){line=w.score+" pts  /  "+cash(w.pay)+(w.bonus?"  ·  Shot list +$40":w.print?"  ·  Cine Luna print":"");label="T";hint="Skate back for a retake  ·  J watch your dub  ·  K carry";}
    else if(ph==="tail"){line="Hold that ending";hint="Keep rolling";}
    else if(ph==="roll"){
      const q=BaySkateSpots.local(w.site,r.x,r.z);
      line=skate.show?skate.message:r.grind?"50–50  /  "+r.grind.m.toFixed(1)+" m":r.flying?"In the air":q.v<w.site.rail.v0-3.2?"Hold Space · crouch":q.v<w.site.rail.v0?"Release Space at the chalk marks":q.v<18?"Ride straight into the bank":"Roll through the white stripe";
      label=r.flying?"G":"Space";hint=r.flying?"Kickflip  ·  Level the deck before landing":"Hold and release to ollie  ·  Shift manual  ·  V camera";
    }else{
      line=skate.show?skate.message:r.grind?"Grinding  /  "+r.grind.m.toFixed(1)+" m":r.manualM?"Manual  /  "+r.manualM.toFixed(1)+" m":r.stow?"Picking up deck":"Push with W  ·  Carve with A / D";
      const c=skateStand();label=c?"F":"Space";hint=c?"Talk to "+c.filmer.name:"Hold and release to ollie  ·  G flip in air  ·  Shift manual  ·  K carry";
    }
    $("skateTrick").textContent=line;$("skateCall").textContent=ph==="roll"?Math.min(2,w.kinds.size)+" of 2 trick types  /  "+(w.hit?"Got the requested shot":w.lens?"Filmer’s view":"Chase camera"):r?.chain?r.chain+" point line":"";
    contextHint(label,hint);
  }
  function skateJob(c){
    active={skate:true,job:{id:"curb-cut",name:"Curb Cut",by:c.filmer.name}};
    waypoint=null;lastHud=lastMap=-10;
  }
  function skateEvent(kind,value){
    if(kind==="save"){persist();return;}
    if(kind==="action"){skateTape.start(value.site.id);$("speech").hidden=true;sound.cue("skate-slate");}
    else if(kind==="cut"){skateTape.stop();lastHud=-10;}
    else if(kind==="wrap"){
      const w=value,score=w.score,stored=loadSkateReel();
      if(stored&&(!skateReel||stored.score>skateReel.score))skateReel=stored;
      w.print=false;
      if(score>(skateReel?.score||0)){
        const reel=skateTape.finish(score);
        if(reel){skateReel=reel;w.print=true;try{localStorage.setItem(skateKey,JSON.stringify(reel));}catch{}}
      }else skateTape.stop();
      const pay=65+Math.min(135,Math.round(score*.36))+w.bonus;w.pay=pay;
      save.wallet+=pay;save.paid++;active=null;persist();lastHud=lastMap=-10;
      note("Curb Cut  ·  "+score+" pts",cash(pay)+(w.print?"  ·  New print for Cine Luna":"  ·  Line signed"),4.2);
      const c=skate.crew.find(c=>c.site===w.site);
      speak(c.filmer.name,w.print?"Keep that one. I’ll drop the print at Luna. Your copy’s on your phone.":"Got it all the way to the stripe. Same mark if you want another.");sound.cue("paid");
    }else if(kind==="off"){motion.reset();hero.y=footLevel(hero.x,hero.z);if(!active?.skate)skate.run=null;cameraSnap();lastHud=-10;}
    else if(kind==="pop"||kind==="bail"||kind==="land"||kind==="lock")sound.cue("skate-"+kind);
  }
  function skateKeys(code){
    const r=skate.rider,w=skate.run;
    if(code==="KeyF"&&active?.skate&&w?.phase==="mark"&&skate.mark(hero)){
      motion.reset();cameraRig.recenter(w.site.yaw,elapsed);lastHud=-10;return true;
    }
    if(code==="KeyF"&&skateStand()&&(!active||w?.phase==="miss")){openPanel("skate-spot");return true;}
    if(code==="KeyT"&&w&&["miss","review"].includes(w.phase)&&(!active||active.skate)&&dist(hero,w.site)<50&&(r||onStreetFeet())){
      skate.retake();skateTape.stop();skateJob(skate.crew.find(c=>c.site===w.site));return true;
    }
    if(code==="KeyK"&&!r&&onStreetFeet()&&save.skate.deck&&(!active||active.skate)&&!transit.engaged&&!cabs.booking&&!watchCrew.towing){
      if(skate.mount(hero)){motion.reset();cameraSnap();lastHud=-10;}return true;
    }
    if(!r)return false;
    if(code==="KeyE"||code==="KeyK"){r.stow=true;r.charging=false;r.charge=0;}
    if(code==="Space")skate.charge();
    if(code==="KeyG")skate.flick();
    if(code==="KeyV"&&w&&["ready","roll"].includes(w.phase)){w.lens=!w.lens;if(!w.lens)cameraRig.reset(r);}
    if(code==="KeyX")cameraRig.recenter(r.yaw,elapsed);
    return !["KeyJ","KeyM","Escape","KeyR","Equal","NumpadAdd","Minus","NumpadSubtract"].includes(code);
  }
  function stepSkate(dt){
    const r=skate.rider;
    skate.step(dt,{push:!!r&&held("KeyW","ArrowUp"),brake:!!r&&held("KeyS","ArrowDown"),
      turn:r?Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft")):0,manual:!!r&&held("ShiftLeft","ShiftRight")},skateEnv);
    if(!active?.skate&&skate.run?.phase==="review"&&dist(hero,skate.run.site)>49)skate.run=null;
  }
  const airCollision=BayAirPost.obstacles(airRoofs);
  const airCockpit=()=>!!airLine.player&&!airLine.transfer&&airLine.inside;
  const airFree=()=>onStreetFeet()&&!heat&&!cabs.booking&&!watchCrew.towing&&!transit.engaged&&(!active||active.airmail);
  const airDesk=()=>airFree()?airLine.nearDesk(hero):null;
  const airGate=()=>airFree()?airStops.find(s=>dist(hero,s.exit)<3.25):null;
  const printAvailable=()=>Object.keys(save.airmail.logs).length>0;
  const clerk=s=>airCrew.find(a=>a.site===s);
  function airTarget(){
    if(airLine.aboard){
      const s=airLine.phase==="dock"&&airLine.mailTo===airLine.dock?airLine.dock:airLine.target;
      return {...s.berth,kind:"air-dock",name:s.name};
    }
    if(airLine.reserved){const s=BayPelicanAir.site(airLine.reserved.id);return {...s.exit,kind:"air-dock",name:"Fern 3 · "+s.name};}
    if(airLine.mailTo)return airPins[airStops.indexOf(airLine.mailTo)];
    return null;
  }
  function startMailJob(){
    active={airmail:true,job:{id:"pelican-post",name:"Gull Key Post",by:"Pelican Air"}};waypoint=null;
  }
  function airEvent(kind,v){
    const line=airLine,s=line.dock;
    if(kind==="bag"){
      startMailJob();save.airmail.island=v.id==="key";persist();
      speak(clerk(v).name,v.id==="marlin"?"Liv signs at the hatch. Nani’s on the north side of our float. The skiff’s on the other.":"Milo signs for this one back at the beach desk.");
      note(line.leaflet()[0],"Addressed to "+clerk(line.mailTo).name+" · "+line.mailTo.name,4);
    }else if(kind==="signed"){
      const {from,slip}=v,dest=BayPelicanAir.site(BayPelicanAir.other(from));
      if(active?.airmail)active=null;line.reserved=null;waypoint=null;save.airmail.island=dest.id==="key";
      save.wallet+=slip.pay;save.paid++;persist();sound.cue("paid");
      speak(clerk(dest).name,BayPelicanAir.letters[from][slip.number][2]);note("Signed by "+clerk(dest).name,cash(slip.pay)+(slip.grade?" · Landing "+slip.grade+"/100":"")+" · Receipt on your phone",4.4);
    }else if(kind==="seated"){
      cameraRig.reset(line.plane);speak("Nani Flores",line.manual?"Ease the throttle up. Pull back when the floats are running clean.":"Got your belt? We’ll go up Ocean Drive on our way across.");
    }else if(kind==="lift"){if(line.manual)note("Fern 3","Clear of the water · Release Space to level off.",2.7);}
    else if(kind==="touch"){sound.cue("splash");if(line.manual)note("On the floats","Landing "+v+"/100 · Hold S to slow, then taxi to the dock.",3.1);}
    else if(kind==="arrived"){save.airmail.island=v.id==="key";persist();note(v.name,"Lines secured · Press E to step onto the float.",3.1);}
    else if(kind==="left"||kind==="rescued"){
      Object.assign(hero,v.exit);resetFeet();cameraSnap();save.airmail.island=v.id==="key";persist();
      if(kind==="rescued")note("Back at "+v.name,"Nani called the dock launch."+(save.airmail.bag?" The mail is with you.":""),3.5);
      else if(line.mailTo===s)speak("Nani Flores",s.id==="key"?"Up the little ramp. Liv’s waiting at the window.":"Milo’s at the green dispatch shed.");
    }else if(kind==="rescue")note("Fern 3","Nani has the dock launch on the radio.",2);
    lastHud=lastMap=-10;
  }
  const airEnv={hero,time:0,dt:1/60,water:BayAirPost.water,obstacle:airCollision,event:airEvent,
    boardPose:(line,a)=>BayAirPost.crossFloat(line,a,hero,airEnv.dt),seatedPose:line=>BayAirPost.seatActor(line,hero,airEnv.dt)};
  const airInput={power:0,turn:0,lift:0};
  function stepAir(dt){
    const line=airLine;
    if(line.reserved&&!line.aboard){
      const s=BayPelicanAir.site(line.reserved.id);
      if((active&&!active.airmail||car||skiff||cycles.riding||room||Math.min(dist(hero,s.desk),dist(hero,s.exit))>38)&&!line.pending)line.reserved=null;
    }
    airInput.power=Number(held("KeyW"))-Number(held("KeyS"));
    airInput.turn=Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    airInput.lift=Number(held("Space","ArrowUp"))-Number(held("ShiftLeft","ShiftRight","ArrowDown"));
    const reader=line.reader;
    const giveWay=line.aboard||line.reserved?.id===line.at||!room&&dist(pos(),line.dock.exit)<21;
    const faster=line.reserved&&!line.listen(BayPelicanAir.site(line.reserved.id))&&!line.aboard&&!line.pending?4:1;
    let remaining=dt*faster;
    while(remaining>.000001){const part=Math.min(remaining,1/60);airEnv.dt=part;airEnv.time=streetTime;reader.step(line,part,giveWay);line.step(part,airInput,airEnv);remaining-=part;}
    if(!line.aboard&&!line.pending&&save.airmail.island&&hero.x<211&&!swim){save.airmail.island=false;persist();}
    if(line.player&&!line.manual&&line.plane.airborne&&line.journey&&line.plane.airTime>5){
      const f=line.plane,j=line.journey;
      if(!j.beach&&f.x<200&&f.z>35){j.beach=true;speak("Nani Flores","That wheel by the sand? My brother used to stop it at the top so he could see our dock.");}
      else if(!j.office&&line.to==="key"&&line.phase==="final"){j.office=true;speak("Nani Flores","See the red roof south of the light? That’s Liv’s place. We tie up on the water side.");}
    }
    if(save.airmail.bag&&!line.aboard)line.trace(pos(),skiff?"skiff":"shore");
  }
  function reserveAir(s,role){
    if(!airFree())return;
    airLine.flag(s,role);waypoint=null;closePanel();note("Nani Flores",airLine.listen(s)?"Fern 3 is at the float. Press E at the striped step.":"I’ll hold the plane for you. Wait down at the striped step.",3.5);
  }
  function airKeys(code){
    const l=airLine;
    if(l.pending&&["KeyE","KeyF","Space","KeyK"].includes(code))return true;
    if(!l.aboard){
      if(code!=="KeyE"&&code!=="KeyF")return false;
      const desk=airDesk();
      if(code==="KeyF"&&airFree()&&!desk&&l.reader.stage!=="ride"&&dist(hero,l.reader)<1.8){speak(l.reader.name,l.reader.id==="key"?"I mark the waterline at that east beach. Lower each time I look today.":"That narrow book’s the waterline on Gull Key. Got readings all the way back to my dad.");return true;}
      if(code==="KeyF"&&desk){openPanel("air-desk");return true;}
      const gate=airGate(),boat=boardable();
      if(gate&&(!boat||dist(hero,gate.exit)<=dist(hero,gate.skiffFoot))&&(code==="KeyE"||code==="KeyF")){
        if(code==="KeyF"){openPanel("air-gate");return true;}
        if(!l.listen(gate)){if(l.reserved){l.reserved=null;lastHud=-10;note("Pelican Air","Seat released.",2);}else reserveAir(gate,"pilot");return true;}
        if(l.board(hero,l.reserved?.role||"pilot")){motion.reset();keys.clear();lastHud=-10;}return true;
      }
      if(code==="KeyF"&&onStreetFeet()&&BayGullKey.siteAt(hero.x,hero.z)){note("Pelican Air","The dispatch window and striped boarding step are marked on the dock.",2.7);return true;}
      return false;
    }
    if(["KeyJ","KeyM","Escape","KeyR","Equal","NumpadAdd","Minus","NumpadSubtract"].includes(code))return false;
    if(l.transfer)return true;
    if(code==="KeyG"&&l.controls()){speak("Nani Flores",l.manual?"You have control.":"I have control. I’ll bring us in.");lastHud=-10;}
    else if(code==="KeyV"||code==="KeyZ"){l.inside=!l.inside;l.pan=l.tilt=0;if(!l.inside)cameraRig.reset(l.plane);lastHud=-10;}
    else if(code==="KeyX"){l.pan=l.tilt=0;cameraRig.recenter(l.plane.yaw,elapsed);}
    else if(code==="KeyE"){if(l.alight()){l.inside=false;cameraRig.reset(l.plane);keys.clear();}else note("Fern 3","Tie up at a dock to step off · G gives Nani control.",2.5);}
    else if(code==="KeyF"&&(l.manual||l.phase==="dock")){
      if(l.phase==="dock"){l.depart();return true;}
      const s=l.berthNear();if(s)l.tie(s);else note("Fern 3","Slow below 6 knots beside the striped boarding step.",2.4);
    }
    return true;
  }
  let airArtReady=false;
  function drawAir(list,see,t){
    if(!airArtReady){BayGullKey.install(model);BayFloatplaneArt.install(model);BayAirmailArt.install(model);airArtReady=true;}
    BayAirPost.world(list,airLine,airCrew,see,t,hours,model,view,airCockpit());
    if(save.airmail.bag&&skiff&&!deckStep){const q=chassisPoint(skiff,.48,.44,-.94,skiff.y);BayAirmailArt.bag(list,q,skiff.yaw+.28,t,BayAirPost.tagFor(save.airmail.bag));}
  }
  const rescueEnv={
    hero,motion,ground:footLevel,driving:()=>car===unit4,transition:()=>transfer?.v===unit4,
    street:v=>BayCab.streetStop(v,chase.road(v)),
    axis:axis=>axis==="w"?Number(held("KeyW","ArrowUp"))-Number(held("KeyS","ArrowDown")):Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft")),
    obstacle(v,p,yaw){
      const probe={kind:v.kind,x:p.x,z:p.z,yaw};
      return boatTrailerBlocks(probe,v)||cars.some(c=>c!==v&&Math.abs(c.x-p.x)<7&&Math.abs(c.z-p.z)<7&&BayDriving.contact(probe,c))||
        Math.abs(p.x-transit.bus.x)<9&&Math.abs(p.z-transit.bus.z)<9&&!!BayDriving.contact(probe,transit.bus);
    },
    carClear(v,p){return fitsCar(v,p.x,p.z,p.yaw)&&!this.obstacle(v,p,p.yaw)&&
      (transfer?.v===v||car||room||roofs.raised||Math.abs(p.x-hero.x)>5||Math.abs(p.z-hero.z)>5||BayDriving.clearance(p,hero)>.29);},
    cotClear(x,z,v){return valid(x,z,.23)&&BayDriving.clearance(v,{x,z})>.15&&
      !cars.some(c=>c!==v&&Math.abs(c.x-x)<4.7&&Math.abs(c.z-z)<4.7&&BayDriving.clearance(c,{x,z})<.24);},
    say:(speaker,line)=>speak(speaker,line),
    paid(c,pay,grade){
      active=null;waypoint=null;save.wallet+=pay;save.paid++;persist();lastHud=lastMap=-10;sound.cue("paid");
      speak(c.name,c.thanks);note("Palm County Clinic",cash(pay)+" · Ride comfort "+grade+"/100 · Handoff signed",5);
    }
  };
  const motoEnv={
    hero,site:studio,floor:footLevel,say:speak,save:persist,
    change(){lastHud=lastMap=-10;},
    message(text){note("Coast Camera",text,3.3);},
    input(aim){
      return {gas:!aim&&held("KeyW","ArrowUp"),brake:!aim&&held("KeyS","ArrowDown"),
        rear:aim||held("Space"),steer:aim?0:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"))};
    },
    grip(b){return (b.z>181?BayCut.surface(b.x,b.z):b.x>166.45?.56:nearStreet(b.x,b.z)?1:.83)*(1-.17*hours.wet);},
    road(b){const q=chase.road(b),curb=BayCab.streetStop(b,q);return curb&&{...curb,x:q.vertical?q.x+(curb.dir===0?2.48:-2.48):b.x,z:q.vertical?b.z:q.z+(curb.dir===1?-2.48:2.48)};},
    foot(x,z,except){return valid(x,z,.28)&&!cars.concat(motos.all,transit.bus).some(v=>v!==except&&Math.abs(x-v.x)<6&&Math.abs(z-v.z)<6&&BayDriving.clearance(v,{x,z})<.25);},
    walkway(a,q,b){
      const nearby=cars.concat(motos.all,transit.bus).filter(v=>v!==b&&Math.abs(v.speed)<.9&&v.x>=Math.min(a.x,q.x)-4&&v.x<=Math.max(a.x,q.x)+4&&v.z>=Math.min(a.z,q.z)-4&&v.z<=Math.max(a.z,q.z)+4);
      return recoveryWalkway(a,q,b,dist(q,studio.counter)<25?studio.staffWalk:[],nearby)||motorWalkway(a,q,b);
    },
    signal(b,yaw){
      const x=Math.sin(yaw),z=Math.cos(yaw),vertical=Math.abs(z)>.7;let speed=Infinity;
      if(Math.min(Math.abs(x),Math.abs(z))>.32)return speed;
      for(const s of BayStreetArt.signals){
        const dx=s.x-b.x,dz=s.z-b.z,d=dx*x+dz*z;
        if(d>4.9&&d<19&&Math.abs(dx*z-dz*x)<3.6&&vertical!==((streetTime+s.offset)%14<7))speed=Math.min(speed,Math.max(0,(d-6.3)*1.22));
      }
      return speed;
    },
    ahead(b,probe,yaw){
      const rightX=Math.cos(yaw),rightZ=-Math.sin(yaw);
      if(works&&dist(b,works.trailer)<27){
        for(const p of [works.trailer,BaySlipTrailer.coupler(works.trailer),...works.trailer.sweep()]){
          const along=(p.x-b.x)*-rightZ+(p.z-b.z)*rightX,side=(p.x-probe.x)*rightX+(p.z-probe.z)*rightZ;
          if(along>-.65&&along<13&&Math.abs(side)<2.9)return side<-.12?2.85:-2.85;
        }
      }
      for(const v of cars.concat(transit.bus,motos.all)){if(b===v||dist(v,b)>15)continue;
        const along=(v.x-b.x)*-rightZ+(v.z-b.z)*rightX,side=(v.x-probe.x)*rightX+(v.z-probe.z)*rightZ;
        if(along>-.4&&along<11&&Math.abs(side)<2.25)return side<-.12?2.23:-2.23;
      }return 0;
    },
    obstacle(b,q){
      if(boatTrailerBlocks(q,b))return "trailer";
      if(!fitsCar(b,q.x,q.z,q.yaw)||BaySwimming.water(q.x,q.z)&&!(q.z>181&&BayCut.land(q.x,q.z,.35)))return "curb";
      for(const v of cars.concat(motos.all,transit.bus,patrol)){
        if(v===b||Math.abs(q.x-v.x)>7||Math.abs(q.z-v.z)>7)continue;
        const hit=BayDriving.contact(q,v);if(!hit)continue;
        const before=BayDriving.contact(b,v);if(!before||hit.depth>before.depth+.00001)return v;
      }
      const closer=a=>Math.abs(a.x-q.x)<2.1&&Math.abs(a.z-q.z)<2.1&&BayDriving.clearance(q,a)<.22&&BayDriving.clearance(q,a)<BayDriving.clearance(b,a)-.00001;
      if(!motos.player&&closer(hero)||walkers.some(p=>!p.palmPassenger&&closer(p)))return "pedestrian";
      return null;
    },
    bump(b,other,pace){
      if(b!==motos.bike)return;
      sound.cue("hit");if(other&&typeof other==="object"){other.wait=.85;reportCrash(other,pace,pace);}
      else if(pace>9)note(b.name,"Hard stop",1.7);
    },
    pay(p){
      try{const shared=JSON.parse(localStorage.getItem("sundownBay.v1")||"null");
        if(shared?.moto?.last===p.token&&save.moto.last!==p.token){Object.assign(save.moto,BaySecondSeat.read(shared.moto));save.wallet=shared.wallet;save.paid=shared.paid;}
      }catch{}
      if(save.moto.last!==p.token){
        const pay=BaySecondSeat.find(p.id).pay+Math.round(p.score*.55);save.wallet+=pay;save.paid++;
        save.moto.count[p.id]++;save.moto.best[p.id]=Math.max(save.moto.best[p.id],p.score);save.moto.last=p.token;
        persist();sound.cue("paid");note("Print developed",cash(pay)+" · "+p.title+" · "+p.score+"/100",5);
      }
      motos.film.file();if(active?.moto)active=null;waypoint=null;
      speak("Inés Vidal","Look in the window on your way out. Your copy’s on the phone.");
    }
  };
  function stepMotorcycles(dt){
    if(!motos.ready){
      motos.ready=true;
      for(const b of motos.bikes)if(!fitsCar(b,b.x,b.z,b.yaw)||motoEnv.obstacle(b,b)==="curb"||cars.some(v=>BayDriving.contact(v,b)))Object.assign(b,studio.stalls[b.kind]);
    }
    motos.kit=save.courts.equipped;
    for(const b of motos.all)b.lights=hours.night>.14;
    if(motos.bike)for(const v of crashContacts.keys())if(dist(v,motos.bike)>7)crashContacts.delete(v);
    motos.step(dt,motoEnv);
  }
  function motoContact(){
    if(!onStreetFeet()||motos.job?.swapping||heat||active&&!active.moto||transit.engaged||watchCrew.towing||cabs.booking)return "";
    const counter=dist(hero,studio.counter),prints=dist(hero,studio.prints);
    if(prints<2.25&&prints+.15<counter)return "moto-prints";
    if(counter<2.65)return "moto-shop";
    if(!motos.remySeat&&dist(hero,motos.remy)<2.1)return "motorcyclist";
    return "";
  }
  function motoAtBike(){
    if(!onStreetFeet()||active&&!active.moto||motos.job?.stage==="lab"||cabs.booking||transit.engaged)return null;
    const b=motos.nearest(hero),car=enterable();return b&&dist(b,hero)<3&&(!car||dist(b,hero)<dist(car,hero))?b:null;
  }
  function motoInstruction(){
    const j=motos.job;if(!j)return "";
    if(j.swapping)return "Trade places with Inés";
    if(j.stage==="meet")return j.assembling?"Meet Inés beside the "+j.b.name:"Take the "+(j.role==="pilot"?"handlebars":"back seat")+" of the "+j.b.name;
    if(j.stage==="lab")return motos.develop?"Inés is developing the print":"Bring the exposed roll to the counter";
    if(j.stage==="return")return "Return to the striped window at Coast Camera";
    return motos.nearPhoto()?"Frame "+j.brief.credit:(j.role==="pilot"?"Ride to ":"Ride with Inés to ")+j.brief.place;
  }
  function motoKeys(code){
    if(motos.player||motos.job?.swapping){
      if(code==="KeyG"){motos.shift(motoEnv);return true;}
      if(code==="KeyE"){if(!motos.dismount(motoEnv)&&motos.player?.stage==="ride")note(motos.bike.name,"Brake to step off",2);return true;}
      if(code==="KeyF"){
        if(!motos.parkHome(motoEnv)&&motos.job)motos.lens(motoEnv);
        else if(!motos.job&&motos.bike)note(motos.bike.name,"Borrowed from Coast Camera & Cycle",2);
        return true;
      }
      if((code==="KeyV"||code==="KeyZ")&&motos.player?.stage==="ride"){
        if(motos.finder){motos.zoom=clamp(motos.zoom+(code==="KeyZ"?.18:-.18),.92,3.4);}
        else if(!isTop()){motos.cockpit=!motos.cockpit;motos.pan=motos.tilt=0;if(!motos.cockpit)cameraSnap();}
        else cameraRig.changeZoom(code==="KeyZ"?-.12:.12);return true;
      }
      if(code==="Space"){if(motos.finder)motos.captureRequest=true;return true;}
      if(code==="KeyH"){sound.cue("horn",{kind:"coupe"});return true;}
      if(code==="KeyX"){if(motos.cockpit){motos.pan=motos.tilt=0;}else if(motos.bike)cameraRig.recenter(motos.bike.yaw,elapsed);return true;}
      return ["KeyK","KeyT","KeyB"].includes(code);
    }
    if(code==="KeyE"&&motoAtBike()){if(motos.board(hero,motoEnv)){motion.reset();lastHud=-10;}return true;}
    if(code!=="KeyF")return false;
    const contact=motoContact();if(!contact)return false;
    if(contact==="motorcyclist")speak("Remy Price",motos.visitor.leg===0?"Inés keeps a print of my first Paloma. Mint green. Same color as this one.":"I take the long way back when the light's like this.");
    else if(contact==="moto-shop"&&motos.film.pending)motos.finish(motoEnv);
    else openPanel(contact);return true;
  }
  function motoHud(){
    if(motos.player||motos.job?.swapping){
      const p=motos.player,b=motos.bike||motos.job.b,ride=p?.stage==="ride",j=motos.job;
      $("mode").textContent=b.name+(ride&&motos.passenger?" · Pillion":"");$("speed").innerHTML=Math.round(Math.abs(b.speed)*2.237)+"<small>MPH</small>";
      if(motos.finder){contextHint("Space","Shutter   ·   Mouse or arrows to frame   ·   Z/V zoom   ·   F lower");}
      else if(!ride)contextHint("",j?.swapping?"Trading seats":p?.stage==="out"?"Stepping off":"Taking the "+(p?.seat==="pillion"?"back seat":"handlebars"));
      else if(j?.stage==="lab")contextHint("E","Step off and take the roll to Inés");
      else if(j?.stage==="return"&&dist(b,studio.counter)<15)contextHint("F","Park for the film counter");
      else if(j&&motos.nearPhoto()&&j.stage==="out")contextHint("F","Raise the rangefinder   ·   G trade seats when stopped");
      else if(j)contextHint("G","Trade seats when stopped   ·   E step off");
      else contextHint("E","Step off when stopped   ·   Space rear brake"+(isTop()?"":"   ·   V rider view"));
      return true;
    }
    const here=motoContact(),b=motoAtBike();
    if(here==="moto-shop"){contextHint("F",motos.develop?"Developing your print…":motos.film.pending?"Develop the exposed roll":"Talk to Inés Vidal   ·   Coast Camera & Cycle");return true;}
    if(here==="moto-prints"){contextHint("F","Look through the print window");return true;}
    if(b){contextHint("E","Ride the "+b.name+(motos.job?" with Inés":""));return true;}
    if(here){contextHint("F","Talk to Remy Price");return true;}return false;
  }
  function motoGallery(body){
    const photos=Object.values(motos.prints);
    if(!photos.length){signedNote(body,"Three clips in the window. Bring me a roll and we'll fill the first one.","Inés Vidal");return;}
    const wall=document.createElement("div");wall.className="coast-prints";
    for(const c of BaySecondSeat.briefs){const p=motos.prints[c.id];if(!p)continue;
      const print=document.createElement("figure"),img=document.createElement("img"),cap=document.createElement("figcaption");
      img.src=p.image;img.alt=c.credit+" photographed from the "+BayMotorcyclesArt.specs[p.bike].name;
      cap.textContent=c.credit+" · "+p.score+"/100 · "+(p.photographer==="player"?"Your frame":"Inés Vidal");
      print.append(img,cap);wall.append(print);
    }body.append(wall);
  }
  function motoPanel(b,next){
    if(next==="moto-prints"){motoGallery(b);return;}
    if(motos.job){b.append(makeButton(motos.job.brief.title,motoInstruction(),"Resume",closePanel),
      makeButton("Leave the ride","An exposed roll can still be developed at the counter.","Leave",()=>{dropJob();closePanel();}));return;}
    if(!motos.bikes.some(v=>dist(v,studio.counter)<18)||motos.returning){
      const v=motos.nearest(studio.counter);
      b.append(makeButton("Bring a bike to the window",motos.returning?"Inés is riding back. You can find the other loaner on the map.":"Both loaners are out. The map has the closest set of keys.",v.name,()=>clockPin({...v,name:v.name})));return;
    }
    signedNote(b,"My dad used to work this strip with a camera under the seat. Pick a corner. We can take turns at the bars.","Inés Vidal");
    const box=document.createElement("div");b.append(box);
    const choose=c=>{
      box.replaceChildren();signedNote(box,c.ask,"Second Seat · "+c.place);
      for(const [role,label,line] of [["pilot","I'll drive","Take Inés to the corner. She carries the rangefinder."],["pillion","I'll take the picture","Ride behind Inés, then frame the scene from the back seat."]]){
        box.append(makeButton(label,line,role==="pilot"?"Handlebars":"Back seat",()=>{
          if(motoContact()!=="moto-shop"||active||!motos.offer(hero,c,role,motoEnv))return;
          active={job:{id:"second-seat",name:"Second Seat",by:"Inés Vidal"},moto:true};waypoint=null;closePanel();lastHud=lastMap=-10;
        }));
      }
      box.append(makeButton("Other corners","Read the three assignments.","Back",list));
    };
    const list=()=>{box.replaceChildren();for(const c of BaySecondSeat.briefs)box.append(makeButton(c.title,c.credit+(save.moto.count[c.id]?" · Best "+save.moto.best[c.id]+"/100":""),cash(c.pay)+" + print",()=>choose(c)));};list();
  }
  const motoBodies=new Map();let motoArt=false,motoShopArt=false;
  function drawMoto(list,see,t){
    if(see(studio.center,160)){if(!motoShopArt){BayCoastCamera.install(model);motoShopArt=true;}BayCoastCamera.world(list,see,t,hours,motos.prints);}
    if(!motos.all.some(b=>see(b,140))&&!see(motos.ines,55)&&!see(motos.remy,55))return;
    if(!motoArt){BayMotorcyclesArt.install(model);BayMotoRiders.install(model);motoArt=true;}
    for(const b of motos.all)if(see(b,140)&&!(b===motos.bike&&(motos.finder||motos.cockpit)))BayMotorcyclesArt.world(list,b,b.y,t,see(b,43));
    for(const [a,p] of [[motos.ines,motos.partner],[motos.remy,motos.remySeat]]){
      if(!see(a,65)||p?.b===motos.bike&&motos.finder||p?.seat==="pilot"&&motos.cockpit&&motos.pilot)continue;
      const key="moto-local/"+a.role;let mesh=motoBodies.get(key);
      if(!mesh){mesh=new BayPlayerMesh(BayMotoRiders.colors[a.role],"local");BayMotoRiders.dress(mesh,a.role);view.add(key,mesh,true);motoBodies.set(key,mesh);}
      const mounted=p&&p.stage!=="approach",b=mounted?p.b:null,seat=p?.seat||"pilot",opts=mounted?motos.pose(p):{helmet:false};
      if(BayMotoRiders.pose(mesh,a,b,seat,b?.y??a.y,t,opts))view.updateAnimated(key);
      list.push([key,a.x,a.y,a.z,a.yaw]);BayMotoRiders.props(list,a,b,seat,b?.y??a.y,t,opts,mesh);
    }
  }
  const motoMirrors={bike:null,images:[],next:0,at:-10};
  function reflectMoto(t,dusk){
    const b=motos.bike;if(!motos.cockpit||!motos.pilot||motos.finder||Math.abs(motos.pan)>1.1||!b)return;
    if(motoMirrors.bike!==b){motoMirrors.bike=b;motoMirrors.images=[];motoMirrors.next=0;motoMirrors.at=-10;}
    if(t-motoMirrors.at<(view.scale<.8?.16:.105))return;
    const i=motoMirrors.next,side=i?1:-1,img=motoMirrors.images[i]??=document.createElement("canvas");
    if(img.width!==112){img.width=112;img.height=66;}
    const rear=BayMotorcyclesArt.grips(b,b.y)[i];
    rear.x+=Math.cos(b.yaw)*side*.12;rear.z-=Math.sin(b.yaw)*side*.12;rear.y+=.235;
    Object.assign(rear,{yaw:b.yaw+Math.PI-side*.23,pitch:-.085,focal:1.45});
    driverSeat.sampleRear(view,img,rear,dusk,hours,rearStreet,false);motoMirrors.next=1-i;motoMirrors.at=t;
  }
  function motoOverlays(t){
    const gate=$("motoFinder"),dash=$("motoDash");
    gate.hidden=!motos.finder||!!panel;dash.hidden=!motos.cockpit||motos.finder||!!panel||isTop()||!motos.bike;
    if(!dash.hidden){
      const w=Math.min(innerWidth,1120),h=Math.round(w*innerHeight/innerWidth);if(dash.width!==w||dash.height!==h){dash.width=w;dash.height=h;}
      const ctx=dash.getContext("2d");ctx.clearRect(0,0,w,h);if(motos.pilot&&Math.abs(motos.pan)<1.3){ctx.save();ctx.translate(-Math.sin(motos.pan)*w*.68,Math.sin(motos.tilt)*h*.74);BayMotorcyclesArt.cockpit(ctx,motos.bike,w,h,t,{night:hours.night,kit:save.courts.equipped,mirrors:motoMirrors.images});ctx.restore();}
    }
  }
  function exposeMoto(src,sky,project){
    if(!motos.finder||!motos.job)return;
    const c=motos.job.brief,b=motos.bike,score=BayRideFilm.frame(c,project,src,b,dist(b,c.subject),hours,boardwalk.wheel,cars,neon);
    $("motoRead").textContent=(score?"Ready":"Reframe")+"   /   "+Math.round(motos.zoom*28)+" mm";
    if(motos.captureRequest)motos.accept(score?BayRideFilm.negative(motos,score,src,sky,hours):null,motoEnv);
  }
  let gullSelection=null,gullArt=false,gullPeopleArt=false;
  const gullMeshes=new Map(),gullActors=[gull.keeper,gull.assessor];
  function gullDoorHit(x,z,r,height){
    if(!gull||gull.restoring||Math.abs(x-53.72)>r+.25||z<23||z>43)return false;
    for(let i=0;i<3;i++){
      const o=BayGullMotors.doorBlock(i,gull.doors[i]);
      if(o&&o.bottom<height+.075&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r)return true;
    }return false;
  }
  function gullWalk(a,p,v){
    const nav=[gullSite.approach,gullSite.sidewalk,gullSite.desk,...gullSite.staffWalk,...gullSite.customerWalk];
    for(const b of gullSite.stalls){nav.push({x:55.9,z:b.z},{x:61,z:b.z});}
    const near=cars.concat(motos.all,transit.bus).filter(o=>o!==v&&Math.abs(o.speed||0)<1&&o.x>Math.min(a.x,p.x)-5&&o.x<Math.max(a.x,p.x)+5&&o.z>Math.min(a.z,p.z)-5&&o.z<Math.max(a.z,p.z)+5);
    return recoveryWalkway(a,p,v,nav,near)||motorWalkway(a,p,v);
  }
  function gullStand(v,side){
    const s=bayCarLayout(v.kind),q=BayCarAccess.outside(s,side),p=BayDriving.world(v,q.x,q.z);
    return valid(p.x,p.z,.28)?p:null;
  }
  function gullShowSpot(v){
    const s=bayCarLayout(v.kind),candidates=[[-s.track-.86,s.hingeZ+.53],[-s.track-.83,-s.halfLength*.30],[s.track+.84,s.hingeZ+.53]];
    for(const [side,along] of candidates){const p=BayDriving.world(v,side,along);if(valid(p.x,p.z,.3)&&cars.every(o=>o===v||dist(p,o)>5||BayDriving.clearance(o,p)>.31))return p;}
    return gullStand(v,-1)||gullSite.approach;
  }
  function gullReturnDrive(v,r,dt){
    const pad=gullSite.display[v.kind],onLot=v.x>44&&v.x<66.5&&v.z>23&&v.z<54;
    if(!r.mode){
      const trace=r.trail,anchor=trace?.length>1?trace[0]:null,origin=chase.road(anchor||v),near=BayCab.streetStop(anchor||v,origin);
      if(onLot||dist(v,pad)<14)r.mode="yard";
      else{
        const entry=near||{...origin,dir:Math.abs(Math.cos(v.yaw))>.66?(Math.cos(v.yaw)>0?0:2):(Math.sin(v.yaw)>0?1:3)};
        r.start=entry;r.mode="join";
        const retrace=anchor?trace.slice(0,-1).reverse():[];
        let approach=[...retrace,entry];
        if(origin.county){approach=retrace.concat(chase.route(anchor||v,gullSite.road));r.mode="county";}
        r.line=BayMotorCourt.lotPath(v,approach);
      }
    }
    if(r.mode==="join"||r.mode==="county"){
      if(!BayMotorCourt.lotDrive(v,r.line,dt,motorEnv))return false;
      if(r.mode==="county")r.mode="yard";
      else{
        BayMotorCourt.road(v,{x:69.52,z:pad.z+4.2,dir:2},r.start.dir,7.7);v.wait=.3;r.mode="road";
      }
      r.line=null;return false;
    }
    if(r.mode==="road"){if(v.path)return false;v.finiteRoute=false;r.mode="yard";}
    if(!r.line){
      const corners=onLot?[{x:63.3,z:v.z},{x:63.3,z:pad.z},pad]:[{x:68.5,z:pad.z+2.3},{x:65.0,z:pad.z+.15},pad];
      r.line=BayMotorCourt.lotPath(v,corners);
    }
    return BayMotorCourt.lotDrive(v,r.line,dt,motorEnv);
  }
  const gullEnv={hero,ground:footLevel,driver:()=>car,transfer:()=>transfer,walk:gullWalk,stand:gullStand,showSpot:gullShowSpot,door:doorPlan,
    wallet:()=>save.wallet,persist,say:speak,bringBack:gullReturnDrive,
    trace(v,trail){
      if(trail.length&&dist(v,trail.at(-1))<2.1)return;
      const road=chase.road(v);
      if(dist(v,road)<3.4&&(road.county||BayCab.streetStop(v,road)))trail.length=0;
      if(trail.length>=96)trail.splice(1,trail.length-2,...trail.slice(1,-1).filter((_,i)=>i%2));
      trail.push({x:v.x,z:v.z,yaw:v.yaw});
    },
    message:(a,b)=>note(a,b,4),changed(){lastMap=lastHud=-10;},
    closeDeal(){if(active?.gull)active=null;waypoint=null;lastMap=lastHud=-10;},
    money(amount,job){save.wallet+=amount;if(job)save.paid++;if(amount>0)sound.cue("paid");},
    releasePermit(v){if(v===personalCar){BayMotelParking.release(v);personalCar=null;}},
    permitted(v){return v===personalCar&&!v.stockId&&!v.serviceCar&&!v.recoveryOwner&&!v.meetCar&&!v.guestId&&!v.washGuest&&["hatch","coupe","van","cab"].includes(v.kind);},
    canPark(v,q){
      return fitsCar(v,q.x,q.z,q.yaw)&&!cars.some(o=>o!==v&&dist(o,q)<8&&BayDriving.contact({...q,kind:v.kind},o));
    },
    current(){
      try{const latest=JSON.parse(localStorage.getItem("sundownBay.v1")||"null");
        if(syncGarage(latest)){
          note("Gull Street Motors","The key book changed. Reopen the sheet for the current amount.",3);return false;
        }
      }catch{}return true;
    },
    subjects(){
      const list=[pos(),gull.keeper,gull.assessor];
      for(const v of cars)if(Math.abs(v.x-53.72)<11&&v.z>22&&v.z<44&&(Math.abs(v.speed)>.08||Math.abs(v.x-53.72)<2.7))list.push(v);
      return list;
    },
    meeting(a,p,v){
      const ang=Math.atan2(p.x-a.x,p.z-a.z),pts=gull.request?.kind==="return"?[gullSite.handover.customer]:[];
      for(const offset of [0,.7,-.7,1.42,-1.42,2.13,-2.13,Math.PI])pts.push({x:a.x+.90*Math.sin(ang+offset),z:a.z+.90*Math.cos(ang+offset)});
      for(const q of pts){if(!valid(q.x,q.z,.29)||cars.some(c=>dist(c,q)<5&&BayDriving.clearance(c,q)<.30))continue;const path=gullWalk(p,q,v);if(path)return path;}
      return null;
    }
  };
  const gullJob={id:"gull-road-sheet",name:"A Second Opinion",by:"Kitty Vega"};
  function gullStart(v,why){
    if(!gullFree()||!onStreetFeet()||!gullContact()||!gull.begin(v,why,gullEnv))return;
    active={gull:true,job:gullJob};waypoint=null;lastGuide=null;closePanel();lastHud=lastMap=-10;
  }
  function gullFree(){return !heat&&!watchCrew.towing&&!cabs.booking&&!transit.engaged&&!active&&!gull.engaged;}
  function gullContact(){
    if(!onStreetFeet()||!gullFree())return null;
    const counter=dist(hero,gullSite.desk);
    if(counter<2.85)return {type:"desk"};
    const v=BayGullSales.kinds.map(k=>gull.stock[k]).sort((a,b)=>dist(hero,a)-dist(hero,b))[0];
    if(dist(hero,v)<3.65&&(gapToLot(v)<23||v.stockId===gull.saved.loan?.kind))return {type:"sticker",v};
    if(dist(hero,gull.assessor)<2.15&&!gull.assessor.seat)return {type:"malik"};
    if(dist(hero,gull.keeper)<2.2)return {type:"desk"};
    return null;
  }
  function gapToLot(v){return dist(v,gullSite.center);}
  const awayFromDemo=d=>d&&["road","home"].includes(d.phase)&&car!==d.v&&!transfer;
  function gullTarget(){const d=gull.drive;return awayFromDemo(d)?{...d.v,name:"Return to the "+formatVehicle(d.v)}:gull.activeTarget();}
  function gullInstruction(){
    const r=gull.request,d=gull.drive;
    if(r){if(r.kind==="return")return "Give Kitty the signed road sheet and keys";
      return r.phase==="exchange"?"Taking the keys":r.phase==="ready"?"Take the keys from Kitty":"Meet Kitty beside the "+formatVehicle(r.v);}
    if(!d)return "";
    if(awayFromDemo(d))return "Get back in the "+formatVehicle(d.v);
    if(d.phase==="board")return gull.assessor.seat<1?"Take the driver’s seat while Malik boards":"Take the wheel of the "+formatVehicle(d.v);
    if(d.phase==="road")return BayGullSales.specs[d.v.kind].gates[d.gate].ask;
    if(d.phase==="outside")return "Step out and meet Kitty at the key counter";
    return "Park on the "+formatVehicle(d.v)+" display stripe";
  }
  function gullKeys(code){
    if(gull.exchange)return !["KeyM","KeyJ","Escape","KeyR"].includes(code);
    if(active?.gull){
      if(code==="KeyF"){
        if(gull.request){if(!gull.hand(gullEnv))note("Kitty Vega",gullInstruction(),2.4);}
        else if(!gull.checkStop(gullEnv))note("Malik Bell",gullInstruction(),2.4);return true;
      }
      if(code==="KeyE"&&gull.request)return true;return false;
    }
    if(!gullFree()||!["KeyF","KeyE"].includes(code))return false;
    if(code==="KeyF"&&car&&!transfer&&gull.bayFor(car)>=0){openPanel("motor-bay");return true;}
    const h=gullContact();if(!h)return false;
    if(code==="KeyE"&&(h.type!=="sticker"||gull.keyFor(h.v)))return false;
    if(h.type==="malik"){speak("Malik Bell",gull.saved.sheets.cayo.count?"That Cayo still has its original rear end. Your road sheet's in the book.":"I used to announce races in a folding chair. These days I take the passenger seat.");return true;}
    gullSelection=h.v||null;openPanel(h.type==="sticker"?"motor-sticker":"motor-sales");return true;
  }
  function gullHud(){
    if(active?.gull){
      const q=gull.request,d=gull.drive;
      if(q){const ready=q.phase==="ready"&&dist(hero,gull.keeper)<2.75;
        contextHint(ready?"F":"",ready?(q.kind==="return"?"Give Kitty the keys and sheet":"Take the key ring"):"");}
      else if(d?.phase==="board")contextHint(car?"":"E",car?"Malik is taking the passenger seat":"Take the driver’s seat");
      else if(awayFromDemo(d)){const here=dist(hero,d.v)<5.1;contextHint(here?"E":"",here?"Take the driver’s seat":"");}
      else if(d?.phase==="outside")contextHint("E","Step out and return the signed sheet");
      else if(d?.phase==="home"&&dist(d.v,gullSite.display[d.v.kind])<11)contextHint("F","Park on the display stripe");
      else if(d?.gate===2&&dist(d.v,BayGullSales.specs[d.v.kind].gates[2])<9)contextHint("F","Stop and mark the brake reading");
      else contextHint("","");return true;
    }
    if(!gullFree())return false;
    if(car&&!transfer&&gull.bayFor(car)>=0){contextHint("F","Bay "+(gull.bayFor(car)+1)+"   ·   Gull Street garage");return true;}
    const h=gullContact();if(!h)return false;
    contextHint("F",h.type==="desk"?"Kitty Vega   ·   Gull Street Motors":h.type==="malik"?"Talk to Malik Bell":"Read the "+formatVehicle(h.v)+" window sticker");return true;
  }
  const gullPick=v=>{gullSelection=v;openPanel("motor-sticker",true);};
  function titleBoard(body,desk=false){
    const vehicles=gull.owned;
    for(let i=0;i<vehicles.length;i++){
      const v=vehicles[i],number="Bay "+(i+1);
      if(!v){if(desk)signedNote(body,"Available",number);continue;}
      const r=gull.record(v),location=BayGullSales.inBay(v,gullSite.stalls[i],true)?"At Gull Street":district(v);
      const features=[v.upgrades?.engine?"Engine tune":"",v.upgrades?.tires?"Sport tires":"",v.flatSide?tireStatus(v):BayRecovery.worst(v)?BayRecovery.faultText(v):""].filter(Boolean);
      const text=[location,(r.meters/1000).toFixed(1)+" km in your collection",...features].join(" · ");
      body.append(makeButton(number+" · "+formatVehicle(v),text,"Locate car",()=>clockPin({...v,name:"Your "+formatVehicle(v)})));
      const onStripe=v.stockId?BayGullSales.inBay(v,gullSite.display[v.kind],true):gull.bayFor(v)>=0;
      if(desk&&onStripe){const price=BayGullSales.quote(v,r);
        body.append(makeButton(price?"Sell the "+formatVehicle(v):"Release "+number,price?"Kitty’s buyback offer includes the fitted parts and current condition.":"Keep the Room 14 permit and free this bay.",price?cash(price):"Return title",()=>{
          if(gull.sell(v,gullEnv)){closePanel();lastHud=lastMap=-10;}
        }));}
    }
  }
  function gullPanel(body,screen){
    if(screen==="jobs"){body.append(makeButton(gull.request?.v?formatVehicle(gull.request.v):formatVehicle(gull.drive.v),gullInstruction(),"Resume",closePanel),
      makeButton("Hand back the clipboard","Park safely and step out. Malik will bring a borrowed demonstrator back.","Leave",()=>{dropJob();closePanel();}));return;}
    if(screen==="motor-titles"){
      titleBoard(body);for(const k of BayGullSales.kinds){const r=save.gull.sheets[k];if(r.count)signedNote(body,r.count+" signed · Best "+r.best+"/100",BayGullSales.specs[k].name+" road sheet");}
      body.append(makeButton(gullSite.name,"Kitty’s showroom and your three bays on Biscayne Street.","Set waypoint",()=>clockPin(gullPin)));
      if(save.gull.loan)body.append(makeButton("Outstanding demonstrator",formatVehicle(gull.stock[save.gull.loan.kind]),"Locate car",()=>clockPin({...gull.stock[save.gull.loan.kind],name:"Road-test car"})));return;
    }
    if(screen==="motor-bay"){
      const v=car,i=v?gull.bayFor(v):-1;if(i<0)return;const rec=gull.record(v),other=gull.owned[i];
      if(rec){
        if(rec.bay===i)body.append(makeButton("Park the "+formatVehicle(v),"Its paint, parts, condition and location stay on this title.","File parking spot",()=>{gull.remember(v);persist();closePanel();note("Bay "+(i+1),"Parking spot saved for "+formatVehicle(v)+".",3);}));
        else if(!other)body.append(makeButton("Move the key tag","Switch from bay "+(rec.bay+1)+" to bay "+(i+1)+".","Assign this bay",()=>{if(!gullEnv.current()||gull.bayFor(v)!==i||gull.owned[i])return;rec.bay=i;save.gull.rev++;gull.remember(v);persist();closePanel();}));
      }else if(!other&&gullEnv.permitted(v))body.append(makeButton("File the Room 14 title","Keep this same car in your permanent collection. The guest permit stays on its dashboard.","Register free",()=>{if(gull.register(v,gullEnv))closePanel();}));
      if(!body.children.length)signedNote(body,other?"This bay belongs to the "+formatVehicle(other)+".":"Bring a car you bought from Kitty, or your car with the Room 14 permit.","Key rail · Bay "+(i+1));return;
    }
    if(screen==="motor-sticker"){
      const v=gullSelection;if(!v)return;const k=v.kind,spec=BayGullSales.specs[k],record=gull.record(v),price=gull.price(k),pad=gullSite.display[k];
      const sticker=document.createElement("div");sticker.className="gull-sticker";
      const name=document.createElement("strong"),sum=document.createElement("b"),description=document.createElement("p");
      name.textContent=k==="cayo"?"1972 V8 fastback":"Mid-engine sports coupe";sum.textContent=record?"Titled · Bay "+(record.bay+1):cash(price);description.textContent=spec.detail;
      sticker.style.setProperty("--car-paint",v.color);sticker.append(name,sum,description);body.append(sticker);
      if(gull.reclaim){signedNote(body,"Malik is bringing the demonstrator back. The key rail will clear when he parks.","Kitty Vega");return;}
      if(save.gull.loan&&save.gull.loan.kind!==k){signedNote(body,"One clipboard per crew. Return the "+formatVehicle(gull.stock[save.gull.loan.kind])+" to its stripe.","Kitty Vega");return;}
      const atLot=dist(v,pad)<6||gull.bayFor(v)>=0;
      if(!record||atLot){
        body.append(makeButton(save.gull.loan?"Resume the road test":"Take a road test","Drive with Malik, read the brake mark and return the keys for "+cash(spec.base)+"–"+cash(spec.base+65)+".","Drive",()=>gullStart(v,"test")));
      }
      if(!record&&!save.gull.loan){
        const short=Math.max(0,price-save.wallet),space=gull.vacant()>=0,rebate=spec.price-price;
        const buy=makeButton("Buy the "+spec.name,!space?"All three bays have titles.":short?"Earn "+cash(short)+" more. A signed road sheet earns a "+cash(spec.credit)+" first-purchase credit.":rebate?cash(spec.price)+" sticker less "+cash(rebate)+" road-test credit.":"The sale includes a title and a permanent bay.",cash(price),()=>gullStart(v,"buy"));buy.disabled=!!short||!space;body.append(buy);
      }
      if(record&&!atLot)body.append(makeButton("Find this car","Last seen in "+district(v)+".","Locate",()=>clockPin({...v,name:formatVehicle(v)})));return;
    }
    if(!save.gull.met){save.gull.met=true;persist();}signedNote(body,"I sell what we drive. Malik fills out the road sheet from the passenger seat. Bring back a signed one and I’ll take something off the sticker.","Kitty Vega");
    for(const k of BayGullSales.kinds){const v=gull.stock[k],r=gull.record(v);body.append(makeButton(BayGullSales.specs[k].name,r?"Your car · Bay "+(r.bay+1):v.plate+" · "+(k==="cayo"?"1972 fastback":"Mid-engine sports car"),r?"Title":cash(gull.price(k)),()=>gullPick(v)));}
    if(gull.saved.titles.length)titleBoard(body,true);
    else signedNote(body,"A car with the Marlin’s Room 14 permit gets a bay here for free. Drive into any open stall and press F to file the title.","Gull Street key rail");
  }
  function gullPose(a){
    const e=gull.exchange,d=gull.drive,r=gull.reclaim,v=d?.v||r?.v;
    if(e?.ready&&(e.from===a||e.to===a))return {role:a===hero?"player":a.role,action:e.from===a?"give":"receive",from:e.from,to:e.to,progress:e.at,kit:a===hero?save.courts.equipped:null};
    const show=gull.request?.v||(a===gull.assessor?BayGullSales.kinds.map(k=>gull.stock[k]).find(c=>dist(c,a)<4.6):null);
    return {role:a.role,action:a.action,car:a.seat?v:show,ground:a.y,passenger:!r||r.phase==="out",seat:a.seat};
  }
  function drawGullMotors(list,see,t){
    if(see(gullSite.center,165)){
      if(!gullArt){BayGullMotors.install(model);gullArt=true;}BayGullMotors.world(list,see,t,hours,{...gull.render,player:pos()});
    }
    BayGullSales.marks(model,list,gull.drive);
    if(!gullActors.some(a=>see(a,100)))return;
    if(!gullPeopleArt){BayDealerPeople.install(model);gullPeopleArt=true;}
    for(const a of gullActors){
      if(!see(a,94))continue;if(!see(a,38)){if(!a.seat)BayDealerPeople.far(list,a,a.role);continue;}
      const key="gull-person/"+a.role;let mesh=gullMeshes.get(key);if(!mesh){mesh=new BayPlayerMesh(BayDealerPeople.colors[a.role],"local");BayDealerPeople.dress(mesh,a.role);view.add(key,mesh,true);gullMeshes.set(key,mesh);}
      const opts=gullPose(a);if(BayDealerPeople.pose(mesh,a,t,opts.action,opts))view.updateAnimated(key);
      const v=opts.car;if(a.seat===1&&v)drawInSeat(list,key,v,opts.passenger?1:-1);
      else list.push([key,a.x,a.y,a.z,a.yaw]);
      BayDealerPeople.props(list,a,t,opts.action,opts,mesh);
    }
  }
  function buttonwoodHit(q,prior,obstacle){
    const hit=BayDriving.contact(q,obstacle);
    if(!hit)return false;
    const old=prior&&BayDriving.contact(prior,obstacle);return !old||hit.depth>old.depth+.000001;
  }
  function boatTrailerBlocks(q,prior){
    if(!works||Math.abs(q.x-works.trailer.x)>10||Math.abs(q.z-works.trailer.z)>10)return false;
    return BaySlipTrailer.pieces(works.trailer).some(piece=>{
      // A driver yielding to a trailer leaves clearance for its rear corner to swing.
      piece.footprint={track:piece.footprint.track+.54,halfLength:piece.footprint.halfLength+.36};
      return buttonwoodHit(q,prior,piece);
    });
  }
  function buttonwoodClear(q,tug,prior=null){
    if(!fitsCar(q,q.x,q.z,q.yaw))return false;
    const blocked=v=>v!==tug&&Math.abs(q.x-v.x)<9&&Math.abs(q.z-v.z)<9&&buttonwoodHit(q,prior,v);
    return !cars.some(blocked)&&!patrol.some(blocked)&&!motos.all.some(blocked)&&!blocked(transit.bus);
  }
  function pullButtonwood(tug){
    const trailer=works.trailer,near=cars.filter(v=>v!==tug&&Math.abs(v.x-trailer.x)<10&&Math.abs(v.z-trailer.z)<10);
    const fixed=motos.all.concat(patrol,transit.bus).filter(v=>Math.abs(v.x-trailer.x)<11&&Math.abs(v.z-trailer.z)<11);
    const nudges=new Map();
    const moved=trailer.follow(tug,(q,before)=>{
      if(!fitsCar(q,q.x,q.z,q.yaw)||fixed.some(v=>buttonwoodHit(q,before,v)))return false;
      for(const v of near){
        const from=nudges.get(v)||v;
        if(!buttonwoodHit(q,before,from))continue;
        if(!v.path||v===transfer?.v)return false;
        const hit=BayDriving.contact(from,q);if(hit.depth>.45)return false;
        const next={kind:v.kind,yaw:v.yaw,x:from.x+hit.nx*(hit.depth+.014),z:from.z+hit.nz*(hit.depth+.014)};
        if(!fitsCar(v,next.x,next.z,next.yaw)||buttonwoodHit(next,from,tug)||
          near.some(o=>o!==v&&buttonwoodHit(next,from,nudges.get(o)||o))||fixed.some(o=>buttonwoodHit(next,from,o)))return false;
        nudges.set(v,next);
      }
      return true;
    },()=>nudges.clear());
    if(moved)for(const [v,p] of nudges){
      v.x=p.x;v.z=p.z;v.wait=Math.max(v.wait,.78);v.brakes=1;
      if(streetTime>(v.trailerHornAt||0)){v.trailerHornAt=streetTime+4;trafficHonk(v);}
    }
    return moved;
  }
  function buttonwoodFleet(floating){
    for(const fleet of [boats,civilianFleet]){
      const index=fleet.indexOf(pip);if(floating&&index<0)fleet.push(pip);if(!floating&&index>=0)fleet.splice(index,1);
    }
  }
  function restoreButtonwood(){
    const w=works,s=w.saved,t=w.trailer;t.detach();
    const park=(v,p)=>{if(p&&buttonwoodClear({...p,kind:v.kind},v)){Object.assign(v,p,{path:null});BayDriving.settle(v);return true;}return false;};
    if(s.truck)park(workTruck,s.truck);
    const tug=cars.find(v=>v.garageKey===s.tugKey&&BaySlipTrailer.compatible(v));
    const restoreTow=tug&&(tug===workTruck||park(tug,s.tug));
    Object.assign(t,s.trailer&&BaySlipTrailer.fits(s.trailer,q=>buttonwoodClear(q,restoreTow?tug:null))?s.trailer:boatYard.trailer);
    if(restoreTow)t.attach(tug,q=>buttonwoodClear(q,tug));
    w.floating=!!s.floating;t.load=!w.floating;t.pose(footLevel);pip.catchCount=s.catchCount;
    if(s.floating){
      const d=bay.docks.concat(airStops,BayDrawbridge.iceDock).find(d=>d.id===s.dock);
      if(d&&vacant(pip,d,s.side))bay.moor(pip,d,s.side);
      else if(s.boat&&bay.fits(s.boat.x,s.boat.z,s.boat.yaw)){Object.assign(pip,s.boat,{dock:null});}
      else bay.moor(pip,boatYard.dock,1);
      if(pip.dock!==boatYard.dock){w.alda.ride=pip;w.alda.seat=1;}
    }else{Object.assign(pip,t.loadedPose(),{dock:null});}
    buttonwoodFleet(w.floating);
  }
  function resumeButtonwood(){
    const s=works.saved;
    if(s.rider==="helm"&&works.floating){
      skiff=pip;pip.dock=null;works.alda.ride=pip;works.alda.seat=1;
      Object.assign(hero,seatPoint(pip));pilot(pip,1,1/60);
    }else if(s.rider==="truck"){
      const v=works.trailer.hitched||workTruck;car=v;v.path=null;v.used=true;
      BayCarAccess.pose(v,-1,1,hero,motion,footLevel,1/60);
    }else if(s.foot&&(valid(s.foot.x,s.foot.z,.32)||bay.landing(s.foot.x,s.foot.z,.18))&&
      !cars.some(v=>dist(v,s.foot)<4&&BayDriving.clearance(v,s.foot)<.2)){
      Object.assign(hero,s.foot);resetFeet();
    }
  }
  function syncButtonwood(latest){
    if(!latest?.buttonwood||latest.buttonwood.rev<=save.buttonwood.rev)return;
    Object.assign(save.buttonwood,BayButtonwood.read(latest.buttonwood));
    if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
    if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    if(works){pip.catchCount=save.buttonwood.catchCount;if(!save.buttonwood.working&&active?.buttonwood){works.dropLine();active=null;}}
    lastHud=lastMap=-10;
  }
  function latestButtonwood(){try{syncButtonwood(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}}
  function writeButtonwood(){
    latestButtonwood();const s=works.saved;
    s.rider=s.working?(skiff===pip&&!works.slip?"helm":car&&(car===workTruck||car===works.trailer.hitched)?"truck":""):"";
    s.foot=s.working&&!s.rider&&onStreetFeet()&&
      [boatYard.counter,boatYard.dock,works.trailer,workTruck].some(p=>dist(hero,p)<19)?BayButtonwood.pose(hero,true):null;
    works.snapshot();works.saved.rev=Math.max(Date.now(),works.saved.rev+1);works.dirty=false;persist();lastHud=lastMap=-10;
  }
  function buttonwoodEvent(name,detail){
    if(name==="launched")speak("Alda Santana","She floats. Leave the pickup here. Come down the walkboard and take the helm.");
    if(name==="loaded")speak("Alda Santana",works.saved.catchCount?"She's tight on both bunks. Benji's got the scale out back.":"Bow pin's in. You can pull up.");
    if(name==="snag")note("Alda Santana","Caught on the lip. Ease off, then take the weight again.",2.3);
    if(name==="potted"){
      const next=works.saved.working&&works.mark(works.remaining()[0]),n=detail.count;
      speak("Alda Santana",n+" keepers. "+(next?"Put me alongside "+next.name+".":works.saved.working?"That's the last tag. Let's get back to the slip.":"Give that pot time to soak."));
      sound.cue("job");
    }
    lastHud=lastMap=-10;
  }
  const potEnv={fleet:buttonwoodFleet,event:buttonwoodEvent,write:writeButtonwood,floor:footLevel,
    deck:(x,y,z)=>chassisPoint(pip,x,y,z,pip.y),hook:()=>chassisPoint(pip,1.075,1.31,.79,pip.y)};
  function stepButtonwood(dt){
    const w=works,t=w.trailer;w.tick(dt);t.pose(footLevel);
    if(!w.floating&&!w.slip)Object.assign(pip,t.loadedPose());
    if(w.recoverAfterTie&&!deckStep){w.recoverAfterTie=false;if(pip.dock===boatYard.dock)w.beginSlip(false);}
    if(w.line&&skiff!==pip)w.dropLine();
    if(w.line)w.stepLine(dt,held("Space"),streetTime,potEnv);
    if(w.slip)w.stepSlip(dt,potEnv);
    if(!t.hitched||t.hitched!==car)w.rearView=false;
    const p=pos();w.crewTime=(w.crewTime||0)+dt;
    if(w.line||w.slip||w.alda.cross||w.crewTime>.12||dist(p,w.alda)<30||dist(p,w.benji)<28){
      BayButtonwoodStreet.stepCrew(w,w.crewTime,streetTime,potEnv);w.crewTime=0;
    }
  }
  function buttonwoodSpot(){
    if(!play||room||transfer||deckStep||swim)return "";
    const w=works,t=w.trailer,d=boatYard.dock;
    if(w.slip)return car===t.hitched||onStreetFeet()&&dist(hero,boatYard.wet)<15?"winching":"";
    if(skiff===pip){
      if(w.line)return "line";
      if(w.canRecover())return "land";
      if(w.nearPot())return "pot";
      return "";
    }
    if(car&&t.hitched===car){
      if(w.canSlip()&&(!w.floating||w.canRecover()))return w.floating?"land":"launch";
      return "";
    }
    if(car&&BaySlipTrailer.hitchable(t,car)&&!t.hitched)return "hitch";
    if(!onStreetFeet())return "";
    if(dist(hero,boatYard.counter)<2.8||dist(hero,w.benji)<1.95)return "yard";
    if(w.canSlip()&&dist(hero,boatYard.wet)<12.5&&(!w.floating||w.canRecover())){
      // At the step itself, leave E clear for the person boarding the skiff.
      if(!w.floating||d===bay.landing(hero.x,hero.z)||dist(hero,BaySlipTrailer.coupler(t))<2.8)return w.floating?"land":"launch";
    }
    if(dist(hero,BaySlipTrailer.coupler(t))<2.5&&(!t.hitched||Math.abs(t.hitched.speed)<.85))return "jack";
    if(!w.alda.ride&&dist(hero,w.alda)<2.5)return "alda";
    return "";
  }
  function buttonwoodTask(){
    const w=works,t=w.trailer;
    if(!w.floating){
      if(w.saved.working&&!w.remaining().length)return w.atYard()?"Step out and hand Benji the ticket":"Park the boat in the striped yard bay";
      if(!t.hitched)return "E to drive the Cortez · F by the trailer tongue";
      if(dist(t,boatYard.wet)<48)return "Follow the loop, face west, then reverse between the white stripes";
      return "Ocean Drive north · enter by the public launch sign";
    }
    if(w.saved.working&&!w.remaining().length)return "Tie up at Buttonwood or point the bow between the trailer bunks";
    if(skiff!==pip)return "Walk to the end of the pier · E to board";
    return w.line?"Hold Space to haul · let go when the load rises":"Idle beside the marked buoy · F to take the line";
  }
  function buttonwoodGuide(target){
    if(!car||works.trailer.hitched!==car||!target)return null;
    const returning=target.x===boatYard.parking.x;
    if(!returning&&target.x!==boatYard.wet.x)return null;
    const w=works,t=w.trailer;
    const route=returning?[[187,48.5],[167,36],[151.8,35.5],[142,-79],[137,-84.5],[112.6,-84.5]]:
      [[139,-84.5],[147.8,-79],[145.6,30],[154,35.5],[197,35.5],[202,37.0],[204.5,42],[202,47.2],[197,48.5],[188,48.5]];
    const id=returning?"yard":"slip";
    if(w.leg!==id){w.leg=id;let best=0,d=Infinity;for(let i=0;i<route.length;i++){
      const a={x:route[i][0],z:route[i][1]},gap=dist(car,a);if(gap<d){d=gap;best=i;}
    }w.guideIndex=best;}
    let i=w.guideIndex,goal={x:route[i][0],z:route[i][1]};
    if(dist(car,goal)<(i===2?7:4)&&i<route.length-1){i=++w.guideIndex;goal={x:route[i][0],z:route[i][1]};}
    const lined=!returning&&car.x>179&&Math.abs(car.z-boatYard.wet.z)<3.3&&Math.abs(angle(car.yaw,boatYard.wet.yaw))<.44;
    if(lined&&i>5)w.guideIndex=route.length-1;
    const rest=route.slice(w.guideIndex).map(([x,z])=>({x,z})),points=lined?[car,target]:[car,...rest,target];
    const meters=points.slice(1).reduce((n,p,j)=>n+dist(points[j],p),0);
    const turn=returning?(i<3?"Leave by the public launch sign":i===3?"Ocean Drive south to Gantry":"Return to the striped bay"):
      lined?"S to reverse · Shift + S to follow the stripe":i<2?"Leave the yard and turn north on Ocean Drive":i===2?"Turn right at the public launch sign":i<5?"Follow the white loop toward the sea":"Follow the loop left until the rig faces west";
    return {points,meters,turn};
  }
  function buttonwoodKey(code){
    const w=works,t=w.trailer;
    if(!play||panel||transfer||deckStep||room)return false;
    if(w.slip&&(car&&t.hitched===car||skiff===pip))return ["KeyF","KeyE","KeyG","KeyV","Space"].includes(code);
    if(w.line&&skiff===pip){
      if(code==="KeyV"){w.line.close=!w.line.close;if(!w.line.close)cameraSnap();return true;}
      if(code==="KeyE"){w.dropLine();cameraSnap();note("Pip 16","Line clear. The pot is back on the bottom.",2);}
      return ["KeyF","KeyE","Space"].includes(code);
    }
    if(code==="KeyV"&&car&&t.hitched===car){w.rearView=!w.rearView;if(!w.rearView)cameraSnap();return true;}
    if(code==="KeyG"&&car&&t.hitched===car&&Math.abs(car.speed)<.85){t.detach();w.rearView=false;writeButtonwood();note("Tongue jack","Trailer parked. F at the coupler to hitch up again.",3);return true;}
    if(code==="KeyE"&&boardable()===pip&&!w.alda.ride&&pip.dock===boatYard.dock&&!w.alda.cross&&w.floating){
      note("Alda Santana","Give me a moment to get down the walkboard.",2);return true;
    }
    if(code==="KeyE"&&boardable()===pip&&w.alda.cross){note("Alda Santana","One foot aboard. Give me a second.",1.8);return true;}
    if(code!=="KeyF")return false;
    const at=buttonwoodSpot();if(!at)return false;
    if(at==="hitch"||at==="jack"){
      if(t.hitched){t.detach();writeButtonwood();note("Tongue jack","Trailer parked.",2);return true;}
      const v=car||cars.find(o=>BaySlipTrailer.hitchable(t,o));
      if(v&&t.attach(v,q=>buttonwoodClear(q,v))){BayDriving.settle(v);w.guideIndex=0;w.leg=null;w.saved.seen=true;writeButtonwood();note("Coupler latched","V to see the trailer · G to lower the jack at a stop.",3.5);}
      else note("Boat trailer","Back the Cortez, Estate or panelvan up to the silver tongue.",3);return true;
    }
    if(at==="yard"||at==="alda"){
      latestButtonwood();if(!w.saved.seen){w.saved.seen=true;writeButtonwood();}openPanel(at==="yard"?"buttonwood":"pot-book");return true;
    }
    if(at==="launch"||at==="land"){
      if(at==="land"&&skiff===pip&&w.canRecover()){
        deckStep={v:pip,entering:false,f:0,start:seatPoint(pip),origin:{x:pip.x,z:pip.z,yaw:pip.yaw},dock:boatYard.dock,side:1};
        pip.speed=pip.vx=pip.vz=0;w.recoverAfterTie=true;keys.clear();
      }else w.beginSlip(at==="launch");
      w.leg=null;lastHud=lastMap=-10;return true;
    }
    if(at==="pot"){
      latestButtonwood();const p=w.nearPot(),reason=w.lock(p);if(reason)note("Alda Santana",reason,2.4);
      else if(w.snag(p,potEnv)){note(p.name,"Hold Space to haul. Release before the tension reaches the red end.",3.5);}
      return true;
    }
    return at==="winching";
  }
  function buttonwoodHint(){
    const w=works,at=buttonwoodSpot(),t=w.trailer;
    if(at){
      const prompts={yard:"Talk to Benji · Buttonwood Boat Works",alda:"Talk to Alda on the walkboard",jack:t.hitched?"Lower the tongue jack":"Check the trailer coupler",
        hitch:"Hitch the skiff trailer",launch:"Pay out the winch · launch Pip 16",land:"Wind Pip 16 onto the trailer",
        pot:"Grab the pot line",line:"Hold to haul · release to ease · V view · E let go",winching:"Working the bow winch"};
      let prompt=prompts[at];if(at==="land"&&onStreetFeet()&&boardable()===pip)prompt="Wind in the skiff · E to board";
      if(at==="pot")prompt+=" · "+w.nearPot().name;
      contextHint(at==="line"?"Space":at==="winching"?"":"F",prompt);return true;
    }
    if(onStreetFeet()&&boardable()===pip){contextHint("E",w.alda.cross||!w.alda.ride&&pip.dock===boatYard.dock?"Alda is boarding Pip 16":"Take the helm · Pip 16");return true;}
    if(car&&car===t.hitched&&!transfer&&!inServiceBay(car)){
      contextHint("V",dist(t,boatYard.wet)<38?"Trailer view · Shift + S to back along the stripe":"Trailer view · G to unhitch at a stop");return true;
    }
    if(skiff===pip&&!deckStep&&!swim){contextHint("E",nearestMooring(pip)?"Tie up alongside the dock":"Go over the side at idle · F beside a pot buoy");return true;}
    return false;
  }
  function buttonwoodPanel(b,screen){
    const w=works,s=w.saved,here=screen==="buttonwood"&&buttonwoodSpot()==="yard";
    const signed=s.working?BayButtonwood.sheets[s.sheet]:null;
    signedNote(b,here?"Alda still reads the paint on her buoys from a block away. Take the green truck. I'll weigh what you bring back.":"Red bell on Little Bank. Green on the grass. You can tell them apart in fog by the cut of the flag.",here?"Benji Moss":"Alda Santana");
    const line=document.createElement("p");line.className="statline";line.textContent=signed?signed.name+" · "+s.marks.length+" / "+signed.marks.length+" pots · "+s.catchCount+" aboard":
      s.runs+" signed landings  /  "+s.landed+" keepers ashore  /  best box "+s.best;b.append(line);
    if(s.last){const last=document.createElement("p");last.textContent="Last landing · "+BayButtonwood.sheets[s.last.sheet].name+" · "+s.last.count+" keepers · "+cash(s.last.pay);b.append(last);}
    if(here&&w.atYard()&&s.catchCount){
      b.append(makeButton("Weigh the live box","Benji weighs the catch from the skiff in the yard.","Land catch",()=>{
        latestButtonwood();if(buttonwoodSpot()!=="yard")return;const r=w.land();if(!r)return;
        if(active?.buttonwood&&r.signed)active=null;save.wallet+=r.pay;save.paid++;w.leg=null;writeButtonwood();sound.cue("paid");closePanel();
        note("Buttonwood landing ticket",r.count+" keepers · "+cash(r.pay),5);
      }));
    }
    if(here&&!active&&!heat&&!watchCrew.towing&&!cabs.booking&&!s.working){
      BayButtonwood.sheets.forEach((sheet,id)=>b.append(makeButton(sheet.name,sheet.note+" "+cash(sheet.fee)+" plus $8 per keeper.","Sign on",()=>{
        latestButtonwood();if(active||buttonwoodSpot()!=="yard"||!w.shift(id))return;
        active={buttonwood:true,job:potJob};waypoint=null;w.leg=null;writeButtonwood();closePanel();speak("Benji Moss","Your ticket's on the clip. Alda's waiting at the slip.");
      })));
    }
    if(s.working){b.append(makeButton("Current landing ticket",buttonwoodTask(),"Back",closePanel));
      b.append(makeButton("Hand back the ticket","The gear and the catch aboard stay where they are.","End shift",()=>{if(active?.buttonwood)dropJob();else{s.working=false;s.marks=[];writeButtonwood();}closePanel();}));}
    for(const [name,p] of [["Buttonwood Boat Works",boatYard.marker],["Public launch lane",boatYard.slipMarker],["Boat trailer",w.trailer],["Pip 16",pip],["Cortez Stepside",workTruck]]){
      b.append(makeButton(name,p===pip?(w.floating?"On the water":"On the trailer"):district(p),"Map",()=>clockPin({...p,name})));
    }
  }
  let buttonwoodModels=false,radioArtReady=false;
  function drawButtonwood(list,see,t,under=false){
    if(!see(boatYard.center,170)&&!see(boatYard.slip,165)&&!see(works.trailer,134)&&!see(pip,135)&&!works.pots.some(p=>see(p,98)))return;
    if(!buttonwoodModels){BayButtonwoodYard.install(model);BayButtonwoodRig.install(model);BayButtonwoodPots.install(model);buttonwoodModels=true;}
    if(!under){BayButtonwoodYard.world(list,see,t,works,view);if(see(works.trailer,125))BayButtonwoodRig.trailer(list,works.trailer,t,view,!see(works.trailer,46));}
    if((!under||works.floating)&&see(pip,under?34:135))BayButtonwoodRig.hull(list,pip,t,!see(pip,46));
    BayButtonwoodPots.world(list,see,t,works,view);
  }
  const brisasJob={id:"brisas",name:"Las Brisas",by:"Nico Paz"};
  const brisasCanFit=v=>v&&v.kind!=="solena"&&!v.serviceCar&&!v.meetCar&&!v.guestId&&!v.washGuest&&!v.recoveryOwner&&save.brisas.classes.house.wins>0;
  function restoreBrisasCar(){
    const park=save.brisas.park;if(!save.brisas.title||!park||!fitsCar(plum,park.x,park.z,park.yaw))return;
    const pose={kind:plum.kind,...park};if(cars.some(v=>v!==plum&&dist(v,pose)<7&&BayDriving.contact(pose,v)))return;
    Object.assign(plum,park,{flatLoad:park.flatSide?1:0});BayDriving.settle(plum);
  }
  const brisasEnv={driver:()=>transfer?null:car,ground:footLevel,stand:gullStand,door:doorPlan,
    walk(a,b,v){return recoveryWalkway(a,b,v,[brisasSite.celia,brisasSite.desk,...brisasSite.crowd],cars.filter(o=>o!==v&&dist(o,b)<17));},
    crew:(c,dt)=>BayBrisasStreet.crew(c,dt,brisasEnv),path:(v,dest,home)=>BayBrisasStreet.path(club,v,dest,home),poses:BayBrisasStreet.poses,
    save:persist,say:speak,change(){lastHud=lastMap=-10;},sync(){try{syncBrisas(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}},
    pay(n){save.wallet+=n;save.paid++;sound.cue("paid");},
    sound(type,v,force){const range=dist(pos(),v);if(range<32)sound.cue("brisas-"+type,{force,distance:range});}
  };
  function brisasStep(dt){
    if(heat&&active?.brisas)dropJob();
    club.step(dt,brisasEnv);
  }
  let brisasModels=false,celiaDriver=null;
  function drawBrisas(list,see,t){
    if(!see(brisasSite.center,235)&&!see(club.celia,87))return;
    if(!brisasModels){BayBrisas.install(model);brisasModels=true;}
    BayBrisas.world(list,see,t,club,view);
    if(club.seat<.999||!see(gold,62))return;
    if(!celiaDriver){celiaDriver=new BayPlayerMesh(BayBrisas.colors.celia,"local");BayBrisas.dress(celiaDriver,"celia");view.add("brisas-celia-driving",celiaDriver,true);}
    if(BayBrisas.pose(celiaDriver,club.celia,t,"ride"))view.updateAnimated("brisas-celia-driving");
    drawInSeat(list,"brisas-celia-driving",gold,-1);
  }
  const brisasFree=()=>play&&!heat&&!watchCrew.towing&&!cabs.booking&&!transit.engaged&&(!active||active.brisas);
  function brisasContact(){
    if(!brisasFree()||transfer)return "";
    if(onStreetFeet()&&(dist(hero,brisasSite.desk)<2.25||dist(hero,club.nico)<2.25||!club.celia.ride&&dist(hero,club.celia)<2.1))return "desk";
    if(car&&BayBrisasClub.switches(car)&&club.onPad(car))return "pad";
    return "";
  }
  function brisasEnroll(){active={brisas:true,job:brisasJob};waypoint=null;closePanel();lastHud=lastMap=-10;}
  function brisasSeen(){if(!save.brisas.seen){brisasEnv.sync();save.brisas.seen=true;save.brisas.rev++;persist();}}
  function brisasCard(kind){
    if(!brisasFree()||!club.ready(kind)||club.trip)return;
    if(car&&club.onPad(car)&&BayBrisasClub.switches(car)){
      if(car.flatSide){closePanel();note("Nico Paz","Bring four good tires. Portside can fix that flat.",3);return;}
      if(!club.enter(kind,car,brisasEnv))return;
      club.show.wide=true;brisasEnroll();return;
    }
    club.reserve=kind;brisasEnroll();speak("Nico Paz","Take the plum Solena. You'll find the stripe by my measuring stick. Stop straight on it and give me a signal.");
  }
  function brisasPanel(body,screen){
    const book=save.brisas,lib=BayBrisasClub;
    if(screen==="brisas-book"){
      for(const [id,cl] of Object.entries(lib.classes)){const r=book.classes[id];signedNote(body,r.wins+" signed · "+r.played+" run · Best "+r.best+"/100",cl.name);}
      const rolls=Object.entries(lib.courses).map(([id,c])=>c.name+" · "+book.cruises[id]).join("   /   ");
      signedNote(body,rolls,"Boulevard rolls");
      body.append(makeButton("Find the plum Solena",book.title?"Pink slip in your name.":"Club loaner. Return it to the switch yard.","Map",()=>clockPin({...plum,name:"Plum Solena 64"})),
        makeButton("Nico’s measuring apron","Marquee Street at Ocean Drive.","Map",()=>clockPin(brisasSite.marker)));return;
    }
    if(screen==="jobs"){
      signedNote(body,club.show?"Nico has your card on the clipboard.":club.trip?BayBrisasStreet.routeHint(club):"Bring a switch car to the apron on Marquee Street.","Las Brisas");
      body.append(makeButton("Back to town","Keep your place with the club.","Resume",closePanel),
        makeButton("Leave this run","Your signed cards and best height stay in the book.","Leave",()=>{dropJob();closePanel();}));return;
    }
    signedNote(body,"My sister brought that plum car here on four bald tires. If you can put air under two of them, you can keep the keys.","Nico Paz");
    if(club.trip){body.append(makeButton("Celia’s boulevard roll",BayBrisasStreet.routeHint(club),"Resume",closePanel));}
    else{
      for(const [id,c] of Object.entries(lib.classes)){
        const ok=club.ready(id),detail=id==="house"?"Front, rear, then a side. First signed card earns $95, the plum car and access to a switch kit at Portside.":"Two corners and a double front. $160 for the first signed card.";
        const b=makeButton(c.name,detail,ok?(brisasContact()==="pad"?"Run card":"Take card"):"Win First Switch",()=>brisasCard(id));b.disabled=!ok;body.append(b);
      }
      body.append(makeButton("Cruise with Celia Reyes",lib.courses[club.route].name+" · Follow the gold car and answer her salute at two curbs.","Join the roll",()=>{
        if(brisasFree()&&club.invite(car,brisasEnv))brisasEnroll();
      }));
      if(book.cruises.ribbon||book.cruises.coast){const id=club.route==="ribbon"?"coast":"ribbon";
        body.append(makeButton("Next roll · "+lib.courses[id].name,"Reserve Celia’s other route. Meet her at the yard when she’s back.","Book",()=>{if(brisasFree()&&club.invite(car,brisasEnv,id))brisasEnroll();}));
      }
    }
    body.append(makeButton("The switch book","Signed cards, club record and parking spot.","Read",()=>openPanel("brisas-book",true)));
  }
  function brisasKeys(code){
    const s=club.show;if(car&&!transfer&&/^(Digit|Numpad)[1-4]$/.test(code))return club.press(car,Number(code.at(-1))-1,brisasEnv);
    if(s){
      if(code==="KeyV"){s.wide=!s.wide;if(!s.wide)cameraSnap();return true;}
      if(code==="KeyE"){dropJob();return true;}
      if(code==="KeyF"&&s.stage==="result"){const k=s.kind;dropJob();brisasCard(k);return true;}
      return false;
    }
    if(code!=="KeyF")return false;
    const where=brisasContact();if(!where)return false;
    brisasSeen();
    if(where==="pad"&&club.trip?.stamps===3&&club.finishTour(car,brisasEnv)){active=null;return true;}
    if(where==="pad"&&club.reserve){brisasCard(club.reserve);return true;}
    openPanel("brisas");return true;
  }
  function brisasHint(){
    const s=club.show;
    if(s){contextHint(s.stage==="result"?"F":"V",s.stage==="result"?"Run it again  ·  E finish":"Change camera  ·  E leave the stripe");return true;}
    const where=brisasContact();
    if(where){contextHint("F",where==="desk"?"Talk to Nico · Las Brisas":club.trip?.stamps===3?"Hand in the boulevard card":club.reserve?"Signal Nico · "+BayBrisasClub.classes[club.reserve].name:"Nico’s measuring apron");return true;}
    if(car&&club.reserve&&club.onPad(car,false)){contextHint("","Stop between the chalk corners, facing along the stripe");return true;}return false;
  }
  const palmJob={id:"palm-pool",name:"The Palm house table",by:"Luz"};
  const palmMeshes=new Map(),palmHits={};let palmModels=false,palmContactId="luz";
  const palmPoint=(x,z)=>({x,z});
  const tableWalks=[...palmSite.nav,...[-1,1].flatMap(x=>[-1,1].map(z=>palmPoint(palmSite.table.x+x*1.32,palmSite.table.z+z*1.96)))];
  function palmWalk(a,b,v){
    const insideA=BayPalmDiner.contains(a.x,a.z),insideB=BayPalmDiner.contains(b.x,b.z);
    const walkLocal=(p,q)=>{
      const carsHere=cars.filter(c=>c!==v&&Math.abs(c.speed||0)<1&&c.x>Math.min(p.x,q.x)-5&&c.x<Math.max(p.x,q.x)+5&&c.z>Math.min(p.z,q.z)-5&&c.z<Math.max(p.z,q.z)+5);
      return recoveryWalkway(p,q,v,[],carsHere)||recoveryWalkway(p,q,v,tableWalks,carsHere);
    };
    if(insideA===insideB)return insideA||Math.max(dist(a,palmSite.door),dist(b,palmSite.door))<38?walkLocal(a,b):motorWalkway(a,b,v);
    const marks=insideA?[palmSite.inside,palmSite.outside,palmSite.sidewalk,b]:[palmSite.sidewalk,palmSite.outside,palmSite.inside,b];
    const path=[];let p=a;
    for(const q of marks){
      if(dist(p,q)<.07)continue;
      const leg=(dist(p,palmSite.door)>38||dist(q,palmSite.door)>38)?motorWalkway(p,q,v):walkLocal(p,q);
      if(!leg)return null;path.push(...leg);p=q;
    }
    return path;
  }
  function palmFree(){return play&&!heat&&!watchCrew.towing&&!cabs.booking&&!transit.engaged&&(!active||active.palm);}
  const palmEnv={hero,pos,ground:footLevel,driver:()=>car,transfer:()=>transfer,walk:palmWalk,stand:gullStand,door:doorPlan,
    clearFoot:p=>valid(p.x,p.z,.29),wet:()=>hours.rain>.18,rideOK:v=>v&&!v.serviceCar&&!v.meetCar&&!v.guestId&&!v.washGuest&&!v.recoveryOwner&&v!==wrecker&&(!v.stockId||!!gull.record(v)),
    waitTraffic(a,q,v){
      if(BayPalmDiner.contains(a.x,a.z))return false;
      const dx=q.x-a.x,dz=q.z-a.z,n=Math.hypot(dx,dz)||1,step=Math.min(n,.65);
      const p={x:a.x+dx/n*step,z:a.z+dz/n*step};
      return cars.some(o=>o!==v&&Math.abs(o.speed)>1.2&&Math.abs(o.x-a.x)<6&&Math.abs(o.z-a.z)<6&&BayDriving.clearance(o,p)<.64);
    },
    say:speak,message:(a,b)=>note(a,b,3),change(){lastHud=lastMap=-10;},save:persist,
    current(){try{const latest=JSON.parse(localStorage.getItem("sundownBay.v1"));if(syncPalm(latest)){note("Palm house card","The chalk card was updated in another window.",3);return false;}}catch{}return true;},
    pay(n){save.wallet+=n;save.paid++;sound.cue("paid");},
    sound(type,force,where){
      const r=dist(pos(),where);if(r>29||elapsed-(palmHits[type]??-2)<(type==="ball" ? .052 : .075))return;
      palmHits[type]=elapsed;sound.cue("pool-"+type,{force,distance:r});
    }
  };
  function palmContact(){
    if(!palmFree()||!onStreetFeet()||palm.match||palm.playerSeat)return null;
    const b=palmSite;
    if(BayPalmDiner.contains(hero.x,hero.z)){
      if(dist(hero,b.board)<1.95)return {id:"palm-card",hint:"Read the house card"};
      if(dist(hero,b.table)<2.60||dist(hero,b.rack)<1.7||palm.visit?.stage==="table"&&dist(hero,palm.visit.a)<2.3)
        return {id:"palm-table",hint:"Palm Diner · Play pool"};
      const seat=b.seats.find(s=>palm.seatFree(s)&&dist(hero,s.stand)<1.33);
      if(seat)return {id:"seat",seat,hint:seat.kind==="booth"?"Slide into the booth":"Take a seat"};
    }
    for(const id of BayPalmLeague.ids){const a=palm.byId[id];if(!a.ride&&dist(hero,palm.outdoor(a))<2.4){
      if(palm.visit&&palm.visit.a!==a)continue;
      return {id:"palm-local",a,hint:"Talk to "+a.name};
    }}
    return null;
  }
  function runPalm(style,a=palm.rival,resume=false){
    if(!palmFree()||!palm.start(style,a,palmEnv,resume))return false;
    active={palm:true,job:palmJob};waypoint=null;keys.clear();closePanel();resetPointer();lastMap=lastHud=-10;return true;
  }
  function invitePalm(id){
    if(!palmFree()||!palm.meet(id,palmEnv))return;
    save.palm.seen=true;persist();active={palm:true,job:palmJob};waypoint=null;closePanel();
  }
  function leavePalm(){
    palm.leave(palmEnv);if(!palm.visit&&active?.palm)active=null;keys.clear();cameraSnap();lastHud=lastMap=-10;
  }
  function palmPanel(body,screen){
    const book=save.palm,p=palm.visit,match=palm.match;
    if(screen==="jobs"&&(match||p)){
      if(match){body.append(makeButton("Back to the cloth",match.style==="practice"?"Free practice":match.a.name+" · "+(match.style==="full"?"House eight-ball":"Last three"),"Resume",closePanel),
        makeButton("Step away","A scored rack keeps the last settled shot on the house card.","Leave table",()=>{leavePalm();closePanel();}));}
      else body.append(makeButton("Pool with "+p.a.name,p.stage==="pickup"?p.a.name+" is waiting near "+BayPalmLeague.data[p.a.id].place+".":"Bring your guest to the house table on Ocean Drive.","Back to town",closePanel),
        makeButton("Call it a night","Say goodbye at the next safe stop.","Finish visit",()=>{dropJob();closePanel();}));
      return;
    }
    if(!book.seen){book.seen=true;persist();}
    if(screen==="palm-card"){
      const slate=document.createElement("div");slate.className="palm-slate";
      const title=document.createElement("strong");title.textContent="House eight-ball";slate.append(title);
      for(const id of BayPalmLeague.ids){const s=book.card[id],row=document.createElement("p"),label=document.createElement("span"),total=document.createElement("b");
        label.textContent=BayPalmLeague.data[id].name;total.textContent=s.wins+" W  /  "+s.losses+" L";row.append(label,total);slate.append(row);
        if(s.shortWins+s.shortLosses||s.best){const line=document.createElement("small");line.textContent="Last three · "+s.shortWins+" W / "+s.shortLosses+" L     Best run · "+s.best;slate.append(line);}}
      body.append(slate);signedNote(body,book.houseCue?"Honey-maple house cue · Yours":"Beat each regular over a full rack to take home the honey-maple house cue and $100.","Luz");
      for(const id of BayPalmLeague.ids.filter(id=>id!=="luz")){
        const a=palm.byId[id],s=book.card[id];
        body.append(makeButton(a.name+" · "+BayPalmLeague.data[id].place,
          s.rides?s.rides+" rides to the Palm · "+s.shortWins+" short-rack wins":"Pick them up in your car and bring them back for a game.",
          p?.a===a?"Locate":p||match?"Busy":"Call",()=>{if(p?.a===a)clockPin({...palm.outdoor(a),name:a.name});else if(!p&&!match)invitePalm(id);}));
      }
      body.append(makeButton("Palm Diner","Front doors on Ocean Drive, just north of the Marlin.","Set waypoint",()=>clockPin(palmPin)));return;
    }
    if(screen==="palm-local"){
      const a=palm.byId[palmContactId];signedNote(body,BayPalmLeague.data[a.id].hello,a.name);
      if(a===palm.luz||p?.a===a&&p.stage==="table")body.append(makeButton("Meet at the table","Find the green felt past the Palm’s front door.","Go",()=>clockPin({...palmSite.breaker,name:"Palm house table"})));
      else if(!p)body.append(makeButton("Give "+a.name+" a ride","Bring a car or walk together to the Palm for a game.","Invite",()=>invitePalm(a.id)));
      body.append(makeButton("The house card","Eight-ball wins and regulars.","Read",()=>openPanel("palm-card",true)));return;
    }
    const a=palm.rival,n=book.pending;
    if(n){
      const rival=palm.byId[n.id],here=rival===palm.luz||dist(palm.outdoor(rival),palmSite.table)<8;
      if(here)body.append(makeButton("Resume the rack",rival.name+" · "+n.shots+" shots played · "+(n.turn?rival.name+" shoots":"Your shot"),"Resume",()=>runPalm(n.type,rival,true)));
      else body.append(makeButton("Bring "+rival.name+" back",BayPalmLeague.data[rival.id].place+" · Your unfinished rack is here.","Call",()=>invitePalm(n.id)));
      body.append(makeButton("Clear the unfinished rack","Remove the saved position and start a fresh game.","Clear table",()=>{if(palm.clearRack(palmEnv))openPanel("palm-table",true);}));
    }else if(!p||p.stage==="table"){
      signedNote(body,a===palm.luz?"One solid, one stripe and the eight. My dad called that a lunch break. Full rack if you've got the afternoon.":BayPalmLeague.data[a.id].ride,a.name);
      body.append(makeButton("Last three with "+a.name,"A short rack. Make your group, then call the pocket for the eight. First win earns $25.","Play",()=>runPalm("short",a)),
        makeButton("House eight-ball","Fifteen balls and a clean break. Your first win against "+a.name+" pays $85 and signs the house card.","Play",()=>runPalm("full",a)));
    }else signedNote(body,p.a.name+" is on the way to the table.","Palm Diner");
    body.append(makeButton("Practice alone","Work on cuts and banks. The cloth is free.","Take a cue",()=>runPalm("practice",null)),
      makeButton("Read the house card","Luz, Val and Boone keep their results on the wall.","Standings",()=>openPanel("palm-card",true)));
  }
  function palmInput(code){
    const m=palm.match;
    if(m){
      if(code==="KeyE"){leavePalm();return true;}
      if(code==="KeyR"||code==="Escape"||code==="KeyJ"||code==="KeyM")return false;
      const g=m.rack;
      if(code==="KeyV"){m.camera=1-m.camera;return true;}
      if(code==="KeyF"&&m.stage==="result"){const style=m.style,a=m.a;leavePalm();runPalm(style,a);return true;}
      if(m.stage==="play"&&!g.turn){
        if(code==="Space")palm.charge();
        if(code==="KeyF"&&g.phase==="hand"&&g.place(m.hand.x,m.hand.z)){palm.settleTurn(m,palmEnv);palm.checkpoint(m,palmEnv);}
        if(code==="KeyQ")g.call((g.called+1)%6);
        else if(/^Digit[1-6]$/.test(code))g.call(Number(code.at(-1))-1);
      }return true;
    }
    if(palm.playerSeat){if(["KeyE","KeyF","Space"].includes(code))palm.playerSeat.out=true;return !["KeyR","Escape","KeyJ","KeyM"].includes(code);}
    if(code!=="KeyF")return false;
    const q=palmContact();if(!q)return false;
    if(q.id==="seat"){if(palm.sit(q.seat,palmEnv)&&!isTop())cameraRig.wantedYaw=q.seat.viewYaw;lastHud=-10;}
    else{if(q.a)palmContactId=q.a.id;openPanel(q.id);}return true;
  }
  function palmUpdate(dt){
    if(heat&&active?.palm){dropJob();return;}
    const m=palm.match;
    if(m?.stage==="play"&&!m.rack.turn){
      const side=Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft")),forward=Number(held("KeyW","ArrowUp"))-Number(held("KeyS","ArrowDown"));
      if(m.rack.phase==="hand"){
        const rate=(held("ShiftLeft","ShiftRight") ? .10 : .54)*dt;
        const bearing=m.camera?(isTop()?0:cam.yaw):-Math.PI/2,sn=Math.sin(bearing),cs=Math.cos(bearing);
        m.hand.x=clamp(m.hand.x+(forward*sn+side*cs)*rate,-.605,.605);m.hand.z=clamp(m.hand.z+(forward*cs-side*sn)*rate,-1.24,1.24);
      }else if(palm.canAim()&&m.draw==null){
        if(side)palm.aim(m.angle+side*dt*(held("ShiftLeft","ShiftRight") ? .075 : .87));
        if(forward)m.power=clamp(m.power+forward*dt*(held("ShiftLeft","ShiftRight") ? .065 : .48),.16,1);
      }
    }
    palm.step(dt,palmEnv);
    if(active?.palm&&!palm.match&&!palm.visit)active=null;
  }
  function palmPointer(ev,press=false){
    const m=palm.match;if(!m)return false;
    const g=m.rack;if(m.stage!=="play"||g.turn||m.queue||m.swing)return true;
    if(!isTop()&&m.camera===1&&!press&&g.phase==="aim"){palm.aim(m.angle+(ev.movementX||0)*(held("ShiftLeft","ShiftRight") ? .00065 : .0030));return true;}
    const q=BayPalmRoom.fromScreen(ev.clientX,ev.clientY,palmSite.table,cam,isTop(),innerWidth,innerHeight,!!m.camera);
    if(!q)return true;
    if(g.phase==="hand"){
      m.hand.x=clamp(q.x,-.63,.63);m.hand.z=clamp(q.z,-1.26,1.26);
      if(press&&g.place(m.hand.x,m.hand.z)){palm.settleTurn(m,palmEnv);palm.checkpoint(m,palmEnv);}return true;
    }
    if(press&&g.onBlack()){const i=BayPalmPool.pockets.findIndex(p=>dist(p,q)<.11);if(i>=0){g.call(i);return true;}}
    if(!press&&dist(q,g.cue)>.045)palm.aim(Math.atan2(q.x-g.cue.x,q.z-g.cue.z));
    if(press)palm.charge();return true;
  }
  function palmHint(){
    if(palm.match){contextHint("","");return true;}
    if(palm.playerSeat){contextHint("E","Stand up");return true;}
    const q=palmContact();if(q){contextHint("F",q.hint);return true;}
    if(palm.visit?.a.ride&&palm.visit.a.state==="in"){contextHint("","Let "+palm.visit.a.name+" take the passenger seat");return true;}
    return false;
  }
  function drawPalmScene(list,see,t,close=false){
    const houseVisible=see(palmSite.center,650),people=BayPalmRoom.nearPeople(palm,hero);
    if(!houseVisible&&!people.some(a=>see(a,85)))return;
    if(!palmModels){BayPalmDiner.install(model);BayPalmTable.install(model);BayPalmPlayers.install(model);palmModels=true;}
    const observer=pos();if(houseVisible){
      const state=BayPalmRoom.frameState(palm,observer);
      if(close&&!state.cutaway){model("palm-camera-walls",BayPalmDiner.streetShell);list.push(["palm-camera-walls",0,0,0]);}
      BayPalmDiner.world(list,see,t,hours,state);
      if(see(palmSite.table,60))BayPalmTable.world(list,palmSite.table,palm.balls,BayPalmRoom.opts(palm,!see(palmSite.table,21)));
    }
    for(const a of people){
      if(a===hero&&!close||!see(a,78))continue;
      const o=BayPalmRoom.poseOptions(palm,a,save.courts.equipped,personColors),id=o.role==="guest"?a.id:o.role;
      if(a!==hero&&!see(a,39)){if(!a.seat)BayPalmPlayers.far(list,a,o.role);continue;}
      const key=a===hero?playerModel:"palm-person/"+id;let mesh=a===hero?playerMesh:palmMeshes.get(id);
      if(!mesh){mesh=new BayPlayerMesh(o.colors||BayPalmPlayers.colors[o.role],"local");if(o.role!=="guest")BayPalmPlayers.dress(mesh,o.role);
        view.add(key,mesh,true);palmMeshes.set(id,mesh);}
      if(BayPalmPlayers.pose(mesh,a,t,a.action,o))view.updateAnimated(key);
      if(a.ride&&a.seat===1)drawInSeat(list,key,a.ride,1);
      else list.push([key,a.x,a.y+(a.motion.lift||0),a.z,a.yaw]);
      BayPalmPlayers.props(list,a,t,a.action,o,mesh);
    }
  }
  function stepRescue(dt){
    if(rescue.joined&&heat){dropJob();speak("Anaïs Park","We'll take it from here. Leave the unit by the curb.");}
    rescue.step(dt,rescueEnv);
    if(rescue.queued&&["ready","rest"].includes(rescue.phase)){
      if(!active&&!heat&&onStreetFeet()&&dist(hero,clinic.desk)<26){rescue.queued=false;joinRescue(true);}
      else rescue.queued=false;
    }
  }
  function rescueContact(){
    if(!onStreetFeet()||room||heat||active||watchCrew.towing||cabs.booking||transit.engaged)return "";
    if(dist(hero,clinic.desk)<2.35)return "clinic-desk";
    if([rescue.recovering,rescue.waiting].some(a=>a&&dist(hero,a)<2.35))return "recovered";
    if(["ready","outbound","scene","rear","sceneRoll","toPatient"].includes(rescue.phase)&&dist(hero,rescue.call.wait)<3.25)return "rescue-call";
    return "";
  }
  function joinRescue(desk){
    if(active||heat||!rescue.recruit(desk))return;
    active={job:{id:"rescue",name:"Rescue 4",by:"Anaïs Park"},rescue:true};waypoint=null;
    if(panel)closePanel();lastHud=lastMap=-10;
    speak(desk?"Cleo Moss":rescue.call.name,desk?"Keys are with Gil, out in the bay. Anaïs is riding up front.":rescue.call.ask);
  }
  function rescuePanel(b,screen){
    const l=rescue,c=l.call;
    if(active?.rescue){
      b.append(makeButton(c.name+" · "+c.place,rescueText(),"Resume",closePanel),
        makeButton("Hand the call back","Anaïs and Gil will finish the run. If you're at the wheel, stop and step out.","Leave crew",()=>{dropJob();closePanel();}));return;
    }
    if(screen==="rescue-call"){
      signedNote(b,c.ask,c.name);
      b.append(makeButton("Work with Rescue 4","Help Anaïs with the stretcher, then take the wheel to Palm County Clinic.","Join the crew",()=>joinRescue(false)));return;
    }
    signedNote(b,"The truck comes back through our north drive. Bring the stretcher straight through the big door. I'll be right here when you come in.","Cleo Moss · Receiving");
    if(l.phase==="ready"||l.phase==="rest")b.append(makeButton("Take the next call","Drive out with Anaïs and bring the patient back to receiving.","Join the crew",()=>joinRescue(true)));
    else b.append(makeButton(l.queued?"Release your place":"Wait for the next shift",l.queued?"Gil will keep the next shift.":"Rescue 4 is working at "+c.place+". Stay near the desk until it gets back.",l.queued?"Cancel":"Wait at the clinic",()=>{l.queued=!l.queued;closePanel();lastHud=-10;}));
    for(const q of BayRescue.cases)if(save.rescue.count[q.id]){
      signedNote(b,q.thanks,q.name+" · "+save.rescue.count[q.id]+" signed · Best ride "+save.rescue.best[q.id]+"/100");
    }
  }
  function rescueText(){
    const l=rescue;
    if(l.phase==="outbound"&&!l.manual)return "Stay with "+l.call.name+" · Rescue 4 is "+Math.round(dist(unit4,l.call))+" m out";
    if(l.phase==="return"&&car!==unit4||l.phase==="outbound"&&l.manual&&car!==unit4)return "Take the driver’s seat in Rescue 4";
    return l.instruction||"Anaïs and Gil are preparing the unit";
  }
  function rescueKeys(code){
    if(!active?.rescue){
      if(code!=="KeyF")return false;const here=rescueContact();if(!here)return false;
      if(here==="recovered"){const a=[rescue.recovering,rescue.waiting].find(a=>a&&dist(hero,a)<2.35),c=BayRescue.cases.find(p=>p.role===a.role);speak(a.name,c.thanks);}
      else openPanel(here);return true;
    }
    if(code==="KeyH"&&car===unit4&&rescue.traveling){unit4.responseLights=!unit4.responseLights;lastHud=-10;return true;}
    if(code==="KeyE"&&rescue.holding){rescue.holding=false;rescue.rolling=0;motion.handTarget=null;lastHud=-10;return true;}
    if(["Space","KeyG","KeyK"].includes(code)&&rescue.holding)return true;
    if(code!=="KeyF")return false;
    if(!rescue.action(rescueEnv)&&!transfer){
      if(rescue.traveling&&rescue.manual&&car===unit4)note("Rescue 4","Stop within the marked bay, facing "+(rescue.goal.yaw===0?"north":"south")+".",2.2);
      else if(!rescue.holding)note("Anaïs Park",rescueText(),2.35);
    }lastHud=-10;return true;
  }
  function rescueHud(){
    const l=rescue,p=l.phase,contact=rescueContact();
    if(!active?.rescue){
      if(contact==="clinic-desk")contextHint("F",l.queued?"Your next shift · Talk to Cleo":"Receiving · Talk to Cleo");
      else if(contact==="recovered")contextHint("F","Visit "+[l.recovering,l.waiting].find(a=>a&&dist(hero,a)<2.35).name);
      else if(contact)contextHint("F",l.call.name+" · Wait with them for Rescue 4");
      else if(!active&&!transfer&&car&&unit4.responseLights&&dist(car,unit4)<38){contextHint("","Rescue 4 approaching · Leave a lane open");return true;}
      else return false;return true;
    }
    if(transfer){contextHint("","Rescue 4 · Driver's door");return true;}
    if(car===unit4){const parked=!l.traveling;contextHint(parked?"E":l.canPark()?"F":"H",parked?"Step out and meet Anaïs at the back":l.canPark()?"Set the brake and park":"Response lights and siren "+(unit4.responseLights?"on":"off")+" · H to switch");}
    else if(l.pushing){
      const can=l.holding&&dist(l.cot,l.cotGoal(rescueEnv))<(p==="toTruck"?2.35:1.95);
      contextHint(l.holding?can?"F":"W/S":l.canRoll(rescueEnv)?"F":"",l.holding?can?(p==="toPatient"?"Help the patient onto the stretcher":p==="toTruck"?"Load the stretcher":"Hand over to receiving"):"Push or reverse · A/D steer · E let go":l.canRoll(rescueEnv)?"Take the stretcher handles":"Walk to the foot of the stretcher");}
    else if(["rear","clinicRear"].includes(p))contextHint("F","At the rear doors · Roll out the stretcher");
    else if(l.access())contextHint("E","Take the driver's seat on the left");
    else contextHint("",rescueText());
    return true;
  }
  const rescueMeshes=new Map();let clinicArtReady=false,unitArtReady=false,rescueZoom=0;
  function drawRescue(list,see,t){
    if(see(clinic.center,170)){if(!clinicArtReady){BayPalmClinic.install(model);clinicArtReady=true;}BayPalmClinic.world(list,see,t,hours,!!rescue.recovering,save.rescue);}
    if(!unitArtReady&&see(unit4,165)){BayAmbulanceArt.install(model);unitArtReady=true;}
    const l=rescue,crew=BayRescueCrew,patient=l.patient;
    const actors=[l.medic,l.driver,l.dispatcher,l.nurse];
    if(l.bodyVisible)actors.push(patient);
    if(l.recovering&&(!l.bodyVisible||l.recovering!==patient))actors.push(l.recovering);
    if(l.waiting&&!actors.includes(l.waiting))actors.push(l.waiting);
    const cot=l.cot,visibleCot=(cot.fold<.995||unit4.rearOpen>.01)&&see(cot,49);
    if(!visibleCot&&!actors.some(a=>a&&see(a,59)))return;
    if(!l.artReady){crew.install(model);l.artReady=true;}
    if(visibleCot)crew.cotWorld(list,cot,t,see(cot,26));
    for(const a of actors){
      if(!a||!see(a,59)||a.seatMode==="back"&&unit4.rearOpen<.2||a.seatMode&&insideSeat()&&car===unit4&&a.seatMode==="left")continue;
      const key="bay-rescue/"+a.role+(a===l.recovering?"/receiving":a===l.nurse?"/nurse":""),action=a.action||"idle";
      let mesh=rescueMeshes.get(key);
      if(!mesh){mesh=new BayPlayerMesh(crew.colors[a.role],"local");crew.dress(mesh,a.role);view.add(key,mesh,true);rescueMeshes.set(key,mesh);}
      if(crew.pose(mesh,a,t,a.role,action,cot,action==="transfer"?l.progress:a.progress||0))view.updateAnimated(key);
      list.push([key,a.x,a.y,a.z,a.yaw]);crew.props(list,a,t,a.role,action,cot,mesh);
    }
  }
  const atNeonBench=()=>onStreetFeet()&&!heat&&!active&&!cabs.booking&&!watchCrew.towing&&(dist(hero,neon.vera)<2.65||dist(hero,neon.bench)<2.8);
  const atNeonBoard=()=>freeFeet()&&roofs.level==="roof"&&!roofs.action&&dist(hero,neon.console)<2.18;
  const atNellie=()=>freeFeet()&&!roofs.action&&Math.abs(hero.y-neon.guest.y)<.55&&dist(hero,neon.guest)<2.0;
  const stairFoot={x:130.25,z:-59.30,y:.076,kind:"sign-shop",name:"Marlin south stairs"};
  function neonTarget(){
    const end=neon.shift.stage==="proof";
    if(!roofs.raised)return end?{...neon.vera,name:"Vera at the curb",kind:"sign-shop"}:stairFoot;
    const west=roofs.level==="annex"||roofs.level==="loading",l=BayRooftops.ladders[west?1:0];
    if(end){
      if(roofs.level==="roof"||roofs.level==="penthouse"){
        const next=BayRooftops.ladders.reduce((a,b)=>Math.hypot(hero.x-a.topX,hero.z-a.z)<Math.hypot(hero.x-b.topX,hero.z-b.z)?a:b);
        return {x:next.topX,z:next.z,y:12.07,name:"Top of the "+next.name,kind:"sign-shop"};
      }
      return {...neon.vera,name:"Vera at the curb",kind:"sign-shop"};
    }
    if(roofs.level==="stairs"||roofs.level==="gallery"||west)return {...l,y:l.base,name:l.name,kind:"sign-shop"};
    return neon.console;
  }
  const roofEnv={cars,roofBoxes,ground:footLevel,groundClear(x,z,except,leavingSteps=false){
    if(!valid(x,z,.33)||(!leavingSteps&&stairBlocks.some(o=>Math.abs(x-o.x)<o.w/2+.19&&Math.abs(z-o.z)<o.d/2+.19)))return false;
    for(const v of cars)if(v!==except&&Math.abs(v.x-x)<4&&Math.abs(v.z-z)<4&&BayDriving.clearance(v,{x,z})<.24)return false;
    for(const v of patrol)if(Math.abs(v.x-x)<4&&Math.abs(v.z-z)<4&&BayDriving.clearance(v,{x,z})<.26)return false;
    return true;
  }};
  function canTraverse(){return freeFeet()&&!neon.testing&&!active?.take&&!active?.wash&&!active?.dash&&!active?.bridge&&!exchangingKey()&&!listening()&&motion.jumpTime<0;}
  function neonWork(id){
    if(panel!=="neon-bench"||!atNeonBench()||!neon.begin(id))return;
    const d=BayMarlinNeon.find(id);active={job:neonJob,neon:true};waypoint=null;
    closePanel();lastHud=lastMap=-10;speak("Vera Cordero",d.line+" Take the south stairs. The ladder is on the guest gallery.");
  }
  function neonAction(){
    if(active?.neon&&atNeonBoard()&&neon.operate()){
      const p=neon.service;hero.yaw=Math.atan2(neon.console.x-p.x,neon.console.z-p.z);motion.vx=motion.vz=0;
      lastHud=-10;return true;
    }
    if(active?.neon&&neon.shift.stage==="proof"&&onStreetFeet()&&dist(hero,neon.vera)<3){
      const r=neon.finish();active=null;save.wallet+=r.pay;save.paid++;persist();sound.cue("paid");lastHud=lastMap=-10;
      speak("Vera Cordero","Look at that. Five letters, right on the chase. I’m leaving yours on tonight.");
      note("Vacancy in Lights",BayMarlinNeon.find(r.id).name+"  ·  "+r.score+"% alignment  ·  "+cash(r.pay),4.8);return true;
    }
    if(atNeonBench()){openPanel("neon-bench");return true;}
    if(atNellie()){
      const w=neon.guest;w.wait=Math.max(2.3,w.wait);
      speak(w.name,save.neon.orders?"Vera changed the lights. I can see the colors on my curtains.":w.y>2?"Best view on Ocean Drive costs the price of this coffee.":"The stairs are around the south end. You can see the whole bay from up there.");return true;
    }
    return false;
  }
  function stepNeon(dt){
    if(active?.neon&&heat){dropJob();note("Vera Cordero","Come back to the bench when the street is quiet.",3.5);}
    const w=neon.shift,was=neon.testing,x=neon.guest.x,z=neon.guest.z;
    neon.step(dt,streetTime,hours,{left:held("KeyA","ArrowLeft"),right:held("KeyD","ArrowRight"),press:held("Space")},(x,z)=>{
      for(const v of cars)if(Math.abs(v.x-x)<3.8&&Math.abs(v.z-z)<3.8&&BayDriving.clearance(v,{x,z})<.30)return true;
      return false;
    });
    guestMotion.step(dt,Math.hypot(x-neon.guest.x,z-neon.guest.z),0);
    if(was&&!neon.testing&&w?.stage==="proof"){
      sound.cue("job");speak("Vera Cordero","I see it from here. Come down and look at what you made.");lastHud=-10;
    }
  }
  const transitFree=()=>onStreetFeet()&&!active&&!heat&&!cabs.booking&&!watchCrew.towing;
  const routeStop=()=>transitFree()?transit.near(hero):null;
  const busCameras=()=>transit.player?.stage==="ride"&&transit.inside;
  function chooseTransit(s,role){
    if(!transitFree()||transit.near(hero)!==s)return;
    closePanel();waypoint=null;
    if(transit.docked(s)){
      if(!transit.board(transitEnv,role))speak("Marta Leal","Meet me on the sidewalk by the front door.");
    }else{
      transit.flagAt(s,role,true);note("Route 6",s.short+"  ·  Waiting for Marta Leal",2.7);
    }
    lastHud=lastMap=-10;
  }
  function busClear(v,x,z,yaw,oldYaw=v.yaw){
    if(!fitsCar(v,x,z,yaw))return false;
    const p={x,z,yaw,kind:v.kind,footprint:v.footprint},before=oldYaw===v.yaw?v:{...v,yaw:oldYaw};
    if(boatTrailerBlocks(p,before))return false;
    for(const group of [cars,patrol])for(const q of group){
      if(Math.abs(x-q.x)>8||Math.abs(z-q.z)>8)continue;
      const hit=BayDriving.contact(p,q);
      if(hit){
        const prior=BayDriving.contact(before,q);
        // A turning car can brush the flank of a stopped bus. Let parallel movement clear that contact.
        if(!prior||hit.depth>prior.depth+.000001)return false;
      }
    }
    if(onStreetFeet()&&Math.abs(hero.x-x)<6&&Math.abs(hero.z-z)<6&&BayDriving.clearance(p,hero)<.27&&BayDriving.clearance(p,hero)<BayDriving.clearance(v,hero))return false;
    return true;
  }
  function busGap(v,yaw,remaining,line){
    const sn=Math.sin(yaw),cs=Math.cos(yaw);let space=Infinity,stuck=null;
    function obstacle(q,width,buffer){
      const dx=q.x-v.x,dz=q.z-v.z;if(Math.abs(dx)>27||Math.abs(dz)>27)return;
      const along=dx*sn+dz*cs,side=dx*cs-dz*sn;
      if(along>.02&&Math.abs(side)<width&&along-buffer<space){space=Math.max(0,along-buffer);stuck=q;}
    }
    for(const q of cars)obstacle(q,2.14,6.68);
    if(works&&dist(v,works.trailer)<36){
      const t=works.trailer;obstacle(t,2.78,7.45);obstacle(BaySlipTrailer.coupler(t),2.05,6.3);
      for(const p of t.sweep())obstacle(p,2.74,7.4);
    }
    for(const q of patrol)obstacle(q,2.24,6.74);
    for(const w of walkers)if(!w.palmPassenger&&!w.startle)obstacle(w,1.25,4.9);
    if(onStreetFeet())obstacle(hero,1.39,5.10);
    let pass=false;
    if(stuck?.kind&&space<9&&remaining>17&&(line.block>2.1||(!stuck.path&&!stuck.serviceCar&&!stuck.guestId&&Math.abs(stuck.speed)<.55))){
      const side=BayDriving.world(v,-2.80,4.4);
      if(busClear(v,side.x,side.z,yaw)){pass=true;space=Math.max(space,3.20);}
    }
    for(const s of BayStreetArt.signals){
      const x=s.x-v.x,z=s.z-v.z,d=x*sn+z*cs;
      if(d>8.1&&d<30&&Math.abs(x*cs-z*sn)<4.5&&(Math.abs(cs)>.7)!==((streetTime+s.offset)%14<7)){
        space=Math.min(space,Math.max(0,d-11.1));pass=false;
      }
    }
    return {space,pass};
  }
  function driveTransit(dt,line){
    const v=line.bus,oldYaw=v.yaw,oldSpeed=v.speed;
    for(const other of crashContacts.keys())if(dist(v,other)>8)crashContacts.delete(other);
    const road=nearStreet(v.x,v.z)?1:.81;
    const steer=Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    BayDriving.step(v,dt,held("KeyW","ArrowUp"),held("KeyS","ArrowDown"),steer,held("Space"),road*(1-hours.wet*.13),false);
    const x=v.x+v.vx*dt,z=v.z+v.vz*dt;
    if(busClear(v,x,z,v.yaw,oldYaw)){v.x=x;v.z=z;return;}
    const probe={...v,x,z};
    for(const group of [cars,patrol])for(const other of group){
      if(Math.abs(x-other.x)>8||Math.abs(z-other.z)>8)continue;
      const hit=BayDriving.contact(probe,other);if(!hit)continue;
      const {nx,nz,depth}=hit,inward=-(v.vx*nx+v.vz*nz);
      if(inward>2.2)continue;
      const clear=Math.min(.14,depth+.004),sx=x+nx*clear,sz=z+nz*clear;
      if(!busClear(v,sx,sz,v.yaw,oldYaw))continue;
      v.x=sx;v.z=sz;v.vx+=nx*Math.max(0,inward);v.vz+=nz*Math.max(0,inward);
      BayDriving.signedSpeed(v);return;
    }
    if(Math.abs(oldSpeed)>2&&bumpLock<=0){
      line.shift.rough=Math.min(14,line.shift.rough+Math.min(7,Math.abs(oldSpeed)*.48));
      const q=cars.find(q=>dist(q,probe)<8&&BayDriving.contact(probe,q));
      if(q){dent(q,v.vx,v.vz,Math.abs(oldSpeed));q.wait=Math.max(1,q.wait||0);reportCrash(q,Math.abs(oldSpeed),Math.abs(oldSpeed));}
      sound.cue("hit");bumpLock=.65;
    }
    v.yaw=oldYaw;BayDriving.settle(v);v.brakes=1;
  }
  function transitExit(b,z){
    for(const along of [z,z+.45,z-.45])for(const side of [2.35,2.72,1.91]){
      const q=BayDriving.world(b,side,along),mid=BayDriving.world(b,1.60,along);
      if(!valid(q.x,q.z,.31)||!valid(mid.x,mid.z,.20))continue;
      if(cars.some(v=>Math.abs(v.x-q.x)<4&&Math.abs(v.z-q.z)<4&&BayDriving.clearance(v,q)<.36))continue;
      return {...q,y:footLevel(q.x,q.z)};
    }
    return null;
  }
  const transitEnv={hero,motion,walkPace:p=>rainWalk.pace(p,hero),free:transitFree,ground:footLevel,drive:driveTransit,safe:busClear,gap:busGap,exit:transitExit,
    rejoin(b,s){const r=chase.road(b),dir=r.vertical?(Math.cos(b.yaw)>=0?0:2):(Math.sin(b.yaw)>=0?1:3);
      return {at:0,path:BayCab.route({x:b.x,z:b.z,dir},s.berth)};},
    line(name,line){if(transit.player||transit.flag)speak(name,line);},
    cue(name){sound.cue(name,{distance:dist(pos(),transit.bus)});},
    save(){persist();},pay(pay,score,s){save.wallet+=pay;save.paid++;persist();lastHud=-10;
      note("Route 6  ·  Trip signed",s.short+"  ·  "+score+"% smooth stop  ·  "+cash(pay),4.2);
      speak("Marta Leal","That’s your trip signed. Take us to the next stop, or I can drive from here.");sound.cue("paid");},
    left(stamp){lastHud=lastMap=-10;cameraSnap();
      if(stamp)note("Transfer punched",stamp.short+"  ·  "+save.transit.stamps.length+" of 4 stops",3.4);}
  };
  function transitKeys(code){
    const p=transit.player;
    if(p){
      if(code==="KeyE")transit.wantOut(transitEnv);
      if(code==="KeyF"&&p.stage==="ride"){if(transit.shift)transit.takeDoors(transitEnv);else transit.ring(transitEnv);}
      if((code==="KeyV"||code==="KeyZ")&&p.stage==="ride"){
        transit.inside=!transit.inside;transit.pan=p.role==="driver"?0:.52;transit.tilt=-.07;
        if(!transit.inside)cameraRig.reset(transit.bus,transit.bus.yaw+.52);
      }
      if(code==="KeyX"){transit.pan=p.role==="driver"?0:.52;transit.tilt=-.07;cameraRig.recenter(transit.bus.yaw,elapsed);}
      if(code==="KeyH"&&transit.driving)sound.cue("horn",{kind:"van"});
      if(!["KeyM","KeyJ","Escape","KeyR","Equal","Minus","NumpadAdd","NumpadSubtract"].includes(code)){lastHud=-10;return true;}
    }else if(transit.flag){
      if(["KeyE","KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight","Space"].includes(code)){transit.cancelFlag();lastHud=-10;return code==="KeyE";}
    }else if(code==="KeyE"||code==="KeyF"){
      const s=routeStop();if(s){
        if(code==="KeyF")openPanel("route-six");else if(transit.docked(s))chooseTransit(s,"rider");else return false;
        return true;
      }
      if(code==="KeyF"&&transitFree()){
        const local=transit.people.find(q=>["wait","work","street","back"].includes(q.stage)&&dist(hero,q)<1.95);
        if(local){speak(local.name,local.stage==="work"?local.thanks:local.hello);return true;}
      }
    }
    return false;
  }
  const atBridge=()=>onStreetFeet()&&!heat&&dist(hero,bridgeSite)<2.85&&BayDrawbridge.local(hero.x,hero.z).u>6.35;
  const bridgeLook=()=>active?.bridge&&atBridge()&&held("KeyV");
  const leverFeet=BayDrawbridge.at(-15.86,7.3);
  const bridgeEnv={
    lever:()=>!!active?.atLever&&dist(hero,leverFeet)<.20,
    holding:()=>held("Space"),
    atDesk:()=>!room&&!car&&!skiff&&!swim&&dist(hero,bridgeSite)<.86,
    lookout:()=>skiff||(!room&&swim&&swim.depth<1.8?hero:null),
    roadUser(){
      if(!skiff&&!swim&&!room&&bridge.onRoad(pos(),car?2.1:.48))return car?"your car":"the crossing";
      if(bridge.onRoad(bridge.walker,.45))return "Caro";
      for(const v of cars)if(bridge.onRoad(v,bayCarLayout(v.kind).halfLength))return v===personalCar?"your parked car":"the "+genres[v.kind].name;
      for(const v of patrol)if(bridge.onRoad(v,2.2))return "the patrol car";
      for(const b of cycles.bikes)if(bridge.onRoad(b,.8))return "the bicycle";
      return "";
    },
    waterUser(){
      if(bridge.inWaterGate(bridge.packet,bridge.packet.halfLength))return "June Bug";
      if(bridge.inWaterGate(skiff,2.8)||boats.some(v=>v!==skiff&&bridge.inWaterGate(v,2.8)))return "the skiff";
      if(harbor.units.some(u=>bridge.inWaterGate(u,2.8)))return "the harbor launch";
      return "";
    },
    signal(){
      const distance=dist(pos(),bridge.packet);if(!room)sound.cue("packet-whistle",{distance});
      if(active?.bridge&&bridge.phase==="road")speak("June Bug","Salt Creek, this is June Bug. One opening, please.");
    },
    finish(entry){
      if(!active?.bridge)return;
      save.bridge.count++;save.bridge.log.push(entry);save.bridge.log=save.bridge.log.slice(-5);
      save.bridge.best=Math.min(save.bridge.best??Infinity,entry.delay);save.wallet+=entry.pay;save.paid++;
      active=null;motion.handTarget=null;persist();lastHud=lastMap=-10;sound.cue("paid");
      note("Salt Creek · Watch signed",cash(entry.pay)+"  ·  "+(entry.direction==="in"?"Ice run up the creek":"Empty totes out to the bay"),4.6);
      speak("Inez Soria","There goes the first car. Put your name beside mine in the book.");
    }
  };
  function takeBridgeWatch(){
    if(panel!=="bridge-house"||!atBridge()||active||!bridge.start())return;
    active={job:bridgeJob,bridge:true};waypoint=null;closePanel();lastHud=lastMap=-10;
    cameraRig.recenter(Math.atan2(bridge.packet.x-hero.x,bridge.packet.z-hero.z),elapsed);
    speak("Inez Soria",bridge.phase==="road"?"You’ve got the board. June Bug whistles at the channel marks.":"I’ve got this opening. Watch how she clears the fender. The next one’s yours.");
  }
  function bridgeAction(){
    if(skiff&&bridge.canHail(skiff)&&!active?.regatta&&!active?.ferry){
      bridge.hail(skiff);note("Salt Creek radio",bridge.phase==="water"?"Pass between the green lamps.":"Inez has your call. Hold outside the fenders.",3.8);return true;
    }
    if(atBridge()&&!cabs.booking&&!watchCrew.towing){
      if(!active){openPanel("bridge-house");return true;}
      if(active.bridge){if(!bridge.action())speak("Inez Soria",bridge.instruction());lastHud=-10;return true;}
    }
    if(onStreetFeet()&&!active&&dist(hero,bridge.walker)<2.3){
      speak("Caro Díaz",bridge.phase==="road"?"I walk the causeway to see what’s coming up Salt Creek. That old green boat brings our ice.":"The minute the gates go up, every driver remembers they’re late.");return true;
    }
    if(onStreetFeet()&&dist(hero,BayDrawbridge.iceCounter)<2.45){
      const p=bridge.packet;
      speak("Leda Vale",p.u< -32&&p.wait>0?"Mind the sling. That’s today’s ice coming down.":p.direction<0?"June Bug’s bringing the ice in. You’ll see her mast first.":save.bridge.count?"Inez put your name in the log. Thanks for getting the ice through.":"Those empty fish totes go right back to the scow.");
      return true;
    }
    return false;
  }
  function stepBridge(dt){
    if(active?.bridge&&(heat||!onStreetFeet()&&motion.jumpTime<0||dist(hero,bridgeSite)>14)){
      dropJob();speak("Inez Soria","I’ve got the board. Come back for another watch.");
    }
    if(active?.bridge){
      const canGrip=bridge.owned&&(bridge.phase==="warning"&&bridge.gateReady||bridge.phase==="raising"||bridge.phase==="water"&&bridge.sternClear||bridge.phase==="lowering");
      active.atLever=!!(canGrip&&atBridge()&&held("Space")&&!held("KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"));
      if(active.atLever){
        const x=hero.x,z=hero.z,d=dist(hero,leverFeet),fraction=Math.min(1,dt*2.1/Math.max(.001,d));
        tryMove(hero,(leverFeet.x-x)*fraction,(leverFeet.z-z)*fraction,.34);
        hero.yaw+=angle(hero.yaw,BayDrawbridge.heading)*-Math.expm1(-11*dt);hero.y=footLevel(hero.x,hero.z);
        motion.vx=motion.vz=0;motion.step(dt,Math.hypot(hero.x-x,hero.z-z),0);
      }
      const h=motion.handTarget;
      const weight=ease(h?.weight||0,active.atLever&&dist(hero,leverFeet)<.26?1:0,12,dt);
      if(weight>.008){
        const a=-.80+1.40*bridge.lift,grip=BayDrawbridge.at(-16+.428+.203*Math.sin(a),7.3+.218);
        const to=BayDriving.local(hero,grip.x,grip.z);motion.handTarget={...to,y:1.83+1.022+.203*Math.cos(a)-hero.y,weight};
      }else motion.handTarget=null;
    }
    bridge.step(dt,bridgeEnv);
  }
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
    if(save.fieldQueue&&(car||skiff)&&!room&&!transfer&&!deckStep&&BayAirwaves.stationFor(receiverId())==="sol"){
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
  const atGuestParking=()=>play&&!active&&!heat&&!transfer&&!room&&car&&!car.meetCar&&!car.guestId&&(!car.stockId||!!gull.record(car))&&Math.hypot(car.vx,car.vz)<.55&&BayMotelParking.inside(car);
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
    if(dist(room,BayCourtBench.roomPin)<Math.min(best,1.05))nearest="rack";
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
      if(action==="exit")leaveRoom();else if(action==="seat"){BayCineRoom.seat(room);if(room.cuedReel){
        const reel=room.cuedReel,bill=BayCineProgram.describe(filmOptions()),index=bill.findIndex(r=>r.id===reel);
        if(index>=0)projectionStart=streetTime+.48-bill.slice(0,index).reduce((sum,r)=>sum+r.seconds,0);
        room.cuedReel=null;
      }}else if(action==="rise")BayCineRoom.rise(room);
      else if(action==="program")openPanel("cine-program");lastHud=-10;return;
    }
    if(action==="door")leaveRoom();
    else if(action==="bed"||action==="desk"||action==="rack")openPanel("room-"+action);
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
    if(motos.player||motos.job?.swapping||roofs.raised||transit.aboard||rescue.holding)return null;
    if(gull.exchange||gull.request)return null;
    if(active?.gull&&gull.drive){const v=gull.drive.v;return dist(hero,v)<5.1&&gull.keyFor(v)&&gull.drive.phase!=="receipt"?v:null;}
    if(active?.rescue)return rescue.access()&&dist(hero,unit4)<5.7?unit4:null;
    if(swim||cabs.playerHeld||cycles.riding||boardwalk.player)return null;
    let best=null,d=5.1;
    for(const v of cars){const n=dist(hero,v);if(v!==otherCar&&gull.keyFor(v)&&v!==gull.reclaim?.v&&!v.meetCar&&!v.serviceCar&&!v.washGuest&&!v.onLift&&!v.recoveryOwner&&!roadDrivers.get(v)?.seated&&recovery.onBench?.car!==v&&valet.accessible(v)&&(!active?.valet||valet.focus?.car===v)&&!["return","approach","in","out"].includes(v.owner?.phase)&&n<d&&(!v.path||v.speed<4)){best=v;d=n;}}
    return best;
  }
  function returnJuneDemo(){
    if(save.juneReturned||!save.tapes.includes(0))return false;
    save.juneReturned=true;save.wallet+=35;persist();
    sound.cue("paid");note("Motel demo","June slipped you $35.",3.4);
    return true;
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
      text=returnJuneDemo()?"There it is! That's my brother on drums. Here, let me buy you dinner.":
        "Side A is the band. Side B is eight minutes of my dad asking if it's recording.";
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
    for(const p of walkers){if(!p.palmPassenger&&dist(p,car)<16){p.alert=1.35;p.gesture=1;p.yaw=Math.atan2(car.x-p.x,car.z-p.z);}}
    for(const v of cars){if(v!==car&&v.path&&dist(v,car)<9){v.wait=Math.max(v.wait,.42);}}
  }
  const byCinema=()=>onStreetFeet()&&!active&&!heat&&dist(hero,BayCab.cinema)<2.3;
  let projectionStart=streetTime,lateReelListed=!!save.cab.reel;
  const filmOptions=()=>({windows:negatives.reel,location:unit.film.pinned,stunt:save.stunt,skate:skateReel,edition:save.edition,second:!!save.cab.reel,
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
    obstacle(transit.bus,2.08,6.50);
    for(const q of patrol)obstacle(q,1.87,4.80);
    for(const q of walkers)if(!q.palmPassenger)obstacle(q,.98,2.35);
    if(!car&&!room&&!cabs.playerHeld&&!windowRide?.held)obstacle(hero,1.08,2.45);
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
  function cabBerth(stop,approaching,vehicle=taxi){
    for(const along of [0,-5.4,5.4,-7.2,7.2]){
      const x=stop.x+Math.sin(stop.yaw)*along,z=stop.z+Math.cos(stop.yaw)*along;
      if(along&&approaching&&((x-approaching.x)*Math.sin(stop.yaw)+(z-approaching.z)*Math.cos(stop.yaw)<2.2||dist({x,z},stop.stand)>9.1))continue;
      const pose={kind:vehicle.kind,x,z,yaw:stop.yaw};
      if(fitsCar(vehicle,x,z,stop.yaw)&&!cars.some(v=>v!==vehicle&&dist(v,pose)<6&&BayDriving.contact(pose,v))){
        return along?{...stop,x,z}:stop;
      }
    }
    return stop;
  }
  const cabEnvironment={hero,motion,ground:footLevel,door:doorPlan,clearance:cabClearance,berth:cabBerth,
    hail:p=>!active&&!cabs.booking&&!heat&&!room&&elapsed>speechTill+1&&
      (onStreetFeet()?dist(p,hero)<3.4:car&&!transfer&&Math.abs(car.speed)<3.5&&dist(car,p)<9),
    nearCurb:v=>BayCab.streetStop(v,chase.road(v))||{id:"roadside",name:"Roadside",stand:BayDriving.world(v,2.1,-1)}};
  const windowEnv={hero,motion,driver:otherBody,ground:footLevel,clearance:crewRoadClear,settle:settleAtCurb,curb:windowLayby,exitClear:v=>!!doorPlan(v,true,hero,1)};
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
    if(!v||v.stockId&&!gull.record(v)||v===wrecker||v.path||v.kind==="cruiser"||v.meetCar||v.serviceCar||v.guestId||roadDrivers.get(v)?.seated||recovery.onBench?.car===v)return false;
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
  function recoveryWalkway(a,b,v,via=[],nearby=null){
    const obstacles=[v,wrecker,...(nearby||[])].filter((o,i,list)=>o&&list.indexOf(o)===i);
    const footRadius=nearby ? .29 : .23,carGap=nearby ? .28 : .21;
    // A long walk checks thousands of points. Each 12 m square only needs the
    // buildings and parked vehicles whose footprints can reach that square.
    const cells=new Map(),vehicles=obstacles.map(v=>{const s=v.footprint||bayCarLayout(v.kind);return {v,r:Math.hypot(s.track,s.halfLength)+carGap};});
    function clear(x,z){
      const i=Math.floor(x/12),j=Math.floor(z/12),key=i*1024+j;let cell=cells.get(key);
      if(!cell){
        const cx=i*12+6,cz=j*12+6,span=6+footRadius;
        const blocks=solids.filter(o=>Math.abs(o.x-cx)<=o.w/2+span&&Math.abs(o.z-cz)<=o.d/2+span);
        const cars=vehicles.filter(o=>Math.abs(o.v.x-cx)<=6+o.r&&Math.abs(o.v.z-cz)<=6+o.r);
        cell={blocks,cars};cells.set(key,cell);
      }
      return valid(x,z,footRadius,cell.blocks)&&(!BayRooftops.near(x,z)||stairBlocks.every(o=>Math.abs(x-o.x)>=o.w/2+footRadius||Math.abs(z-o.z)>=o.d/2+footRadius))&&
        cell.cars.every(o=>BayDriving.clearance(o.v,{x,z})>carGap);
    }
    const nodes=[a,b,...via.filter(n=>clear(n.x,n.z))];
    for(const o of obstacles){
      const s=o.footprint||bayCarLayout(o.kind);
      for(const x of [-s.track-.52,s.track+.52])for(const z of [-s.halfLength-.54,s.halfLength+.54]){
        const q=BayDriving.world(o,x,z);if(clear(q.x,q.z))nodes.push(q);
      }
    }
    const visited=new Set(),cost=nodes.map(()=>Infinity),estimate=nodes.map(p=>dist(p,b)),prev=[];cost[0]=0;
    for(;;){
      let i=-1,priority=Infinity;
      for(let j=0;j<nodes.length;j++)if(!visited.has(j)&&cost[j]+estimate[j]<priority){i=j;priority=cost[j]+estimate[j];}
      if(i<0)return null;
      if(i===1){const path=[];for(let j=1;j!==0;j=prev[j])path.unshift(nodes[j]);return path;}
      visited.add(i);
      for(let j=1;j<nodes.length;j++){
        if(visited.has(j))continue;
        const a=nodes[i],b=nodes[j],d=dist(a,b),count=Math.max(1,Math.ceil(d/.37));
        if(cost[i]+d>=cost[j])continue;
        let open=true;for(let k=1;k<=count;k++){const t=k/count;if(!clear(a.x+(b.x-a.x)*t,a.z+(b.z-a.z)*t)){open=false;break;}}
        if(open){cost[j]=cost[i]+d;prev[j]=i;}
      }
    }
  }
  const motelWalks=[[135.65,-17.35],[135.65,-22.74],[133.12,-21.72],[133.1,-18.55],[131,-17.2],[132,-52.9],[135.9,-54.3],[135.9,-63.1],[128.7,-59.8],[131.9,-60.1],[123.8,-53.7],[111,-53.7],[116,-53.7],[121,-53.7],[110,-63.5],[120,-63.5]].map(([x,z])=>({x,z}));
  function motorWalkway(a,b,v){
    const parked=cars.filter(o=>o!==v&&!o.path&&Math.abs(o.speed)<.8&&o.x>Math.min(a.x,b.x)-3&&o.x<Math.max(a.x,b.x)+3&&o.z>Math.min(a.z,b.z)-3&&o.z<Math.max(a.z,b.z)+3);
    const bus=transit.bus;
    if(bus.door>.05&&bus.x>Math.min(a.x,b.x)-5&&bus.x<Math.max(a.x,b.x)+5&&bus.z>Math.min(a.z,b.z)-5&&bus.z<Math.max(a.z,b.z)+5)parked.push(bus);
    const direct=recoveryWalkway(a,b,v,[],parked);if(direct)return direct;
    if(dist(a,BayValetPlaces.desk)<90&&dist(b,BayValetPlaces.desk)<90)return recoveryWalkway(a,b,v,motelWalks,parked);
    const start=chase.road(a),end=chase.road(b),network=[start,...chase.route({...start,yaw:a.yaw||0},end)];
    const sidewalks=network.flatMap(p=>[-7.8,7.8].flatMap(x=>[-7.8,7.8].map(z=>({x:p.x+x,z:p.z+z}))));
    return recoveryWalkway(a,b,v,[...sidewalks,...motelWalks],parked);
  }
  const courtPoint=(x,z)=>({x,z});
  function valetLegs(v,b,parking){
    const lane=-63.15,berth=BayValetPlaces.berth,leg=BayMotorCourt.lotPath;
    if(parking){
      const way=[];
      if(dist(v,berth)>12&&!(v.z<berth.z&&v.z>lane-3&&Math.abs(v.x-berth.x)<3)){
        const curb=BayCab.streetStop(v,chase.road(v));
        if(curb)way.push(...BayCab.route({...curb,x:v.x,z:v.z},{...berth,z:-24}).pts.slice(1));
      }
      if(v.x<132&&v.z< -50)way.push(courtPoint(v.x,lane));
      else way.push(courtPoint(138.4,lane));
      way.push(courtPoint(b.x,lane),b);return [leg(v,way)];
    }
    const back=courtPoint(b.x,lane);
    if(dist(v,b)>6)return [leg(v,[courtPoint(138.6,Math.min(v.z,-27)),berth])];
    // Take the northbound lane out of the lot. Turn at Tideway and return to the southbound loading curb.
    const loop=[courtPoint(146.6,lane),courtPoint(146.6,-.6)];
    for(let i=1;i<=6;i++){
      const a=Math.PI*i/6;loop.push(courtPoint(144+2.6*Math.cos(a),-.6+2.6*Math.sin(a)));
    }
    loop.push(courtPoint(141.4,-9.5),courtPoint(138.85,-17),berth);
    return [leg(v,[back],true),leg(back,loop)];
  }
  function motorExchange(g,partner,dt){
    // The customer stands on the east side of the stand, offering the ring toward its public face.
    const q={x:g.x-.76,z:g.z};const m=partner===hero?motion:partner.motion;
    if(dist(partner,q)>.035){
      if(!g.handPath?.length)g.handPath=motorWalkway(partner,q,g.car);
      if(g.handPath?.length){BayCarAccess.walkPath(partner,m,g.handPath,dt,footLevel,2.12);return false;}
      if(dist(partner,g)>1.15)return false;
    }
    const yaw=Math.atan2(g.x-partner.x,g.z-partner.z);partner.yaw+=angle(partner.yaw,yaw)*Math.min(1,dt*12);
    m.step(dt,0,0);return Math.abs(angle(partner.yaw,yaw))<.07;
  }
  const motorEnv={hero,ground:footLevel,walkway:motorWalkway,door:doorPlan,lotLegs:valetLegs,exchange:motorExchange,driver:()=>car,
    held:v=>v===car||v===transfer?.v,clear(v,x,z,yaw){
      if(!fitsCar(v,x,z,yaw))return false;
      const probe={kind:v.kind,x,z,yaw};
      if(dist(probe,transit.bus)<8&&BayDriving.contact(probe,transit.bus))return false;
      return !cars.some(o=>o!==v&&dist(probe,o)<6&&BayDriving.contact(probe,o))&&(!onStreetFeet()||BayDriving.clearance(probe,hero)>.22);
    },
    sidewalk(v,side){
      const stop=BayCab.streetStop(v,chase.road(v));
      for(const q of [stop?.stand,BayDriving.world(v,side*4,1),BayDriving.world(v,-side*3.5,-1)])if(q&&valid(q.x,q.z,.29)&&motorWalkway(BayDriving.world(v,side*(bayCarLayout(v.kind).track+.58),-.4),q,v))return q;
      return BayDriving.world(v,side*(bayCarLayout(v.kind).track+1.15),-.6);
    },
    reclaimable:v=>!gull.record(v)&&!v.onLift&&!v.roadside&&v!==personalCar&&dist(hero,v)>3.3&&BayCab.stopped(v),
    canRejoin(p){
      const v=p.car,i=BayMotorCourt.nearestLeg(v,p.route),b=p.route[i],a=p.route[(i+p.route.length-1)%p.route.length];
      const d=dist(a,b)||1,f=clamp(((v.x-a.x)*(b.x-a.x)+(v.z-a.z)*(b.z-a.z))/(d*d),0,1);
      return Math.hypot(v.x-a.x-f*(b.x-a.x),v.z-a.z-f*(b.z-a.z))<4.4;
    },
    rejoin(p){const v=p.car;v.path=p.route;v.corner=BayMotorCourt.nearestLeg(v,v.path);v.blocked=0;v.wait=.45;v.reaction=null;},
    note:(title,detail)=>note(title,detail,3.2),line:(p,line)=>speak(p.name,line),
    pay(g,tip){save.wallet+=g.pay+tip;save.paid++;persist();sound.cue("paid");speak(g.name,g.thanks);
      note("Marlin valet  ·  "+g.plate,cash(g.pay)+" shift pay  +  "+cash(tip)+" tip",4);lastHud=lastMap=-10;}
  };
  const atValet=()=>onStreetFeet()&&!heat&&!watchCrew.towing&&!cabs.booking&&(!active||active.valet)&&valet.atStand(hero);
  const washFree=()=>!heat&&!watchCrew.towing&&!cabs.booking&&(!active||active.wash);
  const atWash=()=>washFree()&&!transfer&&(car?wash.personalBay(car):onStreetFeet()&&wash.atTill(hero));
  const inWashPad=()=>cars.find(v=>v.used&&!v.washGuest&&wash.personalBay(v));
  const canUseSeat=()=>!!car&&!transfer&&car!==meet.jules&&!active?.take&&!paintPreview;
  const insideSeat=()=>!unit.transition&&!works.rearView&&!club.show?.wide&&driverSeat.enabled&&canUseSeat()&&!held("KeyV");
  const seatLights=()=>Math.max(cityDusk(),hours.night,.53*hours.rain)>.08;
  const glassWater=()=>wash.spraying&&wash.work?.v===car&&wash.panel===2?.96:0;
  const washEnv={hero,ground:footLevel,door:doorPlan,onFoot:onStreetFeet,held:()=>held("Space")||hoseButton,
    walkway(a,b,v){
      const nearby=cars.filter(o=>o!==v&&dist(o,wash.site.bay)<21&&!o.path);
      const at=wash.site.at,via=[at(-4.4,-.82),at(-3.55,-.80),at(-2.58,-.82),at(-2.57,-3.1),at(-2.62,2.1),
        wash.site.entry,wash.site.exit,at(-3,5.3),at(3.3,5.4),at(3.3,-5.4),at(-3,-5.5)];
      return recoveryWalkway(a,b,v,via,nearby);
    },
    blocked:q=>cars.some(v=>!v.path&&dist(v,q)<5),line:speak,
    cancel(){if(active?.wash)active=null;lastHud=lastMap=-10;},
    ownDone(v,full){
      const fee=full&&save.palma.rinses>1?12:0;
      if(fee)save.wallet-=fee;active=null;persist();lastHud=lastMap=-10;sound.cue("found");
      speak("Elia Mena",full?"There you go. You can see the blue in the hood again.":"Hang the hose up there. Give those mirrors a minute to dry.");
      note("Palma Hand Wash",fee?"Hand wash  ·  "+cash(fee):full?"First wash is on Elia.":"Four clean panels",3.5);
    },
    receipt(g,pay,tip){
      active=null;save.wallet+=pay;save.paid++;persist();lastHud=lastMap=-10;sound.cue("paid");
      speak(g.name,g.thanks);note("Palma Hand Wash  ·  "+g.plate,cash(pay-tip)+" wash  +  "+cash(tip)+" tip",4);
    }};
  let hoseButton=false;
  function joinWash(type){
    if(!atWash()||active)return;
    const v=car||inWashPad();
    if(type==="shift"){if(car||!wash.playerShift())return;}
    else if(!v||BayPalma.cleanEnough(v)||type==="attended"&&save.palma.rinses>0&&save.wallet<12||!wash.own(v,type==="attended"))return;
    active={job:washJob,wash:true};waypoint=null;closePanel();lastHud=lastMap=-10;
    speak("Elia Mena",type==="shift"?(wash.order?.phase==="waiting"?wash.order.name+" is waiting in the shade. Start with the dirtiest side.":"Take the blue hose. My next regular is pulling around.") :
      type==="attended"?"Leave it parked. I’ll do the glass by hand.":"Hop out and take the hose around the car. Hold Space to rinse the panel facing you.");
  }
  function washAction(){
    if(!washFree())return false;
    if(wash.work?.ready&&onStreetFeet()&&wash.finishShift(washEnv))return true;
    if(!active&&atWash()){openPanel("palma");return true;}
    return false;
  }
  function stepWash(dt){
    if(active?.wash&&(heat||!car&&!wash.personal&&dist(hero,wash.site.bay)>62)){dropJob();speak("Elia Mena","I’ve got the hose. See you next shift.");}
    wash.step(dt,washEnv);
  }
  const freeForBand=()=>onStreetFeet()&&!heat&&!watchCrew.towing&&!cabs.booking&&(!active||active.band);
  const atSetList=()=>freeForBand()&&(dist(hero,band.site.board)<2.85||dist(hero,band.site.call)<1.75);
  const byJune=()=>freeForBand()&&!band.june.ride&&dist(hero,band.june)<3.65;
  const bandJob={id:"saltwater",name:"Saltwater Sessions",by:"June Mora"};
  function bandWalkway(a,b,v){
    if(dist(a,band.site.front)<29&&dist(b,band.site.front)<29){
      const via=[...band.site.kitRoute,band.site.call,band.site.june,band.site.lena,band.site.ben,{x:189.45,z:79.2},{x:184,z:79.3},{x:184.2,z:86.3},{x:188.9,z:87.25}];
      const nearby=cars.filter(o=>o!==v&&!o.path&&dist(o,band.site.front)<23);
      return recoveryWalkway(a,b,v,via,nearby);
    }
    return motorWalkway(a,b,v);
  }
  function releaseKit(){
    band.stopTake(hero,motion);keys.clear();lastHud=lastMap=-10;kitCam=0;cameraSnap();
    if(active?.band&&!band.outing)active=null;
    $("bandHud").hidden=true;
  }
  function finishBand(take,record){
    const saved=save.band,prior=saved.best[take.song.id];
    if(record.score>=55){
      if(!prior||record.score>prior.score||record.score===prior.score&&record.chain>prior.chain){
        saved.best[take.song.id]=record;take.master=true;
      }
      if(record.june)saved.met=true;
      saved.last=take.song.id;saved.shows++;take.pay=55+Math.round(record.score*.7)+(record.june?25:0);
      save.wallet+=take.pay;save.paid++;persist();sound.cue("paid");
      speak("Ben Mora",take.master?"That one stays on the blue cassette. Hit B in your car to hear it.":"All the way to the last bar. I’m keeping your best take on the cassette.");
    }else speak("Ben Mora","Follow the light at the left of the chart. We’ve got time for another take.");
    lastHud=lastMap=-10;
  }
  const bandEnv={hero,motion,ground:footLevel,walkway:bandWalkway,door:doorPlan,driver:()=>car,transfer:()=>transfer,
    available:v=>!v.meetCar&&!v.guestId&&!v.serviceCar&&v!==wrecker&&!v.onLift&&!cabs.holds(v),
    district,save:persist,night:()=>hours.minute>=19*60||hours.minute<60,busyWithJune:()=>panel==="june",
    deck:()=>!!(car||room&&room.kind!=="cinema"),indoors:()=>!!room||!!swim?.underwater,yaw:()=>isTop()?cameraRig.yaw:cam.yaw,
    line:(name,line)=>speak(name,line),hit:pad=>sound.cue("shell-hit",{pad,gain:1,pan:0}),finished:finishBand,left:releaseKit,
    yieldToCar(p,q){
      for(const v of cars){
        if(v===p.ride||Math.abs(v.speed)<1.4||Math.abs(v.x-p.x)>6.1||Math.abs(v.z-p.z)>6.1)continue;
        const ahead=BayDriving.world(v,0,Math.sign(v.speed)*2.1);
        if(dist(ahead,p)<2.3&&dist(ahead,q)<dist(v,q))return true;
      }return false;
    }};
  function inviteJune(outing){
    if(!byJune()||!band.invite(outing))return;
    active={job:bandJob,band:true};waypoint=null;persist();closePanel();lastHud=lastMap=-10;
    speak("June Mora",outing==="drive"?"Take me by the Luna marquee. I’ll tell you a story.":"Ben’s set up at the Sound Shell. We can walk up Ocean Drive or take your car.");
  }
  function beginSet(id){
    if(!atSetList()||band.june.ride||!BaySessions.byId(id))return;
    if(id==="neon"&&!save.band.shows&&!save.juneReturned)return;
    if(!band.begin(id,hero,motion,bandEnv))return;
    active={job:bandJob,band:true};waypoint=null;band.outing="";kitCam=0;band.pan=band.tilt=0;keys.clear();closePanel();lastMap=lastHud=-10;
    speak("Ben Mora","Take my stool. White line’s your beat. I’ll count you in.");
  }
  function cueTape(id){
    if(!bandEnv.deck()||!band.playTape(id))return;
    if(panel)closePanel();note("Blue-dot cassette",BaySessions.byId(id).name+(radio?"  ·  Your take":"  ·  R turns sound on"),3);lastHud=-10;
  }
  function cycleTape(){
    const first=save.band.last;if(!first||!bandEnv.deck())return;
    const ids=[first,...Object.keys(save.band.best).filter(id=>id!==first)];
    if(band.tape&&ids.indexOf(band.tape.id)===ids.length-1){band.tape=null;band.onAir=false;note("Cassette deck","Ejected · Sol FM",2);}
    else cueTape(band.tape?ids[ids.indexOf(band.tape.id)+1]:ids[0]);
  }
  function bandAction(){
    if(atSetList()){openPanel("set-list");return true;}
    if(byJune()){
      const justMet=!save.band.met;save.band.met=true;
      if(!returnJuneDemo()&&justMet)persist();
      openPanel("june");return true;
    }
    return false;
  }
  const padNames=["KICK","SNARE","HAT"],padColors=["#eead82","#91d2c1","#e9ce78"];
  function drumHud(){
    const take=band.take,box=$("bandHud");box.hidden=!take;$("hud").classList.toggle("onstage",!!take);
    if(!take)return;
    $("bandName").textContent=take.song.name;
    $("bandBar").textContent=take.phase==="seat"?"CHANGEOVER":take.phase==="result"?take.score+"%":take.beat<0?"COUNT  "+Math.ceil(-take.beat):"BAR  "+Math.min(take.song.bars,1+Math.floor(take.beat/4))+" / "+take.song.bars;
    $("bandPhrase").textContent=take.phase==="result"?(take.master?"New cassette master":take.pay?"Take complete":"Try the take again"):take.phase==="seat"?"Ben is giving you his stool":take.phase==="leave"?"Stepping away":take.beat<0?"Four beats in":take.feedbackTime?take.feedback:"Play at the white line";
    $("bandChain").textContent=take.phase==="result"?(take.pay?cash(take.pay)+"  ·  ":"")+"Best streak "+take.longest:take.chain>1?take.chain+" in a row":"";
    const c=$("bandRoll");if(!c.getContext)return;
    const ctx=c.getContext("2d"),w=c.width,h=c.height,mark=130,unit=90,beat=take.beat;
    ctx.fillStyle="#142b2e";ctx.fillRect(0,0,w,h);
    for(let k=Math.floor(beat)-1;k<beat+6;k++){
      const x=mark+(k-beat)*unit;if(x<92)continue;ctx.fillStyle=k%4===0?"#628078":"#344b49";ctx.fillRect(x,0,k%4===0?2:1,h);
    }
    ctx.font="bold 16px monospace";ctx.textAlign="left";ctx.textBaseline="middle";
    for(let i=0;i<3;i++){
      const y=19+i*33;ctx.fillStyle="#203b3d";ctx.fillRect(0,y-13,91,26);
      ctx.fillStyle=padColors[i];ctx.fillText(["A","S","D"][i],8,y);ctx.font="12px monospace";ctx.fillText(padNames[i],32,y);ctx.font="bold 16px monospace";
      ctx.fillStyle="#4a6461";ctx.fillRect(92,y+15,w-92,1);
      if(band.strikes[i]<.11){ctx.fillStyle=padColors[i];ctx.fillRect(mark-9,y-9,18,18);}
    }
    if(take.phase!=="result")for(const n of take.notes){
      const x=mark+(n.at-beat)*unit;if(x<96||x>w+9)continue;
      const y=19+n.pad*33;ctx.fillStyle=n.state===1?"#e4f0dc":n.state===-1?"#82675e":padColors[n.pad];
      ctx.beginPath();ctx.moveTo(x,y-8);ctx.lineTo(x+8,y);ctx.lineTo(x,y+8);ctx.lineTo(x-8,y);ctx.closePath();ctx.fill();
    }
    ctx.fillStyle="#f7f3d7";ctx.fillRect(mark-1,0,2,h);
  }
  function bandSteps(dt){
    if(heat&&active?.band){dropJob();speak("June Mora","I’ll see you at the shell after things settle down.");}
    band.step(dt,bandEnv);
  }
  const exchangingKey=()=>valet.onDuty&&valet.focus&&["issue","receiving"].includes(valet.focus.stage);
  function valetAction(){
    if(onStreetFeet()&&active?.valet&&valet.act(hero,motorEnv)){lastHud=lastMap=-10;return true;}
    if(atValet()){openPanel("valet-desk");return true;}
    const owner=onStreetFeet()&&!heat&&!active&&owners.nearby(hero);
    if(owner){speak(owner.name,owner.phase==="phone"?"I’ve given them the plate. I’m waiting right here.":"That’s my ride. Leave me enough room to get back in.");return true;}
    return false;
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
    if(swim||airLine.aboard)return null;
    const dock=bay.landing(hero.x,hero.z);if(!dock||motion.jumpTime>=0)return null;
    let nearest=null,range=5.1;
    for(const v of boats)if(v.dock===dock){const d=dist(v,hero);if(d<range){nearest=v;range=d;}}
    return nearest;
  }
  function vacant(v,dock,side){
    if(dock.guest&&v&&(v.kind==="pip")!==(side>0))return false;
    return !boats.some(o=>o!==v&&o.dock===dock&&(o.side===side||dock.skiff&&!dock.guest||dock===BayDrawbridge.iceDock));
  }
  function returnBoat(v,first){
    for(const d of [first,...bay.docks.filter(d=>d!==first)])for(const side of [-1,1]){
      if(vacant(v,d,side)){bay.moor(v,d,side);return;}
    }
  }
  function nearestMooring(v){
    let best=null,range=6;
    if(dist(v,BayDrawbridge.iceBerth)<4&&vacant(v,BayDrawbridge.iceDock,1)){
      return {dock:BayDrawbridge.iceDock,side:Math.cos(v.yaw-BayDrawbridge.iceBerth.yaw)>=0?1:-1};
    }
    for(const dock of bay.docks.concat(airStops))for(const side of dock.skiff&&!dock.guest?[1]:[-1,1]){
      if(!vacant(v,dock,side))continue;
      const d=dist(v,bay.berth(dock,side));
      if(d<range){best={dock,side};range=d;}
    }return best;
  }
  function openToSwim(x,z,depth){
    if(!BaySwimming.water(x,z)||BayGullKey.landFloor(x,z)!=null)return false;
    if(airLine.plane.onWater&&BaySwimming.insideHull(airLine.plane,x,z,depth,1.42,3.32))return false;
    if(z>208&&depth<1.5&&BayDrawbridge.scow(x,z,.2))return false;
    if(z>215&&BaySwimming.insideHull(bridge.packet,x,z,depth,1.44,3.8))return false;
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
    const ladder=BayDrawbridge.ladder,dockGap=dist(hero,ladder);
    if(dockGap<range&&BayDrawbridge.local(hero.x,hero.z).s>4.5){best={type:"ladder",l:ladder,end:BayDrawbridge.iceStep};range=dockGap;}
    for(const s of airStops){const l=s.ladder,d=dist(hero,l);if(d<range){best={type:"ladder",l:{...l,dock:s},end:l.end};range=d;}}
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
    if(a.type==="board"&&a.v===pip&&pip.dock===boatYard.dock&&(works.alda.cross||!works.alda.ride)){note("Alda Santana","Let me get aboard first.",2);return;}
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
      const v=a.v,d=v.dock,side=v.side;swim=null;skiff=v;v.dock=null;if(v!==pip)hullChoice=v.kind;else works.dirty=true;
      if(d)active?.ferry?.reserveBoat(v,d,side);
      pilot(v,1,dt);Object.assign(hero,seatPoint(v));note(bay.hulls[v.kind].name,"Back at the helm.",2);
    }else{resetFeet();if(a.l.dock===airStops[1]){save.airmail.island=true;persist();}note(a.l.dock.name,"Back on the boards.",2);}
    lastMap=lastHud=-10;
  }
  function swimStep(dt){
    if(swim.exit){stepSeaTransfer(dt);return;}
    const f=Number(held("KeyW","ArrowUp"))-Number(held("KeyS","ArrowDown")),r=Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    const yaw=cameraRig.yaw,control={x:Math.sin(yaw)*f+Math.cos(yaw)*r,z:Math.cos(yaw)*f-Math.sin(yaw)*r,
      dive:held("Space"),fast:held("ShiftLeft","ShiftRight"),towing:watchCrew.towing};
    if(!swim.exit&&swim.depth<.3&&dist(hero,airStops[1])<13&&!BayGullKey.siteAt(hero.x,hero.z)){
      const x=hero.x+control.x*.49,z=hero.z+control.z*.49,y=BayGullKey.landFloor(x,z);
      if(y!=null&&y<.32&&BayGullKey.siteAt(x,z,.22)){Object.assign(hero,{x,z,y});resetFeet();if(!save.airmail.island){save.airmail.island=true;persist();}lastHud=-10;return;}
    }
    const wasUnder=swim.underwater;
    if(swim.step(dt,hero,streetTime,control,openToSwim)){resetFeet();lastHud=-10;}
    else if(wasUnder!==swim.underwater){lastHud=-10;if(!swim.underwater)sound.cue("splash");}
  }
  function pilot(v,f,dt){
    const r=motion.ride||(motion.ride={handle:[0,0,0]});
    Object.assign(r,{side:-1,seat:f,seatY:v.kind==="pip"?.435:.62,floor:v.kind==="pip"?0:.25,steer:v.steer,inner:f,outer:f,duck:0,latchDip:0,reach:0,pull:0,passenger:false});
    motion.step(dt,0,0);
  }
  function seatPoint(v){
    const p=v.kind==="pip"?chassisPoint(v,-.37,.105,-.47,v.y):chassisPoint(v,-.38,0,-.35,v.y);return {x:p.x,z:p.z,y:p.y,yaw:v.yaw};
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
    const to=a.entering?seatPoint(v):d.guest&&a.side<0?{x:d.x,z:d.z+.80,y:d.level,yaw:Math.PI}:d.skiffFoot?d.skiffFoot:d===BayDrawbridge.iceDock?BayDrawbridge.iceStep:{x:d.x+.7,z:d.z+a.side*(d.headD*.5-.77),y:d.level,yaw:-a.side*Math.PI*.5};
    hero.x=a.start.x+(to.x-a.start.x)*t;hero.z=a.start.z+(to.z-a.start.z)*t;
    hero.y=a.start.y+(to.y-a.start.y)*t+Math.sin(Math.PI*t)*.21;hero.yaw=a.start.yaw+angle(a.start.yaw,to.yaw)*t;
    pilot(v,seat,dt);
    if(a.f<1)return;
    if(a.entering){skiff=v;v.dock=null;if(v.kind!=="pip")hullChoice=v.kind;else works.dirty=true;active?.ferry?.reserveBoat(v,d,a.side);note(bay.hulls[v.kind].name,"W to open the throttle  ·  Space to trim out",3);}
    else{bay.moor(v,d,a.side);skiff=null;regattaResult=null;resetFeet();save.airmail.island=d===airStops[1];persist();note(d.name,"Lines secured.",2);}
    deckStep=null;lastHud=lastMap=-10;
  }
  function openRaceSheet(){
    if(transfer||deckStep)return;
    if(skiff===pip||bay.landing(hero.x,hero.z)===boatYard.dock){note("Buttonwood Public Slip","The club keeps its racing outboards at Marlin Pier.",3);return;}
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
    }else if(skiff===pip&&(works.slip||works.line)){if(!works.slip)bay.pose(pip,streetTime,dt);}
    else if(skiff&&!deckStep){if(skiff===pip&&(input.gas||input.back||Math.abs(pip.speed)>.1))works.dirty=true;bay.helm(skiff,dt,input.gas,input.back,input.steer,input.trim,streetTime);bay.disturb(skiff,clubBoat,streetTime);bay.separate(skiff,clubBoat);}
    if(!race){
      if(dist(clubBoat,cruiseMarks[cruiseLeg])<10)cruiseLeg=(cruiseLeg+1)%cruiseMarks.length;
      bay.follow(clubBoat,cruiseMarks[cruiseLeg],11,dt,streetTime);
    }
    for(const v of boats)if((v!==skiff||deckStep)&&!(v===pip&&works.slip))bay.pose(v,streetTime,dt);
    if(skiff&&!deckStep){
      for(const v of boats)if(v!==skiff)bay.separate(skiff,v);
      if(airLine.plane.onWater&&dist(skiff,airLine.plane)<7)bay.clearWorkingHull(skiff,{...airLine.plane,halfWidth:1.26,halfLength:2.85});
      if(BayDrawbridge.nearby(skiff.x,skiff.z))bay.clearWorkingHull(skiff,bridge.packet);
      if(skiff.z>289&&Math.abs(skiff.x-284)<19)bay.clearWorkingHull(skiff,BayCutWildlife.trawlerHull(streetTime,hours));
      Object.assign(hero,seatPoint(skiff));pilot(skiff,1,dt);
    }
  }
  const wheelFare=()=>boardwalk.price()?cash(boardwalk.price()):"on the house";
  const byWindow=()=>onStreetFeet()&&dist(hero,ticketWindow)<2.7&&hero.z>=107.7;
  const byGate=()=>onStreetFeet()&&dist(hero,coastGate)<2.3&&hero.x>=175.55&&Math.abs(hero.z-coastGate.z)<1.2;
  const boardwalkFree=()=>!heat&&!active&&!cabs.booking&&!watchCrew.towing;
  function courtAtLine(){
    if(!onStreetFeet()||!boardwalkFree())return null;
    return courts.find((g,i)=>dist(hero,courtPins[i])<2.9||dist(hero,g.keeper)<2.75)||null;
  }
  const prize=g=>g.site.id==="sol"?85:135;
  function squareUp(g){
    const yaw=Math.atan2(g.site.x-hero.x,g.site.z-hero.z);cameraRig.recenter(yaw,elapsed);
  }
  function startPickup(g,mode){
    if(!g||g.phase==="traffic"||g!==courtAtLine()&&!(g===pickup&&g.phase==="result"))return;
    if(panel)closePanel();motion.reset();keys.clear();waypoint=null;pickup=g;g.enter(mode,hero,motion,save.courts.equipped);squareUp(g);
    speak(g.opponent.name,mode==="practice"?"Pick your spot. I’ll send the ball back.":g.site.id==="sol"?"Ones and twos. First to five. Ball goes back behind the arc on a steal.":"Up to five. That corner's a two if your shoes stay outside the paint line.");
    lastHud=lastMap=-10;hud();
  }
  function leavePickup(){
    if(!pickup)return;const g=pickup;pickup=null;g.leave();resetFeet();keys.clear();cameraSnap();lastHud=lastMap=-10;
    $("courtHud").hidden=true;note(g.site.name,"Back on the sideline.",1.8);
  }
  function courtEvent(event,g,detail){
    if(!play)return;
    const yours=g===pickup;
    if(event==="score"&&yours&&detail.shooter===g.human){
      const log=g.history;log.makes++;log.longest=Math.max(log.longest,Math.round(detail.range*100)/100);persist();
    }else if(event==="finish"&&yours){
      const h=g.history,won=g.winner===0,first=won&&!h.wins;
      if(won){h.wins++;h.streak++;h.bestStreak=Math.max(h.bestStreak,h.streak);save.wallet+=prize(g);}
      else{h.losses++;h.streak=0;}
      persist();lastHud=-10;
      note(won?"Game  ·  +"+cash(prize(g)):g.opponent.short+" takes the game",first?"Your number 14 jersey is on the clothes rail at the Marlin.":won?"First to five. The scorekeeper has your win.":"Press F for another game or E to step away.",4.3);
    }else if(event==="check"&&yours&&detail===g.human&&!g.introduced){
      g.introduced=true;squareUp(g);g.say("Release in the green band",2.3);
    }else if(event==="release"&&yours&&detail===g.human&&$("speech").children[0].textContent===g.opponent.name){
      speechTill=elapsed;$("speech").hidden=true;
    }else if(event==="traffic"&&detail===car&&!room&&!active&&!heat&&elapsed>(g.warnAfter||0)){
      g.warnAfter=elapsed+18;
      speak(g.site.id==="sol"?"Dee":"Inés",g.site.id==="sol"?"Easy, driver! Park by the promenade. We’ve got a game on.":"Keep the yard clear, please. You can park out by the crates.");
    }else if(["rim","bounce","glass","basket","dribble"].includes(event)&&!room&&dist(pos(),g.site)<33){
      sound.cue("court-"+event,{distance:dist(pos(),g.ball)});
    }
  }
  function onPlayingSurface(g,v){
    if(!v||Math.abs(v.x-g.site.x)>17||Math.abs(v.z-g.site.z)>17)return false;
    const lead=clamp((v.speed||0)*.23,-1.7,3.5),x=v.x+Math.sin(v.yaw)*lead,z=v.z+Math.cos(v.yaw)*lead;
    const q=BayCourtPlaces.local(g.site,x,z);
    return Math.abs(q.u)<7.05&&q.v>-.95&&q.v<11.22;
  }
  function stepCourts(dt){
    const f=Number(held("KeyW","ArrowUp"))-Number(held("KeyS","ArrowDown")),r=Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    const yaw=cameraRig.yaw;
    const input={dx:Math.sin(yaw)*f+Math.cos(yaw)*r,dz:Math.cos(yaw)*f-Math.sin(yaw)*r,sprint:held("ShiftLeft","ShiftRight"),yaw};
    for(const g of courts){
      if(!g.human&&(g.time>=(g.checkRoadAt||0))){
        g.checkRoadAt=g.time+.12;
        if(g.laneVehicle||(!room&&dist(pos(),g.site)<58)){
          g.laneVehicle=cars.find(v=>onPlayingSurface(g,v))||patrol.find(v=>onPlayingSurface(g,v))||null;
        }
      }
      if(g!==pickup&&(room||dist(pos(),g.site)>78)){
        g.lag=(g.lag||0)+dt;if(g.lag<.075)continue;
        const steps=Math.ceil(g.lag/.037),slice=g.lag/steps;g.lag=0;
        for(let i=0;i<steps;i++)g.step(slice,input);
      }else{g.lag=0;g.step(dt,input);}
    }
    if(pickup){const p=pickup.human;Object.assign(hero,{x:p.x,y:p.y,z:p.z,yaw:p.yaw});}
  }
  function drawCourts(list,see,t){
    if(!courts.some(g=>see(g.site,150)))return;
    BayCourtPlaces.world(list,see,t,hours,courts,true);
    for(const g of courts){
      if(!see(g.site,80))continue;
      for(const p of [g.keeper,...g.locals]){
        const keeper=p===g.keeper,art=keeper?BayCourtBench:BayCourtPlayers,key="court-local/"+p.id;
        if(!p.mesh){p.mesh=new BayPlayerMesh(art.colors[p.id],art.roles[p.id]);art.dress(p.mesh,p.id);view.add(key,p.mesh,true);}
        const distance=dist(cam,p),interval=distance<24?0:distance<48?.055:.105;
        if(p.skinTime===undefined||t-p.skinTime>=interval){
          const changed=p.mesh.update(p.motion),posed=keeper?art.pose(p,g,t):art.pose(p.mesh,p,t);
          if(changed||posed)view.updateAnimated(key);p.skinTime=t;
        }
        list.push([key,p.x,p.y+p.lift,p.z,p.yaw]);
      }
      BayCourtPlayers.worldBall(list,g.ball,g.site,t);
    }
    BayCourtBench.world(list,see,t,hours,courts);
  }
  function courtHud(){
    const box=$("courtHud"),g=pickup;box.hidden=!g;if(!g)return;
    const practice=g.mode==="practice",h=g.human,b=g.ball;
    $("courtRules").textContent=practice?"5-SHOT RACK":"FIRST TO 5";
    $("courtLeft").textContent=practice?"Made":"You";$("courtRight").textContent=practice?"Taken":g.opponent.short;
    $("courtDigits").textContent=g.score[0]+"  /  "+g.score[1];
    const cue=g.phase==="result"?(g.winner===0?"You win":"Game to "+g.opponent.short):
      g.time<g.lineUntil?g.line:g.phase==="check"?"Check ball":!b.holder?"Rebound":
      !g.clear?"Take it outside the arc":b.holder===h?(g.glass?"Off the glass":"Your ball"):g.opponent.short+"’s ball";
    $("courtCall").textContent=cue;
  }
  function courtMeter(){
    const meter=$("shotMeter"),p=pickup?.human,shot=p?.shot;
    if(!shot||shot.stage!=="wind"){if(!meter.hidden)meter.hidden=true;return;}
    meter.hidden=false;
    const span=1.22,w=shot.window;
    meter.style.setProperty("--from",clamp((w.ideal-w.width*.71)/span*100,0,100)+"%");
    meter.style.setProperty("--size",w.width*1.42/span*100+"%");
    meter.style.setProperty("--at",clamp(p.wind/span*100,0,100)+"%");
  }
  function courtMeterAt(x,y){
    const style=$("shotMeter").style;
    style.setProperty("--sx",Math.round(clamp(x+22,12,innerWidth-105))+"px");
    style.setProperty("--sy",Math.round(clamp(y,30,innerHeight-42))+"px");
  }
  function startBellRun(){
    if(!boardwalkFree()||!(byWindow()||!room&&!car&&!skiff&&!boardwalk.player&&dist(pos(),cycles.javi)<4.6))return;
    closePanel();cycles.start();boardwalk.run=cycles.run;active={job:BayPedal.job,relay:true};waypoint=null;
    speak("Javi Reyes","Mags needs these tickets. Come up beside me on a bike and I’ll pass you the red pouch.");
    lastHud=lastMap=-10;
  }
  function boardwalkAction(){
    if(boardwalk.player)return true;
    if(active?.relay){
      if(cycles.run.phase==="deliver"&&byWindow()){
        const r=cycles.run,pay=boardwalk.deliver(r);save.wallet+=pay;save.paid++;cycles.cancel();active=null;waypoint=null;persist();
        sound.cue("paid");note("Last Bell Run  ·  +"+cash(pay),r.clock<=r.limit?"In time for the bell. Your next ride is covered.":"Mags held two tickets for the next cabin. Your ride is covered.",4.4);
        speak("Mags Duran","Miri, Len! Come around to the ramp. I saved the seat across from you.");lastHud=lastMap=-10;
      }return true;
    }
    if(boardwalkFree()&&byWindow()){openPanel("wheel-window");return true;}
    if(boardwalkFree()&&(onStreetFeet()||cycles.riding&&!cycles.transfer)&&dist(pos(),cycles.javi)<4.6){startBellRun();return true;}
    if(onStreetFeet()&&!active){
      const p=boardwalk.people.find(p=>!["ride","board","leave"].includes(p.phase)&&dist(hero,p)<2.35);
      if(p){speak(p.name,({miri:"Len’s never been up here after the lamps come on.",len:"You can see our old apartment from the top. Fourth window over.",fay:"I take the long way home whenever the wheel’s running.",vic:"You spot the shrimp boats first. Then you see how far out they really are."})[p.id]);return true;}
    }return !!cycles.riding;
  }
  function wheelEvent(event,p){
    if(event==="seated")note("Coast Wheel","Move the mouse to look around. V changes seatside view.",3);
    else if(event==="ashore"){cameraSnap();lastHud=-10;}
    else{
      const seats=boardwalk.wheel.seats[p.car],summit=event==="summit";
      if(seats.includes("miri")){if(summit)speak("Miri Ward","Keep still, Len. I finally got the lighthouse in the frame.");
        else speak("Len Ward","See the Marlin? We walked all the way from there. Looks like two steps from up here.");}
      else if(seats.includes("fay")&&!summit)speak("Fay Ellis","Look down. Otis always tilts his hat when a cabin goes by.");
      else if(seats.includes("vic")&&summit)speak("Vic Cruz","That little white line past the pier? Somebody’s taking a boat out.");
    }
  }
  const wheelEnvironment={hero,ground:footLevel,event:wheelEvent,pay(fare){
    if(save.wallet<fare){note("Coast Wheel","A ticket is "+cash(fare)+". Mags has work at the window.",3);return false;}
    save.wallet-=fare;if(save.boardwalk.rides>0&&save.boardwalk.passes>0)save.boardwalk.passes--;save.boardwalk.rides++;persist();return true;
  }};
  function pastTurnstile(p,x,z){
    return p.x<=coastGate.x&&x>coastGate.x&&Math.abs(z-coastGate.z)<1.35;
  }
  function hitsPracticeRail(x,z,nx,nz,lift){
    if(lift>=BayBeachDash.barHeight||x<158||z<-14||z>8)return false;
    for(const gate of course){
      if(gate.type!=="rail"||Math.abs(x-gate.x)>3.8||Math.abs(z-gate.z)>3.8)continue;
      const from=BayDriving.local(gate,x,z),to=BayDriving.local(gate,nx,nz);
      if(Math.abs(to.x)<BayBeachDash.halfWidth+.18&&from.z*to.z<=0&&Math.abs(to.z-from.z)>.00001)return true;
    }
    return false;
  }
  function cycleClear(x,z,b){
    const dx=Math.sin(b.yaw)*.42,dz=Math.cos(b.yaw)*.42;
    if(pastTurnstile(b,x,z)||!valid(x+dx,z+dz,.24)||!valid(x-dx,z-dz,.24)||BaySwimming.water(x,z)&&!bridge.onRoad({x,z}))return false;
    for(const v of cars)if(Math.abs(x-v.x)<4&&Math.abs(z-v.z)<4&&BayDriving.clearance(v,{x,z})<.43)return false;
    for(const v of motos.all)if(Math.abs(x-v.x)<3&&Math.abs(z-v.z)<3&&BayDriving.clearance(v,{x,z})<.36)return false;
    for(const v of patrol)if(Math.abs(x-v.x)<4&&Math.abs(z-v.z)<4&&BayDriving.clearance(v,{x,z})<.43)return false;
    const toward=(p,r)=>Math.abs(p.x-x)<r&&Math.abs(p.z-z)<r&&dist({x,z},p)<r&&dist({x,z},p)<dist(b,p)-.00001;
    if(toward(cycles.javi,.65)||cycles.bikes.some(p=>p!==b&&toward(p,.62))||walkers.some(p=>!p.palmPassenger&&toward(p,.63)))return false;
    return !hitsPracticeRail(b.x+dx,b.z+dz,x+dx,z+dz,b.air);
  }
  function parkCycle(b){save.bikes[b.id]={x:b.x,z:b.z,yaw:b.yaw};persist();cameraSnap();lastHud=-10;}
  const cycleEnvironment={hero,motion,level:footLevel,clear:cycleClear,park:parkCycle};
  const skateEnv={hero,floor:footLevel,local:{floor:footLevel,clear:()=>true},emit:skateEvent,
    clear(r,x,z,air){
      if(!cycleClear(x,z,r)||!roofs.approach(x,z,r.y+air)||!skate.clearPeople(r,x,z))return false;
      const b=transit.bus;
      return Math.abs(x-b.x)>7||Math.abs(z-b.z)>7||BayDriving.clearance(b,{x,z})>.31;
    }};
  function bicycleInput(){
    return {pedal:held("KeyW","ArrowUp"),brake:held("KeyS","ArrowDown"),steer:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft")),
      sprint:held("ShiftLeft","ShiftRight"),hold:held("KeyF")};
  }
  function boardwalkStep(dt){
    cycles.courier(dt);boardwalk.step(dt,wheelEnvironment);
    if(cycles.riding)cycles.ride(dt,bicycleInput(),cycleEnvironment);
    const prior=cycles.run?.phase;cycles.handoff(dt,held("KeyF"),footLevel);
    if(prior==="meet"&&cycles.run.phase==="deliver"){sound.cue("found");speak("Javi Reyes","You’ve got it! Mags is at the north end. Take the pouch right up to her window.");lastHud=lastMap=-10;}
  }
  function ringBikeBell(){
    const b=cycles.riding;if(!b||b.bell>0)return;b.bell=.68;sound.cue("cycle-bell");
    for(const w of walkers){if(w.palmPassenger||dist(w,b)>8)continue;const p=BayDriving.local(b,w.x,w.z);if(p.z>0&&Math.abs(p.x)<3.2){w.alert=1.0;w.gesture=1;w.yaw=Math.atan2(b.x-w.x,b.z-w.z);}}
  }
  function switchCar(){
    if(gull.exchange||motos.player||motos.job?.swapping)return;
    if(rescue.holding||roofs.raised||airLine.aboard||transit.aboard||skate.rider)return;
    if(active?.rescue&&!car&&!rescue.access())return;
    if(band.take)return;
    if(exchangingKey())return;
    if(active?.wash&&!car){dropJob();note("Palma Hand Wash","Hose back on the hook.",2.4);return;}
    if(boardwalk.player){
      const result=boardwalk.exit();if(result==="request")note("Coast Wheel","Mags will open the gate when your cabin gets back to the platform.",2.8);
      if(result==="cancel"){resetFeet();cameraSnap();}return;
    }
    if(cycles.riding){
      if(!cycles.transfer&&!cycles.dismount(footClear))note("Beach cruiser","Brake with S and leave room beside the bike.",2);
      return;
    }
    if(boardwalkFree()&&byGate()){
      if(save.wallet<boardwalk.price()){note("Coast Wheel","A ride is $8. Check the ticket window for work.",3);return;}
      boardwalk.join(hero,motion);lastHud=-10;return;
    }
    if(onStreetFeet()&&(!active||active.relay)&&!cabs.booking&&!watchCrew.towing){
      const b=cycles.nearest(hero),v=enterable();
      if(dist(b,hero)<2.35&&(!v||dist(b,hero)<dist(v,hero))){
        if(cycles.mount(b,hero,footClear)){motion.reset();lastHud=-10;cameraRig.recenter(b.yaw,elapsed);}
        return;
      }
    }
    if(active?.relay)return;
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
    if(v&&(active?.story?.holds(v)||active?.ferry?.holds(v)||cabs.holds(v)||recovery.held(v)||band.holds(v)))return;
    if(!v){note("On foot","Walk up to a parked or stopped car.",1.9);return;}
    if(car&&Math.max(Math.abs(v.speed),Math.hypot(v.vx,v.vz))>4){note("Driver's seat","Slow down to step out.",1.8);return;}
    if(car&&v.hydraulic&&(v.hydraulic.contacts!==15||v.hydraulic.bodyLift>.18)){club.lowerPlayer();note("Driver’s seat","Let the tires settle before you open the door.",1.8);return;}
    if(!car&&motion.jumpTime>=0){note("Driver's seat","Land beside the car.",1.5);return;}
    const passenger=!!car&&v===meet.jules;
    const approach=doorPlan(v,!!car,hero,passenger?1:0);
    if(!approach){note("Driver's seat",car?"Both doors need more room.":"Walk around to a clear door.",2);return;}
    if(car){club.lowerPlayer();if(club.remember(v))persist();}
    if(cabs.booking)cabs.cancelBooking();
    if(active?.dash){active=null;note("Low Tide Dash","You left the course.",2);}
    dashResult=null;skidLast=null;
    transfer={v,passenger,exiting:!!car,side:approach.side,points:approach.points,next:0,
      parked:!car||Math.hypot(v.vx,v.vz)<.16,p:car?1:0,aligned:!!car,turnTime:0};
    if(!car&&!owners.yieldSeat(v,transfer,motorEnv)){transfer=null;note("Driver’s door","Leave a little space for the driver.",2);return;}
    if(!car){BayDriving.settle(v);v.reaction=null;v.hornAt=-100;}
    lastHud=-10;
  }
  function doorPlan(v,exiting,actor=hero,side=0){
    const clear=(x,z,r)=>{
      if(!valid(x,z,r)||works&&Math.abs(x-works.trailer.x)<5&&Math.abs(z-works.trailer.z)<5&&works.trailer.clearance(x,z)<r)return false;
      for(const o of (patrol.length?cars.concat(patrol):cars)){
        if(o===v||Math.abs(o.x-x)>3||Math.abs(o.z-z)>3)continue;
        if(BayDriving.clearance(o,{x,z})<r)return false;
      }
      return true;
    };
    if(actor===hero&&(palm.visit?.a.ride===v||active?.palm&&palm.visit||gull.drive?.v===v||v===unit4||active?.story?.ride===v||active?.ferry?.ride===v||active?.cabFare?.ride===v||band.june.ride===v||v===wrecker&&recovery.people.some(p=>p.ride===v)))side=-1;
    return BayCarAccess.plan(v,actor,exiting,clear,side);
  }
  function stepTransfer(dt){
    const a=transfer,v=a.v;
    if(a.owner?.phase==="out"){owners.exit(a.owner,dt,motorEnv);motion.step(dt,0,0);return;}
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
    if(a.exiting){if(unit.met&&unitRoadCar(v))unit.remember(v,v);car=null;works.rearView=false;resetFeet();BayDriving.settle(v);if(v===workTruck||v===works.trailer.hitched)writeButtonwood();valet.leftCar(v,motorEnv);if(gull.record(v)||gull.saved.loan?.kind===v.stockId&&v.stockId){gull.remember(v);persist();}if(v===personalCar)BayMotelParking.write(v);flushRoadDirt();return;}
    const borrowed=!!(a.owner||v.path);v.path=null;v.roadside=v.wantsCurb=false;v.pullOver=null;v.used=true;car=v;
    if(a.passenger){beginMeet("photo");return;}
    driverSeat.center();driverSeat.mirrorAt=-Infinity;
    if(!borrowed&&!active&&!v.seatHint){v.seatHint=true;note(formatVehicle(v),"Z  driver’s seat   ·   I  wipers",3);}
    if(borrowed){addHeat(1);note("Dispatch",a.owner?a.owner.name+" reported "+BayStreetCars.plateFor(v)+".":"A driver called in the switch.",2.3);}
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
    if(!play||active||pickup||broadcastDesk.mix)return [];
    const pins=jobSites.filter(s=>(s.id!=="ferry"||!ferryScene)&&(s.id!=="exposure"||!save.edition)
      &&(![meetPin,takePin].includes(s)||meet.phase==="sleep"||meet.phase==="idle")&&(s.id!=="getaway"||!meet.rival));
    if(!heat&&!cabs.booking)pins.push({...radioPin,id:"open-line",name:"Ivo Vidal · Boardwalk broadcast"});
    if(!heat&&!cabs.booking)pins.push({...boatYard.marker,id:"buttonwood",name:"Benji Moss · Buttonwood Boat Works"});
    if(!heat&&!cabs.booking)pins.push({id:"bell-run",x:cycles.javi.x,z:cycles.javi.z,name:"Javi Reyes · Last Bell Run"});
    return pins;
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
    if(active||motos.player||airLine.aboard||skate.rider||transit.engaged||watchCrew.towing||cabs.playerHeld||cycles.riding||boardwalk.player||pickup)return;
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
  const currentTarget=()=>windowRide?windowTarget():active?.buttonwood?works.target(car,skiff===pip):active?.brisas?(club.reserve&&!BayBrisasClub.switches(car)?{...plum,name:"Plum Solena 64"}:club.target):active?.palm?(palm.match?null:palm.target):active?.gull?gullTarget():active?.moto?motos.target():active?.rescue?rescue.target(rescueEnv):airTarget()||(active?.skate?skateTarget():transit.flag?transit.flag.s:transit.aboard?transit.target:active?.neon?neonTarget():active?.bridge?bridgeSite:active?.wash?wash.marker():active?.band?band.destination(car):active?.valet?valet.target(car):active?.relay?cycles.target(hero):watchCrew.towing?watchCrew.target():active?.recovery?recovery.target(car):cabs.booking||active?.cabFare?cabs.target(car):active?.field?active.field.target():active?.plate?active.plate.customer:active?.take?BayTake.runway:active?.meet?meet.target():active?.ferry?active.ferry.target(car,skiff):active?.regatta?active.regatta.target():active?.story?active.story.target(car):active?active.stops[active.index]:car===wrecker&&tow.target&&(BayRecovery.worst(tow.target)||tow.target.flatSide)?freeTowTarget:waypoint);
  function streetTarget(){
    if(windowRide?.held)return null;
    if(active?.gull)return null;
    if(motos.finder||active?.moto&&dist(pos(),motos.target())<16)return null;
    if(active?.rescue&&(!rescue.traveling||!rescue.manual||car!==unit4))return null;
    if(airLine.aboard||airLine.reserved||active?.airmail&&dist(pos(),airLine.mailTo.desk)<12)return null;
    if(active?.skate&&dist(pos(),skateTarget())<36||transit.flag||transit.aboard&&(!transit.driving||dist(transit.bus,transit.target.berth)<14))return null;
    const target=currentTarget();
    if(active?.buttonwood&&(works.line||works.slip||target&&dist(pos(),target)<9))return null;
    return target&&(active?.neon||active?.wash||active?.band||active?.valet||active?.relay||active?.recovery||target===freeTowTarget||["sign-shop","drawbridge","car-wash","sound-shell","june","valet-stand","recovery-desk"].includes(target.kind))&&dist(pos(),target)<14?null:target;
  }
  let lastGuide=null;
  function roadGuide(target){
    if(active?.buttonwood)return buttonwoodGuide(target);
    if(active?.gull){
      if(!car)return null;
      const sheet=gull.guide();if(sheet||!["road","home"].includes(gull.drive?.phase))return sheet;
    }
    if(active?.moto)return motos.guide();
    if(active?.rescue){if(!rescue.traveling||!rescue.manual||car!==unit4)return null;const guide=rescue.guide();if(guide)return guide;}
    if(airLine.aboard||active?.airmail&&target?.x>300)return null;
    if(transit.aboard){
      const line=BayTransit.track,from=transit.at,meters=line.forward(from,transit.target.at),points=[transit.bus];
      for(let d=8;d<meters;d+=12)points.push(line.sample(from+d));points.push(transit.target.berth);
      const nextBend=points.find(p=>Number.isFinite(p.yaw)&&Math.abs(angle(transit.bus.yaw,p.yaw))>.63);
      const street=BayStreetNames.through(transit.target.berth,transit.target.yaw);
      return {points,meters,turn:meters<22?transit.dockHint():nextBend?"Right onto "+street+" in "+Math.round(dist(transit.bus,nextBend))+" m":"Straight to "+transit.target.short};
    }
    if(active?.valet||active?.skate)return null;
    if(active?.meet){
      if(meet.role!=="driver")return null;
      return {points:[car,...meet.route.gates.slice(meet.gate)],meters:dist(car,target),turn:meet.gate===meet.route.gates.length-1?"Finish northbound under the marquee":"Checkpoint "+(meet.gate+1)+" of "+meet.route.gates.length};
    }
    if(!car||!target||dist(car,target)<13||active?.dash||active?.ferry?.phase==="pier")return null;
    const closed=bridge.phase!=="road"&&(BayCut.area(car)||BayCut.area(target));
    if(lastGuide&&lastGuide.closed===closed&&lastGuide.tx===target.x&&lastGuide.tz===target.z&&dist(car,lastGuide)<3)return lastGuide;
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
    if(closed&&road.some(p=>p.x<135&&p.z>235))turn="Salt Creek bridge opening · Follow Shell Levee";
    return lastGuide={x:car.x,z:car.z,tx:target.x,tz:target.z,closed,points,meters,turn};
  }
  function dropJob(){
    if(windowRide){endWindowRide();return;}
    if(active?.buttonwood){works.saved.working=false;works.saved.marks=[];works.dropLine();writeButtonwood();}
    if(active?.brisas){club.drop();cameraSnap();lastHud=lastMap=-10;}
    if(active?.palm){if(palm.match)palm.leave(palmEnv);if(palm.visit)palm.depart(palmEnv);}
    if(active?.gull)gull.leave(gullEnv);
    if(active?.moto)motos.leave(motoEnv);
    if(active?.rescue){rescue.leave();motion.handTarget=null;lastHud=lastMap=-10;}
    if(active?.airmail){airLine.abandon();airLine.reserved=null;persist();lastHud=lastMap=-10;}
    if(active?.skate){skate.run=null;skateTape.stop();lastHud=lastMap=-10;}
    if(active?.neon){neon.cancel();motion.handTarget=null;lastHud=lastMap=-10;}
    if(active?.bridge){bridge.handBack();motion.handTarget=null;}
    if(active?.wash){wash.release();hoseButton=false;persist();}
    if(active?.band){if(band.take)releaseKit();band.leave(bandEnv);}
    if(active?.valet)valet.clockOut();
    if(active?.relay){cycles.cancel();boardwalk.run=null;}
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
    if(windowRide)return;
    if(active?.buttonwood||active?.brisas||active?.palm||active?.gull||active?.moto||active?.rescue||active?.skate||active?.airmail)return;
    if(transit.engaged||active?.neon||active?.bridge||active?.wash||active?.band||active?.valet||active?.relay||active?.field||active?.cabFare||active?.recovery||cabs.booking)return;
    if(active?.plate){active.plate.step(dt);return;}
    if(active?.take)return;
    if(active?.meet)return;
    if(ferryScene){const running=!!active?.ferry;advanceFerry(dt);if(running)return;}
    const p=pos();
    if(active?.regatta)return;
    if(active?.story){advanceExposure(dt);return;}
    if(transfer){if(active?.running)active.clock+=dt;return;}
    if(!active){
      if(waypoint?.id==="bell-run"){waypoint.x=cycles.javi.x;waypoint.z=cycles.javi.z;}
      if(waypoint?.kind==="june"){waypoint.x=band.june.x;waypoint.z=band.june.z;}
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
    if(roofs.raised||transit.aboard||airLine.aboard)return;
    tapes.forEach((t,i)=>{if(!save.tapes.includes(i)&&dist(pos(),t)<3.05){
      save.tapes.push(i);save.wallet+=45;persist();sound.cue("paid");
      note("Pirate radio tape "+save.tapes.length+"/5",i===0?"Blue-dot demo  ·  +$45. Find June at the Marlin.":t.name+"  •  +$45",4);
    }});
  }
  const held=(...codes)=>codes.some(k=>keys.has(k));
  function footClear(x,z,r){
    if(works&&Math.abs(x-works.trailer.x)<4.8&&Math.abs(z-works.trailer.z)<4.8&&!roofs.raised){
      const gap=works.trailer.clearance(x,z);if(gap<.17&&gap<works.trailer.clearance(hero.x,hero.z)-.0001)return false;
    }
    if(!BayPalmDiner.doorClear(x,z,r,palm.door))return false;
    if(motion.jumpTime<0&&x>210&&BayGullKey.siteAt(hero.x,hero.z)&&BayGullKey.landFloor(hero.x,hero.z)==null&&
       !BayGullKey.siteAt(x,z,.16)&&BayGullKey.floor(x,z)==null&&BaySwimming.water(x,z))return false;
    if(BayGullKey.siteAt(x,z)){
      if(BayGullKey.blocks.some(o=>hero.y+1.45>o.bottom&&hero.y<o.top&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r))return false;
      if(airCrew.some(a=>dist(a,{x,z})<.45&&dist(a,{x,z})<dist(a,hero)))return false;
    }
    if(gullDoorHit(x,z,r,hero.y+1.70)||[gull.keeper,gull.assessor].some(p=>!p.seat&&Math.abs(p.x-x)<.45&&Math.abs(p.z-z)<.45&&dist(p,{x,z})<.41&&dist(p,{x,z})<dist(p,hero)-.00001))return false;
    if(!skate.clearPeople(hero,x,z))return false;
    for(const b of motos.all)if(dist(b,hero)<3&&BayDriving.clearance(b,{x,z})<.21&&BayDriving.clearance(b,{x,z})<BayDriving.clearance(b,hero)-.00001)return false;
    if(!transit.aboard&&!roofs.raised&&Math.abs(x-transit.bus.x)<5.4&&Math.abs(z-transit.bus.z)<5.4){
      const d=BayDriving.clearance(transit.bus,{x,z});
      if(d<.22&&d<BayDriving.clearance(transit.bus,hero)-.0001)return false;
    }
    if(!roofs.raised&&!roofs.approach(x,z,hero.y))return false;
    if(bridge.onRoad(hero,.5)&&dist({x,z},bridge.walker)<.44&&dist({x,z},bridge.walker)<dist(hero,bridge.walker))return false;
    if(z>239&&z<255&&dist({x,z},bridge.tender)<.45&&dist({x,z},bridge.tender)<dist(hero,bridge.tender))return false;
    if(z>281&&z<305&&dist({x,z},BayDrawbridge.iceCounter)<.44&&dist({x,z},BayDrawbridge.iceCounter)<dist(hero,BayDrawbridge.iceCounter))return false;
    if(!boardwalk.player&&pastTurnstile(hero,x,z))return false;
    if(!active?.dash&&hitsPracticeRail(hero.x,hero.z,x,z,motion.lift))return false;
    const creekEdge=z>281&&z<309&&BayDrawbridge.landingLevel(hero.x,hero.z,-.3)!=null&&(BayDrawbridge.landingLevel(x,z,-.28)!=null||openToSwim(x,z,0));
    if(!valid(x,z,r)&&!bay.landing(x,z,r)&&!creekEdge&&!(x>205&&(BaySwimming.wetSand(x,z)||openToSwim(x,z,0)||
      bay.landing(hero.x,hero.z,-.18)&&bay.landing(x,z,-.28))))return false;
    if(Math.abs(x-coastGate.x)<15&&Math.abs(z-coastGate.z)<15){
      for(const p of boardwalk.people){
        if(Math.abs(p.y-hero.y)>1.5)continue;
        const gap=Math.hypot(x-p.x,z-p.z);if(gap<.47&&gap<dist(hero,p)-.0001)return false;
      }
    }
    for(const b of cycles.bikes){
      if(b===cycles.riding||Math.abs(b.x-x)>1.8||Math.abs(b.z-z)>1.8)continue;
      const gap=BayDriving.clearance(b,{x,z});if(gap<.04&&gap<BayDriving.clearance(b,hero)-.0001)return false;
    }
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
    if(active?.atLever||airLine.aboard)return;
    if(roofs.step(dt,hero,motion,{up:Number(held("KeyW","ArrowUp")),down:Number(held("KeyS","ArrowDown")),fast:held("ShiftLeft","ShiftRight")},roofEnv))return;
    if(neon.testing){
      const q=neon.service,dx=q.x-hero.x,dz=q.z-hero.z,d=Math.hypot(dx,dz),f=Math.min(1,1.9*dt/Math.max(.001,d)),old={x:hero.x,z:hero.z};
      roofs.along(hero,dx*f,0,roofEnv);roofs.along(hero,0,dz*f,roofEnv);
      hero.yaw+=angle(hero.yaw,-Math.PI/2)*-Math.expm1(-9*dt);motion.vx=motion.vz=0;motion.step(dt,dist(old,hero),0);
      const grasp=BayDriving.local(hero,neon.console.x+.28,neon.console.z+(neon.shift.shoe-2)*.16);
      motion.handTarget={...grasp,y:.98,weight:clamp(1-dist(hero,q),0,1)};return;
    }
    if(active?.neon&&motion.handTarget)motion.handTarget=null;
    const f=(held("KeyW","ArrowUp")?1:0)-(held("KeyS","ArrowDown")?1:0),r=(held("KeyD","ArrowRight")?1:0)-(held("KeyA","ArrowLeft")?1:0);
    const alongside=!f&&!r&&rainWalk.trip&&held("KeyG")?rainWalk.stride(hero,footClear):null;
    const yaw=cameraRig.yaw,dx=alongside?alongside.x:Math.sin(yaw)*f+Math.cos(yaw)*r,dz=alongside?alongside.z:Math.cos(yaw)*f-Math.sin(yaw)*r,n=Math.hypot(dx,dz);
    const speed=(alongside?Math.min(3.65,n):held("ShiftLeft","ShiftRight")?7.1:3.65)*(1-.70*motion.stumble/.65);
    const tx=n?speed*dx/n:0,tz=n?speed*dz/n:0;
    const rate=motion.lift>.08?(n?7:3.4):(n?(speed>4?14:26):21),blend=-Math.expm1(-rate*dt);
    // Integrate the eased velocity over the step so different frame rates cover the same ground.
    const stepX=tx*dt+(motion.vx-tx)*blend/rate,stepZ=tz*dt+(motion.vz-tz)*blend/rate;
    motion.vx+=(tx-motion.vx)*blend;motion.vz+=(tz-motion.vz)*blend;
    const oldX=hero.x,oldZ=hero.z,oldYaw=hero.yaw;
    if(stepX||stepZ){
      if(roofs.level){
        roofs.along(hero,stepX,0,roofEnv);
        if(roofs.level)roofs.along(hero,0,stepZ,roofEnv);else if(!roofs.action)tryMove(hero,0,stepZ,.36);
      }else{tryMove(hero,stepX,stepZ,.36);roofs.enter(hero);}
    }
    if(roofs.action){motion.vx=motion.vz=0;return;}
    const movedX=hero.x-oldX,movedZ=hero.z-oldZ,distance=Math.hypot(movedX,movedZ);
    if(movedX===0||(!n&&Math.abs(motion.vx)<.004))motion.vx=0;
    if(movedZ===0||(!n&&Math.abs(motion.vz)<.004))motion.vz=0;
    if(n){
      const direction=distance>.0002?Math.atan2(movedX,movedZ):Math.atan2(dx,dz);
      hero.yaw+=angle(hero.yaw,direction)*-Math.expm1(-14*dt);
    }
    hero.y=ease(hero.y,roofs.level?roofs.floor(hero):footLevel(hero.x,hero.z),27,dt);
    motion.step(dt,distance,dt?(hero.yaw-oldYaw)/dt:0);
    if(hero.z>281&&hero.z<309&&BayDrawbridge.landingLevel(oldX,oldZ,-.3)!=null&&!bay.landing(hero.x,hero.z)&&BayDrawbridge.channel(hero.x,hero.z)){
      enterSurf(hero.y+motion.lift);return;
    }
    if(hero.x>208&&!(BayButtonwoodYard.onRamp(hero.x,hero.z)&&hero.y>-.52)&&!bay.landing(hero.x,hero.z,-.15)&&BaySwimming.water(hero.x,hero.z)&&
      hero.x>BaySwimming.coast(hero.z)+2.65&&motion.lift<.16)enterSurf(Math.max(0,hero.y+motion.lift));
  }
  function fitsCar(v,x,z,yaw){
    const s=v.footprint||bayCarLayout(v.kind),r=s.track-.075,reach=s.halfLength-r-.05,dx=Math.sin(yaw)*reach,dz=Math.cos(yaw)*reach;
    if(gull&&Math.abs(x-53.72)<5&&z>22&&z<44)for(const k of [-1,0,1])if(gullDoorHit(x+dx*k,z+dz*k,r,v.kind==="heron"||v.kind==="paloma"?1.62:s.glass?.[5]??1.85))return false;
    if(BayRooftops.near(x,z))for(const o of stairBlocks){
      for(const k of [-1,0,1])if(Math.abs(x+k*dx-o.x)<o.w/2+r&&Math.abs(z+k*dz-o.z)<o.d/2+r)return false;
    }
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
    const v=car,oldX=v.x,oldZ=v.z,oldYaw=v.yaw;
    const tr=works.trailer,towing=tr.hitched===v;
    const slipPaving=BayButtonwoodYard.surface(v.x,v.z)!=null;
    const pad=v.x>154&&v.x<175&&v.z>-102&&v.z<-83&&BayPalmaWash.floorLevel(v.x,v.z)!=null;
    const surface=slipPaving?.93*(1-.18*hours.wet):pad?.96*(1-.13*hours.wet):v.z>181?BayCut.surface(v.x,v.z)*(1-.13*hours.wet):v.x>166.45?.55:(nearStreet(v.x,v.z)?1:.84)*(1-.13*hours.wet);
    if(towing&&works.slip)parking=true;
    if(gull.holds(v)||palm.holds(v)||club.show?.v===v)parking=true;
    if(v===unit4&&(!rescue.traveling||!rescue.manual||rescue.reclaim)||active?.story?.holds(v)||active?.ferry?.holds(v)||cabs.holds(v)||recovery.held(v)||band.holds(v))parking=true;
    if(serviceVehicle===v&&!heat&&!held("KeyW","ArrowUp","KeyS","ArrowDown"))parking=true;
    let steering=parking?0:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    if(towing&&!steering&&!parking&&held("KeyS","ArrowDown")&&held("ShiftLeft","ShiftRight")&&dist(tr,boatYard.wet)<39&&Math.abs(angle(tr.yaw,boatYard.wet.yaw))<.7)steering=BayButtonwoodStreet.backSteer(v,tr,boatYard);
    BayDriving.step(v,dt,!parking&&held("KeyW","ArrowUp"),!parking&&held("KeyS","ArrowDown"),steering,!parking&&held("Space"),surface,v.upgrades.engine,parking);
    if(!parking&&v.z>181&&(Math.abs(v.speed)>.45||v.throttle>.10))v.vz-=9.81*BayCut.grade(v.x,v.z)*dt;
    if(Math.abs(v.yaw-oldYaw)>.00001&&!fitsCar(v,v.x,v.z,v.yaw)&&fitsCar(v,v.x,v.z,oldYaw)){v.yaw=oldYaw;v.yawRate*=.3;}
    let impact=0,wallX=0,wallZ=0;
    const x=v.x+v.vx*dt,z=v.z+v.vz*dt;
    if(x!==v.x){if(fitsCar(v,x,v.z,v.yaw))v.x=x;else{impact=Math.abs(v.vx);wallX=v.vx;v.vx*=-.10;}}
    if(z!==v.z){if(fitsCar(v,v.x,z,v.yaw))v.z=z;else{impact=Math.max(impact,Math.abs(v.vz));wallZ=v.vz;v.vz*=-.10;}}
    if(impact>5&&bumpLock<=0){
      dent(v,wallX,wallZ,impact);if(v===unit4&&rescue.phase==="return")rescue.grade=Math.max(0,rescue.grade-impact*.9);if(recovery.call&&tow.target)recovery.call.jolts++;
      active?.plate?.jolt(impact);sound.cue("hit");bumpLock=.7;persist();lastHud=-10;
    }
    const neighbors=cars.concat(patrol,motos.all);if(dist(v,transit.bus)<13)neighbors.push(transit.bus);
    for(const other of neighbors){
      if(other===v||v===wrecker&&other===tow.target)continue;
      const hit=BayDriving.contact(v,other);
      if(!hit){if(crashContacts.has(other)&&dist(v,other)>6.3)crashContacts.delete(other);continue;}
      const {nx,nz,depth}=hit,out=Math.min(.45,depth+.012);
      if(fitsCar(v,v.x+nx*out,v.z+nz*out,v.yaw)){v.x+=nx*out;v.z+=nz*out;}
      const inward=Math.max(0,-v.vx*nx-v.vz*nz),pace=other.path||other.serviceCar||other.meetCar||other.kind==="cruiser"?other.speed:0;
      const closing=inward+pace*(nx*Math.sin(other.yaw)+nz*Math.cos(other.yaw));
      if(closing>6&&inward>2&&!parking&&!crashContacts.has(other)&&bumpLock<=0){
        dent(v,-nx,-nz,closing);if(!motos.all.includes(other))dent(other,nx,nz,closing);
        if(v===unit4&&rescue.phase==="return")rescue.grade=Math.max(0,rescue.grade-closing*.85);
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
    if(towing&&(oldX!==v.x||oldZ!==v.z||oldYaw!==v.yaw)){
      if(!pullButtonwood(v)){
        Object.assign(v,{x:oldX,z:oldZ,yaw:oldYaw,vx:0,vz:0,speed:0,yawRate:0,brakes:1});
        if(elapsed-works.warnAt>3){works.warnAt=elapsed;note("Boat trailer","Ease forward and leave a wider path for the trailer.",2.5);}
      }else works.dirty=true;
    }else if(!towing&&dist(v,tr)<7&&BaySlipTrailer.pieces(tr).some(q=>BayDriving.contact(v,q))){
      Object.assign(v,{x:oldX,z:oldZ,yaw:oldYaw,vx:0,vz:0,speed:0,yawRate:0,brakes:1});
    }
    if(v===workTruck&&(oldX!==v.x||oldZ!==v.z))works.dirty=true;
    if(v===wrecker&&!tow.step(dt,towClear,recoveryEvent)){
      Object.assign(v,{x:oldX,z:oldZ,yaw:oldYaw,vx:0,vz:0,speed:0,yawRate:0,brakes:1});
      if(elapsed>(tow.scrapeAt??-10)+3){tow.scrapeAt=elapsed;note("Trailer clearance","The car needs a wider turn. Ease back and straighten the truck.",2.5);}
    }
    BayDriving.signedSpeed(v);skidMarks(v,surface);
    if(v.indicator&&Number.isFinite(v.signalFrom)){
      if(angle(v.signalFrom,v.yaw)*v.indicator>.52)v.signalTurned=true;
      if(v.signalTurned&&Math.abs(v.steer)<.075){v.indicator=0;v.signalFrom=null;v.signalTurned=false;}
    }
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
    const lift=v.hydraulic?.bodyLift||0;if(v!==serviceVehicle)return lift;
    const p=serviceTime/repairSeconds,t=clamp(Math.min(p,1-p)*4.5,0,1);
    return lift+.15*t*t*(3-2*t);
  }
  function readyForShop(v){
    if(v?.stockId&&!gull.record(v))return false;
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
    if(panel!=="upgrades"||!readyForShop(v)||!parts.includes(part)||part.id==="hydraulics"&&!brisasCanFit(v)||v.upgrades[part.id]||save.wallet<part.price)return false;
    v.upgrades[part.id]=true;if(part.id==="hydraulics")BayBrisasClub.switches(v);save.upgrades[v.garageKey]=v.upgrades;
    save.wallet-=part.price;persist();lastHud=-10;
    return true;
  }
  function spaceToSwerve(v,x,z,yaw,ahead,checkPlayer=false){
    const county=z>181?BayCut.nearest(x,z):null;
    const apron=v.brisasLead&&x>103&&x<143&&z>46.6&&z<77||v.recoveryOwner&&x>-92&&x<-69&&z>-39&&z<2||v.washGuest&&x>146&&x<168&&z>-161&&z<-66;
    if(!apron&&(county?county.d>county.route.halfWidth-.55:Math.min(Math.abs(x-nearestAxis(x)),Math.abs(z-nearestAxis(z)))>5.95)||!fitsCar(v,x,z,yaw))return false;
    const probe={kind:v.kind,x,z,yaw};
    if(boatTrailerBlocks(probe,v))return false;
    if(dist(probe,transit.bus)<8&&BayDriving.contact(probe,transit.bus)||motos.all.some(b=>dist(probe,b)<5&&BayDriving.contact(probe,b)))return false;
    if(backup.roadblock?.units.some(u=>BayDriving.contact(probe,u)))return false;
    for(const other of cars){
      if(other===v||(other===car&&!checkPlayer)||Math.abs(other.x-x)>11||Math.abs(other.z-z)>11)continue;
      const travel=other.path?other.speed*ahead:0;
      const at=travel?{kind:other.kind,x:other.x+Math.sin(other.yaw)*travel,z:other.z+Math.cos(other.yaw)*travel,yaw:other.yaw}:other;
      if(BayDriving.contact(probe,at))return false;
    }
    for(const w of walkers){
      if(w.palmPassenger||Math.abs(w.x-x)>6||Math.abs(w.z-z)>6)continue;
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
    lastTrafficHorn=streetTime;sound.cue("trafficHorn",{kind:v.kind,distance:dist(v,pos())});
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
    const p=v.owner||{motion:new BayPlayerMotion()};
    Object.assign(p,{x:v.x,z:v.z,y:footLevel(v.x,v.z),yaw:v.yaw,seat:1,seated:true,side:0,stand,stranded:true,
      phase:"out",age:0,path:[],style:1+v.id%(personColors.length-1)});
    roadDrivers.set(v,p);
  }
  function stepRoadDrivers(dt){
    for(const [v,p] of roadDrivers){
      p.age+=dt;
      if(p.seated){
        if(!p.side){const plan=doorPlan(v,true,p,-1)||doorPlan(v,true,p,1);if(!plan)continue;p.side=plan.side;}
        p.seat=Math.max(0,p.seat-dt/1.55);BayCarAccess.pose(v,p.side,p.seat,p,p.motion,footLevel,dt);
        if(!p.seat){p.seated=false;p.phase="inspect";p.motion.reset();p.path=recoveryWalkway(p,p.stand,v)||[];}
      }else if(p.path.length)BayCarAccess.walkPath(p,p.motion,p.path,dt,footLevel,1.65);
      else if(!v.roadside||v.onLift||v===car||dist(p,v)>12){
        if(dist(p,pos())>65){roadDrivers.delete(v);continue;}p.motion.step(dt,0,0);
      }else{p.yaw+=angle(p.yaw,Math.atan2(v.x-p.x,v.z-p.z))*Math.min(1,dt*3);p.motion.step(dt,0,0);}
    }
  }
  function traffic(dt){
    const p=pos(),driver=play&&!transfer&&!cycles.transfer?(car||motos.bike||cycles.riding||skate.rider||(transit.driving?transit.bus:null)):null;
    for(const v of cars){
      if(!v.path||v===car||v===transfer?.v){if(v!==car||v===transfer?.v)v.indicator=0;continue;}
      const t=v.path[v.corner],from=v.path[(v.corner+v.path.length-1)%v.path.length];
      const dx=t.x-from.x,dz=t.z-from.z,n=Math.hypot(dx,dz)||1,ux=dx/n,uz=dz/n;
      const remaining=(t.x-v.x)*ux+(t.z-v.z)*uz,offset=(v.x-from.x)*uz-(v.z-from.z)*ux;
      if(remaining<.045){
        if(v.finiteRoute&&v.corner===v.path.length-1){v.path=null;v.indicator=0;v.yaw+=angle(v.yaw,v.finiteYaw);BayDriving.settle(v);}
        else v.corner=(v.corner+1)%v.path.length;
        continue;
      }
      const yielding=play&&rescue.yielding(v,ux,uz,remaining,offset,streetTime);
      v.indicator=yielding&&!yielding.cross?1:BayMotorCourt.signal(v);
      v.wait=Math.max(0,v.wait-dt);
      if(v.wantsCurb&&!v.brisasLead&&!v.guestId&&!v.washGuest&&!v.pullOver&&streetTime>=(v.curbCheck||0)){
        v.curbCheck=streetTime+1;v.pullOver=shoulder(v,ux,uz,offset,remaining);
      }
      const stop=v.pullOver,run=stop?(stop.x-v.x)*ux+(stop.z-v.z)*uz:Infinity;
      if(stop&&run<.10){stopAtCurb(v);continue;}
      if(driver&&!yielding&&!(driver===unit4&&unit4.responseLights)&&!stop&&!v.reaction&&streetTime>=(v.reactAfter||0)){
        const threat=BayStreetReactions.trafficThreat(driver,v,ux,uz);
        if(threat){
          v.reaction={until:streetTime+.65+threat.when*.54,offset:chooseSwerve(v,ux,uz,offset,remaining,threat.side)};
          v.reactAfter=streetTime+3.4+(v.id%4||0)*.19;
          trafficHonk(v);
        }
      }
      let clearance=v.z>224?bridge.stopDistance(v,ux,uz,bayCarLayout(v.kind).halfLength):Infinity,redAhead=Number.isFinite(clearance);
      const ahead=(q,width,gap)=>{
        const rx=q.x-v.x,rz=q.z-v.z,front=rx*ux+rz*uz;
        if(front>.10&&front<20&&Math.abs(rx*uz-rz*ux)<width)clearance=Math.min(clearance,Math.max(0,front-gap));
      };
      if(!roofs.raised||p!==hero||p.y<2.4)ahead(p,car?1.95:1.55,car?4.65:3.1);
      if(transfer){
        const a=transfer,s=bayCarLayout(a.v.kind);
        ahead(hero,1.5,3);ahead(BayDriving.world(a.v,a.side*(s.hingeX+.65),s.back),1.45,3);
      }
      for(const b of motos.all)if(play&&b!==driver)ahead(b,1.49,3.45);
      for(const other of cars)if(other!==v&&other!==car)ahead(other,1.75,4.65);
      if(works&&Math.abs(works.trailer.x-v.x)<23&&Math.abs(works.trailer.z-v.z)<23){
        ahead(works.trailer,2.54,5.25);ahead(BayDriving.world(works.trailer,0,-1.98),2.52,4.6);
        ahead(BaySlipTrailer.coupler(works.trailer),1.85,4.25);
        for(const p of works.trailer.sweep())ahead(p,2.72,5.65);
      }
      if(Math.abs(v.x-transit.bus.x)<25&&Math.abs(v.z-transit.bus.z)<25){
        const b=transit.bus;
        for(const along of [-2.85,0,2.85])ahead(BayDriving.world(b,0,along),2.18,3.95);
      }
      if(v.z>228)ahead(bridge.walker,1.2,2.75);
      for(const unit of patrol)ahead(unit,unit.role==="roadblock"?3.1:1.85,4.7);
      if(backup.roadblock&&!backup.roadblock.rail.hit)ahead(backup.roadblock.rail,2.55,3);
      for(const w of walkers)if(!w.palmPassenger&&!(w===band.local&&band.june.ride)&&Math.abs(w.x-v.x)<17&&Math.abs(w.z-v.z)<17)ahead(w,1.15,2.95);
      const vertical=Math.abs(uz)>.7;
      for(const s of BayStreetArt.signals){
        const rx=s.x-v.x,rz=s.z-v.z,d=rx*ux+rz*uz,side=Math.abs(rx*uz-rz*ux);
        if(side<4.4&&d>7.1&&d<24&&vertical!==((streetTime+s.offset)%14<7)){
          clearance=Math.min(clearance,Math.max(0,d-9.7));redAhead=true;
        }
      }
      const response=v.reaction,evading=response&&streetTime<response.until,before=v.speed;
      let maximum=stop?Math.min(4.6,Math.max(.36,run*.94)):evading?(response.offset?v.pace*.52:0):v.pace;
      if(yielding)maximum=Math.min(maximum,yielding.max);
      if(v.finiteRoute&&v.corner===v.path.length-1)maximum=Math.min(maximum,Math.max(.5,remaining*1.3));
      if(v.indicator)maximum=Math.min(maximum,5.7);
      const pace=v.wait>0?0:Math.min(maximum,clearance*1.24);
      v.speed=ease(v.speed,pace,pace<v.speed?(evading?6.2:4.1):1.7,dt);
      let step=Math.min(remaining,clearance,run,v.speed*dt);
      const goal=stop?2.8:yielding?yielding.goal:evading?response.offset*clamp((remaining-.4)/4,0,1):0;
      const lateralLimit=step*((evading||yielding?.goal>.1) ? .76 : .48);
      let lateral=clamp((goal-offset)*-Math.expm1(-(evading?5.6:3.9)*dt),-lateralLimit,lateralLimit);
      const x=v.x+ux*step,z=v.z+uz*step;
      if((response||Math.abs(lateral)>.00001)&&step>0&&!spaceToSwerve(v,x+uz*lateral,z-ux*lateral,v.yaw,0,true)){
        if(!lateral||!spaceToSwerve(v,x,z,v.yaw,0,true)){step=0;v.speed=0;}
        lateral=0;
      }
      const oldX=v.x,oldZ=v.z,oldYaw=v.yaw;
      v.x+=ux*step+uz*lateral;v.z+=uz*step-ux*lateral;
      if(step<.0001&&clearance<.1)v.speed=0;
      v.blocked=v.speed<.4?v.blocked+dt:0;
      if(driver&&!yielding&&!(driver===unit4&&unit4.responseLights)&&!response&&!redAhead&&v.blocked>3&&v.blocked<4&&dist(v,driver)<8&&streetTime-lastTrafficHorn>10){
        const gap=BayDriving.local(v,driver.x,driver.z);
        if(gap.z>0&&Math.abs(gap.x)<1.65)trafficHonk(v);
      }
      v.brakes=ease(v.brakes||0,(yielding&&v.speed<1||evading||pace<before-.35||clearance<.35)?1:0,12,dt);
      const steer=step>.0001?Math.atan2(lateral,step):0;
      let heading=Math.atan2(ux,uz)+steer;
      if(v.finiteRoute&&v.corner===v.path.length-1)heading+=angle(heading,v.finiteYaw)*clamp(1-remaining/3.8,0,1);
      const turn=step>.00001?angle(v.yaw,heading)*-Math.expm1(-8*dt):0;
      v.yaw+=turn;v.lean=ease(v.lean||0,clamp(turn/Math.max(dt,.001)*v.speed*.017,-.09,.09),7,dt);
      if(Math.abs(v.x-transit.bus.x)<8&&Math.abs(v.z-transit.bus.z)<8){
        const hit=BayDriving.contact(v,transit.bus);
        if(hit){
          const prior=BayDriving.contact({kind:v.kind,x:oldX,z:oldZ,yaw:oldYaw},transit.bus);
          if(!prior||hit.depth>prior.depth+.000001){v.x=oldX;v.z=oldZ;v.yaw=oldYaw;v.speed=0;v.brakes=1;}
        }
      }
      if(works&&Math.abs(v.x-works.trailer.x)<8&&Math.abs(v.z-works.trailer.z)<8){
        const old={kind:v.kind,x:oldX,z:oldZ,yaw:oldYaw};
        if(BaySlipTrailer.pieces(works.trailer).some(q=>buttonwoodHit(v,old,q))){
          Object.assign(v,{x:oldX,z:oldZ,yaw:oldYaw,speed:0,brakes:1});
        }
      }
      if(v.brisasLead||v.kind==="estate"||v.kind==="stepside"){
        const s=bayCarLayout(v.kind),travel=Math.hypot(v.x-oldX,v.z-oldZ);
        v.wheelSpin=(v.wheelSpin+travel/s.wheel)%(Math.PI*2);
        const steer=travel>.008?Math.atan((s.axles[1]-s.axles[0])*angle(oldYaw,v.yaw)/travel):0;
        v.steer=ease(v.steer||0,clamp(steer,-.52,.52),11,dt);
      }
      if(response&&!evading&&Math.abs(offset)<.09)v.reaction=null;
    }
    if(roadDrivers.size)stepRoadDrivers(dt);
    if(play){
      owners.step(dt,motorEnv);
      if(heat&&valet.onDuty){dropJob();note("Marlin Motor Court","Tess has the stand. Come back when the street is quiet.",3);}
      valet.step(dt,motorEnv);
      stepWash(dt);
    }
    if(play&&unit4.responseLights&&Math.abs(unit4.speed)>2){
      for(const w of walkers)if(!w.onTour&&!w.startle&&Math.abs(w.x-unit4.x)<23&&Math.abs(w.z-unit4.z)<23){
        const q=BayDriving.local(unit4,w.x,w.z);if(q.z>1&&q.z<22&&Math.abs(q.x)>4.7&&Math.abs(q.x)<10.5){w.alert=Math.max(w.alert||0,.45);w.yaw+=angle(w.yaw,Math.atan2(unit4.x-w.x,unit4.z-w.z))*Math.min(1,dt*4);}
      }
    }
    BayLocals.animatePeople(play?walkers:titleWalkers,dt,driver,cars,BayStreetArt.signals,streetTime,
      (x,z,r)=>valid(x,z,r)||z>310&&bay.landing(x,z,r),play?hours.rain:0);
    if(play)for(const w of walkers)BayRainWalk.weather(w,hours.rain,dt);
    if(p.z>215)for(const w of walkers){
      if(!w.fieldSource||!w.wait||w.alert>0||w.startle||w.fieldSource==="trawler"&&w.x<229)continue;
      const subject=BayCutWildlife.pose(w.fieldSource,streetTime,hours);
      w.yaw+=angle(w.yaw,Math.atan2(subject.x-w.x,subject.z-w.z))*Math.min(1,dt*3.5);
    }
  }
  function clearCruiser(unit,x,z,yaw){
    const probe={kind:"cruiser",x,z,yaw};
    if(dist(probe,transit.bus)<8&&BayDriving.contact(probe,transit.bus))return false;
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
    const p=pos(),coach=transit.aboard?transit.bus:null,vx=motos.bike?.vx??skiff?.vx??car?.vx??coach?.vx??cycles.riding?.vx??skate.rider?.vx??swim?.vx??motion.vx,vz=motos.bike?.vz??skiff?.vz??car?.vz??coach?.vz??cycles.riding?.vz??skate.rider?.vz??swim?.vz??motion.vz;
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
    boxed=(!roofs.raised||hero.y<2.65)&&visibleGap<8.4&&Math.hypot(vx,vz)<3.4?boxed+dt:Math.max(0,boxed-dt*1.7);
    if(boxed>5.3){const fine=Math.min(save.wallet,65);save.wallet-=fine;persist();if(transfer){transfer.v.doorAngle=0;transfer=null;}if(car)BayDriving.settle(car);
      if(motos.bike){const b=motos.bike;BaySecondSeat.settle(b);motos.park(b,motoEnv);motos.player=null;motos.finder=motos.cockpit=false;}
      transit.releaseForBust();skateTape.stop();skate.rider=skate.run=null;
      if(skiff)returnBoat(skiff,bay.docks[0]);
      if(cycles.riding){const b=cycles.riding;cycles.detach();parkCycle(b);}
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
  function radioToggle(){
    radio=sound.setEnabled(!radio);try{localStorage.setItem("sundownBay.audio",radio?"on":"off");}catch{}
    $("audioKey").querySelector("span").textContent=radio?"Sound on":"Sound off";
    if(!panel)note("City sound",radio?"Sound on":"Sound off",1.7);
  }
  function syncRadioBook(latest){
    if(!latest?.airwaves||!(latest.airwaves.rev>save.airwaves.rev))return;
    Object.assign(save.airwaves,BayAirwaves.read(latest.airwaves));
    if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
    if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    lastHud=-10;
  }
  function writeRadioBook(change){
    try{syncRadioBook(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
    if(change(save.airwaves)===false)return;
    save.airwaves.rev++;persist();
  }
  function receiverId(){
    if(!play||transfer||deckStep)return null;
    if(car)return car.garageKey||"car/"+car.id;
    if(windowRide?.held)return windowRide.vehicle.garageKey;
    if(cabs.playerHeld&&cabs.booking?.stage==="ride")return taxi.garageKey;
    if(transit.aboard)return "route-6";
    if(skiff)return skiff===pip?"pip-16":skiff===clubBoat?"club-tender":skiff===postalSkiff?"air-dock":("boat/"+boats.indexOf(skiff)+"/"+skiff.kind);
    return room&&room.kind!=="cinema"?"room-14":null;
  }
  function tuneRadio(direction){
    const device=receiverId();if(!device||broadcastDesk.mix)return false;
    const next=BayAirwaves.tune(device,direction);sound.cue("fm-tune",{station:next});
    if(band.tape){band.tape=null;band.onAir=false;}
    if(onAir){onAir=null;sound.stopField();}
    updateRadio();lastHud=-10;return true;
  }
  function updateRadio(){
    const id=receiverId();
    if(id&&save.airwaves.request&&BayAirwaves.stationFor(id)==="sol"){
      writeRadioBook(b=>{if(!b.request)return false;b.encore={id:b.request,at:hours.total};b.request="";});
    }
    broadcastDesk.update(id,hours.total,elapsed);broadcastDesk.headlines(save,hours,bridge,elapsed);
  }
  function atRadioDesk(){return onStreetFeet()&&!active&&!heat&&!watchCrew.towing&&!cabs.booking&&dist(hero,radioSite.stand)<3.15;}
  const radioWalk=[{x:154.86,z:112.86},{x:156.66,z:112.85},{x:157.03,z:116.74},{x:154.93,z:116.58}];
  function startRadioSet(slot){
    if(!atRadioDesk())return;
    const nearby=cars.filter(v=>Math.abs(v.x-radioSite.x)<7&&Math.abs(v.z-radioSite.z)<7);
    const path=recoveryWalkway(hero,radioSite.stand,null,radioWalk,nearby);
    if(!path){closePanel();note("Ivo Vidal","Walk around to the open end of the table.",3.5);return;}
    broadcastDesk.mix=new BayAirwaves.Mix(slot);broadcastDesk.approach=path;broadcastDesk.close=true;
    motion.vx=motion.vz=0;closePanel();keys.clear();lastHud=lastMap=-10;
    speak("Ivo Vidal","First record’s yours. Match the numbers, then start the other side on the first lamp.");
  }
  function leaveRadioDesk(){
    broadcastDesk.mix=broadcastDesk.approach=null;motion.vx=motion.vz=0;keys.clear();cameraSnap();lastHud=lastMap=-10;
  }
  function radioKeys(code){
    const desk=broadcastDesk,m=desk.mix;
    if(code==="BracketLeft"||code==="BracketRight")return tuneRadio(code==="BracketLeft"?-1:1);
    if(!m){
      if(code!=="KeyF"||!atRadioDesk())return false;
      if(!save.airwaves.met)writeRadioBook(b=>{b.met=true;});openPanel("radio-desk");return true;
    }
    if(code==="KeyE"){leaveRadioDesk();return true;}
    if(code==="KeyV"){desk.close=!desk.close;return true;}
    if(code==="KeyX"){m.pan=m.tilt=0;return true;}
    if(!desk.approach&&!m.result&&["KeyW","KeyS","ArrowUp","ArrowDown"].includes(code)){
      m.trimDir=code==="KeyW"||code==="ArrowUp"?1:-1;m.trim(m.trimDir);m.tempoHold=.29;return true;
    }
    if(!desk.approach&&code==="Space"){
      if(m.result){desk.mix=new BayAirwaves.Mix(m.slot);keys.clear();}
      else if(!m.cue())note("Cue deck B","Pull the fader back to A before restarting the record.",2.5);
      return true;
    }
    if(code==="KeyF"&&m.result){leaveRadioDesk();openPanel("radio-desk");return true;}
    return !["KeyR","Escape","KeyJ","KeyM","Equal","Minus","NumpadAdd","NumpadSubtract"].includes(code);
  }
  function radioStep(dt){
    const desk=broadcastDesk,m=desk.mix;
    if(!m){
      const pose=motion.console;
      if(pose){pose.amount=Math.max(0,pose.amount-dt*4);pose.left.weight=pose.right.weight=pose.amount;if(!pose.amount)motion.console=null;}
      return;
    }
    if(heat){leaveRadioDesk();return;}
    if(desk.approach){
      const path=desk.approach,q=path[0],d=dist(hero,q),move=Math.min(d,1.62*dt);
      if(d>.0001){const x=q.x-hero.x,z=q.z-hero.z;hero.yaw+=angle(hero.yaw,Math.atan2(x,z))*Math.min(1,dt*12);
        hero.x+=x*move/d;hero.z+=z*move/d;hero.y=footLevel(hero.x,hero.z);}
      motion.step(dt,move,0);if(d<=move+.00001)path.shift();
      if(!path.length){desk.approach=null;hero.yaw=-Math.PI/2;cameraSnap();}
      return;
    }
    const trim=Number(held("KeyW","ArrowUp"))-Number(held("KeyS","ArrowDown")),fade=Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    m.pan+=(Number(held("KeyC"))-Number(held("KeyQ"))+pointer.edgeX*.65)*dt*1.35;
    m.step(dt,trim,fade);desk.hands(hero,motion,dt);motion.step(dt,0,0);
    if(m.result&&!m.receipt){
      writeRadioBook(b=>{
        m.receipt=BayAirwaves.stamp(b,m.result);
        if(!m.receipt.aired)return false;
        if(m.receipt.pay){save.wallet+=m.receipt.pay;save.paid++;}return true;
      });
      if(m.receipt.aired){
        if(m.receipt.pay)sound.cue("paid");
        speak("Ivo Vidal",m.receipt.pay?"I’ve put "+cash(m.receipt.pay)+" in the sleeve. Tune Sol in the car. I’m playing your mix.":"Got the tape. Tune Sol in the car and I’ll run your best cut.");
      }else speak("Ivo Vidal",m.result.note+" I’ve got another blank if you want it.");
      lastHud=-10;
    }
  }
  function radioDeskPanel(b,bookOnly){
    const fm=BayAirwaves,book=save.airwaves,m=broadcastDesk.mix;
    signedNote(b,m?"I’ll keep both records turning while you look at the card.":bookOnly?"Dial up 88.3 in a car and leave the request with me.":"When the first lamp comes round, start the second record. Once the drums sit together, move the fader. I can use a good take on Sol.","Ivo Vidal");
    if(m){b.append(makeButton("Back to the turntables",m.slot.name,"Resume",closePanel),makeButton("Step away","Leave the deck to Ivo.","Leave",()=>{leaveRadioDesk();closePanel();}));return;}
    for(const slot of fm.slots){
      const a=fm.records[slot.from],c=fm.records[slot.to],record=book.sets[slot.id];
      if(!bookOnly)b.append(makeButton(slot.name,a.title+" into "+c.title+". "+slot.note+(record?"  Best "+record.score+"/100.":"  First air spot "+cash(slot.fee)+"."),"Take the decks",()=>startRadioSet(slot)));
      if(record)b.append(makeButton("Request "+slot.name,"Your recorded crossfade · "+record.score+"/100",book.request===slot.id?"Queued":"Play on Sol",()=>{
        writeRadioBook(s=>{s.request=s.featured=slot.id;});closePanel();updateRadio();note("Sol FM requests",receiverId()&&broadcastDesk.station==="sol"?"Ivo has your mix on air.":"Tune 88.3 in a vehicle to hear your mix.",3);
      }));
    }
    if(bookOnly)b.append(makeButton("Sol FM Boardwalk van","The turntables are beside the van, south of the pier.","Map",()=>clockPin(radioPin)));
  }
  const boardwalkFrame={span:73,ahead:7,beside:0};
  function boardwalkFraming(dt){
    const b=cycles.riding,f=boardwalkFrame;
    let span=73+25*cameraRig.carBlend,ahead=7+4*cameraRig.carBlend,beside=0;
    if(b){
      span=40+2.1*Math.min(12,b.speed);ahead=4+.55*b.speed;
      if(cycles.run?.phase==="meet"){
        const n=clamp((12-dist(b,cycles.javi))/9,0,1);beside=n*n*(3-2*n);
        span+=(16-span)*beside;ahead+=(.85-ahead)*beside;
      }
    }
    if((b||onStreetFeet())&&(!active||active.relay)){
      const n=clamp((11-dist(pos(),ticketWindow))/8,0,1),counter=n*n*(3-2*n);
      span+=(19-span)*counter;ahead+=(1.4-ahead)*counter;
    }
    if(works.rearView&&car&&works.trailer.hitched===car){span=25;ahead=-3;beside=0;}
    if(club.show){span=club.show.wide?15:23;ahead=beside=0;}
    if(!car&&BayPalmDiner.contains(hero.x,hero.z)){span=palm.playerSeat?20:26;ahead=1.2;}
    f.span=ease(f.span,span,4.7,dt);f.ahead=ease(f.ahead,ahead,4.7,dt);f.beside=ease(f.beside,beside,5.5,dt);
  }
  const keyView={mix:0,x:0,z:0};
  function moveCamera(dt,t){
    if(unit.transition&&!unit.transition.braking&&!panel){crewAerial(dt);return;}
    if(unit.eye?.window&&!panel){const l=unit.eye;Object.assign(cam,windowEye(),{yaw:l.yaw,pitch:l.pitch,focal:1.50*l.zoom});return;}
    if(unit.eye&&!panel){const lens=unit.eye;Object.assign(cam,{x:hero.x+.12*Math.cos(lens.yaw),y:hero.y+1.61,z:hero.z-.12*Math.sin(lens.yaw),yaw:lens.yaw,pitch:lens.pitch,focal:1.55*lens.zoom});return;}
    if(broadcastDesk.mix&&!broadcastDesk.approach&&!isTop()&&!panel){broadcastDesk.camera(cam,cameraRig.zoom);return;}
    if(works.line?.close&&!isTop()&&!panel){
      works.line.look+=(Number(held("KeyC"))-Number(held("KeyQ"))+pointer.edgeX*.64)*dt*1.6;
      BayButtonwoodStreet.deckCamera(cam,works,cameraRig.zoom);return;
    }
    if(works.rearView&&car&&works.trailer.hitched===car&&!isTop()&&!panel){BayButtonwoodStreet.rigCamera(cam,works);return;}
    if(club.show?.wide&&!isTop()){BayBrisasStreet.camera(cam,club.show.v,footLevel);return;}
    if(palm.match){BayPalmRoom.camera(cam,palm,innerWidth,innerHeight);return;}
    if(!play){
      const drift=Math.sin(t*.051);
      cam.x=157.5+drift*1.1;cam.z=-46.5+Math.sin(t*.039)*2;
      cam.y=3.75;cam.yaw=-.63+drift*.07;cam.pitch=-.075;cam.focal=1.48;
      return;
    }
    if(panel)return;
    if(motos.finder||motos.cockpit&&motos.bike&&!isTop()){
      const turn=Number(held("KeyC")||motos.finder&&held("ArrowRight"))-Number(held("KeyQ")||motos.finder&&held("ArrowLeft")),pitch=Number(held("ArrowUp"))-Number(held("ArrowDown"));
      motos.look((turn*1.17+pointer.edgeX*.83)*dt,motos.finder?pitch*.73*dt:0);
      if(motos.finder){Object.assign(cam,motos.eye());return;}
      const b=motos.bike,eye=BayMotorcyclesArt.eye(b,b.y,motos.player.seat);Object.assign(cam,eye,{yaw:eye.yaw+motos.pan,pitch:eye.pitch+motos.tilt,focal:1.32});return;
    }
    if(airCockpit()){
      const l=airLine;l.pan=clamp(l.pan+(Number(held("KeyC"))-Number(held("KeyQ"))+pointer.edgeX*.7)*1.65*dt,-2.03,2.03);
      Object.assign(cam,BayAirmailArt.eye(l.plane,l.seatRole(),l.pan,l.tilt));return;
    }
    if(skate.run?.lens&&skate.rider){
      const r=skate.rider,c=skate.crew.find(c=>c.site===skate.run.site),f=c.filmer;
      const yaw=Math.atan2(r.x-f.x,r.z-f.z);
      const x=f.x+Math.sin(yaw)*.32,z=f.z+Math.cos(yaw)*.32,y=f.y+1.48;
      const range=Math.hypot(r.x-x,r.z-z);
      Object.assign(cam,{x,y,z,yaw,pitch:Math.atan2(r.y+r.air+.72-y,range),focal:clamp(range*.31,1.18,5.6)});return;
    }
    if(busCameras()){
      const b=transit.bus,p=transit.player,driver=p.role==="driver",s=p.seat;
      transit.pan=clamp(transit.pan+(Number(held("KeyC"))-Number(held("KeyQ"))+pointer.edgeX*.6)*1.7*dt,-2.24,2.24);
      const eye=BayCityBusArt.bodyPoint(b,s.x,s.top+.70,s.z+(driver?-.13:.085));
      Object.assign(cam,eye,{yaw:b.yaw+transit.pan,pitch:transit.tilt-(b.pitch||0)*Math.cos(transit.pan),focal:driver?1.22:1.30});return;
    }
    if(neon.testing){
      const eye=neon.view?{x:127.71,y:14.43,z:-43.35}:{x:120.95,y:15.6,z:-41.46};
      const target=neon.view?{x:126.65,y:13.00,z:-45}:{x:128,y:14.40,z:-45};
      cam.x=eye.x;cam.y=eye.y;cam.z=eye.z;cam.yaw=Math.atan2(target.x-eye.x,target.z-eye.z);
      cam.pitch=Math.atan2(target.y-eye.y,dist(eye,target));cam.focal=neon.view?1.23:1.46;return;
    }
    if(bridgeLook()){
      const eye=BayDrawbridge.at(-5.5,22.5),target=BayDrawbridge.at(0,clamp(bridge.packet.u*.43,-10,12));
      cam.x=eye.x;cam.z=eye.z;cam.y=6.8;cam.yaw=Math.atan2(target.x-eye.x,target.z-eye.z);
      cam.pitch=Math.atan2(1.75-cam.y,dist(eye,target));cam.focal=1.27;return;
    }
    if(band.take&&band.take.phase!=="leave"&&dist(hero,band.site.kit)<5.4){
      const nearKit=kitCam===1,base=nearKit?{x:190.1,z:84.18,y:2.64}:{x:181.85,z:85.2,y:2.64};
      const aim=nearKit?{x:186.72,z:82.68,y:1.35}:{x:187.49,z:82.84,y:1.6};
      const pan=band.pan||0,dx=base.x-aim.x,dz=base.z-aim.z;
      cam.x=aim.x+dx*Math.cos(pan)+dz*Math.sin(pan);cam.z=aim.z+dz*Math.cos(pan)-dx*Math.sin(pan);cam.y=base.y+(band.tilt||0);
      cam.yaw=Math.atan2(aim.x-cam.x,aim.z-cam.z);cam.pitch=Math.atan2(aim.y-cam.y,dist(cam,aim));cam.focal=nearKit?1.28:1.56;return;
    }
    const handover=exchangingKey();
    keyView.mix=ease(keyView.mix,handover?1:0,handover?6.0:7.2,dt);
    if(handover){
      keyView.x=(hero.x+valet.focus.x)*.5;keyView.z=(hero.z+valet.focus.z)*.5;
    }
    if(isTop())boardwalkFraming(dt);
    if(boardwalk.player?.phase==="ride"){
      const w=boardwalk,look=Number(held("KeyC"))-Number(held("KeyQ"));
      w.pan+=(look*1.8+pointer.edgeX*1.45)*dt;
      const s=hero,range=w.outside?6.6:0;
      cam.x=s.x-Math.sin(w.pan)*range;cam.z=s.z-Math.cos(w.pan)*range;
      cam.y=s.y+(w.outside?2.48-Math.sin(w.tilt)*range:1.34);cam.yaw=w.pan;cam.pitch=w.tilt;cam.focal=w.outside?1.27:1.13;return;
    }
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
    if(insideSeat()&&!isTop()){
      const body=roadBody(car),p=BayDriversSeat.eye(car);
      const eye=chassisPoint(body,p.x,p.y,p.z,footLevel(car.x,car.z)+.008+serviceLift(car));
      driverSeat.pan=clamp(driverSeat.pan+((Number(held("KeyC"))-Number(held("KeyQ")))*1.72+pointer.edgeX*1.38)*dt,-2.15,2.15);
      Object.assign(cam,eye,{yaw:car.yaw+driverSeat.pan,pitch:driverSeat.tilt-body.pitch*Math.cos(driverSeat.pan)+body.lean*Math.sin(driverSeat.pan),focal:1.38});return;
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
    cameraRig.update(cam,subject,airLine.player&&!airLine.transfer?airLine.plane:transit.aboard?transit.bus:cabs.playerHeld?taxi:windowRide?.held?windowRide.vehicle:deckStep?.v||skiff||transfer?.v||car||motos.bike||cycles.riding||skate.rider,dt,elapsed,{flight:!!airLine.player,skate:!!skate.rider,rear:!motos.bike&&!airLine.aboard&&!skate.rider&&!transit.aboard&&!pickup&&held("KeyV"),court:!!pickup,swim,lift:pickup?pickup.human.lift:motion.lift,ground:airLine.aboard?(airLine.transfer?hero.y:airLine.plane.y):skiff?0:skate.rider?skate.rider.y+skate.rider.air*.42:boardwalk.player||roofs.raised?hero.y:cycles.riding?footLevel(subject.x,subject.z)+cycles.riding.air*.65:footLevel(subject.x,subject.z),
      seat:windowRide?.held?windowRide.seat:cycles.riding ? .53*cycles.riding.mount : cabs.playerHeld?cabs.booking.seat:transfer||deckStep?(motion.ride?.seat||0):undefined});
    if(palm.playerSeat?.amount>.72&&cameraRig.hideActor&&!isTop()){
      Object.assign(cam,{x:hero.x,y:palm.playerSeat.seat.seatY+.83,z:hero.z,yaw:cameraRig.yaw,pitch:-.08-cameraRig.elevation*.20,focal:1.35});
    }
    if(keyView.mix>.002&&!isTop()){
      const f=keyView.mix,eye={x:keyView.x-.36,z:keyView.z-2.69};
      const y=footLevel(eye.x,eye.z)+1.45;
      cam.x+=(eye.x-cam.x)*f;cam.z+=(eye.z-cam.z)*f;cam.y+=(y-cam.y)*f;
      cam.yaw+=angle(cam.yaw,Math.atan2(keyView.x-eye.x,keyView.z-eye.z))*f;
      cam.pitch+=(-.13-cam.pitch)*f;cam.focal+=(1.60-cam.focal)*f;
    }
  }
  function collectMap(modeName,cx,cz,scale){
    if(cycles.riding)cycles.riding.kit=save.courts.equipped;
    if(skate.rider)skate.rider.shirt=BayCourtPlayers.kitColors[save.courts.equipped];
    const take=active?.take,driving=(!!car||!!take)&&!transfer;
    const displayCar=paintPreview||car;
    const allTraffic=modeName==="atlas"?patrol:cars.filter(v=>!driving||v!==car||car===meet.jules).concat(patrol);
    const p=transfer||deckStep||cabs.playerHeld?hero:pos();
    if(exchangingKey())Object.assign(keyMapActor,{x:hero.x,y:hero.y,z:hero.z,yaw:hero.yaw,kit:save.courts.equipped});
    const peds=[];
    if(modeName==="street"){
      const people=play?walkers.concat(jobContacts.filter(c=>c.style!==undefined&&c.id!==active?.job.id&&!(meet.rival&&c.id==="getaway"))):walkers;
      for(const w of people)if((!play||w!==band.local&&!w.palmManaged)&&(!take||!BayTake.onSet(w)))peds.push({x:w.x,z:w.z,yaw:w.yaw,shirt:personColors[w.style][1],skin:personColors[w.style][0],startle:w.startle,canopy:w.canopy,canopyStyle:w.canopyStyle,iceBox:w.fieldSource==="trawler"&&w.index<=6&&w.index>0});
      if(play)for(const w of BayPlates.regulars)if(dinerIsOut(w))peds.push({x:w.x,z:w.z,yaw:w.yaw,shirt:personColors[w.style][1],skin:personColors[w.style][0]});
      if(play&&airLine.reader.stage!=="ride"){const r=airLine.reader;peds.push({x:r.x,z:r.z,yaw:r.yaw,shirt:"#d1ae74",skin:"#a37857"});}
      if(play)peds.push({...BayCut.station,yaw:-2.3,shirt:"#bea56b",skin:"#91654b"});
      if(play)peds.push({...bridge.walker,shirt:personColors[4][1],skin:personColors[4][0]},
        {...neon.guest,shirt:personColors[2][1],skin:personColors[2][0]});
      for(const p of roadDrivers.values())if(!p.id&&!p.seated)peds.push({x:p.x,z:p.z,yaw:p.yaw,shirt:personColors[p.style][1],skin:personColors[p.style][0]});
      if(play)for(const g of wash.guests)if(["exit","toChair","waiting","return","enter"].includes(g.phase))peds.push({x:g.x,z:g.z,yaw:g.yaw,shirt:personColors[g.style][1],skin:personColors[g.style][0]});
      if(meet.phase==="idle")peds.push({...romyAtMeet(),yaw:meet.rival.yaw-1.2,shirt:personColors[1][1],skin:personColors[1][0]});
      if(meet.jules&&(!(meet.role==="photo"||meet.role==="ambient")||meet.board<.6))
        peds.push({...julesBody,shirt:personColors[2][1],skin:personColors[2][0]});
    }
    return {mode:modeName,cx,cz,scale,solids,crew:play?{lead:unit.lead,other:otherBody,ride:otherCar,finder:!!unit.eye,met:unit.met,desk:scoutDesk,outing:windowRide,print:scoutHouseCard()}:null,rainWalk:play?rainWalk:null,buttonwood:play?works:null,brisas:play?club:null,palmHouse:play?palm:null,palmDiner:play?BayPalmRoom.frameState(palm,pos()):null,
      palmPeople:play&&modeName==="street"?BayPalmRoom.nearPeople(palm,hero).map(a=>({a,opts:BayPalmRoom.poseOptions(palm,a,save.courts.equipped,personColors)})):null,motorSales:play?gull.render:null,dealerCrew:play?gull:null,gullPeople:play&&modeName==="street"?gullActors.concat(gull.exchange?.ready?[hero]:[]).map(a=>({a,opts:gullPose(a)})):null,motos:play?motos:null,rescue:play?rescue:null,airLine:play?airLine:null,airCrew,airCarried:save.airmail.bag&&onStreetFeet()?hero:null,courts,pickup,valet,skate:play?skate:null,deckHand:skateCarried()?hero:null,deckSeat:stowedDeck(),keyMapActor:exchangingKey()?keyMapActor:null,streetCar:car,motorists:modeName==="street"&&play?motoristsNear(q=>Math.abs(q.x-cx)<88&&Math.abs(q.z-cz)<88,.05):[],player:{x:p.x,y:p.y,z:p.z,yaw:p.yaw,kit:save.courts.equipped,driving,kind:car?.kind,color:displayCar?.color||"#99ebc6",motion,damage:car?.damage,towRig:car?.towRig,
      steer:car?.steer,brakes:car?.brakes,handbrake:car?.handbrake,reversing:car?.reversing,flatSide:car?.flatSide,passengerDoor:car?.passengerDoor,inCabin:!!windowRide?.held&&windowRide.seat>.54||!!airLine.player&&!airLine.transfer||transit.aboard||(!!transfer||cabs.playerHeld)&&(motion.ride?.seat||0)>.54},skids,story:active?.story,
      cabService:play?cabs:null,cineSecond:!!save.cab.reel,recovery:play?recovery:null,
      airwaves:play?broadcastDesk.state:null,wheel:boardwalk.wheel,boardwalk,cycles,bridge,roofs,neon,transit:play?transit:null,band:play?band:null,wash:play?wash:null,
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
    const c=$("mini"),p=cameraSubject();drawBayMap(c.getContext("2d"),collectMap("radar",p.x,p.z,c.width/(airLine.player?165+airLine.plane.y*1.3:112+52*cameraRig.carBlend)));
  }
  function atlasFrame(){return chartMode==="cut"?{cx:188,cz:254,span:265}:chartMode==="bay"?{cx:309,cz:0,span:463}:{cx:13,cz:0,span:448};}
  function paintAtlas(){
    const c=$("bigmap");if(!c)return;const frame=atlasFrame();
    return drawBayMap(c.getContext("2d"),collectMap("atlas",frame.cx,frame.cz,c.width/frame.span));
  }
  function drawCourse(see){
    const run=active?.dash||(dashResult&&elapsed<dashResult.until?dashResult.run:null);
    for(let i=0;i<course.length;i++){
      const gate=course[i];if(i&&!run&&active?.job.id!=="dash"&&gate.type!=="rail"||!see(gate,108))continue;
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
  function drawInSeat(list,key,v,side){
    const s=bayCarLayout(v.kind),b=roadBody(v),p=chassisPoint(b,side*s.seatX,0,s.seatZ,footLevel(v.x,v.z)+.008+serviceLift(v));
    list.push([key,p.x,p.y,p.z,v.yaw,b.pitch,b.lean]);
  }
  function roadBody(v){
    if(BayButtonwoodYard.onRamp(v.x,v.z)){
      const s=BayDriving.world(v,0,1.4),b=BayDriving.world(v,0,-1.4),r=BayDriving.world(v,1,0),l=BayDriving.world(v,-1,0);
      return {...v,pitch:v.pitch-Math.atan((footLevel(s.x,s.z)-footLevel(b.x,b.z))/2.8),lean:v.lean+Math.atan((footLevel(r.x,r.z)-footLevel(l.x,l.z))/2)};
    }
    const grade=v.z>181?BayCut.grade(v.x,v.z):0,h=v.hydraulic;if(!grade&&(!h||h.rest))return v;
    return {...v,pitch:(v.pitch||0)+(h?.pitch||0)-Math.atan(grade*Math.cos(v.yaw)),lean:(v.lean||0)+(h?.lean||0)-Math.atan(grade*Math.sin(v.yaw))};
  }
  function addRig(list,v,ground){
    const rig=vehicleRig(v),s=bayCarLayout(v.kind);
    const phase=v===serviceVehicle?serviceTime/repairSeconds:0;
    const flat=(v.flatLoad||0)*(1-clamp((phase-.55)*4,0,1));
    const h=v.hydraulic,wheelBase=ground-(h?.bodyLift||0),bodyGround=ground-flat*.045;
    if(v.kind==="solena")BaySolenaArt.runningGear(list,model,v,wheelBase,h);
    list.push([rig.shell,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean,0,v]);
    if(rig.windshield&&(v!==taxi||!cabWindow()))list.push([rig.windshield,v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean,0,v]);
    if(v===taxi&&cabWindow())list.push([BayCabArt.dashboard(model,cabs.booking.price),v.x,bodyGround,v.z,v.yaw,v.pitch,v.lean,.28]);
    for(const side of [-1,1]){
      const hinge=chassisPoint(v,side*s.hingeX,0,s.hingeZ,bodyGround);
      const open=Math.max(side===v.doorSide?v.doorAngle:0,side===1?v.passengerDoor||0:0);
      list.push([rig.doors[side],hinge.x,hinge.y,hinge.z,v.yaw-side*open,v.pitch,v.lean,0,v,side]);
      for(const axle of s.axles){
        const damaged=side===v.flatSide&&axle===v.flatAxle;
        const out=damaged&&phase>0 ? .33*Math.sin(Math.PI*clamp((phase-.22)/.54,0,1))**2 : 0;
        const w=BayDriving.world(v,side*(s.track-.085+out),axle);
        const drop=damaged?flat*s.wheel*.25:0,lift=h?.wheelLift[(axle===s.axles[0]?0:2)+(side>0?1:0)]||0;
        const wheel=v.onLift?chassisPoint(v,side*(s.track-.085+out),s.wheel-drop,axle,ground):{...w,y:wheelBase+lift+s.wheel-drop};
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
      drawInSeat(list,"inez",run.ride,1);
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
      if(p.ride&&p.seat===1)drawInSeat(list,key,p.ride,1);
      else list.push([key,p.x,p.y+p.motion.lift,p.z,p.yaw,p.ride?.pitch||0,p.ride?.lean||0]);
    }
  }
  let recoveryArtReady=false,wheelArtReady=false,pedalArtReady=false;
  function drawBoardwalk(list,see,t){
    if(see(BayCoastWheelArt.centre,320)){
      if(!wheelArtReady){BayCoastWheelArt.install(model);wheelArtReady=true;}
      BayCoastWheelArt.world(list,see,t,hours,boardwalk.wheel);
    }
    if(!see(bikePin,110)&&!see(coastGate,135)&&!see(cycles.javi,80)&&!cycles.bikes.some(b=>see(b,75)))return;
    if(!pedalArtReady){BayBoardwalkArt.install(model);BayPedalArt.install(model);pedalArtReady=true;}
    for(const p of [boardwalk.mags,...boardwalk.people]){
      if(!see(p,67))continue;const key="wheel-regular/"+p.id;
      if(!p.mesh){p.mesh=new BayPlayerMesh(BayBoardwalkArt.colors[p.id],BayBoardwalkArt.roles[p.id]);BayBoardwalkArt.dress(p.mesh,p.id);view.add(key,p.mesh,true);}
      const changed=p.mesh.update(p.motion),posed=BayBoardwalkArt.pose(p,t);if(changed||posed)view.updateAnimated(key);
      list.push([key,p.x,p.y+p.motion.lift,p.z,p.yaw]);
    }
    BayBoardwalkArt.world(list,see,t,hours,boardwalk);
    for(const b of [...cycles.bikes,cycles.javi]){
      if(!see(b,87))continue;
      const ground=footLevel(b.x,b.z);
      BayPedalArt.world(list,b,ground,t);
      if(b!==cycles.javi||!see(b,64))continue;
      const key="boardwalk-courier";
      if(!b.mesh){b.mesh=new BayPlayerMesh(BayPedalArt.colors.javi,BayPedalArt.roles.javi);BayPedalArt.dress(b.mesh,"javi");view.add(key,b.mesh,true);}
      b.mesh.update(b.motion);BayPedalArt.rider(b.mesh,b,1,-1,t);view.updateAnimated(key);
      const p=BayPedalArt.point(b,1,-1,ground);list.push([key,p.x,p.y,p.z,p.yaw,p.tilt,p.lean]);
    }
    if(active?.relay&&cycles.run.phase==="deliver"&&onStreetFeet()){
      const hand=BayDriving.world(hero,.27,.08+Math.sin(motion.phase*tau)*.14);
      list.push(["pedal/pouch",hand.x,hero.y+.70,hand.z,hero.yaw]);
    }
  }
  function motoristsNear(see,dt){
    const people=[];
    for(const a of streetMotorists){
      if(a.stranded&&!roadDrivers.has(a.car))continue;
      const cabin=a.phase==="drive"||a.phase==="arrive",v=cabin&&(a.ride||a.car);
      if(!see(v||a,cabin?47:68))continue;
      if(v)BayMotorists.seated(a,v,footLevel,dt);
      people.push(a);
    }
    return people;
  }
  function drawBand(list,see,t){
    if(!play)return;
    for(const p of band.performers){
      if(!see(p,p.ride?44:66))continue;
      const key="shell-player/"+p.id;
      if(!p.mesh){p.mesh=new BayPlayerMesh(BayBandPlayers.colors[p.id],BayBandPlayers.roles[p.id]);BayBandPlayers.dress(p.mesh,p.id);view.add(key,p.mesh,true);}
      const dodge=p===band.june&&p.state==="motel"&&band.local.startle;
      const moved=dodge?(p.mesh.startle(dodge),true):p.mesh.update(p.motion),posed=!dodge&&BayBandPlayers.pose(p.mesh,p,t,band);
      if(moved||posed)view.updateAnimated(key);
      if(p.ride&&p.seat===1)drawInSeat(list,key,p.ride,1);
      else list.push([key,p.x,p.y+(dodge?dodge.lift:p.motion.lift),p.z,p.yaw,p.ride?.pitch||0,p.ride?.lean||0]);
      BayBandPlayers.props(list,p,t,band);
    }
    BaySoundShell.world(list,see,t,hours,band);
  }
  let washArtReady=false;
  function drawWash(list,see,t){
    for(const g of wash.guests){
      const seated=["home","incoming","outgoing"].includes(g.phase);
      if(!see(seated?g.car:g,seated?45:64))continue;
      if(seated)BayMotorists.seated(g,g.car,footLevel,1/60);
      const key="palma-guest/"+g.id;
      if(!g.mesh){g.mesh=new BayPlayerMesh(personColors[g.style],"local");view.add(key,g.mesh,true);}
      if(g.mesh.update(g.motion))view.updateAnimated(key);
      list.push([key,g.x,g.y+g.motion.lift,g.z,g.yaw]);
    }
    if(!see(wash.site.bay,102))return;
    BayPalmaWash.actors(view,wash,t);BayPalmaWash.world(list,see,t,hours,wash);
  }
  function drawMarlinRoof(list,see,t){
    if(!see(neon.bench,157))return;
    if(!roofArtReady){BayMarlinRoofArt.install(model);BayMarlinNeonArt.install(model);roofArtReady=true;}
    BayMarlinRoofArt.world(view,see,t,hours);BayMarlinNeonArt.world(list,see,neon,t,hours);
    const g=neon.guest;if(!play||!see(g,79))return;
    if(!guestRig){guestRig=new BayPlayerMesh(personColors[2],"local");view.add("marlin-gallery-guest",guestRig,true);
      model("marlin-coffee",m=>{m.box(0,0,0,.086,.118,.086,"#e3d4b0");m.box(0,.065,0,.095,.018,.095,"#735448");});}
    if(guestRig.update(guestMotion))view.updateAnimated("marlin-gallery-guest");
    list.push(["marlin-gallery-guest",g.x,g.y,g.z,g.yaw]);
    const grip=BayDriving.world(g,.22,.06+.10*Math.cos(g.phase)*guestMotion.weight);
    list.push(["marlin-coffee",grip.x,g.y+1.00,grip.z,g.yaw]);
  }
  function drawTransit(list,see,t){
    const b=transit.bus,stops=BayTransit.stops,nearBus=see(b,163);
    if(!nearBus&&!stops.some(p=>see(p,135)))return;
    if(!transitArtReady){BayCityBusArt.install(model);BayBusStopArt.install(model);BayBusRidersArt.install(model);transitArtReady=true;}
    BayBusStopArt.world(list,see,stops,t,hours);
    if(nearBus)BayCityBusArt.world(list,b,t,{near:see(b,73),inside:busCameras()&&!isTop(),night:seatLights()});
    if(!play)return;
    for(const p of [transit.driver,...transit.people]){
      if(!see(p,71))continue;
      const key="route-six/"+p.id;
      if(!p.mesh){p.mesh=new BayPlayerMesh(personColors[p.style],"local");view.add(key,p.mesh,true);}
      if(p.mesh.update(p.motion))view.updateAnimated(key);list.push([key,p.x,p.y,p.z,p.yaw]);
      if(see(p,39))BayBusRidersArt.world(list,p,b,t);
    }
  }
  function stowedDeck(){
    const p=transit.player;
    if(!save.skate.deck||p?.stage!=="ride"||p.role==="driver")return null;
    const s=p.seat,b=transit.bus,base=BayCityBusArt.bodyPoint(b,s.x,BayCityBusArt.floor+.01,s.z+.50);
    return {...base,yaw:b.yaw,style:save.skate.deck,rider:false};
  }
  function drawSkate(list,see,t){
    const nearSite=skate.crew.some(c=>see(c.site,103));
    if(!nearSite&&!skate.rider&&!save.skate.deck)return;
    if(!skateArtReady){BaySkateSpots.install(model);BaySkateArt.install(model);skateArtReady=true;}
    if(nearSite)BaySkateSpots.world(list,see,t,hours);
    if(!play)return;
    for(const c of skate.crew){
      if(c.site.loan&&save.skate.deck!==c.site.id&&see(c.site.stand,38))BaySkateArt.world(list,c.site.loan,t,false);
      for(const [p,role] of [[c.r,"skater"],[c.filmer,"filmer"]]){
        if(!see(p,61))continue;
        const id=c.site.id,key="curb-cut/"+id+"/"+role;
        if(!p.mesh){p.mesh=new BayPlayerMesh(BaySkateArt.colors[id],"local");BaySkateArt.dress(p.mesh,id,role);view.add(key,p.mesh,true);}
        if(role==="skater"){BaySkateArt.pose(p.mesh,p,t);BaySkateArt.world(list,p,t,see(p,33));}
        else{BaySkateArt.filmerPose(p.mesh,p,t,p.weight);BaySkateArt.filmerWorld(list,p,t,p.weight);}
        view.updateAnimated(key);list.push([key,p.x,p.y+(p.air||0),p.z,p.yaw]);
      }
    }
    if(skate.rider)BaySkateArt.world(list,skate.rider,t);
    const stowed=stowedDeck();if(stowed&&busCameras())BaySkateArt.world(list,stowed,t,false);
  }
  function drawCrossing(list,see,t){
    BayDrawbridgeArt.world(view,see,bridge,t);BayBridgePacketArt.world(list,see,bridge,t,hours);
    const w=bridge.walker;
    if(see(w,77))list.push([personSkin(w.style,w.role,poseFor(w)),w.x,footLevel(w.x,w.z),w.z,w.yaw]);
  }
  function rearStreet(eye){
    const see=(p,r)=>Math.abs(p.x-eye.x)<r&&Math.abs(p.z-eye.z)<r;
    view.drawCityAndWater(streetTime);
    BayStreetArt.draw(view,streetTime,eye);
    if(transitArtReady){const list=[];drawTransit(list,see,streetTime);for(const item of list)view.draw(...item);}
    if(roofArtReady&&see(neon.bench,115)){const list=[];drawMarlinRoof(list,see,streetTime);for(const item of list)view.draw(...item);}
    if(cutArtReady&&see(BayDrawbridge.center,93)){
      BayCutArt.world(view,see,hours,streetTime);const list=[];drawCrossing(list,see,streetTime);for(const item of list)view.draw(...item);
    }
    if(washArtReady&&see(wash.site.bay,94)){
      BayPalmaWash.ground(view,see,hours);const list=[];
      BayPalmaWash.world(list,see,streetTime,hours,wash);for(const item of list)view.draw(...item);
    }
    if(bandArtReady&&see(band.site.board,90))BaySoundShell.ground(view,see,hours);
    for(const v of cars)if(v!==car&&see(v,89))view.draw(v.model,v.x,footLevel(v.x,v.z)+.01,v.z,v.yaw,v.pitch,v.lean,0,v);
    for(const v of patrol)if(v.visual&&see(v,100)){
      const y=footLevel(v.x,v.z);view.draw(v.visual,v.x,y+.01,v.z,v.yaw,0,v.lean,0,v);
      view.draw(Math.floor(streetTime*5.5)%2?"flash-red":"flash-blue",v.x,y+.02,v.z,v.yaw);
    }
    const canopies=[];
    for(const p of walkers)if(!p.onTour&&see(p,53)){
      const ground=footLevel(p.x,p.z);view.draw(personSkin(p.style,p.role,poseFor(p),p.canopy>.12?3:p.gesture||0),p.x,ground,p.z,p.yaw);
      if(p.canopy>.01&&!p.startle)BayRainCanopies.world(canopies,model,p,ground,p.canopy,p.canopyStyle,streetTime);
    }
    for(const item of canopies)view.draw(...item);
  }
  function seatOverlay(top,t){
    const canvas=$("driverGlass");canvas.hidden=!insideSeat()||!!room;if(canvas.hidden||!canvas.getContext)return;
    const w=innerWidth,h=innerHeight,ratio=Math.min(1,1200/w,820/h);
    if(canvas.width!==Math.round(w*ratio)||canvas.height!==Math.round(h*ratio)){canvas.width=Math.round(w*ratio);canvas.height=Math.round(h*ratio);}
    const g=canvas.getContext("2d");g.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);g.clearRect(0,0,w,h);
    const info={time:t,night:cityDusk(),headlights:seatLights(),kit:save.courts.equipped};
    if(top){
      const width=clamp(w*.22,142,205);
      BayDriversSeat.compact(g,car,{...info,x:w-width-16,y:h-(h<460?114:145),width});return;
    }
    const body=roadBody(car),ground=footLevel(car.x,car.z)+.008+serviceLift(car);
    BayRoadGlass.glass(g,w,h,{view,car:body,ground,time:t,rain:hours.rain,spray:glassWater(),wiper:car.wiper||0});
    driverSeat.mirror(g,view,body,ground);
  }
  function drawRoadCrew(list,see,t){
    if(!play)return;
    for(const p of motoristsNear(see,1/60)){
      const key="motorist/"+(p.id.startsWith("road")?p.car.id:p.id);
      if(!p.mesh){p.mesh=new BayPlayerMesh(BayMotorists.colors[p.id],BayMotorists.roles[p.id]);BayMotorists.dress(p.mesh,p.id);view.add(key,p.mesh,true);}
      const cabin=p.phase==="drive"||p.phase==="arrive";
      if(!cabin||t>=(p.skinAt||0)){
        const moved=p.mesh.update(p.motion),posed=BayMotorists.pose(p.mesh,p,t);
        const partner=p===valet.staff&&valet.staffJob;
        const exchange=partner&&BayMotorists.partnerPose(p.mesh,p,partner,t);
        if(moved||posed||exchange)view.updateAnimated(key);
        if(exchange)BayMotorists.partnerProps(list,p,partner,t);
        p.skinAt=t+.14;
      }
      list.push([key,p.x,p.y+p.motion.lift,p.z,p.yaw]);
      if(!cabin)BayMotorists.worldProps(list,p,t);
    }
    BayValetPlaces.world(list,see,t,hours,valet);
    for(const [v,p] of roadDrivers){
      if(see(v,83)&&v.roadside&&v!==car&&!v.onLift&&t%1.05<.49){
        const s=bayCarLayout(v.kind),key="hazards/"+v.kind;
        model(key,g=>{for(const end of [-1,1])for(const side of [-1,1])g.box(side*(s.track-.145),.59,end*(s.halfLength-.08),.19,.095,.12,"#ffbf57");});
        list.push([key,v.x,footLevel(v.x,v.z)+.008,v.z,v.yaw]);
      }
      if(p.id||!see(p,66))continue;
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
    if(see(bridge.packet,29)||see(BayDrawbridge.iceDock,32)){
      if(!models.has("june-bug"))BayBridgePacketArt.install(model);
      BayBridgePacketArt.world(list,(p,r)=>see(p,Math.min(32,r)),bridge,t,hours);
    }
    drawButtonwood(list,see,t,true);
    for(const v of [...civilianFleet,...harbor.units])if(v!==pip&&see(v,29)){
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
    moveCamera(dt,t);motoOverlays(t);$("scoutFinder").hidden=!unit.eye||!!panel;$("game").classList.toggle("scout-framing",!!unit.eye&&!panel);$("game").classList.toggle("at-palm-table",!!palm.match);
    const run=active?.take,replay=run?.phase==="landed"&&(run.endTime>=.32||!!run.afterPrint);
    const printing=replay&&!run.receipt,film=replay?(run.approach||run.peak):run;
    const top=isTop(),scene=$("world"),map=$("overhead");scene.hidden=top;map.hidden=!top;
    if(!insideSeat()||room)$("driverGlass").hidden=true;
    BayCoastArt.rain($("rain"),play&&!room&&!palm.match&&!BayPalmDiner.contains(pos().x,pos().z)&&!swim?.underwater&&(top||!insideSeat()&&!busCameras()&&!airCockpit())?hours:null,t,top,cam.yaw);
    if(palm.match){
      if(top){
        const factor=Math.min(1,1280/innerWidth,800/innerHeight),w=Math.round(innerWidth*factor),h=Math.round(innerHeight*factor);
        if(map.width!==w||map.height!==h){map.width=w;map.height=h;}
        BayPalmRoom.closeMap(map,palm,hero,save.courts.equipped,personColors,t);
      }else{
        view.begin(cam,.10,null);const tray=[];
        drawPalmScene(tray,(q,r)=>dist(q,palmSite.table)<Math.min(r,33),t,true);
        for(const item of tray)view.draw(...item);
      }
      BayPalmRoom.guide($("palmGuide"),palm,top,view,innerWidth,innerHeight);$("targetTag").hidden=true;return;
    }
    $("palmGuide").hidden=true;
    if(room){
      const cinema=room.kind==="cinema",show=cinema?BayCineProgram.frame(t-projectionStart,filmOptions()):null;
      if(cinema)room.projectionist=cabs.people.some(p=>p.phase==="booth");
      if(top){
        const ratio=Math.min(1,1120/innerWidth,740/innerHeight),w=Math.round(innerWidth*ratio),h=Math.round(innerHeight*ratio);
        if(map.width!==w||map.height!==h){map.width=w;map.height=h;}
        if(cinema)BayCineRoom.map(map.getContext("2d"),room,t,hours,show.canvas);
        else BayMarlinRoom.map(map.getContext("2d"),room,hours,save.courts,t);
      }else{
        if(cinema){
          if(!cineArtReady){BayCineRoom.install(model);cineArtReady=true;}
          view.begin(cam,0);BayCineRoom.world(view,room,t,hours,show.canvas,show.revision);
        }else{marlinArt();view.begin(cam,0);BayMarlinRoom.draw(view,hours);BayCourtBench.roomWorld(view,save.courts,model,t);}
      }
      $("targetTag").hidden=true;return;
    }
    const besideTicket=paintPreview&&innerWidth>=900&&innerHeight>=490;
    if(top){
      const ratio=Math.min(1,1120/innerWidth,740/innerHeight),w=Math.round(innerWidth*ratio),h=Math.round(innerHeight*ratio);
      if(map.width!==w||map.height!==h){map.width=w;map.height=h;}
      if(motos.finder){const project=rideScenery.paint(map,cam,motos.job.brief,t,{hours,wheel:boardwalk.wheel,neon,model,cars,cpu:view.cpu},motos.captureRequest);exposeMoto(map,null,project);$("targetTag").hidden=true;return;}
      const p=play?cameraSubject():{x:65,z:0};
      const photo=shooting(),yaw=photo?meet.jules.yaw:play&&!paintPreview?cameraRig.yaw+cameraRig.lookBack:0;
      const ahead=play&&!paintPreview?(swim?2.8:boardwalkFrame.ahead)*(1-cameraRig.elevation):0;
      const span=motos.bike?35+Math.min(27,Math.abs(motos.bike.speed)):swim?(swim.underwater?23:34):boardwalkFrame.span;
      let scale=play?clamp(h/(span*cameraRig.zoom),2,60):h/237;
      if(paintPreview)scale=h/24;
      const offset=besideTicket?w*.14/scale:0;
      const state=collectMap("street",p.x+Math.sin(yaw)*ahead-offset,p.z+Math.cos(yaw)*ahead,scale);
      rainWalk.zoom=ease(rainWalk.zoom||0,rainWalk.trip?1:0,4,dt);
      if(rainWalk.zoom>.003){
        state.scale+=(h/(13*cameraRig.zoom)-state.scale)*rainWalk.zoom;
        const partner=rainWalk.trip?.p||hero;
        state.cx+=((hero.x+partner.x)*.5-state.cx)*rainWalk.zoom;state.cz+=((hero.z+partner.z)*.5-state.cz)*rainWalk.zoom;
      }
      roofZoom=ease(roofZoom,roofs.raised?1:0,4,dt);
      if(roofZoom>.002){
        const span=neon.testing?(neon.view?7:16):roofs.action?.kind==="ladder"?22:32;
        state.scale+=(h/(span*cameraRig.zoom)-state.scale)*roofZoom;
        state.cx+=(p.x-state.cx)*roofZoom;state.cz+=(p.z-state.cz)*roofZoom;
        if(neon.testing){state.cx=126.9;state.cz=-45;state.rotation=state.cameraYaw=neon.view?-Math.PI*.5:0;}
      }
      const workClose=active?.rescue&&!car&&!rescue.traveling&&!["release","pullOut"].includes(rescue.phase)&&dist(hero,rescue.cot)<13;
      rescueZoom=ease(rescueZoom,workClose?1:0,4.4,dt);
      if(rescueZoom>.003){
        state.scale+=(h/(21*cameraRig.zoom)-state.scale)*rescueZoom;
        state.cx+=(hero.x+(rescue.cot.x-hero.x)*.35-state.cx)*rescueZoom;
        state.cz+=(hero.z+(rescue.cot.z-hero.z)*.35-state.cz)*rescueZoom;
      }
      if(bridgeLook()){state.cx=BayDrawbridge.center.x;state.cz=BayDrawbridge.center.z;state.rotation=state.cameraYaw=BayDrawbridge.heading;state.scale=h/(56*cameraRig.zoom);}
      if(photo){
        const r=meet.rival,m=BayNightMeet.marquee,blend=.48*clamp((45-dist(r,m))/20,0,1);
        state.cx=r.x+(m.x-r.x)*blend;state.cz=r.z+(m.z-r.z)*blend;state.scale=clamp(h/50,4,17);
      }
      if(!bridgeLook()&&!neon.testing)state.rotation=yaw;
      if(works.rearView&&car===works.trailer.hitched){state.cx=works.trailer.x;state.cz=works.trailer.z;state.rotation=state.cameraYaw=car.yaw+Math.PI;state.scale=h/(22*cameraRig.zoom);}
      if(broadcastDesk.mix&&!broadcastDesk.approach){state.cx=radioSite.x+.32;state.cz=radioSite.z;state.rotation=state.cameraYaw=-Math.PI/2+broadcastDesk.mix.pan;state.scale=h/((broadcastDesk.close?9:18)*cameraRig.zoom);}
      if(works.line?.close){state.rotation=state.cameraYaw=works.line.look+Math.PI;state.cx=(pip.x+works.line.pot.x)*.5;state.cz=(pip.z+works.line.pot.z)*.5;state.scale=h/(13.5*cameraRig.zoom);}
      if(skate.rider){
        const r=skate.rider,lens=!!skate.run?.lens,face=lens?cam.yaw:yaw,lead=lens?0:1.0+r.speed*.10;
        state.rotation=state.cameraYaw=face;state.cx=r.x+Math.sin(face)*lead;state.cz=r.z+Math.cos(face)*lead;
        state.scale=h/((lens?10.8:16+r.speed*.41)*cameraRig.zoom);
      }
      if(airLine.player&&!airLine.transfer){
        const f=airLine.plane,face=airCockpit()?f.yaw+airLine.pan:yaw,lead=airCockpit()?7:3.5;
        state.rotation=state.cameraYaw=face;state.cx=f.x+Math.sin(face)*lead;state.cz=f.z+Math.cos(face)*lead;
        state.scale=h/((airCockpit()?42+f.y*.8:32+f.y*.83)*cameraRig.zoom);
      }
      if(busCameras()){
        const b=transit.bus,drive=transit.driving,lead=drive?4.1:0;
        state.rotation=state.cameraYaw=b.yaw+transit.pan;state.cx=b.x+Math.sin(b.yaw)*lead;state.cz=b.z+Math.cos(b.yaw)*lead;
        state.scale=h/((drive?43:17)*cameraRig.zoom);
      }
      if(band.take){
        const site=band.site;
        state.cx=(hero.x+site.kit.x)*.5-.6;state.cz=(hero.z+site.kit.z)*.5;
        state.rotation=state.cameraYaw=kitCam?Math.PI*.48:-Math.PI*.42;state.scale=h/((kitCam?6.2:11.8)*cameraRig.zoom);
      }
      if(active?.valet&&car&&dist(car,BayValetPlaces.desk)<69)state.scale=Math.max(state.scale,h/(36*cameraRig.zoom));
      if(active?.wash&&wash.work&&!car&&dist(hero,wash.work.v)<9){
        const v=wash.work.v;state.cx=.55*v.x+.45*hero.x;state.cz=.55*v.z+.45*hero.z;state.scale=h/(13*cameraRig.zoom);
      }
      if(keyView.mix>.002){
        state.cx+=(keyView.x-state.cx)*keyView.mix;state.cz+=(keyView.z-state.cz)*keyView.mix;
        state.scale+=(h/(5.9*cameraRig.zoom)-state.scale)*keyView.mix;
      }
      if(pickup){
        const ball=BayCourtPlaces.mapPoint(pickup.ball,pickup.site),focus=pickup.at(0,3.35);
        state.cx=focus.x*.50+hero.x*.32+ball.x*.18;state.cz=focus.z*.50+hero.z*.32+ball.z*.18;
        state.scale=h/((16.8+Math.min(4,dist(hero,pickup.site)*.25))*cameraRig.zoom);
        if(pickup.human.shot?.stage==="wind"){
          const at=BayCourtPlaces.mapPoint({x:hero.x,y:hero.y+1.12,z:hero.z},pickup.site);
          const dx=(at.x-state.cx)*state.scale,dy=(state.cz-at.z)*state.scale,c=Math.cos(yaw),s=Math.sin(yaw);
          courtMeterAt((w/2+c*dx+s*dy)*innerWidth/w,(h/2-s*dx+c*dy)*innerHeight/h);
        }
      }
      if(cycles.riding&&boardwalkFrame.beside>.001){
        const f=boardwalkFrame.beside*.5;
        state.cx+=clamp(cycles.javi.x-p.x,-3,3)*f;state.cz+=clamp(cycles.javi.z-p.z,-3,3)*f;
      }
      if(boardwalk.player?.phase==="ride"){
        const at=BayCoastWheelArt.mapPoint(hero);state.cx=at.x;state.cz=at.z;state.scale=h/((boardwalk.outside?39+hero.y*1.25:14+hero.y*.27)*cameraRig.zoom);
        state.rotation=state.cameraYaw=boardwalk.pan;
      }
      if(car===wrecker&&!transfer&&held("KeyV")){
        const v=recovery.onBench?.car,q=v&&dist(wrecker,v)<17?v:tow.jaw();state.cx=q.x;state.cz=q.z;state.scale=h/(q===v?12:17);state.rotation=state.cameraYaw=wrecker.yaw;
      }
      if(listening()){
        const f=active.field,reach=f.source.id==="trawler"?33:13;
        state.cx=hero.x+Math.sin(f.yaw)*reach;state.cz=hero.z+Math.cos(f.yaw)*reach;
        state.rotation=state.cameraYaw=f.yaw;state.scale=h/(f.source.id==="trawler"?81:49);
      }
      if(unit.eye)scoutMapView(state,w,h);
      if(unit.transition&&!unit.transition.braking){const q=BaySecondUnit.travel(unit.transition);state.cx=q.x;state.cz=q.z;state.scale=h/(47+q.high*2.65);state.rotation=state.cameraYaw=0;}
      if(film)setTakeMap(state,film,w,h,replay);
      drawBayMap(map.getContext("2d"),state);if(unit.eye)scoutDevelop(map,null,scoutMapProject(state,w,h));if(insideSeat())seatOverlay(true,t);$("targetTag").hidden=true;
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
    reflectMoto(t,dusk);
    if(insideSeat()&&Math.abs(driverSeat.pan)<1.18)driverSeat.reflect(view,car,footLevel(car.x,car.z)+.008,t,dusk,hours,rearStreet);
    view.begin(eye,dusk,hours,run?.subject()||car);
    skyPainter.draw(view,eye,t,dusk,hours);
    view.drawCityAndWater(t);
    const see=(o,limit)=>Math.abs(o.x-eye.x)<limit&&Math.abs(o.z-eye.z)<limit;
    if(!motorArtReady){BayStreetCars.install(model);BayMotorists.install(model);BayValetPlaces.install(model);motorArtReady=true;}
    if(!bandArtReady){BayBandPlayers.install(model);BaySoundShell.install(model);bandArtReady=true;}
    BaySoundShell.ground(view,see,hours);
    if(see(wash.site.bay,115)){
      if(!washArtReady){BayPalmaWash.install(model);washArtReady=true;}
      BayPalmaWash.ground(view,see,hours);
    }
    BayValetPlaces.ground(view,see,hours);
    if(courts.some(g=>see(g.site,150))){
      if(!courtArtReady){BayCourtPlaces.install(model);BayCourtPlayers.install(model);BayCourtBench.install(model);courtArtReady=true;}
      BayCourtPlaces.ground(view,see,hours);
    }
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
    if(play)drawCrew(visible,see,t);
    const atSea=play&&(eye.x>105||swim);
    if(atSea){surfArt();BaySurfArt.world(view,visible,see,t,hours,watchCrew,save.shore.returned);sailHulls(visible,see);}
    if(see({x:150,z:292},184)){
      if(!cutArtReady){BayCutArt.install(model);BayCutWildlife.install(model);BayDrawbridgeArt.install(model);BayBridgePacketArt.install(model);cutArtReady=true;}
      BayCutArt.world(view,see,hours,t);BayCutWildlife.world(visible,see,hours,t);drawCrossing(visible,see,t);
    }
    drawMarlinRoof(visible,see,t);
    drawTransit(visible,see,t);drawSkate(visible,see,t);
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
    drawFerry(visible,see,t);if(play){drawAir(visible,see,t);drawRescue(visible,see,t);drawMoto(visible,see,t);drawGullMotors(visible,see,t);drawPalmScene(visible,see,t);drawBrisas(visible,see,t);drawButtonwood(visible,see,t);
      if(see(radioSite,105)){if(!radioArtReady){BayAirwavesBooth.install(model);radioArtReady=true;}BayAirwavesBooth.world(visible,see,t,broadcastDesk.state);}}
    else if(see(palmSite.center,650)){model("palm-roof",BayPalmDiner.roof);visible.push(["palm-roof",0,0,0]);}
    const hideActor=!!airLine.player&&!airLine.transfer||busCameras()||cabWindow()||listening()||cameraRig.hideActor&&!broadcastDesk.mix&&!works.line?.close&&!works.rearView&&!club.show?.wide&&!skate.run?.lens&&!transit.aboard&&!paintPreview&&!insideSeat()&&!neon.testing;
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
        drawInSeat(visible,"mara",story.ride,1);
      }else visible.push(["mara",mara.x,(mara.y??footLevel(mara.x,mara.z))+partnerMotion.lift,mara.z,mara.yaw??-1.9]);
    }
    for(const v of cars)if(see(v,160)&&!(film&&BayTake.onSet(v))&&!(v===windowRide?.vehicle&&unit.eye?.window)&&!(v===car&&!transfer&&(hideActor||insideSeat()))){
      const ground=footLevel(v.x,v.z)+.008+serviceLift(v)+(v.towLift||0),body=roadBody(v);
      const rigBody=v===owned&&paintPreview?paintPreview:body;
      const nativeWheels=(v.brisasLead||v.kind==="estate"||v.kind==="stepside")&&see(v,29);
      const split=v===owned||nativeWheels||v.hydraulic&&!v.hydraulic.rest&&see(v,85)||v===otherCar||v===windowRide?.vehicle||v===story?.ride||v===active?.ferry?.ride||v===active?.cabFare?.ride||v===band.june.ride||v===unit4&&(dist(cam,v)<72||v.rearOpen>.01)||v===taxi||v===wrecker||v.onLift||v.doorAngle>.01;
      if(split)addRig(visible,rigBody,ground);
      else{
        visible.push([v.model,v.x,ground,v.z,v.yaw,body.pitch,body.lean,0,v]);
        if((v.path&&!v.recoveryOwner||v===meet.rival&&meet.phase!=="idle")&&see(v,52)){
          const s=bayCarLayout(v.kind),p=chassisPoint(body,-s.seatX,s.seatY,s.seatZ,ground);
          if(!play||!v.brisasLead&&!v.owner&&!v.guestId&&!v.washGuest&&!v.stockId)visible.push(["traffic-driver",p.x,p.y,p.z,v.yaw,body.pitch,body.lean]);
          if(v.brakes>.35){
            const key="traffic-brakes/"+v.kind;model(key,g=>buildBayBrakeLights(g,v.kind));
            visible.push([key,v.x,ground,v.z,v.yaw,body.pitch,body.lean,0,v]);
          }
        }
      }
      if(v===unit4)BayAmbulanceArt.world(visible,rigBody,ground,t,split);
      if(v.damage&&see(v,76))BayBodyworkArt.world(visible,model,body,ground,t);
      BayStreetCars.world(visible,model,body,ground,t,dist(cam,v));
      if(v.soil&&see(v,50))BayRoadGlass.world(visible,view,body,ground,t,dist(cam,v));
    }
    if(play)for(const contact of jobContacts){
      if(contact.style===undefined||active?.job.id===contact.id||meet.rival&&contact.id==="getaway"||!see(contact,72))continue;
      visible.push([personSkin(contact.style,contact.role,0,1),contact.x,footLevel(contact.x,contact.z),contact.z,contact.yaw]);
    }
    if(play)for(const rack of BayRainWalk.racks)if(see(rack,58))BayRainCanopies.worldRack(visible,model,rack,rainWalk.book.borrowed===rack.id);
    for(const p of walkers){
      if(play&&(p===band.local||p.palmManaged)||!see(p,91)||film&&BayTake.onSet(p))continue;
      const feet=p.fieldSource?footLevel(p.x,p.z)+.055:.15;
      if(p.startle){
        if(!p.recoilMesh){
          p.recoilMesh=new BayPlayerMesh(personColors[p.style],p.role);p.recoilKey="recoil/"+walkers.indexOf(p);
          view.add(p.recoilKey,p.recoilMesh,true);
        }
        p.recoilMesh.startle(p.startle);view.updateAnimated(p.recoilKey);
        visible.push([p.recoilKey,p.x,feet+p.startle.lift,p.z,p.yaw]);
      }else visible.push([personSkin(p.style,p.role,poseFor(p),p.canopy>.12?3:p.gesture||0),p.x,feet,p.z,p.yaw]);
      if(p.canopy>.01&&!p.startle)BayRainCanopies.world(visible,model,p,feet,p.canopy,p.canopyStyle,t);
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
    drawRoadCrew(visible,see,t);drawBoardwalk(visible,see,t);drawCourts(visible,see,t);drawBand(visible,see,t);
    if(play)drawWash(visible,see,t);
    if(active&&!windowRide&&!active.neon&&!active.bridge&&!story&&!active.cabFare&&!active.recovery&&!active.regatta&&active.job.id!=="race"&&active.job.id!=="dash"&&(active.index===0||active.job.id==="tape")){
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
    if(!unit.eye&&!motos.finder&&!motos.cockpit&&!swim&&!insideSeat()&&!hideActor&&playerMesh&&!shooting()&&!film&&(boardwalk.player?.phase!=="ride"||boardwalk.outside)){
      let changed=roofs.action?BayTraversalPose.pose(playerMesh,motion,roofs.action):playerMesh.update(motion);const b=cycles.riding;
      if(palm.playerSeat){const o=BayPalmRoom.poseOptions(palm,hero,save.courts.equipped,personColors);
        changed=BayPalmPlayers.pose(playerMesh,hero,t,hero.action,o)||changed;BayPalmPlayers.props(visible,hero,t,hero.action,o,playerMesh);}
      if(gull.exchange?.ready){const opts=gullPose(hero);changed=BayDealerPeople.pose(playerMesh,hero,t,opts.action,opts)||changed;BayDealerPeople.props(visible,hero,t,opts.action,opts,playerMesh);}
      if(rescue.holding){BayRescueCrew.pose(playerMesh,hero,t,"player","push",rescue.cot);changed=true;}
      if(wash.operator===hero)changed=BayPalmaWash.pose(playerMesh,motion,hero,wash.target,t,wash.spraying)||changed;
      if(band.player){
        const p=band.player;p.kit=save.courts.equipped;p.mesh=playerMesh;
        changed=BayBandPlayers.pose(playerMesh,p,t,band)||changed;BayBandPlayers.props(visible,p,t,band);
      }
      if(exchangingKey()){
        changed=BayMotorists.partnerPose(playerMesh,hero,valet.focus,t)||changed;BayMotorists.partnerProps(visible,hero,valet.focus,t);
      }
      if(motos.player&&motos.player.stage!=="approach"){
        const p=motos.player,opts=motos.pose(p);BayMotoRiders.pose(playerMesh,hero,p.b,p.seat,p.b.y,t,opts);view.updateAnimated(playerModel);
        visible.push([playerModel,hero.x,hero.y,hero.z,hero.yaw]);BayMotoRiders.props(visible,hero,p.b,p.seat,p.b.y,t,opts,playerMesh);
      }else if(skate.rider){
        const r=skate.rider;BaySkateArt.pose(playerMesh,r,t);view.updateAnimated(playerModel);
        visible.push([playerModel,r.x,r.y+r.air,r.z,r.yaw]);
      }else if(pickup){
        BayCourtPlayers.pose(playerMesh,pickup.human,t);view.updateAnimated(playerModel);
        visible.push([playerModel,hero.x,hero.y+pickup.human.lift,hero.z,hero.yaw]);
      }else if(b&&!cycles.transfer?.approach){
        BayPedalArt.rider(playerMesh,b,b.mount,b.side,t);view.updateAnimated(playerModel);
        const pp=BayPedalArt.point(b,b.mount,b.side,footLevel(b.x,b.z));visible.push([playerModel,pp.x,pp.y,pp.z,pp.yaw,pp.tilt,pp.lean]);
      }else{
        if(save.airmail.bag&&onStreetFeet()&&BayAirmailArt.carryPose(playerMesh,hero,t)){changed=true;BayAirmailArt.carry(visible,hero,t,playerMesh,BayAirPost.tagFor(save.airmail.bag));}
        if(skateCarried()&&BaySkateArt.carryPose(playerMesh,hero,t)){changed=true;BaySkateArt.carry(visible,hero,t,save.skate.deck,playerMesh);}
        if(rainWalk.amount>.01)BayRainCanopies.world(visible,model,hero,hero.y+motion.lift,rainWalk.amount,rainWalk.book.style,t);
        if(unit.lead==="frankie"&&onStreetFeet()&&!active)BayScoutArt.cameraProp(visible,model,hero,playerMesh,t,0);
        if(changed)view.updateAnimated(playerModel);
        if(skiff&&!deckStep){
          const p=seatPoint(skiff);visible.push([playerModel,p.x,p.y,p.z,skiff.yaw,skiff.pitch,skiff.lean]);
        }else if(windowRide?.seat===1){drawInSeat(visible,playerModel,windowRide.vehicle,1);
        }else if(car&&!transfer){
          drawInSeat(visible,playerModel,car,car===meet.jules?1:-1);
        }else visible.push([playerModel,hero.x,hero.y+motion.lift,hero.z,hero.yaw]);
      }
    }
    if(view.beginShadow()){
      for(const a of visible)if(Math.abs(a[1]-eye.x)<65&&Math.abs(a[3]-eye.z)<65)view.draw(...a);
      BayStreetArt.draw(view,streetTime,cam,true);
      view.endShadow();
    }else{
      for(const v of cars)if(see(v,83)&&!(film&&BayTake.onSet(v)))view.draw("shadowCar",v.x,v.z>181?footLevel(v.x,v.z)+.05:.145,v.z,v.yaw);
      for(const v of patrol)if(see(v,83))view.draw("shadowCar",v.x,v.z>181?footLevel(v.x,v.z)+.05:.145,v.z,v.yaw);
      if(!airLine.aboard&&!car&&!skiff&&!swim&&!film)view.draw("shadowFoot",hero.x,hero.y+.025,hero.z,hero.yaw);
    }
    if(atSea){shorePeople(visible,see,t,false);if(swim)BaySwimmerArt.world(visible,swim.actor(hero),t,hours);}
    if(active?.field&&!listening()&&!swim&&!car&&!skiff&&!transfer&&!deckStep&&cutArtReady)
      BayCutWildlife.carryRecorder(visible,hero,hero.y+motion.lift,t);
    drawCourse(see);
    if(airCockpit())BayAirmailArt.cockpit(visible,airLine.plane,t,airLine.seatRole(),{companion:true,control:airLine.player.control,kit:save.courts.equipped,mail:save.airmail.bag&&BayAirPost.tagFor(save.airmail.bag)});
    for(const a of visible)view.draw(...a);
    if(play&&see(scoutDesk,75)&&scoutHouseCard())BayScoutArt.drawDeskPrint(view,scoutDesk,houseCard,unit.film.pinned.number);
    if(washArtReady&&see(wash.site.bay,65))BayPalmaWash.water(view,wash,t);
    if(insideSeat()){
      const body=roadBody(car),ground=footLevel(car.x,car.z)+.008+serviceLift(car);
      BayDriversSeat.draw(view,model,body,ground,{night:dusk,time:t,headlights:seatLights(),kit:save.courts.equipped});
    }
    if(marketArtReady)BayMercadoArt.light(view,see,hours);
    if(play){BayTakePoster.world(view,model,save.stunt,see);BayCoastCamera.prints(view,model,motos.prints,see);}
    BayStreetArt.draw(view,streetTime,cam);
    for(const v of cars){
      const pulse=BayStreetReactions.hornPulse(v,streetTime);
      if(pulse>.10&&v.path&&see(v,47))view.draw("horn-wave",v.x,footLevel(v.x,v.z)+bayCarLayout(v.kind).glass[5]+.32+pulse*.16,v.z,eye.yaw);
    }
    for(const v of patrol)if(see(v,110))view.draw(Math.floor(t*5.5)%2?"flash-red":"flash-blue",v.x,footLevel(v.x,v.z)+.01,v.z,v.yaw,0,v.lean);
    tapes.forEach((o,i)=>{
      if(save.tapes.includes(i)||!see(o,72))return;
      if(i===1)BaySoundShell.demo(view,o);else view.draw(i===0?"motel-tape":"tape",o.x,1.1+Math.sin(t*2+i)*.12,o.z,t*1.3+i);
    });
    if(active?.showGhost&&see(active.ghost,90)&&dist(hero,active.ghost)>.75){
      const r=active.ghost;
      if(!ghostMesh){ghostMesh=new BayPlayerMesh(personColors[0]);view.add("dash-ghost",ghostMesh,true);}
      if(ghostMesh.update(r.motion))view.updateAnimated("dash-ghost");
      view.drawGhost("dash-ghost",r.x,footLevel(r.x,r.z)+r.motion.lift,r.z,r.yaw);
    }
    if(pickup?.human.shot?.stage==="wind"){
      const p=view.project(hero.x,hero.y+1.30,hero.z);
      courtMeterAt(p?.x??innerWidth*.50,p?.y??innerHeight*.56);
    }
    const tar=unit.eye||unit.transition||shooting()||listening()||film?null:streetTarget();
    if(tar){if(active?.meet&&meet.role==="driver"&&Number.isFinite(tar.yaw)){
        model("meet-turn",g=>{
          for(const z of [-2.6,-.8]){
            for(const side of [-1,1])g.quad([0,.095,z+.85],[side*1.03,.095,z+.08],[side*1.03,.095,z-.37],[0,.095,z+.37],"#ffdb95",1);
          }
        });
        view.draw("meet-turn",tar.x,0,tar.z,tar.yaw,0,0,.50);
        view.draw("destRing",tar.x,0,tar.z);
      }else if(active?.job.id!=="dash"&&!active?.regatta&&tar.kind!=="ferry-gate"){
        const ground=active?.neon?tar.y:tar.z>181?footLevel(tar.x,tar.z):0;view.draw("destRing",tar.x,ground,tar.z);view.draw("beacon",tar.x,ground+2.6+Math.sin(t*3)*.17,tar.z,eye.yaw);
      }
      const mark=view.project(tar.x,3.6+(active?.neon?tar.y:tar.z>181?footLevel(tar.x,tar.z):0),tar.z),label=$("targetTag");
      if(play&&!panel&&mark&&mark.x>48&&mark.x<innerWidth-48&&mark.y>55&&mark.y<innerHeight-75&&dist(pos(),tar)>9){
        label.hidden=false;label.style.left=mark.x+"px";label.style.top=mark.y+"px";label.textContent=(tar.kind==="ferry-gate"?"PALOMA · ":"")+Math.round(dist(pos(),tar))+" m";
      }else label.hidden=true;
    }else $("targetTag").hidden=true;
    if(a&&a.light>.01&&see(a,190)){
      if(!airBeam){airBeam=new BayPatrolArt.Searchlight();view.add("air-beam",airBeam,true);}
      airBeam.update(a,backup.lamp(a));view.updateAnimated("air-beam");view.drawSearchlight("air-beam");
    }
    if(listening())BayCutWildlife.micView(view,eye,t,!!active.field.slice);
    if(insideSeat())seatOverlay(false,t);
    if(unit.eye)scoutDevelop(scene,$("sky"),(x,y,z)=>{const q=view.project(x,y,z);return q&&{x:q.x/innerWidth,y:q.y/innerHeight};});
    if(motos.finder)exposeMoto(scene,$("sky"),(x,y,z)=>{const q=view.project(x,y,z);return q&&{x:q.x/innerWidth,y:q.y/innerHeight};});
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
  function neonHud(){
    const el=$("neonTester");el.hidden=!neon.testing;if(!neon.testing)return;
    const w=neon.shift,order=BayMarlinNeon.find(w.id).order,target=order[w.index];
    $("neonCount").textContent=(w.index+1)+" / 5";$("neonShoe").style.left=(10+w.shoe*20)+"%";
    $("neonWarm").style.width=clamp(w.charge*100,0,100)+"%";
    for(let i=0;i<5;i++)$("tube"+i).className=w.fitted[i]?"done":i===target?"target":"";
    $("neonTask").textContent=(w.flash>0?"Open contact  ·  ":"")+"Set "+"MOTEL"[target]+"  ·  A/D turn  ·  Hold Space to warm";
  }
  function transitHud(){
    const card=$("transitCard"),p=transit.player,flag=transit.flag,b=transit.bus;
    card.hidden=!transit.engaged;if(card.hidden)return;
    const away=transit.phase==="road"||transit.phase==="manual",driver=!!transit.shift;
    $("objective").hidden=true;$("busDuty").textContent=flag?"Bus stop":driver?"Relief driver":"Transfer";
    for(let i=0;i<4;i++){
      const punched=save.transit.stamps.includes(BayTransit.stops[i].id);
      $("rs"+i).className=(i===transit.next?"next":i===transit.current?"here":"")+(punched?" punched":"");
    }
    const moving=Math.round(away?transit.nextDistance():0);
    let call,detail,action="",hint="";
    if(flag){
      call=flag.s.short;detail="Coach 608 · "+Math.ceil(transit.distanceTo(flag.s))+" m along the loop";
      action="E";hint="Leave the stop";$("mode").textContent="Waiting for Route 6";
    }else{
      $("mode").textContent=driver?"Route 6 · Driver":"Route 6 · Passenger";
      $("speed").innerHTML=driver&&p.stage==="ride"?'<em class="gear">'+(b.reversing?"R":"D"+b.gear)+'</em>'+Math.round(Math.abs(b.speed)*2.237)+"<small>MPH</small>":"";
      if(p.stage!=="ride"){
        call=["standing","alight"].includes(p.stage)?"Stepping off":"Boarding Coach 608";
        detail=driver?"Marta’s changeover":transit.stop.short;
      }else if(driver&&transit.phase==="manual"){
        call=transit.target.short+"  ·  "+(moving>BayTransit.track.length-25?Math.round(dist(b,transit.target.berth)):moving)+" m";
        detail=dist(b,transit.target.berth)<25?transit.dockHint():roadGuide(transit.target).turn;
        action="F";hint="Doors at the stop  ·  V change view";
      }else if(driver){
        call=transit.phase==="close"?"Doors closing":transit.phase==="handoff"?"Marta’s taking over":transit.stop.short;
        detail=transit.busy()||transit.pending()?"Passengers at the doors":"Next up · "+transit.target.short;
        action="F";hint="Close doors  ·  E hand back the wheel  ·  V view";
      }else{
        call=away?"Next · "+transit.target.short:transit.stop.short;
        const riders=transit.people.filter(q=>q.stage==="ride").length;
        detail=transit.requested?"Stop requested  ·  Exit through the rear door":away?moving+" m · "+riders+(riders===1?" passenger":" passengers"):"Doors "+(b.door>.94?"open":"moving");
        const open=transit.phase==="dwell";action=open?"E":"F";hint=(open?"Get off here":"Pull the stop cord")+"  ·  V change view";
      }
    }
    $("busCall").textContent=call;$("busDetail").textContent=detail;contextHint(action,hint);
  }
  function airHud(){
    const l=airLine,s=airDesk(),gate=airGate(),own=l.player,waiting=l.reserved,tar=l.mailTo;
    if(!l.aboard&&!waiting&&!s&&!gate&&!l.pending&&!BayGullKey.siteAt(hero.x,hero.z))return false;
    if(!l.aboard&&(!airFree()||swim||skiff))return false;
    if(!l.aboard&&!waiting){
      if(l.pending){contextHint("",l.pending.kind==="sign"?"Signing the delivery slip":"Sealing the dispatch pouch");return true;}
      if(s){contextHint("F",s===tar?"Hand the mail to "+clerk(s).name:"Talk to "+clerk(s).name+" · "+s.name);return true;}
      const v=boardable();
      if(v&&(!gate||dist(hero,gate.skiffFoot)<dist(hero,gate.exit))){contextHint("E","Board the "+bay.hulls[v.kind].name);return true;}
      if(l.reader.stage!=="ride"&&dist(hero,l.reader)<1.8){contextHint("F","Talk to Oren · Tide reader");return true;}
      if(!gate){contextHint("","Striped step for Fern 3 · Post window for mail · Space to jump into the bay");return true;}
      if(!l.listen(gate)){contextHint("F","Call Fern 3 to the float · E reserve the pilot seat");return true;}
      contextHint("E","Fly Fern 3  ·  F ride with Nani");return true;
    }
    const f=l.plane,ticket=$("airTicket"),instruments=$("airInstruments");
    ticket.hidden=false;$("objective").hidden=true;$("speed").textContent="";
    const stopped=l.phase==="dock",name=l.manual?"Pilot":own?"With Nani":"At the float";
    $("airRole").textContent="FERN 3 / "+name;$("mode").textContent=own?"Fern 3 · "+name:waiting?"Waiting for Fern 3":"Boarding step";
    instruments.hidden=!(own&&!l.transfer);if(!instruments.hidden)BayAirmailArt.instruments(instruments,f,l.seatRole());
    let label="",hint="",leg="",guide="";
    if(waiting&&!own&&!l.transfer){
      const s=BayPelicanAir.site(waiting.id),ready=l.listen(s),far=dist(hero,s.exit)>3.25;
      leg=ready?"Fern 3 is tied up":l.phase==="dock"?"Fern 3 at "+l.dock.name:"Nani is on the way";
      guide=far?"Walk to the striped step · "+Math.round(dist(hero,s.exit))+" m":ready?"Your seat is ready":"Listen for the floatplane · "+Math.round(dist(f,s.berth))+" m";
      label=far?"": "E";hint=far?"Follow the planks to the water":ready?"Board Fern 3":"Release your seat";
    }else if(l.transfer){leg=l.transfer.in?"Climbing onto the float":"Stepping onto the dock";guide=l.dock.name;}
    else if(l.phase==="rescue"){leg="Dock launch called";guide="Nani is bringing you and the mail back";}
    else if(l.phase==="moor"){leg="Securing the lines";guide=l.dock.name;}
    else{
      const dest=l.target,at=l.berthNear(),kn=Math.round(Math.abs(f.speed)*1.944),ft=Math.round(f.y*3.281);
      leg=stopped?l.dock.name:dest.name+" · "+Math.round(dist(f,dest.berth))+" m";
      if(stopped){guide=l.manual?"W throttle up · At 24 kn hold Space to lift off":l.layover?"F continue the flight with Nani":"Nani departs in "+Math.max(0,Math.ceil(3.4-l.clock))+" s";
        label="E";hint="Step off  ·  G swap controls  ·  V view";}
      else if(l.manual){
        guide=(f.airborne?ft+" ft · ":kn<24?"On the floats · ":"Ready to lift · ")+kn+" kn · Throttle "+Math.round(f.throttle*100)+"%";
        label=at?"F":f.airborne?"A/D":"W/S";
        hint=at?"Tie up at "+at.name:f.airborne?"Bank · Space climb · Shift descend · G Nani · V view":"Throttle · A/D steer · Space lift at 24 kn · G Nani";
      }else{guide=l.phase==="taxi"?"Nani is taxiing in":l.phase==="final"?"Nani is lining up on the water":f.airborne?ft+" ft · "+kn+" kn over "+district(f):"Nani is opening the throttle";
        label="G";hint="Take control · V switch seat view · Mouse to look";}
    }
    $("airLeg").textContent=leg;$("airGuide").textContent=guide;contextHint(label,hint);return true;
  }
  function hud(){
    broadcastDesk.readout($,elapsed,!!(active?.take||band.tape||onAir||skateTape.active||motos.finder||unit.eye));
    BayButtonwoodStreet.readout(works,car,skiff,play&&!panel&&!transfer&&!room);
    BayBrisasStreet.hud(club,car,play&&!panel&&!transfer&&!room&&!active?.take);
    BayPalmRoom.hud(palm,play&&!panel);
    neonHud();
    $("skateTicket").hidden=true;$("airTicket").hidden=true;$("hud").classList.toggle("flying",airLine.aboard||!!airLine.reserved);
    $("transitCard").hidden=!transit.engaged;
    const b=cabs.booking,fare=active?.cabFare,p=pos(),tar=currentTarget();
    const area=BayPalmDiner.contains(p.x,p.z)?"Palm Diner":room?.kind==="cinema"?"Cine Luna":room?"Marlin Motel · 14":pickup?pickup.site.name:district(p);
    $("district").textContent=area;$("money").textContent=cash(save.wallet);
    $("cityTime").textContent=BayHours.time(hours.minute);$("miniButton").hidden=!!room;
    const roadCar=transit.aboard?transit.bus:b?.stage==="ride"?taxi:car,road=roadCar&&!active?.take?BayStreetNames.through(roadCar,roadCar.yaw):"";
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
    if(windowRide?.held)$("mode").textContent="Window Seat · Passenger";
    if(cabs.playerHeld)$("mode").textContent=b.stage==="ride"?"Cab 17 · Passenger":b.stage==="out"?"Stepping out":"Boarding Cab 17";
    if(cycles.riding)$("mode").textContent=cycles.transfer?(cycles.transfer.out?"Stepping off":"Getting on"):"Beach cruiser";
    if(boardwalk.player)$("mode").textContent=boardwalk.player.phase==="ride"?"Coast Wheel · Cabin "+(boardwalk.player.car+1):"Coast Wheel · Platform";
    $("diveGauge").hidden=!swim||!!swim.exit||(!diving&&swim.air>.992);
    if(!$("diveGauge").hidden){
      const airLeft=Math.round(swim.air*100);
      $("swimDepth").textContent=swim.depth>.25?swim.depth.toFixed(1)+" m":"Surface";
      $("swimAir").style.width=airLeft+"%";$("swimAir").parentElement?.setAttribute("aria-valuenow",String(airLeft));
      $("airLabel").textContent=swim.forced?"Coming up for air":"Air "+airLeft+"%";$("diveGauge").className=airLeft<28?"low":"";
    }
    const hearCall=call&&!room&&!pickup&&!heat&&!active&&!airLine.aboard&&!watchCrew.towing&&!diving&&p.x>145&&dist(p,call.swimmer)<90;
    $("watchCall").hidden=!hearCall;
    if(hearCall)$("watchMessage").textContent=call.phase==="guard"?"Tali is bringing "+swimmer+" ashore":swimmer+" is waving by the "+call.slip.flag.toLowerCase()+" · "+Math.round(dist(p,call.swimmer))+" m";
    const damaged=car&&BayRecovery.worst(car);
    $("tireCall").hidden=(!car?.flatSide&&(!damaged||car.damage[damaged]<.17))||!!transfer;
    if(!$("tireCall").hidden)$("tireCall").textContent=car.flatSide?tireStatus(car):BayRecovery.faultText(car);
    $("speed").innerHTML=skiff&&!deckStep?'<em class="gear">'+(skiff.speed<-.6?"ASTERN":skiff.trim>.35?"TRIM UP":"AHEAD")+'</em>'+Math.round(Math.abs(skiff.speed)*1.944)+"<small>KN</small>":
      car&&!transfer?'<em class="gear">'+(car.reversing?"R":"D"+car.gear)+'</em>'+Math.round(Math.abs(car.speed)*2.237)+"<small>MPH</small>":"";
    if(cycles.riding&&!cycles.transfer)$("speed").innerHTML='<em class="gear">'+(cycles.riding.air>.10?"AIR":cycles.riding.effort>.78?"SPRINT":cycles.riding.effort>.2?"PEDAL":"COAST")+'</em>'+Math.round(cycles.riding.speed*2.237)+"<small>MPH</small>";
    const ferry=active?.ferry,meter=$("ferryMeter");
    meter.hidden=!ferry||ferry.phase!=="water"||skiff!==ferry.boat||dist(p,ferry.ship.gate)>30;
    if(!meter.hidden){
      const progress=Math.round(100*ferry.hold/BayFerry.holdTime);
      meter.style.setProperty("--hold",progress+"%");meter.setAttribute("aria-valuenow",String(progress));
    }
    const relay=cycles.run;
    if(relay?.phase==="meet"&&cycles.match?.gap<8){const progress=Math.round(100*relay.hold);
      meter.hidden=false;meter.style.setProperty("--hold",progress+"%");meter.setAttribute("aria-valuenow",String(progress));}
    if(!meter.hidden)meter.setAttribute("aria-label",relay?"Ticket pouch handoff":"Steady alongside the ferry");
    const stunt=active?.take;
    dashHud();regattaHud(active?.regatta);takeHud(stunt);$("objective").hidden=!tar||!!active?.dash||!!active?.regatta||!!stunt||neon.testing;
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
      if(windowRide){const r=windowRide;$("objectiveTag").textContent="Window Seat  /  "+r.brief.title;
        $("objectiveText").textContent=r.held?r.brief.subject:"Meet "+BaySecondUnit.names[unit.other]+" at the curb";
        $("roadTurn").textContent=r.best?"Best frame "+r.best.score+"/100":r.held?"Frame the landmark from the moving car":formatVehicle(r.vehicle)+" · "+Math.round(dist(r.vehicle,r.pickup))+" m";
      }else if(active?.buttonwood){
        $("objectiveTag").textContent="Pot Run · "+BayButtonwood.sheets[works.saved.sheet].name;
        $("objectiveText").textContent=tar.name+(meters>5?" · "+meters+" m":"");
        $("roadTurn").textContent=guide?.turn||buttonwoodTask();
      }else if(active?.brisas){
        $("objectiveTag").textContent="Las Brisas";$("objectiveText").textContent=tar.name+" · "+meters+" m";
        $("roadTurn").textContent=club.trip?BayBrisasStreet.routeHint(club):car?.hydraulic?"Stop straight between the chalk corners":"Find the plum Solena";
      }else if(active?.palm){
        const j=palm.visit;$("objectiveTag").textContent="Palm Diner";
        $("objectiveText").textContent=(j.stage==="pickup"?"Pick up "+j.a.name:j.stage==="table"?"Join "+j.a.name+" at the table":j.a.ride?"Take "+j.a.name+" to the Palm":"Meet at the Palm")+" · "+meters+" m";
        $("roadTurn").textContent=j.stage==="pickup"?BayPalmLeague.data[j.a.id].place:j.a.ride?(guide?.turn||"Ocean Drive, west curb"):"House table past the front doors";
      }else if(active?.gull){
        $("objectiveTag").textContent=gull.request?.kind==="buy"?"Gull Street Motors":"A Second Opinion";
        const d=gull.drive,r=gull.request,v=r?.v||d?.v,onTest=d?.phase==="road",returning=d?.phase==="home";
        const label=awayFromDemo(d)?tar.name:onTest?tar.name:returning?"Return to Gull Street Motors":r?.kind==="return"?"Kitty’s key counter":r?"Meet Kitty at the "+formatVehicle(v):d?.phase==="board"?"Take the driver’s seat":"Return the road sheet";
        $("objectiveText").textContent=label+(meters>10?" · "+meters+" m":"");
        if(awayFromDemo(d))$("roadTurn").textContent=v.plate;
        else if(onTest){
          const marks=BayGullSales.specs[v.kind].gates,g=marks[d.gate];
          $("roadTurn").textContent=d.gate===2?"Stop facing along the curb":"Reading "+(d.gate+1)+" / 3 · Aim for "+Math.round(g.pace*2.237)+" mph";
        }else $("roadTurn").textContent=returning?"Road sheet · "+Math.round(d.grade)+"/100":r?.kind==="buy"?"Sale price "+cash(gull.price(v.kind)):v?formatVehicle(v):"";
      }else if(active?.moto){
        $("objectiveTag").textContent="Second Seat  /  "+motos.job.brief.title;
        $("objectiveText").textContent=motoInstruction()+(meters>8?" · "+meters+" m":"");
        $("roadTurn").textContent=guide?.turn||tar.name;
      }else if(active?.rescue){
        $("objectiveTag").textContent="Rescue 4   /   "+rescue.call.name;
        $("objectiveText").textContent=rescueText()+(meters>9?" · "+meters+" m":"");
        $("roadTurn").textContent=rescue.cot.occupied?"Ride comfort "+Math.round(rescue.grade)+" / 100"+(guide?"  ·  "+guide.turn:""):guide?.turn||tar.name;
      }else if(active?.airmail){
        $("objectiveTag").textContent="Gull Key Post  /  "+airLine.leaflet()[0];
        $("objectiveText").textContent=clerk(airLine.mailTo).name+" · "+airLine.mailTo.name+" · "+meters+" m";
        $("roadTurn").textContent=skiff?"Tie up at the side berth, then walk to the hatch":"Get the delivery slip signed at the other end";
      }else if(active?.neon){
        $("objectiveTag").textContent="Marlin Neon Service  /  "+BayMarlinNeon.find(neon.shift.id).name;
        $("objectiveText").textContent=neon.status();
        $("roadTurn").textContent=neon.testing?"A/D or arrows to turn  ·  Space to warm":neon.shift.stage==="proof"&&roofs.raised?"Climb down at either ladder":tar===stairFoot?"The first steps are at the south end of the motel":tar.name;
      }else if(active?.bridge){
        $("objectiveTag").textContent="Salt Creek  /  Bridge watch";
        $("objectiveText").textContent=bridge.instruction();
        const load=bridge.packet.direction<0?"Ice for the creek":"Empty totes for the bay";
        $("roadTurn").textContent="June Bug · "+load+"   /   Span "+Math.round(bridge.lift*100)+"%";
      }else if(active?.wash){
        const w=wash.work,guest=wash.order;
        $("objectiveTag").textContent="Palma Hand Wash"+(w?.type==="shift"&&guest?"  /  "+guest.plate:"");
        $("objectiveText").textContent=w?.ready?"Let "+guest.name+" know the car is ready":w?.type==="attended"?"Elia is washing your car":w?car?"Step out and take the blue hose":"Walk around the car and rinse each panel":guest?.phase==="incoming"?"Give the arriving driver room to park":"Meet the next customer in the covered bay";
        $("roadTurn").textContent=w&&!w.ready?w.v.soil.map((n,i)=>["L","R","Hood","Rear"][i]+" "+Math.round(100*(1-n))+"%").join("   ·   "):w?.ready?"Waiting beside the till":guest?.name||"Elia Mena  /  Ocean Drive";
      }else if(active?.band){
        $("objectiveTag").textContent=band.outing==="drive"?"June Mora  /  Night drive":"Saltwater Sessions";
        $("objectiveText").textContent=band.instruction(car)+(meters>9?"  ·  "+meters+" m":"");
        $("roadTurn").textContent=band.june.state==="ride"?(guide?.turn||"June · Passenger seat"):band.june.state==="shell"?"June is at the microphone":"North Boardwalk";
        if(band.take)$("objective").hidden=true;
      }else if(active?.valet){
        const guest=valet.focus;
        $("objectiveTag").textContent="Marlin valet"+(guest?"  /  Ticket "+BayValetPlaces.stalls[guest.slot].id:"");
        $("objectiveText").textContent=valet.instruction(car)+(meters>5?"  ·  "+meters+" m":"");
        $("roadTurn").textContent=guest?guest.name+"  /  "+guest.plate:valet.slots.filter(g=>g?.tagged).length+" keys on the board";
      }else if(active?.relay){
        $("objectiveTag").textContent="Last Bell Run  /  "+(relay.phase==="meet"?"Javi Reyes":"Mags Duran");
        $("objectiveText").textContent=cycles.guide()+(meters>10?"  ·  "+meters+" m":"");
        $("roadTurn").textContent=relay.phase==="meet"?(cycles.match?.gap<12?"Javi  "+cycles.match.pace+" mph  ·  Take either side":"Look for the red pouch in Javi’s basket"):
          (relay.clock<relay.limit?"Bell in "+Math.ceil(relay.limit-relay.clock)+" s  ·  $40 rush bonus":"Next cabin  ·  Regular fare");
      }else if(active?.recovery&&recovery.call){
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
    courtHud();drumHud();
    if(crewHint()){ /* The character on location supplies the prompt. */ }
    else if(broadcastDesk.mix)contextHint("E",broadcastDesk.mix.result?"Step away · Space try again · F sleeve book":"Step away · V change view");
    else if(umbrellaHint()){ /* Loan stand or companion. */ }
    else if(atRadioDesk())contextHint("F","Talk to Ivo · Sol FM turntables");
    else if(buttonwoodHint()){ /* The active rig supplies its controls. */ }
    else if(brisasHint()){ /* Nico or the switch box handles the prompt. */ }
    else if(palmHint()){ /* Palm house controls. */ }
    else if(gullHud()){ /* Kitty, Malik or the garage supplies this prompt. */ }
    else if(motoHud()){ /* The motorcycle or film counter supplies the prompt. */ }
    else if(rescueHud()){ /* The crew handles this prompt. */ }
    else if(airHud()){ /* The float or dispatch window handles the interaction. */ }
    else if(skate.rider||active?.skate)skateHud();
    else if(skateStand()){const c=skateStand();contextHint("F","Talk to "+c.filmer.name+"  ·  "+c.site.name+" skate spot");}
    else if(transit.engaged)transitHud();
    else if(room?.kind==="cinema"){
      const use=roomAction();$("objective").hidden=true;$("mode").textContent=room.seated?"In your seat":"Auditorium";$("speed").textContent="";
      contextHint(use?"F":"",use==="exit"?"Step outside Cine Luna":use==="seat"?"Take this seat":use==="rise"?"Get up":use==="program"?"Read tonight’s program":room.transition?"":"Walk down the aisle to find a seat");
    }else if(room){
      const use=roomAction();$("objective").hidden=true;$("mode").textContent="Room 14";$("speed").textContent="";
      contextHint(use?"F":"",use==="door"?"Step out to Ocean Drive":use==="bed"?"Set the alarm":use==="desk"?"Read the note on your desk":use==="rack"?"Change clothes":"Walk to the bed, desk, clothes rail or door");
    }else if(band.take){
      const take=band.take;$("mode").textContent="Sol Sound Shell";$("speed").textContent="";
      contextHint(take.phase==="result"?"T":"",take.phase==="result"?"Play another take  ·  E stand up":take.phase==="leave"?"":"A kick   S snare   D hi-hat   ·   V camera   E stand up");
    }else if(routeStop()){const st=routeStop();contextHint("F","Route 6 timetable"+(transit.docked(st)?"  ·  E board Coach 608":""));}
    else if(neon.testing){$("mode").textContent="Neon tester";contextHint("V","Change view  ·  E pocket the tester");}
    else if(roofs.action){
      const a=roofs.action;$("mode").textContent=a.kind==="ladder"?"On the ladder":a.kind==="mantle"?"Pulling up":a.kind==="vault"?"Vaulting":"Dropping";
      contextHint(a.kind==="ladder"?"W/S":"",a.kind==="ladder"?"Climb up or down  ·  Shift faster  ·  E let go  ·  "+hero.y.toFixed(1)+" m":"");
    }else if(active?.neon&&atNeonBoard()&&neon.shift.stage==="climb")contextHint("F","Set up Vera’s sign tester");
    else if(active?.neon&&neon.shift.stage==="proof"&&onStreetFeet()&&dist(hero,neon.vera)<3)contextHint("F","Sign the lighting ticket with Vera");
    else if(canTraverse()&&roofs.ladderAt(hero))contextHint("F","Grab the "+roofs.ladderAt(hero).name+"  ·  W/S climb");
    else if(canTraverse()&&roofs.ledgeAt(hero))contextHint("Space","Pull up onto the "+roofs.ledgeAt(hero).name);
    else if(atNeonBench())contextHint("F","Vera Cordero · Marlin Neon Service");
    else if(atNellie())contextHint("F","Talk to Nellie Park");
    else if(roofs.level){$("mode").textContent=roofs.name;contextHint("",roofs.name+"  ·  "+hero.y.toFixed(1)+" m");}
    else if(canTraverse()&&roofs.vaultAt(hero,roofEnv))contextHint("Space","Vault across the car  ·  E open door");
    else if(active?.bridge){
      const keyed=bridge.owned;
      const ring=bridge.phase==="road"&&bridge.demand||keyed&&bridge.phase==="release"&&!bridge.reopen;
      const lever=keyed&&(bridge.phase==="warning"&&bridge.gateReady||bridge.phase==="raising"||bridge.phase==="water"&&bridge.sternClear||bridge.phase==="lowering");
      contextHint(atBridge()?(ring?"F":lever?"Space":"V"):"",!atBridge()?"Step up to the keeper’s board":ring?(bridge.phase==="road"?"Ring the bell and close the road":"Release the road gates"):lever?"Hold the span lever  ·  V watch the channel":bridgeLook()?"Release to return to the platform":"Hold V to look down the channel");
    }else if(atBridge()&&!active)contextHint("F","Inez Soria · Salt Creek bridge house");
    else if(skiff&&bridge.canHail(skiff)&&!active?.regatta&&!active?.ferry)contextHint("F",bridge.phase==="water"?"Salt Creek · Passage open":"Call Inez for an opening");
    else if(car&&bridge.phase!=="road"&&bridge.stopDistance(car,Math.sin(car.yaw),Math.cos(car.yaw))<24)contextHint("","Drawbridge opening  ·  Shell Levee goes around");
    else if(onStreetFeet()&&!active&&dist(hero,bridge.walker)<2.3)contextHint("F","Talk to Caro Díaz");
    else if(active?.wash){
      const w=wash.work;
      if(w?.ready)contextHint(dist(hero,wash.order)<3.35?"F":"","Collect the wash ticket from "+wash.order.name);
      else if(w?.type==="attended")contextHint("Z","Change driving view  ·  I wipers");
      else if(w&&car)contextHint("E","Get out to wash your car");
      else if(w&&wash.target)contextHint("Space","Hold to rinse  ·  "+BayPalma.sides[wash.panel]+"  ·  E hang up the hose");
      else contextHint("",w?"Step closer to a panel with the hose":"Keep the path into the bay clear");
    }else if(atWash())contextHint("F",car?"Call Elia to the rinse pad":"Elia Mena · Palma Hand Wash");
    else if(atSetList())contextHint("F","Ben Mora · Sound Shell set list");
    else if(byJune())contextHint("F",save.tapes.includes(0)&&!save.juneReturned?"Return June’s blue-dot demo":band.outing?"Talk to June":"June Mora · Saltwater Sessions");
    else if(band.holds(car))contextHint("","June’s passenger door");
    else if(pickup){
      const g=pickup,p=g.human; const live=g.phase==="live";
      $("objective").hidden=true;$("mode").textContent=g.mode==="practice"?"Shootaround":"Pickup basketball";
      contextHint(g.phase==="result"?"F":live&&(!g.ball.holder||g.ball.holder===p)?"Space":live?"F":"E",
        g.phase==="result"?"Play again  ·  E  Leave court":!live?"Step off court":g.ball.holder===p?"Hold to shoot · X face hoop · F crossover · G glass":
        !g.ball.holder?"Jump for the rebound  ·  E leave":"Reach for a steal  ·  Space block  ·  Shift sprint");
    }else if(courtAtLine()){
      const g=courtAtLine();contextHint("F",g.phase==="traffic"?"Talk to the scorekeeper":"Call next or shoot around at "+g.site.name);
    }else if(boardwalk.player){
      const phase=boardwalk.player.phase;
      if(phase==="ride")contextHint("V",(boardwalk.outside?"Seatside view":"Outside view")+"  ·  Mouse or Q/C to look  ·  "+Math.round(hero.y)+" m above the pier");
      else if(phase==="walk"||phase==="gate")contextHint("E",phase==="walk"?"Walking to the turnstile  ·  Cancel":"Waiting for the gate  ·  Cancel");
      else contextHint("",phase==="board"?"Taking your seat":"Back at the platform");
    }else if(cycles.riding){
      if(cycles.transfer)contextHint("","");
      else if(boardwalkFree()&&dist(cycles.riding,cycles.javi)<4.6)contextHint("F","Talk to Javi Reyes · Last Bell Run");
      else if(relay?.phase==="meet"&&cycles.match?.gap<8)contextHint("F","Hold beside Javi for the red pouch");
      else if(relay?.phase==="deliver"&&dist(hero,ticketWindow)<8)contextHint("E","Brake and step off at Mags’s window");
      else contextHint("W","Pedal  ·  Shift sprint  ·  Space hop  ·  H bell  ·  E step off");
    }else if(active?.relay&&cycles.run.phase==="deliver"&&byWindow())contextHint("F","Hand Mags the ticket pouch");
    else if(boardwalkFree()&&byGate())contextHint("E","Ride the Coast Wheel  ·  "+wheelFare());
    else if(boardwalkFree()&&byWindow())contextHint("F","Mags Duran · Ticket window");
    else if(onStreetFeet()&&(!active||active.relay)&&dist(hero,cycles.nearest(hero))<2.35)contextHint("E","Ride the beach cruiser");
    else if(onStreetFeet()&&boardwalkFree()&&dist(hero,cycles.javi)<4.6)contextHint("F","Talk to Javi Reyes · Last Bell Run");
    else if(b){
      const riding=b.stage==="ride",nearDoor=dist(hero,taxi)<8.8;
      contextHint(b.stage==="ready"&&nearDoor||riding&&!b.early?"E":b.stage==="waiting"?"J":"",
        b.stage==="ready"?(nearDoor?"Get into Cab 17":"Walk to Cab 17’s passenger door"):riding?(b.early?"Stopping at the next curb":"Ask Mina to pull over")+(isTop()?"":cabWindow()?"  ·  F  Outside view":"  ·  F  Passenger view"):b.stage==="waiting"?"Booking details":"Passenger door");
    }else if(transfer||deckStep||active?.regatta||swim?.exit)contextHint("","");
    else if(active?.valet){
      const g=valet.focus,offered=!g&&valet.offer();
      if(exchangingKey())contextHint("","Exchanging the key and claim check");
      else if(!g&&offered&&(atValet()||dist(hero,offered)<2.5))contextHint("F",offered.ready?"Take claim check · "+offered.plate:"Take the key · "+offered.name);
      else if(g?.stage==="hang"&&atValet())contextHint("F","Hang tag "+BayValetPlaces.stalls[g.slot].id);
      else if(!car&&g?.stage==="deliver"&&dist(hero,g)<2.9&&BayMotorCourt.parked(g.car,BayValetPlaces.berth,true))contextHint("F","Return "+g.plate+" to "+g.name);
      else if(!car&&g&&enterable()===g.car)contextHint("E","Take the wheel · "+g.plate);
      else if(car)contextHint("E",BayMotorCourt.parked(car,g.stage==="park"?BayValetPlaces.stalls[g.slot]:BayValetPlaces.berth,g.stage!=="park")?"Park and step out":"Step out when parked");
      else if(atValet())contextHint("F","Tess Vidal · Shift book");
      else contextHint("",valet.instruction(car));
    }
    else if(atValet())contextHint("F","Tess Vidal · Marlin valet stand");
    else if(onStreetFeet()&&!heat&&!active&&owners.nearby(hero))contextHint("F","Talk to the driver");
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
    else if(onStreetFeet()&&dist(hero,BayDrawbridge.iceCounter)<2.45)contextHint("F","Leda Vale · Salt Creek Ice Landing");
    else if(!car&&bay.landing(hero.x,hero.z)===BayDrawbridge.iceDock){
      const v=boardable();contextHint(v?"E":"",v?"Board "+bay.hulls[v.kind].name:"Salt Creek Ice Landing · Walk the boards to Shell Levee");
    }else if(!car&&bay.landing(hero.x,hero.z)===BayCut.dock){
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
    else if(skateCarried()&&!active)contextHint("K","Put your board down");
    else contextHint("","");
    if(!$("toast").hidden&&elapsed>toastTill)$("toast").hidden=true;
    if(!$("speech").hidden&&elapsed>speechTill)$("speech").hidden=true;
  }
  function closePanel(){
    skateProof=null;
    if(panel==="field-proof"&&active?.field?.phase==="review"){active.field.phase="return";cameraSnap();}
    if(panel==="take-result"&&active?.take?.receipt)wrapTake();
    paintPreview=null;
    panel="";$("panel").hidden=true;$("shade").hidden=true;$("hud").hidden=!play;keys.clear();resetPointer();sound.pause(false);document.activeElement?.blur();lastHud=-10;lastMap=-10;
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
  function radioButton(){return makeButton("Radio & city sounds","Music, engines, surf and street sounds.",radio?"On":"Off",()=>{radioToggle();openPanel("pause",true);});}
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
    const available=parts.filter(part=>part.id!=="hydraulics"||brisasCanFit(v));
    const buttons=available.map(part=>{
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
      available.forEach((part,i)=>{
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
    if(negatives.reel)body.append(makeButton("Cue the window short",BayWindowSeat.filmTitle+" · Three moving frames","Thread short",()=>{room.cuedReel="windows";closePanel();note("Cine Luna","Take an aisle seat. They’ve threaded all three negatives.",3.8);}));
    if(unit.film.pinned)body.append(makeButton("Cue the location print",unit.film.pinned.title+" · "+unit.film.pinned.by,"Thread print",()=>{
      room.cuedReel="location";closePanel();note("Cine Luna","Take an aisle seat to see your frame.",3.8);}));
    if(skateReel)body.append(makeButton("Cue Curb Cut","The projectionist will start your line when you take a seat.","Thread print",()=>{
      room.cuedReel="skate";closePanel();note("Cine Luna","Your print is threaded. Find an aisle seat and press F.",3.8);}));
  }
  function airPanel(body,s,atGate){
    const l=airLine,a=clerk(s),to=BayPelicanAir.site(BayPelicanAir.other(s.id)),record=save.airmail;
    if(!atGate){
      const words=s.id==="marlin"?"If Liv’s porch flag is out, she’s in. The pouch can go up with Nani or across in the skiff. Either way, I need her signature.":"The bay forecast comes from a desk downtown. Out here I keep two copies of everything. Milo gets the other one.";
      signedNote(body,words,a.name);
      if(record.bag===null){
        const letter=l.leaflet(s.id);
        body.append(makeButton("Take outgoing mail · "+letter[0],letter[1]+" Deliver to "+clerk(to).name+".","$125 + landing",()=>{
          if(airDesk()!==s||!l.load(s))return;closePanel();hero.yaw=s.desk.yaw;keys.clear();lastHud=-10;
        }));
      }else if(l.mailTo===s){
        body.append(makeButton("Sign for "+l.leaflet()[0],"Hand the pouch across the counter and collect your delivery pay.","Hand over",()=>{
          if(airDesk()!==s||!l.sign(s))return;closePanel();hero.yaw=s.desk.yaw;keys.clear();lastHud=-10;
        }));
      }else signedNote(body,"Already sealed · "+l.leaflet()[0]+" for "+clerk(to).name+".",to.name);
    }else signedNote(body,l.listen(s)?"Untie her whenever you’re ready. Take the left seat to fly, or sit beside me and watch the coast.":"I’ve got the pier in my book. Hold a seat and I’ll bring her round.","Ana “Nani” Flores");
    for(const [role,title,detail] of [["pilot","Fly Fern 3","W and S set the throttle. A and D steer. At 24 knots hold Space to lift. Shift descends. G hands Nani the controls."],["guest","Ride with Nani","Take the right seat for a flight along Ocean Drive. G lets you take over in the air."]]){
      body.append(makeButton(title,detail,atGate&&l.listen(s)?"Board":"Hold a seat",()=>{
        if(!airFree())return;
        if(atGate&&l.listen(s)&&airGate()===s&&l.board(hero,role)){motion.reset();closePanel();keys.clear();lastHud=-10;}
        else reserveAir(s,role);
      }));
    }
    if(printAvailable())body.append(airLedgerButton());
  }
  function airLedgerButton(){return makeButton("Pelican Air · Signed mail","Delivery slips, recorded routes and water landings.","Open ledger",()=>openPanel("air-book"));}
  function openPanel(next,redraw=false){
    if(next==="radio-desk"&&!atRadioDesk()||next==="radio-sleeves"&&!save.airwaves.met)return;
    club.lowerPlayer();if(palm.match)palm.match.draw=null;
    if(!play)return;if(panel===next&&!redraw){closePanel();return;}
    if(next==="air-desk"&&!airDesk()||next==="air-gate"&&!airGate()||next==="air-book"&&!printAvailable())return;
    if(next==="skate-spot"&&!skateStand()||next==="skate-reel"&&!skateReel)return;
    if(next==="route-six"&&!routeStop())return;
    if(next==="neon-bench"&&!atNeonBench())return;
    if(next==="bridge-house"&&(!atBridge()||active||cabs.booking||watchCrew.towing))return;
    if(next==="palma"&&(!atWash()||active))return;
    hoseButton=false;
    if(next==="june"&&!byJune()||next==="set-list"&&!atSetList())return;
    if(next==="valet-desk"&&!atValet())return;
    if(next==="cab-rank"&&!cabRank()||next==="cine-program"&&(room?.kind!=="cinema"||roomAction()!=="program"))return;
    if(next==="recovery-desk"&&(active||heat||cabs.booking||(!byDella()&&!(car===wrecker&&!transfer&&BayRecovery.parked(car)))))return;
    if(next==="wheel-window"&&(!byWindow()||!boardwalkFree()))return;
    if(next==="court-line"&&!courtAtLine())return;
    if(["room-bed","room-desk","room-rack"].includes(next)&&(!room||"room-"+roomAction()!==next)||next==="market"&&!byCounter())return;
    if(next==="guest-parking"&&!atGuestParking())return;
    if(next==="surf-watch"&&(!atWatchBoard()||active))return;
    if(next==="field-desk"&&(active||!byKit())||next==="field-proof"&&active?.field?.phase!=="review")return;
    if(panel==="field-proof"&&next!=="field-proof"&&active?.field?.phase==="review"){active.field.phase="return";cameraSnap();}
    if(next==="take-brief"&&!canJoinTake()||next==="take-result"&&!active?.take?.receipt||next==="take-poster"&&!atTakePoster())return;
    if(panel==="take-result"&&next!=="take-result"&&active?.take?.receipt)wrapTake();
    if(next==="map"&&!redraw)chartMode=airLine.aboard||BayGullKey.siteAt(pos().x,pos().z)===airStops[1]?"bay":BayCut.area(pos())?"cut":skiff||swim?"bay":"city";
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
    if(pickup?.human.shot?.stage==="wind"){const p=pickup.human;p.shot=null;p.wind=0;p.action="dribble";courtMeter();}
    onAir=null;paintPreview=null;$("shade").className=shop?"paint-shade":"";
    panel=next;keys.clear();resetPointer();sound.pause(true);$("hud").hidden=true;$("shade").hidden=false;$("panel").hidden=false;$("panel").setAttribute("data-screen",shop?"garage":next);
    const b=$("panelBody");b.replaceChildren();$("closePanel").focus({preventScroll:true});
    let title="",kicker="";
    if(skate.rider){skate.rider.charging=false;skate.rider.charge=0;}
    skateProof=null;
    if(shop){
      title=garage.name;kicker="Port Sol  /  Service bay";
      b.append($("shopNav").content.cloneNode(true));
      for(const button of b.querySelectorAll(".shop-nav button")){
        button.setAttribute("aria-pressed",String(button.value===next));
        button.onclick=()=>{if(panel!==button.value){openPanel(button.value);$("panelBody").querySelector(".shop-nav [aria-pressed='true']").focus();}};
      }
      if(next==="respray")showPaintTicket(b,car);else showPartsTicket(b,car);
    }else if(next==="court-line"){
      const g=courtAtLine(),beach=g.site.id==="sol",regular=g.regular(),h=g.history;
      title=g.site.name;kicker=(beach?"Sol Beach  /  Dee":"El Mercado  /  Inés")+"’s score table";
      const visitor=save.courts.equipped===(beach?"mercado":"sol");
      const line=g.phase==="traffic"?"“We’ll check the ball in once the wheels are off the court.”":visitor?(beach?"“I know that shirt. Inés finally let one of hers leave the yard? Go on, show us.”":"“Sol Beach fourteen. Dee still ironing those numbers on herself? Let’s see your jumper.”"):
        h.wins>0?(beach?"“Good to see you, Fourteen. I kept your place in the book.”":"“Back for another envelope, Fourteen? Winner’s still out there.”"):
        beach?"“Got next? I’ll keep score. Feet outside that faded arc count for two.”":"“We play till the crates come in. First one to five gets the envelope.”";
      signedNote(b,line,beach?"Dee":"Inés");
      const match=makeButton("Call next against "+regular.name,"First to five. Clear the arc after a steal or a defensive rebound. Win "+cash(prize(g))+(h.wins?".":" and take home the court jersey."),"Play to 5",()=>startPickup(g,"match")),
        practice=makeButton("Shoot around",regular.short+" rebounds for you. X faces the hoop. Hold Space and release in the green band. G switches to a bank shot.","Five-shot rack",()=>startPickup(g,"practice"));
      match.disabled=practice.disabled=g.phase==="traffic";b.append(match,practice);
      if(h.makes||h.wins||h.losses){
        const ledger=document.createElement("p");ledger.className="statline";ledger.textContent=h.wins+" wins  /  "+h.losses+" losses  /  Best streak "+h.bestStreak+"  /  Longest make "+h.longest.toFixed(1)+" m";b.append(ledger);
      }
    }else if(next==="room-rack"){
      title="Clothes rail";kicker="Marlin Motel  /  Room 14";
      for(const [id,name,cloth] of [["street","Street shirt","Teal overshirt"],["sol","Sol Beach No. 14","Sea-green mesh and cream piping"],["mercado","Mercado No. 14","Wine-red mesh and gold piping"]]){
        const available=id==="street"||save.courts[id].wins>0,wearing=save.courts.equipped===id;
        const row=makeButton(name,available?cloth:"Win a pickup game at "+courts.find(g=>g.site.id===id).site.name+".",wearing?"Wearing":available?"Put on":"At the court",()=>{
          if(!available)return;save.courts.equipped=id;wearKit(id);persist();closePanel();note("Room 14",name,2);
        });row.disabled=!available||wearing;b.append(row);
      }
    }else if(next==="wheel-window"){
      title="Coast Wheel";kicker="North Boardwalk  /  Ticket window";
      signedNote(b,"“Javi keeps the spare ticket rolls in that red pouch. Last time we ran out, Len waited so long he ate his whole bag of taffy.”","Mags Duran");
      b.append(makeButton("One turn of the wheel","Walk up the wooden ramp to the turnstile. Press E at the gate.",wheelFare(),()=>clockPin({...coastGate,name:"Coast Wheel turnstile"})),
        makeButton("Last Bell Run","Ride alongside Javi on the promenade, take the pouch and bring it to my window.","$115 + rush tip",startBellRun));
      if(save.boardwalk.runs){
        const best=document.createElement("p");best.className="statline";best.textContent=save.boardwalk.runs+" ticket runs  /  "+Object.entries(save.boardwalk.best).map(([k,v])=>k+" "+watch(v)).join("  /  ");b.append(best);
      }
    }else if(next==="window-orders"){title="Window Seat";kicker="Cine Luna  /  Location department";windowBoard(b);
    }else if(next==="unit-sheet"||next==="unit-roll"){
      title=next==="unit-sheet"?"Second Unit":"Location prints";kicker="Cine Luna  /  Frankie Prado";scoutPanel(b,next==="unit-sheet");
    }else if(next==="umbrella"){
      title="Umbrella loan stand";kicker="Marlin Motel  /  Route 6";umbrellaPanel(b);
    }else if(next==="radio-desk"||next==="radio-sleeves"||next==="jobs"&&broadcastDesk.mix){
      title=next==="radio-sleeves"?"The request book":"Boardwalk broadcast";kicker="Sol FM  /  Ivo Vidal";radioDeskPanel(b,next==="radio-sleeves");
    }else if(next==="buttonwood"||next==="pot-book"||next==="jobs"&&active?.buttonwood){
      title=next==="pot-book"?"Alda’s tide book":next==="jobs"?"Pot Run":"Buttonwood Boat Works";kicker="Gantry Street  /  Pot landing";buttonwoodPanel(b,next);
    }else if(next==="brisas"||next==="brisas-book"||next==="jobs"&&active?.brisas){
      title=next==="brisas-book"?"The switch book":"Las Brisas";kicker="Marquee Street  /  Nico Paz";brisasPanel(b,next);
    }else if(["palm-table","palm-card","palm-local"].includes(next)||next==="jobs"&&active?.palm){
      title=next==="palm-card"?"The chalk card":next==="palm-local"?palm.byId[palmContactId].name:next==="jobs"?"At the Palm":"House table";
      kicker="Palm Diner  /  Ocean Drive";palmPanel(b,next);
    }else if(["motor-sales","motor-sticker","motor-bay","motor-titles"].includes(next)||next==="jobs"&&active?.gull){
      title=next==="motor-titles"?"Your garage":next==="jobs"?"A Second Opinion":next==="motor-sticker"&&gullSelection?formatVehicle(gullSelection):gullSite.name;kicker="Biscayne Street  /  Kitty Vega";gullPanel(b,next);
    }else if(next==="moto-shop"||next==="moto-prints"||next==="jobs"&&active?.moto){
      title=next==="moto-prints"?"The print window":next==="jobs"?"Second Seat":studio.name;kicker="Ocean Drive  /  Inés Vidal";motoPanel(b,next);
    }else if(next==="rescue-call"||next==="clinic-desk"||next==="jobs"&&active?.rescue){
      title=next==="clinic-desk"?clinic.name:"Rescue 4";kicker=next==="clinic-desk"?"Old Palms  /  Receiving":"Bay Rescue  /  "+rescue.call.place;
      rescuePanel(b,next);
    }else if(next==="air-desk"||next==="air-gate"){
      const atGate=next==="air-gate",s=atGate?airGate():airDesk();
      title=atGate?"Fern 3":s.name;kicker=atGate?s.name+"  /  Boarding step":"Pelican Air  /  "+clerk(s).name;
      airPanel(b,s,atGate);
    }else if(next==="air-book"){
      title="Signed mail";kicker="Pelican Air  /  Dispatch book";BayAirPost.ledger(b,save.airmail);
    }else if(next==="skate-spot"){
      const c=skateStand(),s=c.site,name=c.filmer.name,other=s.id==="sol"?"market":"sol";
      title=s.name;kicker="Curb Cut  /  "+name;
      signedNote(b,s.id==="sol"?"Luz rubbed a groove in that rail before the city ever set a bank here. Give me two different tricks and roll through the white stripe. I’ve got a fresh tape.":"Emi says the loading curb is better than anything the city built. Take the rail or the ledge. Keep rolling past the white stripe so I’ve got an ending.",name);
      const list=document.createElement("p");list.className="skate-shotlist";list.textContent=BaySkate.requests[s.id].map(q=>(save.skate.shots[s.id]&q.bit?"✓ ":"□ ")+q.name).join("   /   ");b.append(list);
      b.append(makeButton("Borrow a board",s.id==="sol"?"Seafern deck. Take it across town. K puts it down or picks it up.":"Tomato-red deck. Ride it home, or carry it onto Route 6.","Free",()=>{
        if(!skateStand())return;skate.carry(s.id);if(skate.rider)skate.rider.style=s.id;
        persist();closePanel();speak(name,"Take it with you. K when you want to ride.");}));
      b.append(makeButton("Film a line","Hold Space as you push, release at the yellow chalk marks, then tap G in the air."+(skate.request(s.id)?" Next shot on the list adds $40.":""),"Roll tape",()=>{
        if(!skateStand())return;skateTape.stop();skate.prep(s);if(skate.rider)skate.rider.style=s.id;
        skateJob(c);persist();closePanel();speak(name,"Chalk cross just here. Face down the rail. I’ll roll when you push.");}));
      if(save.skate.best[s.id]||save.skate.best[other]){
        const card=document.createElement("p");card.className="statline";card.textContent=skate.crew.map(q=>q.site.name+"  "+(save.skate.best[q.site.id]||"—")).join("  /  ");b.append(card);
      }
      if(skateReel)b.append(skateReelButton());
    }else if(next==="skate-reel"){
      title="Curb Cut";kicker="Hi8 dub  /  "+BaySkateFilm.title(skateReel.site);
      const canvas=document.createElement("canvas");canvas.width=480;canvas.height=270;canvas.className="skate-proof";
      canvas.setAttribute("aria-label","Moving footage of your best skateboard line");b.append(canvas);
      skateProof={canvas,start:performance.now()};BaySkateFilm.paint(canvas,skateReel,0);
      b.append(makeButton("Cine Luna","Your "+skateReel.score+"-point print is in the program. At the lobby case you can cue it for your seat.","Mark theater",()=>clockPin(BayCab.cinema)));
    }else if(next==="route-six"){
      const s=routeStop(),here=transit.docked(s);title="Ocean Loop";kicker="Bay Transit  /  Route 6  /  "+s.short;
      const board=document.createElement("p");board.className="statline";
      board.textContent=here?"Coach 608 · Front door open":"Coach 608 · "+Math.ceil(transit.distanceTo(s))+" m along the line";b.append(board);
      const nextStop=BayTransit.stops[(BayTransit.stops.indexOf(s)+1)%4];
      b.append(makeButton("Ride Route 6","Next stop, "+nextStop.short+". F pulls the cord. Marta will let you out through the back.","Free transfer",()=>chooseTransit(s,"rider")));
      b.append(makeButton("Take Marta’s wheel","Drive to the next marked stop. Line the front door up with the pole, brake, and press F to let people through.","Relief shift",()=>chooseTransit(s,"driver")));
      const walk={marlin:["Vera’s sign bench","At the foot of the Marlin stairs, just down the sidewalk.",neonPin],
        mercado:["Rosario’s counter","Under the market awning. Rosario serves after dusk.",BayMercadoArt.counter],
        port:["Portside Recovery","Della works out of the yard beside the green wrecker.",dispatchPin],
        luna:["Cine Luna box office","Walk south from the stop to the illuminated theater doors.",BayCab.cinema]}[s.id];
      b.append(makeButton(walk[0],walk[1],"Walk from here",()=>clockPin(walk[2])));
      if(s.id==="marlin"||s.id==="mercado"){
        const pin=skatePins[s.id==="marlin"?0:1];
        b.append(makeButton(pin.name,s.id==="marlin"?"Nia films at the bank across Ocean Drive.":"Teo keeps a spare deck behind the market.","Mark skate spot",()=>clockPin(pin)));
      }
      const points=document.createElement("div");points.className="transfer-stamps";points.setAttribute("aria-label","Your punched transfer");
      for(const q of BayTransit.stops){
        const mark=document.createElement("span"),punched=save.transit.stamps.includes(q.id);
        mark.className=punched?"punched":"";mark.textContent=q.short;mark.setAttribute("aria-label",q.short+(punched?", punched":", open"));points.append(mark);
      }
      b.append(points);
      if(save.transit.rides||save.transit.runs){const row=document.createElement("p");row.className="statline";
        const {rides,runs,best}=save.transit;
        row.textContent=rides+(rides===1?" ride":" rides")+"  /  "+runs+(runs===1?" signed trip":" signed trips")+(best[s.id]!=null?"  /  Best stop here "+best[s.id]+"%":"");b.append(row);}
    }else if(next==="neon-bench"){
      title="Vacancy in Lights";kicker="Marlin Neon Service  /  Vera Cordero";
      signedNote(b,"“The E’s been giving out since my dad ran this place. Take my tester up to the sign. I’ll watch the letters from the curb.”","Vera");
      for(const d of BayMarlinNeon.designs){
        const best=save.neon.best[d.id];b.append(makeButton(d.name,d.line+(best!=null?"  Best alignment "+best+"%.":""),"Work order · up to $165",()=>neonWork(d.id)));
      }
      for(const d of BayMarlinNeon.designs)if(Object.hasOwn(save.neon.best,d.id)){
        const btn=makeButton("Light "+d.name,"Run this signed pattern on both motel signs.",save.neon.program===d.id?"On the sign":"Switch on",()=>{
          if(neon.apply(d.id)){persist();closePanel();note("Marlin Motel",d.name+" is on the sign.",3);}
        });btn.disabled=save.neon.program===d.id;b.append(btn);
      }
    }else if(next==="bridge-house"){
      title="Salt Creek Drawbridge";kicker="Pelican Cut  /  Inez Soria";
      signedNote(b,"“My dad used to say count the stern, never the mast. The cars can wait another second.”","Inez");
      b.append(makeButton("Take the next watch","Press F when June Bug calls. Let the road clear, then hold Space to raise the span. Release the lever while she passes. Lower it with Space and reopen the road with F.","$95 + timing bonus",takeBridgeWatch));
      if(save.bridge.count){
        const log=document.createElement("p");log.className="statline";log.textContent="Keeper’s log  /  "+save.bridge.count+" signed"+(save.bridge.best==null?"":"  ·  Best response "+save.bridge.best.toFixed(1)+" s");b.append(log);
        for(const entry of save.bridge.log.slice().reverse()){
          const row=document.createElement("p");row.textContent="June Bug  ·  "+(entry.direction==="in"?"Ice up Salt Creek":"Empty totes to the bay")+"  ·  "+cash(entry.pay);b.append(row);
        }
      }
    }else if(next==="palma"){
      title="Palma Hand Wash";kicker="Ocean Drive  /  Elia Mena";
      signedNote(b,"“Salt hides under the doors. Walk round the back before you tell someone their car’s done.”","Elia");
      const v=car||inWashPad();
      if(v){
        const fee=save.palma.rinses?12:0;
        const clean=BayPalma.cleanEnough(v);
        const service=makeButton("Elia’s hand wash",clean?"The paint and glass are already clean.":"Stay parked on the open pad. Elia walks round the car and rinses all four panels.",fee?cash(fee):"First wash on us",()=>joinWash("attended"));
        const hose=makeButton("Take the blue hose","Step out and hold Space or the mouse button to wash the panel nearest you.","Self-service · Free",()=>joinWash("self"));
        service.disabled=clean||save.wallet<fee;hose.disabled=clean;b.append(service,hose);
      }
      if(!car)b.append(makeButton("Take a wash ticket","Wash a regular’s car in the covered bay. Hold Space to rinse each side, then walk to the driver for your pay.","Work a shift",()=>joinWash("shift")));
      if(!v)b.append(makeButton("Your car","Park on the striped open pad beside the covered bay, then press F for a wash.","Mark pad",()=>clockPin({...wash.site.publicBay,name:"Palma public rinse pad",kind:"car-wash"})));
      if(save.palma.orders){const s=document.createElement("p");s.className="statline";s.textContent=save.palma.orders+" paid washes  /  Best tip "+cash(Math.max(...Object.values(save.palma.tips)));b.append(s);}
    }else if(next==="june"){
      title="June Mora";kicker=band.june.state==="shell"?"North Boardwalk  /  Stage door":"Saltwater Sessions  /  Guitar";
      signedNote(b,save.juneReturned?"“Blue dot on the label, my brother on drums. You found the right tape. Come cut another one with us.”":"“Ben’s up at the Sound Shell tapping on anything with a rim. Come up there with me. You should hear what he’s doing to my song.”","June");
      if(!band.outing&&band.june.state!=="shell")b.append(makeButton("Head to the Sound Shell","Walk together or give June a lift up Ocean Drive.","Go with June",()=>inviteJune("shell")));
      if(band.june.state==="shell")b.append(makeButton("Find Ben’s set list","The open tape case is by the stage ramp.","Set waypoint",()=>clockPin(band.site.board)));
      if(save.band.shows&&!band.outing)b.append(makeButton("Take a drive with June","She knows a few places worth pulling over.","Go together",()=>inviteJune("drive")));
      if(band.outing)b.append(makeButton("Keep going together",band.instruction(car),"Resume",closePanel),makeButton("See you at the shell","June will make her own way.","Part ways",()=>{dropJob();closePanel();}));
    }else if(next==="set-list"){
      title="Saltwater Sessions";kicker="Sol Sound Shell  /  Set list";
      signedNote(b,band.june.state==="shell"?"“June’s on guitar. Lena’s got the bass. When I stand up, the sticks are yours.”":"“It’s an open rehearsal. Pull up to the kit when I get off. June’s usually at the Marlin before the evening set.”","Ben Mora");
      const controls=document.createElement("p");controls.textContent="Tap A for kick, S for snare and D for hi-hat as each diamond reaches the white line. A take of 55% or better earns a cut of the door and a cassette for your car.";b.append(controls);
      for(const song of BayShellScore.songs){
        const best=save.band.best[song.id],open=song.id==="jetty"||save.band.shows>0||save.juneReturned;
        const row=makeButton(song.name,open?song.bpm+" BPM  ·  "+(song.id==="jetty"?"Straight backbeat":"Syncopated backbeat")+(best?"  ·  Best "+best.score+"%":""):
          "Cut a first take or bring June her blue-dot demo.",""+(open?"Take the sticks":"Side B"),()=>beginSet(song.id));row.disabled=!open;b.append(row);
      }
    }else if(next==="valet-desk"){
      title="Marlin Motor Court";kicker="Valet stand  /  Tess Vidal";
      signedNote(b,"“See the brass letter on the tag? Same letter’s painted round back. Hang the key here. A claim check gets exactly one car.”","Tess");
      if(!valet.onDuty)b.append(makeButton("Take a valet shift","Park guests’ cars, then bring them back to this curb. Careful parking earns a tip.","Clock in",()=>{
        if(!atValet()||active)return;valet.clockIn();active={job:{id:"valet",name:"Marlin valet",by:"Tess Vidal"},valet:true};waypoint=null;closePanel();lastHud=lastMap=-10;
        speak("Tess Vidal","I’m right here if you need me. First guest pulls in just beyond the canopy.");
      }));
      else b.append(makeButton("Back to the curb",valet.instruction(car),"Resume",closePanel),makeButton("Give Tess the stand","Tess takes care of any cars still at the motel.","Clock out",()=>{dropJob();closePanel();}));
      for(const g of valet.guests){
        if(!save.valet.visits[g.id])continue;
        const row=document.createElement("p");row.className="statline";row.textContent=g.name+"  /  "+g.plate+"  ·  "+save.valet.visits[g.id]+" returned  ·  Best tip "+cash(save.valet.tips[g.id]);b.append(row);
      }
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
      title="A note from Rosario";kicker="Marlin Motel  /  Room 14";showDesk(b);if(printAvailable())b.append(airLedgerButton());
      for(const [id,master] of Object.entries(save.band.best))b.append(makeButton(BaySessions.byId(id).name,"Blue-dot cassette  ·  "+master.score+"%  ·  "+master.notes.length+" recorded strokes","Play tape",()=>cueTape(id)));
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
    }else if(next==="jobs"&&(airLine.aboard||airLine.reserved||active?.airmail)){
      title="Pelican Air";kicker="Fern 3  /  Dispatch";
      if(airLine.mailTo)b.append(makeButton(airLine.leaflet()[0],"Bring the sealed pouch to "+clerk(airLine.mailTo).name+" at "+airLine.mailTo.name+".","Resume",closePanel));
      else b.append(makeButton(airLine.aboard?"Flying with Nani":"Seat at the float","E boards or steps off at the dock. G swaps the controls in flight.","Return",closePanel));
      if(printAvailable())b.append(airLedgerButton());
      if(airLine.reserved)b.append(makeButton("Release your seat","Nani can resume her regular schedule.","Cancel seat",()=>{airLine.reserved=null;closePanel();}));
      if(active?.airmail)b.append(makeButton("Return the pouch","Release this dispatch back to its post office.","Drop job",()=>{dropJob();closePanel();}));
    }else if(next==="jobs"&&windowRide){const r=windowRide;title=r.brief.title;kicker="Window Seat  /  Cine Luna";
      b.append(makeButton(r.brief.subject,r.best?"Best this run · "+r.best.score+"/100":"Take the passenger seat and frame it while the wheels are turning.","Resume",closePanel));
      if(!r.held)b.append(makeButton("Call off the pickup","Your partner will keep the car where it is.","Cancel",()=>{endWindowRide();closePanel();}));
      else if(r.phase==="ride"||r.phase==="park")b.append(makeButton("Let me out","Step out at a clear curb.","Pull over",()=>{closePanel();windowInput("KeyE");}));
    }else if(next==="jobs"&&transit.engaged){
      title="Route 6";kicker="Bay Transit  /  Coach 608";
      b.append(makeButton(transit.flag?"Waiting at "+transit.flag.s.short:"Next · "+transit.target.short,"Marlin Motel, El Mercado, Port Sol, Cine Luna.","Return",closePanel));
      b.append(makeButton(transit.flag?"Leave the stop":transit.shift?"Hand back the wheel":"Get off at the next stop",transit.shift?"Stop with space for the front door. Marta will take over.":"Marta works the full Ocean Loop.","Choose",()=>{
        closePanel();if(transit.flag)transit.cancelFlag();else transit.wantOut(transitEnv);lastHud=-10;}));
    }else if(next==="jobs"&&pickup){
      title=pickup.site.name;kicker="Courtside";
      b.append(makeButton("Back to the court","Resume this possession.","Keep playing",closePanel),
        makeButton("Step off","Leave the ball with the locals.","Leave",()=>{closePanel();leavePickup();}));
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
      }else if(cycles.riding||skate.rider||boardwalk.player){
        for(const j of jobs){const site=jobSites.find(s=>s.id===j.id)||shorePins[0];b.append(makeButton(j.name,j.by+"  ·  "+site.name,"Set waypoint",()=>clockPin(site)));}
      }else for(const j of jobs)b.append(makeButton(j.name,j.by+"  ·  "+j.desc,j.id==="ferry"?"$450–900":j.id==="exposure"?"$300–425":j.id==="regatta"?"Race desk":cash(j.pay)+(["fare","dash"].includes(j.id)?"+":""),()=>startJob(j.id),j.id==="exposure"||j.id==="ferry"?"jobcard story-job":"jobcard"));
      if(!active&&!watchCrew.towing){
        b.append(makeButton("Pelican Air · Marlin Air Dock","Milo sorts the island mail on the sand east of the Marlin Motel.","Set waypoint",()=>clockPin(airPins[0])));
        b.append(makeButton("Sol Sound Shell","Ben’s set list beside the North Boardwalk stage.","Set waypoint",()=>clockPin(band.site.board)));
        b.append(makeButton("Palma Hand Wash","Elia’s wash bays on Ocean Drive, south of the Marlin.","Set waypoint",()=>clockPin(washPin)));
        b.append(makeButton("Salt Creek Drawbridge","Inez keeps the bridge on Pelican Causeway. Look for the keeper’s house on the south bank.","Set waypoint",()=>clockPin(bridgeSite)));
        b.append(makeButton("Marlin Neon Service","Vera’s workbench sits at the foot of the motel stairs on Ocean Drive.","Set waypoint",()=>clockPin(neonPin)));
        for(const [i,pin] of skatePins.entries())b.append(makeButton(pin.name,skate.crew[i].filmer.name+" keeps a board beside the filming bench.","Set waypoint",()=>clockPin(pin)));
        const localStop=BayTransit.stops.reduce((a,b)=>dist(pos(),a)<dist(pos(),b)?a:b);
        b.append(makeButton("Route 6 · Ocean Loop","Marta Leal’s bus serves four neighborhoods. Nearest stop · "+localStop.short,"Set waypoint",()=>clockPin(localStop)));
        if(save.band.met)b.append(makeButton("June Mora",band.june.state==="shell"?"At the Sound Shell.":"Find June on her route.","Set waypoint",()=>clockPin({x:band.june.x,z:band.june.z,kind:"june",id:"june",name:"June Mora"})));
      }
      if(car)for(const [id,master] of Object.entries(save.band.best))b.append(makeButton(BaySessions.byId(id).name,"Your Sound Shell recording  ·  "+master.score+"%","Play in car",()=>cueTape(id)));
      if(Object.keys(motos.prints).length)b.append(makeButton("Coast Camera prints","Your photographs from Second Seat.","Open prints",()=>openPanel("moto-prints")));
      if(skateReel)b.append(skateReelButton());if(printAvailable())b.append(airLedgerButton());
      if(unit.met)b.prepend(makeButton("Second Unit · "+BaySecondUnit.names[unit.other],"Call for a Window Seat shoot, find your partner or browse your prints.","Call sheet",()=>openPanel("unit-sheet")));
      if(save.edition)b.append(makeButton("Bay Wire",BayExposure.routes[save.edition].headline,"Read edition",()=>openPanel("edition")));
      if(save.meet.cover)b.append(makeButton("Bay Wire · Night edition","Your photograph from Cine Luna.","Read cover",()=>openPanel("meet-cover")));
      if(!active&&!watchCrew.towing)b.append(makeButton("Rosario León","Night counter at El Mercado. Serving from 6 PM to 2 AM.","Set waypoint",()=>clockPin(BayMercadoArt.counter)),
        makeButton("Kit Bell · Sol FM","Find the field producer at the fish camp, north of Ocean Drive.","Set waypoint",()=>clockPin(BayCut.station)),
        makeButton("Tali Moreno","The striped lifeguard tower across from the Marlin. The lost-and-found board faces the bay.","Set waypoint",()=>clockPin(BaySurfPatrol.tower)),
        makeButton("Tess Vidal · Marlin valet","The key stand on the motel side of Ocean Drive.","Set waypoint",()=>clockPin(BayValetPlaces.desk)),
        makeButton("Della Moss · Portside Recovery","Find Della at the workbench beside the green wrecker.","Set waypoint",()=>clockPin(dispatchPin)),
        makeButton("Javi Reyes · Boardwalk bicycles","Find a beach cruiser. Javi rides between the Marlin and the Coast Wheel.","Locate bike",()=>clockPin(cycles.nearest(pos()))),
        makeButton("Mags Duran · Coast Wheel","Her ticket window is beside the North Boardwalk ramp.","Set waypoint",()=>clockPin(ticketWindow)));
      if(!active&&!watchCrew.towing)for(const pin of courtPins)b.append(makeButton(pin.name,pin.id==="sol"?"Dee keeps score by the beach.":"Ask Inés who has next behind El Mercado.","Set waypoint",()=>clockPin(pin)));
      if(Object.keys(save.fieldReels).length)b.append(makeButton("Field tape library","Best takes you’ve filed with Sol FM.","Listen",()=>openPanel("field-archive")));
      if(works.saved.seen)b.append(makeButton("Alda’s tide book","Landing tickets, catch totals and the location of the rig.","Read",()=>openPanel("pot-book")));
      if(save.brisas.seen)b.append(makeButton("Las Brisas switch book","Your cards, boulevard rolls and the plum Solena.","Read",()=>openPanel("brisas-book")));
      if(save.airwaves.met)b.append(makeButton("Sol FM request book","Your Boardwalk mixes and the studio van.","Read",()=>openPanel("radio-sleeves")));
      if(save.palm.seen)b.append(makeButton("Palm Diner house card","Your results, unfinished rack and the regulars’ numbers.","Read",()=>openPanel("palm-card")));
      if(save.gull.met||save.gull.titles.length)b.append(makeButton("Gull Street Motors","Your titles, signed road sheets and parked cars.","Key ring",()=>openPanel("motor-titles")));
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
      const parkedBikes=cycles.bikes.filter(b=>!b.rider),titlePins=gull.pins().filter(p=>p.v!==car);
      const countyStops=[bridgeSite,BayDrawbridge.mouth,BayDrawbridge.iceDock,BayCut.station,...BayCutWildlife.sources.map(s=>s.site),skiff?landings[2]:shorePins[2],cutGate,...parkedBikes.filter(b=>BayCut.area(b))];
      const ranks=Object.values(BayCab.stops).map(s=>({...s.stand,name:"Bay Cab · "+s.name}));
      const places=chartMode==="cut"?countyStops.concat(titlePins.filter(p=>BayCut.area(p)),ownPin&&BayCut.area(ownPin)?[ownPin]:[]):chartMode==="city"?locations.filter(p=>!BayCut.area(p)).concat(titlePins.filter(p=>!BayCut.area(p)),jobPins,ranks,[BayMotelParking.bay,cutGate],parkedBikes.filter(b=>!BayCut.area(b)),ownPin?[ownPin]:[],save.stunt?[BayTakePoster.place]:[]):[...airPins,...landings,{x:bay.beacon.x+11,z:bay.beacon.z,name:"Gull Light"}];
      places.forEach((v,i)=>{const opt=document.createElement("option");opt.value=i;opt.textContent=v.name;list.append(opt);});list.disabled=!!active||!!pickup||!!cabs.booking||watchCrew.towing;
      list.onchange=()=>{if(list.value!==""){waypoint={...places[Number(list.value)]};closePanel();note("Map pin",waypoint.name,2);}};
      b.append(list);c.addEventListener("click",ev=>{if(active||pickup||cabs.booking||watchCrew.towing)return;const rect=c.getBoundingClientRect(),frame=atlasFrame(),scale=c.width/frame.span;
        const mx=(ev.clientX-rect.left)/rect.width*c.width,my=(ev.clientY-rect.top)/rect.height*c.height;
        const wx=frame.cx+(mx-c.width/2)/scale,wz=frame.cz+(c.height/2-my)/scale;
        const pin={x:clamp(wx,-181,207),z:clamp(wz,-179,179)};
        const nearDock=bay.docks.find(d=>Math.hypot((chartMode==="bay"?d.x:d.footX+1.4)-wx,d.z-wz)<11);
        const court=courts.find(g=>Math.hypot(g.site.x-wx,g.site.z-wz)<6);
        const venue=court?courtPins[courts.indexOf(court)]:Math.hypot(wx-recoveryYard.drop.x,wz-recoveryYard.drop.z)<4?dispatchPin:locations.find(p=>["room","counter","surf-tower","theater","recovery-desk","wheel-window","bike-rack","pickup-court","valet-stand","sound-shell","skate-spot","bus-stop","air-dock","clinic","camera-shop","motor-sales","boatyard","public-slip","radio-booth"].includes(p.kind)&&Math.hypot(p.x-wx,p.z-wz)<4)||ranks.find(p=>Math.hypot(p.x-wx,p.z-wz)<4.5);
        const bike=parkedBikes.find(b=>Math.hypot(b.x-wx,b.z-wz)<2.3);
        let jobPin=null,hitRadius=6;
        for(const site of jobPins){const gap=Math.hypot(site.x-wx,site.z-wz);if(gap<hitRadius){jobPin=site;hitRadius=gap;}}
        if(nearDock)waypoint={...(skiff||chartMode==="bay"?landings[bay.docks.indexOf(nearDock)]:shorePins[bay.docks.indexOf(nearDock)])};
        else if(ownPin&&Math.hypot(ownPin.x-wx,ownPin.z-wz)<4)waypoint={...ownPin};
        else if(bike)waypoint={...bike};
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
      allControls.push(["Y / P","Switch characters / Frankie’s camera"],["U / G","Umbrella stand or fold / share and walk alongside"],["Z / I","Driving view / wipers"],["[ / ]","Previous / next radio station"],["R","Toggle all sound"]);
      allControls.push([", / .","Left / right turn signal"]);
      allControls.push(["Space","Vault a hood or pull up at a low ledge"],["F · W/S · E","Grip a ladder, climb, let go"]);
      for(const [key,text] of allControls){const span=document.createElement("span"),k=document.createElement("kbd");k.textContent=key;span.append(k,document.createTextNode(text));keysList.append(span);}b.append(keysList);
      b.append(makeButton("Back to the city","Resume free roam or your current job.","Resume",closePanel));
      const gfx=makeButton("Camera view",!view.gl||view.lost?"Lightweight overhead rendering is active.":"Third-person street view or the overhead map.",isTop()?"Overhead":"Street",()=>{manualTop=!manualTop;if(manualTop)motos.cockpit=false;saveCamera();openPanel("pause",true);});gfx.disabled=!view.gl||view.lost;
      const assist=makeButton("Driving camera",cameraRig.assist?"Eases toward the road after you look around.":"Holds your mouse direction. Press X to face the road.",cameraRig.assist?"Follow":"Free look",()=>{cameraRig.assist=!cameraRig.assist;saveCamera();openPanel("pause",true);});
      const sensitivity=makeButton("Mouse sensitivity","Adjust horizontal and vertical look speed.",cameraRig.sensitivity<1?"Low":cameraRig.sensitivity>1?"High":"Normal",()=>{cameraRig.sensitivity=cameraRig.sensitivity===1?1.38:(cameraRig.sensitivity>1 ? .72 : 1);saveCamera();openPanel("pause",true);});
      b.append(gfx,assist,sensitivity,radioButton());
    }
    $("panelTitle").textContent=title;$("panelKicker").textContent=kicker;
  }
  $("play").addEventListener("click",playStart);$("closePanel").addEventListener("click",closePanel);$("shade").addEventListener("click",closePanel);
  $("jobKey").onclick=()=>openPanel("jobs");$("miniButton").onclick=()=>openPanel("map");$("pauseKey").onclick=()=>openPanel("pause");
  $("dialKey").onclick=()=>{tuneRadio(1);document.activeElement?.blur();};
  $("audioKey").onclick=()=>{radioToggle();document.activeElement?.blur();};
  $("dashRetry").onclick=()=>{retryDash();document.activeElement?.blur();};
  const pointer={x:null,y:null,edgeX:0};
  const lookSurface=()=>isTop()?$("overhead"):$("world");
  function resetPointer(){pointer.x=null;pointer.y=null;pointer.edgeX=0;}
  document.addEventListener("mousemove",e=>{
    if(!play||panel||document.hidden)return;
    if(e.target!==lookSurface()){resetPointer();return;}
    const dx=pointer.x===null?0:e.clientX-pointer.x,dy=pointer.y===null?0:e.clientY-pointer.y;
    pointer.x=e.clientX;pointer.y=e.clientY;
    // Edge turning allows a full orbit with the pointer free to leave the window.
    const edge=18;pointer.edgeX=e.clientX<edge?-(1-e.clientX/edge):e.clientX>innerWidth-edge?1-(innerWidth-e.clientX)/edge:0;
    if(unit.eye){scoutLook(dx*.003*cameraRig.sensitivity,-dy*.0026*cameraRig.sensitivity);return;}
    if(palmPointer(e))return;
    if(broadcastDesk.mix&&!broadcastDesk.approach){const m=broadcastDesk.mix;m.pan+=clamp(dx,-240,240)*.0035*cameraRig.sensitivity;
      m.tilt=clamp(m.tilt+dy*.003*cameraRig.sensitivity,-.54,.83);return;}
    if(motos.finder||motos.cockpit){motos.look(clamp(dx,-220,220)*.0028*cameraRig.sensitivity,-clamp(dy,-150,150)*.0024*cameraRig.sensitivity);}
    else if(airCockpit()){
      airLine.pan=clamp(airLine.pan+clamp(dx,-240,240)*.00325*cameraRig.sensitivity,-2.03,2.03);
      airLine.tilt=clamp(airLine.tilt-clamp(dy,-180,180)*.0027*cameraRig.sensitivity,-.77,.68);
    }else if(band.take){
      band.pan=clamp((band.pan||0)+dx*.0027*cameraRig.sensitivity,-.73,.72);
      band.tilt=clamp((band.tilt||0)-dy*.0035*cameraRig.sensitivity,-.55,.84);
    }else if(boardwalk.player?.phase==="ride"){
      boardwalk.pan+=clamp(dx,-240,240)*.00325*cameraRig.sensitivity;
      boardwalk.tilt=clamp(boardwalk.tilt-clamp(dy,-160,160)*.00265*cameraRig.sensitivity,-1.13,.82);
    }else if(busCameras()){
      transit.pan=clamp(transit.pan+clamp(dx,-240,240)*.00325*cameraRig.sensitivity,-2.24,2.24);
      transit.tilt=clamp(transit.tilt-clamp(dy,-160,160)*.00255*cameraRig.sensitivity,-.70,.61);
    }else if(cabWindow()){
      const b=cabs.booking;b.pan=clamp(b.pan+clamp(dx,-240,240)*.00325*cameraRig.sensitivity,-1.82,1.65);
      b.tilt=clamp(b.tilt-clamp(dy,-160,160)*.00255*cameraRig.sensitivity,-.62,.49);
    }else if(works.line?.close){works.line.look+=dx*.0045*cameraRig.sensitivity;works.line.elevation=clamp(works.line.elevation+dy*.0032,.04,1.1);}
    else if(insideSeat()&&!isTop())driverSeat.look(dx,dy,cameraRig.sensitivity);
    else if(room?.kind==="cinema")BayCineRoom.look(room,dx*cameraRig.sensitivity,dy*cameraRig.sensitivity);
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
    if(unit.eye){unit.eye.zoom=clamp(unit.eye.zoom-e.deltaY*.0018,1,3.4);return;}
    if(motos.finder){motos.zoom=clamp(motos.zoom-e.deltaY*.0018,.92,3.4);return;}
    const units=e.deltaY*(e.deltaMode===1?15:e.deltaMode===2?innerHeight:1);cameraRig.changeZoom(clamp(units*.0015,-.17,.17));saveCamera();
  }
  for(const canvas of [$("world"),$("overhead")]){
    canvas.addEventListener("mouseleave",resetPointer);
    canvas.addEventListener("click",()=>{if(palm.match)return;if(unit.eye)unit.eye.fire=true;else if(motos.finder)motos.captureRequest=true;else shutter();});
    canvas.addEventListener("wheel",zoomWheel,{passive:false});
  }
  $("world").addEventListener("webglcontextlost",resetPointer);
  const handled=new Set(["BracketLeft","BracketRight","KeyK","KeyW","KeyA","KeyS","KeyD","ArrowUp","ArrowLeft","ArrowDown","ArrowRight","Space","KeyE","KeyF","KeyG","KeyH","KeyT","KeyV","KeyX","KeyQ","KeyC","KeyM","KeyJ","KeyR","KeyB","Equal","Minus","NumpadAdd","NumpadSubtract","Escape","Enter","ShiftLeft","ShiftRight"]);
  for(const code of ["KeyZ","KeyI","KeyU","KeyY","KeyP","Comma","Period"])handled.add(code);
  document.addEventListener("mousedown",e=>{if(e.button===0&&!panel&&e.target===lookSurface()&&palmPointer(e,true))return;if(e.button===0&&!panel&&e.target===lookSurface()&&wash.hasWand()&&onStreetFeet())hoseButton=true;});
  addEventListener("mouseup",()=>{hoseButton=false;if(!panel&&palm.match?.draw!=null)palm.release(palmEnv);});
  addEventListener("keydown",ev=>{
    if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
    if(!play){if(ev.code==="Enter"&&!ev.repeat){ev.preventDefault();playStart();}return;}
    if(panel){
      if(panel==="take-result"&&ev.code==="KeyT"&&!ev.repeat){ev.preventDefault();startTake();return;}
      if((ev.code==="Escape"||ev.code==="KeyM"||ev.code==="KeyJ")&&!ev.repeat){ev.preventDefault();if(ev.code==="Escape"){closePanel();}else openPanel(ev.code==="KeyM"?"map":"jobs");return;}
      if(ev.code==="Tab"){const controls=[...$("panel").querySelectorAll("button:not(:disabled),select:not(:disabled),[tabindex='0']")];if(!controls.length)return;
        if((ev.shiftKey&&document.activeElement===controls[0])||(!ev.shiftKey&&document.activeElement===controls.at(-1))){ev.preventDefault();controls[ev.shiftKey?controls.length-1:0].focus();}}
      return;
    }
    if(!handled.has(ev.code)&&!(palm.match&&/^Digit[1-6]$/.test(ev.code))&&!(car?.hydraulic&&/^(Digit|Numpad)[1-4]$/.test(ev.code)))return;
    if((ev.code==="Enter"||ev.code==="Space")&&document.activeElement?.matches("button"))return;
    ev.preventDefault();keys.add(ev.code);if(ev.repeat)return;
    if(ev.code==="KeyF"&&!unit.eye&&!unit.transition&&!windowRide&&byCinema()&&!crewDeskNear()){cabAction();return;}
    if(crewKeys(ev.code)||umbrellaKey(ev.code)||radioKeys(ev.code)||buttonwoodKey(ev.code)||brisasKeys(ev.code)||palmInput(ev.code)||gullKeys(ev.code)||motoKeys(ev.code)||rescueKeys(ev.code)||airKeys(ev.code)||skateKeys(ev.code)||transitKeys(ev.code))return;
    if(neon.testing){
      if(ev.code==="KeyE"){neon.pocket();motion.handTarget=null;lastHud=-10;return;}
      if(ev.code==="KeyV"){neon.view=1-neon.view;return;}
      if(["Space","KeyF","KeyG","KeyH","KeyA","KeyD","ArrowLeft","ArrowRight"].includes(ev.code))return;
    }
    if(roofs.action){
      if(ev.code==="KeyE"){roofs.release(hero,roofEnv);lastHud=-10;return;}
      if(["KeyF","Space","KeyH","KeyT","KeyG"].includes(ev.code))return;
    }
    if(ev.code==="KeyF"&&canTraverse()&&roofs.grab(hero,roofs.ladderAt(hero))){lastHud=-10;return;}
    if(ev.code==="KeyF"&&neonAction())return;
    if(ev.code==="Space"&&canTraverse()){
      const ledge=roofs.ledgeAt(hero);if(ledge){roofs.mantle(hero,ledge);lastHud=-10;return;}
      const over=roofs.vaultAt(hero,roofEnv);if(over){roofs.vault(hero,over,roofEnv);lastHud=-10;return;}
    }
    if(roofs.raised&&["KeyF","KeyE","KeyH","KeyG","KeyT"].includes(ev.code))return;
    if(ev.code==="KeyZ"&&canUseSeat()){
      driverSeat.enabled=!driverSeat.enabled;driverSeat.center();driverSeat.mirrorAt=-Infinity;
      cameraRig.reset(car);saveCamera();lastHud=-10;
      note(formatVehicle(car),driverSeat.enabled?(isTop()?"Dashboard instruments":"Driver’s seat  ·  Mouse to look   X to center"):"Chase camera",2.6);return;
    }
    if(ev.code==="KeyI"&&canUseSeat()){const mode=driverSeat.changeWipers();saveCamera();note("Windshield wipers",mode==="auto"?"Rain sensing":mode==="on"?"Continuous":"Parked",1.7);return;}
    if((ev.code==="Comma"||ev.code==="Period")&&canUseSeat()){
      const side=ev.code==="Comma"?-1:1;
      car.indicator=car.indicator===side?0:side;car.signalFrom=car.yaw;car.signalTurned=false;return;
    }
    if(ev.code==="KeyX"&&insideSeat()&&!isTop()){driverSeat.center();return;}
    if(ev.code==="Space"&&active?.bridge&&atBridge())return;
    if(ev.code==="KeyF"&&!transfer&&!deckStep&&bridgeAction())return;
    if(ev.code==="Space"&&active?.wash&&wash.hasWand()&&!car)return;
    if(ev.code==="KeyF"&&!transfer&&!deckStep&&washAction())return;
    if(band.take){
      const pad=["KeyA","KeyS","KeyD"].indexOf(ev.code);
      if(pad>=0)band.drum(pad,bandEnv);
      else if(ev.code==="KeyT")band.retake();
      else if(ev.code==="KeyE")band.take.phase="leave";
      else if(ev.code==="KeyV"){kitCam=1-kitCam;band.pan=band.tilt=0;}
      else if(ev.code==="KeyR")radioToggle();else if(ev.code==="Escape")openPanel("pause");
      return;
    }
    if(ev.code==="KeyB"&&bandEnv.deck()){cycleTape();return;}
    if(room){
      if(ev.code==="KeyF")useRoom();
      else if(ev.code==="KeyX"){room.yaw=0;room.pitch=-.09;}
      else if(ev.code==="KeyM")openPanel("map");
      else if(ev.code==="KeyJ")openPanel("jobs");
      else if(ev.code==="KeyR")radioToggle();
      else if(ev.code==="Escape")openPanel("pause");
      return;
    }
    if(pickup){
      if(ev.code==="Space"){pickup.shootKey();return;}
      if(ev.code==="KeyF"){if(pickup.phase==="result")startPickup(pickup,"match");else pickup.fKey();return;}
      if(ev.code==="KeyG"){pickup.glass=!pickup.glass;pickup.say(pickup.glass?"Aim off the glass":"Aim for the rim",1.35);return;}
      if(ev.code==="KeyE"){leavePickup();return;}
      if(ev.code==="KeyX"){squareUp(pickup);return;}
      if(ev.code==="KeyT"||ev.code==="KeyH")return;
    }
    if(ev.code==="KeyF"&&courtAtLine()){openPanel("court-line");return;}
    if(cabs.booking?.stage==="ride"&&ev.code==="KeyF"&&!isTop()){
      const b=cabs.booking;b.window=!b.window;b.pan=.12;b.tilt=-.10;lastHud=-10;return;
    }
    if(cabWindow()&&ev.code==="KeyX"){cabs.booking.pan=.12;cabs.booking.tilt=-.10;return;}
    if(cabs.playerHeld&&["Space","KeyF","KeyH","KeyT","KeyG"].includes(ev.code))return;
    if(boardwalk.player){
      if(ev.code==="KeyV"&&boardwalk.player.phase==="ride"){boardwalk.outside=!boardwalk.outside;lastHud=-10;return;}
      if(ev.code==="KeyX"){boardwalk.pan=Math.PI*.43;boardwalk.tilt=-.18;return;}
      if(["Space","KeyF","KeyH","KeyT","KeyG"].includes(ev.code))return;
    }
    if(ev.code==="KeyF"&&!transfer&&!deckStep&&(bandAction()||valetAction()||boardwalkAction()))return;
    if(exchangingKey()&&["Space","KeyE","KeyH","KeyG","KeyF"].includes(ev.code))return;
    if(cycles.riding){
      if(ev.code==="Space"){cycles.hop();return;}
      if(ev.code==="KeyH"){ringBikeBell();return;}
      if(["KeyG","KeyT"].includes(ev.code))return;
    }
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
      else if(!skiff&&[BayCut.dock,BayDrawbridge.iceDock].includes(bay.landing(hero.x,hero.z)))talk();
      else if(skiff||bay.landing(hero.x,hero.z)){if(!active?.regatta&&!active?.ferry)openRaceSheet();}
      else talk();
    }
    else if(["Equal","NumpadAdd","Minus","NumpadSubtract"].includes(ev.code)){cameraRig.changeZoom(["Equal","NumpadAdd"].includes(ev.code)?-.12:.12);saveCamera();}
  });
  addEventListener("keyup",ev=>{
    keys.delete(ev.code);if(/^(Digit|Numpad)[1-4]$/.test(ev.code))club.release(Number(ev.code.at(-1))-1);
    if(ev.code==="Space"&&palm.match&&!panel)palm.release(palmEnv);
    if(ev.code==="Space"&&skate.rider&&!panel)skate.pop(skateEvent);
    if(ev.code==="Space"&&pickup&&!panel)pickup.releaseHuman(cameraRig.yaw);
  });
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
    const raw=Math.max(0,(now-last)/1000),dt=clamp(raw,0,.10)*(transit.waitFast&&!panel?4:1);last=now;
    if(!panel)streetTime+=dt;
    if(!play){traffic(dt);motion.step(dt,0,0);}
    if(play&&!panel){
      elapsed+=dt;hours.step(dt);if(hours.total-savedAt>=20)saveTime();
      bumpLock=Math.max(0,bumpLock-dt);
      // Small steps keep steering and collision response consistent on slower hardware.
      let left=dt;while(left>.00001&&!panel){
        const d=Math.min(left,motos.bike||car||skiff||cycles.riding||skate.rider||pickup||active?.take?1/60:1/45);
        radioStep(d);stepButtonwood(d);stepBridge(d);stepNeon(d);stepAir(d);stepRescue(d);brisasStep(d);palmUpdate(d);gull.step(d,gullEnv);stepMotorcycles(d);stepSkate(d);transit.step(d,transitEnv);
        const onBoardwalk=!!(boardwalk.player||cycles.riding);stepCourts(d);boardwalkStep(d);
        if(car!==wrecker&&tow.busy)tow.step(d,towClear,recoveryEvent);
        if(room){walkRoom(d);traffic(d);bandSteps(d);cabs.step(d,cabEnvironment,cabEvent);recovery.step(d,recoveryEnv,recoveryEvent);stepBeach(d);left-=d;continue;}
        if(active?.take)stepTake(d);else if(deckStep)stepLanding(d);else if(transfer)stepTransfer(d);
        else if(swim)swimStep(d);
        else if(car){if(car!==meet.jules&&!(active?.meet&&meet.phase==="countdown"))drive(d,!!unit.transition);}
        else if(!unit.transition&&!unit.eye&&!windowRide?.held&&!broadcastDesk.mix&&!palm.match&&!palm.playerSeat&&!gull.exchange&&!motos.player&&!motos.job?.swapping&&!rescue.holding&&!airLine.aboard&&!skate.rider&&!transit.engaged&&!band.take&&!pickup&&!onBoardwalk&&!cabs.playerHeld&&!skiff&&!listening()&&!exchangingKey())walk(d);
        stepWater(d);traffic(d);bandSteps(d);cabs.step(d,cabEnvironment,cabEvent);
        if(windowRide)windowRide.step(d,windowEnv,windowRideEvent);recovery.step(d,recoveryEnv,recoveryEvent);pursuit(d);stepMeet(d);advanceJob(d);serviceGarage(d);stepBeach(d);left-=d;
      }
      if(!pickup&&!room&&!boardwalk.player&&!cabs.playerHeld&&!windowRide?.held&&!swim&&!active?.take&&!transfer&&!skiff&&!deckStep)checkTapes();const p=pos(),speed=Math.abs(active?.take?.subject().speed??(transit.aboard?transit.bus.speed:null)??motos.bike?.speed??skiff?.speed??car?.speed??(windowRide?.held?windowRide.vehicle.speed:cabs.playerHeld?taxi.speed:0));
      if(!panel){crewStep(dt);stepUmbrella(dt);updateRadio();stepField(dt);}
      for(const v of cars)BayPalma.weatherCar(v,dt,hours.wet);
      if(car)driverSeat.wipers(car,dt,Math.max(hours.rain,glassWater()));
      const spray=wash.spraying&&!room&&!swim?.underwater&&wash.target,sprayRange=spray?dist(p,spray):Infinity;
      const heading=isTop()?cameraRig.yaw:cam.yaw;
      sound.update({rain:room||swim?.underwater?0:hours.rain,canopy:rainWalk.amount,radioProgram:broadcastDesk.signal,speed,dealerEngine:car?.stockId?car:null,motorcycle:motos.bike,driving:!!motos.bike||!!windowRide?.held||transit.aboard||!!active?.take||!!car||!!skiff,boating:!!skiff,swimming:!!swim,depth:swim?.depth||0,stroke:swim?.pace||0,field:fieldSignal(),shell:broadcastDesk.mix?null:band.audio(dt,p,bandEnv),heat,siren:heat?clamp(1-chase.closestUnit/103,0,1):0,time:elapsed,coast:clamp((p.x-100)/93,0,1),
        washSpray:clamp(1-sprayRange/26,0,1)**1.4,washPan:spray?clamp(((spray.x-p.x)*Math.cos(heading)-(spray.z-p.z)*Math.sin(heading))/Math.max(4,sprayRange),-.9,.9):0,
        wiper:car?.wiper||0,inCabin:insideSeat()||busCameras(),bridge:room?null:{phase:bridge.phase,lift:bridge.lift,gates:bridge.gates,distance:dist(p,BayDrawbridge.center)},
        rescueLevel:unit4.responseLights&&!room?clamp(1-dist(p,unit4)/98,0,1):0,
        floatEngine:room?0:airLine.plane.engine*clamp(1-Math.hypot(p.x-airLine.plane.x,(p.y||0)-airLine.plane.y,p.z-airLine.plane.z)/98,0,1),floatThrottle:airLine.plane.throttle,
        rotor:backup.air?backup.air.light*clamp(1-Math.hypot(backup.air.x-p.x,backup.air.y,backup.air.z-p.z)/110,0,1):0,
        docks:clamp(1-Math.hypot(p.x+142,p.z+76)/94,0,1),skid:car?.slip||0});
      if(broadcastDesk.mix&&!broadcastDesk.approach&&!panel)BayAirwavesDial.decks($("boothMeter"),broadcastDesk.mix);
      if(pickup)courtMeter();
      if(band.take)drumHud();
      if(elapsed-lastHud>.10){hud();lastHud=elapsed;}if(elapsed-lastMap>.09){drawMini();lastMap=elapsed;}
    }
    if(panel&&now-lastMenuPaint<(skateProof?120:300))return;lastMenuPaint=now;
    tuneStreetResolution(raw,play&&!panel&&!isTop());
    renderWorld(dt,streetTime);
    if(!panel&&skateTape.active)skateTape.sample(streetTime,lookSurface(),isTop()?null:$("sky"));
    if(skateProof)BaySkateFilm.paint(skateProof.canvas,skateReel,(now-skateProof.start)/1000);
  }
  // Show a first frame before the browser schedules its animation loop.
  renderWorld(1/60,0);requestAnimationFrame(tick);
})();
