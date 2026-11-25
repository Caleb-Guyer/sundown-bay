/* The payroll tin travels from the motel curb to the person who receives it. */
(() => {
  "use strict";
  const pickup={x:153.7,z:-13.7,yaw:-1.46};
  const stops={
    luna:{x:7.8,z:63.4,yaw:-1.7,name:"Marisol Vale",colors:["#b58366","#bf7960","#51484a"]},
    port:{x:-135.6,z:-76.3,yaw:-1.2,name:"Vic at the scales",colors:["#85634f","#798f80","#454d55"]}
  };
  const heldStages=new Set(["approach","enter","exit","deliver","pass"]);
  const colors=["#ad7c60","#496c73","#4d5258"];
  const actor=p=>({...p,y:0,motion:new BayPlayerMotion()});
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
        const at=this.aboard?BayDriving.world(stand,0,.74):stand;
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
    const to=r?body(view,list,r,"payroll-"+r.route,stops[r.route].colors):j;
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
    const hand=body(view,list,r,"payroll-"+run.route,stops[run.route].colors);
    model("payroll-tin",tin);list.push(["payroll-tin",hand.x,hand.y,hand.z,r.yaw]);
  }
  function map(ctx,run,px,py,s,visible){
    const j=run.jules,r=run.receiver||run.waiting;
    function person(a,palette){
      if(!visible(px(a.x),py(a.z),2*s))return;
      ctx.save();ctx.translate(px(a.x),py(a.z));ctx.rotate(a.yaw);
      ctx.fillStyle=palette[1];ctx.fillRect(-.24*s,-.12*s,.48*s,.29*s);
      ctx.fillStyle=palette[0];ctx.beginPath();ctx.arc(0,0,Math.max(.9,.16*s),0,Math.PI*2);ctx.fill();ctx.restore();
    }
    if(j)person(j,colors);if(r)person(r,stops[run.route||r.route].colors);
    const at=run.pass>.55?r:j,p=BayDriving.world(at,.22,.18);
    ctx.fillStyle="#c39e65";ctx.fillRect(px(p.x)-s*.13,py(p.z)-s*.08,Math.max(1,s*.26),Math.max(1,s*.16));
  }
  window.BayPayroll={Ride,world,map,counter,clerkWorld,stops};
})();
