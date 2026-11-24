/* Two motorcycles from the Ocean Drive shop, a visiting rider, and Inés's photo runs. */
(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),damp=(a,b,k,dt)=>a+(b-a)*-Math.expm1(-k*dt);
  const face=(x,z,dir)=>({x,z,dir,yaw:dir*Math.PI/2});
  const briefs=[
    {id:"wheel",title:"Eight seats over the bay",place:"North Boardwalk",curb:face(149.05,104,0),subject:{x:181.5,y:13.55,z:112.5},
      left:{x:181.5,y:13.55,z:101.8},right:{x:181.5,y:13.55,z:123.2},lower:2.1,upper:24.6,pay:110,
      ask:"My dad always took the red car. Give me the whole wheel. Catch his car up high and I'll hang that one in the window.",arrival:"That's our corner. The red cabin is the one to watch.",credit:"Coast Wheel, North Boardwalk"},
    {id:"marlin",title:"The fish on Ocean Drive",place:"Marlin Motel",curb:face(138.96,13,2),subject:{x:132.45,y:6.95,z:-11.15},
      left:{x:129.85,y:7.15,z:-11.15},right:{x:135.05,y:7.15,z:-11.15},lower:4.75,upper:9.45,pay:105,
      ask:"Vera keeps that fish swimming. I want its bill and tail in the same frame, with Ocean Drive behind it.",arrival:"See the fish above the vacancy sign? Leave a little sky over its fin.",credit:"Marlin neon, Ocean Drive"},
    {id:"luna",title:"Before the house lights",place:"Cine Luna",curb:face(-5.13,44,2),subject:{x:12.4,y:6.7,z:44},
      left:{x:12.25,y:3.55,z:51.8},right:{x:12.25,y:3.55,z:36.2},lower:3.0,upper:11.3,pay:140,
      ask:"My aunt sold tickets at Luna. Take the marquee from across the street. A passing car makes it look like Saturday again.",arrival:"That long gold canopy. Come back with the whole thing on the negative.",credit:"Cine Luna, Neon Mile"}
  ];
  const find=id=>briefs.find(c=>c.id===id),kinds=["paloma","heron"];
  const handling={paloma:{top:21.5,power:6.3,brake:10.9,grip:8.6,steer:.65,lean:.53,drag:.0099},heron:{top:38.4,power:10.6,brake:14.8,grip:11.4,steer:.61,lean:.70,drag:.0038}};
  function read(raw){
    const count={},best={},parked={};
    for(const c of briefs){count[c.id]=Number.isSafeInteger(raw?.count?.[c.id])?clamp(raw.count[c.id],0,99999):0;
      best[c.id]=Number.isSafeInteger(raw?.best?.[c.id])?clamp(raw.best[c.id],0,100):0;}
    for(const k of kinds){const p=raw?.parked?.[k];if(p&&Number.isFinite(p.x)&&Number.isFinite(p.z)&&Number.isFinite(p.yaw)&&
      p.x>=-184&&p.x<=210&&p.z>=-182&&p.z<=405)parked[k]={x:p.x,z:p.z,yaw:p.yaw};}
    return {count,best,parked,last:typeof raw?.last==="string"?raw.last.slice(0,60):"",distance:Number.isFinite(raw?.distance)?clamp(raw.distance,0,1e9):0};
  }
  function motorcycle(kind,start,id=kind){
    const s=BayMotorcyclesArt.specs[kind];return {...start,kind,id,name:s.name,footprint:s.footprint,color:id==="remy"?"#76a186":s.paint,
      y:0,speed:0,vx:0,vz:0,yawRate:0,lean:0,pitch:0,steer:0,stand:1,wheelSpin:0,gear:1,rpm:.08,brakes:0,throttle:0,indicator:0,impact:0,pass:0,mount:0};
  }
  const local=(role,name,p)=>({...p,name,role,motion:new BayPlayerMotion(),yaw:p.yaw||0,y:p.y||.077,chair:null,path:[],action:"idle"});
  function settle(b){b.speed=b.vx=b.vz=b.yawRate=b.throttle=0;b.brakes=1;}
  function runGear(b,dt,pace,load){
    const scooter=b.kind==="paloma",gears=scooter?[21.5]:[7.0,13.5,21.1,29.8,39];
    let g=b.gear||1;b.shift=Math.max(0,(b.shift||0)-dt);
    if(!b.shift&&g<gears.length&&pace>gears[g-1]*.94){g++;b.shift=.16;}
    else if(!b.shift&&g>1&&pace<gears[g-2]*.72){g--;b.shift=.11;}
    b.gear=g;b.rpm=damp(b.rpm,scooter?.18+load*.32+pace/21.5*.42:.14+clamp(pace/gears[g-1],0,1)*.73+load*.11,7,dt);
  }
  function suspension(b,dt,oldSpeed,env){
    const s=BayMotorcyclesArt.specs[b.kind],front=BayDriving.world(b,0,s.axles[1]),rear=BayDriving.world(b,0,s.axles[0]);
    const f=env.floor(front.x,front.z),r=env.floor(rear.x,rear.z),a=(b.speed-oldSpeed)/dt;
    b.grade=Math.atan2(f-r,s.wheelbase);b.y=damp(b.y,(f+r)*.5,24,dt);b.pitch=damp(b.pitch,clamp(b.grade+a*.0048,-.22,.22),8,dt);
    b.wheelSpin+=b.speed*dt/s.radii[1];b.impact=Math.max(0,b.impact-dt);runGear(b,dt,Math.abs(b.speed),b.throttle);
  }
  function ride(b,dt,input,env,partner){
    const h=handling[b.kind],s=BayMotorcyclesArt.specs[b.kind],old=b.speed,n=Math.abs(old),grip=env.grip(b),g=h.grip*grip;
    const gas=input.gas?1:0,brake=input.brake||input.rear?1:0,wheel=b.kind==="paloma"?.95:1;
    b.throttle=damp(b.throttle,gas,gas?7:11,dt);b.brakes=damp(b.brakes,brake,12,dt);
    const pushBack=input.brake&&!input.rear&&!gas&&n<1.35;
    b.reverseHold=pushBack?(b.reverseHold||0)+dt:0;
    const reversing=b.reverseHold>.38&&old<.15,top=h.top*(.63+.37*grip);
    let accel=b.throttle*h.power*(1-.79*clamp(n/top,0,1))*(b.shift>0?.47:1)*(partner?.89:1);
    if(reversing)accel=-2.15*(1-clamp(-old/1.05,0,1));
    else if(old>0)accel-=Math.min(old/dt,(input.rear?h.brake*.58:h.brake)*b.brakes*Math.max(.55,grip)+.28+h.drag*n*n);
    else if(old<0)accel+=Math.min(-old/dt,2.6+(gas?4.3:0));
    if(gas||n>.2)accel-=9.81*Math.sin(b.grade||0);
    b.speed=clamp(old+accel*dt,-1.1,top);
    const bar=h.steer/(1+.075*n+.0013*n*n),lock=clamp(input.steer,-1,1);
    b.steer=damp(b.steer,bar*lock,7.2,dt);
    const yawRate=clamp(b.speed*Math.tan(b.steer)/s.wheelbase,-g/Math.max(2.4,n),g/Math.max(2.4,n));
    b.yawRate=damp(b.yawRate,yawRate*(input.rear?1.24:1),5.4/wheel,dt);
    const yaw=b.yaw+b.yawRate*dt,lean=clamp(Math.atan2(b.speed*b.yawRate,9.81),-h.lean,h.lean);
    b.lean=damp(b.lean,lean,5.0,dt);
    const sn=Math.sin(yaw),cs=Math.cos(yaw),gripRate=input.rear?4.3:9.7*grip;
    b.vx=damp(b.vx,sn*b.speed,gripRate,dt);b.vz=damp(b.vz,cs*b.speed,gripRate,dt);
    const q={x:b.x+b.vx*dt,z:b.z+b.vz*dt,yaw,kind:b.kind,footprint:b.footprint},hit=env.obstacle(b,q);
    if(hit){if(!b.impact&&n>4)env.bump(b,hit,n);b.impact=.55;settle(b);b.lean=damp(b.lean,0,8,dt);}
    else{b.x=q.x;b.z=q.z;b.yaw=yaw;}
    suspension(b,dt,old,env);return gap(q,b)<.01?n*dt:0;
  }
  function automatic(b,route,dt,env,waiting=false){
    const line=route.line,at=route.at,remaining=line.length-at,f=line.sample(at),next=line.sample(at+7.5),old=b.speed;
    const curve=Math.abs(turn(f.yaw,next.yaw));
    const ahead=line.sample(at+5.5),shift=env.ahead(b,ahead,f.yaw);
    route.hold=Math.max(0,(route.hold||0)-dt);
    const side=remaining<2.0?0:route.hold?route.pass:shift;
    const offset=damp(route.offset||0,side,2.7,dt);
    const red=env.signal(b,f.yaw),pace=Math.min(b.id==="remy"?9.8:12.0,curve>.38?6.4:14,Math.max(.55,Math.sqrt(6.4*remaining)),red);
    const speed=damp(Math.max(0,b.speed),waiting?0:pace,waiting||pace<old?3.7:1.35,dt),to=Math.min(line.length,at+speed*dt);
    const aim=line.sample(to),yaw=b.yaw+turn(b.yaw,aim.yaw)*Math.min(1,dt*7.0);
    const q={x:aim.x+Math.cos(aim.yaw)*offset,z:aim.z-Math.sin(aim.yaw)*offset,yaw,kind:b.kind,footprint:b.footprint};
    if(!env.obstacle(b,q)){
      const d=gap(b,q);b.yawRate=turn(b.yaw,yaw)/dt;b.vx=(q.x-b.x)/dt;b.vz=(q.z-b.z)/dt;
      b.lean=damp(b.lean,clamp(Math.atan2(speed*b.yawRate,9.81),-.52,.52),6,dt);
      b.steer=damp(b.steer,clamp(Math.atan2(b.yawRate*BayMotorcyclesArt.specs[b.kind].wheelbase,Math.max(2,speed)),-.55,.55),8,dt);
      Object.assign(b,q,{speed});b.brakes=waiting||pace<old-.15?1:0;b.throttle=pace>old?.78:.21;route.at=to;route.offset=offset;route.blocked=0;
      if(d>0)b.stand=0;
    }else{
      route.blocked=(route.blocked||0)+dt;settle(b);
      if(remaining<2.1&&gap(b,route.end)<2.25&&route.blocked>.55)return true;
      if(route.blocked>.18){
        const prior=route.offset||0,sign=Math.sign(route.hold?route.pass:prior||shift)||1;
        for(const edge of [3.25*sign,-3.25*sign,4.8*sign,-4.8*sign]){
          const lateral=prior+clamp(edge-prior,-dt*1.65,dt*1.65);
          const p={...q,x:f.x+Math.cos(f.yaw)*lateral,z:f.z-Math.sin(f.yaw)*lateral,yaw:b.yaw};
          if(Math.abs(edge-prior)<.025||env.obstacle(b,p))continue;
          b.x=p.x;b.z=p.z;route.offset=lateral;route.pass=edge;route.hold=2.45;break;
        }
      }
    }
    suspension(b,dt,old,env);return route.at>=line.length-.035;
  }
  const street=p=>({...p,dir:p.dir??((Math.round((p.yaw||0)/(Math.PI/2))+4)%4)});
  // Short turnarounds on Ocean Drive let a bike change lanes without circling an entire city block.
  function oceanLeg(start,end){
    if([start,end].some(p=>Math.abs(p.x-144)>6.1||Math.abs(p.z)>146||p.dir%2))return null;
    const dir=(Math.abs(end.z-start.z)>13?Math.sign(end.z-start.z):end.dir===0?1:-1);
    const depart=start.dir===0?1:-1,arrive=end.dir===0?1:-1,x=144+2.48*dir,points=[start];
    function merge(a,b,oldHeading,newHeading){
      const span=Math.min(7,Math.max(3.2,Math.abs(b.z-a.z)*.45));
      for(let i=1;i<=9;i++){const u=i/9,v=1-u;
        points.push({x:(v*v*v+3*v*v*u)*a.x+(3*v*u*u+u*u*u)*b.x,
          z:v*v*v*a.z+3*v*v*u*(a.z+oldHeading*span)+3*v*u*u*(b.z-newHeading*span)+u*u*u*b.z});
      }
    }
    if(depart!==arrive&&Math.abs(end.z-start.z)<14){merge(start,end,depart,arrive);return points;}
    const join={x,z:start.z+dir*(depart===dir?4.2:1.0)};
    const approach={x,z:end.z-(arrive===dir?4.9:7.4)*arrive};
    merge(start,join,depart,dir);points.push(approach);merge(approach,end,dir,arrive);return points;
  }
  function autoRoute(b,target,env,slot){
    const site=env.site,home=slot&&site.stalls[slot]||slot==="guest"&&site.guestStall;
    const depart=["paloma","heron","guest"].find(k=>gap(b,k==="guest"?site.guestStall:site.stalls[k])<3.3);
    const finish=home&&gap(home,target)<.2,exit=depart?site.apron.out[depart]:[],entry=finish?site.apron.in[slot]:[];
    let approach=exit,from=exit.length?{...exit.at(-1),dir:site.exitRoad.dir}:env.road(b);
    if(!from){
      const trail=(b.trail||[]).slice().reverse(),open=trail.findIndex(p=>env.road(p));
      if(open>=0){approach=trail.slice(0,open+1);from=env.road(approach.at(-1));}
    }
    const end=entry.length?site.entryRoad:street(target),a=from&&street(from),z=street(end);
    const streetPoints=a?(oceanLeg(a,z)||BayCab.route(a,z).pts):[];
    const line=BayCab.track([b,...approach,...streetPoints,...entry,target]);
    return {line,at:0,end:target,offset:0,blocked:0};
  }
  class Fleet{
    constructor(site,memory,film){
      this.site=site;this.saved=memory;this.film=film;this.bikes=kinds.map(k=>motorcycle(k,memory.parked[k]||site.stalls[k]));
      this.localBike=motorcycle("paloma",face(146.48,-53,0),"remy");this.all=this.bikes.concat(this.localBike);
      this.ines=local("photographer","Inés Vidal",site.clerk);this.remy=local("local","Remy Price",this.localBike);
      this.player=null;this.actor=null;this.partner=null;this.job=null;this.finder=false;this.cockpit=false;this.pan=this.tilt=0;this.zoom=1.62;
      this.visitor={leg:0,age:0,stage:"road",route:null};
      this.remySeat={a:this.remy,b:this.localBike,seat:"pilot",side:1,mount:1,stage:"ride"};this.localBike.stand=0;this.localBike.mount=1;
    }
    get bike(){return this.player?.b||null;}
    get pilot(){return this.player?.seat==="pilot"&&this.player.stage==="ride";}
    get passenger(){return this.player?.seat==="pillion"&&this.player.stage==="ride";}
    get prints(){return this.film.prints;}
    nearest(p){const use=this.job?[this.job.b]:this.bikes;return use.reduce((a,b)=>gap(a,p)<gap(b,p)?a:b);}
    target(){
      const j=this.job;if(!j)return null;
      if(j.stage==="meet")return {...j.b,name:j.b.name+" · "+(j.role==="pilot"?"handlebars":"back seat")};
      if(j.stage==="lab")return {...this.site.counter,name:"Inés’s film counter"};
      const home=j.stage==="return"||j.stage==="park";
      return {...(home?this.site.stalls[j.b.kind]:j.brief.curb),name:home?this.site.name:j.brief.place+" · camera stop"};
    }
    guide(){
      const j=this.job,b=this.bike,line=j?.route?.line;if(!line||!b||!["out","return"].includes(j.stage))return null;
      const near=line.closest(b);if(near.gap>16)return null;
      const points=[b],left=line.length-near.at;for(let i=5;i<left;i+=8)points.push(line.sample(near.at+i));
      points.push(this.target());return {points,meters:left,turn:left<23?(j.stage==="return"?"Film counter · Park by the striped window":"Look for the marked curb"):j.stage==="return"?"Back to Coast Camera":"To "+j.brief.place};
    }
    offer(hero,photo,role,env){
      if(this.job||this.returning||this.player||this.film.pending||!briefs.includes(photo)||!["pilot","pillion"].includes(role))return false;
      const home=this.bikes.filter(b=>gap(b,this.site.counter)<18),b=home.find(b=>b.kind==="heron")||home[0]||this.nearest(hero);
      this.job={brief:photo,b,role,stage:"meet",swapping:false,route:null,parked:false};
      this.ines.path=(this.site.staffWalk||[this.site.rider]).slice();
      this.ines.action="walk";this.partner=null;this.job.assembling=true;this.lastFocus=null;
      env.say("Inés Vidal",photo.ask);return true;
    }
    mount(a,b,seat,side,env,human=false){
      for(const s of [side,-side]){
        const q=BayMotoRiders.placement(b,seat,s,0,env.floor(b.x,b.z));
        if(!env.foot(q.x,q.z,b))continue;
        const path=env.walkway(a,q,b);if(!path&&gap(a,q)>.30)continue;
        return {a,b,seat,side:s,mount:0,stage:"approach",path:path||[],human};
      }return null;
    }
    board(hero,env){
      if(this.player||this.job?.stage==="lab")return false;const j=this.job,b=j?.b||this.nearest(hero);
      if(this.returning?.b===b||gap(hero,b)>3.0||Math.abs(b.speed)>1.5)return false;
      const seat=j?.role||"pilot",side=j?(seat==="pilot"?-1:1):BayDriving.local(b,hero.x,hero.z).x<0?-1:1;
      const p=this.mount(hero,b,seat,side,env,true);if(!p)return false;this.player=p;this.actor=hero;this.cockpit=false;env.change();return true;
    }
    dismount(env){
      const p=this.player;if(p?.stage!=="ride")return false;
      if(this.passenger&&this.job&&!this.job.parked&&this.bike.speed>1.6){this.job.stop=true;env.say("Inés Vidal","I'll ease off. Press E again when we're stopped.");return true;}
      if(Math.abs(p.b.speed)>1.6)return false;
      if(this.job?.stage==="return"&&gap(p.b,this.site.stalls[p.b.kind])<8)this.parkHome(env);
      return this.down(p,env);
    }
    down(p,env){
      if(!p)return false;if(p.stage==="out")return true;
      if(p.stage!=="ride")return false;
      for(const side of [p.side,-p.side]){
        const q=BayMotoRiders.placement(p.b,p.seat,side,0,env.floor(p.b.x,p.b.z));
        if(env.foot(q.x,q.z,p.b)){p.stage="out";p.side=side;settle(p.b);this.finder=this.cockpit=false;return true;}
      }return false;
    }
    shift(env){
      const j=this.job,p=this.player;
      if(!j||!p||p.stage!=="ride"||this.partner?.stage!=="ride"||j.stage==="lab"||j.swapping)return false;
      if(Math.abs(p.b.speed)>1.6){if(this.passenger)j.stop=true;env.say("Inés Vidal","Bring it to a stop and we'll trade seats.");return true;}
      if(!this.down(p,env))return false;if(!this.down(this.partner,env)){p.stage="ride";return false;}
      j.swapping=true;j.stop=true;this.swapHero=p.a;this.finder=this.cockpit=false;return true;
    }
    seatStep(p,dt,env){
      const {b,a}=p,ground=env.floor(b.x,b.z);
      if(p.stage==="approach"){
        if(!BayCarAccess.walkPath(a,a.motion,p.path,dt,env.floor,p.human?3.2:2.45))return;
        p.stage="in";a.motion.reset();
      }
      if(p.stage==="in"||p.stage==="out"){
        p.mount=clamp(p.mount+(p.stage==="in"?dt:-dt)/1.20,0,1);
        if(p.stage==="in"&&p.mount===1)p.stage="ride";
        else if(p.stage==="out"&&!p.mount)p.stage="foot";
      }
      Object.assign(a,BayMotoRiders.placement(b,p.seat,p.side,p.mount,ground));
      if(p.stage==="foot"){a.y=env.floor(a.x,a.z);a.motion.reset();a.action="idle";return;}
      if(p.stage==="ride")a.action="ride";a.motion.step(dt,0,0);
    }
    pose(p){
      const aims=this.finder&&this.job&&p.seat==="pillion"&&p.stage==="ride";
      return {mount:p.mount,side:p.side,aim:aims?this.aim||0:0,pan:aims?this.pan:0,pitch:aims?this.tilt:0,shutter:(this.flash||0)/.25,
        kit:p.human?this.kit:"street",ground:p.b.y,helmet:true};
    }
    nearPhoto(){const j=this.job;return !!j&&gap(j.b,j.brief.curb)<19&&gap(j.b,j.brief.subject)<57;}
    lens(env){
      if(this.finder){this.finder=false;this.captureRequest=false;env.change();return true;}
      if(!this.job||this.player?.stage!=="ride"||this.partner?.stage!=="ride"||this.job.stage==="lab")return false;
      if(!this.nearPhoto()){env.say("Inés Vidal","I marked the shooting corner on the map. Open the camera as we get there.");return true;}
      const b=this.bike,c=this.job.brief.subject,range=gap(b,c);
      this.aimYaw=Math.atan2(c.x-b.x,c.z-b.z)+.035;this.pan=turn(b.yaw,this.aimYaw);this.tilt=Math.atan2(c.y-b.y-1.40,range)-.025;
      this.zoom=this.job.brief.id==="marlin"?2.3:1.55;this.finder=true;this.cockpit=false;this.aim=0;this.job.stop=true;env.change();return true;
    }
    look(dx,dy){
      if(this.finder){this.aimYaw+=dx;this.pan=turn(this.bike.yaw,this.aimYaw);}
      else this.pan=Math.atan2(Math.sin(this.pan+dx),Math.cos(this.pan+dx));
      this.tilt=clamp(this.tilt+dy,-.75,1.05);
    }
    eye(){
      const p=this.player?.seat==="pillion"?this.player:this.partner,b=this.bike;if(!p||!b)return null;
      const camera=BayMotoRiders.camera(p.a,b,p.seat,b.y,0,{...this.pose(p),aim:1});
      return {x:camera.lens.x,y:camera.lens.y,z:camera.lens.z,yaw:this.aimYaw,pitch:this.tilt,focal:this.zoom};
    }
    accept(record,env){
      if(!this.job||!this.finder)return;this.captureRequest=false;
      if(!record){env.message("Move the subject inside the frame, then press Space.");return;}
      const prev=this.film.pending;
      if(prev&&prev.score>=record.score){env.message("The earlier negative is sharper · "+prev.score+"/100");return;}
      if(!this.film.expose(record)){env.message("The exposure did not take. Press Space for another frame.");return;}
      this.flash=.25;this.finder=false;this.job.stop=false;this.job.stage="return";this.job.parked=false;
      this.setRoute(env);env.say("Inés Vidal","That's one for the window. Let's see what comes up in the tray.");env.change();
    }
    setRoute(env){
      const j=this.job;if(!j||!["out","return"].includes(j.stage))return;
      const home=j.stage==="return",dest=home?this.site.stalls[j.b.kind]:j.brief.curb;
      if(!home&&gap(j.b,dest)<5.5){j.route=null;j.parked=true;settle(j.b);return;}
      j.route=autoRoute(j.b,dest,env,home?j.b.kind:null);j.parked=false;
    }
    parkHome(env){
      const j=this.job;if(!j||j.stage!=="return"||!this.film.pending||gap(j.b,this.site.counter)>15||Math.abs(j.b.speed)>1.6)return false;
      j.stage="lab";j.stop=true;j.parked=true;this.finder=this.cockpit=false;
      if(this.partner)this.down(this.partner,env);
      env.say("Inés Vidal","Bring the exposed roll to my window. I'll get the trays out.");env.change();return true;
    }
    finish(env){
      if(!this.film.pending||this.player||this.job&&this.job.stage!=="lab"||gap(env.hero,this.site.counter)>2.9)return false;
      if(this.partner||gap(this.ines,this.site.clerk)>1.4){env.message("Inés is walking back to the film counter.");return false;}
      if(this.develop>0)return false;this.develop=2.2;this.ines.action="develop";env.change();return true;
    }
    park(b,env){
      if(!kinds.includes(b.id))return;this.saved.parked[b.kind]={x:b.x,z:b.z,yaw:b.yaw};env.save();
    }
    leave(env){
      const j=this.job;if(!j)return;
      this.finder=this.cockpit=this.captureRequest=false;this.job=null;this.develop=0;
      if(this.partner){
        if(this.partner.stage==="approach"){this.partner=null;this.ines.action="walk";}
        else{settle(j.b);this.down(this.partner,env);}
      }
      if(this.player?.seat==="pillion"){
        if(this.player.stage==="approach"){this.player.a.motion.reset();this.player=null;}
        else if(!this.down(this.player,env))this.player.leaveSeat=true;
      }
      this.ines.path=null;this.returning={b:j.b,route:null};env.change();
    }
    drawMap(ctx,opt,px,py,s,visible,t){
      for(const b of this.all){if(visible(px(b.x),py(b.z),2*s))BayMotorcyclesArt.map(ctx,opt,px,py,s,b,t);}
      if(opt.mode!=="street")return;
      for(const [a,p] of [[this.ines,this.partner],[this.remy,this.remySeat],[this.player?.a,this.player]]){
        if(!a||!visible(px(a.x),py(a.z),2*s)||BayCoastCamera.occludesActor(a,opt.player))continue;
        const riding=p&&p.stage!=="approach",opts=riding?this.pose(p):{helmet:false};
        BayMotoRiders.map(ctx,opt,px,py,s,a,riding?p.b:null,p?.seat||"pilot",t,opts);
      }
    }
    headHome(dt,env){
      const trip=this.returning,b=trip.b,close=trip.arrived||!trip.route&&gap(b,this.site.counter)<20;
      if(trip.retry>0){trip.retry-=dt;return;}
      if(this.partner){
        if(this.player?.b===b||close){
          if(this.partner.stage==="ride")this.down(this.partner,env);
        }else if(this.partner.stage==="ride"){
          if(this.partner.seat!=="pilot"){this.down(this.partner,env);return;}
          if(!trip.route)trip.route=autoRoute(b,this.site.stalls[b.kind],env,b.kind);
          if(automatic(b,trip.route,dt,env)){trip.arrived=true;settle(b);this.park(b,env);this.down(this.partner,env);}
        }
      }else if(!close&&this.player?.b!==b&&gap(this.ines,b)<4){
        this.partner=this.mount(this.ines,b,"pilot",-1,env);if(!this.partner)trip.retry=.8;
      }else{
        const route=env.walkway(this.ines,this.site.rider,null);
        if(route){this.ines.path=[...route,...this.site.staffWalk.slice().reverse()];this.returning=null;}else trip.retry=1.6;
      }
    }
    visitorStep(dt,env){
      const v=this.visitor,b=this.localBike,p=this.remy,store=this.site,stops=[store.guestStall,briefs[0].curb,face(149.15,-60,0)];
      const to=stops[v.leg];v.age+=dt;
      if(v.stage==="road"){
        if(!v.route)v.route=autoRoute(b,to,env,v.leg===0?"guest":null);
        if(automatic(b,v.route,dt,env)){settle(b);v.stage="down";v.age=0;this.down(this.remySeat,env);}
      }else if(v.stage==="down"&&!this.remySeat){
        p.path=v.leg===0?(store.guestWalk||[store.guestCounter]).slice():[BayDriving.world(to,2.95,.2)];v.stage="walk";
      }else if(v.stage==="walk"){
        if(BayCarAccess.walkPath(p,p.motion,p.path,dt,env.floor,1.68)){v.stage="visit";v.age=0;p.action="idle";p.yaw=v.leg===0?Math.PI/2:to.yaw+.8;}
      }else if(v.stage==="visit"&&v.age>(v.leg===0?23:12)){
        const seat=this.mount(p,b,"pilot",1,env);if(seat){
          if(v.leg===0&&store.guestWalk?.length)seat.path=[...store.guestWalk.slice(0,-1).reverse(),...seat.path.slice(-1)];
          this.remySeat=seat;v.stage="board";}
      }else if(v.stage==="board"&&this.remySeat?.stage==="ride"){v.leg=(v.leg+1)%stops.length;v.route=null;v.stage="road";v.age=0;}
      if(this.remySeat){this.seatStep(this.remySeat,dt,env);if(this.remySeat.stage==="foot")this.remySeat=null;}
      b.mount=this.remySeat?.mount||0;b.stand=damp(b.stand,1-b.mount,8,dt);
    }
    step(dt,env){
      this.visitorStep(dt,env);const j=this.job;
      this.flash=Math.max(0,(this.flash||0)-dt);this.aim=damp(this.aim||0,this.finder?1:0,8,dt);
      if(this.develop>0){this.develop=Math.max(0,this.develop-dt);if(!this.develop){
        const p=this.film.pending;if(p)env.pay(p);this.ines.action="idle";this.job=null;env.change();}return;}
      if(this.returning)this.headHome(dt,env);
      else if(j?.assembling){
        if(BayCarAccess.walkPath(this.ines,this.ines.motion,this.ines.path||[],dt,env.floor,1.9)&&gap(this.ines,j.b)<23){
          const seat=j.role==="pilot"?"pillion":"pilot";
          this.partner=this.mount(this.ines,j.b,seat,seat==="pilot"?-1:1,env);if(this.partner)j.assembling=false;
        }
      }else if(!this.partner&&(!j||j.stage==="lab")&&gap(this.ines,this.site.clerk)>.18){
        if(!this.ines.path?.length){const aisle=this.site.staffWalk||[this.site.clerk,this.site.rider];
          this.ines.path=[...(env.walkway(this.ines,this.site.rider,null)||[this.site.rider]),...aisle.slice().reverse()];}
        BayCarAccess.walkPath(this.ines,this.ines.motion,this.ines.path,dt,env.floor,1.95);this.ines.action="walk";
      }else if(!this.partner&&(!j||j.stage==="lab")){this.ines.action="idle";this.ines.yaw=this.site.clerk.yaw;}
      if(this.player){this.seatStep(this.player,dt,env);if(this.player.leaveSeat&&this.player.stage==="ride")this.down(this.player,env);}
      if(this.partner)this.seatStep(this.partner,dt,env);
      if(this.player?.stage==="foot"){const p=this.player;this.player=null;this.park(p.b,env);env.change();}
      if(this.partner?.stage==="foot"){this.partner=null;this.ines.path=null;}
      if(j?.swapping&&!this.player&&!this.partner){
        const next=j.role==="pilot"?"pillion":"pilot",other=j.role;
        const p=this.mount(this.swapHero,j.b,next,next==="pilot"?-1:1,env,true),a=this.mount(this.ines,j.b,other,other==="pilot"?-1:1,env);
        if(p&&a){j.role=next;this.player=p;this.partner=a;j.swapping=false;j.stop=false;this.swapHero=null;if(j.stage!=="lab")this.setRoute(env);env.change();}
      }
      const b=this.bike;
      for(const v of this.bikes){v.mount=Math.max(v===b?this.player.mount:0,v===this.partner?.b?this.partner.mount:0);
        v.stand=damp(v.stand,1-v.mount,8,dt);if(!v.mount){v.lean=damp(v.lean,0,6,dt);v.y=env.floor(v.x,v.z);}}
      if(!b||this.player.stage!=="ride")return;
      if(j&&this.partner?.stage!=="ride"){settle(b);return;}
      if(j?.stage==="meet"){j.stage="out";this.setRoute(env);env.say("Inés Vidal",j.role==="pillion"?"Hold on to the rail. The rangefinder's in the brown case.":"I'll watch for the shot. You take us to the corner.");env.change();}
      if(this.pilot){
        this.saved.distance+=ride(b,dt,env.input(this.finder),env,!!this.partner);
        if(j){b.trail??=[];if(!b.trail.length||gap(b,b.trail.at(-1))>3){
          if(env.road(b))b.trail.length=0;b.trail.push({x:b.x,z:b.z,yaw:b.yaw});
          if(b.trail.length>1800)b.trail.splice(1,1);
        }}
      }
      else if(j?.route&&!j.parked&&j.stage!=="lab"){
        if(automatic(b,j.route,dt,env,j.stop)){settle(b);j.parked=true;if(j.stage==="return")this.parkHome(env);else env.say("Inés Vidal",j.brief.arrival);}
      }
      if(j?.stage==="lab")settle(b);
      if(j?.stage==="out"&&!j.called&&this.nearPhoto()){j.called=true;env.message("Photo corner · F raises the rangefinder");}
      if(this.player?.stage==="ride")Object.assign(this.player.a,BayMotoRiders.placement(b,this.player.seat,this.player.side,1,b.y));
      if(this.partner?.stage==="ride")Object.assign(this.ines,BayMotoRiders.placement(b,this.partner.seat,this.partner.side,1,b.y));
    }
  }
  window.BaySecondSeat={Fleet,read,briefs,find,handling,ride,automatic,autoRoute,motorcycle,settle};
})();
