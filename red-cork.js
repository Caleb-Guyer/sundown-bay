/* A borrowed rod, two public piers and Cal Bennett's catch-and-release book. */
(() => {
  "use strict";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const sites=[
    {id:"marlin",name:"Marlin Pier",x:243.4,z:-117.2,y:.37,yaw:Math.PI/2},
    {id:"cut",name:"Pelican Cut Landing",x:251.2,z:321.4,y:.46,yaw:Math.PI/2}
  ];
  const fish={
    pin:{name:"Pinfish",min:14,max:26,pull:.73,color:"#b6b983",stripe:"#6b7958"},
    jack:{name:"Crevalle jack",min:33,max:73,pull:1.22,color:"#bdc7ac",stripe:"#568e82"},
    drum:{name:"Red drum",min:35,max:74,pull:1.04,color:"#c38867",stripe:"#8c5449"},
    snook:{name:"Common snook",min:41,max:86,pull:1.17,color:"#afb293",stripe:"#414e4a"}
  };
  function read(raw){
    const best={};let count=0;
    for(const [id,f] of Object.entries(fish)){
      const n=raw?.best?.[id];if(Number.isInteger(n)&&n>=f.min&&n<=f.max){best[id]=n;count++;}
    }
    return {known:raw?.known===true,best,total:Math.max(count,Number.isSafeInteger(raw?.total)?Math.max(0,raw.total):0)};
  }
  function point(s,range,bearing){
    return {x:s.x+Math.sin(s.yaw+bearing)*range,z:s.z+Math.cos(s.yaw+bearing)*range};
  }
  function shoal(s,t){
    const clock=t*.115+(s.id==="cut"?2.7:0);
    return point(s,11.6+3.25*Math.sin(clock*.71),Math.sin(clock)*.36);
  }
  class Cast{
    constructor(site,cedar){
      this.site=site;this.cedar=cedar;this.aim=0;this.serial=0;this.phase="ready";
      this.clock=0;this.power=0;this.range=0;this.tension=0;this.cork=null;this.last=null;
    }
    press(){
      if(this.phase==="ready"||this.phase==="miss"||this.phase==="landed"){
        this.phase="wind";this.clock=this.power=0;this.last=this.cork=null;return;
      }
      if(this.phase==="bite"){
        this.phase="fight";this.clock=0;this.tension=.36;this.run=false;this.slack=0;
      }else if(this.phase==="soak")this.miss("The cork came back empty. Wait for it to go under.");
    }
    release(t,rain){
      if(this.phase!=="wind")return;
      this.range=4.5+this.power*14.5;this.bearing=this.aim;this.castRange=this.range;
      const hit=point(this.site,this.range,this.bearing),school=shoal(this.site,t);
      const miss=Math.hypot(hit.x-school.x,hit.z-school.z);this.accuracy=clamp(1-miss/6.5,0,1);
      this.serial++;this.seed=t*.87+this.serial*2.17+this.bearing*6;
      this.id=this.site.id==="cut"?(this.range>12?"snook":"drum"):(this.range<9?"pin":"jack");
      const f=fish[this.id],roll=.5+.5*Math.sin(this.seed*2.37);
      this.length=Math.round(f.min+(f.max-f.min)*clamp(.10+.50*roll+.40*this.accuracy,0,1));
      this.biteAt=2.8+(1-this.accuracy)*3.8+.55*roll-.50*(this.cedar?1:0)-.36*rain;
      this.phase="flight";this.clock=0;this.cork={...point(this.site,1.3,this.aim),y:this.site.y+1.8};
    }
    miss(message){this.phase="miss";this.last=message;this.cork=null;this.tension=0;this.clock=0;}
    step(dt,t,steer,reel){
      this.clock+=dt;
      if(["ready","wind","miss","landed"].includes(this.phase)){
        this.aim=clamp(this.aim+steer*dt*.65,-.62,.62);
        if(this.phase==="wind")this.power=1-Math.abs(1-(this.clock*.90)%2);
        return;
      }
      if(this.phase==="flight"){
        const k=clamp(this.clock/.67,0,1),p=point(this.site,1.3+(this.range-1.3)*k,this.bearing);
        this.cork={...p,y:(1-k)*(this.site.y+1.8)+Math.sin(k*Math.PI)*2+BaySwimming.surfaceY(p,t)*k+.08};
        if(k>=1){this.phase="soak";this.clock=0;}return;
      }
      if(this.phase==="fight"){
        const f=fish[this.id],cycle=(this.clock+.35)%(3.7/f.pull);
        this.run=cycle>1.85/f.pull;
        this.bearing=clamp(this.bearing+dt*Math.cos(this.seed+this.clock*1.35)*.23*(this.run?1:.4),-.72,.72);
        this.aim=clamp(this.aim+steer*dt*.92,-.72,.72);
        const error=Math.min(1,Math.abs(this.bearing-this.aim));
        if(reel)this.tension+=dt*(this.run?.55*f.pull:.022+error*.12);
        else this.tension=Math.max(.04,this.tension-dt*(this.run?.30:.40));
        if(this.tension>=1){this.miss("The line parted on the run. Ease off when the fish pulls.");return;}
        this.slack=!reel&&this.tension<.16?this.slack+dt:Math.max(0,this.slack-2*dt);
        if(this.slack>2.1){this.miss("The hook shook loose. Wind again when the fish turns.");return;}
        this.range+=dt*(this.run?.80*f.pull:0)-dt*(reel?(this.run?1.20:3.60)*(1-.42*error):0);
        if(this.range>this.castRange+7){this.miss("It took the last of the line.");return;}
        if(this.range<=1.1){
          this.phase="landed";this.cork=null;this.tension=0;
          return {id:this.id,length:this.length,site:this.site.id};
        }
      }else{
        if(this.phase==="soak"&&this.clock>=this.biteAt){this.phase="bite";this.clock=0;}
        else if(this.phase==="bite"&&this.clock>1.55){this.miss("It let go. Strike as the cork sinks.");return;}
      }
      const p=point(this.site,this.range,this.bearing+Math.sin(t*.8)*.007);
      this.cork={...p,y:BaySwimming.surfaceY(p,t)+.11+(this.phase==="bite"?-.16:Math.sin(t*4)*.04)};
    }
    text(){
      switch(this.phase){
      case "ready": return "Aim A/D · Hold Space to cast, release for distance";
      case "wind": return "Release Space to cast "+(4.5+14.5*this.power).toFixed(1)+" m";
      case "flight": return "Line out";
      case "soak": return "Watch the red cork";
      case "bite": return "Cork under! Tap Space to set the hook";
      case "fight": return (this.run?"Running · Ease off Space":"Turning · Hold Space to reel")+" · "+this.range.toFixed(1)+" m";
      case "miss": return this.last;
      default:return fish[this.id].name+" · "+this.length+" cm · Tagged and released";
      }
    }
  }
  function record(book,catchInfo){
    const {id,length}=catchInfo,old=book.best[id]||0;
    book.total++;book.best[id]=Math.max(old,length);
    return old===0?55:length>old?30:12;
  }
  window.BayRedCork={sites,fish,point,shoal,read,Cast,record};
})();
