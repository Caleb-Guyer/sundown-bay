/* Single-track handling for the player's car. Distances are metres and time is seconds. */
(() => {
  "use strict";
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const damp=(a,b,k,dt)=>a+(b-a)*-Math.expm1(-k*dt);
  const cars={
    coupe:{name:"Marlin GT",top:38,power:13.8,brake:18.6,grip:14.6,balance:.49,steer:.65,response:8.3,roll:.073},
    hatch:{name:"Riva Hatch",top:30,power:11.5,brake:17.6,grip:14,balance:.47,steer:.69,response:10,roll:.086},
    cab:{name:"Bay Cab",top:28,power:10.3,brake:17,grip:13,balance:.46,steer:.66,response:7.1,roll:.102},
    van:{name:"Pelican Panelvan",top:24,power:8.1,brake:14.6,grip:11.7,balance:.45,steer:.60,response:5.4,roll:.15},
    cruiser:{name:"Bay Patrol",top:33,power:12.2,brake:18.3,grip:14.1,balance:.48,steer:.65,response:7.8,roll:.092}
  };
  const shiftAt=[.25,.46,.68,.86],pull=[1,.82,.68,.56,.46];
  function settle(v){
    Object.assign(v,{speed:0,vx:0,vz:0,steer:0,yawRate:0,throttle:0,brakes:0,handbrake:0,
      reverseWait:0,reversing:false,gear:1,shift:0,wheelSpin:v.wheelSpin||0,pitch:0,pitchRate:0,lean:0,rollRate:0,slip:0});
  }
  function signedSpeed(v){
    const forward=v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw);
    v.speed=(Math.sign(Math.abs(forward)>.02?forward:v.speed)||1)*Math.hypot(v.vx,v.vz);
  }
  function spring(v,value,velocity,goal,hz,dt){
    // Exact critically damped spring for a constant target over this step.
    const offset=v[value]-goal,b=v[velocity]+hz*offset,e=Math.exp(-hz*dt);
    v[value]=goal+(offset+b*dt)*e;v[velocity]=(v[velocity]-hz*b*dt)*e;
  }
  function step(v,dt,gas,back,steerInput,hand,surface,tuned,parking=false){
    if(dt<=0)return;
    const spec=cars[v.kind],shape=bayCarLayout(v.kind),sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
    const forward=v.vx*sn+v.vz*cs,lateral=v.vx*cs-v.vz*sn,speed=Math.hypot(v.vx,v.vz);
    const gain=tuned?1.18:1,top=spec.top*gain*(.55+.45*surface),ratio=Math.max(0,forward)/top;
    // A sideways slide can cross zero longitudinal speed while the car is still moving fast.
    // Only select reverse after the whole car has stopped under the brake pedal.
    if(parking||(gas&&forward>=-.18))v.reversing=false;
    if(back&&!gas&&!parking&&!v.reversing&&speed<.16){
      v.reverseWait+=dt;if(v.reverseWait>=.26)v.reversing=true;
    }else v.reverseWait=0;
    const reverse=v.reversing&&back&&!gas&&!parking;
    const brake=parking||(back&&!reverse)||(gas&&forward<-.18);
    v.brakes=damp(v.brakes,brake?1:0,brake?18:12,dt);
    v.handbrake=damp(v.handbrake,hand&&!parking?1:0,hand?16:7,dt);
    v.throttle=damp(v.throttle,(gas||reverse)&&!brake?1:0,gas||reverse?11:16,dt);
    v.shift=Math.max(0,v.shift-dt);
    if(!v.shift){
      if(v.gear<5&&ratio>shiftAt[v.gear-1]){v.gear++;v.shift=.115;}
      else if(v.gear>1&&ratio<shiftAt[v.gear-2]-.085){v.gear--;v.shift=.085;}
    }
    const flat=v.flatSide?(v.flatLoad=damp(v.flatLoad||0,1,4.2,dt)):0;
    const flatSide=(v.flatSide||0)*flat;
    const maxWheel=spec.steer/(1+.038*speed+.00047*speed*speed);
    const target=clamp(steerInput+flatSide*.105,-1,1)*maxWheel*(1+.22*v.handbrake);
    v.steer=damp(v.steer,target,steerInput?(Math.sign(target*v.steer)<0?spec.response*1.65:spec.response):10.5,dt);
    const rearArm=-shape.axles[0],frontArm=shape.axles[1],wheelbase=rearArm+frontArm;
    const dryGrip=spec.grip*surface*(1-.12*flat),weightShift=.045*v.brakes-.02*v.throttle;
    const frontGrip=dryGrip*(spec.balance+weightShift),rearGrip=dryGrip*(1-spec.balance-weightShift)*(1-.76*v.handbrake);
    const turnSin=Math.sin(v.steer),turnCos=Math.cos(v.steer);
    const frontSlip=(lateral+frontArm*v.yawRate)*turnCos-forward*turnSin;
    const rearSlip=lateral-rearArm*v.yawRate;
    const frontForce=-frontGrip*Math.tanh(frontSlip*5.2/frontGrip);
    const rearForce=-rearGrip*Math.tanh(rearSlip*(7.0-3.9*v.handbrake)/rearGrip);
    const sideForce=frontForce*turnCos+rearForce;
    const inertia=.27*wheelbase*wheelbase;
    const torque=(frontArm*frontForce*turnCos-rearArm*rearForce)/inertia;
    let nextYawRate=(v.yawRate+torque*dt)*Math.exp(-(.84-.46*v.handbrake)*dt);
    const low=clamp(1-speed/4.5,0,1);
    nextYawRate=damp(nextYawRate,forward*Math.tan(v.steer)/wheelbase,low*10,dt);
    nextYawRate=clamp(nextYawRate,-2.35,2.35);
    const shove=v.reversing?-6.4*(1-clamp(-forward/7,0,1)):spec.power*gain*pull[v.gear-1]*
      (v.shift>0?.39:1)*clamp((1.06-ratio)*5,0,1);
    const drag=.36+.00092*forward*forward+(gas||reverse?0:.63)+
      (1-surface)*2.5+v.handbrake*4.3+v.brakes*spec.brake+flat*(.7+.045*speed);
    let along=forward+(brake?0:shove*v.throttle)*dt-frontForce*turnSin*dt;
    along=Math.sign(along)*Math.max(0,Math.abs(along)-drag*dt);
    const sideways=lateral+sideForce*dt;
    v.vx=sn*along+cs*sideways;v.vz=cs*along-sn*sideways;
    v.yaw+=(v.yawRate+nextYawRate)*.5*dt;v.yawRate=nextYawRate;signedSpeed(v);
    if(Math.hypot(v.vx,v.vz)<(brake?.16:.09)&&(brake||(!gas&&!back)||hand)){v.speed=v.vx=v.vz=v.yawRate=0;}
    const longAccel=clamp((along-forward)/dt,-22,17);
    spring(v,"pitch","pitchRate",clamp(-longAccel*.0051,-.068,.105),10,dt);
    spring(v,"lean","rollRate",clamp(sideForce/12,-1.3,1.3)*spec.roll-flatSide*.052,8.4,dt);
    const slipSpeed=Math.abs(rearSlip)+v.handbrake*Math.abs(forward)*.27;
    v.slip=damp(v.slip,clamp((slipSpeed-1.2)/4.5,0,1)*clamp((speed-3)/5,0,1),9,dt);
    v.wheelSpin=(v.wheelSpin+along/shape.wheel*dt)%(Math.PI*2);
  }
  function world(v,x,z){
    const c=Math.cos(v.yaw),s=Math.sin(v.yaw);return {x:v.x+c*x+s*z,z:v.z-s*x+c*z};
  }
  function local(v,x,z){
    const c=Math.cos(v.yaw),s=Math.sin(v.yaw),dx=x-v.x,dz=z-v.z;return {x:c*dx-s*dz,z:s*dx+c*dz};
  }
  // Sweep each wheel's contact patch between physics poses, including when reversing.
  function tireOnStrip(v,oldX,oldZ,oldYaw,strip){
    const shape=bayCarLayout(v.kind),old={x:oldX,z:oldZ,yaw:oldYaw};
    let hit=null,first=Infinity,nearest=Infinity;
    for(const axle of shape.axles)for(const side of [-1,1]){
      const wheel=side*(shape.track-.085),a=world(old,wheel,axle),b=world(v,wheel,axle);
      const start=local(strip,a.x,a.z),end=local(strip,b.x,b.z);
      let enter=0,exit=1;
      for(const [k,r] of [["x",strip.halfWidth+.11],["z",.36]]){
        const delta=end[k]-start[k];
        if(Math.abs(delta)<.00001){if(Math.abs(start[k])>r){exit=-1;break;}}
        else{
          const lo=(-r-start[k])/delta,hi=(r-start[k])/delta;
          enter=Math.max(enter,Math.min(lo,hi));exit=Math.min(exit,Math.max(lo,hi));
        }
      }
      const offset=Math.abs(start.x+(end.x-start.x)*enter);
      if(enter<=exit&&(enter<first-.000001||(Math.abs(enter-first)<=.000001&&offset<nearest))){
        hit={side,axle};first=enter;nearest=offset;
      }
    }
    return hit;
  }
  function clearance(v,p){
    const s=bayCarLayout(v.kind),q=local(v,p.x,p.z),x=Math.abs(q.x)-s.track,z=Math.abs(q.z)-s.halfLength;
    return Math.hypot(Math.max(0,x),Math.max(0,z))+Math.min(0,Math.max(x,z));
  }
  function contact(a,b){
    const dx=a.x-b.x,dz=a.z-b.z;if(Math.abs(dx)>5.6||Math.abs(dz)>5.6)return null;
    const sa=bayCarLayout(a.kind),sb=bayCarLayout(b.kind),ca=Math.cos(a.yaw),aa=Math.sin(a.yaw),cb=Math.cos(b.yaw),ab=Math.sin(b.yaw);
    let depth=Infinity,nx=0,nz=0;
    for(const [x,z] of [[ca,-aa],[aa,ca],[cb,-ab],[ab,cb]]){
      const extA=(sa.track-.08)*Math.abs(x*ca-z*aa)+(sa.halfLength-.11)*Math.abs(x*aa+z*ca);
      const extB=(sb.track-.08)*Math.abs(x*cb-z*ab)+(sb.halfLength-.11)*Math.abs(x*ab+z*cb);
      const d=dx*x+dz*z,overlap=extA+extB-Math.abs(d);if(overlap<=0)return null;
      if(overlap<depth){depth=overlap;nx=x*(d<0?-1:1);nz=z*(d<0?-1:1);}
    }
    return {nx,nz,depth};
  }
  window.BayDriving={cars,settle,step,signedSpeed,world,local,tireOnStrip,clearance,contact};
})();
