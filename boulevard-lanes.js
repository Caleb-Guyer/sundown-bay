/* Ordinary motorists use the two painted lanes on Ocean Drive, Luna Boulevard, Tideway and Pier Road. */
(() => {
  "use strict";
  const outside=2.76,clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const stations=[-144,-72,0,72,144];
  function street(v,from,ux,uz,remaining){
    if(Math.abs(ux*uz)>.002||v.z>178||v.z< -177||v.x< -177||v.x>151)return null;
    const vertical=Math.abs(uz)>.99,road=vertical?from.x:from.z,sign=vertical?uz:-ux;
    const axis=Math.abs(road)<7?0:144;
    if(Math.abs((road-axis)*sign-2.5)>.40||!vertical&&v.x>139)return null;
    const coordinate=vertical?v.z:v.x,dir=vertical?uz:ux;
    let ahead=remaining,behind=Infinity;
    for(const cross of stations){
      const d=(cross-coordinate)*dir;if(d>=0)ahead=Math.min(ahead,d);else behind=Math.min(behind,-d);
    }
    return {ahead,behind,vertical};
  }
  const shape=v=>v.footprint||bayCarLayout(v.kind);
  function components(v,q,ux,uz){
    const dx=q.x-v.x,dz=q.z-v.z,s=Math.sin(q.yaw),c=Math.cos(q.yaw),body=shape(q);
    const along=s*ux+c*uz,across=s*uz-c*ux;
    return {f:dx*ux+dz*uz,r:dx*uz-dz*ux,velocity:along*(q.speed||0),
      half:Math.abs(along)*body.halfLength+Math.abs(across)*body.track,width:Math.abs(across)*body.halfLength+Math.abs(along)*body.track};
  }
  function room(v,ux,uz,delta,vehicles){
    const body=shape(v);
    for(const q of vehicles){
      if(q===v||Math.abs(q.x-v.x)>38||Math.abs(q.z-v.z)>38)continue;
      const b=components(v,q,ux,uz),width=body.track+b.width+.26;
      const movingAcross=q.lanes?.change&&Math.cos(q.yaw-v.yaw)>.9;
      const next=movingAcross?b.r+(q.lanes.change.to-q.lanes.offset):b.r;
      if(Math.min(b.r,next)>delta+width||Math.max(b.r,next)<delta-width)continue;
      const l=body.halfLength+b.half+.8,closing=v.speed-b.velocity;
      if(b.f>=0?b.f<l+1.65+Math.max(0,closing)*1.65:-b.f<l+1.0+Math.max(0,-closing)*2.0)return false;
    }
    return true;
  }
  function obstruction(v,ux,uz,vehicles){
    let best=null,nearest=25;
    for(const q of vehicles){
      if(q===v||Math.abs(q.x-v.x)>26||Math.abs(q.z-v.z)>26)continue;
      const b=components(v,q,ux,uz);
      if(b.f<.1||b.f>=nearest||Math.abs(b.r)>shape(v).track+b.width+.12)continue;
      // Keep a line of cars stopped by a light or a pedestrian crossing intact.
      if(q.path&&(q.speed<1.2||q.brakes>.40||v.pace-b.velocity<1.8)||b.velocity>v.pace-1.3)continue;
      if(q.kind==="cruiser"||q.responseLights||q.towRig||q.jumpFlight)continue;
      nearest=b.f;best={body:q,distance:b.f,half:b.half};
    }
    return best;
  }
  function tailClear(v,ux,uz,distance,vehicles){
    const car=shape(v);
    for(const q of vehicles){
      if(q===v||Math.abs(q.x-v.x)>18||Math.abs(q.z-v.z)>18)continue;
      const b=components(v,q,ux,uz);
      if(b.f<=0&&Math.abs(b.r)<car.track+b.width+.22&&-b.f<car.halfLength+b.half+distance+Math.max(0,b.velocity)*1.1+.85)return false;
    }
    return true;
  }
  function start(v,s,goal,ux,uz,time,obstacle){
    s.change={to:goal,from:s.offset,x:v.x,z:v.z,ux,uz,begin:time+.58,length:7.8+Math.min(2.5,v.speed*.18),obstacle};
    if(obstacle)s.passed=obstacle;
  }
  function candidate(player,cars,time){
    if(!player?.indicator||Math.abs(player.speed)>15||player.reversing)return null;
    let answer=null,distance=Infinity;
    for(const v of cars){
      const s=v.lanes;if(!s||v===player||!v.path||!v.owner||v.owner.phase!=="drive"||s.change||s.reverse||v.reaction||v.wantsCurb||time<(v.lastMergeAsk??-30)+7)continue;
      if(Math.abs(v.x-player.x)>27||Math.abs(v.z-player.z)>27||Math.cos(v.yaw-player.yaw)<.89)continue;
      const q=BayDriving.local(v,player.x,player.z),width=Math.abs(q.x);
      if(q.z<2.8||q.z>24||q.z>=distance||width<1.55||width>5.45||Math.sign(q.x)===player.indicator)continue;
      // The request must point into this driver's lane on the same side of the median.
      if(2.5+s.offset+q.x<.75||2.5+s.offset+q.x>7.9)continue;
      if(s.ahead<10||s.behind<8||v.speed>3&&q.z/v.speed<.72)continue;
      answer=v;distance=q.z;
    }
    return answer;
  }
  function ask(player,cars,time){
    const v=candidate(player,cars,time);
    if(v){v.lanes.yield={player,signal:player.indicator,until:time+7.5,entered:false};v.mergeFlash=v.lastMergeAsk=time;}
    return v;
  }
  function update(v,ctx){
    const {ux,uz,from,remaining,offset,time,vehicles}=ctx;
    if(!v.cityLanes||v.wantsCurb||v.findLane||v.impactSlide||ctx.override||!v.path){v.lanes=null;return null;}
    const area=street(v,from,ux,uz,remaining);
    if(!area){v.lanes=null;return null;}
    let s=v.lanes;
    if(!s||s.path!==v.path||s.leg!==v.corner){
      s=v.lanes={path:v.path,leg:v.corner,lane:0,change:null,passed:null,scan:-1,yield:null};
    }
    s.offset=offset;s.ahead=area.ahead;s.behind=area.behind;s.gap=Infinity;s.max=Infinity;s.skip=null;s.signal=0;s.goal=s.lane;s.slope=0;s.back=false;
    if(s.reverse){
      const a=s.reverse,b=components(v,a.body,ux,uz);
      if(time>a.deadline||Math.abs(b.r)>shape(v).track+b.width+.10||Math.abs(a.body.speed)>.85){
        s.reverse=null;s.scan=time+.5;
      }else if(b.f>=a.gap){
        s.reverse=null;start(v,s,a.to,ux,uz,time,a.body);
      }else{
        s.signal=Math.sign(a.to-offset);s.max=0;
        s.back=time>a.ready&&tailClear(v,ux,uz,.65,vehicles);
        return s;
      }
    }
    const y=s.yield;
    if(y){
      const p=BayDriving.local(v,y.player.x,y.player.z);
      if(time>=y.until||ctx.player!==y.player||p.z<-.5||p.z>33||Math.abs(p.x)>6||Math.cos(y.player.yaw-v.yaw)<.68){s.yield=null;}
      else{
        if(Math.abs(p.x)<1.4&&!y.entered){y.entered=true;y.until=Math.min(y.until,time+1.3);}
        if(y.entered&&Math.abs(p.x)<.82&&Math.cos(y.player.yaw-v.yaw)>.98&&Math.abs(y.player.steer||0)<.10&&y.player.indicator===y.signal){
          y.player.indicator=0;y.player.signalFrom=null;y.player.signalTurned=false;
        }
        s.max=clamp((p.z-6.6)*.67,0,Math.max(0,v.pace-1.15));return s;
      }
    }
    if(s.change){
      const a=s.change;
      s.signal=Math.sign(a.to-a.from);s.max=Math.min(v.pace,6.4);
      if(time<a.begin){s.goal=a.from;return s;}
      if(!a.moving){
        if(!room(v,ux,uz,a.to-offset,vehicles)){
          s.max=0;s.goal=a.from;
          if(time-a.begin>1.2){s.change=null;s.passed=null;s.scan=time+.35;}
          return s;
        }
        a.moving=true;a.x=v.x;a.z=v.z;
      }
      const d=(v.x-a.x)*ux+(v.z-a.z)*uz;
      s.skip=a.obstacle;
      // Drive the tangent of a cubic lane change. The front wheels straighten at both ends.
      const u=clamp(d/a.length,0,1),blend=u*u*(3-2*u);
      s.goal=a.from+(a.to-a.from)*blend;
      s.slope=(a.to-a.from)*6*u*(1-u)/a.length;
      if(u===1&&Math.abs(offset-a.to)<.10){s.lane=a.to;s.change=null;s.scan=time+.85;s.signal=0;}
      return s;
    }
    if(s.passed){
      const b=s.passed,along=(b.x-v.x)*ux+(b.z-v.z)*uz;
      if(along<-(shape(v).halfLength+shape(b).halfLength+3.3)||Math.abs(b.x-v.x)+Math.abs(b.z-v.z)>45)s.passed=null;
    }
    const turnIn=s.lane>1&&remaining<24,block=area.ahead>12&&area.behind>9;
    if(turnIn&&remaining<9)s.gap=Math.max(0,remaining-4);
    if(time<s.scan)return s;
    s.scan=time+.30+(v.id%4)*.044;
    const hazard=block?obstruction(v,ux,uz,vehicles):null;
    // A little extra nose room lets a stopped driver pull out without crossing bumpers.
    if(hazard&&hazard.distance<20)s.hold={q:hazard.body,until:time+.55};
    else s.hold=null;
    const space=block&&area.ahead>19&&area.behind>11&&remaining>22;
    const preference=v.id%3===0?outside:0;
    let next=s.lane;
    if(turnIn)next=0;
    else if(hazard&&space)next=s.lane>1?0:outside;
    else if(!s.passed&&space&&remaining>35&&area.ahead>23)next=preference;
    if(next===s.lane||s.passed&&!turnIn&&hazard?.body===s.passed||!room(v,ux,uz,next-offset,vehicles))return s;
    if(hazard&&hazard.distance<shape(v).halfLength+hazard.half+4.5){
      const gap=shape(v).halfLength+hazard.half+4.9;
      if(v.speed<.35&&Math.abs(hazard.body.speed)<.3&&area.behind>14&&tailClear(v,ux,uz,gap-hazard.distance,vehicles)){
        s.reverse={body:hazard.body,to:next,gap,ready:time+.75,deadline:time+10};s.max=0;
      }
      return s;
    }
    const ignored=hazard?.body||null;
    start(v,s,next,ux,uz,time,ignored);s.signal=Math.sign(next-offset);return s;
  }
  function holdGap(v,s,ux,uz,time){
    if(!s.hold||s.change?.moving||s.hold.until<time)return Infinity;
    const b=components(v,s.hold.q,ux,uz);
    return Math.abs(b.r)>shape(v).track+b.width+.15?Infinity:Math.max(0,b.f-b.half-shape(v).halfLength-4.6);
  }
  function flash(v,time){const t=time-v.mergeFlash;return t>=0&&(t<.22||t>.39&&t<.66);}
  window.BayBoulevardLanes={update,holdGap,candidate,ask,flash};
})();
