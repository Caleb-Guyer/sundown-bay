/* Ocean Unit 12. The carbon book, cap and fleet numbers share the division's wave mark. */
(() => {
  "use strict";
  const colors = ["#ad7658", "#52696b", "#39474f"];
  const midnight = "#334751", sea = "#557a79", brass = "#c4af79", bone = "#e3d7ac";
  const paper = "#eee2bb", carbon = "#788e8c", graphite = "#3c4849", tau = 2 * Math.PI;
  const unit = n => Math.min(1, Math.max(0, n || 0));
  const mix = (a,b,t) => a + (b-a)*t;
  const between = (a,b,t) => a.map((v,i)=>mix(v,b[i],t));
  const key = name => "ocean-beat/"+name;
  function polygon(g,points,color) {
    for (let i=2;i<points.length;i++) g.tri(points[0],points[i-1],points[i],color);
  }
  function officerKit(g,part) {
    part("head");
    // A tied bun sits below the adjustable rear band.
    g.cyl(.008,1.645,-.113,.061,.059,.069,8,"#443937");
    g.cyl(.008,1.610,-.126,.046,.049,.025,8,midnight);
    g.cyl(0,1.734,-.001,.122,.115,.057,10,midnight);
    g.cyl(0,1.768,-.001,.090,.121,.061,10,"#455b60");
    g.cyl(0,1.795,-.003,.029,.091,.018,10,"#52686a");
    polygon(g,[[-.10,1.722,.051],[-.10,1.710,.118],[-.069,1.706,.167],[.059,1.706,.174],
      [.102,1.710,.131],[.106,1.722,.049]],midnight);
    g.quad([-.026,1.737,.114],[.023,1.737,.114],[.020,1.765,.111],[-.025,1.765,.111],sea);
    g.tri([-.019,1.746,.115],[.018,1.747,.115],[.006,1.757,.115],bone);
    part("body");
    function patch(points,color,z=.127) { polygon(g,points.map(([x,y])=>[x,y,z]),color); }
    for (const side of [-1,1]) {
      patch([[side*.034,1.402],[side*.077,1.431],[side*.123,1.405],[side*.067,1.352]],"#718380");
      const x=side*.093;
      patch([[x-.045,1.291],[x+.045,1.291],[x+.043,1.218],[x,1.207],[x-.042,1.218]],"#455e62");
      patch([[x-.048,1.300],[x+.048,1.300],[x+.046,1.283],[x,1.272],[x-.044,1.279]],"#728580",.130);
    }
    patch([[-.116,1.364],[-.070,1.364],[-.075,1.331],[-.094,1.316],[-.113,1.331]],brass);
    patch([[-.11,1.343],[-.082,1.339],[-.089,1.350]],midnight,.129);
    g.box(.091,1.321,.127,.076,.014,.006,"#c1c4af");
    g.box(.086,1.321,.131,.044,.004,.003,midnight);
    g.box(0,.979,0,.333,.049,.218,"#3c4244");
    g.box(.005,.979,.113,.053,.031,.009,"#90968a");
    g.box(.165,.996,-.023,.058,.109,.081,midnight);
    g.pole([.173,1.044,-.036],[.170,1.101,-.042],.005,"#505b5e",5);
    part("arm",-1);
    g.quad([-.293,1.356,.050],[-.299,1.315,.044],[-.303,1.314,-.021],[-.287,1.357,-.022],sea);
    g.tri([-.299,1.337,.044],[-.302,1.326,-.010],[-.299,1.340,.003],bone);
  }
  const clothes = new WeakSet();
  function dress(mesh) {
    if (!mesh || clothes.has(mesh)) return;
    const g=new BayMesh(),groups=[];
    officerKit(g,(part,side)=>groups.push({part,side,start:g.vertices.length/6}));
    for(let i=0;i<groups.length;i++){
      const p=groups[i],end=groups[i+1]?.start??g.vertices.length/6;
      for(let j=p.start;j<end;j++)mesh.bindings.push(mesh.binding(p.part,mesh.sides[p.side===1?1:0],g.vertices[j*6+1]));
    }
    const rest=new Float32Array(mesh.rest.length+g.vertices.length);
    rest.set(mesh.rest);rest.set(g.vertices,mesh.rest.length);
    mesh.rest=rest;mesh.vertices=rest.slice();mesh.lastRevision=-1;clothes.add(mesh);
  }

  function reach(limb,target,weight) {
    if (!weight) return;
    const from=limb.shoulder,fore=limb.forearm,goal=between(fore.map(limb.handPivot,[]),target,weight);
    const delta=goal.map((v,i)=>v-from[i]),length=Math.hypot(...delta)||.001,axis=delta.map(v=>v/length);
    const a=limb.arm.length,b=fore.length,d=Math.max(.060,Math.min(a+b-.001,length));
    const along=(a*a-b*b+d*d)/(2*d),out=Math.sqrt(Math.max(0,a*a-along*along));
    const bend=[limb.side*.92,-.70,-.25],dot=bend.reduce((sum,v,i)=>sum+v*axis[i],0);
    const normal=bend.map((v,i)=>v-dot*axis[i]),scale=out/(Math.hypot(...normal)||1);
    const elbow=from.map((v,i)=>v+axis[i]*along+normal[i]*scale),wrist=from.map((v,i)=>v+axis[i]*d);
    limb.arm.aim(from,elbow);fore.aim(elbow,wrist);
  }
  const sockets=new WeakMap(),frames=new WeakMap();
  const palm = limb => limb.forearm.map([limb.side*.238,.980,.051],[]);
  function pose(mesh,actor,time=0) {
    if(!mesh||!actor)return false;
    let frame=frames.get(mesh);
    if(!frame){
      const bones=[mesh.head,...mesh.sides.flatMap(l=>[l.arm,l.forearm])];
      frame={bones,base:new Float32Array(bones.length*12)};frames.set(mesh,frame);
    }
    const give=unit(actor.give),writing=unit(actor.writing)*(1-give),active=Math.max(give,writing)>0;
    const revision=mesh.lastRevision;
    if(frame.actor===actor&&frame.revision===revision&&frame.give===give&&frame.writing===writing&&(!active||frame.time===time))return false;
    const previous=frame.active;
    if(active){
      frame.bones.forEach((b,i)=>frame.base.set(b.m,12*i));
      const pivot=mesh.head.map(mesh.head.pivot,[]),m=mesh.head.m;
      mesh.head.place(pivot,Math.atan2(-m[6],m[5])+.36*writing,Math.atan2(-m[8],m[0])-.11*writing,Math.asin(Math.max(-1,Math.min(1,m[4]))));
      reach(mesh.sides[0],[-.106,1.205,.235],writing);
      const draw=[.019+.021*Math.sin(time*7.4),1.246+.003*Math.cos(time*13),.243+.018*Math.sin(time*3.7)];
      reach(mesh.sides[1],between(draw,[.128,1.294,.354],give),Math.min(1,writing+give));
      mesh.skin();
    } else if(previous) mesh.skin();
    sockets.set(actor,{revision,writing,give,left:palm(mesh.sides[0]),right:palm(mesh.sides[1]),leftElbow:mesh.sides[0].arm.map(mesh.sides[0].forearm.pivot,[]),
      rightElbow:mesh.sides[1].arm.map(mesh.sides[1].forearm.pivot,[])});
    if(active)frame.bones.forEach((b,i)=>b.m.set(frame.base.subarray(i*12,i*12+12)));
    Object.assign(frame,{actor,revision,give,writing,time,active});
    return active||!!previous;
  }
  function book(g) {
    g.box(.043,0,.029,.148,.020,.203,"#4e6664");
    g.box(.043,.013,.029,.139,.014,.194,carbon);
    g.box(.043,.023,.026,.134,.008,.188,paper);
    g.box(.043,.028,-.055,.135,.006,.018,"#ad9d7d");
    for(const [x,z,w] of [[.034,-.026,.077],[.043,-.004,.104],[.043,.020,.104],[.044,.042,.105],[.065,.083,.061]])
      g.box(x,.028,z,w,.002,.004,"#95a099");
  }
  function pen(g) {
    const a=[-.038,-.017,.023],b=[.035,.080,-.011];
    g.pole(a,b,.007,"#3f5557",5);
    g.pole(a,[-.044,-.028,.028],.003,"#b5b8a2",5);
  }
  function sheet(g) {
    const back=[[-.039,0,-.014],[.037,0,-.014],[.057,-.012,.072],[-.049,-.012,.072]];
    const front=[back[3],back[2],[.065,-.037,.138],[-.057,-.039,.144]];
    g.quad(...back,paper);g.quad(...front,paper);
    g.quad([-.038,-.013,.081],[.045,-.013,.079],[.045,-.015,.087],[-.038,-.015,.089],carbon);
  }
  function world(list,model,actor,ground,time=0) {
    const socketsNow=sockets.get(actor);if(!socketsNow)return;
    const yaw=actor.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
    function held(name,builder,p,pitch,roll=0) {
      model(key(name),builder);
      list.push([key(name),actor.x+c*p[0]+s*p[2],ground+p[1],actor.z-s*p[0]+c*p[2],yaw,pitch,roll]);
    }
    held("book",book,socketsNow.left,mix(.98,.11,unit(actor.writing)*(1-unit(actor.give))),-.08);
    if(unit(actor.give)>.12)held("slip",sheet,socketsNow.right,-.08,-.10);
    else if(unit(actor.writing)>.06)held("pen",pen,socketsNow.right,0);
  }

  // Block-painted fleet numerals are simple polygons, so the side and roof prints never need textures.
  const digits=[
    [[.02,.71],[.27,1],[.47,1],[.47,.17],[.66,.17],[.66,0],[.08,0],[.08,.17],[.27,.17],[.27,.74],[.15,.61]],
    [[.01,.78],[.01,.89],[.13,1],[.53,1],[.68,.86],[.68,.63],[.26,.20],[.69,.20],[.69,0],[.00,0],[.00,.20],[.46,.67],[.46,.80],[.41,.83],[.25,.83],[.21,.79],[.21,.74]]
  ];
  // The letters have concave outlines; split them into filled horizontal spans at their corners.
  function numerals(poly) {
    digits.forEach((digit,index)=>{
      const levels=[...new Set(digit.map(p=>p[1]))].sort((a,b)=>a-b);
      for(let j=1;j<levels.length;j++){
        const lo=levels[j-1],hi=levels[j],mid=(lo+hi)/2;
        const edges=[];
        for(let i=0;i<digit.length;i++){
          const a=digit[i],b=digit[(i+1)%digit.length];
          if(mid<Math.min(a[1],b[1])||mid>Math.max(a[1],b[1]))continue;
          const x=y=>index*.84+a[0]+(b[0]-a[0])*(y-a[1])/(b[1]-a[1]);
          edges.push([x(mid),x(lo),x(hi)]);
        }
        edges.sort((a,b)=>a[0]-b[0]);
        for(let k=1;k<edges.length;k+=2){
          const a=edges[k-1],b=edges[k];poly([[a[1],lo],[b[1],lo],[b[2],hi],[a[2],hi]]);
        }
      }
    });
  }
  function fleet(g) {
    const shape=bayCarLayout("cruiser"),roof=shape.glass[5],tail=shape.sections[1];
    numerals(pts=>g.quad(...pts.map(([x,y])=>[(x-.76)*.45,roof+.007,-.85+y*.44]),midnight));
    // Quarter markings sit behind the moving doors, on the flat upper deck of the trunk.
    numerals(pts=>g.quad(...pts.map(([x,y])=>[(x-.76)*.24,tail[2]+(shape.sections[2][2]-tail[2])*(-1.995+y*.24-tail[0])/(shape.sections[2][0]-tail[0])+.008,-1.995+y*.24]),"#d6dac8"));
    for(const side of [-1,1]){
      function point(z,y,extra=.012){
        const a=shape.sections[1],b=shape.sections[2],t=(z-a[0])/(b[0]-a[0]),w=mix(a[1],b[1],t),h=mix(a[2],b[2],t);
        return [side*(w-.08+.08*unit((y-.34)/(h-.46))+extra),y,z];
      }
      // Between the tail and rear wheel arch, above the wheel's rolling envelope.
      numerals(pts=>g.quad(...pts.map(([x,y])=>point(-1.79-side*(x-.76)*.155,.711+y*.146)),"#d7d9c6"));
      g.quad(point(-1.98,.680),point(-1.65,.680),point(-1.67,.695),point(-1.98,.695),"#6e9994");
    }
  }
  function lenses(g,phase) {
    const roof=bayCarLayout("cruiser").glass[5];
    for(const side of [-1,1]){
      const active=phase===side;
      const lens=side<0?(active?"#ff8c87":"#754d52"):(active?"#9cdde6":"#47627a");
      // Slightly larger caps fully cover the stock bright boxes while the car is parked.
      g.box(side*.232,roof+.118,-.17,.405,.118,.220,lens);
      for(const z of [-.283,-.057])g.box(side*.232,roof+.111,z,.364,.014,.006,
        active?(side<0?"#ffd1ad":"#d6f4ee"):(side<0?"#876267":"#5b7887"));
    }
  }
  function pulse(time,lit) {
    if(!lit)return 0;
    const p=((time%1)+1)%1,sub=p%0.5;
    return sub<.092||sub>.158&&sub<.236?(p<.5?-1:1):0;
  }
  function car(list,model,v,ground,time=0,lit=false) {
    const phase=pulse(time,lit),base=key("fleet"),lamp=key("light-"+phase);
    model(base,fleet);model(lamp,g=>lenses(g,phase));
    for(const id of [base,lamp])list.push([id,v.x,ground,v.z,v.yaw||0,v.pitch||0,v.lean||0]);
  }

  function mapPerson(ctx,actor,px,py,s,time=0) {
    if(!actor||!(s>0))return;
    const yaw=actor.yaw||0,c=Math.cos(yaw),sn=Math.sin(yaw);
    const P=([x,y,z])=>[c*x+sn*z+.22*y,sn*x-c*z-.27*y];
    ctx.save();ctx.translate(typeof px==="function"?px(actor.x):px,typeof py==="function"?py(actor.z):py);ctx.scale(s,s);
    function dot(p,rx,ry,col,ang=0){
      const [x,y]=P(p);ctx.beginPath();ctx.ellipse(x,y,rx,ry,ang,0,tau);ctx.fillStyle=col;ctx.fill();
    }
    function path(points,col,width){
      ctx.beginPath();ctx.moveTo(...P(points[0]));for(const p of points.slice(1))ctx.lineTo(...P(p));
      if(width){ctx.strokeStyle=col;ctx.lineWidth=width;ctx.lineCap="round";ctx.stroke();}
      else{ctx.closePath();ctx.fillStyle=col;ctx.fill();}
    }
    const w=unit(actor.writing)*(1-unit(actor.give)),give=unit(actor.give),step=(actor.motion?.weight||0)*Math.sin(tau*(actor.motion?.phase||0))*.16;
    const last=sockets.get(actor),saved=last&&last.revision===actor.motion?.revision&&last.writing===w&&last.give===give?last:null;
    const left=saved?.left||between([-.24,.97,.05+step],[-.10,1.19,.25],w);
    const right=saved?.right||between(between([.24,.97,.05-step],[.036+.019*Math.sin(time*7.4),1.22,.27],w),[.13,1.29,.36],give);
    const elbows=[saved?.leftElbow||[-.26,1.18,.08+step],saved?.rightElbow||[.26,1.18,.09-step]];
    dot([0,0,0],.29,.19,"rgba(32,45,47,.22)",yaw);
    for(const side of [-1,1]){
      const foot=[side*.109,.09,.049+side*step];
      path([[side*.09,.86,0],foot],colors[2],.123);dot(foot,.067,.115,midnight,yaw);
    }
    dot([0,1.15,0],.231,.139,colors[1],yaw);
    for(const [i,side] of [-1,1].entries()){
      const hand=side<0?left:right,elbow=elbows[i];
      const shoulder=[side*.19,1.37,0];
      path([shoulder,elbow],colors[1],.108);path([elbow,hand],colors[0],.070);
    }
    const off=(p,x,y,z)=>[p[0]+x,p[1]+y,p[2]+z];
    if(!actor.patrolFoot||w>.02)path([off(left,-.025,.012,-.04),off(left,.100,.012,-.04),off(left,.101,-.041,.115),off(left,-.024,-.041,.115)],paper);
    if(give>.12)path([off(right,-.046,0,0),off(right,.045,0,0),off(right,.052,-.026,.137),off(right,-.059,-.026,.138)],paper);
    else if(w>.06)path([off(right,-.035,-.010,.027),off(right,.028,.075,-.009)],graphite,.012);
    dot([0,1.64,-.110],.072,.074,"#493d38",yaw);dot([0,1.61,.020],.100,.100,colors[0]);
    dot([0,1.727,.060],.109,.118,midnight,yaw);dot([0,1.764,-.005],.109,.101,"#516669",yaw);
    path([[0,1.752,.093],[-.020,1.752,.082],[.018,1.752,.080]],bone,.014);
    ctx.restore();
  }
  function carMap(ctx,v,px,py,s,time=0,lit=false) {
    if(!v||!(s>0))return;
    ctx.save();ctx.translate(typeof px==="function"?px(v.x):px,typeof py==="function"?py(v.z):py);
    ctx.rotate(v.yaw||0);ctx.scale(s,-s);
    numerals(pts=>{
      ctx.beginPath();pts.forEach(([x,y],i)=>ctx[i?"lineTo":"moveTo"]((x-.76)*.45,-.644+y*.455));
      ctx.closePath();ctx.fillStyle=midnight;ctx.fill();
    });
    // The atlas silhouette puts its lightbar further forward than the 3-D shell.
    ctx.fillStyle="#414e55";ctx.fillRect(-.524,-.135,1.048,.300);
    const p=pulse(time,lit);
    for(const side of [-1,1]){
      ctx.fillStyle=side<0?(p===side?"#ffa39b":"#80575c"):(p===side?"#a4e5ef":"#506d80");
      ctx.fillRect(side*.26-.203,-.102,.406,.225);
    }
    ctx.restore();
  }
  function paint(canvas,slip) {
    const ctx=canvas?.getContext("2d");
    if(!ctx||!slip||!canvas.width||!canvas.height)return false;
    const W=canvas.width,H=canvas.height;
    ctx.save();ctx.fillStyle="#e9deb7";ctx.fillRect(0,0,W,H);
    // Horizontal stock is laid out like a carbon counterfoil; portrait stock gets a form with stacked fields.
    const portrait=H>W*.91,fw=portrait?320:520,fh=portrait?382:242;
    const scale=Math.min(W/fw,H/fh);
    ctx.translate((W-fw*scale)/2,(H-fh*scale)/2);ctx.scale(scale,scale);
    const l=18,r=fw-18,mono="monospace",print="#375954",hand="#284956",red="#9a5747";
    function text(value,x,y,size,col,family=mono,weight="",max=fw-36){
      ctx.fillStyle=col;ctx.font=(weight?weight+" ":"")+size+"px "+family;ctx.fillText(String(value??""),x,y,max);
    }
    function rule(x,y,w,col=carbon){ctx.fillStyle=col;ctx.fillRect(x,y,w,1);}
    ctx.textBaseline="alphabetic";ctx.textAlign="left";
    for(let x=8;x<fw-8;x+=8)rule(x,6,4,"#afaf92");
    const release=slip.kind==="release";
    text(release?"SUNDOWN BAY  /  BAY PATROL":"SUNDOWN BAY  /  OCEAN UNIT",l,28,12,print,mono,"bold");
    const ticket=slip.kind==="citation",check=slip.kind==="check";
    text(release?"Release from custody":check?"Brake lamp check":ticket?"Traffic citation":"Written warning",l,portrait?65:60,portrait?32:33,midnight,"Georgia, serif","bold");
    const serial=String(slip.number??"1").padStart(4,"0");
    text((release?"RELEASE COPY":"DRIVER COPY")+"  ·  NO. "+serial,l,portrait?85:78,12,red,mono,"bold");
    rule(l,portrait?95:87,r-l,print);
    function field(label,value,x,y,w){
      text(label,x,y,10,print,mono,"bold",w);
      text(value,x,y+20,17,hand,mono,"",w-3);rule(x,y+25,w);
    }
    const minute=((Math.floor(Number(slip.minute)||0)%1440)+1440)%1440;
    const clock=String(Math.floor(minute/60)).padStart(2,"0")+":"+String(minute%60).padStart(2,"0");
    const when="Day "+(slip.day??1)+" / "+clock,amount=release?(slip.fine?"Paid $"+slip.fine:"Warning"):check?"Voluntary check":ticket?"$"+(slip.fine??0):"No fine";
    if(portrait){
      field(release?"DISPATCH":"REGISTRATION",release?slip.stars+" stars":slip.plate,l,116,132);field("ISSUED",when,162,116,r-162);
      field(release?"CLOSED BY":"VEHICLE",release?"Foot patrol":slip.car,l,166,r-l);field("LOCATION",slip.street,l,215,r-l);
      field("DISPOSITION",amount,l,264,r-l);
    }else{
      field(release?"DISPATCH":"REGISTRATION",release?slip.stars+" stars":slip.plate,l,107,114);field(release?"CLOSED BY":"VEHICLE",release?"Foot patrol":slip.car,148,107,189);field("ISSUED",when,353,107,r-353);
      field("LOCATION",slip.street,l,151,319);field("DISPOSITION",amount,353,151,r-353);
    }
    const foot=fh-45;
    text("ISSUING OFFICER",l,foot,10,print,mono,"bold");
    text(release?"I. Acosta":"L. Solís",l+1,foot+22,23,hand,"Georgia, serif","italic");
    ctx.textAlign="right";text(release?"UNIT 04":"OCEAN 12",r,foot+17,16,print,mono,"bold");ctx.restore();
    return true;
  }
  window.BayOceanBeatArt={colors,dress,pose,world,car,carMap,mapPerson,paint,pulse};
})();
