/* Last Exposure. Mara walks both ends of the ride and stays with the car she boarded. */
(() => {
  "use strict";
  const job={id:"exposure",name:"Last Exposure",by:"Mara Vega",desc:"Drive a local photographer to Port Sol before the pier changes hands.",pay:300};
  const pickup={x:153,z:-21.5,name:"Marlin Motel"};
  const dock={x:-149.5,z:-91,name:"Lot 14, Port Sol"};
  const routes={
    live:{name:"Sol FM van",x:149.5,z:119,stand:{x:152.6,z:117.6},pay:425,
      headline:"Lot 14 sale breaks on Sol FM",edition:"Sol FM led the evening bulletin with Mara Vega’s photograph. By the weather report, listeners were already gathering at the pier."},
    print:{name:"Cine Luna",x:5.1,z:54.8,stand:{x:8.0,z:54.8},pay:300,
      headline:"Cine Luna puts the pier on screen",edition:"Before tonight’s double feature, the projectionist put Mara Vega’s photograph on the screen. Someone in the back row recognized the signature."}
  };
  const props=[
    {kind:"van",x:154.8,z:119,yaw:0,w:2.10,d:4.54,top:3.44},
    {kind:"kiosk",x:9.2,z:54.8,yaw:-Math.PI/2,w:.93,d:1.24,top:1.97},
    {kind:"notice",x:-154.3,z:-91,yaw:Math.PI/2,w:.25,d:2.24,top:2.19}
  ];
  const liveTime=105;
  const relayDuration=1.1;
  const pressSpeed=value=>Number.isInteger(value)&&value>=5&&value<=140?value:0;
  // Approach from the south to put both east-facing subjects at Mara's window.
  const photoRuns={
    wheel:{name:"Coast Wheel",lead:{x:146,z:74,name:"Ocean Drive · northbound approach"},frame:{x:146,z:113,name:"Coast Wheel · passenger window"},
      direction:"Keep the water on my side. Ease up by the wheel. I want one of the red gondolas."},
    luna:{name:"Cine Luna",lead:{x:2,z:10,name:"Luna Boulevard · northbound approach"},frame:{x:2,z:44,name:"Cine Luna · passenger window"},
      direction:"Take Luna north. Go easy past the box office and I can get the whole marquee."}
  };
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const stopped=v=>Math.hypot(v.vx,v.vz)<.85&&Math.abs(v.speed)<.85;
  const questions={
    count:{ask:"How many came off the boat?",aboard:"Eighteen. Alma had seventeen transfers clipped together. Luis got the loose one she kept in her cap.",ashore:"Seventeen. Alma counted twice. Through the glass I could see one man still on the far side holding two tins.",unknown:"Alma counted them at the step. The clinic got its number from her pencil, not the clock in my dash."},
    memory:{ask:"What do you remember hearing?",aboard:"I heard those two lunch tins knock together. Then Luis called across the aisle, ‘Anybody saving that seat?’",ashore:"Luis called his brother’s name across the water. It carried right into my cab. I can still hear it over that old motor.",unknown:"The doors wheezed so loud I missed the names. Then somebody up the back started saying them again for me."}
  };
  function readBed(raw){
    return Array.isArray(raw)&&raw.length===8&&raw.every(n=>Number.isInteger(n)&&n>=0&&n<=60)?raw.slice():null;
  }
  function readInterview(raw){
    if(!Object.hasOwn(questions,raw?.question)||!["aboard","ashore","unknown"].includes(raw?.morning)||
      !BayTransit.stops.some(s=>s.id===raw.stop))return null;
    const bed=readBed(raw.bed);return bed?{question:raw.question,morning:raw.morning,stop:raw.stop,bed}:null;
  }
  function interviewCopy(record){
    return {line:questions[record.question][record.morning],stop:BayTransit.stops.find(s=>s.id===record.stop).short};
  }
  // The tape runs only in the wake of the scheduled coach. Traffic lights and missed turns leave the recorded sound intact.
  class CoachTape {
    constructor(line,bed){this.line=line;this.bed=readBed(bed)||[];this.seconds=this.bed.length/2;this.extraStop=null;}
    get ready(){return this.seconds>=4;}
    get target(){
      const l=this.line;
      return this.ready?(l.phase==="dwell"?l.stop:l.target):l.bus;
    }
    canAsk(v){const l=this.line;return this.ready&&l.docked(l.stop)&&distance(v,l.stop)<14&&stopped(v);}
    rolling(v){
      const b=this.line.bus,p=BayDriving.local(b,v.x,v.z);
      return b.speed>1.4&&v.speed>1.4&&p.z< -6&&p.z> -36&&Math.abs(p.x)<6.5&&Math.cos(v.yaw-b.yaw)>.64;
    }
    step(dt,v){
      if(!this.ready&&this.rolling(v)){
        this.seconds=Math.min(4,this.seconds+dt);
        while(this.bed.length<Math.floor(this.seconds*2))this.bed.push(Math.min(60,Math.round(this.line.bus.speed*2.237)));
        if(this.ready)return true;
      }
      const l=this.line;
      if(l.phase!=="dwell")this.extraStop=null;
      else if(this.ready&&this.extraStop!==l.stop&&distance(v,l.stop)<35){
        this.extraStop=l.stop;l.dwell=Math.max(l.dwell,10);
      }
      return false;
    }
    hint(v){
      if(this.ready)return this.canAsk(v)?"N · Ask Marta about the crossing":"Park near the open doors at "+this.target.short;
      if(distance(v,this.line.bus)>50)return "Catch the green Route 6 coach";
      return (this.rolling(v)?"Recording":this.line.phase==="dwell"?"Follow when Marta pulls out":"Match her lane behind the bus")+" · "+this.seconds.toFixed(1)+" / 4.0 s";
    }
  }
  class Run {
    constructor(){
      this.mara={...pickup,yaw:-1.9,y:.076};this.motion=new BayPlayerMotion();
      this.phase="pickup";this.ride=null;this.path=[];this.progress=0;this.route="";this.remaining=0;
      this.aim={x:.43,y:.58};this.remarked=false;this.warnedHeat=false;this.warnedFlat=false;this.warnedClock=false;
      this.offeredSleeve=false;
      this.photoRoad="";this.onApproach=false;
      this.field="";this.quote="";
      this.press=null;this.trackPress=false;this.passAge=0;this.pressMPH=0;
    }
    markRoad(id){this.coachTape=null;this.photoRoad=Object.hasOwn(photoRuns,id)?id:"";this.onApproach=false;this.finder=null;}
    target(car){
      if(this.field)return this.phase==="delivery"?{x:this.ride.x,z:this.ride.z,name:"Mara’s passenger door"}:{...BayLotNegative.mark,name:"Lot 14 · Camera mark"};
      if(this.ride&&this.ride!==car)return {x:this.ride.x,z:this.ride.z,name:"Mara’s car"};
      if(this.phase==="pickup"||this.phase==="approach"||this.phase==="board")return pickup;
      if(this.phase==="port"&&this.coachTape){const p=this.coachTape.target;return {x:p.x,z:p.z,name:p.short||"Marta’s Route 6"};}
      if(this.phase==="port"&&this.photoRoad){const road=photoRuns[this.photoRoad];return this.onApproach?road.frame:road.lead;}
      if(this.trackPress&&this.pressAvailable())return {x:this.press.x,z:this.press.z,name:"Sol FM · press van"};
      return routes[this.route]||dock;
    }
    objective(car){
      if(this.field)return this.phase==="delivery"?"Bring the negative back to the passenger door":"As Mara, find your angle on the sale notice";
      if(this.ride&&this.ride!==car)return "Get back in Mara’s car";
      switch(this.phase){
        case "pickup":return car?"Pull up beside Mara":"Take a car and pick up Mara";
        case "approach":case "board":return "Wait for Mara to get in";
        case "port":if(this.coachTape)return this.coachTape.ready?"Meet Marta at "+this.coachTape.target.short:"Record Route 6 from behind the coach";
          return this.photoRoad?(this.onApproach?"Frame "+photoRuns[this.photoRoad].name+" from Mara’s window":"Take Mara past "+photoRuns[this.photoRoad].name):"Park by the Lot 14 notice at Port Sol";
        case "choice":return "Decide where to take the photograph";
        case "delivery":return this.pressMPH?"Take Mara’s caption to Sol FM":this.trackPress&&this.pressAvailable()?"Catch the Sol FM press van":"Take Mara to "+routes[this.route].name;
        default:return "Wait for Mara to make the handoff";
      }
    }
    holds(v){return this.ride===v&&(!!this.field||["approach","board","exit","handoff"].includes(this.phase));}
    atDock(car){return !!car&&this.ride===car&&distance(car,dock)<9&&stopped(car);}
    sleeveStop(car){return this.offeredSleeve&&this.phase==="port"&&!this.remarked&&car===this.ride&&!!car&&stopped(car);}
    interaction(car){
      if(this.field)return this.field==="walk"?(this.phase==="choice"?"contact":this.canFrame()?"viewfinder":""):"";
      return (this.regrouped&&this.phase==="choice"&&car===this.ride)||this.atDock(car)?({port:"viewfinder",choice:"contact"})[this.phase]||"":"";
    }
    focus(){const sign=BayExposureArt.photoNotice;return Math.abs(this.aim.x-sign.x)<=sign.width*.32&&Math.abs(this.aim.y-sign.y)<=sign.height*.36;}
    expose(){if(this.phase!=="port"||!this.focus())return false;this.phase="choice";return true;}
    choose(route){if(this.phase!=="choice"||!Object.hasOwn(routes,route))return false;
      this.route=route;this.remaining=route==="live"?liveTime:0;this.phase="delivery";return true;}
    pressAvailable(){return this.phase==="delivery"&&this.route==="live"&&!this.pressMPH&&this.press?.path&&this.press!==this.ride;}
    relayHint(car){
      if(!car||car!==this.ride||this.field||!this.pressAvailable()||distance(car,this.press)>17)return "";
      if(this.passAge)return "Hold alongside until Mara lets go";
      const van=this.press,seat=bayCarLayout(car.kind),other=bayCarLayout(van.kind);
      if(Math.cos(car.yaw-van.yaw)<.94)return "Turn to travel with the van";
      const window=BayDriving.world(van,-other.track,other.seatZ),q=BayDriving.local(car,window.x,window.z);
      if(q.x<seat.track-.12||q.x>seat.track+1.38)return "Put the van on Mara’s right";
      if(Math.abs(q.z-seat.seatZ)>1.05)return "Line up the two front windows";
      if(Math.min(car.speed,van.speed)<2.2)return "Wait until both cars are rolling";
      if(Math.abs(car.speed-van.speed)>2.25)return "Match the van’s speed";
      return "Pass the film";
    }
    signal(car){
      const hint=this.relayHint(car);
      if(hint==="Pass the film")this.passAge=.001;
      return hint;
    }
    advancePass(dt,car,transfer){
      // Recheck the moving windows throughout the exchange. A missed pass costs only time.
      const age=this.passAge;this.passAge=0;
      if(transfer||this.relayHint(car)!=="Pass the film")return "missed-pass";
      this.passAge=age+dt;
      if(this.passAge<relayDuration)return;
      this.passAge=0;this.pressMPH=Math.round(car.speed*2.237);this.trackPress=false;return "desk-hold";
    }
    canister(){
      if(!this.passAge)return null;
      const v=this.ride,p=this.press,a=bayCarLayout(v.kind),b=bayCarLayout(p.kind);
      const start=BayDriving.world(v,a.track-.18,a.seatZ),end=BayDriving.world(p,-b.track+.13,b.seatZ);
      const t=Math.min(1,this.passAge/relayDuration),f=t*t*(3-2*t);
      return {x:start.x+(end.x-start.x)*f,z:start.z+(end.z-start.z)*f,
        y:a.glass[4]+.22+(b.glass[4]-a.glass[4])*f+.12*Math.sin(Math.PI*t)};
    }
    dispose(){if(this.ride)this.ride.passengerDoor=0;}
    leaveForPicture(car,plan){
      if(this.field||this.phase!=="port"||!this.atDock(car)||!plan(car,true,this.mara,1))return false;
      this.field="leaving";return true;
    }
    canFrame(){
      const p=this.mara,n=BayLotNegative.notice;
      if(this.field!=="walk"||this.phase!=="port"||p.x<n.x+2.45||p.x>n.x+6||Math.abs(p.z-n.z)>=3.2)return false;
      for(let i=1;i<8;i++)if(BayDriving.clearance(this.ride,{x:p.x+(n.x-p.x)*i/8,z:p.z+(n.z-p.z)*i/8})<.15)return false;
      return true;
    }
    returnToSeat(plan){
      if(this.field!=="walk"||distance(this.mara,this.ride)>5.5)return false;
      const route=plan(this.ride,false,this.mara,1);if(!route)return false;
      this.path=route.points;this.field="approach-car";return true;
    }
    fieldStep(dt,ground){
      if(this.field==="walk")return;
      if(this.field==="approach-car"){if(this.walk(dt,ground))this.field="boarding";return;}
      const entering=this.field==="boarding";
      this.progress=Math.max(0,Math.min(1,this.progress+(entering?1:-1)*dt/1.5));this.pose(dt,ground);
      if(!entering&&this.progress===0){this.field="walk";this.motion.reset();return "on-location";}
      if(entering&&this.progress===1){this.field="";return "driver-back";}
    }
    stride(dt,across,forward,yaw,fast,clear,ground){
      const p=this.mara,oldX=p.x,oldZ=p.z,oldYaw=p.yaw;
      const step=dt*(fast?4.15:2.65)/Math.max(1,Math.hypot(across,forward));
      const dx=(Math.cos(yaw)*across+Math.sin(yaw)*forward)*step,dz=(Math.cos(yaw)*forward-Math.sin(yaw)*across)*step;
      if(dx&&clear(p.x+dx,p.z))p.x+=dx;if(dz&&clear(p.x,p.z+dz))p.z+=dz;
      const travel=distance(p,{x:oldX,z:oldZ});
      if(travel>.00001){const diff=Math.atan2(p.x-oldX,p.z-oldZ)-oldYaw;p.yaw+=Math.atan2(Math.sin(diff),Math.cos(diff))*-Math.expm1(-14*dt);}
      p.y=ground(p.x,p.z);this.motion.step(dt,travel,(p.yaw-oldYaw)/Math.max(.0001,dt));
    }
    walk(dt,ground){
      return BayCarAccess.walkPath(this.mara,this.motion,this.path,dt,ground);
    }
    pose(dt,ground){
      BayCarAccess.pose(this.ride,1,this.progress,this.mara,this.motion,ground,dt,true);
      const r=this.motion.ride;
      this.shutterHold=Math.max(0,(this.shutterHold||0)-dt);
      const raised=this.progress===1&&(this.finder||this.onApproach||this.shutterHold>0);
      r.windowLift=(r.windowLift||0)+((raised?1:0)-(r.windowLift||0))*-Math.expm1(-7*dt);
      r.windowPan=this.finder?.pan||0;r.windowTilt=this.finder?.tilt||0;
      if(this.passAge){const reach=Math.sin(Math.PI*Math.min(1,this.passAge/relayDuration));
        r.coverArm={x:.43+.39*reach,y:bayCarLayout(this.ride.kind).glass[4]+.19,z:.13,weight:Math.min(1,reach*3)};
      }else r.coverArm=null;
    }
    step(dt,car,transfer,doorPlan,ground){
      if(this.field)return this.fieldStep(dt,ground);
      if(this.phase==="pickup"){
        this.motion.step(dt,0,0);
        if(!car||transfer||!stopped(car)||distance(car,this.mara)>8.5)return;
        const plan=doorPlan(car,false,this.mara,1);if(!plan)return;
        this.ride=car;this.path=plan.points;this.phase="approach";
      }else if(this.phase==="approach"){
        if(this.walk(dt,ground))this.phase="board";
      }else if(this.phase==="board"||this.phase==="exit"){
        const entering=this.phase==="board";
        this.progress=Math.max(0,Math.min(1,this.progress+(entering?1:-1)*dt/1.5));this.pose(dt,ground);
        if(entering&&this.progress===1){this.phase="port";return "boarded";}
        if(!entering&&this.progress===0){this.motion.reset();this.phase="handoff";}
      }else if(this.phase==="handoff"){
        if(this.walk(dt,ground)){this.phase="done";return "complete";}
      }else if(this.phase!=="done"){
        this.pose(dt,ground);
        if(this.phase==="port"&&this.photoRoad&&this.ride===car){
          const road=photoRuns[this.photoRoad];
          if(distance(car,dock)<20)this.markRoad("");
          else if(!this.onApproach&&Math.abs(car.x-road.lead.x)<7&&car.z>=road.lead.z-8&&car.z<=road.frame.z+4&&Math.cos(car.yaw)>.6){
            this.onApproach=true;return "approaching-frame";
          }else if(this.onApproach&&(car.z>road.frame.z+22||distance(car,road.frame)>66)){
            this.onApproach=false;return "missed-frame";
          }
        }
        if(this.phase==="port"&&!this.remarked&&distance(this.ride,dock)<53){
          this.remarked=true;return "docks";
        }
        if(this.phase!=="delivery")return;
        if(this.route==="live"&&!this.pressMPH){
          this.remaining=Math.max(0,this.remaining-dt);
          if(!this.remaining){this.route="print";this.passAge=0;this.trackPress=false;return "late";}
          if(this.passAge)return this.advancePass(dt,car,transfer);
        }
        const drop=routes[this.route];
        if(car!==this.ride||transfer||!stopped(car)||distance(car,drop)>7.5)return;
        const plan=doorPlan(car,false,drop.stand,1);if(!plan)return;
        this.path=plan.points.slice(0,-1).reverse().concat(drop.stand);this.phase="exit";
      }
    }
  }
  window.BayExposure={job,dock,pickup,routes,props,liveTime,photoRuns,pressSpeed,Run,CoachTape,questions,readBed,readInterview,interviewCopy};
})();
