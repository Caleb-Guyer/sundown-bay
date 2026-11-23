(() => {
  "use strict";
  const teal="#39716e",deep="#304f53",mint="#a9c3ad",ivory="#eee2c3",steel="#788b87";
  const gold="#e9b967",umber="#8e6b52",ply="#b99468",ink="#353d42",red="#bc4b3e";
  const launch=BayTake.ramp;
  const ramp={x:launch.x,z:launch.toe},rampLength=launch.lip-launch.toe,rise=launch.height;
  const rigs=[{x:65.7,z:39,yaw:1.31},{x:78.2,z:57.2,yaw:-1.79}];
  const reflector={x:65.4,z:50.4,yaw:1.67};
  const cones=[{x:68.7,z:24.8},{x:75.4,z:24.8},{x:65.9,z:19.5},{x:78.2,z:65.2}];
  const barriers=[{x:66.35,z:9.2,yaw:-.28},{x:77.6,z:87.4,yaw:.31}];
  const boardLocal={x:1.55,z:-2.35};
  function invitePoint(v) {
    const c=Math.cos(v.yaw||0),s=Math.sin(v.yaw||0);
    return {x:v.x+c*boardLocal.x+s*boardLocal.z,z:v.z-s*boardLocal.x+c*boardLocal.z};
  }
  function bands(g,rows,col) {
    const edges=rows.map(([z,w,low,top])=>[[-w,low,z],[-w,top,z],[w,top,z],[w,low,z]]);
    for(let i=1;i<edges.length;i++)for(let j=0;j<4;j++){
      const a=edges[i-1],b=edges[i],k=(j+1)%4;
      g.quad(a[j],b[j],b[k],a[k],col,[.90,1.06,.99,.72][j]);
    }
    for(const a of [edges[0],edges.at(-1)])g.quad(...a,col,.95);
  }
  function deckCorner(g,x,z) {
    const sx=Math.sign(x),sz=Math.sign(z),h=1.216;
    g.quad([x,h,z],[x-sx*.61,h,z],[x-sx*.61,h,z-sz*.11],[x,h,z-sz*.11],ivory);
    g.quad([x,h,z],[x,h,z-sz*.86],[x-sx*.11,h,z-sz*.86],[x-sx*.11,h,z],ivory);
  }
  function wheelPair(g,track) {
    const radius=.51;
    for(const side of [-1,1]){
      const outer=side*track,inner=side*(track-.32),hub=outer+side*.012;
      const at=(x,r,a)=>[x,Math.cos(a)*r,Math.sin(a)*r];
      for(let i=0;i<14;i++){
        const a=i*Math.PI/7,b=(i+1)*Math.PI/7;
        g.quad(at(outer,radius,a),at(outer,radius,b),at(inner,radius,b),at(inner,radius,a),i%2?"#2c3338":"#343b40");
        g.quad(at(outer,radius,a),at(outer,radius,b),at(outer,.29,b),at(outer,.29,a),"#2a3136");
        g.tri([hub,0,0],at(hub,.282,a),at(hub,.282,b),i%3===1?"#687c79":"#a2aaa0");
      }
      g.box(hub+side*.022,0,0,.055,.175,.175,teal);
    }
  }
  function cabDriver(g) {
    const x=-.54,z=4.12;
    g.box(x,1.64,z,.42,.48,.29,"#678484");
    g.box(x,2.022,z+.015,.25,.30,.225,"#ac7956");
    g.box(x,2.174,z,.29,.094,.25,"#48413b");
    g.box(x,2.15,z+.067,.315,.042,.27,gold);
    for(const s of [-1,1]){
      g.pole([x+s*.176,1.8,z+.02],[x+s*.224,1.63,z+.35],.061,"#9f7054",5);
      g.pole([x+s*.224,1.63,z+.35],[x+s*.164,1.72,z+.55],.055,"#b18160",5);
    }
  }
  function flatbed(g) {
    // The top of the planks is the collision surface at 1.20 m. Keep the edges flush.
    for(const side of [-1,1]){
      g.box(side*.71,.67,.81,.19,.35,8.75,deep);
      g.box(side*1.962,1.06,0,.076,.27,7.1,teal);
      for(const z of [-2.91,-.98,.98,2.91])
        g.box(side*2,1.073,z,.013,.095,.26,gold);
    }
    g.box(0,1.006,0,3.92,.19,7.10,deep);
    const boards=["#ad8760","#b99670","#ae8a67","#c4a07a","#b48c65","#c09d77","#ad8b68"];
    for(let i=0;i<boards.length;i++)g.box((i-3)*.55,1.155,0,.538,.09,7.09,boards[i]);
    for(const x of [-1.85,1.85])for(const z of [-3.30,3.30])deckCorner(g,x,z);
    for(const x of [-1.32,1.32])for(const z of [-2.23,.32,2.58])
      g.quad([x-.095,1.208,z-.032],[x-.095,1.208,z+.032],[x+.095,1.208,z+.032],[x+.095,1.208,z-.032],"#776c5b");
    g.box(0,.91,-3.48,3.94,.25,.16,teal);
    for(const s of [-1,1]){
      g.box(s*1.61,.92,-3.576,.52,.125,.035,"#8d4543");
      g.box(s*1.73,.92,-3.597,.14,.083,.012,"#e48765");
      g.box(s*1.26,.52,-3.24,.62,.61,.055,"#344348");
      g.box(s*1.17,.80,3.97,.57,.15,1.62,steel);
      g.box(s*1.22,.50,4.08,.46,.13,.86,deep);
    }
    g.box(.05,.91,-3.577,.54,.17,.03,"#d5c398");
    bands(g,[[3.48,.98,.72,1.53],[3.68,1.18,.72,1.63],[4.82,1.18,.73,1.61],
      [5.39,1.10,.80,1.44],[5.99,1.04,.82,1.38],[6.10,.94,.91,1.32]],teal);
    g.box(0,1.17,3.61,2.06,.68,.09,teal);
    // Open side windows expose Jules and the truck's bench seat.
    g.box(0,1.48,4.04,1.84,.16,.62,"#5a544e");
    g.box(0,1.69,3.85,1.84,.39,.105,"#645d50");
    cabDriver(g);
    for(const s of [-1,1]){
      g.box(s*1.133,1.59,4.16,.052,.16,1.17,ivory);
      g.pole([s*1.08,1.65,3.68],[s*.99,2.34,3.76],.075,teal,4);
      g.pole([s*1.075,1.63,4.95],[s*.99,2.34,4.69],.062,mint,4);
      g.box(s*1.184,1.45,3.88,.055,.055,.23,steel);
      g.pole([s*1.13,1.77,4.73],[s*1.48,1.97,4.57],.03,steel,4);
      g.box(s*1.48,2.01,4.57,.08,.22,.14,deep);
      g.box(s*.82,1.25,6.064,.33,.19,.087,ivory);
      g.box(s*.88,.99,6.102,.16,.07,.06,gold);
    }
    g.quad([-.98,2.32,3.755],[.98,2.32,3.755],[1.06,1.68,3.665],[-1.06,1.68,3.665],teal);
    g.quad([-.78,2.21,3.729],[.78,2.21,3.729],[.795,1.80,3.673],[-.795,1.80,3.673],"#648688");
    g.quad([-1.01,2.32,4.72],[1.01,2.32,4.72],[1.10,1.665,4.976],[-1.10,1.665,4.976],"#517f8a");
    g.quad([-1.04,1.782,4.935],[1.04,1.782,4.935],[1.066,1.708,4.966],[-1.066,1.708,4.966],"#93aeaa");
    g.pole([0,1.67,4.986],[0,2.32,4.73],.027,ivory,4);
    bands(g,[[3.56,.98,2.30,2.36],[3.73,1.11,2.29,2.45],[4.68,1.12,2.29,2.45],[4.94,1.06,2.30,2.38]],ivory);
    g.box(0,1.118,6.104,1.25,.29,.05,deep);
    for(let i=0;i<3;i++)g.box(0,1.017+i*.092,6.147,1.22,.032,.016,"#b8b9a6");
    g.box(0,.80,6.144,2.32,.11,.19,steel);
    g.box(0,1.49,5.18,.83,.04,.35,"#6e9990");
  }

  function rampModel(g) {
    const py=z=>.02+z/rampLength*(rise-.02);
    const top=(x0,x1,z0,z1,col,lift=0)=>g.quad([x0,py(z0)+lift,z0],[x0,py(z1)+lift,z1],
      [x1,py(z1)+lift,z1],[x1,py(z0)+lift,z0],col);
    top(-2,2,0,10,"#b99c70");
    for(const side of [-1,1]){
      const x=side*1.96;top(x-.04,x+.04,0,10,ivory,.009);
      g.pole([x,.04,.15],[x,rise-.05,10],.075,"#946e50",4);
      g.pole([x,.10,1.8],[x,.10,9.95],.066,umber,4);
      for(const z of [2.65,5.1,7.55,9.91]){
        const h=py(z)-.075;
        g.pole([x,.055,z],[x,h,z],.073,ply,4);
        g.pole([x,.12,z-2.2],[x,h,z],.05,"#99856a",4);
      }
      const tire=side*.86;
      top(tire-.26,tire+.26,0,10,"#766e61",.005);
    }
    for(const z of [1.6,3.37,5.14,6.91,8.68])top(-1.92,1.92,z,z+.053,"#90795b",.013);
    top(-1.94,1.94,9.72,9.93,gold,.018);
    const point=(x,z)=>[x,py(z)+.022,z];
    for(const z of [4.47,6.30])for(const side of [-1,1])
      g.quad(point(0,z+.58),point(side*.48,z-.06),point(side*.48,z-.38),point(0,z+.23),ivory);
    g.box(0,rise-.10,9.91,4.0,.19,.18,"#8d694c");
    for(const x of [-1.43,0,1.43])g.pole([x,.12,9.85],[x,rise-.10,9.85],.071,umber,4);
  }

  const palmTrunk=[[-.27,.08],[-.03,1.42],[.31,2.52],[.48,2.50],[.19,1.39],[.045,.09]];
  // A painted scenic flat with a bare plywood reverse. Each leaf has a fold painted down its centre.
  const leaves=[
    [[.31,2.44],[-.48,2.99],[-1.72,2.78],[-.53,2.72]],
    [[.35,2.48],[-.40,2.47],[-1.76,1.74],[-.59,2.50]],
    [[.36,2.45],[-.12,2.23],[-.66,1.44],[-.43,2.24]],
    [[.34,2.53],[.98,3.13],[1.71,3.17],[.98,2.89]],
    [[.36,2.55],[1.29,2.86],[2.11,2.52],[1.22,2.62]],
    [[.37,2.52],[1.21,2.34],[1.81,1.66],[1.14,2.13]],
    [[.36,2.51],[.44,2.95],[.06,3.35],[.64,2.98]]
  ];
  function palmPoint(p,z){return [p[0],p[1],z];}
  function palm(g) {
    function cut(points,color){
      const front=points.map(p=>palmPoint(p,-.048)),back=points.map(p=>palmPoint(p,.042));
      for(let i=1;i<points.length-1;i++){
        g.tri(front[0],front[i],front[i+1],color);
        g.tri(back[0],back[i+1],back[i],ply);
      }
      for(let i=0;i<points.length;i++){
        const j=(i+1)%points.length;g.quad(front[i],front[j],back[j],back[i],"#caa57c");
      }
    }
    cut(palmTrunk,"#ad7760");
    for(const [i,leaf] of leaves.entries()){
      cut(leaf,i%2?"#659783":"#467d75");
      g.tri(palmPoint(leaf[0],-.052),palmPoint(leaf[3],-.052),palmPoint(leaf[2],-.052),i%2?"#376b65":"#8bb49a");
    }
    g.pole([-.10,.18,.075],[.36,2.54,.075],.055,umber,4);
    g.box(-.11,.30,-.060,.15,.053,.019,"#d9b77f");
  }
  function palmFoot(g) {
    g.box(0,.09,0,.88,.18,.62,ply);
    for(const s of [-1,1])g.box(s*.32,.15,.03,.14,.11,.76,umber);
    g.box(0,.22,0,.43,.17,.16,"#756b59");
  }
  function tripod(g,height,reach,col) {
    for(let i=0;i<3;i++){
      const a=Math.PI*2*i/3+.35,x=Math.cos(a)*reach,z=Math.sin(a)*reach;
      g.pole([x,.045,z],[x*.11,height,z*.11],.046,col,5);
      g.box(x,.045,z,.16,.085,.14,"#464546");
    }
  }
  function filmCamera(g) {
    tripod(g,1.28,.67,umber);
    g.box(0,1.32,0,.33,.13,.28,"#525c57");
    g.box(0,1.62,.01,.37,.38,.64,deep);
    for(const z of [-.18,.15]){
      // The reels sit side by side above the film chamber.
      g.pole([-.136,1.89,z],[.135,1.89,z],.18,"#535c58",10);
      for(const side of [-1,1]){
        const x=side*.137;
        for(let i=0;i<10;i++){
          const a=i*Math.PI/5,b=(i+1)*Math.PI/5;
          g.tri([x,1.89,z],[x,1.89+Math.cos(a)*.18,z+Math.sin(a)*.18],
            [x,1.89+Math.cos(b)*.18,z+Math.sin(b)*.18],i%3?steel:deep);
        }
      }
    }
    g.pole([0,1.65,.28],[0,1.65,.53],.11,ink,8);
    g.box(0,1.65,.56,.37,.22,.075,ink);
    g.box(0,1.65,.60,.145,.10,.012,"#648a90");
    g.pole([.075,1.37,-.12],[.17,1.13,-.64],.031,ink,4);
  }
  function bounceBoard(g) {
    tripod(g,1.04,.70,steel);
    g.pole([0,.90,0],[0,1.83,0],.039,steel,5);
    g.box(0,1.77,0,1.64,1.53,.065,"#67716b");
    g.quad([-.77,1.05,.036],[.77,1.05,.036],[.77,2.48,.036],[-.77,2.48,.036],"#f1ddaa");
    g.quad([-.76,1.05,.038],[.77,2.48,.038],[-.76,2.48,.038],[-.77,1.51,.038],"#e0d1a5");
    g.box(0,1.78,-.043,1.59,.06,.035,"#91a091");
  }
  function cone(g) {
    g.box(0,.035,0,.47,.07,.47,"#595749");
    g.cyl(0,.30,0,.052,.178,.51,7,"#c0784e");
    g.cyl(0,.34,0,.088,.119,.113,7,ivory);
  }
  function barrier(g) {
    for(const x of [-.79,.79])for(const s of [-1,1])
      g.pole([x,.05,s*.37],[x,.91,s*.05],.062,umber,4);
    g.box(0,.84,0,2.39,.26,.14,ivory);
    for(const side of [-1,1])for(let i=0;i<5;i++){
      const x=-1.05+i*.424,z=side*.073;
      g.quad([x,.73,z],[x+.17,.73,z],[x+.34,.95,z],[x+.17,.95,z],"#bb744f");
    }
  }
  function slate(g) {
    g.box(0,.20,0,.92,.40,.67,"#a17f5d");
    g.box(0,.407,0,.94,.04,.69,"#bea380");
    for(const s of [-1,1])g.box(0,.24,s*.337,.26,.072,.013,"#614f44");
    g.box(0,.765,0,.84,.65,.07,ink);
    const face=(x,y,side)=>[x,y,side*.044];
    for(const side of [-1,1]){
      const line=(x,y,w,h,col)=>g.quad(face(x,y,side),face(x+w,y,side),face(x+w,y+h,side),face(x,y+h,side),col);
      line(-.35,.85,.70,.017,ivory);line(-.35,.65,.70,.015,ivory);
      line(-.055,.67,.012,.155,ivory);line(.15,.67,.012,.155,ivory);
      line(-.32,.758,.16,.022,"#d6c6a3");line(-.30,.562,.35,.023,"#d6c6a3");
      for(let i=0;i<4;i++){
        const x=-.405+i*.204;
        g.quad(face(x,1.00,side),face(x+.108,1.00,side),face(x+.18,1.079,side),face(x+.072,1.079,side),ivory);
      }
      // The raised clapstick opens about its left hinge.
      const arm=(x,y)=>[x,1.09+(x+.414)*.25+y,side*.043];
      g.quad(arm(-.414,0),arm(.41,0),arm(.41,.102),arm(-.414,.102),ink);
      for(let i=0;i<4;i++){
        const x=-.403+i*.204;
        g.quad(arm(x,.007),arm(x+.106,.007),arm(x+.177,.095),arm(x+.07,.095),ivory);
      }
    }
    g.box(-.379,1.075,0,.052,.065,.099,gold);
  }
  function romyDriver(g) {
    const shape=bayCarLayout("coupe"),x=-shape.seatX,y=shape.seatY,z=shape.seatZ;
    g.box(x,y+.23,z,.36,.34,.18,"#ae705b");
    g.box(x,y+.50,z,.185,.235,.164,"#b8886a");
    g.box(x,y+.601,z-.012,.205,.087,.185,"#503a39");
    g.box(x-.055,y+.545,z-.113,.12,.13,.11,"#503a39");
    // A magnetic roof roundel lets the camera crew pick out 27 from above.
    for(let i=0;i<18;i++){
      const a=Math.PI*i/9,b=Math.PI*(i+1)/9;
      g.tri([0,1.338,-.245],[.39*Math.cos(a),1.338,-.245+.302*Math.sin(a)],
        [.39*Math.cos(b),1.338,-.245+.302*Math.sin(b)],ivory);
    }
    for(const digit of roofDigits)for(let i=1;i<digit.length;i++){
      const [x0,z0]=digit[i-1],[x1,z1]=digit[i],dx=x1-x0,dz=z1-z0,k=.021/Math.hypot(dx,dz);
      const at=(x,z,side)=>[x-side*dz*k,1.343,z+side*dx*k];
      g.quad(at(x0,z0,1),at(x1,z1,1),at(x1,z1,-1),at(x0,z0,-1),ink);
    }
  }
  const roofDigits=[[[-.214,-.20],[-.177,-.13],[-.063,-.13],[-.043,-.19],[-.18,-.34],[-.035,-.34]],
    [[.024,-.135],[.198,-.135],[.082,-.345]]];
  function install(model) {
    model("take-flatbed",flatbed);
    model("take-front-axle",g=>wheelPair(g,1.14));
    model("take-rear-axle",g=>wheelPair(g,1.58));
    model("take-ramp",rampModel);
    model("take-palm-flat",palm);model("take-palm-foot",palmFoot);
    model("take-film-camera",filmCamera);model("take-reflector",bounceBoard);
    model("take-cone",cone);model("take-barrier",barrier);model("take-slate",slate);model("take-romy",romyDriver);
    model("coupe"+red,g=>buildBayCar(g,"coupe",red));
    BayMeetArt.install(model);
  }
  function world(list,run,see,groundAt) {
    if(!run)return;
    const ground=(p)=>groundAt(p.x,p.z)+.012;
    const add=(name,p,yaw,pitch=0)=>{
      if(see(p,94))list.push([name,p.x,ground(p),p.z,yaw||0,pitch]);
    };
    add("take-ramp",ramp,0);
    for(const p of rigs)add("take-film-camera",p,p.yaw);
    add("take-reflector",reflector,reflector.yaw);
    for(const p of cones)add("take-cone",p,0);
    for(const p of barriers)add("take-barrier",p,p.yaw);
    for(const p of run.palms||[]){
      add("take-palm-foot",p,p.yaw);
      add("take-palm-flat",p,p.yaw,Math.min(1,Math.max(0,p.fall||0))*1.50);
    }
    const a=run.truck,b=run.coupe;
    if(a&&see(a,125)){
      const yaw=a.yaw||0,s=Math.sin(yaw),c=Math.cos(yaw),y=ground(a)+(a.y||0);
      const pitch=a.pitch||0,lean=a.lean||0;
      list.push(["take-flatbed",a.x,y,a.z,yaw,pitch,lean]);
      for(const z of [-2.38,-1.20,5.19]){
        const wy=.51*Math.cos(pitch)-z*Math.sin(pitch),wz=.51*Math.sin(pitch)+z*Math.cos(pitch),wx=-wy*Math.sin(lean);
        list.push([z<0?"take-rear-axle":"take-front-axle",a.x+wx*c+wz*s,y+wy*Math.cos(lean),a.z-wx*s+wz*c,yaw,pitch+(a.wheelSpin||0),lean]);
      }
    }
    if(b&&see(b,125)){
      const pose=[b.x,ground(b)+(b.y||0),b.z,b.yaw||0,b.pitch||0,b.lean||0];
      list.push(["coupe"+red,...pose],["meet-rival",...pose],["take-romy",...pose]);
    }
  }
  function inviteWorld(list,romyCar,see){
    if(!romyCar)return;
    const p=invitePoint(romyCar);
    if(see(p,55))list.push(["take-slate",p.x,.085,p.z,-.12]);
  }

  function polygon(c,pts,color) {
    c.fillStyle=color;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fill();
  }
  function line(c,pts,color,w) {
    c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.stroke();
  }
  function rect(c,x,z,w,d,col){c.fillStyle=col;c.fillRect(x,z,w,d);}
  function mapRamp(c) {
    rect(c,-2.03,0,4.06,10,"#786951");
    const grain=c.createLinearGradient(0,0,0,10);
    grain.addColorStop(0,"#b09a75");grain.addColorStop(1,"#d4b78b");
    rect(c,-1.97,.01,3.94,9.96,grain);
    for(const s of [-1,1]){
      rect(c,s*.86-.26,0,.52,10,"#807668");
      rect(c,s*1.96-.04,0,.08,10,ivory);
    }
    for(const z of [1.6,3.37,5.14,6.91,8.68])rect(c,-1.92,z,3.84,.065,"#977a56");
    for(const z of [4.47,6.30])line(c,[[-.48,z-.18],[0,z+.48],[.48,z-.18]],ivory,.20);
    rect(c,-1.94,9.72,3.88,.21,gold);
  }
  function mapTruck(c,v) {
    polygon(c,[[-2.05,-3.56],[2.08,-3.56],[2.18,-3.35],[2.08,3.61],[1.29,3.73],[1.23,6.10],[.93,6.30],[-1.11,6.22],[-1.27,5.97],[-1.25,3.67],[-2.02,3.60]],"rgba(37,48,47,.34)");
    for(const side of [-1,1])for(const z of [-2.38,-1.20,5.19]){
      const track=z<0?1.48:1.07;rect(c,side*track-.17,z-.50,.34,1,ink);
    }
    rect(c,-2,-3.55,4,7.10,deep);
    const colors=["#ad8760","#b99670","#ae8a67","#c4a07a","#b48c65","#c09d77","#ad8b68"];
    for(let i=0;i<7;i++)rect(c,(i-3)*.55-.269,-3.545,.538,7.09,colors[i]);
    for(const side of [-1,1]){
      for(const end of [-1,1]){
        const x=side*1.85,z=end*3.30;
        line(c,[[x-side*.61,z],[x,z],[x,z-end*.86]],ivory,.12);
      }
      rect(c,side*1.63-.25,-3.56,.50,.13,v.brakes>.16?"#f08063":"#a24f42");
    }
    polygon(c,[[-1.10,3.50],[1.10,3.50],[1.18,3.81],[1.18,4.78],[1.09,5.85],[.94,6.12],[-.94,6.12],[-1.08,5.85],[-1.18,4.78],[-1.18,3.81]],teal);
    rect(c,-.99,3.66,1.98,.26,"#587d80");
    rect(c,-1.105,3.78,2.21,.87,ivory);
    rect(c,-1.17,4.02,.10,.27,"#aa7e5b");
    polygon(c,[[-1.01,4.64],[1.01,4.64],[1.09,5.00],[-1.09,5.00]],"#598895");
    rect(c,-.021,4.62,.042,.40,ivory);
    rect(c,-.415,5.16,.83,.23,"#7fa095");
    rect(c,-1.16,6.09,2.32,.13,steel);
    for(const side of [-1,1]){
      rect(c,side*.81-.15,5.99,.30,.12,ivory);
      rect(c,side*1.43-.07,4.57,.14,.25,deep);
    }
  }
  function mapPalm(c,fall) {
    rect(c,-.45,-.31,.90,.62,ply);rect(c,-.31,-.08,.62,.16,umber);
    const f=Math.min(1,Math.max(0,fall||0)),k=.28+.72*Math.sin(f*1.50);
    const planar=p=>[p[0],p[1]*k];
    polygon(c,palmTrunk.map(planar),"#a17258");
    for(const [i,leaf] of leaves.entries()){
      polygon(c,leaf.map(planar),i%2?"#659783":"#467d75");
      polygon(c,[planar(leaf[0]),planar(leaf[3]),planar(leaf[2])],i%2?"#376b65":"#8bb49a");
    }
  }
  function mapCamera(c) {
    for(let i=0;i<3;i++){
      const a=Math.PI*2*i/3+.35;
      line(c,[[Math.cos(a)*.67,Math.sin(a)*.67],[0,0]],umber,.11);
    }
    rect(c,-.2,-.34,.40,.66,deep);rect(c,-.17,.31,.34,.28,ink);
    for(const z of [-.22,.11])rect(c,-.15,z,.30,.21,steel);
  }
  function map(c,opt,px,py,s,ui,visible,carSprite) {
    const run=opt.take;if(!run)return;
    const near=(p,r)=>p&&visible(px(p.x),py(p.z),r*s);
    const local=(p,render)=>{
      c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw||0);c.scale(s,-s);render();c.restore();
    };
    if(opt.mode!=="street"){
      if(opt.mode==="atlas"&&opt.marina?.bayChart)return;
      if(near(ramp,10))local(ramp,()=>{
        const min=ui/Math.max(.01,s);
        line(c,[[-2.1,-.4],[-2.1,10],[2.1,10],[2.1,-.4]],gold,Math.max(.27,min));
      });
      if(near(run.truck,7))local(run.truck,()=>{rect(c,-2,-3.55,4,7.1,ply);rect(c,-1.17,3.55,2.34,2.58,mint);});
      if(near(run.coupe,3))local(run.coupe,()=>rect(c,-.92,-2.13,1.84,4.23,red));
      return;
    }
    if(near(ramp,12))local(ramp,()=>mapRamp(c));
    for(const p of rigs)if(near(p,2))local(p,()=>mapCamera(c));
    if(near(reflector,2))local(reflector,()=>{
      line(c,[[-.62,-.48],[0,0],[.47,-.57]],steel,.10);
      polygon(c,[[-.84,-.12],[.84,-.12],[.84,.34],[-.84,.34]],ivory);
      line(c,[[-.80,.32],[.80,.32]],steel,.08);
    });
    for(const p of cones)if(near(p,1))local(p,()=>{
      rect(c,-.24,-.24,.48,.48,"#675c4c");c.fillStyle="#c78255";c.beginPath();c.arc(0,0,.17,0,Math.PI*2);c.fill();
      rect(c,-.05,-.05,.10,.10,ivory);
    });
    for(const p of barriers)if(near(p,2))local(p,()=>{
      for(const x of [-.79,.79])rect(c,x-.06,-.37,.12,.74,umber);
      rect(c,-1.195,-.11,2.39,.22,ivory);
      for(let i=0;i<5;i++){
        const x=-1.05+i*.424;polygon(c,[[x,-.105],[x+.17,-.105],[x+.30,.105],[x+.13,.105]],"#bb744f");
      }
    });
    for(const p of run.palms||[])if(near(p,4))local(p,()=>mapPalm(c,p.fall));
    const a=run.truck,b=run.coupe;
    if(near(a,8))local(a,()=>mapTruck(c,a));
    if(near(b,9)){
      const lift=Math.max(0,b.y||0),above=Math.max(0,lift-(run.phase==="landed"?1.2:0));
      const dx=-Math.min(1.12,above*.15)*s,dy=-Math.min(1.2,above*.17)*s;
      const actual=s*(1+Math.min(above,5)*.027);
      if(lift>.18)local(b,()=>{c.fillStyle="rgba(38,46,48,.39)";c.beginPath();c.ellipse(.13,-.14,1.02,2.17,0,0,2*Math.PI);c.fill();});
      carSprite(c,b.color===red&&b.kind==="coupe"?b:{...b,kind:"coupe",color:red},px(b.x)+dx,py(b.z)+dy,actual,opt.time||0);
      c.save();c.translate(px(b.x)+dx,py(b.z)+dy);c.rotate(b.yaw||0);c.scale(actual,-actual);
      for(const [z,h] of [[.96,1.07],[-2.03,.67]]){
        rect(c,-.38,z,.24,h,ivory);rect(c,-.055,z,.042,h,ivory);
      }
      c.fillStyle=ivory;c.beginPath();c.ellipse(0,-.245,.39,.302,0,0,Math.PI*2);c.fill();
      c.lineJoin="round";for(const digit of roofDigits)line(c,digit,ink,.05);
      c.restore();
    }
  }
  function inviteMap(c,car,px,py,s,visible) {
    if(!car)return;
    const p=invitePoint(car);
    if(!visible(px(p.x),py(p.z),2*s))return;
    c.save();c.translate(px(p.x),py(p.z));c.rotate(-.12);c.scale(s,-s);
    rect(c,-.46,-.335,.92,.67,ply);rect(c,-.423,-.16,.846,.33,ink);
    for(let i=0;i<4;i++)polygon(c,[[-.405+i*.204,.052],[-.309+i*.204,.052],[-.258+i*.204,.139],[-.351+i*.204,.139]],ivory);
    rect(c,-.34,-.082,.38,.029,ivory);c.restore();
  }
  window.BayTakeArt={install,world,map,inviteWorld,inviteMap};
})();
