/* Inés Vidal's walk-up film counter between two of Ocean Drive's old palms. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,front=155.18,centerZ=20.675,half=4.675,depth=3.10;
  const p=(x,z,yaw=0,y=.076)=>({x,z,yaw,y});
  const lane=(x,z)=>({...p(x,z,0,.040),dir:0});
  const stall=z=>({...p(149.61,z,0,.040),dir:0});
  const site={id:"coast-camera",kind:"camera-shop",name:"Coast Camera & Cycle",x:154.34,z:21.45,
    center:p(156.73,centerZ),counter:p(154.34,21.45,pi/2,.115),clerk:p(156.18,21.45,-pi/2,.142),
    rider:p(151.62,22.56,-pi/2),door:p(156.65,16.00,pi,.142),prints:p(154.29,18.15,pi/2,.115),
    stalls:{paloma:stall(17.85),heron:stall(23.55)},guestStall:stall(29.50),guestCounter:p(154.10,22.68,pi/2,.115),
    entryRoad:lane(146.48,12.00),exitRoad:lane(146.48,34.00)};
  const ids=["marlin","wheel","luna"];
  const stockNames=["MARLIN","COAST WHEEL","CINE LUNA"];
  const path=(pairs,y=.076)=>pairs.map(([x,z])=>p(x,z,0,y));
  site.staffWalk=[site.clerk,...path([[156.64,20.45],[156.64,17.21],[156.65,15.18],[155.04,15.15],[152.00,16.36]]),site.rider];
  site.guestWalk=[...path([[150.52,29.49],[151.81,29.22],[153.87,26.22]]),site.guestCounter];
  site.apron={in:{},out:{}};
  for(const [id,b] of Object.entries({...site.stalls,guest:site.guestStall})){
    const south=Math.max(site.entryRoad.z,b.z-6.4);
    const incoming=[site.entryRoad,...path([[146.52,south],[146.88,south+1.02],[147.81,b.z-3.72],
      [148.87,b.z-2.53],[149.44,b.z-1.29]],.04),b];
    const outgoing=[b,...path([[149.35,b.z+1.38],[148.65,b.z+2.65],[147.50,b.z+4.00],
      [146.72,b.z+5.57],[146.48,b.z+6.70]],.04)];
    if(outgoing.at(-1).z<site.exitRoad.z-.03)outgoing.push(site.exitRoad);
    for(const [points,dir] of [[incoming,"in"],[outgoing,"out"]]){
      const pts=points.filter((q,i,a)=>!i||q.z>a[i-1].z+.025);
      site.apron[dir][id]=pts.map((q,i)=>{const b=pts[i+1];return {...q,yaw:i===0||!b?0:Math.atan2(b.x-q.x,b.z-q.z)};});
    }
  }
  // Frontage coordinates increase to the right for someone standing in the street.
  const at=(u,y,d)=>[front+d,y,centerZ-u];
  const c={blue:"#365968",cyan:"#507982",deep:"#273e4b",night:"#263938",mint:"#96b5a0",
    cream:"#e4d6af",paper:"#f0e3c4",butter:"#dca45a",red:"#ad5c4e",coral:"#cc7a60",green:"#708f84",
    silver:"#abb7a7",metal:"#657777",umber:"#765e50",wood:"#ab8862",tile:"#bdad93",grout:"#9c907c",glass:"#426269"};
  function box(g,u,y,d,w,h,deep,col){
    const a=at(u,y,d);g.box(a[0],a[1],a[2],deep,h,w,col);
  }
  function pole(g,u,y,d,U,Y,D,r,col,n=6){g.pole(at(u,y,d),at(U,Y,D),r,col,n);}
  const facade=d=>(u,y)=>at(u,y,d),side=u=>(d,y)=>at(u,y,d),top=y=>(u,d)=>at(u,y,d);
  function plate(g,f,u,y,w,h,col){g.quad(f(u-w/2,y-h/2),f(u+w/2,y-h/2),f(u+w/2,y+h/2),f(u-w/2,y+h/2),col);}
  function stripe(g,f,x,y,X,Y,w,col){
    const dx=X-x,dy=Y-y,n=Math.hypot(dx,dy);if(n<.00001)return;
    const a=-dy*w/(2*n),b=dx*w/(2*n);
    g.quad(f(x+a,y+b),f(X+a,Y+b),f(X-a,Y-b),f(x-a,y-b),col);
  }
  function chain(g,f,points,w,col){for(let i=1;i<points.length;i++)stripe(g,f,...points[i-1],...points[i],w,col);}
  function disk(g,f,x,y,rx,ry,col,n=16){
    for(let i=0;i<n;i++){const t=i*tau/n,q=(i+1)*tau/n;g.tri(f(x,y),f(x+rx*Math.cos(t),y+ry*Math.sin(t)),f(x+rx*Math.cos(q),y+ry*Math.sin(q)),col);}
  }
  function ring(g,f,x,y,r,w,col,n=18){
    for(let i=0;i<n;i++){const t=i*tau/n,q=(i+1)*tau/n;
      g.quad(f(x+r*Math.cos(t),y+r*Math.sin(t)),f(x+r*Math.cos(q),y+r*Math.sin(q)),
        f(x+(r-w)*Math.cos(q),y+(r-w)*Math.sin(q)),f(x+(r-w)*Math.cos(t),y+(r-w)*Math.sin(t)),col);}
  }
  const glyph={
    A:["00 03 18 38 43 40","14 34"],B:["00 08 38 47 46 35 05","35 44 41 30 00"],
    C:["47 38 18 07 01 10 30 41"],D:["00 08 28 47 41 20 00"],E:["48 08 00 40","05 35"],
    F:["00 08 48","05 35"],H:["00 08","40 48","04 44"],I:["08 48","28 20","00 40"],
    L:["08 00 40"],M:["00 08 25 48 40"],N:["00 08 40 48"],O:["18 38 47 41 30 10 01 07 18"],
    P:["00 08 38 47 45 34 04"],R:["00 08 38 47 45 34 04","24 40"],
    S:["47 38 18 07 06 15 34 43 41 30 10 01"],T:["08 48","28 20"],
    U:["08 02 10 30 42 48"],V:["08 14 20 34 48"],W:["08 10 24 30 48"],
    Y:["08 24 48","24 20"],"&":["40 06 07 18 27 26 03 01 10 20 44"],
    "1":["17 28 20","10 30"],"3":["08 38 47 46 35 25","35 44 41 30 00"],
    "5":["48 08 05 35 44 41 30 00"]
  };
  function word(g,f,str,u,v,h,col,spacing=.78){
    const adv=h*spacing,base=u-(str.length-1)*adv/2-h*.25;
    for(let i=0;i<str.length;i++){
      for(const stroke of glyph[str[i]]||[]){
        const line=stroke.split(" ").map(q=>[base+i*adv+Number(q[0])*h/8,v+(Number(q[1])-4)*h/8]);
        chain(g,f,line,h*.115,col);
      }
    }
  }
  function coastScript(g,f,x,y,size,col){
    const strokes=[
      [[.93,.94],[.81,1.05],[.58,1.04],[.34,.89],[.14,.59],[.09,.34],[.14,.15],[.28,.07],[.56,.11],[.76,.27],[.88,.41]],
      [[.95,.42],[1.07,.54],[1.20,.52],[1.20,.36],[1.11,.19],[.99,.14],[.92,.19],[.91,.32],[1.01,.48],[1.12,.54],[1.28,.45],[1.41,.48]],
      [[1.75,.50],[1.58,.55],[1.44,.48],[1.34,.28],[1.38,.16],[1.48,.15],[1.60,.25],[1.74,.51],[1.62,.21],[1.68,.15],[1.82,.22],[1.91,.34]],
      [[1.83,.27],[2.07,.55],[2.12,.53],[2.04,.40],[2.11,.28],[2.06,.17],[1.95,.15],[1.89,.21],[2.12,.17],[2.28,.30]],
      [[2.40,.86],[2.24,.43],[2.18,.19],[2.24,.13],[2.37,.16],[2.51,.28],[2.64,.29]],
      [[2.09,.54],[2.55,.58]],
      [[.31,-.03],[.75,-.07],[1.26,-.05],[1.93,.00],[2.33,.01],[2.52,-.01]]
    ];
    for(const ln of strokes)chain(g,f,ln.map(([U,Y])=>[x+size*(U-1.38),y+size*(Y-.45)]),.054*size,col);
  }
  function cameraWheel(g,f,u,y,size,light,dark){
    const a=(x,z)=>[u+x*size,y+z*size];
    chain(g,f,[[-.70,-.35],[-.70,.30],[-.34,.30],[-.21,.51],[.25,.51],[.38,.30],[.70,.30],[.70,-.35],[-.70,-.35]].map(v=>a(...v)),size*.078,light);
    ring(g,f,u,y+.018*size,.268*size,.058*size,light,14);disk(g,f,u,y+.018*size,.091*size,.091*size,dark,9);
    for(let i=0;i<5;i++){const t=i*tau/5+.29;stripe(g,f,...a(.215*Math.cos(t),.02+.215*Math.sin(t)),...a(.085*Math.cos(t+.49),.02+.085*Math.sin(t+.49)),size*.035,light);}
    plate(g,f,u-.46*size,y+.12*size,.185*size,.079*size,light);
  }
  const blocks=[],cameraBlocks=[];
  function solid(u,d,w,h,dep,bottom=0,body=true){
    const a=at(u,0,d),b={x:a[0],z:a[2],w:dep,d:w,bottom,top:h,streetProp:true};
    cameraBlocks.push(b);if(body)blocks.push(b);
  }
  solid(0,3.045,9.35,2.96,.11);solid(-4.62,1.55,.11,2.96,3.10);
  // The south end has a full-height working staff doorway. Keep its actual swing and aisle clear.
  solid(4.62,.245,.11,2.96,.49);solid(4.62,2.64,.11,2.96,.92);
  solid(0,.055,9.35,1.15,.11);solid(2.59,.17,3.90,1.01,.33);
  solid(-.785,.035,2.51,1.18,.51);solid(-3.32,.20,2.52,1.02,.39);
  solid(-.1,2.71,8.14,.98,.66);solid(-3.86,2.29,1.23,1.27,.32);
  solid(0,1.54,9.69,3.21,3.42,2.96,false);solid(-.88,-.58,3.47,2.85,1.08,2.54,false);
  solid(-4.31,-.43,.19,4.03,1.15,2.96,false);
  function floor(x,z){
    if(x>=front-.13&&x<=front+3.25&&z>=15.70&&z<=25.65)return .142;
    if(x>=front-1.12&&x<front&&z>16.00&&z<25.36)return .115;
    return null;
  }
  function plinth(g,detail){
    box(g,0,.099,1.48,9.94,.088,3.56,c.grout);
    box(g,0,.134,1.50,9.78,.014,3.52,c.tile);
    box(g,0,.088,-.59,9.35,.052,1.05,"#c9bba2");
    if(!detail)return;
    for(let j=0;j<10;j++)plate(g,top(.116),-4.42+j*.98,-.61,.013,1.02,"#ab9b86");
    for(let j=0;j<7;j++)plate(g,top(.143),-4.27+j*1.36,1.52,.019,3.38,"#ac9e88");
    plate(g,top(.144),0,1.62,9.68,.017,"#ac9e88");
    // Angled skid-resistant threshold, torn edge of a former doormat and brass door stop.
    box(g,4.78,.115,1.39,.30,.049,1.53,c.silver);
    for(let j=0;j<5;j++)box(g,4.72+j*.039,.1425,1.39,.010,.007,1.51,c.metal);
    box(g,4.39,.151,1.33,.31,.014,.98,"#807764");box(g,4.43,.159,1.32,.06,.005,.84,"#6d6b60");
  }
  function shell(g,detail){
    box(g,0,1.56,3.045,9.35,2.84,.11,c.cream);
    box(g,-4.62,1.56,1.55,.11,2.84,3.10,c.mint);
    for(const [d,w] of [[.245,.49],[2.64,.92]])box(g,4.62,1.56,d,.11,2.84,w,c.cream);
    box(g,4.62,2.76,1.33,.11,.40,1.69,c.cream);
    if(detail){for(const [d,w] of [[.53,.073],[2.15,.075]])box(g,4.60,1.31,d,.158,2.34,w,c.blue);
      box(g,4.60,2.51,1.34,.159,.08,1.69,c.blue);}
    box(g,0,.66,.064,9.35,1.04,.128,c.blue);
    box(g,0,.272,-.015,9.38,.172,.065,c.deep);box(g,0,1.083,-.013,9.38,.086,.056,c.butter);
    box(g,0,.95,-.016,9.36,.030,.050,c.butter);
    for(const u of [-4.59,-2.10,.58,4.60])box(g,u,1.92,.08,.11,1.74,.156,c.cream);
    box(g,0,2.83,.07,9.35,.29,.15,c.cyan);
    if(detail)for(const d of [.05,3.04])for(const u of [-4.62,4.62])box(g,u,1.58,d,.132,2.89,.14,c.blue);
    box(g,0,3.013,1.48,9.65,.11,3.49,c.deep);box(g,0,3.13,1.50,9.65,.13,3.48,c.cyan);
    box(g,0,3.18,-.197,9.66,.055,.07,c.cream);
    if(detail)for(const u of [-4.80,4.80])box(g,u,3.185,1.50,.072,.058,3.48,c.cream);
    box(g,0,3.133,3.191,9.65,.11,.076,c.metal);
    if(!detail)return;
    for(let u=-4.5;u<4.52;u+=.381)plate(g,facade(-.028),u,.655,.015,.72,"#426775");
    for(const u of [-4.30,-3.01,-1.05,1.12,3.33])plate(g,facade(-.032),u,.256,.16,.013,"#81867c");
    for(let h=.32;h<2.97;h+=.23){
      for(const [u,d,len] of [[-4.681,1.55,2.9],[4.682,2.62,.81],[4.682,.24,.36]])plate(g,side(u),d,h,len,.015,"#b0ac92");
    }
    for(let u=-4.32;u<=4.48;u+=1.10)box(g,u,3.215,1.48,.032,.037,3.27,"#789590");
    box(g,-2.18,3.24,2.35,.93,.09,.61,c.silver);box(g,-2.18,3.45,2.35,.71,.37,.42,c.metal);
    for(let i=0;i<5;i++)box(g,-2.18,3.30+i*.069,2.35,.78,.028,.48,i%2?c.cyan:c.silver);
    box(g,-2.18,3.666,2.35,.85,.085,.56,c.silver);
    pole(g,4.47,.21,3.15,4.47,3.105,3.15,.043,c.metal);
    pole(g,4.47,.20,3.15,4.47,.15,3.39,.041,c.metal);
    for(const u of [-4.38,4.31]){pole(g,u,2.68,.18,u,2.97,.66,.021,c.metal);box(g,u,2.94,.66,.112,.048,.13,c.deep);}
  }
  function mainSign(g,detail){
    box(g,.62,3.54,.09,7.82,.64,.17,c.deep);
    box(g,.62,3.59,.072,7.79,.53,.192,c.cream);
    box(g,.62,3.591,-.041,7.64,.433,.041,c.blue);
    box(g,.62,3.84,.073,7.83,.044,.23,c.butter);
    box(g,.58,3.325,-.062,7.59,.033,.045,c.coral);
    for(const u of [-2.61,.31,3.87]){box(g,u,3.246,.23,.074,.30,.085,c.metal);if(detail)pole(g,u,3.77,.175,u,3.19,.55,.02,c.metal);}
    if(detail){
      cameraWheel(g,facade(-.068),-2.61,3.566,.428,c.paper,c.butter);
      coastScript(g,facade(-.075),-1.31,3.565,.433,c.paper);
      plate(g,facade(-.074),-.418,3.575,.019,.244,c.butter);
      word(g,facade(-.073),"CAMERA & CYCLE",1.98,3.568,.293,c.paper,.71);
    }
    // Old double-sided film blade, bolted into the north end of the shop.
    for(const h of [3.17,3.69])pole(g,-4.32,h,-.11,-4.32,h,-1.11,.032,c.umber);
    box(g,-4.32,3.49,-.90,.171,.91,.69,c.blue);
    box(g,-4.32,3.974,-.90,.188,.065,.74,c.butter);
    box(g,-4.32,3.016,-.90,.188,.045,.73,c.coral);
    if(!detail)return;
    for(const sign of [-1,1]){
      const f=(x,y)=>at(-4.32+sign*.093,y,-.9+sign*x);
      plate(g,f,0,3.50,.615,.78,c.deep);word(g,f,"35",0,3.62,.315,c.butter,.80);
      word(g,f,"FILM",0,3.33,.115,c.paper,.69);plate(g,f,0,3.23,.34,.019,c.coral);
    }
  }
  function awning(g,detail){
    const mid=-.80,w=3.20,end=-1.10;
    if(detail)for(const u of [mid-w/2+.05,mid+w/2-.05]){
      pole(g,u,2.72,-.05,u,2.44,end+.09,.018,c.silver);
      pole(g,u,2.06,-.04,u,2.44,end+.09,.019,c.silver);
    }
    const N=detail?13:5;
    for(let j=0;j<N;j++){
      const a=mid-w/2+j*w/N,b=a+w/N,col=j%2?c.cream:c.green;
      g.quad(at(a,2.83,-.01),at(b,2.83,-.01),at(b,2.53,end),at(a,2.53,end),col);
      g.quad(at(a,2.535,end),at(b,2.535,end),at(b,2.435,end),at(a,2.435,end),col);
      if(detail){g.tri(at(a,2.437,end),at((a+b)/2,2.399,end),at(b,2.437,end),col);}
    }
  }
  function workshop(g,detail){
    box(g,.00,.55,2.72,8.12,.77,.61,c.green);
    box(g,.00,.977,2.70,8.23,.087,.71,c.wood);
    box(g,-.78,1.057,.09,2.53,.17,.58,c.silver);
    box(g,-.78,1.165,.075,2.60,.080,.65,c.cream);
    box(g,2.58,1.045,.23,3.81,.10,.44,c.deep);
    box(g,-3.31,1.035,.19,2.52,.09,.39,c.deep);
    if(!detail)return;
    // Above the bench, three actual sections of spokes hang from a rim truing jig.
    const wall=facade(2.98);plate(g,wall,-3.30,1.83,2.38,1.26,"#b18f6a");
    for(let row=0;row<4;row++)for(let i=0;i<10;i++)plate(g,facade(2.974),-4.31+i*.225,1.32+row*.30,.033,.033,c.umber);
    plate(g,facade(2.96),-3.40,1.87,.056,.55,c.silver);plate(g,facade(2.96),-3.70,1.87,.041,.49,c.deep);
    for(const [u,r] of [[-3.94,.314],[-2.90,.244]]){
      ring(g,facade(2.89),u,1.84,r,.046,c.deep,20);ring(g,facade(2.887),u,1.84,r-.049,.012,c.silver,18);
      for(let j=0;j<8;j++){const q=j*tau/8+.14;stripe(g,facade(2.88),u+.046*Math.cos(q+.46),1.84+.046*Math.sin(q+.46),u+(r-.059)*Math.cos(q),1.84+(r-.059)*Math.sin(q),.013,c.metal);}
      disk(g,facade(2.876),u,1.84,.047,.047,c.silver,9);
    }
    plate(g,facade(2.375),-.10,.59,3.11,.61,"#859d89");
    for(const u of [-1.26,-.49,.30,1.07]){plate(g,facade(2.37),u,.59,.017,.61,c.metal);plate(g,facade(2.36),u+.18,.77,.22,.025,c.cream);}
    // The print enlarger has a bellows, lens board, crank and negative carrier over its easel.
    box(g,1.99,1.05,2.61,.68,.065,.42,c.deep);box(g,2.22,1.56,2.78,.061,1.00,.069,c.silver);
    box(g,2.00,1.91,2.65,.47,.16,.26,c.blue);box(g,1.99,1.77,2.60,.27,.16,.21,c.deep);
    for(let i=0;i<4;i++)box(g,1.99,1.71+i*.047,2.60,.29-i*.011,.022,.223-i*.008,c.metal);
    box(g,1.99,1.645,2.60,.21,.048,.17,c.deep);box(g,2.13,1.86,2.48,.39,.028,.084,c.silver);
    box(g,1.97,1.101,2.58,.37,.018,.266,c.paper);
    for(const u of [.93,1.32]){box(g,u,1.056,2.61,.32,.055,.29,c.red);box(g,u,1.084,2.61,.27,.012,.24,c.coral);}
    for(const [u,h,col] of [[.57,.27,c.umber],[.35,.21,c.butter],[.16,.245,c.umber]]){
      const q=at(u,1.018+h/2,2.76);g.cyl(...q,.065,.071,h,8,col);box(g,u,1.036+h,2.76,.086,.048,.086,c.deep);
      plate(g,facade(2.69),u,1.035+h*.48,.075,.082,c.cream);
    }
    // A steel receipt register, brown-paper pick-up envelopes and fresh boxes of 35 mm.
    box(g,-1.52,1.28,.12,.41,.145,.33,c.blue);box(g,-1.52,1.392,.18,.37,.104,.19,c.green);
    plate(g,facade(.076),-1.52,1.403,.21,.039,c.deep);
    for(let j=0;j<3;j++)box(g,-1.61+j*.09,1.361,-.002,.051,.024,.043,j===2?c.coral:c.silver);
    for(let i=0;i<3;i++)box(g,-.19+i*.012,1.214+i*.017,.065,.34,.015,.208,i===1?c.wood:c.butter);
    for(let i=0;i<4;i++){const u=-3.98+.30*i;box(g,u,1.193,.19,.24,.23,.19,i%2?c.butter:c.coral);
      plate(g,facade(.089),u,1.200,.153,.089,c.paper);plate(g,facade(.085),u,1.127,.196,.025,c.blue);}
    for(let j=0;j<2;j++){const u=-3.57+j*.49;box(g,u,1.17,.50,.36,.16,.29,c.deep);box(g,u,1.267,.48,.25,.035,.23,c.silver);
      disk(g,facade(.337),u-.031,1.182,.072,.072,c.silver,11);disk(g,facade(.329),u-.031,1.182,.044,.044,c.glass,10);}
    // The after-hours envelope slot is cut into the shopfront, below the open cash window.
    box(g,-.80,.783,-.021,.65,.207,.041,c.metal);plate(g,facade(-.048),-.80,.764,.515,.083,c.deep);
    plate(g,facade(-.053),-.80,.803,.534,.028,c.silver);word(g,facade(-.052),"FILM IN",-.80,.844,.055,c.paper,.72);
    box(g,-3.24,1.87,.15,2.51,.045,.14,c.silver);box(g,.66,1.81,.096,.046,1.31,.10,c.silver);
    for(const u of [-4.53,-2.07,.61,4.54])box(g,u,1.96,.18,.048,1.55,.096,c.silver);
    box(g,-.81,2.18,2.963,1.59,.43,.042,c.green);plate(g,facade(2.938),-.81,2.18,1.52,.35,c.cream);
    word(g,facade(2.934),"VIDAL FILM",-.81,2.19,.178,c.deep,.74);plate(g,facade(2.933),-.81,2.051,1.18,.019,c.coral);
  }
  const frames=[1.31,2.55,3.78].map((u,i)=>({id:ids[i],u,y:1.73+[.008,-.019,.019][i],d:.070,
    width:.884,height:.663,tilt:.13,...p(front+.070,centerZ-u,-pi/2,1.73+[.008,-.019,.019][i])}));
  site.frames=frames;
  const onPrint=(b,x,y,d=0)=>at(b.u+x,b.y+y,b.d+y*b.tilt+d);
  function negatives(g,detail){
    if(!detail){
      box(g,2.55,1.79,.41,3.92,1.58,.072,c.green);
      for(const b of frames){const w=b.width*.5,h=b.height*.5;
        g.quad(onPrint(b,-w,-h,0),onPrint(b,w,-h,0),onPrint(b,w,h,0),onPrint(b,-w,h,0),c.paper);}
      return;
    }
    const wire=-.066;
    for(const u of [.69,4.43]){pole(g,u,2.22,.206,u,2.23,wire,.018,c.metal);box(g,u,2.245,wire,.064,.090,.083,c.silver);}
    pole(g,.69,2.23,wire,2.49,2.155,wire+.016,.009,c.deep);
    pole(g,2.49,2.155,wire+.016,4.43,2.23,wire,.009,c.deep);
    box(g,2.55,1.79,.41,3.92,1.58,.072,c.green);
    box(g,2.55,1.81,.355,3.75,1.40,.025,"#748e80");
    for(const b of frames){
      const w=b.width/2,h=b.height/2;
      g.quad(onPrint(b,-w-.043,-h-.071,.007),onPrint(b,w+.043,-h-.071,.007),onPrint(b,w+.043,h+.043,.007),onPrint(b,-w-.043,h+.043,.007),c.paper);
      g.quad(onPrint(b,-w,-h,.005),onPrint(b,w,-h,.005),onPrint(b,w,h,.005),onPrint(b,-w,h,.005),"#b4baa5");
      const f=(u,y)=>onPrint(b,u,y,.002);
      for(const q of [-1,1]){plate(g,f,q*(w-.09),h-.055,.058,.010,c.cream);plate(g,f,q*(w-.11),h-.070,.011,.04,c.cream);}
      plate(g,f,-w+.11,-h-.035,.143,.010,"#b8af94");
      for(const off of [-.32,.31]){
        const wireY=2.158+.075*Math.abs((b.u+off-2.49)/1.9);
        pole(g,b.u+off,wireY,wire+.01,b.u+off,b.y+h+.011,b.d+h*b.tilt-.012,.020,c.metal,4);
        box(g,b.u+off,b.y+h+.033,b.d+h*b.tilt-.025,.044,.055,.061,c.butter);
      }
    }
  }
  function streetside(g,detail){
    for(const [id,b] of Object.entries({...site.stalls,guest:site.guestStall})){
      const left=b.x-1.04,right=b.x+1.04,ink=id==="guest"?"#a39b83":"#cfbb90",y=.071;
      const rect=(x,z,w,d,col)=>g.quad([x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],col);
      for(const x of [left,right]){
        rect(x,b.z-1.69,.068,.63,ink);rect(x,b.z+1.74,.068,.52,ink);rect(x+(x===left?.19:-.19),b.z+1.995,.44,.069,ink);
      }
      if(detail){
        rect(left+.25,b.z-2.00,.57,.062,ink);rect(right-.22,b.z-2.00,.49,.062,ink);
        const f=(U,V)=>[b.x+U,y+.002,b.z+1.49+V];
        cameraWheel(g,f,0,0,.326,ink,"#8f8c80");
      }
    }
  }
  function lamps(g){
    // An amber jewel over the film door stays lit after Inés has closed the shutters.
    disk(g,side(4.694),1.32,2.763,.098,.098,"#ffa779",12);
    for(const [u,w] of [[-3.31,2.30],[-.74,2.2],[2.56,3.57]])box(g,u,2.618,.21,w,.031,.051,"#fff1c5");
    for(const u of [-2.49,.55,3.78]){pole(g,u,3.91,.02,u,3.94,-.30,.018,c.metal);box(g,u,3.905,-.30,.255,.047,.083,"#ffdf9b");}
    coastScript(g,facade(-.079),-1.31,3.565,.433,"#ffe5af");
    ring(g,facade(-.078),-2.61,3.574,.114,.025,"#f0bd7d",14);
    plate(g,facade(-.079),1.95,3.423,3.21,.015,"#d6946e");
    for(const sign of [-1,1]){const f=(x,y)=>at(-4.32+sign*.096,y,-.9+sign*x);word(g,f,"35",0,3.62,.315,"#ffdd91",.80);}
  }
  function filmTail(g){
    // Backlit developed film hanging from the second wire in the hatch. The clip is the pivot.
    g.quad([-.044,0,0],[.044,0,0],[.045,-.246,.018],[-.043,-.246,.018],"#655b49");
    g.quad([-.043,-.246,.018],[.045,-.246,.018],[.041,-.49,.038],[-.045,-.49,.038],"#766c50");
    for(let i=0;i<6;i++){
      const y=-.050-i*.073,z=-y*.077+.001;
      g.quad([-.029,y+.020,z],[.029,y+.020,z],[.030,y-.020,z+.003],[-.030,y-.020,z+.003],i%2?"#4d5144":"#595747");
    }
  }
  function build(g,near){plinth(g,near);shell(g,near);mainSign(g,near);awning(g,near);workshop(g,near);negatives(g,near);streetside(g,near);}
  function filmMesh(g){
    for(let i=0;i<frames.length;i++){
      const b=frames[i],hw=b.width/2,hh=b.height/2,left=8+344*i,r=left+320;
      for(const [x,y,U,V] of [[-hw,-hh,left,248],[hw,-hh,r,248],[hw,hh,r,8],[-hw,-hh,left,248],[hw,hh,r,8],[-hw,hh,left,8]]){
        const q=onPrint(b,x,y,-.001);g.vertices.push(q[0],q[1],q[2],U/1024,V/256,0);
      }
    }
  }
  function install(model){
    model("coast-camera-shop",g=>build(g,true));model("coast-camera-roadside",g=>build(g,false));
    model("coast-camera-lamps",lamps);model("coast-camera-film-tail",filmTail);model("coast-camera-window-prints",filmMesh);
  }
  function world(list,see,t=0,hours){
    if(!see(site.center,141))return;
    const close=see(site.center,56);list.push([close?"coast-camera-shop":"coast-camera-roadside",0,0,0,0]);
    if(close){
      if((hours?.night||0)>.08)list.push(["coast-camera-lamps",0,0,0,0,0,0,.86*hours.night]);
      if(see(site.center,26)){
        for(let i=0;i<3;i++)list.push(["coast-camera-film-tail",front+.355,2.66,centerZ+2.37-i*.14,
          pi/2+.14*Math.sin(t*1.17+i),.040+.049*Math.sin(t*1.61+i*.81),-.042+i*.041]);
      }
    }
  }
  let sheet=null;
  function paperCanvas(w,h){
    const q=typeof OffscreenCanvas==="function"?new OffscreenCanvas(w,h):typeof document!=="undefined"?document.createElement("canvas"):null;
    if(!q)return null;q.width=w;q.height=h;return q;
  }
  function fillPrint(stock,i,image){
    const g=stock.ctx,x=8+i*344,y=8;
    g.fillStyle=["#abb5a2","#a7b4a4","#b6b198"][i];g.fillRect(x-2,0,324,256);
    if(image){
      const fullW=image.naturalWidth,fullH=image.naturalHeight;
      const h=Math.min(fullH,fullW*.75),w=h*4/3;
      g.drawImage(image,(fullW-w)*.5,(fullH-h)*.5,w,h,x,y,320,240);
      // Extend the outside pixel past the trim so distant mip levels stay the colour of the print.
      g.drawImage(stock.canvas,x,y,320,1,x,0,320,8);g.drawImage(stock.canvas,x,y+239,320,1,x,248,320,8);
      g.drawImage(stock.canvas,x,0,1,256,x-2,0,2,256);g.drawImage(stock.canvas,x+319,0,1,256,x+320,0,2,256);
    }else{
      g.fillStyle="#d2cfb4";
      for(const at of [x+18,x+302]){g.fillRect(at-6,y+18,12,2);g.fillRect(at-1,y+14,2,9);}
      g.textAlign="center";g.textBaseline="middle";g.fillStyle="#818b7b";g.font="12px monospace";
      g.fillText(stockNames[i],x+160,y+207);
    }
    stock.revision++;
  }
  function stock(records){
    const sources=ids.map(id=>{
      const s=records?.[id]?.image;return typeof s==="string"&&s.startsWith("data:image/jpeg;base64,")?s:null;
    });
    if(!sources.some(Boolean)&&!sheet)return null;
    if(!sheet){
      const canvas=paperCanvas(1024,256),ctx=canvas?.getContext?.("2d");if(!ctx?.drawImage)return null;
      sheet={canvas,ctx,sources:[undefined,undefined,undefined],decoded:[null,null,null],revision:0};
    }
    for(let i=0;i<3;i++){
      const src=sources[i];if(sheet.sources[i]===src)continue;sheet.sources[i]=src;sheet.decoded[i]=null;fillPrint(sheet,i,null);
      if(src&&typeof Image!=="undefined"){
        const image=new Image();
        image.onload=()=>{if(sheet.sources[i]===src&&image.naturalWidth){sheet.decoded[i]=image;fillPrint(sheet,i,image);}};
        image.src=src;
      }
    }
    return sources.some(Boolean)?sheet:null;
  }
  function prints(view,model,records,see){
    const eye=view.basis?.camera;
    if(!view.drawPrint||!records||!see(site.prints,43)||eye&&eye.x>front+.17)return;
    const q=stock(records);if(!q?.decoded.some(Boolean))return;
    model("coast-camera-window-prints",filmMesh);
    view.drawPrint("coast-camera-window-prints",q.canvas,q.revision,0,0,0,0);
  }
  function cutaway(g){
    // The east roof lifts off as the player reaches the borrowed bikes. Keep the window and print line.
    plinth(g,true);streetside(g,true);
    box(g,0,.565,3.045,9.35,.84,.11,c.cream);box(g,0,1.005,3.045,9.35,.055,.15,c.cyan);
    box(g,-4.62,.555,1.55,.11,.82,3.10,c.mint);box(g,-4.62,1.005,1.55,.15,.075,3.14,c.cyan);
    for(const [d,w] of [[.245,.49],[2.64,.92]]){box(g,4.62,.555,d,.11,.82,w,c.cream);box(g,4.62,1.005,d,.16,.075,w,c.cyan);}
    box(g,0,.642,.055,9.35,1.01,.11,c.blue);box(g,0,1.107,-.009,9.37,.089,.059,c.butter);
    for(const u of [-4.59,-2.10,.58,4.60])box(g,u,1.57,.07,.085,.86,.12,c.cream);
    workshop(g,true);negatives(g,true);
  }
  const region={x:148.15,z:14.75,w:12.65,d:17.5},maps=[];
  const leanX=.455,leanZ=.245;
  function paintedPlate(cut){
    const state=Number(cut);if(maps[state]!==undefined)return maps[state];
    const scale=26,w=Math.ceil(region.w*scale),h=Math.ceil(region.d*scale),canvas=paperCanvas(w,h),ctx=canvas?.getContext?.("2d");
    if(!ctx?.createImageData){maps[state]=null;return null;}
    const mesh=new BayMesh();if(cut)cutaway(mesh);else build(mesh,true);
    const vertices=mesh.vertices,picture=ctx.createImageData(w,h),rgba=picture.data,depth=new Float32Array(w*h);depth.fill(-100);
    const project=i=>[(vertices[i]+vertices[i+1]*leanX-region.x)*scale,(vertices[i+2]+vertices[i+1]*leanZ-region.z)*scale];
    for(let i=0;i<vertices.length;i+=18){
      const [x,z]=project(i),[x1,z1]=project(i+6),[x2,z2]=project(i+12);
      const dx=x1-x,dz=z1-z,ex=x2-x,ez=z2-z,area=dx*ez-dz*ex;if(Math.abs(area)<.0001)continue;
      const x0=Math.max(0,Math.floor(Math.min(x,x1,x2))),xEnd=Math.min(w-1,Math.ceil(Math.max(x,x1,x2))),
        z0=Math.max(0,Math.floor(Math.min(z,z1,z2))),zEnd=Math.min(h-1,Math.ceil(Math.max(z,z1,z2)));
      const r=vertices[i+3]*255,green=vertices[i+4]*255,b=vertices[i+5]*255,base=vertices[i+1],dy=vertices[i+7]-base,fy=vertices[i+13]-base;
      for(let iz=z0;iz<=zEnd;iz++)for(let ix=x0;ix<=xEnd;ix++){
        const a=ix+.5-x,v=iz+.5-z,u=(a*ez-v*ex)/area,k=(dx*v-dz*a)/area;
        if(u<-.0001||k<-.0001||u+k>1.0001)continue;
        const y=base+dy*u+fy*k,j=iz*w+ix;if(y<depth[j]-.0001)continue;depth[j]=y;
        const off=j*4;rgba[off]=r;rgba[off+1]=green;rgba[off+2]=b;rgba[off+3]=255;
      }
    }
    ctx.putImageData(picture,0,0);maps[state]=canvas;return canvas;
  }
  function simplePlan(g,cut){
    const rect=(x,z,w,d,col)=>{g.fillStyle=col;g.fillRect(x-w/2,z-d/2,w,d);};
    rect(156.53,centerZ,4.48,9.94,c.tile);rect(156.73,centerZ,3.1,9.35,c.cream);
    if(cut){
      rect(157.94,centerZ,.68,8.15,c.wood);rect(155.26,centerZ,.16,9.35,c.blue);
      rect(155.28,21.46,.47,2.54,c.paper);rect(155.41,18.10,.37,3.80,c.green);
      for(const b of frames)rect(front+.42,b.z,.15,b.width,c.paper);
    }else{
      rect(156.69,centerZ,3.47,9.65,c.cyan);rect(154.70,21.47,1.10,3.2,c.green);
      for(let i=0;i<6;i++)rect(154.70,20.1+i*.50,1.1,.20,c.paper);
    }
  }
  function interiorVisible(player){return !!player&&player.x>145.5&&player.x<162.2&&player.z>12.0&&player.z<32.62;}
  function occludesActor(actor,player){
    return !!actor&&actor.x>front+.09&&actor.x<front+3.02&&actor.z>16.03&&actor.z<25.31&&!interiorVisible(player);
  }
  function mapPrints(g,records){
    const q=stock(records);if(!q?.decoded.some(Boolean))return;
    const projection=([x,y,z])=>[x+leanX*y,z+leanZ*y];
    for(let i=0;i<frames.length;i++){
      if(!q.decoded[i])continue;
      const b=frames[i],hw=b.width/2,hh=b.height/2;
      const [x,y]=projection(onPrint(b,-hw,hh)),[rx,ry]=projection(onPrint(b,hw,hh)),[bx,by]=projection(onPrint(b,-hw,-hh));
      g.save();g.transform((rx-x)/320,(ry-y)/320,(bx-x)/240,(by-y)/240,x,y);
      g.drawImage(q.canvas,8+i*344,8,320,240,0,0,320,240);g.restore();
    }
  }
  function pin(g,atlas,ui){
    g.save();g.scale(ui,ui);g.fillStyle=c.deep;g.beginPath();g.arc(0,0,6.75,0,tau);g.fill();
    g.strokeStyle=c.butter;g.lineWidth=.96;g.beginPath();g.arc(0,0,5.8,0,tau);g.stroke();
    g.lineWidth=.97;g.strokeStyle=c.paper;g.lineJoin="round";g.beginPath();
    g.moveTo(-3.95,-1.95);g.lineTo(-1.85,-1.95);g.lineTo(-1.25,-2.95);g.lineTo(.50,-2.95);g.lineTo(1.30,-1.95);
    g.lineTo(3.88,-1.95);g.lineTo(3.88,2.51);g.lineTo(-3.95,2.51);g.closePath();g.stroke();g.beginPath();g.arc(.08,.18,1.35,0,tau);g.stroke();
    if(atlas){g.font="bold 8px system-ui";g.textAlign="right";g.textBaseline="middle";g.strokeStyle=c.deep;g.fillStyle=c.paper;
      g.lineWidth=2.7;g.strokeText(site.name,-8,6);g.fillText(site.name,-8,6);}
    g.restore();
  }
  function map(ctx,opt,px,py,s,visible,t=0){
    const street=opt.mode==="street",atlas=opt.mode==="atlas";
    if(atlas&&(opt.countyChart||opt.marina?.bayChart)||!visible(px(site.center.x),py(site.center.z),15*s+16))return;
    const cut=street&&interiorVisible(opt.player);
    ctx.save();ctx.translate(px(0),py(0));ctx.scale(s,-s);
    const plate=street?paintedPlate(cut):null;
    if(plate)ctx.drawImage(plate,region.x,region.z,region.w,region.d);else simplePlan(ctx,cut);
    if(street&&cut){
      const night=opt.weather?.night||0;
      if(night>.08){ctx.save();ctx.globalAlpha=.39*night;ctx.fillStyle="#eac580";ctx.fillRect(155.18,17.06,.16,7.27);ctx.restore();}
      mapPrints(ctx,opt.motoPrints||opt.motos?.prints);
    }
    ctx.restore();
    if(street)return;
    const min=ctx.canvas?Math.min(ctx.canvas.width,ctx.canvas.height):192,ui=Math.max(.72,Math.min(1.64,min/(atlas?370:165)));
    ctx.save();ctx.translate(px(site.counter.x),py(site.counter.z));pin(ctx,atlas,ui);ctx.restore();
  }
  window.BayCoastCamera={site,frames,blocks,cameraBlocks,floor,occludesActor,install,world,prints,map};
})();
