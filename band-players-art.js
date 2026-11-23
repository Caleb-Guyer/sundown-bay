/* Players and instruments from the Sol Sound Shell. Instrument coordinates are metres. */
(() => {
  "use strict";
  const tau=2*Math.PI,mix=(a,b,f)=>a+(b-a)*f,clip=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const ease=f=>{f=clip(f);return f*f*(3-2*f);};
  const mid=(a,b,f)=>a.map((v,i)=>mix(v,b[i],f));
  const cream="#efdcad",silver="#b3b8a6",brass="#ceac69",wood="#9c684c",ink="#3c4549",cherry="#a44846";
  const wardrobe={
    june:{skin:"#dbab87",shirt:"#ddb467",pants:"#526875",hair:"#4f3731",edge:"#825643",trim:"#faf0c3",accent:"#aa4e49"},
    ben:{skin:"#bf896b",shirt:"#50867e",pants:"#424856",hair:"#3b3031",edge:"#69514b",trim:"#eacb9f",accent:"#d78d66"},
    lena:{skin:"#82543f",shirt:"#ad665d",pants:"#344e59",hair:"#332d32",edge:"#604340",trim:"#efd8a3",accent:"#70aaa1"},
    fan0:{skin:"#805745",shirt:"#c89070",pants:"#647a72",hair:"#433a37",edge:"#79624b",trim:"#dfc69e",accent:"#567167"},
    fan1:{skin:"#e1ad88",shirt:"#827da0",pants:"#657076",hair:"#a26947",edge:"#cb8c59",trim:"#d9a0a0",accent:"#e2ceb0"},
    fan2:{skin:"#a46e53",shirt:"#ceb368",pants:"#526c74",hair:"#413438",edge:"#66504a",trim:"#5e7876",accent:"#eacf99"},
    fan3:{skin:"#d0a17e",shirt:"#7199a0",pants:"#785c57",hair:"#6c5543",edge:"#97765b",trim:"#b8d0b7",accent:"#887961"}
  };
  const colors={},roles={};
  for(const [id,p] of Object.entries(wardrobe)){colors[id]=[p.skin,p.shirt,p.pants];roles[id]="local";}
  const playerWear={skin:"#af7353",shirt:"#398e86",pants:"#556d80",hair:"#302e37",edge:"#534844",trim:"#a4b698",accent:"#ddcaa1"};
  function swatch(a){
    if(wardrobe[a.id])return wardrobe[a.id];
    const j=window.BayCourtPlayers?.kits?.[a.kit];return j?{...playerWear,shirt:j.body,pants:j.short,trim:j.trim,accent:j.pale,kit:j}:playerWear;
  }
  function oct(y,w,f,b){
    return [[-.65*w,y,f],[.64*w,y,f],[w,y,.42*f],[w,y,-.59*b],[.61*w,y,-b],[-.62*w,y,-b],[-w,y,-.58*b],[-w,y,.41*f]];
  }
  function band(g,a,b,col,edge=col){
    for(let i=0;i<a.length;i++){const j=(i+1)%a.length;g.quad(a[i],a[j],b[j],b[i],i===6?edge:col,.98-.065*(i%3));}
  }
  function panel(g,pts,color,z=.125){
    for(let i=1;i<pts.length-1;i++)g.tri([pts[0][0],pts[0][1],z],[pts[i][0],pts[i][1],z],[pts[i+1][0],pts[i+1][1],z],color);
  }
  function seam(g,p,q,w,color,z=.128){
    const dx=q[0]-p[0],dy=q[1]-p[1],half=w*.5/(Math.hypot(dx,dy)||1),x=dy*half,y=-dx*half;
    panel(g,[[p[0]+x,p[1]+y],[q[0]+x,q[1]+y],[q[0]-x,q[1]-y],[p[0]-x,p[1]-y]],color,z);
  }
  function thread(g,pts,width,col,z){for(let i=1;i<pts.length;i++)seam(g,pts[i-1],pts[i],width,col,z);}
  function wire(g,pts,w,col,n=5){for(let i=1;i<pts.length;i++)g.pole(pts[i-1],pts[i],w,col,n);}
  function locks(g,id,p){
    const june=id==="june",lena=id==="lena",braids=lena||id==="fan2";
    const bob=june||id==="fan1",short=id==="ben"||id==="fan3";
    const hem=oct(short?1.652:bob?1.569:1.610,bob?.123:.112,.099,.112);
    for(let i=0;i<hem.length;i++)if(i<3||i===7)hem[i][1]+=bob?.122:.044;
    const brow=oct(1.709,bob?.119:.111,.106,.114),crown=oct(1.765,.096,.082,.101);
    band(g,hem,brow,p.hair,p.edge);band(g,brow,crown,p.hair,p.edge);
    for(let i=0;i<8;i++)g.tri(crown[i],crown[(i+1)%8],[short?.013:-.021,1.792,-.006],i>4?p.edge:p.hair);
    if(bob){
      g.tri([-.092,1.739,.102],[.035,1.739,.107],[-.076,1.672,.110],p.hair);
      for(const k of [-1,1])g.quad([k*.100,1.681,.073],[k*.114,1.690,.048],[k*.115,1.563,.033],[k*.092,1.550,.069],p.hair);
    }
    if(june||id==="fan1"){
      const lo=oct(1.703,.122,.108,.120),hi=oct(1.728,.121,.102,.120);
      band(g,lo,hi,p.accent);g.box(-.114,1.721,-.061,.051,.034,.038,p.accent,-.31);
      g.tri([-.131,1.721,-.067],[-.135,1.644,-.121],[-.106,1.716,-.093],p.accent);
      g.tri([-.126,1.713,-.076],[-.098,1.660,-.145],[-.106,1.719,-.085],p.trim);
    }
    if(braids){
      for(let i=0;i<6;i++){
        const x=(i-2.5)*.035,fall=.10+((i*11)%5)*.017;
        wire(g,[[x,1.750,-.024],[x*1.16,1.716,-.101],[x*1.12,1.643,-.125],[x*.82,1.643-fall,-.131]],.0175,i%2?p.hair:p.edge);
        if(lena&&i%2===0)g.cyl(x*.82,1.658-fall,-.131,.017,.017,.017,5,brass);
      }
    }
    if(id==="ben"||id==="fan0"){
      const news=id==="ben",lo=oct(1.718,news?.119:.150,news?.118:.157,news?.110:.158);
      const hi=oct(1.760,news?.118:.112,.108,.113);band(g,lo,hi,news?"#d8b49a":"#dfd0a9");
      const top=oct(1.790,.093,.089,.090);
      band(g,hi,top,news?"#d6a98f":"#dfcea4");for(let i=0;i<8;i++)g.tri(top[i],top[(i+1)%8],[.011,1.802,-.017],news?"#deb799":"#e6d9b2");
      if(news)g.quad([-.107,1.727,.074],[.106,1.727,.076],[.081,1.706,.157],[-.075,1.706,.159],"#866c5d");
      else band(g,oct(1.744,.124,.124,.128),oct(1.756,.120,.122,.126),p.accent);
    }
    if(lena)for(const k of [-1,1]){
      const hoop=[];for(let i=0;i<9;i++){const a=i*tau/8;hoop.push([k*(.108+.006*Math.sin(a)),1.595+.024*Math.cos(a),.029+.019*Math.sin(a)]);}
      wire(g,hoop,.0035,brass,4);
    }
  }
  function suit(g,id,p,mark){
    mark("head");locks(g,id,p);mark("body");
    if(id==="june"){
      for(const k of [-1,1]){
        panel(g,[[.009*k,1.423],[.116*k,1.415],[.161*k,1.382],[.091*k,1.328],[.018*k,1.364]],p.trim);
        thread(g,[[.023*k,1.356],[.091*k,1.321],[.161*k,1.375]],.008,p.accent,.129);
        for(let j=0;j<3;j++){const x=k*(.080+j*.017),y=1.368+j*.008;
          panel(g,[[x-.003,y],[x-.010*k,y+.015],[x+.007*k,y+.008],[x+.005,y]],"#78958a",.131);}
      }
      panel(g,[[-.062,1.428],[.067,1.428],[.006,1.330]],p.skin,.130);
      seam(g,[.002,1.328],[.002,.985],.007,"#ba8866",.127);
      for(const y of [1.027,1.116,1.21,1.307])g.box(.003,y,.132,.009,.010,.004,p.trim);
      thread(g,[[-.135,1.388],[-.071,1.347],[0,1.319],[.071,1.347],[.135,1.388]],.021,p.trim,-.119);
      thread(g,[[-.131,1.369],[0,1.297],[.131,1.369]],.006,p.accent,-.121);
    }else if(id==="ben"){
      for(const k of [-1,1]){
        panel(g,[[k*.047,1.421],[k*.124,1.409],[k*.094,1.339],[k*.026,1.373]],"#81a393");
        seam(g,[k*.095,1.335],[k*.095,1.068],.020,p.trim);
        seam(g,[k*.116,1.350],[k*.116,1.061],.007,p.accent);
      }
      panel(g,[[-.135,1.266],[-.064,1.266],[-.068,1.201],[-.105,1.191],[-.131,1.204]],"#668f80",.132);
      seam(g,[-.131,1.253],[-.071,1.253],.006,p.trim,.135);
    }else if(id==="lena"){
      for(const k of [-1,1]){
        panel(g,[[k*.065,1.417],[k*.137,1.411],[k*.124,1.287],[k*.084,1.244]],"#456c65");
        seam(g,[k*.126,1.386],[k*.109,1.283],.008,p.trim,.131);
        g.box(k*.112,1.293,.135,.045,.026,.006,brass);
      }
      panel(g,[[-.129,1.290],[.129,1.290],[.141,.970],[-.141,.970]],"#416460",.129);
      thread(g,[[-.104,1.213],[-.102,1.144],[.000,1.110],[.100,1.144],[.102,1.213]],.006,"#9ab09b",.134);
      panel(g,[[-.035,1.223],[.047,1.223],[.047,1.190],[-.035,1.190]],"#cec59e",.135);
      seam(g,[.10,1.419],[-.089,1.200],.042,"#41645d",-.117);seam(g,[-.10,1.419],[.089,1.200],.042,"#41645d",-.117);
    }else if(id==="fan1"){
      for(const k of [-1,1]){seam(g,[k*.127,1.403],[k*.117,1.224],.044,p.pants);g.box(k*.114,1.247,.129,.035,.020,.007,brass);}
      panel(g,[[-.132,1.246],[.134,1.246],[.14,.975],[-.14,.975]],p.pants,.127);
    }else if(id==="fan2"){
      for(const y of [1.065,1.128,1.191,1.254])seam(g,[-.145,y],[.146,y+.018],.020,p.trim);
    }else{
      for(const k of [-1,1])panel(g,[[k*.044,1.420],[k*.145,1.403],[k*.103,1.341],[k*.017,1.386]],p.trim);
      seam(g,[-.131,1.290],[-.062,1.290],.012,p.accent);
    }
    for(const k of [-1,1]){
      mark("arm",k);g.cyl(k*.233,1.285,0,.075,.072,id==="june"?.031:.023,8,p.trim);
      if(id==="lena"&&k===1)g.cyl(k*.240,1.054,.026,.043,.039,.035,7,"#76a296");
      if(id==="ben"&&k===-1){g.cyl(k*.235,1.047,.031,.044,.040,.018,7,"#574644");g.box(-.268,1.046,.042,.014,.023,.021,brass);}
      mark("leg",k);
      if(id==="june"||id==="lena")g.cyl(k*.111,.259,-.003,.066,.058,.040,6,id==="june"?"#7b8c91":"#697e82");
    }
  }
  function dress(r,id){
    const p=wardrobe[id];if(!p||!r||r.bandWear===id)return;
    const g=new BayMesh(),parts=[];suit(g,id,p,(name,side)=>parts.push({name,side,first:g.vertices.length/6}));
    for(let i=0;i<parts.length;i++){
      const q=parts[i],end=parts[i+1]?.first??g.vertices.length/6,l=r.sides[q.side===1?1:0];
      for(let j=q.first;j<end;j++)r.bindings.push(r.binding(q.name,l,g.vertices[j*6+1]));
    }
    const next=new Float32Array(r.rest.length+g.vertices.length);next.set(r.rest);next.set(g.vertices,r.rest.length);
    r.rest=next;r.vertices=next.slice();r.lastRevision=-1;r.bandWear=id;
  }

  // u runs from the tailpiece towards the headstock, v across the frets.
  const profiles={
    guitar:{angle:.305,front:.054,rim:"#a36d49",top:"#c78d55",back:"#805442",edge:"#e8cd99",guard:"#5b4541",length:.681,
      body:[[-.256,.046],[-.245,.123],[-.198,.177],[-.112,.197],[-.043,.173],[.030,.124],[.088,.128],[.147,.159],[.199,.146],[.232,.103],[.238,.048],[.246,-.021],[.251,-.083],[.208,-.106],[.178,-.078],[.140,-.068],[.100,-.091],[.058,-.139],[.005,-.169],[-.088,-.197],[-.181,-.183],[-.226,-.148],[-.251,-.082]]},
    bass:{angle:.371,front:.042,rim:"#466e70",top:"#6faaa2",back:"#42676b",edge:"#b9c4a6",guard:"#d8c9a6",length:.824,
      body:[[-.236,.063],[-.204,.145],[-.130,.174],[-.048,.160],[.040,.126],[.126,.132],[.236,.170],[.321,.166],[.334,.140],[.294,.111],[.228,.099],[.185,.074],[.164,.041],[.197,-.033],[.236,-.074],[.251,-.119],[.236,-.140],[.201,-.119],[.164,-.098],[.128,-.097],[.051,-.153],[-.032,-.182],[-.137,-.175],[-.223,-.101]]}
  };
  const pointOn=(p,u,v,z)=>[-u*Math.cos(p.angle)+v*Math.sin(p.angle),u*Math.sin(p.angle)+v*Math.cos(p.angle),z];
  function guitarFace(g,p,outline,z,color){
    const at=(a,b)=>pointOn(p,a,b,z);
    // Short fan strips keep the outline's two deep cutaways open.
    const center=[outline.reduce((n,v)=>n+v[0],0)/outline.length,outline.reduce((n,v)=>n+v[1],0)/outline.length];
    for(let i=0;i<outline.length;i++)g.tri(at(...center),at(...outline[i]),at(...outline[(i+1)%outline.length]),color);
  }
  function instrument(g,kind){
    const bass=kind==="bass",p=profiles[kind],top=p.front,edge=p.body.map(([u,v])=>[u*.972,v*.955]);
    const face=(outline,z,col)=>guitarFace(g,p,outline,z,col),at=(u,v,z)=>pointOn(p,u,v,z);
    const plate=(lo,hi,b,w,z,col)=>face([[lo,-b],[lo,b],[hi,w],[hi,-w]],z,col);
    const line=(pts,w,col)=>wire(g,pts.map(([u,v,z])=>at(u,v,z)),w,col,4);
    for(let i=0;i<p.body.length;i++){
      const a=p.body[i],b=p.body[(i+1)%p.body.length];
      g.quad(at(...a,-top),at(...b,-top),at(...b,top*.80),at(...a,top*.80),p.rim);
      g.quad(at(...a,top*.80),at(...b,top*.80),at(...b,top),at(...a,top),p.edge);
      g.quad(at(...a,top),at(...b,top),at(...edge[(i+1)%edge.length],top+.003),at(...edge[i],top+.003),p.edge);
    }
    face(edge,top+.003,p.top);face(p.body,-top,p.back);
    const nut=p.length-.119;
    face([[.135,-.040],[.135,.040],[nut,.026],[nut,-.025]],top+.014,"#4e403c");
    for(const k of [-1,1])g.quad(at(.13,k*.040,-.012),at(nut,k*.026,.005),at(nut,k*.026,top+.015),at(.13,k*.040,top+.015),"#b48c66");
    face([[nut,-.026],[nut+.014,-.039],[p.length-.023,bass?-.049:-.044],[p.length,-.016],[p.length-.010,.038],[nut+.038,bass?.050:.043],[nut,.026]],top+.010,bass?"#cda87a":"#724c43");
    const saddle=-.098;
    for(let fret=1;fret<=(bass?15:12);fret++){
      const n=nut-(nut-saddle)*(1-Math.pow(.944,fret));const v=.026+.013*(nut-n)/(nut-.138);
      line([[n,-v,top+.018],[n,v,top+.018]],.0019,silver);
      if(fret===3||fret===5||fret===7||fret===9||fret===12)face([[n+.008,0],[n+.013,.005],[n+.018,0],[n+.013,-.005]],top+.019,p.edge);
    }
    if(bass){
      face([[-.107,-.104],[-.046,-.135],[.073,-.108],[.135,-.072],[.166,-.029],[.146,.031],[.092,.081],[-.042,.050],[-.097,.006]],top+.010,p.guard);
      plate(-.016,.014,.050,.050,top+.020,ink);plate(.018,.050,.053,.051,top+.020,ink);
    }else{
      for(const k of [-1,1]){
        const vv=u=>k*u;
        line([[.089,vv(.113),top+.009],[.069,vv(.108),top+.009],[.048,vv(.125),top+.009],[.014,vv(.121),top+.009],[-.034,vv(.111),top+.009],[-.041,vv(.119),top+.009]],.0051,"#644a3d");
      }
      face([[-.031,-.045],[-.010,-.104],[.066,-.105],[.128,-.070],[.131,-.044]],top+.010,p.guard);
      plate(.076,.106,.044,.044,top+.022,ink);plate(.081,.100,.040,.040,top+.025,silver);
    }
    plate(saddle-.020,saddle+.013,.053,.052,top+.020,silver);
    const count=bass?4:6;for(let i=0;i<count;i++){
      const v=(i-(count-1)*.5)*(bass?.012:.0078);
      line([[saddle-.014,v*1.18,top+.027],[nut,v*.75,top+.025]],bass?.0016:.0011,"#d2cbb4");
      const k=bass?1:i%2?1:-1,j=bass?i:Math.floor(i/2),u=nut+.029+j*(bass?.024:.029);
      line([[u,k*.025,top+.016],[u,k*.056,top+.016]],.0048,silver);
      line([[u-.008,k*.056,top+.016],[u+.009,k*.057,top+.016]],.006,p.edge);
    }
    for(const [u,v] of [[-.080,-.102],[-.103,-.133]]){const c=at(u,v,top+.015);g.pole(c,[c[0],c[1],c[2]+.016],.012,bass?ink:brass,7);}
    // Braided strap, folded over the left shoulder and back down to the tail button.
    const strap=[[.02,.015,-top],[-.149,.263,-.109],[-.259,.315,-.171],[-.265,.298,-.285],[-.044,.032,-.308],[.209,-.086,-.273],[.276,-.019,-.101]];
    for(let i=1;i<strap.length;i++){
      const a=strap[i-1],b=strap[i];g.quad([a[0]-.018,a[1],a[2]],[a[0]+.018,a[1],a[2]],[b[0]+.018,b[1],b[2]],[b[0]-.018,b[1],b[2]],bass?"#a67d58":"#8d6555");
    }
  }
  const caseOutline=[[-.343,-.157],[-.329,-.233],[-.272,-.263],[-.084,-.262],[.009,-.219],[.171,-.193],[.347,-.179],[.374,-.153],[.373,-.083],[.349,-.071],[.171,-.083],[.042,-.084],[-.003,-.060],[-.068,-.031],[-.239,-.037],[-.309,-.066]];
  function roadCase(g){
    // The handle is at the actor's palm. The case travels upright alongside the knee.
    const ring=(side,w)=>caseOutline.map(([z,y])=>[side*w,y,z]);
    const left=ring(-1,.057),right=ring(1,.057);band(g,left,right,"#59665e","#718077");
    for(const side of [-1,1]){
      const edge=ring(side,.059),inner=caseOutline.map(([z,y])=>[side*.063,(y+.151)*.932-.151,z*.968]);
      band(g,edge,inner,"#a29477");
      for(let i=0;i<inner.length;i++)g.tri([side*.063,-.152,-.027],inner[i],inner[(i+1)%inner.length],side>0?"#54716b":"#516861");
      for(const z of [-.223,.100,.277])g.box(side*.060,-.082,z,.009,.029,.023,brass);
      g.quad([side*.064,-.105,-.218],[side*.064,-.098,-.092],[side*.064,-.175,-.085],[side*.064,-.180,-.214],"#d3bc93");
      for(const z of [-.179,-.158,-.137])g.pole([side*.065,-.158,z],[side*.065,-.125,z+.015],.004,"#8c6261",4);
    }
    wire(g,[[0,-.058,-.066],[0,-.004,-.060],[0,.005,-.041],[0,.005,.036],[0,-.008,.050],[0,-.074,.052]],.009,"#594b40",6);
    for(let i=0;i<g.vertices.length;i+=6){g.vertices[i+1]*=1.52;g.vertices[i+2]*=1.41;}
  }
  function install(model){
    model("shell-band/guitar",g=>instrument(g,"guitar"));model("shell-band/bass",g=>instrument(g,"bass"));
    model("shell-band/case",roadCase);
    model("shell-band/stick",g=>{
      g.pole([0,0,-.083],[0,0,.238],.0072,"#dfb982",6);
      g.pole([0,0,.236],[0,0,.295],.0047,"#e4c693",6);
      g.pole([0,0,.294],[0,0,.306],.0062,"#ead0a5",6);
    });
    model("shell-band/cabasa",g=>{
      g.pole([0,0,-.066],[0,0,.135],.0180,wood,8);
      g.pole([0,0,.082],[0,0,.175],.059,"#967e60",12);
      for(let i=0;i<7;i++){const z=.091+i*.011;g.pole([0,0,z],[0,0,z+.006],.063,i%2?silver:"#c6c6ad",12);}
      g.pole([0,0,.173],[0,0,.182],.061,wood,12);
    });
  }

  function joint(l,arm,goal,pole){
    const a=arm?l.shoulder:l.hip,k=arm?l.elbow:l.knee,b=arm?l.hand:l.ankle;
    const first=arm?l.arm:l.thigh,second=arm?l.forearm:l.shin;
    const dx=goal[0]-a[0],dy=goal[1]-a[1],dz=goal[2]-a[2],length=Math.hypot(dx,dy,dz)||.001;
    const x=dx/length,y=dy/length,z=dz/length,D=clip(length,.035,first.length+second.length-.0001);
    b[0]=a[0]+x*D;b[1]=a[1]+y*D;b[2]=a[2]+z*D;
    const along=(first.length**2-second.length**2+D*D)/(2*D),height=Math.sqrt(Math.max(0,first.length**2-along**2));
    const dot=pole[0]*x+pole[1]*y+pole[2]*z,ex=pole[0]-dot*x,ey=pole[1]-dot*y,ez=pole[2]-dot*z,scale=height/(Math.hypot(ex,ey,ez)||.001);
    k[0]=a[0]+along*x+scale*ex;k[1]=a[1]+along*y+scale*ey;k[2]=a[2]+along*z+scale*ez;
    first.aim(a,k);second.aim(k,b);
  }
  const grip=(l)=>l.forearm.map([l.side*.238,.977,.052],[]);
  function palmAt(l,dest,weight=1){
    const target=weight<1?mid(grip(l),dest,weight):dest,pole=[l.side*.69,-.64,-.44];
    for(let j=0;j<3;j++){
      const tip=grip(l),w=l.forearm.map(l.handPivot,[]);
      joint(l,true,w.map((v,i)=>v+target[i]-tip[i]),pole);
    }
  }
  const turnPoint=(q,yaw,pitch,roll)=>{
    const c=Math.cos(pitch),s=Math.sin(pitch),rc=Math.cos(roll),rs=Math.sin(roll);
    const ry=q[1]*c-q[2]*s,rz=q[1]*s+q[2]*c,rx=q[0]*rc-ry*rs,up=q[0]*rs+ry*rc;
    return [rx*Math.cos(yaw)+rz*Math.sin(yaw),up,-rx*Math.sin(yaw)+rz*Math.cos(yaw)];
  };
  const pack=(type,at,yaw=0,pitch=0,roll=0)=>({type,at,yaw,pitch,roll});
  function attached(f,p){const w=turnPoint(p,f.yaw,f.pitch,f.roll);return w.map((v,i)=>v+f.at[i]);}
  function world(a,p){
    const yaw=a.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
    return [a.x+p[0]*c+p[2]*s,(a.y||0)+(a.motion?.lift||0)+p[1],a.z-p[0]*s+p[2]*c];
  }
  const localPads=[ [.17,.047,.37],[-.08,.82,.46],[-.49,1.015,.46] ];
  function pad(i){
    const k=window.BaySoundShell?.kit,q=k?.pads?.[i];if(!q)return localPads[i];
    const c=Math.cos(k.yaw),s=Math.sin(k.yaw),x=q.x-k.x,z=q.z-k.z;
    return [c*x-s*z,q.y-k.y,s*x+c*z];
  }
  function body(r,hip,lean,twist,roll,headTurn,headRoll){
    r.pelvis.place(hip,lean*.16,twist*.35,roll*.56);
    r.pelvis.map(r.chest.pivot,r.pivot);r.chest.place(r.pivot,lean,twist,roll);
    r.chest.map(r.head.pivot,r.pivot);r.head.place(r.pivot,lean*.56,headTurn,headRoll);
    for(const l of r.sides){r.pelvis.map(l.thigh.pivot,l.hip);r.chest.map(l.arm.pivot,l.shoulder);}
  }
  function leg(l,ankle,pitch=0,yaw=0){
    joint(l,false,ankle,[l.side*.095,.10,1]);l.shoe.place(l.ankle,pitch,yaw);
  }
  function groove(beat){
    const phase=beat*tau;
    return {pulse:(1-Math.cos(phase))*.5,sway:Math.sin(phase*.5),swing:Math.cos(phase*.5),riff:Math.sin(phase*.25)};
  }
  function since(band,i){
    const age=band?.strikes?.[i];if(typeof age==="number")return Math.max(0,age);
    const b=band?.beat||0,period=i===2?.5:2,offset=i===1?1:0;
    return ((b-offset)%period+period)%period*.59;
  }
  const padTimes=new WeakMap();
  function approach(band,i,beat){
    const song=band?.song;if(!song?.pattern||beat<0)return 1;
    let cues=padTimes.get(song);if(!cues){cues=[[],[],[]];for(const n of song.pattern)cues[n.pad].push(n.at);padTimes.set(song,cues);}
    const notes=cues[i];if(!notes.length)return 1;
    let lo=0,hi=notes.length;while(lo<hi){const k=(lo+hi)>>1;if(notes[k]<beat-.001)lo=k+1;else hi=k;}
    const next=lo<notes.length?notes[lo]:notes[0]+song.bars*4;
    const seconds=(next-beat)*60/song.bpm;
    // Prepare early enough that a well-timed tap meets the head in a single small wrist motion.
    return mix(band.playing ? .36 : 0,1,ease(seconds/.117));
  }
  function playDrums(r,a,band,beat,handheld){
    const j=ease(a.join??1),g=groove(beat),kick=since(band,0);
    const pedal=Number.isFinite(kick)?Math.exp(-kick/.105):0;
    const footLift=(1-pedal)*approach(band,0,beat);
    body(r,[.011*g.sway*j,mix(.951,.601+.009*g.pulse-.007*pedal,j),mix(0,-.022,j)],
      .093*j+.047*pedal,.061*g.sway*j,.024*g.sway*j,.04*g.sway,.021*g.riff);
    const target=pad(0);
    for(const l of r.sides){
      const right=l.side===1;
      const heel=right ? .008+.061*footLift : .006+.014*g.pulse,pitch=right ? .045+.22*(1-footLift) : -.071;
      // Put the sole, rather than the ankle, on the bass pedal at the downbeat.
      const sole=turnPoint([0,-.153,.136],0,pitch,0);
      const ankle=right?[target[0],target[1]-sole[1]+heel-.008,target[2]-sole[2]]:[-.180,.164+heel,.267];
      leg(l,mid([l.side*.12,.169,l.side*.026],ankle,j),pitch*j);
      const index=right?1:2,hit=since(band,index),lift=1-Math.exp(-hit/.100),rebound=Number.isFinite(hit)?Math.sin(Math.PI*clip(hit/.185))*.113:0;
      const q=pad(index);
      const prep=approach(band,index,beat);
      const tip=[q[0]+l.side*.031*lift*prep,q[1]+(lift*(right?.132:.100)+rebound)*prep,q[2]-lift*.045*prep];
      const vector=right?[-.443,-.417,.794]:[-.346,-.295,.891],n=Math.hypot(...vector);
      const wanting=tip.map((v,i)=>v-.306*vector[i]/n);
      const standing=[l.side*.244,1.013,.063];
      palmAt(l,mid(standing,wanting,j));const actual=grip(l);
      const dir=tip.map((v,i)=>v-actual[i]);let yaw=Math.atan2(dir[0],dir[2]),tilt=-Math.atan2(dir[1],Math.hypot(dir[0],dir[2]));
      if(j<1){yaw=mix(l.side*.18,yaw,j);tilt=mix(.44,tilt,j);}
      handheld.push(pack("stick",actual,yaw,tilt));
    }
  }
  const fingering=new WeakMap();
  function preparePicks(part,notes){
    const bass=part==="bass",tuning=bass?[28,33,38,43]:[40,45,50,55,59,64];
    const nut=profiles[part].length-.119,scale=bass?.81:.635,picks=[];
    for(const n of notes){
      if(bass?n.kind!=="bass":n.kind!=="grip"&&n.kind!=="line")continue;
      if(picks.length&&picks[picks.length-1].at===n.at)continue;
      const pitch=n.notes?.[0]??n.note;
      let fret=0,string=0,best=Infinity;
      for(let i=0;i<tuning.length;i++){
        const semitones=pitch-tuning[i],distance=Math.abs(semitones-5);
        if(semitones>=0&&distance<best){fret=semitones;string=i;best=distance;}
      }
      // A fret's distance from the nut follows the vibrating length of the string.
      const u=clip(nut-scale*(1-Math.pow(.5,(fret+.45)/12)),.28,nut-.018);
      const sign=(n.kind==="grip"?n.up:picks.length%2===1)?1:-1;
      picks.push({at:n.at,u,v:(string-(tuning.length-1)*.5)*.013,stroke:sign*(bass?.020:n.kind==="grip"?.066:.026)*(n.velocity||1)});
    }
    return picks;
  }
  function stringAt(song,part,beat){
    if(!song?.accompaniment?.length)return null;
    let parts=fingering.get(song);
    if(!parts){parts={guitar:preparePicks("guitar",song.accompaniment),bass:preparePicks("bass",song.accompaniment)};fingering.set(song,parts);}
    const notes=parts[part];if(!notes.length)return null;
    if(beat<0)return {fret:notes[0].u,string:notes[0].v,pick:-notes[0].stroke};
    const length=song.bars*4,clock=beat%length,sec=60/song.bpm;
    let lo=0,hi=notes.length;
    while(lo<hi){const m=(lo+hi)>>1;if(notes[m].at<=clock)lo=m+1;else hi=m;}
    const prev=notes[(lo+notes.length-1)%notes.length],next=notes[lo%notes.length];
    const after=(clock-prev.at+(lo===0?length:0))*sec,before=(next.at-clock+(lo===notes.length?length:0))*sec;
    const change=ease(1-before/.12),rebound=prev.stroke*ease(after/.070),prep=-next.stroke*ease(before/.059);
    return {fret:mix(prev.u,next.u,change),string:mix(prev.v,next.v,change),pick:mix(rebound,prep,ease(1-before/.139))};
  }
  function playStrings(r,a,band,beat,model){
    const bass=a.work==="bass",p=profiles[a.work],g=groove(beat);
    const hip=[g.sway*(bass?.039:.019),.917+(bass?.018:.012)*g.pulse,bass?-.016:-.046];
    body(r,hip,.052+.018*g.pulse,.047*g.sway,g.sway*.034,bass?-.075+.13*g.riff:.06*g.riff,(bass?-.05:-.016)+g.sway*.027);
    for(const l of r.sides)leg(l,[l.side*(bass?.177:.141),.169+.014*(l.side===1?g.pulse:0),l.side*(bass?-.088:.060)],.035*g.pulse,l.side*.083);
    const frame=pack(a.work,[hip[0]+(bass?.103:.075),hip[1]+(bass?.198:.188),.184+hip[2]*.22],
      .092+.030*g.sway,bass?-.165:-.154,(bass?.032:.020)*g.swing);
    const note=stringAt(band?.song,a.work,beat);
    const fret=note?.fret??(.404+.035*g.riff),string=note?.string??(.008*g.swing);
    const pick=note?.pick??(Math.sin(beat*tau)*(bass?.018:.057));
    const left=attached(frame,pointOn(p,fret,string-.017,p.front+.047));
    const right=attached(frame,pointOn(p,bass?.03:.006,pick+(bass?string:0),p.front+.022));
    palmAt(r.sides[0],left);palmAt(r.sides[1],right);model.push(frame);
  }
  function crowdDance(r,a,beat){
    const id=Number(a.id.slice(-1))||0,k=id*.63,b=beat+k,g=groove(b),power=a.work==="clap"?.66:.91;
    const rocking=(id%2?-.068:.068)*g.sway,drop=.023*g.pulse*power;
    body(r,[rocking,.926-drop,-.006+.015*g.swing],.044+.025*g.pulse,.12*g.sway,-rocking*.60,.16*g.riff+.02,.049*g.sway);
    for(const l of r.sides){
      const f=Math.max(0,l.side*g.sway);leg(l,[l.side*.160,.168+.038*f,l.side*.067+.024*f],.13*f,l.side*.1);
      if(a.work==="clap"){
        const closed=Math.pow(.5+.5*Math.cos(b*Math.PI),3),lift=id===3?.16:0;
        palmAt(l,[l.side*(.031+.235*(1-closed)),1.36+lift+.045*g.swing,.23+.061*closed]);
      }else{
        const elbowBounce=l.side*g.sway;
        const y=id===1?1.47+elbowBounce*.11:1.17+.074*elbowBounce;
        palmAt(l,[l.side*(.285+.045*g.swing),y,.115+.095*g.sway*l.side]);
      }
    }
  }
  function shaker(r,beat,props){
    const g=groove(beat),p=Math.sin(beat*tau*2),s=.5+.5*Math.sin(beat*tau);
    body(r,[g.sway*.027,.924+.018*g.pulse,-.014],.071,-.12+.054*g.sway,-.026*g.sway,.07*g.riff,.035*g.sway);
    for(const l of r.sides)leg(l,[l.side*.155,.169+.026*(l.side===1?g.pulse:0),l.side*.055],.06*g.pulse,l.side*.099);
    const left=[-.137,1.237+.036*s,.237],right=[.107,1.295+.037*p,.210+.048*Math.cos(beat*tau*2)];
    palmAt(r.sides[0],left);palmAt(r.sides[1],right);
    const q=grip(r.sides[1]);props.push(pack("cabasa",q,-1.12,-.19+.22*p));
  }
  function carry(r,a,items,t){
    const motion=a.motion,ride=motion.ride,seat=ride?.seat||0;
    const side=ride?.side===-1?1:-1,l=r.sides[side<0?0:1],stride=Math.cos(motion.phase*tau);
    if(!ride)palmAt(l,[side*(.283+.010*motion.weight),.966+.029*motion.weight,.049+.076*stride*motion.weight],.96);
    const hand=grip(l),settle=ease((seat-.26)/.67);
    const rotate=(ride?0:motion.weight*stride*.092)+.060-.19*settle;
    const f=pack("case",hand,side*.055+side*.82*settle,rotate,-side*.049+side*.96*settle);items.push(f);
    return !ride;
  }
  const posed=new WeakMap(),actors=new WeakMap(),fallback=new WeakMap(),empty=[];
  function state(r,a,t,b){
    const motion=a.motion;if(!motion)return null;
    let was=posed.get(r),beat=Number.isFinite(b?.beat)?b.beat:t*1.65;
    const key=a.work||"",ride=motion.ride;
    const struck=b?.strikes;
    if(was&&was.actor===a&&was.motion===motion&&was.rev===motion.revision&&was.key===key&&was.join===a.join&&was.t===t&&was.beat===beat&&was.kick===struck?.[0]&&was.snare===struck?.[1]&&was.hat===struck?.[2])return was;
    if(!was){was={items:[]};posed.set(r,was);}
    if(was.motion!==motion||r.lastRevision===motion.revision&&was.rev===motion.revision)r.lastRevision=-1;
    r.update(motion);was.items.length=0;let moved=false;
    if(!ride&&key==="kit"){playDrums(r,a,b,beat,was.items);moved=true;}
    else if(!ride&&(key==="guitar"||key==="bass")){playStrings(r,a,b,beat,was.items);moved=true;}
    else if(!ride&&key==="shaker"){shaker(r,beat,was.items);moved=true;}
    else if(!ride&&(key==="dance"||key==="clap")){crowdDance(r,a,beat);moved=true;}
    else if(a.id==="june"&&(key==="case"||key==="carry"))moved=carry(r,a,was.items,t);
    if(moved)r.skin();
    const changed=moved||!!was.layered;
    Object.assign(was,{actor:a,motion,rev:motion.revision,key,join:a.join,t,beat,kick:struck?.[0],snare:struck?.[1],hat:struck?.[2],changed,layered:moved});
    return was;
  }
  function pose(r,a,t=0,band){
    if(!r||!a?.motion)return false;actors.set(a,r);return state(r,a,t,band)?.changed||false;
  }
  function skeleton(a,t,b){
    const native=actors.get(a),m=a.motion;if(!m)return null;
    if(native&&posed.get(native)?.motion===m){state(native,a,t,b);return native;}
    let r=fallback.get(m);
    if(!r){r=new BayPlayerMesh(colors[a.id]||[playerWear.skin,playerWear.shirt,playerWear.pants],"local");
      r.bindings.length=0;r.rest=r.vertices=new Float32Array(0);fallback.set(m,r);}
    state(r,a,t,b);return r;
  }
  function props(list,a,t=0,b){
    if(!a?.motion)return;const r=skeleton(a,t,b);if(!r)return;
    for(const f of posed.get(r)?.items||empty){
      const p=world(a,f.at);list.push(["shell-band/"+f.type,p[0],p[1],p[2],a.yaw+f.yaw,f.pitch,f.roll]);
    }
  }
  const chestArt=new Map(),stampWidth=100,stampHeight=130;
  function shirtPrint(id,kit){
    const key=wardrobe[id]?id:(kit==="sol"||kit==="mercado"?kit:"player");
    if(chestArt.has(key))return chestArt.get(key);
    const r=new BayPlayerMesh(colors[id]||[playerWear.skin,playerWear.shirt,playerWear.pants],wardrobe[id]?"local":"driver");
    if(wardrobe[id])dress(r,id);else if(key!=="player")window.BayCourtPlayers?.kit(r,key);
    const faces={},src=r.rest;
    for(const side of [-1,1]){
      const canvas=document.createElement("canvas");canvas.width=stampWidth;canvas.height=stampHeight;
      const c=canvas.getContext("2d"),items=[];
      for(let i=0;i<src.length;i+=18){
        let skin=true,d=0;for(let j=0;j<3;j++){
          const k=i+j*6;if(src[k+2]*side<.097||src[k+2]*side>.148||src[k+1]<.951||src[k+1]>1.436||Math.abs(src[k])>.18){skin=false;break;}
          d+=src[k+2]*side;
        }if(skin)items.push([i,d]);
      }
      items.sort((a,b)=>a[1]-b[1]);for(const [i] of items){
        const x=j=>stampWidth*(.5+src[j]/.34),y=j=>stampHeight*(1.431-src[j+1])/.476;
        const col=(clip(Math.round(src[i+3]*255),0,255)<<16)|(clip(Math.round(src[i+4]*255),0,255)<<8)|clip(Math.round(src[i+5]*255),0,255);
        c.fillStyle="#"+col.toString(16).padStart(6,"0");c.beginPath();c.moveTo(x(i),y(i));c.lineTo(x(i+6),y(i+6));c.lineTo(x(i+12),y(i+12));c.closePath();c.fill();
      }faces[side]=canvas;
    }chestArt.set(key,faces);return faces;
  }
  function mapCabin(c,a,car){
    const q=bayCarLayout(car.kind),front=car.kind==="van"?-1.59:-1.10,x=q.seatX,z=front+.413;
    c.save();c.translate(car.x-a.x,a.z-car.z);c.rotate(car.yaw||0);
    c.beginPath();c.moveTo(-.78,front);c.lineTo(.78,front);c.lineTo(.65,front+.54);c.lineTo(-.65,front+.54);c.closePath();c.clip();
    function blob(v,h,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(v,h,rx,ry,0,0,tau);c.fill();}
    blob(x,z+.081,.194,.114,wardrobe.june.shirt);
    if(a.work==="case"||a.work==="carry"){
      c.strokeStyle="#547069";c.lineWidth=.084;c.lineCap="round";c.beginPath();c.moveTo(x-.207,z-.054);c.lineTo(x+.15,z+.103);c.stroke();
      c.strokeStyle=brass;c.lineWidth=.017;c.beginPath();c.moveTo(x+.075,z+.036);c.lineTo(x+.058,z+.074);c.stroke();
    }
    blob(x,z+.006,.108,.108,wardrobe.june.skin);blob(x,z+.046,.113,.101,wardrobe.june.hair);
    c.strokeStyle=wardrobe.june.accent;c.lineWidth=.027;c.beginPath();c.moveTo(x-.106,z+.032);c.lineTo(x+.094,z+.050);c.stroke();c.restore();
  }
  function mapActor(c,a,x,y,s,t=0,b){
    if(!a?.motion||!Number.isFinite(s)||s<=0)return;
    const ride=a.motion.ride,vehicle=[a.ride,a.car,a.vehicle].find(v=>v?.kind);
    c.save();c.translate(x,y);c.scale(s,s);
    if(ride?.seat>=.95&&vehicle){mapCabin(c,a,vehicle);c.restore();return;}
    if(ride&&vehicle){
      const matrix=c.getTransform();c.translate(vehicle.x-a.x,a.z-vehicle.z);c.rotate(vehicle.yaw||0);
      const shape=bayCarLayout(vehicle.kind),X=shape.track*.91,F=vehicle.kind==="van"?1.59:1.10,R=shape.halfLength-.15;
      c.beginPath();c.rect(-24,-24,48,48);c.moveTo(-X,-F);c.lineTo(X,-F);c.lineTo(X,R);c.lineTo(-X,R);c.closePath();
      c.clip("evenodd");c.setTransform(matrix);
    }
    const r=skeleton(a,t,b);if(!r){c.restore();return;}
    const p=swatch(a),yaw=a.yaw||0,cs=Math.cos(yaw),sn=Math.sin(yaw);
    const atStage=Math.abs(a.x-187)<13&&Math.abs(a.z-83)<13;
    const base=a.motion.lift+(atStage?(a.y||0):0),sx=.22,sz=.27;
    const P=q=>[q[0]*cs+q[2]*sn+(q[1]+base)*sx,q[0]*sn-q[2]*cs-(q[1]+base)*sz];
    const D=q=>q[1]-sx*(q[0]*cs+q[2]*sn)-sz*(-q[0]*sn+q[2]*cs);
    const blobs=(q,rx,ry,color,rotation=0)=>{const [u,v]=P(q);c.fillStyle=color;c.beginPath();c.ellipse(u,v,rx,ry,rotation,0,tau);c.fill();};
    function path(points,col,w=0){
      c.beginPath();const start=P(points[0]);c.moveTo(start[0],start[1]);
      for(let j=1;j<points.length;j++){const q=P(points[j]);c.lineTo(q[0],q[1]);}
      if(w){c.lineWidth=w;c.strokeStyle=col;c.stroke();}else{c.closePath();c.fillStyle=col;c.fill();}
    }
    c.lineCap="round";c.lineJoin="round";
    const part=(bone,v,h,z)=>bone.map([v,h,z],[]),ch=(v,h,z)=>part(r.chest,v,h,z),head=(v,h,z)=>part(r.head,v,h,z);
    const order=[],layer=(depth,fn)=>order.push([depth,fn]);
    blobs([-.086,.008,-.054],.248,.155,"rgba(44,51,52,.23)",-.27-yaw);
    for(const l of r.sides){
      const k=l.side,Shoe=(v,h,z)=>part(l.shoe,k*.111+v,h,z),from=Shoe(0,.077,-.068),to=Shoe(0,.055,.127),palm=grip(l);
      layer(D(l.knee),()=>{
        path([from,to],"#5b5c52",.127);path([from,to],"#b1a78a",.101);
        path([l.hip,l.knee],p.pants,.162);
        if(p.kit){path([mid(l.hip,l.knee,.49),l.knee,l.ankle],p.skin,.112);path([l.ankle,mid(l.ankle,l.knee,.40)],p.kit.pale,.106);}
        else {path([l.knee,l.ankle],p.pants,.116);if(a.id==="june"||a.id==="lena")path([mid(l.knee,l.ankle,.70),mid(l.knee,l.ankle,.83)],p.edge,.121);}
      });
      layer(D(mid(l.shoulder,l.elbow,.39)),()=>{
        path([l.shoulder,l.elbow],p.skin,.108);
        if(!p.kit){path([l.shoulder,mid(l.shoulder,l.elbow,.64)],p.shirt,.143);path([mid(l.shoulder,l.elbow,.57),mid(l.shoulder,l.elbow,.65)],p.trim,.136);}
      });
      layer(D(mid(l.elbow,palm,.57))+(a.work==="bass"||a.work==="guitar"?.205:.03),()=>{
        path([l.elbow,palm],p.skin,.083);blobs(palm,.043,.040,p.skin);
        if(a.id==="lena"&&k>0||a.id==="ben"&&k<0)path([mid(l.elbow,palm,.72),mid(l.elbow,palm,.81)],a.id==="lena"?p.accent:brass,.090);
      });
    }
    const nearSide=sn*sx+cs*sz<0?1:-1,sideZ=nearSide*.120;
    layer(D(ch(0,1.195,.002)),()=>{
      path([ch(-.19,1.40,-.069),ch(.19,1.40,-.069),ch(.207,1.407,.027),ch(.168,1.378,.106),ch(.143,.965,.103),ch(-.137,.965,.103),ch(-.176,1.380,.108),ch(-.207,1.409,.028)],p.shirt);
      const pts=[ch(-.169,1.428,sideZ),ch(.169,1.428,sideZ),ch(-.169,.967,sideZ)].map(P);
      if(s>9){const stamp=shirtPrint(a.id,a.kit)[nearSide],[origin,u,v]=pts;
        c.save();c.transform((u[0]-origin[0])/stampWidth,(u[1]-origin[1])/stampWidth,(v[0]-origin[0])/stampHeight,(v[1]-origin[1])/stampHeight,origin[0],origin[1]);c.drawImage(stamp,0,0);c.restore();}
    });
    layer(D(head(0,1.683,0)),()=>{
      blobs(head(0,1.658,.018),.113,.108,p.skin,yaw);
      blobs(head(0,1.727,-.005),a.id==="june"?.124:.109,.113,p.hair,yaw);
      const thick=a.id==="june"||a.id==="fan1";
      if(thick){
        for(const k of [-1,1])path([head(k*.088,1.732,.035),head(k*.113,1.666,.010),head(k*.112,1.570,-.037)],p.hair,.055);
        path([head(-.113,1.710,-.048),head(-.113,1.720,.053),head(-.062,1.726,.102),head(.060,1.728,.101),head(.116,1.718,.038)],p.accent,.027);
        path([head(-.112,1.715,-.044),head(-.137,1.657,-.110)],p.accent,.027);
      }
      if(a.id==="lena"||a.id==="fan2")for(let i=0;i<5;i++){const v=(i-2)*.042;
        path([head(v,1.745,-.039),head(v,1.680,-.116),head(v*.83,1.521-(i%2)*.052,-.128)],i%2?p.hair:p.edge,.034);}
      if(a.id==="ben"||a.id==="fan0"){
        const news=a.id==="ben";blobs(head(0,1.749,news?.045:0),news?.127:.159,news?.144:.155,news?"#937968":"#c2ad8b",yaw);
        blobs(head(0,1.773,-.002),.115,news?.119:.108,news?"#d7b096":"#ded3aa",yaw);
      }
    });
    function instrumentMap(f){
      const bass=f.type==="bass",g=profiles[f.type],a=(u,v,z)=>attached(f,pointOn(g,u,v,z)),top=g.front;
      path(g.body.map(([u,v])=>a(u,v,-top)),g.back);
      path(g.body.map(([u,v])=>a(u,v,top)),g.edge);path(g.body.map(([u,v])=>a(u*.968,v*.94,top+.002)),g.top);
      path([a(.14,-.039,top+.008),a(.14,.039,top+.008),a(g.length-.113,.026,top+.014),a(g.length-.113,-.026,top+.014)],"#57423a");
      path([a(g.length-.124,-.024,top+.012),a(g.length-.090,-.048,top+.012),a(g.length,-.019,top+.012),a(g.length-.006,.034,top+.012),a(g.length-.083,.047,top+.012),a(g.length-.124,.024,top+.012)],bass?"#c4a477":"#79554a");
      if(bass)path([a(-.103,-.093,top+.006),a(-.036,-.135,top+.006),a(.125,-.075,top+.006),a(.156,.018,top+.006),a(.056,.060,top+.006),a(-.083,.022,top+.006)],g.guard);
      else for(const k of [-1,1])path([a(.096,k*.109,top+.009),a(.060,k*.109,top+.009),a(.043,k*.125,top+.009),a(-.036,k*.113,top+.009)],"#6b4938",.009);
      path([a(-.102,-.045,top+.025),a(-.102,.045,top+.025)],silver,.019);
      path([a(bass?.025:.089,-.045,top+.025),a(bass?.025:.089,.045,top+.025)],ink,.020);
      if(s>12){for(let i=0;i<(bass?4:3);i++){
        const k=(i-(bass?1.5:1))*.016;
        path([a(-.118,k,top+.03),a(g.length-.125,k*.64,top+.027)],"#d0bd99",.0035);
      }}
    }
    for(const f of posed.get(r)?.items||empty){
      const at=(x,y,z)=>attached(f,[x,y,z]);
      if(f.type==="guitar"||f.type==="bass")layer(D(f.at)+.100,()=>instrumentMap(f));
      else if(f.type==="case")layer(D(f.at)-.18,()=>{
        const on=(x,y,z)=>at(x,y*1.52,z*1.41);
        const near=D(on(.059,-.14,0))>D(on(-.059,-.14,0))?1:-1;
        const face=side=>caseOutline.map(([z,y])=>on(side*.059,y,z));
        const back=face(-near),front=face(near);
        path(back,"#53645d");
        for(let i=0;i<back.length;i++){const j=(i+1)%back.length;path([back[i],back[j],front[j],front[i]],i<8?"#50605b":"#768273");}
        path(front,"#a3977c");path(caseOutline.map(([z,y])=>on(near*.062,(y+.15)*.91-.15,z*.962)),"#54726b");
        path([on(0,-.058,-.066),on(0,.001,-.056),on(0,.006,.036),on(0,-.074,.052)],"#57483e",.019);
        path([on(near*.064,-.103,-.217),on(near*.064,-.098,-.092),on(near*.064,-.169,-.089),on(near*.064,-.176,-.214)],"#d4bd96");
        if(s>15)for(const z of [-.223,.10,.277])path([on(near*.051,-.087,z),on(near*.063,-.106,z)],brass,.014);
      });
      else if(f.type==="stick")layer(D(f.at)+.126,()=>{
        path([at(0,0,-.081),at(0,0,.294)],"#b68a61",Math.max(.014,.75/s));
        path([at(0,0,-.067),at(0,0,.304)],"#e9cea0",Math.max(.008,.43/s));blobs(at(0,0,.302),.009,.007,"#e8c799");
      });
      else layer(D(f.at)+.078,()=>{
        path([at(0,0,-.063),at(0,0,.104)],wood,.036);
        path([at(0,0,.085),at(0,0,.176)],"#c4bca2",.116);
        for(const z of [.103,.128,.154])path([at(-.053,0,z),at(.052,0,z)],"#8f8876",.008);
      });
    }
    order.sort((a,b)=>a[0]-b[0]);for(const [,draw] of order)draw();c.restore();
  }
  window.BayBandPlayers={colors,roles,dress,pose,props,mapActor,install};
})();
