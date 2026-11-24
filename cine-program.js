/* Two silent shorts for the Cine Luna house projector. All scene coordinates are on the same 16:9 aperture. */
(() => {
  "use strict";
  const width=416,height=234,fps=10,tau=2*Math.PI;
  const clamp=(v,min=0,max=1)=>Math.min(max,Math.max(min,v));
  const mix=(a,b,t)=>a+(b-a)*t;
  function smooth(t){const k=clamp(t);return k*k*(3-2*k);}
  const ink="#2f474a",paper="#f8e6ba",ochre="#d99850",coral="#be5f47";
  const soot="#303b3d",shadow="#59605a",silver="#b7b29b",chalk="#e4d8b7",ginger="#b27d56";
  const outlines=new Map();
  function path(c,shape,fill,stroke=null,weight=1){
    let p=outlines.get(shape);if(!p){p=new Path2D(shape);outlines.set(shape,p);}
    if(fill){c.fillStyle=fill;c.fill(p);}
    if(stroke){c.strokeStyle=stroke;c.lineWidth=weight;c.stroke(p);}
  }
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function oval(c,x,y,rx,ry,color,tilt=0){
    c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,tilt,0,tau);c.fill();
  }
  function line(c,x1,y1,x2,y2,color,w){
    c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
  }
  function label(c,s,x,y,font,color,align="left"){
    c.font=font;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);c.textAlign="left";
  }
  function grad(c,y1,y2,stops){
    const g=c.createLinearGradient(0,y1,0,y2);
    for(const [at,color] of stops)g.addColorStop(at,color);return g;
  }
  function surface(w,h){
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;return canvas;
  }
  function palm(c,x,y,s,color){
    c.save();c.translate(x,y);c.scale(s,s);
    path(c,"M-3 1 Q1 -16 1 -32 Q1 -45 -4 -51 L-1 -55 Q7 -41 7 -29 Q6 -9 4 1 Z",color);
    path(c,"M-2 -53 Q-21 -67 -36 -47 Q-24 -58 -12 -52 L-24 -49 Q-17 -53 -4 -51 Q-22 -45 -19 -26 Q-15 -42 -1 -49 Q-10 -35 -5 -30 Q-5 -42 0 -48 Q8 -40 11 -29 Q13 -42 2 -50 Q21 -42 28 -30 Q24 -48 3 -53 Q21 -60 32 -50 Q22 -66 0 -55 Q5 -67 18 -70 Q3 -70 -2 -57 Q-7 -69 -21 -67 Q-9 -63 -2 -53Z",color);
    c.restore();
  }
  function coastalSky(c,y){
    rect(c,-3,-3,width+6,y+4,grad(c,0,y,[[0,"#d47b67"],[.52,"#eeb38a"],[1,"#f5d69d"]]));
    oval(c,317,65,28,28,"#ffe2a1");
    path(c,"M-7 55 Q14 54 30 49 Q44 49 51 43 Q63 37 74 45 Q80 49 90 47 Q101 44 109 48 L88 52 L48 53 L35 56Z M235 39 L259 37 Q266 31 274 33 Q286 35 297 35 L307 37 L275 39Z M331 86 Q345 84 357 81 Q364 76 374 77 L389 81 L415 81 L427 84 L382 85 L368 87Z","#f0bf99");
  }
  function horizon(c,y){
    c.save();c.translate(0,y);
    path(c,"M-8 4 L-8 -4 L5 -3 L13 -9 L24 -7 L29 -11 L39 -8 L48 -11 L55 -6 L66 -8 L75 -7 L87 -11 L97 -9 L102 -6 L116 -8 L126 -7 L142 -10 L153 -6 L177 -7 L188 -4 L200 -8 L214 -7 L229 -5 L245 -7 L257 -5 L270 -8 L281 -7 L294 -10 L311 -8 L321 -13 L336 -11 L350 -14 L363 -11 L378 -13 L387 -8 L400 -10 L425 -11 L425 4Z","#87968a");
    const buildings=[[12,-10,18],[32,-18,16],[50,-13,9],[96,-13,19],[120,-16,9],[130,-20,14],[148,-10,26],[290,-11,16],[349,-21,19],[375,-15,18]];
    for(const [x,top,w] of buildings){
      rect(c,x,top,w,-top,"#8e9288");rect(c,x+2,top-1.8,w-4,2,"#a69a89");
      for(let row=top+3;row<-2;row+=4)rect(c,x+2,row,w-4,1,"#bdad94");
    }
    palm(c,77,0,.27,"#7c9284");palm(c,309,0,.31,"#788c7c");c.restore();
  }
  function water(c,horizonY){
    rect(c,-3,horizonY,width+6,height-horizonY+4,grad(c,horizonY,height,[[0,"#a4b39a"],[.20,"#8ba996"],[.67,"#65948b"],[1,"#4b7d77"]]));
    line(c,0,horizonY+1,416,horizonY+1,"#d5caaa",1);
  }
  function ripples(c,t,y,reflectionX=310){
    c.save();c.lineCap="round";
    for(let i=0;i<42;i++){
      const f=(i+.5)/42,dy=4+f*f*(height-y-1);
      const x=((i*91.41+t*(1.7+7*f))%451)-17;
      const length=3+f*(6+9*(1+Math.sin(i*2.8+t)));
      const reflected=Math.abs(x-reflectionX)<8+f*59;
      line(c,x,y+dy,x+length,y+dy+(i%3-1)*f*.65,reflected?"#dbbd91":i%3?"#a0b7a1":"#538881",.55+f*.5);
    }
    for(let j=0;j<12;j++){
      const yOff=2+j*j*.40,x=reflectionX+Math.sin(j*2.19+t*.74)*(4+j*1.5);
      line(c,x-3-j*.55,y+yOff,x+4+j*.62,y+yOff,"#dbc29c",.8);
    }c.restore();
  }

  // PALOMA is a double-ended harbour ferry with a slatted passenger deck and a red wheelhouse roof.
  function ferry(c,x,y,s,t){
    c.save();c.translate(x,y+Math.sin(t*2)*.65*s);c.rotate(Math.sin(t*1.7)*.009);c.scale(s,s);
    path(c,"M-97 -15 Q-69 -12 -35 -11 L62 -13 Q82 -14 94 -20 L86 -7 Q79 -1 69 0 L-75 0 Q-87 -1 -97 -15Z","#345a59");
    path(c,"M-96 -15 Q0 -7 93 -20 L90 -15 Q10 -4 -90 -10Z","#c56e52");
    path(c,"M-71 -18 L-58 -23 L55 -26 L80 -21 L74 -16 L-77 -14Z","#edcd9b");
    path(c,"M-55 -41 L13 -44 L27 -32 L27 -21 L-55 -18Z",paper);
    for(let i=0;i<8;i++){
      const u=-51+i*8;rect(c,u,-37-i*.22,5.1,10,"#527777");
      line(c,u+.3,-28-i*.22,u+4.5,-34-i*.22,"#7d9790",.8);
    }
    path(c,"M-61 -44 L14 -47 L24 -43 L-58 -39Z","#ab604e");
    path(c,"M8 -45 L7 -62 L28 -63 L37 -53 L37 -32 L23 -31Z","#d3c39e");
    path(c,"M11 -59 L25 -60 L27 -50 L11 -49Z M29 -58 L34 -52 L34 -49 L30 -49Z","#486567");
    path(c,"M4 -62 L28 -65 L33 -62 L6 -59Z",coral);
    path(c,"M-30 -46 L-31 -62 L-22 -63 L-20 -46Z","#7d5b53");
    path(c,"M-32 -63 L-22 -65 L-21 -61 L-31 -60Z",ink);
    for(const k of [-79,-70,-61,34,44,54,64,74]){
      const yy=k<0?-23:-26;line(c,k,-15,k,yy,"#7d8073",.95);
    }
    line(c,-80,-23,-58,-23,"#f2d8a5",1.5);line(c,33,-26,78,-27,"#eed8ae",1.5);
    oval(c,-60,-28,3.8,4.1,coral);oval(c,-60,-28,2,2.3,"#9b9a80");
    label(c,"PALOMA",-12,-10,"bold 5px Georgia,serif","#e8d7ae","center");
    c.restore();
  }
  function ticket(c,x,y,a,s,punched=false){
    c.save();c.translate(x,y);c.rotate(a);c.scale(s,s);
    path(c,"M-10 -4.6 L10 -4.6 L10 -1.8 Q7.2 0 10 1.8 L10 4.6 L-10 4.6 L-10 1.8 Q-7.1 .2 -10 -1.8Z","#e99c52","#815943",.65);
    line(c,-5.7,-3.1,-5.7,3.1,"#916044",.65);line(c,-2.8,-2,5.9,-2,"#a4553c",.7);
    label(c,"1",-2.8,2.8,"bold 5px Georgia,serif","#7e4638");
    if(punched)oval(c,4.5,1.3,1.4,1.4,"#567d78");c.restore();
  }
  // The folded bill pouch and the crooked hinge of the wing distinguish the brown pelican from a gull.
  function pelican(c,x,y,s,t,{flight=0,look=0,direction=1,pass=false,step=0}={}){
    c.save();c.translate(x,y);c.scale(s*direction,s);
    const beat=Math.sin(t*6),stride=Math.sin(t*11)*step,lift=Math.sin(t*2)*.5;
    c.translate(0,lift-Math.abs(stride)*1.7);
    for(const side of [-1,1]){
      const lx=-.2+side*3,ex=lx+stride*side*3.5-5*flight,ey=-.2-Math.max(0,stride*side)*4-5*flight;
      line(c,lx,-9,ex,ey,"#82684d",1.7);
      c.fillStyle="#9e7856";c.beginPath();c.moveTo(ex,ey-1.5);c.lineTo(ex+5.4,ey+.7);c.lineTo(ex+1.2,ey+1.2);c.lineTo(ex-2.3,ey+.6);c.closePath();c.fill();
    }
    path(c,"M-24 -17 L-29 -18 Q-25 -14 -20 -12 L-27 -12 L-17 -8 Q-8 -4 2 -7 Q11 -7 16 -19 L17 -28 L9 -31 Q7 -22 1 -22 Q-16 -25 -24 -17Z","#796e64");
    path(c,"M-17 -17 Q-9 -23 3 -21 Q11 -21 14 -28 Q15 -34 12 -35 Q21 -37 19 -27 Q19 -12 9 -8 Q1 -5 -5 -8Z","#e1d9ae");
    path(c,"M-17 -18 Q-9 -23 2 -21 L7 -18 Q0 -10 -11 -10 L-21 -11 L-14 -14 L-24 -14Z","#68665e");
    path(c,"M-18 -16 Q-8 -20 2 -18 M-16 -13 Q-7 -17 -1 -15 M-12 -11 Q-7 -14 -3 -13",null,"#afa38d",.85);
    if(flight>.015){
      c.save();c.translate(-1,-17);c.scale(1,flight);c.rotate(-.18+beat*.48);
      path(c,"M4 1 Q-4 -7 -18 -19 L-38 -19 L-28 -16 L-43 -17 L-31 -13 L-44 -14 L-30 -9 L-39 -10 L-21 -3 Q-8 6 4 1Z","#78776a");
      path(c,"M2 -1 Q-6 -9 -18 -17 Q-27 -17 -37 -17 L-26 -13 L-16 -12 Q-6 -3 2 -1Z","#b1a78c");
      c.restore();
    }
    c.save();c.translate(13,-27);c.rotate(look+.04*Math.sin(t*2.2));
    path(c,"M-4 6 Q-6 1 -3 -5 Q-1 -11 4 -13 L3 -9 Q10 -12 13 -6 L14 -3 L10 .4 L4 -1 L1 8Z","#f0e2bd");
    path(c,"M1 -8 Q8 -13 13 -7 L11 -5 Q7 -9 3 -5Z","#c8ab78");
    path(c,"M11 -4 Q22 -4 37 -1.2 L40 0 Q26 .4 13 -.2Z","#e6bd7a");
    path(c,"M9 -.6 L39 .1 Q31 1.8 24 5.1 Q17 9 12 5.4Z","#bd7956");
    path(c,"M13 .3 Q24 .7 36 .1",null,"#845e48",.8);
    oval(c,9.4,-5.9,1.35,1.38,"#3c4945");oval(c,9.75,-6.2,.42,.43,paper);
    if(pass)ticket(c,38,1.7,-.06+.13*Math.sin(t*3.6),.62);
    c.restore();c.restore();
  }
  function smallBird(c,x,y,s,t,color){
    const rise=3+Math.sin(t*4)*3;
    c.strokeStyle=color;c.lineWidth=s*1.35;c.beginPath();c.moveTo(x-7*s,y-rise*s);
    c.quadraticCurveTo(x-3*s,y-3*s,x,y);c.quadraticCurveTo(x+2*s,y-2.5*s,x+8*s,y-(rise+1)*s);c.stroke();
  }
  function dock(c,x,y,s){
    c.save();c.translate(x,y);c.scale(s,s);
    path(c,"M-54 -19 L50 -19 L58 -12 L-52 -10Z","#c39d72");
    path(c,"M-53 -10 L58 -12 L56 -6 L-53 -4Z","#735f51");
    for(let i=-47;i<52;i+=10)line(c,i,-17,i+3,-11,"#8f7861",.85);
    for(const a of [-37,35]){
      rect(c,a,-8,5,54,"#796c58");rect(c,a+.6,14,1,25,"#ac9370");
      oval(c,a+2,-9,4,1.6,"#766250");
    }
    c.restore();
  }
  function pelicanBackground(c,shot){
    if(shot===0){
      coastalSky(c,137);water(c,136);horizon(c,136);
      path(c,"M-6 148 L31 142 L43 143 L51 139 L80 139 L92 144 L106 147 L124 148 L140 152 L-6 163Z","#6e8f7c");
      palm(c,35,146,.91,"#587b6f");palm(c,54,143,.59,"#688674");
    }else if(shot===1){
      coastalSky(c,104);water(c,104);horizon(c,104);
      path(c,"M-6 145 L422 140 L422 195 L-6 206Z","#cba97d");
      path(c,"M-6 205 L422 194 L422 210 L-6 225Z","#866c58");
      for(let x=-19;x<435;x+=27)line(c,x,145,x+21,204-(x+20)*.026,"#aa8969",1.2);
      line(c,0,168,416,161,"#b69974",.75);
      for(const x of [12,184,355]){rect(c,x,214-x*.025,8,38,"#776655");rect(c,x+2,216-x*.025,1.8,30,"#aa8d6b");}
      rect(c,22,49,4,110,"#92725a");rect(c,78,48,4,113,"#8b705b");
      rect(c,16,39,74,40,"#567978");rect(c,18,41,70,36,"#d7c496");
      label(c,"PALOMA",53,58,"bold 13px Georgia,serif",ink,"center");
      label(c,"FINAL SAILING",53,70,"bold 6px Arial,sans-serif",ink,"center");
      oval(c,21,44,.9,.9,"#977b5b");oval(c,85,74,.9,.9,"#977b5b");
    }else if(shot===2){
      coastalSky(c,121);water(c,121);horizon(c,121);
    }else if(shot===3){
      coastalSky(c,124);water(c,124);horizon(c,124);
      rect(c,0,167,416,67,"#a58c6c");
      for(let n=0;n<8;n++)line(c,n*62-70,234,n*36-4,168,"#827760",1.25);
      for(const x of [18,66,115,163,213,261,312,363,409]){rect(c,x,116,2.8,54,"#617d73");}
      line(c,0,117,419,117,"#ded7ab",4);line(c,0,142,419,142,"#aaae90",1.4);
      path(c,"M-4 -5 L67 -5 L63 114 L52 160 L-4 183Z","#c9be98");
      path(c,"M-4 -5 L58 -5 L54 49 L-4 55Z","#4f7471");
      line(c,7,1,42,1,"#b4c5a9",1.2);line(c,0,58,55,53,"#ece0b8",2.8);
    }else{
      coastalSky(c,113);water(c,113);horizon(c,113);
      path(c,"M-6 117 Q58 114 92 116 L98 112 L108 115 L120 114 L126 118 L142 120 L-6 129Z","#648579");
      palm(c,54,118,.47,"#607f73");palm(c,75,115,.32,"#698373");
    }
  }
  function deckhand(c,reach,t){
    c.save();c.translate(102,159);
    path(c,"M-36 31 L-28 -26 Q-24 -39 -11 -43 L7 -45 Q20 -40 24 -26 L32 32Z","#536d70");
    path(c,"M-11 -42 L1 -34 L12 -43 L16 -36 L5 -22Z","#ded2a6");
    path(c,"M-6 -50 L10 -46 L8 -35 L1 -31 L-7 -39Z","#c49772");
    path(c,"M-14 -67 Q-14 -77 -2 -78 Q12 -79 15 -63 L20 -57 L15 -55 Q15 -45 6 -43 L-6 -46 L-9 -54 Q-15 -54 -14 -60Z","#cfa780");
    path(c,"M-12 -62 Q-17 -68 -13 -77 L0 -80 L6 -71 L-5 -67 L-4 -60Z","#62635b");
    path(c,"M-18 -72 Q-19 -82 -7 -86 Q9 -91 15 -78 L11 -72Z","#e4d7af");
    path(c,"M-16 -73 Q2 -77 13 -76 L22 -75 L13 -71 L-15 -68Z","#3f5756");
    oval(c,10,-63,1.3,1.25,ink);
    path(c,"M10 -52 Q14 -50 17 -54",null,"#8e6c56",1.15);
    const ax=15,ay=-30,bx=30+reach*5,by=2-reach*23,hx=58+reach*41,hy=-4-reach*20;
    c.lineCap="round";line(c,ax,ay,bx,by,"#486366",14);line(c,bx,by,hx-9,hy+1,"#587679",12);
    line(c,hx-11,hy+1,hx-4,hy-.2,"#ddc99f",7);
    oval(c,hx,hy,6.3,3.7,"#c9976e",-.12);oval(c,hx+3,hy-2.7,2,3.5,"#c9976e",.75);
    c.save();c.translate(hx+6,hy-2.5);c.rotate(-.09);
    path(c,"M-5 -.5 L7 -1 L10 -4 L12 -3 L9 1 L0 2 L-3 6 L-5 5Z","#465d5b");
    const jaw=2.7+1.6*Math.sin(t*7);line(c,0,1,8,-jaw,"#c8c7ac",1.2);c.restore();
    c.restore();return [102+hx+10,159+hy-3];
  }
  function showPelican(c,t){
    const shot=t<4.4?0:t<9.5?1:t<16?2:t<21.8?3:4;
    paintSet(c,"pelican"+shot,ctx=>pelicanBackground(ctx,shot));
    if(shot===0){
      ripples(c,t,136);ferry(c,238+t*10,158,.68,t);
      for(let i=0;i<3;i++)smallBird(c,227+t*7+i*16,50-i*4+Math.sin(t+i)*1.8,.52+i*.078,t+i,"#657c74");
      dock(c,76,189,1);pelican(c,82,171,1.16,t,{look:-.17+.08*Math.sin(t)});
      if(t<3.75){
        c.save();c.globalAlpha=clamp((3.75-t)/.62);
        label(c,"The Last",30,42,"italic bold 22px Georgia,serif","#694d49");
        label(c,"Pelican",29,70,"italic bold 36px Georgia,serif","#694d49");c.restore();
      }
    }else if(shot===1){
      const sec=t-4.4,u=clamp(sec/3.05),x=111+sec*17;
      pelican(c,x,178,1.17,t,{look:mix(-.26,-.035,smooth(u)),step:1-smooth((u-.78)/.22),pass:u>=1});
      if(u<1){
        const billX=x+59.6,billY=147;
        ticket(c,mix(51,billX,smooth(u)),mix(93,billY,u)-30*Math.sin(u*Math.PI)+9*Math.sin(2.4*tau*u)*(1-u),
          -.3+3.4*Math.sin(u*tau*1.4)*(1-u),mix(.99,.72,u));
      }
      for(const k of [0,1]){
        const xx=(24+t*(16+k*3)+k*107)%430;
        line(c,xx,100+k*8,xx+11,98+k*8,"#e0bf92",.7);
      }
    }else if(shot===2){
      const sec=t-9.5,u=smooth((sec-.4)/4.6),boatX=208+sec*13;
      ripples(c,t,121);dock(c,-10,170,.95);ferry(c,boatX,169,.92,t);
      const x=mix(28,boatX+60,u),y=mix(152,148,u)-61*Math.sin(u*Math.PI);
      pelican(c,x,y,.72,t,{flight:Math.sin(u*Math.PI)**.53,look:-.045,pass:true,step:1-u});
      if(u>.84)for(let i=0;i<3;i++)smallBird(c,389-sec*4+i*16,59+i*4,.52,t+i,"#768c81");
    }else if(shot===3){
      const sec=t-16,reach=smooth((sec-.15)/1.65)*(1-smooth((sec-3.75)/1.2));
      const jaw=deckhand(c,reach,t);
      pelican(c,285,168,1.48,t,{direction:-1,look:-.06-.12*Math.sin(sec*1.05)});
      const handoff=smooth((sec-1.55)/.85);
      ticket(c,mix(209,jaw[0],handoff),mix(128,jaw[1],handoff),-.24*(1-handoff)+handoff*.08,1.03,sec>2.90);
      if(sec>2.90&&sec<3.7){const a=sec-2.9;oval(c,jaw[0]+4+a*6,jaw[1]+3+29*a*a,1.4,1.2,ochre);}
    }else{
      const sec=t-21.8,boatX=122+sec*15.3;
      ripples(c,t,113);ferry(c,boatX,154,.91,t);
      pelican(c,boatX+56,135,.60,t,{look:-.13+.10*Math.sin(sec*1.16)});
      for(let i=0;i<5;i++)smallBird(c,336-sec*12+i*13,58+Math.abs(i-2)*4-1.45*sec,.58,t+i*.46,"#6a7e75");
      if(sec>3.9){c.save();c.globalAlpha=smooth((sec-3.9)/.8);label(c,"Fin",348,85,"italic 28px Georgia,serif","#76554e");c.restore();}
    }
  }

  function cat(c,x,y,s,t,{direction=1,walking=0,jump=0,curled=0}={}){
    c.save();c.translate(x,y);c.scale(s*direction,s);
    const walk=Math.sin(t*9)*walking;
    if(curled){
      c.save();c.rotate(-.06);
      path(c,"M-15 -4 Q-23 -15 -11 -23 Q4 -31 16 -20 L21 -17 L19 -8 Q14 -3 6 -2Z",ginger);
      path(c,"M-15 -14 Q-19 -7 -8 -3 Q8 2 17 -7 Q12 3 -6 1 Q-20 0 -20 -8Z","#795847");
      path(c,"M-1 -23 Q2 -18 -2 -16 M-8 -22 Q-4 -20 -7 -15 M-13 -19 Q-10 -17 -12 -14",null,"#895e49",1.4);
      c.restore();c.translate(10,-7+Math.sin(t*2.5)*.35);c.rotate(.24);
    }else{
      const bounce=-Math.abs(walk)*1.7;c.translate(0,bounce);
      for(const side of [-1,1]){
        line(c,-10,-11,-11+side*walk*4-jump*5,-1-jump*4,"#966b50",2.6);
        line(c,7,-12,8+side*walk*5+jump*5,-1-jump*6,"#b2825c",2.7);
      }
      path(c,"M-16 -15 Q-15 -23 -4 -21 L6 -20 L12 -21 L15 -15 L11 -9 Q0 -6 -12 -10 Q-16 -11 -16 -15Z",ginger);
      path(c,"M-10 -20 L-8 -16 M-5 -21 L-3 -17 M0 -21 L1 -17",null,"#89614c",1.4);
      c.strokeStyle="#986a4f";c.lineWidth=3.5;c.lineCap="round";c.beginPath();c.moveTo(-14,-15);
      c.bezierCurveTo(-26,-12,-29,-24,-26+2*Math.sin(t*2.3),-29+2*Math.cos(t*2.1));c.stroke();
      c.translate(10,-15);c.rotate(-.07*Math.sin(t*2.7)-jump*.09);
    }
    path(c,"M-5 -4 L-6 -14 L-.5 -10 L4 -10 L9 -15 L9 -7 Q15 -3 11 1 L8 3 L2 3 Q-5 3 -5 -4Z",ginger);
    path(c,"M-3 -8 L-4 -11 L-.5 -8Z M5 -8 L8 -12 L7 -8Z","#795747");
    line(c,1,-7,3,-5,"#765646",1.1);
    if(curled)path(c,"M4 -2 Q6 0 8 -2",null,soot,.9);
    else oval(c,6.8,-2.9,1.05,1.05,soot);
    path(c,"M10 -.1 L12 .1 L10.5 1.4Z",soot);
    line(c,8,1.5,15.8,1,chalk,.5);line(c,8,2.1,15,3.6,chalk,.5);c.restore();
  }
  function tramCar(c,x,y,s,t,parked=false){
    c.save();c.translate(x,y);c.scale(s,s);
    for(const ax of [-58,56]){
      oval(c,ax,-4,11,10,soot);oval(c,ax,-4,6.5,6,silver);
      c.save();c.translate(ax,-4);c.rotate(parked?0:t*2.4);
      for(const a of [0,1.047,2.094])line(c,-5*Math.cos(a),-5*Math.sin(a),5*Math.cos(a),5*Math.sin(a),shadow,1);
      c.restore();oval(c,ax,-4,2,2,soot);
    }
    path(c,"M-96 -15 L-93 -64 L-84 -73 L71 -75 L91 -67 L96 -20 L84 -11 L-79 -10Z","#676c63");
    path(c,"M-91 -56 L-82 -66 L74 -67 L87 -60 L90 -37 L-89 -33Z",chalk);
    for(let i=0;i<7;i++){
      const left=-74+21*i,yTop=-61-i*.17;
      c.fillStyle=i===4?"#d8c995":"#92978a";c.beginPath();c.moveTo(left,yTop+22);c.lineTo(left,yTop+5);
      c.quadraticCurveTo(left+7,yTop-3,left+15,yTop+4);c.lineTo(left+16,yTop+22);c.closePath();c.fill();
      if(i===2||i===4){oval(c,left+7,yTop+14,2.4,3.1,"#666f67");rect(c,left+3.5,yTop+17,7.2,6,"#666f67");}
      line(c,left+1,yTop+18,left+13,yTop+5,"#acae98",.8);
    }
    path(c,"M64 -62 L76 -62 L81 -41 L66 -40Z M80 -62 L86 -60 L90 -41 L84 -41Z","#62746f");
    path(c,"M-97 -68 Q-91 -77 -72 -78 L68 -80 Q87 -79 95 -67 L84 -66 Q69 -72 60 -72 L-75 -70 L-89 -65Z","#414d4a");
    path(c,"M-90 -33 L91 -38 L92 -34 L-89 -28Z","#d4c49e");
    for(let i=0;i<26;i++)line(c,-79+i*6.4,-27-i*.15,-79+i*6.4,-15-i*.13,"#808276",.6);
    rect(c,-84,-21,16,5,soot);label(c,"6",1,-17,"bold 12px Georgia,serif",chalk,"center");
    line(c,-16,-77,30,-107,soot,1.7);line(c,27,-106,39,-108,soot,1.5);
    oval(c,92,-33,2.8,3.5,"#e5cb94");rect(c,-95,-27,2.2,5,"#ad6d57");c.restore();
  }
  function windowRow(c,x,y,count,w,h,spacing){
    for(let j=0;j<count;j++){
      const left=x+j*spacing;rect(c,left,y,w,h,"#656e67");rect(c,left+.9,y+1.2,w-1.8,h-2.3,"#b1b19a");
      line(c,left+w*.51,y+1,left+w*.51,y+h-1,"#778176",1.1);
    }
  }
  function tramStreet(c,night){
    const sky=night?[[0,"#424d4e"],[.7,"#788279"],[1,"#a3a58d"]]:[[0,"#838b84"],[.7,"#b2b29c"],[1,"#d7c8a6"]];
    rect(c,-3,-3,422,240,grad(c,0,150,sky));
    if(night){oval(c,296,44,10,10,"#ded2ab");oval(c,300,42,9,10,"#52615f");}
    path(c,"M-6 148 L-6 96 L30 93 L31 68 L67 67 L68 91 L83 89 L83 78 L114 77 L115 104 L134 106 L136 93 L171 93 L172 82 L200 83 L199 97 L221 96 L220 64 L251 62 L253 96 L281 93 L282 84 L306 83 L307 99 L336 96 L336 73 L371 71 L372 92 L426 91 L426 151Z",night?"#65736b":"#939a88");
    windowRow(c,34,72,4,5,9,8);windowRow(c,223,66,3,6,14,9);
    path(c,"M-4 102 L73 96 L80 103 L75 148 L-4 153Z",night?"#737a6c":"#b0ab93");
    path(c,"M-3 106 L77 100 L77 106 L-3 113Z",shadow);windowRow(c,4,116,6,7,15,11);
    path(c,"M281 92 L295 87 L363 86 L374 92 L377 141 L280 144Z",night?"#747970":"#ada78e");
    windowRow(c,289,98,7,7,18,11);line(c,285,126,370,123,"#68746b",2);
    palm(c,112,151,.86,night?"#475c57":"#748578");palm(c,394,149,.71,night?"#526860":"#7b8b79");
    rect(c,-2,147,420,90,grad(c,147,234,[[0,night?"#a5a38a":"#cac1a3"],[.45,night?"#787f72":"#aaa992"],[1,night?"#626f69":"#939d8d"]]));
    for(const y of [163,173,212,223])line(c,-3,y+5,419,y-8,y===163||y===212?"#626e66":"#c8c2a2",y>180?1.9:1);
    for(let n=0;n<27;n++){
      const x=(91.57*n)%409,y=153+(n*17)%78;line(c,x,y,x+5+n%8,y-1,"#92978a",1);
    }
    path(c,"M-5 37 Q92 55 206 48 Q322 46 426 25 M-5 44 Q75 63 204 53 Q340 49 425 32",null,night?"#485753":"#626d64",1);
    rect(c,184,32,2.8,117,"#626d64");line(c,176,37,199,33,"#677166",1.55);
  }
  function platform(c){
    rect(c,-3,-3,422,240,grad(c,0,160,[[0,"#b0af98"],[1,"#d7c9a7"]]));
    rect(c,103,38,215,113,"#7e8176");rect(c,108,39,204,110,"#959789");
    for(let y=46;y<148;y+=6.5)line(c,109,y,311,y,"#7f8579",1);
    rect(c,311,32,5,118,"#777e72");rect(c,104,32,213,7,shadow);
    path(c,"M4 84 L46 75 L46 150 L3 163Z","#a6a38d");
    line(c,51,19,407,12,"#777e72",2);line(c,48,24,411,17,"#dfd1ad",1.2);
    rect(c,-3,151,422,87,grad(c,151,234,[[0,"#bcb89c"],[1,"#979c8b"]]));
    for(let i=0;i<6;i++)line(c,i*90-82,235,i*64+18,153,"#899084",1.1);
    oval(c,66,62,22,24,shadow);oval(c,66,61,19.6,21.4,chalk);
    for(let n=0;n<12;n++){const a=n*tau/12;line(c,66+16*Math.cos(a),61+18*Math.sin(a),66+14*Math.cos(a),61+16*Math.sin(a),shadow,.9);}
    line(c,66,61,57,53,soot,2);line(c,66,61,66,47,soot,1.2);
    path(c,"M70 128 L267 119 L273 128 L73 138Z M72 140 L270 131 L275 140 L75 150Z","#817762");
    for(const lx of [88,245]){line(c,lx,120,lx+7,176-(lx-88)*.043,shadow,4);line(c,lx+4,145,lx-2,178-(lx-88)*.043,shadow,3);}
    path(c,"M62 150 L268 139 L282 145 L74 157Z","#a39677");line(c,73,157,281,146,shadow,3);
  }
  function tramDoor(c){
    rect(c,-3,-3,422,240,"#a5a593");
    path(c,"M-4 20 L421 -11 L421 187 L-4 212Z","#788171");
    path(c,"M-6 24 L421 -5 L421 109 L-6 137Z","#cec5a4");
    for(const x of [14,78,141]){
      c.save();c.translate(x,38-x*.065);
      path(c,"M0 74 L0 15 Q1 1 19 0 Q35 0 39 12 L40 72Z","#586d67");
      path(c,"M4 69 L4 16 Q8 3 19 4 Q30 3 35 14 L36 67Z","#88988a");
      path(c,"M6 57 L28 11 L34 15 L10 63Z","#a4af9b");line(c,20,5,21,72,"#6b766d",1.7);c.restore();
    }
    path(c,"M-5 130 L423 100 L423 108 L-5 139Z",chalk);
    for(let x=0;x<419;x+=8)line(c,x,139-x*.07,x,197-x*.07,"#697466",.8);
    rect(c,224,14,78,165,"#384745");
    path(c,"M224 155 L302 150 L309 158 L224 163Z M219 171 L307 166 L314 174 L220 179Z M212 187 L314 179 L320 187 L210 195Z","#aca78e");
    for(const x of [222,302])line(c,x,18,x-1,175,"#c8bc9d",3);
    line(c,0,215,416,188,"#46564f",3.1);
    label(c,"6",360,148,"bold 25px Georgia,serif",chalk,"center");
  }
  function carriage(c){
    rect(c,-3,-3,422,240,"#56655f");
    path(c,"M-4 0 L422 -2 L418 76 L-4 105Z","#838b7e");
    for(const [x,y,w] of [[-12,6,98],[98,0,94],[204,-6,93],[309,-13,107]]){
      rect(c,x,y,w,68,"#c1b79a");rect(c,x+3,y+3,w-6,62,"#687d74");
      const yy=y+51;rect(c,x+4,yy,w-8,9,"#576a62");
      for(let k=0;k<4;k++){const bx=x+5+k*22;rect(c,bx,yy-6-k%2*7,10+k*2,12,"#637369");}
      line(c,x+6,y+48,x+35,y+4,"#8a9a88",1.15);
    }
    path(c,"M-7 105 L419 73 L424 145 L-9 182Z","#546961");
    for(let n=0;n<12;n++){
      const x=n*39-18;line(c,x,104-x*.072,x+1,173-x*.08,"#6b7a68",1.5);
      line(c,x+2,104-x*.072,x+3,173-x*.08,"#435d55",.8);
    }
    path(c,"M-7 182 L423 142 L423 158 L-7 203Z","#a49c79");
    path(c,"M-5 202 L422 157 L422 172 L-7 218Z","#586950");
    path(c,"M-7 218 L423 172 L423 237 L-7 237Z","#3e524b");
    line(c,0,101,416,72,"#bbb293",2);line(c,0,175,416,140,"#c9bb97",2);
    path(c,"M284 146 Q271 120 296 116 Q327 110 345 128 L353 131 L340 140 L288 150Z","#b3aa89");
    path(c,"M281 141 Q316 140 345 126 L349 132 L302 151 L282 148Z","#58655b");
  }
  function tramBackground(c,shot){
    if(shot===0||shot===4)tramStreet(c,shot===4);
    else if(shot===1)platform(c);
    else if(shot===2)tramDoor(c);
    else carriage(c);
  }
  function conductor(c,x,y,s,bend,t){
    c.save();c.translate(x,y);c.scale(s,s);
    for(const leg of [-1,1]){
      line(c,leg*4,1,leg*5+2,29,soot,5.1);line(c,leg*5+2,29,leg*5-3,30,"#343e3b",3);
    }
    c.save();c.rotate(-bend*.32);
    path(c,"M-9 3 L-8 -21 Q-7 -28 0 -29 Q8 -30 11 -20 L13 1 L6 5Z",shadow);
    path(c,"M-5 -26 L1 -20 L7 -27 L5 -31 L-4 -31Z",silver);
    path(c,"M-6 -44 Q-5 -49 3 -46 Q10 -42 7 -33 Q5 -28 -3 -30 L-9 -34 L-6 -36Z","#b8aa8a");
    path(c,"M-9 -44 Q-7 -53 4 -50 L10 -46 L8 -42 L-8 -40 L-13 -40Z",soot);
    line(c,-7,-44,7,-46,silver,1.1);oval(c,-2.9,-37,1,1,soot);
    const armX=-6-bend*11,armY=-5+bend*10+.5*Math.sin(t*3);
    line(c,-5,-22,-7,-11,shadow,6);line(c,-7,-11,armX,armY,"#697366",5.2);
    oval(c,armX,armY+1.2,3,3.8,"#b8a98a");c.restore();c.restore();
  }
  function showTram(c,t,credit){
    const shot=t<5?0:t<10.2?1:t<17?2:t<22.7?3:4;
    paintSet(c,"tram"+shot,ctx=>tramBackground(ctx,shot));
    if(shot===0){
      const u=smooth(t/4.4);tramCar(c,mix(-67,206,u),173,1.10,t,t>4.2);
      if(t<4.75){
        c.save();c.globalAlpha=clamp((4.75-t)/.55);
        label(c,"After the Last Tram",18,32,"italic bold 24px Georgia,serif","#303d3b");
        label(c,credit||"SUNDOWN BAY, 1954",20,46,"bold 8px Arial,sans-serif","#384441");c.restore();
      }
    }else if(shot===1){
      const sec=t-5,u=smooth((sec-1.35)/2.7),x=mix(191,272,u);
      cat(c,x,172-(x-190)*.045,1.02,t,{walking:Math.sin(u*Math.PI)});
      const paperX=mix(307,62,smooth(sec/4.5)),paperY=161-16*Math.sin(sec*3)*Math.sin(clamp(sec/4.5)*Math.PI);
      c.save();c.translate(paperX,paperY);c.rotate(-.16+Math.sin(sec*3.5)*.43);
      path(c,"M-11 -3 L-1 -5 L12 -2 L8 5 L-5 2 L-14 4Z",chalk);
      line(c,-8,0,-2,-1,shadow,.75);line(c,1,-2,9,0,shadow,.7);c.restore();
    }else if(shot===2){
      const sec=t-10.2,open=smooth(sec/2.1),left=224+68*open;
      if(open<1){
        const w=302-left;
        rect(c,left,15,w,137,"#979781");
        for(let j=0;j<4;j++){rect(c,left+j*w/4+1,32,w*.19,52,"#60736b");line(c,left+j*w/4,17,left+j*w/4,148,"#6f796b",1);}
      }
      conductor(c,269,112,1.20,smooth((sec-1)/2.3)*(1-smooth((sec-5.1)/1.5)),t);
      const u=smooth((sec-1.2)/4.1),hop=smooth((sec-3)/1.55);
      const x=mix(117,257,u),y=mix(206,158,hop)-Math.sin(hop*Math.PI)*25;
      cat(c,x,y,.98,t,{walking:Math.sin(u*Math.PI),jump:Math.sin(hop*Math.PI)});
    }else if(shot===3){
      const sec=t-17,u=smooth(sec/3.15);
      cat(c,mix(150,314,u),mix(161,141,u),1.17,t,{walking:Math.sin(u*Math.PI),curled:sec>3.1});
      if(sec>3.6){c.save();c.globalAlpha=smooth((sec-3.6)/1.4)*.19;rect(c,0,0,416,234,"#284443");c.restore();}
    }else{
      tramCar(c,220,172,1.06,t,true);
      cat(c,237,130,.38,t,{curled:1});
      label(c,"Fin",353,69,"italic 25px Georgia,serif","#d5c9a3");
    }
  }

  const backingWidth=512,backingHeight=256;
  let setCanvas=null,setName="";
  function paintSet(c,name,build){
    if(!setCanvas)setCanvas=surface(backingWidth,backingHeight);
    if(setName!==name){
      const set=setCanvas.getContext("2d");
      set.setTransform(backingWidth/width,0,0,backingHeight/height,0,0);
      set.clearRect(0,0,width,height);set.lineCap="round";set.lineJoin="round";
      build(set);setName=name;
    }
    c.drawImage(setCanvas,0,0,width,height);
  }

  let grain=null,vignette=null;
  function finishFrame(c,tick){
    if(!grain){
      const tile=surface(96,96),brush=tile.getContext("2d"),image=brush.createImageData(96,96);
      let seed=1589;
      for(let i=0;i<image.data.length;i+=4){
        seed=(Math.imul(seed,1664525)+1013904223)>>>0;
        const light=seed&2048;
        image.data[i]=light?255:46;image.data[i+1]=light?248:46;image.data[i+2]=light?216:38;
        image.data[i+3]=(seed>>>28)+3;
      }
      brush.putImageData(image,0,0);grain=c.createPattern(tile,"repeat");
      vignette=c.createRadialGradient(208,116,78,208,116,248);
      vignette.addColorStop(0,"rgba(61,41,35,0)");vignette.addColorStop(.72,"rgba(61,41,35,.035)");
      vignette.addColorStop(1,"rgba(61,41,35,.17)");
    }
    c.save();c.translate(-(tick*7%96),-(tick*17%96));rect(c,0,0,width+96,height+96,grain);c.restore();
    rect(c,0,0,width,height,vignette);
    if(tick%73===21||tick%73===22){
      const x=32+(Math.floor(tick/73)*61)%344;
      line(c,x,29,x+.4,55,"rgba(252,236,195,.27)",.65);
    }
    if(tick%17===2)oval(c,8+(tick*23)%397,9+(tick*37)%213,.6,1,"rgba(68,51,45,.38)",.6);
  }

  let checkedInput,record=null,negativeRecord=null,negative=null,decodedStamp=0;
  function validated(value){
    if(value!==checkedInput){
      checkedInput=value;record=window.BayTakePoster?.valid(value)?value:null;
    }
    return record;
  }
  function requestNegative(saved){
    if(negativeRecord===saved)return;
    negativeRecord=saved;negative=null;
    if(typeof Image!=="function")return;
    const img=new Image();
    img.onload=()=>{
      if(negativeRecord===saved&&img.naturalWidth&&img.naturalHeight){negative=img;decodedStamp++;}
    };
    img.src=saved.image;
  }
  function showStunt(c,saved){
    requestNegative(saved);
    rect(c,0,0,width,height,"#e9d6aa");
    line(c,12,42,404,42,"#b15d45",2);
    label(c,"One Good Take",15,34,"italic bold 29px Georgia,serif","#2e4642");
    label(c,"CINE LUNA   /   PICTURE CARS",400,30,"bold 8px Arial,sans-serif","#834a3f","right");
    rect(c,12,51,253,174,"#324744");rect(c,19,55,239,166,"#293935");
    for(let y=57;y<221;y+=13){rect(c,14,y,2.8,6.2,paper);rect(c,260,y,2.8,6.2,paper);}
    if(negative){
      const scale=Math.min(239/negative.naturalWidth,166/negative.naturalHeight);
      const w=negative.naturalWidth*scale,h=negative.naturalHeight*scale;
      c.drawImage(negative,19+(239-w)/2,55+(166-h)/2,w,h);
    }else{
      c.save();c.translate(139,139);
      rect(c,-38,-21,76,44,"#54645a");rect(c,-38,-27,76,8,chalk);
      for(let i=0;i<6;i++){
        c.save();c.translate(-31+i*13,-27);path(c,"M0 0 L7 0 L1 8 L-6 8Z","#43514b");c.restore();
      }
      label(c,"TAKE "+saved.take,0,5,"bold 12px monospace",paper,"center");c.restore();
    }
    label(c,"BEST JUMP",278,79,"bold 9px Arial,sans-serif","#99533e");
    label(c,saved.distance.toFixed(1)+" m",276,111,"italic bold 28px Georgia,serif",ink);
    line(c,278,124,397,124,"#af916f",.8);
    label(c,"TAKE "+String(saved.take).padStart(2,"0"),278,143,"bold 11px monospace",ink);
    label(c,"Romy Vale",278,185,"italic 16px Georgia,serif",ink);
    label(c,"& Jules",278,202,"italic 16px Georgia,serif",ink);
  }
  function showEdition(c){
    paintSet(c,"edition",set=>{
      rect(set,0,0,width,height,"#e1d8bc");
      label(set,"Bay Wire",15,36,"italic bold 32px Georgia,serif","#414942");
      label(set,"SUNDOWN BAY   /   CITY DESK",400,28,"bold 8px Arial,sans-serif","#5c5c4d","right");
      line(set,15,43,401,43,"#6a705d",1.8);line(set,15,47,401,47,"#969681",.6);
      set.save();set.translate(15,55);window.BayExposureArt.drawPhoto(set,282,158.625);set.restore();
      label(set,"PORT SOL",307,75,"bold 8px Arial,sans-serif","#6d6956");
      label(set,"Lot 14",305,107,"italic bold 24px Georgia,serif","#424a42");
      line(set,307,120,399,120,"#99957c",.8);
      label(set,"Photograph by",307,140,"italic 11px Georgia,serif","#585b4d");
      label(set,"Mara Vega",307,158,"bold 14px Georgia,serif","#424a42");
      line(set,15,221,401,221,"#828773",.85);
    });
  }

  let schedule=null,programFrames=0,listedRecord,listedSkate,listedPrint,listedSecond,listedDelivery,listedLocation,locationCard,listedWindows,windowImages;
  function slot(id,title,credit,seconds){return Object.freeze({id,title,credit,seconds});}
  function describe(options={}){
    const saved=validated(options?.stunt);
    const film=window.BaySkateFilm,skate=film?.valid(options?.skate)?options.skate:null;
    const print=options?.edition==="print"&&typeof window.BayExposureArt?.drawPhoto==="function";
    const second=!!options?.second;
    const delivery=second&&typeof options?.deliveredBy==="string"?options.deliveredBy.trim().slice(0,48):"";
    const location=window.BaySecondUnit?.record(options?.location)?options.location:null;
    const windows=options?.windows||null;
    if(schedule&&listedWindows===windows&&listedLocation===location&&listedRecord===saved&&listedSkate===skate&&listedPrint===print&&listedSecond===second&&listedDelivery===delivery)return schedule;
    if(listedWindows!==windows){listedWindows=windows;windowImages=null;}
    if(listedLocation!==location){listedLocation=location;locationCard=null;}
    listedRecord=saved;listedSkate=skate;listedPrint=print;listedSecond=second;listedDelivery=delivery;
    const list=[];
    if(location)list.push(slot("location",location.title,"Second Unit · "+location.by+" · Frame "+location.number,5));
    if(windows?.length===3)list.push(slot("windows",BayWindowSeat.filmTitle,"Cine Luna · Second Unit",12));
    if(skate)list.push(slot("skate","Curb Cut",film.title(skate.site)+" · "+skate.score+" pts",film.duration(skate)));
    if(saved)list.push(slot("stunt","One Good Take","Romy Vale & Jules · "+saved.distance.toFixed(1)+" m",5));
    if(print)list.push(slot("edition","Bay Wire","Mara Vega · Lot 14, Port Sol",4));
    list.push(slot("pelican","The Last Pelican","Bay Film Club · 16 mm",28));
    if(second)list.push(slot("tram","After the Last Tram","Cine Luna archive, 1954"+(delivery?" · Delivered by "+delivery:""),26));
    schedule=Object.freeze(list);programFrames=list.reduce((sum,item)=>sum+item.seconds*fps,0);
    return schedule;
  }

  let projector=null,context=null,lastProgram=null,lastTick=-1,lastDecode=-1,revision=0,projection=null;
  function frame(time,options){
    const program=describe(options);
    const raw=Number.isFinite(time)?Math.floor(time*fps+.000001):0;
    const tick=((raw%programFrames)+programFrames)%programFrames;
    const decode=decodedStamp+(window.BaySkateFilm?.revision||0);
    if(program===lastProgram&&tick===lastTick&&(projection.id!=="stunt"&&projection.id!=="skate"&&projection.id!=="windows"||lastDecode===decode))return projection;
    let inSlot=tick,item=program[0];
    for(const entry of program){
      item=entry;
      if(inSlot<entry.seconds*fps)break;
      inSlot-=entry.seconds*fps;
    }
    if(!projector){
      projector=surface(backingWidth,backingHeight);context=projector.getContext("2d",{alpha:false});
      context.setTransform(backingWidth/width,0,0,backingHeight/height,0,0);
      context.lineCap="round";context.lineJoin="round";
    }
    const elapsed=inSlot/fps;
    if(item.id==="pelican")showPelican(context,elapsed);
    else if(item.id==="tram")showTram(context,elapsed,item.credit);
    else if(item.id==="stunt")showStunt(context,listedRecord);
    else if(item.id==="skate")window.BaySkateFilm.draw(context,listedSkate,elapsed,width,height);
    else if(item.id==="windows"){
      if(!windowImages)windowImages=listedWindows.map(r=>{const im=new Image();im.onload=()=>decodedStamp++;im.src=r.image;return im;});
      const i=Math.min(2,Math.floor(elapsed/4)),im=windowImages[i],r=listedWindows[i];
      rect(context,0,0,width,height,"#262b2b");
      if(im.naturalWidth){const w=height*1.5;context.drawImage(im,(width-w)/2,0,w,height);}
      rect(context,0,height-28,width,28,"rgba(34,39,38,.9)");
      label(context,BayWindowSeat.briefs[i].title,14,height-11,"italic bold 14px Georgia,serif",paper);
      label(context,r.by+"   /   "+String(r.number).padStart(2,"0"),width-14,height-11,"bold 9px monospace",chalk,"right");
    }else if(item.id==="location"){
      if(!locationCard){locationCard=surface(720,610);window.BayScoutPrints.print(locationCard,listedLocation);}
      rect(context,0,0,width,height,"#222825");const w=height*720/610;
      context.drawImage(locationCard,(width-w)*.5,0,w,height);
    }else showEdition(context);
    finishFrame(context,inSlot);
    lastProgram=program;lastTick=tick;lastDecode=decode;
    projection={canvas:projector,revision:++revision,id:item.id,title:item.title,credit:item.credit,elapsed,seconds:item.seconds};
    return projection;
  }
  window.BayCineProgram=Object.freeze({frame,describe});
})();
