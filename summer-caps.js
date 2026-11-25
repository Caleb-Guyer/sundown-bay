/* Three curbside splash posts share their runoff with the street drains. */
(() => {
  "use strict";
  const sites=[
    {id:"marlin",stand:"ocean",x:150.65,z:-17.0,yaw:-Math.PI/2,start:3,label:"Marlin",ink:"#c66849",voice:"Hey! The blue top came off. Hit the button by my paper stand!"},
    {id:"luna",stand:"luna",x:6.15,z:55.9,yaw:-Math.PI/2,start:24,label:"Cine Luna",ink:"#c49b4d",voice:"The front row just got soaked! The blue button stops it."},
    {id:"market",stand:"mercado",x:-52.3,z:-137.82,yaw:Math.PI,start:46,label:"Mercado",ink:"#689587",voice:"That was meant to wash my oranges. The blue button’s behind you!"}
  ];
  const recordKey="sundownBay.summerCaps.v1";
  const incidentKey=id=>"sundownBay.waterPost."+id;
  function savePost(s){
    try{
      const record=s.cap?{mode:s.mode,x:s.cap.x,z:s.cap.z,button:s.playerClosed===true}:null;
      localStorage.setItem(incidentKey(s.id),JSON.stringify(record));
    }catch{}
  }
  function readBook(){
    let plain;try{plain=JSON.parse(localStorage.getItem(recordKey));}catch{}
    return Object.fromEntries(sites.map(s=>[s.id,Number.isSafeInteger(plain?.[s.id])&&plain[s.id]>0?Math.min(99999,plain[s.id]):0]));
  }
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  class Caps{
    constructor(gutters){
      this.posts=sites.map(s=>({...s,button:BayDriving.world(s,1.7,-2.6),pool:gutters.pools.find(p=>p.id===s.id),
        mode:"idle",age:0,timer:0,pressure:0,cap:null,flow:"fan",lastSlot:-1,buttonDip:0,attending:false}));
      this.hand=null;this.book=readBook();
      this.byStand=new Map(this.posts.map(s=>[s.stand,s]));
      for(const s of this.posts){
        let q;try{q=JSON.parse(localStorage.getItem(incidentKey(s.id)));}catch{}
        if(!q||!["burst","closed"].includes(q.mode)||![q.x,q.z].every(Number.isFinite))continue;
        const floor=gap(s,q)<22?q:s.button;
        Object.assign(s,{mode:q.mode,flow:"burst",pressure:q.mode==="burst"?1:0,playerClosed:q.button===true,
          cap:{x:floor.x,z:floor.z,y:.105,yaw:s.yaw,vy:0,vx:0,vz:0,spin:.83,rest:true}});
      }
    }
    start(s){
      if(s.mode!=="idle")return false;
      Object.assign(s,{mode:"fan",flow:"fan",age:0,timer:17,buttonDip:.45});return true;
    }
    strike(s,v){
      if(s.cap||v.jumpFlight?.height>1.35||Math.abs(v.speed)<4.6||BayDriving.clearance(v,s)>.29)return false;
      const vx=Math.sin(v.yaw)*v.speed,vz=Math.cos(v.yaw)*v.speed;
      if((s.x-v.x)*vx+(s.z-v.z)*vz<=0)return false;
      const scale=Math.min(.57,5.5/Math.hypot(vx,vz));
      s.cap={x:s.x,z:s.z,y:.88,vx:vx*scale,vy:3.8,vz:vz*scale,yaw:v.yaw,spin:0};
      Object.assign(s,{mode:"burst",flow:"burst",age:0,attending:false,playerClosed:false});savePost(s);return true;
    }
    shut(s,player){
      if(s.mode!=="burst")return false;
      Object.assign(s,{mode:"closed",buttonDip:.45,playerClosed:player,age:0,attending:false});savePost(s);return true;
    }
    take(s,actor){
      if(s.mode!=="closed"||!s.cap?.rest||s.cap.carrier)return false;
      s.cap.lift={x:s.cap.x,z:s.cap.z,y:s.cap.y,t:0};s.cap.carrier=actor;return true;
    }
    seat(s,actor,player){
      if(s.cap?.carrier!==actor||gap(actor,s)>1.68)return false;
      if(player){
        this.hand=null;this.book=readBook();this.book[s.id]=Math.min(99999,this.book[s.id]+1);
        try{localStorage.setItem(recordKey,JSON.stringify(this.book));}catch{}
      }
      s.fitting={x:s.cap.x,z:s.cap.z,y:s.cap.y,t:0};
      Object.assign(s,{cap:null,mode:"idle",flow:"fan",timer:0,age:0,attending:false});savePost(s);return true;
    }
    drop(){
      if(!this.hand)return;
      const c=this.hand.cap;c.carrier=null;c.rest=false;c.vx=c.vz=c.vy=0;this.hand=null;
    }
    near(p){
      if(this.hand)return {s:this.hand,act:gap(p,this.hand)<1.64?"seat":"carry"};
      for(const s of this.posts){
        if(s.mode==="closed"&&s.cap?.rest&&!s.cap.carrier&&gap(p,s.cap)<1.45)return {s,act:"pick"};
        if(gap(p,s.button)<1.56)return {s,act:s.mode==="burst"?"shut":s.mode==="idle"?"start":s.mode};
      }
      return null;
    }
    wetAt(s,p){
      if(s.pressure<.09||Math.abs(p.x-s.x)>7||Math.abs(p.z-s.z)>7)return false;
      const q=BayDriving.local(s,p.x,p.z);
      if(s.flow==="burst")return q.x*q.x+(q.z-.8)**2<4.7*s.pressure;
      return q.z>-.05&&q.z<3.45*s.pressure+.3&&Math.abs(q.x)<.24+.44*q.z;
    }
    tick(dt,env){
      for(const s of this.posts){
        s.age+=dt;s.buttonDip=Math.max(0,s.buttonDip-dt);
        if(s.fitting&&(s.fitting.t+=dt)>=.40)s.fitting=null;
        if(!s.cap&&gap(s,env.focus)<85)for(const v of env.vehicles){
          if(Math.abs(v.x-s.x)<5&&Math.abs(v.z-s.z)<5&&this.strike(s,v)){env.hit(s,v);break;}
        }
        if(s.mode==="fan"&&(s.timer-=dt)<=0){s.mode="idle";s.age=0;}
        const target=s.mode==="burst"||s.mode==="fan"?1:0;
        s.pressure+=(target-s.pressure)*(-Math.expm1(-dt*(target?3.8:2.8)));
        if(s.pressure<.002)s.pressure=0;
        const inflow=s.flow==="burst" ? .22 : .065;
        const drainage=s.pool.cleared ? .21 : .060;
        s.pool.runoff=Math.max(0,Math.min(1,(s.pool.runoff||0)+dt*(target?inflow:-drainage)));
        if(env.glass&&this.wetAt(s,env.glass))env.driver.glassSplash=Math.max(env.driver.glassSplash||0,s.pressure*.98);
        if(s.pressure>.18&&gap(s,env.focus)<65)for(const p of env.walkers){
          if(p.onTour||p.sprayWait>0||!this.wetAt(s,p))continue;
          p.sprayWait=4;p.sprayAge=0;p.sprayFace=Math.atan2(s.x-p.x,s.z-p.z);
        }
        const c=s.cap;if(!c)continue;
        if(c.carrier){
          const q=BayDriving.world(c.carrier,.25,.33),lift=c.lift;
          c.x=q.x;c.z=q.z;c.y=.99;c.yaw=c.carrier.yaw;c.spin=0;
          if(lift){
            const u=Math.min(1,(lift.t+=dt)/.52),f=u*u*(3-2*u);
            c.x=lift.x+(q.x-lift.x)*f;c.z=lift.z+(q.z-lift.z)*f;c.y=lift.y+(.99-lift.y)*f;c.spin=.83*(1-f);
            if(u===1)c.lift=null;
          }
          continue;
        }
        if(c.rest)continue;
        for(const [axis,vel] of [["x","vx"],["z","vz"]]){
          const next=c[axis]+c[vel]*dt;
          if(env.clear(axis==="x"?next:c.x,axis==="z"?next:c.z,.19))c[axis]=next;else c[vel]*=-.4;
        }
        c.vy-=9.81*dt;c.y+=c.vy*dt;c.spin+=dt*(1+Math.hypot(c.vx,c.vz)*2);
        if(c.y<=.105){c.y=.105;c.vy=Math.abs(c.vy)*.34;const drag=Math.exp(-dt*4.7);c.vx*=drag;c.vz*=drag;
          if(c.vy<.20&&Math.hypot(c.vx,c.vz)<.10){c.rest=true;c.spin=.83;savePost(s);}}
      }
    }
    tend(stand,w,dt,street,env,clock){
      const s=this.byStand.get(stand.id);if(!s)return false;
      const slot=Math.floor(clock.total/75),appointed=clock.minute>=720&&clock.minute<1085&&clock.rain<.08&&(clock.total%75-s.start)>=0&&(clock.total%75-s.start)<19;
      const routine=s.mode==="idle"&&appointed&&s.lastSlot!==slot;
      if(w.bit||stand.phase!=="upright"||!(routine||s.mode==="burst"&&s.age>23||s.mode==="closed"&&s.age>(s.playerClosed?24:3)))return false;
      if(s.cap?.carrier&&s.cap.carrier!==w)return false;
      const target=routine||s.mode==="burst"?s.button:s.cap.carrier?s:s.cap;
      if(target===s.cap&&!s.cap.rest)return false;
      if(!street.walk(w,target,target===s.cap ? .96 : 1.05,dt,env)){s.attending=false;return true;}
      w.yaw=Math.atan2(target.x-w.x,target.z-w.z);
      s.attending=true;s.work=(s.work||0)+dt;
      if(s.work>=.85){
        s.work=0;s.attending=false;
        if(routine){this.start(s);s.lastSlot=slot;}
        else if(s.mode==="burst")this.shut(s,false);
        else if(s.cap.carrier)this.seat(s,w,false);
        else this.take(s,w);
      }
      return true;
    }
  }
  window.BaySummerCaps={Caps,sites,recordKey,readBook};
})();
