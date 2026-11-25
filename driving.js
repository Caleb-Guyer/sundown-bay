/* Single-track handling for the player's car. Distances are metres and time is seconds. */
(() => {
  "use strict";
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const damp=(a,b,k,dt)=>a+(b-a)*-Math.expm1(-k*dt);
  const cars={
    pumper:{name:"Seabird Pumper · Engine 7",top:29.5,power:10.6,brake:17.9,grip:14.1,balance:.46,steer:.63,response:6.4,roll:.103},
    caleta:{name:"Caleta Spider",top:36.5,power:13.9,brake:18.3,grip:14.1,balance:.485,steer:.71,response:9.3,roll:.061},
    solena:{name:"Solena 64",top:34.0,power:12.4,brake:15.7,grip:12.4,balance:.44,steer:.67,response:6.0,roll:.103},
    estate:{name:"Marisma Estate",top:30.4,power:11.2,brake:16.1,grip:13.7,balance:.47,steer:.67,response:7.2,roll:.110},
    stepside:{name:"Cortez Stepside",top:28.6,power:12.0,brake:15.2,grip:12.3,balance:.405,steer:.65,response:6.6,roll:.127},
    cayo:{name:"Cayo 72",top:39,power:15.6,brake:16.7,grip:13,balance:.455,steer:.62,response:6.6,roll:.097},
    marea:{name:"Marea S",top:45,power:16.4,brake:21,grip:16.6,balance:.54,steer:.64,response:9.8,roll:.051},
    ambulance:{name:"Bay Rescue 4",top:32,power:10.2,brake:18.4,grip:13.0,balance:.46,steer:.69,response:6.2,roll:.13},
    wrecker:{name:"Portside Wrecker",top:24,power:8.6,brake:17.3,grip:13.1,balance:.47,steer:.69,response:6.0,roll:.115},
    coupe:{name:"Marlin GT",top:38,power:13.8,brake:18.6,grip:14.6,balance:.49,steer:.65,response:8.3,roll:.073},
    hatch:{name:"Riva Hatch",top:30,power:11.5,brake:17.6,grip:14,balance:.47,steer:.69,response:10,roll:.086},
    cab:{name:"Bay Cab",top:28,power:10.3,brake:17,grip:13,balance:.46,steer:.66,response:7.1,roll:.102},
    van:{name:"Pelican Panelvan",top:24,power:8.1,brake:14.6,grip:11.7,balance:.45,steer:.60,response:5.4,roll:.15},
    cruiser:{name:"Bay Patrol",top:33,power:12.2,brake:18.3,grip:14.1,balance:.48,steer:.65,response:7.8,roll:.092}
  };
  const shiftAt=[.25,.46,.68,.86],pull=[1,.82,.68,.56,.46];
  const rearDrive=new Set(["coupe","caleta","cayo","solena","stepside","cab","cruiser"]);
  function tireState(v){
    const heat=v.rubberHeat||0;return heat<.42?"cold":heat<=1?"ready":"hot";
  }
  function cool(v,dt){
    if(v.rubberHeat>0)v.rubberHeat=Math.max(0,v.rubberHeat-(.039+.0038*Math.abs(v.speed||0))*dt);
  }
  function settle(v){
    Object.assign(v,{speed:0,vx:0,vz:0,steer:0,yawRate:0,throttle:0,brakes:0,handbrake:0,
      reverseWait:0,reversing:false,gear:1,shift:0,wheelSpin:v.wheelSpin||0,burn:0,rearSpin:0,lean:0,rollRate:0,pitch:0,pitchRate:0,slip:0});
    v.chalkTurn=null;
    v.impactSlide=null;v.findLane=false;
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
  function step(v,dt,gas,back,steerInput,hand,surface,tuned=v.upgrades?.engine,parking=false){
    if(dt<=0)return;
    const spec=v.handling||cars[v.kind],shape=v.footprint||bayCarLayout(v.kind),sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
    const forward=v.vx*sn+v.vz*cs,lateral=v.vx*cs-v.vz*sn,speed=Math.hypot(v.vx,v.vz);
    const d=v.damage,engine=Math.max(0,((d?.front||0)-.19)/.81)*.49,load=v.towLoad?1:v.trailerLoad||0;
    const gain=(tuned?1.18:1)*(1-engine)*(1-load*.30),top=spec.top*(tuned?1.18:1)*(1-engine*.87)*(1-load*.24)*(.55+.45*surface),ratio=Math.max(0,forward)/top;
    // The front brakes hold the contact patches while engine torque spins the rear axle.
    // Above walking pace the same two pedals brake normally before the tires can break loose.
    const spin=gas&&back&&!hand&&!parking&&!load&&!v.flatSide&&!v.jumpFlight&&
      surface>.65&&rearDrive.has(v.kind)&&speed<(v.burn>.2?4.4:1.35);
    v.burn=damp(v.burn||0,spin?1:0,spin?3.8:5.5,dt);
    if(spin){
      const heating=(tuned ? .21 : .185)*(v.upgrades?.tires ? .88 : 1);
      v.rubberHeat=Math.min(1.55,(v.rubberHeat||0)+dt*v.burn*heating);
      v.reversing=false;v.reverseWait=0;v.gear=1;v.shift=0;
      v.brakes=damp(v.brakes,.91,13,dt);v.throttle=damp(v.throttle,1,8,dt);v.handbrake=damp(v.handbrake,0,14,dt);
      v.steer=damp(v.steer,spec.steer*steerInput,spec.response,dt);
      const traction=(v.upgrades?.tires?1.11:1)*surface;
      const spinRate=(1.58+spec.power*.035)*gain/Math.sqrt(traction);
      const rate=damp(v.yawRate,v.steer/spec.steer*spinRate*v.burn,3.8,dt);
      const newYaw=v.yaw+(rate+v.yawRate)*.5*dt,front=shape.axles[1];
      const inside=v.steer/spec.steer*shape.track*.91;
      const creep=Math.abs(v.steer)*.58*v.burn;
      // Integrate around the loaded front axle. Walls and vehicles still resolve this motion in drive().
      const ns=Math.sin(newYaw),nc=Math.cos(newYaw);
      v.vx=((sn-ns)*front+(cs-nc)*inside)/dt+ns*creep;
      v.vz=((cs-nc)*front+(ns-sn)*inside)/dt+nc*creep;
      v.yaw=newYaw;v.yawRate=rate;signedSpeed(v);
      v.slip=v.burn;v.wheelSpin=(v.wheelSpin+creep/shape.wheel*dt)%(Math.PI*2);
      v.rearSpin=((v.rearSpin||0)+v.burn*(16+spec.power*.45)*dt/shape.wheel)%(Math.PI*2);
      spring(v,"pitch","pitchRate",.013*v.burn,11,dt);spring(v,"lean","rollRate",-rate*.011,8,dt);
      return;
    }
    cool(v,dt);
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
    const rearDamage=Math.max(0,(d?.rear||0)-.25);
    const dryGrip=spec.grip*surface*(1-.12*flat),weightShift=.045*v.brakes-.02*v.throttle;
    const water=v.waterLoad,planing=clamp((speed-5)/18,0,1)*(v.upgrades?.tires ? .67 : 1);
    const frontGrip=dryGrip*(spec.balance+weightShift)*(v.hydraulic?.grip(true)??1)*(1-.44*planing*(water?.front||0));
    const rearGrip=dryGrip*(1-spec.balance-weightShift)*(1-.76*v.handbrake)*(1-.43*v.burn)*(v.hydraulic?.grip(false)??1)*(1-.38*planing*(water?.rear||0));
    const turnSin=Math.sin(v.steer),turnCos=Math.cos(v.steer);
    const frontSlip=(lateral+frontArm*v.yawRate)*turnCos-forward*turnSin;
    const rearSlip=lateral-rearArm*v.yawRate;
    const tireGain=v.upgrades?.tires?1+.25*surface*(1-flat):1;
    const frontForce=-frontGrip*Math.tanh(frontSlip*5.2/frontGrip)*tireGain;
    const rearForce=-rearGrip*Math.tanh(rearSlip*(7.0-3.9*v.handbrake)/rearGrip)*tireGain*(1-rearDamage*.15);
    const sideForce=frontForce*turnCos+rearForce;
    const inertia=.27*wheelbase*wheelbase;
    const waterTorque=(water?.pull||0)*planing*Math.sign(forward)*.86;
    const torque=(frontArm*frontForce*turnCos-rearArm*rearForce)/inertia+waterTorque;
    let nextYawRate=(v.yawRate+torque*dt)*Math.exp(-(.84-.46*v.handbrake)*dt);
    const low=clamp(1-speed/4.5,0,1);
    nextYawRate=damp(nextYawRate,forward*Math.tan(v.steer)/wheelbase,low*10,dt);
    nextYawRate=clamp(nextYawRate,-2.35,2.35);
    // Warm rubber bites on the first car lengths. An overheated tire spins away some of the launch.
    const temperature=v.rubberHeat||0,warm=clamp(temperature/.42,0,1),greasy=clamp((temperature-.98)/.42,0,1);
    const launchGrip=1+(warm*.13-greasy*.43)*clamp(1-Math.max(0,forward)/15,0,1)*surface;
    const shove=v.reversing?-6.4*(1-.17*load)*(1-clamp(-forward/7,0,1)):spec.power*gain*pull[v.gear-1]*launchGrip*
      (v.shift>0?.39:1)*clamp((1.06-ratio)*5,0,1);
    const soft=v.sandSoft||0;
    const drag=.36+.00092*forward*forward+(gas||reverse?0:.63)+soft*(1.1+.14*speed)+
      (1-surface)*2.5+v.handbrake*4.3+v.brakes*spec.brake*(1-.23*load)+flat*(.7+.045*speed)+
      ((water?.front||0)+(water?.rear||0))*Math.min(speed*.072,1.4);
    let along=forward+(brake?0:shove*v.throttle*(1-soft*(v.reversing?.22:.54)))*dt-frontForce*turnSin*dt;
    along=Math.sign(along)*Math.max(0,Math.abs(along)-drag*dt);
    const sideways=lateral+sideForce*dt;
    v.vx=sn*along+cs*sideways;v.vz=cs*along-sn*sideways;
    v.yaw+=(v.yawRate+nextYawRate)*.5*dt;v.yawRate=nextYawRate;signedSpeed(v);
    if(Math.hypot(v.vx,v.vz)<(brake?.16:.09)&&(brake||(!gas&&!back)||hand)){v.speed=v.vx=v.vz=v.yawRate=0;}
    const longAccel=clamp((along-forward)/dt,-22,17);
    spring(v,"pitch","pitchRate",clamp(-longAccel*.0051,-.068,.105),10,dt);
    spring(v,"lean","rollRate",clamp(sideForce/12,-1.3,1.3)*spec.roll-flatSide*.052,8.4,dt);
    const slipSpeed=Math.abs(rearSlip)+v.handbrake*Math.abs(forward)*.27;
    v.slip=damp(v.slip,Math.max(v.burn,clamp((slipSpeed-1.2)/4.5,0,1)*clamp((speed-3)/5,0,1)),9,dt);
    if(v.burn>.01)v.rearSpin=(v.rearSpin+v.burn*45*dt)%(Math.PI*2);
    v.wheelSpin=(v.wheelSpin+(along/shape.wheel+soft*v.throttle*5.1*(v.reversing?-1:1))*dt)%(Math.PI*2);
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
    const s=v.footprint||bayCarLayout(v.kind),q=local(v,p.x,p.z),x=Math.abs(q.x)-s.track,z=Math.abs(q.z)-s.halfLength;
    return Math.hypot(Math.max(0,x),Math.max(0,z))+Math.min(0,Math.max(x,z));
  }
  function contact(a,b){
    const sa=a.footprint||bayCarLayout(a.kind),sb=b.footprint||bayCarLayout(b.kind);
    const dx=a.x-b.x,dz=a.z-b.z,reach=sa.halfLength+sb.halfLength+.85;
    if(Math.abs(dx)>reach||Math.abs(dz)>reach)return null;
    const ca=Math.cos(a.yaw),aa=Math.sin(a.yaw),cb=Math.cos(b.yaw),ab=Math.sin(b.yaw);
    let depth=Infinity,nx=0,nz=0;
    for(const [x,z] of [[ca,-aa],[aa,ca],[cb,-ab],[ab,cb]]){
      const extA=(sa.track-.08)*Math.abs(x*ca-z*aa)+(sa.halfLength-.11)*Math.abs(x*aa+z*ca);
      const extB=(sb.track-.08)*Math.abs(x*cb-z*ab)+(sb.halfLength-.11)*Math.abs(x*ab+z*cb);
      const d=dx*x+dz*z,overlap=extA+extB-Math.abs(d);if(overlap<=0)return null;
      if(overlap<depth){depth=overlap;nx=x*(d<0?-1:1);nz=z*(d<0?-1:1);}
    }
    return {nx,nz,depth};
  }
  const tonnes={hatch:.96,caleta:1.02,coupe:1.38,cab:1.66,cruiser:1.84,van:2.27,stepside:1.9,
    estate:1.53,solena:1.8,cayo:1.57,marea:1.46,wrecker:4.65,ambulance:4.2,pumper:11.3};
  function bumper(v,nx,nz,direction){
    const s=v.footprint||bayCarLayout(v.kind),side=s.track-.08,end=s.halfLength-.11;
    const c=Math.cos(v.yaw),f=Math.sin(v.yaw),across=nx*c-nz*f,along=nx*f+nz*c;
    // Project only the contacting face (or corner) onto the tangent. Two flat
    // bumpers meet halfway along their shared span, even on a partial overlap.
    const tx=nz,tz=-nx,center=v.x*tx+v.z*tz;
    let mid=center,span=0;
    for(const [normal,tangent,r] of [[across,c*tx-f*tz,side],[along,f*tx+c*tz,end]]){
      if(Math.abs(normal)<.035)span+=Math.abs(tangent)*r;
      else mid+=direction*Math.sign(normal)*tangent*r;
    }
    return {center,mid,span,inertia:(side*side+end*end)/3};
  }
  function rock(v,dx,dz){
    const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
    v.pitchRate=clamp((v.pitchRate||0)-.23*(dx*sn+dz*cs),-2.6,2.6);
    v.rollRate=clamp((v.rollRate||0)+.21*(dx*cs-dz*sn),-2.3,2.3);
  }
  function exchangeImpact(a,b,hit){
    const {nx,nz}=hit,aa=bumper(a,nx,nz,-1),bb=bumper(b,nx,nz,1);
    const lo=Math.max(aa.mid-aa.span,bb.mid-bb.span),hi=Math.min(aa.mid+aa.span,bb.mid+bb.span);
    const at=(lo+hi)*.5,armA=aa.center-at,armB=bb.center-at;
    const invA=1/(tonnes[a.kind]||1.6),invB=1/(tonnes[b.kind]||1.6);
    const pace=b.path?b.speed:0,prev=b.impactSlide;
    const bx=prev?.vx??Math.sin(b.yaw)*pace,bz=prev?.vz??Math.cos(b.yaw)*pace,spin=prev?.spin||0;
    const closing=(bx-a.vx)*nx+(bz-a.vz)*nz+spin*armB-a.yawRate*armA;
    if(closing<=.08)return;
    const impulse=1.08*closing/(invA*(1+armA*armA/aa.inertia)+invB*(1+armB*armB/bb.inertia));
    a.vx+=impulse*invA*nx;a.vz+=impulse*invA*nz;
    rock(a,impulse*invA*nx,impulse*invA*nz);
    a.yawRate=clamp(a.yawRate+impulse*invA*armA/aa.inertia,-2.65,2.65);
    const delta=impulse*invB;
    const s=prev||(b.impactSlide={tires:null});
    s.vx=bx-delta*nx;s.vz=bz-delta*nz;s.spin=clamp(spin-delta*armB/bb.inertia,-2.65,2.65);
    rock(b,-delta*nx,-delta*nz);b.brakes=b.path?1:0;b.speed=Math.hypot(s.vx,s.vz);
  }
  function slideStep(v,dt,wet,clear){
    const s=v.impactSlide,sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
    const vx=s.vx,vz=s.vz,lateral=vx*cs-vz*sn,along=vx*sn+vz*cs;
    const grip=(1-.31*wet)*dt,slow=(n,k)=>Math.sign(n)*Math.max(0,Math.abs(n)-k*grip);
    const roll=slow(along,v.path?6.4:8.1),scrub=slow(lateral,8.9);
    s.vx=sn*roll+cs*scrub;s.vz=cs*roll-sn*scrub;
    const spin=slow(s.spin,2.3),yaw=v.yaw+(s.spin+spin)*.5*dt;
    const x=v.x+(vx+s.vx)*.5*dt,z=v.z+(vz+s.vz)*.5*dt;
    if(clear(v,x,z,yaw)){
      v.x=x;v.z=z;v.yaw=yaw;s.spin=spin;
      v.wheelSpin=(v.wheelSpin+roll*dt/bayCarLayout(v.kind).wheel)%(Math.PI*2);
    }else{s.vx=s.vz=s.spin=0;}
    v.speed=Math.hypot(s.vx,s.vz);v.brakes=v.path?1:0;
    spring(v,"lean","rollRate",0,8.4,dt);spring(v,"pitch","pitchRate",0,10,dt);
    if(v.speed<.12&&Math.abs(s.spin)<.04&&Math.abs(v.lean)+Math.abs(v.pitch)<.009){
      v.impactSlide=null;v.speed=v.lean=v.pitch=v.rollRate=v.pitchRate=0;
      v.wait=v.path ? .85 : 0;v.findLane=!!v.path;
    }
  }
  window.BayDriving={cars,rearDrive,tireState,cool,settle,step,signedSpeed,world,local,tireOnStrip,clearance,contact,exchangeImpact,slideStep};
})();
