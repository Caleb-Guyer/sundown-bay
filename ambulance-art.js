/* Bay Rescue No. 4. Body, loading rails and door hinges are measured in metres. */
(() => {
  "use strict";
  const cream="#e9e1cd",warm="#f3ecd9",teal="#176663",deep="#224d50",coral="#c55142",gold="#d9ac64";
  const rubber="#30383a",seal="#435052",silver="#b8beb4",steel="#798b88",glass="#71959a";
  const wine="#8f3939",red="#ff6351",amber="#e4a34c",white="#fff1c6";
  // These two lens colours are the street renderer's ordinary night-running materials.
  const headlamp="#ffefbd",taillamp="#a53a47";
  const shape={
    paint:cream,track:.988,wheel:.382,axles:[-1.52,1.77],
    sections:[[-2.76,1.05,1.24],[-2.60,1.06,1.24],[-.19,1.06,1.24],[.04,.955,1.17],
      [1.60,.968,1.17],[1.93,.972,1.12],[2.51,.936,1.03],[2.81,.875,.94]],
    glass:[-.035,.045,1.10,1.63,1.17,2.015,.95,.834]
  };
  function fit(s){
    Object.assign(s,{divider:.05,back:.035,hingeZ:1.63,hingeX:.958,handleZ:.215,handleY:1.063,
      handleX:.974,grabX:.803,grabY:1.02,grabZ:.39,seatX:.46,seatY:.785,seatZ:.46,floorY:.39,halfLength:2.93});
  }
  const loading=Object.freeze({x:-.14,y:.735,z:-1.43,threshold:-2.76,apron:-4.11});
  const hingeX=.815,hingeZ=-2.76,hingeY=.72,maxRear=1.79;
  const clamp=n=>Math.max(0,Math.min(1,n||0));
  const glyph={
    B:["04 00 20 31 22 02","22 33 24 04"],A:["04 01 10 20 31 34","02 32"],
    Y:["00 12 22 30","22 24"],R:["04 00 20 31 22 02","12 34"],E:["30 00 04 34","02 22"],
    S:["30 10 01 12 22 33 24 04"],C:["30 10 01 03 14 34"],U:["00 03 14 24 33 30"],
    "0":["10 20 31 33 24 14 03 01 10"],"4":["23 03 02 20 24","03 33"]
  };
  function stroke(g,pt,ax,ay,bx,by,w,color){
    const dx=bx-ax,dy=by-ay,len=Math.hypot(dx,dy)||1,nx=-dy*w/(2*len),ny=dx*w/(2*len);
    g.quad(pt(ax+nx,ay+ny),pt(bx+nx,by+ny),pt(bx-nx,by-ny),pt(ax-nx,ay-ny),color);
  }
  function lettering(g,pt,word,height,color){
    const span=height*.185,advance=4.25*span,start=-(word.length*advance-1.25*span)/2;
    for(let i=0;i<word.length;i++){
      for(const path of glyph[word[i]]||[]){
        const verts=path.split(" ").map(n=>[start+i*advance+Number(n[0])*span,(2-Number(n[1]))*height*.25]);
        for(let j=1;j<verts.length;j++)stroke(g,pt,...verts[j-1],...verts[j],height*.112,color);
      }
    }
  }
  function panel(g,pt,poly,color){
    for(let i=1;i<poly.length-1;i++)g.tri(pt(...poly[0]),pt(...poly[i]),pt(...poly[i+1]),color);
  }
  function rect(g,pt,u,y,w,h,color){
    g.quad(pt(u-w/2,y-h/2),pt(u+w/2,y-h/2),pt(u+w/2,y+h/2),pt(u-w/2,y+h/2),color);
  }
  function cutout(g,pt,u,y,w,h,k,color){
    panel(g,pt,[[u-w/2+k,y-h/2],[u+w/2-k,y-h/2],[u+w/2,y-h/2+k],[u+w/2,y+h/2-k],
      [u+w/2-k,y+h/2],[u-w/2+k,y+h/2],[u-w/2,y+h/2-k],[u-w/2,y-h/2+k]],color);
  }
  function sideFace(side,x){return(z,y)=>[side*x,y,z];}
  function shift(g,x,y,z){
    const v=g.vertices;
    for(let i=0;i<v.length;i+=6){v[i]-=x;v[i+1]-=y;v[i+2]-=z;}
  }
  function cabStamp(g,side){
    const pt=(u,y)=>[side*.968, .862+y, .686+side*u];
    const disk=(radius,col)=>{
      for(let i=0;i<16;i++){
        const a=i*Math.PI/8,b=a+Math.PI/8;
        g.tri(pt(0,0),pt(Math.cos(a)*radius,Math.sin(a)*radius),pt(Math.cos(b)*radius,Math.sin(b)*radius),col);
      }
    };
    disk(.168,teal);
    const sign=(u,y)=>[side*.970,.862+y,.686+side*u];
    panel(g,sign,[[-.084,-.009],[-.073,.037],[-.04,.069],[0,.081],[.041,.069],[.074,.037],[.084,-.009]],gold);
    stroke(g,sign,-.134,-.024,-.035,-.024,.016,warm);stroke(g,sign,-.035,-.024,.046,-.048,.016,warm);
    stroke(g,sign,.046,-.048,.133,-.025,.016,warm);stroke(g,sign,-.091,-.078,-.008,-.076,.012,warm);
  }
  function tire(g,side,s,x,y,z){
    const spokes=16,r=s.wheel,outer=side*.118,pt=(dx,rr,a)=>[x+dx,y+Math.cos(a)*rr,z+Math.sin(a)*rr];
    for(let i=0;i<spokes;i++){
      const a=i*2*Math.PI/spokes,b=(i+1)*2*Math.PI/spokes;
      g.quad(pt(-.106,r,a),pt(.106,r,a),pt(.106,r,b),pt(-.106,r,b),i%2?"#394044":"#333b3d");
      for(const face of [-1,1]){
        g.quad(pt(face*.106,r,a),pt(face*.106,r,b),pt(face*.119,r*.80,b),pt(face*.119,r*.80,a),rubber);
        g.quad(pt(face*.119,r*.80,a),pt(face*.119,r*.80,b),pt(face*.124,r*.61,b),pt(face*.124,r*.61,a),"#343c3e");
      }
      g.tri([x+side*.125,y,z],pt(side*.125,r*.615,a),pt(side*.125,r*.615,b),silver);
      if(i%2===0){
        const m=(a+b)/2;
        g.quad(pt(side*.127,r*.52,a),pt(side*.127,r*.52,b),pt(side*.127,r*.39,b),pt(side*.127,r*.39,m),seal);
        g.tri([x+side*.143,y,z],pt(side*.143,r*.24,a),pt(side*.143,r*.24,b),steel);
      }else g.tri([x+side*.143,y,z],pt(side*.143,r*.24,a),pt(side*.143,r*.24,b),silver);
    }
    g.quad([x+outer*1.24,y+.047,z-.021],[x+outer*1.24,y+.018,z+.043],
      [x+outer*1.24,y-.047,z+.021],[x+outer*1.24,y-.018,z-.043],seal);
  }
  // A single side panel can follow an arch without a coplanar plate over the tyre.
  function skirt(g,side,x,top,run,color){
    const pt=sideFace(side,x);
    for(let i=1;i<run.length;i++){
      const [a,ay]=run[i-1],[b,by]=run[i];
      g.quad(pt(a,ay),pt(b,by),pt(b,top),pt(a,top),color);
      g.quad(pt(a,ay),pt(b,by),[side*(x-.08),by,b],[side*(x-.08),ay,a],seal,.82);
    }
  }
  function cabinet(g,color){
    const end=-2.755,front=-.14,mid=(end+front)/2,len=front-end;
    g.box(0,.648,mid,2.04,.144,len,steel);
    g.box(0,.702,mid,1.98,.036,len,"#798888");
    g.box(0,2.472,mid,2.12,.092,len,color);
    g.box(0,2.421,mid,1.93,.028,len,"#d7d7bd");
    g.box(0,1.539,front+.018,2.08,1.86,.085,color);
    g.box(0,1.52,front-.033,.67,.90,.021,"#54665f");
    g.box(0,1.69,front-.046,.43,.39,.024,"#77928d");
    g.box(0,2.534,mid,2.03,.037,len-.09,warm);
    g.box(0,.466,-2.847,1.93,.119,.165,seal);
    g.box(0,.538,-2.847,1.89,.025,.165,silver);
    for(const side of [-1,1]){
      const pt=sideFace(side,1.061);
      g.box(side*1.021,1.688,mid,.078,1.48,len,color);
      skirt(g,side,1.059,.960,[[-2.754,.49],[-2.10,.49],[-2.025,.655],[-1.86,.772],[-1.69,.818],
        [-1.36,.818],[-1.17,.756],[-1.02,.623],[-.967,.49],[-.144,.49]],color);
      g.box(side*1.023,2.433,mid,.084,.067,len+.015,silver);
      g.box(side*1.027,1.487,end+.028,.071,1.83,.055,silver);
      g.box(side*1.032,1.50,front-.021,.047,1.85,.036,silver);
      rect(g,pt,mid,1.501,len-.013,.245,teal);
      rect(g,pt,mid,1.655,len-.013,.033,gold);
      panel(g,pt,[[end+.014,1.286],[-1.085,1.286],[-.824,1.35],[front-.014,1.35],
        [front-.014,1.38],[-.84,1.38],[-1.096,1.324],[end+.014,1.324]],coral);
      lettering(g,(u,y)=>[side*1.064,1.977+y,-1.433+side*u],"BAY RESCUE",.258,teal);
      rect(g,pt,mid,1.748,.55,.018,gold);
      const rearSide=(x,y)=>[side*x,y,end-.015];
      rect(g,rearSide,.930,1.505,.234,1.84,color);
      rect(g,rearSide,.932,1.50,.226,.243,teal);
      rect(g,rearSide,.932,1.657,.226,.029,gold);
      g.box(side*.93,.994,end-.024,.134,.444,.044,seal);
      for(const [y,lens] of [[1.124,amber],[.997,taillamp],[.872,"#c8c9b2"]])
        rect(g,(u,h)=>[side*u,h,end-.051],.93,y,.104,.089,lens);
      g.box(side*.93,2.283,end-.02,.166,.215,.05,silver);
      rect(g,(u,y)=>[side*u,y,end-.049],.93,2.292,.127,.137,wine);
      g.box(side*.91,.588,end-.015,.164,.046,.041,coral);
      for(const [z,w] of [[-2.405,.533],[-1.522,1.03],[-.522,.60]]){
        const floor=z===-1.522?.862:.594;
        rect(g,pt,z,(floor+1.254)/2,w,1.254-floor,steel);
        rect(g,sideFace(side,1.064),z,(floor+1.254)/2,w-.034,1.225-floor,color);
        const handleZ=z+w*.32;
        cutout(g,sideFace(side,1.067),handleZ,1.115,.082,.042,.008,seal);
        rect(g,sideFace(side,1.069),handleZ,1.123,.051,.009,silver);
      }
      for(const z of [-2.514,-.421]){
        cutout(g,sideFace(side,1.067),z,2.289,.244,.119,.029,silver);
        cutout(g,sideFace(side,1.069),z,2.289,.193,.083,.023,wine);
      }
      rect(g,sideFace(side,1.069),mid,2.285,.221,.077,"#d8ca9c");
      rect(g,sideFace(side,1.069),-.285,.652,.104,.039,amber);
      rect(g,sideFace(side,1.069),-2.636,.652,.104,.039,coral);
    }
    // Stretcher runners: their upper surface is the load contact point.
    for(const x of [loading.x-.25,loading.x+.25]){
      g.box(x,.7275,-1.487,.055,.015,2.539,silver);
      g.box(x,.729,-1.485,.014,.009,2.52,seal);
    }
    for(const z of [-2.66,-2.36,-2.06,-1.76,-1.46,-1.16,-.86,-.56,-.26])
      for(const x of [-.70,.505])g.box(x,.723,z,.108,.005,.030,"#5e706c");
    for(const z of [-2.89,-2.832,-2.78])g.box(0,.554,z,1.72,.006,.013,"#6b7e7a");
    g.box(-.884,1.385,-1.50,.202,1.30,2.27,"#c3c9b7");
    for(const z of [-2.26,-1.52,-.78]){
      g.box(-.775,1.62,z,.018,.52,.652,"#637e78");
      g.box(-.763,1.62,z,.009,.46,.597,"#8da39a");
      g.box(-.756,1.447,z,.013,.024,.125,cream);
      g.box(-.775,1.035,z,.027,.248,.649,"#a3b2a4");
    }
    g.box(.788,.897,-1.47,.297,.339,1.99,"#c0c5ad");
    g.box(.779,1.091,-1.47,.347,.102,2.03,"#4c746c");
    g.box(.941,1.257,-1.47,.055,.294,2.00,"#63847a");
    for(const z of [-2.08,-1.47,-.86])g.box(.779,1.145,z,.342,.008,.038,"#374e4a");
    g.box(.68,2.282,-1.47,.037,.032,1.72,gold);
    for(const z of [-2.23,-.71])g.box(.68,2.355,z,.035,.135,.037,steel);
    for(const x of [-.49,.48])g.box(x,2.4,-1.429,.128,.015,1.27,"#eae0be");
    // An off-centre roof vent leaves room for the aerial-view fleet marking.
    g.box(.15,2.583,-.786,.762,.092,.710,"#bbbfb1");
    g.box(.15,2.641,-.786,.709,.029,.645,"#d6d6c5");
    for(let i=0;i<6;i++)g.box(.15,2.66,-1.009+i*.083,.484,.01,.023,steel);
    lettering(g,(u,y)=>[u,2.557,-1.963+y],"04",.604,teal);
    g.box(0,2.291,-2.751,1.652,.288,.075,color);
    g.box(0,2.344,-2.798,.405,.074,.029,"#cfceaf");
    g.box(0,2.197,-2.774,1.61,.036,.075,seal);
  }
  function frontDoor(g,s,side,color){
    const out=sideFace(side,.965),inside=sideFace(side,.902);
    const outline=[[.055,.459],[1.195,.459],[1.28,.642],[1.426,.763],[1.615,.818],
      [1.615,1.144],[1.555,1.175],[.058,1.175]];
    panel(g,out,outline,color);panel(g,inside,outline,"#a9b0a5");
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];g.quad(out(...a),out(...b),inside(...b),inside(...a),steel);
    }
    rect(g,out,.636,.597,1.10,.075,teal);
    rect(g,sideFace(side,.967),.636,.652,1.10,.014,gold);
    cabStamp(g,side);
    cutout(g,sideFace(side,.971),s.handleZ,s.handleY,.144,.064,.014,seal);
    rect(g,sideFace(side,.974),s.handleZ+.010,s.handleY+.009,.099,.019,silver);
    rect(g,inside,.712,.865,.71,.126,"#758981");
    g.box(side*.887,.915,.693,.038,.067,.359,seal);
    const lowerRear=[side*.953,1.19,.079],upperRear=[side*.84,1.979,.079],
      upperFront=[side*.84,1.976,1.093],lowerFront=[side*.94,1.195,1.594];
    // Openable framed side glass. Leave the winding window down so both seats are visible.
    g.pole(lowerRear,upperRear,.035,color,5);g.pole(upperRear,upperFront,.040,color,5);
    g.pole(upperFront,lowerFront,.039,color,5);g.pole(lowerFront,lowerRear,.024,seal,5);
    const q=[side*.928,1.263,1.406],r=[side*.859,1.825,1.151];
    g.quad(q,[side*.937,1.238,1.535],[side*.861,1.835,1.163],r,glass);
    g.pole([side*.946,1.192,1.398],[side*.849,1.920,1.118],.014,seal,4);
    g.pole([side*.955,1.218,1.414],[side*1.108,1.325,1.447],.022,steel,5);
    g.box(side*1.119,1.353,1.447,.127,.174,.092,seal);
    g.box(side*1.119,1.353,1.395,.096,.136,.014,glass);
  }
  function cab(g,s,color,parts){
    g.box(0,.372,-.061,1.61,.109,4.398,rubber);
    g.box(0,.429,1.59,1.67,.102,1.934,steel);
    for(const side of [-1,1]){
      g.box(side*.861,.398,.611,.181,.078,1.492,rubber);
      g.box(side*.908,.447,.608,.108,.023,1.443,silver);
      g.box(side*.943,.871,-.024,.081,.808,.119,color);
      g.pole([side*.956,1.16,.012],[side*.849,2.011,.012],.042,color,5);
      g.pole([side*.946,1.18,1.65],[side*.842,2.013,1.113],.046,color,5);
      skirt(g,side,.969,1.13,[[1.627,.811],[1.756,.830],[1.948,.804],[2.114,.707],[2.248,.54],
        [2.31,.456],[2.548,.456],[2.691,.506]],color);
      const pt=sideFace(side,.971);
      rect(g,pt,2.439,.708,.327,.065,teal);rect(g,pt,2.439,.757,.327,.014,gold);
      cutout(g,sideFace(side,.974),2.517,1.042,.193,.070,.012,amber);
      const door=parts.doors[side];
      frontDoor(door,s,side,color);
      shift(door,side*s.hingeX,0,s.hingeZ);
    }
    g.box(0,1.995,.563,1.70,.092,1.19,color);
    g.box(0,2.048,.571,1.58,.031,1.07,warm);
    g.box(0,1.087,-.055,1.87,1.288,.122,color);
    g.box(0,1.754,-.062,1.684,.098,.097,steel);
    g.box(0,1.768,-.065,.70,.422,.063,seal);
    g.box(0,1.768,-.030,.596,.337,.019,glass);
    // Sloped bonnet tapers both in plan and elevation.
    const hood=[[1.630,.957,1.236],[1.879,.967,1.185],[2.465,.937,1.132],[2.713,.884,1.065]];
    for(let i=1;i<hood.length;i++){
      const [az,ax,ay]=hood[i-1],[bz,bx,by]=hood[i];
      g.quad([-ax,ay,az],[ax,ay,az],[bx,by,bz],[-bx,by,bz],color,1.04);
      for(const side of [-1,1]){
        g.quad([side*ax,ay,az],[side*bx,by,bz],[side*bx,1.006,bz],[side*ax,1.06,az],color,.89);
        g.quad([side*ax*.65,ay+.004,az],[side*ax*.678,ay+.004,az],[side*bx*.69,by+.004,bz],
          [side*bx*.672,by+.004,bz],warm);
      }
    }
    g.box(0,.822,2.643,1.80,.466,.147,color);
    g.box(0,.861,2.732,1.66,.277,.052,"#9ca69f");
    g.box(0,.865,2.769,.877,.214,.027,seal);
    for(let i=0;i<4;i++)g.box(0,.79+i*.05,2.787,.806,.018,.012,i%2?steel:silver);
    g.box(0,.869,2.8,.143,.054,.013,teal);
    for(const side of [-1,1]){
      g.box(side*.665,.887,2.768,.355,.200,.028,seal);
      for(const offset of [-.074,.074]){
        g.box(side*.665+offset,.896,2.788,.122,.127,.017,"#e9dfb8");
        rect(g,(u,y)=>[u,y,2.799],side*.665+offset,.896,.112,.111,headlamp);
      }
      g.box(side*.857,.856,2.754,.066,.153,.039,amber);
      g.box(side*.343,.667,2.780,.135,.062,.023,wine);
    }
    g.box(0,.548,2.721,1.84,.150,.179,silver);
    g.box(0,.567,2.801,1.724,.057,.018,rubber);
    g.box(0,.517,2.812,.310,.098,.014,"#dccb91");
    g.box(0,.518,2.823,.186,.017,.006,teal);
    // The separate pane also works with in-cab cameras. Its central view is clear.
    const pane=parts?.windshield||g;
    const wind=(u,t)=>[(.909-.104*t)*u,1.242+t*.716,1.622-.502*t];
    g.quad(wind(-1,0),wind(1,0),wind(1,.052),wind(-1,.052),seal);
    pane.quad(wind(-1,.81),wind(1,.81),wind(1,1),wind(-1,1),"#75949a",.94);
    for(const side of [-1,1])pane.quad(wind(side,0),wind(side*.938,0),wind(side*.86,.811),wind(side,.811),glass,.89);
    for(const x of [-.42,.42]){
      g.pole([x-.17,1.273,1.624],[x+.165,1.305,1.585],.012,seal,4);
      g.pole([x-.058,1.239,1.656],[x+.035,1.293,1.597],.011,seal,4);
    }
    g.box(0,1.897,1.102,.190,.075,.037,rubber);
    // Red corner pods sit above the cab, on the front face of the patient module.
    for(const side of [-1,1]){
      g.box(side*.784,2.30,-.095,.398,.206,.093,silver);
      g.box(side*.784,2.298,-.037,.326,.139,.047,wine);
      g.box(side*.555,2.301,-.037,.107,.116,.031,"#cfc3a2");
      g.box(side*.782,2.301,-.011,.220,.022,.007,"#b85247");
    }
    for(const x of [-.242,0,.242])g.box(x,2.429,-.081,.094,.045,.029,amber);
  }
  function barnDoor(g,side,color){
    // Door-local coordinates. The hinge stays put as the door swings aft.
    const f=(u,y,d=-.036)=>[-side*u,y,d],face=(u,y)=>f(u,y,-.043),outside=(u,y)=>f(u,y,-.048);
    g.box(-side*.403,.724,0,.805,1.445,.068,color);
    // An inner frame, a rubber window surround, obscure glass and two silk-screened privacy bars.
    cutout(g,face,.405,1.158,.559,.447,.066,seal);
    cutout(g,outside,.405,1.158,.508,.395,.057,glass);
    for(const y of [1.024,1.069])rect(g,(u,h)=>f(u,h,-.051),.406,y,.472,.018,"#9eaea5");
    const inner=(u,y)=>f(u,y,.043);
    cutout(g,inner,.405,1.158,.559,.447,.066,seal);
    cutout(g,(u,y)=>f(u,y,.047),.405,1.158,.506,.395,.057,"#8a9f97");
    rect(g,face,.402,.780,.803,.222,teal);
    rect(g,face,.402,.935,.803,.025,gold);
    // The stripe and side-identifying numeral sit below the windows.
    rect(g,outside,.402,.684,.803,.030,coral);
    for(let i=0;i<3;i++){
      const u=.061+i*.24;
      panel(g,outside,[[u,.194],[u+.141,.194],[u+.223,.323],[u+.079,.323]],i===1?gold:coral);
    }
    if(side===1){
      const tag=(u,y)=>[-side*.419+u,.507+y,-.052];lettering(g,tag,"04",.177,teal);
      g.box(-side*.730,.597,-.051,.049,.188,.034,seal);
      g.box(-side*.730,.608,-.071,.024,.122,.018,silver);
    }else{
      const pt=(u,y)=>f(u,y,-.053);
      cutout(g,pt,.43,.492,.265,.097,.011,"#d4c596");
      rect(g,(u,y)=>f(u,y,-.055),.43,.503,.147,.013,teal);
    }
    for(const y of [.241,1.252]){
      g.box(-side*.052,y,-.043,.095,.098,.041,silver);
      g.box(0,y,-.041,.039,.118,.057,steel);
    }
    g.box(-side*.400,.505,.059,.310,.047,.035,steel);
    g.box(-side*.771,.720,-.033,.027,1.43,.037,seal);
  }
  // The rear-view mirror and distant street draw one mesh, with fixed glazing and shallow wheel faces.
  function distant(g,s,color){
    const end=-2.755,mid=-1.45,front=-.145;
    g.box(0,1.684,mid,2.109,1.581,2.61,color);
    g.box(0,.685,mid,1.728,.42,2.583,seal);
    g.box(0,2.484,mid,2.114,.086,2.612,color);
    g.box(0,2.588,-.787,.752,.141,.710,"#c7c8b7");
    for(const z of [-.960,-.792,-.623])g.box(.011,2.665,z,.498,.008,.030,steel);
    lettering(g,(u,y)=>[u,2.530,-1.963+y],"04",.604,teal);
    g.box(0,.488,-2.845,1.925,.112,.170,silver);
    g.box(0,.786,1.296,1.58,.642,2.63,color);
    const hood=[[1.632,.950,1.231],[2.455,.935,1.131],[2.710,.888,1.063]];
    for(let i=1;i<hood.length;i++){
      const [a,ax,ay]=hood[i-1],[b,bx,by]=hood[i];
      g.quad([-ax,ay,a],[ax,ay,a],[bx,by,b],[-bx,by,b],color,1.04);
      for(const side of [-1,1])g.quad([side*ax,ay,a],[side*bx,by,b],[side*bx,.923,b],[side*ax,1.03,a],color,.90);
    }
    g.box(0,1.998,.551,1.70,.11,1.213,color);
    g.quad([-.95,1.201,1.641],[.95,1.201,1.641],[.845,1.981,1.092],[-.845,1.981,1.092],glass);
    g.quad([-.843,1.83,1.205],[.843,1.83,1.205],[.832,1.982,1.100],[-.832,1.982,1.100],"#68888e");
    g.box(0,.851,2.684,1.802,.413,.088,color);
    const face=(u,y)=>[u,y,2.733];
    rect(g,face,0,.863,.903,.201,seal);
    for(const y of [.805,.863,.924])rect(g,(u,h)=>[u,h,2.736],0,y,.833,.021,silver);
    g.box(0,.539,2.728,1.83,.143,.166,silver);
    rect(g,(u,h)=>[u,h,2.814],0,.558,1.746,.040,rubber);
    for(const side of [-1,1]){
      const wall=sideFace(side,1.061),nose=sideFace(side,.969);
      skirt(g,side,1.056,.958,[[end,.49],[-2.098,.49],[-1.964,.706],[-1.699,.813],[-1.363,.813],
        [-1.097,.712],[-.968,.49],[front,.49]],color);
      rect(g,wall,mid,1.501,2.601,.245,teal);rect(g,wall,mid,1.66,2.60,.033,gold);
      rect(g,wall,mid,1.317,2.6,.035,coral);
      lettering(g,(u,y)=>[side*1.064,1.978+y,-1.433+side*u],"BAY RESCUE",.258,teal);
      for(const z of [-2.516,-.421])rect(g,wall,z,2.289,.222,.09,wine);
      for(const z of [-2.147,-.926])rect(g,wall,z,.857,.012,.627,steel);
      skirt(g,side,.963,1.167,[[.023,.455],[1.203,.455],[1.337,.690],[1.606,.809],[1.771,.829],
        [1.967,.796],[2.111,.704],[2.296,.466],[2.66,.466]],color);
      rect(g,nose,.63,.597,1.117,.075,teal);rect(g,nose,.63,.651,1.117,.016,gold);
      const pane=[[side*.953,1.177,.023],[side*.95,1.177,1.632],[side*.84,1.983,1.099],[side*.842,1.983,.023]];
      g.quad(...pane,color);
      g.quad([side*.951,1.221,.092],[side*.951,1.221,1.548],[side*.854,1.938,1.065],[side*.854,1.938,.092],glass);
      rect(g,nose,.216,1.069,.125,.038,seal);
      g.box(side*1.101,1.35,1.447,.12,.146,.09,seal);
      const rf=(u,y)=>[side*u,y,-2.779];
      rect(g,rf,.930,1.514,.226,.238,teal);rect(g,rf,.930,1.656,.226,.030,gold);
      rect(g,rf,.930,2.289,.123,.140,wine);rect(g,rf,.93,.998,.115,.26,taillamp);
      rect(g,rf,.414,1.455,.790,1.453,silver);
      rect(g,(u,y)=>[side*u,y,-2.782],.414,1.455,.751,1.405,color);
      const back=(u,y)=>[side*u,y,-2.787];
      cutout(g,back,.409,1.879,.555,.456,.065,seal);
      cutout(g,(u,y)=>[side*u,y,-2.790],.409,1.879,.507,.399,.048,glass);
      rect(g,back,.414,1.501,.790,.238,teal);rect(g,back,.414,1.659,.790,.030,gold);
      for(const offset of [.05,.29,.53])panel(g,back,[[offset,.930],[offset+.141,.930],[offset+.215,1.051],[offset+.077,1.051]],coral);
      const ft=(u,y)=>[side*u,y,-.038];
      rect(g,ft,.778,2.296,.353,.146,wine);rect(g,ft,.555,2.297,.110,.119,"#d3c6a8");
      rect(g,face,side*.672,.901,.280,.125,headlamp);rect(g,face,side*.854,.87,.060,.124,amber);
      for(const az of s.axles){
        const x=side*(s.track-.085),ring=(across,radius,t)=>[x+side*across,s.wheel+radius*Math.cos(t),az+radius*Math.sin(t)];
        for(let i=0;i<10;i++){
          const a=i*Math.PI/5,b=(i+1)*Math.PI/5;
          g.quad(ring(-.105,s.wheel,a),ring(.115,s.wheel,a),ring(.115,s.wheel,b),ring(-.105,s.wheel,b),rubber);
          g.quad(ring(.115,s.wheel,a),ring(.115,s.wheel,b),ring(.121,.218,b),ring(.121,.218,a),seal);
          g.tri([x+side*.124,s.wheel,az],ring(.124,.218,a),ring(.124,.218,b),i%3===0?steel:silver);
        }
      }
    }
  }
  function build(g,s,paint,parts,interior){
    const color=paint||s.paint;
    if(!parts){distant(g,s,color);return;}
    cabinet(g,color);cab(g,s,color,parts);
    if(interior)interior(g,s);
    for(const side of [-1,1]){
      tire(parts.wheels[side],side,s,0,0,0);
      parts.brakes.box(side*.93,.997,-2.811,.104,.089,.012,red);
      parts.reverse.box(side*.93,.872,-2.811,.104,.089,.012,white);
    }
  }
  function lightBank(g,side){
    g.box(side*.784,2.298,-.008,.314,.125,.009,red);
    g.box(side*.555,2.301,-.018,.097,.103,.013,white);
    g.box(side*.343,.667,2.795,.117,.050,.009,red);
    g.box(side*.93,2.292,-2.810,.121,.131,.012,red);
    for(const z of [-2.514,-.421])rect(g,sideFace(side,1.073),z,2.289,.185,.072,red);
  }
  let modelWriter;
  const paintedLeaves=new Set();
  const rearId=(side,color)=>"rescue-four-rear"+side+(color===cream?"":color);
  function prepareLeaves(color){
    if(!modelWriter||paintedLeaves.has(color))return;
    for(const side of [-1,1])modelWriter(rearId(side,color),g=>barnDoor(g,side,color));
    paintedLeaves.add(color);
  }
  function install(model){
    if(modelWriter===model)return;
    modelWriter=model;paintedLeaves.clear();prepareLeaves(cream);
    for(const side of [-1,1]){
      model("rescue-four-flash"+side,g=>lightBank(g,side));
    }
    model("rescue-four-worklamps",g=>{
      g.box(0,2.344,-2.819,.388,.062,.011,white);
      for(const side of [-1,1])rect(g,sideFace(side,1.072),-1.447,2.285,.21,.067,white);
      for(const x of [-.49,.48])g.box(x,2.385,-1.429,.124,.010,1.267,white);
    });
  }
  function basis(v,x,y,z){
    const yaw=v.yaw||0,pitch=v.pitch||0,roll=v.lean||0;
    const cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll),cy=Math.cos(yaw),sy=Math.sin(yaw);
    const py=y*cp-z*sp,pz=y*sp+z*cp,rx=x*cr-py*sr;
    return {x:rx*cy+pz*sy,y:x*sr+py*cr,z:-rx*sy+pz*cy};
  }
  function point(v,x,y,z,ground){
    const p=basis(v,x,y,z);return{x:v.x+p.x,y:(ground??v.y??0)+p.y,z:v.z+p.z};
  }
  function rear(v,ground){return point(v,loading.x,loading.y,loading.threshold,ground);}
  function doorAngles(v,angle){
    const c=Math.cos(angle),s=Math.sin(angle),X=basis(v,c,0,-s),Y=basis(v,0,1,0),Z=basis(v,s,0,c);
    return[Math.atan2(-X.z,X.x),Math.atan2(-Z.y,Y.y),Math.atan2(X.y,Math.hypot(X.x,X.z))];
  }
  function pulse(t){
    const phase=((t||0)%1.48+1.48)%1.48;
    return phase<.39?-1:phase>=.74&&phase<1.13?1:0;
  }
  function world(list,v,ground,t,near=true){
    const open=clamp(v.rearOpen),base=ground??v.y??0;
    // The distance shell carries closed leaves. The close rig has real moving hinges.
    if(near){
      const color=v.color||cream;prepareLeaves(color);
      for(const side of [-1,1]){
        const p=point(v,side*hingeX,hingeY,hingeZ,base);
        list.push([rearId(side,color),p.x,p.y,p.z,...doorAngles(v,-side*open*maxRear),0]);
      }
    }
    const lamp=v.responseLights?pulse(t):0;
    if(lamp)list.push(["rescue-four-flash"+lamp,v.x,base,v.z,v.yaw,v.pitch,v.lean,.90]);
    if(near&&open>.12)list.push(["rescue-four-worklamps",v.x,base,v.z,v.yaw,v.pitch,v.lean,.5]);
  }
  function mapTruck(c,v,x,y,scale,t=0){
    const color=v.color||cream,open=clamp(v.rearOpen),lamp=v.responseLights?pulse(t):0;
    function box(x,z,w,d,col){c.fillStyle=col;c.fillRect(x,z,w,d);}
    function poly(points,col,edge,width=.035){
      c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
      c.closePath();c.fillStyle=col;c.fill();if(edge){c.lineWidth=width;c.strokeStyle=edge;c.stroke();}
    }
    function line(points,width,col){
      c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
      c.lineWidth=width;c.strokeStyle=col;c.stroke();
    }
    c.save();c.translate(x,y);c.rotate(v.yaw||0);c.scale(scale,-scale);
    poly([[-.80,2.80],[.95,2.75],[1.17,2.41],[1.24,-2.76],[1.095,-3.07],[-.87,-3.0],[-.97,-2.66]],"rgba(34,48,46,.40)");
    for(const side of [-1,1])for(const axle of shape.axles){
      c.save();c.translate(side*(shape.track-.085),axle);if(axle>0)c.rotate(-(v.steer||0));
      box(-.125,-.382,.250,.764,rubber);c.restore();
    }
    const hit=clamp(v.damage?.front),nose=2.76-hit*.26;
    poly([[-.858,nose],[.858,nose],[.965,2.49],[.97,1.63],[.951,.03],[-.951,.03],[-.97,1.63],[-.965,2.49]],color,seal,.05);
    poly([[-.89,1.65],[.89,1.65],[.862,nose-.14],[-.862,nose-.14]],color,silver,.025);
    for(const side of [-1,1]){
      line([[side*.68,1.73],[side*.64,2.36],[side*.61,nose-.24]],.032,warm);
      box(side*.677-.14,nose-.118,.28,.062,white);box(side*.865-.035,nose-.114,.069,.058,amber);
      box(side*.345-.064,nose-.026,.128,.038,lamp===side?red:wine);
    }
    box(-.88,nose+.003,1.76,.067,silver);box(-.40,nose-.077,.80,.071,seal);
    for(let i=0;i<6;i++)box(-.33+i*.134,nose-.061,.065,.022,silver);
    // Cab seats visible through the twin front quarter lights.
    poly([[-.927,1.63],[.927,1.63],[.83,1.058],[-.83,1.058]],"#729498",seal);
    poly([[-.872,1.58],[-.55,1.58],[-.70,1.132],[-.811,1.132]],"#a4b9ad");
    poly([[.12,1.593],[.357,1.593],[.13,1.129],[-.015,1.129]],"#95ada6");
    for(const xx of [-.407,.407])line([[xx-.21,1.599],[xx+.151,1.54]],.025,seal);
    poly([[-.833,.035],[.833,.035],[.834,1.106],[-.834,1.106]],color,silver,.047);
    for(const side of [-1,1]){
      const angle=Math.max(side===v.doorSide?v.doorAngle||0:0,side===1?v.passengerDoor||0:0);
      if(angle>.04){
        box(side<0?-.944:.837,.09,.105,1.14,seal);
        box(side<0?-.902:.812,.23,.091,.65,"#a7a993");
      }
      c.save();c.translate(side*.958,1.63);c.rotate(side*angle);
      poly([[side*.020,-1.571],[-side*.135,-1.55],[-side*.132,-.53],[-side*.033,-.04],[0,.003]],color,seal,.031);
      poly([[-side*.015,-1.464],[-side*.117,-1.46],[-side*.111,-.552],[-side*.009,-.151]],glass);
      line([[-side*.015,-1.513],[-side*.012,-.15]],.027,teal);
      box(side>0?.073:-.190,-.225,.117,.15,seal);box(side>0?.087:-.176,-.228,.089,.029,glass);
      c.restore();
    }
    box(-.962,-2.925,1.924,.196,seal);box(-.90,-2.887,1.80,.072,silver);
    poly([[-1.06,-2.747],[1.06,-2.747],[1.06,-.170],[1.019,-.116],[-1.019,-.116],[-1.06,-.170]],color,seal,.055);
    box(-.966,-2.682,1.932,2.492,warm);
    for(const side of [-1,1]){
      box(side>0?.992:-1.045,-2.625,.053,2.37,teal);
      box(side>0?.968:-.985,-2.62,.016,2.362,gold);
      for(const z of [-2.511,-.421])box(side>0?1.010:-1.073,z-.091,.063,.183,lamp===side?red:wine);
      box(side*.784-.170,-.170,.34,.145,lamp===side?red:wine);
      box(side*.556-.055,-.166,.11,.129,lamp===side?white:"#cfc4a6");
      box(side*.93-.067,-2.777,.134,.105,lamp===side?red:wine);
      box(side*.92-.067,-2.787,.134,.037,v.brakes>.18||v.handbrake>.48?red:coral);
    }
    for(const xx of [-.23,0,.23])box(xx-.048,-.153,.096,.084,amber);
    const cut=open*.97;
    if(cut>.009){
      box(-.807,-2.749,1.615,cut,"#849389");box(-.74,-2.744,1.48,.046,silver);
      for(const xx of [loading.x-.25,loading.x+.25])box(xx-.024,-2.736,.048,cut-.002,"#c4c8b8");
      if(cut>.3){box(.596,-2.547,.226,cut-.194,"#52746d");box(-.823,-2.541,.108,cut-.194,"#bdc4ad");}
    }
    const markZ=-1.94;
    const drawNumber=(offset,digit)=>{
      for(const span of glyph[digit]){
        const pts=span.split(" ").map(n=>[offset+Number(n[0])*.132,markZ+(2-Number(n[1]))*.161]);
        line(pts,.075,teal);
      }
    };
    c.save();c.beginPath();c.rect(-.82,-2.748+cut,1.64,2.61-cut);c.clip();
    c.lineJoin="round";drawNumber(-.502,"0");drawNumber(.101,"4");c.restore();
    box(-.242,-1.134,.800,.723,"#c2c5b4");box(-.203,-1.098,.722,.651,"#dfdec9");
    for(let i=0;i<6;i++)box(-.123,-1.019+i*.083,.495,.026,steel);
    for(const side of [-1,1]){
      c.save();c.translate(side*hingeX,hingeZ);c.rotate(side*open*maxRear);
      const left=side===1?-.804:0;box(left,-.063,.804,.152,seal);box(left+.020,-.054,.765,.132,color);
      box(left+.130,.034,.526,.037,glass);box(left+.060,-.051,.674,.041,teal);box(left+.09,-.059,.17,.022,gold);
      c.restore();
    }
    c.restore();
  }
  function map(c,opt,px,py,s,v,t=0){
    if(!v)return;
    const x=px(v.x),y=py(v.z);
    if(opt.mode==="street"){mapTruck(c,v,x,y,s,t);return;}
    // Radar keeps a clear vehicle bearing at map scales below one pixel per metre.
    const size=opt.mode==="radar"?3.9:4.6;
    c.save();c.translate(x,y);c.rotate(v.yaw||0);
    c.fillStyle=deep;c.beginPath();c.moveTo(0,-size*1.53);c.lineTo(size*.85,-size*.34);
    c.lineTo(size*.85,size);c.lineTo(-size*.85,size);c.lineTo(-size*.85,-size*.34);c.closePath();c.fill();
    c.strokeStyle=cream;c.lineWidth=1.05;c.stroke();
    c.beginPath();c.moveTo(-size*.33,size*.16);c.lineTo(size*.21,-size*.43);c.lineTo(size*.21,size*.62);
    c.moveTo(-size*.34,size*.16);c.lineTo(size*.42,size*.16);c.stroke();
    if(v.responseLights){
      const side=pulse(t);if(side){c.fillStyle=red;c.fillRect(side*size*.79-1,-size*.64,2.1,2.1);}
    }
    c.restore();
  }
  window.BayAmbulanceArt={shape,fit,build,install,pulse,world,map,mapTruck,loading,rear,point};
})();
