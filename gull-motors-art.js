/* Biscayne Street's used-car lot. The sectional doors run in the tracks above the cars. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const front=53.72,back=44.94,originZ=39.4,slab=.142,deskZ=47.22;
  const pos=(x,z,yaw=0,y=slab)=>({x,z,y,yaw});
  const bays=[27.6,33.15,38.7];
  const stalls=bays.map((z,i)=>({...pos(49.43,z,-pi/2),id:i,door:pos(front,z,-pi/2)}));
  const display={cayo:{...pos(59.36,43.62,pi/2),kind:"cayo"},marea:{...pos(59.36,50.55,pi/2),kind:"marea"}};
  const road={...pos(69.52,33.15,pi,.04),dir:2};
  const desk=pos(54.88,deskZ,-pi/2);
  const site={
    id:"gull-motors",kind:"motor-sales",name:"Gull Street Motors",street:"Biscayne Street",
    x:desk.x,z:desk.z,center:pos(54.6,originZ),desk,counter:desk,clerk:pos(51.94,deskZ,pi/2,.18),
    chair:pos(52.0,50.92,-pi/2,.18),visitor:pos(54.79,45.91,-pi/2),assessor:pos(60.28,46.16,-pi*.75),
    sidewalk:pos(64.3,deskZ,-pi/2,.13),approach:pos(59.55,deskZ,-pi/2),
    display,stalls,thresholds:stalls.map(b=>b.door),road,join:road,
    displayRoad:Object.fromEntries(Object.entries(display).map(([k,p])=>[k,{...road,z:p.z}])),
    apron:stalls.map(b=>pos(59.5,b.z,-pi/2)),marker:{...desk,kind:"motor-sales",name:"Gull Street Motors"}
  };
  site.handover={clerk:pos(54.20,46.14,pi/2),customer:pos(55.08,46.14,-pi/2)};
  site.staffWalk=[site.clerk,pos(51.94,44.64,pi,.18),pos(54.20,44.64,pi/2),site.handover.clerk];
  site.customerWalk=[site.desk,site.handover.customer];
  const inside=(x,z,x0,x1,z0,z1)=>x>=x0&&x<=x1&&z>=z0&&z<=z1;
  function floor(x,z){
    if(!inside(x,z,44.66,65.13,24.08,54.32))return null;
    if(inside(x,z,44.94,54.16,42.24,53.46))return .18;
    const f=clamp(Math.min((65.13-x)/.96,(z-24.08)/.32,(54.32-z)/.32),0,1);
    return .093+(slab-.093)*f;
  }
  const rect=(x,z,w,d,bottom,top)=>({x,z,w,d,bottom,top,streetProp:true});
  const parkingStart=24.825,parkingEnd=41.475;
  const blocks=[
    rect(back,33.15,.21,16.87,.085,3.68),
    rect(49.32,parkingStart,8.97,.22,.085,3.70),rect(49.32,parkingEnd,8.97,.22,.085,3.70),
    ...[parkingStart,30.375,35.925,parkingEnd].map(z=>rect(front,z,.30,.33,.085,3.75)),
    rect(45.08,47.88,.21,11.15,.085,3.62),rect(49.41,42.27,8.89,.20,.085,3.61),
    rect(49.41,53.47,8.89,.20,.085,3.61),rect(53.67,51.74,.20,3.47,.085,3.61),
    rect(53.67,42.78,.20,.86,.085,3.61),
    rect(53.052,47.22,1.14,3.94,.17,1.15),rect(51.06,50.10,.32,1.64,.17,2.40),
    rect(51.96,50.97,.69,.66,.17,.99),
    rect(45.51,48.45,.68,5.54,.17,1.12),rect(45.38,38.79,.63,4.14,.13,1.03),
    rect(63.46,53.40,.50,.52,.09,6.1),
    ...Object.values(display).map(p=>rect(55.84,p.z,.22,.62,.10,.98))
  ];
  const cameraBlocks=[
    rect(49.59,33.15,9.57,17.46,3.70,4.12),rect(49.57,47.86,9.71,11.92,3.55,3.94),
    rect(54.04,47.88,3.29,12.07,3.29,3.64),rect(53.79,33.15,.37,17.0,3.24,4.12),
    rect(62.88,53.40,3.53,.42,3.99,6.36),rect(53.20,47.95,.42,7.91,4.18,5.25)
  ];
  function stallAt(x,z){
    if(x<back+.1||x>front+.22)return -1;
    return bays.findIndex(y=>Math.abs(z-y)<2.61);
  }
  function interiorVisible(p){
    return !!p&&inside(p.x,p.z,43.9,65.65,22.7,55.65);
  }
  function occludesCar(v,from){
    return !!v&&!interiorVisible(from)&&stallAt(v.x,v.z)>=0;
  }
  const panelHeight=.619,trackRise=2.73,bend=.54,curve=bend*pi/2,travel=trackRise+curve+.04;
  function track(s){
    if(s<=trackRise)return {x:front,y:slab+s,tilt:0};
    const a=Math.min(pi/2,(s-trackRise)/bend),run=Math.max(0,s-trackRise-curve);
    return {x:front-bend*(1-Math.cos(a))-run,y:slab+trackRise+bend*Math.sin(a),tilt:a};
  }
  function doorBlock(i,amount=0){
    return rect(front,bays[i],.23,5.21,track(clamp(amount||0,0,1)*travel).y,3.51);
  }
  function stepDoors(doors,dt,subjects){
    const people=Array.isArray(subjects)?subjects:[subjects];
    for(let i=0;i<3;i++){
      const old=clamp(doors[i]||0,0,1),z=bays[i],d=old>0?3.76:3.00;
      const occupied=people.some(p=>p&&p.x>back-.15&&p.x<(old>0?65.2:63.85)&&Math.abs(p.z-z)<d);
      const delta=Math.min(Math.max(0,dt)*(occupied?.87:.66),1);
      doors[i]=clamp(old+(occupied?delta:-delta),0,1);
    }
    return doors;
  }
  const c={petrol:"#275360",navy:"#28434e",ink:"#344746",teal:"#4b7b78",aqua:"#8fb4a8",
    mint:"#b5c6b1",cream:"#e9dbb8",paper:"#f6eccb",copper:"#b75e43",sienna:"#a34e3d",saffron:"#dbab55",
    metal:"#88958e",silver:"#b1b9aa",zinc:"#687e7c",glass:"#567c80",gasket:"#3c504e",
    concrete:"#b1aba0",shopFloor:"#a8ada2",scar:"#898d82",joist:"#657c72",wood:"#957b5c",tile:"#bcab8b"};
  const to=(x,y,z)=>[x-front,y,z-originZ];
  function box(g,x,y,z,w,h,d,col,yaw=0){g.box(x-front,y,z-originZ,w,h,d,col,yaw);}
  function pipe(g,a,b,r,col,sides=6){g.pole(to(...a),to(...b),r,col,sides);}
  function quad(g,a,b,d,e,color){g.quad(to(...a),to(...b),to(...d),to(...e),color);}
  const ground=y=>(x,z)=>to(x,y,z),east=x=>(u,y)=>to(x,y,u),south=z=>(u,y)=>to(u,y,z);
  function face(g,f,x,y,w,h,color){
    g.quad(f(x-w/2,y-h/2),f(x+w/2,y-h/2),f(x+w/2,y+h/2),f(x-w/2,y+h/2),color);
  }
  function polygon(g,f,v,color){
    for(let i=1;i<v.length-1;i++)g.tri(f(...v[0]),f(...v[i]),f(...v[i+1]),color);
  }
  function line(g,f,x,y,X,Y,w,col){
    const dx=X-x,dy=Y-y,n=Math.hypot(dx,dy);if(n<.0001)return;
    const u=-dy*w*.5/n,v=dx*w*.5/n;
    g.quad(f(x+u,y+v),f(X+u,Y+v),f(X-u,Y-v),f(x-u,y-v),col);
  }
  function stroke(g,f,points,w,col){for(let i=1;i<points.length;i++)line(g,f,...points[i-1],...points[i],w,col);}
  // Narrow enamel-stencil lettering. On the street face the sign reads south to north.
  const letters={
    A:["04 19 39 54","04 00","54 50","14 44"],B:["00 09 39 47 46 35 05","35 44 42 30 00"],C:["48 39 19 07 02 10 30 41"],
    D:["00 09 28 47 42 20 00"],E:["49 09 00 40","05 35"],F:["49 09 00","05 35"],G:["48 39 19 07 02 10 30 42 45 25"],
    H:["00 09","40 49","05 45"],I:["09 49","29 20","00 40"],K:["00 09","49 04","16 40"],L:["09 00 40"],
    M:["00 09 24 49 40"],N:["00 09 40 49"],O:["19 39 47 42 30 10 02 07 19"],P:["00 09 39 47 46 35 05"],
    R:["00 09 39 47 46 35 05","25 40"],S:["48 39 19 07 06 14 34 42 30 10 01"],T:["09 49","29 20"],
    U:["09 02 10 30 42 49"],V:["09 20 49"],W:["09 10 24 30 49"],Y:["09 24 49","24 20"],
    "0":["19 39 47 42 30 10 02 07 19"],"1":["17 29 20","00 40"],"2":["08 19 39 47 46 02 00 40"],
    "3":["08 19 39 47 36 24","36 43 31 10 01"],"4":["08 04 44","39 30"],"5":["49 09 05 35 43 42 30 11 01"],
    "6":["48 39 19 07 02 10 30 42 44 35 05"],"7":["09 49 10"],"8":["19 39 47 36 14 02 10 30 42 34 16 07 19"],
    "9":["45 15 06 07 19 39 47 42 30 11"],"-":["04 44"]
  };
  function textAt(g,f,word,u,y,h,col,advance=.70){
    const step=h*advance,w=h*.44,start=u-(word.length-1)*step/2-w/2;
    for(let j=0;j<word.length;j++)for(const s of letters[word[j]]||[]){
      const p=s.split(" ").map(q=>[start+j*step+w*Number(q[0])/4,y+(Number(q[1])/9-.5)*h]);
      stroke(g,f,p,h*.119,col);
    }
  }
  function gull(g,f,u,y,size,ink){
    // Wings of unequal span fold into the tapered body. Kept legible from either direction at road speed.
    const mark=(v,col)=>polygon(g,f,v.map(([x,z])=>[u+x*size,y+z*size]),col);
    mark([[-1.55,.23],[-.56,.09],[.01,-.20],[-.15,-.27],[-.74,-.06]],ink);
    mark([[-.15,-.27],[.05,-.01],[.68,.51],[1.33,.64],[.78,.35],[.24,-.13]],ink);
    mark([[-.22,-.13],[.16,-.08],[.55,-.01],[.72,-.06],[.25,-.17],[-.12,-.28]],ink);
  }
  function paving(g,detail){
    face(g,ground(slab-.005),54.85,originZ,20.38,30.63,c.concrete);
    quad(g,[64.10,slab-.004,24.15],[65.15,.095,24.15],[65.15,.095,54.30],[64.10,slab-.004,54.30],c.concrete);
    face(g,ground(slab+.001),49.28,33.15,8.97,16.77,c.shopFloor);
    if(detail){
      // Two concrete pours, expansion seams, old chalk and two welded trench grates.
      for(const z of [25.04,33.81,42.57,51.37]){
        line(g,ground(slab+.002),54.05,z,64.05,z+.035,.026,c.scar);
        line(g,ground(slab+.003),54.1,z+.042,61.9,z+.063,.014,"#c8bfb0");
      }
      for(const x of [55.45,60.39])line(g,ground(slab+.002),x,24.24,x-.025,54.2,.023,c.scar);
      for(const z of [26.75,37.97]){
        face(g,ground(slab+.005),54.25,z,.31,2.55,c.zinc);
        for(let k=-5;k<=5;k++)face(g,ground(slab+.008),54.25,z+k*.221,.225,.074,c.ink);
      }
      for(const z of [26.43,34.71,37.55]){
        const v=ground(slab+.003);
        stroke(g,v,[[46.03,z],[47.15,z+.18],[48.80,z-.11],[50.19,z+.24]],.018,c.scar);
        for(const u of [-.72,.72])line(g,v,53.32,z+u,51.91,z+u+.05,.044,"#91958a");
      }
    }
    const paint=ground(slab+.008);
    for(const [i,z] of bays.entries()){
      for(const side of [-1,1]){
        const a=z+2.10*side;
        line(g,paint,45.42,a,53.56,a,.084,"#d5c392");line(g,paint,53.87,a,56.14,a,.098,c.cream);
        line(g,paint,56.14,a,56.14,a-.59*side,.09,c.cream);
      }
      for(const z0 of [z-1.10,z+1.10])line(g,paint,45.41,z0,45.41,z0+.43,.095,c.saffron);
      const bayInk=(x,y)=>to(54.87-y,slab+.016,z+x);
      textAt(g,bayInk,String(i+1),0,0,.68,c.cream);
    }
    for(const b of Object.values(display)){
      const f=ground(slab+.014);
      for(const side of [-1,1])for(const end of [-1,1]){
        const x=b.x+end*2.81,z=b.z+side*1.79;
        line(g,f,x,z,x-.81*end,z,.095,c.paper);line(g,f,x,z,x,z-.54*side,.095,c.paper);
      }
      if(detail){
        for(const side of [-1,1])line(g,f,58.00,b.z+.75*side,60.53,b.z+.77*side,.059,"#a29f91");
      }
    }
  }
  function garage(g,detail){
    box(g,back,1.89,33.15,.21,3.58,16.88,c.mint);
    for(const z of [parkingStart,parkingEnd])box(g,49.32,1.87,z,8.98,3.56,.21,c.mint);
    box(g,49.23,3.79,33.15,9.17,.23,17.05,c.silver);
    box(g,front+.026,3.73,33.15,.33,.93,17.05,c.petrol);
    box(g,front+.247,3.335,33.15,.23,.135,17.06,c.copper);
    box(g,front+.226,4.187,33.15,.34,.086,17.14,c.cream);
    for(const z of [parkingStart,30.375,35.925,parkingEnd]){
      box(g,front,1.82,z,.30,3.49,.32,c.cream);
      box(g,front+.166,.54,z,.037,.79,.34,c.teal);
      if(detail){face(g,east(front+.190),z,.72,.285,.07,c.saffron);face(g,east(front+.191),z,.84,.285,.045,c.saffron);}
    }
    textAt(g,east(front+.202),"GULL STREET",33.15,3.76,.51,c.paper,.76);
    for(const [i,z] of bays.entries()){
      const left=z-2.32;
      box(g,front+.19,3.45,left,.063,.34,.54,c.cream);
      textAt(g,east(front+.231),String(i+1),left,3.459,.25,c.petrol);
      if(!detail)continue;
      for(const side of [-1,1]){
        const zz=z+2.62*side;
        box(g,front-.045,1.49,zz,.155,2.74,.075,c.zinc);
        for(let k=0;k<4;k++){
          const a=track(trackRise+k*curve/4),b=track(trackRise+(k+1)*curve/4);
          pipe(g,[a.x,a.y,zz],[b.x,b.y,zz],.037,c.metal,5);
        }
        box(g,front-2.10,slab+trackRise+bend,zz,3.18,.072,.072,c.zinc);
        for(const x of [front-.85,front-3.35])box(g,x,3.56,zz,.044,.30,.043,c.metal);
      }
      box(g,49.11,3.50,z,.60,.26,.29,c.gasket);box(g,51.28,3.51,z,3.87,.050,.046,c.zinc);
      pipe(g,[49.11,3.36,z],[49.11,2.89,z],.011,c.wood,4);box(g,49.11,2.88,z,.099,.07,.061,c.sienna);
      box(g,49.5,3.63,z-1.87,1.75,.09,.22,c.zinc);box(g,49.5,3.565,z-1.87,1.56,.033,.13,c.paper);
      box(g,back+.13,2.24,z,.031,.78,1.68,c.petrol);
      textAt(g,east(back+.152),"BAY "+(i+1),z,2.235,.34,c.cream);
    }
    if(!detail)return;
    // Rub strip, soft blockwork joints, exposed joists and the service bench at the north wall.
    box(g,back+.125,.65,33.15,.04,.58,16.65,c.teal);
    for(const z of [parkingStart,parkingEnd])box(g,49.43,.65,z+(z<33?.123:-.123),8.78,.58,.037,c.teal);
    for(const y of [.98,1.44,1.91,2.38,2.86]){
      face(g,east(back+.115),33.15,y,16.49,.015,"#a2b1a3");
      const phase=y===1.44||y===2.38?.51:0;
      for(let u=25.65+phase;u<41.12;u+=1.34)face(g,east(back+.118),u,y+.231,.013,.43,"#a3b3a2");
    }
    for(const z of [27.59,33.15,38.70]){
      box(g,49.38,3.695,z,8.77,.14,.11,c.joist);
      for(const h of [3.53,3.77])box(g,49.38,h,z,8.79,.046,.23,c.metal);
    }
    box(g,45.41,1.03,38.81,.68,.10,4.04,c.wood);
    for(const z of [36.91,40.71])for(const x of [45.14,45.66])box(g,x,.56,z,.065,.87,.065,c.zinc);
    box(g,45.30,.53,39.36,.46,.59,1.63,c.copper);
    for(const y of [.39,.56,.74])face(g,east(45.538),39.36,y,1.56,.027,c.gasket);
    for(const y of [.43,.60,.77])face(g,east(45.542),39.35,y,.35,.035,c.silver);
    for(let j=0;j<4;j++){
      const z=37.30+j*.25,h=[.34,.24,.31,.22][j];g.cyl(45.38-front,1.09+h*.5,z-originZ,.09,.10,h,7,[c.sienna,c.teal,c.paper,c.saffron][j]);
    }
    for(const z of [27.02,38.4]){box(g,46.44,3.99,z,1.44,.23,.93,c.zinc);box(g,46.44,4.11,z,1.56,.061,.99,c.silver);}
  }
  function office(g,detail){
    // A broad open service window faces the display court. A separate opening at its south jamb reaches the office.
    box(g,49.44,.152,47.85,9.20,.057,11.47,"#c3b59b");
    box(g,45.08,1.81,47.88,.20,3.29,11.15,c.aqua);
    for(const z of [42.27,53.47])box(g,49.41,1.83,z,8.89,3.34,.20,c.aqua);
    box(g,53.67,1.8,42.78,.20,3.25,.86,c.aqua);
    box(g,53.67,.66,51.74,.20,.99,3.47,c.teal);
    box(g,53.67,2.09,51.74,.13,1.86,3.47,c.glass);
    for(const z of [50.04,51.78,53.46])box(g,53.752,2.04,z,.082,1.84,.07,c.mint);
    box(g,53.75,2.82,51.74,.05,.053,3.37,c.cream);
    box(g,53.67,3.25,47.88,.21,.53,11.35,c.mint);
    box(g,49.55,3.76,47.86,9.64,.28,11.86,c.cream);
    box(g,49.52,3.94,47.87,9.78,.09,11.96,c.teal);
    box(g,54.12,3.46,47.88,3.24,.25,12.00,c.mint);
    box(g,55.76,3.53,47.88,.13,.25,12.1,c.copper);
    box(g,55.85,3.65,47.88,.16,.062,12.18,c.cream);
    for(const z of [44.75,51.02])box(g,53.20,4.15,z,.16,.56,.14,c.zinc);
    box(g,53.20,4.755,47.95,.42,1.04,7.91,c.petrol);
    box(g,53.20,5.29,47.95,.47,.047,7.97,c.cream);
    gull(g,east(53.421),45.03,4.70,.58,c.saffron);
    textAt(g,east(53.423),"MOTORS",48.64,4.77,.75,c.paper,.87);
    box(g,53.052,.596,deskZ,1.06,.83,3.90,c.teal);
    box(g,53.052,1.061,deskZ,1.14,.112,3.95,c.wood);
    box(g,53.63,1.06,deskZ,.023,.085,3.95,c.cream);
    box(g,53.597,.48,deskZ,.032,.075,3.84,c.aqua);
    box(g,51.06,1.29,50.10,.30,2.19,1.62,c.wood);
    face(g,east(51.217),50.10,1.77,1.47,.92,c.petrol);
    textAt(g,east(51.22),"KEYS",50.10,2.056,.18,c.paper,.78);
    for(let i=0;i<3;i++){
      const z=49.62+i*.47;
      box(g,51.255,1.769,z,.09,.047,.052,c.silver);textAt(g,east(51.223),String(i+1),z,1.89,.11,c.saffron);
    }
    if(!detail)return;
    for(let x=45.65;x<53.45;x+=.82)face(g,ground(.182),x,47.87,.017,10.98,"#a99c84");
    for(let z=42.62;z<53.42;z+=.82)face(g,ground(.182),49.50,z,8.52,.017,"#a99c84");
    box(g,45.47,.74,48.45,.64,1.10,5.54,c.teal);box(g,45.46,1.33,48.45,.72,.084,5.70,c.wood);
    for(const z of [46.41,47.69,48.97,50.25]){box(g,45.804,.78,z,.061,.82,1.12,c.aqua);box(g,45.85,1.01,z+.34,.06,.075,.16,c.zinc);}
    for(let i=0;i<5;i++){
      const z=46.36+i*.29;box(g,45.50,1.62,z,.31,.49,.17,[c.copper,c.navy,c.cream,c.saffron,c.teal][i]);
      box(g,45.661,1.70,z,.014,.063,.13,c.paper);
    }
    // Kitty's old Cayo showroom print still hangs above the filing cabinet.
    box(g,45.236,2.225,46.80,.081,1.14,1.73,c.wood);
    const mount=east(45.283),paper=east(45.286),ink=east(45.295);
    face(g,mount,46.8,2.225,1.57,1.00,c.paper);face(g,paper,46.8,2.29,1.39,.66,c.aqua);
    face(g,east(45.291),46.8,2.11,1.39,.28,c.saffron);
    polygon(g,ink,[[46.17,2.135],[46.20,2.235],[46.45,2.262],[46.63,2.375],[46.87,2.38],
      [47.03,2.286],[47.36,2.244],[47.42,2.186],[47.35,2.14]],c.sienna);
    for(const z of [46.44,47.16]){const circ=(r,col,x)=>{const f=east(x);for(let i=0;i<10;i++){const a=i*tau/10,b=(i+1)*tau/10;
      g.tri(f(z,2.146),f(z+r*Math.cos(a),2.146+r*Math.sin(a)),f(z+r*Math.cos(b),2.146+r*Math.sin(b)),col);}};
      circ(.085,c.ink,45.298);circ(.037,c.silver,45.301);
    }
    textAt(g,east(45.292),"1972",46.8,1.873,.128,c.petrol,.86);
    box(g,45.24,2.12,48.51,.066,.68,.49,c.metal);
    face(g,east(45.281),48.51,2.11,.427,.59,c.paper);face(g,east(45.283),48.51,2.327,.424,.092,c.copper);
    for(let row=0;row<3;row++)for(let d=0;d<5;d++)face(g,east(45.286),48.38+d*.064,2.181-row*.097,.036,.029,c.zinc);
    const ticket=east(53.604);
    face(g,ticket,deskZ-.26,.83,1.69,.25,c.cream);
    textAt(g,east(53.611),"SALES",deskZ-.26,.835,.162,c.petrol,.86);
    box(g,53.02,1.15,46.12,.46,.079,.33,c.navy);
    box(g,52.89,1.245,46.11,.19,.14,.31,c.metal);
    for(const z of [46.00,46.085,46.17,46.24])box(g,53.113,1.197,z,.12,.024,.047,c.cream);
    box(g,52.97,1.131,48.59,.48,.022,.37,c.paper,.11);box(g,52.99,1.15,48.61,.40,.012,.31,"#d3c4a2",.075);
    pipe(g,[53.09,1.165,48.58],[53.15,1.165,48.82],.013,c.sienna,5);
    for(const sign of [-1,1])for(const leg of [-1,1])pipe(g,[52.0+sign*.225,.61,50.99+leg*.219],[52.0+sign*.27,.19,50.99+leg*.247],.031,c.zinc);
    box(g,51.98,.63,50.98,.65,.10,.62,c.copper);
    box(g,51.66,.838,50.98,.081,.45,.62,c.copper);
    // Blinds break up the large western office window from the street.
    for(let i=0;i<5;i++)face(g,east(53.742),51.74,2.14+i*.098,3.28,.027,"#97b1a4");
    for(const z of [43.08,52.75])pipe(g,[53.66,3.04,z],[55.22,3.33,z],.039,c.zinc);
    for(const z of [44.83,50.62]){box(g,54.45,3.30,z,.72,.07,.24,c.zinc);box(g,54.45,3.252,z,.56,.030,.15,c.paper);}
    for(let j=0;j<3;j++){const x=47.69+j*.46;box(g,x,3.97,51.62,.28,.09,1.16,c.zinc);}
  }
  function roadside(g,detail){
    box(g,63.46,.225,53.4,.53,.23,.56,c.concrete);
    box(g,63.46,3.18,53.4,.30,5.86,.31,c.silver);
    for(const x of [63.28,63.64])box(g,x,2.32,53.40,.073,3.96,.34,c.petrol);
    box(g,62.90,4.38,53.40,3.45,.66,.31,c.copper);
    box(g,62.90,4.05,53.40,3.49,.052,.36,c.cream);
    box(g,62.86,5.24,53.40,3.58,1.16,.38,c.mint);
    for(const side of [-1,1]){
      const signFace=(u,y)=>to(62.86-side*u,y,53.4+side*.20);
      polygon(g,signFace,[[-1.76,4.72],[-1.44,5.78],[1.77,5.78],[1.56,4.72]],c.navy);
      const ink=(u,y)=>to(62.86-side*u,y,53.4+side*.207);
      textAt(g,ink,"GULL",0,5.23,.56,c.paper,.83);
      const strip=(u,y)=>to(62.90-side*u,y,53.4+side*.160);
      textAt(g,strip,"MOTORS",0,4.40,.31,c.paper,.89);
      const crown=(u,y)=>to(62.95-side*u,y,53.4+side*.05);
      gull(g,crown,0,5.98,1.10,c.saffron);
    }
    for(const b of Object.values(display)){
      box(g,55.84,.21,b.z,.28,.135,.67,c.zinc);box(g,55.84,.54,b.z,.09,.67,.09,c.petrol);
      box(g,55.84,.95,b.z,.094,.40,.74,c.cream);
    }
    if(!detail)return;
    for(const y of [1.27,2.92])box(g,63.65,y,53.4,.063,.27,.21,c.copper);
    for(const z of [24.91,41.46]){
      box(g,front+.206,2.74,z,.122,.23,.16,c.navy);face(g,east(front+.270),z,2.748,.093,.10,c.saffron);
    }
    // A single short span of cloth bunting hangs above the sales glass clear of both test drives.
    const points=[[55.68,3.54,42.05],[56.61,3.32,43.75],[57.48,3.21,45.52],[58.40,3.25,47.27],
      [59.80,3.46,49.54],[61.18,3.74,51.34],[63.46,4.19,53.40]];
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i];pipe(g,a,b,.012,c.zinc,4);
      for(let k=0;k<2;k++){
        const f=.20+k*.51,f2=f+.21,at=(u,dy=0,x=0)=>to(a[0]+(b[0]-a[0])*u+x,a[1]+(b[1]-a[1])*u+dy,a[2]+(b[2]-a[2])*u);
        const col=[c.copper,c.cream,c.teal][(i+k)%3];g.tri(at(f),at(f2),at(f+.145,-.37-.05*(i%2),.057),col);
      }
    }
  }
  function garageLamps(g){
    for(const z of bays){
      face(g,ground(3.544),49.50,z-1.87,1.54,.111,"#ffe5a2");
      face(g,east(front+.248),z,3.302,3.60,.026,"#ffd49d");
    }
    for(const z of [44.83,50.62])face(g,ground(3.227),54.45,z,.61,.115,"#ffe0a0");
    for(const s of [-1,1])face(g,(u,y)=>to(u,y,53.4+s*.162),62.9,4.698,3.23,.035,"#ffd498");
    gull(g,east(53.431),45.03,4.70,.58,"#ffce82");
    textAt(g,east(53.433),"MOTORS",48.64,4.77,.75,"#ffe1a1",.87);
    for(const side of [-1,1]){
      const title=(u,y)=>to(62.86-side*u,y,53.4+side*.213),strip=(u,y)=>to(62.90-side*u,y,53.4+side*.168);
      textAt(g,title,"GULL",0,5.23,.56,"#ffedc2",.83);textAt(g,strip,"MOTORS",0,4.40,.31,"#ffdeb0",.89);
    }
    textAt(g,east(front+.213),"GULL STREET",33.15,3.76,.51,"#ffdda3",.76);
  }
  function build(g,detail){
    paving(g,detail);garage(g,detail);office(g,detail);roadside(g,detail);
  }
  function roadsideShell(g,closed){
    face(g,ground(.14),54.85,39.17,20.42,30.36,c.concrete);
    face(g,ground(.151),49.31,33.15,8.74,16.55,c.shopFloor);
    for(const z of bays)for(const k of [-1,1])face(g,ground(.15),54.10,z+2.10*k,4.08,.10,c.paper);
    for(const p of Object.values(display))for(const k of [-1,1])face(g,ground(.15),p.x,p.z+k*1.79,5.58,.082,c.cream);
    box(g,49.32,3.82,33.15,9.14,.60,16.98,c.mint);
    if(closed)box(g,49.28,1.83,33.15,8.89,3.40,16.80,c.teal);
    else{
      face(g,east(back),33.15,1.84,16.83,3.45,c.mint);
      for(const z of [parkingStart,parkingEnd])face(g,south(z),49.3,1.84,8.89,3.45,c.mint);
    }
    for(const z of [parkingStart,30.375,35.925,parkingEnd])box(g,front,1.80,z,.27,3.34,.31,c.cream);
    for(const z of bays)if(closed)face(g,east(front+.041),z,1.67,4.83,.15,c.glass);
    face(g,east(front+.077),33.15,3.73,17.01,.86,c.petrol);
    face(g,east(front+.08),33.15,3.36,17.07,.12,c.copper);
    textAt(g,east(front+.083),"GULL STREET",33.15,3.76,.51,c.paper,.76);
    box(g,49.49,1.85,47.86,8.98,3.47,11.44,c.aqua);
    face(g,east(53.988),47.88,1.83,10.96,2.04,c.glass);
    face(g,east(53.99),47.88,.91,10.96,.21,c.cream);
    box(g,49.57,3.78,47.86,9.67,.30,11.86,c.cream);box(g,54.10,3.51,47.88,3.23,.215,12.0,c.copper);
    box(g,53.2,4.755,47.95,.37,1.04,7.91,c.petrol);textAt(g,east(53.401),"MOTORS",48.63,4.77,.75,c.paper,.87);
    gull(g,east(53.401),45.04,4.70,.58,c.saffron);
    box(g,63.46,2.22,53.40,.32,4.12,.32,c.petrol);box(g,62.87,4.42,53.40,3.46,.70,.29,c.copper);
    box(g,62.86,5.26,53.40,3.54,1.08,.31,c.navy);
    for(const sign of [-1,1]){
      const f=(x,y)=>to(62.86-sign*x,y,53.40+sign*.166);
      textAt(g,f,"GULL",0,5.23,.56,c.cream,.83);gull(g,f,.08,6,1.04,c.saffron);
    }
  }
  function doorPanel(g,index){
    const height=panelHeight+.019,width=5.225;
    if(index===2){
      g.box(0,-.189,0,.091,.237,width,c.teal);g.box(0,.196,0,.092,.222,width,c.teal);
      const panes=[-1.51,0,1.51];
      let start=-width/2;
      for(const z of panes){
        const lo=z-.58;g.box(0,0,(start+lo)/2,.093,.179,lo-start,c.teal);start=z+.58;
        g.box(-.021,0,z,.046,.170,1.158,"#486463");
        g.quad([.004,-.070,z-.54],[.004,-.035,z-.54],[.004,.070,z-.17],[.004,.070,z-.02],"#849b95");
        g.box(.045,-.08,z,.02,.022,1.17,c.silver);
      }
      g.box(0,0,(start+width/2)/2,.092,.179,width/2-start,c.teal);
    }else{
      g.box(0,0,0,.091,height,width,index===0?"#46706c":c.teal);
      for(const z of [-1.72,0,1.72]){
        g.box(.052,.007,z,.018,.321,1.42,index===1?"#5d8680":"#618780");
        g.box(.071,-.131,z,.021,.043,1.37,"#91a499");g.box(.071,.137,z,.018,.039,1.37,"#426963");
      }
      if(index===0){
        g.box(0,-.282,0,.133,.070,width,c.gasket);
        g.box(.083,.075,-1.72,.105,.047,.437,c.zinc);
      }
    }
    g.box(.051,-height*.5+.018,0,.044,.036,width,c.gasket);
  }
  function panelPose(i,amount){
    const shift=amount*travel;
    const low=track(i*panelHeight+shift),high=track((i+1)*panelHeight+shift);
    return {x:(low.x+high.x)/2,y:(low.y+high.y)/2,tilt:Math.atan2(low.x-high.x,high.y-low.y)};
  }
  function door(g,amount){
    for(let i=0;i<5;i++){
      const part=new BayMesh();doorPanel(part,i);
      const p=panelPose(i,amount),cs=Math.cos(p.tilt),sn=Math.sin(p.tilt),v=part.vertices;
      for(let k=0;k<v.length;k+=6)g.vertices.push(p.x-front+v[k]*cs-v[k+1]*sn,p.y+v[k]*sn+v[k+1]*cs,v[k+2],v[k+3],v[k+4],v[k+5]);
    }
  }
  function keyTag(g,col){
    const f=x=>(z,y)=>[x,y,z];
    const a=f(.012),edge=f(.019);
    for(let i=0;i<9;i++){const t=i*tau/9,q=(i+1)*tau/9;line(g,a,.044*Math.cos(t),.042*Math.sin(t),.044*Math.cos(q),.042*Math.sin(q),.012,c.silver);}
    polygon(g,edge,[[-.028,-.040],[.006,-.028],[.067,-.100],[.043,-.119],[.027,-.099],[.015,-.104]],c.silver);
    polygon(g,f(.033),[[.002,-.042],[-.045,-.091],[-.032,-.190],[.054,-.188],[.067,-.087]],col);
    face(g,f(.036),.011,-.127,.069,.040,c.paper);
  }
  function stockMark(state,id){
    if(state?.owned?.some(v=>v?.stockId===id))return "SOLD";
    return state?.stock?.[id]===false?"OUT":"TEST";
  }
  const magnetColors={TEST:c.petrol,OUT:c.saffron,SOLD:c.sienna};
  function saleMagnet(g,mark){
    const f=x=>(z,y)=>[x,y,z];
    face(g,f(.05),0,0,.68,.33,magnetColors[mark]);
    textAt(g,f(.054),mark,0,.005,.134,mark==="OUT"?c.ink:c.paper,.85);
  }
  const tagModels=new Set();
  let registrar=null;
  function install(model){
    if(registrar!==model)tagModels.clear();registrar=model;
    model("gull-motors-yard",g=>build(g,true));model("gull-motors-roadside",g=>roadsideShell(g,true));model("gull-motors-open-shell",g=>roadsideShell(g,false));
    model("gull-motors-lamps",garageLamps);
    model("gull-motors-door-shut",g=>door(g,0));model("gull-motors-door-open",g=>door(g,1));
    for(let i=0;i<3;i++)model("gull-motors-door-distance-"+i,g=>{
      const bottom=i*1.04,h=3.1-bottom;g.box(0,bottom+h/2,0,.079,h,5.19,c.teal);
      g.box(.051,bottom+.51*h,0,.019,.15,4.91,c.glass);
    });
    for(let i=0;i<5;i++)model("gull-motors-section-"+i,g=>doorPanel(g,i));
    for(const mark of Object.keys(magnetColors))model("gull-motors-stock-"+mark,g=>saleMagnet(g,mark));
  }
  function colorOf(v){
    const color=v?.color||v?.paint||v?.v?.color;return /^#[a-f\d]{6}$/i.test(color||"")?color.toLowerCase():c.saffron;
  }
  function world(list,see,t=0,hours,state={}){
    if(!see(site.center,165))return;
    const near=see(site.center,65);
    if(!near){
      const moving=state?.doors?.some(n=>n>.06);
      list.push([moving?"gull-motors-open-shell":"gull-motors-roadside",front,0,originZ]);
      if(moving)for(let i=0;i<3;i++){const n=Math.round(clamp(state.doors[i]||0,0,1)*3);
        if(n<3)list.push(["gull-motors-door-distance-"+n,front,slab,bays[i]]);
      }
      return;
    }
    list.push(["gull-motors-yard",front,0,originZ]);
    for(let i=0;i<bays.length;i++){
      const amount=clamp(state?.doors?.[i]||0,0,1),z=bays[i];
      if(amount<.0001||amount>.9999)list.push([amount<.5?"gull-motors-door-shut":"gull-motors-door-open",front,0,z]);
      else for(let j=0;j<5;j++){
        const p=panelPose(j,amount);list.push(["gull-motors-section-"+j,p.x,p.y,z,0,0,p.tilt]);
      }
      const owned=state?.owned?.[i];
      if(owned&&registrar){
        const col=colorOf(owned),id="gull-motors-key/"+col;
        if(!tagModels.has(id)){registrar(id,g=>keyTag(g,col));tagModels.add(id);}
        list.push([id,51.312,1.741,49.62+i*.47]);
      }
    }
    for(const [id,p] of Object.entries(display)){
      list.push(["gull-motors-stock-"+stockMark(state,id),55.84,.95,p.z]);
    }
    if(hours?.night>.06)list.push(["gull-motors-lamps",front,0,originZ,0,0,0,.20+hours.night*.75]);
  }
  function cutaway(g){
    paving(g,true);
    box(g,back,.58,33.15,.21,.85,16.88,c.teal);
    for(const z of [parkingStart,parkingEnd])box(g,49.32,.56,z,8.98,.83,.21,c.mint);
    for(const z of [parkingStart,30.375,35.925,parkingEnd]){
      box(g,front,.65,z,.30,.97,.32,c.teal);box(g,front,1.159,z,.32,.06,.36,c.cream);
    }
    for(const [i,z] of bays.entries()){
      box(g,45.09,1.053,z,.11,.20,.99,c.petrol);
      const ink=(x,y)=>to(49.93-y,slab+.014,z+x);
      textAt(g,ink,String(i+1),0,0,1.18,"#d9c798");
    }
    box(g,45.41,.92,38.79,.70,.16,4.04,c.wood);
    box(g,45.43,.63,39.31,.60,.58,1.64,c.copper);
    for(const z of [37.30,37.57,37.83])box(g,45.40,1.06,z,.16,.14,.17,c.saffron);
    box(g,49.44,.153,47.86,9.20,.057,11.47,c.tile);
    for(let x=45.59;x<53.6;x+=.82)face(g,ground(.185),x,47.87,.022,10.98,"#a89e87");
    for(let z=42.62;z<53.42;z+=.82)face(g,ground(.186),49.48,z,8.70,.025,"#a89e87");
    box(g,45.08,.66,47.88,.20,.98,11.15,c.aqua);
    for(const z of [42.27,53.47])box(g,49.41,.66,z,8.89,.98,.20,c.aqua);
    box(g,53.67,.67,51.75,.20,1.00,3.46,c.teal);box(g,53.67,.66,42.78,.20,.96,.86,c.aqua);
    box(g,53.052,.597,deskZ,1.06,.83,3.94,c.teal);box(g,53.05,1.06,deskZ,1.14,.112,3.96,c.wood);
    box(g,53.0,1.15,46.12,.45,.080,.33,c.navy);box(g,52.97,1.17,48.59,.43,.03,.37,c.paper,.10);
    box(g,51.06,1.01,50.10,.30,1.66,1.62,c.petrol);
    box(g,51.97,.61,50.98,.65,.10,.61,c.copper);box(g,51.67,.76,50.98,.10,.28,.62,c.copper);
    box(g,45.47,.77,48.45,.64,1.13,5.54,c.teal);box(g,45.47,1.37,48.45,.73,.075,5.70,c.wood);
    roadside(g,true);
  }
  const plan={x:42.36,z:23.68,w:23.34,d:32.09},shearX=-.355,shearZ=.225,tiles=[];
  const projected=(x,y,z)=>[x+shearX*y,z+shearZ*y];
  function tile(isCut){
    const k=Number(isCut);if(tiles[k]!==undefined)return tiles[k];
    const cv=typeof document!=="undefined"?document.createElement("canvas"):null,scale=16;
    const w=Math.ceil(plan.w*scale),h=Math.ceil(plan.d*scale);
    if(!cv?.getContext){tiles[k]=null;return null;}
    cv.width=w;cv.height=h;const ctx=cv.getContext("2d");
    if(!ctx?.createImageData){tiles[k]=null;return null;}
    const g=new BayMesh();if(isCut)cutaway(g);else build(g,true);
    if(!isCut){
      const shutter=new BayMesh();door(shutter,0);const v=shutter.vertices;
      for(const z of bays)for(let j=0;j<v.length;j+=6)g.vertices.push(v[j],v[j+1],v[j+2]+z-originZ,v[j+3],v[j+4],v[j+5]);
    }
    const image=ctx.createImageData(w,h),rgba=image.data,depth=new Float32Array(w*h);depth.fill(-100);
    const v=g.vertices,fx=w/plan.w,fz=h/plan.d;
    function at(i){return [(v[i]+front+v[i+1]*shearX-plan.x)*fx,(v[i+2]+originZ+v[i+1]*shearZ-plan.z)*fz];}
    for(let i=0;i<v.length;i+=18){
      const [x,z]=at(i),[x1,z1]=at(i+6),[x2,z2]=at(i+12),ax=x1-x,az=z1-z,bx=x2-x,bz=z2-z,A=ax*bz-bx*az;
      if(Math.abs(A)<.001)continue;
      const x0=Math.max(0,Math.floor(Math.min(x,x1,x2))),x3=Math.min(w-1,Math.ceil(Math.max(x,x1,x2)));
      const z0=Math.max(0,Math.floor(Math.min(z,z1,z2))),z3=Math.min(h-1,Math.ceil(Math.max(z,z1,z2)));
      for(let row=z0;row<=z3;row++){
        const dz=row+.5-z;let u=((x0+.5-x)*bz-dz*bx)/A,b=(dz*ax-(x0+.5-x)*az)/A;
        for(let col=x0;col<=x3;col++,u+=bz/A,b-=az/A){
          if(u<-.0001||b<-.0001||u+b>1.0001)continue;
          const y=v[i+1]+u*(v[i+7]-v[i+1])+b*(v[i+13]-v[i+1]),j=row*w+col;
          if(y+.0001<depth[j])continue;depth[j]=y;
          const p=4*j;rgba[p]=255*v[i+3];rgba[p+1]=255*v[i+4];rgba[p+2]=255*v[i+5];rgba[p+3]=255;
        }
      }
    }
    ctx.putImageData(image,0,0);tiles[k]=cv;return cv;
  }
  function simplePlan(g,cut){
    const paint=(x,z,w,d,col)=>{g.fillStyle=col;g.fillRect(x-w/2,z-d/2,w,d);};
    paint(54.85,39.2,20.4,30.25,c.concrete);paint(49.38,33.15,9.04,16.85,cut?c.shopFloor:c.teal);
    paint(49.44,47.89,9.22,11.37,cut?c.tile:c.cream);paint(45.1,33.15,.31,16.87,c.zinc);
    if(cut){paint(53.05,deskZ,1.14,3.93,c.wood);paint(51.06,50.10,.30,1.63,c.petrol);}
    else{paint(53.72,33.15,.46,17.08,c.petrol);paint(52.91,47.95,.43,7.92,c.petrol);}
    for(const z of bays)for(const side of [-1,1])paint(54.42,z+2.1*side,3.32,.095,c.paper);
    for(const b of Object.values(display))for(const side of [-1,1])paint(b.x,b.z+1.79*side,5.53,.070,c.paper);
  }
  function movablePlan(g,state){
    for(let i=0;i<3;i++){
      const z=bays[i],amount=clamp(state?.doors?.[i]||0,0,1);
      for(let j=0;j<5;j++){
        const low=track(j*panelHeight+amount*travel),hi=track((j+1)*panelHeight+amount*travel);
        const a=projected(low.x,low.y,z-2.62),b=projected(hi.x,hi.y,z-2.62);
        g.globalAlpha=amount>.65?.46:.94;
        g.fillStyle=j===2?c.glass:j%2?c.teal:"#62877f";g.beginPath();g.moveTo(a[0],a[1]);g.lineTo(b[0],b[1]);g.lineTo(b[0],b[1]+5.24);g.lineTo(a[0],a[1]+5.24);g.closePath();g.fill();
        g.fillStyle=c.cream;g.fillRect(a[0]-.022,a[1],.033,5.24);
      }
      g.globalAlpha=1;
      const owned=state?.owned?.[i];
      if(owned){g.fillStyle=colorOf(owned);g.fillRect(50.82,49.61+.47*i,.22,.25);}
    }
    for(const [id,b] of Object.entries(display)){
      g.fillStyle=magnetColors[stockMark(state,id)];g.fillRect(55.58,b.z-.30,.21,.60);
    }
  }
  function pin(g,atlas,ui){
    g.save();g.scale(ui,ui);g.fillStyle=c.petrol;g.strokeStyle=c.cream;g.lineWidth=1.05;
    g.beginPath();g.arc(0,0,6.45,0,tau);g.fill();g.stroke();
    g.strokeStyle=c.saffron;g.lineWidth=1.42;g.beginPath();g.arc(-1.56,-1.5,2.10,0,tau);g.moveTo(-.11,.10);g.lineTo(3.01,3.24);g.lineTo(3.88,2.38);g.moveTo(1.64,1.87);g.lineTo(2.48,1.02);g.stroke();
    if(atlas){g.font="bold 8px system-ui";g.textBaseline="middle";g.textAlign="left";g.fillStyle=c.paper;g.strokeStyle=c.petrol;g.lineWidth=2.8;
      g.strokeText(site.name,8,-2);g.fillText(site.name,8,-2);}
    g.restore();
  }
  function map(ctx,opt,px,py,s,visible,t=0){
    const street=opt.mode==="street",atlas=opt.mode==="atlas";
    if(atlas&&(opt.countyChart||opt.marina?.bayChart)||!visible(px(site.center.x),py(site.center.z),19*s+20))return;
    const state=opt.motorSales,cut=street&&interiorVisible(opt.player);
    ctx.save();ctx.translate(px(0),py(0));ctx.scale(s,-s);
    const plate=street?tile(cut):null;
    if(plate)ctx.drawImage(plate,plan.x,plan.z,plan.w,plan.d);else simplePlan(ctx,cut);
    if(street&&cut)movablePlan(ctx,state);
    const night=street&&(opt.weather?.night||0);
    if(night>.09){
      ctx.save();ctx.globalAlpha=night*.18;ctx.fillStyle=c.navy;ctx.fillRect(44.9,24.4,18.85,29.55);
      ctx.globalAlpha=night*.63;ctx.fillStyle="#ffdc99";for(const z of bays)ctx.fillRect(52.89,z-1.67,.12,3.34);
      ctx.fillRect(53.34,45.15,.10,4.13);ctx.restore();
    }
    ctx.restore();
    if(!street){const ui=atlas?1.08:Math.max(.82,Math.min(1.14,s*.66));ctx.save();ctx.translate(px(desk.x),py(desk.z));pin(ctx,atlas,ui);ctx.restore();}
  }
  window.BayGullMotors={site,blocks,cameraBlocks,floor,stallAt,interiorVisible,occludesCar,stepDoors,doorBlock,install,world,map};
})();
