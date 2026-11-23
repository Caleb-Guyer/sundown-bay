/* The marine unit shares the city dispatch channel and steers the same outboards as the player. */
(() => {
  "use strict";
  const bay=BayMarina,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const distance=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
  const shoals=[{...bay.beacon,r:9.3},...bay.sails.filter(s=>Math.abs(s[1])<186).map(([x,z,size])=>({x,z,r:3*size+2.3}))];
  const sightCover=[
    {x:bay.beacon.x,z:bay.beacon.z,w:6.8,d:6.2,bottom:0,top:1.55},
    {x:bay.beacon.x,z:bay.beacon.z,w:2.5,d:2.5,bottom:1.4,top:10.9}
  ];
  // A launch can pass the head of a pier, but cannot cross the gangway or the shoreward side.
  const piers=bay.docks.map(d=>({end:d.x+d.headW/2+2.5,z:d.z,half:d.headD/2+2.5}));
  function waterPoint(x,z){
    x=clamp(x,220,426);z=clamp(z,-180,180);
    for(const p of piers)if(x<p.end+1&&Math.abs(z-p.z)<p.half+1)x=p.end+1;
    for(const o of shoals){
      const dx=x-o.x,dz=z-o.z,d=Math.hypot(dx,dz);
      if(d<o.r+1){x=o.x+(d?dx/d:1)*(o.r+1);z=o.z+(d?dz/d:0)*(o.r+1);}
    }
    return {x,z};
  }
  function openWater(a,b){
    const dx=b.x-a.x,dz=b.z-a.z,length2=dx*dx+dz*dz;
    if(length2<.01)return true;
    for(const p of piers){
      let from=0,to=1;
      if(Math.abs(dz)<.001){if(Math.abs(a.z-p.z)>=p.half)continue;}
      else{
        const first=(p.z-p.half-a.z)/dz,last=(p.z+p.half-a.z)/dz;
        from=Math.max(0,Math.min(first,last));to=Math.min(1,Math.max(first,last));
        if(from>to)continue;
      }
      if(Math.min(a.x+dx*from,a.x+dx*to)<p.end)return false;
    }
    for(const o of shoals){
      const t=clamp(((o.x-a.x)*dx+(o.z-a.z)*dz)/length2,0,1);
      if(t>0&&(a.x+t*dx-o.x)**2+(a.z+t*dz-o.z)**2<o.r*o.r)return false;
    }
    return true;
  }
  // Only the few fixed hazards need waypoints. Most open-water headings are a direct line.
  const marks=[];
  for(const o of shoals)for(let i=0;i<6;i++){
    const angle=i*Math.PI/3;
    marks.push(waterPoint(o.x+Math.cos(angle)*(o.r+7),o.z+Math.sin(angle)*(o.r+7)));
  }
  for(const p of piers)for(const side of [-1,1])marks.push({x:p.end+6,z:p.z+side*(p.half+6)});
  let links;
  function nextMark(start,goal){
    for(const p of piers)if(start.x<p.end&&Math.abs(start.z-p.z)<p.half){
      if(start.x>p.end-2.5)return {x:p.end+6,z:start.z};
      const side=start.z<p.z?-1:1;
      return {x:start.x,z:p.z+side*(p.half+6)};
    }
    if(openWater(start,goal))return goal;
    if(!links)links=marks.map((a,i)=>marks.flatMap((b,j)=>i!==j&&openWater(a,b)?[{j,cost:distance(a,b)}]:[]));
    const cost=marks.map(m=>openWater(start,m)?distance(start,m):Infinity);
    const first=marks.map((_,i)=>i),used=new Set();
    while(used.size<marks.length){
      let best=-1,rank=Infinity;
      for(let i=0;i<marks.length;i++){
        const score=cost[i]+distance(marks[i],goal);
        if(!used.has(i)&&score<rank){rank=score;best=i;}
      }
      if(best<0)break;
      if(openWater(marks[best],goal))return marks[first[best]];
      used.add(best);
      for(const edge of links[best])if(cost[best]+edge.cost<cost[edge.j]){
        cost[edge.j]=cost[best]+edge.cost;first[edge.j]=first[best];
      }
    }
    return waterPoint(start.x+7,start.z);
  }
  // Use the length of both hulls so a launch can ride alongside or touch a stern without crossing it.
  function separateHulls(a,b){
    if(distance(a,b)>6.5)return;
    const ax=Math.sin(a.yaw),az=Math.cos(a.yaw),bx=Math.sin(b.yaw),bz=Math.cos(b.yaw);
    const reach=1.98,width=2.15;
    let gap=width,nx=0,nz=0;
    const closest=(dx,dz)=>{
      const d=Math.hypot(dx,dz);
      if(d>=gap)return;
      gap=d;
      if(d>.0001){nx=dx/d;nz=dz/d;}
      else{const side=(a.x-b.x)*bz-(a.z-b.z)*bx<0?-1:1;nx=side*bz;nz=-side*bx;}
    };
    for(const end of [-reach,reach]){
      const dx=a.x+end*ax-b.x,dz=a.z+end*az-b.z;
      const alongB=clamp(dx*bx+dz*bz,-reach,reach);
      closest(dx-bx*alongB,dz-bz*alongB);
      const ex=b.x+end*bx-a.x,ez=b.z+end*bz-a.z;
      const alongA=clamp(ex*ax+ez*az,-reach,reach);
      closest(ax*alongA-ex,az*alongA-ez);
    }
    if(gap>=width)return;
    const x=a.x+nx*(width-gap),z=a.z+nz*(width-gap);
    if(bay.fits(x,z,a.yaw)){a.x=x;a.z=z;}
    const closing=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;
    if(closing<0){
      a.vx-=closing*nx;a.vz-=closing*nz;a.speed=a.vx*ax+a.vz*az;
      if(closing< -2.8)a.lift=Math.max(a.lift,Math.min(.18,-closing*.013));
    }
  }
  class HarborPatrol {
    constructor(chase){this.chase=chase;this.reset();}
    reset(){
      this.units=[];this.dock=null;this.nextLaunch=0;this.scanIn=0;this.sighted=false;
      this.closest=Infinity;this.inContact=Infinity;
    }
    dispatch(origin,p,fleet){
      const slot=this.units.length,side=origin.z>0?-1:1;
      const offsets=slot?[[54,-31],[46,44],[-15,-54]]:[[22,45],[31,-39],[-18,45]];
      for(const [dx,dz] of offsets){
        const at=waterPoint(origin.x+dx,origin.z+dz*side),yaw=Math.atan2(origin.x-at.x,origin.z-at.z);
        if(distance(at,p)<32||!bay.fits(at.x,at.z,yaw)||fleet.some(v=>distance(at,v)<9)||this.units.some(v=>distance(at,v)<14))continue;
        const v=bay.vessel("patrol");
        Object.assign(v,at,{yaw,slot,speed:8,vx:8*Math.sin(yaw),vz:8*Math.cos(yaw),planIn:0,sees:false,spotTime:0});
        this.units.push(v);return true;
      }
      return false;
    }
    canSee(v,p,heat,waterside){
      const d=distance(v,p),search=this.chase.searching;
      if((!waterside&&p.x<196)||d>(search?51+heat*3:78+heat*3))return false;
      const ahead=(p.x-v.x)*Math.sin(v.yaw)+(p.z-v.z)*Math.cos(v.yaw);
      if(d>17&&ahead<d*(search?.45:-.38))return false;
      return BayCamera.safeFraction({x:v.x,y:2.0,z:v.z},{x:p.x,y:1.22,z:p.z},this.chase.cover)>=1;
    }
    destination(v,k,t){
      const pace=Math.hypot(k.vx,k.vz),side=v.slot?1:-1;
      if(!k.afloat){
        return waterPoint(this.dock.x+15+v.slot*5,this.dock.z+side*(this.dock.headD*.5+6));
      }
      if(this.chase.searching){
        const phase=t*.24+side*1.55;
        return waterPoint(k.x+k.vx*.55+Math.cos(phase)*21,k.z+k.vz*.55+Math.sin(phase)*27);
      }
      const dx=pace>2?k.vx/pace:Math.sin(k.yaw),dz=pace>2?k.vz/pace:Math.cos(k.yaw);
      const lead=v.slot?clamp(distance(v,k)*.023,.4,1.5):.22,beam=side*(v.slot?5.2:3.7);
      return waterPoint(k.x+k.vx*lead+dz*beam,k.z+k.vz*lead-dx*beam);
    }
    update(heat,dt,t,p,boat,dock,fleet){
      const waterside=!!(boat||dock),chase=this.chase;
      if(!this.units.length&&!waterside)return;
      if(dock&&(!this.dock||!chase.searching))this.dock=dock;
      if(!this.dock)this.dock=bay.docks.reduce((a,b)=>distance(a,p)<distance(b,p)?a:b);
      this.nextLaunch=Math.max(0,this.nextLaunch-dt);
      const required=heat>=3?2:1;
      if(waterside&&this.units.length<required&&!this.nextLaunch&&(!this.units.length||!chase.searching)){
        const origin=boat&&!dock?(this.units.length?chase.lastSeen:p):this.dock;
        this.nextLaunch=this.dispatch(origin,p,fleet)?3.2:.65;
      }
      this.scanIn-=dt;
      const scan=this.scanIn<=0;if(scan)this.scanIn+=.12;
      this.closest=this.inContact=Infinity;this.sighted=false;
      for(const v of this.units){
        if(scan){
          v.spotTime=this.canSee(v,p,heat,waterside)?v.spotTime+.12:0;
          v.sees=v.spotTime>0&&(!chase.searching||v.spotTime>=.24||distance(v,p)<15);
        }
        if(v.sees)this.sighted=true;
        const k=chase.lastSeen;
        v.planIn-=dt;
        if(v.planIn<=0||!v.aim||distance(v,v.aim)<2){
          v.goal=this.destination(v,k,t);v.aim=nextMark(v,v.goal);v.planIn=.35;
        }
        const pace=k.afloat&&!chase.searching?Math.hypot(k.vx,k.vz):0;
        const closing=Math.sqrt(10*Math.max(0,distance(v,v.goal)-2.8));
        const limit=chase.searching?11.5:18.4+heat*1.8;
        const bearing=Math.atan2(v.aim.x-v.x,v.aim.z-v.z)-v.yaw;
        const bend=Math.abs(Math.atan2(Math.sin(bearing),Math.cos(bearing)));
        const speed=Math.min(limit,pace+closing,Math.max(7.5,15/(bend+.2)));
        const oldX=v.x,oldZ=v.z;
        if(v.backing>0){
          bay.helm(v,dt,false,true,0,false,t);v.backing-=dt;
        }else{
          bay.follow(v,v.aim,speed,dt,t);
          const blocked=speed>5&&Math.hypot(v.x-oldX,v.z-oldZ)<dt*.45;
          v.stuck=blocked?(v.stuck||0)+dt:0;
          if(v.stuck>.85){v.backing=1.35;v.stuck=0;v.planIn=0;}
        }
        for(const other of fleet){
          separateHulls(v,other);
          if(other===boat){bay.disturb(boat,v,t);bay.disturb(v,boat,t);separateHulls(boat,v);}
        }
        if(v.slot)separateHulls(v,this.units[0]);
        const gap=distance(v,p);
        this.closest=Math.min(this.closest,gap);
        if(v.sees)this.inContact=Math.min(this.inContact,gap);
      }
    }
  }
  HarborPatrol.sightCover=sightCover;
  window.BayHarborPatrol=HarborPatrol;
})();
