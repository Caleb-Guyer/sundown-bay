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
  // Four Wheels Down is printed from the three signed traces. Each shot uses a different street-side camera.
  const matte="#252d31",screenPaper="#f6e2b3";
  const box=(c,x,y,w,h,paint)=>{c.fillStyle=paint;c.fillRect(x,y,w,h);};
  const oval=(c,x,y,rx,ry,paint)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=paint;c.fill();};
  function wash(c,y,h,top,bottom){
    const dye=c.createLinearGradient(0,y,0,y+h);dye.addColorStop(0,top);dye.addColorStop(1,bottom);
    box(c,0,y,416,h,dye);
  }
  function palm(c,x,y,size,dye){
    c.save();c.translate(x,y);c.scale(size,size);
    patch(c,[[-3,0],[2,-22],[3,-43],[4,-53],[6,-41],[5,-18],[2,0]],dye);
    for(const [dx,dy] of [[-26,9],[-20,-4],[-9,-10],[7,-13],[23,-7],[28,7],[9,13]]){
      patch(c,[[4,-51],[4+dx*.25,-55+dy*.3],[4+dx*.66,-55+dy*.55],[4+dx,-51+dy],[4+dx*.6,-52+dy*.47]],dye);
      for(const u of [.4,.58,.76])line(c,[[4+dx*u,-54+dy*u],[4+dx*(u+.17),-48+dy*u]],dye,1.2);
    }
    c.restore();
  }
  function promenadeShot(c,pan){
    wash(c,0,134,"#af99ac","#f6c59d");
    oval(c,320-pan*.12,63,23,23,"#f8d5a1");
    for(const [x,y,w] of [[65,57,54],[299,80,37],[212,38,29]])oval(c,x-pan*.07,y,w,2.1,"#e4b5ae");
    wash(c,109,39,"#7aabac","#bed0b9");
    for(let i=0;i<16;i++){const x=(i*67.3-pan*.12+490)%475-22;line(c,[[x,114+i%5*4],[x+9+i%3*8,114+i%5*4]],"#d6d4b7",1);}
    box(c,0,146,416,31,"#ddc4a1");
    c.save();c.translate(-pan*.38,0);
    for(const x of [-141,36,292,476])palm(c,x,155,.84,"#84998b");
    // Marlin's stepped stucco blade and the continuous gallery behind it.
    patch(c,[[-102,100],[-13,99],[-13,91],[55,91],[55,84],[96,84],[96,90],[154,90],[154,100],[201,100],[201,149],[-102,149]],"#c78474");
    box(c,-102,104,303,37,"#e3a48a");box(c,-100,127,301,3,"#a56863");
    for(let i=0;i<9;i++){
      const x=-94+i*35;box(c,x,110,23,12,"#718a82");box(c,x-1,122,26,2,"#f2c5a2");
      box(c,x+10,111,2,11,"#d7b297");box(c,x+2,133,15,14,"#7b9388");
    }
    box(c,49,94,71,15,"#427774");box(c,49,110,71,2,"#efd2ac");
    text(c,"M A R L I N",83.5,105,"bold 9px Georgia, serif","#f4daa4","center");
    for(const x of [205,377])palm(c,x,159,1.33,"#596d62");
    c.restore();
    box(c,0,159,416,6,"#cfac91");wash(c,165,69,"#b98e78","#8d7069");
  }
  function foundryShot(c,pan){
    wash(c,0,153,"#6d7e94","#d8bb9a");
    c.save();c.translate(-pan*.22,0);
    for(let i=0;i<7;i++){
      const x=-86+i*97,top=71+(i*19)%33;
      patch(c,[[x,150],[x+2,top],[x+7,top],[x+11,150]],"#747d7d");
      box(c,x+.6,top,7.5,3,"#a49b87");
      oval(c,x-5,top-8,8,2.5,"rgba(149,145,138,.45)");oval(c,x-18,top-12,12,2.7,"rgba(153,148,144,.38)");
    }
    c.restore();c.save();c.translate(-pan*.43,0);
    box(c,-150,113,800,46,"#7f7c75");
    for(let i=0;i<11;i++){
      const x=-170+i*69;patch(c,[[x,114],[x+54,90],[x+55,115],[x+69,114],[x+69,126],[x,126]],"#545f63");
      patch(c,[[x+49,95],[x+53,93],[x+53,109],[x+49,109]],"#c6b299");
      box(c,x+5,128,57,27,"#535f60");for(let j=1;j<=5;j++)box(c,x+5,128+j*4.3,57,.8,"#78807b");
    }
    for(const x of [136,401]){
      box(c,x-9,82,18,75,"#7f6d60");box(c,x-13,79,26,4,"#5b5d59");
      oval(c,x,99,7,7,"#e5cca4");ring(c,x,99,7.5,"#514e48",1.5);
      line(c,[[x-3,95.3],[x,99],[x+4,98]],"#555d58",1.25);
    }
    box(c,154,113,69,14,"#b8a181");
    text(c,"FOUNDRY  No. 2",188,123,"bold 8px monospace","#4b5352","center");
    c.restore();box(c,0,157,416,6,"#8e8776");wash(c,163,71,"#837f77","#595d64");
    for(let i=0;i<6;i++){
      const x=42+i*112-pan*.73;line(c,[[x,168],[x+34,168]],"#bead8b",1.7);
    }
  }
  function crane(c,x,y,size){
    c.save();c.translate(x,y);c.scale(size,size);const iron="#576c72",lit="#b79d84";
    line(c,[[-9,0],[-2,-64],[4,-65],[10,0]],iron,2.7);
    for(let i=1;i<=5;i++){
      const bot=-i*10+6,top=bot-10,spread=8-i*.8;
      line(c,[[-spread,bot],[spread,top],[-spread,top]],iron,1.4);
    }
    patch(c,[[-10,-62],[7,-73],[18,-69],[16,-60]],iron);
    line(c,[[3,-67],[53,-91],[55,-88],[12,-64]],iron,2.4);
    line(c,[[52,-89],[52,-44],[49,-41]],iron,1);
    line(c,[[8,-73],[23,-77],[49,-89]],lit,.9);
    box(c,-13,-67,9,5,lit);c.restore();
  }
  function dockShot(c,pan){
    wash(c,0,150,"#777a93","#d19b83");oval(c,103-pan*.10,77,26,26,"#e4b18d");
    const back="#84858b";c.save();c.translate(-pan*.18,0);
    for(const [x,y,w] of [[-40,108,63],[33,99,91],[134,113,90],[240,103,71],[320,97,98],[434,109,72]]){
      box(c,x,y,w,133-y,back);box(c,x+11,y-4,w*.44,4,back);
    }
    c.restore();wash(c,130,31,"#768a92","#819996");
    for(let i=0;i<12;i++){
      const x=(i*71+540-pan*.2)%490-37;
      line(c,[[x,131+i%5*4.7],[x+16+i%4*6,131+i%5*4.7]],i%2?"#b6aaa1":"#9aa9a5",1.3);
    }
    c.save();c.translate(-pan*.38,0);
    crane(c,77,142,.94);crane(c,276,143,.69);crane(c,360,143,1.11);
    patch(c,[[119,128],[132,125],[185,125],[212,120],[204,132],[138,136]],"#4c6167");
    box(c,144,118,37,8,"#a69383");box(c,149,113,21,6,"#bdab91");box(c,156,110,3,4,"#58676b");
    for(const x of [152,158,164])box(c,x,115,3,2,"#546771");
    c.restore();box(c,0,158,416,5,"#ceb08a");wash(c,163,71,"#9c887b","#625e67");
  }
  const filmBodies={
    coupe:[[-24,-8],[-23,-12],[-15,-13],[-7,-19],[4,-19],[13,-13],[22,-12],[25,-9],[24,-5],[-22,-5]],
    hatch:[[-19,-5],[-20,-12],[-17,-20],[-13,-22],[3,-21],[12,-13],[19,-12],[21,-8],[20,-5]],
    pickup:[[-27,-6],[-27,-14],[-25,-14],[-25,-12],[-5,-12],[-4,-22],[7,-22],[14,-14],[24,-13],[26,-9],[25,-6]],
    van:[[-26,-6],[-26,-23],[-23,-26],[9,-26],[17,-23],[23,-13],[25,-12],[26,-7],[24,-5]],
    wagon:[[-25,-5],[-24,-17],[-21,-21],[4,-21],[13,-14],[22,-13],[24,-9],[24,-5]]
  };
  function filmCar(c,record,distance){
    const kind=record.kind||"",model=String(record.model||"").toLowerCase();
    const body=kind==="stepside"||kind==="wrecker"||/stepside|pickup/.test(model)?"pickup":
      kind==="van"||kind==="ambulance"||kind==="pumper"||/panelvan/.test(model)?"van":
      kind==="hatch"||/hatch/.test(model)?"hatch":kind==="estate"||/estate/.test(model)?"wagon":"coupe";
    const outline=filmBodies[body],color=record.color||"#b56c56",van=body==="van",pickup=body==="pickup",hatch=body==="hatch";
    const back=van?-25:pickup?-26:hatch?-19:-23,front=hatch?20:24;
    patch(c,outline,matte);c.save();c.beginPath();c.moveTo(...outline[0]);
    for(let i=1;i<outline.length;i++)c.lineTo(...outline[i]);c.closePath();c.clip();
    box(c,-28,-28,55,24,color);box(c,-28,-8,57,4,"rgba(42,43,49,.28)");
    line(c,[[back,-12],[2,-13],[front+1,-11]],"rgba(255,237,192,.68)",1);
    if(van){
      patch(c,[[6,-24],[15,-21],[20,-14],[6,-14]],"#485b64");box(c,-22,-22,23,10,"rgba(235,220,181,.13)");
      line(c,[[2,-23],[2,-7]],"rgba(49,55,58,.56)",.8);
    }else if(pickup){
      patch(c,[[-2,-20],[6,-20],[11,-14],[-3,-14]],"#53646b");
      line(c,[[-26,-12],[-6,-12]],matte,1.2);
    }else{
      const high=hatch||body==="wagon"?-19:-17;
      patch(c,[[back+3,-13],[hatch||body==="wagon"?back+6:-7,high],[-1,high],[-1,-13]],"#668080");
      patch(c,[[1,high],[4,high],[11,-13],[1,-13]],"#4a656d");
    }
    const glass=van?8:1;oval(c,glass+2.5,-15.7,1.35,1.6,"#c39977");
    line(c,[[glass+1,-17],[glass+2.8,-17.5],[glass+3.4,-17]],matte,.9);
    line(c,[[glass-1,-12],[glass-1.6,-7],[8,-7],[10,-12]],"rgba(38,46,50,.58)",.8);
    const grip=van?5:0;box(c,grip,-11,2.5,.7,"#ead0a5");
    box(c,front-2,-10,4,2.2,"#f5ddaa");box(c,back-.3,-10,2.5,2.4,"#ae5348");c.restore();
    line(c,[...outline,outline[0]],matte,1.05);
    const axle=hatch?12:van||pickup?16:15,r=pickup?5.2:van?4.8:4.4;
    for(const wx of [-axle,axle]){
      oval(c,wx,-r,r+1,r+1,matte);oval(c,wx,-r,r*.62,r*.62,"#a4a59a");ring(c,wx,-r,r*.46,"#5b6465",.75);
      for(let i=0;i<3;i++){const a=distance*1.68+i*2*Math.PI/3;line(c,[[wx,-r],[wx+Math.cos(a)*r*.52,-r+Math.sin(a)*r*.52]],"#e1d1ad",.75);}
    }
  }
  function takePosition(site,record,age){
    const liftAt=1.30,span=Math.max(1.65,Math.min(2.50,record.seconds*1.75)),trace=record.trace,last=trace.length-1;
    const segment=(i)=>[(trace[i+1][0]-trace[i][0])*last/span,(trace[i+1][1]-trace[i][1])*last/span];
    if(age<liftAt){
      const d=trace[0][0]+(age-liftAt)*segment(0)[0],on=d>=-site.length;
      return {d,h:on?site.rise*(1+d/site.length):0,slope:on?site.rise/site.length:0};
    }
    if(age>=liftAt+span)return {d:trace[last][0]+(age-liftAt-span)*segment(last-1)[0],h:0,slope:0};
    const at=(age-liftAt)/span*last,i=Math.min(last-1,Math.floor(at)),f=at-i,[dx,dy]=segment(i);
    return {d:trace[i][0]+dx*f*span/last,h:trace[i][1]+dy*f*span/last,slope:dy/Math.max(.01,dx)};
  }
  function filmRamp(c,s){
    const L=s.length,H=s.rise;
    const steel=s.id==="foundry",dock=s.id==="port";
    patch(c,[[-L,0],[0,-H],[0,0]],dock?"#ac8464":steel?"#66716b":"#b67f6e");
    const rib=dock?"#665b52":steel?"#343f43":"#745e59";
    for(let i=1;i<=7;i++){
      const a=i/7,z=-L+L*a;
      line(c,[[z-.04,-H*a],[z,0]],rib,dock?.13:.08);
      if(steel)line(c,[[z,0],[z-L/7,-H*(a-1/7)]],rib,.10);
    }
    line(c,[[-L,0],[0,-H]],dock?"#e0c49b":"#d0c6ac",.14);
    if(s.id==="marlin")for(const x of [-3.8,-1.6]){oval(c,x,-.26,.32,.32,matte);oval(c,x,-.26,.14,.14,"#c7b4a0");}
    for(const x of [s.min,s.max])line(c,[[x-.5,.22],[x+.5,.22]],dock?"#c4d6c0":"#e7c890",.19);
  }
  function cameraForeground(c,id,pan){
    if(id==="marlin"){
      // The first setup includes Romy's tripod camera, just off the running surface.
      const x=110-pan*1.27;
      line(c,[[x-9,222],[x,193],[x+8,222]],"#4d4948",2.4);
      box(c,x-6,186,12,8,"#464644");patch(c,[[x+6,188],[x+11,186],[x+11,194],[x+6,192]],"#4a4b45");
      oval(c,x-2,185,4.1,4.1,"#544e49");oval(c,x+4,185,3,3,"#544e49");
    }else if(id==="foundry"){
      for(let i=-1;i<6;i++){
        const x=i*115-pan*1.22;
        patch(c,[[x+2,235],[x+8,199],[x+18,199],[x+22,235]],"#465255");
        line(c,[[x+8,200],[x+17,200]],"#cfb781",2.5);
      }
    }else{
      for(let i=-1;i<7;i++){
        const x=i*99-pan*1.2;box(c,x,206,8,31,"#4b5057");oval(c,x+4,206,4.5,2,"#918474");
        c.beginPath();c.moveTo(x+4,208);c.quadraticCurveTo(x+55,235,x+103,208);c.lineWidth=2.5;c.strokeStyle="#56585a";c.stroke();
      }
    }
  }
  function project(c,book,time){
    const sites=window.BayPictureJumps?.sites;
    if(!c||!sites||!Number.isFinite(time)||!sites.every(s=>book?.best?.[s.id]?.trace?.length>=2))return false;
    const tick=((time%15)+15)%15,shot=Math.floor(tick/5),age=tick-shot*5,s=sites[shot],r=book.best[s.id];
    const p=takePosition(s,r,age),direction=Math.cos(s.yaw)<0?-1:1,scale=10.5;
    const travel=direction*p.d*scale,pan=travel*.64,lipX=(direction<0?281:136)-pan,ground=178;
    c.save();c.beginPath();c.rect(0,0,416,234);c.clip();c.lineJoin="round";c.lineCap="round";c.textBaseline="alphabetic";
    box(c,0,0,416,234,matte);
    if(s.id==="marlin")promenadeShot(c,pan);else if(s.id==="foundry")foundryShot(c,pan);else dockShot(c,pan);
    c.save();c.translate(lipX,ground);c.scale(scale*direction,scale);
    filmRamp(c,s);oval(c,p.d,.08,Math.max(.85,2.34-.14*p.h),.17,"rgba(42,44,48,.31)");c.restore();
    c.save();c.translate(lipX+travel,ground-p.h*scale);c.scale(direction,1);c.rotate(Math.max(-.55,Math.min(.55,-Math.atan(p.slope))));
    filmCar(c,r,p.d);c.restore();cameraForeground(c,s.id,pan);
    if(shot===0&&age<1.72){
      c.save();c.globalAlpha*=Math.min(1,(1.72-age)/.26);
      text(c,"Four Wheels Down",20,53,"italic bold 32px Georgia, serif","#584e50");
      text(c,"Four Wheels Down",19,51.4,"italic bold 32px Georgia, serif",screenPaper);
      line(c,[[21,59],[139,59],[151,58]],screenPaper,1.15);c.restore();
    }else if(shot===2&&age>3.92){
      c.save();c.globalAlpha*=Math.min(1,(age-3.92)/.25);
      text(c,"A film by Romy",393,51,"italic bold 22px Georgia, serif","#554b52","right");
      text(c,"A film by Romy",392,49.5,"italic bold 22px Georgia, serif",screenPaper,"right");c.restore();
    }
    box(c,0,0,416,8,matte);box(c,0,226,416,8,matte);
    c.restore();return true;
  }
  window.BayPictureJumpBook=Object.freeze({paint,project});
})();
