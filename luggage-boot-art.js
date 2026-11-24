/* The Marlin and the cab retain their original deck profiles, including the crease above each tail lamp. */
(() => {
  "use strict";
  const boots = new Map();
  const supports = kind => kind === "coupe" || kind === "cab";
  const clamp = n => Math.min(1,Math.max(0,n));
  const angle = amount => 1.33 * clamp(amount);

  function layout(kind) {
    if (!supports(kind)) return null;
    if (boots.has(kind)) return boots.get(kind);
    const shape = bayCarLayout(kind);
    const tail = shape.sections[0][0]+.095, nose = shape.glass[0]-.065;
    const floor = kind === "coupe" ? .458 : .510;
    function deckY(z) {
      const i = shape.sections.findIndex(section => section[0]>=z);
      const a = shape.sections[i-1], b = shape.sections[i];
      return a[2]+(b[2]-a[2])*(z-a[0])/(b[0]-a[0]);
    }
    const boot = {
      tail, floor, deckY, crease:shape.sections[1][0], hinge: {y:deckY(nose),z:nose},
      width: z => .665+.04*(z-tail)/(nose-tail),
      slots: [-.30,.30].map(x => ({x,y:floor+.002,z:(tail+nose)*.5})),
    };
    boots.set(kind,boot);
    return boot;
  }

  function lidQuad(lid,boot,color,...points) {
    lid.quad(...points.map(([x,y,z]) => [x,y-boot.hinge.y,z-boot.hinge.z]),color);
  }

  // Keep both quarter panels on the car. Their inner edges match the pressed top of the hinged lid.
  function deckBand(shell,lid,boot,a,b,paint) {
    const [,,leftA,rightA] = a, [,,leftB,rightB] = b;
    const edge = ([x,y,z]) => [Math.sign(x)*boot.width(z),y,z];
    const la=edge(leftA), lb=edge(leftB), ra=edge(rightA), rb=edge(rightB);
    shell.quad(leftA,leftB,lb,la,paint);
    shell.quad(ra,rb,rightB,rightA,paint);
    lidQuad(lid,boot,paint,la,lb,rb,ra);
    const underside = ([x,y,z]) => [x,y-.031,z];
    lidQuad(lid,boot,"#445153",underside(la),underside(ra),underside(rb),underside(lb));
    for (const [p,q] of [[la,lb],[ra,rb]]) {
      lidQuad(lid,boot,"#384448",p,q,underside(q),underside(p));
    }
    if (la[2]===boot.tail) lidQuad(lid,boot,"#394445",la,ra,underside(ra),underside(la));
    if (lb[2]===boot.hinge.z) lidQuad(lid,boot,"#424c4a",lb,rb,underside(rb),underside(lb));
  }

  function finish(shell,lid,boot) {
    const {tail,floor,hinge,deckY,width,crease} = boot;
    const front = hinge.z;
    const stations = [[-1,tail],[1,tail],[1,crease],[1,front],[-1,front],[-1,crease]];
    const rim = stations.map(([s,z]) => [s*width(z),deckY(z)-.009,z]);
    const insetZ=(z,inset) => z===tail ? z+inset : z===front ? z-inset : z;
    const lip = stations.map(([s,z]) => {
      const innerZ=insetZ(z,.026);
      return [s*(width(z)-.029),deckY(innerZ)-.042,innerZ];
    });
    const bed = stations.map(([s,z]) => [s*.6,floor,insetZ(z,.052)]);
    const lining = ["#474a44","#373d3d","#373d3d","#303535","#414747","#414747"];
    for (let i=0;i<stations.length;i++) {
      const j=(i+1)%stations.length;
      shell.quad(rim[i],rim[j],lip[j],lip[i],"#232f32");
      shell.quad(lip[i],lip[j],bed[j],bed[i],lining[i]);
    }
    shell.quad(bed[0],bed[1],bed[3],bed[4],"#4e514b");
    const middle=(tail+front)*.5;
    shell.quad([-.014,floor+.001,tail+.059],[.014,floor+.001,tail+.059],
      [.014,floor+.001,front-.059],[-.014,floor+.001,front-.059],"#414641");
    shell.box(0,deckY(tail)-.04,tail+.019,.108,.026,.034,"#aeb4a0");
    shell.box(.602,floor+.145,middle,.024,.047,.09,"#f1c782");

    // The two shallow stampings and the lock tongue travel with the deck.
    for (const side of [-1,1]) {
      const stamp = [
        [side*.51,tail+.068],[side*.547,tail+.081],
        [side*.22,front-.08],[side*.164,front-.073],
      ].map(([x,z]) => [x,deckY(z)-.048,z]);
      // Follow the original sheet-metal crease so the inset never passes through the panel.
      const atCrease=(p,q) => [p[0]+(q[0]-p[0])*(crease-p[2])/(q[2]-p[2]),deckY(crease)-.048,crease];
      const p=atCrease(stamp[0],stamp[3]),q=atCrease(stamp[1],stamp[2]);
      lidQuad(lid,boot,"#65706a",stamp[0],stamp[1],q,p);
      lidQuad(lid,boot,"#65706a",p,q,stamp[2],stamp[3]);
      // A folded edge returns the rib to the lid skin, catching light as the deck rises.
      for(const [a,b] of [[stamp[0],p],[p,stamp[3]]]){
        const seam=([x,y,z])=>[x-side*.014,y+.017,z];
        lidQuad(lid,boot,"#535f5a",a,b,seam(b),seam(a));
      }
      const pinX=side*.48;
      shell.box(pinX,hinge.y-.026,front+.003,.105,.045,.045,"#5a6866");
      lidQuad(lid,boot,"#8b9182",
        [pinX-.025,hinge.y-.019,front],[pinX+.025,hinge.y-.019,front],
        [pinX+.025,deckY(front-.09)-.036,front-.09],[pinX-.025,deckY(front-.09)-.036,front-.09]);
    }
    lid.box(0,deckY(tail+.045)-hinge.y-.045,tail+.045-front,.095,.036,.038,"#868e81");
  }

  function map(ctx,px,py,scale,vehicle,amount,items) {
    if (!vehicle || !(amount>.001)) return;
    const boot=layout(vehicle.kind);
    if (!boot) return;
    const {tail,hinge,width,deckY} = boot, front=hinge.z;
    const theta=angle(amount), cos=Math.cos(theta), sin=Math.sin(theta);
    const outline=(points,fill) => {
      ctx.beginPath();ctx.moveTo(...points[0]);
      for (let i=1;i<points.length;i++) ctx.lineTo(...points[i]);
      ctx.closePath();ctx.fillStyle=fill;ctx.fill();
    };
    ctx.save();ctx.translate(px(vehicle.x),py(vehicle.z));ctx.rotate(vehicle.yaw||0);ctx.scale(scale,-scale);
    outline([[-width(tail),tail],[width(tail),tail],[width(front),front],[-width(front),front]],"#273638");
    ctx.fillStyle="#55594f";ctx.fillRect(-.6,tail+.052,1.2,front-tail-.104);
    for (let i=0;i<2;i++) {
      const style=items?.[i];
      if (!style) continue;
      const slot=boot.slots[i];
      ctx.save();ctx.translate(slot.x,slot.z);
      BayLeftLuggageArt.caseSymbol(ctx,style);ctx.restore();
    }
    const projected = z => front+(z-front)*cos+(deckY(z)-hinge.y)*sin;
    const backEdge=projected(tail);
    outline([[-width(tail),backEdge],[width(tail),backEdge],[width(front),front],[-width(front),front]],
      vehicle.color||bayCarLayout(vehicle.kind).paint);
    ctx.fillStyle="#414b49";
    ctx.fillRect(-width(tail),backEdge-.031*sin,2*width(tail),.031*sin);
    ctx.restore();
  }

  window.BayLuggageBootArt = {supports,layout,hinge:kind=>layout(kind)?.hinge,
    angle,slots:kind=>layout(kind)?.slots||[],deckBand,finish,map};
})();
