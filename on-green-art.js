/* Hand-painted club cars and the portable split clock. All offsets are in chassis metres. */
(() => {
  "use strict";
  const tau=Math.PI*2, ink="#343e3c", alloy="#9b9e90", chalk="#e7dec2", olive="#526456";
  const teams={
    ocean:{kind:"hatch",number:"13",sign:"#f18463",paper:"#ffe6a5",dark:"#375552",shirt:"#edb27a",skin:"#b57d58",hair:"#503c32"},
    luna:{kind:"coupe",number:"24",sign:"#dcb36a",paper:"#eedbb5",dark:"#653d42",shirt:"#a4b8ac",skin:"#c28c6b",hair:"#4c3531"},
    port:{kind:"stepside",number:"38",sign:"#47675f",paper:"#f1d598",dark:"#394d47",shirt:"#547a80",skin:"#94694b",hair:"#423d36"}
  };
  const shapes=new Map();
  const mix=(a,b,t)=>a+(b-a)*t;
  const unit=t=>Math.max(0,Math.min(1,Number(t)||0));
  function rect(x,y,w,h){return [[x,y],[x+w,y],[x+w,y+h],[x,y+h]];}
  function disc(x,y,rx,ry,n){
    return Array.from({length:n},(_,i)=>[x+rx*Math.cos(i*tau/n),y+ry*Math.sin(i*tau/n)]);
  }
  function stroke(a,b,width){
    const dx=b[0]-a[0],dy=b[1]-a[1],k=width*.5/(Math.hypot(dx,dy)||1);
    const ex=dx*k*.32,ey=dy*k*.32,nx=dy*k,ny=-dx*k;
    return [[a[0]-ex-nx,a[1]-ey-ny],[a[0]-ex+nx,a[1]-ey+ny],[b[0]+ex+nx,b[1]+ey+ny],[b[0]+ex-nx,b[1]+ey-ny]];
  }
  // These are the sign painter's strokes, with a lifted brush between paths.
  const alphabet={
    0:["13 03 00 10 21 23 13"],1:["02 13 10","00 20"],2:["03 13 23 22 00 20"],
    3:["03 23 22 11","11 21 20 00"],4:["23 02 01 21","22 20"],5:["23 03 02 12 21 20 00"],
    6:["23 03 00 20 21 12 02"],8:["12 03 23 22 11 00 20 21 12"],
    S:["23 03 02 21 20 00"],E:["23 03 00 20","02 12"],C:["23 03 00 20"]
  };
  function lettering(text,center,y,size,italic,draw){
    const start=center-(text.length*3-1)*size/2;
    for(const [i,char] of Array.from(text).entries())for(const path of alphabet[char]){
      const points=path.split(" ").map(pair=>{
        const h=Number(pair[1]);return [start+(3*i+Number(pair[0])+italic*h)*size,y+h*size];
      });
      for(let j=1;j<points.length;j++)draw(stroke(points[j-1],points[j],size*.36));
    }
  }
  function section(s,z){
    const k=s.sections.findIndex(row=>row[0]>=z);
    const b=s.sections[Math.max(1,k)],a=s.sections[Math.max(0,k-1)];
    const f=(z-a[0])/(b[0]-a[0]);
    return {w:mix(a[1],b[1],f),y:mix(a[2],b[2],f)};
  }
  function polyg(g,points,color){for(let j=1;j<points.length-1;j++)g.tri(points[0],points[j],points[j+1],color);}
  function paint(c,points,color){
    c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);
    for(let j=1;j<points.length;j++)c.lineTo(...points[j]);c.closePath();c.fill();
  }
  function roofPaint(id,s){
    if(shapes.has(id))return shapes.get(id);
    const team=teams[id],out=[],roofZ=(s.glass[1]+s.glass[2])/2;
    const add=(points,col,depth=0)=>out.push({points:points.map(([x,z])=>[x,z+roofZ]),col,depth});
    if(id==="ocean"){
      add(disc(-.075,-.015,.322,.304,16),team.sign);
      for(const [x,y] of [[-.49,.23],[-.26,.40],[.05,.42],[.31,.29],[.38,.04]]){
        const folded=[-.075+(x+.075)*.72,-.015+(y+.015)*.72];
        add(stroke(folded,[x,y],.032),team.paper);
      }
      lettering(team.number,-.078,-.13,.083,.13,p=>add(p,team.dark,.005));
    }else if(id==="luna"){
      // The clipped ends and perforated stub are lifted from the old Luna admission.
      add([[-.51,-.13],[-.46,-.20],[.43,-.20],[.50,-.13],[.50,.13],[.43,.20],[-.44,.20],[-.51,.13]],team.sign);
      for(let j=0;j<5;j++)add(rect(.283,-.165+j*.070,.014,.037),team.dark,.005);
      for(let j=0;j<3;j++)add(rect(.334,-.117+j*.084,.056,.036),team.paper,.005);
      lettering(team.number,-.094,-.133,.083,.08,p=>add(p,team.dark,.005));
    }else{
      add([[-.50,-.18],[.30,-.18],[.49,-.05],[.31,.18],[-.50,.18]],team.dark);
      for(let j=0;j<3;j++){
        const x=-.43+j*.089;
        add([[x,-.12],[x+.043,-.12],[x+.152,.12],[x+.109,.12]],team.paper,.005);
      }
      lettering(team.number,.113,-.11,.073,.03,p=>add(p,team.paper,.005));
    }
    shapes.set(id,out);return out;
  }
  function doors(g,id,s){
    const team=teams[id],truck=id==="port",midZ=(s.back+s.hingeZ)/2,cy=s.glass[4]-(truck?.272:.227);
    for(const side of [-1,1]){
      const draw=(points,color,d=0)=>polyg(g,points.map(([a,b])=>{
        const z=midZ-side*a,y=cy+b,{w,y:deck}=section(s,z);
        const r=truck?w-.065*(1-unit((y-.348)/(deck-.426))):w-.08+.08*unit((y-.34)/(deck-.46));
        return [side*(r+.019+d),y,z];
      }),color);
      if(id==="ocean"){
        draw([[-.43,-.113],[.365,-.113],[.504,.095],[-.324,.138]],team.sign);
        draw([[-.54,-.084],[-.466,-.087],[-.35,.137],[-.405,.145]],team.paper);
      }else if(id==="luna"){
        draw([[-.45,-.116],[.35,-.116],[.42,-.069],[.42,.070],[.35,.124],[-.45,.124]],team.sign);
        for(let k=0;k<3;k++)draw(rect(.23,-.078+k*.061,.035,.027),team.dark,.004);
      }else{
        draw([[-.46,-.147],[.36,-.147],[.48,-.022],[.35,.144],[-.46,.144]],team.dark);
        for(let j=0;j<2;j++)draw([[-.41+j*.087,-.10],[-.36+j*.087,-.10],[-.27+j*.087,.10],[-.32+j*.087,.10]],team.paper,.004);
      }
      lettering(team.number,truck?.087:-.04,-.081,.053,.10,p=>draw(p,truck?team.paper:team.dark,.006));
    }
  }
  function hoodBands(s,id){
    const front=s.glass[3]+.055,end=s.sections.at(-1)[0]-.100,team=teams[id];
    const cols=id==="ocean"?[[-.51,.10,team.sign],[-.36,.025,team.paper]]:id==="luna"?[[.32,.035,team.sign],[.405,.035,team.sign]]:[[-.52,.107,team.dark]];
    const out=[];
    for(const [x,w,color] of cols){
      const breaks=[front,...s.sections.map(row=>row[0]).filter(z=>z>front&&z<end),end];
      for(let j=1;j<breaks.length;j++)out.push([rect(x,breaks[j-1],w,breaks[j]-breaks[j-1]),color]);
    }
    return out;
  }
  function fixedCar(g,id,s){
    const team=teams[id],truck=id==="port";
    for(const {points,col,depth} of roofPaint(id,s)){
      polyg(g,points.map(([x,z])=>{
        let y=s.glass[5];
        if(truck)y+=mix(.059,.064,unit((z-(s.glass[1]+.095))/(s.glass[2]-.073-s.glass[1]-.095)));
        return [x,y+.006+depth,z];
      }),col);
    }
    for(const [points,col] of hoodBands(s,id))polyg(g,points.map(([x,z])=>[x,(truck?BayBoulevardCars.hoodHeight("stepside",x,z):section(s,z).y)+.008,z]),col);
    doors(g,id,s);
    const x=-s.seatX,z=s.seatZ,y=s.seatY,head=y+.676;
    const shoulder=[x-.137,y+.431,z-.015],elbow=elbowAt(s);
    g.box(x,y+.269,z-.041,.309,.375,.178,team.shirt);
    g.pole([x-.127,y+.44,z+.059],[x+.141,y+.100,z+.061],.022,"#494e47",4);
    g.cyl(x,head,z,.093,.088,.195,8,team.skin);
    g.cyl(x,head+.086,z-.011,.091,.103,.069,8,team.hair);
    if(id==="ocean")g.cyl(x,head+.115,z-.062,.047,.052,.086,7,team.hair);
    if(truck){g.cyl(x,head+.122,z,.105,.111,.047,8,team.sign);g.box(x,head+.103,z+.086,.184,.017,.128,team.dark);}
    if(id==="luna")g.box(x,head+.015,z+.088,.167,.033,.016,team.dark);
    g.pole([x+.107,y+.432,z-.014],[x+.197,y+.30,z+.09],.057,team.shirt,5);
    g.pole([x+.197,y+.30,z+.09],[x+.128,y+.383,z+.31],.039,team.skin,5);
    const cuff=shoulder.map((v,i)=>mix(v,elbow[i],.55));
    g.pole(shoulder,cuff,.065,team.shirt,6);g.pole(cuff,elbow,.044,team.skin,6);
  }
  function elbowAt(s){return [-s.glass[6]-.053,s.glass[4]+.163,s.seatZ+.032];}
  function forearm(g,team){
    g.pole([0,0,0],[-.061,.018,.192],.041,team.skin,6);
    g.pole([-.061,.018,.192],[-.064,.042,.238],.034,team.skin,6);
    g.pole([-.061,.009,.165],[-.064,.014,.185],.044,team.dark,6);
  }
  function raised(amount){return -.08-.99*unit(amount);}
  function car(list,model,v,ground,gesture=0){
    const id=v.greenId,team=teams[id];if(!team)return;
    const s=bayCarLayout(v.kind),body="on-green/car/"+id,arm="on-green/arm/"+id;
    model(body,g=>fixedCar(g,id,s));model(arm,g=>forearm(g,team));
    const pitch=v.pitch||0,lean=v.lean||0,yaw=v.yaw||0;
    list.push([body,v.x,ground,v.z,yaw,pitch,lean]);
    const [x,y,z]=elbowAt(s),py=y*Math.cos(pitch)-z*Math.sin(pitch),pz=y*Math.sin(pitch)+z*Math.cos(pitch);
    const px=x*Math.cos(lean)-py*Math.sin(lean),p=BayDriving.world(v,px,pz);
    list.push([arm,p.x,ground+x*Math.sin(lean)+py*Math.cos(lean),p.z,yaw,pitch+raised(gesture),lean]);
  }
  function mapAt(c,px,py,s,p){
    c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw||0);c.scale(s,-s);
  }
  const strips=new Map();
  function carMap(c,px,py,scale,v,gesture=0){
    const id=v.greenId,team=teams[id];if(!team)return;
    const s=bayCarLayout(v.kind);
    mapAt(c,px,py,scale,v);
    if(!strips.has(id))strips.set(id,hoodBands(s,id));
    for(const [points,col] of strips.get(id))paint(c,points,col);
    for(const {points,col} of roofPaint(id,s))paint(c,points,col);
    const [x,,z]=elbowAt(s),reach=Math.cos(raised(gesture))*.24;
    paint(c,stroke([x+.055,z-.07],[x,z],.10),team.shirt);
    paint(c,stroke([x,z],[x-.064,z+reach],.077),team.skin);
    c.restore();
  }

  const centerY=1.72,rim=.43,lightY=2.23,handZ=-.155;
  const ticks=Array.from({length:60},(_,i)=>{
    const a=i*tau/60,rx=Math.sin(a),ry=Math.cos(a),major=i%5===0;
    return stroke([rx*(major?.281:.323),ry*(major?.281:.323)],[rx*.35,ry*.35],major?.015:.0075);
  });
  const paintBlocks=[];
  // Two courses of worn white chequers run from the edge of the right lane to its centreline.
  for(let i=0;i<14;i++)for(let j=0;j<2;j++)if((i+j)%2===0){
    const x=-7.63+i*.482,z=(j-1)*.216,chip=(i%4)*.018;
    paintBlocks.push([[x+.023,z],[x+.438,z],[x+.459,z+.152],[x+.421-chip,z+.203],[x+.019,z+.19]]);
  }
  function finishClock(g,id){
    const team=teams[id];
    for(const p of paintBlocks)polyg(g,p.map(([x,z])=>[x,.036,z]),"#d9d3bb");
    for(const [x,z] of [[-.28,-.22],[.35,-.16],[-.025,.38]]){
      g.pole([x,.059,z],[0,1.07,0],.029,alloy,5);g.box(x,.039,z,.112,.061,.088,ink);
    }
    g.cyl(0,1.12,0,.032,.044,.65,7,alloy);g.box(0,.72,0,.24,.087,.145,team.dark);
    const at=(p,z)=>[p[0],centerY+p[1],z];
    const outer=disc(0,0,rim,rim,30);
    for(let j=0;j<outer.length;j++){
      const a=outer[j],b=outer[(j+1)%outer.length];
      g.quad(at(a,.099),at(b,.099),at(b,-.106),at(a,-.106),j%3===0?team.dark:olive);
    }
    polyg(g,outer.map(p=>at(p,.101)),team.dark);
    polyg(g,outer.map(p=>at(p,-.111)),alloy);
    polyg(g,disc(0,0,.399,.399,30).map(p=>at(p,-.116)),ink);
    polyg(g,disc(0,0,.375,.375,30).map(p=>at(p,-.120)),chalk);
    for(const p of ticks)polyg(g,p.map(q=>at(q,-.124)),ink);
    for(const [label,x,y] of [["60",0,.202],["15",.212,-.031],["30",0,-.265],["45",-.211,-.031],["SEC",0,.094]]){
      lettering(label,x,y,label==="SEC"?.010:.015,0,p=>polyg(g,p.map(q=>at(q,-.125)),ink));
    }
    for(const side of [-1,1]){
      g.box(side*.286,.872,.136,.068,.568,.078,team.dark);
      g.box(side*.286,.61,.134,.079,.043,.083,alloy);
    }
    g.box(0,.894,.126,.577,.267,.065,team.sign);
    const face=(p,depth)=>[p[0],.895+p[1],.083-depth];
    lettering(team.number,0,-.077,.047,.09,p=>polyg(g,p.map(q=>face(q,.006)),team.dark));
    for(const side of [-1,1])for(let i=0;i<2;i++)for(let j=0;j<3;j++)if((i+j)%2===0){
      polyg(g,rect(side*.190-.030+i*.031,-.052+j*.034,.031,.033).map(p=>face(p,.005)),team.dark);
    }
    g.box(0,lightY-.025,.014,.25,.177,.16,ink);
    g.box(0,lightY+.072,-.047,.27,.027,.27,team.dark);
    polyg(g,disc(0,lightY-.026,.077,.077,12).map(([x,y])=>[x,y,-.074]),"#416d5c");
    g.box(0,centerY,.133,.197,.225,.077,ink);
    g.cyl(.222,centerY+.405,0,.042,.039,.051,8,alloy);
  }
  function needle(g){
    polyg(g,[[-.013,-.066,0],[.013,-.066,0],[.014,.172,0],[.003,.31,0],[-.010,.176,0]],"#b94e38");
    polyg(g,disc(0,0,.033,.033,10).map(([x,y])=>[x,y,-.003]),ink);
  }
  function lamp(g){
    polyg(g,disc(0,0,.074,.074,12).map(([x,y])=>[x,y,0]),"#82f6a6");
    polyg(g,disc(-.013,.020,.046,.033,10).map(([x,y])=>[x,y,-.003]),"#d6ffba");
  }
  function secondsAngle(seconds){return Number.isFinite(seconds)?Math.max(0,seconds)*tau/60:0;}
  function finish(list,model,at,id,flash=0,seconds=0){
    if(!teams[id])return;
    const key="on-green/clock/"+id;
    model(key,g=>finishClock(g,id));model("on-green/sweep",needle);
    const y=at.y||0,yaw=at.yaw||0,hand=BayDriving.world(at,0,handZ);
    list.push([key,at.x,y,at.z,yaw],["on-green/sweep",hand.x,y+centerY,hand.z,yaw,0,-secondsAngle(seconds)]);
    if(flash>0){
      model("on-green/bulb",lamp);
      const p=BayDriving.world(at,0,-.082);list.push(["on-green/bulb",p.x,y+lightY-.026,p.z,yaw,0,0,.5+.5*unit(flash)]);
    }
  }
  function finishMap(c,px,py,s,at,id,flash=0,seconds=0){
    const team=teams[id];if(!team)return;
    mapAt(c,px,py,s,at);
    for(const p of paintBlocks)paint(c,p,"#d9d3bb");
    // Draw the clock as a foreshortened face with the same sweep for overhead play.
    for(const [x,z] of [[-.28,-.22],[.35,-.16],[-.025,.38]])paint(c,stroke([0,0],[x,z],.045),alloy);
    paint(c,disc(0,0,.43,.22,18),team.dark);paint(c,disc(0,-.041,.368,.142,18),chalk);
    const a=secondsAngle(seconds);
    paint(c,stroke([0,-.041],[Math.sin(a)*.273,-.041+Math.cos(a)*.111],.024),"#b94e38");
    paint(c,rect(-.123,.142,.246,.101),ink);
    paint(c,rect(-.077,.144,.154,.058),flash>0?"#9affba":"#48735b");
    c.restore();
  }
  // The timing camera stays bolted to one spot. Fit the whole roll once so panning
  // and changing magnification never alter the apparent finish margin while scrubbing.
  function cameraBounds(shots,playerLength,rivalLength){
    let back=-4,front=3.15,left=-.80,right=8.72;
    for(const q of shots){
      back=Math.min(back,q[1]-playerLength-1,q[4]-rivalLength-1);
      front=Math.max(front,q[1]+playerLength+1,q[4]+rivalLength+1);
      left=Math.min(left,q[2]-1.80,q[5]-1.80);right=Math.max(right,q[2]+1.80,q[5]+1.80);
    }
    return {back,front,left,right};
  }
  function filmFrame(shots,fraction){
    const a=shots[0],b=shots[shots.length-1];
    const ms=mix(a[0],b[0],unit(fraction)),end=shots.findIndex(q=>q[0]>=ms);
    if(end<=0)return end<0?b:a;
    const lo=shots[end-1],hi=shots[end],f=unit((ms-lo[0])/(hi[0]-lo[0]||1));
    return lo.map((v,i)=>{
      if(i===3||i===6){const angle=hi[i]-v;return v+Math.atan2(Math.sin(angle),Math.cos(angle))*f;}
      return mix(v,hi[i],f);
    });
  }
  const playerChip="#f9cb82",rivalChip="#a7e3dc",filmInk="#203436";
  function chip(c,x,y,size,player){
    const points=player?[[x-size,y-size],[x+size,y],[x-size,y+size]]:[[x,y-size],[x+size,y],[x,y+size],[x-size,y]];
    paint(c,points,player?playerChip:rivalChip);
  }
  function cameraRoad(c,w,top,bottom,px,py,s,id){
    const gull=id==="ocean",yard=id==="port";
    const curb=py(7.1);
    c.fillStyle=yard?"#666a63":gull?"#68716f":"#656c70";c.fillRect(0,top,w,bottom-top);
    c.fillStyle=yard?"#ada993":gull?"#cdbb9e":"#bbaea0";c.fillRect(0,curb,w,Math.max(0,bottom-curb));
    c.fillStyle="#e1d3af";c.fillRect(0,curb,w,Math.max(1,s*.12));
    for(let m=-50;m<8;m+=3.5){
      const x=px(m);if(x<0||x>w)continue;
      paint(c,[[x,curb+2],[x+1.2,curb+2],[x+s*.48+1,bottom],[x+s*.48,bottom]],"#9b9586");
    }
    c.fillStyle="#a49e72";c.fillRect(0,py(-.15),w,Math.max(1,s*.07));c.fillRect(0,py(.10),w,Math.max(1,s*.07));
    // Patches left by the island's salt air survive under the raised timing paint.
    for(const [m,l,width] of [[-4,.65,1.2],[-18,5.82,1.71],[-25,3.35,.83],[.90,6.23,1.05]]){
      paint(c,[[px(m),py(l)],[px(m+width*.87),py(l+.04)],[px(m+width),py(l+.12)],[px(m+.21),py(l+.16)]],"#727875");
    }
    // Shadows from the palms, theater awning or dock lattice identify each exposure.
    c.save();c.globalAlpha=.19;
    const shadow=points=>paint(c,points.map(([u,v])=>[px(u),py(v)]),"#34494a");
    if(gull){
      for(const trunk of [-22,-6]){
        const crown=[trunk-2.5,5.88];shadow(stroke([trunk,8.75],crown,.12));
        for(const [dx,dy] of [[-1.68,-.21],[-1.22,-1.13],[-.28,-1.57],[.82,-1.38],[1.39,-.50],[-1.35,.45]]){
          const [x,y]=crown;
          shadow([[x,y],[x+dx*.49-dy*.11,y+dy*.42+dx*.11],[x+dx,y+dy],[x+dx*.58,y+dy*.52]]);
        }
      }
    }else if(yard){
      shadow(stroke([-31,5.54],[0,6.52],.10));
      for(let m=-30;m<0;m+=5){const a=5.54+(m+31)*.032;shadow(stroke([m,a],[m+2.5,8.13],.10));shadow(stroke([m+2.5,8.13],[m+5,a+.16],.10));}
    }else{
      shadow([[-29,8.6],[-28,5.95],[-16,5.95],[-16.8,8.6]]);
      for(const x of [-27.4,-24.3,-21.4,-18.4])shadow(stroke([x,5.95],[x-.42,5.64],.15));
    }
    c.restore();
    for(const p of paintBlocks)paint(c,p.map(([x,z])=>[px(z),py(7.90+x)]),"#e4ddc8");
    c.fillStyle="#f4efda";c.fillRect(px(0)-.7,py(.21),1.4,py(7.16)-py(.21));
    const cx=px(0),cy=py(7.91);
    paint(c,[[cx-s*.33,cy-s*.26],[cx+s*.41,cy-s*.16],[cx+s*.06,cy+s*.38]],"#58594e");
    c.fillStyle=teams[id].sign;c.fillRect(cx-s*.35,cy-s*.16,s*.70,Math.max(2,s*.26));
  }
  function film(canvas,route,record,fraction=1){
    const ctx=canvas?.getContext("2d"),frames=record?.shots,team=teams[route?.id];
    if(!ctx||!team||!frames?.length||!canvas.width||!canvas.height)return false;
    const w=canvas.width,h=canvas.height;
    // Layout works in backing pixels. At small CSS widths these larger captions
    // remain legible without covering either car or the timing stripe.
    const top=h*.17,bottom=h*.835,ui=Math.min(w/480,h/164);
    const playerLength=bayCarLayout(record.kind).halfLength,rivalLength=bayCarLayout(route.kind).halfLength;
    const bounds=cameraBounds(frames,playerLength,rivalLength);
    const s=Math.min((w-16*ui)/(bounds.front-bounds.back),(bottom-top-4)/(bounds.right-bounds.left));
    const spare=w-16*ui-s*(bounds.front-bounds.back);
    const stripeX=8*ui+spare*.48-s*bounds.back;
    const px=f=>stripeX+f*s,py=l=>(top+bottom)/2+(l-(bounds.left+bounds.right)/2)*s;
    const q=filmFrame(frames,fraction);
    ctx.save();ctx.fillStyle=filmInk;ctx.fillRect(0,0,w,h);
    ctx.save();ctx.beginPath();ctx.rect(0,top,w,bottom-top);ctx.clip();
    cameraRoad(ctx,w,top,bottom,px,py,s,route.id);
    for(const player of [true,false]){
      const i=player?1:4,data=player?record:route,angle=q[i+2],yaw=Math.PI/2+angle;
      const v={kind:data.kind,color:data.color,plate:data.plate,yaw,greenId:player?undefined:route.id};
      const x=px(q[i]),y=py(q[i+1]);
      window.drawBayTimingCar(ctx,v,x,y,s);
      if(!player)carMap(ctx,()=>x,()=>y,s,v);
    }
    // These small register marks identify the *measured* front centres. Keeping
    // them separate from sprite edges also works for long trucks and a turned car.
    for(const player of [true,false]){
      const i=player?1:4,len=player?playerLength:rivalLength;
      const x=px(q[i]+len*Math.cos(q[i+2])),y=py(q[i+1]+len*Math.sin(q[i+2]));
      const side=q[2]<=q[5]?(player?-1:1):(player?1:-1);
      const tagY=y+side*(s*.95+3*ui),c=player?playerChip:rivalChip;
      ctx.fillStyle=filmInk;ctx.fillRect(x-1.2*ui,Math.min(y,tagY),2.4*ui,Math.abs(y-tagY));
      ctx.fillStyle=c;ctx.fillRect(x-.5*ui,Math.min(y,tagY),ui,Math.abs(y-tagY));
      chip(ctx,x,tagY,2.9*ui,player);
    }
    ctx.restore();
    const margin=12*ui;
    ctx.textBaseline="middle";ctx.textAlign="left";ctx.fillStyle="#f5edda";ctx.font="bold "+16*ui+"px system-ui";
    ctx.fillText(route.street,margin,top*.51,w*.58);
    ctx.textAlign="right";ctx.font="bold "+17*ui+"px monospace";ctx.fillStyle="#f8cd88";
    ctx.fillText((q[0]/1000).toFixed(3)+" s",w-margin,top*.51);
    const labels=[["You",record.plate,true],[route.driver,route.plate,false]];
    ctx.textAlign="left";ctx.font="600 "+14.2*ui+"px system-ui";ctx.fillStyle="#e9ebd8";
    for(const [idx,[name,plate,player]] of labels.entries()){
      const x=idx*w/2+margin,y=(bottom+h)/2;
      chip(ctx,x+4*ui,y,4.2*ui,player);
      ctx.fillStyle="#e9ebd8";ctx.fillText(name+(plate?"  /  "+plate:""),x+16*ui,y,w/2-2*margin-14*ui);
    }
    ctx.restore();return true;
  }
  window.BayOnGreenArt=Object.freeze({car,carMap,finish,finishMap,film});
})();
