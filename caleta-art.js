/* The Caleta's steel body ends at the waist rail. The fabric top has its own bows. */
(() => {
  "use strict";
  const tau=Math.PI*2,sides=[-1,1],mix=(a,b,t)=>a+(b-a)*t,clamp=(t,a=0,b=1)=>Math.max(a,Math.min(b,t));
  const shape={
    paint:"#f0dba4",wheel:.303,track:.855,axles:[-1.16,1.16],divider:.237,
    glass:[-1.12,-.70,.375,.79,.785,1.285,.716,.625],
    sections:[[-1.91,.732,.744],[-1.81,.799,.789],[-1.54,.855,.802],[-1.20,.879,.82],[-.88,.86,.815],
      [-.62,.836,.788],[.14,.820,.775],[.69,.838,.781],[.91,.863,.775],[1.17,.880,.76],
      [1.48,.854,.716],[1.71,.821,.682],[1.91,.762,.642],[1.98,.676,.584]]
  };
  const shapes={caleta:shape},owns=kind=>kind==="caleta";
  const cockpitStyles={caleta:{trim:"#614b38",top:"#373e3b",pad:"#54564b",cloth:"#aa7748",thread:"#e4c49b",
    edge:"#b1b2a0",face:"#202e31",ink:"#eee3be",accent:"#dd9253",rim:"#544532",hub:"#484e4a",dash:"pair",spokes:3,stamp:"CALETA",limit:105}};
  const black="#253031",gasket="#343d39",rubber="#292e31",bronze="#a09272",chrome="#bdc2b3",bright="#dad8c4",
    honey="#be8b55",leather="#9b7049",seam="#d8b78a",lamp="#ffefbd",tail="#a53a47",fabric="#2f716b",weave="#6c9990";
  function shade(a,b,t){
    const n=parseInt(a.slice(1),16),m=parseInt(b.slice(1),16);
    return "#"+[16,8,0].map(s=>Math.round(mix((n>>s)&255,(m>>s)&255,t)).toString(16).padStart(2,"0")).join("");
  }
  function section(z){
    const rows=shape.sections;let i=1;while(i<rows.length-1&&rows[i][0]<z)i++;
    const a=rows[i-1],b=rows[i],t=clamp((z-a[0])/(b[0]-a[0]));
    return {w:mix(a[1],b[1],t),h:mix(a[2],b[2],t)};
  }
  function fit(s){
    s.back=-.666;s.hingeZ=.755;s.hingeX=.826;s.handleZ=-.49;s.handleY=.663;s.handleX=section(s.handleZ).w+.017;
    s.grabZ=-.30;s.grabX=.69;s.grabY=.629;s.seatX=.40;s.seatZ=-.40;s.seatY=.37;s.floorY=.206;s.halfLength=1.98;
  }
  fit(shape);
  const nose=shape.sections.at(-1)[0],rear=shape.sections[0][0];
  const ringRadius=.337;
  function cutout(z){
    for(const axle of shape.axles){
      const u=(z-axle)/ringRadius;if(Math.abs(u)<1)return shape.wheel+Math.sqrt(1-u*u)*ringRadius;
    }
    return .227;
  }
  function topPoint(x,z,lift=0){
    const row=section(z),u=Math.abs(x)/row.w;
    return [x,row.h+.020*(1-u*u)-.035*clamp((u-.82)/.18)+lift,z];
  }
  function hoodHeight(kind,x,z){return topPoint(x,z)[1];}
  function marks(){
    const zs=new Set([...shape.sections.map(q=>q[0]),shape.back,shape.hingeZ,shape.glass[0],shape.glass[3]]);
    for(const axle of shape.axles){
      for(let i=0;i<=12;i++)zs.add(axle+Math.cos(i*Math.PI/12)*ringRadius);
      zs.add(axle-ringRadius-.016);zs.add(axle+ringRadius+.016);
    }
    return [...zs].sort((a,b)=>a-b);
  }
  const slices=marks();
  function body(g,doors,paint){
    const shoulder=shade(paint,bright,.24),sideTone=shade(paint,"#72674e",.10),sill=shade(paint,"#51483b",.30);
    for(let i=1;i<slices.length;i++){
      const a=slices[i-1],b=slices[i],mid=(a+b)*.5;
      if(b-a<.0002)continue;
      for(const k of sides){
        const leaf=mid>shape.back&&mid<shape.hingeZ?doors[k]:g;
        const profile=z=>{
          const {w,h}=section(z),bottom=cutout(z);
          return [[k*(w-.069),bottom,z],[k*(w-.030),mix(bottom,h,.32),z],[k*w,h-.070,z],topPoint(k*.968*w,z)];
        };
        const left=profile(a),right=profile(b);
        for(let j=0;j<3;j++)leaf.quad(left[j],right[j],right[j+1],left[j+1],[sill,sideTone,shoulder][j]);
        const isCabin=mid>shape.glass[0]&&mid<shape.glass[3],outer=z=>topPoint(k*.968*section(z).w,z),inner=z=>topPoint(k*(isCabin?.72:.686*section(z).w),z);
        leaf.quad(outer(a),outer(b),inner(b),inner(a),paint);
        if(!isCabin)g.quad(inner(a),inner(b),topPoint(0,b),topPoint(0,a),paint);
        // Dark wheel-well liner follows the arch, leaving daylight below the sill.
        if(cutout(mid)>.26)g.quad(left[0],right[0],[right[0][0]-k*.114,right[0][1]+.013,b],[left[0][0]-k*.114,left[0][1]+.013,a],"#343b3c");
      }
    }
    g.box(0,.236,-.02,1.43,.072,3.48,"#42423b");
    for(const [z,sign] of [[rear,-1],[nose,1]]){
      const {w,h}=section(z);
      const face=(x,y,depth)=>[x,y,z+sign*depth];
      g.quad(face(-w+.06,.255,-.031),face(w-.06,.255,-.031),face(w,h-.071,0),face(-w,h-.071,0),sideTone);
      g.quad(face(-w,h-.071,0),face(w,h-.071,0),topPoint(.968*w,z),topPoint(-.968*w,z),paint);
    }
  }
  function deck(g,paint){
    const outline=shade(paint,"#41453b",.64),wing=shade(paint,"#fff0cc",.21);
    for(const k of sides){
      const line=[[.564,.865],[.574,1.17],[.519,1.46],[.431,1.737],[.376,1.772]];
      for(let j=1;j<line.length;j++)g.pole(topPoint(k*line[j-1][0],line[j-1][1],.009),topPoint(k*line[j][0],line[j][1],.009),.0055,outline,4);
      const panel=[[.471,1.502],[.722,1.478],[.692,1.685],[.443,1.707]].map(([x,z])=>topPoint(k*x,z,.007));
      g.quad(...panel,wing);for(let i=0;i<4;i++)g.pole(panel[i],panel[(i+1)%4],.006,outline,4);
      for(let i=0;i<5;i++){
        const z=.892+i*.031;g.quad(topPoint(k*.15,z,.006),topPoint(k*.405,z,.006),topPoint(k*.408,z+.013,.006),topPoint(k*.15,z+.013,.006),gasket);
      }
      g.pole(topPoint(k*.613,-1.30,.007),topPoint(k*.577,-1.76,.007),.005,outline,4);
      g.pole(topPoint(k*.577,-1.76,.007),topPoint(k*.483,-1.8,.007),.005,outline,4);
    }
    g.pole(topPoint(-.49,-1.80,.005),topPoint(.49,-1.80,.005),.005,outline,4);
    g.box(0,.807,-1.7,.103,.016,.057,bronze);
    g.box(0,.63,1.933,.060,.012,.084,chrome);
  }
  function fascia(g,paint){
    const noseY=.461,tailY=.586;
    g.box(0,noseY,nose+.018,1.345,.118,.058,"#39413c");
    g.box(0,.381,nose+.003,.662,.080,.041,black);
    for(const x of [-.235,-.12,0,.12,.235])g.box(x,.381,nose+.026,.009,.052,.006,bronze);
    g.box(0,.591,rear-.004,1.435,.209,.018,"#474643");
    g.box(0,.380,rear-.006,1.447,.085,.072,gasket);
    g.box(0,.570,rear-.016,.34,.139,.020,"#d8cfad");
    for(const k of sides){
      g.box(k*.49,noseY+.028,nose+.052,.211,.043,.013,lamp);
      g.box(k*.645,noseY+.026,nose+.053,.072,.048,.014,"#dc9d5b");
      g.box(k*.527,tailY,rear-.019,.389,.142,.021,tail);
      g.box(k*.674,tailY+.014,rear-.034,.091,.061,.008,"#c87f43");
      for(const h of [-.03,.02])g.box(k*.523,tailY+h,rear-.034,.361,.007,.006,"#663f3e");
      g.box(k*.6,.517,rear-.036,.115,.010,.006,"#c9ab84");
      g.box(k*.335,tailY+.014,rear-.034,.047,.056,.011,"#a99e85");
      g.box(k*.72,.385,-1.817,.10,.058,.134,shade(paint,"#4c5146",.36));
    }
    g.pole([-.52,.229,-1.69],[-.52,.22,-1.96],.038,"#898c7e",8);
    g.box(-.52,.22,-1.961,.047,.038,.005,black);
  }
  function brakeLights(g){
    for(const k of sides)g.box(k*.508,.591,rear-.039,.186,.069,.013,"#ff634b");
  }
  function reverse(g){for(const k of sides)g.box(k*.335,.600,rear-.043,.047,.055,.007,"#fff7cc");}
  function signal(g,s,k,front,lit=true){
    g.box(k*(front?.645:.674),front?.487:.60,front?nose+.064:rear-.041,front?.072:.090,.055,.014,lit?"#ffbd59":"#c28444");
  }
  function glassPoint(u,h,offset=0){
    const s=shape.glass;return [u*mix(s[6],s[7],h),mix(s[4],s[5],h),mix(s[3],s[2],h)+offset];
  }
  function windshield(g,paint){
    for(const k of sides){
      g.pole(glassPoint(k,0),glassPoint(k,1),.033,gasket,6);
      g.pole(glassPoint(k,0,.014),glassPoint(k,1,.014),.022,paint,6);
      g.pole(glassPoint(k,.019),glassPoint(k*.58,.038),.009,black,5);
      g.pole(glassPoint(k*.58,.038),glassPoint(k*.265,.075),.010,black,5);
    }
    g.pole(glassPoint(-1,1),glassPoint(1,1),.031,gasket,6);
    g.pole(glassPoint(-.99,1,.016),glassPoint(.99,1,.016),.017,chrome,6);
    g.pole(glassPoint(-1,.006),glassPoint(1,.006),.023,black,6);
    // A tint band and two edge reflections describe clear glass without an opaque cabin face.
    g.quad(glassPoint(-.968,.907),glassPoint(.968,.907),glassPoint(.97,.985),glassPoint(-.97,.985),"#789795");
    g.quad(glassPoint(.72,.084),glassPoint(.756,.085),glassPoint(.96,.698),glassPoint(.958,.798),"#99b2a9");
    g.quad(glassPoint(-.963,.34),glassPoint(-.951,.30),glassPoint(-.770,.893),glassPoint(-.792,.893),"#9aafaa");
    g.pole(glassPoint(0,.938),[0,1.182,.317],.010,black,5);g.box(0,1.184,.311,.167,.053,.034,gasket);
    g.box(0,1.184,.291,.142,.035,.006,"#98a8a2");
  }
  function cabin(g){
    const s=shape;
    g.box(0,.213,-.15,1.44,.065,1.89,"#514b3b");
    g.box(0,.582,-.977,1.43,.352,.089,leather);
    g.box(0,.429,-.09,.17,.20,1.29,"#635442");
    g.pole([0,.508,-.082],[.012,.661,-.031],.018,chrome,6);
    g.box(.012,.667,-.031,.071,.06,.063,black);
    for(const k of sides){
      const x=k*s.seatX,back=s.seatZ-.20;
      g.box(x,s.seatY-.043,s.seatZ+.055,.48,.106,.50,leather);
      g.box(x,s.seatY+.006,s.seatZ+.08,.327,.043,.389,honey);
      for(const side of sides){
        g.box(x+side*.20,s.seatY+.028,s.seatZ+.054,.073,.081,.43,leather);
        g.pole([x+side*.155,s.seatY+.036,s.seatZ-.108],[x+side*.155,s.seatY+.036,s.seatZ+.245],.005,seam,4);
      }
      const seat=(u,h,f=0)=>[x+u,s.seatY+h,back-.19*h+f];
      g.quad(seat(-.202,.005,.039),seat(.202,.005,.039),seat(.179,.502,.039),seat(-.179,.502,.039),honey);
      g.quad(seat(-.203,.006,-.042),seat(.203,.006,-.042),seat(.179,.5,-.042),seat(-.179,.5,-.042),leather);
      for(const side of sides){
        g.pole(seat(side*.208,.052,.021),seat(side*.167,.459,.021),.041,leather,7);
        g.pole(seat(side*.145,.07,.046),seat(side*.121,.465,.046),.0055,seam,4);
      }
      for(const h of [.17,.239,.308,.377])g.pole(seat(-.130,h,.043),seat(.130,h,.043),.005,"#a67d50",4);
      for(const pin of [-.071,.071])g.pole(seat(pin,.48),seat(pin,.593),.009,chrome,5);
      g.box(x,s.seatY+.61,back-.10,.259,.132,.103,leather);
      g.box(x,s.seatY+.617,back-.045,.227,.101,.018,honey);
    }
    g.box(0,.730,.570,1.418,.152,.267,"#414942");g.box(0,.797,.613,1.409,.053,.281,"#3a433e");
    g.box(-s.seatX,.786,.463,.407,.121,.131,black);
    g.box(.34,.695,.428,.31,.014,.013,bronze);
    const spoke=(r,a)=>[-s.seatX+r*Math.cos(a),.739+r*Math.sin(a),-.01+.45*r*Math.sin(a)];
    for(let j=0;j<14;j++)g.pole(spoke(.14,j*tau/14),spoke(.14,(j+1)*tau/14),.013,"#654f34",5);
    for(const ang of [.18,Math.PI-.18,Math.PI*1.5])g.pole(spoke(0,0),spoke(.135,ang),.012,bronze,4);
    g.box(-s.seatX,.739,-.012,.079,.047,.054,gasket);
  }
  function doorTrim(g,k,paint){
    const s=shape,x=s.hingeX*k;
    g.box(x*.927,.504,.062,.056,.366,1.35,leather);
    g.box(x*.926,.737,.063,.065,.049,1.357,gasket);
    g.box(k*.740,.602,-.073,.063,.073,.352,"#8a694c");
    g.box(k*s.grabX,s.grabY,s.grabZ,.027,.03,.099,bright);
    g.box(k*(s.handleX-.010),s.handleY,s.handleZ,.035,.047,.155,gasket);
    g.box(k*s.handleX,s.handleY+.01,s.handleZ-.009,.031,.023,.122,chrome);
    for(const [a,b] of [[-.64,-.34],[-.34,.14],[.14,.47],[.47,.73]]){
      const at=(z,y)=>[k*(section(z).w+.001),y,z];
      g.quad(at(a,.686),at(b,.686),at(b,.700),at(a,.700),"#45645a");
    }
    const mZ=.471;
    g.pole([k*.804,.763,mZ],[k*.889,.829,mZ],.017,gasket,5);
    g.box(k*.904,.844,mZ,.144,.086,.121,paint);
    g.box(k*.904,.843,mZ-.061,.113,.055,.009,"#9daea7");
  }
  function wheel(g,k,x,y,z){
    const r=shape.wheel,n=14;
    const pt=(d,rad,t)=>[x+k*d,y+rad*r*Math.sin(t),z+rad*r*Math.cos(t)];
    const band=(d1,r1,d2,r2,col)=>{
      for(let j=0;j<n;j++){const a=tau*j/n,b=tau*(j+1)/n;g.quad(pt(d1,r1,a),pt(d1,r1,b),pt(d2,r2,b),pt(d2,r2,a),col);}
    };
    band(-.082,.86,-.061,1,"#343b38");band(-.061,1,.056,1,rubber);band(.056,1,.078,.91,"#373b39");
    band(.078,.91,.082,.68,rubber);band(.082,.68,.084,.63,chrome);band(.084,.63,.071,.55,"#787f77");
    band(.071,.555,.07,.01,"#454d4b");
    for(let i=0;i<6;i++){
      const a=i*tau/6;
      g.quad(pt(.091,.23,a-.34),pt(.073,.60,a-.22),pt(.077,.605,a+.046),pt(.100,.235,a+.25),bright);
    }
    band(.097,.253,.106,.184,chrome);band(.106,.184,.106,.009,"#615b47");
  }
  function shiftOrigin(g,x,z){const d=g.vertices;for(let i=0;i<d.length;i+=6){d[i]-=x;d[i+2]-=z;}}
  function shell(g,paint,doors){
    body(g,doors,paint);deck(g,paint);windshield(g,paint);cabin(g);fascia(g,paint);
    for(const k of sides)doorTrim(doors[k],k,paint);
  }
  function build(g,s,paint,parts){
    const doors=parts?.doors||{[-1]:g,1:g};shell(g,paint||s.paint,doors);
    for(const k of sides){
      if(parts){shiftOrigin(doors[k],k*s.hingeX,s.hingeZ);wheel(parts.wheels[k],k,0,0,0);}
      else for(const z of s.axles)wheel(g,k,k*(s.track-.085),s.wheel,z);
    }
    if(parts){brakeLights(parts.brakes);reverse(parts.reverse);}
  }
  function driverEnds(g,kind,paint){
    const mesh=new BayMesh();body(mesh,{[-1]:mesh,1:mesh},paint||shape.paint);deck(mesh,paint||shape.paint);fascia(mesh,paint||shape.paint);
    const v=mesh.vertices;
    for(let i=0;i<v.length;i+=18){
      const a=v[i+2],b=v[i+8],c=v[i+14];
      if(Math.min(a,b,c)<shape.glass[3]-.002&&Math.max(a,b,c)>shape.glass[0]+.002)continue;
      for(let j=i;j<i+18;j++)g.vertices.push(v[j]);
    }
  }
  // Rear seam, backlight bow, crown, folding seam, front header. Each pair is [z,y].
  // The header lifts over both headrests before its last short pull to the latch.
  const poses=[
    [[-1.15,.812],[-.948,.862],[-1.105,.925],[-.881,.858],[-.800,.913]],
    [[-1.15,.812],[-.934,.937],[-1.029,1.060],[-.910,.983],[-1.109,1.102]],
    [[-1.15,.812],[-.912,1.03],[-.885,1.220],[-.828,1.145],[-.934,1.368]],
    [[-1.15,.812],[-.907,1.10],[-.741,1.310],[-.637,1.29],[-.470,1.475]],
    [[-1.15,.812],[-.9,1.106],[-.642,1.335],[-.451,1.371],[-.052,1.469]],
    [[-1.15,.812],[-.89,1.108],[-.619,1.344],[-.317,1.370],[.235,1.383]],
    [[-1.15,.812],[-.89,1.102],[-.627,1.319],[-.302,1.336],[.372,1.295]]
  ];
  function bows(t){
    const f=clamp(t)*(poses.length-1),i=Math.min(poses.length-2,Math.floor(f)),u=f-i;
    const sm=(k,c)=>{
      const a=poses[Math.max(0,i-1)][k][c],b=poses[i][k][c],d=poses[i+1][k][c],e=poses[Math.min(poses.length-1,i+2)][k][c];
      return mix(b,d,u)+.5*u*(1-u)*((1-u)*(2*b-a-d)+u*(2*d-b-e));
    };
    return poses[i].map((_,k)=>({z:sm(k,0),y:sm(k,1),w:mix([.72,.691,.692,.681,.662][k],[.72,.694,.642,.634,.63][k],t)}));
  }
  function makeRoof(g,t){
    const b=bows(t);
    function at(row,u,rise=0){return [u*row.w,row.y+.031*(1-u*u)+rise,row.z-.014*u*u];}
    const across=[-1,-.82,-.42,0,.42,.82,1];
    for(let j=1;j<b.length;j++){
      const prev=b[j-1],next=b[j],atSpan=(u,v,lift=0)=>{
        const a=at(prev,u,lift),d=at(next,u,lift);return a.map((x,i)=>mix(x,d[i],v));
      };
      for(let i=1;i<across.length;i++){
        const a=across[i-1],d=across[i];
        const patch=(v0,v1,col)=>g.quad(atSpan(a,v0),atSpan(d,v0),atSpan(d,v1),atSpan(a,v1),col);
        const cloth=Math.max(Math.abs(a),Math.abs(d))>.9?"#2c625c":j===3?"#396f69":fabric;
        if(j===1&&a>=-.82&&d<=.82){
          patch(0,.22,cloth);patch(.86,1,cloth);
          if(t<.35)patch(.22,.86,"#536a64");
          else if(a===-.82||d===.82)patch(.22,.86,"#648a87");
          else patch(.76,.86,"#71938f");
        }else patch(0,1,cloth);
      }
      for(const k of sides){
        g.pole(at(prev,k),at(next,k),.013,"#264f4b",5);
        if(j>1)g.pole(at(prev,k*.907,.002),at(next,k*.907,.002),.0045,weave,4);
      }
    }
    for(const j of [1,2,4]){
      for(let i=1;i<across.length;i++){
        g.pole(at(b[j],across[i-1],.003),at(b[j],across[i],.003),j===4?.017:.008,j===4?"#355349":"#5c8277",5);
      }
    }
    for(const k of sides){
      const pivot=[k*.70,.774,-.67],elbow=[k*.686,b[2].y-.063,b[2].z+.030],front=at(b[4],k);
      g.pole(pivot,elbow,.014,"#777c6b",5);g.pole(elbow,front,.014,black,5);
      const rail=[k*.718,.800,-.756];
      g.tri(at(b[0],k),at(b[1],k),rail,"#275e58");g.tri(at(b[1],k),at(b[2],k),rail,"#316b61");
      g.pole(rail,at(b[2],k),.010,gasket,5);
    }
  }
  const frames=40,roofFrame=v=>Math.round(clamp(v.softTop||0)*frames),roofNames=Array.from({length:frames+1},(_,i)=>"caleta/top/"+i);
  function roof(list,model,v,ground){
    const no=roofFrame(v),key=roofNames[no];model(key,g=>makeRoof(g,no/frames));
    list.push([key,v.x,ground,v.z,v.yaw,v.pitch||0,v.lean||0]);
  }
  const atlasShells=new Map(),atlasRoofs=[];
  function shellPrint(v){
    const paint=v.color||shape.paint,d=v.damage,damage=d?["front","rear","left","right"].map(k=>Math.round(clamp(d[k]||0)*15)).join(","):"";
    const key=paint+damage;
    if(atlasShells.has(key))return atlasShells.get(key);
    const body=new BayMesh(),doors={[-1]:new BayMesh(),1:new BayMesh()},sprite=BayDealerCars.sprite,bend=d&&window.BayBodyworkArt?.deformer?.(v);
    shell(body,paint,doors);
    const art={body:sprite(body,0,0,bend),door:{}};
    for(const k of sides){shiftOrigin(doors[k],k*shape.hingeX,shape.hingeZ);art.door[k]=sprite(doors[k],k*shape.hingeX,shape.hingeZ,bend);}
    if(atlasShells.size>=10)atlasShells.delete(atlasShells.keys().next().value);
    atlasShells.set(key,art);return art;
  }
  function roofPrint(n){
    if(!atlasRoofs[n]){const m=new BayMesh();makeRoof(m,n/frames);atlasRoofs[n]=BayDealerCars.sprite(m,0,0);}
    return atlasRoofs[n];
  }
  function drawPrint(c,p){if(p)c.drawImage(p.canvas,p.left,p.top,p.w,p.h);}
  function map(c,v,x,y,scale,t=0){
    if(!(scale>0))return;
    const n=roofFrame(v);
    c.save();c.translate(x,y);c.rotate(v.yaw||0);c.scale(scale,scale);
    if(scale<3.5){
      c.fillStyle=v.color||shape.paint;c.beginPath();c.moveTo(-.66,-nose);
      for(const [px,py] of [[.66,-nose],[.86,-1.39],[.85,1.52],[.70,-rear],[-.70,-rear],[-.85,1.52],[-.86,-1.39]])c.lineTo(px,py);
      c.closePath();c.fill();c.fillStyle="#584b3d";c.fillRect(-.67,-.38,1.34,1.47);
      const front=bows(n/frames)[4].z;c.fillStyle=fabric;c.fillRect(-.65,-front,1.30,Math.max(.20,front+1.16));
    }else{
      const art=shellPrint(v);
      c.fillStyle="#65675e";c.fillRect(-.72+.107,-nose+.25,1.52,nose-rear-.22);
      for(const k of sides)for(const z of shape.axles){
        c.save();c.translate(k*(shape.track-.085),-z);if(z>0)c.rotate(v.steer||0);
        c.fillStyle=rubber;c.fillRect(-.085,-shape.wheel,.17,shape.wheel*2);c.restore();
      }
      drawPrint(c,art.body);
      for(const k of sides){
        const open=Math.max(v.doorSide===k?v.doorAngle||0:0,k>0?v.passengerDoor||0:0);
        c.save();c.translate(k*shape.hingeX,-shape.hingeZ);c.rotate(-k*open);drawPrint(c,art.door[k]);c.restore();
      }
      for(const k of sides){
        const shirt=k<0?v.caletaSeats?.driver:v.caletaSeats?.passenger;if(!shirt)continue;
        const x=k*shape.seatX-.028,y=-shape.seatZ-.093;
        c.fillStyle=shirt;c.beginPath();c.ellipse(x,y,.220,.123,0,0,tau);c.fill();
        c.fillStyle="#ac7c5e";c.beginPath();c.ellipse(x,y-.036,.107,.115,0,0,tau);c.fill();
        c.fillStyle="#493f35";c.beginPath();c.ellipse(x,y-.006,.102,.095,0,0,tau);c.fill();
      }
      drawPrint(c,roofPrint(n));
    }
    for(const k of sides){
      if(v.brakes>.2||v.handbrake>.4){c.fillStyle="#ff694c";c.fillRect(k*.508-.09,-rear-.047,.18,.045);}
      if(v.reversing){c.fillStyle="#fff1c1";c.fillRect(k*.335-.025,-rear-.045,.05,.043);}
      if(v.indicator===k&&(t+(Number.isFinite(v.id)?v.id%13*.071:0))%.84<.42){
        c.fillStyle="#ffbc59";c.fillRect(k*.67-.051,-rear-.046,.102,.054);c.fillRect(k*.645-.048,-nose-.097,.096,.047);
      }
    }
    c.restore();
  }
  window.BayCaletaArt={owns,shapes,cockpitStyles,fit,build,driverEnds,hoodHeight,brakeLights,signal,map,roof};
})();
