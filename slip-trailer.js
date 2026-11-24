/* A single-axle trailer pivots at the towing vehicle's rear ball. */
(() => {
  "use strict";
  const tongueLength=3.86,world=BayDriving.world,local=BayDriving.local;
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const compatible=v=>!!v&&["stepside","estate","van"].includes(v.kind);
  const ball=v=>world(v,0,-bayCarLayout(v.kind).halfLength-.23);
  const coupler=t=>world(t,0,tongueLength);
  const bedShape={halfLength:2.24,track:1.06},neckShape={halfLength:.91,track:.42};
  function pieces(t){
    return [{...world(t,0,.16),yaw:t.yaw,footprint:bedShape},{...world(t,0,2.99),yaw:t.yaw,footprint:neckShape}];
  }
  function fits(t,clear){return pieces(t).every(clear);}
  function pinned(t,v){
    const p=ball(v),yaw=wrap(Math.atan2(p.x-t.x,p.z-t.z));
    return {x:p.x-tongueLength*Math.sin(yaw),z:p.z-tongueLength*Math.cos(yaw),yaw};
  }
  function hitchable(t,v){
    if(!compatible(v)||Math.abs(v.speed)>1.05)return false;
    const a=coupler(t),b=ball(v);
    return Math.hypot(a.x-b.x,a.z-b.z)<1.55&&Math.abs(wrap(v.yaw-t.yaw))<.61;
  }
  class Trailer{
    constructor(spot){Object.assign(this,spot,{y:0,pitch:0,lean:0,wheelSpin:0,hitched:null,brake:0,signal:0,load:true});}
    attach(v,clear){
      if(this.hitched||!hitchable(this,v))return false;
      const p=pinned(this,v);if(!fits(p,clear))return false;
      Object.assign(this,p);this.towYaw=v.yaw;this.hitched=v;v.trailerLoad=this.load?1:.35;return true;
    }
    detach(){if(this.hitched)delete this.hitched.trailerLoad;this.hitched=null;this.brake=this.signal=0;}
    follow(v,clear,beginTrial){
      if(v!==this.hitched)return true;
      let p=pinned(this,v);
      const before=pieces(this),limit=Math.max(1.13,Math.abs(wrap(this.yaw-(this.towYaw??v.yaw)))+.00001);
      const free=q=>{
        beginTrial?.();
        return Math.abs(wrap(q.yaw-v.yaw))<=limit&&fits(q,(part,i)=>clear(part,before[i]));
      };
      if(!free(p)){
        // At a glancing contact the tires can scrub sideways while the coupler stays on the ball.
        const h=ball(v),old=coupler(this),step=Math.hypot(h.x-old.x,h.z-old.z);
        const scrub=Math.min(.055,step*.83/tongueLength),ideal=p.yaw;
        if(scrub<.000001)return false;
        let alternate=null;
        for(const relief of [.40,-.40,1,-1]){
          const yaw=ideal+relief*scrub,q={x:h.x-Math.sin(yaw)*tongueLength,z:h.z-Math.cos(yaw)*tongueLength,yaw};
          if(free(q)){alternate=q;break;}
        }
        if(!alternate)return false;p=alternate;
      }
      const travel=(p.x-this.x)*Math.sin(p.yaw)+(p.z-this.z)*Math.cos(p.yaw);
      this.wheelSpin=(this.wheelSpin+travel/.315)%(2*Math.PI);this.towYaw=v.yaw;Object.assign(this,p);
      return true;
    }
    pose(floor){
      if(this.groundX!==this.x||this.groundZ!==this.z||this.groundYaw!==this.yaw){
        const front=world(this,0,2.1),rear=world(this,0,-1.8);
        this.y=floor(this.x,this.z);this.pitch=-Math.atan2(floor(front.x,front.z)-floor(rear.x,rear.z),3.9);
        this.groundX=this.x;this.groundZ=this.z;this.groundYaw=this.yaw;
      }
      const v=this.hitched;if(v){v.trailerLoad=this.load?1:.35;this.brake=v.brakes;this.signal=v.indicator||0;}
    }
    sweep(){
      const v=this.hitched;
      if(!v||Math.abs(v.speed)<.75){this.swept=[];this.sweepX=null;return this.swept;}
      if(this.sweepX===v.x&&this.sweepZ===v.z&&this.sweepYaw===v.yaw)return this.swept;
      this.sweepX=v.x;this.sweepZ=v.z;this.sweepYaw=v.yaw;
      const path=[];
      for(const time of [.85,1.75]){
        const run=Math.max(-10,Math.min(14,v.speed*time)),yaw=v.yaw+Math.max(-.56,Math.min(.56,v.yawRate*time));
        const mid=(v.yaw+yaw)*.5,q={kind:v.kind,yaw,x:v.x+Math.sin(mid)*run,z:v.z+Math.cos(mid)*run};
        path.push(q,ball(q),pinned(this,q));
      }
      this.swept=path;return path;
    }
    loadedPose(){return {...world(this,0,.18),yaw:this.yaw,y:this.y+.75,lean:0,pitch:this.pitch};}
    clearance(x,z){const p={x,z};return Math.min(...pieces(this).map(q=>BayDriving.clearance(q,p)));}
    wet(site){return !!this.hitched&&Math.abs(this.hitched.speed)<.88&&Math.abs(this.x-site.wet.x)<2.65&&Math.abs(this.z-site.wet.z)<2.20&&Math.abs(wrap(this.yaw-site.wet.yaw))<.37;}
    atHome(site){const q=local(site.parking,this.x,this.z);return Math.abs(q.x)<3.6&&Math.abs(q.z)<5.1&&(!this.hitched||Math.abs(this.hitched.speed)<.88);}
  }
  window.BaySlipTrailer={Trailer,ball,coupler,hitchable,compatible,pieces,fits,pinned,wrap,tongueLength};
})();
