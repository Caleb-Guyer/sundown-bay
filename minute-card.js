/* Marisol Vale's old regularity rally cards. The navigator punches each leg separately. */
(() => {
  "use strict";
  const key="sundownBay.minuteCard.v1",clocks=BayWakeClock.clocks;
  const names={linen:"Linen round",luna:"Last picture"};
  const sites=i=>({...clocks[i].post,z:clocks[i].post.z+.95,yaw:-1.67,colors:["#ba8167","#bc694c","#485460"]});
  const gate=(x,z,name,seconds)=>({x,z,name,seconds,kind:"route-clock"});
  function course(from,route){
    const dest=clocks[1-from];
    return [gate(144,from?28:-58,"Ocean Drive chalk",9),
      route==="luna"?gate(0,44,"Cine Luna marquee",from?25:27):gate(72,-30,"Biscayne linen round",from?17:20),
      gate(144,dest.line.z,dest.name+" road clock",route==="luna"?(from?34:25):(from?20:23))];
  }
  const signed=cc=>cc===0?"dead on":(Math.abs(cc)/100).toFixed(2)+" s "+(cc<0?"early":"late");
  const total=card=>card.marks.reduce((sum,n)=>sum+Math.abs(n),0);
  const valid=card=>card&&(card.from===0||card.from===1)&&Object.hasOwn(names,card.route)&&typeof card.plate==="string"&&
    Array.isArray(card.marks)&&card.marks.length===3&&card.marks.every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=8640000);
  function read(){
    let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch{}
    const best={};
    for(const from of [0,1])for(const route of Object.keys(names)){
      const id=from+"/"+route,c=raw?.best?.[id];if(valid(c)&&c.from===from&&c.route===route)best[id]=c;
    }
    return {dock:raw?.dock===0?0:1,best,last:valid(raw?.last)?raw.last:null};
  }
  let book=read();
  window.addEventListener?.("storage",e=>{if(e.key===key||e.key===null)book=read();});
  function write(next){
    book=next;try{localStorage.setItem(key,JSON.stringify(next));}catch{}
  }
  function invite(dock){const next=read();next.dock=dock;write(next);}
  function file(r){
    const card={from:r.from,route:r.route,plate:BayStreetCars.plateFor(r.vehicle),marks:r.marks.slice()};
    if(!valid(card))return;
    const next=read(),id=card.from+"/"+card.route;
    if(!next.best[id]||total(card)<total(next.best[id]))next.best[id]=card;
    next.last=card;next.dock=1-r.from;write(next);return card;
  }
  function passenger(i){
    const p=new BayPayroll.Ride(sites(i));p.film=true;p.empty=true;
    return p;
  }
  class Run{
    constructor(from,vehicle,ride){
      this.from=from;this.vehicle=vehicle;this.ride=ride;
      this.phase="boarding";this.marks=[];this.leg=0;this.elapsed=0;
      this.prev=null;this.warned=false;
    }
    get target(){return this.phase==="running"?this.gates[this.leg]:this.phase==="park"||this.phase==="pin"?clocks[1-this.from].post:clocks[this.from].post;}
    choose(route){
      if(this.phase!=="choose"||!Object.hasOwn(names,route))return false;
      this.route=route;this.gates=course(this.from,route);this.phase="ready";return true;
    }
    step(dt,driver,ground,plan){
      const p=this.ride,v=this.vehicle,a=p.jules;
      if(this.phase==="boarding"){
        if(p.step(dt,driver===v?v:null,null,plan,ground)==="boarded"){this.phase="choose";return "choose";}
        return;
      }
      if(this.phase==="pin"){
        if(p.stage==="deliver"){
          if(BayCarAccess.walkPath(a,a.motion,p.path,dt,ground,2.8)){p.stage="pin";this.pinTime=0;}
        }else if(p.stage==="pin"){
          this.pinTime+=dt;a.yaw=Math.atan2(this.target.x-a.x,this.target.z-a.z);
          a.motion.handTarget={x:.15,y:1.06,z:.31,weight:Math.min(1,this.pinTime*4)};a.motion.step(dt,0,0);
          if(this.pinTime>=.9){p.stage="posted";return "posted";}
        }else p.step(dt,v,null,plan,ground);
        return;
      }
      BayCarAccess.pose(v,1,1,a,a.motion,ground,dt,true);
      if(this.phase==="park"){
        if(driver!==v||Math.abs(v.speed)>1||Math.hypot(v.x-this.target.x,v.z-this.target.z)>9)return;
        if((p.delay-=dt)>0)return;p.delay=.4;
        const stop=sites(1-this.from),door=plan(v,false,stop,1);p.blocked=!door;
        if(door){
          BayDriving.settle(v);p.path=door.points.slice(0,-1).reverse().concat(stop);p.stage="exit";this.phase="pin";return "pin";
        }
        return;
      }
      if(this.phase==="choose")return;
      const nose=(v.footprint||bayCarLayout(v.kind)).halfLength-.11;
      const frontX=v.x+nose*Math.sin(v.yaw),frontZ=v.z+nose*Math.cos(v.yaw);
      if(this.phase==="ready"){
        if(driver!==v||Math.abs(v.speed)<.6)return;
        this.phase="running";this.prev={x:frontX,z:frontZ};return "start";
      }
      this.elapsed+=dt;
      if(driver!==v){this.prev=null;return;}
      const g=this.target,prev=this.prev;this.prev={x:frontX,z:frontZ};
      if(prev&&Math.hypot(frontX-prev.x,frontZ-prev.z)<=dt*75+.15&&prev.z!==frontZ){
        const t=(g.z-prev.z)/(frontZ-prev.z);
        if(t>0&&t<=1&&Math.abs(prev.x+(frontX-prev.x)*t-g.x)<=6.8){
          const spare=dt*(1-t);this.marks.push(Math.round((this.elapsed-spare-g.seconds)*100));
          this.elapsed=spare;this.warned=false;this.leg++;
          if(this.leg===this.gates.length)this.phase="park";return "punch";
        }
      }
      if(!this.warned&&this.elapsed>=g.seconds-4){this.warned=true;return "count";}
    }
  }
  function sheet(canvas,from,route,marks,elapsed=null){
    if(!canvas?.getContext)return;
    const c=canvas.getContext("2d");if(!c)return;
    const w=canvas.width,h=canvas.height,rows=course(from,route);
    c.save();c.scale(w/300,h/106);c.fillStyle="#e8d6ab";c.fillRect(0,0,300,106);
    c.fillStyle="#a65434";c.fillRect(0,0,6,106);c.fillRect(0,0,300,19);
    c.font="bold 10px monospace";c.fillStyle="#fff1cb";c.fillText("VALE  /  "+names[route].toUpperCase(),12,13);
    c.fillText("EARLY   0   LATE",189,13);c.font="11px monospace";
    rows.forEach((r,i)=>{
      const y=34+i*25;c.fillStyle="#37483f";c.fillText(r.name.replace(" road clock",""),11,y);c.fillText(r.seconds+"s",153,y);
      c.fillStyle="#b2a481";c.fillRect(10,y+7,279,1);
      for(let n=-4;n<=4;n++){c.fillStyle=n?"#a79b7d":"#805348";c.fillRect(238+n*10,y-(n?4:8),1,n?5:12);}
      const live=i===marks.length&&elapsed!==null,d=live?elapsed-r.seconds:marks[i]/100;
      if(Number.isFinite(d)){
        const x=238+Math.max(-4.65,Math.min(4.65,d))*10;
        c.fillStyle=live?"#a5442c":"#364139";c.beginPath();c.arc(x,y-2,live?3.5:4.1,0,2*Math.PI);c.fill();
        if(!live){c.fillStyle="#c0af88";c.fillRect(x-1.5,y-4,3,1);}
      }
    });
    c.fillStyle="#786b54";c.font="8px monospace";c.fillText("M. VALE   /   SHORE TIMING ASSOCIATION",11,102);c.restore();
  }
  function world(model,list,see,r){
    if(r?.ride.aboard&&see(r.vehicle,46)){
      const a=r.ride.jules,lap=BayDriving.world(a,0,.26);
      model("vale/lap-card",g=>{g.box(0,0,0,.25,.017,.18,"#bb8a58");g.box(0,.012,0,.218,.01,.16,"#e9d7ac");
        g.box(0,.022,.036,.19,.009,.019,"#b35c36");g.cyl(-.082,.027,-.029,.037,.037,.027,10,"#776c50");});
      list.push(["vale/lap-card",lap.x,a.y+(a.motion.ride?.seatY||.4)+.22,lap.z,a.yaw,-.17]);
    }
    if(book.last){
      const p=clocks[1-book.last.from].post;
      if(see(p,44)){
        model("vale/pinned-card",g=>{g.box(0,0,0,.024,.31,.51,"#e9d7ac");g.box(-.016,.105,0,.01,.048,.50,"#b35c36");
          for(let i=0;i<3;i++)g.box(-.017,.044-i*.066,.015,.015,.015,.38,"#8a8365");g.box(-.028,.13,.185,.028,.045,.038,"#594b39");});
        list.push(["vale/pinned-card",p.x-.205,1.0,p.z,0,0,-.055]);
      }
    }
    if(!r||r.phase!=="running"&&r.phase!=="ready")return;
    const g=r.gates[r.leg];if(!see(g,78))return;
    model("vale/timing-stripe",m=>{
      for(let i=-5;i<=5;i++)m.box(i*1.09,0,(i%3)*.025,.81,.016,.22,"#db9359");
      for(const side of [-1,1]){m.box(side*5.6,.45,0,.08,.9,.08,"#baaa83");
        m.box(side*5.6,.8,0,.48,.23,.05,"#bd643e");m.box(side*5.6,.78,-.031,.23,.028,.014,"#f2dfb1");}
    });list.push(["vale/timing-stripe",g.x,.07,g.z,0]);
  }
  function map(c,r,px,py,s,visible){
    if(book.last){const p=clocks[1-book.last.from].post,x=px(p.x),y=py(p.z);
      if(visible(x,y,8)){c.fillStyle="#c37749";c.fillRect(x-3,y+3,6,3);}}
    if(!r||r.phase!=="ready"&&r.phase!=="running")return;
    const g=r.gates[r.leg];if(!visible(px(g.x),py(g.z),8*s))return;
    c.fillStyle="#e6a05e";for(let i=-5;i<=5;i++)c.fillRect(px(g.x+i*1.09),py(g.z),Math.max(1,.81*s),Math.max(1.5,.22*s));
  }
  window.BayMinuteCard={names,sites,course,signed,total,invite,file,passenger,Run,sheet,world,map,get book(){return book;}};
})();
