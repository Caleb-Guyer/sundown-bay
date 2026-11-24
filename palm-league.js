/* The chalk card belongs to the Palm. Its regulars come from the existing sidewalk cast. */
(() => {
  "use strict";
  const ids=["luz","val","boone"],data={
    luz:{name:"Luz",place:"Palm Diner",skill:.47,hello:"I put a dime under that back foot in '98. Table's played straight ever since.",ride:"I leave the long shots for folks with longer arms.",win:"See that? You left yourself a second shot. That's the part worth learning."},
    val:{name:"Val",place:"Cine Luna",skill:.70,hello:"I can get away between shows. Pull around to the curb and I'll bring the blue chalk.",ride:"Luz taught me bank shots with a film can on her kitchen table. The can didn't roll straight either.",win:"That one belongs on the board. Give me the chalk, I'll write it."},
    boone:{name:"Boone",place:"Port Sol",skill:.87,hello:"Got my boots and my chalk. If you're headed to the Palm, I'll take the passenger side.",ride:"That table came through Pier Three. We got it through the door with half an inch left.",win:"Clean as a whistle. Leave my name up there. I'll want another crack."}
  };
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),point=(x,z)=>({x,z});
  const count=n=>Number.isSafeInteger(n)?clamp(n,0,999999):0,unit=n=>Number.isFinite(n)?clamp(n,0,1):0;
  const still=v=>v&&Math.max(Math.abs(v.speed||0),Math.hypot(v.vx||0,v.vz||0))<.86;
  const mappable=q=>q&&Number.isFinite(q.x)&&Number.isFinite(q.z);
  function noteFor(m){
    const g=m.rack;
    return {id:m.id,token:m.token,type:g.style,seed:m.seed,turn:g.turn,breaking:g.breaking,groups:[...g.groups],hand:g.phase==="hand",
      shots:g.shots,fouls:[...g.fouls],bestRun:[...g.bestRun],run:g.run,called:g.called,
      balls:g.balls.map(b=>({id:b.id,x:b.x,z:b.z,down:b.down,pocket:b.pocket})),notice:g.notice};
  }
  function validNote(n){
    if(!n||!ids.includes(n.id)||!["short","full"].includes(n.type)||typeof n.token!=="string"||n.token.length>54||
      !Number.isSafeInteger(n.seed)||!Array.isArray(n.groups)||n.groups.length!==2||!Array.isArray(n.balls)||
      n.balls.length!==(n.type==="full"?16:4)||n.balls[0]?.id!==0||n.balls[0].down||
      new Set(n.balls.map(b=>b?.id)).size!==n.balls.length||![0,1].includes(n.turn)||
      !["/","solids/stripes","stripes/solids"].includes(n.groups.join("/")))return false;
    const idsOK=n.type==="short"?[0,1,8,9]:Array.from({length:16},(_,i)=>i);
    return n.balls.every(b=>b&&idsOK.includes(b.id)&&mappable(b)&&Math.abs(b.x)<=.75&&Math.abs(b.z)<=1.39&&typeof b.down==="boolean"&&
      (!b.down||Number.isInteger(b.pocket)&&b.pocket>=0&&b.pocket<6))&&!n.balls.find(b=>b.id===8)?.down;
  }
  function read(raw){
    const card={};for(const id of ids){const a=raw?.card?.[id];
      card[id]={wins:count(a?.wins),losses:count(a?.losses),shortWins:count(a?.shortWins),shortLosses:count(a?.shortLosses),best:Math.min(15,count(a?.best)),rides:count(a?.rides)};}
    return {card,seen:raw?.seen===true,houseCue:raw?.houseCue===true,serial:count(raw?.serial),rev:count(raw?.rev),pending:validNote(raw?.pending)?raw.pending:null};
  }
  function loadRack(note){
    const g=new BayPalmPool.Rack(note.type,note.seed,note.turn);g.breaking=!!note.breaking;g.groups=note.groups.slice();
    for(const b of g.balls){const v=note.balls.find(q=>q.id===b.id);Object.assign(b,{x:v.x,z:v.z,down:v.down,drop:v.down?1:0,pocket:v.down?v.pocket:-1});}
    g.phase=note.hand?"hand":"aim";g.shots=count(note.shots);g.fouls=[0,1].map(i=>count(note.fouls?.[i]));
    g.bestRun=[0,1].map(i=>Math.min(15,count(note.bestRun?.[i])));g.run=Math.min(15,count(note.run));
    g.called=Number.isInteger(note.called)&&note.called>=0&&note.called<6?note.called:-1;
    g.notice=g.phase==="hand"?"Ball in hand.":g.onBlack()?"Call a pocket for the eight.":"Back at the table.";return g;
  }
  const actor=(base,id)=>({id,base,name:base.name||"Diner regular",x:base.x,z:base.z,y:.142,yaw:base.yaw,motion:new BayPlayerMotion(),
    state:"street",action:"walk",age:0,seat:0,pathData:null,posture:null});
  function face(a,yaw,dt){
    a.yaw+=turn(a.yaw,yaw)*Math.min(1,dt*10);return Math.abs(turn(a.yaw,yaw))<.06;
  }
  function move(a,p,dt,env,pace=2.2,v=null){
    if(!mappable(p))return false;
    let w=a.pathData;
    if(!w||gap(w.goal,p)>.12||w.v!==v){w=a.pathData={goal:point(p.x,p.z),v,path:null,retry:0};}
    if(gap(a,p)<.065){a.motion.step(dt,0,0);if(a.action==="walk")a.action="idle";return true;}
    if(w.retry>0){w.retry-=dt;a.motion.step(dt,0,0);return false;}
    if(!w.path?.length){w.path=env.walk(a,p,v);if(!w.path?.length){w.retry=.60;a.motion.step(dt,0,0);return false;}}
    if(env.waitTraffic(a,w.path[0],v)){a.motion.step(dt,0,0);return false;}
    a.action="walk";a.posture=null;
    return BayCarAccess.walkPath(a,a.motion,w.path,dt,env.ground,pace)&&gap(a,p)<.11;
  }
  function transition(a,state){a.state=state;a.age=0;a.pathData=null;a.posture=null;}
  class House{
    constructor(site,walkers,memory){
      this.site=site;this.saved=memory;this.byId={};
      for(const id of ids)this.byId[id]=actor(walkers.find(p=>p.name===data[id].name),id);
      this.luz=this.byId.luz;const diners=walkers.filter(p=>!p.name&&p.path===this.luz.base.path);
      this.guests=diners.map((p,i)=>actor(p,"guest"+i));this.people=[...Object.values(this.byId),...this.guests];
      this.match=null;this.visit=null;this.playerSeat=null;this.door=0;this.houseAge=0;this.elapsed=0;
      this.idleRack=new BayPalmPool.Rack("practice",1);this.hustle=null;this.began=false;
    }
    use(a,state){if(a.state==="street"){Object.assign(a,{x:a.base.x,z:a.base.z,yaw:a.base.yaw});a.base.onTour=a.base.palmManaged=true;}transition(a,state);}
    reset(a){a.base.onTour=a.base.palmManaged=a.base.palmPassenger=false;Object.assign(a.base,{x:a.x,z:a.z,yaw:a.yaw,stuck:0,wait:1});transition(a,"street");a.ride=null;a.seat=0;a.chair=null;a.action="idle";}
    outdoor(a){return a.state==="street"?a.base:a;}
    available(a){return a&&!a.ride&&(!this.visit||this.visit.a===a)&&!this.match;}
    meet(id,env){
      const a=this.byId[id];if(!this.available(a)||id==="luz"||this.visit)return false;
      this.use(a,"wait");this.visit={a,stage:gap(a,env.hero)<4?"with":"pickup",ridden:false};
      env.say(a.name,data[id].hello);env.change();return true;
    }
    passenger(a,v,dt,env,inward){
      if(inward&&a.seat<=0){
        const q=env.stand(v,1);if(!q||!move(a,q,dt,env,2.6,v)||!env.door(v,true,a,1))return false;
      }
      if(!inward&&a.seat>=1&&!env.door(v,true,a,1))return false;
      a.seat=clamp(a.seat+(inward?dt:-dt)/1.43,0,1);a.action=a.seat===1?"ride":"board";
      BayCarAccess.pose(v,1,a.seat,a,a.motion,env.ground,dt,true);
      if(!inward&&a.seat===0){v.passengerDoor=0;a.ride=null;a.motion.reset();a.action="idle";}
      return inward?a.seat===1:a.seat===0;
    }
    visitStep(dt,env){
      const j=this.visit;if(!j)return;const a=j.a,car=env.driver(),transfer=env.transfer(),s=this.site;
      if(j.stage==="pickup"){
        if(gap(env.hero,a)<3.5||car&&gap(car,a)<12&&still(car)){j.stage="with";env.say(a.name,"There you are. Let's get a game in.");env.change();}
        else{a.action="watch";a.motion.step(dt,0,0);return;}
      }
      if(a.ride){
        const v=a.ride;
        if(a.state==="in"){if(this.passenger(a,v,dt,env,true)){transition(a,"ride");j.ridden=true;j.chatter=0;env.change();}return;}
        if(a.state==="out"){if(this.passenger(a,v,dt,env,false)){transition(a,j.stage==="part"?"return":"follow");if(j.stage==="part"){this.visit=null;env.change();}}return;}
        BayCarAccess.pose(v,1,1,a,a.motion,env.ground,dt,true);a.action="ride";
        if(!(j.chatter>14)){j.chatter=(j.chatter||0)+dt;if(j.chatter>14&&Math.abs(v.speed)>1)env.say(a.name,data[a.id].ride);}
        if(still(v)&&!transfer&&(!car||j.stage==="part")&&env.door(v,true,a,1))transition(a,"out");return;
      }
      if(j.stage==="part"){transition(a,"return");this.visit=null;return;}
      if(j.stage==="table"||this.match)return;
      if(transfer?.exiting)return;
      if(car&&env.rideOK(car)&&still(car)&&gap(a,car)<16){
        const q=env.stand(car,1);if(q&&move(a,q,dt,env,2.55,car)&&env.door(car,true,a,1)){a.ride=car;transition(a,"in");}return;
      }
      if(car){a.action="watch";a.motion.step(dt,0,0);return;}
      if(j.stage==="arriving"||gap(env.hero,s.door)<9||j.ridden&&gap(env.hero,s.curb)<6&&gap(a,s.curb)<18||BayPalmDiner.contains(env.hero.x,env.hero.z)){
        j.stage="arriving";
        if(move(a,s.checkIn,dt,env,2.30)){j.stage="table";transition(a,"house");
          if(j.ridden){env.current();this.saved.card[a.id].rides++;this.saved.rev++;env.save();}
          env.say(a.name,"I'll rack. Short game or the whole table?");env.change();}return;
      }
      if(gap(a,env.hero)>1.6&&gap(a,env.hero)<50){const q=BayDriving.world(env.hero,.71,-1.12);
        move(a,env.clearFoot(q)?q:env.hero,dt,env,gap(a,env.hero)>5?3.0:1.85);}
      else{a.action="watch";face(a,Math.atan2(env.hero.x-a.x,env.hero.z-a.z),dt);a.motion.step(dt,0,0);}
    }
    depart(env){
      const a=this.visit?.a;
      if(a?.ride){this.visit.stage="part";}else if(a){transition(a,"return");this.visit=null;}
      env.change();
    }
    holds(v){return !!v&&this.visit?.a.ride===v&&["in","out"].includes(this.visit.a.state);}
    get target(){
      const j=this.visit;if(!j||this.match)return null;
      return j.stage==="pickup"?{...this.outdoor(j.a),name:j.a.name+" · "+data[j.a.id].place}:j.a.ride?
        {...this.site.curb,name:"Palm Diner · Ocean Drive curb"}:{...this.site.breaker,name:"Palm Diner · House table"};
    }
    get rival(){return this.visit?.stage==="table"?this.visit.a:this.luz;}
    get balls(){return (this.match?.rack||this.idleRack).balls;}
    start(style,a,env,resume=false){
      if(this.match||this.playerSeat||env.driver()||gap(env.hero,this.site.table)>7)return false;
      if(style!=="practice"&&(!a||a!==this.luz&&this.visit?.stage!=="table"&&!resume))return false;
      if(!env.current())return false;
      const n=resume?this.saved.pending:null;if(resume&&(!validNote(n)||n.id!==a.id))return false;
      if(!resume&&style!=="practice"&&this.saved.pending)return false;
      if(n&&a!==this.luz&&gap(this.outdoor(a),this.site.table)>9)return false;
      this.hustle=null;this.houseAge=0;this.saved.seen=true;
      const seed=n?n.seed:++this.saved.serial,id=a?.id||"luz",token=n?n.token:Date.now().toString(36)+"-"+Math.random().toString(36).slice(2,10);
      const g=n?loadRack(n):new BayPalmPool.Rack(style,seed,0);
      this.match={style:g.style,id,seed,token,a:style==="practice"?null:a,rack:g,stage:"gather",age:0,angle:0,power:.52,
        camera:0,draw:null,queue:null,swing:null,hand:point(g.cue.x,g.cue.z),paid:0,settled:false};
      env.hero.motion.reset();env.hero.pathData=null;
      if(this.match.a){this.use(a,"match");a.chair=null;env.say(a.name,n?"Right where we left it.":g.style==="full"?"Your break. Call the pocket when you're down to the eight.":"One of each and the eight. You can finish this one before the coffee's gone.");}
      if(style!=="practice"){this.saved.pending=noteFor(this.match);this.match.rev=++this.saved.rev;env.save();}
      env.change();return true;
    }
    clearRack(env){
      if(this.match||!env.current())return false;
      if(this.saved.pending){this.saved.pending=null;this.saved.rev++;env.save();}return true;
    }
    leave(env){
      const m=this.match;if(!m)return;
      if(m.a){m.a.posture=null;transition(m.a,"house");if(this.visit)this.visit.stage="table";}
      this.match=null;this.houseAge=0;env.hero.posture=null;env.hero.pathData=null;env.hero.action="idle";env.hero.motion.reset();env.change();
    }
    canAim(){const m=this.match;return m&&m.stage==="play"&&!m.rack.turn&&m.rack.phase==="aim"&&!m.swing&&!m.queue;}
    aim(angle){if(this.canAim()&&this.match.draw==null&&Number.isFinite(angle))this.match.angle=angle;}
    charge(){const m=this.match;if(!this.canAim()||m.draw!=null)return false;m.draw=0;return true;}
    release(env){
      const m=this.match;if(!m||m.draw==null)return false;const held=m.draw;m.draw=null;
      if(!this.canAim())return false;
      if(m.rack.onBlack()&&m.rack.called<0){env.message("Call the eight","Click a pocket or press Q to choose one.");return false;}
      const power=held<.12?m.power:this.strength(held);m.power=power;m.queue={angle:m.angle,power};return true;
    }
    strength(t){return .16+.84*(1-Math.abs((t/1.18)%2-1));}
    settleTurn(m,env){
      const g=m.rack,first=g.balls.find(b=>b.id&&!b.down&&g.legal(b.id));m.angle=first?Math.atan2(first.x-g.cue.x,first.z-g.cue.z):0;m.hand=point(g.cue.x,g.cue.z);m.plan=null;m.age=0;m.draw=null;m.queue=null;
      m.stance=null;m.humanPath=null;env.change();
    }
    checkpoint(m,env){
      if(m.style==="practice")return;
      if(m.void||!env.current()||this.saved.pending?.token!==m.token||this.saved.rev!==m.rev){m.void=true;return;}
      this.saved.pending=noteFor(m);m.rev=++this.saved.rev;env.save();
    }
    finish(m,env){
      if(m.settled)return;m.settled=true;m.stage="result";m.age=0;
      const g=m.rack,c=this.saved.card[m.id],won=g.winner===0,full=m.style==="full";
      if(!m.void&&env.current()&&this.saved.pending?.token===m.token&&m.rev===this.saved.rev){
        const field=full?(won?"wins":"losses"):(won?"shortWins":"shortLosses");
        if(won&&c[field]===0)m.paid=full?85:25;c[field]++;c.best=Math.max(c.best,g.bestRun[0]);
        this.saved.pending=null;this.saved.rev++;
        if(!this.saved.houseCue&&ids.every(id=>this.saved.card[id].wins)){this.saved.houseCue=true;m.newCue=true;m.paid+=100;}
        if(m.paid)env.pay(m.paid);env.save();
      }
      env.say(m.a.name,won?data[m.id].win:"Rack 'em again? There's time before I head out.");
      env.change();
    }
    shootStep(player,table,rack,turnState,dt,env){
      const s=turnState,stance=BayPalmPlayers.stance(table,s.cue,s.angle,s.stance);s.stance=stance;
      if(!s.locked){
        if(!move(player,stance,dt,env,2.9)){s.settle=0;return;}
        if(!face(player,stance.yaw,dt))return;
        s.settle=clamp((s.settle||0)+dt*3.8,0,1);
      }
      player.action=s.locked?"stroke":"aim";player.posture={table,cue:s.cue,angle:s.angle,stance,settle:s.settle||0,draw:s.draw||0,carry:true};
      if(!s.shoot||s.settle<1)return;
      if(!s.locked){s.locked=true;s.at=0;}
      s.at=clamp(s.at+dt/(.56+.16*s.power),0,1);player.action="stroke";player.posture.stroke=s.at;player.posture.draw=s.power;
      if(!s.hit&&s.at>=.46){s.hit=true;rack.strike(s.angle,s.power);env.sound("cue",s.power+1,table);}
      return s.at===1;
    }
    matchStep(dt,env){
      const m=this.match,g=m.rack,table=this.site.table;m.age+=dt;
      if(m.stage==="result")return;
      if(m.stage==="gather"){
        const playerReady=move(env.hero,this.site.breaker,dt,env,2.65);
        const otherReady=!m.a||move(m.a,this.site.house,dt,env,2.4);
        if(playerReady&&otherReady){m.stage="play";this.settleTurn(m,env);}return;
      }
      if(m.draw!=null)m.draw+=dt;
      if(m.swing){
        const s=m.swing;if(this.shootStep(s.actor,table,g,s,dt,env)){s.actor.posture=null;s.actor.action="watch";m.swing=null;}
      }
      if(g.phase==="roll"){
        if(g.step(dt,(type,force)=>env.sound(type,force,table))){
          if(g.phase==="result")this.finish(m,env);
          else{this.settleTurn(m,env);this.checkpoint(m,env);}
        }return;
      }
      if(m.swing||g.phase==="result")return;
      const shooter=g.turn?m.a:env.hero,observer=g.turn?env.hero:m.a;
      if(observer){const mark=g.turn?this.site.breaker:this.site.house;move(observer,mark,dt,env,2.55);
        if(gap(observer,mark)<.15){observer.action="watch";face(observer,Math.atan2(table.x-observer.x,table.z-observer.z),dt);}}
      if(g.phase==="hand"){
        if(g.turn&&m.age>1.15){m.plan=g.handPlan(data[m.id].skill);m.age=0;m.stance=null;}
        else return;
      }
      if(g.turn&&!m.plan){m.plan=g.plan(data[m.id].skill);if(g.onBlack())g.call(m.plan.pocket);m.age=0;}
      if(g.turn&&g.onBlack()&&g.called<0)g.call(m.plan.pocket);
      if(g.turn)m.angle=m.plan.angle;
      const aim=m.queue?.angle??m.angle,j=m.stance||{};j.angle=aim;j.cue=point(g.cue.x,g.cue.z);j.shoot=false;
      j.draw=g.turn?clamp((m.age-.40)/1.1,0,1)*m.plan.power:m.draw!=null?this.strength(m.draw):.12;
      m.stance=j;this.shootStep(shooter,table,g,j,dt,env);
      if((m.queue||g.turn&&m.age>1.6)&&j.settle>=1){
        j.power=m.queue?.power??m.plan.power;j.shoot=true;j.actor=shooter;j.draw=j.power;
        m.swing=j;m.stance=null;m.queue=null;
      }
    }
    seatFree(seat){return !this.people.some(a=>a.chair===seat)&&this.playerSeat?.seat!==seat;}
    sit(seat,env){
      if(this.match||this.playerSeat||!this.seatFree(seat)||gap(env.hero,seat.stand)>2.0)return false;
      this.playerSeat={seat,amount:0,out:false};env.hero.pathData=null;return true;
    }
    seatStep(a,s,t,dt,env){
      if(!t.out&&t.amount===0&&!move(a,s.stand,dt,env,2.15))return false;
      t.amount=clamp(t.amount+(t.out?-dt:dt)/.8,0,1);const f=t.amount*t.amount*(3-2*t.amount);
      a.x=s.stand.x+(s.sit.x-s.stand.x)*f;a.z=s.stand.z+(s.sit.z-s.stand.z)*f;a.y=env.ground(a.x,a.z);face(a,s.sit.yaw,dt);
      a.action=t.amount>.95&&Math.sin(this.elapsed*.54+a.z)>.55?"sip":"sit";a.posture={settle:t.amount,seat:{...s.sit,y:s.seatY}};a.motion.step(dt,0,0);
      if(t.out&&t.amount===0){a.motion.reset();a.posture=null;a.action="idle";a.pathData=null;return true;}return false;
    }
    ambient(dt,env){
      const s=this.site,l=this.luz;this.houseAge+=dt;
      if(!this.match&&!this.visit?.a?.ride&&!l.ride&&l.state!=="match"){
        if(l.state==="street")this.use(l,"house");
        if(l.state==="house"&&gap(env.pos(),s.table)<70){
          const g=this.idleRack;
          if(g.phase==="roll")g.step(dt,(k,v)=>env.sound(k,v,s.table));
          if(this.hustle){
            const h=this.hustle;h.time+=dt;h.shoot=h.time>2;h.draw=clamp(h.time/2,0,1)*h.power;
            if(this.shootStep(l,s.table,g,h,dt,env)){this.hustle=null;l.posture=null;l.action="chalk";this.houseAge=0;}
          }else if(g.phase==="aim"&&this.houseAge>7){const shot=g.plan(.75);this.hustle={...shot,cue:point(g.cue.x,g.cue.z),time:0};}
          else if(move(l,s.house,dt,env,1.6)){l.action="chalk";face(l,Math.atan2(s.table.x-l.x,s.table.z-l.z),dt);}
        }
      }
      for(const [i,a] of this.guests.entries()){
        a.age+=dt;if(a.state==="street"){
          if(a.age>(i?21:4)+(a.visits||0)*3&&gap(a.base,s.outside)<34){
            const seat=s.seats[(i*2+(a.visits||0))%s.seats.length];
            if(seat&&this.seatFree(seat)){this.use(a,"dine");a.chair=seat;a.sitting={amount:0,out:false};}
          }
        }else if(a.state==="dine"){
          if(a.sitting.amount===1&&a.age>39+i*12+(env.wet()?25:0))a.sitting.out=true;
          if(this.seatStep(a,a.chair,a.sitting,dt,env)){a.chair=null;a.visits=(a.visits||0)+1;transition(a,"return");}
        }
      }
      for(const a of this.people)if(a.state==="return"){
        const base=a.base,home=base.path[base.index%base.path.length];
        if(move(a,point(home[0]+base.offset,home[1]+base.offset),dt,env,1.92)){this.reset(a);a.age=-22;}
      }
    }
    step(dt,env){
      this.elapsed+=dt;
      this.door=BayPalmDiner.stepDoor(this.door,dt,[env.pos(),...this.people.filter(a=>a.state!=="street"&&!a.seat)]);
      this.visitStep(dt,env);if(this.match)this.matchStep(dt,env);
      if(this.playerSeat&&this.seatStep(env.hero,this.playerSeat.seat,this.playerSeat,dt,env))this.playerSeat=null;
      this.ambient(dt,env);
      for(const a of this.people)if(a.state!=="street"){
        Object.assign(a.base,{x:a.x,z:a.z,yaw:a.yaw,palmPassenger:!!a.ride&&a.seat>.4});
      }
    }
  }
  window.BayPalmLeague={House,read,validNote,data,ids};
})();
