/* The Gantry Street company keeps one truck, one crew and a single live call. */
(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=(n,a,b)=>Math.max(a,Math.min(n,b));
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const here=(o,x,z)=>BayDriving.world(o,x,z);
  const house={x:115,z:-59.2,y:.096,yaw:-Math.PI/2,name:"Station Seven"};
  const berth={...here(house,.74,0),yaw:house.yaw,name:house.name};
  const desk={...here(house,-3.45,2.6),kind:"engine-house",name:"Station Seven · Gantry Street"};
  const specs=[
    ["linen","Marlin laundry cart","Ema Duarte",153.2,-51,0,"Those are the upstairs towels. I thought the orange was the sunset.","You saved the blue stripes. The other hotel buys plain white.",[.79,1,.62]],
    ["oven","Mercado bread run","Pilar Cano",81.2,-103,0,"The rack started smoking halfway to the counter. I’ve moved everyone back.","Tomorrow I’m bringing the crew the first batch.",[.65,.88,1]],
    ["rope","Port Sol float chest","Teo Núñez",-113,-9.2,1,"The floats went up one after the other. Nobody’s on the pier now.","I owe your driver the prettiest green float in the harbor.",[1,.54,.92]]
  ];
  const calls=specs.map(([kind,title,owner,x,z,dir,first,thanks,initial])=>{
    const site={x,z,y:.12,yaw:dir*Math.PI/2+Math.PI/2,kind,title,owner,first,thanks,initial};
    const road={...here(site,0,-4.6),dir,yaw:dir*Math.PI/2};
    return {...site,road,safe:here(site,-3.3,-.45),start:here(site,1.95,-.42),stand:here(site,.1,-2.8)};
  });
  const zero=[0,0,0];
  function read(raw){
    const log=(Array.isArray(raw?.log)?raw.log:[]).filter(r=>r&&calls.some(c=>c.kind===r.kind)&&[r.day,r.seconds,r.score,r.gallons,r.fee,r.serial].every(n=>Number.isSafeInteger(n)&&n>=0)&&r.day>0&&r.score<=100&&typeof r.crew==="string").slice(-6);
    const records={};for(const c of calls){const n=raw?.records?.[c.kind];if(Number.isInteger(n)&&n>0&&n<=100)records[c.kind]=n;}
    return {rev:Number.isSafeInteger(raw?.rev)&&raw.rev>=0?raw.rev:0,number:Number.isSafeInteger(raw?.number)&&raw.number>=0?raw.number:0,log,records};
  }
  const block=c=>({x:c.x,z:c.z,w:Math.abs(Math.cos(c.yaw))*3+Math.abs(Math.sin(c.yaw))*1.22,d:Math.abs(Math.sin(c.yaw))*3+Math.abs(Math.cos(c.yaw))*1.22,bottom:0,top:1.56,streetProp:true});
  function crew(name,p,role){return {x:p.x,z:p.z,y:p.y??.1,yaw:p.yaw||0,name,role,seat:0,stride:0,speed:0};}
  function move(actor,target,dt,speed){
    const dx=target.x-actor.x,dz=target.z-actor.z,len=Math.hypot(dx,dz),d=Math.min(speed*dt,len);
    actor.speed=d/dt;
    if(len<.03)return true;
    actor.x+=dx*d/len;actor.z+=dz*d/len;actor.stride+=d;actor.yaw+=turn(actor.yaw,Math.atan2(dx,dz))*(1-Math.exp(-dt*8));
    return len-d<.04;
  }
  const rollout=sign=>[[.74,0],[.74,7.6],[-1.1,10.6],[-5.4,14],[-9.1,17],[-10.32,20]].map(([x,z])=>here(house,x,sign*z));
  const out=rollout(1),back=rollout(-1).reverse();
  const homeRoad=(p)=>({...p,dir:3,yaw:-Math.PI/2});
  class Company {
    constructor(v,book){
      this.v=v;this.site={bay:berth};this.phase="standby";this.age=0;this.idle=15;
      this.next=book.number%calls.length;this.call=calls[this.next];this.recent=null;this.reserved=null;this.joined=false;this.manual=false;this.holding=false;
      this.mate=crew("Nel Baptiste",v,"mate");this.mate.seat=1;this.owners=calls.map(c=>crew(c.owner,c.start,"owner"));
      this.levels=[...zero];this.water=null;this.nozzleSide=0;this.fed=0;this.tank=320;this.pump=1;this.spent=0;this.hits=0;
    }
    go(phase){this.phase=phase;this.age=0;}
    get traveling(){return this.phase==="outbound"||this.phase==="return";}
    get working(){return ["unroll","working","stow"].includes(this.phase);}
    get burning(){return ["outbound","unroll","working"].includes(this.phase);}
    get owner(){return this.owners[calls.indexOf(this.call)];}
    get goal(){return this.phase==="return"?berth:this.call.road;}
    get socket(){return {...here(this.v,-1.14,.13),y:1.12};}
    get pumpStand(){return here(this.v,-1.80,.13);}
    get mateStand(){return here(this.call,.14,-2.85);}
    get roadGoal(){return {...this.goal,name:this.phase==="return"?"Station Seven":this.call.title};}
    route(home,start=null,trail=[]){
      const edge=start||this.call.road;
      return BayRescue.track(home?[this.v,...BayCab.route(edge,homeRoad(back[0])).pts,...back]:
        start?[this.v,...trail,...BayCab.route(start,this.call.road).pts]:[this.v,...trail,...out,...BayCab.route(homeRoad(out.at(-1)),this.call.road).pts]);
    }
    travel(home,start=null,line=this.route(home,start)){
      this.line=line;this.cursor=0;this.lateral=0;this.blocked=0;
      this.v.responseLights=!home;this.v.pumpWorking=false;this.go(home?"return":"outbound");
    }
    dispatch(which,manual){
      this.call=calls[which];this.next=(which+1)%calls.length;this.manual=this.joined=!!manual;
      this.seatWaiting=!!manual;this.holding=false;this.levels=[...this.call.initial];this.tank=320;this.spent=this.hits=this.fed=this.workTime=0;this.pump=1;this.aimX=0;this.water=null;this.recent=null;
      this.mate.seat=1;this.reported=false;this.travel(false);this.v.responseLights=!manual;
      if(manual){this.lastRoad=null;this.trace=[{x:this.v.x,z:this.v.z}];}
    }
    canPark(){
      return this.phase==="outbound"&&Math.abs(this.v.speed)<1.25&&gap(this.v,this.call.road)<8&&gap(this.v,this.call)<13;
    }
    freeBerth(env){
      for(const off of [0,-3,3,-5,5]){const q={...here(this.call.road,0,off),yaw:this.call.road.yaw,kind:this.v.kind};
        if(env.carClear(this.v,q))return q;}
      return null;
    }
    startDock(outbound,berth){
      // The responding driver can finish a truck length short of an occupied curb.
      if(outbound&&gap(this.v,this.call)>13&&berth){this.line=BayRescue.track([this.v,berth]);this.cursor=this.lateral=this.blocked=0;return;}
      BayDriving.settle(this.v);this.v.brakes=1;this.v.responseLights=outbound;this.v.pumpWorking=outbound;
      this.manual=false;this.seatWaiting=false;
      if(outbound){this.go("unroll");this.mate.seat=1;this.mateStep="exit";this.path=null;}
      else{this.go("standby");this.idle=140;this.mate.seat=1;}
    }
    claim(){this.joined=true;this.aimX=0;this.holding=true;this.mateStep="assist";this.path=null;}
    handBack(){this.holding=false;this.water=null;this.path=null;if(this.phase==="working")this.mateStep="line";}
    leave(env){
      this.joined=false;this.handBack();
      if(this.manual){
        if(env.driving()||env.transition()){this.reclaim=true;this.v.responseLights=false;}
        else this.resumeAI(env);
      }
    }
    resumeAI(env){
      this.reclaim=false;this.manual=false;this.seatWaiting=false;
      if(this.phase!=="outbound")return;
      const line=this.line,near=line.closest(this.v);
      if(near.gap<3.8){
        const ahead=Math.min(line.length,near.at+3);
        const remaining=BayRescue.track([this.v,line.sample(ahead),...line.pts.filter(p=>p.at>ahead)]);
        if(remaining.pts.length<2)this.startDock(true);
        else this.travel(false,null,remaining);
        return;
      }
      const current=env.street(this.v),road=current||this.lastRoad;
      const trail=current?[]:this.trace.slice().reverse();
      this.travel(false,road,this.route(false,road,trail));
    }
    wet(x,dt,flow,player){
      this.spent+=flow*dt*10;if(player)this.tank=Math.max(0,this.tank-flow*dt*10);
      for(let i=0;i<3;i++){
        const n=Math.max(0,1-Math.abs(x-(i-1))/1.0),prior=this.levels[i];
        this.levels[i]=Math.max(0,prior-flow*dt*n*(this.call.kind==="rope"?.25:.31));
        if(player&&prior>.001){const removed=prior-this.levels[i];this.hits+=removed;this.fed+=removed;}
      }
    }
    spray(dt,env){
      const player=this.holding,actor=player?env.hero:this.mate,c=this.call;
      if(player){if(env.spray())this.aimX=clamp(this.aimX+env.axis()*dt*1.55,-1.8,1.8);}
      else this.aimX+=clamp(this.levels.findIndex(n=>n>.001)-1-this.aimX,-dt*1.8,dt*1.8);
      const target={...here(c,this.aimX,-.43),y:c.y+1.04},from={...here(actor,.18,.46),y:env.ground(actor.x,actor.z)+1.04};
      const q=BayDriving.local(c,actor.x,actor.z),gapTo=gap(actor,target);
      const requested=player?env.spray():true;
      const safe=q.z<-.72&&gapTo<13&&Math.abs(q.x)<9&&(player?env.clearJet(from,target):true);
      const flowing=requested&&(!player||this.tank>0)&&safe;
      if(requested){const yaw=Math.atan2(target.x-actor.x,target.z-actor.z);actor.yaw+=turn(actor.yaw,yaw)*(1-Math.exp(-dt*12));}
      this.water=flowing?{from,to:target}:null;this.obstructed=requested&&!safe;
      if(flowing){this.pump=clamp(this.pump-dt*.046,.64,1);this.wet(this.aimX,dt,this.pump*(player?1:.53),player);}
      else this.pump=clamp(this.pump+dt*.20,.64,1);
    }
    goFeet(target,dt,env){
      if(!this.path)this.path=env.walkway(this.mate,target,this.v);
      const q=this.path?.[0]||target;
      if(move(this.mate,q,dt,2.55)){if(this.path?.length)this.path.shift();if(!this.path?.length){this.path=null;return gap(this.mate,target)<.32;}}
      return false;
    }
    step(dt,env){
      this.age+=dt;
      for(let i=0;i<calls.length;i++){
        const o=this.owners[i],c=calls[i],out=c===this.call&&(this.burning||this.phase==="stow");
        if(!!o.away!==out){
          const left=here(c,-3.3,-1.75),right=here(c,1.95,-1.75);
          o.away=out;o.path=out?[right,left,c.safe]:[left,right,c.start];
        }
        if(o.path?.length){if(move(o,o.path[0],dt,out?2.45:1.12))o.path.shift();}
        else{o.speed=0;o.yaw+=turn(o.yaw,Math.atan2(c.x-o.x,c.z-o.z))*Math.min(1,dt*4);}
      }
      if(this.phase==="standby"){if(this.age>=this.idle&&!env.delay())this.dispatch(this.next,false);return;}
      if(this.reclaim&&!env.driving()&&!env.transition())this.resumeAI(env);
      if(this.traveling){
        if(this.manual){
          if(env.driving()&&!this.reclaim){
            this.seatWaiting=false;
            if(gap(this.v,this.trace.at(-1))>2.4){
              const road=env.street(this.v);
              if(road){this.lastRoad=road;this.trace.length=0;}
              this.trace.push({x:this.v.x,z:this.v.z});
            }
          }
          return;
        }
        BayRescue.followResponse(this,dt,env);return;
      }
      if(this.phase==="unroll"){
        if(this.mateStep==="exit"){
          this.mate.seat=clamp(1-this.age/1.5,0,1);this.v.passengerDoor=Math.sin(this.mate.seat*Math.PI)*1.04;
          const a=here(this.v,.54+(1-this.mate.seat)*1.16,1.38);Object.assign(this.mate,a,{yaw:this.v.yaw});
          if(!this.mate.seat){this.mateStep="line";this.v.passengerDoor=0;}
        }else if(this.goFeet(this.mateStand,dt,env)){this.go("working");this.mateStep="line";}
        return;
      }
      if(this.phase==="working"){
        this.workTime+=dt;
        if(this.holding){
          const support=here(this.call,2.45,-2.38);
          if(gap(this.mate,support)>.35)this.goFeet(support,dt,env);
          else{this.mate.speed=0;this.mate.yaw+=turn(this.mate.yaw,Math.atan2(this.call.x-this.mate.x,this.call.z-this.mate.z))*Math.min(1,dt*6);}
          this.spray(dt,env);if(gap(env.hero,this.v)>21){this.handBack();env.line("Nel Baptiste","You’re at the end of the line. I’ll hold it here.");}
        }
        else if(!this.joined&&this.age>6){if(gap(this.mate,this.mateStand)>.45)this.goFeet(this.mateStand,dt,env);else this.spray(dt,env);}
        if(this.levels.every(n=>n<=.001)){
          this.recent=this.call;this.holding=false;this.water=null;this.v.pumpWorking=false;env.done(this.joined&&this.fed>.18);this.joined=false;this.go("stow");this.path=null;
        }
        return;
      }
      if(this.phase==="stow"){
        if(this.age<4||env.driving()||env.transition())return;
        const door=here(this.v,1.7,1.38);
        if(!this.mate.seat&&gap(this.mate,door)>.34){this.goFeet(door,dt,env);return;}
        this.mate.seat=Math.min(1,this.mate.seat+dt/.99);this.v.passengerDoor=Math.sin(this.mate.seat*Math.PI)*1.04;
        if(this.mate.seat>=1){this.v.passengerDoor=0;this.travel(true,env.street(this.v));}
      }
    }
  }
  window.BayEngineSeven={house,berth,desk,calls,block,read,Company};
})();
