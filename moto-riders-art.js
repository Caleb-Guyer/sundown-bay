/* Coast Camera & Cycle. Both seats use the metalwork on the moving motorcycle. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const sides=[-1,1],palms=[[-.238,.977,.052],[.238,.977,.052]],headCenter=[0,1.652,-.007];
  const colors={player:["#ae785c","#398e86","#556d80"],photographer:["#ad7859","#bf9273","#405666"],local:["#805342","#63818a","#434c52"]};
  const helmets={
    player:{shell:"#e6d7b4",shade:"#d5c5a1",paint:"#547c79",edge:"#344b4b",accent:"#c27d59"},
    photographer:{shell:"#9c5f54",shade:"#864f49",paint:"#e3c797",edge:"#48383c",accent:"#ca9271"},
    local:{shell:"#587b80",shade:"#486a70",paint:"#cfad78",edge:"#303f46",accent:"#d88358"}
  };
  const ink="#333f43",brass="#bf9968",chrome="#bfc4b7",cream="#edddba",leather="#715346";
  const name=n=>"coast-riders/"+n;
  const realRole=a=>Object.hasOwn(colors,a?.role)?a.role:"player";
  const vec=p=>[p.x,p.y??0,p.z],obj=v=>({x:v[0],y:v[1],z:v[2]});
  const plus=(a,b)=>[a[0]+b[0],a[1]+b[1],a[2]+b[2]],minus=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
  const across=(a,b,u)=>[mix(a[0],b[0],u),mix(a[1],b[1],u),mix(a[2],b[2],u)];
  const rotate=(v,yaw)=>{const c=Math.cos(yaw),s=Math.sin(yaw);return [c*v[0]+s*v[2],v[1],c*v[2]-s*v[0]];};
  const toLocal=(frame,p)=>rotate(minus(vec(p),vec(frame)),-(frame.yaw||0));
  const toWorld=(frame,p)=>obj(plus(vec(frame),rotate(p,frame.yaw||0)));
  function basis(v,yaw,pitch=0,roll=0){
    const cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
    const y=v[1]*cp-v[2]*sp,z=v[1]*sp+v[2]*cp;
    return rotate([v[0]*cr-y*sr,v[0]*sr+y*cr,z],yaw);
  }
  function at(f,x,y,z){return obj(plus(vec(f),basis([x,y,z],f.yaw||0,f.tilt||0,f.lean||0)));}
  function member(f,bone,center){
    const m=bone.m,x=rotate([m[0],m[4],m[8]],f.yaw||0);
    const place=toWorld(f,bone.map(center,[]));
    return {...place,yaw:Math.atan2(-x[2],x[0]),tilt:Math.atan2(-m[6],m[5]),lean:Math.atan2(x[1],Math.hypot(x[0],x[2]))};
  }
  function height(b,ground){return typeof ground==="function"&&b?ground(b.x,b.z):Number.isFinite(ground)?ground:b?.y??0;}
  function acrossSaddle(b,on,off,u,g){
    const w=smooth(.14,.87,u);
    const arc=Math.sin(pi*w),yaw=b.yaw||0,face=Math.atan2(Math.sin((off.yaw??yaw)-yaw),Math.cos((off.yaw??yaw)-yaw));
    return {x:mix(off.x,on.x,w)-Math.sin(yaw)*.047*arc,y:mix(off.y??g,g,w),
      z:mix(off.z,on.z,w)-Math.cos(yaw)*.047*arc,yaw:yaw+face*(1-smooth(.09,.84,u)),tilt:0,lean:0};
  }
  function placement(b,seat="pilot",side=-1,mount=1,ground){
    const art=BayMotorcyclesArt;
    return acrossSaddle(b,art.seat(b,seat,ground),art.approach(b,seat,side,ground),clamp(mount),height(b,ground));
  }
  function ringShell(g,rows,coat){
    for(let j=1;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){
      const k=(i+1)%rows[j].length;g.quad(rows[j-1][i],rows[j-1][k],rows[j][k],rows[j][i],typeof coat==="function"?coat(j,i):coat);
    }
  }
  function bikeHelmet(g,role){
    const c=helmets[role],n=24,angles=Array.from({length:n},(_,i)=>tau*i/n);
    // The nape and cheek cups dip below the open brow. The face stays visible through the aperture.
    const edge=a=>.047-.154*smooth(.67,1.35,Math.abs(Math.atan2(Math.sin(a),Math.cos(a))))+.038*smooth(2.07,2.84,Math.abs(Math.atan2(Math.sin(a),Math.cos(a))));
    const around=(a,y,rx,rz,depth=0)=>[Math.sin(a)*rx,y,Math.cos(a)*rz+depth];
    const row=(y,rx,rz,d=-.010)=>angles.map(a=>around(a,typeof y==="function"?y(a):y,rx,rz,d));
    const rim=row(edge,.133,.146),bottom=row(a=>edge(a)-.009,.130,.143),pad=row(a=>edge(a)-.011,.117,.131);
    ringShell(g,[pad,bottom,rim],c.edge);
    const cheek=row(a=>mix(edge(a),.079,.63),.135,.147),equator=row(.080,.134,.143);
    const mid=row(.119,.126,.137),round=row(.151,.103,.107),crown=row(.169,.065,.074),cap=row(.178,.025,.034);
    ringShell(g,[rim,cheek,equator,mid,round,crown,cap],(j,i)=>j===1&&i>7&&i<17?c.shade:c.shell);
    for(let i=0;i<n;i++)g.tri(cap[i],cap[(i+1)%n],[0,.180,-.009],c.shell);
    for(let i=0;i<n;i++){
      const a=angles[i],b=angles[(i+1)%n],color=role==="local"&&i%4<2?cream:c.paint;
      const band=(u,d)=>around(u,.076-.012*Math.cos(u)+d,.1364,.148,-.010);
      g.quad(band(a,0),band(b,0),band(b,.012),band(a,.012),color);
      if(role==="player")g.quad(band(a,.018),band(b,.018),band(b,.022),band(a,.022),c.accent);
    }
    for(const side of sides){
      const p=(y,z,x=.1336)=>[side*x,y,z];
      g.quad(p(-.063,-.003),p(-.027,.027,.132),p(-.023,.012),p(-.059,-.013),c.paint);
      g.tri(p(-.049,-.020),p(-.017,-.002,.1345),p(-.033,-.025),c.accent);
      g.pole([side*.128,.042,.035],[side*.140,.042,.035],.012,chrome,9);
      g.pole([side*.139,.042,.035],[side*.142,.042,.035],.005,c.edge,7);
      g.quad([side*.094,-.044,.060],[side*.087,-.042,.074],[side*.045,-.119,.047],[side*.047,-.114,.030],c.edge);
      g.quad([side*.057,-.104,.033],[side*.049,-.106,.050],[side*.042,-.118,.043],[side*.047,-.116,.032],brass);
    }
    g.quad([-.046,-.115,.033],[.046,-.115,.033],[.044,-.121,.045],[-.043,-.121,.045],c.edge);
    // Little sun peak, pearl press studs, and narrow rubber edging.
    const peak=(a,outer)=>[Math.sin(a)*(outer?.134:.132),.060+.012*Math.cos(a)-(outer?.012:0),Math.cos(a)*(outer?.191:.139)-.006];
    for(let i=0;i<10;i++){const a=-.91+i*.182,b=a+.182;g.quad(peak(a,0),peak(b,0),peak(b,1),peak(a,1),c.shade);}
    for(const a of [-.72,0,.72]){const x=.135*Math.sin(a),z=.145*Math.cos(a)-.007;
      g.pole([x,.074,z],[x+.002*Math.sin(a),.074,z+.002*Math.cos(a)],.0063,chrome,7);}
  }
  function cameraBody(g){
    const cover="#455758",metal="#b4bbae";
    g.box(0,0,0,.158,.096,.062,ink);
    g.box(0,.041,.001,.160,.021,.066,metal);g.box(0,-.046,0,.161,.012,.065,"#a3a797");
    g.box(.053,.002,.030,.042,.054,.009,cover);g.box(-.055,-.001,.030,.036,.055,.009,cover);
    g.box(.002,-.003,-.029,.129,.058,.007,"#59645e");
    g.box(-.048,.029,-.034,.039,.022,.013,ink);g.box(-.046,.030,-.041,.023,.012,.003,"#697e7b");
    g.box(-.051,.031,.035,.037,.017,.005,"#557c7b");g.box(-.019,.032,.035,.012,.014,.006,"#d4caa9");
    const zAxis=(z0,z1,r,col,n=15)=>g.pole([.004,-.004,z0],[.004,-.004,z1],r,col,n);
    zAxis(.029,.043,.036,"#879388");zAxis(.043,.062,.033,ink);zAxis(.062,.073,.031,chrome);
    zAxis(.073,.085,.0265,"#36474a");zAxis(.085,.087,.020,"#637a79");zAxis(.087,.088,.011,"#344f52");
    for(let i=0;i<13;i++){
      const a=i*tau/13,pt=(r,b,z)=>[.004+r*Math.sin(b),-.004+r*Math.cos(b),z];
      g.quad(pt(.034,a,.047),pt(.034,a+.067,.047),pt(.034,a+.067,.060),pt(.034,a,.060),"#7d8981");
    }
    g.cyl(.050,.055,-.005,.012,.013,.009,9,ink);
    g.cyl(-.060,.058,0,.013,.014,.013,9,metal);
    for(const s of sides){
      g.box(s*.080,.012,-.004,.007,.015,.015,brass);g.box(s*.082,.007,-.003,.004,.009,.008,ink);
    }
    g.box(-.060,.067,0,.022,.004,.007,ink,.15);
  }
  function install(model){
    for(const r of Object.keys(helmets))model(name("helmet-"+r),g=>bikeHelmet(g,r));
    model(name("rangefinder"),cameraBody);
    model(name("advance"),g=>{g.cyl(0,0,0,.013,.012,.005,9,chrome);g.box(.022,.001,-.006,.041,.005,.010,ink,.24);});
    model(name("release"),g=>g.cyl(0,0,0,.0078,.009,.0065,9,brass));
    for(const r of ["photographer","player"])model(name("finger-"+r),g=>{
      const skin=colors[r][0];
      g.pole([.071,.019,.008],[.081,.047,.004],.008,skin,5);
      g.pole([.081,.047,.004],[.059,.068,-.005],.0078,skin,5);
      g.pole([.059,.068,-.005],[.050,.066,-.005],.0068,skin,5);
      g.quad([.051,.072,-.010],[.060,.073,-.010],[.061,.073,-.003],[.052,.072,-.003],"#bc8a74");
    });
  }
  function clothing(g,mark,role){
    const photo=role==="photographer",cloth=photo?"#b78865":"#586f78",hem=photo?"#9d7459":"#405a67",welt=photo?"#d2ac83":"#89a4a3";
    const panel=(face,points,col,depth=.007)=>{
      const q=points.map(([x,y])=>[x,y,face*(.112+.016*(y-1.0)+depth)]);
      for(let i=1;i<q.length-1;i++)g.tri(q[0],q[i],q[i+1],col);
    };
    mark("body");
    for(const face of sides){
      for(const s of sides){
        const points=[[s*.158,.976],[s*.012,.988],[s*.014,1.387],[s*.11,1.417],[s*.173,1.335]];
        panel(face,points,cloth);
        panel(face,[[s*.147,1.010],[s*.011,1.010],[s*.014,.987],[s*.151,.983]],hem,.009);
        panel(face,[[s*.016,1.369],[s*.020,1.353],[s*.019,1.013],[s*.013,1.016]],welt,.011);
      }
    }
    for(const s of sides){
      panel(1,[[s*.108,1.429],[s*.035,1.410],[s*.008,1.357],[s*.081,1.324],[s*.062,1.384]],photo?"#d2aa80":"#c5b395",.012);
      panel(1,[[s*.136,1.296],[s*.048,1.295],[s*.049,1.201],[s*.084,1.187],[s*.136,1.199]],hem,.011);
      panel(1,[[s*.141,1.299],[s*.045,1.299],[s*.048,1.278],[s*.091,1.268],[s*.140,1.281]],welt,.013);
      g.box(s*.090,1.282,.133,.009,.009,.007,brass);
    }
    if(photo){
      // A narrow camera harness leaves its buckle above the waist pocket.
      for(const f of sides){
        panel(f,[[-.143,1.417],[-.099,1.422],[.152,1.048],[.120,1.025]],leather,.016);
        panel(f,[[-.135,1.413],[-.127,1.413],[.133,1.040],[.126,1.039]],"#b29c75",.018);
      }
      g.box(.075,1.133,.142,.036,.035,.009,brass,-.1);
      g.box(.075,1.133,.149,.021,.023,.007,leather);
      panel(1,[[-.051,1.437],[.055,1.433],[.023,1.387],[-.021,1.405]],"#a86352",.022);
      panel(-1,[[.013,1.428],[.111,1.395],[.068,1.342]],"#b66e55",.024);
      for(let i=0;i<3;i++)g.cyl(-.115+i*.025,1.086,.131,.008,.009,.027,7,i===1?"#bca771":ink);
      mark("head");g.box(.009,1.582,-.095,.143,.106,.054,"#4d3d37",-.11);
      // She pins back one temple and ties her hair below the helmet's nape.
      const lock=(a,b,c,paint)=>g.tri(a,b,c,paint);
      lock([-.091,1.750,.078],[.056,1.719,.096],[-.076,1.670,.099],"#57423a");
      lock([-.080,1.730,.090],[-.034,1.712,.097],[-.091,1.638,.081],"#654b3d");
      lock([.091,1.707,.066],[.105,1.709,.034],[.103,1.614,.043],"#5d4538");
      g.quad([.100,1.677,.050],[.107,1.675,.037],[.108,1.680,.035],[.101,1.682,.049],brass);
      const twist=(y,x,z,rx,rz)=>Array.from({length:9},(_,i)=>[x+rx*Math.cos(tau*i/9),y,z+rz*Math.sin(tau*i/9)]);
      ringShell(g,[twist(1.455,-.048,-.111,.011,.015),twist(1.489,-.043,-.125,.039,.031),
        twist(1.531,-.027,-.131,.050,.043),twist(1.568,-.021,-.122,.040,.038),twist(1.594,-.008,-.102,.043,.032)],
        (j,i)=>i%4===2?"#6e5041":"#503d36");
      g.box(-.018,1.556,-.146,.079,.015,.030,"#ad6e54",-.14);
      g.pole([-.099,1.613,.008],[-.098,1.599,.009],.007,brass,7);
    }else{
      panel(-1,[[-.149,1.362],[-.143,1.387],[.148,1.351],[.146,1.327]],"#d8c6a0",.013);
      panel(-1,[[-.147,1.328],[-.146,1.340],[.143,1.308],[.140,1.297]],"#d18d68",.012);
      const f=-1;panel(f,[[-.064,1.254],[.079,1.257],[.055,1.230],[-.069,1.218]],"#d4c5a0",.012);
      panel(f,[[-.041,1.231],[.040,1.244],[.022,1.214]],"#a37458",.016);
      mark("head");
      for(const s of sides){
        g.quad([s*.004,1.592,.105],[s*.040,1.590,.097],[s*.047,1.584,.096],[s*.013,1.585,.105],"#513e39");
        g.tri([s*.088,1.674,.065],[s*.101,1.671,.021],[s*.096,1.603,.040],"#473b38");
      }
    }
    for(const s of sides){
      mark("arm",s);
      g.box(s*.247,1.211,.002,.103,.092,.107,cloth,-s*.04);
      g.box(s*.248,1.168,.002,.104,.024,.108,hem);
      g.box(s*.249,1.180,.058,.075,.008,.005,welt);
      if(!photo){g.box(s*.242,1.279,.072,.104,.016,.004,"#d58762");g.box(s*.242,1.253,.072,.104,.013,.004,cream);}
      mark("leg",s);g.box(s*.111,.275,-.012,.109,.090,.104,photo?"#354d5d":"#3f494d");
      g.box(s*.111,.244,-.013,.113,.030,.106,photo?"#7d8d87":"#7a8380");
      if(!photo){
        const x=s*.111,outline=[[-.063,-.092],[.063,-.092],[.071,.078],[.045,.172],[-.045,.172],[-.071,.078]];
        const edge=(ys,q)=>outline.map(([dx,dz],i)=>[x+dx*q,Array.isArray(ys)?ys[i]:ys,dz]);
        const top=edge([.152,.152,.124,.096,.096,.124],.90);
        ringShell(g,[edge(.016,1.02),edge(.039,1.02),edge(.045,1.025),top],j=>j===1?"#463f3a":j===2?"#aa9375":"#726251");
        g.quad(top[0],top[1],top[2],top[5],"#716250");g.quad(top[5],top[2],top[3],top[4],"#806b55");
        g.box(x,.174,-.019,.116,.125,.117,"#736451");g.box(x,.203,-.018,.119,.018,.120,"#544f46");
        g.box(x+s*.056,.199,-.002,.009,.018,.028,brass);
      }
    }
  }
  function dress(mesh,role){
    if(!mesh||role==="player"||mesh.coastJacket||!["photographer","local"].includes(role))return mesh;
    const g=new BayMesh(),groups=[];
    clothing(g,(part,side=1)=>groups.push({part,side,first:g.vertices.length/6}),role);
    const rest=new Float32Array(mesh.rest.length+g.vertices.length);rest.set(mesh.rest);rest.set(g.vertices,mesh.rest.length);
    for(let i=0;i<groups.length;i++){
      const q=groups[i],l=mesh.sides[q.side<0?0:1],end=groups[i+1]?.first??g.vertices.length/6;
      for(let j=q.first;j<end;j++)mesh.bindings.push(mesh.binding(q.part,l,g.vertices[j*6+1]));
    }
    mesh.rest=rest;mesh.vertices=rest.slice();mesh.lastRevision=-1;mesh.coastJacket=role;return mesh;
  }
  function solve(start,end,first,second,joint,tip,pole){
    const dx=end[0]-start[0],dy=end[1]-start[1],dz=end[2]-start[2],distance=Math.max(.0001,Math.hypot(dx,dy,dz));
    const x=dx/distance,y=dy/distance,z=dz/distance;
    const ratio=Math.max(1,distance/(first.length+second.length-.001));
    const a=first.length*ratio,b=second.length*ratio,mid=(a*a-b*b+distance*distance)/(2*distance);
    const dot=pole[0]*x+pole[1]*y+pole[2]*z,ex=pole[0]-dot*x,ey=pole[1]-dot*y,ez=pole[2]-dot*z;
    const k=Math.sqrt(Math.max(0,a*a-mid*mid))/(Math.hypot(ex,ey,ez)||1);
    joint[0]=start[0]+x*mid+k*ex;joint[1]=start[1]+y*mid+k*ey;joint[2]=start[2]+z*mid+k*ez;
    for(let i=0;i<3;i++)tip[i]=end[i];
    first.aim(start,joint);second.aim(joint,tip);
  }
  function handTo(l,side,palm,guide){
    const i=side<0?0:1,wrist=[palm[0],palm[1]+.025,palm[2]-.018];
    // A palm below the wrist changes its position as the elbow folds around the camera.
    for(let j=0;j<4;j++){
      solve(l.shoulder,wrist,l.arm,l.forearm,l.elbow,l.hand,guide);
      const at=l.forearm.map(palms[i],[]);for(let k=0;k<3;k++)wrist[k]+=palm[k]-at[k];
    }
  }
  function shoeTo(l,sole,pitch,yaw,roll,guide){
    const off=basis([0,.153,-.051],yaw,pitch,roll),ankle=plus(sole,off);
    solve(l.hip,ankle,l.thigh,l.shin,l.knee,l.ankle,guide);l.shoe.place(l.ankle,pitch,yaw,roll);
  }
  function poseInfo(a,b,seat,ground,t,opts){
    const role=realRole(a),u=clamp(opts.mount??1),side=opts.side<0?-1:opts.side>0?1:-1,art=BayMotorcyclesArt;
    const g=height(b,ground),parked=b&&art.approach(b,seat,side,ground),saddle=b&&art.seat(b,seat,g);
    const frame=b?acrossSaddle(b,saddle,parked,u,g):{x:a.x,y:a.y??g,z:a.z,yaw:a.yaw||0,tilt:0,lean:0};
    const photographer=role==="photographer",pilot=seat==="pilot",hasCamera=photographer||!pilot&&(role==="player"||opts.camera);
    const aim=hasCamera&&(!pilot||!b)?clamp(opts.aim??0):0;
    const pan=clamp(opts.pan??0,-pi,pi),pitch=clamp(opts.pitch??0,-1.23,1.23);
    const talk=opts.talk??a.talking??false;
    const info={actor:a,frame,ground:g,terrain:typeof ground==="function"?ground:null,role,b,seat,u,side,aim,pan,pitch,pilot,hasCamera,t,shutter:clamp(opts.shutter??0),talk};
    if(!b)return info;
    const grab=pilot?art.grips(b,g):art.grabs(b,g);
    const orientation=art.frame(b,g);
    const axis=basis([0,1,0],(b.yaw||0)-frame.yaw,orientation.tilt,orientation.lean);
    const roll=-Math.atan2(axis[0],axis[1]),tilt=Math.atan2(axis[2],Math.hypot(axis[0],axis[1]));
    return Object.assign(info,{parked,saddle,orientation,grab,pegs:art.pegs(b,seat,g),balance:smooth(.67,3.15,Math.abs(b.speed||0)),
      shift:smooth(.13,.91,u),roll,tilt,studied:aim*smooth(.35,.98,u)});
  }
  function torso(mesh,p){
    const {frame,b,side,saddle,u,shift,studied,pilot,roll,tilt,t}=p,L=toLocal(frame,saddle);
    const pan=p.pan,stretch=clamp(Math.abs(b.speed||0)/23),heron=b.kind==="heron";
    const rest=.004*Math.sin(1.57*t+(pilot?.4:2.2)),swing=Math.sin(pi*shift),steer=b.steer||0;
    const outside=side*(1-p.balance)*(pilot?.028:.008);
    const leanPast=studied*.159*(.42+.58*Math.max(0,Math.cos(pan)))*Math.tanh(6*(.24+Math.sin(pan)));
    const at=[shift*(L[0]+outside)+side*.025*swing+leanPast*.39,
      mix(.955,L[1]+(pilot?.056:.033),shift)+.065*swing-.023*Math.sin(pi*smooth(.56,1,u)),
      shift*(L[2]+(pilot?(heron?.035:.021):-.012))-.052*swing];
    const turn=(b.yaw||0)-frame.yaw,scan=pilot?steer*.24+roll*.12:0;
    const hipTurn=.42*Math.sin(pan)-.10*Math.sin(2*pan)+.17*(1-Math.cos(pan));
    const pelvisPan=turn*shift+studied*hipTurn;
    mesh.pelvis.place(at,tilt*shift+.060*shift+.045*swing,pelvisPan,roll*shift-.035*side*swing);
    mesh.pelvis.map(mesh.chest.pivot,mesh.pivot);
    const pitch=pilot?(heron?.31:.16)+stretch*.10+(b.wheelLift||0)*.55:-.16+studied*.235;
    mesh.chest.place(mesh.pivot,.019+shift*(tilt+pitch)+.142*swing+rest,turn*shift+studied*(pan-.45*Math.sin(pan))+scan*1.4,
      roll*shift*.92-leanPast*.53-side*.103*swing);
    mesh.chest.map(mesh.head.pivot,mesh.pivot);
    mesh.head.place(mesh.pivot,.021+tilt*shift*.66+(pilot?.047:.027)*shift+.058*swing-p.pitch*studied*.78,
      turn*shift+studied*(pan-.18*Math.sin(pan))+scan+rest*1.8,roll*shift*.57-leanPast*.23);
  }
  function shoePath(mesh,l,p,i){
    const {b,side,u,frame,parked,saddle,orientation,pilot,shift,balance}=p,s=l.side;
    const far=s!==side,end=p.pegs[i],through=pilot&&b.kind==="paloma";
    const start=toWorld(parked,[s*.111,.016,(s<0?.055:-.042)+.051]);
    const peg=vec(end),g=p.ground;
    // The pilot balances the stopped bike on the entry-side boot. Both passenger boots stay on pegs.
    const still=pilot&&s===side?(1-balance)*(1-smooth(.012,.17,b.air||0)):0;
    if(still){
      const seatZ=BayDriving.local(orientation,saddle.x,saddle.z).z,foot=BayDriving.world(orientation,s*(b.kind==="heron"?.295:.263),seatZ+.008);
      peg[0]=mix(peg[0],foot.x,still);peg[1]=mix(peg[1],(p.terrain?p.terrain(foot.x,foot.z):g)+.016,still);peg[2]=mix(peg[2],foot.z,still);
    }
    const spec=BayMotorcyclesArt.specs[b.kind]||BayMotorcyclesArt.specs.heron,seatZ=spec.seats[p.seat][2],source=vec(start);
    const w=far?smooth(.12,.90,u):smooth(.67,.995,u);
    if(!far){
      const plant=BayDriving.world(orientation,side*.348,seatZ-.075),step=smooth(0,.26,u);
      source[0]=mix(source[0],plant.x,step);source[2]=mix(source[2],plant.z,step);
      if(p.terrain)source[1]=p.terrain(source[0],source[2])+.016;
      source[1]+=.077*Math.sin(pi*step);
    }
    const f=across(source,peg,w);
    if(far){
      // The scooter pilot steps through the low channel. All other far boots clear the pillion pad.
      const cross=smooth(.17,.54,u)*(1-smooth(.59,.89,u)),path=through?.467:pilot?-.584:-.555;
      f[1]=mix(f[1],through?g+.60:saddle.y+(pilot?.195:.165),cross);
      const q=BayDriving.local(orientation,f[0],f[2]),bend=smooth(.13,.395,u)*(1-smooth(.73,.985,u));
      const lane=BayDriving.world(orientation,q.x+s*.032*Math.sin(pi*w),mix(q.z,seatZ+path,bend));f[0]=lane.x;f[2]=lane.z;
    }else f[1]+=.125*Math.sin(pi*w);
    const v=toLocal(frame,obj(f)),angle=(pilot?.055:.091)*(1-still)*w+.37*Math.sin(pi*w)*(far?1:.66);
    const toeOut=s*(.053+.13*(1-shift)+.16*still)+(orientation.yaw-frame.yaw)*shift;
    const liftKnee=far?smooth(.14,.475,u)*(1-smooth(.58,.94,u)):0;
    const guide=basis([s*((pilot?.245:.28)+1.30*liftKnee),.01+.18*liftKnee,1-.77*liftKnee],orientation.yaw-frame.yaw,0,p.roll*shift);
    mesh.pelvis.map(l.thigh.pivot,l.hip);shoeTo(l,v,angle,toeOut,p.roll*shift*.50*(1-still),guide);
  }
  function optical(mesh,p){
    if(!p.hasCamera)return null;
    const {frame,aim,pan,pitch,pilot,t,b}=p,raise=pilot&&b?0:aim*(b?smooth(.28,.92,p.u):1);
    const halt=p.shutter,waist=mesh.chest.map([.027,1.200,.178],[]),rightEye=mesh.head.map([.034,1.655,.101],[]);
    const seated=b?smooth(0,.24,p.u):0;
    const restYaw=frame.yaw+.085+(1-seated)*.065*Math.sin(t*.63),sightYaw=(b?.yaw??frame.yaw)+pan;
    const yaw=restYaw+Math.atan2(Math.sin(sightYaw-restYaw),Math.cos(sightYaw-restYaw))*raise;
    const look=mix(-.233+mix(.045*Math.sin(t*.9),.013*Math.sin(t*2),seated),pitch,raise);
    const tilt=-look,lean=(b?p.roll:0)*seated*(.17+.22*raise)-.019*(1-raise)-.012*halt;
    const rest=vec(toWorld(frame,waist)),eye=vec(toWorld(frame,rightEye));
    const offset=basis([.044,-.029,.056],sightYaw,-pitch,lean);
    const center=across(rest,plus(eye,offset),smooth(0,1,raise));center[1]+=.004*Math.sin(pi*halt);
    const cam={...obj(center),yaw,pitch:look,tilt,lean};
    cam.lens=at(cam,.004,-.004,.089);cam.eye=at(cam,-.045,.030,-.049);
    cam.left=at(cam,-.023,-.021,.055);cam.right=at(cam,.067,.012,.008);
    cam.advance=at(cam,.049,.0552,-.006);
    cam.release=at(cam,.050,.0615-.0045*halt,-.005);
    return cam;
  }
  function hands(mesh,p,cam){
    const mount=p.b?p.u:1;
    for(const l of mesh.sides){
      const s=l.side,i=s<0?0:1;
      mesh.chest.map(l.arm.pivot,l.shoulder);
      const standing=mesh.chest.map([s*.237,.983,.049],[]);let bend=[s*.59,-.70,-.53];
      const rising=p.b?(s===p.side?smooth(.015,.53,mount):smooth(.13,.79,mount)):1;
      let palm=p.b?across(standing,toLocal(p.frame,p.grab[i]),rising):standing;
      if(cam){
        const grip=toLocal(p.frame,i===0?cam.left:cam.right);
        const use=p.b?(p.pilot?0:smooth(.06,.91,p.aim)*rising):p.aim*.40+(p.role==="photographer"?.60:.0);
        if(use>0)palm=across(palm,grip,p.b?use:p.role==="photographer"?1:use);
        const aiming=use*p.aim;
        if(aiming>0){
          const guide=basis([s*(i===0?.75:1.06),-.57,.35],cam.yaw-p.frame.yaw,0,p.b?p.roll*.55:0);
          bend=across(bend,guide,aiming);
        }
        const press=p.shutter*use;if(i===1&&press>0)palm[1]-=.0045*press;
        if(!p.b&&i===1&&p.talk&&p.role==="photographer"){
          const beat=.5-.5*Math.cos(tau*((p.t*.34+.11)%1)),gesture=smooth(.34,.88,beat)*(1-p.aim);
          palm[0]+=.163*gesture;palm[1]+=.110*gesture;palm[2]+=.040*gesture;
          p.gesture=gesture;
        }
      }
      if(p.b&&!p.pilot&&!p.aim)l.shoulder[1]-=.032*rising;
      const reach=minus(palm,l.shoulder),d=Math.hypot(...reach),extra=clamp(d-.435,0,.039);
      if(extra>0)for(let k=0;k<3;k++)l.shoulder[k]+=reach[k]*extra/d;
      if(p.b&&p.u<.96&&d>.435+extra)palm=across(l.shoulder,palm,mix((.435+extra)/d,1,smooth(.75,.96,p.u)));
      handTo(l,s,palm,bend);
    }
  }
  const idles=new WeakMap();
  function motion(a){
    if(a.motion)return a.motion;
    let m=idles.get(a);if(!m){m=new BayPlayerMotion();idles.set(a,m);}return m;
  }
  let outline,standingOutline;
  function bareRig(){
    const m=new BayPlayerMesh(colors.local,"local");m.skin=()=>{};
    m.rest=m.vertices=new Float32Array();m.bindings.length=0;return m;
  }
  function sketch(){return outline??=bareRig();}
  function boneMatrices(m){
    return m.coastMatrices??=[m.pelvis.m,m.chest.m,m.head.m,...m.sides.flatMap(l=>[l.thigh.m,l.shin.m,l.shoe.m,l.arm.m,l.forearm.m])];
  }
  function blendFromFoot(mesh,a,p){
    const parked=standingOutline??=bareRig(),from={...p.frame,role:p.role,motion:motion(a),talking:p.talk};
    pose(parked,from,null,"pilot",p.ground,p.t,{shutter:p.shutter});
    const m=boneMatrices(mesh),rest=boneMatrices(parked),weight=smooth(0,.18,p.u);
    for(let j=0;j<m.length;j++)for(let k=0;k<12;k++)m[j][k]=mix(rest[j][k],m[j][k],weight);
  }
  function pose(mesh,a,b,seat="pilot",ground,t=0,opts={}){
    if(!mesh||!a)return false;
    const p=poseInfo(a,b,seat,ground,t,opts);
    if(b){
      torso(mesh,p);for(let i=0;i<2;i++)shoePath(mesh,mesh.sides[i],p,i);
    }else{
      mesh.lastRevision=-2;mesh.update(motion(a));
      if(p.hasCamera){
        if(p.aim>0){
          mesh.chest.map(mesh.chest.pivot,mesh.pivot);
          mesh.chest.place(mesh.pivot,.019,p.aim*(p.pan-.51*Math.sin(p.pan)),0);
        }
        mesh.chest.map(mesh.head.pivot,mesh.pivot);
        const nod=p.talk?.041*Math.sin(t*2.9):0;
        mesh.head.place(mesh.pivot,(.105+nod)*(1-p.aim)-p.pitch*p.aim,p.aim*(p.pan-.16*Math.sin(p.pan))+.056*Math.sin(t*.46)*(1-p.aim),0);
      }
    }
    p.camera=optical(mesh,p);if(b||p.hasCamera)hands(mesh,p,p.camera);
    if(b&&p.u<.18){blendFromFoot(mesh,a,p);p.camera=optical(mesh,p);}
    if(b||p.hasCamera){mesh.skin();mesh.lastRevision=-2;}
    p.helmet=(opts.helmet??!!b)?member(p.frame,mesh.head,headCenter):null;
    mesh.coastRider=p;return true;
  }
  function camera(a,b,seat="pillion",ground,t=0,opts={}){
    if(!a)return null;const mesh=sketch();pose(mesh,a,b,seat,ground,t,opts);return mesh.coastRider.camera;
  }
  const part=(list,id,f)=>list.push([name(id),f.x,f.y,f.z,f.yaw,f.tilt,f.lean]);
  function props(list,a,b,seat="pilot",ground,t=0,opts={},mesh){
    if(!a)return;
    const last=mesh?.coastRider;
    if(last?.actor!==a||last.b!==b||last.seat!==seat||last.t!==t){mesh=sketch();pose(mesh,a,b,seat,ground,t,opts);}
    const p=mesh.coastRider;
    if(p.helmet)part(list,"helmet-"+p.role,p.helmet);
    if(p.camera){
      const c=p.camera;part(list,"rangefinder",c);
      const check=!b&&p.role==="photographer"&&!p.talk?(1-p.aim)*smooth(.67,1,.5+.5*Math.cos(t*1.4))*.30:0;
      const winding=c.yaw+.71*Math.sin(pi*p.shutter)+check;
      part(list,"advance",{...c.advance,yaw:winding,tilt:c.tilt,lean:c.lean});
      part(list,"release",{...c.release,yaw:c.yaw,tilt:c.tilt,lean:c.lean});
      const held=b?p.aim>.965&&p.u>.93:(!p.gesture||p.gesture<.06)&&(p.role==="photographer"||p.aim>.965);
      if(held&&p.role!=="local")part(list,"finger-"+p.role,{...at(c,0,-.0045*p.shutter,0),yaw:c.yaw,tilt:c.tilt,lean:c.lean});
    }
  }
  function map(ctx,opt,px,py,s,a,b,seat="pilot",t=0,opts={}){
    if(!a||opt?.mode==="radar"||opt?.mode==="atlas")return;
    const rig=sketch(),ground=opts.ground??(b?b.y:a.y),g=height(b,ground);
    pose(rig,a,b,seat,ground,t,opts);const p=rig.coastRider,root=p.frame;
    const project=q=>BayMotorcyclesArt.mapPoint(opt,px,py,s,q,g);
    const node=(bone,x,y,z)=>toWorld(root,bone.map([x,y,z],[]));
    function line(a,b,width,color){
      const v=project(a),w=project(b);ctx.strokeStyle=color;ctx.lineWidth=Math.max(.47,s*width);
      ctx.beginPath();ctx.moveTo(...v);ctx.lineTo(...w);ctx.stroke();
    }
    function polygon(points,color){
      ctx.fillStyle=color;ctx.beginPath();for(let i=0;i<points.length;i++){const q=project(points[i]);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);}
      ctx.closePath();ctx.fill();
    }
    function circle(frame,x,y,z,rx,rz,color){
      const pts=[];for(let j=0;j<14;j++){const a=tau*j/14;pts.push(at(frame,x+rx*Math.cos(a),y,z+rz*Math.sin(a)));}
      polygon(pts,color);
    }
    const role=p.role,[skin,ordinary,pants]=colors[role],kit=opts.kit||a.kit;
    const jersey=role==="player"&&window.BayCourtPlayers?.kits?.[kit],shirt=jersey?.body||ordinary;
    const chest=(x,y,z)=>node(rig.chest,x,y,z),hip=(x,y,z)=>node(rig.pelvis,x,y,z);
    ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
    for(const l of rig.sides){
      const m=l.side,k=node(l.shin,m*.109,.55,.014),sole=node(l.shoe,m*.111,.065,.020);
      const thigh=node(l.thigh,m*.101,.967,0);
      line(thigh,k,.161,jersey?skin:pants);line(k,sole,.121,jersey?skin:pants);
      if(jersey){
        const hem=node(l.thigh,m*.105,.77,.007);
        line(thigh,hem,.176,jersey.short);line(hem,node(l.thigh,m*.106,.752,.007),.161,jersey.trim);
        line(node(l.shin,m*.111,.27,.004),sole,.114,"#cfc8aa");
      }
      line(node(l.shoe,m*.111,.072,-.056),node(l.shoe,m*.111,.060,.134),.110,jersey?.shoe||(role==="local"?"#72695d":"#9fa292"));
      line(sole,node(l.shoe,m*.111,.073,.105),.073,jersey?.heel||(role==="local"?"#5b504b":"#73878a"));
    }
    polygon([hip(-.14,.959,-.040),chest(-.208,1.388,-.092),chest(-.184,1.423,.012),chest(.184,1.423,.012),
      chest(.208,1.388,-.092),hip(.14,.959,-.040)],shirt);
    if(role==="photographer"){
      line(chest(-.133,1.426,-.104),hip(.126,1.035,-.116),.042,leather);
      line(chest(-.127,1.422,-.111),hip(.132,1.039,-.122),.009,"#c0a784");
      line(chest(-.044,1.426,-.081),chest(.087,1.357,-.102),.026,"#b17360");
    }else if(role==="local"){
      line(chest(-.15,1.373,-.11),chest(.15,1.337,-.11),.030,"#dbc69e");
      line(chest(-.15,1.34,-.115),chest(.15,1.304,-.115),.012,"#c88962");
    }else if(jersey){
      for(const m of sides)line(chest(m*.145,1.397,-.082),chest(m*.165,1.290,-.095),.017,jersey.trim);
      const stripe=(x0,y0,x1,y1)=>line(chest(x0,y0,-.125),chest(x1,y1,-.125),.014,jersey.pale);
      stripe(-.062,1.292,-.042,1.316);stripe(-.042,1.316,-.042,1.211);
      stripe(.074,1.316,.074,1.211);stripe(.044,1.313,.007,1.245);stripe(.007,1.245,.085,1.245);
    }else if(!kit||kit==="street"){
      line(chest(-.097,1.289,-.113),chest(-.063,1.347,-.116),.021,"#cbb898");
      line(chest(.036,1.22,-.111),chest(.085,1.252,-.113),.021,"#c0af90");
    }
    for(const l of rig.sides){
      const m=l.side,sh=node(l.arm,m*.204,1.410,-.004),el=node(l.forearm,m*.249,1.185,0),palm=toWorld(root,l.forearm.map(palms[m<0?0:1],[]));
      line(el,palm,.075,skin);line(sh,el,.106,role==="player"?skin:shirt);
      if(!jersey)line(sh,node(l.arm,m*.238,1.272,.004),.14,shirt);
      line(palm,toWorld(root,l.forearm.map([m*.241,.960,.056],[])),.074,skin);
    }
    const face=member(root,rig.head,headCenter);
    if(role==="photographer"){
      line(at(face,-.012,-.070,-.108),at(face,-.046,-.166,-.121),.067,"#594138");
      line(at(face,-.013,-.096,-.132),at(face,-.036,-.096,-.134),.019,"#b77959");
    }
    if(p.helmet){
      const c=helmets[role],h=p.helmet;
      circle(h,0,-.009,.050,.094,.093,skin);
      circle(h,0,.084,-.009,.139,.149,c.edge);circle(h,0,.096,-.011,.133,.145,c.shell);
      polygon([at(h,-.099,.062,.084),at(h,-.092,.061,.151),at(h,0,.052,.185),at(h,.092,.061,.151),at(h,.099,.062,.084)],c.shade);
      line(at(h,-.023,.158,-.104),at(h,-.020,.170,.054),.021,c.paint);
      line(at(h,.012,.164,-.107),at(h,.013,.177,.053),.012,role==="photographer"?c.accent:c.paint);
      for(const m of sides)line(at(h,m*.130,.075,.032),at(h,m*.109,.083,.091),.011,chrome);
    }else{
      circle(face,0,-.008,.013,.107,.112,skin);circle(face,0,.061,-.019,.111,.101,role==="local"?"#35383a":"#4a3a37");
      if(role==="photographer")line(at(face,-.078,.070,.032),at(face,-.067,.058,.067),.020,"#654b3d");
    }
    if(p.camera){
      const c=p.camera;
      polygon([at(c,-.079,.049,-.033),at(c,.079,.049,-.033),at(c,.079,.049,.033),at(c,-.079,.049,.033)],chrome);
      line(at(c,-.076,.032,-.029),at(c,.076,.032,-.029),.031,ink);
      line(at(c,.004,-.004,.032),c.lens,.058,"#546a69");line(at(c,-.051,.044,-.034),at(c,-.034,.044,-.034),.014,"#55625e");
      circle(c,.050,.0615-.0045*p.shutter,-.005,.009,.01,brass);
    }
    ctx.restore();
  }
  window.BayMotoRiders=Object.freeze({colors,dress,pose,placement,props,map,camera,install});
})();
