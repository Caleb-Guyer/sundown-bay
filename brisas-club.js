/* Las Brisas keeps one switch car for new drivers. The gold car runs the
   boulevard between shows, with the same four struts as the player's car. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const delta=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),count=v=>Number.isSafeInteger(v)?clamp(v,0,999999):0;
  const moves={
    front:{name:"Front hop",keys:[0],pair:[2,3],support:[0,1],target:.23},
    rear:{name:"Back bumper",keys:[1],pair:[0,1],support:[2,3],target:.21},
    left:{name:"Driver's side",keys:[2],pair:[0,2],support:[1,3],target:.22},
    right:{name:"Passenger side",keys:[3],pair:[1,3],support:[0,2],target:.22},
    crossL:{name:"Left front corner",keys:[0,2],corner:2,opposite:1,adjacent:[0,3],target:.30},
    crossR:{name:"Right front corner",keys:[0,3],corner:3,opposite:0,adjacent:[1,2],target:.30},
    double:{name:"Double front",keys:[0],pair:[2,3],support:[0,1],target:.19,double:true}
  };
  const courses={
    ribbon:{name:"Marquee & Boardwalk",stops:[
      {name:"Cine Luna",x:-5,z:38,dir:2,move:"left"},{name:"North Boardwalk",x:149,z:114,dir:0,move:"front"}]},
    coast:{name:"Courts & Mercado",stops:[
      {name:"Sol Beach Courts",x:139.05,z:-55,dir:2,move:"right"},{name:"El Mercado",x:-38,z:-139.05,dir:3,move:"rear"}]}
  };
  const classes={house:{name:"First Switch",reward:95},custom:{name:"Crossed Up",reward:160}};
  const parking=v=>v&&Number.isFinite(v.x)&&Number.isFinite(v.z)&&Number.isFinite(v.yaw)&&
    v.x>=-184&&v.x<=270&&v.z>=-182&&v.z<=381?{x:v.x,z:v.z,yaw:delta(0,v.yaw),flatSide:[-1,1].includes(v.flatSide)?v.flatSide:0,flatAxle:Number.isFinite(v.flatAxle)?v.flatAxle:null}:null;
  function read(raw){
    const book={seen:raw?.seen===true,title:raw?.title===true,height:Math.min(250,count(raw?.height)),rev:count(raw?.rev),classes:{},cruises:{},park:parking(raw?.park)};
    for(const k of Object.keys(classes)){const c=raw?.classes?.[k];book.classes[k]={played:count(c?.played),wins:count(c?.wins),best:Math.min(100,count(c?.best))};}
    for(const k of Object.keys(courses))book.cruises[k]=count(raw?.cruises?.[k]);return book;
  }
  function measured(r,m){
    const w=r.wheelLift;if(m.corner!=null){
      const lift=w[m.corner],against=w[m.opposite],near=Math.max(w[m.adjacent[0]],w[m.adjacent[1]]);
      return lift>near+.07&&against<.07?Math.max(0,lift-.35*near):0;
    }
    const raised=Math.min(w[m.pair[0]],w[m.pair[1]]),base=Math.max(w[m.support[0]],w[m.support[1]]);
    return Math.max(0,raised-1.3*base);
  }
  function switches(v){
    if(!v||v.kind!=="solena"&&!v.upgrades?.hydraulics)return null;
    if(!v.hydraulic)v.hydraulic=new BayHydraulics.Rig();return v.hydraulic;
  }
  const names=k=>moves[k].keys.map(i=>i+1).join(" + ");
  class Club{
    constructor(site,loan,lead,actors,book){
      this.site=site;this.loan=loan;this.lead=lead;this.actors=actors;this.saved=book;
      this.celia=actors.find(a=>a.id==="celia");this.nico=actors.find(a=>a.id==="nico");
      this.celia.motion??=new BayPlayerMotion();this.nico.motion??=new BayPlayerMotion();
      this.rigs=new Set([lead,loan]);switches(lead);switches(loan);
      this.lap=0;this.route="ribbon";this.stop=0;this.mode="demo";this.age=0;this.beat=-1;this.bits=0;this.seat=1;
      this.show=null;this.trip=null;this.reserve=null;this.height=0;this.lights=0;this.cheer=0;this.lastRide=null;
      this.celia.ride=lead;this.celia.seat=1;this.celia.action="drive";this.score=0;
    }
    get stopAt(){return courses[this.route].stops[this.stop];}
    get home(){return this.mode==="home"||this.mode==="demo"||this.mode==="boarding";}
    change(mode){this.mode=mode;this.age=0;this.beat=-1;this.bits=0;this.lead.hydraulic.lower();}
    onPad(v,strict=true){
      if(!v)return false;const s=this.site.pad,p=BayDriving.local(s,v.x,v.z);
      if(!strict)return Math.abs(p.x)<3.6&&Math.abs(p.z)<5.2;
      return Math.abs(p.x)<1.46&&Math.abs(p.z)<2.35&&Math.abs(v.speed)<1&&Math.abs(Math.sin(delta(s.yaw,v.yaw)))<.48;
    }
    get target(){
      if(this.trip){const j=this.trip;
        if(j.stage==="queued")return {...this.site.desk,name:"Las Brisas · Next departure"};
        if(j.stage==="keys")return {...this.loan,name:"Las Brisas · Switch car"};
        if(j.stamps===3)return {...this.site.pad,name:"Las Brisas · Return to the apron"};
        if(this.mode==="curb")return {...this.stopAt,name:this.stopAt.name+" · Gold Solena"};
        if(this.mode==="road")return {x:this.lead.x,z:this.lead.z,name:"Celia → "+this.stopAt.name};
        return {...this.lead,name:"Celia · Gold Solena"};
      }
      if(this.reserve)return {...this.site.pad,name:"Las Brisas · Measuring apron"};
      return null;
    }
    remember(v){
      if(v===this.loan&&this.saved.title){const p=parking(v),old=this.saved.park;if(!p||old&&gap(old,p)<.15&&Math.abs(delta(old.yaw,p.yaw))<.03&&old.flatSide===p.flatSide)return false;
        this.saved.park=p;this.saved.rev++;return true;}return false;
    }
    press(v,i,env){
      const r=switches(v);if(!r)return false;this.rigs.add(v);
      if(r.press(i,v.speed))env.sound("pump",v,i);return true;
    }
    release(i){this.lastRide?.hydraulic?.release(i);}
    lowerPlayer(){this.lastRide?.hydraulic?.lower();}
    ready(kind){return kind==="house"||kind==="custom"&&this.saved.classes.house.wins>0;}
    enter(kind,v,env){
      if(!this.ready(kind)||this.show||this.trip||!switches(v)||!this.onPad(v)||v.flatSide)return false;
      env.sync();this.saved.seen=true;this.reserve=null;this.lowerPlayer();switches(v).lower();
      const side=this.saved.classes[kind].played%2,calls=kind==="house"?["front","rear",side?"right":"left"]:[side?"crossR":"crossL",side?"crossL":"crossR","double"];
      this.show={kind,v,calls,cue:0,stage:"count",age:0,peak:0,high:0,hops:0,off:false,pass:0,points:[],earned:0,recorded:false};
      this.height=this.score=0;this.lights=0;env.say("Nico Paz","On the stripe. Watch my hand. Hit the switches when I call it.");env.change();return true;
    }
    announce(s,env){
      const move=moves[s.calls[s.cue]];s.stage="live";s.age=0;s.peak=0;s.hops=0;s.off=false;s.wait=0;
      this.lights=3;env.say("Nico Paz",move.name+". "+(move.double?"Put the fronts down and come back up.":move.corner!=null?"Give me one high corner.":"Show me daylight under both tires."));env.change();
    }
    closeShow(s,env){
      if(s.recorded)return;s.recorded=true;s.stage="result";s.age=0;this.lights=0;
      s.total=Math.round(s.points.reduce((n,p)=>n+p,0)/s.points.length);
      const c=classes[s.kind];env.sync();const record=this.saved.classes[s.kind],win=s.pass>=2&&s.total>=52;
      s.newTitle=win&&!this.saved.title;s.paid=win&&!record.wins?c.reward:0;s.win=win;
      record.played++;if(win)record.wins++;record.best=Math.max(record.best,s.total);
      this.saved.seen=true;this.saved.title||=s.newTitle;this.saved.height=Math.max(this.saved.height,Math.round(s.high*100));
      this.remember(s.v);if(s.paid)env.pay(s.paid);this.saved.rev++;env.save();this.score=s.total;this.cheer=3;
      env.say("Celia Reyes",s.newTitle?"That plum Solena has your name on the pink slip. Take it around the bay.":win?"Keep that switch hand. That was clean.":"Next pass, let the tires touch before you pump again.");env.change();
    }
    stepShow(dt,env){
      const s=this.show,r=s.v.hydraulic;s.age+=dt;
      if(s.stage==="result")return;
      if(s.stage==="count"){this.lights=Math.min(3,Math.floor(s.age*1.7));if(s.age>=2.10)this.announce(s,env);return;}
      if(s.stage==="card"){
        if(s.age>1.14){if(++s.cue===s.calls.length)this.closeShow(s,env);else this.announce(s,env);}return;
      }
      const m=moves[s.calls[s.cue]],h=measured(r,m),high=Math.max(...r.wheelLift);
      s.high=Math.max(s.high,high);s.peak=Math.max(s.peak,h);this.height=s.peak;
      if(!s.off&&h>m.target){s.off=true;s.hops++;}
      if(s.off&&m.pair?.every(i=>r.wheelLift[i]<.012))s.off=false;
      const hit=s.peak>=m.target&&(!m.double||s.hops>=2);
      s.wait=hit&&r.contacts===15&&!r.buttons?s.wait+dt:0;
      if(s.age<(m.double?7.8:5.8)&&!(s.wait>.28&&s.age>1.0))return;
      const n=Math.round(clamp(s.peak/m.target,0,1)*60+(hit?Math.min(40,(s.peak-m.target)*134):0));
      s.points.push(m.double&&!hit?Math.min(45,n):n);if(hit)s.pass++;
      this.score=s.points.at(-1);this.cheer=hit?1.85:.25;this.lights=hit?3:1;s.stage="card";s.age=0;env.sound(hit?"bell":"land",s.v,hit?.8:.32);env.change();
    }
    invite(v,env,route=this.route){
      if(this.trip||this.show||!Object.hasOwn(courses,route))return false;
      this.reserve=null;this.saved.seen=true;
      if(this.home&&this.route!==route){this.route=route;this.stop=0;}
      const stage=route!==this.route?"queued":switches(v)?"join":"keys";
      this.trip={route,stage,stamps:0,age:0};env.save();
      env.say("Celia Reyes",stage==="queued"?"Catch me at the yard after this lap. We’ll take the "+courses[route].name+" run.":"Bring a switch car. At each curb, answer my hop while I'm parked. We finish back at Nico's stripe.");env.change();return true;
    }
    finishTour(v,env){
      const j=this.trip;if(!j||j.stamps!==3||!this.onPad(v)||!switches(v))return false;
      env.sync();const n=this.saved.cruises[j.route],earned=n?0:j.route==="ribbon"?105:125;
      this.saved.cruises[j.route]=n+1;this.saved.rev++;if(earned)env.pay(earned);
      this.trip=null;env.save();env.say("Nico Paz",earned?"Both corners vouched for you. That's $"+earned+" for the roll.":"That's another round in the book. Welcome back.");env.change();return true;
    }
    drop(){this.show?.v.hydraulic?.lower();this.show=null;this.trip=null;this.reserve=null;this.lights=this.score=this.height=0;}
    setDemo(bits,env){
      for(let i=0;i<4;i++){const bit=1<<i;if(bits&bit){if(!(this.bits&bit)&&this.lead.hydraulic.press(i,this.lead.speed))env.sound("pump",this.lead,i);}
        else if(this.bits&bit)this.lead.hydraulic.release(i);}
      this.bits=bits;
    }
    driveTo(home,env){
      const dest=home?this.site.second:this.stopAt,path=env.path(this.lead,dest,home);
      if(!path||path.length<2)return false;
      const v=this.lead;v.path=path;v.corner=1;v.pace=6.5;v.finiteRoute=true;v.finiteYaw=home?dest.yaw:dest.dir*Math.PI/2;
      v.reaction=null;v.wait=v.blocked=0;this.change(home?"back":"road");return true;
    }
    tourStep(dt,v,env){
      const j=this.trip;this.age+=dt;if(j)j.age+=dt;
      if(j?.stage==="keys"&&switches(v)){j.stage="join";env.change();}
      if(j?.stage==="join"&&switches(v)&&gap(v,this.lead)<20){j.stage="roll";if(this.mode==="demo")this.age=Math.max(25,this.age);
        env.say("Celia Reyes","There's your nose in my mirror. Stay with the gold car.");env.change();}
      if(!env.crew(this,dt))return;
      if(this.mode==="home"){
        if(this.age>(j?.stage==="roll"?2.4:18)){this.change("boarding");}return;
      }
      if(this.mode==="boarding"){this.change("demo");return;}
      if(this.mode==="demo"){
        const beat=this.age%8.8;this.setDemo(beat<.14?1:beat>1.30&&beat<1.49?4:0,env);
        if(!this.show)this.height=Math.max(this.lead.hydraulic.front,this.lead.hydraulic.left);
        if(j?.stamps!==3&&(this.age>33||j?.stage==="roll"&&this.age>4)){this.stop=0;this.driveTo(false,env);}return;
      }
      if(this.mode==="road"||this.mode==="back"){
        if(this.lead.path){const dst=this.mode==="back"?this.site.second:this.stopAt;
          const behind=j?.stage==="roll"&&v&&gap(v,this.lead)>35&&gap(v,dst)>gap(this.lead,dst)+8;
          this.lead.pace=behind?3.5:6.6;return;}
        if(this.mode==="back"){this.change("alight");return;}
        this.change("curb");env.change();return;
      }
      if(this.mode==="alight"){
        this.change("home");if(j?.stage==="queued"){this.route=j.route;this.stop=0;j.stage=switches(v)?"join":"keys";env.change();}
        else if(!j)this.route=++this.lap%2?"coast":"ribbon";return;
      }
      const stop=this.stopAt,m=moves[stop.move],beat=this.age%4.2;this.setDemo(beat<.19?1<<m.keys[0]:0,env);
      if(j?.stage==="roll"&&switches(v)&&gap(v,this.lead)<15&&Math.abs(v.speed)<4.2&&measured(v.hydraulic,m)>.105&&!(j.stamps&(1<<this.stop))){
        j.stamps|=1<<this.stop;this.cheer=2;env.sound("bell",v,.75);env.say("Celia Reyes",this.stop?"There it is. Let's bring them home.":"Got you. Meet me round the next bend.");env.change();
      }
      const needed=j?.stage==="roll"&&!(j.stamps&(1<<this.stop));
      if(!needed&&this.age>(j?.stage==="roll"?3.5:9.5)){
        if(this.stop===0){this.stop=1;this.driveTo(false,env);}else this.driveTo(true,env);
      }
    }
    step(dt,env){
      const v=env.driver();if(v!==this.lastRide){this.lowerPlayer();this.lastRide=v;if(switches(v))this.rigs.add(v);}
      this.cheer=Math.max(0,this.cheer-dt);
      this.tourStep(dt,v,env);
      for(const car of this.rigs){
        const r=car.hydraulic;r.advance(dt,car.speed||0,bayCarLayout(car.kind));
        if(r.land>1.1)env.sound("land",car,Math.min(1,r.land/5));
        if(r.rest&&car!==v&&car!==this.lead&&car!==this.loan)this.rigs.delete(car);
      }
      if(this.show)this.stepShow(dt,env);
      env.poses(this,dt);this.best=this.saved.height*.01;
    }
  }
  window.BayBrisasClub={Club,read,moves,classes,courses,measured,switches,names};
})();
