/* Three negatives kept in Meli's desk, printed once and shared by the paper and curb TV. */
(() => {
  "use strict";
  const w=360,h=240,prints=new Map();
  const path=(c,d,color)=>{c.fillStyle=color;c.fill(new Path2D(d));};
  const pen=(c,d,color,width=1)=>{
    c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke(new Path2D(d));
  };
  function oval(c,x,y,rx,ry,ink,angle=0){
    c.fillStyle=ink;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();
  }
  function box(c,x,y,dx,dy,ink){c.fillStyle=ink;c.fillRect(x,y,dx,dy);}
  function dye(c,x1,y1,x2,y2,colors){
    const g=c.createLinearGradient(x1,y1,x2,y2);
    colors.forEach((color,i)=>g.addColorStop(i/(colors.length-1),color));return g;
  }
  function rand(seed){let n=seed>>>0;return ()=>((n=Math.imul(n,1664525)+1013904223>>>0)/4294967296);}
  function text(c,str,x,y,size,ink,face="bold",align="center"){
    c.font=face+" "+size+"px Arial,sans-serif";c.fillStyle=ink;c.textAlign=align;c.fillText(str,x,y);
  }
  function palm(c,x,y,size,ink){
    c.save();c.translate(x,y);c.scale(size,size);
    path(c,"M-4 78 Q2 45 0 6 L5 4 Q8 45 2 79Z",ink);
    for(let j=0;j<8;j++){
      c.save();c.rotate((j-3.5)*.44);
      const len=j%2?31:35;
      pen(c,"M2 5 Q12 -7 "+len+" 1",ink,1.7);
      for(let k=0;k<8;k++){
        const px=3+k*3.3,py=2.2-4.2*Math.sin((k+1)/9*Math.PI);
        path(c,"M"+px+" "+py+"q4.4 .3 7.1 5.4l-5.2 -3.1Z",ink);
      }
      c.restore();
    }c.restore();
  }
  function runner(c,x,y,s,lead){
    const shadow=lead?"#62493f":"#655951",skin=lead?"#b88462":"#ba9072",lit=lead?"#d5a47c":"#c9a98a";
    const shirt=lead?"#994d41":"#5e807d",gleam=lead?"#be785e":"#8ca69b",hair="#392f2c";
    c.save();c.translate(x,y);c.scale(s,s);
    // Swing and stance legs break the outline at different parts of the stride.
    if(lead){
      path(c,"M-14 87 Q-22 98 -23 111 L-40 123 Q-46 127 -42 133 Q-38 135 -33 133 L-12 119 Q-8 116 -3 104 L5 94Z",skin);
      path(c,"M-38 121 Q-44 120 -48 125 L-54 128 Q-58 131 -59 135 Q-53 138 -44 135 L-36 132Z","#ede1c4");
      pen(c,"M-58 135q7 3 21 -4","#544e46",1.6);
      path(c,"M3 88 Q13 97 26 109 Q29 114 25 123 L20 141 Q17 146 19 149 L26 151 L32 125 Q38 115 32 106 L19 83Z",skin);
      path(c,"M14 96 Q25 102 31 111 L29 118 Q25 108 16 104Z",lit);
      path(c,"M19 142L26 143L26 150L38 155Q41 160 34 160L17 155Q14 151 19 142Z","#ede0c1");
      pen(c,"M17 154l17 5 5 -1m-15 -8l7 2","#5e635b",1.7);
    }else{
      path(c,"M-13 87 Q-11 99 2 113 L-8 128 L-16 141 L-8 145 Q8 131 15 118 Q18 113 12 103 L4 87Z",shadow);
      path(c,"M5 89 Q16 93 25 102 Q30 107 27 111 L-1 128 L-6 129 L-10 125 L14 105 L-4 103Z",lit);
      path(c,"M-9 122L-1 126L-5 133Q-8 139 -23 141L-26 138Z","#d9d5be");
      path(c,"M-16 139L-6 139L-5 146L3 149L4 152L-16 151L-19 146Z","#e8dcc5");
    }
    // Far arm passes behind the singlet; the near arm crosses in front of the bib at the edge.
    path(c,lead?"M9 38 Q20 33 25 42 L40 55 L55 42 Q55 37 60 36 L65 37 L64 43 L58 47 L43 64 Q40 68 35 65 L13 52Z":
      "M10 38 Q24 35 29 47 L39 62 L53 53 L55 47 L61 47 Q64 53 59 56 L40 72 Q35 74 31 69 L13 52Z",shadow);
    path(c,"M-11 72 Q3 78 17 73 L20 84 L18 94 L5 98 L-3 91 L-8 98 L-24 93Z","#354446");
    path(c,"M-20 89L-9 93L-6 90L-6 94L-9 97L-23 92Z",gleam);
    pen(c,"M6 92l7 -6m-5 -7l-8 10","#5d6560");
    path(c,"M-4 24 L4 23 L5 29 L17 35 Q14 44 19 55 L18 76 Q4 83 -15 75 L-14 61 Q-19 45 -19 39 L-8 32Z",skin);
    path(c,"M-11 31 L-4 29 Q0 43 11 33 L15 34 Q13 46 21 52 L17 75 L4 80 L-17 75 Q-11 61 -17 48 Q-13 39 -11 31Z",shirt);
    pen(c,"M-11 32q-1 11 -6 15m13 -17q4 12 15 3",gleam,2);
    pen(c,"M-12 68l12 7m13 -21l-4 14","#434c48",1);
    path(c,"M-12 48 L13 47 L14 65 L-11 67Z","#e7dfbc");
    c.save();c.translate(1,62);c.rotate(-.06);text(c,lead?"41":"40",0,0,18,"#323929","bold");c.restore();
    for(const [bx,by] of [[-10,50],[11,49],[-9,64],[12,63]])oval(c,bx,by,.85,.75,"#72664e");
    if(lead)path(c,"M8.4 49l4.6 -2 .3 6.5Z","#b9b197");
    path(c,lead?"M-15 35 Q-22 34 -24 43 L-30 59 L-41 48 L-42 43 Q-43 39 -47 40 L-50 44 L-48 51 L-31 72 Q-26 75 -21 68 L-12 50 Q-9 39 -15 35Z":
      "M-16 35 Q-22 34 -26 44 L-28 60 L-12 71 L-9 76 L-14 78 L-35 68 Q-39 66 -37 59 L-30 38 Q-27 32 -19 32Z",skin);
    pen(c,lead?"M-20 40q-3 6 -4 12m-19 -8l-3 2m7 4l8 11":"M-25 43l-3 12m-5 10l13 8",lit,2.1);
    // Tangled ponytails, paper headband, cheek in side light.
    path(c,"M-8 4 Q-18 1 -21 9 Q-27 17 -33 15 Q-30 24 -22 21 Q-20 28 -14 21 Q-10 18 -8 14Z",hair);
    path(c,"M-8 1 Q-2 -4 6 0 Q13 2 14 11 L15 15 L19 18 L18 20 L15 20 L14 25 Q13 29 7 29 L5 34 L-3 31 L-3 25 Q-11 20 -11 12Z",skin);
    path(c,"M1 6 Q7 4 11 8 L12 13 L8 16 L9 19 L5 23 L0 20 L1 14Z",lit);
    path(c,"M-12 15 Q-15 6 -8 0 Q0 -6 8 -2 Q13 1 14 7 L5 5 L2 10 L-2 7 L-6 14 L-8 18Z",hair);
    pen(c,"M-11 10q8 -7 23 -4",lead?"#dbb07b":"#d4c7a3",2.3);
    pen(c,"M8 13l4 -.6m1 10l3 -.2m-21 -8q-4 -2 -2 4","#654d43",1);
    c.restore();
  }
  function footrace(c,r){
    box(c,0,0,w,h,dye(c,0,3,0,240,["#a9babc","#e4d9bc","#c9a883"]));
    const cx=304,cy=61,rad=45;
    for(let i=0;i<18;i++){
      const a=i*Math.PI/9,px=cx+rad*Math.cos(a),py=cy+rad*Math.sin(a);
      pen(c,"M304 61L"+px+" "+py,"#888a76",.72);box(c,px-2.4,py+1,4.8,3.3,"#8b7d67");
    }
    c.beginPath();c.arc(cx,cy,rad,0,Math.PI*2);c.strokeStyle="#898976";c.lineWidth=1.6;c.stroke();
    pen(c,"M280 118l24 -58 28 54","#877f6a",2.3);
    path(c,"M0 95L46 87L64 91L96 83L131 84L163 70L191 76L218 70L249 78L276 73L320 78L360 68V113H0Z","#abb09b");
    path(c,"M0 62L84 48L105 69L0 88Z","#9c705a");path(c,"M0 73L92 57L100 66L0 83Z","#c39b77");
    for(let i=0;i<9;i++)pen(c,"M"+(i*15-12)+" 81l0 34","#767b6e",2);
    palm(c,49,35,.78,"#778578");palm(c,165,61,.38,"#889686");palm(c,348,47,.64,"#7f8a79");
    path(c,"M0 111L360 96V126L0 145Z","#8b8976");
    const crowd=["#93866e","#647269","#ba9173","#d4c9a7","#8c6155","#667e79"];
    for(let i=0;i<66;i++){
      const x=r()*380-10,y=98-x*.035+r()*8,s=.7+r()*.63;
      oval(c,x,y,2.1*s,2.8*s,crowd[(1+r()*3)|0]);
      path(c,"M"+(x-3.9*s)+" "+(y+13*s)+"q-.7 -9 3 -10.8q5 -2 6.4 10Z",crowd[i%crowd.length]);
    }
    for(let i=0;i<16;i++){const x=i*25-7;pen(c,"M"+x+" "+(114-x*.04)+"l0 17","#c5bba0",1.7);}
    pen(c,"M-3 113L365 99m-369 28l370 -15","#ded2ac",2.2);
    path(c,"M0 137L360 115V240H0Z",dye(c,0,125,0,237,["#b4a68d","#ac9780","#877a69"]));
    path(c,"M61 240L293 119L297 119L73 240Z","#d5ccb1");path(c,"M311 240L336 117L339 116L323 240Z","#dacfb5");
    oval(c,134,216,45,5,"#8c816c",-.11);oval(c,243,222,64,6,"#827765",-.1);
    runner(c,113,69,.90,false);runner(c,232,32,1.22,true);
    // A torn strip of finish tape wraps the front runner and sags towards the rail.
    path(c,"M-1 155Q46 155 85 131Q139 114 192 123L224 117L234 116L227 119L233 123Q213 119 195 127Q144 119 87 135Q40 161 -1 159Z","#d7c4a4");
    path(c,"M256 114q25 -1 40 -13q17 -11 42 -7l23 -4v3l-24 4q-26 -3 -40 8q-21 15 -42 13l5 -3Z","#b89077");
  }
  function pier(c,r){
    box(c,0,0,w,h,dye(c,0,4,0,196,["#8ca6a2","#b2b9a4","#616f69"]));
    path(c,"M0 40Q30 49 61 44L120 39L116 46Q62 51 0 51Z","#859890");
    for(let i=0;i<44;i++){const x=r()*163,y=48+r()*57;pen(c,"M"+x+" "+y+"l"+(3+r()*15)+" -1","#b5bcaa",.7);}
    path(c,"M-13 46Q33 62 116 42Q100 73 78 79Q17 82 -12 65Z","#536963");
    pen(c,"M-7 53Q43 67 111 48","#c3bea0",4);
    c.save();c.translate(41,69);c.rotate(-.075);text(c,"LITTLE DOT",0,0,8.2,"#d8cdaa");c.restore();
    path(c,"M-2 90L360 66V240H0Z",dye(c,0,84,207,239,["#716951","#938165","#746d56"]));
    for(let i=0;i<10;i++){
      const y=89+i*21;pen(c,"M-9 "+y+"L369 "+(y-30),"#524e3e",1.5);
      pen(c,"M-2 "+(y+2)+"L361 "+(y-27),"#b09c79",.85);
      for(let j=0;j<8;j++){const x=r()*365,lineY=y+5+r()*11-x*.082;pen(c,"M"+x+" "+lineY+"q14 -3 33 -2.7","#8b775b",1);}
    }
    path(c,"M7 19L20 18L21 98Q16 103 9 100Z","#6b6956");
    for(let j=0;j<6;j++)pen(c,"M5 "+(75+j*3.1)+"q7 3 17 -1","#b29d76",2);
    pen(c,"M-5 95Q19 90 31 106T77 109","#5d604c",5);pen(c,"M-5 93Q18 89 32 104T77 107","#afa080",2);
    // Chest lifted on timber feet. A dull zinc skin wraps its corners.
    path(c,"M71 -5L360 -5L360 105L117 126L69 112Z","#333f39");
    path(c,"M78 8L109 22L108 101L78 88Z","#73857a");
    path(c,"M109 22L361 -5V86L108 107Z",dye(c,106,19,348,86,["#99a293","#89998c","#77897c"]));
    for(let j=0;j<4;j++){pen(c,"M111 "+(31+j*18)+"L363 "+(5+j*18),"#64796d",1.6);}
    path(c,"M73 2L106 14L361 -16V-1L108 28L73 16Z","#c1bda4");
    path(c,"M104 23L115 22L114 110L105 111Z","#aeb4a1");pen(c,"M108 27l-1 73","#d8d1b2",1.5);
    for(let j=0;j<6;j++)oval(c,109,33+j*13,1.4,1.3,"#586960");
    path(c,"M288 10l15 -2l-.7 18q-6 5 -13 1Z","#59695d");path(c,"M291 8l9 -1v14l-8 1Z","#c8c9b0");
    path(c,"M109 107l252 -24v11l-251 25Z","#b8b49a");
    path(c,"M108 118l21 -1v15l-20 4Z","#675b48");path(c,"M323 99l23 -2v27l-25 3Z","#625746");
    // The bell lies on its side. The empty suspension eye is visible inside its mouth.
    c.save();c.translate(125,168);c.rotate(-.26);
    oval(c,39,38,84,10,"rgba(51,46,32,.42)",-.08);
    const brass=dye(c,33,-52,40,48,["#68684f","#baa374","#dfc58a","#987d4d","#5f6146"]);
    path(c,"M-2 -48Q8 -47 17 -38Q46 -21 74 -18Q89 -18 97 -12L103 -8L103 8L95 15Q88 19 76 15Q39 14 6 43Q0 48 -5 46Z",brass);
    path(c,"M11 -40Q42 -23 84 -18L92 -15Q48 -16 23 -28Z","#e5ca8e");
    path(c,"M20 28Q54 4 86 8L95 11L88 14Q56 7 23 31Z","#827451");
    pen(c,"M7 -43Q22 -4 8 39","#6a664c",1.6);pen(c,"M12 -40Q26 -2 13 36","#d6b474",1.5);
    pen(c,"M80 -17q9 15 0 32","#7a7152",2.3);
    path(c,"M89 -14Q100 -17 111 -9L112 8Q101 15 89 13Q94 -1 89 -14Z","#9c885f");
    path(c,"M102 -9L115 -8Q123 -10 132 -7L167 -8Q170 -15 180 -10Q194 -2 184 7Q176 12 168 7L129 8Q118 13 105 8Z",dye(c,139,-12,140,10,["#453e32","#997954","#70583c","#373b30"]));
    pen(c,"M118 -4q16 1 37 -1m-11 3l24 -.4","#b19368",1);
    oval(c,-2,0,28,48,"#dac28a",-.09);oval(c,-3,0,25.3,44.3,"#71674a",-.09);
    oval(c,-3,0,23.2,41.2,dye(c,-22,8,18,-19,["#343f34","#646043","#99855b"]),-.09);
    pen(c,"M-24 19Q-24 32 -9 40Q2 44 10 33","#b8a074",2);
    oval(c,8,-1,5.6,6.6,"#434b3c");oval(c,8,-1.5,3.2,4.1,"#b59d70");oval(c,8,-1.6,1.65,2.2,"#42483b");
    c.restore();
    for(let j=0;j<5;j++)pen(c,"M"+(260+j*3)+" 219q16 -20 31 -8q18 13 42 0","#ab9878",2);
  }
  function spoonbill(c,x,y,s,side,tucked,last){
    c.save();c.translate(x,y);c.scale(s*side,s);
    const pink=tucked?"#cb9c96":"#c39690";
    pen(c,"M-3 -9l-1 15l-5 11m6 -10l2.5 10m-1 -1l-4 2","#5c514b",1.8);
    if(!tucked)pen(c,"M4 -9l1 8l-6 8l-4 -.3","#705952",1.4);
    path(c,"M-20 -18Q-13 -24 0 -23Q15 -24 18 -15Q18 -7 8 -5Q-4 -1 -13 -7L-21 -10L-27 -9L-20 -14Z",pink);
    path(c,"M-21 -16Q-11 -22 2 -19Q11 -17 11 -11Q5 -5 -9 -8L-23 -11L-18 -13Z","#a46d76");
    pen(c,"M-19 -14q11 -1 16 1.8m-14 -.2q7 .2 11 2.1","#c98990",1.1);
    if(last)path(c,"M-23 -12Q-16 -15 -9 -13Q-14 -10 -23 -12Z","#f2e6cc");
    // Head turned back onto the mantle. The broad, spoon-shaped tip rests along the plumage.
    path(c,"M10 -10Q17 -9 17 -19Q17 -29 10 -30Q4 -31 2 -26Q1 -22 5 -21Q11 -22 10 -18Q10 -15 5 -14Z","#cfb6a4");
    oval(c,6,-25.5,4.8,4.1,"#cfb9a8",-.25);
    path(c,"M3 -26Q0 -26 -5 -24L-12 -22Q-17 -23 -18 -20Q-17 -18 -12 -19L-5 -22L4 -24Z","#847f70");
    pen(c,"M4 -26q1.4 1 2.7 0","#6e6461",.85);c.restore();
  }
  function rooftop(c,r){
    box(c,0,0,w,h,dye(c,0,2,20,190,["#485969","#657586","#9ba1a0","#ccb2a1"]));
    for(let j=0;j<5;j++){
      const y=26+r()*76,x=r()*220-50;
      path(c,"M"+x+" "+y+"q29 -7 54 -4t65 2q-61 5 -119 2Z","rgba(187,169,160,.22)");
    }
    for(let j=0;j<22;j++)oval(c,r()*w,r()*83,.38+r()*.46,.58,"rgba(243,226,193,.56)");
    path(c,"M0 123l25 -4l9 -9l14 3v8l22 -3v-4l18 2l23 2l18 -8l22 1l16 8l19 -9l36 3l14 -12l15 2l9 7l21 -2l18 -9l17 2l14 6l15 -3v40H0Z","#798287");
    palm(c,15,82,.55,"#727c7d");palm(c,304,93,.34,"#747d7f");
    path(c,"M-8 145L239 123L372 153V218H0Z","#646f72");
    for(let i=0;i<29;i++){const x=i*18;pen(c,"M"+(x-48)+" 165L"+x+" "+(144-x*.071),"#7e8582",1.6);}
    pen(c,"M-5 145L240 122L372 151","#a3a09a",2.6);
    spoonbill(c,43,123,.80,1,true,false);spoonbill(c,92,119,.68,-1,false,false);
    spoonbill(c,159,112,.72,1,true,false);
    path(c,"M-12 187L212 133L374 155V249H-12Z","#595f60");
    path(c,"M-12 187L212 133L375 154L371 162L-12 203Z","#8f8580");
    for(let i=0;i<34;i++){
      const x=i*11.4-5,y=189-x*.16;
      pen(c,"M"+x+" "+y+"l6 -4l1 -2","#b0a69b",1.5);
    }
    path(c,"M-8 197L371 155V241H-8Z",dye(c,0,184,14,245,["#71736e","#535d5b","#3c4b4a"]));
    pen(c,"M-12 196L375 153","#413f43",3.5);
    spoonbill(c,115,157,.97,-1,true,false);spoonbill(c,205,144,1.04,1,false,false);
    spoonbill(c,291,136,1.18,-1,true,true);
    pen(c,"M-4 209L361 166","#8a8b7e",2);
    c.save();c.translate(148,213);c.rotate(-.104);text(c,"EL MERCADO",0,0,21,"#a39f8c","bold");c.restore();
    // The gooseneck lamp is dark; only the sky catches its outside rim.
    pen(c,"M302 183Q303 173 312 171Q322 169 325 176","#414e50",3);
    path(c,"M314 180Q320 171 327 172L335 177Q327 182 314 181Z","#4a5658");
    pen(c,"M315 179q8 -5 14 -4","#878c89",1);pen(c,"M314 181q12 .2 21 -4","#37484b",2.3);
    for(let j=0;j<8;j++){
      const x=r()*216-17,y=226+r()*25;pen(c,"M"+x+" "+y+"l40 -4","#475556",1.5);
    }
  }
  const shots={bib:[footrace,1983],bell:[pier,1952],pink:[rooftop,1989]};
  function negative(id){
    if(prints.has(id))return prints.get(id);
    const shot=shots[id],film=document.createElement("canvas");film.width=540;film.height=360;
    const c=film.getContext("2d"),r=rand(shot[1]);c.scale(1.5,1.5);shot[0](c,r);
    // Small clusters of silver grain and a slight falloff at the edges of the enlargement.
    for(let i=0;i<3900;i++){
      const x=r()*w,y=r()*h;
      box(c,x,y,.3+r()*.8,.28+r()*.48,i%4?"rgba(42,39,34,.12)":"rgba(255,239,208,.35)");
    }
    const edge=c.createRadialGradient(176,117,91,181,124,225);
    edge.addColorStop(0,"rgba(41,42,38,0)");edge.addColorStop(1,"rgba(42,40,36,.36)");
    box(c,0,0,w,h,edge);prints.set(id,film);return film;
  }
  function paint(canvas,id){
    if(!canvas||!Object.hasOwn(shots,id))return false;
    const c=canvas.getContext("2d");if(!c||canvas.width<1||canvas.height<1)return false;
    const img=negative(id);c.save();c.setTransform(1,0,0,1,0,0);
    c.globalAlpha=1;c.globalCompositeOperation="source-over";
    const f=Math.max(canvas.width/img.width,canvas.height/img.height),dx=img.width*f,dy=img.height*f;
    c.drawImage(img,(canvas.width-dx)/2,(canvas.height-dy)/2,dx,dy);c.restore();return true;
  }
  window.BayNeighborhoodEdition=Object.freeze({paint});
})();
