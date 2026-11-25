/* Bay Patrol shares sightings by radio and drives the same street grid as traffic. */
(() => {
  "use strict";
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const distance=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const point=(x,z)=>({x,z});

  class FootUnit {
    constructor(v,side){
      this.v=v;this.side=side;this.seat=1;this.phase="exit";this.route=[];this.planIn=0;this.goal=null;
      this.actor={x:v.x,y:0,z:v.z,yaw:v.yaw,motion:new BayPlayerMotion(),patrolFoot:true};
      BayDriving.settle(v);v.brakes=1;v.block=null;v.footUnit=this;
    }
    step(dt,target,follow,e){
      const a=this.actor,v=this.v;
      if(this.phase==="exit"||this.phase==="enter"){
        const boarding=this.phase==="enter";
        this.seat=clamp(this.seat+(boarding?1:-1)*dt/1.32,0,1);
        BayCarAccess.pose(v,this.side,this.seat,a,a.motion,e.ground,dt);
        if(boarding&&this.seat===1){
          delete v.footUnit;v.doorAngle=0;v.planIn=0;v.path=[];v.backing=0;v.brakes=0;return true;
        }
        if(this.seat===0){a.motion.ride=null;this.phase="follow";}
        return false;
      }
      const next=follow?"follow":"return";
      if(next!==this.phase){this.phase=next;this.goal=null;this.route=[];this.planIn=0;}
      if(!follow){
        const door=BayCarAccess.outside(bayCarLayout(v.kind),this.side);
        target=BayDriving.world(v,door.x,door.z);
      }
      const gap=distance(a,target);
      if(gap<(follow?1.12:.13)){
        this.route=[];this.goal=null;this.planIn=0;
        if(follow){a.yaw+=wrap(Math.atan2(target.x-a.x,target.z-a.z)-a.yaw)*-Math.expm1(-11*dt);a.motion.step(dt,0,0);}
        else this.phase="enter";
        return false;
      }
      this.planIn-=dt;
      if(this.planIn<=0&&(!this.goal||distance(target,this.goal)>.8||!this.route.length)){
        this.planIn=.62;this.goal=point(target.x,target.z);this.route=e.path(a,target,v)||[];
      }
      if(!this.route.length){a.motion.step(dt,0,0);return false;}
      // Moving traffic may have crossed a route since it was planned.
      const q=this.route[0],len=distance(a,q)||1,speed=follow?4.65:3.4,f=Math.min(1,speed*dt/len);
      if(!e.clear(a.x+(q.x-a.x)*f,a.z+(q.z-a.z)*f)){this.route=[];a.motion.step(dt,0,0);return false;}
      BayCarAccess.walkPath(a,a.motion,this.route,dt,e.ground,speed);return false;
    }
  }

  class BayPursuit {
    constructor(roads,solids){
      this.roads=roads;
      this.cover=solids.filter(o=>o.top>1.3&&o.w>1.4&&o.d>1.4);
      this.reset();
    }
    reset(){
      this.lastSeen=null;this.unseen=0;this.searching=false;this.sighted=false;
      this.foot=null;this.footDelay=0;
      this.scanIn=0;this.reinforceIn=0;this.closestUnit=Infinity;
    }
    report(p,vx,vz,afloat=false){
      this.lastSeen={x:p.x,z:p.z,yaw:p.yaw,vx,vz,afloat};
      this.unseen=0;this.searching=false;
    }
    searchTime(heat){return 5.6+heat*1.05;}
    canSee(v,p,heat){
      const dx=p.x-v.x,dz=p.z-v.z,d=Math.hypot(dx,dz);
      if(d>(this.searching?38+heat*3:76+heat*4))return false;
      if(d>15&&dx*Math.sin(v.yaw)+dz*Math.cos(v.yaw)<d*(this.searching?.63:-.18))return false;
      if(d>27&&!BayCut.area(v)&&!BayCut.area(p)){
        const a=this.road(v),b=this.road(p);
        if(a.vertical!==b.vertical&&distance(p,b)<10){
          const approach=a.vertical?Math.abs(v.z-b.z):Math.abs(v.x-b.x);
          const depth=b.vertical?Math.abs(p.z-a.z):Math.abs(p.x-a.x);
          if(approach>11&&depth>14)return false;
        }
      }
      return BayCamera.safeFraction({x:v.x,y:1.46+(BayCut.area(v)?BayCut.height(v.x,v.z):0),z:v.z},
        {x:p.x,y:1.3+(Number.isFinite(p.y)?p.y:BayCut.area(p)?BayCut.height(p.x,p.z):0),z:p.z},this.cover)>=1;
    }
    observe(units,p,vx,vz,heat,dt,radioSight=false,afloat=false,submerged=false){
      this.scanIn-=dt;
      if(this.scanIn<=0){
        this.scanIn+=.12;
        this.sighted=radioSight;
        for(const v of units){
          const eye=v.footUnit?.actor||v;
          const visible=!submerged&&this.canSee(eye,p,heat);
          v.spotTime=visible?(v.spotTime||0)+.12:0;
          v.sees=visible&&(!this.searching||v.spotTime>=.36||distance(eye,p)<12);
          if(v.sees)this.sighted=true;
        }
        if(this.sighted)this.report(p,vx,vz,afloat);
      }
      if(!this.sighted)this.unseen+=dt;
      this.searching=this.unseen>=1.05;
      this.reinforceIn=Math.max(0,this.reinforceIn-dt);
    }
    stepFoot(v,dt,p,onFoot,e){
      if(v===this.foot?.v){
        const follow=onFoot&&distance(this.foot.actor,v)<40&&distance(v,this.lastSeen)<36;
        if(this.foot.step(dt,v.sees?p:this.lastSeen,follow,e)){this.foot=null;this.footDelay=1.8;}
        return true;
      }
      if(this.foot||this.footDelay>0||!onFoot||!v.sees||v.beatCar||v.role==="roadblock"||distance(v,p)>14)return false;
      if(v.speed>1){
        v.speed=Math.max(0,v.speed-15*dt);v.brakes=1;
        const x=v.x+Math.sin(v.yaw)*v.speed*dt,z=v.z+Math.cos(v.yaw)*v.speed*dt;
        if(e.coast(v,x,z,v.yaw)){v.x=x;v.z=z;}else v.speed=0;
        return true;
      }
      const plan=e.door(v);
      if(!plan){this.footDelay=.65;return false;}
      this.foot=new FootUnit(v,plan.side);
      e.call();return true;
    }
    nearest(value){
      return this.roads.reduce((best,n)=>Math.abs(n-value)<Math.abs(best-value)?n:best);
    }
    road(p){
      if(BayCut.area(p)){
        const n=BayCut.nearest(p.x,p.z);return {x:n.x,z:n.z,vertical:Math.abs(n.segment.dz)>Math.abs(n.segment.dx),county:true};
      }
      const x=this.nearest(p.x),z=this.nearest(p.z);
      return Math.abs(p.x-x)<Math.abs(p.z-z)?{x,z:clamp(p.z,-178,178),vertical:true}:
        {x:clamp(p.x,-179,148),z,vertical:false};
    }
    ends(r){
      const n=r.vertical?r.z:r.x,axis=this.roads;
      const a=axis.filter(v=>v<=n).pop()??axis[0],b=axis.find(v=>v>=n)??axis[axis.length-1];
      return (a===b?[a]:[a,b]).map(v=>r.vertical?point(r.x,v):point(v,r.z));
    }
    route(unit,target){
      const leaving=BayCut.area(unit),arriving=BayCut.area(target);
      if(!leaving&&!arriving)return this.cityRoute(unit,target);
      if(leaving&&arriving)return BayCut.route(unit,target);
      const gate=BayCut.gate;
      return leaving?BayCut.route(unit,gate).concat(this.cityRoute({...gate,yaw:Math.PI},target)):
        this.cityRoute(unit,gate).concat(BayCut.route(gate,target));
    }
    cityRoute(unit,target){
      const start=this.road(unit),end=this.road(target);
      let best=[],cost=Infinity;
      const consider=points=>{
        const path=[];let total=0,prior=unit;
        for(const p of points){
          const d=distance(prior,p);if(d<.13)continue;
          if(!path.length){
            const turn=wrap(Math.atan2(p.x-prior.x,p.z-prior.z)-unit.yaw);
            total+=(1-Math.cos(turn))*3;
          }
          total+=d;path.push(p);prior=p;
        }
        if(total<cost){cost=total;best=path;}
      };
      const final=distance(target,end)<6?target:end;
      // Hold the current lane; revising a route should never snap a car to the centreline.
      if((start.x===end.x&&this.roads.includes(start.x))||(start.z===end.z&&this.roads.includes(start.z)))consider([final]);
      for(const a of this.ends(start))for(const b of this.ends(end)){
        consider([a,point(a.x,b.z),b,final]);
        if(a.x!==b.x&&a.z!==b.z)consider([a,point(b.x,a.z),b,final]);
      }
      return best;
    }
    direction(k){
      const pace=Math.hypot(k.vx,k.vz);
      const dx=pace>3?k.vx:Math.sin(k.yaw),dz=pace>3?k.vz:Math.cos(k.yaw);
      return Math.abs(dz)>=Math.abs(dx)?point(0,Math.sign(dz)||1):point(Math.sign(dx)||1,0);
    }
    crossing(k,unit){
      if(BayCut.area(k))return null;
      const pace=Math.hypot(k.vx,k.vz);
      if(pace<4.2)return null;
      const dir=this.direction(k),vertical=!!dir.z,along=vertical?k.z:k.x,sign=dir.z||dir.x;
      const line=this.nearest(vertical?k.x:k.z);
      if(Math.abs((vertical?k.x:k.z)-line)>10)return null;
      const ahead=this.roads.map(n=>({n,d:(n-along)*sign})).filter(a=>a.d>7&&a.d<137).sort((a,b)=>a.d-b.d);
      for(const a of ahead){
        const j={x:vertical?line:a.n,z:vertical?a.n:line,dir};
        const travel=unit?(Math.abs(unit.x-j.x)+Math.abs(unit.z-j.z))/Math.max(15,unit.speed*.45+12):2.35;
        if(travel<a.d/pace+.60)return j;
      }
      return null;
    }
    blockPlan(v,j,k){
      const vertical=!!j.dir.z;
      let side=Math.sign(vertical?v.x-j.x:v.z-j.z);
      if(!side)side=(vertical?j.x:j.z)>0?-1:1;
      const cross=vertical?point(side,0):point(0,side);
      // Cross the player's travel lane broadside, leaving the opposite lane open.
      const lane=clamp((k.x-j.x)*cross.x+(k.z-j.z)*cross.z,-4,4);
      const entry=point(j.x+cross.x*18,j.z+cross.z*18);
      const stop=point(j.x+cross.x*lane-j.dir.x*1.4,j.z+cross.z*lane-j.dir.z*1.4);
      return {j,entry,stop,entering:true,held:0,age:0};
    }
    spawn(k,slot,clear){
      const dir=this.direction(k),road=this.road(k),crossing=slot===1?this.crossing(k):null;
      const options=[];
      if(BayCut.area(k)){
        const county=BayCut.routes.flatMap(r=>r.points).map(p=>({...p,face:road,gap:distance(k,p)}));
        options.push(...county.filter(p=>p.gap>37&&p.gap<120).sort((a,b)=>Math.abs(a.gap-53-slot*13)-Math.abs(b.gap-53-slot*13)));
      }
      if(crossing){
        const side=(dir.z?crossing.x:crossing.z)>0?-1:1;
        for(const s of [side,-side])for(const d of [31,43,56]){
          options.push({x:crossing.x+dir.z*s*d,z:crossing.z+dir.x*s*d,face:crossing});
        }
      }
      const lane=point(dir.z*1.1,-dir.x*1.1);
      if(!slot)for(const d of [43,54,64]){
        options.push({x:road.x-dir.x*d+lane.x,z:road.z-dir.z*d+lane.z,face:road});
      }
      const nodes=[];
      for(const x of this.roads)for(const z of this.roads){
        const p=point(x,z),d=distance(k,p),behind=(x-k.x)*dir.x+(z-k.z)*dir.z;
        if(d>35&&d<162)nodes.push({...p,face:road,score:Math.abs(d-(slot?76:52))+(slot?0:Math.max(0,behind)*.55)});
      }
      options.push(...nodes.sort((a,b)=>a.score-b.score));
      for(const p of options){
        if(distance(p,k)<30||distance(this.road(p),p)>3.8)continue;
        const yaw=Math.atan2(p.face.x-p.x,p.face.z-p.z);
        if(clear(p.x,p.z,yaw))return {kind:"cruiser",x:p.x,z:p.z,yaw,speed:8,role:slot===1?"cutoff":"tail",
          path:[],planIn:0,block:null,searchStep:0,brakes:0,lean:0,sees:false};
      }
      return null;
    }
    searchGoal(v,k){
      if(v.searchGoal&&distance(v,v.searchGoal)>4)return v.searchGoal;
      if(BayCut.area(k)){
        const nearest=BayCut.nearest(k.x,k.z),points=nearest.route.points,index=points.indexOf(nearest.segment.a);
        const delta=[1,-1,2,-2][(v.searchStep+++(v.role==="cutoff"?1:0))%4];
        return v.searchGoal=points[clamp(index+delta,0,points.length-1)];
      }
      const dir=this.direction(k);
      if(!v.searchStep){
        v.searchStep=1;
        return v.searchGoal=this.road(point(k.x+dir.x*(v.role==="cutoff"?23:12),k.z+dir.z*(v.role==="cutoff"?23:12)));
      }
      // Sweep adjoining blocks from the last radio call, independently of the hidden player.
      const x=this.nearest(k.x),z=this.nearest(k.z);
      const choices=[point(x+72,z),point(x,z+72),point(x-72,z),point(x,z-72)]
        .filter(p=>this.roads.includes(p.x)&&this.roads.includes(p.z));
      return v.searchGoal=choices[((v.searchStep++-1)+(v.role==="cutoff"?2:0))%choices.length];
    }
    target(v,k,searching,dt){
      if(searching){v.block=null;return this.searchGoal(v,k);}
      v.searchStep=0;v.searchGoal=null;
      if(v.role==="cutoff"){
        if(v.block){
          const b=v.block,d=b.j.dir;
          b.age+=dt;
          const passed=(k.x-b.j.x)*d.x+(k.z-b.j.z)*d.z;
          if(distance(v,b.stop)<2.2)b.held+=dt;
          const along=k.vx*d.x+k.vz*d.z,side=Math.abs(k.vx*d.z-k.vz*d.x);
          if(passed>7||b.held>2.7||b.age>8||along< -3||side>Math.max(6,along*1.4)){
            v.lastBlock=b.j;v.block=null;
          }
        }
        if(!v.block){
          const j=this.crossing(k,v);
          if(j&&(!v.lastBlock||distance(j,v.lastBlock)>1)&&distance(v,j)<115)v.block=this.blockPlan(v,j,k);
        }
        if(v.block){
          const b=v.block;if(distance(v,b.entry)<4)b.entering=false;
          return b.entering?b.entry:b.stop;
        }
      }
      const t=.45;return this.road(point(k.x+k.vx*t,k.z+k.vz*t));
    }
    trafficBearing(v,aim,dt,clear){
      const dx=aim.x-v.x,dz=aim.z-v.z,gap=Math.hypot(dx,dz),bearing=Math.atan2(dx,dz);
      if(BayCut.area(v)||BayCut.area(aim))return bearing;
      if(gap<7||v.block&&!v.block.entering||Math.abs(wrap(bearing-v.yaw))>.66)return bearing;
      const vertical=Math.abs(dz)>Math.abs(dx),line=this.nearest(vertical?v.x:v.z);
      const sign=Math.sign(vertical?dz:dx),across=vertical?v.x:v.z,along=vertical?v.z:v.x;
      if(Math.abs(across-line)>5.7||Math.abs((vertical?aim.x:aim.z)-line)>5)return bearing;
      const look=Math.min(gap,5.7+v.speed*.26);
      const laneOpen=offset=>{
        for(const step of [3.1,look]){
          const at=along+step*sign;
          if(!(vertical?clear(v,line+offset,at,bearing):clear(v,at,line+offset,bearing)))return false;
        }
        return true;
      };
      v.laneTime=Math.max(0,(v.laneTime||0)-dt);
      v.trafficIn=(v.trafficIn||0)-dt;
      if(v.trafficIn<=0){
        v.trafficIn=.17;
        if(!laneOpen(0)||(!v.laneTime&&!laneOpen(across-line))){
          const preferred=v.laneTime?v.lane:(vertical?sign:-sign)*3.65;
          for(const lane of [preferred,-preferred])if(laneOpen(lane)){v.lane=lane;v.laneTime=1.05;break;}
        }
      }
      if(!v.laneTime)return bearing;
      const lateral=line+v.lane-across;
      return vertical?Math.atan2(lateral,look*sign):Math.atan2(look*sign,lateral);
    }
    move(v,heat,dt,clear,k=this.lastSeen){
      const goal=this.target(v,k,this.searching,dt),range=distance(v,goal);
      if(v.backing>0){
        const x=v.x-Math.sin(v.yaw)*3.7*dt,z=v.z-Math.cos(v.yaw)*3.7*dt;
        if(clear(v,x,z,v.yaw)){v.x=x;v.z=z;v.backing-=dt;}else v.backing=0;
        v.speed=0;v.brakes=1;return;
      }
      v.planIn=(v.planIn||0)-dt;
      if(!v.destination||v.wasSearching!==this.searching||
        (v.planIn<=0&&distance(v.destination,goal)>2.3)){
        v.path=this.route(v,goal);v.destination=point(goal.x,goal.z);v.planIn=.42;v.wasSearching=this.searching;
      }
      const path=v.path,corner=Math.min(5.5,2.5+v.speed*.13);
      while(path.length>1&&distance(v,path[0])<corner)path.shift();
      const aim=path[0]||goal,dx=aim.x-v.x,dz=aim.z-v.z,gap=Math.hypot(dx,dz);
      const error=gap>.16?wrap(this.trafficBearing(v,aim,dt,clear)-v.yaw):0;
      const cap=this.searching?10.5:(v.block?25:21)+heat*1.7;
      const brakingRoom=range-.65+(v.block?.entering?15:0);
      const pace=Math.min(cap,cap/(1+Math.abs(error)*1.15),Math.sqrt(2*11*Math.max(0,brakingRoom)));
      const old=v.speed;v.speed+=clamp(pace-v.speed,-19*dt,(this.searching?5.5:9)*dt);
      const turn=clamp(error,-dt*(1.75+5/(2+v.speed)),dt*(1.75+5/(2+v.speed)));
      const yaw=v.yaw+turn;
      const step=Math.min(v.speed*dt,gap);
      const x=v.x+Math.sin(yaw)*step,z=v.z+Math.cos(yaw)*step;
      let blocked=false;
      if(clear(v,x,z,yaw)){v.x=x;v.z=z;v.yaw=yaw;}
      else{
        // A bumper can leave room to pull forward before there is room to turn.
        const sx=v.x+Math.sin(v.yaw)*step,sz=v.z+Math.cos(v.yaw)*step;
        if(step&&clear(v,sx,sz,v.yaw)){v.x=sx;v.z=sz;}
        else{if(clear(v,v.x,v.z,yaw))v.yaw=yaw;v.speed=Math.max(0,v.speed-28*dt);blocked=true;}
      }
      v.stuck=blocked&&pace>2.5?(v.stuck||0)+dt:0;
      if(v.stuck>.55&&range>8){v.backing=.85;v.stuck=0;v.trafficIn=0;}
      v.lean=(v.lean||0)+(clamp(turn/dt*v.speed*.004,-.09,.09)-(v.lean||0))*-Math.expm1(-7*dt);
      v.brakes+=(Number(pace<old-.4||v.speed<.9)-v.brakes)*-Math.expm1(-12*dt);
    }
  }
  window.BayPursuit=BayPursuit;
})();
