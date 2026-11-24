/* FERN 3's cockpit, the flight pouch and the people who work the bay mail. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,clamp=(x,lo=0,hi=1)=>Math.max(lo,Math.min(hi,x)),mix=(a,b,t)=>a+(b-a)*t;
  const ink="#293936",coal="#33403d",crackle="#49554e",edge="#789080",nickel="#a6ada0",screw="#d2c5a0";
  const ivory="#f2e5c1",paper="#efddb1",orange="#dd8a58",teal="#517a71",rust="#a65444";
  const canvasCloth="#d0be91",leather="#805f45",deepLeather="#5c5141",vest="#bd7451";
  const colors={pilot:["#ae7755","#426579","#565950"],post:["#8e6350","#769283","#56585c"],runner:["#b58157","#be7455","#526674"]};
  const layout={seatX:.295,seatTop:1.61,seatZ:.28,sill:1.97,eyeY:2.32,eyeZ:.31};
  const panelZ=1.103,dialY=1.857,radius=.091;
  const faces={speed:-.372,attitude:-.158,height:.058,heading:.281};
  const font={
    A:"00 26 40/12 32",B:"00 06 36 45 44 32 02/32 41 40 00",C:"45 36 16 05 01 10 30 41",
    D:"00 06 26 45 41 20 00",E:"46 06 00 40/03 33",F:"46 06 00/03 33",G:"45 36 16 05 01 10 30 41 43 23",
    H:"06 00/46 40/03 43",I:"06 46/26 20/00 40",J:"06 46 41 30 10 01",K:"06 00/03 46/13 40",
    L:"06 00 40",M:"00 06 23 46 40",N:"00 06 40 46",O:"16 36 45 41 30 10 01 05 16",
    P:"00 06 36 45 44 33 03",R:"00 06 36 45 44 33 03/23 40",S:"45 36 16 05 04 13 33 42 41 30 10 01",
    T:"06 46/26 20",U:"06 01 10 30 41 46",V:"06 20 46",W:"06 10 23 30 46",Y:"06 23 46/23 20",
    0:"15 35 44 41 30 10 01 04 15",1:"14 25 20/10 30",2:"04 15 35 44 43 01 00 40",
    3:"05 35 44 33 23/33 42 41 30 00",4:"35 02 42/35 30",5:"45 05 03 33 42 41 30 10 01",
    6:"34 25 15 04 01 10 30 41 42 33 03",7:"05 45 10",8:"15 35 44 33 13 04 15/13 02 01 10 30 41 42 33",
    9:"41 30 10/42 44 35 15 04 03 12 32 43","-":"03 43"
  };
  const gaugeSweep=v=>(-130+260*clamp(v))*pi/180;
  const heading=a=>((Math.round((a||0)*180/pi)%360)+360)%360;
  function frame(yaw=0,pitch=0,roll=0){
    const c=Math.cos(yaw),s=Math.sin(yaw),p=Math.cos(pitch),q=Math.sin(pitch),r=Math.cos(roll),v=Math.sin(roll);
    return [[c*r,v,-s*r],[-c*v*p+s*q,r*p,s*v*p+c*q],[c*v*q+s*p,-r*q,-s*v*q+c*p]];
  }
  function vector(f,p){return [f[0][0]*p[0]+f[1][0]*p[1]+f[2][0]*p[2],f[0][1]*p[0]+f[1][1]*p[1]+f[2][1]*p[2],f[0][2]*p[0]+f[1][2]*p[1]+f[2][2]*p[2]];}
  const planeFrame=p=>frame(p.yaw||0,p.pitch||0,-(p.bank??p.roll??0));
  function worldPoint(p,f,local){
    const v=vector(f,local);return {x:p.x+v[0],y:(p.y||0)+v[1],z:p.z+v[2]};
  }
  function eulers(f){
    const z=Math.asin(clamp(f[0][1],-1,1));
    return Math.abs(Math.cos(z))>.00001?[Math.atan2(-f[0][2],f[0][0]),Math.atan2(-f[2][1],f[1][1]),z]:[Math.atan2(f[2][0],f[2][2]),0,z];
  }
  function part(list,id,p,f,local,rot,light=0){
    const q=worldPoint(p,f,local),angles=rot?eulers(rot.map(axis=>vector(f,axis))):[p.yaw||0,p.pitch||0,-(p.bank??p.roll??0)];
    list.push(["airmail/"+id,q.x,q.y,q.z,...angles,light]);
  }
  const isGuest=role=>["guest","passenger","rider"].includes(role);
  function eye(p,role="pilot",pan=0,tilt=0){
    const f=planeFrame(p),v=isGuest(role)?1:-1,h=clamp(tilt-.193,-.96,.85);
    const q=worldPoint(p,f,[v*layout.seatX,layout.eyeY,layout.eyeZ]);
    const c=Math.cos(h),look=vector(f,[Math.sin(pan)*c,Math.sin(h),Math.cos(pan)*c]);
    return {...q,yaw:Math.atan2(look[0],look[2]),pitch:Math.atan2(look[1],Math.hypot(look[0],look[2])),focal:1.29};
  }
  function poly(g,pts,color){for(let i=1;i<pts.length-1;i++)g.tri(pts[0],pts[i],pts[i+1],color);}
  function join(g,a,b,color){for(let i=0;i<a.length;i++){const j=(i+1)%a.length;g.quad(a[i],a[j],b[j],b[i],color);}}
  function strip(g,project,x,y,xx,yy,width,color){
    const d=width*.5/(Math.hypot(xx-x,yy-y)||1),nx=-(yy-y)*d,ny=(xx-x)*d;
    g.quad(project(x+nx,y+ny),project(xx+nx,yy+ny),project(xx-nx,yy-ny),project(x-nx,y-ny),color);
  }
  function letters(g,project,word,cx,cy,h,col,weight=.112){
    const k=h/6,w=k*.79,start=cx-(word.length*6-2)*w/2;
    for(let i=0;i<word.length;i++)for(const stroke of (font[word[i]]||"").split("/")){
      let last=null;for(const code of stroke.split(" ")){
        if(code.length!==2)continue;const p=[start+i*w*6+w*Number(code[0]),cy+k*(Number(code[1])-3)];
        if(last)strip(g,project,...last,...p,h*weight,col);last=p;
      }
    }
  }
  const faceAt=z=>(x,y)=>[x,y,z];
  function ring(g,x,y,z,a,b,col,n=30,start=0,stop=tau){
    const at=(u,r)=>[x+r*Math.sin(u),y+r*Math.cos(u),z];
    for(let i=0;i<n;i++){const f=mix(start,stop,i/n),k=mix(start,stop,(i+1)/n);g.quad(at(f,a),at(k,a),at(k,b),at(f,b),col);}
  }
  function round(g,x,y,z,r,col,n=30){
    for(let i=0;i<n;i++){const a=tau*i/n,b=tau*(i+1)/n;g.tri([x,y,z],[x+Math.sin(a)*r,y+Math.cos(a)*r,z],[x+Math.sin(b)*r,y+Math.cos(b)*r,z],col);}
  }
  function screws(g,x,y,z,r=.006){
    round(g,x,y,z,r,nickel,8);strip(g,faceAt(z-.0009),x-r*.63,y+r*.28,x+r*.63,y-r*.28,r*.33,coal);
  }
  function arcTick(g,x,y,z,a,outer,inner,w,col){
    const sn=Math.sin(a),cs=Math.cos(a);strip(g,faceAt(z),x+inner*sn,y+inner*cs,x+outer*sn,y+outer*cs,w,col);
  }
  function gauge(g,id){
    const x=faces[id],y=dialY,z=panelZ,r=radius,face=faceAt(z-.002);
    g.box(x,y,z+.013,.206,.205,.024,ink);
    round(g,x,y,z-.0008,r+.005,coal);ring(g,x,y,z-.0009,r,r+.005,nickel);
    for(const a of [-1,1])for(const b of [-1,1])screws(g,x+a*.088,y+b*.088,z-.004,.0041);
    if(id==="attitude"){
      // The meatball rotates behind the fixed wings. Its front hemisphere protrudes from the panel.
      ring(g,x,y,z-.036,r,r-.011,coal);
      for(const i of [-60,-30,0,30,60])arcTick(g,x,y,z-.038,i*pi/180,.079,.071,.0027,ivory);
      for(const s of [-1,1]){g.box(x+s*.043,y-.002,z-.089,.041,.004,.0018,orange);g.box(x+s*.061,y+.001,z-.089,.004,.011,.0018,orange);}
      round(g,x,y,z-.09,.0028,ivory,8);
      return;
    }
    round(g,x,y,z-.0016,r-.006,ink);
    if(id==="heading"){ring(g,x,y,z-.007,r-.008,r-.013,deepLeather);g.tri([x-.006,y+.078,z-.013],[x+.006,y+.078,z-.013],[x,y+.063,z-.013],orange);return;}
    const range=id==="speed"?100:10,steps=id==="speed"?25:20;
    if(id==="speed")ring(g,x,y,z-.0023,r-.008,r-.011,edge,19,gaugeSweep(.20),gaugeSweep(.79));
    for(let i=0;i<=steps;i++){
      const n=i/steps,a=gaugeSweep(n),major=i%(id==="speed"?5:4)===0;
      arcTick(g,x,y,z-.0029,a,r-.012,r-(major?.024:.018),major?.0034:.0017,ivory);
      if(major)letters(g,faceAt(z-.003),String(Math.round(n*range)),x+Math.sin(a)*(r-.034),y+Math.cos(a)*(r-.034),.0135,ivory);
    }
    letters(g,face,id==="speed"?"KTS":"100 FT",x,y-.034,.0115,id==="speed"?"#c1d3bf":"#d7cead");
    round(g,x,y,z-.007,.011,coal,14);
  }
  function interior(g){
    // Layered edge of a formed aluminum dash and the stitched anti-glare pad.
    const outline=[[-.577,1.582],[-.577,1.866],[-.536,1.926],[-.423,1.967],[.360,1.969],[.534,1.945],[.574,1.887],[.574,1.582]];
    const front=outline.map(([x,y])=>[x,y,panelZ+.027]),back=outline.map(([x,y])=>[x*1.018,y+.006,1.326]);
    poly(g,front,crackle);join(g,front,back,coal);
    for(let i=1;i<outline.length-2;i++){
      const a=outline[i],b=outline[i+1];
      g.quad([a[0],a[1]-.006,panelZ+.018],[b[0],b[1]-.006,panelZ+.018],[b[0],b[1]+.007,panelZ+.019],[a[0],a[1]+.007,panelZ+.019],edge);
      g.quad([a[0],a[1]+.006,panelZ+.013],[b[0],b[1]+.006,panelZ+.013],[b[0]*1.025,b[1]+.020,1.333],[a[0]*1.025,a[1]+.020,1.333],"#40544b");
    }
    for(const id of Object.keys(faces))gauge(g,id);
    const lip=faceAt(panelZ+.016);
    for(const x of [-.542,.535])for(const y of [1.634,1.849])screws(g,x,y,panelZ+.011);
    g.box(-.323,1.679,panelZ+.018,.379,.080,.012,"#34463e");
    letters(g,lip,"MAG",-.447,1.699,.012,ivory);letters(g,lip,"NAV",-.319,1.699,.012,ivory);letters(g,lip,"CAB",-.197,1.699,.012,ivory);
    for(const x of [-.448,-.320,-.197]){g.box(x,1.660,panelZ+.006,.033,.047,.012,"#66776c");g.pole([x,1.663,panelZ],[x,1.676,panelZ-.020],.0058,screw,6);}
    g.box(.036,1.683,panelZ+.014,.233,.056,.012,"#846f48");g.box(.036,1.683,panelZ+.005,.225,.048,.008,"#e4d3a8");
    letters(g,faceAt(panelZ-.001),"FERN 3",.036,1.684,.027,"#3e4d41");for(const x of [-.066,.137])screws(g,x,1.682,panelZ-.003,.003);
    // The pilot's pencilled shoreline, trapped under the bent corner of the clip.
    const mx=.470,my=1.828,chart=(x,y,d=0)=>[mx+x+.038*y,my+y-.035*x,panelZ+.009-d];
    poly(g,[chart(-.068,-.105),chart(.062,-.105),chart(.071,-.097),chart(.071,.105),chart(-.068,.105)],"#e1d9b9");
    const shore=[[-.059,-.081],[-.049,-.053],[-.043,-.036],[-.043,-.002],[-.026,.016],[-.035,.041],[-.019,.066],[-.007,.074]];
    for(let i=1;i<shore.length;i++){const a=shore[i-1],b=shore[i];g.quad(chart(-.064,a[1],.001),chart(...a,.001),chart(...b,.001),chart(-.064,b[1],.001),"#8faca1");}
    const line=(a,b,col,w=.0018)=>strip(g,(x,y)=>chart(x,y,.0025),...a,...b,w,col);
    for(const [x,y] of [[.018,.015],[.040,.033],[.008,-.061]]){line([x-.005,y],[x+.005,y],"#507c70");line([x,y-.003],[x,y+.003],"#507c70");}
    for(let i=0;i<6;i++)line([-.032+i*.012,-.062+i*.017],[-.025+i*.012,-.051+i*.017],rust);
    letters(g,(x,y)=>chart(x,y,.003),"GULL KEY",0,-.091,.0096,ink);
    g.box(mx-.004,my+.103,panelZ+.001,.068,.015,.016,nickel);g.box(mx-.025,my+.098,panelZ-.008,.022,.008,.009,ink);
    g.box(0,1.264,-.01,1.17,.023,2.43,"#767a69");
    for(const x of [-.48,-.107,.107,.48])g.box(x,1.280,-.08,.012,.01,1.59,"#928b72");
    for(const side of [-1,1]){
      const x=.644*side;
      g.box(side*.295,1.724,panelZ+.009,.085,.045,.025,"#5a675d");
      g.pole([side*.295,1.724,panelZ-.003],[side*.295,1.815,.816],.018,"#73827a",8);
      g.quad([x,1.26,-1.01],[x,1.26,1.315],[x,1.969,1.319],[x,1.969,-1.01],"#758b7d");
      g.box(x-side*.012,1.867,.113,.025,.03,1.94,"#8da18d");
      g.box(x-side*.020,1.968,.111,.046,.034,2.39,"#334d47");
      g.box(x-side*.029,1.755,.317,.045,.027,.147,nickel);
      g.pole([side*.603,1.968,1.333],[side*.509,2.662,.799],.024,"#314d46",7);
      g.pole([side*.595,1.969,1.326],[side*.501,2.652,.788],.018,"#8eab98",7);
      g.pole([x,1.964,-.222],[side*.547,2.662,-.210],.023,"#56776d",6);
      g.pole([x,1.964,-1.004],[side*.542,2.664,-.783],.028,"#6a8e7d",6);
      g.box(side*.53,2.675,-.001,.058,.058,1.656,"#759180");
      g.box(side*.295,1.576,.267,.427,.078,.419,"#876f54");
      g.box(side*.295,1.789,.037,.438,.430,.090,"#9c8664");
      for(const dx of [-.15,-.075,0,.075,.15])g.box(side*.295+dx,1.792,.087,.005,.340,.006,"#b29e79");
      g.box(side*.295,1.981,.054,.29,.083,.094,"#a58e69");
    }
    // Canvas rear bulkhead and low headliner. The windshield itself is open to the actual world.
    g.quad([-.647,1.258,-1.011],[.647,1.258,-1.011],[.542,2.685,-.811],[-.542,2.685,-.811],"#83917a");
    g.quad([-.55,2.696,-.823],[.55,2.696,-.823],[.507,2.684,.81],[-.507,2.684,.81],"#b9ba98");
    g.pole([-.505,2.664,.792],[.505,2.664,.792],.034,"#879c89",7);
    g.box(-.269,2.658,.704,.444,.025,.088,"#809184");
    for(const x of [-.411,-.133])g.box(x,2.651,.680,.019,.028,.076,"#b8b59b");
    // The throttle guide's painted ends remain visible around the moving red grip.
    g.box(-.018,1.589,.916,.120,.12,.31,"#58675d");g.box(-.018,1.651,.916,.071,.006,.265,"#a89e79");
    g.box(-.018,1.656,.915,.015,.004,.190,coal);
  }
  function indicator(g){
    poly(g,[[-.0023,.079,0],[-.0055,.026,-.0005],[-.0033,-.019,-.0005],[.0033,-.019,-.0005],[.0055,.026,-.0005],[.0023,.079,0]],ivory);
    g.box(0,-.018,-.0003,.007,.015,.0015,orange);round(g,0,0,-.0018,.0072,nickel,12);
  }
  function attitudeBall(g){
    const r=.077,rows=12,n=26;
    const at=(u,v)=>[r*Math.cos(v)*Math.cos(u),r*Math.sin(v),r*Math.cos(v)*Math.sin(u)];
    for(let j=0;j<rows;j++){
      const b=(j/rows-.5)*pi,t=((j+1)/rows-.5)*pi,col=j<rows/2?"#a98159":"#769fac";
      for(let k=0;k<n;k++){
        const a=tau*k/n,c=tau*(k+1)/n;g.quad(at(a,b),at(c,b),at(c,t),at(a,t),col,.99+.021*Math.sin(c));
      }
    }
    // A painted equator circles the whole ball so it survives sustained turns.
    for(let k=0;k<n;k++){
      const a=tau*k/n,b=tau*(k+1)/n;
      g.quad(at(a,-.020),at(b,-.020),at(b,.020),at(a,.020),ivory);
    }
    for(const [lat,half] of [[-20,.023],[-10,.012],[10,.012],[20,.023]]){
      const y=r*Math.sin(lat*pi/180),z=-Math.sqrt(r*r-y*y-half*half)-.001;
      g.pole([-half,y,z],[0,y,-Math.sqrt(r*r-y*y)-.0014],.00085,ivory,4);
      g.pole([0,y,-Math.sqrt(r*r-y*y)-.0014],[half,y,z],.00085,ivory,4);
    }
  }
  function compass(g){
    round(g,0,0,0,.076,"#434d43");
    for(let i=0;i<36;i++){
      const a=i*pi/18;arcTick(g,0,0,-.001,a,.073,i%3?.068:.061,i%3?.00145:.0024,ivory);
    }
    for(const [i,letter] of [..."NESW"].entries()){
      const a=i*pi/2,c=Math.cos(a),s=Math.sin(a),at=(x,y)=>[c*x+s*y,-s*x+c*y,-.0016];
      letters(g,at,letter,0,.047,.021,letter==="N"?"#eeb17a":ivory);
    }
    ring(g,0,0,-.001,.022,.021,edge,18);round(g,0,0,-.002,.005,nickel,8);
  }
  function controlWheel(g){
    g.pole([0,0,.054],[0,0,-.014],.021,"#66776c",8);
    const outline=[[-.127,.064,-.019],[-.128,.031,-.020],[-.115,.001,-.020],[-.072,-.032,-.019],[0,-.040,-.019],
      [.072,-.032,-.019],[.115,.001,-.020],[.128,.031,-.020],[.127,.064,-.019]];
    for(let i=1;i<outline.length;i++)g.pole(outline[i-1],outline[i],.011,coal,7);
    for(const s of [-1,1]){
      g.pole([s*.125,.033,-.019],[s*.125,.069,-.019],.016,ink,8);
      g.pole([s*.125,.064,-.019],[s*.125,.074,-.019],.012,edge,8);
      g.pole([s*.010,0,-.016],[s*.079,-.028,-.019],.011,"#6c7569",6);
    }
    g.box(0,-.001,-.013,.055,.044,.041,"#52645a");g.box(0,-.001,-.036,.039,.025,.003,"#c1aa79");
    g.quad([-.015,0,-.038],[-.001,.005,-.038],[.015,.002,-.038],[.002,-.002,-.038],coal);
  }
  function throttleGrip(g){
    g.pole([0,0,0],[0,.127,0],.0065,nickel,6);
    g.pole([-.030,.136,0],[.031,.136,0],.021,"#b35f41",9);
    g.pole([-.027,.141,-.010],[.028,.141,-.010],.007,"#ca7b4b",6);
  }
  const seatedForms=new Map(),upperLength=.310,foreLength=.329,armSeatZ=.262;
  function captainForm(pilot){
    if(seatedForms.has(pilot))return seatedForms.get(pilot);
    const mesh=new BayPlayerMesh(colors.pilot,"local"),m=new BayPlayerMotion();dress(mesh,"pilot");
    m.ride={seat:1,seatY:.018,side:-1,outer:1,inner:1,floor:-.345,duck:0,pull:0,reach:0,latchDip:0,steer:0,handle:[0,0,0],passenger:true};
    mesh.update(m);
    if(!pilot){solvePalm(mesh,-1,[-.097,.180,.187]);solvePalm(mesh,1,[.088,.175,.243]);mesh.skin();}
    const head=mesh.head.map(mesh.head.pivot,[]),arms=mesh.sides.flatMap(l=>[l.arm.m,l.forearm.m]),chunks={head:[],body:[]};
    for(let j=0;j<mesh.vertices.length;j+=18){
      const bindings=mesh.bindings.slice(j/6,j/6+3),isHead=bindings.every(b=>b.a===mesh.head.m);
      if(pilot&&bindings.some(b=>arms.includes(b.a)||arms.includes(b.b)))continue;
      const verts=isHead?chunks.head:chunks.body;
      for(let i=j;i<j+18;i+=6){
        verts.push(mesh.vertices[i]-(isHead?head[0]:0),mesh.vertices[i+1]-(isHead?head[1]:0),mesh.vertices[i+2]-(isHead?head[2]:0),
          mesh.vertices[i+3],mesh.vertices[i+4],mesh.vertices[i+5]);
      }
    }
    const s={head,shoulders:mesh.sides.map(l=>[...l.shoulder]),chunks};seatedForms.set(pilot,s);return s;
  }
  function seatedCaptain(g,pilot){
    g.vertices.push(...captainForm(pilot).chunks.body);
    g.quad([-.157,.493,.037],[-.122,.500,.054],[.103,.065,.129],[.064,.061,.132],"#40554f");
  }
  function upperArm(g){
    g.pole([0,0,0],[0,0,.201],.073,colors.pilot[1],8);
    g.pole([0,0,.180],[0,0,.203],.074,"#6b8890",8);g.pole([0,0,.193],[0,0,upperLength],.046,colors.pilot[0],8);
  }
  function forearm(g){
    g.pole([0,0,-.015],[0,0,.218],.043,colors.pilot[0],8);
    g.pole([0,0,.179],[0,0,.256],.037,colors.pilot[0],7);
    g.pole([0,0,.250],[0,0,foreLength-.011],.041,colors.pilot[0],8);
    g.box(0,-.014,foreLength,.067,.033,.031,colors.pilot[0]);
    g.box(.001,.015,foreLength-.003,.057,.026,.030,"#b68460");
  }
  function directed(d){
    const n=Math.hypot(...d),f=d.map(k=>k/n),h=Math.hypot(f[0],f[2]),right=h?[f[2]/h,0,-f[0]/h]:[1,0,0];
    return [right,[f[1]*right[2],f[2]*right[0]-f[0]*right[2],-f[1]*right[0]],f];
  }
  function workingArms(list,p,f,seat,control,wheel){
    const shoulders=captainForm(true).shoulders;
    for(const side of [-1,1]){
      const a=shoulders[side<0?0:1].map((n,i)=>n+seat[i]),grip=vector(wheel,[side*.125,.050,-.019]).map((n,i)=>n+control[i]);
      const span=grip.map((n,i)=>n-a[i]),d=Math.hypot(...span),u=span.map(k=>k/d);
      const into=[side*.55,-.90,-.32],dot=into.reduce((acc,n,i)=>acc+n*u[i],0),out=into.map((n,i)=>n-dot*u[i]);
      const along=(upperLength**2-foreLength**2+d*d)/(2*d),across=Math.sqrt(Math.max(0,upperLength**2-along**2))/(Math.hypot(...out)||1);
      const k=a.map((n,i)=>n+along*u[i]+across*out[i]);
      part(list,"pilot-sleeve",p,f,a,directed(k.map((n,i)=>n-a[i])));
      part(list,"pilot-forearm",p,f,k,directed(grip.map((n,i)=>n-k[i])));
    }
  }
  function readings(p){
    return {knots:Math.max(0,(p.speed||0)*1.943844),feet:Math.max(0,(p.y||0)*3.28084),hdg:heading(p.yaw),
      bank:p.bank??p.roll??0,pitch:p.pitch||0,throttle:clamp(p.throttle||0)};
  }
  function cockpit(list,p,t=0,role="pilot",opts={}){
    if(!p)return;
    const f=planeFrame(p),v=readings(p),yoke=clamp(p.steer||0,-1,1)*-.58,elevator=clamp(p.elevator||0,-1,1);
    part(list,"cabin",p,f,[0,0,0]);
    // Each independent dial turns around its own spindle in the aircraft frame.
    part(list,"pointer",p,f,[faces.speed,dialY,panelZ-.009],frame(0,0,-gaugeSweep(v.knots/100)),.16);
    part(list,"pointer",p,f,[faces.height,dialY,panelZ-.009],frame(0,0,-gaugeSweep(v.feet/1000)),.16);
    part(list,"rose",p,f,[faces.heading,dialY,panelZ-.010],frame(0,0,p.yaw||0),.13);
    part(list,"horizon",p,f,[faces.attitude,dialY,panelZ-.005],frame(0,v.pitch,v.bank),.09);
    const wheel=frame(0,.090-.12*elevator,yoke),wheelAt=s=>[s*layout.seatX,1.815,.806-.036*elevator];
    for(const s of [-1,1])part(list,"yoke",p,f,wheelAt(s),wheel);
    part(list,"throttle",p,f,[-.018,1.628,.910],frame(0,mix(-.60,.60,v.throttle),0));
    if(opts.companion!==false){
      const left=isGuest(role),form=captainForm(left),seat=[(left?-1:1)*layout.seatX,layout.seatTop,armSeatZ];
      part(list,left?"captain-at-stick":"captain-on-right",p,f,seat);
      const scan=.10*Math.sin(t*.61)+.046*Math.sin(t*1.09),turn=left?scan+.24*(p.steer||0):scan-.11;
      part(list,"captain-head",p,f,form.head.map((n,i)=>n+seat[i]),frame(turn,.014*Math.cos(t*.71)-.018*(p.elevator||0),0));
      if(left)workingArms(list,p,f,seat,wheelAt(-1),wheel);
    }
    if(opts.mail)part(list,mailId(opts.mail===true?"dock":opts.mail),p,f,[.21,1.283,-.588],frame(-.28,0,0));
  }
  function polygonBox(g,shape,a,b,front,side){
    const lo=shape.map(([z,y])=>[a,y,z]),hi=shape.map(([z,y])=>[b,y,z]);poly(g,lo,front);poly(g,hi,front);join(g,lo,hi,side);
  }
  const mailId=style=>style==="key"||style==="return"||style==="inbound"?"key-pouch":"dock-pouch";
  function pouch(g,key){
    const cloth=key?"#94a69a":canvasCloth,lipCol=key?"#67867e":"#af986f",tape=key?"#597a73":"#99855f";
    const bounds=[[-.191,.032],[-.169,.007],[.155,.008],[.192,.039],[.189,.186],[.157,.240],[.112,.260],[-.122,.260],[-.186,.225]];
    polygonBox(g,bounds,-.066,.066,cloth,lipCol);
    for(const sign of [-1,1]){
      const x=sign*.069;
      const coord=(z,y,d=0)=>[x+sign*d,y,z];
      // Leather gusset, doubled bottom and the seam up the broad side stay legible in motion.
      poly(g,[[x,.008,-.161],[x,.010,.154],[x,.043,.187],[x,.053,.182],[x,.042,-.170],[x,.032,-.189]],deepLeather);
      for(let i=1;i<bounds.length;i++){const [a,b]=[bounds[i-1],bounds[i]];strip(g,(z,y)=>coord(z,y,.0005),...a,...b,.006,tape);}
      const flap=[[-.166,.224],[-.126,.242],[.120,.242],[.162,.212],[.150,.156],[.010,.130],[-.136,.151]];
      poly(g,flap.map(([z,y])=>coord(z,y,.003)),lipCol);
      for(let i=0;i<8;i++){const z=-.125+i*.034;strip(g,(z,y)=>coord(z,y,.005),z,.144+Math.abs(z)*.16,z+.013,.144+Math.abs(z+.013)*.16,.0018,ivory);}
      for(const z of [-.115,.111]){
        g.box(x+sign*.005,.143,z,.010,.091,.017,leather);g.box(x+sign*.010,.151,z,.006,.018,.026,screw);
        g.box(x+sign*.015,.151,z,.003,.009,.016,deepLeather);
      }
      const front=(u,v)=>coord(sign*u,v,.010);
      g.quad(front(-.073,.054),front(.073,.054),front(.073,.119),front(-.073,.119),paper);
      g.quad(front(-.070,.108),front(.070,.108),front(.070,.115),front(-.070,.115),key?teal:rust);
      letters(g,(u,v)=>coord(sign*u,v,.011),key?"MARLIN":"GULL KEY",0,.086,.0180,ink);
      for(let q=0;q<5;q++)strip(g,(u,v)=>coord(sign*u,v,.011),-.039+q*.018,.063,-.030+q*.018,.063,.002,ink);
    }
    // One continuous, flattened loop puts the player's palm around the worn top grip.
    const handle=[[0,.246,-.130],[0,.329,-.108],[0,.389,-.071],[0,.403,-.041],[0,.403,.043],[0,.386,.072],[0,.328,.110],[0,.249,.129]];
    for(let i=1;i<handle.length;i++)g.pole(handle[i-1],handle[i],i===4?.013:.0095,i===4?deepLeather:leather,6);
    for(const z of [-.119,.121])g.box(0,.259,z,.055,.012,.026,screw);
    g.box(.010,.239,.168,.037,.076,.002,paper);g.box(.011,.216,.171,.029,.009,.003,key?teal:rust);
  }
  function envelope(g){
    g.box(0,0,0,.145,.003,.097,"#ccb997");g.box(.002,.002,-.003,.145,.002,.096,paper);
    for(let i=0;i<7;i++){
      const x=-.061+i*.019,z=.040;
      g.quad([x-.005,.0035,z],[x+.002,.0035,z],[x+.006,.0035,z+.006],[x-.001,.0035,z+.006],i%2?"#698b99":rust);
    }
    g.box(.047,.004,.020,.023,.002,.024,rust);g.box(.048,.005,.020,.015,.001,.017,"#dba67b");
    for(const [z,w] of [[.008,.054],[-.002,.071],[-.012,.047]])g.box(-.012,.004,z,w,.001,.0025,"#727765");
  }
  function rubberStamp(g){
    g.box(0,-.052,0,.070,.020,.046,leather);g.box(0,-.065,0,.065,.007,.042,ink);
    g.cyl(0,-.023,0,.012,.022,.041,8,"#99724b");g.cyl(0,.001,0,.015,.011,.015,8,"#bc8855");
    g.cyl(0,.017,0,.017,.025,.020,8,"#9e7047");
  }
  function dispatchBook(g){
    g.box(0,0,0,.128,.011,.175,teal,.03);g.box(.003,.008,0,.119,.006,.162,paper,.03);
    g.box(-.033,.013,.065,.033,.003,.011,screw);
    for(let j=0;j<5;j++)g.box(.006,.012,.026-j*.014,.077-j*.005,.002,.003,"#8e9b88");
  }
  function pencil(g){g.pole([0,0,-.054],[0,0,.070],.0038,"#c28b47",6);g.pole([0,0,.067],[0,0,.080],.0019,ink,5);}
  function install(model){
    model("airmail/cabin",interior);model("airmail/pointer",indicator);model("airmail/horizon",attitudeBall);
    model("airmail/rose",compass);model("airmail/yoke",controlWheel);model("airmail/throttle",throttleGrip);
    model("airmail/captain-at-stick",g=>seatedCaptain(g,true));model("airmail/captain-on-right",g=>seatedCaptain(g,false));
    model("airmail/captain-head",g=>g.vertices.push(...captainForm(true).chunks.head));
    model("airmail/pilot-sleeve",upperArm);model("airmail/pilot-forearm",forearm);
    model("airmail/dock-pouch",g=>pouch(g,false));model("airmail/key-pouch",g=>pouch(g,true));
    model("airmail/envelope",envelope);model("airmail/stamp",rubberStamp);model("airmail/log",dispatchBook);model("airmail/pencil",pencil);
  }
  function badge(g,x,y,w,h,bg,fg){
    g.box(x,y,.132,w,h,.006,bg);
    g.quad([x-w*.35,y,.136],[x-w*.12,y+h*.18,.136],[x+w*.36,y+h*.16,.136],[x+w*.09,y-h*.02,.136],fg);
    g.quad([x+w*.09,y-h*.02,.136],[x+w*.18,y-h*.23,.136],[x-w*.12,y-h*.09,.136],[x-w*.22,y,.136],fg);
  }
  function pilotDress(g,mark){
    mark("body");
    for(const s of [-1,1]){
      g.quad([s*.137,1.465,.046],[s*.065,1.475,.092],[s*.013,1.340,.134],[s*.113,1.397,.139],"#6e8790");
      g.box(s*.101,1.207,.130,.091,.092,.008,"#516e7b");
      g.box(s*.100,1.246,.136,.103,.025,.010,"#647c84");
      g.box(s*.102,1.243,.143,.009,.008,.004,nickel);
    }
    g.box(0,1.151,.128,.010,.334,.007,deepLeather);g.box(.005,1.307,.135,.014,.033,.006,screw);
    badge(g,-.101,1.323,.085,.028,screw,coal);badge(g,.095,1.321,.060,.022,"#dad4b6","#597573");
    mark("head");
    g.cyl(-.036,1.629,-.106,.047,.050,.135,9,"#52564e");g.cyl(-.045,1.537,-.120,.030,.044,.095,8,"#57584e");
    g.cyl(-.049,1.490,-.120,.028,.028,.016,7,rust);
    for(const s of [-1,1]){
      const x=s*.106;
      g.pole([x,1.639,-.007],[x*1.16,1.639,-.007],.051,"#3f4c46",10);
      g.pole([x*1.13,1.639,-.007],[x*1.21,1.639,-.007],.038,"#788675",10);
      const cap=(u,v)=>[x*1.217,1.639+.037*Math.sin(u)*v,-.007+.036*Math.cos(u)*v];
      for(let j=0;j<10;j++)g.tri(cap(0,0),cap(j*tau/10,1),cap((j+1)*tau/10,1),"#718778");
      g.box(x*1.224,1.637,-.006,.003,.018,.029,"#6b796d");
      g.pole([x*1.09,1.656,-.012],[x*.88,1.749,-.014],.009,coal,7);
      g.pole([x*.88,1.749,-.014],[0,1.774,-.012],.010,deepLeather,6);
      g.box(s*.049,1.656,.112,.079,.039,.011,"#617467",-.11*s);
      g.pole([s*.089,1.674,.114],[s*.012,1.674,.119],.004,"#a69773",5);
      g.pole([s*.090,1.671,.108],[s*.108,1.658,.002],.0045,"#99876a",5);
    }
    g.pole([-.119,1.623,.008],[-.107,1.596,.091],.0046,ink,5);g.pole([-.107,1.596,.091],[-.064,1.592,.122],.0060,coal,6);
    mark("arm",-1);g.cyl(-.241,1.075,.012,.054,.052,.021,8,deepLeather);g.box(-.291,1.078,.022,.009,.028,.029,nickel);
  }
  function postDress(g,mark){
    mark("body");
    g.quad([-.134,.978,.103],[.147,.981,.104],[.111,1.343,.134],[-.106,1.343,.134],"#a86c59");
    for(const s of [-1,1]){
      g.quad([s*.092,1.326,.137],[s*.075,1.330,.138],[s*.113,1.452,.085],[s*.140,1.444,.068],"#bb846b");
      g.box(s*.084,1.329,.140,.014,.014,.005,screw);
    }
    g.box(-.001,1.089,.126,.147,.095,.012,"#bc8270");g.box(-.001,1.130,.134,.150,.007,.004,"#d3a089");
    g.box(.013,1.150,.137,.010,.045,.007,"#637f7d");badge(g,-.005,1.271,.081,.033,paper,teal);
    mark("head");
    g.cyl(0,1.738,-.013,.091,.109,.053,12,"#a5a397");g.cyl(.006,1.670,-.085,.081,.077,.097,10,"#97998f");
    g.cyl(.009,1.621,-.128,.063,.055,.056,9,"#81877f");
    for(const s of [-1,1]){
      g.pole([s*.091,1.666,.109],[s*.018,1.665,.119],.0046,"#765c46",6);
      g.pole([s*.090,1.666,.109],[s*.077,1.636,.115],.004,"#8a7057",5);
      g.pole([s*.077,1.636,.115],[s*.026,1.637,.118],.0035,"#9c8469",5);
      g.pole([s*.018,1.665,.119],[s*.026,1.637,.118],.0036,"#80684e",5);
      g.pole([s*.018,1.659,.120],[0,1.661,.120],.0037,"#b2966b",5);
      g.pole([s*.089,1.663,.108],[s*.111,1.651,-.018],.0038,"#856b50",5);
      g.box(s*.113,1.620,.007,.010,.014,.012,"#a5c4ae");
    }
    mark("arm",1);g.cyl(.242,1.084,.013,.055,.051,.014,8,"#a99261");g.cyl(.242,1.101,.012,.054,.054,.007,8,teal);
  }
  function runnerDress(g,mark){
    mark("body");
    g.quad([-.176,1.417,.093],[-.148,1.440,.085],[.140,1.023,.118],[.125,1.001,.112],"#495e5c");
    g.quad([.094,1.081,.120],[.119,1.096,.120],[.143,1.065,.119],[.117,1.047,.121],"#a6a587");
    g.box(.100,1.222,.130,.075,.061,.008,"#d18b65");badge(g,.102,1.338,.050,.039,"#6c897d",ivory);
    for(const side of [-1,1]){
      g.quad([side*.127,1.447,.049],[side*.056,1.467,.102],[side*.006,1.375,.135],[side*.088,1.408,.136],"#d39065");
      g.box(side*.125,.994,.102,.045,.029,.006,"#566e66");
    }
    mark("head");
    g.cyl(.003,1.734,-.013,.096,.116,.065,12,"#737c70");g.cyl(.005,1.777,-.014,.059,.095,.028,10,"#81877b");
    g.cyl(.002,1.708,-.011,.117,.116,.018,12,"#9a967c");g.box(.004,1.718,-.112,.157,.015,.112,"#596c62",-.10);
    g.box(.008,1.737,.100,.056,.021,.010,"#cbb393");g.box(.013,1.739,.106,.027,.007,.003,teal);
  }
  const tailors={pilot:pilotDress,post:postDress,runner:runnerDress};
  function hairUnderCap(mesh,role){
    const src=mesh.rest;
    for(let j=0;j<src.length;j+=18){
      const a=j,b=j+6,c=j+12,ys=[src[a+1],src[b+1],src[c+1]],zmax=Math.max(src[a+2],src[b+2],src[c+2]);
      if(Math.min(...ys)<1.684&&!(zmax<-.070&&Math.min(...ys)>1.590&&Math.max(...ys)>1.699))continue;
      if(role==="runner"){
        for(const k of [a,b,c])if(src[k+1]>1.689)src[k+1]=1.689+(src[k+1]-1.689)*.24;
      }else{
        const base=role==="post"?[.591,.602,.558]:[.294,.277,.249],shade=src[a+3]>.355?1.09:.97;
        for(const k of [a,b,c])for(let i=0;i<3;i++)src[k+3+i]=base[i]*shade;
      }
    }
  }
  function dress(mesh,role){
    if(!mesh||mesh.airmailRole||!tailors[role])return;
    hairUnderCap(mesh,role);
    const g=new BayMesh(),groups=[];
    tailors[role](g,(part,side=1)=>groups.push({part,side,first:g.vertices.length/6}));
    const rest=new Float32Array(mesh.rest.length+g.vertices.length);rest.set(mesh.rest);rest.set(g.vertices,mesh.rest.length);
    for(let i=0;i<groups.length;i++){
      const a=groups[i],end=groups[i+1]?.first??g.vertices.length/6,limb=mesh.sides[a.side<0?0:1];
      for(let j=a.first;j<end;j++)mesh.bindings.push(mesh.binding(a.part,limb,g.vertices[j*6+1]));
    }
    mesh.rest=rest;mesh.vertices=rest.slice();mesh.lastRevision=-1;mesh.airmailRole=role;
  }
  const palms=[[-.238,.977,.052],[.238,.977,.052]],idleMotions=new WeakMap();
  function hand(rig,side){return rig.sides[side<0?0:1].forearm.map(palms[side<0?0:1],[]);}
  function solvePalm(mesh,side,target){
    const limb=mesh.sides[side<0?0:1],a=mesh.chest.map(limb.arm.pivot,limb.shoulder),u=limb.arm.length,v=limb.forearm.length;
    const wrist=target.slice(),b=limb.hand,k=limb.elbow;
    for(let i=0;i<3;i++){
      const dx=wrist[0]-a[0],dy=wrist[1]-a[1],dz=wrist[2]-a[2],n=Math.max(.0001,Math.hypot(dx,dy,dz));
      const x=dx/n,y=dy/n,z=dz/n,length=clamp(n,Math.abs(u-v)+.001,u+v-.001);
      b[0]=a[0]+x*length;b[1]=a[1]+y*length;b[2]=a[2]+z*length;
      const proj=side*.75*x-.70*y-.38*z,ex=side*.75-proj*x,ey=-.70-proj*y,ez=-.38-proj*z;
      const mid=(u*u-v*v+length*length)/(2*length),spread=Math.sqrt(Math.max(0,u*u-mid*mid))/(Math.hypot(ex,ey,ez)||1);
      k[0]=a[0]+x*mid+ex*spread;k[1]=a[1]+y*mid+ey*spread;k[2]=a[2]+z*mid+ez*spread;
      limb.arm.aim(a,k);limb.forearm.aim(k,b);
      const palm=hand(mesh,side);
      for(let j=0;j<3;j++)wrist[j]=b[j]+target[j]-palm[j];
    }
  }
  function basePose(mesh,a){
    let m=a.motion;
    if(!m){m=idleMotions.get(a);if(!m){m=new BayPlayerMotion();idleMotions.set(a,m);}}
    mesh.update(m);return m;
  }
  function action(role,t,exchange){
    const u=clamp(exchange),reach=Math.sin(pi*u),pulse=reach*reach,breath=.005*Math.sin(t*1.8);
    if(role==="post"){
      const beat=clamp(1-Math.abs(u-.54)/.19),tap=beat*beat*(3-2*beat);
      return {left:[-.044,1.164+breath,.228+.028*pulse],right:[.111-.111*pulse,1.265+.083*pulse-.115*tap+breath,.183+.077*pulse],
        dip:.07+.08*tap,turn:.09*Math.sin(t*.38)*(1-pulse),reach};
    }
    if(role==="runner")return {left:[-.170,1.083+breath,.124],right:[.188-.116*pulse,1.110+.121*pulse+breath,.133+.209*pulse],dip:.047+.067*pulse,turn:-.08*Math.cos(t*.43)*(1-pulse),reach};
    return {left:[-.062,1.173+breath,.223],right:[.036+.104*pulse,1.230+.10*pulse+breath,.231+.052*pulse],dip:.122-.084*pulse,turn:.116*Math.sin(t*.41)*(1-pulse),reach};
  }
  function deskPose(mesh,a,t=0,role="post",exchange=0){
    if(!mesh||!a)return false;
    const m=basePose(mesh,a);if(m.ride||m.weight>.24)return false;
    const p=action(role,t,exchange),at=mesh.chest.map(mesh.head.pivot,mesh.pivot);
    mesh.head.place(at,p.dip,p.turn,-.026*p.reach);
    solvePalm(mesh,-1,p.left);solvePalm(mesh,1,p.right);mesh.skin();mesh.lastRevision=-83;return true;
  }
  function bag(list,p,yaw=0,t=0,style="dock"){
    if(p)list.push(["airmail/"+mailId(style),p.x,p.y||0,p.z,yaw,p.pitch||0,p.roll||0]);
  }
  function personPoint(a,p){
    const c=Math.cos(a.yaw||0),s=Math.sin(a.yaw||0);
    return {x:a.x+c*p[0]+s*p[2],y:(a.y||0)+(a.motion?.lift||0)+p[1],z:a.z-s*p[0]+c*p[2]};
  }
  function carryHand(a){
    const m=a.motion,w=m?.weight||0,f=(m?.phase||0)*tau;
    return [.321+.018*w,.983+.017*w*Math.sin(f*2),.028+.104*w*Math.cos(f+.20)];
  }
  function carryPose(mesh,a,t=0){
    if(!mesh||!a?.motion||a.motion.ride||a.motion.handTarget)return false;
    basePose(mesh,a);solvePalm(mesh,1,carryHand(a));mesh.skin();mesh.lastRevision=-84;return true;
  }
  function sling(a,mesh){
    const m=a.motion,w=m?.weight||0,f=(m?.phase||0)*tau,p=mesh?hand(mesh,1):carryHand(a);
    const pitch=.04+.16*w*Math.sin(f),roll=-.08+.032*w*Math.cos(f),rotation=frame(.09,pitch,roll);
    const grip=vector(rotation,[0,.403,.002]);
    return {p:[p[0]-grip[0],p[1]-grip[1],p[2]-grip[2]],pitch,roll};
  }
  function carry(list,a,t=0,mesh,style="dock"){
    if(!a)return;
    const v=sling(a,mesh);bag(list,{...personPoint(a,v.p),pitch:v.pitch,roll:v.roll},(a.yaw||0)+.09,t,style);
  }
  function deskProps(list,a,t=0,role="post",exchange=0,mesh){
    if(!a||a.motion?.ride||a.motion?.weight>.24)return;
    const v=action(role,t,exchange);
    const at=(side,off)=>{
      const p=mesh?hand(mesh,side):side<0?v.left:v.right;
      return personPoint(a,p.map((n,i)=>n+off[i]));
    };
    const emit=(id,q,pan,pitch=0,roll=0)=>list.push(["airmail/"+id,q.x,q.y,q.z,(a.yaw||0)+pan,pitch,roll]);
    if(role==="post"){
      emit("envelope",at(-1,[.046,.004,.019]),-.11,-.035);
      emit("stamp",at(1,[0,.008,0]),-.12+.09*v.reach,.075*(1-v.reach));
    }else if(role==="runner"){
      emit("envelope",at(1,[-.017,.002,.034]),-.27,-.16-.12*v.reach);
    }else{
      emit("log",at(-1,[-.021,.009,.017]),.20,-.20);
      emit("pencil",at(1,[0,0,.024]),-.62,.30-.13*v.reach);
    }
  }
  function line(c,a,b,width,col){
    c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();
  }
  function shape(c,pts,col){
    c.fillStyle=col;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill();
  }
  function oval(c,p,rx,ry,col){
    c.fillStyle=col;c.beginPath();c.ellipse(p[0],p[1],rx,ry,0,0,tau);c.fill();
  }
  function mapSpace(c,opt,px,py,s,a){
    const d=(opt?.rotation||0)-(a.yaw||0),dx=.24*Math.sin(d),dz=.24*Math.cos(d),scale=Math.max(3.1,s*1.48);
    c.save();c.translate(px(a.x),py(a.z));c.rotate(a.yaw||0);c.scale(scale,-scale);c.lineCap="round";c.lineJoin="round";
    return p=>[p[0]+dx*p[1],p[2]+dz*p[1]];
  }
  const street=opt=>opt?.mode!=="atlas"&&opt?.mode!=="radar";
  function mapPouch(c,place,style){
    const key=mailId(style)==="key-pouch",q=(x,y,z)=>place([x,y,z]),w=.083,l=.201;
    for(const s of [-1,1]){
      shape(c,[q(s*w,.016,-l*.82),q(s*w,.016,l*.82),q(s*w,.211,l),q(s*w,.238,-l)],key?"#768f87":"#b49c75");
      line(c,q(s*w,.09,-l*.58),q(s*w,.09,l*.47),.031,paper);
    }
    shape(c,[q(-w,.220,-l),q(-w,.220,l),q(w,.220,l),q(w,.220,-l)],key?"#9eafa0":canvasCloth);
    for(const z of [-.123,.120]){
      line(c,q(-w,.225,z),q(w,.225,z),.019,leather);line(c,q(.037,.23,z),q(.070,.23,z),.017,screw);
      line(c,q(0,.25,z),q(0,.401,z*.37),.018,leather);
    }
    line(c,q(0,.402,-.048),q(0,.402,.048),.026,deepLeather);
    shape(c,[q(-w+.004,.228,.112),q(-.019,.228,.103),q(-.022,.229,.175),q(-w+.002,.229,.183)],paper);
    line(c,q(-.069,.235,.160),q(-.030,.235,.155),.012,key?teal:rust);
  }
  function bagMap(c,opt,px,py,s,p,yaw=0,style="dock"){
    if(!p||!street(opt))return;
    const P=mapSpace(c,opt,px,py,s,{...p,yaw}),f=frame(0,p.pitch||0,p.roll||0);
    mapPouch(c,v=>P(vector(f,v)),style);c.restore();
  }
  function carryMap(c,opt,px,py,s,a,t=0,style="dock"){
    if(!a||!street(opt))return;
    const P=mapSpace(c,opt,px,py,s,a),v=sling(a),f=frame(.09,v.pitch,v.roll),lift=a.motion?.lift||0;
    mapPouch(c,b=>{const d=vector(f,b);return P([v.p[0]+d[0],v.p[1]+d[1]+lift,v.p[2]+d[2]]);},style);c.restore();
  }
  function localMap(c,opt,px,py,s,a,t=0,role="post",exchange=0){
    if(!a||!street(opt)||!colors[role])return;
    const P=mapSpace(c,opt,px,py,s,a),v=action(role,t,exchange),[skin,shirt,pants]=colors[role],w=a.motion?.weight||0;
    const phase=(a.motion?.phase||0)*tau,bob=.016*w*Math.cos(phase*2),q=(x,y,z)=>P([x,y+bob,z]);
    c.save();c.globalAlpha*=.24;oval(c,[.058,-.050],.207,.225,ink);c.restore();
    for(const side of [-1,1]){
      const stride=side*w*.163*Math.cos(phase),x=side*.107;
      line(c,q(x,.027,stride-.038),q(x,.027,stride+.092),.096,deepLeather);
      line(c,q(x,.77,0),q(x,.15,stride),.127,pants);
    }
    shape(c,[q(-.167,.94,-.072),q(-.197,1.42,-.047),q(-.140,1.48,.045),q(.146,1.48,.045),q(.193,1.42,-.046),q(.160,.94,-.073)],shirt);
    line(c,q(-.135,1.15,.033),q(.139,1.15,.033),.162,role==="post"?"#ad7665":shirt);
    if(role==="runner")line(c,q(-.150,1.42,.046),q(.135,1.005,.118),.038,"#526763");
    for(const side of [-1,1]){
      const palm=side<0?v.left:v.right,walk=[side*.214,1.005,-side*.110*w*Math.cos(phase)];
      const handPoint=palm.map((n,i)=>mix(n,walk[i],clamp(w*1.6))),armFoot=q(...handPoint);
      const shoulder=q(side*.149,1.43,-.012),elbow=q(side*.231,1.235,.055);
      line(c,shoulder,elbow,.104,shirt);line(c,elbow,armFoot,.069,skin);oval(c,armFoot,.044,.042,skin);
      if(w>.3)continue;
      if((role==="post"&&side<0)||(role==="runner"&&side>0)||role==="pilot"&&side<0){
        const [x,y,z]=handPoint,g=role==="pilot",w=g?.063:.075,d=g?.080:.049,ox=role==="post"?.042:0;
        const b=(xx,zz)=>q(x+ox+xx,y+.009,z+.023+zz);
        shape(c,[b(-w,-d),b(w,-d),b(w,d),b(-w,d)],g?teal:paper);line(c,b(-w*.66,d*.18),b(w*.27,d*.18),.008,g?ivory:teal);
        if(!g)line(c,b(w*.42,d*.55),b(w*.71,d*.55),.025,rust);
      }else if(side>0&&role==="post"){oval(c,armFoot,.030,.021,deepLeather);}
      else if(side>0&&role==="pilot"){const [x,y,z]=handPoint;line(c,q(x-.027,y,z-.039),q(x+.048,y,z+.053),.010,"#cc9651");}
    }
    const head=q(0,1.656,.008),hair=role==="post"?"#a4a699":"#50584e";
    oval(c,head,.104,.112,skin);
    if(role==="runner"){oval(c,q(.006,1.765,-.039),.113,.135,"#788578");line(c,q(-.071,1.757,-.134),q(.081,1.757,-.138),.044,"#546b62");}
    else {
      oval(c,q(0,1.737,-.023),.103,.096,hair);
      if(role==="pilot"){
        for(const i of [-1,1])oval(c,q(i*.112,1.661,-.009),.025,.048,teal);
        line(c,q(-.095,1.760,-.012),q(.095,1.760,-.012),.020,deepLeather);
      }else oval(c,q(.005,1.665,-.110),.053,.053,"#848b81");
    }
    c.restore();
  }
  const panelW=432,panelH=102,plateCache=new WeakMap();
  function textAt(c,label,x,y,size,col,serif=false){
    c.font=(serif?"italic ":"600 ")+size+"px "+(serif?"Georgia,serif":"Consolas,'Courier New',monospace");
    c.fillStyle=col;c.textAlign="center";c.textBaseline="middle";c.fillText(label,x,y);
  }
  function ring2d(c,x,y,r,a,b,width,col){
    c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.arc(x,y,r,a,b);c.stroke();
  }
  const dialCenters=[54,161,269,377],dialCenterY=42;
  function plate(c){
    const bg=c.createLinearGradient(0,0,0,panelH);bg.addColorStop(0,"#50615a");bg.addColorStop(.16,"#3e504a");bg.addColorStop(1,"#263833");
    c.fillStyle=bg;c.fillRect(0,0,panelW,panelH);
    c.strokeStyle="#829385";c.lineWidth=1;c.strokeRect(.5,.5,panelW-1,panelH-1);
    for(const x of [8,panelW-8])for(const y of [8,panelH-8]){
      oval(c,[x,y],2.25,2.25,"#a3a38c");line(c,[x-1.3,y+.6],[x+1.3,y-.6],.8,"#56635b");
    }
    const labels=["AIRSPEED","ATTITUDE","ALTITUDE","HEADING"];
    dialCenters.forEach((x,i)=>{
      const y=dialCenterY,r=33;
      oval(c,[x,y+1],r+2,r+2,"#172a28");ring2d(c,x,y,r+1,0,tau,1.5,"#90a092");
      oval(c,[x,y],r-1,r-1,"#233430");
      textAt(c,labels[i],x,88,15,"#e3dfc6");
      if(i!==0&&i!==2)return;
      for(let j=0;j<=20;j++){
        const a=gaugeSweep(j/20),major=j%5===0,u=Math.sin(a),v=-Math.cos(a);
        line(c,[x+u*(major?24:27),y+v*(major?24:27)],[x+30*u,y+30*v],major?1.7:1,"#c9d4bd");
      }
      if(i===0)ring2d(c,x,y,29,gaugeSweep(.20)-pi/2,gaugeSweep(.79)-pi/2,1.9,"#92b1a0");
      else ring2d(c,x,y,29,gaugeSweep(.88)-pi/2,gaugeSweep(1)-pi/2,1.8,"#c79a69");
    });
    for(const x of [108,323]){c.fillStyle="#2b403b";c.fillRect(x,17,1,65);c.fillStyle="#50635a";c.fillRect(x+1,17,.8,65);}
    textAt(c,"PWR",215,15,11,"#dfd4ae");
    c.fillStyle="#8b967f";c.fillRect(211,27,8,43);c.fillStyle="#21352e";c.fillRect(213,28,4,41);
    for(let j=0;j<5;j++){const y=29+9.5*j;line(c,[220,y],[j%2?223:225,y],1,"#bed0b9");}
  }
  function instrumentNeedle(c,x,v,amount,unit){
    const y=dialCenterY,a=gaugeSweep(v),u=Math.sin(a),h=-Math.cos(a);
    line(c,[x-u*4,y-h*4],[x+u*23,y+h*23],2.5,"#d48f64");oval(c,[x,y],2.6,2.6,"#dedab9");
    c.fillStyle="#1a2a27";c.fillRect(x-23,y+7,46,17);
    textAt(c,String(amount),x,y+14,19,"#f9efce");
    textAt(c,unit,x,y-11,10,"#b1c7b2");
  }
  function attitude2d(c,x,r){
    const y=dialCenterY;c.save();c.beginPath();c.arc(x,y,29,0,tau);c.clip();
    c.translate(x,y);c.rotate(-r.bank);
    const h=clamp(-r.pitch*51,-43,43);
    c.fillStyle="#739eaa";c.fillRect(-65,-80,130,80+h);
    c.fillStyle="#a68660";c.fillRect(-65,h,130,90);
    line(c,[-50,h],[50,h],1.8,"#f3ddb0");
    for(const d of [-12,-6,6,12]){const v=Math.abs(d)===12?8:4;line(c,[-v,h+d],[v,h+d],.85,"#e9ddbd");}
    c.restore();line(c,[x-22,y+1],[x-6,y+1],2.8,"#293d36");line(c,[x+6,y+1],[x+22,y+1],2.8,"#293d36");
    line(c,[x-22,y],[x-7,y],1.6,"#f3cd86");line(c,[x+7,y],[x+22,y],1.6,"#f3cd86");oval(c,[x,y],2,2,"#fbe6ad");
    shape(c,[[x-3,y-27],[x+3,y-27],[x,y-23]],ivory);
  }
  function compass2d(c,x,r){
    const y=dialCenterY;
    c.save();c.beginPath();c.arc(x,y,29,0,tau);c.clip();
    for(let i=0;i<36;i++){
      const a=(i*10-r.hdg)*pi/180,u=Math.sin(a),v=-Math.cos(a),major=i%9===0,middle=i%3===0;
      line(c,[x+u*(middle?24:27),y+v*(middle?24:27)],[x+u*29,y+v*29],middle?1.5:.9,"#c9d4be");
      if(major)textAt(c,["N","E","S","W"][i/9],x+u*18.5,y+v*18.5,9,i===0?"#edb484":"#c9d6c2");
    }
    c.restore();shape(c,[[x-3,y-30],[x+3,y-30],[x,y-24]],orange);
    c.fillStyle="#1b302b";c.fillRect(x-19,y-7.5,38,15);
    textAt(c,String(r.hdg).padStart(3,"0")+"°",x+.5,y+.5,16,"#f6e9c8");
  }
  function instruments(canvas,p,role="pilot"){
    if(!canvas?.getContext||!p||!canvas.width||!canvas.height)return;
    const c=canvas.getContext("2d");if(!c)return;
    let board=plateCache.get(canvas);
    if(!board){
      if(canvas.ownerDocument)board=canvas.ownerDocument.createElement("canvas");
      else if(typeof OffscreenCanvas!=="undefined")board=new OffscreenCanvas(panelW,panelH);
      if(board){board.width=panelW;board.height=panelH;plate(board.getContext("2d"));plateCache.set(canvas,board);}
    }
    const v=readings(p);c.save();c.setTransform(canvas.width/panelW,0,0,canvas.height/panelH,0,0);
    if(board)c.drawImage(board,0,0);else plate(c);
    instrumentNeedle(c,dialCenters[0],v.knots/100,Math.round(v.knots),"KTS");
    attitude2d(c,dialCenters[1],v);
    instrumentNeedle(c,dialCenters[2],v.feet/1000,Math.round(v.feet),"FT");
    compass2d(c,dialCenters[3],v);
    const power=67-v.throttle*38;
    c.fillStyle="#755e43";c.fillRect(208,power-1,14,5);c.fillStyle="#e4a270";c.fillRect(208,power-2,14,3);c.restore();
  }
  window.BayAirmailArt=Object.freeze({install,cockpit,eye,readings,colors,layout,bag,carry,carryPose,dress,deskPose,deskProps,localMap,carryMap,bagMap,instruments});
})();
