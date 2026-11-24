/* Frankie Prado's location kit. Local +Z faces the street; the desk hinges on its back edge. */
(() => {
  "use strict";
  const tau=2*Math.PI,colors=["#af7659","#4a586e","#a8997c"];
  const denim="#505e77",indigo="#3e4c62",faded="#69798a",rust="#bf694a",red="#9b4e3e",gold="#cea15e";
  const linen="#e6d6ad",hair="#39333a",hairLight="#594448",hide="#715147",black="#353e43",silver="#bec1af";
  const wood="#a97b58",edge="#76573f",woodLight="#be9268",ink="#475b59",mint="#73978a";
  const mix=(a,b,t)=>a+(b-a)*t,clamp=x=>Math.max(0,Math.min(1,x));
  const blend=(a,b,t)=>a.map((x,i)=>mix(x,b[i],t));
  const ease=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  function poly(g,p,color){for(let i=1;i+1<p.length;i++)g.tri(p[0],p[i],p[i+1],color);}
  function pipe(g,p,r,col,n=5){for(let i=1;i<p.length;i++)g.pole(p[i-1],p[i],r,col,n);}
  function ring(x,y,z,w,d,n=12){
    return Array.from({length:n},(_,i)=>{const a=tau*i/n;return [x+w*Math.sin(a),y,z+d*Math.cos(a)];});
  }
  function shell(g,rows,shade){
    for(let k=1;k<rows.length;k++)for(let i=0;i<rows[k].length;i++){
      const n=(i+1)%rows[k].length;g.quad(rows[k-1][i],rows[k-1][n],rows[k][n],rows[k][i],shade(k,i));
    }
  }
  function crescent(g,point,x,y,r,color){
    const outer=[[.79,.59],[.35,.93],[-.16,1],[-.67,.72],[-.97,.24],[-.92,-.32],[-.58,-.78],[-.04,-.97],[.48,-.84],[.83,-.54]];
    const inner=[[.79,.59],[.40,.66],[.08,.60],[-.17,.45],[-.34,.16],[-.34,-.13],[-.15,-.41],[.14,-.55],[.48,-.59],[.83,-.54]];
    for(let i=1;i<outer.length;i++)g.quad(...[outer[i-1],outer[i],inner[i],inner[i-1]].map(([u,v])=>point(x+r*u,y+r*v)),color);
  }
  function clothes(g,mark){
    const front=(x,y)=>[x,y,.137-Math.max(0,Math.abs(x)-.085)*.34];
    const back=(x,y)=>[x,y,-.141+Math.max(0,Math.abs(x)-.088)*.38];
    const piece=(face,p,c)=>poly(g,p.map(([x,y])=>face(x,y)),c);
    mark("body");
    const rows=[ring(0,1.016,0,.171,.121),ring(0,1.053,0,.181,.127),
      ring(0,1.322,0,.204,.140),ring(0,1.423,-.002,.203,.128),ring(0,1.438,-.007,.109,.089)];
    shell(g,rows,(k,i)=>k===1?indigo:i===1||i===10?faded:i===7||i===6?indigo:denim);
    poly(g,rows.at(-1),denim);
    for(const side of [-1,1]){
      piece(front,[[side*.029,1.433],[side*.11,1.410],[side*.105,1.358],[side*.054,1.375],[side*.012,1.305]],faded);
      piece(front,[[side*.054,1.287],[side*.151,1.297],[side*.145,1.204],[side*.079,1.187],[side*.050,1.202]],indigo);
      piece(front,[[side*.051,1.300],[side*.154,1.309],[side*.150,1.270],[side*.100,1.249],[side*.053,1.261]],"#758295");
      pipe(g,[front(side*.156,1.176),front(side*.088,1.117)],.0034,linen,4);
      pipe(g,[back(side*.157,1.393),back(side*.075,1.348),back(0,1.335)],.0037,faded,4);
    }
    pipe(g,[front(.003,1.360),front(.004,1.034)],.0061,"#788798");
    for(const y of [1.334,1.258,1.173,1.078])g.pole([.008,y,.139],[.008,y,.144],.007,gold,6);
    // Faded moon stitched on the back yoke; the scarf is tied on the left, out of the shutter hand.
    crescent(g,back,-.061,1.281,.036,"#d4b991");piece(back,[[.008,1.300],[.015,1.308],[.020,1.300],[.015,1.292]],linen);
    const scarf=[ring(0,1.419,.002,.092,.087),ring(.005,1.446,.004,.080,.079),
      ring(0,1.472,0,.061,.065)];
    shell(g,scarf,(k,i)=>i%5===1?"#d38b61":k===1?rust:red);
    piece(front,[[-.070,1.452],[-.116,1.438],[-.104,1.409],[-.071,1.408],[-.054,1.438]],rust);
    piece(front,[[-.090,1.426],[-.116,1.398],[-.147,1.330],[-.114,1.339],[-.103,1.327],[-.078,1.409]],red);
    piece(front,[[-.078,1.425],[-.100,1.393],[-.078,1.355],[-.055,1.365],[-.039,1.355],[-.053,1.399]],"#d18559");
    // Two leather ends take the strain; the worn black webbing passes behind the neck.
    for(const side of [-1,1])pipe(g,[[side*.071,1.442,.054],[side*.091,1.409,.109],
      [side*.057-.018,1.277,.145],[side*.071-.030,1.227,.152]],.0065,hide,5);
    for(const side of [-1,1]){
      mark("arm",side);
      const x=side*.24;
      const sleeve=[ring(x,1.191,0,.062,.064,8),ring(x,1.226,0,.071,.068,8),
        ring(side*.231,1.295,0,.079,.075,8),ring(side*.207,1.390,-.004,.081,.067,8)];
      shell(g,sleeve,(k,i)=>k===1?(i%2?"#9dabad":"#8698a1"):i<2?faded:denim);
      if(side===1){
        const wrist=[ring(side*.238,1.027,.033,.043,.047,8),ring(side*.238,1.047,.028,.045,.046,8)];
        shell(g,wrist,()=>hide);g.box(.274,1.038,.035,.012,.015,.021,gold);
      }
      mark("leg",side);
      const shoe=side*.110;
      pipe(g,[[shoe-.038,.12,.096],[shoe+.039,.12,.095]],.0039,linen,4);
      g.box(shoe,.159,-.065,.058,.030,.017,"#945f48");
    }
    mark("head");
    // A side part sweeps over the ear into a loose knot at the nape. The irregular hem leaves two curls free.
    const rowsHair=[ring(-.009,1.679,-.010,.108,.107,14),ring(-.004,1.732,-.012,.111,.109,14),
      ring(.002,1.761,-.022,.091,.083,14),ring(.010,1.776,-.027,.047,.045,14)];
    for(let i=0;i<14;i++){const a=tau*i/14;rowsHair[0][i][1]-=.078*(1-Math.cos(a))*.5+.012*Math.sin(2*a);}
    shell(g,rowsHair,(k,i)=>(i+k)%7===2?hairLight:hair);poly(g,rowsHair.at(-1),hairLight);
    const knot=[ring(-.026,1.507,-.117,.039,.042,10),ring(-.021,1.543,-.135,.071,.053,10),
      ring(-.010,1.601,-.132,.083,.060,10),ring(-.004,1.647,-.111,.065,.045,10)];
    shell(g,knot,(k,i)=>i%4===1?"#564247":i%4===3?"#45383d":hair);poly(g,knot[0],hair);
    for(const [x,drift] of [[-.069,-.020],[-.035,.018],[.039,-.013]]){
      pipe(g,[[x,1.621,-.161],[x+drift,1.590,-.184],[x+drift*.5,1.540,-.174],[x+drift*.32,1.510,-.146]],
        .0044,hairLight);
    }
    pipe(g,[[.038,1.751,.052],[.061,1.739,.057],[.089,1.708,.038],[.100,1.676,.022]],.0056,"#715451");
    pipe(g,[[-.093,1.660,-.041],[-.112,1.617,-.045],[-.099,1.585,-.045],[-.088,1.574,-.031]],.0078,hair);
    for(const side of [-1,1]){
      const x=side*.102,p=Array.from({length:9},(_,i)=>[x,1.590+.012*Math.cos(i*tau/8),.006+.009*Math.sin(i*tau/8)]);
      pipe(g,p,.0028,gold,4);
    }
  }
  function dress(mesh){
    if(!mesh||mesh.scoutDressed)return mesh;
    const extra=new BayMesh(),groups=[];
    clothes(extra,(part,side=1)=>groups.push({part,side,at:extra.vertices.length/6}));
    const rest=new Float32Array(mesh.rest.length+extra.vertices.length);rest.set(mesh.rest);rest.set(extra.vertices,mesh.rest.length);
    for(let i=0;i<groups.length;i++){
      const group=groups[i],end=groups[i+1]?.at??extra.vertices.length/6;
      for(let j=group.at;j<end;j++)mesh.bindings.push(mesh.binding(group.part,mesh.sides[group.side<0?0:1],extra.vertices[j*6+1]));
    }
    mesh.rest=rest;mesh.vertices=rest.slice();mesh.scoutDressed=true;mesh.lastRevision=-1;return mesh;
  }
  function camera(g){
    const body=(y,w,d)=>[[-w,y,-d+.006],[-w+.008,y,-d],[w-.012,y,-d],[w,y,-d+.010],
      [w,y,d-.008],[w-.007,y,d],[-w+.008,y,d],[-w,y,d-.010]];
    const rows=[body(-.050,.076,.031),body(-.044,.079,.034),body(.026,.079,.034),body(.047,.079,.033),body(.051,.073,.030)];
    shell(g,rows,(k,i)=>k===2?(i===5?"#45484a":"#3c4043"):k===3?"#a9afa8":silver);poly(g,rows.at(-1),"#d1d0be");
    g.box(-.047,.030,.034,.020,.016,.006,"#576b70");g.box(-.046,.032,.038,.012,.009,.002,"#bacbc2");
    g.box(.010,.035,.035,.024,.011,.004,"#7c8a80");
    g.box(-.044,.030,-.033,.022,.017,.007,black);
    g.cyl(.051,.055,-.010,.015,.016,.008,10,"#7e8786");
    g.cyl(-.057,.055,-.009,.016,.016,.008,10,silver);
    g.cyl(.027,.058,.012,.006,.007,.010,8,"#b86d58");
    g.box(.045,.062,-.019,.033,.005,.009,black,-.37);
    const lens=(z,r)=>Array.from({length:14},(_,i)=>[.014+r*Math.cos(tau*i/14),-.002+r*Math.sin(tau*i/14),z]);
    shell(g,[lens(.030,.035),lens(.044,.0395),lens(.054,.0375),lens(.071,.036),lens(.077,.0325),lens(.074,.027)],(k,i)=>
      k===1?black:k===2||k===4?silver:k===3?(i%2?"#3c4144":"#6a7473"):"#343d42");
    poly(g,lens(.073,.027),"#365958");poly(g,lens(.074,.017),"#283941");
    g.quad([.016,.011,.076],[.028,.018,.076],[.032,.013,.076],[.023,.006,.076],"#8ca49b");
    pipe(g,[[-.075,.027,.003],[-.085,.022,.001],[-.087,.007,.002],[-.077,.002,.001]],.0026,gold,4);
  }
  function orient(v,yaw,pitch,roll){
    const c=Math.cos(pitch),s=Math.sin(pitch),r=Math.cos(roll),k=Math.sin(roll),cy=Math.cos(yaw),sy=Math.sin(yaw);
    const u=v[1]*c-v[2]*s,z=v[1]*s+v[2]*c,x=v[0]*r-u*k;
    return [x*cy+z*sy,v[0]*k+u*r,-x*sy+z*cy];
  }
  function frame(mesh,t,raised){
    const u=ease(.14,.92,clamp(Number(raised)||0)),rest=[-.029,1.213,.176],eye=[.081,1.626,.153];
    const restAt=mesh?.chest?.map(rest,[])||rest,eyeAt=mesh?.head?.map(eye,[])||eye;
    const at=blend(restAt,eyeAt,u);
    const swing=.011*Math.sin(t*1.73);
    return {at,yaw:mix(-.047+swing,0,u),pitch:mix(-.08+swing,.008,u),roll:mix(-.12+swing,-.010,u)};
  }
  function socket(f,p){const offset=orient(p,f.yaw,f.pitch,f.roll);return offset.map((n,i)=>n+f.at[i]);}
  function aimArm(limb,end){
    const a=limb.shoulder,k=limb.elbow,dx=end[0]-a[0],dy=end[1]-a[1],dz=end[2]-a[2];
    const d=Math.max(.001,Math.hypot(dx,dy,dz)),x=dx/d,y=dy/d,z=dz/d;
    const l=limb.arm.length,m=limb.forearm.length,along=(l*l-m*m+d*d)/(2*d);
    const hint=[limb.side*.8,-.87,-.30],dot=hint[0]*x+hint[1]*y+hint[2]*z;
    const ex=hint[0]-x*dot,ey=hint[1]-y*dot,ez=hint[2]-z*dot;
    const h=Math.sqrt(Math.max(0,l*l-along*along))/(Math.hypot(ex,ey,ez)||1);
    k[0]=a[0]+x*along+ex*h;k[1]=a[1]+y*along+ey*h;k[2]=a[2]+z*along+ez*h;
    limb.arm.aim(a,k);limb.forearm.aim(k,end);
  }
  const palms=[[-.237,.978,.053],[.237,.978,.053]],grips=[[-.018,-.033,.050],[.071,.012,.013]];
  const poseCache=new WeakMap();
  function cameraPose(mesh,actor,time=0,raised=false){
    if(!mesh)return false;
    const amount=clamp(Number(raised)||0),old=poseCache.get(mesh),revision=mesh.lastRevision;
    if(!amount&&!old)return false;
    if(old&&old.revision===revision){
      if(old.amount===amount&&(!amount||old.time===time))return false;
      for(let i=0;i<2;i++){mesh.sides[i].arm.m.set(old.base[2*i]);mesh.sides[i].forearm.m.set(old.base[2*i+1]);}
    }
    if(!amount){poseCache.delete(mesh);if(old?.revision===revision){mesh.skin();return true;}return false;}
    const base=old?.revision===revision?old.base:mesh.sides.flatMap(l=>[l.arm.m.slice(),l.forearm.m.slice()]);
    const shape=frame(mesh,time,amount),w=ease(0,.29,amount);
    mesh.sides.forEach((limb,i)=>{
      const target=blend(limb.forearm.map(palms[i],[]),socket(shape,grips[i]),w);
      const wrist=[target[0],target[1]+.025,target[2]-.014];
      for(let j=0;j<5;j++){aimArm(limb,wrist);const palm=limb.forearm.map(palms[i],[]);
        for(let c=0;c<3;c++)wrist[c]+=target[c]-palm[c];}
    });
    mesh.skin();poseCache.set(mesh,{revision,amount,time,base});return true;
  }
  function cameraProp(list,model,actor,mesh,time=0,raised=false){
    const f=frame(mesh,time,raised),a=actor.yaw||0,x=f.at[0],z=f.at[2];
    model("scout-rangefinder",camera);
    list.push(["scout-rangefinder",actor.x+x*Math.cos(a)+z*Math.sin(a),(actor.y||0)+(actor.motion?.lift||0)+f.at[1],
      actor.z-x*Math.sin(a)+z*Math.cos(a),a+f.yaw,f.pitch,f.roll]);
  }
  const letters={C:["111","100","100","100","111"],I:["111","010","010","010","111"],N:["101","111","111","111","101"],
    E:["111","100","110","100","111"],L:["100","100","100","100","111"],U:["101","101","101","101","111"],
    A:["010","101","111","101","101"]};
  function label(g,word,at,size,col){
    let x=-(word.length*4-1)*size*.5;
    for(const ch of word){const rows=letters[ch];if(rows)rows.forEach((row,i)=>{
      for(const m of row.matchAll(/1+/g)){
        const a=x+m.index*size,b=a+m[0].length*size,v=(2.5-i)*size;
        g.quad(at(a,v),at(b,v),at(b,v-size),at(a,v-size),col);
      }
    });x+=4*size;}
  }
  const backAt=(x,y,d=0)=>[x,y,-.215-(y-.813)*.315+d];
  function pinned(g,x,y,w,h,col,d){g.quad(backAt(x-w/2,y-h/2,d),backAt(x+w/2,y-h/2,d),
    backAt(x+w/2,y+h/2,d),backAt(x-w/2,y+h/2,d),col);}
  function topLine(g,pts,y,width,color){
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],n=width/Math.max(.001,2*Math.hypot(dx,dz));
      g.quad([a[0]+dz*n,y,a[1]-dx*n],[b[0]+dz*n,y,b[1]-dx*n],[b[0]-dz*n,y,b[1]+dx*n],[a[0]-dz*n,y,a[1]+dx*n],color);
    }
  }
  const proof={x:.190,y:.976,w:.290,h:.169};
  function printFace(g){
    for(const [u,v] of [[0,1],[1,1],[1,0],[0,1],[1,0],[0,0]]){
      const p=backAt(proof.x+(u-.5)*proof.w,proof.y+(.5-v)*proof.h,.012);
      g.vertices.push(...p,u,v,0);
    }
  }
  function desk(g){
    // Timber X trestles are pinned through their crossing. The stretcher folds into the lid for transport.
    for(const x of [-.519,.519]){
      for(const s of [-1,1]){
        const z=s*.248;
        g.box(x,.021,z,.068,.028,.079,"#555a54");
        g.pole([x,.032,z],[x,.780,-z*.89],.031,wood,4);
        g.box(x,.760,-z*.91,.112,.051,.085,edge);
      }
      g.pole([x-.031,.41,0],[x+.031,.41,0],.030,black,8);
      g.pole([x-.033,.41,0],[x+.033,.41,0],.013,gold,6);
    }
    g.box(0,.325,.058,1.054,.049,.043,"#9d795c");
    g.box(0,.730,-.006,1.19,.074,.47,edge);g.box(0,.786,0,1.28,.080,.670,wood);
    for(let i=0;i<4;i++)g.box(0,.829,-.245+i*.163,1.264,.009,.158,i%2?woodLight:"#bd8d63");
    // Handle and corners of the shallow field case remain visible from the pavement.
    for(const x of [-.588,.588]){g.box(x,.789,.338,.093,.077,.004,black);g.box(x,.788,.342,.020,.045,.004,silver);}
    pipe(g,[[-.085,.79,.337],[-.077,.767,.352],[.077,.767,.352],[.085,.79,.337]],.008,hide,5);
    for(const sx of [-1,1])for(const sz of [-1,1])g.box(sx*.624,.827,sz*.308,.032,.010,.041,"#98876b");
    const corners=[backAt(-.59,.837),backAt(.59,.837),backAt(.59,1.127),backAt(-.59,1.127)];
    poly(g,corners,"#82664d");poly(g,corners.map(q=>[q[0],q[1],q[2]-.018]),edge);
    for(let i=0;i<4;i++)pipe(g,[corners[i],corners[(i+1)%4]],.014,"#a17b57",4);
    for(const x of [-.43,.43])g.box(x,.843,-.209,.087,.024,.031,gold);
    pinned(g,-.331,.986,.365,.162,"#35565a",.004);
    label(g,"CINE LUNA",(x,y)=>backAt(-.332+x,.991+y,.0085),.0097,linen);
    pinned(g,-.328,.936,.241,.004,gold,.008);
    pinned(g,proof.x,proof.y,proof.w+.036,proof.h+.035,linen,.006);
    pinned(g,proof.x,proof.y,proof.w,proof.h,"#b79e90",.008);
    // The unexposed slot already holds Frankie's pencil study of the cinema across the road.
    pinned(g,proof.x,proof.y-.017,proof.w,.130,"#9ba9a2",.009);
    poly(g,[[.047,.933],[.108,.933],[.108,.985],[.135,.991],[.147,1.021],[.156,1.021],[.169,.986],[.199,.982],[.212,.94],[.335,.94],[.335,.895],[.047,.895]]
      .map(([x,y])=>backAt(x,y,.0095)),"#657579");
    pinned(g,.158,.966,.095,.009,"#dfb27f",.010);pinned(g,.156,.955,.063,.004,"#ba826d",.0102);
    for(const x of [proof.x-.105,proof.x+.107])pinned(g,x,proof.y+.091,.043,.014,"#d5b977",.015);
    // A printed road atlas lies open under a wax pencil. The spine lifts the left page.
    g.box(-.151,.843,.078,.493,.016,.292,"#5d6c68",-.018);
    g.box(-.261,.855,.078,.208,.009,.278,"#d0bea0");g.box(-.025,.855,.078,.247,.010,.279,linen);
    for(const x of [-.327,-.307,-.255,-.188,-.095,-.041,.029])topLine(g,[[x,-.046],[x+.014,.033],[x+.022,.201]],.862,.0035,"#a99982");
    for(const z of [-.018,.028,.094,.142,.187])topLine(g,[[-.357,z],[-.17,z+.006],[-.122,z+.003],[.079,z-.007]],.863,.004,"#aeaa8d");
    topLine(g,[[-.339,.150],[-.267,.147],[-.272,.033],[-.050,.031],[-.044,.091],[.067,.085]],.865,.007,rust);
    for(const x of [-.33,.065])g.cyl(x,.866,x<0?.149:.085,.009,.009,.004,8,red);
    g.pole([-.287,.874,.196],[-.114,.874,.149],.0047,"#bf9d5f",6);g.pole([-.114,.874,.149],[-.104,.874,.147],.0023,black,5);
    // Lipped developer's tray and individual cream card-slide mounts; the dark windows show the film.
    const bx=.382,bz=-.006;
    g.box(bx,.848,bz,.275,.025,.294,"#637d75");
    for(const s of [-1,1]){g.box(bx+s*.134,.875,bz,.009,.065,.293,mint);g.box(bx,.875,bz+s*.141,.268,.065,.009,"#557069");}
    for(let i=0;i<4;i++){
      const z=bz-.091+i*.056,y=.911+(i%2)*.013;
      g.box(bx,y,z,.203,.097,.007,i%2?"#d0b48e":linen);
      g.box(bx-.011,y+.003,z+.005,.119,.057,.004,i%2?"#8b7978":"#79918b");
      g.box(bx-.011,y-.010,z+.008,.110,.020,.002,i%2?"#625d67":"#4f6967");
      g.box(bx+.080,y-.015,z+.006,.009,.037,.002,i%2?rust:mint);
    }
    g.box(.394,.840,.231,.222,.012,.118,"#cda674",.047);g.box(.394,.851,.222,.183,.008,.093,"#d6b484",-.026);
    g.box(.427,.857,.224,.064,.002,.012,"#887762",-.026);
    // Rewind loupe, canister and perforated leader beside the atlas.
    for(const [x,z,col] of [[-.494,-.046,"#567976"],[-.484,.080,"#996344"]]){
      g.cyl(x,.871,z,.031,.033,.065,10,black);g.cyl(x,.875,z,.034,.034,.032,10,col);
      g.cyl(x,.907,z,.027,.033,.009,10,silver);g.cyl(x,.914,z,.014,.014,.007,8,black);
    }
    g.cyl(.139,.858,.164,.033,.040,.044,10,black);g.cyl(.139,.885,.164,.029,.033,.012,10,silver);
    g.cyl(.139,.890,.164,.023,.023,.004,10,"#6d8581");
    g.box(-.474,.839,.188,.126,.008,.036,"#725449",.09);
    for(let i=0;i<6;i++)g.box(-.522+i*.019,.845,.204-i*.0016,.006,.002,.004,linen);
  }
  function worldDesk(list,model,site,time=0){
    model("scout-field-desk",desk);model("scout-pinned-proof",printFace);
    list.push(["scout-field-desk",site.x,site.y||0,site.z,site.yaw||0]);
  }
  function drawDeskPrint(view,site,canvas,revision){
    if(canvas)view.drawPrint("scout-pinned-proof",canvas,revision,site.x,site.y||0,site.z,site.yaw||0);
  }
  function oval(c,x,z,rx,rz,col,angle=0){
    c.fillStyle=col;c.beginPath();c.ellipse(x,z,rx,rz,angle,0,tau);c.fill();
  }
  function stroke(c,points,col,width){
    c.strokeStyle=col;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";
    c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke();
  }
  function patch(c,points,col){
    c.fillStyle=col;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fill();
  }
  function rect(c,x,z,w,d,col){c.fillStyle=col;c.fillRect(x,z,w,d);}
  function at(c,px,py,scale,subject){
    c.save();c.translate(px(subject.x),py(subject.z));c.rotate(subject.yaw||0);c.scale(scale,-scale);
  }
  function mapDesk(c,px,py,s,site,time=0,canvas){
    at(c,px,py,s,site);
    rect(c,-.59,-.31,1.26,.68,"rgba(48,48,44,.36)");rect(c,-.64,-.335,1.28,.68,edge);
    for(let i=0;i<4;i++)rect(c,-.627,-.325+i*.163,1.254,.159,i%2?woodLight:wood);
    rect(c,-.60,-.36,1.20,.143,edge);rect(c,-.582,-.355,1.164,.125,"#a38160");
    rect(c,-.520,-.335,.378,.084,"#35565a");rect(c,-.480,-.307,.300,.009,linen);rect(c,-.445,-.282,.224,.006,gold);
    rect(c,.026,-.342,.328,.102,linen);
    if(canvas?.width){c.save();c.translate(.040,-.328);c.scale(1,-1);c.drawImage(canvas,0,-.076,.300,.076);c.restore();}
    else{rect(c,.040,-.328,.300,.076,"#a2aea3");patch(c,[[.040,-.289],[.110,-.289],[.125,-.314],[.152,-.304],[.176,-.293],[.235,-.294],[.241,-.278],[.340,-.277],[.340,-.252],[.040,-.252]],"#647977");}
    for(const x of [-.433,.433])rect(c,x-.031,-.229,.062,.018,gold);
    rect(c,-.375,-.118,.476,.345,"#b89b76");rect(c,-.368,-.118,.460,.326,linen);
    patch(c,[[-.370,-.113],[-.190,-.113],[-.226,-.074],[-.283,-.060],[-.311,-.021],[-.368,.008]],"#8ca99c");
    for(const x of [-.320,-.241,-.167,-.089,-.016,.051])stroke(c,[[x,-.072],[x+.012,.018],[x-.002,.185]],"#b9b79a",.006);
    for(const z of [.035,.098,.153])stroke(c,[[-.347,z],[-.148,z+.008],[.075,z-.004]],"#abab91",.006);
    stroke(c,[[-.335,.156],[-.243,.149],[-.240,.034],[-.050,.037],[-.042,.094],[.064,.087]],red,.012);
    oval(c,-.333,.156,.013,.012,red);stroke(c,[[-.289,.188],[-.112,.150]],"#9b6a44",.013);
    rect(c,.249,-.151,.270,.29,ink);rect(c,.260,-.142,.248,.273,mint);
    for(let i=0;i<4;i++){const z=-.118+i*.059;rect(c,.278,z,.206,.048,i%2?"#d5b68a":linen);rect(c,.305,z+.009,.125,.028,i%2?"#867575":"#54756f");}
    rect(c,.270,.170,.225,.105,"#b99164");patch(c,[[.294,.167],[.474,.179],[.471,.259],[.286,.245]],"#dfbc87");
    stroke(c,[[.306,.180],[.382,.218],[.463,.191]],edge,.005);
    for(const [x,z] of [[-.494,-.048],[-.482,.080],[.138,.164]]){oval(c,x,z,.034,.034,black);oval(c,x,z,.024,.024,silver);oval(c,x,z,.016,.016,"#60746c");}
    c.restore();
  }
  function actorScale(s){return Math.max(3,s*1.8);}
  function mapPerson(c,px,py,s,actor,time=0,raised=0){
    const m=actor.motion||{},feet=m.feet||[],sz=actorScale(s);
    const seated=(m.ride?.seat||0)>.75,run=m.run||0,w=m.weight||0,swing=Math.cos((m.phase||0)*tau)*w;
    const lift=m.lift||0,kit=actor.kit&&actor.kit!=="street"&&window.BayCourtPlayers?.kitColors?.[actor.kit];
    const amount=clamp(Number(raised)||0),shirt=kit||denim;
    at(c,px,py,sz,actor);oval(c,.10,-.14,.33-lift*.06,.27-lift*.04,"rgba(54,55,50,.35)",.38);
    c.translate(0,lift*.58);
    for(let i=0;i<2;i++){
      const side=i?1:-1,x=side*.12,z=feet[i]?.z??side*.055;
      if(!seated){stroke(c,[[x,.015],[x,z]],"#918574",.129);oval(c,x,z+.022,.066,.123,"#594c46");oval(c,x,z+.076,.058,.056,"#ab9982");}
      const ax=mix(side*(.253+.026*run),i?.160:-.120,amount),az=mix(side*swing*(.20+.21*run),i?.196:.183,amount);
      stroke(c,[[side*.187,-.008],[side*.244,az*.45]],shirt,.132);
      stroke(c,[[side*.244,az*.45],[ax,az]],kit?colors[0]:"#929fa5",.098);
      oval(c,ax,az+.011,.054,.061,colors[0]);if(i)stroke(c,[[ax-.038,az-.012],[ax+.039,az-.010]],hide,.018);
    }
    oval(c,0,0,.258,.135,kit||indigo,-.11*swing);oval(c,0,.027,.240,.113,shirt,-.11*swing);
    if(kit){for(const side of [-1,1])stroke(c,[[side*.184,-.076],[side*.171,.085]],linen,.023);}
    else{
      stroke(c,[[-.168,-.058],[0,-.095],[.166,-.058]],faded,.017);
      patch(c,[[-.065,.094],[-.100,.067],[-.150,-.079],[-.102,-.058],[-.082,-.069],[-.067,.035]],rust);
      oval(c,-.066,.076,.070,.035,"#cf875f",-.34);
    }
    const head=.065+.030*run;
    oval(c,-.025,head-.118,.076,.082,hair,-.25);
    stroke(c,[[-.072,head-.122],[-.078,head-.163],[-.060,head-.179]],hairLight,.016);
    oval(c,0,head+.005,.104,.111,colors[0]);oval(c,-.004,head-.013,.105,.104,hair,-.20);
    stroke(c,[[.049,head+.071],[.075,head+.043],[.085,head+.007]],hairLight,.014);
    oval(c,.099,head-.006,.009,.015,gold);c.restore();
  }
  function mapCamera(c,px,py,s,actor,time=0,raised=false){
    const m=actor.motion||{},u=ease(.14,.92,clamp(Number(raised)||0)),x=mix(-.025,.069,u),z=mix(.137,.214,u);
    at(c,px,py,actorScale(s),actor);c.translate(0,(m.lift||0)*.58);
    stroke(c,[[-.093,.091],[x-.065,z],[x+.067,z],[.095,.089]],hide,.011);
    c.translate(x,z);c.rotate(mix(-.11+.012*Math.sin(time*1.73),-.018,u));
    rect(c,-.081,-.032,.162,.068,black);rect(c,-.077,-.028,.154,.031,silver);
    rect(c,-.062,-.022,.024,.017,"#65736e");rect(c,-.013,.028,.066,.052,black);
    rect(c,-.013,.062,.066,.012,silver);rect(c,-.004,.074,.048,.008,"#375a58");
    oval(c,.053,-.014,.012,.009,"#747e79");c.restore();
  }
  window.BayScoutArt=Object.freeze({colors,dress,cameraPose,cameraProp,mapPerson,mapCamera,worldDesk,mapDesk,drawDeskPrint});
})();
