/* The Starlite's silent summer print. Three cuts, one lap down the coast. */
(() => {
  "use strict";
  const w=416,h=234,tau=Math.PI*2,ink="#303a40",cream="#ffe0a1";
  const serif='Georgia, "Times New Roman", serif', sans='Arial, sans-serif';
  const clamp=n=>Math.min(1,Math.max(0,n));
  const smooth=n=>{n=clamp(n);return n*n*(3-2*n);};
  const wrap=(n,m)=>((n%m)+m)%m;
  function rect(c,x,y,ww,hh,col){c.fillStyle=col;c.fillRect(x,y,ww,hh);}
  function path(c,p,paint,width){
    c.beginPath();c.moveTo(p[0],p[1]);for(let i=2;i<p.length;i+=2)c.lineTo(p[i],p[i+1]);
    if(width){c.strokeStyle=paint;c.lineWidth=width;c.stroke();}
    else{c.fillStyle=paint;c.closePath();c.fill();}
  }
  function oval(c,x,y,rx,ry,paint){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);c.fillStyle=paint;c.fill();
  }
  function letter(c,str,x,y,size,paint,font,align="left"){
    c.textAlign=align;c.font=size+" "+font;c.fillStyle=paint;c.fillText(str,x,y);
  }
  function wash(c,y0,y1,colors){
    const g=c.createLinearGradient(0,y0,0,y1);
    colors.forEach((s,i)=>g.addColorStop(i/(colors.length-1),s));return g;
  }
  /* A bent coconut palm. Each frond carries staggered lance-shaped leaflets. */
  function palm(c,x,ground,length,bend,color,lit){
    const cx=x+bend,cy=ground-length,s=length/97;
    c.save();c.translate(cx,cy);c.scale(s,s);
    const b=bend/s;
    path(c,[-b-3.7,97,-b+2,65,-b*.45,28,-1,0,1.5,.4,-b*.42+2,30,-b+7,65,-b+5,97],color);
    if(lit)path(c,[-b+3,94,-b+4,66,-b*.38+1,31,.7,4],lit,1);
    for(const [dx,dy,lift] of [[-40,14,27],[-34,-1,23],[-18,-11,14],[7,-13,12],[30,-7,21],[43,10,24],[25,25,16],[-16,28,17]]){
      const points=[];
      for(let j=0;j<=9;j++){
        const u=j/9;points.push(dx*u,dy*u-Math.sin(Math.PI*u)*lift*.55);
      }
      path(c,points,color,1.6);
      for(let j=1;j<9;j++){
        const u=j/9,px=dx*u,py=dy*u-Math.sin(Math.PI*u)*lift*.55;
        const leaf=(1-u)*9+3,sign=dx<0?-1:1;
        path(c,[px,py,px+sign*leaf*.58,py+leaf*.40,px+sign*leaf,py+leaf*1.27,px+sign*2,py+3],color);
      }
    }
    c.restore();
  }
  function wheel(c,x,y,theta){
    oval(c,x,y,14.2,14.2,"#34383c");oval(c,x,y,10.6,10.6,"#c5ab82");oval(c,x,y,8.7,8.7,"#485354");
    oval(c,x,y,7.0,7,"#bcb8a1");
    for(let i=0;i<5;i++){
      const a=theta+i*tau/5,cs=Math.cos(a),sn=Math.sin(a);
      path(c,[x+2.2*cs,y+2.2*sn,x+6.6*cs,y+6.6*sn],"#6a726c",1.2);
    }
    oval(c,x,y,2.9,2.9,"#e3d8b5");
  }
  function driver(c,x,y,front){
    c.save();c.translate(x,y);const skin=front?"#a66d55":"#d3a275";
    path(c,[-4,6,-7,9,-11,23,9,23,8,12,3,8,2,4],front?"#ebe2bb":"#94aa95");
    path(c,[-2,5,-2,9,2,11,5,7,3,4],skin);
    oval(c,0,0,6.1,7.2,skin);path(c,[4,-2,6,-1,7.6,2,5.6,2.5,5,5,1,5,1,-2],skin);
    if(front){
      path(c,[-7,6,-7,-2,-4,-7,2,-8,5,-7,6,-4,1,-4,-3,-1,-3,4,-1,8,-5,7],"#3f3535");
      path(c,[.2,-1.5,5.4,-1.6,5.2,.4,2.3,.6],"#394140");
      path(c,[-5,8,1,11,5,8,1,14,-5,11],"#b85846");
      path(c,[4,14,9,13,16,17,26,14,28,16,16.7,20,7,18],"#ba8463");
    }else{
      path(c,[-10,2,-7,-3,-6,-7,0,-9,5,-7,6,-4,3,-4,0,-5,-2,0,-5,4,-7,4],"#8b6753");
      path(c,[-7,-4,3,-7,7,-4,3,-4,-6,-2,-12,2,-18,1,-13,-1],"#ce7356");
    }
    c.restore();
  }
  function caleta(c,x,y,scale,theta){
    c.save();c.translate(x,y);c.scale(scale,scale);
    oval(c,3,4,114,7.6,"rgba(52,50,48,.46)");
    wheel(c,-64,-6,theta);wheel(c,72,-6,theta);
    // Upholstery, occupants and the turquoise canvas stowed in soft folds on the rear shelf.
    path(c,[-53,-26,-47,-43,-41,-45,-32,-43,-27,-25,7,-24,11,-44,19,-45,26,-25],ink);
    driver(c,-25,-47,false);driver(c,7,-44,true);
    path(c,[29,-29,34,-37,39,-39,41,-37,34,-30],"#35403e",2);
    path(c,[-82,-28,-74,-37,-66,-39,-61,-36,-53,-39,-46,-37,-39,-38,-31,-32,-29,-26],"#397e7b");
    path(c,[-78,-31,-70,-35,-63,-33,-52,-36,-42,-34,-35,-31],"#87a996",1.6);
    path(c,[33,-29,45,-50,53,-51,49,-28],"rgba(142,192,183,.55)");
    path(c,[31,-27,45,-51,53,-52,56,-52],cream,2.1);
    path(c,[47,-49,46,-28],"#728d83",1.3);
    // The single outer panel is scalloped over the wheels, so the whitewalls stay exposed.
    c.beginPath();c.moveTo(-109,-34);c.lineTo(-80,-33);c.lineTo(-66,-30);c.lineTo(-29,-30);
    c.bezierCurveTo(-12,-27,10,-27,30,-30);c.lineTo(48,-32);c.bezierCurveTo(72,-32,95,-31,109,-27);
    c.lineTo(114,-23);c.lineTo(114,-10);c.lineTo(90,-7);c.bezierCurveTo(86,-26,60,-27,55,-6);
    c.lineTo(-47,-6);c.bezierCurveTo(-50,-26,-77,-26,-82,-7);c.lineTo(-106,-10);
    c.lineTo(-110,-17);c.closePath();c.fillStyle=wash(c,-33,-6,["#f9e3a1","#dcc283","#b59b6e"]);c.fill();
    path(c,[-104,-29,-76,-27,-24,-27,5,-25,41,-29,90,-29,108,-26],"#ffebbb",1.8);
    path(c,[-104,-21,-85,-18,-46,-18,-17,-20,26,-22,73,-26,110,-24],"#c2966c",1.1);
    path(c,[-106,-19,-86,-16,-50,-16,-16,-18,27,-20,71,-24,111,-22],"#e9d6ac",1.35);
    path(c,[-25,-27,-26,-22,-23,-9,31,-9,35,-27],"#a89772",.85);
    rect(c,-20,-25,7,1.7,"#686e63");rect(c,-19,-25.3,5,.75,"#fce8bc");
    rect(c,104,-23,9,4.4,"#f7e9b8");rect(c,-109,-25,6,5,"#a95342");
    path(c,[-112,-14,-110,-10,-92,-9],"#d8d1ac",3.4);
    path(c,[93,-9,115,-11,116,-14],"#d3d6b6",3.4);
    path(c,[-46,-7,51,-7],"#ece1b3",1.7);path(c,[43,-31,44,-35,49,-36],"#d6ceb0",1.3);
    oval(c,49,-36,3.1,1.6,"#797f75");c.restore();
  }
  function motelier(c,t){
    const pan=t*3.5;
    rect(c,-3,-3,422,242,wash(c,-2,120,["#a59bac","#e7aa9b","#f4c593"]));
    oval(c,342-pan*.26,69,23,23,"#f6cf9a");
    for(let i=0;i<6;i++)palm(c,14+i*86-pan*.5,124,52+i%3*9,i%2?9:-6,"#9c8e85");
    rect(c,0,143,416,92,wash(c,143,236,["#caac89","#b28e77","#987b73"]));
    c.save();c.translate(-pan,0);
    // A shallow sawtooth gallery and turquoise room doors cut across the coral stucco.
    path(c,[-14,91,401,71,443,74,443,149,-14,164],"#c98273");
    path(c,[-12,145,443,126,443,149,-12,169],"#9d6a64");
    for(let j=0;j<8;j++){
      const x=-12+65*j,y=107-x*.044;
      path(c,[x,y+3,x+17,y+2,x+17,y+44,x,y+44],"#53796f");
      path(c,[x+2,y+4,x+15,y+3,x+15,y+41,x+2,y+41],"#73948b");
      oval(c,x+13,y+24,.9,.9,cream);
      path(c,[x+25,y+5,x+53,y+4,x+53,y+22,x+25,y+24],"#6c7973");
      for(let k=0;k<4;k++)path(c,[x+26,y+7+k*4,x+52,y+6+k*4],"#b9b39a",1.4);
      path(c,[x+22,y+25,x+56,y+23],"#e2b390",2.5);
      rect(c,x+5,y+8,6,3,"#b7ba9f");letter(c,String(11+j),x+5.5,y+10.4,"bold 2.8px","#567069",sans);
      if(j===1||j===3||j===5){
        // Webbed aluminium chairs next to the rooms, still out from the afternoon.
        for(const d of [0,4,8])path(c,[x+29+d,y+31,x+30+d,y+37],"#c2ba99",2.2);
        path(c,[x+28,y+30,x+30,y+38,x+41,y+38,x+44,y+42],"#d6c4a0",1.15);
        path(c,[x+30,y+42,x+39,y+36],"#c3b598",1);
      }else if(j===2||j===6){
        path(c,[x+34,y+37,x+41,y+37,x+40,y+42,x+35,y+42],"#b66e58");
        for(const d of [-5,-2,1,4])path(c,[x+37,y+37,x+36+d,y+31-Math.abs(d)%3,x+33+d,y+30],"#757f69",1.6);
      }
    }
    path(c,[-9,89,401,69,451,73,435,81,-9,103],"#dca08b");
    path(c,[-9,97,438,74,435,82,-9,106],"#f3c29a");
    path(c,[-8,107,435,84,423,92,-8,117],"rgba(101,70,66,.42)");
    for(let j=0;j<8;j++){const x=j*67+1,y=103-x*.052;
      path(c,[x,y,x+3,y-.2,x+4,y+54,x+1,y+54],"#f0bd99");}
    path(c,[-9,163,438,142,420,149,-9,173],"#ebc09b");
    path(c,[-9,174,420,150,416,155,-9,180],"#a8796c");
    // The Marlin rooftop sign is a sailfish with a long bill and a ridged dorsal sail.
    path(c,[252,76,252,59,259,59,259,76,323,72,323,55,327,55,327,72],"#846f68");
    path(c,[245,42,323,39,335,45,331,64,246,67,241,58],"#729989");
    path(c,[246,45,322,42,331,46],"#f0b698",1.4);
    letter(c,"Marlin",253,60,"italic bold 20px","#ffdab0",serif);
    path(c,[294,39,303,34,307,25,309,31,313,26,313,31,318,28,317,33,328,31,341,27,329,34,325,38,314,40,305,39,297,44,298,40,291,41],"#557f78");
    path(c,[300,39,308,35.5,323,34,336,29.5],"#ffe0ac",1.1);
    rect(c,246,68,84,7,"#b36f62");letter(c,"M O T O R   C O U R T",252,73.5,"bold 5.8px","#f4ceaa",sans);
    c.restore();
    for(let i=0;i<5;i++)path(c,[-82+i*111-pan,233,-12+i*104-pan,177],"#e0b891",1.5);
    const x=60+t*20+t*t*5;caleta(c,x,188+t*1.2,.60+.018*t,t*11);
    if(t<3.1){
      c.save();c.globalAlpha=1-smooth((t-2.35)/.75);
      letter(c,"Coast Road",17,51,"italic bold 34px","#725e65",serif);
      letter(c,"Coast Road",16,50,"italic bold 34px","#fff0bf",serif);
      path(c,[19,58,88,58],"#fff0bf",1);letter(c,"1983",95,61,"bold 10px","#fff0bf",sans);c.restore();
    }
  }
  function ocean(c,t){
    rect(c,-3,-3,422,242,wash(c,0,130,["#828ca4","#d59d94","#f5c68e"]));
    oval(c,292-t*1.4,84,29,29,"#ffda9d");
    for(let i=0;i<8;i++){
      const x=wrap(i*79-t*1.4,475)-33,y=47+i%3*12;
      path(c,[x,y,x+9,y-2,x+20,y-1,x+33,y],"#dbaea0",1.3);
    }
    rect(c,0,103,416,55,wash(c,103,151,["#748e91","#8ca6a0","#b0b2a0"]));
    rect(c,0,103,416,1.4,"#d3b594");
    for(let j=0;j<11;j++)for(let i=0;i<5;i++){
      const x=wrap(i*97+j*39-t*(j*.6+2),450)-20,y=106+j*3.3;
      path(c,[x,y,x+7+j*1.5,y+.4,x+12+j*2,y-.3],i%2?"#bed0b3":"#c7cbb0",.9);
    }
    for(let i=0;i<9;i++){const y=106+i*3.1,xx=278-t*1.4+Math.sin(i*13+t*2)*7;
      path(c,[xx-i*.9,y,xx+11+i*1.8,y],"#eac59b",1.1);}
    // A small sail makes the horizon readable even on the projection screen.
    const sail=72-t*2;path(c,[sail,103,sail+8,92,sail+8,103],"#f4d8aa");path(c,[sail-2,104,sail+12,104,sail+9,106,sail+1,106],"#748981");
    rect(c,0,146,416,19,"#ceb390");
    for(let i=0;i<5;i++){
      const x=wrap(i*110-t*14,550)-52;
      path(c,[x-25,149,x-13,146,x-5,146,x-1,144,x+9,148,x+21,147,x+28,151,x+38,152,x+40,155,x-26,155],"#a09d82");
    }
    for(let i=0;i<3;i++){const x=wrap(i*181+94-t*21,543)-50;palm(c,x,152,82+i%2*11,i%2?15:-11,"#6c8178");}
    rect(c,0,157,416,78,wash(c,157,234,["#908a85","#8b827e","#837679"]));
    path(c,[0,156,416,156],"#ddbd94",3);path(c,[0,162,416,162],"#af9983",2);
    for(let j=0;j<6;j++){const x=wrap(j*106-t*71,636)-105;
      path(c,[x,208,x+51,208,x+55,210,x-5,210],"#c7b49a");}
    const carX=198+Math.sin(t*.78)*11;
    caleta(c,carX,186+Math.sin(t*6)*.45,1.02,t*15);
    // Foreground trunks sweep the edge of the frame; the road and distant grove move at other speeds.
    const fg=483-t*96;
    path(c,[fg+2,236,fg+12,192,fg+30,121,fg+58,6,fg+62,-2,fg+68,-2,fg+45,121,fg+29,193,fg+23,236],"#4e6059");
    path(c,[fg+20,235,fg+28,190,fg+43,120,fg+65,0],"#687668",2);
  }
  function rearCaleta(c,x,y,k,braking){
    c.save();c.translate(x,y);c.scale(k,k);
    oval(c,0,4,64,9,"#3d4147");
    rect(c,-51,-12,13,15,"#33383e");rect(c,39,-12,13,15,"#33383e");
    path(c,[-45,-25,-29,-51,27,-51,47,-28],"#a2b1a2");
    path(c,[-40,-28,-28,-48,25,-48,40,-29],"#526869");
    for(const [u,skin,hair]of [[-17,"#b18164","#3e373a"],[12,"#cc9670","#795849"]]){
      oval(c,u,-41,5.8,7,skin);oval(c,u-1,-44,6,5.4,hair);
      path(c,[u-5,-38,u+3,-38,u+10,-31,u-10,-30],u<0?"#bd947c":"#9eac96");
    }
    path(c,[-42,-30,-30,-36,-15,-34,0,-37,18,-34,30,-35,43,-29,36,-24,-31,-24],"#367a77");
    path(c,[-38,-29,-27,-32,-17,-30.5,-3,-33,11,-31,28,-32,39,-29],"#81a698",1.8);
    path(c,[-56,-28,-46,-32,-31,-27,33,-27,47,-33,56,-28,56,-9,50,-4,-49,-4,-56,-9],
      wash(c,-31,-5,["#f1d59a","#d3b381","#ae9176"]));
    path(c,[-54,-27,-37,-24,34,-24,54,-28],"#f9deb1",1.7);
    path(c,[-54,-20,-42,-18,-42,-13,-54,-15],braking?"#ff9069":"#ad624f");
    path(c,[54,-20,42,-18,42,-13,54,-15],braking?"#ff9069":"#ad624f");
    rect(c,-9,-16,18,7,"#a08c70");rect(c,-8,-15.4,16,5.6,"#e5d6a5");
    path(c,[-5,-12,5,-12],"#646e64",1.2);
    path(c,[-55,-10,-48,-7,46,-7,55,-10],"#d1c9a8",3.5);c.restore();
  }
  function starlite(c,t){
    rect(c,-3,-3,422,242,wash(c,0,136,["#565674","#9c7c88","#d69d86"]));
    for(const [x,y]of [[22,22],[71,12],[123,33],[175,16],[350,23],[396,39],[97,55]])oval(c,x,y,.8,.8,"#dfc8ae");
    for(let i=0;i<8;i++)palm(c,i*61-13,126,48+i%3*13,i%2?8:-4,"#646c70");
    path(c,[0,110,30,107,58,109,93,105,146,109,188,104,235,109,295,100,340,106,377,100,416,106,416,134,0,134],"#515d60");
    rect(c,0,126,416,110,wash(c,126,235,["#937f77","#796d6c","#5d5962"]));
    const sx=247,sy=41,sw=138,sh=72;
    for(const x of [sx+6,sx+64,sx+132]){path(c,[x,sy+63,x-8,132],"#485453",4);path(c,[x+2,sy+65,x+15,132],"#646b61",2);}
    rect(c,sx-4,sy-4,sw+8,sh+8,"#495452");rect(c,sx-2,sy-2,sw+4,sh+4,"#aeab93");
    c.save();c.beginPath();c.rect(sx,sy,sw,sh);c.clip();
    rect(c,sx,sy,sw,sh,wash(c,sy,sy+sh,["#bcc8b3","#f2d4a5","#edc599"]));
    oval(c,sx+sw*.68,sy+sh*.50,12,12,"#f4dfae");
    rect(c,sx,sy+sh*.60,sw,sh*.4,"#96aaa1");
    for(let i=0;i<9;i++){const x=sx+wrap(i*36-t*2,155)-13,y=sy+sh*.62+(i%4)*4;path(c,[x,y,x+16,y],"#d6d5b5",1);}
    path(c,[sx-2,sy+sh-3,sx+23,sy+sh-11,sx+61,sy+sh-6,sx+74,sy+sh,sx-2,sy+sh],"#8d9a88");
    palm(c,sx+19-t*.6,sy+sh-8,34,5,"#7a9289");
    for(let i=0;i<3;i++){const x=sx+70+i*13+t*1.7,y=sy+17-i*2+Math.sin(t*2+i);
      path(c,[x-4,y-1,x,y+.5,x+3,y-2],"#8f9b92",.9);}
    c.restore();
    // The screen glows above a row of windshields; our speaker is the closest foreground object.
    for(let i=0;i<8;i++){
      const x=i*57+4,y=133+i%2*4;
      path(c,[x-19,y,x-18,y-5,x-10,y-6,x-6,y-11,x+4,y-11,x+11,y-6,x+18,y-5,x+20,y],"#4f5856");
      path(c,[x-7,y-7,x-4,y-10,x+3,y-10,x+7,y-7],"#929588");
    }
    for(let i=0;i<7;i++){const x=14+i*66;
      path(c,[x,153,x,131],"#505754",1.7);rect(c,x-4,131,7,4,"#686e63");}
    for(const [a,b]of [[-26,101],[79,160],[201,224],[342,286],[437,338]])path(c,[a,235,b,145],"#998b77",1.5);
    path(c,[0,89,17,80,50,80,62,86,62,115,0,120],"#404f50");
    path(c,[0,86,16,77,48,77,64,84,58,86,17,82,0,89],"#747a6b");
    rect(c,50,89,10,4.7,"#eed19a");
    path(c,[59,89,sx,sy,sx,sy+sh,59,94],"rgba(252,217,156,.20)");
    for(let i=0;i<9;i++){
      const x=75+wrap(i*39+t*(2+i%3),159),y=92+(i%3-1)*(x-60)*.11+Math.sin(t+i)*2;
      oval(c,x,y,.6,.6,"rgba(251,220,166,.50)");
    }
    const travel=smooth(t/4.45),x=104+travel*124,y=228-travel*92;
    rearCaleta(c,x,y,1.17-travel*.61,t>3.4);
    if(travel>.86){
      c.save();c.globalAlpha=smooth((travel-.86)/.14)*.8;
      path(c,[x-16,y-27,x+14,y-27,x+21,y-17],"#f1d6a6",1);c.restore();
    }
    // A cast aluminium window speaker on a hooked pole, with a slack return cable.
    path(c,[344,236,344,174,343,166,339,164],"#494f4c",4.5);
    path(c,[342.5,236,342.5,174,341,167,338,166],"#aaab91",1.1);
    path(c,[334,164,345,163,347,167,346,181,333,182,331,179,331,167],"#59615b");
    for(let j=0;j<4;j++)path(c,[334,168+j*2.5,343,167+j*2.5],"#929781",1);
    c.beginPath();c.moveTo(337,181);c.bezierCurveTo(323,217,348,214,343,191);c.strokeStyle="#44494a";c.lineWidth=1.8;c.stroke();
  }
  function paint(canvas,elapsedSeconds){
    if(!canvas)return false;if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
    const c=canvas.getContext("2d");if(!c)return false;
    const t=wrap(Number.isFinite(elapsedSeconds)?elapsedSeconds:0,16),frame=Math.floor(t*16);
    c.save();c.setTransform(1,0,0,1,0,0);c.globalAlpha=1;c.lineCap="round";c.lineJoin="round";
    if(t<5.15)motelier(c,t);else if(t<10.5)ocean(c,t-5.15);else starlite(c,t-10.5);
    // Sparse emulsion specks stay under one film pixel; neither grain nor cuts flash the screen.
    let seed=frame+8127;
    for(let i=0;i<36;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=(seed>>>8)%w,y=(seed>>>19)%h;
      rect(c,x,y,i%5===0?1.3:.7,.8,i%3?"rgba(254,230,186,.21)":"rgba(65,52,54,.22)");
    }
    if(t>15.55){
      c.globalAlpha=smooth((t-15.55)/.45)*.78;rect(c,0,0,w,h,"#42434b");
    }
    c.restore();return true;
  }
  window.BayCoastRoadFilm=Object.freeze({paint});
})();
