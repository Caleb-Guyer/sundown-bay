/* Rescue Four's folding cot and the people who work the county receiving run. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const mix=(a,b,u)=>a+(b-a)*u,smooth=(a,b,n)=>{const u=clamp((n-a)/(b-a));return u*u*(3-2*u);};
  const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const colors={
    medic:["#ac785d","#456f78","#3d5059"],driver:["#81573f","#658188","#374952"],
    dispatcher:["#805743","#b99373","#5d6669"],skater:["#ab7456","#ce7e65","#525979"],
    fishmonger:["#875c49","#7b9791","#4d6772"],gardener:["#b68c68","#a39c6e","#736754"],
    player:["#af7353","#30a292","#eff1d1"]
  };
  const patientRoles=["skater","fishmonger","gardener"];
  const steel="#8d9c94",shine="#c5cdc0",graphite="#3b4a49",rubber="#384442",amber="#daaa57",cuff="#6f8076",
    blue="#4c777f",seam="#9ab6ad",linen="#ddd9be",blanket="#b4c4ad",stripe="#689087",belt="#465d5b",cream="#efddb3";
  const spec=Object.freeze({rollingHeight:.94,railHeight:.24,halfLength:.98,halfWidth:.34,
    footGrip:-.939,headGrip:.939,gripX:.228,gripY:.052,sideX:.328,sideZ:.158,rollerRadius:.054,casterRadius:.073});
  const groundOf=c=>Number.isFinite(c.ground)?c.ground:(c.y??spec.rollingHeight)-spec.rollingHeight;
  function point(c,x=0,y=0,z=0){
    const cs=Math.cos(c.yaw||0),sn=Math.sin(c.yaw||0);
    return {x:c.x+cs*x+sn*z,y:(c.y??spec.rollingHeight)+y,z:c.z-sn*x+cs*z};
  }
  function handler(c,end="foot",ground=groundOf(c)){
    const q=end==="side"?point(c,.612,0,spec.sideZ):point(c,0,0,end==="head"?1.218:-1.218);
    return {...q,y:ground,yaw:(c.yaw||0)+(end==="head"?pi:end==="side"?-pi/2:0)};
  }
  function handles(c,end="foot"){
    if(end==="side")return [-1,1].map(side=>point(c,spec.sideX,.083,spec.sideZ+side*.143));
    const dir=end==="head"?1:-1;
    return [-1,1].map(side=>point(c,-side*dir*spec.gripX,spec.gripY,dir*spec.headGrip));
  }
  const roleOf=c=>c.patient?.palette?"street":patientRoles.includes(c.patient?.role)?c.patient.role:patientRoles.includes(c.patientRole)?c.patientRole:"skater";
  const key=n=>"rescue-crew/"+n;
  function box(g,x,y,z,w,h,d,color){g.box(x,y,z,w,h,d,color);}
  function rod(g,a,b,r,col,n=7){g.pole(a,b,r,col,n);}
  function rail(g,points,r,col,n=7){for(let i=1;i<points.length;i++)rod(g,points[i-1],points[i],r,col,n);}
  function cap(g,poly,col){for(let i=1;i<poly.length-1;i++)g.tri(poly[0],poly[i],poly[i+1],col);}
  function shell(g,lo,hi,face,side){
    cap(g,hi,face);cap(g,lo.slice().reverse(),side);
    for(let i=0;i<lo.length;i++){const j=(i+1)%lo.length;g.quad(lo[i],lo[j],hi[j],hi[i],side);}
  }
  function pad(g,hw,z0,z1,y,thick,face,side){
    const k=.069,w=hw,q=[[-w+k,z0],[-w,z0+k],[-w,z1-k],[-w+k,z1],[w-k,z1],[w,z1-k],[w,z0+k],[w-k,z0]];
    const top=q.map(([x,z])=>[x,y(z),z]),lo=top.map(([x,h,z])=>[x,h-thick,z]);
    shell(g,lo,top,face,side);
    for(let i=0;i<top.length;i++)rod(g,top[i],top[(i+1)%top.length],.006,seam,4);
  }
  const headY=z=>.012+(z-.205)*.249;
  function wheel(g,x,y,z,r,width,steelWheel=false){
    const pt=(u,rr,side)=>[x+side*width*.5,y+Math.cos(u)*rr,z+Math.sin(u)*rr];
    const lo=[],hi=[],n=12;
    for(let i=0;i<n;i++){const a=tau*i/n;lo.push(pt(a,r,-1));hi.push(pt(a,r,1));}
    shell(g,lo,hi,steelWheel?"#788e82":rubber,steelWheel?graphite:"#43514d");
    for(const sign of [-1,1]){
      const at=x+sign*(width*.5+.001),disc=[];
      for(let i=0;i<n;i++)disc.push([at,y+Math.cos(tau*i/n)*r*.66,z+Math.sin(tau*i/n)*r*.66]);
      cap(g,disc,steelWheel?shine:steel);
      if(!steelWheel)for(let i=0;i<3;i++){
        const a=(i+.12)*tau/3;
        g.tri([at+sign*.0013,y+Math.cos(a)*r*.31,z+Math.sin(a)*r*.31],
          [at+sign*.0013,y+Math.cos(a+.48)*r*.57,z+Math.sin(a+.48)*r*.57],
          [at+sign*.0013,y+Math.cos(a+1.37)*r*.53,z+Math.sin(a+1.37)*r*.53],cuff);
      }
    }
  }
  function cotFrame(g){
    pad(g,.297,-.89,.197,()=>0,.076,blue,"#42636a");
    pad(g,.293,.207,.885,headY,.064,"#698d90","#496e74");
    for(const side of [-1,1]){
      const x=side*.294;
      rod(g,[x,-.106,-.853],[x,-.106,.868],.022,shine,8);
      const r=side*spec.sideX;
      rail(g,[[r,-.087,-.404],[r,.025,-.404],[r,.083,-.351],[r,.083,.427],[r,.035,.478],[r,-.079,.478]],.0165,steel);
      rod(g,[r,.083,-.139],[r,.083,.336],.022,"#435f60",8);
      rod(g,[r,-.036,-.338],[r,-.036,.402],.0095,cuff,6);
      for(const z of [-.394,.468])box(g,side*.310,-.078,z,.064,.072,.084,graphite);
      box(g,side*.277,-.107,.334,.060,.092,.175,amber);box(g,side*.310,-.107,.334,.009,.064,.131,cream);
      // The side casting is stamped 4. It remains readable when the legs fold under the deck.
      const at=(z,y)=>[side*.316,y,z];
      rail(g,[at(.359,-.083),at(.361,-.109),at(.307,-.109)],.0037,graphite,4);
      rod(g,at(.319,-.084),at(.319,-.132),.004,graphite,4);
      for(const z of [-.71,.65])box(g,side*.224,-.132,z,.103,.043,.183,cuff);
      rail(g,[[side*.235,-.14,-.676],[side*.235,-.188,-.618],[side*.235,-.212,.637],[side*.235,-.182,.73]],.015,shine,6);
      const rx=side*.213;
      wheel(g,rx,-.186,.813,spec.rollerRadius,.062,true);
      for(const xx of [rx-.039,rx+.039])rod(g,[xx,-.119,.762],[xx,-.186,.813],.009,steel,6);
      for(const z of [-.62,-.19,.31,.60]){
        const y=z>.2?headY(z)-.03:-.036;box(g,side*.293,y,z,.012,.019,.031,seam);
      }
    }
    for(const dir of [-1,1]){
      const z=dir*spec.headGrip;
      const bend=[[.287,-.101,dir*.814],[.287,-.015,dir*.904],[.272,.048,z],[.246,.052,z],[-.246,.052,z],[-.272,.048,z],[-.287,-.015,dir*.904],[-.287,-.101,dir*.814]];
      rail(g,bend,.019,steel,7);
      for(const s of [-1,1])rod(g,[s*.156,.052,z],[s*.257,.052,z],.0245,rubber,8);
      if(dir<0){box(g,-.131,.026,z,.083,.040,.027,amber);box(g,.101,-.105,z+.058,.074,.022,.072,"#a85e48");}
      rod(g,[-.270,-.127,dir*.760],[.270,-.127,dir*.760],.016,graphite);
    }
    box(g,0,-.088,.040,.524,.014,.080,cuff);
    const pillow=(x,z)=>[x,headY(z)+.037+.024*(1-clamp(Math.abs(x)/.220)),z];
    const edge=[[-.179,.598],[-.227,.629],[-.220,.824],[-.181,.862],[.167,.863],[.223,.818],[.216,.630],[.176,.595]];
    const ring=edge.map(([x,z])=>pillow(x,z)),bot=ring.map(([x,y,z])=>[x,y-.036,z]);
    shell(g,bot,ring,"#dedfc9","#afbfaf");
    g.tri(pillow(-.133,.633),pillow(-.079,.613),pillow(-.152,.607),"#bec9b8");
    g.tri(pillow(.154,.805),pillow(.117,.848),pillow(.161,.847),"#bdc9b6");
    // A folded towel and loose buckles sit against the empty mattress.
    for(const s of [-1,1])for(const z of [-.55,.004])box(g,s*.288,-.035,z,.034,.024,.057,graphite);
  }
  const strutLength=1.184,upperPivot=-.111;
  function geometry(c){
    const f=clamp(c.fold||0),axle=mix(-spec.rollingHeight+spec.casterRadius,-spec.railHeight+spec.casterRadius,f);
    const hinge=axle+mix(.110,.035,f),rise=upperPivot-hinge,span=Math.sqrt(strutLength*strutLength-rise*rise);
    return {axle,hinge,rise,span,half:span*.5,pitch:Math.atan2(rise,span),mid:(upperPivot+hinge)*.5};
  }
  function brace(g,dark){
    const x=dark?.245:.272,r=dark?.016:.020,col=dark?steel:amber;
    for(const s of [-1,1]){
      rod(g,[s*x,0,0],[s*x,0,strutLength],r,col,7);
      for(const z of [.01,strutLength-.012])box(g,s*x,0,z,.050,.050,.046,graphite);
      rod(g,[s*x,0,.594],[s*x,0,.655],r+.005,dark?graphite:"#958652",7);
      if(!dark){rod(g,[s*x,0,.182],[s*x,0,.279],r+.002,cream,7);rod(g,[s*x,0,.205],[s*x,0,.217],r+.0026,"#5f7271",7);}
    }
    rod(g,[-x,0,.143],[x,0,.143],.012,steel,6);
  }
  function pins(g){
    for(const s of [-1,1]){
      rod(g,[s*.232,0,0],[s*.293,0,0],.025,graphite,8);
      rod(g,[s*.288,0,0],[s*.299,0,0],.018,shine,7);
    }
  }
  function trucks(g){
    rod(g,[-.255,0,0],[.255,0,0],.012,steel,6);
    for(const s of [-1,1]){
      box(g,s*.251,.002,-.012,.072,.037,.079,graphite);
      for(const k of [-1,1])rod(g,[s*.252+k*.026,.011,-.012],[s*.252+k*.030,-.043,.023],.008,steel,5);
    }
  }
  function tires(g){for(const s of [-1,1])wheel(g,s*.253,0,0,spec.casterRadius,.043);}
  const coverSections=[[-.696,.207,.198],[-.60,.231,.245],[-.496,.245,.310],[-.392,.252,.356],
    [-.307,.248,.347],[-.145,.244,.288],[-.046,.235,.272],[.071,.233,.303],[.185,.218,.310]];
  function clothRing(z,offset=0){
    const hi=coverSections.findIndex(row=>row[0]>=z),j=hi<0?coverSections.length-1:Math.max(1,hi);
    const a=coverSections[j-1],b=coverSections[j],u=clamp((z-a[0])/(b[0]-a[0])),w=mix(a[1],b[1],u),h=mix(a[2],b[2],u);
    const knee=Math.exp(-Math.pow((z+.37)/.21,2));
    return [[-w,.051],[-w+.016,.095],[-w+.058,h-.065],[-w+.109,h-.02-.023*knee],
      [-.045,h], [.095,h+.009*knee],[w-.046,h-.037],[w-.013,.119],[w,.047]]
      .map(([x,y])=>[x,y+offset,z+.005*Math.sin(15*x+z*6)]);
  }
  function cover(g){
    const rings=coverSections.map(row=>clothRing(row[0]));
    for(let i=1;i<rings.length;i++)for(let j=1;j<rings[i].length;j++){
      g.quad(rings[i-1][j-1],rings[i-1][j],rings[i][j],rings[i][j-1],
        [0,1,7].includes(j-1)?"#92a894":j===4?"#bbcab2":blanket);
    }
    cap(g,rings[0].slice().reverse(),stripe);cap(g,rings.at(-1),linen);
    for(const z of [.130,-.644]){
      const a=clothRing(z,.003),b=clothRing(z+.025,.003);
      for(let j=1;j<a.length;j++)g.quad(a[j-1],a[j],b[j],b[j-1],stripe);
    }
    for(const z of [-.522,-.044]){
      const a=clothRing(z,.006),b=clothRing(z+.038,.006),high=(a[5][1]+b[5][1])*.5;
      for(let j=1;j<a.length;j++)g.quad(a[j-1],a[j],b[j],b[j-1],belt);
      for(const s of [-1,1])g.quad([s*.288,-.024,z-.012],a[s<0?0:8],b[s<0?0:8],[s*.288,-.024,z+.029],belt);
      box(g,.094,high+.006,z+.024,.051,.012,.038,shine);
      box(g,.094,high+.014,z+.024,.027,.005,.022,graphite);
    }
    for(const [z,j] of [[-.347,4],[-.124,3],[.083,4]]){
      const a=clothRing(z,.003)[j],b=clothRing(z+.045,.006)[j];
      g.tri(a,[b[0]+.014,b[1],b[2]],clothRing(z+.082,.002)[j],"#9eaf99");
    }
  }
  function front(g,vertices,col,back=false,off=.006){
    cap(g,vertices.map(([x,y])=>[x,y,(back?-1:1)*(.104+(y-.957)*.031+off)]),col);
  }
  function glasses(g,lens){
    for(const s of [-1,1]){
      box(g,s*.041,1.641,.108,.069,.036,.011,"#65594b");
      box(g,s*.041,1.641,.116,.054,.022,.005,lens);
      rod(g,[s*.073,1.642,.107],[s*.109,1.647,.007],.004,"#8d8069",5);
    }
    rod(g,[-.011,1.643,.112],[.011,1.643,.112],.004,"#998e72",5);
  }
  function uniform(g,mark,driver){
    mark("body");const blueGray=driver?"#627a80":"#446975",pale="#bccdb9";
    for(const back of [false,true]){
      front(g,[[-.17,1.42],[.17,1.42],[.14,1.32],[-.15,1.32]],blueGray,back);
      front(g,[[-.15,1.332],[.15,1.332],[.15,1.317],[-.15,1.317]],pale,back,.010);
      for(const s of [-1,1])front(g,[[s*.087,1.426],[s*.137,1.426],[s*.086,1.324],[s*.048,1.324]],pale,back,.012);
    }
    for(const s of [-1,1]){
      front(g,[[s*.138,1.275],[s*.049,1.275],[s*.051,1.206],[s*.094,1.19],[s*.132,1.204]],"#475e66",false,.012);
      front(g,[[s*.138,1.275],[s*.047,1.275],[s*.086,1.25],[s*.132,1.258]],"#77908c",false,.014);
    }
    box(g,.098,1.299,.126,.068,.012,.009,"#d0bd8e");
    front(g,[[-.056,1.417],[0,1.373],[.052,1.417],[.035,1.359],[0,1.338],[-.038,1.364]],"#344c59",false,.013);
    front(g,[[-.162,1.012],[.162,1.012],[.160,.978],[-.16,.978]],"#414f50",false,.015);
    box(g,.132,1.003,-.074,.069,.095,.085,"#3a4a4c");
    box(g,-.129,1.27,.131,.057,.084,.036,"#38474a");
    for(let j=0;j<3;j++)box(g,-.129,1.275+j*.008,.152,.035,.003,.004,"#83938a");
    rod(g,[-.141,1.299,.135],[-.149,1.359,.125],.004,"#374c50",5);
    mark("arm",-1);
    box(g,-.287,1.327,.001,.011,.053,.058,"#c6c7a0");
    box(g,-.294,1.327,.001,.006,.036,.034,"#63888b");
    box(g,-.242,1.047,.044,.082,.024,.083,"#455658");
    if(driver){
      mark("head");glasses(g,"#586565");
      g.cyl(0,1.729,-.010,.107,.118,.061,12,"#566d72");
      g.box(.003,1.711,.098,.174,.014,.088,"#405c64",.035);
      box(g,0,1.738,.098,.037,.018,.009,"#c7c3a4");
    }else{
      mark("head");
      g.cyl(.009,1.655,-.118,.065,.055,.076,10,"#473e3c");
      g.cyl(.021,1.611,-.131,.046,.062,.052,9,"#51413c");
      g.cyl(.025,1.586,-.134,.024,.042,.019,8,"#689792");
      g.cyl(.034,1.563,-.137,.013,.025,.039,7,"#4d403b");
      front(g,[[-.078,1.705],[-.017,1.738],[.071,1.716],[.028,1.704],[-.023,1.713]],"#51433e",false,.006);
    }
  }
  function officeWear(g,mark){
    mark("body");
    for(const s of [-1,1]){
      front(g,[[s*.156,1.423],[s*.084,1.426],[s*.030,1.267],[s*.029,1.012],[s*.145,1.035]],"#5b7775");
      front(g,[[s*.128,1.42],[s*.108,1.424],[s*.080,1.294],[s*.091,1.300]],"#a0a494",false,.010);
    }
    front(g,[[-.13,1.422],[.136,1.422],[.142,1.025],[-.145,1.025]],"#637b76",true);
    box(g,.094,1.289,.126,.076,.040,.008,cream);
    mark("head");glasses(g,"#a9afa2");
    for(const s of [-1,1])box(g,s*.111,1.637,-.013,.031,.073,.052,"#485454");
    rail(g,[[-.116,1.656,-.017],[-.091,1.735,-.016],[0,1.758,-.021],[.095,1.734,-.016],[.116,1.655,-.017]],.008,"#667477",6);
    rail(g,[[.117,1.635,-.006],[.124,1.603,.052],[.087,1.593,.110]],.004,graphite,6);
    box(g,.082,1.592,.113,.023,.014,.013,"#445252");
  }
  function skating(g,mark){
    mark("body");
    for(const [dx,dy,col] of [[-.012,.027,"#e5c59b"],[.010,0,"#668789"]]){
      front(g,[[-.119+dx,1.272+dy],[-.050+dx,1.305+dy],[-.007+dx,1.281+dy],[.087+dx,1.302+dy],[.034+dx,1.258+dy],[-.011+dx,1.256+dy],[-.060+dx,1.272+dy]],col);
    }
    for(const back of [true,false]){
      front(g,[[-.153,1.059],[.147,1.046],[.153,.993],[-.152,1.004]],"#6b8778",back,.012);
      front(g,[[-.15,1.034],[.149,1.018],[.148,1.009],[-.148,1.024]],"#cec1a1",back,.014);
    }
    for(const s of [-1,1]){
      mark("leg",s);
      front(g,[[s*.042,1.045],[s*.103,1.040],[s*.142,.870],[s*.104,.847]],"#64846e",false,.030);
      for(let j=0;j<2;j++)box(g,s*.111,.115,.083+j*.032,.070,.012,.012,"#d8ad76");
    }
    mark("head");
    g.cyl(-.007,1.725,-.012,.101,.116,.063,11,"#9b6c64");g.cyl(-.011,1.761,-.016,.063,.100,.021,11,"#b57b68");
    g.cyl(-.003,1.704,-.010,.118,.118,.022,12,"#c38c71");box(g,.066,1.710,.088,.023,.019,.011,"#f2d9af");
  }
  function market(g,mark){
    mark("body");
    for(const back of [false,true]){
      front(g,[[-.147,1.276],[-.074,1.309],[.073,1.308],[.148,1.271],[.151,.955],[-.151,.955]],"#496c76",back);
      for(const s of [-1,1])front(g,[[s*.136,1.425],[s*.112,1.428],[s*.077,1.289],[s*.109,1.278]],"#c3bda0",back,.011);
    }
    front(g,[[-.099,1.161],[.102,1.161],[.096,1.068],[.013,1.044],[-.096,1.065]],"#607f83",false,.011);
    for(const s of [-1,1]){
      mark("leg",s);box(g,s*.111,.29,-.005,.121,.237,.136,"#596b65");
      box(g,s*.111,.390,-.006,.128,.024,.141,"#c3c2a6");
    }
    mark("head");g.cyl(0,1.737,-.008,.095,.117,.070,12,"#ad795d");
    g.cyl(0,1.776,-.014,.042,.095,.028,12,"#be8b68");g.cyl(0,1.706,-.007,.119,.117,.036,12,"#ca9875");
    for(let q=0;q<12;q++){const a=q*tau/12;rod(g,[.119*Math.sin(a),1.695,-.008+.119*Math.cos(a)],[.119*Math.sin(a),1.716,-.008+.119*Math.cos(a)],.002,"#a7755d",4);}
  }
  function gardening(g,mark){
    mark("body");for(const s of [-1,1]){
      front(g,[[s*.152,1.42],[s*.073,1.404],[s*.046,1.217],[s*.032,1.004],[s*.157,1.016]],"#8d795f");
      front(g,[[s*.139,1.183],[s*.061,1.184],[s*.060,1.088],[s*.137,1.092]],"#b49870",false,.011);
    }
    rod(g,[.109,1.172,.124],[.116,1.225,.125],.005,"#d9aa61",5);
    for(const s of [-1,1]){
      mark("leg",s);
      box(g,s*.109,.534,.089,.090,.129,.014,"#847e67");box(g,s*.109,.560,.100,.061,.010,.007,"#aba38a");
    }
    mark("sunhat");g.cyl(.003,1.701,-.007,.190,.200,.018,14,"#b8996b");
    g.cyl(.004,1.739,-.010,.087,.126,.078,12,"#c4aa7a");g.cyl(.004,1.714,-.009,.119,.129,.021,12,"#677a70");
    g.cyl(.010,1.781,-.014,.048,.086,.012,10,"#bfa475");
  }
  const tailors={medic:(g,m)=>uniform(g,m,false),driver:(g,m)=>uniform(g,m,true),dispatcher:officeWear,
    skater:skating,fishmonger:market,gardener:gardening};
  function dress(mesh,role){
    if(!mesh||mesh.rescueRole||!tailors[role])return mesh;
    const g=new BayMesh(),groups=[];
    tailors[role](g,(part,side=1)=>groups.push({part,side,first:g.vertices.length/6}));
    const rest=new Float32Array(mesh.rest.length+g.vertices.length);rest.set(mesh.rest);rest.set(g.vertices,mesh.rest.length);
    for(let i=0;i<groups.length;i++){
      const group=groups[i],limb=mesh.sides[group.side<0?0:1],end=groups[i+1]?.first??g.vertices.length/6;
      if(group.part==="sunhat")mesh.rescueHatFirst=mesh.rest.length+6*group.first;
      for(let j=group.first;j<end;j++)mesh.bindings.push(mesh.binding(group.part==="sunhat"?"head":group.part,limb,g.vertices[6*j+1]));
    }
    mesh.rest=rest;mesh.vertices=rest.slice();mesh.lastRevision=-1;mesh.rescueRole=role;return mesh;
  }
  const add=(a,b)=>a.map((v,i)=>v+b[i]),sub=(a,b)=>a.map((v,i)=>v-b[i]),lerp=(a,b,u)=>a.map((v,i)=>mix(v,b[i],u));
  const xyz=p=>[p.x,p.y||0,p.z],turn=(p,y)=>[p[0]*Math.cos(y)+p[2]*Math.sin(y),p[1],p[2]*Math.cos(y)-p[0]*Math.sin(y)];
  const actorLocal=(a,p)=>turn(sub(xyz(p),xyz(a)),-(a.yaw||0));
  const actorWorld=(a,p)=>{const v=add(xyz(a),turn(p,a.yaw||0));return{x:v[0],y:v[1],z:v[2]};};
  const palms=[[-.238,.977,.052],[.238,.977,.052]],sides=[-1,1],idleMotions=new WeakMap();
  function chain(a,to,u,v,bias,k,b){
    const dx=to[0]-a[0],dy=to[1]-a[1],dz=to[2]-a[2],len=Math.max(.00001,Math.hypot(dx,dy,dz));
    const x=dx/len,y=dy/len,z=dz/len,d=clamp(len,Math.abs(u-v)+.0005,u+v-.0005);
    b[0]=a[0]+x*d;b[1]=a[1]+y*d;b[2]=a[2]+z*d;
    const dot=bias[0]*x+bias[1]*y+bias[2]*z,ex=bias[0]-dot*x,ey=bias[1]-dot*y,ez=bias[2]-dot*z;
    const mid=(u*u-v*v+d*d)/(2*d),spread=Math.sqrt(Math.max(0,u*u-mid*mid))/(Math.hypot(ex,ey,ez)||1);
    k[0]=a[0]+x*mid+ex*spread;k[1]=a[1]+y*mid+ey*spread;k[2]=a[2]+z*mid+ez*spread;
  }
  function grip(limb,i,target,bias){
    const wrist=target.slice(),b=limb.hand,k=limb.elbow;
    for(let n=0;n<4;n++){
      chain(limb.shoulder,wrist,limb.arm.length,limb.forearm.length,bias,k,b);
      limb.arm.aim(limb.shoulder,k);limb.forearm.aim(k,b);
      const p=limb.forearm.map(palms[i],[]);
      for(let j=0;j<3;j++)wrist[j]=b[j]+target[j]-p[j];
    }
  }
  function moveBone(b,p,cs,sn){
    const m=b.m;
    for(let j=0;j<4;j++){const x=m[j],z=m[8+j];m[j]=cs*x+sn*z;m[8+j]=cs*z-sn*x;}
    m[3]+=p[0];m[7]+=p[1];m[11]+=p[2];
  }
  const hatCenter=[.003,1.701,-.007];
  function setHat(f,a,c,u){
    const moved=smooth(.686,.953,u),held=smooth(.594,.72,u)*(1-smooth(.867,.990,u));
    f.hat={moved,held,arc:.133*Math.sin(moved*pi),yaw:angle(a.yaw||0,(c.yaw||0)+pi)+.28,
      target:actorLocal(a,point(c,.012,.372,-.361))};
  }
  function hatEnd(h,p){return add(h.target,turn(sub(p,hatCenter),h.yaw));}
  function lowerHat(mesh,f){
    const h=f.hat,head=mesh.head,moved=h.moved,src=mesh.rest,dst=mesh.vertices;
    const shift=(initial,end)=>{
      const q=lerp(initial,end,moved);q[1]+=h.arc;return q;
    };
    mesh.rescueMapHat=shift(head.map(hatCenter,[]),h.target);
    if(moved<=0||!Number.isFinite(mesh.rescueHatFirst))return;
    for(let j=mesh.rescueHatFirst;j<src.length;j+=6){
      const p=[src[j],src[j+1],src[j+2]],q=shift(head.map(p,[]),hatEnd(h,p));
      dst[j]=q[0];dst[j+1]=q[1];dst[j+2]=q[2];
    }
  }
  function articulate(mesh,f){
    const o=[0,0,0],cs=Math.cos(f.yaw),sn=Math.sin(f.yaw);
    mesh.pelvis.place(o,f.pelvis,0,f.roll);
    mesh.pelvis.map(mesh.chest.pivot,o);mesh.chest.place(o,f.chest,0,f.roll*.45);
    mesh.chest.map(mesh.head.pivot,o);mesh.head.place(o,f.head,f.look||0,f.roll*.20);
    if(f.hat?.held){
      const h=f.hat,p=[.167,1.704,.040],finish=turn(sub(hatEnd(h,p),f.hip),-f.yaw);
      const grip=lerp(mesh.head.map(p,[]),finish,h.moved);grip[1]+=h.arc;
      f.hands[1]=lerp(f.hands[1],grip,h.held);
      f.hands[1][0]+=.117*Math.sin(pi*h.held)*(1-h.moved);
      f.hands[1][2]+=.098*Math.sin(pi*h.held)*(1-h.moved);
    }
    for(let i=0;i<2;i++){
      const l=mesh.sides[i];mesh.pelvis.map(l.thigh.pivot,l.hip);
      chain(l.hip,f.feet[i],l.thigh.length,l.shin.length,f.knee,l.knee,l.ankle);
      l.thigh.aim(l.hip,l.knee);l.shin.aim(l.knee,l.ankle);l.shoe.place(l.ankle,f.shoe[i],l.side*.034);
      mesh.chest.map(l.arm.pivot,l.shoulder);grip(l,i,f.hands[i],[l.side*f.elbow[2],f.elbow[0],f.elbow[1]]);
      for(const bone of [l.thigh,l.shin,l.shoe,l.arm,l.forearm])moveBone(bone,f.hip,cs,sn);
    }
    for(const bone of [mesh.pelvis,mesh.chest,mesh.head])moveBone(bone,f.hip,cs,sn);
    mesh.skin();if(f.hat)lowerHat(mesh,f);mesh.lastRevision=-2;return true;
  }
  function form(hip,pelvis,chest,head,feet,hands,shoe=[0,0]){
    return {hip,yaw:0,pelvis,chest,head,roll:0,look:0,feet,hands,shoe,knee:[0,.04,1],elbow:[-.65,-.34,.75]};
  }
  function seated(a,role,t){
    const height=(a.seatHeight??.38)+.069,b=.007*Math.sin(t*1.5),hip=[0,height,-.038];
    const arms=role==="fishmonger"?[[.024,.172,.221],[.091,.170,.216]]:
      role==="gardener"?[[-.145,.152,.225],[.082,.213,.240]]:[[-.175,.117,.244],[.112,.150,.225]];
    const p=form(hip,.09,.22+b,.10+b,sides.map(s=>[s*.140,.169-height,.354+s*.065]),arms);
    p.look=.025*Math.sin(t*.9);return p;
  }
  function standing(t,m){
    const w=m?.weight||0,phase=(m?.phase||0)*tau;
    const h=.942-.08*w+.015*w*Math.cos(phase*2);
    return form([0,h,0],.015,.028+.005*Math.sin(t*1.7),.018,sides.map((s,i)=>[s*.111,(m?.feet?.[i].y??.169)-h,m?.feet?.[i].z||0]),
      sides.map(s=>[s*.236,.013,.055-s*.105*w*Math.cos(phase)]),sides.map((s,i)=>m?.feet?.[i].pitch||0));
  }
  function blendForms(a,b,u){
    const hip=lerp(a.hip,b.hip,u),yaw=a.yaw+angle(a.yaw,b.yaw)*u,out={hip,yaw};
    for(const group of ["feet","hands"]){
      out[group]=a[group].map((p,i)=>turn(sub(lerp(add(a.hip,turn(p,a.yaw)),add(b.hip,turn(b[group][i],b.yaw)),u),hip),-yaw));
    }
    for(const k of ["pelvis","chest","head","roll","look"])out[k]=mix(a[k]||0,b[k]||0,u);
    for(const k of ["knee","elbow","shoe"])out[k]=lerp(a[k],b[k],u);
    return out;
  }
  function reclined(a,c){
    const h=actorLocal(a,point(c,0,.112,.030)),yaw=angle(a.yaw||0,(c.yaw||0)+pi);
    // Body forward points to the foot end. The lifted back panel carries shoulders and occiput.
    const p=form(h,-1.46,-1.30,-1.32,
      sides.map(s=>[s*.108,.011,.770+s*.013]),sides.map(s=>[s*.105,.184,-.239+s*.022]),[-1.37,-1.37]);
    p.yaw=yaw;p.knee=[0,1,.13];p.elbow=[-.33,.38,.20];return p;
  }
  function transfer(a,c,role,u,t){
    const start=seated(a,role,t),finish=reclined(a,c);
    if(u<=0)return start;if(u>=1)return finish;
    const up=standing(t),perch=seated({seatHeight:0},role,t);
    const hip=actorLocal(a,point(c,.067,.074,-.087));
    perch.hip=hip;perch.yaw=finish.yaw+1.13;
    perch.feet=sides.map(s=>[s*.117,Math.max(-.64,-(c.y-(a.y||0))+.16),.38+s*.05]);
    perch.hands=[[-.189,.071,.158],[.133,.162,.190]];perch.chest=.10;perch.head=.04;
    const step=standing(t);step.hip=actorLocal(a,point(c,.486,.908-(c.y-(a.y||0)),-.083));step.yaw=perch.yaw;
    if(u<.21)return blendForms(start,up,smooth(0,.21,u));
    if(u<.49){
      const phase=(u-.21)/.28,p=blendForms(up,step,smooth(0,1,phase));
      p.feet[phase<.5?0:1][1]+=.088*Math.abs(Math.sin(tau*phase));p.roll=.016*Math.sin(phase*tau);return p;
    }
    if(u<.65)return blendForms(step,perch,smooth(.49,.65,u));
    const r=smooth(.65,1,u),p=blendForms(perch,finish,r),rise=Math.sin(r*pi);
    for(let i=0;i<2;i++)p.feet[i][1]+=(i?.076:.131)*rise;
    return p;
  }
  function checking(t){
    const b=.007*Math.sin(t*1.85),p=form([0,.511,-.067],.09,.42+b,.23+b,
      [[-.135,-.399,-.354],[.14,-.342,.331]],[[.006,.219,.240],[.125,.110,.295]],[-.79,0]);
    p.look=-.08;p.roll=-.036;return p;
  }
  function atDesk(t){
    const p=standing(t);p.chest=.091;p.head=.21+.035*Math.cos(t*1.4);
    p.hands=[[-.090,.259,.207],[.086,.278+.009*Math.sin(t*4),.227+.022*Math.sin(t*2.6)]];return p;
  }
  function pushing(a,c,end,t){
    const m=a.motion,w=m?.weight||0,phase=(m?.phase||0)*tau;
    const h=.846+w*.016*Math.sin(2*phase)+clamp((c.y-(a.y||0))-.94,-.08,.08)*.80;
    const p=standing(t,m);p.hip=[.011*Math.sin(phase)*w,h,.020];p.pelvis=.095;p.chest=.33+.034*w;p.head=.105;p.roll=.016*Math.sin(phase)*w;
    p.feet=sides.map((s,i)=>[s*.13-p.hip[0],(m?.feet?.[i].y??.169)-h,(m?.feet?.[i].z||0)*.77-.02]);
    p.hands=handles(c,end).map(q=>sub(actorLocal(a,q),p.hip));return p;
  }
  function motionOf(a){
    if(a.motion)return a.motion;
    let m=idleMotions.get(a);if(!m){m=new BayPlayerMotion();idleMotions.set(a,m);}return m;
  }
  function pose(mesh,a,t=0,role="medic",action=a?.action||"idle",c,progress=a?.progress??0){
    if(!mesh||!a)return false;
    mesh.rescueMapHat=null;let f;
    if(action==="sit")f=seated(a,role,t);
    if(action==="rise")f=blendForms(seated(a,role,t),standing(t),smooth(0,1,progress));
    if(action==="check")f=checking(t);
    if(action==="desk")f=atDesk(t);
    if(c&&action==="transfer"){
      if(a.source&&a.source.down?.inCare&&Math.hypot(a.x-a.source.x,a.z-a.source.z)<2){
        const start=reclined(a,{x:a.x,y:a.y+.09,z:a.z,yaw:a.yaw});
        f=blendForms(start,reclined(a,c),smooth(0,1,clamp(progress)));
      }else f=transfer(a,c,role,clamp(progress),t);
    }
    if(c&&action==="lying")f=reclined(a,c);
    if(role==="gardener"&&c&&(action==="lying"||action==="transfer"))setHat(f,a,c,action==="lying"?1:clamp(progress));
    if(c&&["push","guide","side"].includes(action))f=pushing(a,c,action==="push"?"foot":action==="guide"?"head":"side",t);
    return f?articulate(mesh,f):mesh.update(motionOf(a));
  }
  function clipboard(g){
    box(g,0,0,0,.210,.016,.285,"#8b755c");box(g,0,.010,-.005,.188,.004,.247,"#e6dfbe");
    box(g,0,.017,.100,.076,.011,.027,steel);box(g,-.011,.015,.055,.130,.003,.009,"#80a09a");
    for(let j=0;j<5;j++)box(g,-.008,.014,.024-j*.024,.135,.003,.0025,"#9dafa1");
    rod(g,[.077,.021,-.105],[.079,.022,.048],.004,"#b88452",5);
  }
  function canvasBag(g){
    const size=.242,w=.118,p=[[-size+.043,-w],[-size,-w+.035],[-size,w-.032],[-size+.045,w],[size-.040,w],[size,w-.032],[size,-w+.038],[size-.035,-w]];
    const lower=p.map(([x,z])=>[x,.016,z]),upper=p.map(([x,z])=>[x*.94,.207,z*.86]);
    shell(g,lower,upper,"#a39772","#918264");
    for(const s of sides){
      const x=s*.136;rail(g,[[x,.027,-w],[x,.199,-w*.87],[x,.212,w*.85],[x,.028,w]],.011,"#546c68",6);
      box(g,x,.136,w,.044,.037,.009,cream);
    }
    rail(g,[[-.080,.204,-.015],[-.064,.266,-.015],[.064,.266,-.015],[.080,.204,-.015]],.008,graphite,6);
    box(g,.130,.217,.043,.020,.010,.026,amber);
  }
  function skateboard(g){
    const q=[[-.084,-.30],[-.069,-.35],[0,-.38],[.071,-.35],[.086,-.30],[.086,.299],[.069,.352],[0,.379],[-.069,.352],[-.086,.299]];
    const lower=q.map(([x,z])=>[x,.064+Math.max(0,Math.abs(z)-.255)*.34,z]);
    shell(g,lower,lower.map(([x,y,z])=>[x,y+.017,z]),"#657b73","#bf9574");
    for(const z of [-.210,.210])for(const s of sides){
      wheel(g,s*.082,.030,z,.029,.022,true);
      const x=s*.094,face=[];
      for(let i=0;i<8;i++)face.push([x,.030+Math.cos(i*tau/8)*.025,z+Math.sin(i*tau/8)*.025]);
      cap(g,face,z>0?"#dca65b":"#c57a60");
      g.tri([x+s*.001,.033,z-.021],[x+s*.001,.038,z-.018],[x+s*.001,.029,z-.003],cream);
    }
    for(const x of [-.048,.048])for(const z of [-.242,.242])box(g,x,.085,z,.008,.006,.010,cream);
  }
  function basket(g,plants){
    const wood=plants?"#b28e69":"#62827d",slat=plants?"#a27f5e":"#8ea39a",w=.235,l=.155;
    box(g,0,.028,0,w*2,.043,l*2,wood);
    for(const x of [-w,w])for(const z of [-l,l])box(g,x,.111,z,.029,.182,.029,wood);
    for(const y of [.083,.156]){
      for(const s of sides){box(g,s*w,y,0,.022,.052,l*2,slat);box(g,0,y,s*l,w*2,.052,.022,slat);}
    }
    if(plants)for(const [x,z,t] of [[-.13,-.032,1],[.043,.047,.82],[.14,-.029,.94]]){
      g.cyl(x,.104,z,.045,.036,.078,7,"#a17355");
      for(const s of sides)g.tri([x,.128,z],[x+s*.058,.234*t,z-.019],[x+s*.047,.183*t+.026,z+.024],s<0?"#678568":"#8f9b6d");
      rod(g,[x,.133,z],[x+.013,.257*t,z+.011],.004,"#6c8868",4);
      const fx=x+.013,fy=.257*t,fz=z+.011;
      for(let j=0;j<5;j++){
        const a=j*tau/5+.2*t;
        g.tri([fx,fy-.003,fz],[fx+.022*Math.cos(a-.35),fy+.009,fz+.022*Math.sin(a-.35)],
          [fx+.027*Math.cos(a+.30),fy+.006,fz+.027*Math.sin(a+.30)],j%2?"#dea563":"#edd08b");
      }
    }else{
      box(g,.062,.107,0,.190,.064,.165,"#c1cab6");box(g,-.121,.090,-.018,.105,.031,.174,"#c4b396");
      box(g,.058,.142,.011,.066,.005,.075,cream);
    }
  }
  function lowCot(g,fold){
    const geo=geometry({fold});
    box(g,0,-.046,0,.58,.085,1.78,blue);box(g,0,.113,.735,.402,.067,.226,linen);
    for(const s of sides){
      for(const end of sides){
        rod(g,[s*.247,upperPivot,end*geo.half],[s*.247,geo.hinge,-end*geo.half],.022,end<0?amber:steel,4);
        box(g,s*.250,geo.axle,end*geo.half,.055,.143,.123,rubber);
        rod(g,[s*.269,-.080,end*.845],[s*.235,.05,end*.936],.022,steel,4);
      }
      rod(g,[s*.32,.071,-.35],[s*.32,.071,.43],.02,graphite,4);
    }
  }
  function modelPatient(g,role,palette=colors[role]){
    const m=new BayPlayerMesh(palette,"local");dress(m,role);
    const a={x:0,y:0,z:0,yaw:0},c={...a,patientRole:role};
    pose(m,a,0,role,"lying",c);
    for(const n of m.vertices)g.vertices.push(n);
  }
  function lowRider(g,role,palette=colors[role]){
    const [skin,shirt,pants]=palette;
    const sections=[[-.70,.19,.17],[-.39,.24,.34],[-.08,.22,.263],[.18,.210,.301]];
    const cloth=sections.map(([z,w,h])=>[[-w,.048,z],[-w+.050,h,z],[w-.052,h+.006,z],[w,.048,z]]);
    for(let j=1;j<cloth.length;j++)for(let k=1;k<4;k++)g.quad(cloth[j-1][k-1],cloth[j-1][k],cloth[j][k],cloth[j][k-1],k===2?blanket:"#95ac97");
    for(const [z,y] of [[-.52,.286],[-.05,.275]])box(g,0,y,z,.370,.014,.030,belt);
    for(const s of sides)box(g,s*.104,.129,-.786,.115,.100,.216,pants);
    box(g,0,.200,.351,.378,.139,.368,shirt);box(g,0,.284,.669,.182,.169,.171,skin);
    box(g,0,.262,.752,.184,.151,.080,role==="skater"?"#a97160":role==="fishmonger"?"#b88668":"#5b4940");
    if(role==="gardener"){g.cyl(.012,.361,-.361,.190,.190,.013,8,"#bba172");g.cyl(.012,.397,-.361,.073,.099,.060,8,"#c8aa75");}
  }
  function install(model){
    for(const [n,make] of Object.entries({frame:cotFrame,brace:g=>brace(g,false),link:g=>brace(g,true),pins,
      trucks,tires,cover,clipboard,bag:canvasBag,deck:skateboard,crate:g=>basket(g,false),seedlings:g=>basket(g,true),
      "low-open":g=>lowCot(g,0),"low-folded":g=>lowCot(g,1)}))model(key(n),make);
    for(const role of patientRoles){model(key("patient-"+role),g=>modelPatient(g,role));model(key("rider-"+role),g=>lowRider(g,role));}
  }
  function item(list,id,p,yaw=0,pitch=0,roll=0){list.push([key(id),p.x,p.y,p.z,yaw,pitch,roll]);}
  function streetCot(model,a){
    const id="street-"+a.style;
    model(key("patient-"+id),g=>modelPatient(g,"street",a.palette));
    model(key("rider-"+id),g=>lowRider(g,"street",a.palette));
  }
  function cotWorld(list,c,t=0,near=true){
    if(!c||c.hidden)return;
    const rider=c.patient?.palette?"street-"+c.patient.style:roleOf(c);
    const y=c.yaw||0,g=geometry(c),put=(n,x,h,z,rot=0,tilt=0)=>item(list,n,point(c,x,h,z),y+rot,tilt);
    if(near===false){
      put(c.fold>.5?"low-folded":"low-open",0,0,0);
      if(c.occupied)put("rider-"+rider,0,0,0);return;
    }
    else{
      put("frame",0,0,0);put("brace",0,upperPivot,-g.half,0,g.pitch);put("link",0,upperPivot,g.half,pi,g.pitch);
      put("pins",0,g.mid,0);
      for(const e of sides){
        put("trucks",0,g.hinge,e*g.half);
        const spin=c.wheelSpin??(c.distance||0)/spec.casterRadius;
        put("tires",0,g.axle,e*g.half+.018,0,spin%tau);
      }
    }
    if(c.occupied){put("patient-"+rider,0,0,0);put("cover",0,0,0);}
  }
  function propPlan(a,role,action,mesh){
    if(role==="dispatcher"&&action==="desk"&&mesh){
      const p=mesh.sides[0].forearm.map(palms[0],[]);return ["clipboard",actorWorld(a,add(p,[.051,-.006,.031])),(a.yaw||0)+.13,-.32];
    }
    if(role==="medic"&&action==="check")return ["bag",actorWorld(a,[-.282,.006,.280]),(a.yaw||0)-.48,0];
    if(action==="sit"&&patientRoles.includes(role)){
      const id={skater:"deck",fishmonger:"crate",gardener:"seedlings"}[role];
      return [id,actorWorld(a,[role==="skater"?-.34:.43,.004,role==="skater"?.21:.12]),(a.yaw||0)+(role==="skater"?.36:-.15),0];
    }
    return null;
  }
  function props(list,a,t,role="medic",action=a?.action||"idle",c,mesh){
    if(!a||a.hidden)return;const p=propPlan(a,role,action,mesh);if(p)item(list,...p);
  }
  const street=opt=>opt?.mode!=="atlas"&&opt?.mode!=="radar";
  function ink(ctx,opt,px,py,s,ground){
    const dx=.35*Math.sin(opt?.rotation||0),dz=.35*Math.cos(opt?.rotation||0);
    function screen(p){return [px(p.x)+(p.y-ground)*s*dx,py(p.z)-(p.y-ground)*s*dz];}
    function polygon(points,col){
      ctx.fillStyle=col;ctx.beginPath();
      points.forEach((p,i)=>{const [x,y]=screen(p);if(i)ctx.lineTo(x,y);else ctx.moveTo(x,y);});ctx.closePath();ctx.fill();
    }
    function line(a,b,w,col){
      const [x,y]=screen(a),[u,v]=screen(b);ctx.strokeStyle=col;ctx.lineWidth=Math.max(.46,s*w);
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(u,v);ctx.stroke();
    }
    function disk(p,rx,rz,col){
      const [x,y]=screen(p);ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,Math.max(.4,s*rx),Math.max(.4,s*rz),0,0,tau);ctx.fill();
    }
    return {line,polygon,disk};
  }
  function drawProp(ctx,opt,px,py,s,p,gnd){
    if(!p)return;
    const [id,a,rot]=p,I=ink(ctx,opt,px,py,s,gnd),q=(x,y,z)=>actorWorld({...a,yaw:rot},[x,y,z]);
    if(id==="clipboard"){
      I.polygon([q(-.095,0,-.14),q(.095,0,-.14),q(.095,0,.14),q(-.095,0,.14)],cream);
      I.line(q(-.061,.01,.090),q(.061,.01,.09),.017,steel);return;
    }
    if(id==="deck"){
      I.line(q(0,.065,-.298),q(0,.065,.298),.160,"#b79576");I.line(q(0,.082,-.298),q(0,.082,.298),.142,"#647b72");
      for(const z of [-.22,.22])I.line(q(-.034,.086,z),q(.034,.086,z),.013,cream);
      return;
    }
    const bag=id==="bag",y=bag?.200:.165,l=bag?.115:.156;
    I.polygon([q(-.238,y,-l),q(-.238,y,l),q(.238,y,l),q(.238,y,-l)],bag?"#a98f69":id==="crate"?"#849e92":"#b69a77");
    if(bag)for(const x of [-.13,.13])I.line(q(x,y,-l),q(x,y,l),.029,"#566d65");
    else if(id==="seedlings")for(const x of [-.14,0,.135]){
      I.disk(q(x,.234,.014),.046,.056,"#688364");I.disk(q(x+.011,.259,.022),.022,.021,"#e2b969");
    }
    else I.polygon([q(-.12,.18,-.09),q(-.10,.18,.086),q(.14,.18,.07),q(.12,.18,-.084)],"#cbd0bc");
  }
  let outlineRig;
  function mapRig(){
    if(!outlineRig){
      outlineRig=new BayPlayerMesh(colors.medic,"local");outlineRig.skin=()=>{};
      outlineRig.rest=outlineRig.vertices=new Float32Array();outlineRig.bindings=[];
    }
    outlineRig.lastRevision=-1;return outlineRig;
  }
  function personMap(ctx,opt,px,py,s,a,t=0,role="medic",action=a?.action||"idle",c,progress=a?.progress??0){
    if(!a||a.hidden||!street(opt))return;
    const mesh=mapRig();pose(mesh,a,t,role,action,c,progress);
    const ground=c?groundOf(c):(a.ground??a.y??0),I=ink(ctx,opt,px,py,s,ground),[skin,shirt,pants]=a.palette||colors[role]||colors.player;
    const world=v=>actorWorld(a,v),joint=(b,x,y,z)=>world(b.map([x,y,z],[]));
    const head=(x,y,z)=>joint(mesh.head,x,y,z),top=(x,y,z)=>joint(mesh.chest,x,y,z);
    const lifted=action==="lying"||action==="transfer"&&progress>.60;
    ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
    if(!lifted){
      ctx.save();ctx.globalAlpha*=.21;I.disk({x:a.x+.043,y:ground,z:a.z-.023},.198,.111,"#354340");ctx.restore();
    }
    for(const l of mesh.sides){
      const side=l.side,hip=joint(l.thigh,side*.101,.967,0),knee=joint(l.shin,side*.109,.55,.014);
      const heel=joint(l.shoe,side*.111,.077,-.032),toe=joint(l.shoe,side*.111,.072,.163);
      I.line(hip,knee,.152,pants);I.line(knee,heel,.117,pants);
      if(role==="gardener")I.disk(knee,.041,.041,"#999176");
      I.line(heel,toe,.107,role==="fishmonger"?"#586a61":"#8d9385");I.disk(toe,.046,.027,cream);
    }
    const hip=(x,y,z)=>joint(mesh.pelvis,x,y,z);
    I.polygon([hip(-.15,.982,0),top(-.200,1.405,0),top(-.14,1.452,.015),top(.14,1.452,.015),top(.200,1.405,0),hip(.15,.982,0)],shirt);
    if(["medic","driver"].includes(role)){
      I.line(top(-.165,1.333,-.09),top(.165,1.333,-.09),.026,"#c7d0b8");
      for(const sign of sides)I.line(top(sign*.108,1.427,.018),top(sign*.072,1.332,.102),.035,"#bfc9b2");
      I.disk(top(.100,1.299,.123),.024,.010,cream);I.line(top(-.118,1.224,.121),top(-.118,1.301,.121),.043,graphite);
    }
    if(role==="skater")I.line(top(-.076,1.276,.112),top(.083,1.311,.116),.031,"#e6bf93");
    if(role==="gardener"||role==="fishmonger"||role==="dispatcher")for(const sign of sides){
      I.line(top(sign*.13,1.423,-.092),hip(sign*.102,1.008,-.082),.040,role==="gardener"?"#998362":"#a8b29b");
      I.line(top(sign*.12,1.426,.051),top(sign*.074,1.275,.104),.026,role==="gardener"?"#aa9270":"#c6c1a4");
    }
    for(let i=0;i<mesh.sides.length;i++){
      const l=mesh.sides[i],s=l.side,shoulder=joint(l.arm,s*.204,1.410,-.004),elbow=joint(l.forearm,s*.249,1.185,0);
      const sleeve=world(l.arm.map([s*.237,1.268,0],[])),palm=world(l.forearm.map(palms[i],[]));
      I.line(shoulder,elbow,.099,skin);I.line(shoulder,sleeve,.139,shirt);I.line(elbow,palm,.068,skin);I.disk(palm,.043,.042,skin);
    }
    I.disk(head(0,1.643,.016),.107,.118,skin);
    const hair=role==="medic"?"#493d37":role==="driver"?"#576e72":role==="gardener"?"#66544b":
      role==="fishmonger"?"#ba8867":role==="skater"?"#a57563":"#53483f";
    I.disk(head(0,1.697,-.023),.110,.095,hair);
    if(role==="gardener"){
      const pos=mesh.rescueMapHat?world(mesh.rescueMapHat):head(...hatCenter);
      I.disk(pos,.190,.163,"#bba172");I.disk({...pos,y:pos.y+.042},.107,.094,"#d0b482");
    }
    if(role==="medic")I.disk(head(.017,1.648,-.125),.063,.058,"#55463c");
    if(role==="driver")I.line(head(-.071,1.711,.119),head(.071,1.711,.119),.049,"#425d64");
    if(role==="dispatcher")I.line(head(-.107,1.696,-.018),head(.107,1.696,-.018),.016,"#76827d");
    drawProp(ctx,opt,px,py,s,propPlan(a,role,action,mesh),ground);ctx.restore();
  }
  function cotMap(ctx,opt,px,py,s,c,t=0){
    if(!c||c.hidden||!street(opt))return;
    const p=(x,y,z)=>point(c,x,y,z),g=geometry(c),ground=groundOf(c),I=ink(ctx,opt,px,py,s,ground);
    ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
    ctx.save();ctx.globalAlpha*=.19;
    I.polygon([p(-.257,ground-c.y,-.807),p(-.257,ground-c.y,.845),p(.300,ground-c.y,.845),p(.300,ground-c.y,-.807)],"#44504a");ctx.restore();
    for(const side of sides)for(const end of sides){
      I.line(p(side*.25,upperPivot,end*g.half),p(side*.25,g.hinge,-end*g.half),.030,end<0?amber:steel);
      I.line(p(side*.25,g.axle,-end*g.half-.025),p(side*.25,g.axle,-end*g.half+.071),.058,rubber);
    }
    const mattress=(z0,z1,y0,y1,col)=>I.polygon([p(-.257,y0,z0),p(-.295,y0,z0+.05),p(-.294,y1,z1-.049),p(-.254,y1,z1),
      p(.254,y1,z1),p(.294,y1,z1-.049),p(.295,y0,z0+.05),p(.257,y0,z0)],col);
    mattress(-.891,.193,0,.003,blue);mattress(.203,.889,.012,.185,"#799796");
    I.polygon([p(-.215,.150,.613),p(-.209,.214,.847),p(.196,.214,.854),p(.217,.155,.634)],linen);
    for(const e of sides){
      const z=e*spec.headGrip;I.line(p(-.263,.052,z),p(.263,.052,z),.039,steel);
      for(const side of sides){I.line(p(side*.277,-.081,e*.853),p(side*.260,.052,z),.030,steel);
        I.line(p(side*.157,.052,z),p(side*.257,.052,z),.047,rubber);}
    }
    if(c.occupied){
      const a={x:c.x,y:c.y,z:c.z,yaw:c.yaw||0,ground,palette:c.patient?.palette};
      personMap(ctx,opt,px,py,s,a,t,roleOf(c),"lying",c,1);
      const rings=coverSections.map(row=>clothRing(row[0]));
      I.polygon([...rings.map(r=>p(...r[0])),...rings.slice().reverse().map(r=>p(...r[8]))],blanket);
      for(const [z,width,col] of [[-.62,.026,stripe],[-.53,.034,belt],[-.046,.037,belt],[.128,.027,stripe],[.160,.013,stripe]]){
        const r=clothRing(z,.004);
        for(let j=1;j<r.length;j++)I.line(p(...r[j-1]),p(...r[j]),width,col);
        if(col===belt)I.line(p(.076,r[5][1]+.009,z),p(.116,r[5][1]+.009,z),width*.64,shine);
      }
      if(roleOf(c)==="gardener"){I.disk(p(.012,.372,-.361),.190,.163,"#bba172");I.disk(p(.012,.414,-.361),.107,.094,"#d0b482");}
    }
    for(const side of sides){
      I.line(p(side*.328,.083,-.350),p(side*.328,.083,.427),.034,steel);
      I.line(p(side*.328,.083,-.139),p(side*.328,.083,.336),.040,graphite);
    }
    ctx.restore();
  }
  window.BayRescueCrew=Object.freeze({install,spec,point,handler,handles,colors,palette:role=>colors[role]||colors.player,
    dress,pose,props,streetCot,cotWorld,cotMap,personMap});
})();
