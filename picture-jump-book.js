/* Romy's location book. The ochre marks describe the set; the blue line is the car's recorded flight. */
(() => {
  "use strict";
  const paper="#f0e5c9",ink="#343731",pencil="#706e5c",teal="#1f625f",ochre="#96652f",rule="#c9bda1";
  const clues={
    marlin:"Look for the faded tow deck.",
    foundry:"Look for the cross-braced loading steel.",
    port:"Look for the slatted timber ramp."
  };
  function line(c,points,color=ink,weight=1.5){
    c.beginPath();c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    c.strokeStyle=color;c.lineWidth=weight;c.stroke();
  }
  function patch(c,points,color){
    c.beginPath();c.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
    c.closePath();c.fillStyle=color;c.fill();
  }
  function ring(c,x,y,r,color,width=1.5){
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.strokeStyle=color;c.lineWidth=width;c.stroke();
  }
  function text(c,words,x,y,face,color=ink,align="left",limit){
    c.font=face;c.fillStyle=color;c.textAlign=align;
    if(limit)c.fillText(words,x,y,limit);else c.fillText(words,x,y);
  }
  function locationSketch(c,id){
    // Graphite thumbnail in the corner of each location sheet.
    c.save();c.translate(461,28);c.rotate(-.035);
    line(c,[[0,44],[42,43],[74,44],[110,42]],pencil,1);
    if(id==="marlin"){
      line(c,[[4,33],[15,31],[29,21],[84,15],[91,17],[88,22],[28,32],[12,36],[4,36],[4,33]],ink,1.9);
      line(c,[[18,34],[66,31],[80,25],[86,23]],pencil);
      line(c,[[26,24],[80,18]],ochre,2.5);
      line(c,[[68,28],[70,16],[71,8],[74,8],[75,20]],ink,1.5);
      for(const x of [43,56]){ring(c,x,35,6,ink,2.1);ring(c,x,35,2,pencil,1.1);}
      line(c,[[8,37],[13,37],[13,43],[4,43]],pencil);
    }else if(id==="foundry"){
      for(const [x,y] of [[18,8],[58,3]]){
        line(c,[[x,y],[x+9,y+1],[x+9,y+4],[x+6,y+4],[x+6,37],[x+11,37]],pencil);
        line(c,[[x+2,y+4],[x+2,37],[x-2,37]],ink,1.5);
      }
      line(c,[[9,39],[72,16],[95,17],[30,41],[9,39]],ink,2);
      line(c,[[30,41],[94,41],[94,19],[85,39],[81,25],[70,40],[66,31],[56,40]],ink);
      line(c,[[12,36],[70,14],[94,15]],ochre,1.3);
      for(let i=0;i<5;i++)line(c,[[21+i*10,34-i*3.6],[33+i*10,35-i*3.6]],pencil,.85);
    }else{
      line(c,[[5,31],[68,21],[102,24],[41,36],[5,31]],ink,1.7);
      line(c,[[7,34],[40,39],[102,27]],pencil);
      for(let i=0;i<6;i++)line(c,[[12+i*9,30-i*1.5],[41+i*8,34-i*1.6]],ochre,1.2);
      line(c,[[14,34],[14,40],[17,43],[18,35]],ink,2);
      line(c,[[84,30],[84,39],[86,42],[88,30]],ink,2);
      line(c,[[71,20],[72,5],[74,4],[75,20]],ink);
      c.beginPath();c.moveTo(74,10);c.quadraticCurveTo(85,33,98,13);c.strokeStyle=teal;c.lineWidth=1.5;c.stroke();
      for(const [x,y] of [[21,45],[52,44],[83,46]])line(c,[[x,y],[x+5,y-1],[x+10,y],[x+16,y-1]],teal,.9);
    }
    c.restore();
  }
  function page(c){
    c.fillStyle=paper;c.fillRect(0,0,600,336);
    c.fillStyle="#e5d8b8";c.fillRect(0,0,15,336);
    for(let y=17;y<336;y+=21){
      c.fillStyle="#d0c3a4";c.fillRect(1,y,8,3);
      line(c,[[0,y-.6],[5.5,y-.6],[7,y+.5]],pencil,1.2);
    }
    let seed=43;
    for(let i=0;i<430;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%600;
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      c.fillStyle=i%3?"#e9dec1":"#dacdaf";c.fillRect(x,seed%336,i%7?1:2,.65);
    }
    line(c,[[27,0],[26.5,336]],"#c29072",.8);
    line(c,[[38,91],[203,91.2],[424,90.8],[579,91]],pencil,1.1);
    line(c,[[37,276],[197,275.6],[436,276.3],[579,276]],pencil,1.1);
  }
  function drawReplayCar(c,trace,progress,x,y){
    // Samples are evenly spaced in flight time. Keep the wheel contact line tangent to the measured path.
    const at=Math.max(0,Math.min(1,progress))*(trace.length-1),i=Math.min(Math.floor(at),trace.length-2),f=at-i;
    const [m,h]=trace[i],[nextM,nextH]=trace[i+1];
    const heading=Math.atan2(y(nextH)-y(h),x(nextM)-x(m));
    const tilt=progress>=1?0:Math.max(-.75,Math.min(.75,heading));
    c.save();c.translate(x(m+(nextM-m)*f),y(h+(nextH-h)*f));c.rotate(tilt);
    const body=[[-16,-7],[-15,-11],[-9,-12],[-5,-16],[2,-17],[6,-16],[10,-12],[15,-11],[17,-8],[16,-5],[12,-4],[-12,-4],[-16,-5]];
    patch(c,body,"#dfbd79");line(c,[...body,body[0]],ink,1.35);
    patch(c,[[-7,-12],[-4,-15],[1,-15.5],[1,-12]],teal);
    patch(c,[[2,-15.5],[5,-15],[8,-12],[2,-12]],teal);
    line(c,[[-14,-9],[5,-9],[12,-10]],ochre,.9);
    line(c,[[1,-11],[2,-6],[5,-6]],ink,.75);
    line(c,[[14,-9],[16,-9]],paper,1.6);
    for(const wx of [-10,10]){
      c.fillStyle=ink;c.beginPath();c.arc(wx,-3.5,3.5,0,Math.PI*2);c.fill();
      ring(c,wx,-3.5,1.2,paper,1);
    }
    c.restore();
  }
  function profile(c,site,record,progress){
    const run=Math.max(1,site.length),lip=Math.max(.1,site.rise),near=site.min,far=site.max;
    const trace=Array.isArray(record?.trace)?record.trace.filter(p=>Array.isArray(p)&&Number.isFinite(p[0])&&Number.isFinite(p[1])):[];
    const limit=Math.max(far,record?.distance||0,...trace.map(p=>p[0]));
    const tallest=Math.max(lip,record?.peak||0,...trace.map(p=>p[1]));
    const left=51,right=567,ground=225;
    const scaleX=(right-left)/(run+limit+3),zero=left+(run+1)*scaleX;
    const scaleY=Math.min(2.5*scaleX,80/(tallest+.5));
    const x=m=>zero+scaleX*m,y=h=>ground-scaleY*h;
    const start=x(-run),end=x(0),crest=y(lip),from=x(near),to=x(far);
    // Graph paper ends at the pavement. Section and plan are readable with a blank trace.
    c.save();c.beginPath();c.rect(left,128,right-left,ground-128);c.clip();
    for(let gx=zero%15;gx<right;gx+=15)line(c,[[gx,128],[gx,ground]],"#d6cdb3",.6);
    for(let gy=ground;gy>125;gy-=15)line(c,[[left,gy],[right,gy]],"#d6cdb3",.6);
    c.restore();
    patch(c,[[start,ground],[end,crest],[end,ground]],site.id==="port"?"#d6bc8d":"#c5c6af");
    const bays=Math.max(3,Math.min(10,Math.round((end-start)/16)));
    for(let i=1;i<bays;i++){
      const t=i/bays,px=start+t*(end-start),py=y(lip*t);
      if(site.id==="port")line(c,[[px,py+1],[px+.3,ground-1]],ochre,1.4);
      else if(site.id==="foundry")line(c,[[px,ground],[px,py],[start+(i+1)/bays*(end-start),ground]],pencil,1.05);
      else line(c,[[px,py+1.6],[px+2,py+4]],pencil,1);
    }
    line(c,[[start,ground-1],[end,crest-.6],[end+.3,ground]],ink,2.4);
    line(c,[[left,ground+.3],[zero,ground+.6],[right,ground]],pencil,1.3);
    for(let gx=left+4;gx<right;gx+=12)line(c,[[gx,ground+1],[gx-4,ground+5]],rule,1);
    c.fillStyle="#d2a867";c.fillRect(from,ground-3,to-from,2.4);
    for(const px of [from,to])line(c,[[px,ground-8],[px,ground+10]],ochre,2);
    line(c,[[from,ground+15],[from,ground+18],[to,ground+18],[to,ground+15]],ochre,1.4);
    text(c,"Land "+near+"–"+far+" m",(from+to)/2,261,"bold 14px monospace",ochre,"center");
    text(c,lip+" m lip",end-4,253,"14px monospace",ink,"right");
    if(trace.length>1){
      c.save();c.beginPath();c.rect(left,125,right-left,ground-124);c.clip();
      line(c,trace.map(p=>[x(p[0]),y(p[1])]),teal,2.8);
      c.restore();
      const first=trace[0],last=trace.at(-1);
      for(const p of [first,last]){c.beginPath();c.arc(x(p[0]),y(p[1]),3.3,0,Math.PI*2);c.fillStyle=paper;c.fill();c.strokeStyle=teal;c.lineWidth=1.9;c.stroke();}
      if(Number.isFinite(progress))drawReplayCar(c,trace,progress,x,y);
    }
  }
  function paint(canvas,site,record,progress){
    if(!canvas||!site)return false;
    if(canvas.width!==600)canvas.width=600;if(canvas.height!==336)canvas.height=336;
    const c=canvas.getContext("2d");if(!c)return false;
    c.save();c.setTransform(1,0,0,1,0,0);c.textBaseline="alphabetic";c.lineCap="round";c.lineJoin="round";
    page(c);
    text(c,"ROMY  /  LOCATION BOOK",41,24,"bold 12px monospace",teal);
    text(c,site.name,40,60,"bold italic 34px Georgia, serif",ink,"left",402);
    text(c,site.area||"",42,81,"bold 14px monospace",pencil,"left",400);
    locationSketch(c,site.id);
    text(c,"Ramp profile",41,116,"italic 18px Georgia, serif",ink);
    if(record){line(c,[[392,111],[421,110.7]],teal,2.5);text(c,"Best wheel trace",430,115,"bold 13px monospace",teal);}
    profile(c,site,record,progress);
    if(record){
      text(c,String(record.model||"Street car"),41,304,"bold 20px Georgia, serif",ink,"left",272);
      text(c,"Clean landing",42,325,"italic 15px Georgia, serif",teal);
      for(const [cx,value,unit] of [[342,record.distance.toFixed(1)+" m","FLIGHT"],[438,record.peak.toFixed(1)+" m","PEAK"],[539,record.seconds.toFixed(2)+" s","AIR TIME"]]){
        text(c,value,cx,305,"bold 21px Georgia, serif",teal,"center");
        text(c,unit,cx,324,"bold 12px monospace",pencil,"center");
      }
    }else{
      text(c,site.hint||clues[site.id]||"Find the ramp at the marked location.",41,307,"italic 19px Georgia, serif",ink,"left",527);
      text(c,"First clean landing records the take.",42,327,"13px monospace",teal);
    }
    c.restore();return true;
  }
  window.BayPictureJumpBook=Object.freeze({paint});
})();
