/* Cine Luna's closed picture-car set. All coordinates and the photographed poses are in city metres. */
(() => {
  "use strict";
  const job={id:"one-good-take",name:"One Good Take",by:"Romy Vale"};
  const ramp={x:72,toe:27,lip:37,height:2.4,halfWidth:2};
  const deck={height:1.2,halfWidth:2,halfLength:3.55};
  const gravity=12.8,accel=8.7;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const lerp=(a,b,f)=>a+(b-a)*f;
  const damp=(v,to,rate,dt)=>lerp(v,to,-Math.expm1(-rate*dt));
  const makeCar=(kind,color,x,z,speed)=>({kind,color,x,z,y:0,yaw:0,pitch:0,lean:0,speed,sideSpeed:0,wheelSpin:0,steer:0,brakes:0});
  const runway={x:72,z:37,name:"Cine Luna stunt ramp"};
  const onSet=p=>p.x>61&&p.x<84&&p.z>-17&&p.z<105;
  const lift=speed=>2.7+.172*speed;
  const airSeconds=speed=>(lift(speed)+Math.sqrt(lift(speed)**2+2*gravity*(ramp.height-deck.height)))/gravity;
  function launchEstimate(v,topSpeed){
    const left=Math.max(0,ramp.lip-v.z),speed=Math.min(topSpeed,Math.sqrt(v.speed*v.speed+2*accel*left));
    const accelerationTime=(speed-v.speed)/accel;
    const cruiseTime=Math.max(0,left-(speed+v.speed)*.5*accelerationTime)/topSpeed;
    return {time:accelerationTime+cruiseTime+airSeconds(speed),z:ramp.lip+speed*airSeconds(speed)};
  }
  function deckMiss(x,z,yaw,truck){
    const shape=bayCarLayout("coupe"),sn=Math.sin(yaw),cs=Math.cos(yaw),ts=Math.sin(truck.yaw),tc=Math.cos(truck.yaw);
    let pastEnd=false;
    for(const axle of shape.axles)for(const side of [-1,1]){
      const dx=x+cs*side*shape.track+sn*axle-truck.x,dz=z-sn*side*shape.track+cs*axle-truck.z;
      if(Math.abs(dx*tc-dz*ts)>deck.halfWidth)return "side";
      if(Math.abs(dx*ts+dz*tc)>deck.halfLength)pastEnd=true;
    }
    return pastEnd?"end":"";
  }
  class Run{
    constructor(number=1,longMark=false){
      this.number=number;this.longMark=longMark;this.topSpeed=longMark?30:26;
      this.role="jules";this.phase="marks";this.clock=0;this.endTime=0;
      this.truck=makeCar("flatbed","#497975",72,longMark?48:42.5,3.7);
      this.coupe=makeCar("coupe","#bc4b3e",72,longMark?-16:-5,0);
      this.palms=[[68.7,66],[75.5,68],[69,79],[71.9,82],[75.1,81]].map(([x,z])=>({x,z,fall:0,hit:false}));
      this.launch=null;this.peak=null;this.approach=null;this.vy=0;this.onRamp=false;this.missedDeck=false;
      this.distance=0;this.reason="";this.receipt=null;
    }
    subject(){return this.role==="jules"?this.truck:this.coupe;}
    swap(){
      if(!["marks","rolling","air"].includes(this.phase))return false;
      const previous=this.subject();
      if(this.phase!=="air"||this.role==="jules")previous.sideSpeed=0;
      this.role=this.role==="jules"?"romy":"jules";return true;
    }
    direction(){
      const shot=launchEstimate(this.coupe,this.topSpeed);
      return {gap:shot.z-this.truck.z-this.truck.speed*shot.time,lane:this.truck.x-this.coupe.x};
    }
    steer(v,input,dt,air=false){
      const desired=input*Math.min(air?1.5:3.1,Math.abs(v.speed)*.34);
      v.sideSpeed=damp(v.sideSpeed,desired,air?2:5.5,dt);
      const raw=v.x+v.sideSpeed*dt;v.x=clamp(raw,65.8,78.2);
      if(v.x!==raw)v.sideSpeed=0;
      v.yaw=damp(v.yaw,Math.atan2(v.sideSpeed,Math.max(3,v.speed)),7,dt);
      v.steer=damp(v.steer,input*.28,8,dt);v.lean=damp(v.lean,-input*.033,5,dt);
    }
    recordFlight(){
      // The film editor favours the descending frame with daylight still visible under the wheels.
      const y=this.coupe.y,overBed=deck.height+1.6;
      const atPeak=!this.peak||y>this.peak.coupe.y+.015;
      const approaching=this.vy<0&&y>deck.height&&Math.abs(y-overBed)<(this.approach?Math.abs(this.approach.coupe.y-overBed):.48);
      if(!atPeak&&!approaching)return;
      const still={phase:"air",role:this.role,truck:{...this.truck},coupe:{...this.coupe},palms:this.palms};
      if(atPeak)this.peak=still;if(approaching)this.approach=still;
    }
    miss(reason){
      this.phase="miss";this.reason=reason;this.endTime=0;this.coupe.y=0;this.coupe.pitch=.045;
    }
    step(dt,input){
      const c=this.coupe,t=this.truck;
      if(this.phase==="marks"){
        if(!input.gas&&!input.brake&&!input.steer)return;
        this.phase="rolling";
      }
      this.clock+=dt;
      const rolling=this.phase==="rolling"||this.phase==="air",jules=this.role==="jules",old={x:t.x,z:t.z,yaw:t.yaw};
      if(rolling&&jules)t.speed=clamp(t.speed+dt*((input.gas?1.2:0)-(input.brake?3.8:0)),0,9);
      else if(!rolling)t.speed=Math.max(0,t.speed-dt*(this.phase==="landed"?1.8:2));
      this.steer(t,rolling&&jules?input.steer:0,dt);t.z+=t.speed*dt;t.wheelSpin+=t.speed*dt/.42;
      if(this.phase==="landed"){
        const p=BayDriving.world(t,this.rest.x,this.rest.z);
        c.x=p.x;c.z=p.z;c.y=deck.height;c.yaw=t.yaw+this.rest.yaw;c.speed=t.speed;
        c.pitch=damp(c.pitch,0,8,dt);this.endTime+=dt;return;
      }
      if(this.phase==="miss"){
        c.speed=Math.max(0,c.speed-12*dt);c.z+=c.speed*dt;c.x+=c.sideSpeed*dt;c.pitch=damp(c.pitch,0,6,dt);
        for(const palm of this.palms){
          if(!palm.hit&&Math.abs(c.x-palm.x)<1.8&&Math.abs(c.z-palm.z)<2.8)palm.hit=true;
          if(palm.hit)palm.fall=Math.min(1,palm.fall+dt*3.5);
        }
        this.endTime+=dt;return;
      }
      if(this.clock>42||t.z>102){this.miss("The flatbed passed the end of the set.");return;}
      const lastX=c.x,lastZ=c.z,lastY=c.y;
      if(this.phase==="rolling"){
        if(!jules)c.speed=clamp(c.speed+dt*((input.gas?accel:0)-(input.brake?13:0)),0,this.topSpeed);
        this.steer(c,jules?0:input.steer,dt);c.z+=c.speed*dt;c.wheelSpin+=c.speed*dt/.32;
        if(lastZ<ramp.toe&&c.z>=ramp.toe)this.onRamp=Math.abs(c.x-ramp.x)<ramp.halfWidth-.46;
        if(c.z>=ramp.toe&&this.onRamp&&Math.abs(c.x-ramp.x)>ramp.halfWidth-.35){
          this.miss("A wheel slipped off the side of the ramp.");return;
        }
        if(this.onRamp){c.y=ramp.height*clamp((c.z-ramp.toe)/(ramp.lip-ramp.toe),0,1);c.pitch=damp(c.pitch,-.22,10,dt);}
        if(c.z<ramp.lip)return;
        if(!this.onRamp||c.speed<7){this.miss(this.onRamp?"Romy needed more speed at the lip.":"The coupe went beside the ramp.");return;}
        this.launch={x:c.x,z:ramp.lip};this.phase="air";this.vy=lift(c.speed);
        const left=(c.z-ramp.lip)/c.speed;c.y=ramp.height+this.vy*left-gravity*left*left/2;this.vy-=gravity*left;
        this.recordFlight();return;
      }
      if(!jules)this.steer(c,input.steer,dt,true);else c.x+=c.sideSpeed*dt;
      c.z+=c.speed*dt;c.y+=this.vy*dt-gravity*dt*dt/2;this.vy-=gravity*dt;
      c.pitch=damp(c.pitch,-clamp(this.vy/Math.max(c.speed,7),-.2,.25),6,dt);
      c.wheelSpin+=c.speed*dt/.32;this.recordFlight();
      if(!this.missedDeck&&lastY>=deck.height&&c.y<=deck.height){
        const f=clamp((lastY-deck.height)/(lastY-c.y||1),0,1),tx=lerp(old.x,t.x,f),tz=lerp(old.z,t.z,f);
        const x=lerp(lastX,c.x,f),z=lerp(lastZ,c.z,f),truckAt={x:tx,z:tz,yaw:lerp(old.yaw,t.yaw,f)};
        const miss=deckMiss(x,z,c.yaw,truckAt);
        if(t.speed>=1.5&&!miss){
          this.phase="landed";this.distance=Math.round(Math.hypot(x-this.launch.x,z-this.launch.z)*10)/10;
          this.rest={...BayDriving.local(truckAt,x,z),yaw:c.yaw-truckAt.yaw};
          const p=BayDriving.world(t,this.rest.x,this.rest.z);c.x=p.x;c.z=p.z;c.y=deck.height;c.speed=t.speed;
          this.endTime=0;return;
        }
        this.missedDeck=true;
        this.reason=t.speed<1.5?"The flatbed has to be rolling.":miss==="side"?"Line up all four wheels with the bed.":z>tz?"Romy overshot. Give Jules more of a head start.":"The truck was too far ahead. Switch to Romy sooner.";
      }
      if(c.y<=0)this.miss(this.reason||"The coupe touched down on the street.");
    }
  }
  window.BayTake={Run,job,ramp,deck,runway,onSet};
})();
