/* Original street furniture, wardrobe and photographic plate for Last Exposure. */
(() => {
  "use strict";
  const cream = "#f6e3b9", ink = "#263b43", oxide = "#aa4e3e", gold = "#e6a64d";
  const metal = "#a5b5ae", teal = "#527f78", night = "#334d5b", tau = Math.PI * 2;
  const glyphs = {
    A:["010","101","111","101","101"], C:["111","100","100","100","111"],
    D:["110","101","101","101","110"], E:["111","100","110","100","111"],
    F:["111","100","110","100","100"], I:["111","010","010","010","111"],
    L:["100","100","100","100","111"], M:["10001","11011","10101","10001","10001"],
    N:["1001","1101","1011","1001","1001"], O:["111","101","101","101","111"],
    P:["110","101","110","100","100"], R:["110","101","110","101","101"],
    S:["111","100","111","001","111"], T:["111","010","010","010","010"],
    U:["101","101","101","101","111"], "1":["010","110","010","010","111"],
    "4":["101","101","111","001","001"], " ":["00","00","00","00","00"]
  };

  // Both the physical sign and its photograph use the same painted lettering.
  function lettering(text, cx, cy, unit, rect) {
    const letters = Array.from(text, c => glyphs[c]);
    const width = letters.reduce((n, glyph) => n + glyph[0].length + 1, -1);
    let x = cx - width * unit / 2;
    for (const glyph of letters) {
      glyph.forEach((row, y) => {
        for (const span of row.matchAll(/1+/g))
          rect(x + span.index * unit, cy + (y - 2.5) * unit, span[0].length * unit, unit);
      });
      x += (glyph[0].length + 1) * unit;
    }
  }
  function patch(g, plane, x, y, w, h, color) {
    g.quad(plane(x,y),plane(x+w,y),plane(x+w,y+h),plane(x,y+h),color);
  }
  function paintWord(g, plane, text, cx, cy, unit, color) {
    lettering(text,cx,-cy,unit,(x,y,w,h) => patch(g,plane,x,-y-h,w,h,color));
  }

  function dress(g, markPart) {
    markPart?.("body");
    g.quad([-.075,1.431,.115],[-.017,1.401,.124],[-.067,1.336,.126],[-.120,1.396,.12],"#edbd73");
    g.quad([.072,1.431,.116],[.124,1.397,.119],[.086,1.352,.126],[.024,1.405,.124],"#b87c47");
    g.tri([-.017,1.401,.125],[.024,1.405,.125],[.006,1.362,.126],"#996343");
    for (const side of [-1,1]) {
      const a = side * .1, b = -.035 + side * .071;
      g.quad([a-.011,1.424,.119],[a+.011,1.424,.119],
        [b+.009,1.216,.158],[b-.009,1.216,.158],"#474447");
    }
    // A broad diagonal canvas strap holds a satchel low against her hip.
    g.quad([-.153,1.432,.108],[-.113,1.43,.121],[.194,1.011,.134],[.152,1.006,.147],"#8b5440");
    g.quad([-.153,1.432,-.112],[-.113,1.430,-.122],[.179,1.015,-.112],[.14,1.005,-.122],"#99674d");
    g.quad([-.153,1.432,.108],[-.113,1.430,.121],[-.113,1.430,-.122],[-.153,1.432,-.112],"#b78555");
    g.quad([.058,1.149,.140],[.095,1.148,.139],[.104,1.135,.139],[.067,1.136,.141],"#e0b271");
    g.box(.165,.93,.101,.183,.182,.115,"#885246");
    g.box(.165,.986,.116,.194,.087,.114,"#b77250");
    g.box(.165,.954,.176,.161,.012,.007,"#e2b477");
    g.box(.165,.941,.174,.027,.037,.013,"#846240");
    g.box(.165,.945,.181,.018,.013,.007,"#e1c48e");
    g.box(.202,1.032,.121,.046,.018,.041,"#e4d4b0");
    // Rangefinder, film advance, front glass and the small reflected catchlight.
    g.box(-.036,1.18,.151,.186,.10,.063,"#333d42");
    g.box(-.036,1.222,.152,.188,.022,.068,"#c5c9b8");
    g.box(-.100,1.238,.150,.031,.012,.023,"#788989");
    g.box(.019,1.208,.186,.027,.014,.006,"#7ab5ae");
    const cx=-.047, cy=1.177;
    g.pole([cx,cy,.18],[cx,cy,.209],.04,"#899392",8);
    g.pole([cx,cy,.20],[cx,cy,.222],.035,"#29353c",8);
    for(let i=0;i<8;i++){
      const a=i*tau/8,b=(i+1)*tau/8;
      g.tri([cx,cy,.224],[cx+.031*Math.cos(a),cy+.031*Math.sin(a),.224],
        [cx+.031*Math.cos(b),cy+.031*Math.sin(b),.224],i<3?"#638d98":"#364b5a");
    }
    g.box(cx-.01,cy+.012,.225,.012,.006,.003,cream);
    markPart?.("head");
    g.cyl(0,1.65,-.119,.058,.077,.084,8,"#36353c");
    g.cyl(0,1.638,-.139,.069,.061,.022,8,"#c96449");
    g.cyl(0,1.612,-.147,.059,.043,.046,8,"#39353c");
    g.tri([-.02,1.632,-.192],[.005,1.636,-.19],[-.035,1.573,-.207],"#c96449");
    const wrap=[[-.062,.096],[.061,.096],[.1,.054],[.104,-.049],[.064,-.098],[-.066,-.098],[-.104,-.049],[-.10,.054]];
    const edge = ([x,z],dy) => [x,1.704+.048*z+dy,z];
    for(let i=0;i<wrap.length;i++){
      const a=wrap[i], b=wrap[(i+1)%wrap.length];
      g.quad(edge(a,0),edge(b,0),edge(b,-.023),edge(a,-.023),i===1||i===6?"#d78b57":"#c86b51");
    }
    g.tri([.061,1.711,.096],[.091,1.719,.069],[.077,1.674,.087],"#493b3e");
    g.tri([-.103,1.697,-.040],[-.100,1.686,-.074],[-.157,1.666,-.116],"#bb604c");
    for(const side of [-1,1])g.box(.116*side,1.603,-.007,.009,.014,.012,"#f1c980");
  }

  function broadcastVan(g) {
    window.buildBayCar(g,"van","#5a9188");
    for(const side of [-1,1]){
      const flank = layer => (u,y) => [side*(.927-.057*(y-.97)+layer),y,-.96+side*u];
      patch(g,flank(.009),-1.07,1.31,2.14,.65,cream);
      patch(g,flank(.013),-1.07,1.31,2.14,.054,oxide);
      const plane=flank(.017), sx=-.735,sy=1.548;
      for(let i=0;i<7;i++) {
        const a=i*Math.PI/7,b=(i+1)*Math.PI/7;
        g.tri(plane(sx,sy),plane(sx+.184*Math.cos(a),sy+.184*Math.sin(a)),
          plane(sx+.184*Math.cos(b),sy+.184*Math.sin(b)),oxide);
      }
      patch(g,plane,sx-.21,sy-.035,.42,.018,teal);
      patch(g,plane,sx-.14,sy-.071,.28,.014,teal);
      paintWord(g,plane,"SOL FM",.252,1.644,.052,ink);
    }
    for(const side of [-1,1])g.box(side*.55,2.246,-.49,.043,.074,1.66,"#49585e");
    for(const z of [-1.18,.17])g.box(0,2.275,z,1.27,.051,.045,metal);
    g.box(.09,2.33,.25,.54,.14,.42,"#97a9a1");
    for(const x of [-.07,.02,.11,.20])g.box(x,2.403,.25,.023,.008,.27,"#54676c");
    g.box(.02,2.35,-.72,.44,.14,.45,ink);
    g.pole([.02,2.38,-.72],[.05,2.99,-.74],.055,metal,6);
    const dish = (a,r,d) => [.02+.682*r*Math.sin(a)-.731*d,
      2.99+.731*r*Math.sin(a)+.682*d,-.74+r*Math.cos(a)];
    const feed=dish(0,0,.44),r=.515,h=.11;
    for(let i=0;i<12;i++){
      const a=i*tau/12,b=(i+1)*tau/12;
      g.tri(dish(0,0,-.045),dish(a,r,h-.032),dish(b,r,h-.032),"#637b7d");
      g.quad(dish(a,r,h-.032),dish(b,r,h-.032),dish(b,r,h),dish(a,r,h),metal);
      g.tri(dish(0,0,0),dish(a,r,h),dish(b,r,h),i>7?"#f6e8c7":i>3?"#e9d7ae":"#d6c9a7");
      if(i%4===0)g.pole(dish(a,r*.9,h*.86),feed,.011,"#647976",4);
    }
    g.box(feed[0],feed[1],feed[2],.075,.063,.068,"#424e54");
    g.pole([.55,2.28,.29],[.57,2.94,.30],.011,"#5a6a69",4);
    g.box(.57,2.945,.30,.026,.025,.026,gold);
  }

  function filmDrop(g) {
    g.box(0,.055,0,1.24,.11,.90,"#75827f");
    g.box(0,.40,-.044,.61,.67,.52,night);
    g.box(0,.49,.222,.48,.43,.014,"#547079");
    g.box(0,1.16,0,1.04,.91,.70,night);
    g.box(0,1.59,0,1.18,.08,.82,"#577d7d");
    g.box(0,1.78,-.045,1.13,.33,.60,"#29434e");
    g.box(0,1.948,-.045,1.16,.033,.66,gold);
    const face = z => (x,y) => [-x,y,z];
    paintWord(g,face(.259),"CINE LUNA",0,1.786,.028,cream);
    patch(g,face(.356),-.438,.803,.876,.687,"#d7be8e");
    patch(g,face(.36),-.407,.834,.814,.624,"#3b5660");
    paintWord(g,face(.364),"FILM",0,1.355,.033,cream);
    paintWord(g,face(.364),"DROP",0,1.201,.025,gold);
    g.box(0,1.043,.39,.56,.068,.12,"#263740");
    g.box(0,1.080,.412,.635,.035,.131,"#b8ab88");
    patch(g,face(.453),-.146,1.027,.208,.018,"#e8d9b6");
    g.box(-.362,.898,.37,.029,.038,.018,metal);
    for(const y of [.94,1.31])g.box(.494,y,.333,.025,.074,.048,"#909a91");
  }

  function noticePaint(paint) {
    paint(-1.12,1.155,2.24,1.03,cream,.051);
    paint(-1.085,1.19,2.17,.96,oxide,.054);
    paint(-.993,1.248,1.986,.192,cream,.057);
    const word=(text,cy,unit,color) => lettering(text,0,-cy,unit,
      (x,y,w,h) => paint(x,-y-h,w,h,color,.061));
    word("PORT SOL",2.017,.024,cream);
    word("LOT 14",1.722,.077,cream);
    word("PIER SALE",1.345,.026,ink);
    for(const x of [-1.039,1.039])for(const y of [1.232,2.10])
      paint(x-.012,y-.012,.024,.024,"#6c726d",.063);
  }
  function saleNotice(g) {
    for(const x of [-.79,.79]) {
      g.box(x,1.055,-.063,.079,2.11,.087,"#727d74");
      g.box(x,.045,-.063,.255,.09,.25,"#929187");
    }
    g.box(0,1.67,0,2.24,1.03,.094,"#a6a99b");
    noticePaint((x,y,w,h,color,z) => patch(g,(u,v)=>[-u,v,z],x,y,w,h,color));
  }

  function install(model) {
    model("exposure-van",broadcastVan);
    model("exposure-kiosk",filmDrop);
    model("exposure-notice",saleNotice);
  }

  // All four symbols follow the atlas convention: +Z in the world points up the map.
  function drawMap(ctx,kind,x,y,pixelsPerMetre,yaw=0) {
    ctx.save();
    ctx.translate(x,y);
    ctx.rotate(yaw);
    ctx.scale(pixelsPerMetre,pixelsPerMetre);
    const rect=(color,x,y,w,h) => {ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    const oval=(color,x,y,rx,ry,angle=0) => {
      ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,angle,0,tau);ctx.fill();
    };
    if(kind==="van"){
      rect("rgba(33,43,47,.46)",-.88,-1.96,2.20,4.70);
      rect(ink,-1.025,-2.14,2.05,4.52);
      rect("#63968b",-.93,-2.11,1.86,4.43);
      rect(cream,-.90,-.51,1.80,2.69);
      rect("#416572",-.85,-1.53,1.70,.92);
      rect("#9dc6bc",-.67,-1.42,.12,.61);
      for(const sx of [-.70,.65])rect(ink,sx,-.31,.055,1.83);
      oval("#6d7873",.04,.76,.47,.56,-.28);
      oval("#e8d9b6",-.05,.66,.42,.57,-.28);
      rect(ink,-.37,.61,.41,.04);
      rect(oxide,-.42,.576,.082,.11);
      rect("#8ca19a",-.26,-.37,.52,.36);
    } else if(kind==="kiosk"){
      rect("rgba(36,45,49,.4)",-.48,-.35,1.27,.96);
      rect(night,-.62,-.45,1.24,.90);
      rect("#779289",-.49,-.33,.98,.61);
      rect(gold,-.62,-.45,1.24,.082);
      rect(ink,-.28,-.29,.56,.09);
    } else if(kind==="notice"){
      for(const sx of [-.79,.79])rect(ink,sx-.078,-.04,.156,.24);
      rect(ink,-1.12,-.07,2.24,.16);
      rect(oxide,-1.1,-.085,2.2,.072);
      rect(cream,-.86,-.088,1.72,.023);
    } else if(kind==="mara"){
      rect("#b97951",.13,-.08,.14,.22);
      rect(ink,-.13,-.18,.18,.105);
      rect(cream,-.13,-.18,.18,.026);
      oval("#6694a2",-.048,-.175,.039,.029);
      oval("#4a3c41",0,.127,.074,.064);
      rect(oxide,-.061,.118,.12,.022);
    }
    ctx.restore();
  }

  // Coordinates are in a 960 by 540 plate. The parent viewfinder owns cropping and zoom.
  const photoNotice=Object.freeze({x:.61,y:.49,width:.24,height:.196});
  function paintHarbor(c) {
    const rect=(color,x,y,w,h) => {c.fillStyle=color;c.fillRect(x,y,w,h);};
    function poly(color,...coords) {
      c.fillStyle=color;c.beginPath();c.moveTo(coords[0],coords[1]);
      for(let i=2;i<coords.length;i+=2)c.lineTo(coords[i],coords[i+1]);
      c.closePath();c.fill();
    }
    function line(color,width,...coords) {
      c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(coords[0],coords[1]);
      for(let i=2;i<coords.length;i+=2)c.lineTo(coords[i],coords[i+1]);
      c.stroke();
    }
    function circle(color,x,y,r) {
      c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,tau);c.fill();
    }
    const gradient=(y0,y1,stops) => {
      const fill=c.createLinearGradient(0,y0,0,y1);
      for(const [at,color] of stops)fill.addColorStop(at,color);
      return fill;
    };

    rect(gradient(0,309,[[0,"#74989b"],[.36,"#b7b4a0"],[.77,"#e1bd97"],[1,"#eaa77c"]]),0,0,960,314);
    poly("#d2be9e",0,92,59,85,112,86,167,79,217,81,257,78,294,82,251,85,104,91,0,101);
    poly("#e4c2a0",327,131,380,124,415,125,459,120,512,120,552,116,630,117,673,113,731,113,675,120,555,122,459,126);
    circle("#f6d39a",723,195,44);
    rect("#e2bb98",657,210,143,2);
    rect("#deba97",674,218,128,3);
    poly("#c2ac92",0,276,51,266,96,270,141,262,210,269,278,253,302,257,344,248,384,255,
      439,240,507,254,543,249,612,255,674,244,741,251,794,238,853,245,892,240,960,243,960,304,0,304);

    const skyline=[[0,47,19],[50,25,31],[87,18,27],[111,38,16],[166,34,33],[250,25,26],
      [282,21,39],[307,30,21],[377,15,30],[397,33,37],[434,34,26],[478,15,46],[531,42,32],
      [581,12,36],[655,30,18],[721,21,27],[746,44,43],[822,33,38],[877,25,30],[914,50,41]];
    for(const [x,w,h] of skyline)rect("#999e91",x,293-h,w,h);
    for(const x of [188,416,744]){
      line("#969c90",3,x,283,x,235,x+21,223,x+59,231);
      line("#969c90",1.6,x+8,282,x+8,237,x+22,226);
    }
    rect(gradient(291,389,[[0,"#8ca69b"],[.30,"#8faaa1"],[1,"#4c7d7d"]]),0,291,960,112);
    for(let i=0;i<84;i++){
      const x=(i*167+37)%944,y=295+(i*37)%82;
      line(i%4?"#a3b4a4":"#5e8a89",i%3===0?1.4:.8,x,y,x+6+(i*11)%39,y);
    }
    for(let i=0;i<12;i++)line("#cbb99a",1.5,663+(i*29)%76,298+i*3.4,716+(i*19)%87,298+i*3.4);
    for(const [x,y,s] of [[387,101,1],[403,95,.62],[650,131,.68]])
      line("#576b6b",1.6,x-7*s,y-2*s,x-2*s,y-2*s,x,y,x+4*s,y-3*s,x+8*s,y-4*s);

    // A lattice jib, its hanging spreader and the cab all share the same lowering cable.
    const iron="#556b69", rim="#7d8574", shade="#425a59";
    poly("#657873",78,282,97,270,202,271,212,286);
    poly(iron,112,287,135,166,147,165,131,287);
    poly(shade,178,286,161,164,173,165,197,286);
    line(rim,4,126,247,175,199,133,204,169,169);
    line(iron,4,139,167,121,120,133,119,153,163);
    line(iron,4,166,163,145,105,151,104,179,161);
    line(shade,4,122,122,150,104,167,145,133,145,153,111);
    const topA=[135,153],topB=[424,65],lowA=[143,170],lowB=[434,77];
    line(iron,5,...topA,...topB);line(shade,5,...lowA,...lowB);
    for(let i=0;i<11;i++){
      const u=i/11,v=(i+1)/11;
      line(i%2?iron:rim,2.5,topA[0]+(topB[0]-topA[0])*u,topA[1]+(topB[1]-topA[1])*u,
        lowA[0]+(lowB[0]-lowA[0])*v,lowA[1]+(lowB[1]-lowA[1])*v,
        topA[0]+(topB[0]-topA[0])*v,topA[1]+(topB[1]-topA[1])*v);
    }
    line(shade,1.6,150,108,321,96,426,69);
    line(shade,1.6,149,107,84,151,62,166);
    poly(iron,54,162,83,153,124,143,130,151,86,166,63,173);
    poly("#748982",117,156,141,147,165,154,165,171,136,180,117,170);
    poly("#abc1ab",122,157,135,153,136,164,122,166);
    poly("#476662",138,153,150,155,151,166,138,167);
    line(iron,1.2,419,77,419,219,414,226);line(iron,1.3,427,78,427,220,433,226);
    line(shade,3,407,228,437,228);
    rect("#657b72",0,279,240,9);
    poly("#62766c",0,283,241,283,265,297,0,298);
    for(const x of [18,62,203])rect("#5f736c",x,288,8,21);

    // An old lighter sits broadside behind the crossed fender pilings.
    poly("#597671",198,305,223,297,356,296,389,288,375,305,346,313,229,315);
    poly("#92735f",222,309,343,307,374,300,364,308,335,314,236,315);
    rect("#9aab96",248,286,36,11);rect("#617974",254,289,5,4);rect("#617974",263,289,8,4);
    line("#75877a",2,275,286,275,262,279,260);line("#859184",1,275,266,315,293);
    poly("#788c83",565,295,586,290,632,289,653,285,646,294,622,299,576,299);

    poly("#9c9480",0,381,344,331,750,309,960,326,960,540,0,540);
    poly("#a4a08a",0,408,351,340,713,317,960,339,960,365,306,385,0,463);
    poly("#948b79",0,475,381,386,742,354,960,361,960,540,0,540);
    poly("#847e6e",0,533,358,434,841,367,873,368,397,454,139,540,0,540);
    line("#c7b295",3,0,388,343,335,739,314);
    line("#777b6e",1.3,82,540,425,409,713,344);
    line("#7d7e6e",1.1,342,540,595,413,766,353);
    line("#ae9c80",2,0,509,235,444,300,434);
    for(let i=0;i<85;i++){
      const x=(i*163+13)%959,y=397+(i*23)%143;
      line(i%3?"#998e77":"#b09c7e",.9,x,y,x+3+i%7,y-.4);
    }

    function container(x,y,w,h,face,edge) {
      poly(edge,x+w,y,x+w+12,y-5,x+w+12,y+h-4,x+w,y+h);
      rect(face,x,y,w,h);
      for(let u=6;u<w-3;u+=9)line(edge,1.3,x+u,y+3,x+u,y+h-3);
      line("#bbac8e",1.5,x,y+1,x+w,y+1);
    }
    container(-17,271,100,45,"#9c715b","#805d4e");
    container(3,239,73,32,"#929a83","#727d6d");
    container(75,288,91,31,"#768f84","#5f7a71");
    container(94,264,65,24,"#ae8368","#946f58");
    container(-28,311,120,37,"#587b76","#456560");
    line("#516663",6,0,359,121,339,200,329);
    for(const [x,y,h] of [[63,351,22],[138,339,17],[188,332,13]]){
      rect("#5d6960",x,y,7,h);rect("#959280",x+1,y,2,h-2);
    }

    // The right edge is the shadowed loading door of the customs shed.
    poly("#465a56",758,237,960,195,960,343,749,323);
    poly("#6f8176",742,236,959,190,960,203,747,249);
    poly("#7a8c7d",758,247,867,227,867,316,757,325);
    for(let i=0;i<12;i++)line(i%3?"#657c70":"#8d9781",2,760+i*9,247-i*1.65,760+i*9,324-i*.72);
    poly("#485c59",862,232,952,218,952,324,862,315);
    poly("#354d4d",870,238,946,226,946,315,870,312);
    for(let i=0;i<9;i++)line("#516661",1.3,872,243+i*7.3,944,231+i*8.5);
    line("#a69c83",3,868,230,867,315);
    rect("#afa38a",782,269,27,16);rect("#5b6b60",785,273,20,2);rect("#5b6b60",785,279,12,1);
    poly("#798575",742,322,839,315,960,326,960,334,831,321,748,329);

    // Chain links, path and truck shadows are all painted behind the legible notice.
    c.save();
    c.beginPath();c.moveTo(397,260);c.lineTo(761,240);c.lineTo(761,326);c.lineTo(397,366);c.closePath();c.clip();
    for(let i=297;i<872;i+=12){
      line("rgba(71,89,79,.47)",.8,i,242,i+83,364);
      line("rgba(81,94,78,.53)",.8,i,242,i-83,364);
    }
    c.restore();
    for(const [x,y,foot] of [[396,255,368],[478,250,356],[620,242,339],[757,235,327]]){
      line("#51675f",4,x,y,x,foot);line("#909785",1,x-1,y,x-1,foot);
    }
    line("#788779",3,396,261,758,241);
    line("#76877a",2,396,358,758,320);
    poly("#777c6e",496,384,510,387,583,372,565,371);
    poly("#777b6b",657,375,670,377,734,364,719,365);
    for(const [x,y] of [[504,391],[667,380]]){
      rect("#616f66",x-4,278,8,y-278);rect("#9a9e86",x-3,280,2,y-282);
      poly("#878b78",x-9,y,x+6,y-2,x+11,y+1,x-5,y+4);
    }
    const signW=960*photoNotice.width,signH=540*photoNotice.height;
    const signX=960*photoNotice.x,signY=540*photoNotice.y;
    rect("#686c5f",signX-signW/2+3,signY-signH/2+3,signW,signH);
    noticePaint((x,y,w,h,color) => rect(color,signX+x*signW/2.24,signY+(1.67-y-h)*signH/1.03,
      w*signW/2.24,h*signH/1.03));
    // Cropped foreground mooring bollard gives the open pier some physical depth.
    poly("#666f64",0,461,49,457,127,445,169,444,88,468,0,487);
    poly("#344f50",0,405,10,397,32,396,45,405,44,438,58,452,54,461,0,468);
    poly("#526966",0,405,12,399,30,399,40,406,35,412,0,414);
    line("#a4977a",4,0,427,17,425,38,417);line("#4b635e",4,0,434,22,430,39,423);
  }

  let cachedPhoto=null;
  function drawPhoto(ctx,w,h) {
    if(!(w>0&&h>0))return;
    if(!cachedPhoto) {
      const plate=typeof OffscreenCanvas==="function"?new OffscreenCanvas(960,540):
        typeof document!=="undefined"?document.createElement("canvas"):null;
      if(plate){
        plate.width=960;plate.height=540;
        const surface=plate.getContext("2d");
        if(surface){paintHarbor(surface);cachedPhoto=plate;}
      }
    }
    if(cachedPhoto){ctx.drawImage(cachedPhoto,0,0,w,h);return;}
    ctx.save();ctx.scale(w/960,h/540);paintHarbor(ctx);ctx.restore();
  }

  window.BayExposureArt=Object.freeze({
    palette:Object.freeze(["#ab7158","#dfaa54","#4c5267"]),
    photoNotice,saleNotice,install,dress,drawMap,drawPhoto
  });
})();
