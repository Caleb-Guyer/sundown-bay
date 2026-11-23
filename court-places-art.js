/* Local +V runs from the hoop to the check line. Heights are measured from the playing surface. */
(() => {
  "use strict";
  const tau=2*Math.PI;
  const sites=[
    {id:"sol",name:"Sol Beach Courts",x:187,z:-56.5,y:.117,yaw:-Math.PI/2},
    {id:"mercado",name:"Mercado Yard",x:-52.5,z:-102.7,y:.125,yaw:0}
  ];
  const colors={
    sol:{edge:"#778b83",base:"#779991",key:"#558d88",border:"#d98a69",ring:"#e3cfa3",line:"#f4dfb2",iron:"#748d86",dark:"#496b68",board:"#d5d2b0",rim:"#ba623e"},
    mercado:{edge:"#797979",base:"#85918d",key:"#b37e69",border:"#829c9c",ring:"#d8c396",line:"#efe0be",iron:"#788a89",dark:"#435d65",board:"#c4a586",rim:"#be6944"}
  };
  const cos=s=>Math.cos(s.yaw),sin=s=>Math.sin(s.yaw);
  function worldPoint(s,u,v,y=0){return {x:s.x+u*cos(s)+v*sin(s),y:s.y+y,z:s.z-u*sin(s)+v*cos(s)};}
  function local(s,x,z){const dx=x-s.x,dz=z-s.z;return {u:dx*cos(s)-dz*sin(s),v:dx*sin(s)+dz*cos(s)};}
  function floor(x,z){
    for(const s of sites){
      if(Math.abs(x-s.x)>12||Math.abs(z-s.z)>12)continue;
      const p=local(s,x,z);if(Math.abs(p.u)<=7.200001&&p.v>=-2.000001&&p.v<=11.200001)return s.y;
    }
    return null;
  }
  function mapPoint(p,site){
    const h=(p.y??site.y)-site.y;return {x:p.x+.22*h,z:p.z+.27*h};
  }
  const blocks=[];
  const pools=[[-3.40,1.2,5.3,5.9],[3.45,6.98,5.85,5.35]],lightPools=[];
  function block(s,u,v,w,d,h){
    const p=worldPoint(s,u,v),ac=Math.abs(cos(s)),as=Math.abs(sin(s));
    blocks.push({x:p.x,z:p.z,w:w*ac+d*as,d:w*as+d*ac,bottom:0,top:s.y+h,streetProp:true,court:s.id});
  }
  for(const site of sites){
    for(const [u,v,ru,rv] of pools){
      const p=worldPoint(site,u,v),turned=Math.abs(sin(site))>.5;
      lightPools.push({x:p.x,z:p.z,rx:turned?rv:ru,rz:turned?ru:rv,r:188,g:171,b:132});
    }
    block(site,0,-1.62,.34,.37,2.96);
    block(site,0,-2.25,15.02,site.id==="sol"?.11:.22,site.id==="sol"?2.24:2.31);
    block(site,7.48,.15,.12,4.80,1.58);
    block(site,7.50,8.62,.38,.38,5.95);block(site,-7.49,-1.85,.38,.38,5.76);
  }
  const plane=y=>(u,v)=>[u,y,v],face=v=>(u,y)=>[u,y,v];
  const rect=(g,p,l,b,r,t,c)=>g.quad(p(l,b),p(r,b),p(r,t),p(l,t),c);
  function band(g,p,a,b,w,c){
    const dx=b[0]-a[0],dy=b[1]-a[1],len=Math.hypot(dx,dy)||1,x=-dy*w/(2*len),y=dx*w/(2*len);
    g.quad(p(a[0]+x,a[1]+y),p(b[0]+x,b[1]+y),p(b[0]-x,b[1]-y),p(a[0]-x,a[1]-y),c);
  }
  function pen(g,p,points,w,c){for(let i=1;i<points.length;i++)band(g,p,points[i-1],points[i],w,c);}
  function poly(g,p,pts,c){
    // The artwork uses convex facets so the same ink shapes can be printed on the floor or wall.
    const a=p(...pts[0]);for(let i=1;i+1<pts.length;i++)g.tri(a,p(...pts[i]),p(...pts[i+1]),c);
  }
  function oval(g,p,x,y,rx,ry,c,n=18){
    for(let i=0;i<n;i++){const a=tau*i/n,b=tau*(i+1)/n;g.tri(p(x,y),p(x+rx*Math.cos(a),y+ry*Math.sin(a)),p(x+rx*Math.cos(b),y+ry*Math.sin(b)),c);}
  }
  function arc(g,p,x,y,r,start,end,w,c,n){
    for(let i=0;i<n;i++){
      const a=start+(end-start)*i/n,b=start+(end-start)*(i+1)/n,inner=r-w/2,outer=r+w/2;
      g.quad(p(x+inner*Math.cos(a),y+inner*Math.sin(a)),p(x+inner*Math.cos(b),y+inner*Math.sin(b)),
        p(x+outer*Math.cos(b),y+outer*Math.sin(b)),p(x+outer*Math.cos(a),y+outer*Math.sin(a)),c);
    }
  }
  const glyph={
    A:"04 20 44|13 33",B:"04 00 30 41 32 02|32 43 34 04",C:"40 10 01 03 14 44",
    D:"04 00 20 41 43 24 04",E:"40 00 04 44|02 32",H:"00 04|40 44|02 42",L:"00 04 44",
    M:"04 00 22 40 44",N:"04 00 44 40",O:"10 30 41 43 34 14 03 01 10",
    P:"04 00 30 41 32 02",R:"04 00 30 41 32 02|22 44",S:"40 10 01 12 32 43 34 04",
    T:"00 40|20 24",U:"00 03 14 34 43 40",Y:"00 22 40|22 24",1:"11 20 24|14 34",2:"01 10 30 41 32 04 44",
    3:"00 30 41 32 12|32 43 34 04",4:"30 02 42|30 34",8:"10 30 41 32 12 01 10|12 03 14 34 43 32"
  };
  const letters={};
  for(const [k,parts] of Object.entries(glyph))letters[k]=parts.split("|").map(s=>s.split(" ").map(a=>[Number(a[0])*.25,1-Number(a[1])*.25]));
  function word(g,p,text,x,y,h,c){
    // A reader on the court looks toward -V, with -U on their right.
    const step=h*.79,start=(step*(text.length-1)+.58*h)/2;
    for(let i=0;i<text.length;i++)for(const path of letters[text[i]]||[])
      pen(g,p,path.map(([u,v])=>[x+start-i*step-u*.58*h,y+v*h]),h*.095,c);
  }
  const surf="#67938c",seaDeep="#537c7d",clay="#b87961",cream="#e7ce9e";
  // A sun clipped by three breakers, drawn as a stencil with open breaks in the disc.
  function surfMark(g,p,x,y,k){
    const q=(u,v)=>p(x+u*k,y+v*k);
    const r=.71;
    poly(g,q,[[-r,.03],[-.66,.28],[-.49,.50],[-.23,.66],[.045,.705],[.32,.62],[.56,.43],[.69,.20],[.71,.03]],"#dfa36d");
    for(const [a,b,l] of [[-.95,.97,-.10],[-.82,.68,-.27],[-.45,.46,-.44]]){
      poly(g,q,[[a,l],[a+.11,l+.06],[b,l+.06],[b-.14,l-.05],[a+.15,l-.06]],cream);
    }
    pen(g,q,[[-.52,.13],[-.38,.32],[-.26,.36]],.047,"#eac28b");
  }
  // The Mercado crest is cut like a fruit-crate stencil, with separate flesh, leaves and rind.
  function orangeMark(g,p,x,y,k){
    const q=(u,v)=>p(x+u*k,y+v*k);
    poly(g,q,[[-.61,.12],[-.57,-.21],[-.39,-.46],[-.11,-.59],[.23,-.58],[.45,-.39],[.58,-.11],[.48,.25],[.27,.41],[-.04,.43],[-.39,.35]],"#d89a60");
    poly(g,q,[[.00,.37],[.04,.60],[.23,.82],[.58,.84],[.46,.64],[.17,.44]],"#4f7c69");
    poly(g,q,[[-.04,.37],[-.20,.66],[-.49,.74],[-.67,.70],[-.47,.51],[-.18,.39]],"#729176");
    pen(g,q,[[-.35,.09],[-.32,-.12],[-.19,-.27]],.07,"#e6c38b");
  }
  const roadCuts={
    sol:[[[6.52,8.97],[5.92,8.56],[5.64,8.61],[5.21,8.28],[5.03,7.84]],
      [[5.65,8.60],[5.93,8.12],[5.94,7.88]],[[-6.78,2.18],[-6.13,1.94],[-5.73,2.05],[-5.47,1.87]],
      [[-5.72,2.04],[-5.86,2.44],[-5.64,2.78]],[[2.88,-1.49],[3.15,-.91],[3.40,-.81]]],
    mercado:[[[6.74,6.62],[6.22,6.35],[5.99,5.94],[5.55,5.91],[5.40,5.70]],
      [[6.20,6.35],[5.99,6.81],[5.67,6.96]],[[-6.78,9.13],[-6.13,9.27],[-5.89,9.06],[-5.31,9.13]],
      [[-2.9,1.19],[-2.75,1.61],[-2.80,1.92]],[[2.17,9.61],[2.73,9.52],[3.01,9.72]]]
  };
  // Floor artwork is recorded once, then shared by the native mesh and the overhead raster.
  function makeFloor(s){
    const shapes=[],c=colors[s.id],beach=s.id==="sol";
    let order=0;
    const ink={tri:(a,b,d,col)=>shapes.push([col,[a,b,d],order]),quad:(a,b,d,e,col)=>shapes.push([col,[a,b,d,e],order])};
    const p=(x,z)=>[x,z],surface=(points,col)=>shapes.push([col,points,order]);
    surface([[-7.20,-1.86],[-7.08,-2],[7.07,-2],[7.2,-1.87],[7.2,11.07],[7.03,11.2],[-7.02,11.2],[-7.2,11.04]],c.edge);
    order++;
    rect(ink,p,-6.96,-1.70,6.96,10.89,c.base);
    const shoulder=beach?"#74938a":"#818b87";
    order+=.48;
    rect(ink,p,-6.96,-1.70,-6.83,10.89,shoulder);
    rect(ink,p,6.78,-1.70,6.96,10.89,shoulder);
    rect(ink,p,-6.96,10.65,6.96,10.89,shoulder);
    rect(ink,p,-6.96,-1.70,6.96,-1.51,shoulder);
    order++;
    rect(ink,p,-2.18,-1.53,2.18,4.25,c.key);
    const apron=beach?"#62908b":"#b28570";
    for(let i=0;i<25;i++){
      const a=Math.PI*i/25,b=Math.PI*(i+1)/25;
      ink.tri([0,4.25],[1.74*Math.cos(a),4.25+1.74*Math.sin(a)],[1.74*Math.cos(b),4.25+1.74*Math.sin(b)],apron);
    }
    for(let i=0;i<21;i++){
      const a=Math.PI+Math.PI*i/21,b=Math.PI+Math.PI*(i+1)/21;
      ink.tri([0,10.65],[1.66*Math.cos(a),10.65+1.66*Math.sin(a)],[1.66*Math.cos(b),10.65+1.66*Math.sin(b)],c.border);
    }
    order++;
    if(beach){
      // Two generations of rolled sealer show through salt-worn corners of the asphalt.
      surface([[-6.58,2.79],[-6.04,2.72],[-5.76,2.78],[-5.30,2.64],[-4.90,2.74],[-4.98,2.91],[-5.40,2.97],[-5.65,3.13],[-6.37,3.19],[-6.63,3.10]],"#b0947e");
      surface([[-6.24,3.22],[-5.83,3.14],[-5.37,3.12],[-5.48,3.20],[-6.17,3.28]],"#b99d87");
      surface([[4.16,5.92],[5.98,5.80],[6.19,5.92],[6.08,6.52],[5.71,6.70],[4.50,6.74],[4.21,6.60]],"#67958d");
      surface([[4.38,6.78],[5.31,6.73],[5.68,6.74],[5.39,6.84],[4.42,6.85]],"#719990");
      surface([[-5.04,7.51],[-4.28,7.58],[-4.32,8.04],[-4.81,8.11],[-5.19,7.87]],"#819c92");
      surface([[3.28,1.06],[4.64,1.02],[4.61,1.72],[3.23,1.75]],"#849c92");
      order+=.40;
      surface([[3.31,1.10],[4.59,1.06],[4.55,1.67],[3.28,1.70]],"#79938b");
      surface([[-1.67,-1.30],[-1.36,-1.34],[-1.15,-1.18],[-1.43,-1.19]],"#78968b");
    }else{
      surface([[-6.35,3.20],[-4.90,3.26],[-4.87,4.37],[-6.40,4.32]],"#798783");
      order+=.40;
      surface([[-6.29,3.27],[-4.96,3.32],[-4.94,4.30],[-6.33,4.26]],"#8b9590");
      surface([[3.09,8.13],[3.85,8.11],[4.06,8.44],[3.86,8.68],[3.16,8.62]],"#8b9490");
      surface([[.78,.57],[.97,.54],[1.15,.66],[.82,.75]],"#bd8e76");
    }
    for(const cut of roadCuts[s.id])pen(ink,p,cut,.020,beach?"#647e79":"#707c79");
    order++;
    pen(ink,p,[[-6.8,-1.52],[6.8,-1.52],[6.8,10.65],[-6.8,10.65],[-6.8,-1.52]],.071,c.line);
    pen(ink,p,[[-2.18,-1.52],[-2.18,4.25],[2.18,4.25],[2.18,-1.52]],.072,c.line);
    arc(ink,p,0,4.25,1.74,0,Math.PI,.071,c.line,32);
    for(let i=0;i<9;i++)arc(ink,p,0,4.25,1.74,Math.PI+i*Math.PI/9,Math.PI+(i+.55)*Math.PI/9,.068,c.line,3);
    arc(ink,p,0,0,1.18,0,Math.PI,.070,c.line,24);
    const a=Math.acos(6.04/6.25),v=6.25*Math.sin(a);
    for(const side of [-1,1]){
      band(ink,p,[side*6.04,-1.50],[side*6.04,v],.078,c.line);
      for(const k of [.50,1.37,2.15,2.92])
        rect(ink,p,side<0?-2.43:2.15,k,side<0?-2.15:2.43,k+(k===.50?.16:.059),c.line);
      rect(ink,p,side<0?-1.21:1.15,-.36,side<0?-1.15:1.21,.01,c.line);
    }
    arc(ink,p,0,0,6.25,a,Math.PI-a,.078,c.line,62);
    arc(ink,p,0,10.65,1.66,Math.PI,tau,.070,c.line,30);
    order++;
    if(beach)surfMark(ink,p,0,10.07,.83);else orangeMark(ink,p,0,9.98,.75);
    // The chips interrupt the paint itself. A couple of sections were retraced with a different can.
    for(const [x,z,w,d] of [[-2.18,1.69,.11,.10],[2.18,3.59,.11,.14],[-6.8,7.29,.09,.12],[6.8,7.57,.08,.05]]){
      surface([[x-w*.54,z-d*.5],[x+w*.4,z-d*.4],[x+w*.51,z+d*.25],[x-w*.32,z+d*.52]],Math.abs(x)<3?c.key:c.base);
    }
    rect(ink,p,-.92,4.216,-.30,4.282,beach?"#f5e6c9":"#efe4c9");
    return shapes;
  }
  const printed=new Map(sites.map(s=>[s.id,makeFloor(s)]));
  function floorMesh(g,s){
    const skirting=colors[s.id].edge,rim=printed.get(s.id)[0][1];
    for(let i=0;i<rim.length;i++){
      const a=rim[i],b=rim[(i+1)%rim.length];g.quad([a[0],-.078,a[1]],[b[0],-.078,b[1]],[b[0],0,b[1]],[a[0],0,a[1]],skirting,.82);
    }
    for(const [color,polyline,level] of printed.get(s.id))poly(g,plane(level*.0018),polyline,color);
  }
  const wire="#818f89",iron="#657d77",rust="#a2765b",silver="#a9afa0",white="#ecdfbf";
  const tube=(g,a,b,r,c,n=6)=>g.pole(a,b,r,c,n);
  function wireStrip(g,a,b,r,col){
    // Two crossed ribbons stay legible edge-on. Each segment needs four triangles.
    g.quad([a[0]-r,a[1],a[2]],[b[0]-r,b[1],b[2]],[b[0]+r,b[1],b[2]],[a[0]+r,a[1],a[2]],col);
    g.quad([a[0],a[1],a[2]-r],[b[0],b[1],b[2]-r],[b[0],b[1],b[2]+r],[a[0],a[1],a[2]+r],col);
  }
  function lamp(g,u,v,high,side,beach){
    const steel=beach?"#82958b":"#728589",shade=beach?"#57736e":"#4b626a";
    g.box(u,.087,v,.40,.174,.40,"#a8a193");g.box(u,.184,v,.257,.048,.257,shade);
    for(const x of [-.085,.085])for(const z of [-.085,.085])g.cyl(u+x,.218,v+z,.021,.021,.031,6,silver);
    g.cyl(u,high/2+.18,v,.065,.095,high,7,steel);
    for(const h of [.53,.98,high-1.14])g.cyl(u,h,v,.092,.092,.062,7,shade);
    g.box(u+side*.102,1.02,v,.085,.38,.18,shade);g.box(u+side*.151,1.065,v,.019,.21,.13,"#9fada0");
    const lens=u-side*.69;
    tube(g,[u,high-.14,v],[lens,high+.16,v],.064,steel);
    tube(g,[u,high-.55,v],[lens+side*.11,high+.06,v],.038,shade);
    for(const z of [-.26,.26]){
      g.box(lens,high+.105,v+z,.48,.226,.34,shade);
      g.box(lens-side*.065,high+.008,v+z,.44,.071,.30,"#6e7d70");
      for(let i=0;i<4;i++)g.box(lens-.15+i*.092,high+.237,v+z,.035,.051,.26,steel);
    }
  }
  function lampFaces(g){
    for(const [u,v,high,side] of [[7.50,8.62,5.84,1],[-7.49,-1.85,5.66,-1]])for(const z of [-.26,.26]){
      const x=u-side*.76;
      g.box(x,high-.033,v+z,.381,.025,.25,"#ffe4a5");
      for(const a of [-.11,0,.11])g.box(x+a,high-.047,v+z,.050,.009,.199,"#fff0c6");
    }
  }
  function meshFence(g,point,length,height,detail=true){
    const p=(l,h)=>point(l,h);
    tube(g,p(0,height),p(length,height),.043,iron);tube(g,p(0,.31),p(length,.31),.029,wire);
    const bays=Math.ceil(length/2.6);
    for(let i=0;i<=bays;i++){
      const a=length*i/bays;tube(g,p(a,.025),p(a,height+.05),.041,iron);
      if(detail){tube(g,p(a,.98),p(a,1.02),.049,silver);tube(g,p(a,height-.08),p(a,height-.045),.048,silver);}
    }
    if(!detail)return;
    const low=.22,top=height-.04,step=.37,up=1.68,run=(top-low)/up;
    // Clip each diamond wire to its own end posts.
    for(let i=-run;i<length;i+=step){
      const lo=Math.max(0,i),hi=Math.min(length,i+run);if(hi<=lo)continue;
      tube(g,p(lo,low+(lo-i)*up),p(hi,low+(hi-i)*up),.010,wire,3);
      tube(g,p(lo,top-(lo-i)*up),p(hi,top-(hi-i)*up),.010,wire,3);
    }
  }
  function beachBackdrop(g,detail){
    const rear=face(-2.25),p=(u,y)=>rear(u,y);
    meshFence(g,(u,y)=>p(u-7.48,y),14.96,2.22,detail);
    meshFence(g,(v,y)=>[7.48,y,-2.25+v],4.85,1.58,detail);
    for(const [l,r,t,b] of [[-7.31,-3.40,1.99,.52],[3.31,7.29,2.03,.49]]){
      const f=face(-2.207),sag=(l+r)*.5;
      poly(g,f,[[l,b+.13],[sag,b],[r,b+.09],[r,t],[sag,t-.07],[l,t-.005]],seaDeep);
      if(!detail)continue;
      const front=face(-2.194);
      band(g,front,[l+.08,t-.065],[sag,t-.12],.028,"#91a49a");band(g,front,[sag,t-.12],[r-.08,t-.06],.028,"#91a49a");
      for(let k=0;k<4;k++){
        const x=l+.18+k*(r-l-.34)/3;
        oval(g,front,x,t-.11,.026,.027,cream,6);oval(g,front,x,b+.19,.024,.026,cream,6);
      }
      if(l<0){
        surfMark(g,front,sag-.99,1.25,.54);word(g,front,"SOL",sag+.49,1.31,.32,white);
        word(g,front,"BEACH",sag+.49,.93,.24,"#d8caa9");
      }else{
        const q=(u,v)=>front(sag+u,1.17+v);
        for(let k=0;k<3;k++)pen(g,q,[[-1.53,.26-k*.18],[-1.11,.36-k*.18],[-.42,.25-k*.18],[.22,.05-k*.18],[.73,.01-k*.18],[1.42,.19-k*.18]],.072,k===1?"#dca776":"#88a79a");
      }
    }
  }
  function leaf(g,p,x,y,length,tilt,col){
    const dx=length*Math.cos(tilt),dy=length*Math.sin(tilt),w=length*.14;
    poly(g,p,[[x,y],[x+dx*.31-dy/length*w,y+dy*.31+dx/length*w],[x+dx*.71-dy/length*w*.72,y+dy*.71+dx/length*w*.72],[x+dx,y+dy],
      [x+dx*.61+dy/length*w*.63,y+dy*.61-dx/length*w*.63],[x+dx*.27+dy/length*w*.69,y+dy*.27-dx/length*w*.69]],col);
  }
  function mural(g){
    // A hand with a market orange, in the flat inks of a fruit-box label.
    const p=face(-2.122);
    rect(g,face(-2.134),-7.27,.24,7.27,1.99,"#b8b194");
    for(const [left,right,low,high,hue] of [[-7.27,-4.48,.26,1.92,"#749895"],[-4.43,-1.02,.26,1.92,"#e1b982"],[-.97,2.60,.26,1.92,"#ad7465"],[2.65,7.27,.26,1.92,"#819d8d"]]){
      rect(g,p,left,low,right,high,hue);
    }
    const f=face(-2.110);
    // First bay carries the crate slats and the running edge of its paper band.
    for(let i=0;i<3;i++){
      const x=-7.16+i*.88;poly(g,f,[[x,.51],[x+.52,.81],[x+.81,.71],[x+.28,.40]],"#9e987c");
      band(g,face(-2.102),[x+.11,.56],[x+.47,.74],.025,cream);
    }
    for(const [x,y,k] of [[-6.92,1.23,.61],[-6.24,1.16,.80],[-5.50,1.36,.54]])orangeMark(g,f,x,y,k);
    const art=face(-2.097),over=face(-2.091);
    // Sleeve, palm and four tapered fingertips cradle the sliced orange.
    poly(g,art,[[-4.43,.28],[-4.43,.75],[-3.51,1.04],[-3.23,.76],[-3.51,.51]],"#57877f");
    poly(g,over,[[-3.68,.85],[-3.48,.93],[-3.24,.72],[-3.46,.60]],"#e2c69b");
    poly(g,face(-2.089),[[-3.52,1.05],[-3.12,1.19],[-2.78,1.12],[-2.49,1.02],[-1.75,1.18],[-1.92,.86],[-2.46,.69],[-2.91,.60],[-3.34,.68]],"#b57560");
    for(let i=0;i<3;i++)band(g,face(-2.083),[-2.67+.115*i,.87-.05*i],[-1.86+.11*i,1.14-.10*i],.058,"#805e55");
    oval(g,face(-2.081),-2.52,1.34,.53,.50,"#c98452",24);
    oval(g,face(-2.074),-2.48,1.35,.418,.398,"#f0ca89",24);
    for(let i=0;i<6;i++){
      const a=i*tau/6+.08,b=(i+.9)*tau/6;
      const q=t=>[-2.48+.34*Math.cos(t),1.35+.32*Math.sin(t)];
      poly(g,face(-2.067),[[-2.48+.065*Math.cos((a+b)/2),1.35+.065*Math.sin((a+b)/2)],q(a),q((a+b)/2),q(b)],"#d59658");
    }
    const type=face(-2.081);
    word(g,type,"MERCADO",.79,1.12,.46,"#f2d6a1");word(g,type,"YARD",.79,.62,.28,"#ead0a3");
    band(g,type,[-.50,.51],[2.08,.51],.035,"#d79c73");
    // Citrus from the same tree continues across the other end of the wall.
    pen(g,art,[[2.66,.37],[3.66,.64],[4.53,1.13],[5.22,1.44],[6.22,1.63],[7.17,1.85]],.087,"#4f7064");
    for(const [x,y,l,a,col] of [[3.26,.55,.93,.84,"#558370"],[3.73,.68,.87,-.31,"#d1b780"],[4.20,.95,.77,1.29,"#456c61"],[4.65,1.16,.79,-.73,"#648b71"],[5.22,1.44,.77,.69,"#4b7565"],[5.83,1.52,.86,-.56,"#bdad75"],[6.37,1.63,.75,.35,"#537d69"]])
      leaf(g,over,x,y,l,a,col);
    for(const [x,y,k] of [[3.48,1.33,.50],[4.83,.76,.61],[6.51,.96,.73]])orangeMark(g,type,x,y,k);
    // Cream flecks and mortar cuts cross the ink where the wall has flaked.
    for(const [u,y,n] of [[-6.27,.83,.18],[-4.21,1.62,.11],[-1.21,.43,.20],[1.63,1.63,.23],[3.86,1.28,.13],[6.91,.48,.21]])
      poly(g,type,[[u,y],[u+.73*n,y+.017],[u+n,y+.053],[u+.33*n,y+.076]],"#c4b99c");
  }
  function yardBackdrop(g,detail){
    g.box(0,1.12,-2.25,14.96,2.24,.22,"#b6ac92");g.box(0,2.267,-2.25,15.04,.084,.299,"#bdab89");
    g.box(0,.132,-2.116,14.94,.245,.077,"#a19781");
    if(detail){
      mural(g);
      const back=face(-2.366);
      for(let row=0;row<6;row++){
        rect(g,back,-7.42,.29+row*.30,7.42,.306+row*.30,"#a89d87");
        for(let x=-7.24+(row%2)*.62;x<7.48;x+=1.25)rect(g,back,x,.30+row*.30,x+.018,.585+row*.30,"#a89d87");
      }
    }else{
      const p=face(-2.12);for(const [a,b,c] of [[-7.28,-4.48,"#779a93"],[-4.43,-1.02,"#d9ae77"],[-.97,2.60,"#a87263"],[2.65,7.27,"#79978b"]])rect(g,p,a,.26,b,1.98,c);
    }
    meshFence(g,(v,y)=>[7.48,y,-2.25+v],4.85,1.58,detail);
  }
  function hoop(g,s,detail){
    const c=colors[s.id],beach=s.id==="sol",z=-.38,board=face(z+.009);
    g.box(0,.07,-1.62,.36,.14,.38,"#9b9d8e");
    tube(g,[0,.11,-1.62],[0,2.53,-1.62],.093,c.dark,9);
    tube(g,[0,2.53,-1.62],[0,3.32,-.78],.089,c.dark,8);
    tube(g,[0,3.32,-.78],[0,3.32,-.49],.084,c.dark,8);
    for(const side of [-1,1]){
      tube(g,[0,2.19,-1.61],[side*.67,3.02,-.51],.037,c.iron);
      tube(g,[0,2.72,-1.44],[side*.69,3.60,-.51],.039,c.iron);
    }
    g.box(0,3.27,z-.053,1.80,1.06,.106,beach?"#c7c9b0":"#9c8d79");
    const field=beach?"#e2dcbf":"#c9ad8c";
    rect(g,face(z+.005),-.86,2.78,.86,3.76,field);
    if(detail){
      for(const side of [-1,1]){
        g.box(side*.71,3.27,z-.122,.055,.969,.044,c.iron);
        for(const y of [2.86,3.62])g.cyl(side*.78,y,-.375,.022,.022,.024,6,silver);
      }
      if(beach){
        poly(g,board,[[-.85,2.80],[-.59,2.80],[-.58,2.86],[-.79,2.92],[-.85,3.13]],"#c6b99a");
        pen(g,board,[[.52,3.71],[.67,3.68],[.77,3.61]],.021,"#b3ae98");
        rect(g,board,.48,2.83,.78,2.97,"#62837d");word(g,face(z+.014),"SOL",.63,2.86,.061,"#e4d4a4");
      }else{
        for(const x of [-.55,-.20,.17,.52])band(g,board,[x,2.78],[x+.01,3.76],.014,"#a48c72");
        poly(g,board,[[.51,3.76],[.87,3.76],[.87,3.48],[.76,3.45],[.50,3.58]],"#ad9d85");
        for(const x of [.55,.81])rect(g,face(z+.015),x,3.66,x+.027,3.70,"#766f63");
        rect(g,board,-.77,2.81,-.56,2.90,"#9c8066");
      }
    }
    const fg=face(z+.013);
    pen(g,fg,[[-.85,2.79],[-.85,3.75],[.85,3.75],[.85,2.79]],.041,beach?seaDeep:"#657673");
    pen(g,fg,[[-.293,3.045],[-.293,3.487],[.293,3.487],[.293,3.045],[-.293,3.045]],.041,beach?"#a4674e":"#f2dcae");
    // The center line of the tubular steel is one tube radius outside the playable rim opening.
    g.box(0,3.007,-.34,.175,.190,.083,"#98623f");
    g.box(0,3.027,-.309,.157,.028,.132,c.rim);
    for(const side of [-1,1])tube(g,[side*.070,2.968,-.324],[side*.113,3.036,-.222],.014,c.rim,5);
    const n=detail?28:12,bar=.0134,r=(.2286+bar)/Math.cos(Math.PI/n);
    for(let i=0;i<n;i++){
      const a=tau*i/n,b=tau*(i+1)/n;
      tube(g,[Math.sin(a)*r,3.05,Math.cos(a)*r],[Math.sin(b)*r,3.05,Math.cos(b)*r],bar,c.rim,detail?7:4);
      if(detail&&i%2===0)tube(g,[Math.sin(a)*r,3.051,Math.cos(a)*r],[Math.sin(a)*r,3.019,Math.cos(a)*r],.0075,"#96624a",4);
    }
    if(detail){
      for(const h of [.24,.70])g.cyl(0,h,-1.62,.100,.10,.053,8,c.iron);
      g.box(0,.84,-1.526,.102,.154,.013,beach?"#c5bb95":"#bbba9c");
    }
  }
  function net(g,flex){
    const count=12,rows=[[-.017,.24,0],[-.093,.214,.5],[-.202-flex*.025,.179+flex*.013,1],
      [-.300-flex*.056,.155+flex*.040,1.5],[-.422-flex*.075,.134+flex*.054,2]];
    const p=(row,i)=>{
      const [h,r,offset]=rows[row],a=(i+offset)*tau/count,load=flex*row/4;
      return [Math.sin(a)*r+load*.043,h,Math.cos(a)*r+load*.057];
    };
    for(let row=0;row<rows.length-1;row++)for(let i=0;i<count;i++){
      const a=p(row,i);
      wireStrip(g,a,p(row+1,i),.0075,"#e3d6ad");wireStrip(g,a,p(row+1,i-1),.0083,i%3===0?"#c0b799":"#e4d7b5");
    }
    for(let i=0;i<count;i++)wireStrip(g,p(4,i),p(4,i+1),.007,"#c5bda2");
  }
  function structures(g,s,detail){
    if(s.id==="sol")beachBackdrop(g,detail);else yardBackdrop(g,detail);
    hoop(g,s,detail);
    if(detail){
      lamp(g,7.50,8.62,5.84,1,s.id==="sol");lamp(g,-7.49,-1.85,5.66,-1,s.id==="sol");
    }else for(const [u,v,h,side] of [[7.50,8.62,5.84,1],[-7.49,-1.85,5.66,-1]]){
      tube(g,[u,0,v],[u,h,v],.075,iron,4);tube(g,[u,h,v],[u-side*.72,h+.14,v],.053,iron,4);
      g.box(u-side*.72,h+.10,v,.45,.21,.82,"#627870");
    }
  }
  function install(model){
    for(const s of sites){
      model("court-floor-"+s.id,g=>floorMesh(g,s));model("court-frame-"+s.id,g=>structures(g,s,true));
      model("court-far-"+s.id,g=>structures(g,s,false));
    }
    model("court-flood-bulbs",lampFaces);
    for(let i=0;i<5;i++)model("court-rim-net-"+i,g=>net(g,i/4));
  }
  function ground(view,see,hours){
    for(const s of sites)if(see(s,165))view.draw("court-floor-"+s.id,s.x,s.y,s.z,s.yaw,0,0,.31*(hours?.night||0));
  }
  function world(list,see,t,hours,games,groundDrawn=false){
    for(const s of sites){
      if(!see(s,165))continue;
      const night=hours?.night||0,near=see(s,58);
      if(!groundDrawn)list.push(["court-floor-"+s.id,s.x,s.y,s.z,s.yaw,0,0,.31*night]);
      list.push([(near?"court-frame-":"court-far-")+s.id,s.x,s.y,s.z,s.yaw,0,0,.13*night]);
      if(night>.04)list.push(["court-flood-bulbs",s.x,s.y,s.z,s.yaw,0,0,.91*night]);
      if(!near)continue;
      const game=games?.find(g=>g.site?.id===s.id),swing=Math.max(0,Math.min(1,game?.net||0));
      list.push(["court-rim-net-"+Math.round(4*swing),s.x,s.y+3.05,s.z,s.yaw,0,0,.30*night]);
    }
  }
  function flat(c,pts,color){
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=color;c.fill();
  }
  function stroke(c,pts,w,color){
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
    c.lineWidth=w;c.strokeStyle=color;c.stroke();
  }
  function dot(c,x,y,rx,ry,color){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);c.fillStyle=color;c.fill();
  }
  const overhead=new Map(),left=-9.65,bottom=-4.05,width=19.3,depth=16.35;
  function planImage(s){
    if(overhead.has(s.id))return overhead.get(s.id);
    // Lines, paper mural and chain-link are static. Only the net and lights update on a Chromebook.
    const d=42,w=Math.ceil(width*d),h=Math.ceil(depth*d);
    const layer=typeof OffscreenCanvas!=="undefined"?new OffscreenCanvas(w,h):typeof document!=="undefined"?document.createElement("canvas"):null;
    if(layer){layer.width=w;layer.height=h;}
    const g=layer?.getContext?.("2d");
    if(g){g.setTransform(w/width,0,0,h/depth,-left*w/width,-bottom*h/depth);staticPlan(g,s);}
    overhead.set(s.id,g?layer:null);return overhead.get(s.id);
  }
  function staticPlan(c,s){
    const beach=s.id==="sol",tint=colors[s.id],liftX=.22*cos(s)-.27*sin(s),liftV=.22*sin(s)+.27*cos(s);
    const at=(u,h,v)=>[u+liftX*h,v+liftV*h],seg=(a,b,w,color)=>stroke(c,[at(...a),at(...b)],w,color);
    const stamped=(pts,color)=>flat(c,pts.map(q=>at(...q)),color);
    for(const [col,points] of printed.get(s.id))flat(c,points,col);
    const shadow=(u,h,v)=>[u-h*(.17*cos(s)-.22*sin(s)),v-h*(.17*sin(s)+.22*cos(s))];
    c.save();c.lineCap="round";c.lineJoin="round";
    for(const [u,v,h,side] of [[7.50,8.62,5.84,1],[-7.49,-1.85,5.66,-1]]){
      const bottom=shadow(u,0,v),top=shadow(u,h,v),head=shadow(u-side*.73,h+.12,v);
      stroke(c,[bottom,top,head],.13,"rgba(35,50,49,.24)");dot(c,head[0],head[1],.24,.39,"rgba(35,50,49,.20)");
    }
    function fence(x,z,dx,dz,length,h){
      const pole=(v,y)=>at(x+dx*v,y,z+dz*v);
      const top=h-.06,bottom=.22;
      for(const y of [bottom,h])stroke(c,[pole(0,y),pole(length,y)],y===h?.055:.031,"#688079");
      for(let i=0;i<=Math.ceil(length/2.6);i++){
        const a=length*i/Math.ceil(length/2.6);stroke(c,[pole(a,0),pole(a,h+.05)],.071,"#536f6a");
      }
      const span=(top-bottom)/1.68;
      for(let i=-span;i<length;i+=.45){
        const a=Math.max(0,i),b=Math.min(length,i+span);if(b<=a)continue;
        stroke(c,[pole(a,bottom+(a-i)*1.68),pole(b,bottom+(b-i)*1.68)],.016,"#83938a");
        stroke(c,[pole(a,top-(a-i)*1.68),pole(b,top-(b-i)*1.68)],.016,"#83938a");
      }
    }
    if(beach){
      fence(-7.48,-2.25,1,0,14.96,2.22);
      for(const [l,r] of [[-7.31,-3.40],[3.31,7.29]]){
        stamped([[l,.64,-2.20],[(l+r)/2,.54,-2.20],[r,.64,-2.20],[r,2.01,-2.20],[(l+r)/2,1.93,-2.20],[l,2.01,-2.20]],seaDeep);
        seg([l+.09,1.88,-2.18],[r-.08,1.88,-2.18],.028,"#a1b1a4");
        if(l<0){
          const p=at(l+1.18,1.22,-2.17);dot(c,p[0],p[1],.27,.105,"#dfa675");
          seg([l+.80,.85,-2.17],[l+1.59,.85,-2.17],.060,cream);
        }
      }
    }else{
      stamped([[-7.48,.04,-2.36],[7.48,.04,-2.36],[7.48,2.24,-2.36],[-7.48,2.24,-2.36]],"#a09985");
      stamped([[-7.48,.04,-2.135],[7.48,.04,-2.135],[7.48,2.24,-2.135],[-7.48,2.24,-2.135]],"#b7ab8f");
      for(const [a,b,color] of [[-7.27,-4.48,"#769892"],[-4.43,-1.02,"#dcb780"],[-.97,2.60,"#ae7666"],[2.65,7.27,"#839f8d"]])
        stamped([[a,.26,-2.12],[b,.26,-2.12],[b,1.98,-2.12],[a,1.98,-2.12]],color);
      for(const [x,y,rx,ry] of [[-6.53,1.13,.28,.10],[-5.84,1.28,.27,.11],[-2.48,1.31,.50,.15],[4.82,.96,.26,.10],[6.48,1.12,.41,.13]]){
        const p=at(x,y,-2.09);dot(c,p[0],p[1],rx,ry,"#cc936a");
      }
      stamped([[-7.52,2.29,-2.39],[7.52,2.29,-2.39],[7.52,2.29,-2.10],[-7.52,2.29,-2.10]],"#c1af91");
    }
    fence(7.48,-2.25,0,1,4.85,1.58);
    for(const [u,v,h,side] of [[7.50,8.62,5.84,1],[-7.49,-1.85,5.66,-1]]){
      flat(c,[[u-.20,v-.20],[u+.20,v-.20],[u+.20,v+.20],[u-.20,v+.20]],"#9e9e8f");
      seg([u,.14,v],[u,h,v],.12,"#738983");seg([u,h-.22,v],[u-side*.72,h+.12,v],.10,"#6d827b");
      const a=u-side*.72;
      for(const z of [-.26,.26]){
        stamped([[a-.24,h+.18,v+z-.17],[a+.24,h+.18,v+z-.17],[a+.24,h+.18,v+z+.17],[a-.24,h+.18,v+z+.17]],"#5e756e");
      }
    }
    const boardShadow=[[-.9,2.74,-.38],[.9,2.74,-.38],[.9,3.80,-.38],[-.9,3.80,-.38]];
    flat(c,boardShadow.map(q=>shadow(...q)),"rgba(50,64,59,.19)");
    stroke(c,[shadow(0,.12,-1.62),shadow(0,2.53,-1.62),shadow(0,3.32,-.49)],.15,"rgba(50,64,59,.24)");
    seg([0,.12,-1.62],[0,2.53,-1.62],.17,tint.dark);seg([0,2.53,-1.62],[0,3.32,-.49],.16,tint.dark);
    for(const side of [-1,1])seg([0,2.19,-1.61],[side*.67,3.02,-.51],.05,tint.iron);
    stamped(boardShadow,tint.board);
    for(const h of [2.79,3.75])seg([-.87,h,-.38],[.87,h,-.38],.049,tint.dark);
    for(const u of [-.87,.87])seg([u,2.79,-.38],[u,3.75,-.38],.045,tint.dark);
    for(const h of [3.045,3.487])seg([-.29,h,-.367],[.29,h,-.367],.033,beach?clay:white);
    for(const u of [-.29,.29])seg([u,3.045,-.367],[u,3.487,-.367],.033,beach?clay:white);
    seg([0,3.025,-.37],[0,3.025,-.21],.13,tint.rim);c.restore();
  }
  let lightSprite;
  function planLights(c,night,at){
    c.save();c.beginPath();c.rect(-7.20,-2,14.4,13.20);c.clip();
    c.globalAlpha=night*.35;c.fillStyle="#354a68";c.fillRect(-7.20,-2,14.40,13.20);
    if(!lightSprite&&(typeof OffscreenCanvas!=="undefined"||typeof document!=="undefined")){
      const canvas=typeof OffscreenCanvas!=="undefined"?new OffscreenCanvas(64,64):document.createElement("canvas");
      canvas.width=64;canvas.height=64;
      const pen=canvas.getContext("2d"),g=pen.createRadialGradient(32,32,0,32,32,32);
      g.addColorStop(0,"rgba(255,230,179,.88)");g.addColorStop(.54,"rgba(255,219,154,.46)");g.addColorStop(1,"rgba(255,216,150,0)");
      pen.fillStyle=g;pen.fillRect(0,0,64,64);lightSprite=canvas;
    }
    c.globalAlpha=night*.43;
    if(lightSprite)for(const [u,v,ru,rv] of pools)c.drawImage(lightSprite,u-ru,v-rv,ru*2,rv*2);
    c.restore();c.save();c.globalAlpha=night;
    for(const [u,v,h,side] of [[7.50,8.62,5.84,1],[-7.49,-1.85,5.66,-1]])for(const z of [-.26,.26])
      stroke(c,[at(u-side*.91,h+.05,v+z-.12),at(u-side*.91,h+.05,v+z+.12)],.075,"#ffe7a8");
    c.restore();
  }
  function planCourt(c,s,game,night){
    const layer=planImage(s);
    if(layer)c.drawImage(layer,left,bottom,width,depth);else staticPlan(c,s);
    const liftX=.22*cos(s)-.27*sin(s),liftV=.22*sin(s)+.27*cos(s),at=(u,h,v)=>[u+liftX*h,v+liftV*h];
    if(night>.04)planLights(c,night,at);
    const netFlex=Math.max(0,Math.min(1,game?.net||0)),rim=at(0,3.05,0),hang=at(.045*netFlex,2.63-netFlex*.075,.053*netFlex);
    c.save();c.lineCap="round";
    for(let i=0;i<10;i++){
      const a=tau*i/10,b=tau*(i+.69)/10;
      stroke(c,[[rim[0]+.24*Math.cos(a),rim[1]+.24*Math.sin(a)],[hang[0]+.15*Math.cos(b),hang[1]+.15*Math.sin(b)]],.018,"#d7ccae");
    }
    c.beginPath();c.arc(rim[0],rim[1],.243,0,tau);c.lineWidth=.045;c.strokeStyle=colors[s.id].rim;c.stroke();c.restore();
  }
  function map(c,opt,px,py,s,visible){
    if(opt.mode==="atlas"&&(opt.countyChart||opt.marina?.bayChart))return;
    for(const site of sites){
      const x=px(site.x),y=py(site.z);
      if(!visible(x,y,opt.mode==="street"?18*s:12))continue;
      c.save();c.translate(x,y);
      if(opt.mode==="street"){
        c.rotate(site.yaw);c.scale(s,-s);
        const game=Array.isArray(opt.courts)?opt.courts.find(q=>q.site?.id===site.id):null;
        planCourt(c,site,game,opt.weather?.night||0);
      }else{
        const ui=Math.max(.70,Math.min(c.canvas.width,c.canvas.height)/(opt.mode==="radar"?165:370));
        c.scale(ui,ui);dot(c,0,0,5.9,5.9,"#354f4d");dot(c,0,0,4.04,4.04,site.id==="sol"?"#d69a70":"#c98969");
        c.beginPath();c.moveTo(-3.84,-.37);c.lineTo(3.84,.37);c.moveTo(-.5,-3.82);c.lineTo(.45,3.84);
        c.moveTo(-3.13,-2.42);c.quadraticCurveTo(.02,-1.06,2.92,-2.68);c.moveTo(-2.99,2.62);c.quadraticCurveTo(.14,1.19,3.01,2.44);
        c.lineWidth=.65;c.strokeStyle="#62564b";c.stroke();
      }
      c.restore();
    }
  }
  window.BayCourtPlaces={sites,worldPoint,local,floor,blocks,lightPools,mapPoint,project:mapPoint,install,ground,world,map};
})();
