/* Surface water stays in the low gutter after the last drops come off the awnings. */
(() => {
  "use strict";
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const sites=[
    ["marlin","Marlin Motel",148.55,-13.7,0,4.8,2.05,151.0,-14.8],
    ["palm","Palm Diner",139.58,37.4,Math.PI,7.1,2.20,136.95,39.1],
    ["luna","Cine Luna",4.38,52.2,0,6.1,2.15,7.0,53.6],
    ["port","Port Sol",-139.57,-104.5,0,7.6,2.31,-136.92,-105.9],
    ["market","El Mercado",-48.7,-139.45,-Math.PI/2,5.5,2.08,-50.0,-137.0]
  ];
  const prefix="sundownBay.stormDrain.v1.";
  function lastCleared(id){
    try{const raw=localStorage.getItem(prefix+id),n=raw==null?-1:Number(raw);return Number.isFinite(n)&&n>=0?n:-1;}catch{return -1;}
  }
  function shore(q,seed){
    const edge=Math.sqrt(Math.max(0,1-q*q)),drift=.12*Math.sin(4*q+.6*seed)*edge;
    return {left:drift-edge*(.86+.10*Math.sin(q*9+.21*seed)+.04*Math.sin(q*21+seed)),
      right:drift+edge*(.86+.10*Math.sin(q*7+1.7*seed)+.04*Math.sin(q*19-.3*seed))};
  }
  const newLoad=()=>({front:0,rear:0,pull:0,left:0,right:0});
  class StreetWater{
    constructor(){
      this.pools=sites.map(([id,name,x,z,yaw,halfLength,halfWidth,gx,gz],i)=>({id,name,x,z,yaw,halfLength,halfWidth,grate:{x:gx,z:gz},
        sn:Math.sin(yaw),cs:Math.cos(yaw),seed:7+i*17,depth:0,work:0,cleared:false,opened:lastCleared(id)}));
      this.fans=[];this.lights=[];this.sequence=0;this.working=null;this.rain=0;this.wet=false;
    }
    weather(clock){
      this.rain=clock.rain;this.wet=false;
      for(const p of this.pools){
        const since=clock.total-p.opened;
        // Once cleared, an inlet stays open until the following morning's street sweep.
        p.cleared=p.opened>=0&&since>=0&&Math.floor((clock.total-300)/1440)===Math.floor((p.opened-300)/1440);
        const standing=clamp((clock.wet-.08)/.86);
        p.depth=standing*(p.cleared?.035+.965*Math.exp(-since*.29):1);
        const size=Math.sqrt(p.depth);
        p.length=p.halfLength*(.48+.52*size);p.width=p.halfWidth*(.31+.69*size);
        if(p.depth>.055)this.wet=true;
      }
    }
    refresh(key){
      const p=this.pools.find(v=>key===prefix+v.id);
      if(p)p.opened=lastCleared(p.id);
    }
    near(person){
      return this.pools.find(p=>Math.hypot(person.x-p.grate.x,person.z-p.grate.z)<1.88);
    }
    lift(pool,held,dt,clock){
      if(this.working&&(!held||this.working!==pool||pool.cleared)){
        this.working.work=0;this.working=null;
      }
      if(!pool||pool.cleared||!held)return false;
      this.working=pool;pool.work=clamp(pool.work+dt/2.2);
      if(pool.work<1)return false;
      pool.opened=clock.total;pool.cleared=true;pool.work=0;this.working=null;
      try{localStorage.setItem(prefix+pool.id,String(pool.opened));}catch{}
      return true;
    }
    at(p,x,z){
      const dx=x-p.x,dz=z-p.z,along=(dx*p.sn+dz*p.cs)/p.length,across=(dx*p.cs-dz*p.sn)/p.width;
      if(Math.abs(along)>=1||Math.abs(across)>1.15)return 0;
      const edge=shore(along,p.seed);
      return p.depth*clamp(Math.min(edge.right-across,across-edge.left,1-Math.abs(along))*4.7);
    }
    wheels(v){
      const out=v.waterLoad||(v.waterLoad=newLoad());
      out.front=out.rear=out.pull=out.left=out.right=0;
      if(!this.wet)return out;
      const p=this.pools.find(p=>Math.abs(v.x-p.x)<p.halfLength+3&&Math.abs(v.z-p.z)<p.halfLength+3);
      if(!p||p.depth<.055)return out;
      const shape=v.footprint||bayCarLayout(v.kind),sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
      for(const side of [-1,1]){
        const lateral=side*(shape.track-.085);
        let sideDepth=0,contactAxle=0;
        for(let i=0;i<2;i++){
          const axle=shape.axles[i],depth=this.at(p,v.x+sn*axle+cs*lateral,v.z+cs*axle-sn*lateral);
          if(i)out.front+=depth*.5;else out.rear+=depth*.5;
          if(depth>sideDepth||(depth===sideDepth&&v.speed<0)){sideDepth=depth;contactAxle=axle;}
        }
        if(side<0){out.left=sideDepth;out.leftAxle=contactAxle;}else{out.right=sideDepth;out.rightAxle=contactAxle;}
      }
      out.pull=out.right-out.left;return out;
    }
    tracks(v,now){
      if(!this.wet||Math.abs(v.speed)<2||now<(v.nextSpray||0))return;
      const load=this.wheels(v),speed=Math.abs(v.speed),shape=v.footprint||bayCarLayout(v.kind);
      if(Math.max(load.left,load.right)<.12)return;
      v.nextSpray=now+clamp(1.35/speed,.095,.36);
      for(const side of [-1,1]){
        const strength=(side<0?load.left:load.right)*clamp((speed-1.5)/12);
        if(strength<.055)continue;
        const q=BayDriving.world(v,side*shape.track,side<0?load.leftAxle:load.rightAxle);
        this.fans.push({...q,side,yaw:v.yaw,speed:v.speed,strength,age:0,life:.38+.40*strength,seed:++this.sequence,source:v});
      }
      if(this.fans.length>48)this.fans.splice(0,this.fans.length-48);
    }
    reflect(v,headlights){
      if(this.lights.length>=72)return;
      const pool=this.pools.find(p=>p.depth>.12&&Math.abs(v.x-p.x)<p.halfLength+7&&Math.abs(v.z-p.z)<p.halfLength+7);
      if(!pool)return;
      const shape=v.footprint||bayCarLayout(v.kind),braking=v.brakes>.33;
      for(const front of [-1,1]){
        if(front===1&&!headlights||front===-1&&!braking&&!v.reversing&&!headlights)continue;
        const tone=front===1?"lamp":v.reversing?"reverse":braking?"brake":"tail";
        for(const side of [-1,1])for(let i=0;i<4;i++){
          const offset=.24+i*.54,long=shape.halfLength+offset;
          const q=BayDriving.world(v,side*(shape.track-.13)+.07*Math.sin(i*2+v.x),front*long);
          const wet=this.at(pool,q.x,q.z);
          if(wet<.13)continue;
          this.lights.push({...q,yaw:v.yaw,tone,width:(.23+.11*i)*wet,length:.15+.043*i,fade:wet*(1-.17*i)});
        }
      }
    }
    advance(dt,people,car,notice){
      for(let i=this.fans.length-1;i>=0;i--){
        const fan=this.fans[i];fan.age+=dt;
        if(fan.age>=fan.life){this.fans.splice(i,1);continue;}
        if(fan.strength<.27)continue;
        const u=fan.age/fan.life,side=fan.side*(.12+(1-Math.pow(1-u,2))*(.9+3.6*fan.strength));
        const pos=BayDriving.world(fan,side,-Math.sign(fan.speed)*u*(.5+Math.abs(fan.speed)*.10));
        if(car&&car!==fan.source&&Math.abs(car.x-pos.x)<4&&Math.abs(car.z-pos.z)<4&&BayDriving.clearance(car,pos)<.62)
          car.glassSplash=Math.max(car.glassSplash||0,fan.strength);
        for(const p of people){
          if(p.onTour||p.palmPassenger||p.sprayWait>0||Math.abs(p.x-pos.x)>1||Math.abs(p.z-pos.z)>1||Math.hypot(p.x-pos.x,p.z-pos.z)>.9)continue;
          p.sprayWait=4;p.sprayAge=0;p.sprayFace=Math.atan2(fan.x-p.x,fan.z-p.z);
          if(fan.source===car)notice(p);
        }
      }
    }
    report(){
      const p=this.pools.find(p=>p.depth>.52);
      return p?"Standing water by "+p.name+". The inside lane is drier.":"";
    }
  }
  window.BayGutters={StreetWater,shore};
})();
