/* The Boardwalk broadcast van packs this split-lid mobile record desk. Local +Z is the operator's side. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,floor=.15,midX=155.72,midZ=114.48,heading=pi/2;
  const clamp=(v,a=0,b=1)=>Math.min(b,Math.max(a,v)),mix=(a,b,v)=>a+(b-a)*v;
  const wrap=(v,n)=>(v%n+n)%n,point=(x,y,z)=>({x:midX+z,y:floor+y,z:midZ-x});
  const name=s=>"airwaves-booth-"+s;
  const p={black:"#283037",vinyl:"#252a32",grooves:"#42454b",slate:"#34494d",green:"#497b71",mint:"#a0c1a0",
    faded:"#6c9290",paper:"#e8d6aa",cream:"#f3e0b5",ochre:"#ce9a53",salmon:"#c66d51",clay:"#aa5a47",
    case:"#42514f",zinc:"#a2a9a0",chrome:"#c9cabb",darkMetal:"#606d6c",foam:"#46504f",wood:"#a07655",
    skin:"#a56a4e",lightSkin:"#bf8061",beard:"#745448",hair:"#413e3c",temple:"#81766a",shirt:"#d8caa9",
    pocket:"#b5b39c",pants:"#4b5865",belt:"#624a3f",sole:"#b5a182",leather:"#735445",headset:"#455e59"};
  const labelColors={sol:p.mint,marea:p.salmon,breaker:p.cream};
  const table={x:midX,z:midZ,w:.84,d:2.19,bottom:0,top:1.55,streetProp:true};
  const caseBlock={x:155.66,z:116.03,w:.72,d:.80,bottom:0,top:1.12,streetProp:true};
  const site={name:"Sol FM · Boardwalk van",x:midX,z:midZ,yaw:heading,stand:{x:156.58,z:114.48,yaw:-pi/2},
    dj:{x:156.63,z:113.11,yaw:-pi/2,name:"Ivo Vidal"},blocks:[table,caseBlock],
    controlPoints:{left:point(.52,1.011,.150),right:point(-.52,1.011,.150),pitch:point(-.89,.994,.15),
      fader:blend=>point(mix(.14,-.14,clamp(blend)),1,.20)}};
  const decks=[.565,-.565],recordY=1.006;
  const sides=[-1,1],topPlane=y=>(x,z)=>[x,y,z],streetFace=z=>(x,y)=>[x,y,z];
  const operatorFace=z=>(x,y)=>[-x,y,z];
  function rect(g,plane,x,y,w,h,col){
    g.quad(plane(x,y),plane(x+w,y),plane(x+w,y+h),plane(x,y+h),col);
  }
  function stroke(g,plane,a,b,width,col){
    const dx=b[0]-a[0],dy=b[1]-a[1],m=width*.5/(Math.hypot(dx,dy)||1),x=-dy*m,y=dx*m;
    g.quad(plane(a[0]+x,a[1]+y),plane(b[0]+x,b[1]+y),plane(b[0]-x,b[1]-y),plane(a[0]-x,a[1]-y),col);
  }
  function circle(g,plane,x,y,rx,ry,col,n=18){
    for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n;
      g.tri(plane(x,y),plane(x+rx*Math.cos(a),y+ry*Math.sin(a)),plane(x+rx*Math.cos(b),y+ry*Math.sin(b)),col);
    }
  }
  function arc(g,plane,x,y,rx,ry,a,b,width,col,n=12){
    let prev=[x+rx*Math.cos(a),y+ry*Math.sin(a)];
    for(let i=1;i<=n;i++){
      const u=mix(a,b,i/n),next=[x+rx*Math.cos(u),y+ry*Math.sin(u)];
      stroke(g,plane,prev,next,width,col);prev=next;
    }
  }
  const letters={
    A:"04 11 20 31 44|13 33",B:"04 00 30 41 32 02|32 43 34 04",C:"40 10 01 03 14 44",
    D:"04 00 20 41 43 24 04",E:"40 00 04 44|02 32",F:"40 00 04|02 32",G:"40 10 01 03 14 44 42 22",
    H:"00 04|40 44|02 42",I:"10 30|20 24|14 34",K:"00 04|40 02 44",L:"00 04 44",
    M:"04 00 22 40 44",N:"04 00 44 40",O:"10 30 41 43 34 14 03 01 10",P:"04 00 30 41 32 02",
    R:"04 00 30 41 32 02|22 44",S:"40 10 01 02 32 43 34 04",T:"00 40|20 24",
    U:"00 03 14 34 43 40",V:"00 24 40",W:"00 14 22 34 40",Y:"00 22 40|22 24",
    "8":"10 30 41 32 12 01 10|12 03 14 34 43 32","3":"00 30 41 32 22|32 43 34 04",".":"24 34"
  };
  const alphabet={};
  for(const [k,s] of Object.entries(letters))alphabet[k]=s.split("|").map(a=>a.split(" ").map(v=>[+v[0]/4,1-v[1]/4]));
  function word(g,plane,txt,cx,base,h,ink){
    const w=h*.66,step=h*.84;let x=cx-((txt.length-1)*step+w)/2;
    for(const ch of txt){
      for(const line of alphabet[ch]||[])for(let i=1;i<line.length;i++){
        const a=line[i-1],b=line[i];stroke(g,plane,[x+w*a[0],base+h*a[1]],[x+w*b[0],base+h*b[1]],h*.109,ink);
      }
      x+=ch===" "?step*.73:step;
    }
  }
  function wire(g,pts,r,col,n=5){for(let i=1;i<pts.length;i++)g.pole(pts[i-1],pts[i],r,col,n);}
  function ribs(g,x,base,z,w,h,n,col){
    for(let i=0;i<n;i++)g.box(x,base+i*h/(n-1),z,w,.009,.008,col);
  }
  function sleeve(g,x,y,z,kind){
    // Each jacket leans against a different divider. The station emblem also appears on its spindle label.
    const slot=(depth)=>(u,v)=>[x+u,y+v,z+.23*v+depth],f=slot(-.002),art=slot(-.004),back=slot(.005);
    rect(g,f,-.163,0,.326,.323,labelColors[kind]);rect(g,back,-.163,0,.326,.323,kind==="breaker"?"#d4bc91":labelColors[kind]);
    g.quad(f(-.163,.323),f(.163,.323),back(.163,.323),back(-.163,.323),p.cream);
    const dx=kind==="sol"?-.038:.015;
    if(kind==="sol"){
      circle(g,art,dx+.007,.176,.08,.08,p.ochre);
      for(let n=0;n<4;n++)stroke(g,art,[-.15,.10+n*.015],[.129,.115+n*.015],.010,n%2?p.green:p.paper);
      word(g,art,"SOL",.065,.248,.037,p.slate);
    }else if(kind==="marea"){
      for(let n=0;n<3;n++){
        const v=.058+n*.031;stroke(g,art,[-.139,v],[-.012,v+.044],.017,p.cream);
        stroke(g,art,[-.012,v+.044],[.139,v+.028],.017,p.cream);
      }
      g.quad(art(-.092,.18),art(.097,.19),art(.061,.163),art(-.069,.158),p.slate);
      rect(g,art,-.069,.186,.092,.029,p.cream);rect(g,art,-.049,.214,.039,.018,p.slate);
      word(g,art,"MAREA",0,.264,.031,p.slate);
    }else{
      const dark="#3f5863";
      for(let i=0;i<3;i++){
        const a=-.152+i*.079;stroke(g,art,[a,.053],[a+.115,.175],.021,dark);
        stroke(g,art,[a+.115,.175],[a+.055,.169],.018,dark);stroke(g,art,[a+.055,.169],[a+.139,.253],.016,dark);
      }
      word(g,art,"BREAKER",0,.271,.030,dark);rect(g,art,.106,.014,.035,.017,p.salmon);
    }
  }
  function caseAndCables(g,detail){
    const x=-1.55,z=-.06;
    g.box(x,.303,z,.775,.555,.64,"#525a55");g.box(x,.594,z,.785,.047,.651,p.darkMetal);
    for(const s of sides){
      g.box(x+s*.364,.37,z,.026,.45,.64,p.zinc);g.box(x,.24,z+s*.327,.74,.024,.018,p.zinc);
      g.box(x+s*.36,.065,z+.21,.086,.088,.09,p.black);
    }
    g.box(x,.632,z,.726,.025,.594,p.foam);
    for(const s of sides)g.box(x+s*.383,.713,z,.038,.211,.642,p.green);
    for(const zz of [-.31,.31]){
      g.box(x,.685,z+zz,.76,.136,.029,"#6a8e77");g.box(x,.774,z+zz,.79,.032,.034,p.darkMetal);
    }
    if(detail){
      for(let i=0;i<10;i++){
        const cx=x+(i%2?-.17:.175),dz=z-.157+Math.floor(i/2)*.072;
        g.box(cx,.819+(i%3)*.008,dz,.316,.317,.014,[p.wood,p.clay,p.faded,p.cream][i%4]);
        g.box(cx,.979+(i%3)*.008,dz,.313,.01,.020,i%3?p.paper:p.slate);
      }
      sleeve(g,x,.745,z+.137,"breaker");sleeve(g,x+.175,.675,z-.21,"marea");sleeve(g,x-.17,.692,z-.247,"sol");
      const face=streetFace(z-.339);
      rect(g,face,x-.22,.36,.44,.12,p.paper);word(g,streetFace(z-.342),"IVO",x-.027,.386,.056,p.slate);
      // A taped field connector and the flat cable protector lead to the rear bumper.
      wire(g,[[-.8,.715,-.29],[-.95,.5,-.27],[-1.06,.12,-.28],[-1.11,.027,-.28],[-1.39,.017,-.37],[-1.91,.018,-.39],[-2.18,.02,-.52],[-2.35,.02,-.76],[-2.39,.025,-.91]],.012,p.black);
      g.box(-2.26,.018,-.54,.30,.032,.078,p.ochre,.54);
      for(let i=0;i<3;i++)g.box(-2.34+i*.060,.034,-.54,.026,.005,.077,p.black,.54);
      for(const s of sides)g.box(x+s*.29,.514,z-.323,.069,.103,.012,p.zinc);
    }
  }
  function caseShell(g,detail){
    for(const x of [-.81,.81]){
      for(const z of [-.285,.285]){
        g.box(x,.042,z,.125,.079,.128,p.black);
        g.pole([x,.083,z],[x*.82,.699,-z*.87],.027,p.darkMetal,6);
      }
      g.pole([x,.164,-.245],[x,.164,.245],.018,p.darkMetal,5);
    }
    g.box(0,.796,0,2.173,.226,.796,p.case);
    for(const y of [.691,.873])g.box(0,y,0,2.19,.031,.809,p.zinc);
    g.box(0,.909,0,2.15,.043,.771,p.black);
    // A hand-lettered folding lid faces Ocean Drive. The two pins turn into braces when it is open.
    g.box(0,1.122,-.371,2.16,.39,.056,p.green);
    for(const y of [.935,1.317])g.box(0,y,-.372,2.18,.022,.069,p.zinc);
    const back=streetFace(-.402);
    rect(g,back,-1.034,.965,2.068,.316,p.cream);
    const paint=streetFace(-.405);circle(g,paint,-.784,1.137,.126,.126,p.salmon,16);
    rect(g,paint,-.924,1.006,.283,.098,p.cream);
    for(let i=0;i<3;i++)rect(g,paint,-.918+i*.022,1.048+i*.025,.269-i*.027,.011,p.green);
    word(g,paint,"SOL FM",-.199,1.054,.175,p.slate);word(g,paint,"88.3",.722,1.058,.111,p.green);
    if(detail){
      const face=operatorFace(-.338);
      rect(g,face,-.98,.969,1.96,.29,p.foam);
      for(let i=0;i<15;i++){
        const u=-.96+i*.13;
        g.quad(face(u,1.002),face(u+.065,1.23),face(u+.13,1.002),face(u+.065,1.075),i%2?"#566059":"#5c645a");
      }
      rect(g,operatorFace(-.333),-.21,1.055,.46,.146,"#d7c9a3");
      word(g,operatorFace(-.330),"SIDE B",.012,1.099,.066,p.slate);
      for(const x of [-.88,.88]){
        g.pole([x,.887,.03],[x,1.23,-.33],.012,p.zinc,5);
        for(const z of [-.389,.389])g.box(x,.794,z,.108,.093,.020,p.darkMetal);
        g.box(x,.799,.407,.048,.069,.012,p.chrome);g.box(x,1.321,-.372,.079,.027,.082,p.chrome);
      }
      g.box(.43,.409,-.012,.48,.515,.51,"#524d44");g.box(.43,.405,-.276,.45,.478,.032,p.black);
      const speaker=streetFace(-.294);
      circle(g,speaker,.43,.381,.172,.17,"#474b49",16);circle(g,streetFace(-.296),.43,.381,.105,.105,"#393e40",12);
      circle(g,streetFace(-.298),.43,.381,.054,.054,"#575953",10);
      for(let i=0;i<5;i++)stroke(g,streetFace(-.300),[.218,.229+i*.07],[.642,.23+i*.07],.01,p.darkMetal);
      g.box(.34,.593,-.293,.135,.022,.018,p.zinc);
      wire(g,[[.63,.61,.13],[.72,.49,.22],[.68,.27,.25],[.8,.12,.21],[.63,.065,.08],[.38,.056,.09],[.29,.051,.21],[.37,.056,.29],[.52,.054,.25],[.54,.051,.14]],.012,p.black);
      for(const x of [-.84,.032,.89])g.box(x,.798,-.411,.116,.072,.018,p.zinc);
      g.box(-.353,.788,-.418,.285,.038,.019,p.black);g.box(-.353,.776,-.431,.211,.021,.016,p.zinc);
      const sticker=operatorFace(.402);rect(g,sticker,-.717,.751,.249,.069,p.mint);
      word(g,operatorFace(.405),"DUB",-.591,.77,.031,p.slate);
    }
    caseAndCables(g,detail);
  }
  function deckBase(g,x,detail){
    g.box(x,.947,-.01,.66,.081,.561,p.darkMetal);g.box(x,.977,-.01,.642,.021,.55,"#8b9390");
    const disc=x+.036,z=-.019;
    g.cyl(disc,.986,z,.222,.233,.021,detail?32:16,p.black);
    g.cyl(disc,.995,z,.213,.221,.013,detail?32:16,p.zinc);
    circle(g,topPlane(recordY-.003),disc,z,.205,.205,p.vinyl,detail?36:16);
    if(!detail)return;
    for(let i=0;i<27;i++){
      const a=tau*i/27,c=Math.cos(a),s=Math.sin(a);
      const q=topPlane(.9958);
      stroke(g,q,[disc+.218*c,z+.218*s],[disc+.223*c,z+.223*s],.0068,p.cream);
    }
    const groove=topPlane(recordY-.001);
    for(const r of [.112,.138,.166,.188])for(const a of [.17,3.08])arc(g,groove,disc,z,r,r,a,a+.96,.0017,p.grooves,6);
    const far=x-.194;
    g.cyl(far,1.009,-.213,.044,.047,.048,10,p.darkMetal);
    g.cyl(far,1.042,-.213,.032,.032,.013,10,p.chrome);
    g.box(x-.292,.990,.057,.026,.010,.218,p.black);
    if(x>0)g.box(x-.293,.998,.108,.049,.016,.032,p.paper);
    else{
      // The B deck has the two pitch-bend contacts Ivo fitted alongside the long motor trim.
      for(const k of sides){
        g.box(x-.321,.989,.149+k*.021,.018,.014,.033,k<0?p.mint:p.salmon);
        rect(g,topPlane(.997),x-.326,.147+k*.021,.011,.003,p.slate);
        if(k>0)rect(g,topPlane(.997),x-.322,.143+k*.021,.003,.011,p.slate);
      }
    }
    for(let i=0;i<=8;i++)g.box(x-.269,.993,-.048+i*.026,i===4?.023:.012,.003,.003,p.slate);
    g.cyl(x+.245,.998,.204,.025,.026,.017,10,p.zinc);
    rect(g,topPlane(.991),x+.17,.208,.04,.028,p.clay);rect(g,topPlane(.992),x+.168,.185,.048,.009,p.slate);
    for(const s of sides)for(const k of sides)circle(g,topPlane(.989),x+s*.3,-.012+k*.25,.0065,.0065,p.slate,6);
    g.box(x+.23,.998,-.22,.047,.029,.032,p.black);
  }
  function mixer(g,detail){
    g.box(0,.954,0,.414,.083,.539,p.black);g.box(0,.984,0,.394,.024,.521,p.slate);
    const surface=topPlane(.997);
    for(const s of sides){
      const x=s*.099;rect(g,surface,x-.082,-.205,.164,.079,p.cream);
      arc(g,topPlane(1),x,-.137,.066,.043,pi+.16,tau-.16,.003,p.darkMetal,10);
      for(const k of [-1,-.5,0,.5,1])stroke(g,topPlane(1),[x+k*.055,-.184+.019*k*k],[x+k*.058,-.190+.021*k*k],.003,k>.5?p.clay:p.darkMetal);
      if(detail){
        for(let i=0;i<3;i++){
          const z=-.083+i*.05;
          g.cyl(x,.999,z,.017,.019,.014,9,i===0?p.ochre:p.zinc);
          stroke(g,topPlane(1.009),[x,z],[x+s*.007,z-.011],.003,p.slate);
        }
        rect(g,surface,x-.005,.054,.011,.084,p.black);g.box(x,1.003,.081+s*.018,.038,.020,.018,p.zinc);
        for(let i=0;i<4;i++)rect(g,surface,x+.016,.060+i*.024,.012,.003,p.zinc);
        const button=x+s*.054;
        rect(g,surface,button-.013,.041,.027,.026,p.salmon);rect(g,surface,button-.013,.079,.027,.024,p.mint);
      }
    }
    rect(g,surface,-.158,.194,.316,.014,p.black);
    for(let i=0;i<9;i++)rect(g,surface,-.141+i*.035,.217,.003,i===4?.021:.011,p.zinc);
  }
  function recordLabel(g,color){
    const top=topPlane(.001);
    circle(g,top,0,0,.066,.066,color,22);circle(g,topPlane(.002),0,0,.010,.010,p.slate,8);
    circle(g,topPlane(.002),.021,-.018,.016,.016,color===p.mint?p.ochre:color===p.salmon?p.paper:p.faded,9);
    for(let i=0;i<3;i++)stroke(g,topPlane(.0026),[-.034,-.026+i*.009],[-.001+(i%2)*.009,-.026+i*.009],.0029,p.slate);
    // White leader tape rotates with the sleeve's actual record.
    stroke(g,topPlane(.0026),[.119,.034],[.181,.052],.0057,p.paper);
    rect(g,topPlane(.003),.105,.027,.012,.008,p.salmon);g.cyl(0,.007,0,.003,.004,.014,7,p.zinc);
  }
  function tonearm(g){
    // The pivot is at the outside rear corner. The bent tube ends on the run-in groove.
    g.pole([0,.005,-.049],[0,.005,.031],.016,p.zinc,8);g.cyl(0,.005,-.033,.017,.019,.026,8,p.darkMetal);
    wire(g,[[0,.005,0],[.035,.011,.061],[.062,.017,.128],[.117,.010,.186],[.125,-.003,.206]],.007,p.chrome,6);
    g.box(.13,-.007,.216,.027,.014,.041,p.slate,-.40);
    g.box(.137,-.021,.225,.014,.016,.017,p.ochre,-.40);
  }
  function clockPanel(g){
    // Incandescent tally and four beats sit above the mixer, below sightline to the boardwalk.
    g.box(0,1.131,-.295,.52,.134,.043,p.black);
    const face=operatorFace(-.268);
    rect(g,face,-.24,1.074,.48,.108,p.darkMetal);
    rect(g,operatorFace(-.265),-.221,1.089,.169,.067,"#774942");
    word(g,operatorFace(-.262),"AIR",-.136,1.102,.038,p.cream);
    for(let n=0;n<4;n++)circle(g,operatorFace(-.264),-.008+n*.06,1.123,.015,.015,"#b29c7c",8);
  }
  function horizon(g){
    g.box(0,.51,0,1.72,.96,.61,p.darkMetal);g.box(0,1.10,-.35,2.14,.39,.06,p.cream);
    rect(g,streetFace(-.389),-.96,.981,.73,.27,p.green);
    word(g,streetFace(-.391),"SOL FM",.37,1.02,.18,p.slate);
    for(const d of decks)circle(g,topPlane(1.003),d,-.025,.211,.211,p.vinyl,10);
    g.box(-1.55,.395,-.06,.78,.76,.65,p.green);g.box(-1.55,.82,-.065,.63,.2,.42,p.salmon);
  }
  function rings(g,rows,color,n=10){
    const at=(r,i)=>[r[0]+r[3]*Math.cos(tau*i/n),r[1],r[2]+r[4]*Math.sin(tau*i/n)];
    for(let j=1;j<rows.length;j++)for(let i=0;i<n;i++)g.quad(at(rows[j-1],i),at(rows[j-1],i+1),
      at(rows[j],i+1),at(rows[j],i),color,.91+.07*Math.sin((i+.5)*tau/n));
    const end=rows.at(-1);
    for(let i=0;i<n;i++)g.tri([end[0],end[1],end[2]],at(end,i),at(end,i+1),color);
  }
  function ivoBody(g){
    rings(g,[[0,.862,.001,.143,.09],[0,.906,0,.171,.115],[0,.985,.001,.169,.11]],p.pants,12);
    rings(g,[[0,.944,0,.176,.115],[0,.975,0,.174,.116]],p.belt,12);
    g.box(.012,.960,.111,.045,.029,.009,p.ochre);
    rings(g,[[0,.959,.011,.168,.112],[0,1.06,.009,.171,.121],[0,1.252,.019,.196,.128],
      [0,1.356,.027,.216,.128],[0,1.415,.025,.154,.101],[0,1.434,.023,.095,.076]],p.shirt,12);
    const f=(x,y)=>[x,y,.140+.026*(y-1.13)];
    g.quad(f(-.051,1.402),f(.049,1.401),f(.036,1.232),f(-.012,1.21),"#b07856");
    for(const s of sides){
      g.quad(f(s*.014,1.317),f(s*.080,1.391),[s*.086,1.439,.084],f(s*.030,1.410),"#e5d6af");
      g.quad(f(s*.020,1.294),f(s*.075,1.371),f(s*.067,1.321),f(s*.024,1.276),"#969f90");
      for(let i=0;i<3;i++){
        const x=s*.074+s*i*.012;
        g.quad(f(x,1.002),f(x+.003,1.002),f(x+.006,1.274),f(x+.002,1.285),i===1?"#a7a993":"#c4b899");
      }
    }
    g.quad(f(.075,1.240),f(.152,1.237),f(.146,1.159),f(.094,1.145),p.pocket);
    g.quad(f(.077,1.244),f(.153,1.239),f(.149,1.222),f(.079,1.228),p.shirt);
    for(let i=0;i<3;i++)g.cyl(0,1.073+i*.072,.143,.0065,.0065,.009,7,p.belt);
    g.pole([-.03,1.364,.134],[-.004,1.319,.148],.0033,p.ochre,5);
    g.pole([-.004,1.319,.148],[.035,1.363,.133],.0033,p.ochre,5);
    const back=(x,y)=>[x,y,-.103-.011*(1.4-y)];
    for(let i=0;i<4;i++)stroke(g,back,[-.157,1.316+i*.010],[.158,1.318+i*.010],.0036,p.pocket);
    rings(g,[[0,1.397,.025,.068,.066],[0,1.492,.022,.068,.066]],p.skin,9);
  }
  function ivoHead(g){
    // Old padded cans, smoke-tinted square lenses and a silver streak at the temple.
    rings(g,[[0,.024,.035,.065,.064],[0,.054,.035,.090,.082],[0,.124,.023,.106,.105],
      [0,.196,.014,.111,.106],[0,.236,.006,.095,.087]],p.skin,12);
    rings(g,[[0,.191,.003,.108,.105],[0,.225,-.005,.120,.112],[-.010,.262,-.007,.101,.095],
      [-.020,.274,-.008,.062,.061]],p.hair,11);
    for(let i=0;i<6;i++){
      const x=-.075+i*.027;
      g.pole([x,.231,.066],[x+.016,.240+(i%3)*.006,.076+(i%2)*.01],.019,p.hair,6);
    }
    for(const s of sides){
      g.cyl(s*.104,.132,.006,.016,.013,.042,7,p.lightSkin);
      g.pole([s*.108,.185,.005],[s*.097,.139,.042],.013,p.temple,6);
      const f=(u,y)=>[s*u,y,.129-.33*(u-.019)];
      g.quad(f(.014,.174),f(.092,.169),f(.086,.123),f(.022,.124),"#624b3d");
      g.quad(f(.021,.168),f(.087,.163),f(.082,.129),f(.027,.129),"#635c54");
      stroke(g,f,[.032,.159],[.058,.149],.004,"#a08b70");
      g.pole([s*.09,.164,.105],[s*.110,.164,-.003],.0038,p.belt,5);
    }
    g.pole([-.018,.159,.13],[.019,.161,.13],.004,p.belt,6);
    g.tri([-.018,.150,.119],[.013,.153,.124],[.016,.107,.145],p.lightSkin);
    g.tri([-.018,.150,.119],[.016,.107,.145],[-.019,.108,.131],"#a16b51");
    g.quad([-.041,.090,.125],[-.010,.096,.135],[.039,.090,.125],[.025,.083,.128],p.beard);
    g.pole([-.022,.071,.124],[.028,.074,.124],.0032,"#805744",5);
    const bridge=[];
    for(let i=0;i<=10;i++){const a=i*pi/10;bridge.push([.124*Math.cos(a),.171+.121*Math.sin(a),.002]);}
    wire(g,bridge,.012,p.black,6);
    for(const s of sides){
      g.pole([s*.098,.157,.007],[s*.132,.157,.007],.041,"#333c3c",10);
      g.pole([s*.131,.157,.007],[s*.144,.157,.007],.035,p.headset,10);
      g.pole([s*.145,.157,.007],[s*.147,.157,.007],.017,p.ochre,8);
    }
    wire(g,[[-.118,.142,-.002],[-.123,.097,.019],[-.114,.043,.044],[-.093,-.011,.060]],.004,p.black,5);
  }
  const armLength=.312,foreLength=.284,thighLength=.420,shinLength=.402;
  function tubeZ(g,rows,col,n=9){
    const at=(r,i)=>[r[1]*Math.cos(i*tau/n),r[2]*Math.sin(i*tau/n),r[0]];
    for(let j=1;j<rows.length;j++)for(let i=0;i<n;i++)g.quad(at(rows[j-1],i),at(rows[j-1],i+1),at(rows[j],i+1),at(rows[j],i),col,.90+.081*Math.sin(i*tau/n));
    const last=rows.at(-1);for(let i=0;i<n;i++)g.tri([0,0,last[0]],at(last,i),at(last,i+1),col);
  }
  function sleeveArm(g){
    tubeZ(g,[[-.025,.064,.066],[.064,.086,.089],[.162,.078,.077],[.204,.069,.069]],p.shirt,9);
    tubeZ(g,[[.177,.082,.080],[.210,.08,.077]],p.pocket,9);
    tubeZ(g,[[.207,.062,.059],[armLength+.014,.047,.045]],p.skin,8);
  }
  function forearm(g,watch){
    tubeZ(g,[[-.010,.046,.045],[.072,.057,.051],[.157,.042,.042],[.238,.032,.028],[foreLength,.031,.025]],p.skin,8);
    if(watch){
      tubeZ(g,[[.198,.042,.039],[.219,.039,.038]],p.belt,8);
      g.box(0,.038,.207,.040,.009,.028,p.ochre);
    }
    tubeZ(g,[[.239,.034,.025],[.263,.040,.024],[.284,.030,.017],[.293,.015,.013]],p.lightSkin,8);
  }
  function leg(g,shin){
    if(shin){
      tubeZ(g,[[-.01,.074,.069],[.093,.075,.071],[.291,.055,.058],[shinLength,.062,.066]],p.pants,8);
      tubeZ(g,[[.366,.064,.066],[.395,.065,.068]],"#63717b",8);
    }else tubeZ(g,[[-.01,.084,.09],[.096,.092,.094],[.285,.074,.079],[thighLength+.016,.069,.073]],p.pants,9);
  }
  function shoe(g){
    rings(g,[[0,-.129,.037,.073,.133],[0,-.107,.037,.074,.134],[0,-.074,.038,.071,.128],
      [0,-.023,.004,.062,.084],[0,.016,-.007,.054,.062]],p.leather,10);
    rings(g,[[0,-.133,.038,.075,.134],[0,-.115,.038,.075,.134]],p.sole,10);
    g.pole([-.043,-.065,.104],[.042,-.065,.103],.0045,p.ochre,5);
  }
  function distantIvo(g){
    for(const s of sides){
      g.pole([s*.098,.92,0],[s*.106,.17,.024],.071,p.pants,6);
      g.box(s*.107,.077,.034,.135,.119,.234,p.leather);
      const e=[s*.25,1.144,.04];
      g.pole([s*.18,1.38,0],e,.072,p.shirt,6);g.pole(e,[s*.207,1.104,.27],.045,p.skin,6);
    }
    g.cyl(0,1.154,.01,.196,.154,.486,8,p.shirt);g.cyl(0,1.55,.01,.102,.085,.224,8,p.skin);
    g.cyl(-.005,1.683,.004,.091,.111,.084,8,p.hair);
    g.pole([-.117,1.604,.009],[.117,1.604,.009],.042,p.headset,6);
  }
  function install(installModel,models){
    // The host normally provides its lazy model builder. A plain BayView also works for isolated previews.
    const add=typeof installModel==="function"?installModel:(id,build)=>{
      if(!installModel?.gl||models?.has(id)||installModel.models?.has(id))return;
      const g=new BayMesh();build(g);installModel.add(id,g);models?.add(id);
    };
    add(name("horizon"),horizon);
    for(const detailed of [false,true])add(name(detailed?"desk":"roadside"),g=>{
      caseShell(g,detailed);decks.forEach(x=>deckBase(g,x,detailed));mixer(g,detailed);clockPanel(g);
    });
    Object.entries(labelColors).forEach(([station,col])=>add(name("record-"+station),g=>recordLabel(g,col)));
    add(name("tonearm"),tonearm);add(name("ivo-roadside"),distantIvo);
    add(name("fader"),g=>{g.box(0,.004,0,.034,.026,.043,p.black);g.box(0,.018,0,.006,.004,.035,p.paper);});
    add(name("pitch-cap"),g=>{g.box(0,0,0,.045,.016,.026,p.paper);g.box(0,.009,0,.033,.002,.004,p.slate);});
    add(name("needle"),g=>stroke(g,topPlane(0),[0,.010],[0,-.047],.0037,p.clay));
    add(name("beat"),g=>circle(g,operatorFace(0),0,0,.014,.014,p.cream,8));
    add(name("on-air"),g=>{rect(g,operatorFace(0),-.080,-.030,.160,.060,p.salmon);
      word(g,operatorFace(.001),"AIR",0,-.018,.039,p.cream);});
    for(const [id,build] of [["body",ivoBody],["head",ivoHead],["sleeve",sleeveArm],["wrist",g=>forearm(g,false)],
      ["watch",g=>forearm(g,true)],["thigh",g=>leg(g,false)],["shin",g=>leg(g,true)],["shoe",shoe]])add(name(id),build);
  }
  function smooth(a,b,x){const n=clamp((x-a)/(b-a));return n*n*(3-2*n);}
  const handover={t:NaN,n:0};
  function presentation(t,state){
    const beat=Number.isFinite(state.beat)?state.beat:t*1.6,inc=Number.isFinite(state.incomingBeat)?state.incomingBeat:beat+1.1;
    const mixing=!!state.mixing,blend=mixing?clamp(Number(state.blend)||0):.12+.10*Math.sin(t*.34);
    const diff=t-handover.t;
    if(!Number.isFinite(diff)||diff<0||diff>2.5)handover.n=Number(mixing);
    else if(diff>0)handover.n=clamp(handover.n+(mixing?1:-1)*diff/.94);
    handover.t=t;
    const move=smooth(0,1,handover.n),step=Math.sin(handover.n*pi);
    return {t,mixing,beat,inc,blend,move,step,second:mixing?!!state.activeDeck:true,
      station:labelColors[state.station]?state.station:"sol",
      other:labelColors[state.incomingStation]?state.incomingStation:labelColors[state.station]?state.station:"marea",
      leftPhase:beat*(tau*(100/3)/clamp(state.bpm||96,40,240)),
      rightPhase:inc*(tau*(100/3)/clamp(state.incomingBpm||state.bpm||96,40,240)),
      armA:.11*Math.sin(beat*.019),armB:mixing&&!state.activeDeck?-.45:.12*Math.sin(inc*.021),
      trim:clamp((Number(state.tempoOffset)||0)/.20,-1,1),ready:!!state.ready};
  }
  function yawPoint(a,q){
    const c=Math.cos(a.yaw),s=Math.sin(a.yaw);
    return [a.x+c*q[0]+s*q[2],a.y+q[1],a.z-s*q[0]+c*q[2]];
  }
  function operatorLocal(a,p){
    const c=Math.cos(a.yaw),s=Math.sin(a.yaw),x=p[0]-a.x,z=p[2]-a.z;
    return [c*x-s*z,p[1]-a.y,s*x+c*z];
  }
  function deltas(a,b){return b.map((v,j)=>v-a[j]);}
  function dot(a,b){return a[0]*b[0]+a[1]*b[1]+a[2]*b[2];}
  function between(a,b,k){return a.map((v,j)=>mix(v,b[j],k));}
  function jointPoint(a,b,hint,upper,lower){
    const delta=deltas(a,b),d=Math.hypot(...delta)||.001,n=delta.map(x=>x/d);
    const reach=clamp(d,Math.abs(upper-lower)+.001,upper+lower-.0001),to=(upper*upper-lower*lower+reach*reach)/(2*reach);
    const off=Math.sqrt(Math.max(0,upper*upper-to*to)),proj=dot(n,hint),v=hint.map((k,i)=>k-proj*n[i]),mag=Math.hypot(...v)||1;
    const joint=a.map((k,i)=>k+n[i]*to+v[i]*off/mag),end=a.map((k,i)=>k+n[i]*reach);
    return [joint,end];
  }
  function host(s){
    const {t,move,step,beat}=s,phase=handover.n*tau*1.13,nod=Math.sin(beat*tau);
    const a={x:mix(.36+.029*Math.sin(t*.46),1.37,move),z:mix(.671,.91,move)+.09*step,y:0,
      yaw:pi+.054*Math.sin(t*.42)+1.12*move};
    a.bob=.006*Math.sin(beat*pi)+.025*Math.abs(Math.sin(phase))*step;
    a.lean=mix(.093,.021,move)+.009*nod;
    const ear=smooth(.04,.30,Math.sin(t*.42))*(1-move);
    a.yawHead=mix(-.18+.12*Math.sin(t*.62),.20+.09*Math.sin(beat*pi*.5),move)-.11*ear;
    a.pitchHead=.18-.11*move+.047*nod;
    a.legs=[];a.arms=[];
    for(const k of sides){
      const swing=Math.sin(phase+(k<0?0:pi))*step,foot=[k*.106+.02*step,.137+.075*Math.max(0,swing),.024+.19*swing];
      const hip=[k*.098,.925+a.bob,.02];
      const [knee,ankle]=jointPoint(hip,foot,[.08*k,-.07,1.0],thighLength,shinLength);
      a.legs.push([hip,knee,ankle]);
      const shoulder=[k*.19,1.36+a.bob,.027+1.36*Math.sin(a.lean)];
      const work=k<0?operatorLocal(a,[.52+.044*Math.sin(beat*.8),1.021,.150+.018*Math.sin(beat*tau*.25)]):
        between(operatorLocal(a,[mix(.002,.131,.5+.5*Math.sin(t*.84)),1.019,.200]),[.132,1.608,.038],ear);
      const signal=k<0?[-.32,1.17+.102*Math.max(0,nod),.232+.030*nod]:[.186,.998+.012*nod,.10];
      const target=between(work,signal,move);
      const [elbow,hand]=jointPoint(shoulder,target,[.87*k,-.15,-.46],armLength,foreLength);
      a.arms.push([shoulder,elbow,hand]);
    }
    return a;
  }
  function enqueue(list,id,x,y,z,yaw=0,pitch=0,roll=0,glow=0){
    list.push([name(id),midX+z,floor+y,midZ-x,heading+yaw,pitch,roll,glow]);
  }
  function drawHost(list,a){
    const base=yawPoint(a,[0,a.bob,0]),head=yawPoint(a,[0,1.425+a.bob,.024+1.415*Math.sin(a.lean)]);
    enqueue(list,"body",...base,a.yaw,a.lean);
    enqueue(list,"head",...head,a.yaw+a.yawHead,a.pitchHead,.026*Math.sin(a.yaw));
    const bone=(id,a0,a1)=>{
      const start=yawPoint(a,a0),end=yawPoint(a,a1),[x,y,z]=deltas(start,end);
      enqueue(list,id,...start,Math.atan2(x,z),-Math.atan2(y,Math.hypot(x,z)));
    };
    for(let i=0;i<a.arms.length;i++){
      const [shoulder,elbow,hand]=a.arms[i],[hip,knee,ankle]=a.legs[i];
      bone("sleeve",shoulder,elbow);bone(i===0?"watch":"wrist",elbow,hand);
      bone("thigh",hip,knee);bone("shin",knee,ankle);enqueue(list,"shoe",...yawPoint(a,ankle),a.yaw+(i-.5)*.18);
    }
  }
  function world(list,see,t=0,state={}){
    if(!see(site,100))return;
    if(!see(site,54)){enqueue(list,"horizon",0,0,0);return;}
    const near=see(site,27),s=presentation(t,state||{});
    enqueue(list,near?"desk":"roadside",0,0,0);
    if(near){
      for(let i=0;i<decks.length;i++){
        const x=decks[i];enqueue(list,"record-"+(i?s.other:s.station),x+.036,recordY,-.019,i&&s.mixing&&!s.second?0:i?s.rightPhase:s.leftPhase);
        enqueue(list,"tonearm",x-.194,1.046,-.213,i?s.armB:s.armA);
        const v=i?s.inc:s.beat,level=(i&&!s.second?.02:.34)+.36*Math.abs(Math.sin(v*2.67))+.20*Math.abs(Math.cos(v*4.1));
        enqueue(list,"needle",i?-.099:.099,1.003,-.14,.66-1.38*clamp(level*(i&&!s.second?.24:1)));
      }
      enqueue(list,"fader",mix(.14,-.14,s.blend),1,.20);
      enqueue(list,"pitch-cap",decks[1]-.292,.999,.057+s.trim*.087);
      if(wrap(s.beat,1)<.66){const n=wrap(Math.floor(s.beat),4);enqueue(list,"beat",.008-n*.06,1.123,-.261,0,0,0,.63);}
      if(s.ready||!s.mixing||s.second)enqueue(list,"on-air",.136,1.122,-.259,0,0,0,.29);
      drawHost(list,host(s));
    }else{
      const a=host(s);enqueue(list,"ivo-roadside",a.x,0,a.z,a.yaw);
    }
  }
  function bar(c,x,z,w,d,col){c.fillStyle=col;c.fillRect(x,z,w,d);}
  function oval(c,x,z,rx,rz,col){
    c.fillStyle=col;c.beginPath();c.ellipse(x,z,rx,rz,0,0,tau);c.fill();
  }
  function line(c,points,width,col){
    c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke();
  }
  function overheadBase(c){
    c.lineCap="round";c.lineJoin="round";
    line(c,[[-.71,-.27],[-1.12,-.28],[-1.89,-.39],[-2.18,-.52],[-2.39,-.91]],.026,p.black);
    line(c,[[-2.17,-.53],[-2.32,-.70]],.057,p.ochre);
    bar(c,-1.95,-.39,.80,.68,p.darkMetal);bar(c,-1.917,-.359,.734,.618,p.green);
    bar(c,-1.881,-.325,.665,.552,p.foam);
    for(let i=0;i<7;i++)bar(c,-1.867+(i%2)*.011,-.253+i*.080,.629,.020,[p.salmon,p.paper,p.faded][i%3]);
    for(const [x,z,kind] of [[-1.553,.068,"breaker"],[-1.38,-.138,"marea"],[-1.714,-.168,"sol"]]){
      bar(c,x-.16,z-.041,.32,.092,labelColors[kind]);bar(c,x-.158,z-.041,.315,.009,p.cream);
      if(kind==="sol"){oval(c,x-.041,z,.041,.017,p.ochre);bar(c,x+.037,z-.009,.078,.01,p.slate);}
      else if(kind==="marea")line(c,[[x-.127,z+.021],[x-.020,z-.019],[x+.114,z+.009]],.011,p.cream);
      else for(let i=0;i<3;i++)line(c,[[x-.113+i*.065,z+.024],[x-.042+i*.065,z-.021]],.014,p.slate);
    }
    bar(c,-1.10,-.402,2.2,.813,p.darkMetal);bar(c,-1.077,-.384,2.154,.774,p.zinc);
    bar(c,-1.059,-.359,2.118,.714,p.case);bar(c,-1.076,-.398,2.151,.089,p.green);
    bar(c,-1.06,-.388,2.12,.024,p.cream);bar(c,-1.06,-.308,2.12,.024,p.foam);
    for(const d of decks){
      bar(c,d-.338,-.289,.675,.563,p.darkMetal);bar(c,d-.324,-.279,.648,.544,"#929990");
      oval(c,d+.037,-.019,.225,.225,p.black);oval(c,d+.037,-.019,.218,.218,p.zinc);
      oval(c,d+.037,-.019,.208,.208,p.vinyl);
      for(const r of [.126,.172]){
        c.strokeStyle=p.grooves;c.lineWidth=.005;c.beginPath();c.arc(d+.037,-.019,r,3.26,4.24);c.stroke();
      }
      bar(c,d-.303,-.056,.019,.228,p.black);
      if(d>0)bar(c,d-.318,.110,.048,.023,p.paper);
      else{bar(c,d-.33,.112,.018,.031,p.mint);bar(c,d-.33,.156,.018,.031,p.salmon);}
      oval(c,d+.245,.202,.025,.025,p.zinc);bar(c,d+.17,.195,.037,.023,p.clay);
    }
    bar(c,-.204,-.261,.408,.521,p.black);bar(c,-.194,-.251,.388,.501,p.slate);
    for(const sign of sides){
      const x=.099*sign;bar(c,x-.082,-.207,.164,.079,p.cream);
      for(let i=0;i<3;i++)oval(c,x,-.082+i*.050,.018,.018,i?p.zinc:p.ochre);
      bar(c,x-.005,.048,.011,.088,p.black);bar(c,x-.019,.074+sign*.018,.038,.017,p.zinc);
    }
    bar(c,-.161,.194,.322,.014,p.black);
    for(let i=0;i<9;i++)bar(c,-.141+i*.035,.217,.004,i===4?.019:.010,p.zinc);
    bar(c,-.261,-.318,.522,.052,p.black);bar(c,-.24,-.289,.479,.019,p.darkMetal);
    for(const x of [-1.059,1.059])for(const z of [-.359,.329])bar(c,x-.026,z,.053,.044,p.chrome);
  }
  const sheet={x:-2.45,z:-.965,w:3.62,d:1.405,cache:null};
  function baseOnMap(c){
    if(!sheet.cache&&typeof document!=="undefined"){
      const k=118,v=document.createElement("canvas");
      v.width=Math.ceil(sheet.w*k);v.height=Math.ceil(sheet.d*k);
      const q=v.getContext?.("2d");
      if(q){q.setTransform(k,0,0,k,-sheet.x*k,-sheet.z*k);overheadBase(q);sheet.cache=v;}
    }
    if(sheet.cache){c.drawImage(sheet.cache,sheet.x,sheet.z,sheet.cache.width/118,sheet.cache.height/118);return;}
    overheadBase(c);
  }
  function mapHost(c,a,high){
    c.save();c.translate(a.x,a.z);c.rotate(-a.yaw);
    const plan=q=>[q[0],q[2]];
    for(const leg of a.legs){const foot=plan(leg[2]);oval(c,foot[0],foot[1]+.035,.074,.121,p.leather);}
    c.lineJoin="round";c.lineCap="round";
    for(const arm of a.arms){
      const [shoulder,elbow,hand]=arm.map(plan),cuff=between(shoulder,elbow,.64);
      line(c,[shoulder,cuff],.157,"#9c9880");
      line(c,[shoulder,cuff],.14,p.shirt);line(c,[cuff,elbow,hand],.076,p.skin);
      oval(c,hand[0],hand[1],.036,.044,p.lightSkin);
    }
    oval(c,.001,.018,.207,.129,"#a6a18a");oval(c,0,.024,.202,.122,p.shirt);
    if(high){
      line(c,[[-.131,.056],[-.039,.102],[0,.043],[.064,.099]],.018,p.pocket);
      bar(c,.087,.076,.058,.031,p.pocket);
    }
    c.translate(0,.036+1.4*Math.sin(a.lean));c.rotate(-a.yawHead);
    oval(c,0,.021,.097,.113,p.skin);
    oval(c,-.009,.003,.111,.106,p.hair);oval(c,-.057,.001,.030,.066,p.temple);
    line(c,[[-.119,.007],[-.064,-.030],[.076,-.030],[.128,.006]],.022,p.black);
    for(const sign of sides){oval(c,sign*.12,.003,.025,.043,p.headset);bar(c,sign*.126-.006,-.010,.013,.029,p.ochre);}
    c.restore();
  }
  function top(ctx,tr,s,t=0,state={}){
    if(!(s>0))return;
    const screen=(x,z)=>{
      const v=typeof tr==="function"?tr(x,z):[tr.px(x),tr.py(z)];return Array.isArray(v)?v:[v.x,v.y];
    };
    const o=screen(midX,midZ),a=screen(midX,midZ-1),b=screen(midX+1,midZ);
    ctx.save();ctx.transform(a[0]-o[0],a[1]-o[1],b[0]-o[0],b[1]-o[1],o[0],o[1]);
    const q=presentation(t,state||{});
    if(s<3.5){bar(ctx,-1.91,-.38,3.00,.76,p.green);bar(ctx,-1.06,-.388,2.13,.17,p.cream);ctx.restore();return;}
    baseOnMap(ctx);
    for(let i=0;i<2;i++){
      const x=decks[i],rot=i&&q.mixing&&!q.second?0:i?q.rightPhase:q.leftPhase;
      ctx.save();ctx.translate(x+.036,-.019);ctx.rotate(-rot);
      oval(ctx,0,0,.068,.068,labelColors[i?q.other:q.station]);oval(ctx,0,0,.009,.009,p.zinc);
      if(s>11){bar(ctx,.111,.024,.066,.008,p.paper);bar(ctx,-.032,-.007,.035,.007,p.slate);}ctx.restore();
      ctx.save();ctx.translate(x-.194,-.213);ctx.rotate(-(i?q.armB:q.armA));
      oval(ctx,0,0,.041,.041,p.darkMetal);line(ctx,[[0,0],[.036,.064],[.063,.126],[.119,.185],[.132,.219]],.014,p.chrome);
      bar(ctx,.121,.203,.026,.032,p.ochre);ctx.restore();
      const val=i?q.inc:q.beat,amp=(i&&!q.second?.14:.71)*(.42+.50*Math.abs(Math.sin(val*2.67)));
      line(ctx,[[i?-.099:.099,-.137],[(i?-.099:.099)+.055*(amp-.45),-.184]],.005,p.clay);
    }
    const x=mix(.14,-.14,q.blend);bar(ctx,x-.017,.18,.034,.042,p.black);bar(ctx,x-.003,.183,.006,.036,p.paper);
    bar(ctx,decks[1]-.315,.045+q.trim*.087,.046,.025,p.paper);
    if(wrap(q.beat,1)<.66)oval(ctx,.008-wrap(Math.floor(q.beat),4)*.06,-.274,.014,.010,p.cream);
    mapHost(ctx,host(q),s>12);ctx.restore();
  }
  function map(ctx,px,py,s,visible,t=0,state={},opt={}){
    if(opt.mode&&opt.mode!=="street"||!visible(px(midX),py(midZ),4.2*s))return;
    top(ctx,{px,py},s,t,state);
  }
  let operatorRig=null,operatorMotion=null;
  function mapOperator(c,px,py,s,player,t,state){
    const m=player?.motion;if(!m||!state?.mixing)return false;
    // Only the transforms are needed for the overhead operator. Nothing is skinned or uploaded.
    if(!operatorRig){
      operatorRig=new BayPlayerMesh(["#b68160","#398e86","#455d70"],"driver");
      operatorRig.bindings.length=0;operatorRig.rest=operatorRig.vertices=new Float32Array(0);operatorRig.skin=()=>{};
    }
    if(operatorMotion!==m){operatorRig.lastRevision=-1;operatorMotion=m;}
    operatorRig.update(m);
    const o=operatorRig,world=BayDriving.world,sideX=world(player,1,0),fore=world(player,0,1),x=px(player.x),z=py(player.z);
    const plan=v=>[v[0],v[2]],joint=(b,v)=>plan(b.map(v,[])),jersey=player.kit&&player.kit!=="street";
    const shirt=window.BayCourtPlayers?.kitColors[player.kit]||"#398e86",skin="#b68160",ink="#344d52";
    c.save();c.transform(px(sideX.x)-x,py(sideX.z)-z,px(fore.x)-x,py(fore.z)-z,x,z);
    c.lineCap="round";c.lineJoin="round";
    c.save();c.globalAlpha*=.21;oval(c,.050,.078,.282,.294,"#2e3d43");c.restore();
    for(const l of o.sides){
      const toe=joint(l.shoe,[l.side*.111,.080,.134]),heel=joint(l.shoe,[l.side*.111,.080,-.058]);
      line(c,[plan(l.hip),plan(l.knee),plan(l.ankle)],.126,"#455d70");
      line(c,[heel,toe],.119,"#cebb98");line(c,[heel,between(heel,toe,.88)],.100,"#608181");
    }
    const v=(x,y,z)=>joint(o.chest,[x,y,z]),hip=plan(o.pelvis.map([0,.966,0],[]));
    const lShoulder=v(-.207,1.378,0),rShoulder=v(.207,1.378,0),neck=v(0,1.410,.029);
    const leftWaist=[hip[0]-.144,hip[1]-.080],rightWaist=[hip[0]+.144,hip[1]-.080];
    c.fillStyle=shirt;c.strokeStyle=ink;c.lineWidth=.015;c.beginPath();
    c.moveTo(...leftWaist);c.quadraticCurveTo(...v(-.216,1.18,-.087),...lShoulder);
    c.quadraticCurveTo(neck[0],neck[1]+.073,...rShoulder);c.quadraticCurveTo(...v(.207,1.18,-.085),...rightWaist);
    c.quadraticCurveTo(hip[0],hip[1]-.129,...leftWaist);c.fill();c.stroke();
    line(c,[v(-.100,1.34,-.080),v(0,1.335,-.093),v(.107,1.344,-.083)],.014,jersey?"#ead5a2":"#8cae9f");
    if(jersey){
      for(const sign of sides)line(c,[v(sign*.162,1.025,-.08),v(sign*.190,1.18,-.075),v(sign*.197,1.356,-.037)],.023,p.paper);
      line(c,[v(-.051,1.177,-.122),v(-.025,1.219,-.123),v(-.025,1.126,-.122)],.015,p.paper);
      line(c,[v(.068,1.155,-.122),v(.000,1.155,-.122),v(.050,1.222,-.122),v(.050,1.126,-.121)],.014,p.paper);
    }
    const hands=[];
    for(const l of o.sides){
      const a=plan(l.shoulder),b=plan(l.elbow),hand=joint(l.forearm,l.handPivot),cuff=between(a,b,jersey?.18:.55);
      line(c,[a,cuff],jersey?.112:.137,shirt);line(c,[cuff,b],jersey?.093:.095,skin);
      line(c,[b,hand],.072,skin);hands.push({b,hand});
    }
    const center=joint(o.head,[0,1.632,.006]),nose=joint(o.head,[0,1.573,.113]);
    oval(c,nose[0],nose[1],.043,.032,skin);oval(c,center[0],center[1],.108,.100,skin);
    oval(c,center[0]-.003,center[1]-.016,.098,.095,"#37343c");
    line(c,[[center[0]-.077,center[1]-.046],[center[0]-.057,center[1]-.070],[center[0]-.017,center[1]-.079]],.011,"#4e4748");
    for(const obj of hands){
      const [dx,dz]=[obj.hand[0]-obj.b[0],obj.hand[1]-obj.b[1]],d=Math.hypot(dx,dz)||1,ux=dx/d,uz=dz/d;
      const palm=[obj.hand[0]-.036*ux,obj.hand[1]-.036*uz];
      line(c,[palm,obj.hand],.060,skin);line(c,[[palm[0]-.018*uz,palm[1]+.018*ux],obj.hand],.016,"#c89773");
    }
    c.restore();return true;
  }
  window.BayAirwavesBooth=Object.freeze({site,install,world,map,top,mapOperator});
})();
