/* The arm, shoe and truck contacts are all measured on one 8½-inch deck. */
(() => {
  "use strict";
  const tau=2*Math.PI,pi=Math.PI,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const mix=(a,b,k)=>a+(b-a)*k;
  const fade=(a,b,n)=>{const f=clamp((n-a)/(b-a));return f*f*(3-2*f);};
  const pulse=(a,b,c,d,n)=>fade(a,b,n)*(1-fade(c,d,n));
  const between=(a,b,n)=>[mix(a[0],b[0],n),mix(a[1],b[1],n),mix(a[2],b[2],n)];
  const dock="#3a4950",slate="#29363c",chrome="#b9c3b9",brass="#caad79",rubber="#3b3e3e";
  const wood="#d7b882",ply="#b17f59",chalk="#eddfc0",grip="#384449";
  const paint={
    sol:{skin:"#986549",shirt:"#4f7e90",pants:"#565b67",accent:"#dca35a",sole:"#b88851",ink:"#344f70",print:"#d7a953",hat:"#607f8a",hair:"#393637"},
    market:{skin:"#ad7655",shirt:"#b65d59",pants:"#4b5c65",accent:"#cdb26e",sole:"#aa784f",ink:"#545b51",print:"#cb766d",hat:"#ad8756",hair:"#433735"}
  };
  const colors=Object.fromEntries(Object.entries(paint).map(([id,p])=>[id,[p.skin,p.shirt,p.pants]]));
  const roles={sol:"local",market:"local"},styleOf=id=>id==="market"?"market":"sol";
  const wheelY=-.070,wheelR=.030,axle=.209,wheelX=.099;
  const sections=[
    [-.422,.016,.051],[-.417,.047,.050],[-.401,.079,.045],[-.375,.098,.037],[-.345,.106,.026],
    [-.303,.109,.011],[-.245,.108,.000],[-.080,.105,0],[.102,.106,0],[.250,.108,0],
    [.306,.109,.010],[.359,.106,.034],[.393,.096,.047],[.421,.074,.056],[.436,.043,.061],[.440,.016,.062]
  ];
  const plan=(x,z)=>{
    let i=1;while(i<sections.length-1&&z>sections[i][0])i++;
    const a=sections[i-1],b=sections[i],f=clamp((z-a[0])/(b[0]-a[0]));
    return mix(a[2],b[2],f)+.0065*(x/mix(a[1],b[1],f))**2;
  };
  function ellipse(g,center,rx,rz,angle,color,point,n=14){
    const ca=Math.cos(angle),sa=Math.sin(angle),[x,z]=center,at=point(x,z);
    const edge=u=>{const dx=Math.cos(u)*rx,dz=Math.sin(u)*rz;return point(x+ca*dx-sa*dz,z+sa*dx+ca*dz);};
    for(let i=0;i<n;i++)g.tri(at,edge(tau*i/n),edge(tau*(i+1)/n),color);
  }
  function patch(g,points,color,point){
    for(let i=1;i<points.length-1;i++)g.tri(point(...points[0]),point(...points[i]),point(...points[i+1]),color);
  }
  function slash(g,x,z,X,Z,w,color,point){
    const dx=X-x,dz=Z-z,k=w/(2*Math.hypot(dx,dz)),a=-dz*k,b=dx*k;
    g.quad(point(x+a,z+b),point(X+a,Z+b),point(X-a,Z-b),point(x-a,z-b),color);
  }
  function underprint(g,id){
    // The blue pier board carries a fish crossing a setting sun. The market board uses a fruit-crate stamp.
    const p=(x,z)=>[x,plan(x,z)-.0136,z],over=(x,z)=>[x,plan(x,z)-.0150,z],fine=(x,z)=>[x,plan(x,z)-.0162,z];
    if(id==="sol"){
      for(const [z0,z1,col] of [[-.170,-.130,"#628586"],[-.117,-.101,"#ebcc8d"],[.066,.091,"#d1b07c"],[.104,.118,"#719891"]]){
        patch(g,[[-.103,z0],[-.103,z1],[.103,z1+.077],[.103,z0+.077]],col,p);
      }
      ellipse(g,[.019,.014],.063,.068,-.18,"#dcaa61",p,19);
      for(const [z,x,X] of [[.002,-.041,.077],[-.010,-.037,.076],[-.024,-.031,.070]])slash(g,x,z,X,z+.003,.0035,"#405f77",over);
      patch(g,[[-.087,-.132],[-.039,-.090],[.019,-.026],[.065,.107],[.009,.050],[-.060,-.045]],"#f0dcc0",over);
      patch(g,[[-.087,-.132],[-.061,-.052],[-.084,-.061],[-.094,-.015],[-.045,-.053]],"#c4cfb9",fine);
      patch(g,[[-.025,-.065],[.007,-.049],[.031,-.092],[.021,-.029]],"#e3c48c",fine);
      slash(g,.010,.005,.029,.034,.004,"#3a5668",fine);
      ellipse(g,[.022,.022],.0032,.004,0,slate,fine,7);
      for(const [x,z] of [[-.078,.252],[-.063,.252],[-.048,.252]])slash(g,x,z,x+.018,z+.041,.006,chalk,over);
    }else{
      const border=(x,z,w,d)=>{for(const [a,b,A,B] of [[x,z,x+w,z],[x+w,z,x+w,z+d],[x+w,z+d,x,z+d],[x,z+d,x,z]])slash(g,a,b,A,B,.004,"#edc58f",p);};
      border(-.088,-.180,.176,.355);border(-.078,-.169,.156,.335);
      ellipse(g,[-.012,-.009],.070,.101,-.22,"#596d56",over,20);
      ellipse(g,[-.012,-.009],.061,.092,-.22,"#e2b78b",fine,19);
      const flesh=(x,z)=>[x,plan(x,z)-.0174,z],seed=(x,z)=>[x,plan(x,z)-.0185,z];
      ellipse(g,[-.012,-.009],.050,.078,-.22,"#ba665f",flesh,18);
      for(let i=0;i<13;i++){
        const a=i*2.399,r=.013+.029*(i/13);
        ellipse(g,[-.01+Math.cos(a)*r,-.006+Math.sin(a)*r*1.39],.0041,.0066,a,"#f0cd93",seed,6);
      }
      patch(g,[[.002,.091],[.024,.149],[.059,.155],[.045,.118]],"#566952",fine);
      slash(g,.007,.087,.042,.142,.0033,"#e8c98a",seed);
      for(const z of [-.237,.245])for(const x of [-.068,-.036,.008,.039]){
        slash(g,x,z,x+.014,z+.032,.006,"#ecc78f",over);
      }
    }
    // Razor tail, wax nicks and off-centre mounting holes expose maple through the ink.
    for(const [x,z,X,Z,w] of [[-.068,-.377,-.059,-.341,.011],[.047,-.405,.055,-.377,.007],[-.084,.371,-.076,.402,.007],
      [.073,.067,.078,.142,.003],[-.033,-.109,-.028,-.060,.003],[.085,-.151,.091,-.084,.004]]){
      slash(g,x,z,X,Z,w,wood,fine);
    }
  }
  function truck(g,z,fine){
    const sign=Math.sign(z);
    g.box(0,-.025,z-sign*.013,.070,.017,.083,"#808e8f");
    if(!fine){
      g.box(0,-.046,z,.045,.039,.041,chrome);
      g.box(0,wheelY,z,.197,.022,.024,"#a6b1ad");
      return;
    }
    g.box(0,-.013,z-sign*.012,.068,.006,.079,"#705a4b");
    g.pole([0,-.028,z-sign*.034],[0,-.067,z],.020,chrome,6);
    g.pole([-.105,wheelY,z],[.105,wheelY,z],.011,chrome,7);
    g.pole([-.081,-.067,z],[.081,-.067,z],.018,"#a6b1ad",7);
    g.cyl(0,-.048,z+sign*.020,.023,.021,.018,9,"#b57c50");
    g.cyl(0,-.058,z+sign*.017,.014,.015,.012,6,slate);
    g.pole([-.050,-.056,z],[.051,-.056,z],.008,"#d0d3be",5);
    g.box(.032,-.083,z+.004,.035,.002,.008,"#c8c9af");
  }
  function wheel(g,id,fine,x=0,z=0,y=0){
    const n=fine?12:8,ext=.016,r=wheelR;
    const p=(u,X,rad)=>[x+X,y+rad*Math.sin(u),z+rad*Math.cos(u)];
    if(!fine){
      for(let i=0;i<n;i++){
        const a=tau*i/n,b=tau*(i+1)/n;
        g.quad(p(a,-ext,r),p(b,-ext,r),p(b,ext,r),p(a,ext,r),"#c6ba98");
        for(const side of [-1,1])g.tri([x+side*ext,y,z],p(a,side*ext,r),p(b,side*ext,r),i===2?paint[id].ink:chalk);
      }
      return;
    }
    const rings=[[-ext,.75*r],[-ext*.82,.93*r],[-ext*.54,r],[ext*.54,r],[ext*.82,.93*r],[ext,.75*r]];
    for(let i=0;i<n;i++){
      const a=tau*i/n,b=tau*(i+1)/n;
      for(let j=1;j<rings.length;j++)g.quad(p(a,...rings[j-1]),p(b,...rings[j-1]),p(b,...rings[j]),p(a,...rings[j]),j===3?"#b8ae89":chalk);
      for(const side of [-1,1]){
        const X=side*(ext+.0002);
        g.quad(p(a,X,.75*r),p(b,X,.75*r),p(b,X,.37*r),p(a,X,.37*r),(i===1||i===2||i===8)?paint[id].ink:chalk);
        g.quad(p(a,X,.37*r),p(b,X,.37*r),p(b,X,.20*r),p(a,X,.20*r),dock);
        g.tri(p(a,X,.20*r),p(b,X,.20*r),[x+X,y,z],chrome);
      }
    }
  }
  function deck(g,id,far){
    const top=(x,z)=>[x,plan(x,z)+.0007,z],corners=far?[-1,1]:[-1,-.65,0,.65,1];
    const rows=far?sections.filter((_,i)=>i%2===0||i===sections.length-1):sections;
    for(let i=1;i<rows.length;i++){
      const [a,u]=rows[i-1],[b,v]=rows[i],p=(s,z,w,dy)=>[s*w,plan(s*w,z)+dy,z];
      for(let j=1;j<corners.length;j++){
        const l=corners[j-1],r=corners[j];
        g.quad(p(l,a,u,0),p(r,a,u,0),p(r,b,v,0),p(l,b,v,0),grip,1+(i%3)*.019);
        g.quad(p(l,a,u,-.012),p(l,b,v,-.012),p(r,b,v,-.012),p(r,a,u,-.012),id==="sol"?paint.sol.ink:paint.market.print);
      }
      for(const s of [-1,1]){
        if(far){g.quad(p(s,a,u,0),p(s,b,v,0),p(s,b,v,-.012),p(s,a,u,-.012),wood);continue;}
        g.quad(p(s,a,u,0),p(s,b,v,0),p(s,b,v,-.006),p(s,a,u,-.006),wood);
        g.quad(p(s,a,u,-.006),p(s,b,v,-.006),p(s,b,v,-.012),p(s,a,u,-.012),ply);
      }
    }
    for(const idx of [0,sections.length-1]){const [z,w,h]=sections[idx];g.box(0,h-.004,z,w*2,.013,.0015,wood);}
    if(!far)underprint(g,id);
    const strip=(x,z)=>[x,plan(x,z)+.0016,z];
    for(const d of [-.271,-.252])slash(g,-.099,d,.103,d+.034,id==="sol"?.0055:.009,id==="sol"?wood:"#bb8f76",strip);
    // Chalk arrow under the front shoe and a little of yesterday's curb wax on the rail.
    patch(g,[[-.024,.281],[.002,.334],[.025,.281],[.003,.295]],paint[id].accent,strip);
    if(!far){
      for(const [x,z,X,Z] of [[-.07,-.155,-.026,-.135],[.049,.125,.077,.132],[-.022,.345,.012,.361],[.046,-.393,.054,-.373]]){
        slash(g,x,z,X,Z,.002,"#81887a",top);
      }
      for(const z of [-axle,axle])for(const k of [-1,1])for(const s of [-1,1]){
        const x=s*.032,Z=z+k*.022;ellipse(g,[x,Z],.0054,.0054,0,"#bdbda7",strip,8);
        slash(g,x-.0025,Z-.001,x+.0025,Z+.001,.0014,slate,(x,z)=>[x,plan(x,z)+.0021,z]);
      }
    }
    for(const z of [-axle,axle]){
      truck(g,z,!far);
      if(far)for(const s of [-1,1])wheel(g,id,false,s*wheelX,z,wheelY);
    }
  }
  function camcorder(g){
    g.box(0,0,-.012,.144,.111,.187,"#495450");
    g.box(.008,.010,-.026,.149,.076,.149,"#64716c");
    g.box(.081,-.006,-.019,.014,.072,.125,"#49504c");
    g.box(-.075,.006,-.027,.011,.069,.125,"#89938a");
    g.box(-.082,.015,-.026,.003,.033,.084,chalk);
    g.box(-.084,.015,-.050,.002,.016,.027,"#a66258");
    for(const z of [-.018,-.006,.006])g.box(-.084,.016,z,.002,.005,.006,dock);
    g.box(.017,-.006,-.123,.113,.091,.042,slate);
    for(const z of [-.132,-.127])g.box(.017,-.005,z,.116,.058,.002,"#76817a");
    const ring=(a,b,r,col,n=12)=>g.pole([-.031,.013,a],[-.031,.013,b],r,col,n);
    ring(.070,.126,.046,dock);ring(.087,.101,.050,rubber);ring(.116,.141,.052,"#779087");ring(.136,.147,.045,slate);
    for(let i=0;i<14;i++){
      const a=tau*i/14,b=tau*(i+1)/14,p=(k,rad,z)=>[-.031+rad*Math.cos(k),.013+rad*Math.sin(k),z];
      g.quad(p(a,.050,.145),p(b,.050,.145),p(b,.037,.146),p(a,.037,.146),dock);
      g.tri(p(a,.037,.146),p(b,.037,.146),[-.031,.013,.147],i<5?"#536e75":"#334c5b");
    }
    g.box(-.050,.030,.148,.013,.005,.001,"#a4c7c2");g.box(-.018,.051,.079,.029,.008,.005,"#c94a41");
    g.pole([.038,.056,-.044],[.038,.064,-.113],.021,rubber,8);
    g.pole([.038,.068,-.100],[.038,.069,-.146],.031,rubber,8);
    g.box(-.015,.083,-.023,.096,.013,.086,dock);
    for(const z of [-.053,.005])g.box(-.015,.067,z,.015,.032,.014,dock);
    g.box(.078,.006,-.018,.028,.014,.127,"#3c4746");g.box(.085,.008,.018,.017,.018,.017,brass);
    g.box(-.023,.052,-.026,.060,.008,.071,"#5a6864");
    for(let i=0;i<4;i++)g.box(-.042+i*.013,.057,-.014,.007,.003,.022,i===0?"#b67660":"#adb3a2");
  }
  function install(model){
    for(const id of ["sol","market"]){
      model("skate/deck/"+id,g=>deck(g,id,false));
      model("skate/board/"+id,g=>deck(g,id,true));
      model("skate/carry/"+id,g=>{
        deck(g,id,false);
        for(const z of [-axle,axle])for(const s of [-1,1])wheel(g,id,false,s*wheelX,z,wheelY);
      });
      model("skate/wheel/"+id,g=>wheel(g,id,true));
    }
    model("skate/hi8",camcorder);
  }
  // Column vectors follow BayView's Y yaw, Z roll, X pitch composition.
  function basis(yaw=0,pitch=0,roll=0){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
    return [[cy*cr,sr,-sy*cr],[-cy*sr*cp+sy*sp,cr*cp,sy*sr*cp+cy*sp],[cy*sr*sp+sy*cp,-cr*sp,-sy*sr*sp+cy*cp]];
  }
  function rotate(m,p){
    return [m[0][0]*p[0]+m[1][0]*p[1]+m[2][0]*p[2],m[0][1]*p[0]+m[1][1]*p[1]+m[2][1]*p[2],m[0][2]*p[0]+m[1][2]*p[1]+m[2][2]*p[2]];
  }
  function plus(a,b){return [a[0]+b[0],a[1]+b[1],a[2]+b[2]];}
  function angles(m){return [Math.atan2(-m[2][1],m[1][1]),Math.atan2(-m[0][2],m[0][0]),Math.asin(clamp(m[0][1],-1,1))];}
  function baseFrame(r){
    const pitch=r.pitch||0,lean=r.lean||0,flip=r.roll||0,air=Math.max(0,r.air||0),bail=clamp(r.bail||0);
    const bank=r.bankPitch||0,contact=1-fade(.015,.17,air);
    const pitchBase=pitch-bank,activeRoll=lean+Math.sin(flip)*contact;
    // Rolling on two wheels lifts the board about the loaded axle, not its centre.
    const gripHeight=r.grind ? .085 : .10; // The hanger sits between the wheels on a rail.
    const lift=gripHeight+contact*(Math.abs(Math.sin(pitchBase))*axle+.105*Math.abs(Math.sin(activeRoll))-.066*(1-Math.cos(pitchBase)));
    return {pitch,lean,flip,air,bail,lift,roll:lean+flip+.15*bail,center:[-.16*bail,lift,.265*bail],twist:.20*bail};
  }
  function riderToWorld(r,p,dy=0){
    const yaw=r.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
    return [r.x+c*p[0]+s*p[2],(r.y||0)+dy+p[1],r.z-s*p[0]+c*p[2]];
  }
  const spins=new WeakMap();
  function spin(r,t){
    if(Number.isFinite(r.wheelSpin))return r.wheelSpin;
    let last=spins.get(r);
    if(!last){last={t,a:0};spins.set(r,last);}
    const dt=clamp(t-last.t,0,.15);last.a=(last.a+(r.speed||0)*dt/wheelR)%tau;last.t=t;
    return last.a;
  }
  function pieces(list,id,pos,yaw,pitch,roll,rotation,near){
    if(!near){list.push(["skate/board/"+id,...pos,yaw,pitch,roll]);return;}
    list.push(["skate/deck/"+id,...pos,yaw,pitch,roll]);
    const m=basis(yaw,pitch,roll);
    for(const z of [-axle,axle])for(const x of [-wheelX,wheelX]){
      list.push(["skate/wheel/"+id,...plus(pos,rotate(m,[x,wheelY,z])),yaw,pitch+rotation,roll]);
    }
  }
  function world(list,r,t=0,detail=true){
    if(!r)return;
    const f=baseFrame(r),id=styleOf(r.style),near=detail!==false&&detail?.near!==false;
    pieces(list,id,riderToWorld(r,f.center,f.air),(r.yaw||0)+f.twist,f.pitch,f.roll,spin(r,t),near);
  }
  const pushingFoot=[
    [0,-.034,.253,-.239,1.32,0],[.11,.128,.321,-.043,.82,-.24],[.23,.246,.164,.206,.11,-.12],
    [.37,.249,.153,.095,.08,0],[.53,.252,.153,-.169,.08,.06],[.66,.261,.190,-.390,.13,.42],
    [.80,.252,.309,-.389,.72,.69],[.93,.065,.292,-.281,1.22,.13],[1,-.034,.253,-.239,1.32,0]
  ];
  function stroke(phase){
    const n=((phase%1)+1)%1;let j=1;while(n>pushingFoot[j][0])j++;
    const a=pushingFoot[j-1],b=pushingFoot[j],f=fade(a[0],b[0],n);
    return [mix(a[1],b[1],f),mix(a[2],b[2],f),mix(a[3],b[3],f),mix(a[4],b[4],f),mix(a[5],b[5],f)];
  }
  const sole=[[-.061,-.090],[.060,-.090],[.069,.077],[.043,.169],[-.044,.169],[-.068,.076]];
  function planting(x,z,y,orientation){
    // The trainer has a longer toe than heel. Plant its lowest sole vertex on the hard surface.
    const up=orientation[1][1],across=orientation[0][1],along=orientation[2][1];
    let floor=Infinity;for(const point of sole)floor=Math.min(floor,across*point[0]+along*point[1]-.153*up);
    return [x,y-floor+.001,z];
  }
  function ridingForm(r,t){
    const f=baseFrame(r),air=fade(.012,.44,f.air),grind=clamp(Number(!!r.grind)),manual=clamp(r.manual||0);
    const land=clamp(r.land||0),crouch=clamp(r.crouch||0),kick=Math.abs(Math.sin(f.flip*.5));
    const strength=clamp(r.effort||0)*(1-air)*(1-f.bail)*(1-grind)*(1-manual);
    const push=r.push||0,press=pulse(.04,.22,.66,.96,push)*strength,rest=Math.sin(t*2.22),groundBank=r.bankPitch||0;
    const tilt=clamp(f.pitch,-.50,.50)*(1-.58*air),edge=clamp(f.lean,-.32,.32),yaw=f.twist;
    const seated=basis(yaw,tilt,edge),feet=[];
    for(const side of [-1,1]){
      const left=side<0,shoeYaw=left?mix(.99,.29,press):1.32;
      const x=left?-.036+.011*press:-.034,z=left?.179+.054*air:-.239+.040*air;
      const shoe=basis(shoeYaw,-.025*air,0);
      const flat=planting(x,z,plan(x,z),shoe);
      let at=plus(f.center,rotate(seated,flat));
      const knuckle=air*(left?.065:.092)+kick*(left?.103:.077);
      at[0]+=(left?.061:-.048)*kick;at[1]+=knuckle;at[2]+=(left?.073:-.012)*kick;
      let orientation=angles(shoe.map(col=>rotate(seated,col)));
      if(!left&&strength>.0001){
        const s=stroke(push),stance=basis(s[3],s[4],0),bank=basis(0,groundBank,0);
        const low=planting(s[0],s[2],0,stance)[1];
        at=between(at,rotate(bank,[s[0],Math.max(s[1],low)+.001,s[2]]),strength);
        const a=angles(stance.map(col=>rotate(bank,col)));orientation=between(orientation,a,strength);
      }
      const stumble=left?[.079,.175,.375]:[.375,.198,-.183];
      if(f.bail){at=between(at,stumble,f.bail);orientation=between(orientation,[left?-.05:.14,left?.28:.49,.02],f.bail);}
      feet.push({at,orientation});
    }
    const drop=.203*crouch+.134*land+.047*press+.093*grind+.10*f.bail;
    const hip=[-.026-.092*edge+.058*press+.161*f.bail,.979-.085*air-drop+.009*rest*(1-crouch),.015+.094*press-.115*manual+.026*air];
    const twist=1.22-.61*press-.39*f.bail-.138*air;
    const lean=.084+.300*crouch+.23*land+.16*press+.12*grind+.26*f.bail;
    const arms=clamp(.20+.50*grind+.35*manual+.27*air+.22*Math.abs(edge)+.54*f.bail);
    const counter=Math.sin(push*tau)*strength;
    const hands=[];
    for(const side of [-1,1]){
      const leading=side<0,reach=(leading?1:-1)*(.205+.257*arms+.050*counter);
      hands.push([hip[0]+.160+.092*crouch-.055*arms+(leading?.06:-.045),
        hip[1]+(leading?.147:.083)+.30*arms+.054*rest*(grind?1:.16)+(leading?-.07:.08)*counter+.079*air,
        hip[2]+reach+(leading?.095:-.024)*press]);
    }
    return {f,feet,hands,hip,twist,lean,edge,press,crouch,land,air,rest,grind,manual};
  }
  function joint(l,arm,target,pole){
    const a=arm?l.shoulder:l.hip,mid=arm?l.elbow:l.knee,tip=arm?l.hand:l.ankle;
    const one=arm?l.arm:l.thigh,two=arm?l.forearm:l.shin;
    const dx=target[0]-a[0],dy=target[1]-a[1],dz=target[2]-a[2],n=Math.max(.00001,Math.hypot(dx,dy,dz));
    const ux=dx/n,uy=dy/n,uz=dz/n,len=clamp(n,Math.abs(one.length-two.length)+.001,one.length+two.length-.00025);
    const along=(one.length**2-two.length**2+len*len)/(2*len),height=Math.sqrt(Math.max(0,one.length**2-along**2));
    const dot=pole[0]*ux+pole[1]*uy+pole[2]*uz;
    let x=pole[0]-dot*ux,y=pole[1]-dot*uy,z=pole[2]-dot*uz;
    if(Math.hypot(x,y,z)<.002){x=1-ux*ux;y=-ux*uy;z=-ux*uz;}
    const f=height/(Math.hypot(x,y,z)||1);
    mid[0]=a[0]+along*ux+x*f;mid[1]=a[1]+along*uy+y*f;mid[2]=a[2]+along*uz+z*f;
    tip[0]=a[0]+ux*len;tip[1]=a[1]+uy*len;tip[2]=a[2]+uz*len;
    one.aim(a,mid);two.aim(mid,tip);
  }
  function pose(mesh,r,t=0){
    if(!mesh||!r)return false;
    const f=ridingForm(r,t),hip=f.hip,hipAngles=[.070+.17*f.crouch+.12*f.land,f.twist+.12,-f.edge*.16-.08*f.press];
    mesh.pelvis.place(hip,...hipAngles);
    // Lower the pelvis for a long push. The front trainer stays over its own pair of truck bolts.
    let excess=0;
    for(let i=0;i<2;i++){
      const l=mesh.sides[i],goal=f.feet[i].at;mesh.pelvis.map(l.thigh.pivot,l.hip);
      const dx=goal[0]-l.hip[0],dz=goal[2]-l.hip[2],reach=l.thigh.length+l.shin.length-.004;
      const ymax=goal[1]+Math.sqrt(Math.max(.001,reach*reach-dx*dx-dz*dz));excess=Math.max(excess,l.hip[1]-ymax);
    }
    if(excess>0){hip[1]-=excess;mesh.pelvis.place(hip,...hipAngles);}
    const at=mesh.pivot;
    mesh.pelvis.map(mesh.chest.pivot,at);mesh.chest.place(at,f.lean,f.twist-.18-.12*f.air,-f.edge*.42-.08*f.press);
    mesh.chest.map(mesh.head.pivot,at);mesh.head.place(at,.025+.145*f.crouch+.092*f.land+.045*f.air,.22+.10*f.rest*(1-f.press)+.06*f.grind,-.09*f.edge);
    for(let i=0;i<2;i++){
      const l=mesh.sides[i],side=l.side,foot=f.feet[i];
      mesh.pelvis.map(l.thigh.pivot,l.hip);joint(l,false,foot.at,[.93-.38*f.press,.07,-side*.33+.58*f.press]);
      l.shoe.place(l.ankle,...foot.orientation);
      mesh.chest.map(l.arm.pivot,l.shoulder);const target=f.hands[i];target[1]-=excess;
      joint(l,true,target,[-.68,-.40,-side*.72]);
    }
    mesh.skin();mesh.lastRevision=-31;return true;
  }
  function dress(mesh,style,role="skater"){
    const id=styleOf(style);
    if(!mesh||mesh.skateClothes)return;
    const p=paint[id],filmer=role==="filmer",g=new BayMesh(),groups=[];
    const mark=(part,side=1)=>groups.push({part,side,first:g.vertices.length/6});
    mark("body");
    const chest=(x,y,k=1)=>[x,y,k*(.112+.016*clamp((y-.957)/.471))];
    const label=(x,y,w,h,col,k=1)=>g.quad(chest(x,y,k),chest(x+w,y,k),chest(x+w,y+h,k),chest(x,y+h,k),col);
    if(filmer){
      // The cartridge pocket and bent brass zipper follow the body when the filmer stoops.
      g.quad(chest(-.115,1.429),chest(-.091,1.427),chest(.117,1.012),chest(.088,1.011),slate);
      g.quad(chest(-.118,1.42,-1),chest(-.088,1.423,-1),chest(.117,1.02,-1),chest(.094,1.015,-1),dock);
      g.box(.117,1.011,.101,.127,.116,.105,id==="sol"?"#827759":"#786454");
      g.box(.117,1.047,.154,.116,.025,.010,"#a69772");g.box(.129,1.043,.166,.017,.013,.013,brass);
      label(-.099,1.293,.059,.029,id==="sol"?"#cba85f":"#e2cf98");
    }else{
      label(-.112,1.065,.085,.016,chalk);label(-.112,1.087,.049,.010,p.accent);
      for(const k of [-1,1])label(-.148,.984,.294,.016,p.accent,k);
      if(id==="sol"){
        g.quad(chest(-.123,1.324,-1),chest(-.107,1.340,-1),chest(.103,1.203,-1),chest(.094,1.185,-1),"#d7b276");
        label(-.105,1.174,.196,.014,"#e2d1ac",-1);
      }else{
        for(const [x,y,w,h] of [[-.086,1.242,.127,.012],[-.032,1.168,.012,.160],[-.063,1.196,.079,.012]])label(x,y,w,h,p.accent,-1);
      }
    }
    mark("head");
    if(id==="market"&&filmer){
      g.cyl(0,1.741,-.013,.090,.111,.080,12,p.hat);
      g.cyl(0,1.788,-.019,.048,.094,.035,12,"#b39462");
      g.cyl(0,1.719,-.011,.116,.114,.036,12,"#c2a36d");
      for(const x of [-.077,-.044,-.008,.030,.068])g.box(x,1.722,.078+(1-Math.abs(x)*10)*.025,.007,.025,.008,"#aa8b59");
      g.box(.074,1.720,.077,.030,.025,.012,chalk);
    }else{
      const back=id==="market"||!filmer;
      const cap=filmer?"#415d70":id==="sol"?"#ac8058":"#52695c";
      g.cyl(0,1.747,-.012,.089,.115,.072,12,cap);g.cyl(0,1.791,-.016,.052,.089,.026,10,cap);
      g.cyl(0,1.718,-.010,.118,.113,.017,12,p.accent);
      const dir=back?-1:1;g.box(.003,1.722,dir*.102,.170,.014,.122,cap,.07*dir);
      g.box(.003,1.717,dir*.133,.143,.008,.049,filmer?"#8c9b92":"#937b5c",.07*dir);
      g.box(-.004,1.753,dir*.093,.031,.014,.012,chalk);
      if(filmer){
        for(const s of [-1,1]){g.cyl(s*.065,1.654,-.077,.032,.034,.150,7,p.hair);g.cyl(s*.071,1.568,-.095,.025,.030,.068,7,p.hair);}
        g.cyl(-.082,1.543,-.093,.025,.027,.009,7,brass);
      }
    }
    for(const side of [-1,1]){
      const x=side*.111;mark("leg",side);
      g.box(x,.227,-.002,.121,.050,.127,id==="sol"?"#758387":"#697669");
      const soleSide=x+side*.066;
      g.quad([soleSide,.064,-.057],[soleSide,.076,-.033],[soleSide,.064,.096],[soleSide,.052,.105],p.sole);
      for(const z of [-.006,.019,.044])g.quad([x-.039,.140-z*.4,z],[x+.032,.136-z*.4,z+.005],
        [x+.032,.135-z*.4,z+.010],[x-.039,.139-z*.4,z+.005],chalk);
      if(side===1){
        mark("arm",side);
        g.cyl(.241,1.095,.015,.052,.050,.027,9,filmer?rubber:p.accent);
        if(filmer)g.box(.287,1.098,.020,.016,.020,.024,"#a9b6ae");
      }
    }
    const rest=new Float32Array(mesh.rest.length+g.vertices.length);rest.set(mesh.rest);rest.set(g.vertices,mesh.rest.length);
    for(let i=0;i<groups.length;i++){
      const item=groups[i],end=groups[i+1]?.first??g.vertices.length/6,limb=mesh.sides[item.side===1?1:0];
      for(let k=item.first;k<end;k++)mesh.bindings.push(mesh.binding(item.part,limb,g.vertices[k*6+1]));
    }
    mesh.rest=rest;mesh.vertices=rest.slice();mesh.lastRevision=-1;mesh.skateClothes=role+"/"+id;
  }
  const bindPalms=[[-.238,.977,.052],[.238,.977,.052]];
  function palm(l,target,elbow){
    const bind=bindPalms[l.side>0?1:0],wrist=target.slice();
    for(let pass=0;pass<3;pass++){
      joint(l,true,wrist,elbow);const point=l.forearm.map(bind,[]);
      for(let i=0;i<3;i++)wrist[i]=l.hand[i]+target[i]-point[i];
    }
  }
  function camAt(t,w){
    w=clamp(w);
    const breath=Math.sin(t*1.83),x=mix(.064,.060,w),y=mix(1.155,1.541,w)+.003*breath;
    const pitch=mix(.31,-.018,w)+.017*breath,roll=mix(.051,-.025,w);
    return {at:[x,y,mix(.112,.196,w)],yaw:mix(-.18,0,w),pitch,roll};
  }
  function filmerPose(mesh,a,t=0,w=1){
    if(!mesh||!a)return false;
    const m=a.motion;if(m)mesh.update(m);
    else{
      let idle=idleRigs.get(mesh);if(!idle){idle=new BayPlayerMotion();idleRigs.set(mesh,idle);}
      mesh.update(idle);
    }
    const form=camAt(t,w),frame=basis(form.yaw,form.pitch,form.roll);
    const body=mesh.pivot;mesh.chest.map(mesh.head.pivot,body);mesh.head.place(body,.142*(1-w)+.026*w,.052*w,-.040*w);
    for(const l of mesh.sides){
      mesh.chest.map(l.arm.pivot,l.shoulder);
      const handle=l.side>0?[.087,-.010,-.018]:[-.040,-.042,.087];
      palm(l,plus(form.at,rotate(frame,handle)),[l.side*.73,-.90,-.25]);
    }
    mesh.skin();mesh.lastRevision=-32;return true;
  }
  const idleRigs=new WeakMap();
  function filmerWorld(list,a,t=0,w=1){
    if(!a)return;const f=camAt(t,w);
    list.push(["skate/hi8",...riderToWorld(a,f.at,a.motion?.lift||0),(a.yaw||0)+f.yaw,f.pitch,f.roll]);
  }
  function carryPose(mesh,a,t=0){
    const m=a?.motion;if(!mesh||!m||m.ride||m.handTarget)return false;
    mesh.update(m);const l=mesh.sides[1],phase=(m.phase||0)*tau,w=m.weight||0;
    mesh.chest.map(l.arm.pivot,l.shoulder);
    palm(l,[.282+.012*w,.921+.014*w*Math.sin(phase*2),.067+.082*w*Math.cos(phase-.25)],[.70,-.80,-.57]);
    mesh.skin();mesh.lastRevision=-33;return true;
  }
  function carrying(a,t,rig){
    const m=a.motion,phase=(m?.phase||0)*tau,w=m?.weight||0,sit=clamp(m?.ride?.seat||0);
    const l=(rig||a.mesh)?.sides?.[1],hand=l?l.forearm.map(bindPalms[1],[]):
      [mix(.282,.126,sit),mix(.921+.014*w*Math.sin(phase*2),(m?.ride?.seatY||.5)+.16,sit),mix(.067+.082*w*Math.cos(phase-.25),.215,sit)];
    const yaw=.07+.19*sit,pitch=.075+.10*w*Math.cos(phase),roll=mix(1.62,.83,sit);
    const offset=rotate(basis(yaw,pitch,roll),[.099,-.004,-.012]);
    return {at:hand.map((v,i)=>v-offset[i]),yaw,pitch,roll};
  }
  function carry(list,a,t=0,style="sol",mesh){
    if(!a)return;const f=carrying(a,t,mesh);
    list.push(["skate/carry/"+styleOf(style),...riderToWorld(a,f.at,a.motion?.lift||0),(a.yaw||0)+f.yaw,f.pitch,f.roll]);
  }
  function mapLine(c,p,q,w,color){
    c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.stroke();
  }
  function fill(c,points,color){
    c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fill();
  }
  function dot(c,p,rx,rz,color,rotation=0){
    c.fillStyle=color;c.beginPath();c.ellipse(p[0],p[1],rx,rz,rotation,0,tau);c.fill();
  }
  function mapBoard(c,id,project,frame,f,state){
    const p=paint[id],sign=Math.cos(f.roll);
    const at=(x,y,z)=>project(plus(f.center,rotate(frame,[x,y,z])));
    for(const z of [-axle,axle]){
      if(sign<0)continue;
      const a=at(-wheelX-.013,wheelY,z),b=at(wheelX+.013,wheelY,z);mapLine(c,a,b,.032,chrome);
      for(const s of [-1,1])mapLine(c,at(s*wheelX,wheelY,z-wheelR*.63),at(s*wheelX,wheelY,z+wheelR*.63),.037,chalk);
    }
    const top=(x,z)=>at(x,plan(x,z),z),outline=[];
    for(const [z,w] of sections)outline.push(top(-w,z));
    for(let i=sections.length-1;i>=0;i--)outline.push(top(sections[i][1],sections[i][0]));
    fill(c,outline,sign>=0?grip:id==="market"?p.print:p.ink);
    c.strokeStyle=wood;c.lineWidth=.011;c.stroke();
    if(sign>=0){
      for(const z of [-.272,-.247])mapLine(c,top(-.097,z),top(.097,z+.037),.010,id==="sol"?wood:p.print);
      fill(c,[top(-.038,.277),top(0,.348),top(.037,.28),top(0,.305)],p.accent);
      if(state)for(const z of [-axle,axle])for(const side of [-1,1])dot(c,top(side*.035,z),.008,.008,chrome);
    }else{
      if(id==="market"){dot(c,top(-.013,-.018),.051,.075,"#e3b881",-.22);dot(c,top(-.013,-.018),.041,.060,"#a95a54",-.22);}
      else{dot(c,top(.021,.017),.045,.059,p.print);mapLine(c,top(-.08,-.102),top(.055,.098),.025,chalk);}
      for(const z of [-axle,axle]){
        mapLine(c,at(-wheelX,wheelY,z),at(wheelX,wheelY,z),.032,chrome);
        for(const side of [-1,1])mapLine(c,at(side*wheelX,wheelY,z-.015),at(side*wheelX,wheelY,z+.015),.038,chalk);
      }
    }
  }
  function artist(c,r,f,P,filming=false){
    const p=paint[styleOf(r.style)],human=r.rider==="player"||r.id==="player"||r.player===true;
    const shirt=r.shirt||(human?"#398e86":p.shirt),skin=r.skin||(human?"#af7353":p.skin),pants=r.pants||(human?"#556d80":p.pants);
    const orient=f.twist,h=f.hip,shoulders=[],feet=f.feet||[],hands=f.hands||[];
    const yaw=(v,a)=>[Math.cos(a)*v[0]+Math.sin(a)*v[2],v[1],-Math.sin(a)*v[0]+Math.cos(a)*v[2]];
    for(let i=0;i<2;i++){
      const s=i?1:-1,foot=feet[i],turn=foot.orientation[1],a=plus(h,yaw([s*.104,0,0],orient));
      const k=between(a,foot.at,.54);k[0]+=.150*(filming?.2:1);k[2]-=s*.045;
      mapLine(c,P(a),P(k),.123,pants);mapLine(c,P(k),P(foot.at),.095,pants);
      const shoe=(len)=>P(plus(foot.at,[Math.sin(turn)*len,-.12,Math.cos(turn)*len]));
      mapLine(c,shoe(-.072),shoe(.128),.130,chalk);mapLine(c,shoe(-.063),shoe(.113),.103,filming?dock:"#6b817e");
      shoulders.push(plus(h,yaw([s*.190,.422,.051],orient-.16)));
    }
    for(let i=0;i<2;i++){
      const s=i?1:-1,elbow=between(shoulders[i],hands[i],.54);elbow[0]-=.067;elbow[2]-=s*.062;
      mapLine(c,P(shoulders[i]),P(elbow),.100,shirt);mapLine(c,P(elbow),P(hands[i]),.077,skin);dot(c,P(hands[i]),.049,.045,skin);
    }
    const L=shoulders[0],R=shoulders[1],left=plus(h,yaw([-.137,0,.015],orient)),right=plus(h,yaw([.137,0,.015],orient));
    fill(c,[P(left),P(L),P(R),P(right)],shirt);mapLine(c,P(L),P(R),.160,shirt);
    if(!human)mapLine(c,P(plus(L,[0,0,.027])),P(plus(R,[0,0,.027])),.033,p.accent);
    const head=plus(h,[filming?0:.083,.635,.058]),hd=P(head);
    dot(c,hd,.119,.129,skin);
    if(human){dot(c,[hd[0]-.006,hd[1]-.023],.117,.106,"#36363c");}
    else{
      dot(c,[hd[0],hd[1]-.005],.122,.123,filming?p.hat:p.hair);
      if(styleOf(r.style)==="sol"||!filming)mapLine(c,[hd[0]-.067,hd[1]+(filming?.086:-.084)],[hd[0]+.064,hd[1]+(filming?.092:-.079)],.087,filming?p.hat:p.accent);
      else mapLine(c,[hd[0]-.067,hd[1]+.052],[hd[0]+.067,hd[1]+.052],.030,p.accent);
    }
  }
  function mapSpace(c,opt,px,py,s,r){
    const d=(opt?.rotation||0)-(r.yaw||0),sx=Math.sin(d)*.24,sz=Math.cos(d)*.24;
    c.save();c.translate(px(r.x),py(r.z));c.rotate(r.yaw||0);c.scale(s,-s);c.lineCap="round";c.lineJoin="round";
    return p=>[p[0]+p[1]*sx,p[2]+p[1]*sz];
  }
  function map(c,opt,px,py,s,r,t=0){
    if(!r||opt?.mode==="atlas"||opt?.mode==="radar")return;
    const scale=Math.max(3.1,s*1.48),P=mapSpace(c,opt,px,py,scale,r),f=baseFrame(r),id=styleOf(r.style);
    c.save();c.globalAlpha*=.29;dot(c,[.032,-.039],.122,.432,dock);
    if(r.rider!==false)dot(c,[.069,-.102],.236,.267,dock);c.restore();
    const up=p=>P([p[0],p[1]+f.air,p[2]]);
    mapBoard(c,id,up,basis(f.twist,f.pitch,f.roll),f,scale>20);
    if(r.rider!==false)artist(c,r,ridingForm(r,t),up);
    c.restore();
  }
  function carryMap(c,opt,px,py,s,a,t=0,style="sol"){
    if(!a||opt?.mode==="atlas"||opt?.mode==="radar")return;
    const P=mapSpace(c,opt,px,py,Math.max(3.1,s*1.48),a),f=carrying(a,t),lift=a.motion?.lift||0;
    mapBoard(c,styleOf(style),p=>P([p[0],p[1]+lift,p[2]]),basis(f.yaw,f.pitch,f.roll),{center:f.at,roll:f.roll},s>15);c.restore();
  }
  function filmerMap(c,opt,px,py,s,a,t=0,w=1){
    if(!a||opt?.mode==="atlas"||opt?.mode==="radar")return;
    const P=mapSpace(c,opt,px,py,Math.max(3.1,s*1.48),a),cam=camAt(t,w),m=basis(cam.yaw,cam.pitch,cam.roll);
    const f={hip:[0,.947,0],twist:.105,feet:[{at:[-.117,.169,.076],orientation:[0,-.08,0]},{at:[.125,.169,-.078],orientation:[0,.10,0]}],
      hands:[plus(cam.at,rotate(m,[-.04,-.042,.087])),plus(cam.at,rotate(m,[.087,-.010,-.018]))]};
    c.save();c.globalAlpha*=.26;dot(c,[.07,-.088],.219,.238,dock);c.restore();
    artist(c,a,f,P,true);const pt=(x,y,z)=>P(plus(cam.at,rotate(m,[x,y,z])));
    fill(c,[pt(-.078,.01,-.12),pt(.084,.01,-.12),pt(.084,.01,.091),pt(-.078,.01,.091)],slate);
    mapLine(c,pt(-.031,.012,.076),pt(-.031,.012,.151),.083,dock);
    mapLine(c,pt(-.065,.012,.146),pt(.001,.012,.146),.023,"#8eaaa2");
    mapLine(c,pt(-.079,.047,-.075),pt(-.079,.047,-.010),.019,chalk);c.restore();
  }
  window.BaySkateArt={install,pose,world,map,carry,carryMap,carryPose,dress,filmerPose,filmerWorld,filmerMap,colors,roles};
})();
