(() => {
  "use strict";
  const shop={x:-109,z:-17,name:"Portside Tire"},finish={x:0,z:44,name:"Cine Luna finish"};
  const marquee={x:11.55,y:4.22,z:44},limit=90,rivalName="Romy Vale";
  const job={id:"night-meet",name:"Portside After Dark",by:"Romy & Jules"};
  const point=([x,z])=>({x,z});
  const routes=[
    {name:"Foundry Run",gates:[[-72,0],[-72,72],[-144,72],[-144,144],[72,144],[72,0],[0,0],[0,44]].map(point)},
    {name:"Mercado Loop",gates:[[-72,0],[-72,-144],[72,-144],[72,-72],[0,-72],[0,44]].map(point)}
  ];
  const parked=[["coupe","#bc4b3e",-98,-6.1],["coupe","#397678",-119,-6.4],["hatch","#cba353",-128,-6.6]];
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const mix=(a,b,u)=>({x:a.x+(b.x-a.x)*u,z:a.z+(b.z-a.z)*u});
  function read(raw){
    const data={lastRoute:"",winner:"",ambientWinner:"",best:{},cover:null};
    if(!raw||typeof raw!=="object")return data;
    if(routes.some(r=>r.name===raw.lastRoute))data.lastRoute=raw.lastRoute;
    if(["you",rivalName,"Jules"].includes(raw.winner))data.winner=raw.winner;
    if([rivalName,"Jules"].includes(raw.ambientWinner))data.ambientWinner=raw.ambientWinner;
    for(const r of routes){const t=raw.best?.[r.name];if(Number.isFinite(t)&&t>0&&t<=limit)data.best[r.name]=t;}
    if(BayMeetPhoto.valid(raw.cover)&&raw.cover.score>0&&raw.cover.rival===rivalName&&routes.some(r=>r.name===raw.cover.route))data.cover=raw.cover;
    return data;
  }
  // Offset the straightaways first, then round the actual intersections. Both drivers
  // keep their own lane through a bend and reach the finish in the direction of travel.
  function racingLine(start,route,lane){
    const raw=[{x:start.x,z:start.z},{x:start.x+11,z:-2},...route.gates,{x:0,z:60}];
    const normals=raw.slice(1).map((p,i)=>{const a=raw[i],d=gap(a,p);return {x:(p.z-a.z)/d,z:(a.x-p.x)/d};});
    const centers=raw.map((p,i)=>{
      if(!i)return p;
      const a=normals[i-1],b=normals[i]||a,d=Math.max(.55,1+a.x*b.x+a.z*b.z);
      return {x:p.x+lane*(a.x+b.x)/d,z:p.z+lane*(a.z+b.z)/d};
    });
    const pts=[centers[0]],gatePoints=[];
    for(let i=1;i<centers.length-1;i++){
      const a=centers[i-1],b=centers[i],c=centers[i+1],r=Math.min(7.6,gap(a,b)*.30,gap(b,c)*.30);
      const entry=mix(b,a,r/gap(a,b)),out=mix(b,c,r/gap(b,c));
      pts.push(entry);
      for(let j=1;j<=10;j++){
        const u=j/10;pts.push(mix(mix(entry,b,u),mix(b,out,u),u));
        if(j===5&&i>=2)gatePoints.push(pts.at(-1));
      }
    }
    pts.push(centers.at(-1));
    let length=0;pts[0].at=0;
    for(let i=1;i<pts.length;i++){length+=gap(pts[i-1],pts[i]);pts[i].at=length;}
    function sample(d){
      let lo=1,hi=pts.length-1;
      while(lo<hi){const m=(lo+hi)>>1;if(pts[m].at<d)lo=m+1;else hi=m;}
      const b=pts[lo],a=pts[lo-1],u=Math.max(0,Math.min(1,(d-a.at)/(b.at-a.at||1)));
      return {...mix(a,b,u),yaw:Math.atan2(b.x-a.x,b.z-a.z)};
    }
    return {length,stripe:length-16,sample,gateDistances:gatePoints.map(p=>p.at)};
  }
  class Meet{
    constructor(){this.shop=shop;this.finish=finish;this.phase="sleep";this.role="";this.dusk=0;this.rival=this.jules=this.third=null;}
    spawn(make){[this.rival,this.jules,this.third]=parked.map(([kind,color,x,z])=>make(kind,color,x,z,Math.PI/2));
      for(const v of [this.rival,this.jules,this.third])v.meetCar=true;
      this.phase="idle";this.role="";this.passed=false;this.greeted=false;this.board=0;this.age=0;}
    clear(remove){
      for(const v of [this.rival,this.jules,this.third])if(v)remove(v);
      this.rival=this.jules=this.third=null;this.phase="sleep";this.role="";this.lines=null;this.shotPending=false;
    }
    flash(t){return this.phase==="idle"&&t%4.4<.78&&Math.floor(t*5)%2===0;}
    near(p){return this.rival&&Math.min(gap(p,this.rival),gap(p,this.jules))<115;}
    start(role,memory){
      const i=routes.findIndex(r=>r.name===memory.lastRoute);
      this.route=routes[(i+1)%routes.length];this.role=role;this.phase="countdown";
      this.count=3;this.clock=0;this.gate=0;this.photo=null;this.shots=0;this.shotPending=false;this.lastShot=-10;this.feedback="";
      this.lookYaw=0;this.lookPitch=0;this.aimX=.5;this.aimY=.5;this.hold=0;this.rivalTime=null;this.age=0;
      this.duel=(role==="ambient"&&this.route===routes[1]);
      this.pace=(this.route===routes[0]?14.5:15.7)+(memory.winner==="you"?.5:0);
      this.lines=[this.rival,this.jules].map((v,i)=>({v,line:racingLine(v,this.route,i?-2.5:2.5),at:0,speed:0,offset:0,avoid:0,scan:0,time:null}));
    }
    target(){if(this.role!=="driver")return finish;
      const q=this.route.gates[this.gate]||finish;
      if(this.gate>=this.route.gates.length-1)return finish;
      const a=this.gate?this.route.gates[this.gate-1]:shop,b=this.route.gates[this.gate+1];
      const right=(q.z-a.z)*(b.x-q.x)-(q.x-a.x)*(b.z-q.z)>0;
      return {...q,name:right?"Turn right":"Turn left",yaw:Math.atan2(b.x-q.x,b.z-q.z)};
    }
    leading(player){
      const runner=this.lines[0],line=runner.line,target=this.route.gates[this.gate]||finish,start=this.gate?this.route.gates[this.gate-1]:line.sample(0);
      const f=Math.max(0,Math.min(1,((player.x-start.x)*(target.x-start.x)+(player.z-start.z)*(target.z-start.z))/(gap(start,target)**2||1)));
      const a=this.gate?line.gateDistances[this.gate-1]:0,b=line.gateDistances[this.gate]??line.stripe;
      return a+(b-a)*f>=runner.at;
    }
    step(dt,player,traffic,clear){
      if(this.phase==="countdown"){
        this.count=Math.max(0,this.count-dt);
        this.board=Math.min(1,this.board+dt/1.65);
        if(this.count<=.00001)this.phase="running";
        return;
      }
      const coasting=this.phase==="coasting";
      if(this.phase!=="running"&&!coasting)return;
      this.clock+=dt;
      for(const [i,runner] of this.lines.entries()){
        if(i&&this.role==="driver")continue;
        const {v,line}=runner,old=runner.at,base=this.pace+(i?(this.duel?1.6:1):0);
        const here=line.sample(old),ahead=line.sample(old+12);
        const bend=Math.abs(Math.atan2(Math.sin(ahead.yaw-here.yaw),Math.cos(ahead.yaw-here.yaw)));
        const shoot=this.role==="photo";
        // The photographer gets a slow tracking shot through the lit block.
        const remaining=line.stripe-old;
        const curb=line.stripe+(i?-.4:8);
        let speed=base-Math.min(6,bend*4.8);
        if(shoot&&remaining<37)speed=Math.min(speed,3.2+Math.max(0,remaining-22)*.48);
        if(i&&shoot){
          const lead=this.lines[0],along=lead.at/lead.line.stripe*line.stripe;
          speed=Math.min(speed,Math.max(1.1,(along-old-8)*.9));
        }
        const stop=i&&!shoot?line.stripe+6:curb;
        if(old>=stop-.03)speed=0;
        else if(stop-old<12)speed=Math.min(speed,Math.sqrt(2*3.8*(stop-old)));
        runner.scan-=dt;
        if(runner.scan<=0&&traffic){
          runner.scan=.18;runner.avoid=0;
          const sn=Math.sin(here.yaw),cs=Math.cos(here.yaw);
          for(const other of traffic){
            if(other.meetCar||Math.abs(other.x-here.x)>17||Math.abs(other.z-here.z)>17)continue;
            const dx=other.x-here.x,dz=other.z-here.z,ahead=dx*sn+dz*cs,side=dx*cs-dz*sn;
            if(ahead<0||ahead>14||Math.abs(side)>2.2)continue;
            const shift=side>.25?-2.65:side<-.25?2.65:i?-2.65:2.65;
            for(const offset of [shift,-shift]){
              if(!clear||clear(v,here.x+cs*offset+sn*5,here.z-sn*offset+cs*5,here.yaw)){
                runner.avoid=offset;break;
              }
            }
            break;
          }
        }
        runner.offset+=(runner.avoid-runner.offset)*-Math.expm1(-3.5*dt);
        runner.speed=Math.max(0,runner.speed+Math.max(-7*dt,Math.min(4.6*dt,speed-runner.speed)));
        runner.at=Math.min(stop,old+runner.speed*dt);
        const q=line.sample(runner.at),delta=runner.at-old;
        const prevYaw=v.yaw;v.x=q.x+Math.cos(q.yaw)*runner.offset;v.z=q.z-Math.sin(q.yaw)*runner.offset;v.yaw=q.yaw;
        v.speed=delta/dt;v.vx=Math.sin(q.yaw)*v.speed;v.vz=Math.cos(q.yaw)*v.speed;
        v.wheelSpin=(v.wheelSpin||0)+delta/.32;v.steer=Math.max(-.48,Math.min(.48,Math.atan2(Math.sin(q.yaw-prevYaw),Math.cos(q.yaw-prevYaw))/dt*.22));
        v.brakes=runner.speed>speed+.3?1:0;
        if(runner.time===null&&runner.at>=line.stripe){runner.time=this.clock;if(!i)this.rivalTime=this.clock;}
      }
      if(coasting){if(this.lines[0].at>=this.lines[0].line.stripe+7.9)return "parked";return;}
      if(this.role==="driver"){
        if(this.clock>limit+.00001)return "timeout";
        const q=this.route.gates[this.gate];
        if(q&&player){
          const last=this.gate===this.route.gates.length-1;
          if(last?Math.abs(player.x-q.x)<9&&player.z>=q.z-1&&this.lastZ<q.z-1:gap(player,q)<11){
            this.gate++;if(last)return "finish";
          }
          this.lastZ=player.z;
        }
        if(this.clock>=limit)return "timeout";
      }else if(this.role==="photo"){
        if(this.rivalTime!==null&&this.lines[1].at>=this.lines[1].line.stripe-2.2)this.hold+=dt;
        if(this.hold>5||this.clock>=limit)return "finish";
      }else if(this.lines.every(r=>r.time!==null)||this.clock>=limit)return "ambient-finish";
    }
  }
  window.BayNightMeet={Meet,read,routes,marquee,rivalName,limit,job};
})();
