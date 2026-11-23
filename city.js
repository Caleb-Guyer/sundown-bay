/* Static geometry, in metres. The road grid remains open in both directions. */
window.buildBayCity = function buildBayCity(g,water) {
  "use strict";
  water??=g;
  const solids = [], cameraObstacles = [];
  const roads = [-144, -72, 0, 72, 144];
  const garage={kind:"garage",name:"Portside Tire",x:-109,z:-17,halfWidth:4.7,halfDepth:7};
  let state = 76219;
  function random() {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  }
  const pick = (arr) => arr[Math.floor(random() * arr.length)];
  const between = (a, b) => a + (b - a) * random();
  const rect = (x, z, w, d, y, c) => g.quad(
    [x-w/2,y,z-d/2], [x+w/2,y,z-d/2], [x+w/2,y,z+d/2], [x-w/2,y,z+d/2], c
  );
  const block = (x,z,w,d,top,bottom=0) => solids.push({x,z,w,d,bottom,top});
  const cameraBlock = (x,z,w,d,bottom,top) => cameraObstacles.push({x,z,w,d,bottom,top});
  const stone = "#d9c3a9", asphalt = "#46515b", deepGlass = "#315666";
  const paleGlass = "#83b8b5", gold = "#ffd589", rose = "#fc9390";

  // With the front facing the viewer, u increases to the viewer's right.
  function facade(x,z,nx,nz) {
    function at(u,y,v) { return [x - nz*u + nx*v, y, z + nx*u + nz*v]; }
    function box(u,y,v,w,h,d,c) {
      const p = at(u,y,v);
      g.box(p[0],p[1],p[2],nx ? d : w,h,nx ? w : d,c);
    }
    function face(u,y,v,w,h,c) {
      g.quad(at(u-w/2,y-h/2,v), at(u+w/2,y-h/2,v),
        at(u+w/2,y+h/2,v), at(u-w/2,y+h/2,v), c);
    }
    function camera(u,v,w,d,bottom,top) {
      const p=at(u,0,v);
      cameraBlock(p[0],p[2],nx?d:w,nx?w:d,bottom,top);
    }
    return {at, box, face, camera};
  }

  // Five-row painted signage. Long horizontal pixels share their geometry.
  const alphabet = {
    A:["010","101","111","101","101"], B:["110","101","110","101","110"],
    C:["011","100","100","100","011"], D:["110","101","101","101","110"],
    E:["111","100","110","100","111"], F:["111","100","110","100","100"],
    G:["011","100","101","101","011"], H:["101","101","111","101","101"],
    I:["111","010","010","010","111"], K:["101","101","110","101","101"],
    L:["100","100","100","100","111"], M:["10001","11011","10101","10001","10001"],
    N:["1001","1101","1011","1001","1001"], O:["010","101","101","101","010"],
    P:["110","101","110","100","100"], Q:["0110","1001","1001","1011","0111"],
    R:["110","101","110","101","101"],
    S:["011","100","010","001","110"], T:["111","010","010","010","010"],
    U:["101","101","101","101","010"], V:["101","101","101","101","010"],
    W:["10001","10001","10101","11011","10001"], X:["101","101","010","101","101"],
    Y:["101","101","010","010","010"], Z:["111","001","010","100","111"],
    0:["111","101","101","101","111"],1:["010","110","010","010","111"],
    2:["110","001","010","100","111"],3:["110","001","010","001","110"],
    4:["101","101","111","001","001"],5:["111","100","110","001","110"],
    6:["011","100","110","101","010"],7:["111","001","010","010","010"],
    8:["010","101","010","101","010"],9:["010","101","011","001","110"],
    " ":["00","00","00","00","00"]
  };
  function sign(f, word, u, y, v, unit, color) {
    const letters = [...word].map(ch => alphabet[ch] || alphabet[" "]);
    let left = u - (letters.reduce((a,p) => a + p[0].length + 1, -1) * unit) / 2;
    for (const glyph of letters) {
      glyph.forEach((row,r) => {
        for (const hit of row.matchAll(/1+/g)) {
          f.face(left + (hit.index + hit[0].length / 2) * unit, y + (2-r)*unit,
            v, hit[0].length*unit, unit, color);
        }
      });
      left += (glyph[0].length+1)*unit;
    }
  }
  function painted(f,points,v,color) {
    for(let i=1;i<points.length-1;i++) {
      const p=points[0],q=points[i],r=points[i+1];
      g.tri(f.at(p[0],p[1],v),f.at(q[0],q[1],v),f.at(r[0],r[1],v),color);
    }
  }
  function brush(f,a,b,width,v,color) {
    const dx=b[0]-a[0],dy=b[1]-a[1],n=width*.5/Math.hypot(dx,dy);
    const i=dy*n,j=-dx*n;
    painted(f,[[a[0]+i,a[1]+j],[b[0]+i,b[1]+j],[b[0]-i,b[1]-j],[a[0]-i,a[1]-j]],v,color);
  }
  function disc(f,u,y,v,rx,ry,color,sides=14) {
    for(let i=0;i<sides;i++) {
      const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;
      g.tri(f.at(u,y,v),f.at(u+rx*Math.cos(a),y+ry*Math.sin(a),v),
        f.at(u+rx*Math.cos(b),y+ry*Math.sin(b),v),color);
    }
  }
  function stripeCanopy(f,u,y,v,w,depth,colors,count) {
    const stripe=w/count;
    for(let i=0;i<count;i++){
      const x=u-w/2+(i+.5)*stripe;
      awning(f,x,y,v,stripe+.005,depth,colors[i%colors.length]);
      if(i%5===3) f.face(x+.15*stripe,y-.43,v+depth+.012,stripe*.21,.03,"#d6a789");
    }
    f.camera(u,v+depth/2,w,depth,y-.64,y+.58);
  }
  function awning(f,u,y,v,w,d,c) {
    g.quad(f.at(u-w/2,y+.55,v),f.at(u+w/2,y+.55,v),
      f.at(u+w/2,y-.18,v+d),f.at(u-w/2,y-.18,v+d),c);
    f.face(u,y-.4,v+d,w,.44,c);
    g.tri(f.at(u-w/2,y-.18,v),f.at(u-w/2,y+.55,v),f.at(u-w/2,y-.18,v+d),c);
    g.tri(f.at(u+w/2,y-.18,v),f.at(u+w/2,y+.55,v),f.at(u+w/2,y-.18,v+d),c);
  }
  function windows(f,w,h,d,style) {
    const rows = Math.max(1, Math.floor((h-3.3)/3.3));
    const n = Math.max(2,Math.floor(w/4.5));
    const pitch = w/(n+.45);
    for (let j=0;j<rows;j++) {
      const y = 4.2 + j*3.3;
      if(y+1.1>h) break;
      for(let i=0;i<n;i++) {
        const u=(i-(n-1)/2)*pitch;
        const c=style==="glass" ? (i%3===0?paleGlass:"#54818c") :
          (random()<.15 ? "#e7b784" : pick(["#55828b","#5c8790","#436d7b"]));
        f.face(u,y,d+.026,pitch*.73,1.65,c);
        const treatment=(i*3+j*7+rows)%6;
        if(treatment===0 || treatment===5) {
          f.face(u,y+.5,d+.032,pitch*.72,.48,treatment===0?"#b9beaf":"#bfa991");
          f.face(u-.06,y-.14,d+.037,.09,1.28,"#b0bfb2");
        } else if(treatment===2){
          for(const offset of [.40,.64]) f.face(u,y+offset,d+.034,pitch*.72,.085,"#b4c1b7");
        }
        if(style==="deco" && j%2 === 0) f.face(u,y-.9,d+.043,pitch*.84,.15,"#fbe0b4");
      }
    }
  }
  function building(x,z,w,d,h,dir,style,body,trim,name="") {
    const nx=dir[0], nz=dir[1];
    const f=facade(x,z,nx,nz), front=d/2;
    const sx=nx?d:w, sz=nx?w:d;
    block(x,z,sx+.35,sz+.35,h+(style==="house"?2.43:.70));
    f.box(0,h/2+.15,0,w,h,d,body);
    f.box(0,.43,0,w+.26,.6,d+.25,trim);
    if(style === "house") {
      const y=h+.18, ridge=y+2.25, roof=pick(["#bd7567","#9b7c6d","#6d8e8e"]);
      const a=-w/2-.56,b=w/2+.56,k=d/2+.55;
      g.quad(f.at(a,y,k),f.at(b,y,k),f.at(b,ridge,0),f.at(a,ridge,0),roof);
      g.quad(f.at(a,ridge,0),f.at(b,ridge,0),f.at(b,y,-k),f.at(a,y,-k),roof);
      g.tri(f.at(a,y,-k),f.at(a,y,k),f.at(a,ridge,0),trim);
      g.tri(f.at(b,y,-k),f.at(b,ridge,0),f.at(b,y,k),trim);
      for(const t of [-w*.31,w*.29]){
        f.face(t,1.95,front+.035,2.25,1.6,deepGlass);
        for(const side of [-1,1]) f.face(t+side*1.36,1.95,front+.04,.37,1.72,trim);
      }
      f.face(0,1.42,front+.04,1.36,2.56,"#717373");
      awning(f,0,3.15,front,3.5,1.8,trim);
      f.camera(0,front+.9,3.5,1.8,2.53,3.7);
      const end=facade(x,z,-nz,nx);
      end.face(0,2.35,w/2+.025,2.1,1.35,"#648b91");
      end.face(0,2.35,w/2+.038,.10,1.35,trim);
      f.box(w*.30,h+1.28,-d*.19,.68,1.75,.78,"#b89582");
      return;
    }
    f.box(0,h+.3,0,w+.52,.52,d+.52,trim);
    f.box(0,h+.59,0,w-.7,.16,d-.7,"#849095");
    if(style==="shed"){
      const bays=Math.max(2,Math.floor(w/8));
      for(let i=0;i<bays;i++){
        const u=(i-(bays-1)/2)*(w/(bays+.3));
        f.face(u,2.35,front+.08,w/(bays+.8)-.72,4.1,"#677b7f");
        for(const j of [1.15,2.45,3.75]) f.face(u,j,front+.09,w/(bays+.8)-.88,.10,"#8da19d");
      }
      if(name){
        f.box(0,h-.95,front+.13,w*.72,2,.31,trim);
        sign(f,name,0,h-.96,front+.291,Math.min(.25,w*.028),"#fff2ca");
      }
      return;
    }
    if(style==="glass"){
      for(let y=3.2;y<h-.6;y+=3.5) {
        f.face(0,y,front+.025,w-.8,2.45,"#528493");
        f.face(0,y+.5,front+.032,w-.95,.32,"#9abcb3");
        const side=facade(x,z,-nz,nx);
        side.face(0,y,w/2+.02,d-.95,2.45,"#416875");
      }
      for(let u=-w*.34;u<w*.5;u+=w*.33) f.face(u,h*.5,front+.05,.38,h-.3,trim);
      f.box(0,h+1.55,-1,w*.68,2.5,d*.69,body);
      f.box(0,h+3,-1,w*.69,.47,d*.70,trim);
      f.box(w*.18,h+3.6,-1,1.5,1.1,1.5,deepGlass);
      f.camera(0,-1,w*.69,d*.70,h+.66,h+3.26);
      const rear=facade(x,z,-nx,-nz);
      const blankSide=facade(x,z,nz,-nx);
      for(let y=4.2;y<h-1;y+=4.1) {
        rear.face(0,y,front+.025,w*.78,1.38,"#597984");
        blankSide.face(-d*.12,y,w/2+.025,d*.59,1.72,"#567783");
      }
    } else {
      windows(f,w,h,front,style);
      const side = facade(x,z,-nz,nx);
      windows(side,d,h,w/2,style==="deco"?"side":style);
      if(style==="deco"){
        for(const y of [h-.55,h-1.26]) f.box(0,y,0,w+.32,.22,d+.32,trim);
        f.box(w*.27,h+1.25,-d*.13,w*.32,2.0,d*.54,body);
        f.box(w*.27,h+2.3,-d*.13,w*.34,.27,d*.56,trim);
        f.camera(w*.27,-d*.13,w*.34,d*.56,h+.65,h+2.44);
      } else {
        f.box(-w*.24,h+1,-d*.19,w*.22,1.5,d*.28,"#859094");
      }
      const back=facade(x,z,-nx,-nz);
      if(h>10){
        const spaces=Math.max(3,Math.floor(w/5));
        for(let i=0;i<spaces;i++) for(let y=4.5;y<h-1.2;y+=4.1) {
          back.face((i-(spaces-1)/2)*(w/spaces),y,front+.02,2.15,1.25,"#738e92");
        }
      } else {
        back.face(-w*.24,1.45,front+.024,1.35,2.52,"#6e8584");
        back.face(w*.19,2.2,front+.024,2.3,1.2,"#729291");
      }
    }
    // A street-level shop front and recessed entry.
    f.face(0,1.65,front+.04,w-.8,2.7,deepGlass);
    for(let u=-w/2+1.4;u<=w/2-1.2;u+=3.65) f.face(u,1.7,front+.055,.17,2.8,trim);
    f.face(-w*.17,1.45,front+.072,1.6,2.65,"#2b4b5c");
    f.face(-w*.17,1.67,front+.08,.84,1.50,paleGlass);
    if(name) {
      const ww = Math.min(w-.6,Math.max(9,name.length*1.7));
      f.box(0,4.02,front+.49,ww,1.72,1.04,trim);
      f.face(0,4.02,front+1.02,ww-.28,1.44,deepGlass);
      sign(f,name,0,4.04,front+1.034,Math.min(.206,ww/(name.length*5.9)),gold);
      f.camera(0,front+.49,ww,1.04,3.14,4.89);
    } else if(h<16) {
      awning(f,0,3.42,front,w-.4,1.34,trim);
      f.camera(0,front+.67,w-.4,1.34,2.81,3.97);
    }
  }
  function palm(x,z,height,angle) {
    const dx=Math.cos(angle), dz=Math.sin(angle);
    const base=[x,.14,z], elbow=[x+dx*.24,height*.46,z+dz*.24];
    const neck=[x+dx*.83,height*.89,z+dz*.83], crown=[x+dx*1.03,height,z+dz*1.03];
    g.pole(base,elbow,.25,"#997d65",7);
    g.pole(elbow,neck,.214,"#a78b6d",6);
    g.pole(neck,crown,.235,"#7d916c",6);
    for(let i=1;i<5;i++){
      const t=i/5;
      const p=[base[0]+(elbow[0]-x)*t,elbow[1]*t,base[2]+(elbow[2]-z)*t];
      g.pole(p,[p[0]+.009,p[1]+.072,p[2]],.255,"#b19575",6);
    }
    const hero=x>130 && z>-67 && z<78;
    const count=hero?13:10;
    for(let i=0;i<count;i++){
      const upper=i>=count-4, a=angle+i*2.39996;
      const ux=Math.cos(a),uz=Math.sin(a);
      const length=height*(upper?.45:.59)*(.91+.08*Math.sin(i*4.6+angle));
      const climb=length*(upper?.47:.28), fall=length*(upper?.02:.37);
      function leaf(t,spread=0){
        return [crown[0]+ux*t*length-uz*spread,
          height+.05+Math.sin(t*Math.PI)*climb-t*t*fall-Math.abs(spread)*.32,
          crown[2]+uz*t*length+ux*spread];
      }
      const light=upper?(i%2?"#69996c":"#6aa67b"):(i%2?"#497f65":"#4c9270");
      const dark=upper?"#538467":(i%2?"#376d5a":"#3e795e");
      const half=length*(upper?.095:.125);
      for(const side of [-1,1]){
        const c=side===1?light:dark;
        const m=leaf(.44,side*half*.64);
        g.tri(leaf(0),m,leaf(.45),c);
        g.tri(m,leaf(1),leaf(.45),c);
        const steps=hero&&!upper?4:3;
        for(let j=0;j<steps;j++){
          const t=.13+j*(.59/steps),width=Math.sin(Math.PI*(t+.06));
          g.tri(leaf(t,side*half*width*.3),leaf(t+.14,side*half*width*.53),
            leaf(t+.22,side*half*width*1.55),c);
        }
      }
    }
    for(let i=0;i<3;i++){
      const a=angle+i*2.1,ux=Math.cos(a),uz=Math.sin(a);
      g.tri([crown[0]-.17*uz,height-.05,crown[2]+.17*ux],
        [crown[0]+.17*uz,height-.05,crown[2]-.17*ux],
        [crown[0]+ux*.7,height-1-.25*i,crown[2]+uz*.7],i%2?"#ab9169":"#9b8c68");
    }
    cameraBlock(x+dx*.3,z+dz*.3,.76,.76,.22,height*.8);
  }
  function lamp(x,z,nx,nz) {
    g.box(x,2.75,z,.15,5.5,.15,"#758284");
    const end=[x+nx*1.52,5.82,z+nz*1.52];
    g.pole([x,5.36,z],end,.09,"#8d9794",4);
    g.box(end[0],5.79,end[2],nx?.82:.35,.19,nx?.35:.82,"#e9c99a");
    cameraBlock(x,z,.23,.23,0,5.5);
  }
  function bench(x,z,across) {
    g.box(x,.75,z,across?2.3:.65,.16,across?.65:2.3,"#bc856a");
    g.box(x+(across?0:.32),1.12,z+(across?.32:0),across?2.3:.12,.46,across?.12:2.3,"#d5a083");
    for(const s of [-1,1]) g.box(x+(across?s*.78:0),.38,z+(across?0:s*.78),.16,.67,.17,"#697576");
  }
  function umbrella(x,z,r,color) {
    g.box(x,1.37,z,.085,2.75,.085,"#a88065");
    for(let i=0;i<8;i++) {
      const a=i*Math.PI/4,b=a+Math.PI/4;
      g.tri([x,3.05,z],[x+r*Math.cos(a),2.58,z+r*Math.sin(a)],
        [x+r*Math.cos(b),2.58,z+r*Math.sin(b)],i%2?color:"#fae5bb");
    }
    cameraBlock(x,z,2*r,2*r,2.52,3.08);
  }

  // Keep the water in its own batch so the animated surface costs one draw call.
  rect(-148,0,608,566,.005,"#aeb49b");
  water.quad([207,-.15,-690],[207,-.15,208],[1187,-.15,208],[1187,-.15,-690],"#338c94");
  water.quad([196,-.15,208],[196,-.15,690],[1187,-.15,690],[1187,-.15,208],"#338c94");
  const coast=[];
  for(let i=-12;i<=8;i++) {
    const z=i*26;
    coast.push({z, x:213+Math.sin(i*.82)*1.65+.8*Math.cos(i*1.91)});
  }
  for(let i=0;i<coast.length-1;i++){
    const a=coast[i], b=coast[i+1];
    g.quad([155,.02,a.z],[155,.02,b.z],[b.x,.02,b.z],[a.x,.02,a.z],"#e5c59e");
    g.quad([a.x-4,.027,a.z],[b.x-4,.027,b.z],[b.x,.027,b.z],[a.x,.027,a.z],"#d9bea1");
    water.quad([a.x,.04,a.z],[b.x,.04,b.z],[b.x+9,.04,b.z],[a.x+9,.04,a.z],"#80c8ba");
    water.quad([a.x+9,.035,a.z],[b.x+9,.035,b.z],[b.x+29,.035,b.z],[a.x+29,.035,a.z],"#56ada9");
    if(i%3!==1) g.quad([a.x+.9,.061,a.z+1.9],[b.x+.3,.061,b.z-1.1],[b.x+.65,.061,b.z-1.1],[a.x+1.55,.061,a.z+1.9],"#e8e7cb");
  }
  for(let i=0;i<70;i++){
    const x=between(226,392),z=between(-265,265);
    rect(x,z,between(.18,.55),between(2.5,12),.052,i%3?"#81bdba":"#d4d8c1");
  }
  // The blocks carry their own sidewalk colour. This keeps intersections free of curbs.
  const edges=[-226,-144,-72,0,72,144,224];
  for(let ix=0;ix<edges.length-2;ix++){
    for(let iz=0;iz<edges.length-1;iz++){
      const l=edges[ix]+7,r=edges[ix+1]-7,b=edges[iz]+7,t=edges[iz+1]-7;
      rect((l+r)/2,(b+t)/2,r-l,t-b,.081,stone);
      rect((l+r)/2,(b+t)/2,r-l-5.6,t-b-5.6,.092,pick(["#c4b7a3","#bbb7a4","#c5b6a4","#b5b7a0"]));
    }
  }
  rect(155.25,0,8.5,454,.085,stone);
  rect(163.2,0,6.5,453,.095,"#c89d82");
  for(let z=-214;z<215;z+=2.2) rect(163.2,z,6.5,.065,.104,"#ae8878");
  for(const c of roads){
    rect(c,0,14,456,.041,asphalt);
    rect(-37,c,378,14,.043,asphalt);
  }
  function stripeAlong(x,z,len,vertical,color,thick=.11,y=.105) {
    rect(x,z,vertical?thick:len,vertical?len:thick,y,color);
  }
  for(const road of roads) {
    for(let i=-193;i<194;i+=9){
      if(roads.some(c=>Math.abs(c-i)<11)) continue;
      stripeAlong(road,i,4.5,true,"#e3bc77",.14);
      if(i<145) stripeAlong(i,road,4.5,false,"#e3bc77",.14);
      if(road===144||road===0){
        for(const s of [-1,1]) {
          stripeAlong(road+3.55*s,i,3.1,true,"#aab4ae",.095);
          if(i<=141) stripeAlong(i,road+3.55*s,3.1,false,"#aab4ae",.095);
        }
      }
    }
  }
  for(const xx of roads) for(const zz of roads) {
    if((xx===144 || xx===0 || zz===-72) && !(xx===144 && zz===-144)){
      for(const s of [-1,1]){
        for(let j=-2;j<=2;j++){
          rect(xx+j*2.25,zz+s*8.3,1.05,1.65,.125,"#c9c6b2");
          if(xx!==144) rect(xx+s*8.3,zz+j*2.25,1.65,1.05,.127,"#c9c6b2");
        }
      }
    }
    if((xx+zz)%144===0) lamp(xx-8.5,zz+8.8,1,0);
  }
  // Beach access across the promenade is paved only to the east curb.
  for(const z of roads) rect(155.5,z,9,4.5,.105,"#d7baa2");
  const lineOnGround=(x1,z1,x2,z2,w,y,c)=>{
    const dx=x2-x1,dz=z2-z1,l=Math.hypot(dx,dz),a=dz*w/(2*l),b=-dx*w/(2*l);
    g.quad([x1+a,y,z1+b],[x2+a,y,z2+b],[x2-a,y,z2-b],[x1-a,y,z1-b],c);
  };
  // Expansion joints, dropped kerbs and utility cuts follow a handful of real blocks.
  function curbRun(x,z1,z2,side){
    const inner=x+side*.27, outer=x+side*2.75;
    g.quad([x,.041,z1],[x,.041,z2],[x,.145,z2],[x,.145,z1],"#a8a398");
    rect((x+inner)/2,(z1+z2)/2,.27,z2-z1,.147,"#d3c1a5");
    for(let z=z1+1.4;z<z2-.5;z+=3.9){
      rect((x+outer)/2,z,Math.abs(outer-x),.029,.157,"#b8aa96");
      if(Math.cos(z*2.1)>.76){
        lineOnGround(inner,z+.1,inner+side*.56,z+.49,.029,.16,"#b6ab99");
        lineOnGround(inner+side*.56,z+.49,inner+side*.86,z+.45,.023,.16,"#b6ab99");
      }
    }
  }
  for(const [a,b] of [[-135.7,-80.3],[-63.8,-8.3],[8.3,63.8],[80.3,135.7]]){
    curbRun(137,a,b,-1);curbRun(151,a,b,1);
  }
  curbRun(-7,8.4,63.65,-1);curbRun(7,8.4,63.65,1);
  for(const [x,z,long] of [[137,-47.4,6],[151,12.1,4.7],[137,56,4.2]]){
    rect(x+(x===137?-.13:.13),z,.24,long,.159,"#bf897b");
  }
  function drain(x,z,side){
    rect(x,z,.51,1.47,.089,"#39474e");
    for(let j=0;j<6;j++)rect(x,z-.60+j*.24,.38,.064,.102,"#7e8885");
    lineOnGround(x+.14*side,z+1.22,x+.26*side,z+1.51,.039,.093,"#928f76");
  }
  for(const z of [-62.2,-38,-10.4,11.1,35.5,61.8,83.3,119.8]){
    const even=(z>0 && z<62) || z===-38;
    drain(even?150.54:137.45,z,even?-1:1);
  }
  function asphaltPatch(x,z,w,d,angle){
    const ca=Math.cos(angle),sa=Math.sin(angle);
    const p=(a,b)=>[x+w*a*ca-d*b*sa,.069,z+w*a*sa+d*b*ca];
    const q=[p(-.5,-.24),p(-.29,-.51),p(.47,-.47),p(.52,.33),p(.22,.49),p(-.47,.42)];
    for(let i=1;i<q.length-1;i++)g.tri(q[0],q[i],q[i+1],"#424e58");
    for(let i=0;i<q.length;i++){
      const a=q[i],b=q[(i+1)%q.length];
      lineOnGround(a[0],a[2],b[0],b[2],.048,.076,"#384750");
    }
  }
  [[145.8,-37,2.2,7.6,-.03],[140.2,27.5,2.7,4.7,.13],[141.7,101,2.4,5.3,.05],
    [2.3,39,2.7,5.3,.06],[-69.9,-96,2.8,3.9,.13],[-145.3,-99,3.9,6.2,.1],
    [-111.2,-69.3,6.8,2.1,-.07],[36.7,1.9,7.4,2.23,-.07]].forEach(a=>asphaltPatch(...a));
  function utilityCover(x,z) {
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
      g.tri([x,.089,z],[x+.46*Math.cos(a),.089,z+.46*Math.sin(a)],
        [x+.46*Math.cos(b),.089,z+.46*Math.sin(b)],"#697272");
    }
    for(let i=-1;i<=1;i++){
      lineOnGround(x-.28,z+i*.12,x+.27,z+i*.12,.034,.102,"#49555a");
      lineOnGround(x+i*.12,z-.26,x+i*.12,z+.26,.027,.104,"#525e62");
    }
  }
  for(const p of [[146.4,-16],[140.5,35.6],[.8,61.6],[-141.6,-62],[-74.2,-134]]) utilityCover(...p);

  const E=[1,0],W=[-1,0],N=[0,1],S=[0,-1];
  function streetBlade(x,z,label,other) {
    g.pole([x,.14,z],[x,3.62,z],.072,"#7f9290",5);
    for(const [nx,nz,name,y,depth] of [[0,-1,label,3.28,.005],[1,0,other,3.59,0]]){
      const f=facade(x,z,nx,nz);
      f.box(0,y,0,2.48,.34,.085,"#557d70");
      f.face(0,y+.134,.048+depth,2.36,.021,"#bed4b6");
      sign(f,name,0,y,.055+depth,.0452,"#f4e4c3");
    }
    cameraBlock(x,z,.18,.18,0,3.75);
  }
  streetBlade(153.15,9.35,"OCEAN DR","MARLIN");
  streetBlade(9.65,61.70,"NEON MILE","LUNA");
  streetBlade(-134.47,-62.35,"PORT SOL","DOCK RD");
  // Lettering cut to fit the two original roadside marquees.
  const scriptLetters={
    M:[[[0,0],[0,1],[.34,.52],[.68,1],[.68,0]]],
    A:[[[0,0],[.34,1],[.68,0]],[[.14,.39],[.54,.39]]],
    R:[[[0,0],[0,1],[.43,1],[.64,.83],[.59,.58],[.03,.54]],[[.28,.55],[.70,0]]],
    L:[[[0,1],[0,0],[.59,0]]],
    I:[[[.04,1],[.47,1]],[[.24,1],[.24,0]],[[.02,0],[.47,0]]],
    N:[[[0,0],[0,1],[.68,.02],[.68,1]]],
    P:[[[0,0],[0,1],[.46,1],[.64,.8],[.57,.59],[0,.53]]]
  };
  function lettered(f,word,u,y,v,scale,color,width=.105) {
    const spacing=.94, start=u-(word.length*spacing-.22)*scale/2;
    [...word].forEach((ch,i)=>{
      const convert=([a,b])=>[start+(i*spacing+a+.14*b)*scale,y+b*scale];
      for(const stroke of scriptLetters[ch]){
        for(let j=1;j<stroke.length;j++) brush(f,convert(stroke[j-1]),convert(stroke[j]),width*scale,v,color);
      }
    });
  }
  function fishArt(f,u,y,v,k) {
    const shape=(points,depth,c)=>painted(f,points.map(([a,b])=>[u+a*k,y+b*k]),v+depth,c);
    shape([[-1.42,-.22],[-2.46,.42],[-2.11,-.30],[-2.61,-1.0],[-1.37,-.33]],.006,"#276773");
    shape([[-1.23,-.02],[-.75,.77],[-.52,1.39],[-.12,1.52],[-.03,.91],[.42,1.18],[.72,.72],[.96,.60]],.012,"#26868a");
    shape([[-1.62,-.29],[-1.05,.28],[-.33,.63],[.59,.83],[1.11,.78],[1.54,.56],
      [1.04,.30],[.16,-.01],[-.77,-.19]],.025,"#285568");
    shape([[1.19,.59],[2.81,1.04],[1.51,.48],[1.05,.38]],.031,"#265163");
    shape([[-1.23,-.12],[-.12,.22],[.82,.51],[1.42,.53],[.86,.29],[-.21,-.05]],.042,"#b3d9cd");
    shape([[-.24,.12],[.29,.18],[-.37,-.59]],.048,"#4c9d9d");
    disc(f,u+1.03*k,y+.64*k,v+.055,.075*k,.068*k,"#fff0c5",7);
  }
  function roadsideMarlin(){
    const cx=132.45,cz=-11.15,f=facade(cx,cz,0,-1), depth=.22;
    const outline=[[-3.67,5.37],[-3.78,7.91],[-2.92,8.26],[2.64,8.07],[3.78,7.03],[3.29,5.30],[-2.59,4.79]];
    for(const u of [-1.85,1.52]){
      g.pole(f.at(u*.67,.18,0),f.at(u,7.25,0),.145,"#86a69a",7);
      const p=f.at(u*.67,0,0);g.box(p[0],.16,p[2],.55,.31,.65,"#c8aa8c");
      block(p[0],p[2],.55,.65,.38);
      f.camera(u*.82,0,.62,.42,.35,7.45);
    }
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      g.quad(f.at(a[0],a[1],depth),f.at(b[0],b[1],depth),f.at(b[0],b[1],-depth),f.at(a[0],a[1],-depth),"#9e7a70");
    }
    for(const side of [f,facade(cx,cz,0,1)]) {
      painted(side,outline,depth,"#e8a38a");
      painted(side,outline.map(([u,y])=>[u*.957,6.55+(y-6.55)*.91]),depth+.012,"#f9deb1");
      painted(side,outline.map(([u,y])=>[u*.915,6.55+(y-6.55)*.82]),depth+.024,"#417d7d");
      disc(side,-.32,8.05,depth+.045,1.27,1.27,"#edb56f",18);
      for(const [h,w] of [[7.56,2.31],[7.35,2.06],[7.15,1.59]])
        side.face(-.32,h,depth+.058,w,.064,"#de957b");
      fishArt(side,-.04,7.88,depth+.074,.96);
      lettered(side,"MARLIN",-.05,5.48,depth+.031,.96,"#334e5c",.16);
      lettered(side,"MARLIN",-.09,5.55,depth+.046,.96,"#ffdfad",.104);
      for(const [u,y,len] of [[-2.8,7.74,.57],[1.67,7.58,.28],[2.68,6.76,.35],[-2.5,5.13,.22]]){
        brush(side,[u,y],[u+len,y+.023],.037,depth+.06,"#c5bab0");
      }
      side.face(0,3.93,.173,3.18,.69,"#2e5963");
      sign(side,"VACANCY",.15,3.95,.192,.091,"#ffc487");
      disc(side,-1.22,3.95,.195,.105,.105,"#ff986f",7);
    }
    f.box(0,3.93,0,3.32,.84,.32,"#d5bda1");
    f.camera(0,0,7.62,.56,4.76,9.44);
    f.camera(0,0,3.34,.38,3.50,4.36);
  }
  // Ocean Drive: a stepped deco resort, a freestanding roadside blade and a pool court.
  building(116,-32,39,27,11.4,E,"deco","#e5a49b","#90bdb5","MARLIN");
  const motel=facade(116,-32,1,0);
  motel.box(-13,8.9,13.1,3.7,17.4,2.2,"#8ab9b0");
  motel.box(-13,17.85,13.12,2.7,.75,1.8,"#edd4aa");
  motel.box(-13,18.5,13.12,1.7,.58,1.48,"#f4c7a6");
  motel.face(-13,13.6,14.23,2.28,6.95,"#416277");
  [..."MOTEL"].forEach((ch,i)=>sign(motel,ch,-13,16.04-i*1.18,14.249,.181,"#ffe1a4"));
  for(const u of [-8,-.6,7.15]) motel.face(u,7.9,13.54,4.9,.14,"#f5d7ad");
  rect(91,-33,9,25,.117,"#e2d2ae"); rect(91,-33,6.8,22,.125,"#72b9ba");
  rect(91,-33,5.6,20,.132,"#50a4ad");
  motel.face(0,1.83,13.62,38.4,3.14,"#b78c82");
  motel.face(0,.47,13.635,38.4,.27,"#d2ab8d");
  motel.box(0,3.33,14.22,37.6,.27,2.28,"#a7c4ae");
  motel.face(0,3.32,15.371,37.6,.075,"#f6dfb4");
  motel.camera(0,14.22,37.6,2.28,3.18,3.48);
  for(let i=0;i<6;i++){
    const u=-15.5+i*6.16;
    motel.box(u+2.45,1.77,15.14,.17,3.0,.17,"#cfd6b7");
    motel.face(u,1.49,13.66,1.46,2.58,"#548f8b");
    motel.face(u+.47,1.29,13.685,.095,.27,"#ffe4a3");
    motel.face(u+.99,2.03,13.68,.54,.31,"#626d70");
    sign(motel,String(11+i),u+.99,2.035,13.697,.042,"#ffdfab");
    motel.face(u-1.58,1.83,13.68,1.32,1.35,"#416876");
    motel.face(u-1.58,2.13,13.694,1.32,.44,i%3?"#b6c0ab":"#d7bca0");
    motel.face(u-1.58,1.71,13.695,.06,1.07,"#afbfaf");
  }
  for(const x of [88.1,94.2]) for(const z of [-44.6,-23.8]){
    rect(x,z,.69,1.65,.136,"#dfaf96");rect(x,z-.45,.68,.34,.145,"#f1d7ae");
  }
  roadsideMarlin();
  building(117,30,35,25,8.2,E,"deco","#eec9a6","#b6c7b1","PALM DINER");
  const diner=facade(117,30,1,0);
  diner.face(0,1.59,12.59,34.59,2.63,"#669795");
  diner.face(0,.68,12.605,34.59,.42,"#dc887f");
  for(let i=0;i<8;i++){
    const u=-14.16+i*4.05;
    diner.face(u,1.88,12.62,3.75,1.79,"#3b6471");
    diner.face(u,2.51,12.636,3.70,.24,"#a4c4b7");
    // Upholstered booths and their pale formica table behind the glass.
    diner.face(u-.75,1.41,12.645,.95,.50,i%3===0?"#d48d80":"#b97670");
    diner.face(u+.78,1.41,12.646,.76,.46,"#b7776e");
    diner.face(u+.06,1.69,12.654,1.20,.083,"#fed2a1");
    diner.face(u+.02,1.9,12.664,.12,.30,"#d99175");
    diner.face(u+1.92,1.86,12.65,.11,1.87,"#f4ceaa");
  }
  diner.face(-.15,1.56,12.681,1.54,2.82,"#416969");
  diner.face(-.15,1.88,12.69,1.19,1.68,"#a4c0ad");
  for(const u of [-11.6,11.3]) stripeCanopy(diner,u,3.23,12.68,11.1,1.86,["#d37770","#eac5a1","#d78374","#f2d4ad"],12);
  diner.box(0,6.75,12.63,34.5,.43,.53,"#92bbb0");
  diner.box(0,7.27,12.67,33,.15,.42,"#df8b80");
  diner.box(-7.2,9.82,10.63,.18,3.18,.18,"#7d8f91");
  diner.box(-.38,9.82,10.63,.18,3.18,.18,"#7d8f91");
  diner.box(-3.75,10.78,10.62,9.4,2.83,.27,"#dc887d");
  diner.face(-3.75,10.78,10.77,9.12,2.59,"#538c88");
  lettered(diner,"PALM",-3.76,10.13,10.792,1.34,"#ffe4ac",.115);
  diner.camera(-3.75,10.62,9.4,.29,9.36,12.20);
  function cafeTable(x,z,color){
    g.cyl(x,1.02,z,1.02,1.02,.14,10,"#e8c5a0");
    g.box(x,.55,z,.13,.96,.13,"#7e8f8b");
    for(const offset of [-1,1]){
      g.box(x,.64,z+1.23*offset,.90,.14,.78,color);
      g.box(x,1.01,z+1.53*offset,.88,.6,.11,color);
      for(const dx of [-.28,.28]) g.box(x+dx,.34,z+1.23*offset,.09,.58,.18,"#819990");
    }
    umbrella(x,z,1.56,color);
    block(x,z,1.95,3.15,1.39);
  }
  cafeTable(133.1,19.1,"#db8579");cafeTable(133.05,39.4,"#70a59a");
  diner.box(13.28,1.04,13.67,5.45,1.72,1.56,"#8eb2a0");
  diner.box(13.28,1.99,13.69,5.75,.19,1.76,"#edd4ae");
  diner.face(13.28,1.45,14.46,5.3,.13,"#da8c7c");
  for(const u of [11.4,12.3,13.2]){
    diner.box(u,2.21,13.89,.17,.36,.17,u<12?"#db8b78":"#e9bf83");
  }
  diner.camera(13.28,13.67,5.75,1.76,.18,2.10);
  const counter=diner.at(13.28,0,13.67);
  block(counter[0],counter[2],1.72,5.55,2.09);
  // An original heron mural on the diner's end wall. Separate flats read across the boulevard.
  const mural=facade(117,30,0,-1), mv=17.57;
  mural.face(0,4.04,mv,24.25,6.94,"#467c7c");
  mural.face(0,1.54,mv+.014,24.25,1.88,"#689c93");
  disc(mural,4.22,4.29,mv+.035,2.53,2.53,"#e7a373",20);
  for(const yy of [2.53,3.0]) mural.face(4.2,yy,mv+.045,4.85,.12,"#679990");
  const paints=[
    [[[-9,2.61],[-5.9,3.06],[-1.9,2.82],[3.3,3.01],[-1.7,2.46],[-5.9,2.66]],"#c4c7a1"],
    [[[-3.2,3.26],[-.9,4.64],[1.50,4.53],[2.23,4.06],[.28,3.48]],"#f2cfaa"],
    [[[-3.4,3.31],[-1.40,5.15],[.39,5.92],[.27,5.04],[-1.13,4.19]],"#e0b79c"],
    [[[-2.18,3.63],[-.28,4.84],[1.53,4.44],[.31,3.97]],"#afaaa0"],
    [[[1.2,3.91],[1.82,4.17],[2.13,5.15],[2.79,5.59],[3.03,5.26],[2.42,4.86],[2.21,3.96]],"#f4d8b2"],
    [[[2.40,5.27],[2.84,5.79],[3.82,5.64],[4.17,5.43],[3.13,5.18]],"#efd0aa"],
    [[[3.62,5.51],[5.83,5.28],[3.58,5.20]],"#deb46d"],
    [[[-3.08,3.31],[-1.79,3.52],[-2.60,3.24],[-4.64,2.78]],"#c3b5a2"]
  ];
  paints.forEach(([shape,c],i)=>painted(mural,shape,mv+.055+i*.007,c));
  disc(mural,3.46,5.48,mv+.13,.103,.094,"#345866",8);
  for(const offset of [-.20,.32]){
    brush(mural,[.25+offset,3.57],[.02+offset,2.0],.08,mv+.118,"#bb9274");
    brush(mural,[.02+offset,2],[.31+offset,1.56],.07,mv+.118,"#bb9274");
  }
  for(const [x,y,w] of [[-8.8,5.8,.8],[-6.45,5.25,.51],[-4.9,6.4,.68]]){
    brush(mural,[x-w,y+.2],[x,y],.075,mv+.10,"#e5c5a4");
    brush(mural,[x,y],[x+w,y+.34],.075,mv+.10,"#e5c5a4");
  }
  sign(mural,"TIDE",8.76,1.47,mv+.073,.125,"#e6d0af");
  building(89,48,19,13,6.0,N,"shop","#9cbfb3","#d98a78","REEL");
  building(90,14,13,13,6.9,W,"house","#e8bd9c","#9eaca2");
  building(118,100,23,24,22.4,E,"deco","#ddaea6","#c8d0b7","VISTA");
  building(95,118,24,17,9.5,N,"shop","#b2c9b9","#d69183","SODA");
  building(121,-112,27,26,14.2,E,"deco","#e6bfaa","#90aaa9","SOL");
  building(91,-118,17,14,5.5,S,"house","#b6c6ad","#bb847c");
  building(98,-89,19,13,5.3,W,"shop","#c8aa9d","#d3c7ab");

  // A surf rental stand with three repaired boards lashed to its side.
  const rental=facade(171.2,10.7,-1,0);
  rental.box(0,1.18,0,5.7,2.1,3.08,"#acbfa9");
  rental.box(0,2.81,0,5.98,.21,3.62,"#e48a76");
  rental.box(0,2.98,0,5.72,.15,3.37,"#ecbd8c");
  rental.face(0,1.77,1.557,4.28,.85,"#486e75");
  rental.box(0,1.33,1.72,4.76,.16,.56,"#e2bc91");
  rental.face(0,.78,1.555,5.39,.26,"#6fa399");
  rental.box(-.28,3.45,.07,3.50,.85,.15,"#4d8589");
  sign(rental,"SURF",-.28,3.46,.16,.107,"#ffe0a2");
  for(let i=0;i<3;i++){
    const u=3.18+i*.58,y=1.51+i*.06,v=.45+i*.25;
    painted(rental,[[u-.31,y-.88],[u-.26,y+.59],[u-.09,y+1.10],[u+.12,y+1.24],
      [u+.33,y+.81],[u+.32,y-.87],[u+.15,y-1.27],[u-.13,y-1.30]],v,["#e6af79","#e29085","#81aca5"][i]);
    brush(rental,[u-.24,y-.32],[u+.28,y+.19],.16,v+.012,"#ead6a9");
    brush(rental,[u-.24,y-.50],[u+.29,y+.035],.048,v+.014,"#a67d75");
  }
  block(171.2,10.7,3.17,5.78,3.1);
  rental.camera(3.7,.7,1.9,.8,.10,3.15);
  // The roadside paper machines carry small painted mastheads and a coin slot.
  function paperBox(x,z,color,title){
    const f=facade(x,z,1,0);
    f.box(0,.75,0,.80,1.2,.63,color);
    f.box(0,1.39,0,.84,.10,.70,"#c3b49b");
    f.face(0,.86,.327,.61,.52,"#566971");
    f.face(0,.89,.337,.41,.39,"#d7cbb0");
    for(const row of [.83,.90]) f.face(0,row,.346,.32,.044,"#9f998d");
    f.face(.25,1.16,.35,.11,.05,"#314c5b");
    sign(f,title,0,1.24,.342,.04,"#f9dfad");
    cameraBlock(x,z,.75,.86,.1,1.45);
  }
  paperBox(134.5,49.05,"#967069","SUN");
  paperBox(134.5,49.99,"#678d8b","TIDE");

  // Neon Mile and the civic centre. The fly tower and marquee are a street beacon.
  building(29,44,35,29,10.5,W,"deco","#d98d86","#eee1bb","CINE LUNA");
  const cine=facade(29,44,-1,0);
  cine.box(-10,10.6,14.6,3.15,14.4,1.7,"#a55c71");
  cine.face(-10,13.6,15.47,2.47,6.9,"#466579");
  [..."CINE"].forEach((ch,i)=>sign(cine,ch,-10,16.04-i*1.50,15.49,.221,"#ffbc99"));
  cine.box(0,3.55,15.8,17.5,.75,2.7,"#edb780");
  cine.face(0,3.53,17.16,16.98,.25,"#ffe7b6");
  cine.camera(0,15.8,17.5,2.7,3.17,3.93);
  cine.camera(-10,14.6,3.15,1.7,3.36,17.82);
  for(const i of [-1,1]){
    cine.box(-10+i*1.28,17.66,14.6,.38,2.18,.80,"#c47c77");
    cine.face(-10+i*1.28,17.9,15.016,.095,1.57,"#f4ce97");
  }
  cine.box(0,1.55,15.1,2.38,2.70,1.82,"#bd7d73");
  cine.face(0,1.78,16.03,1.92,1.16,"#547a80");
  cine.face(0,1.70,16.05,.09,1.02,"#cfb49a");
  cine.box(0,1.18,16.11,2.46,.15,.52,"#deb992");
  cine.face(0,.70,16.026,1.58,.42,"#546868");
  sign(cine,"TICKETS",0,.70,16.045,.054,"#ffe0a2");
  cine.box(0,3.02,15.1,2.66,.21,2.01,"#e1a783");
  const booth=cine.at(0,0,15.1);
  block(booth[0],booth[2],1.85,2.41,3.14);
  for(const [u,title,back,color] of [[-6.3,"ORBIT","#546984","#ecaf83"],[6.25,"TIDE","#4b8587","#df987d"]]){
    cine.box(u,1.76,14.56,1.60,2.0,.16,"#b49279");
    cine.face(u,1.76,14.65,1.44,1.82,back);
    disc(cine,u+.07,1.90,14.666,.43,.46,color,12);
    if(title==="ORBIT"){
      brush(cine,[u-.58,1.63],[u+.59,2.08],.077,14.69,"#d8c7a7");
      for(const s of [-1,1]) cine.face(u+s*.50,2.32,14.67,.055,.08,"#f9dab2");
    }else{
      painted(cine,[[u-.65,1.28],[u-.18,1.86],[u+.25,1.78],[u+.54,1.43],[u+.64,1.3]],14.685,"#a7c7b0");
    }
    sign(cine,title,u,1.10,14.70,.049,"#fbe0af");
  }
  building(42,16,24,14,21,S,"glass","#9faeaa","#dfc4a6");
  building(-37,42,35,28,29,N,"glass","#a0aaa7","#e2c2a0","ORBIT");
  building(-28,15,29,15,7,S,"shop","#d6b299","#89b2a9","ARCADE");
  building(-33,-26,29,24,19,E,"deco","#b5c8bc","#e8b19c","RIALTO");
  building(-34,-56,32,11,6.2,S,"shop","#e0ae8c","#79a7a8","DINER");
  building(37,-27,36,26,25,E,"glass","#bcb7ae","#a1c1b6");
  building(35,-56,33,11,6.8,S,"shop","#a4b4b4","#dea494");
  building(25,106,25,29,34.3,W,"glass","#ceb7ac","#d6d1b6","BAY");
  building(52,114,24,14,9.2,E,"deco","#c6c7a7","#ac8d96");
  building(-32,107,32,30,22.7,W,"deco","#cfafa6","#dfc5a8","PALMS");
  // Each tower's crown has a different profile against the light.
  const tower=facade(25,106,-1,0);
  for(let i=-2;i<=2;i++){
    const h=2.7+(2-Math.abs(i))*1.8;
    tower.box(i*2,36.9+h*.5,-1,.40,h,6.5,"#86a6a4");
  }
  tower.box(0,43.40,-1,.95,.33,1.1,"#deb899");
  tower.camera(0,-1,8.4,6.5,36.8,43.58);
  const dial=facade(-37,42,0,1);
  dial.box(0,34.15,-.9,.40,4,.35,"#a39186");
  g.pole(dial.at(-2.15,34.4,-.9),dial.at(2.15,35.7,-.9),.058,"#afaaa0",5);
  g.pole(dial.at(-1.95,35.8,-.9),dial.at(1.95,34.4,-.9),.058,"#afaaa0",5);
  const service=facade(-32,107,-1,0);
  for(const i of [-1,1])for(const k of [-1,1]) service.box(-5+i*.98,24.3,-5.0+k*.97,.15,2.8,.15,"#847f77");
  const tank=service.at(-5,25.7,-5);
  g.cyl(tank[0],26.35,tank[2],1.67,1.67,2.44,9,"#b3907a");
  for(const y of [25.52,26.95])g.cyl(tank[0],y,tank[2],1.70,1.70,.06,9,"#8c8980");
  g.cyl(tank[0],27.97,tank[2],.17,1.78,.80,9,"#a5a597");
  cameraBlock(tank[0],tank[2],3.5,3.5,23.1,28.4);
  // Mercado and Port Sol: store canopies, courtyard stalls, freight doors and gantry.
  building(-36,-117,38,22,7.3,S,"shop","#ebc396","#579f99","MERCADO");
  const market=facade(-36,-117,0,-1);
  for(let i=0;i<6;i++) awning(market,(i-2.5)*5.75,3.3,11.13,5.7,2.36,i%2?"#e4907c":"#eccc9e");
  market.camera(0,12.30,34.48,2.36,2.70,3.86);
  function citrusCart(u,flavor){
    const v=14.18;
    market.box(u,.68,v,3.05,.16,1.46,"#b28a67");
    for(const side of [-1,1]) market.box(u+side*1.12,.40,v,.15,.60,.98,"#997b62");
    for(let i=0;i<3;i++){
      const x=u+(i-1)*.92;
      market.box(x,.88,v,.83,.29,1.10,"#ad835f");
      market.face(x,.96,v+.56,.81,.097,"#d5b183");
      for(let j=0;j<4;j++){
        const p=market.at(x+((j%2)-.5)*.31,1.13,v+(Math.floor(j/2)-.5)*.34);
        g.cyl(p[0],p[1],p[2],.100,.135,.19,5,flavor[(i+j)%flavor.length]);
      }
    }
    market.box(u,.79,v+.70,.69,.34,.07,"#54756e");
    sign(market,"FRESH",u,.80,v+.746,.028,"#f5d7a2");
    const p=market.at(u,0,v);block(p[0],p[2],3.08,1.51,1.31);
  }
  citrusCart(-10.7,["#e4a254","#d38a50","#efb463"]);
  citrusCart(-6.85,["#a0ad68","#91a564","#b3b776"]);
  // Pennants are hand tied between the two outer awning brackets.
  for(let i=0;i<=14;i++){
    const u=-16.9+i*2.38,y=3.75-.53*Math.sin(i*Math.PI/14);
    if(i<14){
      const v=u+2.38,n=3.75-.53*Math.sin((i+1)*Math.PI/14);
      g.pole(market.at(u,y,13.62),market.at(v,n,13.62),.020,"#6a756e",3);
    }
    if(i%2===0) g.tri(market.at(u,y,13.65),market.at(u+.48,y-.035,13.65),
      market.at(u+.25,y-.60,13.65),["#e6ab7b","#d38477","#87ad98"][(i/2)%3]);
  }
  building(-28,-89,26,12,5.5,N,"house","#b7c4b0","#bd8d75");
  building(29,-111,21,15,6,S,"house","#e5bba1","#8faa9d");
  building(52,-108,18,15,5.3,E,"house","#aac7b5","#c48c78");
  building(-109,-44,36,28,9,S,"shed","#92aaa9","#648d94","PORT SOL");
  // The open tire bay shares its footprint with the service trigger and map.
  {
    const {x,z,halfWidth:w,halfDepth:d}=garage,shop=facade(x,z,0,1);
    const blue="#3d7779",cream="#ead7b6",red="#c8654c",rubber="#39434a";
    const wing=16-w;
    for(const side of [-1,1]){
      const u=side*(w+wing/2);
      shop.box(u,2.55,0,wing,5.1,d*2,cream);block(x-u,z,wing,d*2,5.2);
      shop.box(u,.65,d+.035,wing,1.10,.12,blue);
      shop.face(u,1.36,d+.11,wing,.15,red);
    }
    shop.box(0,2.51,-d+.18,2*w,5.02,.36,"#a2b1a2");
    block(x,z-d+.18,2*w,.36,5.02);
    shop.box(0,5.35,0,32.6,.58,d*2+.70,blue);
    shop.box(0,5.65,0,31.9,.13,d*2-.20,"#a5aaa0");
    shop.camera(0,0,32.6,d*2+.7,5.03,5.73);
    shop.box(0,4.75,d,2*w,.54,.45,"#b9c6b9");
    for(let h=4.56;h<5;h+=.14)shop.face(0,h,d+.24,2*w-.16,.045,"#778e88");
    shop.camera(0,d,2*w,.5,4.44,5.05);
    // Tall fascia is visible from the cross street, above both truck and coupe roofs.
    shop.box(0,6.00,d+.43,19.6,1.76,.35,cream);
    shop.face(0,6.00,d+.62,19.24,1.53,blue);
    for(const h of [5.36,6.64])shop.face(0,h,d+.64,18.98,.052,"#edb573");
    sign(shop,"PORTSIDE TIRE",0,6.00,d+.66,.255,"#fff0cf");
    shop.camera(0,d+.43,19.6,.36,5.12,6.88);
    // Office and roller shutter flank the working bay.
    shop.face(-10.65,2.57,d+.09,7.8,2.19,"#71999a");
    for(const u of [-14.58,-11.96,-9.34,-6.72])shop.face(u,2.57,d+.12,.12,2.23,cream);
    shop.face(-10.65,3.21,d+.13,7.88,.14,cream);
    sign(shop,"OFFICE",-10.65,2.55,d+.15,.15,"#ffe5a2");
    shop.face(10.68,2.13,d+.14,7.4,3.92,"#80938c");
    for(let h=.42;h<4;h+=.37)shop.face(10.68,h,d+.16,7.3,.053,"#bbbdab");
    shop.face(10.68,2.22,d+.18,7.3,.22,red);
    shop.face(10.68,3.10,d+.20,5.20,1.04,cream);
    shop.face(10.68,3.10,d+.22,5.04,.91,blue);
    sign(shop,"RESPRAYS",10.68,3.10,d+.24,.138,"#fff0cf");
    // A concrete apron, two lift runways and a painted stop bar lead into the shop.
    rect(x,z+2.3,2*w-.10,d*2+4.25,.114,"#b4b2a0");
    for(const side of [-1,1]){
      rect(x+side*3.48,z+.13,.13,11.4,.124,"#eee0b7");
      rect(x+side*.96,z-.06,.60,6.45,.126,"#648483");
      rect(x+side*.96,z+2.90,.62,.26,.133,"#d59a56");
      for(const at of [4.4,6.8,9.2])rect(x+side*3.48,z+at,.26,.78,.13,"#f2c775");
      shop.box(side*(w-.05),2.38,1.15,.11,.19,10.1,blue);
      shop.box(side*2.37,4.93,.62,.18,.065,6.6,"#fff3cd");
    }
    rect(x,z-3.52,6.98,.16,.129,"#f3cf83");
    const inside=-d+.38;
    shop.face(0,1.18,inside,2*w,1.03,blue);
    shop.face(0,1.82,inside+.01,2*w,.12,red);
    shop.face(0,3.32,inside+.04,4.4,1.13,"#436464");
    sign(shop,"TIRE BAY",0,3.33,inside+.055,.12,"#f6e3a9");
    shop.box(-3.60,.82,-d+.83,1.55,1.35,.86,red);block(x+3.60,z-d+.83,1.55,.86,1.52);
    for(const h of [.60,.88,1.16])shop.face(-3.60,h,-d+1.28,1.25,.07,"#e5c59f");
    for(const u of [2.6,3.65])for(let n=0;n<3;n++){
      const p=shop.at(u,.30+n*.29,-d+1.02);g.cyl(p[0],p[1],p[2],.50,.49,.27,10,rubber);
      g.cyl(p[0],p[1]+.143,p[2],.235,.235,.01,10,"#899183");
    }
    block(x-3.12,z-d+1.02,2.12,1.04,1.04);
    // Roadside tire blade and a signal over the driver's side of the entrance.
    shop.box(14.88,2.66,d+1.04,.23,5.02,.24,blue);
    const post=shop.at(14.88,0,d+1.04);block(post[0],post[2],.27,.28,5.17);
    disc(shop,14.88,4.78,d+1.21,1.33,1.33,rubber,18);
    disc(shop,14.88,4.78,d+1.23,.83,.83,"#eabc7b",14);
    disc(shop,14.88,4.78,d+1.25,.50,.50,blue,12);
    shop.box(3.70,4.28,d+.28,1.14,.49,.23,"#354746");
  }
  building(-111,-113,33,21,8.7,E,"shed","#d5baa1","#6c9596","PORT");
  building(-114,34,27,25,8,E,"shed","#a7b9a8","#7b9693");
  building(-108,99,17,16,5.3,W,"house","#dfb6a7","#87a69d");
  building(-92,120,23,15,5.9,N,"house","#b3c8ba","#bb9383");
  const port=facade(-109,-44,0,-1);
  for(const i of [-1,0,1]){
    const u=i*11.2;
    for(const side of [-1,1]){
      port.box(u+side*3.65,.68,15.2,.21,1.05,.23,"#d3ad71");
      port.face(u+side*3.65,.79,15.325,.20,.16,"#58696a");
    }
    port.face(u,5.24,14.095,2.62,.75,"#42686d");
    sign(port,"B 0"+(i+2),u,5.27,14.112,.090,"#e7d3a4");
  }
  for(const u of [-11,-1.8,7.5]){
    port.box(u,10.05,-2.35,6.52,1.62,6.97,"#9caaa4");
    g.quad(port.at(u-3.62,10.18,-6.2),port.at(u+3.62,10.18,-6.2),
      port.at(u+3.62,11.67,.65),port.at(u-3.62,11.67,.65),"#94a4a0");
    port.face(u,11.06,.67,6.40,.81,"#77999b");
  }
  port.camera(-1.5,-2.4,26.3,7.6,9.4,11.71);
  function container(x,z,length,alongX,hue,layer=0) {
    const w=alongX?length:3.5,d=alongX?3.5:length, y=1.56+3.02*layer;
    g.box(x,y,z,w,3,d,hue);
    const f=facade(x,z,alongX?0:1,alongX?1:0);
    for(let i=-length/2+1.1;i<length/2;i+=1.52) f.face(i,y,1.765,.12,2.6,"#8b9490");
    if(layer===0) block(x,z,w,d,3.08); else cameraBlock(x,z,w,d,y-1.5,y+1.5);
  }
  for(let i=0;i<3;i++){
    container(-128+i*5.4,-93,14,false,["#a96c70","#51888e","#bb965f"][i]);
    if(i<2) container(-128+i*5.4,-93,14,false,i?"#ac856b":"#8aa6a0",1);
  }
  container(-93,-87,13.4,true,"#78a5a0");
  container(-122,55,14.5,true,"#ba8d70");
  // The outside blocks continue the town to the map edge.
  const outskirts=[
    [-167,-110,16,24,7,E,"shed","#b6aaa0","#739a9b"],
    [-170,-39,29,21,9,E,"shed","#9aabb1","#bb9c83"],
    [-170,39,21,15,5.7,E,"house","#c4c4a4","#a18a7c"],
    [-168,111,26,18,8.6,E,"shop","#c9ab9b","#91aaa1"],
    [-111,-167,22,15,5.4,N,"house","#d0ada6","#80a69a"],
    [-34,-168,28,18,7.6,N,"shop","#bbbba7","#d79678"],
    [40,-170,21,17,5.3,N,"house","#aebfbb","#ca917c"],
    [113,-170,28,16,8.2,N,"deco","#dbb6a5","#9cbeb0"],
    [-113,167,24,16,5.7,S,"house","#b8c5aa","#bc8278"],
    [-37,169,25,18,10.2,S,"deco","#d2bdb0","#a0bdad"],
    [38,168,25,17,16.2,S,"glass","#b3bdb8","#d8bfa4"],
    [112,167,28,18,9.4,S,"deco","#e7bc9f","#a3c7b7"],
  ];
  for(const entry of outskirts) building(...entry);

  // Palm-lined promenade, street trees, beach parasols and towels.
  for(let z=-182;z<184;z+=15){
    palm(157.15,z,between(6.6,9.6),between(0,Math.PI*2));
    if(z%2===0) bench(165.35,z+3,false);
  }
  for(const x of [-134.4,-81.4,9.55,62.45,134.5]) {
    for(let z=-177;z<175;z+=26) {
      if(roads.some(q=>Math.abs(q-z)<13) || (x===134.5 && z<0 && z>-50)) continue;
      if(random()<.7) palm(x,z,between(4.8,8.6),between(0,Math.PI*2));
    }
  }
  for(let z=-165;z<175;z+=24) {
    if(z>74 && z<154) continue;
    const x=between(176,199), rad=between(1.75,2.25);
    umbrella(x,z,rad,pick(["#dc857a","#699fa0","#cfab58"]));
    rect(x+.9,z+1.42,.93,1.85,.076,pick(["#a1c4ad","#ca9292","#f5d7a3"]));
    if(z<60 && random()>.4) palm(x-3,z+7,between(5,7),between(0,6.28));
  }
  for(const t of [[8.7,-33],[8.7,28],[8.7,109],[134.8,88],[-61.6,-113],[-63,38],[-134.5,-106]]) lamp(t[0],t[1],-1,0);
  for(const t of [[18.4,63],[-54,-133.5],[133.6,30],[10,119]]) bench(t[0],t[1],true);

  // A recognisable striped lifeguard lookout.
  const guard=facade(183,-26,-1,0);
  for(const u of [-2.1,2.1]) for(const v of [-1.9,1.9]) guard.box(u,1.35,v,.25,2.7,.25,"#ac806e");
  guard.box(0,2.58,0,6.25,.38,5.3,"#ddad89");
  guard.box(0,3.82,-.24,4.65,2.25,3.35,"#8abcb1");
  guard.face(0,4.02,1.45,4.04,.95,deepGlass);
  guard.box(0,5.12,-.24,5.55,.38,4.3,"#e3867e");
  guard.face(0,3.14,1.46,4.1,.36,"#fae0b4");
  for(const u of [-2.66,0,2.66]) guard.box(u,3.25,2.46,.11,1.07,.11,"#e1aa89");
  guard.box(0,3.72,2.45,5.45,.12,.13,"#e1aa89");
  for(let i=0;i<5;i++) guard.box(-1.85,.29+i*.46,4.8-i*.5,1.46,.18,.52,"#bc8b73");
  block(183,-26,5.15,6.2,5.32);
  guard.camera(-1.85,3.83,1.52,2.65,.18,2.46);

  // The observation wheel rises above the north boardwalk.
  const wx=181.5,wz=112.5,wy=13.55,radius=10.15,n=16;
  rect(wx,wz,12.4,25,.115,"#cfad96");
  for(const side of [-1,1]){
    const xx=wx+side*2.15;
    for(const dir of [-1,1]) g.pole([xx+side*1.75,.2,wz+dir*6.6],[xx,wy,wz],.32,"#7caaa4",5);
    for(let i=0;i<n;i++) {
      const a=2*Math.PI*i/n, b=2*Math.PI*(i+1)/n;
      const p=[xx,wy+radius*Math.sin(a),wz+radius*Math.cos(a)];
      const q=[xx,wy+radius*Math.sin(b),wz+radius*Math.cos(b)];
      g.pole(p,q,.17,"#e59588",4);
      if(i%2===0) {
        g.pole([xx,wy,wz],p,.08,"#efd2ad",4);
        if(side===1) {
          g.box(wx,p[1]-.75,p[2],3.9,1.08,1.48,i%4?"#e0b878":"#cd8a88");
          g.box(wx,p[1]-.19,p[2],3.85,.12,1.55,"#f2d2a5");
        }
      }
    }
  }
  g.pole([wx-2.65,wy,wz],[wx+2.65,wy,wz],.56,"#d5a486",6);
  block(wx,wz,6.1,15.2,13.68);
  cameraBlock(wx,wz,4.75,21.0,3.03,23.97);
  building(174,133,9,6,3.8,W,"shop","#b3c9b6","#dfa387","PIER");

  // Timber fishing pier, watercraft and a western harbour crane.
  for(const [x,z,name] of [[186,-123.7,"MARLIN PIER"],[201,96.3,"NORTH FLOAT"]]){
    const land=facade(x,z,-1,0),sea=facade(x,z,1,0);
    for(const u of [-1.48,1.48]){land.box(u,.99,0,.15,1.98,.15,"#8c725a");block(x,z-u,.15,.15,1.98);}
    land.box(0,1.81,0,3.8,.81,.15,"#274d4c");land.face(0,2.13,.08,3.72,.055,"#e0ae61");
    sign(land,"OUTBOARD CLUB",0,1.8,.081,.069,"#f9dfae");sign(sea,name,0,1.81,.081,.077,"#f9dfae");
  }
  rect(215,-119,61,4.5,.37,"#bb9078");
  rect(241,-119,7.5,13,.371,"#c2977e");
  for(let x=186;x<=244;x+=6.9) for(const s of [-1,1]) g.box(x,.37,-119+s*2.1,.32,2.0,.32,"#a07767");
  for(const s of [-1,1]) g.box(213.7,1.26,-119+s*2.14,55,.11,.14,"#b38d72");
  function sail(x,z,scale,angle) {
    const ca=Math.cos(angle),sa=Math.sin(angle);
    const p=(u,y,v)=>[x+scale*(u*ca+v*sa),scale*y,z+scale*(-u*sa+v*ca)];
    g.quad(p(-.9,.36,-2),p(.9,.36,-2),p(.6,.36,1.55),p(-.6,.36,1.55),"#e3c9a8");
    g.tri(p(-.6,.36,1.55),p(.6,.36,1.55),p(0,.46,3.15),"#e5c9a6");
    g.tri(p(0,4.65,.15),p(0,.68,.15),p(.08,.68,-1.93),"#f5d5ba");
    g.tri(p(0,4.12,.35),p(0,.68,.4),p(.06,.68,2.05),"#dc9f8e");
  }
  for(const b of [[239,28,1.3,.7],[272,-59,1.5,1.1],[252,147,1.4,-.52],[288,212,1.8,.4]]) sail(...b);
  const craneX=-181,craneZ=-96;
  for(const dx of [-2.1,2.1]) for(const dz of [-2,2]) {
    g.pole([craneX+dx,0,craneZ+dz],[craneX+dx*.39,18.4,craneZ+dz*.39],.29,"#cba074",5);
  }
  g.box(craneX+1.1,17.2,craneZ,3.25,2.65,2.9,"#e3ad79");
  g.box(craneX+2.73,17.55,craneZ,.05,1.11,1.82,deepGlass);
  g.pole([craneX,17.4,craneZ],[craneX-9,26.4,craneZ+3],.38,"#ddb181",5);
  g.pole([craneX+3.6,16.8,craneZ],[craneX-9,26.4,craneZ+3],.12,"#ae927b",4);
  g.pole([craneX-9,26.4,craneZ+3],[craneX-9,18.3,craneZ+3],.055,"#6b7980",4);
  block(craneX,craneZ,3.9,3.8,18.51);
  cameraBlock(craneX-4.6,craneZ+1.56,10.1,3.65,17.15,26.84);
  function powerPoles(points){
    for(let i=0;i<points.length;i++){
      const [x,z]=points[i],h=7.7+i%2*.35;
      g.pole([x,.14,z],[x,h,z],.135,"#977c65",6);
      g.box(x,h-.34,z,2.20,.16,.17,"#997f68");
      for(const dx of [-.82,.82]) g.cyl(x+dx,h-.13,z,.11,.10,.29,5,"#9cafa4");
      if(i%3===0){
        g.cyl(x+.47,h-1.58,z,.34,.30,.95,7,"#91a49d");
        g.cyl(x+.47,h-1.04,z,.37,.36,.13,7,"#a8b7a9");
      }
      cameraBlock(x,z,.32,.32,0,h);
      if(i===0) continue;
      const [px,pz]=points[i-1],ph=7.7+(i-1)%2*.35;
      for(const dx of [-.82,.82]){
        let start=[px+dx,ph+.03,pz];
        for(let j=1;j<=4;j++){
          const a=j/4;
          const end=[px+(x-px)*a+dx,ph+(h-ph)*a+.03-.79*Math.sin(a*Math.PI),pz+(z-pz)*a];
          g.pole(start,end,.033,"#586d70",4);start=end;
        }
      }
    }
  }
  powerPoles([[-135.8,-167],[-135.8,-116],[-135.8,-85],[-135.8,-51],[-135.8,-13]]);
  powerPoles([[95,-171],[95,-132],[95,-84],[95,-56],[96,-10]]);
  // Loading office pallet stacks and numbered seal marks are concentrated at the bays.
  for(const [x,z,levels] of [[-124.4,-62.0,2],[-120.6,-61.4,3],[-93.4,-61.2,2]]){
    for(let k=0;k<levels;k++){
      const y=.18+k*.32;
      g.box(x,y,z,2.66,.13,1.75,"#ad8e71");
      for(let j=0;j<3;j++)g.box(x+(j-1)*.80,y+.12,z,.53,.105,1.87,k%2?"#bc9875":"#caab84");
    }
    block(x,z,2.70,1.89,.37+(levels-1)*.32);
  }

  // Distant mainland silhouettes give the streets a horizon without filling the bay.
  for(let i=0;i<23;i++){
    const x=-227-between(4,49), z=-228+i*21+between(-8,8);
    const h=between(9,32);
    g.box(x,h/2-.2,z,between(12,25),h,between(10,22),pick(["#87969b","#969ca0","#aaa49f"]));
  }
  for(let i=0;i<14;i++){
    const x=between(-202,129),z=(i%2?1:-1)*between(233,267),h=between(8,27);
    g.box(z>228&&x>52?x-190:x,h/2,z,between(12,23),h,between(11,21),pick(["#aba8a0","#a8a29f","#92a0a1"]));
  }
  return {solids,cameraObstacles,garage};
};
