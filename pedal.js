(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),damp=(a,b,k,dt)=>a+(b-a)*-Math.expm1(-k*dt);
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const places=BayBoardwalkArt.places;
  const footprint={track:.32,halfLength:.88};
  const job={id:"bell-run",name:"Last Bell Run",by:"Javi Reyes"};
  const lanes=[[159.1,-60.6],[159.1,-36],[159.1,40],[160.0,81],[164.6,98],[168.1,102.0],
    [168.7,102.7],[167.7,104.1],[165.6,103.1],[162.9,96],[162.7,78],[162.7,-41],
    [162.5,-57],[161.2,-62],[159.7,-62.1]];
  function bike(id,start){
    return {...start,id,name:id==="marlin"?"Marlin beach cruiser":id==="north"?"North Boardwalk cruiser":"Javi Reyes",color:BayPedalArt.paint[id],
      footprint,speed:0,yaw:start.yaw||0,steer:0,lean:0,pitch:0,crank:0,wheelSpin:0,air:0,airTime:-1,effort:0,stamina:1,
      side:-1,mount:id==="javi"?1:0,rider:id==="javi"?"javi":null,reach:0,pouch:false,vx:0,vz:0,bell:0};
  }
  function read(raw){
    const out={};
    for(const id of ["marlin","north"]){
      const b=raw?.[id];
      if(b&&Number.isFinite(b.x)&&b.x>=-184&&b.x<=211&&Number.isFinite(b.z)&&b.z>=-182&&b.z<=405&&Number.isFinite(b.yaw))out[id]={x:b.x,z:b.z,yaw:b.yaw};
    }return out;
  }
  class Fleet{
    constructor(parked){
      this.bikes=["marlin","north"].map(id=>bike(id,parked[id]||places[id]));
      this.javi=bike("javi",{x:lanes[0][0],z:lanes[0][1],yaw:0});this.javi.motion=new BayPlayerMotion();
      this.leg=1;this.rest=35;this.riding=null;this.transfer=null;this.run=null;this.match=null;
    }
    nearest(p){return this.bikes.reduce((a,b)=>distance(a,p)<distance(b,p)?a:b);}
    mount(b,p,clear){
      const local=BayDriving.local(b,p.x,p.z),side=local.x<0?-1:1;
      for(const s of [side,-side]){
        const q=BayPedalArt.point(b,0,s,0);
        if(!clear(q.x,q.z,.28))continue;
        b.side=s;b.rider="player";this.riding=b;this.transfer={out:false,u:0,approach:true};return true;
      }return false;
    }
    dismount(clear){
      const b=this.riding;if(!b||this.transfer||Math.abs(b.speed)>2.65||b.airTime>=0)return false;
      for(const s of [b.side,-b.side]){
        const q=BayPedalArt.point(b,0,s,0);if(!clear(q.x,q.z,.32))continue;
        b.side=s;b.speed=b.vx=b.vz=b.effort=0;b.lean=b.steer=b.pitch=0;this.transfer={out:true,u:1};return true;
      }return false;
    }
    detach(){
      const b=this.riding;if(!b)return;
      b.rider=null;b.mount=b.reach=b.speed=b.air=b.effort=b.vx=b.vz=b.steer=b.lean=b.pitch=0;b.airTime=-1;b.passPoint=null;b.pouch=false;
      this.transfer=null;this.riding=null;
    }
    hop(){const b=this.riding;if(!b||this.transfer||b.airTime>=0)return;b.airTime=0;}
    start(){this.run={phase:"meet",clock:0,limit:0,hold:0,side:1,line:"",leg:this.leg<=6?"Northbound":"Southbound"};this.javi.pouch=true;}
    cancel(){this.run=this.match=null;this.javi.pouch=false;this.javi.passPoint=null;for(const b of this.bikes){b.pouch=false;b.passPoint=null;}}
    target(p){if(this.run.phase==="deliver")return places.counter;return this.riding?this.javi:this.nearest(p);}
    transferStep(dt,hero,motion,level,park){
      const b=this.riding,a=this.transfer;
      if(a.approach){
        const q=BayPedalArt.point(b,0,b.side,level(b.x,b.z)),dx=q.x-hero.x,dz=q.z-hero.z,l=Math.hypot(dx,dz),step=Math.min(l,dt*3.5);
        if(l>.01){hero.x+=dx/l*step;hero.z+=dz/l*step;hero.y=level(hero.x,hero.z);hero.yaw+=turn(hero.yaw,Math.atan2(dx,dz))*-Math.expm1(-13*dt);}
        motion.step(dt,step,0);if(l-step<.025)a.approach=false;return;
      }
      a.u=clamp(a.u+(a.out?-1:1)*dt/1.06,0,1);b.mount=a.u*a.u*(3-2*a.u);
      Object.assign(hero,BayPedalArt.point(b,b.mount,b.side,level(b.x,b.z)));motion.step(dt,0,0);
      if(a.out&&a.u===0){this.detach();park(b);motion.reset();}
      else if(!a.out&&a.u===1){this.transfer=null;b.pouch=this.run?.phase==="deliver";}
    }
    ride(dt,input,env){
      const b=this.riding,j=this.javi;
      if(this.transfer){this.transferStep(dt,env.hero,env.motion,env.level,env.park);return;}
      const sand=b.x>167&&b.z<181,burst=input.pedal&&input.sprint&&b.stamina>.02;
      b.stamina=clamp(b.stamina+(burst?-.078:.093)*dt,0,1);
      let cap=(burst?14.2:9.45)*(sand?.76:1);
      const jgap=distance(b,j),pace=input.hold&&this.run?.phase==="meet"&&jgap<6&&j.speed>2&&Math.abs(turn(b.yaw,j.yaw))<.62;
      const same=pace?BayDriving.local(j,b.x,b.z):null;
      let steerTarget=input.steer*(.60-.34*Math.min(1,Math.abs(b.speed)/10));
      if(pace){
        cap=clamp(j.speed-same.z*1.32,2,8);
        if(!input.steer&&Math.abs(same.x)>.70&&Math.abs(same.x)<2.65&&Math.abs(same.z)<2.6){
          const alongside=j.yaw+clamp((Math.sign(same.x)*1.17-same.x)*.69,-.36,.36);
          steerTarget=clamp(turn(b.yaw,alongside)*.93,-.27,.27);
        }
      }
      const steer=damp(b.steer,steerTarget,9,dt);
      const speed=b.speed;
      const slope=(env.level(b.x+Math.sin(b.yaw)*.5,b.z+Math.cos(b.yaw)*.5)-env.level(b.x-Math.sin(b.yaw)*.5,b.z-Math.cos(b.yaw)*.5));
      if(input.brake)b.speed=Math.max(0,b.speed-dt*9);
      else if(input.pedal||pace)b.speed=damp(b.speed,cap,pace?2.75:burst?.72:.61,dt);
      else b.speed=Math.max(0,b.speed-(.32+.005*b.speed*b.speed+(sand?.52:0))*dt);
      b.speed=clamp(b.speed-clamp(slope,-.5,.5)*4.2*dt,0,17);b.steer=steer;
      const dab=b.speed<1.1?input.steer*.73*(1-b.speed/1.1):0;
      const yawRate=(clamp(b.speed*Math.tan(steer)/1.13,-2,2)+dab)*(b.air>.09?.16:1);
      b.yaw+=yawRate*dt;b.lean=damp(b.lean,clamp(yawRate*b.speed*.032,-.37,.37),8,dt);
      const roll=(speed+b.speed)*.5*dt;
      if(b.airTime>=0){b.airTime+=dt;const u=clamp(b.airTime/.76,0,1);b.air=2.50*u*(1-u);if(u===1)b.airTime=-1;}
      b.pitch=damp(b.pitch,clamp(slope,-.32,.32)+(b.airTime>=0?.19*Math.sin(b.airTime/.76*Math.PI*2):0),9,dt);
      const dx=Math.sin(b.yaw)*roll,dz=Math.cos(b.yaw)*roll,nx=b.x+dx,nz=b.z+dz;
      if(env.clear(nx,nz,b)){b.x=nx;b.z=nz;b.vx=dx/dt;b.vz=dz/dt;b.wheelSpin+=roll/.345;}
      else{b.speed=b.vx=b.vz=0;}
      b.effort=damp(b.effort,input.pedal||pace?(burst?1:.63):0,8,dt);
      b.crank+=b.effort*(4.7+Math.min(7,b.speed)*.57)*dt;b.bell=Math.max(0,b.bell-dt);
      Object.assign(env.hero,BayPedalArt.point(b,1,b.side,env.level(b.x,b.z)));env.motion.step(dt,0,0);
    }
    courier(dt){
      const j=this.javi,b=this.riding,run=this.run,meeting=run?.phase==="meet",near=b&&!this.transfer&&distance(b,j)<18;
      if(this.rest>0){
        this.rest=Math.max(0,this.rest-dt);
        if(meeting)this.rest=near?0:Math.max(.12,this.rest);
        j.speed=damp(j.speed,0,6,dt);j.effort=damp(j.effort,0,5,dt);
      }else{
        const q=lanes[this.leg],dx=q[0]-j.x,dz=q[1]-j.z,len=Math.hypot(dx,dz);
        const target=meeting?(b&&distance(b,j)<12?4.15:3.25):4.8;
        j.speed=damp(j.speed,target,1.65,dt);const n=Math.min(len,j.speed*dt),yaw=Math.atan2(dx,dz);
        const a=turn(j.yaw,yaw);j.steer=damp(j.steer,clamp(a,-.48,.48),9,dt);j.lean=damp(j.lean,clamp(a*.28,-.26,.26),7,dt);
        if(len>.001){j.x+=dx/len*n;j.z+=dz/len*n;j.yaw+=a*-Math.expm1(-5*dt);}
        j.effort=damp(j.effort,.58,4,dt);j.wheelSpin+=n/.345;
        if(len-n<.015){if(this.leg===6||this.leg===0)this.rest=meeting&&near?1.8:19;this.leg=(this.leg+1)%lanes.length;}
      }
      if(j.airTime<0&&j.z> -9.9&&j.z<-8.42&&this.leg===11)j.airTime=0;
      if(j.airTime>=0){
        j.airTime+=dt;const u=clamp(j.airTime/.76,0,1);j.air=2.50*u*(1-u);
        j.pitch=.14*Math.sin(u*Math.PI*2);if(u===1)j.airTime=-1;
      }
      j.crank+=j.effort*(3+j.speed)*dt;j.motion.step(dt,0,0);
    }
    handoff(dt,hold,level){
      const run=this.run,b=this.riding,j=this.javi;
      this.match=null;
      if(run?.phase==="deliver")run.clock+=dt;
      let extension=0,side=run?.side||1;
      if(run?.phase==="meet"&&b&&!this.transfer){
        const p=BayDriving.local(j,b.x,b.z);
        const aligned=Math.abs(turn(b.yaw,j.yaw))<.50,abreast=Math.abs(p.x)>=.76&&Math.abs(p.x)<=2.12&&Math.abs(p.z)<1.63;
        const matched=aligned&&abreast&&j.speed>2.1&&b.speed>2.1&&Math.abs(j.speed-b.speed)<2.1;
        const touching=matched&&Math.abs(p.x)<=1.29&&Math.abs(p.z)<.27&&Math.abs(turn(b.yaw,j.yaw))<.18;
        this.match={aligned,abreast,matched,touching,gap:distance(b,j),pace:Math.round(j.speed*2.237)};
        if(matched&&hold){run.side=side=Math.sign(p.x);run.hold=Math.min(touching?1:.55,run.hold+dt/.76);}
        else run.hold=Math.max(0,run.hold-dt*2.4);
        extension=run.hold;
        if(run.hold===1){
          j.pouch=false;b.pouch=true;run.phase="deliver";run.clock=0;run.limit=Math.ceil(distance(b,places.counter)/7.2)+23;
          run.leg=this.leg>=7?"Southbound":"Northbound";run.release=.40;
        }
      }else if(run?.release>0){run.release=Math.max(0,run.release-dt);extension=run.release/.40;}
      j.reach=side*extension;if(b)b.reach=-side*extension;
      j.passPoint=extension&&b?{x:(b.x+j.x)*.5,y:level(j.x,j.z)+1.3,z:(b.z+j.z)*.5}:null;
      if(b)b.passPoint=j.passPoint;
    }
    guide(){
      if(!this.riding)return this.run.phase==="deliver"?"Carry the red pouch to Mags’s ticket window":"Pick up a beach cruiser at the rack";
      if(this.run.phase==="deliver")return "Bring the tickets to Mags at the Coast Wheel";
      const m=this.match;if(!m||m.gap>9)return "Catch Javi on the promenade";
      if(m.matched)return "Hold F for the pouch  ·  "+Math.round(this.run.hold*100)+"%";
      return m.aligned?"Ride beside Javi  ·  Hold F to match his pace":"Turn and ride in Javi’s direction";
    }
  }
  window.BayPedal={Fleet,read,job};
})();
