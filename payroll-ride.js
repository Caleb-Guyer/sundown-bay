/* The payroll tin travels from the motel curb to the person who receives it. */
(() => {
  "use strict";
  const pickup={x:153.7,z:-13.7,yaw:-1.46};
  const stops={
    luna:{x:9.55,z:61.65,yaw:-Math.PI/2,name:"Marisol Vale",colors:["#b58366","#bf7960","#51484a"]},
    port:{x:-133.55,z:-81.05,yaw:-Math.PI/2,name:"Vic at the scales",colors:["#85634f","#798f80","#454d55"]}
  };
  const heldStages=new Set(["approach","enter","exit","deliver","pass"]);
  const colors=["#ad7c60","#496c73","#4d5258"];
  const actor=p=>({...p,y:0,motion:new BayPlayerMotion(),shirt:(p.colors||colors)[1],skin:(p.colors||colors)[0]});
  function counterTop(route){
    const r=stops[route];return {x:r.x-.69,z:r.z,y:route==="port"?1.033:.925};
  }
  function counters(g,solids){
    for(const [route,r] of Object.entries(stops)){
      const p=counterTop(route),x=p.x,z=p.z,port=route==="port";
      if(solids)solids.push({x,z,w:.54,d:1.30,bottom:0,top:port?1.46:.93,streetProp:true});
      const leg=port?"#517077":"#775746";
      for(const a of [-.18,.18])for(const b of [-.54,.54])g.box(x+a,.47,z+b,.06,.79,.06,leg);
      g.box(x,.81,z,.54,.085,1.30,port?"#aab3a9":"#80756b");
      if(port){
        g.box(x,.9,z,.42,.096,.58,"#455e61");g.box(x,.951,z,.44,.032,.55,"#c6cfc2");
        g.box(x+.04,.98,z+.43,.12,.29,.11,leg);
        const face=x-.06,yc=1.19,zc=z+.43,radius=.22;
        for(let i=0;i<16;i++){
          const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
          g.tri([face,yc,zc],[face,yc+Math.sin(a)*radius,zc+Math.cos(a)*radius],[face,yc+Math.sin(b)*radius,zc+Math.cos(b)*radius],"#eadab4");
        }
        for(let i=0;i<9;i++){const a=.16+i*.35;
          g.box(face-.004,yc+Math.sin(a)*.18,zc+Math.cos(a)*.18,.01,.018,.015,"#415352");}
        g.pole([face-.018,yc,zc],[face-.018,yc+.14,zc-.063],.01,"#a13e32",4);
      }else{
        g.box(x,.88,z+.43,.32,.06,.39,"#334e54");
        for(let i=0;i<4;i++){g.box(x-.016+i*.009,.918+i*.007,z+.40+i*.009,.25,.012,.15,"#e2c998");}
        g.box(x,.87,z-.46,.25,.04,.16,"#ab5c50");
      }
    }
  }
  class Ride {
    constructor(){this.jules=actor(pickup);this.stage="curb";this.seat=0;this.car=null;this.delay=0;this.pass=0;}
    get holding(){return heldStages.has(this.stage);}
    get aboard(){return this.stage==="ride";}
    seeClerk(route,ground){
      if(!route){this.waiting=null;return;}
      if(this.waiting?.route===route)return;
      const p=actor(stops[route]);p.route=route;p.y=ground(p.x,p.z);this.waiting=p;
    }
    stop(){if(this.car)this.car.passengerDoor=0;}
    step(dt,car,dest,plan,ground){
      const a=this.jules,m=a.motion,v=this.car;
      if(this.stage==="curb"||this.stage==="ride"){
        if(this.aboard)BayCarAccess.pose(v,1,1,a,m,ground,dt,true);
        else{a.y=ground(a.x,a.z);m.step(dt,0,0);}
        if(!car||Math.abs(car.speed)>1.4||this.aboard&&(!dest||car!==v))return;
        if(!this.aboard&&Math.hypot(car.x-pickup.x,car.z-pickup.z)>9)return;
        if((this.delay-=dt)>0)return;
        this.delay=.35;
        const stand=this.aboard?stops[dest]:a;
        const at=this.aboard?BayDriving.world(stand,0,1.42):stand;
        const approach=plan(car,false,at,1);
        if(!approach){this.blocked=true;return;}
        this.blocked=false;BayDriving.settle(car);
        if(this.aboard){
          this.route=dest;this.seeClerk(dest,ground);this.receiver=this.waiting;
          this.path=approach.points.slice(0,-1).reverse().concat(at);this.stage="exit";return "unloading";
        }
        this.car=car;this.path=approach.points;this.stage="approach";return "approaching";
      }
      if(this.stage==="approach"||this.stage==="deliver"){
        if(!BayCarAccess.walkPath(a,m,this.path,dt,ground,2.8))return;
        if(this.stage==="approach")this.stage="enter";
        else{this.stage="pass";this.receiver.yaw=Math.atan2(a.x-this.receiver.x,a.z-this.receiver.z);}
      }else if(this.stage==="enter"||this.stage==="exit"){
        const entering=this.stage==="enter";
        this.seat=Math.max(0,Math.min(1,this.seat+(entering?dt:-dt)/1.5));
        BayCarAccess.pose(v,1,this.seat,a,m,ground,dt,true);
        if(entering&&this.seat===1){this.stage="ride";this.delay=0;return "boarded";}
        if(!entering&&!this.seat){m.ride=null;m.reset();this.stage="deliver";}
      }else if(this.stage==="pass"){
        const r=this.receiver;
        this.pass=Math.min(1,this.pass+dt/1.05);
        const yaw=Math.atan2(r.x-a.x,r.z-a.z);
        a.yaw+=Math.atan2(Math.sin(yaw-a.yaw),Math.cos(yaw-a.yaw))*(-Math.expm1(-dt*10));
        m.handTarget={x:.16,y:1.05,z:.32,weight:1};r.motion.handTarget={x:-.12,y:1.04,z:.30,weight:1};
        m.step(dt,0,0);r.motion.step(dt,0,0);
        if(this.pass===1){this.stage="receipt";return "received";}
      }
    }
  }
  function tin(g){
    g.box(0,0,0,.31,.13,.22,"#578981");g.box(0,.072,0,.324,.027,.232,"#c39e65");
    g.box(0,.087,-.016,.25,.007,.13,"#8d4141");g.box(-.021,.092,-.016,.13,.006,.042,"#e7c88d");
    g.box(.08,-.009,.114,.053,.047,.011,"#c8ae83");
  }
  const rigs=new Map();
  function body(view,list,actor,key,palette){
    let mesh=rigs.get(key);
    if(!mesh){mesh=new BayPlayerMesh(palette,"local");rigs.set(key,mesh);view.add(key,mesh,true);}
    if(mesh.update(actor.motion))view.updateAnimated(key);
    list.push([key,actor.x,actor.y,actor.z,actor.yaw]);
    const limb=mesh.sides[1],hand=limb.forearm.map(limb.handPivot,[]);
    return {...BayDriving.world(actor,hand[0],hand[2]),y:actor.y+hand[1]-.076};
  }
  function world(view,model,list,see,run){
    const a=run.jules,r=run.receiver||run.waiting;
    if(!see(a,76)&&(!r||!see(r,76)))return;
    const j=body(view,list,a,"payroll-jules",colors);
    if(r)body(view,list,r,"payroll-"+r.route,stops[r.route].colors);
    const to=run.receiver?counterTop(run.route):j;
    const seat=a.motion.ride?.seat||0;
    if(seat){const lap=BayDriving.world(a,0,.22);j.x+=(lap.x-j.x)*seat;j.z+=(lap.z-j.z)*seat;
      j.y+=(a.y+a.motion.ride.seatY+.23-j.y)*seat;}
    const t=Math.min(1,Math.max(0,(run.pass-.25)*2.5));
    model("payroll-tin",tin);list.push(["payroll-tin",j.x+(to.x-j.x)*t,j.y+(to.y-j.y)*t,j.z+(to.z-j.z)*t,a.yaw]);
  }
  function counter(route,ground){
    const s=stops[route],r=actor(s);
    r.y=ground(r.x,r.z);r.motion.handTarget={x:.16,y:1.1,z:.28,weight:1};r.motion.step(.1,0,0);
    return {route,receiver:r,pass:1};
  }
  function clerkWorld(view,model,list,see,run){
    const r=run.receiver;if(!see(r,58))return;
    body(view,list,r,"payroll-"+run.route,stops[run.route].colors);const hand=counterTop(run.route);
    model("payroll-tin",tin);list.push(["payroll-tin",hand.x,hand.y,hand.z,r.yaw]);
  }
  function mapCounters(ctx,px,py,s,visible){
    for(const [route,r] of Object.entries(stops)){
      const p=counterTop(route);if(!visible(px(p.x),py(p.z),2*s))continue;
      const x=px(p.x),z=py(p.z);
      ctx.fillStyle=route==="port"?"#779291":"#8f7157";ctx.fillRect(x-.27*s,z-.65*s,.54*s,1.3*s);
      ctx.fillStyle=route==="port"?"#c6cabe":"#e8cc9e";ctx.fillRect(x-.18*s,z-.30*s,.36*s,.56*s);
      ctx.fillStyle=route==="port"?"#f0deaf":"#9b5a4e";ctx.fillRect(x-.16*s,z-.52*s,.32*s,.12*s);
    }
  }
  function map(ctx,run,px,py,s,visible,personSprite){
    const j=run.jules,r=run.receiver||run.waiting;
    function person(a,palette){
      if(!visible(px(a.x),py(a.z),2*s))return;
      if(a===j&&(a.motion.ride?.seat||0)>.65){
        ctx.fillStyle=palette[0];ctx.beginPath();ctx.arc(px(a.x),py(a.z),Math.max(.9,.15*s),0,Math.PI*2);ctx.fill();
      }else personSprite(ctx,a,px(a.x),py(a.z),s,false);
    }
    if(j)person(j,colors);if(r)person(r,stops[run.route||r.route].colors);
    const p=run.pass>.55?counterTop(run.route):BayDriving.world(j,.22,.18);
    ctx.fillStyle="#c39e65";ctx.fillRect(px(p.x)-s*.13,py(p.z)-s*.08,Math.max(1,s*.26),Math.max(1,s*.16));
  }
  window.BayPayroll={Ride,world,map,mapCounters,counters,counter,clerkWorld,stops};
})();
