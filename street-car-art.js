/* Sundown Bay Motor Registry. Chassis coordinates are in metres, with +Z forward. */
(() => {
  "use strict";
  const kinds=["coupe","hatch","cab","van","cruiser"],guestKinds={ruth:"hatch",des:"coupe",viv:"van"};
  const profiles=new Map(),registrations=new Map(),ready=new WeakMap(),mapCargo=new Map();
  const mix=(a,b,t)=>a+(b-a)*t;
  function plateFor(v){
    if(typeof v.plate==="string"){
      const vanity=v.plate.toUpperCase().replace(/[^A-Z0-9 -]/g,"").trim().slice(0,8);if(vanity)return vanity;
    }
    const identity=v.garageKey??v.id;
    if(identity==null)return "";
    if(registrations.has(identity))return registrations.get(identity);
    let serial;
    if(Number.isSafeInteger(identity)&&identity>=0)serial=(identity*17971+512831)>>>0;
    else{
      serial=2166136261;
      for(const c of String(identity))serial=Math.imul(serial^c.charCodeAt(0),16777619);
      serial=(serial^(serial>>>16))>>>0;
    }
    const alphabet="ABCDEFGHJKLMNPRSTUVWXYZ",n=alphabet.length;
    const letters=alphabet[Math.floor(serial/1000)%n]+alphabet[Math.floor(serial/(1000*n))%n]+alphabet[Math.floor(serial/(1000*n*n))%n];
    const number=letters+" "+String(serial%1000).padStart(3,"0");
    registrations.set(identity,number);return number;
  }
  function lampsOn(v,t){
    if(v.indicator!==-1&&v.indicator!==1)return false;
    const offset=typeof v.id==="number"?(v.id%13)*.071:0;
    return (t+offset) % .84 < .42;
  }
  function profile(kind){
    if(!kinds.includes(kind))return null;
    if(!profiles.has(kind)){
      const s=bayCarLayout(kind),last=s.sections.length-1;
      profiles.set(kind,{kind,s,rear:s.sections[0],front:s.sections[last],nearRear:s.sections[1],nearFront:s.sections[last-1]});
    }
    return profiles.get(kind);
  }
  function register(model,key,make){
    let keys=ready.get(model);if(!keys){keys=new Set();ready.set(model,keys);}
    if(!keys.has(key)){model(key,make);keys.add(key);}
    return key;
  }
  // Coordinates across a die, then down it. A slash lifts the stamping tool.
  const dies={
    A:"06 02 20 42 46/03 43",B:"06 00 30 41 42 33 03/23 33 44 45 36 06",C:"41 30 10 01 05 16 36 45",D:"00 20 41 45 26 06 00",
    E:"40 00 06 46/03 33",F:"06 00 40/03 33",G:"41 30 10 01 05 16 36 45 43 23",H:"00 06/40 46/03 43",I:"00 40/20 26/06 46",
    J:"20 40 45 36 16 05",K:"00 06/40 03 46",L:"00 06 46",M:"06 00 23 40 46",N:"06 00 46 40",O:"10 30 41 45 36 16 05 01 10",
    P:"06 00 30 41 42 33 03",Q:"10 30 41 45 36 16 05 01 10/24 46",R:"06 00 30 41 42 33 03/23 46",S:"41 30 10 01 02 13 33 44 45 36 16 05",
    T:"00 40/20 26",U:"00 05 16 36 45 40",V:"00 03 26 43 40",W:"00 06 23 46 40",X:"00 46/40 06",Y:"00 23 40/23 26",Z:"00 40 06 46",
    0:"10 30 41 45 36 16 05 01 10/05 41",1:"02 20 26/06 46",2:"01 10 30 41 42 06 46",3:"01 10 30 41 42 33 23/33 44 45 36 16 05",
    4:"30 03 04 44/30 36",5:"40 00 03 33 44 45 36 16 05",6:"40 10 01 05 16 36 45 44 33 03",7:"00 40 16",8:"10 30 41 42 33 13 02 01 10/13 04 05 16 36 45 44 33",
    9:"43 33 13 02 01 10 30 41 45 36 16", "-":"03 43"};
  const strokes=new Map(Object.entries(dies).map(([letter,raw])=>[letter,raw.split("/").map(path=>path.split(" ").map(pair=>[Number(pair[0]),Number(pair[1])]))]));
  function strokeDie(g,word,centerY,z){
    const step=Math.min(.052,.392/word.length),unitX=step*.18,unitY=.016,ink="#204a4b",left=-(word.length-1)*step*.5;
    for(let i=0;i<word.length;i++){
      const paths=strokes.get(word[i]);if(!paths)continue;
      for(const path of paths)for(let j=1;j<path.length;j++){
        const [a,b]=path[j-1],[c,d]=path[j];
        const x0=left+i*step+(a-2)*unitX,x1=left+i*step+(c-2)*unitX;
        const y0=centerY+(3-b)*unitY,y1=centerY+(3-d)*unitY;
        const dx=x1-x0,dy=y1-y0,len=Math.hypot(dx,dy);if(!len)continue;
        const width=.0049/len,ox=dy*width,oy=-dx*width,ex=dx*width*.44,ey=dy*width*.44;
        g.quad([x0-ex-ox,y0-ey-oy,z],[x0-ex+ox,y0-ey+oy,z],[x1+ex+ox,y1+ey+oy,z],[x1+ex-ox,y1+ey-oy,z],ink);
      }
    }
  }
  function rect(point,x0,y0,x1,y1,color){point(x0,y0,x1,y0,x1,y1,x0,y1,color);}
  function lamp(g,p,front,side,lit){
    const [z,w,h]=front?p.front:p.rear,[nextZ,nextW,nextH]=front?p.nearFront:p.nearRear,dir=front?1:-1;
    const face=(a,b,c,d,e,f,j,k,ink)=>{
      const at=(u,v)=>[side*(w-u),h+v,z+dir*(lit?.026:.016)];
      g.quad(at(a,b),at(c,d),at(e,f),at(j,k),ink);
    };
    const glass=lit?"#ffb332":"#a76435",lip=lit?"#ffe9a2":"#d68a4c";
    const base=front?-.202:-.246;
    face(.225,base+.018,.176,base+.069,.039,base+.069,.023,base+.011,glass);
    rect(face,.030,base+.037,.078,front?-.074:-.093,lip);
    // A second facet wraps the lens around the fender so cross traffic can see it.
    function sidePoint(run,dy){
      const f=run/Math.abs(nextZ-z),width=mix(w,nextW,f),height=mix(h,nextH,f),y=h+dy;
      const taper=Math.min(1,Math.max(0,(y-.34)/(height-.46)));
      return [side*(width-.08+.08*taper+(lit?.019:.011)),y,z-dir*run];
    }
    g.quad(sidePoint(.005,-.150),sidePoint(.205,-.150),sidePoint(.173,-.076),sidePoint(.005,-.076),glass);
    g.quad(sidePoint(.006,-.075),sidePoint(.174,-.075),sidePoint(.15,-.061),sidePoint(.006,-.061),lip);
  }
  function mirror(g,p,side,hinged=false){
    const s=p.s,x=side*(s.track+.053),z=p.kind==="van"?1.09:.56,y=p.kind==="van"?1.27:s.glass[4]+.085;
    const at=(inset,up,deep)=>[x-side*inset-(hinged?side*s.hingeX:0),y+up,z+deep-(hinged?s.hingeZ:0)];
    g.quad(at(.007,-.026,-.074),at(.147,-.025,-.076),at(.148,.020,-.079),at(.009,.041,-.082),"#a2bec0");
    g.quad(at(.023,-.019,-.080),at(.048,-.019,-.081),at(.096,.026,-.083),at(.068,.030,-.084),"#dce5d4");
    g.quad(at(.002,.043,-.077),at(.156,.024,-.078),at(.156,.035,-.076),at(.002,.056,-.076),"#d3d3b9");
  }
  function trim(g,p,withMirrors){
    const [z,,h]=p.rear,center=h-.166;
    const plate=(a,b,c,d,e,f,j,k,ink,depth)=>g.quad([a,center+b,z-depth],[c,center+d,z-depth],[e,center+f,z-depth],[j,center+k,z-depth],ink);
    function panel(x0,y0,x1,y1,ink,depth){plate(x0,y0,x1,y0,x1,y1,x0,y1,ink,depth);}
    panel(-.247,-.097,.247,.094,"#415252",.019);
    panel(-.233,-.081,.233,.083,"#e4ddb5",.022);
    panel(-.232,.061,.232,.080,"#619a91",.024);
    panel(.166,.060,.207,.080,"#d0884b",.026);
    for(const side of [-1,1]){
      panel(side*.216-.007,.035,side*.216+.007,.048,"#63746e",.026);
      lamp(g,p,false,side,false);lamp(g,p,true,side,false);
      if(withMirrors)mirror(g,p,side);
    }
  }
  // Illustrate the objects through the opaque rear pane, using its actual rake.
  // Each stroke uses the same glass coordinates in both views.
  function costumeBox(poly){
    poly([[-.51,.13],[.30,.13],[.42,.24],[.42,.55],[.24,.64],[-.49,.52]],"#443f46");
    poly([[-.48,.17],[.23,.17],[.23,.49],[-.48,.49]],"#b08a6d");
    poly([[.23,.17],[.39,.25],[.39,.54],[.23,.49]],"#816e5f");
    poly([[-.48,.50],[.23,.50],[.39,.55],[.22,.615]],"#c6a589");
    poly([[-.15,.17],[-.054,.17],[-.054,.495],[-.15,.495]],"#e1cba0");
    poly([[-.15,.50],[-.054,.50],[.105,.59],[.028,.595]],"#ddc39a");
    poly([[-.48,.48],[-.39,.42],[-.34,.465],[-.31,.443],[-.29,.493]],"#98768a");
    poly([[.026,.22],[.184,.22],[.184,.409],[.026,.409]],"#dfd2ac");
    poly([[.070,.263],[.143,.263],[.143,.363],[.070,.363]],"#a67780");
    for(const y of [.248,.354])poly([[.055,y],[.156,y],[.156,y+.028],[.055,y+.028]],"#664b60");
  }
  function oval(poly,x,y,rx,ry,color){
    const points=[];for(let i=0;i<16;i++){const a=i*Math.PI/8;points.push([x+rx*Math.cos(a),y+ry*Math.sin(a)]);}poly(points,color);
  }
  function recordSleeve(poly){
    // Des keeps the disc halfway out of its jacket on the parcel shelf.
    oval(poly,.25,.41,.157,.259,"#1c303e");oval(poly,.25,.41,.058,.094,"#bd9474");
    oval(poly,.25,.41,.014,.025,"#314550");
    poly([[-.115,.132],[.242,.157],[.212,.662],[-.146,.632]],"#e1be95");
    poly([[-.096,.167],[.219,.189],[.199,.615],[-.121,.590]],"#b57465");
    oval(poly,.042,.426,.071,.121,"#e9be83");
    poly([[-.112,.328],[-.025,.371],[.064,.338],[.205,.429],[.215,.188],[-.096,.167]],"#607f7a");
    poly([[-.072,.204],[.072,.215],[.070,.232],[-.074,.222]],"#e1c49c");
  }
  function diveFlag(poly){
    poly([[-.52,-.38],[.52,-.38],[.52,.37],[-.52,.37]],"#486863");
    poly([[-.45,-.31],[.45,-.31],[.45,.30],[-.45,.30]],"#d5bd96");
    poly([[-.397,-.253],[.397,-.253],[.397,.242],[-.397,.242]],"#ab6555");
    poly([[-.397,.242],[-.23,.242],[.397,-.134],[.397,-.253],[.235,-.253],[-.397,.127]],"#e3d3ad");
  }
  function projected(g,point){
    let layer=0;return (points,color)=>{
      const depth=.018+layer++*.00145,a=point(points[0][0],points[0][1],depth);
      // All painted facets are convex, including the stamped record and label.
      for(let i=1;i<points.length-1;i++)g.tri(a,point(...points[i],depth),point(...points[i+1],depth),color);
    };
  }
  function guestArt(g,p,id){
    const [rear,roofRear,,,sill,roof,baseHalf,roofHalf]=p.s.glass;
    const pane=projected(g,(x,v,depth)=>[x,mix(sill,roof,v),mix(rear,roofRear,v)-depth]);
    if(id==="ruth"){costumeBox(pane);return;}
    if(id==="des"){recordSleeve(pane);return;}
    for(const side of [-1,1]){
      const sidePaint=projected(g,(z,y,depth)=>[side*(mix(baseHalf,roofHalf,(y-sill)/(roof-sill))+depth),y,z]);
      sidePaint([[-1.98,1.51],[-1.79,1.59],[-.49,1.59],[-.26,1.69],[-.42,1.53],[-1.82,1.53]],"#426963");
      sidePaint([[-1.67,1.625],[-.52,1.625],[-.31,1.72],[-.49,1.657],[-1.62,1.657]],"#e3c99e");
      diveFlag((pts,ink)=>sidePaint(pts.map(([x,y])=>[-1.46+side*x*.38,1.65+y*.39]),ink));
    }
    diveFlag((pts,ink)=>pane(pts.map(([x,y])=>[.46+x*.28,.62+y*.28]),ink));
    const roofPaint=projected(g,(x,z,depth)=>[x,roof+depth*.55,z]);
    diveFlag((pts,ink)=>roofPaint(pts.map(([x,y])=>[.51+x*.37,-1.70+y*.44]),ink));
  }
  function trimKey(model,p,doorsOpen){
    return register(model,"registry/"+p.kind+(doorsOpen?"/open":"/trim"),g=>trim(g,p,!doorsOpen));
  }
  function install(model){for(const kind of kinds)trimKey(model,profile(kind),false);}
  function doorAngle(v,side){return Math.max(side===v.doorSide?v.doorAngle||0:0,side===1?v.passengerDoor||0:0);}
  function world(list,model,v,ground,t,distance=0){
    const p=profile(v.kind);if(!p||distance>76)return;
    const pitch=v.pitch||0,lean=v.lean||0;
    const add=(key,glow=0)=>list.push([key,v.x,ground,v.z,v.yaw,pitch,lean,glow,v]);
    if(distance<40){
      const doorsOpen=doorAngle(v,-1)>.025||doorAngle(v,1)>.025;
      add(trimKey(model,p,doorsOpen));
      if(doorsOpen){
        const cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(lean),sr=Math.sin(lean),sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
        for(const side of [-1,1]){
          const x=side*p.s.hingeX,z=p.s.hingeZ,h=-z*sp,a=x*cr-h*sr,b=z*cp;
          const key=register(model,"registry/"+p.kind+"/mirror"+side,g=>mirror(g,p,side,true));
          list.push([key,v.x+a*cs+b*sn,ground+x*sr+h*cr,v.z-a*sn+b*cs,v.yaw-side*doorAngle(v,side),pitch,lean,0,v,side]);
        }
      }
      if(guestKinds[v.guestId]===p.kind)add(register(model,"registry/cargo/"+v.guestId,g=>guestArt(g,p,v.guestId)));
      if(distance<18){
        const number=plateFor(v);
        if(number)add(register(model,"registry/plate/"+p.kind+"/"+number,g=>strokeDie(g,number,p.rear[2]-.174,p.rear[0]-.028)));
      }
    }
    if(lampsOn(v,t)){
      const side=v.indicator;
      add(register(model,"registry/"+p.kind+"/signal"+side,g=>{lamp(g,p,true,side,true);lamp(g,p,false,side,true);}),.97);
    }
  }
  function paintShape(c,coords,color){
    c.beginPath();c.moveTo(...coords[0]);for(let i=1;i<coords.length;i++)c.lineTo(...coords[i]);c.closePath();c.fillStyle=color;c.fill();
  }
  function mapGuest(c,v,b){
    let shapes=mapCargo.get(v.guestId);
    if(!shapes){
      shapes=[];const paint=(pts,color)=>shapes.push([pts,color]);
      if(v.guestId==="viv"){
        for(const side of [-1,1])paint([[side*(b-.09),.35],[side*(b-.035),.48],[side*(b-.035),1.86],[side*(b-.10),1.65]],"#416a63");
        diveFlag((pts,ink)=>paint(pts.map(([x,y])=>[.51+x*.37,1.70-y*.44]),ink));
      }else{
        const pane=(pts,color)=>paint(pts.map(([x,v])=>[x,1.32-v*.60]),color);
        if(v.guestId==="ruth")costumeBox(pane);else recordSleeve(pane);
      }
      mapCargo.set(v.guestId,shapes);
    }
    for(const [pts,ink] of shapes)paintShape(c,pts,ink);
  }
  function map(c,v,x,y,scale,t){
    const p=profile(v.kind);if(!p||scale<2.2)return;
    const van=p.kind==="van",l=van?2.32:p.kind==="hatch"?1.82:2.16,b=van?.97:.91;
    const damage=v.damage?BayBodyworkArt.plan(v,l,b):null,on=lampsOn(v,t);
    c.save();c.translate(x,y);c.rotate(v.yaw||0);c.scale(scale,scale);
    let tail=0;
    for(const side of [-1,1]){
      const lit=on&&side===v.indicator;
      for(const dir of [-1,1]){
        let xx=side*(b-.145),yy=dir*(l-.125);
        if(damage){
          const lens=damage.ends[side<0?0:1][dir<0?"head":"back"];
          let outer=0,center=0;for(let i=0;i<lens.length;i+=2){outer=Math.max(outer,side*lens[i]);center+=lens[i+1];}
          xx=side*(outer+.02);yy=center*2/lens.length;
        }
        if(dir>0)tail+=yy*.5;
        paintShape(c,[[xx,yy-dir*.104],[xx+side*.12,yy-dir*.174],[xx+side*.087,yy+dir*.080],[xx-side*.038,yy+dir*.080]],lit?"#ffac31":"#aa673b");
        if(lit){c.fillStyle="#ffe7a0";c.fillRect(xx-.054,yy-.042,.108,.084);}
      }
      if(scale<4)continue;
      const open=doorAngle(v,side);
      c.save();if(open){c.translate(side*p.s.hingeX,-p.s.hingeZ);c.rotate(-side*open);c.translate(-side*p.s.hingeX,p.s.hingeZ);}
      const mz=van?-1.09:-.56;
      paintShape(c,[[side*(b-.054),mz-.07],[side*(b+.12),mz-.092],[side*(b+.161),mz-.034],[side*(b+.143),mz+.080],[side*(b-.026),mz+.056]],"#596e73");
      paintShape(c,[[side*b,mz+.022],[side*(b+.143),mz+.044],[side*(b+.134),mz+.073],[side*b,mz+.051]],"#d7d8bf");c.restore();
    }
    if(scale>=4){
      const yy=tail+.025;
      c.fillStyle="#405052";c.fillRect(-.244,yy-.079,.488,.162);
      c.fillStyle="#e6dfb8";c.fillRect(-.231,yy-.065,.462,.135);
      c.fillStyle="#709f91";c.fillRect(-.229,yy-.065,.458,.024);
      if(scale>=25){
        const number=plateFor(v);if(number){c.font="bold .115px monospace";c.textAlign="center";c.textBaseline="middle";c.fillStyle="#23464a";c.fillText(number,0,yy+.018,.395);}
      }
      if(guestKinds[v.guestId]===v.kind)mapGuest(c,v,b);
    }
    c.restore();
  }
  window.BayStreetCars={install,plateFor,world,map};
})();
