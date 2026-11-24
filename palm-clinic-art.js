/* The old county receiving station at Palms and Marquee. All coordinates are in city metres. */
(() => {
  "use strict";
  const point=(x,z,y=.16,yaw=0)=>({x,y,z,yaw});
  const site={id:"palm-clinic",kind:"clinic",name:"Palm County Clinic",x:-94.60,z:57.74,
    center:point(-90.20,50.85),desk:point(-94.60,57.74,.16,Math.PI),dispatcher:point(-94.60,55.97),
    bay:point(-85.10,48.20,.12,Math.PI),threshold:point(-89.65,52.31,.16,-Math.PI/2),
    bed:point(-95.25,52.31,.16,-Math.PI/2),cot:point(-95.25,50.55,.84,-Math.PI/2),
    door:point(-94.60,59.30),curb:point(-94.60,64.40,.105),rear:point(-84.96,50.96,.12),unload:point(-84.96,52.31,.12),
    nurse:point(-97.08,50.54,.16,Math.PI/2)};
  const path=(pairs)=>pairs.map(([x,z])=>point(x,z));
  site.walkIn=[site.curb,site.door,site.desk];
  site.toBay=path([[-74.50,68.0],[-74.50,65.0],[-75.30,62.85],[-77.22,61.12],[-80.38,59.42],[-82.84,57.75],[-84.46,55.58],[-85.10,53.04],[-85.10,48.20]]);
  site.fromBay=path([[-85.10,48.20],[-85.10,46.30],[-84.47,44.13],[-82.70,42.48],[-79.74,41.80],[-77.00,41.01],[-75.11,39.28],[-74.20,36.95],[-74.20,33.60],[-74.50,29.00]]);
  site.toBed=[site.unload,point(-87.15,52.31),site.threshold,point(-92.15,52.31),site.bed];
  site.toReceiving=[site.desk,point(-91.67,57.77),point(-91.67,52.31),site.bed];

  const bounds={west:-99.60,east:-89.65,south:39.60,north:59.30};
  const blocks=[],cameraBlocks=[];
  function block(x,z,w,d,bottom,top,body=true){
    const shape={x,z,w,d,bottom,top,streetProp:true};cameraBlocks.push(shape);if(body)blocks.push(shape);
  }
  // Each span is solid at a pedestrian's height. Windows share that footprint; doorways have no sill.
  const walls=[[-99.60,49.45,.22,19.92],[-94.625,39.60,10.17,.22],[-97.89,59.30,3.64,.22],[-91.37,59.30,3.66,.22],
    [-89.65,45.005,.22,10.81],[-89.65,56.75,.22,5.10],[-96.52,54.70,6.16,.14]];
  for(const [x,z,w,d] of walls)block(x,z,w,d,.15,3.53);
  block(-94.60,56.83,3.14,.53,.16,1.18);
  block(-98.86,56.98,.73,2.13,.16,1.09);
  block(site.cot.x,site.cot.z,2.17,.94,.16,1.14);
  block(-98.98,44.40,.79,4.75,.16,1.21);
  block(-96.36,40.13,3.65,.83,.16,2.04);
  for(const z of [45.50,53.50])block(-81.08,z,.34,.34,.11,3.95);
  block(-81.15,64.05,.69,.71,.10,4.10);
  block(-94.63,49.45,10.48,20.30,3.53,3.90,false);
  block(-85.52,49.62,9.00,13.29,3.94,4.16,false);
  block(-94.62,60.0,5.46,1.58,3.02,3.23,false);
  const inRoom=(x,z,pad=0)=>x>bounds.west-pad&&x<bounds.east+pad&&z>bounds.south-pad&&z<bounds.north+pad;
  const inBay=(p,w=4.48,d=6.66)=>p&&Math.abs(p.x+85.52)<w&&Math.abs(p.z-49.62)<d;
  function interiorVisible(player){return Boolean(player&&(player.y??0)<3.1&&(inRoom(player.x,player.z,3.2)||inBay(player,6.85,10.1)));}
  function occludesActor(actor,player){return Boolean(actor&&inRoom(actor.x,actor.z,.10)&&(actor.y??0)<3.53&&!interiorVisible(player));}
  function floor(x,z){
    if(inRoom(x,z,.12))return .16;
    if(x>=-96.45&&x<=-92.75&&z>=59.28&&z<=64.45)return .16-.055*(z-59.28)/5.17;
    if(x>=-89.74&&x<=-87.55&&z>=50.41&&z<=54.20)return .16-.04*(x+89.74)/2.19;
    if(x>=-89.76&&x<=-80.48&&z>=42.5&&z<=56.8)return .12;
    return null;
  }
  const color={cream:"#ece0be",shell:"#d2be9c",stone:"#ac9a86",wall:"#dfd6bc",pink:"#cb856b",terra:"#9c6051",rust:"#955747",
    ink:"#293f45",navy:"#344e56",teal:"#417b78",green:"#62938b",pistachio:"#adaf86",mint:"#a3b8a6",glass:"#789f98",night:"#435e65",
    zinc:"#879590",steel:"#637875",paper:"#eadbb5",lamp:"#ffe7ae",umber:"#665b54",tire:"#454c49",blanket:"#8aada6",floor:"#c3b9a5"};
  const tau=Math.PI*2,clamp=(x,min,max)=>Math.min(max,Math.max(min,x));
  function flat(g,x0,x1,z0,z1,y,c){g.quad([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],c);}
  const north=(x,z)=>(u,v)=>[x-u,v,z],east=(x,z)=>(u,v)=>[x,v,z+u],south=(x,z)=>(u,v)=>[x+u,v,z];
  function panel(g,f,u,v,w,h,c){g.quad(f(u-w/2,v-h/2),f(u+w/2,v-h/2),f(u+w/2,v+h/2),f(u-w/2,v+h/2),c);}
  function line(g,f,ax,ay,bx,by,width,c){
    const dx=bx-ax,dy=by-ay,k=width*.5/(Math.hypot(dx,dy)||1);
    g.quad(f(ax-dy*k,ay+dx*k),f(bx-dy*k,by+dx*k),f(bx+dy*k,by-dx*k),f(ax+dy*k,ay-dx*k),c);
  }
  // Lettering is cut to the same square-stroke alphabet on the roadside pylon, canopy and ward.
  const alphabet={A:"040110304144 0242",B:"040030413202 32433404",C:"40100103143444",D:"04003041433404",E:"40000444 0232",F:"040040 0232",G:"401001031434434222",H:"0004 4044 0242",I:"0040 2024 0444",J:"104043341403",K:"0004 400244",L:"000444",M:"0400224044",N:"04004440",O:"103041433414030110",P:"040030413202",Q:"103041433414030110 2344",R:"040030413202 2244",S:"40100112023243341404",T:"0040 2024",U:"000314344340",V:"002440",W:"0004224440",X:"0044 4004",Y:"002240 2224",Z:"00400444",0:"103041433414030110",1:"112024 1444",2:"01103041420444",3:"003041322242433404",4:"000242 4044",5:"40000232433404",6:"40100103041434433202",7:"004014",8:"10304132020110 02324334140302",9:"420201103041433404"};
  // Each pair is an x,y grid coordinate measured from the top-left of the glyph.
  function word(g,f,str,u,v,h,c){
    const cell=h/4,advance=cell*4.42,w=cell*2.94,stem=h*.105;
    let x=u-(str.length*advance-(advance-w))/2;
    for(const ch of str){
      if(ch!==" ")for(const run of (alphabet[ch]||"").split(" "))for(let i=2;i<run.length;i+=2){
        line(g,f,x+(+run[i-2])*w/4,v+h/2-(+run[i-1])*cell,x+(+run[i])*w/4,v+h/2-(+run[i+1])*cell,stem,c);
      }
      x+=advance;
    }
  }
  function sprig(g,f,u,v,size,c){
    const p=(a,b,d,e,w)=>line(g,f,u+a*size,v+b*size,u+d*size,v+e*size,w*size,c);
    p(0,-.42,.02,.19,.083);
    [[-.42,.13,-.20,.31],[-.20,.31,0,.23],[-.36,-.05,-.17,.13],[-.17,.13,.02,.19],[.02,.23,.20,.36],[.20,.36,.42,.23],[.02,.19,.22,.16],[.22,.16,.4,0],[-.17,.43,.02,.23]].forEach(a=>p(...a,.064));
    p(-.28,-.40,.25,-.40,.061);
  }
  const registries=new WeakSet();
  function install(model){if(!registries.has(model)){buildModels(model);registries.add(model);}}
  function world(list,see,t=0,hours,patientPresent=false,records=0){
    if(!see(site.center,170))return;
    const near=see(site.center,65);list.push([near?"palm-clinic":"palm-clinic-far",0,0,0,0]);
    if(!near)return;
    if((hours?.night||0)>.06)list.push(["palm-clinic-lights",0,0,0,0,0,0,.81*hours.night]);
    if(recordCount(records)>0)list.push(["palm-clinic-cards",0,0,0,0]);
    if(patientPresent)list.push(["palm-clinic-linen",0,0,0,0]);
  }
  function recordCount(records){
    if(Number.isFinite(records))return records;
    if(Array.isArray(records))return records.length;
    if(records?.count&&typeof records.count==="object")return Object.values(records.count).reduce((sum,n)=>sum+(Number.isFinite(n)?n:0),0);
    return Number(records?.completed||records?.delivered||records?.count||0);
  }
  function buildModels(model){
    model("palm-clinic",g=>building(g,true));model("palm-clinic-far",g=>building(g,false));
    model("palm-clinic-lights",lights);model("palm-clinic-cards",cards);model("palm-clinic-linen",linen);
  }
  function ribbonWindow(g,x,z,len,alongX,detail){
    const b=(u,y,w,h,thick,c)=>alongX?g.box(x+u,y,z,w,h,thick,c):g.box(x,y,z+u,thick,h,w,c);
    if(!detail){b(0,1.845,len,3.37,.22,color.wall);b(0,1.93,len-.53,1.36,.233,color.glass);return;}
    b(0,.69,len,1.06,.22,color.wall);b(0,3.12,len,.82,.22,color.wall);
    const jamb=Math.min(.48,len*.12),open=len-2*jamb;
    for(const sign of [-1,1])b(sign*(len-jamb)/2,1.96,jamb,1.50,.22,color.wall);
    b(0,1.23,open,.10,.32,color.shell);b(0,2.67,open,.12,.24,color.teal);b(0,2.50,open,.21,.065,color.glass);
    b(0,1.38,open,.23,.065,color.glass);
    const lights=Math.max(1,Math.round(open/1.3));
    for(let j=0;j<=lights;j++)b(-open/2+j*open/lights,1.93,.063,1.42,.115,color.steel);
    if(detail){b(0,2.14,open,.052,.095,color.zinc);b(0,1.51,open,.036,.10,color.paper);}
  }
  function pavement(g,detail){
    const apron=[[ -89.78,39.03],[-84.5,39.03],[-78.95,37.85],[-78.95,42.30],[-81.72,44.03],[-81.55,54.64],[-78.95,58.17],[-78.95,62.1],[-85.35,58.9],[-89.78,58.9]];
    const anchor=[-85.15,.117,49.30];
    for(let i=0;i<apron.length;i++){const a=apron[i],b=apron[(i+1)%apron.length];g.tri(anchor,[a[0],.117,a[1]],[b[0],.117,b[1]],"#a6a296");}
    g.quad([-96.45,.16,59.25],[-92.75,.16,59.25],[-92.75,.105,64.45],[-96.45,.105,64.45],"#cebea5");
    g.quad([-89.78,.161,50.41],[-87.55,.122,50.41],[-87.55,.122,54.20],[-89.78,.161,54.20],color.floor);
    for(const x of [-87.08,-83.09])flat(g,x-.051,x+.051,44.57,51.46,.133,"#ead8a4");
    flat(g,-87.11,-83.04,44.56,44.67,.134,"#ead8a4");
    if(!detail)return;
    for(const z of [46.37,50.14,54.39])flat(g,-89.6,-81.61,z-.019,z+.019,.125,"#88897e");
    for(const z of [60.24,62.37]){
      const y=.16-.055*(z-59.28)/5.17+.004;flat(g,-96.42,-92.78,z-.014,z+.014,y,"#a69888");
    }
    for(let i=0;i<4;i++)g.quad([-87.45,.135,51.12+i*.75],[-87.32,.135,51.12+i*.75],[-87.70,.135,51.55+i*.75],[-87.83,.135,51.55+i*.75],color.cream);
    const arrow=(x,z)=>{
      flat(g,x-.105,x+.105,z-.18,z+.64,.137,color.cream);
      g.tri([x-.41,.138,z-.13],[x+.41,.138,z-.13],[x,.138,z-.72],color.cream);
    };
    arrow(-85.05,55.63);arrow(-84.13,43.68);
    const drainX=-82.11,drainZ=48.80;flat(g,drainX-.20,drainX+.20,drainZ-.39,drainZ+.39,.13,color.steel);
    for(let j=0;j<5;j++)flat(g,drainX-.15,drainX+.15,drainZ-.30+j*.145,drainZ-.26+j*.145,.135,color.ink);
  }
  function pylon(g,detail){
    const x=-81.15,z=64.05;
    g.box(x,.22,z,.68,.24,.7,color.shell);g.box(x,1.66,z,.25,2.81,.30,color.steel);
    g.box(x,3.19,z,.92,1.75,.94,color.cream);g.box(x,2.61,z,.934,.53,.954,color.teal);
    g.box(x,4.07,z,.98,.09,1.0,color.pink);
    if(!detail)return;
    for(const f of [north(x,z+.478),east(x+.471,z)]){
      sprig(g,f,0,3.67,.45,color.teal);word(g,f,"PALM",0,3.31,.139,color.ink);word(g,f,"COUNTY",0,3.07,.118,color.ink);
    }
    for(const f of [north(x,z+.483),east(x+.478,z)])word(g,f,"CLINIC",0,2.62,.122,color.cream);
    g.box(x,1.92,z,.68,.32,.72,color.pink);
    word(g,north(x,z+.366),"24 H",0,1.92,.108,color.ink);word(g,east(x+.346,z),"24 H",0,1.92,.108,color.ink);
  }
  function canopy(g,detail){
    const x=-85.52,z=49.62;
    g.box(x,4.055,z,9.0,.23,13.29,color.cream);
    for(const pz of [45.50,53.50]){
      g.box(-81.08,2.08,pz,.24,3.74,.24,color.teal);g.box(-81.08,.56,pz,.34,.85,.34,color.shell);
      if(detail){g.box(-81.08,.83,pz,.347,.10,.347,color.pink);g.box(-81.08,1.03,pz,.29,.14,.29,color.cream);}
    }
    g.box(-81.005,4.24,z,.18,.53,13.37,color.teal);
    g.box(x,4.21,56.29,9.19,.47,.16,color.teal);g.box(x,4.20,42.95,9.19,.45,.16,color.teal);
    for(const zz of [42.94,56.30])g.box(x,4.49,zz,9.2,.071,.18,color.pink);
    g.box(-80.997,4.544,z,.20,.061,13.50,color.pink);
    if(!detail)return;
    // The aerial number is still visible in the worn blue-green paint on the canopy.
    const top=(u,v)=>[x+u,4.179,z+v];word(g,top,"04",0,0,2.10,"#8da99d");
    word(g,east(-80.906,z-.19),"COUNTY RECEIVING",0,4.24,.355,color.cream);
    const f=north(x,56.381);word(g,f,"AMBULANCE BAY",.28,4.21,.286,color.cream);
    // The period arrow is a cut-out in the same painted sheet as the sign.
    line(g,f,-3.33,4.31,-3.33,4.09,.045,color.cream);line(g,f,-3.46,4.20,-3.33,4.08,.049,color.cream);line(g,f,-3.19,4.20,-3.33,4.08,.049,color.cream);
    word(g,south(x,42.856),"WAY OUT",0,4.21,.25,color.cream);
    for(const zz of [45.50,49.62,53.50]){
      g.box(x,3.90,zz,8.69,.12,.12,color.zinc);
      g.box(-85.34,3.817,zz,1.34,.054,.25,color.steel);g.box(-85.34,3.781,zz,1.21,.028,.17,color.paper);
    }
  }
  function uncoveredBay(g,high){
    for(const z of [45.50,53.50]){
      g.box(-81.08,.51,z,.34,.79,.34,color.shell);
      if(high)g.box(-81.08,2.39,z,.24,2.97,.24,color.teal);
      else g.box(-81.08,.94,z,.26,.096,.26,color.teal);
    }
    if(high)g.box(-81.08,3.94,49.62,.12,.09,13.29,color.teal);
  }
  function building(g,detail,cut=false,openBay=false){
    pavement(g,detail);g.box(-94.625,.124,49.45,10.17,.071,19.92,color.floor);
    if(cut){
      for(const [x,z,w,d] of walls){g.box(x,.37,z,w,.42,d,color.wall);g.box(x,.59,z,w+.025,.033,d+.025,color.teal);}
      uncoveredBay(g,false);
      pylon(g,true);interior(g,true);return;
    }
    g.box(-99.60,1.845,49.45,.22,3.37,19.92,color.wall);g.box(-94.625,1.845,39.60,10.17,3.37,.22,color.wall);
    ribbonWindow(g,-97.89,59.30,3.64,true,detail);ribbonWindow(g,-91.37,59.30,3.66,true,detail);
    ribbonWindow(g,-89.65,42.19,5.18,false,detail);ribbonWindow(g,-89.65,47.60,5.65,false,detail);ribbonWindow(g,-89.65,56.75,5.10,false,detail);
    g.box(-96.52,1.01,54.70,6.16,1.70,.14,color.cream);g.box(-96.52,3.29,54.70,6.16,.47,.14,color.wall);
    for(const x of [-99.50,-96.71,-93.52])g.box(x,2.47,54.70,.105,1.21,.14,color.steel);
    g.box(-96.52,1.87,54.70,6.16,.07,.19,color.teal);
    g.box(-94.625,3.73,49.45,10.48,.40,20.30,color.shell);g.box(-94.625,3.94,49.45,10.59,.09,20.43,color.pink);
    g.box(-94.625,3.20,59.30,3.00,.68,.25,color.wall);
    g.box(-94.62,3.13,60.0,5.46,.20,1.58,color.teal);g.box(-94.62,3.29,60.81,5.53,.48,.14,color.teal);
    g.box(-94.62,3.56,60.81,5.55,.078,.18,color.pink);
    g.box(-89.65,3.17,52.31,.25,.72,3.87,color.wall);
    for(const zz of [50.40,54.21])g.box(-89.64,1.50,zz,.26,2.70,.095,color.steel);
    if(openBay)uncoveredBay(g,true);else canopy(g,detail);
    pylon(g,detail);
    if(!detail)return;
    word(g,north(-94.62,60.887),"PALM COUNTY CLINIC",0,3.30,.262,color.cream);
    for(const x of [-96.12,-93.07])g.box(x,1.52,59.31,.082,2.70,.29,color.teal);
    g.box(-94.60,2.89,59.30,3.11,.13,.30,color.teal);
    g.box(-94.60,3.015,59.58,1.08,.06,.25,color.paper);
    g.box(-89.45,2.94,52.31,.10,.34,3.53,color.cream);
    word(g,east(-89.392,52.31),"RECEIVING",0,2.94,.215,color.teal);
    // The outward-sliding inner leaves sit against the wall, keeping the full doorway open.
    for(const zz of [49.80,54.84]){
      g.box(-89.82,1.02,zz,.08,1.68,1.06,color.mint);g.box(-89.82,2.08,zz,.08,.41,1.06,color.glass);
      g.box(-89.78,1.10,zz,.16,.073,.94,color.steel);
    }
    roofGear(g);interior(g);
  }
  function roofGear(g){
    g.box(-97.92,4.18,43.35,1.45,.42,2.24,color.zinc);g.box(-97.92,4.42,43.35,1.55,.09,2.32,color.steel);
    for(const z of [42.86,43.82]){
      g.cyl(-97.92,4.49,z,.344,.344,.066,10,color.ink);
      for(let j=0;j<3;j++)g.box(-97.92,4.533,z,.056,.02,.59,color.zinc,.12+Math.PI*j/3);
    }
    g.box(-94.25,4.06,41.16,3.07,.15,.26,color.zinc);g.cyl(-92.85,4.25,41.16,.125,.125,.38,8,color.zinc);
    g.cyl(-92.85,4.51,41.16,.02,.22,.15,8,color.steel);
    // Painted roof seams also give drivers a clean silhouette from neighboring elevated roads.
    for(const x of [-98.18,-96.04,-93.90,-91.76])flat(g,x-.019,x+.019,39.34,59.54,3.989,"#ae8c79");
  }
  function frontDesk(g){
    const x=-94.60,z=56.83;
    g.box(x,.645,z,2.98,.90,.44,color.teal);g.box(x,.265,z+.224,2.96,.15,.035,color.steel);
    g.box(x,1.135,z,3.14,.09,.53,color.shell);g.box(x,1.193,z,3.18,.031,.55,color.paper);
    for(const xx of [-95.84,-95.57,-95.30])g.box(xx,.69,z+.230,.034,.58,.036,color.green);
    g.box(-94.48,.75,z+.251,1.12,.30,.041,color.cream);word(g,north(-94.48,z+.275),"DISPATCH",0,.75,.124,color.ink);
    // An angled dispatch radio, spiral-bound log, call bell and brass number clip.
    g.box(-93.55,1.27,z,.35,.114,.23,color.ink);g.box(-93.55,1.344,z,.30,.035,.175,color.navy);
    for(let i=0;i<3;i++)g.box(-93.65+.082*i,1.365,z+.048,.047,.016,.033,i===0?color.pink:color.mint);
    g.pole([-93.68,1.32,z-.07],[-93.72,1.60,z-.12],.013,color.steel,4);
    g.box(-94.54,1.229,z,.36,.027,.228,color.terra,.08);g.box(-94.54,1.248,z,.328,.011,.199,color.paper,.08);
    for(let i=0;i<3;i++)g.box(-94.55,1.255,z-.035+.039*i,.19,.006,.009,color.steel,.08);
    g.cyl(-95.55,1.231,z+.04,.078,.081,.043,8,color.umber);g.cyl(-95.55,1.277,z+.04,.028,.066,.057,8,color.zinc);
    g.cyl(-95.55,1.315,z+.04,.016,.016,.035,6,color.ink);
    g.box(-95.05,1.241,z+.07,.023,.019,.16,"#dca259",.41);
    // Vinyl waiting seats hang off one steel rail fixed into the terrazzo.
    g.box(-98.84,.52,56.98,.13,.13,2.1,color.steel);
    for(const zz of [56.16,57.81])g.box(-98.83,.345,zz,.48,.32,.072,color.steel);
    for(const zz of [56.24,56.98,57.72]){
      g.box(-98.75,.62,zz,.58,.115,.60,color.teal);g.box(-99.01,.88,zz,.105,.48,.59,color.green);
      g.box(-99.01,1.13,zz,.10,.056,.57,color.mint);
    }
  }
  function rosette(g,f,u,v,r,c,n=12){
    for(let j=0;j<n;j++)g.tri(f(u,v),f(u+r*Math.cos(tau*j/n),v+r*Math.sin(tau*j/n)),f(u+r*Math.cos(tau*(j+1)/n),v+r*Math.sin(tau*(j+1)/n)),c);
  }
  function wallArt(g){
    // The dispatch print is an egret standing in the salt grass, block-printed in four local inks.
    const f=north(-97.13,54.806);
    panel(g,f,0,1.37,2.12,.86,color.umber);
    const p=north(-97.13,54.811);panel(g,p,0,1.37,2.05,.80,color.paper);
    const art=north(-97.13,54.818);panel(g,art,0,1.25,1.93,.44,"#9cbaaa");
    rosette(g,art,-.58,1.52,.145,"#cf8766");
    for(const [a,b,yy] of [[-.94,-.52,1.18],[-.43,-.09,1.15],[.36,.81,1.24],[-.72,-.13,1.07],[.17,.61,1.09]])line(g,art,a,yy,b,yy+.02,.019,color.teal);
    const heron=north(-97.13,54.827);g.tri(heron(-.13,1.28),heron(.17,1.44),heron(.39,1.28),color.cream);
    [[.17,1.40,.14,1.55],[.14,1.55,.21,1.61],[.21,1.61,.28,1.58]].forEach(q=>line(g,heron,...q,.042,color.cream));
    line(g,heron,.275,1.58,.43,1.555,.025,color.umber);line(g,heron,.09,1.30,.04,1.14,.014,color.umber);line(g,heron,.20,1.30,.23,1.12,.014,color.umber);
    for(const n of [.62,.68,.79,.89])line(g,heron,n,1.15,n-.08,1.36+(n%1)*.05,.017,color.green);
    const clock=north(-94.25,54.785);rosette(g,clock,0,1.46,.196,color.steel);const face=north(-94.25,54.792);
    rosette(g,face,0,1.46,.16,color.paper);line(g,face,0,1.46,-.08,1.51,.019,color.navy);line(g,face,0,1.46,.01,1.58,.016,color.navy);
    // Card rail faces the waiting room. Its postcards arrive after a completed shift.
    g.box(-95.54,1.28,54.795,.75,.035,.058,color.terra);
  }
  function ward(g,cut){
    const x=site.cot.x,z=site.cot.z;
    g.box(x,.332,z,1.62,.14,.54,color.steel);
    for(const xx of [x-.72,x+.72])for(const zz of [z-.30,z+.30]){
      g.box(xx,.275,zz,.095,.17,.095,color.steel);g.box(xx,.212,zz,.148,.095,.105,color.tire);
    }
    g.box(x,.51,z,.27,.24,.34,color.zinc);g.box(x,.631,z,2.10,.095,.89,color.steel);
    g.box(x,.735,z,2.05,.20,.89,color.cream);g.box(x+.31,.849,z,1.26,.055,.91,color.blanket);
    g.box(x+.41,.880,z,.082,.012,.88,color.pistachio);g.box(x-.69,.87,z,.40,.095,.72,color.paper);
    for(const xx of [x-.99,x+.99]){
      for(const zz of [z-.375,z+.375])g.box(xx,.852,zz,.047,.44,.047,color.zinc);
      g.box(xx,1.059,z,.052,.06,.80,color.zinc);
    }
    g.box(-98.98,.69,44.40,.78,1.04,4.74,color.mint);g.box(-98.98,1.244,44.40,.83,.075,4.80,color.cream);
    for(const zz of [42.98,44.03,45.08,46.1])g.box(-98.578,1.05,zz,.049,.034,.24,color.steel);
    g.box(-98.93,1.288,45.41,.50,.019,.61,color.zinc);g.box(-98.93,1.301,45.41,.37,.011,.47,color.navy);
    g.pole([-99.18,1.29,45.41],[-99.16,1.56,45.41],.021,color.zinc,5);g.pole([-99.16,1.56,45.41],[-99.00,1.56,45.41],.021,color.zinc,5);
    g.box(-96.36,1.13,40.13,3.65,1.94,.83,color.green);g.box(-96.36,2.12,40.13,3.72,.08,.88,color.cream);
    for(const xx of [-97.56,-96.36,-95.16]){g.box(xx,1.15,40.57,1.09,1.74,.043,color.mint);g.box(xx+.39,1.16,40.605,.041,.19,.035,color.steel);}
    const plaque=north(-96.36,40.603);panel(g,plaque,0,1.69,.66,.20,color.paper);word(g,north(-96.36,40.607),"LINEN",0,1.69,.086,color.teal);
    // The curtain is pulled along the southern rail, keeping the rear-door-to-bed aisle open.
    const rail=49.74,west=-97.85;
    if(!cut){
      g.box(-95.74,2.93,rail,4.27,.055,.055,color.steel);g.box(west,2.93,50.56,.055,.055,1.68,color.steel);
      for(const [xx,zz] of [[west,51.35],[-93.65,rail],[west,rail]])g.pole([xx,2.93,zz],[xx,3.53,zz],.019,color.zinc,5);
    }
    const curtainTop=cut?1.44:2.77;
    for(let j=0;j<15;j++){
      const a=west+.048+j*.128,b=a+.128,v=rail+(j%2?.092:-.092),q=rail+(j%2?-.092:.092),bottom=.53+Math.sin(j*.79)*.025;
      g.quad([a,bottom,v],[b,bottom,q],[b,curtainTop,q],[a,curtainTop,v],j%2?"#899d87":"#abb69c");
      g.quad([a,curtainTop-.28,v-.005],[b,curtainTop-.28,q-.005],[b,curtainTop-.22,q-.005],[a,curtainTop-.22,v-.005],color.paper);
      if(!cut&&j%3===0)g.pole([a,2.76,v],[a,2.93,rail],.014,color.steel,4);
    }
    const f=east(-99.477,51.00);panel(g,f,0,2.31,2.21,.50,color.green);word(g,east(-99.47,51.00),"WARD 1",0,2.31,.231,color.cream);
    g.box(-99.435,1.14,48.05,.13,.14,11.16,color.mint);g.box(-99.41,.45,48.06,.15,.065,11.18,color.stone);
    g.box(-99.395,1.66,50.55,.18,.29,1.18,color.paper);g.box(-99.286,1.70,50.10,.050,.072,.076,color.terra);
    for(const zz of [50.45,50.74])g.box(-99.291,1.68,zz,.036,.097,.128,color.steel);
    g.pole([-99.31,1.56,50.76],[-99.29,1.12,50.81],.013,color.navy,4);g.pole([-99.29,1.12,50.81],[-99.33,1.29,50.91],.012,color.navy,4);
    g.box(-99.33,2.01,50.55,.22,.072,1.07,color.zinc);g.box(-99.27,1.963,50.55,.16,.027,.93,color.lamp);
    // Stacked clean wraps, chipped enamel bowl and labeled linen cupboards occupy the work alcove.
    for(let j=0;j<3;j++)g.box(-98.95,1.311+j*.065,43.47,.47,.06,.59,j===1?color.cream:color.blanket,j%2?.06:-.025);
    g.cyl(-98.95,1.332,42.62,.19,.115,.13,9,color.paper);g.cyl(-98.95,1.407,42.62,.166,.167,.024,9,color.green);
  }
  function interior(g,cut=false){
    for(const xx of [-98.12,-95.88,-93.64,-91.40])flat(g,xx-.012,xx+.012,39.79,59.17,.165,"#b4ac9b");
    for(let zz=40.84;zz<59.20;zz+=2.24)flat(g,-99.42,-89.81,zz-.012,zz+.012,.165,"#b4ac9b");
    flat(g,-97.06,-89.78,51.47,51.52,.168,color.teal);flat(g,-97.06,-89.78,53.18,53.23,.168,color.teal);
    if(!cut)for(const zz of [41.89,46.45,51.10,56.48]){
      g.box(-95.51,3.47,zz,1.96,.09,.48,color.zinc);g.box(-95.51,3.41,zz,1.81,.045,.36,color.paper);
    }
    frontDesk(g);ward(g,cut);wallArt(g);
  }
  function lights(g){
    for(const zz of [45.50,49.62,53.50])g.box(-85.34,3.764,zz,1.17,.037,.17,color.lamp);
    for(const zz of [41.89,46.45,51.10,56.48])g.box(-95.51,3.38,zz,1.79,.03,.34,color.lamp);
    g.box(-94.60,2.974,59.58,1.00,.032,.19,color.lamp);
    for(const f of [north(-81.15,64.536),east(-80.669,64.05)])word(g,f,"CLINIC",0,2.62,.122,color.lamp);
    word(g,north(-94.62,60.89),"PALM COUNTY CLINIC",0,3.30,.262,color.paper);
    word(g,east(-80.904,49.43),"COUNTY RECEIVING",0,4.24,.355,color.paper);
  }
  function cards(g){
    const f=north(-95.54,54.832);panel(g,f,-.137,1.41,.24,.16,color.paper);panel(g,f,.14,1.36,.22,.13,"#e4b194");
    const ink=north(-95.54,54.838);sprig(g,ink,-.18,1.42,.10,color.teal);line(g,ink,-.11,1.43,-.05,1.43,.014,color.steel);
    line(g,ink,.077,1.36,.182,1.36,.012,color.terra);line(g,ink,.077,1.33,.15,1.33,.009,color.terra);
  }
  function linen(g){g.box(-94.50,.908,50.55,.29,.077,.67,color.paper);g.box(-94.50,.954,50.55,.22,.039,.59,color.mint);}
  const planRegion={x:-101.0,z:37.2,w:23.3,d:29.3},planCache=new Map();
  // Cache the exterior, occupied apron and walk-in cutaway at the atlas camera's projection.
  function planPlate(cut,openBay){
    const state=cut?2:openBay?1:0;
    if(planCache.has(state))return planCache.get(state);
    const box=planRegion,w=Math.ceil(box.w*16),h=Math.ceil(box.d*16);
    const page=typeof OffscreenCanvas==="function"?new OffscreenCanvas(w,h):typeof document!=="undefined"?document.createElement("canvas"):null;
    if(page){page.width=w;page.height=h;}
    const ctx=page?.getContext?.("2d");
    if(!ctx?.createImageData||!ctx?.putImageData){planCache.set(state,null);return null;}
    const mesh=new BayMesh();building(mesh,true,cut,openBay);
    const v=mesh.vertices,draw=ctx.createImageData(w,h),pixels=draw.data,depth=new Float32Array(w*h);
    depth.fill(-Infinity);
    const mapX=i=>(v[i]+.22*v[i+1]-box.x)*w/box.w,mapZ=i=>(v[i+2]+.27*v[i+1]-box.z)*h/box.d;
    for(let a=0;a<v.length;a+=18){
      const b=a+6,d=a+12,x=mapX(a),y=mapZ(a),x1=mapX(b),y1=mapZ(b),x2=mapX(d),y2=mapZ(d),dx=x1-x,dy=y1-y,ex=x2-x,ey=y2-y,den=dx*ey-dy*ex;
      if(Math.abs(den)<.00001)continue;
      const l=Math.max(0,Math.floor(Math.min(x,x1,x2))),r=Math.min(w-1,Math.ceil(Math.max(x,x1,x2))),
        low=Math.max(0,Math.floor(Math.min(y,y1,y2))),high=Math.min(h-1,Math.ceil(Math.max(y,y1,y2))),inv=1/den;
      for(let iy=low;iy<=high;iy++){
        const py=iy+.5-y;
        for(let ix=l;ix<=r;ix++){
          const px=ix+.5-x,u=(px*ey-py*ex)*inv,k=(dx*py-dy*px)*inv;
          if(u<-.00001||k<-.00001||u+k>1.00001)continue;
          const z=v[a+1]+u*(v[b+1]-v[a+1])+k*(v[d+1]-v[a+1]),p=iy*w+ix;
          if(z<depth[p]-.00001)continue;depth[p]=z;
          const n=p*4;pixels[n]=255*v[a+3];pixels[n+1]=255*v[a+4];pixels[n+2]=255*v[a+5];pixels[n+3]=255;
        }
      }
    }
    ctx.putImageData(draw,0,0);planCache.set(state,page);return page;
  }
  function overlayPlan(c,night,cut){
    if(night<.05)return;
    c.save();c.globalAlpha*=night*.45;c.fillStyle="#334952";c.fillRect(-99.84,39.47,10.29,20.01);
    c.fillRect(-89.65,42.99,8.58,13.34);c.globalAlpha=night*.54;c.fillStyle="#ffe2a0";
    if(cut){for(const zz of [45.50,49.62,53.50])c.fillRect(-86.0,zz-.075,1.32,.15);}
    c.fillRect(-95.06,59.94,.97,.12);c.restore();
  }
  function map(c,opt,px,py,s,visible,t=0){
    const street=opt.mode==="street",atlas=opt.mode==="atlas";
    if(atlas&&(opt.countyChart||opt.marina?.bayChart)||!visible(px(site.center.x),py(site.center.z),18*s+18))return;
    const rect=(x,z,w,d,fill)=>{c.fillStyle=fill;c.fillRect(x-w/2,z-d/2,w,d);};
    const showInside=street&&interiorVisible(opt.player),openBay=street&&(showInside||inBay(opt.rescue?.v)||opt.cars?.some(v=>inBay(v)));
    c.save();c.translate(px(0),py(0));c.scale(s,-s);
    if(street){
      const plate=planPlate(showInside,openBay);
      if(plate){
        const q=planRegion;c.drawImage(plate,q.x,q.z,q.w,q.d);
        if(showInside&&recordCount(opt.rescue?.saved)>0){rect(-95.11,55.19,.24,.12,color.paper);rect(-95.39,55.18,.22,.10,"#e4b194");}
        if(showInside&&opt.rescue?.recovering)rect(-94.30,50.85,.25,.61,color.mint);
        overlayPlan(c,opt.weather?.night||0,showInside);c.restore();return;
      }
    }
    c.beginPath();c.moveTo(-89.8,39.0);c.lineTo(-79,37.85);c.lineTo(-79,42.3);c.lineTo(-81.65,44.05);c.lineTo(-81.55,54.6);c.lineTo(-79.0,58.2);c.lineTo(-79,62.1);c.lineTo(-85.35,58.9);c.lineTo(-89.8,58.9);c.closePath();c.fillStyle="#a6a296";c.fill();
    rect(-94.60,61.7,3.70,5.4,"#cdbda5");
    if(!showInside){
      rect(-94.63,49.45,10.38,20.18,color.terra);rect(-94.63,49.45,10.08,19.88,"#c98e75");
      if(street){for(const x of [-98.18,-96.04,-93.90,-91.76])rect(x,49.44,.054,19.82,"#b27a65");rect(-97.92,43.35,1.52,2.31,color.steel);}
      rect(-94.6,60.05,5.5,1.60,color.teal);
    }else{
      rect(-94.625,49.45,10.17,19.92,color.floor);
      for(const x of [-98.12,-95.88,-93.64,-91.40])rect(x,49.45,.028,19.68,"#b4aa97");
      for(let z=40.84;z<59.2;z+=2.24)rect(-94.65,z,9.8,.028,"#b4aa97");
      for(const [x,z,w,d] of walls){rect(x,z,w+.085,d+.085,color.teal);rect(x,z,w,d,color.cream);}
      rect(-94.60,56.83,3.15,.55,color.teal);rect(-94.56,56.84,.34,.21,color.paper);rect(-93.55,56.83,.34,.23,color.ink);
      rect(-98.86,56.98,.55,2.10,color.steel);for(const z of [56.24,56.98,57.72])rect(-98.78,z,.62,.58,color.green);
      rect(site.cot.x,site.cot.z,2.17,.94,color.steel);rect(site.cot.x,site.cot.z,2.03,.86,color.cream);
      rect(-94.97,50.55,1.29,.87,color.blanket);rect(-95.94,50.55,.40,.69,color.paper);
      rect(-94.99,51.50,4.17,.056,color.teal);rect(-94.99,53.20,4.17,.056,color.teal);
      rect(-98.98,44.40,.84,4.80,color.cream);rect(-98.93,45.41,.48,.61,color.steel);rect(-96.36,40.13,3.65,.83,color.green);
      c.beginPath();c.moveTo(-97.85,49.74);for(let j=0;j<16;j++)c.lineTo(-97.80+j*.128,49.74+(j%2?.085:-.085));c.strokeStyle="#7a917f";c.lineWidth=.12;c.stroke();
    }
    if(openBay){
      for(const x of [-87.08,-83.09])rect(x,48.0,.094,6.94,color.paper);rect(-85.08,44.61,4.04,.093,color.paper);
      for(const z of [45.50,53.50])rect(-81.08,z,.34,.34,color.teal);
    }else{
      rect(-85.52,49.62,9.0,13.29,color.teal);rect(-85.58,49.62,8.61,12.92,"#a0b4a6");
      if(street)for(const z of [45.50,49.62,53.50])rect(-85.58,z,8.6,.062,"#849d93");
    }
    rect(-81.15,64.05,.95,.96,color.pink);rect(-81.15,64.05,.71,.72,color.teal);
    c.restore();
    if(street)return;
    const size=c.canvas?Math.min(c.canvas.width,c.canvas.height):230,ui=clamp(size/(atlas?370:165),.73,1.61);
    if(!visible(px(site.desk.x),py(site.desk.z),10*ui))return;
    c.save();c.translate(px(site.desk.x),py(site.desk.z));c.scale(ui,ui);
    c.fillStyle=color.ink;c.beginPath();c.arc(0,0,6.9,0,tau);c.fill();c.fillStyle="#e0c49e";c.beginPath();c.arc(0,0,5.53,0,tau);c.fill();
    c.strokeStyle=color.teal;c.lineWidth=1.14;c.lineCap="round";c.beginPath();c.moveTo(0,3.5);c.lineTo(.05,-1.3);c.moveTo(-3.26,-.49);c.quadraticCurveTo(-2.60,-2.75,0,-1.46);c.quadraticCurveTo(1.82,-3.53,3.16,-1.82);c.moveTo(-3.15,1.19);c.quadraticCurveTo(-1.82,-1.12,.06,-.84);c.quadraticCurveTo(2.12,-1.07,3.21,.76);c.moveTo(-1.83,3.48);c.lineTo(1.72,3.48);c.stroke();
    if(atlas){const left=px(site.desk.x)>c.canvas.width*.68,k=left?-1:1;c.textAlign=left?"right":"left";c.textBaseline="middle";c.font="bold 8px system-ui";c.lineWidth=2.4;c.strokeStyle=color.ink;c.strokeText(site.name,k*8,-5);c.fillStyle="#f2dfbc";c.fillText(site.name,k*8,-5);}
    c.restore();
  }
  window.BayPalmClinic={site,blocks,cameraBlocks,floor,occludesActor,install,world,map};
})();
