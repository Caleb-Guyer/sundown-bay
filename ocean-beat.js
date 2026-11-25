/* Ocean Unit 12 works two curb posts. The officer, cruiser and signed copy
   keep their identity through an ordinary round, a traffic stop and a call. */
(() => {
  "use strict";
  const posts=[
    {x:138.15,z:-18.5,dir:2,yaw:Math.PI,name:"Ocean Drive",stand:{x:136.35,z:-20.8}},
    {x:5.35,z:48,dir:0,yaw:0,name:"Cine Luna",stand:{x:7.52,z:46.4}}
  ];
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const approach=(a,b,dt)=>Math.abs(a-b)<.001?b:a+(b-a)*-Math.expm1(-7*dt);
  function read(raw){
    const s=raw?.slip;
    const valid=s&&["warning","citation","check"].includes(s.kind)&&Number.isSafeInteger(s.number)&&s.number>0&&
      ["car","plate","street"].every(k=>typeof s[k]==="string"&&s[k].length<90)&&
      Number.isInteger(s.minute)&&s.minute>=0&&s.minute<1440&&Number.isSafeInteger(s.day)&&s.day>0&&Number.isSafeInteger(s.fine)&&s.fine>=0&&s.fine<=25;
    return {known:!!raw?.known||!!valid,warnings:Number.isSafeInteger(raw?.warnings)&&raw.warnings>0?raw.warnings:0,slip:valid?{...s}:null};
  }
  class Round{
    constructor(v){
      this.v=v;this.post=0;this.phase="post";this.time=65;this.seat=0;this.walk=[];this.wait=0;this.stop=null;
      this.actor={...posts[0].stand,yaw:1.18,writing:0,give:0,motion:new BayPlayerMotion()};
      Object.assign(v,{beatCar:true,beatLights:false,serviceCar:true,plate:"OCEAN 12"});
    }
    standing(){return this.phase==="post";}
    window(v,side=-1){
      const p=BayCarAccess.outside(bayCarLayout(v.kind),side);return BayDriving.world(v,p.x,p.z);
    }
    walkTo(p,phase,e){
      const path=e.walk(this.actor,p);
      if(!path)return false;
      this.actor.motion.ride=null;this.walk=path;this.phase=phase;return true;
    }
    board(e){
      if(this.seat===1){this.phase="ready";return;}
      if(this.phase==="exit"||this.phase==="enter"){this.phase="enter";return;}
      if(!this.walkTo(this.window(this.v),"door",e)){this.phase="return";this.wait=.65;}
    }
    start(kind,target,e){
      if(this.stop||!target||target.serviceCar||!e.free()||!["round","post","toPost"].includes(this.phase))return false;
      const eye=this.seat===1?this.v:this.actor;
      if(kind==="check"?!this.canCheck(target,e):gap(eye,target)>44||!e.sees(eye,target))return false;
      this.stop={kind,target,origin:{x:target.x,z:target.z},brake:0};
      const v=this.v;
      v.beatLights=kind!=="check";this.wait=0;
      if(v.path&&v.speed>.3){v.pace=0;this.phase="stopping";}
      else{v.path=null;BayDriving.settle(v);this.phase="observe";}
      e.say(kind==="check"?"Both brake lamps, please. I’ll walk around back.":"I saw the bump. Find a curb and stop there a moment.");
      return true;
    }
    canCheck(v,e){return this.standing()&&v&&!v.serviceCar&&e.free()&&gap(v,this.actor)<12&&e.atCurb(v);}
    route(e){
      const v=this.v,next=posts[this.post^1],curb=e.curb(v);
      if(!curb){this.phase="ready";this.wait=1;return;}
      const path=BayCab.route({...curb,x:v.x,z:v.z},next).pts;
      Object.assign(v,{path,corner:1,finiteRoute:true,finiteYaw:next.yaw,pace:8.1,wait:0,blocked:0,wantsCurb:false,pullOver:null});
      this.post^=1;this.phase="round";v.beatLights=false;
    }
    cancel(e){
      this.stop=null;this.v.beatLights=false;this.board(e);
    }
    take(e){
      if(this.phase!=="paper"||!this.stop||e.driver()!==this.stop.target)return false;
      const {target,kind}=this.stop;this.stop=null;this.v.beatLights=false;this.board(e);
      e.file(target,kind);return true;
    }
    join(e){
      this.v.path=null;this.stop=null;this.v.beatLights=true;
      if(this.seat===1){this.phase="chase";e.dispatch(this.v);}
      else if(!["door","enter"].includes(this.phase))this.board(e);
    }
    release(e){
      if(this.phase==="chase"){e.release(this.v);this.phase="ready";this.wait=.8;}
      this.v.beatLights=false;
    }
    step(dt,e){
      const a=this.actor,v=this.v,s=this.stop;
      if(this.phase==="chase"){BayCarAccess.pose(v,-1,1,a,a.motion,e.ground,dt);return;}
      this.wait=Math.max(0,this.wait-dt);
      if(s){
        const abandoned=e.driver()!==s.target||!e.free()||gap(s.target,s.origin)>34;
        if(e.wanted()||abandoned){
          if(s.kind!=="check"&&e.driver()===s.target&&(e.wanted()||gap(s.target,s.origin)>34)){
            if(!e.wanted())e.call();this.join(e);
          }else this.cancel(e);
          return;
        }
        if(["rear","test","toWindow","write","paper"].includes(this.phase)&&(!e.atCurb(s.target)||gap(s.target,s.park)>1.15)){
          this.phase="observe";s.brake=0;this.walk=[];this.wait=.45;
        }
      }
      const walking=["toPost","door","rear","toWindow"].includes(this.phase);
      a.writing=approach(a.writing,this.phase==="write"?1:this.phase==="post"?.68:0,dt);
      a.give=approach(a.give,this.phase==="paper"?1:0,dt);
      if(walking){
        if(!BayCarAccess.walkPath(a,a.motion,this.walk,dt,e.ground,2.35))return;
        if(this.phase==="door")this.phase="enter";
        else if(this.phase==="toPost"){this.phase="post";this.time=41;a.yaw=posts[this.post].dir===2?1.18:-1.3;}
        else if(this.phase==="rear"){this.phase="test";e.say("Hold the brake. Let me see both lenses.");}
        else{this.phase="write";this.time=1.8;}
        return;
      }
      if(this.phase==="enter"||this.phase==="exit"){
        const entering=this.phase==="enter";this.seat=Math.max(0,Math.min(1,this.seat+(entering?1:-1)*dt/1.52));
        BayCarAccess.pose(v,-1,this.seat,a,a.motion,e.ground,dt);
        if(entering&&this.seat===1)this.phase="ready";
        if(!entering&&this.seat===0){a.motion.ride=null;this.phase=s?"observe":"arrived";}
        return;
      }
      if(this.seat===1)BayCarAccess.pose(v,-1,1,a,a.motion,e.ground,dt);else a.motion.step(dt,0,0);
      if(this.phase==="ready"){
        if(e.wanted()&&v.beatLights){this.join(e);return;}
        if(!this.wait)this.route(e);return;
      }
      if(this.phase==="round"){
        const post=posts[this.post];
        // A queue can fill the last car length of a curb post. Leave the
        // cruiser where it actually stopped if Solís can reach the sidewalk.
        if(v.path&&!this.wait&&v.corner===v.path.length-1&&v.blocked>2.4&&gap(v,post)<4.4&&e.atCurb(v)){
          this.wait=.8;
          if(e.walk(this.window(v),post.stand)){v.path=null;v.indicator=0;BayDriving.settle(v);}
        }
        if(!v.path)this.phase="exit";return;
      }
      if(this.phase==="return"){if(!this.wait)this.board(e);return;}
      if(this.phase==="arrived"){if(!this.wait&&!this.walkTo(posts[this.post].stand,"toPost",e))this.wait=1;return;}
      if(this.phase==="post"){this.time-=dt;if(this.time<=0&&!this.wait)this.board(e);return;}
      if(!s)return;
      const target=s.target;
      if(this.phase==="stopping"){
        if(!v.path||v.speed<.3){v.path=null;BayDriving.settle(v);this.phase="observe";}
        return;
      }
      if(this.phase==="observe"&&!this.wait&&e.atCurb(target)){
        if(this.seat===1){this.phase="exit";return;}
        s.park={x:target.x,z:target.z};
        const back=BayDriving.world(target,0,-bayCarLayout(target.kind).halfLength-.98);
        if(s.kind==="check"&&s.brake<1){
          if(!this.walkTo(back,"rear",e))this.wait=.8;
        }else if(!this.walkTo(this.window(target),"toWindow",e)&&!this.walkTo(this.window(target,1),"toWindow",e))this.wait=.8;
      }else if(this.phase==="test"){
        a.yaw=Math.atan2(target.x-a.x,target.z-a.z);
        s.brake=e.braking()&&target.brakes>.45?s.brake+dt:0;
        if(s.brake>=1){e.say("Left and right. Both good.");this.phase="observe";}
      }else if(this.phase==="write"||this.phase==="paper"){
        a.yaw=Math.atan2(target.x-a.x,target.z-a.z);this.time-=dt;
        if(this.phase==="write"&&this.time<=0){this.phase="paper";e.say(s.kind==="check"?"There you go. Both lamps signed off.":"Here’s your copy. Take care on Ocean.");}
      }
    }
  }
  window.BayOceanBeat={posts,read,Round};
})();
