/* The stock sheet and each title refer to an actual car in the city fleet. */
(() => {
  "use strict";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),kinds=["cayo","marea"];
  const specs={
    cayo:{name:"Cayo 72",color:"#c66b48",price:340,credit:160,base:145,plate:"GULL 72",
      detail:"Long nose, rear drive, a soft rear spring. Malik wants to hear the eight pull cleanly out of the turn.",
      welcome:"My brother used to call the races from the top of one of these. Let's see if this eight still clears its throat.",
      gates:[{x:69.50,z:14.2,yaw:Math.PI,name:"Biscayne pull",ask:"Roll on the throttle down Biscayne.",pace:8},
        {x:49,z:2.48,yaw:-Math.PI/2,name:"Tideway bend",ask:"Turn right onto Tideway. Give it one clean arc.",pace:5.4},
        {x:23.5,z:4.85,yaw:-Math.PI/2,name:"Tideway brake mark",ask:"Stop beside the chalk on the north curb."}]},
    marea:{name:"Marea S",color:"#549baf",price:780,credit:130,base:170,plate:"GULL S",
      detail:"Engine behind the seats, short wheelbase, quick rack. The Marquee Street turn tells you more than the sticker.",
      welcome:"Mid-engine car. You sit almost on the front axle. Turn in once and let the back follow.",
      gates:[{x:74.48,z:60.4,yaw:0,name:"Biscayne run-up",ask:"Join the northbound lane and bring the revs up.",pace:7.3},
        {x:96,z:69.52,yaw:Math.PI/2,name:"Marquee Street turn",ask:"Turn right onto Marquee Street. Track the near lane.",pace:6.1},
        {x:125,z:66.96,yaw:Math.PI/2,name:"Marquee brake mark",ask:"Ease up to the chalk on the south curb."}]}
  };
  const spot=v=>({x:v.x,z:v.z,yaw:Math.atan2(Math.sin(v.yaw),Math.cos(v.yaw))});
  const pose=p=>p&&[p.x,p.z,p.yaw].every(Number.isFinite)&&p.x>=-185&&p.x<=211&&p.z>=-183&&p.z<=420?spot(p):null;
  const integer=(v,max)=>Number.isSafeInteger(v)?clamp(v,0,max):0;
  const keyOK=k=>typeof k==="string"&&/^(?:coupe|hatch|van|cab|cayo|marea)@-?\d{1,3}\.\d{2},-?\d{1,3}\.\d{2}$/.test(k);
  function read(raw){
    const titles=[],sheets={},credit={};
    for(const k of kinds){
      const s=raw?.sheets?.[k];sheets[k]={count:integer(s?.count,99999),best:integer(s?.best,100)};
      credit[k]=raw?.credit?.[k]===true;
    }
    for(const r of (Array.isArray(raw?.titles)?raw.titles:[])){
      const p=pose(r?.spot);
      if(!p||!keyOK(r.key)||!Number.isInteger(r.bay)||r.bay<0||r.bay>2||titles.some(t=>t.key===r.key||t.bay===r.bay))continue;
      titles.push({key:r.key,bay:r.bay,paid:integer(r.paid,5000),meters:Math.max(0,Math.min(1e8,Number(r.meters)||0)),
        spot:p,flatSide:[-1,1].includes(r.flatSide)?r.flatSide:0,front:r.front===true});
      if(titles.length===3)break;
    }
    const l=raw?.loan,p=pose(l?.spot),loan=kinds.includes(l?.kind)&&p?{kind:l.kind,spot:p,ticket:typeof l.ticket==="string"?l.ticket.slice(0,40):"",returning:l.returning===true,
      gate:integer(l.gate,3),grade:integer(l.grade,100),damage:clamp(Number(l.damage)||0,0,5),flatSide:[-1,1].includes(l.flatSide)?l.flatSide:0,front:l.front===true}:null;
    if(loan)loan.trail=Array.isArray(l.trail)?l.trail.slice(-96).map(pose).filter(Boolean):[];
    return {titles,sheets,credit,loan,met:raw?.met===true,rev:integer(raw?.rev,1e9)};
  }
  const still=v=>v&&Math.max(Math.abs(v.speed||0),Math.hypot(v.vx||0,v.vz||0))<1.1;
  function inBay(v,p,loose=false){
    if(!v||!p||!still(v))return false;
    const q=BayDriving.local(p,v.x,v.z);
    return Math.abs(q.x)<(loose?1.42:1.02)&&Math.abs(q.z)<(loose?2.05:1.62)&&Math.abs(Math.cos(v.yaw-p.yaw))>(loose?.79:.89);
  }
  const condition=v=>Object.values(v.damage||{}).reduce((sum,n)=>sum+(Number.isFinite(n)?n:0),0)+(v.flatSide?.7:0);
  function quote(v,r){
    const extra=(v.upgrades?.engine?75:0)+(v.upgrades?.tires?38:0);
    return r.paid?Math.max(20,5*Math.floor((r.paid*.64+extra-condition(v)*28)/5)):0;
  }
  function route(site,kind){
    const pad=site.display[kind],g=specs[kind].gates,p=(x,z)=>({x,z});
    const outward=kind==="cayo"?[pad,p(63.1,pad.z),p(69.5,pad.z-2),g[0],p(69.5,2.48),g[1],g[2]]:
      [pad,p(66.1,pad.z),p(74.48,pad.z+2.8),g[0],p(74.48,69.52),g[1],g[2]];
    const home=kind==="cayo"?[g[2],p(2.48,2.48),p(2.48,69.52),p(69.52,69.52),p(69.52,pad.z),pad]:
      [g[2],p(141.52,69.52),p(141.52,2.48),p(74.48,2.48),p(74.48,pad.z),pad];
    const track=points=>BayCab.track([points[0],...BayMotorCourt.lotPath(points[0],points.slice(1)).path]);
    return {out:track(outward),back:track(home)};
  }
  const actor=(role,name,p)=>({...p,role,name,x:p.x,z:p.z,y:p.y??.077,yaw:p.yaw||0,motion:new BayPlayerMotion(),action:"idle",path:[],seat:0});
  class Lot{
    constructor(site,stock,memory){
      this.site=site;this.stock=stock;this.saved=memory;this.fleet=new Map();this.doors=[0,0,0];
      this.keeper=actor("kitty","Kitty Vega",site.clerk);
      this.assessor=actor("malik","Malik Bell",site.assessor||site.approach);
      this.routes=Object.fromEntries(kinds.map(k=>[k,route(site,k)]));
      this.request=null;this.drive=null;this.reclaim=null;this.exchange=null;this.ambient={age:4,stop:0};this.engaged=false;
      for(const k of kinds){stock[k].stockId=k;stock[k].plate=specs[k].plate;}
    }
    record(v){return v&&this.saved.titles.find(r=>r.key===v.garageKey);}
    bayFor(v){return this.site.stalls.findIndex(p=>inBay(v,p));}
    vacant(){return this.site.stalls.findIndex((p,i)=>!this.saved.titles.some(r=>r.bay===i));}
    price(k){return specs[k].price-(this.saved.sheets[k].count&&!this.saved.credit[k]?specs[k].credit:0);}
    get owned(){return this.site.stalls.map((p,i)=>this.fleet.get(this.saved.titles.find(t=>t.bay===i)?.key)||null);}
    get render(){return {doors:this.doors,owned:this.owned,stock:Object.fromEntries(kinds.map(k=>[k,!this.record(this.stock[k])&&gap(this.stock[k],this.site.display[k])<4]))};}
    pins(){return this.saved.titles.filter(t=>this.fleet.has(t.key)).map(t=>{const v=this.fleet.get(t.key);return {...spot(v),kind:"garage-title",name:BayDriving.cars[v.kind].name+" · Bay "+(t.bay+1),v};});}
    keyFor(v){return !v.stockId||!!this.record(v)||this.engaged&&this.drive?.v===v&&!this.reclaim&&this.drive.phase!=="handoff";}
    remember(v){
      const loan=this.saved.loan,holding=this.drive?.ticket??this.reclaim?.ticket;
      const records=[this.record(v),loan&&loan.kind===v.stockId&&(this.restoring||holding===loan.ticket)&&loan].filter(Boolean);
      for(const r of records){r.spot=spot(v);r.flatSide=v.flatSide||0;r.front=(v.flatAxle||0)>0;}
    }
    restore(cars,env){
      this.restoring=true;this.fleet=new Map(cars.map(v=>[v.garageKey,v]));
      this.saved.titles=this.saved.titles.filter(t=>{const v=this.fleet.get(t.key);return !!v&&!v.guestId&&!v.washGuest&&!v.serviceCar&&!v.recoveryOwner&&!v.meetCar;});
      const restore=(v,r,alternatives)=>{
        const p=[r.spot,...alternatives].find(q=>q&&env.canPark(v,q));
        if(p)Object.assign(v,spot(p));v.path=null;v.used=true;v.flatSide=r.flatSide||0;
        v.flatAxle=v.flatSide?bayCarLayout(v.kind).axles[r.front?1:0]:null;v.flatLoad=v.flatSide?1:0;BayDriving.settle(v);
        if(v.owner){v.owner.displaced=false;v.owner.phase="released";v.owner=null;}this.remember(v);
      };
      for(const t of this.saved.titles){const v=this.fleet.get(t.key);restore(v,t,[this.site.stalls[t.bay],...this.site.stalls,v]);}
      const loan=this.saved.loan;this.restoring=false;if(!loan)return;
      const v=this.stock[loan.kind];if(this.record(v)){this.saved.loan=null;return;}
      this.restoring=true;restore(v,loan,[this.site.display[v.kind],v]);this.restoring=false;const q=env.stand(v,1);
      if(q)Object.assign(this.assessor,q,{y:env.ground(q.x,q.z),yaw:v.yaw});
      if(loan.returning)this.reclaim={v,phase:"approach",retry:0,trail:loan.trail,ticket:loan.ticket};
    }
    register(v,env){
      const bay=this.bayFor(v),used=this.saved.titles.some(r=>r.bay===bay);
      if(!v||bay<0||used||this.record(v)||!env.permitted(v)||!env.current())return false;
      this.saved.titles.push({key:v.garageKey,bay,paid:0,meters:0,spot:spot(v),flatSide:v.flatSide||0,front:(v.flatAxle||0)>0});
      this.saved.met=true;this.saved.rev++;env.persist();env.message("Title filed","Your "+BayDriving.cars[v.kind].name+" has bay "+(bay+1)+".");return true;
    }
    sell(v,env){
      const r=this.record(v);if(!r||!env.current()||this.engaged||this.reclaim?.v===v)return false;
      const parked=v.stockId?inBay(v,this.site.display[v.stockId],true):this.bayFor(v)>=0;
      if(!parked||gap(env.hero,this.site.desk)>3||env.driver())return false;
      const amount=quote(v,r);this.saved.titles.splice(this.saved.titles.indexOf(r),1);this.saved.rev++;
      if(v.stockId)env.releasePermit(v);env.money(amount,false);env.persist();env.message(amount?"Car sold":"Title returned",amount?"Kitty paid $"+amount+" for the "+specs[v.stockId].name+".":"Your Room 14 permit stays with the car.");return true;
    }
    begin(v,kind,env){
      if(this.engaged||this.reclaim||this.exchange||!env.current()||!v?.stockId||!(kind==="buy"||kind==="test"))return false;
      const title=this.record(v),l=this.saved.loan;
      if(l?.returning||kind==="buy"&&(title||this.vacant()<0||env.wallet()<this.price(v.kind)||l)||kind==="test"&&l&&l.kind!==v.kind)return false;
      if(title&&!inBay(v,this.site.display[v.kind],true)&&this.bayFor(v)<0)return false;
      this.saved.met=true;this.engaged=true;this.ambient.age=0;this.assessor.path=[];
      if(kind==="test"&&l&&gap(v,this.site.center)>24){this.resume(v,env);return true;}
      this.request={v,kind,phase:"meet",retry:0};this.keeper.path=[];this.keeper.action="show";
      env.say(this.keeper.name,kind==="buy"?"Come round the driver’s side. Those keys are yours once we sign.":"Meet me at the driver’s door. Malik rides along with the road sheet.");
      env.changed();return true;
    }
    resume(v,env){
      if(!this.saved.loan||this.reclaim||v!==this.stock[this.saved.loan.kind])return false;
      this.engaged=true;this.request=null;this.drive={v,phase:"board",ticket:this.saved.loan.ticket,trail:this.saved.loan.trail||[],gate:this.saved.loan.gate,grade:this.saved.loan.grade,damage:this.saved.loan.damage};
      this.assessor.path=[];this.assessor.seat=0;this.assessor.action="walk";env.changed();return true;
    }
    hand(env){
      const rq=this.request,a=this.keeper;
      if(!rq||rq.phase!=="ready"||gap(env.hero,a)>2.75||env.driver()||this.exchange)return false;
      const place=env.meeting(a,env.hero,rq.v);if(!place)return false;
      this.exchange={from:rq.kind==="return"?env.hero:a,to:rq.kind==="return"?a:env.hero,at:0,path:place,ready:false};
      rq.phase="exchange";env.changed();return true;
    }
    signed(env){
      const rq=this.request;if(!rq)return;const v=rq.v,k=v.kind;
      this.request=null;this.exchange=null;this.keeper.action="idle";this.keeper.path=[];env.hero.motion.reset();
      if(rq.kind==="buy"){
        const price=this.price(k),bay=this.vacant();
        if(!env.current()||bay<0||this.record(v)||price>env.wallet()){this.engaged=false;env.closeDeal();env.message("Gull Street Motors","The quote has changed. Kitty has the current sheet.");return;}
        this.saved.titles.push({key:v.garageKey,bay,paid:price,meters:0,spot:spot(v),flatSide:v.flatSide||0,front:(v.flatAxle||0)>0});
        if(price<specs[k].price)this.saved.credit[k]=true;
        this.saved.rev++;env.money(-price,false);env.persist();this.engaged=false;env.closeDeal();
        env.message(specs[k].name+" · Yours","Bay "+(bay+1)+" is on your key tag. Park here or keep the car out in town.");return;
      }
      if(rq.kind==="return"){
        const s=this.saved.sheets[k],d=this.drive;
        if(!d||!env.current()||d.ticket!=null&&d.ticket!==this.saved.loan?.ticket){this.drive=null;this.engaged=false;env.closeDeal();return;}
        const grade=Math.round(clamp(d.grade,0,100)),pay=specs[k].base+Math.round(grade*.65);
        s.count++;s.best=Math.max(s.best,grade);this.saved.loan=null;this.saved.rev++;this.engaged=false;this.drive=null;
        env.money(pay,true);env.persist();env.closeDeal();env.message("Road sheet signed","$"+pay+" · "+grade+"/100"+(!this.record(v)&&!this.saved.credit[k]?" · Tested price $"+this.price(k):""));
        env.say("Malik Bell",grade>=78?"I can put my name on that sheet. Give the kid the tested price, Kitty.":"That's the run. I've marked the corners we can clean up next time.");return;
      }
      if(!env.current()||this.saved.loan&&this.saved.loan.kind!==k){this.engaged=false;env.closeDeal();return;}
      if(this.saved.loan){this.resume(v,env);return;}
      this.drive={v,phase:"board",trail:[],gate:0,grade:100,damage:condition(v)};this.assessor.path=[];this.assessor.seat=0;this.assessor.action="walk";
      if(!this.record(v)){
        const ticket=Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
        this.drive.ticket=ticket;this.saved.loan={kind:k,spot:spot(v),ticket,trail:this.drive.trail,gate:0,grade:100,damage:condition(v)};this.saved.rev++;
      }
      env.persist();env.say("Malik Bell",specs[k].welcome);env.changed();
    }
    move(a,to,v,dt,env,pace=1.9){
      if(!a.walkDest||gap(a.walkDest,to)>.04){a.path=[];a.retry=0;a.walkDest={x:to.x,z:to.z};}
      if(gap(a,to)<.11){a.action="idle";return true;}
      if(a.retry>0){a.retry-=dt;return false;}
      if(!a.path?.length){a.path=env.walk(a,to,v);if(!a.path?.length){a.retry=.65;return false;}}
      a.action="walk";return BayCarAccess.walkPath(a,a.motion,a.path,dt,env.ground,pace)&&gap(a,to)<.19;
    }
    face(a,p,dt){a.yaw+=turn(a.yaw,Math.atan2(p.x-a.x,p.z-a.z))*Math.min(1,dt*10);}
    passenger(v,dt,env,inward,driver=false){
      const a=this.assessor,side=driver?-1:1;
      if(inward&&a.seat===0){
        const q=env.stand(v,side);if(!q)return false;
        if(!this.move(a,q,v,dt,env,2.55))return false;
        if(!env.door(v,true,a,side))return false;
      }
      if(!inward&&a.seat===1&&!env.door(v,true,a,side))return false;
      a.seat=clamp(a.seat+(inward?dt:-dt)/1.44,0,1);
      BayCarAccess.pose(v,side,a.seat,a,a.motion,env.ground,dt,!driver);a.action=a.seat===1?"ride":"board";
      if(!inward&&!a.seat){a.motion.reset();a.action="idle";a.path=[];}
      return inward?a.seat===1:a.seat===0;
    }
    handStep(dt,env){
      const x=this.exchange,a=this.keeper,p=env.hero;
      if(!x.ready){
        if(!BayCarAccess.walkPath(p,p.motion,x.path,dt,env.ground,2.45))return;
        this.face(p,a,dt);this.face(a,p,dt);
        if(Math.abs(turn(p.yaw,Math.atan2(a.x-p.x,a.z-p.z)))>.065)return;
        p.motion.reset();x.ready=true;
      }
      x.at=clamp(x.at+dt/1.32,0,1);a.action=x.from===a?"give":"receive";if(x.at===1)this.signed(env);
    }
    counterStep(dt,env){
      const rq=this.request,a=this.keeper,v=rq.v;
      const q=rq.kind==="return"?this.site.handover.clerk:env.showSpot(v);
      if(this.exchange){this.handStep(dt,env);return;}
      if(!q)return;
      if(rq.phase==="meet"&&this.move(a,q,v,dt,env,2.0)){rq.phase="ready";a.action=rq.kind==="return"?"counter":"show";env.changed();}
      if(rq.phase==="ready"){this.face(a,gap(env.hero,a)<2.6?env.hero:v,dt);a.motion.step(dt,0,0);}
    }
    trialStep(dt,env){
      const d=this.drive,v=d.v,k=v.kind,a=this.assessor;
      if(d.phase==="board"){
        if(a.seat!==1)this.passenger(v,dt,env,true);
        if(a.seat===1&&env.driver()===v&&!env.transfer()){d.phase=d.gate>=3?"home":"road";env.say(a.name,d.gate>=3?"Kitty's waiting under the gull sign.":specs[k].gates[d.gate].ask);env.changed();}
      }else if(d.phase==="road"||d.phase==="home"||d.phase==="park"){
        if(a.seat===1)BayCarAccess.pose(v,1,1,a,a.motion,env.ground,dt,true);
        if(env.driver()!==v||env.transfer())return;
        env.trace(v,d.trail);
        if(d.phase==="road"){
          const g=specs[k].gates[d.gate],speed=Math.abs(v.speed),near=gap(v,g),heading=Math.abs(turn(v.yaw,g.yaw));
          if(d.gate===0&&v.gear>=2&&v.throttle>.34)d.shifted=true;
          if(d.gate===1&&near<29){d.cornerSlip=Math.max(d.cornerSlip||0,v.slip||0);d.turnLoad=Math.max(d.turnLoad||0,Math.abs(v.yawRate)*speed);}
          if(d.gate===2&&near<17&&d.previousSpeed!=null)d.harshBrake=Math.max(d.harshBrake||0,(d.previousSpeed-speed)/dt);
          d.previousSpeed=speed;
          if(d.gate<2&&near<4.0&&speed>.9&&heading<1.1){
            d.grade-=Math.min(14,Math.abs(speed-g.pace)*1.25+heading*4+(d.gate===1?(d.cornerSlip||0)*9:0));
            if(k==="cayo"&&!d.gate&&!d.shifted)d.grade-=5;
            if(k==="marea"&&d.gate===1&&!(d.turnLoad>1.1))d.grade-=5;
            this.nextGate(env);
          }
        }
      }else if(d.phase==="outside"){
        if(a.seat>0)this.passenger(v,dt,env,false);
        if(!a.seat&&!env.driver()&&!env.transfer()){
          a.path=[];d.phase="receipt";this.request={v,kind:"return",phase:"meet"};this.keeper.path=[];env.changed();
        }
      }
      if(this.saved.loan&&this.saved.loan.ticket===d.ticket){this.saved.loan.gate=d.gate;this.saved.loan.grade=Math.round(clamp(d.grade,0,100));}
    }
    nextGate(env){
      const d=this.drive,gates=specs[d.v.kind].gates;d.gate++;
      if(d.gate>=3){d.phase="home";env.say(this.assessor.name,"That'll do. Back it onto its stripe at Gull Street and I'll sign off.");}
      else env.say(this.assessor.name,gates[d.gate].ask);
      if(this.saved.loan&&this.saved.loan.ticket===d.ticket){this.saved.loan.gate=d.gate;this.saved.loan.grade=Math.round(d.grade);this.remember(d.v);env.persist();}
      env.changed();
    }
    checkStop(env){
      const d=this.drive;if(!d||env.driver()!==d.v||env.transfer())return false;
      const v=d.v,g=specs[v.kind].gates[2];
      if(d.phase==="road"&&d.gate===2&&gap(v,g)<5.5){
        if(!still(v)||Math.abs(turn(v.yaw,g.yaw))>.95){env.message("Brake mark","Stop facing along the curb before Malik takes his reading.");return true;}
        d.grade-=Math.min(12,gap(v,g)*1.9+Math.abs(turn(v.yaw,g.yaw))*4+Math.max(0,(d.harshBrake||0)-9)*.37);this.nextGate(env);return true;
      }
      if(d.phase!=="home"||gap(v,this.site.display[v.kind])>9)return false;
      const pad=this.site.display[v.kind];if(!inBay(v,pad,true)){env.message("Return stripe","Ease the car between its two marks and stop. Either direction fits.");return true;}
      d.grade=clamp(d.grade-Math.max(0,condition(v)-d.damage)*34-gap(v,pad)*1.8-(1-Math.abs(Math.cos(v.yaw-pad.yaw)))*12,0,100);
      d.phase="outside";BayDriving.settle(v);env.say(this.assessor.name,"That's our spot. Give Kitty the keys at the window.");env.changed();return true;
    }
    activeTarget(){
      const rq=this.request,d=this.drive;
      if(rq){const p=rq.kind==="return"?this.site.desk:rq.phase==="meet"?rq.v:this.keeper;return {...p,name:rq.kind==="return"?"Kitty’s key counter":"Kitty at the "+specs[rq.v.kind].name};}
      if(!d)return null;
      if(d.phase==="board")return {...d.v,name:"Driver’s door · "+specs[d.v.kind].name};
      if(d.phase==="road")return {...specs[d.v.kind].gates[d.gate],kind:"road-sheet"};
      return {...this.site.display[d.v.kind],name:specs[d.v.kind].name+" return stripe"};
    }
    guide(){
      const d=this.drive;if(!d||!["road","home"].includes(d.phase))return null;
      const route=this.routes[d.v.kind][d.phase==="road"?"out":"back"],start=route.closest(d.v),target=this.activeTarget(),end=route.closest(target);
      if(start.gap>17||end.at<start.at-4)return null;
      const points=[d.v];for(let at=start.at+4;at<end.at;at+=7)points.push(route.sample(at));points.push(target);
      return {points,meters:Math.max(gap(d.v,target),end.at-start.at),turn:d.phase==="home"?"Return to Gull Street Motors":specs[d.v.kind].gates[d.gate].ask};
    }
    holds(v){return !!v&&(this.drive?.v===v&&["board","outside","receipt"].includes(this.drive.phase)||this.reclaim?.v===v&&this.assessor.seat>0);}
    leave(env){
      const d=this.drive,v=d?.v;this.keeper.path=[];env.hero.motion.reset();this.request=this.exchange=this.drive=null;this.engaged=false;
      if(v){this.assessor.path=[];this.reclaim={v,phase:this.assessor.seat>0?"out":"approach",retry:0,owned:!!this.record(v),trail:d.trail,ticket:d.ticket};
        if(this.saved.loan&&this.saved.loan.ticket===d.ticket){this.saved.loan.returning=true;this.saved.rev++;this.remember(v);}env.persist();}
      env.changed();
    }
    get idleCar(){return this.reclaim?.v||this.drive?.v||null;}
    recoveryStep(dt,env){
      const r=this.reclaim,a=this.assessor,v=r.v;
      if(r.phase==="out"){
        if(!still(v)||env.transfer())return;
        if(this.passenger(v,dt,env,false)){r.phase="approach";a.path=[];}return;
      }
      if(r.phase==="approach"){
        if(r.owned||inBay(v,this.site.display[v.kind],true)){this.recovered(env);return;}
        if(env.driver()===v||env.transfer()?.v===v)return;
        if(this.passenger(v,dt,env,true,true)){r.phase="route";a.path=[];}return;
      }
      if(r.phase==="route"){
        BayCarAccess.pose(v,-1,1,a,a.motion,env.ground,dt);a.action="ride";
        if(env.bringBack(v,r,dt)){BayDriving.settle(v);r.phase="exit";}return;
      }
      if(r.phase==="exit"&&this.passenger(v,dt,env,false,true))this.recovered(env);
    }
    recovered(env){
      if(this.saved.loan&&this.saved.loan.ticket===this.reclaim?.ticket){this.saved.loan=null;this.saved.rev++;}this.reclaim=null;this.assessor.path=[];this.assessor.action="idle";this.assessor.motion.reset();env.persist();env.changed();
    }
    ambientStep(dt,env){
      const a=this.assessor,c=this.ambient,s=this.site;
      const ids=kinds.filter(k=>gap(this.stock[k],s.display[k])<6),choices=[s.assessor||s.approach,...ids.map(k=>env.showSpot(this.stock[k])).filter(Boolean),s.desk];
      const target=choices[c.stop%choices.length];
      if(this.move(a,target,null,dt,env,1.23)){
        const vehicle=ids.map(k=>this.stock[k]).find(v=>gap(v,a)<4);
        a.action=vehicle?"inspect":"idle";this.face(a,vehicle||this.keeper,dt);a.motion.step(dt,0,0);c.age+=dt;
        if(c.age>(vehicle?9:5)){c.age=0;c.stop=(c.stop+1)%choices.length;a.path=[];}
      }
    }
    step(dt,env){
      const v=env.driver();
      if(v){const r=this.record(v);if(r&&!env.transfer())r.meters+=Math.min(55,Math.hypot(v.vx||0,v.vz||0))*dt;}
      BayGullMotors.stepDoors(this.doors,dt,env.subjects());
      if(this.request)this.counterStep(dt,env);
      else if(this.move(this.keeper,this.site.clerk,null,dt,env)){this.keeper.action="counter";this.keeper.yaw=this.site.clerk.yaw;this.keeper.motion.step(dt,0,0);}
      if(this.reclaim)this.recoveryStep(dt,env);
      else if(this.drive)this.trialStep(dt,env);
      else if(!this.engaged&&!this.saved.loan||this.request?.kind==="buy")this.ambientStep(dt,env);
    }
  }
  function marks(model,list,drive){
    if(!drive||drive.phase!=="road")return;
    const stop=drive.gate===2,g=specs[drive.v.kind].gates[drive.gate],name=stop?"gull-chalk-stop":"gull-chalk-gate";
    model(name,mesh=>{
      const chalk=(x,z,w,d)=>mesh.quad([x-w/2,.025,z-d/2],[x+w/2,.025,z-d/2],[x+w/2,.025,z+d/2],[x-w/2,.025,z+d/2],"#f4dc95",1);
      for(const k of [-1,1]){
        for(const j of (stop?[-1,1]:[0])){chalk(k*1.46,j*1.9,.095,.69);chalk(k*1.24,j*(1.9+.31),.53,.095);}
        if(stop)chalk(k*.75,2.22,.48,.082);
      }
    });
    list.push([name,g.x,.042,g.z,g.yaw]);
  }
  function mapPeople(ctx,opt,px,py,s,visible,t){
    const lot=opt.dealerCrew;if(!lot)return;
    if(opt.mode!=="street"){
      for(const p of lot.pins())if((!opt.countyChart||p.z>158)&&!opt.marina?.bayChart&&visible(px(p.x),py(p.z))){
        const x=px(p.x),y=py(p.z),zoom=opt.mode==="radar"?.84:1;ctx.save();ctx.translate(x,y);ctx.scale(zoom,zoom);
        ctx.fillStyle="#234a54";ctx.strokeStyle="#efcf7e";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(0,0,5.2,0,Math.PI*2);ctx.fill();ctx.stroke();
        ctx.fillStyle="#fff0c6";ctx.textAlign="center";ctx.font="bold 8px sans-serif";ctx.fillText(String(lot.record(p.v).bay+1),0,2.8);ctx.restore();
      }return;
    }
    const d=lot.drive;if(d?.phase==="road"){
      const g=specs[d.v.kind].gates[d.gate];ctx.save();ctx.translate(px(g.x),py(g.z));ctx.rotate(g.yaw);
      ctx.strokeStyle="#e7cd86";ctx.lineWidth=Math.max(.9,.09*s);ctx.setLineDash([s*.47,s*.28]);
      if(d.gate===2)ctx.strokeRect(-s*1.39,-s*2.22,s*2.78,s*4.44);
      else{ctx.beginPath();ctx.moveTo(-s*1.6,0);ctx.lineTo(s*1.6,0);ctx.stroke();}ctx.restore();
    }
    for(const p of opt.gullPeople||[])if(visible(px(p.a.x),py(p.a.z),4*s))BayDealerPeople.map(ctx,opt,px,py,s,p.a,t,p.opts.action,p.opts);
  }
  window.BayGullSales={marks,mapPeople,Lot,specs,kinds,read,pose,inBay,quote,condition,route};
})();
