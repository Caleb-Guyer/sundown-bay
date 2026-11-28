/* Measure contact over a displayed frame, including both the walker and vehicle's travel. */
(() => {
  "use strict";
  class StreetRisk{
    constructor(){this.health=100;this.cool=0;this.quiet=0;this.down=null;this.near=[];this.count=0;this.wreck=0;}
    watch(p,groups){
      this.x=p.x;this.z=p.z;this.count=0;
      for(const group of groups)for(const v of group){
        if(Math.abs(v.x-p.x)>13||Math.abs(v.z-p.z)>13)continue;
        const old=this.near[this.count]||(this.near[this.count]={});this.count++;
        old.v=v;old.x=v.x;old.z=v.z;old.yaw=v.yaw;
      }
    }
    strike(p,dt){
      if(!dt||Math.hypot(p.x-this.x,p.z-this.z)>2)return 0;
      let strongest=0;
      for(let i=0;i<this.count;i++){
        const o=this.near[i],v=o.v,dx=v.x-o.x,dz=v.z-o.z,travel=Math.hypot(dx,dz),speed=travel/dt;
        if(speed<2.8||speed>65||travel>6.5||Math.abs(p.x-v.x)>9||Math.abs(p.z-v.z)>9)continue;
        const s=v.footprint||bayCarLayout(v.kind),si=Math.sin(o.yaw),co=Math.cos(o.yaw);
        const x=this.x-o.x,z=this.z-o.z,rx=p.x-v.x-x,rz=p.z-v.z-z;
        const side=x*co-z*si,front=x*si+z*co,ds=rx*co-rz*si,df=rx*si+rz*co;
        const w=s.track+.34,l=s.halfLength+.34;
        let enter=0,exit=1;
        function crosses(a,d,h){
          if(Math.abs(d)<.00001)return Math.abs(a)<=h;
          const t1=(-h-a)/d,t2=(h-a)/d;
          enter=Math.max(enter,Math.min(t1,t2));exit=Math.min(exit,Math.max(t1,t2));return enter<=exit;
        }
        if(!crosses(side,ds,w)||!crosses(front,df,l))continue;
        // Motion away from the pedestrian, or parallel to an already touching flank, is harmless.
        const end=Math.hypot(p.x-v.x,p.z-v.z);
        if(enter===0&&end>=Math.hypot(x,z)-.002)continue;
        if((dx*x+dz*z)/travel<.03)continue;
        const leading=Math.abs(front+df*enter)>l-.45;
        strongest=Math.max(strongest,speed*(leading?1:.72));
      }
      return strongest;
    }
    hit(amount){
      if(amount<=0||this.cool>0||this.down)return false;
      this.health=Math.max(0,this.health-Math.ceil(amount));this.cool=1.5;this.quiet=10;return true;
    }
    step(dt){
      this.cool=Math.max(0,this.cool-dt);this.quiet=Math.max(0,this.quiet-dt);
      if(!this.quiet&&this.health>0&&this.health<100)this.health=Math.min(100,this.health+5*dt);
    }
    recover(){this.health=100;this.cool=3;this.quiet=0;this.down=null;this.wreck=0;this.count=0;}
  }
  window.BayStreetRisk=StreetRisk;
})();
