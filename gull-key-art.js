/* Pelican Air's beach station and the inhabited shell key south of Gull Light. */
(() => {
  "use strict";
  const tau=2*Math.PI,limit=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const p=(x,y,z,yaw=0)=>({x,y,z,yaw});
  const sites=[
    {id:"marlin",name:"Marlin Air Dock",x:213,z:-13.4,center:{x:214,z:-13.8},
      desk:p(204.30,.20,-13.40,Math.PI),clerk:p(204.32,.20,-14.56,0),exit:p(227.13,.52,-12.22,Math.PI),
      berth:p(227,0,-10.08,Math.PI*.5),skiff:p(228.6,0,-17.35,Math.PI*.5),skiffFoot:p(228.60,.52,-14.96),
      ladder:{x:231.67,y:0,z:-13.50,end:p(230.43,.52,-13.50,-Math.PI*.5)},level:.52},
    {id:"key",name:"Gull Key Post Office",x:347,z:-27,center:{x:346.8,z:-28.4},
      desk:p(346.10,1.42,-28.78),clerk:p(346.14,1.42,-27.55,Math.PI),exit:p(344.87,.52,-37.42),
      berth:p(345,0,-39.55,-Math.PI*.5),skiff:p(352.65,0,-36.95,Math.PI),skiffFoot:p(350.24,.52,-36.95),
      ladder:{x:339.78,y:0,z:-36.60,end:p(341.06,.52,-36.60,Math.PI*.5)},level:.52}
  ];
  for(const site of sites)site.stand=site.clerk;
  const [marlin,key]=sites;
  // Centred sectors give the beach and the boat clearance test the same irregular waterline.
  const rim=[[10.54,-.15],[10.10,2.18],[9.00,4.62],[7.38,5.45],[5.93,6.57],[3.83,7.02],[1.26,7.52],[-.93,7.32],
    [-3.66,6.94],[-5.95,6.49],[-8.20,4.57],[-9.85,2.84],[-11,1.43],[-10.43,-.82],[-10.20,-2.27],[-8.67,-3.40],
    [-7.46,-5.41],[-5.37,-5.95],[-2.74,-7.15],[-.45,-7.54],[1.57,-7.29],[3.67,-6.70],[6.24,-6.01],[7.81,-4.66],
    [8.72,-3.02],[9.96,-1.74]];
  const rings=[[0,1.10,"#a9ac78"],[.45,.97,"#a9ae77"],[.64,.78,"#aeb27c"],[.83,.32,"#c7b98c"],
    [.958,.082,"#e2c79d"],[1,-.105,"#dac094"],[1.10,-.64,"#b9a78c"],[1.33,-2.35,"#a99b81"],[1.92,-15.3,"#788b7a"]];
  const angles=rim.map(q=>(Math.atan2(q[1],q[0])+tau)%tau);
  function radiusRatio(x,z){
    const u=x-key.x,v=z-key.z,angle=(Math.atan2(v,u)+tau)%tau,a=angle>angles[0]?angle-tau:angle;
    let i=1;while(i<angles.length&&a>angles[i])i++;
    const b=rim[i%rim.length],c=rim[(i-1)%rim.length];
    return ((b[1]-c[1])*u+(c[0]-b[0])*v)/(c[0]*b[1]-b[0]*c[1]);
  }
  function terrainLevel(x,z,limit){
    if(Math.abs(x-key.x)>11*limit||Math.abs(z-key.z)>7.55*limit)return null;
    const r=radiusRatio(x,z);if(r>limit)return null;
    let i=1;while(r>rings[i][0])i++;
    const a=rings[i-1],b=rings[i],f=(r-a[0])/(b[0]-a[0]);return a[1]+(b[1]-a[1])*f;
  }
  const landFloor=(x,z)=>terrainLevel(x,z,1),bed=(x,z)=>terrainLevel(x,z,1.92);
  function cityLevel(x){
    if(x<200.4)return .045+.155*limit((x-197.9)/2.5,0,1);
    return .20+.32*limit((x-207.2)/16.1,0,1);
  }
  const keyLevel=z=>.52+.90*limit((z+35.25)/5,0,1);
  const rect=(x0,x1,z0,z1)=>({x0,x1,z0,z1});
  const decks={
    marlin:[rect(197.9,200.4,-14.72,-12.10),rect(200.40,209.25,-18.18,-12.10),
      rect(209.25,223.4,-14.72,-12.10),rect(223.40,231.05,-15.60,-11.60)],
    key:[rect(340.40,350.90,-38.03,-35.25),rect(346.40,348.35,-35.25,-30.25),rect(343.62,350.20,-30.25,-24.20)]
  };
  const inside=(q,x,z,r=0)=>x>=q.x0-r&&x<=q.x1+r&&z>=q.z0-r&&z<=q.z1+r;
  function deckLevel(s,x,z){
    if(!decks[s.id].some(q=>inside(q,x,z)))return null;
    return s===marlin?cityLevel(x):keyLevel(z);
  }
  function floor(x,z){
    if(x>197.8&&x<231.1&&z>=-18.18&&z<=-11.60)return deckLevel(marlin,x,z);
    if(x<335.9||x>358||z< -38.03||z> -19.45)return null;
    const deck=deckLevel(key,x,z),sand=landFloor(x,z);
    return deck==null?sand:sand==null?deck:Math.max(sand,deck);
  }
  function siteAt(x,z,r=0){
    if(floor(x,z)==null)return null;
    if(r>0&&[[x-r,z],[x+r,z],[x,z-r],[x,z+r]].some(q=>floor(q[0],q[1])==null))return null;
    return x>300?key:marlin;
  }
  function waterBlocked(x,z,r=0){
    if(x<197.9-r||x>358.5+r||z< -38.03-r||z> -11.60+r)return false;
    if(x<260)return decks.marlin.some(q=>inside(q,x,z,r));
    if(decks.key.some(q=>inside(q,x,z,r)))return true;
    if(Math.abs(x-key.x)>11+r||Math.abs(z-key.z)>7.55+r)return false;
    if(landFloor(x,z)!=null)return true;
    if(r<=0)return false;
    const u=x-key.x,v=z-key.z;
    for(let i=0;i<rim.length;i++){
      const a=rim[i],b=rim[(i+1)%rim.length],dx=b[0]-a[0],dz=b[1]-a[1];
      const f=limit(((u-a[0])*dx+(v-a[1])*dz)/(dx*dx+dz*dz),0,1);
      if((u-a[0]-f*dx)**2+(v-a[1]-f*dz)**2<=r*r)return true;
    }
    return false;
  }
  const blocks=[],cameraBlocks=[];
  function block(x,z,w,d,bottom,top,body=true){
    const q={x,z,w,d,bottom,top,streetProp:true};cameraBlocks.push(q);if(body)blocks.push(q);return q;
  }
  block(204.32,-13.99,2.73,.34,.20,1.18);
  block(204.29,-16.93,4.42,.21,.20,2.55);
  block(202.10,-15.46,.15,2.86,.20,2.52);
  block(206.47,-16.24,.15,1.53,.20,2.52);
  block(204.27,-15.55,5.06,3.84,2.52,3.34,false);
  block(346.08,-28.14,2.44,.35,1.42,2.40);
  block(346.98,-24.50,5.86,.19,1.42,4.46);
  block(344.14,-26.40,.16,3.64,1.42,4.39);block(349.82,-26.40,.16,3.64,1.42,4.39);
  block(344.59,-28.31,1.02,.15,1.42,4.21);
  block(349.56,-28.31,.68,.15,1.42,4.21);
  block(346.98,-26.47,6.66,4.90,4.15,5.64,false);
  block(346.9,-29.26,6.63,2.03,3.71,4.38,false);
  const harborPier={end:233.8,z:-13.6,half:4.5};
  const shoals=[{x:key.x,z:key.z,r:11.9},{x:345.65,z:-36.65,r:6.8}];
  const routeToDesk=[p(344.87,.52,-37.42),p(347.32,.52,-36.45),p(347.32,.52,-35.25),p(347.32,1.42,-30.25),key.desk];
  const paint={wood:"#ac9378",teak:"#937961",frame:"#736653",ink:"#294749",tar:"#46535a",tide:"#7f9e92",zinc:"#739294",cream:"#e4cd9f",
    wall:"#d8c69c",red:"#c5634f",orange:"#dc8a55",gold:"#dfae66",galv:"#9aa9a1",dark:"#4e625b",fog:"#b6c1a8",oyster:"#d9d2b8"};
  // Geometry is in surveyed world metres. Each site still submits a single static object.
  const pick=(a,i)=>a[((i%a.length)+a.length)%a.length];
  const grain=["#ab937a","#ad947c","#a58d74","#b1987e","#a78f78","#ad9580"];
  const newBoards=["#b9a384","#b39d7f","#b6a48b","#ab9b81","#bdab8f"];
  const stampBlue="#506f73",tannic="#7b7560";
  function quad(g,f,x,y,w,h,color,shade=1){
    g.quad(f(x-w/2,y-h/2),f(x+w/2,y-h/2),f(x+w/2,y+h/2),f(x-w/2,y+h/2),color,shade);
  }
  function stripe(g,f,path,width,color){
    for(let i=1;i<path.length;i++){
      const a=path[i-1],b=path[i],dx=b[0]-a[0],dy=b[1]-a[1],s=width*.5/(Math.hypot(dx,dy)||1);
      g.quad(f(a[0]-dy*s,a[1]+dx*s),f(b[0]-dy*s,b[1]+dx*s),
        f(b[0]+dy*s,b[1]-dx*s),f(a[0]+dy*s,a[1]-dx*s),color);
    }
  }
  const horizontal=y=>(x,z)=>[x,y,z];
  function annulus(g,f,x,y,ro,ri,color,n=16){
    for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n;
      g.quad(f(x+ro*Math.cos(a),y+ro*Math.sin(a)),f(x+ro*Math.cos(b),y+ro*Math.sin(b)),
        f(x+ri*Math.cos(b),y+ri*Math.sin(b)),f(x+ri*Math.cos(a),y+ri*Math.sin(a)),color);
    }
  }
  const alphabet={
    A:["00 24 40","12 32"],B:["00 04 34 43 32 02","32 41 30 00"],C:["43 34 14 03 01 10 30 41"],
    D:["00 04 24 43 41 20 00"],E:["44 04 00 40","02 32"],F:["00 04 44","02 32"],G:["43 34 14 03 01 10 30 41 42 22"],
    I:["04 44","24 20","00 40"],K:["04 00","44 02","12 40"],L:["04 00 40"],M:["00 04 22 44 40"],N:["00 04 40 44"],
    O:["14 34 43 41 30 10 01 03 14"],P:["00 04 34 43 32 02"],R:["00 04 34 43 32 02","22 40"],
    S:["43 34 14 03 12 32 41 30 10 01"],T:["04 44","24 20"],U:["04 01 10 30 41 44"],Y:["04 22 44","22 20"],
    "3":["04 34 43 32 12","32 41 30 00"],"7":["04 44 10"]
  };
  function type(g,f,word,x,y,h,color){
    const advance=h*.78,start=x-(word.length*advance-.15*h)/2;
    for(let i=0;i<word.length;i++)for(const path of alphabet[word[i]]||[]){
      stripe(g,f,path.split(" ").map(a=>[start+i*advance+Number(a[0])*.153*h,y+Number(a[1])*.25*h]),h*.092,color);
    }
  }
  function pelican(g,f,x,y,k,color){
    const at=(u,v)=>f(x+k*u,y+k*v);
    g.tri(at(-.48,.16),at(.02,.082),at(.12,-.025),color);
    g.quad(at(-.21,-.014),at(.04,.095),at(.23,.045),at(.075,-.089),color);
    g.quad(at(.11,.052),at(.206,.207),at(.282,.226),at(.231,.029),color);
    g.tri(at(.24,.199),at(.53,.145),at(.211,.128),color);g.tri(at(-.125,.03),at(-.40,-.083),at(-.26,.041),color);
  }
  function planking(g,s,q,alongZ,detail,repair){
    const h=s===marlin?(x,z)=>cityLevel(x):(x,z)=>keyLevel(z);
    const corners=[[q.x0,q.z0],[q.x1,q.z0],[q.x1,q.z1],[q.x0,q.z1]],pt=(a,lift=0)=>[a[0],h(a[0],a[1])+lift,a[1]];
    for(let i=0;i<4;i++){const a=corners[i],b=corners[(i+1)%4];g.quad(pt(a),pt(b),pt(b,-.185),pt(a,-.185),i%2===0?paint.teak:paint.frame);}
    const a=alongZ?q.z0:q.x0,b=alongZ?q.z1:q.x1,n=Math.max(1,Math.round((b-a)/(detail?.29:1.5)));
    const world=(u,v)=>alongZ?[v,u]:[u,v],left=alongZ?q.x0:q.z0,right=alongZ?q.x1:q.z1;
    for(let i=0;i<n;i++){
      const x0=a+(b-a)*i/n,x1=a+(b-a)*(i+1)/n;
      const col=pick(repair?newBoards:grain,i+(s===key?4:0));
      g.quad(pt(world(x0,left)),pt(world(x1,left)),pt(world(x1,right)),pt(world(x0,right)),col);
      if(!detail)continue;
      const f=(u,v)=>pt(world(u,v),.004);
      quad(g,f,x0+.013,(left+right)/2,.015,right-left,paint.teak);
      if(i%6===2||i%8===1){
        const d=right-left;
        stripe(g,f,[[x0+.126,left+d*.20],[x0+.139,left+d*.36],[x0+.12,left+d*.48],[x0+.132,left+d*.70]],.009,"#96836e");
        if(i%3===2){quad(g,f,x0+.043,left+.084,.027,.028,tannic);quad(g,f,x0+.04,right-.095,.026,.029,tannic);}
      }
    }
  }
  function pile(g,x,z,top,detail){
    g.cyl(x,(top-2.42)/2,z,.119,.132,top+2.42,detail?7:5,"#796f60");
    if(detail){g.cyl(x,-.16,z,.131,.143,.49,7,"#687b6d");g.cyl(x,top-.05,z,.131,.131,.085,7,"#495f5c");}
  }
  function cleat(g,x,y,z,detail){
    g.box(x,y+.025,z,.36,.05,.135,"#707d77");g.box(x,y+.095,z,.13,.11,.075,"#73827c");
    g.box(x,y+.154,z,.41,.052,.081,"#aab1a1");
    if(detail)for(const i of [-1,1]){
      g.pole([x+i*.16,y+.153,z],[x+i*.235,y+.185,z],.032,"#9ea79d",5);
      g.cyl(x+i*.116,y+.055,z+.028,.017,.017,.012,5,paint.dark);
    }
  }
  function lineCoil(g,x,y,z,detail){
    if(!detail)return;
    const f=horizontal(y+.014);
    for(let k=0;k<3;k++){
      const rad=.16+.048*k;
      const points=Array.from({length:17},(_,i)=>[x+rad*Math.cos(i*tau/16),z+rad*.78*Math.sin(i*tau/16)]);
      stripe(g,f,points,.028,"#c4ae86");
    }
    stripe(g,f,[[x+.256,z],[x+.32,z+.16],[x+.41,z+.19],[x+.44,z+.32]],.026,"#b9a47e");
  }
  function ladder(g,s){
    const e=s.ladder.end,sign=s===key?-1:1,x=s===key?340.4:231.05,z=e.z;
    for(const dz of [-.30,.30]){
      const railZ=z+dz;
      g.pole([x+sign*.18,-1.15,railZ],[x+sign*.18,.79,railZ],.038,paint.galv,6);
      g.pole([x+sign*.18,.79,railZ],[x+sign*.10,.86,railZ],.039,paint.galv,6);
      g.pole([x+sign*.10,.86,railZ],[x-sign*.13,.86,railZ],.039,paint.galv,6);
      g.pole([x-sign*.13,.86,railZ],[x-sign*.19,.54,railZ],.038,paint.galv,6);
    }
    for(let i=0;i<5;i++)g.box(x+sign*.17,.35-i*.315,z,.09,.055,.56,"#83928c");
  }
  function pier(g,s,detail){
    const qs=decks[s.id];
    qs.forEach((q,i)=>planking(g,s,q,s===key&&i===1,detail,s===key&&i===2));
    if(s===marlin){
      for(let x=211.15;x<=223.4;x+=4.04)for(const z of [-14.48,-12.32])pile(g,x,z,cityLevel(x)-.055,detail);
      for(const x of (detail?[223.72,227.23,230.76]:[223.72,230.76]))for(const z of [-15.36,-11.86])pile(g,x,z,.49,detail);
      for(const x of [212.05,215.5,218.95,222.40]){
        const y=cityLevel(x);g.box(x,y+.40,-14.59,.11,.80,.11,"#8d816c");
        if(x<222)g.pole([x,y+.71,-14.59],[x+3.45,cityLevel(x+3.45)+.71,-14.59],.043,"#b5a080",5);
      }
      if(detail){for(const x of [224.03,229.96])cleat(g,x,.52,-11.90,true);
        cleat(g,226.57,.52,-15.35,true);lineCoil(g,230.18,.52,-14.72,true);}
    }else{
      for(const x of (detail?[340.79,345.30,350.54]:[340.79,350.54]))for(const z of [-37.75,-35.53])pile(g,x,z,.495,detail);
      for(const z of (detail?[-34.88,-32.65,-30.47]:[-34.88,-30.47]))for(const x of [346.62,348.11])pile(g,x,z,keyLevel(z)-.035,detail);
      if(detail){for(const x of [341.36,349.75])cleat(g,x,.52,-37.78,true);
        cleat(g,350.56,.52,-35.95,true);lineCoil(g,341.26,.52,-35.60,true);}
      for(const x of [346.52,348.22]){
        for(const z of [-34.78,-32.85,-30.91])g.box(x,keyLevel(z)+.35,z,.095,.70,.10,"#a39b7a");
        g.pole([x,keyLevel(-34.8)+.65,-34.8],[x,keyLevel(-30.88)+.65,-30.88],.043,"#bcaa85",5);
      }
    }
    if(detail)ladder(g,s);
    // Paired ochre brackets match the aircraft step, and a separate blue pair marks the outboard.
    if(detail){
      const f=horizontal(.534),b=s.exit,u=s===key?-1:1;
      for(const dx of [-.53,.53])stripe(g,f,[[b.x+dx,b.z+.18*u],[b.x+dx,b.z+.32*u],[b.x+dx-Math.sign(dx)*.15,b.z+.32*u]],.054,"#e4bc79");
      const k=s.skiffFoot;
      for(const dx of [-.33,.33])quad(g,f,k.x+dx,k.z,.11,.33,"#67948e");
    }
  }
  const seaGrapes=[[-6.50,2.70,1.44],[-4.93,4.28,.92],[4.56,4.23,1.29],[6.93,2.69,.94],
    [7.30,-1.22,.80],[-7.85,-2.31,.68],[-1.85,5.32,.83]];
  const stones=[[-9.18,2.02,.56],[-8.55,2.70,.83],[-7.94,3.49,.41],[8.25,-2.05,.60],[8.64,-1.67,.38],
    [5.97,4.53,.45],[-5,-4.20,.38],[-4.27,-5.07,.31],[1.67,6.22,.37]];
  for(const [u,v,k] of seaGrapes)if(k>1)block(key.x+u,key.z+v,.34,.34,landFloor(key.x+u,key.z+v),landFloor(key.x+u,key.z+v)+1.20*k);
  block(207.75,-17.58,.16,.16,.20,4.98);block(351.35,-26.02,.14,.14,.52,4.35);
  const shellPaint=["#b6b39d","#bbb3a2","#b8b19a","#cac2a5","#a8a794"];
  // Layer heights are shared with landFloor so waders stand on the drawn bank.
  function shellKey(g,detail,chart){
    const n=rim.length,point=(i,ring)=>[key.x+rim[i%n][0]*ring[0],ring[1],key.z+rim[i%n][1]*ring[0]];
    const sections=detail?(chart?rings.slice(0,6):rings):[rings[0],rings[2],rings[4],rings[5],rings[7],rings[8]],step=detail?1:2;
    for(let j=1;j<sections.length;j++)for(let i=0;i<n;i+=step){
      const a=sections[j-1],b=sections[j],shade=.985+.005*((i*3+j)%5);
      if(j===1){g.face([[key.x,a[1],key.z],point(i,b),point(i+step,b)],b[2],shade);continue;}
      g.quad(point(i,a),point(i,b),point(i+step,b),point(i+step,a),b[2],shade);
    }
    if(!detail)return;
    // Uneven lines of sun-bleached shells collect near the last tide.
    for(let i=0;i<n;i++){
      if((i+1)%5===0)continue;
      const a=rim[i],b=rim[(i+1)%n],groups=2+(i%3);
      for(let j=0;j<groups;j++){
        const f=(j+.38+.05*(i%3))/groups,k=.87+.014*((i*3+j*7)%6),x=key.x+(a[0]+(b[0]-a[0])*f)*k,z=key.z+(a[1]+(b[1]-a[1])*f)*k,
          y=landFloor(x,z)+.018,w=.045+.03*((i+3*j)%4),d=.032+.009*((i+j)%4);
        g.tri([x-w,y,z-d],[x+.66*w,y+.012,z],[x+.16*w,y,z+d],(i+j)%3===0?"#ab9c7c":"#ecd7b2");
      }
    }
  }
  function boulder(g,x,y,z,k,i,details){
    const sides=details?7:5,pts=[],c=pick(shellPaint,i);
    for(let j=0;j<sides;j++){
      const a=(j+.11*(i%3))*tau/sides,f=.88+.04*((j*7+i)%5),dx=k*f*Math.cos(a),dz=k*.71*f*Math.sin(a);
      pts.push([[x+dx,y-.11*k,z+dz],[x+dx*.81-.065*k,y+k*(.30+.065*((i+j)%4)),z+.79*dz],
        [x+dx*.43-.09*k,y+.54*k,z+.06*k+.52*dz]]);
    }
    for(let j=0;j<sides;j++){
      const a=pts[j],b=pts[(j+1)%sides];g.quad(a[0],b[0],b[1],a[1],c,.83+.025*(j%5));
      g.quad(a[1],b[1],b[2],a[2],c,.91+.019*((j+1)%4));g.tri(a[2],b[2],[x-.11*k,y+.58*k,z+.055*k],c);
    }
    if(details&&k>.42)for(const [u,v] of [[.08,.02],[-.27,.06],[.26,-.07]]){
      const h=y+.562*k;quad(g,horizontal(h),x+u*k,z+v*k,.098*k,.04*k,"#9f9b87");
    }
  }
  const greens=["#79917a","#98a582","#859a77","#94a77f","#789477","#899b72"],berries=["#b88771","#bb8367"];
  function canopy(g,x,y,z,k,i,detail){
    if(!detail){
      const pts=Array.from({length:6},(_,j)=>{const a=(j+i*.12)*tau/6;return [x+k*Math.cos(a),y,z+.87*k*Math.sin(a)];});
      for(let j=0;j<6;j++){
        g.tri([x-.08*k,y+.48*k,z],pts[j],pts[(j+1)%6],pick(greens,i+(j===1?1:0)));
        g.face([[x-.02*k,y-.48*k,z],pts[(j+1)%6],pts[j]],pick(greens,i),.81);
      }
      return;
    }
    const n=detail?8:6,pr=[];
    for(let a=0;a<n;a++){
      const h=(a+.23*i)*tau/n,r=k*(.85+.065*((i*3+a*7)%4)),u=Math.cos(h)*r,v=Math.sin(h)*r;
      pr.push([[x+.56*u,y-.43*k,z+.57*v],[x+u,y+.052*k*(a%3),z+.89*v],[x+.53*u,y+(.35+.035*(a%3))*k,z+.47*v]]);
    }
    for(let j=0;j<n;j++){
      const a=pr[j],b=pr[(j+1)%n],c=pick(greens,i+(j===2?1:0));
      g.quad(a[0],b[0],b[1],a[1],c,.77+.018*(j%3));g.quad(a[1],b[1],b[2],a[2],c,.97+.012*(j%4));
      g.tri(a[2],b[2],[x-.018*k,y+.421*k,z],pick(greens,i+1));
    }
    if(detail&&k>.6)for(let j=0;j<6;j++){
      const a=j*1.78+i,cs=Math.cos(a),sn=Math.sin(a),w=.125*k,ax=x+.77*k*cs,az=z+.67*k*sn,ay=y+.10*k*(j%3);
      const col=j===3?pick(berries,i):pick(greens,i+j);
      g.quad([ax-w*sn,ay,az+w*cs],[ax+w*.75*cs,ay+.035*k,az+.75*w*sn],
        [ax+w*sn,ay,az-w*cs],[ax-.65*w*cs,ay-.04*k,az-.65*w*sn],col);
    }
  }
  function grapeTree(g,u,v,k,i,detail){
    const x=key.x+u,z=key.z+v,y=landFloor(x,z),ax=x-.13*k,az=z+.09*k,ay=y+.75*k;
    g.pole([x,y-.075,z],[ax,ay,az],.14*k,"#867e65",detail?6:4);
    const sprays=detail?[[.40,1.20,-.16,.76],[-.45,1.29,.20,.82],[.14,1.61,.22,.71],[-.22,.94,-.47,.57]]:
      [[.34,1.25,-.15,.86],[-.34,1.40,.13,.94]];
    sprays.forEach(([du,dh,dv,r],j)=>{
      g.pole([ax,ay,az],[x+du*k,y+dh*k,z+dv*k],.061*k,"#8b816a",4);
      canopy(g,x+du*k,y+dh*k,z+dv*k,r*k,i+j,detail);
    });
  }
  function islandPlants(g,detail){
    stones.forEach(([u,v,k],i)=>{if(detail||k>.44)boulder(g,key.x+u,landFloor(key.x+u,key.z+v),key.z+v,k,i,detail);});
    seaGrapes.forEach(([u,v,k],i)=>grapeTree(g,u,v,k,i,detail));
    // Drift caught against the northwest shell ridge, with a couple of sun-silvered bare branches.
    const log=[[338.56,.32,-24.28],[339.18,.46,-23.83],[340.50,.53,-23.34]];
    for(let i=1;i<log.length;i++)g.pole(log[i-1],log[i],.105,"#a99e88",5);
    if(!detail)return;
    g.pole([339.24,.44,-23.80],[339.75,.89,-24.25],.047,"#a2957f",5);
    g.pole([339.54,.71,-24.05],[339.60,.81,-24.37],.030,"#c0b296",4);
    for(const [u,v] of [[-5.4,-1.1],[-5.9,-1.8],[-6.1,.8],[3.4,4.72],[4.15,4.38],[6.15,-2.8],[7.2,-1.87],[1.6,5.5],[-2.8,4.93]]){
      const x=key.x+u,z=key.z+v,y=landFloor(x,z);
      for(let j=0;j<7;j++){const a=j*2.12+u,dx=Math.cos(a),dz=Math.sin(a),h=.29+.10*((j+3)%4);
        g.tri([x+dx*.06-dz*.04,y,z+dz*.06+dx*.04],[x+dx*.07+dz*.045,y,z+dz*.07-dx*.045],
          [x+dx*h*.88,y+h,z+dz*h*.88],j%2?"#a2ad81":"#879773");
      }
    }
  }
  function awningBoard(g,x,z,y,w,h,d,face,word,sub,detail){
    g.box(x,y,z,w,h,d,paint.cream);
    const f=(u,v)=>[x-face*u,v,z+face*(d*.5+.008)],border=face===1?paint.red:stampBlue;
    quad(g,f,0,y+h*.400,w-.065,h*.065,border);quad(g,f,0,y-h*.40,w-.065,h*.066,border);
    if(detail){
      const cap=Math.min(h*.37,(w-.19)/(word.length*.78));
      type(g,f,word,0,y-.015,cap,paint.ink);
      type(g,f,sub,0,y-h*.285,Math.min(h*.147,(w-.20)/(sub.length*.78)),border);
    }else quad(g,f,0,y+.06,w*.72,h*.15,paint.ink);
  }
  function register(g,x,y,z,face,detail){
    const f=(u,v)=>[x-face*u,y+.006,z+face*v],paper="#e1cfab";
    quad(g,f,.04,0,.43,.285,paint.dark);
    const p=(u,v)=>[x-face*u,y+.012,z+face*v];
    quad(g,p,.045,.005,.394,.247,paper);
    quad(g,p,-.105,.088,.068,.035,stampBlue);
    if(!detail)return;
    for(let i=0;i<5;i++)quad(g,p,.037,-.075+i*.032,.315,.006,"#938f78");
    stripe(g,p,[[-.08,.002],[-.053,.018],[-.021,.010],[.005,.022],[.044,.021]],.008,stampBlue);
    g.pole([x-.19,y+.022,z-face*.087],[x+.11,y+.025,z-face*.139],.011,paint.red,4);
    const sx=x-face*.35;
    g.box(sx,y+.022,z+.025,.14,.04,.109,"#596459");
    g.cyl(sx,y+.079,z+.023,.025,.023,.083,6,"#a68b6f");g.cyl(sx,y+.135,z+.023,.041,.038,.045,7,paint.ink);
  }
  // Tied canvas dispatch sacks, stitched vertically with a reversible routing tag.
  function sack(g,x,y,z,k,detail){
    g.cyl(x,y+.255*k,z,.203*k,.261*k,.48*k,detail?7:5,"#b2a085");
    g.cyl(x,y+.531*k,z,.063*k,.20*k,.08*k,detail?7:5,"#bda88a");
    g.cyl(x,y+.59*k,z,.085*k,.062*k,.051*k,6,"#beaa8d");g.cyl(x,y+.561*k,z,.075*k,.074*k,.035*k,7,"#756958");
    if(detail){
      const f=(u,v)=>[x+u*k,y+v*k,z-.219*k];
      stripe(g,f,[[-.072,.13],[-.058,.31],[-.082,.42]],.014,paint.dark);
      const tag=(u,v)=>[x+u*k,y+v*k,z-(.16+(.525-v)*.55)*k];
      quad(g,tag,.08,.455,.113,.151,"#e7c590");quad(g,tag,.08,.44,.074,.017,paint.red);
    }
  }
  function parcel(g,x,y,z,w,h,d){
    g.box(x,y+h*.5,z,w,h,d,"#c6a37e");
    g.box(x,y+h*.5+.004,z,w*.15,h+.008,d+.008,"#d8bc8f");
    g.box(x+w*.24,y+h+.009,z+.018,w*.23,.009,d*.39,"#eee0ba");
  }
  const redOxide="#a85148",zinc="#85a5a0",zincShadow="#628883",siding="#d8caa6";
  function airStation(g,detail,cut){
    const x=204.29;
    g.box(x,1.375,-16.93,4.42,2.35,.19,zincShadow);
    g.box(202.10,1.365,-15.46,.15,2.33,2.87,zincShadow);
    g.box(206.47,1.37,-16.24,.15,2.34,1.53,zinc);
    for(const [u,v] of [[202.16,-13.86],[206.43,-13.86],[202.15,-17.05],[206.45,-17.05]])
      g.box(u,1.37,v,.115,2.34,.115,paint.cream);
    if(detail){
      for(let i=0;i<21;i++){const u=202.24+i*.202;g.box(u,1.36,-16.813,.033,2.17,.044,"#7b9691");}
      for(let i=0;i<13;i++){const v=-16.73+i*.187;g.box(202.008,1.37,v,.041,2.22,.027,"#88a59a");}
      // Faded square of paint behind a cork timetable and maintenance clipboard.
      g.box(x-.74,1.71,-16.76,1.50,.92,.082,"#a3ad94");
      g.box(x-.74,1.73,-16.702,1.32,.73,.036,"#ac916f");
      const f=(u,y)=>[x-.74-u,y,-16.676],print=(u,y)=>[x-.74-u,y,-16.673];
      for(const [u,v,w,h,col] of [[-.29,1.76,.33,.42,"#dcc7a0"],[.16,1.76,.32,.39,"#e2d3ac"],[.41,1.67,.15,.22,"#ccb18a"]]){
        quad(g,f,u,v,w,h,col);quad(g,print,u,v+h*.28,w*.75,h*.10,stampBlue);
        for(const j of [-.05,-.115])quad(g,print,u,v+j,w*.70,h*.024,"#9a947d");
      }
      for(const u of [x+.58,x+1.13,x+1.66])g.box(u,1.81,-16.68,.10,.12,.29,paint.dark);
      g.box(x+1.18,1.78,-16.43,1.30,.084,.22,"#ab9579");
      parcel(g,x+1.38,1.825,-16.44,.40,.22,.21);
      sack(g,202.62,.215,-16.34,.90,true);sack(g,202.97,.215,-16.46,.71,true);
    }
    // A recessed counter keeps the visitor on the open length of pier and Milo behind the hatch.
    g.box(204.32,.67,-14.06,2.68,.88,.20,paint.wall);
    g.box(204.32,1.147,-13.99,2.75,.067,.37,paint.teak);
    g.box(204.32,1.183,-13.99,2.77,.018,.37,"#cfb48f");
    g.box(204.32,.425,-13.94,2.65,.088,.03,redOxide);
    if(detail){
      register(g,204.24,1.196,-14.0,1,true);
      const front=(u,v)=>[204.32-u,v,-13.938],print=(u,v)=>[204.32-u,v,-13.933];
      quad(g,front,.36,.72,.83,.32,paint.cream);
      type(g,print,"AIR",.36,.635,.17,redOxide);
      g.box(205.38,1.31,-14.07,.25,.235,.15,paint.ink);
      g.box(205.38,1.414,-14.02,.229,.04,.109,paint.orange);
    }
    if(!cut){
      const x0=201.72,x1=206.84,z0=-17.42,z1=-13.50,y=v=>2.59+.40*(v-z0)/(z1-z0);
      const pt=(u,v,h=0)=>[u,y(v)+h,v];
      g.quad(pt(x0,z0),pt(x1,z0),pt(x1,z1),pt(x0,z1),zinc);
      for(const [a,b] of [[[x0,z0],[x0,z1]],[[x1,z0],[x1,z1]],[[x0,z0],[x1,z0]],[[x0,z1],[x1,z1]]])
        g.quad(pt(a[0],a[1]),pt(b[0],b[1]),pt(b[0],b[1],-.101),pt(a[0],a[1],-.101),paint.cream);
      if(detail)for(let i=1;i<15;i++){
        const u=x0+i*(x1-x0)/15;
        g.quad(pt(u-.022,z0,.002),pt(u,z0,.044),pt(u,z1,.044),pt(u-.022,z1,.002),zincShadow);
        g.quad(pt(u,z0,.044),pt(u+.025,z0,.002),pt(u+.025,z1,.002),pt(u,z1,.044),"#a5b4a2");
      }
      awningBoard(g,x,-13.47,2.80,3.69,.62,.092,1,"PELICAN AIR","MARLIN DISPATCH",detail);
      // West-facing road sign has a sun disc, flying pelican and a hand-painted direction arrow.
      g.box(201.72,2.24,-15.49,.093,.85,1.73,paint.cream);
      const f=(u,v)=>[201.665,v,-15.49-u];
      quad(g,f,0,2.599,1.64,.046,redOxide);quad(g,f,0,1.890,1.64,.040,redOxide);
      pelican(g,f,-.27,2.31,1.08,paint.ink);
      if(detail){type(g,f,"AIR",.49,2.23,.181,paint.ink);stripe(g,f,[[.21,2.12],[.70,2.12],[.56,2.19]],.035,redOxide);}
    }
    // The wind cone pivots on this free-standing mast; its base stays behind the road sign.
    g.box(207.75,.245,-17.58,.40,.11,.40,paint.frame);
    g.pole([207.75,.23,-17.58],[207.75,4.95,-17.58],.060,paint.galv,detail?7:5);
    g.cyl(207.75,.83,-17.58,.071,.071,.27,6,redOxide);
    if(detail){g.pole([207.75,.32,-17.58],[207.52,.95,-17.58],.032,paint.galv,5);g.pole([207.52,.95,-17.58],[207.75,1.12,-17.58],.029,paint.galv,5);}
  }
  function postHouse(g,detail,cut){
    const x=346.98,z0=-28.31,z1=-24.50,yb=1.42,eave=4.26,peak=5.56,mid=(z0+z1)*.5;
    g.box(x,2.89,z1,5.86,2.94,.19,siding);
    for(const u of [344.14,349.82])g.box(u,2.86,-26.41,.16,2.88,3.66,siding);
    g.box(344.59,2.84,z0,1.02,2.84,.15,siding);g.box(349.56,2.84,z0,.68,2.84,.15,siding);
    if(!cut)g.box(346.83,3.94,z0,3.85,.64,.15,siding);
    for(const u of [344.12,349.83]){
      g.tri([u,eave,z0],[u,peak,mid],[u,eave,z1],"#c7bc98");
      g.box(u,2.86,z1,.22,2.88,.215,paint.cream);g.box(u,2.81,z0,.22,2.79,.206,paint.cream);
    }
    if(detail){
      for(let i=1;i<14;i++){
        const y=yb+i*.202,lo=-28.20,north=-24.60;
        for(const u of [344.044,349.915])g.box(u,y,(lo+north)*.5,.035,.035,north-lo,"#c2b68e");
        for(const [cx,w] of [[344.59,.95],[349.57,.60]])g.box(cx,y,z0-.085,w,.031,.033,"#c2b68e");
        if(!cut&&y>3.66)g.box(346.83,y,z0-.085,3.85,.031,.033,"#c2b68e");
      }
    }
    // Blue louvres, raised from their sills to throw a deep edge shadow in coastal sunlight.
    for(const u of [344.028,349.932]){
      const sign=u<x?-1:1;
      g.box(u,3.02,-26.49,.060,1.14,1.44,paint.ink);
      g.box(u+sign*.042,3.02,-26.49,.052,1.08,1.37,stampBlue);
      if(detail){for(let j=0;j<7;j++)g.box(u+sign*.08,2.59+j*.140,-26.49,.084,.038,1.27,"#77928e");}
      g.box(u+sign*.055,2.45,-26.49,.22,.09,1.56,paint.cream);
    }
    // The hatch leaves a person-wide door, and the front gallery is open at both ends.
    const counterX=346.08;
    g.box(counterX,1.875,-28.125,2.43,.91,.235,"#8fa59a");
    g.box(counterX,2.347,-28.14,2.47,.099,.35,paint.teak);
    g.box(counterX,2.402,-28.14,2.50,.020,.37,"#ceb697");
    for(const u of [344.97,347.20])g.box(u,1.91,-28.256,.072,.88,.045,paint.cream);
    g.box(counterX,1.58,-28.257,2.36,.075,.049,paint.cream);
    const badge=(u,y)=>[counterX+u,y,-28.278],bird=(u,y)=>[counterX+u,y,-28.284];
    quad(g,badge,0,1.94,.80,.34,paint.cream);pelican(g,bird,-.017,1.934,.629,stampBlue);
    if(detail){
      register(g,346.04,2.420,-28.162,-1,true);
      const shelvesX=346.66,back=-24.7;
      g.box(shelvesX,2.89,back-.06,3.34,1.32,.21,"#8e8370");
      for(let j=0;j<4;j++)g.box(shelvesX,2.24+j*.422,back-.23,3.45,.078,.34,"#baaa8a");
      for(let i=0;i<6;i++)g.box(shelvesX-1.65+i*.664,2.90,back-.24,.055,1.24,.32,"#ae9c7e");
      for(let i=0;i<8;i++){
        const cx=shelvesX-1.33+(i%5)*.664,sy=2.28+Math.floor(i/5)*.422;
        g.box(cx,sy+.047,back-.326,.38+(i%3)*.045,.09,.153,i%3?"#d8c8a3":"#c29272");
        g.box(cx+.12,sy+.056,back-.404,.045,.041,.013,i%2?stampBlue:paint.red);
      }
      sack(g,344.56,1.424,-25.23,1.00,true);sack(g,344.85,1.424,-25.46,.80,true);
      parcel(g,348.67,1.424,-24.98,.69,.38,.45);parcel(g,348.73,1.804,-25.00,.46,.22,.34);
      // A hooded enamel post box with a nickel slot and scuffed lower corner.
      g.box(344.68,2.64,-28.48,.59,.84,.18,stampBlue);g.box(344.68,3.077,-28.51,.66,.095,.27,"#9bb3a3");
      g.box(344.68,2.843,-28.584,.392,.064,.079,paint.ink);g.box(344.68,2.891,-28.593,.44,.032,.10,paint.galv);
      const f=(u,y)=>[344.68+u,y,-28.582],ink=(u,y)=>[344.68+u,y,-28.586];
      quad(g,f,0,2.54,.34,.18,paint.cream);type(g,ink,"POST",0,2.503,.072,stampBlue);
      g.box(349.50,2.53,-28.478,.28,.38,.109,"#bd644e");
    }
    // House posts and sun-bleached braces frame the porch without taking away its landing lane.
    for(const [u,v] of [[343.85,-30.00],[350.0,-30.00]]){
      g.box(u,2.58,v,.137,2.32,.139,paint.cream);g.box(u,1.655,v,.164,.47,.162,zincShadow);
      g.pole([u,3.26,v],[u+(u<x?.42:-.42),3.72,v],.048,paint.cream,4);
    }
    if(!cut){
      const left=343.67,right=350.31,south=-28.75,north=-24.04,overhang=4.15;
      const ridge=(v)=>peak-(peak-overhang)*Math.abs(v-mid)/(north-mid);
      const side=(u,v,h=0)=>[u,ridge(v)+h,v];
      for(const [a,b,c] of [[south,mid,"#c46e5e"],[mid,north,"#b75f52"]]){
        g.quad(side(left,a),side(right,a),side(right,b),side(left,b),c);
        if(detail)for(let i=1;i<19;i++){
          const u=left+i*(right-left)/19;
          g.quad(side(u-.026,a,.003),side(u,a,.038),side(u,b,.038),side(u-.026,b,.003),redOxide);
          g.quad(side(u,a,.038),side(u+.022,a,.003),side(u+.022,b,.003),side(u,b,.038),"#d7896c");
        }
        for(const u of [left,right])g.quad(side(u,a),side(u,b),side(u,b,-.105),side(u,a,-.105),paint.cream);
      }
      g.box(x,peak+.02,mid,6.73,.097,.19,redOxide);
      const porch=(u,v,h=0)=>[u,3.68+.31*(v+30.28)+h,v],front=-30.29,back=-28.23;
      g.quad(porch(left,front),porch(right,front),porch(right,back),porch(left,back),"#91aba0");
      g.quad(porch(left,front),porch(right,front),porch(right,front,-.131),porch(left,front,-.131),paint.cream);
      if(detail)for(let i=1;i<15;i++){
        const u=left+i*(right-left)/15;
        g.quad(porch(u-.023,front,.001),porch(u+.018,front,.032),porch(u+.018,back,.032),porch(u-.023,back,.001),zincShadow);
      }
      awningBoard(g,346.81,-30.29,3.595,3.11,.62,.110,-1,"GULL KEY","POST OFFICE",detail);
      // A weathered blue vent with small cream battens at the eave.
      const vf=(v,y)=>[350.019,y,mid+v];
      quad(g,vf,0,4.66,.72,.38,stampBlue);
      if(detail)for(let i=0;i<4;i++)quad(g,vf,0,4.53+i*.077,.65,.028,paint.tide);
    }
    const mx=351.35,mz=-26.02,b=landFloor(mx,mz);
    g.cyl(mx,b+.052,mz,.21,.24,.104,8,"#b6ad94");
    g.pole([mx,b,mz],[mx,4.29,mz],.047,"#a6a99a",detail?7:5);
    g.cyl(mx,4.31,mz,.078,.064,.09,6,paint.gold);
    if(detail){g.pole([mx+.07,b+.24,mz],[mx+.09,4.21,mz],.011,paint.cream,4);}
  }
  function cone(g){
    // Bearing and tether at the mouth, then four tapering bands of faded canvas.
    const stations=[[.00,.00,.243],[.32,-.018,.216],[.67,-.069,.174],[.99,-.139,.124],[1.37,-.235,.064]],
      colors=["#ce7256","#eddbaf","#ce7256","#eddbaf"],n=10;
    const ring=(i,j)=>{const [u,y,r]=stations[i],a=j*tau/n;return [u,y+r*Math.cos(a),r*Math.sin(a)];};
    for(let i=0;i<4;i++)for(let j=0;j<n;j++)g.quad(ring(i,j),ring(i,j+1),ring(i+1,j+1),ring(i+1,j),colors[i],.87+.12*(1+Math.cos(j*tau/n))*.5);
    for(let j=0;j<n;j++)g.pole(ring(0,j),ring(0,j+1),.013,paint.cream,4);
    for(const j of [0,3,7])g.pole([-.37,-.007,0],ring(0,j),.010,paint.frame,4);
    g.pole([-.37,-.127,0],[-.37,.017,0],.023,paint.galv,6);
  }
  function burgee(g){
    // A locally sewn postal pennant, striped diagonally with a swallowtail at the fly.
    const pt=(x,y)=>[x,y-.17*x,.069*Math.sin(x*5.0)];
    const strips=[0,.23,.37,.58,.71,.91];
    for(let i=1;i<strips.length;i++){
      const a=strips[i-1],b=strips[i],bottom=x=>-.54+.12*x,top=x=>-.04*x;
      g.quad(pt(a,top(a)),pt(b,top(b)),pt(b,bottom(b)),pt(a,bottom(a)),i%2?"#719694":"#edcc9a");
    }
    g.tri(pt(.91,-.037),pt(1.38,-.04),pt(.91,-.228),"#c96955");g.tri(pt(.91,-.228),pt(1.24,-.442),pt(.91,-.43),"#c96955");
  }
  function lantern(g,x,y,z,sign){
    g.box(x,y+.129,z-sign*.031,.28,.064,.19,paint.ink);
    g.box(x,y,z,.20,.21,.14,"#c9b888");
    g.box(x,y-.125,z-sign*.014,.24,.039,.17,paint.ink);
    for(const dx of [-.084,.084])g.box(x+dx,y,z+sign*.061,.014,.205,.016,paint.frame);
  }
  const lamps={marlin:[206.37,2.22,-13.78,1],key:[349.48,3.28,-28.48,-1]};
  function nightGlass(g,s){
    const [x,y,z,sign]=lamps[s.id],face=(u,v)=>[x+u,y+v,z+sign*.076];
    quad(g,face,0,0,.147,.155,"#ffe2af");
  }
  const bill={x:345.30,z:-28.18},sleeve={x:345.69,z:-28.15};
  function playbill(g){
    // An accordion-folded playbill leans against its companion flap, facing the person at the hatch.
    const {x,z}=bill,y=2.415,front=(u,v)=>[x+u+.035*v,y+v,z-.142+.31*v],back=(u,v)=>[x+u+.035*v,y+v,z+.144-.42*v];
    g.quad(front(-.152,0),front(.152,0),front(.152,.389),front(-.152,.389),"#ead3a3");
    g.quad(back(-.152,0),back(.152,0),front(.152,.389),front(-.152,.389),"#c8ab83");
    const panel=(u,v)=>{const a=front(u,v);a[2]-=.003;return a;},ink=(u,v)=>{const a=front(u,v);a[2]-=.006;return a;};
    quad(g,panel,0,.278,.261,.169,"#b96756");
    g.tri(ink(-.111,.21),ink(-.023,.316),ink(.06,.21),"#423f48");
    g.tri(ink(-.019,.21),ink(.067,.284),ink(.123,.21),"#847464");
    type(g,ink,"CINE",0,.135,.052,"#664c46");type(g,ink,"LUNA",0,.073,.051,"#664c46");
    quad(g,ink,.002,.04,.19,.012,"#a88563");
  }
  function recordSleeve(g){
    const {x,z}=sleeve,y=2.415,w=.324,tilt=.28,f=(u,v)=>[x+u-.053*v,y+v,z-.10+tilt*v];
    for(const u of [-.117,.117]){
      g.pole([x+u,y,z-.11],[x+u,y+.247,z+.051],.009,paint.frame,5);
      g.pole([x+u,y+.247,z+.051],[x+u,y,z+.112],.009,paint.frame,5);
    }
    const r=.149,c=(u,v)=>{const q=f(u,v);q[2]+=.012;return q;};
    for(let i=0;i<16;i++){
      const a=i*tau/16,b=(i+1)*tau/16;
      g.tri(c(.027,.233),c(.027+r*Math.cos(a),.233+r*Math.sin(a)),c(.027+r*Math.cos(b),.233+r*Math.sin(b)),"#3d4850");
    }
    quad(g,f,0,.176,w,w,"#dca378");
    const print=(u,v)=>{const q=f(u,v);q[2]-=.003;return q;};
    for(let i=0;i<3;i++){
      const v=.056+i*.064;
      g.quad(print(-.162,v),print(.162,v+.036),print(.162,v+.066),print(-.162,v+.030),i===1?"#d3c49f":"#698d89");
    }
    annulus(g,print,.035,.215,.051,.022,"#3e5454",10);
    quad(g,print,-.042,.288,.114,.031,"#f0d6a1");
  }
  function geometry(g,s,detail,cut=false,chart=false){
    if(s===key){shellKey(g,detail,chart);islandPlants(g,detail);}
    pier(g,s,detail);
    if(s===key)postHouse(g,detail,cut);else airStation(g,detail,cut);
    lantern(g,...lamps[s.id]);
  }
  const modelName=(s,detail)=>"gull-dock-"+s.id+(detail?"":"-far");
  function install(model){
    for(const s of sites){
      model(modelName(s,true),g=>geometry(g,s,true));model(modelName(s,false),g=>geometry(g,s,false));
      model("gull-dock-lamp-"+s.id,g=>nightGlass(g,s));
    }
    model("gull-wind-cone",cone);model("gull-post-pennant",burgee);
    model("gull-cine-playbill",playbill);model("gull-record-sleeve",recordSleeve);
  }
  function world(list,see,t=0,hours){
    const night=hours?.night||0;
    for(const s of sites){
      if(!see(s.center,s===key?285:190))continue;
      const near=see(s.center,59);
      list.push([modelName(s,near),0,0,0,0]);
      if(near||see(s.center,110)){
        if(s===marlin)list.push(["gull-wind-cone",208.12,4.96,-17.58,.09+.15*Math.sin(t*.48),0,.035*Math.sin(.85*t)]);
        else list.push(["gull-post-pennant",351.39,4.20,-26.02,-.12+.14*Math.sin(t*.57),.074*Math.sin(t*1.9),.043*Math.sin(t*1.2)]);
      }
      if(near&&night>.055)list.push(["gull-dock-lamp-"+s.id,0,0,0,0,0,0,.88*night]);
    }
  }
  function mailWorld(list,site,count){
    if(site?.id!=="key"||count<2)return;
    list.push(["gull-cine-playbill",0,0,0,0]);
    if(count>=3)list.push(["gull-record-sleeve",0,0,0,0]);
  }
  const plates=new Map(),bounds={marlin:rect(197.60,232.10,-18.62,-10.83),key:rect(335.70,358.20,-38.49,-18.86)};
  // The overhead renderer shares the actual planks, tide contour, buildings and shrubs. A separate
  // cutaway is used at each counter so the clerk and the player's hand remain visible under the roof.
  function chartPlate(site,cut){
    const id=site.id+(cut?"-open":"");
    if(plates.has(id))return plates.get(id);
    const q=bounds[site.id],width=q.x1-q.x0,depth=q.z1-q.z0,w=Math.ceil(width*19),h=Math.ceil(depth*19);
    const page=typeof OffscreenCanvas==="function"?new OffscreenCanvas(w,h):typeof document==="undefined"?null:document.createElement("canvas");
    if(page){page.width=w;page.height=h;}
    const context=page?.getContext?.("2d");
    if(!context?.createImageData||!context?.putImageData){plates.set(id,null);return null;}
    const mesh=new BayMesh();geometry(mesh,site,true,cut,true);
    const a=mesh.vertices,pic=context.createImageData(w,h),px=pic.data,levels=new Float32Array(w*h);
    levels.fill(-Infinity);
    const point=i=>[(a[i]+.22*a[i+1]-q.x0)*w/width,(a[i+2]+.27*a[i+1]-q.z0)*h/depth,a[i+1]];
    for(let i=0;i<a.length;i+=18){
      const v=point(i),b=point(i+6),d=point(i+12),bx=b[0]-v[0],by=b[1]-v[1],dx=d[0]-v[0],dy=d[1]-v[1],area=bx*dy-by*dx;
      if(Math.abs(area)<.00001||Math.max(v[2],b[2],d[2])<-.13)continue;
      const x0=Math.max(0,Math.floor(Math.min(v[0],b[0],d[0]))),x1=Math.min(w-1,Math.ceil(Math.max(v[0],b[0],d[0]))),
        y0=Math.max(0,Math.floor(Math.min(v[1],b[1],d[1]))),y1=Math.min(h-1,Math.ceil(Math.max(v[1],b[1],d[1]))),
        r=a[i+3]*255,g=a[i+4]*255,blue=a[i+5]*255,inv=1/area;
      for(let y=y0;y<=y1;y++){
        const cy=y+.5-v[1];
        for(let x=x0;x<=x1;x++){
          const cx=x+.5-v[0],u=(cx*dy-cy*dx)*inv,k=(bx*cy-by*cx)*inv;
          if(u<-.00001||k<-.00001||u+k>1.00001)continue;
          const j=y*w+x,yWorld=v[2]+(b[2]-v[2])*u+(d[2]-v[2])*k;
          if(yWorld<-.13||yWorld<levels[j]-.00001)continue;
          levels[j]=yWorld;const n=4*j;px[n]=r;px[n+1]=g;px[n+2]=blue;px[n+3]=255;
        }
      }
    }
    context.putImageData(pic,0,0);plates.set(id,page);return page;
  }
  function polygon(c,points,color){
    c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();
    c.fillStyle=color;c.fill();
  }
  function planShape(c,site,night=false){
    if(site===key){
      for(const [r,col] of (night?[[1,"#263f4f"]]:[[1,"#decb9d"],[.77,"#b7b990"],[.57,"#9aa783"]])){
        polygon(c,rim.map(([u,v])=>[key.x+u*r,key.z+v*r]),col);
      }
    }
    for(const d of decks[site.id]){
      c.fillStyle=night?"#263f4f":"#aa9479";c.fillRect(d.x0,d.z0,d.x1-d.x0,d.z1-d.z0);
    }
    if(night)return;
    if(site===marlin){c.fillStyle=zinc;c.fillRect(201.72,-17.42,5.12,3.92);}
    else{
      c.fillStyle="#b66553";c.fillRect(343.67,-28.75,6.64,4.71);c.fillStyle="#8ca598";c.fillRect(343.67,-30.29,6.64,2.06);
      for(const [u,v,k] of seaGrapes){
        c.beginPath();c.ellipse(key.x+u,key.z+v,1.08*k,.83*k,.14,0,tau);c.fillStyle="#849779";c.fill();
      }
    }
  }
  function mailPin(c,site){
    // A winged square envelope, readable at radar size and distinct from the anchor at a boat landing.
    c.fillStyle=paint.ink;c.beginPath();c.arc(0,0,6.75,0,tau);c.fill();
    c.fillStyle=site===marlin?"#e9bc82":"#ebcd91";c.fillRect(-3.02,-2.34,6.80,4.77);
    c.strokeStyle=paint.ink;c.lineWidth=.82;c.beginPath();c.moveTo(-2.91,-2.18);c.lineTo(.37,.12);c.lineTo(3.69,-2.15);c.stroke();
    c.strokeStyle="#ede1bc";c.lineWidth=.83;c.beginPath();
    c.moveTo(-5.31,-.91);c.lineTo(-3.50,-.91);c.moveTo(-4.90,.53);c.lineTo(-3.50,.53);c.stroke();
  }
  function map(c,opt,px,py,scale,visible,t=0){
    const street=opt.mode==="street",atlas=opt.mode==="atlas";
    if(atlas&&opt.countyChart)return;
    const size=c.canvas?Math.min(c.canvas.width,c.canvas.height):230,ui=limit(size/(opt.mode==="radar"?165:370),.70,1.65);
    for(const site of sites){
      if(!visible(px(site.center.x),py(site.center.z),(site===marlin?18:13)*scale+9*ui))continue;
      c.save();
      const q=bounds[site.id],novel=street&&opt.player&&Math.hypot(opt.player.x-site.clerk.x,opt.player.z-site.clerk.z)<3.9&&
        (opt.player.y??0)<site.clerk.y+2.5;
      c.translate(px(q.x0),py(q.z0));c.scale(scale,-scale);
      if(street){
        const plate=chartPlate(site,Boolean(novel));
        if(plate)c.drawImage(plate,0,0,q.x1-q.x0,q.z1-q.z0);
        else {c.save();c.translate(-q.x0,-q.z0);planShape(c,site);c.restore();}
        // Postal ensign and sock use the same mast, height parallax and wind rhythm as the street.
        const isKey=site===key,baseX=(isKey?351.39:208.12)+.22*(isKey?4.20:4.96)-q.x0,
          baseZ=(isKey?-26.02:-17.58)+.27*(isKey?4.20:4.96)-q.z0;
        c.save();c.translate(baseX,baseZ);c.rotate(isKey?.12-.14*Math.sin(t*.57):-.09-.15*Math.sin(t*.48));
        const shades=isKey?["#78a092","#e3c797","#78a092","#cc7459"]:["#cf7d5d","#e6d6aa","#c97659","#e0d3a8"];
        for(let i=0;i<4;i++){
          const a=i*.318,b=a+.318,r=.218-i*.035;
          polygon(c,[[a,-r],[b,-r+.032],[b,r-.032],[a,r]],shades[i]);
        }
        c.restore();
        const night=opt.weather?.night||0;
        if(night>.05){
          c.translate(-q.x0,-q.z0);c.globalAlpha*=night*.36;planShape(c,site,true);
          const [x,y,z]=lamps[site.id];c.globalAlpha=.82*night;c.fillStyle="#ffe3a4";c.fillRect(x+.22*y-.14,z+.27*y-.10,.29,.20);
        }
      }else{c.translate(-q.x0,-q.z0);planShape(c,site);}
      c.restore();
      if(street||!visible(px(site.desk.x),py(site.desk.z),10*ui))continue;
      c.save();c.translate(px(site.desk.x),py(site.desk.z));c.scale(ui,ui);mailPin(c,site);
      if(atlas){
        const nearRight=px(site.desk.x)>c.canvas.width*.70,dir=nearRight?-1:1;
        c.textAlign=nearRight?"right":"left";c.textBaseline="middle";c.lineWidth=2.32;c.font="bold 8px system-ui";
        c.strokeStyle=paint.ink;c.strokeText(site.name,dir*8,-4.8);c.fillStyle="#f0dfba";c.fillText(site.name,dir*8,-4.8);
      }
      c.restore();
    }
  }
  function mailMap(c,opt,px,py,s,site,count){
    if(opt.mode!=="street"||site?.id!=="key"||count<2)return;
    // Only the cutaway exposes this shelf to the overhead camera.
    if(!opt.player||Math.hypot(opt.player.x-key.clerk.x,opt.player.z-key.clerk.z)>=3.9||(opt.player.y??0)>=key.clerk.y+2.5)return;
    const y=2.55;
    c.save();c.translate(px(bill.x+.22*y),py(bill.z+.27*y));c.scale(s,-s);
    c.fillStyle="#e7cda2";c.fillRect(-.15,-.09,.30,.22);c.fillStyle="#b76452";c.fillRect(-.121,-.05,.24,.088);c.restore();
    if(count<3)return;
    c.save();c.translate(px(sleeve.x+.22*y),py(sleeve.z+.27*y));c.scale(s,-s);
    c.fillStyle="#d49e73";c.fillRect(-.166,-.09,.332,.21);c.fillStyle="#6d928a";c.fillRect(-.166,-.025,.332,.054);c.restore();
  }
  window.BayGullKey={sites,siteAt,floor,landFloor,bed,waterBlocked,blocks,cameraBlocks,harborPier,shoals,routeToDesk,install,world,map,mailWorld,mailMap};
})();
