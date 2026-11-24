/* Buttonwood's landing, the Pip 16 and the two strings in Alda's tide book. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
  const ease=t=>t*t*(3-2*t),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const wrap=BaySlipTrailer.wrap;
  const sheets=[
    {name:"Little Bank",marks:["bell","pilings"],note:"Alda's red bell first, then the yellow can off the old pilings.",fee:95},
    {name:"Outside String",marks:["grass","light","bell"],note:"Green on the grass edge, blue at the light, then the red bell on the way home.",fee:155}
  ];
  const ids=["bell","pilings","grass","light"];
  const whole=(v,max=999999)=>Number.isSafeInteger(v)&&v>=0?Math.min(max,v):0;
  function pose(raw,sea=false){
    if(!raw||![raw.x,raw.z,raw.yaw].every(Number.isFinite)||raw.x< -185||raw.x>(sea?432:334)||raw.z< -187||raw.z>361)return null;
    return {x:Math.round(raw.x*1000)/1000,z:Math.round(raw.z*1000)/1000,yaw:Math.round(wrap(raw.yaw)*100000)/100000};
  }
  function read(raw){
    raw=raw&&typeof raw==="object"?raw:{};
    const catchCount=whole(raw.catchCount,40),sheet=raw.sheet===1?1:0;
    const marks=Array.isArray(raw.marks)?[...new Set(raw.marks.filter(id=>sheets[sheet].marks.includes(id)))]:[];
    return {seen:raw.seen===true,rev:whole(raw.rev,Number.MAX_SAFE_INTEGER),runs:whole(raw.runs),best:whole(raw.best,40),
      landed:whole(raw.landed),sheet,working:raw.working===true,marks,catchCount,
      rider:["truck","helm"].includes(raw.rider)?raw.rider:"",foot:pose(raw.foot,true),
      last:raw.last&&[0,1].includes(raw.last.sheet)?{sheet:Number(raw.last.sheet),count:whole(raw.last.count,40),pay:whole(raw.last.pay,1500)}:null,
      truck:pose(raw.truck),trailer:pose(raw.trailer),tug:pose(raw.tug),tugKey:typeof raw.tugKey==="string"?raw.tugKey.slice(0,96):"",
      floating:raw.floating===true,boat:pose(raw.boat,true),dock:typeof raw.dock==="string"?raw.dock.slice(0,64):"",side:raw.side===-1?-1:1,
      rests:Object.fromEntries(ids.map(id=>[id,whole(raw.rests?.[id],9999)]))};
  }
  function pots(site){
    const z=site.wet.z,sign=z>30?-1:1;
    return [
      ["bell","Bell Buoy","coral",248,z+sign*9,-3.6],["pilings","Old Pilings","ochre",278,z+sign*34,-4.7],
      ["grass","Grass Edge","jade",264,z-sign*28,-3.95],["light","Lightkeeper’s Can","blue",318,z-sign*37,-5.8]
    ].map(([id,name,color,x,z,bed],index)=>({id,name,color,x,z,bed:BaySwimming.floor(x,z)+.024,load:Math.abs(bed),index}));
  }
  function blendPose(a,b,t){
    const f=ease(clamp(t,0,1));
    return {x:mix(a.x,b.x,f),y:mix(a.y,b.y,f),z:mix(a.z,b.z,f),yaw:a.yaw+wrap(b.yaw-a.yaw)*f,
      pitch:mix(a.pitch||0,b.pitch||0,f),lean:mix(a.lean||0,b.lean||0,f)};
  }
  class Works{
    constructor(site,truck,skiff,saved){
      Object.assign(this,{site,truck,skiff,saved,pots:pots(site),trailer:new BaySlipTrailer.Trailer(site.trailer),
        floating:false,slip:null,line:null,rearView:false,warnAt:-20,actors:[],restTime:0});
      this.skiff.catchCount=saved.catchCount;
    }
    shift(id){
      const s=this.saved;if(s.working||!sheets[id])return false;
      s.working=true;s.sheet=id;s.marks=[];return true;
    }
    mark(id){return this.pots.find(p=>p.id===id);}
    remaining(){const s=this.saved;return sheets[s.sheet].marks.filter(id=>!s.marks.includes(id));}
    target(car,aboard){
      const {site,skiff,trailer:t,saved:s}=this;
      if(!this.floating){
        if(s.working&&(!this.remaining().length||s.catchCount>=40)&&this.atYard())return {...site.counter,name:"Give Benji the landing ticket"};
        if(t.hitched&&car!==t.hitched)return {x:t.hitched.x,z:t.hitched.z,name:"Get back into the tow vehicle"};
        if(!t.hitched){const can=BaySlipTrailer.compatible(car),p=can?t:this.truck;
          return {x:p.x,z:p.z,name:can?"Couple the boat trailer":"Pick up the Cortez Stepside"};
        }
        if(s.working&&(!this.remaining().length||s.catchCount>=40))return {...site.parking,name:"Return the catch to Buttonwood"};
        return {...site.wet,name:"Back the trailer into the launch lane"};
      }
      if(s.working&&(!this.remaining().length||s.catchCount>=40))return {...(t.wet(site)?site.dock:!t.hitched?t:site.wet),name:t.wet(site)?"Bring the Pip back to the trailer":"Put the trailer back in the launch lane"};
      if(!aboard)return {...skiff,name:"Board the Pip 16"};
      return this.mark(this.remaining()[0])||site.dock;
    }
    atYard(){return !this.floating&&!this.slip&&this.trailer.atHome(this.site);}
    canSlip(){return !this.slip&&!this.line&&this.trailer.wet(this.site);}
    capturePoint(){return BayDriving.world(this.trailer,0,-3.85);}
    canRecover(){
      if(!this.floating||!this.canSlip()||Math.hypot(this.skiff.vx,this.skiff.vz)>2.5)return false;
      const v=this.skiff,q=BayDriving.local(this.trailer,v.x,v.z);
      return v.dock===this.site.dock||(q.z<.8&&q.z>-8.2&&Math.abs(q.x)<2.8&&Math.abs(wrap(v.yaw-this.trailer.yaw))<.77);
    }
    beginSlip(out){
      if(!this.canSlip()||out===this.floating||!out&&!this.canRecover())return false;
      const v=this.skiff;
      const start={x:v.x,y:v.y,z:v.z,yaw:v.yaw,pitch:v.pitch,lean:v.lean};
      this.slip={out,start,time:0};v.vx=v.vz=v.speed=v.yawRate=v.throttle=0;v.wake.length=0;return true;
    }
    stepSlip(dt,env){
      const a=this.slip;if(!a)return;
      const v=this.skiff,home=this.trailer.loadedPose(),water={...this.site.dock.skiff,y:.13},stern=this.capturePoint();
      // The stern floats first, then a short painter draws the boat alongside the pier.
      const mid={...stern,y:.10,yaw:this.trailer.yaw,pitch:-.013};
      if(!a.out&&(this.alda?.ride||this.alda?.cross))return;
      a.time+=dt;const f=Math.min(1,a.time/(a.out?3.65:4.10)),split=a.out?.59:.43;
      const p=f<split?blendPose(a.start,mid,f/split):blendPose(mid,a.out?water:home,(f-split)/(1-split));
      Object.assign(v,p);
      if(f<1)return;
      this.floating=a.out;this.trailer.load=!a.out;this.slip=null;this.rearView=false;
      env.fleet(a.out);if(a.out)BayMarina.moor(v,this.site.dock,1);else {v.dock=null;Object.assign(v,home);}
      env.event(a.out?"launched":"loaded");env.write();
    }
    nearPot(){
      if(!this.floating||this.skiff.dock||this.slip||this.line)return null;
      const v=this.skiff;
      return this.pots.filter(p=>dist(v,p)<5.3).sort((a,b)=>dist(v,a)-dist(v,b))[0]||null;
    }
    lock(p){
      const s=this.saved;
      if(s.catchCount>=40)return "The live box is full. Take it to Benji.";
      if(s.working&&s.marks.includes(p.id))return "That pot is already on this ticket.";
      if(s.working&&this.remaining()[0]!==p.id)return "Next on the ticket · "+(this.mark(this.remaining()[0])?.name||"return to the slip");
      if(!s.working&&s.rests[p.id]>0)return "Let this pot soak. Try another buoy.";
      if(Math.hypot(this.skiff.vx,this.skiff.vz)>2.35)return "Bleed off speed beside the buoy.";
      return "";
    }
    keepers(p,shocks){
      return Math.min(40-this.saved.catchCount,Math.max(2,6+p.index+(this.saved.runs+p.index)%3-Math.min(3,shocks)));
    }
    snag(p,env){
      if(this.nearPot()!==p||this.lock(p))return false;
      const v=this.skiff;Object.assign(v,{speed:0,vx:0,vz:0,yawRate:0,throttle:0});
      this.line={pot:p,v,phase:"haul",close:true,look:v.yaw+2.26,elevation:.36,t:0,lift:0,tension:.17,cool:0,shocks:0,count:this.keepers(p,0),empty:0,
        buoy:{x:p.x,y:.12,z:p.z},potPose:{x:p.x,y:p.bed,z:p.z,yaw:.58+p.index},hook:env.hook(),anchor:{x:v.x,z:v.z}};
      return true;
    }
    stepLine(dt,pulling,time,env){
      const l=this.line;if(!l)return;
      const p=l.pot,v=l.v;l.t+=dt;l.cool=Math.max(0,l.cool-dt);
      l.buoy.y=.12+Math.sin(time*1.65+p.index)*.054;l.hook=env.hook();
      if(l.phase==="haul"){
        const drag=.27+.12*Math.sin(l.lift*13+p.index)+.08*Math.sin(time*1.9);
        l.tension=clamp(l.tension+(pulling&&!l.cool?drag:-.64)*dt,.12,1.05);
        if(l.tension>=1){l.shocks++;l.count=this.keepers(p,l.shocks);l.cool=1.05;l.tension=.74;l.lift=Math.max(0,l.lift-.13);env.event("snag");}
        if(pulling&&!l.cool)l.lift=Math.min(1,l.lift+dt*(.158-.034*l.tension)*(4.4/p.load)**.34);
        if(l.lift>=1){l.phase="empty";l.t=0;}
      }else if(l.phase==="empty"){
        l.empty=Math.min(1,l.t/1.35);l.tension=Math.max(.21,l.tension-dt*.6);
        if(l.empty>=1){l.phase="lower";l.t=0;}
      }else{
        l.lift=Math.max(0,1-l.t/1.7);l.tension=.20;
        if(!l.lift){
          const s=this.saved,count=Math.min(40-s.catchCount,l.count);
          s.catchCount+=count;v.catchCount=s.catchCount;s.rests[p.id]=115;
          if(s.working&&!s.marks.includes(p.id))s.marks.push(p.id);
          this.line=null;v.haul=0;env.event("potted",{p,count});env.write();return;
        }
      }
      const side=ease(l.lift),sway=Math.sin(l.t*2.15+p.index)*.08*Math.sin(Math.PI*side);
      Object.assign(l.potPose,{x:mix(p.x,l.hook.x,side)+sway,z:mix(p.z,l.hook.z,side),y:mix(p.bed,l.hook.y-.72,side)});
      v.haul=l.lift;
    }
    dropLine(){if(!this.line)return false;this.line=null;this.skiff.haul=0;return true;}
    tick(dt){
      this.restTime+=dt;if(this.restTime<1)return;
      const n=Math.floor(this.restTime);this.restTime-=n;for(const p of this.pots)this.saved.rests[p.id]=Math.max(0,this.saved.rests[p.id]-n);
    }
    land(){
      const s=this.saved;if(!this.atYard()||!s.catchCount)return null;
      const count=s.catchCount,signed=s.working&&!this.remaining().length,sheet=s.sheet,pay=count*8+(signed?sheets[sheet].fee:0);
      if(signed){s.working=false;s.marks=[];}s.catchCount=0;s.landed+=count;s.best=Math.max(s.best,count);this.skiff.catchCount=0;
      if(signed){s.runs++;s.last={sheet,count,pay};}return {count,pay,signed,sheet};
    }
    snapshot(){
      const s=this.saved,t=this.trailer,v=this.skiff,tug=t.hitched;
      // A half-wound winch restores to its last secure end, including after pagehide.
      Object.assign(s,{truck:pose(this.truck),trailer:pose(t),tug:tug?pose(tug):null,tugKey:tug?.garageKey||"",floating:this.floating});
      if(!this.slip){s.boat=this.floating?pose(v,true):null;s.dock=v.dock?.id||"";s.side=v.side===-1?-1:1;}
    }
  }
  window.BayButtonwood={Works,read,sheets,pose};
})();
