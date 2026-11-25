/* Sol Beach. Tire paths compact the sand until the next wash or passing traffic. */
(() => {
  const home={x:180.8,z:-12,yaw:-Math.PI/2},park={x:169.4,z:-12,yaw:-Math.PI/2};
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  function read(raw){
    const b=raw?.boards;
    return {open:raw?.open===true,rev:Number.isSafeInteger(raw?.rev)?Math.max(0,raw.rev):0,
      boards:raw?.open&&b&&[b.x,b.z,b.yaw].every(Number.isFinite)&&b.x>=166&&b.x<212&&Math.abs(b.z)<182?{x:b.x,z:b.z,yaw:b.yaw}:null};
  }
  function tide(z,t){return 204.7+1.55*Math.sin(z*.034+t*.64)+.72*Math.sin(z*.090-t*.9);}
  function boardGrip(b,x,z){
    if(!b||Math.abs(x-b.x)>3.4||Math.abs(z-b.z)>3.4)return false;
    const l=BayDriving.local(b,x,z);return Math.abs(l.z)<=.83&&Math.abs(Math.abs(l.x)-.83)<=.31;
  }
  class Beach {
    constructor(v,book){
      this.v=v;this.book=book;this.ruts=[];this.lastTire=new WeakMap();this.grid=new Map();this.revision=0;
      this.feet=[];this.lastFoot=null;this.thrust=0;this.ro={motion:new BayPlayerMotion()};this.reset();
    }
    reset(){
      const v=this.v;BayDriving.settle(v);Object.assign(v,this.book.open?park:home);
      this.phase=this.book.open?"stand":"stuck";this.clock=0;this.advance=0;this.charge=0;this.strokes=0;
      this.pushing=false;this.carry=false;this.thrust=0;
      this.ro.motion.reset();this.unload=0;Object.assign(this.ro,this.book.open?this.standAt():v,{yaw:v.yaw,y:.03});
    }
    cell(x,z){return Math.floor(x*2)*2048+Math.floor(z*2);}
    packed(x,z,t){
      const born=this.grid.get(this.cell(x,z));
      return born==null?0:clamp(1-(t-born)/110);
    }
    surface(v,t,y,wet){
      if(v.x<=166.45||v.x>=211||Math.abs(v.z)>181||y>.040||y<-.075)return null;
      const coast=clamp((v.x-tide(v.z,t)+3.5)/5.5);
      const inland=clamp((v.x-166.45)/6),loose=inland*(1-coast)*(.89+.11*Math.sin(v.z*.14+v.x*.19));
      const shape=v.footprint||bayCarLayout(v.kind),axle=shape.axles[BayDriving.rearDrive.has(v.kind)?0:1];
      let bite=0,boards=0;
      for(const side of [-1,1]){
        const p=BayDriving.world(v,side*(shape.track-.08),axle);
        const time=this.grid.get(this.cell(p.x,p.z));
        // A car cannot benefit from the imprint it is making at this very instant.
        if(time!=null&&t-time>.8)bite+=this.packed(p.x,p.z,t)*.5;
        if(boardGrip(this.book.boards,p.x,p.z))boards+=.5;
      }
      const soft=clamp(loose*(1-.44*wet)*(1-.65*bite)*(1-.94*boards));
      return {soft,grip:clamp(.84-.36*soft+.14*Math.max(bite,boards),.43,.98),boards};
    }
    track(v,t,sand){
      if(!sand){this.lastTire.delete(v);return;}
      const prev=this.lastTire.get(v),s=v.footprint||bayCarLayout(v.kind);
      if(prev&&Math.hypot(v.x-prev.x,v.z-prev.z)<.44&&Math.abs(Math.sin(v.yaw-prev.yaw))<.19)return;
      const pair=[-1,1].map(sign=>BayDriving.world(v,sign*(s.track-.08),s.axles[0]));
      if(prev&&Math.hypot(v.x-prev.x,v.z-prev.z)<3.7){
        for(let i=0;i<2;i++){
          const a=prev.pair[i],b=pair[i],d=Math.hypot(a.x-b.x,a.z-b.z);
          if(d<.06)continue;
          this.ruts.push({a,b,width:.12+.075*sand.soft,soft:sand.soft,time:t});
          const n=Math.ceil(d/.24);
          for(let j=0;j<=n;j++)this.grid.set(this.cell(a.x+(b.x-a.x)*j/n,a.z+(b.z-a.z)*j/n),t);
        }
        if(this.ruts.length>380)this.ruts.splice(0,this.ruts.length-380);
        this.revision++;
      }
      this.lastTire.set(v,{x:v.x,z:v.z,yaw:v.yaw,pair});
    }
    clean(t){
      if(t<(this.cleanAt??0))return;
      this.cleanAt=t+4;
      const first=this.ruts.findIndex(p=>t-p.time<110);
      if(first!==0&&this.ruts.length){this.ruts.splice(0,first<0?this.ruts.length:first);this.revision++;}
      for(const [id,born] of this.grid)if(t-born>110)this.grid.delete(id);
      while(this.feet.length&&t-this.feet[0].time>85){this.feet.shift();this.revision++;}
    }
    footstep(v,m,t){
      if(v.x<166.7||v.x>210||Math.abs(v.z)>181||v.y>.043||v.y<-.07||m.jumpTime>=0||m.weight<.22){this.lastFoot=null;return;}
      const side=m.feet[0].phase<m.feet[1].phase?-1:1;
      if(this.lastFoot===side)return;
      this.lastFoot=side;
      const foot=m.feet[side<0?0:1],p=BayDriving.world(v,side*.118,foot.z+.046);
      this.feet.push({...p,yaw:v.yaw+side*.09,time:t});if(this.feet.length>110)this.feet.shift();this.revision++;
    }
    back(){return BayDriving.world(this.v,0,-bayCarLayout(this.v.kind).halfLength-.48);}
    rack(){return BayDriving.world(this.v,-1.62,.1);}
    standAt(){return BayDriving.world(this.v,-2.25,-.78);}
    attend(dt,t,hero,ground){
      const v=this.v,p=this.ro,m=p.motion;
      if(this.phase==="stuck"||this.phase==="leaving"||this.phase==="unload"&&this.unload<1.45){
        const seat=this.phase==="unload"?clamp(1-this.unload/1.45):1;
        BayCarAccess.pose(v,-1,seat,p,m,ground,dt);return;
      }
      m.ride=null;v.doorAngle=0;const target=this.standAt(),dx=target.x-p.x,dz=target.z-p.z,len=Math.hypot(dx,dz);
      const stride=Math.min(len,dt*1.25),face=len>.07?Math.atan2(dx,dz):Math.hypot(hero.x-p.x,hero.z-p.z)<6?Math.atan2(hero.x-p.x,hero.z-p.z):v.yaw+.75;
      p.yaw+=Math.atan2(Math.sin(face-p.yaw),Math.cos(face-p.yaw))*-Math.expm1(-6*dt);
      if(len>.001){p.x+=dx*stride/len;p.z+=dz*stride/len;}p.y=ground(p.x,p.z);
      m.step(dt,stride,0);
      const reach=this.phase==="unload"?clamp((this.unload-1.45)/.42)*clamp((3.9-this.unload)/.6):0;
      m.handTarget=reach?{x:.23,y:1.06,z:.35,weight:reach}:null;m.crouch=.28*reach;
    }
    get forward(){return this.clock%2.8>=1.31&&this.clock%2.8<2.49;}
    get signal(){const u=this.clock%2.8;return u>.85&&u<1.02||u>1.13&&u<1.30;}
    step(dt,t,held,clear){
      const v=this.v;this.clean(t);
      if(this.phase==="stand")return;
      this.clock+=dt;
      if(this.phase==="unload"){
        this.unload+=dt;
        if(this.unload>=4){this.phase="stand";return "parked";}
        return;
      }
      if(this.phase==="leaving"){
        v.brakes=0;const dist=v.x-park.x,dx=Math.min(dist,dt*(.85+Math.min(2,this.clock*1.55,dist)));
        if(dx>.001&&!clear(v.x-dx,v.z)){v.speed=0;v.brakes=1;return;}
        v.x-=dx;v.speed=dx/dt;v.wheelSpin+=dx/.32;this.track(v,t,{soft:.55});
        if(v.x<=park.x+.015){Object.assign(v,park);BayDriving.settle(v);this.phase="unload";this.unload=0;}
        return;
      }
      const forward=this.forward,bracing=held&&this.pushing;
      if(!forward)this.charge=clamp(this.charge+dt*(bracing?-1.25:1.55));
      if(forward&&!this.wasForward){this.loaded=this.charge;this.charge=0;this.stroke=false;}
      this.wasForward=forward;
      this.thrust+=(Number(bracing)-this.thrust)*-Math.expm1(-7*dt);
      const old=v.x,oldAdvance=this.advance,pulse=Math.sin(Math.max(0,(this.clock%2.8-1.31)/1.18)*Math.PI);
      if(forward&&bracing&&this.loaded>.38){
        this.advance+=dt*this.loaded*(.45+.97*Math.max(0,pulse));if(!this.stroke){this.strokes++;this.stroke=true;}
      }
      const rock=.12*Math.sin(this.clock*2*Math.PI/2.8)*(1-this.thrust*.56);
      const next=home.x-this.advance-rock;
      if(!this.pushing||clear(next,v.z))v.x=next;else this.advance=oldAdvance;
      v.speed=(old-v.x)/dt;v.pitch=rock*.18+this.thrust*.018;v.brakes=forward?0:1;
      v.wheelSpin+=(forward?4.4+this.thrust*4:-1.65)*dt;v.headlightFlash=this.signal?t:-Infinity;
      this.track(v,t,{soft:.94});
      if(this.advance>=2.35){
        this.pushing=false;this.phase="leaving";this.clock=0;this.book.open=true;this.book.rev++;return "free";
      }
    }
    placement(hero,cars){
      let near=null,distance=4.7;
      for(const v of cars){
        if(v===this.v||Math.abs(v.speed)>.55||v.x<166.9||v.x>209||Math.abs(v.z)>180)continue;
        const d=Math.hypot(hero.x-v.x,hero.z-v.z);
        if(d<distance){near=v;distance=d;}
      }
      if(near){
        const shape=near.footprint||bayCarLayout(near.kind),axle=shape.axles[BayDriving.rearDrive.has(near.kind)?0:1];
        return {...BayDriving.world(near,0,axle+.64),yaw:near.yaw,car:near};
      }
      return {...BayDriving.world(hero,0,1.65),yaw:hero.yaw};
    }
  }
  window.BaySoftSand={Beach,read,home,park,tide,boardGrip};
})();
