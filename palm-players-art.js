/* The Palm's regulars, their house cues and the hands that play the real table. */
(() => {
  "use strict";
  const colors={luz:["#dbab87","#f6d695","#536071"],val:["#925c46","#7287ba","#ede3ba"],
    boone:["#694737","#a3c49d","#435772"],player:["#af7353","#398e86","#556d80"]};
  const sidewalkColors=[["#af7353","#30a292","#eff1d1"],["#754b39","#e99c78","#344557"],
    colors.luz,colors.val,["#c58166","#f19793","#305c60"],colors.boone];
  const clothX=.635,clothZ=1.27,railX=.773,railZ=1.408,railH=.042,ballR=.028575;
  const tau=2*Math.PI,sideList=[-1,1],ink="#3d3939",ivory="#f1e1b9",brass="#bb985c";
  const name=s=>"palm-player-"+s,limit=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,u)=>a+(b-a)*u;
  const smooth=(a,b,x)=>{const t=limit((x-a)/(b-a));return t*t*(3-2*t);};
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const xyz=(x,y,z)=>({x,y,z}),linear=(a,b,u)=>xyz(mix(a.x,b.x,u),mix(a.y,b.y,u),mix(a.z,b.z,u));
  const roleFor=(a,o)=>{const r=(o.role||a.name||a.role||a.id||"player").toLowerCase().split(" ")[0];return colors[r]?r:"guest";};
  function at(a,x,y,z){
    const p=a.pitch||0,r=a.roll||0,w=a.yaw||0,cp=Math.cos(p),sp=Math.sin(p),cr=Math.cos(r),sr=Math.sin(r);
    const h=y*cp-z*sp,v=y*sp+z*cp,d=x*cr-h*sr,c=Math.cos(w),s=Math.sin(w);
    return xyz(a.x+d*c+v*s,(a.y||0)+x*sr+h*cr,a.z-d*s+v*c);
  }
  function local(a,p){const c=Math.cos(a.yaw||0),s=Math.sin(a.yaw||0),x=p.x-a.x,z=p.z-a.z;
    return [x*c-z*s,p.y-(a.y||0),x*s+z*c];}
  const vec=(a,b,u)=>a.map((n,i)=>mix(n,b[i],u));
  const turnFrame=(o,yaw,pitch=0,roll=0)=>({...o,yaw,pitch,roll});
  function along(o,yaw,d,y=o.y,side=0){return xyz(o.x+d*Math.sin(yaw)+side*Math.cos(yaw),y,o.z+d*Math.cos(yaw)-side*Math.sin(yaw));}
  function polygon(g,vs,col){for(let j=1;j<vs.length-1;j++)g.tri(vs[0],vs[j],vs[j+1],col);}
  const chainLine=(g,pts,r,col,n=6)=>{for(let i=1;i<pts.length;i++)g.pole(pts[i-1],pts[i],r,col,n);};
  function oval(x,y,z,r,w,n=14,tilt=0){
    return Array.from({length:n},(_,i)=>{const a=i*tau/n;return [x+r*Math.cos(a),y+tilt*Math.cos(a),z+w*Math.sin(a)];});
  }
  function bowl(g,rows,palette){
    for(let j=1;j<rows.length;j++)for(let i=0;i<rows[j].length;i++){
      const k=(i+1)%rows[j].length;g.quad(rows[j-1][i],rows[j-1][k],rows[j][k],rows[j][i],palette[(i+Math.floor(j/2))%palette.length]);
    }
    polygon(g,rows.at(-1),palette[0]);
  }
  const front=(g,shape,col,z=.128)=>polygon(g,shape.map(([x,y])=>[x,y,z]),col);
  function luzHead(g){
    const hair=["#634538","#75503c","#60443a","#513c35"];
    bowl(g,[oval(0,1.645,-.014,.106,.104),oval(-.004,1.699,-.014,.114,.116,14,.010),
      oval(-.010,1.752,-.008,.105,.101,14,.016),oval(-.023,1.779,-.022,.061,.062)],hair);
    for(const s of sideList){
      bowl(g,[oval(s*.080,1.594,-.041,.027,.036,10),oval(s*.088,1.621,-.044,.035,.044,10),
        oval(s*.086,1.655,-.050,.037,.044,10),oval(s*.073,1.688,-.039,.024,.033,10)],hair);
      const loop=[];for(let i=0;i<=11;i++){const a=tau*i/11;loop.push([s*(.106+.005*Math.cos(a)),1.580+.020*Math.cos(a),.005+.017*Math.sin(a)]);}
      chainLine(g,loop,.0039,brass,5);
    }
    // A folded scarf crosses above the forehead and ties off the left temple.
    const strip=(y,w,d)=>oval(0,y,-.004,w,d,20,-.020).map(([x,h,z])=>[x,h+.034*z/.112,z]);
    bowl(g,[strip(1.681,.115,.115),strip(1.707,.114,.117)],["#bd6950","#c16b53","#bf684d"]);
    for(let i=0;i<11;i++){
      const a=i*tau/11,x=.116*Math.cos(a),z=-.004+.116*Math.sin(a),y=1.694-.020*Math.cos(a)+.034*Math.sin(a);
      g.box(x,y,z,.007,.006,.007,ivory);
    }
    const knot=[[-.085,1.711,.075],[-.112,1.731,.084],[-.121,1.712,.105],[-.101,1.692,.091]];
    polygon(g,knot,"#a85847");polygon(g,[knot[1],[-.158,1.766,.088],[-.143,1.718,.099],knot[2]],"#d88564");
    polygon(g,[knot[2],[-.155,1.699,.117],[-.169,1.675,.095],knot[3]],"#b46050");
    for(const s of sideList)chainLine(g,[[s*.025,1.667,.104],[s*.056,1.672,.108],[s*.078,1.663,.094]],.0045,hair[1]);
  }
  function valHead(g){
    const navy="#3e353c",shine="#634c4b";
    bowl(g,[oval(0,1.674,-.015,.105,.106,16,.011),oval(-.003,1.717,-.012,.111,.112,16,.012),
      oval(-.018,1.750,-.005,.103,.095,16,.015),oval(-.031,1.773,-.019,.055,.058,16)],[navy,navy,shine]);
    for(const [x,y,z] of [[-.041,1.742,.064],[-.085,1.716,.052],[-.100,1.661,-.043],[.079,1.715,-.043]]){
      bowl(g,[oval(x,y-.021,z,.023,.024,8),oval(x-.004,y,z,.032,.034,8),oval(x-.013,y+.020,z,.021,.024,8)],[shine,navy]);
    }
    for(const s of sideList){const a=[[.014,1.668,.109],[.039,1.675,.115],[.084,1.670,.097],[.078,1.645,.101],[.039,1.643,.114],[.015,1.649,.112],[.014,1.668,.109]];
      chainLine(g,a.map(([x,y,z])=>[x*s,y,z]),.0047,"#784d55");chainLine(g,[[s*.085,1.669,.095],[s*.104,1.661,.046],[s*.105,1.644,-.022]],.0039,brass);}
    chainLine(g,[[-.017,1.663,.111],[0,1.669,.115],[.017,1.663,.111]],.0036,brass);
  }
  function booneHead(g){
    const cap=["#a65a41","#b56948","#a45a42","#934f3b"],edge="#cc855f";
    bowl(g,[oval(0,1.671,-.010,.111,.108,18),oval(0,1.703,-.013,.117,.118,18),
      oval(-.007,1.753,-.022,.107,.104,18),oval(-.023,1.783,-.033,.076,.071,18),oval(-.028,1.796,-.039,.036,.033,18)],cap);
    bowl(g,[oval(0,1.663,-.007,.115,.115,18,.006),oval(0,1.696,-.007,.118,.118,18,.006)],[cap[3],cap[0]]);
    for(let i=0;i<17;i++){const a=tau*i/17;chainLine(g,[[.116*Math.cos(a),1.665+.006*Math.cos(a),-.007+.116*Math.sin(a)],
      [.119*Math.cos(a),1.693+.006*Math.cos(a),-.007+.119*Math.sin(a)]],.0023,edge,4);}
    for(const s of sideList)polygon(g,[[s*.086,1.637,.059],[s*.092,1.604,.059],[s*.067,1.557,.071],
      [s*.019,1.539,.093],[s*.009,1.555,.095],[s*.065,1.576,.086]],"#50403a");
    front(g,[[-.036,1.585],[-.017,1.592],[0,1.586],[.020,1.593],[.040,1.584],[.032,1.578],[0,1.581],[-.029,1.578]],"#443a35",.102);
  }
  function clothing(g,role){
    const accent=role==="luz"?"#bf7754":role==="val"?"#b7d1c4":"#74887e",piping=role==="luz"?"#f5e6b0":role==="val"?"#d5dccb":"#e9c795";
    for(const s of sideList){
      front(g,[[s*.105,1.426],[s*.045,1.437],[s*.018,1.342],[s*.083,1.389],[s*.125,1.390]],accent,.128);
      if(role==="luz"){
        front(g,[[s*.150,1.393],[s*.124,1.377],[s*.106,1.002],[s*.135,.979]],"#ddab72",.122);
        chainLine(g,[[s*.125,1.390,.121],[s*.113,1.226,.124],[s*.106,1.001,.116]],.0046,piping,5);
        front(g,[[s*.162,1.399],[s*.111,1.401],[s*.040,1.307],[s*.053,1.297]],accent,-.123);
      }
      if(role==="boone"){
        front(g,[[s*.140,1.421],[s*.100,1.425],[s*.067,.970],[s*.102,.966]],"#586c6c",.123);
        front(g,[[s*.114,1.307],[s*.085,1.310],[s*.081,1.273],[s*.112,1.271]],brass,.131);
        front(g,[[s*.132,1.414],[s*.110,1.409],[-s*.090,.981],[-s*.117,.982]],"#53696a",-.126);
      }
    }
    if(role==="luz"){
      for(const y of [1.302,1.217,1.131,1.045])g.pole([.006,y,.126],[.006,y,.131],.0058,"#a27053",8);
      front(g,[[.041,1.335],[.120,1.335],[.114,1.264],[.077,1.251],[.042,1.270]],"#d9a063");
      chainLine(g,[[.076,1.266,.133],[.077,1.286,.134],[.086,1.305,.133]],.0029,"#597d65");
      for(const [x,y] of [[.064,1.308],[.062,1.298],[.085,1.319],[.104,1.306],[.100,1.295]])chainLine(g,[[.086,1.305,.134],[x,y,.134]],.003,"#597d65");
      g.box(-.130,.981,.088,.073,.062,.048,"#9b6851");g.box(-.130,1.010,.096,.050,.024,.031,"#648e9b");
    }else if(role==="val"){
      for(const y of [1.302,1.205,1.104,1.008])g.pole([.004,y,.125],[.004,y,.131],.0058,"#c5c8b8",7);
      front(g,[[-.138,1.355],[-.039,1.354],[-.043,1.284],[-.092,1.265],[-.138,1.280]],"#5e779c");
      g.box(-.087,1.335,.135,.093,.028,.006,ivory);
      for(const x of [-.117,-.100,-.083,-.066])g.box(x,1.336,.139,.007,.011,.002,"#6f6372");
      for(const s of sideList)chainLine(g,[[s*.163,1.385,-.112],[s*.106,1.337,-.124],[0,1.304,-.125]],.005,piping);
    }else{
      front(g,[[-.062,1.250],[.068,1.248],[.066,1.181],[.014,1.162],[-.062,1.182]],"#8ca895");
      g.box(-.005,1.245,.132,.127,.013,.006,piping);g.box(.026,1.248,.137,.009,.055,.007,"#635b4d");
    }
  }
  function dress(rig,role){
    if(!rig||!["luz","val","boone"].includes(role)||rig.palmWear===role)return;
    const g=new BayMesh(),groups=[],part=(p,s=1)=>groups.push({p,s,first:g.vertices.length/6});
    part("head");({luz:luzHead,val:valHead,boone:booneHead})[role](g);part("body");clothing(g,role);
    for(const s of sideList){
      part("arm",s);const col=role==="val"?"#d8d8c8":role==="boone"?"#b9c3a0":"#e0a366";
      g.box(s*.230,1.288,-.003,.140,.020,.154,col);
      if(role==="val"&&s<0){part("held",s);g.box(s*.236,1.044,.031,.089,.022,.089,"#6f757a");g.box(s*.277,1.045,.035,.008,.023,.025,"#c6c8ae");}
      if(role==="boone"){part("leg",s);g.box(s*.110,.189,0,.138,.036,.144,"#666e62");g.box(s*.110,.077,.050,.143,.031,.219,"#85745b");}
    }
    const all=new Float32Array(rig.rest.length+g.vertices.length);all.set(rig.rest);all.set(g.vertices,rig.rest.length);
    for(let i=0;i<groups.length;i++){const {p,s,first}=groups[i],end=groups[i+1]?.first??g.vertices.length/6;
      for(let j=first;j<end;j++)rig.bindings.push(rig.binding(p,rig.sides[s<0?0:1],g.vertices[j*6+1]));}
    rig.rest=all;rig.vertices=all.slice();rig.lastRevision=-1;rig.palmWear=role;
  }

  const cueFinishes={
    luz:["#925b3f","#385e53","#d5b983"],val:["#713f43","#65464e","#e0cfab"],
    boone:["#74533e","#444749","#baa780"],player:["#865b3d","#365653","#d4bf8d"],
    house:["#bf8350","#438b80","#e1c391"]
  };
  function shaft(g,a,b,ra,rb,col,n=12){
    for(let i=0;i<n;i++){const f=tau*i/n,j=tau*(i+1)/n,pt=(z,r,t)=>[Math.cos(t)*r,Math.sin(t)*r,z];
      g.quad(pt(a,ra,f),pt(b,rb,f),pt(b,rb,j),pt(a,ra,j),col,.86+.16*(.5+.5*Math.sin(f)));}
  }
  function cueMesh(g,finish){
    const [butt,wrap,splice]=cueFinishes[finish];
    shaft(g,0,-.004,.0061,.0063,"#5899ac");shaft(g,-.004,-.024,.0063,.0064,"#eae4cb");shaft(g,-.024,-.727,.0064,.0105,"#d8bd88");
    shaft(g,-.727,-.745,.0105,.0107,"#d5c5a0");shaft(g,-.745,-.936,.0107,.0130,butt);
    for(let i=0;i<4;i++){const a=i*tau/4+.21,p=(z,r,t)=>[r*Math.cos(t),r*Math.sin(t),z];
      g.tri(p(-.763,.0110,a),p(-.93,.0131,a-.29),p(-.93,.0131,a+.29),splice);}
    shaft(g,-.934,-.951,.0131,.0132,finish==="house"?"#63a99a":ivory);shaft(g,-.951,-1.222,.0132,.0145,wrap);
    for(let i=0;i<8;i++)shaft(g,-.968-i*.031,-.972-i*.031,.0133+i*.00015,.0133+i*.00015,finish==="house"?"#689c86":"#8b8872");
    shaft(g,-1.222,-1.228,.0145,.0146,ivory);shaft(g,-1.228,-1.445,.0146,.0154,butt);
    for(const z of [-1.264,-1.391])shaft(g,z,z-.011,.01535,.01536,finish==="house"?"#5da49a":brass);
    shaft(g,-1.445,-1.463,.0154,.0148,ivory);shaft(g,-1.463,-1.476,.0148,.0128,"#474744");
  }
  function handMesh(g,role,side,kind){
    const skin=colors[role][0],shade=role==="boone"?"#563c32":role==="luz"?"#b4896b":role==="val"?"#764d41":"#91654f";
    const p=(x,y,z)=>[side*x,y,z],finger=(coords,r)=>chainLine(g,coords.map(e=>p(...e)),r,skin,7);
    if(kind==="bridge"){
      // The bridge is open between the thumb and bent index. Its throat is the cue center.
      polygon(g,[p(.018,-.025,-.021),p(.075,-.031,-.028),p(.086,-.022,-.071),p(.057,-.008,-.099),p(.025,-.009,-.072)],skin);
      finger([[.065,-.017,-.066],[.058,-.023,-.023],[.068,-.033,.023],[.079,-.036,.036]],.009);
      finger([[.055,-.020,-.035],[.045,-.028,.006],[.049,-.035,.042],[.056,-.036,.059]],.0091);
      finger([[.043,-.018,-.038],[.029,-.021,.005],[.026,-.034,.047],[.026,-.036,.066]],.0092);
      finger([[.037,-.017,-.037],[.014,-.006,-.012],[.013,-.008,.008],[.018,-.029,.037],[.016,-.036,.049]],.0091);
      finger([[.043,-.016,-.055],[.019,-.012,-.043],[-.003,-.012,-.029],[-.013,-.005,-.010]],.0090);
      chainLine(g,[p(.033,-.013,-.029),p(.023,-.012,-.014)],.0021,shade,5);
    }else{
      // The grip hangs below the butt; the pad of the thumb closes against the outside index.
      for(let i=0;i<4;i++){const z=.024-i*.016,lo=-.023-i*.0006;
        finger([[.035,-.007,z],[.026,lo,z+.002],[-.004,lo-.003,z],[-.013,-.009,z-.003]],.0082-i*.00038);}
      finger([[.027,.001,-.015],[.019,.010,.010],[.003,.015,.028],[-.008,.011,.028]],.0095);
    }
  }
  function crossHead(g){
    g.box(0,-.016,0,.021,.022,.030,brass);
    for(const s of sideList){
      chainLine(g,[[s*.044,-.039,0],[s*.024,-.023,0],[s*.008,-.008,0],[-s*.010,-.002,0],[-s*.024,.014,0]],.0062,"#c0a461",8);
      g.pole([s*.040,-.039,0],[s*.047,-.043,0],.0056,"#677067",7);
    }
  }
  function mugMesh(g){
    const bands=[[-.052,.034],[-.046,.040],[.032,.046],[.045,.047],[.051,.045]];
    for(let i=1;i<bands.length;i++)g.cyl(0,(bands[i][0]+bands[i-1][0])/2,0,bands[i][1],bands[i-1][1],bands[i][0]-bands[i-1][0],14,i===3?"#64908b":"#eee1c0");
    g.cyl(0,.050,0,.040,.039,.0018,14,"#61463a");
    chainLine(g,[[.040,.034,-.001],[.064,.033,0],[.074,.021,0],[.070,-.007,0],[.055,-.022,0],[.039,-.024,0]],.0078,"#ddcfaf",7);
  }
  function farActor(g,r,palette,sitting){
    const [skin,top,pants]=palette,drop=sitting?.38:0;
    for(const s of sideList){
      if(sitting){g.pole([s*.134,.120,.401],[s*.117,.504,.359],.067,pants,5);
        g.pole([s*.117,.504,.359],[s*.108,.95-drop,-.012],.081,pants,5);}
      else g.pole([s*.103,.11,0],[s*.100,.95,0],.077,pants,5);
      g.pole([s*.221,.978-drop,sitting?.221:.055],[s*.198,1.38-drop,-.003],.052,skin,5);
    }
    g.cyl(0,1.195-drop,0,.204,.160,.445,7,top);g.box(0,1.617-drop,0,.194,.224,.185,skin);
    g.cyl(0,1.722-drop,-.013,.087,.110,.084,8,r==="boone"?"#a75d42":r==="luz"?"#6b4b3d":"#453941");
    if(r==="luz")g.cyl(0,1.697-drop,-.008,.115,.114,.026,9,"#bc7053");
  }
  let farModel=null;
  const distant=new Set();
  function install(model){
    farModel=model;distant.clear();
    for(const r of Object.keys(cueFinishes))model(name("cue-"+r),g=>cueMesh(g,r));
    for(const n of [1,2,3])model(name("extension-"+n),g=>{shaft(g,0,-.24*n,.0149,.016,"#8c6951");shaft(g,-.24*n,-.24*n-.010,.016,.013,"#404443");});
    for(const r of Object.keys(colors)){
      for(const s of sideList)for(const k of ["bridge","grip"])model(name(k+"-"+r+s),g=>handMesh(g,r,s,k));
    }
    model(name("rest"),g=>{g.pole([0,-.019,-.008],[0,-.012,-1.43],.011,"#bd9967",10);
      g.pole([0,-.019,-.004],[0,-.017,-.086],.013,brass,10);});
    model(name("cross"),crossHead);model(name("mug"),mugMesh);
    model(name("chalk"),g=>{g.box(0,.008,0,.024,.019,.024,"#47889a");g.box(0,.0118,0,.0248,.012,.0248,"#a6b9a0");g.box(0,.0177,0,.022,.003,.022,"#7d9fa1");});
  }

  function stance(table,cue,angle,previous){
    const yaw=table.yaw||0,bearing=angle-yaw,dx=Math.sin(bearing),dz=Math.cos(bearing);
    const hx=railX+.414,hz=railZ+.414,edges=[["west",-1,0,hx],["east",1,0,hx],["near",0,-1,hz],["far",0,1,hz]];
    let best=null;
    for(const hand of [1,-1])for(let extension=0;extension<=3;extension++){
      const span=.92+extension*.24,ex=cue.x-dx*span-hand*dz*.255,ez=cue.z-dz*span+hand*dx*.255;
      for(const [edge,sx,sz,extent] of edges){
        const push=Math.max(0,extent-ex*sx-ez*sz),x=ex+sx*push,z=ez+sz*push;
        // Taking a side rail beats stretching an arm across the whole width.
        // A butt extension and mechanical rest let a long straight shot keep its line.
        const sideways=sx*dz-sz*dx,across=hand*sideways;
        const score=push+extension*.129+(hand<0?.084:0)+Math.max(0,across)*push*.39+
          Math.max(0,sx*dx+sz*dz)*push*.36-(previous?.edge===edge&&previous.hand===hand?.085:0);
        if(!best||score<best.score){const p=at(table,x,0,z);
          best={x:p.x,z:p.z,yaw:angle+hand*.36,hand,edge,extension,score,push};}
      }
    }
    return best;
  }
  function railDistance(b,dx,dz,hx,hz){
    const x=Math.abs(dx)<.000001?Infinity:(b.x+(dx>0?hx:-hx))/dx;
    const z=Math.abs(dz)<.000001?Infinity:(b.z+(dz>0?hz:-hz))/dz;
    return Math.max(0,Math.min(x,z));
  }
  function support(table,b,a){
    const ang=a-(table.yaw||0),dx=Math.sin(ang),dz=Math.cos(ang),lip=railDistance(b,dx,dz,clothX,clothZ);
    const edge=railDistance(b,dx,dz,railX,railZ),lift=.019*(1-smooth(.045,.265,lip)),hit=Math.sqrt(Math.max(.00001,ballR*ballR-lift*lift));
    let best=null;
    for(const u of [.233,.207,.263,.181,.298,.152,.340,.123,.381,.095,.069,.054]){
      if(u>edge-.014)continue;
      const x=b.x-u*dx,z=b.z-u*dz,wood=Math.abs(x)>clothX-.012||Math.abs(z)>clothZ-.012;
      const pocket=Math.min(Math.hypot(Math.abs(x)-clothX,Math.abs(z)-clothZ),Math.hypot(Math.abs(x)-clothX,z));
      const y=table.y+(wood?railH:0),slope=(y+.041-table.y-ballR-lift)/Math.max(.022,u-hit);
      const needsRail=lip<1.45,atRail=table.y+ballR+lift+(lip-hit)*slope;
      const cost=Math.abs(u-.227)*1.45+Math.max(0,.111-pocket)*8+(needsRail?Math.max(0,table.y+railH+.007-atRail)*12:0)+Math.max(0,slope-.31)*.27;
      if(!best||cost<best.cost)best={u,y,wood,slope,pocket,cost};
    }
    if(!best)best={u:Math.max(.044,edge*.68),y:table.y+railH,wood:true,slope:.23,pocket:0};
    const slope=limit(Math.max(best.slope,(railH+.0095-ballR-lift)/Math.max(.012,lip-hit)),.027,.43);
    const contact=hit+(best.y+.041-table.y-ballR-lift)/slope;
    const x=b.x-contact*dx,z=b.z-contact*dz,wood=Math.abs(x)>clothX-.012||Math.abs(z)>clothZ-.012;
    const pocket=Math.min(Math.hypot(Math.abs(x)-clothX,Math.abs(z)-clothZ),Math.hypot(Math.abs(x)-clothX,z));
    if(contact>.048&&contact<edge-.012&&Math.abs(best.u-contact)<.14&&wood===best.wood&&pocket>.094)best.u=contact;
    return {...best,hit,lift,slope,lip};
  }
  const palms=m=>m.sides.map(l=>l.forearm.map([l.side*.237,.978,.058],[]));
  const boneAngles=b=>[Math.atan2(-b.m[6],b.m[5]),Math.atan2(-b.m[8],b.m[0]),Math.asin(limit(b.m[4],-1,1))];
  function adjust(b,pos,angles,w){
    const old=b.map(b.pivot,[]),rotation=boneAngles(b);
    const t=angles.map((n,i)=>rotation[i]+turn(rotation[i],n)*w);
    b.place(vec(old,pos,w),...t);
  }
  function turnShoulders(chest,angle){
    // Roll the back shoulder up about the bent spine. The lead shoulder can
    // extend toward the table while the cue passes beside the ribcage.
    const p=chest.map(chest.pivot,[]),m=chest.m,c=Math.cos(angle),s=Math.sin(angle);
    for(const i of [0,4,8]){const x=m[i],z=m[i+2];m[i]=x*c-z*s;m[i+2]=x*s+z*c;}
    chest.anchor(p);
  }
  function joint(upper,lower,root,end,hint){
    const delta=end.map((n,i)=>n-root[i]),d=Math.max(.0001,Math.hypot(...delta)),axis=delta.map(n=>n/d);
    const stretch=Math.max(1,d/(upper.length+lower.length-.0003)),a=upper.length*stretch,b=lower.length*stretch;
    const mid=(a*a-b*b+d*d)/(2*d),dot=hint.reduce((n,h,i)=>n+h*axis[i],0);
    const perp=hint.map((n,i)=>n-dot*axis[i]),k=Math.sqrt(Math.max(0,a*a-mid*mid))/(Math.hypot(...perp)||1);
    const bend=root.map((n,i)=>n+axis[i]*mid+perp[i]*k);
    upper.aim(root,bend);lower.aim(bend,end);
  }
  function arm(m,idx,desired,hint){
    const l=m.sides[idx];
    if(!l.palmAxis){
      // Same native forearm transform, solving from the elbow to the pad beyond the wrist.
      l.palmAxis=new l.forearm.constructor(l.forearm.pivot,[l.side*.237,.978,.058]);
      l.palmAxis.m=l.forearm.m;
    }
    m.chest.map(l.arm.pivot,l.shoulder);
    joint(l.arm,l.palmAxis,l.shoulder,desired,hint);
  }
  function legs(m,a,target,weight,feet,footYaw=[-.16,.13]){
    adjust(m.pelvis,local(a,target),[.045,0,0],weight);
    for(let i=0;i<2;i++){
      const l=m.sides[i],old=l.shoe.map(l.shoe.pivot,[]),shoe=vec(old,local(a,feet[i]),weight);
      m.pelvis.map(l.thigh.pivot,l.hip);joint(l.thigh,l.shin,l.hip,shoe,[l.side*.17,-.04,1]);
      l.shoe.place(shoe,mix(boneAngles(l.shoe)[0],0,weight),mix(boneAngles(l.shoe)[1],footYaw[i],weight));
    }
  }
  const noSkin=()=>{};
  const colorsInShade=new Map();
  function shade(color,amount){
    const key=color+amount;if(colorsInShade.has(key))return colorsInShade.get(key);
    const rgb=[1,3,5].map(i=>{const c=parseInt(color.slice(i,i+2),16);
      return Math.round(amount>0?mix(c,225,amount):c*(1+amount)).toString(16).padStart(2,"0");});
    const paint="#"+rgb.join("");colorsInShade.set(key,paint);return paint;
  }
  const dummyGaits=new WeakMap(),nativeRigs=new WeakMap(),sketches=new WeakMap();
  function gait(a,t){if(a.motion)return a.motion;let m=dummyGaits.get(a);if(!m){m=new BayPlayerMotion();dummyGaits.set(a,m);}
    if(m.palmTime!==t){m.step(1/30,a.moving?.041:0,0);m.palmTime=t;}return m;}
  function shotPose(m,a,action,o,w,original){
    const table=o.table,ball=o.cue,aim=o.angle,ground=a.y||0;
    const expected=o.stance||stance(table,ball,aim),h=expected.hand,ext=expected.extension,extra=.24*ext;
    const B=at(table,ball.x,0,ball.z),supportAt=support(table,ball,aim),slope=supportAt.slope;
    const hitPoint=along(B,aim,-supportAt.hit,table.y+ballR+supportAt.lift),pitch=Math.atan(slope),cs=Math.cos(pitch),sn=Math.sin(pitch);
    const base=along(B,aim,-.92-extra,ground,-h*.255);
    const strain=gap(a,base),shift=Math.min(.408,strain*.57),toward=strain>.001?Math.atan2(base.x-a.x,base.z-a.z):aim;
    const hip=along(a,toward,shift,ground+.827-shift*.072),wish=along(B,aim,-.630-extra,ground,-h*.250);
    const inward=Math.atan2(wish.x-hip.x,wish.z-hip.z);
    const foot=(side)=>{const forward=side===-h?.149:-.171;
      return along(a,aim,forward,ground+.170,side*.178);};
    const actualWeight=w*(1-smooth(.13,.59,gap(a,expected)));
    legs(m,a,hip,actualWeight,[foot(-1),foot(1)],[-.18,.19]);
    const bend=1.255+Math.min(.115,strain*.23),roll=-h*.102;
    adjust(m.chest,m.pelvis.map(m.chest.pivot,[]),[bend,turn(a.yaw||0,inward),roll],actualWeight);
    turnShoulders(m.chest,h*(.53-.28*smooth(.40,.89,strain))*actualWeight);
    adjust(m.head,m.chest.map(m.head.pivot,[]),[.43,turn(a.yaw||0,aim),h*.064],actualWeight);
    const reach=m.sides.map(l=>at(a,...m.chest.map(l.arm.pivot,[]))),back=h>0?1:0,bridge=1-back;
    const alongCue=p=>(B.x-p.x)*Math.sin(aim)+(B.z-p.z)*Math.cos(aim);
    const gripAt=limit(alongCue(reach[back])-.030,.628,1.275+extra);
    const fullDraw=action==="stroke"?(.044+.163*limit(o.draw??1)):(.015+.192*limit(o.draw||0));
    const localAim=aim-(table.yaw||0),ahead=railDistance(ball,-Math.sin(localAim),-Math.cos(localAim),clothX,clothZ);
    const follow=limit(Math.min((ahead+supportAt.hit-.010)/cs,(hitPoint.y-table.y-.008)/sn),0,.127);
    const pct=limit(o.stroke||0),offset=action==="stroke"?
      fullDraw*(1-smooth(.0,.46,pct))-follow*(smooth(.46,.77,pct)-.28*smooth(.86,1,pct)):fullDraw;
    const shotTip=along(hitPoint,aim,-offset*cs,hitPoint.y+offset*sn),shotGrip=along(shotTip,aim,-gripAt*cs,shotTip.y+gripAt*sn);
    const carryPad=turnFrame(at(a,...original[back]),(a.yaw||0)+.24*h,-1.36);
    const carriedGrip=at(carryPad,-h*.029,.013,.007),grip=linear(carriedGrip,shotGrip,actualWeight);
    const activePitch=mix(-1.36,pitch,actualWeight),activeYaw=(a.yaw||0)+(.24*h)*(1-actualWeight)+turn(a.yaw||0,aim)*actualWeight;
    const heldLength=mix(.679,gripAt,actualWeight),tip=along(grip,activeYaw,Math.cos(activePitch)*heldLength,grip.y-Math.sin(activePitch)*heldLength);
    const cue=turnFrame(tip,activeYaw,activePitch),gripFrame=turnFrame(grip,activeYaw,activePitch);
    const supportPoint=along(hitPoint,aim,-(supportAt.u-supportAt.hit),hitPoint.y+(supportAt.u-supportAt.hit)*slope);
    const anchor=turnFrame(supportPoint,aim);
    let nearHand=at(anchor,-h*.047,-.017,-.067),rest=null,bridgeFrame=null;
    const reachDist=Math.hypot(nearHand.x-reach[bridge].x,nearHand.y-reach[bridge].y,nearHand.z-reach[bridge].z);
    if(reachDist>.476||ext>0){
      const left=reach[bridge],bearing=Math.atan2(supportPoint.x-left.x,supportPoint.z-left.z),d=gap(left,supportPoint);
      const handle=limit(d-.21,.25,1.36),[x,,z]=local(table,supportPoint),relt=bearing-(table.yaw||0);
      const woodAt=railDistance({x,z},Math.sin(relt),Math.cos(relt),clothX,clothZ);
      const clear=(table.y+railH+.034-supportPoint.y)/Math.max(.061,woodAt);
      const up=limit(Math.max(clear,(left.y-.17-supportPoint.y)/handle),-.04,.43);
      rest=turnFrame(supportPoint,bearing,Math.atan(up));
      nearHand=at(rest,0,-.039,-handle);
    }else bridgeFrame=anchor;
    const rightPad=at(gripFrame,h*.029,-.013,-.007),nearPad=local(a,nearHand),farPad=local(a,rightPad);
    arm(m,back,farPad,[h*.41,.72,-.84]);
    arm(m,bridge,vec(original[bridge],nearPad,actualWeight),[-h*.68,-.83,-.28]);
    return {cue,extension:ext,grip:actualWeight>.91?gripFrame:null,bridge:actualWeight>.92?bridgeFrame:null,
      rest:actualWeight>.90?rest:null,cross:rest&&actualWeight>.90?anchor:null,hand:h,weight:actualWeight,
      contacts:{B,hitPoint,supportPoint,rightPad,nearHand,rail:supportAt.wood,supportHeight:supportAt.y,t:offset,expected}};
  }
  function carryPose(m,a,t,role,action,o,original){
    const car=o.car||a.ride;if(car&&a.motion?.ride||action==="ride"||action==="board")return {};
    const phase=t*.82+(role==="luz"?.4:role==="val"?1.7:2.63),nod=Math.sin(phase),weight=limit(o.settle??1);
    const seated=action==="sip"||action==="sit",watch=action==="watch"||action==="lean",chalk=action==="chalk";
    let head=0;
    if(o.target)head=limit(turn(a.yaw||0,Math.atan2(o.target.x-a.x,o.target.z-a.z)),-.86,.86);
    const carry=o.carry===true||chalk;
    let mug=null,block=null,cue=null;
    if(seated){
      const cushion=o.seat,top=cushion?.seatY??cushion?.y??((a.y||0)+.48);
      const f=a.y||0,hip=at(a,.007,top-f+.086,-.020);
      legs(m,a,hip,weight,[at(a,-.131,.170,.424),at(a,.153,.17,.360)]);
      adjust(m.chest,m.pelvis.map(m.chest.pivot,[]),[.105+.021*nod,.067*nod,0],weight);
      adjust(m.head,m.chest.map(m.head.pivot,[]),[.038+.043*nod,head+.106*nod,.017],weight);
      for(const l of m.sides)m.chest.map(l.arm.pivot,l.shoulder);
      const left=local(a,at(a,-.128,top-f+.15,.306));
      arm(m,0,vec(original[0],left,weight),[-.62,-.86,-.32]);
      const sip=action==="sip"?(Number.isFinite(o.sip)?limit(o.sip):smooth(.06,.39,(t*.151+.18)%1)*(1-smooth(.54,.86,(t*.151+.18)%1))):0;
      const mouth=at(a,...m.head.map([.014,1.579,.098],[])),mugYaw=(a.yaw||0)-.22;
      const pitch=-.57*sip+.005*nod,tilt=turnFrame(xyz(0,0,0),mugYaw,pitch);
      const rim=at(tilt,.001,.052,-.038),onLip=xyz(mouth.x-rim.x,mouth.y-rim.y,mouth.z-rim.z);
      const low=at(a,.153,top-f+.205,.293);
      if(action==="sip"||o.mug){
        mug=turnFrame(linear(low,onLip,sip),mugYaw,pitch);
        const handle=at(mug,.062,.005,0);arm(m,1,vec(original[1],local(a,handle),weight),[.78,-.57,-.30]);
      }else arm(m,1,vec(original[1],local(a,at(a,.150,top-f+.154,.258)),weight),[.64,-.79,-.45]);
    }else if(chalk||watch){
      const lean=action==="lean"?.145:.043+.017*nod;
      adjust(m.chest,m.pelvis.map(m.chest.pivot,[]),[lean,.049*nod,.030*nod],1);
      adjust(m.head,m.chest.map(m.head.pivot,[]),[chalk?.26:.025+.036*nod,head+.12*nod,-.040],1);
      if(watch&&!carry){
        for(const l of m.sides){const s=l.side,p=s<0?[.128,1.174,.144]:[-.107,1.222,.158];arm(m,s<0?0:1,p,[s*.92,-.83,-.34]);}
      }
    }
    if(carry&&!seated){
      if(chalk){
        const c=at(a,.028,1.382+.007*nod,.238),yaw=(a.yaw||0)-.74,pitch=-1.113+.022*nod;
        cue=turnFrame(c,yaw,pitch);
        const grip=at(cue,0,0,-.456);
        arm(m,1,local(a,grip),[.81,-.78,-.29]);
        block=turnFrame(at(cue,.003*Math.cos(t*7),.002,.004),yaw+t*.75,pitch);
        arm(m,0,local(a,at(block,-.028,.011,0)),[-.68,-.55,-.67]);
      }else{
        const p=at(a,...original[1]),yaw=(a.yaw||0)-.08,pitch=-1.36+.025*nod;
        const grip=turnFrame(p,yaw,pitch),tip=at(grip,0,0,.683);cue=turnFrame(tip,yaw,pitch);
      }
    }
    return {cue,mug,chalk:block,hand:1,weight:1};
  }
  function pose(m,a,t=0,action=a?.action||"idle",o={}){
    if(!m||!a)return false;const role=roleFor(a,o),motion=gait(a,t),last=m.palmPose;
    if(last?.a===a&&last.t===t&&last.action===action&&last.angle===o.angle&&last.draw===o.draw&&last.stroke===o.stroke&&last.settle===o.settle&&last.rev===motion.revision)return false;
    const skin=m.skin;m.skin=noSkin;m.lastRevision=-1;
    try{m.update(motion);}finally{m.skin=skin;}
    const original=palms(m),shoot=(action==="aim"||action==="stroke")&&o.table&&o.cue&&Number.isFinite(o.angle);
    const plot=shoot?shotPose(m,a,action,o,limit(o.settle??1),original):carryPose(m,a,t,role,action,o,original);
    if(!m.palmSketch)m.skin();
    m.palmPose={...plot,a,t,action,role,angle:o.angle,draw:o.draw,stroke:o.stroke,settle:o.settle,rev:motion.revision,
      finish:role==="player"&&o.houseCue?"house":cueFinishes[role]?role:"player",hands:palms(m)};
    if(!m.palmSketch)nativeRigs.set(a,m);return true;
  }
  function rigFor(a,t,action,o,provided){
    const near=provided||nativeRigs.get(a),p=near?.palmPose;
    if(p?.a===a&&p.t===t&&p.action===action&&p.angle===o.angle&&p.draw===o.draw&&p.stroke===o.stroke&&p.settle===o.settle)return near;
    let m=sketches.get(a);if(!m){const role=roleFor(a,o);m=new BayPlayerMesh(o.colors||colors[role]||colors.player,role==="player"?"driver":"local");m.palmSketch=true;sketches.set(a,m);}
    pose(m,a,t,action,o);return m;
  }
  function emit(list,id,f){if(f)list.push([name(id),f.x,f.y,f.z,f.yaw||0,f.pitch||0,f.roll||0]);}
  function props(list,a,t=0,action=a?.action||"idle",o={},mesh){
    if(!a)return;const p=rigFor(a,t,action,o,mesh).palmPose,r=colors[p.role]?p.role:"player";
    emit(list,"cue-"+p.finish,p.cue);
    if(p.cue&&p.extension){const e=at(p.cue,0,0,-1.468);emit(list,"extension-"+p.extension,turnFrame(e,p.cue.yaw,p.cue.pitch));}
    emit(list,"rest",p.rest);emit(list,"cross",p.cross);emit(list,"mug",p.mug);emit(list,"chalk",p.chalk);
    emit(list,"bridge-"+r+(-p.hand),p.bridge);emit(list,"grip-"+r+p.hand,p.grip);
  }
  function far(list,a,role){
    if(!farModel||!a)return;
    const r=roleFor(a,{role}),style=a.base?.style||0,palette=colors[r]||sidewalkColors[style]||sidewalkColors[0];
    const sitting=a.action==="sit"||a.action==="sip",id="far-"+(r==="guest"?"guest"+style:r)+(sitting?"-booth":"");
    if(!distant.has(id)){farModel(name(id),g=>farActor(g,r,palette,sitting));distant.add(id);}
    const p=sitting?{...a,y:(a.posture?.seat?.y??((a.y||0)+.49))-.49}:a;emit(list,id,p);
  }

  function projected(ctx,project,s,a,t=0,action=a?.action||"idle",o={}){
    if(!a)return;
    const m=rigFor(a,t,action,o),p=m.palmPose,r=p.role,cols=o.colors||colors[r]||colors.player;
    const uniform=r==="player"&&window.BayCourtPlayers?.kits?.[o.kit||a.kit];
    const skin=cols[0],top=uniform?.body||cols[1],pants=uniform?.short||cols[2],small=s<12,close=s>47;
    const hair=r==="luz"?"#694938":r==="val"?"#493b41":r==="boone"?"#ae6748":r==="player"?"#302e37":
      parseInt(top.slice(-2),16)%2?"#543a36":"#32323b";
    const screen=q=>{const v=project(q.x,q.y,q.z);return Array.isArray(v)?v:v?[v.x,v.y]:null;};
    const bone=(b,x,y,z)=>at(a,...b.map([x,y,z],[])),body=(x,y,z)=>bone(m.chest,x,y,z),head=(x,y,z)=>bone(m.head,x,y,z);
    function fill(points,col){const v=points.map(screen);if(v.some(q=>!q))return;ctx.fillStyle=col;ctx.beginPath();v.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.closePath();ctx.fill();}
    function line(points,w,col,min=.44){const v=points.map(screen);if(v.some(q=>!q))return;ctx.strokeStyle=col;ctx.lineWidth=Math.max(min,w*s);ctx.beginPath();v.forEach((q,i)=>i?ctx.lineTo(...q):ctx.moveTo(...q));ctx.stroke();}
    const cap=(f,x,y,z,w,d,n=13)=>oval(x,y,z,w,d,n).map(v=>f(...v));
    ctx.save();ctx.lineJoin="round";ctx.lineCap="round";
    if(small){
      if(p.cue)line([p.cue,at(p.cue,0,0,-1.465-.24*(p.extension||0))],.020,"#d5b683",.55);
      line([bone(m.pelvis,0,.954,0),body(0,1.39,0)],.33,top,1.1);
      line([head(0,1.674,-.02),head(0,1.718,.032)],.170,hair,.95);ctx.restore();return;
    }
    for(const l of m.sides){
      const k=l.side,b=(x,y,z)=>bone(l.thigh,x,y,z),c=(x,y,z)=>bone(l.shin,x,y,z),f=(x,y,z)=>bone(l.shoe,x,y,z);
      const hip=b(k*.101,.962,-.002),knee=c(k*.109,.552,.014),ank=c(k*.111,.171,.002);
      line([hip,knee],uniform?.153:.166,uniform?skin:pants);line([knee,ank],.118,uniform?skin:pants);
      if(uniform){line([hip,b(k*.105,.765,0)],.172,uniform.short);line([c(k*.110,.266,0),ank],.100,ivory);}
      line([f(k*.111,.078,-.059),f(k*.111,.077,.130)],.118,uniform?.shoe||(r==="boone"?"#886d53":"#87938b"));
      if(close){
        const seam=uniform?uniform.ink:shade(pants,-.14);
        line([b(k*.155,.883,.006),b(k*.158,.745,.010)],.009,seam);
        line([f(k*.153,.098,-.047),f(k*.153,.095,.051),f(k*.127,.092,.109)],.013,uniform?.heel||"#abae94",.55);
      }
    }
    if(p.rest){const f=(x,y,z)=>at(p.rest,x,y,z),head=(x,y,z)=>at(p.cross,x,y,z);
      line([f(0,-.019,-.016),f(0,-.012,-1.43)],.022,"#bf9e6b",.9);
      for(const k of sideList)line([head(k*.042,-.039,0),head(k*.009,-.009,0),head(-k*.025,.013,0)],.012,"#c6a96b",.7);
    }
    if(p.cue){
      const q=p.cue,f=z=>at(q,0,0,z),[butt,wrap,splice]=cueFinishes[p.finish];
      line([f(0),f(-.730)],.0155,"#dec18a",1);line([f(0),f(-.007)],.012,"#5699a6",.8);
      line([f(-.007),f(-.024)],.0127,ivory,.86);
      line([f(-.730),f(-.936)],.023,butt,1.15);line([f(-.754),f(-.868)],.008,splice,.62);
      line([f(-.936),f(-.952)],.025,p.finish==="house"?"#6da591":ivory,1);
      line([f(-.954),f(-1.223)],.028,wrap,1.19);line([f(-1.226),f(-1.448)],.029,butt,1.22);
      if(close)for(const z of [-1.264,-1.391])line([f(z),f(z-.010)],.029,p.finish==="house"?"#79b5a3":brass,.7);
      line([f(-1.449),f(-1.466)],.028,ivory,.8);
      if(p.extension)line([f(-1.468),f(-1.468-p.extension*.24)],.029,"#8c6951",1);
    }
    const hip=(x,y,z)=>bone(m.pelvis,x,y,z);
    line([hip(0,.966,0),body(0,1.362,0)],.290,top);
    for(const k of sideList){
      fill([hip(k*.150,.962,-.089),hip(k*.150,.962,.089),body(k*.189,1.398,.081),body(k*.189,1.398,-.081)],top);
      fill([hip(-.147,.965,k*.089),hip(.147,.965,k*.089),body(.189,1.396,k*.084),body(-.189,1.396,k*.084)],top);
    }
    fill([[-.185,1.386,.096],[-.191,1.413,-.075],[-.104,1.431,-.108],[.104,1.431,-.108],
      [.191,1.413,-.075],[.185,1.387,.096],[.08,1.423,.096],[-.08,1.423,.096]].map(v=>body(...v)),top);
    if(close){
      fill([body(-.186,1.406,-.069),body(-.170,1.365,-.106),body(-.103,1.361,-.113),body(-.071,1.422,-.104)],shade(top,.13));
      line([body(-.139,1.013,-.091),body(-.091,1.021,-.106),body(.111,1.011,-.094)],.009,shade(top,-.19));
      if(r==="player"&&!uniform){
        for(const [x,y,flip] of [[-.062,1.309,-1],[.073,1.228,1],[-.053,1.10,-1],[.071,1.035,1]]){
          fill([body(x-.012*flip,y-.029,-.118),body(x+.001*flip,y+.006,-.12),body(x+.042*flip,y+.041,-.119),body(x+.016*flip,y+.001,-.12)],"#a4b698");
          fill([body(x,y+.005,-.121),body(x-.035*flip,y+.025,-.121),body(x-.027*flip,y+.040,-.121)],"#d8a289");
        }
      }
      if(uniform){
        for(const k of sideList)line([body(k*.133,1.378,-.091),body(k*.139,1.256,-.113),body(k*.113,1.021,-.107)],.027,uniform.side);
        line([body(-.057,1.264,-.127),body(-.038,1.275,-.127),body(-.038,1.144,-.127)],.010,uniform.pale);
        line([body(.023,1.276,-.127),body(.002,1.190,-.127),body(.066,1.190,-.127)],.010,uniform.pale);
        line([body(.050,1.274,-.127),body(.050,1.143,-.127)],.010,uniform.pale);
      }
    }
    if(r==="luz")for(const k of sideList){
      line([body(k*.154,1.393,-.100),body(k*.056,1.302,-.117),body(k*.108,1.050,-.115)],.021,"#cc9366");
      line([body(k*.099,1.404,.103),body(k*.055,1.358,.124)],.018,"#c7865b");}
    if(r==="val"){line([body(-.158,1.389,-.099),body(0,1.306,-.116),body(.155,1.389,-.100)],.015,"#c8d4c9");
      line([body(-.130,1.34,.127),body(-.046,1.34,.127)],.021,ivory);}
    if(r==="boone")for(const k of sideList){
      line([body(k*.123,1.408,-.110),body(-k*.095,1.001,-.113)],.032,"#596f6c");
      line([body(k*.125,1.404,.106),body(k*.082,1.051,.117)],.036,"#627672");}
    if(uniform)for(const k of sideList)line([body(k*.173,1.412,-.065),body(k*.118,1.423,.072)],.027,uniform.trim);
    for(let i=0;i<2;i++){
      const l=m.sides[i],k=l.side,sh=bone(l.arm,k*.204,1.410,-.004),el=bone(l.forearm,k*.249,1.185,0),palm=at(a,...p.hands[i]);
      line([sh,el,palm],.077,skin);line([sh,bone(l.arm,k*.237,1.277,.0)],.133,top);
      if(close){
        const cuff=bone(l.arm,k*.251,1.282,-.027);
        line([bone(l.arm,k*.240,1.368,-.043),cuff],.019,shade(top,.12));
        line([bone(l.forearm,k*.263,1.156,-.017),bone(l.forearm,k*.256,1.028,.028)],.013,shade(skin,-.14));
      }
      if(r==="luz"||r==="boone"||uniform)line([bone(l.arm,k*.236,1.293,0),bone(l.arm,k*.237,1.273,0)],.111,uniform?.trim||(r==="luz"?"#dda266":"#c3c49e"));
    }
    if(p.bridge){const f=(x,y,z)=>at(p.bridge,-p.hand*x,y,z);
      fill([f(.018,-.025,-.021),f(.080,-.031,-.028),f(.087,-.022,-.071),f(.054,-.008,-.100),f(.024,-.009,-.071)],skin);
      for(const [x,z] of [[.078,.036],[.055,.059],[.026,.067],[.017,.047]])line([f(x,-.021,-.029),f(x*.84,-.025,.007),f(x,-.036,z)],.015,skin,.45);
      line([f(.046,-.015,-.051),f(.011,-.010,-.035),f(-.015,-.005,-.010)],.015,skin,.42);
    }
    if(p.grip&&close){const f=(x,y,z)=>at(p.grip,p.hand*x,y,z);
      for(let i=0;i<4;i++)line([f(.035,-.007,.024-.016*i),f(.014,-.025,.026-.016*i),f(-.012,-.009,.024-.016*i)],.0125,skin);
      line([f(.026,.001,-.015),f(.013,.012,.019),f(-.008,.011,.027)],.015,skin);}
    fill(cap(head,0,1.663,.005,.108,.110),skin);
    if(close){
      fill([head(-.080,1.654,.059),head(-.021,1.640,.107),head(.009,1.602,.125),head(-.010,1.596,.096),head(-.065,1.605,.072)],shade(skin,-.14));
      for(const k of sideList){fill(cap(head,k*.101,1.634,.004,.016,.030,8),shade(skin,.09));
        line([head(k*.067,1.667,.094),head(k*.031,1.670,.103)],.010,hair,.58);}
    }
    fill(cap(head,r==="val"?-.012:0,1.726,-.014,.110,.110),hair);
    if(close){
      fill([head(-.092,1.732,-.052),head(-.045,1.759,-.076),head(.029,1.754,-.085),
        head(.07,1.738,-.053),head(.002,1.760,-.056),head(-.045,1.748,-.037)],shade(hair,.18));
      line([head(-.075,1.736,-.012),head(-.036,1.765,-.010),head(.010,1.755,.034),head(.030,1.739,.059)],.009,shade(hair,.14));
    }
    if(r==="luz"){
      line([head(-.101,1.680,-.024),head(-.095,1.697,.048),head(-.038,1.715,.105),head(.048,1.707,.091),head(.103,1.682,.01)],.026,"#c77655");
      fill([head(-.089,1.711,.073),head(-.151,1.764,.088),head(-.145,1.719,.099),head(-.165,1.677,.095),head(-.113,1.706,.090)],"#cc7a5a");
      for(const k of sideList)line([head(k*.107,1.596,.004),head(k*.106,1.563,.008)],.009,brass,.48);
    }else if(r==="val"){
      fill(cap(head,-.055,1.747,.059,.045,.031,9),"#624948");fill(cap(head,-.085,1.715,.047,.030,.040,9),"#5c4344");
      line([head(-.098,1.661,.055),head(-.070,1.672,.102),head(-.027,1.663,.112),head(.021,1.665,.112),head(.072,1.672,.104),head(.097,1.664,.058)],.010,"#895964");
    }else if(r==="boone"){
      fill(cap(head,-.012,1.761,-.021,.100,.101,14),"#ad6549");line([head(-.105,1.678,.023),head(-.068,1.689,.095),head(.032,1.686,.112),head(.105,1.681,.029)],.022,"#95583f");
      line([head(-.065,1.770,-.002),head(-.030,1.789,-.035),head(.031,1.766,-.054)],.008,"#cb8960");}
    if(p.mug){const f=(x,y,z)=>at(p.mug,x,y,z);
      line([f(.041,.032,0),f(.073,.022,0),f(.067,-.010,0),f(.040,-.023,0)],.013,"#d9cca9",.7);
      fill(cap(f,0,.042,0,.047,.047,14),ivory);fill(cap(f,0,.051,0,.038,.038,14),"#694d3e");
    }
    if(p.chalk){const f=(x,y,z)=>at(p.chalk,x,y,z);fill([f(-.013,0,-.011),f(.013,0,-.011),f(.013,.020,.011),f(-.013,.020,.011)],"#73a4a4");}
    ctx.restore();
  }
  function map(ctx,opt,px,py,s,a,t=0,action=a?.action||"idle",o={}){
    if(!a||opt.mode==="radar"||opt.mode==="atlas")return;
    const ground=o.ground??a.y??0,rot=opt.rotation||0,dx=Math.sin(rot)*.35,dz=Math.cos(rot)*.35;
    const project=(x,y,z)=>[px(x)+(y-ground)*s*dx,py(z)-(y-ground)*s*dz];
    const car=o.car||a.ride,ride=a.motion?.ride;
    ctx.save();
    if(car?.kind&&ride){
      const spec=bayCarLayout(car.kind),glass=spec.glass,side=ride.side||1,r=roleFor(a,o),skin=(o.colors||colors[r]||colors.player)[0];
      const c=Math.cos(car.yaw),sn=Math.sin(car.yaw);
      const cv=(x,z)=>[px(car.x+c*x+sn*z),py(car.z-sn*x+c*z)];
      const shape=arr=>{arr.forEach(([x,z],i)=>i?ctx.lineTo(...cv(x,z)):ctx.moveTo(...cv(x,z)));ctx.closePath();};
      if(ride.seat>.38){
        ctx.save();ctx.beginPath();shape([[-glass[6],glass[3]],[glass[6],glass[3]],[glass[7],glass[2]],[-glass[7],glass[2]]]);ctx.clip();
        ctx.globalAlpha*=smooth(.38,.83,ride.seat);const x=side*spec.seatX,z=mix(glass[2],glass[3],.38);
        function ellipse(cx,cz,rx,rz,col){ctx.fillStyle=col;ctx.beginPath();shape(Array.from({length:12},(_,i)=>[cx+rx*Math.cos(i*tau/12),cz+rz*Math.sin(i*tau/12)]));ctx.fill();}
        ellipse(x,z,.16,.104,(o.colors||colors[r]||colors.player)[1]);ellipse(x,z+.043,.097,.096,skin);
        ellipse(x,z-.010,.102,.101,r==="boone"?"#a76346":r==="luz"?"#664b3e":"#493c42");
        if(r==="luz")ellipse(x-.037,z+.027,.059,.024,"#be7759");ctx.fillStyle="rgba(109,153,154,.2)";
        const mid=cv(0,glass[2]);ctx.fillRect(mid[0]-3*s,mid[1]-3*s,6*s,6*s);ctx.restore();
      }
      if(ride.seat>.985){ctx.restore();return;}
      if(ride.seat>.13){const mid=cv(0,0),b=spec.track*.92;ctx.beginPath();ctx.rect(mid[0]-7*s,mid[1]-7*s,14*s,14*s);
        shape([[-b,-spec.halfLength+.23],[-b,glass[3]],[b,glass[3]],[b,-spec.halfLength+.23]]);ctx.clip("evenodd");}
    }
    projected(ctx,project,s,a,t,action,o);ctx.restore();
  }
  window.BayPalmPlayers=Object.freeze({colors,dress,install,stance,pose,props,projected,map,far});
})();
