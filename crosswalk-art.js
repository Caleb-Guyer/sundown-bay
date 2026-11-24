/* The same four corner posts serve traffic in either direction across a junction. */
(() => {
  "use strict";
  const corner = 9.15, crossing = 8.55, signHeight = 2.43;
  const iron = "#4b5d5a", zinc = "#8d9b91", pale = "#b1b7a3", enamel = "#bd9062";
  const rim = "#685b49", shade = "#43504b", darkGlass = "#283731", graphite = "#3d4b46";
  const amber = "#ffad54", walkLight = "#e5ffdc", pilot = "#ffe08b";
  const sides = [-1, 1];
  function bar(x, y, w, h) {
    return [[x-w/2,y-h/2],[x+w/2,y-h/2],[x+w/2,y+h/2],[x-w/2,y+h/2]];
  }
  function segment(ax, ay, bx, by, width) {
    const norm = width / (2 * Math.hypot(bx-ax, by-ay));
    const x = (by-ay)*norm, y = (ax-bx)*norm;
    return [[ax-x,ay-y],[ax+x,ay+y],[bx+x,by+y],[bx-x,by-y]];
  }
  function disc(x, y, r, sides = 8) {
    return Array.from({length:sides}, (_,i) => {
      const angle = 2*Math.PI*i/sides;
      return [x+r*Math.cos(angle), y+r*Math.sin(angle)];
    });
  }
  // Convex pieces keep the finger gaps and the bent knee open even in silhouette.
  const hand = [
    [[-.096,.056],[.124,.056],[.124,-.069],[.085,-.155],[-.043,-.155],[-.094,-.076]],
    segment(-.076,-.02,-.159,.093,.050),bar(-.071,.089,.042,.160),
    bar(-.019,.115,.044,.186),bar(.035,.105,.044,.171),bar(.092,.088,.042,.135)
  ];
  const walker = [
    disc(.050,.159,.047),segment(-.028,-.035,.017,.088,.075),
    segment(.014,.067,.092,.006,.042),segment(.086,.007,.153,.015,.038),
    segment(-.003,.068,-.091,.027,.042),segment(-.088,.032,-.118,-.041,.040),
    segment(-.030,-.018,-.066,-.112,.062),segment(-.056,-.105,-.143,-.188,.052),
    segment(-.017,-.023,.057,-.092,.065),segment(.054,-.084,.104,-.187,.054)
  ];

  // Paint wears through where tires pass. Every bar stays in its own stripe and
  // its small chips are gaps through which the actual pavement remains visible.
  const bars = [];
  function paintPiece(axis, side, along, edge, width, length, color, nick) {
    const toWorld = (u,d) => axis ? [side*d,u] : [u,side*d];
    const points = [
      toWorld(along,edge+.018),toWorld(along+width-nick,edge),
      toWorld(along+width,edge+.065),toWorld(along+width-.017,edge+length),
      toWorld(along+.018,edge+length-.023)
    ];
    bars.push({points,color});
  }
  for (let axis=0;axis<2;axis++) for (const side of sides) for (let i=-3;i<=3;i++) {
    const wear = (i+3+axis+(side===1?1:0))%4;
    const start = i*1.83-.39, edge = crossing-.84+(wear===2?.035:0);
    const tone = ["#c7c6b3","#bcbfae","#c9c9b8","#bfc3b2"][wear];
    if (wear===1 || wear===3) {
      const split = wear===1?.49:1.05;
      paintPiece(axis,side,start,edge,.78,split,tone,.04);
      paintPiece(axis,side,start+.013,edge+split+.066,.758,1.66-split-.066,tone,.07);
    } else paintPiece(axis,side,start,edge,.78,1.66,tone,.025);
  }
  function meshPolygon(g, points, color) {
    for (let i=1;i<points.length-1;i++) g.tri(points[0],points[i],points[i+1],color);
  }
  function paint(g) {
    for (const stripe of bars) meshPolygon(g,stripe.points.map(([x,z])=>[x,.134,z]),stripe.color);
  }
  function corners(fn) {
    for (const sx of sides) for (const sz of sides) fn(sx*corner,sz*corner,sx,sz);
  }
  // This local plane faces the people across the arm of the junction.
  function face(x,z,nx,nz) {
    return (u,h,depth) => [x-u*nz+depth*nx,h,z+u*nx+depth*nz];
  }
  function panel(g,f,u,h,w,t,depth,color) {
    g.quad(f(u-w/2,h-t/2,depth),f(u+w/2,h-t/2,depth),f(u+w/2,h+t/2,depth),f(u-w/2,h+t/2,depth),color);
  }
  function signFace(g,f) {
    panel(g,f,0,signHeight,.558,.578,.296,rim);
    panel(g,f,0,signHeight,.490,.503,.298,darkGlass);
    // The top lip and the triangular ends are open underneath the hood.
    const top=signHeight+.285, tip=top-.032;
    g.quad(f(-.286,top,.293),f(.286,top,.293),f(.284,tip,.424),f(-.284,tip,.424),iron);
    for (const side of sides) g.tri(f(side*.285,top,.293),f(side*.285,tip,.424),f(side*.285,top-.147,.293),shade);
  }
  function hardware(g) {
    corners((x,z,sx,sz)=>{
      g.cyl(x,.116,z,.160,.203,.100,7,iron);
      g.cyl(x,1.248,z,.062,.085,2.16,7,zinc);
      g.cyl(x,.389,z,.097,.102,.421,7,iron);
      g.cyl(x,1.565,z,.073,.073,.071,7,pale);
      g.box(x,signHeight,z,.589,.641,.589,enamel);
      g.box(x,signHeight+.332,z,.603,.045,.603,iron);
      signFace(g,face(x,z,-sx,0)); signFace(g,face(x,z,0,-sz));
      // A broad mechanical push button faces the pavement on the corner.
      const inv=Math.SQRT1_2,nx=-sx*inv,nz=-sz*inv;
      const a=Math.atan2(nx,nz), f=face(x,z,nx,nz);
      g.box(x+.092*nx,1.055,z+.092*nz,.240,.385,.127,rim,a);
      panel(g,f,0,1.060,.205,.346,.159,enamel);
      panel(g,f,0,1.152,.150,.088,.162,graphite);
      panel(g,f,0,1.152,.085,.026,.164,"#725c42");
      meshPolygon(g,disc(0,1.002,.075).map(([u,h])=>f(u,h,.162)),iron);
      meshPolygon(g,disc(0,1.002,.052).map(([u,h])=>f(u,h,.170)),pale);
      panel(g,f,-.015,.994,.069,.014,.172,"#839287");
    });
  }
  function lenses(g,glyph,color) {
    corners((x,z,sx,sz)=>{
      for (const f of [face(x,z,-sx,0),face(x,z,0,-sz)]) for (const piece of glyph) {
        meshPolygon(g,piece.map(([u,v])=>f(u,signHeight+v,.302)),color);
      }
    });
  }
  function ack(g) {
    corners((x,z,sx,sz)=>{
      const f=face(x,z,-sx*Math.SQRT1_2,-sz*Math.SQRT1_2);
      panel(g,f,0,1.152,.089,.028,.168,pilot);
    });
  }
  function install(model) {
    model("walk-street-paint",paint);
    model("walk-corner-posts",hardware);
    model("walk-hand",g=>lenses(g,hand,amber));
    model("walk-person",g=>lenses(g,walker,walkLight));
    model("walk-button-lit",ack);
  }
  const blinkOff=(phase,time)=>phase==="finish" && (time%1+1)%1>=.54;
  function world(view,sig,phase,time) {
    view.draw("walk-corner-posts",sig.x,0,sig.z);
    if (view.casting) return;
    view.draw("walk-street-paint",sig.x,0,sig.z);
    if (!blinkOff(phase,time)) view.draw(phase==="walk"?"walk-person":"walk-hand",sig.x,0,sig.z,0,0,0,.92);
    if (phase==="queued"||phase==="clear") view.draw("walk-button-lit",sig.x,0,sig.z,0,0,0,.88);
  }
  function trace(path,points) {
    path.moveTo(points[0][0],points[0][1]);
    for (let i=1;i<points.length;i++) path.lineTo(points[i][0],points[i][1]);
    path.closePath();
  }
  const paintInks=new Map();
  for (const stripe of bars) {
    if (!paintInks.has(stripe.color)) paintInks.set(stripe.color,{pieces:[],path:null});
    paintInks.get(stripe.color).pieces.push(stripe.points);
  }
  function mapPaint(ctx,px,py,s,sig) {
    ctx.save();ctx.translate(px(sig.x),py(sig.z));ctx.scale(s,-s);
    for (const [color,ink] of paintInks) {
      ctx.fillStyle=color;
      if (typeof Path2D==="function") {
        if (!ink.path) { ink.path=new Path2D();for (const piece of ink.pieces) trace(ink.path,piece); }
        ctx.fill(ink.path);
      } else {
        ctx.beginPath();for (const piece of ink.pieces) trace(ctx,piece);ctx.fill();
      }
    }
    ctx.restore();
  }
  function map(ctx,px,py,s,sig,phase,time) {
    const shown=!blinkOff(phase,time), walking=phase==="walk", on=walking?walkLight:amber;
    ctx.save();ctx.translate(px(sig.x),py(sig.z));ctx.scale(s,-s);
    corners((x,z,sx,sz)=>{
      const size=Math.max(.76,2.6/s), h=size/2;
      ctx.fillStyle=iron;ctx.fillRect(x-h*1.04,z-h*1.04,size*1.04,size*1.04);
      ctx.fillStyle=enamel;ctx.fillRect(x-h*.82,z-h*.82,size*.82,size*.82);
      ctx.fillStyle=shown?on:darkGlass;
      ctx.fillRect(x-h,z-sz*h-h*.15,size,h*.30);
      ctx.fillRect(x-sx*h-h*.15,z-h,h*.30,size);
      if (phase==="queued"||phase==="clear") {
        ctx.fillStyle=pilot;ctx.fillRect(x-sx*h*.64-h*.18,z-sz*h*.64-h*.18,h*.36,h*.36);
      }
    });
    ctx.restore();
  }
  window.BayCrosswalkArt=Object.freeze({install,world,mapPaint,map});
})();
