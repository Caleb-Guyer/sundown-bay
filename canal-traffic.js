/* Port Sol receiving runs and the two lanes of the canal circuit. */
(() => {
  "use strict";
  const yards=[
    {name:"SOL FREIGHT",z:-111,wall:-179.2,berth:-182.75,entry:-131,exit:-94},
    {name:"BAY ICE",z:-39,wall:-180.7,berth:-184.25,entry:-59,exit:-20}
  ];
  const pt=(x,z)=>({x,z});
  function west(z){
    const e=BayCityEdge,q=e.closest({x:-196,z},true);
    return e.along(q.s.a.at+q.s.length*q.t,-2.65);
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
  function service(v,dt){
    const r=v.freightRun;
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
    const entry=west(y.entry),exit=west(y.exit);
    return [entry,pt(y.wall-.1,y.z-12),pt(y.wall-.1,y.z+10),exit,pt(Math.min(entry.x,exit.x)-.3,y.z)];
  }
  function mesh(g){
    for(const y of yards){
      const p=apronPoints(y).map(p=>[p.x,.143,p.z]);
      for(let i=1;i<p.length-1;i++)g.tri(p[0],p[i],p[i+1],"#8c8e80");
      const x=y.wall-.05,z=y.z;
      g.box(x,1.80,z,.13,3.45,4.4,"#586760");
      for(let i=0;i<6;i++)g.box(x-.10,.57+i*.45,z,.08,.08,4.12,"#96a59a");
      g.box(x-.65,.48,z,1.3,.86,6,"#a4a08b");g.box(x-.78,3.73,z,1.8,.18,7.6,"#798d83");
      for(const dz of [-3.2,3.2])g.box(x-1,.54,z+dz,.23,.85,.28,"#e2b658");
      for(const dz of [-4.4,4.4])g.box(y.berth,.151,z+dz,2.42,.025,.14,"#d8c29b");
    }
  }
  function map(ctx){
    for(const y of yards){
      const p=apronPoints(y);ctx.beginPath();ctx.moveTo(p[0].x,p[0].z);
      for(const q of p.slice(1))ctx.lineTo(q.x,q.z);ctx.closePath();ctx.fillStyle="#8c8e80";ctx.fill();
      ctx.fillStyle="#798d83";ctx.fillRect(y.wall-1.65,y.z-3.8,1.8,7.6);
      ctx.fillStyle="#d8c29b";for(const dz of [-4.4,4.4])ctx.fillRect(y.berth-1.21,y.z+dz,2.42,.14);
    }
  }
  function cargo(g){
    for(const z of [-1.81,-1.15]){
      g.box(0,1.22,z,1.27,.56,.61,"#a68459");
      g.box(0,1.53,z,1.32,.09,.65,"#c3a475");
      for(const x of [-.39,.39])g.box(x,1.54,z,.083,.12,.67,"#58665a");
    }
  }
  function mapCargo(c,v,x,y,s){
    if(!v.freightRun?.loaded)return;
    c.save();c.translate(x,y);c.rotate(v.yaw);c.scale(s,s);
    for(const z of [1.15,1.81]){
      c.fillStyle="#c3a475";c.fillRect(-.66,z-.31,1.32,.62);
      c.fillStyle="#58665a";for(const u of [-.39,.39])c.fillRect(u-.04,z-.31,.08,.62);
    }
    c.restore();
  }
  window.BayCanalTraffic={yards,start,apron,service,approach,mesh,map,cargo,mapCargo};
})();
