/* The Bay Cab street phones, Unit 17 and its regulars. All lettering and props are local geometry. */
(() => {
  "use strict";
  const ink="#283b39", ivory="#f5dfac", yellow="#ecaa48", brass="#ad8559", steel="#91a5a0";
  const colors={
    walt:["#aa795d","#9ba48a","#394d50"],bea:["#a57056","#db8977","#425e55"],
    otis:["#724c40","#7299a1","#4b4353"],mina:["#98644d","#d9ae6a","#354d4c"]
  };
  const roles={walt:"local",bea:"local",otis:"courier",mina:"local"};
  const stageDoor={x:11.53,z:38,yaw:-Math.PI/2},destination={walt:"luna",bea:"flowers",otis:"wheel"};
  const widths={I:.35,L:.75,M:1.18,T:.93,"1":.66," ":.50};
  // Strokes share a four-unit sign-painter's grid on enamel, metal and paper.
  const lettering={
    A:["04 20 44","13 33"],B:["04 00 30 41 32 02","32 43 34 04"],C:["40 10 01 03 14 44"],
    D:["04 00 20 41 43 24 04"],E:["40 00 04 44","02 32"],F:["40 00 04","02 32"],
    G:["40 10 01 03 14 44 42 22"],H:["00 04","02 42","40 44"],I:["20 24"],
    J:["40 43 34 14 03"],K:["00 04","40 02 44"],L:["00 04 44"],M:["04 00 22 40 44"],
    N:["04 00 44 40"],O:["10 30 41 43 34 14 03 01 10"],P:["04 00 30 41 32 02"],
    R:["04 00 30 41 32 02","22 44"],S:["40 10 01 12 32 43 34 04"],T:["00 40","20 24"],
    U:["00 03 14 34 43 40"],V:["00 24 40"],W:["00 14 22 34 40"],X:["00 44","40 04"],
    Y:["00 22 40","22 24"],Z:["00 40 04 44"],"1":["01 20 24","04 44"],"7":["00 40 14"]
  };
  const lines={};
  for(const [key,strokes] of Object.entries(lettering))
    lines[key]=strokes.map(stroke=>stroke.split(" ").map(d=>[Number(d[0])/4,1-Number(d[1])/4]));
  function stripe(g,pt,a,b,width,color){
    const dx=b[0]-a[0],dy=b[1]-a[1],f=width*.5/(Math.hypot(dx,dy)||1),x=-dy*f,y=dx*f;
    g.quad(pt(a[0]+x,a[1]+y),pt(b[0]+x,b[1]+y),pt(b[0]-x,b[1]-y),pt(a[0]-x,a[1]-y),color);
  }
  function words(g,pt,word,u,v,height,color,weight=.095){
    const cell=height*.64,gap=height*.22;
    const length=Array.from(word).reduce((n,l)=>n+cell*(widths[l]||1)+gap,-gap);
    let x=u-length/2;
    for(const char of word){
      const w=cell*(widths[char]||1);
      for(const stroke of lines[char]||[])for(let i=1;i<stroke.length;i++){
        const a=stroke[i-1],b=stroke[i];
        stripe(g,pt,[x+w*a[0],v+height*a[1]],[x+w*b[0],v+height*b[1]],height*weight,color);
      }
      x+=w+gap;
    }
  }
  function plate(g,pt,x0,y0,x1,y1,color){
    g.quad(pt(x0,y0),pt(x1,y0),pt(x1,y1),pt(x0,y1),color);
  }
  function round(g,pt,u,v,r,count,color,ry=r){
    for(let i=0;i<count;i++){
      const a=i*Math.PI*2/count,b=(i+1)*Math.PI*2/count;
      g.tri(pt(u,v),pt(u+Math.cos(a)*r,v+Math.sin(a)*ry),pt(u+Math.cos(b)*r,v+Math.sin(b)*ry),color);
    }
  }
  const front=z=>(u,y)=>[-u,y,z];
  function checker(g,pt,x,y,size,count,dark=ink){
    for(let i=0;i<count;i++)plate(g,pt,x+i*size,y+(i%2)*size,x+(i+1)*size,y+(1+i%2)*size,dark);
  }

  function phone(g){
    // An enamel double-sided flag, a cast base and a dial handset under a bent tin hood.
    g.box(0,.065,0,.68,.13,.54,"#9e9981");g.cyl(0,.18,0,.177,.23,.21,8,"#50625a");
    g.box(0,1.66,-.08,.115,3.02,.14,"#54635a");g.box(.06,1.34,-.05,.026,2.20,.025,brass);
    g.box(0,.97,0,.50,.82,.30,ink);g.box(0,1.02,.075,.456,.68,.254,"#727d67");
    g.box(0,1.20,.173,.405,.47,.135,ivory);
    const face=front(.247);
    plate(g,face,-.16,1.305,.16,1.405,"#d5a554");words(g,front(.250),"CALL",0,1.317,.070,ink);
    round(g,front(.250),.07,1.15,.073,10,steel);round(g,front(.254),.07,1.15,.034,9,ink);
    for(let i=0;i<8;i++){const k=i*.76;round(g,front(.255),.07+.052*Math.cos(k),1.15+.052*Math.sin(k),.008,4,ink);}
    g.pole([.130,1.238,.269],[.122,1.050,.281],.030,ink);
    for(const y of [1.25,1.03])g.box(.115,y,.292,.095,.059,.080,"#263433",-.11);
    const bends=[[.12,1.027,.29],[.15,.89,.31],[.121,.858,.31],[.078,.871,.305],[.048,.924,.278],[.047,.967,.233]];
    for(let i=1;i<bends.length;i++)g.pole(bends[i-1],bends[i],.008,"#343d39",4);
    g.box(0,1.485,.055,.58,.05,.53,brass);g.box(0,1.508,.058,.595,.023,.55,"#637269");
    for(const side of [-1,1])g.box(side*.269,1.40,.032,.026,.16,.39,"#758174");
    g.box(0,.746,.173,.39,.062,.074,"#bdad8d");
    for(const x of [-.140,.145])g.box(x,.733,.212,.015,.015,.008,"#655c4a");
    g.box(0,2.55,-.066,.32,.07,.095,brass);g.box(0,2.18,.28,.07,.074,.71,ink);
    g.box(0,2.99,.30,.07,.060,.77,ink);
    g.box(0,2.59,.38,.123,.79,.94,ink);g.box(0,2.59,.38,.128,.706,.876,yellow);
    for(const side of [-1,1]){
      const p=(u,y)=>[side*.066,y,.38+side*u];
      plate(g,p,-.402,2.359,.402,2.852,ivory);
      words(g,(u,y)=>[side*.068,y,.38+side*u],"BAY",0,2.595,.192,ink,.136);
      words(g,(u,y)=>[side*.068,y,.38+side*u],"CAB",0,2.387,.153,ink,.139);
      checker(g,(u,y)=>[side*.068,y,.38+side*u],-.352,2.279,.064,11);
      for(const [u,y] of [[-.37,2.815],[.37,2.815]])round(g,(x,h)=>[side*.069,h,.38+side*x],u,y,.013,5,brass);
      plate(g,(u,y)=>[side*.069,y,.38+side*u],-.411,2.848,-.334,2.858,"#a98d5e");
    }
  }
  function cabRoof(g){
    g.box(0,1.518,-.14,.88,.051,.36,"#414946");
    g.box(0,1.633,-.14,.852,.188,.323,ink);g.box(0,1.724,-.14,.765,.039,.285,brass);
    for(const sign of [-1,1]){
      const pt=(u,y)=>[-sign*u,y,-.14+sign*.164];
      plate(g,pt,-.383,1.565,.383,1.694,ivory);
      words(g,(u,y)=>[-sign*u,y,-.14+sign*.166],"BAY CAB",0,1.587,.087,ink,.15);
    }
    const trunk=(u,v)=>[u,.964-(v+2.01)*.008,v];
    words(g,trunk,"17",0,-1.795,.268,ink,.161);
  }
  function roofLamp(g,on){
    g.box(0,1.755,-.14,.66,.030,.204,on?"#ffe1a4":"#a77f59");
    for(const side of [-1,1])g.box(side*.394,1.629,-.14,.081,.115,.260,on?"#ffbf69":"#9c6348");
  }
  function decal(g,side){
    // Match the door's curved steel rather than putting a floating sign beside it.
    const s=bayCarLayout("cab"),a=s.sections[2],b=s.sections[3];
    const at=offset=>(u,y)=>{
      const z=.60+side*u,t=(z-a[0])/(b[0]-a[0]),deck=a[2]+(b[2]-a[2])*t,w=a[1]+(b[1]-a[1])*t;
      const f=Math.max(0,Math.min(1,(y-.34)/(deck-.46)));
      return [side*(w-.08+.08*f+offset-s.hingeX),y,z-s.hingeZ];
    };
    const badge=(pt,w,bottom,top,c)=>{
      const h=(top-bottom)*.21;
      plate(g,pt,-w,bottom+h,w,top-h,c);
      g.quad(pt(-w,top-h),pt(w,top-h),pt(w-.055,top),pt(-w+.055,top),c);
      g.quad(pt(-w+.055,bottom),pt(w-.055,bottom),pt(w,bottom+h),pt(-w,bottom+h),c);
    };
    badge(at(.016),.312,.462,.822,ink);badge(at(.020),.278,.482,.803,ivory);
    words(g,at(.024),"17",0,.515,.244,ink,.158);
    for(const u of [-.226,.222])plate(g,at(.026),u-.021,.633,u+.021,.662,brass);
  }

  function theaterDoor(g){
    // A shallow ticket-lobby extension joins the masonry behind the existing west marquee.
    const tile="#655f59",jade="#49756d",iron="#374a47";
    for(const side of [-1,1]){
      g.box(side*1.01,1.32,-1.47,.16,2.64,3.02,"#af8d79");
      g.box(side*1.075,.36,-1.46,.066,.68,2.99,tile);
      g.box(side*1.075,.723,-1.45,.048,.04,2.99,brass);
      for(const z of [-.35,-.99,-1.63,-2.27,-2.83])g.box(side*1.110,.35,z,.012,.65,.015,"#86776a");
    }
    g.box(0,2.61,-1.43,2.18,.18,3.04,"#a68371");g.box(0,2.51,-1.43,2.08,.045,3.04,iron);
    g.box(0,1.23,-.11,1.99,2.46,.075,iron);
    for(const side of [-1,1]){
      const x=side*.454;
      g.box(x,1.147,-.036,.897,2.25,.095,jade);
      g.box(x,1.423,.016,.726,1.378,.035,brass);g.box(x,1.420,.037,.672,1.317,.019,"#365652");
      g.box(x,1.390,.050,.588,1.210,.008,"#456b63");
      const pane=front(.056),u=-x;
      g.quad(pane(u-.284,1.78),pane(u+.28,1.96),pane(u+.28,2.00),pane(u-.284,1.82),"#83a08c");
      g.quad(pane(u-.284,1.63),pane(u+.28,1.81),pane(u+.28,1.825),pane(u-.284,1.645),"#789887");
      g.box(x,.326,.025,.717,.40,.032,"#51685d");g.box(x,.140,.044,.67,.144,.019,"#b39e76");
      for(const y of [.90,1.23])g.pole([side*.128,y,.05],[side*.128,y,.147],.023,brass,6);
      g.pole([side*.128,.885,.148],[side*.128,1.249,.148],.030,"#dac080",7);
      g.box(side*.98,1.220,.052,.166,2.456,.163,ivory);
      g.box(side*.98,1.266,.141,.044,2.37,.020,"#c68a77");
    }
    g.box(0,2.32,.073,2.18,.218,.19,iron);
    g.box(0,2.322,.170,.98,.174,.018,ivory);
    words(g,front(.182),"LOBBY",0,2.271,.105,jade,.14);
    g.box(0,2.516,.15,2.29,.092,.32,brass);
    g.box(0,.034,.141,2.14,.068,.58,"#c4aa8a");g.box(0,.015,.588,1.69,.03,.46,"#736657");
    for(const x of [-.73,-.55,-.37,-.19,-.01,.17,.35,.53,.71])g.box(x,.034,.588,.023,.006,.385,"#94806a");
    // The program lives on a folding sidewalk easel just south of the entrance.
    const x=-2.04,z=.55;
    for(const side of [-1,1]){
      g.pole([x+side*.35,.045,z+.185],[x+side*.308,1.38,z-.03],.031,brass,5);
      g.pole([x+side*.35,.045,z-.38],[x+side*.308,1.38,z-.03],.029,"#7e745a",5);
    }
    g.box(x,.249,z-.035,.65,.04,.035,brass);g.box(x,.853,z+.006,.695,.966,.087,iron);
    g.box(x,.854,z+.057,.648,.90,.020,ivory);
    g.box(x,1.346,z+.031,.738,.044,.133,"#c2a16e");
    g.box(x,.367,z+.068,.713,.041,.119,brass);
    // The box-office sockets remain visible even in daylight when the marquee lights recede.
    for(const x of [-.94,-.71,-.48,.48,.71,.94])g.box(x,2.357,.182,.099,.094,.065,"#997b5c");
  }
  const program=(u,y)=>[-2.04-u,y,.631];
  function programPrint(g,doubleBill){
    const p=program,sky=doubleBill?"#514957":"#cf8169";
    plate(g,p,-.290,.437,.290,1.275,"#f2d9a2");
    const image=(u,y)=>{const a=p(u,y);a[2]+=.003;return a;};
    plate(g,image,-.253,.714,.253,1.206,sky);
    const over=(u,y)=>{const a=p(u,y);a[2]+=.006;return a;};
    if(doubleBill){
      round(g,over,-.101,1.091,.079,12,"#dca76c");
      stripe(g,over,[-.253,1.148],[.253,1.022],.009,"#eed296");
      stripe(g,over,[.021,.976],[.101,1.083],.012,"#cfa66e");
      plate(g,over,-.197,.780,.205,.968,"#dcac6f");plate(g,over,-.213,.961,.218,.986,"#aa7261");
      const clear=(u,y)=>{const a=p(u,y);a[2]+=.008;return a;};
      for(const x of [-.161,-.056,.049])plate(g,clear,x,.863,x+.076,.947,"#535854");
      for(const x of [-.125,.115])round(g,clear,x,.773,.027,7,"#3b4946");
      stripe(g,clear,[-.225,.735],[.238,.759],.011,ivory);
      words(g,over,"AFTER THE",0,.651,.042,"#885c50",.14);
      words(g,over,"LAST TRAM",0,.558,.072,ink,.14);words(g,over,"DOUBLE BILL",0,.477,.042,"#885c50",.14);
    }else{
      round(g,over,.094,1.070,.104,14,"#ecc173");
      plate(g,over,-.253,.716,.253,.839,"#51887d");
      for(const [x,y] of [[-.149,.871],[.034,.805],[.133,.758]])
        stripe(g,over,[x-.053,y],[x+.066,y+.009],.01,"#b4c2a2");
      const a=(u,y)=>{const q=p(u,y);q[2]+=.010;return q;};
      g.quad(a(-.213,1.115),a(-.096,1.039),a(-.002,1.019),a(-.104,1.009),"#f8e6bf");
      g.tri(a(-.104,1.009),a(.042,1.040),a(.172,1.127),"#f8e6bf");
      g.tri(a(-.087,1.018),a(-.137,.979),a(-.199,.969),"#3d5853");
      words(g,over,"THE LAST",0,.614,.052,"#865c4c",.14);words(g,over,"PELICAN",0,.491,.080,ink,.14);
    }
    for(const x of [-.94,-.71,-.48,.48,.71,.94]){
      const lit=x<0||doubleBill;g.box(x,2.358,.223,.063,.065,.027,lit?"#ffe2a3":"#b69a74");
    }
  }

  function cylinderFace(g,x,y,z,r,thick,edge,face){
    // A closed vertical tin or drum case with its lid facing the side of the carrier.
    const xy=(u,h)=>[x+thick/2,y+h,z+u];
    const opposite=(u,h)=>[x-thick/2,y+h,z+u];
    round(g,xy,0,0,r,18,face);round(g,opposite,0,0,r,18,face);
    for(let i=0;i<18;i++){
      const a=i*Math.PI/9,b=(i+1)*Math.PI/9,u1=r*Math.cos(a),v1=r*Math.sin(a),u2=r*Math.cos(b),v2=r*Math.sin(b);
      g.quad(xy(u1,v1),xy(u2,v2),opposite(u2,v2),opposite(u1,v1),edge,.89+.12*Math.sin(a));
    }
  }
  function filmTin(g){
    for(const side of [-1,1])g.pole([-.012,-.018,side*.045],[-.035,-.101,side*.074],.012,"#655e52",5);
    cylinderFace(g,-.033,-.285,0,.216,.105,"#778e8e","#a7b9ae");
    for(const side of [-1,1]){
      const p=(u,y)=>[-.033+side*.055,y,u];
      round(g,p,0,-.285,.199,18,"#788e8a");
      const a=(u,y)=>[-.033+side*.057,y,u];round(g,a,0,-.285,.186,18,"#c2cabc");
      const b=(u,y)=>[-.033+side*.059,y,u];round(g,b,0,-.285,.149,16,"#9fb0a4");
      const c=(u,y)=>[-.033+side*.061,y,u];round(g,c,0,-.285,.137,16,"#b7c0b0");
      g.quad(c(-.083,-.292),c(.078,-.28),c(.073,-.238),c(-.088,-.25),"#e1cc9a");
    }
    g.box(-.038,-.103,.091,.11,.049,.043,brass);
  }
  const flowers=[[-.065,.322,.039,"#dbbd66"],[.037,.37,.018,"#bd6e68"],[-.018,.409,-.025,"#eee0ac"],
    [.083,.302,-.024,"#db9e72"],[-.084,.356,-.051,"#bf7e75"],[.013,.316,.083,"#e8c983"]];
  function bunch(g,x,y,z,k=1){
    const p=(u,h,v)=>[x+u*k,y+h*k,z+v*k];
    g.cyl(x,y+.114*k,z,.083*k,.020*k,.252*k,6,"#c5a477");
    g.tri(p(-.08,.14,.036),p(.09,.23,.04),p(.068,.290,.017),"#e1bb83");
    g.tri(p(-.018,-.036,.013),p(-.086,.247,-.036),p(.029,.20,-.073),"#ddba83");
    g.cyl(x,y+.057*k,z,.038*k,.034*k,.022*k,6,"#897c59");
    for(const [u,h,v,col] of flowers){
      g.pole(p(u*.42,.209,v*.42),p(u,h,v),.005*k,"#657c54",4);
      g.tri(p(u*.45,.196,v*.4),p(u*1.35-.025,.294,v+.025),p(u*.71,.252,v*.7),"#6b865b");
      g.cyl(x+u*k,y+h*k,z+v*k,.039*k,.016*k,.043*k,6,col);
      g.cyl(x+u*k,y+(h+.021)*k,z+v*k,.013*k,.010*k,.011*k,5,"#d2a45c");
    }
  }
  function snareCase(g){
    g.pole([-.018,-.01,-.068],[-.018,-.084,-.089],.016,"#a77952",5);
    g.pole([-.018,-.01,.068],[-.018,-.084,.089],.016,"#a77952",5);
    g.pole([-.018,-.010,-.069],[-.018,-.010,.069],.018,brass,5);
    cylinderFace(g,-.035,-.321,0,.250,.156,"#a78260","#4a615b");
    for(const side of [-1,1]){
      const p=(u,y)=>[-.035+side*.081,y,u];
      round(g,p,0,-.321,.219,16,"#576c62");
      for(const t of [-.132,.132])stripe(g,(u,y)=>[-.035+side*.085,y,u],[t,-.470],[t,-.172],.021,"#b38f67");
      stripe(g,(u,y)=>[-.035+side*.086,y,u],[-.08,-.329],[.06,-.297],.019,"#d3bb87");
    }
    g.box(-.035,-.095,.078,.178,.031,.051,steel);
  }
  function workbench(g){
    g.box(0,.75,0,1.12,.082,.54,"#8b7b63");g.box(0,.798,0,1.152,.026,.558,"#b19371");
    for(const x of [-.477,.477])for(const z of [-.192,.192])g.box(x,.375,z,.054,.75,.054,"#52605a");
    g.box(0,.204,.17,.94,.036,.042,"#6e7365");g.box(0,.212,-.10,.87,.044,.192,"#928270");
    g.cyl(-.24,.276,-.098,.15,.15,.085,12,"#8f9d91");g.cyl(-.24,.324,-.098,.156,.156,.018,12,"#bbc0ac");
    g.box(0,.88,-.015,.59,.126,.257,"#53665f");g.box(0,.983,-.022,.197,.128,.144,ink);
    for(const x of [-.31,.32])g.pole([x*.77,.84,.008],[x,1.128,0],.032,steel,5);
    g.box(0,.920,.153,.229,.030,.108,ivory);
    stripe(g,front(.025),[-.29,.976],[.012,.947],.021,"#724e42");
    stripe(g,front(.025),[.012,.947],[.31,.984],.021,"#724e42");
  }
  function reel(g){
    const r=.165;
    for(let i=0;i<14;i++){
      const a=i*Math.PI/7,b=(i+1)*Math.PI/7;
      const ax=r*Math.cos(a),ay=r*Math.sin(a),bx=r*Math.cos(b),by=r*Math.sin(b);
      g.quad([ax,ay,.021],[bx,by,.021],[bx,by,-.021],[ax,ay,-.021],"#87908a");
    }
    for(const side of [-1,1]){
      round(g,front(side*.021),0,0,r,14,"#c4c3a8");
      for(let i=0;i<5;i++){
        const k=i*Math.PI*.4;round(g,front(side*.024),.096*Math.cos(k),.096*Math.sin(k),.037,6,"#53635e");
      }
      round(g,front(side*.027),0,0,.028,8,brass);
    }
  }
  function flowerStand(g){
    g.box(0,.231,0,1.16,.43,.57,"#8c7962");
    for(let i=0;i<4;i++)g.box(0,.097+i*.093,.292,1.19,.075,.058,i%2?"#b29473":"#a18668");
    for(const x of [-.536,.536])g.box(x,.236,.331,.072,.445,.019,"#c2a180");
    g.box(0,.468,0,1.20,.048,.61,"#c3a381");
    for(const [x,z,h,size] of [[-.37,.01,.34,.82],[.025,-.04,.395,1],[.37,.075,.255,.66]]){
      g.cyl(x,.49+h/2,z,.162,.112,h,10,"#859991");
      g.cyl(x,.49+h,z,.174,.168,.033,10,"#c3c8b1");
      g.cyl(x,.512+h,z,.146,.146,.006,10,"#516755");
      bunch(g,x,.327+h,z,size);bunch(g,x+.055,.353+h,z-.036,size*.73);
    }
    g.box(.425,.274,.348,.23,.133,.014,"#e7ce9c",-.06);
    for(const x of [.37,.409,.45])g.box(x,.278,.357,.017,.066,.008,"#806648");
  }
  function drum(g){
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;g.pole([0,.405,0],[Math.cos(a)*.36,.027,Math.sin(a)*.36],.017,steel,5);
    }
    g.pole([0,.157,0],[0,.70,0],.025,"#9aa9a1",6);
    g.cyl(0,.796,0,.284,.281,.224,14,"#ab735a");
    for(const y of [.693,.913])g.cyl(0,y,0,.294,.294,.029,14,steel);
    g.cyl(0,.932,0,.271,.271,.018,14,"#e1d1ac");
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4;g.box(Math.cos(a)*.278,.8,Math.sin(a)*.278,.043,.154,.044,"#d1c6a6",a);
    }
    g.cyl(.445,.089,-.184,.285,.25,.141,10,"#4c5e56");g.cyl(.445,.166,-.184,.260,.254,.017,10,"#9c825e");
    g.cyl(.445,.18,-.184,.232,.232,.013,10,"#394d45");
  }

  function dress(rig,id){
    if(!rig||!colors[id]||rig.cabCostume===id)return;
    const g=new BayMesh(),parts=[],mark=(part,side)=>parts.push({part,side,start:g.vertices.length/6});
    const cloth=(u,y)=>[-u,y,.126];
    if(id==="walt"){
      mark("body");
      for(const side of [-1,1]){
        g.tri(cloth(side*.035,1.389),cloth(side*.116,1.415),cloth(side*.067,1.291),"#6f7b68");
        g.box(side*.104,1.232,.125,.074,.024,.012,"#c4b993");
      }
      g.box(-.100,1.256,.128,.014,.071,.012,brass);
      for(const y of [1.062,1.17,1.278])g.box(0,y,.129,.014,.015,.009,"#5a695b");
      mark("head");g.cyl(0,1.741,-.011,.102,.112,.058,10,"#826b57");
      g.cyl(0,1.776,-.017,.054,.102,.046,10,"#99816a");
      g.box(0,1.712,.084,.183,.017,.114,"#695d4d");
      for(const x of [-.052,.052])g.box(x,1.656,.103,.071,.039,.019,"#626c64");
      g.box(0,1.660,.108,.04,.009,.012,brass);
    }else if(id==="bea"){
      mark("body");
      const apr=(u,y)=>[-u,y,.133];
      g.quad(apr(-.095,1.30),apr(.095,1.30),apr(.144,.965),apr(-.144,.965),"#557164");
      for(const side of [-1,1])stripe(g,apr,[side*.077,1.286],[side*.112,1.421],.025,"#d5bb8c");
      plate(g,(u,y)=>[-u,y,.136],-.079,1.04,.052,1.126,"#7b927a");
      g.box(0,1.022,-.107,.277,.031,.019,"#c7ad86");
      mark("head");g.cyl(0,1.719,-.008,.104,.105,.045,12,"#ce9871");
      g.cyl(-.059,1.72,-.089,.058,.058,.080,9,"#59463a");
      g.tri([-.104,1.727,-.071],[-.155,1.76,-.08],[-.139,1.706,-.086],"#e5bc83");
      g.tri([-.104,1.717,-.08],[-.144,1.684,-.103],[-.112,1.661,-.112],"#d5a173");
      for(const side of [-1,1])g.cyl(side*.107,1.602,.011,.013,.014,.032,6,"#deb977");
    }else if(id==="otis"){
      mark("body");
      for(const side of [-1,1]){
        stripe(g,cloth,[side*.119,1.408],[side*.079,1.331],.032,"#bcbaa0");
        g.box(side*.121,1.260,.128,.053,.010,.01,"#d6c69a");
      }
      mark("head");
      g.cyl(0,1.729,-.005,.130,.130,.023,12,"#5d5e53");
      g.cyl(0,1.774,-.012,.075,.105,.088,10,"#84785f");g.cyl(0,1.744,-.012,.101,.107,.027,10,"#a87960");
      for(const side of [-1,1])g.box(side*.046,1.656,.105,.070,.032,.021,ink);
      g.box(0,1.658,.109,.041,.011,.012,brass);
    }else{
      mark("body");
      for(const side of [-1,1]){
        g.tri(cloth(side*.020,1.423),cloth(side*.112,1.400),cloth(side*.055,1.329),"#b48957");
        g.box(side*.119,1.390,.123,.066,.023,.010,"#37534d");
      }
      g.box(0,1.197,.124,.014,.34,.012,"#b38d60");g.box(-.102,1.298,.132,.080,.047,.012,ivory);
      g.box(-.102,1.293,.140,.054,.009,.005,"#52655b");
      mark("head");g.cyl(0,1.755,-.012,.10,.111,.074,10,"#ba8e57");
      g.cyl(0,1.793,-.023,.066,.10,.042,10,"#ce9b61");g.box(0,1.728,.100,.184,.020,.112,ink);
      g.cyl(0,1.668,-.095,.062,.058,.10,9,"#4b3934");g.cyl(0,1.646,-.099,.053,.053,.018,8,"#c79a65");
    }
    const next=new Float32Array(rig.rest.length+g.vertices.length);
    next.set(rig.rest);next.set(g.vertices,rig.rest.length);
    for(let j=0;j<parts.length;j++){
      const part=parts[j],limb=rig.sides[part.side===1?1:0],end=parts[j+1]?.start??g.vertices.length/6;
      for(let i=part.start;i<end;i++)rig.bindings.push(rig.binding(part.part,limb,g.vertices[i*6+1]));
    }
    rig.rest=next;rig.vertices=next.slice();rig.cabCostume=id;
  }
  function atJob(p){
    const stop=BayCab.stops[destination[p.id]];
    return p.phase==="work"&&stop&&Math.hypot(p.x-stop.work.x,p.z-stop.work.z)<2.2;
  }
  function reach(limb,x,y,z){
    const a=limb.shoulder,k=limb.elbow,b=limb.hand,dx=x-a[0],dy=y-a[1],dz=z-a[2];
    const n=Math.max(.001,Math.hypot(dx,dy,dz)),ux=dx/n,uy=dy/n,uz=dz/n;
    const l=limb.arm.length,r=limb.forearm.length,d=Math.min(l+r-.005,Math.max(.06,n));
    b[0]=a[0]+d*ux;b[1]=a[1]+d*uy;b[2]=a[2]+d*uz;
    const m=(l*l-r*r+d*d)/(2*d),bend=Math.sqrt(Math.max(0,l*l-m*m));
    const ex=.59*limb.side,ey=-.75,ez=-.32,dot=ex*ux+ey*uy+ez*uz;
    const vx=ex-dot*ux,vy=ey-dot*uy,vz=ez-dot*uz,f=bend/Math.max(.001,Math.hypot(vx,vy,vz));
    k[0]=a[0]+ux*m+vx*f;k[1]=a[1]+uy*m+vy*f;k[2]=a[2]+uz*m+vz*f;
    limb.arm.aim(a,k);limb.forearm.aim(k,b);
  }
  function pose(p,t){
    const rig=p.mesh;if(!rig)return false;
    if(atJob(p)){
      for(const limb of rig.sides){
        const side=limb.side;
        if(p.id==="otis"){
          const stroke=.5+.5*Math.sin(t*7.2+side*1.51);
          reach(limb,side*.181,1.092+.129*stroke,.204+.059*(1-stroke));
        }else if(p.id==="walt"){
          const f=t*2.8+side*.35;
          reach(limb,side*.212+.021*Math.sin(f),side<0?1.063:1.138+.052*Math.cos(f),.301+.017*Math.sin(f));
        }else{
          const f=.5+.5*Math.sin(t*1.52+side*1.1);
          reach(limb,side*(.076+.092*f),1.045+.097*f,.247+.045*f);
        }
      }
    }else if(p.phase==="wait"){
      const shift=p.id==="bea"?2.7:p.id==="otis"?5.1:0,cycle=((t+shift)%9.7+9.7)%9.7;
      if(cycle>2.0)return false;
      const amount=Math.min(1,cycle/.42,(2-cycle)/.46),limb=rig.sides[1];
      const rest=limb.forearm.map(limb.handPivot,limb.hand);
      reach(limb,rest[0]+(.42+.045*Math.sin(t*8)-rest[0])*amount,
        rest[1]+(1.73+.023*Math.cos(t*8)-rest[1])*amount,rest[2]+(.164-rest[2])*amount);
    }else return false;
    rig.skin();return true;
  }
  function local(p,u,h,v){
    const angle=p.yaw||0,sn=Math.sin(angle),cs=Math.cos(angle);
    return {x:p.x+u*cs+v*sn,y:(p.y||0)+h,z:p.z-u*sn+v*cs,yaw:angle};
  }
  function rankLocation(s){
    // Face the lane, one pace down the sidewalk from the actual wait point.
    const side=s.id==="flowers"?-1:1,offset=1.18;
    const yaw=s.yaw-Math.PI/2;
    return local({...s.stand,y:.077,yaw},side*offset,0,-.11);
  }
  function hand(p,side){
    const limb=p.mesh?.sides[side===1?1:0],angle=(p.motion?.phase||0)*Math.PI*2,push=p.motion?.weight||0;
    const a=limb?limb.forearm.map(limb.handPivot,limb.hand):[side*.25,1.00+.031*push*Math.cos(angle*2),.063+side*.17*push*Math.cos(angle)];
    return local(p,a[0]+side*.018,a[1]-.041,a[2]+.018);
  }
  function holding(p){
    return !atJob(p)&&p.phase!=="booth"&&p.phase!=="ride"&&(!["in","out"].includes(p.phase)||(p.seat||0)<.56);
  }
  function forHire(city){return city.phase==="idle"&&!city.trip&&!city.booking;}
  function standPosition(p){return local(p,0,0,p.id==="walt"?.417:p.id==="bea"?.497:.490);}
  function install(model){
    model("cab-phone",phone);model("cab-roof-lettering",cabRoof);
    for(const on of [false,true])model(on?"cab-light-free":"cab-light-meter",g=>roofLamp(g,on));
    for(const side of [-1,1])model(side<0?"cab-door-left":"cab-door-right",g=>decal(g,side));
    model("cab-lobby",theaterDoor);
    model("cab-pelican-card",g=>programPrint(g,false));model("cab-tram-card",g=>programPrint(g,true));
    model("cab-held-walt",filmTin);model("cab-held-bea",g=>bunch(g,0,0,0));model("cab-held-otis",snareCase);
    model("cab-work-walt",workbench);model("cab-work-bea",flowerStand);model("cab-work-otis",drum);
    model("cab-work-reel",reel);
    model("cab-stick",g=>{g.pole([0,0,-.055],[0,-.015,.363],.0095,"#d9bc82",5);g.box(0,-.015,.36,.022,.018,.034,ivory);});
  }
  function world(view,list,see,t,clock,city,openSecond){
    const night=clock?.night||0;
    if(see(stageDoor,110)){
      list.push(["cab-lobby",stageDoor.x,.077,stageDoor.z,stageDoor.yaw],
        [openSecond?"cab-tram-card":"cab-pelican-card",stageDoor.x,.077,stageDoor.z,stageDoor.yaw,0,0,.13+.55*night]);
    }
    for(const stop of Object.values(BayCab.stops)){
      if(!see(stop.stand,104))continue;
      const p=rankLocation(stop);list.push(["cab-phone",p.x,p.y,p.z,p.yaw]);
    }
    const v=city?.vehicle;
    if(v&&see(v,100)){
      const ground=.048-(v.flatLoad||0)*.045,tilt=v.pitch||0,lean=v.lean||0,base={...v,y:ground};
      list.push(["cab-roof-lettering",v.x,ground,v.z,v.yaw,tilt,lean]);
      const free=forHire(city);
      list.push([free?"cab-light-free":"cab-light-meter",v.x,ground,v.z,v.yaw,tilt,lean,free?.32+night*.47:night*.09]);
      const s=bayCarLayout("cab"),sn=Math.sin(tilt),cs=Math.cos(tilt),roll=Math.sin(lean),level=Math.cos(lean);
      for(const side of [-1,1]){
        const x=side*s.hingeX,py=-s.hingeZ*sn,p=local(base,x*level-py*roll,x*roll+py*level,s.hingeZ*cs);
        const open=Math.max(side===v.doorSide?v.doorAngle||0:0,side===1?v.passengerDoor||0:0);
        list.push([side<0?"cab-door-left":"cab-door-right",p.x,p.y,p.z,(v.yaw||0)-side*open,tilt,lean]);
      }
    }
    for(const p of city?.people||[]){
      if(!destination[p.id]||!see(p,65))continue;
      if(holding(p)){
        const h=hand(p,-1),swing=(p.motion?.weight||0)*Math.sin((p.motion?.phase||0)*6.283);
        list.push(["cab-held-"+p.id,h.x,h.y,h.z,h.yaw,-.09*swing,p.id==="bea"?.23:0]);continue;
      }
      if(!atJob(p))continue;
      const d=standPosition(p);list.push(["cab-work-"+p.id,d.x,d.y,d.z,d.yaw]);
      if(p.id==="walt")for(const side of [-1,1]){
        const hub=local(d,side<0?-.31:.32,1.128,.016);list.push(["cab-work-reel",hub.x,hub.y,hub.z,d.yaw,0,t*(side<0?.93:1.12)]);
      }
      if(p.id==="otis")for(const side of [-1,1]){
        const h=hand(p,side),stroke=.5+.5*Math.sin(t*7.2+side*1.51);
        list.push(["cab-stick",h.x,h.y,h.z,h.yaw-side*.16,.29+.25*(1-stroke)]);
      }
    }
  }

  function drawRect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function disc(c,x,y,r,color){
    c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=color;c.fill();
  }
  function path(c,points,color,width){
    c.beginPath();c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    if(width){c.lineWidth=width;c.strokeStyle=color;c.stroke();}
    else{c.closePath();c.fillStyle=color;c.fill();}
  }
  function phoneIcon(c,x,y,r){
    c.save();c.translate(x,y);c.scale(r,r);
    path(c,[[-.97,-.63],[-.68,-.89],[.70,-.89],[.96,-.62],[.96,.63],[.65,.86],[-.68,.86],[-.97,.57]],ink);
    path(c,[[-.78,-.53],[-.58,-.70],[.57,-.70],[.77,-.50],[.77,.50],[.54,.67],[-.55,.67],[-.78,.46]],ivory);
    path(c,[[-.49,-.30],[-.33,-.45],[-.15,-.36],[-.09,-.17],[-.15,-.04],[.13,.17],[.27,.06],[.48,.18],[.42,.37],[.24,.45],[-.05,.32],[-.32,.07]],ink);
    c.restore();
  }
  function serviceIcon(c,x,y,r,a){
    c.save();c.translate(x,y);c.rotate(a||0);c.scale(r,r);
    path(c,[[-.50,-.59],[-.27,-1],[.24,-1],[.52,-.57],[.57,.66],[.35,.90],[-.33,.90],[-.57,.67]],ink);
    path(c,[[-.33,-.56],[0,-.80],[.32,-.55],[.36,.56],[-.36,.56]],yellow);
    drawRect(c,-.33,-.12,.66,.26,ivory);drawRect(c,-.16,-.12,.18,.13,ink);drawRect(c,.02,.01,.18,.13,ink);
    c.restore();
  }
  function cinemaIcon(c,x,y,r){
    c.save();c.translate(x,y);c.scale(r,r);
    disc(c,0,0,.94,ink);disc(c,0,0,.72,"#dbb487");
    for(let i=0;i<3;i++){const k=i*2.094-.42;disc(c,.35*Math.sin(k),.35*Math.cos(k),.16,ink);}
    c.restore();
  }
  function atMap(c,p,px,py,s,draw){
    c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw||0);c.scale(s,s);draw(c);c.restore();
  }
  function rankPlan(c){
    drawRect(c,-.28,-.72,.89,1.31,"#9b9277");drawRect(c,-.31,-.25,.61,.5,"#657565");
    drawRect(c,-.295,-.22,.56,.42,ivory);drawRect(c,-.33,-.27,.66,.38,ink);
    drawRect(c,-.30,-.23,.60,.29,"#c8a270");drawRect(c,-.085,-.82,.17,.94,ink);
    drawRect(c,-.10,-.78,.20,.81,yellow);drawRect(c,-.068,-.70,.133,.62,ivory);
    for(const y of [-.66,-.48,-.30])drawRect(c,-.07,y,.070,.080,ink);
  }
  function lobbyPlan(c,doubleBill){
    drawRect(c,-1.06,.02,2.12,2.95,"#9e8574");drawRect(c,-.99,.12,1.98,2.77,"#baa389");
    drawRect(c,-1.05,-.20,2.10,.29,"#b79372");drawRect(c,-.95,-.12,1.90,.085,"#4d7367");
    drawRect(c,-.83,-.79,1.66,.42,"#8e7d67");for(let x=-.72;x<=.73;x+=.18)drawRect(c,x,-.75,.025,.32,"#b19a7a");
    drawRect(c,-2.405,-.696,.73,.411,ink);drawRect(c,-2.36,-.66,.65,.28,ivory);
    drawRect(c,-2.31,-.634,.54,.197,doubleBill?"#896476":"#cf8b6c");disc(c,-2.15,-.56,.051,"#ead092");
    for(const x of [-.94,-.70,-.48,.48,.70,.94])disc(c,x,-.224,.055,x<0||doubleBill?"#ffe0a3":"#a78e71");
  }
  function movingPlan(c,free){
    drawRect(c,-.43,-.039,.86,.37,ink);drawRect(c,-.33,.045,.66,.18,free?"#ffe2a3":"#bd845f");
    for(const x of [-.402,.348])drawRect(c,x,.001,.054,.266,brass);
    const p=(x,y)=>[x,y];
    path(c,[p(-.273,1.64),p(-.140,1.48),p(-.140,1.88)],ink,.061);
    path(c,[p(-.263,1.88),p(-.045,1.88)],ink,.055);
    path(c,[p(.026,1.49),p(.285,1.49),p(.129,1.88)],ink,.065);
  }
  function handPlan(c,id){
    if(id==="bea"){
      path(c,[[-.108,.09],[.02,.167],[.20,-.17],[.003,-.23]],"#d3b182");
      for(const [u,h,v,col] of flowers)disc(c,.077+u*.83,v-.14,.063,col);
    }else{
      const tin=id==="walt";
      c.save();c.rotate(.16);drawRect(c,tin?-.103:-.123,-.247,tin?.206:.246,.494,tin?"#7d9289":brass);
      drawRect(c,-.084,-.216,.167,.432,tin?"#c3c8b1":"#4b6055");
      drawRect(c,-.09,-.086,.181,.051,tin?"#dcca99":brass);c.restore();
    }
  }
  function castPlan(c,p,t,k){
    c.save();c.scale(k,k);
    // The overhead character uses the map's slightly larger figures. Keep cuffs, hats and bags at this scale.
    const skin=colors[p.id][0],shirt=colors[p.id][1],swing=(p.motion?.weight||0)*Math.cos((p.motion?.phase||0)*Math.PI*2);
    const work=atJob(p),time=t+(p.id==="bea"?2.7:p.id==="otis"?5.1:0),wave=p.phase==="wait"&&time%9.7<2;
    for(const side of [-1,1]){
      let x=side*.38,y=-.044+side*.13*swing;
      if(work){
        x=side*(p.id==="bea"?.108:.16);y=-.21-.037*Math.sin(t*(p.id==="otis"?7.2:2.5)+side*1.51);
      }else if(wave&&side===1){
        const cycle=time%9.7,u=Math.max(0,Math.min(1,cycle/.42,(2-cycle)/.46));
        x+=u*(.135+.037*Math.sin(t*8));y-=.135*u;
      }
      path(c,[[side*.24,.010],[side*.337,-.008],[x,y]],shirt,.082);
      disc(c,x,y,.053,skin);
      if(!work&&side<0){
        c.save();c.translate(x-.046,y);c.scale(.76,.76);handPlan(c,p.id);c.restore();
      }
    }
    if(p.id==="walt"){
      disc(c,0,-.04,.148,"#866f56");drawRect(c,-.114,-.202,.228,.073,"#655e4f");
      path(c,[[-.084,-.005],[.012,-.09],[.109,-.104]],"#a0886c",.016);
    }else if(p.id==="bea"){
      disc(c,-.076,.072,.077,"#553f34");
      path(c,[[-.128,-.003],[-.092,-.117],[0,-.164],[.103,-.112],[.139,-.030]],"#d8a47b",.043);
      path(c,[[-.104,-.029],[-.204,.004],[-.13,.046]],"#ecc58a");
      path(c,[[-.212,.102],[-.127,.10],[-.115,.153]],"#d3b184",.016);
    }else{
      c.fillStyle="#706b56";c.beginPath();c.ellipse(0,-.052,.203,.163,.06,0,Math.PI*2);c.fill();
      disc(c,0,-.060,.126,"#998568");path(c,[[-.109,-.021],[-.02,.021],[.099,-.016]],"#ae735b",.030);
    }
    c.restore();
  }
  function workPlan(c,id,t){
    if(id==="walt"){
      drawRect(c,-.54,-.26,1.18,.60,"#8e816c");drawRect(c,-.56,-.30,1.14,.55,"#bb9c77");
      drawRect(c,-.29,-.105,.6,.26,"#4b6358");
      for(const x of [-.31,.32]){
        drawRect(c,x-.156,-.041,.312,.098,"#777f71");
        drawRect(c,x-.135,-.052,.27,.031,"#d0cbb0");
        disc(c,x+.099*Math.cos(t),-.036,.016,ink);
      }
    }else if(id==="bea"){
      drawRect(c,-.60,-.31,1.20,.62,"#a58b6a");
      for(const [x,y] of [[-.37,.01],[.025,.04],[.37,-.07]]){
        disc(c,x,y,.172,"#b9bda9");disc(c,x,y,.143,"#59715b");
        for(const [u,h,v,col] of flowers)disc(c,x+u,y+v,.045,col);
      }
    }else{
      disc(c,.445,.18,.29,"#a08b69");disc(c,.445,.18,.238,"#485e51");
      disc(c,0,0,.301,steel);disc(c,0,0,.264,"#e0d0af");disc(c,.032,-.015,.097,"#d2c19e");
      for(const a of [-1,1])path(c,[[a*.2,.349],[a*.08,.01+.096*Math.sin(t*7.2+a*1.51)]],brass,.023);
    }
  }
  function map(c,opt,px,py,s,visible){
    const city=opt.cabService,street=opt.mode==="street",radar=opt.mode==="radar",ui=Math.min(c.canvas.width,c.canvas.height)/(radar?165:370);
    const t=opt.time??opt.elapsed??0;
    const door=BayCab.cinema;
    if(visible(px(door.x),py(door.z),5*s)){
      if(street)atMap(c,stageDoor,px,py,s,ctx=>lobbyPlan(ctx,opt.cineSecond));
      else cinemaIcon(c,px(door.x),py(door.z),ui*(radar?4.9:4.6));
    }
    for(const stop of Object.values(BayCab.stops)){
      const p=rankLocation(stop);
      if(!visible(px(p.x),py(p.z),2*s+10))continue;
      if(street)atMap(c,p,px,py,s,rankPlan);
      else phoneIcon(c,px(p.x),py(p.z),ui*(radar?4.15:4.6));
    }
    const v=city?.vehicle;
    if(v&&visible(px(v.x),py(v.z),3*s+6)){
      if(street)atMap(c,v,px,py,s,ctx=>movingPlan(ctx,forHire(city)));
      else serviceIcon(c,px(v.x),py(v.z),ui*(radar?5.8:6.0),v.yaw);
    }
    if(!street)return;
    for(const p of city?.people||[]){
      if(!destination[p.id]||!visible(px(p.x),py(p.z),3*s))continue;
      const working=atJob(p);
      if(working)atMap(c,standPosition(p),px,py,s,ctx=>workPlan(ctx,p.id,t));
      if(working||holding(p))atMap(c,p,px,py,s,ctx=>castPlan(ctx,p,t,Math.max(1.42,2.3/s)));
    }
  }
  function dashboard(model,fare){
    const key="cab-dashboard/"+fare;
    model(key,g=>{
      const dash=(x,y)=>[x,y,.889],glass=(x,y)=>[x,y,.887];
      g.box(-.012,1.028,.975,.24,.055,.115,"#454b47");
      g.box(-.012,1.104,.963,.292,.123,.14,"#797465");
      plate(g,dash,-.143,1.051,.117,1.154,"#293d3d");
      words(g,glass,"FARE",-.084,1.090,.025,"#c9bd91");
      const bars=[[0,2,1,2],[1,2,1,1],[1,1,1,0],[0,0,1,0],[0,1,0,0],[0,2,0,1],[0,1,1,1]];
      const digits=["012345","12","01643","01623","5612","05623","056432","012","0123456","015623"];
      const amount=String(fare);
      for(let i=0;i<amount.length;i++)for(const bar of digits[Number(amount[i])]){
        const [x,y,toX,toY]=bars[Number(bar)],u=.064-(amount.length-1-i)*.047,v=1.075;
        stripe(g,glass,[u+x*.027,v+y*.025],[u+toX*.027,v+toY*.025],.006,"#ffbd78");
      }
      // Mina's sun-faded permit is clipped to the glovebox.
      const card=(x,y)=>[x,y,.874];
      g.box(.452,.929,.884,.288,.111,.013,"#515953");
      plate(g,card,.316,.879,.587,.979,"#e6d6ad");
      plate(g,card,.326,.889,.385,.965,"#6f8b87");
      const ink=(x,y)=>[x,y,.872];
      round(g,ink,.356,.937,.014,8,"#af8061",.019);round(g,ink,.356,.909,.024,8,"#b89c56",.013);
      words(g,ink,"M ORTIZ",.480,.929,.026,"#484d42");stripe(g,ink,[.404,.907],[.55,.907],.0028,"#8b856d");
      g.box(.547,.978,.875,.025,.018,.014,"#afb4a0");
      for(let i=0;i<5;i++)g.box(.22,.940+i*.011,.887,.088,.004,.010,"#333b3b");
      g.box(.538,.868,.889,.103,.014,.022,"#a6a892");
      g.pole([.015,1.455,.55],[.015,1.393,.495],.012,"#4b5855",5);
      g.box(.015,1.371,.495,.239,.071,.026,"#354345");
      plate(g,(x,y)=>[x,y,.480],-.092,1.349,.122,1.393,"#91a5a2");
    });
    return key;
  }
  window.BayCabArt={install,world,map,colors,roles,dress,pose,dashboard};
})();
