/* Cab 17 works the same streets and takes the same passenger door as the player. */
(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),point=(x,z)=>({x,z});
  const mix=(a,b,u)=>point(a.x+(b.x-a.x)*u,a.z+(b.z-a.z)*u);
  const directions=[[0,1],[1,0],[0,-1],[-1,0]],cardinal=yaw=>(Math.round(yaw/(Math.PI/2))+4)%4;
  const stops={};
  for(const [id,name,x,z,dir,sx,sz,wx,wz] of [
    ["marlin","Marlin Motel",149.05,-43.5,0,152.45,-42.5,153.6,-48.3],
    ["luna","Cine Luna",5.10,31,0,8.55,31.2,9.75,40.4],
    ["flowers","Old Palms Flowers",-77.10,-109,2,-80.45,-109.5,-81.8,-105],
    ["wheel","North Boardwalk",149,123,0,152.5,125.1,154,130.5]
  ])stops[id]={id,name,x,z,dir,yaw:dir*Math.PI/2,stand:point(sx,sz),work:point(wx,wz),kind:"cab-rank"};
  const cinema={x:10.15,z:38,name:"Cine Luna · Theater entrance",kind:"theater"};
  const cast=[
    {id:"walt",name:"Walt Dunn",home:"marlin",job:"luna",pay:110,ask:"Could you run me over to Cine Luna? Last copy of the tram short is in this tin.",
      road:"They tore up the tram tracks before I was born. My mother always said the bell rang in E flat.",
      thanks:"Give me a minute with the projector. Come inside and see what you brought.",back:"Back to the Marlin, please. I left my good splicer in twelve."},
    {id:"bea",name:"Bea Salas",home:"luna",job:"flowers",pay:95,ask:"Old Palms Flowers. If these open in the back seat I owe you a bouquet.",
      road:"My sister orders the good paper from Miami. I still wrap the stems in the sports pages.",
      thanks:"Look at that. Every stem made it. I’ll put these out front.",back:"Cine Luna, please. They save the ticket ribbons for my bouquets."},
    {id:"otis",name:"Otis Reed",home:"flowers",job:"wheel",pay:125,ask:"Headed toward the wheel? I’m the drummer. The rest of the band’s already there.",
      road:"Listen to the seams in the road. Four beats between Ocean and the pier, every time.",
      thanks:"There’s my corner. Come by after I get this case open.",back:"Old Palms, if you’re going west. Bea keeps my spare drum key."}
  ];
  function read(raw){
    const at={},fares={};
    for(const c of cast){
      at[c.id]=[c.home,c.job].includes(raw?.at?.[c.id])?raw.at[c.id]:"";
      fares[c.id]=Number.isSafeInteger(raw?.fares?.[c.id])?clamp(raw.fares[c.id],0,99999):0;
    }
    return {at,fares,reel:["player","mina"].includes(raw?.reel)?raw.reel:"",rides:Number.isSafeInteger(raw?.rides)?clamp(raw.rides,0,99999):0};
  }
  function intersection(p,forward){
    const [dx,dz]=directions[p.dir],along=dx?p.x:p.z,sign=(dx||dz)*(forward?1:-1);
    const lane=sign>0?Math.floor(along/72+.0001)+1:Math.ceil(along/72-.0001)-1;
    return dx?point(clamp(lane,-2,2)*72,Math.round(p.z/72)*72):point(Math.round(p.x/72)*72,clamp(lane,-2,2)*72);
  }
  function roadEdge(start,end){
    const first=intersection(start,true),last=intersection(end,false);
    const queue=[{...first,dir:start.dir,prev:null}],seen=new Set();
    for(let i=0;i<queue.length;i++){
      const q=queue[i],id=q.x+","+q.z+","+q.dir;if(seen.has(id))continue;seen.add(id);
      if(gap(q,last)<1&&((q.dir+2)%4!==end.dir)){
        const line=[];for(let n=q;n;n=n.prev)line.unshift(point(n.x,n.z));return line;
      }
      for(const n of [q.dir,(q.dir+1)%4,(q.dir+3)%4]){
        const [dx,dz]=directions[n],x=q.x+72*dx,z=q.z+72*dz;
        if(Math.abs(x)<=144&&Math.abs(z)<=144)queue.push({x,z,dir:n,prev:q});
      }
    }
    return [first,last];
  }
  function route(start,end){
    const [dx,dz]=directions[start.dir],[ex,ez]=directions[end.dir];
    const center=p=>p.dir%2?point(p.x,Math.round(p.z/72)*72):point(Math.round(p.x/72)*72,p.z);
    const a=center(start),b=center(end),lane=2.48;
    const direct=start.dir===end.dir&&Math.abs((b.x-a.x)*dz-(b.z-a.z)*dx)<.1&&((b.x-a.x)*dx+(b.z-a.z)*dz)>0;
    const street=[a,...(direct?[]:roadEdge(start,end)),b],corners=[];
    for(const p of street){
      const last=corners.at(-1),before=corners.at(-2);
      if(last&&gap(last,p)<.10)continue;
      if(before&&(last.x-before.x)*(p.z-last.z)===(last.z-before.z)*(p.x-last.x))corners.pop();
      corners.push(p);
    }
    const pts=[],push=p=>{const last=pts.at(-1);if(!last||gap(last,p)>.015)pts.push({...p,at:last?last.at+gap(last,p):0});};
    push(start);
    const straight=gap(start,end),merge=Math.min(8,straight*.22);
    push(point(a.x+dx*merge+dz*lane,a.z+dz*merge-dx*lane));
    for(let i=1;i<corners.length-1;i++){
      const p=corners[i],left=corners[i-1],right=corners[i+1],l=gap(p,left),r=gap(p,right);
      const ux=(p.x-left.x)/l,uz=(p.z-left.z)/l,vx=(right.x-p.x)/r,vz=(right.z-p.z)/r;
      const bend=point(p.x+lane*(uz+vz),p.z-lane*(ux+vx)),rad=Math.min(7,l*.30,r*.30);
      const before=point(bend.x-ux*rad,bend.z-uz*rad),after=point(bend.x+vx*rad,bend.z+vz*rad);
      for(let k=0;k<=8;k++){const u=k/8;push(mix(mix(before,bend,u),mix(bend,after,u),u));}
    }
    push(point(b.x-ex*merge+ez*lane,b.z-ez*merge-ex*lane));push(end);
    return track(pts);
  }
  function track(pts){
    return {pts,length:pts.at(-1).at,closest(q){
      let nearest=Infinity,at=0;
      for(let i=1;i<pts.length;i++){
        const a=pts[i-1],b=pts[i],dx=b.x-a.x,dz=b.z-a.z,u=clamp(((q.x-a.x)*dx+(q.z-a.z)*dz)/(dx*dx+dz*dz),0,1);
        const d=Math.hypot(q.x-a.x-u*dx,q.z-a.z-u*dz);
        if(d<nearest){nearest=d;at=a.at+(b.at-a.at)*u;}
      }
      return {at,gap:nearest};
    },sample(d){
      let lo=1,hi=pts.length-1;while(lo<hi){const m=(lo+hi)>>1;if(pts[m].at<d)lo=m+1;else hi=m;}
      const q=pts[lo],p=pts[lo-1],u=clamp((d-p.at)/(q.at-p.at),0,1);
      return {...mix(p,q,u),yaw:Math.atan2(q.x-p.x,q.z-p.z)};
    }};
  }
  function streetTrack(points){
    const pts=[];for(const p of points){const last=pts.at(-1),d=last?gap(last,p):0;
      if(!last||d>.015)pts.push({...p,at:last?last.at+d:0});}
    return track(pts);
  }
  function pullIn(v,end){
    const [dx,dz]=directions[end.dir],rightX=dz,rightZ=-dx;
    const ahead=(end.x-v.x)*dx+(end.z-v.z)*dz,side=(v.x-end.x)*rightX+(v.z-end.z)*rightZ;
    const steps=Math.max(2,Math.ceil(ahead)),pts=[{x:v.x,z:v.z,at:0}];
    for(let i=1;i<=steps;i++){
      const t=i/steps,d=t*ahead,ease=n=>n*n*(3-2*n);
      const lane=side+(-2.55-side)*ease(clamp(d/3,0,1));
      const across=lane*ease(clamp((ahead-d)/Math.min(5,ahead),0,1));
      const p=point(end.x-dx*(ahead-d)+rightX*across,end.z-dz*(ahead-d)+rightZ*across);
      p.at=pts.at(-1).at+gap(pts.at(-1),p);pts.push(p);
    }
    return track(pts);
  }
  function streetStop(p,road){
    if(road.county||gap(p,road)>13)return null;
    const vertical=road.vertical,along=vertical?p.z:p.x,edge=Math.round(along/72)*72;
    if(Math.abs(along)>144)return null;
    const position=clamp(Math.abs(along-edge)<15?edge+(along<edge?-15:15):along,-129,129);
    const right=vertical?p.x>=road.x:p.z<=road.z,dir=vertical?(right?0:2):(right?1:3);
    const [dx,dz]=directions[dir],axis=vertical?point(road.x,position):point(position,road.z);
    return {id:"curb",name:"Street pickup",dir,yaw:dir*Math.PI/2,x:axis.x+dz*5,z:axis.z-dx*5,
      stand:point(axis.x+dz*8.3,axis.z-dx*8.3),work:point(axis.x+dz*8.9,axis.z-dx*8.9)};
  }
  const stopped=v=>v&&Math.abs(v.speed)<1&&Math.hypot(v.vx,v.vz)<1;
  class Service{
    constructor(vehicle,memory){
      this.vehicle=vehicle;this.memory=memory;this.location=stops.marlin;this.phase="idle";this.wait=27;this.trip=null;this.booking=null;this.leg=null;this.cursor=0;this.privateFare=null;
      this.people=cast.map((c,i)=>{
        const at=memory.at[c.id]||c.home,from=stops[at],settled=!!memory.at[c.id],away=at===c.job;
        const booth=settled&&c.id==="walt"&&at==="luna";
        return {...c,...(booth?point(cinema.x,cinema.z):settled?from.work:from.stand),from,to:settled?from:stops[away?c.home:c.job],y:.08,yaw:settled?from.yaw+Math.PI*.42:from.yaw-Math.PI/2,phase:booth?"booth":settled?"work":"wait",
          wait:42+8*i,age:0,seat:0,motion:new BayPlayerMotion(),path:[],ride:null,personal:false,waved:false};
      });
    }
    get playerHeld(){return !!this.booking&&["approach","in","ride","out"].includes(this.booking.stage);}
    get playerTripping(){return this.playerHeld;}
    nearRank(p){return Object.values(stops).find(s=>gap(p,s.stand)<3.75);}
    curbHail(p,road){
      const v=this.vehicle,curb=streetStop(p,road);
      if(!curb||gap(p,v)>14||this.booking||this.trip&&this.trip.phase!=="wait")return null;
      if(!this.leg)return !this.trip&&gap(p,this.location.stand)<12?{...this.location,id:"curb",name:"Street pickup"}:null;
      if(Math.abs(turn(v.yaw,curb.yaw))>.48)return null;
      const [dx,dz]=directions[curb.dir],along=(curb.x-v.x)*dx+(curb.z-v.z)*dz;
      const advance=Math.max(0,Math.max(4,v.speed*v.speed/11+1.4)-along);
      const x=curb.x+dx*advance,z=curb.z+dz*advance,d=dx?x:z;
      if(Math.abs(d)>145||Math.abs(d-Math.round(d/72)*72)<10||Math.hypot(p.x-x,p.z-z)>23)return null;
      return {...curb,x,z,stand:point(curb.stand.x+dx*advance,curb.stand.z+dz*advance),rolling:true};
    }
    nearbyFare(v){return v&&!this.privateFare&&!this.booking&&this.people.find(p=>p.phase==="wait"&&gap(v,p)<9.3);}
    quote(from,to){return !this.memory.rides?0:Math.min(24,5+Math.ceil(route(from,to).length/35));}
    request(from,to){
      if(this.booking||this.privateFare||!to||from.id===to.id||gap(from,to)<10)return false;
      this.booking={from,to,price:this.quote(from,to),stage:"waiting",seat:0,path:[],age:0};
      if(from.rolling){
        const stop=this.berth?this.berth(from,this.vehicle):from;
        this.trip=null;this.phase="calling";this.leg=this.newLeg(pullIn(this.vehicle,stop),stop);
      }
      this.wait=0;if(!this.trip&&!this.leg)this.dispatch();return true;
    }
    cancelBooking(){if(!this.booking||this.playerHeld)return false;this.booking=null;this.wait=4;if(!this.trip&&!this.leg)this.phase="idle";return true;}
    launch(stop){
      if(this.berth)stop=this.berth(stop);
      if(gap(this.vehicle,stop)<.4){this.location=stop;return false;}
      this.leg=this.newLeg(route(this.location,stop),stop);
      return true;
    }
    newLeg(path,stop){return {route:path,end:stop,at:0,offset:0,block:0,scan:0,space:Infinity,passing:false};}
    dispatch(){
      if(this.leg||this.trip||this.playerHeld)return;
      if(this.booking){
        const b=this.booking;if(b.stage!=="waiting")return;
        this.phase="calling";if(!this.launch(b.from)){b.stage="ready";this.phase="arrived";}return;
      }
      for(let i=0;i<this.people.length;i++){
        const n=(this.cursor+i)%this.people.length,p=this.people[n];
        if(p.phase!=="wait"||p.personal)continue;
        this.trip=p;this.cursor=(n+1)%this.people.length;this.phase="pickup";this.launch(p.from);return;
      }
      this.phase="idle";this.wait=2;
    }
    accept(p,v,plan){
      if(!p||p.phase!=="wait"||!plan||!stopped(v)||gap(v,p)>9.5)return false;
      if(v!==this.vehicle){if(this.privateFare||this.booking)return false;if(this.trip===p)this.trip=null;this.privateFare=p;p.personal=true;}
      p.ride=v;p.path=plan.points;p.phase="approach";p.seat=0;p.age=0;p.remarked=false;p.jolt=0;p.cancelled=false;return true;
    }
    holds(v){return !!v&&this.people.some(p=>p.ride===v&&["approach","in","out"].includes(p.phase));}
    board(hero,plan){
      const b=this.booking;if(b?.stage!=="ready"||!plan||gap(hero,this.vehicle)>8.8)return false;
      b.stage="approach";b.path=plan.points;this.phase="player";return true;
    }
    target(car){
      const b=this.booking;
      if(b)return b.stage==="waiting"?{...b.from.stand,name:"Cab 17 · "+b.from.name}:
        ["ready","approach","in"].includes(b.stage)?{x:this.vehicle.x,z:this.vehicle.z,name:"Cab 17"}:this.leg?.end||b.to;
      const p=this.privateFare;if(!p)return null;
      return !p.cancelled&&p.ride&&p.ride!==car?{x:p.ride.x,z:p.ride.z,name:p.name+"’s ride"}:p.to;
    }
    askOut(){
      const b=this.booking,l=this.leg;if(b?.stage!=="ride"||!l||b.early)return false;
      for(let d=l.at+12;d<Math.min(l.route.length-9,l.at+115);d+=2){
        const q=l.route.sample(d),dir=cardinal(q.yaw),[dx,dz]=directions[dir],along=dx?q.x:q.z;
        if(Math.abs(turn(dir*Math.PI/2,q.yaw))>.09||Math.abs(along-Math.round(along/72)*72)<15)continue;
        b.early=true;b.price=b.price?Math.max(1,Math.round(b.price*d/l.route.length)):0;
        l.stopAt=d;l.end={id:"curb",name:"The next curb",dir,yaw:dir*Math.PI/2,x:q.x+dz*2.55,z:q.z-dx*2.55,
          stand:point(q.x+dz*5.6,q.z-dx*5.6)};return true;
      }
      return false;
    }
    drive(dt,environment){
      const l=this.leg,v=this.vehicle;if(!l)return false;
      const limit=l.stopAt??l.route.length,remaining=limit-l.at,look=l.route.sample(Math.min(limit,l.at+3.5));
      l.scan-=dt;
      if(l.scan<=0){
        if(!l.stopAt&&remaining<25&&this.berth&&Math.abs(turn(v.yaw,l.end.yaw))<.70){
          const available=this.berth(l.end,v);
          if(gap(available,l.end)>.4){
            l.route=pullIn(v,available);l.end=available;l.at=l.offset=l.block=l.passUntil=0;
            return false;
          }
        }
        l.scan=.14;const clear=environment.clearance(v,look.yaw,l,remaining);
        l.space=clear.gap;l.passing=clear.pass;
      }
      l.block=l.space<2?l.block+dt:0;
      const corner=Math.abs(turn(v.yaw,l.route.sample(Math.min(limit,l.at+8)).yaw));
      const target=Math.min(13.7,Math.sqrt(7.3*remaining),Math.sqrt(6.8*l.space),14/(1+2.3*corner));
      const before=v.speed;v.speed+=clamp(target-v.speed,-6.4*dt,3.9*dt);
      const step=Math.min(remaining,l.space,v.speed*dt);l.at+=step;
      const q=l.route.sample(l.at),desired=l.stopAt?2.55*clamp(1-(limit-l.at)/10,0,1):0;
      l.offset+=clamp((l.passing?-2.38:desired)-l.offset,-2.4*dt,2.4*dt);
      const x=q.x+Math.cos(q.yaw)*l.offset,z=q.z-Math.sin(q.yaw)*l.offset,oldYaw=v.yaw;
      v.vx=(x-v.x)/dt;v.vz=(z-v.z)/dt;v.x=x;v.z=z;
      if(step>.0001)v.yaw+=turn(v.yaw,Math.atan2(v.vx,v.vz))*-Math.expm1(-9*dt);
      v.steer=clamp(turn(oldYaw,v.yaw)/dt*.25,-.40,.40);v.lean=-v.steer*Math.min(.12,v.speed*.014);
      v.brakes=target<before-.12||remaining<4?1:0;v.wheelSpin=(v.wheelSpin||0)+step/.32;
      if(limit-l.at>.035)return false;
      this.location=l.end;Object.assign(v,{x:l.end.x,z:l.end.z,yaw:l.end.yaw,speed:0,vx:0,vz:0,lean:0,steer:0,brakes:1});
      this.leg=null;return true;
    }
    leaveFare(){
      const p=this.privateFare;if(!p)return;
      p.personal=false;
      if(p.phase==="approach"){
        this.privateFare=null;p.ride=null;p.phase="return";p.path=[p.from.stand];return;
      }
      p.cancelled=true;
      if(p.phase==="out"||p.phase==="walk"){p.curb=p.to;p.path=[p.to.stand];}
    }
    stepPeople(dt,env,emit){
      for(const p of this.people){
        p.age+=dt;
        if(p.phase==="offduty"){
          if(gap(env.hero,p)<85)continue;
          const at=this.memory.at[p.id]||p.home;p.from=stops[at];p.to=stops[at===p.job?p.home:p.job];
          Object.assign(p,p.from.stand,{phase:"wait",yaw:p.from.yaw-Math.PI/2});continue;
        }
        if(p.phase==="staff-in"){
          if(BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground,1.45)){p.phase="booth";p.wait=46;}
          continue;
        }
        if(p.phase==="work"||p.phase==="booth"){
          p.motion.step(dt,0,0);
          p.wait-=dt;if(p.wait<=0){
            if(p.phase==="work"&&p.id==="walt"&&p.to.id==="luna"){p.phase="staff-in";p.path=[cinema];continue;}
            p.from=p.to;p.to=stops[p.from.id===p.job?p.home:p.job];p.phase="return";p.path=[p.from.stand];
          }continue;
        }
        if(p.phase==="wait"){
          p.motion.step(dt,0,0);
          if(!p.waved&&env.hail?.(p)){p.waved=true;emit("hail",p);}
          continue;
        }
        if(p.phase==="return"){
          if(BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground,1.25)){p.phase="wait";p.waved=false;p.yaw=p.from.yaw-Math.PI/2;}
          continue;
        }
        const v=p.ride,work=p.to.work;
        if(p.phase==="approach"){if(BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground)){p.phase="in";}continue;}
        if(p.phase==="in"||p.phase==="out"){
          const boarding=p.phase==="in";p.seat=clamp(p.seat+(boarding?1:-1)*dt/1.46,0,1);
          BayCarAccess.pose(v,1,p.seat,p,p.motion,env.ground,dt,true);
          if(boarding&&p.seat===1){
            p.phase="ride";p.age=0;if(p===this.trip){this.launch(p.to);this.phase="ride";}
            if(p.personal)emit("boarded",p);
          }else if(!boarding&&p.seat===0){
            p.motion.reset();p.phase="walk";p.ride=null;
            if(this.trip===p){this.trip=null;this.phase="idle";this.wait=7;}
          }continue;
        }
        if(p.phase==="ride"){
          BayCarAccess.pose(v,1,1,p,p.motion,env.ground,dt,true);
          if(p.personal&&!p.remarked&&p.age>6.5){p.remarked=true;emit("remark",p);}
          if(!stopped(v)||!p.cancelled&&(gap(v,p.to)>(v===this.vehicle?10:8)||v===this.vehicle&&this.leg))continue;
          const curb=p.cancelled?env.nearCurb(v):p.to;
          if(!curb)continue;
          const stand=p.cancelled?curb.stand:work,plan=env.door(v,false,stand,1);if(!plan)continue;
          p.path=plan.points.slice(0,-1).reverse().concat([stand]);p.phase="out";if(p.cancelled)p.curb=curb;continue;
        }
        if(p.phase==="walk"&&BayCarAccess.walkPath(p,p.motion,p.path,dt,env.ground,1.88)){
          if(p.cancelled){
            if(this.privateFare===p)this.privateFare=null;
            p.from=p.curb;p.phase="wait";p.cancelled=false;p.curb=null;
            if(p.from.id==="roadside"){p.phase="offduty";continue;}
            if(p.from.id===p.to.id)p.to=stops[p.from.id===p.job?p.home:p.job];
          }else{
            p.phase="work";p.wait=p.id==="walt"&&p.to.id==="luna"?16:64;p.yaw=p.to.yaw+Math.PI*.42;this.memory.at[p.id]=p.to.id;
            if(p.id==="walt"&&p.to.id==="luna"&&(p.personal||!this.memory.reel))this.memory.reel=p.personal?"player":"mina";
            if(p.personal){this.memory.fares[p.id]++;this.privateFare=null;}
            emit("delivered",p);p.personal=false;
          }
        }
      }
    }
    step(dt,env,emit){
      this.berth=env.berth;this.drive(dt,env);this.stepPeople(dt,env,emit);
      const b=this.booking,v=this.vehicle;
      if(b){
        b.age+=dt;
        if(b.stage==="ready"&&gap(env.hero,b.from.stand)>26||b.stage==="waiting"&&gap(env.hero,b.from.stand)>42){this.cancelBooking();emit("left-rank",b);}
        else if(b.stage==="approach"){
          if(BayCarAccess.walkPath(env.hero,env.motion,b.path,dt,env.ground))b.stage="in";
        }else if(b.stage==="in"||b.stage==="out"){
          const boarding=b.stage==="in";b.seat=clamp(b.seat+(boarding?1:-1)*dt/1.50,0,1);
          BayCarAccess.pose(v,1,b.seat,env.hero,env.motion,env.ground,dt,true);
          if(boarding&&b.seat===1){b.stage="ride";this.phase="player";this.launch(b.to);emit("moving",b);}
          if(!boarding&&!b.seat){this.booking=null;this.phase="idle";this.wait=6;env.motion.reset();this.memory.rides++;emit("arrived",b);}
        }else if(b.stage==="ride"){
          BayCarAccess.pose(v,1,1,env.hero,env.motion,env.ground,dt,true);
          if(this.leg&&!b.early&&!b.remarked&&this.leg.at>this.leg.route.length*.42){b.remarked=true;emit("window-talk",b);}
          if(!this.leg&&env.door(v,true,env.hero,1)){b.stage="out";this.phase="arrived";}
        }else if(b.stage==="waiting"&&!this.trip&&!this.leg){
          this.dispatch();if(b.stage==="ready")emit("ready",b);
        }
      }
      if(this.trip&&!this.leg&&this.trip.phase==="wait"){
        const p=this.trip;
        const plan=env.door(v,false,p,1);
        if(!this.accept(p,v,plan)){this.trip=null;this.wait=3;}
      }
      if(!this.trip&&!this.leg&&!this.booking){this.wait-=dt;if(this.wait<=0)this.dispatch();}
    }
  }
  window.BayCab={stops,cinema,cast,read,route,track:streetTrack,streetStop,stopped,Service};
})();
