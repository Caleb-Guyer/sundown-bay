/* Bay Wire's street edition. The backshop keeps one screened plate for each picture. */
(() => {
  "use strict";
  const width=660,margin=29,ink="#292d29",oxblood="#873f30",paper="#eee4cb",muted="#595b51";
  const serif="Georgia,'Times New Roman',serif",sans="Arial,Helvetica,sans-serif",plates=new Map();
  const cutlines={
    bib:"Marisol wears forty-one at the boardwalk mile.",
    bell:"The old bell from Little Dot, ashore at the ice landing.",
    pink:"Roseate spoonbills settle on the roof at El Mercado.",
    ocean:"The Marlin Motor Court, seen from the beach side of Ocean Drive."
  };
  function path(c,outline,color){c.fillStyle=color;c.fill(new Path2D(outline));}
  function pen(c,outline,color,weight=1){
    c.strokeStyle=color;c.lineWidth=weight;c.lineJoin="round";c.lineCap="round";c.stroke(new Path2D(outline));
  }
  function oval(c,x,y,rx,ry,color,angle=0){
    c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,2*Math.PI);c.fill();
  }
  function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function label(c,content,x,y,font,color=ink,align="left"){
    c.fillStyle=color;c.font=font;c.textAlign=align;c.textBaseline="alphabetic";c.fillText(content,x,y);
  }
  function palm(c,x,y,s,bend){
    c.save();c.translate(x,y);c.scale(s,s);
    path(c,"M-4 0Q"+(bend-6)+" -35 "+(bend-2)+" -66L"+(bend+2)+" -67Q"+(bend-1)+" -30 3 0Z","#534f43");
    for(let j=0;j<5;j++){
      const q=(j+1)/7,b=2*(1-q)*q*(bend-3)+q*q*bend;
      pen(c,"M"+(b-2.3)+" "+(-q*66)+"l4 -1.6","#ab9f81",.85);
    }
    c.translate(bend,-66);
    for(const [ax,ay,bx,by,ex,ey] of [[-7,-11,-21,-13,-31,-2],[-5,-10,-17,-24,-24,-23],[-10,-2,-23,0,-27,13],
      [2,-11,9,-25,20,-25],[11,-13,27,-14,34,-7],[9,-5,25,-5,31,7],[4,0,13,7,11,22],[-4,0,-11,10,-10,24]]){
      pen(c,`M0 0C${ax} ${ay} ${bx} ${by} ${ex} ${ey}`,"#41493e",1.25);
      for(let i=1;i<11;i++){
        const t=i/12,q=1-t,dx=3*q*q*t*ax+3*q*t*t*bx+t*t*t*ex,dy=3*q*q*t*ay+3*q*t*t*by+t*t*t*ey;
        const len=2.4+3.2*Math.sin(t*Math.PI),dir=Math.sign(ex);
        path(c,`M${dx} ${dy-.5}q${dir*2} .4 ${dir*len} ${len+1}l${-dir*(len-.4)} -3Z`,"#424b42");
      }
    }
    c.restore();
  }
  function pedestrian(c,x,y,s,side,skirt){
    c.save();c.translate(x,y);c.scale(s*side,s);
    path(c,"M-3 -17l3 1 -1 8 -6 8 -3 -1 6 -9ZM1 -17l4 -1 1 8 5 7 -2 2 -7 -7Z","#544f43");
    path(c,"M-7 -1l3 -1 2 2 -6 1 -2 -1Zm16 -1l3 -1 4 2 -5 1Z","#303c37");
    path(c,skirt?"M0 -34q4 -1 5 3l-1 8 5 8q-6 3 -14 0l4 -10 -2 -5Z":"M-2 -33q5 -2 8 3l-1 13 -9 0 1 -11Z",skirt?"#b4a489":"#575e55");
    pen(c,"M3 -30l6 8 4 -2","#666052",2.1);
    oval(c,2,-37,3,4.4,"#756451");path(c,"M-1 -37q-2 -6 3 -6 6 0 6 6l-5 -2Z","#3c4139");
    c.restore();
  }
  function parkedCoupe(c){
    // A three-quarter street view; the far wheels sit under the low front fender.
    oval(c,107,215,79,8,"#a19478",.018);
    oval(c,48,204,8.4,12,"#39403b",-.05);oval(c,152,210,10.8,12.4,"#333a35",.15);
    path(c,"M28 191l8 -7 20 -3 22 -17q5 -3 17 -3l23 1q7 2 16 11l12 10 25 6 13 8 1 12 -15 5 -5 -1q1 -18 -12 -20 -12 -2 -14 15l-76 -7q-2 -18 -12 -18 -8 -1 -10 13l-11 -2Z","#716757");
    path(c,"M32 188l30 -5 22 -18 17 -1 17 1 20 17 27 6 10 4 -24 2 -36 -7 -74 4Z","#b5a789");
    path(c,"M65 180l17 -14 16 -1 -4 16Z","#46564f");path(c,"M100 166l16 1 17 15 -36 -.7Z","#59665c");
    path(c,"M68 179l15 -12 9 -.4 -13 10Z","#b9b9a2");path(c,"M115 168l13 12 -14 -.6 -9 -12Z","#9fa493");
    pen(c,"M94 184l-1 14 -14 1m17 -15l14 1 7 16m-80 -3l25 .7m2 -9l71 7","#4c5148",1.15);
    pen(c,"M38 194l7 -1m104 4l12 2m2 2l18 -3m-1 7l-16 3","#e2d5af",2.2);
    path(c,"M26 197l13 3 1 3 -12 -1Z","#cdc5ac");path(c,"M168 209l17 -4 1 3 -17 6Z","#cfc8af");
    for(const [x,y,s] of [[51,202,.74],[152,207,1]]){
      oval(c,x,y,9*s,12*s,"#343c36",.08);oval(c,x,y,6.2*s,8.1*s,"#cdc5a8",.08);
      oval(c,x+1,y-.5,4.5*s,5.9*s,"#707668",.08);oval(c,x+1,y-1,2.3*s,3.2*s,"#d1c7a8",.08);
    }
  }
  function oceanDrawing(c){
    c.save();c.scale(1.5,1.5);
    box(c,0,0,400,267,"#ddd6be");
    for(const [x,y,s] of [[-14,27,1],[76,12,.55],[157,40,.72],[297,29,.99],[345,9,.68]]){
      c.save();c.translate(x,y);c.scale(s,s);path(c,"M0 8q13 -5 19 -4 8 -11 20 -5 11 -1 17 4 13 0 23 6l-53 -2 -18 3Z","#f4e8c8");c.restore();
    }
    path(c,"M0 99l26 -9 12 1 9 -8 12 1 19 -8 15 4 7 -7 15 2 9 -15 11 1 0 8 16 -2 16 11 7 -6 8 5 15 -3 12 6 15 -9 11 4 5 -3 16 4 10 -7 17 8 4 -5 8 2 9 -7 14 7 8 -2 14 1 16 -5 18 2 9 -5 12 3 11 -6 19 7v40H0Z","#a7a694");
    // Sawtooth parapet, louvred motel doors and a deep arcade casting into the street.
    path(c,"M-5 68L82 80l1 -10 8 1 0 8 48 7v-4l10 1v5l31 5v-4l7 1v4l14 2v31L0 167Z","#b9ac8f");
    path(c,"M-2 75l204 24 -1 5L0 84Z","#d9cbac");
    path(c,"M-5 103L205 108v15L0 155Z","#505a50");
    for(const [x,y,w,h] of [[0,109,15,39],[28,111,14,33],[55,112,14,26],[81,113,12,21],[106,114,10,16],[127,115,8,14],[145,115,8,12],[163,114,7,11],[179,115,6,9]]){
      box(c,x,y,w,h,"#92967e");box(c,x+1,y+4,w-2,h*.32,"#4e5b50");
      const step=Math.max(1.5,w*.14);for(let k=1;k<4;k++)box(c,x+1,y+3+k*step,w-2,.65,"#bdba9f");
    }
    path(c,"M-2 94l206 11 4 2 -10 1L-2 103Z","#e0d0ad");
    pen(c,"M-2 104l202 4","#575d50",1.8);
    for(const [x,y] of [[12,152],[49,143],[83,137],[111,132],[134,128],[154,124],[171,122],[188,120]])pen(c,`M${x} ${104+x*.019}v${y-104-x*.019}`,"#d6c8a6",x<100?2:1.4);
    path(c,"M69 81l4 -55 5 -1 0 -7 4 -1 0 8 7 -1 -2 60Z","#555e51");
    path(c,"M70 80l4 -54 6 -1 -3 55Z","#b6b397");path(c,"M78 79l4 -53 4 -1 -3 54Z","#48554a");
    c.save();c.translate(80,32);c.rotate(.061);
    for(const [i,ch] of [..."MOTEL"].entries())label(c,ch,0,i*8.1,"bold 8px "+sans,"#e1d3af","center");c.restore();
    path(c,"M198 101l12 -9 24 2 1 -6 5 1 0 8 31 5 3 9 -78 8Z","#c7bba0");
    pen(c,"M205 101l68 7m-70 4l68 -1","#777e6d",1.3);
    // The county skyline closes the perspective; the near curb cuts across the foreground.
    palm(c,242,109,.43,-4);palm(c,288,112,.45,-5);palm(c,327,113,.49,6);
    path(c,"M0 157l234 -42 166 -5v12l-171 -1L0 180Z","#e5d8b9");
    path(c,"M0 175l232 -56 168 -4v31L88 267H0Z","#96978a");
    path(c,"M0 180l233 -59 168 -4 -1 2 -164 5L0 186Z","#b5b09b");
    path(c,"M12 263l37 -18 14 0 -33 18Zm93 -46l26 -13 8 -.1 -23 12Zm64 -32l16 -7 5 -.5 -16 8Zm39 -19l12 -5 3 -.3 -10 5Z","#d6ccb0");
    path(c,"M86 267l315 -125v125Z","#c9c1a8");
    pen(c,"M96 267l305 -122m-82 38l44 5m-100 22l80 11m-151 23l72 21","#919282",1.15);
    // The two raked feet and the billfish over the backlit MARLIN letters
    // distinguish the roadside sign from the vertical motel blade behind it.
    pen(c,"M28 156l-3 -86m26 80l6 -84","#5e665a",2.6);
    path(c,"M9 72l1 -19 8 -5 43 -1 8 9 -5 17 -46 6Z","#d6c3a3");
    path(c,"M12 70l1 -15 6 -4 40 -1 7 7 -5 13 -43 6Z","#53665a");
    oval(c,39,52,9.8,9.8,"#d1b491");
    path(c,"M17 54l7 1q9 -10 18 -9l-2 -6 10 5 12 -6 -10 9q-8 8 -22 9l-7 6 1 -6 -8 1Z","#4f6155");
    pen(c,"M27 56q12 -1 23 -8","#ebe1c1",1.2);
    c.save();c.translate(38,70);c.rotate(-.08);label(c,"MARLIN",0,0,"bold 9.6px "+sans,"#f2e5c1","center");c.restore();
    path(c,"M28 84l26 -3 -.5 6 -26 3Z","#656e5f");pen(c,"M34 86l14 -1.6","#d5c5a6",1.4);
    pen(c,"M213 100l0 -15q-1 -4 -7 -3m39 25v-14q1 -3 5 -3","#6b7566",1);
    box(c,201,81,7,1.5,"#4c554a");
    path(c,"M254 123l10 -2 3 -4 6 -.3 5 3 5 .3 1 3 -7 1 -13 .3 -9 1Z","#677567");
    parkedCoupe(c);
    pedestrian(c,45,148,.51,1,true);pedestrian(c,133,129,.36,-1,false);
    palm(c,377,176,1.7,5);palm(c,310,145,.94,-9);
    pedestrian(c,340,202,.86,-1,true);pedestrian(c,357,199,.94,-1,false);
    // A folded broadsheet tucked under the taller figure's elbow.
    path(c,"M345 174l6 -2 3 10 -6 3Z","#eee0bf");pen(c,"M347 175l4 -1m-3 4l3 -1","#5f6859",.9);
    c.restore();
  }
  function plate(id){
    if(plates.has(id))return plates.get(id);
    const image=document.createElement("canvas");image.width=600;image.height=400;
    const c=image.getContext("2d");
    if(id==="ocean"||!window.BayNeighborhoodEdition?.paint(image,id))oceanDrawing(c);
    screen(c,image);plates.set(id,image);return image;
  }
  function screen(c,image){
    // Convert the photograph into round letterpress dots. The dot lattice is
    // angled against the page rulings, just as on a screened zinc plate.
    const pixels=c.getImageData(0,0,image.width,image.height),d=pixels.data;
    for(let y=0,i=0;y<image.height;y++)for(let x=0;x<image.width;x++,i+=4){
      const luminance=(d[i]*.27+d[i+1]*.61+d[i+2]*.12)/255;
      const tone=Math.max(.01,Math.min(.999,(luminance-.09)/.77));
      const sx=(x*.929+y*.37)/4.1,sy=(-x*.37+y*.929)/4.1;
      const a=sx-Math.round(sx),b=sy-Math.round(sy);
      const dot=Math.max(0,Math.min(1,(.67*(1-tone)**.57-Math.sqrt(a*a+b*b))*5+.43));
      const coverage=.60*dot+.40*(1-tone);
      d[i]=232-coverage*199;d[i+1]=221-coverage*183;d[i+2]=192-coverage*151;
    }
    c.putImageData(pixels,0,0);
  }
  const pierPlates=new WeakMap(),covers=new WeakMap(),mounted=new WeakMap();
  function pierPlate(frame){
    let p=pierPlates.get(frame);if(p)return p;
    const img=BayLotNegative.photo(frame);if(!img?.naturalWidth)return null;
    p=document.createElement("canvas");p.width=400;p.height=225;
    const c=p.getContext("2d");c.drawImage(img,0,0,p.width,p.height);screen(c,p);
    pierPlates.set(frame,p);return p;
  }
  function cover(frame){
    let c=covers.get(frame);if(c)return c;
    const p=pierPlate(frame);if(!p)return null;
    c=document.createElement("canvas");c.width=360;c.height=310;const g=c.getContext("2d");
    box(g,0,0,360,310,paper);label(g,"BAY WIRE",180,53,"bold 55px "+serif,ink,"center");box(g,10,60,340,2,ink);
    label(g,frame.frame==="14B"?"Two lunches on the six o’clock boat":"Public landing goes up for sale",10,88,"bold 21px "+serif);
    g.drawImage(p,10,97,340,191);label(g,"PORT SOL   /   M. VEGA   /   "+frame.frame,10,303,"bold 11px monospace");
    covers.set(frame,c);return c;
  }
  function lines(c,value,font,measure){
    c.font=font;const words=String(value||"").trim().split(/\s+/u),rows=[];let line="";
    for(const word of words){
      if(!word)continue;
      if(line&&c.measureText(line+" "+word).width>measure){rows.push(line);line="";}
      if(c.measureText(word).width>measure){
        for(const letter of word){
          if(line&&c.measureText(line+letter).width>measure){rows.push(line);line="";}
          line+=letter;
        }
      }else line=line?line+" "+word:word;
    }
    if(line)rows.push(line);return rows;
  }
  function column(c,rows,x,top,font,leading,color=ink){
    for(let i=0;i<rows.length;i++)label(c,rows[i],x,top+leading*(i+.79),font,color);
  }
  let nameplate;
  function masthead(c){
    if(!nameplate){
      nameplate=document.createElement("canvas");nameplate.width=480;nameplate.height=76;
      const n=nameplate.getContext("2d"),type="bold 92px "+serif;
      n.font=type;n.scale(472/n.measureText("BAY WIRE").width,.90);
      label(n,"BAY WIRE",4,80,type,ink);n.setTransform(1,0,0,1,0,0);
      n.globalCompositeOperation="source-atop";
      for(let y=13;y<68;y+=4)box(n,0,y,480,.65,"rgba(238,228,203,.35)");
    }
    c.drawImage(nameplate,(width-nameplate.width)/2,24);
    for(const side of [-1,1]){
      c.save();c.translate(side===-1?70:590,74);c.scale(side===-1?1:-1,1);
      pen(c,"M-32 -2q7 -9 14 -4t13 -1m-23 7q8 -6 14 -2t13 -3m-20 10q6 -5 11 -4t9 -5",ink,1.5);c.restore();
    }
  }
  function stock(c,height){
    box(c,0,0,width,height,paper);
    let seed=5236701;const random=()=>((seed=Math.imul(1664525,seed)+1013904223>>>0)/4294967296);
    for(let i=0;i<1200;i++){const x=random()*width,y=random()*height;box(c,x,y,.4+random()*1.7,.4+random()*.5,i%3?"#e2d8be":"#f7efd9");}
    const aged=c.createLinearGradient(0,0,width,0);
    for(const [x,a] of [[0,.12],[.025,0],[.483,0],[.5,.05],[.508,0],[.97,0],[1,.09]])aged.addColorStop(x,`rgba(117,88,45,${a})`);
    box(c,0,0,width,height,aged);
  }
  function paint(canvas,issue={}){
    if(!canvas)return false;
    const c=canvas.getContext("2d");if(!c)return false;
    const day=Math.max(1,Math.floor(Number(issue.day)||1)),id=Object.hasOwn(cutlines,issue.photo)?issue.photo:"ocean";
    const section=String(issue.section||"City desk").toUpperCase(),headline=String(issue.headline||"The bay gets an early start");
    const deckFont="22px "+serif,bodyFont="21px "+serif,captionFont="italic 17px "+serif;
    const full=width-2*margin,picW=371,rail=margin+picW+27,railW=width-margin-rail;
    const titleSize=headline.length>76?39:headline.length>47?44:51,headFont="bold "+titleSize+"px "+serif;
    const head=lines(c,headline,headFont,full),deck=lines(c,issue.deck,deckFont,full);
    const locals=lines(c,issue.local,bodyFont,railW),listing=lines(c,issue.listing,bodyFont,railW);
    const pier=issue.pierPhoto,cutline=pier?BayLotNegative.captions[pier.frame]+". Frame "+pier.frame+".":cutlines[id];
    const caption=lines(c,cutline,captionFont,picW),headTop=166,headLead=titleSize*1.005;
    const deckTop=headTop+head.length*headLead+7,bylineY=deckTop+deck.length*26+20,body=bylineY+19;
    const imageH=Math.round(picW*(pier?9/16:2/3)),railTop=body+27,lineH=24;
    const listingHead=railTop+locals.length*lineH+(locals.length?27:0);
    const footer=Math.ceil(Math.max(body+imageH+10+caption.length*20,listingHead+(listing.length?13+listing.length*lineH:0))+23);
    canvas.width=width;canvas.height=footer+36;
    stock(c,canvas.height);masthead(c);
    box(c,margin,109,full,2.8,ink);box(c,margin,114,full,.8,ink);
    label(c,"SUNDOWN BAY",margin,133,"bold 15px "+sans);
    label(c,"Street edition",width/2,133,"italic 17px "+serif,ink,"center");
    label(c,"DAY "+String(day).padStart(2,"0"),width-margin,133,"bold 15px "+sans,ink,"right");
    box(c,margin,140,full,.9,ink);label(c,section,margin,160,"bold 15px "+sans,oxblood);
    column(c,head,margin,headTop,headFont,headLead);column(c,deck,margin,deckTop,deckFont,26);
    label(c,pier?"Photograph by Mara Vega":id==="ocean"?"Street drawing by Meli Funes":"From the picture desk of Meli Funes",margin,bylineY,"bold 15px "+sans);
    mounted.set(canvas,issue);
    if(pier){
      const print=()=>{const p=pierPlate(pier);if(p&&mounted.get(canvas)===issue)c.drawImage(p,margin+1,body+1,picW-2,imageH-2);};
      const img=BayLotNegative.photo(pier);if(img?.naturalWidth)print();else img?.addEventListener("load",print,{once:true});
    }else c.drawImage(plate(id),margin,body,picW,imageH);
    c.strokeStyle=ink;c.lineWidth=1;c.strokeRect(margin+.5,body+.5,picW-1,imageH-1);
    column(c,caption,margin,body+imageH+7,captionFont,20,muted);
    const railLine=rail-14;
    if(locals.length||listing.length)box(c,railLine,body,1,footer-body-13,"#948f7b");
    if(locals.length){
      box(c,rail,body,railW,2,ink);label(c,"Around town",rail,body+21,"bold 21px "+serif);
      column(c,locals,rail,railTop,bodyFont,lineH);
    }
    if(listing.length){
      box(c,rail,listingHead-17,railW,1.3,ink);label(c,"What's on",rail,listingHead+4,"italic bold 21px "+serif);
      column(c,listing,rail,listingHead+13,bodyFont,lineH);
    }
    box(c,margin,footer,full,1.4,ink);
    label(c,"BAY WIRE",margin,footer+21,"bold 14px "+serif);
    label(c,"Sundown Bay  ·  City desk",width/2,footer+21,"14px "+sans,muted,"center");
    label(c,"1",width-margin,footer+21,"bold 16px "+serif,ink,"right");
    return true;
  }
  function inscription(issue){
    return issue.pierPhoto.frame==="14B"?["For Mara,", "Your dad always packed an orange.", "I kept finding the peels in my tin."]:
      ["For Mara,", "Your dad drew that timetable.", "Check the six. He wrote it left-handed."];
  }
  function reverse(canvas,issue){
    mounted.delete(canvas);
    canvas.width=840;canvas.height=462;
    const c=canvas.getContext("2d");if(!c)return;
    const blue="#294e64",graphite="#40536a";
    box(c,0,0,840,462,"#586766");
    for(let n=0;n<8;n++){
      box(c,0,n*65,840,2,"#465656");box(c,0,n*65+2,840,1,"#89908a");
      for(let i=0;i<9;i++)box(c,(n*57+i*93)%840,n*65+8+(i*7)%41,16+i,1,"#626f6c");
    }
    c.save();c.translate(420,231);c.rotate(.025);
    box(c,-362,-204,735,422,"#475350");box(c,-369,-213,738,422,blue);
    c.strokeStyle="#829392";c.lineWidth=3;c.strokeRect(-361,-205,722,405);
    for(let i=0;i<12;i++)box(c,-341+(i*97)%659,-201+(i%2)*397,5+(i%3)*6,2,"#adab96");
    c.rotate(-.056);
    box(c,-325,-174,656,358,"#303f3d");box(c,-327,-178,657,357,"#cabfa7");
    box(c,-331,-181,657,356,paper);
    label(c,"BAY WIRE", -298,-143,"bold 19px "+serif,muted);
    label(c,"PORT SOL     /     DAY "+String(issue.day).padStart(2,"0"),294,-144,"13px "+sans,muted,"right");
    box(c,-298,-132,592,1,"#a29f8d");
    box(c,5,-179,2,352,"#d0c5ae");box(c,7,-179,2,352,"#faf0d8");
    const words=inscription(issue);
    for(let i=0;i<words.length;i++)label(c,words[i],-268+(i===0?0:12),-68+i*49,"italic "+(i===0?34:30)+"px "+serif,graphite);
    // His name is a single pencil stroke. The last downstroke catches on the fold.
    c.save();c.translate(110,47);
    pen(c,"M0 39Q-9 34 10 12Q32 -15 20 10Q-4 54 9 43Q19 34 23 38Q26 42 31 35L37 25Q25 49 39 39L49 27Q37 49 51 39L58 30Q48 47 62 39Q77 31 71 24Q54 31 68 35Q81 43 94 30M53 20l1 -3M-2 53Q39 46 106 42",graphite,2.6);
    c.restore();
    label(c,"LUIS VEGA    ·    NIGHT SHIFT",117,123,"12px "+sans,muted);
    c.restore();
  }
  window.BayStreetEditionArt=Object.freeze({paint,cover,inscription,reverse});
})();
