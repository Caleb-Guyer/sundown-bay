/* Della's workbench occupies the east wall of Portside Tire, beside the tow lane. */
(() => {
  "use strict";
  const yard={
    drop:{x:-84.8,z:-18,yaw:Math.PI,name:"Portside recovery lane"},
    bench:{x:-92.94,z:-18.3,yaw:Math.PI/2},
    della:{id:"della",name:"Della Moss",x:-91.55,z:-18.3,yaw:-Math.PI/2},
    truck:{x:-88.9,z:-12.6,yaw:0}
  };
  const people={
    iona:{id:"iona",name:"Iona Bell",occupation:"Sign painter"},
    rafa:{id:"rafa",name:"Rafa Soto",occupation:"Radio repairman"},
    liv:{id:"liv",name:"Liv Park",occupation:"Rink attendant"}
  };
  const colors={della:["#895e4c","#668c87","#46585a"],iona:["#aa7259","#d8ab72","#687e81"],
    rafa:["#ab795d","#d4b696","#57695f"],liv:["#b78769","#b37973","#375f68"]};
  const roles={della:"local",iona:"local",rafa:"local",liv:"local"};
  const blocks=[
    {x:-92.45,z:-18.3,w:1.00,d:4.76,bottom:0,top:1.13,streetProp:true},
    {x:-92.62,z:-15.49,w:.64,d:.70,bottom:0,top:.83,streetProp:true},
    {x:-81.4,z:-21,w:.50,d:.50,bottom:0,top:3.1,streetProp:true}
  ];
  const ink="#334844",teal="#426a65",cream="#ead6ae",rust="#ac6954",
    ochre="#d2a565",steel="#8c9c92",pale="#d8cfb3",rubber="#424946";
  const digits={
    A:"04 10 30 44|13 33",B:"04 00 30 41 32 02|32 43 34 04",C:"40 10 01 03 14 44",
    D:"04 00 20 41 43 24 04",E:"40 00 04 44|02 32",I:"10 30|20 24|14 34",L:"00 04 44",
    O:"10 30 41 43 34 14 03 01 10",P:"04 00 30 41 32 02",R:"04 00 30 41 32 02|22 44",
    S:"40 10 01 02 32 43 34 04",T:"00 40|20 24",V:"00 24 40",W:"00 14 22 34 40",Y:"00 22 40|22 24"
  };
  const strokes={};
  for(const [letter,mark] of Object.entries(digits)){
    strokes[letter]=mark.split("|").map(line=>line.split(" ").map(p=>[Number(p[0])/4,1-Number(p[1])/4]));
  }
  const face=z=>(u,y)=>[-u,y,z];
  function bar(g,point,x,y,X,Y,w,color){
    const dx=X-x,dy=Y-y,d=Math.hypot(dx,dy)||1,a=-dy*w/(2*d),b=dx*w/(2*d);
    g.quad(point(x+a,y+b),point(X+a,Y+b),point(X-a,Y-b),point(x-a,y-b),color);
  }
  function plate(g,point,x,y,X,Y,color){
    g.quad(point(x,y),point(X,y),point(X,Y),point(x,Y),color);
  }
  function legend(g,point,word,center,y,h,color){
    const w=h*.68,gap=h*.235,width=word.length*(w+gap)-gap;
    let left=center-width/2;
    for(const ch of word){
      for(const line of strokes[ch]||[])for(let i=1;i<line.length;i++){
        const [x1,y1]=line[i-1],[x2,y2]=line[i];
        bar(g,point,left+w*x1,y+h*y1,left+w*x2,y+h*y2,h*.112,color);
      }
      left+=w+gap;
    }
  }
  function round(g,p,u,v,rx,ry,n,color){
    for(let i=0;i<n;i++){
      const a=i*Math.PI*2/n,b=(i+1)*Math.PI*2/n;
      g.tri(p(u,v),p(u+rx*Math.cos(a),v+ry*Math.sin(a)),p(u+rx*Math.cos(b),v+ry*Math.sin(b)),color);
    }
  }
  function chain(g,points,r,color,n=5){
    for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,color,n);
  }
  function floor(g,x,z,w,d,y,c){
    g.quad([x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],c);
  }
  function floorLine(g,x,z,X,Z,w,y,c){
    bar(g,(u,v)=>[u,y,v],x,z,X,Z,w,c);
  }
  function wrench(g,x,y,z,length,width,color,angle=0){
    const cs=Math.cos(angle),sn=Math.sin(angle),p=(u,v)=>[x+u*cs-v*sn,y+u*sn+v*cs,z];
    bar(g,p,0,-length*.34,0,length*.29,width*.35,color);
    round(g,p,0,-length*.35,width*.42,width*.51,7,color);
    round(g,(u,v)=>{const a=p(u,v);a[2]+=.0018;return a;},0,-length*.35,width*.18,width*.23,7,ink);
    bar(g,p,-width*.06,length*.27,-width*.46,length*.37,width*.34,color);
    bar(g,p,-width*.46,length*.37,-width*.41,length*.51,width*.32,color);
    bar(g,p,-width*.07,length*.27,width*.34,length*.38,width*.35,color);
    bar(g,p,width*.34,length*.38,width*.27,length*.48,width*.28,color);
  }
  function yardPaint(g){
    // Open from both streets: the marks guide the car being delivered into the middle of the apron.
    floor(g,-.35,.4,11.15,22.6,.103,"#a7a79a");
    floor(g,-.20,-.24,10.56,19.81,.105,"#a8aa9f");
    for(const z of [-7.75,-1.23,5.44])floor(g,-.33,z,10.90,.033,.108,"#92998f");
    floor(g,-1.20,-.04,.037,22.09,.108,"#94998e");
    // A line broken where years of tires cross it.
    for(const side of [-1,1]){
      const x=side*1.88;
      for(const [z,d] of [[-6.32,2.12],[-3.68,2.54],[-.75,2.61],[2.11,2.78],[5.36,3.04]]){
        floor(g,x,z,.119,d,.115,"#e2cb95");
      }
      floor(g,x-side*.52,-7.48,1.16,.13,.114,"#ebd199");
      floor(g,x-side*.46,6.98,1.01,.13,.114,"#e5cb92");
      floor(g,x+side*.55,-3.54,1.05,.059,.112,"#c8ae80");
      for(let i=0;i<5;i++)floorLine(g,x+side*.42,6.88+i*.46,x+side*1.05,7.35+i*.46,.084,.114,"#c7b78d");
    }
    for(const [x,z,X,Z] of [[-1.43,-5.3,-1.34,-2.4],[-1.32,-2.32,-.88,.61],[.87,.65,.97,3.28],[.94,3.51,1.31,5.61]])
      floorLine(g,x,z,X,Z,.084,.108,"#92968a");
    floor(g,-.1,-7.46,2.06,.19,.115,"#d8a369");
    const chalk=(u,v)=>[u,.118,-8.76+v];legend(g,chalk,"TOW",0,0,.46,"#deceaa");
    // A rain channel lies outside the lane, below the bench.
    floor(g,-5.04,-1.45,.31,1.27,.119,"#67746d");
    for(let i=0;i<8;i++)floor(g,-5.04,-1.98+i*.152,.275,.064,.121,"#92998f");
    // The existing street palm grows just beyond the driver's stripe.
    const grate=(u,v)=>[3.40+u,.122,-3.0+v];
    round(g,grate,0,0,.697,.697,14,"#828d79");
    round(g,(u,v)=>[3.40+u,.124,-3.0+v],0,0,.599,.599,14,"#716e5c");
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,x=Math.cos(a),z=Math.sin(a);
      floorLine(g,3.40+.30*x,-3.0+.30*z,3.40+.615*x,-3.0+.615*z,.043,.126,"#8d9380");
    }
  }
  function bench(g){
    // This wall already belongs to the tire shop. The steel counter bolts straight into it.
    const f=face(.133);
    g.box(-.15,1.77,.082,4.28,1.23,.092,"#7e8577");
    plate(g,f,-1.94,1.20,2.23,2.32,"#b59875");plate(g,face(.136),-.31,1.26,1.99,2.21,"#aa9274");
    for(let row=0;row<6;row++)for(let col=0;col<15;col++){
      const x=-.22+col*.151,y=1.34+row*.148;
      plate(g,face(.141),x-.01,y-.01,x+.012,y+.012,"#7e7866");
    }
    // Two drawers are misaligned and the bottom corner is showing primer.
    g.box(0,.890,.53,4.70,.112,.99,"#5c6c64");g.box(0,.957,.53,4.75,.044,1.016,"#a3a493");
    g.box(0,.993,.57,4.70,.032,.93,"#b8ad95");
    for(const x of [-2.17,-.75,.77,2.17]){
      g.box(x,.443,.187,.067,.867,.067,ink);g.box(x,.443,.902,.067,.874,.072,teal);
      g.box(x,.056,.902,.134,.053,.138,steel);
    }
    g.box(.385,.478,.559,2.78,.79,.713,teal);
    for(const [x,y,w,h,depth] of [[-.41,.67,1.11,.20,.943],[-.41,.399,1.11,.294,.950],[.987,.673,1.30,.198,.932],[.987,.383,1.30,.319,.934]]){
      g.box(x,y,depth,w,h,.052,x<0?"#537870":"#587d73");
      g.box(x,y+h*.20,depth+.035,w*.34,.029,.041,steel);
    }
    g.tri([1.602,.245,.965],[1.536,.268,.965],[1.618,.328,.965],"#aa8569");
    g.box(-1.664,.228,.58,1.25,.052,.642,"#7b8574");
    for(const [x,z,ht,col] of [[-1.97,.57,.29,"#b58c60"],[-1.71,.59,.23,"#81998b"],[-1.45,.62,.32,"#b0a27a"]]){
      g.cyl(x,.257+ht/2,z,.092,.098,ht,7,col);g.cyl(x,.273+ht,z,.047,.052,.036,7,ink);
    }
    // The sign's lettering and Della's old phone are visible from the yard entrance.
    g.box(0,2.71,.081,4.66,.574,.122,"#52776d");
    const sign=face(.148);plate(g,sign,-2.246,2.451,2.246,2.969,cream);
    plate(g,face(.15),-2.19,2.492,2.19,2.933,"#52776b");
    legend(g,face(.153),"ROAD SERVICE",0,2.548,.302,"#f4dfb1");
    for(const x of [-2.19,2.19])g.box(x,2.705,.15,.055,.049,.018,pale);
    for(const x of [-2.22,2.22]){
      chain(g,[[x,2.92,.028],[x,3.18,.19],[x,3.19,.78]],.023,ink);
      g.pole([x,2.98,.025],[x,3.15,.64],.016,steel);
    }
    g.quad([-2.45,3.28,.021],[2.45,3.28,.021],[2.52,3.133,.974],[-2.52,3.133,.974],"#799387");
    g.box(0,3.086,.947,5.03,.087,.092,teal);
    for(let i=0;i<14;i++){
      const x=-2.39+.363*i;
      g.quad([x,3.283,.021],[x+.036,3.283,.021],[x+.055,3.136,.972],[x+.012,3.136,.972],"#8e9b8e");
    }
    // Pegboard on one side, two steel clips for the work orders on the other.
    for(const [x,y,a,sz] of [[.36,1.79,.14,.50],[.69,1.82,.13,.41],[.95,1.87,.14,.34],[1.24,1.89,.13,.30]])
      wrench(g,-x,y,.169,sz,.084,steel,a);
    for(const x of [-1.59,-1.32]){g.box(x,1.74,.186,.030,.398,.034,pale);g.box(x,1.57,.188,.07,.204,.058,x<-1.4?rust:"#637766");}
    g.box(1.21,1.995,.164,1.43,.061,.065,steel);
    for(const x of [.70,1.19,1.70])g.box(x,1.955,.178,.044,.095,.044,ink);
    // An analog radio with grille, frequency scale, tuning knobs and coiled mic lead.
    g.box(-1.51,1.257,.51,.956,.439,.512,"#435d55");
    g.box(-1.51,1.255,.780,.889,.374,.038,"#8b9a87");
    for(let i=0;i<7;i++)g.box(-1.708,1.132+i*.041,.802,.399,.016,.011,"#4c6058");
    g.box(-1.271,1.343,.805,.283,.085,.016,"#bcb398");
    for(let i=0;i<6;i++)g.box(-1.375+i*.042,1.345,.815,.008,i%2?.024:.037,.008,"#645f50");
    g.box(-1.273,1.342,.821,.011,.055,.009,rust);
    for(const x of [-1.34,-1.17]){
      round(g,(u,y)=>[u,y,.812],x,1.180,.046,.046,9,ink);
      g.box(x,1.190,.820,.009,.025,.007,cream);
    }
    g.pole([-1.84,1.476,.319],[-2.02,2.163,.256],.009,pale,4);
    g.box(-.899,1.21,.719,.117,.201,.094,"#434d48");
    for(let i=0;i<4;i++)g.box(-.9,1.222+i*.025,.770,.081,.008,.009,steel);
    const cord=[];
    for(let i=0;i<=22;i++){
      const u=i/22;cord.push([-.90-.40*u,.997+.121*u+.099*(1-u)**4+.019*Math.cos(i*1.9),.74+.070*Math.sin(Math.PI*u)]);
    }
    chain(g,cord,.009,"#414d47",4);
    // A hub mounted horizontally in the bench vise is what the spanner actually turns.
    g.box(-.118,1.055,.887,.444,.091,.248,teal);
    g.box(-.118,1.15,.919,.242,.157,.168,"#547975");
    g.cyl(-.118,1.245,.919,.124,.118,.085,10,steel);
    g.cyl(-.118,1.303,.919,.041,.050,.072,6,"#b49a6f");
    for(const [u,z] of [[-.61,.68],[-.43,.59],[-.50,.80]])g.cyl(u,1.028,z,.040,.042,.035,6,steel);
    g.box(.65,1.031,.582,.40,.061,.21,"#af7760");
    g.box(.65,1.078,.580,.435,.052,.237,"#bc8c69");
    // A rolled lead hangs on a hook just past the bench.
    for(const rad of [.212,.181,.155]){
      const loop=[];for(let i=0;i<=13;i++){const a=i/13*Math.PI*2;loop.push([2.76+Math.cos(a)*rad,1.12+Math.sin(a)*rad*1.43,.134]);}
      chain(g,loop,.016,rubber,5);
    }
    chain(g,[[2.76,1.42,.144],[2.65,1.13,.16],[2.85,.56,.20]],.016,rubber);
    g.box(2.85,.540,.20,.053,.082,.05,ochre);
    g.cyl(-2.813,.372,.34,.299,.268,.694,10,"#78877a");
    for(const y of [.16,.60,.72])g.cyl(-2.813,y,.34,.302,.303,.032,10,steel);
    g.box(-2.822,.76,.34,.378,.044,.045,"#334945");
    // Cantilever faces both the main street and the return lane.
    chain(g,[[-6.82,3.22,.015],[-6.82,3.26,.23],[-6.82,3.26,2.94]],.054,teal,6);
    g.pole([-6.82,2.53,.052],[-6.82,3.25,1.57],.038,teal,5);
    for(const z of [.95,2.75])g.pole([-6.82,3.24,z],[-6.82,3.04,z],.019,steel);
    g.box(-6.82,2.57,1.85,.11,.96,2.22,"#4b6b60");
    for(const side of [-1,1]){
      const point=(u,y)=>[-6.82+side*.059,y,1.85+side*u];
      plate(g,point,-1.035,2.163,1.035,2.983,cream);
      const signFace=(u,y)=>[-6.82+side*.063,y,1.85+side*u];
      legend(g,signFace,"TOW",0,2.532,.345,teal);
      legend(g,signFace,"YARD",0,2.240,.170,rust);
      for(const x of [-.94,.94])round(g,signFace,x,2.57,.021,.021,6,steel);
    }
  }
  const stock=["#e6c393","#df9d85","#b4c4b0","#e5d3a4","#deb0a1","#a8b9b2"];
  function ticket(g,i){
    const x=.70+(i%3)*.50+(i<3?0:.095), y=1.67-(i<3?0:.089), z=.198+(i<3?0:.018);
    const paper=face(z+.007),mark=face(z+.009),left=-x-.19,base=y-.198;
    g.box(x,y,z,.382,.416,.009,stock[i]);
    plate(g,paper,left+.017,base+.309,left+.364,base+.369,"#b57962");
    for(let k=0;k<4;k++){
      const h=base+.258-k*.048;
      bar(g,mark,left+.027,h,left+.339,h,.003,"#9f927b");
      bar(g,mark,left+.044,h+.009,left+.111+(k+i)%3*.048,h+.017,.009,"#74776a");
    }
    bar(g,mark,left+.242,base+.058,left+.304,base+.092,.009,"#976d59");
    bar(g,mark,left+.302,base+.092,left+.33,base+.079,.008,"#976d59");
    g.box(x,y+.19,z+.009,.058,.044,.018,steel);
  }
  function returnedPart(g,i){
    if(i===0){
      // A cracked lamp. Its frame leans against the wall at the end of the counter.
      g.box(1.83,1.162,.345,.454,.295,.107,"#526c66");
      g.box(1.83,1.163,.408,.406,.237,.032,"#bbb8a3");
      for(let k=0;k<5;k++)g.box(1.664+k*.083,1.169,.43,.013,.20,.009,"#d7c9a9");
      chain(g,[[1.69,1.255,.439],[1.76,1.172,.439],[1.73,1.13,.439],[1.828,1.049,.439]],.008,"#747d73",4);
    }else if(i===1){
      // The impeller removed from the second car still has one short blade.
      g.cyl(1.36,1.051,.705,.095,.094,.078,9,ink);
      for(let k=0;k<5;k++){
        const a=k*Math.PI*.4,cs=Math.cos(a),sn=Math.sin(a);
        const p=(u,v)=>[1.36+u*cs-v*sn,1.083,.705+u*sn+v*cs];
        const l=k===2?.123:.202;
        g.quad(p(.025,-.032),p(l*.85,-.065),p(l,.027),p(.064,.051),"#838e78");
      }
      g.cyl(1.36,1.092,.705,.048,.054,.047,8,"#b19a75");
    }else{
      const leads=[[1.812,1.02,.788],[1.781,1.045,.621],[1.834,1.073,.565],[2.129,1.073,.566],[2.215,1.043,.68],[2.137,1.016,.79],[1.952,1.018,.802]];
      chain(g,leads,.027,rubber,6);
      for(const x of [1.954,2.07])g.cyl(x,1.036,.774,.037,.041,.051,6,steel);
    }
  }
  function rag(g){
    const p=[[-.033,.021,.006],[.053,-.028,.035],[.083,-.196,.003],[.009,-.257,.05],[-.048,-.194,-.028],[-.069,-.093,-.004]];
    g.tri(p[0],p[1],p[3],"#b26b58");g.tri(p[1],p[2],p[3],"#c5846b");
    g.tri(p[0],p[3],p[5],"#8b5e4e");g.tri(p[3],p[4],p[5],"#a36955");
    chain(g,[[.074,-.175,.012],[.013,-.232,.048],[-.046,-.168,-.018]],.005,"#cf9879",4);
  }
  function socket(g){
    // In use, the hand grips the narrow end and the socket projects out over the hub.
    chain(g,[[0,0,-.042],[0,.003,.117],[.014,.002,.193]],.014,steel,7);
    g.cyl(.014,-.013,.197,.037,.032,.035,8,pale);
    g.cyl(.014,-.041,.197,.026,.023,.035,6,"#71827a");
    g.pole([0,0,-.047],[0,0,.033],.021,"#5b6860",7);
  }
  function brushCase(g){
    chain(g,[[-.090,-.099,0],[-.082,-.018,0],[-.056,0,0],[.064,0,0],[.09,-.032,0],[.092,-.099,0]],.014,"#9a7759",5);
    g.box(0,-.207,0,.385,.218,.167,"#597972");g.box(0,-.12,0,.391,.035,.171,"#6a8980");
    for(const x of [-.177,.177])g.box(x,-.205,.087,.025,.21,.013,"#b0a27b");
    for(const x of [-.103,.103])g.box(x,-.138,.09,.037,.041,.013,ochre);
    const front=face(.091);bar(g,front,-.116,-.245,.017,-.207,.008,"#daba8e");
    bar(g,front,.010,-.205,.085,-.219,.006,"#daba8e");
    g.tri([-.193,-.274,.079],[-.164,-.308,.087],[-.192,-.311,.083],"#d19b73");
    g.box(.125,-.105,.018,.084,.010,.09,"#e0d4b2",.17);
  }
  function brush(g){
    g.pole([.008,-.035,0],[-.012,.105,.029],.010,"#a77c5b",5);
    g.box(-.011,.117,.031,.049,.048,.015,"#a9b3a0");
    g.quad([-.038,.140,.033],[.012,.14,.033],[.012,.185,.032],[-.041,.183,.028],"#b48f67");
    g.quad([-.042,.172,.034],[.013,.175,.034],[.015,.194,.031],[-.043,.189,.032],"#607f76");
  }
  function portableRadio(g){
    chain(g,[[-.11,-.09,0],[-.105,-.030,0],[-.075,-.004,0],[.069,-.004,0],[.107,-.029,0],[.113,-.092,0]],.013,"#87664e");
    g.box(0,-.207,0,.328,.232,.118,"#956f52");
    g.box(0,-.202,.064,.295,.200,.016,"#c6b893");
    for(let k=0;k<6;k++)g.box(-.051,-.270+.023*k,.075,.167,.009,.006,"#62766c");
    g.box(.092,-.177,.074,.056,.069,.008,"#617c73");
    g.box(.098,-.17,.080,.008,.055,.005,ochre);
    g.box(.092,-.253,.078,.043,.031,.014,"#827554");
    g.pole([-.113,-.091,-.034],[-.189,.194,-.045],.005,steel,5);
    g.box(.125,-.095,-.016,.032,.016,.027,ink);
  }
  function skates(g){
    const boots=[[-.083,-.240,.008,-.16],[.092,-.272,.026,.20]];
    for(const [x,y,z,a] of boots){
      const cs=Math.cos(a),sn=Math.sin(a),p=(u,v,w)=>[x+u*cs+w*sn,y+v,z-u*sn+w*cs];
      chain(g,[[0,-.008,0],[x*.5,-.064,z-.004],p(0,.096,-.041)],.007,"#dfc8a2",4);
      const box=(u,v,w,width,height,depth,c)=>g.box(...p(u,v,w),width,height,depth,c,a);
      box(0,0,.009,.114,.096,.226,"#d8c6a3");box(0,.066,-.048,.109,.105,.110,"#cfc3a5");
      box(0,.117,-.046,.115,.021,.117,"#688c88");
      box(0,-.050,.012,.118,.026,.230,"#9d8064");box(0,-.072,.015,.064,.028,.174,steel);
      for(const side of [-1,1])for(const w of [-.052,.084])
        g.pole(p(side*.043,-.091,w),p(side*.078,-.091,w),.035,"#b96762",8);
      box(0,-.073,.123,.047,.036,.035,"#c79772");
      for(let k=0;k<3;k++)box(0,.032+.018*k,.054-.029*k,.057,.008,.010,cream);
      for(const side of [-1,1]){
        g.quad(p(side*.058,-.013,-.061),p(side*.058,.009,-.068),p(side*.058,.046,-.005),p(side*.058,.024,.008),rust);
      }
    }
  }
  function warningTriangle(g){
    g.box(0,.027,0,.56,.049,.13,rubber);
    const foot=(u,v)=>[u,v,0];
    for(const sign of [1,-1]){
      const plane=(u,v)=>[u,v,sign*.018];
      for(const [x,y,X,Y] of [[-.29,.09,0,.58],[0,.58,.29,.09],[.29,.09,-.29,.09]])bar(g,plane,x,y,X,Y,.071,"#c07754");
      for(const [x,y,X,Y] of [[-.244,.113,0,.526],[0,.526,.244,.113],[.244,.113,-.244,.113]])bar(g,plane,x,y,X,Y,.014,"#ebbb77");
    }
    bar(g,foot,-.19,.068,.19,.068,.041,steel);
    for(const side of [-1,1])g.pole([side*.14,.026,-.05],[side*.085,.217,0],.014,steel);
  }
  function dress(rig,id){
    if(!rig||!colors[id]||rig.recoveryCostume===id)return;
    const g=new BayMesh(),parts=[];
    const mark=(part,side)=>parts.push({part,side,first:g.vertices.length/6});
    const front=face(.131),back=(x,y)=>[x,y,-.126];
    mark("body");
    if(id==="della"){
      for(const side of [-1,1]){
        g.tri(front(side*.012,1.42),front(side*.103,1.409),front(side*.066,1.316),"#9caf9c");
        plate(g,front,side*.052,1.209,side*.133,1.287,"#597e77");
        bar(g,face(.135),side*.055,1.278,side*.137,1.279,.011,"#adc1a9");
        bar(g,back,side*.071,1.421,side*.124,1.336,.012,"#a2b2a0");
      }
      bar(g,front,0,1.348,0,1.00,.013,"#b7baa1");
      plate(g,face(.139),-.135,1.296,-.044,1.332,"#dccdb0");
      for(let i=0;i<4;i++)bar(g,face(.141),-.124+i*.015,1.308,-.110+i*.015,1.318,.005,ink);
      g.box(0,.995,.003,.318,.043,.216,"#5c6050");g.box(.012,.997,.121,.047,.030,.013,steel);
      plate(g,back,-.130,1.267,.132,1.339,"#4d6f66");legend(g,(u,y)=>[u,y,-.133],"TIRE",.001,1.286,.037,cream);
      for(const side of [-1,1]){
        mark("arm",side);
        g.cyl(side*.235,1.283,.002,.076,.075,.039,8,"#a7ad98");
        g.box(side*.236,1.20,.062,.041,.061,.009,"#7d604e");
        mark("leg",side);
        g.box(side*.11,.546,.093,.098,.14,.014,"#546762");
        g.box(side*.11,.226,.061,.105,.028,.01,"#abb09d");
      }
      mark("head");
      g.cyl(0,1.726,-.013,.104,.108,.043,12,"#ba795c");
      g.cyl(-.037,1.728,-.102,.068,.064,.091,9,"#473e38");
      g.tri([.081,1.722,-.069],[.151,1.738,-.113],[.128,1.697,-.118],"#d2926d");
      g.tri([.090,1.715,-.067],[.130,1.666,-.106],[.119,1.645,-.10],"#ac7156");
    }else if(id==="iona"){
      g.quad(front(-.075,1.375),front(.084,1.375),front(.145,.957),front(-.145,.957),"#566e70");
      for(const side of [-1,1])bar(g,front,side*.061,1.353,side*.114,1.426,.020,"#a78865");
      plate(g,face(.136),-.092,1.008,.090,1.116,"#6e8985");
      for(const [x,y,c,r] of [[.062,1.053,"#d4ab73",.012],[-.047,1.202,"#d9cda7",.015],[.025,1.261,"#ad705a",.008],
        [-.093,1.042,"#d5bd8f",.007],[.080,1.170,"#adc3a5",.012],[-.024,1.028,"#c57d68",.013]]){
        bar(g,face(.144),x,y,x+r*.6,y+r*1.6,r,c);
      }
      for(const side of [-1,1])bar(g,back,side*.107,1.423,-side*.132,1.04,.024,"#9b7656");
      mark("head");g.cyl(0,1.754,-.014,.087,.109,.079,11,"#b27060");
      g.cyl(0,1.722,-.011,.110,.109,.030,11,"#d19a76");
      for(const x of [-.071,.015,.068])g.box(x,1.751,.078,.014,.012,.013,"#e7bf91");
      g.tri([-.083,1.731,-.069],[-.16,1.752,-.074],[-.147,1.711,-.126],"#bc806a");
      g.pole([.098,1.634,-.078],[.102,1.730,.056],.006,ochre,5);
    }else if(id==="rafa"){
      for(const side of [-1,1]){
        g.tri(front(side*.012,1.416),front(side*.100,1.411),front(side*.061,1.321),"#a88c70");
        for(const x of [.069,.125])bar(g,front,side*x,1.02,side*x,1.371,.006,"#a79075");
      }
      for(let i=0;i<5;i++){
        const y=1.062+i*.067;
        bar(g,front,-.139,y,.136,y,.006,"#ab977b");bar(g,back,-.139,y,.136,y,.006,"#af9b7d");
      }
      plate(g,face(.136),-.134,1.23,-.065,1.296,"#d6c3a2");
      g.box(.091,1.298,.146,.011,.061,.011,"#606d64");
      g.box(0,.990,0,.309,.03,.215,"#806b54");
      mark("head");
      for(const side of [-1,1]){
        g.box(side*.048,1.648,.109,.081,.041,.015,"#716651");
        g.box(side*.049,1.649,.119,.062,.024,.004,"#99a093");
        g.box(side*.099,1.654,.034,.010,.011,.111,"#8d7957");
      }
      g.box(0,1.654,.116,.021,.010,.016,"#a38b67");
      g.box(-.004,1.599,.108,.089,.015,.007,"#655141");
      g.cyl(0,1.749,-.022,.078,.105,.054,10,"#666256");
      g.box(-.093,1.686,-.009,.018,.051,.085,"#9d9680");
    }else{
      for(const side of [-1,1]){
        bar(g,front,0,1.262,side*.16,1.356,.042,"#e1bd94");
        bar(g,front,0,1.222,side*.16,1.317,.015,"#638789");
        bar(g,back,0,1.276,side*.159,1.355,.039,"#dec09a");
        bar(g,front,side*.071,1.421,0,1.281,.007,teal);
      }
      g.box(.002,1.264,.146,.039,.052,.018,steel);
      g.box(.002,1.280,.158,.024,.014,.007,ink);
      mark("head");g.cyl(0,1.722,-.002,.111,.113,.035,12,"#587b7d");
      g.box(0,1.720,.109,.178,.017,.106,"#d0ae86");
      g.cyl(0,1.683,-.111,.066,.064,.103,9,"#64463b");
      g.cyl(0,1.641,-.117,.046,.051,.027,8,"#d99877");
      g.cyl(0,1.603,-.124,.035,.057,.068,8,"#695045");
    }
    const next=new Float32Array(rig.rest.length+g.vertices.length);
    next.set(rig.rest);next.set(g.vertices,rig.rest.length);
    for(let i=0;i<parts.length;i++){
      const item=parts[i],limb=rig.sides[item.side===1?1:0],end=parts[i+1]?.first??g.vertices.length/6;
      for(let j=item.first;j<end;j++)rig.bindings.push(rig.binding(item.part,limb,g.vertices[j*6+1]));
    }
    rig.rest=next;rig.vertices=next.slice();rig.recoveryCostume=id;
  }
  function reach(limb,x,y,z){
    const root=limb.shoulder,elbow=limb.elbow,hand=limb.hand,dx=x-root[0],dy=y-root[1],dz=z-root[2];
    const n=Math.max(.001,Math.hypot(dx,dy,dz)),ux=dx/n,uy=dy/n,uz=dz/n;
    const upper=limb.arm.length,lower=limb.forearm.length,d=Math.min(upper+lower-.002,Math.max(.06,n));
    hand[0]=root[0]+d*ux;hand[1]=root[1]+d*uy;hand[2]=root[2]+d*uz;
    const along=(upper*upper-lower*lower+d*d)/(2*d),bend=Math.sqrt(Math.max(0,upper*upper-along*along));
    const outward=.72*limb.side,vertical=-.67,forward=-.32,projection=outward*ux+vertical*uy+forward*uz;
    const ex=outward-ux*projection,ey=vertical-uy*projection,ez=forward-uz*projection;
    const f=bend/Math.max(.001,Math.hypot(ex,ey,ez));
    elbow[0]=root[0]+ux*along+ex*f;elbow[1]=root[1]+uy*along+ey*f;elbow[2]=root[2]+uz*along+ez*f;
    limb.arm.aim(root,elbow);limb.forearm.aim(elbow,hand);
  }
  const wrenchAngle=t=>.19+.51*Math.sin(t*2.6);
  const liftWave=(t,offset)=>Math.pow(.5+.5*Math.cos((t+offset)*.88),3);
  function pose(p,t){
    const rig=p.mesh;if(!rig||p.motion?.ride)return false;
    const [left,right]=rig.sides;
    if(p.id==="della"){
      if(p.phase==="repair"){
        const at=rig.pivot,stroke=.5+.5*Math.sin(t*5.7);
        rig.pelvis.map(rig.chest.pivot,at);rig.chest.place(at,.34+.075*stroke,-.09,.025);
        rig.chest.map(rig.head.pivot,at);rig.head.place(at,.32+.09*stroke,-.12);
        for(const limb of rig.sides)rig.chest.map(limb.arm.pivot,limb.shoulder);
        reach(left,-.160,1.065+.017*Math.cos(t*2.1),.280);
        reach(right,.134+.082*stroke,1.073+.082*stroke,.278+.046*stroke);
      }else if(p.phase==="bench"){
        const a=wrenchAngle(t),sn=Math.sin(a),cs=Math.cos(a);
        reach(right,.118-.014-.014*cs-.197*sn,1.378,.471-.015+.014*sn-.197*cs);
        reach(left,-.119+.048*Math.sin(t*1.8),1.118+.035*Math.cos(t*1.8),.274);
      }else return false;
    }else if(p.phase==="home"){
      const check=.5+.5*Math.sin(t*(p.id==="iona"?2.5:1.9));
      if(p.id==="iona"){
        reach(left,-.149,1.275,.176);reach(right,-.052+.063*check,1.305+.012*check,.194);
      }else if(p.id==="rafa"){
        reach(left,-.077,1.395,.204);reach(right,.010+.024*check,1.217,.250);
      }else{
        reach(left,-.149,1.379,.171);reach(right,-.026+.036*check,1.261+.018*check,.194);
      }
    }else if(p.phase==="waiting"){
      if(p.id==="iona"){
        const signal=liftWave(t,2.4);
        reach(left,-.228,1.013+.012*Math.sin(t*1.4),.105);
        reach(right,.212+.098*signal,1.16+.40*signal,.198-.033*signal+.017*Math.sin(t*5.2)*signal);
      }else if(p.id==="rafa"){
        const tune=liftWave(t,4);
        reach(left,-.082,1.379+.023*tune,.224);
        reach(right,.108-.086*tune,1.156+.076*tune,.236+.008*Math.sin(t*5.0));
      }else{
        const wave=liftWave(t,.4);
        reach(left,-.241,.999+.034*wave,.128);
        reach(right,.239+(.112+.04*Math.sin(t*7.9))*wave,1.114+.493*wave,.132+.06*wave);
      }
    }else return false;
    rig.skin();return true;
  }
  function place(p,x,y,z){
    const yaw=p.yaw||0,sn=Math.sin(yaw),cs=Math.cos(yaw);
    return {x:p.x+x*cs+z*sn,y:(p.y||0)+y,z:p.z-x*sn+z*cs,yaw};
  }
  function grip(p,side){
    const limb=p.mesh?.sides[side===1?1:0];
    const v=limb?limb.forearm.map(limb.handPivot,limb.hand):[side*.24,1.014,.075];
    return place(p,v[0]+side*.014,v[1]-.034+(p.motion?.lift||0),v[2]+.015);
  }
  const seated=p=>p.phase==="passenger"||p.phase==="driving"||
    (["boarding","leaving","parking","pickup"].includes(p.phase)&&p.seat>.56);
  function triangleAt(p){
    return place(p.car,-.45,.078,-(p.car.kind==="van"?3.86:3.32));
  }
  function install(model){
    model("recovery-apron",yardPaint);model("recovery-bench",bench);
    model("recovery-warning",warningTriangle);model("recovery-rag",rag);model("recovery-socket",socket);
    model("recovery-iona-case",brushCase);model("recovery-brush",brush);
    model("recovery-rafa-case",portableRadio);model("recovery-liv-case",skates);
    for(let i=0;i<stock.length;i++)model("recovery-ticket-"+i,g=>ticket(g,i));
    for(let i=0;i<3;i++)model("recovery-part-"+i,g=>returnedPart(g,i));
    model("recovery-radio-light",g=>{
      const p=face(.809);plate(g,p,1.238,1.293,1.425,1.348,"#edbd84");
      for(let i=0;i<7;i++)bar(g,p,1.244+i*.026,1.300,1.244+i*.026,1.31+(i%2)*.008,.003,"#a98562");
      g.box(-1.145,1.314,.812,.024,.018,.012,"#cf7f54");
    });
    model("recovery-work-light",g=>{
      g.box(0,3.05,.81,1.23,.032,.085,ink);g.box(0,3.03,.81,1.13,.019,.062,"#e8ddbb");
    });
  }
  function ground(view,see){
    if(see(yard.drop,115))view.draw("recovery-apron",yard.drop.x,0,yard.drop.z);
  }
  function actorProps(list,p,t){
    const onboard=seated(p);
    if(onboard&&!p.ride)return;
    const left=grip(p,-1),right=grip(p,1),swing=(p.motion?.weight||0)*Math.cos((p.motion?.phase||0)*Math.PI*2);
    if(p.id==="della"){
      const benchWork=p.phase==="bench",repairing=p.phase==="repair";
      list.push(["recovery-rag",left.x,left.y,left.z,left.yaw,-.14*swing,.095*Math.sin(t*2.0)]);
      list.push(["recovery-socket",right.x,right.y,right.z,right.yaw+(benchWork?wrenchAngle(t):repairing?.22*Math.sin(t*5.7):-.24),
        benchWork?0:repairing?.38+.22*Math.sin(t*5.7):1.10-.10*swing]);
    }else if(people[p.id]){
      let stow=0;
      if(p.ride&&(p.seat>.2||onboard)){
        const v=p.ride,d=bayCarLayout(v.kind),side=v===p.car?-1:1;
        const pocket=place(v,side*(d.seatX+.015),0,d.seatZ+.45);
        const u=Math.max(0,Math.min(1,((p.seat||0)-.20)/.62));
        stow=u*u*(3-2*u);
        left.x+=(pocket.x-left.x)*stow;left.z+=(pocket.z-left.z)*stow;
        left.y+=((p.y||0)+d.seatY+.09-left.y)*stow;
        left.yaw+=Math.atan2(Math.sin(pocket.yaw-left.yaw),Math.cos(pocket.yaw-left.yaw))*stow;
      }
      list.push(["recovery-"+p.id+"-case",left.x,left.y,left.z,left.yaw+.15,(1-stow)*-.10*swing,
        (1-stow)*(p.id==="liv"?.085*Math.sin(t*2.5)+.10*swing:.025*swing)]);
      if(!onboard&&p.id==="iona")list.push(["recovery-brush",right.x,right.y,right.z,right.yaw+.2,p.phase==="home"?2.64:-.22,.23]);
    }
  }
  function world(list,see,t,hours,service){
    const b=yard.bench;
    if(see(b,121)){
      const lit=hours?.night||0,fixture=name=>list.push([name,b.x,.077,b.z,b.yaw]);
      fixture("recovery-bench");
      list.push(["recovery-radio-light",b.x,.077,b.z,b.yaw,0,0,.09+.31*lit],
        ["recovery-work-light",b.x,.077,b.z,b.yaw,0,0,.09+.60*lit]);
      const n=Math.min(stock.length,service?.completed||0);
      for(let i=0;i<n;i++)fixture("recovery-ticket-"+i);
      for(let i=0;i<Math.min(3,n);i++)fixture("recovery-part-"+i);
    }
    if(service?.della&&see(service.della,54))actorProps(list,service.della,t);
    for(const p of service?.people||[]){
      if(p.phase==="waiting"&&p.car&&see(p.car,76)){
        const q=triangleAt(p);list.push(["recovery-warning",q.x,q.y,q.z,q.yaw]);
      }
      if(see(p,53))actorProps(list,p,t);
    }
  }
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function disc(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,2*Math.PI);c.fillStyle=color;c.fill();}
  function trace(c,points,color,width){
    c.beginPath();c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.lineJoin="round";c.stroke();
  }
  function mapAt(c,p,px,py,s,draw){
    c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw||0);c.scale(s,s);draw(c);c.restore();
  }
  function apronPlan(c){
    rect(c,-5.925,-11.70,11.15,22.6,"#adb0a0");
    rect(c,-5.48,-9.665,10.56,19.81,"#afb2a3");
    for(const z of [-7.75,-1.23,5.44])rect(c,-5.805,-z-.017,10.9,.033,"#919b91");
    rect(c,-1.21,-10.93,.036,22.09,"#939c91");
    for(const side of [-1,1]){
      const x=side*1.88;
      for(const [z,d] of [[-6.32,2.12],[-3.68,2.54],[-.75,2.61],[2.11,2.78],[5.36,3.04]])rect(c,x-.07,-z-d/2,.14,d,"#ead39b");
      rect(c,x-side*.52-.58,7.41,1.16,.14,"#ead39b");
      rect(c,x-side*.46-.50,-7.05,1.01,.14,"#ead39b");
      for(let i=0;i<5;i++)trace(c,[[x+side*.42,-6.88-i*.46],[x+side*1.05,-7.35-i*.46]],"#cab98f",.09);
    }
    rect(c,-1.13,7.36,2.06,.19,"#d7a465");
    rect(c,-5.195,.815,.31,1.27,"#6d786d");
    for(let j=0;j<8;j++)rect(c,-5.177,.86+j*.149,.273,.06,"#9ca38f");
    disc(c,3.40,3.0,.693,"#84907b");disc(c,3.40,3.0,.576,"#726d59");
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,x=Math.cos(a),y=Math.sin(a);
      trace(c,[[3.40+.30*x,3+.30*y],[3.40+.60*x,3+.60*y]],"#929780",.043);
    }
    disc(c,3.40,3.0,.25,"#947960");
    // Restore the part of the city map's roadside palm that the new concrete covers.
    c.save();c.beginPath();c.rect(-5.925,-11.70,11.15,22.6);c.clip();
    c.translate(3.40,3.0);c.scale(1,-1);c.rotate(.8+Math.sin(-81.4-21)*2);
    for(let j=0;j<6;j++){
      c.rotate(Math.PI/3);c.fillStyle=j%2?"#537967":"#6d9475";
      c.beginPath();c.moveTo(0,0);c.lineTo(.53,.75);c.lineTo(.29,1.72);
      c.lineTo(0,2.7+(j%2)*.55);c.lineTo(-.23,.99);c.closePath();c.fill();
    }
    c.restore();
    c.fillStyle="#e8d7b3";c.textAlign="center";c.font="bold 0.52px sans-serif";c.fillText("TOW",0,8.70);
  }
  function benchPlan(c,n){
    rect(c,-2.36,-1.05,4.72,1.02,"#626e63");
    rect(c,-2.32,-1.01,4.64,.88,"#c0b196");
    rect(c,-2.40,-.17,4.79,.177,teal);rect(c,-2.3,-1.02,4.6,.055,pale);
    rect(c,-1.995,-.81,.969,.55,ink);rect(c,-1.946,-.775,.874,.47,"#849885");
    for(let i=0;i<6;i++)rect(c,-1.89+i*.067,-.729,.021,.326,"#536b5e");
    rect(c,-1.443,-.704,.255,.132,ochre);trace(c,[[-1.84,-.25],[-1.99,.25]],steel,.024);
    rect(c,-.351,-1.008,.456,.26,teal);disc(c,-.118,-.919,.135,steel);disc(c,-.118,-.919,.046,ochre);
    rect(c,.447,-.7,.407,.216,rust);
    disc(c,-2.813,-.34,.302,"#7c8b7a");disc(c,-2.813,-.34,.233,"#8c9987");rect(c,-3.0,-.352,.37,.03,ink);
    for(let i=0;i<Math.min(stock.length,n);i++){
      const x=.7+(i%3)*.50+(i<3?0:.08);rect(c,x-.17,-.27-(i<3?0:.08),.34,.17,stock[i]);
      rect(c,x-.06,-.16-(i<3?0:.08),.10,.036,ink);
    }
    if(n>0){rect(c,1.597,-.462,.46,.16,ink);rect(c,1.624,-.422,.41,.102,pale);}
    if(n>1){disc(c,1.36,-.705,.195,"#7a8b79");disc(c,1.36,-.705,.051,ochre);}
    if(n>2)trace(c,[[1.81,-.78],[1.79,-.57],[2.13,-.57],[2.20,-.67],[2.13,-.78],[1.95,-.78]],rubber,.048);
    rect(c,-6.88,-2.94,.12,2.94,teal);rect(c,-6.91,-2.92,.19,2.16,cream);
  }
  function groundMap(c,opt,px,py,s,visible){
    if(opt.mode!=="street")return;
    if(visible(px(yard.drop.x),py(yard.drop.z),15*s)){
      mapAt(c,{x:yard.drop.x,z:yard.drop.z},px,py,s,apronPlan);
      mapAt(c,yard.bench,px,py,s,ctx=>benchPlan(ctx,opt.recovery?.completed||0));
    }
    for(const p of opt.recovery?.people||[]){
      if(p.phase!=="waiting"||!p.car)continue;
      const q=triangleAt(p);if(!visible(px(q.x),py(q.z),2*s))continue;
      mapAt(c,q,px,py,s,ctx=>{rect(ctx,-.37,-.087,.74,.17,rubber);rect(ctx,-.28,-.049,.56,.095,"#dc9566");});
    }
  }
  function hookIcon(c,x,y,r){
    c.save();c.translate(x,y);c.scale(r,r);
    disc(c,0,0,1.0,"#344f4a");disc(c,0,0,.795,"#63847b");
    trace(c,[[-.07,-.50],[-.07,-.17],[.17,.04],[.22,.25],[.09,.42],[-.14,.46],[-.33,.31],[-.35,.116]],"#f2d5a4",.152);
    trace(c,[[-.25,-.50],[.095,-.50]],"#efe2bb",.106);disc(c,.40,-.38,.114,ochre);
    c.restore();
  }
  function mapOwner(c,p,t){
    const [skin,shirt,pants]=colors[p.id],swing=(p.motion?.weight||0)*Math.cos((p.motion?.phase||0)*Math.PI*2);
    const della=p.id==="della",iona=p.id==="iona",rafa=p.id==="rafa",liv=p.id==="liv";
    if(seated(p)){
      disc(c,0,-.045,.129,skin);disc(c,0,-.008,.100,della||liv?"#4d4b41":iona?"#c0866e":"#7e7761");return;
    }
    c.fillStyle="rgba(62,72,60,.27)";c.beginPath();c.ellipse(.042,.058,.29,.24,0,0,Math.PI*2);c.fill();
    for(const side of [-1,1]){
      const step=side*swing;
      trace(c,[[side*.084,.026],[side*.112,.068+step*.23]],pants,.126);
      trace(c,[[side*.112,.067+step*.23],[side*.112,.011+step*.23]],"#626b61",.129);
    }
    c.beginPath();c.ellipse(0,.012,.26,.142,0,0,Math.PI*2);c.fillStyle=shirt;c.fill();
    const waiting=p.phase==="waiting",working=della&&(p.phase==="repair"||p.phase==="bench");
    for(const side of [-1,1]){
      let x=side*.331,y=-.061+side*swing*.132;
      if(working){x=side*.173+(side>0?.085*Math.sin(t*2.6):.024*Math.sin(t*1.8));y=side>0?-.335:-.265;}
      else if(p.phase==="home"){x=side<0?-.148:-.035+.032*Math.sin(t*2);y=side<0?-.17:-.233;}
      else if(waiting){
        if(rafa){x=side*.12;y=side<0?-.231:-.291;}
        else if(side>0){const wave=liftWave(t,iona?2.4:.4);x+=wave*(.13+.034*Math.sin(7.9*t));y-=wave*.18;}
      }
      trace(c,[[side*.21,.012],[side*.275,.009],[x,y]],shirt,.094);disc(c,x,y,.049,skin);
      if(side<0){
        if(iona){
          rect(c,x-.116,y-.133,.228,.254,"#7c795e");rect(c,x-.097,y-.111,.193,.21,"#698b7d");
          rect(c,x-.092,y-.051,.182,.03,ochre);
        }else if(rafa){
          rect(c,x-.085,y-.133,.19,.228,"#997557");rect(c,x-.066,y-.11,.154,.17,"#c8bb97");
          trace(c,[[x-.07,y-.073],[x-.117,y-.27]],steel,.017);
          for(let k=0;k<3;k++)rect(c,x-.043+k*.032,y-.08,.011,.085,ink);
        }else if(liv){
          for(const [u,v] of [[-.044,-.09],[.060,.070]]){
            trace(c,[[x,y],[x+u,y+v]],pale,.017);rect(c,x+u-.047,y+v-.086,.101,.17,"#cfb99c");
            rect(c,x+u-.053,y+v-.015,.109,.028,"#54817e");disc(c,x+u+.048,y+v+.058,.025,rust);
          }
        }else trace(c,[[x,y],[x-.036,y+.096],[x-.077,y+.126]],"#ba7961",.078);
      }else if(della){
        const a=working?wrenchAngle(t):-.20;
        trace(c,[[x,y],[x+.18*Math.sin(a),y-.18*Math.cos(a)]],steel,.031);
        disc(c,x+.18*Math.sin(a),y-.18*Math.cos(a),.031,pale);
      }else if(iona)trace(c,[[x,y],[x+.025,y-.109]],"#9d7b56",.025);
    }
    disc(c,0,-.027,.149,skin);disc(c,-.006,.002,.14,"#5f4e40");
    if(della||iona){
      if(della)disc(c,-.056,.093,.084,"#51463a");
      trace(c,[[-.126,.03],[-.13,-.052],[-.08,-.113],[.042,-.145],[.124,-.068]],della?"#b37e62":"#be836b",.058);
      trace(c,[[-.1,.018],[-.18,.085],[-.185,.057]],della?"#c18c6c":"#d59573",.038);
      if(iona)disc(c,-.006,-.012,.096,"#bd836c");
    }else if(rafa){
      disc(c,-.019,.005,.122,"#827a66");
      for(const side of [-1,1])trace(c,[[side*.022,-.146],[side*.078,-.141]],"#746d56",.022);
    }else{
      disc(c,.02,.137,.068,"#715743");trace(c,[[-.099,-.094],[.011,-.163],[.113,-.087]],teal,.048);
      rect(c,-.111,-.194,.221,.060,"#dac398");
    }
  }
  function map(c,opt,px,py,s,visible){
    const service=opt.recovery,street=opt.mode==="street",radar=opt.mode==="radar",b=yard.drop;
    if(!street){
      const ui=Math.min(c.canvas.width,c.canvas.height)/(radar?165:370);
      if(visible(px(b.x),py(b.z),10*ui))hookIcon(c,px(b.x),py(b.z),(radar?5.1:5.35)*ui);
      const p=service?.call?.p;
      if(p?.phase==="waiting"&&p.car&&visible(px(p.car.x),py(p.car.z),6*ui)){
        const x=px(p.car.x),y=py(p.car.z),r=3.2*ui;
        trace(c,[[x-r,y+.66*r],[x,y-r],[x+r,y+.66*r],[x-r,y+.66*r]],"#593f36",2.3*ui);
        trace(c,[[x-r,y+.66*r],[x,y-r],[x+r,y+.66*r],[x-r,y+.66*r]],"#f3bb79",1.15*ui);
      }
      return;
    }
    const t=opt.elapsed??opt.time??0,scale=Math.max(2.3,1.42*s);
    const draw=p=>{
      if(!p||!colors[p.id]||!visible(px(p.x),py(p.z),3*s))return;
      mapAt(c,p,px,py,seated(p)?s:scale,ctx=>mapOwner(ctx,p,t));
    };
    draw(service?.della);for(const p of service?.people||[])draw(p);
  }
  window.BayRecoveryArt={install,world,ground,groundMap,map,dress,pose,yard,people,colors,roles,blocks};
})();
