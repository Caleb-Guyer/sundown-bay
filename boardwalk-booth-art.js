/* Coast Wheel ticket office, Ocean Drive cycle stands and the people on the pier. */
(() => {
  "use strict";
  const places={
    marlin:{x:155.35,z:-64.2,yaw:0,name:"Marlin bike rack"},
    north:{x:170.7,z:103.5,yaw:0,name:"North Boardwalk bike rack"},
    counter:{x:173.8,z:108.55,yaw:Math.PI,name:"Coast Wheel ticket window"},
    mags:{id:"mags",name:"Mags Duran",x:173.8,z:106.88,yaw:0}
  };
  const booth={x:173.8,z:106.07},pierY=.009;
  const colors={mags:["#a16951","#e3bda2","#425c59"],miri:["#a7755c","#b77c69","#475975"],
    len:["#a47a62","#d0c7aa","#65726c"],fay:["#815640","#91ac82","#986e53"],
    vic:["#b98460","#87799a","#485f6c"]};
  const roles={mags:"local",miri:"local",len:"local",fay:"local",vic:"local"};
  const deep="#284d50",green="#4d8580",sea="#83a99b",red="#ad5c51",clay="#c87d65",
    butter="#e8ce99",paper="#efdcaf",metal="#a2a998",iron="#465053",wood="#a37e5e";
  const stock=["#d88973","#9cb99b","#d6ac66"];
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,t)=>a+(b-a)*t;
  const smooth=(a,b,x)=>{const k=clamp((x-a)/(b-a));return k*k*(3-2*k);};
  const block=(x,z,w,d,top,tag)=>({x,z,w,d,bottom:0,top,streetProp:true,boardwalk:tag});
  const blocks=[
    block(booth.x,104.68,3.48,.17,2.48,"office back"),block(172.13,106.60,.13,1.80,2.43,"office west"),
    block(175.50,106.06,.14,2.78,2.43,"office east"),block(173.81,107.475,3.48,.45,1.06,"ticket counter")
  ];
  for(const p of [places.marlin,places.north])for(const x of [1.19,2.02])
    blocks.push(block(p.x+x,p.z,.11,1.08,.82,"cycle stand"));
  function chain(g,points,r,c,n=5){for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,c,n);}
  function stripe(g,p,x,y,X,Y,w,c){
    const dx=X-x,dy=Y-y,d=Math.hypot(dx,dy)||1,a=-dy*w/(2*d),b=dx*w/(2*d);
    g.quad(p(x+a,y+b),p(X+a,Y+b),p(X-a,Y-b),p(x-a,y-b),c);
  }
  function panel(g,p,l,b,r,t,c){g.quad(p(l,b),p(r,b),p(r,t),p(l,t),c);}
  function disk(g,p,x,y,rx,ry,c,n=10){
    for(let i=0;i<n;i++){
      const a=i*2*Math.PI/n,b=(i+1)*2*Math.PI/n;
      g.tri(p(x,y),p(x+rx*Math.cos(a),y+ry*Math.sin(a)),p(x+rx*Math.cos(b),y+ry*Math.sin(b)),c);
    }
  }
  const lettering={
    A:"04 10 30 44|13 33",B:"04 00 30 41 32 02|32 43 34 04",C:"40 10 01 03 14 44",
    E:"40 00 04 44|02 32",H:"00 04|40 44|02 42",I:"10 30|20 24|14 34",K:"00 04|40 02 44",
    L:"00 04 44",M:"04 00 22 40 44",N:"04 00 44 40",O:"10 30 41 43 34 14 03 01 10",
    P:"04 00 30 41 32 02",R:"04 00 30 41 32 02|22 44",S:"40 10 01 02 32 43 34 04",
    T:"00 40|20 24",W:"00 14 22 34 40"
  };
  const strokes={};
  for(const [k,lines] of Object.entries(lettering))strokes[k]=lines.split("|").map(line=>
    line.split(" ").map(pair=>[Number(pair[0])*.25,1-Number(pair[1])*.25]));
  function label(g,p,word,cx,y,h,c){
    const w=h*.63,advance=h*.86;let x=cx-(advance*(word.length-1)+w)*.5;
    for(const ch of word){
      for(const stroke of strokes[ch]||[])for(let i=1;i<stroke.length;i++){
        const a=stroke[i-1],b=stroke[i];stripe(g,p,x+a[0]*w,y+a[1]*h,x+b[0]*w,y+b[1]*h,h*.108,c);
      }
      x+=advance;
    }
  }
  const north=z=>(u,y)=>[-u,y,z],south=z=>(u,y)=>[u,y,z],ground=y=>(x,z)=>[x,y,z];
  function stand(g,isPier){
    const enamel=isPier?green:red;
    // Both arches leave the cycle's line of travel open; cast feet bolt to the existing paving.
    for(const x of [1.19,2.02]){
      for(const z of [-.47,.47]){
        g.box(x,.027,z,.20,.046,.18,"#898d82");
        for(const u of [-.063,.063])g.cyl(x+u,.053,z,.012,.014,.012,6,iron);
      }
      const path=[[-.47,.043],[-.47,.58],[-.435,.70],[-.345,.78],[-.215,.807],[.215,.807],[.345,.78],[.435,.70],[.47,.58],[.47,.043]];
      chain(g,path.map(([z,y])=>[x,y,z]),.039,enamel,7);
      for(const z of [-.47,.47])g.pole([x,.07,z],[x,.222,z],.041,metal,7);
      g.pole([x,.485,-.445],[x,.485,.445],.021,enamel,6);
    }
    // The wordmark and cycle pictogram are recessed into the second hoop.
    g.box(2.02,.608,0,.048,.204,.71,deep);
    const outer=(u,v)=>[2.047,v,u],inner=(u,v)=>[1.993,v,-u];
    for(const f of [outer,inner]){
      label(g,f,isPier?"PIER":"MARLIN",0,.567,isPier?.104:.097,paper);
      for(const x of [-.315,.315])disk(g,f,x,.61,.011,.011,metal,6);
    }
    const floor=ground(.006);
    for(const side of [-1,1]){
      stripe(g,floor,side*.39,-.95,side*.39,-.69,.040,"#d3c7a7");
      stripe(g,floor,side*.39,-.95,side*.23,-.95,.04,"#d3c7a7");
    }
    const p=(u,y)=>[1.19,y,u];
    for(const z of [-.18,.18]){
      for(let i=0;i<10;i++){
        const a=i*Math.PI/5,b=(i+1)*Math.PI/5;
        stripe(g,p,z+.092*Math.cos(a),.604+.092*Math.sin(a),z+.092*Math.cos(b),.604+.092*Math.sin(b),.013,butter);
      }
    }
    for(const [a,b] of [[[-.18,.604],[-.094,.704]],[[-.094,.704],[.015,.605]],[[.015,.605],[-.18,.604]],
      [[.015,.605],[.121,.718]],[[.121,.718],[.18,.604]],[[.121,.718],[.072,.734]]])
      stripe(g,p,...a,...b,.015,butter);
  }
  function fingerSlots(g){
    const f=north(1.637);
    for(let i=0;i<11;i++)g.box(-1.43+i*.288,.505,1.47,.018,.757,.313,"#559085");
    for(const x of [-1.64,1.64])g.box(x,.52,1.48,.096,.98,.355,sea);
    g.box(.0,.172,1.628,3.37,.105,.036,deep);
    panel(g,f,-.87,.48,.87,.81,"#3f736e");
    label(g,north(1.639),"BOLETOS",0,.556,.17,paper);
    for(const x of [-.787,.787])disk(g,north(1.64),x,.644,.016,.016,"#abb99e",7);
  }
  function pierBoards(fill,mark){
    // A flush timber walk reaches from the promenade to the window and ends just below the ramp.
    const grain=["#b29c7e","#bca58a","#b19c82","#c3aa89","#b9a185","#b6a18a"];
    const strips=[[-7.42,-2.06,-4.08,-.47,5],[-4.08,-3.05,2.89,4.51,23],[-2.74,4.51,-.79,5.05,2]];
    for(const [l,b,r,t,rows] of strips){
      fill(l,b,r,t,"#96846f",0);
      const h=(t-b)/rows;
      for(let row=0;row<rows;row++){
        const z=b+row*h+.012;
        fill(l+.016,z,r-.016,z+h-.023,grain[(row+rows)%grain.length],1);
        if(r-l>4){
          const seam=l+1.19+((row*2.19)%4.67);
          mark(seam,z+.012,seam,z+h-.035,.013,"#9b8b77");
        }
        if(row%3===0){
          const x=l+.27+(row*.43%Math.max(.77,(r-l)*.54));
          mark(x,z+h*.34,x+.33+(row%4)*.106,z+h*.343,.013,"#a18f78");
          mark(l+.09,z+h*.51,l+.107,z+h*.51,.021,"#7c7768");
        }
      }
    }
    // Small worn brass discs mark the first few queue positions.
    for(const [x,z] of [[-.03,2.58],[.92,3.37],[1.92,3.77]]){
      mark(x-.09,z-.116,x+.088,z-.116,.043,"#8e8269");
      mark(x-.059,z-.120,x+.069,z-.120,.017,"#c5b881");
    }
  }
  function office(g){
    pierBoards((l,b,r,t,c,layer)=>panel(g,ground(.021+layer*.003),l,b,r,t,c),
      (x,z,X,Z,w,c)=>stripe(g,ground(.027),x,z,X,Z,w,c));
    g.box(0,.476,1.392,3.48,.934,.432,green);fingerSlots(g);
    g.box(0,1.003,1.411,3.48,.109,.448,"#af8768");
    g.box(0,1.062,1.411,3.50,.033,.456,"#dbb783");
    g.box(0,1.031,1.636,3.50,.056,.023,"#d5be90");
    g.box(0,1.195,-1.39,3.49,2.39,.154,sea);
    for(let i=0;i<15;i++)g.box(-1.64+i*.234,1.20,-1.474,.012,2.29,.010,"#688e85");
    g.box(0,.173,-1.494,3.47,.144,.055,green);
    // A shorter west wall leaves a staff entry and sightlines to the desk through both windows.
    for(const [x,z,len] of [[-1.67,.53,1.80],[1.70,-.01,2.78]]){
      g.box(x,.536,z,.12,1.054,len,sea);g.box(x,1.071,z,.16,.071,len+.04,"#c5a481");
      for(const u of [z-len/2+.05,z+len/2-.05])g.box(x,1.748,u,.117,1.37,.111,green);
    }
    // Plywood cash drawer, frosted back window and the shelf behind Mags.
    g.box(0,.802,-1.20,3.2,.09,.31,wood);
    const back=north(-1.304);
    panel(g,back,-1.02,1.20,1.02,2.05,green);
    for(const x of [-.943,.035]){
      panel(g,back,x,1.275,x+.907,1.98,"#abc1ae");
      stripe(g,north(-1.301),x+.07,1.35,x+.31,1.59,.037,"#c2ccaf");
    }
    for(const u of [-1.2,1.2])g.box(u,1.155,-1.13,.23,.49,.16,"#9b8669");
    g.box(1.12,1.172,1.29,.37,.189,.215,green);
    g.box(1.12,1.279,1.29,.40,.034,.241,deep);
    g.box(1.12,1.16,1.409,.089,.027,.021,metal);
    // Painted wheel medallion faces the road. The wheel spokes and cars are cut in contrasting enamel.
    const outside=south(-1.488);disk(g,outside,0,1.455,.686,.686,green,20);
    const med=south(-1.491);disk(g,med,0,1.455,.638,.638,butter,20);
    const ink=south(-1.495);disk(g,ink,0,1.48,.399,.399,red,16);
    disk(g,south(-1.498),0,1.48,.359,.359,butter,16);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,u=.391*Math.cos(a),v=.391*Math.sin(a);
      stripe(g,south(-1.503),0,1.48,u,1.48+v,.020,green);
      panel(g,south(-1.505),u-.048,1.48+v-.070,u+.048,1.48+v-.013,red);
    }
    stripe(g,south(-1.507),0,1.49,-.223,1.031,.047,deep);stripe(g,south(-1.507),0,1.49,.223,1.031,.047,deep);
    // Corrugated canopy with a candy-striped narrow edge and two-sided roof name.
    g.box(0,2.48,-.005,3.68,.10,3.10,deep);
    g.box(0,2.553,-.005,3.67,.067,3.08,"#b47a63");
    for(let i=0;i<14;i++)g.box(-1.73+i*.267,2.596,-.007,.037,.027,3.06,"#c89478");
    g.box(0,2.497,1.561,3.73,.188,.082,red);
    for(let i=0;i<13;i++){
      const x=-1.745+i*.291;
      g.box(x,2.50,1.606,.130,.168,.013,i%3?"#e1c192":"#d7b589");
    }
    for(const x of [-1.31,1.31])g.box(x,2.69,.54,.091,.35,.087,green);
    g.box(0,2.949,.54,3.33,.565,.115,deep);
    for(const [f,offset] of [[north,.601],[south,.479]]){
      const sign=f(offset);
      panel(g,sign,-1.604,2.716,1.604,3.18,red);
      stripe(g,f(offset+(f===north?.004:-.004)),-1.49,2.757,1.49,2.757,.012,butter);
      label(g,f(offset+(f===north?.006:-.006)),"COAST WHEEL",0,2.815,.267,paper);
    }
    g.box(.995,1.83,1.377,.80,.48,.055,deep);
    g.pole([.666,2.404,1.377],[.666,2.06,1.377],.012,metal,5);
    g.pole([1.324,2.404,1.377],[1.324,2.06,1.377],.012,metal,5);
    label(g,north(1.410),"TICKETS",-.995,1.823,.119,paper);
    stripe(g,north(1.412),-1.219,1.770,-.773,1.770,.012,clay);
    // Roll cradle, ticket strip, ink pad and cast-iron punch stay on the service ledge.
    g.box(-.412,1.086,1.255,.244,.026,.238,iron);
    for(const side of [-1,1])g.box(-.412+side*.097,1.14,1.244,.020,.115,.157,green);
    g.pole([-.519,1.186,1.247],[-.301,1.186,1.247],.021,metal,7);
    g.pole([-.482,1.186,1.247],[-.344,1.186,1.247],.079,butter,12);
    panel(g,ground(1.082),-.41,1.283,-.097,1.434,"#dfb991");
    for(let i=0;i<4;i++)panel(g,ground(1.084),-.32,1.293+i*.036,-.312,1.307+i*.036,"#9e856e");
    g.box(.57,1.092,1.42,.23,.038,.159,"#b18b66");g.box(.57,1.116,1.42,.196,.018,.127,"#664a58");
    g.box(.155,1.094,1.258,.177,.043,.259,iron);
    g.box(.155,1.152,1.319,.146,.112,.093,green);
    g.pole([.067,1.218,1.26],[.243,1.218,1.26],.027,metal,8);
    g.cyl(.155,1.123,1.183,.038,.041,.048,9,metal);
    g.box(-1.21,1.106,1.43,.43,.050,.214,deep);
    g.box(-1.21,1.135,1.43,.39,.015,.169,"#bba989");
  }
  function officeLamps(g){
    for(const f of [1.615,-1.569])for(let i=0;i<10;i++)g.box(-1.61+i*.357,2.446,f,.059,.050,.025,"#ffe0a5");
    g.box(-.27,2.412,1.196,.76,.027,.11,"#f9d6a3");
    for(const [f,z] of [[north,.609],[south,.471]]){
      label(g,f(z),"COAST WHEEL",0,2.815,.267,"#f4dbac");
      for(const u of [-1.538,1.538])for(const y of [2.751,3.137])disk(g,f(z),u,y,.021,.021,"#ffdb9b",8);
    }
  }
  function lever(g){
    g.pole([0,0,0],[0,0,-.215],.014,"#9eaa9e",7);
    g.pole([-.043,0,-.235],[.043,0,-.235],.024,deep,8);
    g.pole([0,0,-.13],[0,-.029,-.13],.014,metal,6);
  }
  function returnedStock(g,i){
    const c=stock[i];
    g.cyl(0,.074,0,.123,.123,.148,11,c);g.cyl(0,.153,0,.114,.113,.008,11,paper);
    g.cyl(0,.159,0,.042,.040,.007,8,"#816a54");
    const tag=north(.126);panel(g,tag,-.080,.037,.080,.109,c);
    for(let j=0;j<=i;j++)disk(g,north(.129),-.052+.043*j,.075,.012,.012,deep,7);
    // Matching time-stamped stub hung on a little brass skewer.
    g.pole([.154,0,.026],[.154,.236,.026],.009,metal,6);
    g.box(.149,.163,.039,.130,.105,.012,c);
    for(let j=0;j<=i;j++)disk(g,north(.047),-.108-.030*j,.158,.008,.008,iron,6);
  }
  function wristTicket(g){
    g.box(0,0,0,.158,.009,.105,"#d59d70");
    panel(g,ground(.006),-.070,-.044,.070,.044,paper);
    stripe(g,ground(.008),-.063,.013,.054,.013,.010,red);
    disk(g,ground(.010),.049,-.021,.010,.010,wood,7);
  }
  function wristband(g,family){
    const c=family?"#d2866e":"#c9ae68",r=.048;
    for(let i=0;i<9;i++){
      const a=i*2*Math.PI/9,b=(i+1)*2*Math.PI/9;
      const point=(angle,z)=>[r*Math.cos(angle),r*1.055*Math.sin(angle),z];
      g.quad(point(a,-.016),point(b,-.016),point(b,.016),point(a,.016),i===2?paper:c);
    }
    g.box(.002,r*1.04,0,.029,.007,.025,butter);
  }
  function slide(g){
    g.box(0,-.006,0,.242,.033,.242,green);
    for(const x of [-.116,.116])g.box(x,.009,0,.012,.035,.242,metal);
    g.box(0,.002,-.116,.226,.027,.010,metal);
    g.box(0,.005,0,.209,.010,.210,"#d4b489");
  }
  function camera(g){
    g.box(0,0,0,.182,.116,.071,iron);
    g.box(0,.047,.001,.179,.027,.075,"#a4a89c");
    g.box(-.056,.065,.002,.048,.023,.043,"#b3afa1");
    g.box(.045,.047,.043,.034,.018,.012,"#c7cabb");
    g.pole([.016,-.008,.032],[.016,-.008,.081],.046,deep,10);
    g.pole([.016,-.008,.078],[.016,-.008,.090],.035,metal,10);
    disk(g,(u,v)=>[u,v,.092],.016,-.008,.030,.030,"#41596a",10);
    disk(g,(u,v)=>[u,v,.094],.005,.003,.007,.007,"#bbd3cb",6);
  }
  function tote(g){
    g.box(0,-.097,0,.266,.196,.146,"#b09061");
    g.box(0,-.192,0,.249,.027,.14,"#937a59");
    g.box(0,.007,0,.270,.018,.151,"#4d756c");
    for(const u of [-.075,-.020,.040,.100])g.box(u,-.09,.075,.019,.175,.008,"#d8c28b");
    for(const z of [-.049,.049])chain(g,[[-.084,.015,z],[-.050,.109,z],[.048,.109,z],[.085,.015,z]],.013,"#705b47",5);
    // A rolled terrycloth towel just visible inside the canvas mouth.
    g.box(-.015,.022,.002,.150,.035,.044,"#d2aa82");
  }
  function program(g){
    // Three panels of a folded wheel brochure. The creases survive both the lap and reading poses.
    const a=[[-.109,.007],[ -.041,.022],[.030,.004],[.106,.018]];
    for(let i=0;i<3;i++){
      const [x,y]=a[i],[X,Y]=a[i+1];
      g.quad([x,y,-.065],[X,Y,-.065],[X,Y,.069],[x,y,.069],i===1?"#d4c79e":paper);
      const at=(u,v)=>[mix(x,X,u),mix(y,Y,u)+.002,v];
      panel(g,at,.13,-.043,.87,-.016,i===0?red:green);
      for(let j=0;j<3;j++)stripe(g,at,.17,.007+j*.017,.79-j*.09,.007+j*.017,.005,"#8d927a");
    }
  }
  const front=(u,y)=>[u,y,.130],back=(u,y)=>[u,y,-.124];
  function glasses(g,c){
    for(const side of [-1,1]){
      g.box(side*.047,1.650,.111,.081,.038,.014,c);
      g.box(side*.047,1.650,.121,.064,.024,.005,"#a6afa2");
      g.box(side*.099,1.655,.043,.011,.011,.132,c);
    }g.box(0,1.658,.117,.022,.008,.012,c);
  }
  function dress(rig,id){
    if(!rig||!colors[id]||rig.boardwalkCostume===id)return;
    const g=new BayMesh(),parts=[];
    const part=(name,side=0)=>parts.push({name,side,first:g.vertices.length/6});
    part("body");
    if(id==="mags"){
      // Waxed green ticket apron, pencil loop, brass nameplate and the tie seen from the back window.
      g.quad(front(-.115,1.335),front(.115,1.335),front(.147,.984),front(-.147,.984),green);
      for(const side of [-1,1]){
        stripe(g,front,side*.123,1.422,side*.089,1.324,.026,deep);
        stripe(g,back,side*.122,1.414,-side*.115,1.014,.025,green);
      }
      panel(g,(u,y)=>[u,y,.134],-.10,1.03,.10,1.128,deep);
      panel(g,(u,y)=>[u,y,.137],-.082,1.045,.085,1.107,"#659084");
      g.box(-.058,1.141,.140,.011,.104,.011,"#d5b063");
      g.box(.058,1.276,.139,.075,.025,.009,butter);
      g.box(.055,1.275,.145,.043,.005,.003,"#907354");
      part("head");g.cyl(0,1.739,-.019,.097,.108,.067,12,"#795348");
      g.cyl(0,1.720,-.015,.110,.110,.029,12,clay);
      g.cyl(.045,1.684,-.114,.060,.052,.067,8,"#795348");
      g.tri([.063,1.694,-.090],[.139,1.708,-.130],[.142,1.669,-.153],clay);
      glasses(g,"#5c5146");
    }else if(id==="miri"){
      for(const side of [-1,1]){
        stripe(g,front,side*.091,1.422,side*.077,1.277,.019,"#534b48");
        stripe(g,back,side*.091,1.422,side*.035,1.390,.020,"#534b48");
        g.tri(front(side*.017,1.415),front(side*.102,1.423),front(side*.072,1.339),"#cf9377");
      }
      stripe(g,front,.004,1.032,.004,1.371,.014,"#966955");
      for(let i=0;i<4;i++)g.box(.005,1.069+i*.067,.139,.010,.010,.007,butter);
      part("head");g.cyl(0,1.745,-.021,.082,.102,.056,10,"#453d3e");
      g.cyl(-.017,1.649,-.110,.068,.055,.101,9,"#483e40");
      g.cyl(-.025,1.582,-.115,.040,.046,.036,8,"#c48a69");
      for(const s of [-1,1])g.box(s*.106,1.604,.020,.014,.026,.016,butter);
    }else if(id==="len"){
      for(const f of [front,back])for(const y of [1.076,1.138,1.199,1.261,1.322])
        stripe(g,f,-.131,y,.131,y,.011,"#92a299");
      for(const side of [-1,1])g.tri(front(0,1.398),front(side*.115,1.417),front(side*.058,1.342),"#a5ae99");
      g.box(.088,1.256,.137,.077,.084,.008,"#bdbaa0");
      part("head");g.cyl(0,1.745,-.009,.076,.113,.091,12,"#344c61");
      g.cyl(0,1.716,-.006,.117,.123,.037,12,"#273c4b");
      g.box(0,1.708,.113,.167,.017,.087,"#354c5b");
      for(const s of [-1,1])g.box(s*.095,1.665,-.034,.022,.065,.095,"#b3a28b");
      g.box(0,1.600,.107,.088,.013,.011,"#a89582");
    }else if(id==="fay"){
      for(const [u,v] of [[-.080,1.350],[.073,1.254],[-.081,1.173],[.069,1.068]]){
        stripe(g,front,u-.018,v-.034,u+.018,v+.036,.009,"#637f60");
        g.tri(front(u-.006,v),front(u-.035,v+.023),front(u-.005,v+.019),"#e1bd76");
        g.tri(front(u+.004,v+.018),front(u+.036,v+.043),front(u+.023,v+.012),"#c0aa71");
      }
      part("head");g.cyl(0,1.747,-.009,.085,.103,.062,11,"#403d38");
      g.cyl(0,1.713,.001,.112,.114,.033,12,"#c8a26b");
      g.box(0,1.703,.112,.199,.018,.113,"#dab67c");
      for(const s of [-1,1])g.cyl(s*.06,1.662,-.089,.049,.042,.093,8,"#4d423b");
    }else{
      for(const f of [front,back]){
        stripe(g,f,-.153,1.231,.153,1.307,.030,"#c39b8c");
        stripe(g,f,-.149,1.204,.149,1.281,.009,"#ccbaa2");
      }
      g.box(-.092,1.312,.135,.070,.054,.008,"#9a899e");
      part("head");g.cyl(0,1.744,-.014,.091,.101,.055,10,"#5e4843");
      g.box(-.038,1.738,.059,.118,.051,.060,"#675049",-.18);
      g.box(.092,1.677,-.003,.019,.053,.082,"#6c5448");
    }
    const rest=new Float32Array(rig.rest.length+g.vertices.length);rest.set(rig.rest);rest.set(g.vertices,rig.rest.length);
    for(let i=0;i<parts.length;i++){
      const p=parts[i],end=parts[i+1]?.first??g.vertices.length/6,limb=rig.sides[p.side===1?1:0];
      for(let j=p.first;j<end;j++)rig.bindings.push(rig.binding(p.name,limb,g.vertices[j*6+1]));
    }
    rig.rest=rest;rig.vertices=rest.slice();rig.lastRevision=-1;rig.boardwalkCostume=id;
  }
  function reach(limb,v,blend=1){
    const root=limb.shoulder,hand=limb.forearm.map(limb.handPivot,limb.hand);
    const dx=mix(hand[0],v[0],blend)-root[0],dy=mix(hand[1],v[1],blend)-root[1],dz=mix(hand[2],v[2],blend)-root[2];
    const dist=Math.max(.001,Math.hypot(dx,dy,dz)),ux=dx/dist,uy=dy/dist,uz=dz/dist;
    const a=limb.arm.length,b=limb.forearm.length,d=Math.max(Math.abs(a-b)+.002,Math.min(a+b-.002,dist));
    const along=(a*a-b*b+d*d)/(2*d),bend=Math.sqrt(Math.max(0,a*a-along*along));
    const px=limb.side*.74,py=-.66,pz=-.32,dot=px*ux+py*uy+pz*uz;
    const ex=px-dot*ux,ey=py-dot*uy,ez=pz-dot*uz,k=bend/(Math.hypot(ex,ey,ez)||1);
    const elbow=limb.elbow;
    elbow[0]=root[0]+ux*along+ex*k;elbow[1]=root[1]+uy*along+ey*k;elbow[2]=root[2]+uz*along+ez*k;
    hand[0]=root[0]+ux*d;hand[1]=root[1]+uy*d;hand[2]=root[2]+uz*d;
    limb.arm.aim(root,elbow);limb.forearm.aim(elbow,hand);
  }
  const seated=p=>clamp(p.motion?.ride?.seat??(p.phase==="ride"?1:0));
  const pickUp=p=>p.phase==="counter"||p.phase==="punch";
  function strokeAt(p,t){
    if(p?.phase!=="punch")return {u:0,angle:.59,slide:0,press:0,transfer:0};
    const u=((p.phaseAge??p.age??t)%2.04)/2.04;
    const press=smooth(.035,.21,u)*(1-smooth(.25,.36,u));
    return {u,angle:mix(.59,.10,press),slide:smooth(.46,.70,u)*(1-smooth(.85,1,u)),press,transfer:smooth(.30,.50,u)};
  }
  function admitted(p,service,t){
    if(p.id==="mags")return false;
    if(p.id==="fay"||p.id==="vic")return true;
    if(!(service?.completed>0))return false;
    if(Number.isInteger(p.boarded))return true;
    if(p.phase==="punch")return strokeAt(service.mags,t).u>.76;
    return p.phase!=="queue"&&p.phase!=="counter";
  }
  function ticketPos(service,t,a){
    const y=mix(1.150,1.121,a.transfer),slide=a.u>.71?1:a.slide;
    const pos=[booth.x+mix(.115,-.188,a.transfer),pierY+y,booth.z+mix(1.182,1.162+.448*slide,a.transfer)];
    const guest=service?.people?.find(p=>p.phase==="punch"&&Math.hypot(p.x-pos[0],p.z-pos[2])<.73);
    if(!guest||a.u<.71)return pos;
    const h=at(guest,guest.mesh?grip(guest,-1):[-.058,1.141,.33]),take=smooth(.71,.85,a.u);
    return [mix(pos[0],h[0],take),mix(pos[1],h[1]-.028,take),mix(pos[2],h[2]-.020,take)];
  }
  function localChest(p,x,y,z){
    if(p.mesh?.chest)return p.mesh.chest.map([x,y,z],[0,0,0]);
    return [x,y-seated(p)*.466,z];
  }
  function cameraAt(p,t){
    const seat=seated(p),waiting=p.phase==="queue"||p.phase==="watch";
    const lift=waiting?smooth(.36,.85,.5+.5*Math.sin(t*.94-.52))*(1-seat):p.phase==="ride"?(p.photo||0)*seat:0;
    return localChest(p,mix(-.012,-.031,lift),mix(1.132,1.622,lift)-seat*.027,
      mix(.174+.020*seat,.173,lift)+lift*.064*(1-lift));
  }
  function grip(p,side){
    const limb=p.mesh?.sides[side===1?1:0];
    return limb?limb.forearm.map(limb.handPivot,[0,0,0]):localChest(p,side*.232,1.027,.075);
  }
  function bagAt(p){
    const v=grip(p,-1),lap=localChest(p,-.077,1.174,.213),s=seated(p);
    return [mix(v[0]-.006,lap[0],s),mix(v[1]-.134,lap[1],s),mix(v[2]+.010,lap[2],s)];
  }
  function pageAt(p,t){
    const walk=p.phase==="walk"||p.phase==="leave"||p.phase==="board",s=seated(p);
    const read=walk?0:.65+.35*Math.sin(t*.75+1.2);
    const side=grip(p,1),lap=localChest(p,.015,1.157+read*.151,.258);
    const f=s+(1-s)*(walk?0:1);
    return {v:[mix(side[0]+.043,lap[0],f),mix(side[1]-.016,lap[1],f),mix(side[2]+.039,lap[2],f)],tilt:mix(-1.24,-.19-.57*read,f)};
  }
  function pose(p,t){
    const rig=p.mesh;if(!rig||!colors[p.id])return false;
    const [left,right]=rig.sides,s=seated(p);
    if(p.id==="mags"){
      const a=strokeAt(p,t),sn=Math.sin(a.angle),cs=Math.cos(a.angle);
      const at=rig.pelvis.map(rig.chest.pivot,rig.pivot);
      rig.chest.place(at,.13+.15*(1-a.transfer)+a.press*.07,-.044*(1-a.transfer));
      for(const limb of rig.sides)rig.chest.map(limb.arm.pivot,limb.shoulder);
      reach(right,[.155,1.220+.235*sn+.018,.45-.235*cs-.007]);
      const follow=a.transfer*(1-smooth(.78,.95,a.u));
      reach(left,[mix(.048,-.179,follow),mix(1.182,1.151,follow),.329+.064*follow*a.slide+.005*Math.cos(1.4*t)]);
      rig.chest.map(rig.head.pivot,at);rig.head.place(at,.12+.15*a.press-.063*a.slide,-.08+.13*a.slide);
    }else if(p.id==="miri"){
      const v=cameraAt(p,t);
      reach(right,[v[0]+.089,v[1]+.018,v[2]-.013],.92);
      if(pickUp(p)&&s<.12)reach(left,[-.058,1.147,.337]);
      else reach(left,[v[0]-.077,v[1]-.011,v[2]+.007],.84);
    }else if(p.id==="len"){
      if(pickUp(p)&&s<.12)reach(left,[-.056,1.139,.34]);
      else if(s>.015){
        reach(left,localChest(p,-.11,1.115,.205),s);reach(right,localChest(p,.115,1.11,.209),s);
      }else if(p.phase==="queue"||p.phase==="watch"){
        const k=smooth(.26,.84,.5+.5*Math.sin(t*.70+1.7));
        reach(left,localChest(p,-.161,1.045+.048*k,.09+.042*k),.82);
        reach(right,localChest(p,.145+.026*k,1.091+.221*k,.128+.052*k),.88);
      }else return false;
    }else if(p.id==="fay"){
      const walk=(p.motion?.weight||0)*Math.cos((p.motion?.phase||0)*2*Math.PI);
      reach(left,localChest(p,mix(-.258,-.139,s),mix(1.044,1.280,s),mix(.061-.052*walk,.207,s)),.96);
      if(s>.01)reach(right,localChest(p,.018,1.199,.231),s);
      else if(p.phase==="watch")reach(right,localChest(p,.167,1.162+.08*Math.sin(t*1.1),.156),.74);
    }else if(p.id==="vic"){
      if(p.phase==="walk"||p.phase==="leave"||p.phase==="board"){
        if(s<.01)return false;
      }
      const a=pageAt(p,t).v;
      reach(left,[a[0]-.091,a[1]+.024,a[2]-.017],.90);reach(right,[a[0]+.089,a[1]+.024,a[2]-.013],.93);
    }
    rig.skin();return true;
  }
  function at(p,v){
    const sn=Math.sin(p.yaw||0),cs=Math.cos(p.yaw||0);
    return [p.x+v[0]*cs+v[2]*sn,(p.y||0)+(p.motion?.lift||0)+v[1],p.z-v[0]*sn+v[2]*cs];
  }
  function cameraCord(list,a,b){
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],d=Math.hypot(dx,dy,dz);
    if(d<.023)return;
    const n=Math.max(1,Math.min(11,Math.round(d/.039)));
    list.push(["boardwalk-camera-cord-"+n,(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2,Math.atan2(dx,dz),-Math.asin(dy/d)]);
  }
  function addWristband(list,p){
    const limb=p.mesh?.sides[0];if(!limb)return;
    const h=limb.forearm.map(limb.handPivot,[0,0,0]),elbow=limb.forearm.map(limb.forearm.pivot,[0,0,0]);
    const a=at(p,elbow),b=at(p,h),dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],d=Math.max(.001,Math.hypot(dx,dy,dz));
    list.push(["boardwalk-band-"+(p.id==="miri"||p.id==="len"?"family":"pier"),
      mix(a[0],b[0],.88),mix(a[1],b[1],.88),mix(a[2],b[2],.88),Math.atan2(dx,dz),-Math.asin(dy/d)]);
  }
  function effects(list,p,t,service){
    if(!p)return;const yaw=p.yaw||0;
    if(admitted(p,service,t))addWristband(list,p);
    if(p.id==="miri"){
      const v=cameraAt(p,t),raise=smooth(1.12,1.58,v[1]+.46*seated(p));
      for(const side of [-1,1]){
        const neck=localChest(p,side*.077,1.277,.133);
        const loose=localChest(p,side*(.092+.032*raise),1.251-.083*raise,.155);
        const ring=[v[0]+side*.083,v[1]+.032,v[2]-.005];
        cameraCord(list,at(p,neck),at(p,loose));cameraCord(list,at(p,loose),at(p,ring));
      }
      list.push(["boardwalk-camera",...at(p,v),yaw]);
    }else if(p.id==="fay"){
      const swing=(p.motion?.weight||0)*Math.cos(2*Math.PI*(p.motion?.phase||0));
      list.push(["boardwalk-tote",...at(p,bagAt(p)),yaw,-.07*swing*(1-seated(p))]);
    }else if(p.id==="vic"){
      const a=pageAt(p,t);list.push(["boardwalk-program",...at(p,a.v),yaw,a.tilt]);
    }
  }
  function install(model){
    model("boardwalk-marlin-rack",g=>stand(g,false));model("boardwalk-north-rack",g=>stand(g,true));
    model("boardwalk-office",office);model("boardwalk-office-lamps",officeLamps);
    model("boardwalk-punch",lever);model("boardwalk-tray",slide);model("boardwalk-ticket",wristTicket);
    model("boardwalk-plunger",g=>{
      g.cyl(0,0,0,.022,.022,.037,8,metal);g.cyl(0,.021,0,.036,.036,.015,8,deep);
    });
    model("boardwalk-band-family",g=>wristband(g,true));model("boardwalk-band-pier",g=>wristband(g,false));
    for(let i=0;i<stock.length;i++)model("boardwalk-roll-"+i,g=>returnedStock(g,i));
    model("boardwalk-camera",camera);model("boardwalk-tote",tote);model("boardwalk-program",program);
    for(let n=1;n<=11;n++)model("boardwalk-camera-cord-"+n,g=>g.pole([0,0,-n*.0195],[0,0,n*.0195],.006,"#594d45",4));
  }
  function world(list,see,t,hours,service){
    if(see(places.marlin,78))list.push(["boardwalk-marlin-rack",places.marlin.x,.077,places.marlin.z]);
    if(see(places.north,78))list.push(["boardwalk-north-rack",places.north.x,pierY,places.north.z]);
    if(see(booth,125)){
      list.push(["boardwalk-office",booth.x,pierY,booth.z],["boardwalk-office-lamps",booth.x,pierY,booth.z,0,0,0,.12+.78*(hours?.night||0)]);
      if(see(booth,57)){
        const a=strokeAt(service?.mags,t);
        list.push(["boardwalk-punch",booth.x+.155,pierY+1.218,booth.z+1.26,0,a.angle]);
        list.push(["boardwalk-plunger",booth.x+.155,pierY+1.205-.034*a.press,booth.z+1.183]);
        const z=booth.z+1.156+.448*a.slide;
        list.push(["boardwalk-tray",booth.x-.188,pierY+1.101,z]);
        list.push(["boardwalk-ticket",...ticketPos(service,t,a)]);
        for(let i=0;i<Math.min(3,service?.completed||0);i++)
          list.push(["boardwalk-roll-"+i,booth.x-.83-i*.26,pierY+1.081,booth.z+1.354]);
      }
    }
    for(const p of service?.people||[])if(see(p,58))effects(list,p,t,service);
  }
  function rect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function ellipse(c,x,y,a,b,color){
    c.beginPath();c.ellipse(x,y,a,b,0,0,2*Math.PI);c.fillStyle=color;c.fill();
  }
  function line(c,pts,color,w){
    c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);
    c.strokeStyle=color;c.lineCap="round";c.lineJoin="round";c.lineWidth=w;c.stroke();
  }
  function planAt(c,p,px,py,s,draw){
    c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw||0);c.scale(s,s);draw(c);c.restore();
  }
  function rackPlan(c,isPier){
    const enamel=isPier?green:red;
    for(const x of [1.19,2.02]){
      for(const z of [-.47,.47]){
        rect(c,x-.10,z-.09,.2,.18,"#8c9787");ellipse(c,x+.055,z,.018,.018,iron);
      }
      line(c,[[x+.087,-.44],[x+.091,.48]],"#9b9986",.075);
      line(c,[[x,-.47],[x,.47]],enamel,.086);line(c,[[x-.014,-.36],[x-.014,.35]],isPier?sea:clay,.023);
    }
    rect(c,1.98,-.35,.079,.7,deep);rect(c,2.015,-.23,.03,.46,paper);
    for(const side of [-1,1])line(c,[[side*.23,.95],[side*.39,.95],[side*.39,.69]],"#dccda7",.046);
  }
  function officeBuilding(c){
    // A cutaway of the roof keeps the real service window, visitors' hands and passage readable from above.
    pierBoards((l,b,r,t,col)=>rect(c,l,-t,r-l,t-b,col),
      (x,z,X,Z,w,col)=>line(c,[[x,-z],[X,-Z]],col,w));
    rect(c,-1.77,-1.656,3.59,3.19,"#c0af8d");rect(c,-1.68,-1.52,3.37,2.97,"#cbbb9a");
    for(let j=0;j<8;j++)line(c,[[-1.61,-1.36+j*.37],[1.64,-1.36+j*.37]],"#b0a384",.022);
    rect(c,-1.725,1.308,3.48,.173,green);
    rect(c,1.637,-1.40,.144,2.80,green);rect(c,-1.74,-1.41,.129,1.80,green);
    for(const x of [-1.70,1.682])rect(c,x,-1.40,.044,1.75,sea);
    rect(c,-1.58,1.066,3.15,.271,wood);rect(c,-1.60,1.047,3.18,.033,butter);
    for(const u of [-1.22,1.22])rect(c,u-.12,1.035,.24,.17,"#918268");
    rect(c,-1.75,-1.637,3.50,.453,"#bc9975");rect(c,-1.75,-1.636,3.50,.059,butter);
    rect(c,-1.41,-1.539,.407,.211,deep);rect(c,-1.382,-1.516,.352,.17,wood);
    rect(c,.933,-1.398,.379,.229,deep);rect(c,.959,-1.366,.324,.172,green);
    rect(c,.488,-1.488,.188,.133,"#66515b");
    rect(c,-.529,-1.377,.237,.198,iron);rect(c,-.489,-1.331,.159,.148,butter);
    rect(c,-.376,-1.372,.247,.105,"#dbb58d");
  }
  let boothPrint;
  function officePlan(c,service,t,night,lowDetail){
    if(lowDetail){
      boothPrint??=BayMapSheet(-7.5,-5.15,10.5,8.35,24,officeBuilding);
      boothPrint(c);
    }else officeBuilding(c);
    const a=strokeAt(service?.mags,t),trayY=-(1.156+.448*a.slide);
    rect(c,-.311,trayY-.122,.244,.244,deep);rect(c,-.291,trayY-.103,.206,.206,"#ceaa7d");
    rect(c,.071,-1.376,.169,.245,iron);
    line(c,[[.155,-1.26],[.155,-1.26+.235*Math.cos(a.angle)]],metal,.035);
    line(c,[[.114,-1.26+.235*Math.cos(a.angle)],[.196,-1.26+.235*Math.cos(a.angle)]],deep,.046);
    const v=ticketPos(service,t,a),u=v[0]-booth.x,z=booth.z-v[2];
    rect(c,u-.079,z-.052,.158,.105,paper);rect(c,u-.065,z-.019,.118,.012,red);
    ellipse(c,.155,-1.183,.032,.033,"#869489");
    for(let i=0;i<Math.min(3,service?.completed||0);i++){
      const u=-.83-i*.26;
      ellipse(c,u,-1.354,.12,.12,stock[i]);ellipse(c,u,-1.354,.092,.092,paper);ellipse(c,u,-1.354,.036,.036,wood);
      rect(c,u+.082,-1.447,.116,.111,stock[i]);
      for(let j=0;j<=i;j++)ellipse(c,u+.111+j*.029,-1.397,.008,.008,iron);
    }
    // Retained strip of the roof over the rear wall carries the painted name and a row of bulbs.
    rect(c,-1.82,1.297,3.64,.24,red);
    for(let i=0;i<12;i++)rect(c,-1.756+i*.306,1.303,.117,.215,"#dab78c");
    rect(c,-1.13,1.034,2.26,.323,deep);
    c.textAlign="center";c.font="bold .223px sans-serif";c.fillStyle=paper;c.fillText("COAST WHEEL",0,1.283);
    if(night>.17)for(let i=0;i<10;i++)ellipse(c,-1.605+i*.356,-1.625,.034,.034,"#ffe0a5");
  }
  function cap(c,id){
    if(id==="mags"){
      ellipse(c,.038,.103,.075,.079,"#765448");ellipse(c,-.005,.025,.119,.122,"#795348");
      line(c,[[-.106,.038],[-.119,-.031],[-.066,-.098],[.024,-.119],[.100,-.066]],clay,.036);
      line(c,[[.073,.056],[.132,.116],[.160,.094]],clay,.026);
    }else if(id==="miri"){
      ellipse(c,-.021,.127,.064,.073,"#4e4140");ellipse(c,-.009,.025,.114,.119,"#493f40");
      line(c,[[-.083,.005],[-.049,-.071],[.038,-.087]],"#67504a",.023);
      ellipse(c,-.012,.134,.022,.017,clay);
    }else if(id==="len"){
      ellipse(c,0,-.082,.104,.089,"#304657");ellipse(c,0,-.004,.127,.118,"#283f50");
      ellipse(c,-.009,.019,.109,.099,"#435a6a");
      line(c,[[-.082,.041],[.003,.066],[.074,.036]],"#5b6c74",.014);
    }else if(id==="fay"){
      ellipse(c,-.012,.056,.108,.099,"#4b403a");ellipse(c,.003,-.069,.124,.102,"#d7b37a");
      ellipse(c,0,.003,.109,.099,"#4d443d");
      line(c,[[-.095,.029],[-.103,-.042],[-.028,-.086],[.069,-.070],[.10,-.032]],"#cfa96f",.029);
    }else{
      ellipse(c,-.008,.014,.113,.114,"#614940");
      line(c,[[-.087,.007],[-.038,-.078],[.063,-.063]],"#82624f",.029);
    }
  }
  function personPlan(c,p,t,service){
    const [skin,shirt,pants]=colors[p.id],s=seated(p);
    const stride=(p.motion?.weight||0)*Math.cos((p.motion?.phase||0)*Math.PI*2),arm=strokeAt(p,t);
    if(s<.92)ellipse(c,.046,.056,.282,.209,"rgba(69,66,55,.21)");
    for(const side of [-1,1]){
      const step=side*stride;
      const foot=mix(.101+step*.218,-.221,s);
      line(c,[[side*.086,.014],[side*.116,foot]],pants,.119);
      line(c,[[side*.111,foot+.012],[side*.111,foot-.067]],"#78817a",.122);
    }
    ellipse(c,0,.015,.241,.135,shirt);
    if(p.id==="mags")rect(c,-.117,-.126,.234,.112,green);
    if(p.id==="miri")for(const k of [-1,1])line(c,[[k*.097,-.05],[k*.067,-.174]],"#62504a",.016);
    if(p.id==="len")for(const y of [-.071,-.021,.036])line(c,[[-.18,y],[.18,y]],"#98a59a",.014);
    if(p.id==="vic")line(c,[[-.174,.07],[.161,-.054]],"#bea18d",.036);
    for(const side of [-1,1]){
      let x=side*.266,y=-.042+side*stride*.156;
      if(p.id==="mags"){
        const follow=arm.transfer*(1-smooth(.78,.95,arm.u));
        x=side>0?.155:mix(.048,-.179,follow);y=side>0?-.45+.235*Math.cos(arm.angle):-.329-.064*follow*arm.slide;
      }
      else if(p.id==="miri"){x=side*.104;y=-.181;if(pickUp(p)&&side<0){x=-.059;y=-.327;}}
      else if(p.id==="vic"&&(!["walk","leave","board"].includes(p.phase)||s>.1)){x=side*.103;y=-.235;}
      else if(p.id==="len"&&pickUp(p)&&side<0){x=-.057;y=-.329;}
      else if(s>.1){x=side*.102;y=-.215;}
      line(c,[[side*.181,.01],[side*.235,-.038],[x,y]],shirt,.099);
      if(side<0&&admitted(p,service,t)){
        const u=mix(side*.235,x,.79),v=mix(-.038,y,.79);
        line(c,[[u-.034,v],[u+.034,v-.006]],p.id==="miri"||p.id==="len"?"#d98a70":"#c7ac69",.035);
      }
      ellipse(c,x,y,.05,.045,skin);
      if(p.id==="fay"&&side<0){
        const X=mix(x-.050,-.066,s),Y=mix(y-.009,-.197,s);
        rect(c,X-.124,Y-.078,.248,.148,"#a48058");rect(c,X-.112,Y-.062,.224,.113,"#c1a06c");
        for(const u of [-.064,.012,.067])rect(c,X+u,Y-.052,.019,.099,butter);
        line(c,[[X-.073,Y],[X-.045,Y+.051],[X+.045,Y+.051],[X+.077,Y]],"#705c43",.016);
      }
    }
    if(p.id==="miri"){
      const v=cameraAt(p,t),u=v[0],y=-v[2]-.035;
      rect(c,u-.085,y-.043,.170,.081,iron);rect(c,u-.079,y+.026,.15,.018,metal);
      rect(c,u-.014,y-.074,.064,.038,deep);rect(c,u-.005,y-.081,.046,.012,"#8caca7");
    }
    if(p.id==="vic"){
      const reading=s>.1||!["walk","leave","board"].includes(p.phase),x=reading?.006:.260,y=reading?-.258:-.067+stride*.144;
      rect(c,x-.102,y-.058,.203,.123,paper);rect(c,x-.038,y-.058,.064,.123,"#d7c39c");
      rect(c,x-.084,y-.039,.040,.024,red);rect(c,x-.02,y-.039,.04,.024,green);
      for(let i=0;i<3;i++)rect(c,x+.046,y-.036+i*.020,.037,.008,"#8e927c");
    }
    ellipse(c,0,-.015,.125,.129,skin);cap(c,p.id);
  }
  function map(c,opt,px,py,s,visible){
    const service=opt.boardwalk;
    if(opt.mode!=="street")return;
    const t=opt.time??opt.elapsed??0,night=opt.weather?.night||0;
    if(visible(px(booth.x),py(booth.z),9*s))planAt(c,booth,px,py,s,ctx=>officePlan(ctx,service,t,night,opt.lowDetail&&s<=16));
    for(const [p,isPier] of [[places.marlin,false],[places.north,true]])
      if(visible(px(p.x),py(p.z),3*s))planAt(c,p,px,py,s,ctx=>rackPlan(ctx,isPier));
    function draw(p){
      if(!p||!colors[p.id])return;
      const projected=p.y>.1&&window.BayCoastWheelArt?.mapPoint?BayCoastWheelArt.mapPoint(p):p;
      if(!visible(px(projected.x),py(projected.z),2*s))return;
      const actorScale=p.id==="mags"||pickUp(p)||seated(p)>.01?s:Math.max(2.3,s*1.37);
      planAt(c,{x:projected.x,z:projected.z,yaw:p.yaw},px,py,actorScale,ctx=>personPlan(ctx,p,t,service));
    }
    draw(service?.mags);for(const p of service?.people||[])draw(p);
  }
  window.BayBoardwalkArt={places,blocks,colors,roles,dress,pose,install,world,map};
})();
