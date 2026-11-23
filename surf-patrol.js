/* The guard and the regulars keep their own beach watch whether the player stops or drives past. */
(() => {
  "use strict";
  const S=BaySwimming,range=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const tower={x:187.5,z:-25,name:"Sol Beach lifeguard tower",kind:"surf-tower"};
  const slips=[
    {x:237,z:-28,style:"ink",name:"Ink Alvarez",flag:"Tower flags",towel:-34,line:"I make better time painting signs than swimming laps.",thanks:"You got me in with both my shoes. I’m calling that a good day."},
    {x:241,z:48,style:"des",name:"Des Price",flag:"North flags",towel:45,line:"I used to catch the Paloma from this end. My ferry token is older than the float.",thanks:"Next time I say another lap, remind me how far out that yellow buoy is."},
    {x:242,z:-81,style:"lark",name:"Lark Bennett",flag:"Pier flags",towel:-70,line:"My dad carved a little red lure up in Pelican Cut. I never did put a hook in it.",thanks:"Good looking out. From down there that tower suddenly looked tiny."}
  ];
  const person=(style,name,x,z,i)=>({style,name,x,z,y:.04,yaw:1.55,phase:i*1.7,pace:0,pose:"tread",depth:0,wet:false,mode:"lap",timer:i*4,index:i});
  function move(p,q,speed,dt,t){
    const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz),step=Math.min(d,speed*dt);
    if(d>.08&&step>0){
      const a=Math.atan2(dx,dz)-p.yaw;
      p.yaw+=Math.atan2(Math.sin(a),Math.cos(a))*-Math.expm1(-7*dt);p.x+=dx/d*step;p.z+=dz/d*step;
    }
    const offshore=p.x-S.coast(p.z);
    p.wet=offshore>(p.wet?1.3:2.7);p.y=p.wet?S.surfaceY(p,t):offshore>-.8?Math.max(-.88,S.floor(p.x,p.z)):.026;
    p.pace+=((d>.20?Math.min(1,speed/3.4):0)-p.pace)*-Math.expm1(-6*dt);
    p.phase+=dt*(p.wet?2.2+3.7*p.pace:1.4+7*p.pace);
    p.pose=p.pace>.13?"stroke":"tread";return d-step;
  }
  function routine(p,s,dt,t){
    p.timer+=dt;
    if(p.mode==="lap"){
      const a=t*.13+p.index*1.9;
      move(p,{x:s.x+Math.cos(a)*4.2,z:s.z+Math.sin(a)*5.4},1.27,dt,t);
      if(p.timer>72+p.index*11){p.mode="land";p.timer=0;}return;
    }
    const towel={x:S.coast(s.towel)-9,z:s.towel};
    if(p.mode==="land"){if(move(p,towel,p.wet?1.95:1.28,dt,t)<.28){p.mode="sand";p.timer=0;}}
    else if(p.mode==="sand"){move(p,towel,0,dt,t);if(p.timer>17+p.index*3){p.mode="out";p.timer=0;}}
    else if(move(p,s,p.wet?1.85:1.34,dt,t)<.36){p.mode="lap";p.timer=0;}
  }
  class Watch {
    constructor(next=0){
      this.index=next;this.next=next;this.wait=14;this.alert=false;this.call=null;
      this.tali=person("tali","Tali Moreno",tower.x,tower.z,0);this.tali.yaw=1.55;
      this.locals=slips.map((s,i)=>person(s.style,s.name,s.x-1.6-i,s.z,i));this.actors=[this.tali,...this.locals];
      this.last=null;
    }
    get towing(){return this.call?.phase==="player";}
    target(){return this.call?(this.towing?this.call.shore:this.call.swimmer):null;}
    offer(p,swim){
      return !!(this.alert&&swim&&!swim.exit&&swim.depth<.48&&!this.towing&&range(p,this.call.swimmer)<3.2);
    }
    grab(p,swim){
      if(!this.offer(p,swim))return false;
      this.call.phase="player";this.tali.towing=false;this.call.swimmer.pose="tow";return true;
    }
    release(){
      if(!this.towing)return false;this.call.phase="calling";this.call.age=Math.max(15,this.call.age);return true;
    }
    whistle(){
      const s=slips[this.next],w=this.locals[this.next];this.index=this.next;this.alert=true;
      this.call={phase:"calling",swimmer:w,slip:s,age:0,shore:{x:S.coast(s.towel)-1.45,z:s.towel,name:"Shallow water · "+s.flag}};
      return "whistle";
    }
    finish(helped){
      const c=this.call;c.swimmer.mode="land";c.swimmer.timer=0;c.swimmer.pose="tread";this.tali.towing=false;
      this.last={style:c.slip.style,name:c.slip.name,helped};this.call=null;this.alert=false;
      this.next=(this.index+1)%slips.length;this.wait=59;return helped?"player-home":"guard-home";
    }
    step(dt,t,p,swim){
      const c=this.call,guard=this.tali;
      for(let i=0;i<this.locals.length;i++)if(this.locals[i]!==c?.swimmer)routine(this.locals[i],slips[i],dt,t);
      if(!c){
        if(move(guard,tower,guard.wet?2.05:2.32,dt,t)<.20)guard.yaw=1.55;
        this.wait-=dt;const local=this.locals[this.next];
        if(this.wait<=0&&local.wet&&range(local,slips[this.next])<8.5)return this.whistle();
        return null;
      }
      c.age+=dt;const w=c.swimmer,s=c.slip;
      if(c.phase==="player"&&(!swim&&p.x>S.coast(p.z)+1.4||range(p,w)>8))this.release();
      if(c.phase==="calling"){
        const drift={x:s.x+1.8*Math.sin(t*.155),z:s.z+3.4*Math.cos(t*.097)};
        move(w,drift,.52,dt,t);w.pose="wave";w.yaw+=Math.atan2(Math.sin(-1.5-w.yaw),Math.cos(-1.5-w.yaw))*dt*2;
        if(c.age>12){
          if(move(guard,w,guard.wet?2.0:3.1,dt,t)<1.5){c.phase="guard";guard.towing=true;}
        }else{guard.yaw=Math.atan2(w.x-guard.x,w.z-guard.z);guard.phase+=dt*.8;}
        return null;
      }
      const player=c.phase==="player",lead=player?p:guard;
      move(guard,c.shore,player?(guard.wet?2.3:2.86):2.18,dt,t);
      const tail={x:lead.x-Math.sin(lead.yaw)*1.90,z:lead.z-Math.cos(lead.yaw)*1.90};
      move(w,tail,player?4.8:3.8,dt,t);w.pose="tow";w.yaw=lead.yaw;w.towing=false;
      if(lead.x<S.coast(lead.z)+1.35&&S.beach(lead.z)&&range(lead,w)<3.4)return this.finish(player);
      return null;
    }
  }
  window.BaySurfPatrol={tower,slips,Watch};
})();
