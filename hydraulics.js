/* Las Brisas switch box. Four struts share one sprung body. Wheel heights and the
   official hop measurements are in metres above the contact patch at rest. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const switches=["Front","Rear","Left","Right"],masks=[12,3,5,10],fore=[-1,-1,1,1],side=[-1,1,-1,1];
  const dt=1/180,gravity=9.81;
  class Rig{
    constructor(){
      this.wheelLift=[0,0,0,0];this.wheelVelocity=[0,0,0,0];this.extension=[0,0,0,0];this.pulse=[0,0,0,0];
      this.bodyLift=this.fore=this.side=0;this.vy=this.vf=this.vs=0;
      this.pitch=this.lean=0;this.front=this.back=this.left=this.right=0;
      this.pressure=1;this.buttons=0;this.contacts=15;this.rest=true;this.lastHit=[-1,-1,-1,-1];this.time=0;this.bank=0;this.land=0;
    }
    press(i,speed=0){
      if(!Number.isInteger(i)||i<0||i>3||this.buttons&(1<<i))return false;
      this.buttons|=1<<i;this.rest=false;
      if(this.time-this.lastHit[i]<.16||this.pressure<.14)return false;
      let kicked=false;const travel=clamp(1-(Math.abs(speed)-2.5)/9,0,1),load=this.pressure;
      for(let j=0;j<4;j++)if(masks[i]&(1<<j)){
        if(this.wheelLift[j]>.035||this.pulse[j]>.006)continue;
        const cornerSpeed=this.vy+fore[j]*this.vf+side[j]*this.vs;
        // Charging a loaded corner just as it comes down builds the next hop.
        const kick=travel*(.77+.23*load)*(1+clamp(-cornerSpeed*.18,-.40,.62));
        this.pulse[j]=.109*kick;kicked=true;
      }
      this.lastHit[i]=this.time;if(kicked)this.pressure=Math.max(0,this.pressure-.115*travel);
      return kicked;
    }
    release(i){this.buttons&=~(1<<i);}
    lower(){this.buttons=0;}
    advance(seconds,speed,shape){
      this.time+=seconds;this.land=0;this.pressure=Math.min(1,this.pressure+seconds*.19);
      if(this.rest)return;
      let mask=0;for(let i=0;i<4;i++)if(this.buttons&(1<<i))mask|=masks[i];
      const cruise=clamp(1-(Math.abs(speed)-2.5)/12,.22,1);
      this.bank+=Math.min(seconds,.12);
      while(this.bank>=dt-1e-9){this.bank-=dt;this.integrate(mask,cruise);}
      const halfBase=(shape.axles[1]-shape.axles[0])*.5;
      this.pitch=-Math.atan2(this.fore,halfBase);this.lean=Math.atan2(this.side,shape.track-.085);
      const v=this.wheelLift;this.front=Math.min(v[2],v[3]);this.back=Math.min(v[0],v[1]);this.left=Math.min(v[0],v[2]);this.right=Math.min(v[1],v[3]);
      if(!mask&&this.contacts===15&&Math.abs(this.vy)+Math.abs(this.vf)+Math.abs(this.vs)<.009&&
        Math.abs(this.bodyLift)+Math.abs(this.fore)+Math.abs(this.side)<.0025&&this.extension.every(x=>x<.002)){
        this.bodyLift=this.fore=this.side=this.pitch=this.lean=this.vy=this.vf=this.vs=this.bank=0;
        this.extension.fill(0);this.rest=true;
      }
    }
    integrate(mask,cruise){
      let sum=0,pitchForce=0,sideForce=0,contacts=0;
      for(let i=0;i<4;i++){
        const f=fore[i],s=side[i],wheel=this.wheelLift[i],vy=this.wheelVelocity[i];
        const corner=this.bodyLift+f*this.fore+s*this.side,velocity=this.vy+f*this.vf+s*this.vs;
        const target=mask&(1<<i)?(.31+.04*f)*cruise:0;
        let ext=this.extension[i];ext+=clamp(target-ext,-3.4*dt,3.7*dt);this.extension[i]=ext;
        const push=this.pulse[i];this.pulse[i]=Math.max(0,push-dt);
        const separation=corner-wheel-ext;
        const force=clamp(gravity-91*separation+6.8*(vy-velocity)+(push>0?39*cruise:0)
          -Math.max(0,separation-.105)*240+Math.max(0,-.166-corner)*900,-95,115);
        sum+=force;pitchForce+=f*force;sideForce+=s*force;
        let speed=vy+(-gravity-force*3.25)*dt,h=wheel+speed*dt;
        if(h<=0){if(wheel>.0005&&speed<-.55)this.land=Math.max(this.land,-speed);h=0;speed=0;contacts|=1<<i;}
        this.wheelVelocity[i]=speed;this.wheelLift[i]=h;
      }
      this.vy+=(sum*.25-gravity-this.vy*.35)*dt;
      this.vf+=(pitchForce*.32-this.vf*.55)*dt;this.vs+=(sideForce*.31-this.vs*.65)*dt;
      this.bodyLift+=this.vy*dt;this.fore+=this.vf*dt;this.side+=this.vs*dt;this.contacts=contacts;
    }
    mapWheel(ctx,yaw,side,front){
      if(this.rest)return;const h=this.wheelLift[(front?2:0)+(side>0?1:0)],c=Math.cos(yaw),s=Math.sin(yaw);
      ctx.translate((-.11*c-.30*s)*h,(.11*s-.30*c)*h);
    }
    mapBody(ctx,yaw){
      if(this.rest)return;const c=Math.cos(yaw),s=Math.sin(yaw),px=-.11*c-.30*s,py=.11*s-.30*c;
      const a=Math.sin(this.lean),b=Math.cos(this.lean),p=Math.sin(this.pitch),q=Math.cos(this.pitch);
      ctx.transform(b+px*a,py*a,-p*a+px*p*b,q+py*p*b,px*this.bodyLift,py*this.bodyLift);
    }
    grip(front){
      const a=front?2:0,b=this.wheelLift;
      return .28+.36*Math.max(0,1-b[a]*12)+.36*Math.max(0,1-b[a+1]*12);
    }
  }
  window.BayHydraulics={Rig,switches,masks};
})();
