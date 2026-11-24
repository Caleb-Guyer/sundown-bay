/* Solena 64. Metres about the axle line, local +Z towards the grille. */
(() => {
  "use strict";
  const tau=2*Math.PI,sides=[-1,1],mix=(a,b,t)=>a+(b-a)*t,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const chrome="#aeb9b4",edge="#ede5ca",blueSteel="#687c7e",steel="#46575e",dark="#27333a",gold="#e0b76d",tread="#293033";
  const lamp="#ffefbd",lens="#a53a47",tail="#792f43",ink="#242e35",vinyl="#743f4c",cream="#d8c19e",stitch="#a78878";
  const shape={
    paint:"#9e4d6d",track:1.009,wheel:.336,axles:[-1.493,1.535],divider:.343,
    sections:[[-2.674,.869,.852],[-2.563,.949,.896],[-2.31,.985,.912],[-1.97,1.006,.912],[-1.494,1.002,.895],
      [-1.12,.991,.872],[-.61,.976,.854],[.11,.971,.850],[.69,.976,.858],[1.07,.993,.872],[1.535,1.005,.895],
      [1.98,1.006,.889],[2.33,.982,.866],[2.524,.948,.827],[2.624,.862,.809]],
    glass:[-1.537,-.985,.458,.977,.883,1.414,.878,.739]
  };
  const shapes={solena:shape},cockpitStyles={solena:{trim:"#784850",top:"#48393e",pad:"#94646a",cloth:"#d5bda0",thread:"#9e746a",edge:"#c8bd99",face:"#493b46",ink:"#f6e2ba",accent:"#e6a968",rim:"#d8c29b",hub:"#80525a",dash:"ribbon",spokes:2,stamp:"SOLENA 64",limit:100}};
  const owns=kind=>kind==="solena",sideMesh=(g,d,k,z)=>z>shape.back&&z<shape.hingeZ?d[k]:g;
  const front=shape.sections.at(-1)[0],rear=shape.sections[0][0],base=.239;
  function color(a,b,t){
    const left=parseInt(a.slice(1),16),right=parseInt(b.slice(1),16);let n=0;
    for(const s of [16,8,0])n|=Math.round(mix((left>>s)&255,(right>>s)&255,t))<<s;
    return "#"+n.toString(16).padStart(6,"0");
  }
  function section(z){
    const p=shape.sections;let i=1;while(i<p.length-1&&p[i][0]<z)i++;
    const f=clamp((z-p[i-1][0])/(p[i][0]-p[i-1][0]),0,1);
    return {w:mix(p[i-1][1],p[i][1],f),h:mix(p[i-1][2],p[i][2],f)};
  }
  function fit(s){
    const [rear,,,front,sill,roof]=s.glass;
    s.back=mix(rear,front,s.divider);s.hingeX=.935;s.hingeZ=front-.019;
    s.handleZ=s.back+.146;s.handleY=sill-.119;s.handleX=sideX(s.handleZ,s.handleY)+.027;
    s.grabX=s.hingeX-.123;s.grabZ=s.handleZ+.177;s.grabY=s.handleY-.032;
    s.seatX=.434;s.seatZ=s.back+.274;s.seatY=roof-.927;s.floorY=.236;s.halfLength=Math.max(-shape.sections[0][0],shape.sections.at(-1)[0]);
  }
  function sideX(z,y){
    const {w,h}=section(z),t=clamp((y-base)/(h-base),0,1);
    if(t<.16)return w-.137+t*.48;
    if(t<.61)return mix(w-.060,w-.010,(t-.16)/.45);
    if(t<.85)return mix(w-.010,w,(t-.61)/.24);
    return mix(w,w-.060,(t-.85)/.15);
  }
  const bodyPoint=(k,z,y,out=0)=>[k*(sideX(z,y)+out),y,z];
  function face(g,pts,c){for(let i=1;i+1<pts.length;i++)g.tri(pts[0],pts[i],pts[i+1],c);}
  function ribbon(g,points,width,paint,plane){
    // Offset in panel coordinates: the thin lines stay flush even on a tapered panel.
    let left,right;
    for(let i=0;i<points.length;i++){
      const p=points[i],a=points[Math.max(i-1,0)],b=points[Math.min(i+1,points.length-1)];
      const dx=b[0]-a[0],dy=b[1]-a[1],f=width*.5/(Math.hypot(dx,dy)||1);
      const l=plane(p[0]-dy*f,p[1]+dx*f),r=plane(p[0]+dy*f,p[1]-dx*f);
      if(i)g.quad(left,right,r,l,paint);left=l;right=r;
    }
  }
  const profile=(p,a,b,q,n=9)=>Array.from({length:n+1},(_,i)=>{const v=i/n,t=1-v;
    return [0,1].map(k=>t*t*t*p[k]+3*t*t*v*a[k]+3*t*v*v*b[k]+v*v*v*q[k]);});
  const atDeck=(x,z,e=0)=>[x,hoodHeight("solena",x,z)+e,z];
  function hoodHeight(kind,x,z){
    const a=section(z),u=clamp(Math.abs(x)/Math.max(.01,a.w-.06),0,1);
    return a.h+.024*(1-u)-.008*Math.max(0,1-Math.abs(u-.61)/.26);
  }
  function arch(z){
    const d=Math.min(...shape.axles.map(v=>Math.abs(z-v))),r=.393;
    return d<=r+.000001?shape.wheel+Math.sqrt(Math.max(0,r*r-d*d)):base;
  }
  function stations(){
    const rows=[shape.glass[0],shape.back,shape.hingeZ,...shape.sections.map(p=>p[0])],r=.393;
    for(const axle of shape.axles){rows.push(axle-r-.014,axle+r+.014);for(let i=0;i<=12;i++)rows.push(axle+r*Math.cos(Math.PI*i/12));}
    return rows.sort((a,b)=>a-b).filter((v,i,a)=>!i||v-a[i-1]>.0001);
  }
  function body(g,doors,paint){
    const rows=stations(),shade=color(paint,"#271e35",.41),light=color(paint,"#f1c5a6",.14),lip=color(paint,"#f4c59a",.33);
    function rings(k,z){
      const h=section(z).h,b=arch(z);
      return [Math.max(b,h-.037),Math.max(b,h-.116),Math.max(b,h-.197),Math.max(b,.369),b].map(y=>bodyPoint(k,z,y));
    }
    const deckTints=[color(paint,"#fff0c0",.16),color(paint,"#efba9f",.095),paint,color(paint,"#f3c99e",.19)];
    for(let i=1;i<rows.length;i++){
      const z0=rows[i-1],z1=rows[i],zm=(z0+z1)*.5,cabin=zm>shape.glass[0]&&zm<shape.hingeZ;
      for(const k of sides){
        const mesh=sideMesh(g,doors,k,zm),a=rings(k,z0),b=rings(k,z1),ao=atDeck(k*(section(z0).w-.06),z0),bo=atDeck(k*(section(z1).w-.06),z1);
        mesh.quad(ao,bo,b[0],a[0],lip);
        for(let n=0;n<4;n++)mesh.quad(a[n],b[n],b[n+1],a[n+1],[light,paint,color(paint,"#68334a",.21),shade][n]);
        const u=a[4],v=b[4];mesh.quad(u,v,[v[0]-k*.143,v[1],z1],[u[0]-k*.143,u[1],z0],dark);
        if(arch(zm)>base){
          const p=(p,h)=>[p[0]+k*.006,p[1]+h,p[2]];
          mesh.quad(p(u,.002),p(v,.002),p(v,.018),p(u,.018),chrome);
        }
        function top(z,w){return atDeck(k*(section(z).w-.06)*w,z);}
        if(cabin){mesh.quad(ao,bo,atDeck(k*shape.glass[6],z1),atDeck(k*shape.glass[6],z0),light);}
        else{
          const spans=[0,.35,.61,.87,1];
          for(let j=1;j<spans.length;j++)g.quad(top(z0,spans[j-1]),top(z0,spans[j]),top(z1,spans[j]),top(z1,spans[j-1]),deckTints[j-1]);
        }
      }
    }
    for(const z of [rear,front]){const {h,w}=section(z);
      g.quad([-w+.12,base,z],[w-.12,base,z],[w,h-.1,z],[-w,h-.1,z],shade);
      g.quad([-w,h-.1,z],[w,h-.1,z],atDeck(w-.060,z),atDeck(-w+.060,z),light);
    }
  }
  function deckPaint(g,paint){
    const toe=color(paint,"#492e4c",.36),blush=color(paint,"#f5d5ac",.31),glint=color(paint,"#efbd8a",.54);
    for(const [a,b,inverse] of [[1.035,2.489,false],[-2.525,-1.603,true]]){
      const length=b-a,zf=u=>inverse?b-u*length:a+u*length;
      for(const k of sides){
        const warp=(x,u,e=.0045)=>atDeck(k*x,zf(u),e);
        const outline=profile([.125,.035],[.315,.119],[.714,-.102],[.786,.072],8)
          .concat(profile([.786,.072],[.778,.351],[.567,.838],[.322,.976],13).slice(1),
          profile([.322,.976],[.296,.77],[.155,.16],[.125,.035],12).slice(1));
        // Paint the two halves in narrow transverse slices to follow the stamped hood.
        for(let j=0;j<15;j++){
          const u=j/15,v=(j+1)/15,lo=t=>.15+(.341-.15)*t,hi=t=>.771-.424*t*t;
          g.quad(warp(lo(u),.083+.82*u,.003),warp(hi(u),.083+.82*u,.003),
            warp(hi(v),.083+.82*v,.003),warp(lo(v),.083+.82*v,.003),color(paint,"#442c44",.10+.21*u));
        }
        ribbon(g,outline,.016,glint,(x,u)=>warp(x,u,.009));
        const scallop=profile([.169,.090],[.37,.246],[.627,.026],[.721,.109],7).concat(profile([.721,.109],[.714,.438],[.51,.769],[.351,.889],11).slice(1));
        ribbon(g,scallop,.020,blush,(x,u)=>warp(x,u,.010));
        ribbon(g,profile([.352,.857],[.403,.51],[.536,.417],[.661,.224]),.013,glint,(x,u)=>warp(x,u,.011));
        for(let j=0;j<3;j++){
          const u=.23+j*.132;
          ribbon(g,profile([.312+j*.032,u],[.406+j*.029,u+.147],[.521-j*.022,u-.110],[.597-j*.037,u-.033],7),.0125,toe,(x,v)=>warp(x,v,.011));
        }
        const line=profile([.033,.074],[.032,.404],[.095,.804],[.034,.959],10);
        ribbon(g,line,.015,color(paint,edge,.70),(x,u)=>warp(x,u,.013));
      }
    }
    for(const k of sides)for(let i=0;i<11;i++){
      const x=k*(.093+i*.043),z=1.014;
      ribbon(g,[[x,z],[x+k*.011,z+.050]],.012,blueSteel,(u,v)=>atDeck(u,v,.012));
    }
  }
  function doorAndFlank(g,doors,paint){
    const shadow=color(paint,"#3b243c",.56),light=color(paint,"#eac79f",.54);
    for(const k of sides){
      const plane=(z,y,e=.010)=>bodyPoint(k,z,y,e),door=doors[k],seam=shape.back,hinge=shape.hingeZ;
      const nodes=[[-2.56,.805,.022],[-2.28,.806,.058],[-1.94,.791,.033],[-1.39,.777,.026],[-.95,.766,.025],
        [seam,.758,.022],[.13,.748,.019],[hinge,.749,.017],[1.51,.758,.014],[2.12,.742,.011],[2.46,.732,.006]];
      for(let j=1;j<nodes.length;j++){const [a,b]=nodes.slice(j-1,j+1),m=sideMesh(g,doors,k,(a[0]+b[0])*.5);
        m.quad(plane(a[0],a[1],.018),plane(b[0],b[1],.018),plane(b[0],b[1]+b[2],.018),plane(a[0],a[1]+a[2],.018),light);
        m.quad(plane(a[0],a[1]-.012,.019),plane(b[0],b[1]-.012,.019),plane(b[0],b[1]-.006,.019),plane(a[0],a[1]-.006,.019),chrome);
      }
      for(const [z0,z1] of [[-1.023,seam],[seam,hinge],[hinge,1.086]]){const m=sideMesh(g,doors,k,(z0+z1)*.5);
        m.quad(plane(z0,.267),plane(z1,.267),plane(z1,.295),plane(z0,.295),chrome);
        m.quad(plane(z0,.294,.012),plane(z1,.294,.012),plane(z1,.303,.012),plane(z0,.303,.012),edge);
      }
      // A painter's twin scallop curls back into itself on the long door.
      const curl=profile([seam+.065,.402],[seam+.40,.37],[.445,.39],[.724,.592],11)
        .concat(profile([.724,.592],[.51,.457],[.477,.459],[.421,.50],7).slice(1));
      ribbon(door,curl,.011,light,plane);
      for(const [z,y] of [[-.35,.453],[-.23,.459],[-.11,.474]]){
        ribbon(door,profile([z-.09,y-.054],[z+.009,y-.006],[z+.079,y+.017],[z+.115,y+.087],6),.0075,light,plane);
      }
      for(const z of [seam+.006,hinge-.010])ribbon(door,[[z,.323],[z,.712],[z,.843]],.011,shadow,(a,b)=>plane(a,b,.019));
      const z=shape.handleZ,y=shape.handleY;
      door.box(k*(shape.handleX-.009),y,z,.026,.049,.224,blueSteel);
      door.box(k*(shape.handleX+.009),y+.011,z+.002,.036,.027,.193,edge);
      door.box(k*(shape.handleX+.006),y-.003,z+.087,.04,.04,.023,chrome);
      const inner=k*(shape.hingeX-.074);
      door.quad([inner,.275,seam+.025],[inner,.275,hinge-.014],[inner,.858,hinge-.014],[inner,.858,seam+.025],vinyl);
      door.quad([inner-k*.004,.431,seam+.057],[inner-k*.004,.431,hinge-.047],[inner-k*.004,.675,hinge-.05],[inner-k*.004,.675,seam+.057],cream);
      for(let i=0;i<10;i++){const z=seam+.10+i*.14;
        door.quad([inner-k*.006,.466,z],[inner-k*.006,.466,z+.009],[inner-k*.006,.643,z+.047],[inner-k*.006,.643,z+.039],stitch);}
      door.box(inner-k*.052,shape.grabY-.065,shape.grabZ,.11,.069,.351,vinyl);
      door.box(k*shape.grabX,shape.grabY,shape.grabZ,.046,.03,.176,chrome);
      g.box(k*.846,.243,(seam+hinge)*.5,.16,.044,hinge-seam+.022,chrome);
      if(k<0){
        const cx=k*1.045,cz=hinge-.22;
        door.pole(plane(cz+.033,.859),[cx,.968,cz],.020,chrome,6);
        door.box(cx,.979,cz,.145,.093,.077,chrome,.12);
        door.box(cx,.981,cz-.037,.123,.069,.009,"#bad2ca",.12);
      }
    }
  }
  function greenhouse(g,doors,glass,paint){
    const [rz,rr,rf,fz,sill,roof,b,t]=shape.glass;
    const topMix=color(paint,"#f4dfb7",.81),frame=color(paint,"#efdebd",.35);
    const side=(k,u,v,e=0)=>[k*(mix(b,t,v)+e),mix(sill,roof,v),mix(mix(rz,fz,u),mix(rr,rf,u),v)];
    const windowSide=(dest,k,u0,u1,v0,v1,col,e=0)=>dest.quad(side(k,u0,v0,e),side(k,u1,v0,e),side(k,u1,v1,e),side(k,u0,v1,e),col);
    for(const k of sides){
      const d=doors[k];windowSide(g,k,0,.131,.012,1,frame);windowSide(g,k,.022,.088,.047,.948,topMix,.006);
      windowSide(g,k,.087,.136,.125,.904,chrome,.012);
      // The lowered frameless windows leave the front bench and its occupants visible.
      face(g,[side(k,.129,.106),side(k,shape.divider-.012,.106),side(k,shape.divider-.024,.747),side(k,.211,.889),side(k,.139,.859)],"#597680");
      windowSide(g,k,.151,.300,.132,.173,"#829292",.007);
      windowSide(g,k,.126,shape.divider,0,.060,chrome,.013);
      windowSide(d,k,shape.divider,1,0,.065,chrome,.013);
      face(d,[side(k,.847,.076,.005),side(k,.977,.076,.005),side(k,.939,.864,.005),side(k,.868,.884,.005)],"#79999d");
      windowSide(d,k,.843,.855,.068,.909,chrome,.008);
      windowSide(g,k,.956,1,.063,1,frame,.009);windowSide(g,k,.954,.970,.09,.944,edge,.014);
      windowSide(g,k,.108,.972,.930,.986,chrome,.008);
    }
    const wind=(forward,u,v,e=0)=>[u*mix(b,t,v),mix(sill,roof,v),(forward?mix(fz,rf,v):mix(rz,rr,v))+(forward?1:-1)*e];
    const pane=(dst,f,u0,u1,v0,v1,col,e=0)=>dst.quad(wind(f,u0,v0,e),wind(f,u1,v0,e),wind(f,u1,v1,e),wind(f,u0,v1,e),col);
    for(const f of [true,false]){
      const dst=f?glass:g;pane(dst,f,-.987,.987,.003,.998,chrome);
      pane(dst,f,-.954,.954,.051,.942,f?"#6a969d":"#4f6874",.004);
      pane(dst,f,-.945,.945,.068,.132,f?"#587783":"#425965",.009);
      pane(dst,f,-.946,.946,.800,.937,f?"#557a86":"#66828a",.009);
      face(dst,[wind(f,-.695,.14,.011),wind(f,-.563,.14,.011),wind(f,-.119,.793,.011),wind(f,-.218,.793,.011)],f?"#87aaa8":"#627d83");
    }
    const roofY=(u,z)=>roof+.048*(1-u*u)+.016*(1-(2*(z-rr)/(rf-rr)-1)**2);
    const top=(u,z,e=0)=>[u*t,roofY(u,z)+e,z];
    const shades=[color(topMix,"#635860",.12),topMix,color(topMix,"#fff1cd",.16)];
    for(let i=0;i<6;i++)for(let j=0;j<6;j++){
      const a=-1+i/3,b=-1+(i+1)/3,z0=mix(rr,rf,j/6),z1=mix(rr,rf,(j+1)/6);
      g.quad(top(a,z0),top(b,z0),top(b,z1),top(a,z1),shades[i===0||i===5?0:i===2||i===3?2:1]);
    }
    for(const k of sides){
      const roofPlane=(u,z)=>top(k*u,z,.006);
      // Twin scalloped roof panels leave a cream spine between bands of candy flake.
      const u0=.307,u1=.849;
      for(let j=0;j<11;j++){
        const a=j/11,b=(j+1)/11,cut=t=>u0+(u1-u0)*(.09+.39*Math.sin(Math.PI*t));
        g.quad(roofPlane(cut(a),mix(rr+.081,rf-.058,a)),roofPlane(u1,mix(rr+.081,rf-.058,a)),roofPlane(u1,mix(rr+.081,rf-.058,b)),roofPlane(cut(b),mix(rr+.081,rf-.058,b)),color(topMix,paint,.38));
      }
      const edgePath=Array.from({length:13},(_,i)=>{const a=i/12;return [u0+(u1-u0)*(.09+.39*Math.sin(Math.PI*a)),mix(rr+.08,rf-.055,a)];});
      ribbon(g,edgePath,.0125,gold,(u,z)=>top(k*(u-.031),z,.012));
      ribbon(g,[[.881,rr+.049],[.887,rr+.21],[.887,rf-.20],[.877,rf-.039]],.010,frame,(u,z)=>top(k*u,z,.009));
    }
  }
  const rect=(g,z,x0,x1,y0,y1,col)=>g.quad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],col);
  function oval(g,x,y,z,rx,ry,fill,n=16){
    const p=a=>[x+rx*Math.cos(a),y+ry*Math.sin(a),z];
    for(let i=0;i<n;i++)g.tri([x,y,z],p(tau*i/n),p(tau*(i+1)/n),fill);
  }
  const letters={S:[[.95,1],[.26,1],[0,.80],[.13,.58],[.74,.48],[.95,.27],[.75,.05],[.02,.05]],
    O:[[.23,.04],[.03,.26],[.04,.79],[.25,1],[.74,1],[.94,.78],[.92,.25],[.72,.04],[.23,.04]],
    L:[[.12,1],[.08,.07],[.92,.07]],E:[[.94,1],[.12,1],[.08,.07],[.91,.07]],N:[[.07,.08],[.10,1],[.86,.07],[.90,1]],
    A:[[.00,.07],[.33,1],[.65,1],[.96,.07]],"6":[[.78,.99],[.38,.91],[.12,.61],[.05,.29],[.22,.07],[.70,.08],[.87,.36],[.73,.55],[.16,.53]],"4":[[.64,.02],[.75,1],[.61,1],[.04,.35],[.95,.35]]};
  function emblem(g,z,center,y,word,h,col,facing){
    const w=h*.76,advance=w*1.53,x0=center-facing*((word.length-1)*advance+w)*.5;
    for(let i=0;i<word.length;i++){
      const ch=word[i],plane=(u,v)=>[x0+facing*(advance*i+w*u),y+h*v,z];
      ribbon(g,letters[ch],.115,col,plane);
      if(ch==="E")ribbon(g,[[.13,.53],[.73,.53]],.114,col,plane);
      if(ch==="A")ribbon(g,[[.19,.43],[.77,.43]],.11,col,plane);
    }
  }
  function bumper(g,dir){
    const z=dir>0?front:rear;
    const line=[[-.990,-.273],[-.981,-.119],[-.904,-.013],[-.682,.036],[-.36,.051],[0,.063],[.36,.051],[.682,.036],[.904,-.013],[.981,-.119],[.990,-.273]];
    const h=dir>0?.361:.376;
    for(let j=1;j<line.length;j++){
      const a=line[j-1],b=line[j],p=(q,y,s=0)=>[q[0],h+y,z+dir*(q[1]+s)];
      g.quad(p(a,-.064,-.030),p(b,-.064,-.030),p(b,-.022),p(a,-.022),blueSteel);
      g.quad(p(a,-.022),p(b,-.022),p(b,.032),p(a,.032),chrome);
      g.quad(p(a,.032),p(b,.032),p(b,.052,-.034),p(a,.052,-.034),edge);
      g.quad(p(a,.052,-.034),p(b,.052,-.034),p(b,.048,-.108),p(a,.048,-.108),chrome);
    }
    for(const k of sides){g.box(k*.533,h+.013,z+dir*.056,.075,.178,.057,chrome);g.box(k*.533,h+.011,z+dir*.087,.044,.116,.014,"#4d5150");}
  }
  function ends(g,paint){
    for(const k of sides){
      // Wraparound headlamp eyebrows and two small sealed beams sit outside the long floating grille.
      const pts=[[.413,.495],[.843,.494],[.893,.536],[.907,.741],[.826,.764],[.451,.740],[.405,.687]];
      face(g,pts.map(([x,y])=>[k*x,y,front+.007]),blueSteel);
      face(g,pts.map(([x,y])=>[k*(.65+(x-.65)*.97),.624+(y-.624)*.89,front+.011]),dark);
      for(const [x,ry] of [[.548,.079],[.761,.087]]){
        oval(g,k*x,.623,front+.014,.095,ry+.009,edge);oval(g,k*x,.623,front+.018,.084,ry,blueSteel);
        oval(g,k*x,.623,front+.022,.073,ry-.014,lamp);
        for(const q of [-.019,.019])rect(g,front+.024,k*x-.051,k*x+.051,.622+q,.625+q,"#c9c9b0");
      }
      rect(g,front+.014,k*.665-.143,k*.665+.143,.749,.760,chrome);
      const z=rear-.008;
      face(g,[[.47,.465],[.85,.456],[.91,.520],[.910,.756],[.859,.794],[.489,.773]].map(([x,y])=>[k*x,y,z]),chrome);
      face(g,[[.498,.484],[.837,.481],[.881,.528],[.880,.734],[.841,.768],[.507,.747]].map(([x,y])=>[k*x,y,z-.004]),tail);
      for(let i=0;i<3;i++){
        const x=k*(.564+.108*i),fall=.012*(i-1);
        rect(g,z-.007,x-.038,x+.036,.543+fall,.744+fall,lens);
        rect(g,z-.010,x-.023,x-.015,.569+fall,.729+fall,"#cb6659");
        rect(g,z-.009,x-.038,x+.037,.645+fall,.655+fall,chrome);
      }
    }
    const z=front+.013;
    face(g,[[-.442,.722,z],[0,.688,z+.012],[.442,.722,z],[.42,.49,z],[0,.461,z+.010],[-.42,.49,z]],chrome);
    face(g,[[-.424,.703,z+.004],[0,.675,z+.017],[.424,.703,z+.004],[.398,.503,z+.006],[0,.474,z+.015],[-.398,.503,z+.006]],ink);
    for(let j=0;j<4;j++)for(const k of sides){
      const y=.513+j*.047,p=(x,h)=>[k*x,h,z+.023-.011*x/.422];
      g.quad(p(.016,y-.017),p(.406,y+.009),p(.409,y+.022),p(.016,y-.006),j===3?edge:chrome);
    }
    const mask=(g,dir)=>{const z=dir>0?front+.040:rear-.017,y0=dir>0?.445:shape.sections[0][2]-.174;
      rect(g,z,-.228,.228,y0-.062,y0+.078,ink);rect(g,z+dir*.003,-.217,.217,y0-.052,y0+.067,"#e5d5a1");
      rect(g,z+dir*.006,-.213,.213,y0+.044,y0+.064,"#52877d");
      if(dir>0)emblem(g,z+dir*.007,0,y0-.041,"SOL64",.071,"#455756",-dir);};
    mask(g,-1);mask(g,1);
    emblem(g,rear-.017,0,.775,"SOLENA",.044,edge,1);
    const med=(x,y,z)=>[[x,y+.032,z],[x+.068,y,z],[x,y-.029,z],[x-.068,y,z]];
    face(g,med(0,.649,front+.043),gold);face(g,med(0,.649,front+.047).map(([x,y,z])=>[x*.58,.649+(y-.649)*.65,z]),paint);
    bumper(g,1);bumper(g,-1);
  }
  function signal(g,s,k,atFront,lit=true){
    const x=k*(atFront?.692:.851),z=atFront?front+.035:rear-.020,y=atFront?.450:.508,w=atFront?.137:.042;
    rect(g,z,x-w,x+w,y-.024,y+.024,lit?"#ffc86d":"#ba7146");
  }
  function brakeLights(g,kind){
    for(const k of sides)for(let i=0;i<3;i++){
      const x=k*(.564+.108*i),fall=.012*(i-1);
      for(const y of [.563,.670])rect(g,rear-.022,x-.035,x+.035,y+fall,y+.068+fall,"#ff6857");
    }
  }
  function rim(g,k,x,y,z){
    const n=20,r=shape.wheel;
    const p=(ax,rr,a)=>[x+k*ax,y+Math.sin(a)*rr,z+Math.cos(a)*rr];
    function ring(a,ra,b,rb,paint){for(let i=0;i<n;i++){const u=tau*i/n,v=tau*(i+1)/n;
      g.quad(p(a,ra,u),p(a,ra,v),p(b,rb,v),p(b,rb,u),typeof paint==="function"?paint(i):paint);}}
    ring(-.103,r*.47,-.101,r*.87,"#394242");ring(-.101,r*.87,-.075,r,"#343b3b");
    ring(-.075,r,.068,r,i=>i%2?"#252c31":"#2b3235");ring(.068,r,.097,r*.91,"#3a4141");
    ring(.097,r*.91,.104,r*.82,tread);ring(.104,r*.82,.107,r*.675,"#e6d7b4");
    ring(.107,r*.675,.096,r*.602,"#373e3e");ring(.096,r*.602,.116,r*.575,edge);ring(.116,r*.575,.098,r*.487,chrome);
    for(let i=0;i<n;i++)g.tri(p(.066,0,0),p(.066,r*.51,tau*i/n),p(.066,r*.51,tau*(i+1)/n),"#465354");
    // Two interlaced baskets of brass spokes dished outwards to the knock-off.
    for(let i=0;i<20;i++){const a=tau*i/20;
      for(const sign of sides){
        const b=a+sign*.540,inner=r*.162,outer=r*(sign>0?.505:.545),offset=sign>0?.130:.086;
        g.quad(p(offset,inner,b-.065),p(.104,outer,a-.017),p(.106,outer,a+.018),p(offset,inner,b+.066),sign>0?"#d7ba85":"#a8997c");
      }
    }
    ring(.112,r*.189,.142,r*.156,gold);ring(.142,r*.156,.144,r*.107,edge);
    for(let i=0;i<10;i++)g.tri(p(.144,0,0),p(.144,r*.108,tau*i/10),p(.144,r*.108,tau*(i+1)/10),"#8b725e");
    for(let i=0;i<3;i++){const a=tau*i/3;g.quad(p(.145,r*.088,a-.25),p(.146,r*.232,a-.32),p(.145,r*.246,a-.10),p(.145,r*.086,a+.22),edge);}
  }
  function seats(g){
    const s=shape,y=s.seatY,z=s.seatZ;
    function bench(cz,halfWidth,height){
      g.box(0,y-.060,cz,halfWidth*2,.17,.473,vinyl);g.box(0,y+.020,cz+.024,halfWidth*1.94,.061,.431,cream);
      for(const k of sides)g.box(k*(halfWidth-.038),y+.037,cz+.004,.080,.061,.435,vinyl);
      const back=(x,h,off=0)=>[x,y+h,cz-.182-.205*h+off];
      g.quad(back(-halfWidth,.021),back(halfWidth,.021),back(halfWidth-.038,height),back(-halfWidth+.038,height),vinyl);
      g.quad(back(-halfWidth+.064,.079,.006),back(halfWidth-.064,.079,.006),back(halfWidth-.081,height-.061,.006),back(-halfWidth+.081,height-.061,.006),cream);
      for(let i=-5;i<=5;i++){
        const x=i*.123;if(Math.abs(x)>halfWidth-.115)continue;
        g.quad(back(x-.004,.089,.011),back(x+.004,.089,.011),back(x+.004,height-.073,.011),back(x-.004,height-.073,.011),stitch);
        g.quad([x-.004,y+.052,cz-.148],[x+.004,y+.052,cz-.148],[x+.004,y+.052,cz+.189],[x-.004,y+.052,cz+.189],stitch);
      }
      g.box(0,y+height,cz-.182-.205*height,halfWidth*1.91,.048,.072,vinyl);
    }
    g.box(0,s.floorY-.032,-.20,1.66,.071,2.524,"#59464b");bench(z+.035,.767,.394);bench(-1.065,.726,.342);
    for(const k of sides)g.box(k*.43,.822,-1.273,.221,.037,.178,blueSteel);
    const hz=.707,hy=.807;g.box(0,hy,hz,1.62,.185,.278,vinyl);g.box(0,hy+.090,hz-.012,1.62,.037,.271,"#433b41");
    g.box(0,hy+.018,hz-.145,1.52,.057,.021,chrome);g.box(-s.seatX,hy+.035,hz-.165,.361,.088,.021,blueSteel);
    rect(g,hz-.180,-s.seatX-.149,-s.seatX+.149,hy+.006,hy+.067,ink);
    const wheel=[-s.seatX,hy+.029,z+.377],at=a=>[wheel[0]+.175*Math.cos(a),wheel[1]+.154*Math.sin(a),wheel[2]+.060*Math.sin(a)];
    g.pole([wheel[0],hy-.129,hz-.064],wheel,.031,chrome,7);
    for(let i=0;i<16;i++){g.pole(at(tau*i/16),at(tau*(i+1)/16),.014,cream,6);}
    for(const k of sides)g.pole(wheel,at(k>0?.07:Math.PI-.07),.011,chrome,5);
    g.box(wheel[0],wheel[1],wheel[2]-.008,.107,.061,.046,vinyl);
    g.pole([wheel[0]+.010,hy+.001,wheel[2]+.041],[wheel[0]+.144,hy+.069,wheel[2]+.064],.009,chrome,5);
    g.box(wheel[0]+.14,hy+.072,wheel[2]+.064,.032,.038,.028,cream);
    switches(g,.052,.940,hz-.110);
  }
  function switches(g,x,y,z){
    g.box(x,y-.038,z+.024,.231,.031,.115,vinyl);
    g.box(x,y,z,.205,.080,.049,"#384247");rect(g,z-.028,x-.094,x+.094,y-.032,y+.032,chrome);
    for(let i=0;i<4;i++){const u=x+(i-1.5)*.043;oval(g,u,y-.007,z-.031,.012,.012,ink,8);
      g.pole([u,y-.007,z-.033],[u+.002,y+.014,z-.052],.005,edge,5);
      g.box(u+.002,y+.018,z-.052,.013,.012,.012,i%2?vinyl:cream);}
  }
  function chassis(g){
    // Frame box, X-brace, exhausts and transmission are attached to the sprung body.
    const pan="#42474a",lining="#4e5053";
    for(const [z0,z1,width,height] of [[-2.60,-1.91,.69,.365],[-1.91,-1.072,.67,.478],[-1.072,.981,.77,.296],[.981,1.997,.65,.489],[1.997,2.53,.77,.371]]){
      g.quad([-width,height,z0],[width,height,z0],[width,height,z1],[-width,height,z1],pan);
      for(const k of sides)g.quad([k*width,height,z0],[k*width,height,z1],[k*(width+.036),height+.108,z1],[k*(width+.036),height+.108,z0],lining);
    }
    for(const k of sides){
      const rail=[[k*.601,.236,-2.41],[k*.591,.345,-1.606],[k*.531,.23,-.853],[k*.522,.214,.504],[k*.597,.346,1.53],[k*.613,.281,2.365]];
      for(let i=1;i<rail.length;i++)g.pole(rail[i-1],rail[i],.064,steel,5);
      g.pole([k*.517,.246,-.896],[-k*.51,.238,.752],.051,blueSteel,5);
      const pipe=[[k*.254,.225,1.090],[k*.31,.162,.642],[k*.344,.166,-.32],[k*.379,.197,-.956],[k*.483,.306,-1.48],[k*.533,.227,-2.421],[k*.575,.205,-2.660]];
      for(let i=1;i<pipe.length;i++)g.pole(pipe[i-1],pipe[i],i===pipe.length-1?.039:.027,i===pipe.length-1?chrome:"#706e66",7);
      g.box(k*.343,.177,-.210,.157,.11,.438,"#81857c");
      for(const z of shape.axles){
        // The curved tub and inner cheek stay behind the wheel when it drops clear of the arch.
        const edgeAt=t=>[k*.684,shape.wheel+.397*Math.sin(t),z+.393*Math.cos(t)];
        for(let i=0;i<12;i++){
          const a=edgeAt(Math.PI*i/12),b=edgeAt(Math.PI*(i+1)/12);
          const outer=p=>[k*(sideX(p[2],p[1])-.059),p[1]+.015,p[2]];
          g.quad(a,b,outer(b),outer(a),i%6===0?steel:lining);
          g.quad([a[0],.292,a[2]],[b[0],.292,b[2]],b,a,pan);
        }
        g.box(k*.604,.611,z,.148,.131,.174,steel);g.pole([k*.519,.482,z+.03],[k*.726,.666,z],.043,chrome,5);
      }
    }
    g.box(0,.270,.965,.528,.281,.618,dark);
    g.box(0,.192,.565,.244,.137,.317,blueSteel);
    g.pole([0,.228,.495],[0,.239,-1.268],.046,steel,7);
    g.box(0,.273,-1.989,.942,.141,.458,"#64575b");
    for(const z of [-1.988,.735])g.box(0,.29,z,1.13,.073,.135,steel);
  }
  function tilt(p,pitch,lean){
    const cp=Math.cos(pitch),sp=Math.sin(pitch),cl=Math.cos(lean),sl=Math.sin(lean),y=p[1]*cp-p[2]*sp;
    return [p[0]*cl-y*sl,p[0]*sl+y*cl,p[1]*sp+p[2]*cp];
  }
  function corners(h,frame){
    const pts=[],raised=h?.bodyLift||0,wh=h?.wheelLift;
    for(const [j,z] of shape.axles.entries())for(const [i,k] of sides.entries()){
      const spring=tilt([k*.667,.649,z-.042],frame.pitch||0,frame.lean||0);spring[1]+=raised;
      const arm=tilt([k*.405,.332,z+(j?-.184:.220)],frame.pitch||0,frame.lean||0);arm[1]+=raised;
      const hub=[k*(shape.track-.085),shape.wheel+(wh?.[j*2+i]||0),z];
      const perch=[k*.732,hub[1]-.102,z+.037],inner=[k*.825,hub[1]-.060,z];
      pts.push({k,j,z,hub,perch,spring,arm,inner});
    }return pts;
  }
  const mid=(a,b,f)=>a.map((n,i)=>mix(n,b[i],f));
  function leg(g,a,b,kind){
    if(kind==="axle"){
      g.pole(a,b,.05,blueSteel,8);
      for(const [low,high] of [[.042,.073],[.927,.958]])g.pole(mid(a,b,low),mid(a,b,high),.082,steel,8);
    }
    else if(kind==="link"){g.pole(a,b,.033,chrome,6);}
    else{
      const gap=Math.max(.001,Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2])),stop=clamp(.267/gap,.18,.79),q=mid(a,b,stop);
      g.pole(a,q,.054,"#a49675",8);g.pole(mid(a,b,Math.max(0,stop-.038/gap)),q,.061,chrome,8);g.pole(q,b,.030,edge,7);
    }
  }
  function gear(h,frame,rod,joint){
    const points=corners(h,frame);
    for(let axle=0;axle<2;axle++){
      const left=points[axle*2].hub,right=points[axle*2+1].hub;
      rod(left,right,"axle");if(!axle)joint(mid(left,right,.5));
    }
    for(const p of points){rod(p.spring,p.perch,"ram");rod(p.arm,p.inner,"link");}
  }
  function diff(g,x,y,z){
    g.box(x,y-.014,z,.199,.136,.129,steel);
    g.pole([x,y+.013,z-.082],[x,y+.004,z+.133],.082,chrome,8);
  }
  function stillGear(g){gear(null,{pitch:0,lean:0},(a,b,k)=>leg(g,a,b,k),p=>diff(g,...p));}
  function runningGear(list,model,v,ground,h=v.hydraulic){
    const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),world=p=>[v.x+p[0]*cs+p[2]*sn,ground+p[1],v.z-p[0]*sn+p[2]*cs];
    if(!h||Math.abs(h.bodyLift||0)+Math.abs(v.pitch||0)+Math.abs(v.lean||0)<.018&&!(h.wheelLift||[]).some(x=>x>.016)){
      model("solena-gear/rest",stillGear);list.push(["solena-gear/rest",v.x,ground,v.z,v.yaw]);return;
    }
    gear(h,v,(p,q,kind)=>{
      const a=world(p),b=world(q),dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz);
      const size=Math.max(1,Math.round(len*28)),l=size/28,id="solena-gear/"+kind+size;
      model(id,g=>leg(g,[0,0,-l*.5],[0,0,l*.5],kind));
      list.push([id,(a[0]+b[0])*.5,(a[1]+b[1])*.5,(a[2]+b[2])*.5,Math.atan2(dx,dz),-Math.atan2(dy,Math.hypot(dx,dz))]);
    },p=>{model("solena-gear/diff",g=>diff(g,0,0,0));list.push(["solena-gear/diff",...world(p),v.yaw]);});
  }
  function origin(g,x,z){for(let i=0;i<g.vertices.length;i+=6){g.vertices[i]-=x;g.vertices[i+2]-=z;}}
  function coach(g,doors,wind,panels,roof,paint){
    body(g,doors,paint);ends(g,paint);deckPaint(panels,paint);doorAndFlank(g,doors,paint);
    greenhouse(roof,doors,wind,paint);chassis(g);seats(g);
  }
  function build(g,s,paint,parts){
    const doors=parts?parts.doors:{[-1]:g,1:g};
    coach(g,doors,parts?.windshield||g,g,g,paint||s.paint);
    for(const k of sides){
      signal(g,s,k,true,false);signal(g,s,k,false,false);
      if(parts){
        origin(doors[k],k*s.hingeX,s.hingeZ);rim(parts.wheels[k],k,0,0,0);
        rect(parts.reverse,rear-.025,k*.367-.042,k*.367+.042,.579,.636,"#fff3c9");
      }else for(const z of s.axles)rim(g,k,k*(s.track-.085),s.wheel,z);
      rect(g,rear-.017,k*.367-.043,k*.367+.043,.577,.637,"#bdb7a3");
    }
    if(parts)brakeLights(parts.brakes,"solena");else stillGear(g);
  }
  function driverEnds(g,kind,paint){
    const shell=new BayMesh(),doors={[-1]:shell,1:shell},p=paint||shape.paint;
    body(shell,doors,p);ends(shell,p);deckPaint(shell,p);
    const v=shell.vertices;for(let i=0;i<v.length;i+=18){
      const lo=Math.min(v[i+2],v[i+8],v[i+14]),hi=Math.max(v[i+2],v[i+8],v[i+14]);
      if(lo<shape.hingeZ-.0001&&hi>shape.glass[0]+.0001)continue;
      for(let j=0;j<18;j++)g.vertices.push(v[i+j]);
    }
    const s=shape,eyeY=Math.min(s.glass[5]-.165,s.seatY+.716),dashZ=Math.min(s.glass[3]-.097,s.seatZ+.697);
    switches(g,.052,eyeY-.216,dashZ+.026);
  }
  fit(shape);
  const atlas=new Map(),mapRows=stations();
  function mapPaint(v){
    const paint=v.color||shape.paint;
    let stamp=0;for(const side of ["front","rear","left","right"])stamp=(stamp<<4)|Math.round(clamp(v.damage?.[side]||0,0,1)*15);
    const key=paint+stamp,cached=atlas.get(key);if(cached)return cached;
    const faces=new BayMesh(),top=new BayMesh(),doors={[-1]:new BayMesh(),1:new BayMesh()};
    coach(faces,doors,top,faces,top,paint);
    const draw=BayDealerCars.sprite,bend=stamp&&window.BayBodyworkArt?.deformer?.(v);
    const art={shell:draw(faces,0,0,bend),cap:draw(top,0,0,bend),doors:{},bend,rocker:color(paint,"#2b2933",.40),quarter:color(paint,"#513942",.24)};
    for(const k of sides){const g=doors[k],x=k*shape.hingeX,z=shape.hingeZ;origin(g,x,z);art.doors[k]=draw(g,x,z,bend);}
    if(atlas.size>=12)atlas.delete(atlas.keys().next().value);atlas.set(key,art);return art;
  }
  function polygon(c,p,fill){
    c.fillStyle=fill;c.beginPath();c.moveTo(...p[0]);for(let i=1;i<p.length;i++)c.lineTo(...p[i]);c.closePath();c.fill();
  }
  function stroke(c,p,q,width,col){
    c.lineWidth=width;c.strokeStyle=col;c.beginPath();c.moveTo(...p);c.lineTo(...q);c.stroke();
  }
  // Project independent height slices of the actual car. The tires stay on their own
  // corner heights, so the stretched ram and the shadow remain visible during a hop.
  function map(c,v,x,y,scale,t=0){
    if(!owns(v.kind)||!(scale>0))return;
    const s=shape,h=v.hydraulic||{},paint=v.color||s.paint,yaw=v.yaw||0,cp=Math.cos(yaw),sp=Math.sin(yaw);
    const pitch=(v.pitch||0)+(h.pitch||0),lean=(v.lean||0)+(h.lean||0),lift=h.bodyLift||0;
    const px=-.107*cp-.277*sp,py=.107*sp-.277*cp,cosP=Math.cos(pitch),sinP=Math.sin(pitch),cosL=Math.cos(lean),sinL=Math.sin(lean);
    const road=p=>[p[0]+px*p[1],-p[2]+py*p[1]];
    function shell(p){
      const up=p[1]*cosP-p[2]*sinP,height=p[0]*sinL+up*cosL+lift;
      return [p[0]*cosL-up*sinL+px*height,-p[1]*sinP-p[2]*cosP+py*height];
    }
    const lit=(v.brakes||0)>.18||(v.handbrake||0)>.48;
    c.save();c.translate(x,y);c.rotate(yaw);c.scale(scale,scale);
    if(scale<3.5){
      const corners=[[-.85,.79,front],[.85,.79,front],[1,.85,2.24],[1,.84,-2.24],[.85,.82,rear],[-.85,.82,rear],[-1,.84,-2.24],[-1,.85,2.24]];
      polygon(c,corners.map(shell),paint);
      polygon(c,[[-.85,.88,.97],[.85,.88,.97],[.72,1.41,.46],[-.72,1.41,.46]].map(shell),"#415c65");
      polygon(c,[[-.72,1.41,.45],[.72,1.41,.45],[.72,1.41,-.985],[-.72,1.41,-.985]].map(shell),"#d5bd99");
      c.restore();return;
    }
    const art=mapPaint(v),shadow=[],rows=s.sections,shade=Math.min(1,Math.abs(lift)*.6);
    for(const k of sides)for(let i=0;i<rows.length;i++){const [z,w]=rows[k<0?i:rows.length-1-i];
      shadow.push([k*w+.097+.13*shade,-z+.099+.23*shade]);}
    polygon(c,shadow,"rgba(35,39,40,"+(.43-.17*shade)+")");
    const open=k=>Math.max(v.doorSide===k?v.doorAngle||0:0,k===1?v.passengerDoor||0:0);
    function door(p,k){
      const a=-k*open(k),sn=Math.sin(a),cs=Math.cos(a),x=p[0]-k*s.hingeX,z=p[2]-s.hingeZ;
      return shell([x*cs+z*sn+k*s.hingeX,p[1],z*cs-x*sn+s.hingeZ]);
    }
    function layer(img,height,k){
      if(!img)return;
      const at=(u,n)=>{
        const p=[u+.037*height+(k?k*s.hingeX:0),height,-n-.109*height+(k?s.hingeZ:0)];
        return k?door(p,k):shell(p);
      };
      const o=at(0,0),a=at(1,0),b=at(0,1);
      c.save();c.transform(a[0]-o[0],a[1]-o[1],b[0]-o[0],b[1]-o[1],o[0],o[1]);
      c.drawImage(img.canvas,img.left,img.top,img.w,img.h);c.restore();
    }
    for(const [axle,z] of s.axles.entries())for(const [i,k] of sides.entries()){
      const steer=axle?v.steer||0:0,ss=Math.sin(steer),cs=Math.cos(steer);
      const flat=v.flatSide===k&&v.flatAxle===z,r=s.wheel*(flat?.85:1),height=r+(h.wheelLift?.[axle*2+i]||0),cx=k*(s.track-.085);
      const tire=(u,w,a)=>road([cx+u*cs+w*Math.cos(a)*ss,height+w*Math.sin(a),z-u*ss+w*Math.cos(a)*cs]);
      const end=[];
      for(let n=0;n<12;n++){
        const a=tau*n/12,b=tau*(n+1)/12;
        const face=[tire(-.088,r,a),tire(-.088,r,b),tire(.088,r,b),tire(.088,r,a)];
        polygon(c,face,flat?"#514a45":n%3?"#303639":tread);end.push(tire(-k*.088,r,a));
      }
      polygon(c,end,tread);
      for(const [u,w,tint] of [[.099,.92,"#31383a"],[.106,.81,cream],[.109,.66,steel],[.117,.41,chrome]]){
        const ring=[];for(let j=0;j<12;j++)ring.push(tire(k*u,w*r,tau*j/12));polygon(c,ring,tint);
      }
      if(scale>24&&lift>.19)for(let j=0;j<7;j++){
        const a=tau*j/7+(v.wheelSpin||0);stroke(c,tire(k*.135,r*.12,a+.38),tire(k*.115,r*.48,a),.013,gold);
      }
    }
    if(Math.abs(lift)+Math.abs(pitch)+Math.abs(lean)>.07){
      gear(h,{pitch,lean},(a,b,kind)=>{
        stroke(c,road(a),road(b),kind==="axle"?.091:.056,kind==="link"?blueSteel:dark);
        if(kind==="ram"){
          stroke(c,road(a),road(mid(a,b,.41)),.072,"#a79879");
          stroke(c,road(mid(a,b,.41)),road(b),.031,edge);
        }
      },p=>{const a=road(p);c.fillStyle=steel;c.fillRect(a[0]-.104,a[1]-.097,.208,.194);});
    }
    const sideSurface=(k,z,level)=>{
      const {h}=section(z),low=arch(z),y=level?Math.max(low,h-.067):low;
      return bodyPoint(k,z,y);
    };
    const air=Math.abs(lift)+Math.abs(pitch)+Math.abs(lean);
    if(air>.075||open(-1)>.075||open(1)>.075){
      for(const k of sides)for(let i=1;i<mapRows.length;i++){
        const a=mapRows[i-1],b=mapRows[i],m=(a+b)*.5,doorHere=m>s.back&&m<s.hingeZ;
        const project=doorHere?p=>door(p,k):shell;
        polygon(c,[sideSurface(k,a,0),sideSurface(k,b,0),sideSurface(k,b,1),sideSurface(k,a,1)].map(project),art.quarter);
        if(arch(m)===base)stroke(c,project(bodyPoint(k,a,.346)),project(bodyPoint(k,b,.346)),.024,chrome);
      }
      for(const z of [front,rear]){
        const {w,h}=section(z);
        polygon(c,[[-w+.074,.378,z],[w-.074,.378,z],[w-.059,h-.047,z],[-w+.059,h-.047,z]].map(shell),art.rocker);
        stroke(c,shell([-.882,.376,z]),shell([.882,.376,z]),.076,chrome);
      }
    }
    layer(art.shell,.795,0);
    for(const k of sides)layer(art.doors[k],.825,k);
    layer(art.cap,1.252,0);
    const strip=(x,h,z,w,sz,paint)=>polygon(c,[[x-w*.5,h,z-sz*.5],[x+w*.5,h,z-sz*.5],[x+w*.5,h,z+sz*.5],[x-w*.5,h,z+sz*.5]].map(p=>{
      if(art.bend)art.bend(...p,p);return shell(p);
    }),paint);
    const flash=v.indicator&&(t+(Number.isFinite(v.id)?(v.id%13)*.071:0))%.84<.42;
    for(const k of sides){
      for(const n of [.548,.761])strip(k*n,.652,front+.021,.139,.059,v.damage?.front>.85?blueSteel:lamp);
      for(let i=0;i<3;i++)strip(k*(.564+.108*i),.662,rear-.019,.076,.057,lit?"#ff6857":lens);
      if(v.reversing)strip(k*.367,.605,rear-.023,.09,.060,"#fff3c9");
      if(flash&&v.indicator===k){strip(k*.692,.46,front+.032,.197,.069,"#ffc263");strip(k*.851,.52,rear-.021,.092,.071,"#ffc263");}
    }
    c.restore();
  }
  window.BaySolenaArt={owns,shapes,cockpitStyles,fit,build,driverEnds,hoodHeight,brakeLights,signal,map,runningGear};
})();
