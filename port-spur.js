/* Port Sol's industrial switcher. All stock positions and protected crossings
   use the same track centreline, including during a reversing movement. */
(() => {
  "use strict";
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  function bend(x,a,b){const u=clamp((x-a)/(b-a),0,1);return u*u*(3-2*u);}
  function track(x){
    return -126.4-6.9*bend(x,-134,-122)+4.4*bend(x,-99,-87)-10.1*bend(x,-80,-61);
  }
  function pose(x){return {x,z:track(x),yaw:Math.atan2(1,(track(x+.03)-track(x-.03))/.06)};}
  const west={id:"shed",name:"Port Sol cold store",x:-170,freight:"Block ice"},east={id:"market",name:"Mercado team track",x:-49,freight:"Empty ice boxes"};
  for(const s of [west,east]){
    s.desk={x:s.x+.3,z:track(s.x)+2.75,name:s.name+" · Port Sol Belt",kind:"freight-desk"};
    s.berth={x:s.x-6.50,z:track(s.x-6.50)+1.85};
  }
  const engineShape={track:1.14,halfLength:3.26},vanShape={track:1.06,halfLength:2.88};
  const crosses=[-144,-72];
  function saved(raw){
    const n=(v,limit)=>Number.isSafeInteger(v)&&v>=0?Math.min(v,limit):0;
    return {known:raw?.known===true,runs:n(raw?.runs,1000000),best:n(raw?.best,100),last:n(raw?.last,100),
      destination:raw?.destination===west.id?west.id:raw?.destination===east.id?east.id:""};
  }
  const station=id=>id===west.id?west:east;
  class Line{
    constructor(){
      this.x=west.x;this.speed=0;this.dir=1;this.destination=east;this.at=west;this.cargo=west.freight;
      this.dwell=16;this.clock=0;this.trip=null;this.aboard=false;this.transfer=null;this.held=false;
      this.handling=null;this.marketIce=false;
      this.engine={...pose(this.x),footprint:engineShape};this.van={...pose(this.x-6.50),footprint:vanShape};
      this.gates=crosses.map(x=>({x,z:track(x),angle:0,age:0,warning:false}));this.wheels=0;this.stepStock();
    }
    stepStock(){
      Object.assign(this.engine,pose(this.x),{speed:this.speed*this.dir});Object.assign(this.van,pose(this.x-6.50));
    }
    cabStep(){
      const p=this.engine,c=Math.cos(p.yaw),s=Math.sin(p.yaw);return {x:p.x-c*1.64-s*1.15,z:p.z+s*1.64-c*1.15};
    }
    seat(){
      const p=this.engine,s=Math.sin(p.yaw),c=Math.cos(p.yaw);return {x:p.x-s*1.19-c*.46,z:p.z-c*1.19+s*.46,y:1.09,yaw:p.yaw};
    }
    order(s){
      if(this.trip||this.aboard)return false;
      this.trip={start:s,target:s===west?east:west,phase:"board",bumps:0,seconds:0,reverse:false,unload:0};
      return true;
    }
    board(p){
      if(this.aboard||this.transfer||!this.at||this.speed>.04||Math.hypot(p.x-this.cabStep().x,p.z-this.cabStep().z)>3.45)return false;
      if(this.trip&&(this.trip.phase!=="board"||this.at!==this.trip.start))return false;
      this.transfer={out:false,f:0,start:{x:p.x,z:p.z,y:p.y||.1},end:this.seat()};this.dwell=Math.max(2,this.dwell);
      return true;
    }
    dismount(){
      if(!this.aboard||this.transfer||this.speed>.12||!this.at)return false;
      this.transfer={out:true,f:0,start:this.seat(),end:{...this.cabStep(),y:.13}};
      return true;
    }
    tripBrake(){if(this.trip&&this.trip.phase==="drive"&&this.speed<.18){this.dir*=-1;return true;}return false;}
    handOver(){
      const r=this.trip;
      if(!r||r.phase!=="drive"||!this.aboard||this.speed>.18||Math.abs(this.x-r.target.x)>1.0)return false;
      r.error=Math.abs(this.x-r.target.x);r.phase="unload";this.at=r.target;this.speed=0;
      this.handling={station:r.target,time:0};return true;
    }
    cancel(){
      this.trip=null;if(this.at){this.destination=this.at===west?east:west;this.dwell=7;}
      this.dir=Math.sign(this.destination.x-this.x)||1;
    }
    stopDistance(v,ux,uz,half){
      if(Math.abs(uz)<.60||v.x> -65||v.x< -151||v.z< -176||v.z> -87)return Infinity;
      for(const g of this.gates){
        if(!g.warning||Math.abs(v.x-g.x)>6.1)continue;
        const d=(g.z-v.z)*Math.sign(uz);
        if(d<half+2.45||d>38)continue;
        return Math.max(0,d-half-5.85);
      }return Infinity;
    }
    clearance(x,z){
      if(Math.abs(x-this.x)>12||Math.abs(z-this.engine.z)>8)return Infinity;
      const p={x,z};return Math.min(BayDriving.clearance(this.engine,p),BayDriving.clearance(this.van,p));
    }
    waitOnFoot(p,x,z){
      if(z< -154||z> -111||x< -188||x> -38)return false;
      const gap=this.clearance(x,z);if(gap<.42&&gap<this.clearance(p.x,p.z))return true;
      return this.gates.some(g=>{
        const d=Math.abs(p.z-g.z);
        return g.warning&&Math.abs(x-g.x)<10.2&&d>2.1&&d<4.5&&Math.abs(z-g.z)<d-.000001;
      });
    }
    blocks(v,x,z,yaw){
      if(x< -194||x> -33||z< -153||z> -113)return false;
      if((Math.abs(x-this.x)>15||Math.abs(z-this.engine.z)>12)&&
        !this.gates.some(g=>g.angle>.15&&Math.abs(x-g.x)<12&&Math.abs(z-g.z)<12))return false;
      const q={x,z,yaw,kind:v.kind,footprint:v.footprint};
      const deeper=o=>{const h=BayDriving.contact(q,o);return h&&h.depth>(BayDriving.contact(v,o)?.depth||0)+.00001;};
      if(deeper(this.engine)||deeper(this.van))return true;
      for(const g of this.gates)if(g.angle>.50)for(const side of [-1,1]){
        const span=5.8*Math.sin(g.angle*Math.PI/2);
        const arm={x:g.x+side*(6.45-span*.5),z:g.z-5.05*side,yaw:Math.PI/2,footprint:{track:.18,halfLength:span*.5+.12}};
        if(deeper(arm))return true;
      }
      return false;
    }
    step(dt,input,occupied){
      this.clock+=dt;const r=this.trip,manual=r?.phase==="drive"&&this.aboard;
      if(this.transfer){
        this.transfer.f=clamp(this.transfer.f+dt/1.08,0,1);
        if(this.transfer.f>=1){const out=this.transfer.out;this.transfer=null;this.aboard=!out;
          if(out&&r?.phase==="drive"&&this.at===r.start)r.phase="board";
          if(!out&&r?.phase==="board"){r.phase="drive";this.destination=r.target;this.dir=Math.sign(r.target.x-this.x);}
          return out?"off":"on";
        }
      }
      const stoppedHere=this.at&&!manual,waitingOrder=r?.phase==="board"&&this.at===r.start;
      if(stoppedHere&&!this.transfer&&!waitingOrder)this.dwell=Math.max(0,this.dwell-dt);
      let target=manual?(input.gas?8.1:Math.max(0,this.speed-.20*dt)):7.4;
      if(manual&&input.brake)target=0;
      if(this.transfer||this.handling||stoppedHere&&(this.dwell>0||waitingOrder)||r?.phase==="unload")target=0;
      const gap=Math.abs(this.destination.x-this.x);
      if(!manual&&!stoppedHere)target=Math.min(target,Math.sqrt(2*1.68*gap));
      const front=this.dir>0?this.x+3.25:this.x-9.36,tail=this.dir>0?this.x-9.36:this.x+3.25;
      let limit=Infinity;this.held=false;
      for(const g of this.gates){
        const approach=(g.x-front)*this.dir,passed=(tail-g.x)*this.dir;
        const want=approach<19&&passed<5.2&&!(stoppedHere&&passed>2);
        g.warning=want||g.angle>.025;g.age=want?g.age+dt:0;
        g.angle=clamp(g.angle+(want&&g.age>1.25?.64:want?0:-.63)*dt,0,1);
        if(want&&approach>2&&approach<24){
          const busy=occupied(g.x,g.z,true);
          if(g.angle<.985||busy){limit=Math.min(limit,Math.max(0,approach-3.35));this.held=true;}
        }
      }
      if(target>.01||this.speed>.01){
        const nose=pose(front+this.dir*1.12);
        if(occupied(nose.x,nose.z,false)){limit=0;this.held=true;}
      }
      target=Math.min(target,Math.sqrt(2*2.9*limit));
      const change=target>this.speed?1.39:manual&&input.brake?3.65:this.held?3.35:1.94;
      this.speed+=clamp(target-this.speed,-change*dt,change*dt);
      const travel=Math.min(this.speed*dt,limit);
      if(limit<=travel+.0001)this.speed=0;
      const prev=this.x;this.x+=travel*this.dir;
      if(!manual&&!stoppedHere&&gap<=travel+.035){
        this.x=this.destination.x;this.speed=0;this.at=this.destination;this.handling={station:this.at,time:0};
        this.destination=this.at===west?east:west;this.dir=Math.sign(this.destination.x-this.x);this.dwell=14;
      }else if(this.x<west.x-1.65||this.x>east.x+1.65){
        this.x=clamp(this.x,west.x-1.65,east.x+1.65);if(manual&&this.speed>1.5)r.bumps++;this.speed=0;
      }
      if(this.at&&travel>0&&Math.abs(this.at.x-this.x)>.03&&r?.phase!=="unload")this.at=null;
      this.wheels+=(this.x-prev)/.34;this.stepStock();
      if(manual)r.seconds+=dt;
      if(this.handling){
        const h=this.handling;h.time+=dt;if(r?.phase==="unload")r.unload=h.time;
        if(h.time>=3.8){
          this.cargo=h.station.freight;this.marketIce=h.station===east;this.handling=null;
          if(r?.phase!=="unload")return;
          const score=clamp(Math.round(100-r.error*18-r.bumps*12),25,100);
          this.dwell=22;this.trip=null;this.destination=r.start;this.dir=Math.sign(r.start.x-this.x);
          return {score,pay:65+Math.round(score*.50),target:r.target.id};
        }
      }
    }
  }
  window.BayPortSpur={west,east,station,pose,track,crosses,saved,Line};
})();
