/* The Palm's coin-op table. All dimensions are in metres from the cloth centre. */
(() => {
  "use strict";
  const X=.635,Z=1.27,R=.028575,edge=.138,tau=2*Math.PI,apex=.34;
  const pockets=[[-X,-Z],[X,-Z],[X,0],[X,Z],[-X,Z],[-X,0]];
  const dye=["#f3e9ce","#e3aa2e","#355eaa","#bf4942","#764c89","#db722f","#32765a","#8b403c","#252c32"];
  const bone="#f3e8c7",ink="#283139",cloth="#34836b";
  const rails=[];
  for(const side of [-1,1]){
    rails.push({side,long:true,lo:-Z+.097,hi:-.071,sideHi:true},
      {side,long:true,lo:.071,hi:Z-.097,sideLo:true},{side,long:false,lo:-X+.097,hi:X-.097});
  }

  function worldPoint(table,x,z){
    const c=Math.cos(table.yaw||0),s=Math.sin(table.yaw||0);
    return {x:table.x+c*x+s*z,z:table.z-s*x+c*z};
  }
  const stone=id=>dye[id>8?id-8:id];
  const clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const flat=(x,z,h=0)=>[x,h,z];
  function face(g,points,col,light=1){
    for(let i=1;i<points.length-1;i++)g.face([points[0],points[i],points[i+1]],col,light);
  }
  function disk(g,at,rx,rz,col,count=18){
    const rim=[];for(let i=0;i<count;i++){const a=i*tau/count;rim.push(at(rx*Math.cos(a),rz*Math.sin(a)));}
    face(g,rim,col);
  }
  const plane=y=>(x,z)=>flat(x,z,y);
  function chip(g,h,x,z,dx,dz,w,col){
    const l=Math.hypot(dx,dz)||1,u=-dz*w*.5/l,v=dx*w*.5/l;
    g.quad(flat(x+u,z+v,h),flat(x-u,z-v,h),flat(x+dx-u,z+dz-v,h),flat(x+dx+u,z+dz+v,h),col);
  }
  function railPoint(r,t,d,h){return r.long?[r.side*(X+d),h,t]:[t,h,r.side*(Z+d)];}
  function railEnds(r,d){
    const bevel=(side)=>side?Math.min(d*17/33,.031):Math.min(d*30/33,.065);
    return [r.lo-bevel(r.sideLo),r.hi+bevel(r.sideHi)];
  }
  const profile=[
    [0,-.001,"#225949"],[0,.033,"#438e73"],[.018,.041,"#58987b"],[.050,.041,"#3f8268"],
    [.053,.043,"#243e36"],[.061,.043,"#c18c55"],[.065,.044,"#a16d46"],
    [.121,.043,"#81583f"],[.132,.040,"#b0a68b"],[edge,.033,"#677a76"],[edge,-.008,"#b7ad91"]
  ];
  function railRibbon(r,j){
    const [d,h]=profile[j],[n,k]=profile[j+1],[a,b]=railEnds(r,d),[c,e]=railEnds(r,n);
    return [railPoint(r,a,d,h),railPoint(r,b,d,h),railPoint(r,e,n,k),railPoint(r,c,n,k)];
  }
  function cushion(g,r){
    for(let i=0;i<profile.length-1;i++)face(g,railRibbon(r,i),profile[i][2]);
    for(const end of [0,1]){
      const ring=profile.map(([d,h])=>railPoint(r,railEnds(r,d)[end],d,h));
      face(g,ring.slice(0,5),"#417459");face(g,ring.slice(4),"#73523d");
    }
    const colors=["#b58052","#805539","#ba8657","#8c6144"];
    for(let k=0;k<4;k++){
      const d=.071+.012*k,[a,b]=railEnds(r,d),t=a+.067+(b-a)*(.145*k);
      const e=Math.min(t+(b-a)*(.23+.047*(k%2)),b-.035);
      g.quad(railPoint(r,t,d,.0441),railPoint(r,e,d+.0009,.0441),
        railPoint(r,e,d+.0019,.0441),railPoint(r,t,d+.0008,.0441),colors[k]);
    }
    const p=r.long?[Z/4,Z/2,3*Z/4].map(n=>(r.lo<0?-1:1)*n):[-X/2,0,X/2];
    for(const t of p){
      face(g,[railPoint(r,t-.0142,.094,.0443),railPoint(r,t,.0865,.0443),
        railPoint(r,t+.0142,.094,.0443),railPoint(r,t,.1015,.0443)],"#e2d9b2");
    }
  }
  const cuts=[-Z,-Z+.014,-Z+.027,-Z+.040,-Z+.052,-Z+.064,-Z+.071,
    -.051,-.045,-.034,-.020,0,.020,.034,.045,.051,Z-.071,Z-.064,Z-.052,Z-.040,Z-.027,Z-.014,Z];
  function bedWidth(z){
    const end=Z-Math.abs(z),side=Math.abs(z);
    if(end<.071)return X-Math.sqrt(Math.max(0,.071**2-end**2));
    if(side<.051)return X+.014-Math.sqrt(.053**2-side**2);
    return X;
  }
  // Interpolate the colour of the nap across the playing bed in a single draw.
  function clothPoint(g,x,z){
    const light=.94+.11*Math.max(0,1-(x/.80)**2)*Math.max(0,1-(z/1.5)**2)+.015*(.5-z/2.54);
    g.vertices.push(x,0,z,(52/255)*light,(131/255)*light,(107/255)*light);
  }
  function playingBed(g){
    const spans=[-1,-.58,0,.58,1];
    for(let j=0;j<cuts.length-1;j++){
      const a=cuts[j],b=cuts[j+1],wa=bedWidth(a),wb=bedWidth(b);
      for(let i=0;i<spans.length-1;i++){
        const u=spans[i],v=spans[i+1];
        for(const [x,z] of [[u*wa,a],[v*wa,a],[v*wb,b],[u*wa,a],[v*wb,b],[u*wb,b]])clothPoint(g,x,z);
      }
    }
    disk(g,(u,v)=>flat(u,apex+v,.0007),.014,.014,"#344c44");
    disk(g,(u,v)=>flat(u,apex+v,.0010),.0044,.0044,"#c9c39c",10);
    disk(g,(u,v)=>flat(u,-Z/2+v,.0007),.006,.006,"#99b993",12);
    for(const sign of [-1,1]){
      chip(g,.0006,sign*(X-.010),-.634,sign*(-.034),0,.0017,"#83a18c");
      chip(g,.0006,sign*.102,Z*.65,-sign*.035,.060,.00145,"#559574");
    }
    // Small strokes of blue chalk left by a thumb near the foot cushion.
    for(let i=0;i<6;i++)chip(g,.00065,-.49+.006*i,.806+.002*(i%3),.003,.016-i*.001,.0017,"#78a99c");
  }
  function wellInfo(i){
    const [x,z]=pockets[i],u=Math.sign(x),v=Math.sign(z),norm=Math.hypot(u,v);
    return {x:x+u*(v?.018:.019),z:z+v*.018,u:u/norm,v:v/norm,r:v?.073:.065};
  }
  function wellRing(w,a,outer=false){
    const ca=Math.cos(a),sa=Math.sin(a),out=ca*w.u+sa*w.v;
    const flare=clamp((out+.58)/.95,0,1),rad=w.r+(outer?.008+.023*flare:0);
    return [w.x+ca*rad,-.010+.052*flare+(outer?.0008:0),w.z+sa*rad];
  }
  // Each nickel casting bridges the two cut rails and caps the recess outside the liner.
  const cornerCap=[[-.081,.034],[-.057,.096],[-.055,.138],[.043,.138],[.078,.132],[.106,.118],[.124,.098],
    [.135,.074],[.138,.043],[.138,-.055],[.096,-.057],[.034,-.081],[-.038,-.037]];
  const sideCap=[[-.039,-.053],[.035,-.087],[.136,-.087],[.138,-.077],[.138,.077],[.136,.087],
    [.035,.087],[-.039,.053],[-.042,0]];
  function castEdge(w,i,a){
    const [x,z]=pockets[i],sx=Math.sign(x),sz=Math.sign(z)||1,ux=Math.cos(a)*sx,uz=Math.sin(a)*sz;
    const ox=(w.x-x)*sx,oz=(w.z-z)*sz,poly=z?cornerCap:sideCap;
    let d=Infinity;
    for(let j=0;j<poly.length;j++){
      const p=poly[j],q=poly[(j+1)%poly.length],dx=q[0]-p[0],dz=q[1]-p[1],cross=ux*dz-uz*dx;
      if(Math.abs(cross)<1e-9)continue;
      const tx=p[0]-ox,tz=p[1]-oz,t=(tx*dz-tz*dx)/cross,s=(tx*uz-tz*ux)/cross;
      if(t>0&&s>=-.00001&&s<=1.00001)d=Math.min(d,t);
    }
    const lip=wellRing(w,a,true),l=Math.hypot(lip[0]-w.x,lip[2]-w.z);
    d=Number.isFinite(d)?Math.max(d,l):l;
    return [w.x+d*Math.cos(a),lip[1]+.0005,w.z+d*Math.sin(a)];
  }
  function pocketCup(g,i){
    const w=wellInfo(i),n=40;
    for(let j=0;j<n;j++){
      const a=j*tau/n,b=(j+1)*tau/n,pa=wellRing(w,a),pb=wellRing(w,b),qa=wellRing(w,a,true),qb=wellRing(w,b,true);
      const bottom=t=>[w.x+w.r*.83*Math.cos(t),-.127,w.z+w.r*.83*Math.sin(t)];
      g.quad(pa,pb,qb,qa,(pa[1]>.025&&pb[1]>.025)?"#53433b":"#38403a");
      const ca=castEdge(w,i,a),cb=castEdge(w,i,b);
      g.quad(qa,qb,cb,ca,"#9d9781",.94+.079*Math.cos(a+.37));
      g.quad(ca,cb,[cb[0],-.024,cb[2]],[ca[0],-.024,ca[2]],"#77837b");
      g.quad(pa,pb,bottom(b),bottom(a),"#272e2a",.79+.09*Math.cos(a));
    }
    disk(g,(x,z)=>flat(w.x+x,w.z+z,-.128),w.r*.86,w.r*.86,"#17231f",20);
    for(const turn of [-.69,.69]){
      const a=Math.atan2(w.v,w.u)+turn,x=w.x+(w.r+.017)*Math.cos(a),z=w.z+(w.r+.017)*Math.sin(a);
      disk(g,(u,v)=>flat(x+u,z+v,.0426),.0026,.0026,"#b8a777",8);
    }
  }
  function rounded(x,z,r){
    const p=[];
    for(const [cx,cz,start] of [[x-r,z-r,0],[-x+r,z-r,Math.PI/2],[-x+r,-z+r,Math.PI],[x-r,-z+r,Math.PI*1.5]]){
      for(let j=0;j<=4;j++){const a=start+j*Math.PI/8;p.push([cx+r*Math.cos(a),cz+r*Math.sin(a)]);}
    }
    return p;
  }
  function hoop(g,ax,az,ar,ay,bx,bz,br,by,col,doorway=false){
    const a=rounded(ax,az,ar),b=rounded(bx,bz,br);
    for(let i=0;i<a.length;i++){
      const j=(i+1)%a.length,at=(t,y)=>flat(t[0],t[1],y);
      // The public side has a real opening into the ball tray.
      if(doorway&&Math.abs(a[i][0]-ax)<1e-8&&Math.abs(a[j][0]-ax)<1e-8){
        for(const [lo,hi] of [[-az+ar,-.671],[-.149,az-ar]])
          g.quad([ax,ay,lo],[ax,ay,hi],[bx,by,hi],[bx,by,lo],col);
      }else g.quad(at(a[i],ay),at(a[j],ay),at(b[j],by),at(b[i],by),col,.94+.065*(a[i][0]/ax));
    }
  }
  const alphabet={
    P:[[[0,0],[0,1],[.70,1],[1,.84],[1,.64],[.72,.53],[0,.53]]],
    A:[[[0,0],[.40,1],[.58,1],[1,0]],[[.17,.37],[.82,.37]]],
    L:[[[0,1],[0,0],[1,0]]],M:[[[0,0],[0,1],[.5,.45],[1,1],[1,0]]],
    H:[[[0,1],[0,0]],[[1,1],[1,0]],[[0,.51],[1,.51]]],
    O:[[[.22,0],[.78,0],[1,.2],[1,.8],[.77,1],[.22,1],[0,.79],[0,.21],[.22,0]]],
    U:[[[0,1],[0,.23],[.20,0],[.77,0],[1,.20],[1,1]]],
    S:[[[1,.88],[.77,1],[.21,.99],[0,.83],[0,.64],[.21,.54],[.78,.48],[1,.36],[1,.16],[.78,0],[.22,0],[0,.11]]],
    E:[[[1,1],[0,1],[0,0],[1,0]],[[0,.52],[.79,.52]]]
  };
  // Ribbon outlines keep the small enamel lettering continuous around its corners.
  function strokeShape(points,width){
    const l=[],r=[];
    for(let i=0;i<points.length;i++){
      const a=points[i-1]||points[i],c=points[i+1]||points[i],p=points[i],dx=c[0]-a[0],dy=c[1]-a[1],len=Math.hypot(dx,dy)||1;
      const x=-dy*width*.5/len,y=dx*width*.5/len;l.push([p[0]+x,p[1]+y]);r.push([p[0]-x,p[1]-y]);
    }
    return l.slice(0,-1).map((p,i)=>[p,r[i],r[i+1],l[i+1]]);
  }
  function incise(g,at,word,width,h,col){
    const advance=width/word.length;
    for(let i=0;i<word.length;i++)for(const path of alphabet[word[i]]||[]){
      const pts=path.map(([u,v])=>[-width/2+i*advance+u*advance*.76,(v-.5)*h]);
      for(const poly of strokeShape(pts,h*.11))face(g,poly.map(a=>at(...a)),col);
    }
  }
  function cabinet(g,far){
    const trim="#afa791";
    hoop(g,.773,1.408,.11,.000,.773,1.408,.11,-.029,"#677771");
    hoop(g,.773,1.408,.11,-.029,.760,1.395,.106,-.043,trim);
    hoop(g,.760,1.395,.106,-.043,.750,1.385,.098,-.147,"#9b6847");
    hoop(g,.750,1.385,.098,-.147,.716,1.350,.090,-.272,"#9b6847",!far);
    hoop(g,.716,1.350,.090,-.272,.707,1.341,.090,-.306,"#896045");
    hoop(g,.707,1.341,.090,-.306,.704,1.34,.090,-.322,trim);
    hoop(g,.704,1.34,.09,-.322,.650,1.287,.077,-.38,"#5b493b");
    face(g,rounded(.65,1.287,.077).map(p=>flat(...p,-.38)),"#554539");
    // The tapered H bases support the rails evenly. Brass levellers meet the diner tile.
    for(const v of [-.82,.82]){
      const fx=.50,base=.43;
      for(const side of [-1,1]){
        const z=v+side*.115;
        g.quad([-fx,-.365,z],[fx,-.365,z],[base,-.726,z-side*.03],[-base,-.726,z-side*.03],"#71503c",side===1?.93:1.02);
        const x=side*fx,xx=side*base;
        g.quad([x,-.365,v-.115],[x,-.365,v+.115],[xx,-.726,v+.085],[xx,-.726,v-.085],"#93704d");
      }
      g.box(0,-.733,v,.97,.054,.28,"#3c4843");
      for(const x of [-.382,.382])g.cyl(x,-.771,v,.072,.088,.058,far?6:12,"#ac9c7e");
    }
    g.box(0,-.545,0,.155,.128,1.49,"#765840");
    if(far)return;
    const profileX=y=>y>-.147?.750+.010*(y+.147)/.104:y>-.272?.716+.034*(y+.272)/.125:.707+.009*(y+.306)/.034;
    // Flat-cut walnut veneer runs the length of each half apron. A thin centre seam
    // separates the two panels so the two grain patterns do not continue through it.
    for(const side of [-1,1])for(const along of [0,1]){
      const w=along?1.27:.627;
      const at=(t,y)=>{
        const width=profileX(y)+.0007;return along?[side*width,y,t]:[t,y,side*(width+.635)];
      };
      for(let i=0;i<33;i++){
        const bed=-.061-(i%12)*.019-.0022*((i*11)%5),d=w*(.11+.30*((i*7)%13)/13);
        const start=-w+(2*w-d)*((i*23+5)%37)/37;
        if(along&&side===1&&bed<-.137&&start<-.127&&start+d>-.69)continue;
        const points=[];
        for(let j=0;j<5;j++){const a=j/4;points.push([start+d*a,bed+.0024*Math.sin(a*2+1.23*i)]);}
        for(const v of strokeShape(points,.0012+.0004*(i%3)))face(g,v.map(p=>at(...p)),i%3?"#926345":"#ac7953");
      }
      if(along){
        for(const t of [-1.13,.71]){
          const f=(u,v)=>at(t+u,-.287+v);
          disk(g,f,.0031,.0031,"#ac9e83",8);
        }
      }
    }
    // The floor and jambs run behind the polished surround. Sunk objects collect here.
    g.box(.612,-.21,-.41,.018,.139,.532,"#26322d");
    g.quad([.615,-.271,-.671],[.615,-.271,-.149],[.72,-.268,-.149],[.72,-.268,-.671],"#505b4e");
    for(const z of [-.670,-.149])g.quad([.615,-.273,z],[.725,-.273,z],[.751,-.146,z],[.615,-.146,z],"#4d5042");
    g.box(.751,-.144,-.411,.008,.013,.543,trim);g.box(.722,-.276,-.411,.012,.014,.544,"#aeab91");
    for(const z of [-.677,-.144])g.pole([.751,-.147,z],[.717,-.270,z],.0065,trim,8);
    g.pole([.729,-.244,-.674],[.729,-.244,-.148],.004,"#afab8e",7);
    // A painted-over coin slide beside the return, with the old house-play sticker.
    g.box(.747,-.188,.210,.028,.139,.189,"#526464");
    g.box(.768,-.170,.197,.019,.085,.121,"#b9b59d");
    g.box(.782,-.157,.198,.016,.014,.070,"#3e4844");
    g.box(.799,-.187,.221,.048,.026,.060,"#62716b");
    g.box(.822,-.186,.221,.012,.036,.067,"#d4c8a6");
    const tag=(u,v)=>[.766,-.213+v,.354+u];g.quad(tag(-.064,-.028),tag(.064,-.028),tag(.064,.028),tag(-.064,.028),"#e4cb98");
    incise(g,(u,v)=>[.767,-.213+v,.354+u],"HOUSE",.108,.027,"#67583d");
    // Side medallions read at the height of the near rail from the low cue camera.
    for(const sign of [-1,1]){
      const at=(u,v)=>[sign*.758,-.080+v,.733+sign*u];
      disk(g,at,.066,.036,"#ddc38a",20);
      incise(g,(u,v)=>[sign*.759,-.080+v,.733+sign*u],"PALM",.101,.022,"#62523e");
    }
  }
  function chalk(g){
    const x=-X-.092,z=.964;
    g.box(x,.052,z,.020,.016,.020,"#e3d7b8",.19);
    g.box(x,.063,z,.0205,.008,.0205,"#6794ad",.19);
    disk(g,(u,v)=>flat(x+u,z+v,.0673),.006,.006,"#466f7b",9);
    for(let i=0;i<4;i++)chip(g,.0446,x+.018+i*.004,z-.015,0,.009+i*.002,.0018,"#92a9a3");
  }
  function tableModel(g){
    cabinet(g,false);
    playingBed(g);
    for(const r of rails)cushion(g,r);
    for(let i=0;i<6;i++)pocketCup(g,i);
    chalk(g);
  }

  // Local ball artwork is baked at rest. Roll applies about the table axes to the whole print.
  function orientation(yaw,pitch,bank){
    const a=Math.cos(yaw),b=Math.sin(yaw),c=Math.cos(pitch),d=Math.sin(pitch),e=Math.cos(bank),f=Math.sin(bank);
    return [a*e,-a*f*c+b*d,a*f*d+b*c, f,e*c,-e*d, -b*e,b*f*c+a*d,-b*f*d+a*c];
  }
  const rotate=(m,p)=>[m[0]*p[0]+m[1]*p[1]+m[2]*p[2],m[3]*p[0]+m[4]*p[1]+m[5]*p[2],m[6]*p[0]+m[7]*p[1]+m[8]*p[2]];
  function compose(a,b){
    const m=[];for(let i=0;i<9;i++){const j=i-i%3,k=i%3;m.push(a[j]*b[k]+a[j+1]*b[k+3]+a[j+2]*b[k+6]);}return m;
  }
  const rest=Array.from({length:16},(_,i)=>orientation((i%5-2)*.084,.13*Math.sin(i*2.84),.17*Math.cos(i*1.78)));
  const pigments=new Map();
  function rgb(color){
    if(!pigments.has(color)){const n=parseInt(color.slice(1),16);pigments.set(color,[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]);}
    return pigments.get(color);
  }
  function ballVertex(g,m,n,col,offset){
    const p=rotate(m,n),[red,green,blue]=rgb(col);
    const shine=.848+.118*p[1]-.088*p[0]+.057*p[2]+.063*Math.max(0,p[1]);
    const radius=R+offset;g.vertices.push(p[0]*radius,p[1]*radius,p[2]*radius,red*shine,green*shine,blue*shine);
  }
  function ballFace(g,m,points,col,offset=0){
    for(let i=1;i<points.length-1;i++)for(const p of [points[0],points[i],points[i+1]])ballVertex(g,m,p,col,offset);
  }
  const digits=[
    [[[.37,.05],[.17,.15],[.10,.33],[.10,.68],[.19,.89],[.38,.96],[.63,.96],[.82,.84],[.89,.64],[.89,.34],[.82,.15],[.63,.05],[.37,.05]]],
    [[[.17,.70],[.46,.95],[.56,.95],[.56,.09]],[[.22,.09],[.83,.09]]],
    [[[.12,.73],[.20,.88],[.38,.96],[.65,.95],[.83,.83],[.86,.65],[.76,.48],[.17,.10],[.87,.10]]],
    [[[.12,.86],[.27,.94],[.57,.96],[.77,.88],[.84,.74],[.80,.62],[.61,.52],[.36,.52]],[[.56,.52],[.79,.44],[.88,.31],[.83,.17],[.65,.06],[.36,.05],[.11,.15]]],
    [[[.67,.05],[.67,.96],[.57,.96],[.09,.35],[.91,.35]]],
    [[[.82,.93],[.21,.93],[.16,.53],[.38,.58],[.66,.56],[.83,.43],[.86,.26],[.78,.12],[.61,.05],[.33,.05],[.13,.14]]],
    [[[.81,.88],[.64,.96],[.42,.93],[.24,.77],[.13,.52],[.14,.26],[.24,.12],[.40,.05],[.62,.05],[.81,.16],[.87,.34],[.79,.49],[.59,.56],[.38,.55],[.17,.43]]],
    [[[.11,.92],[.88,.92],[.63,.58],[.47,.30],[.40,.06]]],
    [[[.47,.52],[.28,.58],[.18,.72],[.22,.85],[.38,.95],[.64,.94],[.80,.83],[.82,.69],[.71,.58],[.52,.52],[.29,.44],[.15,.30],[.19,.16],[.37,.05],[.64,.05],[.83,.17],[.86,.31],[.74,.44],[.47,.52]]],
    [[[.15,.13],[.33,.05],[.52,.05],[.71,.19],[.82,.40],[.86,.66],[.80,.84],[.65,.95],[.40,.96],[.21,.87],[.13,.69],[.17,.53],[.32,.42],[.55,.40],[.76,.48],[.85,.60]]]
  ];
  const labelPoint=(sign,x,z)=>[sign*x,sign*Math.sqrt(Math.max(0,1-x*x-z*z)),z];
  function numberPaths(id){
    const text=String(id),dual=text.length===2,advance=dual?.295:.44,height=.600,polys=[];
    for(const sign of [-1,1]){
      const add=pts=>{
        const smooth=[pts[0]];
        for(let i=1;i<pts.length;i++){
          const a=pts[i-1],b=pts[i],n=Math.max(1,Math.ceil(Math.hypot(b[0]-a[0],b[1]-a[1])/.079));
          for(let j=1;j<=n;j++)smooth.push([a[0]+(b[0]-a[0])*j/n,a[1]+(b[1]-a[1])*j/n]);
        }
        for(const poly of strokeShape(smooth,dual?.079:.096))polys.push(poly.map(p=>labelPoint(sign,...p)));
      };
      for(let i=0;i<text.length;i++)for(const path of digits[Number(text[i])]){
        add(path.map(([u,v])=>[(i+.5-text.length*.5)*advance+(u-.5)*(dual?.278:.435),(v-.5)*height]));
      }
      if(id===6||id===9)add([[-.080,-.353],[.081,-.353]]);
    }return polys;
  }
  const prints=Array.from({length:16},(_,i)=>i?numberPaths(i):[]);
  const cueDots=[[0,1,0],[0,-1,0],[1,0,0],[-1,0,0],[0,0,1],[0,0,-1]];
  function cap(g,m,n,radius,col,offset){
    const a=Math.abs(n[1])>.5?[1,0,0]:[0,1,0];
    const b=[n[1]*a[2]-n[2]*a[1],n[2]*a[0]-n[0]*a[2],n[0]*a[1]-n[1]*a[0]];
    const count=radius>.2?20:10,rings=radius>.2?[0,radius*.34,radius*.68,radius]:[0,radius];
    const pt=(r,i)=>{const u=r*Math.cos(i*tau/count),v=r*Math.sin(i*tau/count),w=Math.sqrt(1-r*r);
      return n.map((k,j)=>k*w+a[j]*u+b[j]*v);};
    for(let j=1;j<rings.length;j++)for(let i=0;i<count;i++){
      const lo=rings[j-1],hi=rings[j];
      const poly=lo?[pt(lo,i),pt(lo,i+1),pt(hi,i+1),pt(hi,i)]:[n,pt(hi,i+1),pt(hi,i)];
      ballFace(g,m,poly,col,offset);
    }
  }
  function ballModel(g,id){
    const rows=12,segments=20,m=rest[id],paint=stone(id);
    const sample=(lat,j)=>{const a=(lat/rows-.5)*Math.PI,t=j*tau/segments,ring=Math.cos(a);
      return [Math.sin(t)*ring,Math.cos(t)*ring,Math.sin(a)];};
    for(let i=0;i<rows;i++){
      const fill=id>8&&Math.abs((i+.5)/rows-.5)>1/6?bone:paint;
      for(let j=0;j<segments;j++){
        const p=sample(i,j),q=sample(i+1,j);
        if(i>0)ballFace(g,m,[p,sample(i,j+1),sample(i+1,j+1)],fill);
        if(i<rows-1)ballFace(g,m,[p,sample(i+1,j+1),q],fill);
      }
    }
    if(!id){for(const n of cueDots)cap(g,m,n,.107,"#ac5750",.00009);return;}
    for(const sign of [-1,1])cap(g,m,[0,sign,0],.515,bone,.00025);
    for(const poly of prints[id])ballFace(g,m,poly,ink,.00058);
  }
  function shineModel(g){
    // This reflection of the long diner lamp stays put while the manufacturer's print rolls.
    for(const [cx,cz,wx,wz,col] of [[-.280,.377,.068,.130,"#fff9dd"],[-.11,.427,.032,.084,"#fff5ce"]]){
      const at=(u,v)=>{const x=cx+u+.14*v,z=cz+v;return [x,(1-x*x-z*z)**.5,z].map(n=>n*(R+.00043));};
      face(g,[at(-wx,-wz),at(wx,-wz),at(wx,wz),at(-wx,wz)],col);
    }
    disk(g,(x,z)=>flat(x+.003,-.002+z,-R+.0006),R*.96,R*.86,"#33785e",16);
    disk(g,(x,z)=>flat(x+.0028,-.0018+z,-R+.0009),R*.70,R*.69,"#2a6651",14);
  }
  function outline(g,points,width,col){
    for(const quad of strokeShape(points,width))face(g,quad.map(p=>flat(p[0],p[1],.0018)),col);
  }
  function marker(g,valid){
    for(let k=0;k<6;k++){
      const arr=[];for(let j=0;j<5;j++){const a=(k+j*.16)*tau/6;arr.push([Math.cos(a)*R*1.11,Math.sin(a)*R*1.11]);}
      outline(g,arr,.0034,valid?"#e3d79e":"#da805e");
    }
  }
  function nominated(g){
    const p=[];for(let i=0;i<=18;i++){
      const a=(i/18-.5)*2.28;p.push([.087*Math.sin(a),.087*Math.cos(a)]);
    }
    outline(g,p,.006,"#f4cf79");
  }
  const rackWidth=(4+Math.sqrt(3))*R+.0018,rackEnd=apex+(4*Math.sqrt(3)+1)*R+.0012;
  const rackXZ=[[0,apex-2*R-.0018],[rackWidth,rackEnd],[-rackWidth,rackEnd]];
  function triangle(g){
    const centre=[0,(rackXZ[0][1]+2*rackXZ[1][1])/3];
    const corners=rackXZ.map(([x,z])=>[x*1.075,centre[1]+1.075*(z-centre[1])]);
    for(let i=0;i<3;i++){
      const j=(i+1)%3,a=rackXZ[i],b=rackXZ[j],out=corners[i],end=corners[j];
      g.quad(flat(...a,.003),flat(...b,.003),flat(...b,.037),flat(...a,.037),"#875839");
      g.quad(flat(...out,.003),flat(...end,.003),flat(...end,.037),flat(...out,.037),"#a36d46");
      g.quad(flat(...a,.037),flat(...b,.037),flat(...end,.037),flat(...out,.037),"#c9915f");
    }
  }
  function farTable(g){
    cabinet(g,true);
    g.box(0,-.015,0,2*(X+edge),.060,2*(Z+edge),"#8a694a");
    g.quad(flat(-X,-Z,.017),flat(X,-Z,.017),flat(X,Z,.017),flat(-X,Z,.017),cloth);
    for(const [x,z] of pockets)disk(g,(u,v)=>flat(x+u,z+v,.020),.068,.067,"#323b31",8);
  }
  function install(model){
    model("palm-pool-cabinet",tableModel);model("palm-pool-distant",farTable);
    model("palm-pool-glints",shineModel);
    for(let id=0;id<16;id++)model("palm-pool-ball-"+id,g=>ballModel(g,id));
    model("palm-pool-place",g=>marker(g,true));model("palm-pool-blocked",g=>marker(g,false));
    model("palm-pool-call",nominated);model("palm-pool-triangle",triangle);
  }
  const sampleRack=[{id:0,x:0,z:-Z/2}];
  const order=[1,10,3,4,8,14,12,7,9,2,6,15,11,5,13];let index=0;
  for(let row=0;row<5;row++)for(let j=0;j<=row;j++)sampleRack.push({id:order[index++],x:(2*j-row)*R,z:apex+row*R*Math.sqrt(3)});
  const offBed=b=>b.drop>=1||b.down&&!(b.drop>0&&b.drop<1);
  const validCall=i=>Number.isInteger(i)&&i>=0&&i<6;
  function position(b){
    const d=clamp(b.drop||0,0,1),w=d&&validCall(b.pocket)?wellInfo(b.pocket):b;
    return {x:b.x+(w.x-b.x)*d,z:b.z+(w.z-b.z)*d,y:R-.172*d*d};
  }
  const lift=v=>.22*clamp((v-.60)/.40,0,1);
  function world(list,table,balls,opts={}){
    const y=table.y??.94,a=table.yaw||0,base=opts.layer!=="balls",pieces=opts.layer!=="table";
    if(base)list.push([opts.far?"palm-pool-distant":"palm-pool-cabinet",table.x,y,table.z,a,0,0,.45]);
    if(opts.far)return;
    if(base&&validCall(opts.calledPocket)){
      const w=wellInfo(opts.calledPocket),p=worldPoint(table,w.x,w.z);
      list.push(["palm-pool-call",p.x,y+.044,p.z,a+Math.atan2(w.u,w.v),0,0,.75]);
    }
    if(!pieces)return;
    const tray=[];
    for(const b of balls||sampleRack){
      if(offBed(b)){if(b.id>0&&tray.length<8)tray.push(b);continue;}
      const at=position(b),p=worldPoint(table,at.x,at.z);
      if(!(b.drop>.16))list.push(["palm-pool-glints",p.x,y+at.y,p.z,a,0,0,.48]);
      list.push(["palm-pool-ball-"+b.id,p.x,y+at.y,p.z,a,b.rollX||0,b.rollZ||0,.60]);
    }
    for(let i=0;i<tray.length;i++){
      const p=worldPoint(table,.688,-.637+.0613*i),b=tray[i];
      list.push(["palm-pool-ball-"+b.id,p.x,y-.240,p.z,a,b.rollX||0,b.rollZ||0,.29]);
    }
    const ghost=opts.ghost;
    if(ghost){const p=worldPoint(table,ghost.x,ghost.z);list.push([ghost.valid===false?"palm-pool-blocked":"palm-pool-place",p.x,y,p.z,a,0,0,.75]);}
    if(Number.isFinite(opts.racking)&&opts.racking>=0&&opts.racking<1)
      list.push(["palm-pool-triangle",table.x,y+lift(opts.racking),table.z,a,0,0,.48]);
  }

  function fill(c,points,color){
    c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fillStyle=color;c.fill();
  }
  function circle(c,x,z,r,col){
    c.beginPath();c.arc(x,z,r,0,tau);c.fillStyle=col;c.fill();
  }
  function trace(c,points,w,col){
    c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
    c.lineWidth=w;c.strokeStyle=col;c.stroke();
  }
  const xz=p=>[p[0],p[2]];
  const mapW=1.67,mapH=2.95;
  function overheadBody(c,detailed){
    c.save();c.translate(.014,-.018);
    fill(c,rounded(X+edge+.013,Z+edge+.013,.109),"rgba(25,41,37,.28)");c.restore();
    fill(c,rounded(X+edge,Z+edge,.100),"#606d62");
    fill(c,rounded(X+edge-.006,Z+edge-.006,.093),"#bcb197");
    fill(c,rounded(X+edge-.018,Z+edge-.018,.089),"#805940");
    for(let i=0;i<6;i++){
      const w=wellInfo(i);
      const darkness=c.createRadialGradient(w.x,w.z,.006,w.x,w.z,w.r+.008);
      darkness.addColorStop(0,"#14231d");darkness.addColorStop(.70,"#1b2c24");darkness.addColorStop(.91,"#28352a");darkness.addColorStop(1,"#414338");
      circle(c,w.x,w.z,w.r+.009,darkness);
    }
    const path=cuts.map(z=>[-bedWidth(z),z]).concat(cuts.slice().reverse().map(z=>[bedWidth(z),z]));
    const green=c.createRadialGradient(-.12,.1,.06,0,0,1.49);
    green.addColorStop(0,"#3d9274");green.addColorStop(.53,"#36896d");green.addColorStop(1,"#2c7962");
    fill(c,path,green);
    if(detailed){
      c.save();c.clip();let seed=4087;
      const next=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
      // A quiet woven nap, printed into the cached table only once at each detail level.
      for(let i=0;i<2300;i++){
        const x=(next()*2-1)*X,z=(next()*2-1)*Z;
        c.fillStyle=i%3?"rgba(214,223,162,.108)":"rgba(30,78,63,.13)";
        c.fillRect(x,z,.0015+next()*.0027,.0015+next()*.002);
      }
      for(const side of [-1,1]){
        trace(c,[[side*(X-.002),-Z/2],[side*(X-.043),-Z/2]],.0017,"#7ba28a");
        trace(c,[[side*.105,Z*.65],[side*.067,Z*.65+.06]],.0015,"#569675");
      }
      for(let i=0;i<6;i++)trace(c,[[-.49+.005*i,.806+.002*(i%3)],[-.487+.005*i,.821]],.0019,"#70a793");
      c.restore();
    }
    circle(c,0,apex,.014,"#395248");circle(c,0,apex,.0044,"#d4cba5");circle(c,0,-Z/2,.006,"#9bbd9e");
    for(const r of rails){
      for(let j=1;j<profile.length-1;j++)fill(c,railRibbon(r,j).map(xz),profile[j][2]);
      const strip=(u,d)=>xz(railPoint(r,u,d,0));
      if(detailed)for(let j=0;j<4;j++){
        const d=.069+.013*j,[lo,hi]=railEnds(r,d),at=lo+.037+(hi-lo)*.104*j;
        trace(c,[strip(at,d),strip(Math.min(hi-.027,at+(hi-lo)*(.20+.083*(j%2))),d+.0015)],.0016,j%2?"#8e6446":"#b7885c");
      }
      const sights=r.long?[Z/4,Z/2,3*Z/4].map(n=>(r.lo<0?-1:1)*n):[-X/2,0,X/2];
      for(const t of sights)fill(c,[strip(t-.0142,.094),strip(t,.0865),strip(t+.0142,.094),strip(t,.1015)],"#e4dbb8");
    }
    for(let i=0;i<6;i++){
      const w=wellInfo(i);
      for(let j=0;j<40;j++){
        const a=j*tau/40,b=(j+1)*tau/40,p=wellRing(w,a),q=wellRing(w,b);
        if(p[1]<-.002&&q[1]<-.002)continue;
        const u=wellRing(w,a,true),v=wellRing(w,b,true);
        fill(c,[u,v,castEdge(w,i,b),castEdge(w,i,a)].map(xz),p[1]>.024?"#a69e85":"#807e6f");
        fill(c,[p,q,v,u].map(xz),p[1]>.024?"#604e43":"#3c463c");
      }
      if(detailed)for(const turn of [-.69,.69]){
        const a=Math.atan2(w.v,w.u)+turn;circle(c,w.x+(w.r+.017)*Math.cos(a),w.z+(w.r+.017)*Math.sin(a),.0026,"#cdba82");
      }
    }
    c.save();c.translate(-X-.092,.964);c.rotate(-.19);c.fillStyle="#d4ceaa";c.fillRect(-.011,-.009,.022,.021);
    c.fillStyle="#7199aa";c.fillRect(-.011,-.011,.021,.020);circle(c,0,-.001,.006,"#416d79");c.restore();
  }
  const sheets=new Map();
  function staticSheet(detail){
    if(sheets.has(detail))return sheets.get(detail);
    const ppu=detail?365:67,cv=document.createElement("canvas");
    cv.width=Math.ceil(mapW*ppu);cv.height=Math.ceil(mapH*ppu);
    const c=cv.getContext("2d");if(!c)return null;
    c.translate(cv.width/2,cv.height/2);c.scale(cv.width/mapW,cv.height/mapH);overheadBody(c,detail);
    sheets.set(detail,cv);return cv;
  }
  // Orthographic cap of a sphere, clipped at the visible hemisphere. The same caps form
  // the two white ends of each stripe, both number discs and the cue ball's red dots.
  function cap2(c,n,k,color){
    const ny=n[1],length=Math.hypot(n[0],n[2]),r=Math.sqrt(1-k*k);
    if(length<1e-6){if(ny>0)circle(c,0,0,r,color);return;}
    const cosLimit=k*ny/(length*r);
    if(cosLimit<=-1)return;
    const start=cosLimit>=1?0:Math.acos(cosLimit),end=tau-start;
    const hx=n[0]/length,hz=n[2]/length;
    const vertex=(x,z,first)=>{
      const u=hx*x-hz*z,v=hz*x+hx*z;if(first)c.moveTo(u,v);else c.lineTo(u,v);
    };
    c.beginPath();
    for(let i=0;i<=24;i++){const a=start+(end-start)*i/24;vertex(length*k+ny*r*Math.cos(a),r*Math.sin(a),i===0);}
    if(start>0){
      const edgeAngle=Math.acos(clamp(k/length,-1,1));
      for(let j=0;j<=12;j++){const a=-edgeAngle+2*edgeAngle*j/12;vertex(Math.cos(a),Math.sin(a),false);}
    }
    c.closePath();c.fillStyle=color;c.fill();
  }
  function face2(c,points,m){
    const p=points.map(q=>rotate(m,q)),v=[];
    for(let i=0;i<p.length;i++){
      const a=p[i],b=p[(i+1)%p.length];
      if(a[1]>=0)v.push(xz(a));
      if((a[1]>=0)!==(b[1]>=0)){
        const t=a[1]/(a[1]-b[1]);v.push([a[0]+(b[0]-a[0])*t,a[2]+(b[2]-a[2])*t]);
      }
    }
    if(v.length>2)fill(c,v,ink);
  }
  // Identical normalized light can be reused regardless of ball size or the map rotation.
  const ballLight=new WeakMap();
  function sheen(c){
    let light=ballLight.get(c);
    if(!light){
      light=c.createRadialGradient(-.30,.35,.035,-.21,.24,1.40);
      light.addColorStop(0,"rgba(255,250,220,.29)");light.addColorStop(.33,"rgba(252,242,207,.09)");
      light.addColorStop(.56,"rgba(18,34,30,.01)");light.addColorStop(.84,"rgba(18,35,34,.16)");light.addColorStop(1,"rgba(15,32,28,.48)");
      ballLight.set(c,light);
    }return light;
  }
  function paintResin(c,id,rollX,rollZ,numbers){
    const m=compose(orientation(0,rollX,rollZ),rest[id]);
    circle(c,0,0,1,stone(id));
    if(id>8){const axis=rotate(m,[0,0,1]);cap2(c,axis,.50,bone);cap2(c,axis.map(k=>-k),.50,bone);}
    if(!id){for(const n of cueDots)cap2(c,rotate(m,n),Math.sqrt(1-.107**2),"#ac5750");}
    else{
      for(const sign of [-1,1])cap2(c,rotate(m,[0,sign,0]),Math.sqrt(1-.515**2),bone);
      if(numbers)for(const poly of prints[id]){
        if(Math.sign(poly[0][1])*m[4]>-.52)face2(c,poly,m);
      }
    }
    circle(c,0,0,1,sheen(c));
    c.save();c.translate(-.28,.377);c.rotate(-.11);c.fillStyle="#fff7d9";c.fillRect(-.058,-.093,.116,.186);
    c.fillStyle="rgba(255,250,221,.80)";c.fillRect(.145,-.052,.066,.134);c.restore();
  }
  // While the player lines up a shot, parked balls need just one cached image each.
  // The three atlases bound all the cached ball artwork to a little under a megabyte.
  const ballSheets=new Map();
  function drawResin(c,b,pixels){
    const cell=pixels<3.6?24:pixels<14?48:112,rx=b.rollX||0,rz=b.rollZ||0;
    let sheet=ballSheets.get(cell);
    if(!sheet){
      const cv=document.createElement("canvas");cv.width=cv.height=cell*4;
      sheet={cv,ctx:cv.getContext("2d"),poses:[]};ballSheets.set(cell,sheet);
    }
    if(!sheet.ctx){paintResin(c,b.id,rx,rz,pixels>=3.6);return;}
    const x=b.id%4*cell,y=Math.floor(b.id/4)*cell,r=cell*.5-1,pose=sheet.poses[b.id];
    if(!pose||(Math.abs(pose.rx-rx)+Math.abs(pose.rz-rz))*pixels>.12){
      const g=sheet.ctx;g.clearRect(x,y,cell,cell);g.save();
      g.translate(x+cell/2,y+cell/2);g.scale(r,r);paintResin(g,b.id,rx,rz,pixels>=3.6);g.restore();
      sheet.poses[b.id]={rx,rz};
    }
    const d=cell/r;c.drawImage(sheet.cv,x,y,cell,cell,-d*.5,-d*.5,d,d);
  }
  function mapBall(c,b,ppu){
    if(offBed(b))return;
    const at=position(b),drop=clamp(b.drop||0,0,1),size=R*(1-.71*drop*drop),readable=ppu*size>2.1;
    c.save();
    if(drop>.25&&validCall(b.pocket)){
      const w=wellInfo(b.pocket);
      c.beginPath();c.arc(w.x,w.z,w.r+.005,0,tau);c.clip();
    }
    c.translate(at.x,at.z);
    if(!drop){
      c.beginPath();c.ellipse(.0035,-.003,R*1.10,R*.96,-.28,0,tau);
      c.fillStyle="rgba(18,44,34,.43)";c.fill();
    }
    c.scale(size,size);
    if(readable)drawResin(c,b,ppu*size);
    else{
      circle(c,0,0,1,stone(b.id));
      if(b.id>8){c.fillStyle="#e0dbbd";c.beginPath();c.arc(0,0,1,.22,1.84);c.closePath();c.fill();}
    }
    if(drop>.15)circle(c,0,0,1,"rgba(15,29,23,"+(drop*.69)+")");
    c.restore();
  }
  function map(c,project,table,balls,opts={}){
    const o=project(table.x,table.z),a=worldPoint(table,1,0),b=worldPoint(table,0,1),u=project(a.x,a.z),v=project(b.x,b.z);
    if(!o||!u||!v)return;
    const ppu=Math.max(Math.hypot(u.x-o.x,u.y-o.y),Math.hypot(v.x-o.x,v.y-o.y)),base=opts.layer!=="balls";
    c.save();c.transform(u.x-o.x,u.y-o.y,v.x-o.x,v.y-o.y,o.x,o.y);
    if(base){
      const cv=staticSheet(ppu>70);if(cv)c.drawImage(cv,-mapW/2,-mapH/2,mapW,mapH);else overheadBody(c,ppu>70);
      if(validCall(opts.calledPocket)){
        const w=wellInfo(opts.calledPocket),a=Math.atan2(w.v,w.u);
        c.beginPath();c.arc(w.x,w.z,.087,a-1.14,a+1.14);c.strokeStyle="#f5d37f";c.lineWidth=.006;c.stroke();
      }
    }
    if(opts.layer!=="table"&&!opts.far){
      for(const b of balls||sampleRack)mapBall(c,b,ppu);
      if(opts.ghost){
        const {x,z,valid}=opts.ghost;
        c.beginPath();c.arc(x,z,R*1.11,0,tau);c.strokeStyle=valid===false?"#dd825f":"#f0e6af";
        c.lineWidth=.0036;c.setLineDash([.018,.012]);c.stroke();c.setLineDash([]);
      }
      if(Number.isFinite(opts.racking)&&opts.racking>=0&&opts.racking<1){
        c.save();c.translate(0,.10*lift(opts.racking));
        const p=rackXZ.concat([rackXZ[0]]);c.lineJoin="round";trace(c,p,.012,"#704f38");trace(c,p,.007,"#be8959");c.restore();
      }
    }
    c.restore();
  }
  window.BayPalmTable={install,world,map,worldPoint};
})();
