/* A distance-driven gait shared by the street model and the overhead player. */
(() => {
  "use strict";
  const tau=Math.PI*2;
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const blend=(a,b,t)=>a+(b-a)*t;
  const damp=(a,b,rate,dt)=>blend(a,b,-Math.expm1(-rate*dt));
  function smooth(lo,hi,x){
    const t=clamp((x-lo)/(hi-lo),0,1);
    return t*t*(3-2*t);
  }

  class PlayerMotion {
    constructor(){
      this.feet=[{restZ:.055},{restZ:-.042}];this.revision=0;this.reset();
    }
    reset(){
      this.vx=0;this.vz=0;this.phase=.20;this.weight=0;this.run=0;
      this.jumpTime=-1;this.jumpBuffer=0;this.lift=0;this.airPose=0;this.crouch=0;this.lead=1;
      this.stumble=0;this.stumblePose=0;this.ride=null;this.handTarget=null;this.console=null;
      this.turn=0;this.time=0;this.step(0,0,0);
    }
    jump(){
      if(this.jumpTime>=0){this.jumpBuffer=.14;return;}
      this.jumpTime=0;this.jumpBuffer=0;
      this.lead=this.feet[0].z>this.feet[1].z?-1:1;
    }
    clipRail(){this.stumble=.65;this.vx*=.48;this.vz*=.48;}
    jumpStep(dt){
      this.stumble=Math.max(0,this.stumble-dt);
      const stumbleProgress=1-this.stumble/.65;
      this.stumblePose=Math.sin(Math.PI*stumbleProgress)*(1-stumbleProgress);
      this.lift=0;this.airPose=0;this.crouch=0;
      if(this.jumpTime<0)return;
      this.jumpTime+=dt;this.jumpBuffer=Math.max(0,this.jumpBuffer-dt);
      const takeoff=.055,flight=.67,landing=.155;
      if(this.jumpTime<takeoff){this.crouch=smooth(0,takeoff,this.jumpTime);return;}
      const u=(this.jumpTime-takeoff)/flight;
      if(u<1){
        this.lift=3.76*u*(1-u);
        this.airPose=Math.sin(Math.PI*u);
        this.crouch=1-smooth(0,.17,u)+.38*smooth(.86,1,u);
      }else{
        const land=(this.jumpTime-takeoff-flight)/landing;
        this.crouch=(.38+.62*smooth(0,.29,land))*(1-smooth(.29,1,land));
        if(land>=1){this.jumpTime=-1;if(this.jumpBuffer>0)this.jump();}
      }
    }
    step(dt,distance,turnRate){
      const speed=dt>0?distance/dt:0;
      this.jumpStep(dt);
      this.weight=damp(this.weight,smooth(0,2.7,speed),16,dt);
      this.run=damp(this.run,smooth(3.65,7.1,speed),9,dt);
      this.turn=damp(this.turn,clamp(turnRate/5,-1,1)*this.weight,8,dt);
      const stride=2.38+1.42*this.run;
      this.phase=(this.phase+distance/stride*(1-this.airPose))%1;
      this.time+=dt;
      this.poseFeet();
    }
    poseFeet(){
      const stride=2.38+1.42*this.run;
      this.sampleFoot(this.feet[0],this.phase,stride);
      this.sampleFoot(this.feet[1],(this.phase+.5)%1,stride);
      this.revision++;
    }
    sampleFoot(foot,t,stride){
      const w=this.weight,run=this.run,stance=blend(.39,.255,run);
      const reach=stride*stance*.5;
      const heel=-.20+.055*run,toe=.40+.34*run;
      let z,lift=0,pitch;
      if(t<stance){
        // Root travel cancels this backward motion while the foot is planted.
        const u=t/stance;
        z=reach-stride*t;
        pitch=heel*(1-smooth(0,.32,u))+toe*smooth(.45,1,u);
      }else{
        const u=(t-stance)/(1-stance);
        // Match the stance velocity at both ends of the recovery arc.
        z=blend(-reach,reach,u*u*(3-2*u))-stride*(1-stance)*u*(1-u)*(1-2*u);
        const arc=Math.sin(Math.PI*u);
        lift=(.145+.245*run)*arc*arc*(1.25-.48*u);
        pitch=blend(toe,heel,smooth(.10,.86,u))+.22*run*arc*arc;
      }
      foot.phase=t;foot.z=blend(foot.restZ,z,w);foot.pitch=pitch*w;foot.lift=lift*w;
      if(this.airPose>0){
        const lead=(foot===this.feet[0]?-1:1)===this.lead;
        foot.z=blend(foot.z,lead?.31:-.25,this.airPose);
        foot.lift=blend(foot.lift,lead?.28:.19,this.airPose);
        foot.pitch=blend(foot.pitch,lead?-.08:.53,this.airPose);
      }
      const sn=Math.sin(foot.pitch),cs=Math.cos(foot.pitch);
      // Roll first on the heel, then on the toe, keeping the sole on the pavement.
      foot.y=.016+.153*cs+Math.max(-.090*sn,.169*sn)+foot.lift;
    }
  }

  const point=(x=0,y=0,z=0)=>[x,y,z];
  const hipY=.967,ankleY=.169;
  class Bone {
    constructor(pivot,tip){
      this.pivot=pivot;this.m=new Float32Array(12);
      if(tip){
        const x=tip[0]-pivot[0],y=tip[1]-pivot[1],z=tip[2]-pivot[2];
        this.length=Math.hypot(x,y,z);this.axis=point(x/this.length,y/this.length,z/this.length);
      }
    }
    anchor(at){
      const m=this.m,[x,y,z]=this.pivot;
      m[3]=at[0]-m[0]*x-m[1]*y-m[2]*z;
      m[7]=at[1]-m[4]*x-m[5]*y-m[6]*z;
      m[11]=at[2]-m[8]*x-m[9]*y-m[10]*z;
    }
    place(at,pitch=0,yaw=0,roll=0){
      const a=Math.cos(pitch),b=Math.sin(pitch),c=Math.cos(yaw),d=Math.sin(yaw),e=Math.cos(roll),f=Math.sin(roll),m=this.m;
      m[0]=c*e;m[1]=-c*f*a+d*b;m[2]=c*f*b+d*a;
      m[4]=f;m[5]=e*a;m[6]=-e*b;
      m[8]=-d*e;m[9]=d*f*a+c*b;m[10]=-d*f*b+c*a;
      this.anchor(at);
    }
    aim(from,to){
      const dx=to[0]-from[0],dy=to[1]-from[1],dz=to[2]-from[2],length=Math.hypot(dx,dy,dz);
      const x=dx/length,y=dy/length,z=dz/length,[a,b,c]=this.axis;
      const vx=b*z-c*y,vy=c*x-a*z,vz=a*y-b*x;
      const dot=a*x+b*y+c*z,inv=1/Math.max(.0001,1+dot),stretch=length/this.length-1,m=this.m;
      // Shortest rotation from the original segment to the solved joint direction.
      m[0]=dot+vx*vx*inv+stretch*x*a;m[1]=vx*vy*inv-vz+stretch*x*b;m[2]=vx*vz*inv+vy+stretch*x*c;
      m[4]=vy*vx*inv+vz+stretch*y*a;m[5]=dot+vy*vy*inv+stretch*y*b;m[6]=vy*vz*inv-vx+stretch*y*c;
      m[8]=vz*vx*inv-vy+stretch*z*a;m[9]=vz*vy*inv+vx+stretch*z*b;m[10]=dot+vz*vz*inv+stretch*z*c;
      this.anchor(from);
    }
    map(p,out){
      const m=this.m,[x,y,z]=p;
      out[0]=m[0]*x+m[1]*y+m[2]*z+m[3];
      out[1]=m[4]*x+m[5]*y+m[6]*z+m[7];
      out[2]=m[8]*x+m[9]*y+m[10]*z+m[11];
      return out;
    }
  }

  function makeSide(side){
    const hip=point(side*.101,hipY,0),knee=point(side*.109,.55,.014),ankle=point(side*.111,ankleY,0);
    const shoulder=point(side*.204,1.410,-.004),elbow=point(side*.249,1.185,0),hand=point(side*.235,1.004,.039);
    return {side,thigh:new Bone(hip,knee),shin:new Bone(knee,ankle),shoe:new Bone(ankle),
      arm:new Bone(shoulder,elbow),forearm:new Bone(elbow,hand),handPivot:hand,hand:point(),
      hip:point(),knee:point(),ankle:point(),shoulder:point(),elbow:point()};
  }
  function articulateLeg(limb,foot,weight,ride){
    const a=limb.hip,b=limb.ankle,k=limb.knee;
    b[0]=limb.side*(.111-.014*weight);b[1]=foot.y;b[2]=foot.z;
    let pitch=foot.pitch;
    if(ride){
      const tuck=limb.side===ride.side?ride.outer:ride.inner,over=Math.sin(Math.PI*tuck);
      b[0]+=ride.side*(limb.side===ride.side?.35:.12)*over;
      b[1]=blend(b[1],ride.floor+.175,tuck)+.23*over;
      b[2]=blend(b[2],limb.side===1?.46:.38,tuck)+.055*over;
      pitch=blend(pitch,-.13,tuck)-.16*over;
    }
    const x=b[0]-a[0],y=b[1]-a[1],z=b[2]-a[2],distance=Math.hypot(x,y,z);
    const ux=x/distance,uy=y/distance,uz=z/distance,upper=limb.thigh.length,lower=limb.shin.length;
    const along=(upper*upper-lower*lower+distance*distance)/(2*distance);
    // Bend the knee forward in the plane containing the hip, ankle and direction of travel.
    const across=Math.sqrt(Math.max(0,upper*upper-along*along))/Math.sqrt(Math.max(.0001,1-uz*uz));
    k[0]=a[0]+ux*along-across*ux*uz;
    k[1]=a[1]+uy*along-across*uy*uz;
    k[2]=a[2]+uz*along+across*(1-uz*uz);
    limb.thigh.aim(a,k);limb.shin.aim(k,b);limb.shoe.place(b,pitch,limb.side*.065*(1-weight));
  }
  function reachFor(limb,x,y,z,weight){
    if(weight<=0)return;
    const a=limb.shoulder,k=limb.elbow,b=limb.hand;limb.forearm.map(limb.handPivot,b);
    const dx=blend(b[0],x,weight)-a[0],dy=blend(b[1],y,weight)-a[1],dz=blend(b[2],z,weight)-a[2];
    const n=Math.max(.001,Math.hypot(dx,dy,dz)),ux=dx/n,uy=dy/n,uz=dz/n;
    const upper=limb.arm.length,lower=limb.forearm.length,d=clamp(n,.055,upper+lower-.001);
    b[0]=a[0]+ux*d;b[1]=a[1]+uy*d;b[2]=a[2]+uz*d;
    const mid=(upper*upper-lower*lower+d*d)/(2*d),bend=Math.sqrt(Math.max(0,upper*upper-mid*mid));
    const px=limb.side*.66,py=-.72,pz=-.38,dot=px*ux+py*uy+pz*uz;
    const ex=px-dot*ux,ey=py-dot*uy,ez=pz-dot*uz,f=bend/(Math.hypot(ex,ey,ez)||1);
    k[0]=a[0]+ux*mid+ex*f;k[1]=a[1]+uy*mid+ey*f;k[2]=a[2]+uz*mid+ez*f;
    limb.arm.aim(a,k);limb.forearm.aim(k,b);
  }
  function bind(a,b,t){
    if(t>=1)return {a:b.m,b:b.m,t:0};
    return {a:a.m,b:b.m,t};
  }

  // Triangle corners often share a joint and position but have different face
  // colours. Transform that point once, then copy only XYZ to the other corners.
  function skinPlan(rest,bindings){
    const bones=new Map(),seen=new Map(),unique=[],copies=[];
    const boneId=m=>{if(!bones.has(m))bones.set(m,bones.size);return bones.get(m);};
    const words=new Uint32Array(rest.buffer,rest.byteOffset,rest.length);
    for(let i=0;i<bindings.length;i++){
      const {a,b,t}=bindings[i],p=i*6;
      const key=boneId(a)+"/"+(t?boneId(b):0)+"/"+t+"/"+words[p]+"/"+words[p+1]+"/"+words[p+2];
      const other=seen.get(key);
      if(other===undefined){seen.set(key,p);unique.push(i);}
      else copies.push(p,other);
    }
    return {rest,bindings,count:bindings.length,unique:new Uint32Array(unique),copies:new Uint32Array(copies)};
  }

  class PlayerMesh {
    constructor(colors,role="driver"){
      this.pelvis=new Bone(point(0,hipY,0));this.chest=new Bone(point(0,1.0,0));this.head=new Bone(point(0,1.515,0));
      this.sides=[makeSide(-1),makeSide(1)];this.pivot=point();
      const mesh=new BayMesh(),parts=[];
      buildBayPerson(mesh,...colors,0,role,0,(part,side)=>parts.push({part,side,first:mesh.vertices.length/6}));
      this.rest=new Float32Array(mesh.vertices);this.vertices=this.rest.slice();this.bindings=[];this.lastRevision=-1;
      for(let j=0;j<parts.length;j++){
        const part=parts[j],end=parts[j+1]?.first??this.rest.length/6;
        const limb=this.sides[part.side===1?1:0];
        for(let i=part.first;i<end;i++)this.bindings.push(this.binding(part.part,limb,this.rest[i*6+1]));
      }
    }
    binding(part,limb,y){
      if(part==="held")return bind(limb.forearm,limb.forearm,0);
      if(part==="leg"){
        if(y<.24)return bind(limb.shoe,limb.shin,smooth(.148,.213,y));
        if(y<.66)return bind(limb.shin,limb.thigh,smooth(.50,.60,y));
        return bind(limb.thigh,this.pelvis,smooth(.90,.982,y));
      }
      if(part==="arm"){
        if(y<1.30)return bind(limb.forearm,limb.arm,smooth(1.145,1.225,y));
        return bind(limb.arm,this.chest,smooth(1.362,1.435,y));
      }
      if(part==="head")return bind(this.head,this.head,0);
      if(y>1.43)return bind(this.chest,this.head,smooth(1.43,1.54,y));
      return bind(this.pelvis,this.chest,smooth(.958,1.32,y));
    }
    update(motion){
      if(this.lastRevision===motion.revision)return false;
      this.lastRevision=motion.revision;
      const w=motion.weight,run=motion.run,t=motion.phase*tau,ride=motion.ride;
      const breath=Math.sin(motion.time*1.68),swing=Math.cos(t+.12),roll=Math.sin(t+.40)*w;
      const reach=this.sides[0].thigh.length+this.sides[0].shin.length-.004;
      let height=hipY-.010-w*(.083+.01*run)+w*(.019+.033*run)*Math.sin(2*t-.70);
      const desk=motion.console?.amount||0;
      for(const f of motion.feet)height=Math.min(height,f.y+Math.sqrt(Math.max(.001,reach*reach-f.z*f.z))-.003*w);
      height-=.145*motion.crouch+.095*motion.stumblePose+.082*desk;
      if(ride)height=blend(height,ride.seatY+.029,ride.seat)-ride.duck*.18-ride.latchDip;
      const hipYaw=swing*w*(.065+.046*run),hipRoll=.027*roll-motion.turn*.037;
      const at=this.pivot;
      at[0]=.024*roll+.009*Math.sin(motion.time*.79)*(1-w)+.36*desk*(motion.console?.shift||0);at[1]=height;at[2]=.25*desk;
      this.pelvis.place(at,.018*w,hipYaw,hipRoll);
      this.pelvis.map(this.chest.pivot,at);at[1]+=.004*breath*(1-w);
      const chestYaw=-swing*w*(.085+.115*run);
      const pitch=.016+(.079+.18*run)*w+.009*breath*(1-w)+motion.crouch*.22+motion.stumblePose*.46;
      const cabinPitch=ride?ride.duck*.61+ride.seat*.055:.78*desk;
      this.chest.place(at,pitch+cabinPitch,chestYaw,-hipRoll*.48-motion.turn*.105+(ride?ride.side*(.18*ride.duck-.24*ride.pull):0));
      this.chest.map(this.head.pivot,at);
      this.head.place(at,.015+.034*w+.014*Math.sin(2*t-.55)*w+cabinPitch*.50,chestYaw*.18,-motion.turn*.036);
      for(let i=0;i<2;i++){
        const limb=this.sides[i],foot=motion.feet[i],side=limb.side;
        this.pelvis.map(limb.thigh.pivot,limb.hip);articulateLeg(limb,foot,w,ride);
        this.chest.map(limb.arm.pivot,limb.shoulder);
        const pump=Math.cos(foot.phase*tau+.19)*w;
        const upperPitch=blend(pump*(.46+.51*run)-.02+.012*breath*(1-w),
          side===motion.lead?.62:-.94,motion.airPose)+.32*motion.crouch-.40*motion.stumblePose;
        const outward=side*(.032+w*(.035+.088*run)+.23*motion.airPose+.42*motion.stumblePose);
        limb.arm.place(limb.shoulder,upperPitch,chestYaw*.47,outward);
        limb.arm.map(limb.forearm.pivot,limb.elbow);
        limb.forearm.place(limb.elbow,upperPitch-.11-w*(.41+.80*run),chestYaw*.58,outward*.55);
        if(ride){
          const hand=side===ride.side?ride.pull:ride.reach;
          const grip=ride.seat*(1-hand),turn=ride.steer*.85;
          if(ride.passenger)reachFor(limb,side*.12,ride.seatY+.18,.19,grip);
          else reachFor(limb,side*.105*Math.cos(turn),ride.seatY+.41-side*.105*Math.sin(turn),.32,grip);
          if(hand>0)reachFor(limb,...ride.handle,hand);
        }else if(motion.console){
          const hand=side<0?motion.console.left:motion.console.right;
          reachFor(limb,hand.x,hand.y,hand.z,hand.weight);
        }else if(side===1&&motion.canopy>0&&!motion.handTarget){
          reachFor(limb,.24,1.26,.19,motion.canopy);
        }else if(side===1&&motion.handTarget){
          const h=motion.handTarget;reachFor(limb,h.x,h.y,h.z,h.weight);
        }
      }
      this.skin();return true;
    }
    startle(r){
      const guard=r.guard,air=r.air,bend=r.bend,at=this.pivot;
      at[0]=.042*r.lead*(air+bend*.45);at[1]=hipY-.22*bend-.10*air;at[2]=-.035*guard;
      this.pelvis.place(at,.09*bend,-.09*r.lead*guard,.046*r.lead*air);
      this.pelvis.map(this.chest.pivot,at);
      this.chest.place(at,-.24*guard+.30*bend,.14*r.lead*guard,-.085*r.lead*guard);
      this.chest.map(this.head.pivot,at);this.head.place(at,.08*guard,.20*r.lead*guard);
      for(const limb of this.sides){
        const lead=limb.side===r.lead,side=limb.side;
        this.pelvis.map(limb.thigh.pivot,limb.hip);
        const foot={y:ankleY+air*(lead?.20:.09),z:air*(lead?.19:-.18)+guard*(lead?.058:-.06),pitch:air*(lead?.20:.46)};
        articulateLeg(limb,foot,0,null);
        this.chest.map(limb.arm.pivot,limb.shoulder);
        limb.arm.place(limb.shoulder,-.06,0,.04*side);limb.arm.map(limb.forearm.pivot,limb.elbow);
        limb.forearm.place(limb.elbow,-.14);
        reachFor(limb,side*(lead?.29:.42),limb.shoulder[1]+(lead?.14:-.035),lead?.23:.255,guard);
      }
      this.skin();
    }
    skin(){
      const dst=this.vertices,src=this.rest;
      if(!this.bindings.length)return;
      let plan=this.skinMap;
      if(plan?.rest!==src||plan.bindings!==this.bindings||plan.count!==this.bindings.length)plan=this.skinMap=skinPlan(src,this.bindings);
      for(let k=0;k<plan.unique.length;k++){
        const i=plan.unique[k],j=i*6;
        const {a,b,t}=this.bindings[i],x=src[j],y=src[j+1],z=src[j+2];
        const ax=a[0]*x+a[1]*y+a[2]*z+a[3],ay=a[4]*x+a[5]*y+a[6]*z+a[7],az=a[8]*x+a[9]*y+a[10]*z+a[11];
        dst[j]=t?blend(ax,b[0]*x+b[1]*y+b[2]*z+b[3],t):ax;
        dst[j+1]=t?blend(ay,b[4]*x+b[5]*y+b[6]*z+b[7],t):ay;
        dst[j+2]=t?blend(az,b[8]*x+b[9]*y+b[10]*z+b[11],t):az;
      }
      const pairs=plan.copies;
      for(let k=0;k<pairs.length;k+=2){
        const to=pairs[k],from=pairs[k+1];dst[to]=dst[from];dst[to+1]=dst[from+1];dst[to+2]=dst[from+2];
      }
    }
  }
  window.BayPlayerMotion=PlayerMotion;
  window.BayPlayerMesh=PlayerMesh;
})();
