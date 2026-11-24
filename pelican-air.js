/* Fern 3 flies a scheduled mail circuit. The pilot and the player use the same airframe. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
  const ease=(a,b,k,dt)=>mix(a,b,-Math.expm1(-k*dt)),angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),other=id=>id==="marlin"?"key":"marlin";
  const letters={marlin:[
    ["Tide corrections","Tali’s pencilled depth changes for the island supply launch.","Those soundings save my launch a long walk home."],
    ["The Saturday playbill","Walt sent the island its own copy of the Cine Luna program.","Front and center on the noticeboard. Tell Walt the matinee has an audience."],
    ["June’s seven-inch","A test pressing in a striped sleeve, addressed to the keeper.","She signed the label! That one stays on the porch turntable."]],
    key:[["Lightkeeper’s ledger","A month of lamp readings, bound for the city harbor office.","All thirty entries. The harbor office can close its books."],
    ["A seat for Liv","Liv’s handwritten film-club order for the Cine Luna box office.","Two aisle seats for Liv. I’ll leave the tickets with Walt."],
    ["Mangrove study","Pressed leaves from the key for a class on Ocean Drive.","Still flat. The kids will be able to see every vein."]]};
  const site=id=>BayGullKey.sites.find(s=>s.id===id);
  const integer=(n,max)=>Number.isSafeInteger(n)?clamp(n,0,max):0;
  const readTrail=v=>Array.isArray(v)?v.slice(0,80).filter(q=>Array.isArray(q)&&q.length===2&&q.every(x=>Number.isInteger(x)&&Math.abs(x)<=600)):[];
  const modes=["pilot","passenger","shared","skiff","shore"];
  function read(raw){
    const count={},landing={},logs={};
    for(const id of ["marlin","key"]){
      count[id]=integer(raw?.count?.[id],99999);landing[id]=integer(raw?.landing?.[id],100);
      const v=raw?.logs?.[id];
      if(v&&Number.isInteger(v.number)&&v.number>=0&&v.number<3&&modes.includes(v.mode)){
        const trail=readTrail(v.trail);
        logs[id]={number:v.number,mode:v.mode,grade:integer(v.grade,100),pay:integer(v.pay,400),trail};
      }
    }
    const bag=["marlin","key"].includes(raw?.bag)?raw.bag:null;
    const progress=bag&&raw?.progress?.from===bag?raw.progress:null;
    const route=progress?{from:bag,trail:readTrail(progress.trail),grade:integer(progress.grade,100),mode:modes.includes(progress.mode)?progress.mode:"shore"}:null;
    return {bag,count,landing,logs,progress:route,rides:integer(raw?.rides,99999),island:raw?.island===true};
  }
  function fresh(s){
    return {...s.berth,y:0,kind:"floatplane",speed:0,vx:0,vz:0,vy:0,throttle:0,pitch:0,bank:0,
      steer:0,elevator:0,yawRate:0,airborne:false,onWater:true,door:1,engine:0,prop:0,wake:0,
      airTime:0,waterTime:0,lastGrade:null,skip:0,rough:0};
  }
  function tickPlane(p,dt,controls,env){
    const ground=!p.airborne,oldVy=p.vy;
    const thrust=clamp(controls.power||0,-1,1),lift=clamp(controls.lift||0,-1,1);
    p.throttle=clamp(p.throttle+thrust*dt*.81,0,1);p.engine=ease(p.engine,1,3,dt);
    p.prop=(p.prop+dt*(13+54*p.throttle)*p.engine)%(Math.PI*2);
    let turn=clamp(controls.turn||0,-1,1);
    if(!ground&&(p.x< -173||p.x>422||p.z< -171||p.z>335)){
      const home=Math.atan2(112-p.x,56-p.z),error=angle(p.yaw,home);
      if(Math.abs(error)>.36)turn=clamp(error*1.7,-1,1);
    }
    p.elevator=ease(p.elevator,lift,5.4,dt);p.steer=ease(p.steer,turn,5,dt);
    const target=ground?thrust<0&&p.throttle<.01?-2.1:p.throttle*25.9:7.6+p.throttle*24.7+Math.max(-4,Math.sin(p.pitch)*6.5);
    const acceleration=ground?target<p.speed?(thrust<0?8.8:4.4):4.85:target<p.speed?3.7:4.9;
    p.speed+=clamp(target-p.speed,-acceleration*dt,acceleration*dt);
    p.bank=ease(p.bank,ground?.025*p.steer:p.steer*.76,ground?4.3:2.85,dt);
    const rate=ground?p.steer*(p.speed<-.35?-.85:1)*clamp(1.24-Math.max(0,p.speed-3)*.045,.42,1.24):p.bank*(1.53-.014*p.speed);
    p.yawRate=ease(p.yawRate,rate,ground?3.8:4.1,dt);p.yaw+=p.yawRate*dt;
    p.vx=Math.sin(p.yaw)*p.speed;p.vz=Math.cos(p.yaw)*p.speed;
    const nx=p.x+p.vx*dt,nz=p.z+p.vz*dt;
    if(ground){
      p.waterTime+=dt;p.airTime=0;
      if(!env.water(nx,nz,p.yaw)&&Math.abs(p.speed)>.05){
        const hard=p.speed>10;p.speed=p.vx=p.vz=0;p.throttle=0;if(hard)return "grounded";
      }else{p.x=nx;p.z=nz;}
      p.wake=ease(p.wake,clamp(Math.abs(p.speed)/16,0,1),3,dt);
      p.pitch=ease(p.pitch,-.014-.065*clamp(p.speed/15,0,1)-.055*Math.max(0,p.elevator),4.7,dt);
      p.y=.045+.030*Math.sin(env.time*2.05+p.x*.09)+.016*Math.sin(env.time*1.37+p.z*.08);
      p.skip=Math.max(0,p.skip-dt);
      if(!p.skip&&p.speed>=12.2&&p.elevator>.32){
        p.airborne=true;p.onWater=false;p.vy=1.38;p.lastGrade=null;p.waterTime=0;return "lift";
      }
    }else{
      p.x=nx;p.z=nz;p.airTime+=dt;p.wake=ease(p.wake,0,2.5,dt);
      const stall=clamp((12.3-p.speed)/4.7,0,1),upper=clamp((83-p.y)/8,0,1);
      let vertical=p.elevator*(p.elevator>=0?8.8*upper:8.1)-stall*5.0-Math.abs(p.bank)*.36;
      if(p.y>83)vertical=Math.min(vertical,81-p.y);
      p.vy=ease(p.vy,vertical,1.92,dt);p.y=Math.max(0,p.y+p.vy*dt);
      p.pitch=ease(p.pitch,-Math.atan2(p.vy,Math.max(8,p.speed))-.042*p.elevator+.073*stall,3.2,dt);
      if(p.y<57&&env.obstacle(p.x,p.z,p.y,p.yaw))return "grounded";
      if(p.y<=.075&&p.vy<=0){
        if(!env.water(p.x,p.z,p.yaw))return "grounded";
        const sink=Math.max(0,-oldVy),bank=Math.abs(p.bank),grade=Math.round(clamp(102-Math.max(0,sink-.8)*7-bank*38-Math.max(0,p.speed-16)*1.15,15,100));
        p.lastGrade=grade;p.rough=grade<55?1:0;p.skip=.85;p.y=.045;p.vy=0;p.airborne=false;p.onWater=true;
        p.speed*=grade<55?.70:.91;p.waterTime=0;return "touch";
      }
    }
    return "";
  }
  // The outbound pass follows Ocean Drive. The return comes down the open north side of the Marlin jetty.
  const circuits={
    key:[[292,49,28],[243,113,36],[161,122,38],[109,68,43],[138,-8,41],
      [221,-61,35],[305,-104,32],[373,-112,25],[404,-86,18],[413,-61,12],[400,-39.55,7]],
    marlin:[[245,-61,26],[155,-52,38],[111,13,44],[137,98,39],[187,138,32],[225,121,23],[227,83,15]]
  };
  function arrival(id){
    const s=site(id),yaw=id==="key"?-Math.PI/2:Math.PI,dx=Math.sin(yaw),dz=Math.cos(yaw);
    return {dx,dz,buoy:{x:s.berth.x-dx*33,z:s.berth.z-dz*33},outer:{x:s.berth.x-dx*72,z:s.berth.z-dz*72}};
  }
  class Line{
    constructor(memory){
      this.saved=memory;this.at="marlin";this.to="key";this.plane=fresh(site("marlin"));
      this.phase="dock";this.clock=0;this.leg=0;this.reserved=null;this.player=null;this.transfer=null;
      this.inside=false;this.pan=0;this.tilt=0;this.pending=null;this.journey=null;this.print=null;
      this.bagTrack=memory.progress?.trail||[];this.bagMode=memory.progress?.mode||"shore";this.bagGrade=memory.progress?.grade||0;this.layover=false;
    }
    get aboard(){return !!(this.player||this.transfer);}
    get manual(){return this.player?.control==="player"&&!this.transfer;}
    get dock(){return site(this.at);}
    get target(){return site(this.to);}
    get mailTo(){return this.saved.bag&&site(other(this.saved.bag));}
    leaflet(from=this.saved.bag){return from?letters[from][this.saved.count[from]%3]:null;}
    nearDesk(p){return BayGullKey.sites.find(s=>gap(p,s.desk)<2.7);}
    flag(s,role){this.reserved={id:s.id,role};}
    listen(s){return this.phase==="dock"&&this.at===s.id;}
    seatRole(){return (this.player||this.transfer)?.seat||"guest";}
    board(hero,role){
      if(this.aboard||this.phase!=="dock"||gap(hero,this.dock.exit)>3.25)return false;
      const seat=role==="pilot"?"pilot":"guest";this.layover=false;this.transfer={in:true,t:0,from:{x:hero.x,y:hero.y,z:hero.z,yaw:hero.yaw},seat};
      this.reserved=null;this.clock=0;this.pan=this.tilt=0;return true;
    }
    alight(){
      if(!this.player||this.transfer||this.phase!=="dock")return false;
      this.transfer={in:false,t:1,seat:this.player.seat};this.clock=0;return true;
    }
    depart(){
      if(this.phase!=="dock"||this.transfer)return false;
      this.phase="depart";this.upHeading=this.dock.berth.yaw;this.clock=0;this.leg=0;this.layover=false;this.to=other(this.at);this.plane.door=0;this.plane.lastGrade=null;
      this.journey={from:this.at,flown:false,manual:false,grade:0};return true;
    }
    controls(){
      if(!this.player||this.transfer||this.phase==="moor"||this.phase==="rescue")return false;
      const takeover=!this.manual;this.player.control=takeover?"player":"nani";
      if(!takeover&&this.phase!=="dock"){
        if(this.plane.airborne){const pts=circuits[this.to];this.leg=pts.reduce((best,q,i)=>gap(this.plane,{x:q[0],z:q[1]})<gap(this.plane,{x:pts[best][0],z:pts[best][1]})?i:best,0);this.phase="circuit";}
        else {this.phase="chooseWater";this.clock=0;}
      }
      return true;
    }
    berthNear(){
      const p=this.plane;if(p.airborne||Math.abs(p.speed)>3.15)return null;
      return BayGullKey.sites.find(s=>gap(p,s.berth)<5.2);
    }
    tie(s){
      if(!s||this.phase==="dock"||this.phase==="moor")return false;
      const p=this.plane;this.phase="moor";this.clock=0;this.moorFrom={x:p.x,z:p.z,yaw:p.yaw};
      p.speed=p.vx=p.vz=p.throttle=0;this.at=s.id;return true;
    }
    load(s){
      if(this.saved.bag||this.pending||this.aboard)return false;
      this.pending={site:s,kind:"load",time:0};return true;
    }
    sign(s){
      if(!this.saved.bag||this.mailTo!==s||this.pending||this.aboard)return false;
      this.pending={site:s,kind:"sign",time:0};return true;
    }
    abandon(){this.saved.progress=null;this.saved.bag=null;this.pending=null;this.bagTrack=[];this.bagMode="shore";this.bagGrade=0;}
    receiptInProgress(){return this.saved.bag?{from:this.saved.bag,trail:this.bagTrack,mode:this.bagMode,grade:this.bagGrade}:null;}
    trace(p,mode){
      if(!this.saved.bag)return;
      if(mode==="pilot"||mode==="passenger"){
        if(this.bagMode!=="shared"&&this.bagMode!==mode)this.bagMode=["pilot","passenger"].includes(this.bagMode)?"shared":mode;
      }else if(mode==="skiff"&&this.bagMode==="shore")this.bagMode=mode;
      const trail=this.bagTrack,at=[Math.round(p.x),Math.round(p.z)],last=trail.at(-1);
      if(last&&Math.hypot(at[0]-last[0],at[1]-last[1])<7)return;
      if(trail.length===79)this.bagTrack=trail.filter((_,i)=>i%2===0);
      this.bagTrack.push(at);
    }
    stamp(env){
      const job=this.pending;if(!job)return;const s=job.site;
      if(job.kind==="load"){this.saved.bag=s.id;this.bagTrack=[];this.bagMode="shore";this.bagGrade=0;this.trace(s.desk,"shore");env.event("bag",s);}
      else{
        const from=this.saved.bag;if(!from||other(from)!==s.id){this.pending=null;return;}
        this.trace(s.desk,"shore");const number=this.saved.count[from]%3,mode=this.bagMode;
        const grade=mode==="pilot"||mode==="shared"?this.bagGrade:0,pay=125+(grade>=75?45:grade>0?20:0);
        this.print={number,mode,grade,pay,trail:this.bagTrack.slice()};this.saved.logs[from]=this.print;this.saved.count[from]++;
        this.saved.bag=null;this.bagTrack=[];this.bagGrade=0;this.bagMode="shore";env.event("signed",{from,slip:this.print});
      }
      this.pending=null;
    }
    clearRun(yaw,length,env){
      const p=this.plane,dx=Math.sin(yaw),dz=Math.cos(yaw);
      for(let d=1.5;d<length;d+=1.8)if(!env.water(p.x+dx*d,p.z+dz*d,yaw))return false;
      return true;
    }
    automatic(env){
      const p=this.plane,course=circuits[this.to],s=this.target,a=arrival(this.to);
      let point,alt=27,pace=21;
      if(this.phase==="chooseWater"){
        const range=gap(p,s.berth),bearing=Math.atan2(s.berth.x-p.x,s.berth.z-p.z);
        if(range<85&&this.clearRun(bearing,range,env))this.phase="taxi";
        else{
          let best=-Infinity;this.upHeading=p.yaw;
          for(let i=0;i<16;i++){
            const h=p.yaw+i*Math.PI/8;
            const clear=[9,23,43].reduce((n,d)=>n+Number(this.clearRun(h,d,env)),0);
            const score=clear*8+Math.cos(h-p.yaw)+.31*Math.cos(h-bearing);
            if(score>best){best=score;this.upHeading=h;}
          }
          this.phase="lineup";
        }
      }
      if(this.phase==="lineup"){
        const error=angle(p.yaw,this.upHeading);
        if(Math.abs(error)<.14&&Math.abs(p.speed)<3.1)this.phase="depart";
        return {power:p.throttle>.005?-1:0,lift:0,turn:clamp(error*1.8-p.yawRate*.42,-1,1)};
      }
      if(this.phase==="depart"){
        const h=this.upHeading??this.dock.berth.yaw;
        if(!p.airborne)return {power:p.throttle<.96?1:0,lift:1,turn:clamp(angle(p.yaw,h)*1.8-p.yawRate*.35,-1,1)};
        point={x:p.x+Math.sin(h)*40,z:p.z+Math.cos(h)*40};alt=22;
        if(p.y>10||p.airTime>4.5){this.phase="circuit";this.leg=0;}
      }else if(this.phase==="circuit"){
        const q=course[this.leg];point={x:q[0],z:q[1]};alt=q[2];pace=this.leg>=course.length-3?15.2:21;
        if(gap(p,point)<(this.leg===course.length-1?11:16)){if(++this.leg>=course.length){this.phase="final";this.leg=course.length-1;}}
      }else if(this.phase==="final"){
        const ahead=(s.berth.x-p.x)*a.dx+(s.berth.z-p.z)*a.dz;
        point={x:s.berth.x-a.dx*Math.max(0,ahead-24),z:s.berth.z-a.dz*Math.max(0,ahead-24)};
        alt=Math.max(-1.8,(ahead-32)*.16);pace=14;
        if(!p.airborne)this.phase="taxi";
        else if(ahead<9&&p.y>1.4){this.phase="circuit";this.leg=course.length-3;}
      }else{
        const range=gap(p,s.berth);point=s.berth;alt=0;pace=Math.min(7,Math.max(1.1,range*.38));
        if(range<4.65&&Math.abs(p.speed)<3.05){this.tie(s);return {power:-1,lift:0,turn:0};}
      }
      const bearing=Math.atan2(point.x-p.x,point.z-p.z),error=angle(p.yaw,bearing);
      if(!p.airborne&&Math.abs(error)>.37)pace=Math.min(pace,Math.max(.7,4.0-Math.abs(error)*1.3));
      const want=clamp(p.airborne?(pace-7.6)/24.7:pace/25.9,0,1);
      return {power:clamp((want-p.throttle)*4,-1,1),turn:clamp(error*(p.airborne?2.05:1.6)-p.yawRate*.34,-1,1),
        lift:clamp((alt-p.y)*.19-p.vy*.105,-1,1)};
    }
    step(dt,input,env){
      this.clock+=dt;const p=this.plane;
      if(this.pending){
        if(gap(env.hero,this.pending.site.desk)>3.05)this.pending=null;
        else if((this.pending.time+=dt)>=1.24)this.stamp(env);
      }
      if(this.transfer){
        const a=this.transfer;a.t=clamp(a.t+(a.in?1:-1)*dt/1.64,0,1);
        env.boardPose(this,a);
        if(a.in&&a.t===1){this.player={seat:a.seat,control:a.seat==="pilot"?"player":"nani"};this.inside=a.seat==="guest";this.clock=0;this.transfer=null;env.event("seated");}
        else if(!a.in&&a.t===0){this.player=this.transfer=null;this.inside=false;this.clock=0;env.event("left",this.dock);}
        return;
      }
      if(this.phase==="rescue"){
        if(this.clock<2.0)return;
        const occupied=!!this.player;Object.assign(p,fresh(this.dock));this.phase="dock";this.clock=0;this.inside=false;this.journey=null;this.player=null;
        if(occupied)env.event("rescued",this.dock);return;
      }
      if(this.phase==="moor"){
        const b=this.dock.berth,f=clamp(this.clock/1.45,0,1),u=f*f*(3-2*f),start=this.moorFrom;
        p.x=mix(start.x,b.x,u);p.z=mix(start.z,b.z,u);p.yaw=start.yaw+angle(start.yaw,b.yaw)*u;
        p.bank=ease(p.bank,0,4,dt);p.pitch=ease(p.pitch,0,3,dt);p.wake=ease(p.wake,0,4,dt);p.door=clamp((f-.55)*2.3,0,1);
        if(f===1){
          this.phase="dock";this.clock=0;this.layover=!!this.player;this.to=other(this.at);
          if(this.player&&this.journey?.flown&&this.journey.from!==this.at){
            this.saved.rides++;if(this.journey.manual&&this.journey.grade>0){
              this.saved.landing[this.at]=Math.max(this.journey.grade,this.saved.landing[this.at]);if(this.mailTo===this.dock)this.bagGrade=this.journey.grade;
            }
            env.event("arrived",this.dock);
          }
          this.journey=null;
        }
      }else if(this.phase==="dock"){
        p.engine=ease(p.engine,this.player?.control==="player"?.35:0,3,dt);p.prop+=p.engine*dt*16;
        p.door=ease(p.door,1,5,dt);p.y=.045+.022*Math.sin(env.time*1.7);
        if(!this.player&&this.clock>56&&(!this.reserved||this.reserved.id!==this.at)){this.depart();}
        else if(this.player&&(this.manual&&input.power>0||!this.manual&&!this.layover&&this.clock>3.4))this.depart();
      }else{
        const controls=this.manual?input:this.automatic(env);
        if(this.phase!=="moor"){
          const event=tickPlane(p,dt,controls,env);
          if(event==="grounded"){
            this.phase="rescue";this.clock=0;if(this.player){this.bagGrade=0;env.event("rescue");}
          }else if(event==="lift"){if(this.journey){this.journey.flown=true;this.journey.grade=0;this.journey.manual=false;}if(this.player)env.event("lift");}
          else if(event==="touch"){if(this.journey){this.journey.grade=this.manual?p.lastGrade:0;this.journey.manual=!!this.manual;}
            if(!this.manual)this.phase="taxi";if(this.player)env.event("touch",p.lastGrade);}
          if(this.player&&p.airborne){this.trace(p,this.manual?"pilot":"passenger");}
        }
      }
      if(this.player)env.seatedPose(this);
    }
  }
  window.BayPelicanAir={read,Line,letters,site,other,arrival,circuits,tickPlane};
})();
