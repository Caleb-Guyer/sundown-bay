/* A free afternoon with the other lead and the town's three working photo booths. */
(() => {
  "use strict";
  const sites=[
    {id:"luna",name:"Cine Luna",x:12.65,z:49.4,yaw:-Math.PI/2},
    {id:"marlin",name:"Marlin Motel",x:131.8,z:-38.5,yaw:Math.PI/2},
    {id:"wheel",name:"North Boardwalk",x:174,z:117.3,yaw:-Math.PI/2}
  ];
  for(const s of sites){
    s.stand=BayDriving.world(s,-.22,1.36);
    s.block={x:s.x,z:s.z,w:1.36,d:1.64,bottom:0,top:2.25,streetProp:true};
  }
  const gap=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
  const storeKey=id=>"sundownBay.fotoBahia."+id;
  function valid(r,id){
    return r?.site===id&&["guest","frankie"].includes(r.lead)&&Number.isSafeInteger(r.day)&&r.day>0&&
      Number.isSafeInteger(r.minute)&&r.minute>=0&&r.minute<1440&&Array.isArray(r.poses)&&r.poses.length===3&&
      r.poses.every(p=>Number.isInteger(p)&&p>=0&&p<=2)&&Number.isSafeInteger(r.stamp)&&r.stamp>0;
  }
  class Album{
    constructor(){this.records=[];this.refresh();}
    refresh(){
      for(const s of sites){
        try{
          const raw=JSON.parse(localStorage.getItem(storeKey(s.id)));
          if(Array.isArray(raw)){
            const merged=new Map(this.records.filter(r=>r.site===s.id).map(r=>[r.stamp,r]));
            for(const r of raw.slice(-4))if(valid(r,s.id))merged.set(r.stamp,r);
            this.records=this.records.filter(r=>r.site!==s.id).concat([...merged.values()].sort((a,b)=>a.stamp-b.stamp).slice(-4));
          }
        }catch{/* A booth still prints when browser storage is unavailable. */}
      }
      this.records.sort((a,b)=>b.stamp-a.stamp);
    }
    keep(site,poses,lead,day,minute,looks,solo=false){
      this.refresh();
      const r={site:site.id,poses:[...poses],lead,day,minute,stamp:Math.max(Date.now(),(this.records[0]?.stamp||0)+1)};
      if(looks){r.looks={guest:looks.guest,frankie:looks.frankie};r.solo=solo;}
      if(!valid(r,site.id))return null;
      const local=this.records.filter(q=>q.site===site.id).slice(0,3).reverse().concat(r);
      this.records=[r,...this.records.filter(q=>q.site!==site.id||local.includes(q))];
      try{localStorage.setItem(storeKey(site.id),JSON.stringify(local));}catch{}
      return r;
    }
  }
  class Sitting{
    constructor(site){this.site=site;this.poses=[];this.pose=0;this.left=3.5;this.flash=0;}
    step(dt){
      this.flash=Math.max(0,this.flash-dt*3.8);
      this.left-=dt;if(this.left>0)return false;
      if(this.poses.length===3)return true;
      this.poses.push(this.pose);this.flash=1;this.left=this.poses.length===3?.65:2.8;return false;
    }
  }
  class Afternoon{
    constructor(){this.album=new Album();this.reset();}
    reset(){
      this.active=false;this.phase="foot";this.vehicle=null;this.side=1;this.seat=0;
      this.path=[];this.goal=null;this.replan=0;this.lastLine=-20;this.said=new Set();
      this.photo=null;this.trail=[];this.meters=0;this.lastDrive=null;this.ending=false;this.handoff=null;
    }
    start(v){
      this.reset();this.active=true;
      if(v){this.vehicle=v;this.phase="out";this.side=-1;this.seat=1;}
    }
    get inDoor(){return this.phase==="in"||this.phase==="out"||this.phase==="across";}
    get seated(){return this.phase==="ride";}
    trailPoint(hero){
      if(!this.trail.length||gap(this.trail.at(-1),hero)>.67){
        this.trail.push({x:hero.x,z:hero.z});if(this.trail.length>56)this.trail.shift();
      }
    }
    follow(actor,hero,dt,env){
      this.trailPoint(hero);const distance=gap(actor,hero),motion=actor.motion;
      if(distance<1.72){this.path=[];this.goal=null;motion.step(dt,0,0);return;}
      this.replan-=dt;
      if(this.replan<=0){
        const side=BayDriving.world(hero,.92,-1.0),point=env.clear(side.x,side.z)?side:this.trail[Math.max(0,this.trail.length-3)];
        if(!this.path.length||!this.goal||gap(point,this.goal)>.68){
          this.goal=point;this.path=env.route(actor,point,null)||[];
          if(!this.path.length){
            const crumb=this.trail.find(p=>gap(actor,p)>.85&&gap(actor,p)<4&&env.clear(p.x,p.z));
            if(crumb)this.path=env.route(actor,crumb,null)||[];
          }
        }
        this.replan=this.path.length?.42:1.1;
      }
      const next=this.path[0];
      if(!next){motion.step(dt,0,0);return;}
      const len=gap(actor,next),speed=Math.min(8,2.65+Math.max(0,distance-1.7)*.95),f=Math.min(1,dt*speed/(len||1));
      if(!env.clear(actor.x+(next.x-actor.x)*f,actor.z+(next.z-actor.z)*f)){
        this.path=[];motion.step(dt,0,0);return;
      }
      BayCarAccess.walkPath(actor,motion,this.path,dt,env.ground,speed);
    }
    walkToDoor(actor,v,dt,env){
      this.replan-=dt;
      if(v!==this.vehicle||this.replan<=0){
        this.vehicle=v;this.side=1;
        const plan=env.door(v,false,actor,1);
        const curb=BayCarAccess.outside(bayCarLayout(v.kind),1),at=BayDriving.world(v,curb.x,curb.z);
        this.path=plan?.points||env.route(actor,at,v)||[];
        this.replan=this.path.length?.65:1.15;
      }
      if(!this.path.length){actor.motion.step(dt,0,0);return;}
      if(BayCarAccess.walkPath(actor,actor.motion,this.path,dt,env.ground,3.7)){
        const point=BayCarAccess.outside(bayCarLayout(v.kind),1);
        if(gap(actor,BayDriving.world(v,point.x,point.z))<.36&&env.door(v,true,actor,1)){
          this.phase="in";this.seat=0;this.trail=[];
        }
      }
    }
  }
  window.BayOffClock={sites,Album,Sitting,Afternoon,valid,near(p){return sites.find(s=>gap(s.stand,p)<1.75);}};
})();
