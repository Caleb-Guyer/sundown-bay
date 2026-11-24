/* Public landings, outboard handling, and the club's marked-water courses. */
(() => {
  "use strict";
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const lerp=(a,b,t)=>a+(b-a)*t, ease=(a,b,k,dt)=>lerp(a,b,-Math.expm1(-k*dt));
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const start={x:260,z:-135},beacon={kind:"beacon",name:"Gull Light",x:354,z:26};
  const coast=z=>213+Math.sin(z/26*.82)*1.65+Math.cos(z/26*1.91)*.8;
  const docks=[
    {kind:"landing",id:"south",name:"Marlin Pier",x:241,z:-119,headW:7.5,headD:13,footX:184.5,walkW:4.5,level:.37},
    {kind:"landing",id:"north",name:"North Float",x:234,z:92,headW:7,headD:10,footX:200,walkW:3,level:.46},
    BayCut.dock
  ];
  const hulls={
    manta:{name:"Manta 90",detail:"North Float personal watercraft",top:29,power:11.8,turn:1.91,grip:5.5},
    pip:{name:"Pip 16",detail:"Flat-bottom work skiff",top:17.4,power:5.95,turn:1.43,grip:4.2},
    needle:{name:"Needle 19",detail:"Light hull · tight turns",top:25,power:8.8,turn:1.31,grip:3.7},
    mako:{name:"Mako 22",detail:"Deep V · higher top speed",top:30,power:7.8,turn:1.03,grip:3.0},
    rival:{name:"Yellowtail",top:27,power:8.1,turn:1.19,grip:3.5},
    patrol:{name:"Harbor Patrol",top:28,power:8.1,turn:1.22,grip:3.35}
  };
  const sails=[[239,28,1.3,.7],[272,-59,1.5,1.1],[252,147,1.4,-.52],[288,212,1.8,.4]];
  const perimeter=[];for(let z=-180;z<=180;z+=60)perimeter.push({x:429,z});
  for(let x=236;x<429;x+=48){perimeter.push({x,z:-183});if(x>325)perimeter.push({x,z:183});}
  for(const z of [210,258,306,350])perimeter.push({x:336,z});
  for(const x of [238,285])perimeter.push({x,z:356});
  function deck(d,x,z,r=0){
    return Math.abs(x-d.x)<=d.headW/2-r&&Math.abs(z-d.z)<=d.headD/2-r||
      x>=d.footX+r&&x<=d.x&&Math.abs(z-d.z)<=d.walkW/2-r;
  }
  function landing(x,z,r=0){return docks.find(d=>deck(d,x,z,r))||(z>280&&BayDrawbridge.landingLevel(x,z,r)!=null?BayDrawbridge.iceDock:undefined)||BayGullKey.siteAt(x,z,r);}
  function berth(d,side){
    if(d===docks[1]&&side===0)return {x:d.x+d.headW/2+2.75,z:d.z,yaw:Math.PI/2};
    if(d.guest&&side<0)return {...d.guest};
    if(d.skiff)return {...d.skiff};
    if(d===BayDrawbridge.iceDock)return {...BayDrawbridge.iceBerth,yaw:BayDrawbridge.heading+side*Math.PI/2};
    return {x:d.x+.7,z:d.z+side*(d.headD/2+1.65),yaw:Math.PI/2};
  }
  function moor(v,d,side){Object.assign(v,berth(d,side),{dock:d,side,speed:0,vx:0,vz:0,steer:0,yawRate:0,trim:0,lean:0,pitch:0,lift:0,throttle:0});v.wake.length=0;}
  function vessel(kind){return {kind,x:start.x,z:start.z,yaw:Math.PI/2,speed:0,vx:0,vz:0,steer:0,yawRate:0,lean:0,pitch:0,y:.13,trim:0,throttle:0,lift:0,splashAt:-10,wakeAt:-10,wake:[],dock:null};}
  function pose(v,t,dt){
    const a=t*1.57+v.z*.065+v.x*.034,b=t*.94-v.x*.097+v.z*.041,pace=Math.min(1,Math.abs(v.speed)/26);
    v.lift*=Math.exp(-3.6*dt);
    v.y=.12+.065*Math.sin(a)+.035*Math.sin(b)+.12*pace+v.lift;
    v.pitch=ease(v.pitch,.016*Math.cos(a)+.012*Math.cos(b)-.055*pace-.047*v.trim-v.lift*.12,8,dt);
    v.lean=ease(v.lean,-v.yawRate*pace*.26+.017*Math.sin(b),5,dt);
  }
  let gateOpen=()=>false;
  function navigable(x,z){
    if(BayGullKey.waterBlocked(x,z,.72))return false;
    const north=z>180,edge=north?BayCut.coast(z):coast(z);
    if(north&&BayDrawbridge.scow(x,z,.7))return false;
    if(north&&x<edge+3&&BayDrawbridge.channel(x,z))return gateOpen(x,z)&&BayDrawbridge.landingLevel(x,z,-.55)==null;
    const outer=north?431-95*Math.min(1,Math.max(0,(z-186)/24)):431;
    if(x<edge+2||x>outer||z< -186||z>360||Math.hypot(x-beacon.x,z-beacon.z)<6.7)return false;
    if(docks.some(d=>deck(d,x,z,-.75)))return false;
    return !sails.some(([bx,bz,s,yaw])=>{
      const dx=x-bx,dz=z-bz,across=dx*Math.cos(yaw)-dz*Math.sin(yaw),along=dx*Math.sin(yaw)+dz*Math.cos(yaw);
      return (across/(1.02*s+.75))**2+(along/(2.65*s+.75))**2<1;
    });
  }
  function fits(x,z,yaw){
    const dx=Math.sin(yaw)*1.63,dz=Math.cos(yaw)*1.63;
    return navigable(x,z)&&navigable(x+dx,z+dz)&&navigable(x-dx,z-dz);
  }
  function helm(v,dt,gas,back,steer,trim,t){
    const spec=hulls[v.kind],cs=Math.cos(v.yaw),sn=Math.sin(v.yaw);
    let f=v.vx*sn+v.vz*cs,side=v.vx*cs-v.vz*sn;
    const pace=clamp(Math.abs(f)/spec.top,0,1),oldSpeed=f;
    v.throttle=ease(v.throttle,gas?1:0,4.7,dt);
    v.trim=ease(v.trim,trim&&gas&&f>7?1:0,3.4,dt);
    const cargo=v.kind==="pip"?1-.0038*(v.catchCount||0):1;
    const top=spec.top*cargo*(1+.13*v.trim),drag=.22+.0013*f*f;
    if(back)f=Math.max(-4.6,f-(f>0?10.4:3.2)*dt);
    else{
      f+=v.throttle*spec.power*cargo*clamp((top-f)/5.5,0,1)*dt;
      f=Math.sign(f)*Math.max(0,Math.abs(f)-(drag+(gas?0:.66))*dt);
    }
    v.steer=ease(v.steer,steer,5.6,dt);
    const bite=clamp(Math.abs(f)/3.8,0,1),turn=v.steer*spec.turn*bite*(1-.34*pace)*(1-.28*v.trim);
    v.yawRate=ease(v.yawRate,turn*(f<0?-1:1),4.7,dt);
    const yaw=v.yaw+v.yawRate*dt;
    side=ease(side,0,spec.grip*(1-.55*v.trim),dt);
    v.vx=sn*f+cs*side;v.vz=cs*f-sn*side;
    if(fits(v.x,v.z,yaw))v.yaw=yaw;
    if(fits(v.x+v.vx*dt,v.z,v.yaw))v.x+=v.vx*dt;else v.vx=0;
    if(fits(v.x,v.z+v.vz*dt,v.yaw))v.z+=v.vz*dt;else v.vz=0;
    v.speed=v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw);
    if(Math.abs(oldSpeed)-Math.abs(v.speed)>6)v.lift=.14;
    pose(v,t,dt);
    while(v.wake.length&&t-v.wake[0].at>3.25)v.wake.shift();
    if(Math.abs(v.speed)>3&&t-v.wakeAt>.115){
      v.wake.push({x:v.x-Math.sin(v.yaw)*2.6,z:v.z-Math.cos(v.yaw)*2.6,yaw:v.yaw,at:t,pace});v.wakeAt=t;
    }
  }
  function disturb(v,other,t){
    if(!other||Math.abs(v.speed)<6||t-v.splashAt<.8)return;
    for(let i=other.wake.length-1;i>=0;i-=2){
      const w=other.wake[i],age=t-w.at;if(age<.2||age>2.6||dist(v,w)>8)continue;
      const dx=v.x-w.x,dz=v.z-w.z,s=Math.sin(w.yaw),c=Math.cos(w.yaw);
      if(Math.abs(dx*s+dz*c)<1.4&&Math.abs(Math.abs(dx*c-dz*s)-(.75+age*1.5))<.85){
        v.lift=.12+.13*w.pace;v.splashAt=t;return;
      }
    }
  }
  function separate(a,b){
    if(!a||!b)return;const dx=a.x-b.x,dz=a.z-b.z,d=Math.hypot(dx,dz);
    if(d>=2.35||d<.001)return;
    const nx=dx/d,nz=dz/d,gap=2.36-d;
    if(fits(a.x+nx*gap,a.z+nz*gap,a.yaw)){a.x+=nx*gap;a.z+=nz*gap;}
    const inward=a.vx*nx+a.vz*nz;if(inward<0){a.vx-=inward*nx;a.vz-=inward*nz;}
    a.speed=a.vx*Math.sin(a.yaw)+a.vz*Math.cos(a.yaw);
  }
  function course(id,name,detail,purse,pace,width,coords){
    const points=[start,...coords.map(([x,z])=>({x,z}))];
    const gates=points.slice(1).map((p,i)=>{
      const prev=points[i],next=points[i+2]||p,first=dist(prev,p),last=dist(p,next)||1;
      const dx=(p.x-prev.x)/first+(next.x-p.x)/last,dz=(p.z-prev.z)/first+(next.z-p.z)/last,n=Math.hypot(dx,dz);
      const nx=dx/n,nz=dz/n,half=width/2;
      return {...p,nx,nz,half,name:i===coords.length-1?"Finish line":"Gate "+(i+1),
        red:{x:p.x-nz*half,z:p.z+nx*half},green:{x:p.x+nz*half,z:p.z-nx*half}};
    });
    return {id,name,detail,purse,pace,gates,length:Math.round(points.slice(1).reduce((n,p,i)=>n+dist(p,points[i]),0))};
  }
  const courses=[
    course("jetty","Jetty Sprint","A fast run from the fishing pier to North Float.",220,14.5,27,[[304,-124],[338,-81],[316,-34],[271,-9],[248,51],[249,94]]),
    course("lantern","Lantern Loop","Round Gull Light and cut back across your own wake.",310,17.0,25,[[304,-124],[353,-91],[377,-30],[370,32],[328,49],[297,12],[285,-43],[252,-94]]),
    course("outer","Outer Sound","Long offshore straights and a hard turn home.",400,19.1,28,[[305,-127],[380,-130],[409,-52],[390,48],[381,136],[310,155],[280,99],[303,48],[275,-25],[251,-90]])
  ];
  function crossing(g,a,b){
    const from=(a.x-g.x)*g.nx+(a.z-g.z)*g.nz,to=(b.x-g.x)*g.nx+(b.z-g.z)*g.nz;
    if(from>0||to<=0)return null;
    const f=-from/(to-from),x=lerp(a.x,b.x,f)-g.x,z=lerp(a.z,b.z,f)-g.z;
    return Math.abs(x*g.nz-z*g.nx)<=g.half?f:null;
  }
  function grid(v,c,side){
    const g=c.gates[0],yaw=Math.atan2(g.x-start.x,g.z-start.z);
    Object.assign(v,{x:start.x+side*Math.cos(yaw)*3.5,z:start.z-side*Math.sin(yaw)*3.5,yaw,dock:null,
      speed:0,vx:0,vz:0,yawRate:0,steer:0,trim:0,throttle:0,lift:0});v.wake.length=0;v.wakeAt=-10;
  }
  function follow(v,goal,pace,dt,t){
    const error=wrap(Math.atan2(goal.x-v.x,goal.z-v.z)-v.yaw);
    const want=pace*(1-.59*clamp(Math.abs(error)/1.60,0,1));
    helm(v,dt,v.speed<want-.2,v.speed>want+1.3,clamp(error*2.3-v.yawRate*.46,-1,1),false,t);
  }
  class Race{
    constructor(c,player,rival){
      this.course=c;this.player=player;this.rival=rival;this.count=3;this.time=0;
      this.index=0;this.opponentIndex=0;this.rivalTime=null;this.playerTime=null;this.returning=false;
      this.bobs=new Map();this.lastBrush=-10;
      grid(player,c,-1);grid(rival,c,1);
    }
    target(){return this.course.gates[this.index]||this.course.gates.at(-1);}
    brush(v,g,t){
      if(!g||dist(v,g)>g.half+5)return;
      const s=Math.sin(v.yaw),c=Math.cos(v.yaw);
      for(const buoy of [g.red,g.green]){
        const dx=buoy.x-v.x,dz=buoy.z-v.z,lateral=dx*c-dz*s;
        if(Math.abs(lateral)>1.48||Math.abs(dx*s+dz*c)>2.5||t-(this.bobs.get(buoy)??-10)<1.1)continue;
        this.bobs.set(buoy,t);v.vx*=.77;v.vz*=.77;v.speed*=.77;v.yawRate-=Math.sign(lateral)*.22;
        if(v===this.player)this.lastBrush=this.time;
      }
    }
    step(dt,t,input){
      const p=this.player,r=this.rival,c=this.course;
      if(this.playerTime!==null)return;
      if(this.count>0){this.count=Math.max(0,this.count-dt);pose(p,t,dt);pose(r,t,dt);return;}
      const oldP={x:p.x,z:p.z},oldR={x:r.x,z:r.z},g=this.target(),opp=c.gates[this.opponentIndex];
      helm(p,dt,input.gas,input.back,input.steer,input.trim,t);
      if(opp){
        const signed=(r.x-opp.x)*opp.nx+(r.z-opp.z)*opp.nz;
        if(signed>1)this.returning=true;
        if(this.returning&&signed< -7)this.returning=false;
        const lead=this.returning?-16:4;
        follow(r,{x:opp.x+lead*opp.nx,z:opp.z+lead*opp.nz},c.pace,dt,t);
      }else helm(r,dt,false,r.speed>1.5,0,false,t);
      disturb(p,r,t);disturb(r,p,t);separate(p,r);this.brush(p,g,t);this.brush(r,opp,t);
      const rp=opp?crossing(opp,oldR,r):null,pp=crossing(g,oldP,p);
      if(rp!==null){this.opponentIndex++;this.returning=false;if(this.opponentIndex===c.gates.length)this.rivalTime=this.time+rp*dt;}
      if(pp!==null){this.index++;if(this.index===c.gates.length)this.playerTime=this.time+pp*dt;}
      this.time+=dt;
      if(this.playerTime!==null)return "finish";
      if(pp!==null)return "gate";
    }
    leading(){
      if(this.index!==this.opponentIndex)return this.index>this.opponentIndex;
      return dist(this.player,this.target())<=dist(this.rival,this.target());
    }
  }
  function clearWorkingHull(v,h){
    const dx=v.x-h.x,dz=v.z-h.z,c=Math.cos(h.yaw),s=Math.sin(h.yaw);
    const across=dx*c-dz*s,along=dx*s+dz*c,relative=v.yaw-h.yaw;
    const side=h.halfWidth+.86+1.65*Math.abs(Math.sin(relative))-Math.abs(across);
    const end=h.halfLength+.86+1.65*Math.abs(Math.cos(relative))-Math.abs(along);
    if(side<=0||end<=0)return false;
    const edge=side<end,sign=(edge?across:along)<0?-1:1,nx=(edge?c:s)*sign,nz=(edge?-s:c)*sign;
    const push=Math.min(side,end)+.02;
    v.x+=nx*push;v.z+=nz*push;
    const inward=Math.min(0,v.vx*nx+v.vz*nz);v.vx-=1.07*inward*nx;v.vz-=1.07*inward*nz;
    v.speed=v.vx*Math.sin(v.yaw)+v.vz*Math.cos(v.yaw);return true;
  }
  function readRecords(raw){
    const result={};for(const c of courses)for(const id of ["needle","mako"]){
      const key=c.id+"/"+id,value=raw?.[key];
      if(Number.isFinite(value)&&value>0&&value<86400)result[key]=value;
    }return result;
  }
  window.BayMarina={docks,beacon,hulls,courses,perimeter,sails,start,deck,landing,berth,moor,vessel,pose,helm,disturb,separate,clearWorkingHull,navigable,fits,follow,crossing,Race,readRecords,setChannelGate(fn){gateOpen=fn;}};
})();
