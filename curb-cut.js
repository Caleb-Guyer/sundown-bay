/* Board physics, local skaters and the two street parts filmed for Cine Luna. */
(() => {
  "use strict";
  const spots=BaySkateSpots,tau=Math.PI*2;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const damp=(a,b,k,dt)=>a+(b-a)*-Math.expm1(-k*dt),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const names={sol:["Nia Cruz","Luz Ramos"],market:["Teo Marín","Emi Soto"]};
  const requests={
    sol:[{tag:"flip-rail",name:"Kickflip onto the rail",bit:1},{tag:"bank-flip",name:"Kickflip off the bank",bit:2}],
    market:[{tag:"ledge",name:"Grind the loading ledge",bit:1},{tag:"manual",name:"Hold a two-metre manual",bit:2}]
  };
  const footprint=Object.freeze({track:.27,halfLength:.45});
  function read(raw){
    const number=n=>Number.isSafeInteger(n)?clamp(n,0,9999999):0;
    const best={},shots={};for(const s of spots.sites){best[s.id]=number(raw?.best?.[s.id]);shots[s.id]=Math.min(3,number(raw?.shots?.[s.id]));}
    return {deck:spots.sites.some(s=>s.id===raw?.deck)?raw.deck:"",best,shots,printed:number(raw?.printed),streetBest:number(raw?.streetBest)};
  }
  const siteAt=(x,z)=>spots.sites.find(s=>Math.abs(x-s.x)<6&&z>s.z-5&&z<s.z+29);
  function board(p,style,motion){
    return {x:p.x,y:p.y||0,z:p.z,yaw:p.yaw||0,kind:"skate",style,motion,footprint,speed:0,vx:0,vz:0,vy:0,
      air:0,flying:false,airAge:0,flipAt:-1,roll:0,pitch:0,bankPitch:0,lean:0,steer:0,wheelSpin:0,
      push:.1,effort:0,crouch:0,land:0,bail:0,manual:0,manualM:0,balance:0,grind:null,
      charging:false,charge:0,age:0,bankAir:false,mount:0,stow:false,chain:0,chainClock:0,words:[],last:""};
  }
  function featureTitle(r){return r.grind?.type==="pad"?"Ledge grind":"50–50";}
  function record(r,label,points,emit,tag=""){
    r.chain+=points;r.chainClock=2.45;r.words.push(label);if(r.words.length>6)r.words.shift();
    r.last=label;emit("trick",{label,points,chain:r.chain,tag});
  }
  function closeManual(r,emit){
    if(r.manualM>=1.6)record(r,"Manual",Math.min(108,Math.round(14+r.manualM*5.3)),emit,r.manualM>=2?"manual":"");
    r.manualM=r.manual=r.balance=0;
  }
  function closeGrind(r,emit){
    const g=r.grind;if(!g)return;
    if(g.m>=.8)record(r,featureTitle(r),Math.round(26+Math.min(10,g.m)*9),emit,g.type==="pad"?"ledge":g.flipIn?"flip-rail":"");
    r.grind=null;r.balance=0;
  }
  function launch(r,up,bank=false){
    r.flying=true;r.rollOff=false;r.vy=up;r.airAge=0;r.bankAir=bank;r.flipAt=-1;r.roll=0;r.pitch=bank?r.bankPitch:-.16;
  }
  function pop(r,emit){
    if(!r||!r.charging||r.bail||r.flying)return;
    const held=r.charge;r.charging=false;r.charge=0;
    closeManual(r,emit);closeGrind(r,emit);
    launch(r,4.70+2.45*held+Math.max(0,-r.bankPitch)*r.speed*.6);
    emit("pop");
  }
  function flick(r){
    if(!r?.flying||r.bail||r.flipAt>=0||r.vy<-.75)return false;
    r.flipAt=r.airAge;return true;
  }
  function bail(r,emit){
    if(r.bail>0)return;
    r.bail=1;r.speed*=.19;r.vy=r.air=r.roll=0;r.flying=r.charging=false;r.charge=r.manual=r.manualM=r.balance=0;
    r.grind=null;r.flipAt=-1;r.chain=r.chainClock=0;r.words.length=0;r.last="Bail";emit("bail");
  }
  function landed(r,emit){
    if(!r.flying)return;
    const flipped=r.flipAt>=0;
    if(flipped&&r.airAge-r.flipAt<.31){bail(r,emit);return;}
    r.flying=false;r.air=r.vy=r.roll=0;r.flipAt=-1;r.land=1;
    if(!r.rollOff||flipped)record(r,flipped?"Kickflip":r.bankAir?"Bank air":"Ollie",flipped?83:r.bankAir?39:24,emit,flipped&&r.bankAir?"bank-flip":"");
    r.rollOff=false;
    r.bankAir=false;emit("land");
  }
  function latch(r,s,feat,type,q,height,beforeY,afterY,emit){
    if(!r.flying||r.vy>0||r.speed<1.35||q.v<feat.v0-.12||q.v>feat.v1+.12||Math.abs(q.u-feat.u)>.42)return false;
    if(Math.abs(Math.sin(r.yaw-s.yaw))>.40||beforeY<height-.065||afterY>height+.035)return false;
    const flipIn=r.flipAt>=0;landed(r,emit);if(r.bail)return true;
    const dir=Math.cos(r.yaw-s.yaw)>=0?1:-1;
    const point=spots.at(s,feat.u,q.v);
    r.x=point.x;r.z=point.z;r.y=height;r.yaw=s.yaw+(dir<0?Math.PI:0);
    r.grind={site:s,feat,type,dir,m:0,flipIn};r.speed*=.97;r.balance=0;emit("lock",type);
    return true;
  }
  function skateStep(r,dt,input,env,emit){
    r.age+=dt;r.mount=Math.min(1,r.mount+dt*2.7);r.land=Math.max(0,r.land-dt*3.1);
    if(r.bail>0){
      r.bail=Math.max(0,r.bail-dt/1.06);r.y=env.floor(r.x,r.z);r.speed=damp(r.speed,0,8,dt);
      r.crouch=damp(r.crouch,0,5,dt);r.pitch=damp(r.pitch,0,8,dt);return;
    }
    const s=siteAt(r.x,r.z),p=s&&spots.local(s,r.x,r.z);
    const pavement=r.y,above=pavement+r.air;
    const oldX=r.x,oldZ=r.z,oldGrind=r.grind;
    const canPush=input.push&&!input.brake&&!r.stow&&!r.flying&&!r.grind&&!input.manual;
    r.effort=damp(r.effort,canPush?1:0,7,dt);
    if(canPush)r.push=(r.push+dt*(1.18+.036*r.speed))%1;
    const sand=!s&&r.x>164&&r.z<176;
    if(r.stow||input.brake)r.speed=Math.max(0,r.speed-(r.stow?10:8.5)*dt);
    else if(!r.flying){
      const accel=canPush?3.5+2.8*Math.sin(Math.PI*r.push)**2:0;
      r.speed=clamp(r.speed+(accel-(sand?1.65:.34)-.014*r.speed*r.speed+8.5*Math.sin(r.bankPitch))*dt,0,sand?5.5:11.9);
    }
    r.steer=damp(r.steer,input.turn,8.5,dt);
    if(!r.grind)r.yaw+=r.steer*(r.speed<.8?1.9:Math.min(2.27,.86+r.speed*.16))*dt*(r.flying?.20:1);
    r.lean=damp(r.lean,r.grind?-.20*r.balance:r.steer*Math.min(.37,.045*r.speed),8,dt);
    const dx=Math.sin(r.yaw)*r.speed*dt,dz=Math.cos(r.yaw)*r.speed*dt;
    if((dx||dz)&&!env.clear(r,r.x+dx,r.z+dz,r.air)){
      if(r.speed>3.2)bail(r,emit);else r.speed=0;
      r.vx=r.vz=0;return;
    }
    r.x+=dx;r.z+=dz;r.vx=dx/dt;r.vz=dz/dt;r.wheelSpin+=r.speed*dt/.031;
    const q=s&&spots.local(s,r.x,r.z),base=env.floor(r.x,r.z),range=dist(r,{x:oldX,z:oldZ});
    const rise=clamp((base-pavement)/Math.max(.045,range),-.52,.52);
    if(r.charging){r.charge=Math.min(1,r.charge+dt/.46);r.crouch=damp(r.crouch,.40+.58*r.charge,15,dt);}
    else r.crouch=damp(r.crouch,r.land*.60+(r.mount<1?(1-r.mount)*.3:0),10,dt);
    if(r.grind){
      const g=r.grind,p=spots.local(g.site,r.x,r.z);
      g.m+=range;r.y=g.site.y+g.feat.h;r.air=0;r.pitch=damp(r.pitch,0,9,dt);
      r.balance=clamp(r.balance+(input.turn*1.6+Math.sin(g.m*.72+.2)*.23)*dt,-1.2,1.2);
      if(Math.abs(r.balance)>1){bail(r,emit);return;}
      if(p.v<g.feat.v0||p.v>g.feat.v1||r.speed<.55){closeGrind(r,emit);r.flying=r.rollOff=true;r.vy=-.22;r.air=r.y-base;r.y=base;r.airAge=0;r.flipAt=-1;r.bankAir=false;}
    }else if(r.flying){
      r.airAge+=dt;
      const nextY=above+r.vy*dt-7.7*dt*dt;r.vy-=15.4*dt;
      const locked=s&&[["rail",s.rail],["pad",s.pad]].some(([type,f])=>latch(r,s,f,type,q,s.y+f.h,above,nextY,emit));
      if(!locked){
        r.y=base;r.air=Math.max(0,nextY-base);
        r.pitch=damp(r.pitch,clamp(-r.vy*.055,-.30,.24),8,dt);
        if(r.flipAt>=0)r.roll=tau*clamp((r.airAge-r.flipAt)/.41,0,1);
        if(r.vy<=0&&nextY<=base+.008)landed(r,emit);
      }
    }else{
      r.y=base;r.air=0;
      const bankLip=s&&p.v<s.bank.v1&&q.v>=s.bank.v1&&Math.abs(q.u-s.bank.u)<s.bank.w*.5;
      if(bankLip&&r.speed>3.65){closeManual(r,emit);r.charging=false;r.charge=0;launch(r,1.8+Math.min(2.2,r.speed*.23),true);}
      if(s&&!r.flying&&r.speed>1){
        for(const f of [s.rail,s.pad]){
          if(Math.abs(q.u-f.u)<.22&&((p.v<f.v0&&q.v>=f.v0)||(p.v>f.v1&&q.v<=f.v1))){bail(r,emit);return;}
        }
      }
      if(!r.flying&&input.manual&&r.speed>1.75&&!r.charging){
        r.manual=damp(r.manual,1,6,dt);r.manualM+=range;
        r.balance+=dt*(Math.sin(r.age*1.75)*.35+input.turn*1.40+.055*Math.min(11,r.manualM));
        if(Math.abs(r.balance)>1)closeManual(r,emit);
      }else if(r.manualM)closeManual(r,emit);
      if(!r.flying){
        r.bankPitch=damp(r.bankPitch,-Math.atan(rise),11,dt);
        r.pitch=damp(r.pitch,r.bankPitch-.23*r.manual,12,dt);
      }
    }
    if(!r.flying&&!r.grind&&!r.manualM&&r.chain>0){
      r.chainClock-=dt;
      if(r.chainClock<=0){emit("chain",r.chain);r.chain=0;r.words.length=0;}
    }
    if(oldGrind&&!r.grind)r.bankPitch=0;
  }
  function localCrew(site){
    const mark=spots.at(site,-2.82,2.25),r=board({...mark,yaw:site.yaw},site.id,new BayPlayerMotion());
    const [filmerName,skaterName]=names[site.id];
    r.name=skaterName;r.mount=1;
    const filmer={...site.stand,yaw:site.yaw+.47,style:site.id,name:filmerName,motion:new BayPlayerMotion(),weight:.22};
    return {site,r,filmer,i:11,rest:site.id==="sol"?1.7:4,lap:0,popped:false};
  }
  function rollLocal(c,dt,env,hold){
    const {r,site:s}=c,q=spots.local(s,r.x,r.z),to=s.loop[c.i];
    if(c.rest>0){c.rest=Math.max(0,c.rest-dt);r.speed=damp(r.speed,0,6,dt);r.effort=damp(r.effort,0,5,dt);if(!c.rest&&hold)c.rest=.4;return;}
    const dest=spots.at(s,to.u,to.v),dx=dest.x-r.x,dz=dest.z-r.z,d=Math.hypot(dx,dz);
    if(d<.22){c.i=(c.i+1)%s.loop.length;if(c.i===0)c.i=1;
      if(to.u< -2.5&&to.v>1&&to.v<3){c.rest=3.1;c.lap++;c.popped=false;}return;}
    const runway=c.i>=1&&c.i<=4;
    if(!r.grind){const a=Math.atan2(dx,dz);r.yaw+=turn(r.yaw,a)*-Math.expm1(-18*dt);}
    r.speed=damp(r.speed,runway?4.6:2.55,4,dt);
    const input={push:false,brake:false,turn:0,manual:false};
    if(runway&&!c.popped&&q.v>=s.rail.v0-1.65){r.charging=true;r.charge=.26;pop(r,()=>{});c.popped=true;}
    if(r.flying&&r.bankAir&&c.lap%2===0&&r.airAge>.035)flick(r);
    skateStep(r,dt,input,env,()=>{});
    r.push=(r.push+dt*1.26)%1;r.effort=damp(r.effort,r.flying||r.grind?0:.65,6,dt);
  }
  class Session{
    constructor(memory){
      this.saved=memory;this.rider=null;this.run=null;this.crew=spots.sites.map(localCrew);this.message="";this.show=0;
    }
    nearStand(p,radius=2.8){return this.crew.find(c=>dist(c.filmer,p)<radius);}
    clearPeople(from,x,z){
      const s=siteAt(x,z);if(!s)return true;
      const c=this.crew.find(c=>c.site===s);
      for(const p of [c.filmer,c.r]){
        if(p===c.r&&c.rest<=0)continue;
        const gap=Math.hypot(x-p.x,z-p.z);
        if(gap<.52&&gap<dist(from,p)-.00001)return false;
      }
      return true;
    }
    carry(style){this.saved.deck=style;}
    mount(p,style=this.saved.deck){if(!style||this.rider)return false;
      this.rider=board(p,style,p.motion);this.rider.player=true;return true;}
    request(id){return requests[id].find(q=>!(this.saved.shots[id]&q.bit));}
    prep(site){
      this.carry(site.id);this.run={site,phase:"mark",clock:0,score:0,kinds:new Set(),lens:false,why:"",take:0,call:this.request(site.id),hit:false};return this.run;
    }
    mark(p){
      const w=this.run,r=this.rider;
      if(!w||w.phase!=="mark"||dist(p,w.site.start)>2.0||r&&(r.speed>1.6||r.flying||r.grind||r.bail))return false;
      if(!this.rider)this.mount(p);
      if(!this.rider)return false;
      w.phase="set";w.clock=0;w.score=0;w.kinds.clear();w.take++;w.call=this.request(w.site.id);w.hit=false;w.from={x:p.x,z:p.z,yaw:p.yaw};
      Object.assign(this.rider,{stow:false,charging:false,charge:0,manual:0,manualM:0,balance:0,bankPitch:0});return true;
    }
    charge(){const r=this.rider;if(r&&!r.bail&&!r.stow&&!r.flying&&!r.charging&&!["set","ready"].includes(this.run?.phase)){r.charging=true;r.charge=0;}}
    pop(emit){pop(this.rider,(kind,value)=>this.event(kind,value,emit));}
    flick(){return flick(this.rider);}
    retake(){if(!this.run)return;this.run.phase="mark";this.run.clock=0;this.run.lens=false;}
    event(kind,e,emit){
      const w=this.run;
      if(kind==="trick"){
        if(w?.phase==="roll"){w.score+=e.points;w.kinds.add(e.label);if(w.call&&w.call.tag===e.tag)w.hit=true;}
        this.message=e.label+"  +"+e.points;this.show=1.2;
      }else if(kind==="chain"&&e>this.saved.streetBest){this.saved.streetBest=e;emit("save");}
      else if(kind==="bail"){
        this.message="Bail";this.show=1.5;
        if(w?.phase==="roll"){w.phase="miss";w.why="The board got away.";w.lens=false;emit("cut");}
      }
      emit(kind,e);
    }
    step(dt,input,env){
      const w=this.run,r=this.rider,hero=env.hero;this.show=Math.max(0,this.show-dt);
      for(const crew of this.crew){
        const s=crew.site,here=dist(hero,s)<69,filming=w?.site===s&&["set","roll","tail"].includes(w.phase);
        rollLocal(crew,dt,env.local,w?.site===s&&!["miss","review"].includes(w.phase));
        const a=crew.filmer,subject=filming&&r?r:crew.r,look=here&&!filming&&dist(hero,a)<3.1?hero:subject;
        a.yaw+=turn(a.yaw,Math.atan2(look.x-a.x,look.z-a.z))*-Math.expm1(-5*dt);
        a.weight=damp(a.weight,look===hero?.16:filming||!crew.rest?.98:.22,6,dt);
        if(here)a.motion.step(dt,0,0);
      }
      if(!r)return;
      if(w?.phase==="set"){
        w.clock+=dt;const n=Math.min(1,w.clock/.56),f=n*n*(3-2*n);
        r.x=w.from.x+(w.site.start.x-w.from.x)*f;r.z=w.from.z+(w.site.start.z-w.from.z)*f;
        r.y=env.floor(r.x,r.z);r.yaw=w.from.yaw+turn(w.from.yaw,w.site.yaw)*f;r.speed=0;r.mount=f;r.crouch=.25*Math.sin(Math.PI*f);
        if(n===1){w.phase="ready";w.clock=0;r.mount=1;r.words.length=0;r.chain=0;}
      }else{
        if(w?.phase==="ready"&&input.push){w.phase="roll";w.clock=0;env.emit("action",w);}
        if(w?.phase!=="ready")skateStep(r,dt,input,env,(k,e)=>this.event(k,e,env.emit));
      }
      Object.assign(hero,{x:r.x,y:r.y+r.air,z:r.z,yaw:r.yaw});
      if(r.stow&&!r.flying&&!r.grind&&r.speed<1.05&&!r.bail){
        closeManual(r,(k,e)=>this.event(k,e,env.emit));this.rider=null;
        if(w&&!["mark","review","miss"].includes(w.phase)){w.phase="mark";w.lens=false;env.emit("cut");}
        env.emit("off");return;
      }
      if(w?.phase==="roll"){
        w.clock+=dt;const q=spots.local(w.site,r.x,r.z);
        if(q.v>=25.40&&q.v<=32&&Math.abs(q.u)<w.site.half+.65&&!r.flying&&!r.grind&&!r.bail){
          closeManual(r,(k,e)=>this.event(k,e,env.emit));
          if(w.kinds.size>=2&&w.score>=55){w.phase="tail";w.clock=0;}
          else{w.phase="miss";w.why="Land two different tricks before the white stripe.";w.lens=false;env.emit("cut");}
        }else if(w.clock>42||q.v< -9||q.v>36||Math.abs(q.u)>13){
          w.phase="miss";w.why="The line went out of the shot.";w.lens=false;env.emit("cut");
        }
      }else if(w?.phase==="tail"&&(w.clock+=dt)>=.40){
        w.phase="review";w.lens=false;this.saved.printed++;
        w.bonus=w.hit&&w.call&&!(this.saved.shots[w.site.id]&w.call.bit)?40:0;
        if(w.bonus)this.saved.shots[w.site.id]|=w.call.bit;
        this.saved.best[w.site.id]=Math.max(this.saved.best[w.site.id],w.score);env.emit("wrap",w);
      }
    }
  }
  window.BaySkate={Session,read,siteAt,names,requests};
})();
