/* Ocean Drive. Two kitchen aprons tied to milk crates mark the goal. */
(() => {
  "use strict";
  const mark={x:157.8,z:-41},line=165.3,half=1.92,r=.142;
  const cook={x:156.1,z:-42.8},key="sundownBay.twoAprons.v1";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(99999,n):0;
  function read(){
    let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch{}
    const scores={};
    for(const id of ["guest","frankie"]){const v=raw?.scores?.[id];if(v)scores[id]={rounds:count(v.rounds),best:Math.min(3,count(v.best)),last:Math.min(3,count(v.last))};}
    return {returns:count(raw?.returns),scores};
  }
  function save(g){try{localStorage.setItem(key,JSON.stringify(g.book));}catch{}}
  const ballAt=(x,z)=>({x,z,y:r,vx:0,vy:0,vz:0,spin:0});
  function roll(b,dt){
    b.x+=b.vx*dt;b.z+=b.vz*dt;b.vy-=9.6*dt;b.y+=b.vy*dt;
    if(b.y<=r){b.y=r;b.vy=b.vy<-.72?-b.vy*.43:0;
      const speed=Math.hypot(b.vx,b.vz),step=2.9*dt;
      if(speed<=step)b.vx=b.vz=0;else{b.vx*=1-step/speed;b.vz*=1-step/speed;}}
    b.spin+=Math.hypot(b.vx,b.vz)*dt/r;
  }
  function contact(b,v){
    if(Math.abs(v.x-b.x)>8||Math.abs(v.z-b.z)>8||b.y>1.12)return false;
    const box=v.footprint||bayCarLayout(v.kind),p=BayDriving.local(v,b.x,b.z);
    const side=box.track+r-Math.abs(p.x),end=box.halfLength+r-Math.abs(p.z);
    if(side<=0||end<=0)return false;
    const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),dir=side<end?Math.sign(p.x)||1:Math.sign(p.z)||1;
    const nx=(side<end?cs:sn)*dir,nz=(side<end?-sn:cs)*dir,depth=Math.min(side,end)+.014;
    b.x+=nx*depth;b.z+=nz*depth;
    const speed=v.speed||0,closing=(b.vx-speed*sn)*nx+(b.vz-speed*cs)*nz;
    if(closing<0){const push=clamp(-1.38*closing,.7,16);b.vx+=push*nx;b.vz+=push*nz;b.vy=Math.max(b.vy,Math.min(2.5,push*.19));}
    return true;
  }
  class Game{
    constructor(){
      this.book=read();this.ball=ballAt(mark.x,mark.z);this.phase="passing";this.age=0;this.left=true;
      this.clock=0;this.keeper=0;this.dive=0;this.round=null;this.approach=true;this.kick=0;this.pazKick=0;
    }
    reset(){this.phase="passing";this.age=0;this.left=true;this.dive=0;this.round=null;this.ball=ballAt(mark.x,mark.z);}
    nearby(p){return Math.abs(p.x-mark.x)<46&&Math.abs(p.z-mark.z)<52;}
    action(p){
      if(this.round)return "";
      if(this.phase==="loose"&&dist(p,this.ball)<2.1&&this.ball.y<.62)return "pass";
      if((this.phase==="passing"||this.phase==="invited")&&(dist(p,mark)<2.45||dist(p,cook)<2.15))return "shoot";
      return "";
    }
    pass(){this.phase="collect";this.age=0;}
    passFromFoot(){const b=this.ball,t=clamp(dist(b,cook)/10,.55,2.6);
      b.vx=(cook.x-b.x)/t;b.vz=(cook.z-b.z)/t;b.vy=(r-b.y)/t+4.8*t;
      this.phase="return";this.age=0;this.flight=t;this.kick=.38;
    }
    start(lead){this.round={lead,shots:[],phase:"walk",aim:0,power:0,charging:false,age:0,commit:null};
      this.phase="match";this.keeper=0;this.dive=0;this.ball=ballAt(mark.x,mark.z);}
    charge(){const a=this.round;if(a?.phase==="set"&&!a.charging){a.charging=true;a.power=0;}}
    release(){const a=this.round;if(a?.phase==="set"&&a.charging){a.charging=false;a.age=0;a.phase="stride";}}
    result(kind){
      const a=this.round;a.shots.push(kind);a.phase="result";a.age=0;
      if(a.shots.length===3){
        const made=a.shots.filter(s=>s==="goal").length;this.book=read();const prev=this.book.scores[a.lead];
        this.book.scores[a.lead]={rounds:count((prev?.rounds||0)+1),best:Math.max(prev?.best||0,made),last:made};save(this);
      }
      return kind;
    }
    spot(){const n=this.round.shots.length;return {x:mark.x,z:mark.z+[0,-.75,.85][n]};}
    stepMatch(dt,env){
      const {hero,motion,axis,floor}=env;
      const a=this.round,b=this.ball;a.age+=dt;
      if(a.phase==="walk"){
        const spot=this.spot(),dx=spot.x-1.16-hero.x,dz=spot.z+.12-hero.z,d=Math.hypot(dx,dz),move=Math.min(d,dt*3.35);
        if(d>.015){const blocked=env.move(hero,dx/d*move,dz/d*move,.26);hero.yaw=Math.atan2(dx,dz);
          if(blocked&&a.age>1.7){this.reset();this.phase="invited";return "blocked";}}
        hero.y=floor(hero.x,hero.z);motion.step(dt,move,0);
        if(d<.04){a.phase="set";a.age=0;a.aim=0;a.power=0;a.commit=null;this.ball=ballAt(spot.x,spot.z);}
        return;
      }
      const yaw=Math.atan2(line-hero.x,mark.z-a.aim*2.7-hero.z);
      hero.yaw+=Math.atan2(Math.sin(yaw-hero.yaw),Math.cos(yaw-hero.yaw))*(1-Math.exp(-14*dt));
      if(a.phase==="set"){
        a.aim=clamp(a.aim+axis*dt*2.35,-1,1);if(a.charging)a.power=Math.min(1,a.power+dt*1.12);
        if(a.charging&&a.power>=.30&&a.commit===null)a.commit=clamp(-a.aim*2.7,-1.62,1.62);
        const read=a.commit??(-a.aim*.85+.29*Math.sin(this.clock*2.8));
        this.keeper+=clamp(read-this.keeper,-dt*2.5,dt*2.5);motion.step(dt,0,0);return;
      }
      if(a.phase==="stride"){
        const dx=(Math.min(a.age,.20)-Math.max(0,a.age-dt))*4.15;hero.x+=dx;motion.step(dt,dx,0);
        if(a.age<.2)return;
        a.phase="flight";a.age=0;this.kick=.38;
        const vx=6+a.power*9.5;b.vx=vx;b.vz=(mark.z-a.aim*2.70-b.z)/(line-b.x)*vx;b.vy=1.2+4.7*a.power;
        a.commit??=this.keeper;return "strike";
      }
      motion.step(dt,0,0);
      if(a.phase==="result"){
        roll(b,dt);
        this.dive*=Math.exp(-3*dt);
        if(a.age>1.65){
          if(a.shots.length===3){this.reset();this.phase="invited";return "finished";}
          a.phase="walk";this.keeper*=.50;this.dive=0;
          const s=this.spot();this.ball=ballAt(s.x,s.z);
        }return;
      }
      const oldX=b.x,oldZ=b.z,oldY=b.y;roll(b,dt);
      const want=a.age<.40?a.commit:clamp(b.z-mark.z+b.vz*.12,-1.81,1.81);
      this.keeper+=clamp(want-this.keeper,-dt*2.15,dt*2.15);
      this.dive=clamp((want-this.keeper)*1.6,-1,1);
      const keeperX=line-.67;
      if(oldX<keeperX&&b.x>=keeperX){
        const f=(keeperX-oldX)/(b.x-oldX),z=oldZ+(b.z-oldZ)*f,y=oldY+(b.y-oldY)*f;
        if(Math.abs(z-mark.z-this.keeper)<.49+Math.abs(this.dive)*.35&&y<1.48){
          b.vx*=-.42;b.vz+=(Math.sign(z-mark.z-this.keeper)||1)*2;b.vy=.9;return this.result("saved");
        }
      }
      if(b.x>=line){
        const f=(line-oldX)/(b.x-oldX),z=Math.abs(oldZ+(b.z-oldZ)*f-mark.z),y=oldY+(b.y-oldY)*f;
        if(Math.abs(z-half)<.26&&y<.57){b.vx*=-.55;b.vz*=.6;return this.result("crate");}
        if(z<half-r&&y<=1.42){b.vx*=.28;b.vz*=.45;return this.result("goal");}
        return this.result(y>1.42?"high":"wide");
      }
    }
    step(dt,env){
      const {p,car}=env;
      if(!this.nearby(p)){if(this.phase!=="passing")this.reset();this.approach=true;return;}
      this.clock+=dt;this.age+=dt;this.kick=Math.max(0,this.kick-dt);this.pazKick=Math.max(0,this.pazKick-dt);
      if(this.round)return this.stepMatch(dt,env);
      const b=this.ball;
      if(this.phase==="collect"){
        const {hero,motion}=env;
        const yaw=Math.atan2(cook.x-b.x,cook.z-b.z),x=b.x-.39*Math.sin(yaw),z=b.z-.39*Math.cos(yaw);
        const dx=x-hero.x,dz=z-hero.z,d=Math.hypot(dx,dz),move=Math.min(d,dt*3.3);
        if(d>.015&&env.move(hero,dx/d*move,dz/d*move,.26)&&this.age>1){
          if(dist(hero,b)<.9){this.passFromFoot();return "strike";}
          this.phase="loose";this.age=0;return "blocked";
        }
        hero.y=env.floor(hero.x,hero.z);hero.yaw=yaw;motion.step(dt,move,0);
        if(d<.07){this.passFromFoot();return "strike";}return;
      }
      if(this.phase==="return"){
        roll(b,dt);if(this.age>=this.flight){
          this.phase="invited";this.age=0;this.ball=ballAt(mark.x,mark.z);this.book=read();this.book.returns=count(this.book.returns+1);save(this);return "returned";
        }return;
      }
      if(this.phase==="loose"){
        roll(b,dt);for(const v of env.traffic)if(contact(b,v))break;
        // A lost ball is replaced from the cooks' crate on a later visit.
        if(this.age>48||dist(b,mark)>33){this.reset();return "spare";}return;
      }
      const toward=car&&(mark.z-car.z)*Math.cos(car.yaw)*(car.speed||0)>0;
      if(this.approach&&env.free&&car&&toward&&Math.abs(car.speed)>2.5&&Math.abs(car.x-145)<7&&Math.abs(mark.z-car.z)<24){
        this.approach=false;this.phase="loose";this.age=0;this.ball=ballAt(cook.x+.36,cook.z);
        Object.assign(this.ball,{vx:-7.9,vz:-4.3,vy:.63});this.pazKick=.38;return "loose";
      }
      if(this.phase==="invited")return;
      const t=(this.age%3.6)/3.6,f=.5-.5*Math.cos(t*Math.PI*2);
      b.x=cook.x+.35+(line-1.3-cook.x)*f;b.z=cook.z+(mark.z-cook.z)*f;b.y=r+.14*Math.abs(Math.sin(t*Math.PI*2));
      b.spin+=dt*(f<.5?7:-7);this.keeper=.17*Math.sin(this.age*2);
    }
  }
  const words={goal:"Goal",saved:"Keeper saved it",crate:"Off the crate",high:"Over the waist",wide:"Wide"};
  function frame(cam,hero,rig){
    const sn=Math.sin(rig.yaw),cs=Math.cos(rig.yaw),back=2.32*rig.zoom;
    const pivot={x:hero.x,y:hero.y+1.36,z:hero.z};
    const eye={x:pivot.x-sn*back-cs*.87,z:pivot.z-cs*back+sn*.87,y:pivot.y+rig.elevation*2.3};
    const f=BayCamera.safeFraction(pivot,eye,rig.space.near(hero.x,hero.z,6));
    cam.x=pivot.x+(eye.x-pivot.x)*f;cam.y=pivot.y+(eye.y-pivot.y)*f;cam.z=pivot.z+(eye.z-pivot.z)*f;
    const dx=hero.x+sn*3.7-cam.x,dz=hero.z+cs*3.7-cam.z;
    cam.yaw=Math.atan2(dx,dz);cam.pitch=Math.atan2(hero.y+.68-cam.y,Math.hypot(dx,dz));cam.focal=1.26;
  }
  function football(m){
    const p=(lat,lon)=>[r*Math.cos(lat)*Math.cos(lon),r*Math.sin(lat),r*Math.cos(lat)*Math.sin(lon)];
    for(let i=0;i<6;i++)for(let j=0;j<10;j++){
      const a=(i/6-.5)*Math.PI,b=((i+1)/6-.5)*Math.PI,u=j*Math.PI/5+(i%2)*.19,v=(j+1)*Math.PI/5+(i%2)*.19;
      const d=((i+1)%2-i%2)*.19;
      m.quad(p(a,u),p(b,u+d),p(b,v+d),p(a,v),i===0||i===5||j%3===i%3?"#374f51":"#f3e5c4");
    }
  }
  function kit(m){
    for(const side of [-1,1]){
      const z=side*half;
      m.box(0,.05,z,.54,.08,.46,"#ac794d");
      for(const x of [-.22,.22])for(const d of [-.18,.18])m.box(x,.2,z+d,.065,.36,.065,"#a37148");
      for(const y of [.12,.26]){m.box(0,y,z-.21,.55,.09,.04,"#ca9969");m.box(0,y,z+.21,.55,.09,.04,"#b78b5f");}
      const cloth=side>0?"#ede3c6":"#dfb393";
      m.box(-.04,.372,z,.46,.025,.34,cloth);m.box(-.26,.245,z+.03,.028,.28,.32,cloth);
      for(const d of [-.07,.06])m.box(-.282,.24,z+d,.009,.24,.017,"#aa6553");
      m.box(-.282,.14,z+.06,.012,.064,.14,"#d59c7d");
    }
    for(let i=-5;i<=5;i++)m.box(0,.015,i*.32,.043,.012,.19,"#e3cfaa");
    m.box(mark.x-line,.015,0,.24,.012,.05,"#e3cfaa");m.box(mark.x-line,.018,0,.05,.014,.23,"#e3cfaa");
    m.box(.39,.48,-2.65,.08,.95,.075,"#926b4f");m.box(.40,.82,-2.65,.08,.48,.91,"#42554f");
    for(const z of [-2.94,-2.69,-2.44])m.box(.35,.83,z,.014,.018,.105,"#b7b69b");
  }
  function world(game,model,list,see,height,skin){
    if(!see(mark,65))return;
    const ground=height(line,mark.z);model("aprons/crates",kit);
    list.push(["aprons/crates",line,ground,mark.z,0]);
    const best=Math.max(game.book.scores.guest?.best||0,game.book.scores.frankie?.best||0);
    if(best){model("aprons/tally",m=>m.box(0,0,0,.019,.13,.032,"#f1d7a4"));
      for(let n=0;n<best;n++)list.push(["aprons/tally",line+.343,ground+.84,mark.z-2.94+n*.25,0,.13]);}
    const b=game.ball;model("aprons/ball",football);
    list.push(["aprons/ball",b.x,height(b.x,b.z)+b.y,b.z,0,b.spin,0]);
    const y=height(line-.67,mark.z+game.keeper);
    list.push([skin(3,"local",0,1),line-.67,y,mark.z+game.keeper,-Math.PI/2,0,game.dive*.53]);
    const waiting=!game.round&&game.phase==="passing",leg=game.pazKick>0||waiting&&game.age%3.6<.26;
    list.push([skin(1,"local",leg?2:0,game.phase==="loose"?1:0),cook.x,height(cook.x,cook.z),cook.z,game.phase==="loose"?-1.42:1.40]);
    if(game.round?.phase==="set"){
      model("aprons/aim",m=>{m.box(0,0,0,.28,.018,.033,"#ffd88e");m.box(0,0,0,.045,.02,.25,"#ffd88e");});
      list.push(["aprons/aim",line-.35,ground+.035,mark.z-game.round.aim*2.7,0]);
    }
  }
  function map(c,g,px,py,s,visible){
    if(!visible(px(mark.x),py(mark.z),12*s))return;
    const box=(x,z,w,d,col)=>{c.fillStyle=col;c.fillRect(px(x)-w*s/2,py(z)-d*s/2,w*s,d*s);};
    const dot=(x,z,size,col)=>{c.fillStyle=col;c.beginPath();c.arc(px(x),py(z),Math.max(size*s,1.3),0,2*Math.PI);c.fill();};
    box(line,mark.z,.09,half*2,"#e4d8b5");box(mark.x,mark.z,.26,.10,"#e4d8b5");
    for(const side of [-1,1]){box(line,mark.z+side*half,.57,.48,"#967653");box(line-.07,mark.z+side*half,.43,.32,side<0?"#dfb393":"#ede3c6");}
    for(const [x,z,col] of [[cook.x,cook.z,"#b06d51"],[line-.67,mark.z+g.keeper,"#45665c"]]){
      box(x,z,.40,.66,col);dot(x,z,.18,"#ac7e61");
    }
    const b=g.ball;dot(b.x,b.z,.19,"#584c43");dot(b.x,b.z+b.y*.38,.21,"#f3e5c4");dot(b.x+.066,b.z+b.y*.38,.074,"#415353");
    if(g.round?.phase==="set")box(line-.35,mark.z-g.round.aim*2.7,.29,.21,"#ffdc88");
  }
  window.BayApronGoal={Game,mark,cook,line,half,r,words,world,map,frame};
})();
