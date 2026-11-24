/* Gull Street's two used cars. All working parts and drawings use the chassis axes, +Z forwards. */
(() => {
  "use strict";
  const sides=[-1,1],tau=Math.PI*2,mix=(a,b,f)=>a+(b-a)*f,clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const shapes={
    cayo:{
      paint:"#c66b48",track:.966,wheel:.337,axles:[-1.365,1.405],divider:.405,
      sections:[[-2.405,.793,.848],[-2.285,.904,.915],[-1.948,.952,.957],[-1.47,.959,.981],
        [-.96,.929,.919],[-.52,.909,.869],[.57,.916,.845],[1.405,.952,.867],[2.135,.927,.805],[2.40,.848,.763]],
      glass:[-1.803,-.861,-.120,.583,.886,1.376,.829,.668]
    },
    marea:{
      paint:"#549baf",track:.997,wheel:.324,axles:[-1.208,1.413],divider:.324,
      sections:[[-2.123,.848,.826],[-1.989,.945,.867],[-1.55,.982,.892],[-1.21,.985,.900],
        [-.78,.973,.824],[-.46,.915,.740],[.20,.914,.723],[.88,.957,.732],[1.41,.973,.752],
        [1.69,.933,.652],[1.979,.828,.545],[2.135,.645,.488]],
      glass:[-.833,-.537,.433,.995,.755,1.246,.800,.648]
    }
  };
  const cockpitStyles={
    cayo:{trim:"#715341",top:"#4a4540",pad:"#80634c",cloth:"#a6754f",thread:"#cca675",edge:"#bbba9e",face:"#35382f",ink:"#efe1b1",accent:"#d47e41",rim:"#844e34",hub:"#393a36",dash:"ribbon",spokes:3,stamp:"CAYO 72",limit:110},
    marea:{trim:"#343b43",top:"#303944",pad:"#414b54",cloth:"#577078",thread:"#91a5a0",edge:"#929da2",face:"#35393d",ink:"#e8e2c1",accent:"#dc7950",rim:"#363b3d",hub:"#454d53",dash:"three",spokes:3,stamp:"MAREA S",limit:140}
  };
  const owns=kind=>Object.hasOwn(shapes,kind);
  const ink="#283239",rubber="#242d32",smoke="#334751",alloy="#a5b1ac",bright="#d5d7c8",amber="#af6836",red="#a53a47",lamp="#ffefbd";
  function color(a,b,t){
    const A=parseInt(a.slice(1),16),B=parseInt(b.slice(1),16);let n=0;
    for(const shift of [0,8,16])n|=Math.round(mix(A>>shift&255,B>>shift&255,t))<<shift;
    return "#"+n.toString(16).padStart(6,"0");
  }
  function face(g,points,fill){
    for(let i=1;i<points.length-1;i++)g.tri(points[0],points[i],points[i+1],fill);
  }
  function section(s,z){
    const a=s.sections;let i=1;while(i<a.length-1&&z>a[i][0])i++;
    const p=a[i-1],q=a[i],f=clamp((z-p[0])/(q[0]-p[0]),0,1);
    return {w:mix(p[1],q[1],f),h:mix(p[2],q[2],f)};
  }
  const low=s=>s===shapes.cayo?.264:.222;
  function surfaceX(s,y,z){
    const {w,h}=section(s,z),fast=s===shapes.cayo;
    return w-(fast?.081:.060)*(1-clamp((y-low(s))/(h-low(s)-.092),0,1));
  }
  const sidePoint=(s,side,z,y,out=.010)=>[side*(surfaceX(s,y,z)+out),y,z];
  const deck=(s,x,z,lift=.006)=>[x,section(s,z).h+lift,z];
  function clipDeck(points,z,above){
    const out=[];
    for(let i=0;i<points.length;i++){
      const a=points[i],b=points[(i+1)%points.length],inside=above?a[1]>=z:a[1]<=z,next=above?b[1]>=z:b[1]<=z;
      if(inside)out.push(a);
      if(inside!==next)out.push([mix(a[0],b[0],(z-a[1])/(b[1]-a[1])),z]);
    }
    return out;
  }
  function topFace(g,s,points,fill,lift=.006){
    const zs=points.map(p=>p[1]),near=Math.min(...zs),far=Math.max(...zs);
    let rest=points;
    for(const row of s.sections){
      if(row[0]<=near||row[0]>=far)continue;
      face(g,clipDeck(rest,row[0],false).map(([x,z])=>deck(s,x,z,lift)),fill);
      rest=clipDeck(rest,row[0],true);
    }
    face(g,rest.map(([x,z])=>deck(s,x,z,lift)),fill);
  }
  const flank=(g,s,side,points,fill,out=.012)=>face(g,points.map(([z,y])=>sidePoint(s,side,z,y,out)),fill);
  function panelAt(s,g,doors,z,side){return z>s.back&&z<s.hingeZ?doors[side]:g;}
  function fit(s){
    s.back=mix(s.glass[0],s.glass[3],s.divider);s.hingeZ=s.glass[3];s.hingeX=section(s,s.hingeZ).w-.041;
    s.handleZ=s.back+.161;s.handleY=s.glass[4]-(s===shapes.cayo?.121:.108);
    s.handleX=surfaceX(s,s.handleY,s.handleZ)+.020;s.grabX=s.hingeX-.148;s.grabY=s.handleY-.035;s.grabZ=s.handleZ+.174;
    s.seatX=s===shapes.cayo?.424:.414;s.seatZ=s.back+(s===shapes.cayo?.248:.292);s.seatY=s.glass[5]-.927;
    s.floorY=s===shapes.cayo?.254:.197;s.halfLength=Math.max(-s.sections[0][0],s.sections.at(-1)[0]);
  }
  function opening(s,z){
    const r=s.wheel+.045,d=Math.min(...s.axles.map(a=>Math.abs(z-a)));
    return d<=r+.000001?s.wheel+Math.sqrt(Math.max(0,r*r-d*d)):low(s);
  }
  function stations(s){
    const list=[s.glass[0],s.back,s.hingeZ,...s.sections.map(a=>a[0])];
    for(const z of s.axles){const r=s.wheel+.045;list.push(z-r-.012,z+r+.012);
      for(let k=0;k<=10;k++)list.push(z+r*Math.cos(k*Math.PI/10));}
    return list.sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>.0002);
  }
  function body(g,s,paint,doors){
    const fast=s===shapes.cayo,rows=stations(s),base=low(s),sill=s.glass[6];
    const highlight=color(paint,"#ffe8bc",fast?.25:.20),light=color(paint,"#f5e1bc",.12);
    const crease=color(paint,"#343941",fast?.13:.21),shade=color(paint,"#263644",.34),deep=color(paint,"#232d38",.54);
    function sideRow(k,z){
      const {w,h}=section(s,z),toe=opening(s,z),width=y=>k*surfaceX(s,y,z);
      const shoulder=h-(fast?.077:.060),middle=clamp(fast?h-.152:h-.113,toe+.012,shoulder-.012);
      return [[k*(w-(fast?.084:.073)),h,z],[k*w,shoulder,z],[width(middle),middle,z],
        [width(toe+.031),toe+.031,z],[width(toe),toe,z]];
    }
    for(let i=1;i<rows.length;i++){
      const z0=rows[i-1],z1=rows[i],mid=(z0+z1)*.5,cut=mid>s.glass[0]&&mid<s.glass[3];
      for(const k of sides){
        const a=sideRow(k,z0),b=sideRow(k,z1),p=panelAt(s,g,doors,mid,k),colors=[highlight,light,crease,shade];
        for(let j=0;j<4;j++)p.quad(a[j],b[j],b[j+1],a[j+1],colors[j]);
        const under=(pt,del)=>[pt[0]-k*del,pt[1]-.006,pt[2]];
        p.quad(a[4],b[4],under(b[4],.182),under(a[4],.182),deep);
        if(opening(s,mid)>base){
          const lip=fast?alloy:color(paint,"#fff1ca",.28),u=a[4],v=b[4];
          p.quad([u[0]+k*.007,u[1]+.020,z0],[v[0]+k*.007,v[1]+.020,z1],[v[0]+k*.007,v[1]+.002,z1],[u[0]+k*.007,u[1]+.002,z0],lip);
        }
        const inner=cut?k*sill:0;
        (cut?p:g).quad(a[0],b[0],[inner,b[0][1],z1],[inner,a[0][1],z0],light);
      }
    }
    for(const end of [s.sections[0],s.sections.at(-1)]){
      const [z,w,h]=end;
      g.quad([-w+.079,base,z],[w-.079,base,z],[w,h-.075,z],[-w,h-.075,z],crease);
      g.quad([-w,h-.075,z],[w,h-.075,z],[w-.079,h,z],[-w+.079,h,z],highlight);
    }
    g.box(0,base-.019,.015,s.track*1.61,.07,s.halfLength*1.86,ink);
  }
  function windows(g,s,paint,doors,windshield){
    const fast=s===shapes.cayo,[rear,rr,rf,front,sill,roof,base,cap]=s.glass;
    const roofColor=color(paint,"#ffead2",fast?.16:.11);
    const at=(side,u,v,out=0)=>[side*(mix(base,cap,v)+out),mix(sill,roof,v),mix(mix(rear,front,u),mix(rr,rf,u),v)];
    const pane=(mesh,k,u0,u1,v0,v1,c,out=0)=>mesh.quad(at(k,u0,v0,out),at(k,u1,v0,out),at(k,u1,v1,out),at(k,u0,v1,out),c);
    const plane=(end,u,v,off)=>[mix(-1,1,u)*mix(base,cap,v),mix(sill,roof,v),(end?mix(front,rf,v):mix(rear,rr,v))+(end?1:-1)*off];
    const endPane=(mesh,end,u0,u1,v0,v1,c,off=0)=>mesh.quad(plane(end,u0,v0,off),plane(end,u1,v0,off),plane(end,u1,v1,off),plane(end,u0,v1,off),c);
    const divider=s.divider,ch=fast?alloy:ink;
    for(const k of sides){
      const door=doors[k];
      pane(g,k,0,divider,0,1,paint);
      if(fast){
        face(g,[at(k,.115,.115,.009),at(k,divider-.018,.115,.009),at(k,divider-.026,.879,.009),at(k,.229,.879,.009)],ch);
        face(g,[at(k,.14,.16,.012),at(k,divider-.036,.16,.012),at(k,divider-.044,.83,.012),at(k,.236,.83,.012)],"#425b61");
      }else{
        face(g,[at(k,.035,.055,.012),at(k,divider-.016,.055,.012),at(k,divider-.016,.91,.012)],ink);
        face(g,[at(k,.08,.095,.015),at(k,divider-.047,.095,.015),at(k,divider-.047,.73,.015)],"#50717c");
      }
      pane(door,k,divider,1,0,.095,paint);pane(door,k,divider+.012,.986,.075,.108,ch,.007);
      pane(door,k,divider,divider+.026,.095,1,ch,.006);pane(door,k,.959,1,.095,1,paint);
      pane(door,k,divider,1,.931,1,fast?ch:paint,.003);
      if(fast){pane(door,k,.859,.876,.104,.937,ch,.004);pane(door,k,.879,.957,.12,.922,"#6c9496");}
      else pane(door,k,divider+.027,.957,.109,.197,"#4c686f");
    }
    g.quad(at(-1,0,1),at(1,0,1),at(1,1,1),at(-1,1,1),roofColor);
    for(const k of sides)pane(g,k,0,1,.982,1,fast?bright:color(paint,"#dae7da",.27),.004);
    endPane(g,1,0,1,.014,.064,ch);
    endPane(g,1,0,.034,0,1,paint);endPane(g,1,.965,1,0,1,paint);
    endPane(g,1,.031,.969,0,.075,ink);endPane(g,1,.031,.969,.927,1,roofColor);
    const win=windshield||g;
    endPane(win,1,.034,.965,.067,.936,fast?"#729ba0":"#577e8b",.003);
    endPane(win,1,.039,.96,.07,.198,fast?"#506c75":"#3a5967",.007);
    endPane(win,1,.038,.961,.820,.928,fast?"#62858b":"#476975",.009);
    face(win,[plane(1,.07,.27,.010),plane(1,.154,.27,.010),plane(1,.43,.91,.010),plane(1,.371,.91,.010)],fast?"#87a8a7":"#73949c");
    endPane(g,0,0,1,0,1,fast?alloy:ink);endPane(g,0,.032,.966,.054,.94,fast?"#425b65":"#3c505d",.007);
    if(fast){
      endPane(g,0,.041,.96,.78,.87,"#607f87",.010);
      for(const v of [.30,.42,.54,.66])endPane(g,0,.055,.946,v,v+.012,"#718286",.012);
    }else{for(const v of [.24,.49,.74])endPane(g,0,.05,.955,v,v+.050,"#344047",.014);}
  }
  const badgeLetters={
    C:["30 10 01 04 15 35"],A:["05 01 10 20 31 35","03 33"],Y:["00 12 30","12 15"],
    O:["10 20 31 34 25 15 04 01 10"],M:["05 00 13 30 35"],R:["05 00 20 31 32 23 03","13 35"],
    E:["30 00 05 35","02 22"],S:["30 10 01 02 23 34 25 05"],"7":["00 30 15"],"2":["00 20 31 32 04 05 35"]
  };
  function lettering(g,z,cx,y,unit,word,fill,end=1){
    const at=(x,h)=>[cx+end*x,y+h,z];
    for(let i=0;i<word.length;i++)for(const path of badgeLetters[word[i]]||[]){
      const points=path.split(" ").map(v=>at(((i-(word.length-1)*.5)*5+Number(v[0])-1.5)*unit,(2.5-Number(v[1]))*unit));
      for(let j=1;j<points.length;j++){
        const p=points[j-1],q=points[j],dx=q[0]-p[0],dy=q[1]-p[1],h=.30*unit/(Math.hypot(dx,dy)||1),ox=dy*h,oy=-dx*h;
        g.quad([p[0]-ox,p[1]-oy,z],[p[0]+ox,p[1]+oy,z],[q[0]+ox,q[1]+oy,z],[q[0]-ox,q[1]-oy,z],fill);
      }
    }
  }
  const plate=(g,z,x0,x1,y0,y1,c)=>g.quad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],c);
  function sealed(g,x,y,z,r,c,n=12){
    const p=i=>[x+r*Math.cos(i*tau/n),y+r*Math.sin(i*tau/n),z];
    for(let i=0;i<n;i++)g.tri([x,y,z],p(i),p(i+1),c);
  }
  function chromeBumper(g,s,front){
    const z=s.sections[front?s.sections.length-1:0][0],sign=front?1:-1;
    const ring=[[-.895,z-sign*.193],[-.876,z-sign*.023],[-.72,z+sign*.047],[.72,z+sign*.047],[.876,z-sign*.023],[.895,z-sign*.193]];
    for(let i=1;i<ring.length;i++){
      const [x,a]=ring[i-1],[u,b]=ring[i],pt=(x,z,y)=>[x,y,z];
      g.quad(pt(x,a,.325),pt(u,b,.325),pt(u,b,.386),pt(x,a,.386),alloy);
      g.quad(pt(x,a,.387),pt(u,b,.387),pt(u,b-sign*.039,.413),pt(x,a-sign*.039,.413),bright);
    }
    for(const k of sides)g.box(k*.529,.371,z+sign*.055,.056,.125,.040,"#414647");
  }
  function scoop(s,k){
    return [deck(s,k*.218,.840,.016),deck(s,k*.472,.865,.016),deck(s,k*.463,1.398,.075),deck(s,k*.273,1.437,.078)];
  }
  function cayoEnds(g,s,paint){
    const f=s.sections.at(-1)[0],r=s.sections[0][0],z=f+.008;
    face(g,[[-.82,.47,z],[-.82,.723,z],[-.66,.745,z],[.66,.745,z],[.82,.723,z],[.82,.47,z]],alloy);
    face(g,[[-.80,.49,z+.003],[-.797,.705,z+.003],[-.65,.727,z+.003],[.65,.727,z+.003],[.797,.705,z+.003],[.80,.49,z+.003]],ink);
    for(let n=0;n<4;n++)plate(g,z+.006,-.34,.34,.522+n*.046,.529+n*.046,"#6b7371");
    for(const k of sides)for(const offset of [.469,.693]){
      const cx=k*offset;sealed(g,cx,.625,z+.008,.103,bright,14);sealed(g,cx,.625,z+.011,.088,"#677779",14);
      sealed(g,cx,.625,z+.015,.073,lamp,14);plate(g,z+.017,cx-.049,cx+.049,.613,.619,"#c7c8ac");
    }
    g.quad([-.055,.635,z+.011],[0,.671,z+.011],[.055,.635,z+.011],[0,.603,z+.011],"#d49a54");
    topFace(g,s,[[-.185,.744],[-.120,2.18],[-.080,2.30],[-.090,.751]],color(paint,"#f8d6ac",.32),.009);
    topFace(g,s,[[.092,.751],[.081,2.30],[.121,2.18],[.185,.744]],color(paint,"#633c39",.27),.010);
    for(const k of sides){
      const [a,b,c,d]=scoop(s,k);
      g.quad(a,b,c,d,color(paint,"#e6c49d",.32));
      const inner=deck(s,k*.269,1.446,.011),outer=deck(s,k*.465,1.409,.013);
      g.quad(c,d,inner,outer,ink);g.tri(a,d,inner,color(paint,"#8c5c46",.29));g.tri(b,c,outer,color(paint,"#9b6047",.23));
      topFace(g,s,[[k*.685,.734],[k*.729,1.58],[k*.695,2.197],[k*.681,2.20],[k*.710,1.58]],color(paint,"#552f2c",.44),.015);
      for(let j=0;j<4;j++){
        const x=k*(.09+j*.059);
        topFace(g,s,[[x,.659],[x+k*.026,.660],[x+k*.033,.731],[x+k*.009,.741]],ink,.012);
      }
    }
    const aft=r-.009;
    face(g,[[-.775,.567,aft],[-.73,.777,aft],[.73,.777,aft],[.775,.567,aft]],"#474743");
    for(const k of sides){
      for(let i=0;i<3;i++){
        const x=k*(.362+i*.127);
        plate(g,aft-.004,x-.055,x+.055,.614,.734,alloy);
        plate(g,aft-.008,x-.045,x+.045,.624,.726,red);
        plate(g,aft-.010,x-.036,x+.036,.686,.709,"#c75e55");
      }
      plate(g,aft-.007,k*.246-.029,k*.246+.029,.647,.704,"#d4d2b8");
      g.box(k*.641,.222,r+.055,.130,.075,.148,steelPipe);
      plate(g,r-.023,k*.641-.052,k*.641+.052,.201,.242,ink);
    }
    for(const front of [false,true])chromeBumper(g,s,front);
    lettering(g,z+.014,0,.461,.010,"CAYO",bright);
    lettering(g,aft-.010,.378,.797,.0062,"72",bright,-1);
    topFace(g,s,[[-.80,-2.307],[.80,-2.307],[.76,-2.364],[-.76,-2.364]],color(paint,"#fff0c8",.29),.024);
  }
  const steelPipe="#768484";
  function mareaEnds(g,s,paint){
    const f=s.sections.at(-1)[0],r=s.sections[0][0];
    face(g,[[-.575,.269,f+.004],[-.489,.405,f+.004],[.489,.405,f+.004],[.575,.269,f+.004]],ink);
    plate(g,f+.008,-.432,.432,.315,.331,"#4d5b60");
    for(const k of sides){
      const pod=[[.491,1.902],[.819,1.804],[.905,1.525],[.573,1.598]].map(([x,z])=>[k*x,z]);
      topFace(g,s,pod,ink,.015);
      topFace(g,s,[[k*.512,1.871],[k*.793,1.784],[k*.835,1.689],[k*.540,1.766]],lamp,.019);
      topFace(g,s,[[k*.555,1.728],[k*.846,1.655],[k*.867,1.579],[k*.573,1.645]],"#9cbbc0",.018);
      topFace(g,s,[[k*.802,1.799],[k*.842,1.790],[k*.901,1.560],[k*.881,1.565]],amber,.021);
      topFace(g,s,[[k*.719,1.068],[k*.746,1.066],[k*.556,1.753],[k*.539,1.758]],color(paint,"#354c58",.36),.009);
      topFace(g,s,[[k*.703,1.064],[k*.716,1.066],[k*.535,1.758],[k*.523,1.756]],color(paint,"#cceee7",.37),.012);
      const skirt=[[k*.56,.207,f+.015],[k*.705,.211,f-.056],[k*.924,.208,f-.268],[k*.873,.244,f-.262],[k*.660,.242,f-.049]];
      face(g,skirt,"#3b4448");
      topFace(g,s,[[k*.37,-.913],[k*.70,-.945],[k*.71,-1.816],[k*.493,-1.879]],color(paint,"#353e49",.22),.012);
      const a=[k*.655,1.210,-.533],b=[k*.682,1.194,-.556],c=deck(s,k*.883,-1.743,.012),d=deck(s,k*.74,-1.508,.015);
      g.quad(a,b,c,d,color(paint,"#d4e8e3",.21));
      g.quad(b,c,deck(s,k*.932,-1.689,.009),[k*.814,.823,-.800],color(paint,"#425461",.16));
      g.tri(a,d,deck(s,k*.621,-.846,.003),"#42575f");
    }
    topFace(g,s,[[-.522,-.868],[.522,-.868],[.567,-1.910],[-.567,-1.910]],ink,.013);
    topFace(g,s,[[-.471,-.905],[.471,-.905],[.487,-1.224],[-.487,-1.224]],"#425963",.022);
    for(const k of sides){
      topFace(g,s,[[k*.102,-.955],[k*.315,-.970],[k*.365,-1.169],[k*.128,-1.185]],"#8a7968",.027);
      for(let j=0;j<3;j++){
        const z=-.995-.070*j;topFace(g,s,[[k*.028,z],[k*.15,z-.008],[k*.158,z-.030],[k*.030,z-.022]],"#a9b6ac",.029);
      }
    }
    topFace(g,s,[[-.43,-.933],[-.378,-.935],[.441,-1.196],[.388,-1.199]],"#687d80",.033);
    for(let i=3;i<8;i++){
      const z=-.915-i*.121,w=.497+i*.006;
      const a=deck(s,-w,z,.044),b=deck(s,w,z,.044),c=deck(s,w+.004,z-.072,.020),d=deck(s,-w-.004,z-.072,.020);
      g.quad(a,b,c,d,i%2?"#566267":"#5e696c");
      g.quad(a,b,[b[0],b[1]-.022,b[2]],[a[0],a[1]-.022,a[2]],"#85908c");
    }
    const lip=color(paint,"#dcebe2",.23);
    g.quad([-.815,.881,r+.12],[.815,.881,r+.12],[.851,.909,r+.020],[-.851,.909,r+.020],lip);
    g.quad([-.851,.909,r+.018],[.851,.909,r+.018],[.829,.86,r+.012],[-.829,.86,r+.012],paint);
    const aft=r-.011;
    plate(g,aft,-.817,.817,.583,.770,ink);
    for(const k of sides){
      plate(g,aft-.004,k*.712-.092,k*.712+.092,.610,.716,red);
      plate(g,aft-.004,k*.473-.121,k*.473+.121,.610,.716,red);
      plate(g,aft-.006,k*.312-.027,k*.312+.027,.634,.689,"#cfccc2");
      for(const y of [.637,.670,.695])plate(g,aft-.008,k*.573-.225,k*.573+.225,y,y+.009,"#343a41");
      g.box(k*.584,.263,r+.008,.246,.091,.088,steelPipe);
      plate(g,r-.038,k*.584-.098,k*.584+.098,.238,.284,ink);
    }
    lettering(g,aft-.009,-.49,.791,.0076,"MAREA",bright,-1);
    lettering(g,aft-.010,-.666,.791,.010,"S","#df9674",-1);
    g.quad([-.049,.509,f-.120],[.038,.510,f-.124],[.019,.516,f-.063],[-.033,.517,f-.086],"#d58352");
  }
  function mirror(g,s,k,paint){
    const classic=s===shapes.cayo,x=k*(s.track+.072),z=s.hingeZ-(classic?.174:.233),y=s.glass[4]+.091;
    g.pole([k*(s.hingeX-.020),y-.079,z+.019],[x-k*.057,y-.012,z],classic?.024:.036,classic?alloy:ink,5);
    const a=(u,v,w)=>[x+k*u,y+v,z+w];
    const ring=classic?[[-.094,.023],[-.059,.061],[.054,.061],[.087,.031],[.084,-.024],[.048,-.048],[-.073,-.044]]:
      [[-.094,.043],[.036,.054],[.116,.016],[.101,-.037],[-.061,-.030],[-.098,-.014]];
    const rear=ring.map(([u,v])=>a(u,v,-.053)),end=ring.map(([u,v])=>a(u*.78,v*.78,.048));
    face(g,end,classic?alloy:paint);face(g,rear,classic?bright:ink);
    for(let i=0;i<ring.length;i++)g.quad(rear[i],rear[(i+1)%ring.length],end[(i+1)%ring.length],end[i],i<2?classic?bright:color(paint,"#e3ecdd",.23):classic?alloy:paint);
    face(g,ring.map(([u,v])=>a(u*.84,v*.76,-.056)),"#a4bfc1");
  }
  function sideTrim(g,s,paint,doors){
    const classic=s===shapes.cayo;
    for(const k of sides){
      const d=doors[k],outer=(z,y)=>sidePoint(s,k,z,y,.015);
      const trim=color(paint,classic?"#ead6a7":"#c7e2db",classic?.67:.33);
      const zs=classic?[-2.15,-1.83,-1.39,-.97,s.back,-.42,.20,s.hingeZ,.96,1.48,1.94]:[-1.79,-1.38,-.81,s.back,.53,s.hingeZ,1.37,1.68];
      const ys=classic?[.867,.898,.913,.868,.842,.807,.788,.781,.787,.807,.774]:[.737,.752,.697,.661,.638,.63,.664,.596];
      for(let i=1;i<zs.length;i++){
        const mesh=panelAt(s,g,doors,(zs[i-1]+zs[i])/2,k),a=zs[i-1],b=zs[i],y=ys[i-1],w=ys[i];
        mesh.quad(outer(a,y),outer(b,w),outer(b,w+.011),outer(a,y+.011),trim);
        if(classic&&b<=s.back)mesh.quad(outer(a,y-.023),outer(b,w-.023),outer(b,w-.017),outer(a,y-.017),alloy);
      }
      const y=s.handleY,z=s.handleZ;
      if(classic){
        flank(d,s,k,[[z-.088,y-.014],[z+.093,y-.014],[z+.118,y+.023],[z-.082,y+.031]],"#776858",.015);
        flank(d,s,k,[[z-.085,y+.007],[z+.103,y+.007],[z+.095,y+.030],[z-.076,y+.036]],bright,.022);
        g.pole(sidePoint(s,k,s.back-.23,.595,.010),sidePoint(s,k,s.back-.211,.606,.012),.010,bright,5);
        for(let j=0;j<3;j++){
          const p=s.back-.18-j*.066;
          flank(g,s,k,[[p,.608],[p+.026,.611],[p-.020,.677],[p-.048,.672]],alloy,.014);
        }
      }else{
        flank(d,s,k,[[z-.065,y-.022],[z+.120,y-.022],[z+.145,y+.028],[z-.043,y+.031]],ink,.018);
        flank(d,s,k,[[z-.037,y+.004],[z+.093,y+.004],[z+.104,y+.017],[z-.029,y+.020]],alloy,.024);
        const left=s.back-.033;
        flank(g,s,k,[[left,.732],[-.921,.770],[-.789,.646],[-.69,.489],[left-.10,.426]],ink,.019);
        flank(g,s,k,[[left-.052,.704],[-.839,.739],[-.744,.681],[left-.061,.650]],"#52646a",.023);
        flank(g,s,k,[[left-.054,.599],[-.713,.628],[-.678,.601],[left-.060,.573]],"#66777a",.024);
        flank(d,s,k,[[s.back+.02,.354],[.81,.365],[.677,.396],[s.back+.045,.393]],color(paint,"#232c37",.48),.015);
        g.quad(outer(s.back,.297),outer(.83,.303),outer(.883,.327),outer(s.back,.320),trim);
      }
      const ix=k*(s.hingeX-.065),bottom=s.floorY+.035,back=s.back+.015,front=s.hingeZ-.016;
      d.quad([ix,bottom,back],[ix,bottom,front],[ix,s.glass[4]-.022,front],[ix,s.glass[4]-.022,back],classic?"#775a47":"#414a50");
      d.box(ix-k*.035,s.grabY-.045,s.grabZ,.063,.064,.332,classic?"#946d51":"#53626a");
      d.box(k*s.grabX,s.grabY,s.grabZ,.034,.035,.139,classic?alloy:"#a0a7a4");
      g.box(k*(s.hingeX-.05),s.floorY+.020,(front+back)/2,.107,.054,front-back,classic?alloy:"#78878b");
      mirror(d,s,k,paint);
    }
  }
  function wheel(g,s,k,x,y,z){
    const classic=s===shapes.cayo,r=s.wheel,n=16;
    const pt=(push,radius,a)=>[x+k*push,y+radius*Math.sin(a),z+radius*Math.cos(a)];
    const ring=(u,ra,v,rb,tone)=>{
      for(let i=0;i<n;i++){const a=tau*i/n,b=tau*(i+1)/n;g.quad(pt(u,ra,a),pt(u,ra,b),pt(v,rb,b),pt(v,rb,a),typeof tone==="string"?tone:tone(i));}
    };
    ring(-.085,r*.88,-.067,r,"#303638");ring(-.067,r,.060,r,i=>i%2?"#2c3336":"#30383a");
    ring(.060,r,.085,r*.91,"#333b3d");ring(.085,r*.91,.085,r*.69,rubber);
    if(classic){
      ring(.086,r*.803,.086,r*.783,"#c0b5a2");
      ring(.086,r*.667,.096,r*.614,bright);ring(.096,r*.614,.078,r*.49,"#818981");
    }else{
      ring(.086,r*.752,.091,r*.724,"#bec9c6");ring(.091,r*.724,.079,r*.643,"#717d81");
    }
    const hub=classic?.086:.069,metallic=classic?"#b8b2a0":"#a9b2b2";
    const spokes=classic?5:8,inner=classic?.215:.175,outer=classic?.558:.674;
    for(let j=0;j<spokes;j++){
      const a=tau*j/spokes,b=a+tau/spokes;
      face(g,[[x+k*.078,y,z],pt(.078,r*(classic?.540:.675),a),pt(.078,r*(classic?.540:.675),(a+b)/2),pt(.078,r*(classic?.540:.675),b)],"#414a4a");
      const left=a+(classic?-.32:-.17),right=a+(classic?.32:.16);
      const bow=classic?.08:.23;
      face(g,[pt(hub+.010,r*inner,left),pt(.091,r*outer,left+bow),pt(.097,r*(outer+.012),a+bow),pt(.096,r*outer,right+bow),pt(hub+.010,r*inner,right)],metallic);
      g.tri(pt(hub+.013,r*inner,a),pt(.099,r*outer,a+bow),pt(.097,r*outer,right+bow),classic?"#dad2bc":"#c4ccc7");
    }
    ring(.091,r*inner,.113,r*.135,classic?bright:"#bcc3bb");
    for(let j=0;j<10;j++)g.tri([x+k*.115,y,z],pt(.115,r*.134,j*tau/10),pt(.115,r*.134,(j+1)*tau/10),classic?"#675d51":"#a66b45");
  }
  function interior(g,s){
    const classic=s===shapes.cayo,[rear,,,front,sill]=s.glass,base=s.seatY,z=s.seatZ;
    const cloth=classic?"#a27b59":"#5b6c74",dark=classic?"#6f5141":"#333d43",thread=classic?"#c29c70":"#829293";
    g.box(0,s.floorY-.028,(rear+front)/2,s.hingeX*1.82,.062,front-rear,classic?"#4e4540":"#323a40");
    for(const k of sides){
      const x=k*s.seatX;
      g.box(x,base-.031,z+.042,.482,.096,.515,dark);
      g.box(x,base+.009,z+.064,.354,.057,.460,cloth);
      for(const side of sides){
        const e=x+side*.186;
        g.quad([e-side*.025,base+.033,z-.137],[e+side*.037,base+.067,z-.123],[e+side*.032,base+.051,z+.255],[e-side*.023,base+.024,z+.264],dark);
      }
      const back=(u,h,shift=0)=>[x+u,base+h,z-.158-h*(classic?.17:.29)+shift];
      g.quad(back(-.218,.031),back(.218,.031),back(.192,.41),back(-.192,.41),dark);
      g.quad(back(-.162,.048,.006),back(.162,.048,.006),back(.147,.363,.006),back(-.147,.363,.006),cloth);
      for(let j=0;j<(classic?4:3);j++){
        const y=.103+j*.062;
        g.quad(back(-.151,y,.010),back(.151,y,.010),back(.151,y+.010,.010),back(-.151,y+.010,.010),thread);
      }
      g.box(x,base+.440,z-.235,.243,.155,.107,classic?cloth:dark);
    }
    if(classic){
      g.box(0,base+.045,rear+.178,1.37,.159,.36,dark);
      g.box(0,base+.171,rear+.066,1.32,.249,.142,cloth);
    }else g.box(0,sill-.247,rear+.056,1.44,.443,.087,"#3c484a");
    const dz=front-.132,dy=base+.43;
    g.box(0,dy,dz,s.hingeX*1.65,.206,.254,dark);
    g.box(0,dy+.067,dz-.063,s.hingeX*1.66,.052,.205,classic?"#514841":"#3c484d");
    g.box(0,dy-.007,dz-.136,s.hingeX*1.48,.097,.017,classic?"#966f4f":"#535f63");
    if(classic){
      g.box(-s.seatX,dy+.005,dz-.151,.361,.083,.015,"#343b38");g.box(-s.seatX,dy+.010,dz-.163,.285,.013,.005,"#d5ca9f");
    }else for(let i=0;i<3;i++)sealed(g,-s.seatX+(i-1)*.113,dy+.020,dz-.152,.046,"#c5c9b6",10);
    const center=[-s.seatX,base+.40,z+.36],radius=classic?.150:.143;
    const rim=a=>[center[0]+Math.cos(a)*radius,center[1]+Math.sin(a)*radius,center[2]+Math.sin(a)*.052];
    for(let i=0;i<12;i++)g.pole(rim(i*tau/12),rim((i+1)*tau/12),.015,classic?"#825e44":"#343a3c",5);
    for(const a of [Math.PI*.03,Math.PI*.97,Math.PI*1.5])g.pole(center,rim(a),.017,classic?alloy:"#656d6e",4);
    g.box(center[0],center[1],center[2],.103,.072,.048,classic?"#6c6254":"#444f52");
    g.box(0,base-.002,z+.215,.169,.197,.65,dark);g.box(0,base+.105,z+.236,.107,.019,.180,classic?"#b5ac91":"#b1b5ad");
    g.pole([0,base+.114,z+.245],[.007,base+.261,z+.216],.010,alloy,5);
    g.box(.007,base+.264,z+.216,.038,.039,.042,classic?"#846449":ink);
  }
  function signal(g,s,side,front,lit=true){
    const classic=s===shapes.cayo,k=side,z=(front?s.sections.at(-1)[0]:s.sections[0][0])+(front?1:-1)*.023,fill=lit?"#ffd185":amber;
    if(classic){
      const x=k*(front?.744:.717),y=front?.443:.549;plate(g,z,x-.048,x+.048,y-.020,y+.020,fill);
    }else if(front)topFace(g,s,[[k*.802,1.799],[k*.846,1.790],[k*.901,1.560],[k*.881,1.565]],fill,.024);
    else plate(g,z,k*.779-.033,k*.779+.033,.732,.756,fill);
  }
  function brakeLights(g,kind){
    const s=shapes[kind],r=s.sections[0][0]-.025;
    for(const k of sides){
      if(kind==="cayo")for(let i=0;i<3;i++){const x=k*(.362+i*.127);plate(g,r,x-.045,x+.045,.627,.723,"#ff6251");}
      else for(const [x,w] of [[.712,.084],[.473,.113]])for(const y of [.619,.646,.677])plate(g,r,k*x-w,k*x+w,y,y+.019,"#ff6655");
    }
    if(kind==="marea")plate(g,r+.029,-.237,.237,.877,.898,"#ff6b53");
  }
  function shiftOrigin(mesh,x,y,z){
    const v=mesh.vertices;for(let i=0;i<v.length;i+=6){v[i]-=x;v[i+1]-=y;v[i+2]-=z;}
  }
  function build(g,s,paint,parts){
    const doors=parts?parts.doors:{[-1]:g,1:g},classic=s===shapes.cayo;
    body(g,s,paint,doors);windows(g,s,paint,doors,parts?.windshield);interior(g,s);
    if(classic)cayoEnds(g,s,paint);else mareaEnds(g,s,paint);
    sideTrim(g,s,paint,doors);
    const end=s.sections[0],rz=end[0]-.018,py=end[2]-.174;
    plate(g,rz,-.241,.241,py-.077,py+.084,ink);plate(g,rz-.003,-.231,.231,py-.069,py+.077,"#eadfbf");
    plate(g,rz-.005,-.230,.230,py+.048,py+.076,"#619a91");
    for(const k of sides){
      signal(g,s,k,true,false);signal(g,s,k,false,false);
      if(parts){
        shiftOrigin(doors[k],k*s.hingeX,0,s.hingeZ);wheel(parts.wheels[k],s,k,0,0,0);
        const x=k*(classic?.246:.312);plate(parts.reverse,rz-.013,x-.025,x+.025,classic?.648:.636,classic?.702:.690,"#fff7d6");
      }else for(const z of s.axles)wheel(g,s,k,k*(s.track-.085),s.wheel,z);
    }
    if(parts)brakeLights(parts.brakes,classic?"cayo":"marea");
  }
  function driverEnds(g,kind,paint){
    const s=shapes[kind],shell=new BayMesh(),tint=paint||s.paint;
    body(shell,s,tint,{[-1]:shell,1:shell});
    if(s===shapes.cayo)cayoEnds(shell,s,tint);else mareaEnds(shell,s,tint);
    const a=shell.vertices,[back,,,front]=s.glass;
    for(let i=0;i<a.length;i+=18){
      const z0=a[i+2],z1=a[i+8],z2=a[i+14];
      if(Math.min(z0,z1,z2)<front-.0001&&Math.max(z0,z1,z2)>back+.0001)continue;
      if(Math.max(a[i+1],a[i+7],a[i+13])<.40)continue;
      for(let j=i;j<i+18;j++)g.vertices.push(a[j]);
    }
  }
  function hoodHeight(kind,x,z){
    const s=shapes[kind],h=section(s,z).h;
    if(s!==shapes.cayo||z<.837||z>1.44||Math.abs(x)<.211||Math.abs(x)>.479)return h;
    const p=scoop(s,x<0?-1:1);
    for(const [a,b,c] of [[p[0],p[1],p[2]],[p[0],p[2],p[3]]]){
      const det=(b[2]-c[2])*(a[0]-c[0])+(c[0]-b[0])*(a[2]-c[2]);
      const u=((b[2]-c[2])*(x-c[0])+(c[0]-b[0])*(z-c[2]))/det;
      const v=((c[2]-a[2])*(x-c[0])+(a[0]-c[0])*(z-c[2]))/det;
      if(u>=0&&v>=0&&u+v<=1)return a[1]*u+b[1]*v+c[1]*(1-u-v);
    }
    return h;
  }
  const spriteCache=new Map(),spriteScale=62;
  function impactStamp(d){
    let stamp=0;if(d)for(const key of ["front","rear","left","right"])stamp=(stamp<<4)|Math.round(clamp(d[key]||0,0,1)*15);
    return stamp;
  }
  // Paint the plan from the same body panels. The little bit of rake exposes the tail and the rocker.
  // The shell and the two door leaves have separate images, so an opening uses no extra raster passes.
  function sprite(mesh,hingeX,hingeZ,bend){
    const source=mesh.vertices;if(!source.length)return null;
    const pts=new Float32Array(source.length/2),P=spriteScale,point=[0,0,0];
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(let i=0,j=0;i<source.length;i+=6,j+=3){
      const x=source[i]+hingeX,y=source[i+1],z=source[i+2]+hingeZ;
      if(bend)bend(x,y,z,point);else{point[0]=x;point[1]=y;point[2]=z;}
      const a=(point[0]-hingeX-.037*point[1])*P,b=(hingeZ-point[2]-.109*point[1])*P;
      minX=Math.min(minX,a);maxX=Math.max(maxX,a);minY=Math.min(minY,b);maxY=Math.max(maxY,b);
      pts[j]=a;pts[j+1]=b;pts[j+2]=point[1];
    }
    minX=Math.floor(minX)-1;minY=Math.floor(minY)-1;
    const w=Math.ceil(maxX-minX)+2,h=Math.ceil(maxY-minY)+2,canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d"),im=ctx.createImageData(w,h),data=im.data,depth=new Float32Array(w*h);depth.fill(-1e5);
    for(let i=0,j=0;i<source.length;i+=18,j+=9){
      const x0=pts[j]-minX,y0=pts[j+1]-minY,z0=pts[j+2],x1=pts[j+3]-minX,y1=pts[j+4]-minY,z1=pts[j+5];
      const x2=pts[j+6]-minX,y2=pts[j+7]-minY,z2=pts[j+8],a=y1-y2,b=x2-x1,c=y2-y0,d=x0-x2,det=a*(x0-x2)+b*(y0-y2);
      if(Math.abs(det)<.04)continue;
      const left=Math.max(0,Math.ceil(Math.min(x0,x1,x2)-.5)),right=Math.min(w-1,Math.floor(Math.max(x0,x1,x2)-.5));
      const top=Math.max(0,Math.ceil(Math.min(y0,y1,y2)-.5)),bottom=Math.min(h-1,Math.floor(Math.max(y0,y1,y2)-.5));
      const ax=a/det,bx=c/det,ay=b/det,by=d/det;
      const r=source[i+3]*255,g=source[i+4]*255,bl=source[i+5]*255;
      for(let row=top;row<=bottom;row++){
        let u=ax*(left+.5-x2)+ay*(row+.5-y2),v=bx*(left+.5-x2)+by*(row+.5-y2),at=row*w+left;
        for(let col=left;col<=right;col++,u+=ax,v+=bx,at++){
          if(u<-.0001||v<-.0001||u+v>1.0001)continue;
          const z=z2+u*(z0-z2)+v*(z1-z2);if(z<depth[at]-.00001)continue;depth[at]=z;
          const m=at*4;data[m]=r;data[m+1]=g;data[m+2]=bl;data[m+3]=255;
        }
      }
    }
    ctx.putImageData(im,0,0);return {canvas,left:minX/P,top:minY/P,w:w/P,h:h/P};
  }
  function atlasParts(v){
    const s=shapes[v.kind],paint=v.color||s.paint,stamp=impactStamp(v.damage),key=v.kind+paint+"/"+stamp;
    const existing=spriteCache.get(key);if(existing)return existing;
    const pair=()=>({[-1]:new BayMesh(),1:new BayMesh()}),shell=new BayMesh();
    const parts={doors:pair(),wheels:pair(),brakes:new BayMesh(),reverse:new BayMesh()};
    build(shell,s,paint,parts);
    const bend=stamp&&window.BayBodyworkArt?.deformer?.(v),result={shell:sprite(shell,0,0,bend),doors:{},brakes:sprite(parts.brakes,0,0,bend),reverse:sprite(parts.reverse,0,0,bend),bend};
    for(const k of sides)result.doors[k]=sprite(parts.doors[k],k*s.hingeX,s.hingeZ,bend);
    const profile=(side,rows)=>rows.map(([z,w,h])=>{
      const p=[side*w,h*.73,z];if(bend)bend(p[0],p[1],p[2],p);
      return [p[0]+.125,-p[2]+.133];
    });
    result.shadow=[...profile(-1,s.sections),...profile(1,[...s.sections].reverse())];
    if(spriteCache.size>=14)spriteCache.delete(spriteCache.keys().next().value);spriteCache.set(key,result);return result;
  }
  function path(c,points,fill){
    c.beginPath();c.moveTo(points[0][0],points[0][1]);for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);c.closePath();c.fillStyle=fill;c.fill();
  }
  function drawSprite(c,p){if(p)c.drawImage(p.canvas,p.left,p.top,p.w,p.h);}
  function map(c,v,x,y,scale,t=0){
    const s=shapes[v.kind];if(!s||!(scale>0))return;
    const fast=s===shapes.cayo,b=s.track,paint=v.color||s.paint;
    const nose=s.sections.at(-1)[0],rear=s.sections[0][0],lit=v.brakes>.18||v.handbrake>.48,flash=(v.indicator===-1||v.indicator===1)&&(t+(Number.isFinite(v.id)?(v.id%13)*.071:0))%.84<.42;
    c.save();c.translate(x,y);c.rotate(v.yaw||0);c.scale(scale,scale);
    if(scale<3.5){
      path(c,[[-b*.67,-nose],[b*.67,-nose],[b,-nose+.4],[b,-rear-.32],[b*.80,-rear],[-b*.79,-rear],[-b,-rear-.27],[-b,-nose+.46]],paint);
      path(c,[[-s.glass[6],-s.glass[3]],[s.glass[6],-s.glass[3]],[s.glass[7],-s.glass[2]],[-s.glass[7],-s.glass[2]]],"#385562");
      c.fillStyle=lit?"#ff6555":"#a8514c";for(const k of sides)c.fillRect(k*.56-.16,-rear-.105,.32,.13);
      c.restore();return;
    }
    const art=atlasParts(v);
    path(c,art.shadow,"#64655e");
    for(const k of sides)for(const z of s.axles){
      const flat=v.flatSide===k&&z===v.flatAxle;
      c.save();c.translate(k*(b-.084),-z);if(z>0)c.rotate(v.steer||0);
      c.fillStyle=flat?"#514c45":rubber;c.fillRect(-.092,-s.wheel,.184+(flat?.046:0),s.wheel*2);
      c.restore();
    }
    drawSprite(c,art.shell);
    for(const k of sides){
      const open=Math.max(v.doorSide===k?v.doorAngle||0:0,k===1?v.passengerDoor||0:0);
      c.save();c.translate(k*s.hingeX,-s.hingeZ);c.rotate(-k*open);drawSprite(c,art.doors[k]);c.restore();
    }
    if(lit)drawSprite(c,art.brakes);if(v.reversing)drawSprite(c,art.reverse);
    const damage=v.damage||{},frame=art.bend,point=[0,0,0];
    function strip(x,h,z,w,d,col){
      if(frame){frame(x,h,z,point);x=point[0];h=point[1];z=point[2];}
      c.fillStyle=col;c.fillRect(x-.037*h-w/2,-z-.109*h-d*.5,w,d);
    }
    for(const k of sides){
      if(fast)for(const a of [.469,.693])strip(k*a,.625,nose-.013,.125,.058,damage.front>.85?"#7a7971":lamp);
      if(lit&&v.kind==="marea")strip(k*.565,.695,rear,.365,.047,"#ff6959");
      else if(lit)for(let i=0;i<3;i++)strip(k*(.362+i*.127),.697,rear,.091,.047,"#ff6959");
      if(flash&&v.indicator===k){
        strip(k*(fast?.744:.834),fast?.443:.624,fast?nose:1.721,.125,.093,"#ffbc59");
        strip(k*(fast?.717:.779),fast?.549:.744,rear,.115,.078,"#ffbc59");
      }
    }
    if(scale>32&&v.plate){
      c.fillStyle=ink;c.textAlign="center";c.textBaseline="middle";c.font="bold .103px monospace";
      c.fillText(v.plate,-.020,-rear-.063,.393);
    }
    c.restore();
  }
  window.BayDealerCars={owns,shapes,cockpitStyles,fit,build,driverEnds,hoodHeight,brakeLights,signal,map};
})();
