/* Driver-eye trim. All hard points use the same metre-scale shell and axes as the opening doors. */
(() => {
  "use strict";
  const tau=2*Math.PI, mix=(a,b,t)=>a+(b-a)*t, clamp=(v,low,high)=>Math.max(low,Math.min(high,v));
  const styles={
    ...window.BayDealerCars?.cockpitStyles,...window.BaySolenaArt?.cockpitStyles,...window.BayBoulevardCars?.cockpitStyles,...window.BayCaletaArt?.cockpitStyles,...window.BayEngineSevenArt?.cockpitStyles,
    coupe:{trim:"#353f40",top:"#314345",pad:"#424946",cloth:"#866752",thread:"#bb9a78",edge:"#b1bbb1",face:"#243236",ink:"#f0dfb4",accent:"#d27650",rim:"#78533e",hub:"#343d3b",dash:"pair",spokes:3,stamp:"MARLIN GT",limit:100},
    hatch:{trim:"#505855",top:"#434e4e",pad:"#636863",cloth:"#927c64",thread:"#d0bd92",edge:"#abb29c",face:"#e5debd",ink:"#344440",accent:"#bd5e42",rim:"#414442",hub:"#69706a",dash:"single",spokes:2,stamp:"RIVA",limit:90},
    cab:{trim:"#8b7359",top:"#605b4e",pad:"#a18867",cloth:"#a38462",thread:"#ddbb85",edge:"#d5c5a2",face:"#313b38",ink:"#f5ddb0",accent:"#e6a755",rim:"#6a5543",hub:"#826c51",dash:"ribbon",spokes:2,stamp:"BAY CAB",limit:100},
    van:{trim:"#687776",top:"#465957",pad:"#75837a",cloth:"#63716c",thread:"#b1bbb0",edge:"#bcc0ac",face:"#273b3d",ink:"#e4ddba",accent:"#d4a266",rim:"#384945",hub:"#556661",dash:"box",spokes:4,stamp:"PELICAN",limit:80},
    cruiser:{trim:"#505b64",top:"#333f48",pad:"#4c555c",cloth:"#535c62",thread:"#83918a",edge:"#96a7aa",face:"#273037",ink:"#e7e5d8",accent:"#d67961",rim:"#343a3a",hub:"#454d50",dash:"three",spokes:4,stamp:"FLEET",limit:120},
    ambulance:{trim:"#636e66",top:"#495652",pad:"#707b70",cloth:"#568480",thread:"#abc3aa",edge:"#c7baa3",face:"#e4ddbd",ink:"#273c3c",accent:"#d66042",rim:"#54615a",hub:"#465953",dash:"work",spokes:3,stamp:"RESCUE 4",limit:90},
    wrecker:{trim:"#386561",top:"#4d6961",pad:"#528278",cloth:"#8d7156",thread:"#c1a681",edge:"#d4c9ad",face:"#e8dfbc",ink:"#344541",accent:"#b75f3e",rim:"#b9aa84",hub:"#476963",dash:"work",spokes:3,stamp:"PORTSIDE",limit:80}
  };
  const glyph={
    "0":["01110","10001","10011","10101","11001","10001","01110"],"1":["00100","01100","00100","00100","00100","00100","01110"],
    "2":["01110","10001","00001","00010","00100","01000","11111"],"3":["11110","00001","00001","01110","00001","00001","11110"],
    "4":["00010","00110","01010","10010","11111","00010","00010"],"5":["11111","10000","10000","11110","00001","00001","11110"],
    "6":["00110","01000","10000","11110","10001","10001","01110"],"7":["11111","00001","00010","00010","00100","00100","00100"],
    "8":["01110","10001","10001","01110","10001","10001","01110"],"9":["01110","10001","10001","01111","00001","00010","11100"],
    A:["01110","10001","10001","11111","10001","10001","10001"],B:["11110","10001","10001","11110","10001","10001","11110"],
    C:["01111","10000","10000","10000","10000","10000","01111"],D:["11110","10001","10001","10001","10001","10001","11110"],
    E:["11111","10000","10000","11110","10000","10000","11111"],F:["11111","10000","10000","11110","10000","10000","10000"],
    G:["01111","10000","10000","10111","10001","10001","01110"],H:["10001","10001","10001","11111","10001","10001","10001"],
    I:["01110","00100","00100","00100","00100","00100","01110"],K:["10001","10010","10100","11000","10100","10010","10001"],
    L:["10000","10000","10000","10000","10000","10000","11111"],M:["10001","11011","10101","10101","10001","10001","10001"],
    N:["10001","11001","11001","10101","10011","10011","10001"],O:["01110","10001","10001","10001","10001","10001","01110"],
    P:["11110","10001","10001","11110","10000","10000","10000"],R:["11110","10001","10001","11110","10100","10010","10001"],
    S:["01111","10000","10000","01110","00001","00001","11110"],T:["11111","00100","00100","00100","00100","00100","00100"],
    V:["10001","10001","10001","10001","10001","01010","00100"],W:["10001","10001","10001","10101","10101","11011","10001"],Y:["10001","10001","01010","00100","00100","00100","00100"]
  };
  const layoutCache=new Map(),cabinCache=new WeakMap();
  function layout(v){
    const kind=styles[v.kind]?v.kind:"coupe";
    if(layoutCache.has(kind))return layoutCache.get(kind);
    const s=bayCarLayout(kind),style=styles[kind],[rear,roofRear,roofFront,front,sill,roof,base,cap]=s.glass;
    const high=kind==="van"||kind==="wrecker"||kind==="ambulance"||kind==="pumper",ey={x:-s.seatX,y:Math.min(roof-.165,s.seatY+(high?.795:.716)),z:s.seatZ+(high?.07:.102)};
    const wheel={x:ey.x,y:ey.y-(high?.262:.24),z:ey.z+(high?.44:.405),r:high?.175:kind==="hatch"?.147:.159,tilt:high?.62:.43};
    const dashZ=Math.min(front-.097,ey.z+(high?.67:.595)),clusterY=ey.y-(high?.257:.226);
    // Meet the raked glass from the inside. The van and hatch share almost no glass geometry.
    const rake=(front-roofFront)/(roof-sill),lookUp=high?.385:.345;
    const mirrorDepth=(front-ey.z-(ey.y+.033-sill)*rake-.062)/(1+lookUp*rake);
    const mirrorZ=ey.z+mirrorDepth,mirrorY=ey.y+lookUp*mirrorDepth;
    const mw=clamp(mirrorDepth*.47,.135,.249),mh=mw*.284,mx=ey.x+mirrorDepth*.67;
    const mirrorAt=(a,b)=>({x:mx+a*mw,y:mirrorY+b*mh,z:mirrorZ+a*.042+b*.009});
    const out={kind,s,style,rear,roofRear,roofFront,front,sill,roof,base,cap,ey,wheel,dashZ,clusterY,high,mirrorAt,
      mirror:[mirrorAt(-.5,.5),mirrorAt(.5,.5),mirrorAt(.5,-.5),mirrorAt(-.5,-.5)]};
    layoutCache.set(kind,out);return out;
  }
  const eye=v=>layout(v).ey,mirror=v=>layout(v).mirror;
  function glass(v,u,h){
    const a=layout(v);
    return {x:(u*2-1)*mix(a.base,a.cap,h),y:mix(a.sill,a.roof,h),z:mix(a.front,a.roofFront,h)};
  }
  function project(view,v,ground,p){
    const b=view.basis;if(!b)return null;
    const pitch=v.pitch||0,roll=v.lean||0,c=Math.cos(pitch),s=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
    const py=p.y*c-p.z*s,pz=p.y*s+p.z*c,px=p.x*cr-py*sr,cy=Math.cos(v.yaw),sy=Math.sin(v.yaw);
    const x=v.x+px*cy+pz*sy-b.camera.x,y=ground+p.x*sr+py*cr-b.camera.y,z=v.z-px*sy+pz*cy-b.camera.z;
    const ahead=x*b.sn+z*b.cs,rx=x*b.cs-z*b.sn,uy=y*b.cp-ahead*b.sp,depth=ahead*b.cp+y*b.sp;
    const focal=innerHeight*b.f*.5,den=Math.abs(depth)<.000001?.000001:depth;
    return {x:innerWidth*.5+focal*rx/den,y:innerHeight*.5-focal*uy/den,depth,rx,uy,focal};
  }
  const xyz=p=>[p.x,p.y,p.z];
  function tint(a,b,t){
    const x=parseInt(a.slice(1),16),y=parseInt(b.slice(1),16);
    const ch=s=>Math.round(mix((x>>s)&255,(y>>s)&255,t));
    return "#"+((ch(16)<<16)|(ch(8)<<8)|ch(0)).toString(16).padStart(6,"0");
  }
  function flat(g,z,l,b,r,t,ink){g.quad([l,b,z],[r,b,z],[r,t,z],[l,t,z],ink);}
  function strip(g,z,x,y,a,b,w,ink){
    const d=w*.5/(Math.hypot(a-x,b-y)||1),dx=-(b-y)*d,dy=(a-x)*d;
    g.quad([x+dx,y+dy,z],[a+dx,b+dy,z],[a-dx,b-dy,z],[x-dx,y-dy,z],ink);
  }
  function plaque(g,z,text,x,y,h,color){
    const k=h/7,sx=k*.83,start=x-((text.length*6-1)*sx)*.5;
    for(let i=0;i<text.length;i++){
      const rows=glyph[text[i]];if(!rows)continue;
      for(let j=0;j<rows.length;j++){
        const line=rows[j],b=y+(6-j)*k,l=start+i*6*sx;
        for(let col=0;col<5;col++){if(line[col]!=="1")continue;const first=col;while(line[col+1]==="1")col++;
          flat(g,z,l+first*sx,b,l+(col+1)*sx,b+k*.99,color);}
      }
    }
  }
  function round(g,x,y,z,rx,ry,color,sides=28){
    for(let i=0;i<sides;i++){const a=tau*i/sides,b=tau*(i+1)/sides;
      g.tri([x,y,z],[x+rx*Math.cos(a),y+ry*Math.sin(a),z],[x+rx*Math.cos(b),y+ry*Math.sin(b),z],color);}
  }
  function ring(g,x,y,z,r,t,ink,lo=0,hi=tau,segments=36){
    for(let i=0;i<segments;i++){
      const a=mix(lo,hi,i/segments),b=mix(lo,hi,(i+1)/segments),pt=(ang,radius)=>[x+radius*Math.cos(ang),y+radius*Math.sin(ang),z];
      g.quad(pt(a,r),pt(b,r),pt(b,r-t),pt(a,r-t),ink);
    }
  }
  function pane(g,p0,p1,p2,p3,color){g.quad(xyz(p0),xyz(p1),xyz(p2),xyz(p3),color);}
  const hoodBands=[-1,-.94,-.76,-.70,-.65,0,.65,.70,.76,.94,1];
  function bodySection(s,z){
    let i=1;while(i<s.sections.length-1&&z>s.sections[i][0])i++;
    const p=s.sections[i-1],q=s.sections[i],f=(z-p[0])/(q[0]-p[0]);
    return {w:mix(p[1],q[1],f)-.031,h:mix(p[2],q[2],f),z};
  }
  const rib=u=>(1-Math.abs(u))*.022+.012*Math.max(0,1-Math.abs(Math.abs(u)-.71)*9);
  function hoodRings(a){
    if(!a.hoodRings){const first=a.front-.025,last=a.s.sections.at(-1)[0];
      a.hoodRings=[first,mix(first,last,.68),last-.06,last].map(z=>bodySection(a.s,z));}
    return a.hoodRings;
  }
  function hood(v,x,z){
    const builder=window.bayCoachwork?.(v.kind);if(builder)return builder.hoodHeight(v.kind,x,z);
    const rows=hoodRings(layout(v));
    let j=1;while(j<rows.length-1&&z>rows[j].z)j++;
    const a=rows[j-1],b=rows[j],f=clamp((z-a.z)/(b.z-a.z),0,1),w=mix(a.w,b.w,f),u=clamp(x/w,-1,1);
    let i=1;while(i<hoodBands.length-1&&u>hoodBands[i])i++;
    const l=hoodBands[i-1],r=hoodBands[i],diagonal=mix(l*a.w,r*b.w,f),xx=u*w;
    // Mesh.quad joins the lower left to the upper right. Follow that same crease on a tapered hood.
    const across=xx<diagonal?(xx-l*w)/((r-l)*b.w):f+(xx-diagonal)/((r-l)*a.w);
    return mix(a.h,b.h,f)+mix(rib(l),rib(r),across);
  }
  function paintedHood(g,a,paint){
    const builder=window.bayCoachwork?.(a.kind);if(builder){builder.driverEnds(g,a.kind,paint);return;}
    const s=a.s,rings=hoodRings(a).map(row=>row.z),first=rings[0],last=rings.at(-1);
    const where=(u,z,r=0)=>{const {w,h}=bodySection(s,z);return [u*w,h+rib(u)+r,z];};
    const bands=hoodBands,lifts=[.15,.085,.02,.14,.07,.055,.13,.035,.075,.14];
    for(let k=0;k<rings.length-1;k++)for(let i=1;i<bands.length;i++){
      g.quad(where(bands[i-1],rings[k]),where(bands[i],rings[k]),where(bands[i],rings[k+1]),where(bands[i-1],rings[k+1]),
        tint(paint,"#e8dec3",lifts[i-1]+(k===2?.07:0)));
    }
    for(const side of [-1,1]){
      const seam=tint(paint,"#3e4145",.48);
      for(let k=0;k<2;k++)g.quad(where(side*.84,rings[k],.002),where(side*.846,rings[k],.002),where(side*.846,rings[k+1],.002),where(side*.84,rings[k+1],.002),seam);
      for(let i=0;i<6;i++){const u=side*(.33+i*.052),z=first+.06;
        g.quad(where(u,z,.006),where(u+side*.015,z,.006),where(u+side*.024,z+.069,.006),where(u+side*.012,z+.069,.006),seam);}
    }
    if(a.kind==="wrecker"||a.kind==="cab")g.box(0,bodySection(s,last-.15).h+.059,last-.16,.035,.06,.035,a.style.edge);
    const rear=a.rear+.016,tail=s.sections[0];g.quad([-a.base,a.sill-.018,rear],[a.base,a.sill-.018,rear],[tail[1],tail[2],tail[0]],[-tail[1],tail[2],tail[0]],paint);
  }
  function seats(g,a){
    const {s,style:p}=a,low=s.seatY,back=s.seatZ-.205;
    for(const x of [-s.seatX,s.seatX]){
      g.box(x,low-.055,s.seatZ+.060,.405,.125,.51,p.cloth);
      g.box(x,low+.18,back,.412,.49,.112,p.cloth);
      for(const side of [-1,1])g.box(x+side*.166,low+.18,back+.050,.071,.43,.059,tint(p.cloth,"#463c36",.19));
      for(let i=-2;i<=2;i++)g.box(x+i*.051,low+.16,back+.061,.006,.36,.008,p.thread);
      g.box(x,low+.46,back-.021,.194,.128,.107,p.cloth);
      for(const off of [-.055,.055])g.box(x+off,low+.39,back-.015,.014,.115,.016,p.edge);
    }
    if(a.kind==="wrecker"||a.kind==="van"||a.kind==="ambulance")return;
    const rz=a.rear+.20;
    g.box(0,low-.03,rz+.075,a.base*1.82,.180,.34,p.cloth);
    g.box(0,low+.11,rz-.08,a.base*1.8,.31,.105,p.cloth);
    for(let x=-.54;x<.6;x+=.12)g.box(x,low+.11,rz-.024,.006,.27,.005,p.thread);
  }
  function cabinWalls(g,a){
    const {style:p,s,roof,cap,sill,base,front,roofFront,roofRear,rear}=a;
    const frame="#303c3e",seal="#263437",liner=tint(p.pad,"#e1d9b9",.40);
    const fixedRoof=a.kind!=="caleta";
    if(fixedRoof)g.quad([-cap,roof+.013,roofRear],[cap,roof+.013,roofRear],[cap,roof+.013,roofFront],[-cap,roof+.013,roofFront],liner);
    for(const z of (fixedRoof?[roofRear,roofFront]:[roofFront]))g.box(0,roof-.005,z,cap*2+.018,.04,.073,liner);
    for(const side of [-1,1]){
      const x=side*base,x1=side*cap,sideTrim=tint(p.trim,"#2c3335",.2);
      const p0=glass({kind:a.kind},side<0?0:1,0),p1=glass({kind:a.kind},side<0?0:1,1);
      g.pole([p0.x,p0.y,p0.z],[p1.x,p1.y,p1.z],a.high?.048:.041,seal,7);
      g.pole([p0.x-side*.008,p0.y+.002,p0.z-.012],[p1.x-side*.008,p1.y-.009,p1.z-.016],a.high?.039:.033,liner,7);
      if(fixedRoof){
        g.pole([x,sill,rear],[x1,roof,roofRear],.044,sideTrim,6);
      const b=mix(rear,front,s.divider),br=mix(roofRear,roofFront,s.divider);
      g.pole([x,sill,b],[x1,roof,br],a.high?.047:.035,sideTrim,6);
      g.pole([x1,roof,roofRear],[x1,roof,roofFront],.037,liner,6);
      }
      g.box(x,sill*.67,(rear+front)/2,.056,sill*.66,front-rear,sideTrim);
      g.box(x-side*.013,sill-.018,(rear+front)/2,.072,.042,front-rear,p.pad);
      g.box(x-side*.038,sill-.16,s.seatZ+.11,.069,.068,.54,p.cloth);
      g.box(x-side*.047,sill-.110,s.seatZ+.27,.034,.025,.152,p.edge);
      g.box(x-side*.045,sill-.109,s.seatZ+.29,.038,.010,.089,"#424e4c");
      if(fixedRoof)g.pole([x1,roof-.006,roofRear+.16],[x1-side*.025,roof-.04,roofRear+.17],.011,p.edge,5);
    }
    g.box(0,sill-.028,front,base*2+.02,.063,.053,seal);
    g.box(0,s.floorY-.035,s.seatZ,base*2,.13,front-rear,frame);
    g.box(0,sill-.018,rear,base*2,.047,.065,p.pad);
    if(a.kind==="van"||a.kind==="wrecker"||a.kind==="ambulance"){
      const y=(sill+roof)*.5;
      for(const ss of [-1,1])g.box(ss*base*.78,y-.08,rear+.003,base*.46,roof-sill+.12,.045,p.trim);
      g.box(0,sill+.065,rear+.009,base*2,.18,.055,p.trim);
      g.box(0,roof-.055,roofRear+.003,cap*2,.105,.055,liner);
    }
    seats(g,a);
    const at=a.mirrorAt,neck=at(.21,.54),h=(neck.y+.032-sill)/(roof-sill);
    const foot=glass({kind:a.kind},.5+(neck.x+.010)/(2*mix(base,cap,h)),h);
    g.pole(xyz(neck),[foot.x,foot.y,foot.z-.007],.008,frame,7);
    g.box(foot.x,foot.y,foot.z-.009,.031,.013,.016,frame);
    pane(g,at(-.543,.62),at(.543,.62),at(.543,-.62),at(-.543,-.62),"#202d30");
    pane(g,at(-.514,.544),at(.514,.544),at(.514,-.544),at(-.514,-.544),p.edge);
    const pts=a.mirror.map(o=>({...o,z:o.z-.0005}));
    pane(g,pts[0],pts[1],pts[2],pts[3],"#748b8d");
    const visor=side=>{const width=cap*.68,x=side*cap*.54;g.box(x,roof-.019,roofFront-.115,width,.029,.16,tint(liner,"#444f4a",.14));
      g.box(x+side*width*.26,roof-.035,roofFront-.123,width*.12,.006,.018,p.edge);};
    visor(-1);visor(1);
  }
  const wood="#765a45",black="#263234",chrome="#bcc1b3";
  function vents(g,z,x,y,w,h,p,n){
    flat(g,z,x-w/2-.006,y-h/2-.006,x+w/2+.006,y+h/2+.006,p.edge);
    flat(g,z-.0011,x-w/2,y-h/2,x+w/2,y+h/2,black);
    for(let i=1;i<=n;i++){
      const yy=y-h/2+h*i/(n+1);flat(g,z-.0023,x-w*.47,yy-.002,x+w*.47,yy+.002,p.pad);
    }
    g.box(x+w*.21,y,z-.005,.014,.008,.012,p.edge);
  }
  function dialLayout(a){
    const x=a.ey.x,y=a.clusterY,z=a.dashZ-.039;
    const meter=(quantity,dx,r,dy=0)=>({quantity,x:x+dx,y:y+dy,z,r,max:quantity==="mph"?a.style.limit:quantity==="revs"?8:100});
    const bar=(quantity,width)=>({quantity,x,y:y+.006,z,width,max:a.style.limit});
    switch(a.style.dash){
      case "pair":return [meter("mph",-.063,.068),meter("revs",.082,.057,-.005)];
      case "single":return [meter("mph",-.005,.077),meter("temp",.129,.031,-.016)];
      case "ribbon":return [bar("mph",.327)];
      case "box":return [bar("mph",.205),meter("temp",.157,.034,-.012)];
      case "three":return [meter("mph",-.024,.070),meter("revs",.111,.043,-.015),meter("temp",-.140,.031,-.010)];
      default:return [meter("mph",-.064,.070),meter("revs",.069,.042,.009),meter("temp",.141,.029,-.018)];
    }
  }
  const sweep=f=>3.83-4.52*f;
  function dialFace(g,m,p){
    const {x,y,z,r}=m,inks=p.ink,sub=tint(inks,p.face,.27),face=p.face;
    round(g,x,y,z+.003,r*1.10,r*1.10,black);
    round(g,x,y,z+.001,r*1.054,r*1.054,p.edge);
    round(g,x,y,z,r,r,face);
    ring(g,x,y,z-.0007,r*.965,r*.024,tint(p.face,inks,.23));
    const divisions=m.quantity==="mph"?m.max/5:m.quantity==="revs"?16:6;
    for(let i=0;i<=divisions;i++){
      const f=i/divisions,a=sweep(f),co=Math.cos(a),si=Math.sin(a),big=m.quantity==="mph"?i%2===0:i%4===0;
      const length=big?.20:.104,tone=m.quantity==="revs"&&f>.77||m.quantity==="temp"&&f>.85?p.accent:inks;
      strip(g,z-.0011,x+co*r*(.91-length),y+si*r*(.91-length),x+co*r*.905,y+si*r*.905,big?r*.030:r*.016,tone);
      const numbers=m.quantity==="mph"?i%4===0:m.quantity==="revs"?i%4===0:false;
      if(numbers){const label=String(Math.round(f*m.max)),h=r*(m.quantity==="mph"?.16:.19);
        plaque(g,z-.0016,label,x+co*r*.606,y+si*r*.606-h*.4,h,tone);}
    }
    plaque(g,z-.0015,m.quantity==="mph"?"MPH":m.quantity==="revs"?"RPM":"TEMP",x,y-r*.45,r*(m.quantity==="temp"?.19:.131),sub);
    if(m.quantity==="mph")flat(g,z-.00175,x-r*.25,y-r*.645,x+r*.25,y-r*.565,tint(face,black,.43));
    if(m.quantity==="temp"){plaque(g,z-.0014,"C",x-r*.60,y-r*.31,r*.14,inks);plaque(g,z-.0014,"H",x+r*.61,y-r*.31,r*.14,p.accent);}
  }
  function stripFace(g,m,p){
    const {x,y,z,width:w,max}=m,h=.10,left=x-w*.5,right=x+w*.5;
    flat(g,z+.002,left-.014,y-h*.65,right+.014,y+h*.61,black);
    flat(g,z+.0005,left-.009,y-h*.60,right+.009,y+h*.57,p.edge);
    flat(g,z-.001,left-.005,y-h*.55,right+.005,y+h*.50,p.face);
    flat(g,z-.0018,left,y-.027,right,y-.024,tint(p.ink,p.face,.39));
    for(let n=0;n<=max;n+=5){
      const xx=mix(left+.009,right-.009,n/max);
      flat(g,z-.0024,xx-.001,y+.005,xx+.001,y+(n%10===0?.022:.014),p.ink);
      if(n%20===0)plaque(g,z-.0027,String(n),xx,y+.025,.012,p.ink);
    }
    plaque(g,z-.0028,"MPH",x,y-.044,.008,p.ink);
  }
  function indicators(a){
    const x=a.ey.x,y=a.clusterY-.079,z=a.dashZ-.047;
    return {x,y,z};
  }
  function dashboard(g,a){
    const {style:p,s,dashZ:z,ey,clusterY:y,base,front,sill}=a,top=y-.026,bot=top-.275;
    // The coaming falls away towards the glass and the instruments have their own recessed face.
    const xs=[-.983*base,ey.x-.177,ey.x+.188,.18,base*.97];
    const tops=[top-.043,top+.016,top+.016,top-.025,top-.047];
    for(let i=1;i<xs.length;i++){
      g.quad([xs[i-1],tops[i-1],z],[xs[i],tops[i],z],[xs[i],sill-.006,front-.006],[xs[i-1],sill-.006,front-.006],p.top);
      g.quad([xs[i-1],bot,z+.035],[xs[i],bot,z+.035],[xs[i],tops[i],z],[xs[i-1],tops[i-1],z],p.trim);
    }
    g.box(0,bot+.017,z+.039,base*1.87,.058,.063,p.pad);
    const podW=a.kind==="cruiser"?.395:.381;
    g.box(ey.x+.012,y+.002,z+.026,podW,.176,.128,p.top);
    g.box(ey.x+.012,y+.082,z+.017,podW+.019,.015,.157,tint(p.top,"#a9ad99",.12));
    g.box(ey.x+.012,y-.075,z+.025,podW+.006,.018,.132,p.edge);
    if(a.kind==="wrecker"||a.kind==="cab"){
      g.box(.249,top-.062,z-.001,base*.99,.119,.009,a.kind==="cab"?wood:p.pad);
      if(a.kind==="cab")for(let j=0;j<9;j++){
        const by=top-.106+j*.01,d=.003*Math.sin(j*5.27);
        strip(g,z-.007,-.04,by,.53,by+d,.0016,j%2?"#886c50":"#694f41");
      }
    }
    const ventY=top-.035;
    vents(g,z-.012,base*.77,ventY,.119,.057,p,4);
    vents(g,z-.013,.04,ventY,.173,.047,p,4);
    if(a.kind!=="coupe"&&a.kind!=="wrecker")vents(g,z-.011,-base*.85,ventY,.082,.059,p,4);
    const center=.052,fy=top-.129;
    flat(g,z-.012,center-.121,fy-.047,center+.121,fy+.045,p.edge);
    flat(g,z-.014,center-.117,fy-.044,center+.117,fy+.042,black);
    flat(g,z-.015,center-.066,fy+.001,center+.066,fy+.028,"#738a79");
    for(let i=0;i<13;i++)flat(g,z-.0158,center-.058+i*.0092,fy+.008,center-.0572+i*.0092,fy+(i%3?.016:.023),"#e5d9a8");
    flat(g,z-.0165,center+.0025,fy+.004,center+.0065,fy+.026,p.accent);
    for(const d of [-1,1]){round(g,center+d*.088,fy+.008,z-.016,.016,.016,p.pad,12);round(g,center+d*.088,fy+.008,z-.017,.011,.011,p.edge,12);}
    for(let i=0;i<6;i++){const xx=center-.07+i*.026;
      flat(g,z-.016,xx,fy-.032,xx+.019,fy-.010,i===3?"#8e8f7c":p.pad);}
    const gx=.39,gy=top-.169;
    flat(g,z+.001,gx-.178,gy-.065,gx+.155,gy+.068,black);
    flat(g,z-.001,gx-.175,gy-.062,gx+.152,gy+.066,p.pad);
    g.box(gx,gy+.040,z-.007,.077,.015,.015,p.edge);
    plaque(g,z-.008,p.stamp,gx,top-.083,.018,p.ink);
    const mark=indicators(a);
    flat(g,mark.z+.004,mark.x-.097,mark.y-.014,mark.x+.101,mark.y+.020,black);
    // Steering column, combination stalk and shifter.
    const w=a.wheel;
    g.pole([w.x,w.y-.018,w.z+.01],[w.x,top-.145,z+.046],.039,p.trim,8);
    g.pole([w.x-.024,w.y-.012,w.z+.076],[w.x-.16,w.y+.017,w.z+.034],.009,black,6);
    g.box(w.x-.153,w.y+.016,w.z+.034,.046,.018,.023,p.pad);
    g.box(-.008,s.floorY+.112,ey.z+.10,.151,.17,.49,p.trim);
    g.pole([-.006,s.floorY+.17,ey.z+.19],[.022,s.floorY+.323,ey.z+.214],.012,p.edge,6);
    g.box(.022,s.floorY+.327,ey.z+.214,.059,.037,.046,p.hub);
    if(a.kind==="cab"){
      g.box(.245,top+.044,z+.14,.193,.101,.092,p.hub);g.box(.245,top+.05,z+.093,.157,.066,.009,black);
      plaque(g,z+.086,"ON CALL",.245,top+.040,.017,"#eeb76f");
      g.box(.46,top-.108,z-.017,.10,.072,.008,"#ddc69e");
      flat(g,z-.022,.423,top-.13,.448,top-.081,"#788d83");round(g,.436,top-.098,z-.023,.008,.008,"#a57b57",9);
      for(let i=0;i<3;i++)flat(g,z-.022,.457,top-.094-.009*i,.495,top-.092-.009*i,"#7d806e");
      g.box(.479,top-.071,z-.021,.015,.013,.006,p.edge);
    }else if(a.kind==="cruiser"){
      g.box(.238,top+.020,z+.095,.171,.085,.075,"#404b52");
      flat(g,z+.056,.174,top+.011,.269,top+.043,"#aac1a8");
      plaque(g,z+.055,"DISP",.220,top+.016,.017,black);
      for(let i=0;i<3;i++)round(g,.285+i*.010,top+.001,z+.055,.0036,.0036,p.accent,8);
      g.pole([.29,top-.05,z-.022],[.299,top-.121,z-.042],.007,black,5);
    }else if(a.kind==="wrecker"){
      for(const [i,k] of ["#d59b51","#b86848"].entries()){const xx=.162+i*.076;
        g.box(xx,top-.19,z-.032,.041,.041,.038,k);round(g,xx,top-.19,z-.054,.014,.014,black,10);}
      const cz=z+.27;
      g.quad([.20,top+.001,cz],[.53,top-.004,cz+.03],[.56,top-.022,cz+.245],[.23,top-.019,cz+.215],"#7f6a4c");
      for(let j=0;j<4;j++)g.quad([.248,top-.001-j*.001,cz+.04+j*.028],[.48,top-.003-j*.001,cz+.06+j*.028],[.48,top-.0031-j*.001,cz+.063+j*.028],[.248,top-.0011-j*.001,cz+.043+j*.028],"#d3c6a5");
    }else if(a.kind==="van"){
      const dz=front-.19;
      for(let i=0;i<3;i++)g.box(.27+i*.029,sill+.013,dz,.013,.013,.135,i===1?"#d7b666":"#b4b0a4",-.27);
    }
  }
  function instrumentFaces(g,a){
    for(const m of dialLayout(a)){if(m.width)stripFace(g,m,a.style);else dialFace(g,m,a.style);}
  }
  function wheelShape(g,a){
    const r=a.wheel.r,p=a.style,thickness=a.kind==="wrecker"?.0109:a.kind==="coupe"?.0120:.0156;
    const profile=[["#9b8f79",.15],["#c1b090",.14],["#dacfae",.12],["#242e30",.11],["#222c2f",.30],["#212b2b",.23]];
    const rims=profile.map(([to,t])=>tint(p.rim,to,t)),point=(t,section)=>{
      const radial=r+Math.cos(section*tau/6)*thickness;return [Math.cos(t)*radial,Math.sin(t)*radial,Math.sin(section*tau/6)*thickness];
    };
    for(let i=0;i<48;i++){
      const u=i*tau/48,v=(i+1)*tau/48;
      for(let j=0;j<6;j++)g.quad(point(u,j),point(v,j),point(v,j+1),point(u,j+1),rims[j]);
    }
    const angles=p.spokes===3?[.12,Math.PI-.12,Math.PI*1.5]:p.spokes===2?[-.23,Math.PI+.23]:[.27,Math.PI-.27,Math.PI*1.28,Math.PI*1.72];
    for(const t of angles){
      const co=Math.cos(t),si=Math.sin(t),pt=(length,offset,d)=>[co*length-si*offset,si*length+co*offset,d];
      const metal=a.kind==="coupe"||a.kind==="wrecker",color=metal?p.edge:p.hub,width=metal?.012:.021;
      g.quad(pt(.017,-width,-.022),pt(r*.97,-width*.72,.001),pt(r*.97,width*.72,.001),pt(.017,width,-.022),color);
      if(metal)for(const d of [.58,.70,.81]){const q=pt(r*d,0,-.010+(d-.58)*.025);round(g,q[0],q[1],q[2]-.002,.0048,.0048,p.hub,8);}
      else g.quad(pt(r*.45,-.004,-.012),pt(r*.84,-.004,-.003),pt(r*.84,.001,-.003),pt(r*.45,.001,-.012),tint(p.hub,p.edge,.32));
    }
    if(a.kind==="coupe"||a.kind==="wrecker"){
      round(g,0,0,-.023,.039,.039,p.edge,24);round(g,0,0,-.026,.032,.032,p.hub,24);
      ring(g,0,0,-.027,.026,.0018,p.edge);plaque(g,-.028,a.kind==="coupe"?"GT":"P",0,-.005,.011,p.ink);
      if(a.kind==="coupe")for(let i=0;i<19;i++){const t=i*tau/19,co=Math.cos(t),si=Math.sin(t);
        strip(g,-.012,co*(r-.004),si*(r-.004),Math.cos(t+.018)*(r+.003),Math.sin(t+.018)*(r+.003),.0019,"#c79b77");}
    }else{
      const w=a.kind==="cab"?.122:.094;round(g,0,0,-.021,w*.70,.043,p.hub,16);
      flat(g,-.023,-w*.55,-.027,w*.55,.025,p.hub);
      flat(g,-.024,-w*.44,.006,w*.44,.008,p.edge);
      plaque(g,-.0246,a.kind==="hatch"?"RIVA":a.kind==="van"?"P":"BAY",0,-.014,.012,p.ink);
    }
  }
  function egg(g,point,r1,r2,r3,ink,n=10){
    const ringPoint=(j,i)=>{
      const phi=-Math.PI*.5+Math.PI*j/5,t=i*tau/n,k=Math.cos(phi);
      return point(r1*k*Math.cos(t),r2*k*Math.sin(t),r3*Math.sin(phi));
    };
    for(let j=0;j<5;j++)for(let i=0;i<n;i++)g.quad(ringPoint(j,i),ringPoint(j,i+1),ringPoint(j+1,i+1),ringPoint(j+1,i),ink,.87+.13*j/4);
  }
  function grip(a,side){
    const angle=side<0?2.85:.32,co=Math.cos(angle),si=Math.sin(angle),r=a.wheel.r;
    // Increasing tangential distance always goes towards the top of the wheel.
    return (rad,tan,dep)=>[co*(r+rad)-side*si*tan,si*(r+rad)+side*co*tan,dep];
  }
  function hand(g,a,side,gloved){
    const at=grip(a,side),skin="#b47d5e",light="#c28d70",shade="#a36e53",leather="#5a584b";
    const bulb=(r,t,d,rr,rt,rd,ink,n=9)=>egg(g,(a,b,c)=>at(r+a,t+b,d+c),rr,rt,rd,ink,n);
    bulb(.010,-.004,-.025,.030,.046,.018,gloved?leather:skin,12);
    bulb(.021,-.024,-.026,.023,.027,.019,gloved?"#665d4d":skin);
    for(let i=0;i<4;i++){
      const t=.030-i*.016,len=[.059,.064,.058,.048][i],rr=.0083-i*.00032;
      const p0=at(.025,t-.002,-.031),p1=at(.027,t+.003,-.006),p2=at(.011,t+.005,.015),p3=at(-len*.32,t+.002,.011);
      g.pole(p0,p1,rr*1.18,gloved?leather:skin,7);g.pole(p1,p2,rr,gloved?"#706b59":light,7);g.pole(p2,p3,rr*.89,skin,7);
      bulb(.026,t+.002,-.010,rr,rr*1.08,rr,gloved?"#716a54":light,7);
    }
    const t0=at(.010,.012,-.039),t1=at(-.015,.021,-.041),t2=at(-.035,.036,-.024),t3=at(-.039,.041,-.013);
    g.pole(t0,t1,.014,gloved?leather:skin,8);g.pole(t1,t2,.012,gloved?leather:light,8);g.pole(t2,t3,.0097,skin,8);
    bulb(-.034,.036,-.025,.010,.011,.007,light,8);
    if(gloved){
      for(let i=0;i<3;i++)g.pole(at(.002,-.018+i*.014,-.040),at(.020,-.014+i*.014,-.043),.0017,"#958d72",5);
    }else{
      for(let i=0;i<3;i++)g.pole(at(.010,-.018+i*.013,-.042),at(.021,-.016+i*.013,-.042),.0009,shade,4);
    }
  }
  function armTemplate(g,gloved,side,kit){
    const tube=(lo,hi,x0,y0,x1,y1,ink)=>{
      const point=(t,rx,ry,i)=>[rx*Math.cos(tau*i/9),ry*Math.sin(tau*i/9),t];
      for(let i=0;i<9;i++)g.quad(point(lo,x0,y0,i),point(lo,x0,y0,i+1),point(hi,x1,y1,i+1),point(hi,x1,y1,i),ink,.86+.12*Math.cos(i*tau/9));
    };
    tube(0,.36,.044,.037,.046,.035,"#ad795b");
    tube(.36,.74,.046,.035,.034,.027,"#b27e60");
    tube(.74,1.00,.034,.027,.026,.022,"#b47d5e");
    if(kit==="street")tube(0,.12,.049,.040,.049,.039,"#438e83");
    if(window.BayThreadsArt?.colors[kit]){
      const long=kit!=="tideline",end=long?.76:.25;
      tube(0,end,.051,.043,long?.039:.050,long?.034:.042,BayThreadsArt.colors[kit]);
      tube(end-.06,end+.01,long?.040:.051,long?.035:.044,long?.039:.051,long?.034:.043,kit==="tideline"?"#417b77":kit==="netter"?"#705b46":kit==="pitlane"?"#e1cba4":"#d89665");
    }
    if(gloved)tube(.84,.985,.034,.027,.030,.024,"#635c4c");
    else if(side<0){tube(.66,.755,.038,.031,.037,.030,"#48524b");tube(.70,.732,.039,.032,.039,.032,"#a9b2a4");}
  }
  const gearLines=[[-.48,1,.47,1],[.47,1,.47,0],[.47,0,.47,-1],[.47,-1,-.48,-1],[-.48,-1,-.48,0],[-.48,0,-.48,1],[-.48,0,.47,0]];
  const gearBars={1:"12",2:"01643",3:"01623",4:"5612",5:"05623",R:"456"};
  function lights(v,state){
    const id=typeof v.id==="number"?v.id:0,time=state.time||0;
    const blink=(time+(id%13)*.071)%.84<.42,hazard=state.hazards||v.hazards||v.roadside;
    return {left:blink&&(hazard||v.indicator===-1),right:blink&&(hazard||v.indicator===1),
      dipped:!v.mainBeam&&(state.headlights??(Number(state.night)>.32)),high:!!v.mainBeam,fault:!!v.flatSide||(v.damage?.front||0)>.58};
  }
  function values(v){
    const speed=Math.abs(v.speed||0),gear=clamp(Math.round(v.gear||1),1,5),spec=BayDriving.cars[v.kind]||BayDriving.cars.coupe;
    const ratio=speed/(spec.top*(v.upgrades?.engine?1.18:1)*[.275,.48,.704,.897,1.12][gear-1]);
    return {mph:speed*2.237,revs:clamp(.89+Math.max(ratio*4.84,(v.burn||0)*4.55)+(v.throttle||0)*.89-(v.shift>0?.36:0),.8,7.4),
      temp:clamp(36+(v.throttle||0)*9+(v.damage?.front||0)*60,30,100),gear:v.reversing?"R":String(gear)};
  }
  function wheelPoint(a,ang,x,y,z){
    const co=Math.cos(ang),si=Math.sin(ang),cx=x*co-y*si,cy=x*si+y*co,w=a.wheel,c=Math.cos(w.tilt),s=Math.sin(w.tilt);
    return [w.x+cx,w.y+cy*c-z*s,w.z+cy*s+z*c];
  }
  function buildMotion(a,gloved,kit){
    const mesh=new BayMesh(),parts=[],m=indicators(a);
    function part(task,make){const first=mesh.vertices.length;make();parts.push({...task,first,end:mesh.vertices.length});}
    part({type:"wheel"},()=>wheelShape(mesh,a));
    for(const side of [-1,1]){
      part({type:"hand"},()=>hand(mesh,a,side,gloved));
      part({type:"arm",side,wrist:grip(a,side)(.021,-.029,-.042)},()=>armTemplate(mesh,gloved,side,kit));
    }
    for(const d of dialLayout(a)){
      part({type:"needle",d},()=>{
        if(d.width){
          mesh.tri([-.0043,-.021,-.002],[.0043,-.021,-.002],[0,.020,-.002],a.style.accent);
        }else{
          mesh.tri([-.16*d.r,-.056*d.r,0],[.86*d.r,0,0],[-.16*d.r,.056*d.r,0],a.style.accent);
          round(mesh,0,0,-.0007,d.r*.105,d.r*.105,a.style.ink,10);
        }});
    }
    for(const side of [-1,1]){
      const x=m.x+side*.084,y=m.y+.002;
      part({type:"light",id:side<0?"left":"right"},()=>{
        flat(mesh,m.z,x-.006,y-.0027,x+.006,y+.0027,"#a1c38a");
        mesh.tri([x+side*.003,y-.008,m.z],[x+side*.015,y,m.z],[x+side*.003,y+.008,m.z],"#a1c38a");});
    }
    part({type:"light",id:"dipped"},()=>{
      const x=m.x-.048,y=m.y+.002;
      round(mesh,x+.002,y,m.z,.0058,.0058,"#a4d7aa",9);
      for(let j=-1;j<=1;j++)strip(mesh,m.z,x-.004,y+j*.0038,x-.012,y+j*.0038-.0022,.0016,"#a4d7aa");});
    part({type:"light",id:"fault"},()=>{
      const x=m.x+.047,y=m.y+.003;
      mesh.tri([x-.007,y-.005,m.z],[x+.007,y-.005,m.z],[x,y+.007,m.z],"#e8a35b");});
    part({type:"light",id:"high"},()=>{
      const x=m.x-.074,y=m.y+.016;
      round(mesh,x+.002,y,m.z,.006,.006,"#82caff",9);
      for(let j=-1;j<=1;j++)strip(mesh,m.z,x-.005,y+j*.004,x-.016,y+j*.004,.0018,"#82caff");});
    for(let i=0;i<7;i++)part({type:"segment",id:i},()=>{
      const [x,y,xx,yy]=gearLines[i];strip(mesh,m.z-.0011,m.x+x*.014,m.y+.001+y*.009,m.x+xx*.014,m.y+.001+yy*.009,.0025,"#e7c585");});
    const rest=new Float32Array(mesh.vertices);
    return {parts,rest,vertices:new Float32Array(rest),wheel:NaN,mph:NaN,revs:NaN,temp:NaN,lit:"",selected:""};
  }
  function animate(r,a,v,state){
    const turn=-clamp((v.steer||0)*3.6,-1.98,1.98),handTurn=1.14*Math.tanh(turn/1.27),vals=values(v),lamps=lights(v,state);
    const bits=(lamps.left?1:0)|(lamps.right?2:0)|(lamps.dipped?4:0)|(lamps.fault?8:0)|(lamps.high?16:0);
    const turning=!(Math.abs(turn-r.wheel)<.001),instruments=!(Math.abs(vals.mph-r.mph)<.11&&Math.abs(vals.revs-r.revs)<.026&&Math.abs(vals.temp-r.temp)<.29);
    const tell=bits!==r.lit||r.selected!==vals.gear;
    if(!turning&&!instruments&&!tell)return false;
    const src=r.rest,out=r.vertices,w=a.wheel,ct=Math.cos(w.tilt),st=Math.sin(w.tilt);
    for(const p of r.parts){
      const start=p.first,end=p.end;
      if(p.type==="hand"||p.type==="wheel"){
        if(!turning)continue;
        const ang=p.type==="wheel"?turn:handTurn,co=Math.cos(ang),si=Math.sin(ang);
        for(let i=start;i<end;i+=6){
          const x=src[i]*co-src[i+1]*si,y=src[i]*si+src[i+1]*co,z=src[i+2];
          out[i]=w.x+x;out[i+1]=w.y+y*ct-z*st;out[i+2]=w.z+y*st+z*ct;
        }
      }else if(p.type==="arm"){
        if(!turning)continue;
        const side=p.side,tip=wheelPoint(a,handTurn,...p.wrist),bx=a.ey.x+side*.224,by=a.ey.y-.393,bz=a.ey.z+.036;
        const dx=tip[0]-bx,dy=tip[1]-by,dz=tip[2]-bz,flat=Math.hypot(dx,dz)||1,len=Math.hypot(dx,dy,dz)||1;
        const ux=dz/flat,uz=-dx/flat,vx=dy/len*uz,vy=flat/len,vz=-dy/len*ux;
        for(let i=start;i<end;i+=6){const x=src[i],y=src[i+1],f=src[i+2];
          out[i]=bx+f*dx+x*ux+y*vx;out[i+1]=by+f*dy+y*vy;out[i+2]=bz+f*dz+x*uz+y*vz;}
      }else if(p.type==="needle"){
        if(!instruments)continue;
        const d=p.d,f=clamp(vals[d.quantity]/d.max,0,1),ang=d.width?0:sweep(f),co=Math.cos(ang),si=Math.sin(ang);
        const x=d.x+(d.width?(f-.5)*(d.width-.018):0);
        for(let i=start;i<end;i+=6){out[i]=x+src[i]*co-src[i+1]*si;out[i+1]=d.y+src[i]*si+src[i+1]*co;out[i+2]=d.z+src[i+2]-.004;}
      }else if(tell){
        const lit=p.type==="light"?lamps[p.id]:gearBars[vals.gear].includes(String(p.id)),gain=lit?1.08:.25;
        for(let i=start;i<end;i+=6){out[i+3]=src[i+3]*gain;out[i+4]=src[i+4]*gain;out[i+5]=src[i+5]*gain;}
      }
    }
    if(turning)r.wheel=turn;
    if(instruments){r.mph=vals.mph;r.revs=vals.revs;r.temp=vals.temp;}
    r.lit=bits;r.selected=vals.gear;return true;
  }
  function draw(view,model,v,ground,state={}){
    if(!v||!view.gl||view.lost)return;
    const a=layout(v),key="driver-seat/"+a.kind,paint=v.color||a.s.paint,skin=key+"/hood"+paint,body=key+"/interior",dials=key+"/print";
    let cache=cabinCache.get(view);if(!cache){cache=new Map();cabinCache.set(view,cache);}
    if(!cache.has(body)){
      model(body,g=>{cabinWalls(g,a);dashboard(g,a);});model(dials,g=>instrumentFaces(g,a));
      cache.set(body,true);
    }
    if(!cache.has(skin)){model(skin,g=>paintedHood(g,a,paint));cache.set(skin,true);}
    const gloved=state.gloves??a.kind==="wrecker",kit=["sol","mercado"].includes(state.kit)||window.BayThreadsArt?.colors[state.kit]?state.kit:"street",pose=key+"/wheel/"+(gloved?"work":"street")+"/"+kit;
    let r=cache.get(pose);
    if(!r){
      r=buildMotion(a,gloved,kit);animate(r,a,v,state);BayNeighborGestures.cockpit(r,a,v,state.greet);
      view.add(pose,r,true);cache.set(pose,r);
    }else{
      const moved=animate(r,a,v,state);
      if(BayNeighborGestures.cockpit(r,a,v,state.greet)||moved)view.updateAnimated(pose);
    }
    const place=[v.x,ground,v.z,v.yaw,v.pitch||0,v.lean||0];
    view.draw(skin,...place);
    window.BayRoadGlass?.hood?.(view,v,ground);
    view.draw(body,...place);view.draw(dials,...place,.76);view.draw(pose,...place,.44);
  }
  function compact(ctx,v,state={}){
    if(!ctx||!v)return;const a=layout(v),p=a.style,d=values(v),l=lights(v,state);
    ctx.save();ctx.translate(state.x??0,state.y??0);const scale=(state.width||176)/176;ctx.scale(scale,scale);
    function box(x,y,w,h,r,fill){ctx.fillStyle=fill;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);ctx.fill();}
    box(0,0,176,61,10,"#263638");box(2,2,172,57,8,p.pad);box(4,4,168,53,7,"#223335");
    const cx=31,cy=34,r=22;
    ctx.lineCap="butt";ctx.lineWidth=2.5;ctx.strokeStyle="#91a29a";ctx.beginPath();ctx.arc(cx,cy,r,-3.65,.52);ctx.stroke();
    for(let i=0;i<=10;i++){const t=mix(-3.65,.52,i/10),co=Math.cos(t),si=Math.sin(t);
      ctx.lineWidth=i%2===0?1.65:.9;ctx.strokeStyle=i>8?"#dca56f":"#d7d5b6";ctx.beginPath();
      ctx.moveTo(cx+(r-4)*co,cy+(r-4)*si);ctx.lineTo(cx+(r-1)*co,cy+(r-1)*si);ctx.stroke();}
    const ang=mix(-3.65,.52,clamp(d.mph/p.limit,0,1));ctx.strokeStyle="#ef986d";ctx.lineWidth=2.2;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+16*Math.cos(ang),cy+16*Math.sin(ang));ctx.stroke();
    ctx.fillStyle="#d8d7b5";ctx.beginPath();ctx.arc(cx,cy,2.3,0,tau);ctx.fill();ctx.textAlign="center";ctx.font="bold 7px monospace";ctx.fillText("MPH",cx,46);
    ctx.textAlign="left";ctx.fillStyle="#d9d5b9";ctx.font="bold 8px monospace";ctx.fillText(p.stamp,64,17);ctx.font="bold 22px monospace";ctx.fillStyle="#f1e6bf";ctx.fillText(String(Math.round(d.mph)),63,42);
    ctx.font="bold 12px monospace";ctx.fillStyle="#deb379";ctx.fillText(v.reversing?"R":"D"+d.gear,102,41);
    const arrow=(x,side,on)=>{ctx.fillStyle=on?"#bddb8c":"#455854";ctx.beginPath();ctx.moveTo(x+side*5,16);ctx.lineTo(x-side,12);ctx.lineTo(x-side,14);ctx.lineTo(x-side*5,14);ctx.lineTo(x-side*5,18);ctx.lineTo(x-side,18);ctx.lineTo(x-side,20);ctx.closePath();ctx.fill();};
    arrow(140,-1,l.left);arrow(159,1,l.right);ctx.strokeStyle=l.high?"#82caff":l.dipped?"#b7d8aa":"#566864";ctx.lineWidth=1.4;ctx.beginPath();ctx.arc(148,36,4,-Math.PI*.5,Math.PI*.5);ctx.closePath();ctx.stroke();
    for(let j=-1;j<=1;j++){ctx.beginPath();ctx.moveTo(146,36+j*2.5);ctx.lineTo(140,(l.high?36:38)+j*2.5);ctx.stroke();}
    if(l.fault){ctx.fillStyle="#f5b266";ctx.font="bold 15px monospace";ctx.fillText("!",155,42);}
    ctx.restore();
  }
  window.BayDriversSeat={draw,eye,glass,hood,mirror,project,compact};
})();
