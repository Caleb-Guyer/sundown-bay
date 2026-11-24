/* A two-person location run. The driver, car, passenger door and exposed frames all stay in the city. */
(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const mark=(x,z,dir,name)=>({x,z,dir,yaw:dir*Math.PI/2,name,stand:{x:x+3.3*Math.cos(dir*Math.PI/2),z:z-3.3*Math.sin(dir*Math.PI/2)}});
  const briefs=[
    {id:"luna",title:"The Saturday double",subject:"Cine Luna marquee",point:BayNightMeet.marquee,range:43,ideal:15,pay:125,
      lead:mark(2.48,16,0,"Neon Mile"),end:mark(5.05,60,0,"Cine Luna, north curb"),line:"When I was little, the ticket lady would wave me through if the first reel had already started.",call:"Yellow bulbs on the passenger side. Get the whole name in."},
    {id:"marlin",title:"Vacancy in pink",subject:"Marlin rooftop sign",point:{x:129.1,y:15.5,z:-45},range:52,ideal:23,pay:145,
      lead:mark(141.52,-16,2,"Ocean Drive"),end:mark(138.95,-63,2,"Marlin Motel, south curb"),line:"That sign lit up the curtains in fourteen. Even with your eyes closed you knew when the V went out.",call:"Up on the right. Vera finally got that last letter lit."},
    {id:"wheel",title:"Eight cars over the water",subject:"Coast Wheel",point:BayCoastWheelArt.centre,range:75,ideal:42,pay:160,
      lead:mark(146.48,82,0,"North Boardwalk"),end:mark(149.05,134,0,"North Boardwalk rail"),line:"Mags says the blue cabin has the best view. From the ground I always liked the red one.",call:"Right window, over the roofs. Watch the cabins come around."}
  ];
  const places=[
    {id:"luna",road:["I used to take that corner in the motel shuttle. Whole back row would slide left.","I waited three afternoons for the L in Luna to light up. Had my finger on the shutter when it did."],
      here:"They still put the next double bill in the little case by the doors.",again:"Same curb as last time. Check the case and see what’s playing."},
    {id:"wheel",road:["Mags used to give the motel one free ticket a month. Front desk had to draw straws.","There’s one blue cabin with a white door. You can pick it out all the way from Ocean."],
      here:"There’s the ticket window. I’ll walk up with you.",again:"I can see the blue cabin from here this time."},
    {id:"flowers",road:["Bea kept fresh flowers in the Marlin lobby even when the upstairs was empty.","Bea wraps the stems in yesterday’s sports page. She saves me the movie listings."],
      here:"Look at those buckets. Bea must’ve had a delivery this morning.",again:"Bea’s got a different bunch out front today."},
    {id:"marlin",road:["I used to count the lit windows from this block to see how much work was waiting.","My dad knew which rooms had a view of the sign. Always asked for fourteen."],
      here:"There’s the Marlin. I left room for the cab.",again:"Back at the Marlin. Feels like we just went around the block."}
  ].map(p=>({...p,stop:BayCab.stops[p.id],title:BayCab.stops[p.id].name}));
  class Run extends BayCab.StreetDriver{
    constructor(v,brief,pickup,start,path,seated){
      super(v);this.brief=brief;this.pickup=pickup;this.location=start;this.driverPath=path;this.driverSeat=seated?1:0;
      this.phase=seated?"calling":"driver-walk";this.seat=0;this.path=[];this.best=null;this.passes=0;this.early=false;
    }
    get held(){return ["approach","in","ride","park","out"].includes(this.phase);}
    get social(){return !!this.brief.stop;}
    get target(){
      if(this.held&&this.social)return {...(this.early&&this.leg?.end||this.brief.stop),name:this.early?"Next curb":this.brief.title};
      if(this.held)return {x:this.brief.point.x,z:this.brief.point.z,name:this.brief.subject};
      if(this.phase==="ready")return {x:this.vehicle.x,z:this.vehicle.z,name:"Passenger door"};
      return {...this.pickup.stand,name:"Meet your driver"};
    }
    call(){
      if(gap(this.vehicle,this.pickup)<4.2&&Math.cos(this.vehicle.yaw-this.pickup.yaw)>.8){this.phase="ready";return;}
      this.phase="collect";this.leg=this.newLeg(BayCab.route({...this.location,x:this.vehicle.x,z:this.vehicle.z},this.pickup),this.pickup);
    }
    board(actor,plan){
      if(this.phase!=="ready"||gap(actor,this.vehicle)>9||!plan)return false;
      this.path=plan.points;this.phase="approach";return true;
    }
    roll(){
      const start={...this.location,x:this.vehicle.x,z:this.vehicle.z},b=this.brief,end=this.berth(this.social?b.stop:b.end,this.vehicle);
      let road;
      if(this.social)road=BayCab.route(start,end);
      else{
        const first=gap(start,b.lead)>2?BayCab.route(start,b.lead).pts:[start];
        road=BayCab.track(first.concat(BayCab.route(b.lead,end).pts.slice(1)));
      }
      this.leg=this.newLeg(road,end);this.phase="ride";this.passes++;this.cued=false;this.spoke=false;
    }
    pullOver(curb){
      if(this.phase==="park"){this.phase="out";return true;}
      if(this.phase!=="ride"||this.early||!this.leg)return false;
      const l=this.leg;
      for(let d=l.at+15;d<Math.min(l.route.length-8,l.at+120);d+=2){
        const q=l.route.sample(d),cs=Math.cos(q.yaw),sn=Math.sin(q.yaw);
        const side={x:q.x+cs*2.57,z:q.z-sn*2.57},stop=curb(side);
        if(!stop||gap(side,stop)>1||Math.cos(q.yaw-stop.yaw)<.997)continue;
        const laneClear=[3,6,9].every(back=>{
          const a=l.route.sample(d-back);
          if(Math.cos(a.yaw-q.yaw)<.995)return false;
          const shoulder={x:a.x+cs*2.57,z:a.z-sn*2.57},s=curb(shoulder);
          return s&&gap(shoulder,s)<1;
        });
        if(!laneClear)continue;
        l.farEnd=l.end;l.stopAt=d;l.end=stop;this.early=true;return true;
      }
      this.early=true;return true;
    }
    step(dt,env,emit){
      const v=this.vehicle,p=env.driver,m=p.motion,phase=this.phase;
      if(phase==="driver-walk"){
        if(BayCarAccess.walkPath(p,m,this.driverPath,dt,env.ground,2.24))this.phase="driver-in";
      }else if(phase==="driver-in"){
        this.driverSeat=Math.min(1,this.driverSeat+dt/1.47);BayCarAccess.pose(v,-1,this.driverSeat,p,m,env.ground,dt);
        if(this.driverSeat===1){this.call();emit("driver-in");}
      }else {
        if(phase==="calling")this.call();
        if(this.phase==="collect"&&(this.drive(dt,env)||env.settle(this))){this.phase="ready";emit("ready");}
        if(phase==="approach"&&BayCarAccess.walkPath(env.hero,env.motion,this.path,dt,env.ground))this.phase="in";
        if(phase==="in"||phase==="out"){
          this.seat=Math.max(0,Math.min(1,this.seat+(phase==="in"?1:-1)*dt/1.50));
          BayCarAccess.pose(v,1,this.seat,env.hero,env.motion,env.ground,dt,true);
          if(phase==="in"&&this.seat===1){this.roll();emit("boarded");}
          if(phase==="out"&&!this.seat){this.phase="done";emit("done");}
        }
        if(phase==="ride"){
          if(this.leg.stopAt&&this.leg.block>2.5&&this.leg.space<.3){
            this.leg.end=this.leg.farEnd;delete this.leg.stopAt;this.leg.passUntil=0;
            this.early=false;this.pullOver(env.curb);
          }
          const remaining=this.leg.route.length-this.leg.at;
          this.leg.pace=this.social?13.7:remaining<85?5.6:14;
          if(!this.spoke&&this.leg.at>8){this.spoke=true;emit("road");}
          if(!this.social&&!this.cued&&remaining<75&&gap(v,this.brief.point)<this.brief.range+18){this.cued=true;emit("mark");}
          if(this.drive(dt,env)||env.settle(this)){this.phase="park";emit("stopped");}
        }
        if(this.phase==="park"&&this.early&&env.exitClear(v))this.phase="out";
        if(this.phase==="ride"||this.phase==="park")BayCarAccess.pose(v,1,1,env.hero,env.motion,env.ground,dt,true);
        BayCarAccess.pose(v,-1,1,p,m,env.ground,dt);
      }
    }
  }
  const key="sundownBay.windowNegatives.v1",filmTitle="Through the Passenger Window";
  class Negatives{
    constructor(){this.frames={};this.reel=null;this.stored=true;this.refresh();}
    refresh(){
      let disk;try{disk=JSON.parse(localStorage.getItem(key));}catch{}
      for(const b of briefs){const r=disk?.[b.id];if(BaySecondUnit.record(r)&&r.title===b.subject&&r.score>(this.frames[b.id]?.score||0))this.frames[b.id]=r;}
      this.reel=briefs.every(b=>this.frames[b.id])?briefs.map(b=>this.frames[b.id]):null;
    }
    keep(b,r){
      this.refresh();if(!BaySecondUnit.record(r)||r.title!==b.subject||r.score<=(this.frames[b.id]?.score||0))return;
      this.frames[b.id]=r;this.reel=briefs.every(b=>this.frames[b.id])?briefs.map(b=>this.frames[b.id]):null;
      try{localStorage.setItem(key,JSON.stringify(this.frames));this.stored=true;}catch{this.stored=false;}
    }
  }
  window.BayWindowSeat={briefs,places,Run,Negatives,key,filmTitle};
})();
