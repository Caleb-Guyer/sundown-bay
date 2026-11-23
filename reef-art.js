/* The same seabed, wreck timber and loose objects are drawn through the diver's mask and on the overhead chart. */
(() => {
  "use strict";
  const tau=Math.PI*2, clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), mix=(a,b,t)=>a+(b-a)*t;
  const floor=(x,z)=>BaySwimming.floor(x,z),coast=z=>BaySwimming.coast(z);
  const sectors=Array.from({length:12},(_,i)=>({i,z:-232+i*56,habitat:null,map:null}));
  const columns=[-24,-9,-4,-1,0,1,2,3,4.5,6,8,10,12.5,15,18,21.5,25,29,34,40,47,55,65,78,95,118,150,195,255,343];
  const paints=new Map(),printed=new Map(),ready=new Set();
  let registerModel=null;
  function seeded(seed){
    return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  }
  function frame(x,y,z,yaw=0,heel=0){
    const c=Math.cos(yaw),s=Math.sin(yaw),ch=Math.cos(heel),sh=Math.sin(heel);
    return (u,v,w)=>{
      const r=u*ch-v*sh,h=u*sh+v*ch;
      return [x+c*r+s*w,y+h,z-s*r+c*w];
    };
  }
  function plank(g,p,x1,y1,z1,x2,y2,z2,color){
    const a=p(x1,y1,z1),b=p(x2,y1,z1),c=p(x2,y1,z2),d=p(x1,y1,z2);
    const A=p(x1,y2,z1),B=p(x2,y2,z1),C=p(x2,y2,z2),D=p(x1,y2,z2);
    g.quad(A,B,C,D,color,1.06);g.quad(a,A,B,b,color,.85);g.quad(b,B,C,c,color,.95);
    g.quad(c,C,D,d,color,.79);g.quad(d,D,A,a,color,.88);g.quad(a,b,c,d,color,.71);
  }
  function strip(g,points,r,color,sides=5){
    for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,color,sides);
  }
  function circle(fn,n){
    return Array.from({length:n+1},(_,i)=>fn(Math.cos(i*tau/n),Math.sin(i*tau/n)));
  }
  function surfacePatch(g,x,z,rx,rz,color,seed,lift=.025){
    const rand=seeded(seed),n=13,ring=[];
    const dye=parseInt(color.slice(1),16);
    const tint=[((dye>>16)&255)/255,((dye>>8)&255)/255,(dye&255)/255];
    for(let i=0;i<n;i++){
      const a=i*tau/n,rough=.80+.25*rand(),u=x+rx*Math.cos(a)*rough,w=z+rz*Math.sin(a)*rough;
      ring.push([u,floor(u,w)+lift,w,...sandColor(u,w,u-coast(w))]);
    }
    const center=[x,floor(x,z)+lift,z,...tint];
    for(let i=0;i<n;i++)g.vertices.push(...center,...ring[i],...ring[(i+1)%n]);
  }
  function stone(g,x,z,rx,rz,h,seed,colors){
    const rand=seeded(seed),y=floor(x,z)-.08,n=7,low=[],high=[];
    for(let i=0;i<n;i++){
      const a=(i+rand()*.22)*tau/n,r=.72+rand()*.35,dx=rx*r*Math.cos(a),dz=rz*r*Math.sin(a);
      low.push([x+dx,y,z+dz]);high.push([x+dx*.82+.08*rx,y+h*(.64+.29*rand()),z+dz*.76]);
    }
    const crown=[x-rx*.16,y+h,z+rz*.12];
    for(let i=0;i<n;i++){
      const j=(i+1)%n;g.quad(low[i],low[j],high[j],high[i],colors[i%colors.length],.80);
      g.tri(high[i],high[j],crown,colors[j%colors.length]);
    }
  }
  function habitat(tile){
    if(tile.habitat)return tile.habitat;
    const r=seeded(79601+tile.i*617),tufts=[],ripples=[],shells=[];
    const put=(out,z,d,more)=>out.push({x:coast(z)+d,z,...more});
    for(let i=0;i<23;i++){
      const z=tile.z+3+r()*50,d=5+Math.pow(r(),1.70)*141;
      put(tufts,z,d,{rx:.45+r()*2.8,rz:.65+r()*3.1,seed:Math.floor(r()*80000),height:.30+r()*.6});
    }
    // The three small objects settled in scours. Keep the taller grass on their fringes.
    const clearTufts=tufts.filter(p=>!BaySwimming.sites.some(site=>
      ((site.x-p.x)/(p.rx+1.1))**2+((site.z-p.z)/(p.rz+1.1))**2<1));
    for(let i=0;i<94;i++){
      const z=tile.z+1+r()*54;
      put(ripples,z,2+Math.pow(r(),1.61)*205,{len:.42+r()*3.2,angle:.38+r()*.78,seed:r()});
    }
    for(let i=0;i<27;i++){
      const z=tile.z+1+r()*54;
      put(shells,z,3+r()*82,{size:.046+r()*.13,seed:r()});
    }
    return tile.habitat={tufts:clearTufts,ripples,shells};
  }
  function sandColor(x,z,d){
    const ocean=clamp(d/104,0,1),marsh=clamp((z-186)/78,0,1),shelf=1-ocean;
    const mottling=Math.sin(x*.17+z*.053)*.45+Math.cos(z*.23-x*.088)*.30+Math.sin(x*.38+z*.19)*.15;
    const dark=-7*Math.max(0,Math.sin(.105*x+.129*z)+.48*Math.cos(z*.29)-.49);
    const level=mottling*6+dark;
    return [(142+shelf*67-marsh*8+level)/255,(164+shelf*34-marsh*7+level)/255,(140+shelf*18-marsh*12+level)/255];
  }
  function grass(g,bed){
    const {x,z,rx,rz,seed,height}=bed,r=seeded(seed);
    surfacePatch(g,x,z,rx*1.12,rz*1.12,"#8f9d7b",seed,.034);
    for(let i=0;i<25;i++){
      const rad=Math.sqrt(r()),a=tau*r(),ux=x+Math.cos(a)*rad*rx,uz=z+Math.sin(a)*rad*rz;
      const y=floor(ux,uz)+.016,h=height*(.33+r()*.73),w=.028+r()*.052;
      const face=r()*tau,dx=w*Math.cos(face),dz=w*Math.sin(face),lean=.12+r()*.42;
      const u=ux+lean*h*(.5+r()),v=uz+(.2-r())*h*.6;
      const base=[ux-dx,y,uz-dz],other=[ux+dx,y,uz+dz],tip=[u+.13*h,y+h,v-.05];
      const a1=[mix(ux,u,.42)-dx*.72,y+h*.58,mix(uz,v,.42)-dz*.72];
      const b1=[a1[0]+1.44*dx,a1[1],a1[2]+1.44*dz];
      g.quad(base,other,b1,a1,i%4===0?"#637e5d":"#517768");
      g.tri(a1,b1,tip,["#829a68","#70936b","#57836a"][i%3]);
    }
  }
  function sandRipple(g,p){
    const a=p.angle,dx=Math.cos(a),dz=Math.sin(a),w=.035+.08*p.seed;
    const point=(f,side)=>{
      const bow=Math.sin(Math.PI*f)*(.11+.21*p.seed)+side*w*Math.sin(Math.PI*f);
      const x=p.x+(f-.5)*p.len*dx-dz*bow,z=p.z+(f-.5)*p.len*dz+dx*bow;
      return [x,floor(x,z)+.045,z];
    };
    for(let i=0;i<4;i++){
      const a=i/4,b=(i+1)/4;
      g.quad(point(a,-1),point(b,-1),point(b,1),point(a,1),p.seed>.71?"#bec5a1":"#afbb99");
    }
  }
  function bedGeometry(g,tile){
    const step=2.8,rows=20;
    const row=iz=>{
      const z=tile.z+iz*step,left=coast(z);
      return columns.map(d=>{const x=left+d;return [x,floor(x,z),z,...sandColor(x,z,d)];});
    };
    let prev=row(0);
    for(let i=1;i<=rows;i++){
      const next=row(i);
      for(let j=1;j<columns.length;j++)
        g.vertices.push(...prev[j-1],...prev[j],...next[j],...prev[j-1],...next[j],...next[j-1]);
      prev=next;
    }
    const env=habitat(tile);
    for(const p of env.ripples)sandRipple(g,p);
    for(const p of env.tufts)grass(g,p);
    for(const p of env.shells){
      const {x,z,size}=p,y=floor(x,z)+.052,w=size*(.48+p.seed*.33);
      g.tri([x-w,y,z-size],[x+w,y,z-size*.37],[x,y+.048,z+size],p.seed>.6?"#c5bca2":"#e1d5b7");
    }
  }
  const concrete=["#929d90","#87998b","#acb1a0","#9eab9a"];
  function bicycle(g,site){
    const {x,z}=site,r=seeded(941);
    for(let i=0;i<18;i++){
      const along=r(),xx=x-2.55+along*8.1,zz=z+2.5+along*1.57+(r()-.5)*(i%4===0?4.1:1.65);
      const size=(i%4===0?.40:.67)*(.56+r()*.86);
      stone(g,xx,zz,size*1.17,size*(.78+r()*.44),size*(.67+r()*.44),416+i*19,concrete);
    }
    const xx=x+3.6,zz=z+1.15,slab=frame(xx,floor(xx,zz)+.14,zz,.85,-.23);
    plank(g,slab,-.86,-.22,-.38,.81,.18,.46,"#a7a799");
    strip(g,[slab(.51,.15,-.16),slab(.57,.44,-.17),slab(.74,.52,-.10)],.022,"#926e55",4);
    strip(g,[slab(-.64,.17,.26),slab(-.68,.37,.29),slab(-.55,.48,.33)],.024,"#97745b",4);
    for(const [dx,dz,h] of [[-1.9,1.2,.82],[2.0,.1,.61],[.7,3.7,.96]])
      grass(g,{x:x+dx,z:z+dz,rx:.62,rz:.48,height:h,seed:2110+Math.round(100*h)});
    for(const [dx,dz,h,lean] of [[3.6,2.6,1.47,.16],[3.5,3.7,.90,.07],[-2.3,1.73,.66,-.25]]){
      const y=floor(x+dx,z+dz);
      g.pole([x+dx,y-.11,z+dz],[x+dx+lean,y+h,z+dz+.22],.15,"#656f61",7);
      g.pole([x+dx+lean*.65,y+h*.67,z+dz+.14],[x+dx+lean*.8,y+h*.80,z+dz+.18],.158,"#b8b699",7);
    }
    // The step-through frame leans on what remains of the jetty. One basket rail has folded backwards.
    const bx=x+.90,bz=z+1.22,f=frame(bx,floor(bx,bz)-.015,bz,.60,.07);
    const p=(u,v,w=0)=>f(u,v*.63-w*.78,v*.78+w*.63);
    for(const wx of [-.73,.73]){
      const wheel=(c,s,off=0)=>p(wx+c*(.415+off),.421+s*(.415+off),0);
      strip(g,circle((c,s)=>wheel(c,s),18),.053,"#394b49",6);
      strip(g,circle((c,s)=>wheel(c,s,-.047),16),.019,"#bac1aa",4);
      for(let i=0;i<10;i++){const a=i*tau/10;g.pole(p(wx,.421,.022),wheel(Math.cos(a),Math.sin(a),-.054),.008,"#a3b6a6",3);}
      g.pole(p(wx,.421,-.09),p(wx,.421,.09),.047,"#878d7b",6);
    }
    const back=p(-.73,.421),front=p(.73,.421),pedal=p(-.05,.365),seat=p(-.32,.95),neck=p(.47,.94);
    strip(g,[back,seat,pedal,back],.034,"#a67c5d",6);
    strip(g,[pedal,p(.12,.56),p(.25,.59),neck],.056,"#d8a56e",7);
    strip(g,[seat,p(-.16,.65),p(.18,.63),p(.45,.82)],.030,"#dcb77d",5);
    strip(g,[neck,p(.56,.56),front],.038,"#92ac95",6);
    strip(g,[seat,p(-.37,1.1)],.035,"#a6ae9e",6);
    plank(g,p,-.56,1.083,-.11,-.23,1.145,.11,"#635c52");
    strip(g,[neck,p(.47,1.09),p(.40,1.14,-.22),p(.30,1.13,-.27)],.026,"#c4c6b5");
    strip(g,[p(.47,1.09),p(.45,1.14,.20),p(.32,1.13,.25)],.026,"#b5c0ac");
    for(const side of [-1,1]){
      const w=side*.17;
      strip(g,[p(-.05,.365,0),p(-.05+side*.12,.365+side*.08,w)],.024,"#b2b6a1",5);
      plank(g,p,-.10+side*.12,.34+side*.08,w-.04,.05+side*.12,.38+side*.08,w+.04,"#575d55");
    }
    for(const h of [.78,.92,1.06]){
      const wide=.13+(h-.78)*.19;
      strip(g,[p(.63,h,-wide),p(.96,h,-wide),p(1.00,h,wide),p(.64,h,wide),p(.63,h,-wide)],.017,"#b7a388",4);
    }
    for(const [u,w] of [[.63,-.13],[.98,-.13],[.98,.13],[.63,.13]])g.pole(p(u,.78,w),p(u,1.06,w*1.4),.016,"#ae977c",4);
    surfacePatch(g,x,z,.89,.67,"#c6c6a3",81,.053);
  }
  function crabPot(g,x,z,yaw,scale=1,base=floor(x,z)+.10){
    const r=frame(x,base,z,yaw);
    const p=(u,v,w)=>r(u*scale,v*scale,w*scale);
    for(const w of [-.50,0,.50])strip(g,[p(-.55,0,w),p(-.52,.42,w),p(-.30,.60,w),p(.30,.60,w),p(.52,.42,w),p(.55,0,w)],.028,"#72897b",4);
    for(const [u,v] of [[-.53,.05],[-.51,.28],[-.32,.55],[0,.60],[.32,.55],[.51,.28],[.53,.05]])
      g.pole(p(u,v,-.5),p(u,v,.5),.023,"#797f69",4);
    for(const side of [-1,1])for(let j=0;j<5;j++){
      const w=-.5+j*.20;
      g.pole(p(side*.54,.05,w),p(side*.49,.40,w+.2),.011,"#788b78",3);
      g.pole(p(side*.49,.40,w),p(side*.54,.05,w+.2),.011,"#718675",3);
    }
    strip(g,[p(-.50,0,-.5),p(.50,0,-.5),p(.50,0,.5),p(-.50,0,.5),p(-.50,0,-.5)],.043,"#77775e");
    plank(g,p,-.58,.13,-.17,-.54,.31,.18,"#bf8c66");
  }
  function dinghy(g,site){
    const {x,z}=site,bx=x+1.85,bz=z+1.80,p=frame(bx,floor(bx,bz)+.07,bz,-.72,.12);
    const stations=[[-2.25,.68],[-1.60,.84],[-.75,.94],[.14,.91],[1.02,.69],[1.82,.37],[2.35,.026]];
    const shape=(k,side,v)=>{const [w,h]=stations[k];return p(side*h*(.16+.84*Math.pow(v,.62)),.09+v*(.71+.13*Math.cos(w*1.28)),w);};
    const colors=["#6c7567","#aa7e62","#b59975","#77a6a0","#d0c9a1"];
    for(const side of [-1,1]){
      for(let i=1;i<stations.length;i++){
        for(let j=0;j<5;j++){
          if(side===1&&i<3&&j>=i)continue;
          if(side===-1&&i===5&&j>=3)continue;
          g.quad(shape(i-1,side,j/5),shape(i,side,j/5),shape(i,side,(j+1)/5),shape(i-1,side,(j+1)/5),colors[j],side<0?1:.9);
        }
        if((side<0&&i!==5)||(side>0&&i>2))g.pole(shape(i-1,side,1),shape(i,side,1),.046,"#d8c7a2");
      }
    }
    const fang=shape(4,-1,.85),split=shape(5,-1,.65);
    g.tri(fang,shape(4,-1,.64),[fang[0]-.06,fang[1]-.08,fang[2]+.34],"#a97956");
    g.tri(split,shape(5,-1,.83),[split[0]-.10,split[1]+.01,split[2]-.22],"#c9b18d");
    const timber=p(-1.25,0,.31),splinter=frame(timber[0],floor(timber[0],timber[2])+.07,timber[2],-.32,-.13);
    plank(g,splinter,-.074,-.036,-.70,.074,.037,.37,"#83a59a");
    g.tri(splinter(-.074,.038,.37),splinter(.08,.038,.64),splinter(.074,.038,.37),"#bf9a70");
    for(let i=0;i<stations.length-1;i++){
      const w=stations[i][0];
      strip(g,[shape(i,-1,.96),shape(i,-1,.49),p(-.14,.14,w),p(.15,.14,w),shape(i,1,.45),shape(i,1,i<2?.55:.94)],.061,"#976f55",5);
      if(i<stations.length-2)plank(g,p,-.24,.07,w,.24,.146,stations[i+1][0],"#896e52");
    }
    for(const w of [-.47,.64])plank(g,p,-.70,.56,w-.12,w<0?.66:.22,.63,w+.12,"#bb9971");
    for(const j of [0,1,2])g.quad(shape(0,-1,j*.19),shape(0,1,j*.19),shape(0,1,(j+1)*.19),shape(0,-1,(j+1)*.19),"#997657");
    plank(g,p,-.96,.27,-1.74,-.79,.33,-.42,"#c0a77f");
    const rope=[p(-.45,.71,1.42),p(-1.08,.24,1.30),p(-1.64,.10,.64),p(-1.9,.15,.42)];
    strip(g,rope,.027,"#bb9e73",4);
    const inner=p(.02,.21,-1.16);
    crabPot(g,inner[0],inner[2],-.69,.75,inner[1]);crabPot(g,x-.74,z+3.36,-.17,1.12);
    for(let i=0;i<5;i++)stone(g,x+3.2+Math.cos(i)*1.15,z-1+Math.sin(i)*.69,.23,.32,.26,112+i,concrete);
    surfacePatch(g,x,z,1.0,.69,"#c8c7a1",89,.052);
  }
  function shell(g,p,u,v,w,length,angle,color){
    const sn=Math.sin(angle),cs=Math.cos(angle),a=p(u-length*sn,v,w-length*cs),b=p(u+length*sn,v+.025,w+length*cs);
    const c=p(u+length*.54*cs,v+.024,w-length*.54*sn),d=p(u-length*.43*cs,v+.016,w+length*.43*sn);
    const ridge=p(u-length*.08*sn,v+length*.29,w-length*.08*cs);
    g.tri(a,c,ridge,color);g.tri(c,b,ridge,"#c4ba9f");g.tri(b,d,ridge,color);g.tri(d,a,ridge,"#a49e89");
  }
  function oysterRack(g,x,z,yaw,height,seed){
    const r=seeded(seed),p=frame(x,floor(x,z)+.01,z,yaw);
    for(const u of [-.69,.69]){
      for(const w of [-1.81,0,1.77]){
        g.pole(p(u,-.31,w),p(u+.05,height+.23+.22*r(),w+.05),.082,"#796c55",7);
        g.pole(p(u+.04,height+.02,w+.04),p(u+.045,height+.09,w+.045),.09,"#c3b397");
      }
      strip(g,[p(u,height,-1.96),p(u,height+.028,0),p(u,height,1.91)],.072,"#7c795d",6);
      strip(g,[p(u,-.14,-1.7),p(u,height,0),p(u,-.16,1.7)],.034,"#737761",4);
    }
    for(const w of [-1.76,-.53,.60,1.77])g.pole(p(-.76,height,w),p(.77,height,w),.045,"#937e60");
    for(const center of [-.85,.91]){
      const half=.68;
      plank(g,p,-.52,height+.024,center-half,.52,height+.085,center+half,"#5d7564");
      for(let i=0;i<14;i++){
        const u=(r()-.5)*.80,w=center+(r()-.5)*1.10;
        shell(g,p,u,height+.094,w,.105+.084*r(),r()*tau,["#c5c1a4","#adab98","#b9b1a1","#cac5af"][i%4]);
      }
      for(const w of [center-half,center-.25,center+.25,center+half])
        strip(g,[p(-.54,height+.075,w),p(-.43,height+.21,w),p(.43,height+.21,w),p(.54,height+.075,w)],.018,"#6e7d69",4);
      for(const u of [-.47,-.18,.14,.47])g.pole(p(u,height+.18,center-half),p(u,height+.18,center+half),.014,"#728571",4);
      plank(g,p,.666,height+.025,center-.10,.72,height+.12,center+.07,"#c18a66");
    }
  }
  function oysterBeds(g,site){
    const {x,z}=site;
    oysterRack(g,x+.72,z+2.67,.86,.92,541);
    oysterRack(g,x+3.28,z+.05,.88,.59,558);
    const r=seeded(834);
    for(let i=0;i<55;i++){
      const a=r()*tau,d=.8+r()*3.5,xx=x+Math.cos(a)*d,zz=z+Math.sin(a)*d;
      shell(g,frame(xx,floor(xx,zz)+.048,zz),0,0,0,.067+r()*.12,a,"#b3afa0");
    }
    surfacePatch(g,x,z,.84,.70,"#c5bca1",127,.050);
  }
  function pierUnder(g,dock){
    const {x,z,walkW,footX,headW,headD}=dock;
    const root=Math.max(footX,coast(z)-2),r=seeded(5843+Math.floor(z)),top=dock.level-.30;
    function pile(u,w,radius,cap=.05){
      const y=floor(u,w);if(y>-.20)return;
      g.pole([u,y-.095,w],[u,cap,w],radius,"#746d59",7);
      g.pole([u,Math.max(y,-.75),w],[u,Math.min(.04,cap),w],radius*1.04,"#597166",8);
      const n=Math.min(14,Math.floor(-y*4));
      for(let i=0;i<n;i++){
        const a=r()*tau,h=y+.13+r()*Math.max(0,-y-.38),dx=Math.cos(a),dz=Math.sin(a);
        const u1=u+dx*radius,w1=w+dz*radius;
        g.tri([u1-.052*dz,h-.045,w1+.052*dx],[u1+.049*dz,h-.049,w1-.049*dx],
          [u1+.067*dx,h+.062,w1+.067*dz],i%3?"#abac92":"#bcc2a1");
      }
      surfacePatch(g,u+.29,w+.11,.46,.29,"#8c9f86",Math.floor(u*w),.034);
    }
    for(let u=root+1;u<x-headW*.45;u+=6.2){
      for(const side of [-1,1])pile(u,z+side*(walkW*.5-.16),.17);
      if(floor(u,z)<-.8)g.pole([u,-.10,z-walkW*.43],[u,top-.08,z+walkW*.43],.095,"#686d5f",5);
    }
    for(const ux of [x-headW*.5+.23,x+headW*.5-.23])for(const wz of [z-headD*.5+.25,z+headD*.5-.25])pile(ux,wz,.18);
    g.box((root+x)/2,top+.06,z,x-root,.12,walkW-.15,"#6e7662");
    g.box(x,top+.045,z,headW-.12,.17,headD-.12,"#5b6f67");
    for(let w=z-headD*.5+.19;w<z+headD*.5;w+=.64)g.box(x,top-.047,w,headW-.19,.036,.052,"#898365");
    for(const side of [-1,1]){
      const ux=x+side*(headW*.5-.27),wz=z+headD*.44,bed=floor(ux-1,wz+.92);
      strip(g,[[ux,top,wz],[ux-.28,top-.9,wz+.04],[ux-.42,bed*.74,wz+.19],[ux-1,bed+.08,wz+.92]],.027,"#808877",5);
    }
  }
  function raisedFace(g,outline,y,color){
    const c=outline.reduce((s,p)=>[s[0]+p[0]/outline.length,s[1]+p[1]/outline.length],[0,0]);
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      g.tri([c[0],y,c[1]],[a[0],y,a[1]],[b[0],y,b[1]],color);
    }
  }
  function keys(g){
    // An old hard-enamel motel fob and two stamped keys share a split brass ring.
    const outline=[[-.05,-.32],[-.155,-.17],[-.13,.10],[0,.20],[.13,.10],[.155,-.17],[.05,-.32]];
    raisedFace(g,outline,-.041,"#bfa579");
    raisedFace(g,outline.map(([u,w])=>[u*.89,w*.91]),-.028,"#367bb8");
    raisedFace(g,outline.map(([u,w])=>[u*.72,w*.73-.01]),-.018,"#62acc5");
    g.quad([-.083,-.008,-.034],[.083,-.008,-.034],[.083,-.008,-.009],[-.083,-.008,-.009],"#f7ddb1");
    g.quad([-.058,-.008,-.087],[.058,-.008,-.087],[.058,-.008,-.069],[-.058,-.008,-.069],"#f7ddb1");
    strip(g,circle((c,s)=>[c*.123,-.034+.029*s,.259+s*.123],13),.017,"#d9b575");
    for(const [ax,az,yaw] of [[-.112,.267,-1.86],[.106,.288,1.27]]){
      const p=frame(ax,-.030,az,yaw);
      strip(g,circle((c,s)=>p(c*.044,0,s*.052),8),.014,"#e2c78f",4);
      plank(g,p,-.021,-.01,.048,.021,.012,.24,"#e8c88e");
      for(const w of [.132,.204])plank(g,p,.012,-.009,w,.061,.011,w+.031,"#c9a168");
    }
  }
  function token(g){
    // The centre cut-out is really open, with a two-tone milled edge and ferry on the face.
    const n=22,outer=.178,inner=.035,at=(a,r,y)=>[Math.cos(a)*r,y+Math.sin(a)*r*.30,Math.sin(a)*r];
    for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n;
      g.quad(at(a,outer,-.036),at(b,outer,-.036),at(b,outer,.009),at(a,outer,.009),i%2?"#9a7d4e":"#bc975a");
      g.quad(at(a,outer,.012),at(b,outer,.012),at(b,outer*.83,.014),at(a,outer*.83,.014),"#eacc82");
      g.quad(at(a,outer*.83,.012),at(b,outer*.83,.012),at(b,inner,.012),at(a,inner,.012),"#c59850");
      g.quad(at(a,inner,.012),at(b,inner,.012),at(b,inner,-.029),at(a,inner,-.029),"#826b4b");
      if(i%2===0)g.quad(at(a,outer*.95,.021),at(a+.034,outer*.95,.021),at(a+.034,outer*.87,.021),at(a,outer*.87,.021),"#a18151");
    }
    const p=(x,z)=>[x,.023+z*.30,z];
    g.quad(p(-.09,-.051),p(.106,-.051),p(.076,-.086),p(-.054,-.086),"#f4d78d");
    g.quad(p(-.052,-.050),p(.047,-.050),p(.047,-.013),p(-.052,-.013),"#e5c27c");
    for(const x of [-.030,.010])g.quad(p(x,-.045),p(x+.017,-.045),p(x+.017,-.026),p(x,-.026),"#9b7c51");
    g.quad(p(-.067,.063),p(.066,.063),p(.066,.080),p(-.067,.080),"#e8c880");
  }
  function lure(g){
    const points=[[-.042,-.31],[-.086,-.18],[-.089,-.035],[-.070,.13],[-.026,.257],[.018,.303],[.064,.22],[.095,.042],[.079,-.13],[.043,-.28]];
    for(let i=0;i<points.length;i++){
      const [u,w]=points[i],[v,q]=points[(i+1)%points.length];
      g.tri([u,-.034,w],[v,-.034,q],[.01,.068,-.04],w>.15?"#e8bf9c":i>4?"#c85144":"#e57c62");
    }
    for(const w of [-.095,.016]){
      const p=(u,z)=>[u,.072-Math.abs(u)*.76,z];
      g.quad(p(-.067,w+.01),p(.069,w-.045),p(.071,w+.005),p(-.065,w+.065),"#e9c5a0");
    }
    strip(g,circle((c,s)=>[c*.039,-.029+.011*s,.306+s*.045],9),.010,"#c5b58a",4);
    strip(g,circle((c,s)=>[c*.035,-.030+.012*s,-.332+s*.043],9),.010,"#c5b58a",4);
    g.cyl(.025,.055,.121,.019,.021,.007,8,"#373f36");
  }
  const itemBuilders={keys,token,lure},landmarks={keys:bicycle,token:dinghy,lure:oysterBeds};
  const itemYaw={keys:-.66,token:1.18,lure:.73};
  function looseObject(g,site){
    const {x,z,id}=site,ground=floor(x,z),heading=itemYaw[id],cs=Math.cos(heading),sn=Math.sin(heading);
    const rx=id==="keys"?.27:id==="token"?.19:.105,rz=id==="token"?.19:.35;
    const base=sandColor(x,z,x-coast(z)),shadow=base.map((c,i)=>mix(c,[.27,.36,.32][i],.39));
    const pt=(u,w,ink)=>{
      const xx=x+cs*u+sn*w,zz=z-sn*u+cs*w;
      return [u,floor(xx,zz)-ground-.18+.063,w,...ink];
    };
    const centre=pt(.025,-.032,shadow),ring=circle((c,s)=>pt(.025+c*rx,-.032+s*rz,base),12);
    for(let i=1;i<ring.length;i++)g.vertices.push(...centre,...ring[i-1],...ring[i]);
    itemBuilders[id](g);
  }
  function glint(g){
    for(const a of [-.18,1.39]){
      const dx=Math.cos(a),dy=Math.sin(a),w=.025,l=.17;
      g.quad([-dx*l,-dy*l,0],[dy*w,-dx*w,0],[dx*l,dy*l,0],[-dy*w,dx*w,0],"#fbefbc");
    }
  }
  // A forked tail, narrow caudal peduncle and dark shoulder distinguish the silversides.
  const schoolShape=[[-.95,.15,-1.23,.76],[.78,.13,-.70,.88],[-.13,.04,-.16,1.05],
    [1.23,-.13,.48,.74],[-.66,.11,.91,.91],[.31,-.03,1.32,.80]];
  function fish(g,u,v,w,scale,beat){
    const p=(x,y,z)=>[u+scale*x,v+scale*y,w+scale*z],shift=Math.sin(beat)*.11;
    const noses=p(0,.023,.37),top=p(0,.117,.11),base=p(0,-.085,.12),topAft=p(0,.070,-.14),baseAft=p(0,-.056,-.16);
    const root=p(shift*.35,.016,-.29),end=p(shift,.032,-.46);
    for(const side of [-1,1]){
      const flank=p(side*.075,.023,.10),rear=p(side*.050,.010,-.145);
      g.tri(noses,top,flank,"#839d9b");g.tri(noses,flank,base,"#d6d6b6");
      g.quad(top,topAft,rear,flank,"#8da7a6");g.quad(base,flank,rear,baseAft,"#d3d5b9");
      g.tri(topAft,root,rear,"#90a59b");g.tri(baseAft,rear,root,"#c5c9aa");
      g.quad(p(side*.076,.035,.16),p(side*.071,.015,.16),
        p(side*.050,.010,-.145),p(side*.050,.031,-.145),"#e9e1bc");
      g.tri(p(side*.053,.047,.26),p(side*.059,.055,.212),p(side*.063,.022,.222),"#344b48");
    }
    g.tri(root,p(shift*1.21,.173,-.53),end,"#92a58f");g.tri(root,end,p(shift*1.19,-.148,-.51),"#aeb6a0");
    g.tri(top,p(0,.191,-.004),topAft,"#81988b");g.tri(baseAft,p(0,-.116,-.174),root,"#a0af97");
  }
  function schoolGeometry(g,phase){
    schoolShape.forEach(([x,y,z,size],i)=>fish(g,x,y,z,size,phase+i*.93));
  }
  const offshoreSchools=[[-158,18],[-102,48],[-68,15],[-9,54],[35,25],[67,81],[139,17],[167,67],
    [217,32],[258,64],[281,20],[345,47],[-142,124],[53,174],[222,106]];
  let schools=null;
  function shoals(){
    if(!schools){
      schools=BaySwimming.sites.map(s=>({x:s.x+2.25,z:s.z+2.67,near:true}));
      schools.push(...offshoreSchools.map(([z,d])=>({x:coast(z)+d,z,near:false})));
    }return schools;
  }
  function schoolPose(group,index,t){
    const a=t*(.113+(index%4)*.018)+index*1.73,rx=group.near?2.75:5.2,rz=group.near?2.1:4.1;
    const x=group.x+Math.cos(a)*rx,z=group.z+Math.sin(a)*rz;
    const bottom=floor(x,z),y=Math.min(-.57,bottom+1.08+.27*Math.cos(a*.63+index)+.11*Math.sin(t*.73));
    return {x,y,z,yaw:Math.atan2(-rx*Math.sin(a),rz*Math.cos(a)),roll:.045*Math.sin(t*2.72+index),
      frame:(Math.floor(t*6.4)+index)%4};
  }
  function ensure(name,build){
    if(!ready.has(name)&&registerModel){registerModel(name,build);ready.add(name);}
  }
  function install(model){
    if(registerModel!==model)ready.clear();
    registerModel=model;
  }
  const contains=(ids,id)=>ids?.includes(id)===true;
  function shimmer(i,t){return (t*1.18+i*1.31)%3.7<.24;}
  function world(view,list,eye,t,weather,found){
    if(!registerModel)return;
    for(const tile of sectors)if(eye.z>=tile.z-61&&eye.z<=tile.z+117){
      const name="reef-bed-"+tile.i;ensure(name,g=>bedGeometry(g,tile));view.draw(name);
    }
    for(const dock of BayMarina.docks)if(Math.abs(eye.z-dock.z)<48&&Math.abs(eye.x-dock.x)<62){
      const name="reef-pier-"+dock.id;ensure(name,g=>pierUnder(g,dock));view.draw(name);
    }
    for(const [i,site] of BaySwimming.sites.entries()){
      const d=Math.hypot(eye.x-site.x,eye.z-site.z);
      if(d>52)continue;
      const name="reef-place-"+site.id;ensure(name,g=>landmarks[site.id](g,site));view.draw(name);
      if(d>25||contains(found,site.id))continue;
      const item="reef-item-"+site.id,ground=floor(site.x,site.z);
      ensure(item,g=>looseObject(g,site));view.draw(item,site.x,ground+.18,site.z,itemYaw[site.id],0,0,.65);
      if(shimmer(i,t)){
        ensure("reef-glint",glint);view.draw("reef-glint",site.x,ground+.25,site.z,Math.atan2(eye.x-site.x,eye.z-site.z),0,0,.92);
      }
    }
    for(const [i,group] of shoals().entries()){
      if(Math.abs(group.x-eye.x)>30||Math.abs(group.z-eye.z)>30)continue;
      const p=schoolPose(group,i,t),name="reef-silversides-"+p.frame;
      ensure(name,g=>schoolGeometry(g,p.frame*tau/4));list.push([name,p.x,p.y,p.z,p.yaw,0,p.roll]);
    }
  }
  function canvas(w,h){
    const c=typeof OffscreenCanvas==="function"?new OffscreenCanvas(w,h):document.createElement("canvas");
    c.width=w;c.height=h;return c;
  }
  function underwaterInk(r,g,b,amount){
    return "rgb("+Math.round(mix(r,30,amount))+","+Math.round(mix(g,130,amount))+","+Math.round(mix(b,148,amount))+")";
  }
  function polygon(c,pts,color){
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fillStyle=color;c.fill();
  }
  function mapBed(tile){
    if(tile.map)return tile.map;
    const left=174,right=558,width=right-left,scale=2.5,h=56;
    const page=canvas(Math.ceil(width*scale),Math.ceil(h*scale)),c=page.getContext("2d");
    if(!c)return null;
    c.setTransform(scale,0,0,-scale,-left*scale,(tile.z+h)*scale);
    const shore=[];
    for(let z=tile.z;z<=tile.z+h;z+=2)shore.push([coast(z)-.6,z]);
    c.save();c.beginPath();c.moveTo(...shore[0]);for(const p of shore.slice(1))c.lineTo(...p);
    c.lineTo(right,tile.z+h);c.lineTo(right,tile.z);c.closePath();c.clip();
    // Keep the shallow drop and long tidal furrows visible at map scale.
    // Adjacent sectors share the exact world-space gradient and shoreline.
    for(let z=tile.z;z<tile.z+h;z+=2){
      const shoreX=coast(z+1),gradient=c.createLinearGradient(shoreX,0,shoreX+122,0);
      for(const u of [0,.11,.24,.45,.69,1]){
        const rgb=sandColor(shoreX+u*122,z+1,u*122);
        gradient.addColorStop(u,underwaterInk(rgb[0]*255,rgb[1]*255,rgb[2]*255,.31+.49*u));
      }
      c.fillStyle=gradient;c.fillRect(left,z-.05,width,2.11);
    }
    const env=habitat(tile);
    c.lineCap="round";
    for(const p of env.ripples){
      c.save();c.translate(p.x,p.z);c.rotate(p.angle);c.beginPath();c.moveTo(-p.len*.5,0);c.quadraticCurveTo(0,.39,p.len*.5,0);
      c.lineWidth=.13;c.strokeStyle="rgba(71,122,118,.36)";c.stroke();c.restore();
    }
    for(const p of env.tufts){
      const r=seeded(p.seed);
      c.fillStyle="rgba(60,106,91,.31)";c.beginPath();c.ellipse(p.x,p.z,p.rx*1.04,p.rz*1.09,.15,0,tau);c.fill();
      for(let j=0;j<22;j++){
        const a=r()*tau,d=Math.sqrt(r()),x=p.x+d*p.rx*Math.cos(a),z=p.z+d*p.rz*Math.sin(a);
        polygon(c,[[x-.085,z-.095],[x+.09,z],[x+.19+p.height*.5,z+.16-r()*.5]],j%3?"#698e79":"#88a486");
      }
    }
    for(const p of env.shells){c.fillStyle="#c0c2a1";c.fillRect(p.x,p.z,p.size*1.4,p.size);}
    c.restore();return tile.map={page,left,right,z:tile.z+h,width,height:h};
  }
  function planInk(data,i){
    const r=Math.min(255,Math.round(data[i+3]*247)),g=Math.min(255,Math.round(data[i+4]*248)),b=Math.min(255,Math.round(data[i+5]*246));
    const key=(r<<16)|(g<<8)|b;
    if(!paints.has(key))paints.set(key,underwaterInk(r,g,b,.14));
    return paints.get(key);
  }
  function planImage(key,build,yaw,density){
    if(printed.has(key))return printed.get(key);
    const mesh=new BayMesh();build(mesh);const data=mesh.vertices;
    const faces=[],sn=Math.sin(yaw),cs=Math.cos(yaw);
    let left=Infinity,right=-Infinity,low=Infinity,high=-Infinity;
    for(let i=0;i<data.length;i+=18){
      const pts=[];let h=0;
      for(let j=i;j<i+18;j+=6){
        const x=data[j]*cs+data[j+2]*sn,z=-data[j]*sn+data[j+2]*cs;
        pts.push([x,z]);h+=data[j+1];left=Math.min(left,x);right=Math.max(right,x);low=Math.min(low,z);high=Math.max(high,z);
      }
      const color=planInk(data,i);
      const difference=Math.abs(data[i+3]-data[i+9])+Math.abs(data[i+4]-data[i+10])+Math.abs(data[i+5]-data[i+11]);
      faces.push({pts,h,color,feather:difference>.00001});
    }
    left-=.05;right+=.05;low-=.05;high+=.05;
    const width=right-left,height=high-low,page=canvas(Math.ceil(width*density),Math.ceil(height*density)),c=page.getContext("2d");
    if(!c)return null;
    c.setTransform(page.width/width,0,0,-page.height/height,-left*page.width/width,high*page.height/height);
    faces.sort((a,b)=>a.h-b.h);
    for(const f of faces){
      let ink=f.color;
      if(f.feather){
        const [a,b,d]=f.pts;
        ink=c.createLinearGradient(a[0],a[1],(b[0]+d[0])*.5,(b[1]+d[1])*.5);
        ink.addColorStop(0,f.color.replace("rgb(","rgba(").replace(")",",.63)"));
        ink.addColorStop(1,"rgba(0,0,0,0)");
      }
      polygon(c,f.pts,ink);
    }
    const result={page,left,z:high,width,height};printed.set(key,result);return result;
  }
  function mapLight(ctx,tile,px,py,s,t,sun,visible){
    if(sun<.12||s<1.4)return;
    const ripples=habitat(tile).ripples;
    ctx.save();ctx.strokeStyle="#e0efcc";ctx.lineWidth=Math.max(.58,s*.045);ctx.lineCap="round";
    for(let i=2;i<ripples.length;i+=7){
      const p=ripples[i],phase=i*1.8+t*.65,x=px(p.x+Math.sin(phase)*.23),y=py(p.z+Math.cos(phase*.8)*.19);
      if(!visible(x,y,4*s))continue;
      const len=p.len*s,wave=(.18+.10*Math.sin(phase))*s;
      ctx.save();ctx.translate(x,y);ctx.rotate(-p.angle);ctx.globalAlpha=(.12+.085*Math.sin(phase))*sun;
      ctx.beginPath();ctx.moveTo(-len*.57,0);ctx.quadraticCurveTo(-len*.15,wave,len*.10,wave*.41);
      ctx.quadraticCurveTo(len*.32,-wave*.47,len*.60,0);ctx.stroke();ctx.restore();
    }ctx.restore();
  }
  function map(ctx,opt,px,py,s,visible){
    const t=opt.time||0,found=opt.found||opt.swimFound;
    const show=(print,x=0,z=0)=>{if(print)ctx.drawImage(print.page,px(x+print.left),py(z+print.z),print.width*s,print.height*s);};
    const reach=Math.hypot(ctx.canvas.width,ctx.canvas.height)/(2*s);
    const sun=(1-.78*(opt.weather?.night||0))*(1-.55*(opt.weather?.rain||0));
    for(const tile of sectors)if(Math.abs(tile.z+28-opt.cz)<=reach+28){
      show(mapBed(tile));mapLight(ctx,tile,px,py,s,t,sun,visible);
    }
    for(const dock of BayMarina.docks){
      if(!visible(px(dock.x-10),py(dock.z),32*s))continue;
      const a=px(dock.footX),b=px(dock.x),y=py(dock.z);
      ctx.fillStyle="rgba(46,79,76,.36)";ctx.fillRect(a,y-dock.walkW*.5*s,b-a,dock.walkW*s);
      ctx.fillRect(b-dock.headW*.5*s,y-dock.headD*.5*s,dock.headW*s,dock.headD*s);
      ctx.fillStyle="#586d61";const radius=Math.max(1,s*.17);
      for(let x=Math.max(dock.footX,coast(dock.z)-2)+1;x<dock.x-dock.headW*.45;x+=6.2)
        for(const side of [-1,1]){ctx.beginPath();ctx.arc(px(x),py(dock.z+side*(dock.walkW*.5-.16)),radius,0,tau);ctx.fill();}
    }
    for(const [i,site] of BaySwimming.sites.entries()){
      const x=px(site.x),y=py(site.z);if(!visible(x,y,9*s))continue;
      show(planImage("place-"+site.id,g=>landmarks[site.id](g,site),0,24));
      if(contains(found,site.id))continue;
      const print=planImage(site.id,itemBuilders[site.id],itemYaw[site.id],105);
      if(print){
        // A tiny salvage object still has its actual shape at the widest overhead zoom.
        const itemScale=Math.max(s,16),dx=print.left*itemScale,dy=print.z*itemScale;
        ctx.drawImage(print.page,x+dx,y-dy,print.width*itemScale,print.height*itemScale);
      }
      if(shimmer(i,t)){
        const r=Math.max(2.7,s*.18);ctx.fillStyle="#f8eab6";
        polygon(ctx,[[x-r,y],[x-.6,y-.65],[x,y-r],[x+.6,y-.65],[x+r,y],[x+.6,y+.65],[x,y+r],[x-.6,y+.65]],"#f8eab6");
      }
    }
    for(const [i,group] of shoals().entries()){
      if(!visible(px(group.x),py(group.z),9*s))continue;
      const p=schoolPose(group,i,t),x=px(p.x),y=py(p.z);
      ctx.save();ctx.translate(x,y);ctx.rotate(p.yaw);ctx.scale(s,-s);
      for(const [u,v,w,size] of schoolShape){
        const flick=Math.sin(t*7.3+i+w)*.07;
        polygon(ctx,[[u,w+.36*size],[u+.085*size,w+.06],[u+.018,w-.25],[u+flick+.085,w-.43],[u-.012+flick,w-.34],[u+flick-.08,w-.41],[u-.025,w-.24],[u-.08*size,w+.06]],"#c4d0b9");
      }ctx.restore();
    }
  }
  window.BayReefArt={install,world,map};
})();
