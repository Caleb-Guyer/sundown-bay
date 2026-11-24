/* Gull Street Motors. The paper, pen and ignition keys follow the working street skeleton. */
(() => {
  "use strict";
  const colors={
    kitty:["#af7355","#c85e48","#365758"],
    malik:["#825640","#e6d6aa","#544963"],
    player:["#af7353","#30a292","#eff1d1"]
  };
  const sides=[-1,1],tau=2*Math.PI,ink="#363a41",cream="#eee1bb",brass="#c29b59";
  const clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const mix=(a,b,u)=>a+(b-a)*u,blend=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
  const id=s=>"gull-dealer-"+s;
  function roleOf(a,opts={}){return opts.role||a.role||a.id||"player";}
  function polygon(g,vertices,col){for(let i=1;i+1<vertices.length;i++)g.tri(vertices[0],vertices[i],vertices[i+1],col);}
  function line(g,points,r,col,n=5){for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,col,n);}
  function shell(g,rows,shade){
    for(let j=1;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){
      const k=(i+1)%rows[j].length;g.quad(rows[j-1][i],rows[j-1][k],rows[j][k],rows[j][i],typeof shade==="function"?shade(j,i):shade);
    }
  }
  function oval(x,y,z,w,d,n=16,slant=0){
    return Array.from({length:n},(_,i)=>{const a=tau*i/n;return [x+w*Math.sin(a),y+slant*Math.sin(a),z+d*Math.cos(a)];});
  }
  const weave=(g,points,col,z=.126)=>polygon(g,points.map(([x,y])=>[x,y,z]),col);
  function gull(g,x,y,z,s,col){
    const wing=[[-.95,.12],[-.33,.05],[.02,-.21],[.45,.13],[.90,.22],[.42,.22],[-.02,-.04],[-.34,.17]];
    polygon(g,wing.map(([u,v])=>[x+s*u,y+s*v,z]),col);
  }
  function kittyHead(g){
    const base="#58514f",shadow="#474244",silver="#ada493";
    const bowl=[oval(-.003,1.658,-.018,.108,.099,16,.018),oval(-.005,1.716,-.011,.114,.106,16,.012),
      oval(.000,1.754,-.015,.098,.093,16,.014),oval(.018,1.773,-.024,.056,.061)];
    shell(g,bowl,(j,i)=>i>2&&i<8?"#695d53":base);polygon(g,bowl.at(-1),"#786a5e");
    const twist=[oval(-.042,1.576,-.130,.043,.041,12,-.013),oval(-.035,1.600,-.141,.065,.058,12,-.018),
      oval(-.033,1.647,-.136,.069,.058,12,-.012),oval(-.015,1.677,-.119,.036,.040,12,-.011)];
    shell(g,twist,(j,i)=>i%5<2?"#74685d":shadow);polygon(g,twist[0],shadow);polygon(g,twist[3],base);
    for(const [x,dx] of [[-.057,-.036],[-.016,-.061],[.019,-.076]]){
      line(g,[[x,1.754,.049],[x+dx*.50,1.763,.002],[x+dx*.71,1.738,-.074],[x+dx*.81,1.690,-.105]],.0037,silver);
    }
    line(g,[[-.094,1.654,-.143],[-.058,1.632,-.185],[-.008,1.613,-.183]],.0054,brass);
    for(const s of sides){
      const eye=[[.017,1.665,.109],[.043,1.674,.111],[.088,1.680,.089],[.082,1.659,.097],[.062,1.644,.108],[.034,1.648,.112],[.017,1.665,.109]];
      line(g,eye.map(([x,y,z])=>[s*x,y,z]),.0043,"#366d6b");
      line(g,[[s*.087,1.675,.091],[s*.105,1.669,.043],[s*.105,1.647,-.027]],.0036,"#ad996b");
      g.pole([s*.103,1.594,.007],[s*.107,1.584,.007],.0065,brass,7);
    }
    line(g,[[-.018,1.663,.110],[0,1.671,.116],[.018,1.663,.110]],.0032,brass);
    polygon(g,[[-.030,1.568,.093],[.033,1.570,.094],[.016,1.561,.096],[-.012,1.560,.096]],"#985d51");
  }
  function kittyShirt(g){
    const hidden="#934a40",trim="#f0bd94",panel="#df785d";
    for(const s of sides){
      weave(g,[[s*.100,1.430],[s*.041,1.427],[s*.020,1.339],[s*.090,1.386],[s*.120,1.389]],trim,.128);
      weave(g,[[s*.090,1.417],[s*.040,1.418],[s*.029,1.359],[s*.085,1.390]],panel,.130);
      weave(g,[[s*.142,1.393],[s*.133,1.384],[s*.125,.978],[s*.136,.981]],panel,.123);
      line(g,[[s*.145,1.361,.121],[s*.132,1.189,.125],[s*.121,1.004,.118]],.0026,trim,4);
      const y=1.213;weave(g,[[s*.13,y],[s*.052,y+.018],[s*.053,y-.050],[s*.094,y-.065],[s*.126,y-.05]],hidden,.130);
      weave(g,[[s*.127,y+.002],[s*.056,y+.014],[s*.056,y-.032],[s*.095,y-.049],[s*.121,y-.041]],panel,.132);
    }
    line(g,[[.002,1.354,.132],[.008,.970,.115]],.0064,hidden,4);
    for(const y of [1.312,1.230,1.144,1.057])g.pole([.007,y,.130],[.007,y,.133],.0062,cream,8);
    weave(g,[[-.140,1.332],[-.054,1.331],[-.057,1.258],[-.109,1.247],[-.141,1.261]],panel,.132);
    weave(g,[[-.140,1.335],[-.055,1.334],[-.055,1.324],[-.139,1.325]],trim,.135);
    for(const [x,col] of [[-.100,"#285e64"],[-.116,ink]]){
      g.pole([x,1.327,.132],[x-.003,1.369,.130],.0036,col,6);
      line(g,[[x-.006,1.362,.132],[x+.001,1.362,.139],[x+.001,1.342,.138]],.0019,brass,4);
    }
    weave(g,[[.041,1.344],[.122,1.344],[.122,1.321],[.041,1.321]],cream,.132);gull(g,.081,1.334,.134,.028,"#3e746f");
    for(const s of sides){
      // Guayabera pleats continue around the shoulders and down the back.
      weave(g,[[s*.157,1.402],[s*.146,1.388],[s*.040,1.289],[s*.044,1.305]],trim,-.119);
      for(const x of [.076,.088])line(g,[[s*x,1.339,-.123],[s*x,1.181,-.119],[s*x,.989,-.112]],.0027,panel,4);
    }
    g.box(0,.968,-.001,.311,.029,.210,"#705246");g.box(.008,.968,.108,.046,.028,.009,brass);
  }
  function malikHead(g){
    const purple="#63516c",edge="#483e55",white="#e5d4a8";
    const rows=[oval(0,1.684,-.007,.111,.112),oval(.001,1.712,-.008,.115,.116),
      oval(-.004,1.760,-.015,.103,.101),oval(-.010,1.783,-.021,.057,.064),oval(-.013,1.787,-.023,.019,.024)];
    shell(g,rows,(j,i)=>j===1?edge:i<3||i>12?white:i>4&&i<12?purple:"#9b8c8c");polygon(g,rows.at(-1),purple);
    const brim=(x,front)=>[x,1.703-.011*Math.abs(x/.113)-(front?.008:0),.088+(front?.099:.000)*Math.max(.11,1-(x/.116)**2)];
    for(let i=0;i<12;i++){const a=-.113+i*.226/12,b=a+.226/12;
      g.quad(brim(a,false),brim(b,false),brim(b,true),brim(a,true),purple);
      const c=brim(a,true),d=brim(b,true);g.quad(c,d,[d[0],d[1]-.004,d[2]],[c[0],c[1]-.004,c[2]],edge);
    }
    gull(g,0,1.732,.102,.039,purple);
    for(const s of sides){
      polygon(g,[[s*.103,1.667,-.029],[s*.104,1.667,.032],[s*.099,1.606,.035],[s*.097,1.614,.000]],"#a49c8e");
      polygon(g,[[s*.003,1.595,.108],[s*.020,1.599,.104],[s*.046,1.589,.097],[s*.045,1.579,.095],[s*.015,1.585,.107],[0,1.587,.110]],"#afa69a");
    }
    polygon(g,[[-.018,1.536,.081],[.025,1.539,.079],[.011,1.523,.079],[-.014,1.524,.078]],"#948b7e");
  }
  function malikShirt(g){
    const purple="#705c78",dark="#514656",gold="#c8a26e";
    for(const s of sides){
      const yoke=[[s*.184,1.417],[s*.084,1.426],[s*.066,1.380],[s*.155,1.336],[s*.180,1.343]];
      weave(g,yoke,purple,.124);weave(g,yoke,purple,-.121);
      weave(g,[[s*.10,1.399],[s*.040,1.428],[s*.020,1.360],[s*.073,1.330]],dark,.131);
      line(g,[[s*.135,1.350,.132],[s*.068,1.253,.133],[s*.059,.978,.113]],.0043,gold,5);
      weave(g,[[s*.171,1.322],[s*.135,1.303],[s*.114,.985],[s*.152,.990]],"#cab991",.117);
    }
    g.box(0,1.182,.127,.012,.359,.007,"#a99680");
    weave(g,[[-.137,1.332],[-.059,1.332],[-.058,1.285],[-.096,1.268],[-.135,1.281]],purple,.138);
    gull(g,-.095,1.312,.140,.029,cream);
    weave(g,[[-.157,1.340],[-.155,1.279],[.138,1.105],[.149,1.158]],purple,-.125);
    weave(g,[[-.154,1.270],[-.154,1.255],[.140,1.087],[.143,1.098]],gold,-.127);
    g.box(0,.973,.000,.310,.036,.209,dark);g.box(.028,.975,.108,.040,.021,.008,"#adb6ac");
  }
  function sleeve(g,s,role){
    const malik=role==="malik",col=malik?"#79657f":"#ecac82";
    const ring=(y,x,w,d)=>oval(s*x,y,-.003,w,d,10);
    shell(g,[ring(1.279,.226,.073,.078),ring(1.306,.225,.076,.080),ring(1.367,.213,.077,.084),ring(1.398,.208,.071,.077)],
      (j,i)=>!malik&&j>1?"#c85e48":j>1?col:i<5?malik?"#d5b985":"#e8aa81":malik?"#a99678":"#c5896a");
  }
  function glove(g,s){
    g.box(s*.244,.985,.039,.076,.063,.073,"#644f48");
    g.box(s*.236,1.029,.039,.078,.024,.074,"#7b655b");
    g.quad([s*.269,1.005,.072],[s*.236,1.002,.080],[s*.226,.984,.080],[s*.265,.979,.077],"#a39074");
    for(let i=0;i<3;i++)g.box(s*(.220+i*.015),.968,.079,.007,.010,.003,"#4c4243");
  }
  function dress(rig,role){
    if(!rig||!["kitty","malik"].includes(role)||rig.gullWear===role)return;
    const g=new BayMesh(),groups=[];
    const part=(p,s=1)=>groups.push({p,s,i:g.vertices.length/6});
    part("head");if(role==="kitty")kittyHead(g);else malikHead(g);
    part("body");if(role==="kitty")kittyShirt(g);else malikShirt(g);
    for(const s of sides){
      part("arm",s);sleeve(g,s,role);if(role==="malik"){part("held",s);glove(g,s);}
      part("leg",s);
      g.quad([s*.158,.105,-.003],[s*.164,.088,.096],[s*.162,.067,.120],[s*.151,.075,.009],role==="kitty"?"#99745b":"#a98f70");
    }
    const joined=new Float32Array(rig.rest.length+g.vertices.length);joined.set(rig.rest);joined.set(g.vertices,rig.rest.length);
    for(let i=0;i<groups.length;i++){const {p,s,i:start}=groups[i],end=groups[i+1]?.i??g.vertices.length/6;
      for(let j=start;j<end;j++)rig.bindings.push(rig.binding(p,rig.sides[s<0?0:1],g.vertices[j*6+1]));}
    rig.rest=joined;rig.vertices=joined.slice();rig.lastRevision=-1;rig.gullWear=role;
  }
  function folder(g){
    const pts=[[-.029,-.169],[-.020,-.181],[.184,-.181],[.200,-.162],[.200,.095],[.185,.109],[-.028,.109]];
    const plane=(shape,z)=>shape.map(([x,y])=>[x,y,z]);
    polygon(g,plane(pts,-.010),"#4c6158");polygon(g,plane(pts,.003),"#688071");
    for(let i=0;i<pts.length;i++){
      const q=[pts[i],pts[(i+1)%pts.length]];g.quad(...plane(q,-.010),...plane(q.slice().reverse(),.003),"#394e48");
    }
    g.box(.087,-.037,.006,.197,.249,.005,"#e6d6ab");g.box(.089,-.037,.010,.194,.247,.003,cream);
    g.box(.086,.083,.014,.076,.021,.007,"#929c8d");g.box(.087,.089,.018,.049,.012,.004,"#b9bdad");
    g.box(.114,.036,.015,.116,.006,.001,"#688178");gull(g,.020,.039,.016,.017,"#986453");
    for(const y of [-.003,-.023,-.044,-.080,-.100])g.box(.084,y,.014,.146,.002,.001,"#beb49c");
    g.box(.151,-.112,.016,.029,.012,.002,"#b87e65");g.box(.198,.008,.005,.018,.048,.004,"#cc9659");
  }
  function ignition(g){
    const ring=[];for(let i=0;i<=16;i++){const a=tau*i/16;ring.push([Math.sin(a)*.030,-.025+Math.cos(a)*.029,Math.sin(a)*.003]);}
    line(g,ring,.0032,"#b9c5b9",5);
    function blade(x,y,z,a,col,old){
      const pt=(u,v,d)=>[x+u*Math.cos(a)-v*Math.sin(a),y+u*Math.sin(a)+v*Math.cos(a),z+d];
      const points=old?[[-.012,.010],[.010,.010],[.014,-.010],[.008,-.019],[.008,-.066],[-.003,-.074],[-.009,-.069],[-.009,-.061],[-.004,-.059],[-.010,-.052],[-.005,-.047],[-.008,-.016],[-.014,-.008]]:
        [[-.015,.013],[.016,.013],[.021,-.001],[.014,-.013],[.004,-.016],[.005,-.071],[-.002,-.077],[-.007,-.071],[-.004,-.067],[-.010,-.061],[-.004,-.056],[-.010,-.049],[-.006,-.014],[-.017,-.010]];
      polygon(g,points.map(([u,v])=>pt(u,v,.002)),col);polygon(g,points.map(([u,v])=>pt(u,v,-.002)),old?"#7f8275":"#9c7b49");
      for(let i=0;i<points.length;i++){const p=points[i],q=points[(i+1)%points.length];g.quad(pt(...p,.002),pt(...q,.002),pt(...q,-.002),pt(...p,-.002),col);}
    }
    blade(-.014,-.054,-.003,-.36,"#aab9b3",true);blade(.010,-.053,.006,.21,"#d2ae65",false);
    const tag=[[-.022,-.048],[.000,-.059],[-.015,-.105],[-.036,-.111],[-.047,-.095],[-.035,-.058]];
    polygon(g,tag.map(([x,y])=>[x,y,.008]),"#46877b");
    line(g,[[-.032,-.085,.010],[-.022,-.091,.010],[-.024,-.076,.010]],.0019,cream,4);
  }
  function pen(g){
    g.pole([0,0,0],[.007,-.055,.020],.0042,"#433f45",7);g.pole([.007,-.055,.020],[.008,-.066,.024],.0023,brass,6);
    g.pole([0,0,0],[-.007,.057,-.022],.0046,"#3b726e",8);g.box(-.006,.043,-.018,.006,.023,.006,brass);
  }
  function farBody(g,role){
    const [skin,shirt,pants]=colors[role],kitty=role==="kitty";
    const torso=[oval(0,.944,0,.150,.109,8),oval(0,1.39,0,.204,.123,8),oval(0,1.422,0,.144,.093,8)];
    shell(g,torso,shirt);polygon(g,torso.at(-1),shirt);
    for(const s of sides){
      g.pole([s*.101,.963,0],[s*.110,.169,0],.074,pants,6);
      g.box(s*.110,.086,.035,.134,.122,.242,"#6e6059");
      g.pole([s*.173,1.382,0],[s*.236,1.196,0],.070,kitty?shirt:"#7b6881",6);
      g.pole([s*.236,1.197,0],[s*.240,.985,.039],.045,skin,6);
    }
    g.box(0,1.540,.002,.110,.276,.118,skin);
    const head=[oval(0,1.520,0,.074,.076,8),oval(0,1.640,.004,.101,.096,8),oval(0,1.713,0,.101,.094,8)];
    shell(g,head,skin);polygon(g,head.at(-1),skin);
    if(kitty){g.box(0,1.712,-.011,.199,.083,.193,"#655a54");g.box(-.028,1.622,-.109,.117,.098,.115,"#625754");}
    else{g.box(0,1.727,-.009,.217,.090,.211,"#75647d");g.box(0,1.703,.097,.209,.014,.147,"#594962");}
  }
  function install(model){
    model(id("folder"),folder);model(id("keys"),ignition);model(id("pen"),pen);
    for(const who of ["kitty","malik"]){
      model(id("far-"+who),g=>farBody(g,who));
      model(id("point-"+who),g=>{g.pole([0,0,0],[.001,.004,.061],.0091,colors[who][0],7);
        g.pole([.001,.004,.059],[.002,.003,.076],.0075,colors[who][0],7);});
    }
  }
  const distance=(a,b)=>Math.hypot(a[0]-b[0],a[1]-b[1],a[2]-b[2]);
  function orient(p,yaw=0,pitch=0,roll=0){
    const cs=Math.cos(pitch),sn=Math.sin(pitch),y=p[1]*cs-p[2]*sn,z=p[1]*sn+p[2]*cs;
    const cr=Math.cos(roll),sr=Math.sin(roll),x=p[0]*cr-y*sr,c=Math.cos(yaw),s=Math.sin(yaw);
    return [x*c+z*s,p[0]*sr+y*cr,-x*s+z*c];
  }
  function placed(f,x,y,z){const v=orient([x,y,z],f.yaw,f.pitch,f.roll);return {x:f.x+v[0],y:(f.y||0)+v[1],z:f.z+v[2]};}
  function relative(a,p){return orient([p.x-a.x,(p.y||0)-(a.y||0),p.z-a.z],-(a.yaw||0));}
  const angle=(x,y)=>Math.atan2(Math.sin(y-x),Math.cos(y-x));
  const localPalm=s=>[s*.237,.978,.058];
  const mapHands=mesh=>mesh.sides.map(l=>l.forearm.map(localPalm(l.side),[]));
  const angles=b=>[Math.atan2(-b.m[6],b.m[5]),Math.atan2(-b.m[8],b.m[0]),Math.asin(clamp(b.m[4],-1,1))];
  const add=(a,b)=>a.map((v,i)=>v+b[i]);
  function chain(first,second,root,target,hint){
    const dx=target[0]-root[0],dy=target[1]-root[1],dz=target[2]-root[2],d=Math.max(.0001,Math.hypot(dx,dy,dz));
    const direction=[dx/d,dy/d,dz/d],stretch=Math.max(1,d/(first.length+second.length-.0005));
    const a=first.length*stretch,b=second.length*stretch,mid=(a*a-b*b+d*d)/(2*d);
    const dot=hint[0]*direction[0]+hint[1]*direction[1]+hint[2]*direction[2];
    const side=hint.map((n,i)=>n-dot*direction[i]),bend=Math.sqrt(Math.max(0,a*a-mid*mid))/(Math.hypot(...side)||1);
    const joint=root.map((v,i)=>v+mid*direction[i]+bend*side[i]);first.aim(root,joint);second.aim(joint,target);
  }
  function arm(l,end,limit){
    let p=end;
    if(limit){
      const d=distance(l.shoulder,p);if(d>.44)p=blend(l.shoulder,p,.44/d);
    }
    const hand=localPalm(l.side),w=[p[0],p[1]+.027,p[2]-.016],hint=[l.side*.69,-.77,-.41];
    // The pinched part of the palm is beyond the wrist joint. Solve for that point on each frame.
    for(let n=0;n<4;n++){
      chain(l.arm,l.forearm,l.shoulder,w,hint);
      const q=l.forearm.map(hand,[]);for(let i=0;i<3;i++)w[i]+=p[i]-q[i];
    }
  }
  function handshake(from,to){
    const side=to.role==="kitty"?-1:1,dx=to.x-from.x,dz=to.z-from.z,d=Math.hypot(dx,dz)||1;
    const x=dz/d*side,z=-dx/d*side;
    return {side,d,bearing:Math.atan2(-dz,dx),point:{x:(from.x+to.x)*.5+x*.165,y:((from.y||0)+(to.y||0))*.5+1.258,z:(from.z+to.z)*.5+z*.165}};
  }
  function ringMotion(from,to,u,t,meet){
    const first=(from.yaw||0)+meet.side*.18,last=(to.yaw||0)-meet.side*.18;
    const raise=smooth(.09,.43,u),take=smooth(.61,.94,u),aim=first+angle(first,meet.bearing)*raise;
    const yaw=aim+angle(aim,last)*take,show=raise*(1-take);
    const pitch=-.20-.13*show+.075*Math.sin(t*3.4),roll=meet.side*.11*(1-2*take)+.055*Math.sin(t*4+.6);
    // Opposite edges of the loop are pinched simultaneously. Each set of fingers stays on its own side.
    const points=sides.map(s=>orient([s*.0212*show,-.0045*show,s*.0021*show],yaw,pitch,roll));
    return {yaw,pitch,roll,points};
  }
  function exchangePoint(a,other){const dx=other.x-a.x,dz=other.z-a.z,d=Math.hypot(dx,dz)||1;
    return {x:other.x-dx*.91/d,y:other.y??a.y??0,z:other.z-dz*.91/d,yaw:Math.atan2(dx,dz)};}
  function carTarget(a,car,peek){
    if(!car)return placed(a,peek?.15:.31,peek?1.19:.91,1.35);
    const s=car.footprint||bayCarLayout(car.kind),body=typeof bayCarLayout==="function"?bayCarLayout(car.kind):s;
    const p=relative(car,a),side=p[0]<0?-1:1;
    const z=peek?clamp(p[2]+.17,body.back+.05,body.glass[3]-.14):clamp(p[2]*.53+.33,-body.halfLength+.47,body.halfLength-.38);
    return placed({...car,y:car.y??a.y},side*(peek?body.glass[6]:body.track-.11),
      peek?mix(body.glass[4],body.glass[5],.60):body.glass[4]+.02,z);
  }
  const defaultMotion=new WeakMap(),bodyMeshes=new WeakMap(),sketches=new WeakMap();
  function gait(a,t){
    if(a.motion)return a.motion;
    let p=defaultMotion.get(a);if(!p){p={m:new BayPlayerMotion(),t};defaultMotion.set(a,p);}
    if(t!==p.t){p.m.step(clamp(t-p.t,0,.08),0,0);p.t=t;}
    return p.m;
  }
  function sketch(a,role){
    let rig=sketches.get(a);
    if(!rig){rig=new BayPlayerMesh(colors[role]||colors.player,"local");rig.skin=()=>{};rig.bindings.length=0;
      rig.vertices=rig.rest=new Float32Array(0);sketches.set(a,rig);}
    return rig;
  }
  const noSkin=()=>{};
  function bookFrame(a,point,action,t){
    const desk=action==="counter"||action==="sign",walk=action==="walk",yaw=a.yaw||0;
    return {...placed(a,...point),yaw:yaw+(desk?-.14:walk?.78:.34),
      pitch:desk?-1.30+Math.sin(t*.90)*.02:walk?-.12+Math.cos(t*4.0)*.045:-.62,
      roll:desk?.08:walk?-.10:.14};
  }
  function keyFrame(a,p,side,t){
    return {...placed(a,...p),yaw:(a.yaw||0)+side*.18,pitch:-.20+.075*Math.sin(3.4*t),roll:side*.11+.055*Math.sin(4.0*t+.6)};
  }
  function pose(mesh,a,t=0,action=a?.action||"idle",opts={}){
    if(!mesh||!a)return false;
    const role=roleOf(a,opts),m=gait(a,t),isKitty=role==="kitty",isMalik=role==="malik";
    const from=opts.from,to=opts.to,u=clamp(opts.progress??a.progress??0);
    const exchange=(action==="give"||action==="receive")&&from&&to;
    const old=mesh.gullPose,changed=old&&(old.a!==a||old.action!==action);
    const transition=old?.a===a&&changed&&t>=old.t&&t-old.t<.28?{t,shape:old.shape,hands:old.hands}:old?.a===a?old.transition:null;
    const weight=transition?smooth(0,.24,t-transition.t):1;
    const skin=mesh.skin;mesh.skin=noSkin;mesh.lastRevision=-1;
    try{mesh.update(m);}finally{mesh.skin=skin;}
    const palms=mapHands(mesh),seated=!!m.ride||action==="board"||action==="ride";
    const car=opts.car||a.car,target=opts.target||carTarget(a,car,action==="inspect");
    const form=relative(a,target),heading=clamp(Math.atan2(form[0],Math.max(.05,form[2])),-.98,.98);
    const giving=a===from,meeting=exchange&&handshake(from,to),ring=exchange&&ringMotion(from,to,u,t,meeting);
    const swing=exchange?(giving?smooth(.04,.43,u)*(1-smooth(.59,.96,u)):smooth(.14,.47,u)*(1-smooth(.64,.985,u))):0;
    const write=action==="counter"||action==="sign",show=action==="show",inspect=action==="inspect",walk=action==="walk";
    const nod=Math.sin(t*2.4+(isKitty?.7:.1)),gaze=Math.sin(t*.86);
    // Hip displacement, chest angles and neck angles. Feet retain the native walk or board pose.
    let shape=[0,0,0,0,0,0,0,0];
    if(!seated){
      if(exchange){const reach=clamp((meeting.d-.76)/.38),side=meeting.side*(giving?1:-1);
        shape=[-.019*swing,(.015+.054*reach)*swing,(.105+.16*reach)*swing,-side*(.105+.09*reach)*swing,-.019*side*swing,.15*swing,0,0];}
      else if(write){const reading=.65+.26*gaze;shape=[-.012,.012,.12,.03,-.035,.25+.26*reading,.080*gaze,-.055];}
      else if(inspect){const lean=.77+.20*Math.sin(t*1.32);shape=[-.13*lean,.098*lean,.55*lean,heading*.41,.13*lean,-.15+.12*nod,heading*.58,-.085];}
      else if(show){shape=[-.008,.012,.06+.037*nod,heading*.39,.025,.07*nod,heading*.66,-.030];}
      else if(!walk){shape=[0,0,.023+.016*nod,.052*gaze,0,.04*nod,.13*gaze,.014];}
    }
    if(weight<1)shape=blend(transition.shape,shape,weight);
    if(!seated){
      if(Math.abs(shape[0])+Math.abs(shape[1])>.001){
        const hips=mesh.pelvis.map(mesh.pelvis.pivot,[]);hips[1]+=shape[0];hips[2]+=shape[1];mesh.pelvis.place(hips,...angles(mesh.pelvis));
        for(const l of mesh.sides){const foot=l.shin.map(l.shoe.pivot,[]);mesh.pelvis.map(l.thigh.pivot,l.hip);chain(l.thigh,l.shin,l.hip,foot,[0,0,1]);}
      }
      const trunk=add(angles(mesh.chest),shape.slice(2,5)),neck=add(trunk,shape.slice(5,8));
      mesh.chest.place(mesh.pelvis.map(mesh.chest.pivot,[]),...trunk);
      mesh.head.place(mesh.chest.map(mesh.head.pivot,[]),...neck);
    }
    const hands=palms.map(v=>v.slice()),restricted=[false,false];
    const folderHeld=isKitty&&!seated,handSide=exchange?(giving?meeting.side:-meeting.side):1;
    const iHand=handSide<0?0:1,penOut=isKitty&&write&&!seated;
    if(folderHeld){
      hands[0]=write?[-.142,1.111+.005*nod,.200]:walk?[-.217,1.025+.022*Math.cos(m.phase*tau),.115]:[-.169,1.104,.168];
    }
    if(penOut){
      const page=bookFrame(a,hands[0],action,t),stroke=(t*.62)%1;
      const tip=placed(page,.059+.081*stroke,-.013-.019*Math.floor(t*.62%3)+.003*Math.sin(t*12),.019);
      hands[1]=add(relative(a,tip),[-.008,.067,-.024]);
    }else if(exchange&&!seated){
      const offset=ring.points[giving?0:1],q=meeting.point;
      hands[iHand]=blend(hands[iHand],relative(a,{x:q.x+offset[0],y:q.y+offset[1],z:q.z+offset[2]}),swing);
    }
    else if(show&&!seated){
      const aim=relative(a,target),d=Math.hypot(aim[0]-.18,aim[1]-1.36,aim[2])||1;
      const span=.30+.072*smooth(-.75,.75,nod);
      hands[1]=[.20+(aim[0]-.20)*span/d,1.35+(aim[1]-1.35)*span/d,.023+aim[2]*span/d];
      restricted[1]=true;
    }else if(inspect&&!seated){
      const side=form[0]<0?-1:1,i=side<0?0:1,eye=mesh.head.map([side*.087,1.657,.115],[]);
      hands[i]=add(eye,[side*.024,.026,.068]);hands[1-i]=[-side*.151,.822+.025*nod,.208];restricted[1-i]=true;
    }
    if(weight<1)for(let i=0;i<2;i++)hands[i]=blend(transition.hands[i],hands[i],weight);
    for(let i=0;i<2;i++){
      const l=mesh.sides[i];mesh.chest.map(l.arm.pivot,l.shoulder);
      if(distance(hands[i],palms[i])>.0001||!seated&&Math.abs(shape[2])+Math.abs(shape[3])>.001)arm(l,hands[i],restricted[i]);
    }
    mesh.skin();
    const exact=mapHands(mesh),plot={a,role,t,action,u,shape,hands:exact,transition:weight>=1?null:transition,
      folder:folderHeld?bookFrame(a,exact[0],action,t):null,pen:penOut?{...placed(a,...exact[1]),yaw:a.yaw||0,pitch:0,roll:0}:null,key:null,point:null,exchange};
    if(exchange&&a===(u<.51?from:to)){
      const grip=placed(a,...exact[iHand]),offset=ring.points[giving?0:1];
      plot.key={x:grip.x-offset[0],y:grip.y-offset[1],z:grip.z-offset[2],yaw:ring.yaw,pitch:ring.pitch,roll:ring.roll,grip,points:ring.points};
    }
    else if(!exchange&&!seated&&(opts.keys??(isKitty&&show)))plot.key=keyFrame(a,exact[opts.keySide<0?0:1],opts.keySide<0?-1:1,t);
    if(show&&!seated&&(isKitty||isMalik)){
      const h=placed(a,...exact[1]),dx=target.x-h.x,dz=target.z-h.z;
      plot.point={...h,yaw:Math.atan2(dx,dz),pitch:-Math.atan2(target.y-h.y,Math.hypot(dx,dz)||1),roll:0};
    }
    mesh.gullPose=plot;if(sketches.get(a)!==mesh)bodyMeshes.set(a,mesh);return true;
  }
  function rigFor(a,t,action,opts,provided){
    const candidate=provided||bodyMeshes.get(a),p=candidate?.gullPose,u=clamp(opts.progress??a.progress??0);
    if(p?.a===a&&p.t===t&&p.action===action&&p.u===u)return candidate;
    const rig=sketch(a,roleOf(a,opts)),last=rig.gullPose;
    if(last?.t!==t||last.action!==action||last.u!==u)pose(rig,a,t,action,opts);
    return rig;
  }
  function hand(a,side=1,mesh){
    if(!a)return null;
    const r=mesh||bodyMeshes.get(a)||sketches.get(a),l=r?.sides[side<0?0:1];
    return placed(a,...(l?l.forearm.map(localPalm(side),[]):localPalm(side)));
  }
  function transfer(from,to,progress,t=0){
    if(!from||!to)return null;
    const u=clamp(progress),giver=u<.51,owner=giver?from:to,action=giver?"give":"receive";
    const opts={from,to,progress:u};return rigFor(owner,t,action,opts).gullPose.key;
  }
  function display(list,name,f){if(f)list.push([id(name),f.x,f.y,f.z,f.yaw||0,f.pitch||0,f.roll||0]);}
  function props(list,a,t=0,action=a?.action||"idle",opts={},mesh){
    if(!a)return;
    const p=rigFor(a,t,action,opts,mesh).gullPose;
    display(list,"folder",p.folder);display(list,"pen",p.pen);display(list,"keys",p.key);display(list,"point-"+p.role,p.point);
  }
  function far(list,a,role=a?.role){if(a&&["kitty","malik"].includes(role))list.push([id("far-"+role),a.x,a.y||0,a.z,a.yaw||0]);}
  function map(ctx,opt,px,py,s,a,t=0,action=a?.action||"idle",opts={}){
    if(!a||opt.mode==="radar"||opt.mode==="atlas")return;
    const rig=rigFor(a,t,action,opts),p=rig.gullPose,role=p.role,[skin,base,pants]=colors[role]||colors.player;
    const jersey=role==="player"&&window.BayCourtPlayers?.kits[opts.kit||a.kit||opt.player?.kit],shirt=jersey?.body||base;
    const cut=opt.rotation||0,dx=Math.sin(cut)*.35,dz=Math.cos(cut)*.35,ground=Number.isFinite(opts.ground)?opts.ground:a.y||0;
    const point=q=>[px(q.x)+(q.y-ground)*s*dx,py(q.z)-(q.y-ground)*s*dz];
    const bone=(b,x,y,z)=>placed(a,...b.map([x,y,z],[]));
    const T=(x,y,z)=>bone(rig.chest,x,y,z),H=(x,y,z)=>bone(rig.head,x,y,z),P=(x,y,z)=>bone(rig.pelvis,x,y,z);
    function region(points,col){
      ctx.fillStyle=col;ctx.beginPath();for(let i=0;i<points.length;i++){const v=point(points[i]);if(i)ctx.lineTo(...v);else ctx.moveTo(...v);}
      ctx.closePath();ctx.fill();
    }
    function stroke(points,w,col){
      ctx.strokeStyle=col;ctx.lineWidth=Math.max(.46,w*s);ctx.beginPath();
      for(let i=0;i<points.length;i++){const v=point(points[i]);if(i)ctx.lineTo(...v);else ctx.moveTo(...v);}ctx.stroke();
    }
    ctx.save();ctx.lineJoin="round";ctx.lineCap="round";const small=s<11;
    const car=opts.car||a.car,ride=a.motion?.ride;
    if(car&&ride){
      const spec=bayCarLayout(car.kind),glass=spec.glass,side=ride.side||1;
      const groundPoint=(x,z)=>{const q=placed({...car,y:ground},x,0,z);return q;};
      const groundPath=points=>{points.forEach(([x,z],i)=>{const q=point(groundPoint(x,z));if(i)ctx.lineTo(...q);else ctx.moveTo(...q);});ctx.closePath();};
      if(ride.seat>.39){
        ctx.save();ctx.beginPath();groundPath([[-glass[6],glass[3]],[glass[6],glass[3]],[glass[7],glass[2]],[-glass[7],glass[2]]]);ctx.clip();
        ctx.globalAlpha*=smooth(.39,.83,ride.seat);const cx=side*spec.seatX,z=mix(glass[2],glass[3],.37);
        const spot=(w,d,cz,coat)=>region(oval(cx,0,cz,w,d,14).map(([x,,v])=>groundPoint(x,v)),coat);
        spot(.162,.117,z-.027,shirt);spot(.092,.103,z+.029,skin);
        spot(.100,.102,z-.022,role==="kitty"?"#665c54":role==="malik"?"#78637e":"#474249");
        if(role==="malik")region([[cx-.075,z+.005],[cx+.075,z+.005],[cx+.058,z+.086],[cx-.067,z+.086]].map(([x,v])=>groundPoint(x,v)),cream);
        const handZ=side>0?glass[2]+.055:z+.115;
        for(const dir of sides)stroke([groundPoint(cx+dir*.108,handZ),groundPoint(cx+dir*.110,handZ+.025)],.045,skin);
        ctx.fillStyle="rgba(108,152,155,.22)";const center=point(groundPoint(0,glass[2]));ctx.fillRect(center[0]-s*3,center[1]-s*3,6*s,6*s);ctx.restore();
      }
      if(ride.seat>.985){ctx.restore();return;}
      const b=spec.track*.92,center=point(groundPoint(0,0));
      ctx.beginPath();ctx.rect(center[0]-11*s,center[1]-11*s,22*s,22*s);
      groundPath([[-b,-spec.halfLength+.23],[-b,glass[3]],[b,glass[3]],[b,-spec.halfLength+.23]]);ctx.clip("evenodd");
    }
    if(small){
      stroke([P(0,.94,0),T(0,1.39,0)],.34,shirt);
      stroke([H(0,1.67,-.045),H(0,1.70,.036)],.17,role==="malik"?"#79687d":role==="kitty"?"#6c625d":"#454349");
      ctx.restore();return;
    }
    for(const l of rig.sides){
      const k=l.side,hip=bone(l.thigh,k*.101,.967,0),knee=bone(l.shin,k*.109,.55,.014),shoe=bone(l.shoe,k*.111,.073,.030);
      stroke([hip,knee,shoe],.128,jersey?skin:pants);
      if(jersey){stroke([hip,bone(l.thigh,k*.109,.769,0)],.166,jersey.short);stroke([bone(l.shin,k*.111,.250,0),shoe],.108,cream);}
      stroke([bone(l.shoe,k*.111,.074,-.056),bone(l.shoe,k*.111,.075,.136)],.115,jersey?.shoe||"#786e64");
    }
    const waist=(x,z)=>P(x,.947,z),shoulder=(x,z)=>T(x,1.39,z);
    region([waist(-.145,-.090),waist(-.145,.090),waist(.145,.090),waist(.145,-.090)],pants);
    stroke([P(0,.950,0),T(0,1.372,0)],.289,shirt);
    for(const k of sides){
      region([waist(k*.145,-.090),waist(k*.145,.090),shoulder(k*.188,.087),shoulder(k*.188,-.087)],shirt);
      region([waist(-.145,k*.090),waist(.145,k*.090),shoulder(.188,k*.087),shoulder(-.188,k*.087)],shirt);
    }
    const shoulders=[T(-.192,1.396,.05),T(-.184,1.428,-.05),T(-.088,1.438,-.096),T(.088,1.438,-.096),T(.184,1.428,-.05),T(.192,1.396,.05),T(.106,1.419,.092),T(-.106,1.419,.092)];
    region(shoulders,role==="malik"?"#867183":shirt);
    if(role==="kitty"){
      for(const k of sides)stroke([T(k*.135,1.400,-.092),T(k*.060,1.420,-.060),T(k*.062,1.40,.063),T(k*.103,1.37,.099)],.014,"#f1bf99");
      stroke([T(-.112,1.325,.128),T(-.110,1.364,.131)],.009,"#3c726e");
    }else if(role==="malik"){
      stroke([T(-.146,1.330,-.122),T(.13,1.14,-.123)],.047,"#6d5875");stroke([T(-.145,1.299,-.126),T(.13,1.11,-.123)],.014,brass);
    }else if(jersey)for(const k of sides)stroke([T(k*.151,1.405,-.079),T(k*.163,1.295,-.094)],.022,jersey.trim);
    const armMap=l=>{
      const k=l.side,shoulder=bone(l.arm,k*.204,1.41,-.004),elbow=bone(l.forearm,k*.249,1.185,0),tip=placed(a,...p.hands[k<0?0:1]);
      stroke([shoulder,elbow,tip],.078,skin);const end=bone(l.arm,k*.232,1.295,0);
      stroke([shoulder,end],.126,role==="malik"?"#78637d":shirt);stroke([end,bone(l.arm,k*.232,1.273,0)],.109,jersey?.trim||(role==="kitty"?"#eaaa82":role==="malik"?"#d1b486":shirt));
      if(role==="malik")stroke([bone(l.forearm,k*.236,1.029,.043),tip],.075,"#69564d");
    };
    armMap(rig.sides[0]);armMap(rig.sides[1]);
    const head=(y,w,d,z=0,x=0)=>oval(x,y,z,w,d,14).map(v=>H(...v));
    region(head(1.666,.113,.118,.003),skin);
    if(role==="kitty"){
      region(head(1.719,.116,.117,-.020),"#605751");region(head(1.642,.062,.063,-.134,-.032),"#71645a");
      stroke([H(-.051,1.756,.052),H(-.078,1.762,-.020),H(-.091,1.701,-.090)],.013,"#aca292");
      stroke([H(-.102,1.667,.061),H(-.060,1.667,.110),H(-.024,1.661,.116),H(.011,1.665,.116),H(.069,1.674,.105),H(.097,1.674,.072)],.009,"#2e625f");
      stroke([H(-.087,1.653,-.151),H(-.019,1.619,-.181)],.008,brass);
    }else if(role==="malik"){
      region(head(1.732,.118,.124,-.014),"#76627c");
      region([H(-.057,1.774,-.043),H(.058,1.774,-.043),H(.086,1.711,.078),H(-.084,1.711,.078)],cream);
      region([H(-.109,1.707,.062),H(.109,1.707,.062),H(.106,1.699,.129),H(.059,1.695,.178),H(-.059,1.695,.178),H(-.106,1.699,.129)],"#66516e");
      stroke([H(-.034,1.727,.105),H(0,1.721,.115),H(.035,1.735,.102)],.011,"#604d66");
    }else region(head(1.721,.105,.111,-.011),"#443d43");
    // A document held forward can project across the forehead in a steep overhead view.
    if(p.folder){
      const f=p.folder,at=(x,y,z=.010)=>placed(f,x,y,z);
      region([at(-.029,-.181),at(.197,-.181),at(.197,.097),at(-.029,.109)],"#577467");
      region([at(-.010,-.160),at(.185,-.160),at(.185,.081),at(-.010,.081)],cream);
      stroke([at(.051,.079,.017),at(.119,.079,.017)],.014,"#9da697");
      stroke([at(.055,.029,.017),at(.157,.029,.017)],.009,"#739084");
      for(const y of [-.029,-.068])stroke([at(.016,y,.016),at(.141,y,.016)],.004,"#b1a58d");
    }
    if(p.pen)stroke([placed(p.pen,-.007,.057,-.022),placed(p.pen,.008,-.066,.024)],.011,"#416e67");
    if(p.key){
      const q=p.key,at=(x,y,z)=>placed(q,x,y,z);
      const ring=[];for(let i=0;i<=12;i++){const d=tau*i/12;ring.push(at(.029*Math.sin(d),-.025+.029*Math.cos(d),.002));}
      stroke(ring,.008,"#bfccc0");stroke([at(.008,-.052,.007),at(.021,-.081,.012),at(.037,-.119,.012)],.014,"#d9b46d");
      region([at(-.025,-.048,.005),at(-.005,-.061,.005),at(-.019,-.106,.005),at(-.041,-.101,.005)],"#4d998c");
    }
    if(p.point)stroke([p.point,placed(p.point,.002,.003,.076)],.019,skin);
    ctx.restore();
  }
  window.BayDealerPeople=Object.freeze({colors,dress,install,pose,props,map,hand,transfer,exchangePoint,far});
})();
