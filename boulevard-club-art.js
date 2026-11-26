/* Las Brisas Car Club, the volunteers who judge the hop and their portable equipment. */
(() => {
  "use strict";
  const pi=Math.PI, tau=2*pi, ground=.152;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const P=(x,z,yaw=0)=>({x,z,yaw,y:ground});
  const pad=P(118,57.20,-pi/2),desk=P(129.50,60.25),display=P(125.20,51.60,-pi/2),second=P(110.25,51.60,pi/2);
  const gauge=P(115.90,55.00,.73),celia=P(121.0,54.10,-.79),nico=P(129.52,62.46,pi);
  const street={...P(139.05,63,pi),dir:2},exit={...P(122,66.95,pi/2),dir:1};
  // Tangent quarter circles give a full-size coupe room around the site in each direction.
  function arc(cx,cz,r,from,to){
    return Array.from({length:8},(_,i)=>{
      const a=from+(to-from)*i/7,sign=Math.sign(to-from);
      return P(cx+r*Math.cos(a),cz+r*Math.sin(a),Math.atan2(-sign*Math.sin(a),sign*Math.cos(a)));
    });
  }
  const intoPad=[...arc(133.25,63,5.8,0,-pi/2),pad];
  const fromPad=[pad,...arc(111.4,61.8,4.6,-pi/2,-pi),...arc(111.75,62,4.95,pi,pi/2),exit];
  const goldExit={...P(132.50,66.95,pi/2),dir:1},returnStreet={...P(132,74.48,-pi/2),dir:3};
  const fromSecond=[second,...arc(117.65,56.3,4.7,-pi/2,0),...arc(128.85,60.45,6.5,pi,pi/2),goldExit];
  const toSecond=[returnStreet,...arc(112.05,67.88,6.6,pi/2,pi),...arc(110.25,56.40,4.8,pi,1.5*pi)];
  const crowd=[P(115.20,61.64,2.52),P(113.90,54.53,.94),P(118.22,61.84,pi),P(120.15,61.93,-2.62)];
  const site={id:"las-brisas",kind:"las-brisas",name:"Las Brisas",center:P(119.5,56.8),pad,desk,display,second,stalls:[display,second],
    gauge,staff:gauge,celia,nico,crowd,street,curb:street,exit,intoPad,fromPad,goldExit,returnStreet,fromSecond,toSecond,
    marker:{...desk,kind:"las-brisas",name:"Las Brisas"}};
  const lotOutline=[[102.34,49.08],[104,48.30],[130.32,48.32],[133.65,50.08],[134.57,54.42],[134.39,60.30],
    [132.15,64.14],[105.09,64.19],[102.68,62.78]];
  function floor(x,z){
    if(x<102.3||x>138.27||z<48.28||z>66.21)return null;
    if(x>133.60){
      const a=clamp((x-133.60)/3.44,0,1),b=clamp((x-137.04)/1.23,0,1);
      if(z>=53.78+.80*a+.38*b&&z<=60.90-.96*a-.31*b)
        return x>137.04?.168-.123*b:ground+.016*a;
    }
    const ramp=(z-63.86)/2.34;
    if(ramp>0&&ramp<1&&x>104.20+5.96*ramp&&x<108.63+5.20*ramp)return ground-.106*ramp;
    let inside=false;
    for(let i=0,j=lotOutline.length-1;i<lotOutline.length;j=i++){
      const [a,b]=lotOutline[i],[u,v]=lotOutline[j];
      if((b>z)!==(v>z)&&x<(u-a)*(z-b)/(v-b)+a)inside=!inside;
    }
    return inside?ground:null;
  }
  const bounds=(x,z,w,d,bottom,top)=>({x,z,w,d,bottom,top,streetProp:true});
  const blocks=[bounds(103.1,57.3,.28,5.15,ground,3.66),bounds(gauge.x,gauge.z,.43,.42,ground,2.90),
    bounds(129.50,61.52,2.10,.85,ground,1.02),bounds(131.0,52.10,1.26,1.50,ground,2.94),
    bounds(115.15,49.23,.50,.32,ground,.93),bounds(122.58,49.38,.50,.32,ground,.93),
    bounds(107.26,49.06,.10,.10,ground,3.27),bounds(129.62,49.06,.10,.10,ground,3.27),
    bounds(112.52,62.73,.67,.41,ground,.65)];
  const chairs=[[115.30,62.73,.16],[118.10,62.93,-.25],[120.35,63.02,-.30]];
  for(const [x,z] of chairs)blocks.push(bounds(x,z,.51,.55,ground,.99));
  for(const x of [127.77,131.23])for(const z of [60.60,63.13])blocks.push(bounds(x,z,.105,.105,ground,2.48));
  const cameraBlocks=[bounds(129.50,61.86,3.91,2.90,2.37,2.98)];
  const paint={asphalt:"#777875",edge:"#89877d",repair:"#727371",line:"#e0c69d",faded:"#a69b87",pale:"#fff0c5",
    ivory:"#f2dbab",red:"#be5845",redDark:"#7d4038",rose:"#df8b69",jade:"#34766c",aqua:"#77a99a",
    dark:"#31474a",steel:"#8b9690",light:"#d4d7bd",brass:"#c79a5e",wood:"#967958",black:"#373d3d"};
  const c=paint;
  const name=s=>"brisas-"+s;
  function canvasLine(ctx,pts,width,color){
    ctx.lineWidth=width;ctx.strokeStyle=color;ctx.beginPath();
    for(let i=0;i<pts.length;i++)i?ctx.lineTo(...pts[i]):ctx.moveTo(...pts[i]);
    ctx.stroke();
  }
  function poly(g,points,col){for(let i=1;i<points.length-1;i++)g.tri(points[0],points[i],points[i+1],col);}
  function panel(x,y,z,yaw){
    const co=Math.cos(yaw),si=Math.sin(yaw);
    return (u,v,d=0)=>[x-u*co+d*si,y+v,z+u*si+d*co];
  }
  function face(g,f,x,y,w,h,col,d=0){
    g.quad(f(x-w/2,y-h/2,d),f(x+w/2,y-h/2,d),f(x+w/2,y+h/2,d),f(x-w/2,y+h/2,d),col);
  }
  function path(g,f,pts,w,col,d=0){
    for(let i=1;i<pts.length;i++){
      const [ax,ay]=pts[i-1],[bx,by]=pts[i],dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy);
      if(!len)continue;
      const u=-dy*w/(2*len),v=dx*w/(2*len);
      g.quad(f(ax+u,ay+v,d),f(bx+u,by+v,d),f(bx-u,by-v,d),f(ax-u,ay-v,d),col);
    }
  }
  function disc(g,f,x,y,rx,ry,col,d=0,n=20){
    const pts=Array.from({length:n},(_,i)=>f(x+rx*Math.cos(i*tau/n),y+ry*Math.sin(i*tau/n),d));
    poly(g,pts,col);
  }
  const floorPlane=(u,v,d=0)=>[u,ground+d,v];
  function groundLine(g,pts,w,col,d=.011){path(g,floorPlane,pts,w,col,d);}
  function chalkBox(g,x,z,w,d,col,n){
    const l=x-w/2,r=x+w/2,b=z-d/2,t=z+d/2;
    groundLine(g,[[l+n,b],[l,b],[l,b+n]],.076,col);groundLine(g,[[r-n,b],[r,b],[r,b+n]],.076,col);
    groundLine(g,[[l+n,t],[l,t],[l,t-n]],.076,col);groundLine(g,[[r-n,t],[r,t],[r,t-n]],.076,col);
  }
  const signStrokes={
    L:[[[.02,.06],[.20,.15],[.42,.50],[.57,.86],[.55,.96],[.45,.92],[.32,.71],[.22,.40],[.18,.13],[.10,.02],[.02,.00],[.05,.07],[.27,.13],[.49,.06],[.68,.14]]],
    a:[[[.00,.12],[.14,.32],[.30,.43],[.40,.43],[.43,.35],[.30,.17],[.16,.10],[.13,.17],[.21,.32],[.36,.42]],[[.47,.43],[.35,.17],[.37,.10],[.49,.13],[.60,.22]]],
    s:[[[.00,.15],[.21,.36],[.31,.55],[.35,.56],[.36,.47],[.28,.39],[.33,.28],[.37,.17],[.30,.10],[.17,.09],[.10,.14],[.18,.17],[.32,.14],[.48,.20]]],
    B:[[[.01,.04],[.20,.33],[.41,.75],[.47,.86]],[[.03,.73],[.24,.86],[.52,.93],[.71,.91],[.77,.83],[.70,.71],[.51,.58],[.31,.51],[.52,.54],[.66,.50],[.69,.40],[.60,.25],[.46,.13],[.27,.08],[.14,.13],[.22,.20],[.39,.20],[.66,.13]]],
    r:[[[.00,.14],[.19,.35],[.27,.54],[.30,.54],[.34,.45],[.46,.44],[.51,.40],[.40,.26],[.36,.14],[.41,.10],[.57,.18]]],
    i:[[[.00,.13],[.16,.28],[.28,.41],[.20,.24],[.16,.13],[.23,.10],[.39,.18]],[[.32,.56],[.35,.61]]]
  };
  const letters=[["L",0],["a",.52],["s",.99],["B",1.65],["r",2.29],["i",2.76],["s",3.05],["a",3.44],["s",3.91]];
  function script(g,f,scale,v,d){
    // The wide exit strokes and joint overlaps belong to the club's painted script.
    for(const [dx,dy,w,col,z] of [[.017,-.028,.061,c.redDark,0],[0,0,.045,c.pale,.004]]){
      for(const [ch,offset] of letters)for(const segment of signStrokes[ch]){
        path(g,f,segment.map(([x,y])=>[(x+offset-2.2+dx)*scale,v+(y-.45+dy)*scale]),w*scale,col,d+z);
      }
    }
    const tail=[[-1.84,-.33],[-1.15,-.37],[-.20,-.32],[.94,-.23],[1.90,-.18],[2.24,-.22],[2.12,-.29]];
    path(g,f,tail.map(([x,y])=>[x*scale,v+y*scale]),.027*scale,c.pale,d+.006);
  }
  const diamond=[[-1,0],[-.76,.60],[-.24,.78],[0,1],[.24,.78],[.76,.60],[1,0],[.76,-.63],[.17,-.77],[0,-.88],[-.17,-.77],[-.76,-.63]];
  function crest(g,f,w,h,detail){
    const plate=(rx,ry,d,col)=>poly(g,diamond.map(([x,y])=>f(x*rx,y*ry,d)),col);
    plate(w*.51,h*.51,0,c.redDark);plate(w*.496,h*.492,.010,c.ivory);plate(w*.477,h*.456,.022,c.jade);
    if(detail){
      const y=h*.26;
      disc(g,f,0,y,.147*w,.125*h,c.rose,.032,18);
      for(const sign of [-1,1]){
        for(let k=0;k<3;k++)path(g,f,[[sign*(.126*w+k*.045),y+.085-k*.061],[sign*(.31*w-k*.04),y+.116-k*.062],
          [sign*(.358*w-k*.075),y+.096-k*.062]],.014*w,c.ivory,.035);
      }
      script(g,f,w*.190,-.002*h,.041);
      BayCutArt.signText(g,"CAR CLUB",w*.0096,c.pale,(u,v)=>f(u,v-h*.263,.050));
    }else{
      path(g,f,[[-w*.32,-h*.035],[-w*.12,h*.09],[w*.011,-h*.054],[w*.18,h*.035],[w*.34,h*.08]],h*.050,c.ivory,.032);
    }
  }
  function streetPlaque(g,detail){
    for(const z of [55.72,58.88]){
      g.box(103.1,1.04,z,.15,1.95,.16,c.wood);g.box(103.108,.296,z,.22,.29,.23,c.redDark);
    }
    crest(g,panel(103.19,2.60,57.30,pi/2),5.05,2.02,detail);
    g.box(131,1.32,52.10,.14,2.38,.15,c.steel);
    crest(g,panel(131.04,2.31,52.08,2.31),1.84,1.23,detail);
    // A physical double face is visible to pedestrians heading out of the site too.
    crest(g,panel(130.95,2.31,52.13,2.31+pi),1.84,1.23,false);
  }
  function pavement(g,detail){
    poly(g,lotOutline.map(([x,z])=>[x,ground-.008,z]),c.asphalt);
    g.quad([133.60,.146,53.78],[137.04,.168,54.58],[137.04,.168,59.94],[133.70,.146,60.90],"#bdb4a1");
    g.quad([137.04,.168,54.58],[138.27,.045,54.96],[138.27,.045,59.63],[137.04,.168,59.94],"#cdbfa9");
    g.quad([104.2,.145,63.86],[108.63,.145,63.85],[113.83,.046,66.20],[110.16,.046,66.20],c.asphalt);
    face(g,floorPlane,pad.x,pad.z,8.65,3.98,c.repair,.001);
    chalkBox(g,pad.x,pad.z,8.22,3.82,c.line,1.01);
    for(const z of [56.35,58.05]){
      groundLine(g,[[115.61,z-.27],[115.61,z+.27],[116.10,z+.27]],.073,c.line,.018);
      groundLine(g,[[116.10,z-.27],[115.63,z-.27]],.071,c.line,.018);
    }
    if(detail)BayCutArt.signText(g,"HOP LINE",.064,c.faded,(u,v)=>[116.73-v,ground+.019,pad.z+u]);
    for(const p of [display,second])chalkBox(g,p.x,p.z,6.46,3.36,c.faded,.82);
    if(!detail)return;
    for(const [x,z] of [[115.85,56.39],[115.85,58.01],[120.1,56.39],[120.10,58.01]]){
      groundLine(g,[[x-.17,z-.28],[x-.17,z+.28]],.035,c.faded);
      groundLine(g,[[x+.12,z-.21],[x+.12,z+.21]],.026,c.faded);
    }
    for(let i=0;i<7;i++){
      const x=132.3-i*.81;
      groundLine(g,[[x,57.18],[x-.37,57.18]],.044,c.faded);
    }
    for(const x of [123.25,126.35])groundLine(g,[[x+.31,56.91],[x,57.18],[x+.31,57.45]],.063,c.line);
    for(const [xs,zs,f] of [[106.11,55.71,1],[122.33,60.60,-1],[128.13,55.25,1]]){
      groundLine(g,[[xs,zs],[xs+.49,zs+.08*f],[xs+.77,zs-.07*f],[xs+1.17,zs+.16*f],[xs+1.80,zs+.17*f]],.028,"#5f6261",.004);
    }
    for(let i=0;i<6;i++)groundLine(g,[[114.58+i*.23,54.84],[114.70+i*.23,54.98]],.031,c.ivory);
  }
  const digits=["abcdef","bc","abdeg","abcdg","bcfg","acdfg","acdefg","abc","abcdefg","abcdfg"];
  const bars={a:[[0,2],[1,2]],b:[[1,2],[1,1]],c:[[1,1],[1,0]],d:[[0,0],[1,0]],e:[[0,1],[0,0]],f:[[0,2],[0,1]],g:[[0,1],[1,1]]};
  function numeral(g,f,n,x,y,sz,col,d){
    for(const ch of digits[n])path(g,f,bars[ch].map(([u,v])=>[x+(u-.5)*sz,y+(v-1)*sz]),sz*.15,col,d);
  }
  const staffPlane=panel(gauge.x,ground,gauge.z,gauge.yaw);
  function measuringStaff(g,detail){
    g.cyl(gauge.x,ground+.038,gauge.z,.248,.268,.076,8,c.redDark);
    g.box(gauge.x,ground+1.48,gauge.z,.16,2.83,.17,c.steel,gauge.yaw);
    for(const f of [staffPlane,panel(gauge.x,ground,gauge.z,gauge.yaw+pi)]){
      face(g,f,0,1.46,.216,2.88,c.ivory,.105);
      face(g,f,-.080,1.464,.024,2.83,c.jade,.113);
      for(let i=0;i<=54;i++){
        const y=i*.0508,w=i%6===0?.153:i%3===0?.105:.047;
        if(detail||i%3===0)face(g,f,.095-w/2,y,w,i%6===0?.016:.009,c.dark,.122);
        if(detail&&i>0&&i%6===0){
          const n=String(i*2);
          for(let j=0;j<n.length;j++)numeral(g,f,+n[j],-.045+(j-(n.length-1)*.5)*.047,y-.034,.027,c.dark,.126);
        }
      }
      face(g,f,0,2.97,.66,.33,c.redDark,.035);face(g,f,0,2.97,.61,.285,c.dark,.052);
      if(detail)BayCutArt.signText(g,"BEST",.018,c.ivory,(u,v)=>f(u-.112,v+2.97,.065));
    }
    for(let i=0;i<3;i++){
      const v=.62+i*.27;g.pole(staffPlane(.10,v,.01),staffPlane(.27,v,.01),.027,c.steel,5);
      disc(g,staffPlane,.27,v,.076,.082,c.dark,.070,10);
      disc(g,staffPlane,.27,v,.052,.056,i%2?c.brass:c.rose,.081,10);
    }
  }
  function tent(g,detail){
    const x=129.5,z=61.865,w=3.91,d=2.90,y=2.60;
    for(const a of [-1,1])for(const b of [-1,1]){
      const xx=x+a*1.73,zz=z+b*1.265;
      g.pole([xx,ground,zz],[xx,y-.14,zz],.036,c.light,6);
      g.pole([xx,y-.65,zz],[xx-a*.45,y-.12,zz],.018,c.steel,5);
    }
    // Four cream gores meet the spruce green ridge on the old portable tent.
    for(const side of [-1,1]){
      const zz=z+side*d/2;
      for(let i=0;i<7;i++){
        const l=x-w/2+i*w/7,r=l+w/7,col=i%2?c.ivory:c.jade;
        g.quad([l,y,zz],[r,y,zz],[r,y+.37,z],[l,y+.37,z],col);
        g.quad([l,y-.19,zz],[r,y-.19,zz],[r,y,zz],[l,y,zz],col);
      }
      poly(g,[[x+side*w/2,y,z-d/2],[x+side*w/2,y+.37,z],[x+side*w/2,y,z+d/2]],c.aqua);
    }
    g.box(x,ground+.806,61.52,2.11,.093,.857,c.wood);
    for(const a of [-1,1])for(const b of [-1,1])
      g.pole([x+a*.88,ground+.03,61.52+b*.33],[x+a*.54,ground+.77,61.52+b*.24],.025,c.steel,5);
    const bib=panel(x,ground+.53,61.076,pi);
    face(g,bib,0,0,1.36,.48,c.red,.008);
    if(detail)BayCutArt.signText(g,"CHECK IN",.032,c.pale,(u,v)=>bib(u,v,.015));
    if(detail){
      g.box(x-.60,ground+.877,61.47,.38,.031,.275,c.dark,-.12);
      g.box(x-.60,ground+.898,61.47,.31,.011,.221,c.ivory,-.12);
      g.pole([x-.78,ground+.908,61.53],[x-.72,ground+.908,61.40],.009,c.red,5);
      for(let i=0;i<3;i++){g.cyl(x+.34+i*.125,ground+.933,61.61,.046,.046,.151,9,[c.red,c.aqua,c.brass][i]);
        g.cyl(x+.34+i*.125,ground+1.013,61.61,.044,.044,.007,9,c.light);}
    }
  }
  function chair(g,x,z,yaw){
    const f=panel(x,ground,z,yaw);
    for(const sign of [-1,1]){
      g.pole(f(sign*.225,.01,-.26),f(sign*.225,.74,.17),.022,c.steel,5);
      g.pole(f(sign*.225,.01,.25),f(sign*.225,.54,-.23),.022,c.steel,5);
      g.pole(f(sign*.225,.49,.105),f(sign*.225,.84,.19),.021,c.light,5);
    }
    g.quad(f(-.228,.453,-.23),f(.228,.453,-.23),f(.228,.453,.15),f(-.228,.453,.15),c.aqua);
    g.quad(f(-.228,.63,.14),f(.228,.63,.14),f(.228,.84,.193),f(-.228,.84,.193),c.jade);
    g.pole(f(-.21,.747,.17),f(.21,.747,.17),.013,c.ivory,5);
  }
  function flagline(g,detail){
    const left=107.26,right=129.62,z=49.06;
    for(const x of [left,right]){
      g.cyl(x,ground+.05,z,.114,.134,.10,8,c.steel);g.pole([x,ground,z],[x,3.26,z],.036,c.steel,6);
    }
    // The cord hangs clear of both parked cars; the dip is largest midway between the uprights.
    const at=u=>[left+(right-left)*u,3.25-.46*Math.sin(pi*u),z+.09*Math.sin(u*pi)];
    for(let n=0;n<10;n++)g.pole(at(n/10),at((n+1)/10),detail?.011:.015,c.wood,4);
    for(let n=0;n<19;n++){
      const u=(n+.5)/19,a=at(u-.013),b=at(u+.013),m=at(u),col=[c.rose,c.ivory,c.aqua,c.red][n%4];
      const tip=[m[0]-.058*Math.cos(n*1.93),m[1]-(n%5===2?.34:.44),m[2]+.17+.049*Math.sin(n)];
      g.tri(a,b,tip,col);
      if(detail&&n%3===0)g.tri(b,tip,[m[0]+.091,m[1]-.28,m[2]+.113],n%2?c.jade:c.redDark);
    }
  }
  function icebox(g){
    const x=112.52,z=62.73;
    g.box(x,ground+.224,z,.64,.405,.400,c.rose);g.box(x,ground+.437,z,.67,.073,.421,c.ivory);
    g.box(x,ground+.324,z-.213,.112,.071,.026,c.steel);g.box(x,ground+.230,z-.219,.267,.054,.021,c.pale);
    for(const a of [-1,1])g.pole([x+a*.338,ground+.29,z-.102],[x+a*.338,ground+.28,z+.102],.016,c.light,6);
  }
  function siteMesh(g,level){
    pavement(g,level===2);streetPlaque(g,level>0);tent(g,level===2);flagline(g,level===2);
    if(level===0)return;
    measuringStaff(g,level===2);
    for(const [x,z,yaw] of chairs)chair(g,x,z,yaw);
    if(level===2){
      icebox(g);
      for(const [i,[x,z]] of [[115.15,49.23],[122.58,49.38]].entries()){
        const board=panel(x,ground+.61,z,-.15);
        face(g,board,0,0,.47,.30,c.dark);face(g,board,0,0,.41,.25,c.line,.005);
        for(const s of [-1,1])g.pole(board(.18*s,-.47,-.12),board(.17*s,.11),.018,c.steel,5);
        numeral(g,board,0,-.052,0,.065,c.dark,.013);numeral(g,board,i+1,.052,0,.065,c.dark,.013);
      }
      for(const p of [display,second])for(const side of [-1,1]){
        const x=p.x+side*2.85;
        groundLine(g,[[x-.19,p.z-.18],[x+.19,p.z+.18]],.043,c.faded);
      }
    }
  }
  const colors={
    celia:["#ad7354","#377c71","#3e5459"],nico:["#976044","#f1d3a3","#654c4b"],judge:["#734a3b","#a45c49","#394b51"],
    chalker:["#cb926c","#829b9a","#665a4f"],fan:["#825342","#edbb74","#735660"],photographer:["#ba876e","#a86f78","#435d65"]
  };
  const trims={celia:"#f5d18f",nico:"#985246",judge:"#efc998",chalker:"#c3d2bb",fan:"#ede2b9",photographer:"#dfbdaf"};
  const names=["Celia Reyes","Nico Paz","Mari Solis","Teo Mejía","Elsa Vidal","Bea Rivera"];
  const roles=Object.keys(colors),idleActions=["guide","wave","idle","chalk","idle","photo"];
  function cast(){
    const home=[celia,nico,...crowd];
    return roles.map((role,i)=>({...home[i],id:role,role,name:names[i],action:idleActions[i]}));
  }
  function dress(rig,role){
    if(!colors[role]||rig.brisasWear===role)return;
    const g=new BayMesh(),groups=[];
    const part=(group,side=1)=>groups.push({group,side,first:g.vertices.length/6});
    const trim=trims[role],cloth=colors[role][1];
    const headBowl=(x,y,z,rx,rz,h,col)=>{
      const levels=[[-.5,.84],[-.23,1],[.17,.98],[.39,.82],[.50,.58]];
      const ring=(l,i)=>[x+Math.cos(i*tau/12)*rx*l[1],y+l[0]*h,z+Math.sin(i*tau/12)*rz*l[1]];
      for(let j=1;j<levels.length;j++)for(let i=0;i<12;i++)g.quad(ring(levels[j-1],i),ring(levels[j-1],i+1),
        ring(levels[j],i+1),ring(levels[j],i),col);
      poly(g,Array.from({length:12},(_,i)=>ring(levels.at(-1),i)),col);
    };
    part("head");
    if(role==="celia"){
      headBowl(-.009,1.723,-.022,.117,.118,.116,"#473832");
      headBowl(.015,1.653,-.113,.073,.066,.102,"#513c34");
      g.cyl(0,1.703,-.016,.115,.116,.024,15,c.red);g.box(-.098,1.700,-.052,.039,.058,.059,c.rose,-.35);
      for(const d of [-1,1])for(let k=0;k<9;k++){
        const p=i=>[d*(.096+.013*Math.cos(i*tau/9)),1.598+.025*Math.sin(i*tau/9),.006+.017*Math.cos(i*tau/9)];
        g.pole(p(k),p(k+1),.0036,c.brass,5);
      }
    }else if(role==="nico"){
      headBowl(-.006,1.719,-.013,.114,.113,.137,"#433936");
      headBowl(-.031,1.749,.053,.081,.068,.088,"#51413a");
      g.pole([-.049,1.588,.097],[.044,1.587,.099],.0075,"#493b37",6);
    }else if(role==="judge"||role==="chalker"){
      g.cyl(0,1.722,-.009,.087,.117,.110,12,role==="judge"?c.redDark:c.jade);
      g.box(0,1.680,.092,.191,.020,.116,role==="judge"?c.redDark:c.jade);
      g.box(0,1.714,.100,.038,.021,.008,trim);
    }else{
      headBowl(0,1.714,-.017,.114,.113,.136,role==="fan"?"#463237":"#745345");
      headBowl(-.008,1.635,-.094,.079,.079,.166,role==="fan"?"#49383b":"#6e5044");
      if(role==="photographer")g.cyl(0,1.707,-.010,.117,.117,.018,14,c.ivory);
    }
    part("body");
    const front=(u,v,d=0)=>[u,v,.128+d],back=(u,v,d=0)=>[u,v,-.125-d];
    path(g,front,[[-.145,1.40],[-.064,1.364],[0,1.293],[.062,1.364],[.145,1.4]],.013,trim,.004);
    if(role==="celia"||role==="nico"){
      for(const s of [-1,1]){
        poly(g,[[s*.126,1.429],[s*.061,1.441],[s*.016,1.365],[s*.072,1.384]].map(q=>front(...q,.008)),trim);
        path(g,back,[[s*.149,1.393],[s*.098,1.358],[s*.045,1.353]],.013,trim,.004);
        path(g,front,[[s*.139,1.115],[s*.082,1.078]],.009,trim,.002);
      }
      path(g,front,[[0,1.342],[.005,1.012]],.009,trim,.003);
      const badge=(u,v,d=0)=>back(u*.125,1.267+v*.106,d);
      poly(g,diamond.map(([x,y])=>badge(x,y,.006)),trim);
      poly(g,diamond.map(([x,y])=>badge(x*.85,y*.78,.007)),role==="celia"?c.jade:c.redDark);
      path(g,badge,[[-.70,-.13],[-.38,-.02],[-.19,.39],[-.21,-.07],[.02,.01],[.42,.21],[.54,.15],[.38,-.09],[.62,-.13]],.095,trim,.009);
      g.box(-.075,1.331,.142,.071,.027,.007,trim);
      if(role==="nico"){g.box(.10,1.310,.13,.079,.063,.010,"#c69d75");g.box(.112,1.339,.142,.012,.037,.006,c.dark);}
      for(const s of [-1,1]){part("arm",s);g.box(s*.225,1.28,-.003,.140,.021,.150,trim);}
    }else if(role==="photographer"){
      path(g,front,[[-.143,1.414],[.116,1.066]],.021,c.dark,.018);
    }else if(role==="judge"){
      face(g,front,0,1.28,.102,.100,trim,.004);face(g,front,0,1.28,.078,.074,c.redDark,.007);
    }else if(role==="chalker"){
      face(g,front,-.083,1.29,.092,.088,trim,.004);g.box(-.076,1.33,.141,.008,.049,.008,c.red);
    }else{
      for(const y of [1.307,1.247,1.187])face(g,front,0,y,.282,.013,trim,.004);
    }
    const all=new Float32Array(rig.rest.length+g.vertices.length);all.set(rig.rest);all.set(g.vertices,rig.rest.length);
    for(let i=0;i<groups.length;i++){
      const {group,side,first}=groups[i],end=groups[i+1]?.first??g.vertices.length/6;
      for(let j=first;j<end;j++)rig.bindings.push(rig.binding(group,rig.sides[side<0?0:1],g.vertices[j*6+1]));
    }
    rig.rest=all;rig.vertices=all.slice();rig.lastRevision=-1;rig.brisasWear=role;
  }
  function farPerson(g,role){
    const [skin,top,pants]=colors[role];
    for(const side of [-1,1]){
      g.pole([side*.11,.12,0],[side*.09,.93,0],.076,pants,5);
      g.pole([side*.221,1.013,.067],[side*.192,1.40,0],.055,skin,5);
    }
    g.cyl(0,1.19,0,.205,.168,.458,7,top);g.box(0,1.61,0,.184,.220,.185,skin);
    g.cyl(0,1.716,-.014,.086,.110,.078,8,role==="judge"?c.redDark:role==="chalker"?c.jade:"#503c37");
    if(role==="celia"||role==="photographer")g.cyl(0,1.702,-.014,.114,.114,.023,10,role==="celia"?c.red:c.ivory);
  }
  function reach(limb,target){
    const a=limb.shoulder,k=limb.elbow,b=limb.hand,delta=target.map((v,i)=>v-a[i]),len=Math.hypot(...delta)||.001;
    const axis=delta.map(v=>v/len),l=limb.arm.length,r=limb.forearm.length,n=clamp(len,.065,l+r-.002);
    const m=(l*l-r*r+n*n)/(2*n),bend=Math.sqrt(Math.max(0,l*l-m*m));
    const outward=[limb.side*.69,-.79,-.27],dot=axis.reduce((sum,v,i)=>sum+v*outward[i],0);
    const perp=outward.map((v,i)=>v-axis[i]*dot),mag=Math.hypot(...perp)||1;
    for(let i=0;i<3;i++){b[i]=a[i]+axis[i]*n;k[i]=a[i]+axis[i]*m+perp[i]*bend/mag;}
    limb.arm.aim(a,k);limb.forearm.aim(k,b);
  }
  function gestures(action,t,side){
    const wave=Math.sin(t*3.42),beat=Math.sin(t*2.78);
    switch(action){
      case "wave":return side===1?[.30+.09*wave,1.65+.039*beat,.16]:null;
      case "flag":case "guide":return side===1?[.32+.075*beat,1.30+.16*wave,.32+.063*beat]:[-.26,1.14,.15];
      case "cheer":return [side*(.26+.056*Math.sin(t*4.45+side)),1.75+.094*Math.sin(t*4.45+side*.45),.10];
      case "judge":return side===1?[.28,1.57+.015*beat,.20]:[-.18,1.11,.16];
      case "chalk":return side===1?[.093+.055*wave,1.220+.030*beat,.31]:[-.120,1.17,.30];
      case "photo":return [side*(side===1?.082:.094),1.57+.009*beat,.185];
      default:return null;
    }
  }
  function actionFor(a){
    if(a.motion?.ride||a.ride&&a.seat>0)return "ride";
    return a.action||"idle";
  }
  function pose(rig,a,t,action=actionFor(a)){
    const frame=Math.floor(t*(action==="walk"||action==="ride"?60:25));
    if(rig.brisasFrame===frame&&rig.brisasAction===action&&rig.brisasMotion===a.motion)return false;
    const motion=a.motion||(rig.brisasIdle??=new BayPlayerMotion());
    if(!a.motion)motion.step(Math.min(.12,Math.max(0,t-(rig.brisasTime??t))),0,0);
    if(rig.brisasAction!==action&&rig.brisasHands){
      rig.brisasBlend=action==="ride"?null:{start:t,from:rig.brisasHands};
    }
    rig.brisasTime=t;rig.brisasFrame=frame;rig.brisasAction=action;rig.brisasMotion=a.motion;
    rig.lastRevision=-1;rig.update(motion);
    const blend=rig.brisasBlend,amt=blend?clamp((t-blend.start)/.24,0,1):1,ease=amt*amt*(3-2*amt);
    if(amt===1)rig.brisasBlend=null;
    const points=[];let posed=false;
    for(const [i,limb] of rig.sides.entries()){
      const target=gestures(action,t+(roles.indexOf(a.role)+1)*.64,limb.side),rest=limb.forearm.map(limb.handPivot,[]);
      if(target||amt<1){
        const to=target||rest;
        reach(limb,amt===1?to:to.map((v,j)=>blend.from[i][j]+(v-blend.from[i][j])*ease));posed=true;
      }
      points.push(limb.forearm.map(limb.handPivot,[]));
    }
    rig.brisasHands=points;
    if(posed)rig.skin();
    return true;
  }
  function worldPoint(a,q){
    const co=Math.cos(a.yaw||0),si=Math.sin(a.yaw||0);
    return [a.x+co*q[0]+si*q[2],(a.y??ground)+q[1],a.z-si*q[0]+co*q[2]];
  }
  function hand(rig,side){const limb=rig.sides[side<0?0:1];return limb.forearm.map(limb.handPivot,[]);}
  function actorProps(list,rig,a,t,state){
    const ac=actionFor(a),yaw=a.yaw||0;
    if(ac==="judge"){
      const p=worldPoint(a,hand(rig,1)),score=String(clamp(Math.round(Number(state.score)||0),0,100));
      list.push([name("paddle"),...p,yaw]);
      for(const az of [yaw,yaw+pi])for(let i=0;i<score.length;i++){
        const u=(i-(score.length-1)/2)*.071;
        list.push([name("paddle-digit-"+score[i]),p[0]-Math.cos(az)*u,p[1],p[2]+Math.sin(az)*u,az]);
      }
    }else if(ac==="guide"||ac==="flag"||ac==="chalk"||ac==="photo"){
      const p=worldPoint(a,hand(rig,1));
      if(ac==="photo"){
        const l=worldPoint(a,hand(rig,-1));for(let j=0;j<3;j++)p[j]=(p[j]+l[j])*.5;
      }
      if(ac==="chalk")list.push([name("slate"),...worldPoint(a,hand(rig,-1)),yaw]);
      const prop=ac==="chalk"?"chalk":ac==="photo"?"camera":"flag";
      list.push([name(prop),...p,yaw,0,prop==="flag"?.14*Math.sin(t*3.12):0]);
    }
  }
  function paddle(g){
    const plane=panel(0,0,.014,0);
    g.box(0,.102,0,.049,.246,.036,c.wood);
    for(const d of [-.037,.012])disc(g,plane,0,.28,.140,.157,c.ivory,d,15);
    disc(g,plane,0,.28,.120,.137,c.redDark,.015,15);
    const other=panel(0,0,-.026,pi);disc(g,other,0,.28,.119,.136,c.redDark,.006,15);
  }
  function flag(g){
    g.pole([0,-.063,0],[.019,.344,.030],.013,c.wood,6);
    g.quad([.016,.329,.030],[.233,.300,.056],[.207,.169,.040],[.009,.189,.018],c.rose);
    g.tri([.229,.299,.056],[.364,.263,.019],[.206,.168,.040],c.red);
    g.pole([.020,.303,.032],[.207,.276,.055],.006,c.ivory,5);
  }
  const rigs=new Map();
  function install(model){
    rigs.clear();
    for(let level=0;level<3;level++)model(name("lot-"+level),g=>siteMesh(g,level));
    for(const role of roles)model(name("far-"+role),g=>farPerson(g,role));
    model(name("paddle"),paddle);
    for(let n=0;n<=9;n++)model(name("paddle-digit-"+n),g=>numeral(g,panel(0,0,.039,0),n,0,.28,.058,c.pale,.005));
    model(name("flag"),flag);model(name("chalk"),g=>g.box(0,.017,.029,.017,.021,.081,c.pale));
    model(name("slate"),g=>{g.box(.118,.025,.039,.296,.176,.021,c.wood);g.box(.118,.025,.026,.263,.148,.009,c.jade);
      for(const x of [.045,.096,.147])g.pole([x,-.002,.019],[x+.023,.052,.019],.005,c.ivory,5);});
    model(name("camera"),g=>{g.box(0,.019,.064,.172,.094,.065,c.black);
      g.pole([0,.023,.08],[0,.023,.145],.044,c.dark,10);g.pole([0,.023,.145],[0,.023,.151],.034,"#708c8c",10);
      g.box(-.042,.078,.047,.052,.034,.047,c.steel);});
    for(const [id,col] of [["live",c.jade],["record",c.red]]){
      const f=panel(0,0,0,gauge.yaw);
      model(name(id),g=>{g.box(0,0,0,.25,.042,.25,col,gauge.yaw);
        face(g,f,0,0,.23,.044,col,.144);face(g,f,.135,0,.078,.066,col,.142);
        poly(g,[f(.11,-.042,.148),f(.19,0,.148),f(.11,.042,.148)],col);});
    }
    for(const [id,col] of [["amber","#fff0a8"],["coral","#ffbc85"]]){
      model(name(id),g=>disc(g,panel(0,0,0,gauge.yaw),.27,0,.052,.056,col,.085,10));
    }
    for(let n=0;n<10;n++)model(name("digit-"+n),g=>numeral(g,panel(0,0,0,gauge.yaw),n,0,0,.046,c.pale,.072));
  }
  function actors(list,see,t,state,view){
    if(!state.actors)return;
    for(const a of state.actors){
      const role=a.role||a.id;
      if(a.hidden||a.seat>=.999||!colors[role]||!see(a,87))continue;
      const y=(a.y??ground)+(a.motion?.lift||0);
      if(!view||!see(a,28)){list.push([name("far-"+role),a.x,y,a.z,a.yaw]);continue;}
      const key=name("player-"+role);
      let rig=rigs.get(key);
      if(!rig){rig=new BayPlayerMesh(colors[role],"local");dress(rig,role);view.add(key,rig,true);rigs.set(key,rig);}
      if(pose(rig,a,t))view.updateAnimated(key);
      list.push([key,a.x,y,a.z,a.yaw]);actorProps(list,rig,a,t,state);
    }
  }
  function lightOn(lights,i){
    if(Array.isArray(lights))return !!lights[i];
    return i<clamp(Number(lights)||0,0,3);
  }
  function inches(value){return clamp(Math.round((Number(value)||0)/.0254),0,999);}
  function world(list,see,t=0,state={},view){
    actors(list,see,t,state,view);
    if(!see(site.center,235))return;
    const level=see(site.center,39)?2:see(site.center,92)?1:0;
    list.push([name("lot-"+level),0,0,0]);if(level===0)return;
    for(const [id,value] of [["live",state.height],["record",state.best]]){
      if(id==="record"&&!(value>0))continue;
      list.push([name(id),gauge.x,ground+clamp(Number(value)||0,.012,2.7432),gauge.z]);
    }
    for(let i=0;i<3;i++)if(lightOn(state.lights,i))
      list.push([name(i%2?"coral":"amber"),gauge.x,ground+.62+i*.27,gauge.z,0,0,0,.78]);
    if(level===2){
      const n=String(inches(state.best)).padStart(2,"0");
      for(const az of [0,pi]){
        const f=az?panel(gauge.x,ground,gauge.z,gauge.yaw+pi):staffPlane;
        for(let i=0;i<n.length;i++){
          const p=f(.162+(i-(n.length-1)*.5)*.075,2.97);
          list.push([name("digit-"+n[i]),...p,az]);
        }
      }
    }
  }
  function mapShape(ctx,points,col){
    ctx.fillStyle=col;ctx.beginPath();points.forEach(([x,z],i)=>i?ctx.lineTo(x,z):ctx.moveTo(x,z));ctx.closePath();ctx.fill();
  }
  function mapRect(ctx,x,z,w,d,color){ctx.fillStyle=color;ctx.fillRect(x-w/2,z-d/2,w,d);}
  function mapDot(ctx,x,z,r,color){ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,z,r,0,tau);ctx.fill();}
  function openTent(opt){
    const x=opt.player?.x??opt.cx,z=opt.player?.z??opt.cz;
    return Math.hypot(x-nico.x,z-nico.z)<6.65;
  }
  function lotPlan(ctx,detail){
    mapShape(ctx,lotOutline,c.asphalt);mapShape(ctx,[[133.60,53.78],[138.27,54.96],[138.27,59.63],[133.70,60.9]],"#bdb4a1");
    mapShape(ctx,[[104.2,63.86],[108.63,63.85],[113.83,66.20],[110.16,66.20]],c.asphalt);
    mapRect(ctx,pad.x,pad.z,8.65,3.98,c.repair);
    for(const [p,w,d,ink] of [[pad,8.22,3.82,c.line],[display,6.46,3.36,c.faded],[second,6.46,3.36,c.faded]]){
      for(const x of [-1,1])for(const z of [-1,1]){
        const xx=p.x+x*w/2,zz=p.z+z*d/2;canvasLine(ctx,[[xx-x*.87,zz],[xx,zz],[xx,zz-z*.87]],.08,ink);
      }
    }
    if(detail){
      for(const z of [56.35,58.05]){
        canvasLine(ctx,[[116.1,z-.27],[115.61,z-.27],[115.61,z+.27],[116.1,z+.27]],.073,c.line);
      }
      BayCutArt.signText({quad:(a,b,c,d,col)=>mapShape(ctx,[a,b,c,d],col)},"HOP LINE",.064,c.faded,(u,v)=>[116.73-v,pad.z+u]);
      for(const x of [123.25,126.35])canvasLine(ctx,[[x+.31,56.91],[x,57.18],[x+.31,57.45]],.08,c.line);
      for(const [x,z] of [[115.85,56.39],[115.85,58.01],[120.10,56.39],[120.10,58.01]])
        for(const u of [-.16,.14])mapRect(ctx,x+u,z,.033,.54,c.faded);
      mapRect(ctx,103.13,57.3,.29,5.08,c.jade);mapRect(ctx,103.21,57.3,.08,4.65,c.line);
      for(const [x,z,yaw] of chairs){
        ctx.save();ctx.translate(x,z);ctx.rotate(yaw);mapRect(ctx,0,0,.51,.56,c.steel);mapRect(ctx,0,.03,.43,.42,c.aqua);
        mapRect(ctx,0,.23,.47,.10,c.jade);ctx.restore();
      }
      mapRect(ctx,131,52.1,.15,1.38,c.redDark);
      canvasLine(ctx,[[107.26,49.06],[118.44,49.15],[129.62,49.06]],.033,c.wood);
      for(let i=0;i<19;i++){
        const x=107.26+(i+.5)/19*22.36,z=49.06+.09*Math.sin((i+.5)/19*pi);
        mapShape(ctx,[[x-.29,z],[x+.29,z],[x-.04,z+.22]],[c.rose,c.ivory,c.aqua,c.red][i%4]);
      }
      mapRect(ctx,112.52,62.73,.67,.42,c.rose);mapRect(ctx,112.52,62.73,.61,.36,c.ivory);
    }
    mapDot(ctx,gauge.x,gauge.z,.25,c.redDark);mapRect(ctx,gauge.x,gauge.z,.19,.27,c.ivory);
  }
  let lotPrint;
  function plan(ctx,detail,state,open,lowDetail){
    if(detail&&lowDetail){
      lotPrint??=BayMapSheet(101.9,47.8,37,19,20,c=>lotPlan(c,true));
      lotPrint(ctx);
    }else lotPlan(ctx,detail);
    for(let i=0;i<3;i++)mapDot(ctx,gauge.x-.27+i*.18,gauge.z+.17,.061,lightOn(state.lights,i)?c.pale:c.brass);
    if(open){
      for(const x of [127.77,131.23])for(const z of [60.60,63.13])mapDot(ctx,x,z,.065,c.light);
      for(let i=0;i<7;i++)mapRect(ctx,129.5-1.955+(i+.5)*3.91/7,63.23,3.91/7+.004,.28,i%2?c.ivory:c.jade);
      mapRect(ctx,129.5,61.52,2.11,.86,c.wood);mapRect(ctx,129.5,61.12,1.38,.095,c.red);
      mapRect(ctx,128.9,61.47,.38,.275,c.dark);mapRect(ctx,128.9,61.47,.315,.216,c.ivory);
      for(let i=0;i<3;i++)mapDot(ctx,129.84+i*.125,61.61,.049,[c.red,c.aqua,c.brass][i]);
    }else{
      for(let i=0;i<7;i++)mapRect(ctx,129.5-1.955+(i+.5)*3.91/7,61.865,3.91/7+.004,2.90,i%2?c.ivory:c.jade);
      mapRect(ctx,129.5,61.865,3.91,.044,c.aqua);mapRect(ctx,129.5,60.41,3.91,.106,c.dark);
    }
  }
  function pin(ctx,x,y,size,label){
    ctx.save();ctx.translate(x,y);ctx.scale(size,size);
    mapShape(ctx,diamond.map(([u,v])=>[u*7.2,-v*6.4]),c.pale);
    mapShape(ctx,diamond.map(([u,v])=>[u*5.95,-v*5.10]),c.jade);
    canvasLine(ctx,[[-3.75,1.12],[-2.18,.23],[-.95,-2.16],[-1.30,.89],[.28,-.08],[1.78,-1.28],[2.88,-.74],[1.42,.88],[3.25,.56]],.89,c.pale);
    if(label){
      ctx.textAlign="left";ctx.font="bold 8px system-ui";ctx.strokeStyle=c.dark;ctx.lineWidth=2.4;ctx.fillStyle=c.pale;
      ctx.strokeText(site.name,8.7,-2);ctx.fillText(site.name,8.7,-2);
    }
    ctx.restore();
  }
  function map(ctx,opt,px,py,s,visible,t=0){
    const streetView=opt.mode==="street",atlas=opt.mode==="atlas",state=opt.brisas||{};
    if(atlas&&(opt.countyChart||opt.marina?.bayChart)||!visible(px(site.center.x),py(site.center.z),21*s+10))return;
    ctx.save();ctx.translate(px(0),py(0));ctx.scale(s,-s);plan(ctx,streetView&&s>3,state,streetView&&openTent(opt),streetView&&opt.lowDetail&&s<=16);ctx.restore();
    if(!streetView)pin(ctx,px(desk.x),py(desk.z),atlas?1.10:.82,atlas);
  }
  function mapActors(ctx,opt,px,py,s,visible,t=0){
    const state=opt.brisas;if(opt.mode!=="street"||!state?.actors)return;
    ctx.save();ctx.translate(px(0),py(0));ctx.scale(s,-s);ctx.lineCap="round";ctx.lineJoin="round";
    for(const a of state.actors){
      const role=a.role||a.id,cols=colors[role];if(!cols||a.hidden||a.seat>=.999||!visible(px(a.x),py(a.z),Math.max(5,s)))continue;
      if(role==="nico"&&!openTent(opt)&&Math.abs(a.x-nico.x)<1.65&&Math.abs(a.z-nico.z)<1.16)continue;
      const active=actionFor(a),time=t+(roles.indexOf(role)+1)*.64;
      ctx.save();ctx.translate(a.x,a.z);ctx.rotate(-(a.yaw||0));
      ctx.fillStyle="rgba(37,42,37,.26)";ctx.beginPath();ctx.ellipse(.082,-.134,.32,.28,.25,0,tau);ctx.fill();
      for(const side of [-1,1]){
        const step=a.motion?.feet?.[side<0?0:1]?.z||side*.038;
        mapRect(ctx,side*.133,-.085+step,.13,.265,cols[2]);mapRect(ctx,side*.133,.020+step,.128,.092,c.ivory);
        const target=gestures(active,time,side),x=target?target[0]:side*.235,z=target?target[2]:.074;
        canvasLine(ctx,[[side*.14,-.02],[side*.235,.004],[x,z]],.103,cols[0]);
        canvasLine(ctx,[[side*.145,-.02],[side*.222,.01]],.126,cols[1]);
        if(side===1&&active==="judge")mapDot(ctx,x,z+.09,.095,c.ivory);
        if(side===1&&(active==="guide"||active==="flag"))mapShape(ctx,[[x,z],[x+.24,z+.09],[x+.37,z+.005],[x+.15,z-.044]],c.rose);
        if(side===1&&active==="chalk"){mapRect(ctx,.003,.277,.23,.085,c.jade);mapRect(ctx,.084,.30,.074,.025,c.pale);}
      }
      ctx.fillStyle=cols[1];ctx.beginPath();ctx.ellipse(0,0,.246,.153,0,0,tau);ctx.fill();
      if(role==="celia"||role==="nico")canvasLine(ctx,[[-.149,-.056],[-.034,-.082],[.126,-.07]],.020,trims[role]);
      mapDot(ctx,0,.030,.120,cols[0]);mapDot(ctx,-.006,-.011,.111,role==="judge"?c.redDark:role==="chalker"?c.jade:"#584136");
      if(role==="celia"||role==="photographer")canvasLine(ctx,[[-.088,.012],[0,.053],[.086,.016]],.023,role==="celia"?c.red:c.ivory);
      if(active==="photo"){mapRect(ctx,0,.216,.171,.081,c.black);mapRect(ctx,0,.268,.074,.060,c.steel);}
      ctx.restore();
    }
    ctx.restore();
  }
  window.BayBrisas={site,blocks,cameraBlocks,floor,cast,colors,dress,pose,install,world,actors,map,mapActors};
})();
