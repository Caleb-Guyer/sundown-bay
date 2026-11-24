/* A working skiff yard on Gantry and the county's public launching lane on Sol Beach. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,west=-pi/2,east=pi/2;
  const P=(x,z,yaw=0,y=.154)=>({x,z,yaw,y});
  const dock={kind:"landing",id:"buttonwood",name:"Buttonwood Public Slip",x:223,z:52.2,
    footX:207,walkW:1.85,headW:4.3,headD:2.5,level:.47};
  dock.skiff=P(223,49.65,east,.12);
  dock.skiffFoot=P(223,51.38,pi,dock.level);
  const trailer=P(119.25,-84.5,east),counter=P(119,-89.65,pi);
  const site={id:"buttonwood",kind:"boatyard",name:"Buttonwood Boat Works",x:counter.x,z:counter.z,
    center:P(120,-91.6),counter,benji:P(119,-91.9),truck:P(126.1,-84.5,east),trailer,parking:{...trailer},
    benchWalk:[P(120.90,-91.91,east),P(120.93,-89.54),P(122.61,-86.58,.20)],
    alda:P(217.3,52.23,pi,dock.level),approach:P(188,48.5,west,.1885),wet:P(217.6,48.5,west,-.52),
    slip:P(199,44),dock,skiffFoot:dock.skiffFoot,skiff:dock.skiff,
    marker:{...counter,kind:"boatyard",name:"Buttonwood Boat Works"},
    slipMarker:{...P(173,35.5),kind:"public-slip",name:dock.name}};
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
  const bounds=(x,z,w,d,top,bottom=0)=>({x,z,w,d,bottom,top,streetProp:true});
  const blocks=[
    bounds(119.95,-97.01,18.05,.20,3.92),bounds(111.02,-94.17,.20,5.69,3.34),bounds(128.88,-94.17,.20,5.69,3.34),
    bounds(113.29,-91.43,4.69,.17,3.29),bounds(125.99,-91.43,5.89,.17,3.29),
    bounds(115.68,-91.42,.17,.19,3.46),bounds(123.0,-91.42,.17,.19,3.46),
    bounds(119,-90.87,2.33,.55,1.035),bounds(116.77,-93.88,1.04,2.70,1.40),
    bounds(122.25,-96.11,3.04,.88,1.23),bounds(126.35,-94.88,2.08,1.29,1.78),
    bounds(111.57,-88.26,1.00,3.15,1.50),bounds(129.64,-90.58,.25,.25,5.54),
    bounds(152.2,40.64,.14,.16,2.39),bounds(153.87,40.64,.14,.16,2.39),
    bounds(173.76,40.52,.20,.20,2.49),bounds(199.25,44.04,.13,.13,1.42),
    bounds(212.16,44.36,.16,.17,1.32),bounds(217.65,44.41,.16,.17,1.07),
    bounds(209.65,53.12,.18,.19,1.44),bounds(214.96,53.12,.18,.19,1.47),
    bounds(222.11,53.44,.18,.19,1.47),bounds(224.88,53.43,.18,.19,1.47)
  ];
  const cameraBlocks=[bounds(119.96,-94.22,18.60,6.28,4.78,3.33),
    bounds(119.28,-90.24,8.05,2.52,3.51,3.0),
    bounds(129.64,-90.55,.28,2.43,5.32,3.05),
    bounds(153.04,40.64,2.21,.15,2.42,1.15)];
  const yardOutline=[[105.50,-88.62],[106.35,-96.70],[110.06,-97.50],[129.65,-97.38],[132.45,-95.05],
    [132.62,-89.24],[137.24,-87.00],[137.24,-81.92],[132.20,-80.54],[110.04,-79.28],[106.52,-79.45],[104.60,-82.83]];
  const slipOutline=[[150.90,32.66],[159.22,32.40],[169.12,32.41],[179.18,31.80],[198.40,31.62],
    [203.63,32.66],[207.35,35.95],[209.07,40.37],[209.06,44.58],[206.78,47.86],[202.40,50.65],[196.71,50.50],
    [189.11,50.40],[183.06,50.34],[175.15,48.04],[169.72,43.59],[164.69,39.63],[159.38,38.72],[150.90,38.49]];
  function inside(shape,x,z){
    let hit=false;
    for(let i=0,j=shape.length-1;i<shape.length;j=i++){
      const [a,b]=shape[i],[c,d]=shape[j];
      if((b>z)!==(d>z)&&x<(c-a)*(z-b)/(d-b)+a)hit=!hit;
    }
    return hit;
  }
  function deck(x,z,r=0){
    return Math.abs(x-dock.x)<=dock.headW/2-r&&Math.abs(z-dock.z)<=dock.headD/2-r
      ||x>=dock.footX+r&&x<=dock.x&&Math.abs(z-dock.z)<=dock.walkW/2-r;
  }
  function onRamp(x,z,r=0){
    return x>=180+r&&x<=222.65-r&&z>=44.65+r&&z<=(x<207?52.35:51.25)-r;
  }
  const grade=[[180,.182],[196,.195],[204,.34],[209,.295],[212,.202],[213.78,.076],[214.38,-.025],[217.6,-.52],[222.65,-1.18]];
  function level(x){
    for(let i=1;i<grade.length;i++)if(x<=grade[i][0]){
      const [a,b]=grade[i-1],[c,d]=grade[i];return mix(b,d,clamp((x-a)/(c-a),0,1));
    }
    return grade.at(-1)[1];
  }
  function surface(x,z){
    if(x>=104&&x<=138&&z>=-98&&z<=-79&&inside(yardOutline,x,z))return .154;
    if(x<150.9||x>225.2||z<31.5||z>54)return null;
    if(deck(x,z))return dock.level;
    if(x>204.2&&x<207.16&&Math.abs(z-dock.z)<dock.walkW/2)return mix(.29,dock.level,clamp((x-204.2)/2.80,0,1));
    if(onRamp(x,z))return level(x);
    if(x<209.2&&inside(slipOutline,x,z))return x<179?.182:Math.max(.182,level(x));
    return null;
  }
  const floor=(x,z)=>surface(x,z)??0;
  const ink={
    white:"#ede1c7",bone:"#d4c7a8",edge:"#92968a",chalk:"#d2c5a3",paint:"#cfac77",
    outer:"#6f756d",pave:"#a39c88",slab:"#b5ae97",mud:"#8e9485",wet:"#778f80",tide:"#617f73",
    post:"#786d57",wood:"#a68b64",grain:"#756955",lightWood:"#c8ac7d",honey:"#c09560",cedar:"#926644",
    dark:"#314249",coal:"#41494a",teal:"#467375",green:"#61918a",aqua:"#8daea1",plank:"#aeb8a2",
    oxide:"#ab5a47",red:"#be654b",brass:"#bd9a66",metal:"#9da99e",slate:"#657a78",zinc:"#8eaaa3"
  };
  const id=s=>"buttonwood-yard-"+s;
  function polygon(g,pts,col){for(let i=1;i<pts.length-1;i++)g.tri(pts[0],pts[i],pts[i+1],col);}
  function plate(g,f,cx,cy,w,h,col,d=0){
    g.quad(f(cx-w/2,cy-h/2,d),f(cx+w/2,cy-h/2,d),f(cx+w/2,cy+h/2,d),f(cx-w/2,cy+h/2,d),col);
  }
  function stroke(g,f,pts,w,col,d=0){
    for(let i=1;i<pts.length;i++){
      const [x,y]=pts[i-1],[a,b]=pts[i],dx=a-x,dy=b-y,len=Math.hypot(dx,dy);if(len<.00001)continue;
      const u=-dy*w/(2*len),v=dx*w/(2*len);
      g.quad(f(x+u,y+v,d),f(a+u,b+v,d),f(a-u,b-v,d),f(x-u,y-v,d),col);
    }
  }
  function panel(x,y,z,yaw){
    const cs=Math.cos(yaw),sn=Math.sin(yaw);
    return (u,h,d=0)=>[x-u*cs+d*sn,y+h,z+u*sn+d*cs];
  }
  function tube(g,pts,r,col,n=5){for(let i=1;i<pts.length;i++)g.pole(pts[i-1],pts[i],r,col,n);}
  function round(g,f,x,y,rx,ry,col,d=0,n=14){
    polygon(g,Array.from({length:n},(_,i)=>f(x+rx*Math.cos(i*tau/n),y+ry*Math.sin(i*tau/n),d)),col);
  }
  // Hand-painted boat-registration capitals. The same strokes fit the small county signs.
  const letterforms={
    A:"00 14 24 40|12 32",B:"00 04 34 43 32 02|32 41 30 00",C:"43 34 14 03 01 10 30 41",
    D:"00 04 24 43 41 20 00",E:"44 04 00 40|02 32",F:"44 04 00|02 32",
    G:"43 34 14 03 01 10 30 41 42 22",H:"00 04|02 42|44 40",I:"04 44|24 20|00 40",
    J:"04 44 41 30 10 01",K:"00 04|01 44|12 40",L:"04 00 40",M:"00 04 22 44 40",
    N:"00 04 40 44",O:"01 03 14 34 43 41 30 10 01",P:"00 04 34 43 32 02",
    R:"00 04 34 43 32 02|22 40",S:"43 34 14 03 12 32 41 30 10 01",
    T:"04 44|24 20",U:"04 01 10 30 41 44",V:"04 20 44",W:"04 10 22 30 44",Y:"04 22 44|22 20",
    0:"01 03 14 34 43 41 30 10 01",1:"13 24 20|10 30",2:"03 14 34 43 42 01 00 40",6:"34 14 03 01 10 30 41 32 12 01"
  };
  const glyphs=Object.fromEntries(Object.entries(letterforms).map(([k,s])=>[k,s.split("|").map(r=>r.split(" ").map(p=>[+p[0]*.25,+p[1]*.25]))]));
  function lettering(g,f,word,x,y,h,col,d=0,w=.60,spacing=.26,weight=.106){
    const step=h*(w+spacing),start=x-(step*word.length-h*spacing)/2;
    for(let i=0;i<word.length;i++)for(const path of glyphs[word[i]]||[])
      stroke(g,f,path.map(([u,v])=>[start+i*step+h*u*w,y+v*h]),h*weight,col,d);
  }
  function arrow(draw,x,z,heading,size,col){
    const sn=Math.sin(heading),cs=Math.cos(heading);
    const pts=[[-.12,-.78],[.12,-.78],[.12,.10],[.44,.10],[0,.78],[-.44,.10],[-.12,.10]];
    draw.poly(pts.map(([u,v])=>[x+(u*cs+v*sn)*size,z+(-u*sn+v*cs)*size]),col);
  }
  function corners(draw,x,z,w,d){
    for(const a of [-1,1])for(const b of [-1,1]){
      const xx=x+a*w/2,zz=z+b*d/2;
      draw.line([[xx-a*.78,zz],[xx,zz],[xx,zz-b*.52]],.085,ink.chalk);
    }
  }
  function yardSlab(draw,detail){
    draw.poly(yardOutline,ink.pave);
    draw.poly([[105.05,-83.10],[106.65,-79.8],[119.32,-80.07],[128.04,-80.9],[132.24,-81.1],[135.66,-82.08],
      [135.75,-86.69],[130.03,-89.2],[108.8,-89.35]],"#9e9d8b");
    draw.poly([[110.56,-97.14],[129.32,-97.14],[129.41,-90.4],[110.5,-90.49]],"#b3ad96");
    corners(draw,119.93,-84.50,8.08,3.55);corners(draw,126.12,-84.5,4.42,3.55);
    if(!detail)return;
    for(const [x,z,a,b] of [[113.8,-81.7,6.3,.21],[115.4,-87.7,4.82,.13],[125.15,-85.4,5.23,.17],[128.47,-83.48,3.05,.16]]){
      draw.line([[x,z],[x+a*.45,z+.07],[x+a,z+b]],.082,"#959888");
      draw.line([[x-.14,z-.11],[x+a*.39,z-.034],[x+a*.93,z+b-.10]],.034,"#8b9283");
    }
    for(const path of [[[108.2,-80.13],[109.0,-80.62],[109.14,-80.90],[110.2,-81.12]],
      [[129.6,-89.45],[128.81,-89.06],[128.71,-88.70],[127.85,-88.59]],[[113.51,-90.18],[114.16,-90.49],[116.07,-90.52]]])
      draw.line(path,.035,ink.outer);
    draw.line([[131.1,-87.44],[131.58,-87.95],[132.42,-87.98],[132.66,-87.70]],.07,ink.chalk);
    draw.line([[109.86,-94.93],[109.86,-92.97]],.10,ink.chalk);
  }
  function slipSlab(draw,detail){
    draw.poly(slipOutline,ink.pave);
    draw.poly([[151,33.12],[173.6,33.28],[190.7,32.64],[199.0,32.50],[203.7,34.02],[206.5,37.32],[207.76,40.67],[207.52,44.04],
      [205.88,45.91],[202.70,44.35],[201.97,40.83],[201.48,38.93],[198.85,38.25],[179.2,38.9],[162.03,38.08],[151,37.91]],"#a8a18d");
    draw.poly([[166.1,38.03],[173.3,37.97],[178.77,41.13],[190.01,43.09],[191.27,44.2],[185.03,45.34],[176.19,43.56]],"#939482");
    draw.poly([[169.67,38.98],[174.39,39.1],[178.51,41.68],[185.21,43.34],[184.44,43.7],[177.01,42.72]],"#aba289");
    for(const [x,z,h,r] of [[160.50,35.45,east,1.10],[183.5,35.48,east,1.34],[203.7,39.65,.36,1.08],
      [200.3,48.3,west,1.12],[189.6,48.52,west,1.12],[174.23,43.59,-2.18,1.00]])arrow(draw,x,z,h,r,ink.chalk);
    if(!detail)return;
    for(const side of [-1,1]){
      const zz=35.5+side*2.15;
      for(const xx of [168.85,174.1,179.38])draw.line([[xx,zz],[xx+2.5,zz-.025]],.079,ink.chalk);
    }
    const curve=[];for(let j=0;j<=13;j++){
      const a=-pi/2+j*pi/13;curve.push([198.15+8.83*Math.cos(a),42.01+8.83*Math.sin(a)]);
    }
    draw.line(curve,.105,ink.chalk);
    for(const offset of [0,.21])draw.line(curve.slice(3,12).map(([x,z])=>[198.15+(x-198.15)*(.74+offset*.11),42.01+(z-42.01)*(.74+offset*.11)]),.068,"#969384");
    for(const path of [[[158.16,32.82],[158.96,33.35],[159.04,33.68],[159.62,33.87]],
      [[181.38,49.72],[182.21,48.99],[182.64,49.01],[183.12,48.69]],[[199.33,32.59],[199.03,33.01],[199.12,33.57]]])
      draw.line(path,.040,ink.outer);
  }
  function rampSlab(draw,detail){
    const sections=[[180,44.65,50.15],[185,44.65,51.0],[196,44.65,51.43],[204,44.65,51.38],[209,44.65,51.25],
      [212,44.65,51.25],[213.78,44.65,51.25],[214.38,44.65,51.25],[217.6,44.65,51.25],[222.65,44.65,51.25]];
    for(let i=1;i<sections.length;i++){
      const [a,lo,hi]=sections[i-1],[b,l,h]=sections[i];
      draw.poly([[a,lo],[b,l],[b,h],[a,hi]],i<5?ink.slab:i<7?ink.mud:i<9?ink.wet:ink.tide);
    }
    for(const z of [46.30,50.36]){
      for(const [a,b] of [[182.55,188.5],[189.23,195.2],[196.2,202.22],[203.12,207.40],[208.24,212.0],[212.6,214.18]])
        draw.line([[a,z],[b,z-.02]],.115,ink.white);
      draw.line([[216.98,z],[218.32,z]],.14,ink.paint);
    }
    for(const x of [204.14,210.03,215.7])arrow(draw,x,48.5,east,1.09,ink.paint);
    if(!detail)return;
    for(let x=199.2;x<222.4;x+=.53){
      draw.line([[x,44.99],[x+.03,46.2]],.051,x>214?"#708c7a":"#9b9e8b");
      draw.line([[x+.04,46.46],[x+.05,50.11]],.045,x>214?"#789282":"#9c9f8e");
      draw.line([[x+.06,50.53],[x+.064,51.05]],.045,x>214?"#789282":"#9c9f8e");
    }
    for(const z of [47.46,47.71,49.36,49.58])draw.line([[203.3,z+.08],[210,z],[213.74,z-.10]],.069,"#999b89");
    for(const x of [181.89,188.72,195.75,202.72,209.48,213.82])draw.line([[x,44.94],[x+.02,50.94]],.048,"#839083");
    for(const [x,z] of [[185.37,45.06],[190.61,45.06],[197.87,45.02],[208.61,45.05]]){
      draw.rect(x,z,.64,.33,"#7d8277");
      for(const offset of [-.18,0,.18])draw.line([[x+offset-.032,z-.109],[x+offset+.032,z+.11]],.039,"#a4a594");
    }
  }
  // Clip the broad apron at every change of gradient so its corners meet the ramp.
  function clipX(points,bound,less){
    const a=[];
    for(let i=0,j=points.length-1;i<points.length;j=i++){
      const p=points[j],q=points[i],left=less?p[0]<=bound:p[0]>=bound,right=less?q[0]<=bound:q[0]>=bound;
      if(left!==right){const u=(bound-p[0])/(q[0]-p[0]);a.push([bound,mix(p[1],q[1],u)]);}
      if(right)a.push(q);
    }
    return a;
  }
  function groundInk(g,height,split,start){
    let layer=start;
    const heightAt=(p,d)=>[p[0],height(p[0])+d,p[1]];
    const poly=(ps,col)=>{
      const d=layer;layer+=.00009;
      if(!split){polygon(g,ps.map(p=>heightAt(p,d)),col);return;}
      const lo=Math.min(...ps.map(p=>p[0])),hi=Math.max(...ps.map(p=>p[0]));
      let left=lo-1;
      for(const right of [...grade.map(p=>p[0]).filter(x=>x>lo&&x<hi),hi+1]){
        const pts=clipX(clipX(ps,left,false),right,true);
        if(pts.length>2)polygon(g,pts.map(p=>heightAt(p,d)),col);left=right;
      }
    };
    const line=(ps,w,col)=>{
      for(let i=1;i<ps.length;i++){
        const [x,z]=ps[i-1],[a,b]=ps[i],len=Math.hypot(a-x,b-z);if(!len)continue;
        const u=-(b-z)*w/(2*len),v=(a-x)*w/(2*len);
        poly([[x+u,z+v],[a+u,b+v],[a-u,b-v],[x-u,z-v]],col);
      }
    };
    return {poly,line,rect(x,z,w,d,col){poly([[x-w/2,z-d/2],[x+w/2,z-d/2],[x+w/2,z+d/2],[x-w/2,z+d/2]],col);}};
  }
  function yardShell(g){
    const front=panel(119.95,0,-91.325,0),side=panel(128.989,0,-94.24,east);
    g.box(119.95,1.76,-97.01,18.05,3.2,.20,ink.slate);
    g.box(111.02,1.76,-94.17,.20,3.2,5.69,ink.teal);
    g.box(128.88,1.76,-94.17,.20,3.2,5.69,ink.plank);
    for(const [x,w] of [[113.29,4.69],[125.99,5.89]])g.box(x,1.75,-91.43,w,3.20,.17,ink.plank);
    for(const [x,w] of [[113.29,4.67],[125.99,5.87]])g.box(x,.39,-91.31,w,.43,.094,ink.teal);
    for(const x of [115.68,123.00])g.box(x,1.82,-91.42,.16,3.32,.19,ink.lightWood);
    for(const x of [110.99,115.63,119.92,123.05,128.91])g.box(x,1.83,-96.84,.17,3.34,.19,ink.grain);
    for(const [u,v,w,h] of [[6.61,1.78,3.18,1.45],[-6.16,1.72,4.15,2.61]]){
      plate(g,front,u,v,w+.17,h+.16,ink.teal,.008);plate(g,front,u,v,w,h,ink.green,.020);
    }
    plate(g,front,6.61,1.89,2.99,1.05,ink.dark,.033);
    for(const side of [-1,1]){
      plate(g,front,6.61+side*.76,1.91,1.303,.87,side===1?"#688a87":"#839d95",.040);
      stroke(g,front,[[6.61+side*.75-.48,1.63],[6.61+side*.75+.38,2.17]],.078,"#9eafa1",.047);
    }
    plate(g,front,6.61,2.52,3.39,.14,ink.bone,.031);
    for(const x of [114.86,124.99]){
      const l=x-4.64,r=x+4.64,z0=-97.41,z1=-90.99,lo=3.43,hi=4.86;
      g.quad([l,lo,z0],[l,lo,z1],[x,hi,z1],[x,hi,z0],ink.zinc);
      g.quad([x,hi,z0],[x,hi,z1],[r,lo,z1],[r,lo,z0],"#799693");
      for(const z of [z0,z1])g.tri([l,lo,z],[r,lo,z],[x,hi,z],z===z0?ink.teal:ink.plank);
      for(const [a,b] of [[l,x],[x,r]]){
        const ya=a===x?hi:lo,yb=b===x?hi:lo;
        g.quad([a,ya+.026,z1+.006],[b,yb+.026,z1+.006],[b,yb-.135,z1+.006],[a,ya-.135,z1+.006],ink.bone);
      }
      g.box(x,hi+.023,(z0+z1)*.5,.168,.067,z1-z0+.10,ink.lightWood);
    }
    g.box(119.92,3.41,-94.20,.88,.073,6.42,ink.slate);
    g.box(119.93,3.37,-91.15,18.31,.17,.20,ink.green);
    g.quad([115.25,3.49,-91.39],[123.66,3.49,-91.39],[123.66,3.04,-88.98],[115.25,3.04,-88.98],ink.aqua);
    g.box(119.45,2.99,-88.97,8.44,.13,.15,ink.oxide);
    const name=panel(119.66,3.28,-90.90,0);
    const transom=[[-3.7,.18],[-3.50,-.12],[-2.98,-.20],[3.02,-.2],[3.45,-.08],[3.67,.17],[3.86,1.01],
      [3.55,1.21],[2.48,1.24],[.03,1.12],[-2.41,1.25],[-3.53,1.22],[-3.86,1.0]];
    polygon(g,transom.map(p=>name(...p,.025)),ink.wood);
    polygon(g,transom.map(([u,v])=>name(u*.984,.04+v*.93,.045)),ink.teal);
    stroke(g,name,[[-3.61,.24],[-3.38,.03],[-2.94,-.04],[2.97,-.04],[3.31,.025],[3.57,.20]],.075,ink.red,.058);
    stroke(g,name,[[-3.55,1.065],[-2.38,1.11],[-.01,1.00],[2.46,1.11],[3.5,1.08]],.055,ink.bone,.060);
    lettering(g,name,"BUTTONWOOD",0,.415,.49,ink.white,.071,.72,.27,.115);
    lettering(g,name,"BOAT WORKS",0,.064,.224,ink.chalk,.073,.64,.40,.120);
    plate(g,side,0,2.21,4.21,1.39,ink.bone,.006);plate(g,side,0,2.22,4.08,1.23,ink.green,.014);
    lettering(g,side,"BOAT WORKS",0,2.09,.35,ink.white,.020,.67);
    g.box(129.64,2.82,-90.58,.21,5.33,.23,ink.post);
    g.box(129.64,4.33,-90.48,.17,.12,2.15,ink.metal);
    for(const angle of [east,west]){
      const blade=panel(129.64+Math.sin(angle)*.12,3.26,-90.56,angle);
      const shape=[[-1.04,.14],[-.91,1.32],[-.72,1.62],[-.23,1.80],[.49,1.66],[.98,1.29],[1.09,.18],[.73,-.06],[-.72,-.06]];
      polygon(g,shape.map(p=>blade(...p)),ink.oxide);
      stroke(g,blade,[[-.88,.18],[-.72,1.22],[-.48,1.48],[-.18,1.57],[.37,1.47],[.74,1.22],[.90,.22]],.060,ink.bone,.011);
      lettering(g,blade,"PIP",0,.62,.46,ink.white,.020,.66);
      lettering(g,blade,"16",0,.18,.28,ink.white,.020,.66);
    }
    g.box(119.0,.98,-90.87,2.33,.11,.55,ink.lightWood);
    for(const x of [118.02,119.98])for(const z of [-91.04,-90.70])g.box(x,.57,z,.092,.78,.09,ink.teal);
    g.box(119.0,.86,-90.63,2.15,.15,.07,ink.green);
  }
  function ribJig(g){
    const x=111.57,z=-88.26;
    for(const dz of [-.92,.92]){
      g.box(x,.69,z+dz,1.06,.12,.17,ink.wood);
      for(const side of [-1,1])g.pole([x+side*.48,.17,z+dz+.07],[x+side*.25,.68,z+dz],.048,ink.grain,4);
    }
    g.box(x,.86,z,.14,.14,3.35,ink.cedar);
    const sideRails=[[],[]];
    for(let i=0;i<8;i++){
      const v=-1.40+i*.40,r=.47*Math.sqrt(Math.max(.10,1-(v/1.66)**2));
      const rib=[[-r,1.45+r*.31],[-r*.88,1.16],[-r*.39,.985],[0,.938],[r*.39,.985],[r*.88,1.16],[r,1.45+r*.31]];
      tube(g,rib.map(([u,y])=>[x+u,y,z+v]),.025,i%3===1?ink.honey:ink.lightWood,4);
      sideRails[0].push([x-r,1.46+r*.31,z+v]);sideRails[1].push([x+r,1.46+r*.31,z+v]);
    }
    for(const rail of sideRails)tube(g,rail,.023,ink.cedar,4);
    tube(g,[[x,.91,z-1.48],[x,1.33,z-1.67],[x,1.74,z-1.75]],.050,ink.honey,5);
    g.box(x,1.32,z+1.42,.57,.46,.069,ink.oxide);
  }
  function yardJoinery(g){
    const front=panel(119.95,0,-91.325,0),back=panel(119.95,0,-96.892,0),worktop=(u,v,d=0)=>[119+u,1.039+d,-90.87+v];
    for(const [lo,hi] of [[4.53,8.88],[-8.85,-3.15]])for(let v=.64;v<=3.28;v+=.237){
      for(const [a,b] of [[lo,lo+(hi-lo)*.47],[lo+(hi-lo)*.47+.021,hi]]){
        if(v>.99&&v<2.59&&lo>0||v>.36&&v<3.05&&hi<0)continue;
        stroke(g,front,[[a,v],[b,v+.012]],.026,ink.slate,.011);
      }
    }
    for(let i=0;i<13;i++){
      const y=.50+i*.19;
      plate(g,front,-6.16,y,4.10,.022,"#536f69",.038);
    }
    const shutter=panel(126.11,0,-91.275,0);
    stroke(g,shutter,[[-1.41,1.27],[-.76,1.02],[.81,1.02],[1.26,1.36],[1.07,1.28],[-1.41,1.27]],.056,ink.bone,.012);
    stroke(g,shutter,[[-.60,1.30],[-.30,1.51],[.28,1.51],[.61,1.31]],.045,ink.bone,.014);
    lettering(g,shutter,"REPAIRS",0,1.79,.26,ink.white,.014,.66);
    for(const xx of [114.86,124.99])for(let i=-5;i<=5;i++){
      const x=xx+i*.81,y=4.86-Math.abs(i*.81)*1.43/4.64+.010;
      g.quad([x-.03,y,-97.35],[x+.03,y+.014,-97.35],[x+.03,y+.014,-91.08],[x-.03,y,-91.08],i===-3||i===4?"#afb6a1":"#98aaa0");
    }
    for(let x=115.45;x<123.6;x+=.53)
      g.quad([x,3.50,-91.36],[x+.08,3.50,-91.36],[x+.08,3.052,-89.02],[x,3.052,-89.02],"#9ab5a5");
    for(const x of [115.43,119.37,123.49])g.pole([x,2.14,-91.27],[x,2.99,-89.19],.039,ink.slate,5);
    for(const x of [117.81,122.62]){
      g.box(x,3.21,-92.21,.77,.09,.28,ink.slate);
      g.box(x,3.145,-92.21,.67,.057,.22,"#e9c99a");
    }
    for(const x of [115.97,117.62])g.box(x,.61,-93.82,.08,.85,.08,ink.post);
    g.box(116.77,.97,-93.88,1.05,.11,2.70,ink.honey);
    g.box(116.77,.64,-93.88,.81,.085,2.47,ink.wood);
    g.box(116.64,1.072,-93.85,.31,.072,2.05,ink.lightWood,.088);
    g.box(116.96,1.18,-93.08,.156,.24,.33,ink.red);
    g.pole([116.96,1.15,-92.85],[116.96,1.15,-93.14],.045,ink.metal,6);
    g.pole([116.82,1.05,-92.82],[117.09,1.28,-92.82],.020,ink.coal,5);
    g.box(122.25,1.12,-96.11,3.04,.12,.88,ink.wood);
    for(const x of [120.95,123.55])g.box(x,.64,-96.11,.14,.82,.57,ink.grain);
    plate(g,back,-.04,2.18,3.85,1.42,ink.wood,.012);
    for(let i=0;i<7;i++){
      const u=-1.52+i*.48,y=2.59-(i%3)*.105;
      stroke(g,back,[[u,y],[u-.045,y-.37]],.049,ink.metal,.033);
      stroke(g,back,[[u-.045,y-.37],[u-.091,y-.57]],.085,i%2?ink.oxide:ink.honey,.036);
    }
    for(const [x,z,w,r] of [[122.97,-95.94,.26,ink.oxide],[121.54,-95.91,.33,ink.teal],[122.04,-95.99,.21,ink.slate]]){
      g.cyl(x,1.32,z,w*.56,w*.53,.30,9,r);g.cyl(x,1.474,z,w*.57,w*.57,.025,9,ink.metal);
    }
    const notice=panel(115.06,1.2,-91.224,0);
    plate(g,notice,0,.04,.56,.73,ink.oxide,.0);
    plate(g,notice,0,.045,.459,.615,ink.white,.010);
    for(const [w,y] of [[.28,.263],[.34,.19],[.25,.036],[.30,-.018],[.22,-.079]])plate(g,notice,0,y,w,.026,ink.slate,.022);
    plate(g,worktop,.37,0,.43,.35,ink.grain,.008);plate(g,worktop,.365,.014,.38,.311,ink.white,.012);
    for(const v of [-.028,.035,.095])stroke(g,worktop,[[.237,v],[.43,v+.003]],.009,ink.teal,.015);
    g.cyl(118.35,1.128,-90.94,.065,.051,.177,10,ink.bone);
    g.cyl(118.35,1.219,-90.94,.049,.049,.014,10,ink.dark);
    for(const x of [125.71,126.65]){
      g.box(x,.45,-94.88,.87,.58,.91,ink.cedar);
      for(const z of [-95.25,-94.52])g.box(x,.46,z,.87,.075,.073,ink.grain);
    }
    const prop=panel(113.27,1.40,-91.266,0);
    for(let i=0;i<3;i++){
      const a=i*tau/3+.35,blade=[[-.066,.025],[-.065,.213],[.03,.46],[.15,.432],[.211,.29],[.205,.115],[.067,.012]];
      polygon(g,blade.map(([u,v])=>prop(u*Math.cos(a)-v*Math.sin(a),u*Math.sin(a)+v*Math.cos(a),.085)),ink.brass);
    }
    round(g,prop,0,0,.082,.082,ink.bone,.090,10);
    ribJig(g);
  }
  function anchor(g,f,u,v,h,col,d){
    const q=(x,y,k=0)=>f(u+x*h,v+y*h,d+k);
    round(g,q,0,.76,.103,.103,col,0,12);round(g,q,0,.76,.047,.047,ink.teal,.002,10);
    stroke(g,q,[[0,.69],[0,.04]],.095,col,.002);
    stroke(g,q,[[-.245,.48],[.245,.48]],.078,col,.002);
    stroke(g,q,[[-.38,.31],[-.32,.13],[-.14,.035],[0,0],[.15,.035],[.32,.14],[.38,.31]],.082,col,.003);
    for(const a of [-1,1])polygon(g,[[a*.435,.39],[a*.398,.19],[a*.269,.257]].map(p=>q(...p,.005)),col);
  }
  function slipSigns(g){
    for(const x of [152.2,153.87])g.box(x,1.22,40.64,.15,2.20,.16,ink.post);
    g.box(153.035,1.73,40.64,2.22,1.28,.136,ink.bone);
    for(const a of [0,pi]){
      const f=panel(153.035,1.1,40.64+(a<1?.081:-.081),a);
      plate(g,f,0,.625,2.11,1.185,ink.teal,.004);
      stroke(g,f,[[-.967,.137],[-.967,1.122],[.973,1.122],[.973,.137],[-.967,.137]],.031,ink.bone,.009);
      lettering(g,f,"PALM COUNTY",0,.908,.122,ink.white,.020,.63,.30,.12);
      lettering(g,f,"PUBLIC",.22,.62,.19,ink.white,.020,.66);
      lettering(g,f,"SLIP",.22,.307,.22,ink.white,.020,.66);
      anchor(g,f,-.653,.319,.55,ink.white,.023);
      for(const u of [-.963,.966])for(const v of [.14,1.12])round(g,f,u,v,.026,.026,ink.metal,.019,6);
    }
    g.box(173.76,1.27,40.52,.14,2.27,.16,ink.slate);
    g.box(173.76,1.91,40.52,.095,.81,1.65,ink.white);
    for(const faceDir of [west,east]){
      const f=panel(173.76+Math.sin(faceDir)*.057,1.54,40.52,faceDir);
      plate(g,f,0,.37,1.55,.70,ink.teal,.003);
      const pts=[[-.61,.42],[-.26,.42],[-.26,.52],[.10,.355],[-.26,.19],[-.26,.289],[-.61,.289]];
      polygon(g,pts.map(p=>f(...p,.013)),ink.chalk);
      lettering(g,f,"RIG",.37,.414,.18,ink.white,.016,.58);
      lettering(g,f,"TURN",.34,.170,.15,ink.white,.016,.60);
    }
    const base=level(199.25);
    g.cyl(199.25,.87,44.04,.057,.066,1.18,8,ink.slate);
    const roundMark=panel(199.25,1.15,44.04,pi);
    round(g,roundMark,0,0,.236,.236,ink.bone,0,12);
    round(g,roundMark,0,0,.198,.198,ink.green,.008,12);
    stroke(g,roundMark,[[-.10,-.02],[.10,-.02],[.01,.08]],.036,ink.white,.014);
    g.cyl(199.25,base+.027,44.04,.15,.20,.067,8,ink.mud);
    for(const [x,z,h] of [[212.16,44.36,1.32],[217.65,44.41,1.07]]){
      const bottom=Math.min(-.24,level(x)-.14);
      g.box(x,(h+bottom)*.5,z,.15,h-bottom,.15,ink.post);
      g.box(x,h-.10,z,.159,.155,.16,ink.red);
      g.box(x,h-.23,z,.161,.074,.162,ink.white);
      g.box(x,h-.025,z,.172,.036,.172,ink.metal);
      const f=panel(x,.20,z+.082,0);
      plate(g,f,0,.25,.121,.86,ink.bone,.004);
      for(let i=-2;i<6;i++)plate(g,f,-.015+(i%2)*.007,i*.105,.069-(i%2)*.018,.023,ink.dark,.010);
    }
  }
  function slipDock(g){
    const lo=dock.z-dock.walkW/2,hi=dock.z+dock.walkW/2,top=dock.level;
    const plank=(x0,x1,z0,z1,y0,y1,c)=>{
      g.quad([x0,y0,z0],[x1,y1,z0],[x1,y1,z1],[x0,y0,z1],c);
    };
    plank(204.18,207.0,lo,hi,.29,top,ink.wood);
    g.box(213.99,.368,52.2,14.21,.189,dock.walkW,ink.wood);
    g.box(dock.x,.361,dock.z,dock.headW,.209,dock.headD,ink.wood);
    for(const z of [lo+.21,hi-.21])g.box(214.03,.23,z,14.02,.20,.16,ink.post);
    for(const x of [207.52,209.65,212.23,214.96,217.65,220.27,222.11,224.88]){
      const wide=x>221,low=wide?dock.z-dock.headD/2:lo+.07,high=wide?dock.z+dock.headD/2-.02:hi;
      const railpost=[209.65,214.96,222.11,224.88].includes(x);
      for(const [z,h] of [[low,.44],[high,railpost?1.47:.495]]){
        g.cyl(x,(h-1.12)/2,z,.086,.105,h+1.12,8,ink.post);
        if(h>1)g.cyl(x,h+.030,z,.065,.104,.06,8,ink.bone);
      }
      if(x>211&&x<221.1)g.pole([x-.71,-.52,lo+.10],[x+.06,.30,hi-.10],.057,ink.grain,5);
    }
    g.box(223.0,.314,50.943,4.17,.14,.072,ink.coal);
    g.box(219.23,.324,51.264,3.22,.11,.073,ink.coal);
    g.box(225.16,.323,52.19,.065,.126,2.33,ink.coal);
    for(const [x,w] of [[210.1,5.58],[215.68,5.55],[220.63,4.32]])g.box(x,.521,53.01,w,.11,.093,ink.post);
    for(const [a,b] of [[209.65,214.96],[214.96,222.11],[222.11,224.88]]){
      const aa=a<220?53.12:53.44,bb=b<220?53.12:53.44;
      tube(g,[[a,1.23,aa],[(a+b)*.5,1.016,(aa+bb)*.5],[b,1.23,bb]],.020,ink.bone,5);
    }
    const colors=["#b6a387","#c3ac88","#baab8f","#af9f83","#bea888","#b2a28a"];
    for(let i=0;i<62;i++){
      const x=204.20+i*.337;if(x>=225.15)break;
      const t0=clamp((x-204.20)/2.80,0,1),t1=clamp((x+.319-204.20)/2.8,0,1);
      const y0=mix(.29,top,t0)+.003,y1=mix(.29,top,t1)+.003;
      const isHead=x>220.65;
      const left=isHead?dock.z-dock.headD/2:lo,right=isHead?dock.z+dock.headD/2:hi;
      plank(x,Math.min(x+.317,225.14),left+.006,right-.006,y0,y1,colors[(i*7+(i>>2))%colors.length]);
    }
    for(const x of [214.50,221.95,224.03]){
      const z=x>221?51.13:51.49;
      g.box(x,top+.045,z,.42,.07,.14,ink.coal);
      g.box(x,top+.119,z,.53,.061,.093,ink.metal);
    }
    // The boarding edge stays open. The tideboard and ladder face the outer tip.
    const x=225.18,z=52.22;
    for(const u of [-.246,.246])tube(g,[[x-.24,.48,z+u],[x-.17,.71,z+u],[x+.01,.76,z+u],[x+.15,.58,z+u],[x+.15,-.89,z+u]],.030,ink.metal,7);
    for(let i=0;i<6;i++)g.pole([x+.16,.52-i*.236,z-.245],[x+.16,.52-i*.236,z+.245],.027,i<3?ink.metal:ink.tide,6);
  }
  function scuffs(g){
    for(const [a,b,z] of [[207.21,208.25,51.43],[210.34,211.60,52.75],[215.63,216.40,51.62],
      [218.93,219.55,51.64],[222.13,223.34,51.26],[223.69,224.74,52.91]]){
      const f=(u,v,d=0)=>[u,.482+d,v];
      stroke(g,f,[[a,z],[a+.30*(b-a),z+.038],[b,z-.015]],.027,ink.grain);
    }
    const f=panel(224.89,0,53.33,pi);
    plate(g,f,0,.948,.335,.465,ink.green,.019);
    lettering(g,f,"2",0,.79,.257,ink.white,.023,.70);
    // A secured coil of mooring line lies on the back plank, clear of the step.
    for(let j=0;j<3;j++){
      const pts=[];for(let i=0;i<=12;i++){
        const a=i*tau/12,r=.26+j*.04;
        pts.push([223.88+r*Math.cos(a),.50+j*.011,52.95+.64*r*Math.sin(a)]);
      }tube(g,pts,.019,ink.honey,4);
    }
    tube(g,[[224.17,.50,52.98],[224.48,.51,52.90],[224.59,.51,52.59],[224.48,.50,52.46]],.020,ink.honey,4);
  }
  function pennant(g){
    const shape=[[[0,0,0],[.38,-.075,.042],[.38,-.346,.042],[0,-.411,0]],
      [[.38,-.075,.042],[.88,-.147,-.084],[.88,-.29,-.084],[.38,-.346,.042]]];
    g.quad(...shape[0],ink.bone);g.quad(...shape[1],ink.oxide);
    g.tri([.88,-.147,-.084],[1.28,-.205,-.029],[.88,-.29,-.084],ink.bone);
  }
  function yardSilhouette(g){
    yardSlab(groundInk(g,()=>.154,false,.008),false);
    g.box(119.96,1.81,-94.20,18.03,3.27,5.62,ink.plank);
    for(const x of [114.86,124.99]){
      const l=x-4.68,r=x+4.68,a=-97.41,b=-90.99,lo=3.43,hi=4.86;
      g.quad([l,lo,a],[l,lo,b],[x,hi,b],[x,hi,a],ink.zinc);
      g.quad([x,hi,a],[x,hi,b],[r,lo,b],[r,lo,a],ink.slate);
      g.tri([l,lo,b],[r,lo,b],[x,hi,b],ink.bone);
    }
    g.box(119.4,1.65,-91.365,7.27,2.96,.17,ink.dark);
    g.box(119.45,3.22,-90.24,8.44,.13,2.38,ink.green);
    g.box(119.67,3.90,-90.90,7.47,1.14,.15,ink.teal);
    g.box(129.64,2.82,-90.58,.21,5.33,.23,ink.post);
    g.box(129.64,4.14,-90.58,.28,1.64,1.97,ink.oxide);
  }
  function slipSilhouette(g){
    slipSlab(groundInk(g,x=>Math.max(.182,level(x)),true,.002),false);
    const d=groundInk(g,level,true,.009);
    d.poly([[183,44.65],[222.65,44.65],[222.65,51.21],[183,51.02]],ink.slab);
    g.box(214.98,.366,52.20,16.07,.20,1.85,ink.wood);
    g.box(223,.357,52.20,4.30,.21,2.50,ink.wood);
    for(const x of [209.65,214.96,222.11,224.88])g.box(x,.44,x<220?53.12:53.44,.17,2.04,.17,ink.post);
    for(const x of [152.2,153.87])g.box(x,1.22,40.64,.15,2.20,.16,ink.post);
    g.box(153.03,1.73,40.64,2.22,1.28,.14,ink.teal);
  }
  window.BayButtonwoodYard={site,blocks,cameraBlocks,onRamp,deck,surface,floor,install,world,map};
  function install(model){
    model(id("yard-horizon"),yardSilhouette);model(id("slip-horizon"),slipSilhouette);
    model(id("yard"),g=>{yardSlab(groundInk(g,()=>.154,false,.002),true);yardShell(g);});
    model(id("joinery"),yardJoinery);
    model(id("slip"),g=>{
      slipSlab(groundInk(g,x=>x<180?.182:Math.max(.182,level(x)),true,.001),true);
      rampSlab(groundInk(g,level,true,.015),true);
      slipSigns(g);slipDock(g);
    });
    model(id("pier-detail"),scuffs);model(id("pennant"),pennant);
  }
  function world(list,see,t=0,state,view){
    if(see(site.center,169)){
      list.push([id(see(site.center,85)?"yard":"yard-horizon"),0,0,0]);if(see(site.center,56))list.push([id("joinery"),0,0,0]);
      if(see(site.center,82))list.push([id("pennant"),129.64,5.45,-90.58,2.44+.15*Math.sin(t*.78)+.042*Math.sin(t*2.69),.040*Math.sin(t*2.31)]);
    }
    if(see(site.slip,145)){
      list.push([id(see(site.slip,72)?"slip":"slip-horizon"),0,0,0]);
      if(see(dock,51))list.push([id("pier-detail"),0,0,0]);
    }
  }
  function topInk(ctx){
    const poly=(ps,col)=>{ctx.fillStyle=col;ctx.beginPath();ps.forEach(([x,z],i)=>i?ctx.lineTo(x,z):ctx.moveTo(x,z));ctx.closePath();ctx.fill();};
    const line=(ps,w,col)=>{ctx.strokeStyle=col;ctx.lineWidth=w;ctx.beginPath();ps.forEach(([x,z],i)=>i?ctx.lineTo(x,z):ctx.moveTo(x,z));ctx.stroke();};
    const rect=(x,z,w,d,c)=>{ctx.fillStyle=c;ctx.fillRect(x-w/2,z-d/2,w,d);};
    const dot=(x,z,rx,rz,c)=>{ctx.fillStyle=c;ctx.beginPath();ctx.ellipse(x,z,rx,rz,0,0,tau);ctx.fill();};
    return {poly,line,rect,dot};
  }
  function stencil(ctx,text,x,z,h,col){
    ctx.save();ctx.translate(x,z);ctx.scale(1,-1);ctx.fillStyle=col;ctx.textAlign="center";ctx.textBaseline="middle";
    ctx.font="700 10px sans-serif";ctx.scale(h/10,h/10);ctx.fillText(text,0,0);ctx.restore();
  }
  function yardPlan(ctx,p,fine,cut){
    yardSlab(p,fine);
    p.rect(119.97,-94.19,18.06,5.75,ink.teal);
    if(!cut){
      for(const cx of [114.86,124.99]){
        p.rect(cx-2.32,-94.20,4.64,6.42,ink.zinc);p.rect(cx+2.32,-94.20,4.64,6.42,"#758b86");
        if(fine)for(let x=cx-4.10;x<cx+4.64;x+=.82)p.line([[x,-97.32],[x,-91.12]],.066,"#a1b0a0");
        p.line([[cx,-97.45],[cx,-90.95]],.152,ink.bone);
      }
    }else{
      p.rect(119.94,-94.20,17.73,5.35,"#9d9e8b");
      for(const x of [112.74,115.76,118.83,121.81,124.82,127.76])p.line([[x,-96.84],[x,-91.59]],.032,"#8e9487");
      p.line([[111.21,-94.70],[128.70,-94.70]],.032,"#93988b");
      p.rect(119.95,-96.88,17.96,.17,ink.grain);
      for(const x of [111.20,128.65])p.rect(x,-94.21,.19,5.50,ink.wood);
      p.rect(119.90,-96.66,3.57,.26,ink.wood);
      for(let i=0;i<7;i++)p.line([[118.50+i*.45,-96.66],[118.53+i*.45,-96.48]],.063,i%2?ink.coal:ink.oxide);
      for(const x of [111.23,115.62,119.94,123.08,128.61])p.rect(x,-96.69,.19,.36,ink.grain);
      for(const [x,w] of [[113.29,4.69],[125.99,5.89]])p.rect(x,-91.43,w,.18,ink.green);
      p.rect(116.77,-93.88,1.05,2.70,ink.wood);p.rect(116.70,-93.84,.25,2.03,ink.lightWood);
      p.rect(116.98,-93.12,.16,.32,ink.oxide);
      p.rect(122.25,-96.11,3.04,.88,ink.honey);
      for(const [x,r,c] of [[121.54,.14,ink.green],[122.04,.12,ink.slate],[122.97,.16,ink.red]])p.dot(x,-95.96,r,r,c);
      for(const x of [125.71,126.65]){
        p.rect(x,-94.88,.91,.91,ink.wood);p.line([[x-.36,-95.16],[x+.36,-94.60]],.085,ink.cedar);
      }
    }
    if(cut){
      for(const x of [115.44,119.38,123.50])p.line([[x,-91.27],[x,-89.1]],.065,ink.slate);
      p.rect(119.43,-89.06,8.39,.31,ink.aqua);
    }else p.rect(119.43,-90.26,8.39,2.43,ink.aqua);
    if(fine&&!cut)for(let x=115.5;x<123.55;x+=.53)p.line([[x,-91.34],[x,-89.09]],.065,"#a7bba6");
    p.rect(119.45,-88.98,8.41,.14,ink.red);
    p.rect(119,-90.87,2.33,.55,ink.lightWood);p.rect(119.36,-90.85,.40,.33,ink.white);
    p.dot(118.34,-90.93,.075,.075,ink.dark);
    p.rect(129.64,-90.58,.25,2.04,ink.oxide);
    p.rect(111.57,-88.26,.13,3.39,ink.cedar);
    const first=[],second=[];
    for(let i=0;i<8;i++){
      const v=-1.4+i*.40,r=.47*Math.sqrt(Math.max(.1,1-(v/1.66)**2));
      first.push([111.57-r,-88.26+v]);second.push([111.57+r,-88.26+v]);
      p.line([[111.57-r,-88.26+v],[111.57+r,-88.26+v]],.053,ink.lightWood);
    }
    p.line(first,.047,ink.wood);p.line(second,.047,ink.wood);
    if(fine){
      const labelZ=cut?-89.11:-90.84;
      p.rect(119.50,labelZ,6.87,.51,ink.teal);stencil(ctx,"BUTTONWOOD",119.50,labelZ,.45,ink.white);
      stencil(ctx,"01",115.12,-83.89,.43,ink.chalk);
    }
  }
  function slipPlan(ctx,p,fine){
    slipSlab(p,fine);
    // Let the bay and its wave marks show through the submerged concrete.
    const opacity=x=>x<213.78?1:clamp(.85-(x-213.78)*.113,.08,.85);
    const dab=(ps,fn,...args)=>{ctx.globalAlpha=opacity(ps.reduce((n,q)=>n+q[0],0)/ps.length);fn(ps,...args);};
    rampSlab({poly:(ps,c)=>dab(ps,p.poly,c),line:(ps,w,c)=>dab(ps,p.line,w,c),
      rect(x,z,w,d,c){ctx.globalAlpha=opacity(x);p.rect(x,z,w,d,c);}},fine);
    ctx.globalAlpha=1;
    p.rect(215.02,52.20,16.06,1.85,ink.wood);
    p.rect(205.58,52.20,2.85,1.85,ink.wood);
    p.rect(223.0,52.2,4.30,2.5,ink.wood);
    p.rect(223.0,50.964,4.16,.105,ink.coal);p.rect(218.78,51.29,4.10,.075,ink.coal);
    if(fine){
      for(let i=0;i<62;i++){
        const x=204.26+i*.337;if(x>225.10)break;
        const d=x>220.8?2.37:1.72,c=["#bba788","#c3ac88","#b1a18b","#af9f83","#bea888","#b2a28a"][i%6];
        p.rect(x,52.20,.277,d,c);
      }
      p.line([[209.64,53.12],[214.96,53.12],[222.11,53.44],[224.88,53.43]],.046,ink.bone);
      for(const [x,z] of [[214.5,51.49],[221.95,51.13],[224.03,51.13]])p.rect(x,z,.51,.091,ink.metal);
      for(let i=0;i<3;i++){p.line([[224.94,51.97+i*.246],[225.35,51.97+i*.246]],.047,ink.metal);}
      p.dot(223.87,52.95,.32,.202,ink.honey);p.dot(223.87,52.95,.22,.116,ink.grain);
    }
    for(const [x,z] of [[209.65,53.12],[214.96,53.12],[222.11,53.44],[224.88,53.44]])
      p.dot(x,z,.13,.13,ink.bone);
    for(const [x,z] of [[212.16,44.36],[217.65,44.41]]){
      p.rect(x,z,.18,.18,ink.oxide);p.rect(x,z,.11,.11,ink.white);
    }
    p.rect(153.04,40.64,2.22,.28,ink.teal);p.rect(173.76,40.52,.27,1.65,ink.teal);
    if(fine){
      stencil(ctx,"RAMP",201.05,46.77,.46,ink.chalk);
      stencil(ctx,"TURN",194.85,35.50,.50,ink.chalk);
    }
  }
  const layers={
    yard:{x0:103.8,z1:-78.7,w:34.40,d:19.22,images:new Map(),paint:yardPlan},
    slip:{x0:150.25,z1:54.10,w:75.72,d:23.12,images:new Map(),paint:slipPlan}
  };
  function drawPlan(ctx,layer,px,py,s,fine,cut=false){
    const pxm=fine?s>16?24:13:4,key=pxm+(cut?100:0);
    let cache=layer.images.get(key);
    if(!cache&&typeof document!=="undefined"){
      const sheet=document.createElement("canvas");sheet.width=Math.ceil(layer.w*pxm);sheet.height=Math.ceil(layer.d*pxm);
      const c=sheet.getContext?.("2d");
      if(c){
        c.setTransform(pxm,0,0,-pxm,-layer.x0*pxm,layer.z1*pxm);c.lineJoin="bevel";c.lineCap="butt";
        layer.paint(c,topInk(c),fine,cut);layer.images.set(key,sheet);cache=sheet;
      }
    }
    if(cache){
      ctx.drawImage(cache,px(layer.x0),py(layer.z1),cache.width*s/pxm,cache.height*s/pxm);return;
    }
    ctx.save();ctx.translate(px(0),py(0));ctx.scale(s,-s);ctx.lineJoin="bevel";ctx.lineCap="butt";
    layer.paint(ctx,topInk(ctx),fine,cut);ctx.restore();
  }
  function map(ctx,px,py,s,visible,t=0,state,opt={}){
    const fine=s>=5&&(!opt.mode||opt.mode==="street");
    if(visible(px(site.center.x),py(site.center.z),20*s)){
      const x=opt.player?.x??opt.cx??120,z=opt.player?.z??opt.cz??-90;
      drawPlan(ctx,layers.yard,px,py,s,fine,fine&&z< -88.14&&Math.hypot(x-119,z+91.90)<9.79);
    }
    if(visible(px(188),py(42.7),39*s))drawPlan(ctx,layers.slip,px,py,s,fine);
  }
})();
