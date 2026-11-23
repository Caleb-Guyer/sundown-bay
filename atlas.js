/* The city map, dashboard radar and overhead renderer use the same street geometry. */
(() => {
  "use strict";
  const roads = [-144,-72,0,72,144];
  const extent = {left:-238,right:286,bottom:-229,top:229};
  const staticLayers = new WeakMap();
  const empty = [];
  const ink = "#19363c";
  const mint = "#aeffda";
  const orange = "#ffbd87";
  const coastX = z => 213 + Math.sin(z/26*.82)*1.65 + Math.cos(z/26*1.91)*.8;
  const palette = {
    chart: {land:"#759085",lot:"#7e9789",sidewalk:"#acbb9e",sand:"#c5b68c",wet:"#a6b297",
      surf:"#8db9a6",ocean:"#477f82",deep:"#558f8d",road:"#364e51",lane:"#b5aa85",board:"#a29479"},
    street: {land:"#adad8b",lot:"#b6b397",sidewalk:"#d5c2a7",sand:"#e5c599",wet:"#d7bfa2",
      surf:"#9acedc",ocean:"#3d909a",deep:"#61aaa7",road:"#49535b",lane:"#dbba7e",board:"#be977d"},
  };

  function path(ctx, points, color, edge, width=1) {
    ctx.beginPath();
    ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++) ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath();
    if(color){ctx.fillStyle=color;ctx.fill();}
    if(edge){ctx.strokeStyle=edge;ctx.lineWidth=width;ctx.stroke();}
  }
  function disc(ctx,x,y,r,color) {
    ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fillStyle=color; ctx.fill();
  }
  function rect(ctx,x,y,w,h,color) {
    ctx.fillStyle=color;ctx.fillRect(x,y,w,h);
  }
  function line(ctx,x1,y1,x2,y2,color,width) {
    ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);
    ctx.lineWidth=width;ctx.strokeStyle=color;ctx.stroke();
  }
  function coastline(ctx,offset,outer,color) {
    const pts=[];
    for(let z=extent.bottom-12;z<=extent.top+12;z+=4) pts.push([coastX(z)+offset,z]);
    pts.push([outer,extent.top+12],[outer,extent.bottom-12]);
    path(ctx,pts,color);
  }
  function palm(ctx,x,z,angle,street) {
    ctx.save();ctx.translate(x,z);ctx.rotate(angle);
    if(street) {
      path(ctx,[[-.35,0],[.35,0],[1.5,2.65],[1.14,2.8]],"#736e5e");
      for(let j=0;j<6;j++) {
        ctx.rotate(Math.PI/3);
        const length=2.7+(j%2)*.55;
        path(ctx,[[0,0],[.53,.75],[.29,1.72],[0,length],[-.23,.99]],j%2?"#537967":"#6d9475");
      }
    } else {
      disc(ctx,0,0,1.25,"#6a8b77");
    }
    ctx.restore();
  }

  function roadMaterial(c) {
    // Longitudinal wear, utility covers and drains repeat once per block, below the road paint.
    for(let i=0;i<roads.length;i++) for(let j=0;j<6;j++) for(let axis=0;axis<2;axis++) {
      const a=-180+72*j;
      if(axis && a>144) continue;
      c.save();c.translate(axis?a:roads[i],axis?roads[i]:a);if(axis)c.rotate(Math.PI/2);
      const side=(i+j)%2?1:-1;
      rect(c,side*2.1-.32,-22,.64,45,"#4c565d");
      rect(c,-side*2.1-.38,-20,.76,41,"#4e575c");
      if((i+2*j+axis)%3===0) {
        path(c,[[3.3,-6.1],[5.2,-6.3],[5.4,-3.1],[3.4,-2.7]],"#434e55");
        disc(c,-2.2,6,.58,"#64706d");disc(c,-2.2,6,.46,"#535e60");
        for(const y of [5.83,6,6.17]) line(c,-2.46,y,-1.94,y,"#6c7470",.065);
      }
      rect(c,side*6.57-.21,14,.42,1.45,"#313f45");
      for(const y of [14.28,14.63,14.99]) line(c,side*6.57-.19,y,side*6.57+.19,y,"#84908b",.085);
      c.restore();
    }
    for(let z=-212;z<216;z+=4.4) {
      line(c,151.35,z,159.39,z,"#bbab95",.115);
      if(roads.every(r=>Math.abs(r-z)>10)) line(c,133.8,z,136.83,z,"#afa792",.10);
    }
  }

  function paintLand(ctx,street) {
    const p=street?palette.street:palette.chart;
    rect(ctx,extent.left,extent.bottom,extent.right-extent.left,extent.top-extent.bottom,p.land);
    rect(ctx,158,extent.bottom,extent.right-158,extent.top-extent.bottom,p.sand);
    coastline(ctx,-3.5,extent.right,p.wet);
    coastline(ctx,0,extent.right,p.surf);
    coastline(ctx,3.4,extent.right,p.deep);
    coastline(ctx,15,extent.right,p.ocean);
    for(let x=219;x<extent.right+10;x+=12) {
      for(let z=extent.bottom+4;z<extent.top;z+=19) {
        const phase=Math.sin(x*.73+z*.18), bx=x+phase*3,bz=z+phase*4;
        line(ctx,bx,bz,bx+.8,bz+2.2+phase,street?"#86b9b6":"#5c9692",.22);
      }
    }
    const edges=[-225,-144,-72,0,72,144];
    const zs=[...edges,225];
    for(let i=0;i<edges.length-1;i++) for(let j=0;j<zs.length-1;j++) {
      const x=edges[i]+7,z=zs[j]+7,w=edges[i+1]-7-x,h=zs[j+1]-7-z;
      rect(ctx,x,z,w,h,p.sidewalk);
      rect(ctx,x+2.6,z+2.6,w-5.2,h-5.2,(i+2*j)%3 ? p.lot : p.land);
    }
    rect(ctx,151,-229,8.6,458,p.sidewalk);
    rect(ctx,159.6,-229,6.5,458,p.board);
    for(let z=-223;z<=224;z+=street?2:6) line(ctx,159.8,z,165.95,z,street?"#a98573":"#938875",.14);
    for(const r of roads) {
      rect(ctx,r-7,-229,14,458,p.road);
      rect(ctx,-229,r-7,380,14,p.road);
      rect(ctx,151,r-2.2,8.7,4.4,p.sidewalk);
    }
    if(street) roadMaterial(ctx);
    const clear = n => roads.every(t=>Math.abs(t-n)>11.5);
    for(const r of roads) {
      for(let k=-221;k<225;k+=9) {
        if(!clear(k)) continue;
        line(ctx,r,k-1.7,r,k+1.7,p.lane,street?.24:.32);
        if(k<145) line(ctx,k-1.7,r,k+1.7,r,p.lane,street?.24:.32);
        if(street && r>=0) {
          for(const side of [-3.5,3.5]) {
            line(ctx,r+side,k-1.2,r+side,k+1.2,"#98a39f",.13);
            if(k<141) line(ctx,k-1.2,r+side,k+1.2,r+side,"#98a39f",.13);
          }
        }
      }
    }
    for(const x of roads) for(const z of roads) {
      if(x!==0 && x!==144 && z!==-72) continue;
      if(x===144 && z===-144) continue;
      for(const side of [-1,1]) for(let j=-2;j<=2;j++) {
        const c=street?"#c9c7b5":"#809187";
        rect(ctx,x+j*2.25-.44,z+8.3*side-.8,.88,1.6,c);
        if(x!==144) rect(ctx,x+8.3*side-.8,z+j*2.25-.44,1.6,.88,c);
      }
    }
    rect(ctx,86.6,-45.4,8.8,24.8,"#dec9a8");
    rect(ctx,87.6,-44.4,6.8,22.8,street?"#64a9ae":"#6a9b98");
    rect(ctx,184,-121.25,61,4.5,street?"#b98d73":"#a69d83");
    rect(ctx,237,-125.5,8,13,street?"#c79e7c":"#a69d83");
    if(street) {
      for(let x=186;x<=244;x+=2.1) line(ctx,x,-121.15,x,-116.85,"#a48068",.14);
      for(let z=-165;z<175;z+=24) {
        if(z>74 && z<154) continue;
        const x=185+Math.sin(z*.69)*8;
        for(let j=0;j<8;j++) {
          const a=j*Math.PI/4,b=a+Math.PI/4;
          path(ctx,[[x,z],[x+1.9*Math.cos(a),z+1.9*Math.sin(a)],[x+1.9*Math.cos(b),z+1.9*Math.sin(b)]],
            j%2?"#f9dfbd":(z%3?"#cf817b":"#75a6a1"));
        }
        rect(ctx,x+1.3,z+.7,.85,1.8,"#e8cba3");
      }
    }
    for(let z=-182;z<184;z+=15) palm(ctx,157.15,z,.6+z*.43,street);
    if(street) for(const x of [-134.4,-81.4,9.55,62.45,134.5]) for(let z=-177;z<175;z+=26) {
      if(!clear(z) || x===134.5 && z<0 && z>-50 || Math.sin(x*.7+z*.29)<-.36) continue;
      palm(ctx,x,z,.8+Math.sin(x+z)*2,true);
    }
  }

  function paintBuildings(ctx,solids,street) {
    const roofs = ["#d4ae99","#99b6ac","#d7c5a5","#b5a6a0","#a6b3ae","#c6b298"];
    for(let i=0;i<solids.length;i++) {
      const s=solids[i], x=s.x-s.w/2,z=s.z-s.d/2;
      if(s.streetProp)continue;
      if(street) {
        const roof=roofs[(i*7+Math.abs(Math.round(s.x)))%roofs.length];
        rect(ctx,x+1.1,z-1.4,s.w,s.d,"#84877c");
        rect(ctx,x,z,s.w,s.d,"#817f74");
        rect(ctx,x+.35,z+.42,s.w-.7,s.d-.84,roof);
        if(s.w>10 && s.d>9) {
          const w=Math.min(s.w*.26,6), d=Math.min(s.d*.18,3);
          rect(ctx,x+.9,z+s.d-1.1,s.w-1.8,.35,"#e4cdb3");
          rect(ctx,x+1,z+.8,.35,s.d-2,"#e0c5aa");
          rect(ctx,x+s.w*.28,z+s.d*.6,w,d,"#8b948b");
          rect(ctx,x+s.w*.28+.1,z+s.d*.6+.3,w-.36,d-.42,"#acb5a7");
          for(let gx=.55;gx<w-.5;gx+=.65) line(ctx,x+s.w*.28+gx,z+s.d*.6+.4,x+s.w*.28+gx,z+s.d*.6+d-.3,"#7e928b",.12);
        }
      } else {
        rect(ctx,x+.45,z-.55,s.w,s.d,"#607a72");
        rect(ctx,x,z,s.w,s.d,i%4 ? "#879d8c" : "#93a390");
        if(s.w>10&&s.d>9) rect(ctx,x+.6,z+s.d-1.1,s.w-1.2,.5,"#adbaa0");
      }
    }
  }

  function oceanFrontages(c) {
    // Motel breezeway traces the east facade. Loungers sit outside its pool coping.
    rect(c,129.2,-50.8,2.29,37.6,"#94b8a6");rect(c,131.21,-50.8,.28,37.6,"#e8d9b6");
    for(let z=-47;z<=-15;z+=6.16) {rect(c,129.48,z,1.68,.12,"#7ba79e");rect(c,131.14,z,.25,.30,"#c5ceb3");}
    for(const x of [88.1,94.2])for(const z of [-44.6,-23.8]){
      rect(c,x-.36,z-.83,.72,1.66,"#b2927c");rect(c,x-.29,z-.63,.59,1.31,"#e5b098");
      rect(c,x-.28,z-.52,.57,.26,"#f5d9bc");
    }
    line(c,88.8,-30,90.6,-30.2,"#a6cfbc",.18);line(c,91.3,-34.3,93.4,-34.7,"#a6cfbc",.18);
    // Roadside sign cap and shadow on the Marlin forecourt.
    path(c,[[128.8,-11.6],[136.1,-11.6],[134.4,-14.3],[127,-14.4]],"#a39e84");
    rect(c,128.75,-11.48,7.53,.64,"#d98f78");rect(c,128.94,-11.22,7.17,.14,"#fae1ad");
    // Striped diner canopies, patio tables and the pair of newspaper machines.
    for(const z of [18.4,41.3]) {
      rect(c,129.35,z-5.55,2.14,11.1,"#9b9c85");
      for(let j=0;j<12;j++)rect(c,129.36,z-5.55+j*.925,1.89,.944,j%2?"#edd0ad":"#d78b78");
    }
    for(const [x,z,tone] of [[133.1,19.1,"#d98477"],[133.05,39.4,"#76a79b"]]) {
      disc(c,x+.36,z-.36,1.52,"#9a9c83");
      for(let j=0;j<8;j++) {
        const a=j*Math.PI/4,b=a+Math.PI/4;
        path(c,[[x,z],[x+1.56*Math.cos(a),z+1.56*Math.sin(a)],[x+1.56*Math.cos(b),z+1.56*Math.sin(b)]],j%2?tone:"#e9cca8");
      }
      disc(c,x,z,.124,"#c5ac87");
    }
    for(const [z,color] of [[49.05,"#a7786c"],[49.99,"#739b92"]]) {
      rect(c,134.10,z-.42,.80,.85,color);rect(c,134.18,z+.15,.62,.13,"#d9c6aa");
    }
  }

  function paintStatic(c,solids,street) {
    paintLand(c,street);paintBuildings(c,solids,street);if(street)oceanFrontages(c);
  }

  function staticImage(solids,street) {
    let group=staticLayers.get(solids);
    if(!group || group.count!==solids.length) {
      group={count:solids.length};
      staticLayers.set(solids,group);
    }
    const key=street?"street":"chart";
    if(group[key]) return group[key];
    const density=street?3.5:1.8;
    const w=Math.ceil((extent.right-extent.left)*density), h=Math.ceil((extent.top-extent.bottom)*density);
    let surface;
    if(typeof OffscreenCanvas!=="undefined") surface=new OffscreenCanvas(w,h);
    else if(typeof document!=="undefined") {surface=document.createElement("canvas");surface.width=w;surface.height=h;}
    if(!surface) return null;
    const c=surface.getContext("2d");
    if(!c) return null;
    c.setTransform(w/(extent.right-extent.left),0,0,-h/(extent.top-extent.bottom),
      -extent.left*w/(extent.right-extent.left),extent.top*h/(extent.top-extent.bottom));
    paintStatic(c,solids,street);
    group[key]=surface;return surface;
  }

  function carSprite(c,car,x,y,scale,t) {
    if(car.kind==="wrecker")return BayWreckerArt.mapTruck(c,car,x,y,scale,t,car.towRig);
    const van=car.kind==="van", cab=car.kind==="cab", police=car.kind==="cruiser";
    const body=car.color || (cab?"#edb550":police?"#4c5c67":"#e98c74");
    const l=van?2.32:car.kind==="hatch"?1.82:2.16, b=van?.97:.91;
    const damaged=car.damage&&BayBodyworkArt.plan(car,l,b);
    c.save();c.translate(x,y);c.rotate(car.yaw || 0);c.scale(scale,scale);
    if(damaged)BayBodyworkArt.mapShadow(c,damaged);
    else path(c,[[-b+.07,-l+.03],[b-.09,-l+.03],[b+.29,-l+.37],[b+.29,l+.12],[b-.01,l+.37],[-b+.02,l+.26],[-b-.1,l]],"#62645b");
    for(const side of [-1,1])for(const axle of [-l*.64,l*.64]){
      c.save();c.translate(side*b,axle);if(axle<0&&car.steer)c.rotate(car.steer);
      rect(c,-.105,-.36,.21,.72,"#293539");c.restore();
    }
    if(damaged)BayBodyworkArt.mapBody(c,damaged,body);
    else{
      path(c,[[-b+.21,-l],[b-.21,-l],[b,-l+.28],[b,l-.24],[b-.19,l],[-b+.19,l],[-b,l-.24],[-b,-l+.28]],
        body,"#435054",.065);
      rect(c,-b+.16,-l+.083,.36,.12,"#ffe9b7");rect(c,b-.53,-l+.083,.36,.12,"#ffe9b7");
    }
    const windshield=van?-1.59:-1.10;
    path(c,[[-b+.14,windshield],[b-.14,windshield],[b-.24,windshield+.51],[-b+.24,windshield+.51]],"#345867");
    line(c,-b+.21,windshield+.09,b-.21,windshield+.09,"#96bdb7",.055);
    if(van) {
      rect(c,-b+.16,-.98,2*b-.32,2.93,body);
      for(const k of [-.5,.01,.52]) line(c,k,-.76,k,1.71,"#bdd0ba",.045);
    } else {
      const roof=police?"#e9e3c9":body;
      path(c,[[-b+.24,-.59],[b-.24,-.59],[b-.22,.69],[-b+.22,.69]],roof);
      path(c,[[-b+.22,.72],[b-.22,.72],[b-.12,1.32],[-b+.12,1.32]],"#385561");
      if(cab) {rect(c,-.31,-.07,.62,.29,"#34474c");rect(c,-.24,-.035,.48,.20,"#ffe3a0");}
      if(police) {
        rect(c,-.52,-.16,1.04,.29,"#414e55");
        rect(c,-.46,-.12,.40,.22,t%1<.5?"#ff6d78":"#ad5561");
        rect(c,.06,-.12,.40,.22,t%1<.5?"#7299b1":"#a3e5ff");
      }
    }
    const lit=car.brakes>.18||car.handbrake>.48;
    if(damaged)BayBodyworkArt.mapTrim(c,damaged,car,t);
    else for(const side of [-1,1]){
      rect(c,side*(b-.325)-.185,l-.15,.37,.12,lit?"#ff5344":"#a7464b");
      if(car.reversing)rect(c,side*(b-.56)-.055,l-.15,.11,.11,"#fff5c9");
    }
    for(const side of [-1,1]){
      const open=Math.max(side===car.doorSide?car.doorAngle||0:0,side===1?car.passengerDoor||0:0);
      if(open<=.015)continue;
      const s=bayCarLayout(car.kind),span=s.hingeZ-s.back;
      rect(c,side*s.hingeX-(side>0?.19:0),-s.hingeZ,.19,span,"#34464b");
      c.save();c.translate(side*s.hingeX,-s.hingeZ);c.rotate(-side*open);
      const dent=damaged&&(side<0?damaged.damage.left:damaged.damage.right);
      if(dent>=.20){
        const kink=-side*dent*.12;
        path(c,[[-.055,0],[.055,0],[.067+kink,span*.49],[.085,span-.04],[-.065,span],[-.061+kink,span*.52]],body,"#334f51",.055);
        line(c,0,.13,kink,span*.51,"#c3bca6",.036);line(c,kink,span*.51,0,span-.10,"#d4d2ae",.042);
        line(c,kink-.027,span*.50,kink*.52-.024,span*.67,"#6c7068",.036);
      }else{
        path(c,[[-.055,0],[.055,0],[.085,span-.04],[-.065,span]],body,"#334f51",.055);
        line(c,0,.13,0,span-.10,"#d4d2ae",.042);
      }
      c.restore();
    }
    const pulse=BayStreetReactions.hornPulse(car,t);
    if(pulse>0){
      c.globalAlpha*=pulse;c.lineCap="round";
      for(const r of [.86,1.38]){
        c.beginPath();c.arc(0,-l+.06,r+pulse*.22,-2.28,-.86);
        c.strokeStyle="#705e50";c.lineWidth=.22;c.stroke();
        c.strokeStyle="#ffdf91";c.lineWidth=.115;c.stroke();
      }
    }
    c.restore();
  }
  window.drawBayPaintSample=function(canvas,kind,color){
    const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
    c.clearRect(0,0,w,h);
    carSprite(c,{kind,color,yaw:Math.PI*.46},w*.50,h*.50,Math.min(w/5.25,h/2.90),0);
  };
  function personSprite(c,p,x,y,s,hero,bearing=0,ghost=false) {
    c.save();c.translate(x,y);
    const recoil=p.startle,lift=hero?p.motion.lift:recoil?.lift||0;
    if(ghost)c.globalAlpha*=.55;
    else{
      c.save();c.rotate(p.yaw||0);c.scale(s,s);c.globalAlpha*=1-lift*.40;
      c.fillStyle="#777c70";c.beginPath();c.ellipse(.12,.17,.36-lift*.07,.35-lift*.07,.45,0,Math.PI*2);c.fill();c.restore();
    }
    c.translate(Math.sin(bearing)*lift*s*.83,-Math.cos(bearing)*lift*s*.83);
    c.rotate(p.yaw||0);c.scale(s,s);
    if(hero&&p.motion){
      const m=p.motion,swing=Math.cos(m.phase*Math.PI*2)*m.weight;
      for(let i=0;i<2;i++){
        const side=i?1:-1,foot=m.feet[i],step=foot.z;
        line(c,side*.12,.04,side*.13,-step,"#455d70",.13);
        rect(c,side*.13-.061,-step-.12,.122,.23,"#d7c4a2");
        rect(c,side*.13-.054,-step-.08,.108,.14,"#6a8b8d");
        let ax=side*(.246+.03*m.run+.12*m.airPose+.19*m.stumblePose),az=-side*swing*(.20+.22*m.run)+side*m.lead*.22*m.airPose;
        if(m.ride){
          const r=m.ride,w=side===r.side?r.pull:r.reach;
          ax=ax*(1-w)+Math.max(-.46,Math.min(.46,r.handle[0]))*w;
          az=az*(1-w)-Math.max(-.41,Math.min(.41,r.handle[2]))*w;
        }
        line(c,side*.206,0,ax,az,p.kit&&p.kit!=="street"?"#b68160":"#357d75",.11);disc(c,ax,az,.061,"#b68160");
      }
      c.save();c.rotate(-.13*swing);
      c.fillStyle=ghost?"#a5ffec":window.BayCourtPlayers?.kitColors[p.kit]||"#398e86";c.beginPath();c.ellipse(0,0,.26,.145+.04*m.crouch,0,0,Math.PI*2);c.fill();
      if(!ghost&&p.kit&&p.kit!=="street")for(const side of [-1,1])line(c,side*.19,-.071,side*.17,.08,"#eedaa1",.027);
      line(c,-.09,.080,.045,.093,"#b0b9a0",.036);c.restore();
      disc(c,0,-.064-.032*m.run,.102,"#b68160");disc(c,0,-.049-.032*m.run,.093,"#37343c");
      c.restore();return;
    }
    const guard=recoil?.guard||0,air=recoil?.air||0,lead=recoil?.lead||1;
    for(const side of [-1,1]){
      rect(c,side*.14-.065,.04+air*side*lead*.17,.13,.35,"#374650");
      if(guard>.015){
        const handX=side*(.26+.24*guard),handY=-.06-(side===lead?.40:.22)*guard;
        line(c,side*.21,.01,handX,handY,p.shirt,.13);disc(c,handX,handY,.085,p.skin||"#c58b68");
      }
    }
    c.fillStyle=p.shirt || (hero?"#41a797":"#cb8a78");c.beginPath();c.ellipse(0,.015,.355,.19,0,0,Math.PI*2);c.fill();
    disc(c,0,-.074,.154,p.skin||"#c58b68");disc(c,0,-.041,.127,"#53443e");
    c.restore();
  }
  function streetActor(c,a,x,y,s,t) {
    c.save();c.translate(x,y);c.rotate(a.yaw||0);
    const k=(a.type==="cyclist"||a.type==="gull")?Math.max(2.8,s*1.24):s;
    c.scale(k,k);
    if(a.type==="cyclist") {
      const kick=Math.sin(t*5.34)*.2;
      rect(c,.10,-.86,.18,1.75,"#797d69");
      for(const y of [-.58,.59]){rect(c,-.087,y-.33,.174,.66,"#38484a");rect(c,-.027,y-.26,.054,.52,"#a9b8a7");}
      line(c,0,-.49,0,.55,"#65b9aa",.117);line(c,-.28,-.40,.28,-.40,"#566b69",.102);
      rect(c,-.20,-.66,.40,.26,"#d9b888");
      line(c,-.135,.07,-.151,.27+kick,"#4e6768",.12);line(c,.135,.07,.151,.27-kick,"#4e6768",.12);
      path(c,[[-.25,.08],[-.21,-.24],[.21,-.24],[.25,.08],[.13,.29],[-.13,.29]],a.color||"#dc8676");
      disc(c,0,-.22,.168,"#6f715c");disc(c,0,-.23,.137,"#f1cb70");
    } else if(a.type==="juice-cart") {
      rect(c,-.75,-.40,1.73,1.02,"#93937a");
      rect(c,-.93,-.47,1.86,.94,a.color||"#76b6a6");
      for(let i=0;i<7;i++) rect(c,-.90+i*.257,-.45,.261,.878,i%2?"#f7d9ab":"#d98470");
      line(c,-.89,0,.90,0,"#f0bf94",.051);
    } else if(a.type==="vendor") {
      disc(c,.12,.11,.29,"#94947b");rect(c,-.26,-.12,.52,.32,"#e9c9a1");
      rect(c,-.15,-.139,.30,.092,"#70a897");disc(c,.235,-.20,.085,"#edbd80");
      disc(c,0,-.065,.158,"#b88b6c");disc(c,0,-.079,.119,"#e9c198");
    } else if(a.type==="skiff") {
      const foam=Math.sin(t*2.1)*.16;
      for(const side of [-1,1]) {
        path(c,[[side*.58,2.7],[side*.91,2.81],[side*(1.48+foam),5.86],[side*2.06,8.18],[side*1.47,6.38]],"#b6d5c3");
        line(c,side*1.62,6.32,side*2.18,8.6,"#8cbfb5",.14);
      }
      path(c,[[0,-3.42],[.7,-2.4],[1.14,-.9],[1.13,1.99],[.75,3.07],[-.75,3.07],[-1.13,1.99],[-1.14,-.9],[-.7,-2.4]],
        "#f5d9b4","#a57566",.14);
      path(c,[[0,-2.85],[.6,-2.13],[.86,-.77],[.82,2.32],[-.82,2.32],[-.86,-.77],[-.6,-2.13]],"#cfaf86");
      rect(c,-.78,-.78,1.56,2.56,"#70ad9f");rect(c,-.08,-.73,.16,2.44,"#99c6ac");
      rect(c,-.72,1.65,1.44,.17,"#46877f");rect(c,-.24,2.8,.48,.42,"#516d70");
    } else if(a.type==="gull") {
      const wing=.93+.14*Math.sin(t*6.7+a.x*.1);
      for(const side of [-1,1]) {
        path(c,[[0,-.16],[side*wing*.52,-.11],[side*wing*.83,.03],[side*wing,.28],[side*wing*.54,.11],[0,.13]],
          "#eee6d0","#8c9890",.035);
        path(c,[[side*wing*.80,.045],[side*wing,.28],[side*wing*.74,.15]],"#59676a");
      }
      path(c,[[0,-.41],[.114,-.064],[.071,.24],[-.08,.34],[-.105,-.03]],"#f5edde");
    }
    c.restore();
  }

  function intersectionLights(c,x,y,s,nsGreen) {
    c.save();c.translate(x,y);c.scale(s,s);
    const mx=8,my=-8;
    line(c,mx,my,2.45,my,"#657873",.22);line(c,mx,my,mx,-2.45,"#657873",.22);
    disc(c,mx,my,.267,"#aaa991");
    const head=(hx,hy,angle,green)=>{
      c.save();c.translate(hx,hy);c.rotate(angle);
      rect(c,-.44,-.68,.88,1.36,"#3b4b4b");
      rect(c,-.44,-.68,.88,.115,"#d8ac7d");
      disc(c,0,-.26,.234,green?"#785b55":"#ff8b77");disc(c,0,.27,.234,green?"#adf4a5":"#546c60");
      c.restore();
    };
    head(2.45,my,0,nsGreen);head(mx,-2.45,Math.PI/2,!nsGreen);
    c.restore();
  }

  function cameraWedge(c,x,y,yaw,ui) {
    const radius=24*ui, a=-Math.PI/2-.45,b=-Math.PI/2+.45;
    c.save();c.translate(x,y);c.rotate(yaw);
    c.beginPath();c.moveTo(0,0);c.arc(0,0,radius,a,b);c.closePath();c.fillStyle="rgba(203,255,219,.21)";c.fill();
    c.beginPath();c.arc(0,0,radius,a,b);c.lineWidth=1.1*ui;c.strokeStyle="rgba(206,250,213,.77)";c.stroke();
    c.restore();
  }
  function cassette(c,x,y,r) {
    c.save();c.translate(x,y);c.scale(r,r);
    path(c,[[-1,-.69],[1,-.69],[1,.69],[-1,.69]],mint,ink,.20);
    disc(c,-.41,-.07,.17,ink);disc(c,.41,-.07,.17,ink);
    line(c,-.45,.38,.45,.38,ink,.14);c.restore();
  }
  function targetIcon(c,x,y,r,elapsed,street) {
    const pulse=(Math.sin(elapsed*3.8)+1)*.5;
    c.save();c.translate(x,y);c.scale(r,r);c.lineJoin="round";
    if(street){c.beginPath();c.arc(0,0,1.65+pulse*.28,0,Math.PI*2);c.lineWidth=.16;c.strokeStyle="#ffe2a9";c.stroke();}
    path(c,[[0,-1],[.93,0],[0,1],[-.93,0]],orange,ink,.23);
    disc(c,0,0,.23,ink);c.restore();
  }
  function playerIcon(c,x,y,r,yaw) {
    c.save();c.translate(x,y);c.rotate(yaw||0);c.scale(r,r);c.lineJoin="round";
    path(c,[[0,-1.3],[.78,.90],[0,.53],[-.78,.90]],"#f8fff1",ink,.24);c.restore();
  }
  const districts=[
    ["PORT SOL",-110,-40],["MERCADO",-35,-106],["NEON MILE",0,103],["OCEAN DRIVE",110,-40],["BOARDWALK",165,110],
  ];
  function edgePoint(x,y,w,h,radar,padding) {
    const dx=x-w/2,dy=y-h/2,rx=Math.max(1,w/2-padding),ry=Math.max(1,h/2-padding);
    const unit=radar?Math.hypot(dx/rx,dy/ry):Math.max(Math.abs(dx)/rx,Math.abs(dy)/ry);
    return unit<=1?[x,y]:[w/2+dx/unit,h/2+dy/unit];
  }
  function dashCourse(c,opt,px,py,s,street,ui,visible){
    const gates=BayBeachDash.gates,active=opt.dashIndex!=null;
    c.save();
    if(active){
      c.strokeStyle=street?"rgba(40,91,86,.49)":"#387f77";
      c.lineWidth=street?Math.max(1.4,s*.13):1.45*ui;c.setLineDash(street?[s*.70,s*.72]:[3*ui,2*ui]);
      const first=Math.max(0,opt.dashIndex-1);
      c.beginPath();for(let i=first;i<gates.length;i++){const g=gates[i];if(i===first)c.moveTo(px(g.x),py(g.z));else c.lineTo(px(g.x),py(g.z));}
      c.stroke();c.setLineDash([]);
    }
    for(let i=0;i<(active||opt.dashRun||street?gates.length:1);i++){
      const g=gates[i],x=px(g.x),y=py(g.z);
      if(i&&!active&&!opt.dashRun&&g.type!=="rail")continue;
      if(!visible(x,y,4*s+5))continue;
      c.save();c.translate(x,y);c.rotate(g.yaw);
      if(street){
        c.scale(s,s);const half=BayBeachDash.halfWidth;
        if(i===opt.dashIndex){
          for(const ahead of [1.0,1.8])
            path(c,[[-.82,ahead+.12],[0,ahead-.35],[.82,ahead+.12],[.82,ahead+.32],[0,ahead-.12],[-.82,ahead+.32]],"#ffe4a5","#816a48",.065);
          for(const side of [-1,1]){
            c.beginPath();c.arc(side*half,0,.40,0,Math.PI*2);c.lineWidth=.10;c.strokeStyle="#fff0cc";c.stroke();
          }
        }
        if(g.type==="rail"){
          const dropped=opt.dashRun?.clips.has(i),z=dropped?-.44:0;
          for(let k=0;k<9;k++)rect(c,-half+k*2*half/9,z-.086,2*half/9,.172,k%2?"#d8664a":"#fff2cd");
        }else if(g.type!=="flag"){
          for(let k=0;k<12;k++)for(let j=0;j<2;j++)rect(c,-half+k*half/6,(j-1)*.22,half/6,.22,(j+k)%2?"#315958":"#f9eacd");
        }
        for(const side of [-1,1]){
          const a=side*half;disc(c,a,.04,.16,"#355455");
          path(c,[[a,-.05],[a+side*.73,-.28],[a+side*.64,.05],[a,.18]],g.type==="flag"?"#257a77":"#de7156");
        }
      }else{
        const k=(i===opt.dashIndex?3.3:2.3)*ui;
        line(c,-k,0,k,0,"#285355",1.7*ui);
        path(c,[[-k,0],[-k,-2.2*ui],[-k+3*ui,-1.4*ui]],"#e89569");
      }
      c.restore();
    }
    c.restore();
  }

  function blockProps(c,b,px,py,s,t){
    if(b.strip){
      const strip=b.strip;
      c.save();c.translate(px(strip.x),py(strip.z));c.rotate(b.yaw);c.scale(s,s);
      rect(c,-1.68,-.27,3.36,.54,"#273538");
      for(let i=-3;i<=3;i++){const x=i*.42;path(c,[[x-.13,.15],[x+.13,.15],[x,-.25]],"#ecefd9");}
      for(const x of [-1.56,1.56])rect(c,x-.12,-.34,.24,.68,"#ffbc48");
      c.restore();
    }
    const r=b.rail;
    c.save();c.translate(px(r.x),py(r.z));c.rotate(b.yaw);c.scale(s,s);
    for(const x of [-1.2,1.2])rect(c,x-.11,-.48,.22,.96,"#414e50");
    rect(c,-1.55,-.18,3.1,r.hit?.7:.36,"#fff0c7");
    for(let i=0;i<5;i++)rect(c,-1.53+i*.62,-.18,.32,r.hit?.7:.36,"#e56d40");
    for(const x of [-1.32,1.32])disc(c,x,0,.16,t%1<.52?"#fff09e":"#dc8d41");
    c.restore();
    for(const cone of b.cones){
      c.save();c.translate(px(cone.x),py(cone.z));c.rotate(cone.yaw);c.scale(s,s);
      rect(c,-.26,-.26,.52,.52,"#515856");disc(c,0,0,.21,"#f48442");
      if(cone.hit)path(c,[[-.17,0],[.17,0],[.04,-.58],[-.04,-.58]],"#f48642");
      disc(c,0,cone.hit?-.33:0,.095,"#fff0c7");c.restore();
    }
  }
  function roadblockMark(c,x,y,yaw,ui,spikes){
    c.save();c.translate(x,y);c.rotate(yaw);c.scale(ui,ui);
    rect(c,-7.4,-3.25,14.8,6.5,"#36474a");
    rect(c,-6.3,-1.95,12.6,3.9,"#ffe5ae");
    for(const a of [-5,-1,3])path(c,[[a-1,1.95],[a+.7,1.95],[a+3,-1.95],[a+1.3,-1.95]],"#c75f36");
    if(spikes)for(const a of [-4,0,4])path(c,[[a-1.8,6.6],[a,3],[a+1.8,6.6]],"#ffe27d","#28383a",.7);
    c.restore();
  }
  function airLight(c,a,px,py,s,street,ui){
    if(a.light<.02)return;
    const f=a.beamFraction,x=px(a.x+(a.spotX-a.x)*f),y=py(a.z+(a.spotZ-a.z)*f),r=a.radius*s*f;
    c.save();c.globalAlpha=a.light*(street?.65:.85);
    if(street){
      const dx=x-px(a.x),dy=y-py(a.z),d=Math.hypot(dx,dy)||1,nx=-dy*r/d,ny=dx*r/d;
      path(c,[[px(a.x),py(a.z)],[x+nx,y+ny],[x-nx,y-ny]],"rgba(255,238,168,.22)");
    }
    if(f>.993){
      const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,"rgba(255,248,191,.72)");g.addColorStop(.62,"rgba(255,238,157,.32)");g.addColorStop(1,"rgba(255,230,138,0)");
      disc(c,x,y,r,g);
      if(!street){c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.lineWidth=ui;c.strokeStyle="rgba(251,221,134,.70)";c.stroke();}
    }
    c.restore();
  }
  function airSprite(c,a,x,y,s,street,ui){
    c.save();c.translate(x,y);c.rotate(a.yaw);
    if(!street){
      c.scale(ui,ui);disc(c,0,0,6.6,"#253b46");
      line(c,0,-4.6,0,5.3,"#d4edf0",2);line(c,-2.1,4.6,2.1,4.6,"#b4dbe3",1.3);
      disc(c,0,-1,2.3,"#e7f6ef");line(c,-5.3,-2.4,5.3,1.5,"#b3dce3",1.35);
      c.restore();return;
    }
    c.scale(s,s);
    path(c,[[-.67,-2],[-1.18,-.87],[-.96,1.12],[-.36,2.2],[-.14,5.94],[.12,6.2],[.39,2.15],[1.05,1.07],[1.18,-.85],[.7,-2.1],[0,-2.52]],"#f1e9d1","#344b55",.12);
    path(c,[[-.92,-.43],[-.78,-1.74],[0,-2.27],[.83,-1.65],[.96,-.4]],"#41677a");
    rect(c,-1.12,4.65,2.25,.30,"#41565d");rect(c,-.11,5.47,.22,.51,"#414e54");
    for(const side of [-1,1])line(c,side*1.03,-1.35,side*1.03,1.50,"#395158",.12);
    c.rotate(a.rotor);
    for(let k=0;k<4;k++){
      path(c,[[.1,-.10],[4.99,-.15],[5.13,.02],[.3,.17]],"#475459");
      rect(c,4.71,-.15,.34,.16,"#eee3bc");c.rotate(Math.PI/2);
    }
    disc(c,0,0,.26,"#5e716c");c.restore();
  }
  function garageFloor(c,g,x,y,s){
    const w=g.halfWidth,d=g.halfDepth;
    c.save();c.translate(x,y);c.scale(s,-s);
    rect(c,-w+.05,-d+.4,2*w-.1,2*d+4,"#bbb9a4");
    for(const side of [-1,1]){
      rect(c,side*3.48-.07,-5.56,.14,11.38,"#f4e4b9");
      rect(c,side*.96-.3,-3.26,.60,6.45,"#638381");
      for(const a of [2.90,6.8,9.2])rect(c,side*(a<3?.96:3.48)-.15,a-.23,.3,.46,"#e4b26e");
    }
    rect(c,-3.48,-3.59,6.96,.15,"#ebc676");
    rect(c,2.83,-d+.42,1.55,.85,"#bc6751");
    for(const u of [-2.6,-3.65]){disc(c,u,-d+1.02,.51,"#41494a");disc(c,u,-d+1.02,.22,"#9caa9a");}
    c.restore();
  }
  function garageMark(c,x,y,ui,label,selected){
    c.save();c.translate(x,y);c.scale(ui,ui);
    let right=8;
    if(label){
      c.font="700 9.5px system-ui, sans-serif";c.textAlign="left";c.textBaseline="middle";
      right=15+c.measureText(label).width;rect(c,4,-6.7,right-4,13.4,"#214e4d");
      c.fillStyle="#fff0ce";c.fillText(label,11,.2);
    }
    disc(c,0,0,8.2,selected?"#ffce82":"#c1e6bd");disc(c,0,0,6.95,"#286461");
    path(c,[[-4.9,3.15],[-1,-.86],[-1.22,-2.95],[.05,-4.79],[2.37,-5.3],[1.25,-3.32],
      [2.62,-1.99],[4.96,-3.17],[4.36,-.82],[2.72,.45],[.78,.22],[-3.18,4.92],[-4.57,5.05],[-5.28,4.26]],"#fff0c9");
    disc(c,-3.85,3.86,.62,"#286461");c.restore();
    if(label)return {left:x-9*ui,right:x+(right+1)*ui,top:y-9*ui,bottom:y+9*ui};
  }
  window.drawBayMap=function drawBayMap(ctx,opt) {
    const w=ctx.canvas.width,h=ctx.canvas.height,s=opt.scale;
    if(!(w>0 && h>0 && s>0)) return;
    const street=opt.mode==="street",radar=opt.mode==="radar",atlas=opt.mode==="atlas";
    const p=street?palette.street:palette.chart,t=opt.elapsed||0;
    const streetTime=Number.isFinite(opt.time)?opt.time:t;
    const solids=opt.solids||empty, cars=opt.cars||empty, player=opt.player;
    const px=x=>w/2+(x-opt.cx)*s,py=z=>h/2-(z-opt.cz)*s;
    const rotation=street?(opt.rotation||0):0,cs=Math.cos(rotation),sn=Math.sin(rotation);
    const screenX=(x,y)=>w/2+cs*(x-w/2)+sn*(y-h/2);
    const screenY=(x,y)=>h/2-sn*(x-w/2)+cs*(y-h/2);
    const visible=(x,y,pad=15)=>{
      const a=rotation?screenX(x,y):x,b=rotation?screenY(x,y):y;
      return a>=-pad&&a<=w+pad&&b>=-pad&&b<=h+pad;
    };
    const ui=radar?Math.min(w,h)/165:atlas?Math.min(w,h)/370:Math.max(.85,h/600);
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=1;ctx.lineCap="butt";ctx.lineJoin="round";
    rect(ctx,0,0,w,h,p.land);
    if(rotation){ctx.translate(w/2,h/2);ctx.rotate(-rotation);ctx.translate(-w/2,-h/2);}
    const pad=Math.hypot(w,h);
    if(street&&opt.submerged&&opt.swim){
      rect(ctx,-pad,-pad,w+pad*2,h+pad*2,"#377e80");
      BayReefArt.map(ctx,opt,px,py,s,visible);
      BaySurfArt.mapLadders(ctx,opt,px,py,s,visible);
      for(const boat of opt.marina?.boats||empty)if(visible(px(boat.x),py(boat.z),4*s)){
        ctx.save();ctx.translate(px(boat.x),py(boat.z));ctx.rotate(boat.yaw||0);
        ctx.beginPath();ctx.ellipse(0,0,1.1*s,2.7*s,0,0,Math.PI*2);ctx.fillStyle="rgba(38,71,73,.43)";ctx.fill();ctx.restore();
      }
      for(const person of opt.patrol?.actors||empty)if(person.wet&&visible(px(person.x),py(person.z),2*s)){
        ctx.save();ctx.globalAlpha=.54;BaySwimmerArt.map(ctx,px(person.x),py(person.z),s,person,streetTime);ctx.restore();
      }
      BaySwimmerArt.map(ctx,px(opt.swim.x),py(opt.swim.z),s,opt.swim,streetTime);ctx.restore();return;
    }
    rect(ctx,px(213),-pad,Math.max(0,w+pad-px(213)),h+pad*2,p.ocean);
    const base=staticImage(solids,street);
    if(base) ctx.drawImage(base,px(extent.left),py(extent.top),(extent.right-extent.left)*s,(extent.top-extent.bottom)*s);
    else {
      ctx.save();ctx.translate(w/2-opt.cx*s,h/2+opt.cz*s);ctx.scale(s,-s);
      paintStatic(ctx,solids,street);ctx.restore();
    }
    if(visible(px(226),py(327),143*s)){
      const shore=[];for(let z=208;z<=478;z+=5)shore.push([px(BayCut.coast(z)-.28),py(z)]);
      shore.push([px(480),py(478)],[px(480),py(208)]);path(ctx,shore,p.ocean);
    }
    BayCutArt.map(ctx,px,py,s,street);
    if(street&&visible(px(193),py(305),105*s))BayCutWildlife.map(ctx,px,py,s,opt.weather,streetTime,visible);
    if(street&&opt.dusk>.01){
      ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.globalAlpha=opt.dusk*.35;
      rect(ctx,0,0,w,h,"#23304f");ctx.restore();
    }
    if(street&&opt.weather){
      BayCoastArt.mapSurface(ctx,opt,px,py,visible);
      if(opt.recovery)BayRecoveryArt.groundMap(ctx,opt,px,py,s,visible);
      if(visible(px(-37.4),py(-132.2),13*s))BayMercadoArt.map(ctx,px,py,s,opt.weather,streetTime);
      const rear=BayMercadoArt.receiving;
      if(visible(px(rear.x-8),py(rear.z),18*s))BayMercadoArt.receivingMap(ctx,px,py,s,streetTime);
      const bay=BayMotelParking.bay;
      if(visible(px(bay.x),py(bay.z),6*s))BayMotelParking.map(ctx,px,py,s);
    }
    if(opt.courts)BayCourtPlaces.map(ctx,opt,px,py,s,visible);
    if(atlas&&!opt.marina?.bayChart)BayStreetNames.atlas(ctx,px,py,s);
    if(atlas&&opt.countyChart){
      ctx.save();ctx.font="600 "+(7.6*ui)+"px system-ui";ctx.fillStyle="#ede6c5";ctx.strokeStyle="#435f55";ctx.lineWidth=2.7*ui;
      for(const [label,x,z] of [["SHELL LEVEE",94,277],["PELICAN CAUSEWAY",160,253],["FISH CAMP",172,342],["PELICAN SOUND",279,282]]){
        ctx.textAlign="center";ctx.strokeText(label,px(x),py(z));ctx.fillText(label,px(x),py(z));
      }
      for(const source of BayCutWildlife.sources){
        const x=px(source.site.x),y=py(source.site.z),r=3.25*ui;
        ctx.strokeStyle="#efe1ae";ctx.lineWidth=1.3*ui;disc(ctx,x,y,r,"#36564f");
        ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.stroke();
      }ctx.restore();
    }else if(atlas&&!opt.marina?.bayChart&&visible(px(144),py(170))){
      ctx.save();ctx.textAlign="right";ctx.fillStyle="#304e49";ctx.strokeStyle="#c5ceb1";ctx.lineWidth=2.3*ui;
      ctx.font="bold "+7.5*ui+"px system-ui";const label="↑ Pelican Cut",x=px(143),y=py(170);
      ctx.strokeText(label,x,y);ctx.fillText(label,x,y);ctx.restore();
    }
    if(radar&&player&&Number.isFinite(opt.cameraYaw)) cameraWedge(ctx,px(player.x),py(player.z),opt.cameraYaw,ui);
    const ferry=opt.ferry,ship=ferry?.ship;
    if(ship){
      if(opt.ferryActive&&(radar||atlas&&opt.marina?.bayChart)){
        ctx.save();ctx.beginPath();
        ship.chart.forEach((v,i)=>{if(i)ctx.lineTo(px(v.x),py(v.z));else ctx.moveTo(px(v.x),py(v.z));});
        ctx.setLineDash([3.5*ui,3.5*ui]);ctx.lineWidth=1.2*ui;ctx.strokeStyle="#edd0a2";ctx.stroke();ctx.restore();
      }
      if(visible(px(ship.x),py(ship.z),12*s)){
        if(street){
          for(const w of ship.wake){
            const age=streetTime-w.at,gap=1.7+age*1.65;
            for(const sign of [-1,1]){
              const x=w.x+sign*Math.cos(w.yaw)*gap,z=w.z-sign*Math.sin(w.yaw)*gap;
              line(ctx,px(x),py(z),px(x-.85*Math.sin(w.yaw-sign*.31)),py(z-.85*Math.cos(w.yaw-sign*.31)),"rgba(223,237,219,.65)",Math.max(.6,s*.13));
            }
          }
          BayFerryArt.drawMap(ctx,px(ship.x),py(ship.z),s,ship.yaw,streetTime);
          if(opt.ferryActive&&ferry.phase==="water"){
            ctx.save();ctx.translate(px(ship.gate.x),py(ship.gate.z));ctx.rotate(ship.yaw);ctx.scale(s,s);
            for(const side of [-1,1])for(const end of [-1,1]){
              line(ctx,side*1.3,end*3.1,side*.74,end*3.1,"#ffd184",.14);
              line(ctx,side*1.3,end*3.1,side*1.3,end*2.24,"#ffd184",.14);
            }ctx.restore();
          }
        }else{
          ctx.save();ctx.translate(px(ship.x),py(ship.z));ctx.rotate(ship.yaw);const k=Math.max(.58*ui,s);
          ctx.scale(k,k);path(ctx,[[-2.9,8.4],[2.9,8.4],[3,-4.6],[0,-9],[-3,-4.6]],"#f0deaf",ink,.8);
          rect(ctx,-1.7,-3.2,3.4,6,"#31736e");disc(ctx,-3,3,.95,"#ffbe65");ctx.restore();
        }
      }
    }
    BayMarinaView.map(ctx,opt,px,py,s,ui,visible);
    if(opt.patrol){
      if(street){
        BaySurfArt.map(ctx,opt,px,py,s,visible);
        if(opt.patrol.call&&visible(px(opt.patrol.call.swimmer.x),py(opt.patrol.call.swimmer.z),5*s))BaySwimmerArt.mapLine(ctx,opt.patrol,opt.swim,streetTime,px,py,s);
        for(const person of opt.patrol.actors)if(visible(px(person.x),py(person.z),2*s)){
          if(person.wet)BaySwimmerArt.map(ctx,px(person.x),py(person.z),s,person,streetTime);
          else{
            const [skin,shirt]=BaySwimmerArt.colors[person.style];
            personSprite(ctx,{...person,skin,shirt},px(person.x),py(person.z),Math.max(2.3,s*1.42),false,rotation);
          }
        }
      }else{
        const caller=opt.patrol.call?.swimmer;
        if(caller&&visible(px(caller.x),py(caller.z))){disc(ctx,px(caller.x),py(caller.z),3.3*ui,"#713f33");disc(ctx,px(caller.x),py(caller.z),2.1*ui,"#ffb680");}
      }
    }
    if(opt.route&&!street){
      const pts=opt.route.points;ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
      ctx.beginPath();ctx.moveTo(px(pts[0].x),py(pts[0].z));
      for(let i=1;i<pts.length;i++)ctx.lineTo(px(pts[i].x),py(pts[i].z));
      ctx.strokeStyle="#34574f";ctx.lineWidth=4.4*ui;ctx.stroke();ctx.strokeStyle="#a1f2cd";ctx.lineWidth=2.1*ui;ctx.stroke();ctx.restore();
    }
    if(!street&&opt.searchPoint){
      const x=px(opt.searchPoint.x),y=py(opt.searchPoint.z),r=12*s;
      ctx.save();disc(ctx,x,y,r,"rgba(244,190,107,.16)");
      ctx.setLineDash([3*ui,2.5*ui]);ctx.beginPath();ctx.arc(x,y,r,0,2*Math.PI);
      ctx.lineWidth=1.35*ui;ctx.strokeStyle="#ffcb85";ctx.stroke();ctx.restore();
    }
    if(opt.air&&(street||radar))airLight(ctx,opt.air,px,py,s,street,ui);
    if(opt.roadblock){
      const b=opt.roadblock,x=px(b.x),y=py(b.z);
      if(street&&visible(x,y,13*s))blockProps(ctx,b,px,py,s,streetTime);
      if(!street&&(radar||visible(x,y))){
        const marker=radar?edgePoint(x,y,w,h,true,9*ui):[x,y];roadblockMark(ctx,marker[0],marker[1],b.yaw,ui,!!b.strip);
      }
    }
    if(street)for(const k of opt.skids||empty)if(t-k.time<20&&visible(px(k.x),py(k.z))){
      const dx=Math.sin(k.yaw)*.40,dz=Math.cos(k.yaw)*.40;
      line(ctx,px(k.x-dx),py(k.z-dz),px(k.x+dx),py(k.z+dz),"#4c4c4e",Math.max(.8,s*.15));
    }
    dashCourse(ctx,opt,px,py,s,street,ui,visible);
    if(atlas) {
      ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="700 "+(9.7*ui)+"px system-ui, sans-serif";
      ctx.lineWidth=2.3*ui;ctx.strokeStyle="#a5b6a1";ctx.fillStyle="#344f4d";
      for(const [name,x,z] of districts) {
        const a=px(x),b=py(z);
        if(visible(a,b)){ctx.strokeText(name,a,b);ctx.fillText(name,a,b);}
      }
    }
    let garageBounds;
    for(const place of opt.places||empty) {
      if(place.kind==="pickup-court")continue;
      const x=px(place.x),y=py(place.z);
      if(place.kind==="garage"){
        const selected=opt.target?.kind==="garage";
        if(street){
          if(visible(x,y,18*s)){garageFloor(ctx,place,x,y,s);garageMark(ctx,x+9*s,y,ui*.84,"",false);}
        }else if(atlas)garageBounds=garageMark(ctx,x,y,ui,place.name,selected);
        else if(radar){
          const marker=edgePoint(x,y,w,h,true,10*ui);
          if(player?.flatSide||selected||Math.hypot(marker[0]-x,marker[1]-y)<1)
            garageMark(ctx,marker[0],marker[1],ui*.86,"",selected);
        }
      }else if(!street&&place.kind==="surf-tower"&&visible(x,y)){
        disc(ctx,x,y,5.8*ui,"#674b3a");disc(ctx,x,y,4.7*ui,"#e6af6a");
        line(ctx,x-2.5*ui,y,x+2.5*ui,y,"#f9eed3",1.5*ui);line(ctx,x,y-2.5*ui,x,y+2.5*ui,"#f9eed3",1.5*ui);
        if(atlas){
          ctx.save();ctx.textAlign="right";ctx.font="bold "+8*ui+"px system-ui";ctx.fillStyle="#f6eace";ctx.strokeStyle=ink;ctx.lineWidth=2.3*ui;
          ctx.strokeText("Beach patrol",x-8*ui,y-5*ui);ctx.fillText("Beach patrol",x-8*ui,y-5*ui);ctx.restore();
        }
      }else if(!street&&(place.kind==="room"||place.kind==="counter")&&visible(x,y)){
        const k=ui*(radar?.84:1);ctx.save();ctx.translate(x,y);ctx.scale(k,k);
        disc(ctx,0,0,6.2,ink);disc(ctx,0,0,5.1,place.kind==="room"?"#abdbcd":opt.weather?.market==="open"?"#ffbc75":"#aeae9b");
        if(place.kind==="room"){
          disc(ctx,-1.55,-1.2,1.9,ink);disc(ctx,-1.55,-1.2,.77,"#abdbcd");
          line(ctx,-.1,-.1,2.5,2.4,ink,1.25);line(ctx,1.65,1.55,2.65,.65,ink,1.15);
        }else{
          rect(ctx,-2.9,.1,5.8,1,ink);path(ctx,[[-2.6,-.2],[-1.8,-1.9],[0,-2.5],[1.8,-1.9],[2.6,-.2]],ink);
          rect(ctx,-1.8,1.4,3.6,.58,ink);
        }
        ctx.restore();
      }else if(!["landing","recovery-desk","wheel-window","bike-rack","valet-stand","sound-shell","car-wash"].includes(place.kind)&&!street&&visible(x,y)){
        disc(ctx,x,y,(radar?2.0:2.55)*ui,ink);disc(ctx,x,y,(radar?1:1.38)*ui,"#e1d9b2");
      }
    }
    for(const site of opt.jobPins||empty){
      const x=px(site.x),y=py(site.z);if(!visible(x,y))continue;
      const r=(radar?4.0:3.55)*ui;
      disc(ctx,x,y,r+.8*ui,ink);disc(ctx,x,y,r,"#efbc6d");
      rect(ctx,x-.18*r,y-.68*r,.36*r,.83*r,ink);disc(ctx,x,y+.49*r,.19*r,ink);
    }
    if(!street&&opt.personal&&!opt.marina?.bayChart){
      const x=px(opt.personal.x),y=py(opt.personal.z);
      if(radar||visible(x,y)){
        const [a,b]=radar?edgePoint(x,y,w,h,true,9*ui):[x,y],k=ui*(radar?.83:1.02);
        ctx.save();ctx.translate(a,b);ctx.scale(k,k);disc(ctx,0,0,6.2,ink);disc(ctx,0,0,5.2,"#8cddc8");
        path(ctx,[[-3.4,1.6],[-3.4,-.60],[-2.35,-.95],[-1.4,-2.15],[1.25,-2.15],[2.45,-.85],[3.3,-.45],[3.3,1.6]],ink);
        disc(ctx,-2,1.7,.78,ink);disc(ctx,2,1.7,.78,ink);ctx.restore();
      }
    }
    for(const tape of opt.tapes||empty) {
      if(street&&tape.name==="Saltwater sessions"&&opt.band)continue;
      const x=px(tape.x),y=py(tape.z);
      if(visible(x,y)) cassette(ctx,x,y,(street?4.6:radar?3.7:4.75)*ui);
    }
    if(street) for(const person of opt.peds||empty) {
      const x=px(person.x),y=py(person.z);
      if(visible(x,y)){
        personSprite(ctx,person,x,y,Math.max(2.3,s*1.42),false,rotation);
        if(person.iceBox){
          ctx.save();ctx.translate(x,y);ctx.rotate(person.yaw);ctx.fillStyle="#5d8781";
          ctx.fillRect(.25*s,-.26*s,.47*s,.33*s);ctx.fillStyle="#e5d5ab";ctx.fillRect(.25*s,-.28*s,.47*s,.11*s);ctx.restore();
        }
        if(person.id==="marsh-line")BayCutWildlife.mapKit(ctx,x,y,s,streetTime);
      }
    }
    if(street)for(const prop of BayExposure.props){
      if(visible(px(prop.x),py(prop.z),6*s))BayExposureArt.drawMap(ctx,prop.kind,px(prop.x),py(prop.z),s,prop.yaw);
    }
    const partner=opt.story?.mara||opt.mara;
    if(street&&partner&&!(opt.story?.progress>=.65)&&visible(px(partner.x),py(partner.z))){
      personSprite(ctx,{...partner,shirt:BayExposureArt.palette[1],skin:BayExposureArt.palette[0]},px(partner.x),py(partner.z),Math.max(2.3,s*1.42),false,rotation);
      BayExposureArt.drawMap(ctx,"mara",px(partner.x),py(partner.z),s,partner.yaw??-1.9);
    }
    if(street) for(const actor of opt.streetActors||empty) {
      const x=px(actor.x),y=py(actor.z);
      if(visible(x,y,9*s)) streetActor(ctx,actor,x,y,s,streetTime);
    }
    if(street&&player?.inCabin)personSprite(ctx,player,px(player.x),py(player.z),Math.max(3,s*1.8),true,rotation);
    if(street&&opt.cabService)for(const p of opt.cabService.people){
      if(p.phase==="booth"||p.seat>.55||!visible(px(p.x),py(p.z)))continue;
      const [skin,shirt]=BayCabArt.colors[p.id];personSprite(ctx,{...p,skin,shirt},px(p.x),py(p.z),Math.max(2.3,s*1.42),false,rotation);
    }
    let playerCar;
    if(opt.valet)BayValetPlaces.map(ctx,opt,px,py,s,visible);
    if(opt.band)BaySoundShell.map(ctx,opt,px,py,s,visible);
    if(opt.wash)BayPalmaWash.map(ctx,opt,px,py,s,visible);
    for(const car of cars) {
      const x=px(car.x),y=py(car.z);
      if(!visible(x,y,4*s+10)) continue;
      if(player && player.driving && Math.hypot(car.x-player.x,car.z-player.z)<.55) playerCar=car;
      if(street){
        carSprite(ctx,car,x,y,s,streetTime);
        BayStreetCars.map(ctx,car,x,y,s,streetTime);
        if(car.soil)BayRoadGlass.map(ctx,car,x,y,s,streetTime);
        if(car.roadside&&!car.onLift&&streetTime%1.05<.49){
          const shape=bayCarLayout(car.kind);ctx.save();ctx.translate(x,y);ctx.rotate(car.yaw);
          for(const side of [-1,1])for(const end of [-1,1])disc(ctx,side*(shape.track-.12)*s,end*(shape.halfLength-.12)*s,.12*s,"#ffbd53");
          ctx.restore();
        }
      }
      else if(car.role==="roadblock")continue;
      else if(car.kind==="cruiser") {
        ctx.save();ctx.translate(x,y);ctx.rotate(car.yaw);
        ctx.fillStyle=car.sees?"rgba(246,113,108,.26)":"rgba(100,187,229,.24)";
        ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,14*s,-2.29,-.85);ctx.closePath();ctx.fill();
        ctx.restore();
        disc(ctx,x,y,3.4*ui,ink);disc(ctx,x,y,2.35*ui,t%1<.5?"#ff8c87":"#a4eaff");
      } else if(radar) {
        disc(ctx,x,y,1.18*ui,"#b7bda3");
      }
    }
    if(opt.recovery&&!street)BayRecoveryArt.map(ctx,opt,px,py,s,visible);
    if(street&&opt.courts){
      BayCourtBench.map(ctx,opt,px,py,s,visible);
      for(const g of opt.courts){
        if(!visible(px(g.site.x),py(g.site.z),16*s))continue;
        for(const a of g.human?[...g.locals,g.human]:g.locals){
          const at=BayCourtPlaces.mapPoint({x:a.x,y:a.y+a.lift,z:a.z},g.site);
          BayCourtPlayers.mapActor(ctx,a,px(at.x),py(at.z),s,streetTime);
        }
        BayCourtPlayers.mapBall(ctx,g.ball,g.site,px,py,s,streetTime);
      }
    }
    if(opt.wheel)BayCoastWheelArt.map(ctx,opt,px,py,s,visible);
    if(opt.boardwalk)BayBoardwalkArt.map(ctx,opt,px,py,s,visible);
    if(opt.cycles)for(const b of [...opt.cycles.bikes,opt.cycles.javi]){
      const x=px(b.x),y=py(b.z);if(!visible(x,y,2*s+5*ui))continue;
      if(street){BayPedalArt.mapBike(ctx,b,x,y,s,streetTime);continue;}
      if(opt.marina?.bayChart||b.rider)continue;
      ctx.save();ctx.translate(x,y);ctx.rotate(-rotation);ctx.scale(ui,ui);
      ctx.fillStyle="#345452";ctx.fillRect(-5.5,-3.7,11,7.4);ctx.lineWidth=.9;ctx.strokeStyle="#f4d69f";
      for(const k of [-2.65,2.65]){ctx.beginPath();ctx.arc(k,.9,1.6,0,Math.PI*2);ctx.stroke();}
      ctx.beginPath();ctx.moveTo(-2.65,.9);ctx.lineTo(-.85,-1.2);ctx.lineTo(.4,.9);ctx.lineTo(2,-1.65);ctx.lineTo(2.65,.9);ctx.stroke();ctx.restore();
    }
    if(opt.cabService){
      BayCabArt.map(ctx,opt,px,py,s,visible);
      if(street){
        const cab=opt.cabService.vehicle,seat=bayCarLayout(cab.kind);
        if(visible(px(cab.x),py(cab.z))){
          const mina=BayDriving.world(cab,-seat.seatX,.36);disc(ctx,px(mina.x),py(mina.z),Math.max(1,s*.14),BayCabArt.colors.mina[0]);
          if(opt.cabService.booking?.seat>.55){
            const rider=BayDriving.world(cab,seat.seatX,.36);disc(ctx,px(rider.x),py(rider.z),Math.max(1,s*.14),"#af7353");
          }
        }
      }
    }
    if(street&&opt.meet)BayMeetArt.drawMap(ctx,opt,px,py,s,ui,visible);
    if(street&&opt.meet?.phase==="idle")BayTakeArt.inviteMap(ctx,opt.meet.rival,px,py,s,visible);
    if(opt.take)BayTakeArt.map(ctx,opt,px,py,s,ui,visible,carSprite);
    if(street)BayTakePoster.map(ctx,opt,px,py,s,ui,visible);
    if(street&&opt.inez){
      const r=opt.inez,x=px(r.x),y=py(r.z),colors=BayFerryPassengerArt.palette,lift=ferry?.motion.lift||0;
      if(visible(x,y)){
        if(ferry?.phase==="drive"||ferry?.phase==="water"||ferry?.phase==="missed"){
          disc(ctx,x,y,s*.21,colors[1]);disc(ctx,x,y,s*.14,"#344944");
        }else{
          personSprite(ctx,{...r,shirt:colors[1],skin:colors[0],startle:{lift}},x,y,Math.max(2.3,s*1.42),false,rotation);
          const tin=BayDriving.world(r,.34,.02);disc(ctx,px(tin.x),py(tin.z)-lift*s*.65,s*.12,"#ae4d3c");
        }
      }
    }
    if(street) for(const sig of opt.signals||empty) {
      const x=px(sig.x),y=py(sig.z);
      if(visible(x,y,9*s)) intersectionLights(ctx,x,y,s,((streetTime+sig.offset)%14+14)%14<7);
    }
    if(opt.target&&(street||opt.target.kind!=="garage")&&!(street&&opt.target.kind==="ferry-gate"&&visible(px(opt.target.x),py(opt.target.z),-12))&&!(street&&opt.dashIndex!=null&&visible(px(opt.target.x),py(opt.target.z),-12))) {
      const x=px(opt.target.x),y=py(opt.target.z);
      const pt=edgePoint(screenX(x,y),screenY(x,y),w,h,radar,(radar?11:15)*ui);
      ctx.save();ctx.setTransform(1,0,0,1,0,0);
      targetIcon(ctx,pt[0],pt[1],(street?6.2:radar?6.5:7.15)*ui,t,street);
      ctx.restore();
    }
    if(opt.ghost){
      const g=opt.ghost,x=px(g.x),y=py(g.z);
      if(visible(x,y)&&(!player||Math.hypot(player.x-g.x,player.z-g.z)>.75)){
        if(street)personSprite(ctx,g,x,y,Math.max(3,s*1.8),true,rotation,true);
        else{disc(ctx,x,y,3.1*ui,"#296d6c");disc(ctx,x,y,1.9*ui,"#a5ffec");}
      }
    }
    if(player) {
      const rider=opt.boardwalk?.player;
      const projected=street&&rider?BayCoastWheelArt.mapPoint(rider):player,x=px(projected.x),y=py(projected.z);
      if(street) {
        if(player.driving && !playerCar){carSprite(ctx,player,x,y,s,streetTime);if(opt.streetCar){BayStreetCars.map(ctx,opt.streetCar,x,y,s,streetTime);BayRoadGlass.map(ctx,opt.streetCar,x,y,s,streetTime);}}
        for(const a of opt.motorists||empty)if(visible(px(a.x),py(a.z),4*s))BayMotorists.mapActor(ctx,a,px(a.x),py(a.z),s,streetTime,a===opt.valet?.staff?opt.valet.staffJob:null);
        if(opt.band)for(const p of opt.band.performers)if(visible(px(p.x),py(p.z),3*s))BayBandPlayers.mapActor(ctx,p,px(p.x),py(p.z),s,streetTime,opt.band);
        if(opt.cabService)for(const p of opt.cabService.people){
          if(!p.ride||p.seat<=.55||!visible(px(p.x),py(p.z)))continue;
          const rider=BayDriving.world(p.ride,bayCarLayout(p.ride.kind).seatX,.36);
          disc(ctx,px(rider.x),py(rider.z),Math.max(1,s*.14),BayCabArt.colors[p.id][0]);
        }
        if(opt.swim)BaySwimmerArt.map(ctx,x,y,s,opt.swim,streetTime);
        else if(!opt.pickup&&!player.driving&&!player.inCabin&&!opt.aboard&&(!opt.cycles?.riding||opt.cycles.transfer?.approach)){
          if(opt.band?.player){const p=opt.band.player;p.kit=player.kit;BayBandPlayers.mapActor(ctx,p,x,y,s,streetTime,opt.band);}
          else if(opt.keyMapActor)BayMotorists.mapActor(ctx,opt.keyMapActor,x,y,s,streetTime,opt.valet.focus);
          else personSprite(ctx,player,x,y,Math.max(3,s*1.8),true,rotation);
          if(opt.boardwalk?.run?.phase==="deliver"){const hand=BayDriving.world(player,.28,.08);rect(ctx,px(hand.x)-.12*s,py(hand.z)-.08*s,.24*s,.16*s,"#bd5347");}
          if(opt.field?.phase==="listen")BayCutWildlife.mapMic(ctx,x,y,s,opt.field.yaw,streetTime,!!opt.field.slice);
        }
        if(opt.plate&&!opt.swim&&!player.driving&&!player.inCabin&&!opt.aboard){
          const bag=BayDriving.world(player,.41,.08);rect(ctx,px(bag.x)-s*.14,py(bag.z)-s*.13,s*.28,s*.26,"#c6955e");
        }
        if(opt.aboard){const v=opt.marina.player,helm=BayDriving.world(v,-.38,-.35);disc(ctx,px(helm.x),py(helm.z),s*.17,"#805741");}
        if(opt.wash)BayPalmaWash.mapActivity(ctx,opt,px,py,s,visible);
        if(!opt.photograph&&!opt.keyMapActor&&!opt.band?.take){
          const r=Math.max(player.driving?2.7*s:opt.pickup ? .52*s : 1.1*s,5.2*ui);
          ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.lineWidth=1.5*ui;ctx.strokeStyle=mint;ctx.stroke();
          const vx=Math.sin(player.yaw||0),vy=-Math.cos(player.yaw||0);
          line(ctx,x+vx*r,y+vy*r,x+vx*(r+3.2*ui),y+vy*(r+3.2*ui),"#f7ffec",2.3*ui);
        }
      } else playerIcon(ctx,x,y,(radar?7.15:6.6)*ui,player.yaw);
    }
    if(opt.recovery&&street)BayRecoveryArt.map(ctx,opt,px,py,s,visible);
    if(street&&opt.lastDiner&&t<opt.lastDiner.until){
      const bag=BayDriving.world(opt.lastDiner.customer,.40,.12);
      if(visible(px(bag.x),py(bag.z)))rect(ctx,px(bag.x)-s*.14,py(bag.z)-s*.13,s*.28,s*.26,"#c6955e");
    }
    if(street&&opt.story?.progress>=.65){
      const v=opt.story.ride,seat=BayDriving.world(v,bayCarLayout(v.kind).seatX,v.kind==="van"?1.24:.84);
      if(visible(px(seat.x),py(seat.z)))disc(ctx,px(seat.x),py(seat.z),s*.126,"#ad8366");
    }
    if(opt.air){
      const a=opt.air,x=px(a.x),y=py(a.z);
      if(radar||visible(x,y,7*s)){
        const marker=radar?edgePoint(x,y,w,h,true,8*ui):[x,y];airSprite(ctx,a,marker[0],marker[1],s,street,ui);
      }
    }
    ctx.restore();return garageBounds;
  };
})();
