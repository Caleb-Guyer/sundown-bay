/* The ticket belongs to a particular car. Tess and the player take turns working the same stand. */
(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),pt=(x,z)=>({x,z});
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const cast=[
    {id:"ruth",name:"Ruth Hsu",kind:"hatch",color:"#a996bc",paint:"lilac hatch",plate:"NEEDLE",pay:70,home:pt(138.85,-5.4),room:pt(131.1,-25.1),
      arrival:"Mind the dress bag in back. That hem took my whole morning.",claim:"Lilac hatch. You can tell it’s mine by the spool on the mirror.",thanks:"Still on the hanger. You’ve saved me an hour with an iron."},
    {id:"des",name:"Des Owens",kind:"coupe",color:"#76af9d",paint:"seafoam coupe",plate:"SIDE B",pay:80,home:pt(138.85,40.5),room:pt(131.1,-40.5),
      arrival:"I’m dropping a test pressing at room eleven. Shady spot if you’ve got one.",claim:"Mine’s SIDE B. I used to flip records at Luna on Friday nights.",thanks:"Needle didn’t skip once. Come hear us at the wheel sometime."},
    {id:"viv",name:"Viv Morrow",kind:"van",color:"#c99550",paint:"amber van",plate:"LOWTIDE",pay:85,home:pt(138.85,105.8),room:pt(131.1,-46.2),
      arrival:"Easy on the brakes. The shells in that crate are older than the motel.",claim:"Amber van, LOWTIDE. I’ve got to beat the water back out.",thanks:"Every shell still has both halves. Keep the change."}
  ];
  function read(data){
    const visits={},tips={};
    for(const g of cast){
      visits[g.id]=Number.isSafeInteger(data?.visits?.[g.id])?Math.max(0,Math.min(999999,data.visits[g.id])):0;
      tips[g.id]=Number.isSafeInteger(data?.tips?.[g.id])?Math.max(0,Math.min(45,data.tips[g.id])):0;
    }
    return {visits,tips};
  }
  function actor(id,point,phase){
    return {...point,id,y:.077,yaw:point.yaw??Math.PI,phase,age:0,exchange:0,side:-1,seat:0,path:[],motion:new BayPlayerMotion()};
  }
  function phase(a,value){a.phase=value;a.age=0;a.exchange=0;}
  function stopped(v){return Math.max(Math.abs(v.speed||0),Math.hypot(v.vx||0,v.vz||0))<.82;}
  function alignment(v,b){return Math.abs(Math.cos(v.yaw-b.yaw));}
  function parked(v,b,curb=false){
    return Math.abs(v.x-b.x)<(curb?1.5:1.22)&&Math.abs(v.z-b.z)<(curb?2.85:1.73)&&alignment(v,b)>(curb?.87:.85)&&stopped(v);
  }
  function damage(v){return Object.values(v.damage||{}).reduce((n,d)=>n+(Number.isFinite(d)?d:0),0)+(v.flatSide?1:0);}
  // A rounded corner has a tangent at each end. The same points drive steering, wheels and signals.
  function bend(prev,corner,next,radius,out){
    const before=gap(prev,corner),after=gap(corner,next);
    if(before<.1||after<.1){out.push(corner);return;}
    const r=Math.min(radius,before*.43,after*.43);
    const a=pt(corner.x+(prev.x-corner.x)*r/before,corner.z+(prev.z-corner.z)*r/before);
    const b=pt(corner.x+(next.x-corner.x)*r/after,corner.z+(next.z-corner.z)*r/after);
    for(let i=0;i<=5;i++){const f=i/5,j=1-f;out.push(pt(j*j*a.x+2*f*j*corner.x+f*f*b.x,j*j*a.z+2*f*j*corner.z+f*f*b.z));}
  }
  function nearestLeg(v,path){
    let best=Infinity,leg=0;
    for(let i=0;i<path.length;i++){
      const a=path[(i+path.length-1)%path.length],b=path[i],dx=b.x-a.x,dz=b.z-a.z;
      const f=Math.min(1,Math.max(0,((v.x-a.x)*dx+(v.z-a.z)*dz)/(dx*dx+dz*dz||1)));
      const distance=Math.hypot(v.x-a.x-f*dx,v.z-a.z-f*dz);
      if(distance<best){best=distance;leg=i;}
    }
    return leg;
  }
  function roundLoop(v){
    const p=v.path,rounded=[];
    for(let i=0;i<p.length;i++)bend(p[(i+3)%4],p[i],p[(i+1)%4],5.2,rounded);
    v.path=rounded;v.corner=nearestLeg(v,rounded);
  }
  function signal(v){
    const p=v.path;if(!p||p.length<2||v.z>180)return 0;
    let a=v,length=0;
    for(let n=0;n<Math.min(p.length,12);n++){
      const i=(v.corner+n)%p.length,b=p[i],d=gap(a,b);
      if(d>.03){
        const delta=turn(v.yaw,Math.atan2(b.x-a.x,b.z-a.z));
        if(Math.abs(delta)>.27&&Math.abs(delta)<2.25)return Math.sign(delta);
        length+=d;if(length>12)break;
      }
      if(v.finiteRoute&&i===p.length-1)break;a=b;
    }
    return 0;
  }
  function road(v,end,fromDir,pace){
    const route=BayCab.route({...v,dir:fromDir},end);
    v.path=route.pts;v.corner=1;v.pace=pace;v.finiteRoute=true;v.finiteYaw=end.dir*Math.PI/2;v.blocked=v.wait=0;v.wantsCurb=false;v.pullOver=v.reaction=null;
  }
  const claimSpot=i=>pt(136.25,-21.6-i*1.85);
  function walkTo(a,dest,v,env){
    a.path=env.walkway(a,dest,v)||[];return a.path.length>0||gap(a,dest)<.28;
  }
  function move(a,dt,env,speed=1.88){return BayCarAccess.walkPath(a,a.motion,a.path,dt,env.ground,speed);}
  function open(a,v,inward,dt,env){
    a.seat=Math.max(0,Math.min(1,a.seat+(inward?dt/1.45:-dt/1.48)));
    BayCarAccess.pose(v,a.side,a.seat,a,a.motion,env.ground,dt);
    if(inward?a.seat<1:a.seat>0)return false;
    v.doorAngle=0;if(!inward)a.motion.reset();return true;
  }
  function face(a,b,dt){a.yaw+=turn(a.yaw,Math.atan2(b.x-a.x,b.z-a.z))*Math.min(1,dt*8);}
  function lotPath(v,points,reverse=false){
    const line=[pt(v.x,v.z),...points],path=[];
    for(let i=1;i<line.length-1;i++)bend(line[i-1],line[i],line[i+1],3.6,path);
    path.push(line.at(-1));return {path,reverse};
  }
  function lotDrive(v,leg,dt,env){
    const b=leg.path[0];if(!b)return true;
    const d=gap(v,b);if(d<.075){leg.path.shift();return !leg.path.length;}
    const dx=(b.x-v.x)/d,dz=(b.z-v.z)/d;
    const speed=Math.min(leg.reverse?2.6:5.3,leg.path.length===1?Math.max(.55,d*1.9):5.3);
    const yaw=Math.atan2(dx,dz)+(leg.reverse?Math.PI:0);
    const nextYaw=v.yaw+turn(v.yaw,yaw)*Math.min(1,dt*5);
    const step=Math.min(d,dt*Math.min(speed,Math.abs(v.speed)+dt*3.4));
    const x=v.x+dx*step,z=v.z+dz*step;
    if(!env.clear(v,x,z,nextYaw)){BayDriving.settle(v);v.brakes=1;return false;}
    v.steer=Math.max(-.6,Math.min(.6,turn(v.yaw,yaw)))*(leg.reverse?-1:1);v.yaw=nextYaw;
    v.x=x;v.z=z;v.speed=step/dt*(leg.reverse?-1:1);v.vx=dx*step/dt;v.vz=dz*step/dt;
    v.reversing=leg.reverse;v.brakes=+(leg.path.length===1&&d<2);return false;
  }
  class Service{
    constructor(addCar,memory){
      this.places=BayValetPlaces;this.memory=memory;this.slots=[null,null,null];this.onDuty=false;this.order=0;this.focus=null;this.staffJob=null;
      this.staff=actor("tess",this.places.keeper,"watch");
      this.guests=cast.map((c,i)=>{
        const v=addCar(c.kind,c.color,c.home.x,c.home.z,Math.PI);
        Object.assign(v,{guestId:c.id,plate:c.plate});
        return Object.assign(actor(c.id,c.home,"drive"),{...c,car:v,seat:1,stage:"home",due:[.35,14,32][i],tagged:false,ready:false,slot:-1});
      });
    }
    atStand(p){return gap(p,this.places.desk)<2.95;}
    accessible(v){return !v.guestId||this.onDuty&&this.focus?.car===v&&["park","fetch","deliver"].includes(this.focus.stage);}
    clockIn(){this.onDuty=true;for(const g of this.guests)if(g.stage==="home")g.due=Math.min(g.due,2+this.guests.indexOf(g)*4);}
    clockOut(){
      this.onDuty=false;if(this.focus)this.focus.player=false;
      this.focus=null;for(const g of this.guests)g.player=false;
    }
    berthBusy(ignore){
      return this.guests.some(g=>g!==ignore&&(["incoming","intake","fetch","deliver","handoff","receiving","boarding"].includes(g.stage)||g.stage!=="home"&&gap(g.car,this.places.berth)<6));
    }
    offer(){
      const arrival=this.guests.find(g=>g.stage==="intake"&&g.phase==="curb"&&!g.worker);
      if(arrival)return arrival;
      return this.guests.find(g=>g.stage==="stored"&&g.ready&&!g.worker&&!this.berthBusy(g))||null;
    }
    start(g,player,env){
      g.player=player;g.worker=player?"player":"tess";g.clock=0;g.handPath=null;
      if(player)this.focus=g;else this.staffJob=g;
      if(g.stage==="intake"){
        g.stage="issue";phase(g,"give");g.initialDamage=damage(g.car);g.condition=1;
        if(player)env.line(g,g.arrival);
      }else{
        g.tagged=false;g.stage="fetch";phase(g,"ask");
        if(player)env.line(g,g.claim);
      }
    }
    hang(g,env){
      g.stage="stored";g.tagged=true;g.worker=null;
      if(this.focus===g)this.focus=null;
      if(g.player)env.note("Tag "+this.places.stalls[g.slot].id+" on the hook",g.name+"’s "+g.paint+" is checked in.");
    }
    giveBack(g){g.stage="receiving";g.handPath=null;phase(g,"receive");}
    act(hero,env){
      if(!this.onDuty)return false;
      const g=this.focus;
      if(!g){
        const next=this.offer();
        if(next&&(this.atStand(hero)||gap(hero,next)<2.5)){this.start(next,true,env);return true;}
        return false;
      }
      if(g.stage==="hang"&&this.atStand(hero)){this.hang(g,env);return true;}
      if(g.stage==="deliver"&&parked(g.car,this.places.berth,true)&&gap(hero,g)<2.9){this.giveBack(g);return true;}
      return false;
    }
    leftCar(v,env){
      const g=this.focus;if(!this.onDuty||!g||g.car!==v)return;
      if(g.stage==="park"&&parked(v,this.places.stalls[g.slot])){
        const b=this.places.stalls[g.slot];g.condition=Math.max(0,1-(Math.abs(v.x-b.x)*.32+Math.abs(v.z-b.z)*.12+(1-alignment(v,b))*1.5));
        g.stage="hang";env.note("Bay "+b.id,"Take the key back to the hooks at Tess’s stand.");
      }else if(g.stage==="park")env.note("Tag "+this.places.stalls[g.slot].id,"Park between this bay’s stripes and come to a stop.");
    }
    target(driver){
      const g=this.focus,b=this.places.berth,desk=this.places.desk;
      const pin=(p,name)=>({x:p.x,z:p.z,name,kind:"valet"});
      if(!g){const next=this.offer();return pin(next||desk,next?next.name+" · claim check":"Tess’s key stand");}
      const spot=this.places.stalls[g.slot];
      if(g.stage==="park")return driver===g.car?pin(spot,"Bay "+spot.id):pin(g.car,g.paint+" · "+g.plate);
      if(g.stage==="hang")return pin(desk,"Key hook "+spot.id);
      if(g.stage==="fetch")return pin(g.car,"Bay "+spot.id+" · "+g.plate);
      if(g.stage==="deliver"&&(driver||!parked(g.car,b,true)))return driver===g.car?pin(b,"Marlin loading curb"):pin(g.car,g.paint+" · "+g.plate);
      return pin(g,g.name);
    }
    instruction(driver){
      const g=this.focus;
      if(!g){const next=this.offer();return next?(next.ready?"Take the claim check from ":"Meet ")+next.name:"Watch the loading curb with Tess";}
      const b=this.places.stalls[g.slot].id;
      switch(g.stage){
        case "issue":return "Take the key from "+g.name;
        case "park":return driver===g.car?"Park between the stripes in bay "+b:"Get into the "+g.paint+" · "+g.plate;
        case "hang":return "Hang the "+b+" key at the stand";
        case "fetch":return "Collect "+g.plate+" from bay "+b;
        case "deliver":return driver||!parked(g.car,this.places.berth,true)?"Bring "+g.plate+" alongside the loading curb":"Hand the key back to "+g.name;
        default:return g.name+" is taking the wheel";
      }
    }
    staffStep(dt,env){
      const a=this.staff;
      if(!this.staffJob){
        const inherited=this.guests.find(g=>g.worker==="player"&&!g.player&&!env.held(g.car)&&!["receiving","boarding","issue"].includes(g.stage));
        const meet=!this.onDuty&&this.offer();
        if(inherited){this.staffJob=inherited;inherited.worker="tess";phase(a,"watch");}
        else if(meet&&meet.age>(meet.ready?3:9)){this.start(meet,false,env);phase(a,"watch");a.path=[];}
        else {
          if(gap(a,this.places.keeper)>.22){if(!a.path.length)walkTo(a,this.places.keeper,null,env);a.phase="walk";move(a,dt,env);}
          else {a.phase="watch";a.yaw=this.places.keeper.yaw;a.motion.step(dt,0,0);}return;
        }
      }
      const g=this.staffJob,v=g.car,b=this.places.stalls[g.slot];
      if(!b||!g.worker||g.stage==="leaving"||g.stage==="home"){this.staffJob=null;a.path=[];return;}
      if(env.held(v))return;
      if(g.stage==="issue"||g.stage==="receiving"||g.stage==="boarding"){a.motion.step(dt,0,0);face(a,g,dt);return;}
      if(g.stage==="hang"||g.stage==="handoff"){
        const dest=g.stage==="hang"?this.places.desk:g;
        if(gap(a,dest)>1.35){if(!a.path.length)walkTo(a,dest,v,env);a.phase="walk";move(a,dt,env);return;}
        if(g.stage==="hang"){this.hang(g,env);this.staffJob=null;}else this.giveBack(g);
        phase(a,"watch");a.path=[];return;
      }
      if(!["park","fetch","deliver"].includes(g.stage))return;
      if(!a.ride){
        if(a.phase!=="in"){
          if(gap(a,v)>3.25){if(!a.path.length)walkTo(a,BayDriving.world(v,2.10,-.35),v,env);a.phase="walk";move(a,dt,env);return;}
          if(a.phase!=="return"){const plan=env.door(v,false,a);if(!plan)return;a.side=plan.side;a.path=plan.points;phase(a,"return");}
          if(!move(a,dt,env))return;phase(a,"in");a.seat=0;
        }
        if(!open(a,v,true,dt,env))return;
        a.ride=v;phase(a,"drive");g.autoLegs=env.lotLegs(v,b,g.stage==="park");if(g.stage==="fetch")g.stage="deliver";
      }
      if(a.phase==="drive"){
        if(g.autoLegs.length&&!lotDrive(v,g.autoLegs[0],dt,env))return;
        if(g.autoLegs.shift()){BayDriving.settle(v);if(g.autoLegs.length)return;}
        const plan=env.door(v,true,a);if(!plan)return;a.side=plan.side;phase(a,"out");
      }
      if(!open(a,v,false,dt,env))return;
      a.ride=null;a.path=[];phase(a,"walk");g.stage=g.stage==="park"?"hang":"handoff";
    }
    finish(g,env){
      if(g.player&&this.onDuty){
        const tip=Math.round(Math.max(0,Math.min(45,17*g.condition+Math.max(0,28-Math.max(0,g.clock-15)*.33)-Math.max(0,damage(g.car)-g.initialDamage)*45)));
        this.memory.visits[g.id]++;this.memory.tips[g.id]=Math.max(tip,this.memory.tips[g.id]);env.pay(g,tip);
      }
      if(this.focus===g)this.focus=null;if(this.staffJob===g)this.staffJob=null;
      this.slots[g.slot]=null;g.slot=-1;g.ready=false;g.player=false;g.worker=null;g.tagged=false;
      g.stage="leaving";phase(g,"drive");const dir=Math.cos(g.car.yaw)<0?2:0;
      road(g.car,{...g.home,dir:2},dir,8.2);
    }
    step(dt,env){
      const desk=this.places.desk;
      for(const g of this.guests){
        const v=g.car;g.age+=dt;if(g.worker)g.clock+=dt;
        if(g.stage==="home"){
          g.due-=dt;
          if(g.due<=0&&!this.berthBusy(g)&&this.slots.includes(null)&&!this.guests.some(q=>q!==g&&q.ready&&q.stage==="stored")){
            for(let i=0;i<3;i++){const slot=(this.order+i)%3;if(!this.slots[slot]){g.slot=slot;this.order=(slot+1)%3;break;}}
            this.slots[g.slot]=g;g.stage="incoming";g.seat=1;phase(g,"arrive");road(v,this.places.berth,2,6.5);
          }continue;
        }
        if(g.stage==="incoming"||g.stage==="leaving"){
          if(v.path)continue;
          if(g.stage==="leaving"){g.stage="home";g.due=47+this.guests.indexOf(g)*8;continue;}
          const plan=env.door(v,true,g,1)||env.door(v,true,g,-1);if(!plan)continue;
          g.stage="intake";g.side=plan.side;phase(g,"out");
        }
        if(g.phase==="out"){
          if(!open(g,v,false,dt,env))continue;
          phase(g,"walk");walkTo(g,claimSpot(g.slot),v,env);g.destination="arrive";
        }
        if(g.phase==="walk"){
          if(!move(g,dt,env))continue;
          if(g.destination==="arrive"){phase(g,"curb");g.yaw=-Math.PI/2;}
          else if(g.destination==="visit"){phase(g,"visit");g.yaw=-Math.PI/2;}
          else {g.ready=true;phase(g,"ask");g.yaw=-Math.PI/2;}
        }
        if(g.stage==="issue"){
          const recipient=g.player?env.hero:this.staff;face(g,recipient,dt);
          if(env.exchange(g,recipient,dt))g.exchange=Math.min(1,g.exchange+dt/1.08);
          if(g.exchange===1){
            g.stage="park";g.visitTime=11+this.guests.indexOf(g)*3;phase(g,"walk");g.destination="visit";walkTo(g,g.room,v,env);
          }
        }else if(g.phase==="visit"){
          if((g.visitTime-=dt)<=0&&g.tagged){phase(g,"walk");g.destination="claim";walkTo(g,claimSpot(g.slot),v,env);}
        }else if(g.stage==="fetch"&&env.driver()===v)g.stage="deliver";
        else if(g.stage==="receiving"){
          const recipient=g.player?env.hero:this.staff;face(g,recipient,dt);
          if(env.exchange(g,recipient,dt))g.exchange=Math.min(1,g.exchange+dt/1.02);
          if(g.exchange===1){const plan=env.door(v,false,g);if(!plan)continue;g.stage="boarding";g.side=plan.side;g.path=plan.points;phase(g,"return");}
        }else if(g.stage==="boarding"){
          if(g.phase==="return"){if(!move(g,dt,env))continue;phase(g,"in");}
          if(open(g,v,true,dt,env)){this.finish(g,env);continue;}
        }
        if(["curb","ask","visit","give","receive"].includes(g.phase)){g.motion.step(dt,0,0);if(g.phase==="curb")face(g,desk,dt);}
      }
      this.staff.age+=dt;this.staffStep(dt,env);
    }
  }
  window.BayMotorCourt={Service,read,parked,cast,actor,phase,move,open,walkTo,lotPath,roundLoop,nearestLeg,signal};
})();
