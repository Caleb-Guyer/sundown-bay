/* Each junction keeps its own pedestrian call and resumes the interrupted traffic cycle. */
(() => {
  "use strict";
  const corners=9.15,half=7,mod=(a,b)=>((a%b)+b)%b;
  const base=(s,t)=>mod(t+s.offset-(s.walkDelay||0),14);
  const lastCorner=(s,p)=>Math.max(Math.abs(p.x-s.x),Math.abs(p.z-s.z))<10.5;
  function button(signals,p){
    for(const s of signals){
      const dx=Math.abs(p.x-s.x)-corners,dz=Math.abs(p.z-s.z)-corners;
      if(dx*dx+dz*dz<1.75**2)return s;
    }
    return null;
  }
  function call(s,t){
    if(s.call)return false;
    const earliest=Math.max(t+1.8,s.nextWalk||0);
    const start=earliest+(half-mod(base(s,earliest),half))%half;
    s.call={start,open:null,end:0};return true;
  }
  function phase(s,t){
    const q=s.call;if(!q)return "idle";
    if(t<q.start)return "queued";if(q.open===null)return "clear";
    return t<q.open+4.4?"walk":"finish";
  }
  function lamps(s,t){
    const q=s.call;
    if(q&&t>=q.start)return "red";
    const direction=base(s,t)<half?"ns":"ew";
    return q&&q.start-t<=1.65?direction+"-amber":direction;
  }
  function waiting(s,t,vertical){return lamps(s,t)!==(vertical?"ns":"ew");}
  function watchTraffic(signals,vehicles){
    // A long coach can still be crossing when the lamps change. Test the
    // footprint against the center of the junction, including a turning tail.
    for(const s of signals){
      s.crossingEastWest=s.crossingNorthSouth=false;
      for(const v of vehicles){
        const dx=Math.abs(v.x-s.x),dz=Math.abs(v.z-s.z);
        if(dx>10||dz>10)continue;
        const sh=v.footprint||bayCarLayout(v.kind),sn=Math.abs(Math.sin(v.yaw)),cs=Math.abs(Math.cos(v.yaw));
        if(dx>=3.4+sn*sh.halfLength+cs*sh.track||dz>=3.4+cs*sh.halfLength+sn*sh.track)continue;
        if(sn>.46)s.crossingEastWest=true;
        if(cs>.46)s.crossingNorthSouth=true;
        if(s.crossingEastWest&&s.crossingNorthSouth)break;
      }
    }
  }
  const trafficWait=(s,t,vertical)=>waiting(s,t,vertical)||(vertical?s.crossingEastWest:s.crossingNorthSouth);
  function setback(s,halfLength,normal){return s.call?10.05+halfLength:normal;}
  function beforeLine(s,d,line,normal,speed){
    // A new call can move the line behind a car already waiting at the old one.
    return d>line-1.4||s.call&&d>normal-1.4&&Math.abs(speed||0)<.9;
  }
  function update(s,t,moving,people,player){
    const q=s.call;if(!q||t<q.start+1.3)return;
    if(q.open===null){
      // Let cars that were already in the junction exit before showing WALK.
      if(moving.some(c=>Math.abs(c.speed||0)>1.2&&lastCorner(s,c)))return;
      q.open=t;q.end=t+14.35;return;
    }
    if(t<q.end)return;
    const occupied=p=>p&&Math.min(Math.abs(p.x-s.x),Math.abs(p.z-s.z))<7.05&&lastCorner(s,p);
    if(t<q.open+23&&(people.some(w=>w.crossing?.signal===s&&w.crossing.entered&&!w.onTour&&occupied(w))||occupied(player)))return;
    s.walkDelay=mod((s.walkDelay||0)+t-q.start,14);s.nextWalk=t+14;s.call=null;
  }
  // Return a crossing only for a route that goes to the opposite sidewalk on the marked band.
  function intent(p,signals){
    const dest=p.path[p.index],x=dest[0]+p.offset,z=dest[1]+p.offset,dx=x-p.x,dz=z-p.z;
    const alongX=Math.abs(dx)>Math.abs(dz)*3,alongZ=Math.abs(dz)>Math.abs(dx)*3;
    if(!alongX&&!alongZ)return null;
    const axis=alongX?"x":"z",side=alongX?"z":"x",sign=Math.sign(alongX?dx:dz);
    for(const signal of signals){
      const lateral=Math.abs(p[side]-signal[side]),at=(p[axis]-signal[axis])*sign;
      const far=((alongX?x:z)-signal[axis])*sign;
      if(lateral>=6.65&&lateral<=10.4&&at>=-10.35&&at<7.65&&far>=7.55)return {signal,axis,sign,at};
    }
    return null;
  }
  function ready(p,t,signals,cars,driver,dt){
    let r=p.crossing;
    if(r&&r.index!==p.index)p.crossing=r=null;
    if(!r){
      const hit=intent(p,signals);if(!hit)return true;
      r=p.crossing={...hit,index:p.index,entered:hit.at> -6.9,arrival:t,wave:0};
    }
    const s=r.signal,at=(p[r.axis]-s[r.axis])*r.sign;
    if(at>=7.65){p.crossing=null;return true;}
    if(r.entered)return true;
    if(!s.call)call(s,t);
    const dx=r.axis==="x"?r.sign:0,dz=r.axis==="z"?r.sign:0;
    const blocked=c=>{
      if(Math.abs(c.x-p.x)>22||Math.abs(c.z-p.z)>22)return false;
      const side=r.axis==="x"?"z":"x",lateral=c[side]-p[side],ahead=(c[r.axis]-p[r.axis])*r.sign;
      if(ahead<-.1||ahead>7.8)return false;
      const velocity=c===driver?(r.axis==="x"?c.vz:c.vx):Math.abs(c.speed||0)*(r.axis==="x"?Math.cos(c.yaw):Math.sin(c.yaw));
      const reach=(c.footprint?.halfLength||2.25)+.45;
      return Math.abs(lateral)<reach||Math.abs(velocity)>.7&&lateral*velocity<0&&Math.abs(lateral)<reach+Math.abs(velocity)*1.15;
    };
    if(phase(s,t)!=="walk"||t-s.call.open<.20+.5*(p.reactionBeat??.5)||cars.some(blocked)||driver&&blocked(driver)){
      const look=(Math.sin((t-r.arrival)*2.15+p.phase)>.15?.68:-.68);
      p.yaw+=Math.atan2(Math.sin(Math.atan2(dx,dz)+look-p.yaw),Math.cos(Math.atan2(dx,dz)+look-p.yaw))*(1-Math.exp(-6*dt));
      p.gesture=t-r.arrival<.52?1:0;return false;
    }
    r.entered=true;
    if(driver&&Math.abs(driver.speed)<.7){
      const forward=(p.x-driver.x)*Math.sin(driver.yaw)+(p.z-driver.z)*Math.cos(driver.yaw);
      if(forward>0&&forward<13&&Math.hypot(p.x-driver.x,p.z-driver.z)<15)r.wave=t+1.25;
    }
    return true;
  }
  window.BayCrosswalk={corners,button,call,phase,lamps,waiting,watchTraffic,trafficWait,setback,beforeLine,update,ready};
})();
