/* Elia's two wash bays share a hose. A car's four panels keep their own road dirt. */
(() => {
  "use strict";
  const clamp=(n,lo=0,hi=1)=>Math.min(hi,Math.max(lo,n)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const points=(x,z)=>({x,z}),zero=()=>[0,0,0,0],sides=["Driver’s side","Passenger side","Hood","Rear panel"];
  const cast=[
    {name:"Rae Costa",id:"rae",style:4,kind:"van",color:"#93aaa1",plate:"FISHICE",base:70,home:points(157.7,-129.4),
      ask:"It’s the fish ice run. Look at the salt the coolers threw up on the back.",thanks:"First time this week I can read the name on the back doors."},
    {name:"Leon Baptiste",id:"leon",style:1,kind:"hatch",color:"#c67757",plate:"LITTLEL",base:55,home:points(163.7,-138.5),
      ask:"Kicked up sand getting the folding chairs off the beach. Both doors caught it.",thanks:"Lena said this little thing was brown. Wait till she sees it."},
    {name:"May Ibarra",id:"may",style:3,kind:"coupe",color:"#d8c285",plate:"PAPERRD",base:65,home:points(158.3,-151.6),
      ask:"My paper route ends at the Cut. Half of this morning’s road came home on the hood.",thanks:"The paint’s the same yellow as the first day I got it."}
  ];
  function read(raw){
    const count=n=>Number.isSafeInteger(n)?clamp(n,0,999999):0;
    const soil=Object.create(null),tips={},visits={};
    for(const [id,v] of Object.entries(raw?.soil||{})){
      if(/^(coupe|cab|hatch|wrecker|ambulance|van|cruiser|cayo|marea)@-?\d+\.\d{2},-?\d+\.\d{2}$/.test(id)&&Array.isArray(v)&&v.length===4&&v.every(n=>Number.isFinite(n)&&n>=0&&n<=1))soil[id]=v.slice();
    }
    for(const g of cast){tips[g.id]=clamp(count(raw?.tips?.[g.id]),0,30);visits[g.id]=count(raw?.visits?.[g.id]);}
    return {soil,tips,visits,orders:count(raw?.orders),rinses:count(raw?.rinses)};
  }
  const mean=a=>a.reduce((sum,n)=>sum+n,0)/a.length;
  function fitCar(v,memory){
    const f=.08+(v.id%5)*.03;
    v.soil=memory.soil[v.garageKey]?.slice()||[f,.86*f,.72*f,1.15*f];v.rinse=zero();
    v.lastRoadX=v.x;v.lastRoadZ=v.z;
  }
  function storeCar(v,memory){
    if(!v.soil||!(v.used||v.washTracked)||v.washGuest)return false;
    const levels=v.soil.map(n=>Math.round(clamp(n)*1000)/1000),old=memory.soil[v.garageKey];
    if(old&&levels.every((n,i)=>n===old[i]))return false;
    memory.soil[v.garageKey]=levels;return true;
  }
  function weatherCar(v,dt,wet){
    if(!v.soil)return;
    const dx=v.x-v.lastRoadX,dz=v.z-v.lastRoadZ;v.lastRoadX=v.x;v.lastRoadZ=v.z;
    for(let k=0;k<4;k++)if(v.rinse[k])v.rinse[k]=Math.max(0,v.rinse[k]-.026*dt);
    const meters=Math.hypot(dx,dz);if(meters<.0001||meters>12)return;
    const county=v.z>181,pad=v.x>154&&v.x<175&&v.z>-102&&v.z<-83&&BayPalmaWash.floorLevel(v.x,v.z)!=null;
    const sand=county?BayCut.surface(v.x,v.z)<.82:v.x>171&&!pad;
    const road=sand?.0068:county?.0015:.00011;
    const deposit=meters*road*(1+wet*(sand?1.45:1.9))*(1+Math.min(1,v.slip||0)*.65);
    const turn=clamp((v.steer||0)*1.7,-.7,.7);
    for(let k=0;k<4;k++){const amount=k===0?1-turn:k===1?1+turn:k===2?.53:1.44;v.soil[k]=clamp(v.soil[k]+deposit*amount*(1-v.soil[k]*.8));}
  }
  function parked(v,b){
    if(!v||!BayCab.stopped(v))return false;
    const p=BayDriving.local(b,v.x,v.z);
    return Math.abs(p.x)<1.63&&Math.abs(p.z)<2.55&&Math.abs(Math.cos(v.yaw-b.yaw))>.82;
  }
  function nozzle(v,actor){
    const s=bayCarLayout(v.kind),p=BayDriving.local(v,actor.x,actor.z);
    const sideDist=Math.abs(p.x)-s.track,endDist=Math.abs(p.z)-s.halfLength;
    const side=sideDist>endDist?(p.x<0?0:1):p.z>0?2:3;
    const u=clamp(side<2?p.z/s.halfLength:p.x/s.track,-1,1);
    const x=side<2?(side===0?-1:1)*(s.track-.035):u*s.track*.84;
    const z=side<2?u*s.halfLength*.91:(side===2?1:-1)*(s.halfLength-.07);
    const q=BayDriving.world(v,x,z);q.y=side===3&&v.kind==="van"?1.02:side<2?.76:.68;
    return {side,u,target:q,distance:Math.hypot(Math.max(0,sideDist),Math.max(0,endDist))};
  }
  function stand(v,side){
    const s=bayCarLayout(v.kind),sideways=side<2;
    return BayDriving.world(v,sideways?(side===0?-1:1)*(s.track+1.12):.17,sideways?0:(side===2?1:-1)*(s.halfLength+1.04));
  }
  function film(v){
    if(!v.washCells)v.washCells=v.soil.map(n=>[n,n,n]);
    return v.washCells;
  }
  function clean(v,side,u,dt){
    const cell=film(v)[side];let removed=0;
    for(let i=0;i<3;i++){
      const was=cell[i],reach=clamp(1.03-Math.abs(u-(i-1)*.64)*.96,.19,1);
      cell[i]=Math.max(0,was-dt*reach*.56);removed+=was-cell[i];
    }
    v.soil[side]=mean(cell);v.rinse[side]=1;return removed/3;
  }
  const cleanEnough=v=>v.soil.every(n=>n<=.037);
  function road(v,points,yaw,speed){
    const path=BayMotorCourt.lotPath(v,points).path;
    v.path=[{x:v.x,z:v.z},...path];v.corner=1;v.finiteRoute=true;v.finiteYaw=yaw;v.pace=speed;v.wait=0;v.blocked=0;v.wantsCurb=false;v.pullOver=v.reaction=null;
  }
  class Wash{
    constructor(addCar,memory){
      this.site=BayPalmaWash.site;this.memory=memory;this.owner=BayMotorCourt.actor("elia",this.site.keeper,"counter");this.owner.name="Elia Mena";
      this.guests=cast.map(c=>{const v=addCar(c.kind,c.color,c.home.x,c.home.z,0);v.washGuest=c.id;v.plate=c.plate;
        const a=Object.assign(BayMotorCourt.actor(c.id,c.home,"home"),c,{car:v,seat:1});return a;});
      this.order=null;this.index=memory.orders%cast.length;this.due=8;this.work=null;this.duty=false;this.personal=null;
      this.operator=null;this.target=null;this.spraying=false;this.panel=-1;
    }
    hasWand(){return this.work?.worker==="player";}
    personalBay(v){return parked(v,this.site.publicBay);}
    atTill(p){return gap(p,this.site.till)<2.85||gap(p,this.site.rack)<2.35;}
    select(){
      for(let i=0;i<cast.length;i++){
        const idx=(i+this.index)%cast.length,g=this.guests[idx];if(g.phase!=="home")continue;
        this.index=(idx+1)%cast.length;this.order=g;g.phase="incoming";g.side=-1;g.ride=g.car;g.seat=1;
        const v=g.car;v.soil=[[.67,.55,.42,.96],[.94,.83,.45,.56],[.68,.60,.97,.55]][idx].slice();v.washCells=null;
        road(v,[points(v.x,-122),points(161.6,-110),this.site.entry,this.site.bay],0,5.3);return;
      }
    }
    resetOwner(){this.owner.path=[];this.owner.goal=null;}
    start(v,worker,type){
      this.resetOwner();const soil=v.soil.reduce((a,b)=>a+b,0);
      this.work={v,worker,type,initial:Math.max(.001,soil),removed:0,seconds:0,water:0,ready:false,side:2};
      film(v);this.operator=null;this.spraying=false;
    }
    playerShift(){
      if(this.personal||this.duty)return false;
      this.duty=true;this.due=0;
      if(this.order?.phase==="waiting"&&(!this.work||this.work.type==="ambient")&&!cleanEnough(this.order.car))this.start(this.order.car,"player","shift");
      return true;
    }
    own(v,full){
      if(this.duty||this.personal||!this.personalBay(v))return false;
      this.personal=v;v.washTracked=true;this.start(v,full?"elia":"player",full?"attended":"self");return true;
    }
    release(){
      if(this.personal)this.personal.washCells=null;
      this.duty=false;this.personal=null;this.work=null;this.operator=this.target=null;this.spraying=false;this.panel=-1;this.resetOwner();
    }
    finishShift(env){
      const g=this.order,w=this.work;
      if(!this.duty||!g||!w?.ready||gap(env.hero,g)>3.35)return false;
      const share=clamp(w.removed/Math.max(1.7,w.initial)),tip=Math.round(30*clamp(1-(w.water-7)/37)*share);
      const pay=Math.max(18,Math.round(g.base*clamp(w.initial/2,.35,1)))+tip,m=this.memory;
      m.orders++;m.visits[g.id]++;m.tips[g.id]=Math.max(m.tips[g.id],tip);
      this.release();this.depart(g);env.receipt(g,pay,tip);return true;
    }
    depart(g){g.phase="return";g.path=[];g.goal=null;g.retry=0;g.car.washCells=null;}
    sendHome(g){
      const v=g.car,h=g.home;g.phase="outgoing";this.order=null;this.due=22;
      road(v,[this.site.exit,points(161.6,-78.7),points(154.2,-70),points(145,-69.5),points(74,-69.5),
        points(69.5,-74),points(69.5,-140),points(75,-146.5),points(145,-146.5),points(152.8,-145.5),points(153.2,h.z-5),points(h.x,h.z-3.2),h],0,7.8);
    }
    walk(a,dest,v,dt,env){
      if(gap(a,dest)<.12){a.path=[];a.motion.step(dt,0,0);return true;}
      if(!a.goal||gap(a.goal,dest)>.19){a.path=[];a.retry=0;a.goal=dest;}
      a.retry=(a.retry||0)-dt;
      if(!a.path.length&&a.retry<=0){a.path=env.walkway(a,dest,v)||[];a.retry=.65;}
      if(!a.path.length){a.motion.step(dt,0,0);return false;}
      return BayCarAccess.walkPath(a,a.motion,a.path,dt,env.ground,2.05);
    }
    guestsStep(dt,env){
      for(const g of this.guests){
        const v=g.car;g.age+=dt;
        if(g.phase==="outgoing"&&!v.path){g.phase="home";g.ride=v;}
        if(g.phase==="home"||g.phase==="incoming"||g.phase==="outgoing"){
          if(g.phase!=="incoming"||v.path)continue;
          const access=env.door(v,true,g,-1)||env.door(v,true,g,1);if(!access)continue;
          g.side=access.side;g.seat=1;g.phase="exit";
        }
        if(g.phase==="exit"){
          if(!BayMotorCourt.open(g,v,false,dt,env))continue;
          g.phase="toChair";g.ride=null;g.goal=null;g.path=[];
        }
        if(g.phase==="toChair"){
          const seat=this.site.at(-2.75,-4.71);
          if(this.walk(g,seat,v,dt,env)){g.phase="waiting";g.yaw=Math.atan2(v.x-g.x,v.z-g.z);if(this.duty)env.line(g.name,g.ask);}
        }else if(g.phase==="waiting"){g.motion.step(dt,0,0);}
        else if(g.phase==="return"){
          const access=env.door(v,false,g,g.side);if(!access)continue;
          if(!this.walk(g,access.points.at(-1)||g,v,dt,env))continue;
          g.side=access.side;g.seat=0;g.ride=v;g.phase="enter";
        }else if(g.phase==="enter"&&BayMotorCourt.open(g,v,true,dt,env))this.sendHome(g);
      }
      if(!this.order&&(this.due-=dt)<=0&&!env.blocked(this.site.bay))this.select();
    }
    step(dt,env){
      this.guestsStep(dt,env);
      if(!this.work&&this.order?.phase==="waiting"){
        if(cleanEnough(this.order.car))this.depart(this.order);
        else this.start(this.order.car,this.duty?"player":"elia",this.duty?"shift":"ambient");
      }
      const w=this.work,a=this.owner;
      this.target=null;this.operator=null;this.spraying=false;this.panel=-1;
      if(!w||w.ready){this.walk(a,this.site.keeper,null,dt,env);return;}
      const v=w.v;w.seconds+=dt;
      if(this.personal&&!this.personalBay(v)){this.release();env.cancel();return;}
      const operator=w.worker==="elia"?a:env.hero;this.operator=operator;
      if(operator===a){
        if(v.soil[w.side]<=.022){const next=[2,1,3,0].find(k=>v.soil[k]>.022);if(next!==undefined)w.side=next;}
        const dest=stand(v,w.side);if(!this.walk(a,dest,v,dt,env)){if(!w.hasHose)this.operator=null;return;}
        w.hasHose=true;
      }else{
        this.walk(a,this.site.keeper,null,dt,env);
        if(!env.onFoot()||gap(operator,v)>8){this.operator=null;return;}
      }
      const shot=nozzle(v,operator);this.panel=shot.side;
      const fire=operator===a||env.held();if(shot.distance>3.25)return;
      if(operator===a){
        shot.u=Math.sin(w.seconds*3.7)*.81;const s=bayCarLayout(v.kind);
        const q=shot.side<2?BayDriving.world(v,(shot.side===0?-1:1)*s.track,shot.u*s.halfLength*.90):BayDriving.world(v,shot.u*s.track,(shot.side===2?1:-1)*s.halfLength);
        Object.assign(shot.target,q);
      }
      this.target=shot.target;this.target.y+=env.ground(v.x,v.z);this.spraying=fire;
      if(fire){
        const look=Math.atan2(this.target.x-operator.x,this.target.z-operator.z);
        operator.yaw+=Math.atan2(Math.sin(look-operator.yaw),Math.cos(look-operator.yaw))*Math.min(1,dt*15);
        w.water+=dt;w.removed+=clean(v,shot.side,shot.u,dt);
      }
      if(!cleanEnough(v))return;
      v.soil.fill(0);v.washCells=null;this.spraying=false;
      if(w.type==="shift"){w.ready=true;this.operator=null;env.line(this.order.name,"Looks good from here. Come find me by Elia’s till.");}
      else if(w.type==="ambient"){this.work=null;this.resetOwner();this.depart(this.order);}
      else{const full=w.type==="attended";if(full)this.memory.rinses++;this.release();env.ownDone(v,full);}
    }
    marker(){
      const g=this.order;
      if(this.work?.ready)return {x:g.x,z:g.z,name:g.name};
      if(this.personal)return {x:this.personal.x,z:this.personal.z,name:"Your rinse pad"};
      if(g?.phase==="waiting")return {x:g.car.x,z:g.car.z,name:g.plate};
      return this.site.till;
    }
  }
  window.BayPalma={Wash,read,fitCar,storeCar,weatherCar,parked,nozzle,stand,cast,sides,cleanEnough};
})();
