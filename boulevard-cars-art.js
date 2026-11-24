/* Two civilian bodies built in chassis coordinates, forward +Z. */
(() => {
  "use strict";
  const sides=[-1,1],turn=2*Math.PI,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
  const shapes={
    estate:{
      paint:"#879c78",wheel:.344,track:.966,axles:[-1.485,1.425],divider:.624,
      glass:[-2.206,-2.075,.448,1.060,.979,1.545,.845,.748],
      sections:[[-2.477,.853,.942],[-2.395,.923,.980],[-2.125,.948,.998],[-1.64,.962,1.000],
        [-1.15,.958,.992],[-.36,.948,.975],[.65,.943,.979],[1.26,.956,.982],[1.76,.950,.975],
        [2.116,.926,.951],[2.346,.897,.911],[2.453,.808,.874]]
    },
    stepside:{
      paint:"#759b9a",wheel:.39,track:.979,axles:[-1.405,1.355],divider:.135,
      glass:[-.809,-.730,.329,.973,1.072,1.729,.858,.734],
      sections:[[-2.369,.738,1.099],[-2.236,.820,1.105],[-1.994,.964,1.089],[-1.437,1.000,1.089],
        [-.925,.951,1.082],[-.823,.789,1.079],[-.761,.875,1.071],[-.56,.916,1.081],
        [.35,.928,1.085],[.925,.945,1.104],[1.30,.970,1.122],[1.765,.960,1.114],[2.105,.918,1.061],[2.280,.851,1.004]]
    }
  };
  const cockpitStyles={
    estate:{trim:"#75634b",top:"#66644f",pad:"#867355",cloth:"#b09a74",thread:"#ded0a2",edge:"#baa690",face:"#344642",ink:"#f2e6bb",accent:"#de995e",rim:"#695341",hub:"#5f5847",dash:"ribbon",spokes:2,stamp:"MARISMA ESTATE",limit:95},
    stepside:{trim:"#536e69",top:"#45615e",pad:"#65756c",cloth:"#86735d",thread:"#cdb58a",edge:"#bbc1ae",face:"#dfd4af",ink:"#323d38",accent:"#b15f3f",rim:"#55564a",hub:"#728477",dash:"work",spokes:3,stamp:"CORTEZ",limit:85}
  };
  const rubber="#262c32",dark="#303b3e",metal="#8d9a95",chrome="#c8cabc",bright="#e0ddc9",
    cream="#dfd9bd",glass="#496571",amber="#c28a4d",red="#a53a47",light="#ffefbd";
  const owns=kind=>Object.hasOwn(shapes,kind),wagon=s=>s===shapes.estate;
  function tint(from,to,ratio){
    const a=parseInt(from.slice(1),16),b=parseInt(to.slice(1),16);
    const component=n=>Math.round(mix((a>>n)&255,(b>>n)&255,ratio));
    return "#"+((component(16)<<16)|(component(8)<<8)|component(0)).toString(16).padStart(6,"0");
  }
  function section(s,z){
    const rows=s.sections;
    let i=1;while(i<rows.length-1&&rows[i][0]<z)i++;
    const a=rows[i-1],b=rows[i],u=clamp((z-a[0])/(b[0]-a[0]),0,1);
    return {w:mix(a[1],b[1],u),h:mix(a[2],b[2],u)};
  }
  function sideX(s,z,y){
    const {w,h}=section(s,z),base=wagon(s)?.284:.348;
    return w-.065*(1-clamp((y-base)/(h-base-.078),0,1));
  }
  function fit(s){
    const [rear,,,front,sill,roof]=s.glass;
    s.back=mix(rear,front,s.divider);s.hingeZ=front;s.hingeX=section(s,front).w-.016;
    s.handleZ=s.back+.138;s.handleY=sill-(wagon(s)?.108:.145);s.handleX=sideX(s,s.handleZ,s.handleY)+.027;
    s.grabZ=s.handleZ+.187;s.grabY=s.handleY-.039;s.grabX=s.hingeX-.134;
    s.seatZ=s.back+(wagon(s)?.210:.245);s.seatY=roof-(wagon(s)?.944:.977);s.seatX=wagon(s)?.436:.448;
    s.floorY=wagon(s)?.271:.368;s.halfLength=Math.max(-s.sections[0][0],s.sections.at(-1)[0]);
  }
  for(const s of Object.values(shapes))fit(s);
  function face(g,points,col){
    for(let i=1;i<points.length-1;i++)g.tri(points[0],points[i],points[i+1],col);
  }
  function endPlate(g,z,x,y,w,h,col){
    g.quad([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],col);
  }
  function endDisc(g,z,x,y,rx,ry,col,n=12){
    const at=a=>[x+rx*Math.cos(a),y+ry*Math.sin(a),z];
    for(let i=0;i<n;i++)g.tri([x,y,z],at(i*turn/n),at((i+1)*turn/n),col);
  }
  function square(g,x0,x1,y,z0,z1,col){
    g.quad([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],col);
  }
  function upright(g,side,x,z0,z1,y0,y1,col){
    g.quad([side*x,y0,z0],[side*x,y0,z1],[side*x,y1,z1],[side*x,y1,z0],col);
  }
  const letters={
    A:["05 02 10 20 31 35","03 33"],C:["30 10 01 04 15 35"],E:["30 00 05 35","03 23"],
    I:["00 20","10 15","05 25"],M:["05 00 13 30 35"],O:["10 20 31 34 25 15 04 01 10"],
    R:["05 00 20 31 32 23 03","13 35"],S:["30 10 01 02 23 34 25 05"],T:["00 30","20 25"],Z:["00 30 05 35"]
  };
  function badge(g,word,x,y,z,unit,back,col){
    const toPoint=(i,n)=>[x+(back?1:-1)*((i-(word.length-1)*.5)*5+Number(n[0])-1.5)*unit,y+(2.5-Number(n[1]))*unit,z];
    for(let i=0;i<word.length;i++)for(const stroke of letters[word[i]]||[]){
      const p=stroke.split(" ").map(n=>toPoint(i,n));
      for(let j=1;j<p.length;j++){
        const a=p[j-1],b=p[j],dx=b[0]-a[0],dy=b[1]-a[1],d=.34*unit/(Math.hypot(dx,dy)||1),ux=dy*d,uy=-dx*d;
        g.quad([a[0]-ux,a[1]-uy,z],[a[0]+ux,a[1]+uy,z],[b[0]+ux,b[1]+uy,z],[b[0]-ux,b[1]-uy,z],col);
      }
    }
  }
  const low=s=>wagon(s)?.288:.359;
  function arcHeight(s,z,axles=s.axles){
    const r=s.wheel+.039,gap=Math.min(...axles.map(a=>Math.abs(z-a)));
    return gap<=r+.000001?s.wheel+Math.sqrt(Math.max(0,r*r-gap*gap)):low(s);
  }
  function slices(s,start,end,marks,axles){
    const zs=[start,end,...s.sections.map(r=>r[0]),...marks];
    for(const a of axles){const r=s.wheel+.039;zs.push(a-r-.031,a+r+.031);
      for(let j=0;j<=8;j++)zs.push(a-r*Math.cos(j*Math.PI/8));}
    return zs.filter(z=>z>=start&&z<=end).sort((a,b)=>a-b).filter((z,i,a)=>!i||z-a[i-1]>.0001);
  }
  const innerW=s=>s.glass[6];
  function exterior(g,s,paint,doors){
    const estate=wagon(s),[rear,,,front]=s.glass,axles=estate?s.axles:[s.axles[1]];
    const end=s.sections.at(-1)[0],start=estate?s.sections[0][0]:-.815;
    const zs=slices(s,start,end,[s.back,rear,front,1.78],axles);
    const lightPaint=tint(paint,"#faeacd",.22),midPaint=tint(paint,"#e8e5c9",.085),lower=tint(paint,"#3b4443",.24);
    const deep=tint(paint,"#303b42",.48),grain=["#99764c","#ae8655","#ad8250","#936f4b"];
    for(let i=1;i<zs.length;i++){
      const a=zs[i-1],b=zs[i],z=(a+b)*.5,isDoor=z>s.back&&z<front,opening=z>rear&&z<front;
      for(const k of sides){
        const m=isDoor?doors[k]:g;
        function row(t){
          const {w,h}=section(s,t),toe=arcHeight(s,t,axles);
          const pt=(y,out=0)=>[k*(sideX(s,t,y)+out),y,t];
          const y1=h-.071,y2=h-.115,y3=Math.max(toe+.028,h-(estate?.351:.326));
          return [[k*(w-.065),h,t],pt(y1),pt(y2),pt(y3),pt(toe),[k*(sideX(s,t,toe)-.217),toe-.02,t]];
        }
        const p=row(a),q=row(b),col=[lightPaint,midPaint,estate?grain[1]:paint,lower,deep];
        for(let j=0;j<5;j++)m.quad(p[j],q[j],q[j+1],p[j+1],col[j]);
        if(arcHeight(s,z,axles)>low(s)+.01){
          const lip=v=>[v[0]+k*.007,v[1]+.026,v[2]];
          m.quad(p[4],q[4],lip(q[4]),lip(p[4]),estate?chrome:midPaint);
        }
        if(opening){
          m.quad(p[0],q[0],[k*innerW(s),q[0][1],b],[k*innerW(s),p[0][1],a],lightPaint);
        }else if(z>=front){
          const hood=(t,point,u)=>[point[0]*u,hoodHeight(estate?"estate":"stepside",point[0]*u,t),t];
          const bands=estate?[0,.64,.70,1]:[0,.31,.67,.74,1];
          for(let j=1;j<bands.length;j++)g.quad(hood(a,p[0],bands[j-1]),hood(a,p[0],bands[j]),hood(b,q[0],bands[j]),hood(b,q[0],bands[j-1]),j===2?midPaint:lightPaint);
        }else{
          m.quad(p[0],q[0],[0,q[0][1],b],[0,p[0][1],a],lightPaint);
        }
      }
    }
    // The painted molding follows the panel breaks. Only the bottom of the timber has to clear a tire.
    const trimCuts=[start,end,s.back,front,...s.sections.map(p=>p[0])];
    for(const z of axles)trimCuts.push(z-.34,z-.21,z,z+.21,z+.34);
    const trim=trimCuts.filter(t=>t>=start&&t<=end).sort((a,b)=>a-b).filter((t,i,v)=>!i||t-v[i-1]>.0001);
    const lines=estate?[[0,.067,chrome],[.08,.15,"#c7a274"],[.398,.421,grain[0]],[.65,.672,grain[2]],[.938,1,grain[3]]]:
      [[.14,.192,tint(paint,"#f5e9bf",.56)]];
    for(let i=1;i<trim.length;i++){
      const a=trim[i-1],b=trim[i],door=(a+b)/2>s.back&&(a+b)/2<front;
      const levels=t=>{const h=section(s,t).h;return [h-.115,Math.max(arcHeight(s,t,axles)+.028,h-(estate?.351:.326))];};
      const left=levels(a),right=levels(b);
      for(const k of sides){
        const pos=(t,v,f)=>{const y=mix(v[0],v[1],f);return [k*(sideX(s,t,y)+.006),y,t];};
        for(const [f0,f1,col] of lines)(door?doors[k]:g).quad(pos(a,left,f0),pos(b,right,f0),pos(b,right,f1),pos(a,left,f1),col);
      }
    }
    const {w,h}=section(s,end);endPlate(g,end,0,(h+low(s))/2,2*(w-.051),h-low(s),lower);
    if(estate){const p=s.sections[0];endPlate(g,p[0],0,(p[2]+low(s))/2,2*(p[1]-.041),p[2]-low(s),lower);}
    g.box(0,low(s)-.014,(start+end)*.5,s.track*1.54,.045,end-start-.07,dark);
  }
  function hoodHeight(kind,x,z){
    const s=shapes[kind],p=section(s,z),u=Math.min(1,Math.abs(x)/(p.w-.065));
    if(wagon(s))return p.h+.022*(1-u)+.016*Math.max(0,1-Math.abs(u-.64)/.07);
    return p.h+.105*(1-clamp((u-.31)/.43,0,1))+.010*(1-u);
  }
  function windows(g,s,paint,doors,windshield){
    const estate=wagon(s),[rear,rr,rf,front,sill,roof,base,cap]=s.glass;
    const capPaint=estate?cream:tint(paint,"#e8dfbf",.60),gasket="#334443";
    const side=(k,u,v,off=0)=>[k*(mix(base,cap,v)+off),mix(sill,roof,v),mix(mix(rear,front,u),mix(rr,rf,u),v)];
    const pane=(m,k,u0,u1,v0,v1,col,off=0)=>m.quad(side(k,u0,v0,off),side(k,u1,v0,off),side(k,u1,v1,off),side(k,u0,v1,off),col);
    const end=(frontEnd,u,v,off=0)=>[(u*2-1)*mix(base,cap,v),mix(sill,roof,v),mix(frontEnd?front:rear,frontEnd?rf:rr,v)+(frontEnd?1:-1)*off];
    const endPane=(m,dir,u0,u1,v0,v1,col,off=0)=>m.quad(end(dir,u0,v0,off),end(dir,u1,v0,off),end(dir,u1,v1,off),end(dir,u0,v1,off),col);
    for(const k of sides){
      const d=doors[k],b=s.divider;
      pane(g,k,0,b,0,1,estate?chrome:capPaint);
      if(estate){
        const fixedPane=(u0,u1,quarter)=>{
          pane(g,k,u0,u1,.06,.92,gasket,.004);pane(g,k,u0+.007,u1-.007,.105,.877,glass,.008);
          pane(g,k,u0+.009,u1-.008,.65,.865,"#6c9094",.011);
          face(g,[side(k,u0+.018,.175,.014),side(k,u0+.052,.175,.014),side(k,u0+(quarter?.13:.095),.838,.014),side(k,u0+(quarter?.093:.062),.838,.014)],"#799397");
        };
        fixedPane(.046,.305,true);fixedPane(.333,b-.017,false);
        pane(g,k,.307,.331,.075,.94,capPaint,.011);
      }else{
        pane(g,k,.019,b-.017,.16,.87,gasket,.006);pane(g,k,.032,b-.029,.23,.78,"#52767d",.010);
      }
      pane(d,k,b,1,0,.071,paint);pane(d,k,b+.003,.991,.072,.099,chrome,.006);
      pane(d,k,b,b+.018,.074,.961,estate?gasket:capPaint,.006);
      pane(d,k,.972,1,.060,.961,capPaint,.006);pane(d,k,b,1,.929,1,capPaint);
      const divider=estate?.934:.817;
      pane(d,k,divider,divider+.010,.092,.946,chrome,.010);
      pane(d,k,divider+.011,.971,.098,.923,"#739197",.003);
      pane(d,k,b+.022,divider-.004,.099,.198,"#6c8888",.003);
      pane(d,k,b+.024,divider-.005,.186,.202,bright,.005);
      pane(g,k,0,b,.976,1,bright,.007);pane(d,k,b,1,.976,1,bright,.007);
    }
    endPane(g,0,0,1,0,1,capPaint);
    const inset=estate?.057:.125;
    endPane(g,0,inset,1-inset,.072,.917,gasket,.004);
    endPane(g,0,inset+.015,.985-inset,.108,.879,glass,.008);
    endPane(g,0,inset+.018,.980-inset,.686,.87,"#637f82",.011);
    if(estate){
      for(const v of [.28,.39,.50,.61])endPane(g,0,inset+.023,.976-inset,v,v+.012,"#8b9080",.013);
      const wiper=[end(0,.56,.134,.022),end(0,.820,.158,.022),end(0,.866,.227,.022)];
      g.pole(wiper[0],wiper[1],.010,dark);g.pole(wiper[1],wiper[2],.009,dark);
    }else{
      for(const u of [.396,.602])endPane(g,0,u,u+.012,.11,.875,chrome,.012);
    }
    endPane(g,1,0,.031,0,1,capPaint);endPane(g,1,.969,1,0,1,capPaint);endPane(g,1,0,1,.94,1,capPaint);
    const m=windshield||g;
    endPane(m,1,.031,.970,.030,.951,gasket,.002);
    endPane(m,1,.047,.950,.058,.922,estate?"#63858e":"#709196",.005);
    endPane(m,1,.049,.948,.062,.177,estate?"#486874":"#536f76",.009);
    endPane(m,1,.048,.948,.783,.919,estate?"#517480":"#587c82",.009);
    face(m,[end(1,.106,.235,.013),end(1,.160,.235,.013),end(1,.421,.865,.013),end(1,.366,.865,.013)],"#86a4a3");
    for(const k of sides){
      const wiperA=end(1,k<0?.12:.53,.082,.014),wiperB=end(1,k<0?.40:.83,.178,.014);
      m.pole(wiperA,wiperB,.008,dark,4);
    }
    const roofRows=[[rr-.037,.962,.021],[rr+.095,1,.059],[rf-.073,1,.064],[rf+.025,.975,.020]];
    for(let i=1;i<roofRows.length;i++){
      const [za,wa,ha]=roofRows[i-1],[zb,wb,hb]=roofRows[i];
      for(const k of sides){
        const rim=(z,width,up,fract)=>[k*cap*width*fract,roof+up*(1-Math.max(0,(fract-.70)/.30)),z];
        g.quad(rim(za,wa,ha,0),rim(za,wa,ha,.74),rim(zb,wb,hb,.74),rim(zb,wb,hb,0),capPaint);
        g.quad(rim(za,wa,ha,.74),rim(za,wa,ha,1),rim(zb,wb,hb,1),rim(zb,wb,hb,.74),tint(capPaint,"#a79e8e",.18));
      }
    }
    for(const k of sides)g.box(k*cap,roof+.003,(rr+rf)*.5,.038,.025,rf-rr+.038,estate?chrome:bright);
  }
  function boatRope(g,x,y,z){
    const coil=[];
    for(let i=0;i<=37;i++){
      const u=i/37,a=u*turn*2.6;
      coil.push([x+(.172-.099*u)*Math.cos(a),z+(.132-.069*u)*Math.sin(a)]);
    }
    coil.push([x+.029,z-.155],[x+.088,z-.213]);
    const edges=coil.map((p,i)=>{
      const a=coil[Math.max(i-1,0)],b=coil[Math.min(i+1,coil.length-1)],dx=b[0]-a[0],dz=b[1]-a[1],d=.010/(Math.hypot(dx,dz)||1);
      return [[p[0]-dz*d,y,p[1]+dx*d],[p[0],y+.013,p[1]],[p[0]+dz*d,y,p[1]-dx*d]];
    });
    for(let i=1;i<edges.length;i++){
      const a=edges[i-1],b=edges[i];g.quad(a[0],a[1],b[1],b[0],"#cfb78b");g.quad(a[1],a[2],b[2],b[1],i%3?"#b79b70":"#b29768");
    }
  }
  function cargoBed(g,s,paint){
    const rear=-2.366,front=-.843,width=.733,y=.636,top=1.093;
    const edge=tint(paint,"#efdfc6",.22),inner=tint(paint,"#384e50",.43);
    g.box(0,.428,(rear+front)/2,1.47,.351,front-rear,inner);
    const timbers=["#99754e","#9c7d52","#a08358","#a88b5e","#92764d"];
    for(let i=0;i<9;i++){
      const x=(i-4)*.152;
      square(g,x-.072,x+.072,y,rear+.052,front-.036,timbers[i%5]);
      if(i%3===0)square(g,x-.042,x-.034,y+.001,rear+.094+i*.062,front-.18,"#826c48");
      for(const z of [rear+.072,front-.068])square(g,x+.043,x+.055,y+.003,z,z+.012,metal);
    }
    for(const k of sides){
      g.box(k*(width-.025),(top+y)/2,(rear+front)/2,.062,top-y,front-rear,paint);
      upright(g,k,width-.058,rear+.033,front-.039,y+.009,top-.025,inner);
      g.box(k*(width-.012),top,(rear+front)/2,.084,.039,front-rear+.01,edge);
      const axle=s.axles[0],fender=slices(s,axle-.666,axle+.664,[axle-.50,axle+.50,axle], [axle]);
      const profile=t=>{
        const u=Math.min(1,Math.abs(t-axle)/.666),rim=arcHeight(s,t,[axle]);
        const w=width+.026+.233*Math.sqrt(Math.max(0,1-u*u)),crest=.608+.362*(1-u*u);
        return [[k*(width-.016),crest+.051,t],[k*(width+(w-width)*.65),crest+.041,t],[k*(w-.018),crest,t],
          [k*w,Math.max(rim+.041,crest-.058),t],[k*(w-.009),rim,t],[k*(w-.11),rim-.005,t]];
      };
      for(let i=1;i<fender.length;i++){
        const a=profile(fender[i-1]),b=profile(fender[i]),tones=[edge,paint,tint(paint,"#e6ddbf",.14),paint,inner];
        for(let j=0;j<5;j++)g.quad(a[j],b[j],b[j+1],a[j+1],tones[j]);
      }
      // A pressed wheel tub rises inside the narrow stepside box.
      const sections=[[-.395,.646],[-.311,.782],[-.219,.830],[.225,.830],[.330,.756],[.394,.646]];
      for(let i=1;i<sections.length;i++){
        const [za,ha]=sections[i-1],[zb,hb]=sections[i];
        const tub=(x,h,z)=>[k*x,h,axle+z];
        g.quad(tub(.490,ha,za),tub(.675,ha+.005,za),tub(.675,hb+.005,zb),tub(.490,hb,zb),inner);
        g.quad(tub(.490,y+.002,za),tub(.490,ha,za),tub(.490,hb,zb),tub(.490,y+.002,zb),tint(inner,"#263735",.18));
      }
      for(const z of [rear+.102,front-.067]){
        g.pole([k*(width-.036),top+.015,z-.034],[k*(width-.036),top+.061,z-.034],.010,metal,4);
        g.pole([k*(width-.036),top+.061,z-.034],[k*(width-.036),top+.061,z+.034],.010,metal,4);
        g.pole([k*(width-.036),top+.061,z+.034],[k*(width-.036),top+.015,z+.034],.010,metal,4);
      }
      const stepZ=-.707;
      g.box(k*.817,.389,stepZ,.324,.071,.275,inner);
      for(let j=0;j<3;j++)g.box(k*(.733+j*.071),.430,stepZ,.021,.013,.240,"#7b867d");
    }
    g.box(0,(top+y)*.50,rear+.026,width*2-.012,top-y,.064,paint);
    g.box(0,(top+y)*.50,front-.024,width*2-.02,top-y,.055,inner);
    g.box(0,top,rear+.016,width*2+.014,.042,.096,edge);
    endPlate(g,rear-.009,0,.851,1.257,.237,tint(paint,"#364d49",.20));
    endPlate(g,rear-.013,0,.851,1.217,.210,paint);
    badge(g,"CORTEZ",0,.871,rear-.018,.020,true,tint(paint,"#e4d7ae",.69));
    g.box(.018,.994,rear-.021,.167,.044,.035,chrome);
    // A battered galvanized chest and bow line live against the headboard.
    g.box(-.113,.791,front-.213,.98,.295,.312,"#88908a");
    g.box(-.113,.948,front-.213,1.013,.040,.337,"#b1b2a3");
    for(const z of [front-.334,front-.275,front-.216,front-.157,front-.100])
      g.box(-.113,.975,z,.895,.010,.012,"#989e95");
    for(const k of sides){
      g.box(-.113+k*.359,.883,front-.374,.058,.071,.025,"#5d6a66");
      g.box(-.113+k*.359,.904,front-.391,.032,.043,.015,bright);
    }
    boatRope(g,.236,y+.015,-1.70);
    for(const [z,len] of [[-1.13,.19],[-1.68,.11]])g.box(-.675,.842,z,.016,.015,len,"#818c77");
  }
  function roofRack(g,s){
    const y=s.glass[5]+.064,front=-.005,rear=-1.862;
    for(const k of sides){
      g.pole([k*.605,y+.119,rear],[k*.605,y+.119,front],.022,chrome,6);
      for(const z of [rear+.053,-.95,front-.046]){
        g.box(k*.607,y+.002,z,.091,.026,.115,"#515a54");
        g.pole([k*.607,y+.012,z],[k*.605,y+.118,z+.016],.022,metal,5);
      }
    }
    for(const z of [rear+.077,-1.27,-.71,front-.081])g.box(0,y+.047,z,1.207,.035,.045,"#8e9b93");
    const wx=-.10,wz=-1.43,wy=y+.191;
    // A folded canvas beach chair under two webbing straps, back rail toward the hatch.
    for(const k of sides)g.pole([wx-.433,wy-.004,wz+k*.195],[wx+.433,wy-.004,wz+k*.195],.022,bright,6);
    g.box(wx,wy-.062,wz,.825,.074,.394,"#667e7c");
    g.box(wx,wy-.006,wz,.773,.075,.357,"#748f89");
    for(let j=-3;j<=3;j++){
      g.box(wx+j*.110,wy+.034,wz,.053,.008,.345,"#d2c9a5");
      if(j%2===0)g.box(wx+j*.110+.028,wy+.035,wz,.009,.009,.344,"#ad7f65");
    }
    for(const u of [-.283,.300]){
      g.box(wx+u,wy+.044,wz,.032,.008,.400,"#966846");
      for(const k of sides)g.box(wx+u,wy-.035,wz+k*.20,.032,.16,.014,"#9b7551");
      g.box(wx+u,wy+.052,wz+.121,.050,.012,.040,metal);
    }
  }
  function bumpers(g,s){
    const estate=wagon(s),front=s.sections.at(-1)[0],rear=s.sections[0][0];
    for(const dir of [-1,1]){
      const z=dir>0?front:rear,h=estate?.445:.427,span=dir<0&&!estate?.85:.945;
      const row=u=>[u, z+dir*(Math.abs(u)>.79?mix(.050,-.045,(Math.abs(u)-.79)/(span-.79)):.050)];
      const xs=[-span,-.79,-.39,.39,.79,span];
      for(let i=1;i<xs.length;i++){
        const [a,za]=row(xs[i-1]),[b,zb]=row(xs[i]);
        g.quad([a,h-.049,za],[b,h-.049,zb],[b,h+.047,zb],[a,h+.047,za],metal);
        g.quad([a,h+.047,za],[b,h+.047,zb],[b,h+.078,zb-.045*dir],[a,h+.078,za-.045*dir],chrome);
        if(estate)g.quad([a,h-.011,za+dir*.005],[b,h-.011,zb+dir*.005],[b,h+.014,zb+dir*.005],[a,h+.014,za+dir*.005],"#4e5752");
      }
      for(const k of sides){
        g.box(k*.665,h+.005,z+dir*.052,estate?.084:.067,.135,.062,estate?"#464d49":chrome);
        g.box(k*(span-.020),h+.006,z-dir*.074,.050,.106,.157,metal);
      }
    }
  }
  function grille(g,s,paint){
    const estate=wagon(s),z=s.sections.at(-1)[0]+.009;
    if(estate){
      endPlate(g,z,0,.692,1.642,.269,chrome);
      endPlate(g,z+.003,0,.690,.885,.220,dark);
      for(let j=0;j<5;j++)endPlate(g,z+.008,0,.607+j*.043,.852,.012,"#9baba1");
      for(const x of [-.329,-.215,-.105,.105,.215,.329])endPlate(g,z+.006,x,.685,.014,.18,metal);
      endPlate(g,z+.014,0,.686,.069,.127,chrome);endPlate(g,z+.016,0,.691,.039,.086,"#58716a");
      for(const k of sides)for(const x of [.556,.721]){
        endPlate(g,z+.006,k*x,.706,.145,.148,dark);
        endPlate(g,z+.009,k*x,.709,.121,.114,light);
        endPlate(g,z+.013,k*x,.666,.114,.017,"#bbc5b3");
      }
      const rear=s.sections[0][0]-.012;
      endPlate(g,rear,0,.738,1.730,.335,"#6c6f5f");
      endPlate(g,rear-.003,0,.780,1.447,.233,"#a58359");
      for(const k of sides){
        endPlate(g,rear-.008,k*.767,.739,.185,.251,rubber);
        endPlate(g,rear-.012,k*.768,.747,.156,.213,red);
        endPlate(g,rear-.016,k*.768,.736,.161,.013,"#c57a63");
      }
      g.box(0,.898,rear-.018,.234,.034,.027,chrome);
      badge(g,"MARISMA",-.318,.818,rear-.016,.009,true,bright);
    }else{
      endPlate(g,z,0,.790,1.682,.321,tint(paint,"#e9ddbd",.2));
      endPlate(g,z+.004,0,.766,1.101,.245,dark);
      for(const j of [-1,0,1]){
        endPlate(g,z+.010,0,.766+j*.066,1.064,.025,chrome);
        endPlate(g,z+.012,0,.773+j*.066,1.062,.007,bright);
      }
      for(const x of [-.398,.398])endPlate(g,z+.006,x,.761,.024,.21,metal);
      for(const k of sides){
        endDisc(g,z+.009,k*.687,.813,.158,.157,dark,14);endDisc(g,z+.012,k*.687,.813,.141,.137,chrome,14);
        endDisc(g,z+.015,k*.687,.817,.113,.111,light,14);
        endPlate(g,z+.018,k*.687,.773,.174,.014,"#d4d6b8");
      }
      endPlate(g,z+.014,0,.952,.346,.052,chrome);endPlate(g,z+.019,0,.950,.234,.024,"#738780");
      const rear=s.sections[0][0]-.023;
      for(const k of sides){
        g.box(k*.814,.701,rear+.060,.178,.043,.186,"#586762");
        endDisc(g,rear,k*.845,.756,.105,.105,dark);endDisc(g,rear-.004,k*.845,.756,.080,.080,red);
      }
    }
  }
  function signal(g,s,k,front,lit=true){
    const estate=wagon(s),col=lit?"#ffc372":amber;
    const z=(s.sections[front?s.sections.length-1:0][0])+(front?.029:-.044);
    if(estate)endPlate(g,z,k*(front?.685:.768),front?.533:.808,front?.185:.148,front?.045:.041,col);
    else if(front)endPlate(g,z,k*.686,.601,.166,.057,col);
    else endDisc(g,z,k*.845,.612,.055,.038,col,10);
  }
  function brakeLights(g,kind){
    const s=shapes[kind],estate=wagon(s),z=s.sections[0][0]-.046;
    for(const k of sides){
      if(estate)endPlate(g,z,k*.768,.717,.149,.130,"#ff6454");
      else endDisc(g,z,k*.845,.756,.076,.075,"#ff6454");
    }
  }
  function reverseLights(g,s,lit){
    const estate=wagon(s),z=s.sections[0][0]-(lit?.052:.034);
    for(const k of sides)endPlate(g,z,k*(estate?.635:.584),estate?.695:.493,estate?.060:.083,.054,lit?"#fff6cd":"#c8c5aa");
  }
  function ends(g,s,paint){
    grille(g,s,paint);bumpers(g,s);
    const z=s.sections[0][0]-.060,y=wagon(s)?.615:.509;
    endPlate(g,z,0,y,.354,.137,dark);endPlate(g,z-.003,0,y,.335,.116,"#dfd8ba");
    endPlate(g,z-.004,0,y+.043,.331,.020,"#78a69b");
    for(const k of sides){signal(g,s,k,true,false);signal(g,s,k,false,false);}
    reverseLights(g,s,false);
  }
  function cabin(g,s){
    const estate=wagon(s),style=estate?cockpitStyles.estate:cockpitStyles.stepside;
    const [rear,,,front,sill]=s.glass,base=s.seatY,z=s.seatZ,trim=style.trim,cloth=style.cloth;
    g.box(0,s.floorY-.018,(rear+front)/2,s.hingeX*1.84,.052,front-rear,"#504d43");
    if(estate){
      g.box(0,base-.04,-1.048,1.433,.150,.505,cloth);g.box(0,base+.155,-1.277,1.39,.385,.154,trim);
      g.box(0,base+.340,-1.301,1.37,.096,.152,cloth);
      square(g,-.734,.734,sill-.185,-2.198,-1.365,"#8a805e");
      for(const k of sides)g.box(k*.426,base+.438,-1.319,.222,.124,.099,cloth);
    }else{
      g.box(0,base-.050,z+.025,1.450,.136,.523,trim);
      g.box(0,base+.002,z+.047,1.413,.050,.481,cloth);
    }
    for(const k of sides){
      const x=k*s.seatX,w=estate?.460:.684,e=estate?.18:.285;
      if(estate){
        g.box(x,base-.035,z+.045,w,.113,.524,trim);
        g.box(x,base+.005,z+.065,.363,.061,.444,cloth);
      }
      for(const u of [-.10,0,.10])square(g,x+u-.005,x+u+.005,base+(estate?.037:.029),z-.103,z+.253,style.thread);
      const point=(shift,h,depth=0)=>[x+shift,base+h,z-.159-h*(estate?.22:.14)+depth];
      g.quad(point(-w*.49,.030),point(w*.49,.030),point(w*.455,.400),point(-w*.455,.400),trim);
      g.quad(point(-e,.075,.007),point(e,.075,.007),point(e*.94,.356,.007),point(-e*.94,.356,.007),cloth);
      for(const v of [.169,.263])g.quad(point(-e+.015,v,.010),point(e-.015,v,.010),point(e-.015,v+.008,.010),point(-e+.015,v+.008,.010),style.thread);
      if(estate)g.box(x,base+.437,z-.256,.235,.143,.118,cloth);
    }
    const dashZ=front-.137,dashY=sill-.079;
    g.box(0,dashY,dashZ,1.636,.180,.265,trim);
    g.box(0,dashY+.082,dashZ-.038,1.669,.060,.235,style.top);
    endPlate(g,dashZ-.139,0,dashY,1.505,.113,estate?"#926949":style.pad);
    endPlate(g,dashZ-.145,-s.seatX,dashY,.398,.100,style.edge);
    endPlate(g,dashZ-.149,-s.seatX,dashY,.377,.084,style.face);
    if(estate){
      endPlate(g,dashZ-.154,-s.seatX,dashY-.005,.335,.009,style.ink);
      for(let j=0;j<9;j++)endPlate(g,dashZ-.155,-s.seatX+(j-4)*.039,dashY+.012,.005,j%2?.012:.025,style.ink);
      endPlate(g,dashZ-.157,-s.seatX-.135,dashY,.009,.053,style.accent);
    }else for(const u of [-.114,0,.114]){
      endDisc(g,dashZ-.154,-s.seatX+u,dashY,.043,.039,style.ink,10);
      endDisc(g,dashZ-.156,-s.seatX+u,dashY,.035,.032,style.face,10);
      endPlate(g,dashZ-.158,-s.seatX+u-.007,dashY+.005,.018,.004,style.accent);
    }
    endPlate(g,dashZ-.149,.008,dashY,.175,.060,dark);
    for(const k of sides)endDisc(g,dashZ-.153,k*.117,dashY,.021,.021,chrome,8);
    const wheel=[-s.seatX,base+.338,z+.370],rim=a=>[wheel[0]+.163*Math.cos(a),wheel[1]+.148*Math.sin(a),wheel[2]+.055*Math.sin(a)];
    // A ribbon through the rim reads well at traffic scale and leaves the gauge faces visible.
    const inner=a=>[wheel[0]+.143*Math.cos(a),wheel[1]+.130*Math.sin(a),wheel[2]+.048*Math.sin(a)];
    for(let j=0;j<16;j++){const a=turn*j/16,b=turn*(j+1)/16;g.quad(rim(a),rim(b),inner(b),inner(a),style.rim);}
    for(const a of (estate?[.04*turn,.46*turn]:[0,turn*.5,turn*.75]))g.pole(wheel,inner(a),.010,style.edge,4);
    g.box(wheel[0],wheel[1],wheel[2],.099,.067,.047,style.hub);
    g.pole([-.394,base+.33,z+.425],[-.286,base+.398,z+.371],.009,chrome,5);
    g.box(-.281,base+.398,z+.371,.034,.027,.031,dark);
  }
  function fittings(g,s,paint,doors){
    const estate=wagon(s),[, , ,front,sill]=s.glass;
    const skin=estate?"#8f7857":"#708074",edge=estate?"#c2ae8a":"#acaf98";
    for(const k of sides){
      const d=doors[k],back=s.back+.013,nose=front-.017,bottom=s.floorY+.030,ix=s.hingeX-.064;
      upright(d,k,ix,back,nose,bottom,sill-.021,skin);
      upright(d,k,ix-.004,back+.076,nose-.067,bottom+.079,sill-.167,estate?"#a99571":"#8a8971");
      for(const v of [.05,.08])upright(d,k,ix-.009,back+.09,nose-.084,sill-.166-v,sill-.174-v,edge);
      for(const t of [back,nose]){
        const ex=sideX(s,t,sill-.055),hi=section(s,t).h-.014;
        d.quad([k*ix,bottom,t],[k*ex,bottom,t],[k*ex,hi,t],[k*ix,hi,t],t===back?tint(paint,dark,.23):skin);
      }
      d.box(k*(ix-.036),s.grabY-.047,s.grabZ,.067,.064,.340,skin);
      d.box(k*s.grabX,s.grabY,s.grabZ,.043,.033,.145,chrome);
      const handle=s.handleX;
      d.box(k*(handle-.014),s.handleY-.001,s.handleZ,.035,.044,.154,dark);
      d.box(k*handle,s.handleY+.009,s.handleZ,.032,.024,.148,bright);
      const mx=k*(s.hingeX+.098),mz=front-(estate?.19:.232),my=sill+.142;
      d.pole([k*(s.hingeX-.031),sill+.058,mz+.021],[mx,my-.005,mz-.009],.018,chrome,5);
      if(estate){
        d.box(mx+k*.044,my,mz-.014,.171,.099,.100,tint(paint,cream,.17));
        endPlate(d,mz-.066,mx+k*.044,my,.143,.074,"#94b1ac");
      }else{
        const cx=mx+k*.018;
        endDisc(d,mz-.010,cx,my+.007,.084,.071,chrome);
        endDisc(d,mz-.017,cx,my+.007,.067,.055,"#8ba7a4");
        endDisc(d,mz+.002,cx,my+.007,.076,.064,tint(paint,cream,.23));
      }
      g.box(k*(s.hingeX-.060),s.floorY+.012,(back+nose)/2,.113,.047,nose-back,chrome);
      if(estate){
        const seam=mix(s.glass[0],front,.316),h=sill-.105;
        for(const t of [seam,s.back-.013])g.pole([k*(sideX(s,t,.740)+.010),.740,t],[k*(sideX(s,t,h+.066)+.010),h+.066,t],.006,dark,4);
        g.box(k*(sideX(s,seam+.156,h)+.021),h,seam+.156,.038,.032,.146,chrome);
      }
    }
  }
  function wheel(g,s,k,x,y,z){
    const estate=wagon(s),r=s.wheel,n=14;
    const at=(out,rad,a)=>[x+k*out,y+rad*Math.sin(a),z+rad*Math.cos(a)];
    const ring=(o1,r1,o2,r2,col)=>{
      for(let i=0;i<n;i++){const a=turn*i/n,b=turn*(i+1)/n;g.quad(at(o1,r1*r,a),at(o1,r1*r,b),at(o2,r2*r,b),at(o2,r2*r,a),col);}
    };
    const fan=(out,rad,col)=>{
      for(let i=0;i<n;i++)g.tri([x+k*out,y,z],at(out,rad*r,turn*i/n),at(out,rad*r,turn*(i+1)/n),col);
    };
    ring(-.083,.85,-.067,1,"#333a3a");ring(-.067,1,.063,1,rubber);
    ring(.063,1,.087,.91,"#343b3b");ring(.087,.91,.089,.62,"#262e30");
    fan(-.083,.85,"#303737");
    if(estate){
      ring(.090,.805,.090,.745,"#d8d5bb");ring(.093,.657,.099,.585,bright);
      ring(.099,.585,.087,.484,"#84918b");fan(.088,.486,"#505a58");
      for(let j=0;j<8;j++){
        const a=j*turn/8;
        g.quad(at(.096,.205*r,a-.18),at(.099,.511*r,a-.15),at(.103,.503*r,a+.17),at(.110,.203*r,a+.13),chrome);
      }
      ring(.107,.235,.117,.176,bright);fan(.117,.176,"#90968b");
    }else{
      ring(.091,.674,.103,.606,"#c6c4b2");ring(.103,.606,.090,.542,"#82877a");
      fan(.091,.543,"#bac0aa");
      for(let j=0;j<5;j++){
        const a=turn*j/5;
        g.quad(at(.094,.398*r,a-.20),at(.094,.493*r,a-.17),at(.094,.493*r,a+.17),at(.094,.398*r,a+.20),"#606860");
        g.tri(at(.108,.186*r,a-.16),at(.109,.236*r,a),at(.108,.186*r,a+.16),bright);
      }
      ring(.097,.322,.118,.196,chrome);fan(.119,.196,"#85968b");
    }
  }
  function shiftOrigin(mesh,x,z){
    const a=mesh.vertices;for(let i=0;i<a.length;i+=6){a[i]-=x;a[i+2]-=z;}
  }
  function buildShell(g,s,paint,parts){
    const doors=parts?parts.doors:{[-1]:g,1:g};
    exterior(g,s,paint,doors);windows(g,s,paint,doors,parts?.windshield);cabin(g,s);
    if(wagon(s))roofRack(g,s);else cargoBed(g,s,paint);
    ends(g,s,paint);fittings(g,s,paint,doors);
    if(parts)for(const k of sides)shiftOrigin(doors[k],k*s.hingeX,s.hingeZ);
  }
  function build(g,s,paint,parts){
    buildShell(g,s,paint||s.paint,parts);
    for(const k of sides){
      if(parts)wheel(parts.wheels[k],s,k,0,0,0);
      else for(const z of s.axles)wheel(g,s,k,k*(s.track-.085),s.wheel,z);
    }
    if(parts){brakeLights(parts.brakes,wagon(s)?"estate":"stepside");reverseLights(parts.reverse,s,true);}
  }
  function driverEnds(g,kind,paint){
    const s=shapes[kind],mesh=new BayMesh();paint=paint||s.paint;
    exterior(mesh,s,paint,{[-1]:mesh,1:mesh});ends(mesh,s,paint);if(!wagon(s))cargoBed(mesh,s,paint);
    const a=mesh.vertices,[back,,,front]=s.glass;
    for(let i=0;i<a.length;i+=18){
      const zs=[a[i+2],a[i+8],a[i+14]];
      if(Math.min(...zs)<front-.0001&&Math.max(...zs)>back+.0001)continue;
      if(Math.max(a[i+1],a[i+7],a[i+13])<.35)continue;
      for(let j=i;j<i+18;j++)g.vertices.push(a[j]);
    }
  }
  const spriteCache=new Map();
  function atlasParts(v,s,paint){
    let stamp=0;if(v.damage)for(const panel of ["front","rear","left","right"])stamp=stamp*16+Math.round(clamp(v.damage[panel]||0,0,1)*15);
    const key=v.kind+paint+"/"+stamp,hit=spriteCache.get(key);
    if(hit)return hit;
    const shell=new BayMesh(),pair=()=>({[-1]:new BayMesh(),1:new BayMesh()});
    const parts={doors:pair(),brakes:new BayMesh(),reverse:new BayMesh()};
    buildShell(shell,s,paint,parts);brakeLights(parts.brakes,v.kind);reverseLights(parts.reverse,s,true);
    const sprite=BayDealerCars.sprite,bend=stamp&&window.BayBodyworkArt?.deformer?.(v);
    const result={body:sprite(shell,0,0,bend),door:{},brake:sprite(parts.brakes,0,0,bend),reverse:sprite(parts.reverse,0,0,bend),bend};
    for(const k of sides)result.door[k]=sprite(parts.doors[k],k*s.hingeX,s.hingeZ,bend);
    const points=[];
    for(const k of sides)for(const [z,w,h] of (k===-1?s.sections:[...s.sections].reverse())){
      const p=[k*w,.69*h,z];if(bend)bend(p[0],p[1],p[2],p);
      points.push([p[0]+.109,-p[2]+.129]);
    }
    result.shadow=points;
    if(spriteCache.size>=24)spriteCache.delete(spriteCache.keys().next().value);
    spriteCache.set(key,result);return result;
  }
  function polygon(c,pts,color){
    c.fillStyle=color;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fill();
  }
  function draw(c,p){if(p)c.drawImage(p.canvas,p.left,p.top,p.w,p.h);}
  function map(c,v,x,y,scale,t=0){
    const s=shapes[v.kind];if(!s||!(scale>0))return;
    const paint=v.color||s.paint,estate=wagon(s),nose=s.sections.at(-1)[0],rear=s.sections[0][0],
      lit=v.brakes>.18||v.handbrake>.48,flash=v.indicator&&(t+(Number.isFinite(v.id)?(v.id%13)*.071:0))%.84<.42;
    c.save();c.translate(x,y);c.rotate(v.yaw||0);c.scale(scale,scale);
    if(scale<3.5){
      const b=s.track;
      polygon(c,[[-b*.80,-nose],[b*.80,-nose],[b,-nose+.38],[b,-rear-.34],[b*.78,-rear],
        [-b*.78,-rear],[-b,-rear-.34],[-b,-nose+.38]],paint);
      const [r,rr,rf,f,,,base,cap]=s.glass;
      polygon(c,[[-base,-f],[base,-f],[cap,-rf],[-cap,-rf]],glass);
      c.fillStyle=estate?cream:"#a5b8ab";c.fillRect(-cap,-rf,2*cap,rf-rr);
      c.fillStyle=glass;c.fillRect(-cap,-rr,2*cap,rr-r+.089);
      if(!estate){
        c.fillStyle="#a18359";c.fillRect(-.600,.97,1.20,1.31);
        c.fillStyle="#aeb5a9";c.fillRect(-.610,.98,1.002,.292);
      }else{
        c.fillStyle="#a99064";for(const k of sides)c.fillRect(k*.811-.045,-.16,.09,2.02);
      }
      c.fillStyle=lit?"#ff7156":red;for(const k of sides)c.fillRect(k*.71-.073,-rear-.054,.146,.09);
      c.restore();return;
    }
    const art=atlasParts(v,s,paint);
    polygon(c,art.shadow,"#62665f");
    for(const k of sides)for(const z of s.axles){
      const flat=v.flatSide===k&&v.flatAxle===z;
      c.save();v.hydraulic?.mapWheel(c,v.yaw,k,z>0);c.translate(k*(s.track-.079),-z);
      if(z>0)c.rotate(v.steer||0);
      c.fillStyle=flat?"#574e44":rubber;
      c.fillRect(-.109,-s.wheel,.218+(flat?.049:0),s.wheel*2);c.restore();
    }
    v.hydraulic?.mapBody(c,v.yaw);draw(c,art.body);
    for(const k of sides){
      const open=Math.max(v.doorSide===k?v.doorAngle||0:0,k===1?v.passengerDoor||0:0);
      c.save();c.translate(k*s.hingeX,-s.hingeZ);c.rotate(-k*open);draw(c,art.door[k]);c.restore();
    }
    if(lit)draw(c,art.brake);if(v.reversing)draw(c,art.reverse);
    const point=[0,0,0];
    const mark=(x,h,z,w,d,col)=>{
      if(art.bend){art.bend(x,h,z,point);x=point[0];h=point[1];z=point[2];}
      c.fillStyle=col;c.fillRect(x-.037*h-w/2,-z-.109*h-d/2,w,d);
    };
    for(const k of sides){
      if(estate){
        for(const u of [.548,.752])mark(k*u,.723,nose-.010,.145,.035,v.damage?.front>.85?"#848579":light);
      }else mark(k*.684,.799,nose-.011,.120,.041,v.damage?.front>.85?"#74786e":light);
      if(lit)mark(k*(estate?.768:.845),estate?.717:.756,rear-.021,estate?.148:.133,.052,"#ff6553");
      if(v.reversing)mark(k*(estate?.635:.584),estate?.695:.493,rear-.01,.062,.044,"#fff5cd");
      if(flash&&v.indicator===k){
        mark(k*.685,estate?.533:.601,nose,.157,.071,"#ffb854");
        mark(k*(estate?.768:.845),estate?.808:.612,rear-.021,.128,.075,"#ffb854");
      }
    }
    if(scale>32&&v.plate){
      c.fillStyle=dark;c.textAlign="center";c.textBaseline="middle";c.font="bold .088px monospace";
      c.fillText(v.plate,-.020,-rear-.025,.294);
    }
    c.restore();
  }
  window.BayBoulevardCars={owns,shapes,cockpitStyles,fit,build,driverEnds,hoodHeight,brakeLights,signal,map};
})();
