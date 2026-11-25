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
  const jumps=BayPictureJumps;
  const carbon=BayCarbonCopies,tireCloud=[];let puffAt=-10,puffId=0,copySide="left";
  BayPictureJumpArt.build(cityMesh,jumps.sites);
  const rideScenery=new BayRideFilm.Scenery(cityMesh.vertices);
  view.add("city",cityMesh);cityMesh.vertices.length=0;view.add("bay-water",waterMesh);waterMesh.vertices.length=0;
  const gullSite=BayGullMotors.site,palmSite=BayPalmDiner.site,brisasSite=BayBrisas.site;let gull=null,works=null;
  const boatYard=BayButtonwoodYard.site,potJob={id:"pot-run",name:"Pot Run",by:"Alda Santana"};
  const solids=city.solids, sound=window.BaySound,garage=city.garage;
  solids.push({...carbon.rail,streetProp:true});
  solids.push(...BayEngineHouseArt.blocks(BayEngineSeven.house),...BayEngineSeven.calls.map(BayEngineSeven.block));
  const starliteSite=BayStarlite.site,starliteBooth=BayStarlite.booth,theatre=new BayStarlite.Theatre();
  const ada={x:83.92,z:-59.51,yaw:1.75};let gaugeStamp=-1,ticketIndex=0;
  solids.push(...BayStarliteArt.blocks(starliteSite));
  const luggage=BayLeftLuggage,bagArt=BayLeftLuggageArt,bootArt=BayLuggageBootArt;
  const threads=BayLowTide,stall=BayThreadsStall;
  solids.push(...stall.blockers(threads.site));
  const bell={lid:null,open:false,amount:0,pass:null};
  solids.push(luggage.block);
  for(const r of BayOnGreen.routes)solids.push({...r.post,w:.56,d:.50,bottom:0,top:1.74,streetProp:true});
  for(const t of luggage.tags)solids.push({...luggage.placard(t),w:.30,d:.30,bottom:0,top:1.14,streetProp:true});
  solids.push(...BayOffClock.sites.map(s=>s.block),BayCurbWire.desk.block,BayPalmCoffee.block);
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
  const manta=bay.vessel("manta"),mantaRide=new BayManta.Ride();
  const civilianFleet=[...boats,postalSkiff,clubBoat,manta];
  boats.forEach((v,i)=>bay.moor(v,i===2?BayCut.dock:bay.docks[0],i===1?1:-1));
  bay.moor(postalSkiff,BayGullKey.sites[0],1);boats.push(postalSkiff);
  bay.moor(manta,BayManta.home,0);boats.push(manta);
  Object.assign(clubBoat,{x:298,z:34,yaw:0});
  const cruiseMarks=[{x:298,z:126},{x:372,z:135},{x:387,z:-91},{x:307,z:-81}];
  let skiff=null,deckStep=null,cruiseLeg=0,regattaResult=null,chartMode="city",hullChoice="needle",courseChoice="jetty";
  let swim=null,surfArtReady=false,reefReady=false;
  let ferryScene=null,ferryReceipt=null,ferryMesh=null,ferryMeshMotion=null;
  const shorePins=bay.docks.map(d=>({...d,x:d.footX+1.4}));
  shorePins[0].name="Marlin Pier · Red Cork Club";
  shorePins[1].name="North Float · Manta 90";
  const cutGate={kind:"county-road",x:144,z:170,name:"Ocean Drive north · To Pelican Cut"};
  locations.push(...shorePins.filter(d=>d.id!==boatYard.dock.id),{...BayMarlinRoom.outside,kind:"room"},{...BayMercadoArt.counter,kind:"counter"},BaySurfPatrol.tower,BayCab.cinema);
  const genres=BayDriving.cars;
  const spur=new BayPortSpur.Line();
  locations.push(BayPortSpur.west.desk,BayPortSpur.east.desk);
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
  const titleWalkers=walkers.filter(p=>p.name!=="June"&&!p.coffeeRegular);
  const coffee=new BayPalmCoffee.Break(walkers.find(p=>p.coffeeRegular));
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
    const result=blankSave();result.engineSeven=BayEngineSeven.read(null);result.starlite=BayStarlite.read(null);result.stunt=storedPoster();result.bikes=BayPedal.read(null);result.boardwalk=BayBoardwalk.read(null);result.courts=BayPickup.read(null);result.valet=BayMotorCourt.read(null);
    result.band=BaySessions.read(null);result.palma=BayPalma.read(null);result.bridge=BayDrawbridge.read(null);result.neon=BayMarlinNeon.read(null);
    result.campana=BayCampana.read(null);result.windowBest={};result.windowJobs=0;result.transit=BayTransit.read(null);result.airwaves=BayAirwaves.read(null);
    result.buttonwood=BayButtonwood.read(null);result.brisas=BayBrisasClub.read(null);result.palm=BayPalmLeague.read(null);result.gull=BayGullSales.read(null);result.moto=BaySecondSeat.read(null);result.rescue=BayRescue.read(null);result.skate=BaySkate.read(null);result.airmail=BayPelicanAir.read(null);
    result.luggage=luggage.read(null);result.green=BayOnGreen.read(null);result.threads=threads.read(null,result.courts);
    result.clubCup=BayCoastCup.read(null);result.catchBook=BayRedCork.read(null);
    result.freight=BayPortSpur.saved(null);
    result.oceanBeat=BayOceanBeat.read(null);
    result.pictureJumps=jumps.read(null);result.copies=carbon.read(null);
    try{const raw=JSON.parse(localStorage.getItem("sundownBay.v1")||"null");if(!raw||typeof raw!=="object")return result;
      result.houseFee=raw.houseFee===true;
      result.clubCup=BayCoastCup.read(raw.clubCup);result.catchBook=BayRedCork.read(raw.catchBook);
      result.freight=BayPortSpur.saved(raw.freight);
      result.oceanBeat=BayOceanBeat.read(raw.oceanBeat);
      result.pictureJumps=jumps.read(raw.pictureJumps);result.copies=carbon.read(raw.copies);
      result.engineSeven=BayEngineSeven.read(raw.engineSeven);result.starlite=BayStarlite.read(raw.starlite);result.luggage=luggage.read(raw.luggage);result.green=BayOnGreen.read(raw.green);
      for(const k of ["wallet","paid","best","rides"])if(Number.isFinite(raw[k])&&raw[k]>=0)result[k]=raw[k];
      result.windowJobs=Number.isSafeInteger(raw.windowJobs)&&raw.windowJobs>=0?raw.windowJobs:0;
      for(const b of BayWindowSeat.briefs){const score=raw.windowBest?.[b.id];if(Number.isInteger(score)&&score>0&&score<=100)result.windowBest[b.id]=score;}
      result.tuned=raw.tuned===true;result.tapes=Array.isArray(raw.tapes)?[...new Set(raw.tapes.filter(n=>Number.isInteger(n)&&n>=0&&n<5))]:[];
      result.dash=BayBeachDash.readRecord(raw.dash);
      result.regatta=bay.readRecords(raw.regatta);
      result.meet=BayNightMeet.read(raw.meet);
      result.plates=BayPlates.read(raw.plates);
      result.shore=BaySwimming.read(raw.shore);
      result.cab=BayCab.read(raw.cab);result.campana=BayCampana.read(raw.campana);
      result.bikes=BayPedal.read(raw.bikes);result.boardwalk=BayBoardwalk.read(raw.boardwalk);
      result.courts=BayPickup.read(raw.courts);
      result.threads=threads.read(raw.threads,result.courts);
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
  const save=readSave(),houseLights=new BayHouseLights.Book();
  let jumpPage=jumps.sites[0];
  locations.push(luggage.counter,threads.counter,starliteBooth,BayEngineSeven.desk);
  const rainWalk=new BayRainWalk.Walk(),negatives=new BayWindowSeat.Negatives();
  const unit=new BaySecondUnit.Unit(),scoutDesk=BaySecondUnit.desk,otherMotion=new BayPlayerMotion();
  const worn=(lead=unit.lead)=>save.threads.rev?save.threads.wear[lead]:save.courts.equipped;
  Object.assign(BayCourtPlayers.kitColors,BayThreadsArt.colors);
  let fittingItem="",fittingAngle=0,windowStrip=null,windowStamp=0;
  const unitPin={...BaySecondUnit.home.frankie,kind:"scout",name:"Cine Luna · Location desk"};
  const curbWire=new BayCurbWire.Column(),wireDesk=BayCurbWire.desk,wirePin={...wireDesk.stand,kind:"curb-news",name:wireDesk.name};locations.push(wirePin);
  let wireView=null,wireSelected=0,wireTV=null,wireTVVersion=0,wireLastFrame="",wireNextTV=0;
  let freshEdition=null;
  const afternoon=new BayOffClock.Afternoon();let stripShown=0,fotoGlass="";
  const fotoPins=BayOffClock.sites.map(s=>({...s.stand,id:s.id,kind:"foto-booth",name:"Foto Bahía · "+s.name}));locations.push(...fotoPins);
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
    if(threads.custom(id)){
      const token="low-tide/"+unit.lead+"/"+id;
      if(!kits.has(token)){
        const frank=unit.lead==="frankie",mesh=new BayPlayerMesh(frank?BayScoutArt.colors:personColors[0],frank?"local":"driver");
        BayThreadsArt.dress(mesh,id,unit.lead);view.add(token,mesh,true);kits.set(token,mesh);
      }
      playerMesh=kits.get(token);playerModel=token;playerMesh.lastRevision=-1;return;
    }
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
  wearKit(worn());
  const cycles=new BayPedal.Fleet(save.bikes),boardwalk=new BayBoardwalk.Service(save.boardwalk);
  const coastGate=BayCoastWheelArt.gate,ticketWindow={...BayBoardwalkArt.places.counter,kind:"wheel-window",name:"Coast Wheel ticket window"};
  const bikePin={...BayBoardwalkArt.places.marlin,kind:"bike-rack",name:"Marlin bicycle rack"};
  locations.push(ticketWindow,bikePin);
  const neighbors=new BayNeighbors.Block(walkers,{meli:threads.counter,marisol:studio.counter,eli:ticketWindow,nell:BayDrawbridge.iceCounter,ren:skatePins[1],ada:BayCut.station});
  neighbors.refresh();
  addEventListener("storage",e=>{if(!e.key||e.key.startsWith(BayNeighbors.key))neighbors.refresh();});
  let localInReach=null,helloPose=null,localVoice=null,voiceCheck=0;
  const watchCrew=new BaySurfPatrol.Watch(save.shore.next);
  BayMarshLine.restore(save.fieldReels);
  const clockKey="sundownBay.clock.v1";
  let clockStart;
  try{const value=localStorage.getItem(clockKey);if(value!=null&&value!=="")clockStart=Number(value);}catch{}
  const hours=new BayHours.Clock(clockStart),gutters=new BayGutters.StreetWater();
  const pavement=new BayPavement.Street();let openPaper=null,paperIndex=0;
  const summerCaps=new BaySummerCaps.Caps(gutters);
  let capReach=null;
  gutters.weather(hours);let sprayRemarkAt=-15;
  let savedAt=hours.total,room=null,recentDiner=null,roomArtReady=false,marketArtReady=false,cineArtReady=false,cabArtReady=false;
  let cutArtReady=false,onAir=null,ambientField=null,ambientAt=-1;
  function saveTime(){
    try{localStorage.setItem(clockKey,String(hours.total));savedAt=hours.total;}catch{}
    flushRoadDirt();if(play&&works&&(works.dirty||works.saved.working))writeButtonwood();if(car&&(club.remember(car)||gull?.record(car)||car.stockId&&gull?.saved.loan?.kind===car.kind))persist();
  }
  addEventListener("pagehide",()=>{if(play){saveCrewPlace();saveTime();if(car===spider&&!transfer)parkSpider();if(save.airmail.bag||save.gull.titles.length||save.gull.loan)persist();}});
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
    if(latest?.freight?.known){const other=BayPortSpur.saved(latest.freight),book=save.freight;
      book.known=true;book.best=Math.max(book.best,other.best);if(other.runs>book.runs)Object.assign(book,other,{best:book.best});}
    if(latest?.catchBook?.known){
      const other=BayRedCork.read(latest.catchBook),ours=save.catchBook;ours.known=true;ours.total=Math.max(ours.total,other.total);
      for(const [id,n] of Object.entries(other.best))ours.best[id]=Math.max(ours.best[id]||0,n);
    }
    if(latest?.houseFee&&!save.houseFee){
      save.houseFee=true;if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
      if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    }
    if(latest?.clubCup?.known){
      const book=save.clubCup,other=BayCoastCup.read(latest.clubCup);
      book.known=true;
      if(other.starts>book.starts){Object.assign(book,other);if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;}
      if(book.last?.id&&other.last?.id===book.last.id&&book.last.field&&other.last.field){
        other.last.field.forEach((entry,i)=>{if(entry.time!==null)book.last.field[i].time=entry.time;});
      }
      if(other.best&&(!book.best||other.best<book.best)){book.best=other.best;book.splits=other.splits;}
      if(other.lap&&(!book.lap||other.lap<book.lap))book.lap=other.lap;
    }
    if(latest?.oceanBeat?.known){
      const incoming=BayOceanBeat.read(latest.oceanBeat);
      save.oceanBeat.known=true;
      if((incoming.slip?.number||0)>(save.oceanBeat.slip?.number||0)){
        save.oceanBeat=incoming;
        if(incoming.slip.fine&&Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
      }
    }
    if(latest?.copies?.known){
      const incoming=carbon.read(latest.copies);save.copies.known=true;
      for(const side of carbon.sides){
        const card=incoming[side],old=save.copies[side];
        if(card&&(!old||card.seconds<old.seconds)){
          if(!old&&Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
          save.copies[side]=card;
        }
      }
    }
    if(latest?.pictureJumps?.known){
      const incoming=jumps.read(latest.pictureJumps),local=save.pictureJumps;
      local.known=true;
      for(const s of jumps.sites){
        const entry=incoming.best[s.id],old=local.best[s.id];
        if(entry&&(!old||entry.distance>old.distance)){
          if(!old&&Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
          local.best[s.id]=entry;
        }
      }
    }
    if(latest?.engineSeven?.rev>save.engineSeven.rev){save.engineSeven=BayEngineSeven.read(latest.engineSeven);if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;}
    if(latest?.starlite?.rev>save.starlite.rev){save.starlite=BayStarlite.read(latest.starlite);spider.roofTarget=save.starlite.roof;if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;}
    if(Number.isSafeInteger(latest?.threads?.rev)&&latest.threads.rev>save.threads.rev){
      save.threads=threads.read(latest.threads,BayPickup.read(latest.courts));
      if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
      if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
      wearKit(worn());lastHud=lastMap=-10;
    }
    if(Number.isSafeInteger(latest?.green?.rev)&&latest.green.rev>save.green.rev){
      save.green=BayOnGreen.read(latest.green);lastHud=lastMap=-10;
      if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
      if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    }
    if(Number.isSafeInteger(latest?.luggage?.rev)&&latest.luggage.rev>save.luggage.rev){
      save.luggage=luggage.read(latest.luggage);bell.pass=null;lastHud=lastMap=-10;
      if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
      if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    }
    if(Number.isSafeInteger(latest?.campana?.rev)&&latest.campana.rev>save.campana.rev){
      if(play&&active?.campana){
        active=null;campana.abandon();lastMap=lastHud=-10;
        note("La Campana","The route card changed in another window. Nina has this truck.",3.3);
      }
      Object.assign(save.campana,BayCampana.read(latest.campana));
      if(Number.isSafeInteger(latest.wallet))save.wallet=latest.wallet;
      if(Number.isSafeInteger(latest.paid))save.paid=latest.paid;
    }
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
    if(ev.key===BayHouseLights.key)houseLights.refresh();
    gutters.refresh(ev.key);
    if(ev.key===BayPavement.archiveKey)pavement.readArchive();
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
    if(bootArt.supports(v.kind))parts.trunk=new BayMesh();
    buildBayCar(shell,v.kind,v.color,parts);
    const install=(name,mesh)=>{const key=v.model+"/"+name;view.add(key,mesh);return key;};
    const rig={shell:install("body",shell),brakes:install("brake",parts.brakes),reverse:install("reverse",parts.reverse),doors:{},wheels:{}};
    if(parts.windshield)rig.windshield=install("windshield",parts.windshield);
    if(parts.trunk)rig.trunk=install("trunk",parts.trunk);
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
  carbon.install(model);
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
  const skidBuffer={vertices:new Float32Array(144*36)};
  let uploadedLast=null,uploadedFirst=null;
  function drawSkids(){
    const first=skids.find(k=>elapsed-k.time<20);
    if(!first)return;
    if(uploadedFirst!==first||uploadedLast!==skids.at(-1)){
      const vertices=skidBuffer.vertices;let dst=0;
      for(const k of skids){
        if(elapsed-k.time>=20)continue;
        const sn=Math.sin(k.yaw),cs=Math.cos(k.yaw),run=k.length*.5+.022;
        for(const [side,along] of [[-1,-1],[1,-1],[1,1],[-1,-1],[1,1],[-1,1]]){
          vertices[dst++]=k.x+side*.093*cs+along*run*sn;vertices[dst++]=k.y;
          vertices[dst++]=k.z-side*.093*sn+along*run*cs;
          vertices[dst++]=.244;vertices[dst++]=.248;vertices[dst++]=.255;
        }
      }
      vertices.fill(0,dst);
      if(!uploadedLast)view.add("tire-prints",skidBuffer,true);else view.updateAnimated("tire-prints");
      uploadedFirst=first;uploadedLast=skids.at(-1);
    }
    view.draw("tire-prints");
  }
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
  const streetFleet=new Set(cars);
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
  const carRadios=new BayOpenWindows.Street(owners.people,(a,v)=>scoutSight(
    {x:a.x,y:footLevel(a.x,a.z)+1.45,z:a.z},{x:v.x,y:footLevel(v.x,v.z)+1.12,z:v.z}));
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
  const paletaStop=BayCampana.stops[save.campana.at],iceVan=addCar("van","#f2dab1",paletaStop.x,paletaStop.z,0);
  iceVan.plate="NIEVE";iceVan.serviceCar=true;iceVan.campanaDriver=!save.campana.shift;
  const campana=new BayCampana.Truck(iceVan,save.campana),iceJob={name:"La Campana · Two more stops",id:"paletas",by:"Nina Rojas"};
  const green=new BayOnGreen.Club(addCar,BayStreetArt.signals);
  const spider=addCar("caleta","#f0dba4",149,-38,0);
  Object.assign(spider,{plate:"LATE 83",softTop:save.starlite.roof,roofTarget:save.starlite.roof,caletaSeats:{driver:null,passenger:null}});
  const spiderPark=save.starlite.park;
  if(spiderPark&&fitsCar(spider,spiderPark.x,spiderPark.z,spiderPark.yaw)&&!cars.some(o=>o!==spider&&dist(o,spiderPark)<7&&BayDriving.contact({...spider,...spiderPark},o)))Object.assign(spider,spiderPark);
  const fireHouse=BayEngineSeven.house,engine7=addCar("pumper","#a23e37",fireHouse.x,fireHouse.z,fireHouse.yaw);
  Object.assign(engine7,BayEngineSeven.berth);
  engine7.serviceCar=true;engine7.plate="ENG 7";
  const company=new BayEngineSeven.Company(engine7,save.engineSeven),sevenJob={name:"Station Seven",id:"engine-seven",by:"Nel Baptiste"};let sevenPage=0;
  const firstPost=BayOceanBeat.posts[0];
  const beat=new BayOceanBeat.Round(addCar("cruiser","#31494e",firstPost.x,firstPost.z,firstPost.yaw));
  const cup=new BayCoastCup.Cup(BayCoastCup.drivers.map(d=>{
    const v=addCar(d.kind,d.paint,149.12,d.home,0);
    v.serviceCar=true;v.cupNumber=d.number;v.plate="CLUB "+d.number;return v;
  }));
  const cupScans=new Map(),marshalMotion=new BayPlayerMotion();let marshalMesh=null;
  let beatMesh=null;
  let timingFilm=null;
  for(const s of green.sites){const slip=save.green.cards[s.route.id]?.slip;s.v.serviceCar=true;s.clock=slip?.film?slip.film.shots.at(-1)[0]/1000:slip?.time||0;}
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
    if(spur.aboard&&!spur.transfer)return spur.engine;
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
  const formatVehicle=v=>v===iceVan?"La Campana":genres[v.kind].name;
  function footLevel(x,z){
    if(Math.abs(x-carbon.pad.x)<6.13&&Math.abs(z-carbon.pad.z)<6.23)return carbon.apronY;
    const deck=jumps.deck(x,z);if(deck)return deck.base+jumps.elevation(deck,x,z);
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
    if(save.campana.shift&&!active){active={campana:true,job:iceJob};Object.assign(hero,{x:campana.station.stand.x,z:campana.station.z-2.6});resetFeet();cameraSnap();}
    else if(active&&save.campana.shift){campana.abandon();commitPaletas();}
    if(unit.met)restoreCrew();
    restoreBaggageCars();markClaim();
    if(save.shore.carried&&!active)waypoint={...BaySurfPatrol.tower};
    try{if(localStorage.getItem("sundownBay.audio")==="on"){radio=sound.setEnabled(true);$("audioKey").querySelector("span").textContent=radio?"Sound on":"Sound off";}}catch{}
    if(active?.campana){note("Nina Rojas","Your keys and route card are at the last curb. Two stops to a sheet.",3.8);return;}
    if(active?.airmail){note("Mail in hand",airLine.leaflet()[0]+" · "+airLine.mailTo.name,4);return;}
    if(save.airmail.island){note("Gull Key","Liv is at the post office. Fern 3 calls at the south float.",3.5);return;}
    if(active?.buttonwood){note("Alda’s tide book",BayButtonwood.sheets[save.buttonwood.sheet].name+" · Your next stop is marked.",4);return;}
    if(unit.met){note(BaySecondUnit.names[unit.lead],district(pos())+" · Y switch characters"+(unit.lead==="frankie"?" · P location camera":""),3.8);return;}
    note("Marlin Motel","Room 14 is yours. "+(personalCar?"Your "+formatVehicle(personalCar)+" is marked on the map.":cars[0].color===paints[0]?"Keys are in the coral coupe.":"Your "+formatVehicle(cars[0])+" is out front."),4.3);
  }
  const freeFeet=()=>play&&!spur.aboard&&!spur.transfer&&!windowRide?.held&&!palm.match&&!palm.playerSeat&&!gull?.exchange&&!motos.player&&!motos.job?.swapping&&!rescue.holding&&!airLine.aboard&&!room&&!transit.aboard&&!cabs.playerHeld&&!cycles.riding&&!skate.rider&&!boardwalk.player&&!pickup&&!band.take&&!car&&!skiff&&!swim&&!transfer&&!deckStep;
  const onStreetFeet=()=>freeFeet()&&!broadcastDesk.mix&&!roofs.raised&&motion.jumpTime<0;
  function unitRoadCar(v){
    return !!v?.garageKey&&v!==wrecker&&v!==workTruck&&v!==unit4&&v!==taxi&&!v.serviceCar&&!v.meetCar&&!v.guestId&&!v.washGuest&&!v.onLift&&!v.recoveryOwner&&(!v.stockId||!!gull.record(v))&&works.trailer.hitched!==v;
  }
  function crewFree(){
    return play&&!active&&!heat&&!room&&!transfer&&!deckStep&&!cabs.booking&&!transit.engaged&&!watchCrew.towing&&!rainWalk.trip&&!valet.onDuty&&!serviceVehicle&&!neon.testing&&!wash.hasWand()&&!gull.engaged&&!save.airmail.bag&&(car?unitRoadCar(car):onStreetFeet());
  }
  function saveCrewPlace(){
    if(unit.met&&crewFree()){
      unit.remember(car||hero,car);if(afternoon.active&&afternoon.phase==="foot")unit.remember(otherBody,null,unit.other);unit.save();
    }
  }
  function unitFeet(p,id){
    for(const radius of [0,1.4,2.7,4])for(let i=0;i<(radius?8:1);i++){
      const x=p.x+Math.sin(i*Math.PI/4)*radius,z=p.z+Math.cos(i*Math.PI/4)*radius;
      if((valid(x,z,.38)||bay.landing(x,z,.38))&&!cars.some(v=>dist(v,{x,z})<1.45))return {x,z,y:footLevel(x,z),yaw:p.yaw};
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
    wearKit(worn());cameraSnap();
  }
  const crewDeskNear=()=>onStreetFeet()&&dist(hero,scoutDesk)<2.65&&dist(hero,scoutDesk)<dist(hero,BayCab.cinema);
  const crewPhoneNear=()=>onStreetFeet()&&dist(hero,BaySecondUnit.phone)<3.15;
  function beginCrewSwitch(){
    if(afternoon.active&&(afternoon.phase!=="foot"||car||transfer)){note("Second Unit","Park and step outside together to switch.",2.6);return;}
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
    wearKit(worn());skidLast=null;driverSeat.center();driverSeat.mirrorAt=-Infinity;
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
  function scoutLook(dx,dy){const l=unit.eye;if(l?.window){if(dx||dy){l.adjusted=true;l.pan=clamp(l.pan+dx,-3.09,3.09);l.pitch=clamp(l.pitch+dy,-.85,1.22);l.reach=clamp(l.reach+dy*19,5,62);}return;}if(l){l.yaw+=clamp(dx,-.7,.7);l.pitch=clamp(l.pitch+clamp(dy,-.5,.5),-1.12,.92);if(Number.isFinite(l.mapReach))l.mapReach=clamp(l.mapReach+dy*15,2,62);hero.yaw=l.yaw;}}
  function nearPartner(){
    return !unit.transition&&!unit.eye&&crewFree()&&onStreetFeet()&&dist(hero,otherCar||otherBody)<4.2;
  }
  function startAfternoon(){
    if(afternoon.active||!nearPartner())return;
    if(otherCar&&!doorPlan(otherCar,true,otherBody,-1)){speak(BaySecondUnit.names[unit.other],"Give my door a little room first.");return;}
    if(panel)closePanel();unit.met=true;afternoon.start(otherCar);saveCrewPlace();
    speak(BaySecondUnit.names[unit.other],unit.other==="frankie"?"Nobody needs a picture from me today. Walk with me? There’s still a working photo booth by the cinema.":"We’ve got the afternoon. You pick the road, I’ll take the passenger seat.");
    lastHud=lastMap=-10;
  }
  function finishAfternoon(){
    const a=afternoon;if(!a.active)return;
    if(a.photo)clearFoto();
    if(a.vehicle&&a.side===1)a.vehicle.passengerDoor=0;
    if(a.seat>0&&a.vehicle){
      const s=BayCarAccess.outside(bayCarLayout(a.vehicle.kind),a.side),p=BayDriving.world(a.vehicle,s.x,s.z);
      Object.assign(otherBody,unitFeet({...p,yaw:a.vehicle.yaw},unit.other));
    }
    otherCar=null;otherMotion.ride=null;otherMotion.reset();a.reset();
    unit.remember(otherBody,null,unit.other);unit.save();lastHud=lastMap=-10;
  }
  function partyClear(x,z){
    if(!valid(x,z,.27)&&!bay.landing(x,z,.27))return false;
    for(const v of cars)if(Math.abs(v.x-x)<4&&Math.abs(v.z-z)<4&&BayDriving.clearance(v,{x,z})<.22)return false;
    return Math.abs(transit.bus.x-x)>6||Math.abs(transit.bus.z-z)>6||BayDriving.clearance(transit.bus,{x,z})>.3;
  }
  function afternoonRoute(from,to,v){
    const minX=Math.min(from.x,to.x)-2.4,maxX=Math.max(from.x,to.x)+2.4,minZ=Math.min(from.z,to.z)-2.4,maxZ=Math.max(from.z,to.z)+2.4;
    const parked=cars.filter(o=>o!==v&&o.x>minX-2&&o.x<maxX+2&&o.z>minZ-2&&o.z<maxZ+2);
    if(transit.bus.x>minX-4&&transit.bus.x<maxX+4&&transit.bus.z>minZ-4&&transit.bus.z<maxZ+4)parked.push(transit.bus);
    const corners=[];
    for(const b of solids){
      if(b.x+b.w/2<minX||b.x-b.w/2>maxX||b.z+b.d/2<minZ||b.z-b.d/2>maxZ)continue;
      for(const x of [b.x-b.w/2-.48,b.x+b.w/2+.48])for(const z of [b.z-b.d/2-.48,b.z+b.d/2+.48]){
        if(x>minX&&x<maxX&&z>minZ&&z<maxZ)corners.push({x,z});
      }
    }
    return recoveryWalkway(from,to,v,corners,parked);
  }
  const afternoonEnv={ground:footLevel,door:doorPlan,clear:partyClear,route:afternoonRoute};
  function afternoonLine(tag,frank,guest,minGap=8){
    const a=afternoon;if(a.said.has(tag)||elapsed-a.lastLine<minGap)return;
    a.said.add(tag);a.lastLine=elapsed;speak(BaySecondUnit.names[unit.other],unit.other==="frankie"?frank:guest);
  }
  function passengerTalk(v){
    const a=afternoon;
    if(a.lastDrive){
      const travel=dist(v,a.lastDrive);if(travel<8)a.meters+=travel;
      if(a.lastDrive.speed-Math.abs(v.speed)>4)afternoonLine("brake","Whoa. That belt works.","That was my coffee.");
    }
    a.lastDrive={x:v.x,z:v.z,speed:Math.abs(v.speed)};
    if(heat)afternoonLine("siren","I hear them. I’m keeping my head down.","Yeah, I see the lights too.");
    else if(Math.abs(v.speed)>21)afternoonLine("fast","My camera bag just passed me on the floor.","Let me finish buckling this thing.");
    else if(hours.rain>.28&&a.meters>30)afternoonLine("rain","There goes the light. I like the city better wet anyway.","Listen to that roof. Sounds like the old motel awning.");
    else if(a.meters>30){
      const zone=district(v);
      if(zone==="Ocean Drive")afternoonLine("ocean","My first shoot was on Ocean. Forgot to take the lens cap off.","That motel sign used to buzz loud enough to hear from here.");
      else if(zone==="Boardwalk"||zone==="Sol Beach")afternoonLine("wheel","The booth by the wheel has the best light in town.","See the wheel? I swear it’s slower when you’ve got somebody waiting below.");
      else if(zone==="Neon Mile")afternoonLine("cinema","First time I sat through the credits was at Luna. I wanted to see who did the lights.","If we catch the late show, I’m picking the seats this time.");
      else if(a.meters>145)afternoonLine("city","Keep going. It’s nice seeing this through the glass for once.","You drive. I’m happy watching the blocks go by.");
    }
  }
  function clearFoto(){
    afternoon.photo=null;fotoGlass="";$("fotoFinder").hidden=true;keys.clear();lastHud=-10;
  }
  function stepFoto(dt){
    const f=afternoon.photo,before=f.poses.length;
    if(f.step(dt)){
      const r=afternoon.album.keep(f.site,f.poses,unit.lead,hours.day+1,Math.floor(hours.minute),f.looks,f.solo);
      clearFoto();if(r){stripShown=r.stamp;openPanel("foto-album");}return;
    }
    if(f.poses.length!==before)sound.cue("shutter");
    paintFoto();
  }
  function paintFoto(){
    const f=afternoon.photo;if(!f)return;
    const index=Math.min(3,f.poses.length+1),count=Math.max(1,Math.ceil(f.left)),lit=f.flash>.4;
    const state=[f.site.id,f.pose,index,count,lit,f.poses.length].join("/");
    if(state===fotoGlass)return;fotoGlass=state;
    $("fotoFinder").hidden=false;$("fotoCounter").textContent=f.site.name+" · "+index+" / 3";
    $("fotoClock").textContent=f.poses.length===3?"✓":String(count);$("fotoPortrait").parentElement.classList.toggle("flash",lit);
    BayFotoBoothArt.portrait($("fotoPortrait").getContext("2d"),0,0,340,207,f.site.id,f.pose,unit.lead,f.looks,f.solo);
    for(const btn of $("fotoFinder").querySelectorAll("[data-pose]"))btn.setAttribute("aria-pressed",String(Number(btn.dataset.pose)===f.pose));
  }
  function chooseFoto(n){if(afternoon.photo&&afternoon.photo.poses.length<3){afternoon.photo.pose=n;paintFoto();}}
  $("fotoFinder").addEventListener("click",ev=>{const b=ev.target.closest?.("[data-pose]");if(b)chooseFoto(Number(b.dataset.pose));});
  function beginFoto(site){
    if(!site||!onStreetFeet()||afternoon.active&&(afternoon.phase!=="foot"||dist(otherBody,site.stand)>4.8))return false;
    afternoon.photo=new BayOffClock.Sitting(site);afternoon.path=[];afternoon.goal=null;motion.reset();keys.clear();
    afternoon.photo.looks={guest:worn("guest"),frankie:worn("frankie")};afternoon.photo.solo=!afternoon.active;
    if(panel)closePanel();speechTill=elapsed;$("speech").hidden=true;toastTill=elapsed;$("toast").hidden=true;
    paintFoto();lastHud=-10;return true;
  }
  function stepAfternoon(dt){
    const a=afternoon,v=a.vehicle;
    if(active||skiff||room||swim||motos.player||airLine.aboard||transit.aboard||cycles.riding||skate.rider||boardwalk.player||cabs.booking||rainWalk.trip||pickup||broadcastDesk.mix)a.ending=true;
    if(a.photo){if(a.ending)clearFoto();else{stepFoto(dt);return;}}
    if(unit.transition)return;
    if(a.phase==="across"){
      a.slide=Math.min(1,a.slide+dt/.74);const smooth=a.slide*a.slide*(3-2*a.slide);
      BayCarAccess.pose(v,1,1,otherBody,otherMotion,footLevel,dt,true);
      const layout=bayCarLayout(v.kind),point=BayDriving.world(v,(1-2*smooth)*layout.seatX,layout.seatZ);
      otherBody.x=point.x;otherBody.z=point.z;otherBody.yaw=v.yaw+.24*Math.sin(smooth*Math.PI);
      if(a.slide===1){a.phase="out";a.side=-1;}return;
    }
    if(a.inDoor){
      const entering=a.phase==="in";a.seat=clamp(a.seat+(entering?dt:-dt)/1.38,0,1);
      BayCarAccess.pose(v,a.side,a.seat,otherBody,otherMotion,footLevel,dt,a.side===1);
      if(entering&&a.seat===1){
        a.phase="ride";a.lastDrive=null;afternoonLine("belt","Alright. I got the door. Pick a direction.","All set. You’ve got the wheel.",2);
      }else if(!entering&&a.seat===0){
        if(a.side<0){otherCar=null;v.doorAngle=0;}else v.passengerDoor=0;
        otherMotion.ride=null;otherMotion.reset();a.vehicle=null;a.phase="foot";a.side=1;a.path=[];a.goal=null;a.replan=0;a.trail=[];
        unit.remember(otherBody,null,unit.other);unit.save();if(a.ending)finishAfternoon();
      }return;
    }
    if(a.seated){
      BayCarAccess.pose(v,1,1,otherBody,otherMotion,footLevel,dt,true);
      if(car===v)passengerTalk(v);
      if((a.ending||car!==v||transfer?.exiting)&&Math.abs(v.speed)<1.2){
        if(doorPlan(v,true,otherBody,1)){a.phase="out";a.seat=1;}
        else if(car!==v&&!transfer&&doorPlan(v,true,otherBody,-1)){a.phase="across";a.slide=0;}
      }
      return;
    }
    if(a.ending||dist(otherBody,pos())>65){
      const left=!a.ending;finishAfternoon();
      if(left)speak(BaySecondUnit.names[unit.other],"You went on ahead. I’ll be right here if you circle back.");
      return;
    }
    if(a.handoff&&!car&&!transfer){
      const {v,place}=a.handoff;a.handoff=null;
      if(dist(hero,v)<9&&crewFree()&&startWindowRide(place,v))return;
      speak(BaySecondUnit.names[unit.other],"Let’s leave the car here. We can walk.");
    }
    const ride=transfer?.exiting?null:car||transfer?.v;
    if(ride){
      if(!unitRoadCar(ride)){finishAfternoon();return;}
      if(transfer?.side!==1&&Math.abs(ride.speed)<.65&&dist(ride,otherBody)<20)a.walkToDoor(otherBody,ride,dt,afternoonEnv);
      else{a.vehicle=null;a.replan=0;a.path=[];otherMotion.step(dt,0,0);}
    }else{
      if(a.vehicle){a.vehicle=null;a.replan=0;a.path=[];a.goal=null;}
      if(onStreetFeet()&&!unit.eye)a.follow(otherBody,hero,dt,afternoonEnv);else otherMotion.step(dt,0,0);
    }
  }
  function afternoonKey(code){
    const a=afternoon;
    if(a.photo){
      if(code==="Escape"||code==="KeyE")clearFoto();
      else if(/^(Digit|Numpad)[123]$/.test(code))chooseFoto(Number(code.at(-1))-1);
      return true;
    }
    if(unit.transition||unit.eye||windowRide||panel)return false;
    if(a.active&&code==="KeyY"&&(a.phase!=="foot"||car||transfer)){note("Second Unit","Park and step outside together to switch.",2.6);return true;}
    if(code==="KeyG"&&(nearPartner()||a.active&&a.seated&&car===a.vehicle)){
      if(a.active)openPanel("free-afternoon");else startAfternoon();return true;
    }
    if(code==="KeyF"&&onStreetFeet()&&!active&&!heat){
      const site=BayOffClock.near(hero);
      if(site){
        if(!beginFoto(site))speak("Foto Bahía",a.active?"Room for two. Wait for your partner by the curtain.":"Two on the stool. Bring your partner here for a strip.");
        return true;
      }
    }
    return false;
  }
  function afternoonHint(){
    if(unit.transition||unit.eye||panel||active)return false;
    if(afternoon.photo){contextHint("","");return true;}
    const site=onStreetFeet()&&BayOffClock.near(hero);
    if(site&&!heat){contextHint("F",afternoon.active?"Sit together for a Foto Bahía strip":"Sit for a Foto Bahía strip");return true;}
    if(afternoon.inDoor){contextHint("",BaySecondUnit.names[unit.other]+(afternoon.phase==="in"?" is buckling up":" is stepping out"));return true;}
    if(afternoon.seated&&car===afternoon.vehicle&&!heat){contextHint("G","Hand over the keys · Radio & stops");return true;}
    if(!afternoon.active&&nearPartner()){contextHint("G","Hang out with "+BaySecondUnit.names[unit.other]+(crewDeskNear()?" · F location desk":""));return true;}
    return false;
  }
  function albumButton(){return makeButton("Photo strips","Prints from the Foto Bahía booths around town.","Open album",()=>{stripShown=0;openPanel("foto-album");});}
  function appendAfternoonEntry(b){
    if(afternoon.active)b.append(makeButton("An afternoon off","Find a booth or wrap up the afternoon.","Hangout",()=>openPanel("free-afternoon")));
    else if(nearPartner())b.append(makeButton("Hang out together","Take a walk or bring your partner along for a drive.","Invite",startAfternoon));
    if(afternoon.album.records.length)b.append(albumButton());
  }
  function afternoonPanel(b,album){
    const a=afternoon;a.album.refresh();
    if(album){
      const records=a.album.records,i=Math.max(0,records.findIndex(r=>r.stamp===stripShown)),r=records[i];
      if(!r){signedNote(b,"Find a Foto Bahía booth with your partner. It takes three pictures.","Frankie Prado");return;}
      const paper=document.createElement("canvas");paper.className="foto-strip";paper.setAttribute("aria-label","Three pictures of "+(r.solo?BaySecondUnit.names[r.lead]:"Frankie and the Marlin driver")+" at "+BayOffClock.sites.find(s=>s.id===r.site).name);
      BayFotoBoothArt.strip(paper,r);b.append(paper);
      if(save.threads.met&&threads.fits(r,r.site))b.append(makeButton("Cora’s window print","Bring this strip back to Low Tide Exchange.","Mark stall",()=>clockPin(threads.counter)));
      if(records.length>1)b.append(makeButton("Turn the stack","Strip "+(i+1)+" of "+records.length,"Next print",()=>{stripShown=records[(i+1)%records.length].stamp;openPanel("foto-album",true);}));
      return;
    }
    signedNote(b,"We can take your car, or just walk. If you see a photo booth, grab us a strip.",BaySecondUnit.names[unit.other]);
    if(a.active)rideInvite(b);
    if(a.seated&&car===a.vehicle)b.append(makeButton("Your pick on the radio","Let your passenger choose a station for this car.","Hand over the dial",()=>{
      if(!afternoon.seated||car!==afternoon.vehicle)return;
      const frank=unit.other==="frankie",pick=frank?"marea":"breaker";closePanel();tuneRadio(0,pick);
      a.lastLine=elapsed;speak(BaySecondUnit.names[unit.other],frank?"Leave Pili on. My mother used to turn up Marea so loud we could hear it on the porch.":"Breaker, if you don’t mind. Wes played my tape back when I was driving the motel shuttle.");
    }));
    for(const [index,pin] of fotoPins.entries())b.append(makeButton(pin.name,a.album.records.some(r=>r.site===BayOffClock.sites[index].id)?"You have a strip from here.":"Three exposures behind the curtain.","Mark map",()=>clockPin(pin)));
    if(a.album.records.length)b.append(albumButton());
    if(a.active)b.append(makeButton("Catch you later",a.seated?"Drop your partner at a clear curb.":"Your partner will stay here.","End hangout",()=>{
      closePanel();a.ending=true;if(a.phase==="foot")finishAfternoon();speak(BaySecondUnit.names[unit.other],"See you around. Keep the prints.");
    }));
  }
  function crewStep(dt){
    if(afternoon.photo?.solo){stepFoto(dt);return;}
    if(windowRide){
      const r=windowRide;if(!r.held&&(heat||dist(hero,r.pickup.stand)>54)){endWindowRide();return;}
      otherBody.raised=0;
      if(unit.eye?.window){
        const l=unit.eye,dx=Number(held("ArrowRight","KeyC"))-Number(held("ArrowLeft","KeyQ"))+pointer.edgeX*.72;
        scoutLook(dx*dt*1.5,(Number(held("ArrowUp"))-Number(held("ArrowDown")))*dt*.95);l.yaw=r.vehicle.yaw+l.pan;l.flash=Math.max(0,l.flash-dt*4.5);
      }return;
    }
    if(afternoon.active)stepAfternoon(dt);
    else if(otherCar)BayCarAccess.pose(otherCar,-1,1,otherBody,otherMotion,footLevel,dt);
    else{
      otherBody.y=footLevel(otherBody.x,otherBody.z);otherMotion.step(dt,0,0);
      if(dist(hero,otherBody)<5&&dist(hero,otherBody)>.65)otherBody.yaw+=angle(otherBody.yaw,Math.atan2(hero.x-otherBody.x,hero.z-otherBody.z))*(-Math.expm1(-1.4*dt));
    }
    otherBody.raised=unit.other==="frankie"&&!otherCar&&!afternoon.active?clamp((Math.sin(streetTime*.62)-.52)*5,0,1):0;
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
    if(afternoonKey(code))return true;
    if(unit.transition)return code!=="Escape"&&code!=="KeyR";
    if(unit.eye){
      if(code==="KeyP"||code==="Escape"||code==="KeyJ"){unit.eye=null;cameraSnap();resetPointer();if(code==="KeyJ")openPanel("unit-roll");}
      else if(code==="KeyG"&&houseLights.mark)unit.eye.trace=!unit.eye.trace;
      else if(code==="KeyF"&&houseLights.s.shooting&&dist(hero,scoutDesk)<55){
        const l=unit.eye,s=BayNightMeet.marquee;
        l.yaw=Math.atan2(s.x-hero.x,s.z-hero.z);l.pitch=Math.atan2(s.y-hero.y-1.61,dist(hero,s));hero.yaw=l.yaw;l.last="";l.check=null;
        if(isTop())l.mapReach=dist(hero,s);
      }
      else if(code==="Space")unit.eye.fire=true;
      else if(code==="KeyZ"||code==="KeyV")unit.eye.zoom=unit.eye.zoom>=3?1:Math.min(3,Math.round(unit.eye.zoom)+1);
      return code!=="KeyR";
    }
    if(code==="KeyY"&&(unit.met||crewPhoneNear()||crewDeskNear())){
      if(!crewFree()){note("Second Unit","Call back when you’re free and clear.",2.6);return true;}
      if(unit.met)beginCrewSwitch();else openPanel("unit-sheet");return true;
    }
    if(code==="KeyF"&&crewDeskNear()&&crewFree()){openPanel("unit-sheet");return true;}
    if(code==="KeyP"&&(unit.lead==="frankie"||houseLights.s.shooting&&dist(hero,scoutDesk)<55)&&onStreetFeet()&&crewFree()){
      const sign=BayNightMeet.marquee,angleToSign=Math.atan2(sign.x-hero.x,sign.z-hero.z);
      unit.eye={yaw:dist(hero,scoutDesk)<4?angleToSign:cam.yaw,pitch:dist(hero,scoutDesk)<4?.17:0,zoom:1,fire:false,flash:0};
      rainWalk.open=false;motion.vx=motion.vz=0;resetPointer();lastHud=-10;return true;
    }
    return false;
  }
  function crewHint(){
    if(windowRide)return windowHint();
    if(afternoonHint())return true;
    if(unit.transition){contextHint("Y",unit.transition.braking?"Pulling over":"Second Unit · "+BaySecondUnit.names[unit.transition.swapped?unit.lead:unit.other]);return true;}
    if(unit.eye){contextHint("Space",houseLights.s.shooting&&dist(hero,scoutDesk)<55?"Shutter · F sight marquee · G trace first frame · P lower":"Shutter · Arrows aim · Z zoom · P lower");return true;}
    if(!crewFree())return false;
    if(crewDeskNear()){contextHint("F","Frankie’s location desk · "+(unit.met?"Select a print":"Meet the scout"));return true;}
    if(!unit.met&&crewPhoneNear()){contextHint("Y","Pick up Frankie’s call · F Bay Cab");return true;}
    return false;
  }
  const crewBodies=new Map();
  function drawCrew(list,see,t){
    if(see(BayHouseLights.front,100))BayHouseLights.world(list,model,hours,t,houseLights.mark);
    if(see(scoutDesk,90))BayScoutArt.worldDesk(list,model,scoutDesk,t);
    for(const s of BayOffClock.sites)if(see(s,78))BayFotoBoothArt.world(list,model,s,afternoon.photo?.site===s,afternoon.photo?.flash||0);
    if(!see(otherBody,68)||afternoon.photo&&!afternoon.photo.solo)return;
    const id=unit.other,frank=id==="frankie",look=worn(id),key="second-unit/"+id+(look==="street"?"":"/"+look);
    let mesh=crewBodies.get(key);
    if(!mesh){mesh=new BayPlayerMesh(frank?BayScoutArt.colors:personColors[0],frank?"local":"driver");
      if(threads.custom(look))BayThreadsArt.dress(mesh,look,id);
      else{if(frank)BayScoutArt.dress(mesh);BayCourtPlayers.kit(mesh,look);}
      view.add(key,mesh,true);crewBodies.set(key,mesh);}
    let changed=mesh.update(otherMotion);
    const raised=otherBody.raised||0;
    if(frank)changed=BayScoutArt.cameraPose(mesh,otherBody,t,raised)||changed;
    if(changed)view.updateAnimated(key);
    if(afternoon.seated)drawInSeat(list,key,afternoon.vehicle,1);
    else if(otherCar&&(!windowRide||windowRide.driverSeat===1)&&!(afternoon.active&&afternoon.phase==="out"))drawInSeat(list,key,otherCar,-1);
    else{list.push([key,otherBody.x,otherBody.y,otherBody.z,otherBody.yaw]);if(frank)BayScoutArt.cameraProp(list,model,otherBody,mesh,t,raised);}
  }
  function scoutMapView(state,w,h){
    const l=unit.eye,reach=l.window?l.reach:l.mapReach??(12+l.pitch*10)/l.zoom;state.cx=hero.x+Math.sin(l.yaw)*reach;state.cz=hero.z+Math.cos(l.yaw)*reach;
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
    const onCall=!l.window&&houseLights.s.shooting&&dist(hero,scoutDesk)<55;
    if(l.fire||l.check==null||elapsed-l.check>.13){
      l.check=elapsed;
      const subjects=scoutSubjects(),eye=l.window?windowEye():{x:hero.x,y:hero.y+1.61,z:hero.z},clear=isTop()?()=>true:scoutSight;
      const candidate=onCall&&BaySecondUnit.grade(subjects.filter(p=>p.id==="marquee"),project,gate,eye,clear);
      l.subject=candidate||BaySecondUnit.grade(subjects,project,gate,eye,clear);
    }
    const cameraMark=onCall?{x:hero.x,z:hero.z,yaw:l.yaw,pitch:l.pitch,zoom:l.zoom,overhead:isTop()}:null;
    if(cameraMark?.overhead)cameraMark.reach=l.mapReach??(12+l.pitch*10)/l.zoom;
    if(l.fire){l.fire=false;
      const districtName=district(hero),photo=BayMeetPhoto.capture(source,sky,.5,.5,1.5,true);
      const r=unit.expose(photo,{title:l.subject?.title||districtName+" street study",score:l.subject?.score||0,by:BaySecondUnit.names[unit.lead],district:districtName,minute:Math.floor(hours.minute),day:hours.day+1});
      if(r&&l.window&&l.subject&&windowRide.phase==="ride"&&!windowRide.early&&Math.abs(windowRide.vehicle.speed)>1.5&&r.score>(windowRide.best?.score||0))windowRide.best=r;
      if(r){scoutSheet=r.number;l.flash=1;l.last="Filed #"+r.number+" · "+r.title+(unit.filmStored?"":" · this session");}else l.last="Frame missed · try the shutter again";
      if(r&&onCall){l.last=houseLights.file(r,cameraMark,l.subject?.id)||l.last;if(!houseLights.stored)l.last+=" · this session";}
    }
    const canvas=$("scoutFinder"),w=Math.min(1100,innerWidth),h=Math.max(1,Math.round(w*innerHeight/innerWidth));
    if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const g=canvas.getContext("2d");
    BayScoutPrints.frame(g,w,h,{title:onCall?(l.flash>.01&&l.last||houseLights.guide(cameraMark,hours.minute)):l.last||(l.window?windowRide.brief.title:"Prado · Second Unit"),subject:l.subject?.title||"Street study",zoom:l.zoom,framed:!!l.subject,flash:l.flash,aspect:1.5,windowPan:l.window&&!isTop()?l.pan:null,time:streetTime});
    if(onCall&&l.trace&&houseLights.mark){
      if(!l.reference){l.reference=new Image();l.reference.src=houseLights.mark.image;}
      if(l.reference.naturalWidth){const width=Math.min(w,h*1.5),height=width/1.5;
        g.save();g.globalCompositeOperation="destination-over";g.globalAlpha=.30;g.drawImage(l.reference,(w-width)/2,(h-height)/2,width,height);g.restore();}
    }
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
    if(afternoon.active){signedNote(body,"Let’s finish our afternoon before we take a camera assignment.",driver);return;}
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
  function rideInvite(body){
    body.append(makeButton("You drive",car?"Pull up at a city curb and give your partner the wheel.":"Ask your partner for a lift around the city.","Pick a stop",()=>openPanel("ride-stops")));
  }
  function sharedCurb(v){
    const s=v&&windowCurb(v);
    return s&&dist(v,s)<2.8&&Math.cos(v.yaw-s.yaw)>.82&&BayCab.stopped(v)&&doorPlan(v,true,otherBody,-1)&&doorPlan(v,true,otherBody,1);
  }
  function rideFromHere(){
    if(!afternoon.active)return car?null:crewCarForCall();
    const v=car||enterable();
    return unitRoadCar(v)&&!v.path&&sharedCurb(v)&&(car?afternoon.seated&&afternoon.vehicle===v:afternoon.phase==="foot"&&dist(otherBody,v)<12)?v:null;
  }
  function rideMapStop(){
    if(!waypoint)return null;
    const road=chase.road(waypoint);
    if(road.county||dist(road,waypoint)>38||Math.abs(waypoint.x)>176||Math.abs(waypoint.z)>165)return null;
    const near={x:road.x+clamp(waypoint.x-road.x,-1,1),z:road.z+clamp(waypoint.z-road.z,-1,1)},stop=BayCab.streetStop(near,road);
    return stop?{title:waypoint.name||"Map pin",stop,road:["I’ve got your pin. Tell me if you see it first.","I see the turn. Keep an eye out on your side."],here:"This is the closest street. We can walk from here."}:null;
  }
  function rideStopSeen(place,arrived=false){
    if(!place.id)return false;
    const key="sundownBay.drives."+unit.other+"."+place.id;
    try{const seen=localStorage.getItem(key)==="1";if(arrived)localStorage.setItem(key,"1");return seen;}catch{return false;}
  }
  function rideStops(body){
    const r=windowRide,v=r?.vehicle||rideFromHere(),who=BaySecondUnit.names[unit.other];
    if(r?r.phase!=="park"||!r.social:!unit.met||!crewFree()||!v||(!car&&!windowCurb(hero))){
      signedNote(body,afternoon.active?"Pull up facing traffic at a city curb with both doors clear, or meet me on foot beside a parked car.":"Call me from a city sidewalk when my car’s parked in town.",who);return;
    }
    const pin=rideMapStop(),at=(r||afternoon.active)?v:hero;
    if(waypoint&&!pin)signedNote(body,"That pin is outside the city streets. Point me to a curb in town.",who);
    for(const place of [pin,...BayWindowSeat.places].filter(Boolean)){
      if(dist(at,place.stop)<14)continue;
      body.append(makeButton(place.title,place===pin?"Your map pin · nearest city curb":rideStopSeen(place)?"We’ve made this drive together.":district(place.stop),
        place===pin?"Follow pin":"Drive here",()=>chooseRideStop(place)));
    }
    body.append(makeButton("Choose on the city map","Mark a place, then pick your pin here.","Map",()=>openPanel("ride-map")));
  }
  function chooseRideStop(place){
    const r=windowRide;
    if(r){
      if(!r.social||r.phase!=="park"||dist(r.vehicle,place.stop)<14)return;
      r.brief=place;r.early=false;r.roll();closePanel();lastHud=lastMap=-10;return;
    }
    const v=rideFromHere();if(!v||!crewFree()||unit.transition)return;
    if(car){
      closePanel();switchCar();
      if(transfer?.exiting){afternoon.handoff={v,place};speak(BaySecondUnit.names[unit.other],"I’ll take the wheel. Meet you on the other side.");}
    }else startWindowRide(place,afternoon.active?v:null);
  }
  function startWindowRide(brief,shared=null){
    const v=shared||crewCarForCall(),curb=windowCurb(hero);
    if(afternoon.active&&!shared||!unit.met||!v||!curb||!crewFree()||!onStreetFeet()||unit.transition)return false;
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
    const start=windowCurb(v);saveCrewPlace();
    const waitingHere=shared||v===otherCar&&dist(hero,v)<8.5&&doorPlan(v,false,hero,1);
    const from=waitingHere?{...start,x:v.x,z:v.z,yaw:v.yaw,stand:{x:hero.x,z:hero.z}}:cabBerth(curb,null,v);
    if(shared)afternoon.reset();
    windowRide=new BayWindowSeat.Run(v,brief,from,start,path,v===otherCar);
    windowRide.berth=(stop,approaching)=>cabBerth(stop,approaching,v);
    active={job:brief.stop?{id:"partner-drive",name:"You drive",by:BaySecondUnit.names[unit.other]}:{id:"window-seat",name:"Window Seat",by:"Cine Luna"},windowRide:true};
    unit.eye=null;rainWalk.open=false;keys.clear();closePanel();lastHud=lastMap=-10;
    speak(BaySecondUnit.names[unit.other],shared?"Give me a second to get in. You’ve got the window.":"Stay by the curb. I'll come in the "+formatVehicle(v)+". You get the window.");
    return true;
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
    if(event==="boarded"){
      if(r.social)speak(driver,r.brief.title+"? Alright. Buckle up.");
      else{raiseWindowFinder();speak(driver,"Camera’s by the seat. The house wants "+r.brief.subject+" from the road.");}
    }
    if(event==="road"&&!r.cued)speak(driver,r.social?r.brief.road[unit.other==="frankie"?1:0]:r.brief.line);
    if(event==="mark"){speak(driver,r.brief.call);if(unit.eye&&!unit.eye.adjusted)aimPassenger();}
    if(event==="stopped"){
      unit.eye=null;resetPointer();cameraSnap();
      if(r.social){
        unit.remember(v,v,unit.other);unit.remember(unitFeet({...BayDriving.world(v,bayCarLayout(v.kind).track+.85,0),yaw:v.yaw},unit.lead),null);unit.save();
        if(!r.early)speak(driver,rideStopSeen(r.brief,true)?r.brief.again:r.brief.here);
      }else note(r.brief.title,r.early?"Pulling over.":(r.best?"Got the frame. ":"Want another pass? ")+"G goes around again. E steps out.",4);
    }
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
    }else if(finished&&r.social){
      const driver=BaySecondUnit.names[unit.other];
      if(doorPlan(v,true,otherBody,-1)){afternoon.start(v);note("An afternoon off",driver+" is coming with you.",3);}
      else speak(driver,"I’m boxed in on this side. I’ll wait in the car.");
    }else if(finished)note("Window Seat","The car is here whenever you want another run.",3);
    lastHud=lastMap=-10;
  }
  function windowInput(code){
    const r=windowRide;
    if(code==="KeyE"){
      if(r.phase==="ready"){
        if(r.board(hero,doorPlan(r.vehicle,false,hero,1))){keys.clear();lastHud=-10;}
        else note("Passenger seat","Walk up to the passenger door.",2.3);
      }else if(r.phase==="park"){if(doorPlan(r.vehicle,true,hero,1))r.pullOver(windowCurb);else note("Passenger door",r.social?"The curb is blocked. G picks another stop.":"The curb is blocked. G takes another pass.",3);}
      else if(r.phase==="ride"&&r.pullOver(windowLayby))speak(BaySecondUnit.names[unit.other],"Sure. I’ll find a curb.");
      return true;
    }
    if(code==="KeyG"&&r.phase==="park"){
      if(r.social)openPanel("ride-stops");else{r.early=false;r.roll();raiseWindowFinder();lastHud=-10;}return true;
    }
    if(!r.social&&code==="KeyP"&&(r.phase==="ride"||r.phase==="park")){if(unit.eye){unit.eye=null;resetPointer();cameraSnap();}else raiseWindowFinder();return true;}
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
    else if(r.social&&r.phase==="ride")contextHint("E",r.early?"Finding a curb":"Ask to pull over · Q / C look around");
    else if(r.social&&r.phase==="park")contextHint("E","Get out together · G pick another stop");
    else if(r.phase==="ride")contextHint(unit.eye?"Space":"P",unit.eye?"Shutter · F sight subject · Arrows aim · Z zoom · P lower":"Raise camera · E ask to pull over");
    else if(r.phase==="park")contextHint("E","Step out"+(r.best?" and collect the fee":"")+" · G another pass");
    else if(r.held)contextHint("",r.phase==="out"?"Stepping out":"Getting into the passenger seat");
    else contextHint("J",driver+" is "+(r.phase==="collect"?"on the way · "+Math.round(dist(r.vehicle,r.pickup))+" m":"getting the car"));
    return true;
  }
  function scoutPanel(body,sheet){
    if(sheet){
      const other=BaySecondUnit.names[unit.other];
      if(crewDeskNear()||houseLights.s.opened)body.append(makeButton("House Lights","Two exposures of the Cine Luna marquee from one camera mark.","Call sheet",()=>openPanel("house-lights")));
      appendAfternoonEntry(body);
      if(unit.met&&!afternoon.active)rideInvite(body);
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
  function houseLightsPanel(body){
    houseLights.refresh();const s=houseLights.s,desk=crewDeskNear();
    if(!s.release||s.shooting)signedNote(body,"Same marquee, same angle. One before supper and one after the bulbs come on. Leave the passing cars in. I want to see who was here.","Frankie Prado");
    if(!desk&&!s.opened)return;
    if(s.release){
      const proof=document.createElement("div");proof.className="luna-proof";
      const range=document.createElement("input");range.type="range";range.min="0";range.max="100";range.value="50";range.setAttribute("aria-label","Dissolve from daylight to house lights");
      for(const frame of [s.release.day,s.release.night]){const im=document.createElement("img");im.src=frame.image;im.alt=frame.title+" at "+BayHours.time(frame.minute);proof.append(im);}
      const caption=document.createElement("p");caption.className="luna-times";caption.textContent="Dissolve · "+BayHours.time(s.release.day.minute)+" to "+BayHours.time(s.release.night.minute);
      const dissolve=()=>{proof.children[1].style.opacity=String(Number(range.value)/100);};dissolve();range.oninput=dissolve;body.append(proof,range,caption);
    }
    if(!desk)body.append(makeButton("Cine Luna location desk","Outside the box office on Luna Boulevard.","Mark desk",()=>clockPin(unitPin)));
    if(s.shooting){
      if(s.day&&s.night){
        if(desk)body.append(makeButton("Thread both exposures","The projectionist will run a dissolve between the two takes.",save.houseFee?"Replace print":"Collect $140",()=>{
          if(!crewDeskNear()||!houseLights.deliver())return;
          payHouseFee();openPanel("house-lights",true);note("Cine Luna","House Lights is on the bill.",4);
        }));
      }else{
        const guide=document.createElement("p");guide.className="edition-copy";guide.textContent=[s.day?"Daylight filed":"Daylight · 7 AM to 6:30 PM",s.night?"Night filed":"House lights · 7:30 PM to 5:30 AM"].join("   /   ");body.append(guide);
        if(houseLights.mark){const m=houseLights.mark;body.append(makeButton("Your chalk mark","Return to the first camera position. Match the view and lens.","Mark map",()=>clockPin({x:m.x,z:m.z,name:"House Lights · Camera mark"})));}
        if(desk){
          const next=s.day?1200:s.night?540:BayHouseLights.period(hours.minute)==="day"?1200:540;
          body.append(makeButton(next===1200?"Wait for the late show":"Wait for the morning show","Stay at Frankie's desk until "+BayHours.time(next)+".","Wait here",()=>{if(!crewDeskNear()||!crewFree())return;hours.wake(next);saveTime();closePanel();note("Cine Luna",BayHours.time(next)+" · P raises the rangefinder.",3);}));
        }
      }
    }else if(desk){
      if(s.release&&!save.houseFee)body.append(makeButton("Collect the projection fee","Both negatives are in the booth.","Collect $140",()=>{if(crewDeskNear()){payHouseFee();openPanel("house-lights",true);}}));
      body.append(makeButton(s.release?"Shoot a new pair":"Take the assignment","Use P near the cinema. F sights the marquee, arrows compose and Space trips the shutter.",s.release?"New sleeve":"$140",()=>{
        if(!crewDeskNear()||!crewFree())return;houseLights.start();closePanel();note("Frankie Prado","Try the opposite sidewalk for the whole facade. P raises the rangefinder.",5);
      }));
    }
  }
  function payHouseFee(){
    if(!houseLights.s.release||save.houseFee)return;
    try{syncProgress(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
    if(save.houseFee)return;save.houseFee=true;save.wallet+=BayHouseLights.fee;save.paid++;persist();sound.cue("paid");lastHud=-10;
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
  const skateCarried=()=>!bell.pass&&!luggage.hand(save.luggage)&&!rainWalk.open&&rainWalk.amount<.02&&!save.airmail.bag&&!!save.skate.deck&&freeFeet()&&!roofs.action&&!wash.work&&!exchangingKey()&&!listening()&&!active?.field;
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
    returningGap(v,line,at){
      const road=line.sample(at),sn=Math.sin(road.yaw),cs=Math.cos(road.yaw),half=bayCarLayout(v.kind).halfLength;
      const reach=Math.min(22,line.length-at);let limit=Infinity;
      for(const signal of BayStreetArt.signals){
        const dx=signal.x-v.x,dz=signal.z-v.z,f=dx*sn+dz*cs;
        const stop=BayCrosswalk.setback(signal,half,8.1+half);
        if(Math.abs(dx*cs-dz*sn)<6.5&&f<32&&BayCrosswalk.beforeLine(signal,f,stop,stop,v.speed)&&BayCrosswalk.trafficWait(signal,streetTime,Math.abs(cs)>.7)){
          limit=Math.max(0,f-stop);break;
        }
      }
      const nearby=cars.concat(patrol,motos.all,transit.bus).filter(q=>q!==v&&
        (Math.abs(q.speed)>.5||q.path&&q.blocked<4)&&Math.abs(q.x-v.x)<29&&Math.abs(q.z-v.z)<29);
      if(!nearby.length)return limit;
      // Test the truck's swept lane around the bend, including the long rear body.
      // A coupe already turning out of sight of the headlights still has priority.
      for(let d=1;d<reach;d+=1.25){
        const p=line.sample(at+d);p.kind=v.kind;
        if(nearby.some(q=>Math.abs(q.x-p.x)<10&&Math.abs(q.z-p.z)<10&&Math.cos(q.yaw-p.yaw)>.65&&BayDriving.contact(p,q)))return Math.min(limit,Math.max(0,d-2.7));
      }
      return limit;
    },
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
    cartLane(v,a,b){
      const steps=Math.ceil(dist(a,b)/.32);
      for(let i=0;i<=steps;i++){
        const u=i/Math.max(1,steps),q={x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u};
        if(!valid(q.x,q.z,.23)||cars.some(c=>c!==v&&dist(c,q)<5.2&&BayDriving.clearance(c,q)<.26))return false;
      }
      return true;
    },
    say:(speaker,line)=>speak(speaker,line),
    paid(c,pay,grade){
      active=null;waypoint=null;save.wallet+=pay;save.paid++;persist();lastHud=lastMap=-10;sound.cue("paid");
      speak(c.name,c.thanks);note("Palm County Clinic",cash(pay)+" · Ride comfort "+grade+"/100 · Handoff signed",5);
    }
  };
  function sevenFree(){
    return play&&!active&&!heat&&!room&&!transfer&&!unit.transition&&!unit.eye&&!afternoon.photo&&!theatre.run&&!windowRide&&crewFree();
  }
  function engineTarget(){
    if(company.traveling||company.bookedHome)return car===engine7?company.roadGoal:{...engine7,name:"Engine 7 · Driver’s door"};
    if(car===engine7)return {...company.pumpStand,name:"Parked · Step outside"};
    if(company.holding)return {...company.call.stand,name:company.call.title};
    if(company.phase==="working")return {...company.mate,name:"Nel · Branch line"};
    return {...company.pumpStand,name:"Engine 7 · Pump panel"};
  }
  function engineGuide(){
    if(!active?.engineSeven||!company.manual||car!==engine7)return null;
    const line=company.line,n=line.closest(car,company.cursor);if(n.gap>13)return null;
    const points=[{x:car.x,z:car.z}];for(let a=n.at+3;a<line.length;a+=4)points.push(line.sample(a));points.push(company.goal);
    return {points,meters:line.length-n.at,turn:company.phase==="return"?"Take the east entrance into the engine shed":"Respond to "+company.call.title};
  }
  function engineReward(player){
    const c=company.call;
    if(player){
      syncProgress(readSave());const book=save.engineSeven;
      const precision=clamp(company.hits/Math.max(1,company.spent*.026),0,1);
      const seconds=Math.round(company.workTime),gallons=Math.round(company.spent),score=Math.round(55+32*precision+13*clamp(1-seconds/110,0,1));
      const fee=book.records[c.kind]?45+Math.round(score/10):105;
      const record={kind:c.kind,title:c.title,day:hours.day+1,seconds,gallons,score,fee,serial:book.number+1,crew:BaySecondUnit.names[unit.lead]+" / Nel Baptiste"};
      company.returnSlip=record.serial;
      book.number++;book.rev++;book.log.push(record);book.log=book.log.slice(-6);book.records[c.kind]=Math.max(book.records[c.kind]||0,score);
      save.wallet+=fee;save.paid++;persist();sound.cue("paid");
      broadcastDesk.queue.unshift("Gantry watch reports all clear at "+c.title+". Nel Baptiste has the line back on Seven.");
      note("Engine 7 · All clear",cash(fee)+" · "+score+"/100 · Return slip in your daybook",4);
    }
    if(active?.engineSeven){active=null;lastHud=lastMap=-10;waypoint=null;}
    company.cooledAt=elapsed;if(dist(pos(),c)<26)speak(c.owner,c.thanks);
  }
  function returnEngineKeys(){
    syncProgress(readSave());
    const book=save.engineSeven,record=book.log.find(r=>r.serial===company.returnSlip&&r.kind===company.call.kind);
    if(record&&!record.homeDriver){
      record.homeDriver=BaySecondUnit.names[unit.lead];book.rev++;save.wallet+=40;persist();sound.cue("paid");
      note("Station Seven","$40 · "+record.homeDriver+" signed Seven back into the bay",5);
    }
    company.returnSlip=null;company.bookedHome=false;company.joined=false;company.startDock(false);
    active=null;waypoint=null;lastHud=lastMap=-10;
    speak("Nel Baptiste","Right on the marks. Keys on the hook, I’ll put the kettle on.");
  }
  const sevenEnv={
    ...rescueEnv,driving:()=>car===engine7,transition:()=>transfer?.v===engine7,
    axis:()=>Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft")),
    spray:()=>held("Space")&&!panel,
    clearJet(a,b){
      const site=company.call;
      if(this.coverSite!==site){
        this.coverSite=site;this.cover=solids.filter(o=>(o.x!==site.x||o.z!==site.z)&&Math.abs(o.x-site.x)<15+o.w*.5&&Math.abs(o.z-site.z)<15+o.d*.5);
      }
      if(BayCamera.safeFraction(a,b,this.cover)<.98)return false;
      const nearby=cars.filter(v=>Math.abs(v.x-site.x)<16&&Math.abs(v.z-site.z)<16);
      const steps=Math.max(2,Math.ceil(dist(a,b)/.44));
      for(let i=1;i<steps;i++){const f=i/steps,p={x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f};
        if(nearby.some(v=>BayDriving.clearance(v,p)<.03))return false;}
      return true;
    },
    delay:()=>panel==="engine-house"||panel==="engine-book"||company.reserved!==null&&company.age<90,
    walkway:(a,b,v)=>recoveryWalkway(a,b,v,[company.call.stand,company.call.safe],cars.filter(c=>c!==v&&dist(c,b)<12&&!c.path)),
    line:speak,done:engineReward
  };
  function sevenStep(dt){
    const c=company;
    if(active?.engineSeven&&(heat||!c.manual&&!c.holding&&!car&&dist(hero,c.call)>140&&dist(hero,engine7)>85)){dropJob();}
    if(c.bookedHome&&active?.engineSeven&&!car&&!transfer&&dist(hero,engine7)>48)dropJob();
    if(c.phase==="standby"&&c.reserved!==null&&car!==engine7&&transfer?.v!==engine7){
      if(!panel&&sevenFree()&&onStreetFeet()&&dist(hero,BayEngineSeven.desk)<11)signForEngine(c.reserved);
      else if(c.age>=90)c.reserved=null;
    }
    const before=c.phase;c.step(dt,sevenEnv);
    if(c.bookedHome&&car===engine7&&!transfer&&c.manual&&Math.abs(car.speed)>1){
      if(c.homeLine<2&&dist(car,fireHouse)<26){
        c.homeLine=2;speak("Nel Baptiste","Amber’s the bay. When the bottom lamp goes green, set the brake.");
      }else if(!c.homeLine&&dist(car,c.call)>24){
        c.homeLine=1;
        const line={linen:"My first week here, Ema sewed my name in my coat. Still in there, same blue thread.",oven:"Pilar used to send us the burnt rolls. Said we knew what to do with them.",rope:"Teo carved a float for my little girl. She keeps it on the end of her bed."};
        speak("Nel Baptiste",line[c.call.kind]);
      }
    }
    if(before==="working"&&c.phase==="stow"&&c.returnSlip&&dist(hero,c.v)<14)note("Nel Baptiste","Want the drive back? Meet me at the cab while I put the hose away.",6);
    if(before==="standby"&&c.phase==="outbound")broadcastDesk.queue.unshift("Traffic desk · Engine 7 is responding to "+c.call.title+". Watch for the red cab at the crossings.");
    if(before==="return"&&c.phase==="standby"&&c.reserved!==null)note("Station Seven","Your driver’s seat is ready at the Gantry Street board.",5);
    if(c.holding&&!onStreetFeet())c.handBack();
    if(c.holding){
      const aim=BayDriving.world(hero,.24,.46);c.hand={...aim,y:hero.y+1.04};
      motion.handTarget={x:.24,y:1.04,z:.4,weight:1};
    }else if(c.hand){c.hand=null;motion.handTarget=null;}
  }
  function sevenNear(){
    if(!onStreetFeet()||room||transfer||unit.eye||unit.transition||afternoon.photo||theatre.run)return "";
    const c=company;
    if((!active||active.engineSeven)&&!heat){
      if(c.phase==="stow"&&c.returnSlip&&!c.bookedHome&&dist(hero,c.v)<6)return "return-keys";
      if(c.phase==="working"&&(dist(hero,c.mate)<2.5||dist(hero,c.pumpStand)<2.8))return "line";
      if(dist(hero,BayEngineSeven.desk)<2.45)return "desk";
      if((c.burning||c.recent)&&dist(hero,c.owner)<2.55)return "owner";
      if(sevenWitness())return "daybook";
    }
    return "";
  }
  function joinSeven(){
    if(active&&!active.engineSeven)return false;
    active={engineSeven:true,job:sevenJob};company.joined=true;lastHud=lastMap=-10;return true;
  }
  function signForEngine(i){
    company.reserved=null;company.dispatch(i,true);joinSeven();
    speak("Nel Baptiste","Keys are in Seven. I’ll call the block when we turn onto it.");
  }
  function sevenWitness(){
    return company.owners.find((o,i)=>dist(hero,o)<2.35&&save.engineSeven.log.some(r=>r.kind===BayEngineSeven.calls[i].kind));
  }
  function engineKey(code){
    const c=company,near=sevenNear();
    if(c.holding){
      if(code==="KeyE"){c.handBack();if(active?.engineSeven){c.joined=false;active=null;}keys.clear();lastHud=-10;speak("Nel Baptiste","I’ve got the line.");return true;}
      if(code==="KeyF"&&dist(hero,c.pumpStand)<3&&c.tank<319){c.tank=320;note("Engine 7","Reserve tank ready",2);return true;}
      if(code==="Space"||code==="KeyF"||code==="KeyY"||code==="KeyG"||code==="KeyT"||code==="KeyL"||code==="KeyN")return true;
    }
    if(active?.engineSeven&&car===engine7){
      if(code==="KeyH"&&c.phase==="outbound"){if(c.manual)engine7.responseLights=!engine7.responseLights;lastHud=-10;return true;}
      if(code==="KeyF"&&c.bookedHome&&c.manual&&c.inHomeBay()){returnEngineKeys();return true;}
      if(code==="KeyF"&&c.canPark()){c.startDock(true);lastHud=-10;speak("Nel Baptiste","I’ll bring the line round. Meet me by the smoke.");return true;}
    }
    if(code!=="KeyF")return false;
    if(near==="return-keys"&&sevenFree()&&joinSeven()){
      c.bookedHome=true;c.homeLine=0;speak("Nel Baptiste","Take Seven in through the east door on Gantry and face her west between the floor marks. Forty on the slip.");return true;
    }
    if(near==="desk"){openPanel("engine-house");return true;}
    if(near==="daybook"){
      const witness=sevenWitness(),place=BayEngineSeven.calls[company.owners.indexOf(witness)];
      speak(witness.name,place.thanks);sevenPage=save.engineSeven.log.findLastIndex(r=>r.kind===place.kind);openPanel("engine-book");return true;
    }
    if(near==="owner"){
      if(c.burning){speak(c.call.owner,c.call.first);waypoint={...c.call.stand,name:"Engine 7 · "+c.call.title,kind:"company-call"};}
      else speak(c.call.owner,c.call.thanks);
      lastMap=-10;return true;
    }
    if(near==="line"&&!c.holding&&(active?.engineSeven||sevenFree())&&joinSeven()){
      c.claim();keys.clear();lastHud=-10;
      speak("Nel Baptiste","You’ve got the branch. Face the smoke, squeeze, and sweep it across.");
      return true;
    }
    return false;
  }
  function engineHint(){
    const c=company,near=sevenNear();
    if(near==="return-keys")return ["F","Take the keys · Drive Seven home · $40"];
    if(c.bookedHome&&active?.engineSeven){
      if(c.phase==="stow")return ["","Nel is putting the hose away"];
      if(car!==engine7)return ["E","Take the wheel for the drive home"];
      return c.inHomeBay()?["F","Set the brake and sign Seven back in"]:["",dist(engine7,fireHouse)<18?"Face west between the floor marks":"Return Engine 7 to Gantry Street"];
    }
    if(c.holding){
      if(!c.tank)return ["F","Reserve tank · Walk to the pump panel"];
      const q=BayDriving.local(c.call,hero.x,hero.z);
      return ["Space",q.z>-.72||dist(hero,c.call)>13||c.obstructed?"Walk around to the smoky side · E hand line back":"Hold to spray · Mouse or A / D to sweep · "+Math.round(c.tank)+" gal · E hand line back"];
    }
    if(active?.engineSeven&&car===engine7)return c.working?["E","Step out · Meet Nel at the line"]:c.canPark()?["F","Set the pump brake"]:["H","Response lights "+(engine7.responseLights?"on":"off")+" · Head for "+c.call.title];
    if(active?.engineSeven&&c.seatWaiting&&dist(hero,engine7)<6.4)return ["E","Board Engine 7 · Driver’s seat"];
    if(near==="line")return ["F","Take the branch line from Nel"];
    if(near==="desk")return ["F","Station Seven · Company board"];
    if(near==="daybook")return ["F",sevenWitness().name+" · Read your call slip"];
    if(near==="owner")return ["F","Talk to "+c.call.owner];
    if(active?.engineSeven)return c.seatWaiting?["E","Take the driver’s seat in Engine 7"]:["",c.phase==="unroll"?"Give Nel room to run out the line":"Meet Nel beside the smoke"];
    if(!active&&!heat&&car&&engine7.responseLights&&c.traveling&&dist(car,engine7)<36)return ["","Engine 7 coming through · Leave room at the curb"];
    if(!active&&!heat&&c.burning&&dist(pos(),c.call)<13)return ["",c.phase==="outbound"?"Smoke at "+c.call.title+" · Seven is on the way":"Engine 7 on scene · Meet Nel beside the line"];
    return null;
  }
  function engineBoard(body,book){
    const c=company,saveBook=save.engineSeven;
    if(book){
      const record=saveBook.log[sevenPage]||saveBook.log.at(-1);if(!record)return;
      const page=document.createElement("canvas");page.className="company-return";page.setAttribute("role","img");
      page.setAttribute("aria-label",record.title+" · "+record.crew+" · "+record.score+"/100 · "+record.gallons+" gallons");BayEngineHouseArt.docket(page,record);body.append(page);
      if(saveBook.log.length>1)body.append(makeButton("Earlier return slips","The last six signed calls.","Turn page",()=>{sevenPage=(sevenPage+saveBook.log.length-1)%saveBook.log.length;openPanel("engine-book",true);}));
      return;
    }
    if(c.phase==="standby"&&sevenFree()){
      signedNote(body,"Pick a radio call and take the driver’s seat. Nel rides alongside. At the smoking cart, stop by the curb and press F to set the pump brake.","Station Seven · Duty board");
      for(const [i,call] of BayEngineSeven.calls.entries()){
        body.append(makeButton(call.title,call.owner+" · "+district(call)+(saveBook.records[call.kind]?" · Best "+saveBook.records[call.kind]+"/100":""),"Take the wheel",()=>{
          if(c.phase!=="standby"||!sevenFree())return;closePanel();signForEngine(i);
        }));
      }
    }else{
      signedNote(body,c.phase==="standby"?"Engine 7 is on the apron.":c.phase==="return"||c.phase==="stow"?"The smoke is down. Seven is coming back in.":"Engine 7 is out on "+c.call.title+". You can meet Nel on foot and take the line.","Gantry Street watch");
      if(c.burning)body.append(makeButton(c.call.title,c.call.owner+" · "+district(c.call),"Mark the call",()=>clockPin({...c.call.stand,name:c.call.title,kind:"company-call"})));
      if(!active&&c.phase!=="standby")body.append(makeButton(c.reserved===null?"Reserve the next driver’s seat":"Release the driver’s seat",
        c.reserved===null?"Seven’s next run is "+BayEngineSeven.calls[c.next].title+". Meet the crew at this board when they return.":"The regular driver can take the next run.",
        c.reserved===null?"Sign up":"Cancel",()=>{c.reserved=c.reserved===null?c.next:null;closePanel();if(c.reserved!==null)clockPin(BayEngineSeven.desk);}));
    }
    if(saveBook.log.length)body.append(makeButton("Company daybook",saveBook.log.at(-1).title,"Read slip",()=>{sevenPage=saveBook.log.length-1;openPanel("engine-book");}));
    if(active?.engineSeven)body.append(makeButton("Return the shift","The regular crew will finish the call.","Sign off",()=>{closePanel();dropJob();}));
  }
  function sevenScene(c){
    if(c===company.call&&company.burning)return "call";
    if(c===company.recent&&elapsed-company.cooledAt<15)return "cool";
    return save.engineSeven.log.some(r=>r.kind===c.kind&&r.day===hours.day+1)?"marked":"quiet";
  }
  function engineCrewModel(p,style){
    const phase=p.speed>.16?Math.floor(p.stride*4)%6:0,id="company/"+style+"/"+phase;
    model(id,g=>{
      buildBayPerson(g,style==="mate"?"#925e48":"#b38668","#66634e","#424e52",phase*Math.PI/3,"local",0);
      g.cyl(0,1.725,.008,.149,.155,.045,9,style==="mate"?"#bc9550":"#e0c9a1");g.cyl(0,1.789,-.012,.111,.127,.10,8,style==="mate"?"#caa45a":"#e1d2ae");
      g.box(0,1.052,.005,.364,.034,.218,"#dbc476");
    });return id;
  }
  function drawSeven(list,see,t){
    const c=company,s=BayEngineSeven.house;
    if(see(s,115))BayEngineHouseArt.world(list,model,s,t,c.phase!=="standby",c.bayLamp);
    for(const [i,place] of BayEngineSeven.calls.entries()){
      const phase=sevenScene(place);if(!see(place,phase==="call"?124:70))continue;
      BayEngineSceneArt.world(list,model,place,phase==="call"?c.levels:null,t,phase);
      const a=c.owners[i];if(see(a,58))list.push([personSkin([2,4,1][i],"local",a.speed>.2?Math.floor(a.stride*3.8)%6:0,phase==="call"?1:0),a.x,footLevel(a.x,a.z),a.z,a.yaw]);
    }
    if(!see(engine7,110))return;
    const ground=footLevel(engine7.x,engine7.z)+.01;
    BayEngineSevenArt.beacons(list,model,roadBody(engine7),ground,t);
    const m=c.mate;
    if(m.seat<1&&see(m,68)){
      const y=footLevel(m.x,m.z)+m.seat*.64;list.push([engineCrewModel(m,"mate"),m.x,y,m.z,m.yaw]);
    }
    for(const [side,visible] of [[-1,car!==engine7&&!c.seatWaiting],[1,m.seat===1]]){
      if(!visible||!see(engine7,44))continue;
      const p=BayDriving.world(engine7,side*.51,1.38);
      model("company/seated/"+side,g=>{g.box(0,1.49,0,.38,.54,.25,"#686952");g.cyl(0,1.85,0,.112,.12,.25,8,side<0?"#ad8266":"#926349");g.cyl(0,2.01,0,.14,.16,.065,8,"#c6a566");});
      list.push(["company/seated/"+side,p.x,ground,p.z,engine7.yaw]);
    }
    const hand=c.holding?c.hand:c.phase==="working"?{...BayDriving.world(m,.15,.38),y:footLevel(m.x,m.z)+1.03}:null;
    if(hand){
      BayEngineSceneArt.hose(list,model,c.socket,hand,t);
      model("seven-nozzle",g=>{
        g.pole([0,0,-.13],[0,0,.23],.039,"#927447",7);g.pole([0,0,.15],[0,0,.26],.046,"#4b5a53",8);
        g.pole([-.044,0,-.034],[-.044,.08,.021],.014,"#ac6544",5);g.pole([-.044,.08,.021],[.044,.08,.021],.014,"#ac6544",5);
      });
      list.push(["seven-nozzle",hand.x,hand.y,hand.z,c.holding?hero.yaw:m.yaw]);
    }
    if(c.water)BayEngineSceneArt.water(list,model,c.water.from,c.water.to,t);
  }

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
        const line=BayCrosswalk.setback(s,1.15,6.3);
        if(BayCrosswalk.beforeLine(s,d,line,6.3,b.speed)&&d<22&&Math.abs(dx*z-dz*x)<3.6&&BayCrosswalk.waiting(s,streetTime,vertical))speed=Math.min(speed,Math.max(0,(d-line)*1.22));
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
    motos.kit=worn();
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
      const ctx=dash.getContext("2d");ctx.clearRect(0,0,w,h);if(motos.pilot&&Math.abs(motos.pan)<1.3){ctx.save();ctx.translate(-Math.sin(motos.pan)*w*.68,Math.sin(motos.tilt)*h*.74);BayMotorcyclesArt.cockpit(ctx,motos.bike,w,h,t,{night:hours.night,kit:worn(),mirrors:motoMirrors.images});ctx.restore();}
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
    if(e?.ready&&(e.from===a||e.to===a))return {role:a===hero?"player":a.role,action:e.from===a?"give":"receive",from:e.from,to:e.to,progress:e.at,kit:a===hero?worn():null};
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
      const o=BayPalmRoom.poseOptions(palm,a,worn(),personColors),id=o.role==="guest"?a.id:o.role;
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
      const stop=BayCrosswalk.setback(s,4.8,11.1);
      if(BayCrosswalk.beforeLine(s,d,stop,11.1,v.speed)&&d<30&&Math.abs(x*cs-z*sn)<4.5&&BayCrosswalk.trafficWait(s,streetTime,Math.abs(cs)>.7)){
        space=Math.min(space,Math.max(0,d-stop));pass=false;
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
          s.style==="lark"&&save.catchBook.total?"Dad wrote your fish in his book. He measures them twice, you know.":
          s.style==="lark"&&save.shore.returned.includes("lure")?"Dad’s out on Marlin Pier. Tell him who found my red lure. He’s got another one in the tackle box.":
          s.style==="lark"&&!save.shore.helps[s.style]?"Dad’s fishing off Marlin Pier. Look for the green bench out at the end.":save.shore.helps[s.style]?s.thanks:s.line;
        speak(person.name,line);return true;
      }
    }return false;
  }
  let corkPage=null,calMesh=null,calMotion=null;
  let spurDesk=null;
  function stationNear(){
    if(!onStreetFeet()||active||heat||unit.eye||afternoon.active)return null;
    return [BayPortSpur.west,BayPortSpur.east].find(s=>dist(s.desk,hero)<2.7);
  }
  function spurPanel(b){
    const s=spurDesk,book=save.freight;
    if(active?.freight)b.append(makeButton("Hand back the waybill","Len will finish the movement. Step down at either platform.","Leave shift",()=>{dropJob();closePanel();}));
    signedNote(b,s===BayPortSpur.east?"“Bring the empties back to the cold store. Line up the van with the yellow edge and I’ll take the slip.”":
      "“Nine takes block ice to Rosario’s side of the market. The van rides behind you. Spot it against the yellow edge for the unload.”",s===BayPortSpur.east?"Teo Barral":"Emi Soto");
    if(s&&stationNear()===s)b.append(makeButton("Sign the waybill",s.freight+" to "+(s===BayPortSpur.west?BayPortSpur.east:BayPortSpur.west).name+" · $65–115","Take shift",()=>{
      if(stationNear()!==s||!spur.order(s))return;
      active={freight:true,job:{id:"belt",name:"Port Sol Belt",by:"Emi Soto"},stops:[]};waypoint=null;closePanel();
      note("Waybill signed",spur.at===s?"Use E at the cab step.":"Nine is working its way to your platform.",3);lastHud=lastMap=-10;
    }));
    for(const st of [BayPortSpur.west,BayPortSpur.east])if(st!==s)b.append(makeButton(st.name,"Freight platform and crew board.","Mark platform",()=>clockPin(st.desk)));
    if(book.runs){const p=document.createElement("p");p.className="panel-copy";p.textContent=book.runs+(book.runs===1?" signed delivery":" signed deliveries")+" · Best spot "+book.best+"/100 · Last delivery to "+BayPortSpur.station(book.destination).name;b.append(p);}
  }
  function spurKey(code){
    if(spur.transfer)return !["Escape","KeyR"].includes(code);
    if(spur.aboard){
      if(code==="KeyE"){if(!spur.dismount())note("Cab step","Step down when Nine is standing at a platform.",2);return true;}
      if(code==="KeyG"){if(spur.trip?.phase==="drive"&&!spur.tripBrake())note("Reverser","Stop before changing direction.",2);return true;}
      if(code==="KeyF"){if(spur.trip?.phase==="drive"&&!spur.handOver())note("Waybill","Stop within one metre of the wagon mark.",2);return true;}
      return !["Escape","KeyJ","KeyM","KeyR","KeyX"].includes(code);
    }
    const s=code==="KeyF"&&stationNear();
    if(s){spurDesk=s;save.freight.known=true;persist();openPanel("port-belt");return true;}
    if(code==="KeyE"&&(!active||active.freight)&&!heat&&onStreetFeet()&&!afternoon.active&&!unit.eye&&spur.board(hero)){keys.clear();motion.reset();return true;}
    return false;
  }
  function spurOccupied(x,z,crossing){
    // Only bodies in the swept corridor hold a movement. Vehicles already across
    // the stop line can finish clearing the track while the warning is active.
    const width=crossing?5.6:1.45,depth=crossing?1.7:1.12;
    const body=v=>{
      if(Math.abs(v.x-x)>width+6||Math.abs(v.z-z)>depth+6)return false;
      const box=v.footprint||bayCarLayout(v.kind),sn=Math.abs(Math.sin(v.yaw)),cs=Math.abs(Math.cos(v.yaw));
      return Math.abs(v.x-x)<width+sn*box.halfLength+cs*box.track&&Math.abs(v.z-z)<depth+cs*box.halfLength+sn*box.track;
    };
    if(cars.some(body)||patrol.some(body)||body(transit.bus)||motos.all.some(body))return true;
    const person=p=>Math.abs(p.x-x)<width+.26&&Math.abs(p.z-z)<depth+.26;
    return (!room&&!spur.aboard&&!spur.transfer&&!car&&!skiff&&person(hero))||walkers.some(w=>!w.palmPassenger&&person(w));
  }
  function stepSpur(dt){
    const moving=spur.transfer;
    const event=spur.step(dt,{gas:held("KeyW","ArrowUp"),brake:held("KeyS","ArrowDown","Space")},spurOccupied);
    if(Math.floor(spur.clock*1.65)!==Math.floor((spur.clock-dt)*1.65)&&!room){
      for(const g of spur.gates)if(g.warning&&dist(pos(),g)<47)sound.cue("belt-crossing",{distance:dist(pos(),g)});
    }
    if(moving){
      const f=moving.f,k=f*f*(3-2*f),a=moving.start,b=moving.end;
      Object.assign(hero,{x:a.x+(b.x-a.x)*k,z:a.z+(b.z-a.z)*k,y:a.y+(b.y-a.y)*k+.12*Math.sin(f*Math.PI),yaw:spur.engine.yaw});motion.step(dt,0,0);
      if(event==="off"){resetFeet();cameraSnap();lastHud=lastMap=-10;}
      if(event==="on"){
        cameraRig.recenter(spur.engine.yaw-.62,elapsed);cameraRig.manualAim=true;lastHud=lastMap=-10;
        speak("Len Grant",spur.trip?"You’ve got Nine. Hold V to sight the wagon when we get there.":"Ride along. I’ll give you a minute at the other end.");
      }
    }
    if(spur.aboard&&!spur.transfer){
      Object.assign(hero,spur.seat());
      motion.ride??={side:-1,seat:1,seatY:.42,floor:0,inner:1,outer:1,duck:0,latchDip:0,pull:0,reach:0,twist:0,steer:0,handle:[0,0,0]};
      motion.ride.passenger=!spur.trip;motion.step(dt,0,0);
    }
    if(event&&typeof event==="object"){
      const book=save.freight;book.runs++;book.best=Math.max(book.best,event.score);book.last=event.score;book.destination=event.target;
      save.wallet+=event.pay;save.paid++;persist();active=null;sound.cue("paid");lastHud=lastMap=-10;
      note("Waybill signed · "+cash(event.pay),"Wagon spot "+event.score+"/100 · "+BayPortSpur.station(event.target).name,4);
    }
  }
  function spurHint(){
    if(spur.transfer)return ["",spur.transfer.out?"Stepping down":"Climbing into No. 9"];
    if(spur.aboard){
      const r=spur.trip;
      if(r?.phase==="unload")return ["","Unloading the ice car"];
      if(r?.phase==="drive")return Math.abs(r.target.x-spur.x)<2?["F","Sign at the mark · S brake · G reverse when stopped"]:["W/S","Power / brake · G reverse when stopped"];
      return spur.at?["E","Step down at "+spur.at.name]:["","Riding No. 9 · Next stop "+spur.destination.name];
    }
    const canBoard=spur.at&&(!active||active.freight)&&onStreetFeet()&&dist(hero,spur.cabStep())<3.45&&(!spur.trip||spur.at===spur.trip.start);
    const s=stationNear();if(s)return ["F","Crew board · "+s.name+(canBoard?" · E ride No. 9":"")];
    if(canBoard)return ["E",spur.trip?"Take the controls of No. 9":"Ride the Port Sol Belt"];
    if(car&&!active&&spur.gates.some(g=>g.warning&&Math.abs(car.x-g.x)<7&&Math.abs(car.z-g.z)<18))return ["","Rail crossing · Wait for both gates to rise"];
    return null;
  }
  function corkNear(){
    if(active||heat||!onStreetFeet()||unit.eye||afternoon.active||neighbors.chat)return null;
    return BayRedCork.sites.find(s=>dist(s,hero)<2.75||s.id==="marlin"&&dist(hero,BayRedCorkArt.cal)<1.9);
  }
  function visitCork(site){
    corkPage=site;save.catchBook.known=true;persist();openPanel("red-cork");
  }
  function corkPanel(b){
    const site=corkPage,near=site&&corkNear()===site,book=save.catchBook;
    signedNote(b,site?.id==="cut"?"“The short cast works the grass. Put it out past twelve metres and you’re over the channel.”":
      save.shore.returned.includes("lure")?"“Lark says you found my cedar plug. I cut you one too. Go on, try it.”":
      "“See those little silver backs? Drop the cork near them. When it goes under, lift. Give the fish line when it runs.”","Cal Bennett");
    if(near)b.append(makeButton("Borrow the cork rod","A/D aim. Hold Space to wind up, then release to cast.","Take rod",()=>{
      if(corkNear()!==site)return;
      const r=new BayRedCork.Cast(site,save.shore.returned.includes("lure"));r.walkIn=true;
      active={angling:r,job:{id:"red-cork",name:"Red Cork Club",by:"Cal Bennett"},stops:[],index:0};
      waypoint=null;closePanel();keys.clear();motion.reset();$("toast").hidden=true;lastHud=lastMap=-10;
    }));
    for(const s of BayRedCork.sites)if(!near||s!==site)b.append(makeButton(s.name,s.id==="cut"?"Cal’s spare tackle sits on the landing by the oyster beds.":"Find Cal’s green measuring bench at the seaward end.","Mark pier",()=>clockPin({...s,name:s.name+" · Red Cork Club"})));
    const record=document.createElement("p");record.className="panel-copy";
    record.textContent=book.total+" tagged and released";b.append(record);
    for(const id of Object.keys(BayRedCork.fish))if(book.best[id])b.append(BayRedCorkArt.card(book,id));
  }
  function corkKeys(code){
    const r=active?.angling;
    if(!r){const s=code==="KeyF"&&corkNear();if(s){visitCork(s);return true;}return false;}
    if(code==="KeyE"){dropJob();return true;}
    if(code==="Space"&&!r.walkIn){r.press();lastHud=-10;return true;}
    return !["Escape","KeyJ","KeyM","KeyR"].includes(code);
  }
  function stepCork(dt){
    const r=active.angling,s=r.site;
    if(heat){dropJob();return;}
    if(r.walkIn){
      const dx=s.x-hero.x,dz=s.z-hero.z,d=Math.hypot(dx,dz),stride=Math.min(d,2*dt);
      if(d>.05){hero.x+=dx/d*stride;hero.z+=dz/d*stride;hero.yaw=Math.atan2(dx,dz);motion.step(dt,2,0);return;}
      r.walkIn=false;hero.x=s.x;hero.z=s.z;hero.y=footLevel(s.x,s.z);motion.reset();
    }
    const caught=r.step(dt,streetTime,Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft")),held("Space"));
    hero.yaw=s.yaw+r.aim;motion.console=BayRedCorkArt.grip(r,streetTime,r.phase==="fight"&&held("Space"));motion.step(dt,0,0);
    if(caught){
      const book=save.catchBook,record=(book.best[caught.id]||0)<caught.length;
      const pay=BayRedCork.record(book,caught);save.wallet+=pay;save.paid++;persist();
      r.clock=0;sound.cue("paid");note(record?"New entry on Cal’s board":"Red Cork Club",BayRedCork.fish[caught.id].name+" · "+caught.length+" cm · Tag fee +"+cash(pay),3);
    }
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
    if(active?.campana)return dist(hero,iceVan)<5.1?iceVan:null;
    if(active?.engineSeven)return company.manual&&company.traveling&&dist(hero,engine7)<6.4?engine7:null;
    if(active?.rescue)return rescue.access()&&dist(hero,unit4)<5.7?unit4:null;
    if(swim||cabs.playerHeld||cycles.riding||boardwalk.player)return null;
    let best=null,d=5.1;
    for(const v of cars){const n=dist(hero,v);if(!v.impactSlide&&v!==otherCar&&gull.keyFor(v)&&v!==gull.reclaim?.v&&!v.meetCar&&!v.serviceCar&&!v.washGuest&&!v.onLift&&!v.recoveryOwner&&!roadDrivers.get(v)?.seated&&recovery.onBench?.car!==v&&valet.accessible(v)&&(!active?.valet||valet.focus?.car===v)&&!["return","approach","in","out"].includes(v.owner?.phase)&&n<d&&(!v.path||v.speed<4)){best=v;d=n;}}
    return best;
  }
  function returnJuneDemo(){
    if(save.juneReturned||!save.tapes.includes(0))return false;
    save.juneReturned=true;save.wallet+=35;persist();
    sound.cue("paid");note("Motel demo","June slipped you $35.",3.4);
    return true;
  }
  function neighborFree(){
    return crewFree()&&!unit.eye&&!unit.transition&&!afternoon.photo&&!windowRide&&!green.run&&!coffee.stage&&!bell.open&&!bell.pass&&!luggage.hand(save.luggage)&&
      !(save.campana.hand&&!car)&&(!car||Math.abs(car.speed)<3.4);
  }
  function seesNeighbor(p){
    const a=car||hero;
    return BayCamera.safeFraction({x:a.x,z:a.z,y:footLevel(a.x,a.z)+1.45},
      {x:p.x,z:p.z,y:footLevel(p.x,p.z)+1.48},chase.cover)>=.995;
  }
  function personPin(p){return {x:p.x,z:p.z,kind:"neighbor",id:p.neighbor.id,name:p.name};}
  function nearestNeighbor(){
    const a=car||hero,r=car?8.5:5.6,p=waypoint?.kind==="neighbor"&&neighbors.byId(waypoint.id);
    return p&&neighbors.available(p)&&dist(a,p)<r&&seesNeighbor(p)?p:neighbors.closest(a,r,seesNeighbor);
  }
  function neighborStep(){
    const a=car||hero,free=neighborFree(),lead=unit.lead;
    if(localVoice&&(!free||dist(a,localVoice)>11||elapsed>speechTill||elapsed>=voiceCheck&&!seesNeighbor(localVoice))){
      localVoice=null;$("neighborTag").hidden=true;$("hud").classList.toggle("neighbor-speech",false);
    }
    if(localVoice&&elapsed>=voiceCheck)voiceCheck=elapsed+.2;
    if(helloPose){helloPose.age=streetTime-helloPose.at;if(helloPose.age>helloPose.duration||!free||!!car!==(helloPose.kind==="driver"))helloPose=null;}
    const prior=neighbors.chat?.p;
    const visited=neighbors.step(streetTime,a,lead,car,free,seesNeighbor);
    if(prior&&prior!==neighbors.chat?.p)prior.neighborTalking=false;
    if(neighbors.chat){
      const p=neighbors.chat.p;p.neighborTalking=true;
      if(!p.neighborPose||p.neighborPose.kind!=="point")p.neighborFace=Math.atan2(a.x-p.x,a.z-p.z);
    }
    if(visited){
      if(waypoint?.kind==="neighbor-place"&&waypoint.id===visited.neighbor.id)waypoint=null;
      note(visited.neighbor.place,visited.name+"’s recommendation · Saved in Word of mouth",3.1);lastMap=lastHud=-10;
    }
  }
  function neighborKey(code){
    if(!["KeyN","Digit1","Digit2","Numpad1","Numpad2"].includes(code)||!neighborFree())return false;
    const a=car||hero,c=neighbors.chat,lead=unit.lead;
    if(code==="KeyN"){
      const p=nearestNeighbor();if(!p)return false;
      if(c)c.p.neighborTalking=false;
      if(waypoint?.kind==="neighbor"&&waypoint.id===p.neighbor.id)waypoint=null;
      const kind=car?"driver":"wave";helloPose={kind,at:streetTime,age:0,duration:BayNeighborGestures.duration(kind),bearing:Math.atan2(p.x-a.x,p.z-a.z)};
      const line=neighbors.greet(p,lead,a,car,streetTime);
      p.neighborTalking=true;speak(p.name,line);lastHud=-10;return true;
    }
    if(!c||streetTime>c.until||c.lead!==lead||!neighbors.available(c.p)||dist(a,c.p)>(car?10:7)||!seesNeighbor(c.p))return false;
    if(car&&Math.abs(car.speed)>1.5){note(c.p.name,"Pull over to talk.",2);return true;}
    const result=neighbors.answer(lead,Number(code.slice(-1)),streetTime);if(!result)return false;
    c.p.neighborTalking=!!neighbors.chat;speak(c.p.name,result.line);
    if(result.pin)waypoint=result.pin;
    if(result.story){
      if(result.target)waypoint=personPin(result.target);
      else if(waypoint?.kind==="neighbor"&&waypoint.id===c.p.neighbor.id)waypoint=null;
      if(result.news)freshEdition={story:result.story,until:streetTime+12};
      note(result.story.name,result.target?"Find "+result.target.name+" · Live position on map":"Story sent to Sol FM",3.2);
    }
    lastMap=lastHud=-10;return true;
  }
  function neighborBook(b){
    const lead=unit.lead;
    for(const s of BayNeighbors.stories){
      const n=neighbors.stage(lead,s);if(!n)continue;
      if(n===3)editionPrint(b,s);
      else signedNote(b,n===1?s.ask:s.reply,neighbors.byId(n===1?s.from:s.to).name);
      const p=neighbors.target(lead,s);if(p)b.append(makeButton(s.name,"Look for "+p.name+" on their usual route.","Find "+p.name.split(" ")[0],()=>clockPin(personPin(p))));
    }
    for(const p of neighbors.people){
      if(!neighbors.known(lead,p,"met"))continue;
      const l=p.neighbor,heard=neighbors.known(lead,p,"tip"),visited=neighbors.known(lead,p,"visited");
      b.append(makeButton(l.name,heard?l.tip:"You’ve met. Say hello again to ask about the neighborhood.","Find "+l.name.split(" ")[0],()=>clockPin(personPin(p))));
      if(heard)b.append(makeButton(l.place,visited?"You’ve been here on "+p.name+"’s recommendation.":"Recommended by "+p.name,"Mark place",()=>clockPin({...neighbors.places[l.id],name:l.place,kind:"neighbor-place",id:l.id})));
    }
  }
  function talk(){
    if(byRoomDoor()){enterRoom();return;}
    if(byCounter()){openPanel("market");return;}
    const diner=dinerNearby();if(diner){greetDiner(diner);return;}
    if(canJoinTake()){openPanel("take-brief");return;}
    if(atTakePoster()){openPanel("take-poster");return;}
    if(canRideWithJules()){boardJules();return;}
    const p=BayLocals.closestSpeaker(walkers,hero),contact=nearbyJobContact(p);
    if(contact){if(contact.id==="race")cupBook();else startJob(contact.id);return;}
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
  function speak(name,text){
    const el=$("speech");el.children[0].textContent=name;el.children[1].textContent=text;el.hidden=false;speechTill=elapsed+6;
    localVoice=neighbors.people.find(p=>p.name===name&&p.neighborPose)||null;
    $("hud").classList.toggle("neighbor-speech",!!localVoice);$("neighborTag").hidden=true;
    if(localVoice)$("neighborTag").textContent=localVoice.name;
  }
  function placeVoiceTag(x,y){
    const el=$("neighborTag");el.hidden=!(x>38&&x<innerWidth-38&&y>30&&y<innerHeight-44);
    if(!el.hidden){el.style.left=Math.round(x)+"px";el.style.top=Math.round(y)+"px";}
  }
  function greenFree(){
    return !!car&&unitRoadCar(car)&&!active&&!heat&&!transfer&&!room&&!unit.transition&&!unit.eye&&!cabs.booking&&!transit.engaged&&
      !afternoon.active&&!valet.onDuty&&!watchCrew.towing&&!gull.engaged&&!serviceVehicle&&!band.take;
  }
  function acceptGreen(){
    if(!greenFree())return false;
    if(!green.run){const s=green.challenge(car);if(s)green.approach(s,car);}
    if(!green.accept())return false;
    const a=green.run;trafficHonk(a.s.v);
    speak(a.s.route.driver,"You’re on. Stop next to me before the crosswalk. We leave on green.");
    lastHud=lastMap=-10;return true;
  }
  function greenPassing(a,dt){
    if(a.phase!=="running"||a.opponent!==null||a.clock<a.s.route.delay)return;
    a.scanIn=(a.scanIn||0)-dt;if(a.scanIn>0)return;a.scanIn=.28;
    const {s}=a,v=s.v,r=s.route,at=BayOnGreen.relative(r,v);
    if(BayOnGreen.nose(r,v)>=r.finish+2||at.z<9&&s.signal.call&&BayCrosswalk.lamps(s.signal,streetTime)==="red")return;
    const look=Math.min(25,Math.max(20,v.speed*1.1)),run=Math.min(10,Math.max(5.4,v.speed*.41));
    let blocker=null,nearest=look,meeting=false;v.passHold=null;
    for(const o of cars.concat(transit.bus,motos.all)){
      if(o===v||Math.abs(o.x-v.x)>look+19||Math.abs(o.z-v.z)>look+19)continue;
      const q=BayOnGreen.relative(r,o),d=q.z-at.z,direction=Math.cos(o.yaw-r.yaw);
      if(direction<-.68&&q.x<.2&&q.x>-6.7&&d> -3&&d<look+18)meeting=true;
      if(d>.1&&d<nearest&&Math.abs(q.x-a.lane)<2.05&&(o.path?direction*o.speed:0)<Math.max(8.5,v.speed+1)){
        nearest=d;blocker=o;
      }
    }
    if(!blocker)return;
    const lanes=meeting?[1.0,3.3,5.68]:[1.0,3.3,5.68,-.85];
    for(const lane of lanes.sort((a,b)=>Math.abs(a-at.x)-Math.abs(b-at.x))){
      if(Math.abs(lane-a.lane)<2.1)continue;
      const slope=(lane-at.x)/run,heading=r.yaw+Math.atan(slope);
      let clear=true;
      for(const d of [1.2,2.5,4,run,run+3.5,look]){
        const f=Math.min(1,d/run),p=BayOnGreen.roadPoint(r,at.x+(lane-at.x)*f,at.z+d);
        if(!spaceToSwerve(v,p.x,p.z,f<1?heading:r.yaw,Math.min(.48,d/Math.max(7,v.speed)),true)){clear=false;break;}
      }
      if(clear&&BayOnGreen.laneChange(a,lane,run)){a.scanIn=.58;return;}
    }
    // Keep enough nose room to pull around the obstruction when a lane opens.
    if(!blocker.path&&Math.abs(blocker.speed)<.5)v.passHold={body:blocker,until:streetTime+.48};
  }
  function greenStep(dt){
    const old=green.run,event=green.step(dt,streetTime,car,greenFree(),held("KeyW","ArrowUp")&&!held("KeyS","ArrowDown")),a=green.run;
    for(const s of green.sites)if(s.runOut)greenPassing(s.runOut,dt);
    if(old&&old!==a)old.s.v.greenGesture=0;
    if(a){a.s.v.greenGesture=a.phase==="running"?0:clamp(a.age*3,0,1)*(.79+.19*Math.cos(a.age*5.2));greenPassing(a,dt);}
    if(!event)return;
    lastHud=lastMap=-10;
    if(event==="cancel"){if(old?.accepted)note("On Green","Run called off. "+old.s.route.driver+" is heading around the block.",2.8);return;}
    const r=a.s.route;
    if(event==="offer"){
      const last=save.green.cards[r.id]?.slip;
      speak(r.driver,BayOnGreen.invitation(r,last,BayStreetCars.plateFor(car)));return;
    }
    if(event==="armed"){note("On Green · "+r.driver,"Hold here. Watch the traffic light.",2.3);return;}
    if(event==="go"){note("Green","First to the "+r.landmark+".",1.35);return;}
    const winner=event==="first",early=event==="early";
    const slip={token:a.token,result:event,time:early?null:a.clock,reaction:early?null:a.react,launch:a.launch||null,toThirty:a.toThirty??null,car:formatVehicle(car),plate:BayStreetCars.plateFor(car),film:a.film||null};
    syncProgress(readSave());
    if(BayOnGreen.file(save.green,r.id,slip)){if(winner){save.wallet+=r.pay;save.paid++;}persist();}
    if(early)a.s.clock=0;
    speak(r.driver,early?"Still red. Come back around. We'll give it another go.":winner?r.win:r.lose);
    note(early?"False start":winner?"First to the clock":"Second to the clock",early?"Red slip · "+r.street:
      raceWatch(a.clock)+(winner?"  ·  +"+cash(r.pay):"")+"  ·  J for your timing slip",4.4);
    a.s.v.greenGesture=0;green.leave();
  }
  function greenHud(){
    if(!greenFree())return null;
    const a=green.run;
    if(!a){
      if(green.cooldown)return null;
      for(const s of green.sites){
        if(s.out||Math.abs(s.route.x-car.x)>43||Math.abs(s.route.z-car.z)>43||Math.cos(car.yaw-s.route.yaw)<.94)continue;
        const p=BayOnGreen.relative(s.route,car);
        if(p.z>=-40&&p.z< -16&&p.x>.45&&p.x<6.9)return ["S","Slow at the light · "+s.route.driver+" is timing runs"];
      }
      return null;
    }
    const r=a.s.route;
    if(!a.accepted)return ["H",r.driver+" · Race to the "+r.landmark];
    const q=BayOnGreen.relative(r,car),t=a.s.signal;
    $("objective").hidden=false;$("objectiveTag").textContent="On Green  /  "+r.street;
    if(a.phase==="offer"){
      $("objectiveText").textContent="Line up beside "+r.driver;
      $("roadTurn").textContent=q.z<BayOnGreen.line-2.55?"Ease up to the crosswalk":a.s.v.path?"Your rival is pulling alongside":Math.abs(q.x-a.lane)<2?"Take the other lane":"Stop before the crosswalk";
      return ["",r.landmark+"  ·  First car across wins "+cash(r.pay)];
    }
    if(a.phase==="armed"){
      const walk=BayCrosswalk.phase(t,streetTime);
      $("objectiveText").textContent="Hold the line";
      $("roadTurn").textContent=["clear","walk","finish"].includes(walk)?"Pedestrian crossing · Wait for the green light":a.sawRed?"Light is red · Wait for green":"Wait for the next green";
      if(car.burn>.25)return ["S","Release brake on green · "+tireFeedback(car)];
      return ["",BayDriving.rearDrive.has(car.kind)?"W to launch · Hold W + S to warm the rear tires":"Watch the signal · W to launch"];
    }
    const diff=BayOnGreen.nose(r,car)-BayOnGreen.nose(r,a.s.v);
    $("objectiveText").textContent=r.landmark+"  ·  "+Math.max(0,Math.ceil(r.finish-BayOnGreen.nose(r,car)))+" m";
    $("roadTurn").textContent=(diff>=0?"Ahead by ":"Behind by ")+Math.abs(diff).toFixed(1)+" m  ·  "+a.clock.toFixed(2)+" s";
    return ["",r.driver+"  /  "+a.s.v.plate];
  }
  function greenSlips(b){
    const cards=save.green.cards;
    for(const r of BayOnGreen.routes){
      const c=cards[r.id];if(!c)continue;
      const slip=c.slip;if(!slip)continue;
      const paper=document.createElement("article");paper.className="green-slip"+(slip.result==="early"?" red-slip":"");
      const line=(tag,cls,txt)=>{const el=document.createElement(tag);el.className=cls;el.textContent=txt;paper.append(el);};
      line("span","slip-number","ON GREEN   /   "+String(c.runs).padStart(3,"0"));
      line("strong","slip-result",slip.result==="early"?"Left before green":slip.result==="first"?"First across":"Second across");
      line("span","slip-place",r.street+" · "+r.landmark);
      line("strong","slip-time",slip.time==null?"RED":slip.time.toFixed(2)+" s");
      line("span","slip-car",slip.car+"  /  "+slip.plate);
      line("span","slip-launch",slip.reaction==null?"No launch time":"Reaction "+slip.reaction.toFixed(2)+" s");
      if(slip.toThirty!=null)line("span","slip-split","0–30 MPH   "+slip.toThirty.toFixed(2)+" s"+(slip.launch?"   /   "+({cold:"Cold start",ready:"Warm tires",hot:"Hot tires"})[slip.launch]:""));
      line("span","slip-signed","Timed against "+r.driver);b.append(paper);
      if(slip.film)b.append(makeButton("Finish camera","The last second at the timing line.","View replay",()=>openPanel("green-film-"+r.id)));
      if(c.bestSlip?.film)b.append(makeButton("Personal best · "+c.best.toFixed(2)+" s",c.bestSlip.car+" · "+c.bestSlip.plate,"View best",()=>openPanel("green-best-"+r.id)));
      b.append(makeButton(r.street+" · "+r.landmark,c.wins+" wins in "+c.runs+" starts"+(c.best?" · Best "+raceWatch(c.best):"")+
        (c.reaction!==null?" · Best launch "+c.reaction.toFixed(2)+" s":""),"Mark light",()=>clockPin({...r.grid,name:r.street+" · On Green start",kind:"green-start"})));
    }
  }
  function nearbyClock(){
    if(!onStreetFeet()||active||heat||unit.eye||afternoon.active||bell.pass||luggage.hand(save.luggage))return null;
    return green.sites.find(s=>dist(hero,s.route.post)<2.6);
  }
  function showTimingFilm(b,r,best){
    const card=save.green.cards[r.id],slip=best?card?.bestSlip:card?.slip,f=slip?.film;if(!f)return;
    const canvas=document.createElement("canvas");canvas.width=664;canvas.height=184;canvas.className="timing-film";
    canvas.setAttribute("role","img");canvas.setAttribute("aria-label",r.street+" finish camera · "+slip.plate+" against "+r.plate);
    const controls=document.createElement("div");controls.className="timing-film-controls";
    const play=document.createElement("button"),scrub=document.createElement("input");play.textContent="Replay";
    scrub.type="range";scrub.min="0";scrub.max="1000";scrub.step="1";scrub.value="1000";scrub.setAttribute("aria-label","Finish camera position");
    const film=timingFilm={r,f,canvas,play,scrub,at:1,playing:false,previous:0};controls.append(play,scrub);b.append(canvas,controls);
    play.addEventListener("click",()=>{
      film.playing=!film.playing;film.previous=performance.now();if(film.playing&&film.at>=1)film.at=0;
      play.textContent=film.playing?"Pause":"Play";drawTimingFilm(film.previous);
    });
    scrub.addEventListener("input",()=>{film.playing=false;film.at=Number(scrub.value)/1000;play.textContent=film.at>=1?"Replay":"Play";drawTimingFilm(performance.now());});
    b.append(makeButton("Timing slips",slip.car+" · "+slip.plate,"Back",()=>openPanel("green-slips")));
    drawTimingFilm(performance.now());
  }
  function drawTimingFilm(now){
    const v=timingFilm;if(!v)return;
    if(v.playing){
      const shots=v.f.shots;
      v.at=Math.min(1,v.at+Math.max(0,now-v.previous)*.40/Math.max(1,shots.at(-1)[0]-shots[0][0]));
      if(v.at===1){v.playing=false;v.play.textContent="Replay";}
    }
    v.previous=now;v.scrub.value=String(Math.round(v.at*1000));BayOnGreenArt.film(v.canvas,v.r,v.f,v.at);
  }
  function clockCard(b,s){
    const r=s.route,c=save.green.cards[r.id];
    signedNote(b,"Bring your car to the light on "+r.street+". Stop before the crosswalk, facing "+(r.yaw===0?"north":"west")+
      ". Tap the horn when you see "+r.plate+". First bumper to this clock takes "+cash(r.pay)+".",r.driver);
    b.append(makeButton("Find the starting light",r.street+" · "+r.driver,"Mark light",()=>clockPin({...r.grid,name:r.street+" · On Green start",kind:"green-start"})));
    if(c)b.append(makeButton("Your timing slips",c.wins+" wins from "+c.runs+" starts here.","Open",()=>openPanel("green-slips")));
  }
  function askForGap(){
    if(heat||!BayBoulevardLanes.ask(car,cars,streetTime))return false;
    note("Driver behind you","Two flashes · They’re slowing to let you in.",2.8);return true;
  }
  function honk(){
    if(elapsed<hornReady)return;hornReady=elapsed+.67;sound.cue("horn");
    if(!active&&askForGap())return;
    if(cupEntry())return;
    if(beat.start("check",car,beatEnv))return;
    if(acceptGreen()||green.run?.accepted)return;
    if(canChallenge()){beginMeet("driver");return;}
    if(takeCurbFare())return;
    if(active&&askForGap())return;
    if(curbVehicle()&&Math.abs(car.speed)<11){
      const w=curbWire.hail(car,wireEnv);
      if(w){note((w.curbName||w.name)+" · Camera rolling","Make your pass while the phone is up.",2.5);}
    }
    for(const p of walkers){if(!p.palmPassenger&&dist(p,car)<16){p.alert=1.35;p.gesture=1;p.yaw=Math.atan2(car.x-p.x,car.z-p.z);}}
    for(const v of cars){if(v!==car&&v.path&&dist(v,car)<9){v.wait=Math.max(v.wait,.42);}}
  }
  const byCinema=()=>onStreetFeet()&&!active&&!heat&&dist(hero,BayCab.cinema)<2.3;
  let projectionStart=streetTime,lateReelListed=!!save.cab.reel;
  const filmOptions=()=>({houseLights:houseLights.s.release,pictureJumps:jumps.complete(save.pictureJumps)?save.pictureJumps:null,windows:negatives.reel,location:unit.film.pinned,stunt:save.stunt,skate:skateReel,edition:save.edition,second:!!save.cab.reel,
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
      const line=BayCrosswalk.setback(signal,bayCarLayout(v.kind).halfLength,9.6);
      if(BayCrosswalk.beforeLine(signal,f,line,9.6,v.speed)&&f<25&&Math.abs(x*cs-z*sn)<4.3&&BayCrosswalk.waiting(signal,streetTime,Math.abs(cs)>.7))space=Math.min(space,Math.max(0,f-line));
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
  const insideSeat=()=>!theatre.visit&&!theatre.run&&!unit.transition&&!works.rearView&&!club.show?.wide&&driverSeat.enabled&&canUseSeat()&&!held("KeyV");
  const seatLights=()=>Math.max(cityDusk(),hours.night,.53*hours.rain)>.08;
  const glassWater=()=>Math.max(car?.glassSplash||0,wash.spraying&&wash.work?.v===car&&wash.panel===2?.96:0);
  function commitPaletas(){
    save.campana.rev++;persist();lastHud=lastMap=-10;
  }
  const paletaOnFoot=()=>onStreetFeet()&&!unit.transition&&!unit.eye&&!windowRide&&!roofs.action&&!neon.testing&&!wash.hasWand();
  const paletaWindow=()=>paletaOnFoot()&&(!active||active.campana)&&!heat&&!watchCrew.towing&&!cabs.booking&&campana.nearWindow(hero);
  const campanaHeld=()=>campana.manual&&campana.phase==="open"&&campana.selected>=0?BayCampana.flavors[campana.selected]:!campana.manual?save.campana.hand||(campana.biteTime>0?campana.lastBite:""):"";
  const paletaEnv={
    hero,clearance:crewRoadClear,street:p=>BayCab.streetStop(p,chase.road(p)),settle:settleAtCurb,
    berth:(stop,approach)=>cabBerth(stop,approach,iceVan),occupied:()=>iceVan===car||transfer?.v===iceVan,
    say:speak,chime(){sound.cue("campana-bell",{distance:dist(pos(),iceVan)});},
    commit:commitPaletas,
    finish(pay){active=null;save.wallet+=pay;save.paid++;commitPaletas();sound.cue("paid");iceVan.campanaDriver=true;
      speak("Nina Rojas","Four wrappers, two corners. That’s your share, down to the last dollar.");
      note("La Campana · Shift paid",cash(pay)+" · Best sheet "+cash(save.campana.best),4);}
  };
  campana.berth=paletaEnv.berth;
  function paletaPanel(b){
    const book=save.campana,lib=BayCampana;
    const card=document.createElement("canvas");b.append(card);BayCampanaArt.freezerCard(card,book);
    for(const [i,name] of lib.names.entries()){
      const price=book.bought===0||book.stamps===7?0:3;
      const button=makeButton(name,["Pink guava with a stripe of pulp.","Coconut milk and toasted flakes.","Tamarind with a sour center."][i],
        book.hand?"Finish yours first":price?cash(price):"On the house",()=>{
          const charge=!book.bought||book.stamps===7?0:3;
          if(!paletaWindow()||book.hand||save.wallet<charge)return;
          book.hand=lib.flavors[i];book.bites=3;book.bought++;book.stamps|=1<<i;save.wallet-=charge;commitPaletas();closePanel();
          note("Nina Rojas",book.stamps===7?"You’ve tried the whole freezer. Your paletas are on the house.":"Take it with you. N for a bite.",3.8);
        });
      button.disabled=!!book.hand||save.wallet<price;b.append(button);
    }
    b.append(makeButton("Work the truck","Drive the next two stops and hand out four orders. Nina pays $50 plus the till.","Take the keys",()=>{
      if(!paletaWindow()||active||!campana.take(paletaEnv))return;
      active={campana:true,job:iceJob};iceVan.campanaDriver=false;waypoint=null;closePanel();
      speak("Nina Rojas","You drive, I’ll mind the freezer. Park with my window by the sidewalk and ring the roof bell.");
    }));
  }
  function canHailPaletas(){
    if(!play||active||heat||cabs.booking||transfer||campana.manual||campana.phase!=="route"||(!car&&!paletaOnFoot()))return false;
    const p=car||hero,dx=iceVan.x-p.x,dz=iceVan.z-p.z,d=Math.hypot(dx,dz);
    return d<19&&(!car||(dx*Math.sin(car.yaw)+dz*Math.cos(car.yaw))>.35*d&&!cabs.nearbyFare(car));
  }
  function paletaKey(code){
    const lib=BayCampana;
    if(code==="KeyH"&&canHailPaletas()&&campana.hail(paletaEnv)){
      if(car)honk();if(!save.campana.met){save.campana.met=true;commitPaletas();}
      if(!waypoint)waypoint={...campana.counter,name:"La Campana",kind:"campana-track"};
      speak("Nina Rojas","Meet me at "+BayCampana.stops[campana.next].name+". I’ll keep the window open for you.");return true;
    }
    if(code==="KeyN"&&save.campana.hand&&!campana.manual&&paletaOnFoot()){
      const flavor=save.campana.hand,b=--save.campana.bites;campana.biteTime=.50;campana.lastBite=flavor;if(!b)save.campana.hand="";
      commitPaletas();note("La Campana",b?flavor+" · "+b+(b===1?" bite":" bites")+" left":"Nothing left but the stick.",1.5);return true;
    }
    if(active?.campana&&car===iceVan&&!transfer&&code==="KeyH"){
      if(!campana.park(paletaEnv)){campana.ring(paletaEnv);if(dist(iceVan,BayCampana.stops[campana.next])<12)
        note("Nina Rojas","Stop facing north with the striped window at the east curb.",2);}
      else speak("Nina Rojas","Come round the right side. I’ll pass them through the hatch.");return true;
    }
    if(!paletaWindow())return false;
    if(campana.manual){
      if(/^(Digit|Numpad)[1-3]$/.test(code)){campana.selected=Number(code.at(-1))-1;lastHud=-10;return true;}
      if(code==="KeyF"){campana.serve(paletaEnv);return true;}
    }else if(code==="KeyF"){
      if(!save.campana.met){save.campana.met=true;commitPaletas();}
      openPanel("paletas");return true;
    }
    return false;
  }
  function paletaHint(){
    const lib=BayCampana;
    if(active?.campana&&car===iceVan&&!transfer){
      if(campana.phase==="open")contextHint("E","Step out and work the striped window");
      else contextHint("H",campana.canPark()?"Ring for the line · "+lib.stops[campana.next].name:"Roof bell · Park at the marked curb to serve");
    }else if(paletaWindow()){
      if(!campana.manual)contextHint("F","La Campana · Visit Nina’s window");
      else{const p=campana.ready(),selected=campana.selected;
        contextHint(p?"1–3":"","1 Guava · 2 Coconut · 3 Tamarind"+(p?"  /  "+(selected<0?p.name+" wants "+lib.flavors[p.flavor]:"F · Hand over "+lib.flavors[selected]):" · Line forming"));}
    }else if(canHailPaletas())contextHint("H",car?"Honk for Nina’s next stop":"Flag La Campana");
    else if(active?.campana&&car==null&&campana.phase==="open"){contextHint("","Walk to Nina’s striped serving window");}
    else return false;
    return true;
  }
  function drawCampana(list,see,t){
    for(const [i,p] of BayCampana.stops.entries())if(see(p,58))BayCampanaArt.curbWorld(view,model,p,campana.manual&&campana.phase==="drive"&&i===campana.next);
    if(see(iceVan,82)&&!(car===iceVan&&insideSeat()))BayCampanaArt.world(view,list,model,iceVan,campana.open,campana.bell,t,footLevel(iceVan.x,iceVan.z)+.008);
    for(const p of campana.people)if(see(p,53)){
      const y=footLevel(p.x,p.z),key="campana/local/"+p.stop+"/"+p.number;
      if(!p.mesh){p.mesh=new BayPlayerMesh(personColors[p.style],"local");view.add(key,p.mesh,true);}
      if(p.mesh.update(p.motion))view.updateAnimated(key);list.push([key,p.x,y,p.z,p.yaw]);
      if(p.treat&&campana.exchange?.p!==p)BayCampanaArt.treatWorld(list,model,p,p.treat,y,t);
    }
    const passing=campana.passing();
    if(passing&&see(passing,30))BayCampanaArt.treatWorld(list,model,passing,passing.flavor,footLevel(passing.x,passing.z)+passing.height,t,{world:true});
    const flavor=campanaHeld();if(flavor&&paletaOnFoot())BayCampanaArt.treatWorld(list,model,hero,flavor,hero.y,t,{...motion.handTarget,bites:campana.manual?3:Math.max(1,save.campana.bites)});
  }
  function curbDrain(){
    return onStreetFeet()&&!active&&!heat&&!unit.eye&&!unit.transition&&!rainWalk.trip&&!roofs.action&&!neon.testing&&!wash.hasWand()&&gutters.near(hero);
  }
  function stepGutters(dt){
    const p=curbDrain(),holding=!pavement.lift&&!pavement.hand&&held("KeyL")&&!held("KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight");
    if(gutters.lift(p,holding,dt,hours)){
      saveTime();lastHud=-10;
      note(p.name,p.depth>.1?"The leaves come free. Water is running through the grate.":"The grate is clear for the next shower.",3.4);
      broadcastDesk.queue.push("The curb drain at "+p.name+" is running clear again.");
    }
    if(car)car.glassSplash=Math.max(0,(car.glassSplash||0)-dt*.84);
    gutters.lights.length=0;
    if(gutters.wet){
      const focus=pos(),lamps=seatLights();
      for(const v of cars)if(Math.abs(v.x-focus.x)<62&&Math.abs(v.z-focus.z)<62){
        gutters.tracks(v,streetTime);
        if(v===car||v.path||Math.abs(v.speed)>.2||v.owner?.phase==="drive")gutters.reflect(v,lamps);
      }
      const fare=cabs.privateFare;
      if(fare&&fare.phase==="ride"&&fare.ride===car&&!fare.splashWarned&&Math.abs(car.speed)>12&&(car.waterLoad?.front||0)>.45){
        fare.splashWarned=true;fare.jolt++;
        speak(fare.name,({walt:"Easy on that gutter. There's only one copy in this tin.",bea:"My flowers just wore half the street.",otis:"That's one way to wash a drum case."})[fare.id]);
      }
    }
    if(gutters.fans.length)gutters.advance(dt,walkers,car,p=>{
      neighbors.incident(p,car,"spray",unit.lead);
      if(elapsed-sprayRemarkAt<9||p.palmManaged||p===band.local||room||unit.eye||cabs.privateFare)return;
      sprayRemarkAt=elapsed;speak(p.name||"From the sidewalk",p.canopy>.3?"Good thing I brought this.":p.role==="runner"?"My other shoe was almost dry!":"Hey! Watch the gutter!");
    });
  }
  function curbsideFree(){
    return onStreetFeet()&&!active&&!heat&&!unit.transition&&!unit.eye&&!afternoon.photo&&!bell.pass&&!luggage.hand(save.luggage)&&!rainWalk.trip&&!coffee.stage&&!roofs.action&&!wash.hasWand();
  }
  function summerAction(){
    return curbsideFree()&&!pavement.hand&&!pavement.lift?summerCaps.near(hero):null;
  }
  function summerHint(a){
    if(!a)return null;
    const hints={shut:["F","Stop the water at the blue button"],start:["F","Push for a summer shower"+(summerCaps.book[a.s.id]?" · Cap refitted":"")],
      pick:["L","Pick up the loose blue cap"],seat:["L","Fit the cap back on the post"],
      carry:["L","Carry the cap back to its post · Put it down"],fan:["F","Stop the summer shower · "+Math.ceil(a.s.timer)+" s"],
      closed:["","Water off · Find the loose blue cap"]};
    return hints[a.act];
  }
  function summerKey(code){
    if(code!=="KeyF"&&code!=="KeyL")return false;
    const a=summerAction();if(!a)return false;const s=a.s;
    const aim=a.act==="pick"?s.cap:a.act==="seat"?s:s.button;
    if(code==="KeyF"&&a.act==="start")summerCaps.start(s);
    else if(code==="KeyF"&&a.act==="fan"){s.mode="idle";s.timer=0;s.buttonDip=.45;}
    else if(code==="KeyF"&&a.act==="shut"){summerCaps.shut(s,true);note(s.label+" water post","The spray is dying down. Find the blue cap where it landed.",3);}
    else if(code==="KeyL"&&a.act==="pick"&&summerCaps.take(s,hero)){summerCaps.hand=s;note("Blue summer cap","Carry it to the open post.",2);}
    else if(code==="KeyL"&&a.act==="carry")summerCaps.drop();
    else if(code==="KeyL"&&a.act==="seat"&&summerCaps.seat(s,hero,true)){
      const w=pavement.props.find(p=>p.id===s.stand).worker;speak(w.name,"There it is. Give the blue button a push and see if she runs.");
      note(s.label+" water post","Back in service · "+Object.values(summerCaps.book).filter(Boolean).length+" of 3 corners helped",4);
    }else return false;
    if(a.act!=="carry")capReach={x:aim.x,z:aim.z,y:a.act==="pick"?.22:.95,age:0,pick:a.act==="pick"};
    lastHud=-10;return true;
  }
  const summerEnv={
    get focus(){return pos();},get vehicles(){return cars;},get walkers(){return walkers;},get driver(){return car;},
    clear:(x,z,r)=>valid(x,z,r),
    hit(s,v){
      const w=pavement.props.find(p=>p.id===s.stand).worker;s.work=0;w.target=null;
      if(v===car){v.vx*=.88;v.vz*=.88;v.speed*=.88;sound.cue("splash");speak(w.name,s.voice);}
      broadcastDesk.queue.push("Watch for water across the curb lane by "+s.pool.name+".");lastHud=-10;
    }
  };
  function stepSummer(dt){
    if(capReach&&((capReach.age+=dt)>.56||!onStreetFeet()))capReach=null;
    if(summerCaps.hand&&!curbsideFree())summerCaps.drop();
    summerEnv.glass=car?BayDriving.world(car,0,.66):null;
    summerCaps.tick(dt,summerEnv);
    const soaked=onStreetFeet()&&summerCaps.posts.some(s=>summerCaps.wetAt(s,hero));
    hero.summerWet=ease(hero.summerWet||0,soaked?1:0,soaked?9:2.4,dt);
  }
  function workerSafe(x,z){
    if(!valid(x,z,.28))return false;
    for(const v of cars)if(Math.abs(v.x-x)<5&&Math.abs(v.z-z)<5&&BayDriving.clearance(v,{x,z})<.44)return false;
    return dist({x,z},transit.bus)>7||BayDriving.clearance(transit.bus,{x,z})>.4;
  }
  const pavementEnv={ground:footLevel,clear:(x,z,r)=>valid(x,z,r),safe:workerSafe,issue:()=>pavement.edition(hours,neighbors.editions,save,BayCineProgram.describe(filmOptions())),
    capNeedsService:p=>!!summerCaps.byStand.get(p.id)?.cap,
    tendCap(p,w,dt){
      const busy=summerCaps.tend(p,w,dt,pavement,this,hours);
      const s=busy&&summerCaps.byStand.get(p.id);
      w.atCap=!!s?.attending;w.carryCap=s?.cap?.carrier===w;
      return busy;
    },
    dodge(w,dt){
      const driver=car||motos.bike||windowRide?.vehicle;
      if(!driver&&!w.startle)return false;
      const wait=w.wait,away=BayStreetReactions.startlePerson(w,dt,driver,cars,walkers,valid,streetTime);
      w.wait=wait;return away;
    },
    path(w,target,r){
      const yaw=Math.atan2(w.x-target.x,w.z-target.z);
      for(const a of [0,.85,-.85,1.7,-1.7,Math.PI]){
        const to={x:target.x+r*.85*Math.sin(yaw+a),z:target.z+r*.85*Math.cos(yaw+a)};
        if(!workerSafe(to.x,to.z))continue;
        const route=afternoonRoute(w,to,null);if(route)return route;
      }
      return null;
    },
    hit(p,v){
      if(v!==car&&v!==windowRide?.vehicle||dist(pos(),p)>22)return;
      const what={box:"There goes the evening edition! I’ve got papers halfway down the street.",board:"My sign! Took me half the afternoon to letter that.",crate:"Hey, those are my good oranges! Grab the ones that roll."};
      speak(p.worker.name,what[p.kind]);sound.cue("hit");
      if(v===car){const drag=p.kind==="box"?.88:.96;v.vx*=drag;v.vz*=drag;v.speed*=drag;}
      lastHud=-10;
    }};
  function curbsideAction(){return curbsideFree()?pavement.near(hero):null;}
  function curbsideHint(a){
    const fruit=a.p.kind==="crate";
    if(a.kind==="lift")return ["L",pavement.lift?"Setting it upright · "+Math.round(a.p.progress*100)+"%":"Hold to set the "+({board:"cinema sign",box:"news box",crate:"fruit crate"})[a.p.kind]+" upright"];
    if(a.kind==="pick")return ["L",fruit?"Pick up an orange":"Pick up a spilled paper"];
    if(a.kind==="return")return ["L",fruit?"Put the orange back in the crate":"Put the paper back in the box"];
    if(a.kind==="carry")return ["L",fruit?"Taking an orange to the crate · Put it down":"Put the paper down · F unfold it"];
    if(a.kind==="box"&&a.p.stock)return ["F","Read today’s Bay Wire"];
    if(a.kind==="board")return ["F","Check the Cine Luna bill"];
    return null;
  }
  function curbsideKey(code){
    if(code!=="KeyL"&&code!=="KeyF")return false;
    const a=curbsideAction();if(!a)return false;
    if(code==="KeyL"){
      if(!pavement.help(hero))return false;
      if(a.kind==="return")speak(a.p.worker.name,a.p.stock===({box:4,crate:5})[a.p.kind]?"That’s the last one. Thank you.":a.p.kind==="box"?"Thanks. Fold to the street, that way folks can read it.":"Good catch. That one was headed for the gutter.");
      lastHud=-10;return true;
    }
    if(a.kind==="board"){openPanel("curb-bill");return true;}
    if(pavement.hand?.issue){openPaper=pavement.hand.issue;openPanel("street-paper");return true;}
    if(a.kind!=="box"||!a.p.stock)return false;
    openPaper=pavementEnv.issue();openPanel("street-paper");return true;
  }
  function stepPavement(dt){
    const free=curbsideFree();
    if(pavement.hand&&!free)pavement.drop();
    if(pavement.lift&&pavement.stepLift(dt,hero,free&&held("KeyL")&&!held("KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight")))lastHud=-10;
    pavement.attendants(dt,pos(),pavementEnv);
  }
  function starliteFree(){
    return play&&!active&&!heat&&!room&&!transfer&&!unit.transition&&!unit.eye&&!windowRide&&!afternoon.photo&&!bell.open&&!broadcastDesk.mix;
  }
  function atProjectionBooth(){return starliteFree()&&onStreetFeet()&&dist(hero,starliteBooth)<2.15;}
  function atSpider(){
    return !room&&!transfer&&!unit.eye&&!unit.transition&&(car===spider||onStreetFeet()&&dist(hero,spider)<2.75);
  }
  function parkSpider(){
    const {x,z,yaw}=spider;
    if(Math.abs(spider.speed)>1||!fitsCar(spider,x,z,yaw))return;
    syncProgress(readSave());save.starlite.park={x,z,yaw};save.starlite.rev++;persist();
  }
  function theatreFilm(){return theatre.frame(filmOptions(),save.starlite.booked);}
  function theatreShirt(lead){return BayThreadsArt.colors[worn(lead)]||BayCourtPlayers.kitColors[worn(lead)]||(lead==="guest"?personColors[0][1]:BayExposureArt.palette[1]);}
  function setTheatreSeats(){
    const shared=windowRide?.vehicle===spider,driver=shared||otherCar===spider?unit.other:car===spider&&(!transfer||transfer.exiting)?unit.lead:null;
    spider.caletaSeats.driver=driver?theatreShirt(driver):null;
    spider.caletaSeats.passenger=afternoon.vehicle===spider&&afternoon.seated?theatreShirt(unit.other):shared&&windowRide.seat>.72?theatreShirt(unit.lead):null;
  }
  function starliteHint(){
    const r=theatre.run;
    if(r)return r.done?["F","Pick another print · E leave the booth"]:[r.started?"F":"Space",r.started?"Second cue dot · open the shutter":"First cue dot · start the right-hand motor"];
    if(theatre.visit)return ["F","Unclip speaker "+theatre.visit.bay+" · "+theatre.show(BayCineProgram.describe(filmOptions()),save.starlite.booked).reel.title];
    if(atProjectionBooth())return ["F","Ada Soler · Starlite projection booth"];
    const n=starliteFree()&&car&&BayStarlite.bay(car);if(n)return ["F","Clip on speaker "+n+" · Starlite Motor Theatre"];
    return null;
  }
  function drawTheatreGauge(){
    const r=theatre.run,canvas=$("starliteGauge");canvas.hidden=!r;
    if(!r)return;
    const frame=Math.floor(theatre.clock*12);
    if(gaugeStamp===frame)return;
    gaugeStamp=frame;BayStarliteBooth.draw(canvas,r,theatre.clock);
  }
  function boothResult(r){
    if(!r)return;
    syncProgress(readSave());
    const book=save.starlite,best=book.best[r.id]||0,paid=r.switched&&best<70;
    book.best[r.id]=Math.max(best,r.score);
    if(r.switched)book.booked=r.id;
    if(paid){save.wallet+=65;save.paid++;}
    book.rev++;persist();lastHud=-10;
    speak("Ada Soler",r.switched?"That’s the cut. Look at bay two. Nobody even turned around.":"Take a breath. Watch the upper right corner of the picture.");
    note(r.switched?"Clean changeover"+(paid?" · +$65":""):"Missed changeover",r.feedback+" · "+r.score+"/100",5);
  }
  function startChange(reel){
    if(!atProjectionBooth())return;
    closePanel();theatre.start(reel);keys.clear();hero.yaw=Math.atan2(starliteSite.x-hero.x,starliteSite.z+10-hero.z);gaugeStamp=-1;lastHud=-10;
    speak("Ada Soler","First white dot, roll the motor. Second dot, flip the shutter.");
    speechTill=Math.min(speechTill,elapsed+theatre.run.motorAt-.6);
  }
  function starliteKey(code){
    const r=theatre.run;
    if(r){
      if(code==="KeyE"){theatre.run=null;$("starliteGauge").hidden=true;cameraSnap();keys.clear();lastHud=-10;return true;}
      if(r.done&&code==="KeyF"){theatre.run=null;$("starliteGauge").hidden=true;openPanel("starlite-booth");return true;}
      if(code==="Space"||code==="KeyF"){boothResult(theatre.input(code));lastHud=-10;return true;}
      return !["Escape","KeyM","KeyJ","KeyR"].includes(code);
    }
    if(code==="KeyO"&&atSpider()){
      if(Math.abs(spider.speed)>3){note("Caleta Spider","Slow to walking pace to move the roof.",2);return true;}
      syncProgress(readSave());spider.roofTarget=1-spider.roofTarget;save.starlite.roof=spider.roofTarget;save.starlite.rev++;persist();
      note("Caleta Spider",spider.roofTarget?"Raising the canvas top":"Folding the canvas top",2);lastHud=-10;return true;
    }
    if(code!=="KeyF")return false;
    if(theatre.visit){theatre.visit=null;cameraSnap();lastHud=-10;return true;}
    if(atProjectionBooth()){openPanel("starlite-booth");return true;}
    const n=starliteFree()&&BayStarlite.bay(car);
    if(!n)return false;
    const companion=afternoon.vehicle===car&&afternoon.seated?BaySecondUnit.names[unit.other]:"";
    theatre.visit={v:car,bay:n,companion,age:0,id:null,kept:false};
    if(companion)speak(companion,"That little speaker still works? My side gets the good armrest.");
    lastHud=-10;return true;
  }
  function theatreStep(dt){
    BayStarlite.fold(spider,dt);
    if(theatre.run&&!starliteFree()){theatre.run=null;lastHud=-10;}
    boothResult(theatre.step(dt));drawTheatreGauge();
    const v=theatre.visit;if(!v)return;
    if(car!==v.v||!starliteFree()||BayStarlite.bay(car)!==v.bay){theatre.visit=null;cameraSnap();lastHud=-10;return;}
    const reel=theatre.show(BayCineProgram.describe(filmOptions()),save.starlite.booked).reel;
    if(v.id!==reel.id){v.id=reel.id;v.age=0;v.kept=false;}
    v.age+=dt;if(v.kept||v.age<3.8)return;
    v.kept=true;syncProgress(readSave());
    const book=save.starlite,record={id:reel.id,title:reel.title,plate:BayStreetCars.plateFor(car),day:hours.day+1,bay:v.bay,companion:v.companion};
    if(book.tickets.some(t=>Object.keys(record).every(k=>t[k]===record[k])))return;
    book.tickets.push(record);book.tickets=book.tickets.slice(-5);book.rev++;persist();
    note("Starlite · Admit "+(v.companion?"two":"one"),reel.title+" · Ticket kept in your pocket",3);
  }
  function theatrePanel(body,tickets){
    if(tickets){
      const book=save.starlite.tickets,record=book[ticketIndex]||book.at(-1);if(!record)return;
      const stub=document.createElement("canvas");stub.className="starlite-ticket";stub.setAttribute("role","img");stub.setAttribute("aria-label",record.title+" · "+record.plate+" · Bay "+record.bay+(record.companion?" with "+record.companion:""));BayStarliteBooth.ticket(stub,record);body.append(stub);
      if(book.length>1)body.append(makeButton("Next ticket","Your last five screenings.","Turn over",()=>{ticketIndex=(ticketIndex+1)%book.length;openPanel("starlite-tickets",true);}));
      return;
    }
    signedNote(body,"Two dots in the upper right of the picture. Space starts the other motor on the first. F changes reels on the second. First clean change on each print pays $65.","Ada Soler · Projectionist");
    for(const film of [BayStarlite.coast,...BayCineProgram.describe(filmOptions())]){
      const best=save.starlite.best[film.id];
      body.append(makeButton(film.title,film.credit+(best?" · Best "+best+"/100":""),"Thread reel",()=>startChange(film)));
    }
  }

  function paperPanel(body,archive){
    const copies=pavement.archive,issue=archive?copies[paperIndex]:openPaper;if(!issue)return;
    const page=document.createElement("canvas");page.className="bay-front-page";page.setAttribute("role","img");
    page.setAttribute("aria-label",[issue.headline,issue.deck,issue.local,issue.listing].join(". "));BayStreetEditionArt.paint(page,issue);body.append(page);
    if(!archive)body.append(makeButton("Fold a copy for later","Keep this front page with your last five papers.","Keep paper",()=>{
      pavement.keep(issue);paperIndex=pavement.indexOf(issue);
      openPanel("pocket-papers");
    }));
    body.append(makeButton("Starlite Motor Theatre","Coast Road, 1983 · Gantry Street. Three spaces, speakers on the posts.","Mark drive-in",()=>clockPin(starliteBooth)));
    body.append(makeButton("Cine Luna listings",issue.listing,"Mark cinema",()=>clockPin(BayCab.cinema)));
    if(archive&&copies.length>1)body.append(makeButton("Turn the stack","Edition "+(paperIndex+1)+" of "+copies.length,"Another issue",()=>{paperIndex=(paperIndex+copies.length-1)%copies.length;openPanel("pocket-papers",true);}));
  }
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
    if(v===manta){bay.moor(v,BayManta.home,0);return;}
    for(const d of [first,...bay.docks.filter(d=>d!==first)])for(const side of [-1,1]){
      if(vacant(v,d,side)){bay.moor(v,d,side);return;}
    }
  }
  function nearestMooring(v){
    let best=null,range=6;
    if(dist(v,BayDrawbridge.iceBerth)<4&&vacant(v,BayDrawbridge.iceDock,1)){
      return {dock:BayDrawbridge.iceDock,side:Math.cos(v.yaw-BayDrawbridge.iceBerth.yaw)>=0?1:-1};
    }
    for(const dock of bay.docks.concat(airStops))for(const side of v===manta&&dock===BayManta.home?[0,-1,1]:dock.skiff&&!dock.guest?[1]:[-1,1]){
      if(!vacant(v,dock,side))continue;
      const d=dist(v,bay.berth(dock,side));
      if(d<range){best={dock,side};range=d;}
    }return best;
  }
  function openToSwim(x,z,depth){
    if(!BaySwimming.water(x,z)||BayGullKey.landFloor(x,z)!=null)return false;
    if(depth<.95&&Math.abs(x-BayManta.kicker.x)<3.18&&Math.abs(z-BayManta.kicker.z)<1.68)return false;
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
      const v=a.v,d=v.dock,side=v.side;swim=null;skiff=v;v.dock=null;if(v===pip)works.dirty=true;else if(v!==manta)hullChoice=v.kind;
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
    const p=v===manta?chassisPoint(v,0,.03,-.13,v.y):v.kind==="pip"?chassisPoint(v,-.37,.105,-.47,v.y):chassisPoint(v,-.38,0,-.35,v.y);return {x:p.x,z:p.z,y:p.y,yaw:v.yaw};
  }
  function useLanding(){
    if(!skiff){
      const v=boardable();if(!v)return;
      if(v===manta&&active?.ferry?.phase==="pier"){speak("Inez Cruz","One seat on that one. Take an outboard so I can come with you.");return;}
      if(active?.dash)dropJob();
      deckStep={v,entering:true,f:0,start:{...hero},dock:v.dock,side:v.side};regattaResult=null;
    }else{
      const crossing=active?.ferry;
      if(skiff===manta&&mantaRide.air)return;
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
    const to=a.entering?seatPoint(v):d===BayManta.home&&a.side===0?{x:d.x+d.headW/2-.65,z:d.z,y:d.level,yaw:-Math.PI/2}:d.guest&&a.side<0?{x:d.x,z:d.z+.80,y:d.level,yaw:Math.PI}:d.skiffFoot?d.skiffFoot:d===BayDrawbridge.iceDock?BayDrawbridge.iceStep:{x:d.x+.7,z:d.z+a.side*(d.headD*.5-.77),y:d.level,yaw:-a.side*Math.PI*.5};
    hero.x=a.start.x+(to.x-a.start.x)*t;hero.z=a.start.z+(to.z-a.start.z)*t;
    hero.y=a.start.y+(to.y-a.start.y)*t+Math.sin(Math.PI*t)*.21;hero.yaw=a.start.yaw+angle(a.start.yaw,to.yaw)*t;
    pilot(v,seat,dt);
    if(a.f<1)return;
    if(a.entering){skiff=v;v.dock=null;if(v===pip)works.dirty=true;else if(v!==manta)hullChoice=v.kind;active?.ferry?.reserveBoat(v,d,a.side);note(bay.hulls[v.kind].name,v===manta?"W throttle · Hold Space into the striped ramp for more air":"W to open the throttle  ·  Space to trim out",3.5);}
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
  function mantaCall(){
    if(mantaRide.run){mantaRide.run=null;note("North Float Double","Off the clock. The bay is yours.",3);}
    else if(!heat&&!active&&mantaRide.start(manta)){
      speak("Paz Ríos · Yellowtail","Take the stripes straight out from the float. Land it, then cut across my whitewater.");
      toastTill=elapsed;$("toast").hidden=true;
    }else if(!active&&!heat){
      const b=mantaRide.best;
      speak("Paz Ríos · Yellowtail","Meet me at North Float for a timed double."+(b.double?" Your time to beat is "+b.double.toFixed(1)+" seconds.":""));
    }
    lastHud=lastMap=-10;
  }
  function mantaLanding(r){
    const name=r.kind==="ramp"?"Ramp":"Wake";
    sound.cue("splash");
    if(r.time){
      note("North Float Double · "+r.time.toFixed(1)+" s",(r.fastest?"Personal best":"Best "+mantaRide.best.double.toFixed(1)+" s")+" · Wake jump "+r.range.toFixed(1)+" m",5);
      speak("Paz Ríos · Yellowtail","Saw your hull clear my wake. I’ve got your time. Meet you back at the float.");
    }else{
      note(name+" jump · "+r.range.toFixed(1)+" m",r.clean?(r.best?"Personal best":"Clean landing"):"Sideways splashdown · Straighten the nose before landing",3);
      if(r.next)speak("Paz Ríos · Yellowtail","Got the first one. Look for my yellow boat and cross the foam behind me.");
    }
    lastHud=lastMap=-10;
  }
  function stepWater(dt){
    if(skiff!==manta||deckStep){if(mantaRide.run||mantaRide.air||mantaRide.onRamp||mantaRide.height)mantaRide.reset();}
    else if((active||heat)&&mantaRide.run)mantaRide.run=null;
    const race=active?.regatta;
    if(ferryScene)ferryScene.ship.step(dt,streetTime);
    const input=skiff&&{gas:held("KeyW","ArrowUp"),back:held("KeyS","ArrowDown"),steer:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft")),trim:held("Space")};
    if(input&&active?.ferry)active.ferry.helm(skiff,input,held("KeyF"));
    if(race){
      const event=race.step(dt,streetTime,input);
      if(event==="finish"){finishRegatta(race);return;}
      if(event==="gate"){lastHud=lastMap=-10;sound.cue("job");}
    }else if(skiff===pip&&(works.slip||works.line)){if(!works.slip)bay.pose(pip,streetTime,dt);}
    else if(skiff===manta&&!deckStep){
      const result=mantaRide.step(manta,dt,input,streetTime,[clubBoat,...harbor.units],clubBoat);
      bay.separate(manta,clubBoat);if(result)mantaLanding(result);
    }
    else if(skiff&&!deckStep){if(skiff===pip&&(input.gas||input.back||Math.abs(pip.speed)>.1))works.dirty=true;bay.helm(skiff,dt,input.gas,input.back,input.steer,input.trim,streetTime);bay.disturb(skiff,clubBoat,streetTime);bay.separate(skiff,clubBoat);}
    if(!race){
      if(dist(clubBoat,cruiseMarks[cruiseLeg])<10)cruiseLeg=(cruiseLeg+1)%cruiseMarks.length;
      bay.follow(clubBoat,cruiseMarks[cruiseLeg],11,dt,streetTime);
    }
    for(const v of boats)if((v!==skiff||deckStep)&&!(v===pip&&works.slip))bay.pose(v,streetTime,dt);
    if(skiff&&!deckStep){
      if(skiff!==manta&&dist(skiff,BayManta.kicker)<8)bay.clearWorkingHull(skiff,BayManta.barrier);
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
    if(panel)closePanel();motion.reset();keys.clear();waypoint=null;pickup=g;g.enter(mode,hero,motion,worn());squareUp(g);
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
  function bellFree(){
    return onStreetFeet()&&!active&&!heat&&!unit.eye&&!unit.transition&&!windowRide&&!afternoon.active&&!coffee.stage&&!rainWalk.trip&&
      !cabs.booking&&!transit.engaged&&!watchCrew.towing&&!valet.onDuty&&!gull.engaged&&!save.airmail.bag&&!wash.hasWand()&&!exchangingKey();
  }
  const atBellDesk=()=>dist(hero,luggage.counter)<1.75;
  const bootCar=v=>unitRoadCar(v)&&bootArt.supports(v.kind)&&!v.stockId&&v!==otherCar&&v!==meet.jules&&v!==meet.rival&&!v.brisasLead&&!v.onLift;
  function tailCar(){
    if(!bellFree())return null;
    for(const v of cars){
      if(Math.abs(v.x-hero.x)>5||Math.abs(v.z-hero.z)>5||!bootCar(v)||v.path||Math.abs(v.speed)>.35)continue;
      const p=BayDriving.local(v,hero.x,hero.z),rear=-bayCarLayout(v.kind).halfLength;
      if(Math.abs(p.x)<1.5&&p.z<rear+.23&&p.z>rear-1.85)return v;
    }
    return null;
  }
  function trunkContents(v){
    return luggage.slots(save.luggage,v.garageKey).map(id=>bell.pass&&bell.pass.id===id?null:id);
  }
  function inBoot(v,i){
    const s=bootArt.slots(v.kind)[i],ground=footLevel(v.x,v.z)+.008;
    return {...chassisPoint(v,s.x,s.y,s.z,ground),yaw:v.yaw,pitch:v.pitch,lean:v.lean};
  }
  function markClaim(preferred){
    if(waypoint&&!["claim","claim-car"].includes(waypoint.kind)&&!preferred)return;
    const id=preferred||luggage.hand(save.luggage)||luggage.ids.find(i=>save.luggage.bags[i].at==="boot");
    if(id)waypoint=luggage.marker(luggage.claim(id));else if(["claim","claim-car"].includes(waypoint?.kind))waypoint=null;
    lastHud=lastMap=-10;
  }
  function rememberCargoCar(v){
    if(!luggage.slots(save.luggage,v.garageKey).some(Boolean))return;
    syncProgress(readSave());
    if(luggage.park(save.luggage,v)){save.luggage.rev++;persist();}
  }
  function restoreBaggageCars(){
    for(const [key,p] of Object.entries(save.luggage.parks)){
      const v=cars.find(c=>c.garageKey===key);if(!v||!bootCar(v)||v===car||v===personalCar)continue;
      const pose={...v,...p};
      if(fitsCar(v,p.x,p.z,p.yaw)&&!cars.some(c=>c!==v&&dist(c,p)<7&&BayDriving.contact(pose,c)))Object.assign(v,p);
      v.path=null;v.used=true;BayDriving.settle(v);
    }
  }
  function transferSpot(loc,id,mesh){
    if(loc.at==="rack")return bagArt.rack(luggage.site,id);
    if(loc.at==="hand")return bagArt.hand(hero,hero.y+motion.lift,mesh);
    if(loc.at==="boot")return inBoot(bell.lid,loc.slot);
    const guest=luggage.claim(id);return bagArt.hand(guest,footLevel(guest.x,guest.z));
  }
  function passingCase(mesh){
    const p=bell.pass;if(!p)return null;
    const a=transferSpot(p.from,p.id,mesh),b=transferSpot(p.to,p.id,mesh);
    const t=clamp(p.time/.8,0,1),f=t*t*(3-2*t);
    return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f+.16*Math.sin(Math.PI*t),z:a.z+(b.z-a.z)*f,yaw:a.yaw+angle(a.yaw,b.yaw)*f};
  }
  function beginBag(id,to){
    syncProgress(readSave());
    if(!bellFree()||bell.pass)return;
    const from=save.luggage.bags[id];
    if(!from||from.at==="done"||to.at==="hand"&&luggage.hand(save.luggage))return;
    const test=luggage.read(save.luggage);if(!luggage.change(test,id,from,to))return;
    if(from.at==="boot"||to.at==="boot"){
      const at=from.at==="boot"?from:to;
      if(!bell.open||bell.amount<.92||bell.lid!==tailCar()||bell.lid.garageKey!==at.car)return;
    }
    bell.pass={id,from:{...from},to,time:0};keys.clear();
    const aim=transferSpot(to.at==="hand"?from:to,id);
    hero.yaw=Math.atan2(aim.x-hero.x,aim.z-hero.z);lastHud=-10;
  }
  function bellStep(dt){
    const p=bell.pass;
    if(p){
      p.time+=dt;
      const destination=transferSpot(p.from.at==="hand"?p.to:p.from,p.id);
      const reach=BayDriving.local(hero,destination.x,destination.z),w=p.from.at==="hand"?p.time/.8:1-p.time/.8;
      motion.handTarget={bell:true,x:clamp(reach.x,-.10,.48),z:clamp(reach.z,.12,.54),y:clamp(destination.y+.266-hero.y,.56,1.12),weight:clamp(w*1.5,0,1)};
      if(!bellFree()){bell.pass=null;}
      else if(p.time>=.8){
        syncProgress(readSave());
        if(bell.pass===p&&luggage.change(save.luggage,p.id,p.from,p.to)){
          const tag=luggage.claim(p.id);
          if(p.to.at==="boot")luggage.park(save.luggage,bell.lid);
          if(p.to.at==="done"){save.wallet+=tag.pay;save.paid++;speak(tag.person,tag.thanks);note("Claim "+tag.number+" signed","+"+cash(tag.pay)+"  ·  "+tag.label,3.5);}
          else if(p.to.at==="hand"){if(p.from.at==="rack")speak(luggage.porter.name,tag.ask);note("Check "+tag.number,tag.person+" · "+tag.place,3.6);}
          else if(p.to.at==="boot")note("Trunk · "+formatVehicle(bell.lid),tag.label+" in slot "+(p.to.slot+1),2.3);
          persist();markClaim(["boot","hand"].includes(p.to.at)?p.id:null);
        }
        bell.pass=null;lastHud=lastMap=-10;
      }
    }
    if(!bell.pass&&motion.handTarget?.bell)motion.handTarget=null;
    if(!bell.lid)return;
    if(!bell.pass&&(car||transfer||dist(hero,bell.lid)>5.1||!onStreetFeet()))bell.open=false;
    bell.amount=clamp(bell.amount+(bell.open?1:-1)*dt*1.6,0,1);
    if(!bell.open&&bell.amount===0)bell.lid=null;
  }
  function takeClaim(tag){
    if(panel!=="bell-desk"||!atBellDesk())return;
    const s=save.luggage.bags[tag.id];
    if(s.at==="boot"){
      const v=cars.find(c=>c.garageKey===s.car);if(v){closePanel();waypoint={x:v.x,z:v.z,kind:"claim-car",name:formatVehicle(v)+" · "+tag.label};lastMap=lastHud=-10;}
      return;
    }
    if(s.at!=="rack"||luggage.hand(save.luggage))return;
    closePanel();beginBag(tag.id,{at:"hand"});
  }
  function bellPanel(b){
    const book=save.luggage;
    signedNote(b,"Pick up one handle at a time. Two cases fit behind the back seat of a Marlin GT or a regular cab. Match the number on the tag to the guest’s stub.",luggage.porter.name);
    for(const [i,t] of luggage.tags.entries()){
      const s=book.bags[t.id],v=s.at==="boot"&&cars.find(v=>v.garageKey===s.car);
      const detail=s.at==="done"?"Signed by "+t.person:s.at==="rack"?t.person+" · "+t.place:s.at==="hand"?"In your hand":(v?formatVehicle(v):"Car")+" · slot "+(s.slot+1)+" · mark car";
      const row=makeButton((i+1)+"  ·  "+t.label,detail,"№ "+t.number+" / "+cash(t.pay),()=>takeClaim(t));
      row.disabled=s.at==="done"||s.at==="hand";b.append(row);
    }
    if(luggage.complete(book))b.append(makeButton("Ring for the next cart","Alma brings out the next set of cases.","Next shift",()=>{
      syncProgress(readSave());if(!atBellDesk()||!luggage.complete(save.luggage))return;
      save.luggage=luggage.read({round:save.luggage.round+1,rev:save.luggage.rev+1});persist();openPanel("bell-desk",true);
    }));
  }
  function claimStubs(b){
    const book=save.luggage;
    for(const t of luggage.tags){
      const s=book.bags[t.id];if(s.at==="rack")continue;
      const row=makeButton("№ "+t.number+" · "+t.label,t.person+" · "+t.place,s.at==="done"?"Signed · "+cash(t.pay):"Mark guest",()=>clockPin(luggage.marker(t)));
      row.disabled=s.at==="done";b.append(row);
      if(s.at==="boot"){
        const v=cars.find(c=>c.garageKey===s.car);if(v)b.append(makeButton(formatVehicle(v)+" · "+BayStreetCars.plateFor(v),"Trunk slot "+(s.slot+1),"Mark car",()=>clockPin({x:v.x,z:v.z,name:formatVehicle(v)+" · "+t.label,kind:"claim-car"})));
      }
    }
    b.append(makeButton("Alma León","Marlin Motor Court · Left luggage","Mark cart",()=>clockPin(luggage.counter)));
  }
  const nearbyGuest=()=>luggage.tags.find(t=>dist(hero,luggage.foot(t))<1.7);
  function bellHint(){
    if(!bellFree())return null;
    if(bell.pass)return ["","Passing "+luggage.claim(bell.pass.id).label.toLowerCase()];
    const hand=luggage.hand(save.luggage),v=tailCar();
    if(v){if(!bell.open||bell.lid!==v)return ["K","Open trunk · "+formatVehicle(v)];
      const items=luggage.slots(save.luggage,v.garageKey);
      return ["1 / 2",items.map((id,i)=>(i+1)+" "+(id?luggage.claim(id).label:"empty")).join("  ·  ")+(hand?"  ·  F stow":"  ·  F take")+"  ·  K close"];
    }
    if(atBellDesk())return ["F",hand?"Return "+luggage.claim(hand).label:"Alma León · Left luggage"];
    const guest=nearbyGuest();
    if(guest)return ["F",guest.person+" · Claim "+guest.number+(hand===guest.id?" · Give case":"")];
    if(hand)return ["",luggage.claim(hand).label+" · "+luggage.claim(hand).place+" · K at a car trunk"];
    return null;
  }
  function bellKey(code){
    if(bell.pass&&["KeyE","KeyF","KeyK","KeyY","KeyP","Space"].includes(code))return true;
    if(!bellFree())return false;
    const hand=luggage.hand(save.luggage);
    if(!["KeyF","KeyE","KeyK","KeyY","KeyP","KeyG","Space","Digit1","Digit2","Numpad1","Numpad2"].includes(code))return false;
    const v=tailCar();
    if(code==="KeyK"&&v){
      if(bell.lid&&bell.lid!==v)bell.amount=0;
      bell.open=bell.lid!==v||!bell.open;bell.lid=v;lastHud=-10;return true;
    }
    if(v&&bell.lid===v&&bell.open&&(code==="KeyF"||/^(Digit|Numpad)[12]$/.test(code))){
      if(bell.amount<.92)return true;
      const items=luggage.slots(save.luggage,v.garageKey);
      const i=code==="KeyF"?items.findIndex(id=>hand?!id:!!id):Number(code.slice(-1))-1;
      if(hand&&i>=0&&!items[i])beginBag(hand,{at:"boot",car:v.garageKey,slot:i});
      else if(!hand&&i>=0&&items[i])beginBag(items[i],{at:"hand"});
      else note("Marlin trunk",hand?"Choose an empty slot.":"That slot is empty.",2);
      return true;
    }
    if(code==="KeyF"){
      if(atBellDesk()){if(hand)beginBag(hand,{at:"rack"});else openPanel("bell-desk");return true;}
      const guest=nearbyGuest();
      if(guest){
        if(hand===guest.id)beginBag(hand,{at:"done"});
        else speak(guest.person,save.luggage.bags[guest.id].at==="done"?"We’re square. Alma has the signed stub.":"I’ve got check "+guest.number+". "+guest.label+".");
        return true;
      }
    }
    if(hand&&["KeyE","KeyY","KeyK","KeyG","KeyP","KeyF","Space"].includes(code)){
      note("Claim "+luggage.claim(hand).number,"Stow this case or take it to "+luggage.claim(hand).person+".",2);return true;
    }
    return false;
  }
  const rackContents=()=>luggage.rack(save.luggage).filter(id=>id!==bell.pass?.id);
  function drawLuggage(list,see){
    if(see(luggage.site,66))bagArt.world(list,model,luggage.site,rackContents());
    for(const a of [luggage.porter,...luggage.tags])if(see(a,56)){
      list.push([personSkin(a.style,a.role,0),a.x,footLevel(a.x,a.z),a.z,a.yaw]);
      if(a.id){const p=luggage.placard(a);p.y=footLevel(p.x,p.z);bagArt.receiver(list,model,p,a.id);
        if(save.luggage.bags[a.id].at==="done")bagArt.carry(list,model,a,a.id,footLevel(a.x,a.z));}
    }
    if(bell.pass)bagArt.case(list,model,bell.pass.id,passingCase(playerMesh));
  }
  function switchCar(){
    if(car?.jumpFlight)return;
    if(!car&&(bell.pass||luggage.hand(save.luggage))){note("Marlin claim check","Stow the case in the trunk before you get in.",2.5);return;}
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
    if(actor===hero&&(v===iceVan||afternoon.vehicle===v&&(afternoon.seated||afternoon.inDoor)))side=-1;
    const stationDoor=v===engine7&&!exiting&&dist(v,fireHouse)<5;
    if(stationDoor)side=-1;
    const plan=BayCarAccess.plan(v,actor,exiting,clear,side);
    if(plan||!stationDoor)return plan;
    const s=bayCarLayout(v.kind),curb=BayCarAccess.outside(s,-1),door=BayDriving.world(v,curb.x,curb.z);
    const swing=BayCarAccess.plan(v,{...actor,...door},false,clear,-1);
    if(!swing)return null;
    const front=[[-3.5,4.15],[-1.65,4.3],[-1.05,3.55],[-1.06,1.15]].map(([x,z])=>BayDriving.world(fireHouse,x,z));
    const approach=recoveryWalkway(actor,door,v,front,cars.filter(o=>o!==v&&dist(o,v)<11&&!o.path));
    return approach?{...swing,points:[...approach,...swing.points]}:null;
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
    if(a.exiting)rememberCargoCar(v);
    if(a.exiting){if(unit.met&&unitRoadCar(v))unit.remember(v,v);car=null;works.rearView=false;resetFeet();BayDriving.settle(v);if(v===workTruck||v===works.trailer.hitched)writeButtonwood();valet.leftCar(v,motorEnv);if(gull.record(v)||gull.saved.loan?.kind===v.stockId&&v.stockId){gull.remember(v);persist();}if(v===personalCar)BayMotelParking.write(v);if(v===spider)parkSpider();flushRoadDirt();return;}
    const borrowed=!!(a.owner||v.path);v.path=null;v.roadside=v.wantsCurb=false;v.pullOver=null;v.used=true;car=v;
    if(a.passenger){beginMeet("photo");return;}
    driverSeat.center();driverSeat.mirrorAt=-Infinity;
    if(!borrowed&&!active&&!v.seatHint){v.seatHint=true;note(formatVehicle(v),v===spider?"O  canvas roof · Starlite tonight on Gantry St.":"Z  driver’s seat   ·   I  wipers",3);}
    if(borrowed){addHeat(1);note("Dispatch",a.owner?a.owner.name+" reported "+BayStreetCars.plateFor(v)+".":"A driver called in the switch.",2.3);}
  }
  const cupEnv={
    clear(v,q){
      let area=cupScans.get(v);
      if(!area||streetTime-area.time>.16||dist(v,area)>3){
        const around=o=>Math.abs(o.x-v.x)<26&&Math.abs(o.z-v.z)<26;
        area={x:v.x,z:v.z,time:streetTime,blocks:solids.filter(o=>Math.abs(o.x-v.x)<25+o.w/2&&Math.abs(o.z-v.z)<25+o.d/2),
          cars:cars.concat(patrol,motos.all,transit.bus).filter(o=>o!==v&&around(o)),
          people:walkers.filter(w=>!w.palmPassenger&&around(w))};
        cupScans.set(v,area);
      }
      const sh=bayCarLayout(v.kind),radius=sh.track-.075,reach=sh.halfLength-radius-.05;
      const dx=Math.sin(q.yaw)*reach,dz=Math.cos(q.yaw)*reach;
      if(!valid(q.x,q.z,radius,area.blocks)||!valid(q.x+dx,q.z+dz,radius,area.blocks)||!valid(q.x-dx,q.z-dz,radius,area.blocks))return false;
      const probe={kind:v.kind,...q};
      for(const o of area.cars)if(Math.abs(o.x-q.x)<5.7&&Math.abs(o.z-q.z)<5.7){
        const hit=BayDriving.contact(probe,o);if(hit&&hit.depth>=(BayDriving.contact(v,o)?.depth||0))return false;
      }
      const crowding=(w,r)=>{
        const d=BayDriving.clearance(probe,w);return d<r&&d<=BayDriving.clearance(v,w)+.000001;
      };
      if(!car&&dist(hero,q)<3&&crowding(hero,.5))return false;
      return !area.people.some(w=>Math.abs(w.x-q.x)<3&&Math.abs(w.z-q.z)<3&&crowding(w,.38));
    }
  };
  const cupPlace=n=>["","1st","2nd","3rd"][n];
  function cupNear(){return onStreetFeet()&&!active&&!heat&&!unit.eye&&dist(hero,BayCoastCup.desk)<2.75;}
  function cupBook(){
    if(!save.clubCup.known){save.clubCup.known=true;persist();}
    openPanel("coast-club",true);
  }
  function cupEntry(){
    if((active&&!active.cup)||heat||room||green.run?.accepted||transfer||windowRide||unit.eye||!cup.staged(car))return false;
    if(!cup.start(car))return false;
    cup.id=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,7);
    active={job:BayCoastCup.job,cup:true};waypoint=null;save.clubCup.known=true;persist();
    speak("Luz Quintero","Two laps. North to the boardwalk, then three more lefts. Watch my board.");lastHud=lastMap=-10;return true;
  }
  function cupPanel(body){
    const book=save.clubCup,r=book.last;
    if(r){
      const title=document.createElement("h3");title.className="cup-sheet-title";title.textContent="Last classification";body.append(title);
      const table=document.createElement("table");table.className="cup-classification";table.setAttribute("aria-label","Coastline Circuit finishing order");
      const line=(values,heading=false,you=false)=>{
        const tr=document.createElement("tr");if(you)tr.className="cup-own-result";
        for(const value of values){const cell=document.createElement(heading?"th":"td");cell.textContent=value;tr.append(cell);}table.append(tr);
      };
      line(["Pos","Driver","At the flag"],true);
      if(r.field){
        const field=r.field.map((e,i)=>({...e,name:BayCoastCup.drivers[i].name}));
        field.push({name:"You · "+r.plate,time:r.time,back:0,you:true});
        field.sort((a,b)=>(a.time??Infinity)-(b.time??Infinity)||a.back-b.back);
        field.forEach((e,i)=>line([cupPlace(i+1),e.name,e.time===null?Math.round(e.back)+" m back":raceWatch(e.time)],false,e.you));
      }else line([cupPlace(r.place),"You · "+r.plate,raceWatch(r.time)],false,true);
      body.append(table);
      const info=document.createElement("p");info.className="finish-detail";
      info.textContent=r.car+(r.laps?" · Lap 1 "+raceWatch(r.laps[0])+" · Lap 2 "+raceWatch(r.laps[1]):" · Fast lap "+raceWatch(r.lap));body.append(info);
    }
    if(book.best){const p=document.createElement("p");p.className="statline";p.textContent=book.wins+" wins in "+book.starts+" finishes · Best two laps "+raceWatch(book.best)+" · Fast lap "+raceWatch(book.lap);body.append(p);}
    if(!r)signedNote(body,"Pili’s in the teal No. 7. Vic’s in the brick-red No. 4. Bring your own car to the brackets on Ocean. Two laps, all left turns. First across gets $205.","Luz Quintero · Sol Motor Club");
    if(!active){
      body.append(makeButton("Race the field","Park facing north beside the two club cars, then honk.","Find grid",()=>{
        active={job:BayCoastCup.job,cup:true};waypoint=null;closePanel();lastHud=lastMap=-10;
      }),makeButton("Run the solo clock","The original four-checkpoint run"+(save.best?" · Best "+watch(save.best):""),"Time trial",()=>startJob("race")));
    }
  }
  function cupHint(){
    if(cupNear())return ["F","Luz’s timing stand · Coastline Circuit"];
    if(active?.cup&&cup.phase==="count")return ["",""];
    if(car&&(!active||active.cup)&&!heat&&!green.run?.accepted&&!room&&!transfer&&dist(car,BayCoastCup.grid)<13&&["parked","return"].includes(cup.phase)){
      if(cup.phase==="return")return ["","Club cars returning to the grid"];
      return cup.staged(car)?["H","Start two laps with Pili and Vic"]:["","Line up facing north inside the white brackets"];
    }
    return null;
  }
  function cupTarget(){return cup.phase==="race"?BayCoastCup.gates[cup.gate]:BayCoastCup.grid;}
  function cupStep(dt){
    if(!["parked","return"].includes(cup.phase)&&(!active?.cup||car!==cup.player||transfer)){
      cup.cancel();if(active?.cup){active=null;note("Sol Motor Club","Car withdrawn. The field will meet again at the timing stripe.");}
    }
    const event=cup.step(dt,cupEnv);if(!event)return;
    lastHud=lastMap=-10;
    if(event==="go"){sound.cue("job");note("Green flag","Two laps · First left at the boardwalk",1.6);}
    else if(event==="lap"){sound.cue("job");note("White flag","One lap to go · "+raceWatch(cup.laps[0]),2.2);}
    else if(event==="timeout"){active=null;note("Course closed","Meet the field back on Ocean Drive.");}
    else if(event==="classified"){
      try{syncProgress(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
      const last=save.clubCup.last;if(last?.id===cup.id&&last.field){
        cup.runners.forEach((r,i)=>{if(r.time!==null)last.field[i].time=r.time;});persist();
      }
    }else if(event==="finish"){
      try{syncProgress(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
      const book=save.clubCup,lap=Math.min(...cup.laps),place=cup.place,pay=[0,205,130,75][place];
      book.known=true;book.starts++;book.wins+=Number(place===1);
      if(!book.best||cup.finish<book.best){book.best=cup.finish;book.splits=cup.splits.slice();}
      book.lap=Math.min(book.lap||Infinity,lap);
      book.last={id:cup.id,place,time:cup.finish,lap,laps:cup.laps.slice(),car:formatVehicle(car),plate:BayStreetCars.plateFor(car),
        field:cup.runners.map(r=>({time:r.time,back:Math.max(0,2*BayCoastCup.length-r.at)}))};
      save.wallet+=pay;save.paid++;persist();active=null;sound.cue("paid");
      note(cupPlace(place)+" · Coastline Circuit",raceWatch(cup.finish)+" · +"+cash(pay)+" · Fast lap "+raceWatch(lap),5);
      speak("Luz Quintero",place===1?"That’s the checkered flag. You put a whole car on the club sheet!":"Got you across. Your two laps are on the sheet.");
    }
  }
  function beatCurb(v){return BayCab.streetStop(v,chase.road(v));}
  function beatFree(){return play&&!active&&!room&&!heat&&!green.run&&!transfer&&!deckStep&&!windowRide&&!unit.transition&&!unit.eye;}
  const beatEnv={
    ground:footLevel,driver:()=>car,free:beatFree,wanted:()=>heat,curb:beatCurb,
    sees:(eye,v)=>chase.canSee(eye,v,0),braking:()=>held("KeyS","ArrowDown"),
    atCurb:v=>{const curb=beatCurb(v);return !!curb&&dist(v,curb)<2.6&&Math.abs(v.speed)<.65;},
    walk:(a,p)=>{
      const near=cars.filter(v=>v!==beat.v&&(dist(v,a)<7||dist(v,p)<7||dist(v,a)+dist(v,p)<dist(a,p)+3));
      return recoveryWalkway(a,p,beat.v,[],near);
    },
    say:line=>speak("Officer Solís",line),
    call:()=>{addHeat(1);note("Ocean Unit 12","Driver left the scene. Unit 12 responding.",3.4);},
    dispatch:v=>{
      const i=cars.indexOf(v);if(i<0)return;
      cars.splice(i,1);Object.assign(v,{role:"tail",visual:v.model,path:[],destination:null,wasSearching:false,planIn:0,backing:0,
        stuck:0,trafficIn:0,block:null,searchGoal:null,searchStep:0,sees:false});
      patrol.unshift(v);chase.reinforceIn=2.4;
    },
    release:v=>{
      const i=patrol.indexOf(v);if(i>=0)patrol.splice(i,1);
      if(!cars.includes(v))cars.push(v);
      Object.assign(v,{path:null,role:null,searchGoal:null,block:null,sees:false,beatLights:false});BayDriving.settle(v);
    },
    file:(v,kind)=>{
      try{syncProgress(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
      const book=save.oceanBeat,fine=kind==="warning"&&book.warnings?Math.min(25,Math.floor(save.wallet)):0;
      const road=chase.road(v);
      const street=road.vertical&&Math.abs(road.x-144)<1?"Ocean Drive":road.vertical&&Math.abs(road.x)<1?"Cine Luna":district(v);
      book.slip={kind:kind==="warning"&&book.warnings?"citation":kind,number:1+(book.slip?.number||0),fine,
        car:formatVehicle(v),plate:BayStreetCars.plateFor(v),day:hours.day+1,minute:Math.floor(hours.minute),street};
      book.known=true;if(kind==="warning"){book.warnings++;lastIncident=-100;}
      save.wallet-=fine;persist();openPanel("ocean-copy",true);
    }
  };
  function beatHint(){
    if(!beatFree())return null;
    if(beat.stop?.target===car&&car){
      if(beat.phase==="paper")return ["F","Take your driver copy"];
      if(beat.phase==="test")return ["S","Hold the brake for Solís"];
      if(beat.phase==="observe"&&!beatEnv.atCurb(car))return ["","Unit 12 · Pull up to a nearby curb"];
      return ["","Officer Solís · Keep the car stopped"];
    }
    if(onStreetFeet()&&beat.standing()&&dist(hero,beat.actor)<2.8)return ["F","Talk to Officer Solís"];
    if(beat.canCheck(car,beatEnv))return ["H","Ask Unit 12 to check your brake lamps"];
    return null;
  }
  function beatAction(){
    if(!beatFree())return false;
    if(beat.take(beatEnv))return true;
    if(!onStreetFeet()||!beat.standing()||dist(hero,beat.actor)>=2.8)return false;
    beat.time=Math.max(beat.time,27);save.oceanBeat.known=true;persist();
    beatEnv.say("Lina Solís. I work Ocean and the picture house. Pull up and honk if you want me to check your brake lamps.");return true;
  }
  function beatPage(body){
    const slip=save.oceanBeat.slip;
    if(slip){
      const c=document.createElement("canvas");c.width=600;c.height=306;c.className="take-print ocean-copy";
      c.setAttribute("role","img");c.setAttribute("aria-label",slip.kind+" · "+slip.car+" · "+slip.plate+" · "+slip.street+" · "+cash(slip.fine));
      BayOceanBeatArt.paint(c,slip);body.append(c);
    }
    signedNote(body,"I’m at the Marlin or the picture house. Park at the curb and give me a toot if a lamp’s been playing up.","Lina Solís · Ocean Unit 12");
  }
  function clearPatrol(){beat.release(beatEnv);patrol.length=0;boxed=0;lastIncident=-100;crashContacts.clear();chase.reset();backup.reset();harbor.reset();}
  function addHeat(n){
    const prev=heat;heat=Math.min(5,heat+n);lastIncident=elapsed;
    chase.report(pos(),skiff?.vx??car?.vx??motion.vx,skiff?.vz??car?.vz??motion.vz,!!skiff);lastHud=-10;
    if(!prev)sound.cue("heat");
  }
  function reportCrash(other,inward,closing){
    if(inward<4||closing<5.8||crashContacts.has(other))return;
    curbWire.bump(car,Math.min(inward,closing));
    crashContacts.set(other,true);
    if(active?.cabFare?.phase==="ride"&&active.cabFare.ride===car)active.cabFare.jolt++;
    if(!heat&&!beat.stop&&elapsed-lastIncident>25&&beat.start("warning",car,beatEnv)){
      lastIncident=elapsed;note("Ocean Unit 12","Pull over at a nearby curb for Officer Solís.",4);return;
    }
    if(!heat&&!beat.stop&&elapsed-lastIncident>25){
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
    {...BayCoastCupArt.marshal,id:"race",name:"Luz Quintero · Sol Motor Club",style:1,role:"local",prompt:"Meet Luz at the Coastline Circuit"}
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
  const currentTarget=()=>active?.freight&&spur.trip?(spur.trip.phase==="board"?spur.trip.start.desk:spur.trip.target.desk):active?.cup?cupTarget():active?.engineSeven?engineTarget():green.run?.accepted&&!active?green.run.s.route.target:mantaRide.run&&skiff===manta?mantaRide.target(clubBoat):active?.campana?campana.target(car===iceVan):!active&&waypoint?.kind==="campana-track"?{...campana.counter,name:"La Campana"}:windowRide?windowTarget():active?.buttonwood?works.target(car,skiff===pip):active?.brisas?(club.reserve&&!BayBrisasClub.switches(car)?{...plum,name:"Plum Solena 64"}:club.target):active?.palm?(palm.match?null:palm.target):active?.gull?gullTarget():active?.moto?motos.target():active?.rescue?rescue.target(rescueEnv):airTarget()||(active?.skate?skateTarget():transit.flag?transit.flag.s:transit.aboard?transit.target:active?.neon?neonTarget():active?.bridge?bridgeSite:active?.wash?wash.marker():active?.band?band.destination(car):active?.valet?valet.target(car):active?.relay?cycles.target(hero):watchCrew.towing?watchCrew.target():active?.recovery?recovery.target(car):cabs.booking||active?.cabFare?cabs.target(car):active?.field?active.field.target():active?.plate?active.plate.customer:active?.take?BayTake.runway:active?.meet?meet.target():active?.ferry?active.ferry.target(car,skiff):active?.regatta?active.regatta.target():active?.story?active.story.target(car):active?active.stops[active.index]:car===wrecker&&tow.target&&(BayRecovery.worst(tow.target)||tow.target.flatSide)?freeTowTarget:waypoint);
  function streetTarget(){
    if(active?.cup&&(cup.phase==="count"||cup.phase==="parked"&&dist(pos(),BayCoastCup.grid)<7))return null;
    if(active?.engineSeven&&(!company.manual||car!==engine7))return null;
    if(mantaRide.run&&dist(pos(),mantaRide.target(clubBoat))<30)return null;
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
    if(active?.cup&&cup.phase==="race")return cup.guide();
    if(active?.engineSeven){const guide=engineGuide();if(guide||car!==engine7)return guide;}
    if(active?.campana&&car===iceVan&&campana.phase==="drive"){
      const dest=BayCampana.stops[campana.next];
      if(!campana.guide)campana.guide=campana.runIn({...campana.station,x:iceVan.x,z:iceVan.z},dest);
      const track=campana.guide,near=track.closest(iceVan);
      if(near.gap<13){const points=[iceVan];for(let at=near.at+4;at<track.length;at+=5)points.push(track.sample(at));points.push(dest);
        return {points,meters:track.length-near.at,turn:track.length-near.at<18?"Pull into the painted bay · Window to the sidewalk":"Follow the route to "+dest.name};}
    }
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
    if(active?.freight)spur.cancel();
    if(active?.angling){motion.console=null;resetFeet();cameraSnap();lastHud=lastMap=-10;}
    if(active?.engineSeven){company.leave(sevenEnv);motion.handTarget=null;lastHud=lastMap=-10;}
    if(active?.campana){campana.abandon();commitPaletas();lastHud=lastMap=-10;}
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
    if(active?.cup)cup.cancel();
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
    const hasPassengerBoat=d=>boats.some(v=>v!==manta&&v.dock===d);
    return bay.docks.slice(0,2).find(hasPassengerBoat)||bay.docks.find(hasPassengerBoat)||bay.docks[0];
  }
  function replayFromMotel(){
    if(skiff)returnBoat(skiff,bay.docks[0]);
    if(car)BayDriving.settle(car);
    car=skiff=transfer=deckStep=null;skidLast=null;heat=0;clearPatrol();
    Object.assign(hero,{x:151,z:-27,yaw:-.18});resetFeet();
    if(!enterable()){
      const ride=ferryReceipt?.run.ride||cars[0];
      for(const [x,z] of [[149,-22.8],[148,-28],[146.6,-23.5],[146.5,-31]]){
        const probe={kind:ride.kind,x,z,yaw:0};
        if(fitsCar(ride,x,z,0)&&!cars.some(v=>v!==ride&&BayDriving.contact(probe,v))){
          Object.assign(ride,{x,z,yaw:0,path:null,passengerDoor:0,doorAngle:0});BayDriving.settle(ride);break;
        }
      }
    }
    cameraSnap();
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
    if(active?.freight)return;
    if(active?.angling)return;
    if(windowRide)return;
    if(active?.engineSeven||active?.campana||active?.buttonwood||active?.brisas||active?.palm||active?.gull||active?.moto||active?.rescue||active?.skate||active?.airmail)return;
    if(transit.engaged||active?.neon||active?.bridge||active?.wash||active?.band||active?.valet||active?.relay||active?.field||active?.cabFare||active?.recovery||cabs.booking)return;
    if(active?.plate){active.plate.step(dt);return;}
    if(active?.take)return;
    if(active?.meet||active?.cup)return;
    if(ferryScene){const running=!!active?.ferry;advanceFerry(dt);if(running)return;}
    const p=pos();
    if(active?.regatta)return;
    if(active?.story){advanceExposure(dt);return;}
    if(transfer){if(active?.running)active.clock+=dt;return;}
    if(!active){
      if(green.run?.accepted)return;
      if(waypoint?.id==="bell-run"){waypoint.x=cycles.javi.x;waypoint.z=cycles.javi.z;}
      if(waypoint?.kind==="june"){waypoint.x=band.june.x;waypoint.z=band.june.z;}
      if(waypoint?.kind==="neighbor"){const who=neighbors.byId(waypoint.id);if(who){waypoint.x=who.x;waypoint.z=who.z;}}
      if(waypoint?.kind==="neighbor-place"&&onStreetFeet()&&dist(hero,waypoint)<2.55&&neighbors.known(unit.lead,neighbors.byId(waypoint.id),"visited"))waypoint=null;
      if(waypoint&&!["dive-site","neighbor","neighbor-place"].includes(waypoint.kind)&&!(waypoint.kind==="surf-tower"&&save.shore.carried)&&dist(p,waypoint)<5){
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
    const railGap=spur.clearance(x,z);if(railGap<r&&railGap<spur.clearance(hero.x,hero.z)-.00001)return false;
    const deck=jumps.deck(x,z);
    if(deck&&deck.base+jumps.elevation(deck,x,z)>hero.y+motion.lift+.36&&jumps.deck(hero.x,hero.z)!==deck)return false;
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
    if(!roofs.raised&&motion.lift<.75)for(const s of summerCaps.posts){
      if(Math.abs(s.x-x)>5||Math.abs(s.z-z)>5)continue;
      for(const body of [s,s.button]){
        const d=Math.hypot(body.x-x,body.z-z);if(d<.44&&d<dist(hero,body)-.0001)return false;
      }
    }
    if(motion.lift<.54)for(const p of pavement.props){
      if(Math.abs(p.x-x)>2||Math.abs(p.z-z)>2)continue;
      const reach=p.phase==="down"?.73:.42,d=Math.hypot(x-p.x,z-p.z);
      if(d<reach+.16&&d<dist(hero,p)-.0001)return false;
    }
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
    if(motion.handTarget?.summer)motion.handTarget=null;
    if(company.holding&&held("Space")){motion.vx=motion.vz=0;motion.step(dt,0,0);return;}
    if(theatre.run){motion.vx=motion.vz=0;motion.step(dt,0,0);return;}
    if(motion.handTarget?.pavement)motion.handTarget=null;
    if(pavement.lift&&held("KeyL")&&!held("KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight")){
      const p=pavement.lift;hero.yaw+=angle(hero.yaw,Math.atan2(p.x-hero.x,p.z-hero.z))*(1-Math.exp(-12*dt));
      motion.vx=motion.vz=0;motion.step(dt,0,0);motion.crouch=.8*(1-p.progress);motion.handTarget={pavement:true,x:.21,y:.40+.63*p.progress,z:.40,weight:1};return;
    }
    if(bell.pass){motion.vx=motion.vz=0;motion.step(dt,0,0);return;}
    if(coffee.stage==="sip"){
      if(held("KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"))coffee.leave();
      else{motion.vx=motion.vz=0;if(!coffee.approach?.length)motion.step(dt,0,0);return;}
    }
    if(motion.handTarget?.paleta)motion.handTarget=null;
    if(active?.atLever||airLine.aboard)return;
    if(gutters.working&&held("KeyL")&&curbDrain()===gutters.working&&!held("KeyW","KeyS","KeyA","KeyD","ArrowUp","ArrowDown","ArrowLeft","ArrowRight")){
      const grate=gutters.working.grate,reach=Math.sin(Math.PI*Math.min(1,gutters.working.work*3));
      hero.yaw+=angle(hero.yaw,Math.atan2(grate.x-hero.x,grate.z-hero.z))*-Math.expm1(-8*dt);
      motion.vx=motion.vz=0;motion.step(dt,0,0);motion.crouch=.85;motion.handTarget={drain:true,x:.19,y:.38+.20*reach,z:.44,weight:1};return;
    }
    if(motion.handTarget?.drain)motion.handTarget=null;
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
    }else if(helloPose?.kind==="wave"&&neighbors.chat){
      const p=neighbors.chat.p;hero.yaw+=angle(hero.yaw,Math.atan2(p.x-hero.x,p.z-hero.z))*-Math.expm1(-6.8*dt);
    }
    hero.y=ease(hero.y,roofs.level?roofs.floor(hero):footLevel(hero.x,hero.z),27,dt);
    motion.step(dt,distance,dt?(hero.yaw-oldYaw)/dt:0);
    if(pavement.hand)motion.handTarget={pavement:true,x:.27,y:.99,z:.32,weight:1};
    if(capReach){
      const phase=Math.min(1,capReach.age/.56),reach=Math.sin(Math.PI*phase);
      hero.yaw+=angle(hero.yaw,Math.atan2(capReach.x-hero.x,capReach.z-hero.z))*Math.min(1,dt*13*reach);
      const local=BayDriving.local(hero,capReach.x,capReach.z);
      motion.handTarget={summer:true,x:clamp(local.x,-.12,.43),y:capReach.pick?.99-.77*(1-phase):capReach.y,z:clamp(local.z,.24,.59),weight:Math.min(1,reach*2)};
      if(capReach.pick)motion.crouch=Math.max(motion.crouch||0,.68*reach);
    }else if(summerCaps.hand)motion.handTarget={summer:true,x:.25,y:.99,z:.33,weight:1};
    else if(hero.summerWet>.03&&!motion.handTarget&&!rainWalk.amount){
      motion.handTarget={summer:true,x:.14,y:1.57,z:.23,weight:hero.summerWet};motion.crouch=Math.max(motion.crouch||0,.22*hero.summerWet);
    }
    if((campanaHeld()||campana.wrap>.02&&campana.manual&&paletaWindow())&&!motion.handTarget&&paletaOnFoot()){
      const reach=campana.wrap>.02?Math.sin(Math.PI*campana.wrap/.52):0;
      const bite=campana.biteTime>0?Math.sin(Math.PI*campana.biteTime/.5):0;
      motion.handTarget={paleta:true,x:.28-.18*bite,y:.99+.11*reach+.49*bite,z:.22+.32*reach-.08*bite,weight:.96};
    }
    if(hero.z>281&&hero.z<309&&BayDrawbridge.landingLevel(oldX,oldZ,-.3)!=null&&!bay.landing(hero.x,hero.z)&&BayDrawbridge.channel(hero.x,hero.z)){
      enterSurf(hero.y+motion.lift);return;
    }
    if(hero.x>208&&!(BayButtonwoodYard.onRamp(hero.x,hero.z)&&hero.y>-.52)&&!bay.landing(hero.x,hero.z,-.15)&&BaySwimming.water(hero.x,hero.z)&&
      hero.x>BaySwimming.coast(hero.z)+2.65&&motion.lift<.16)enterSurf(Math.max(0,hero.y+motion.lift));
  }
  function fitsCar(v,x,z,yaw){
    if(v.x!==undefined&&spur.blocks(v,x,z,yaw))return false;
    if(v.x!==undefined&&!jumps.canEnter(v,x,z))return false;
    const s=v.footprint||bayCarLayout(v.kind),r=s.track-.075,reach=s.halfLength-r-.05,dx=Math.sin(yaw)*reach,dz=Math.cos(yaw)*reach;
    if(gull&&Math.abs(x-53.72)<5&&z>22&&z<44)for(const k of [-1,0,1])if(gullDoorHit(x+dx*k,z+dz*k,r,v.kind==="heron"||v.kind==="paloma"?1.62:s.glass?.[5]??1.85))return false;
    if(BayRooftops.near(x,z))for(const o of stairBlocks){
      for(const k of [-1,0,1])if(Math.abs(x+k*dx-o.x)<o.w/2+r&&Math.abs(z+k*dz-o.z)<o.d/2+r)return false;
    }
    return valid(x,z,r)&&valid(x+dx,z+dz,r)&&valid(x-dx,z-dz,r);
  }
  function skidMarks(v,surface){
    if(v.slip<.30||surface<.68){skidLast=null;return;}
    const tires=carbon.contacts(v);
    if(v.burn>.32&&elapsed-puffAt>=.068){
      puffAt=elapsed;
      for(const i of [0,2])tireCloud.push({x:tires[i],y:footLevel(tires[i],tires[i+1])+.15,z:tires[i+1],born:elapsed,seed:++puffId,side:i-1});
      if(tireCloud.length>44)tireCloud.splice(0,tireCloud.length-44);
    }
    if(!skidLast){skidLast=tires;return;}
    layTireMarks(skidLast,tires);
  }
  function layTireMarks(previous,tires){
    for(const i of [0,2]){
      const dx=tires[i]-previous[i],dz=tires[i+1]-previous[i+1],d=Math.hypot(dx,dz);
      if(d<.42)continue;
      const count=Math.min(5,Math.ceil(d/.7)),yaw=Math.atan2(dx,dz);
      for(let k=0;k<count;k++){
        const f=(k+.5)/count,x=previous[i]+dx*f,z=previous[i+1]+dz*f;
        skids.push({x,z,y:footLevel(x,z)+.021,length:d/count,yaw,time:elapsed});
      }
      previous[i]=tires[i];previous[i+1]=tires[i+1];
    }
    if(skids.length>144)skids.splice(0,skids.length-144);
  }
  function readCopies(side){
    copySide=side;save.copies.known=true;persist();openPanel("carbon-copies",true);
  }
  function atCopyRail(){return !active&&onStreetFeet()&&!unit.eye&&!roofs.raised&&dist(hero,carbon.rail)<3.25;}
  function tireFeedback(v){
    return {cold:"Rear tires warming",ready:"Rear tires ready",hot:"Rear tires overheated"}[BayDriving.tireState(v)];
  }
  function copyHint(){
    if(atCopyRail())return ["F","Read Romy’s carbon copies"];
    if(!car||transfer||active||heat||dist(car,carbon.pad)>7)return null;
    if(!BayDriving.rearDrive.has(car.kind))return ["","Bring a rear-drive car · Romy likes the Marlin GT"];
    if(car.flatSide)return ["","Portside can fix that flat across the street"];
    const r=car.chalkTurn;
    if(r?.done)return ["","Release the pedals or turn the other way for a fresh print"];
    return r?["",r.side+" circle · "+Math.min(359,Math.round(r.radians*180/Math.PI))+"° / 360° · V for the rail camera"]:
      ["W + S","Stop in the chalk · Hold both pedals and steer A or D for a full circle"];
  }
  function fileCopy(result){
    const label=result.side==="left"?"Left circle":"Right circle";
    if(result.miss){note("Romy’s carbon copies","The ends didn’t meet. Settle the front tires and try again.",4);return;}
    try{syncProgress(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
    const book=save.copies,prior=book[result.side],pay=carbon.file(book,result);
    copySide=result.side;
    if(book[result.side]!==prior){
      save.wallet+=pay;persist();
      if(book.left&&book.right&&!prior)broadcastDesk.queue.unshift("Two fresh tire prints on Romy Vale’s board across from Portside Tire.");
    }
    note(label+" · "+result.card.seconds.toFixed(2)+" s",pay?cash(pay)+" from Romy · See the rubbing on the shop board":book[result.side]!==prior?"Faster copy · Shop board updated":"Clean circle · Best "+prior.seconds.toFixed(2)+" s",4);
    if(afternoon.seated&&pay)speak(BaySecondUnit.names[unit.other],"Look at those two lines. You can tell which wheel was on the inside.");
  }
  function copyPanel(body){
    const other=copySide==="left"?"right":"left",c=document.createElement("canvas");
    c.className="take-print carbon-print";c.setAttribute("role","img");c.setAttribute("aria-label",copySide+" rear-tire rubbing");
    BayContactPatchArt.paint(c,save.copies[copySide],copySide);body.append(c);
    signedNote(body,"Park in the chalk across Tideway from Portside Tire. Hold the gas and brake together, then steer until both tire marks close. Bring me one each way. — Romy","$60 for the first copy · $95 for its mate");
    body.append(makeButton("Read the "+other+" copy",save.copies[other]?.model||"Waiting for a print","Turn page",()=>readCopies(other)));
    body.append(makeButton("Mark the chalk circle","North side of Tideway, opposite Portside Tire","Set waypoint",()=>clockPin(carbon.pad)));
  }
  function logPictureJump(v,landing){
    try{syncProgress(JSON.parse(localStorage.getItem("sundownBay.v1")));}catch{}
    const book=save.pictureJumps,s=landing.site,prior=book.best[s.id],firstLook=!book.known;
    book.known=true;jumpPage=s;
    if(landing.miss){
      note(s.name+" · "+landing.distance.toFixed(1)+" m",landing.miss,4);
      if(firstLook)persist();
      return;
    }
    const fee=jumps.saveLanding(book,landing,v,formatVehicle(v));
    const best=!prior||book.best[s.id]!==prior;
    if(best){
      save.wallet+=fee;persist();
      broadcastDesk.queue.unshift("Romy Vale clocked a "+landing.distance.toFixed(1)+" metre jump at "+s.name+".");
    }
    const bonus=fee===170?" · Four Wheels Down is playing at Cine Luna":"";
    note(s.name+" · "+landing.distance.toFixed(1)+" m",(fee?cash(fee)+" location fee"+bonus:best?"New personal best":"Clean landing")+" · J for Romy’s notebook",5);
    if(afternoon.seated)speak(BaySecondUnit.names[unit.other],best?"Romy’s going to want that one on paper.":"I felt those wheels come down together.");
    lastHud=-10;
  }
  function jumpHint(){
    const chalk=jumpChalk();if(chalk)return ["F",chalk.name+" · Read Romy’s ramp marks"];
    if(!car||active||car.serviceCar||transfer)return null;
    const f=car.jumpFlight;
    if(f?.eligible)return ["A/D","Trim in the air · "+Math.max(0,jumps.along(f.site,car)).toFixed(1)+" m"+(isTop()||insideSeat()?"":" · Hold V for the roadside camera")];
    for(const s of jumps.sites){
      const d=jumps.along(s,car);
      if(d<=0&&d> -s.length-24&&Math.abs(jumps.across(s,car))<s.width*.7&&Math.cos(car.yaw-s.yaw)>.76)
        return ["",s.name+" · Carry speed up the ramp and land inside the stripes"];
    }
    return null;
  }
  function jumpChalk(){
    if(active||!onStreetFeet()||unit.eye||afternoon.photo||roofs.raised||pickup||room)return null;
    return jumps.sites.find(s=>dist(hero,s.toe)<3.8);
  }
  function openJumpBook(site){
    jumpPage=site;save.pictureJumps.known=true;persist();openPanel("picture-jumps",true);
  }
  function paintJumpPage(body){
    const s=jumpPage,record=save.pictureJumps.best[s.id],page=document.createElement("canvas");
    page.className="take-print picture-profile";page.setAttribute("role","img");
    page.setAttribute("aria-label",s.name+(record?" · "+record.model+" · "+record.distance+" metre jump":" · Unscouted ramp"));
    const paint=f=>BayPictureJumpBook.paint(page,s,record,f);
    paint(record?1:undefined);body.append(page);
    if(record){
      const control=document.createElement("label"),slider=document.createElement("input"),caption=document.createElement("span");
      control.className="jump-scrub";slider.type="range";slider.min=0;slider.max=100;slider.value=100;
      slider.setAttribute("aria-label","Scrub the recorded jump");
      const scrub=()=>{const f=Number(slider.value)/100;caption.textContent="Flight · "+(f*record.seconds).toFixed(2)+" s";paint(f);};
      slider.oninput=scrub;caption.textContent="Flight · "+record.seconds.toFixed(2)+" s";
      control.append(caption,slider);body.append(control);
    }
    body.append(makeButton("Mark the run-up",s.hint,"Set waypoint",()=>clockPin(s.runup)));
    if(jumps.complete(save.pictureJumps))
      body.append(makeButton("Four Wheels Down","Romy’s animated short follows these three jumps. Cue it at Cine Luna’s lobby case.","Mark cinema",()=>clockPin(BayCab.cinema)));
    for(const other of jumps.sites)if(other!==s){
      const best=save.pictureJumps.best[other.id];
      body.append(makeButton(other.name,other.area,best?best.distance.toFixed(1)+" m":"Read page",()=>openJumpBook(other)));
    }
  }
  function drive(dt,parking=false){
    const v=car,oldX=v.x,oldZ=v.z,oldYaw=v.yaw;
    const tr=works.trailer,towing=tr.hitched===v;
    const slipPaving=BayButtonwoodYard.surface(v.x,v.z)!=null;
    const pad=v.x>154&&v.x<175&&v.z>-102&&v.z<-83&&BayPalmaWash.floorLevel(v.x,v.z)!=null;
    const surface=slipPaving?.93*(1-.18*hours.wet):pad?.96*(1-.13*hours.wet):v.z>181?BayCut.surface(v.x,v.z)*(1-.13*hours.wet):v.x>166.45?.55:(nearStreet(v.x,v.z)?1:.84)*(1-.13*hours.wet);
    if(v===iceVan&&campana.phase==="open"||afternoon.inDoor&&afternoon.vehicle===v)parking=true;
    if(active?.cup&&cup.phase==="count")parking=true;
    if(beat.phase==="test"&&beat.stop?.target===v&&beatEnv.braking()&&!held("KeyW","ArrowUp")&&Math.abs(v.speed)<.7)parking=true;
    if(towing&&works.slip||v===engine7&&(!company.manual||company.reclaim))parking=true;
    if(gull.holds(v)||palm.holds(v)||club.show?.v===v)parking=true;
    if(v===unit4&&(!rescue.traveling||!rescue.manual||rescue.reclaim)||active?.story?.holds(v)||active?.ferry?.holds(v)||cabs.holds(v)||recovery.held(v)||band.holds(v))parking=true;
    if(serviceVehicle===v&&!heat&&!held("KeyW","ArrowUp","KeyS","ArrowDown"))parking=true;
    let steering=parking?0:Number(held("KeyD","ArrowRight"))-Number(held("KeyA","ArrowLeft"));
    if(towing&&!steering&&!parking&&held("KeyS","ArrowDown")&&held("ShiftLeft","ShiftRight")&&dist(tr,boatYard.wet)<39&&Math.abs(angle(tr.yaw,boatYard.wet.yaw))<.7)steering=BayButtonwoodStreet.backSteer(v,tr,boatYard);
    if(v.jumpFlight)jumps.airControl(v,dt,steering);
    else{
      gutters.wheels(v);
      BayDriving.step(v,dt,!parking&&held("KeyW","ArrowUp"),!parking&&held("KeyS","ArrowDown"),steering,!parking&&held("Space"),surface,v.upgrades.engine,parking);
    }
    if(parking&&beat.phase==="test"&&beat.stop?.target===v&&beatEnv.braking())v.brakes=1;
    if(!parking&&v.z>181&&(Math.abs(v.speed)>.45||v.throttle>.10))v.vz-=9.81*BayCut.grade(v.x,v.z)*dt;
    if(Math.abs(v.yaw-oldYaw)>.00001&&!fitsCar(v,v.x,v.z,v.yaw)&&fitsCar(v,v.x,v.z,oldYaw)){v.yaw=oldYaw;v.yawRate*=.3;}
    let impact=0,wallX=0,wallZ=0;
    const x=v.x+v.vx*dt,z=v.z+v.vz*dt;
    if(x!==v.x){if(fitsCar(v,x,v.z,v.yaw))v.x=x;else{impact=Math.abs(v.vx);wallX=v.vx;v.vx*=-.10;}}
    if(z!==v.z){if(fitsCar(v,v.x,z,v.yaw))v.z=z;else{impact=Math.max(impact,Math.abs(v.vz));wallZ=v.vz;v.vz*=-.10;}}
    BayStarlite.wheelStop(v,oldZ);
    if(impact>5&&bumpLock<=0){
      dent(v,wallX,wallZ,impact);if(v===unit4&&rescue.phase==="return")rescue.grade=Math.max(0,rescue.grade-impact*.9);if(recovery.call&&tow.target)recovery.call.jolts++;
      active?.plate?.jolt(impact);sound.cue("hit");bumpLock=.7;persist();lastHud=-10;
    }
    let hitVehicle=false;
    const neighbors=cars.concat(patrol,motos.all);if(dist(v,transit.bus)<13)neighbors.push(transit.bus);
    for(const other of neighbors){
      if(other===v||v===wrecker&&other===tow.target)continue;
      if(v.jumpFlight&&dist(v,other)<10){
        const roof=other===transit.bus?3.35:bayCarLayout(other.kind).glass?.[5]||1.7;
        if(v.jumpFlight.height>footLevel(other.x,other.z)+roof+.12)continue;
      }
      const hit=BayDriving.contact(v,other);
      if(!hit){if(crashContacts.has(other)&&dist(v,other)>6.3)crashContacts.delete(other);continue;}
      const {nx,nz,depth}=hit,out=Math.min(.45,depth+.012);
      hitVehicle=true;
      if(fitsCar(v,v.x+nx*out,v.z+nz*out,v.yaw)){v.x+=nx*out;v.z+=nz*out;}
      const inward=Math.max(0,-v.vx*nx-v.vz*nz),pace=other.path||other.serviceCar||other.meetCar||other.kind==="cruiser"?other.speed:0;
      const slide=other.impactSlide;
      const closing=inward+(slide?nx*slide.vx+nz*slide.vz:pace*(nx*Math.sin(other.yaw)+nz*Math.cos(other.yaw)));
      if(closing>6&&inward>2&&!parking&&!crashContacts.has(other)&&bumpLock<=0){
        dent(v,-nx,-nz,closing);if(!motos.all.includes(other))dent(other,nx,nz,closing);
        if(v===unit4&&rescue.phase==="return")rescue.grade=Math.max(0,rescue.grade-closing*.85);
        if(recovery.call&&tow.target)recovery.call.jolts++;
        persist();lastHud=-10;
      }
      if(!parking)reportCrash(other,inward,closing);
      if(!parking&&streetFleet.has(other)&&other!==otherCar&&!other.onLift&&!other.roadside&&
        !other.guestId&&!other.owner&&!other.washGuest&&other!==windowRide?.vehicle&&other!==tow.target&&
        other!==active?.story?.ride&&other!==active?.ferry?.ride&&other!==band.june.ride&&other!==transfer?.v&&other!==afternoon.vehicle&&other!==works.trailer.hitched){
        BayDriving.exchangeImpact(v,other,hit);
      }else{
        v.vx+=nx*inward*1.10;v.vz+=nz*inward*1.10;v.yawRate*=Math.exp(-3*dt);other.wait=1.4;
      }
      if(closing>4.8&&bumpLock<=0){active?.plate?.jolt(closing);sound.cue("hit");bumpLock=.7;}
    }
    if(!v.jumpFlight&&backup.driveThrough(v,dt,oldX,oldZ,oldYaw)){
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
    BayDriving.signedSpeed(v);
    // A loaded trailer stays grounded. On other cars the same physical deck works during jobs and in free roam.
    if(!towing&&!(v===wrecker&&tow.target)){
      const landing=jumps.step(v,{x:oldX,z:oldZ},dt,footLevel,!active&&!v.serviceCar&&!parking,hitVehicle||impact>1);
      if(landing?.eligible)logPictureJump(v,landing);
    }
    if(v.jumpFlight)skidLast=null;else skidMarks(v,surface);
    if(v.burn>.01||v.chalkTurn){
      const result=carbon.step(v,dt,oldYaw,!active&&!heat&&!hitVehicle&&!impact&&!parking&&!towing&&!v.jumpFlight&&
        !v.flatSide&&held("KeyW","ArrowUp")&&held("KeyS","ArrowDown"));
      if(result)fileCopy(result);
    }
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
    const squash=v.jumpCompression;
    const lift=(v.hydraulic?.bodyLift||0)+(v.jumpFlight?v.jumpFlight.height-footLevel(v.x,v.z):0)-
      (squash?squash.depth*Math.sin(squash.time/.44*Math.PI)*Math.exp(-4*squash.time):0);
    if(v!==serviceVehicle)return lift;
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
    const timingBay=v.greenId&&BayDriving.local(BayOnGreen.route(v.greenId),x,z);
    const apron=timingBay&&timingBay.x<8.45&&timingBay.x>0&&timingBay.z>=-71&&timingBay.z<=-14||
      v.brisasLead&&x>103&&x<143&&z>46.6&&z<77||v.recoveryOwner&&x>-92&&x<-69&&z>-39&&z<2||v.washGuest&&x>146&&x<168&&z>-161&&z<-66;
    const roadDistance=county?county.d:Math.min(Math.abs(x-nearestAxis(x)),Math.abs(z-nearestAxis(z)));
    if(!apron&&roadDistance>(county?county.route.halfWidth-.55:5.95)){
      const returning=v.findLane&&(county?BayCut.nearest(v.x,v.z).d:Math.min(Math.abs(v.x-nearestAxis(v.x)),Math.abs(v.z-nearestAxis(v.z))))>roadDistance;
      if(!returning)return false;
    }
    if(!fitsCar(v,x,z,yaw))return false;
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
  let nextJunctionScan=-1;
  function slideClear(v,x,z,yaw){
    if(!fitsCar(v,x,z,yaw))return false;
    const next={kind:v.kind,x,z,yaw};
    const blocks=o=>{
      if(o===v||Math.abs(o.x-x)>10||Math.abs(o.z-z)>10)return false;
      const hit=BayDriving.contact(next,o);
      return hit&&hit.depth>(BayDriving.contact(v,o)?.depth||0)+.000001;
    };
    if(cars.some(blocks)||patrol.some(blocks)||motos.all.some(blocks)||blocks(transit.bus)||boatTrailerBlocks(next,v))return false;
    const near=p=>Math.abs(p.x-x)<5&&Math.abs(p.z-z)<5&&BayDriving.clearance(next,p)<.36&&
      BayDriving.clearance(next,p)<BayDriving.clearance(v,p);
    return !(onStreetFeet()&&near(hero))&&!walkers.some(w=>!w.palmPassenger&&near(w));
  }
  function traffic(dt){
    const p=pos(),driver=play&&!transfer&&!cycles.transfer?(car||motos.bike||cycles.riding||skate.rider||(transit.driving?transit.bus:null)):null;
    const laneTraffic=cars.concat(patrol,motos.all,transit.bus);
    if(coffee.stage)coffee.step(dt,hero,coffeeEnv);
    const scan=streetTime>=nextJunctionScan;
    if(scan||BayStreetArt.signals.some(s=>s.call)){
      const vehicles=driver&&!laneTraffic.includes(driver)?laneTraffic.concat(driver):laneTraffic;
      if(scan){BayCrosswalk.watchTraffic(BayStreetArt.signals,vehicles);nextJunctionScan=streetTime+.12;}
      for(const s of BayStreetArt.signals)BayCrosswalk.update(s,streetTime,vehicles,walkers,play&&onStreetFeet()?hero:null);
    }
    for(const v of cars){
      if(v.impactSlide&&v!==car&&v!==transfer?.v){
        const s=v.impactSlide,scrub=Math.abs(s.vx*Math.cos(v.yaw)-s.vz*Math.sin(v.yaw))+Math.abs(s.spin);
        if(scrub>1.7&&!s.tires)s.tires=carbon.contacts(v);
        BayDriving.slideStep(v,dt,hours.wet,slideClear);
        if(s.tires)layTireMarks(s.tires,carbon.contacts(v));
        if(!v.impactSlide&&v===personalCar)BayMotelParking.write(v);
        continue;
      }
      if(!v.path||v===car||v===transfer?.v){v.leftWait=v.lanes=null;if(v!==car||v===transfer?.v)v.indicator=0;continue;}
      const t=v.path[v.corner],from=v.path[(v.corner+v.path.length-1)%v.path.length];
      const dx=t.x-from.x,dz=t.z-from.z,n=Math.hypot(dx,dz)||1,ux=dx/n,uz=dz/n;
      const remaining=(t.x-v.x)*ux+(t.z-v.z)*uz,offset=(v.x-from.x)*uz-(v.z-from.z)*ux;
      if(v.findLane&&Math.abs(offset)<.2&&Math.abs(angle(v.yaw,Math.atan2(ux,uz)))<.15)v.findLane=false;
      if(remaining<.045){
        if(v.finiteRoute&&v.corner===v.path.length-1){v.path=null;v.indicator=0;v.yaw+=angle(v.yaw,v.finiteYaw);BayDriving.settle(v);}
        else v.corner=(v.corner+1)%v.path.length;
        continue;
      }
      const yielding=play&&(rescue.yielding(v,ux,uz,remaining,offset,streetTime)||BayRescue.yieldTo(engine7,"sevenYield",v,ux,uz,remaining,offset,streetTime));
      v.indicator=yielding&&!yielding.cross?1:BayMotorCourt.signal(v);
      v.wait=Math.max(0,v.wait-dt);
      if(v.wantsCurb&&!v.greenId&&!v.brisasLead&&!v.guestId&&!v.washGuest&&!v.pullOver&&streetTime>=(v.curbCheck||0)){
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
      const halfLength=bayCarLayout(v.kind).halfLength;
      const lane=play&&v.cityLanes&&BayBoulevardLanes.update(v,{ux,uz,from,remaining,offset,time:streetTime,vehicles:laneTraffic,player:car,
        override:!!(yielding||stop||v.reaction||v.finiteRoute||heat&&patrol.some(q=>dist(v,q)<25))});
      if(lane?.signal)v.indicator=lane.signal;
      if(v.cityLanes&&v.reversing&&!lane?.reverse){v.reversing=false;v.speed=Math.max(0,v.speed);}
      if(lane?.reverse){
        v.speed=0;v.reversing=true;v.brakes=1;
        const step=.82*dt,x=v.x-ux*step,z=v.z-uz*step;
        if(lane.back&&spaceToSwerve(v,x,z,v.yaw,0,true)&&
          (!onStreetFeet()||BayDriving.clearance({kind:v.kind,x,z,yaw:v.yaw},hero)>.5)){
          v.x=x;v.z=z;v.speed=-.82;v.brakes=.12;v.wheelSpin-=step/bayCarLayout(v.kind).wheel;
        }
        continue;
      }
      let clearance=Math.min(v.z>224?bridge.stopDistance(v,ux,uz,halfLength):Infinity,spur.stopDistance(v,ux,uz,halfLength)),redAhead=Number.isFinite(clearance);
      if(play&&(v.cityLanes||v.greenId))clearance=Math.min(clearance,BayJunctionTurns.distance(v,laneTraffic,car,streetTime,ux,uz,remaining));
      if(lane)clearance=Math.min(clearance,lane.gap,BayBoulevardLanes.holdGap(v,lane,ux,uz,streetTime));
      if(v.greenRacing&&v.passHold&&streetTime<=v.passHold.until){
        const q=v.passHold.body,rx=q.x-v.x,rz=q.z-v.z,front=rx*ux+rz*uz;
        if(front>0&&Math.abs(rx*uz-rz*ux)<2.05)clearance=Math.min(clearance,Math.max(0,front-9.4));
      }
      const ahead=(q,width,gap)=>{
        if(lane&&q===lane.skip)return;
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
      if(lane?.skip!==transit.bus&&Math.abs(v.x-transit.bus.x)<25&&Math.abs(v.z-transit.bus.z)<25){
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
        const line=BayCrosswalk.setback(s,bayCarLayout(v.kind).halfLength,9.7);
        if(side<(lane?6.45:4.4)&&BayCrosswalk.beforeLine(s,d,line,9.7,v.speed)&&d<26&&BayCrosswalk.trafficWait(s,streetTime,vertical)){
          clearance=Math.min(clearance,Math.max(0,d-line));redAhead=true;
        }
      }
      const response=v.reaction,evading=response&&streetTime<response.until,before=v.speed;
      let maximum=stop?Math.min(4.6,Math.max(.36,run*.94)):evading?(response.offset?v.pace*.52:0):v.pace;
      if(lane)maximum=Math.min(maximum,lane.max);
      if(yielding)maximum=Math.min(maximum,yielding.max);
      if(v.finiteRoute&&v.corner===v.path.length-1)maximum=Math.min(maximum,Math.max(.5,remaining*1.3));
      if(v.indicator)maximum=Math.min(maximum,v.greenRacing?15:5.7);
      const pace=v.wait>0?0:Math.min(maximum,clearance*1.24);
      v.speed=ease(v.speed,pace,pace<v.speed?(evading?6.2:4.1):1.7,dt);
      let step=Math.min(remaining,clearance,run,v.speed*dt);
      const goal=stop?2.8:yielding?yielding.goal:evading?response.offset*clamp((remaining-.4)/4,0,1):lane?lane.goal:0;
      const lateralLimit=step*((evading||yielding?.goal>.1||lane?.change) ? .76 : .48);
      let lateral=clamp(step*(lane?.slope||0)+(goal-offset)*-Math.expm1(-(evading?5.6:3.9)*dt),-lateralLimit,lateralLimit);
      const x=v.x+ux*step,z=v.z+uz*step;
      if((response||lane?.change||Math.abs(lateral)>.00001)&&step>0&&!spaceToSwerve(v,x+uz*lateral,z-ux*lateral,v.yaw,0,true)){
        if(lane?.change||!lateral||!spaceToSwerve(v,x,z,v.yaw,0,true)){step=0;v.speed=0;}
        lateral=0;
      }
      const oldX=v.x,oldZ=v.z,oldYaw=v.yaw;
      if(step>0&&spur.blocks(v,v.x+ux*step+uz*lateral,v.z+uz*step-ux*lateral,v.yaw)){step=0;lateral=0;v.speed=0;v.brakes=1;}
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
      if(v.brisasLead||lane||v.kind==="estate"||v.kind==="stepside"){
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
    if(play&&company.burning){
      const c=company.call;
      for(const w of walkers)if(!w.onTour&&!w.startle&&w.id%3!==0&&dist(w,c)<8.4){
        w.alert=Math.max(w.alert||0,.35);w.yaw+=angle(w.yaw,Math.atan2(c.x-w.x,c.z-w.z))*Math.min(1,dt*3.8);
      }
    }
    BayLocals.animatePeople(play?walkers:titleWalkers,dt,driver,cars,BayStreetArt.signals,streetTime,
      (x,z,r)=>valid(x,z,r)||z>310&&bay.landing(x,z,r),play?hours.rain:0,play?spur:null);
    if(play&&driver&&driver===car)for(const w of neighbors.people){
      if(!w.startle||w.notedPass===w.startle)continue;
      w.notedPass=w.startle;neighbors.incident(w,car,"pass",unit.lead);
    }
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
  function tuneRadio(direction,station=null){
    const device=receiverId();if(!device||broadcastDesk.mix)return false;
    const next=station?BayAirwaves.tuneTo(device,station):BayAirwaves.tune(device,direction);sound.cue("fm-tune",{station:next});
    if(band.tape){band.tape=null;band.onAir=false;}
    if(onAir){onAir=null;sound.stopField();}
    updateRadio();lastHud=-10;return true;
  }
  function updateRadio(){
    const id=receiverId();
    if(id&&save.airwaves.request&&BayAirwaves.stationFor(id)==="sol"){
      writeRadioBook(b=>{if(!b.request)return false;b.encore={id:b.request,at:hours.total};b.request="";});
    }
    broadcastDesk.update(id,hours.total,elapsed);
    carRadios.step(windowListener(),car,streetTime,hours.total,save.airwaves,isTop()?cameraRig.yaw:cam.yaw);
    const story=neighbors.unheard;
    if(broadcastDesk.headlines(save,hours,bridge,elapsed,gutters,story?.news))neighbors.aired(story);
  }
  function windowListener(){
    if(!play||room||unit.eye||afternoon.photo||unit.transition||transfer||heat||active||broadcastDesk.mix||band.tape||onAir)return null;
    return car&&unitRoadCar(car)?car:onStreetFeet()&&!cabs.booking&&!transit.engaged?hero:null;
  }
  function askAboutSong(){
    const at=windowListener();if(!at)return false;
    const answer=carRadios.ask(at,car,streetTime,hours.total,save.airwaves);if(!answer)return false;
    if(car)tuneRadio(1,answer.station);
    speak(answer.v.owner.name,answer.line);
    localVoice=answer.v;voiceCheck=elapsed+.2;
    const station=BayAirwaves.stations[answer.station];
    $("neighborTag").textContent=station.frequency+" · "+station.name;
    $("hud").classList.toggle("neighbor-speech",true);
    note(answer.song.title,(car?"On your dial":"From the "+answer.v.kind)+" · "+(answer.fresh?"Saved to J → Open Windows":"J → Open Windows"),3.6);
    lastHud=-10;return true;
  }
  function openWindowsPanel(body){
    for(const c of BayOpenWindows.cards()){
      const s=BayAirwaves.stations[c.song.station];
      body.append(makeButton(c.song.title+" · "+c.song.artist,c.by+" on "+c.street+" · Request on "+s.frequency+" "+s.name,"Call it in",()=>{
        BayAirwaves.requestSong(c.song.id,hours.total);
        if(receiverId())tuneRadio(1,c.song.station);
        closePanel();speak(s.host,"This one’s for the listener on "+c.street+". "+c.song.artist+" on "+s.name+".");
        note("Listener request",c.song.title+" · On air at "+s.frequency+" FM",3.8);
      },"row-action window-record "+c.song.station));
    }
  }
  function curbVehicle(){return play&&car&&!transfer&&!active?.take&&!motos.finder&&!unit.eye&&!room&&!car.serviceCar?car:null;}
  const coffeeEnv={
    free:()=>freeFeet()&&!heat&&!active&&!unit.eye&&!unit.transition&&!roofs.raised&&!afternoon.photo&&!rainWalk.trip&&!windowRide&&!palm.playerSeat&&!broadcastDesk.mix,
    day:()=>hours.day+1,angle,say:line=>speak("Bea Serrano",line),
    approach:(path,dt)=>BayCarAccess.walkPath(hero,motion,path,dt,footLevel,1.7)
  };
  function cornerAction(use=false){
    if(!onStreetFeet()||!coffeeEnv.free())return "";
    const s=BayCrosswalk.button(BayStreetArt.signals,hero);
    if(coffeeEnv.free()){
      if(coffee.invited(hero)){
        if(use){coffee.join();if(s)BayCrosswalk.call(s,streetTime);speak("Bea Serrano",!coffee.cups?"I’ve got ten minutes off the desk. Walk over to the Palm with me? I’ll get the coffee.":coffee.lastDay===hours.day+1?"Back for a refill already? Come on, then.":"My usual walking partner. Two cups again?");}
        return "Walk to the Palm with Bea";
      }
      if(coffee.stage==="sip"){if(use)coffee.leave();return "Put the cup down";}
      if(coffee.nearCup(hero)&&(coffee.stage==="table"||!coffee.stage)){
        if(use){
          const table=BayPalmCoffee.site,via=[{x:table.x,z:table.z+1.0},{x:table.x,z:table.z-1.0}];
          const path=recoveryWalkway(hero,BayPalmCoffee.guest,null,via,cars.filter(c=>dist(c,table)<8));
          if(coffee.pour(path)){motion.vx=motion.vz=0;keys.clear();}
        }
        return coffee.stage==="table"?"Have coffee with Bea":"Have a cup at the Palm";
      }
    }
    if(s){
      const phase=BayCrosswalk.phase(s,streetTime);
      if(!use&&phase!=="idle")return phase==="walk"?"Walk light · Cross with the signal":phase==="finish"?"Flashing hand · Finish crossing":"Walk light requested";
      if(use&&BayCrosswalk.call(s,streetTime))note("Pedestrian signal","Call received. Watch the far corner for the walk figure.",2.1);
      return "Press the walk button";
    }
    return "";
  }
  const wireEnv={
    floor:footLevel,pose:roadBody,hours,people:walkers,free:w=>w!==band.local&&!w.onTour&&!w.palmManaged,
    street:v=>BayStreetNames.through(v,v.yaw)||district(v),
    get wanted(){return heat>0;},
    present:v=>cars.includes(v)||patrol.includes(v),
    nearby(v){return [...patrol,...cars.filter(c=>c!==v&&Math.abs(c.x-v.x)<42&&Math.abs(c.z-v.z)<42).sort((a,b)=>dist(a,v)-dist(b,v))];},
    sees(w,v){
      return scoutSight({x:w.x,y:footLevel(w.x,w.z)+1.54,z:w.z},{x:v.x,y:(v.jumpFlight?.height??footLevel(v.x,v.z))+.9+(v.hydraulic?.bodyLift||0),z:v.z});
    }
  };
  const wireDeskNear=()=>onStreetFeet()&&dist(hero,wireDesk.stand)<2.35;
  function wireWitnessNear(){
    const w=curbWire.author;if(!w?.curbClip||!onStreetFeet()||dist(hero,w)>2.65||elapsed-(w.curbPosted??-100)>90)return null;
    return curbWire.book.clips.find(c=>c.id===w.curbClip);
  }
  function curbStep(dt){
    const w=curbWire.shot?.w,c=curbWire.step(dt,curbVehicle(),wireEnv);
    if(c){if(w){w.curbPosted=elapsed;w.curbClip=c.id;}
      if(!heat&&!active)note("Bay Wire · "+BayCurbWire.titles[c.type],curbWire.book.edits[c.type]?.id===c.id?"Meli kept your take · "+Object.keys(curbWire.book.edits).length+" of 3 in the street edition":c.by+" filmed you on "+c.street+" · J to watch",4);
      lastHud=-10;
    }
  }
  function wireOpen(id=0){
    wireSelected=id;if(wireDeskNear())curbWire.book.meet();
    openPanel("curb-wire",panel==="curb-wire");
  }
  function wireButton(){
    return makeButton("On the Curb · Bay Wire",curbWire.book.clips.length?"Local footage · Latest from "+curbWire.book.clips[0].by:"Meli’s neighborhood video column.","Watch",()=>wireOpen());
  }
  function editionPrint(b,story){
    const page=document.createElement("figure"),picture=document.createElement("canvas"),caption=document.createElement("figcaption");
    const name=document.createElement("strong"),copy=document.createElement("p");
    page.className="wire-archive";picture.width=576;picture.height=384;picture.setAttribute("role","img");
    picture.setAttribute("aria-label",story.name+" · Bay Wire archive photograph");
    BayNeighborhoodEdition.paint(picture,story.id);name.textContent=story.name;copy.textContent=story.news;
    caption.append(name,copy);page.append(picture,caption);b.append(page);
  }
  function wirePanel(b){
    const book=curbWire.book;book.refresh();
    if(neighbors.editions.length)b.append(makeButton("Bay Wire · Neighborhood edition",neighbors.editions.map(s=>s.name).join(" · "),"Read",()=>openPanel("wire-edition")));
    const all=[...new Map([...book.clips,book.cover,...Object.values(book.edits)].filter(Boolean).map(c=>[c.id,c])).values()];
    const at=Math.max(0,all.findIndex(c=>c.id===wireSelected)),clip=all[at];
    if(!clip){
      wireList(b,book);signedNote(b,"A clean pass, a sideways corner, a hydraulic hop. If somebody on the sidewalk sees it, the clip lands here. Tap your horn near me first and I’ll have the phone up by the time you hit the gas.","Meli Funes · Bay Wire");
      return;
    }
    const canvas=document.createElement("canvas");canvas.className="curb-film";canvas.width=384;canvas.height=216;
    canvas.setAttribute("aria-label",BayCurbWire.titles[clip.type]+", filmed by "+clip.by+" on "+clip.street);b.append(canvas);
    const caption=document.createElement("p");caption.className="curb-credit";
    caption.textContent=clip.by+" · "+clip.street+" · Day "+clip.day+" · "+BayHours.time(clip.minute);b.append(caption);
    const duration=clip.frames.at(-1)[0],transport=document.createElement("div");transport.className="curb-transport";
    const toggle=document.createElement("button");toggle.textContent="Pause";
    const scrub=document.createElement("input");scrub.type="range";scrub.min="0";scrub.max=String(duration);scrub.step=".025";scrub.value="0";scrub.setAttribute("aria-label","Scrub the street clip");
    const counter=document.createElement("output");transport.append(toggle,scrub,counter);b.append(transport);
    wireView={clip,canvas,toggle,scrub,counter,t:0,playing:true,last:performance.now(),frame:-1};
    toggle.onclick=()=>{if(!wireView)return;wireView.playing=!wireView.playing;wireView.last=performance.now();toggle.textContent=wireView.playing?"Pause":"Play";};
    scrub.oninput=()=>{if(!wireView)return;wireView.playing=false;toggle.textContent="Play";wireView.t=Number(scrub.value);wireView.frame=-1;paintWire(performance.now());};
    paintWire(performance.now());
    const heading=BayCurbWire.titles[clip.type]+(clip.called?" · Called shot":"");
    const pinned=clip.id===book.pin;
    const tvButton=makeButton(heading,clip.score+"/100 · "+(pinned?"Showing on Meli’s curbside TV":"Put this clip on the TV outside the Marlin."),pinned?"On screen":"Pin to TV",()=>{
      book.mount(clip);wireOpen(clip.id);
    });
    tvButton.disabled=pinned;b.append(tvButton);
    if(all.length>1)b.append(makeButton("Another clip",(at+1)+" of "+all.length+" · The six latest clips stay on your phone.","Next",()=>wireOpen(all[(at+1)%all.length].id)));
    wireList(b,book);
    b.append(makeButton("Where it was filmed",clip.street+" · "+clip.by+"’s camera position","Mark map",()=>clockPin({...clip.eye,name:clip.street+" · On the Curb"})));
  }
  function wireList(b,book){
    if(!book.list){
      if(wireDeskNear())b.append(makeButton("Take Meli’s shot list","A street pass, a sliding corner and a hydraulic hop. Call each shot with your horn before you do it.","Take list",()=>{
        book.takeList();openPanel("curb-wire",true);
      }));
      else if(book.met)b.append(makeButton("Meli’s shot list","Pick it up at the video cart outside the Marlin.","Find cart",()=>clockPin(wirePin)));
      return;
    }
    const slip=document.createElement("div");slip.className="curb-slip";
    const head=document.createElement("strong");head.textContent=book.complete?"Three on the Wire · Now showing at the cart":"Meli’s shot list";slip.append(head);
    const brief=document.createElement("p");brief.textContent="Hail a witness with your horn before each take. I keep your best of each for the three-clip edition.";slip.append(brief);
    for(const type of BayCurbWire.assignments){
      const c=book.edits[type],line=document.createElement(c?"button":"div");
      line.textContent=(c?"✓ ":"○ ")+BayCurbWire.titles[type]+(c?" · "+c.by+" · "+c.score+"/100":"");
      if(c)line.onclick=()=>wireOpen(c.id);slip.append(line);
    }
    b.append(slip);
  }
  function paintWire(now){
    const v=wireView;if(!v)return;const end=v.clip.frames.at(-1)[0];
    if(v.playing){v.t=(v.t+Math.min(.3,(now-v.last)/1000))%end;v.scrub.value=String(v.t);}v.last=now;
    const f=Math.floor(v.t*12);if(v.frame===f)return;v.frame=f;
    BayCurbWire.paint(v.canvas,v.clip,v.t,rideScenery);v.counter.textContent=v.t.toFixed(1)+" / "+end.toFixed(1)+" s";
  }
  function updateWireTV(t){
    const book=curbWire.book,editions=neighbors.editions;
    if(!play||room||dist(pos(),wireDesk)>20||!book.cover&&!editions.length)return null;
    const playlist=book.complete?BayCurbWire.assignments.map(id=>book.edits[id]):book.cover?[book.cover]:[];
    // A hand-picked clip opens the loop even after the whole edition is signed.
    if(book.complete&&book.cover&&playlist[0].id!==book.pin)playlist.unshift(book.cover);
    const clipSeconds=playlist.reduce((sum,c)=>sum+c.frames.at(-1)[0],0);
    let time=t%(clipSeconds+editions.length*5),clip=playlist[0];
    if(!wireTV){wireTV=document.createElement("canvas");wireTV.width=128;wireTV.height=80;}
    const page=streetTime<(freshEdition?.until??0)?freshEdition.story:time>=clipSeconds?editions[Math.floor((time-clipSeconds)/5)]:null;
    if(page){
      const stamp="edition/"+page.id;if(wireLastFrame!==stamp){BayNeighborhoodEdition.paint(wireTV,page.id);wireTVVersion++;wireLastFrame=stamp;}
      return wireTV;
    }
    for(const c of playlist){clip=c;const end=c.frames.at(-1)[0];if(time<end)break;time-=end;}
    if(t<wireNextTV&&wireLastFrame.startsWith(clip.id+"/"))return wireTV;
    const stamp=clip.id+"/"+Math.floor(time*6);
    if(stamp!==wireLastFrame){BayCurbWire.paint(wireTV,clip,time,rideScenery);wireTVVersion++;wireLastFrame=stamp;}
    wireNextTV=t+.16;return wireTV;
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
    if(coffee.stage==="walk"||coffee.stage==="table"){span=coffee.stage==="walk"?29:16;ahead=1.5;}
    if(onStreetFeet()&&luggage.hand(save.luggage)){span=29;ahead=2.5;}
    f.span=ease(f.span,span,4.7,dt);f.ahead=ease(f.ahead,ahead,4.7,dt);f.beside=ease(f.beside,beside,5.5,dt);
  }
  const keyView={mix:0,x:0,z:0};
  const coffeeFrame={mix:0,active:false,yaw:0,tilt:0};
  const trunkFrame={mix:0,v:null,yaw:0,tilt:0,side:1,near:[]};
  const coffeeObstacles=solids.filter(o=>o!==BayPalmCoffee.block&&Math.abs(o.x-BayPalmCoffee.site.x)<o.w*.5+7&&Math.abs(o.z-BayPalmCoffee.site.z)<o.d*.5+7);
  function moveCamera(dt,t){
    if(spur.aboard&&held("KeyV")){
      const v=spur.van,spot=BayDriving.world(v,-4.7,-3.5);
      Object.assign(cam,{x:spot.x,y:3.25,z:spot.z,yaw:Math.atan2(v.x-spot.x,v.z-spot.z),pitch:-.31,focal:1.32});return;
    }
    const angler=active?.angling;
    if(angler&&!angler.walkIn){
      const s=angler.site,aim=angler.cork||BayRedCork.shoal(s,streetTime),eye=BayDriving.world(s,-1.52,-2.05);
      const x=hero.x+(aim.x-hero.x)*.59,z=hero.z+(aim.z-hero.z)*.59,y=s.y+2.46;
      Object.assign(cam,{x:eye.x,z:eye.z,y,yaw:Math.atan2(x-eye.x,z-eye.z),pitch:Math.atan2(.43-y,Math.hypot(x-eye.x,z-eye.z)),focal:1.32});
      const m=BayRedCorkArt.measure(angler);
      if(m){const target={x:s.x-1.25,z:s.z+2.25,y:s.y+2.0},f=m.blend;
        cam.x+=f*(target.x-cam.x);cam.z+=f*(target.z-cam.z);cam.y+=f*(target.y-cam.y);
        cam.yaw+=f*angle(cam.yaw,Math.atan2(m.x-target.x,m.z-target.z));
        cam.pitch+=f*(Math.atan2(m.y-target.y,dist(m,target))-cam.pitch);cam.focal+=f*.37;
      }return;
    }
    if(company.holding&&held("Space")){
      const site=company.call,aim=BayDriving.world(site,company.aimX*.48,-.5),face={...hero,yaw:Math.atan2(site.x-hero.x,site.z-hero.z)};
      const anchor={x:hero.x,z:hero.z,y:hero.y+1.54},cover=sevenEnv.coverSite===site?sevenEnv.cover:cameraRig.obstacles;
      let eye=BayDriving.world(face,-.15,.49),yy=anchor.y+.04;
      for(const [side,back] of [[-1.22,-2.2],[-1.56,-.73],[1.5,-.82],[-1.58,.04],[1.46,.04]]){
        const q={...BayDriving.world(face,side,back),y:hero.y+2.10};
        if(BayDriving.clearance(engine7,q)<.36||BayCamera.safeFraction(anchor,q,cover)<.99)continue;
        if([.24,.5,.76].some(f=>BayDriving.clearance(engine7,{x:q.x+(aim.x-q.x)*f,z:q.z+(aim.z-q.z)*f})<.19))continue;
        eye=q;yy=q.y;break;
      }
      const focus={x:aim.x*.76+hero.x*.24,z:aim.z*.76+hero.z*.24};
      Object.assign(cam,{x:eye.x,z:eye.z,y:yy,yaw:Math.atan2(focus.x-eye.x,focus.z-eye.z),pitch:Math.atan2(1.08-yy,dist(eye,focus)),focal:1.26});return;
    }
    if(theatre.run||theatre.visit){
      const watching=!!theatre.visit,shape=watching&&bayCarLayout(car.kind);
      const eye=watching?BayDriving.world(car,-shape.track*.46,shape.sections.at(-1)[0]-.10):{x:hero.x+.18,z:hero.z+.15};
      const x=eye.x,z=eye.z,y=watching?footLevel(car.x,car.z)+Math.max(1.16,shape.glass[4]+.18):1.70;
      Object.assign(cam,{x,y,z,yaw:Math.atan2(starliteSite.x-x,starliteSite.z+10-z),pitch:Math.atan2(3.70-y,Math.hypot(starliteSite.x-x,starliteSite.z+10-z)),focal:watching?1.64:1.85});return;
    }
    const opening=bell.open&&bell.lid&&onStreetFeet();
    if(opening&&trunkFrame.v!==bell.lid){
      const v=bell.lid;trunkFrame.v=v;trunkFrame.yaw=cameraRig.yaw;trunkFrame.tilt=cameraRig.elevation;
      // Look over the clear rear corner, away from the shoulder beside the trunk.
      trunkFrame.side=BayDriving.local(v,hero.x,hero.z).x<0?-1:1;
      trunkFrame.near=cameraRig.obstacles.filter(o=>Math.abs(o.x-v.x)<o.w*.5+9&&Math.abs(o.z-v.z)<o.d*.5+9);
    }
    trunkFrame.mix=ease(trunkFrame.mix,opening?1:0,opening?4.8:5.7,dt);
    if(!opening&&trunkFrame.mix<.002)trunkFrame.v=null;
    const drinking=coffee.stage==="sip";
    if(drinking&&!coffeeFrame.active){coffeeFrame.yaw=cameraRig.yaw;coffeeFrame.tilt=cameraRig.elevation;}
    coffeeFrame.active=drinking;coffeeFrame.mix=ease(coffeeFrame.mix,drinking?1:0,drinking?4.8:5.6,dt);
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
    cameraRig.update(cam,subject,spur.aboard?spur.engine:airLine.player&&!airLine.transfer?airLine.plane:transit.aboard?transit.bus:cabs.playerHeld?taxi:windowRide?.held?windowRide.vehicle:deckStep?.v||skiff||transfer?.v||car||motos.bike||cycles.riding||skate.rider,dt,elapsed,{flight:!!airLine.player,skate:!!skate.rider,rear:!motos.bike&&!airLine.aboard&&!skate.rider&&!transit.aboard&&!pickup&&held("KeyV"),court:!!pickup,swim,lift:pickup?pickup.human.lift:motion.lift,ground:airLine.aboard?(airLine.transfer?hero.y:airLine.plane.y):skiff?0:skate.rider?skate.rider.y+skate.rider.air*.42:boardwalk.player||roofs.raised?hero.y:cycles.riding?footLevel(subject.x,subject.z)+cycles.riding.air*.65:footLevel(subject.x,subject.z),
      seat:windowRide?.held?windowRide.seat:cycles.riding ? .53*cycles.riding.mount : cabs.playerHeld?cabs.booking.seat:transfer||deckStep?(motion.ride?.seat||0):undefined});
    if(car?.chalkTurn&&held("KeyV")&&!isTop()){
      const p=carbon.pad,eye={x:p.x+5.7,y:2.15,z:p.z-4.6};
      Object.assign(cam,eye,{yaw:Math.atan2(car.x-eye.x,car.z-eye.z),pitch:Math.atan2(.68-eye.y,dist(car,eye)),focal:1.45});
      return;
    }
    if(car?.jumpFlight&&!isTop()&&!insideSeat()){
      const f=car.jumpFlight;cam.y+=f.height-footLevel(car.x,car.z);
      if(held("KeyV")){
        const target={x:car.x,y:f.height+.78,z:car.z};
        const candidates=[-1,1].map(side=>({...BayDriving.world(f.site,side*10,f.site.min*.72),y:f.site.base+1.40}));
        const options=candidates.map(eye=>({eye,gap:BayCamera.safeFraction(target,eye,cameraRig.obstacles)})).sort((a,b)=>b.gap-a.gap);
        if(options[0].gap>.42){
          const {eye,gap}=options[0];cam.x=target.x+(eye.x-target.x)*gap;cam.y=target.y+(eye.y-target.y)*gap;cam.z=target.z+(eye.z-target.z)*gap;
          cam.yaw=Math.atan2(target.x-cam.x,target.z-cam.z);cam.pitch=Math.atan2(target.y-cam.y,dist(cam,target));cam.focal=1.12;
          cameraRig.hideActor=false;
        }
      }
    }
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
    if(trunkFrame.v&&!isTop()){
      const f=trunkFrame.mix,v=trunkFrame.v,aim=BayDriving.world(v,0,bootArt.slots(v.kind)[0].z-.31);
      aim.y=footLevel(v.x,v.z)+.80;
      const yaw=v.yaw+trunkFrame.side*1.02+angle(trunkFrame.yaw,cameraRig.yaw),tilt=clamp(.83+cameraRig.elevation-trunkFrame.tilt,.15,1.12);
      const range=3.15*cameraRig.zoom,flat=range*Math.cos(tilt);
      const eye={x:aim.x-Math.sin(yaw)*flat,y:aim.y+range*Math.sin(tilt),z:aim.z-Math.cos(yaw)*flat};
      const free=BayCamera.safeFraction(aim,eye,trunkFrame.near);
      cam.x+=(aim.x+(eye.x-aim.x)*free-cam.x)*f;cam.y+=(aim.y+(eye.y-aim.y)*free-cam.y)*f;cam.z+=(aim.z+(eye.z-aim.z)*free-cam.z)*f;
      cam.yaw+=angle(cam.yaw,yaw)*f;cam.pitch+=(-tilt-cam.pitch)*f;cam.focal+=(1.58-cam.focal)*f;
    }
    if(coffeeFrame.mix>.002&&!isTop()){
      const f=coffeeFrame.mix,site=BayPalmCoffee.site,aim={x:site.x,y:site.y+1.15,z:site.z};
      const yaw=-.32+angle(coffeeFrame.yaw,cameraRig.yaw),tilt=clamp(.16+cameraRig.elevation-coffeeFrame.tilt,-.11,.86);
      const range=2.7*cameraRig.zoom,flat=range*Math.cos(tilt);
      const eye={x:aim.x-Math.sin(yaw)*flat,y:aim.y+Math.sin(tilt)*range,z:aim.z-Math.cos(yaw)*flat};
      const space=BayCamera.safeFraction(aim,eye,coffeeObstacles);
      cam.x+=(aim.x+(eye.x-aim.x)*space-cam.x)*f;cam.z+=(aim.z+(eye.z-aim.z)*space-cam.z)*f;
      cam.y+=(aim.y+(eye.y-aim.y)*space-cam.y)*f;cam.yaw+=angle(cam.yaw,yaw)*f;
      cam.pitch+=(-tilt-cam.pitch)*f;cam.focal+=(1.66-cam.focal)*f;
    }
  }
  function collectMap(modeName,cx,cz,scale){
    setTheatreSeats();
    if(cycles.riding)cycles.riding.kit=worn();
    if(skate.rider)skate.rider.shirt=BayCourtPlayers.kitColors[worn()];
    const take=active?.take,driving=(!!car||!!take)&&!transfer;
    const displayCar=paintPreview||car;
    const allTraffic=modeName==="atlas"?patrol:cars.filter(v=>!driving||v!==car||car===meet.jules).concat(patrol);
    const p=transfer||deckStep||cabs.playerHeld?hero:pos();
    if(exchangingKey())Object.assign(keyMapActor,{x:hero.x,y:hero.y,z:hero.z,yaw:hero.yaw,kit:worn()});
    const peds=[];
    if(play&&modeName==="street"){
      for(const [i,a] of company.owners.entries())peds.push({...a,skin:personColors[[2,4,1][i]][0],shirt:personColors[[2,4,1][i]][1]});
      if(company.mate.seat<1)peds.push({...company.mate,skin:"#925e48",shirt:"#8e865a"});
    }
    if(play&&modeName==="street")peds.push({...ada,shirt:personColors[4][1],skin:personColors[4][0]});
    if(play&&modeName==="street")for(const {worker:w} of pavement.props)peds.push({x:w.x,z:w.z,yaw:w.yaw,startle:w.startle,gesture:w.motion.handTarget?4:0,shirt:personColors[w.style][1],skin:personColors[w.style][0]});
    if(play&&modeName==="street")peds.push({...threads.cora,shirt:personColors[4][1],skin:personColors[4][0]});
    if(play&&modeName==="street")for(const p of [luggage.porter,...luggage.tags])peds.push({...p,shirt:personColors[p.style][1],skin:personColors[p.style][0]});
    if(modeName==="street"){
      const people=play?walkers.concat(jobContacts.filter(c=>c.style!==undefined&&c.id!==active?.job.id&&!(meet.rival&&c.id==="getaway"))):walkers;
      for(const w of people)if((!play||w!==band.local&&!w.palmManaged)&&(!take||!BayTake.onSet(w)))peds.push({x:w.x,z:w.z,yaw:w.yaw,shirt:personColors[w.style][1],skin:personColors[w.style][0],startle:w.startle,sprayPose:w.sprayPose,gesture:w.gesture,neighborPose:w.neighborPose,curbAim:w.curbAim,canopy:w.canopy,canopyStyle:w.canopyStyle,iceBox:w.fieldSource==="trawler"&&w.index<=6&&w.index>0});
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
    return {mode:modeName,cx,cz,scale,solids,threads:play?{site:threads.site,strip:modeName==="street"&&dist(pos(),threads.site)<80?featuredStrip():null}:null,coffee:play?coffee:null,curbWire:play?curbWire:null,wireTV:play&&modeName==="street"?updateWireTV(streetTime):null,campana:play?campana:null,paletaHeld:play&&paletaOnFoot()?campanaHeld():null,gutters:play?gutters:null,crew:play?{lead:unit.lead,otherLook:worn(unit.other),other:otherBody,afternoon,ride:otherCar,finder:!!unit.eye,met:unit.met,desk:scoutDesk,outing:windowRide,print:scoutHouseCard()}:null,rainWalk:play?rainWalk:null,buttonwood:play?works:null,brisas:play?club:null,palmHouse:play?palm:null,palmDiner:play?BayPalmRoom.frameState(palm,pos()):null,
      palmPeople:play&&modeName==="street"?BayPalmRoom.nearPeople(palm,hero).map(a=>({a,opts:BayPalmRoom.poseOptions(palm,a,worn(),personColors)})):null,motorSales:play?gull.render:null,dealerCrew:play?gull:null,gullPeople:play&&modeName==="street"?gullActors.concat(gull.exchange?.ready?[hero]:[]).map(a=>({a,opts:gullPose(a)})):null,motos:play?motos:null,rescue:play?rescue:null,airLine:play?airLine:null,airCrew,airCarried:save.airmail.bag&&onStreetFeet()?hero:null,courts,pickup,valet,skate:play?skate:null,deckHand:skateCarried()?hero:null,deckSeat:stowedDeck(),keyMapActor:exchangingKey()?keyMapActor:null,streetCar:car,motorists:modeName==="street"&&play?motoristsNear(q=>Math.abs(q.x-cx)<88&&Math.abs(q.z-cz)<88,.05):[],player:{x:p.x,y:p.y,z:p.z,yaw:p.yaw,kit:worn(),lead:unit.lead,neighborPose:helloPose,skin:unit.lead==="guest"?personColors[0][0]:BayExposureArt.palette[0],shirt:BayThreadsArt.colors[worn()]||BayCourtPlayers.kitColors[worn()]||(unit.lead==="guest"?personColors[0][1]:BayExposureArt.palette[1]),driving,kind:car?.kind,color:displayCar?.color||"#99ebc6",motion,damage:car?.damage,towRig:car?.towRig,
      steer:car?.steer,brakes:car?.brakes,handbrake:car?.handbrake,reversing:car?.reversing,flatSide:car?.flatSide,passengerDoor:car?.passengerDoor,inCabin:!!windowRide?.held&&windowRide.seat>.54||!!airLine.player&&!airLine.transfer||transit.aboard||(!!transfer||cabs.playerHeld)&&(motion.ride?.seat||0)>.54},skids,story:active?.story,
      summerCaps:play?summerCaps:null,portSpur:play?spur:null,redCork:play,angling:active?.angling,coastCup:play?cup:null,oceanBeat:play?beat:null,engineCompany:play?company:null,sevenScene,starlite:play?starliteSite:null,starliteVisit:theatre.visit,starliteFrame:theatreFilm,atProjector:!!theatre.run,starliteLit:cityDusk()>.28,pavement:play?pavement:null,cabService:play?cabs:null,cineSecond:!!save.cab.reel,recovery:play?recovery:null,
      airwaves:play?broadcastDesk.state:null,wheel:boardwalk.wheel,boardwalk,cycles,bridge,roofs,neon,transit:play?transit:null,band:play?band:null,wash:play?wash:null,
      marina:{boats,mantaRide,lead:unit.lead,rival:clubBoat,patrol:harbor.units,player:skiff,race:active?.regatta,bayChart:chartMode==="bay"},aboard:!!skiff&&!deckStep,
      swim:swim?.actor(hero),submerged:!!swim?.underwater,patrol:play?watchCrew:null,returned:save.shore.returned,found:save.shore.carried?save.shore.returned.concat(save.shore.carried):save.shore.returned,
      field:active?.field,countyChart:chartMode==="cut",cars:take?allTraffic.filter(v=>!BayTake.onSet(v)):allTraffic,peds,jobPins:modeName==="radar"||modeName==="atlas"&&chartMode!=="bay"?availableJobPins():[],
      tapes:tapes.filter((_,i)=>!save.tapes.includes(i)),target:take||modeName==="street"&&(shooting()||listening())?null:modeName==="street"?streetTarget():currentTarget(),route:modeName==="street"?null:roadGuide(currentTarget()),mara:play?maraOnBreak():null,places:locations,elapsed,time:streetTime,
      meet:meet.rival?meet:null,dusk:cityDusk(),weather:hours,houseMark:houseLights.mark,indoors:!!room,plate:active?.plate,lastDiner:recentDiner,
      personal:carPin(),copies:save.copies,tireCloud:elapsed-puffAt<1.55?tireCloud:null,
      luggage:play?{book:save.luggage,rack:rackContents(),hand:onStreetFeet()&&!bell.pass?luggage.hand(save.luggage):null,
        lid:bell.lid,amount:bell.amount,items:bell.lid?trunkContents(bell.lid):null,pass:bell.pass?{id:bell.pass.id,at:passingCase()}:null}:null,
      green:play?green:null,photograph:shooting(),take,stuntRecord:save.stunt,
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
    const f=v.jumpFlight,deck=jumps.deck(v.x,v.z);
    if(f)return {...v,pitch:f.pitch,lean:v.lean+f.spin*.09,onDeck:true};
    if(deck){const relative=v.yaw-deck.yaw;return {...v,pitch:v.pitch-Math.atan(deck.grade*Math.cos(relative)),lean:v.lean-Math.atan(deck.grade*Math.sin(relative)),onDeck:true};}
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
    if(rig.trunk){
      const pivot=bootArt.hinge(v.kind),p=chassisPoint(v,0,pivot.y,pivot.z,bodyGround);
      const opened=bell.lid?.garageKey===v.garageKey?bell.amount:0;
      list.push([rig.trunk,p.x,p.y,p.z,v.yaw,(v.pitch||0)+bootArt.angle(opened),v.lean,0,v]);
      if(opened>.01)for(const [i,id] of trunkContents(v).entries())if(id)bagArt.case(list,model,id,inBoot(v,i));
    }
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
        const tilted=v.onLift||v.onDeck;
        const wheel=tilted?chassisPoint(v,side*(s.track-.085+out),s.wheel-drop,axle,ground):{...w,y:wheelBase+lift+s.wheel-drop};
        list.push([rig.wheels[side],wheel.x,wheel.y,wheel.z,v.yaw+(axle>0?v.steer:0),v.wheelSpin+(axle<0?v.rearSpin||0:0)+(tilted?v.pitch:0)]);
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
    if(car!==spider&&see(spider,89)){const list=[];BayCaletaArt.roof(list,model,roadBody(spider),footLevel(spider.x,spider.z)+.008);for(const a of list)view.draw(...a);}
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
    const info={time:t,night:cityDusk(),headlights:seatLights(),kit:worn()};
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
      if(v===manta&&!models.has("marina-manta"))BayMantaArt.install(model);
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
    const haze=$("tireHaze");haze.hidden=true;
    if(!insideSeat()||room)$("driverGlass").hidden=true;
    BayCoastArt.rain($("rain"),play&&!room&&!palm.match&&!BayPalmDiner.contains(pos().x,pos().z)&&!swim?.underwater&&(top||!insideSeat()&&!busCameras()&&!airCockpit())?hours:null,t,top,cam.yaw);
    if(palm.match){
      if(top){
        const factor=Math.min(1,1280/innerWidth,800/innerHeight),w=Math.round(innerWidth*factor),h=Math.round(innerHeight*factor);
        if(map.width!==w||map.height!==h){map.width=w;map.height=h;}
        BayPalmRoom.closeMap(map,palm,hero,worn(),personColors,t);
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
        else BayMarlinRoom.map(map.getContext("2d"),room,hours,{...save.courts,equipped:worn(),owned:save.threads.owned},t);
      }else{
        if(cinema){
          if(!cineArtReady){BayCineRoom.install(model);cineArtReady=true;}
          view.begin(cam,0);BayCineRoom.world(view,room,t,hours,show.canvas,show.revision);
        }else{marlinArt();view.begin(cam,0);BayMarlinRoom.draw(view,hours);BayCourtBench.roomWorld(view,{...save.courts,equipped:worn(),owned:save.threads.owned},model,t);}
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
      if(car?.chalkTurn&&held("KeyV")){state.cx=carbon.pad.x;state.cz=carbon.pad.z;state.rotation=state.cameraYaw=0;state.scale=h/18;}
      if(works.rearView&&car===works.trailer.hitched){state.cx=works.trailer.x;state.cz=works.trailer.z;state.rotation=state.cameraYaw=car.yaw+Math.PI;state.scale=h/(22*cameraRig.zoom);}
      if(broadcastDesk.mix&&!broadcastDesk.approach){state.cx=radioSite.x+.32;state.cz=radioSite.z;state.rotation=state.cameraYaw=-Math.PI/2+broadcastDesk.mix.pan;state.scale=h/((broadcastDesk.close?9:18)*cameraRig.zoom);}
      if(works.line?.close){state.rotation=state.cameraYaw=works.line.look+Math.PI;state.cx=(pip.x+works.line.pot.x)*.5;state.cz=(pip.z+works.line.pot.z)*.5;state.scale=h/(13.5*cameraRig.zoom);}
      if(spur.aboard){const p=held("KeyV")?spur.van:spur.engine;state.cx=p.x;state.cz=p.z;state.scale=h/(held("KeyV")?17:34);state.rotation=state.cameraYaw=held("KeyV")?p.yaw:cameraRig.yaw;}
      if(active?.angling){const r=active.angling,q=r.cork||BayRedCork.shoal(r.site,streetTime),m=BayRedCorkArt.measure(r);
        state.cx=(r.site.x+q.x)*.5;state.cz=(r.site.z+q.z)*.5;state.rotation=state.cameraYaw=r.site.yaw;state.scale=h/25;
        if(m){state.cx+=(m.x-state.cx)*m.blend;state.cz+=(m.z-state.cz)*m.blend;state.scale=h/(25-19.8*m.blend);}
      }
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
      if(coffeeFrame.mix>.002){
        const f=coffeeFrame.mix,site=BayPalmCoffee.site;
        state.cx+=(site.x-state.cx)*f;state.cz+=(site.z-state.cz)*f;
        state.scale+=(h/(5.6*cameraRig.zoom)-state.scale)*f;
      }
      if(trunkFrame.v){
        const f=trunkFrame.mix,v=trunkFrame.v,aim=BayDriving.world(v,0,bootArt.slots(v.kind)[0].z-.3);
        state.cx+=(aim.x-state.cx)*f;state.cz+=(aim.z-state.cz)*f;state.scale+=(h/(5.6*cameraRig.zoom)-state.scale)*f;
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
      if(company.holding&&(held("Space")||dist(hero,company.call)<12)){
        state.cx=(hero.x+company.call.x)*.5;state.cz=(hero.z+company.call.z)*.5;state.rotation=state.cameraYaw=company.call.yaw;state.scale=h/(17*cameraRig.zoom);
      }
      if(theatre.run||theatre.visit){
        state.cx=starliteSite.x-(theatre.run ? .45 : 1.1);state.cz=starliteSite.z+(theatre.run ? 5 : 3);
        state.rotation=state.cameraYaw=0;state.scale=h/((theatre.run ? 18 : 22)*cameraRig.zoom);
      }
      if(film)setTakeMap(state,film,w,h,replay);
      drawBayMap(map.getContext("2d"),state);if(unit.eye)scoutDevelop(map,null,scoutMapProject(state,w,h));if(insideSeat())seatOverlay(true,t);$("targetTag").hidden=true;
      if(localVoice){
        const q=scoutMapProject(state,w,h)(localVoice.x,0,localVoice.z);
        placeVoiceTag(q.x*innerWidth,q.y*innerHeight-8);
      }
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
    if(see(carbon.pad,77))carbon.world(view,save.copies);
    drawSkids();
    const visible=[],owned=transfer?.v||car;
    if(play){
      BayGutterArt.world(view,visible,see,gutters,t);BayPavementArt.world(view,visible,see,pavement,t);
      for(const p of pavement.props){
        const w=p.worker;if(!see(w,55))continue;
        const key="stand-worker/"+p.id;if(!w.mesh){w.mesh=new BayPlayerMesh(personColors[w.style],p.kind==="board"?"courier":"local");view.add(key,w.mesh,true);}
        if(w.startle){w.mesh.startle(w.startle);view.updateAnimated(key);}
        else if(w.mesh.update(w.motion))view.updateAnimated(key);
        visible.push([key,w.x,footLevel(w.x,w.z)+(w.startle?.lift||0),w.z,w.yaw]);
      }
      drawCrew(visible,see,t);drawCampana(visible,see,t);
    }
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
    if(mantaRide.last&&see(mantaRide.last,70))mantaRide.spray(t,(x,y,z,yaw)=>view.draw("marina-foam",x,y,z,yaw));
    drawFerry(visible,see,t);if(play){drawAir(visible,see,t);drawRescue(visible,see,t);drawMoto(visible,see,t);drawGullMotors(visible,see,t);drawPalmScene(visible,see,t);drawBrisas(visible,see,t);drawButtonwood(visible,see,t);
      if(see(radioSite,105)){if(!radioArtReady){BayAirwavesBooth.install(model);radioArtReady=true;}BayAirwavesBooth.world(visible,see,t,broadcastDesk.state);}}
    else if(see(palmSite.center,650)){model("palm-roof",BayPalmDiner.roof);visible.push(["palm-roof",0,0,0]);}
    const hideActor=!!afternoon.photo||!!airLine.player&&!airLine.transfer||busCameras()||cabWindow()||listening()||cameraRig.hideActor&&!(coffeeFrame.mix>.45&&dist(eye,hero)>.7)&&!broadcastDesk.mix&&!works.line?.close&&!works.rearView&&!club.show?.wide&&!skate.run?.lens&&!transit.aboard&&!paintPreview&&!insideSeat()&&!neon.testing;
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
    if(play)BayCoastCupArt.world(visible,model,cup,see,footLevel);
    if(play){
      BayPortSpurArt.world(visible,model,spur,see,streetTime);
      BaySummerCapsArt.world(visible,model,summerCaps,see,streetTime,footLevel);
      for(const [s,style] of [[BayPortSpur.west,4],[BayPortSpur.east,2]])if(see(s.desk,62))visible.push([personSkin(style,"local",0,1),s.desk.x-1.16,.14,s.desk.z,-2.68]);
    }
    if(play){
      BayRedCorkArt.world(visible,model,view,see,active?.angling,hero,streetTime);
      const a=BayRedCorkArt.cal;
      if(see(a,65)){
        if(!calMesh){calMesh=new BayPlayerMesh(personColors[3],"local");calMotion=new BayPlayerMotion();view.add("cork/cal",calMesh,true);}
        calMotion.console=BayRedCorkArt.grip(null,streetTime,streetTime%19>14.5);calMotion.step(dt,0,0);
        if(calMesh.update(calMotion))view.updateAnimated("cork/cal");visible.push(["cork/cal",a.x,a.y,a.z,a.yaw]);
      }
    }
    if(play&&see(BayCoastCupArt.marshal,74)){
      const a=BayCoastCupArt.marshal,y=footLevel(a.x,a.z),key="cup/luz";
      if(!marshalMesh){marshalMesh=new BayPlayerMesh(personColors[1],"local");view.add(key,marshalMesh,true);}
      marshalMotion.step(dt,0,0);if(BayCoastCupArt.handFlag(visible,model,cup,marshalMesh,marshalMotion,y))view.updateAnimated(key);
      visible.push([key,a.x,y,a.z,a.yaw]);
    }
    if(play&&see(beat.actor,68)){
      const a=beat.actor,k="ocean-solis";
      if(!beatMesh){beatMesh=new BayPlayerMesh(BayOceanBeatArt.colors,"local");BayOceanBeatArt.dress(beatMesh);view.add(k,beatMesh,true);}
      const moved=beatMesh.update(a.motion),posed=BayOceanBeatArt.pose(beatMesh,a,t);
      if(moved||posed)view.updateAnimated(k);
      const y=a.y??footLevel(a.x,a.z);visible.push([k,a.x,y,a.z,a.yaw]);
      if(beat.seat<.15)BayOceanBeatArt.world(visible,model,a,y,t);
    }
    if(play&&see(beat.v,110))BayOceanBeatArt.car(visible,model,beat.v,footLevel(beat.v.x,beat.v.z)+.008,t,beat.v.beatLights);
    for(const v of cars)if(see(v,160)&&!(film&&BayTake.onSet(v))&&!(v===windowRide?.vehicle&&unit.eye?.window)&&!(v===car&&!transfer&&(hideActor||insideSeat()))){
      const ground=footLevel(v.x,v.z)+.008+serviceLift(v)+(v.towLift||0),body=roadBody(v);
      const rigBody=v===owned&&paintPreview?paintPreview:body;
      const nativeWheels=(v.brisasLead||v.lanes?.change||v.lanes?.reverse||v.kind==="estate"||v.kind==="stepside")&&see(v,29);
      const split=v===owned||nativeWheels||v.hydraulic&&!v.hydraulic.rest&&see(v,85)||v===otherCar||v===afternoon.vehicle||v===windowRide?.vehicle||v===story?.ride||v===active?.ferry?.ride||v===active?.cabFare?.ride||v===band.june.ride||v===unit4&&(dist(cam,v)<72||v.rearOpen>.01)||v===taxi||v===wrecker||v.onLift||v.doorAngle>.01;
      if(split||v===bell.lid||v===engine7&&(v.passengerDoor>.01||see(v,38)))addRig(visible,rigBody,ground);
      else{
        visible.push([v.model,v.x,ground,v.z,v.yaw,body.pitch,body.lean,0,v]);
        if((v.cupNumber||v.path&&!v.recoveryOwner||v===meet.rival&&meet.phase!=="idle")&&see(v,52)){
          const s=bayCarLayout(v.kind),p=chassisPoint(body,-s.seatX,s.seatY,s.seatZ,ground);
          if(!v.beatCar&&!v.greenId&&(!play||!v.brisasLead&&!v.owner&&!v.guestId&&!v.washGuest&&!v.stockId))visible.push(["traffic-driver",p.x,p.y,p.z,v.yaw,body.pitch,body.lean]);
          if(v.brakes>.35){
            const key="traffic-brakes/"+v.kind;model(key,g=>buildBayBrakeLights(g,v.kind));
            visible.push([key,v.x,ground,v.z,v.yaw,body.pitch,body.lean,0,v]);
          }
        }
      }
      if(v===spider)BayCaletaArt.roof(visible,model,rigBody,ground);
      if(v===unit4)BayAmbulanceArt.world(visible,rigBody,ground,t,split);
      if(v.damage&&see(v,76))BayBodyworkArt.world(visible,model,body,ground,t);
      BayStreetCars.world(visible,model,body,ground,t,dist(cam,v));
      if(v.greenId&&see(v,62))BayOnGreenArt.car(visible,model,body,ground,v.greenGesture||0);
      if(v.soil&&see(v,50))BayRoadGlass.world(visible,view,body,ground,t,dist(cam,v));
    }
    if(play)for(const contact of jobContacts){
      if(contact.id==="race")continue;
      if(contact.style===undefined||active?.job.id===contact.id||meet.rival&&contact.id==="getaway"||!see(contact,72))continue;
      visible.push([personSkin(contact.style,contact.role,0,1),contact.x,footLevel(contact.x,contact.z),contact.z,contact.yaw]);
    }
    if(play)for(const rack of BayRainWalk.racks)if(see(rack,58))BayRainCanopies.worldRack(visible,model,rack,rainWalk.book.borrowed===rack.id);
    if(see(wireDesk,76))BayCurbDeskArt.world(visible,model,wireDesk,t);
    if(see(BayPalmCoffee.site,56))BayPalmCoffeeArt.world(visible,model,BayPalmCoffee.site,coffee.lifts);
    if(play)drawLuggage(visible,see);
    if(play&&see(threads.site,64)){
      stall.world(visible,model,threads.site,t);const a=threads.cora;visible.push([personSkin(4,"local",0,dist(hero,a)<3?1:0),a.x,footLevel(a.x,a.z),a.z,a.yaw]);
    }
    if(play)for(const s of green.sites)if(see(s.route.post,80)){
      const at=s.route.post;at.y=footLevel(at.x,at.z);
      BayOnGreenArt.finish(visible,model,at,s.route.id,clamp(s.flash,0,1),s.clock);
    }
    for(const p of walkers){
      if(play&&(p===band.local||p.palmManaged)||!see(p,91)||film&&BayTake.onSet(p))continue;
      const feet=p.fieldSource?footLevel(p.x,p.z)+.055:.15;
      const recoil=p.startle||p.sprayPose;
      if(recoil){
        if(!p.recoilMesh){
          p.recoilMesh=new BayPlayerMesh(personColors[p.style],p.role);p.recoilKey="recoil/"+walkers.indexOf(p);
          view.add(p.recoilKey,p.recoilMesh,true);
        }
        p.recoilMesh.startle(recoil);view.updateAnimated(p.recoilKey);
        visible.push([p.recoilKey,p.x,feet+recoil.lift,p.z,p.yaw]);
      }else if(p.neighborPose){
        if(!p.neighborMesh){p.neighborMesh=new BayPlayerMesh(personColors[p.style],p.role);p.neighborMotion=new BayPlayerMotion();view.add("neighbor/"+p.neighbor.id,p.neighborMesh,true);}
        const key="neighbor/"+p.neighbor.id;p.neighborMotion.step(dt,0,0);
        if(BayNeighborGestures.pose(p.neighborMesh,p.neighborMotion,p,p.neighborPose))view.updateAnimated(key);
        visible.push([key,p.x,feet,p.z,p.yaw]);
      }else if(p.coffeeSip){
        if(!p.coffeeMesh){p.coffeeMesh=new BayPlayerMesh(personColors[p.style],p.role);p.coffeeMotion=new BayPlayerMotion();view.add("palm-coffee-bea",p.coffeeMesh,true);}
        p.coffeeMesh.update(p.coffeeMotion);BayPalmCoffeeArt.pose(p.coffeeMesh,1,coffee.lifts[1]);view.updateAnimated("palm-coffee-bea");
        visible.push(["palm-coffee-bea",p.x,feet,p.z,p.yaw]);
      }else if(p.curbAim){
        if(!p.curbMesh){p.curbMesh=new BayPlayerMesh(personColors[p.style],p.role);p.curbKey="curb-witness/"+walkers.indexOf(p);view.add(p.curbKey,p.curbMesh,true);}
        if(BayCurbDeskArt.pose(p.curbMesh,p.curbAim.lift,t))view.updateAnimated(p.curbKey);
        visible.push([p.curbKey,p.x,feet,p.z,p.yaw]);BayCurbDeskArt.phone(visible,model,p,feet,p.curbMesh,p.curbAim.lift);
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
    if(active&&!active.angling&&!windowRide&&!active.neon&&!active.bridge&&!story&&!active.cabFare&&!active.recovery&&!active.regatta&&active.job.id!=="race"&&active.job.id!=="dash"&&(active.index===0||active.job.id==="tape")){
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
      if(palm.playerSeat){const o=BayPalmRoom.poseOptions(palm,hero,worn(),personColors);
        changed=BayPalmPlayers.pose(playerMesh,hero,t,hero.action,o)||changed;BayPalmPlayers.props(visible,hero,t,hero.action,o,playerMesh);}
      if(gull.exchange?.ready){const opts=gullPose(hero);changed=BayDealerPeople.pose(playerMesh,hero,t,opts.action,opts)||changed;BayDealerPeople.props(visible,hero,t,opts.action,opts,playerMesh);}
      if(rescue.holding){BayRescueCrew.pose(playerMesh,hero,t,"player","push",rescue.cot);changed=true;}
      if(wash.operator===hero)changed=BayPalmaWash.pose(playerMesh,motion,hero,wash.target,t,wash.spraying)||changed;
      if(band.player){
        const p=band.player;p.kit=worn();p.mesh=playerMesh;
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
        if(coffee.stage==="sip"||hero.hadCoffeePose){
          changed=BayPalmCoffeeArt.pose(playerMesh,0,coffee.stage==="sip"?coffee.lifts[0]:null)||changed;hero.hadCoffeePose=coffee.stage==="sip";
        }
        if(luggage.hand(save.luggage)||bell.pass||hero.hadLuggage){
          const carrying=!!luggage.hand(save.luggage)||!!bell.pass;
          const grip=bell.pass?1-(motion.handTarget?.weight||0):carrying?1:0;
          changed=bagArt.pose(playerMesh,grip)||changed;hero.hadLuggage=carrying;
          if(onStreetFeet()&&!bell.pass&&carrying)bagArt.carry(visible,model,hero,luggage.hand(save.luggage),hero.y+motion.lift,playerMesh);
        }
        if(unit.lead==="frankie"&&onStreetFeet()&&!active&&!hero.hadLuggage)BayScoutArt.cameraProp(visible,model,hero,playerMesh,t,0);
        if(helloPose||hero.hadHelloPose){
          changed=BayNeighborGestures.pose(playerMesh,motion,car||hero,helloPose)||changed;hero.hadHelloPose=!!helloPose;
        }
        if(changed)view.updateAnimated(playerModel);
        if(skiff&&!deckStep){
          if(skiff===manta)visible.push([BayMantaArt.riderModel(unit.lead,mantaRide.air?"air":Math.abs(manta.steer)>.4?"carve":"cruise"),manta.x,manta.y,manta.z,manta.yaw,manta.pitch,manta.lean]);
          else{const p=seatPoint(skiff);visible.push([playerModel,p.x,p.y,p.z,skiff.yaw,skiff.pitch,skiff.lean]);}
        }else if(windowRide?.seat===1){drawInSeat(visible,playerModel,windowRide.vehicle,1);
        }else if(car&&!transfer){
          drawInSeat(visible,playerModel,car,car===meet.jules?1:-1);
        }else visible.push([playerModel,hero.x,hero.y+motion.lift,hero.z,hero.yaw]);
      }
    }
    if(view.scale>.74&&view.beginShadow()){
      for(const a of visible)if(Math.abs(a[1]-eye.x)<65&&Math.abs(a[3]-eye.z)<65)view.draw(...a);
      BayStreetArt.draw(view,streetTime,cam,true);
      view.endShadow();
    }else{
      for(const v of cars)if(see(v,83)&&!(film&&BayTake.onSet(v)))view.draw("shadowCar",v.x,v.z>181?footLevel(v.x,v.z)+.05:.145,v.z,v.yaw);
      for(const v of patrol)if(see(v,83))view.draw("shadowCar",v.x,v.z>181?footLevel(v.x,v.z)+.05:.145,v.z,v.yaw);
      for(const w of walkers)if(!w.palmPassenger&&!w.onTour&&see(w,38))view.draw("shadowFoot",w.x,footLevel(w.x,w.z)+.067,w.z,w.yaw);
      if(!airLine.aboard&&!car&&!skiff&&!swim&&!film)view.draw("shadowFoot",hero.x,hero.y+.025,hero.z,hero.yaw);
    }
    if(atSea){shorePeople(visible,see,t,false);if(swim)BaySwimmerArt.world(visible,swim.actor(hero),t,hours);}
    if(active?.field&&!listening()&&!swim&&!car&&!skiff&&!transfer&&!deckStep&&cutArtReady)
      BayCutWildlife.carryRecorder(visible,hero,hero.y+motion.lift,t);
    drawCourse(see);
    if(airCockpit())BayAirmailArt.cockpit(visible,airLine.plane,t,airLine.seatRole(),{companion:true,control:airLine.player.control,kit:worn(),mail:save.airmail.bag&&BayAirPost.tagFor(save.airmail.bag)});
    if(play)drawSeven(visible,see,t);
    if(insideSeat()&&car===spider)BayCaletaArt.roof(visible,model,roadBody(spider),footLevel(spider.x,spider.z)+.008+serviceLift(spider));
    if(see(starliteSite,112)){
      BayStarliteArt.world(visible,model,starliteSite,t,dusk>.28,theatre.visit);
      if(theatre.visit)BayStarliteArt.clipped(view,visible,starliteSite,theatre.visit);
      if(play&&see(ada,65))visible.push([personSkin(4,"local",0,theatre.run?1:0),ada.x,footLevel(ada.x,ada.z),ada.z,ada.yaw]);
    }
    for(const a of visible)view.draw(...a);
    if(play&&see(starliteSite,76)){
      const dx=starliteSite.x-eye.x,dz=starliteSite.z+9.89-eye.z;
      if(dz>-.25&&dx*Math.sin(eye.yaw)+dz*Math.cos(eye.yaw)>-.5){const frame=theatreFilm();BayStarliteArt.screen(view,starliteSite,frame,theatre.version);}
    }
    if(play&&see(threads.site,32)&&featuredStrip())stall.print(view,threads.site,windowStrip,windowStamp);
    if(play&&see(wireDesk,24)){const screen=updateWireTV(t);if(screen)BayCurbDeskArt.screen(view,wireDesk,screen,wireTVVersion);}
    if(play&&see(scoutDesk,75)&&scoutHouseCard())BayScoutArt.drawDeskPrint(view,scoutDesk,houseCard,unit.film.pinned.number);
    if(washArtReady&&see(wash.site.bay,65))BayPalmaWash.water(view,wash,t);
    if(insideSeat()){
      const body=roadBody(car),ground=footLevel(car.x,car.z)+.008+serviceLift(car);
      BayDriversSeat.draw(view,model,body,ground,{night:dusk,time:t,headlights:seatLights(),kit:worn(),greet:helloPose});
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
      }else if(active?.job.id!=="dash"&&!active?.regatta&&tar.kind!=="ferry-gate"&&!(tar.kind==="engine-bay"&&company.bayLamp)){
        const ground=active?.neon?tar.y:tar.z>181?footLevel(tar.x,tar.z):0;view.draw("destRing",tar.x,ground,tar.z);view.draw("beacon",tar.x,ground+2.6+Math.sin(t*3)*.17,tar.z,eye.yaw);
      }
      const mark=view.project(tar.x,3.6+(active?.neon?tar.y:tar.z>181?footLevel(tar.x,tar.z):0),tar.z),label=$("targetTag");
      if(play&&!panel&&mark&&mark.x>48&&mark.x<innerWidth-48&&mark.y>55&&mark.y<innerHeight-75&&dist(pos(),tar)>9&&!(tar.kind==="engine-bay"&&company.bayLamp)){
        label.hidden=false;label.style.left=mark.x+"px";label.style.top=mark.y+"px";label.textContent=(tar.kind==="ferry-gate"?"PALOMA · ":"")+Math.round(dist(pos(),tar))+" m";
      }else label.hidden=true;
    }else $("targetTag").hidden=true;
    if(localVoice){
      const q=view.project(localVoice.x,footLevel(localVoice.x,localVoice.z)+1.99,localVoice.z);placeVoiceTag(q?.x,q?.y);
    }
    if(a&&a.light>.01&&see(a,190)){
      if(!airBeam){airBeam=new BayPatrolArt.Searchlight();view.add("air-beam",airBeam,true);}
      airBeam.update(a,backup.lamp(a));view.updateAnimated("air-beam");view.drawSearchlight("air-beam");
    }
    if(listening())BayCutWildlife.micView(view,eye,t,!!active.field.slice);
    if(insideSeat())seatOverlay(false,t);
    if(tireCloud.length&&elapsed-puffAt<1.55&&!unit.eye){
      const w=Math.round(innerWidth*.65),h=Math.round(innerHeight*.65);
      if(haze.width!==w||haze.height!==h){haze.width=w;haze.height=h;}
      const ctx=haze.getContext("2d");ctx.clearRect(0,0,w,h);
      haze.hidden=!BayContactPatchArt.smokeOverlay(ctx,tireCloud,(x,y,z)=>{
        const p=view.project(x,y,z);if(!p)return null;
        if(car&&BayDriving.clearance(car,{x,z})<-.18&&y<footLevel(x,z)+1.18)return null;
        return {x:p.x*w/innerWidth,y:p.y*h/innerHeight,scale:h*.5*view.basis.f/p.depth};
      },elapsed,hours.wet);
    }
    if(unit.eye)scoutDevelop(scene,$("sky"),(x,y,z)=>{const q=view.project(x,y,z);return q&&{x:q.x/innerWidth,y:q.y/innerHeight};});
    if(motos.finder)exposeMoto(scene,$("sky"),(x,y,z)=>{const q=view.project(x,y,z);return q&&{x:q.x/innerWidth,y:q.y/innerHeight};});
    finishMeetFrame(scene,$("sky"),(x,y,z)=>{const q=view.project(x,y,z);return q&&{x:q.x/innerWidth,y:q.y/innerHeight};});
    if(printing)printTake(run,scene,$("sky"));
  }
  function contextHint(k,label){
    const c=neighbors.chat;
    if(c&&localInReach){
      const s=neighbors.message(unit.lead,c.p),n=s?neighbors.stage(unit.lead,s):0;
      k="1";label=c.bad?"Apologize to "+c.p.name:"Ask "+c.p.name.split(" ")[0]+" for a local spot"+(s?"  ·  2  "+["Take a message","Pass on the message","Give the reply"][n]:"");
    }else if(localInReach){
      const prompt="Say hello to "+localInReach.name;
      if(label)label+="  ·  N  "+prompt;else{k="N";label=prompt;}
    }
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
    if(windowRide?.held)$("mode").textContent=windowRide.social?"Riding with "+BaySecondUnit.names[unit.other]:"Window Seat · Passenger";
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
    else if(car&&!transfer&&car.burn>.20){$("tireCall").hidden=false;$("tireCall").textContent=tireFeedback(car);}
    $("speed").innerHTML=skiff&&!deckStep?'<em class="gear">'+(skiff.speed<-.6?"ASTERN":skiff.trim>.35?"TRIM UP":"AHEAD")+'</em>'+Math.round(Math.abs(skiff.speed)*1.944)+"<small>KN</small>":
      car&&!transfer?'<em class="gear">'+(car.reversing?"R":"D"+car.gear)+'</em>'+Math.round(Math.abs(car.speed)*2.237)+"<small>MPH</small>":"";
    if(skiff===manta&&mantaRide.air)$("speed").innerHTML='<em class="gear">AIR</em>'+mantaRide.height.toFixed(1)+"<small>M</small>";
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
      if(active?.cup){
        const racing=cup.phase==="race",count=cup.phase==="count";
        $("objectiveTag").textContent=racing?"Coastline Circuit  /  Lap "+(cup.completed+1)+" of 2":"Sol Motor Club  /  Coastline Circuit";
        $("objectiveText").textContent=racing?cupPlace(cup.rank())+" of 3  ·  "+cup.battle()+"  ·  "+raceWatch(cup.clock):count?"Flag in "+Math.ceil(cup.count):"Bring a car to the northbound grid";
        const reference=save.clubCup.splits[cup.splits?.length-1],delta=reference?cup.split-reference:null;
        const split=racing&&delta!==null&&cup.clock-cup.split<3.2?(delta>0?"+":"−")+Math.abs(delta).toFixed(2)+" s vs best · ":"";
        $("roadTurn").textContent=racing?split+cupTarget().name+"  ·  "+meters+" m  ·  "+(cupTarget().turn||"Across the stripe"):count?"Pili #7  ·  Vic #4":"Ocean Drive · Stop in the brackets and honk";
      }else if(mantaRide.run&&skiff===manta){
        const r=mantaRide.run;$("objectiveTag").textContent="North Float Double · "+r.time.toFixed(1)+" s";
        $("objectiveText").textContent=r.leg==="ramp"?"Clear the striped ramp eastbound":"Cross Yellowtail’s wake · "+meters+" m";
        $("roadTurn").textContent=r.leg==="ramp"?"Line up with the low end · Hold Space for lift":"Aim across the whitewater trailing the yellow boat";
      }else if(windowRide?.social){const r=windowRide;$("objectiveTag").textContent=BaySecondUnit.names[unit.other]+"  /  "+formatVehicle(r.vehicle);
        $("objectiveText").textContent=r.held?(r.early?"Pulling over":r.brief.title):r.phase==="ready"?"Your ride is here":"Meet your partner at the curb";
        $("roadTurn").textContent=r.phase==="ride"?Math.ceil(Math.max(0,(r.leg.stopAt??r.leg.route.length)-r.leg.at))+" m by road":r.phase==="park"?"Parked · Pick another stop or get out together":r.held?"Passenger door":"Watch for the "+formatVehicle(r.vehicle);
      }else if(windowRide){const r=windowRide;$("objectiveTag").textContent="Window Seat  /  "+r.brief.title;
        $("objectiveText").textContent=r.held?r.brief.subject:"Meet "+BaySecondUnit.names[unit.other]+" at the curb";
        $("roadTurn").textContent=r.best?"Best frame "+r.best.score+"/100":r.held?"Frame the landmark from the moving car":formatVehicle(r.vehicle)+" · "+Math.round(dist(r.vehicle,r.pickup))+" m";
      }else if(active?.campana){
        const s=save.campana.shift;
        $("objectiveTag").textContent="La Campana  /  "+(s.stops+1)+" of 2 stops";
        $("objectiveText").textContent=campana.phase==="open"?"Serve the line at "+campana.station.name:car===iceVan?"Pull up facing north at "+BayCampana.stops[campana.next].name+" · "+meters+" m":"Take the driver’s seat";
        $("roadTurn").textContent=campana.phase==="open"?(s.served+1)+" of 2 orders  ·  "+cash(s.till)+" in the till":guide?.turn||"Keep the striped window toward the sidewalk";
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
      }else if(active?.engineSeven){
        $("objectiveTag").textContent="Engine 7  /  "+company.call.owner;
        $("objectiveText").textContent=company.bookedHome?car===engine7?"Park Seven in the Gantry Street bay":"Meet Nel at the driver’s door":company.holding?"Cool the three hot spots":company.phase==="outbound"?car===engine7?"Respond to "+company.call.title:"Take the wheel at Station Seven":car?"Step outside for the line":"Join Nel by the smoke";
        $("roadTurn").textContent=company.holding?"Heat "+company.levels.map(v=>Math.round(v*100)+"%").join("  ·  "):guide?.turn||tar.name;
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
    if(active?.cup&&(cup.phase==="count"||cup.phase==="race"&&cup.clock<.82)){
      const signal=$("raceStart");signal.hidden=false;signal.textContent=cup.phase==="count"?String(Math.ceil(cup.count)):"GO";
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
    localInReach=neighborFree()?(neighbors.chat?.p||nearestNeighbor()):null;
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
    const drain=curbDrain(),corner=cornerAction();
    const luggageHint=bellHint();
    const clock=nearbyClock();
    const localRun=greenHud();
    const curbObject=curbsideAction(),curbPrompt=curbObject&&curbsideHint(curbObject);
    const angler=active?.angling,rail=corkNear();
    if(angler){
      $("objective").hidden=false;$("objectiveTag").textContent="Red Cork Club · "+angler.site.name;
      $("objectiveText").textContent=angler.walkIn?"Taking the rod":angler.text();
      $("roadTurn").textContent=angler.phase==="fight"?"Line tension "+Math.round(angler.tension*100)+"% · A/D follow the fish":angler.cedar?"Lark’s cedar plug":"Cal’s cork rig";
      if(angler.phase==="fight"||angler.phase==="wind"){
        const winding=angler.phase==="wind",n=Math.round(100*(winding?angler.power:angler.tension));
        meter.hidden=false;meter.style.setProperty("--hold",n+"%");meter.setAttribute("aria-valuenow",String(n));meter.setAttribute("aria-label",winding?"Casting power":"Line tension");
      }
    }
    const showing=angler?(angler.phase==="miss"||angler.phase==="landed"?["Space","Cast again · E put the rod back"]:["E","Put the rod back"]):rail?["F",rail.id==="marlin"?"Cal Bennett · Red Cork Club":"Read Cal’s tide book"]:cupHint()||beatHint()||copyHint()||jumpHint()||engineHint()||starliteHint();
    const freightHint=spurHint();
    if(spur.trip||spur.aboard){
      const r=spur.trip;const st=r?.phase==="board"?r.start:r?.target||spur.destination;
      $("objective").hidden=false;$("objectiveTag").textContent="Port Sol Belt · No. 9";
      if(spur.aboard){$("mode").textContent=r?.phase==="drive"?"Switch engineer":"Belt passenger";$("speed").innerHTML=Math.round(spur.speed*2.237)+"<small>MPH</small>";}
      $("objectiveText").textContent=r?.phase==="board"?(spur.at===st?"Board at the cab step":"Wait at "+st.name):r?.phase==="unload"?"Unloading at "+st.name:st.name+" · "+Math.abs(st.x-spur.x).toFixed(1)+" m";
      $("roadTurn").textContent=spur.held?"Crossing occupied · Holding short":r?.phase==="drive"?spur.cargo+" · "+Math.round(spur.speed*2.237)+" mph · Reverser "+(spur.dir>0?"east":"west"):spur.cargo;
    }
    const capHint=summerHint(summerAction());
    if(canUseSeat()&&!heat&&BayJunctionTurns.waitingDriver(car,cars))contextHint("L","Flash the waiting driver through");
    else if(car&&!active&&!heat&&BayBoulevardLanes.candidate(car,cars,streetTime))contextHint("H","Ask the driver behind to let you in");
    else if(carRadios.offer&&windowListener()){
      const v=carRadios.offer;
      if(streetTime-(v.windowAsked??-10)<3.5)contextHint("","");
      else contextHint("/","Ask "+v.owner.name+" what’s playing");
    }
    else if(capHint)contextHint(...capHint);
    else if(freightHint)contextHint(...freightHint);
    else if(showing)contextHint(...showing);
    else if(atThreads())contextHint("F","Cora Vidal · Low Tide Exchange");
    else if(curbPrompt)contextHint(...curbPrompt);
    else if(localRun)contextHint(...localRun);
    else if(luggageHint)contextHint(...luggageHint);
    else if(clock)contextHint("F","Read the "+clock.route.landmark);
    else if(coffee.stage&&corner)contextHint(corner.startsWith("Walk light")||corner.startsWith("Flashing hand")?"":"F",corner);
    else if(coffee.stage==="walk"||coffee.stage==="table")contextHint("",coffee.stage==="table"?"Bea’s at the coffee shelf · Come around to the green cup":coffee.bea.coffeePause?"Bea’s waiting on the sidewalk":"Walk with Bea to the Palm Diner");
    else if(paletaHint()){ /* Nina or the next customer has the window. */ }
    else if(drain){contextHint(drain.cleared?"":"L",drain.cleared?"Curb drain clear · "+drain.name:drain.work?"Lifting leaves · "+Math.round(drain.work*100)+"%":"Hold to lift the leaves from the curb drain");}
    else if(!active&&!unit.eye&&!afternoon.photo&&(wireDeskNear()||wireWitnessNear()))contextHint("F",wireDeskNear()?"Bay Wire · Meli’s curb desk":"Watch the clip with "+(curbWire.author.curbName||curbWire.author.name));
    else if(corner)contextHint(corner.startsWith("Walk light")||corner.startsWith("Flashing hand")?"":"F",corner);
    else if(crewHint()){ /* The character on location supplies the prompt. */ }
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
      else if(skiff===manta&&!heat&&!active){
        if(mantaRide.air)contextHint("A / D","Square up with your direction of travel");
        else if(mantaRide.run)contextHint("F","Leave the timed double");
        else if(mantaRide.nearFloat(manta))contextHint("F","Paz’s North Float Double"+(mantaRide.best.double?" · Best "+mantaRide.best.double.toFixed(1)+" s":"")+(mooring&&Math.abs(manta.speed)<2.1?" · E tie up":""));
        else if(Math.abs(manta.speed)<2.1)contextHint("E",mooring?"Tie up at "+mooring.dock.name:"Go over the side");
        else contextHint("Space","Hold into a ramp or a moving wake"+(mantaRide.best.wake?" · Best wake "+mantaRide.best.wake.toFixed(1)+" m":""));
      }
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
    else if(tar&&active&&!active.cup&&!field&&!active.story&&!active.plate&&!ferry&&active.job.id!=="tape"&&active.job.id!=="dash"&&dist(p,tar)<12&&(!car||(active.job.id!=="race"&&Math.abs(car.speed)>7)))contextHint("",car?"Slow down at the marker":"Bring a car to the marker");
    else if(speaker){
      const action=speaker.name==="June"&&save.tapes.includes(0)&&!save.juneReturned?"Give June her demo":"Talk to "+speaker.name;
      contextHint("F",action+(nearby?"  ·  E  Take "+formatVehicle(nearby):""));
    }
    else if(atSpider()&&(!car||Math.abs(car.speed)<3))contextHint(car?"O":"E",car?"Fold or raise the canvas roof":"Enter Caleta Spider · O canvas roof");
    else if(nearby)contextHint("E","Enter "+formatVehicle(nearby));
    else if(car&&!active&&Math.abs(car.speed)<.7&&elapsed<23)contextHint("E","Step out");
    else if(skateCarried()&&!active)contextHint("K","Put your board down");
    else contextHint("","");
    if(!$("toast").hidden&&elapsed>toastTill)$("toast").hidden=true;
    if(!$("speech").hidden&&elapsed>speechTill)$("speech").hidden=true;
  }
  function closePanel(){
    timingFilm=null;
    wireView=null;
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
  function atThreads(){
    return dist(hero,threads.counter)<2.1&&onStreetFeet()&&crewFree()&&!unit.eye&&!unit.transition&&!afternoon.photo&&!bell.pass&&!luggage.hand(save.luggage);
  }
  function visitThreads(){
    syncProgress(readSave());
    if(!save.threads.met){save.threads.met=true;save.threads.rev++;persist();}
    fittingItem=threads.custom(worn())?worn():"tideline";fittingAngle=.24;openPanel("threads");
  }
  function exchangeSale(action){
    const settle=()=>{
      let disk;
      try{disk=JSON.parse(localStorage.getItem("sundownBay.v1"));}catch{}
      if(disk){syncProgress(disk);if(Number.isSafeInteger(disk.wallet))save.wallet=disk.wallet;if(Number.isSafeInteger(disk.paid))save.paid=disk.paid;}
      action();
    };
    if(window.navigator?.locks)return navigator.locks.request("sundownBay.lowTide.till",settle);
    settle();
  }
  function putOn(id,fromShop){
    exchangeSale(()=>{
      if(fromShop?panel!=="threads"||!atThreads():panel!=="room-rack"||!room||roomAction()!=="rack")return;
      if(!threads.outfit(save,unit.lead,id,fromShop))return;
      if(unit.lead==="guest")save.courts.equipped=["sol","mercado"].includes(id)?id:"street";
      wearKit(id);persist();closePanel();
      const item=threads.stock.find(s=>s.id===id);
      note(item?.name||"Room 14","Worn by "+BaySecondUnit.names[unit.lead]+".",2.4);
    });
  }
  function featuredStrip(){
    const r=save.threads.prints[save.threads.featured];if(!r)return null;
    if(windowStamp!==r.stamp){
      windowStrip=document.createElement("canvas");BayFotoBoothArt.strip(windowStrip,r);windowStamp=r.stamp;
    }
    return windowStrip;
  }
  function fittingRoom(b){
    const item=threads.stock.find(s=>s.id===fittingItem)||threads.stock[0],owned=save.threads.owned.includes(item.id);
    const stage=document.createElement("div"),glass=document.createElement("canvas"),rail=document.createElement("div"),rod=document.createElement("div");
    stage.className="threads-fitting";rail.className="threads-rail";rod.className="threads-rod";
    glass.width=340;glass.height=350;glass.className="threads-glass";glass.setAttribute("aria-label",BaySecondUnit.names[unit.lead]+" trying on "+item.name);
    const paint=()=>BayThreadsArt.preview(glass,item.id,unit.lead,fittingAngle);
    for(const s of threads.stock){
      const pick=document.createElement("button");pick.className="threads-choice";pick.textContent=s.name;
      pick.style.setProperty("--cloth",BayThreadsArt.colors[s.id]);pick.setAttribute("aria-pressed",String(s.id===item.id));
      pick.onclick=()=>{fittingItem=s.id;openPanel("threads",true);$("panelBody").querySelector('.threads-choice[aria-pressed="true"]')?.focus({preventScroll:true});};
      rail.append(pick);
    }
    const mirror=document.createElement("div");mirror.className="threads-mirror";mirror.append(glass);
    for(const [label,step] of [["Turn left",-1],["Turn right",1]]){
      const turn=document.createElement("button");turn.textContent=label;turn.onclick=()=>{fittingAngle+=step*Math.PI/4;paint();};rod.append(turn);
    }
    mirror.append(rod);stage.append(mirror,rail);b.append(stage);
    const wearing=worn()===item.id;
    const buy=makeButton(item.name,item.note,wearing?"Wearing":owned?"Wear it":item.price?"Buy · "+cash(item.price):"Keep it · Free",()=>putOn(item.id,true));
    buy.className+=" threads-buy";buy.disabled=wearing||!owned&&item.price>save.wallet;b.append(buy);
    b.append(makeButton("Cora’s window commissions","Three booths around town. Bring back a strip for the display.","See briefs",()=>openPanel("threads-prints")));
    paint();
  }
  function threadCommissions(b){
    const book=save.threads;afternoon.album.refresh();
    for(const brief of threads.briefs){
      const printed=book.prints[brief.id],match=afternoon.album.records.find(r=>threads.fits(r,brief.id))||printed;
      const selected=match&&printed?.stamp===match.stamp&&book.featured===brief.id;
      b.append(makeButton(brief.name,brief.detail,selected?"In the window":match?(printed?"Hang print":"Hand in · "+cash(brief.pay)):"Mark booth",()=>{
        if(!atThreads()||panel!=="threads-prints")return;
        if(!match){clockPin(fotoPins.find(p=>p.id===brief.id));return;}
        exchangeSale(()=>{
          if(!atThreads()||panel!=="threads-prints")return;
          const paid=threads.hang(save,match);if(paid===null)return;
          persist();closePanel();speak("Cora Vidal",paid?"That’s the one. Your money’s in the envelope. Come look at the window.":"I’ll put this one out front.");lastMap=-10;
        });
      }));
      if(selected)b.children[b.children.length-1].disabled=true;
    }
    const print=featuredStrip();
    if(print){print.className="foto-strip";print.setAttribute("aria-label","Cora’s current window print");b.append(print);}
    b.append(makeButton("Fitting mirror","Try on the pieces from Cora’s rail.","Back",()=>openPanel("threads")));
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
    if(houseLights.s.release)body.append(makeButton("Cue House Lights","Your two exposures, dissolved on the house projector.","Thread print",()=>{
      room.cuedReel="house-lights";closePanel();note("Cine Luna","Take an aisle seat for House Lights.",3.5);}));
    for(const reel of BayCineProgram.describe(filmOptions())){
      const row=document.createElement("p"),title=document.createElement("strong");
      row.className="cine-listing";title.textContent=reel.title;
      row.append(title,document.createTextNode(reel.credit+"  ·  "+reel.seconds+" s"));body.append(row);
    }
    const foot=document.createElement("p");foot.className="edition-copy";
    foot.textContent="Continuous showing. Take any open aisle seat.";body.append(foot);
    if(jumps.complete(save.pictureJumps))body.append(makeButton("Cue Four Wheels Down","Romy traced your three jumps for this animated short.","Thread print",()=>{
      room.cuedReel="picture-jumps";closePanel();note("Cine Luna","The reel is threaded. Take an aisle seat for Four Wheels Down.",3.8);}));
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
  let pickingRidePin=false;
  function openPanel(next,redraw=false){
    if(next!=="map"||panel!=="map")pickingRidePin=next==="ride-map";
    if(pickingRidePin&&next==="ride-map"){next="map";chartMode="city";}
    timingFilm=null;
    if(next!=="curb-wire")wireView=null;
    if((next==="threads"||next==="threads-prints")&&!atThreads())return;
    if(next==="radio-desk"&&!atRadioDesk()||next==="radio-sleeves"&&!save.airwaves.met)return;
    if(afternoon.photo)clearFoto();
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
    if(active?.angling?.phase==="wind"){active.angling.phase="ready";active.angling.power=0;}
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
    }else if(next==="neighbors"){
      title="Word of mouth";kicker=BaySecondUnit.names[unit.lead]+"’s contacts";neighborBook(b);
    }else if(next==="court-line"){
      const g=courtAtLine(),beach=g.site.id==="sol",regular=g.regular(),h=g.history;
      title=g.site.name;kicker=(beach?"Sol Beach  /  Dee":"El Mercado  /  Inés")+"’s score table";
      const visitor=worn()===(beach?"mercado":"sol");
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
    }else if(next==="threads"){title="Low Tide Exchange";kicker="Cora Vidal  /  "+cash(save.wallet)+" on hand";fittingRoom(b);
    }else if(next==="threads-prints"){title="The window book";kicker="Low Tide Exchange  /  Cora Vidal";threadCommissions(b);
    }else if(next==="room-rack"){
      title="Clothes rail";kicker="Marlin Motel  /  Room 14";
      for(const [id,name,cloth] of [["street",unit.lead==="guest"?"Street shirt":"Location jacket",unit.lead==="guest"?"Teal overshirt":"Frankie’s denim and red scarf"],["sol","Sol Beach No. 14","Sea-green mesh and cream piping"],["mercado","Mercado No. 14","Wine-red mesh and gold piping"],...threads.stock.filter(item=>save.threads.owned.includes(item.id)).map(s=>[s.id,s.name,"Low Tide Exchange"])]){
        const available=threads.available(save.threads,save.courts,id),wearing=worn()===id;
        const row=makeButton(name,available?cloth:"Win a pickup game at "+courts.find(g=>g.site.id===id).site.name+".",wearing?"Wearing":available?"Put on":"At the court",()=>{
          if(available)putOn(id,false);
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
    }else if(next==="paletas"){title="La Campana";kicker="Nina Rojas  /  Paletas de fruta";paletaPanel(b);
    }else if(next==="ride-stops"){title="Where to?";kicker=BaySecondUnit.names[unit.other]+"  /  Passenger seat";rideStops(b);
    }else if(next==="window-orders"){title="Window Seat";kicker="Cine Luna  /  Location department";windowBoard(b);
    }else if(next==="bell-desk"){
      title="Left luggage";kicker="Marlin Motor Court  /  Claim checks";bellPanel(b);
    }else if(next==="claim-stubs"){
      title="Your claim stubs";kicker="Marlin Motor Court  /  Cart "+(save.luggage.round+1);claimStubs(b);
    }else if((next.startsWith("green-film-")||next.startsWith("green-best-"))&&BayOnGreen.route(next.slice(11))){
      const r=BayOnGreen.route(next.slice(11));title="Finish camera";kicker=r.street+"  /  "+r.driver;showTimingFilm(b,r,next.startsWith("green-best-"));
    }else if(next==="green-slips"){
      title="Timing slips";kicker="On Green  /  Local runs";greenSlips(b);
    }else if(next==="green-clock"&&nearbyClock()){
      const clock=nearbyClock();title=clock.route.landmark;kicker="On Green  /  "+clock.route.street;clockCard(b,clock);
    }else if(next==="curb-wire"){
      title="On the Curb";kicker="Bay Wire  /  Street clips";wirePanel(b);
    }else if(next==="wire-edition"){
      title="Neighborhood edition";kicker="Bay Wire  /  Picture desk";
      for(const story of neighbors.editions)editionPrint(b,story);
    }else if(next==="red-cork"){
      title="Red Cork Club";kicker=corkPage?.name||"Cal Bennett’s tag book";corkPanel(b);
    }else if(next==="port-belt"){
      title="Port Sol Belt";kicker=spurDesk?.name||"Freight waybills";spurPanel(b);
    }else if(next==="coast-club"){
      title="Coastline Circuit";kicker="Sol Motor Club / Ocean Drive";cupPanel(b);
    }else if(next==="ocean-copy"){
      title="Driver copy";kicker="Ocean Unit 12 / Lina Solís";beatPage(b);
    }else if(next==="carbon-copies"){
      title="Carbon Copies";kicker="Portside Tire / Romy Vale";copyPanel(b);
    }else if(next==="picture-jumps"){
      title="Romy’s location notebook";kicker="Picture cars / "+jumpPage.area;paintJumpPage(b);
    }else if(next==="engine-house"||next==="engine-book"||next==="jobs"&&active?.engineSeven){
      title="Station Seven";kicker=next==="engine-book"?"Engine company / Signed return":"Gantry Street / Duty board";engineBoard(b,next==="engine-book");
    }else if(next==="starlite-booth"||next==="starlite-tickets"){
      title="Starlite Motor Theatre";kicker=next==="starlite-booth"?"Gantry Street / Projection booth":"Box office / Ticket stubs";theatrePanel(b,next==="starlite-tickets");
    }else if(next==="street-paper"||next==="pocket-papers"){
      const pocket=next==="pocket-papers",stand=pavement.hand?.p||pavement.near(hero)?.p;
      title=pocket?"Folded copies":BayStreetNames.through(stand||hero,(stand?.home.yaw||0)+Math.PI/2)||district(hero);
      kicker=pocket?"From your pocket":(stand?.worker.name||"Bay Wire")+"’s news box";paperPanel(b,pocket);
    }else if(next==="curb-bill"){
      title="Tonight at Cine Luna";kicker="Sidewalk bill";
      for(const f of BayCineProgram.describe(filmOptions()))signedNote(b,f.title,f.credit);
      b.append(makeButton("Cine Luna","The case inside the lobby has the running order.","Mark cinema",()=>clockPin(BayCab.cinema)));
    }else if(next==="free-afternoon"||next==="foto-album"){
      title=next==="foto-album"?"Photo strips":"An afternoon off";kicker=next==="foto-album"?"Foto Bahía":"Second Unit";afternoonPanel(b,next==="foto-album");
    }else if(next==="house-lights"){
      title="House Lights";kicker="Cine Luna / Location desk";houseLightsPanel(b);
    }else if(next==="unit-sheet"||next==="unit-roll"){
      title=next==="unit-sheet"?"Second Unit":"Location prints";kicker="Cine Luna  /  Frankie Prado";scoutPanel(b,next==="unit-sheet");
    }else if(next==="umbrella"){
      title="Umbrella loan stand";kicker="Marlin Motel  /  Route 6";umbrellaPanel(b);
    }else if(next==="window-songs"){
      title="Open Windows";kicker="Songs from the street";openWindowsPanel(b);
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
      title="A note from Rosario";kicker="Marlin Motel  /  Room 14";showDesk(b);if(printAvailable())b.append(airLedgerButton());if(afternoon.album.records.length)b.append(albumButton());
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
      b.append(makeButton("Romy’s location notebook","Three loading ramps around town. Bring your own car. I pay for the first clean landing at each.","Read notebook",()=>openJumpBook(jumps.sites[0])));
      b.append(makeButton("Carbon Copies","See that chalk circle across Tideway? I need two tire rubbings for the shop.","Read the order",()=>readCopies("left")));
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
    }else if(next==="jobs"&&windowRide){const r=windowRide;title=r.brief.title;kicker=r.social?"Passenger seat  /  "+BaySecondUnit.names[unit.other]:"Window Seat  /  Cine Luna";
      if(r.social){
        b.append(makeButton(formatVehicle(r.vehicle),r.phase==="park"?"Parked at the curb.":"Your partner has the keys.","Resume",closePanel));
        if(r.phase==="park")b.append(makeButton("Another stop","Stay in the passenger seat.","Pick a stop",()=>openPanel("ride-stops")));
      }else b.append(makeButton(r.brief.subject,r.best?"Best this run · "+r.best.score+"/100":"Take the passenger seat and frame it while the wheels are turning.","Resume",closePanel));
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
      if(save.green.rev)b.append(makeButton("On Green · Timing slips","Times, launches and results from the drivers you’ve met.","Read slips",()=>openPanel("green-slips")));
      if(save.luggage.rev)b.append(makeButton("Marlin claim stubs","Guest names, signed receipts and the cars holding their cases.","Open",()=>openPanel("claim-stubs")));
      if(watchCrew.towing){
        b.append(makeButton("Sol Beach patrol","Bring "+watchCrew.call.slip.name+" into shallow water.","Keep swimming",closePanel),
          makeButton("Hand off the float","Tali will swim out and bring them in.","Let go",()=>{watchCrew.release();closePanel();}));
      }else if(active){
        const line=document.createElement("p");line.textContent=active.take?"One Good Take is shooting behind Cine Luna. Press G on set to switch drivers.":active.job.by+" has you on "+active.job.name+". Your next stop is "+currentTarget().name+".";b.append(line);
        b.append(makeButton("Back to the city","Keep the current job active.","Resume",closePanel),makeButton("Drop this job",active.take?"Leave the closed set at Cine Luna.":"Stay where you are and choose another contact.","Cancel job",()=>{dropJob();openPanel("jobs",true);}));
      }else if(cycles.riding||skate.rider||boardwalk.player){
        for(const j of jobs){const site=jobSites.find(s=>s.id===j.id)||shorePins[0];b.append(makeButton(j.name,j.by+"  ·  "+site.name,"Set waypoint",()=>clockPin(site)));}
      }else for(const j of jobs)b.append(makeButton(j.name,j.by+"  ·  "+j.desc,j.id==="ferry"?"$450–900":j.id==="exposure"?"$300–425":j.id==="regatta"?"Race desk":cash(j.pay)+(["fare","dash"].includes(j.id)?"+":""),()=>j.id==="race"?(save.clubCup.known?cupBook():clockPin(jobContacts.find(c=>c.id==="race"))):startJob(j.id),j.id==="exposure"||j.id==="ferry"?"jobcard story-job":"jobcard"));
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
      if(save.campana.met&&!active)b.prepend(makeButton("La Campana · Nina Rojas",campana.phase==="route"?"On the way to "+BayCampana.stops[campana.next].name:"At "+campana.station.name,"Track truck",()=>clockPin({...campana.counter,kind:"campana-track",name:"La Campana"})));
      if(save.threads.met)b.append(makeButton("Cora Vidal · Low Tide Exchange","Fitting mirror and window commissions on Ocean Drive.","Mark stall",()=>clockPin(threads.counter)));
      if(neighbors.people.some(p=>neighbors.known(unit.lead,p,"met")))b.prepend(makeButton("Word of mouth","People you’ve met, their favorite places and messages you’ve carried.","Contacts",()=>openPanel("neighbors")));
      if(save.engineSeven.log.length)b.prepend(makeButton("Engine 7 daybook",save.engineSeven.log.at(-1).title,"Read slip",()=>{sevenPage=save.engineSeven.log.length-1;openPanel("engine-book");}));
      if(save.pictureJumps.known)b.prepend(makeButton("Romy’s location notebook",Object.keys(save.pictureJumps.best).length+" of 3 locations signed","Read notebook",()=>openJumpBook(jumpPage)));
      if(save.clubCup.known)b.prepend(makeButton("Sol Motor Club",save.clubCup.last?cupPlace(save.clubCup.last.place)+" · "+save.clubCup.last.car:"Coastline Circuit","Race sheet",cupBook));
      if(save.catchBook.known)b.prepend(makeButton("Red Cork Club",save.catchBook.total+" tagged and released","Tag book",()=>{corkPage=corkNear()||null;openPanel("red-cork",true);}));
      if(save.freight.known)b.prepend(makeButton("Port Sol Belt",save.freight.runs+(save.freight.runs===1?" signed delivery":" signed deliveries"),"Waybills",()=>{spurDesk=stationNear()||null;openPanel("port-belt",true);}));
      if(save.oceanBeat.known)b.prepend(makeButton("Ocean Unit 12",save.oceanBeat.slip?.plate||"Officer Lina Solís","Driver copy",()=>openPanel("ocean-copy")));
      if(save.copies.known)b.prepend(makeButton("Carbon Copies","Romy’s shop file · "+carbon.sides.filter(s=>save.copies[s]).length+" of 2 directions","Read copies",()=>readCopies(copySide)));
      if(save.starlite.tickets.length)b.prepend(makeButton("Starlite ticket stubs",save.starlite.tickets.at(-1).title,"Look",()=>{ticketIndex=save.starlite.tickets.length-1;openPanel("starlite-tickets");}));
      if(pavement.archive.length)b.prepend(makeButton("Folded copies","Bay Wire papers you picked up on the street.","Read",()=>{paperIndex=pavement.archive.length-1;openPanel("pocket-papers");}));
      if(houseLights.s.opened)b.prepend(makeButton("House Lights","Frankie's two-exposure call sheet and the cinema print.","Open sleeve",()=>openPanel("house-lights")));
      if(unit.met)b.prepend(makeButton("Second Unit · "+BaySecondUnit.names[unit.other],"Call for a Window Seat shoot, find your partner or browse your prints.","Call sheet",()=>openPanel("unit-sheet")));
      if(curbWire.book.met||curbWire.book.clips.length)b.prepend(wireButton());
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
      const songs=BayOpenWindows.cards();
      if(songs.length)b.append(makeButton("Open Windows",songs.length+" of 6 records heard from passing cars.","Song requests",()=>openPanel("window-songs")));
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
      const chooseRidePin=pickingRidePin||windowRide?.social&&windowRide.phase==="park";
      const initial=document.createElement("option");initial.textContent=chooseRidePin?"Choose a stop for your drive":cabs.booking?"Following Cab 17":watchCrew.towing?"Returning the swimmer to shore":active?"Following the current job":"Choose a destination";initial.value="";list.append(initial);
      const landings=bay.docks.map(d=>({...bay.berth(d,vacant(skiff,d,1)?1:-1),name:d.name}));
      const ownPin=carPin();
      const parkedBikes=cycles.bikes.filter(b=>!b.rider),titlePins=gull.pins().filter(p=>p.v!==car);
      const countyStops=[bridgeSite,BayDrawbridge.mouth,BayDrawbridge.iceDock,BayCut.station,...BayCutWildlife.sources.map(s=>s.site),skiff?landings[2]:shorePins[2],cutGate,...parkedBikes.filter(b=>BayCut.area(b))];
      const ranks=Object.values(BayCab.stops).map(s=>({...s.stand,name:"Bay Cab · "+s.name}));
      const places=chartMode==="cut"?countyStops.concat(titlePins.filter(p=>BayCut.area(p)),ownPin&&BayCut.area(ownPin)?[ownPin]:[]):chartMode==="city"?locations.filter(p=>!BayCut.area(p)).concat(titlePins.filter(p=>!BayCut.area(p)),jobPins,ranks,[BayMotelParking.bay,cutGate],parkedBikes.filter(b=>!BayCut.area(b)),ownPin?[ownPin]:[],save.stunt?[BayTakePoster.place]:[]):[...airPins,...landings,{x:bay.beacon.x+11,z:bay.beacon.z,name:"Gull Light"}];
      places.forEach((v,i)=>{const opt=document.createElement("option");opt.value=i;opt.textContent=v.name;list.append(opt);});list.disabled=!!active&&!chooseRidePin||!!pickup||!!cabs.booking||watchCrew.towing;
      function acceptPin(){if(chooseRidePin)openPanel("ride-stops");else{closePanel();note("Map pin",waypoint.name,2);}}
      list.onchange=()=>{if(list.value!==""){waypoint={...places[Number(list.value)]};acceptPin();}};
      b.append(list);c.addEventListener("click",ev=>{if(list.disabled)return;const rect=c.getBoundingClientRect(),frame=atlasFrame(),scale=c.width/frame.span;
        const mx=(ev.clientX-rect.left)/rect.width*c.width,my=(ev.clientY-rect.top)/rect.height*c.height;
        const wx=frame.cx+(mx-c.width/2)/scale,wz=frame.cz+(c.height/2-my)/scale;
        const pin={x:clamp(wx,-181,207),z:clamp(wz,-179,179)};
        const nearDock=bay.docks.find(d=>Math.hypot((chartMode==="bay"?d.x:d.footX+1.4)-wx,d.z-wz)<11);
        const court=courts.find(g=>Math.hypot(g.site.x-wx,g.site.z-wz)<6);
        const venue=court?courtPins[courts.indexOf(court)]:Math.hypot(wx-recoveryYard.drop.x,wz-recoveryYard.drop.z)<4?dispatchPin:locations.find(p=>["room","counter","surf-tower","theater","recovery-desk","wheel-window","bike-rack","pickup-court","valet-stand","sound-shell","skate-spot","bus-stop","air-dock","clinic","camera-shop","motor-sales","boatyard","public-slip","radio-booth","drive-in","engine-house"].includes(p.kind)&&Math.hypot(p.x-wx,p.z-wz)<4)||ranks.find(p=>Math.hypot(p.x-wx,p.z-wz)<4.5);
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
        acceptPin();});
    }else{
      title="Paused";kicker="Sundown Bay  /  "+district(pos());const stats=document.createElement("div");stats.className="statline";stats.textContent=cash(save.wallet)+"  /  Jobs "+save.paid+"  /  Tapes "+save.tapes.length+" of 5";b.append(stats);
      const keysList=document.createElement("div");keysList.className="controls";const allControls=[["WASD / ↑↓←→","Move, drive or swim"],["Mouse","Look around"],["E","Enter, exit or climb aboard"],["Shift","Sprint or swim faster"],["S / ↓","Brake, then reverse"],["Space","Jump, handbrake or hold to dive"],["H / F","Horn / interact"],["J / M","Jobs / map"],["Q / C","Keyboard look"],["V / X","Look back / recenter"],["+ / −","Camera distance"]];
      allControls.push(["Y / P","Switch characters / Frankie’s camera"],["U / G","Umbrella stand or fold / share and walk alongside"],["L","Hold beside a storm drain to clear it"],["Z / I","Driving view / wipers"],["[ / ]","Previous / next radio station"],["R","Toggle all sound"]);
      allControls.push([", / .","Left / right turn signal"]);
      allControls.push(["L","Flash headlights · let a waiting driver turn"]);
      allControls.push(["Signal + H","Ask a boulevard driver for room to merge"]);
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
    if(company.holding&&held("Space")){pointer.edgeX=0;company.aimX=clamp(company.aimX+dx*.009*cameraRig.sensitivity,-1.8,1.8);return;}
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
  for(const code of ["KeyO","KeyZ","KeyI","KeyU","KeyY","KeyP","KeyL","KeyN","Comma","Period","Slash"])handled.add(code);
  document.addEventListener("mousedown",e=>{if(e.button===0&&!panel&&e.target===lookSurface()&&palmPointer(e,true))return;if(e.button===0&&!panel&&e.target===lookSurface()&&wash.hasWand()&&onStreetFeet())hoseButton=true;});
  addEventListener("mouseup",()=>{hoseButton=false;if(!panel&&palm.match?.draw!=null)palm.release(palmEnv);});
  addEventListener("keydown",ev=>{
    if(ev.ctrlKey||ev.metaKey||ev.altKey)return;
    if(!play){if(ev.code==="Enter"&&!ev.repeat){ev.preventDefault();playStart();}return;}
    if(panel){
      if(panel==="bell-desk"&&!ev.repeat&&/^Digit[1-3]$/.test(ev.code)){ev.preventDefault();takeClaim(luggage.tags[Number(ev.code.slice(-1))-1]);return;}
      if(panel==="take-result"&&ev.code==="KeyT"&&!ev.repeat){ev.preventDefault();startTake();return;}
      if((ev.code==="Escape"||ev.code==="KeyM"||ev.code==="KeyJ")&&!ev.repeat){ev.preventDefault();if(ev.code==="Escape"){closePanel();}else openPanel(ev.code==="KeyM"?"map":"jobs");return;}
      if(ev.code==="Tab"){const controls=[...$("panel").querySelectorAll("button:not(:disabled),select:not(:disabled),[tabindex='0']")];if(!controls.length)return;
        if((ev.shiftKey&&document.activeElement===controls[0])||(!ev.shiftKey&&document.activeElement===controls.at(-1))){ev.preventDefault();controls[ev.shiftKey?controls.length-1:0].focus();}}
      return;
    }
    if(!handled.has(ev.code)&&!((bell.open||active?.campana||afternoon.photo||neighbors.chat)&&/^(Digit|Numpad)[1-3]$/.test(ev.code))&&!(palm.match&&/^Digit[1-6]$/.test(ev.code))&&!(car?.hydraulic&&/^(Digit|Numpad)[1-4]$/.test(ev.code)))return;
    if((ev.code==="Enter"||ev.code==="Space")&&document.activeElement?.matches("button"))return;
    ev.preventDefault();keys.add(ev.code);if(ev.repeat)return;
    if(ev.code==="Slash"&&askAboutSong())return;
    if(summerKey(ev.code)||spurKey(ev.code))return;
    if(corkKeys(ev.code))return;
    if(ev.code==="KeyF"&&cupNear()){cupBook();return;}
    if(ev.code==="KeyF"&&beatAction())return;
    if(ev.code==="KeyF"){const chalk=jumpChalk();if(chalk){openJumpBook(chalk);return;}}
    if(engineKey(ev.code)||starliteKey(ev.code))return;
    if(ev.code==="KeyF"&&atThreads()){visitThreads();return;}
    if(curbsideKey(ev.code))return;
    if(bellKey(ev.code))return;
    if(ev.code==="KeyF"&&nearbyClock()){openPanel("green-clock");return;}
    if(ev.code==="KeyH"&&green.run&&greenFree()){honk();return;}
    if(afternoon.photo&&afternoonKey(ev.code))return;
    if(paletaKey(ev.code))return;
    if(neighborKey(ev.code))return;
    if(ev.code==="KeyF"&&!unit.eye&&!unit.transition&&!windowRide&&byCinema()&&!crewDeskNear()){cabAction();return;}
    if(ev.code==="KeyF"&&!active&&!unit.eye&&!afternoon.photo&&(wireDeskNear()||wireWitnessNear())){wireOpen(wireWitnessNear()?.id);return;}
    if(ev.code==="KeyF"&&atCopyRail()){readCopies(copySide);return;}
    if(ev.code==="KeyF"&&cornerAction(true))return;
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
    if(ev.code==="KeyL"&&canUseSeat()){
      if(streetTime-(car.headlightFlash??-5)<.8)return;
      car.headlightFlash=streetTime;
      if(!heat&&BayJunctionTurns.offer(car,cars,streetTime))note("After you","Hold there while they check the other lane.",2.5);
      return;
    }
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
      else if(skiff===manta&&!active&&!heat)mantaCall();
      else if(skiff||bay.landing(hero.x,hero.z)){if(!active?.regatta&&!active?.ferry)openRaceSheet();}
      else talk();
    }
    else if(["Equal","NumpadAdd","Minus","NumpadSubtract"].includes(ev.code)){cameraRig.changeZoom(["Equal","NumpadAdd"].includes(ev.code)?-.12:.12);saveCamera();}
  });
  addEventListener("keyup",ev=>{
    if(ev.code==="Space"&&active?.angling&&!panel)active.angling.release(streetTime,hours.rain);
    keys.delete(ev.code);if(/^(Digit|Numpad)[1-4]$/.test(ev.code))club.release(Number(ev.code.at(-1))-1);
    if(ev.code==="Space"&&palm.match&&!panel)palm.release(palmEnv);
    if(ev.code==="Space"&&skate.rider&&!panel)skate.pop(skateEvent);
    if(ev.code==="Space"&&pickup&&!panel)pickup.releaseHuman(cameraRig.yaw);
  });
  addEventListener("blur",()=>{keys.clear();resetPointer();if(play&&!panel)openPanel("pause");});
  document.addEventListener("visibilitychange",()=>{if(document.hidden){keys.clear();if(play)saveTime();if(play&&!panel)openPanel("pause");}});
  let last=performance.now(),lateSeconds=0,spareSeconds=0,verySlowFrames=0,lastIntroPaint=0,lastMenuPaint=0;
  function tuneStreetResolution(seconds,streetView){
    if(!streetView||seconds<=0||seconds>2.5){lateSeconds=spareSeconds=verySlowFrames=0;return;}
    verySlowFrames=seconds>.13?Math.min(8,verySlowFrames+1):Math.max(0,verySlowFrames-2);
    const floor=verySlowFrames>=6?.52:.64;
    if(seconds>1/29){
      lateSeconds=Math.min(1,lateSeconds+Math.min(.09,seconds)*(seconds>.048?1.5:1));
      spareSeconds=0;
    }else{
      lateSeconds=Math.max(0,lateSeconds-seconds*.7);
      spareSeconds=seconds<1/48?Math.min(9,spareSeconds+seconds):0;
    }
    if(lateSeconds>=.82&&view.scale>floor){
      view.scale=Math.max(floor,Math.round((view.scale-.12)*100)/100);
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
      elapsed+=dt;hours.step(dt);gutters.weather(hours);if(hours.total-savedAt>=20)saveTime();
      bumpLock=Math.max(0,bumpLock-dt);
      // Small steps keep steering and collision response consistent on slower hardware.
      let left=dt;while(left>.00001&&!panel){
        const d=Math.min(left,motos.bike||car||skiff||cycles.riding||skate.rider||pickup||active?.take?1/60:1/45);
        iceVan.campanaDriver=!campana.manual&&car!==iceVan&&transfer?.v!==iceVan;
        stepSummer(d);stepSpur(d);campana.step(d,paletaEnv);radioStep(d);stepButtonwood(d);stepBridge(d);stepNeon(d);stepAir(d);stepRescue(d);sevenStep(d);brisasStep(d);palmUpdate(d);gull.step(d,gullEnv);stepMotorcycles(d);stepSkate(d);transit.step(d,transitEnv);
        const onBoardwalk=!!(boardwalk.player||cycles.riding);stepCourts(d);boardwalkStep(d);
        if(car!==wrecker&&tow.busy)tow.step(d,towClear,recoveryEvent);
        if(room){walkRoom(d);traffic(d);beat.step(d,beatEnv);cupStep(d);bandSteps(d);cabs.step(d,cabEnvironment,cabEvent);recovery.step(d,recoveryEnv,recoveryEvent);stepBeach(d);left-=d;continue;}
        if(spur.aboard||spur.transfer){/* The engine supplies the rider's position. */}
        else if(active?.angling)stepCork(d);else if(active?.take)stepTake(d);else if(deckStep)stepLanding(d);else if(transfer)stepTransfer(d);
        else if(swim)swimStep(d);
        else if(car){if(car!==meet.jules&&!(active?.meet&&meet.phase==="countdown"))drive(d,!!unit.transition);}
        else if(!unit.transition&&!unit.eye&&!afternoon.photo&&!windowRide?.held&&!broadcastDesk.mix&&!palm.match&&!palm.playerSeat&&!gull.exchange&&!motos.player&&!motos.job?.swapping&&!rescue.holding&&!airLine.aboard&&!skate.rider&&!transit.engaged&&!band.take&&!pickup&&!onBoardwalk&&!cabs.playerHeld&&!skiff&&!listening()&&!exchangingKey())walk(d);
        stepWater(d);traffic(d);beat.step(d,beatEnv);cupStep(d);greenStep(d);bandSteps(d);cabs.step(d,cabEnvironment,cabEvent);
        if(windowRide)windowRide.step(d,windowEnv,windowRideEvent);recovery.step(d,recoveryEnv,recoveryEvent);pursuit(d);stepMeet(d);advanceJob(d);serviceGarage(d);stepBeach(d);
        pavement.physics(d,cars,pavementEnv);left-=d;
      }
      if(!pickup&&!room&&!boardwalk.player&&!cabs.playerHeld&&!windowRide?.held&&!swim&&!active?.take&&!transfer&&!skiff&&!deckStep)checkTapes();const p=pos(),speed=Math.abs(active?.take?.subject().speed??(transit.aboard?transit.bus.speed:null)??motos.bike?.speed??skiff?.speed??car?.speed??(windowRide?.held?windowRide.vehicle.speed:cabs.playerHeld?taxi.speed:0));
      if(!panel){bellStep(dt);curbStep(dt);stepGutters(dt);crewStep(dt);stepUmbrella(dt);updateRadio();stepField(dt);}
      if(!panel){theatreStep(dt);neighborStep();stepPavement(dt);}
      for(const v of cars){BayPalma.weatherCar(v,dt,hours.wet);if(v!==car&&v.rubberHeat>0)BayDriving.cool(v,dt);}
      if(car)driverSeat.wipers(car,dt,Math.max(hours.rain,glassWater()));
      let spray=wash.spraying&&!room&&!swim?.underwater&&wash.target,sprayRange=spray?dist(p,spray):Infinity,sprayGain=1;
      if(!room&&!swim?.underwater)for(const s of summerCaps.posts)if(s.pressure>.03){
        const range=dist(p,s);if(range<26&&range<sprayRange){spray=s;sprayRange=range;sprayGain=s.pressure*(s.flow==="burst"?1:.55);}
      }
      const heading=isTop()?cameraRig.yaw:cam.yaw;
      sound.update({rain:room||swim?.underwater?0:hours.rain,canopy:rainWalk.amount,radioProgram:broadcastDesk.signal,speed,dealerEngine:car?.stockId?car:null,motorcycle:motos.bike,driving:!!motos.bike||!!windowRide?.held||transit.aboard||!!active?.take||!!car||!!skiff,boating:!!skiff,swimming:!!swim,depth:swim?.depth||0,stroke:swim?.pace||0,field:fieldSignal(),shell:broadcastDesk.mix?null:band.audio(dt,p,bandEnv),heat,siren:heat?clamp(1-chase.closestUnit/103,0,1):0,time:elapsed,coast:clamp((p.x-100)/93,0,1),
        passingRadio:carRadios.air,streetListening:!car&&windowListener()===hero,
        washSpray:sprayGain*clamp(1-sprayRange/26,0,1)**1.4,washPan:spray?clamp(((spray.x-p.x)*Math.cos(heading)-(spray.z-p.z)*Math.sin(heading))/Math.max(4,sprayRange),-.9,.9):0,
        burn:car?.burn||0,wiper:car?.wiper||0,inCabin:insideSeat()||busCameras(),bridge:room?null:{phase:bridge.phase,lift:bridge.lift,gates:bridge.gates,distance:dist(p,BayDrawbridge.center)},
        rescueLevel:room?0:Math.max(unit4.responseLights?clamp(1-dist(p,unit4)/98,0,1):0,engine7.responseLights&&company.traveling?clamp(1-dist(p,engine7)/104,0,1):0),
        floatEngine:room?0:airLine.plane.engine*clamp(1-Math.hypot(p.x-airLine.plane.x,(p.y||0)-airLine.plane.y,p.z-airLine.plane.z)/98,0,1),floatThrottle:airLine.plane.throttle,
        rotor:backup.air?backup.air.light*clamp(1-Math.hypot(backup.air.x-p.x,backup.air.y,backup.air.z-p.z)/110,0,1):0,
        docks:clamp(1-Math.hypot(p.x+142,p.z+76)/94,0,1),skid:car?.slip||0});
      if(broadcastDesk.mix&&!broadcastDesk.approach&&!panel)BayAirwavesDial.decks($("boothMeter"),broadcastDesk.mix);
      if(pickup)courtMeter();
      if(band.take)drumHud();
      if(elapsed-lastHud>.10){hud();lastHud=elapsed;}if(elapsed-lastMap>.09){drawMini();lastMap=elapsed;}
    }
    if(wireView&&panel==="curb-wire")paintWire(now);
    if(timingFilm?.playing)drawTimingFilm(now);
    if(panel&&now-lastMenuPaint<(skateProof?120:300))return;lastMenuPaint=now;
    tuneStreetResolution(raw,play&&!panel&&!isTop());
    renderWorld(dt,streetTime);
    if(!panel&&skateTape.active)skateTape.sample(streetTime,lookSurface(),isTop()?null:$("sky"));
    if(skateProof)BaySkateFilm.paint(skateProof.canvas,skateReel,(now-skateProof.start)/1000);
  }
  // Show a first frame before the browser schedules its animation loop.
  renderWorld(1/60,0);requestAnimationFrame(tick);
})();
