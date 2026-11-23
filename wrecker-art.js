/* Portside's short-wheelbase service truck. All dimensions, including the wheel cradles, are in metres. */
(() => {
  "use strict";
  const shape={
    paint:"#347d74",track:1.04,wheel:.395,axles:[-1.61,1.72],
    sections:[[-2.73,.94,.97],[-2.48,1.012,1.02],[-1.38,1.02,1.09],[-.39,1.005,1.24],
      [-.14,.979,1.13],[1.40,.990,1.14],[1.78,1.020,1.18],[2.53,1.007,1.145],[2.82,.935,1.115]],
    glass:[-.14,-.045,.915,1.40,1.13,1.96,.949,.855]
  };
  function fit(s){
    Object.assign(s,{divider:.055,back:-.055,hingeZ:1.40,hingeX:.973,handleZ:.110,handleY:1.025,
      handleX:.994,grabX:.814,grabY:.971,grabZ:.301,seatX:.450,seatY:.805,seatZ:.211,floorY:.395,halfLength:2.82});
  }
  const sea=shape.paint,ivory="#e6d9b5",cream="#f0e5c7",gold="#d5a452",orange="#ba693f";
  const ink="#283d3f",shadow="#354447",steel="#617171",chrome="#abada0",rust="#976c4c",rubber="#293031";
  const amber="#edaa43",red="#a53a47",lamp="#ffefbd";
  const clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t;
  const blend=(a,b,t)=>{
    const start=parseInt(a.slice(1),16),end=parseInt(b.slice(1),16);
    const ch=s=>Math.round(mix((start>>s)&255,(end>>s)&255,t));
    return "#"+((ch(16)<<16)|(ch(8)<<8)|ch(0)).toString(16).padStart(6,"0");
  };
  const glyphs={
    A:["04 10 20 34","03 33"],B:["04 00 20 31 22 02","22 33 24 04"],C:["30 10 01 03 14 34"],
    D:["04 00 20 31 33 24 04"],E:["30 00 04 34","02 22"],I:["00 20","10 14","04 24"],
    L:["00 04 34"],N:["04 00 34 30"],O:["10 20 31 33 24 14 03 01 10"],P:["04 00 20 31 22 02"],
    R:["04 00 20 31 22 02","12 34"],S:["30 10 01 12 22 33 24 04"],T:["00 30","10 14"],
    U:["00 03 14 24 33 30"],"0":["10 20 31 33 24 14 03 01 10"],"2":["00 20 31 04 34"],
    "3":["00 20 31 22 12","22 33 24 04"],"8":["10 20 31 22 12 01 10","12 03 14 24 33 22"]
  };
  const inkPaths={};
  for(const [letter,strokes] of Object.entries(glyphs)){
    inkPaths[letter]=strokes.map(stroke=>stroke.split(" ").map(p=>[Number(p[0])/3,1-Number(p[1])/4]));
  }
  function stripe(g,plane,u,v,x,y,width,color){
    const f=width*.5/(Math.hypot(x-u,y-v)||1),dx=-(y-v)*f,dy=(x-u)*f;
    g.quad(plane(u+dx,v+dy),plane(x+dx,y+dy),plane(x-dx,y-dy),plane(u-dx,v-dy),color);
  }
  function panel(g,plane,l,b,r,t,color){g.quad(plane(l,b),plane(r,b),plane(r,t),plane(l,t),color);}
  function script(g,plane,word,center,y,h,color){
    const advance=h*.77,stroke=h*.105,start=center-(word.length*advance-h*.15)*.5;
    for(let i=0;i<word.length;i++)for(const points of inkPaths[word[i]]||[]){
      for(let j=1;j<points.length;j++){
        const a=points[j-1],b=points[j],origin=start+i*advance;
        stripe(g,plane,origin+(a[0]*.61+a[1]*.075)*h,y+a[1]*h,origin+(b[0]*.61+b[1]*.075)*h,y+b[1]*h,stroke,color);
      }
    }
  }
  const rearFace=z=>(x,y)=>[x,y,z],noseFace=z=>(x,y)=>[-x,y,z];
  const sideFace=(side,x,z=0)=>(u,y)=>[side*x,y,z+u*side];
  function stripSection(s,z){
    const a=s.sections;let i=1;while(i<a.length-1&&z>a[i][0])i++;
    const p=a[i-1],q=a[i],f=(z-p[0])/(q[0]-p[0]);
    return [mix(p[1],q[1],f),mix(p[2],q[2],f)];
  }
  function wheelArch(z){
    const d=Math.min(Math.abs(z-shape.axles[0]),Math.abs(z-shape.axles[1])),r=.478;
    return d<r?.394+Math.sqrt(r*r-d*d):.393;
  }
  function rails(g,paint){
    for(const side of [-1,1]){
      g.box(side*.515,.483,-.10,.125,.197,5.05,shadow);
      g.box(side*.525,.560,-.13,.156,.028,5.08,steel);
      g.box(side*.815,.385,.45,.42,.096,1.57,shadow);
      g.box(side*.970,.42,.46,.19,.034,1.565,chrome);
      for(let i=0;i<8;i++)g.box(side*.982,.441,-.18+i*.17,.112,.011,.029,"#7c8680",.085);
      g.box(side*.98,.345,-2.12,.282,.447,.052,rubber);
      g.box(side*.98,.168,-2.152,.265,.026,.029,"#a4a99a");
      g.box(side*.96,.305,1.18,.25,.27,.035,rubber);
    }
    for(const z of [-2.43,-.76,.09,2.23])g.box(0,.49,z,1.15,.163,.11,shadow);
    g.box(0,.425,1.54,.78,.255,.80,"#425056");
    g.pole([.51,.38,.55],[.48,.355,-1.98],.055,steel,7);
    g.pole([.48,.355,-1.98],[.76,.376,-2.35],.059,steel,7);
    g.box(0,.71,-1.35,1.42,.084,2.70,"#586765");
    for(const x of [-.63,-.47,-.31,.31,.47,.63])g.box(x,.758,-1.38,.029,.019,2.57,"#879087");
    g.box(0,.67,-2.56,.79,.163,.237,paint);
  }
  function sides(g,s,paint,doors){
    const lower=blend(paint,"#334346",.28),edge=blend(paint,"#eee0b8",.21);
    let cuts=s.sections.map(section=>section[0]).concat([s.back,s.hingeZ,-.14]);
    for(const axle of s.axles){
      for(let i=0;i<=12;i++)cuts.push(axle+.478*Math.cos(i*Math.PI/12));
    }
    cuts=[...new Set(cuts)].sort((a,b)=>a-b);
    for(const side of [-1,1]){
      for(let i=1;i<cuts.length;i++){
        const a=cuts[i-1],b=cuts[i],mid=(a+b)*.5,door=mid>s.back&&mid<s.hingeZ;
        const target=door?doors[side]:g,[wa,ha]=stripSection(s,a),[wb,hb]=stripSection(s,b);
        const la=wheelArch(a),lb=wheelArch(b);
        const p=(z,w,y,offset=0)=>[side*(w+offset),y,z];
        const face=(al,bl,ah,bh,col,o=0)=>target.quad(p(a,wa,al,o),p(b,wb,bl,o),p(b,wb,bh,o),p(a,wa,ah,o),col);
        face(la,lb,la+.035,lb+.035,lower);
        face(la+.035,lb+.035,ha-.065,hb-.065,paint);
        face(ha-.065,hb-.065,ha-.022,hb-.022,edge);
        target.quad(p(a,wa,ha-.022),p(b,wb,hb-.022),p(b,wb-.035,hb),p(a,wa-.035,ha),edge);
        const inBed=mid<-.14,inner=inBed?.54:.928;
        target.quad(p(a,wa-.035,ha),p(b,wb-.035,hb),p(b,inner,hb),p(a,inner,ha),inBed?steel:ivory);
        if(inBed)target.quad(p(a,inner,ha),p(b,inner,hb),p(b,inner,.73),p(a,inner,.73),lower);
        if(la>.41||lb>.41){
          target.quad(p(a,wa,la,.009),p(b,wb,lb,.009),p(b,wb,lb+.050,.009),p(a,wa,la+.050,.009),chrome);
          target.quad(p(a,wa,la),p(b,wb,lb),p(b,wb-.18,lb),p(a,wa-.18,la),rubber);
        }
      }
      const door=doors[side],face=sideFace(side,.995,.61);
      door.quad([side*.995,.65,-.045],[side*.995,.66,1.24],[side*.995,1.09,s.hingeZ],[side*.995,1.09,-.045],ivory);
      const sign=sideFace(side,1.002,.63);
      script(door,sign,"PORTSIDE",0,.859,.148,"#295654");
      script(door,sign,"TIRE",0,.747,.078,"#9e6044");
      stripe(door,sign,-.46,.785,-.155,.795,.014,gold);stripe(door,sign,.158,.795,.45,.805,.014,gold);
      stripe(door,face,-.60,.686,.60,.699,.012,orange);
      door.box(side*.994,s.handleY,s.handleZ,.050,.040,.177,chrome);
      door.box(side*1.014,s.handleY+.005,s.handleZ,.020,.018,.142,steel);
      door.box(side*.991,s.handleY-.058,s.handleZ-.036,.024,.023,.022,ink);
      g.box(side*.789,.561,-2.72,.423,.127,.086,shadow);
    }
  }
  function tire(g,side,s,centerX,centerY,centerZ){
    const r=s.wheel,outer=centerX+side*.100,inner=centerX-side*.100;
    const p=(x,rad,a)=>[x,centerY+Math.sin(a)*rad,centerZ+Math.cos(a)*rad];
    function ring(x1,r1,x2,r2,colors,count=16){
      for(let i=0;i<count;i++){
        const a=i*2*Math.PI/count,b=(i+1)*2*Math.PI/count;
        g.quad(p(x1,r1,a),p(x1,r1,b),p(x2,r2,b),p(x2,r2,a),colors[i%colors.length]);
      }
    }
    ring(inner,r*.92,inner+side*.025,r,["#303733"]);
    ring(inner+side*.025,r,outer-side*.026,r,["#333b39",rubber,rubber,rubber]);
    ring(outer-side*.026,r,outer,r*.915,["#38403d"]);
    ring(outer,r*.915,outer,r*.631,["#323a38"]);
    ring(outer,r*.703,outer+side*.004,r*.681,["#53594d"]);
    ring(outer,r*.626,outer+side*.018,r*.569,[chrome]);
    ring(outer+side*.018,r*.569,outer+side*.028,r*.308,["#858e82",chrome,"#737e74","#aab09b"]);
    ring(outer+side*.028,r*.308,outer+side*.042,r*.197,[ivory]);
    for(let i=0;i<8;i++){
      const a=i*Math.PI/4,n=(i+1)*Math.PI/4;
      g.tri([outer+side*.047,centerY,centerZ],p(outer+side*.042,r*.20,a),p(outer+side*.042,r*.20,n),steel);
      const lug=p(outer+side*.037,r*.32,a+.16);
      g.box(...lug,.014,.025,.025,"#495753");
    }
  }
  function bonnet(g,s,paint){
    const sections=[[1.397,.927,1.146],[1.64,.944,1.198],[2.29,.921,1.175],[2.64,.87,1.148],[2.796,.804,1.10]];
    const hood=blend(paint,"#e2d5b4",.12),edge=blend(paint,"#aebba3",.33);
    for(let i=1;i<sections.length;i++){
      const [az,aw,ay]=sections[i-1],[bz,bw,by]=sections[i];
      for(const side of [-1,1]){
        const p=(z,w,y,u,h)=>[side*w*u,y+h,z];
        g.quad(p(az,aw,ay,0,.028),p(bz,bw,by,0,.028),p(bz,bw,by,.69,.025),p(az,aw,ay,.69,.025),hood);
        g.quad(p(az,aw,ay,.69,.025),p(bz,bw,by,.69,.025),p(bz,bw,by,.75,.009),p(az,aw,ay,.75,.009),edge);
        g.quad(p(az,aw,ay,.75,.009),p(bz,bw,by,.75,.009),p(bz,bw,by,1,0),p(az,aw,ay,1,0),paint);
      }
    }
    g.box(0,.855,2.748,1.874,.522,.108,paint);
    g.box(0,.812,2.807,1.798,.400,.044,chrome);
    g.box(0,.814,2.833,.877,.287,.028,ink);
    for(let i=0;i<6;i++)g.box(0,.700+i*.046,2.850,.881,.015,.016,"#87938a");
    for(const x of [-.321,0,.321])g.box(x,.814,2.858,.017,.260,.014,chrome);
    for(const side of [-1,1]){
      g.box(side*.692,.868,2.827,.425,.223,.046,shadow);
      for(const offset of [-.105,.105]){
        const x=side*(.687+offset);g.box(x,.877,2.846,.183,.160,.030,chrome);
        panel(g,noseFace(2.864),x-.079,.805,x+.079,.946,lamp);
        stripe(g,noseFace(2.865),x-.061,.902,x+.061,.902,.011,"#ddcfac");
      }
      g.box(side*.714,.689,2.849,.310,.064,.032,amber);
      g.pole([side*.929,.482,2.65],[side*.929,.608,2.67],.049,chrome,6);
    }
    g.box(0,.503,2.806,2.00,.141,.206,chrome);
    g.box(0,.505,2.91,1.98,.036,.02,"#53615f");
    const badge=noseFace(2.876);panel(g,badge,-.090,.820,.09,.875,ink);script(g,noseFace(2.879),"SOL",0,.829,.039,ivory);
    g.box(-.45,.457,2.913,.293,.103,.014,"#d4bc7f");script(g,noseFace(2.923),"083",.45,.426,.057,ink);
    for(const x of [-.47,-.38,-.29,.29,.38,.47])g.box(x,1.169,1.439,.038,.012,.060,shadow);
  }
  function cabin(g,s,doors,windshield){
    const [back,roofBack,roofFront,nose,sill,roof,baseW,roofW]=s.glass;
    const at=(side,u,v,offset=0)=>[side*(mix(baseW,roofW,v)+offset),mix(sill,roof,v),mix(mix(back,nose,u),mix(roofBack,roofFront,u),v)];
    const end=(which,u,v,d=0)=>[u*mix(baseW,roofW,v),mix(sill,roof,v),at(1,which,v)[2]+(which?d:-d)];
    function endPanel(mesh,which,u0,u1,y0,y1,col,d=0){
      mesh.quad(end(which,u0,y0,d),end(which,u1,y0,d),end(which,u1,y1,d),end(which,u0,y1,d),col);
    }
    // Both front windows are rolled down. Quarterlights, door panels and mirrors travel with their hinges.
    for(const side of [-1,1]){
      const door=doors[side];
      const pane=(mesh,u0,u1,v0,v1,col,push=0)=>mesh.quad(at(side,u0,v0,push),at(side,u1,v0,push),at(side,u1,v1,push),at(side,u0,v1,push),col);
      pane(g,0,.069,0,1,ivory);pane(door,.071,.996,0,.064,cream);
      pane(door,.071,.102,.063,1,ivory);pane(door,.071,.996,.938,1,cream);
      pane(door,.944,1,.063,.939,ivory);pane(door,.102,.943,.065,.125,"#60828a");
      pane(door,.102,.943,.119,.134,"#9fb2a2",.002);
      pane(door,.713,.944,.129,.931,"#587e89");
      pane(door,.713,.734,.127,.947,chrome,.003);pane(door,.734,.944,.896,.934,"#92a9a3",.003);
      door.box(side*.920,.770,.672,.09,.672,1.44,"#526b61");
      door.box(side*.869,.932,.648,.056,.086,.804,"#a6a88c");
      door.box(side*s.grabX,s.grabY,s.grabZ,.041,.036,.151,"#737970");
      door.box(side*.869,.781,.878,.058,.029,.107,chrome);
      door.pole([side*.895,1.10,1.18],[side*1.196,1.44,1.12],.019,chrome,6);
      door.pole([side*.979,.898,1.052],[side*1.196,1.34,1.100],.019,chrome,6);
      door.box(side*1.193,1.425,1.122,.049,.259,.116,shadow,-side*.16);
      door.quad([side*1.213,1.543,1.153],[side*1.211,1.323,1.153],[side*1.211,1.323,1.074],[side*1.213,1.543,1.074],"#9ead9e");
      g.box(side*.921,1.939,.436,.089,.048,1.092,cream);
    }
    const pane=windshield||g;
    for(const which of [0,1]){
      if(!which){endPanel(g,0,-1,1,0,1,ivory);endPanel(g,0,-.816,.816,.165,.872,ink,.009);}
      else{
        endPanel(g,1,-1,-.939,0,1,ivory);endPanel(g,1,.939,1,0,1,ivory);
        endPanel(g,1,-.940,.940,0,.073,ivory);endPanel(g,1,-.940,.940,.935,1,ivory);
      }
    }
    endPanel(g,0,-.785,.785,.19,.842,"#415c67",.015);endPanel(g,0,-.765,.765,.77,.831,"#78908e",.017);
    for(const x of [-.263,.263])endPanel(g,0,x-.009,x+.009,.193,.842,chrome,.020);
    endPanel(pane,1,-.94,.94,.071,.936,"#354c53",.002);
    endPanel(pane,1,-.914,.914,.092,.909,"#71999f",.006);
    endPanel(pane,1,-.914,.914,.094,.250,"#456772",.009);
    endPanel(pane,1,-.908,.908,.84,.902,"#95aaa1",.009);
    for(const x of [-.50,.41]){
      const a=end(1,x,.092,.012),b=end(1,x+.179,.221,.012),c=end(1,x+.51,.25,.012);
      g.pole(a,b,.012,"#3f4d4c",4);g.pole(b,c,.012,"#3f4d4c",4);
    }
    g.box(0,1.961,.436,1.827,.068,1.121,ivory);
    g.box(0,1.993,.432,1.693,.033,.934,cream);
    g.box(0,1.921,.998,1.810,.052,.133,ivory);
    for(const x of [-.617,-.279,0,.279,.617])g.box(x,1.964,1.046,.086,.047,.043,amber);
    g.box(0,.823,-.142,1.86,.62,.083,"#758c77");
    g.box(0,.864,-.179,1.82,.52,.045,ivory);
    g.box(0,2.022,.071,1.787,.066,.194,ink);
    g.box(0,2.069,.07,1.667,.032,.171,chrome);
    for(const side of [-1,1]){
      g.cyl(side*.667,2.098,.067,.107,.122,.043,12,shadow);
      g.cyl(side*.667,2.162,.067,.105,.109,.104,12,"#d78c37");
      g.cyl(side*.667,2.227,.067,.058,.104,.027,12,amber);
      g.box(side*.826,2.055,.095,.08,.034,.116,orange);
    }
    // Spare issue card clipped above the driver's visor and a cream insulated jug behind the seat.
    g.box(-.440,1.870,.851,.45,.065,.054,"#c1b699");
    g.box(-.386,1.863,.822,.141,.047,.010,"#e4d39f");
    g.cyl(.65,.81,-.034,.092,.096,.289,10,"#bd6746");
    g.cyl(.65,.972,-.034,.081,.093,.037,10,cream);
  }
  function lockers(g,s,paint){
    for(const side of [-1,1]){
      const door=sideFace(side,1.025,-.70);
      panel(g,door,-.285,.463,.286,1.044,"#3e5a53");
      panel(g,sideFace(side,1.029,-.70),-.271,.481,.272,1.027,blend(paint,ivory,.10));
      for(const z of [-.893,-.515])g.box(side*1.037,.499,z,.025,.025,.093,chrome);
      g.box(side*1.044,.973,-.696,.028,.045,.143,chrome);
      g.box(side*1.060,.972,-.697,.010,.025,.086,shadow);
      for(const [z,y] of [[-.839,.568],[-.569,.538],[-.718,.587],[-.82,.754],[-.502,.964],[-2.30,.791]]){
        const f=sideFace(side,1.043,z);
        stripe(g,f,-.04,y,.045,y+.014,.008,rust);
      }
      const stern=sideFace(side,1.016,-2.39);
      panel(g,stern,-.163,.654,.145,.892,blend(paint,"#525e4c",.20));
      script(g,sideFace(side,1.023,-2.39),"08",0,.699,.135,cream);
      for(const z of [-2.58,-2.40,-.88,-.46])g.box(side*.79,stripSection(s,z)[1]+.020,z,.345,.023,.018,chrome,.095*side);
      g.box(side*.974,.608,-2.576,.037,.056,.13,amber);
      g.box(side*1.008,.845,2.428,.026,.049,.174,amber);
      const stepZ=side<0?-2.46:-.416;
      g.pole([side*.992,.848,stepZ-.085],[side*1.096,.815,stepZ-.085],.016,chrome,5);
      g.pole([side*1.096,.815,stepZ-.085],[side*1.096,.815,stepZ+.085],.018,chrome,5);
      g.pole([side*1.096,.815,stepZ+.085],[side*.992,.848,stepZ+.085],.016,chrome,5);
      const sp=sideFace(side,1.029,-.57);
      stripe(g,sp,-.36,1.093,.375,1.180,.016,gold);
      g.box(side*.771,.808,-2.698,.427,.391,.065,paint);
      g.box(side*.762,.792,-2.742,.363,.204,.036,ink);
      g.box(side*.814,.803,-2.765,.177,.112,.020,red);
      panel(g,rearFace(-2.777),side*.814-.081,.754,side*.814+.081,.851,red);
      g.box(side*.656,.804,-2.765,.086,.110,.021,"#ddba80");
      g.box(side*.818,.699,-2.761,.162,.022,.016,orange);
      g.box(side*.74,.591,-2.73,.448,.063,.135,chrome);
      g.box(side*.48,.828,-2.609,.113,.274,.147,"#5e6860");
    }
    const bars=rearFace(-2.746);
    panel(g,bars,-.511,.683,.511,.779,"#d5a464");
    for(let i=0;i<7;i++){
      const x=-.51+i*.148;
      g.quad(bars(x,.683),bars(x+.060,.683),bars(x+.128,.779),bars(x+.068,.779),"#555a51");
    }
    g.box(-.662,.493,-2.721,.289,.101,.030,"#ddcd98");
    script(g,rearFace(-2.740),"083",-.662,.458,.063,ink);
    // Four individually colour-marked hydraulic levers on the curb side.
    for(let i=0;i<4;i++){
      const z=-2.40+i*.10;
      g.pole([.697,1.007,z],[.744,1.169,z+.034],.014,"#515f5a",5);
      g.box(.749,1.175,z+.035,.069,.042,.047,[gold,orange,sea,cream][i]);
    }
  }
  function boom(g,paint){
    const crane=blend(paint,ivory,.21),flare=blend(paint,ivory,.37);
    g.box(0,1.056,-.53,.92,.13,.53,ink);
    g.box(0,1.136,-.53,.878,.071,.493,crane);
    for(const side of [-1,1]){
      const x=side*.37,head=side*.202;
      g.pole([x,1.16,-.39],[x,2.071,-.58],.071,crane,5);
      g.pole([x,1.16,-.76],[x,2.071,-.58],.059,flare,5);
      g.pole([x,1.18,-.59],[head,2.059,-2.46],.115,crane,4);
      g.pole([x,1.248,-.65],[head,2.125,-2.453],.028,gold,5);
      g.pole([x,2.068,-.57],[head,2.137,-2.49],.016,"#404f50",5);
      g.pole([x,2.018,-.57],[head,2.085,-2.49],.012,chrome,5);
      g.pole([x*.59,1.21,-.90],[head,1.715,-1.84],.060,steel,6);
      g.pole([head,1.674,-1.78],[head,1.91,-2.18],.034,chrome,7);
      g.box(head,2.065,-2.467,.128,.214,.272,crane);
      const hookX=side*.201;
      const cable=[[hookX,2.032,-2.555],[hookX,1.713,-2.548],[hookX+.035*side,1.590,-2.545]];
      for(let i=1;i<cable.length;i++)g.pole(cable[i-1],cable[i],.015,"#374c4b",5);
      g.box(hookX,1.746,-2.550,.068,.106,.074,gold);
      g.pole([hookX+.035*side,1.596,-2.545],[hookX+.085*side,1.606,-2.51],.026,steel,5);
      g.pole([hookX+.084*side,1.604,-2.512],[hookX+.086*side,1.653,-2.50],.020,steel,5);
    }
    g.box(0,2.025,-.573,.835,.134,.161,crane);
    g.pole([-.40,1.321,-.773],[.40,1.321,-.773],.115,steel,12);
    for(let i=0;i<13;i++){
      const x=-.288+i*.048;
      g.pole([x,1.321,-.773],[x+.022,1.321,-.773],.130,i%3?"#7e8372":"#888d78",10);
    }
    for(const side of [-1,1])g.pole([side*.307,1.321,-.773],[side*.359,1.321,-.773],.154,crane,12);
    g.pole([-.317,2.076,-2.465],[.317,2.076,-2.465],.073,shadow,8);
    g.box(0,.585,-2.298,.472,.352,.39,"#465854");
    for(const side of [-1,1])g.box(side*.224,.587,-2.302,.061,.321,.353,crane);
  }
  function centerMesh(mesh,x,y,z){
    const vertices=mesh.vertices;
    for(let i=0;i<vertices.length;i+=6){vertices[i]-=x;vertices[i+1]-=y;vertices[i+2]-=z;}
  }
  function build(g,s,paint,parts,interior){
    const doors=parts?parts.doors:{[-1]:g,1:g},color=paint||s.paint;
    rails(g,color);sides(g,s,color,doors);bonnet(g,s,color);cabin(g,s,doors,parts?.windshield);lockers(g,s,color);boom(g,color);
    if(interior)interior(g,s);
    for(const side of [-1,1]){
      if(parts){
        tire(parts.wheels[side],side,s,0,0,0);
        centerMesh(doors[side],side*s.hingeX,0,s.hingeZ);
        parts.brakes.box(side*.814,.803,-2.779,.169,.107,.014,"#ff5345");
        parts.reverse.box(side*.656,.805,-2.782,.076,.101,.014,"#fffbd6");
      }else for(const z of s.axles)tire(g,side,s,side*(s.track-.085),s.wheel,z);
    }
  }
  const stowed=Object.freeze({extension:0,lift:1,latch:0,angle:0});
  function jaw(rig=stowed){
    return {x:0,y:.025+.68*clamp(rig?.lift??1),z:-2.96-1.22*clamp(rig?.extension??0)};
  }
  function armTube(g,wide,high,front,back,outer,inside){
    const mid=(front+back)*.5;
    g.box(0,0,mid,wide,high,front-back,outer);
    g.box(0,high*.5+.002,mid,wide*.7,.005,(front-back)*.72,inside);
    g.box(0,0,back+.025,wide+.035,high+.024,.063,inside);
  }
  function install(model){
    model("wrecker-stinger",g=>{
      armTube(g,.293,.209,.105,-.713,"#42625b","#99a38f");
      g.box(0,0,-.686,.328,.242,.063,"#576b61");
      g.pole([-.279,0,0],[.279,0,0],.077,steel,8);
      g.pole([-.296,0,0],[-.278,0,0],.047,gold,8);g.pole([.278,0,0],[.296,0,0],.047,gold,8);
    });
    model("wrecker-slide",g=>armTube(g,.208,.139,.512,-.477,"#90998b","#596e63"));
    model("wrecker-plunger",g=>armTube(g,.137,.091,.847,-.035,"#6e7a70",chrome));
    model("wrecker-crosshead",g=>{
      g.box(0,.119,.208,1.852,.105,.098,steel);
      g.box(0,.117,.215,.36,.115,.28,"#4c645c");
      g.box(0,.070,.157,.35,.052,.37,"#61776b");
      g.cyl(0,.137,0,.094,.097,.080,8,chrome);
      for(const side of [-1,1])for(let i=0;i<4;i++)g.box(side*(.39+i*.11),.177,.217,.047,.010,.078,gold,.10*side);
    });
    for(const side of [-1,1]){
      model("wrecker-pocket"+side,g=>{
        g.box(0,.114,.19,.30,.103,.083,"#5b6c63");
        g.box(side*.146,.096,-.016,.086,.084,.592,steel);
        g.box(0,.128,.239,.372,.069,.101,"#c39750");
        g.box(0,.126,.222,.304,.084,.046,"#ad884b");
        g.box(side*.148,.107,-.247,.101,.101,.104,"#636d5e");
        g.cyl(side*.147,.173,-.249,.041,.045,.042,8,chrome);
        g.box(side*.165,.094,-.088,.062,.026,.156,gold);
      });
      model("wrecker-finger"+side,g=>{
        g.box(-side*.164,.084,0,.331,.073,.088,"#c29b55");
        g.box(-side*.322,.103,0,.051,.106,.089,gold);
        g.box(-side*.162,.124,0,.205,.011,.075,"#686c59");
      });
      for(const kind of ["coupe","cab","hatch","van","cruiser"]){
        const radius=bayCarLayout(kind).wheel;
        model("wrecker-strap/"+kind+"/"+side,g=>{
          const strap=(a,z,y)=>[a*side,y,z];
          const arc=[[.253,.13],[.88*radius,.32+radius*.60],[.58*radius,radius*1.84],[0,radius*2.04],
            [-.60*radius,radius*1.84],[-.90*radius,.32+radius*.59],[-.248,.119]];
          for(let i=1;i<arc.length;i++){
            const [az,ay]=arc[i-1],[bz,by]=arc[i];
            g.quad(strap(.025,az,ay),strap(.081,az,ay),strap(.081,bz,by),strap(.025,bz,by),"#c0763e");
          }
          g.box(side*.057,.386+radius*.53,-.80*radius,.073,.073,.014,chrome);
        });
      }
    }
    model("wrecker-reflector",g=>{
      const n=11;
      for(let i=0;i<n;i++){
        const a=-.99+i*1.98/n,b=-.99+(i+1)*1.98/n,p=(ang,y,r)=>[Math.sin(ang)*r,y,Math.cos(ang)*r];
        g.quad(p(a,-.038,.111),p(b,-.038,.111),p(b,.039,.111),p(a,.039,.111),i>2&&i<8?"#ffcf72":"#f2ab48");
      }
    });
  }
  function pointOnBody(v,x,y,z,ground){
    const p=v.pitch||0,r=v.lean||0,cp=Math.cos(p),sp=Math.sin(p),cr=Math.cos(r),sr=Math.sin(r);
    const py=y*cp-z*sp,pz=y*sp+z*cp,rx=x*cr-py*sr,cs=Math.cos(v.yaw),sn=Math.sin(v.yaw);
    return {x:v.x+rx*cs+pz*sn,y:ground+x*sr+py*cr,z:v.z-rx*sn+pz*cs};
  }
  function barPoint(root,x,z,yaw){
    const c=Math.cos(yaw),s=Math.sin(yaw);return {x:root.x+x*c+z*s,y:root.y,z:root.z-x*s+z*c};
  }
  function running(v,rig){return !!(v.beacons||rig?.target||rig?.extension>.025||Math.abs(v.speed||0)>.4);}
  function world(list,v,rig,t,ground){
    const settings=rig||stowed,local=jaw(settings),mount=pointOnBody(v,0,.557,-2.307,ground);
    const tip=pointOnBody(v,0,local.y+.115,local.z,ground),bar=pointOnBody(v,0,local.y,local.z,ground);
    const yaw=Math.atan2(mount.x-tip.x,mount.z-tip.z),pitch=Math.atan2(tip.y-mount.y,Math.hypot(tip.x-mount.x,tip.z-mount.z)),roll=v.lean||0;
    const add=(key,p,yaw,pitch=0,roll=0,glow=0)=>list.push([key,p.x,p.y,p.z,yaw,pitch,roll,glow]);
    add("wrecker-stinger",mount,yaw,pitch,roll);
    add("wrecker-slide",{x:mix(mount.x,tip.x,.54),y:mix(mount.y,tip.y,.54),z:mix(mount.z,tip.z,.54)},yaw,pitch,roll);
    add("wrecker-plunger",tip,yaw,pitch,roll);
    const barYaw=v.yaw+(settings.angle||0),caught=settings.target;
    const tracks=caught?bayCarLayout(caught.kind).track-.085:.875,latch=clamp(settings.latch||0);
    add("wrecker-crosshead",bar,barYaw);
    for(const side of [-1,1]){
      const pocket=barPoint(bar,side*tracks,0,barYaw),pin=barPoint(pocket,side*.147,-.249,barYaw);
      add("wrecker-pocket"+side,pocket,barYaw);
      add("wrecker-finger"+side,pin,barYaw+side*(1-latch)*1.54);
      if(caught&&latch>.88&&caught.kind!=="wrecker")add("wrecker-strap/"+caught.kind+"/"+side,pocket,barYaw);
      if(running(v,settings)){
        const cap=pointOnBody(v,side*.667,2.163,.067,ground);
        add("wrecker-reflector",cap,v.yaw+(t||0)*5.17+side*1.05,v.pitch||0,roll,.72);
      }
    }
  }
  function mapTruck(c,v,x,y,scale,t,rig=v.towRig){
    const r=rig||stowed,s=shape,color=v.color||s.paint,j=jaw(r),latch=clamp(r.latch||0);
    const d=v.damage,nose=d?.front||0,tail=d?.rear||0;
    c.save();c.translate(x,y);c.rotate(v.yaw||0);c.scale(scale,-scale);
    function poly(coords,fill,outline=null,line=.04){
      c.beginPath();c.moveTo(...coords[0]);for(let i=1;i<coords.length;i++)c.lineTo(...coords[i]);c.closePath();
      c.fillStyle=fill;c.fill();if(outline){c.strokeStyle=outline;c.lineWidth=line;c.stroke();}
    }
    const rect=(x0,z0,w,d,col)=>{c.fillStyle=col;c.fillRect(x0,z0,w,d);};
    const stroke=(coords,col,width)=>{c.beginPath();c.moveTo(...coords[0]);for(let i=1;i<coords.length;i++)c.lineTo(...coords[i]);c.lineWidth=width;c.strokeStyle=col;c.stroke();};
    function disc(x,z,rad,col){c.beginPath();c.arc(x,z,rad,0,Math.PI*2);c.fillStyle=col;c.fill();}
    const track=r.target?bayCarLayout(r.target.kind).track-.085:.875;
    const shade=.12+j.y*.22;
    c.save();c.translate(shade,-shade);stroke([[0,-2.3],[0,j.z]],"#62665c",.21);
    c.translate(0,j.z);c.rotate(-(r.angle||0));rect(-track-.13,.12,2*track+.26,.13,"#62665c");c.restore();
    stroke([[0,-2.30],[0,j.z+.03]],chrome,.133);
    stroke([[0,-2.30],[0,mix(-2.30,j.z,.60)]],"#546b62",.245);
    c.save();c.translate(0,j.z);c.rotate(-(r.angle||0));
    rect(-track-.15,.138,track*2+.3,.125,steel);disc(0,0,.090,gold);
    for(const side of [-1,1]){
      rect(side*track-.179,.183,.361,.107,gold);
      rect(side*(track+.148)-.044,-.288,.088,.562,steel);
      c.save();c.translate(side*(track+.147),-.249);c.rotate(-side*(1-latch)*1.54);
      stroke([[0,0],[-side*.344,0]],gold,.082);c.restore();
      if(r.target&&latch>.88)stroke([[side*(track+.053),-.249],[side*(track+.053),.239]],orange,.051);
    }
    c.restore();
    poly([[-.82,2.85],[.94,2.84],[1.20,2.54],[1.22,-2.73],[1.04,-3.0],[-.81,-2.81],[-.95,-2.55]],"#65675e");
    for(const side of [-1,1])for(const axle of s.axles){
      c.save();c.translate(side*.955,axle);if(axle>0)c.rotate(-(v.steer||0));rect(-.106,-.392,.212,.784,rubber);c.restore();
    }
    poly([[-.94,-2.72+.30*tail],[.94,-2.72+.46*tail],[1.03,-2.44+.18*tail],[1.02,2.51-.24*nose],[.934,2.82-.48*nose],[-.934,2.82-.31*nose],[-1.02,2.51-.14*nose],[-1.02,-2.44]],color,shadow,.06);
    rect(-.535,-2.61,1.07,2.42,"#536561");rect(-.489,-2.49,.978,2.22,"#7c8273");
    for(const x of [-.36,-.15,.15,.36])stroke([[x,-2.42],[x,-.40]],"#969784",.027);
    for(const side of [-1,1]){
      const x=side*.780;
      poly([[x-.181,-2.55],[x+.18,-2.56],[x+.185,-.215],[x-.186,-.21]],color,ivory,.048);
      stroke([[side*.624,-.31],[side*.613,-2.39]],gold,.037);
      rect(x-.159,-2.707,.32,.073,v.brakes>.16||v.handbrake>.5?"#ff6551":red);
      if(v.reversing)rect(side*.586-.038,-2.723,.075,.073,cream);
    }
    rect(-.401,-.821,.802,.337,shadow);
    for(let i=0;i<8;i++)rect(-.315+i*.085,-.78,.037,.248,"#969889");
    for(const side of [-1,1]){
      stroke([[side*.369,-.47],[side*.201,-2.475]],ink,.233);
      stroke([[side*.369,-.47],[side*.201,-2.475]],color,.172);
      stroke([[side*.332,-.52],[side*.168,-2.46]],gold,.035);
      stroke([[side*.42,-.54],[side*.244,-2.49]],chrome,.022);
    }
    rect(-.32,-2.51,.64,.084,steel);
    poly([[-.964,-.162],[.964,-.162],[.968,1.404],[-.969,1.404]],ivory,ink,.037);
    poly([[-.912,1.404],[.912,1.404],[.840,.910],[-.844,.910]],"#607e85",ink,.042);
    stroke([[-.79,1.325],[.781,1.325]],"#a4b2a4",.050);
    rect(-.881,-.070,1.762,1.047,cream);rect(-.828,-.097,1.65,.074,"#57716c");
    rect(-.909,.017,1.818,.166,"#485752");rect(-.713,.065,1.425,.085,chrome);
    for(const side of [-1,1]){
      const lit=running(v,r)&&Math.cos((t||0)*5.17+side*1.05)>-.1;
      disc(side*.666,.084,.113,lit?"#ffca63":amber);
      disc(side*.666-.019,.113,.050,lit?"#ffeda5":"#e4a04a");
      rect(side*1.097-.052,1.04,.104,.212,chrome);
    }
    poly([[-.860,1.44],[.860,1.44],[.832,2.70-.48*nose],[-.833,2.70-.31*nose]],color);
    for(const side of [-1,1])stroke([[side*.65,1.48],[side*.602,2.66-(side===1?.46:.31)*nose]],blend(color,ivory,.47),.034);
    if(nose<.20)rect(-1.006,2.761,2.012,.119,chrome);
    else{
      stroke([[-1.006,2.81-.31*nose],[-.21,2.81-.46*nose],[.27,2.81-.30*nose],[1.006,2.81-.49*nose]],chrome,.11);
      stroke([[-.64,2.26],[-.25,2.14],[.01,2.24],[.32,2.09],[.62,2.18]],shadow,.049);
      if(nose>.5){stroke([[.51,1.34],[.30,1.25],[.21,1.31],[-.03,1.17],[-.24,1.16]],"#c5d7c8",.035);stroke([[.3,1.25],[.37,1.12],[.56,1.05]],"#c5d7c8",.030);}
      if(nose>.60){const age=(t*.66)%1;c.save();c.globalAlpha=.58*Math.sin(Math.PI*age);stroke([[.36+age*.24,2.13+age*.30],[.46+age*.24,2.20+age*.32],[.42+age*.24,2.28+age*.30]],"#edf0df",.08+age*.09);c.restore();}
    }
    for(const side of [-1,1])for(const n of [-.092,.092])rect(side*.682+n-.084,2.697-(side===1?.46:.31)*nose,.167,.081,nose>(side===1?.53:.89)?steel:lamp);
    for(const side of [-1,1])if((side<0?d?.left:d?.right)>.22)stroke([[side*.978,.81],[side*.917,.65],[side*.950,.35],[side*.905,.19]],chrome,.060);
    for(const side of [-1,1]){
      const open=Math.max(side===v.doorSide?v.doorAngle||0:0,side===1?v.passengerDoor||0:0);
      if(open<=.008)continue;
      c.save();c.translate(side*s.hingeX,s.hingeZ);c.rotate(side*open);
      rect(-.045,-(s.hingeZ-s.back),.09,s.hingeZ-s.back,ivory);
      rect(-.050,-1.37,.10,.16,color);stroke([[side*.012,-.21],[side*.230,-.31]],chrome,.045);rect(side*.226-.035,-.365,.07,.135,shadow);
      c.restore();
    }
    c.restore();
  }
  window.BayWreckerArt={shape,fit,build,install,world,mapTruck,jaw};
})();
