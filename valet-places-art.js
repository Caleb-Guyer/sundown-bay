/* The Marlin's Ocean Drive motor court. Service inventory lives on the shift. */
(() => {
  "use strict";
  const desk={x:134.65,z:-19.9,kind:"valet-stand",name:"Marlin Motor Court"};
  const keeper={x:133.1,z:-20.1,yaw:Math.PI/2};
  const berth={x:138.85,z:-20.4,yaw:Math.PI,dir:2};
  const stalls=["A","B","C"].map((id,i)=>({id,x:111+i*5,z:-57.4,yaw:0}));
  const stand={x:133.85,z:-20.1},lot=stalls[1],tau=2*Math.PI;
  const rackZ=1.26;
  const sea="#4f8885",bottle="#355b60",midnight="#314e53",foam="#a8c4ac",linen="#eddeba";
  const salmon="#c97b68",brass="#bc995e",polish="#e7c888",iron="#536c69",bone="#d9c6a3";
  const blocks=[];
  function solid(at,x,z,w,d,top,bottom=0){
    blocks.push({x:at.x+x,z:at.z+z,w,d,bottom,top,streetProp:true});
  }
  solid(stand,0,0,.64,1.54,1.19);
  solid(stand,-1.45,rackZ,.24,1.22,1.97);
  for(const z of [-2.25,2.25])solid(stand,-1.65,z,.24,.24,3.29);
  // Only the canopy is overhead; the desk approach and the loading berth stay clear.
  const cameraBlocks=[
    {x:stand.x+.05,z:stand.z,w:3.83,d:5.02,bottom:2.79,top:3.36},
    {x:stand.x+1.86,z:stand.z,w:.21,d:4.32,bottom:3.13,top:4.14}
  ];
  for(const p of stalls)solid(p,0,3.55,1.62,.22,.25);
  const front=x=>(u,y)=>[x,y,u],floor=y=>(x,z)=>[x,y,z];
  function poly(g,p,points,color){
    const a=p(...points[0]);
    for(let i=1;i+1<points.length;i++)g.tri(a,p(...points[i]),p(...points[i+1]),color);
  }
  function plate(g,p,x,y,w,h,color){
    g.quad(p(x-w/2,y-h/2),p(x+w/2,y-h/2),p(x+w/2,y+h/2),p(x-w/2,y+h/2),color);
  }
  function line(g,p,a,b,w,color){
    const dx=b[0]-a[0],dy=b[1]-a[1],r=w*.5/(Math.hypot(dx,dy)||1),u=-dy*r,v=dx*r;
    g.quad(p(a[0]+u,a[1]+v),p(b[0]+u,b[1]+v),p(b[0]-u,b[1]-v),p(a[0]-u,a[1]-v),color);
  }
  function stroke(g,p,points,w,color){
    for(let i=1;i<points.length;i++)line(g,p,points[i-1],points[i],w,color);
  }
  function disk(g,p,x,y,rx,ry,color,n=12){
    for(let i=0;i<n;i++){
      const a=tau*i/n,b=tau*(i+1)/n;
      g.tri(p(x,y),p(x+rx*Math.cos(a),y+ry*Math.sin(a)),p(x+rx*Math.cos(b),y+ry*Math.sin(b)),color);
    }
  }
  // The signwriter's narrow sans. Coordinates run baseline to cap height over four units.
  const alphabet={
    A:"00 24 40|11 31",B:"00 04 34 43 32 02|32 41 30 00",C:"44 14 03 01 10 40",
    D:"00 04 24 43 41 20 00",E:"44 04 00 40|02 32",F:"00 04 44|02 32",
    G:"44 14 03 01 10 40 42 22",H:"00 04|40 44|02 42",I:"04 44|24 20|00 40",
    K:"00 04|02 44|12 40",L:"04 00 40",M:"00 04 22 44 40",N:"00 04 40 44",
    O:"14 34 43 41 30 10 01 03 14",P:"00 04 34 43 32 02",
    R:"00 04 34 43 32 02|22 40",S:"44 14 03 12 32 41 30 00",T:"04 44|24 20",
    U:"04 01 10 30 41 44",V:"04 20 44",W:"04 10 22 30 44",Y:"04 22 44|22 20",
    0:"14 34 43 41 30 10 01 03 14",1:"13 24 20|10 30",2:"03 14 34 43 00 40",
    3:"04 34 43 32 12|32 41 30 00",4:"34 02 42|34 30",5:"44 04 02 32 41 30 00",
    6:"34 14 03 01 10 30 41 32 02",7:"04 44 10",8:"14 34 43 32 12 03 14|12 01 10 30 41 32",
    9:"42 12 03 14 34 43 41 30 10"
  };
  const chars={};
  for(const [k,ink] of Object.entries(alphabet))
    chars[k]=ink.split("|").map(row=>row.split(" ").map(a=>[+a[0]/4,+a[1]/4]));
  function letters(g,p,word,x,y,h,col,wide=.63,space=.23,slant=0,weight=.095){
    const advance=(wide+space)*h,left=x-(word.length*advance-space*h)/2;
    for(let i=0;i<word.length;i++)for(const run of chars[word[i]]||[]){
      const a=run.map(([u,v])=>[left+advance*i+h*(wide*u+slant*v),y+h*v]);
      stroke(g,p,a,h*weight,col);
    }
  }
  function fish(g,p,u,v,size){
    const art=(x,y)=>p(u+size*x,v+size*y);
    disk(g,art,-.10,.02,.58,.58,"#cb966c",20);
    for(const [y,w] of [[-.21,.93],[-.35,.73],[-.45,.51]])plate(g,art,-.10,y,w,.042,midnight);
    poly(g,art,[[-.38,-.12],[-.21,.34],[.0,.60],[.11,.28],[.23,.31],[.38,.12]],sea);
    poly(g,art,[[-.48,-.19],[-.16,.08],[.23,.19],[.53,.16],[.62,.07],[.17,-.06],[-.25,-.18]],linen);
    poly(g,art,[[.51,.13],[.97,.27],[.63,.07],[.37,.035]],linen);
    poly(g,art,[[-.42,-.13],[-.78,.01],[-.61,-.19],[-.77,-.45],[-.38,-.18]],foam);
    poly(g,art,[[-.01,-.05],[.20,-.02],[-.10,-.33]],foam);
    disk(g,art,.43,.11,.034,.034,midnight,7);
  }
  function standFloor(g){
    const slab=floor(.108),ink=floor(.118);
    plate(g,slab,-.05,0,3.74,5.16,"#baae97");
    plate(g,floor(.112),-.11,0,3.49,4.92,"#cebba0");
    for(const z of [-1.70,-.02,1.69])line(g,ink,[-1.82,z],[1.61,z-.04],.019,"#a99e8b");
    for(const x of [-.78,.64])line(g,ink,[x,-2.43],[x+.03,2.43],.019,"#b5a68e");
    // A flush terrazzo threshold and the two brass lines on either side of the bell.
    for(const z of [-1.17,1.17])plate(g,ink,.24,z,1.46,.035,brass);
    const curb=floor(.119);
    plate(g,curb,3.10,-.30,.29,8.35,"#ae8e73");
    for(let i=0;i<8;i++)plate(g,floor(.124),3.11,-3.93+i*1.038,.237,.96,i%4===1?"#c4806b":"#d89a79");
  }
  function berthFloor(g){
    const p=floor(.087),paint="#d4bc86";
    for(const side of [-1,1]){
      const x=side*1.38;
      for(const end of [-1,1]){
        line(g,p,[x,end*2.81],[x,end*3.74],.070,paint);
        line(g,p,[x,end*3.74],[side*.72,end*3.74],.070,paint);
      }
    }
    const ahead=(u,v)=>[-u,.094,3.93-v];
    letters(g,ahead,"VALET",0,-.43,.40,paint,.56,.25,.045,.118);
    for(const z of [-2.66,.0,2.64])plate(g,p,-1.47,z,.048,.46,"#b79b72");
    // Two short grease marks left by idling cars, quiet enough to see the actual tires.
    stroke(g,floor(.078),[[.48,1.34],[.53,.92],[.49,.59]],.046,"#47535a");
    stroke(g,floor(.078),[[-.63,-1.82],[-.68,-1.69],[-.74,-1.29]],.044,"#4f585b");
  }
  function parkingFloor(g){
    const p=floor(.113),a=floor(.118),paint=floor(.125),chalk="#d7c9a3";
    poly(g,p,[[-8.00,4.32],[7.92,4.27],[8.17,3.56],[8.17,-7.14],[-7.71,-7.14],[-8.08,-6.49]],"#828681");
    poly(g,p,[[8.17,-3.64],[18.43,-3.64],[20.47,-5.23],[20.47,-7.14],[8.17,-7.14]],"#828681");
    // Resurfaced spaces, the drive aisle seam and a square catch basin at the low point.
    for(const [x,c] of [[-5,"#757e7b"],[0,"#78807e"],[5,"#75807e"]])plate(g,a,x,.08,4.88,7.09,c);
    for(const x of [-7.49,-2.50,2.50,7.48]){
      line(g,paint,[x,-3.38],[x,3.40],.105,chalk);line(g,paint,[x,-3.38],[x+(x>0?-.43:.43),-3.38],.085,chalk);
    }
    for(const [i,slot] of stalls.entries()){
      const x=slot.x-lot.x;
      for(const side of [-1,1])line(g,paint,[x+side*2.16,3.41],[x+side*.68,3.41],.09,chalk);
      plate(g,paint,x,-2.85,1.30,.98,"#546c69");
      plate(g,floor(.127),x,-2.85,1.19,.86,"#677c73");
      letters(g,floor(.132),slot.id,x,-3.13,.56,"#ebdfba",.68,.2,0,.13);
      stroke(g,paint,[[x-.87,1.52+i*.09],[x-.92,.36],[x-.88,-.82]],.036,"#626f6f");
      stroke(g,paint,[[x+.76,1.74],[x+.89,.37-i*.11],[x+.92,-.34]],.041,"#667471");
    }
    stroke(g,paint,[[-7.81,-3.69],[-4.60,-3.74],[-2.78,-3.71],[2.66,-3.78],[8.1,-3.73]],.028,"#66716e");
    stroke(g,paint,[[1.93,-6.96],[2.21,-6.22],[2.08,-5.63],[2.56,-5.16],[2.48,-4.57]],.032,"#697571");
    stroke(g,paint,[[2.10,-5.62],[1.67,-5.34],[1.28,-5.33]],.026,"#697571");
    plate(g,paint,-7.27,-5.44,.63,1.06,"#566460");
    for(let i=0;i<6;i++)plate(g,floor(.132),-7.27,-5.84+i*.16,.49,.052,"#89918a");
    const arrow=poly.bind(null,g,paint);
    arrow([[12.0,-5.48],[14.15,-5.48],[14.15,-5.14],[12.0,-5.14]],"#c7bda0");
    arrow([[12.05,-4.89],[11.22,-5.31],[12.05,-5.74]],"#c7bda0");
  }
  function wheelStop(g){
    const x=.81;
    g.box(0,.167,3.55,1.62,.102,.22,"#a4a495");
    g.box(0,.229,3.55,1.50,.026,.17,"#c0beab");
    for(const u of [-.55,.55]){
      plate(g,floor(.244),u,3.55,.20,.164,brass);
      g.quad([u-.10,.124,3.436],[u+.10,.124,3.436],[u+.10,.224,3.436],[u-.10,.224,3.436],"#b89c64");
    }
    for(const side of [-1,1])g.tri([side*x,.216,3.44],[side*x,.216,3.66],[side*(x-.06),.244,3.55],bone);
  }
  function parkingWall(g){
    // Hand-painted on the windowless south elevation. All wall paint stays inside the
    // original footprint, leaving the individual guest bays free of poles and signs.
    const wall=(x,h)=>[x,h,5.82],details=(x,h)=>[x,h,5.812],lettering=(x,h)=>[x,h,5.806];
    const rind="#c89079",teal="#66847d",tealShadow="#596e6d",chalk="#d8c1a1",glaze="#cba092";
    const cx=-4.0,h=4.5,r=1.76;
    // Half a sun sits in the negative space above three disconnected bands of surf.
    const sun=[[cx-r,h]];
    for(let i=1;i<=24;i++){
      const a=Math.PI-i*Math.PI/24;sun.push([cx+r*Math.cos(a),h+r*Math.sin(a)]);
    }
    poly(g,wall,sun,rind);
    for(const [y,left,right] of [[4.40,-5.83,-2.18],[4.15,-5.73,-2.25],[3.91,-5.49,-2.51],[3.69,-5.18,-2.82]])
      poly(g,wall,[[left,y+.10],[right,y+.10],[right-.16,y],[left+.05,y-.018]],rind);
    const painted=(a,tint)=>poly(g,details,a,tint);
    painted([[-6.08,3.95],[-5.44,4.52],[-4.81,4.92],[-4.14,5.20],[-3.51,5.26],[-2.91,5.17],
      [-2.71,4.99],[-3.24,4.93],[-4.12,4.79],[-4.98,4.42]],tealShadow);
    painted([[-4.94,4.87],[-4.59,5.35],[-4.28,5.83],[-3.99,5.94],[-4.04,5.41],[-3.73,5.64],[-3.50,5.24]],teal);
    painted([[-5.92,4.13],[-6.52,4.48],[-6.86,4.61],[-6.35,3.98],[-6.62,3.38],[-6.09,3.80]],tealShadow);
    painted([[-2.98,5.12],[-1.57,5.41],[-2.75,4.98],[-3.23,4.92]],tealShadow);
    painted([[-5.73,4.12],[-5.00,4.53],[-4.04,4.95],[-3.19,5.04],[-3.69,4.83],[-4.82,4.51]],chalk);
    painted([[-4.20,4.81],[-3.78,4.88],[-4.40,4.24]],teal);
    disk(g,lettering,-3.09,5.09,.048,.048,chalk,8);
    for(const [u,y,w] of [[-6.21,3.24,2.67],[-5.19,3.03,2.84],[-7.09,3.05,.92],[-4.24,2.84,1.18]])
      painted([[u,y],[u+.25,y+.07],[u+w,y+.07],[u+w-.18,y-.03]],teal);
    letters(g,lettering,"OCEAN DRIVE",3.13,4.23,.78,tealShadow,.70,.25,.115,.099);
    letters(g,lettering,"MOTOR COURT",3.12,3.48,.30,chalk,.69,.36,0,.11);
    for(const [u,v,w] of [[-.75,3.62,1.47],[5.30,3.62,1.50],[6.16,4.05,1.10]])plate(g,details,u+w/2,v,w,.04,teal);
    // Small interruptions are flakes in the old sign paint.
    for(const [u,v,w] of [[-4.89,5.13,.21],[-3.84,5.65,.19],[-4.40,3.94,.22],[-5.99,3.28,.17],[.52,4.35,.29],
      [2.17,4.73,.22],[4.16,4.78,.17],[5.71,4.44,.22],[6.53,4.90,.20]])
      poly(g,(x,y)=>[x,y,5.80],[[u,v],[u+w,v+.026],[u+.16*w,v+.06]],glaze);
    for(const [i,p] of stalls.entries()){
      const x=p.x-lot.x;
      const cut=[[-.43,2.33],[-.32,2.46],[.31,2.46],[.43,2.34],[.43,1.84],[.31,1.73],[-.31,1.73],[-.43,1.84]];
      poly(g,wall,cut.map(([u,y])=>[x+u,y]),tealShadow);
      poly(g,details,cut.map(([u,y])=>[x+.86*u,2.10+.83*(y-2.10)]),teal);
      letters(g,lettering,stalls[i].id,x,1.91,.40,linen,.66,.2,0,.14);
    }
  }
  function podium(g){
    g.box(0,.182,0,.60,.13,1.42,midnight);
    g.box(-.02,.641,0,.56,.86,1.41,sea);
    for(const z of [-.70,.70])g.box(-.018,.639,z,.54,.83,.052,"#a57d65");
    g.box(.273,.674,0,.039,.65,1.32,foam);
    g.box(.297,.680,0,.010,.58,1.23,bottle);
    const face=front(.308);
    for(const z of [-.55,.55])for(const y of [.435,.93])disk(g,face,z,y,.014,.014,brass,6);
    letters(g,face,"VALET",0,.626,.19,linen,.66,.25,.04,.105);
    for(const side of [-1,1])line(g,face,[side*.12,.526],[side*.34,.526],.013,brass);
    disk(g,face,0,.525,.028,.027,brass,6);
    for(const h of [.296,.333])g.box(.267,h,0,.026,.013,1.29,brass);
    // Lift-off walnut writing surface with a rounded-over brass nosing.
    g.box(0,1.075,0,.665,.095,1.57,"#a27961");
    g.box(.003,1.12,.002,.668,.023,1.565,"#6e5c50");
    g.box(.337,1.078,0,.016,.021,1.51,polish);
    for(const end of [-1,1])g.box(.005,1.077,end*.79,.65,.019,.012,brass);
    // Register, carbon copy, brass strip clip, the clerk's stubby red pencil.
    const r=floor(1.140);
    plate(g,r,-.013,-.33,.41,.386,"#5d736c");
    plate(g,floor(1.143),-.007,-.327,.362,.343,"#e5d1a9");
    for(let j=0;j<5;j++)plate(g,floor(1.149),-.025+j*.053,-.34,.007,.274,"#a3aa98");
    plate(g,floor(1.152),-.134,-.34,.014,.283,salmon);
    g.box(-.171,1.156,-.332,.025,.019,.16,brass);
    g.pole([.073,1.156,-.058],[.187,1.156,-.193],.0105,salmon,5);
    // A desk bell needs a real silhouette when seen at eye level.
    for(const [h,rt,rb,dh,col] of [[1.151,.140,.137,.028,midnight],[1.176,.135,.145,.025,brass],
      [1.20,.113,.128,.028,polish],[1.232,.082,.113,.042,brass],[1.256,.038,.082,.019,polish],[1.278,.013,.018,.030,brass],[1.30,.042,.036,.012,polish]])
      g.cyl(.083,h,.446,rt,rb,dh,12,col);
    // A shallow, open key press behind the attendant with three numbered brass pins.
    const rack=-1.45;
    for(const z of [-.515,.515])g.box(rack,.68,rackZ+z,.065,1.13,.056,iron);
    g.box(rack,1.57,rackZ,.163,.82,1.18,"#765f51");
    g.box(rack+.087,1.57,rackZ,.033,.73,1.09,"#414f4e");
    for(const z of [-.58,.58])g.box(rack+.103,1.57,rackZ+z,.075,.80,.04,"#a88464");
    for(const y of [1.185,1.958])g.box(rack+.105,y,rackZ,.081,.045,1.19,"#b4946e");
    letters(g,front(rack+.113),"KEYS",rackZ,1.80,.107,bone,.59,.31);
    plate(g,front(rack+.153),rackZ,1.188,.43,.075,brass);
    letters(g,front(rack+.157),"24 HRS",rackZ,1.164,.047,midnight,.64,.25,0,.10);
    for(let i=0;i<3;i++){
      const z=rackZ+(i-1)*.356;
      letters(g,front(rack+.113),stalls[i].id,z,1.257,.077,bone);
      g.pole([rack+.108,1.686,z],[rack+.182,1.706,z],.014,brass,6);
    }
  }
  function keyTag(g,ready){
    const side=front(0);
    for(let i=0;i<8;i++){
      const a=tau*i/8,b=tau*(i+1)/8;
      line(g,side,[.028*Math.cos(a),.026*Math.sin(a)],[.028*Math.cos(b),.026*Math.sin(b)],.006,polish);
    }
    // Diamond motel fob and a separate nickel key with two teeth.
    poly(g,side,[[-.021,-.023],[.017,-.023],[.059,-.101],[.013,-.169],[-.016,-.169],[-.059,-.099]],brass);
    plate(g,front(.002),0,-.093,.035,.017,polish);
    if(ready)poly(g,front(.003),[[-.04,-.119],[.041,-.119],[.024,-.148],[-.024,-.148]],salmon);
    stroke(g,side,[[.019,-.026],[.047,-.043],[.095,-.101],[.105,-.100]],.012,"#ccc9ae");
    line(g,side,[.074,-.078],[.087,-.071],.012,"#ccc9ae");
  }
  function lamp(g){
    for(const z of [-1.58,1.58])g.box(.49,2.983,z,.69,.027,.105,"#ffe1aa");
    for(const z of [-1.99,1.99])disk(g,front(1.974),z,3.54,.046,.046,"#ffe1b2",9);
  }
  function awning(g){
    const back=-1.65,edge=1.955;
    for(const z of [-2.25,2.25]){
      g.box(back,.199,z,.243,.168,.244,"#aa9d84");
      g.box(back,1.696,z,.099,2.84,.105,foam);
      g.box(back,1.63,z,.131,.077,.132,brass);
      g.pole([back,2.30,z],[.54,3.06,z],.038,iron,6);
      g.pole([back,3.20,z],[1.90,2.91,z],.050,iron,6);
    }
    g.box(back,3.232,0,.112,.102,4.90,"#83968c");
    g.box(edge-.08,2.95,0,.096,.088,4.94,midnight);
    const sections=[[-1.82,3.29],[-.93,3.34],[.42,3.23],[1.51,3.075],[edge,2.984]];
    const n=11,dz=5.02/n;
    for(let i=0;i<n;i++){
      const l=-2.51+i*dz,r=l+dz,color=i%2===0?"#75a19a":"#e6d5b1",hem=i%2===0?"#65918b":"#d9c9a7";
      for(let j=1;j<sections.length;j++){
        const [x,h]=sections[j-1],[X,H]=sections[j];g.quad([x,h,l],[x,h,r],[X,H,r],[X,H,l],color);
      }
      const frontFace=front(edge+.003);
      poly(g,frontFace,[[l,2.986],[r,2.986],[r,2.839],[r-.06,2.795],[l+.09,2.795],[l,2.848]],hem);
      const v=l+.048;
      for(let j=1;j<sections.length;j++){
        const [x,h]=sections[j-1],[X,H]=sections[j];g.quad([x,h+.002,v],[x,h+.002,v+.018],[X,H+.002,v+.018],[X,H+.002,v],i%2===0?"#68928b":"#cfb895");
      }
    }
    for(const z of [-2.51,2.51]){
      for(let j=1;j<sections.length;j++){
        const [x,h]=sections[j-1],[X,H]=sections[j];
        g.quad([x,h,z],[X,H,z],[X,H-.105,z],[x,h-.105,z],sea);
      }
    }
    for(const z of [-1.58,1.58])g.box(.49,3.011,z,.79,.053,.145,"#687570");
    // A double-ended enamel cabinet follows the raked profile of the motel's tower.
    const face=front(1.951),enamel=front(1.958);
    const outline=[[-2.14,3.37],[-1.99,3.29],[1.69,3.29],[2.14,3.48],[2.14,3.90],
      [1.79,4.00],[1.53,4.00],[1.48,4.13],[-1.51,4.13],[-1.56,4.04],[-1.96,4.04],[-2.14,3.85]];
    poly(g,face,outline,polish);
    for(let i=0;i<outline.length;i++){
      const [a,b]=[outline[i],outline[(i+1)%outline.length]];
      g.quad([1.76,a[1],a[0]],[1.76,b[1],b[0]],face(...b),face(...a),"#79918a");
    }
    const inset=outline.map(([u,h])=>[u*.967,3.71+(h-3.71)*.86]);
    poly(g,enamel,inset,midnight);
    for(const z of [-1.24,1.25])g.box(1.84,3.18,z,.079,.34,.087,iron);
    const printing=front(1.967);
    fish(g,printing,-1.22,3.722,.52);
    letters(g,printing,"MARLIN",.423,3.683,.342,linen,.65,.27,.09,.106);
    letters(g,printing,"MOTOR COURT",.49,3.425,.128,foam,.62,.29,0,.106);
    for(const z of [-1.98,1.98])disk(g,printing,z,3.539,.064,.064,brass,10);
    for(const [z,a,w] of [[1.37,3.574,.23],[1.44,3.626,.36],[-1.73,3.433,.25]])plate(g,printing,z,a,w,.017,salmon);
  }
  function clerkSign(g,duty){
    // Two faces of the clerk's reversible brass desk sign.
    g.box(.016,.016,0,.16,.024,.52,brass);
    g.box(0,.094,0,.045,.145,.48,"#bb9f72");
    plate(g,front(.025),0,.095,.438,.117,duty?bottle:"#745d54");
    letters(g,front(.029),duty?"ON DUTY":"OFF DUTY",0,.071,.052,linen,.65,.25,0,.11);
    disk(g,front(.029),-.188,.098,.013,.013,duty?"#b6d795":"#c68c73",7);
  }
  function clock(g){
    // The little electric clock faces the desk while the service flag faces the curb.
    const x=-1.313,z=rackZ,h=2.205;
    disk(g,front(x),z,h,.182,.182,midnight,16);disk(g,front(x+.003),z,h,.160,.160,brass,16);
    disk(g,front(x+.007),z,h,.145,.145,linen,16);
    g.box(-1.45,2.032,z,.10,.15,.069,iron);
    for(let i=0;i<12;i++){
      const a=tau*i/12,r=i%3===0?.109:.120;
      line(g,front(x+.011),[z+r*Math.sin(a),h+r*Math.cos(a)],[z+.135*Math.sin(a),h+.135*Math.cos(a)],.009,bottle);
    }
  }
  function hand(g,length,width,tint){
    poly(g,front(0),[[-width,-.019],[width,-.019],[width*.67,length*.80],[0,length],[-width*.67,length*.80]],tint);
    disk(g,front(.002),0,0,width*1.5,width*1.5,tint,8);
  }
  function reflections(g){
    const p=floor(.129);
    for(const [x,z,len,w] of [[2.92,-2.94,.81,.061],[2.93,-1.96,.47,.036],[3.05,1.16,.69,.043],[3.08,1.94,.17,.067],
      [.91,-1.54,.47,.023],[.89,-1.04,.18,.029],[1.07,1.55,.35,.031],[-1.05,-2.32,.28,.032]])
      poly(g,p,[[x-w,z],[x+w,z+.09],[x+w*.4,z+len],[x-w*.7,z+len-.07]],"#a1aca1");
  }
  const shapes={
    "valet-apron":standFloor,"valet-berth":berthFloor,"valet-parking":parkingFloor,
    "valet-wall":parkingWall,"valet-stop":wheelStop,"valet-desk":g=>{podium(g);clock(g);},"valet-canopy":awning,
    "valet-lamps":lamp,"valet-tag":g=>keyTag(g,false),"valet-call-tag":g=>keyTag(g,true),
    "valet-wet":reflections,"valet-clock-hour":g=>hand(g,.079,.009,bottle),
    "valet-clock-minute":g=>hand(g,.121,.006,salmon),
    "valet-on":g=>clerkSign(g,true),"valet-off":g=>clerkSign(g,false)
  };
  function install(model){for(const [key,build] of Object.entries(shapes))model(key,build);}
  function ground(view,see,hours){
    const n=hours?.night||0;
    if(see(stand,116)){
      view.draw("valet-apron",stand.x,0,stand.z,0,0,0,.19*n);
      view.draw("valet-berth",berth.x,0,berth.z,0,0,0,.18*n);
      if(hours?.wet>.32)view.draw("valet-wet",stand.x,0,stand.z,0,0,0,.36*n);
    }
    if(see(lot,112)){
      view.draw("valet-parking",lot.x,0,lot.z,0,0,0,.12*n);
      view.draw("valet-wall",lot.x,0,lot.z,0,0,0,.10*n);
    }
  }
  function fob(guest){return guest?.tagged?(guest.ready?"valet-call-tag":"valet-tag"):null;}
  function world(list,see,t,hours,service){
    const n=hours?.night||0;
    if(see(lot,110))for(const slot of stalls)list.push(["valet-stop",slot.x,0,slot.z]);
    if(!see(stand,117))return;
    list.push(["valet-canopy",stand.x,0,stand.z,0,0,0,.23*n],["valet-desk",stand.x,0,stand.z,0,0,0,.21*n]);
    if(n>.035)list.push(["valet-lamps",stand.x,0,stand.z,0,0,0,n*.87]);
    if(!see(stand,52))return;
    list.push([service?.onDuty?"valet-on":"valet-off",stand.x-.083,1.135,stand.z+.090,0,0,0,.30*n]);
    for(let i=0;i<3;i++){
      const tag=fob(service?.slots?.[i]);
      if(tag)list.push([tag,stand.x-1.26,1.698,stand.z+rackZ+(i-1)*.356,0,0,0,.32*n]);
    }
    const minute=hours?.minute??720,handX=stand.x-1.295;
    list.push(["valet-clock-hour",handX,2.205,stand.z+rackZ,0,(minute%720)*tau/720,0,.28*n],
      ["valet-clock-minute",handX+.004,2.205,stand.z+rackZ,0,(minute%60)*tau/60,0,.28*n]);
  }

  // The overhead renderer prints the same geometry once, retaining the clock, folds,
  // fobs and hand lettering without putting triangles into the street-map frame loop.
  const stamps=new Map();
  function print(key,density){
    if(stamps.has(key))return stamps.get(key);
    const mesh=new BayMesh(),facade=key==="valet-wall";
    if(facade){
      // The street map's building footprint has a flat roof. Show the decorated side
      // at the roof's southern edge, in the map's quieter paint colours.
      const wall=(u,h)=>[u,h,5.86];
      plate(mesh,wall,0,3.54,26.9,6.80,"#c2a79a");
      plate(mesh,(u,h)=>[u,h,5.85],0,.43,26.9,.56,"#9aafa1");
    }
    shapes[key](mesh);
    const v=mesh.vertices,points=[];
    const liftX=facade?.055:.22,liftY=facade?.53:.27;
    let minX=Infinity,minY=Infinity,maxX=-Infinity,maxY=-Infinity;
    for(let i=0;i<v.length;i+=6){
      const x=v[i],y=v[i+1],z=v[i+2],u=x+liftX*y,w=-z-liftY*y;
      points.push([u,w,y-liftX*x-liftY*z]);
      minX=Math.min(minX,u);minY=Math.min(minY,w);maxX=Math.max(maxX,u);maxY=Math.max(maxY,w);
    }
    minX=(Math.floor(minX*density)-1)/density;minY=(Math.floor(minY*density)-1)/density;
    const w=Math.ceil((maxX-minX)*density)+2,h=Math.ceil((maxY-minY)*density)+2;
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
    const c=canvas.getContext("2d"),pixels=c.createImageData(w,h),zbuf=new Float32Array(w*h);zbuf.fill(-Infinity);
    for(let i=0;i<points.length;i+=3){
      const a=points[i],b=points[i+1],d=points[i+2],x=(a[0]-minX)*density,y=(a[1]-minY)*density;
      const bx=(b[0]-a[0])*density,by=(b[1]-a[1])*density,dx=(d[0]-a[0])*density,dy=(d[1]-a[1])*density;
      const det=bx*dy-by*dx;
      if(Math.abs(det)<.000001)continue;
      const left=Math.max(0,Math.floor(x+Math.min(0,bx,dx))),right=Math.min(w-1,Math.ceil(x+Math.max(0,bx,dx)));
      const top=Math.max(0,Math.floor(y+Math.min(0,by,dy))),bottom=Math.min(h-1,Math.ceil(y+Math.max(0,by,dy)));
      const r=v[i*6+3]*255,g=v[i*6+4]*255,blue=v[i*6+5]*255,inv=1/det;
      for(let py=top;py<=bottom;py++)for(let px=left;px<=right;px++){
        const ex=px+.5-x,ey=py+.5-y,u=(ex*dy-ey*dx)*inv,k=(bx*ey-by*ex)*inv;
        if(u<0||k<0||u+k>1)continue;
        const depth=a[2]+u*(b[2]-a[2])+k*(d[2]-a[2]),index=py*w+px;
        if(depth<zbuf[index]-.00002)continue;
        zbuf[index]=depth;const n=index*4;
        pixels.data[n]=r;pixels.data[n+1]=g;pixels.data[n+2]=blue;pixels.data[n+3]=255;
      }
    }
    c.putImageData(pixels,0,0);
    const stamp={canvas,x:minX,y:minY,w:w/density,h:h/density};stamps.set(key,stamp);return stamp;
  }
  function imprint(ctx,key,x,y,s,res){
    const stamp=print(key,res);
    ctx.drawImage(stamp.canvas,x+stamp.x*s,y+stamp.y*s,stamp.w*s,stamp.h*s);
  }
  function overnight(ctx,x,y,s,night){
    if(night<.03)return;
    const a=.33*night;
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.globalAlpha=a;
    const light=ctx.createRadialGradient(0,0,0,0,0,3);
    light.addColorStop(0,"#f4d295");light.addColorStop(.46,"rgba(230,195,137,.46)");light.addColorStop(1,"rgba(239,208,150,0)");
    ctx.fillStyle=light;ctx.scale(.88,1.25);ctx.fillRect(-3,-3,6,6);ctx.restore();
  }
  function street(ctx,opt,px,py,s,visible){
    const weather=opt.weather||{},service=opt.valet,night=weather.night||0;
    if(visible(px(lot.x+6),py(lot.z),22*s)){
      imprint(ctx,"valet-parking",px(lot.x),py(lot.z),s,16);
      imprint(ctx,"valet-wall",px(lot.x),py(lot.z),s,39);
      for(const p of stalls)imprint(ctx,"valet-stop",px(p.x),py(p.z),s,53);
    }
    if(!visible(px(stand.x),py(stand.z),10*s))return;
    const x=px(stand.x),y=py(stand.z);
    imprint(ctx,"valet-apron",x,y,s,42);imprint(ctx,"valet-berth",px(berth.x),py(berth.z),s,44);
    if(weather.wet>.32)imprint(ctx,"valet-wet",x,y,s,46);
    overnight(ctx,px(stand.x+.82),y,s,night);
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);
    ctx.fillStyle="rgba(52,69,67,"+(.11+.08*(1-night))+")";
    ctx.fillRect(-2.02,-2.22,3.61,5.01);ctx.restore();
    imprint(ctx,"valet-desk",x,y,s,96);
    const heightPoint=(u,h,v)=>[x+(u+.22*h)*s,y-(v+.27*h)*s];
    for(let i=0;i<3;i++){
      const tag=fob(service?.slots?.[i]);
      if(tag)imprint(ctx,tag,...heightPoint(-1.26,1.698,rackZ+(i-1)*.356),s,155);
    }
    imprint(ctx,service?.onDuty?"valet-on":"valet-off",...heightPoint(-.083,1.135,.090),s,120);
    const minute=weather.minute??720;
    ctx.save();ctx.translate(...heightPoint(-1.295,2.205,rackZ));ctx.lineCap="round";
    for(const [a,len,width,color] of [[minute*tau/720,.079,.018,bottle],[minute*tau/60,.121,.012,salmon]]){
      const u=Math.sin(a)*len,h=Math.cos(a)*len;
      ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(.22*h*s,-(u+.27*h)*s);ctx.lineWidth=Math.max(.43,width*s);ctx.strokeStyle=color;ctx.stroke();
    }
    ctx.restore();
    const person=opt.player||{},atCounter=Math.hypot((person.x??0)-stand.x,(person.z??0)-stand.z)<6.8;
    ctx.save();ctx.globalAlpha=atCounter?.23:1;imprint(ctx,"valet-canopy",x,y,s,66);ctx.restore();
    if(atCounter){
      // Keep the street edge of the canopy intact when cutting away the roof above the clerk.
      ctx.save();ctx.beginPath();ctx.rect(x+2.48*s,y-4.05*s,.97*s,6.46*s);ctx.clip();
      imprint(ctx,"valet-canopy",x,y,s,66);ctx.restore();
    }
  }
  function badge(ctx,x,y,ui,active){
    ctx.save();ctx.translate(x,y);ctx.scale(ui,ui);
    ctx.beginPath();ctx.moveTo(-3.9,-5.4);ctx.lineTo(3.9,-5.4);ctx.lineTo(5.6,-3.1);
    ctx.lineTo(5.6,3.4);ctx.lineTo(0,6.4);ctx.lineTo(-5.6,3.4);ctx.lineTo(-5.6,-3.1);ctx.closePath();
    ctx.fillStyle=active?"#e4b77c":"#c89c76";ctx.fill();ctx.lineWidth=1.25;ctx.strokeStyle=midnight;ctx.stroke();
    ctx.strokeStyle=midnight;ctx.lineWidth=1.25;ctx.beginPath();ctx.moveTo(-2.48,-1.72);ctx.lineTo(0,2.94);ctx.lineTo(2.48,-1.72);ctx.stroke();
    ctx.fillStyle=midnight;ctx.fillRect(-1.75,-3.58,3.50,.68);ctx.restore();
  }
  function map(ctx,opt,px,py,s,visible){
    if(opt.mode==="street"){street(ctx,opt,px,py,s,visible);return;}
    if(opt.mode==="atlas"&&(opt.countyChart||opt.marina?.bayChart))return;
    const radar=opt.mode==="radar",ui=Math.min(ctx.canvas.width,ctx.canvas.height)/(radar?165:370);
    const x=px(desk.x),y=py(desk.z);
    if(visible(x,y,8*ui))badge(ctx,x,y,ui,!!opt.valet?.onDuty);
    if(!opt.valet?.onDuty)return;
    for(let i=0;i<stalls.length;i++){
      const guest=opt.valet.slots?.[i],v=guest?.car;
      if(!v||guest.tagged&&!guest.ready||!Number.isFinite(v.x)||!Number.isFinite(v.z))continue;
      const a=px(v.x),b=py(v.z);
      if(!visible(a,b,7*ui))continue;
      ctx.save();ctx.translate(a,b);ctx.rotate(v.yaw||0);ctx.scale(ui,ui);
      ctx.beginPath();ctx.moveTo(-1.35,2.11);ctx.lineTo(-1.35,-1.48);ctx.lineTo(-.92,-2.31);
      ctx.lineTo(.92,-2.31);ctx.lineTo(1.35,-1.48);ctx.lineTo(1.35,2.11);ctx.closePath();
      ctx.fillStyle=v.color||bone;ctx.fill();ctx.strokeStyle=midnight;ctx.lineWidth=.57;ctx.stroke();
      ctx.fillStyle=midnight;ctx.fillRect(-.92,-1.39,1.84,.70);
      ctx.strokeStyle=guest.ready?"#d99076":"#ecc58c";ctx.lineWidth=1.28;
      ctx.beginPath();ctx.moveTo(-3.6,2.4);ctx.lineTo(-3.6,-1.6);ctx.lineTo(-1.9,-3.6);
      ctx.moveTo(3.6,2.4);ctx.lineTo(3.6,-1.6);ctx.lineTo(1.9,-3.6);ctx.stroke();ctx.restore();
    }
  }
  window.BayValetPlaces={desk,keeper,berth,stalls,blocks,cameraBlocks,install,ground,world,map};
})();
