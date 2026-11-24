/* Route 6 street furniture. The origin is the front-door boarding point at the curb. */
(() => {
  "use strict";
  const tau=Math.PI*2, steel="#606d66", dark="#34484b", enamel="#305e62";
  const cream="#eee1be", paper="#ddd2b1", fixture="#a6afa0", amber="#d1a566", red="#b66550";
  const styles={
    marlin:{frame:"#658e86",edge:"#538780",stripe:"#c4d7b8",seat:"#ac896e",wood:"#c29f79",name:"MARLIN"},
    cine:{frame:"#655d63",edge:"#725763",stripe:"#deaf77",seat:"#906d60",wood:"#b08a70",name:"CINE LUNA"},
    market:{frame:"#687d6d",edge:"#9b624f",stripe:"#d8c299",seat:"#7e9a8b",wood:"#9db0a0",name:"EL MERCADO"},
    port:{frame:"#66787b",edge:"#657d8c",stripe:"#bdc5b1",seat:"#987e62",wood:"#ac9274",name:"PORT SOL"}
  };
  const signX=1.16,signZ=1.15,flagYaw=-.62,roofCenterZ=-2.08,seatZ=[-1.26,-2.04,-2.82];
  function styleFor(stop){
    const key=String(stop.style||stop.id||stop.name||"").toLowerCase();
    if(/cine|luna|theat/.test(key))return "cine";
    if(/marlin|motel/.test(key))return "marlin";
    if(/port|harbou?r|foundry/.test(key))return "port";
    return "market";
  }
  function at(stop,x,z){
    const yaw=stop.yaw||0,cs=Math.cos(yaw),sn=Math.sin(yaw);
    return {x:stop.x+cs*x+sn*z,z:stop.z-sn*x+cs*z};
  }
  const ground=stop=>Number.isFinite(stop.y)?stop.y:.076;
  function seats(stop){
    return seatZ.map((z,id)=>({...at(stop,2.14,z),id,y:ground(stop)+.47,yaw:(stop.yaw||0)-Math.PI/2,
      approach:{...at(stop,1.43,z),y:ground(stop)}}));
  }
  function boxAt(stop,x,z,w,d,bottom,top){
    const cs=Math.abs(Math.cos(stop.yaw||0)),sn=Math.abs(Math.sin(stop.yaw||0)),base=ground(stop);
    return {...at(stop,x,z),w:cs*w+sn*d,d:sn*w+cs*d,bottom:base+bottom,top:base+top,streetProp:true};
  }
  function blocks(stops){
    const result=[];
    for(const p of stops){
      result.push(boxAt(p,signX,signZ,.16,.16,0,2.96),
        boxAt(p,2.18,-2.04,.55,2.38,0,.92),boxAt(p,2.55,-.70,.085,.085,0,2.51),
        boxAt(p,2.55,-3.42,.085,.085,0,2.51),boxAt(p,2.51,-2.06,.14,1.08,.98,1.91));
      if(styleFor(p)==="marlin")result.push(boxAt(p,1.96,-3.42,1.18,.045,.16,2.35));
    }
    return result;
  }
  function cameraBlocks(stops){
    return stops.map(p=>boxAt(p,1.89,roofCenterZ,1.70,3.22,2.25,styleFor(p)==="cine"?2.70:2.57));
  }
  // Draw the signwriter's strokes on any vertical face. The curbside lettering reads from the road.
  const curbFace=(x,z,reverse=false)=>(u,y)=>[x,y,z+(reverse?u:-u)];
  const endFace=(z,x)=>(u,y)=>[x+u,y,z];
  function plate(g,plane,x,y,w,h,color){
    g.quad(plane(x-w/2,y-h/2),plane(x+w/2,y-h/2),plane(x+w/2,y+h/2),plane(x-w/2,y+h/2),color);
  }
  function polygon(g,plane,points,color){
    for(let i=2;i<points.length;i++)g.tri(plane(...points[0]),plane(...points[i-1]),plane(...points[i]),color);
  }
  function stroke(g,plane,points,width,color){
    for(let i=1;i<points.length;i++){
      const [x,y]=points[i-1],[xx,yy]=points[i],dx=xx-x,dy=yy-y,r=width/(2*(Math.hypot(dx,dy)||1));
      const u=-r*dy,v=r*dx;
      g.quad(plane(x+u-r*dx*.44,y+v-r*dy*.44),plane(xx+u+r*dx*.44,yy+v+r*dy*.44),
        plane(xx-u+r*dx*.44,yy-v+r*dy*.44),plane(x-u-r*dx*.44,y-v-r*dy*.44),color);
    }
  }
  function disk(g,plane,x,y,r,color,n=8){
    for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n;
      g.tri(plane(x,y),plane(x+r*Math.cos(a),y+r*Math.sin(a)),plane(x+r*Math.cos(b),y+r*Math.sin(b)),color);
    }
  }
  const alphabet={
    A:["00 24 40","12 32"],C:["43 34 14 03 01 10 30 41"],D:["00 04 24 43 41 20 00"],E:["44 04 00 40","02 32"],
    I:["04 34","14 10","00 30"],L:["04 00 40"],M:["00 04 22 44 40"],N:["00 04 40 44"],
    O:["14 34 43 41 30 10 01 03 14"],P:["00 04 34 43 32 02"],R:["00 04 34 43 32 02","22 40"],
    U:["04 01 10 30 41 44"],6:["43 34 24 13 02 01 10 30 41 32 22 12 03"],T:["04 44","24 20"],
    S:["43 34 14 03 12 32 41 30 10 01"]
  };
  const strokes={};
  for(const [letter,parts] of Object.entries(alphabet))strokes[letter]=parts.map(p=>p.split(" ").map(s=>[+s[0]/4,+s[1]/4]));
  function label(g,plane,word,cx,y,h,color,wide=.68){
    const pitch=(wide+.23)*h,start=cx-(word.length-1)*pitch/2-h*wide/2;
    for(let i=0;i<word.length;i++)for(const path of strokes[word[i]]||[]){
      stroke(g,plane,path.map(([x,b])=>[start+i*pitch+x*h*wide,y+b*h]),h*.105,color);
    }
  }
  function six(g,p,u,y,h,color){
    // Unbroken lower bowl and a small open hook, as on the old destination blind.
    const line=[[.82,.89],[.68,1],[.47,.99],[.27,.88],[.13,.66],[.05,.40],[.06,.18],[.20,.035],
      [.49,0],[.72,.075],[.84,.26],[.80,.43],[.64,.56],[.39,.57],[.17,.46],[.075,.32]];
    stroke(g,p,line.map(([x,v])=>[u+(x-.45)*h,y+v*h]),h*.132,color);
  }
  function busSymbol(g,p,u,y,s,color,cut){
    plate(g,p,u,y+.17*s,.53*s,.45*s,color);plate(g,p,u,y+.22*s,.42*s,.17*s,cut);
    for(const k of [-1,1]){
      plate(g,p,u+k*.16*s,y-.085*s,.081*s,.080*s,color);disk(g,p,u+k*.17*s,y+.054*s,.032*s,cut,6);
    }
  }
  function poleSign(g,distant){
    g.cyl(signX,1.32,signZ,.034,.044,2.57,distant?5:8,fixture);
    if(!distant){
      g.cyl(signX,.095,signZ,.073,.091,.19,8,steel);
      g.box(signX,.018,signZ,.185,.036,.18,steel);
      for(const z of [-.052,.052])for(const x of [-.058,.058])g.box(signX+x,.042,signZ+z,.018,.014,.020,"#b4ae97");
      g.cyl(signX,.79,signZ,.043,.043,.047,8,"#a57956");
    }
    const outline=[[-.35,2.05],[-.302,2.00],[.302,2.00],[.35,2.05],[.35,2.85],[.289,2.925],[-.28,2.925],[-.35,2.85]];
    const cs=Math.cos(flagYaw),sn=Math.sin(flagYaw);
    // Turn the enamel flag toward the approaching driver. Its timetable still faces the sidewalk reader.
    const flagFace=(x,reverse=false)=>(u,y)=>{
      const z=reverse?u:-u;return [signX+cs*x+sn*z,y,signZ-sn*x+cs*z];
    };
    const left=flagFace(-.045),right=flagFace(.045);
    polygon(g,left,outline,cream);polygon(g,right,outline,cream);
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];g.quad(left(...a),left(...b),right(...b),right(...a),steel);
    }
    for(const reverse of [false,true]){
      const side=reverse?1:-1,p=flagFace(side*.050,reverse),ink=flagFace(side*.055,reverse);
      polygon(g,p,[[-.327,2.30],[.327,2.30],[.327,2.841],[.27,2.897],[-.26,2.897],[-.327,2.837]],enamel);
      six(g,ink,.059,2.342,.509,cream);busSymbol(g,ink,-.222,2.535,.26,cream,enamel);
      plate(g,p,0,2.267,.650,.056,"#c07859");
      if(!distant)label(g,ink,"OCEAN LOOP",0,2.092,.073,enamel,.63);
    }
    if(!distant){
      // The lower case swivels slightly in its two bands. The old paper curls away from the glass at one corner.
      g.box(signX-.052,1.43,signZ,.083,.63,.376,"#8a968b");
      const p=curbFace(signX-.097,signZ),ink=curbFace(signX-.101,signZ);
      plate(g,p,0,1.43,.342,.584,paper);plate(g,ink,0,1.65,.312,.085,enamel);
      label(g,curbFace(signX-.105,signZ),"ROUTE 6",0,1.633,.039,cream);
      for(let i=0;i<6;i++){
        const y=1.547-i*.061;plate(g,ink,-.104,y,.047,.017,i<4?enamel:red);
        for(let k=0;k<3;k++)plate(g,ink,-.035+.063*k,y,.037-(i+k)%3*.003,.009,steel);
        plate(g,ink,.008,y-.021,.276,.004,"#a19b85");
      }
      polygon(g,ink,[[.089,1.149],[.15,1.149],[.15,1.197]],"#b3ac90");
      for(const y of [1.18,1.65])g.cyl(signX,y,signZ,.044,.044,.025,8,"#b0a384");
    }
  }
  function timberBench(g,style,near){
    const c=styles[style];
    for(const z of [-3.02,-1.07]){
      g.box(2.15,.033,z,.42,.066,.143,steel);
      g.pole([2.10,.061,z],[2.23,.378,z],.042,c.frame,5);
      g.pole([1.946,.391,z],[2.398,.391,z],.040,c.frame,5);
      g.pole([2.303,.36,z],[2.455,.92,z],.035,c.frame,5);
    }
    for(let i=0;i<4;i++)g.box(1.96+i*.112,.442,-2.04,.098,.056,2.37,i%2?c.seat:c.wood);
    for(let i=0;i<2;i++)g.box(2.403+.028*i,.723+.139*i,-2.04,.055,.104,2.37,i?c.wood:c.seat);
    if(!near)return;
    const top=(x,z)=>[x,.471,z];
    for(const [x,z,l] of [[2.071,-3.06,.24],[2.18,-2.71,.36],[1.956,-1.85,.20],[2.293,-1.21,.34],[2.071,-1.10,.12]]){
      g.quad(top(x-.013,z),top(x+.015,z+.050),top(x+.007,z+l),top(x-.006,z+l*.82),"#d6b592");
    }
    for(const z of [-3.02,-1.07])for(const x of [1.961,2.185,2.296])g.cyl(x,.474,z,.011,.011,.006,6,"#69695c");
    // A divider only at a seat seam keeps each of the three seat centers usable.
    for(const z of [-2.44,-1.64]){
      g.pole([2.37,.72,z],[2.01,.70,z],.017,c.frame,5);g.pole([2.01,.70,z],[1.971,.474,z],.017,c.frame,5);
    }
  }
  function printedMap(g,style,detail){
    const center=-2.04;
    g.box(2.51,1.458,center,.105,.923,1.08,"#878c7c");
    g.box(2.409,1.932,center,.17,.048,1.10,steel);
    const p=curbFace(2.454,center),ink=curbFace(2.448,center),print=curbFace(2.445,center);
    plate(g,p,0,1.46,.993,.835,paper);
    plate(g,ink,0,1.79,.956,.122,enamel);
    if(!detail)return;
    label(g,print,"OCEAN LOOP",-.033,1.762,.063,cream);
    // A folded, faded route map. Little terminal circles join the old street grid to the bay.
    polygon(g,ink,[[.18,1.15],[.441,1.15],[.441,1.689],[.316,1.689],[.35,1.61],[.239,1.54],[.285,1.46],[.18,1.37],[.235,1.28]],"#98b5af");
    for(let i=0;i<7;i++)plate(g,ink,-.412+i*.091,1.404,.009,.495,"#bdbaa2");
    for(let i=0;i<6;i++)plate(g,ink,-.114,1.18+i*.092,.61,.010,"#bfc1a8");
    const path=[[-.345,1.243],[-.345,1.579],[-.311,1.613],[.172,1.613],[.209,1.575],[.209,1.258],[.17,1.218],[-.32,1.218],[-.345,1.243]];
    stroke(g,print,path,.027,red);
    const marks=curbFace(2.442,center);
    for(const [id,u,y] of [["marlin",.209,1.414],["market",-.166,1.218],["port",-.345,1.398],["cine",-.037,1.613]]){
      disk(g,marks,u,y,id===style?.035:.024,dark);disk(g,curbFace(2.438,center),u,y,id===style?.022:.012,id===style?"#e8a16d":cream);
    }
    polygon(g,marks,[[.035,1.633],[.062,1.613],[.035,1.593]],dark);
    polygon(g,marks,[[-.228,1.238],[-.256,1.218],[-.228,1.198]],dark);
    disk(g,print,-.394,1.119,.019,red);label(g,print,styles[style].name,-.153,1.098,.045,enamel,.64);
    polygon(g,print,[[.355,1.069],[.451,1.069],[.451,1.144]],"#b0ab8c");
    for(const x of [-.50,.50])for(const y of [1.033,1.88])disk(g,print,x,y,.012,steel,6);
    stroke(g,print,[[-.478,1.663],[-.238,1.715]],.006,"#f3e5c5");
    stroke(g,ink,[[.057,1.176],[.053,1.536],[.059,1.687]],.005,"#d4bca3");
  }
  function handbill(g,style){
    // The local postcard clips to the same galvanized rail as the service map.
    const z=-2.947;
    g.box(2.532,1.43,z,.027,.457,.338,"#9f9782");
    const p=curbFace(2.516,z),ink=curbFace(2.512,z),over=curbFace(2.509,z);
    polygon(g,p,[[-.155,1.644],[.159,1.635],[.147,1.214],[-.161,1.231]],paper);
    const color=styles[style].edge;
    plate(g,ink,0,1.461,.246,.241,color);
    if(style==="cine"){
      disk(g,over,0,1.483,.079,cream,12);disk(g,curbFace(2.506,z),.036,1.505,.077,color,12);
      for(let i=0;i<3;i++)for(const x of [-.104,.104])plate(g,over,x,1.385+i*.071,.017,.027,paper);
    }else if(style==="port"){
      polygon(g,over,[[-.095,1.427],[.10,1.427],[.075,1.385],[-.077,1.385]],cream);
      plate(g,over,-.026,1.451,.092,.044,cream);stroke(g,over,[[.021,1.454],[.021,1.54]],.010,cream);
      stroke(g,over,[[-.096,1.365],[-.036,1.372],[.035,1.364],[.092,1.373]],.009,cream);
    }else if(style==="market"){
      for(const [u,y] of [[-.043,1.448],[.042,1.421],[.023,1.499]])disk(g,over,u,y,.046,"#e1b371",9);
      stroke(g,over,[[-.067,1.504],[-.016,1.534],[.018,1.529]],.018,cream);
    }else{
      disk(g,over,.057,1.523,.031,"#e1b777",9);
      stroke(g,over,[[-.057,1.359],[-.041,1.435],[-.013,1.511]],.010,cream);
      for(const [u,y] of [[-.083,1.449],[-.087,1.502],[-.050,1.536],[.01,1.55],[.047,1.475]])
        stroke(g,over,[[-.013,1.511],[u,y]],.015,"#bfceb2");
    }
    plate(g,ink,-.005,1.267,.168,.012,steel);g.box(2.504,1.631,z+.008,.025,.027,.049,"#879083");
  }
  function rearFrame(g,style){
    const f=styles[style].frame;
    for(const z of [-3.42,-.70]){
      g.box(2.55,1.20,z,.075,2.40,.075,f);g.box(2.55,.025,z,.17,.05,.18,steel);
      g.pole([2.55,1.98,z],[1.33,2.418,z],.039,f,5);
    }
    for(const h of [1.14,1.78])g.box(2.55,h,roofCenterZ,.05,.043,2.72,f);
    g.box(2.55,2.397,roofCenterZ,.09,.107,2.91,f);
  }
  function pane(g){
    // Only the edges, two reflection strokes and safety band are painted; riders remain visible through it.
    const z=-3.42;
    for(const y of [.18,2.30])g.box(1.97,y,z,1.18,.030,.031,"#92a99e");
    g.box(1.391,1.24,z,.027,2.12,.030,"#7f9e99");
    const p=endFace(z-.018,1.97);
    stroke(g,p,[[-.52,1.48],[-.37,1.65]],.014,"#acc7bd");
    stroke(g,p,[[-.49,1.44],[-.419,1.52]],.007,cream);
    for(let i=0;i<6;i++)plate(g,p,-.46+i*.168,.934,.073,.025,"#a3beb3");
  }
  function marlinRoof(g,detail){
    const c=styles.marlin,z0=-3.69,z1=-.47,x0=1.04,x1=2.74;
    // The shallow leading slope and folded hem are visible above passing cars.
    const roofAt=(x,z,lift=0)=>[x,2.49+(x1-x)*.036+lift,z];
    g.quad(roofAt(x0,z0),roofAt(x1,z0),roofAt(x1,z1),roofAt(x0,z1),c.stripe);
    g.quad(roofAt(x0,z0,-.04),roofAt(x0,z1,-.04),roofAt(x1,z1,-.04),roofAt(x1,z0,-.04),"#afc2ab");
    for(let i=0;i<9;i++)if(i%2===0){
      const a=z0+(z1-z0)*i/9,b=a+(z1-z0)/9;
      g.quad(roofAt(x0,a,.003),roofAt(x1,a,.003),roofAt(x1,b,.003),roofAt(x0,b,.003),i===6?"#7e9f93":"#80a99b");
    }
    g.box(1.088,2.437,roofCenterZ,.094,.224,3.22,c.edge);
    g.box(1.074,2.331,roofCenterZ,.067,.022,3.22,cream);
    for(const z of [z0+.018,z1-.018])g.pole(roofAt(x0,z,-.015),roofAt(x1,z,-.015),.024,fixture,5);
    if(detail){
      const p=curbFace(1.038,roofCenterZ);label(g,p,c.name,0,2.384,.088,cream,.82);
      for(const u of [-.99,.99])for(const y of [2.41,2.46])plate(g,p,u,y,.50,.010,c.stripe);
    }
  }
  function cineRoof(g,detail){
    const x=1.04,z=roofCenterZ,c=styles.cine;
    const corners=[[x+.103,z-1.61],[2.64,z-1.61],[2.74,z-1.52],[2.74,z+1.52],[2.64,z+1.61],
      [x+.103,z+1.61],[x,z+1.485],[x,z-1.485]];
    const top=(v,h)=>[v[0],h,v[1]];
    for(let i=1;i<corners.length-1;i++)g.tri(top(corners[0],2.58),top(corners[i],2.58),top(corners[i+1],2.58),"#9b9189");
    for(let i=0;i<corners.length;i++){
      const a=corners[i],b=corners[(i+1)%corners.length];
      g.quad(top(a,2.34),top(b,2.34),top(b,2.58),top(a,2.58),c.edge);
      for(const y of [2.364,2.534])g.quad(top(a,y),top(b,y),top(b,y+.025),top(a,y+.025),c.stripe);
    }
    g.box(1.92,2.341,roofCenterZ,1.55,.034,2.975,"#b6a992");
    g.box(2.52,2.625,z,.108,.095,2.56,c.edge);
    if(detail){
      label(g,curbFace(x-.003,z),c.name,0,2.408,.085,cream,.83);
      for(let i=0;i<12;i++)g.cyl(1.155,2.317,z-1.375+.25*i,.024,.021,.027,6,"#e5c893");
    }
  }
  function canvasRoof(g,detail,style){
    const z0=-3.69,z1=-.47,x0=1.04,x1=2.73,n=9,c=styles[style];
    for(let i=0;i<n;i++){
      const a=z0+(z1-z0)*i/n,b=z0+(z1-z0)*(i+1)/n,m=(a+b)/2,color=i%2?c.stripe:c.edge;
      const crown=z=>[x1,2.568,z],edge=(z,h=2.387)=>[x0,h,z];
      g.quad(crown(a),crown(b),edge(b),edge(a),color);
      polygon(g,curbFace(x0,0,true),[[a,2.386],[b,2.386],[b,2.314],[m+.063,2.271],[m-.063,2.271],[a,2.314]],color);
      if(detail)g.pole(crown(a),edge(a),.009,"#c7af8f",4);
    }
    g.pole([x0,2.376,z0+.025],[x0,2.376,z1-.025],.017,steel,5);
    for(const z of [z0+.045,z1-.045])g.pole([2.55,2.41,z+.10],[x0+.09,2.358,z],.024,"#737c6b",5);
    if(detail){
      // Sewn repair and the two brass eyes that take the edge of the gusts.
      const h=x=>2.387+(x-x0)*.181/(x1-x0)+.005;
      g.quad([1.74,h(1.74),-2.41],[1.84,h(1.84),-2.39],[1.79,h(1.79),-2.17],[1.70,h(1.70),-2.18],style==="port"?"#91a7a4":"#b48c6d");
    }
  }
  const makeRoof={marlin:marlinRoof,cine:cineRoof,market:canvasRoof,port:canvasRoof};
  function shell(g,style,near){
    rearFrame(g,style);timberBench(g,style,near);makeRoof[style](g,near,style);
    poleSign(g,false);printedMap(g,style,near);if(style==="marlin")pane(g);
    if(near)handbill(g,style);
  }
  function distant(g,style){
    const c=styles[style];
    poleSign(g,true);
    for(const z of [-3.42,-.70])g.box(2.55,1.22,z,.077,2.44,.077,c.frame);
    g.box(1.90,2.47,roofCenterZ,1.69,.16,3.22,c.edge);
    g.box(1.91,2.548,roofCenterZ,1.65,.022,3.18,c.stripe);
    g.box(2.14,.433,-2.04,.46,.075,2.37,c.seat);g.box(2.41,.79,-2.04,.056,.245,2.37,c.wood);
    for(const z of [-3.0,-1.08])g.box(2.18,.196,z,.065,.37,.092,c.frame);
    g.box(2.51,1.46,-2.04,.097,.90,1.07,paper);
  }
  function readingLamp(g){
    g.box(2.359,1.907,-2.04,.055,.014,.89,"#ffdfa4");
    const p=curbFace(signX-.058,signZ);
    plate(g,p,0,1.70,.335,.012,"#f2c88d");
  }
  function install(model){
    for(const key of Object.keys(styles)){
      model("bus-stop-far-"+key,g=>distant(g,key));
      model("bus-stop-"+key,g=>shell(g,key,false));
      model("bus-stop-near-"+key,g=>shell(g,key,true));
    }
    model("bus-stop-reading-lamp",readingLamp);
  }
  function world(list,see,stops,t,hours){
    const night=hours?.night||0;
    for(const stop of stops){
      if(!see(stop,127))continue;
      const key=styleFor(stop),near=see(stop,30),far=!near&&!see(stop,64);
      list.push([(near?"bus-stop-near-":far?"bus-stop-far-":"bus-stop-")+key,stop.x,ground(stop),stop.z,stop.yaw||0,0,0,.12*night]);
      if(!far&&night>.06)list.push(["bus-stop-reading-lamp",stop.x,ground(stop),stop.z,stop.yaw||0,0,0,.88*night]);
    }
  }
  function rect(c,x,z,w,d,color){
    c.fillStyle=color;c.fillRect(x-w/2,z-d/2,w,d);
  }
  function footprint(c,stop,s,near){
    const key=styleFor(stop),style=styles[key];
    rect(c,2.17,-2.04,.44,2.37,style.wood);
    if(s>3)for(const x of [2.015,2.13,2.245])rect(c,x,-2.04,.018,2.37,style.frame);
    rect(c,2.42,-2.04,.08,2.38,style.seat);
    c.save();c.globalAlpha*=near?.55:.87;
    rect(c,1.89,roofCenterZ,1.70,3.22,style.edge);
    if(key==="cine"){
      rect(c,1.92,roofCenterZ,1.51,3.06,"#a3988b");rect(c,1.123,roofCenterZ,.068,3.05,style.stripe);
    }else{
      for(let k=0;k<9;k+=2)rect(c,1.89,-3.69+(k+.5)*3.22/9,1.67,3.22/9-.008,style.stripe);
    }
    c.restore();
    rect(c,1.067,roofCenterZ,.065,3.22,style.edge);rect(c,2.52,-2.04,.12,1.05,paper);
    for(const z of [-3.42,-.70])rect(c,2.55,z,.10,.10,steel);
    c.fillStyle="#646f64";c.beginPath();c.ellipse(signX-.17,signZ-.13,.26,.12,-.52,0,tau);c.fill();
    c.save();c.translate(signX,signZ);c.rotate(-flagYaw);rect(c,0,0,.087,.67,steel);c.fillStyle=enamel;
    c.beginPath();c.moveTo(-.32,-.31);c.lineTo(.13,-.37);c.lineTo(.22,.30);c.lineTo(-.23,.35);c.closePath();c.fill();
    if(s>4)rect(c,-.05,.172,.31,.052,cream);c.restore();
  }
  function mapPin(c,x,y,ui){
    c.save();c.translate(x,y);c.scale(ui,ui);
    c.fillStyle=dark;c.fillRect(-4.68,-5.05,9.36,10.10);
    c.fillStyle=cream;c.fillRect(-3.95,-4.40,7.90,8.77);
    c.fillStyle=enamel;c.fillRect(-3.34,-3.77,6.68,6.88);
    c.fillStyle=cream;c.fillRect(-2.04,-2.39,4.08,3.58);
    c.fillStyle=enamel;c.fillRect(-1.54,-1.87,3.08,1.39);
    c.fillStyle=cream;c.fillRect(-1.78,1.00,.72,.92);c.fillRect(1.05,1.00,.72,.92);
    c.fillStyle=red;c.fillRect(-3.34,3.17,6.68,.72);c.restore();
  }
  function map(c,opt,px,py,s,visible,stops,t){
    const street=opt.mode==="street",radar=opt.mode==="radar";
    const size=c.canvas?Math.min(c.canvas.width,c.canvas.height):220;
    const ui=radar?Math.min(1.4,Math.max(.63,size/165)):Math.max(.8,Math.min(1.65,size/370));
    for(const stop of stops){
      const x=px(stop.x),y=py(stop.z);if(!visible(x,y,street?5*s+3:8*ui))continue;
      if(street){
        const near=opt.player&&Math.hypot(opt.player.x-stop.x,opt.player.z-stop.z)<8;
        c.save();c.translate(x,y);c.rotate(stop.yaw||0);c.scale(s,-s);footprint(c,stop,s,near);c.restore();
      }else{
        mapPin(c,x,y,ui*(radar?.84:1));
      }
    }
  }
  window.BayBusStopArt={install,world,map,seats,blocks,cameraBlocks};
})();
