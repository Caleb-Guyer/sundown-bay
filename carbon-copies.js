/* The shop takes a rubbing from both rear tires after a closed turn on its apron. */
(() => {
  "use strict";
  const pad={x:-93,z:21,yaw:0,name:"Portside Tire · Chalk circle"};
  const rail={x:pad.x,z:pad.z+6.9,w:2.45,d:.45,top:1.72,bottom:0};
  const sides=["left","right"],tau=Math.PI*2,round=x=>Math.round(x*100)/100;
  function read(raw){
    const book={known:!!raw?.known,left:null,right:null};
    for(const side of sides){
      const c=raw?.[side];
      if(!c||typeof c.model!=="string"||!c.model||!/^#[a-f0-9]{6}$/i.test(c.color)||
        !Number.isFinite(c.seconds)||c.seconds<=1||c.seconds>24||
        !Array.isArray(c.trace)||c.trace.length<28||c.trace.length>85||
        !c.trace.every(row=>Array.isArray(row)&&row.length===4&&row.every(n=>Number.isFinite(n)&&Math.abs(n)<=10)))continue;
      book[side]={model:c.model.slice(0,55),color:c.color,seconds:c.seconds,trace:c.trace.map(row=>row.slice())};book.known=true;
    }
    return book;
  }
  function contacts(v){
    const s=v.footprint||bayCarLayout(v.kind);
    const left=BayDriving.world(v,-s.track+.085,s.axles[0]),right=BayDriving.world(v,s.track-.085,s.axles[0]);
    return [left.x,left.z,right.x,right.z];
  }
  function row(v){return contacts(v).map((n,i)=>round(n-(i%2?pad.z:pad.x)));}
  function step(v,dt,previousYaw,eligible){
    const delta=Math.atan2(Math.sin(v.yaw-previousYaw),Math.cos(v.yaw-previousYaw));
    if(!eligible||Math.hypot(v.x-pad.x,v.z-pad.z)>5.1||v.burn<.52||Math.abs(delta)<.15*dt){
      v.chalkTurn=null;return null;
    }
    const side=delta<0?"left":"right";
    let r=v.chalkTurn;
    if(!r||r.side!==side){v.chalkTurn=r={side,radians:0,seconds:0,trace:[row(v)],done:false};return null;}
    if(r.done)return null;
    const turn=Math.abs(delta),remain=tau-r.radians;
    r.seconds+=dt*Math.min(1,remain/turn);r.radians+=turn;
    if(r.seconds>24){v.chalkTurn=null;return null;}
    if(r.radians>=r.trace.length*tau/64&&r.radians<tau)r.trace.push(row(v));
    if(r.radians<tau)return null;
    r.done=true;const last=row(v);r.trace.push(last);
    const start=r.trace[0];
    if([0,2].some(i=>Math.hypot(last[i]-start[i],last[i+1]-start[i+1])>1.15))return {side,miss:true};
    return {side,card:{seconds:round(r.seconds),model:BayDriving.cars[v.kind].name,color:v.color,trace:r.trace}};
  }
  function file(book,result){
    const {side,card}=result,old=book[side];book.known=true;
    if(old&&old.seconds<=card.seconds)return 0;
    book[side]=card;
    return old?0:book[sides.find(s=>s!==side)]?95:60;
  }
  const surface=[];
  function stripe(x,z,xx,zz,width,color){
    const angle=Math.atan2(xx-x,zz-z),a=Math.cos(angle)*width/2,b=-Math.sin(angle)*width/2;
    surface.push({color,points:[[x+a,z+b],[xx+a,zz+b],[xx-a,zz-b],[x-a,z-b]]});
  }
  // Fragments of old line paint and short chalk strokes stay legible through fresh rubber.
  for(let i=0;i<64;i++){
    if(i%8>=5||i===17)continue;
    const a=i*tau/64,b=a+tau/64;
    stripe(5.25*Math.sin(a),5.25*Math.cos(a),5.25*Math.sin(b),5.25*Math.cos(b),.085,"#d1c292");
  }
  for(const side of [-1,1]){
    const u=side*1.15;
    stripe(u,-.9,u,.95,.095,"#e2d3ac");stripe(u,.95,u-side*.38,.62,.08,"#e2d3ac");
    stripe(u,.95,u+side*.33,.61,.075,"#e2d3ac");
  }
  const cache={};
  function poster(book,side){
    const card=book[side];let item=cache[side];
    if(!item||item.card!==card){
      const canvas=item?.canvas||document.createElement("canvas");
      BayContactPatchArt.paint(canvas,card,side);
      item=cache[side]={canvas,card,rev:(item?.rev||0)+1};
    }
    return item;
  }
  function install(model){
    model("carbon-apron",g=>{
      g.box(0,-.036,0,12.25,.06,12.45,"#686969");
      for(const q of surface)g.quad(...q.points.map(([x,z])=>[x,.006,z]),q.color);
      for(const x of [-1,1]){
        g.box(x,.77,6.92,.07,1.54,.08,"#62766d");g.box(x,.06,6.92,.42,.12,.47,"#675b4e");
      }
      g.box(0,1.19,6.91,2.42,.91,.09,"#406257");g.box(0,1.68,6.91,2.52,.10,.22,"#a65e44");
    });
    model("carbon-print",g=>{for(const [x,y,u,w] of [[-.53,-.30,0,1],[.53,-.30,1,1],[.53,.30,1,0],[-.53,-.30,0,1],[.53,.30,1,0],[-.53,.30,0,0]])g.vertices.push(x,y,0,u,w,0);});
  }
  function world(view,book,y){
    view.draw("carbon-apron",pad.x,y,pad.z,0);
    if(!view.drawPrint||view.basis.camera.z>rail.z)return;
    for(const [i,side] of sides.entries()){
      const p=poster(book,side);view.drawPrint("carbon-print",p.canvas,p.rev,rail.x+(i-.5)*1.17,y+1.20,rail.z-.055,0);
    }
  }
  function map(ctx,px,py,s,book){
    ctx.save();ctx.translate(px(pad.x),py(pad.z));ctx.scale(s,-s);
    ctx.fillStyle="#686969";ctx.fillRect(-6.125,-6.225,12.25,12.45);
    for(const q of surface){ctx.fillStyle=q.color;ctx.beginPath();q.points.forEach(([x,z],i)=>i?ctx.lineTo(x,z):ctx.moveTo(x,z));ctx.closePath();ctx.fill();}
    ctx.fillStyle="#805741";ctx.fillRect(-1.24,6.68,2.48,.45);
    ctx.scale(1,-1);
    for(const [i,side] of sides.entries())ctx.drawImage(poster(book,side).canvas,-1.1+i*1.14,-6.87,1.06,.60);
    ctx.restore();
  }
  window.BayCarbonCopies={pad,rail,sides,read,contacts,step,file,install,world,map};
})();
