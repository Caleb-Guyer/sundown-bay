/* Foto Bahía's three surviving two-seat cabinets. Local +Z opens toward the pavement. */
(() => {
  "use strict";
  const tau=Math.PI*2;
  const ink="#333d40",ivory="#e9ddbc",silver="#b7b9a8",rubber="#403f3d",brass="#b89b67";
  const shops={
    luna:{label:"Cine Luna",shell:"#52656a",trim:"#bd8369",fabric:"#825762",fold:"#5e454f",light:"#af7980",print:"#684851",accent:"#c49b71"},
    marlin:{label:"Marlin Motel",shell:"#4d7773",trim:"#d78f70",fabric:"#638074",fold:"#465e58",light:"#90a08a",print:"#47685d",accent:"#d6ab77"},
    wheel:{label:"North Boardwalk",shell:"#60778a",trim:"#deac58",fabric:"#786e98",fold:"#585671",light:"#a199bb",print:"#515770",accent:"#d4a277"}
  };
  const glyphs={
    F:["04 00 30","02 22"],O:["10 20 31 33 24 14 03 01 10"],T:["00 40","20 24"],
    B:["04 00 20 31 22 02","22 33 24 04"],A:["04 10 20 34","12 22"],
    H:["00 04","30 34","02 32"],I:["00 20","10 14","04 24"]
  };
  const front=z=>(u,y)=>[-u,y,z];
  function stroke(g,plane,a,b,width,color){
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
    if(!length)return;
    const ox=dy*width/(2*length),oy=-dx*width/(2*length);
    g.quad(plane(a[0]+ox,a[1]+oy),plane(b[0]+ox,b[1]+oy),plane(b[0]-ox,b[1]-oy),plane(a[0]-ox,a[1]-oy),color);
  }
  function letters(g,plane,cx,base,size,color){
    const word="FOTO BAHIA",step=size*.77;
    for(let i=0;i<word.length;i++){
      const x=cx+(i-(word.length-1)/2)*step-size*.25;
      for(const line of glyphs[word[i]]||[]){
        const pts=line.split(" ").map(pair=>[x+Number(pair[0])*size*.17,base+(4-Number(pair[1]))*size*.25]);
        for(let j=1;j<pts.length;j++)stroke(g,plane,pts[j-1],pts[j],size*.112,color);
      }
      if(i===8)stroke(g,plane,[x+size*.15,base+size*1.13],[x+size*.37,base+size*1.29],size*.084,color);
    }
  }
  function badge(g,plane,cx,cy,r,id){
    const count=12;
    for(let i=0;i<count;i++){
      const a=i*tau/count,b=(i+1)*tau/count;
      g.tri(plane(cx,cy),plane(cx+Math.cos(a)*r,cy+Math.sin(a)*r),plane(cx+Math.cos(b)*r,cy+Math.sin(b)*r),ivory);
    }
    const pen=(a,b,w,col)=>stroke(g,plane,[cx+r*a[0],cy+r*a[1]],[cx+r*b[0],cy+r*b[1]],r*w,col);
    if(id==="wheel"){
      const point=i=>[Math.cos(i*tau/8)*.59,Math.sin(i*tau/8)*.59+.10];
      for(let i=0;i<8;i++){pen(point(i),point(i+1),.075,ink);pen([0,.10],point(i),.042,ink);}
      pen([0,.10],[-.28,-.66],.10,ink);pen([0,.10],[.28,-.66],.10,ink);
    }else if(id==="marlin"){
      const fish=[[-.74,-.03],[-.30,.23],[.17,.28],[.50,.04],[.27,-.12],[-.28,-.20]];
      for(let i=1;i<fish.length-1;i++)g.tri(...[fish[0],fish[i],fish[i+1]].map(([x,y])=>plane(cx+r*x,cy+r*y)),ink);
      pen([.44,.06],[.86,.36],.06,ink);pen([-.31,.20],[-.12,.56],.09,ink);
      pen([-.63,-.03],[-.86,.25],.12,ink);pen([-.63,-.03],[-.84,-.30],.12,ink);
    }else{
      const a=[[.49,.58],[.10,.75],[-.38,.57],[-.64,.19],[-.55,-.27],[-.20,-.56],[.25,-.61],[.58,-.40]];
      const b=[[.49,.58],[.18,.48],[-.02,.30],[-.10,.04],[-.05,-.17],[.13,-.37],[.33,-.44],[.58,-.40]];
      for(let i=1;i<a.length;i++)g.quad(...[a[i-1],a[i],b[i],b[i-1]].map(([x,y])=>plane(cx+r*x,cy+r*y)),ink);
    }
  }
  function cabinet(g,id){
    const p=shops[id];
    g.box(0,.065,0,1.55,.13,1.28,rubber);
    g.box(0,.145,0,1.60,.062,1.32,silver);
    g.box(0,1.04,-.62,1.58,1.77,.08,p.shell);
    g.box(-.76,1.06,0,.075,1.79,1.28,p.shell);
    g.box(.76,1.06,0,.075,1.79,1.28,p.shell);
    for(const x of [-.793,.793]){
      g.box(x,1.49,-.015,.012,.74,.86,p.trim);
      const side=(u,y)=>[x+(x>0?.008:-.008),y,x>0?-u:u];
      badge(g,side,0,1.51,.224,id);
      for(const y of [.30,.344,.388,.432])g.box(x,y,-.07,.016,.014,.49,ink);
    }
    g.box(0,1.053,-.565,1.445,1.68,.02,"#afa894");
    for(const x of [-.65,-.48,-.31,-.14,.03,.20,.37,.54,.71])g.box(x,1.03,-.545,.012,1.60,.012,"#a09885");
    for(const x of [-.48,.38])g.box(x,.345,-.275,.058,.37,.36,silver);
    g.box(-.056,.548,-.255,1.30,.118,.425,"#6a4a44");
    g.box(-.056,.608,-.260,1.30,.038,.425,p.trim);
    g.box(-.056,.75,-.497,1.32,.237,.060,p.fabric);
    for(const x of [-.45,-.12,.21,.52])g.box(x,.76,-.461,.026,.013,.008,brass);
    // Billing column, brass change release, and a hood above the dry-print pocket.
    g.box(.568,1.035,.55,.365,1.76,.166,p.shell);
    g.box(.573,1.285,.644,.252,.405,.026,silver);
    g.box(.573,1.417,.661,.131,.024,.014,ink);
    g.box(.553,1.213,.663,.057,.056,.019,brass);
    g.box(.59,.828,.644,.207,.095,.029,ink);
    g.box(.59,.889,.649,.245,.026,.054,silver);
    g.box(.592,.803,.661,.128,.025,.018,ivory);
    g.box(.56,.295,.637,.289,.17,.011,"#90978c");
    g.box(.566,1.706,.424,.15,.14,.064,rubber);
    g.box(.561,1.705,.386,.09,.092,.025,"#6c8e8c");
    g.pole([-.69,1.856,.54],[.411,1.856,.54],.018,silver,7);
    g.box(0,1.905,0,1.638,.085,1.355,silver);
    g.box(0,2.04,-.04,1.591,.237,1.216,p.shell);
    g.box(0,2.05,.553,1.58,.259,.131,ink);
    g.box(0,2.05,.624,1.53,.224,.014,ivory);
    letters(g,front(.636),0,1.987,.143,p.fold);
    g.box(0,2.208,-.006,1.637,.061,1.344,p.trim);
    g.box(-.32,2.241,-.29,.34,.010,.26,"#8b9081");
    for(let i=0;i<5;i++)g.box(-.455+.068*i,2.247,-.29,.028,.006,.19,ink);
    for(const [x,y,w] of [[.64,.73,.045],[.46,1.52,.039],[.66,.49,.074],[-.73,.59,.048]]){
      g.box(x,y,.637,w,.006,.006,"#a69d87");
    }
  }
  function curtain(g,p,closed){
    const pleats=closed?14:7,lo=-.72,hi=closed?.398:-.45,top=1.835;
    const edge=i=>{
      const u=i/pleats,bottom=closed?.36+.024*Math.cos(i*1.5):.39+.065*Math.sin(2*u)+.03*Math.cos(i);
      return {x:lo+(hi-lo)*u,topX:lo+(hi-lo)*u,bottom,z:.515+.053*(i%2)};
    };
    for(let i=0;i<pleats;i++){
      const a=edge(i),b=edge(i+1),col=i%4===0?p.light:i%2?p.fold:p.fabric;
      g.quad([a.topX,top,a.z],[b.topX,top,b.z],[b.x,b.bottom,b.z+.013],[a.x,a.bottom,a.z+.013],col);
      g.quad([a.x,a.bottom+.086,a.z+.016],[b.x,b.bottom+.086,b.z+.016],[b.x,b.bottom+.071,b.z+.016],[a.x,a.bottom+.071,a.z+.016],p.trim);
      if(i%2===0)g.box(a.topX,1.844,a.z,.018,.048,.019,brass);
    }
    if(!closed)g.box(-.592,1.03,.568,.245,.055,.024,brass);
  }
  function world(list,model,site,occupied=false,flash=0){
    const id=shops[site.id]?site.id:"luna",key="foto-bahia/"+id,pose=occupied?"closed":"open";
    model(key,g=>cabinet(g,id));model(key+"/"+pose,g=>curtain(g,shops[id],!!occupied));
    const at=[site.x,site.y??.075,site.z,site.yaw||0];
    list.push([key,...at],[key+"/"+pose,...at]);
    if(flash>.01){
      model("foto-bahia/flash",g=>{g.box(.56,1.735,.594,.192,.058,.043,"#fff3ce");g.box(.55,1.64,.649,.110,.045,.008,"#fff6d4");});
      list.push(["foto-bahia/flash",...at]);
    }
  }
  function map(c,site,px,py,scale,occupied=false,flash=0){
    const p=shops[site.id]||shops.luna;
    c.save();c.translate(px(site.x),py(site.z));c.rotate(site.yaw||0);c.scale(scale,-scale);
    c.fillStyle=ink;c.fillRect(-.82,-.68,1.64,1.36);
    c.fillStyle=p.trim;c.fillRect(-.80,-.66,1.60,1.29);
    c.fillStyle=p.shell;c.fillRect(-.74,-.6,1.48,1.13);
    c.fillStyle=silver;c.fillRect(-.51,-.44,.36,.29);
    c.fillStyle=ink;for(let i=0;i<4;i++)c.fillRect(-.48+.07*i,-.40,.026,.21);
    c.fillStyle=ivory;c.fillRect(-.79,.38,1.58,.14);
    c.fillStyle=p.fold;c.fillRect(-.72,.53,occupied?1.115:.26,.112);
    c.fillStyle=p.light;for(let i=0;i<(occupied?7:2);i++)c.fillRect(-.70+i*.152,.54,.038,.106);
    c.fillStyle=flash>.01?"#fff4ce":brass;c.fillRect(.48,.54,.19,.099);c.restore();
  }
  const outlines=new Map();
  function path(c,d,paint,weight=0){
    let shape=outlines.get(d);if(!shape){shape=new Path2D(d);outlines.set(d,shape);}
    if(weight){c.strokeStyle=paint;c.lineWidth=weight;c.stroke(shape);}
    else{c.fillStyle=paint;c.fill(shape);}
  }
  function oval(c,x,y,rx,ry,color,turn=0){
    c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,turn,0,tau);c.fill();
  }
  function line(c,x1,y1,x2,y2,color,weight){
    c.strokeStyle=color;c.lineWidth=weight;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
  }
  function hand(c,side){
    c.save();c.scale(side,1);
    path(c,"M51 69 Q54 46 63 21 L65 2 Q67 -5 70 0 L70 13 L74 -7 Q76 -12 79 -8 L77 14 L82 9 Q87 6 86 12 L80 26 Q77 32 71 34 L65 77 Z","#925f4d");
    path(c,"M53 67 L66 27 Q64 20 65 4 Q66 0 68 1 L70 16 Q72 18 73 14 L77 -7 L78 -7 L76 16 L80 15 L85 10 Q83 23 75 28 L68 33 L59 73 Z","#c78e6c");
    path(c,"M68 22 Q72 20 76 22 M72 16 L77 18","#895b49",1.3);c.restore();
  }
  function sitter(c,frank,pose,side){
    const hair=frank?"#39333a":"#443a37",hairLight=frank?"#5f4a4b":"#624a40";
    const skin=frank?"#ba8467":"#b58062",light=frank?"#d7a17d":"#ca9572",shade=frank?"#9a6554":"#94634e";
    c.lineJoin="round";c.lineCap="round";
    if(frank){
      oval(c,24,-34,17,18,hair,-.3);
      path(c,"M19 -39 Q40 -57 42 -39 Q41 -52 31 -50 Q48 -47 40 -28 Q44 -42 36 -42",hairLight,1.8);
    }
    path(c,"M-10 -24 C-10 -13 -9 -3 -17 2 L-31 11 Q-12 34 13 28 L31 6 L13 -2 L12 -27 Z",skin);
    path(c,"M-9 -14 Q2 -11 12 -21 L10 -5 Q5 2 -5 4 L-14 0 Z",shade);
    if(frank){
      path(c,"M-18 1 Q-39 5 -51 16 Q-60 28 -64 69 L-66 100 L62 100 Q60 47 55 25 Q50 10 27 5 L15 1 Q-1 17 -18 1Z","#4a586e");
      path(c,"M-19 2 L-32 8 L-26 28 L-14 21 L-6 32 L-8 13 Z M16 1 L32 7 L23 24 L13 18 L4 32 L6 11 Z","#788294");
      path(c,"M-18 -1 Q-5 5 12 -2 L22 2 Q13 13 0 13 Q-11 11 -22 4 Z","#a95842");
      path(c,"M9 6 L23 6 L28 26 L21 22 L20 30 L13 16 L8 27 L5 22 L2 23 Z","#bc7353");
      path(c,"M-59 25 Q-43 27 -43 46 M-22 35 L-30 66 L-12 68 M11 38 L35 36 L33 56 L13 59 Z","#37485d",2.2);
      path(c,"M-27 36 L-8 40 L-8 49 L-19 50 L-28 42 Z M10 35 L35 33 L35 41 L22 46 L10 42 Z","#7b8290");
      path(c,"M-19 6 Q-18 26 -8 49 L-7 61 M20 10 Q22 32 15 59","#51423c",3);
      c.save();c.translate(3,63);c.rotate(-.085);
      c.fillStyle="#aeb3ac";c.fillRect(-17,-9,34,19);c.fillStyle="#40464b";c.fillRect(-17,-3,34,11);
      c.fillStyle="#ccd0bc";c.fillRect(-12,-12,6,4);c.fillRect(6,-11,6,3);c.fillStyle="#37444d";c.fillRect(-14,-7,7,3);
      oval(c,1,1,8,8,"#b8bab0");oval(c,1,1,6.2,6.5,"#374447");oval(c,1,1,3.1,3.5,"#5c7674");oval(c,2,-1,1.3,1.1,"#a7bbb0");c.restore();
    }else{
      path(c,"M-17 -1 Q-38 4 -48 11 Q-59 19 -66 53 L-54 59 L-61 100 L63 100 L59 62 L70 56 Q65 20 51 11 Q37 4 17 -1 Q3 15 -17 -1Z","#368f86");
      path(c,"M-16 1 L-29 5 Q-22 17 -8 23 L-3 14 Z M12 -1 L25 3 L16 21 L7 14 L1 23 L2 10 Z","#76aea0");
      path(c,"M-54 25 L-57 51 L-68 48 L-67 53 L-54 59 L-45 55 M45 23 L51 53 L68 51 L70 57 L57 62 L46 55 M3 15 L-1 60","#28736b",2.6);
      path(c,"M19 32 L39 30 L38 50 Q29 56 20 51 Z","#5ca79a");
      path(c,"M19 32 L38 30 M-19 70 L-26 86 M32 75 L40 89","#72ae9f",1.3);
      oval(c,1,23,1.2,1.2,"#e2d9b6");oval(c,.1,31,1.1,1.1,"#c5d1b1");
    }
    c.save();if(pose===1)c.rotate(side<0?.055:-.065);
    oval(c,-23,-45,5.2,8.1,shade,-.17);oval(c,22,-46,5.2,8,skin,.12);
    if(frank){
      path(c,"M-25 -65 C-20 -86 11 -85 21 -66 C28 -54 23 -31 17 -22 Q10 -12 2 -12 Q-6 -12 -13 -17 Q-24 -25 -25 -44 Z",skin);
      path(c,"M-24 -64 Q-15 -78 -7 -73 Q-18 -61 -17 -49 L-17 -34 Q-14 -22 -5 -15 Q-20 -17 -24 -36 Z",shade);
      path(c,"M-23 -41 Q-29 -54 -26 -68 Q-25 -85 -10 -89 Q4 -96 17 -87 Q29 -83 28 -64 Q27 -55 24 -50 Q22 -64 13 -67 Q5 -72 2 -79 Q-5 -70 -16 -66 Q-23 -63 -23 -41Z",hair);
      path(c,"M-22 -68 Q-15 -84 1 -85 M-22 -63 Q-7 -72 -2 -81 M7 -84 Q14 -71 23 -68",hairLight,2.2);
      path(c,"M23 -59 Q32 -51 24 -41 Q21 -38 26 -34 M-23 -55 Q-27 -45 -22 -39",hair,2.4);
      oval(c,23,-37,1.9,2.1,"#dcb875");
    }else{
      path(c,"M-24 -67 Q-20 -81 -1 -81 Q18 -82 23 -68 Q26 -60 23 -40 Q22 -30 18 -24 L10 -17 Q6 -13 -1 -13 Q-9 -13 -14 -18 L-22 -26 Q-24 -35 -24 -48 Z",skin);
      path(c,"M-23 -56 C-17 -67 -20 -44 -16 -33 Q-15 -23 -7 -18 Q-16 -17 -22 -27 Q-26 -41 -23 -56Z",shade);
      path(c,"M-25 -43 Q-31 -57 -26 -70 L-28 -69 Q-28 -78 -19 -81 Q-20 -87 -13 -87 Q-9 -92 -1 -89 Q7 -92 14 -87 Q24 -89 24 -81 Q32 -77 26 -67 Q28 -58 22 -50 L21 -63 Q17 -66 14 -70 Q4 -65 -2 -67 Q-10 -62 -16 -65 Q-21 -61 -22 -49Z",hair);
      path(c,"M-21 -73 Q-20 -80 -14 -80 M-14 -77 Q-12 -85 -6 -83 M-4 -78 Q2 -85 8 -82 M8 -76 Q13 -82 19 -79",hairLight,2.5);
    }
    if(frank){
      path(c,"M-17 -55 Q-13 -60 -6 -56 M5 -56 Q11 -61 17 -58",hair,1.9);
      path(c,"M-19 -39 Q-15 -34 -9 -34 M16 -44 Q20 -43 20 -39",light,1.2);
      oval(c,14,-37,.8,.73,"#805549");
    }else{
      path(c,"M-17 -56 Q-12 -59 -5 -56 M5 -57 Q12 -60 17 -57",hair,2.8);
      path(c,"M-17 -29 Q-16 -22 -10 -20 M8 -20 Q16 -24 17 -29",shade,1.9);
      for(const [u,v] of [[-14,-26],[-10,-23],[-8,-23],[6,-21],[10,-23],[13,-25],[-3,-17],[0,-18],[4,-18]])oval(c,u,v,.62,.49,shade);
    }
    const glance=(pose===1?-side:0)*1.3;
    for(const eye of [-1,1]){
      const x=eye*11.2;
      if(pose===2&&((frank&&eye<0)||(!frank&&eye>0))){
        path(c,eye<0?"M-17 -49 Q-11 -53 -6 -49":"M5 -49 Q11 -53 16 -49","#59443e",1.9);
      }else{
        oval(c,x,-50,4.7,1.75,"#d8b79a");oval(c,x+glance,-50.1,1.55,1.7,"#403a35");
        path(c,eye<0?"M-16 -50 Q-11 -54 -6 -50":"M6 -50 Q11 -54 16 -50",hair,1.35);
      }
    }
    path(c,"M1 -51 Q0 -44 -3 -39 Q-2 -37 1 -37 M3 -38 Q5 -39 6 -38",shade,1.55);
    path(c,"M7 -43 Q13 -46 18 -44 M-15 -45 Q-11 -46 -7 -44",light,1.65);
    if(pose===2){
      path(c,"M-10 -30 Q0 -25 11 -31 Q7 -19 1 -20 Q-6 -20 -10 -30Z","#805047");
      path(c,"M-8 -29 Q1 -26 9 -30 Q6 -25 0 -25 Q-5 -25 -8 -29Z","#e3c5a6");
    }else if(pose===1)path(c,"M-8 -29 Q1 -23 10 -31","#87574b",1.85);
    else{path(c,"M-8 -29 Q-2 -28 1 -29 Q4 -28 9 -30","#89594b",1.65);path(c,"M-3 -25 Q2 -24 5 -26",light,1.3);}
    c.restore();
    if(pose===2)hand(c,side);
  }
  // The same exposure is used by the booth finder and the developed strip.
  const fw=286,fh=174,exposures=new Map();
  function paintPortrait(c,siteId,pose,lead){
    const p=shops[siteId]||shops.luna;c.save();
    c.fillStyle=p.fabric;c.fillRect(0,0,fw,fh);
    // Folds are sewn as shallow arcs at the valance and gather into vertical flutes.
    for(let i=-1;i<10;i++){
      const u=i*34;c.save();c.translate(u,0);
      path(c,"M0 0 Q6 19 3 55 Q-1 107 7 174 L16 174 Q5 100 13 51 Q16 16 13 0 Z",p.fold);
      path(c,"M18 0 Q26 29 22 64 Q16 131 25 174 L28 174 Q22 115 28 61 Q32 26 26 0Z",p.light);c.restore();
    }
    for(const side of [-1,1]){
      const frank=lead==="frankie"?side<0:side>0;
      const cx=fw/2+side*(pose===1?37:pose===2?53:59),cy=(frank?112:105)+(pose===1?3:0);
      c.save();c.translate(cx,cy);c.rotate(pose===1?-side*.20:pose===2?side*.045:frank?-.036:.032);
      const size=frank?.97:1.02;c.scale(size,size);sitter(c,frank,pose,side);c.restore();
    }
    const falloff=c.createRadialGradient(fw*.47,fh*.36,32,fw*.5,fh*.51,fw*.62);
    falloff.addColorStop(0,"rgba(250,195,138,.035)");falloff.addColorStop(.58,"rgba(132,97,73,.025)");falloff.addColorStop(1,"rgba(56,44,48,.39)");
    c.fillStyle=falloff;c.fillRect(0,0,fw,fh);
    let seed=27+pose*79+(lead==="frankie"?31:0);
    const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
    for(const grain of ["rgba(63,42,47,.105)","rgba(255,231,187,.12)"]){
      c.fillStyle=grain;for(let i=0;i<620;i++)c.fillRect(next()*fw,next()*fh,.28+.51*next(),.33+.47*next());
    }
    c.restore();
  }
  function portrait(c,x,y,w,h,siteId,pose=0,lead="guest"){
    if(!(w>0&&h>0))return;
    const key=siteId+"/"+pose+"/"+lead,s=Math.max(w/fw,h/fh);
    let tile=exposures.get(key);
    if(!tile&&typeof document!=="undefined"){
      tile=document.createElement("canvas");tile.width=fw*2;tile.height=fh*2;
      const ctx=tile.getContext?.("2d");if(ctx){
        ctx.scale(2,2);paintPortrait(ctx,siteId,pose,lead);
        if(exposures.size>=6)exposures.delete(exposures.keys().next().value);
        exposures.set(key,tile);
      }else tile=null;
    }
    c.save();c.beginPath();c.rect(x,y,w,h);c.clip();c.translate(x+(w-fw*s)/2,y+(h-fh*s)/2);c.scale(s,s);
    if(tile)c.drawImage(tile,0,0,fw,fh);else paintPortrait(c,siteId,pose,lead);
    c.restore();
  }
  function strip(canvas,r){
    if(!canvas||!r)return;
    if(canvas.width!==320)canvas.width=320;if(canvas.height!==704)canvas.height=704;
    const c=canvas.getContext("2d");if(!c)return;
    const p=shops[r.site]||shops.luna;
    c.save();c.setTransform(1,0,0,1,0,0);c.fillStyle="#efdfbd";c.fillRect(0,0,320,704);
    c.fillStyle=p.print;c.fillRect(0,0,320,9);
    c.textAlign="left";c.textBaseline="alphabetic";c.font="bold italic 31px Georgia,serif";
    c.fillText("Foto Bahía",16,43);c.textAlign="right";c.font="bold 12px 'Courier New',monospace";
    c.fillText("TRES POSES",303,39);c.fillStyle=p.accent;c.fillRect(16,52,288,2);
    for(let i=0;i<3;i++){
      const y=62+i*184;
      c.fillStyle="#4a4744";c.fillRect(14,y-1,292,178);
      if(Number.isInteger(r.poses?.[i]))portrait(c,16,y+1,288,174,r.site,r.poses[i],r.lead);
      c.fillStyle=p.accent;c.fillRect(5,y+150,3,12+i*4);
    }
    c.fillStyle=p.print;c.font="bold 28px Georgia,serif";c.textAlign="left";c.fillText(p.label,15,642);
    const minute=((Math.floor(Number(r.minute)||0)%1440)+1440)%1440,hour=Math.floor(minute/60);
    const time=(hour%12||12)+":"+String(minute%60).padStart(2,"0")+(hour<12?" AM":" PM");
    c.font="bold 12px 'Courier New',monospace";c.fillText("DAY "+Math.max(1,Math.floor(Number(r.day)||1))+"   "+time,16,669);
    c.save();c.translate(302,676);c.rotate(-.045);c.textAlign="right";c.font="italic 19px Georgia,serif";c.fillText("F. Prado",0,0);
    path(c,"M-68 3 Q-41 -1 -16 2 Q-4 3 0 1",p.print,.9);c.restore();
    c.fillStyle=p.accent;c.fillRect(0,693,320,2);
    // Fine paper tooth stays fixed when a strip is opened again.
    let seed=387;
    const rand=()=>{seed=(Math.imul(1664525,seed)+1013904223)>>>0;return seed/4294967296;};
    c.fillStyle="rgba(57,43,38,.13)";
    for(let i=0;i<270;i++){const x=rand()*320,y=rand()*704;c.fillRect(x,y,.3+rand()*1.4,.38);}
    c.restore();
  }
  window.BayFotoBoothArt=Object.freeze({world,map,portrait,strip});
})();
