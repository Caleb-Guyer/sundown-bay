/* June Bug and Inez Soria at Salt Creek. On the packet +Z is the bow, Y=0 is the waterline. */
(() => {
  "use strict";
  const cream="#eee0b9",ivory="#f5ebce",honey="#d5a04e",umber="#9e6243",navy="#354e58",
    dark="#354747",green="#64877a",glass="#6e9398",steel="#a4b0a3",wood="#ad8866",
    crate="#ae6348",red="#bd6550",skin="#ac795b",jacket="#cd9b4f",reflector="#ead9a1";
  const tau=2*Math.PI,clamp=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
  const wetLevel=z=>.025+.101*clamp((240-z)/12,0,1);
  const worldPoint=(a,x,z)=>[a.x+Math.cos(a.yaw)*x+Math.sin(a.yaw)*z,a.z-Math.sin(a.yaw)*x+Math.cos(a.yaw)*z];
  const sections=[[-3.6,.88,.64,-.19],[-3.31,1.10,.61,-.34],[-2.56,1.24,.58,-.44],[-1.46,1.29,.55,-.49],
    [-.2,1.30,.56,-.5],[1.15,1.25,.63,-.46],[2.04,1.07,.75,-.34],[2.85,.72,.89,-.15],[3.39,.29,1.02,.08],[3.6,.025,1.075,.43]];
  const cargo=[[-.62,-2.37,"ice"],[.56,-2.29,"ice"],[-.59,-1.27,"bait"],[.53,-1.26,"bait"]];
  const glyphs={I:["111","010","010","010","111"],C:["111","100","100","100","111"],J:["001","001","001","101","111"],U:["101","101","101","101","111"],N:["1001","1101","1011","1001","1001"],
    E:["111","100","110","100","111"],B:["110","101","110","101","110"],G:["111","100","101","101","111"]," ":["0","0","0","0","0"]};
  function nameplate(g,unit,to,words="JUNE BUG",ink=ivory){
    const chars=Array.from(words,letter=>glyphs[letter]);
    let left=-unit*chars.reduce((n,c)=>n+c[0].length+1,-1)/2;
    for(const glyph of chars){
      for(let row=0;row<5;row++)for(const run of glyph[row].matchAll(/1+/g)){
        const x=left+run.index*unit,y=(2.5-row)*unit,w=run[0].length*unit;
        g.quad(to(x,y),to(x+w,y),to(x+w,y-unit),to(x,y-unit),ink);
      }
      left+=(glyph[0].length+1)*unit;
    }
  }
  function rope(g,points,r,color,sides=5){for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,color,sides);}
  function plankHull(g){
    // From keel to cap rail, a hard chine and narrow boot stripe run aft into the squared transom.
    const rib=([z,w,h,k],side)=>{
      const stripe=Math.max(.072,k+.32*(h-k));
      return [[0,k,z],[side*w*.62,k+(stripe-k)*.22,z],[side*w*.83,k+(stripe-k)*.59,z],
        [side*w*.913,stripe,z],[side*w*.928,stripe+.044,z],
        [side*w*.994,h-.128,z],[side*w,h-.071,z],[side*w,h,z],[side*Math.max(0,w-.085),h+.009,z]];
    };
    const paints=[dark,"#4b5b58","#785e51",cream,honey,umber,dark,cream];
    const bands=(a,b,light)=>{for(let k=0;k<paints.length;k++)g.quad(a[k],b[k],b[k+1],a[k+1],paints[k],light);};
    for(let i=1;i<sections.length;i++)for(const side of [-1,1]){
      const a=rib(sections[i-1],side),b=rib(sections[i],side),top=a.length-1;
      bands(a,b,side<0?.91:1);
      g.quad(a[top],b[top],[0,b[top][1],b[top][2]],[0,a[top][1],a[top][2]],wood,i%3===1?.95:1);
    }
    bands(rib(sections[0],-1),rib(sections[0],1),.93);
    g.box(0,.372,-3.605,1.39,.224,.014,navy);
    nameplate(g,.038,(x,y)=>[x,.37+y,-3.617]);
  }
  function cabin(g){
    // A wheelhouse with open side curtains shows the helmsman through either side as the boat crosses.
    const rear=-.39,fore=1.49,base=.61,roof=2.48;
    for(const side of [-1,1]){
      const s=side;
      g.quad([s*.93,base,rear],[s*.91,base,fore],[s*.86,1.48,fore-.055],[s*.91,1.48,rear+.027],green);
      g.quad([s*.931,1.37,rear+.02],[s*.872,1.37,fore-.05],[s*.865,1.454,fore-.052],[s*.916,1.454,rear+.025],cream);
      for(const [bottom,top] of [[-.38,-.33],[.34,.34],[1.42,1.19]])
        g.pole([s*.88,1.46,bottom],[s*.80,roof,top],.043,ivory,5);
      g.pole([s*.914,1.5,-.38],[s*.88,1.5,1.42],.046,"#976f4e",5);
      // Rolled canvas sits at the header; an aft pane and forward corner panes catch the sky.
      g.pole([s*.828,2.35,-.32],[s*.828,2.35,1.19],.070,"#c5b89a",6);
      g.quad([s*.90,1.52,-.33],[s*.895,1.52,-.005],[s*.81,2.32,-.005],[s*.812,2.32,-.304],glass);
      g.quad([s*.833,1.66,1.385],[s*.82,1.66,1.385],[s*.76,2.26,1.23],[s*.78,2.26,1.23],cream);
      g.box(s*.91,1.20,.52,.028,.25,.87,navy);
      nameplate(g,.021,(x,y)=>[s*.931,1.20+y,.52+s*x]);
    }
    g.quad([-.91,base,fore],[.91,base,fore],[.86,1.50,fore-.059],[-.86,1.50,fore-.059],green);
    for(const [lo,hi] of [[-.836,-.047],[.047,.836]]){
      g.quad([lo,1.535,1.436],[hi,1.535,1.436],[hi*.937,2.35,1.208],[lo*.937,2.35,1.208],glass);
      const left=lo+.056;
      g.quad([left,1.94,1.326],[left+.092,1.94,1.326],[left+.245,2.29,1.229],[left+.152,2.29,1.229],"#9abaad");
    }
    g.pole([0,1.45,1.44],[0,roof,1.18],.043,cream,5);
    g.quad([-.90,.62,rear],[.90,.62,rear],[.90,1.39,rear],[.28,1.39,rear],"#5a766c");
    g.quad([-.90,.62,rear],[.28,1.39,rear],[.26,1.50,rear],[-.90,1.50,rear],green);
    g.box(-.47,1.79,rear,.71,.51,.047,glass);
    g.box(-.10,1.98,rear,.052,.96,.07,cream);
    g.box(.83,1.96,rear,.057,.97,.07,cream);
    g.box(0,2.436,.47,1.89,.089,1.998,navy);
    // Small, arched coach roof with a red ventilator and weather-stained drip rail.
    for(const s of [-1,1]){
      g.quad([0,2.547,-.58],[s*1.0,2.478,-.58],[s*.97,2.478,1.52],[0,2.547,1.52],ivory,s<0?.95:1);
      g.quad([s*1.0,2.478,-.58],[s*.97,2.478,1.52],[s*.97,2.448,1.52],[s*1.0,2.448,-.58],umber);
    }
    g.box(.35,2.541,.13,.44,.056,.56,green);
    g.box(.35,2.597,.13,.332,.074,.43,"#9db4a2");
    g.cyl(-.45,2.60,.67,.10,.145,.18,7,red);
    g.cyl(-.45,2.697,.67,.16,.14,.055,7,red);
    for(const s of [-1,1]){
      g.box(s*.91,2.491,.98,.18,.131,.29,navy);
      g.box(s*.995,2.511,.99,.067,.086,.160,s<0?"#fa8b78":"#b1ddb4");
    }
  }
  function basket(g,x,z,kind){
    const ice=kind==="ice",w=ice?.91:.84,d=ice?.86:.69,base=.60,h=ice?.47:.38;
    g.box(x,base+h*.5,z,w,h,d,ice?"#c1d4cd":crate);
    if(ice){
      g.box(x,base+h+.033,z,w+.033,.07,d+.038,cream);
      g.box(x,base+h+.074,z,w*.87,.018,d*.83,"#e1e8da");
      for(const side of [-1,1]){
        g.box(x+side*w*.34,base+h*.72,z-d*.504,.068,.126,.017,navy);
        g.box(x+side*(w*.51),base+h*.72,z,.023,.067,.23,navy);
      }
    }else{
      g.box(x,base+h+.014,z,w+.04,.065,d+.04,"#d78157");
      g.box(x,base+h+.049,z,w-.087,.010,d-.105,"#784c45");
      for(const n of [-1,0,1])for(const side of [-1,1])
        g.box(x+n*.205,base+.19,z+side*(d*.502),.138,.075,.012,"#805044");
      for(const n of [-1,1])g.box(x+n*.143,base+h+.07,z,.080,.045,d-.061,"#b66f4b");
    }
  }
  function skipper(g){
    // He stands to starboard of the center mullion, visible from the catwalk above as well.
    g.box(.30,1.35,.47,.46,.64,.31,"#58717b");
    g.box(.30,1.768,.48,.108,.15,.12,"#995f47");
    g.cyl(.30,1.942,.494,.125,.12,.25,8,"#be8b69");
    g.box(.30,1.923,.623,.062,.056,.028,"#c79672");
    for(const s of [-1,1]){
      g.box(.30+s*.051,1.982,.615,.025,.013,.015,dark);
      rope(g,[[.30+s*.205,1.60,.49],[.30+s*.244,1.43,.68],[.30+s*.127,1.57,.92]],.055,"#647c81");
      g.cyl(.30+s*.127,1.565,.92,.049,.046,.085,6,"#be8b69");
    }
    g.cyl(.30,2.079,.489,.12,.14,.070,8,"#cdab76");
    g.cyl(.30,2.043,.506,.165,.169,.026,9,cream);
    const wheel=[];for(let i=0;i<=10;i++){const a=tau*i/10;wheel.push([.30+.176*Math.cos(a),1.54+.124*Math.sin(a),.947+.06*Math.sin(a)]);}
    rope(g,wheel,.023,navy,4);
    g.box(.12,1.37,1.112,1.11,.26,.28,"#526f68");
  }
  function deckFittings(g){
    for(const [x,z,k] of cargo)basket(g,x,z,k);
    // The boat carries a two-hook cargo mast, rigged so the work deck remains clear.
    g.pole([-.89,.60,-.59],[-.89,3.58,-.50],.069,umber,7);
    g.pole([-.89,2.83,-.521],[-.89,3.49,-.50],.074,cream,7);
    g.pole([-.89,3.48,-.50],[-.89,3.79,-.49],.042,dark,6);
    g.cyl(-.89,3.79,-.49,.060,.061,.115,7,ivory);
    g.pole([-.89,1.07,-.60],[-.89,2.35,-2.81],.065,umber,6);
    rope(g,[[-.89,3.22,-.52],[-.89,2.36,-2.81],[-.89,1.58,-2.81]],.016,steel,4);
    rope(g,[[-.89,1.62,-2.81],[-.89,1.55,-2.82],[-.85,1.529,-2.82],[-.826,1.573,-2.82]],.023,umber,5);
    rope(g,[[-.89,3.28,-.52],[.99,1.00,-.59]],.014,"#a4a69a",4);
    g.pole([.69,2.47,1.02],[.73,3.33,.93],.014,navy,4);
    g.box(.67,2.55,1.02,.12,.13,.12,navy);
    for(const s of [-1,1]){
      const sides=[[-3.13,1.06,.60],[-1.83,1.20,.56],[-.67,1.23,.56]];
      for(let i=0;i<sides.length;i++){
        const [z,x,y]=sides[i];g.pole([s*x,y,z],[s*x,y+.36,z],.039,cream,5);
        if(i){const [bz,bx,by]=sides[i-1];g.pole([s*bx,by+.35,bz],[s*x,y+.35,z],.035,cream,5);}
      }
      rope(g,[[s*.97,.80,2.12],[s*.97,1.21,2.12],[s*.65,1.34,2.85],[s*.18,1.40,3.43]],.029,steel,5);
      g.pole([s*.65,.89,2.85],[s*.65,1.33,2.85],.024,steel,5);
      for(const [z,x] of [[-2.92,1.16],[.21,1.29]]){
        g.pole([s*(x-.045),.81,z-.087],[s*(x+.047),.37,z],.018,"#c3b398",4);
        g.cyl(s*(x+.046),.295,z,.074,.079,.24,7,navy);
        g.cyl(s*(x+.046),.428,z,.050,.078,.042,7,steel);
      }
    }
    // Stern cleats, a coiled dockline and the forward anchor hatch.
    for(const x of [-.63,.63]){
      g.box(x,.709,-3.33,.092,.11,.12,dark);g.box(x,.78,-3.33,.22,.039,.104,steel);
    }
    for(let i=0;i<2;i++){
      const loop=[];for(let j=0;j<=10;j++){const a=j*tau/10;loop.push([-.21+(.19+i*.052)*Math.cos(a),.642+.025*i,-3.12+(.11+i*.027)*Math.sin(a)]);}
      rope(g,loop,.022,"#d2b68a",4);
    }
    g.box(0,.885,2.53,.68,.12,.58,navy);g.box(0,.960,2.53,.60,.044,.48,"#98ac9a");
  }
  function distantHull(g){
    plankHull(g);
    g.box(0,1.54,.51,1.76,1.79,1.79,green);g.box(0,1.98,.50,1.79,.74,1.81,glass);
    g.box(0,2.48,.47,1.99,.135,2.07,ivory);g.pole([-.88,.6,-.59],[-.88,3.77,-.49],.084,umber,4);
    g.pole([-.88,1.09,-.61],[-.88,2.34,-2.80],.065,umber,4);
    for(const [x,z,kind] of cargo)g.box(x,.84,z,.87,.47,.78,kind==="ice"?cream:crate);
  }
  function propWash(g){
    for(const side of [-1,1]){
      for(const [x,z,dx,dz,w] of [[.85,-2.82,.62,1.72,.12],[1.46,-4.80,.71,1.68,.085],[2.35,-6.92,.53,1.22,.056]]){
        g.quad([side*x,0,z],[side*(x+w),0,z-.17],[side*(x+w+dx),0,z-dz-.12],[side*(x+dx),0,z-dz],"#adc7b9");
      }
      g.tri([side*.17,0,-3.38],[side*.68,0,-3.58],[side*.31,0,-5.37],"#c5d3bc");
    }
  }
  const {at,heading}=BayDrawbridge,pierU=-39.6,scowU=74.3,pier=at(0,pierU),scow=at(0,scowU);
  const keeperDesk={...BayDrawbridge.site,y:1.83,yaw:heading};
  const pivot={s:-4.15,u:-38.75},bowLoadZ=2.53,boxDeck=.983,boomTop=3.45;
  const pickupYaw=Math.atan2(-33.5-bowLoadZ-pivot.u,-1.55-pivot.s);
  const boomReach=Math.hypot(-33.5-bowLoadZ-pivot.u,-1.55-pivot.s),dropU=-40.13;
  const dropYaw=Math.asin((dropU-pivot.u)/boomReach),dropS=pivot.s+boomReach*Math.cos(dropYaw);
  const mix=(a,b,t)=>a+(b-a)*t,smooth=(a,b,n)=>{const v=clamp((n-a)/(b-a),0,1);return v*v*(3-2*v);};
  const headLevel=.54,palletLevel=.66,walkEnd=at(12,-52),trailLevel=BayCut.height(walkEnd.x,walkEnd.z);
  const walk=[[-40-pierU,0,headLevel],[-44-pierU,2,headLevel],[-52-pierU,12,trailLevel]];
  function slopedWalk(g){
    // Miter the dogleg so the planks meet at the Shell Levee approach with no exposed corner.
    const directions=walk.slice(1).map((v,i)=>{const dx=v[0]-walk[i][0],dz=v[1]-walk[i][1],len=Math.hypot(dx,dz);return {x:dz/len,z:-dx/len,len};});
    const right=walk.map((_,i)=>{const a=directions[Math.max(0,i-1)],b=directions[Math.min(1,i)],k=1+a.x*b.x+a.z*b.z;return [(a.x+b.x)/k,(a.z+b.z)/k];});
    for(let i=0;i<2;i++){
      const a=walk[i],b=walk[i+1],planks=Math.ceil(directions[i].len/.365);
      const pt=(t,offset,rise=0)=>[mix(a[0],b[0],t)+mix(right[i][0],right[i+1][0],t)*offset,
        mix(a[2],b[2],t)+rise,mix(a[1],b[1],t)+mix(right[i][1],right[i+1][1],t)*offset];
      g.quad(pt(0,-1.12,-.016),pt(0,1.12,-.016),pt(1,1.12,-.016),pt(1,-1.12,-.016),"#686c60");
      for(let j=0;j<planks;j++){
        const f=(j+.025)/planks,n=(j+.975)/planks;
        g.quad(pt(f,-1.12),pt(f,1.12),pt(n,1.12),pt(n,-1.12),["#b39d78","#bda887","#b5a486","#a79879","#b7a380"][j%5]);
      }
      for(const side of [-1,1]){
        g.quad(pt(0,side*1.12),pt(1,side*1.12),pt(1,side*1.12,-.14),pt(0,side*1.12,-.14),"#8c806a");
        g.pole(pt(0,side*.76,-.13),pt(1,side*.76,-.13),.074,"#695e4d",5);
      }
      // Low guide posts and one rope leave the road end open for people and delivery carts.
      const steps=Math.ceil(directions[i].len/2.9);
      for(let j=i?1:0;j<=steps;j++)for(const side of [-1,1]){
        const f=j/steps,p=pt(f,side*1.055),tall=i===1&&j===steps?.34:.69;
        g.pole([p[0],-.15,p[2]],[p[0],p[1]+tall,p[2]],.070,"#817a62",6);
        if(j){const q=pt((j-1)/steps,side*1.055);g.pole([q[0],q[1]+.58,q[2]],[p[0],p[1]+tall-.1,p[2]],.016,"#a79978",4);}
      }
    }
  }
  function landing(g){
    slopedWalk(g);
    g.box(0,.427,0,2.2,.19,9.4,"#827a64");
    for(let i=0;i<25;i++){
      const z=-4.7+(i+.5)*9.4/25;
      g.box(0,.524,z,2.19,.032,9.4/25-.018,["#b29b79","#a99678","#bba586","#b09c80"][i%4]);
    }
    for(const x of [-.92,.92])for(const z of [-4.28,-2.17,.16,2.32,4.15]){
      g.cyl(x,.118,z,.102,.116,.90,7,"#706d5a");g.cyl(x,.028,z,.116,.119,.15,7,"#657466");
      if(x>0&&z<4)g.box(x+.19,.37,z,.088,.27,.54,"#495b57");
    }
    // The public skiff can lie directly beside the north ladder. Its reach rails rise over the landing.
    const ladderX=-39.4-pierU;
    for(const side of [-1,1]){
      const x=ladderX+side*.31;
      rope(g,[[x,.58,4.28],[x,1.09,4.28],[x,1.16,4.38],[x,1.16,4.59],[x,1.05,4.779],[x,-.54,4.779]],.040,steel,6);
    }
    for(const y of [-.46,-.18,.10,.38,.60])g.pole([ladderX-.30,y,4.779],[ladderX+.30,y,4.779],.029,"#b9c6b3",6);
    for(const x of [-.77,.82]){g.box(x,.598,4.44,.098,.116,.17,navy);g.box(x,.667,4.44,.29,.049,.118,steel);}
    // A ledger, hanging receipt slips and a mechanical scale at Leda's short, shore-facing counter.
    g.box(-.81,.925,-3.18,.44,.74,2.03,"#63867c");g.box(-.81,1.326,-3.18,.52,.079,2.12,"#bbb69b");
    g.box(-.53,1.081,-3.18,.028,.374,1.51,cream);nameplate(g,.063,(x,y)=>[-.507,1.08+y,-3.18+x],"ICE",umber);
    g.box(-.76,1.41,-2.60,.29,.08,.35,navy);g.cyl(-.76,1.48,-2.60,.137,.106,.072,8,steel);
    g.box(-.73,1.39,-3.17,.32,.032,.41,cream);g.box(-.71,1.415,-3.12,.20,.008,.015,steel);
    for(const z of [-3.98,-2.18])g.pole([-.975,1.30,z],[-.975,2.29,z],.043,green,5);
    g.quad([-1.075,2.36,-4.15],[-.31,2.19,-4.15],[-.31,2.19,-2.03],[-1.075,2.36,-2.03],"#ae6b50");
    for(let i=0;i<5;i++){
      const z=-4.15+i*.424;g.quad([-.31,2.19,z],[-.31,2.19,z+.424],[-.31,2.10,z+.424],[-.31,2.10,z],i%2?"#cbac86":"#a5614e");
    }
    for(const s of [-1,1])g.box(dropU-pierU+s*.225,.591,dropS,.089,.096,.91,"#866e55");
    for(const n of [-1,0,1])g.box(dropU-pierU,.636,dropS+n*.306,.78,.048,.242,"#a88a68");
    const pivotX=pivot.u-pierU;
    g.box(pivotX,.63,pivot.s,.39,.19,.45,"#738075");g.cyl(pivotX,1.585,pivot.s,.092,.134,1.83,8,navy);
    g.cyl(pivotX,2.53,pivot.s,.13,.14,.19,8,umber);g.cyl(pivotX,2.653,pivot.s,.105,.128,.06,8,cream);
    g.box(pivotX-.065,1.57,pivot.s+.227,.26,.28,.275,green);
    g.pole([pivotX-.25,1.59,pivot.s+.22],[pivotX+.06,1.59,pivot.s+.22],.085,navy,7);
    const wheel=[];for(let i=0;i<=12;i++){const a=i*tau/12;wheel.push([pivotX-.33,1.66+.145*Math.cos(a),pivot.s+.345+.145*Math.sin(a)]);}rope(g,wheel,.022,umber,5);
    rope(g,[[pivotX-.24,1.59,pivot.s+.22],[pivotX-.33,1.66,pivot.s+.345],[pivotX-.33,1.75,pivot.s+.445]],.028,navy,5);
  }
  function shoreBoom(g){
    // Two angle irons meet at a sheave directly over the load. Model pivot is the bank-side kingpost.
    for(const side of [-1,1]){
      g.pole([side*.081,2.25,.032],[side*.073,boomTop,boomReach],.058,green,5);
      g.pole([side*.077,2.65,.042],[side*.074,boomTop,boomReach],.028,steel,5);
    }
    g.pole([-.111,boomTop,boomReach],[.111,boomTop,boomReach],.103,umber,8);
    g.pole([0,2.60,0],[0,2.98,1.93],.032,navy,4);
  }
  function loadCase(g){
    g.box(0,.225,0,.71,.45,.69,"#c1d6d1");g.box(0,.468,0,.74,.064,.71,cream);g.box(0,.514,0,.62,.032,.59,"#e4e7d7");
    for(const side of [-1,1]){
      g.box(side*.229,.534,0,.050,.020,.72,"#637e88");
      for(const z of [-.35,.35])g.box(side*.229,.259,z,.050,.52,.013,"#688794");
      g.box(side*.361,.253,-.01,.012,.063,.17,navy);
    }
    nameplate(g,.027,(x,y)=>[x,.251+y,-.353],"ICE",navy);
  }
  function sling(g){
    for(const x of [-.229,.229])for(const z of [-.255,.255])g.pole([x,.541,z],[0,.808,0],.014,"#9c7851",4);
    g.pole([0,.80,0],[0,.853,0],.024,umber,5);
  }
  function storeBarge(g){
    // The outboard shed faces the packet. Its short overhead track brings one case down to the bow.
    const rim=[[-2.9,-4.10],[-2.40,-4.80],[2.24,-4.80],[2.81,-4.05],[2.81,4.00],[2.15,4.80],[-2.44,4.80],[-2.9,4.13]];
    for(let i=0;i<rim.length;i++){
      const a=rim[i],b=rim[(i+1)%rim.length],pt=(p,h,shrink=1)=>[p[0]*shrink,h,p[1]*shrink];
      g.quad(pt(a,-.24,.94),pt(b,-.24,.94),pt(b,.30),pt(a,.30),navy,i%3===0?.92:1);
      g.quad(pt(a,.30),pt(b,.30),pt(b,.42),pt(a,.42),umber);
      g.quad(pt(a,.42),pt(b,.42),pt(b,.48),pt(a,.48),cream);g.tri([0,.48,0],pt(a,.48),pt(b,.48),"#a89a7d");
    }
    g.box(.81,1.55,-.47,2.49,2.14,5.11,"#779487");
    for(const z of [-2.76,-2.26,-1.76,-1.26,-.76,-.26,.24,.74,1.27,1.78])g.box(.81,1.57,z,2.51,1.96,.025,"#69877c");
    g.box(-.458,1.42,-.23,.026,1.56,1.35,navy);g.box(-.47,.865,-.22,.035,.47,1.24,"#99aba0");
    for(const z of [-2.20,1.21]){g.box(-.468,1.815,z,.036,.56,.71,cream);g.box(-.489,1.818,z,.035,.414,.578,glass);}
    g.box(2.076,1.75,-.32,.025,.72,2.12,cream);nameplate(g,.098,(x,y)=>[2.095,1.76+y,-.32+x],"ICE",umber);
    g.box(-.507,2.29,-.21,.040,.403,1.50,cream);nameplate(g,.052,(x,y)=>[-.532,2.29+y,-.21-x],"ICE",navy);
    for(const [x,h] of [[-.78,2.65],[2.32,2.87]])g.box(x,h,-.47,.083,.102,5.70,navy);
    g.quad([-.84,2.69,-3.36],[2.36,2.93,-3.36],[2.36,2.93,2.42],[-.84,2.69,2.42],"#c6c8ae");
    for(let i=0;i<12;i++){const z=-3.34+i*.47;g.pole([-.83,2.693,z],[2.35,2.931,z],.022,"#9da99b",4);}
    for(const z of [-3.54,3.30]){
      for(const x of [-1.38,-2.19]){g.box(x,.773,z,.72,.57,.80,"#b3cac4");g.box(x,1.081,z,.76,.072,.83,cream);}
      g.box(-1.45,1.38,z,.66,.53,.73,"#bed1c8");g.box(-1.45,1.671,z,.72,.066,.78,cream);
    }
    for(const z of [-3.70,-1.70,.44,2.29,3.86]){
      g.pole([-2.88,.57,z],[-2.94,.15,z+.018],.024,wood,4);g.cyl(-2.94,.15,z,.10,.108,.30,7,dark);
    }
    for(const z of [-3.78,3.78]){g.pole([2.57,-.30,z],[2.57,1.61,z],.116,"#666659",7);g.cyl(2.57,1.48,z,.124,.126,.116,7,cream);}
    const lane=1.55;g.pole([-1.05,.48,lane],[-1.05,2.745,lane],.083,green,6);
    g.pole([-1.05,1.62,lane],[-2.66,2.70,lane],.060,green,5);
    g.box(-2.88,2.755,lane,3.95,.131,.106,"#967151");g.box(-2.88,2.677,lane,3.95,.041,.214,navy);
  }
  function leda(g,working){
    const pieces=new BayMesh(),parts=[];
    buildBayPerson(pieces,"#8e604a","#a46b55","#596968",0,"local",0,part=>parts.push([part,pieces.vertices.length]));
    for(let i=0;i<parts.length;i++)if(parts[i][0]!=="arm")g.vertices.push(...pieces.vertices.slice(parts[i][1],parts[i+1]?.[1]??pieces.vertices.length));
    const apron="#4d7076",workSkin="#8e604a";
    g.quad([-.100,1.339,.124],[.107,1.339,.124],[.15,.91,.123],[-.149,.91,.123],apron);
    g.quad([-.15,.91,.123],[.15,.91,.123],[.143,.725,.14],[-.145,.757,.13],apron);
    for(const side of [-1,1]){
      g.pole([side*.093,1.415,.079],[side*.086,1.319,.127],.016,"#bcaa8c",4);
      if(working&&side>0)continue;
      g.pole([side*.203,1.407,.00],[side*.238,1.241,.054],.076,"#b27860",7);
      g.pole([side*.235,1.266,.045],[side*.247,1.227,.064],.073,"#cf9a76",6);
      const elbow=[side*.252,1.158,.088],hand=[side*.084,1.126,.246];
      g.pole([side*.246,1.233,.065],elbow,.051,workSkin,7);g.pole(elbow,hand,.048,workSkin,6);
      g.pole(hand,[side*.048,1.144,.253],.038,workSkin,6);
    }
    if(!working){g.box(0,1.147,.248,.166,.020,.12,cream,.14);g.box(0,1.157,.25,.069,.002,.009,navy);}
    g.cyl(.0,1.741,-.008,.106,.119,.097,9,"#515e59");g.cyl(.0,1.703,-.006,.123,.119,.036,9,green);
    g.quad([-.103,1.716,.074],[.104,1.716,.074],[.081,1.696,.168],[-.083,1.696,.168],"#8da596");
    g.pole([-.024,1.690,-.085],[-.065,1.540,-.141],.059,"#424039",7);g.pole([-.066,1.552,-.138],[-.072,1.51,-.145],.033,red,6);
  }
  function workArm(g){
    g.pole([0,0,0],[.038,-.156,.069],.075,"#b27860",7);g.pole([.035,-.135,.063],[.044,-.173,.077],.074,"#cf9a76",6);
    g.pole([.043,-.170,.076],[.037,-.241,.118],.051,"#8e604a",7);g.pole([.037,-.241,.118],[-.095,-.251,.249],.046,"#8e604a",6);
    g.pole([-.095,-.251,.249],[-.143,-.262,.267],.037,"#8e604a",6);
  }
  const standZ=.525,handleY=1.022,handleZ=.428,handleX=.218,leverLength=.203;
  function desk(g){
    g.box(0,.051,standZ,.58,.102,.42,"#73827a");
    g.box(0,.461,standZ,.29,.775,.25,green);
    g.box(0,.875,standZ,.851,.242,.455,green);
    g.box(0,1.01,standZ,.876,.051,.478,"#8ba597");
    g.box(0,.942,standZ-.24,.72,.044,.015,cream);
    g.box(-.242,.867,standZ-.247,.153,.049,.018,navy);
    for(const [i,col] of [[0,red],[1,"#ecd079"],[2,"#bdd3ae"]]){
      g.cyl(.038+i*.106,1.043,.650,.038,.040,.032,8,navy);
      g.cyl(.038+i*.106,1.065,.650,.028,.029,.025,8,col);
    }
    g.box(handleX,1.046,handleZ,.147,.025,.204,navy);
    g.box(handleX,1.062,handleZ,.035,.014,.164,"#78837d");
    g.pole([handleX-.074,handleY,handleZ],[handleX+.074,handleY,handleZ],.045,navy,6);
    // Inez's clothbound bridge log carries two columns for vessel and opening time.
    g.box(-.227,1.051,.521,.322,.028,.327,umber);
    for(const side of [-1,1]){
      g.box(-.227+side*.079,1.073,.522,.147,.020,.300,cream);
      for(let j=0;j<6;j++)g.box(-.227+side*.080,1.085,.402+j*.043,.119,.002,.004,"#a7b1a1");
      for(let j=0;j<4;j++)g.box(-.232+side*.083,1.087,.402+j*.043+.009,.035+.010*(j%3),.002,.005,navy,side*.094);
    }
    g.box(-.227,1.088,.518,.006,.003,.295,"#c0a383");
  }
  function lever(g){
    g.pole([0,0,0],[0,leverLength,0],.019,steel,6);
    g.pole([-.047,leverLength,0],[.047,leverLength,0],.038,umber,7);
  }
  function tenderPieces(){
    const base=new BayMesh(),parts=[],body=[],head=[];
    buildBayPerson(base,skin,"#52837b","#495e6a",0,"local",0,part=>parts.push([part,base.vertices.length]));
    for(let i=0;i<parts.length;i++){
      const [part,start]=parts[i];if(part==="arm")continue;
      const out=part==="head"?head:body,end=parts[i+1]?.[1]??base.vertices.length;
      for(let j=start;j<end;j+=6){const a=base.vertices;out.push(a[j],a[j+1]-(part==="head"?1.515:0),a[j+2],a[j+3],a[j+4],a[j+5]);}
    }
    return {head,body};
  }
  function body(g,pieces){
    g.vertices.push(...pieces.body);
    for(const side of [-1,1]){
      const x=n=>side*n;
      g.quad([x(.036),1.422,.120],[x(.147),1.405,.109],[x(.155),.986,.108],[x(.027),.961,.119],jacket);
      g.quad([x(.038),1.179,.122],[x(.146),1.20,.116],[x(.145),1.235,.116],[x(.038),1.214,.122],reflector);
      g.quad([x(.042),1.422,.124],[x(.084),1.426,.119],[x(.062),1.294,.125],[x(.026),1.278,.126],"#98724d");
      g.box(x(.110),1.072,.122,.084,.085,.008,"#af8149");
      g.box(x(.111),1.112,.129,.092,.019,.012,"#e0b46d");
    }
    g.quad([-.143,1.424,-.118],[.144,1.424,-.118],[.125,.958,-.108],[-.125,.958,-.108],jacket);
    g.quad([-.140,1.259,-.122],[.138,1.259,-.122],[.136,1.214,-.12],[-.137,1.214,-.12],reflector);
    g.box(.089,1.29,.13,.076,.031,.011,cream);g.box(.084,1.293,.137,.034,.005,.004,navy);
    g.box(-.12,1.30,.139,.068,.088,.035,navy);g.pole([-.142,1.331,.146],[-.152,1.411,.143],.006,navy,4);
    rope(g,[[-.128,1.258,.148],[-.157,1.197,.130],[-.161,1.084,.070],[-.162,.998,.035]],.007,dark,4);
    // Her left hand holds a carpenter's pencil against the open ledger.
    const shoulder=[-.204,1.406,0],elbow=[-.254,1.17,.104],wrist=[-.157,1.125,.304];
    g.pole(shoulder,[-.237,1.276,.064],.079,"#57877f",7);
    g.pole([-.236,1.288,.052],[-.247,1.243,.074],.076,"#91a598",7);
    g.pole([-.246,1.246,.073],elbow,.053,skin,7);g.pole(elbow,wrist,.049,skin,7);
    g.pole(wrist,[-.149,1.12,.344],.040,skin,6);
    g.pole([-.148,1.162,.283],[-.144,1.090,.387],.009,red,4);
    g.pole([-.144,1.096,.378],[-.144,1.086,.392],.005,navy,4);
    g.pole([-.169,1.128,.282],[-.159,1.125,.309],.051,navy,7);
  }
  function tenderHead(g,pieces){
    g.vertices.push(...pieces.head);
    // A short silver braid, work cap and wire-frame spectacles distinguish Inez at the railing.
    for(const s of [-1,1]){
      g.quad([s*.096,.186,.051],[s*.109,.178,.012],[s*.100,.070,-.014],[s*.089,.089,.016],"#ada99a");
      const eye=[];for(let j=0;j<=8;j++){const a=j*tau/8;eye.push([s*.053+.038*Math.cos(a),.126+.023*Math.sin(a),.109]);}
      rope(g,eye,.0048,navy,4);rope(g,[[s*.089,.128,.106],[s*.104,.135,.050],[s*.105,.127,-.009]],.0058,navy,4);
    }
    g.pole([-.018,.131,.108],[.018,.131,.108],.0048,navy,4);
    g.pole([-.016,.173,-.098],[-.046,.105,-.135],.051,"#a4a497",7);
    g.pole([-.044,.112,-.134],[-.071,.045,-.141],.038,"#bcb6a2",6);
    g.pole([-.070,.053,-.141],[-.074,.032,-.139],.032,red,6);
    g.cyl(0,.230,-.003,.101,.121,.068,9,"#5d7974");
    g.cyl(0,.204,.006,.119,.120,.030,9,green);
    g.quad([-.099,.212,.073],[.102,.212,.073],[.082,.195,.172],[-.078,.195,.171],"#74897a");
    g.box(0,.232,.104,.041,.025,.008,reflector);
  }
  function upperArm(g){
    g.pole([0,.024,0],[0,-.167,0],.079,"#57877f",7);
    g.pole([0,-.136,0],[0,-.182,0],.077,"#91a598",7);
    g.pole([0,-.177,0],[0,-.288,0],.053,skin,7);
  }
  function lowerArm(g){
    g.pole([0,.022,0],[0,-.214,0],.047,skin,7);g.pole([0,-.204,0],[0,-.277,0],.040,skin,6);
  }
  function install(model){
    model("june-bug",g=>{plankHull(g);cabin(g);skipper(g);deckFittings(g);});model("june-bug-distant",distantHull);model("june-bug-wash",propWash);
    const pieces=tenderPieces();model("bridge-inez",g=>body(g,pieces));model("bridge-inez-head",g=>tenderHead(g,pieces));
    model("bridge-inez-upper",upperArm);model("bridge-inez-lower",lowerArm);model("bridge-keeper-desk",desk);model("bridge-keeper-lever",lever);
    model("shell-levee-ice",landing);model("ice-landing-jib",shoreBoom);model("ice-landing-leda",g=>leda(g,false));model("salt-ice-scow",storeBarge);
    model("ice-landing-leda-winch",g=>leda(g,true));model("ice-landing-forearm",workArm);
    model("salt-ice-case",loadCase);model("salt-ice-sling",sling);model("ice-winch-line",g=>g.pole([0,0,0],[0,-.39,0],.011,navy,4));
    model("ice-winch-hook",g=>{g.cyl(0,0,0,.044,.057,.105,6,umber);rope(g,[[0,-.039,0],[0,-.098,0],[.045,-.121,0],[.065,-.085,0]],.013,navy,5);});
  }
  function tenderPose(state,t){
    const lift=clamp(state.lift||0,0,1),closed=state.phase==="road",packet=state.packet,tender=state.tender;
    let looking=0;
    if(packet&&tender){const a=Math.atan2(packet.x-tender.x,packet.z-tender.z)-tender.yaw;looking=clamp(Math.atan2(Math.sin(a),Math.cos(a)),-.84,.84);}
    const relief=smooth(0,.78,state.relief||0),angle=-.80+1.40*lift;
    const dy=mix(handleY+leverLength*Math.cos(angle),1.049+.016*Math.sin(t*.79),relief);
    const dz=mix(handleZ+leverLength*Math.sin(angle),.109+.025*Math.cos(t*.61),relief);
    const shoulderY=1.405,shoulderZ=.028,upperLen=.286,lowerLen=.268;
    const down=shoulderY-dy,fore=dz-shoulderZ,reach=clamp(Math.hypot(down,fore),.05,upperLen+lowerLen-.0001);
    const upper=Math.atan2(fore,down)-Math.acos(clamp((upperLen*upperLen+reach*reach-lowerLen*lowerLen)/(2*upperLen*reach),-1,1));
    const elbowY=shoulderY-upperLen*Math.cos(upper),elbowZ=shoulderZ+upperLen*Math.sin(upper);
    const read=closed?.5+.5*Math.cos(t*.69):state.onWatch?.19:0;
    return {angle,shoulderY,shoulderZ,elbowY,elbowZ,upper,lower:Math.atan2(dz-elbowZ,elbowY-dy),
      look:looking*(1-read)+.05*Math.sin(t*.91),nod:.36*read+.030*Math.sin(t*1.04),handZ:dz};
  }
  function packetRoll(p,t,hours){
    const fast=Math.abs(p.speed||0),rain=clamp(hours?.rain||0,0,1),sway=t*1.23+p.z*.035;
    return {y:wetLevel(p.z)+.014+(.026+.012*rain)*Math.sin(sway),pitch:.011*Math.sin(sway+.8)-Math.min(.018,.003*fast),roll:(.012+.009*rain)*Math.sin(t*.911+p.x*.05)};
  }
  function deckCase(p,body){
    const up=boxDeck*Math.cos(body.pitch)-bowLoadZ*Math.sin(body.pitch),forward=boxDeck*Math.sin(body.pitch)+bowLoadZ*Math.cos(body.pitch);
    const [x,z]=worldPoint(p,-up*Math.sin(body.roll),forward);
    return {x,y:body.y+up*Math.cos(body.roll),z,yaw:p.yaw,pitch:body.pitch,roll:body.roll};
  }
  function dockLoad(p,t,hours){
    const inner=p?.wait>0&&p.u<0,outer=p?.wait>0&&p.u>0,landed=p?.ice===false;
    const q=inner?clamp(1-p.wait/13,0,1):0,load=outer?clamp(1-p.wait/24,0,1):0;
    const boat=p&&deckCase(p,packetRoll(p,t,hours)),fromY=inner?boat.y:1.05;
    const cross=inner?smooth(.36,.71,q):1,approach=p?.ice!==false&&!inner?smooth(20,33,-(p?.u??0)):0;
    const angle=inner?mix(pickupYaw,dropYaw,cross):mix(dropYaw,pickupYaw,approach);
    const head=at(pivot.s+boomReach*Math.cos(angle),pivot.u+boomReach*Math.sin(angle));
    const rise=smooth(.14,.36,q),lower=smooth(.71,.91,q),high=1.805;
    const hangY=inner?mix(mix(fromY,high,rise),palletLevel,lower):palletLevel;
    let hookY=2.35;
    if(inner)hookY=hangY+.867+.49*(1-smooth(0,.13,q))+.58*smooth(.913,1,q);
    const deposit=inner&&q>=.14?{...head,y:hangY,yaw:heading-Math.PI*.5+(angle-pickupYaw)*.74}:
      landed?{...at(dropS,dropU),y:palletLevel,yaw:heading-Math.PI*.5+(dropYaw-pickupYaw)*.74}:null;
    const scowY=wetLevel(scow.z)+.014+.012*Math.sin(t*.89),roll=smooth(.28,.66,load);
    const loading=outer&&landed,outerU=mix(72.08,67+bowLoadZ,roll);
    const trolley=at(1.55,loading?outerU:72.08),parcelY=loading?mix(mix(scowY+.48,1.47,smooth(.10,.28,load)),boat.y,smooth(.67,.84,load)):scowY+.48;
    const supply={...trolley,y:parcelY,yaw:heading+Math.PI*.5};
    const aboard=p&&(p.ice!==false&&(!inner||q<.14)||loading&&load>=.84)?boat:null;
    const shift=p?.u< -26?(p.ice!==false||inner?smooth(26,32,-p.u):p.turn!=null?1-smooth(0,Math.PI,p.turn):0):0;
    const worker={...at(-2.8-.81*shift,-39.4+.115*shift),yaw:heading+mix(Math.PI*.5+.12*Math.sin(t*.39),2.34,shift),shift};
    return {worker,dock:deposit,suspended:inner&&q>=.14&&q<.915,aboard,hookY,head,angle,scowY,
      supply:(!loading||load<.84)?supply:null,trolley,outerHook:parcelY+.867+(loading?.50*(1-smooth(0,.095,load))+.53*smooth(.844,1,load):.42),
      supplySling:loading&&load>=.092&&load<.844};
  }
  function drawLine(list,p,top,bottom,yaw){
    for(let y=top;y>bottom+.001;y-=.39)list.push(["ice-winch-line",p.x,Math.max(y,bottom+.39),p.z,yaw]);
    list.push(["ice-winch-hook",p.x,bottom,p.z,yaw]);
  }
  function docksWorld(list,see,state,t,hours){
    const p=state.packet,showPier=see(pier,130),showScow=see(scow,160),showPacket=p&&see(p,132);
    if(!showPier&&!showScow&&!showPacket)return;
    const freight=dockLoad(p,t,hours),caseAt=a=>{if(a&&see(a,88))list.push(["salt-ice-case",a.x,a.y,a.z,a.yaw,a.pitch||0,a.roll||0]);};
    if(showPier){
      const origin=at(pivot.s,pivot.u),yaw=heading+freight.angle;
      list.push(["shell-levee-ice",pier.x,0,pier.z,heading],["ice-landing-jib",origin.x,0,origin.z,yaw]);
      if(see(pier,64)){
        const w=freight.worker,working=w.shift>.68;
        list.push([working?"ice-landing-leda-winch":"ice-landing-leda",w.x,headLevel,w.z,w.yaw]);
        if(working){const [x,z]=worldPoint(w,.203,0);list.push(["ice-landing-forearm",x,headLevel+1.407,z,w.yaw,(freight.suspended?.16:.04)*Math.sin(t*3.1)]);}
        drawLine(list,freight.head,boomTop,freight.hookY,yaw);
        if(freight.suspended)list.push(["salt-ice-sling",freight.dock.x,freight.dock.y,freight.dock.z,freight.dock.yaw]);
      }
      caseAt(freight.dock);
    }
    if(showScow){
      list.push(["salt-ice-scow",scow.x,freight.scowY,scow.z,heading]);caseAt(freight.supply);
      if(see(scow,53)){
        drawLine(list,freight.trolley,freight.scowY+2.675,freight.outerHook,heading);
        if(freight.supplySling&&freight.supply)list.push(["salt-ice-sling",freight.supply.x,freight.supply.y,freight.supply.z,freight.supply.yaw]);
      }
    }
    caseAt(freight.aboard);
  }
  function world(list,see,state,t,hours){
    if(!state)return;
    docksWorld(list,see,state,t,hours);
    const p=state.packet,tender=state.tender;
    if(p&&see(p,175)){
      const pose=packetRoll(p,t,hours);
      list.push([see(p,68)?"june-bug":"june-bug-distant",p.x,pose.y,p.z,p.yaw,pose.pitch,pose.roll]);
      if(Math.abs(p.speed||0)>.50&&see(p,88))list.push(["june-bug-wash",p.x,wetLevel(p.z)+.057,p.z,p.yaw+.015*Math.sin(t*2.3)]);
    }
    if(!tender||!see(tender,74))return;
    const y=tender.y,yaw=tender.yaw,pose=tenderPose(state,t);
    const place=(name,x,h,z,pitch=0)=>{const [wx,wz]=worldPoint(tender,x,z);list.push([name,wx,y+h,wz,yaw,pitch]);};
    const [lx,lz]=worldPoint(keeperDesk,handleX,handleZ);
    list.push(["bridge-keeper-desk",keeperDesk.x,keeperDesk.y,keeperDesk.z,heading],["bridge-keeper-lever",lx,keeperDesk.y+handleY,lz,heading,pose.angle]);
    place("bridge-inez",0,0,0);list.push(["bridge-inez-head",tender.x,y+1.515,tender.z,yaw+pose.look,pose.nod]);
    place("bridge-inez-upper",handleX,pose.shoulderY,pose.shoulderZ,-pose.upper);
    place("bridge-inez-lower",handleX,pose.elbowY,pose.elbowZ,-pose.lower);
  }
  function path(c,pts,color,width=0){
    c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);
    if(width){c.strokeStyle=color;c.lineWidth=width;c.stroke();}else{c.closePath();c.fillStyle=color;c.fill();}
  }
  function paintBoat(c,p,street,t){
    const rect=(x,z,w,d,col)=>{c.fillStyle=col;c.fillRect(x,z,w,d);};
    if(street&&Math.abs(p.speed||0)>.5){
      const drift=.10*Math.sin(t*2.2);
      for(const s of [-1,1]){
        path(c,[[s*.86,-2.97],[s*1.21,-4.07],[s*(1.76+drift),-5.66]],"#a5c4b5",.115);
        path(c,[[s*(1.95+drift),-6.10],[s*2.36,-7.02]],"#93b8ac",.075);
        path(c,[[s*.20,-3.40],[s*.64,-3.60],[s*.27,-5.02]],"#bbcbb5");
      }
    }
    const outline=sections.map(([z,w])=>[-w,z]).concat([...sections].reverse().map(([z,w])=>[w,z]));
    path(c,outline,street?wood:honey);path(c,outline.concat([outline[0]]),dark,street?.115:.31);
    if(!street){rect(-.76,-.38,1.52,1.99,ivory);rect(-.65,-2.54,1.30,1.02,green);return;}
    for(const [x,z,kind] of cargo){const ice=kind==="ice";rect(x-.449,z-.40,.898,.80,ice?cream:crate);
      rect(x-.367,z-.30,.734,.60,ice?"#c5d6cb":"#815344");if(!ice)for(const n of [-1,1])rect(x+n*.16-.027,z-.32,.054,.64,"#ce885a");}
    rect(-.93,-.48,1.86,1.99,green);rect(-.85,-.40,1.70,1.86,glass);
    path(c,[[-1,-.59],[1,-.59],[.97,1.51],[-.97,1.51]],ivory);
    rect(-.97,-.57,1.94,.090,umber);rect(.15,-.12,.40,.50,"#93ad9b");
    c.beginPath();c.arc(-.45,.67,.156,0,tau);c.fillStyle=red;c.fill();
    rect(-1.0,.85,.12,.21,"#df7766");rect(.88,.85,.12,.21,"#87b799");
    path(c,[[-.90,-.54],[-.90,-2.8]],umber,.11);path(c,[[-.91,-.55],[.99,-.59]],steel,.044);
    rect(-.342,2.245,.684,.570,navy);rect(-.273,2.30,.546,.46,"#abb7a4");
    for(const x of [-.62,.62])rect(x-.10,-3.35,.20,.073,steel);
  }
  const swatch=(c,x,z,w,d,col)=>{c.fillStyle=col;c.fillRect(x,z,w,d);};
  function paintDesk(c,state){
    const rect=(x,z,w,d,col)=>swatch(c,x,z,w,d,col),angle=-.8+1.4*clamp(state.lift||0,0,1);
    rect(-.436,.281,.872,.483,green);rect(-.405,.309,.81,.428,"#99ad9c");rect(-.388,.36,.323,.322,cream);
    rect(-.232,.37,.009,.30,umber);rect(.163,.35,.12,.19,navy);rect(.179,handleZ+leverLength*Math.sin(angle)-.028,.078,.056,umber);
    for(const [i,col] of [[0,red],[1,honey],[2,"#c4d4ba"]])rect(.012+i*.106,.624,.052,.052,col);
  }
  function paintTender(c,state,t){
    const pose=tenderPose(state,t),rect=(x,z,w,d,col)=>swatch(c,x,z,w,d,col);
    path(c,[[-.17,-.12],[.15,-.12],[.213,-.062],[.217,.084],[.115,.136],[-.137,.126],[-.216,.066],[-.214,-.056]],jacket);
    path(c,[[-.153,-.10],[.14,-.10]],reflector,.034);
    path(c,[[-.20,.007],[-.25,.105],[-.15,.33]],skin,.075);
    path(c,[[handleX,.01],[handleX,pose.elbowZ],[handleX,pose.handZ]],skin,.075);
    path(c,[[-.20,.007],[-.24,.075]],green,.14);path(c,[[handleX,.009],[handleX,.095]],green,.14);
    c.rotate(-pose.look);c.beginPath();c.arc(0,0,.131,0,tau);c.fillStyle="#688279";c.fill();rect(-.073,.086,.145,.077,"#819183");
  }
  function paintLanding(c,street){
    const route=walk.map(p=>[p[0],p[1]]),rect=(x,z,w,d,col)=>swatch(c,x,z,w,d,col);
    path(c,route,"#797867",2.34);path(c,route,"#bcaa88",2.09);rect(-1.10,-4.7,2.20,9.40,"#b5a381");
    if(!street){rect(-.98,-4.05,.67,2.07,umber);return;}
    for(let i=1;i<25;i++)path(c,[[-1.08,-4.7+i*9.4/25],[1.08,-4.7+i*9.4/25]],"#90866c",.032);
    for(const z of [-4.2,-2.17,.16,2.32])rect(1.086,z-.23,.13,.46,navy);
    rect(-1.077,-4.15,.78,2.12,"#ae6b50");for(let i=0;i<5;i+=2)rect(-.50,-4.15+i*.424,.203,.424,"#caac88");
    for(const n of [-1,0,1])rect(dropU-pierU-.39,dropS+n*.306-.121,.78,.242,"#a38367");
    for(const dx of [-.31,.31])path(c,[[.20+dx,4.28],[.20+dx,4.81]],steel,.071);
    path(c,[[-.11,4.77],[.51,4.77]],steel,.056);
  }
  function paintScow(c,street){
    const rect=(x,z,w,d,col)=>swatch(c,x,z,w,d,col),rim=[[-2.9,-4.10],[-2.40,-4.80],[2.24,-4.80],[2.81,-4.05],[2.81,4.0],[2.15,4.80],[-2.44,4.80],[-2.9,4.13],[-2.9,-4.10]];
    path(c,rim,street?"#ac9a7c":"#b4a48b");path(c,rim,navy,street?.15:.29);rect(-.84,-3.36,3.2,5.78,"#bfc4ae");
    if(!street)return;
    for(let i=0;i<12;i++)rect(-.83,-3.33+i*.47,3.18,.040,"#9fa89b");
    for(const z of [-3.54,3.30])for(const x of [-1.38,-2.19]){rect(x-.372,z-.416,.744,.832,cream);rect(x-.291,z-.329,.582,.658,"#c8d1bf");}
    rect(-4.85,1.456,3.95,.19,navy);rect(-4.83,1.50,3.95,.08,umber);
  }
  function paintCase(c){
    swatch(c,-.366,-.357,.732,.714,cream);swatch(c,-.31,-.292,.62,.584,"#dce5d4");
    for(const x of [-.252,.203])swatch(c,x,-.354,.049,.71,"#607b85");
  }
  function map(c,opt,px,py,scale,visible){
    const state=opt.bridge;if(!state)return;
    const street=opt.mode==="street",t=opt.time??opt.elapsed??0;
    const place=(actor,s,draw)=>{c.save();c.translate(px(actor.x),py(actor.z));c.rotate(actor.yaw);c.scale(s,-s);draw();c.restore();};
    const showPier=visible(px(pier.x),py(pier.z),19*scale),showScow=visible(px(scow.x),py(scow.z),7.5*scale);
    if(showPier)place({...pier,yaw:heading},scale,()=>paintLanding(c,street));
    if(showScow)place({...scow,yaw:heading},scale,()=>paintScow(c,street));
    if(state.packet&&visible(px(state.packet.x),py(state.packet.z),9*scale))
      place(state.packet,street?scale:Math.max(scale,.84),()=>paintBoat(c,state.packet,street,t));
    if(street){
      const freight=dockLoad(state.packet,t,opt.weather);
      for(const box of [freight.dock,freight.supply,freight.aboard])if(box&&visible(px(box.x),py(box.z),2*scale))place(box,scale,()=>paintCase(c));
      if(showPier){
        const foot=at(pivot.s,pivot.u);place({...foot,yaw:heading+freight.angle},scale,()=>{path(c,[[0,0],[0,boomReach]],green,.12);swatch(c,-.091,boomReach-.083,.182,.166,umber);});
        place(freight.worker,scale,()=>{swatch(c,-.214,-.099,.428,.227,"#ad7059");swatch(c,-.128,-.109,.256,.224,"#526761");swatch(c,-.079,.094,.158,.084,green);});
      }
      if(visible(px(keeperDesk.x),py(keeperDesk.z),2*scale))place(keeperDesk,scale,()=>paintDesk(c,state));
      if(state.tender&&visible(px(state.tender.x),py(state.tender.z),2*scale))place(state.tender,scale,()=>paintTender(c,state,t));
    }
  }
  window.BayBridgePacketArt={install,world,map};
})();
