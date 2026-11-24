/* Romy keeps the rear-axle prints as carbon copies at the tire shop. */
(() => {
  "use strict";
  const ink="#253d43",blue="#396479",ghost="#879ca1",rust="#984d32",stock="#eee4c9";
  const tau=Math.PI*2,clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  function stroke(c,points,color,width){
    c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
    c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function letters(c,words,x,y,font,color,width){
    c.font=font;c.fillStyle=color;c.fillText(words,x,y,width);
  }
  function circle(c,x,y,r,color,width){
    c.beginPath();c.arc(x,y,r,0,tau);c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function wheelMark(c,x,y){
    c.save();c.translate(x,y);c.rotate(-.11);
    circle(c,0,0,14,blue,2.2);circle(c,0,0,10.8,blue,1.1);circle(c,0,0,3.2,blue,1.6);
    for(let i=0;i<12;i++){
      const a=i*tau/12;c.save();c.rotate(a);
      stroke(c,[[-.7,-11.7],[1.1,-13.3]],blue,1.3);
      if(i%2===0)stroke(c,[[-1.3,-4.4],[-.4,-8],[2,-8.7]],blue,1.4);
      c.restore();
    }
    // Two ruled speed lines in the old shop's winged wheel mark.
    stroke(c,[[-14,-6],[-29,-6],[-22,0],[-15,0]],blue,2.1);
    stroke(c,[[14,-6],[29,-6],[22,0],[15,0]],blue,2.1);
    c.restore();
  }
  function sheet(c){
    c.fillStyle=stock;c.fillRect(0,0,600,340);
    c.fillStyle="#e1d5b6";c.fillRect(0,0,14,340);
    c.fillStyle="#dad0b5";c.fillRect(583,0,17,340);
    // Perforations and clay flecks stay at the same places when the player turns the page.
    let seed=97537;
    for(let i=0;i<800;i++){
      seed=(Math.imul(1664525,seed)+1013904223)>>>0;const x=seed%600;
      seed=(Math.imul(1664525,seed)+1013904223)>>>0;
      c.fillStyle=i%3?"#e7ddc2":"#d6ccad";c.fillRect(x,seed%340,i%9?1:2,.7);
    }
    c.save();c.setLineDash([2,4]);stroke(c,[[15,1],[15,339]],"#b7ae94",1);
    stroke(c,[[582,1],[582,339]],"#b7ae94",1);c.restore();
    for(let y=21;y<340;y+=37){
      c.fillStyle="#68695c";c.beginPath();c.arc(7,y,2.7,0,tau);c.fill();
      c.fillStyle="#c5bda5";c.fillRect(589,y,6,1.3);
    }
    wheelMark(c,57,35);
    letters(c,"PORTSIDE TIRE",94,34,"bold italic 25px Georgia,serif",ink,245);
    letters(c,"PORT SOL  /  SUNDOWN BAY",96,50,"bold 10px monospace",blue,220);
    stroke(c,[[27,62],[574,62]],ink,2.1);
    stroke(c,[[27,65],[574,65]],blue,.85);
    stroke(c,[[381,77],[381,294]],"#b8b198",1);
    stroke(c,[[27,302],[574,302]],ink,1.4);
  }
  function printTracks(c,rows){
    const left=31,top=80,width=337,height=205;
    let xmin=Infinity,xmax=-Infinity,zmin=Infinity,zmax=-Infinity;
    for(const r of rows)for(const j of [0,2]){
      xmin=Math.min(xmin,r[j]);xmax=Math.max(xmax,r[j]);zmin=Math.min(zmin,r[j+1]);zmax=Math.max(zmax,r[j+1]);
    }
    const scale=Math.min(39,(width-28)/Math.max(1,xmax-xmin),(height-20)/Math.max(1,zmax-zmin));
    const cx=left+width*.5,cy=top+height*.5,mx=(xmin+xmax)*.5,mz=(zmin+zmax)*.5;
    const x=v=>cx+(v-mx)*scale,y=v=>cy-(v-mz)*scale;
    const w=clamp(scale*.205,2.25,8.6);
    c.save();c.beginPath();c.rect(left,top,width,height);c.clip();
    for(let j=0;j<4;j+=2){
      const points=rows.map(r=>[x(r[j]),y(r[j+1])]);
      // Several low-pressure passes leave narrow paper-colored channels in the ink.
      stroke(c,points,j===0?"#516265":"#485c61",w);
      stroke(c,points,j===0?"#738588":"#718388",w*.52);
      c.save();c.setLineDash([1.2,3.1,2.2,1.8]);stroke(c,points,"#c5c7b4",w*.31);c.restore();
      const start=points[0],end=points.at(-1);
      circle(c,start[0],start[1],w*.72,rust,1.35);
      stroke(c,[[end[0]-2.2,end[1]+2.1],[end[0]+2.2,end[1]-2.1]],ink,1.35);
    }
    c.restore();
    const barX=32,barY=292;
    stroke(c,[[barX,barY-3],[barX,barY],[barX+scale,barY],[barX+scale,barY-3]],blue,1.2);
    letters(c,"1 m",barX+scale+5,barY+2,"10px monospace",blue,34);
  }
  function paint(canvas,card,side){
    if(!canvas)return false;
    if(canvas.width!==600)canvas.width=600;if(canvas.height!==340)canvas.height=340;
    const c=canvas.getContext("2d");if(!c)return false;
    const isLeft=side==="left",direction=isLeft?"Left":"Right";
    const rows=Array.isArray(card?.trace)?card.trace.filter(r=>Array.isArray(r)&&r.length===4&&r.every(Number.isFinite)):[];
    const filed=rows.length>1;
    c.save();c.setTransform(1,0,0,1,0,0);c.lineJoin="round";c.lineCap="round";c.textAlign="left";c.textBaseline="alphabetic";
    sheet(c);
    letters(c,"REAR AXLE",425,27,"bold 12px monospace",blue,130);
    letters(c,"CONTACT RECORD",425,46,"bold 15px monospace",ink,142);
    for(const [x,y,s,t] of [[30,76,1,1],[369,76,-1,1],[30,287,1,-1],[369,287,-1,-1]])
      stroke(c,[[x+s*8,y],[x,y],[x,y+t*7]],ghost,.9);
    if(filed)printTracks(c,rows);
    else{
      letters(c,"Rubbing goes here",83,179,"italic 25px Georgia,serif","#747e75",245);
      letters(c,"Rear left and rear right",84,202,"12px monospace",blue,260);
    }
    const at=397;
    letters(c,"IMPRESSION",at,96,"bold 11px monospace",blue,150);
    letters(c,direction+" circle",at,128,"bold italic 30px Georgia,serif",ink,172);
    stroke(c,[[at,139],[566,139]],ghost,.85);
    letters(c,"VEHICLE",at,160,"bold 11px monospace",blue,150);
    letters(c,filed?String(card.model||"Street car"):"—",at,184,"bold 18px Georgia,serif",ink,171);
    if(filed&&/^#[a-f0-9]{6}$/i.test(card.color)){
      // A dab of paint on the reverse of the ticket identifies the car.
      stroke(c,[[at+1,199],[at+11,198],[at+24,198.7],[at+29,197.7]],card.color,5);
      stroke(c,[[at+4,202],[at+18,200.8],[at+22,201.4]],card.color,1.1);
    }
    letters(c,"CIRCLE TIME",at,223,"bold 11px monospace",blue,160);
    letters(c,filed&&Number.isFinite(card.seconds)?card.seconds.toFixed(2)+" s":"—",at,249,"bold 23px monospace",ink,166);
    stroke(c,[[at,267],[566,267]],ghost,.85);
    letters(c,filed?"R. Vale":"Romy’s file",at+32,292,"italic 23px Georgia,serif",filed?blue:ghost,132);
    letters(c,filed?"CARBON COPY   /   BOTH REAR TIRES":"OPEN COPY   /   BOTH REAR TIRES",30,325,"bold 11px monospace",blue,310);
    letters(c,isLeft?"L.H.  /  01":"R.H.  /  02",440,325,"bold 12px monospace",ink,126);
    c.restore();return true;
  }

  // Four small, pre-painted pieces of mist. The projection sets their size in either camera.
  // Each lobe uses a different centre so successive puffs do not read as a chain of discs.
  const sprites=[];
  function smokeSprite(index){
    if(typeof OffscreenCanvas==="undefined")return null;
    if(sprites[index]!==undefined)return sprites[index];
    const image=new OffscreenCanvas(64,64),c=image.getContext("2d");if(!c)return sprites[index]=null;
    for(let i=0;i<5;i++){
      const a=i*2.43+index*1.81,x=32+Math.cos(a)*(i?10:0),y=32+Math.sin(a)*(i?7:0),r=18+(i+index)%4;
      const fog=c.createRadialGradient(x,y,0,x,y,r);fog.addColorStop(0,"rgba(213,215,207,.42)");
      fog.addColorStop(.43,"rgba(204,209,203,.29)");fog.addColorStop(1,"rgba(179,188,187,0)");
      c.fillStyle=fog;c.fillRect(x-r,y-r,2*r,2*r);
    }
    sprites[index]=image;return image;
  }
  function smokeOverlay(ctx,cloud,project,time,wet=0){
    if(!ctx||!cloud?.length||typeof project!=="function")return 0;
    const damp=clamp(wet||0,0,1);
    let drawn=0;ctx.save();
    const opacity=ctx.globalAlpha,view=ctx.canvas;
    for(let i=Math.max(0,cloud.length-48);i<cloud.length;i++){
      const p=cloud[i],age=time-p.born;
      if(age<0||age>=1.55)continue;
      const seed=Number.isFinite(p.seed)?p.seed:0,wave=Math.sin(seed*7.43),life=(1.35+.20*wave)*(1-.28*damp),f=age/life;
      if(f>=1)continue;
      const drift=.36+.19*wave;
      const at=project(p.x+age*drift,p.y+age*(.55+drift*.5),p.z+age*.21*Math.cos(seed*4.57));
      if(!at||!Number.isFinite(at.x)||!Number.isFinite(at.y)||!Number.isFinite(at.scale)||at.scale<=0)continue;
      const size=Math.min(320,Math.max(.8,at.scale*(.50+f*1.70+wave*.12)));
      if(view&&(at.x+size<0||at.y+size<0||at.x-size>view.width||at.y-size>view.height))continue;
      ctx.globalAlpha=opacity*(damp*.12+.59)*Math.min(1,age/.075)*(1-f)*(1-f*.36);
      const stamp=smokeSprite(Math.abs(Math.floor(seed*13))%4);
      if(stamp)ctx.drawImage(stamp,at.x-size*.54,at.y-size*.51,size*1.08,size);
      else{
        const r=size*.49,fog=ctx.createRadialGradient(at.x,at.y,0,at.x,at.y,r);
        fog.addColorStop(0,"rgba(211,215,209,.62)");fog.addColorStop(.55,"rgba(202,208,202,.30)");
        fog.addColorStop(1,"rgba(181,190,187,0)");ctx.fillStyle=fog;ctx.fillRect(at.x-r,at.y-r,size,size);
      }
      drawn++;
    }
    ctx.restore();return drawn;
  }
  window.BayContactPatchArt={paint,smokeOverlay};
})();
