/* The same shoreline and bottom support walking, sailing and diving. All depths are in metres. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),ease=(a,b,k,dt)=>a+(b-a)*-Math.expm1(-k*dt);
  const sites=[
    {id:"keys",name:"Blue motel keys",place:"Bicycle reef",x:231,z:-33,owner:"Ink",pay:65,
      clue:"Across from the tower. My blue key tag slipped off the handlebars of the bicycle in the eelgrass."},
    {id:"token",name:"Paloma ferry token",place:"North Float dinghy",x:251,z:98,owner:"Des",pay:85,
      clue:"Off the end of North Float. Look for the old dinghy and its crab pots."},
    {id:"lure",name:"Red cedar lure",place:"Pelican oyster beds",x:260,z:317,owner:"Lark",pay:100,
      clue:"Just east of Pelican Cut Landing. Search the crooked oyster racks."}
  ];
  const coast=z=>z>180?BayCut.coast(z):213+1.65*Math.sin(z/26*.82)+.8*Math.cos(z/26*1.91);
  function floor(x,z){
    const shore=x-coast(z),d=Math.max(0,shore+1.3);
    const texture=Math.min(1,d/13)*(.19*Math.sin(z*.094+x*.075)+.12*Math.cos(z*.133-x*.14));
    return -.035-Math.max(0,Math.min(d,20)*.205+10.6*(1-Math.exp(-Math.max(0,d-20)/45))+texture);
  }
  const beach=z=>z>=-181.5&&z<=181.5||z>=311&&z<=332;
  function water(x,z){
    if(z< -187||z>361)return false;
    const width=432-95*clamp((z-186)/24,0,1);
    return x>=coast(z)+(beach(z)?-.95:1.65)&&x<=width;
  }
  function wetSand(x,z){return beach(z)&&x>=(z>180?BayCut.coast(z)-7:206)&&x<=coast(z)+3.15;}
  const wave=(x,z,t)=>.055+.045*Math.sin(t*1.81+z*.14+x*.08)+.023*Math.sin(t*2.61+x*.17-z*.09);
  const ladders=BayMarina.docks.map(d=>({id:d.id,dock:d,x:d.x+d.headW*.5,z:d.z,y:d.level}));
  const surfaceY=(p,t)=>wave(p.x,p.z,t);
  function insideHull(v,x,z,depth,halfWidth=1.13,halfLength=2.87){
    if(depth>1.35||Math.abs(v.x-x)>halfLength+1||Math.abs(v.z-z)>halfLength+1)return false;
    const dx=x-v.x,dz=z-v.z,c=Math.cos(v.yaw),s=Math.sin(v.yaw);
    return ((dx*c-dz*s)/halfWidth)**2+((dx*s+dz*c)/halfLength)**2<1;
  }
  function nearestOpening(p,depth,clear){
    for(const r of [.8,1.7,3,4.6,6.5,9.5])for(let i=0;i<12;i++){
      const a=i*Math.PI/6,x=p.x+r*Math.cos(a),z=p.z+r*Math.sin(a);
      if(clear(x,z,depth))return {x,z};
    }
    return null;
  }
  class Swim {
    constructor(p,fromHeight=0){
      this.depth=0;this.air=1;this.forced=false;this.underwater=false;this.phase=0;this.pace=0;
      this.vx=0;this.vz=0;this.vy=0;this.exit=null;this.entry=Math.min(.52,Math.max(0,fromHeight)*.33);this.initial=this.entry;
      this.diveReady=true;this.covered=false;this.opening=null;
    }
    step(dt,p,t,control,clear){
      let dx=control.x,dz=control.z;
      const tow=control.towing;
      const limit=clamp(-floor(p.x,p.z)-.40,0,18);
      if(this.air<=.01){this.forced=true;this.diveReady=false;}
      if(!control.dive){this.diveReady=true;}
      if(this.forced&&this.depth<.10&&this.air>.39)this.forced=false;
      const diving=control.dive&&this.diveReady&&!this.forced&&!tow&&this.entry===0;
      const target=diving&&limit>.76?limit:0;
      const rate=target>this.depth?2.15:this.forced?2.85:1.68;
      this.vy=ease(this.vy,clamp((this.depth-target)*4,-rate,rate),5,dt);
      const next=clamp(this.depth-this.vy*dt,0,limit);
      this.covered=next<this.depth&&!clear(p.x,p.z,next);
      if(this.covered)this.vy=0;else this.depth=next;
      if(!this.underwater&&this.depth>.73)this.underwater=true;
      else if(this.underwater&&this.depth<.40)this.underwater=false;
      // A passing launch can displace a surface swimmer. Beneath a pier, a low-air ascent follows the edge into clear water.
      const displaced=!clear(p.x,p.z,this.depth);
      if(displaced||this.forced&&this.covered){
        const clearance=this.covered?0:this.depth;
        if(!this.opening||!clear(this.opening.x,this.opening.z,clearance))this.opening=nearestOpening(p,clearance,clear);
        if(this.opening){dx=this.opening.x-p.x;dz=this.opening.z-p.z;}
      }else this.opening=null;
      const magnitude=Math.hypot(dx,dz),useAir=control.fast&&magnitude ? .071 : .052;
      this.air=clamp(this.air+dt*(this.depth>.38?-useAir:.23),0,1);
      const speed=tow?(control.fast?3.20:2.27):this.underwater?(control.fast?4.00:2.78):(control.fast?4.55:2.95);
      const amount=magnitude?1/Math.max(1,magnitude):0;
      const swell=this.underwater?.035:.10;
      const vx=dx*amount*speed+Math.sin(t*.21+p.z*.08)*swell, vz=dz*amount*speed+Math.sin(t*.17+p.x*.1)*swell;
      this.vx=ease(this.vx,vx,4.8,dt);this.vz=ease(this.vz,vz,4.8,dt);
      const nx=p.x+this.vx*dt,nz=p.z+this.vz*dt;
      if(displaced&&this.opening||clear(nx,p.z,this.depth))p.x=nx;else this.vx*=.24;
      if(displaced&&this.opening||clear(p.x,nz,this.depth))p.z=nz;else this.vz*=.24;
      if(magnitude>.05){
        const wanted=Math.atan2(dx,dz),turn=Math.atan2(Math.sin(wanted-p.yaw),Math.cos(wanted-p.yaw));
        p.yaw+=turn*-Math.expm1(-8*dt);
      }
      this.pace=ease(this.pace,magnitude?Math.min(1,Math.hypot(this.vx,this.vz)/4.4):0,4.5,dt);
      this.phase+=dt*(this.underwater?2.8+3.5*this.pace:2.3+4.0*this.pace);
      this.entry=Math.max(0,this.entry-dt);
      const splash=this.initial>0&&this.entry>0?.37*Math.sin(Math.PI*this.entry/this.initial):0;
      p.y=surfaceY(p,t)*(1-clamp(this.depth/.68,0,1))-this.depth+splash;
      return !diving&&this.depth<.52&&beach(p.z)&&p.x<coast(p.z)+1.15&&!BayMarina.landing(p.x,p.z);
    }
    actor(p){
      const climbing=!!this.exit;
      return {x:p.x,z:p.z,y:p.y,yaw:p.yaw,style:"player",pose:climbing?"climb":this.depth>.38?"dive":this.pace>.12?"stroke":"tread",
        phase:this.phase,pace:this.pace,depth:this.depth,vy:this.vy,climb:this.exit?.type==="launch"?1-this.exit.f:this.exit?.f||0};
    }
  }
  function read(raw){
    const ids=sites.map(s=>s.id),returned=ids.filter(id=>Array.isArray(raw?.returned)&&raw.returned.includes(id));
    const carried=ids.includes(raw?.carried)&&!returned.includes(raw.carried)?raw.carried:"";
    const helps={};for(const id of ["ink","des","lark"])helps[id]=Number.isSafeInteger(raw?.helps?.[id])?clamp(raw.helps[id],0,99999):0;
    return {returned,carried,helps,next:Number.isInteger(raw?.next)?clamp(raw.next,0,2):0};
  }
  window.BaySwimming={coast,floor,sites,ladders,water,wetSand,beach,wave,surfaceY,insideHull,Swim,read};
})();
