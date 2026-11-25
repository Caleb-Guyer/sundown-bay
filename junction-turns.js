/* Drivers turning across traffic read the opposing lanes from the start of the bend. */
(() => {
  "use strict";
  const routes=new WeakMap(),occupied=new Map();
  function remember(path,leg,before,corner,after){
    const dx=corner.x-before.x,dz=corner.z-before.z,length=Math.hypot(dx,dz);
    const ex=after.x-corner.x,ez=after.z-corner.z,out=Math.hypot(ex,ez);
    if(length<20||out<20||(dz*ex-dx*ez)/(length*out)>-.94)return;
    let turns=routes.get(path);
    if(!turns){turns=new Map();routes.set(path,turns);}
    const x=Math.round(corner.x/72),z=Math.round(corner.z/72);
    turns.set(leg,{x:corner.x,z:corner.z,ux:dx/length,uz:dz/length,ox:ex/out,oz:ez/out,
      junction:x+","+z,signal:BayStreetArt.signals.find(s=>s.x===x*72&&s.z===z*72)});
  }
  function opposing(turn,q){
    const dx=q.x-turn.x,dz=q.z-turn.z;
    const side=dx*turn.uz-dz*turn.ux;
    if(side> -2.6||side< -9.35)return false;
    return Math.sin(q.yaw)*turn.ux+Math.cos(q.yaw)*turn.uz<-.83;
  }
  const along=(turn,q)=>(q.x-turn.x)*turn.ux+(q.z-turn.z)*turn.uz;
  // A queue can leave room for the front of a car while stranding its tail in the box.
  function exitFull(v,vehicles,centerX,centerZ,ox,oz,laneX,laneZ){
    const body=bayCarLayout(v.kind);
    for(const q of vehicles){
      if(q===v||Math.abs(q.speed||0)>1.5||Math.abs(q.x-centerX)>22||Math.abs(q.z-centerZ)>22)continue;
      const ahead=(q.x-centerX)*ox+(q.z-centerZ)*oz;
      if(ahead<2.6||ahead>18.5)continue;
      const across=Math.abs((q.x-laneX)*oz-(q.z-laneZ)*ox);
      const other=q.footprint||bayCarLayout(q.kind);
      const cos=Math.abs(Math.sin(q.yaw)*ox+Math.cos(q.yaw)*oz),sin=Math.sqrt(Math.max(0,1-cos*cos));
      if(across>body.track+other.track*cos+other.halfLength*sin+.12)continue;
      if(ahead<7.1+body.halfLength*2+other.halfLength*cos+other.track*sin+.8)return true;
    }
    return false;
  }
  function straightDistance(v,vehicles,time,ux,uz,remaining){
    if(Math.abs(ux*uz)>.015)return Infinity;
    const x=Math.round(v.x/72)*72,z=Math.round(v.z/72)*72;
    const d=(x-v.x)*ux+(z-v.z)*uz;
    if(d<9.3||d>24||remaining<d+14||Math.abs(x)>144||Math.abs(z)>144||Math.abs((x-v.x)*uz-(z-v.z)*ux)>6.6)return Infinity;
    if(!v.boxCheck||v.boxCheck.path!==v.path||v.boxCheck.leg!==v.corner||time>=v.boxCheck.next){
      v.boxCheck={path:v.path,leg:v.corner,next:time+.18,full:exitFull(v,vehicles,x,z,ux,uz,v.x,v.z)};
    }
    return v.boxCheck.full?Math.max(0,d-10.4-bayCarLayout(v.kind).halfLength):Infinity;
  }
  function canInvite(v,player){
    const w=v.leftWait;
    if(!player||!w||w.player!==player||w.offered||w.committed||v.path!==w.path||v.corner!==w.leg)return false;
    return Math.abs(player.speed)<1.15&&Math.abs(v.speed)<2.2&&-along(w.turn,v)<w.stop+2.8&&along(w.turn,player)>5.8;
  }
  function waitingDriver(player,cars){return cars.find(v=>canInvite(v,player));}
  function offer(player,cars,time){
    const v=waitingDriver(player,cars);
    if(v){v.leftWait.offered=player;v.leftWait.until=time+6;v.leftWait.scan=0;}
    return v;
  }
  function distance(v,vehicles,player,time,ux=0,uz=0,remaining=0){
    const previous=v.leftWait;
    if(previous?.committed&&previous.path===v.path){
      const t=previous.turn,exit=(v.x-t.x)*t.ox+(v.z-t.z)*t.oz;
      if(exit<10.2&&Math.abs(v.x-t.x)<24&&Math.abs(v.z-t.z)<24)return Infinity;
      if(occupied.get(t.junction)===v)occupied.delete(t.junction);
      v.leftWait=null;
    }
    const turn=routes.get(v.path)?.get(v.corner);
    if(!turn){v.leftWait=null;return straightDistance(v,vehicles,time,ux,uz,remaining);}
    const to=-along(turn,v);
    if(to>24||to<5.24){v.leftWait=null;return straightDistance(v,vehicles,time,ux,uz,remaining);}
    let w=v.leftWait;
    if(!w||w.turn!==turn||w.path!==v.path){
      // At a marked crossing keep the full car behind the band while looking for a gap.
      const stop=turn.signal?10.45+bayCarLayout(v.kind).halfLength-along(turn,turn.signal):11.2;
      w=v.leftWait={turn,path:v.path,leg:v.corner,stop,scan:0,held:false,player:null,offered:null,committed:false};
    }
    if(w.committed)return Infinity;
    // Leave room for the nose of an opposite left-turner to swing into its exit lane.
    const stop=w.stop,gap=Math.max(0,to-stop);
    if(time>=w.scan){
      w.scan=time+.13;w.held=false;w.player=null;
      if(w.offered&&(player!==w.offered||Math.abs(player.speed)>1.3||time>w.until))w.offered=null;
      const red=turn.signal&&BayCrosswalk.trafficWait(turn.signal,time,Math.abs(turn.uz)>.7);
      if(red&&turn.signal.call&&to>=stop-.75){w.held=true;return gap;}
      // Opposite left turns cross near the middle of the rounded bends. Keep the
      // second car on its approach until the first car's tail clears its lane.
      const first=occupied.get(turn.junction);
      if(first&&first!==v&&first.leftWait?.committed&&first.leftWait.turn.junction===turn.junction&&first.path===first.leftWait.path)w.held=true;
      if(exitFull(v,vehicles,Math.round(turn.x/72)*72,Math.round(turn.z/72)*72,turn.ox,turn.oz,turn.x,turn.z))w.held=true;
      // Check every opposing lane. A flash only speaks for the driver's own line of cars.
      for(const q of vehicles){
        if(q===v||Math.abs(q.x-turn.x)>52||Math.abs(q.z-turn.z)>52||!opposing(turn,q))continue;
        const at=along(turn,q),speed=q.speed||0;
        if(at<-(q.footprint||bayCarLayout(q.kind)).halfLength-1.2||at>49)continue;
        if(!q.path&&q!==player&&Math.abs(speed)<.35&&at>3.8)continue;
        if(w.offered&&along(turn,w.offered)>5.8){
          const rel=BayDriving.local(w.offered,q.x,q.z);
          if(q===w.offered||rel.z<0&&Math.abs(rel.x)<1.7&&Math.abs(speed)<2.4)continue;
        }
        const horizon=(Math.max(to,stop)+4.5)/5.35+1.1;
        if(at>4.1+Math.max(q===player?4.5:2.2,speed)*horizon)continue;
        // Two opposite left turns can arrive together. Let the nearer one clear the bend first.
        const theirs=routes.get(q.path)?.get(q.corner);
        if(q!==player&&theirs&&Math.hypot(theirs.x-turn.x,theirs.z-turn.z)<10){
          const otherTo=-along(theirs,q);
          if(to<otherTo-.55||Math.abs(to-otherTo)<=.55&&v.id<q.id)continue;
        }
        if(q===player&&!red)w.player=q;
        w.held=true;
      }
      if(!w.held&&!red&&to<=stop+.38){
        w.committed=true;occupied.set(turn.junction,v);
        if(w.offered)v.thankedAt=v.headlightFlash=time;
      }
    }
    return w.held?gap:Infinity;
  }
  window.BayJunctionTurns={remember,distance,waitingDriver,offer};
})();
