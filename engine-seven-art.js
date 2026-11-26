/* Seabird Engine 7. The short cab leaves a full pump panel ahead of the hose bed. */
(() => {
  "use strict";
  const sides=[-1,1],tau=2*Math.PI;
  const shape={
    paint:"#ac493e",wheel:.462,track:1.025,axles:[-1.86,1.73],divider:.20,
    glass:[.81,.86,2.67,3.015,1.53,2.45,.996,.912],
    sections:[[-3.42,.91,.57],[-3.22,1.035,1.40],[-2.91,1.044,1.47],[-.80,1.044,1.47],
      [-.67,.986,1.45],[.65,.986,1.46],[.77,1.035,1.54],[2.74,1.034,1.53],[3.04,1.008,1.52],[3.22,.910,1.48],[3.42,.92,.64]]
  };
  const shapes={pumper:shape},owns=kind=>kind==="pumper";
  const cockpitStyles={pumper:{trim:"#654d40",top:"#444b45",pad:"#777569",cloth:"#84634d",thread:"#d8c6a3",edge:"#c2c2b4",
    face:"#e7dfbf",ink:"#283e3e",accent:"#bc5442",rim:"#373d39",hub:"#565c52",dash:"work",spokes:3,stamp:"SEABIRD · 7",limit:75}};
  const ivory="#eee1bf",light="#f9edcd",gold="#e1b868",ochre="#a58248",wine="#773c39",
    warmSteel="#b1b3a4",chrome="#d1d2bc",steel="#7a8781",shadeSteel="#566664",ink="#374443",rubber="#292f30",
    glass="#669198",glassDark="#3e6067",glassLight="#86a9a5",redLens="#963f38",whiteLens="#ffefbd",tailLens="#a53a47";
  function fit(s){
    Object.assign(s,{back:.858,hingeZ:2.69,hingeX:1.025,handleZ:1.057,handleY:1.335,handleX:1.052,
      grabX:.856,grabZ:1.25,grabY:1.32,seatX:.51,seatY:1.09,seatZ:1.38,floorY:.61,halfLength:3.42});
  }
  fit(shape);
  function hoodHeight(k,x,z){
    if(z>=3.24)return .646;
    return 1.537-.067*Math.max(0,(z-3.01)/.23)-.027*Math.pow(Math.min(1,Math.abs(x)),2);
  }
  // Faces on an X plane use local Z as horizontal and Y as vertical.
  function sideRect(g,x,z,y,w,h,col){
    g.quad([x,y-h/2,z-w/2],[x,y-h/2,z+w/2],[x,y+h/2,z+w/2],[x,y+h/2,z-w/2],col);
  }
  function endRect(g,z,x,y,w,h,col){
    g.quad([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],col);
  }
  function stroke(g,pt,a,b,w,col){
    const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
    if(length<.0001)return;
    const nx=-dy*w/(2*length),ny=dx*w/(2*length);
    g.quad(pt(a[0]+nx,a[1]+ny),pt(b[0]+nx,b[1]+ny),pt(b[0]-nx,b[1]-ny),pt(a[0]-nx,a[1]-ny),col);
  }
  function disc(g,pt,x,y,r,col,n=12){
    const middle=pt(x,y);let last=pt(x+r,y);
    for(let i=1;i<=n;i++){const a=i*tau/n,p=pt(x+r*Math.cos(a),y+r*Math.sin(a));g.tri(middle,last,p,col);last=p;}
  }
  function seven(g,pt,x,y,h,col){
    const p=(u,v)=>pt(x+(u+.095*v)*h,y+v*h);
    g.quad(p(0,.81),p(.10,1),p(.71,1),p(.63,.82),col);
    g.quad(p(.49,.83),p(.68,.89),p(.30,.02),p(.09,0),col);
    stroke(g,p,[.215,.47],[.50,.47],.053,col);
  }
  function shield(g,pt){
    const cut=[[-.18,.16],[0,.205],[.18,.16],[.155,-.035],[.10,-.12],[0,-.181],[-.10,-.12],[-.155,-.035]];
    for(const [scale,color,depth] of [[1,ochre,0],[.92,ivory,.001],[.82,wine,.002]])for(let i=0;i<cut.length;i++){
      const a=cut[i],b=cut[(i+1)%cut.length];g.tri(pt(0,0,depth),pt(a[0]*scale,a[1]*scale,depth),pt(b[0]*scale,b[1]*scale,depth),color);
    }
    seven(g,(u,v)=>pt(u,v,.003),-.075,-.10,.234,light);
  }
  function wheel(g,k,x,y,z){
    const rad=shape.wheel,n=16,p=(d,r,a)=>[x+k*d,y+rad*r*Math.sin(a),z+rad*r*Math.cos(a)];
    function band(d,r,e,s,color){for(let i=0;i<n;i++){const a=i*tau/n,b=(i+1)*tau/n;g.quad(p(d,r,a),p(e,s,a),p(e,s,b),p(d,r,b),color);}}
    band(-.105,.84,-.090,.985,"#343a37");band(-.090,.985,.064,1,rubber);band(.064,1,.092,.928,"#404441");
    band(.092,.928,.105,.706,"#313735");band(.105,.706,.105,.656,ivory);band(.105,.656,.079,.567,shadeSteel);band(.079,.567,.080,.009,wine);
    for(let j=0;j<8;j++){const a=j*tau/8;
      g.quad(p(.088,.25,a-.19),p(.085,.60,a-.13),p(.085,.60,a+.16),p(.089,.25,a+.24),warmSteel);
    }
    band(.091,.30,.125,.25,chrome);band(.125,.25,.128,.005,steel);
  }
  function sideSkin(g,k,z0,z1,axle,top,paint){
    const cuts=[z0,z1];
    for(let j=0;j<=12;j++){
      const p=axle+Math.cos(j*Math.PI/12)*.514;if(p>z0+.0001&&p<z1-.0001)cuts.push(p);
    }
    cuts.sort((a,b)=>a-b);
    for(let j=1;j<cuts.length;j++){
      const a=cuts[j-1],b=cuts[j],mid=(a+b)/2;
      const low=z=>Math.abs(mid-axle)<.5141?shape.wheel+Math.sqrt(Math.max(0,1-((z-axle)/.514)**2))*.508:.407;
      const ya=low(a),yb=low(b),x=k*1.031,ix=k*.958;
      g.quad([ix,ya+.012,a],[ix,yb+.012,b],[x,yb+.056,b],[x,ya+.056,a],Math.abs(mid-axle)<.515?warmSteel:shadeSteel);
      g.quad([x,ya+.056,a],[x,yb+.056,b],[x,top-.042,b],[x,top-.042,a],paint);
      g.quad([x,top-.042,a],[x,top-.042,b],[k*1.010,top,b],[k*1.010,top,a],paint);
      if(Math.abs(mid-axle)<.515)g.quad([ix,ya,a],[ix,yb,b],[k*.785,yb,b],[k*.785,ya,a],rubber);
    }
  }
  function glyphE(g,pt,x,y,height,color){
    const s=height;stroke(g,pt,[x,y],[x+.025*s,y+s],s*.105,color);
    for(const [dy,len] of [[.99,.62],[.52,.47],[.04,.60]])stroke(g,pt,[x,y+dy*s],[x+len*s,y+dy*s],s*.095,color);
  }
  function cabDoor(g,k,paint){
    sideSkin(g,k,shape.back,shape.hingeZ,shape.axles[1],1.514,paint);
    const xa=k*1.034;
    sideRect(g,xa,1.775,1.432,1.82,.054,ivory);
    sideRect(g,k*1.035,1.775,1.385,1.82,.015,gold);
    const badge=(u,v,d=0)=>[k*(1.037+d),1.162+v,1.82-k*u];
    shield(g,badge);
    g.box(k*1.043,1.325,shape.handleZ,.026,.056,.212,rubber);
    g.box(k*1.054,shape.handleY,shape.handleZ,.026,.033,.173,chrome);
    g.box(k*.992,1.499,1.775,.073,.053,1.806,warmSteel);
    const p=(w,y,z)=>[k*w,y,z];
    // Side windows have a fixed quarterlight and a half-lowered opening in the cab door.
    g.quad(p(1.006,1.539,.93),p(1.006,1.539,2.33),p(.982,1.754,2.33),p(.982,1.754,.93),glass);
    g.pole(p(.982,1.755,.93),p(.982,1.755,2.33),.012,glassLight,4);
    g.quad(p(1.005,1.539,2.39),p(.998,1.539,2.675),p(.927,2.365,2.57),p(.929,2.365,2.39),glassDark);
    g.pole(p(.998,1.53,2.354),p(.929,2.366,2.354),.020,warmSteel,5);
    g.pole(p(1.001,1.52,.889),p(.926,2.374,.889),.050,ivory,6);
    g.pole(p(1.002,1.52,2.683),p(.925,2.374,2.592),.042,ivory,6);
    g.pole(p(.926,2.374,.88),p(.925,2.374,2.601),.042,ivory,5);
    const x=k*1.116;
    g.pole(p(.998,1.61,2.485),[x,1.92,2.49],.015,steel,5);
    g.pole(p(.947,2.247,2.455),[x,2.041,2.49],.014,steel,5);
    g.box(x,1.977,2.496,.066,.251,.093,shadeSteel);
    g.box(x,1.978,2.446,.058,.222,.009,chrome);
    // Inside handles, pockets and the two-piece door card follow the moving leaf.
    g.box(k*.987,1.246,1.81,.036,.37,1.60,"#6a604f");g.box(k*.961,1.276,1.47,.080,.065,.34,"#9b8263");
    g.box(k*.958,1.379,1.19,.058,.033,.128,chrome);
  }
  function cabRoof(g){
    const ring=(y,hx,za,zb,cut)=>[[-hx+cut,y,za],[-hx,y,za+cut],[-hx,y,zb-cut],[-hx+cut,y,zb],
      [hx-cut,y,zb],[hx,y,zb-cut],[hx,y,za+cut],[hx-cut,y,za]];
    const rings=[ring(2.345,.941,.740,2.795,.105),ring(2.392,.973,.715,2.825,.119),
      ring(2.442,.932,.756,2.784,.135),ring(2.467,.830,.836,2.682,.109)];
    for(let j=1;j<rings.length;j++){const a=rings[j-1],b=rings[j];for(let i=0;i<a.length;i++)g.quad(a[i],a[(i+1)%8],b[(i+1)%8],b[i],j===1?ochre:ivory);}
    const rim=rings.at(-1);for(let i=0;i<8;i++)g.tri([0,2.485,1.77],rim[i],rim[(i+1)%8],light);
    seven(g,(u,v)=>[u,2.489,v],.10,1.086,.77,wine);
    for(const k of sides){
      g.cyl(k*.615,2.481,2.245,.132,.148,.082,10,shadeSteel);
      g.cyl(k*.615,2.595,2.245,.097,.119,.150,12,redLens);
      g.cyl(k*.615,2.680,2.245,.076,.097,.020,12,"#bd5a43");
    }
    for(const x of [-.73,-.16,0,.16,.73]){
      g.box(x,2.474,2.662,.067,.037,.126,shadeSteel);g.box(x,2.493,2.677,.048,.027,.091,"#d19345");
    }
    // A polished air horn above the driver's side; the opposed bells open toward the street.
    for(let i=0;i<2;i++){
      const x=-.25+i*.136,start=1.28+i*.10;
      g.pole([x,2.536,start],[x,2.536,1.91],.033,warmSteel,7);
      g.pole([x,2.536,1.89],[x,2.536,2.09+i*.032],.051,chrome,8);
      endRect(g,2.096+i*.032,x,2.537,.066,.064,ink);
    }
  }
  function windshield(g){
    const bands=[[-1,.945,.887,-.10],[-.57,.993,.924,-.018],[0,1.003,.93,0],[.57,.993,.924,-.018],[1,.945,.887,-.10]];
    function pane(q,y){const [u,base,cap,wrap]=q;return [u*(y?cap:base),y?2.35:1.547,(y?2.679:3.012)+wrap];}
    for(let i=1;i<bands.length;i++)g.quad(pane(bands[i-1],0),pane(bands[i],0),pane(bands[i],1),pane(bands[i-1],1),i===1||i===4?glassDark:glass);
    for(const q of [bands[0],bands[4]])g.pole(pane(q,0),pane(q,1),.044,ivory,6);
    g.pole(pane(bands[2],0),pane(bands[2],1),.022,shadeSteel,5);
    for(const k of sides){
      const zw=y=>3.014-(y-1.547)*.414;
      g.pole([k*.70,1.569,zw(1.569)+.018],[k*.415,1.72,zw(1.72)+.018],.015,rubber,4);
      g.pole([k*.69,1.639,zw(1.639)+.018],[k*.20,1.782,zw(1.782)+.018],.017,rubber,4);
      g.quad([k*.05,2.303,2.703],[k*.55,2.303,2.682],[k*.67,2.270,2.675],[k*.09,2.270,2.716],glassLight);
    }
  }
  function cabInside(g){
    g.box(0,.591,1.88,1.82,.100,2.20,ink);
    g.box(0,1.19,.788,1.945,1.19,.077,"#a09277");
    g.box(0,1.939,.796,1.89,.80,.061,ivory);
    endRect(g,.763,0,1.979,1.04,.447,shadeSteel);
    endRect(g,.760,0,1.979,.972,.390,glassDark);
    endRect(g,.757,-.012,1.979,.022,.389,warmSteel);
    g.box(0,1.968,.835,.94,.385,.019,shadeSteel);
    g.box(0,1.978,.849,.88,.327,.012,glassDark);
    for(const k of sides){
      const x=k*shape.seatX;
      g.box(x,.824,1.35,.65,.34,.51,"#665b4b");
      g.box(x,1.025,1.39,.65,.136,.56,"#896c53");
      g.box(x,1.335,1.17,.642,.57,.119,"#85664e");
      for(const f of [-1,0,1])g.box(x+f*.147,1.35,1.233,.010,.48,.006,"#aa8e6b");
    }
    g.box(0,1.018,2.08,.28,.79,1.18,"#8e7761");
    g.box(0,1.43,2.155,.27,.041,1.05,"#a49379");
    g.box(0,1.56,2.52,1.84,.225,.48,"#645f52");
    g.box(0,1.682,2.51,1.84,.045,.47,"#7d7b69");
    g.box(-.51,1.657,2.268,.43,.142,.036,rubber);
    for(let i=0;i<4;i++)disc(g,(x,y)=>[x,y,2.247],-.66+i*.093,1.671,.033,ivory,8);
    const center=[-.51,1.51,1.985],r=.214;
    for(let i=0;i<14;i++){
      const a=tau*i/14,b=tau*(i+1)/14;
      const p=t=>[center[0]+r*Math.cos(t),center[1]+.70*r*Math.sin(t),center[2]+.714*r*Math.sin(t)];
      g.pole(p(a),p(b),.021,rubber,5);if(i%5===0)g.pole(center,p(a),.012,steel,4);
    }
  }
  function signal(g,s,k,front,lit=true){
    endRect(g,front?(lit?3.224:3.220):(lit?-3.222:-3.217),k*(front?.801:.913),front?1.266:1.412,front?.235:.115,front?.074:.095,lit?"#ffc56b":"#bb8341");
  }
  function brakeLights(g){for(const k of sides)endRect(g,-3.223,k*.912,1.264,.119,.135,"#ff6756");}
  function reverse(g){for(const k of sides)endRect(g,-3.224,k*.914,1.105,.115,.074,"#fff4cf");}
  function nose(g,paint){
    // The bumper protrudes past a subtle three-panel brow, and the cab floor stays open behind it.
    const cols=[[-1.035,2.934],[-.925,3.140],[-.70,3.198],[.70,3.198],[.925,3.140],[1.035,2.934]];
    for(let i=1;i<cols.length;i++){
      const [ax,az]=cols[i-1],[bx,bz]=cols[i];
      g.quad([ax*.96,.559,az],[bx*.96,.559,bz],[bx,1.419,bz],[ax,1.419,az],paint);
      g.quad([ax,1.419,az],[bx,1.419,bz],[bx*.973,1.497,bz-.024],[ax*.973,1.497,az-.024],paint);
      g.quad([ax*.973,1.497,az-.024],[bx*.973,1.497,bz-.024],[bx*.952,1.53,2.88],[ax*.952,1.53,2.88],paint);
    }
    g.box(0,.606,3.267,2.105,.167,.283,chrome);
    for(const k of sides){
      g.box(k*.992,.620,3.34,.112,.110,.14,shadeSteel);
      g.box(k*.777,.916,3.185,.401,.348,.063,chrome);
      for(const y of [.841,1.00]){endRect(g,3.220,k*.777,y,.33,.128,ink);endRect(g,3.222,k*.777,y,.290,.099,whiteLens);}
      endRect(g,3.219,k*.801,1.267,.26,.094,chrome);signal(g,shape,k,true,false);
      sideRect(g,k*1.035,2.832,1.430,.271,.054,ivory);
    }
    g.box(0,.996,3.194,1.070,.504,.041,warmSteel);endRect(g,3.217,0,1.0,1.007,.439,ink);
    for(let i=0;i<7;i++)g.box(0,.810+i*.062,3.228,1.003,.022,.022,chrome);
    endRect(g,3.221,0,1.38,.496,.111,wine);
    const sign=(u,v)=>[u,1.345+v,3.224];glyphE(g,sign,-.100,0,.077,ivory);seven(g,sign,.038,0,.079,ivory);
    g.box(0,.594,3.408,.291,.096,.019,ink);endRect(g,3.421,0,.595,.235,.048,ivory);
  }
  function locker(g,k,z,w,bot,top){
    const h=top-bot,x=k*1.039,mid=(top+bot)/2;
    sideRect(g,x,z,mid,w,h,shadeSteel);sideRect(g,k*1.041,z,mid,w-.047,h-.044,warmSteel);
    const lines=Math.floor(h/.060);
    for(let i=1;i<lines;i++)sideRect(g,k*1.042,z,bot+i*h/lines,w-.06,.009,"#83918a");
    g.box(k*1.047,bot+.075,z,.033,.046,Math.min(.27,w*.50),chrome);
  }
  function panel(g,k){
    const x=k*1.003,z=.015;
    sideRect(g,x,z,1.098,1.268,.763,ink);
    sideRect(g,k*1.008,z,1.105,1.205,.702,"#70837c");
    const pt=(u,y,depth=0)=>[k*(1.012+depth),y,z-k*u];
    for(const [u,y,r,angle] of [[-.41,1.284,.088,.6],[-.16,1.284,.086,2.10],[.076,1.275,.062,1.32],[.267,1.275,.057,2.62],[.448,1.275,.055,.94]]){
      disc(g,pt,u,y,r,ink);disc(g,(u,v)=>pt(u,v,.002),u,y,r*.78,ivory);
      stroke(g,(u,v)=>pt(u,v,.005),[u,y],[u+Math.cos(angle)*r*.65,y+Math.sin(angle)*r*.65],.010,wine);
    }
    for(const [i,c] of [gold,"#c46747","#719b99",ivory].entries()){
      const u=-.456+i*.275;
      sideRect(g,k*1.016,z-k*u,1.108,.19,.051,steel);sideRect(g,k*1.019,z-k*u,1.109,.148,.024,c);
      const mid=pt(u,1.018,.015);g.pole(mid,pt(u+.045,.956,.046),.014,chrome,5);
      g.box(k*1.062,.955,z-k*(u+.045),.038,.037,.090,c);
    }
    for(const u of [-.29,.30]){
      disc(g,(u,v)=>pt(u,v,.01),u,.830,.086,chrome,10);
      disc(g,(u,v)=>pt(u,v,.016),u,.830,.06,"#987b4b",10);
    }
  }
  function foldedHose(g){
    // Hose laid in flat folds; the exposed returns wrap over each other at the tail.
    const beds=[[-.615,.36,"#bfab79","#96845e"],[-.144,.43,"#d5bd8c","#a79069"],[.38,.50,"#aa7f5b","#876951"]];
    g.box(0,1.576,-1.93,1.88,.082,2.50,shadeSteel);
    for(const [x,w,c,edge] of beds){
      for(let row=0;row<4;row++){
        const y=1.602+row*.050,tail=-3.11+(row%2)*.049+x*.035,front=-.80+(row%2)*.047;
        g.box(x,y,(front+tail)/2,w,.048,front-tail,c);
        g.box(x,y-.008,tail-.007,w*.93,.033,.046,edge);
        if(row===3)for(const offset of [-.38,.38])g.box(x+offset*w,y+.025,(front+tail)/2,.013,.003,front-tail-.04,edge);
      }
    }
    for(const z of [-2.65,-1.26]){
      g.box(-.14,1.812,z,1.75,.017,.043,"#82684f");g.box(-.14,1.824,z,.068,.014,.06,warmSteel);
    }
    for(const x of [-.87,-.385,.102,.90])g.box(x,1.699,-1.94,.043,.272,2.56,steel);
  }
  function ladder(g){
    const k=1,x=1.060;
    for(const z of [-2.58,-.76]){g.box(x,1.58,z,.126,.063,.114,shadeSteel);g.box(x,1.74,z,.071,.030,.082,wine);}
    for(const y of [1.604,1.882])g.box(x,y,-1.59,.069,.048,2.99,chrome);
    for(let i=0;i<11;i++)g.box(x,1.743,-3.008+i*.28,.050,.25,.040,warmSteel);
    g.box(k*1.056,1.944,-1.674,.066,.038,2.56,ochre);
  }
  function bodyBack(g,paint){
    // Inner chassis and bed. The side panels are shaped around both rear tires.
    g.box(0,.593,-1.16,1.492,.339,4.07,ink);
    g.box(0,1.17,-1.94,1.986,.53,2.58,paint);
    for(const k of sides){
      sideSkin(g,k,-3.22,-.70,shape.axles[0],1.522,paint);
      locker(g,k,-2.784,.740,.53,1.430);locker(g,k,-1.86,.965,1.043,1.429);locker(g,k,-.989,.475,.55,1.43);
      sideRect(g,k*1.038,-1.96,1.474,2.48,.039,ivory);sideRect(g,k*1.039,-1.96,1.439,2.48,.012,gold);
      g.box(k*.985,1.547,-1.94,.120,.091,2.59,chrome);
      g.box(k*.982,1.696,-1.95,.106,.224,2.61,paint);g.box(k*.980,1.829,-1.94,.110,.048,2.62,chrome);
      g.box(k*.953,.47,.017,.199,.086,1.32,chrome);
    }
    foldedHose(g);ladder(g);
    // Crosslays just behind the cab: the two different jackets can be read from above.
    g.box(0,.900,.014,1.986,.271,1.33,wine);
    g.box(0,1.255,.014,1.979,.495,1.33,paint);
    for(let i=0;i<2;i++){
      const z=-.382+i*.505;
      g.box(0,1.530,z,1.974,.100,.45,shadeSteel);
      for(let j=0;j<5;j++)g.box(-.72+.355*j,1.625,z,.342,.092,.353,i?"#c5ad75":"#a88663");
      g.box(0,1.682,z,.047,.014,.379,ink);
    }
    panel(g,-1);locker(g,1,.015,1.21,.71,1.43);
    for(const k of sides){
      g.box(k*.963,1.173,-3.169,.124,.628,.092,ivory);
      endRect(g,-3.217,k*.913,1.264,.119,.135,tailLens);endRect(g,-3.217,k*.914,1.105,.115,.074,chrome);signal(g,shape,k,false,false);
      g.pole([k*.767,.77,-3.262],[k*.767,1.42,-3.262],.028,chrome,6);
      for(const y of [.77,1.42])g.pole([k*.767,y,-3.262],[k*.767,y,-3.20],.022,steel,6);
    }
    g.box(0,.525,-3.226,2.085,.119,.380,chrome);g.box(0,.763,-3.159,1.996,.31,.089,paint);
    const bp=(u,v)=>[u,.685+v,-3.206];glyphE(g,bp,-.157,0,.183,ivory);seven(g,bp,.010,-.002,.185,ivory);
    for(const y of [.90,1.032])g.box(0,y,-3.218,.54,.039,.108,chrome);
    for(let i=0;i<8;i++)g.box(-.85+i*.24,.589,-3.285,.139,.009,.064,steel);
    // Rubber suction tube held in straps along the pump side of the bed.
    g.pole([-.999,1.700,-3.07],[-.999,1.700,-.87],.071,rubber,8);
    for(const z of [-3.02,-2.59,-1.54,-.94])g.box(-1.003,1.697,z,.144,.158,.044,warmSteel);
  }
  function shell(g,paint,doors){
    bodyBack(g,paint);nose(g,paint);cabInside(g);windshield(g);cabRoof(g);
    for(const k of sides){
      for(const [a,b] of [[.71,shape.back],[shape.hingeZ,2.97]])sideSkin(g,k,a,b,shape.axles[1],1.515,paint);
      g.box(k*.959,.505,.795,.145,.152,.473,warmSteel);
      g.box(k*.968,.798,.804,.126,.058,.277,chrome);
      g.pole([k*1.030,.949,.795],[k*1.030,1.498,.795],.021,chrome,6);
      cabDoor(doors[k],k,paint);
    }
    g.box(0,.578,2.515,1.62,.108,1.02,shadeSteel);
    g.box(0,.602,-.015,1.613,.172,1.53,ink);
  }
  function shiftOrigin(mesh,k){
    const d=mesh.vertices;
    for(let i=0;i<d.length;i+=6){d[i]-=k*shape.hingeX;d[i+2]-=shape.hingeZ;}
  }
  function build(g,s,paint,parts){
    const doors=parts?.doors||{[-1]:g,1:g};
    shell(g,paint||shape.paint,doors);
    for(const k of sides){
      if(parts){shiftOrigin(doors[k],k);wheel(parts.wheels[k],k,0,0,0);}
      else for(const z of s.axles)wheel(g,k,k*(s.track-.085),s.wheel,z);
    }
    if(parts){brakeLights(parts.brakes);reverse(parts.reverse);}
  }
  function driverEnds(g,kind,paint){nose(g,paint||shape.paint);bodyBack(g,paint||shape.paint);}
  function beaconPhase(t,v){return (Math.floor(t*3.4+(Number(v.id)||0)*.06)&1)?1:-1;}
  function lamps(g,k){
    g.cyl(k*.615,2.599,2.245,.100,.121,.148,12,"#ff784d");g.cyl(k*.615,2.680,2.245,.079,.100,.022,12,"#ffbf6d");
    endRect(g,-3.224,k*.912,1.412,.116,.101,"#ff9b55");
    endRect(g,3.225,k*.800,1.266,.236,.078,"#ffc56b");
  }
  function beacons(list,model,v,ground,t){
    if(v.responseLights){
      const k=beaconPhase(t,v),key="seabird-rotator/"+k;model(key,g=>lamps(g,k));list.push([key,v.x,ground,v.z,v.yaw,v.pitch||0,v.lean||0,0,v]);
    }
    if(v.pumpWorking){
      const key="seabird-pump-in-use";model(key,g=>{sideRect(g,-1.024,.564,1.374,.071,.053,"#b9df8a");g.box(-.798,1.674,.134,.118,.027,.140,"#e7c676");});
      list.push([key,v.x,ground,v.z,v.yaw,v.pitch||0,v.lean||0,0,v]);
    }
  }
  const spriteCache=new Map();
  function print(v){
    const color=v.color||shape.paint;
    const damage=v.damage?["front","rear","left","right"].map(k=>Math.round(Math.max(0,Math.min(1,v.damage[k]||0))*15)).join(","):"";
    const key=color+damage;if(spriteCache.has(key))return spriteCache.get(key);
    const body=new BayMesh(),doors={[-1]:new BayMesh(),1:new BayMesh()},bend=v.damage&&window.BayBodyworkArt?.deformer?.(v);
    shell(body,color,doors);const sprite=BayDealerCars.sprite,art={body:sprite(body,0,0,bend),doors:{}};
    for(const k of sides){shiftOrigin(doors[k],k);art.doors[k]=sprite(doors[k],k*shape.hingeX,shape.hingeZ,bend);}
    if(spriteCache.size>=6)spriteCache.delete(spriteCache.keys().next().value);spriteCache.set(key,art);return art;
  }
  function stamp(c,r){if(r)c.drawImage(r.canvas,r.left,r.top,r.w,r.h);}
  function map(c,v,x,y,scale,t=0){
    if(!(scale>0))return;
    c.save();c.translate(x,y);c.rotate(v.yaw||0);c.scale(scale,scale);
    if(scale<3.5){
      c.fillStyle=v.color||shape.paint;c.fillRect(-1,-3.24,2,6.48);
      c.fillStyle=ivory;c.fillRect(-.94,-2.77,1.88,2.07);c.fillStyle=glass;c.fillRect(-.89,-3.02,1.78,.30);
      c.fillStyle="#b59d73";c.fillRect(-.76,.85,1.48,2.25);c.fillStyle=chrome;c.fillRect(.72,.82,.16,2.36);
    }else{
      for(const k of sides)for(const z of shape.axles){
        c.save();c.translate(k*(shape.track-.085),-z);if(z>0)c.rotate(v.steer||0);
        c.fillStyle=rubber;c.fillRect(-.108,-shape.wheel,.216,2*shape.wheel);c.restore();
      }
      const art=print(v);stamp(c,art.body);
      for(const k of sides){
        const open=Math.max(v.doorSide===k?v.doorAngle||0:0,k>0?v.passengerDoor||0:0);
        c.save();c.translate(k*shape.hingeX,-shape.hingeZ);c.rotate(-k*open);stamp(c,art.doors[k]);c.restore();
      }
    }
    for(const k of sides){
      if(v.brakes>.2||v.handbrake>.4){c.fillStyle="#ff6756";c.fillRect(k*.912-.066,3.188,.132,.060);}
      if(v.reversing){c.fillStyle="#fff4cf";c.fillRect(k*.825-.042,3.197,.084,.051);}
      if(v.indicator===k&&(t+(Number(v.id)||0)%13*.071)%.84<.42){c.fillStyle="#ffc56b";c.fillRect(k*.80-.09,-3.24,.18,.08);c.fillRect(k*.925-.044,3.180,.088,.07);}
    }
    if(v.responseLights){
      const k=beaconPhase(t,v);c.fillStyle="#ffb663";c.beginPath();c.arc(k*.615-.06,-2.245-.24,.125,0,tau);c.fill();
      c.fillStyle="#ff8954";c.fillRect(k*.913-.068,3.177,.136,.084);
    }
    if(v.pumpWorking){c.fillStyle="#dded99";c.fillRect(-1.053,-.568,.128,.16);}
    c.restore();
  }
  window.BayEngineSevenArt={owns,shapes,cockpitStyles,fit,build,driverEnds,hoodHeight,brakeLights,signal,map,beacons,beaconPhase};
})();
