/* Frankie's folded shot list and the road map tucked under the passenger window. */
(() => {
  "use strict";
  const width=560,height=260,tau=Math.PI*2;
  const ink="#293e40",blue="#40626a",red="#a75540",stock="#f0e5c8",ochre="#d6ac67",pencil="#827864";
  const serif='Georgia, "Times New Roman", serif',mono='"Courier New", monospace';
  function shape(c,points,fill){
    c.beginPath();c.moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
    c.closePath();c.fillStyle=fill;c.fill();
  }
  function rule(c,x,y,ex,ey,color,weight=1){
    c.strokeStyle=color;c.lineWidth=weight;c.beginPath();c.moveTo(x,y);c.lineTo(ex,ey);c.stroke();
  }
  function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function oval(c,x,y,rx,ry,color){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);c.fillStyle=color;c.fill();
  }
  function label(c,text,x,y,font,color){
    c.font=font;c.fillStyle=color;c.fillText(text,x,y);
  }
  function words(c,value,max,limit){
    const lines=[];
    for(const word of String(value||"").trim().split(/\s+/)){
      const last=lines.length-1,added=last>=0?lines[last]+" "+word:word;
      if(last>=0&&c.measureText(added).width<=max)lines[last]=added;
      else lines.push(word);
    }
    if(lines.length>limit){lines.length=limit;lines[limit-1]+="…";}
    return lines.map(line=>{
      if(c.measureText(line).width<=max)return line;
      let s=line.replace(/…$/,"");while(s&&c.measureText(s+"…").width>max)s=s.slice(0,-1);
      return s.trimEnd()+"…";
    });
  }

  // A pencil over a two-ink field sketch. All three views fit the same clipped image aperture.
  function cine(c){
    shape(c,[0,80,25,71,25,39,85,25,119,33,119,48,152,46,152,111,0,111],blue);
    shape(c,[25,39,81,27,81,107,25,111],"#bb7b66");
    for(let i=0;i<4;i++){
      const x=29+i*13;rule(c,x,43-i*3,x,101-i*1.6,"#d6977d",2);
    }
    shape(c,[38,26,47,20,54,22,54,66,40,69],ink);
    shape(c,[40,26,47,23,50,24,50,65,42,66],"#a76555");
    c.save();c.translate(45,29);c.rotate(-.065);c.textAlign="center";
    for(const [i,ch] of [..."CINE"].entries())label(c,ch,0,i*8.6+4,"bold 8px "+mono,"#fff0c8");
    c.restore();
    shape(c,[14,76,92,56,133,62,122,76,32,96,12,88],ink);
    shape(c,[12,74,93,55,133,60,129,69,34,90,11,84],stock);
    rule(c,12,76,94,57,"#c16a51",2);rule(c,34,86,128,66,"#a86a56",1.6);
    c.save();c.translate(47,80);c.rotate(-.225);
    label(c,"L U N A",0,0,"bold 10px "+serif,ink);c.restore();
    for(let i=0;i<12;i++)oval(c,36+i*7.1,89-i*1.58,1,1,"#edd69e");
    for(let i=0;i<4;i++)shape(c,[42+15*i,94-3*i,52+15*i,92-3*i,52+15*i,111,42+15*i,111],ink);
    rule(c,2,105,35,98,pencil,.7);
  }
  function motel(c){
    shape(c,[0,94,78,78,126,82,153,76,153,111,0,111],"#879683");
    shape(c,[0,87,65,76,112,79,110,84,0,102],"#a67259");
    for(let i=0;i<5;i++)box(c,5+i*20,92-i*2.6,10,12,blue);
    shape(c,[88,6,99,4,103,93,94,100],ink);
    shape(c,[90,8,96,7,100,90,95,94],"#477676");
    box(c,96,95,3,14,ink);rule(c,91,7,96,93,"#e7b376",.9);
    c.save();c.translate(94,16);c.rotate(-.037);c.textAlign="center";
    for(const [i,ch] of [..."MOTEL"].entries())label(c,ch,0,i*13.6+3,"bold 8.5px "+mono,"#f1d8a0");
    c.restore();
    shape(c,[12,60,23,52,62,43,91,44,91,54,41,69,16,71],ink);
    shape(c,[14,60,24,55,67,45,91,46,87,51,40,66,17,68],"#e2bd81");
    // Swept dorsal, split tail and long bill on the enamel road sign.
    shape(c,[23,56,20,47,31,53,43,48,52,37,52,46,66,41,74,42,88,35,76,45,65,51,45,54,33,54,24,63,27,55],blue);
    rule(c,32,53,65,46,stock,1);oval(c,70,44,1.1,.9,ink);
    rule(c,49,67,49,91,ink,2.7);rule(c,54,64,54,90,ink,1);
    shape(c,[111,91,151,80,151,102,110,105],"#bd8971");
    rule(c,1,108,70,95,pencil,.9);
  }
  function wheel(c){
    shape(c,[0,76,26,77,44,74,63,75,86,72,125,73,152,71,152,111,0,111],"#8ba59b");
    for(const x of [8,26,111,130])rule(c,x,84,x+12,83,stock,.7);
    const x=77,y=45,rx=37,ry=35;
    c.strokeStyle=blue;c.lineWidth=2.2;c.beginPath();c.ellipse(x,y,rx,ry,-.07,0,tau);c.stroke();
    c.lineWidth=.8;c.beginPath();c.ellipse(x+3,y,rx-2,ry-1,-.07,0,tau);c.stroke();
    for(let i=0;i<8;i++){
      const a=i*tau/8-.13,px=x+rx*Math.cos(a),py=y+ry*Math.sin(a);
      rule(c,x,y,px,py,blue,i%2?.9:1.2);
      rule(c,px,py,px,py+3,ink,.9);
      shape(c,[px-3.8,py+3,px+3.8,py+3,px+3.1,py+8.1,px-2,py+8.8],i%2?red:ink);
      rule(c,px-2.5,py+5.3,px+3.2,py+5.3,ochre,.8);
    }
    shape(c,[x-1,y,51,101,55,101,x+1,y+5,103,96,106,95,x+2,y],ink);
    oval(c,x,y,4,3.7,red);oval(c,x,y,1.2,1.1,stock);
    shape(c,[0,100,152,89,152,98,0,111],blue);
    for(let i=0;i<12;i++)rule(c,7+i*13,99-i*.92,7+i*13,94-i*.92,ink,.9);
    rule(c,0,95,152,84,ink,1);
  }
  const sketches={luna:cine,marlin:motel,wheel};
  function sketch(c,id){
    c.save();c.translate(32,54);c.rotate(-.035);
    box(c,2,3,162,120,"#b4a48b");box(c,0,0,162,120,"#f8eed7");
    c.translate(5,4);c.beginPath();c.rect(0,0,152,111);c.clip();
    box(c,0,0,152,111,"#d9cbb0");
    oval(c,id==="luna"?112:32,27,15,15,"#eac58e");
    for(let i=0;i<9;i++)rule(c,(i*41)%154,12+(i*11)%29,((i*41)%154)+10,11+(i*11)%29,"#e9dac0",.7);
    sketches[id](c);c.restore();
    // Two small strips of paper tape holding a location reference to the job docket.
    shape(c,[24,62,52,44,58,51,30,69],"rgba(202,177,125,.68)");
    shape(c,[169,167,193,154,197,162,174,176],"rgba(205,181,135,.72)");
  }
  function paint(canvas,brief,info={}){
    if(!canvas?.getContext||!brief||!Object.hasOwn(sketches,brief.id))return false;
    let c;try{c=canvas.getContext("2d");}catch{return false;}
    if(!c||typeof c.fillText!=="function")return false;
    if(canvas.width!==width)canvas.width=width;
    if(canvas.height!==height)canvas.height=height;
    if(canvas.style){canvas.style.maxWidth="100%";canvas.style.height="auto";}
    const title=String(brief.title||"Window Seat"),subject=String(brief.subject||""),driver=String(info?.driver||"Unassigned");
    const score=Number.isFinite(info?.best)?Math.round(Math.max(0,Math.min(100,info.best))):0;
    const best=score||info?.completed?score+" / 100":"—",fee=Number.isFinite(brief.pay)?"$"+Math.round(brief.pay):"—";
    canvas.setAttribute?.("role","img");canvas.setAttribute?.("aria-label",title+". "+subject+". Driver "+driver+". Personal best "+best+". Fee "+fee+".");
    c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,width,height);
    c.lineJoin="round";c.lineCap="round";c.textBaseline="alphabetic";c.textAlign="left";
    const outline=[4,5,397,3,550,7,556,13,553,247,541,255,386,251,152,254,4,250];
    shape(c,outline,stock);
    shape(c,[401,4,551,8,553,247,541,254,389,250],"rgba(152,121,76,.065)");
    rule(c,400,5,389,250,"rgba(105,83,56,.12)",1.3);rule(c,402,5,391,250,"#f9efd6",1.1);
    // Stock fibres follow the grain. Their positions stay fixed when the panel reopens.
    for(let i=0;i<37;i++){
      const x=13+(i*71)%520,y=11+(i*41)%232;
      rule(c,x,y,x+2+i%4,y-.5,"rgba(102,85,62,.12)",.65);
    }
    rule(c,23,40,535,38.6,blue,1.6);rule(c,23,42.5,535,41.1,blue,.5);
    label(c,"SUNDOWN BAY • SECOND UNIT",25,29,"bold 14px "+mono,blue);
    c.textAlign="right";label(c,"LOCATION OFFICE",535,28,"bold 12px "+mono,red);c.textAlign="left";
    sketch(c,brief.id);
    c.font="italic bold 30px "+serif;
    const titles=words(c,title,310,2);
    let baseline=82;
    for(const s of titles){label(c,s,213,baseline,c.font,ink);baseline+=30;}
    const subjectY=titles.length>1?142:129;
    label(c,"SUBJECT",214,subjectY-12,"bold 12px "+mono,red);
    c.font="18px "+serif;
    for(const [i,s] of words(c,subject,307,2).entries())label(c,s,214,subjectY+9+i*19,c.font,ink);
    rule(c,25,186,535,184.8,pencil,.75);
    label(c,"DRIVER",26,206,"bold 12px "+mono,blue);
    label(c,"PERSONAL BEST",273,206,"bold 12px "+mono,blue);
    label(c,"FEE",458,205,"bold 12px "+mono,blue);
    c.font="italic 21px "+serif;label(c,words(c,driver,221,1)[0],25,234,c.font,ink);
    label(c,best,273,234,"bold 19px "+mono,ink);label(c,fee,458,233,"bold 21px "+mono,red);
    rule(c,24,240,246,238,"#b1a58a",.75);rule(c,273,240,421,238.7,"#b1a58a",.75);
    shape(c,[542,255,544,244,553,247],"#c9b995");c.restore();return true;
  }

  // Paths below use widths in normalized window coordinates and depths in local sill units.
  const rubber=[-.04,.27,.32,.13,.78,.27,1.04,.49,1.04,1.14,-.04,1.14];
  const felt=[-.04,.36,.32,.20,.78,.34,1.04,.55,1.04,.67,.78,.45,.32,.30,-.04,.46];
  const door=[-.04,.72,.32,.52,.78,.67,1.04,.88,1.04,1.14,-.04,1.14];
  const foldShadow=[0,.43,.092,.30,.186,.47,.253,.40,.243,.91,.065,.98];
  const foldA=[-.005,.39,.089,.24,.101,.78,.019,.95],foldB=[.089,.24,.182,.41,.183,.92,.101,.78];
  const foldC=[.182,.41,.248,.35,.239,.84,.183,.92];
  const mapInlet=[.014,.52,.078,.45,.097,.48,.128,.61,.178,.58,.223,.55,.224,.59,.176,.63,.127,.66,.092,.52,.078,.50,.016,.57];
  const mapRoad=[.028,.80,.046,.70,.099,.59,.130,.67,.168,.69,.216,.65,.218,.68,.168,.74,.127,.72,.098,.64,.049,.74,.031,.83];
  function glass(c,w,h,pan=0,side=1,time=0){
    if(!c||typeof c.save!=="function"||!Number.isFinite(w)||!Number.isFinite(h)||w<=0||h<=0)return;
    const right=side<0?-1:1,look=Math.sin(Number.isFinite(pan)?pan:0)*right;
    const depth=Math.min(h*.082,46)*(1+.09*look),bounce=Math.sin((Number.isFinite(time)?time:0)*1.8)*Math.min(1.1,h*.0015);
    c.save();c.translate(right<0?w:0,h-depth);c.scale(right*w,depth);
    shape(c,rubber,"#253334");shape(c,felt,"#52605c");shape(c,door,"#3a413f");
    c.translate(.47+.20*look,bounce/depth);shape(c,foldShadow,"#2e3735");
    shape(c,foldA,"#a79f84");shape(c,foldB,"#ccbea0");shape(c,foldC,"#bbaa8c");
    // The ochre road and blue inlet cross the ridges of the folded street plan.
    shape(c,mapInlet,"#829589");shape(c,mapRoad,"#a47754");
    c.restore();
  }
  window.BayWindowSlip=Object.freeze({paint,glass});
})();
