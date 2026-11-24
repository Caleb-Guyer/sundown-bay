/* The Palm's street windows, working lunch counter and the back room off Ocean Drive. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const front=129.50,back=104.50,south=12.50,north=47.50,level=.142,doorZ=30.15;
  const P=(x,z,yaw=0,y=level)=>({x,z,y,yaw}),bound=(x,z,w,d,bottom,top)=>({x,z,w,d,bottom,top,streetProp:true});
  const c={stucco:"#eec9a6",ivory:"#f2d9b1",vanilla:"#ffe7bd",chrome:"#abbab2",shine:"#d4d8bd",
    metal:"#748b86",teal:"#578b84",mint:"#88b3a0",lightMint:"#b7c8ad",deep:"#314f50",
    jade:"#3d6966",floor:"#cfbea4",stone:"#b4ae98",sage:"#abc0a6",sageDark:"#8fa393",
    rose:"#c97162",tomato:"#af544a",redLight:"#da8a77",oxblood:"#7d453e",orange:"#dab06f",
    walnut:"#87634e",wood:"#ab8057",darkWood:"#635345",brass:"#c9a669",tile:"#dedcc2",
    enamel:"#eee6c9",dark:"#334244",chalk:"#eee2bc",chalkBlue:"#a9cec1",slate:"#344c49",
    shade:"#3d7167",lamp:"#ffe4a1",steel:"#8b9892",glass:"#98b9ab",mat:"#58675f"};

  const table=P(116.8,34.25,0,.94),boothX=126.96,boothZ=[16.17,22.37,37.93,44.08],stoolX=[112.82,115.12,121.15];
  const seats=[];
  for(const [i,z] of boothZ.entries())for(const side of [-1,1]){
    const yaw=side>0?pi:0;
    seats.push({id:"booth-"+i+"-"+(side>0?"north":"south"),kind:"booth",seatY:.647,
      sit:P(boothX+.02,z+side*1.00,yaw),stand:P(124.58,z+side*.98,pi/2),viewYaw:Math.atan2(2.4,side*1.10)});
  }
  for(const [i,x] of stoolX.entries())seats.push({id:"stool-"+i,kind:"stool",seatY:.814,sit:P(x,23.92,pi),stand:P(x,25.0,pi),viewYaw:pi-.28});
  for(const [i,x] of [114.75,117.03].entries())seats.push({id:"rail-"+i,kind:"bench",seatY:.619,sit:P(x,43.94,pi),stand:P(x,42.88,0),viewYaw:.34});
  const site={id:"palm-diner",kind:"palm-diner",name:"Palm Diner",street:"Ocean Drive",center:P(117,30),table,
    door:P(front+.012,doorZ,-pi/2),outside:P(131.15,doorZ,-pi/2,.078),inside:P(127.2,doorZ,-pi/2),sidewalk:P(135.60,doorZ,-pi/2,.078),
    curb:{...P(139.05,doorZ,pi,.037),dir:2}, counter:P(119,23.42,pi),board:P(111.55,33,-pi/2),rack:P(111.55,38.65,-pi/2),
    house:P(122.1,34.1,-pi/2),checkIn:P(120.8,32.65,-pi/2),breaker:P(118.72,34.25,-pi/2),seats};
  site.pickup=site.curb;site.marker={...site.door,kind:site.kind,name:site.name};
  site.nav=[site.sidewalk,site.outside,site.door,site.inside,P(124.6,doorZ),P(121.45,30.1),P(121.55,38.46),
    P(112.55,38.46),P(112.55,30.05),P(113.2,26.63),P(121.55,25.93),P(124.58,42.76),P(124.58,16.17),
    site.breaker,site.board,site.rack,...seats.map(s=>s.stand)];
  const blocks=[
    bound(back,30,.24,35.12,0,8.4),bound(117,south,24.9,.25,0,8.4),bound(117,north,24.9,.25,0,8.4),
    bound(107.53,30.0,6.05,34.87,0,3.51),
    bound(front,(south+doorZ-1.09)/2,.26,doorZ-1.09-south,0,3.52),
    bound(front,(north+doorZ+1.09)/2,.26,north-doorZ-1.09,0,3.52),
    bound(116.77,22.12,11.8,1.09,level,1.173),bound(116.62,14.22,10.86,1.67,level,1.46),
    bound(123.20,14.0,1.68,2.16,level,2.31),bound(111.11,17.74,.95,4.8,level,1.08),
    bound(110.74,38.61,.36,3.14,level,2.05),bound(116.04,44.04,4.84,.75,level,.619),
    bound(116.04,44.45,4.85,.12,.45,1.26)];
  for(const z of boothZ){
    blocks.push(bound(boothX+.17,z,1.85,1.08,level,.908));
    for(const side of [-1,1]){
      blocks.push(bound(boothX,z+side*1.03,2.18,.795,level,.647));
      blocks.push(bound(boothX,z+side*1.352,2.19,.159,.37,1.36));
    }
  }
  for(const x of stoolX)blocks.push(bound(x,23.92,.56,.56,level,.814));
  const cameraBlocks=[bound(117,30,25.14,35.04,3.58,8.84),bound(front,doorZ,.33,2.37,2.50,3.58),
    bound(116.9,22.12,12.3,1.32,2.84,3.58)];
  const contains=(x,z)=>x>=back-.03&&x<=front+.04&&z>=south&&z<=north;
  function floor(x,z){
    if(contains(x,z))return level;
    if(x>=front&&x<=130.79&&Math.abs(z-doorZ)<1.17)return .077+(level-.077)*clamp((130.79-x)/1.28,0,1);
    return null;
  }
  function stepDoor(amount,dt,subjects){
    const was=clamp(amount||0,0,1);
    const nearby=subjects.some(p=>p&&Math.abs(p.x-front)<(was>.05?3.75:3.05)&&Math.abs(p.z-doorZ)<(was>.05?2.23:1.84));
    return clamp(was+Math.max(0,dt)*(nearby?2.25:-1.43),0,1);
  }
  function doorClear(x,z,r,amount){
    if(Math.abs(x-front-.018)>.064+r||Math.abs(z-doorZ)>2.24+r)return true;
    const slide=1.109*clamp(amount??1,0,1);
    return ![-1,1].some(side=>Math.abs(z-doorZ-side*(.55+slide))<.549+r);
  }
  const surface=(g,x,z,w,d,y,color)=>g.quad([x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],color);
  const east=(x,z,y)=>(u,v)=>[x,y+v,z+u];
  const northFace=(z,x,y)=>(u,v)=>[x-u,y+v,z];
  const southFace=(z,x,y)=>(u,v)=>[x+u,y+v,z];
  function patch(g,plane,x,y,w,h,col){
    g.quad(plane(x-w/2,y-h/2),plane(x+w/2,y-h/2),plane(x+w/2,y+h/2),plane(x-w/2,y+h/2),col);
  }
  function stroke(g,plane,a,b,w,col){
    const dx=b[0]-a[0],dy=b[1]-a[1],d=Math.hypot(dx,dy);if(d<.00001)return;
    const u=-dy*w/(2*d),v=dx*w/(2*d);
    g.quad(plane(a[0]+u,a[1]+v),plane(b[0]+u,b[1]+v),plane(b[0]-u,b[1]-v),plane(a[0]-u,a[1]-v),col);
  }
  function polyline(g,f,points,w,col){for(let n=1;n<points.length;n++)stroke(g,f,points[n-1],points[n],w,col);}
  function ellipse(g,f,cx,cy,rx,ry,col,n=16){
    for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n;
      g.tri(f(cx,cy),f(cx+rx*Math.cos(a),cy+ry*Math.sin(a)),f(cx+rx*Math.cos(b),cy+ry*Math.sin(b)),col);
    }
  }
  const lettering=(g,text,size,col,plane)=>BayCutArt.signText(g,text,size,col,plane);
  function streetShell(g){
    // These pieces are baked into the actual city, so the window frames and sunny ledge
    // retain their shadows in other people's photographs and along Ocean Drive.
    g.box(back,1.84,30,.23,3.65,35,c.stucco);
    for(const z of [south,north])g.box(117,1.84,z,25.15,3.67,.235,c.stucco);
    const runs=[[south,doorZ-1.10],[doorZ+1.10,north]];
    for(const [a,b] of runs){
      const z=(a+b)/2,d=b-a;
      g.box(front,.572,z,.22,1.012,d,c.teal);g.box(front+.015,.516,z,.265,.166,d,c.redLight);
      g.box(front,1.082,z,.38,.096,d+.02,c.lightMint);
      g.box(front,2.905,z,.245,.29,d,c.teal);g.box(front,3.242,z,.255,.416,d,c.stucco);
      for(let i=0;i<=4;i++){
        const zz=a+d*i/4;
        g.box(front,1.947,zz,.20,1.82,i===0||i===4?.21:.099,c.lightMint);
        g.box(front+.119,1.96,zz,.024,1.75,.039,c.chrome);
      }
      g.box(front,2.57,z,.114,.065,d,c.chrome);
      for(let i=0;i<4;i++){
        const pane=east(front+.045,a+(i+.5)*d/4,1.65);
        stroke(g,pane,[-1.50,.52],[-1.29,.76],.024,"#b9cdc2");
        stroke(g,pane,[-1.34,.55],[-1.22,.69],.012,"#c5cbb2");
      }
    }
    g.box(front,3.268,doorZ,.29,.424,2.39,c.stucco);g.box(front,2.752,doorZ,.37,.51,2.34,c.deep);
    g.box(front+.17,2.719,doorZ,.06,.08,2.42,c.brass);
    for(const side of [-1,1])g.box(front+.01,1.31,doorZ+side*1.14,.32,2.59,.098,c.chrome);
    g.quad([front+.02,level+.002,doorZ-1.12],[130.79,.078,doorZ-1.12],[130.79,.078,doorZ+1.12],[front+.02,level+.002,doorZ+1.12],c.floor);
    for(const x of [129.50,129.57])g.box(x,level+.004,doorZ,.023,.011,2.19,c.steel);
    // The sign hangs at a right angle to the boulevard for drivers coming either way.
    g.pole([front+.10,3.30,26.12],[front+1.27,3.30,26.12],.033,c.metal,6);
    for(const x of [front+.49,front+1.12])g.box(x,3.135,26.12,.033,.32,.045,c.dark);
    g.box(front+.79,2.70,26.12,1.19,.75,.095,c.deep);
    for(const sign of [-1,1]){
      const face=sign<0?southFace(26.062,front+.79,2.71):northFace(26.178,front+.79,2.71);
      patch(g,face,0,0,1.10,.63,c.ivory);patch(g,face,0,0,1.02,.55,c.jade);
      lettering(g,"POOL",.043,c.vanilla,face);
    }
  }

  function roof(g){
    g.box(117,8.51,30,25.52,.52,35.52,c.lightMint);
    g.box(117,8.79,30,24.30,.16,34.30,"#849095");
    g.box(113.75,9.45,39.45,13.5,2.00,11.2,c.stucco);
    g.box(113.75,10.5,39.45,14,.27,11.9,c.lightMint);
    g.box(117,3.643,30,24.94,.125,34.89,"#d6cbb2");
    for(const z of [16.17,22.4,28.6,36.1,43.77])g.box(119.6,3.50,z,19.27,.20,.22,"#b5b49a");
    for(const x of [112.0,122.40,128.52])g.box(x,3.572,30,.049,.024,34.4,"#bbb69f");
  }
  function doorLeaf(g){
    const y=.17+2.29/2;
    g.box(0,.285,0,.085,.22,1.095,c.steel);g.box(.006,.427,0,.092,.072,1.095,c.shine);
    g.box(0,2.427,0,.09,.084,1.095,c.chrome);
    for(const s of [-1,1])g.box(0,y,s*.527,.084,2.28,.047,c.chrome);
    g.box(.006,1.265,0,.087,.058,1.05,c.brass);
    for(const x of [-.065,.065])g.box(x,1.007,0,.045,.037,.87,c.chrome);
  }
  function billiardFloor(rect){
    const x=116.07,z=35.31,w=10.28,d=17.93,dx=w/10,dz=d/18;
    rect(x,z,10.79,18.46,c.dark,.001);rect(x,z,10.66,18.32,c.ivory,.002);
    rect(x,z,10.55,18.20,c.sageDark,.003);rect(x,z,w,d,c.sage,.004);
    // Old two-tone linoleum, laid in ten courses across and repaired below the end rail.
    for(let i=0;i<10;i++)for(let j=0;j<18;j++){
      if((i+j)%2===1)continue;
      rect(x-w/2+(i+.5)*dx,z-d/2+(j+.5)*dz,dx-.017,dz-.017,
        i===6&&j===11?"#a7b39b":"#9fb49d",.005);
    }
  }
  function nearFloor(g){
    surface(g,117,30,24.96,34.94,level,c.floor);
    billiardFloor((x,z,w,d,col,offset)=>surface(g,x,z,w,d,level+offset,col));
    const heights=[.085,.062,.03];
    for(let i=0;i<210;i++){
      const x=110.7+18.44*((i*173+51)%997)/997,z=12.76+34.43*((i*619+64)%1009)/1009;
      const pool=x<121.46&&z>26.09&&z<44.54,r=heights[i%3];
      const color=pool?(i%2?"#a2b59b":"#9db198"):(i%3===0?"#baa58a":i%3===1?"#dbccb3":"#a6a792");
      g.tri([x,level+.006,z],[x+r,level+.006,z+r*.29],[x+r*.3,level+.006,z+r*.66],color);
    }
    const tiles=["#d3c6ab","#978f79"];
    for(let i=0;i<11;i++)for(let j=0;j<7;j++)surface(g,110.99+i*1.1,13.04+j*1.12,1.09,1.11,level+.009,tiles[(i+j)%2]);
    surface(g,128.28,doorZ,1.68,2.1,level+.011,c.mat);
    for(let n=-4;n<=4;n++)surface(g,128.28,doorZ+n*.194,1.53,.019,level+.013,"#969b82");
    const mosaic=(u,v)=>[125.83-v,level+.012,doorZ+u];
    lettering(g,"PALM",.088,c.jade,mosaic);
  }
  function upholstery(g,x,z,side){
    g.box(x,.354,z+side*1.03,2.17,.39,.795,c.oxblood);
    g.box(x,.554,z+side*.997,2.18,.186,.737,c.rose);
    g.box(x,.928,z+side*1.352,2.185,.782,.155,c.redLight);
    g.box(x,1.319,z+side*1.342,2.203,.050,.158,c.ivory);
    const backrest=southFace(z+side*1.271,x,0);
    for(let i=-3;i<=3;i++){
      patch(g,backrest,i*.258,.938,.023,.67,i===0?c.oxblood:c.rose);
      surface(g,x+i*.258,z+side*1.103,.021,.48,.650,c.rose);
    }
    for(const end of [-1,1])g.box(x+end*1.080,.829,z+side*1.348,.036,.93,.185,c.chrome);
  }
  function mug(g,x,y,z,color=c.enamel,turn=1){
    g.cyl(x,y+.070,z,.074,.059,.14,9,color);
    g.cyl(x,y+.143,z,.061,.061,.008,9,"#5b4636");
    g.box(x+.078*turn,y+.084,z,.062,.020,.029,color);g.box(x+.099*turn,y+.062,z,.020,.044,.030,color);
    g.box(x+.077*turn,y+.039,z,.052,.018,.029,color);
  }
  function placeSetting(g,x,z,y,side,tone){
    surface(g,x,z,.66,.43,y+.004,tone);
    g.cyl(x+.024,y+.018,z,.186,.158,.025,12,c.enamel);
    g.cyl(x+.024,y+.035,z,.133,.134,.010,12,"#d9c7a7");
    g.box(x-.239,y+.013,z,.026,.011,.207,c.metal);g.box(x-.245,y+.018,z+side*.09,.041,.012,.051,c.shine);
  }
  function booth(g,z,index){
    for(const side of [-1,1])upholstery(g,boothX,z,side);
    g.box(boothX+.16,.803,z,1.88,.12,1.09,c.chrome);
    g.box(boothX+.16,.866,z,1.9,.062,1.105,c.vanilla);
    for(const x of [boothX-.38,boothX+.61]){
      g.cyl(x,.468,z,.073,.089,.60,8,c.steel);g.cyl(x,.19,z,.20,.24,.077,8,c.metal);
    }
    placeSetting(g,boothX+.1,z+.274,.898,-1,index%2?"#d5aa83":"#b6c2a0");
    if(index!==3)placeSetting(g,boothX, z-.271,.898,1,"#d4b69a");
    g.box(boothX+.854,1.017,z,.168,.236,.21,c.chrome);
    g.box(boothX+.85,1.142,z,.127,.029,.162,c.enamel);
    g.box(boothX+.75,1.026,z,.023,.052,.116,c.deep);
    mug(g,boothX-.47,.899,z+(index%2?-.35:.33),index===1?c.mint:c.enamel);
    for(const offset of [-.093,.091]){
      g.cyl(boothX+.51,.968,z+offset,.046,.045,.135,7,offset>0?c.ivory:c.walnut);
      g.cyl(boothX+.51,1.047,z+offset,.043,.043,.029,7,c.chrome);
    }
  }
  function counters(g){
    g.box(116.77,.616,22.12,11.8,.93,1.07,c.teal);
    for(const z of [21.56,22.683]){
      g.box(116.77,1.054,z,11.81,.124,.038,c.chrome);
      g.box(116.77,.361,z,11.73,.090,.041,c.lightMint);
    }
    g.box(116.77,1.119,22.12,11.93,.102,1.18,c.vanilla);
    const enamel=northFace(22.666,116.77,0);
    for(let x=111.23;x<122.35;x+=.67)patch(g,enamel,116.77-x,.702,.027,.467,c.mint);
    for(const x of stoolX){
      g.cyl(x,.213,23.92,.196,.255,.132,12,c.metal);g.cyl(x,.455,23.92,.077,.090,.47,9,c.chrome);
      g.cyl(x,.699,23.92,.287,.196,.104,14,c.shine);g.cyl(x,.78,23.92,.291,.298,.066,14,c.rose);
    }
    g.pole([111.25,.438,22.93],[122.28,.438,22.93],.033,c.brass,8);
    for(const x of [111.67,115.05,118.48,121.92])g.pole([x,.427,22.672],[x,.438,22.93],.022,c.steel);
    placeSetting(g,119,22.408,1.172,-1,"#bdc8ab");mug(g,119.4,1.172,22.18);
    for(const x of [113.12,116.17,120.77]){
      g.box(x,1.31,22.03,.202,.264,.238,c.metal);g.box(x,1.448,22.02,.156,.03,.197,c.enamel);
      for(const a of [-.20,.23]){g.cyl(x+a,1.275,22.04,.065,.067,.202,8,a>0?c.rose:c.orange);g.cyl(x+a,1.404,22.04,.032,.052,.055,7,c.ivory);}
    }
    g.box(121.93,1.286,22.08,.84,.215,.60,c.deep);
    g.box(121.94,1.466,22.155,.65,.16,.42,c.metal);
    for(let col=0;col<6;col++)for(let row=0;row<3;row++)g.box(121.71+col*.078,1.557,22.06+row*.051,.055,.018,.038,row%2?c.tile:c.dark);
    g.box(121.95,1.752,22.255,.56,.189,.094,c.deep);
    g.box(121.95,1.769,22.312,.45,.064,.012,"#a7c3a2");
  }
  function kettle(g,x,y,z,black=false){
    const tone=black?"#8a735a":c.chrome;
    g.cyl(x,y+.108,z,.150,.088,.192,12,tone);
    g.cyl(x,y+.219,z,.141,.153,.036,12,c.dark);
    g.pole([x+.142,y+.168,z],[x+.229,y+.196,z],.022,c.dark,5);
    g.pole([x+.225,y+.196,z],[x+.237,y+.107,z],.024,c.dark,5);
    g.pole([x+.237,y+.107,z],[x+.151,y+.084,z],.021,c.dark,5);
  }
  function galley(g){
    g.box(116.62,.70,14.22,10.86,1.08,1.67,c.steel);
    g.box(116.62,1.278,14.22,10.94,.103,1.72,c.chrome);
    g.box(116.61,1.55,13.435,10.93,.45,.099,c.metal);
    for(const x of [112.56,114.29,117.07,119.19,120.86]){
      g.box(x,.744,15.067,1.29,.65,.042,"#7f9590");g.box(x,1.014,15.099,.39,.054,.038,c.shine);
    }
    g.box(117.43,1.365,14.32,2.95,.060,1.19,c.dark);
    for(let n=0;n<6;n++)g.box(116.53+n*.32,1.414,14.29,.037,.022,1.03,"#586562");
    for(const x of [116.86,118.14]){g.cyl(x,1.446,14.49,.23,.19,.048,10,c.oxblood);g.cyl(x,1.475,14.49,.215,.22,.029,10,c.orange);}
    g.box(117.45,2.58,14.09,3.49,.31,1.81,c.chrome);
    g.box(117.44,2.88,14.04,2.80,.34,1.36,c.steel);g.box(117.45,3.234,13.91,.90,.56,.75,c.metal);
    for(let i=0;i<8;i++)g.box(116.10+i*.37,2.428,14.15,.17,.018,1.13,"#61716b");
    g.box(113.14,1.401,14.35,1.01,.142,.718,c.dark);
    g.box(113.14,1.77,14.03,.97,.64,.15,c.deep);g.box(113.14,2.075,14.32,1.07,.17,.70,c.chrome);
    kettle(g,112.90,1.48,14.40);kettle(g,113.40,1.48,14.40,true);
    for(const x of [119.94,120.37])for(let j=0;j<4;j++)g.cyl(x,1.337+.027*j,14.31,.176,.152,.026,10,c.enamel);
    g.box(123.20,1.212,14.0,1.68,2.12,2.16,c.mint);
    g.box(123.20,1.183,15.10,1.46,1.80,.072,"#a3b9a7");
    g.box(123.71,1.28,15.152,.055,.45,.046,c.shine);
    g.box(120.51,2.35,12.74,2.98,1.15,.058,c.walnut);
    const menu=northFace(12.782,120.51,2.37);
    patch(g,menu,0,0,2.85,1.023,c.slate);
    lettering(g,"GRIDDLE",.050,c.chalk,(u,v)=>menu(u,v+.24));
    lettering(g,"COFFEE",.039,c.chalkBlue,(u,v)=>menu(u,v-.16));
    const backsplash=northFace(12.679,118,0);
    for(let x=110.96;x<124.98;x+=.47)for(let j=0;j<4;j++){
      const y=1.65+j*.315;
      if(x>118.94&&x<122.07&&y>1.70)continue;
      patch(g,backsplash,118-x,y,.459,.293,(Math.round(x*10)+j)%8===0?c.lightMint:c.tile);
    }
    g.box(111.11,.594,17.74,.95,.91,4.8,c.jade);
    g.box(111.12,1.064,17.74,1.02,.091,4.86,c.vanilla);
    g.box(111.06,1.119,18.92,.79,.041,1.02,c.steel);g.box(111.06,1.142,18.92,.64,.012,.85,c.deep);
    g.pole([110.83,1.12,19.51],[110.83,1.51,19.51],.027,c.chrome,7);
    g.pole([110.83,1.51,19.51],[111.06,1.50,19.32],.026,c.chrome,7);
  }
  function nameTag(g,f,word){
    const writing={
      Luz:[[[0,0],[.06,.62],[.21,.91],[.26,.63],[.08,.29],[.01,.02],[.28,.04],[.40,.18]],
        [[.35,.44],[.29,.12],[.35,.06],[.49,.36],[.47,.09],[.56,.08],[.7,.24]],[[.68,.38],[.97,.39],[.69,.06],[.97,.07],[1.13,.17]]],
      Val:[[[0,.71],[.12,.82],[.24,.09],[.32,.05],[.69,.91]],
        [[.78,.35],[.66,.43],[.49,.29],[.50,.10],[.61,.08],[.8,.40],[.74,.14],[.81,.09],[.98,.26]],
        [[.9,.14],[1.10,.49],[1.22,.89],[1.14,.92],[.99,.67],[.92,.25],[1,.08],[1.19,.11]]],
      Boone:[[[0,.05],[.08,.6],[.16,.88],[.38,.91],[.51,.78],[.5,.63],[.25,.48],[.49,.47],[.61,.35],[.53,.15],[.32,.05],[.11,.08]],
        [[.56,.23],[.64,.39],[.77,.4],[.84,.29],[.76,.09],[.64,.07],[.59,.18],[.67,.32],[.91,.32]],
        [[.88,.23],[.98,.37],[1.12,.37],[1.15,.22],[1.05,.08],[.93,.10],[.92,.21],[.97,.31],[1.25,.32]],
        [[1.27,.39],[1.21,.08],[1.41,.39],[1.51,.36],[1.44,.14],[1.50,.08],[1.65,.16]],
        [[1.61,.20],[1.85,.28],[1.86,.38],[1.74,.39],[1.62,.25],[1.67,.10],[1.81,.08],[1.98,.18]]]
    };
    for(const path of writing[word])polyline(g,f,path,.050,c.chalk);
  }
  const rows=[["Luz","luz",2.11],["Val","val",1.75],["Boone","boone",1.39]];
  const digitPath=[
    [[.13,.88],[.38,1],[.65,.81],[.60,.27],[.43,.04],[.13,.09],[0,.38],[.13,.88]],
    [[.02,.73],[.3,.95],[.28,.05]],[[.02,.77],[.18,.97],[.48,.97],[.63,.82],[.58,.66],[.03,.10],[.65,.10]],
    [[.04,.9],[.32,.99],[.57,.82],[.52,.62],[.26,.53],[.57,.42],[.61,.21],[.40,.06],[.06,.12]],
    [[.45,.96],[.04,.41],[.65,.41],[.5,.40],[.5,.04]],[[.62,.93],[.15,.93],[.10,.54],[.42,.58],[.62,.40],[.58,.17],[.36,.05],[.02,.15]],
    [[.55,.95],[.27,.83],[.02,.43],[.05,.18],[.25,.07],[.52,.08],[.64,.36],[.48,.52],[.26,.50],[.04,.34]],
    [[.01,.93],[.63,.93],[.19,.06]],[[.31,.54],[.10,.69],[.10,.84],[.28,.99],[.49,.96],[.60,.76],[.49,.62],[.15,.39],[.05,.22],[.20,.07],[.49,.08],[.65,.26],[.53,.44],[.31,.54]],
    [[.54,.54],[.25,.50],[.08,.60],[.08,.85],[.26,.99],[.53,.96],[.64,.78],[.58,.51],[.39,.05]]
  ];
  const boardX=110.679;
  function scoreBoard(g){
    const z=33.0;
    g.box(boardX-.044,2.06,z,.10,2.13,4.64,c.walnut);
    g.box(boardX+.013,2.06,z,.04,1.98,4.46,c.slate);
    g.box(boardX+.084,1.025,z,.21,.07,4.65,c.walnut);
    const f=east(boardX+.038,z,0);
    lettering(g,"HOUSE CARD",.066,c.chalk,(u,v)=>f(u-.37,2.76+v));
    lettering(g,"WON",.028,c.chalkBlue,(u,v)=>f(u+.89,2.43+v));
    lettering(g,"LOST",.028,c.chalkBlue,(u,v)=>f(u+1.66,2.43+v));
    for(const [name,,at] of rows){
      const hand=(u,v)=>f(-1.78+u*.46,at-.12+v*.28);
      nameTag(g,hand,name);stroke(g,f,[-1.91,at-.179],[2.03,at-.17],.009,"#688077");
    }
    for(const u of [.32,1.31])stroke(g,f,[u,1.21],[u+.006,2.59],.010,"#70857a");
    for(const [j,col] of [c.chalk,c.chalkBlue].entries())g.box(boardX+.122,1.075,z-1.1+j*.31,.021,.027,.163,col,(-1+j)*.14);
    g.box(boardX+.119,1.097,z+1.85,.095,.081,.257,c.wood);
    for(const dz of [-.81,.81])g.pole([boardX-.02,3.22,z+dz],[boardX+.23,3.16,z+dz],.024,c.brass,6);
    g.box(boardX+.22,3.15,z,.15,.105,2.43,c.jade);
    g.box(boardX+.22,3.093,z,.111,.019,2.31,c.enamel);
  }
  function cueRack(g){
    const z=38.65;
    for(const y of [.31,1.57]){
      g.box(110.755,y,z,.34,.10,2.99,c.walnut);g.box(110.94,y+.013,z,.027,.078,2.99,c.wood);
    }
    for(let i=0;i<6;i++){
      const a=z-1.10+i*.427,j=i%3,tip=110.82+(j-1)*.053;
      g.pole([110.88,.37,a],[110.87,.85,a-.014],.021,[c.walnut,c.deep,c.oxblood][j],7);
      g.pole([110.87,.85,a-.014],[tip,1.91-j*.035,a+.037],.012,"#d9b982",7);
      g.pole([tip,1.89-j*.035,a+.037],[tip,1.92-j*.035,a+.038],.011,c.chalkBlue,6);
    }
    const f=east(110.727,z,2.21);patch(g,f,0,0,1.48,.32,c.wood);
    lettering(g,"CUES",.039,c.vanilla,f);
    for(const i of [0,1,2])g.box(110.82,.383,z+1.01+i*.078,.058,.049,.058,"#728fac");
  }
  function housePaint(g){
    // Rolled enamel on the spectator wall, with a brush-lettered word above its old block capitals.
    const base=(depth)=>southFace(north-.126-depth,116.04,2.24);
    const edge=base(.010),band=base(.014),ink=base(.022);
    ellipse(g,edge,0,0,2.60,.78,c.walnut,40);
    ellipse(g,band,0,0,2.54,.728,"#e0b689",40);
    ellipse(g,base(.018),0,0,2.42,.655,"#587e70",40);
    const script=[
      [[0,-.11],[.13,.28],[.31,.71],[.47,.81],[.61,.76],[.60,.57],[.41,.41],[.16,.38]],
      [[.48,.10],[.60,.33],[.75,.42],[.81,.32],[.69,.17],[.56,.13],[.55,.21],[.77,.38],[.84,.44],[.76,.20],[.83,.15],[.99,.29]],
      [[.92,.19],[1.10,.53],[1.28,.83],[1.29,.71],[1.19,.56],[.97,.34],[.93,.17],[1.01,.13],[1.17,.27]],
      [[1.18,.36],[1.13,.14],[1.35,.39],[1.42,.37],[1.33,.13],[1.54,.36],[1.62,.38],[1.54,.18],[1.63,.14],[1.86,.26]],
      [[.12,.03],[.59,.10],[1.01,.06],[1.35,.03],[1.87,.09],[2.08,.18]]];
    for(const path of script)polyline(g,(u,v)=>ink((u-.95)*.99,(v-.04)*.73),path,.047,c.vanilla);
    lettering(g,"BILLIARDS",.058,c.vanilla,(u,v)=>ink(u,v-.31));
    for(const side of [-1,1])for(const [i,len] of [.53,.69,.40].entries()){
      stroke(g,ink,[side*1.34,.20-i*.128],[side*(1.34+len),.20-i*.128],.026,c.orange);
    }
    // The faded felt pennant beside the house card picks up the waterfront mural's colors.
    const f=east(110.573,27.71,2.18),stripe=east(110.580,27.71,2.18);
    g.tri(f(-1.04,.54),f(1.42,-.03),f(-1.04,-.50),c.oxblood);
    g.tri(stripe(-.96,.46),stripe(1.17,-.03),stripe(-.96,-.43),c.rose);
    const brand=east(110.588,27.71,2.18);
    ellipse(g,brand,-.49,.025,.256,.256,c.deep,18);
    ellipse(g,east(110.592,27.71,2.18),-.49,.025,.134,.134,c.enamel,15);
    polyline(g,(u,v)=>[110.597,2.10+v*.144,27.17+u*.127],digitPath[8],.105,c.deep);
    for(let i=0;i<2;i++)stroke(g,brand,[-.05,.09-i*.13],[.48-i*.12,.09-i*.13],.025,c.ivory);
  }
  function interiorWalls(g){
    g.box(107.53,1.843,30,6.05,3.40,34.9,c.ivory);
    g.box(110.581,.661,35.5,.057,1.037,22,c.jade);
    g.box(110.625,1.216,35.5,.103,.089,22.0,c.wood);
    const panel=east(110.613,35.5,.674);
    for(let z=24.9;z<46.51;z+=.52)patch(g,panel,z-35.5,0,.027,.864,c.teal);
    for(const z of [south+.17,north-.17]){
      g.box(119.98,.629,z,18.68,.974,.071,c.jade);
      g.box(119.98,1.156,z,18.68,.071,.112,c.wood);
    }
    for(const [a,b] of [[south+.22,doorZ-1.17],[doorZ+1.17,north-.22]]){
      const z=(a+b)/2;g.box(front-.152,.594,z,.051,.83,b-a,c.mint);g.box(front-.178,1.045,z,.112,.074,b-a,c.wood);
    }
    g.box(116.04,.409,44.11,4.78,.44,.74,c.walnut);
    g.box(116.04,.569,44.04,4.84,.10,.70,c.rose);
    g.box(116.04,.96,44.45,4.85,.61,.12,c.redLight);
    const rail=southFace(44.383,116.04,.944);
    for(let x=113.87;x<118.45;x+=.29)patch(g,rail,x-116.04,0,.015,.45,c.rose);
    scoreBoard(g);cueRack(g);housePaint(g);
  }
  function diningLights(g,glow){
    const palette=glow?c.lamp:c.enamel;
    for(const [x,z] of [[125.94,16.17],[125.94,22.37],[125.94,37.93],[125.94,44.08],[115.07,22.1],[119.52,22.1]]){
      if(!glow){
        g.pole([x,3.566,z],[x,2.925,z],.018,c.metal,6);
        g.cyl(x,2.875,z,.135,.397,.255,12,c.shade);g.cyl(x,2.753,z,.404,.395,.035,12,c.brass);
      }
      g.cyl(x,2.728,z,.344,.285,.042,12,palette);
    }
    if(glow)g.box(boardX+.22,3.090,33,.109,.016,2.309,c.lamp);
    if(!glow){
      for(const x of [112.28,119.65])g.box(x,2.12,north-.216,.98,.71,.08,c.walnut);
      const print=(x,col,sky)=>{
        const f=southFace(north-.277,x,2.12);patch(g,f,0,0,.90,.63,c.enamel);patch(g,f,0,.01,.75,.47,sky);
        ellipse(g,f,-.22,.107,.063,.063,c.orange);patch(g,f,0,-.1,.75,.08,col);
        stroke(g,f,[-.28,-.112],[.04,.07],.042,c.ivory);stroke(g,f,[.04,.07],[.30,-.087],.031,c.ivory);
      };
      print(112.28,c.jade,"#97b6ab");print(119.65,c.deep,"#c29b89");
    }
  }
  function poolLamp(g,glow){
    const {x,z}=table;
    for(const off of [-.54,.54]){
      if(!glow)g.pole([x,3.57,z+off],[x,2.817,z+off],.019,c.brass,6);
    }
    if(!glow)g.pole([x,2.812,z-.69],[x,2.812,z+.69],.044,c.brass,8);
    for(const off of [-.57,0,.57]){
      if(!glow){g.cyl(x,2.696,z+off,.085,.287,.223,12,c.shade);g.cyl(x,2.585,z+off,.290,.284,.026,12,c.brass);}
      g.cyl(x,2.567,z+off,.259,.233,.023,12,glow?c.lamp:c.enamel);
    }
  }
  function nearInterior(g){
    nearFloor(g);interiorWalls(g);galley(g);counters(g);
    boothZ.forEach((z,i)=>booth(g,z,i));diningLights(g,false);
  }
  function streetInterior(g,medium=false){
    surface(g,117,30,24.93,34.9,level,c.floor);
    g.box(107.53,1.842,30,6.05,3.40,34.9,c.ivory);
    g.box(116.77,.645,22.12,11.8,.96,1.07,c.teal);g.box(116.77,1.13,22.12,11.93,.10,1.17,c.vanilla);
    for(const z of boothZ){
      g.box(boothX+.17,.841,z,1.88,.108,1.105,c.vanilla);
      for(const side of [-1,1]){
        g.box(boothX,.83,z+side*1.27,2.18,.96,.30,c.rose);
        if(medium){
          g.box(boothX,.55,z+side,2.17,.21,.72,c.rose);
          g.box(boothX,1.32,z+side*1.27,2.19,.04,.30,c.ivory);
        }
      }
      if(medium){
        g.box(boothX,.46,z,.19,.58,.36,c.metal);
        g.box(boothX+.85,1.015,z,.165,.235,.20,c.chrome);
      }
    }
    if(medium){
      g.box(110.579,.72,35.5,.06,1.14,22,c.jade);
      surface(g,116.07,35.31,10.66,18.32,level+.001,c.sage);
      g.box(boardX-.01,2.06,33,.10,2.12,4.64,c.walnut);
      patch(g,east(boardX+.049,33,2.06),0,0,4.46,1.98,c.slate);
      g.box(116.62,.73,14.22,10.86,1.16,1.67,c.steel);g.box(117.45,2.58,14.09,3.49,.31,1.81,c.chrome);
      g.box(123.20,1.21,14.0,1.68,2.12,2.16,c.mint);g.box(121.93,1.33,22.08,.84,.31,.60,c.deep);
      for(const x of stoolX){
        g.box(x,.46,23.92,.18,.59,.18,c.chrome);g.cyl(x,.75,23.92,.29,.26,.105,8,c.rose);
      }
      for(const z of boothZ)g.cyl(125.94,2.86,z,.14,.40,.26,8,c.shade);
    }
  }
  function install(model){
    model("palm-room",nearInterior);model("palm-room-street",g=>streetInterior(g,true));
    model("palm-room-far",streetInterior);model("palm-roof",roof);
    model("palm-slider",doorLeaf);model("palm-shades",g=>poolLamp(g,false));
    model("palm-coffee-lights",g=>diningLights(g,true));model("palm-table-lights",g=>poolLamp(g,true));
    for(let n=0;n<10;n++)model("palm-score-"+n,g=>polyline(g,(u,v)=>[0,v*.221,(u-.31)*.214],digitPath[n],.094,c.chalk));
  }
  function placedDigits(list,value,y,z){
    const digits=String(clamp(Number.isFinite(value)?Math.floor(value):0,0,9999));
    for(let i=0;i<digits.length;i++)list.push(["palm-score-"+digits[i],boardX+.047,y-.105,z+(i-(digits.length-1)/2)*.176]);
  }
  function world(list,see,t,hours,state={}){
    if(!see(site.center,650))return;
    if(!state.cutaway)list.push(["palm-roof",0,0,0]);
    if(!see(site.center,239))return;
    const near=see(site.center,34),mid=see(site.center,84);
    list.push([near?"palm-room":mid?"palm-room-street":"palm-room-far",0,0,0]);
    if(!near)return;
    const amount=clamp(state.door??1,0,1);
    for(const side of [-1,1])list.push(["palm-slider",front+.018,0,doorZ+side*(.55+1.109*amount)]);
    if(!state.cutaway)list.push(["palm-shades",0,0,0]);
    const night=hours?.night||0;
    if(night>.07){
      list.push(["palm-coffee-lights",0,0,0,0,0,0,.27+.65*night]);
      if(!state.cutaway)list.push(["palm-table-lights",0,0,0,0,0,0,.27+.65*night]);
    }
    if(see(site.board,33)){
      for(const [,id,y] of rows){
        const score=state.score?.[id];placedDigits(list,score?.wins,y,33.89);placedDigits(list,score?.losses,y,34.66);
      }
    }
  }
  const tiles=[];
  function plan(g,cut){
    const rect=(x,z,w,d,col)=>{g.fillStyle=col;g.fillRect(x-w/2,z-d/2,w,d);};
    const dot=(x,z,r,col)=>{g.fillStyle=col;g.beginPath();g.arc(x,z,r,0,tau);g.fill();};
    if(!cut){
      rect(117.49,29.44,25.32,35.34,"#8a8c7e");rect(117,30,25.49,35.50,c.lightMint);
      rect(117,30,24.77,34.77,"#a3a597");rect(113.75,39.45,14,11.92,c.mint);rect(113.75,39.45,13.54,11.45,"#91a195");
      for(const z of [30.2,20.9,14.1])rect(117,z,24.67,.043,"#8e978a");
      for(const x of [108.35,113.24]){rect(x,18.2,2.13,1.48,c.metal);for(let n=-3;n<=3;n++)rect(x+n*.224,18.23,.081,1.09,c.chrome);}
      rect(127.64,26.23,1.09,9.56,c.teal);rect(128.0,26.23,.17,8.87,c.ivory);
      return;
    }
    rect(117,30,25.1,35.1,c.deep);rect(117,30,24.77,34.77,c.floor);
    billiardFloor(rect);
    for(let i=0;i<210;i++){
      const x=110.7+18.44*((i*173+51)%997)/997,z=12.76+34.43*((i*619+64)%1009)/1009;
      rect(x,z,.055,.036,x<121.46&&z>26.09&&z<44.54?"#94aa90":"#bba790");
    }
    for(let i=0;i<11;i++)for(let j=0;j<7;j++)rect(110.99+i*1.1,13.04+j*1.12,1.09,1.11,((i+j)%2)?"#a39983":"#d2c5ab");
    rect(107.55,30,6.05,34.76,c.jade);rect(107.50,30,5.67,34.38,"#8c9d8e");
    rect(116.77,22.12,12.02,1.28,c.metal);rect(116.77,22.17,11.86,1.05,c.vanilla);
    rect(121.93,22.08,.84,.60,c.deep);rect(121.94,22.17,.64,.36,c.steel);
    for(const x of stoolX){dot(x+.075,23.86,.318,c.metal);dot(x,23.92,.294,c.rose);dot(x-.031,23.96,.243,c.redLight);}
    rect(116.62,14.22,10.94,1.73,c.chrome);rect(117.43,14.31,2.98,1.20,c.dark);
    for(const x of [116.86,118.14]){dot(x,14.49,.235,c.oxblood);dot(x,14.49,.20,c.orange);}
    for(const x of [112.90,113.40])dot(x,14.40,.143,c.dark);
    rect(123.20,14.0,1.68,2.16,c.mint);rect(111.11,17.74,.99,4.8,c.vanilla);
    rect(111.06,18.92,.66,.89,c.deep);
    for(let i=0;i<4;i++){
      const z=boothZ[i];
      for(const side of [-1,1]){
        rect(boothX+.07,z+side*1.03,2.22,.82,c.oxblood);rect(boothX,z+side*.997,2.17,.74,c.rose);
        for(let n=-3;n<=3;n++)rect(boothX+n*.26,z+side, .019,.57,c.tomato);
        rect(boothX,z+side*1.36,2.2,.149,c.ivory);rect(boothX,z+side*1.33,2.11,.070,c.redLight);
      }
      rect(boothX+.18,z,1.92,1.14,c.metal);rect(boothX+.16,z,1.84,1.065,c.vanilla);
      rect(boothX+.1,z+.274,.66,.43,c.lightMint);dot(boothX+.13,z+.274,.18,c.enamel);
      if(i!==3){rect(boothX,z-.273,.60,.42,"#d4b69a");dot(boothX+.02,z-.273,.17,c.enamel);}
      dot(boothX-.47,z+(i%2?-.35:.33),.075,c.enamel);dot(boothX-.47,z+(i%2?-.35:.33),.054,c.walnut);
      rect(boothX+.85,z,.153,.191,c.chrome);
    }
    rect(116.04,44.11,4.88,.88,c.walnut);rect(116.04,44.04,4.84,.68,c.rose);rect(116.04,44.45,4.85,.13,c.redLight);
    rect(110.72,33,.21,4.63,c.walnut);rect(110.81,33,.09,4.23,c.slate);
    rect(110.76,38.65,.37,2.98,c.wood);
    for(let n=0;n<6;n++)dot(110.84,37.55+n*.427,.043,c.enamel);
    for(const [a,b] of [[south,doorZ-1.1],[doorZ+1.1,north]]){rect(front,(a+b)/2,.25,b-a,c.teal);rect(front-.05,(a+b)/2,.064,b-a,c.ivory);}
    rect(128.28,doorZ,1.68,2.10,c.mat);for(let n=-4;n<=4;n++)rect(128.28,doorZ+n*.194,1.54,.019,"#969b82");
  }
  const planBounds={x:104.13,z:12.13,w:26.18,d:35.79};
  function planTile(cut){
    const i=Number(cut);if(tiles[i]!==undefined)return tiles[i];
    const cv=typeof document!=="undefined"?document.createElement("canvas"):null;
    if(!cv?.getContext){tiles[i]=null;return null;}
    const {x,z,w,d}=planBounds,px=16;
    cv.width=Math.ceil(w*px);cv.height=Math.ceil(d*px);const g=cv.getContext("2d");
    if(!g){tiles[i]=null;return null;}
    g.setTransform(cv.width/w,0,0,cv.height/d,-x*cv.width/w,-z*cv.height/d);
    plan(g,cut);tiles[i]=cv;return cv;
  }
  function badge(g,atlas,ui){
    g.scale(ui,ui);g.fillStyle=c.deep;g.strokeStyle=c.vanilla;g.lineWidth=1.0;g.beginPath();g.arc(0,0,6.25,0,tau);g.fill();g.stroke();
    g.fillStyle=c.ivory;g.beginPath();g.arc(0,0,3.60,0,tau);g.fill();g.fillStyle=c.deep;g.font="bold 7px system-ui";g.textAlign="center";g.textBaseline="middle";g.fillText("8",0,.28);
    if(atlas){g.textAlign="left";g.font="bold 8px system-ui";g.fillStyle=c.vanilla;g.strokeStyle=c.deep;g.lineWidth=2.4;
      g.strokeText(site.name,8.2,-2);g.fillText(site.name,8.2,-2);}
  }
  function map(ctx,opt,px,py,s,visible,t=0){
    const street=opt.mode==="street",atlas=opt.mode==="atlas";
    if(atlas&&(opt.countyChart||opt.marina?.bayChart)||!visible(px(117),py(30),24*s+12))return;
    const state=opt.palmDiner||{},p=opt.player||state.player,cut=street&&!!(state.cutaway||p&&p.x>=104.26&&p.x<=134.22&&p.z>=12.32&&p.z<=47.66);
    ctx.save();ctx.translate(px(0),py(0));ctx.scale(s,-s);
    const img=street?planTile(cut):null,{x,z,w,d}=planBounds;
    if(img)ctx.drawImage(img,x,z,w,d);else plan(ctx,cut);
    if(street&&cut){
      const n=clamp(state.door??1,0,1);ctx.fillStyle=c.chrome;
      for(const side of [-1,1])ctx.fillRect(front-.027,doorZ+side*(.55+1.109*n)-.54,.1,1.08);
    }
    ctx.restore();
    if(!street){ctx.save();ctx.translate(px(site.door.x),py(site.door.z));badge(ctx,atlas,atlas?1.08:clamp(s*.66,.80,1.12));ctx.restore();}
  }
  window.BayPalmDiner={site,blocks,cameraBlocks,contains,floor,stepDoor,doorClear,streetShell,roof,install,world,map};
})();
