(() => {
  "use strict";
  const places=BayCourtPlaces,ballistics=BayCourtBall,tau=Math.PI*2;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const face=(p,q)=>Math.atan2(q.x-p.x,q.z-p.z),turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const damp=(a,b,k,dt)=>a+(b-a)*-Math.expm1(-k*dt);
  const cast={
    nikki:{name:"Nikki Grant",short:"Nikki",pace:3.77,range:6.42,skill:.77,shade:1.16},
    teo:{name:"Teo Cruz",short:"Teo",pace:4.15,range:2.86,skill:.72,shade:1.35},
    sola:{name:"Sola Vélez",short:"Sola",pace:4.29,range:4.85,skill:.85,shade:1.09},
    luis:{name:"Luis Ochoa",short:"Luis",pace:3.94,range:6.62,skill:.84,shade:.99}
  };
  const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1000000):0;
  function read(raw){
    const out={equipped:"street"};
    for(const id of ["sol","mercado"]){const v=raw?.[id];out[id]={wins:count(v?.wins),losses:count(v?.losses),makes:count(v?.makes),
      streak:count(v?.streak),bestStreak:count(v?.bestStreak),longest:Number.isFinite(v?.longest)?clamp(v.longest,0,16):0};}
    if(["sol","mercado"].includes(raw?.equipped)&&out[raw.equipped].wins)out.equipped=raw.equipped;return out;
  }
  function actor(id,at,motion=new BayPlayerMotion()){
    return {...at,...cast[id],id,motion,side:1,handSide:1,beat:0,action:"idle",phase:0,lift:0,
      vx:0,vz:0,yaw:at.yaw||0,jumpAge:-1,move:0,cool:0,stun:0,clock:0,cross:1,driveSign:1,wind:0,shot:null};
  }
  function motionTo(p,dx,dz,look,dt,max){
    const l=Math.hypot(dx,dz),speed=Math.min(l,max),tx=l?speed*dx/l:0,tz=l?speed*dz/l:0;
    const k=p.jumpAge>=0?3.8:12;p.vx=damp(p.vx,tx,k,dt);p.vz=damp(p.vz,tz,k,dt);
    const old=p.yaw;p.x+=p.vx*dt;p.z+=p.vz*dt;
    if(Number.isFinite(look))p.yaw+=turn(p.yaw,look)*-Math.expm1(-14*dt);
    p.move=Math.hypot(p.vx,p.vz);p.motion.step(dt,p.move*dt,(p.yaw-old)/dt);
  }
  function go(p,to,max,dt,look){
    const dx=to.x-p.x,dz=to.z-p.z;motionTo(p,dx*4.3,dz*4.3,look??(Math.hypot(dx,dz)>.18?Math.atan2(dx,dz):p.yaw),dt,max);
  }
  function jump(p,defense){
    if(p.jumpAge>=0||p.cool>.03||p.stun>.05)return false;
    p.jumpAge=0;p.jumpHeight=defense?.70:.38;p.cool=defense?.99:.75;if(defense){p.action="block";p.phase=0;}return true;
  }
  function animate(p,dt){
    p.cool=Math.max(0,p.cool-dt);p.stun=Math.max(0,p.stun-dt);p.clock+=dt;
    if(p.jumpAge>=0){
      p.jumpAge+=dt;const u=clamp(p.jumpAge/.68,0,1);p.lift=4*p.jumpHeight*u*(1-u);
      if(p.action==="block")p.phase=u;
      if(u===1){p.jumpAge=-1;p.lift=0;if(p.action==="block")p.action="defend";}
    }
    if(p.cross<1){p.cross=Math.min(1,p.cross+dt/.35);p.handSide=p.side*(p.cross*p.cross*(3-2*p.cross)*2-1);}
    else p.handSide=p.side;
    p.beat=(p.beat+dt*(1.36+Math.min(5,p.move)*.126))%1;
    if(p.action==="reach"||p.action==="catch"||p.action==="cheer"){
      p.phase=Math.min(1,p.phase+dt/(p.action==="cheer"?1.4:.45));
      if(p.phase===1){if(p.action==="catch")p.beat=0;p.action="idle";}
    }
  }
  class Court{
    constructor(site,history,emit){
      this.site=site;this.history=history;this.emit=emit;this.time=0;this.gameCount=history.wins+history.losses;
      this.champion=this.gameCount%2;this.seed=site.id==="sol"?13741:51673;this.score=[0,0];this.net=0;this.flash=0;this.line="";this.lineUntil=0;
      const ids=site.id==="sol"?["nikki","teo"]:["sola","luis"];
      this.locals=ids.map((id,i)=>actor(id,this.at(i?1.8:-.7,i?4.25:6.70)));
      this.keeper=actor(site.id==="sol"?"dee":"ines",BayCourtBench.keeperSpot(site));
      this.players=this.locals.slice();this.human=null;this.spare=null;this.mode="ambient";this.phase="live";this.offense=0;
      this.ball={...this.at(-.7,6.7),spin:0,age:0};this.possessions=0;this.clear=true;this.glass=false;this.winner=0;this.lastSound=-3;
      this.own(this.players[0],true);
    }
    at(u,v){return places.worldPoint(this.site,u,v,0);}
    rand(){this.seed=(Math.imul(this.seed,1664525)+1013904223)>>>0;return this.seed/4294967296;}
    say(line,seconds=2.1){this.line=line;this.lineUntil=this.time+seconds;}
    other(p){return this.players[0]===p?this.players[1]:this.players[0];}
    get opponent(){return this.players[1];}
    regular(){return this.locals[this.champion];}
    prepare(p){
      p.target=null;p.driveSign=this.rand()<.5?-1:1;p.wind=0;p.decision=.7+this.rand()*.45;
      p.settle=0;p.attackTime=0;p.fake=false;p.fakeAgain=1.1+this.rand();p.releaseAt=0;p.shot=null;
    }
    own(p,clear){
      this.offense=this.players.indexOf(p);this.clear=clear||dist(p,this.site)>=6.25;
      p.action="catch";p.phase=0;this.prepare(p);ballistics.hold(this.ball,p);
      const d=this.other(p);d.nextReach=d.clock+.65+this.rand()*.55;
    }
    check(next){
      this.phase="check";this.offense=next;this.clear=true;this.possessions++;this.passTime=0;
      const attacker=this.players[next],side=this.possessions%2===0?1:-1;
      this.mark=this.at(side*1.35,6.71);this.feedSpot=this.at(-side*.70,4.73);
      if(this.mode==="practice"&&this.joined)this.mark={x:attacker.x,z:attacker.z};
      for(const p of this.players){p.shot=null;p.wind=0;p.action="idle";p.phase=0;}
      this.ball.shot=null;
      if(this.ball.state!=="held")ballistics.loose(this.ball);
      else if(this.ball.holder===attacker||!this.players.includes(this.ball.holder))this.dropBall();
      this.say(this.mode==="practice"?"The rebounder is checking the ball":"Check ball");
    }
    dropBall(){
      const b=this.ball;ballistics.loose(b);b.vx=b.vz=0;b.vy=.25;b.age=0;
    }
    enter(mode,hero,motion,kit){
      if(this.human)this.leave();
      const opponent=this.regular();this.spare=this.locals.find(p=>p!==opponent);
      this.human=actor("player",hero,motion);Object.assign(this.human,{name:"Room 14",short:"You",kit,pace:5.20});
      this.mode=mode;this.players=[this.human,opponent];this.score=[0,0];this.joined=false;this.glass=false;
      this.introduced=false;this.check(0);this.spare.shot=null;this.spare.action="idle";this.spare.phase=0;
    }
    leave(){
      if(!this.human)return;
      if(this.ball.holder===this.human)this.dropBall();
      this.human.motion.reset();this.human=null;this.spare=null;this.mode="ambient";this.players=this.locals.slice();
      this.score=[0,0];this.check(this.champion);
    }
    pressure(p){
      if(this.mode==="practice")return 0;
      const d=this.other(p),range=dist(p,d);
      if(d.stun>.12||range>2.1)return 0;
      const front=Math.cos(turn(face(p,this.site),face(p,d)));
      return clamp((2.1-range)/1.34,0,1)*clamp((front+.12)*1.4,0,1);
    }
    window(p){
      const range=Math.min(10,dist(p,this.site)),pressure=this.pressure(p);
      return {ideal:.49+range*.023+pressure*.042,width:(.114-.0028*range)*(1-pressure*.32)};
    }
    gather(p){
      if(this.phase!=="live"||this.ball.holder!==p||p.shot||p.stun>.05)return false;
      if(!this.clear){this.say("Clear the ball beyond the arc");return false;}
      p.action="gather";p.phase=0;p.wind=0;p.shot={stage:"wind",window:this.window(p)};return true;
    }
    release(p,yaw,glass){
      const shot=p?.shot;if(shot?.stage!=="wind")return;
      const rim=face(p,this.site),range=dist(p,this.site),bearing=turn(rim,yaw);
      const timing=(p.wind-shot.window.ideal)/shot.window.width;
      const over=Math.max(0,Math.abs(timing)-.68),bias=clamp(timing,-7,7);
      const side=Math.abs(bearing)<.35?bearing*.12:Math.sign(bearing)*(.042+(Math.abs(bearing)-.35)*.65);
      const miss=clamp((over*.30+Math.abs(bias)*.016)*Math.sign(bias),-2.3,2.8);
      const horizontal=clamp(Math.sin(side)*Math.max(2.4,range),-4.1,4.1);
      const radial=places.local(this.site,p.x,p.z),n=Math.max(.01,Math.hypot(radial.u,radial.v));
      const aim={u:-radial.u/n*miss-radial.v/n*horizontal,v:-radial.v/n*miss+radial.u/n*horizontal};
      shot.stage="up";shot.age=0;shot.aim=aim;shot.glass=glass;shot.released=false;
      shot.grade=Math.abs(bearing)>.55?"Wide aim":Math.abs(timing)<.71?"Clean release":timing<0?"Early release":"Late release";
      p.action="shoot";p.phase=0;p.cool=0;jump(p,false);
      if(p===this.human)this.say(shot.grade+(glass?" · Off glass":""),1.3);
    }
    releaseHuman(yaw){if(this.human)this.release(this.human,yaw,this.glass);}
    shootKey(){const p=this.human;if(!p||this.phase!=="live")return;
      if(this.ball.holder===p)this.gather(p);else jump(p,true);}
    cross(p){
      if(p.cross<1||p.shot)return;
      p.side=-p.side;p.cross=0;
      const d=this.other(p);
      if(dist(p,d)<1.76&&d.stun<.05&&d.cool<.4){
        d.stun=.54;d.vx+=Math.cos(p.yaw)*-p.side*1.75;d.vz-=Math.sin(p.yaw)*-p.side*1.75;
        if(p===this.human)this.say("Got a step",.8);
      }
    }
    swipe(p){
      if(p.cool>0||p.jumpAge>=0)return false;
      p.action="reach";p.phase=0;p.cool=.84;
      const h=this.ball.holder;if(!h||h===p||h.shot)return false;
      const range=dist(p,this.ball);
      if(range>1.08||h.beat<.19||h.beat>.82||Math.abs(turn(p.yaw,face(p,h)))>1.22){p.stun=.23;return false;}
      this.own(p,false);this.say((p===this.human?"Your steal":p.short+" steals it")+(this.clear?"":" · Clear the ball"));return true;
    }
    fKey(){if(this.phase!=="live")return;if(this.ball.holder===this.human)this.cross(this.human);else if(this.ball.holder)this.swipe(this.human);}
    runShot(p,dt,aimYaw){
      const shot=p.shot;if(!shot)return;
      if(shot.stage==="wind"){
        p.wind+=dt;p.phase=clamp(p.wind/shot.window.ideal,0,1);p.yaw+=turn(p.yaw,face(p,this.site))*-Math.expm1(-12*dt);
        if(p===this.human){if(p.wind>1.3)this.releaseHuman(aimYaw);}
        else if(p.wind>=p.releaseAt)this.release(p,face(p,this.site),p.bank);
      }else{
        shot.age+=dt;p.phase=Math.min(1,shot.age/.48);
        if(!shot.released&&p.phase>=.56){
          shot.released=true;const phase=p.phase;p.phase=.56;ballistics.shoot(this.ball,this.site,p,shot.aim,shot.glass);p.phase=phase;
          if(this.mode==="practice"){if(this.score[1]===5)this.score=[0,0];this.score[1]++;}
          this.clear=true;this.emit("release",this,p);if(p===this.human)this.lastRelease=shot.grade;
        }
        if(p.phase===1){p.shot=null;p.action="idle";p.wind=0;}
      }
    }
    humanMove(p,dt,input){
      const h=this.ball.holder,dx=input.dx,dz=input.dz,n=Math.hypot(dx,dz);
      const speed=p.shot?(p.shot.stage==="wind"?.35:.15):p.stun>0?1.0:input.sprint?5.45:3.65;
      const target=n?Math.atan2(dx,dz):p.yaw,guard=h&&h!==p&&dist(h,p)<5.25;
      const look=p.shot?face(p,this.site):guard?face(p,h):target;
      motionTo(p,n?dx/n*speed:0,n?dz/n*speed:0,look,dt,speed);
      if(!p.shot&&p.jumpAge<0&&!["catch","reach"].includes(p.action))p.action=h===p?"dribble":guard?"defend":"idle";
    }
    cpuAttack(p,dt){
      p.attackTime+=dt;
      if(p.shot){motionTo(p,0,0,face(p,this.site),dt,0);return;}
      const d=this.other(p),q=places.local(this.site,p.x,p.z),range=dist(p,this.site);
      if(!this.clear){
        const v=this.at(p.driveSign*3.65,6.42);go(p,v,p.pace+.35,dt);return;
      }
      if(!p.target){
        const rad=p.range+(this.rand()-.5)*1.16,side=.52+this.rand()*.29;
        p.target=this.at(p.driveSign*rad*side,rad*Math.sqrt(1-side*side));p.decision=.27+this.rand()*.47;
      }
      const gap=dist(p,p.target);
      if(gap>.43)go(p,p.target,p.pace*(this.pressure(p)>.4?.85:1),dt);
      else{motionTo(p,0,0,face(p,this.site),dt,0);p.settle+=dt;}
      if(!p.fake&&p.attackTime>p.fakeAgain&&dist(p,d)<1.7&&Math.abs(q.u)<6){this.cross(p);p.fake=true;}
      if(p.settle>=p.decision||p.attackTime>4.6&&range<8.7){
        if(this.gather(p)){
          const difficulty=(1-p.skill)*2.8+this.pressure(p)*.88;
          p.releaseAt=p.shot.window.ideal+p.shot.window.width*(this.rand()-.5)*2*(.98+difficulty);
          p.bank=Math.abs(q.u)>1.5&&range<5.4&&this.rand()>.38;
        }
      }
    }
    cpuGuard(p,h,dt){
      if(p.stun>0){motionTo(p,0,0,face(p,h),dt,0);return;}
      const range=Math.max(.18,dist(h,this.site)),gap=p.shade+(h.shot?.stage==="wind"?-.30:.05);
      const dirX=(this.site.x-h.x)/range,dirZ=(this.site.z-h.z)/range;
      const shade=Math.sin(this.time*1.55+p.side)*.25;
      const target={x:h.x+dirX*gap+dirZ*shade,z:h.z+dirZ*gap-dirX*shade};
      go(p,target,p.pace-.12,dt,face(p,h));if(p.jumpAge<0&&p.action!=="reach")p.action="defend";
      if(h.shot?.stage==="up"&&!h.shot.contested&&h.shot.age<.18){
        h.shot.contested=true;
        const gap=dist(h,p);
        if(gap<1.35&&p.cool<=0&&this.rand()<clamp((1.72-gap)*.66,.20,.73))jump(p,true);
      }else if(!h.shot&&h.move<1.7&&h.attackTime>1.0&&dist(p,h)<1.15&&p.cool<=0&&p.clock>p.nextReach){
        p.nextReach=p.clock+1.8+this.rand();this.swipe(p);
      }
    }
    fence(p){
      const q=places.local(this.site,p.x,p.z),u=clamp(q.u,-7.04,7.04),v=clamp(q.v,-1.20,11.08);
      if(u!==q.u||v!==q.v){const here=this.at(u,v);p.x=here.x;p.z=here.z;}
    }
    separate(){
      const [a,b]=this.players,dx=a.x-b.x,dz=a.z-b.z,n=Math.hypot(dx,dz);
      if(n>.02&&n<.58){const f=(.58-n)/n*.5;a.x+=dx*f;a.z+=dz*f;b.x-=dx*f;b.z-=dz*f;}
    }
    ballEvent(event,shot){
      if(event==="basket"&&shot&&this.phase==="live"){
        const side=this.players.indexOf(shot.shooter);if(side<0)return;
        this.net=this.flash=1;this.score[side]+=this.mode==="practice"?1:shot.value;
        if(this.spare&&this.mode==="match"){this.spare.action="cheer";this.spare.phase=0;}
        this.say((side===0&&this.human?"You":shot.shooter.short)+(shot.board?" · Banked it":shot.rim?" · Off the rim":" · Swish")+(this.mode==="practice"?"":"  +"+shot.value),2.55);
        this.emit("score",this,shot);this.next=this.mode==="practice"?0:1-side;this.wait=.91;
        this.phase=this.mode!=="practice"&&this.score[side]>=5?"finish":"dead";
        if(this.phase==="finish"){
          this.winner=side;this.gameCount++;
          this.champion=this.human?(side===0?1-this.champion:this.champion):this.locals.indexOf(shot.shooter);
          this.emit("finish",this,shot);
        }
      }else if(event==="miss"&&this.mode==="practice"&&this.phase==="live"){this.phase="dead";this.next=0;this.wait=.13;}
      else if(event==="line"&&this.phase==="live"&&this.ball.state!=="pass"){
        this.phase="dead";this.next=this.mode==="practice"?0:1-this.offense;this.wait=.22;this.say("Out of bounds · Check up");
      }
      if(event==="basket"||["rim","bounce","glass"].includes(event)&&this.time-this.lastSound>.12){this.lastSound=this.time;this.emit(event,this,shot);}
    }
    clearLane(dt){
      const v=this.laneVehicle;
      if(this.phase!=="traffic"){
        this.phase="traffic";this.resumeSide=this.offense;
        const q=places.local(this.site,v.x,v.z);
        for(const [i,p] of this.players.entries()){
          const a=places.local(this.site,p.x,p.z),side=Math.abs(a.u-q.u)>.3?Math.sign(a.u-q.u):i?1:-1;
          p.exitSpot=this.at(side*6.55,clamp(a.v+(i?.65:-.65),1.25,9.35));p.shot=null;p.wind=0;
        }
        this.emit("traffic",this,v);
      }
      this.laneWait=v ? .70 : Math.max(0,this.laneWait-dt);
      for(const p of this.players){
        let target=p.exitSpot;
        if(v){
          const q=BayDriving.local(v,p.x,p.z),lead=clamp((v.speed||0)*.24,-1,3.5);
          if(Math.abs(q.x)<2.05&&Math.abs(q.z-lead)<3.55)target=BayDriving.world(v,q.x<0?-2.55:2.55,q.z);
        }
        go(p,target,v&&dist(p,v)<6?5.5:3.15,dt,dist(p,target)<.5&&v?face(p,v):undefined);
        p.action=this.ball.holder===p?"dribble":v&&p.move<.35?"defend":"idle";
      }
      if(!this.laneWait)this.check(this.resumeSide);
    }
    checkStep(dt){
      const a=this.players[this.offense],d=this.other(a),b=this.ball;
      go(a,this.mark,a===this.human?3.8:3.4,dt,dist(a,this.mark)<.5?face(a,d):undefined);
      if(b.state==="pass"){
        go(d,this.feedSpot,2.5,dt,face(d,a));a.action="catch";a.phase=.25;
        if(dist(b,a)<.63&&b.y-a.y<1.74&&b.age>.14){
          this.phase="live";this.joined=true;this.own(a,true);this.emit("check",this,a);
        }return;
      }
      if(b.holder!==d){
        go(d,b,4.1,dt);if(dist(d,b)<.57&&b.y-d.y<1.72)this.ownCheck(d);
      }else{
        go(d,this.feedSpot,3.28,dt,dist(d,this.feedSpot)<.6?face(d,a):undefined);
        d.action="dribble";
        if(dist(d,this.feedSpot)<.32&&dist(a,this.mark)<.33){this.passTime+=dt;
          if(this.passTime>.25){d.action="reach";d.phase=0;ballistics.pass(b,d,a);}}
      }
    }
    ownCheck(p){p.action="catch";p.phase=0;ballistics.hold(this.ball,p);}
    rebound(dt,input){
      const b=this.ball,spot=ballistics.landing(b,this.site),shot=b.shot;
      for(const p of this.players){
        if(p===this.human)this.humanMove(p,dt,input);
        else if(this.mode!=="practice"||p!==this.players[0])go(p,spot,p.pace||3.8,dt);
        if(p.shot||this.mode==="practice"&&p===this.opponent)continue;
        const during=b.state==="flight"&&shot&&!shot.made;
        const height=b.y-p.y,rising=b.vy>0;
        if(during&&p!==shot.shooter&&p.action==="block"&&p.lift>.21&&rising&&height<2.05+p.lift&&dist(b,p)<.57&&b.age<.38){
          const dx=Math.sin(p.yaw),dz=Math.cos(p.yaw);ballistics.loose(b);b.vx=dx*2.2;b.vz=dz*2.2;b.vy=1.32;b.age=0;
          this.say("Blocked shot");this.emit("block",this,p);continue;
        }
        if(during&&(rising||height>2.16||b.age<.40)||shot?.made||!during&&b.age<.09)continue;
        if(Math.abs(b.x-p.x)<.84&&dist(b,p)<.79&&height<1.67+p.lift){
          const changed=this.players.indexOf(p)!==this.offense;this.own(p,!changed);
          this.say(changed&&!this.clear?"Defensive rebound · Clear the arc":"Rebound");break;
        }
      }
    }
    step(dt,input){
      this.time+=dt;this.flash=Math.max(0,this.flash-dt*1.2);this.net=Math.max(0,this.net-dt*2.65);
      this.keeper.motion.step(dt,0,0);
      if(this.spare){
        const p=this.spare,spot=BayCourtBench.watchSpot(this.site);animate(p,dt);
        go(p,spot,2.7,dt,dist(p,spot)<.5?face(p,this.site):undefined);
        const y=places.floor(p.x,p.z)??BayCourtBench.floor(p.x,p.z)??this.site.y;p.y=damp(p.y,y,18,dt);
      }
      for(const p of this.players){
        const beat=p.beat;animate(p,dt);
        if(p===this.ball.holder&&p.action==="dribble"&&beat<.5&&p.beat>=.5)this.emit("dribble",this,p);
      }
      if(!this.human&&(this.laneVehicle||this.phase==="traffic"))this.clearLane(dt);
      else if(this.phase==="check")this.checkStep(dt);
      else if(this.phase==="live"){
        const b=this.ball,h=b.holder;
        if(h){
          const d=this.other(h);
          if(h===this.human){this.humanMove(h,dt,input);h.attackTime+=dt;}else this.cpuAttack(h,dt);
          if(!h.shot&&h.action!=="catch")h.action="dribble";
          if(d===this.human)this.humanMove(d,dt,input);
          else if(this.mode==="practice")go(d,this.at(-4.65,2.38),2.55,dt,face(d,h));
          else this.cpuGuard(d,h,dt);
          if(!this.clear&&b.holder&&dist(b.holder,this.site)>=6.25){this.clear=true;this.say("Ball cleared",.9);}
        }else this.rebound(dt,input);
        for(const p of this.players){this.runShot(p,dt,input.yaw);this.fence(p);}
        this.separate();
      }else if(this.phase==="dead"||this.phase==="finish"){
        for(const p of this.players){motionTo(p,0,0,face(p,this.site),dt,0);if(p.shot)this.runShot(p,dt,input.yaw);}
        this.wait-=dt;
        if(this.wait<=0){
          if(this.phase==="finish"){
            if(this.human){this.phase="result";this.mode="result";this.players[this.winner].action="cheer";this.players[this.winner].phase=0;}
            else{this.score=[0,0];this.check(1-this.winner);}
          }else this.check(this.next);
        }
      }else if(this.phase==="result"){
        for(const p of this.players)motionTo(p,0,0,face(p,this.other(p)),dt,0);
      }
      for(const p of this.players){const y=places.floor(p.x,p.z)??BayCourtBench.floor(p.x,p.z)??(this.site.id==="sol"?.007:.077);p.y=damp(p.y,y,18,dt);}
      ballistics.step(this.ball,this.site,dt,(event,shot)=>this.ballEvent(event,shot));
      if(this.mode==="practice"&&this.phase==="live"&&this.ball.state==="loose"&&!this.ball.holder){this.wait=.18;this.next=0;this.phase="dead";}
    }
  }
  window.BayPickup={Court,read,cast};
})();
