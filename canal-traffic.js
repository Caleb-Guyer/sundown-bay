/* Port Sol receiving runs and the two lanes of the canal circuit. */
(() => {
  "use strict";
  const yards=[
    {name:"SOL FREIGHT",z:-111,wall:-179.2,berth:-182.75,entry:-131,exit:-94},
    {name:"BAY ICE",z:-39,wall:-180.7,berth:-184.25,entry:-59,exit:-20}
  ];
  const pt=(x,z)=>({x,z});
  const dispatch={id:"canal-haul",x:-182.75,z:-123,name:"Sol Freight · Canal Road deliveries"};
  const job={id:dispatch.id,name:"Canal Road freight",by:"Sol Freight",pay:125};
  const bays=yards.map((yard,i)=>({x:yard.berth,z:yard.z,name:i?"Bay Ice receiving":"Sol Freight loading bay"}));
  const cycleTime=8.5;
  function pickup(v){return v?.kind==="stepside"&&!v.freightRun?.loaded;}
  function linedUp(v,i){
    const b=bays[i];
    return Math.abs(v.x-b.x)<1.35&&Math.abs(v.z-b.z)<2&&Math.cos(v.yaw)>.91;
  }
  class Delivery{
    constructor(){
      this.truck=null;this.stop=0;this.handling={loaded:false,berth:-1,dwell:0};
      const route=freightRoute();
      this.drive=route.slice(route.findIndex(p=>p.yard===0),route.findIndex(p=>p.yard===1)+1);
    }
    target(driver,spare){
      if(this.truck&&driver!==this.truck)return {x:this.truck.x,z:this.truck.z,name:"Your freight truck"};
      if(!this.truck&&!pickup(driver))return {x:spare.x,z:spare.z,name:"Sol Freight Stepside"};
      return bays[this.stop];
    }
    guide(driver){
      if(this.stop!==1||driver!==this.truck)return null;
      let next=1,closest=Infinity;
      for(let i=1;i<this.drive.length;i++){
        const a=this.drive[i-1],b=this.drive[i],dx=b.x-a.x,dz=b.z-a.z;
        const t=Math.max(0,Math.min(1,((driver.x-a.x)*dx+(driver.z-a.z)*dz)/(dx*dx+dz*dz)));
        const gap=Math.hypot(driver.x-a.x-dx*t,driver.z-a.z-dz*t);
        if(gap<closest){closest=gap;next=i;}
      }
      if(closest>16)return null;
      const points=[driver,...this.drive.slice(next)];
      let meters=0;for(let i=1;i<points.length;i++)meters+=Math.hypot(points[i].x-points[i-1].x,points[i].z-points[i-1].z);
      return {points,meters,turn:next<=3?"Leave the yard and head north on Canal Road":next<=5?"Take the next Bay Ice driveway on the right":"Park northbound under the hoist"};
    }
    step(dt,driver,occupied){
      const r=this.handling,ready=driver&&(this.truck?driver===this.truck:pickup(driver))&&
        linedUp(driver,this.stop)&&Math.abs(driver.speed)<.65;
      if(!ready){
        if(r.berth>=0){r.berth=-1;r.dwell=0;r.loaded=this.stop===1;}
        return;
      }
      if(r.berth<0){
        if(occupied(this.stop,driver))return;
        this.truck=driver;driver.canalTicket=r;r.berth=this.stop;r.dwell=cycleTime;
        BayDriving.settle(driver);
      }
      if(service(driver,dt,r))return;
      if(this.stop===0){this.stop=1;return "loaded";}
      this.release();return "delivered";
    }
    release(){if(this.truck)delete this.truck.canalTicket;this.handling.berth=-1;}
  }
  function west(z,offset=-2.65){
    const e=BayCityEdge,q=e.closest({x:-196,z},true);
    return e.along(q.s.a.at+q.s.length*q.t,offset);
  }
  function circuit(direction){
    const e=BayCityEdge,points=e.points.map(p=>e.along(p.at,-2.65*direction));
    // Round the north junction into the beachfront return lane.
    const x=144+direction*-2.65;
    points.pop();points.push(pt(x-3,187-2.65*direction),pt(x,184));
    if(direction===1)points.push(pt(x,145),pt(x,72),pt(x,0),pt(x,-72),pt(x,-144));
    else points.push(pt(x,149),pt(145.6,144),pt(140,141.35),pt(80,141.35),pt(76,139.6),pt(74.65,136),
      pt(74.65,72),pt(74.65,0),pt(74.65,-72),pt(74.65,-137),pt(76,-140),pt(80,-141.35),
      pt(138,-141.35),pt(144,-143),pt(x,-148));
    return direction===1?points:points.reverse();
  }
  function freightRoute(){
    const path=[west(-138)];
    for(const [i,y] of yards.entries()){
      path.push(west(y.entry),pt(y.berth-5,y.entry+5),pt(y.berth,y.z-9),
        {...pt(y.berth,y.z),yard:i},pt(y.berth,y.z+6),pt(y.berth-3,y.z+10),west(y.exit));
      if(i===0)path.push(west(-72));
    }
    path.push(west(-9),pt(-194,-4.8),pt(-190,-2.65),pt(-153,-2.65),pt(-148,-4),pt(-146.65,-8),
      pt(-146.65,-72),pt(-146.65,-137),pt(-148,-140),pt(-152,-141.35),pt(-188,-141.35),pt(-192,-140));
    return path;
  }
  function start(add,fleet){
    const cw=circuit(1),ccw=circuit(-1),freight=freightRoute();
    function vehicle(path,i,kind,color,pace){
      const a=path[i],j=(i+1)%path.length,b=path[j];
      const v=add(kind,color,a.x,a.z,Math.atan2(b.x-a.x,b.z-a.z),path,pace);
      v.corner=j;v.speed=pace;v.canalTraffic=true;fleet.add(v);return v;
    }
    vehicle(cw,6,"hatch","#739c96",8.4);vehicle(cw,32,"coupe","#c78c72",9.3);
    vehicle(ccw,20,"estate","#afa489",8.1);vehicle(ccw,38,"hatch","#7895a4",9.0);
    for(const [i,loaded,color] of [[0,false,"#759b9a"],[9,true,"#b78663"]]){
      const v=vehicle(freight,i,"stepside",color,6.9);v.freightRun={loaded,berth:-1,dwell:0};
    }
  }
  function apron(x,z){
    return yards.some(y=>z>y.entry-2&&z<y.exit+2&&x>=-201&&x<y.wall-.1);
  }
  function service(v,dt,r=v.freightRun){
    if(r.berth<0)return false;
    const before=r.dwell;r.dwell=Math.max(0,before-dt);
    if(before>3.5&&r.dwell<=3.5)r.loaded=r.berth===0;
    if(r.dwell===0){r.berth=-1;return false;}
    v.brakes=1;v.speed=v.vx=v.vz=0;return true;
  }
  function approach(v){
    const y=yards.find(y=>Math.abs(v.z-y.z)<21&&v.x<y.wall&&v.x>-201);
    return y?3.4:v.pace;
  }
  function apronPoints(y){
    return [west(y.entry,-5.77),pt(y.wall-.1,y.z-12),pt(y.wall-.1,y.z+10),west(y.exit,-5.77),west(y.z,-5.77)];
  }
  function mesh(g){
    g.box(dispatch.x,.075,-125.5,3.9,.13,12.6,"#8c8e80");
    for(const side of [-1,1])g.box(dispatch.x+side*1.55,.146,-129,.12,.018,5.8,"#d8c29b");
    for(const y of yards){
      const p=apronPoints(y).map(p=>[p.x,.143,p.z]);
      for(let i=1;i<p.length-1;i++)g.tri(p[0],p[i],p[i+1],"#8c8e80");
      const x=y.wall-.05,z=y.z;
      g.box(x,1.80,z,.13,3.45,4.4,"#586760");
      for(let i=0;i<6;i++)g.box(x-.10,.57+i*.45,z,.08,.08,4.12,"#96a59a");
      g.box(x-.65,.48,z,1.3,.86,6,"#a4a08b");g.box(x-.78,3.73,z,1.8,.18,7.6,"#798d83");
      const beam=y.wall-y.berth+.55,middle=y.wall-beam*.5;
      g.box(middle,3.54,z-1.48,beam,.19,.23,"#a78753");
      g.box(middle,3.43,z-1.48,beam,.07,.48,"#c7a467");
      g.pole([x,4.07,z-1.48],[y.berth+.5,3.58,z-1.48],.06,"#7d8c7e",5);
      for(const dz of [-3.2,3.2])g.box(x-1,.54,z+dz,.23,.85,.28,"#e2b658");
      for(const dz of [-4.4,4.4])g.box(y.berth,.151,z+dz,2.42,.025,.14,"#d8c29b");
    }
  }
  function map(ctx){
    ctx.fillStyle="#8c8e80";ctx.fillRect(dispatch.x-1.95,-131.8,3.9,12.6);
    ctx.fillStyle="#d8c29b";for(const side of [-1,1])ctx.fillRect(dispatch.x+side*1.55-.06,-131.9,.12,5.8);
    for(const y of yards){
      const p=apronPoints(y);ctx.beginPath();ctx.moveTo(p[0].x,p[0].z);
      for(const q of p.slice(1))ctx.lineTo(q.x,q.z);ctx.closePath();ctx.fillStyle="#8c8e80";ctx.fill();
      ctx.fillStyle="#798d83";ctx.fillRect(y.wall-1.65,y.z-3.8,1.8,7.6);
      ctx.fillStyle="#d8c29b";for(const dz of [-4.4,4.4])ctx.fillRect(y.berth-1.21,y.z+dz,2.42,.14);
    }
  }
  function cargo(g){
    for(const z of [-.33,.33]){
      g.box(0,.28,z,1.27,.56,.61,"#a68459");
      g.box(0,.59,z,1.32,.09,.65,"#c3a475");
      for(const x of [-.39,.39])g.box(x,.60,z,.083,.12,.67,"#58665a");
    }
  }
  function lift(v){
    const r=v.canalTicket||v.freightRun;if(!r||(!v.path&&!v.canalTicket)||r.berth<0)return null;
    const y=yards[r.berth],bed=BayDriving.world(v,0,-1.48),t=cycleTime-r.dwell;
    const smooth=(a,b)=>{const u=Math.min(1,Math.max(0,(t-a)/(b-a)));return u*u*(3-2*u);};
    const loading=r.berth===0;
    const reach=loading?smooth(1.6,4.15)-smooth(6,7.9):smooth(0,1.3)-smooth(2.9,4.3);
    const hoisted=loading?smooth(.8,1.6)-smooth(4.15,5):smooth(2.1,2.9)-smooth(4.3,5);
    const moving=t>=(loading?.8:2.1)&&t<5;
    const rest=loading?.91:.95;
    const hook=loading?2.65-1.10*smooth(0,.8)+hoisted*.91+1.10*smooth(5,5.95):
      2.65-1.06*smooth(1.3,2.1)+hoisted*.91+1.06*smooth(5,5.95);
    return {x:(y.wall-.69)*(1-reach)+bed.x*reach,z:(y.z-1.48)*(1-reach)+bed.z*reach,
      hook,base:rest+hoisted*.91,moving,atDock:loading?t<.8:t>=5,bedVisible:r.loaded&&!moving,
      dockX:y.wall-.69,dockZ:y.z-1.48};
  }
  function world(list,model,v,ground,body){
    const k=lift(v);
    model("canal-crates",cargo);
    if(k){
      model("canal-hoist",g=>{g.box(0,0,0,.54,.32,.47,"#d3a85c");g.box(0,-.17,0,.30,.11,.31,"#5c6960");});
      model("canal-rope",g=>g.box(0,-.16,0,.044,.32,.044,"#555e54"));
      model("canal-hook",g=>g.box(0,.058,0,.17,.15,.19,"#737a6d"));
      list.push(["canal-hoist",k.x,3.26,k.z],["canal-hook",k.x,k.hook,k.z]);
      for(let h=3.1;h>k.hook;h-=.32)list.push(["canal-rope",k.x,Math.max(h,k.hook+.32),k.z]);
      if(k.moving)list.push(["canal-crates",k.x,k.base,k.z]);
      if(k.atDock)list.push(["canal-crates",k.dockX,.91,k.dockZ]);
    }
    if(k?k.bedVisible:(v.canalTicket||v.freightRun).loaded){
      const bed=BayDriving.world(v,0,-1.48);list.push(["canal-crates",bed.x,ground+.94,bed.z,v.yaw,body.pitch,body.lean]);
    }
  }
  function mapCargo(c,v,x,y,s){
    if(!v.canalTicket&&!v.freightRun)return;
    const k=lift(v);
    function stack(cx,cy,yaw){
      c.save();c.translate(cx,cy);c.rotate(yaw);c.scale(s,s);
      for(const z of [-.33,.33]){
      c.fillStyle="#c3a475";c.fillRect(-.66,z-.31,1.32,.62);
      c.fillStyle="#58665a";for(const u of [-.39,.39])c.fillRect(u-.04,z-.31,.08,.62);
      }
      c.restore();
    }
    if(k?.moving)stack(x+(k.x-v.x)*s,y-(k.z-v.z)*s,0);
    if(k?.atDock)stack(x+(k.dockX-v.x)*s,y-(k.dockZ-v.z)*s,0);
    if(k?k.bedVisible:(v.canalTicket||v.freightRun).loaded){const bed=BayDriving.world(v,0,-1.48);stack(x+(bed.x-v.x)*s,y-(bed.z-v.z)*s,v.yaw);}
  }
  window.BayCanalTraffic={yards,bays,dispatch,job,Delivery,pickup,linedUp,cycleTime,start,apron,service,approach,mesh,map,lift,world,mapCargo};
})();
