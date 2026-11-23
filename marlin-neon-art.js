/* Vera's glass shop and the five live circuits on the Marlin's two signs. */
(() => {
  "use strict";
  const anchor={x:130.25,z:-45},blade={x:132.45,z:-11.15},bench={x:133,z:-55.6,y:.076,yaw:0};
  const board={x:126.65,z:-45,y:12.07,yaw:Math.PI/2};
  const tau=Math.PI*2,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const cream="#e7d4ad",brass="#c1a070",ink="#454844",iron="#475d5b",fern="#668b7d";
  const enamel="#adc4ae",salmon="#bd7d6d",plum="#625259",skin="#ad795c",amber="#e3b46d";
  const palette={tide:["#58dec8","#f6d189"],coral:["#fc8c76","#ffdc9c"],midnight:["#a099ff","#67dbe0"]};
  const lower=(a,b,t)=>a+(b-a)*t;
  function tint(a,b,t){
    let n=0;const l=parseInt(a.slice(1),16),r=parseInt(b.slice(1),16);
    for(const shift of [16,8,0])n|=Math.round(lower(l>>shift&255,r>>shift&255,t))<<shift;
    return "#"+(n>>>0).toString(16).padStart(6,"0");
  }
  const face=z=>(x,y)=>[x,y,z],floor=y=>(x,z)=>[x,y,z];
  const plane=(x0,y0,z0,ux,uy,uz,vx,vy,vz)=>(u,v)=>[x0+ux*u+vx*v,y0+uy*u+vy*v,z0+uz*u+vz*v];
  function rect(g,p,x,y,w,h,color){
    g.quad(p(x-w/2,y-h/2),p(x+w/2,y-h/2),p(x+w/2,y+h/2),p(x-w/2,y+h/2),color);
  }
  function stroke(g,p,line,w,c){
    for(let i=1;i<line.length;i++){
      const a=line[i-1],b=line[i],dx=b[0]-a[0],dy=b[1]-a[1],f=w/(2*Math.max(.0001,Math.hypot(dx,dy)));
      const nx=-dy*f,ny=dx*f,ox=dx*f*.54,oy=dy*f*.54;
      g.quad(p(a[0]-ox+nx,a[1]-oy+ny),p(b[0]+ox+nx,b[1]+oy+ny),
        p(b[0]+ox-nx,b[1]+oy-ny),p(a[0]-ox-nx,a[1]-oy-ny),c);
    }
  }
  function oval(g,p,x,y,rx,ry,c,n=10){
    for(let i=0;i<n;i++){const a=i*tau/n,b=(i+1)*tau/n;
      g.tri(p(x,y),p(x+rx*Math.cos(a),y+ry*Math.sin(a)),p(x+rx*Math.cos(b),y+ry*Math.sin(b)),c);}
  }
  function socket(g,p,x,y,r,col){
    // Octagonal pressed reflector, with one facet catching the afternoon light.
    const rim=[[1,.41],[.41,1],[-.41,1],[-1,.41],[-1,-.41],[-.41,-1],[.41,-1],[1,-.41]];
    const points=rim.map(([a,b])=>p(x+r*a,y+r*b));
    for(let i=1;i<7;i++)g.tri(points[0],points[i],points[i+1],col);
  }
  const lettering={
    A:[[[0,0],[.45,1],[.9,0]],[[.16,.37],[.72,.37]]],
    B:[[[0,0],[0,1],[.52,1],[.73,.80],[.63,.57],[0,.5],[.56,.5],[.8,.32],[.68,.09],[.49,0],[0,0]]],
    C:[[[.8,.88],[.55,1],[.2,.93],[0,.74],[0,.22],[.2,.03],[.58,0],[.8,.16]]],
    E:[[[.78,1],[0,1],[0,0],[.78,0]],[[0,.52],[.59,.52]]],
    G:[[[.79,.88],[.51,1],[.18,.93],[0,.69],[0,.23],[.21,.03],[.59,0],[.82,.19],[.82,.43],[.48,.43]]],
    I:[[[.09,1],[.67,1]],[[.38,1],[.38,0]],[[.08,0],[.68,0]]],
    K:[[[0,0],[0,1]],[[.76,1],[.04,.46],[.8,0]]],
    L:[[[0,1],[0,0],[.76,0]]],
    M:[[[0,0],[0,1],[.46,.46],[.91,1],[.91,0]]],
    N:[[[0,0],[0,1],[.77,0],[.77,1]]],
    O:[[[.22,0],[0,.21],[0,.77],[.21,1],[.58,1],[.8,.78],[.8,.21],[.59,0],[.22,0]]],
    P:[[[0,0],[0,1],[.54,1],[.78,.81],[.75,.59],[.52,.44],[0,.44]]],
    R:[[[0,0],[0,1],[.53,1],[.78,.81],[.75,.62],[.52,.47],[0,.47]],[[.43,.47],[.84,0]]],
    S:[[[.76,.91],[.53,1],[.19,.97],[0,.80],[.08,.61],[.66,.4],[.8,.22],[.68,.05],[.37,0],[.04,.1]]],
    T:[[[0,1],[.87,1]],[[.435,1],[.435,0]]],
    U:[[[0,1],[0,.24],[.17,.05],[.45,0],[.69,.08],[.79,.25],[.79,1]]],
    V:[[[0,1],[.43,0],[.86,1]]],
    W:[[[0,1],[.18,0],[.47,.55],[.76,0],[.94,1]]]
  };
  function label(g,p,str,cx,y,size,color){
    const step=1.15*size,origin=cx-(str.length-1)*step/2-size*.4;
    for(let i=0;i<str.length;i++)for(const path of lettering[str[i]]||[]){
      stroke(g,p,path.map(([u,v])=>[origin+i*step+size*u,y+v*size]),size*.117,color);
    }
  }
  const tubeLetters=[
    [[[-.53,-.43],[-.53,.44],[-.45,.48],[-.03,-.08],[.06,-.08],[.46,.48],[.53,.44],[.53,-.43]]],
    [[[-.13,-.45],[-.35,-.38],[-.46,-.22],[-.46,.22],[-.33,.38],[-.12,.45],[.16,.45],[.35,.36],[.45,.19],[.45,-.22],[.34,-.38],[.14,-.45],[-.13,-.45]]],
    [[[-.53,.43],[.53,.43]],[[-.015,.41],[-.015,-.44]]],
    [[[.43,.43],[-.39,.43],[-.42,.39],[-.42,-.40],[-.38,-.44],[.43,-.44]],[[-.39,.012],[.22,.012]]],
    [[[-.39,.45],[-.39,-.40],[-.35,-.44],[.45,-.44]]]
  ];
  const edge=[[-3.67,5.37],[-3.78,7.91],[-2.92,8.26],[2.64,8.07],[3.78,7.03],[3.29,5.30],[-2.59,4.79]];
  const ex=blade.x-anchor.x,ez=blade.z-anchor.z;
  const marquee=(side,depth)=>(u,y)=>[ex+side*u,y,ez-side*depth];
  const tower=(offset)=>(u,y)=>[offset,y,u];
  const reverse=(offset)=>(u,y)=>[-2.267-offset,y,-u];
  const rod=(c,u,v,sx,sy)=>c.map(([a,b])=>[u+a*sx,v+b*sy]);
  const bulbRing=[];
  edge.forEach((a,i)=>{
    const b=edge[(i+1)%edge.length],length=Math.hypot(b[0]-a[0],b[1]-a[1]),n=Math.max(2,Math.round(length/.62));
    for(let j=0;j<n;j++){const t=(j+.40)/n;bulbRing.push([.966*lower(a[0],b[0],t),6.55+.901*(lower(a[1],b[1],t)-6.55)]);}
  });
  const trim=(i)=>[i,i+1].map(k=>{const p=edge[k%edge.length];return [p[0]*.932,6.55+(p[1]-6.55)*.842];});
  // Painted fish, sun and script stay exposed between the hardware. The tubes follow the bill and tail.
  const fins=[
    [[-1.49,7.57],[-2.16,8.00],[-1.96,7.49]], [[-2.11,7.44],[-2.30,7.04],[-1.44,7.55]],
    [[-.72,8.17],[-.50,8.94],[-.28,9.17]], [[-.91,7.79],[.03,8.16],[.74,8.42]],
    [[.86,8.43],[1.23,8.46],[2.4,8.82]]
  ];
  const pinX=i=>(i-2)*.188;
  const consoleLocal=(x,y,z)=>[board.x-anchor.x-z,board.y+y,board.z-anchor.z+x];
  const witness=(i,depth)=>plane(...consoleLocal(pinX(i),.993+depth,.012),0,0,1,-.936,.351,0);
  function lamps(g,i,colors,brilliance,hardware=false){
    const off=hardware,front=tower(off?.031:.039),back=reverse(off?.019:.026);
    const hue=off?"#575654":tint("#5c5650",colors[0],brilliance),warm=off?"#615950":tint("#6e6253",colors[1],brilliance);
    const core=off?"#818276":tint(hue,"#fff2d0",.46*brilliance),spark=off?"#948876":tint(warm,"#fff4cd",.57*brilliance);
    for(const line of tubeLetters[i]){
      const frontPath=rod(line,0,16.04-i*1.18,1.34,1),backPath=rod(line,0,16.74-i*.76,1.06,.65);
      stroke(g,front,frontPath,off?.17:.116,hue);stroke(g,back,backPath,off?.115:.074,hue);
      if(!off){stroke(g,tower(.041),frontPath,.043,core);stroke(g,reverse(.028),backPath,.032,core);}
    }
    for(const side of [-1,1]){
      const p=marquee(side,off?.355:.377);
      for(let j=i;j<bulbRing.length;j+=5){
        const [u,y]=bulbRing[j];
        socket(g,p,u,y,off?.113:.079,j%3?warm:hue);
        if(!off)socket(g,marquee(side,.379),u-.012,y+.012,.030,j%3?spark:core);
      }
      for(let j=i;j<edge.length;j+=5)stroke(g,p,trim(j),off?.056:.037,hue);
      stroke(g,marquee(side,off?.375:.383),fins[i],off?.080:.048,jadeInk(i,warm,hue));
    }
    socket(g,witness(i,off?0:.006),0,0,off?.058:.04,off?iron:hue);
    if(!off)socket(g,witness(i,.008),-.006,.004,.018,core);
  }
  function jadeInk(i,warm,hue){return i===2||i===4?warm:hue;}
  function mounts(g){
    const strip=tower(.015);
    rect(g,strip,0,13.62,2.22,6.87,"#34464e");
    rect(g,tower(.020),0,13.61,1.98,6.61,"#304851");
    const rear=reverse(.009);
    rect(g,rear,0,15.23,2.31,4.18,"#56736c");rect(g,reverse(.014),0,15.25,2.15,3.97,"#363f43");
    for(let i=0;i<5;i++){
      const y=16.04-i*1.18;
      for(const u of [-.86,.86]){
        socket(g,strip,u,y,.044,"#a49a85");
        stroke(g,strip,[[u,y-.35],[u,y+.34]],.019,"#59636a");
      }
      lamps(g,i,palette.tide,0,true);
    }
    for(const side of [-1,1]){
      const p=marquee(side,.341);
      for(let i=0;i<bulbRing.length;i+=3){
        const a=bulbRing[i],b=bulbRing[(i+1)%bulbRing.length];stroke(g,p,[a,b],.033,"#8b8573");
      }
    }
  }
  function shopBench(g){
    const wood="#9c795d",boardFace=face(-.361);
    for(const x of [-.85,.85])for(const z of [-.26,.26]){
      g.box(x,.418,z,.078,.78,.078,iron);g.box(x,.065,z,.135,.091,.12,"#644e43");
    }
    for(const z of [-.275,.275])g.box(0,.245,z,1.79,.06,.067,fern);
    g.box(0,.249,0,1.77,.041,.55,"#8c8069");g.box(.37,.386,.025,.67,.23,.40,"#8c6d52");
    for(const x of [.08,.66])g.box(x,.391,-.182,.052,.211,.011,brass);
    g.box(0,.83,0,1.92,.17,.71,fern);g.box(0,.942,0,1.97,.067,.74,wood);
    for(const z of [-.229,-.026,.187])g.box(0,.976,z,1.92,.006,.011,"#78674f");
    rect(g,boardFace,.075,.829,1.05,.138,cream);label(g,face(-.366),"MARLIN NEON",.075,.804,.051,iron);
    // Low backboard with pinned duplicate work slips, grease pencil notes, and a ruled tube rack.
    g.box(0,1.142,.306,1.85,.36,.059,"#759683");g.box(0,1.335,.306,1.88,.04,.081,"#a6aa8a");
    rect(g,face(.273),-.15,1.128,.37,.242,"#d7bd82");
    for(let i=0;i<3;i++){
      const x=.16+i*.203;rect(g,face(.273),x,1.131,.151,.211,i===1?"#d7b89e":"#ddd6b5");
      for(const y of [1.075,1.107,1.14])rect(g,face(.270),x,y,.108,.009,"#8c8d7d");
      socket(g,face(.269),x,1.221,.016,"#977b56");
    }
    label(g,face(.269),"GLASS",-.755,1.222,.043,cream);
    const top=floor(.986);
    rect(g,top,-.48,-.064,.76,.427,"#d7c29b");
    for(const x of [-.75,-.59,-.43,-.27])rect(g,floor(.987),x,-.068,.007,.386,"#b5a481");
    for(const z of [-.20,-.115,-.03,.055])rect(g,floor(.988),-.48,z,.728,.007,"#b5a481");
    const colored=[
      [[-.77,-.13],[-.69,-.15],[-.61,-.13],[-.55,-.06],[-.43,-.06]],
      [[-.73,.085],[-.59,.085],[-.50,.013],[-.39,.013],[-.34,.058],[-.25,.058]],
      [[-.079,-.22],[.03,-.22],[.105,-.13],[.236,-.13],[.36,-.195],[.44,-.195]]
    ];
    ["#c58f82","#88b4a2","#cfb274"].forEach((c,i)=>{
      const points=colored[i];for(let k=1;k<points.length;k++)g.pole([points[k-1][0],1.004,points[k-1][1]],[points[k][0],1.004,points[k][1]],.024,c,6);
      for(const p of [points[0],points.at(-1)])g.box(p[0],1.004,p[1],.051,.044,.043,"#5a5952");
    });
    g.box(.61,1.023,.127,.37,.093,.207,plum);g.box(.61,1.073,.123,.30,.015,.146,"#bca988");
    g.box(.61,1.086,.125,.19,.014,.064,"#586665");g.pole([.56,.997,-.225],[.83,.997,-.142],.017,brass,4);
    g.pole([.57,1.019,-.22],[.48,1.007,-.265],.022,iron,5);
    // The rolling fibre case has metal corners, a telescoping handle and two repair stickers.
    for(const x of [-1.70,-1.36])for(const z of [-.205,.16])g.box(x,.085,z,.10,.14,.09,"#454343");
    g.box(-1.49,.383,-.04,.62,.49,.54,"#795d4f");g.box(-1.49,.656,-.04,.64,.082,.55,"#a37359");
    for(const x of [-1.76,-1.22]){
      g.box(x,.385,-.317,.058,.50,.024,brass);g.box(x,.653,-.319,.065,.07,.027,"#d1b588");
    }
    for(const x of [-1.61,-1.37])g.pole([x,.681,.178],[x,1.10,.21],.016,"#ada997",5);
    g.box(-1.49,1.10,.21,.299,.045,.05,ink);
    rect(g,face(-.316),-1.49,.438,.32,.126,"#cfba89");label(g,face(-.320),"SERVICE",-1.49,.422,.038,iron);
  }
  function rooftopBoard(g){
    for(const x of [-.49,.49]){
      g.box(x,.07,0,.17,.14,.42,"#9c9d8b");g.box(x,.40,0,.075,.65,.075,iron);
    }
    g.box(0,.564,.04,1.10,.18,.42,"#71877c");g.box(0,.755,.018,1.26,.22,.60,fern);
    const slant=(u,v)=>[u,.873+v*.21,-.273+v*.56];
    g.quad(slant(-.65,0),slant(.65,0),slant(.65,1),slant(-.65,1),"#9caf96");
    for(const x of [-.655,.655])g.tri([x,.849,-.29],[x,1.091,.302],[x,.849,.302],iron);
    g.box(0,1.132,.298,1.33,.18,.063,iron);
    rect(g,face(.261),0,1.129,1.14,.126,"#dac9a3");label(g,face(.257),"NEON TEST",0,1.105,.053,ink);
    for(let i=0;i<5;i++){
      const x=pinX(i);g.box(x,.910,-.13,.099,.045,.094,iron);
      g.box(x,.938,-.143,.026,.048,.090,i%2?salmon:cream);
      const tag=(a,b)=>[x+a,.924+b*.35,-.151+b*.90];label(g,tag,"MOTEL"[i],0,0,.036,ink);
    }
    for(const z of [-.208,-.243])g.pole([-.47,.917,z],[.47,.917,z],.009,brass,5);
    // An analog current meter and covered knife switch are still readable at the side of the bank.
    g.box(-.554,.938,-.079,.13,.10,.22,plum);g.box(-.553,.993,-.085,.097,.015,.12,"#e0d5af");
    g.pole([-.551,1.002,-.117],[-.522,1.002,-.061],.006,ink,4);
    g.box(.550,.927,-.131,.118,.071,.122,"#785d50");g.pole([.551,.951,-.14],[.552,1.064,-.105],.018,brass,5);
    g.box(.553,1.070,-.104,.102,.035,.046,"#a97662");
    g.pole([.47,.70,.23],[.54,.159,.41],.027,iron,6);
  }
  function form(g,rings,col,n=10){
    const part=(r,i)=>{const a=tau*i/n;return [r[3]+r[1]*Math.sin(a),r[0],r[4]+r[2]*Math.cos(a)];};
    for(let i=0;i<n;i++){
      for(let j=1;j<rings.length;j++){
        const a=rings[j-1],b=rings[j];g.quad(part(a,i),part(a,i+1),part(b,i+1),part(b,i),col,1.00-.135*(1-Math.cos(tau*i/n+.3)));
      }
      for(const j of [0,rings.length-1]){const r=rings[j];g.tri([r[3],r[0],r[4]],part(r,i),part(r,i+1),col);}
    }
  }
  function veraBody(g){
    form(g,[[.722,.176,.118,0,0],[.851,.187,.130,0,.004],[.935,.165,.113,0,.003]],"#505968");
    form(g,[[.881,.194,.15,0,.016],[1.03,.182,.131,0,.015],[1.25,.20,.138,0,.035],[1.353,.218,.114,0,.034],[1.399,.106,.083,0,.025]],"#708987");
    // Linen collar folds around the neck. One green pocket holds the pencil she uses for the caller slips.
    g.cyl(0,1.401,.027,.075,.081,.11,9,skin);
    g.tri([-.115,1.388,.103],[-.020,1.295,.175],[-.034,1.37,.135],"#b1bcab");
    g.tri([.105,1.388,.11],[.034,1.369,.140],[.028,1.30,.173],"#c0c3ac");
    g.quad([-.086,1.241,.171],[-.19,1.22,.133],[-.173,1.137,.142],[-.096,1.152,.166],"#587977");
    g.pole([-.140,1.215,.15],[-.146,1.264,.155],.008,"#cc9c62",4);
    g.pole([-.164,1.21,.144],[-.154,1.246,.153],.006,"#b36e60",4);
    g.quad([.071,1.24,.177],[.157,1.219,.156],[.151,1.185,.157],[.069,1.20,.177],"#c4b797");
    g.quad([-.007,1.32,.176],[.012,1.32,.176],[.006,.896,.158],[-.011,.896,.158],"#547372");
    for(const y of [1.24,1.14,1.04,.94])g.box(.005,y,.171,.014,.014,.008,"#b5b39c");
    g.box(-.13,.935,.091,.10,.029,.11,"#c3b18a");
    for(const [x,y,z,col] of [[-.133,.945,.132,"#d3c49b"],[.119,.98,.132,"#b47667"],[-.055,1.003,.145,"#d1a78e"]]){
      g.box(x,y,z,.021,.015,.009,col);
    }
    const pouch="#7a6051";
    g.box(.177,.842,-.025,.095,.187,.122,pouch);g.box(.223,.843,-.02,.013,.054,.093,"#ba9d73");
  }
  function veraHead(g){
    form(g,[[-.122,.066,.067,0,.028],[-.067,.110,.098,0,.035],[.016,.123,.116,0,.025],[.101,.126,.117,0,.014],[.145,.098,.080,0,.005]],skin,12);
    form(g,[[.068,.123,.101,0,-.007],[.122,.132,.127,0,-.004],[.184,.105,.100,-.005,-.012],[.215,.049,.056,-.010,-.018]],"#c6c4b2",12);
    g.quad([-.119,.053,.052],[-.087,.03,.081],[-.052,.142,.123],[-.104,.133,.086],"#acae9e");
    g.quad([.076,.116,.113],[.105,.038,.086],[.125,.037,.025],[.116,.124,.071],"#aaa99a");
    form(g,[[.043,.04,.038,-.01,-.128],[.072,.063,.052,-.013,-.143],[.125,.061,.057,-.015,-.137],[.152,.03,.034,-.014,-.124]],"#bbb9aa",9);
    g.pole([-.052,.124,-.140],[.028,.136,-.126],.009,"#b08b58",5);
    for(const side of [-1,1]){
      const x=side*.061,p=face(.144);
      g.quad([x-.038,.034,.14],[x+.038,.034,.14],[x+.032,.071,.14],[x-.031,.073,.14],"#a58d6c");
      stroke(g,p,[[x-.046,.073],[x+.043,.073],[x+.040,.035],[x+.027,.027],[x-.031,.027],[x-.041,.039],[x-.046,.073]],.009,"#dfb56b");
      stroke(g,p,[[x-.021,.048],[x+.017,.049]],.007,"#4f403b");
      g.pole([side*.105,.071,.140],[side*.128,.082,.021],.005,"#c49b67",4);
      g.box(side*.103,-.027,.035,.018,.027,.022,brass);
    }
    g.box(0,.066,.144,.031,.009,.009,"#d7ad72");g.box(0,.016,.15,.038,.045,.028,"#ac7658");
    g.pole([-.029,-.036,.131],[.031,-.033,.131],.006,"#885e4f",4);
    g.pole([-.061,-.007,.131],[-.09,.000,.108],.004,"#a07559",4);
  }
  function arm(g,mode,side){
    const a=[0,0,0],elbow=mode==="shade"?[side*.104,.10,.184]:mode==="work"?[side*.035,-.147,.166]:[side*.019,-.225,.035];
    const wrist=mode==="shade"?[-side*.115,.270,.178]:mode==="work"?[-side*.064,-.296,.312]:[side*.018,-.420,.071];
    const cuff=elbow.map((x,i)=>x+(wrist[i]-x)*.15);
    g.pole(a,elbow,.078,"#718c87",8);g.pole(elbow,cuff,.073,"#a5b5a1",8);
    g.pole(cuff,wrist,.041,skin,7);
    if(mode==="shade"){
      g.box(wrist[0]-side*.035,wrist[1],wrist[2]+.006,.108,.027,.070,skin);
    }else{
      g.box(wrist[0],wrist[1]-.010,wrist[2]+.013,.062,.071,.057,skin);
      if(mode==="work"&&side===1)g.pole([wrist[0],wrist[1]+.014,wrist[2]],[wrist[0]-.02,wrist[1]-.06,wrist[2]+.149],.009,"#c79a70",4);
      if(mode==="carry"){
        g.box(wrist[0],wrist[1]-.117,wrist[2],.118,.166,.074,"#937f61");
        g.box(wrist[0],wrist[1]-.099,wrist[2]+.041,.083,.066,.009,"#ddd4ab");
        g.pole([wrist[0]+.054,wrist[1]-.165,wrist[2]], [wrist[0]+.104,wrist[1]-.221,wrist[2]+.015],.009,"#5a5b52",4);
      }
    }
  }
  function leg(g){
    form(g,[[-.383,.068,.068,0,.012],[-.211,.077,.083,0,.004],[0,.089,.089,0,0]],"#505d69",9);
    form(g,[[-.670,.059,.054,0,-.006],[-.497,.069,.070,0,-.011],[-.355,.069,.071,0,.013]],"#535f69",9);
    g.box(0,-.649,-.005,.14,.048,.135,"#707d81");
    g.box(0,-.708,.016,.143,.112,.205,"#715d4d");
    g.box(0,-.749,.047,.147,.047,.239,"#554d43");
    g.box(0,-.686,.086,.092,.013,.045,"#a38b6e");
  }
  const sideName=(side)=>side===1?"right":"left";
  function veraWorld(list,v,t,near){
    const moving=!!v.moving,watch=v.phase==="watch"||v.phase==="view",working=!moving&&!watch;
    const stride=Number.isFinite(v.stride)?v.stride:Number.isFinite(v.phase)?v.phase:t*4.9;
    const y=v.y??.076,bob=moving?.032*(.5-.5*Math.cos(stride*2)):0,yaw=v.yaw||0,cs=Math.cos(yaw),sn=Math.sin(yaw);
    function add(key,x,h,z,head=yaw,pitch=0){
      list.push(["marlin-"+key,v.x+x*cs+z*sn,y+h+bob,v.z-x*sn+z*cs,head,pitch]);
    }
    if(!near){add("vera-far",0,0,0);return;}
    add("vera-body",0,0,0,yaw,working?-.026:0);
    const aim=watch?Math.atan2(anchor.x-v.x,anchor.z-v.z):yaw;
    const turn=clamp(Math.atan2(Math.sin(aim-yaw),Math.cos(aim-yaw)),-.78,.78);
    add("vera-head",0,1.46,.022,yaw+turn+.042*Math.sin(t*.72),watch?-.17:working?.13+.042*Math.sin(t*1.52):.015);
    for(const side of [-1,1]){
      const swing=moving?side*Math.sin(stride):0,mode=watch&&side===1?"shade":working?"work":side<0?"carry":"down";
      add("vera-arm-"+sideName(side)+"-"+mode,side*.217,1.325,.023,yaw,
        moving?swing*(side<0?.21:.46):working?.062*Math.sin(t*2.13+side):.012*Math.sin(t+side));
      add("vera-leg",side*.088,.772,-.005,yaw,-swing*.45);
    }
  }
  let makeModel=null;const litModels=new Set();
  function install(model){
    if(makeModel!==model)litModels.clear();makeModel=model;
    model("marlin-neon-hardware",mounts);model("marlin-glass-bench",shopBench);model("marlin-test-board",rooftopBoard);
    model("marlin-selector-shoe",g=>{
      g.box(0,0,0,.103,.049,.075,brass);g.pole([0,.014,0],[0,.081,.016],.014,"#9b8466",5);
      g.box(0,.084,.018,.101,.034,.049,salmon);
    });
    model("marlin-vera-body",veraBody);model("marlin-vera-head",veraHead);model("marlin-vera-leg",leg);
    for(const side of [-1,1])for(const mode of (side===1?["shade","down","work"]:["down","carry","work"]))
      model("marlin-vera-arm-"+sideName(side)+"-"+mode,g=>arm(g,mode,side));
    model("marlin-vera-far",g=>{
      g.box(0,.67,0,.30,.66,.21,"#596371");g.box(0,1.112,0,.415,.50,.255,"#768a82");
      g.box(0,1.48,.024,.222,.24,.197,skin);g.box(0,1.602,.005,.23,.103,.209,"#c5c3af");
      g.box(0,1.51,.123,.225,.033,.014,amber);
      for(const side of [-1,1])g.box(side*.087,.245,.008,.12,.40,.162,"#596371");
    });
  }
  function pigments(state){
    const fallback=palette[state.program]||palette.tide;
    return [state.color||fallback[0],state.accent||fallback[1]];
  }
  function circuitModel(i,light,colors){
    // Each circuit includes both roadside faces and the roof pilot. Material variants are uploaded once.
    const band=Math.min(4,Math.max(1,Math.ceil(light*4)));
    const id="marlin-bent-glass/"+colors[0].slice(1)+colors[1].slice(1)+"/"+i+"-"+band;
    if(!litModels.has(id)){
      makeModel(id,g=>lamps(g,i,colors,[0,.25,.51,.77,1][band]));litModels.add(id);
    }
    return id;
  }
  function world(list,see,state,t=0,hours){
    if(!state)return;
    const b=state.bench||bench,c=state.console||board,v=state.vera;
    if(see(anchor,162)||see(blade,152)){
      list.push(["marlin-neon-hardware",anchor.x,0,anchor.z]);
      const colors=pigments(state);
      for(let i=0;i<5;i++){
        const light=clamp(state.lights?.[i]??.9);if(light<.055||!makeModel)continue;
        list.push([circuitModel(i,light,colors),anchor.x,0,anchor.z,0,0,0,.34+.66*light]);
      }
    }
    if(see(b,61))list.push(["marlin-glass-bench",b.x,b.y??.076,b.z,b.yaw||0]);
    if(see(c,68)){
      const yaw=(c.yaw??Math.PI/2)+Math.PI;
      list.push(["marlin-test-board",c.x,c.y??12.07,c.z,yaw]);
      if(see(c,24)){
        const x=pinX(state.testing&&state.shift?state.shift.shoe:0),z=-.225;
        list.push(["marlin-selector-shoe",c.x+x*Math.cos(yaw)+z*Math.sin(yaw),(c.y??12.07)+.939,c.z-x*Math.sin(yaw)+z*Math.cos(yaw),yaw]);
      }
    }
    if(v&&see(v,76))veraWorld(list,v,t,see(v,40));
  }
  function box2(c,x,z,w,d,color){c.fillStyle=color;c.fillRect(x-w/2,z-d/2,w,d);}
  function disc2(c,x,z,rx,rz,col){
    c.beginPath();c.ellipse(x,z,rx,rz,0,0,tau);c.fillStyle=col;c.fill();
  }
  function line2(c,points,w,col){
    c.beginPath();points.forEach(([x,z],i)=>i?c.lineTo(x,z):c.moveTo(x,z));c.lineWidth=w;c.strokeStyle=col;c.stroke();
  }
  function mapBench(c,s){
    box2(c,-.05,.04,2.04,.84,"#7e7767");box2(c,0,0,1.95,.72,"#ad8b69");box2(c,0,.300,1.88,.085,fern);
    box2(c,-.48,-.04,.74,.40,"#d7c29b");box2(c,.61,.13,.36,.20,plum);
    box2(c,-1.49,-.04,.63,.54,"#987055");for(const x of [-1.69,-1.29])box2(c,x,-.04,.035,.53,brass);
    if(s<3.5)return;
    line2(c,[[-.75,.03],[-.61,.04],[-.53,-.05],[-.27,-.05]],.044,"#76a59d");
    line2(c,[[-.12,-.18],[0,-.18],[.10,-.09],[.27,-.09],[.35,-.16]],.044,"#cfad71");
    for(const x of [.15,.35,.55])box2(c,x,.22,.124,.13,cream);
  }
  function mapDesk(c,lights,colors,shoe){
    box2(c,.046,-.057,1.40,.74,"#707e73");box2(c,0,0,1.30,.61,enamel);
    box2(c,0,.267,1.32,.091,iron);box2(c,-.55,-.063,.12,.18,cream);box2(c,.55,-.095,.10,.14,salmon);
    lights.forEach((n,i)=>{box2(c,pinX(i),-.14,.07,.092,iron);
      disc2(c,pinX(i),.03,.058,.058,tint("#4a5552",colors[0],clamp(n)));});
    box2(c,0,-.225,.90,.022,brass);box2(c,pinX(shoe),-.224,.105,.054,salmon);
  }
  function mapVera(c,v,t){
    const moving=v.moving,step=Number.isFinite(v.stride)?v.stride:t*4.9,walk=moving?Math.sin(step)*.126:0;
    disc2(c,.08,-.11,.31,.235,"#72756c");
    for(const side of [-1,1])disc2(c,side*.093,.04+side*walk,.077,.137,"#6d5d4f");
    disc2(c,0,.018,.213,.138,"#668681");disc2(c,0,.034,.128,.116,"#c8c5ae");disc2(c,-.012,-.093,.060,.060,"#adae9f");
    line2(c,[[-.102,.109],[.103,.109]],.021,"#d7ad72");
    const watch=v.phase==="watch"||v.phase==="view";
    line2(c,[[-.185,.01],[-.246,.02-walk],[-.237,.143-walk]],.065,skin);
    if(watch)line2(c,[[.184,.012],[.257,.136],[.072,.163]],.068,skin);
    else line2(c,[[.187,.01],[.235,.021+walk],[.212,.153+walk]],.064,skin);
    if(moving)box2(c,-.236,.116-walk,.113,.11,"#a58c63");
  }
  function map(c,opt,px,py,s,visible){
    const state=opt.neon;if(!state)return;
    const street=opt.mode==="street",atlas=opt.mode==="atlas",colors=pigments(state),lights=state.lights||[.9,.9,.9,.9,.9];
    const b=state.bench||bench,desk=state.console||board;
    function place(p,yaw,f){
      c.save();c.translate(px(p.x),py(p.z));c.rotate(yaw);c.scale(s,-s);f();c.restore();
    }
    if(visible(px(blade.x),py(blade.z),8*s)){
      place(blade,0,()=>{
        const w=street?.18:Math.max(.16,.8/s);
        box2(c,0,0,7.5,.46,"#716459");box2(c,0,.05,7.32,.22,"#ad8d74");
        for(let i=0;i<9;i++){
          const level=clamp(lights[i%5]||0),col=tint("#796a61",i%3?colors[1]:colors[0],level);
          const x=(i-4)*.81;
          line2(c,[[x-.29,-.14],[x+.29,-.14]],w,col);
          if(street&&level>.48)disc2(c,x,.135,.098,.062,tint(col,cream,.32));
        }
      });
    }
    if(visible(px(anchor.x),py(anchor.z),5*s)){
      place({x:129.13,z:-45},0,()=>{
        box2(c,0,0,2.31,3.79,"#729b92");box2(c,-.08,0,1.74,3.04,enamel);
        for(let i=0;i<5;i++){
          const z=1.26-i*.63,col=tint("#4b5c59",colors[0],clamp(lights[i]||0));
          box2(c,1.01,z,.212,.43,col);if(street)box2(c,-.96,z,.126,.31,col);
        }
      });
    }
    if(street&&visible(px(b.x),py(b.z),5*s))place(b,b.yaw||0,()=>mapBench(c,s));
    if(street&&visible(px(desk.x),py(desk.z),3*s))place(desk,(desk.yaw??Math.PI/2)+Math.PI,()=>mapDesk(c,lights,colors,state.testing&&state.shift?state.shift.shoe:0));
    if(street&&state.vera&&visible(px(state.vera.x),py(state.vera.z),3*s))
      place(state.vera,state.vera.yaw||0,()=>mapVera(c,state.vera,opt.time||0));
    // A little bent-glass tube icon at the workbench on the paper map.
    if(atlas&&visible(px(b.x),py(b.z),9)){
      c.save();c.translate(px(b.x),py(b.z));c.beginPath();c.arc(0,0,4.1,0,tau);c.fillStyle=iron;c.fill();
      line2(c,[[-2.3,.6],[-1.36,.6],[-.54,-1.35],[.45,1.2],[1.17,-.22],[2.25,-.22]],.8,cream);c.restore();
    }
  }
  window.BayMarlinNeonArt={install,world,map};
})();
