/* North Float's practice ramp and the outboard club's rolling wake. */
(() => {
  "use strict";
  const kicker={x:267,z:92,yaw:Math.PI/2,name:"Practice ramp"};
  const barrier={...kicker,halfWidth:1.45,halfLength:2.9};
  const home=BayMarina.docks[1], key="sundownBay.northFloat.";
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const angle=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function stored(id){
    try{const n=Number(localStorage.getItem(key+id));return Number.isFinite(n)&&n>0?n:0;}catch{return 0;}
  }
  class Ride{
    constructor(){
      this.best={ramp:stored("ramp"),wake:stored("wake"),double:stored("double")};
      this.reset();
    }
    reset(){this.air=null;this.height=0;this.onRamp=false;this.cooldown=0;this.run=null;this.last=null;}
    record(id,n){
      const disk=stored(id),old=this.best[id];
      const better=(a,b)=>id==="double"?Math.min(a||Infinity,b||Infinity):Math.max(a,b);
      const prior=better(disk,old),value=better(prior,n);
      if(!Number.isFinite(value))return false;
      this.best[id]=value;
      if(n===value&&disk!==value){try{localStorage.setItem(key+id,String(value));}catch{}}
      return value!==prior;
    }
    spray(t,draw){
      const hit=this.last;if(!hit)return;
      const age=t-hit.at;if(age<0||age>.7)return;
      const sn=Math.sin(hit.yaw),cs=Math.cos(hit.yaw),force=hit.clean?1:1.5;
      for(const side of [-1,1])for(let i=0;i<4;i++){
        const across=side*(.38+age*(2.4+i*.55)*force),along=.52-i*.4+age*(1.7-i*.7);
        const y=.09+Math.max(0,(2.4+i*.26)*force*age-5.9*age*age);
        draw(hit.x+cs*across+sn*along,y,hit.z-sn*across+cs*along,hit.yaw+side*.58,age);
      }
    }
    nearFloat(v){return Math.hypot(v.x-home.x,v.z-home.z)<15;}
    start(v){if(this.air||!this.nearFloat(v)||this.run)return false;this.run={leg:"ramp",time:0};return true;}
    target(boat){
      if(!this.run)return null;
      if(this.run.leg==="ramp")return kicker;
      const w=boat.wake[Math.max(0,boat.wake.length-10)]||boat;
      return {x:w.x+Math.cos(w.yaw)*3,z:w.z-Math.sin(w.yaw)*3,name:"Yellowtail’s wake"};
    }
    takeoff(v,kind,up,source){
      this.air={kind,source,x:v.x,z:v.z,up,startY:this.height,heading:Math.atan2(v.vx,v.vz),age:0,hit:false};
      this.onRamp=false;v.lift=0;
    }
    step(v,dt,input,t,boats,club){
      if(this.run)this.run.time+=dt;
      this.cooldown=Math.max(0,this.cooldown-dt);
      if(this.air){
        const a=this.air;
        a.age+=dt;this.height=a.startY+a.up*a.age-6.9*a.age*a.age;
        v.yaw+=input.steer*1.25*dt;
        const x=v.x+v.vx*dt,z=v.z+v.vz*dt;
        if(BayMarina.fits(x,z,v.yaw)){v.x=x;v.z=z;}else{v.vx=v.vz=0;a.hit=true;}
        v.y=.16+Math.max(0,this.height);v.pitch=clamp((13.8*a.age-a.up)*.04,-.28,.22);
        v.lean+=(input.steer*-.24-v.lean)*(1-Math.exp(-5*dt));
        if(this.height>0)return;
        const straight=Math.abs(angle(v.yaw-a.heading)),clean=!a.hit&&straight<.47;
        const range=Math.round(Math.hypot(v.x-a.x,v.z-a.z)*10)/10;
        v.speed=Math.hypot(v.vx,v.vz)*(clean?.96:.51);
        v.vx=Math.sin(v.yaw)*v.speed;v.vz=Math.cos(v.yaw)*v.speed;v.lift=clean?-.10:-.22;
        this.air=null;this.height=0;this.cooldown=.65;BayMarina.pose(v,t,dt);
        const best=clean&&this.record(a.kind,range);
        const result={kind:a.kind,range,clean,best,at:t,x:v.x,z:v.z,yaw:v.yaw};this.last=result;
        if(clean&&this.run?.leg===a.kind){
          if(a.kind==="ramp"){this.run.leg="wake";result.next=true;}
          else if(a.source===club){result.time=Math.max(.1,Math.round(this.run.time*10)/10);result.fastest=this.record("double",result.time);this.run=null;}
        }
        return result;
      }
      const before={x:v.x,z:v.z},ridingRamp=this.onRamp;
      BayMarina.helm(v,dt,input.gas,input.back,input.steer,input.trim,t);
      // The float points east. The painted deck and the physical lip share these dimensions.
      const along=v.x-kicker.x,across=Math.abs(v.z-kicker.z),forward=v.vx;
      if(!this.cooldown&&across<=1.54&&(forward>0||ridingRamp)&&along>=-3&&along<3&&
          (ridingRamp||before.x<=kicker.x-2.65)){
        this.onRamp=true;this.height=.05+(along+3)/6;v.y+=this.height;v.pitch=-.16;return;
      }
      if(ridingRamp&&along>=3&&across<=1.65&&forward>=7){
        this.height=1.05;
        this.takeoff(v,"ramp",2.4+clamp(forward,0,30)*.12+v.trim*1.45,null);v.y+=this.height;return;
      }
      this.onRamp=false;this.height=0;
      const approachFromBack=before.x>kicker.x+2&&forward<0;
      const approachFromSide=Math.abs(before.z-kicker.z)>1.54&&Math.abs(along)<3;
      if(!ridingRamp&&across<3.7&&Math.abs(along)<5.7&&(approachFromBack||approachFromSide))BayMarina.clearWorkingHull(v,barrier);
      if(this.cooldown||v.speed<8)return;
      for(const boat of boats){
        if(Math.hypot(boat.x-v.x,boat.z-v.z)>110)continue;
        for(let i=boat.wake.length-1;i>=0;i--){
          const w=boat.wake[i],age=t-w.at;if(age<.22||age>3.1)continue;
          const c=Math.cos(w.yaw),s=Math.sin(w.yaw),dx=v.x-w.x,dz=v.z-w.z,alongWake=dx*s+dz*c;
          if(Math.abs(alongWake)>1.55)continue;
          const prev=(before.x-w.x)*c-(before.z-w.z)*s,now=dx*c-dz*s;
          const expansion=1.32+w.pace*.66,span=.66+age*expansion;
          if(Math.abs(v.vx*c-v.vz*s)<3||Math.sign(prev)!==Math.sign(now))continue;
          if((Math.abs(prev)-span+dt*expansion)*(Math.abs(now)-span)>0)continue;
          this.takeoff(v,"wake",2.9+v.speed*.082+v.trim*1.45+w.pace*.65,boat);return;
        }
      }
    }
  }
  window.BayManta={kicker,barrier,home,Ride};
})();
