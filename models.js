/* Sundown Bay street models. Coordinates are in metres, with +Z forward. */
(() => {
  "use strict";

  const rubber = "#222632";
  const metal = "#abbdbd";
  const steel = "#51616b";
  const brightGlass = "#609caa";
  const darkGlass = "#273a51";
  const warmLamp = "#ffefbd";
  const redLamp = "#a53a47";
  const mix = (a, b, t) => a + (b - a) * t;

  function tint(color, target, amount) {
    const source = parseInt(color.slice(1), 16);
    const end = parseInt(target.slice(1), 16);
    let result = 0;
    for (const shift of [16, 8, 0]) {
      result |= Math.round(mix((source >> shift) & 255, (end >> shift) & 255, amount)) << shift;
    }
    return "#" + result.toString(16).padStart(6, "0");
  }

  // Each body section sets its longitudinal position, half-width, and deck height.
  const builders=[window.BayDealerCars,window.BaySolenaArt,window.BayBoulevardCars,window.BayCaletaArt,window.BayEngineSevenArt].filter(Boolean);
  const coachwork=new Map(builders.flatMap(b=>Object.keys(b.shapes).map(k=>[k,b])));
  window.bayCoachwork=kind=>coachwork.get(kind);
  const shapes = {
    ...Object.assign({},...builders.map(b=>b.shapes)),
    wrecker:BayWreckerArt.shape,
    ambulance:BayAmbulanceArt.shape,
    coupe: {
      paint: "#ef746b", wheel: .324, axles: [-1.27, 1.23], track: .95,
      sections: [[-2.13,.76,.79],[-1.82,.91,.87],[-.87,.92,.85],[.84,.91,.79],[1.78,.87,.67],[2.10,.74,.63]],
      glass: [-1.33,-.70,.22,.93,.81,1.32,.79,.66],
    },
    cab: {
      paint: "#f6b34e", wheel: .33, axles: [-1.43,1.38], track: .946,
      sections: [[-2.27,.78,.86],[-2.02,.90,.96],[-1.04,.91,.95],[1.12,.90,.92],[1.98,.88,.85],[2.24,.77,.79]],
      glass: [-1.48,-.96,.44,1.12,.92,1.49,.79,.66],
    },
    cruiser: {
      paint: "#394753", wheel: .345, axles: [-1.42,1.40], track: .974,
      sections: [[-2.34,.82,.88],[-2.06,.94,.95],[-1.03,.94,.94],[1.09,.93,.89],[2.03,.91,.83],[2.32,.80,.74]],
      glass: [-1.50,-.95,.37,1.12,.91,1.44,.81,.68],
    },
    van: {
      paint: "#87cabc", wheel: .36, axles: [-1.43,1.42], track: .995,
      sections: [[-2.34,.88,.89],[-2.23,.96,1.00],[.76,.96,1.01],[1.73,.94,.97],[2.17,.86,.88]],
      glass: [-2.29,-2.20,.54,1.69,.97,2.20,.92,.85],
    },
    hatch: {
      paint: "#ace0d1", wheel: .30, axles: [-1.12,1.07], track: .866,
      sections: [[-1.79,.69,.83],[-1.64,.81,.91],[-.82,.83,.92],[.78,.82,.84],[1.48,.78,.76],[1.72,.65,.69]],
      glass: [-1.55,-1.21,.17,.87,.87,1.48,.72,.62],
    },
  };

  // The seat, handle and hinge use the same measurements as the painted body.
  for(const [kind,s] of Object.entries(shapes)){
    const [rear,, ,front,sill,roof]=s.glass,van=kind==="van";
    s.divider=s.divider??(van?.615:kind==="coupe"?.38:.51);
    s.back=mix(rear,front,s.divider);s.hingeZ=front;s.hingeX=s.track-.067;
    s.handleZ=s.back+.14;s.handleY=sill-.105;s.seatX=s.track*.43;
    s.handleX=sideAt(s,1,s.handleZ,s.handleY,.019)[0];
    s.grabX=s.hingeX-.153;s.grabY=sill-.125;s.grabZ=s.handleZ+.19;
    s.seatZ=s.back+(van?.25:.20);s.seatY=van?.79:roof-.925;
    s.floorY=van?.41:Math.min(.265,s.seatY-.175);s.halfLength=Math.max(-s.sections[0][0],s.sections.at(-1)[0]);
  }
  window.bayCarLayout=kind=>shapes[kind]||shapes.coupe;
  BayWreckerArt.fit(shapes.wrecker);BayAmbulanceArt.fit(shapes.ambulance);
  for(const [kind,builder] of coachwork)builder.fit(shapes[kind]);

  function bodyMesh(g, shape, paint, doors, boot, lid) {
    const lower = tint(paint, "#273242", .27);
    const highlight = tint(paint, "#fff0cb", .19);
    const deck = tint(paint, "#ffefdc", .09);
    const sections=[];
    const cuts=[shape.glass[0],shape.back,shape.hingeZ];
    if(boot)cuts.unshift(boot.tail,boot.hinge.z);
    for(let i=0;i<shape.sections.length;i++){
      const a=shape.sections[i],b=shape.sections[i+1];sections.push(a);
      if(b)for(const z of cuts)if(z>a[0]&&z<b[0]){
        const f=(z-a[0])/(b[0]-a[0]);sections.push([z,mix(a[1],b[1],f),mix(a[2],b[2],f)]);
      }
    }
    function points([z,w,h]) {
      return [[-w+.08,.34,z],[-w,h-.12,z],[-w+.065,h,z],
        [w-.065,h,z],[w,h-.12,z],[w-.08,.34,z]];
    }
    for (let i = 1; i < sections.length; i++) {
      const a = points(sections[i-1]);
      const b = points(sections[i]);
      const mid=(sections[i-1][0]+sections[i][0])*.5;
      const door=mid>shape.back&&mid<shape.hingeZ;
      const colors = [lower,highlight,deck,paint,lower];
      for (let k = 0; k < 5; k++) {
        if(k===2&&boot&&mid>boot.tail&&mid<boot.hinge.z){
          BayLuggageBootArt.deckBand(g,lid,boot,a,b,deck);
        }else if(k===2&&mid>shape.glass[0]&&mid<shape.hingeZ){
          for(const side of [-1,1]){
            const j=side<0?2:3,target=door?doors[side]:g;
            target.quad(a[j],b[j],[side*shape.glass[6],b[j][1],b[j][2]],[side*shape.glass[6],a[j][1],a[j][2]],deck);
          }
        }else{
          const target=door&&k!==2?doors[k<2?-1:1]:g;
          target.quad(a[k],b[k],b[k+1],a[k+1],colors[k]);
        }
      }
    }
    for (const s of [sections[0],sections[sections.length-1]]) {
      const p = points(s);
      g.quad(p[0],p[1],p[4],p[5],lower);
      g.quad(p[1],p[2],p[3],p[4],paint);
    }
  }

  // Locate trim on the actual body surface, including its taper at either end.
  function sideAt(shape, side, z, y, offset = .008) {
    const sections = shape.sections;
    let i = 1;
    while (i < sections.length-1 && sections[i][0] < z) i++;
    const a = sections[i-1], b = sections[i];
    const t = (z - a[0]) / (b[0] - a[0]);
    const h = mix(a[2], b[2], t);
    const w = mix(a[1], b[1], t);
    const slope = Math.min(1, Math.max(0, (y-.34)/(h-.46)));
    return [side*(w-.08+.08*slope+offset),y,z];
  }

  function sideRect(g, shape, side, z0, z1, y0, y1, color, offset) {
    g.quad(sideAt(shape,side,z0,y0,offset),sideAt(shape,side,z1,y0,offset),
      sideAt(shape,side,z1,y1,offset),sideAt(shape,side,z0,y1,offset),color);
  }

  function wheel(g, side, outerX, z, r, taxiWheel) {
    const n = 12;
    const outer = side * outerX, inner = side * (outerX-.17);
    const point = (x, radius, a) => [x,r + radius * Math.sin(a),z + radius * Math.cos(a)];
    const center = [outer,r,z], hubCenter = [outer+.005*side,r,z];
    for (let i = 0; i < n; i++) {
      const a = i * Math.PI * 2/n, b = (i+1) * Math.PI * 2/n;
      const p = point(outer,r,a), q = point(outer,r,b);
      g.quad(p,q,point(inner,r,b),point(inner,r,a),i < 4 ? "#2f3540" : rubber);
      g.tri(center,p,q,rubber);
      const rim = taxiWheel ? (i%2 ? "#a5a99e" : "#73858a") : (i%2 ? metal : steel);
      g.tri(hubCenter,point(hubCenter[0],r*.58,a),point(hubCenter[0],r*.58,b),rim);
    }
  }

  function cabinMesh(g, shape, kind, paint, doors, windshield) {
    const [rear,roofRear,roofFront,front,sill,roof,baseHalf,roofHalf] = shape.glass;
    const van = kind === "van";
    const roofPaint = kind === "cruiser" ? "#dce4db" : tint(paint,"#ffead9",.16);
    const at = (side,u,v,push=0) => [
      side * (mix(baseHalf,roofHalf,v)+push),
      mix(sill,roof,v),
      mix(mix(rear,front,u),mix(roofRear,roofFront,u),v),
    ];
    for (const side of [-1,1]) {
      const door=doors[side],divider=shape.divider;
      g.quad(at(side,0,0),at(side,divider,0),at(side,divider,1),at(side,0,1),paint);
      const sideGlass = (u0,u1,v0,v1,col,offset=.008) => {
        g.quad(at(side,u0,v0,offset),at(side,u1,v0,offset),at(side,u1,v1,offset),at(side,u0,v1,offset),col);
      };
      if (van) {
        sideGlass(.09,.53,.34,.40,tint(paint,"#eff4db",.62));
        sideGlass(.09,.40,.27,.31,"#457888");
        sideGlass(.605,.615,.09,.91,tint(paint,"#3f525b",.28));
      } else {
        sideGlass(.055,divider-.017,.085,.91,darkGlass);
      }
      const pane=(u0,u1,v0,v1,col,offset=.003)=>door.quad(at(side,u0,v0,offset),at(side,u1,v0,offset),at(side,u1,v1,offset),at(side,u0,v1,offset),col);
      // The front windows are down. The driver and upholstery remain visible through the opening.
      pane(divider,1,0,.095,paint);pane(divider,1,.93,1,paint);
      pane(divider,divider+.020,.095,.93,steel);pane(.969,1,.095,.93,paint);
      pane(divider+.02,.969,.10,.18,"#56838b");pane(divider+.02,.969,.171,.19,"#b1c8bf",.009);
      const inner=side*(shape.hingeX-.086);
      door.box(inner,(sill+.37)/2,(shape.back+shape.hingeZ)/2,.085,sill-.37,shape.hingeZ-shape.back,"#33464c");
      door.box(inner-side*.052,sill-.15,shape.handleZ+.15,.068,.075,.39,"#798079");
      door.box(side*shape.grabX,shape.grabY,shape.grabZ,.032,.025,.12,metal);
    }
    g.quad(at(-1,0,1),at(1,0,1),at(1,1,1),at(-1,1,1),roofPaint);

    function endPoint(end,u,v,offset=0) {
      const [,,z] = at(1,end,v);
      return [mix(-1,1,u)*mix(baseHalf,roofHalf,v),mix(sill,roof,v),z+(end?1:-1)*offset];
    }
    function endPanel(end,u0,u1,v0,v1,color,offset=0,mesh=g) {
      mesh.quad(endPoint(end,u0,v0,offset),endPoint(end,u1,v0,offset),
        endPoint(end,u1,v1,offset),endPoint(end,u0,v1,offset),color);
    }
    if(windshield){
      endPanel(1,0,.035,0,1,paint);endPanel(1,.965,1,0,1,paint);
      endPanel(1,.035,.965,0,.06,paint);endPanel(1,.035,.965,.93,1,paint);
    }else endPanel(1,0,1,0,1,paint);
    endPanel(1,.035,.965,.06,.93,brightGlass,.009,windshield||g);
    endPanel(1,.04,.96,.065,.23,"#385d71",.016,windshield||g);
    endPanel(0,0,1,0,1,van ? tint(paint,"#344e60",.15) : paint);
    if (van) {
      endPanel(0,.065,.465,.46,.89,darkGlass,.011);
      endPanel(0,.53,.935,.46,.89,"#314b5f",.011);
      endPanel(0,.493,.502,.045,.94,steel,.013);
      endPanel(0,.43,.48,.24,.275,steel,.014);
    } else {
      endPanel(0,.055,.945,.075,.92,darkGlass,.008);
      endPanel(0,.09,.91,.71,.83,"#47717d",.013);
      if (kind === "coupe") {
        endPanel(0,.05,.95,.29,.33,steel,.014);
        endPanel(0,.06,.94,.48,.52,steel,.014);
      }
    }
    if (kind === "cab") {
      g.box(0,roof+.085,-.13,.62,.16,.25,"#e8b156");
      g.quad([-.24,roof+.045,-.264],[.24,roof+.045,-.264],[.24,roof+.137,-.264],[-.24,roof+.137,-.264],warmLamp);
    } else if (kind === "cruiser") {
      g.box(0,roof+.052,-.17,.93,.088,.25,steel);
      g.box(-.232,roof+.118,-.17,.395,.108,.21,"#ff556b");
      g.box(.232,roof+.118,-.17,.395,.108,.21,"#54caff");
    }
  }

  function interior(g,s){
    const [rear,,,front]=s.glass;
    g.box(0,s.floorY-.035,(rear+front)/2,s.track*1.75,.07,front-rear,"#3c4145");
    for(const side of [-1,1]){
      const x=side*s.seatX,z=s.seatZ;
      g.box(x,s.seatY-.03,z+.035,.48,.10,.47,"#555958");
      g.box(x,s.seatY-.002,z+.060,.38,.068,.39,"#999786");
      g.box(x,s.seatY+.17,z-.18,.46,.38,.10,"#646a65");
      g.box(x,s.seatY+.39,z-.20,.255,.135,.10,"#82867c");
      g.box(side*(s.hingeX-.032),s.floorY+.039,(s.back+front)/2,.095,.09,front-s.back+.05,"#6b706b");
    }
    g.box(0,s.seatY+.36,front-.10,s.track*1.55,.16,.27,"#465356");
    const wheelZ=s.seatZ+.34,wheelY=s.seatY+.38,x=-s.seatX;
    const point=a=>[x+Math.cos(a)*.137,wheelY+Math.sin(a)*.135,wheelZ+Math.sin(a)*.045];
    for(let i=0;i<10;i++)g.pole(point(i*Math.PI/5),point((i+1)*Math.PI/5),.018,"#323b40",4);
    g.box(x,wheelY,wheelZ,.17,.045,.038,"#48555a");
  }

  function endTrim(g, shape, kind) {
    const front = shape.sections[shape.sections.length-1];
    const rear = shape.sections[0];
    const face = (z,x0,x1,y0,y1,col) => g.quad([x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z],col);
    const fz = front[0]+.008, rz = rear[0]-.008;
    const fw = front[1], rw = rear[1], fh = front[2]-.04, rh = rear[2]-.05;
    face(fz,-fw+.08,fw-.08,fh-.145,fh,"#374755");
    face(fz+.003,-fw+.085,-fw+.395,fh-.101,fh-.017,warmLamp);
    face(fz+.003,fw-.395,fw-.085,fh-.101,fh-.017,warmLamp);
    face(fz+.005,-.22,.22,fh-.10,fh-.077,metal);
    face(fz,-fw+.14,fw-.14,.355,.415,steel);
    face(rz,-rw+.07,rw-.07,rh-.165,rh,"#3f3748");
    for (const side of [-1,1]) {
      const center = side*(rw-.245);
      face(rz-.004,center-.145,center+.145,rh-.132,rh-.027,redLamp);
      const reverse = side*(rw-.405);
      face(rz-.006,reverse-.025,reverse+.025,rh-.127,rh-.038,"#ffe6c0");
    }
    face(rz-.003,-.135,.135,rh-.165,rh-.072,"#f4ddae");
    face(rz,-rw+.12,rw-.12,.351,.425,kind === "coupe" ? rubber : metal);
  }

  function sideDetails(g, shape, kind, paint, doors) {
    for (const side of [-1,1]) {
      const door=doors[side],panel=(z0,z1,y0,y1,col,offset)=>{
        const cuts=[z0,...[shape.back,shape.hingeZ].filter(z=>z>z0&&z<z1),z1];
        for(let i=1;i<cuts.length;i++){const m=(cuts[i-1]+cuts[i])/2;
          sideRect(m>shape.back&&m<shape.hingeZ?door:g,shape,side,cuts[i-1],cuts[i],y0,y1,col,offset);}
      };
      panel(-.92,.93,.40,.455,rubber);
      const belt=shape.handleY;
      sideRect(door,shape,side,shape.handleZ-.07,shape.handleZ+.085,belt-.018,belt+.018,metal,.019);
      if (kind === "cab") {
        for (let i = 0; i < 5; i++) {
          const z = -.69+i*.235;
          panel(z,z+.10,.611,.674,"#40424c");
          panel(z+.10,z+.20,.546,.610,"#40424c");
        }
      } else if (kind === "cruiser") {
        panel(-.93,.90,.47,.80,"#e6e6d8");
        panel(-.93,.90,.49,.534,"#33818b",.014);
        const diamond = [[.15,.766],[.265,.702],[.15,.603],[.035,.702]];
        door.quad(...diamond.map(([z,y])=>sideAt(shape,side,z,y,.018)),"#d4a85d");
      }
      // Open-bottom mirror housings are enough at street-camera distance.
      const z = kind === "van" ? 1.09 : .56;
      const y = kind === "van" ? 1.27 : shape.glass[4]+.085;
      const x = side*(shape.track+.053);
      const topFront = [x,y+.046,z+.071], topBack = [x,y+.056,z-.074];
      const inFront = [x-side*.16,y+.025,z+.069], inBack = [x-side*.16,y+.03,z-.073];
      door.quad(topFront,topBack,inBack,inFront,paint);
      door.quad(topFront,topBack,[x,y-.031,z-.061],[x,y-.031,z+.055],steel);
      door.quad(topBack,inBack,[inBack[0],y-.029,z-.066],[x,y-.031,z-.061],brightGlass);
    }
  }

  window.buildBayBrakeLights = function buildBayBrakeLights(g,kind){
    const builder=coachwork.get(kind);if(builder){builder.brakeLights(g,kind);return;}
    const shape=bayCarLayout(kind),[z,w,h]=shape.sections[0];
    for(const side of [-1,1])g.box(side*(w-.245),h-.127,z-.020,.30,.111,.018,"#ff5447");
    g.box(0,shape.glass[4]+.061,shape.glass[0]-.01,.31,.040,.04,"#ff6b53");
  };
  window.buildBayCar = function buildBayCar(g, kind, paint, parts) {
    const shape = shapes[kind] || shapes.coupe;
    const color = typeof paint === "string" && /^#[\da-f]{6}$/i.test(paint) ? paint : shape.paint;
    const builder=coachwork.get(kind);if(builder){builder.build(g,shape,color,parts);return;}
    if(kind==="ambulance"){BayAmbulanceArt.build(g,shape,color,parts,interior);return;}
    if(kind==="wrecker"){BayWreckerArt.build(g,shape,color,parts,interior);return;}
    const doors=parts?parts.doors:{[-1]:g,1:g};
    const boot=parts?.trunk&&window.BayLuggageBootArt?.layout(kind);
    bodyMesh(g,shape,color,doors,boot,parts?.trunk);
    if(boot)BayLuggageBootArt.finish(g,parts.trunk,boot);
    for (const side of [-1,1]) {
      if(parts)wheel(parts.wheels[side],side,.085,0,shape.wheel,kind==="cab");
      else for (const axle of shape.axles) wheel(g,side,shape.track,axle,shape.wheel,kind === "cab");
    }
    cabinMesh(g,shape,kind,color,doors,parts?.windshield);interior(g,shape);
    sideDetails(g,shape,kind,color,doors);
    endTrim(g,shape,kind);
    if(parts){
      const relative=(mesh,x,y,z)=>{const a=mesh.vertices;for(let i=0;i<a.length;i+=6){a[i]-=x;a[i+1]-=y;a[i+2]-=z;}};
      const [z,w,h]=shape.sections[0];
      for(const side of [-1,1]){
        relative(doors[side],side*shape.hingeX,0,shape.hingeZ);
        relative(parts.wheels[side],0,shape.wheel,0);
        parts.reverse.box(side*(w-.405),h-.13,z-.022,.065,.094,.015,"#fffbd1");
      }
      buildBayBrakeLights(parts.brakes,kind);
    }
  };

  // Uncapped, tapered sections share joints; the shoes and head close the outline.
  function section(g, top, bottom, wt, dt, wb, db, color, sideColor) {
    function corners([x,y,z],w,d) {
      return [[x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2]];
    }
    const upper = corners(top,wt,dt), lower = corners(bottom,wb,db);
    for (let i=0; i<4; i++) {
      const next=(i+1)%4;
      g.quad(upper[i],upper[next],lower[next],lower[i],i===1 || i===0 ? sideColor : color);
    }
  }

  // An octagonal section leaves a broad, flat face for expression and costume paint.
  function bodyRing(y,w,front,back) {
    return [[-.66*w,y,front],[.66*w,y,front],[w,y,.49*front],[w,y,-back*.56],
      [.69*w,y,-back],[-.69*w,y,-back],[-w,y,-back*.56],[-w,y,.49*front]];
  }
  function joinRings(g,a,b,colors) {
    for(let i=0;i<a.length;i++){
      const j=(i+1)%a.length;
      g.quad(a[i],a[j],b[j],b[i],colors[i%colors.length]);
    }
  }
  function shoe(g,ankle,upper,heel,sole,toe) {
    const [x,y,z]=ankle;
    const outline=[[-.061,-.090],[.060,-.090],[.069,.077],[.043,.169],[-.044,.169],[-.068,.076]];
    const ring=(height,shrink)=>outline.map(([u,v])=>[x+u*shrink,y+height,z+v]);
    const bottom=ring(-.153,1),lip=ring(-.125,1);
    const leather=outline.map(([u,v],i)=>[x+u*.86,y+(i<2?-.022:i===2||i===5?-.051:-.078),z+v*.96]);
    joinRings(g,bottom,lip,[sole]);joinRings(g,lip,leather,[heel,upper,upper,toe,upper,upper]);
    g.quad(leather[0],leather[1],leather[2],leather[5],upper);
    g.quad(leather[5],leather[2],leather[3],leather[4],toe);
    g.quad([x-.038,y-.033,z-.005],[x+.038,y-.033,z-.005],[x+.035,y-.047,z+.034],[x-.035,y-.047,z+.034],sole);
  }

  window.buildBayPerson = function buildBayPerson(g,skin="#ae785c",shirt="#39af9e",trousers="#334557",phase=0,role="local",gesture=0,markPart) {
    const driver=role==="driver", runner=role==="runner", tourist=role==="tourist";
    const dock=role==="dockhand", courier=role==="courier", fisher=role==="fisher";
    const stride=Math.sin(phase),bob=.012*Math.abs(stride);
    const talking=gesture===1,reading=gesture===2;
    const top=driver?"#398e86":shirt;
    const pants=driver?"#556d80":trousers;
    const seam=tint(top,"#344b56",.26),hem=tint(pants,"#a3aca1",.30);
    const shadeSkin=tint(skin,"#613e44",.22),sunSkin=tint(skin,"#f3c59c",.21);
    const hair=driver?"#302e37":(parseInt(shirt.slice(-2),16)%2?"#543a36":"#32323b");
    const hairLight=tint(hair,"#b38b6c",.23),darkPants=tint(pants,"#283746",.22);
    const shoeTop=dock?"#947557":runner?"#79a59c":driver?"#638389":"#839594";
    const shoeHeel=dock?"#76614f":driver?"#ce9077":"#8b786a";
    const hands=[];

    for(const side of [-1,1]){
      markPart?.("leg",side);
      const swing=stride*side,hip=[side*.101,.967+bob,0];
      const knee=[side*.109,.55+bob,.112*swing+.014];
      const ankle=[side*.111,.169+.037*Math.max(0,swing),.205*swing];
      if(runner||tourist){
        const cut=runner?.76:.68, t=(hip[1]-cut)/(hip[1]-knee[1]);
        const edge=[mix(hip[0],knee[0],t),cut+bob,mix(hip[2],knee[2],t)];
        section(g,hip,edge,.179,.198,runner?.153:.162,.158,pants,darkPants);
        section(g,edge,knee,.132,.137,.121,.132,skin,shadeSkin);
        section(g,knee,ankle,.127,.137,.089,.107,skin,shadeSkin);
        g.quad([ankle[0]-.044,ankle[1],ankle[2]-.055],[ankle[0]+.044,ankle[1],ankle[2]-.055],
          [ankle[0]+.048,ankle[1]+.07,ankle[2]-.053],[ankle[0]-.048,ankle[1]+.07,ankle[2]-.053],"#d5ceaf");
      }else{
        section(g,hip,knee,.174,.195,.137,.152,pants,darkPants);
        section(g,knee,ankle,.136,.154,.11,.116,pants,darkPants);
        if(driver||dock) {
          const cuff=[ankle[0],ankle[1]+.063,ankle[2]-.003*swing];
          section(g,cuff,ankle,.119,.125,.115,.123,hem,tint(hem,"#485768",.20));
        }
      }
      shoe(g,ankle,shoeTop,shoeHeel,dock?"#5b534c":"#dcceb0",dock?"#a68867":"#c0ba9d");
      markPart?.("arm",side);
      const shoulder=[side*.204,1.410+bob,-.004];
      let sleeveEnd=[side*.237,1.268+bob,-swing*.065];
      let elbow=[side*.249,1.185+bob,-swing*.089],hand=[side*.235,1.004+bob,.039-swing*.155];
      if(gesture===4&&side===1){
        sleeveEnd=[.278,1.413+bob,.014];elbow=[.330,1.426+bob,.045];hand=[.345+.052*Math.cos(phase),1.632+bob,.11];
      }else if(gesture===3&&side===1){
        elbow=[.306,1.17,.063];hand=[.24,1.26,.19];
      } else if(talking&&side===1) {
        elbow=[.279,1.203+bob,.069];hand=[.310,1.340+bob,.19];
      } else if(reading) {
        elbow=[side*.226,1.177+bob,.062];hand=[side*.080,1.196+bob,.219];
      } else if(fisher&&side===1) {
        elbow=[.263,1.196+bob,.05];hand=[.277,1.116+bob,.146-swing*.035];
      }
      if(runner) {
        section(g,shoulder,sleeveEnd,.118,.141,.106,.12,skin,shadeSkin);
      } else {
        section(g,shoulder,sleeveEnd,.15,.17,.13,.14,top,seam);
        if(driver||dock) {
          const z=sleeveEnd[2]+.072;
          g.quad([sleeveEnd[0]-.061,sleeveEnd[1],z],[sleeveEnd[0]+.061,sleeveEnd[1],z],
            [sleeveEnd[0]+.062,sleeveEnd[1]+.025,z],[sleeveEnd[0]-.062,sleeveEnd[1]+.025,z],driver?"#8bb6a2":"#c8aa7f");
        }
      }
      section(g,sleeveEnd,elbow,.104,.114,.095,.109,skin,shadeSkin);
      section(g,elbow,hand,.101,.110,.074,.085,skin,shadeSkin);
      const fingers=[hand[0]+.006*side,hand[1]-(reading?.023:.045),hand[2]+(reading?.033:.016)];
      section(g,hand,fingers,.075,.087,.063,.070,skin,shadeSkin);
      g.quad([fingers[0]-.031,fingers[1],fingers[2]-.034],[fingers[0]+.031,fingers[1],fingers[2]-.034],
        [fingers[0]+.031,fingers[1],fingers[2]+.035],[fingers[0]-.031,fingers[1],fingers[2]+.035],shadeSkin);
      hands.push(hand);
    }

    markPart?.("body");
    const shoulders=bodyRing(1.428+bob,runner?.184:.207,.117,.114);
    const waist=bodyRing(.957+bob,.160,.103,.105);
    joinRings(g,shoulders,waist,[top,tint(top,"#f3cfa9",.10),seam,seam,top,seam,seam,top]);
    g.quad(shoulders[0],shoulders[1],shoulders[4],shoulders[5],top);
    for(const i of [1,5])g.quad(shoulders[i],shoulders[i+1],shoulders[i+2],shoulders[(i+3)%8],top);
    const chest=(x,y,side,offset=.004)=>[x,y+bob,side*(mix(side>0?.103:.105,side>0?.117:.114,(y-.957)/.471)+offset)];
    const cloth=(shape,side,color,depth=.004)=>{
      const points=shape.map(([x,y])=>chest(x,y,side,depth));
      for(let i=1;i<points.length-1;i++)g.tri(points[0],points[i],points[i+1],color);
    };
    const strap=(a,b,width,side,color,depth=.007)=>{
      const dx=b[0]-a[0],dy=b[1]-a[1],f=width*.5/Math.hypot(dx,dy),ox=dy*f,oy=-dx*f;
      cloth([[a[0]+ox,a[1]+oy],[b[0]+ox,b[1]+oy],[b[0]-ox,b[1]-oy],[a[0]-ox,a[1]-oy]],side,color,depth);
    };
    if(driver) {
      cloth([[-.063,1.427],[.065,1.427],[.031,1.26],[.058,.973],[-.055,.973],[-.032,1.23]],1,"#e6d8b5");
      for(const side of [-1,1]){
        cloth([[side*.087,1.423],[side*.120,1.389],[side*.052,1.302],[side*.040,1.39]],1,"#80ac98",.009);
        cloth([[side*.098,1.426],[side*.136,1.401],[side*.077,1.382]],-1,"#83aa96",.006);
      }
      // The repeated fan motif also reads from the chase camera.
      for(const [u,y,s,flip] of [[-.067,1.315,-1,1],[.074,1.24,-1,-1],[-.045,1.105,-1,-1],[.068,1.03,-1,1],
        [-.095,1.205,1,1],[.091,1.095,1,-1]]){
        cloth([[u-.013*flip,y-.040],[u+.002*flip,y+.010],[u+.043*flip,y+.044],[u+.024*flip,y+.005]],s,"#a4b698",.009);
        cloth([[u+.002*flip,y+.005],[u-.038*flip,y+.026],[u-.031*flip,y+.045]],s,"#d8a289",.010);
      }
      cloth([[-.074,1.417],[.070,1.417],[.030,1.389],[-.049,1.388]],-1,"#5e9e91",.008);
      cloth([[-.117,1.00],[-.041,.997],[-.043,.963],[-.087,.950],[-.114,.96]],-1,"#718399",.012);
    }else if(dock||fisher){
      const vest=dock?"#d2a26a":"#909a78", trim=dock?"#e3d594":"#b0ac8c";
      for(const side of [-1,1]){
        cloth([[side*.11,1.422],[side*.045,1.422],[side*.036,.993],[side*.128,1.012],[side*.14,1.24]],1,vest);
        cloth([[side*.123,1.25],[side*.041,1.241],[side*.042,1.214],[side*.126,1.224]],1,trim,.009);
        cloth([[side*.122,1.139],[side*.050,1.134],[side*.05,1.07],[side*.115,1.073]],1,tint(vest,"#655f53",.22),.011);
      }
      cloth([[-.128,1.42],[.128,1.42],[.109,.997],[-.108,.997]],-1,vest);
      if(dock){
        strap([-.107,1.363],[.104,1.125],.028,-1,trim,.013);
        strap([.107,1.363],[-.104,1.125],.028,-1,trim,.014);
      }
    }else if(courier){
      for(const side of [-1,1])strap([-.117,1.41],[.125,1.027],.036,side,"#705f54");
      g.box(.140,1.011+bob,.086,.186,.172,.100,"#a78666");
      g.quad([.042,1.088+bob,.139],[.236,1.088+bob,.139],[.218,1.018+bob,.144],[.060,1.018+bob,.144],"#c29d70");
    }else if(runner){
      for(const side of [-1,1]) {
        strap([-.111,1.385],[.103,1.219],.042,side,"#d7c49b");
        strap([-.097,1.332],[.110,1.174],.016,side,"#ca8e78");
      }
    }else if(tourist){
      strap([-.093,1.413],[-.042,1.231],.014,1,"#4f5053");
      strap([.088,1.413],[.044,1.232],.014,1,"#4f5053");
      g.box(0,1.216+bob,.153,.132,.082,.057,"#637375");
      g.quad([-.033,1.191+bob,.184],[.031,1.191+bob,.184],[.031,1.241+bob,.184],[-.033,1.241+bob,.184],"#2c434d");
    }else {
      cloth([[-.12,1.32],[-.041,1.32],[-.045,1.253],[-.087,1.235],[-.12,1.249]],1,tint(top,"#f2d2ad",.21));
    }
    section(g,[0,1.558+bob,0],[0,1.422+bob,0],.100,.105,.111,.123,skin,shadeSkin);

    markPart?.("head");
    const pitch=reading?.24:(talking?-.035:0),yaw=talking?.15:0;
    const sn=Math.sin(pitch),cs=Math.cos(pitch),turn=Math.sin(yaw),fwd=Math.cos(yaw);
    function head(p) {
      const h=p[1]-1.515,py=h*cs-p[2]*sn,pz=h*sn+p[2]*cs;
      return [p[0]*fwd+pz*turn,1.515+py+bob,-p[0]*turn+pz*fwd];
    }
    const ring=(y,w,fr,bk)=>bodyRing(y,w,fr,bk).map(head);
    const headTri=(a,b,c,color)=>g.tri(head(a),head(b),head(c),color);
    const headQuad=(a,b,c,d,color)=>g.quad(head(a),head(b),head(c),head(d),color);
    const jaw=ring(1.519,.074,.077,.066),cheeks=ring(1.613,.099,.103,.088),brow=ring(1.692,.096,.094,.092);
    const tones=[skin,sunSkin,shadeSkin,shadeSkin,shadeSkin,shadeSkin,skin,sunSkin];
    joinRings(g,brow,cheeks,tones);joinRings(g,cheeks,jaw,tones);
    headTri([-.019,1.660,.102],[.013,1.660,.102],[.004,1.606,.124],sunSkin);
    headTri([.013,1.660,.102],[.022,1.605,.101],[.004,1.606,.124],shadeSkin);
    headQuad([-.021,1.579,.096],[.024,1.579,.096],[.014,1.574,.095],[-.018,1.574,.095],tint(skin,"#824f52",.61));
    for(const side of [-1,1]){
      headTri([side*.095,1.650,.015],[side*.112,1.627,.006],[side*.094,1.592,.019],sunSkin);
      headQuad([side*.026,1.657,.101],[side*.061,1.658,.101],[side*.059,1.648,.102],[side*.027,1.648,.102],"#574a46");
      headTri([side*.024,1.679,.1],[side*.068,1.676,.097],[side*.031,1.669,.101],hair);
    }
    const capped=tourist||dock||fisher;
    const hairline=ring(1.687,.101,.092,.096);
    const crown=ring(driver?1.753:1.751,.094,driver?.121:.091,.090);
    joinRings(g,hairline,crown,[hair,hairLight,hair,hair,hair,hair,hair,hairLight]);
    const crest=head([driver?-.034:.008,driver?1.801:1.778,driver?.037:0]);
    for(let i=0;i<8;i++)g.tri(crown[i],crown[(i+1)%8],crest,i%3?hair:hairLight);
    headQuad([-.075,1.704,-.095],[.076,1.704,-.095],[.065,1.608,-.091],[-.062,1.597,-.091],hair);
    if(driver) {
      headTri([-.090,1.724,.087],[.062,1.717,.107],[-.067,1.665,.102],hair);
      headTri([-.079,1.753,-.055],[-.011,1.773,-.067],[-.060,1.713,-.092],hairLight);
      headTri([.027,1.745,-.092],[.078,1.737,-.069],[.046,1.688,-.096],hairLight);
    } else if(capped){
      const hat=tourist?"#cfb07d":fisher?"#839680":"#557e83";
      const brim=ring(1.721,tourist?.145:.11,tourist?.15:.154,tourist?.135:.094);
      const cap=ring(1.743,.104,.097,.098),upper=ring(tourist?1.806:1.777,.079,.078,.07);
      joinRings(g,brim,cap,[tint(hat,"#6d6a5b",.19)]);
      joinRings(g,cap,upper,[hat,hat,tint(hat,"#cec49d",.19),hat]);
      const topPoint=head([0,tourist?1.810:1.802,0]);
      for(let i=0;i<8;i++)g.tri(upper[i],upper[(i+1)%8],topPoint,hat);
    } else if(runner){
      joinRings(g,ring(1.678,.102,.099,.097),ring(1.704,.104,.10,.097),["#deaa83"]);
    }
    if(reading){
      g.quad([-.059,1.177+bob,.241],[.047,1.177+bob,.241],[.047,1.252+bob,.209],[-.059,1.252+bob,.209],"#394f59");
      g.quad([-.047,1.185+bob,.235],[.036,1.185+bob,.235],[.036,1.242+bob,.212],[-.047,1.242+bob,.212],"#9fbdb0");
    }
    if(fisher){
      markPart?.("held",1);
      const h=hands[1],grip=[h[0]+.006,h[1]-.095,h[2]-.023];
      const join=[h[0]+.054,h[1]+.37,h[2]+.14],tip=[h[0]+.078,h[1]+.80,h[2]+.33];
      g.pole(grip,join,.012,"#92745a",4);
      g.pole(join,tip,.007,"#637777",4);
    }
    if(role==="photographer")BayExposureArt.dress(g,markPart);
    if(role==="ferry-engineer")BayFerryPassengerArt.dress(g,markPart);
  };
})();
