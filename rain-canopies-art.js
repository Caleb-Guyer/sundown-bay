/* Folding umbrellas. The seams, tips and block prints in the street and plan views share a cut. */
(() => {
  "use strict";
  const tau=Math.PI*2,segments=8,frames=14,grip={x:.24,y:1.26,z:.19};
  const metal="#53676a",nickel="#b7bcb0",brass="#ceaa69",wood="#915f42",darkWood="#654b3b";
  const palettes=[
    {cloth:["#4c8f85","#9bbca4"],selvage:"#e6d6ac",band:"#396e6a",print:"#f0d4a1",design:"fish"},
    {cloth:["#c06d4f","#d18e68"],selvage:"#ead5a5",band:"#8f5846",print:"#f0dba4",design:"guava"},
    {cloth:["#556885","#78889c"],selvage:"#e6bd81",band:"#43536c",print:"#e7bc81",design:"tide"},
    {cloth:["#93647c","#c08d95"],selvage:"#f4dbb7",band:"#6e5067",print:"#f5d4a4",design:"star"}
  ];
  const kits={
    room:{frame:"#5d8882",plate:"#497c76",trim:"#e5c29b",ends:"#c3896b",label:"14"},
    marlin:{frame:"#6c9181",plate:"#507d76",trim:"#e9d5ac",ends:"#ab7958",label:"6"},
    mercado:{frame:"#a07254",plate:"#9b5b46",trim:"#e8c485",ends:"#c4a272",label:"6"},
    port:{frame:"#647a81",plate:"#526a77",trim:"#d5be95",ends:"#879a97",label:"6"},
    luna:{frame:"#82666d",plate:"#755568",trim:"#e8c98c",ends:"#af847d",label:"6"}
  };
  const swatch=i=>Number.isFinite(i)?((Math.trunc(i)%palettes.length)+palettes.length)%palettes.length:0;
  function rackKit(r){
    const id=String(r.id||"").toLowerCase();
    if(id.includes("room")||id.includes("14")||id==="motel")return "room";
    if(id.includes("cine")||id.includes("luna"))return "luna";
    if(id.includes("port")||id.includes("harbor"))return "port";
    if(id.includes("merc")||id.includes("market"))return "mercado";
    return "marlin";
  }
  const clamp=x=>Math.max(0,Math.min(1,x)),ease=x=>{x=clamp(x);return x*x*(3-2*x);};
  const between=(a,b,t)=>a+(b-a)*t;
  const material=new Map();
  function shaded(hex,light){
    const key=hex+light;
    if(!material.has(key)){
      const n=parseInt(hex.slice(1),16);
      material.set(key,"#"+[n>>16,n>>8&255,n&255].map(v=>Math.min(255,Math.round(v*light)).toString(16).padStart(2,"0")).join(""));
    }
    return material.get(key);
  }

  // Ink is printed on an individual gore before it is sewn. Coordinates run seam-to-seam and cap-to-hem.
  const prints={
    fish:[
      [[.12,.68],[.23,.622],[.58,.623],[.78,.664],[.57,.696],[.32,.709]],
      [[.58,.625],[.49,.574],[.40,.628]],
      [[.71,.656],[.89,.598],[.85,.662],[.92,.716],[.70,.68]]
    ],
    guava:[
      [[.20,.624],[.30,.603],[.43,.612],[.50,.659],[.44,.704],[.31,.721],[.19,.692],[.16,.656]],
      [[.46,.647],[.55,.626],[.69,.640],[.75,.683],[.69,.723],[.55,.729],[.47,.701]],
      [[.34,.613],[.43,.555],[.63,.533],[.56,.580]],
      [[.58,.636],[.66,.596],[.82,.592],[.75,.616]]
    ],
    tide:[
      [[.12,.654],[.38,.597],[.56,.615],[.64,.649],[.49,.630],[.34,.653],[.12,.677]],
      [[.37,.702],[.62,.649],[.78,.658],[.88,.689],[.73,.674],[.57,.697],[.37,.718]]
    ],
    star:[
      [[.48,.553],[.54,.640],[.78,.668],[.52,.687],[.44,.769],[.43,.685],[.20,.660],[.44,.640]],
      [[.78,.559],[.81,.588],[.91,.600],[.81,.605],[.76,.637],[.76,.607],[.67,.596],[.76,.589]]
    ]
  };
  // Cap and sliding runner rise before the bent ribs spring flat. The hem retreats between adjacent rib tips.
  function cut(amount){
    const lift=ease(amount/.51),open=ease((amount-.12)/.88);
    const radius=between(.045,.94,open),crown=.62+.33*lift,drop=between(.48,.31,open);
    return {open,radius,crown,drop,runner:between(.13,.69,open),surface(i,u,f,over=0){
      const angle=(i+u)*tau/segments+.12,lobe=1-Math.abs(2*u-1);
      const sag=Math.sin(f*Math.PI)*(.012+.013*open)*lobe;
      const r=radius*f*(1-.084*lobe)-(.009*(1-open))*lobe*f;
      const y=crown-drop*(.32*f+.68*f*f)-sag+.046*open*lobe*f*f*f+over;
      return [Math.cos(angle)*r,y,Math.sin(angle)*r];
    }};
  }
  const cuts=Array.from({length:frames+1},(_,n)=>cut(n/frames));
  function bent(g,pts,r,ink,sides=4){for(let k=1;k<pts.length;k++)g.pole(pts[k-1],pts[k],r,ink,sides);}
  function hook(g,x,y,z,size,reverse=false){
    const s=size,dir=reverse?-1:1;
    const curve=[[0,.095],[0,-.068],[.008,-.10],[.030,-.12],[.060,-.122],[.084,-.106],[.092,-.076],[.090,-.058]];
    bent(g,curve.map(([u,v])=>[x+dir*u*s,y+v*s,z]),.017*s,darkWood,5);
    bent(g,[[x,y+.079*s,z],[x,y-.052*s,z],[x+.008*s*dir,y-.085*s,z]],.015*s,wood,5);
  }
  function mesh(g,shape,col){
    const {open,crown,runner}=shape,at=shape.surface;
    g.pole([0,.04,0],[0,crown+.025,0],.009,metal,5);
    g.cyl(0,runner,0,.019,.015,.064,6,nickel);
    hook(g,0,.015,0,1);g.cyl(0,.105,0,.017,.017,.016,6,brass);
    for(let i=0;i<segments;i++){
      const shade=.90+.11*(.5+.5*Math.cos(i*tau/segments-.8));
      const color=col.cloth[i%2];
      for(const [u,v] of [[0,.5],[.5,1]]){
        const ink=shaded(color,shade*(u?.982:1));
        g.tri(at(i,.5,0),at(i,u,.34),at(i,v,.34),ink);
        const band=(f,h,pigment)=>g.quad(at(i,u,f),at(i,u,h),at(i,v,h),at(i,v,f),pigment);
        band(.34,.77,ink);band(.77,.814,col.band);band(.814,.922,ink);band(.922,.966,col.selvage);band(.966,1,ink);
      }
      if(i%2===0&&open>.35)for(const mark of prints[col.design]){
        const verts=mark.map(([u,f])=>at(i,u,f,.004));
        for(let j=2;j<verts.length;j++)g.tri(verts[0],verts[j-1],verts[j],col.print);
      }
      const mid=at(i,0,.54,-.012),elbow=at(i,0,.34,-.016),end=at(i,0,1,-.005);
      bent(g,[[0,crown-.018,0],elbow,mid,end],.0045,metal,3);
      g.pole([0,runner,0],mid,.0055,nickel,3);
      // A brass bead covers the end of each steel rib.
      g.pole(at(i,0,.98,-.004),end,.009,brass,4);
    }
    g.cyl(0,crown+.013,0,.010,.025,.032,7,brass);
  }
  const canopyModels=palettes.map((col,i)=>cuts.map((shape,n)=>({key:"rain-canopy/"+i+"/"+n,build:g=>mesh(g,shape,col)})));
  function stance(p,amount,time){
    const moving=p.motion?.weight??(p.moving?1:0),step=p.motion?p.motion.phase*tau:(p.phase||0);
    const gust=Math.sin(time*1.19+(p.x*.046+p.z*.079));
    return {pitch:between(.36,-.075,ease(amount))+.042*gust*amount+.015*moving*Math.sin(step),
      roll:between(-.58,.13,ease(amount))+.022*gust*amount+.013*moving*Math.cos(step)};
  }
  function gripWorld(p){
    const sn=Math.sin(p.yaw||0),cs=Math.cos(p.yaw||0);
    return {x:p.x+cs*grip.x+sn*grip.z,z:p.z-sn*grip.x+cs*grip.z};
  }
  function world(list,model,p,ground,amount,style,time=0){
    if(!(amount>.012))return;
    const a=clamp(amount),pose=stance(p,a,time),hand=gripWorld(p);
    const asset=canopyModels[swatch(style)][Math.round(a*frames)];
    model(asset.key,asset.build);
    list.push([asset.key,hand.x,ground+grip.y,hand.z,p.yaw||0,pose.pitch,pose.roll]);
  }

  // Different owners use the same-sized stand. The Marlin uses brass feet and pale skirting,
  // the port uses galvanized end plates, and the market uses slats from produce boxes.
  function ticket(g,kit){
    const z=.036,plate=(x,y,w,h,ink,depth=z)=>g.quad([x-w/2,y-h/2,depth],[x+w/2,y-h/2,depth],[x+w/2,y+h/2,depth],[x-w/2,y+h/2,depth],ink);
    const faceZ=-.153;
    const paint=(x,y,w,h,ink,lift=0)=>plate(x,y,w,h,ink,faceZ+lift);
    paint(0,1.056,.79,.211,kit.trim);paint(0,1.056,.765,.187,kit.plate,.001);
    const mark=(x,y,shape,step,color)=>{
      for(let row=0;row<shape.length;row++)for(const m of shape[row].matchAll(/1+/g))
        paint(x+(m.index+m[0].length/2)*step,y-row*step,m[0].length*step,step,color,.0025);
    };
    const glyph={L:["100","100","100","100","111"],O:["010","101","101","101","010"],
      A:["010","101","111","101","101"],N:["1001","1101","1011","1001","1001"],
      "1":["010","110","010","010","111"],"4":["101","101","111","001","001"],"6":["011","100","111","101","111"]};
    let x=-.190;
    for(const ch of "LOAN"){mark(x,1.092,glyph[ch],.0174,kit.trim);x+=(glyph[ch][0].length+1)*.0174;}
    paint(.238,1.056,.177,.125,kit.trim,.002);
    x=kit.label==="14"?.17:.215;
    for(const ch of kit.label){mark(x,1.089,glyph[ch],.0145,kit.plate);x+=.060;}
    const X=-.294,Y=1.066,Z=faceZ+.0045,r=.055;
    for(let i=0;i<6;i++){const a=Math.PI*i/6,b=Math.PI*(i+1)/6;
      g.tri([X,Y+.012,Z],[X+r*Math.cos(a),Y+r*Math.sin(a),Z],[X+r*Math.cos(b),Y+r*Math.sin(b),Z],kit.trim);}
    paint(X,Y-.017,.009,.059,kit.trim,.005);paint(X+.010,Y-.045,.021,.008,kit.trim,.005);
    for(const sign of [-1,1])paint(sign*.367,1.113,.012,.012,nickel,.003);
  }
  function packed(g,x,z,n,col){
    const lean=(n-1)*.042,rotate=(n-1)*.21,high=.78+(n%2)*.052;
    const ring=(r,y)=>Array.from({length:8},(_,k)=>{
      const a=k*tau/8+rotate,v=k%2?r*.64:r;return [x+lean*y+Math.cos(a)*v,y,z+Math.sin(a)*v];});
    let prev=ring(.013,.14);
    for(const [h,r] of [[.30,.047],[.46,.040],[.60,.059],[.72,.038]]){
      const next=ring(r,h);
      for(let i=0;i<8;i++){const j=(i+1)%8;g.quad(prev[i],prev[j],next[j],next[i],col.cloth[(i+n)%2]);}
      prev=next;
    }
    g.cyl(x+lean*.463,.463,z,.046,.044,.032,8,col.selvage);
    const ux=x+lean*high;
    g.pole([x+lean*.66,.66,z],[ux,high+.014,z],.009,metal);
    const pts=[[0,0],[0,.060],[.012,.090],[.038,.103],[.065,.099],[.083,.080],[.087,.050]];
    bent(g,pts.map(([d,y])=>[ux+d,high+y,z]),.016,n===0?wood:darkWood,5);
    g.cyl(ux,high+.014,z,.016,.015,.014,6,brass);
  }
  function rackMesh(g,key,held){
    const kit=kits[key];
    g.box(0,.085,.003,.825,.102,.401,kit.frame);g.box(0,.139,.003,.777,.014,.35,darkWood);
    for(const sign of [-1,1]){
      for(const z of [-.168,.153]){
        g.box(sign*.375,.042,z,.067,.062,.073,key==="room"?brass:metal);
        g.box(sign*.388,.324,z,.030,.463,.034,kit.frame);
      }
      g.box(sign*.374,.334,0,.046,.338,.354,kit.ends);
      for(const z of [-.119,.119])g.box(sign*.399,.345,z,.010,.235,.020,kit.trim);
      g.box(sign*.353,.682,-.174,.030,.925,.030,kit.frame);
    }
    g.box(0,1.056,-.177,.816,.229,.036,kit.frame);ticket(g,kit);
    for(const z of [-.121,.128])g.box(0,.525,z,.806,.052,.039,kit.frame);
    for(const x of [-.368,-.126,.115,.368])g.box(x,.521,.003,.027,.058,.276,kit.frame);
    const pat=[0,key==="mercado"?1:key==="luna"?3:2,key==="port"?2:1];
    for(let i=0;i<3;i++)if(i!==0||!held)packed(g,-.255+.245*i,.028*(i%2?1:-1),i,palettes[pat[i]]);
    if(key==="mercado"){
      for(const y of [.222,.322])g.box(0,y,.164,.774,.060,.023,kit.ends);
    }else if(key==="port"){
      g.box(0,.285,.164,.776,.090,.021,kit.ends);
      for(const x of [-.28,-.09,.09,.28])g.box(x,.286,.178,.017,.035,.008,brass);
    }else if(key==="luna"){
      g.box(0,.29,.163,.774,.065,.025,kit.ends);g.box(0,.29,.179,.71,.013,.008,kit.trim);
    }else{
      g.box(0,.254,.156,.774,.053,.028,kit.ends);g.box(0,.329,.156,.774,.042,.028,kit.ends);
    }
  }
  const rackModels=Object.fromEntries(Object.keys(kits).map(key=>[key,[false,true].map(held=>({
    key:"rain-loan/"+key+"/"+Number(held),build:g=>rackMesh(g,key,held)}))]));
  function worldRack(list,model,rack,held=false){
    const asset=rackModels[rackKit(rack)][held?1:0];model(asset.key,asset.build);
    list.push([asset.key,rack.x,rack.y??.076,rack.z,rack.yaw||0]);
  }
  function fill(c,pts,ink){
    c.fillStyle=ink;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);c.closePath();c.fill();
  }
  function paintTop(c,s,shape,col,pose){
    const cp=Math.cos(pose.pitch),sp=Math.sin(pose.pitch),cr=Math.cos(pose.roll),sr=Math.sin(pose.roll);
    const plan=q=>[q[0]*cr-(q[1]*cp-q[2]*sp)*sr,q[1]*sp+q[2]*cp];
    const at=(i,u,f)=>plan(shape.surface(i,u,f));
    const center=plan([0,shape.crown,0]);
    const silhouette=[];
    for(let i=0;i<segments;i++)silhouette.push(at(i,0,1),at(i,.5,1));
    c.save();c.translate(.07,-.12);c.globalAlpha*=.34;fill(c,silhouette,"#394d4a");c.restore();
    for(let i=0;i<segments;i++){
      for(const [u,v] of [[0,.5],[.5,1]]){
        const color=shaded(col.cloth[i%2],(.90+.11*(.5+.5*Math.cos(i*tau/segments-.8)))*(u?.982:1));
        fill(c,[center,at(i,u,.77),at(i,u,1),at(i,v,1),at(i,v,.77)],color);
        if(s>3.5&&shape.open>.25){
          fill(c,[at(i,u,.910),at(i,u,.972),at(i,v,.972),at(i,v,.910)],col.selvage);
          if(s>8)fill(c,[at(i,u,.77),at(i,u,.814),at(i,v,.814),at(i,v,.77)],col.band);
        }
      }
      if(i%2===0&&s>7&&shape.open>.5)
        for(const mark of prints[col.design])fill(c,mark.map(([h,r])=>at(i,h,r)),col.print);
    }
    c.strokeStyle=col.band;c.lineWidth=.014;c.lineJoin="round";c.beginPath();
    c.moveTo(...silhouette[0]);for(let i=1;i<silhouette.length;i++)c.lineTo(...silhouette[i]);c.closePath();c.stroke();
    c.fillStyle=brass;c.beginPath();c.arc(center[0],center[1],Math.max(.023,.57/s),0,tau);c.fill();
  }
  // Hundreds of sidewalk frames reuse a single painted top per swatch and fold.
  const tops=palettes.map(()=>[]),size=96,ppu=38;
  function topSprite(i,n){
    if(tops[i][n]!==undefined)return tops[i][n];
    let surface;
    if(typeof OffscreenCanvas==="function")surface=new OffscreenCanvas(size,size);
    else if(typeof document!=="undefined"){surface=document.createElement("canvas");surface.width=surface.height=size;}
    const ctx=surface?.getContext?.("2d");
    if(!ctx)return tops[i][n]=null;
    const e=ease(n/frames),pose={pitch:between(.36,-.075,e),roll:between(-.58,.13,e)};
    ctx.translate(size*.5,size*.5);ctx.scale(ppu,ppu);
    paintTop(ctx,ppu,cuts[n],palettes[i],pose);
    return tops[i][n]={surface,pose};
  }
  function map(c,px,py,s,p,amount,style,time=0){
    if(!(amount>.012))return;
    const a=clamp(amount),n=Math.round(a*frames),i=swatch(style),shape=cuts[n];
    const sprite=topSprite(i,n),pose=stance(p,a,time),hand=gripWorld(p);
    c.save();c.translate(px(hand.x),py(hand.z));c.rotate(p.yaw||0);c.scale(s,-s);
    if(sprite){
      const reach=shape.crown-.13;
      const x=reach*(Math.sin(sprite.pose.roll)*Math.cos(sprite.pose.pitch)-Math.sin(pose.roll)*Math.cos(pose.pitch));
      const z=reach*(Math.sin(pose.pitch)-Math.sin(sprite.pose.pitch)),w=size/ppu;
      c.drawImage(sprite.surface,x-w/2,z-w/2,w,w);
    }else paintTop(c,s,shape,palettes[i],pose);
    c.restore();
  }
  function mapRack(c,px,py,s,rack,held=false){
    const key=rackKit(rack),k=kits[key];
    c.save();c.translate(px(rack.x),py(rack.z));c.rotate(rack.yaw||0);c.scale(s,-s);
    const rect=(x,z,w,d,ink)=>{c.fillStyle=ink;c.fillRect(x-w/2,z-d/2,w,d);};
    rect(.052,-.038,.84,.412,"#747c70");rect(0,0,.827,.40,k.frame);rect(0,0,.75,.339,"#4e5d56");
    rect(0,-.169,.80,.055,k.trim);rect(0,.156,.79,.05,k.ends);
    for(let i=0;i<3;i++){
      const x=-.255+.245*i,z=.027*(i%2?1:-1);
      if(i!==0||!held){
        const co=palettes[i===0?0:i===1?(key==="mercado"?1:key==="luna"?3:2):key==="port"?2:1];
        fill(c,[[x-.078,z],[x-.04,z-.084],[x+.064,z-.063],[x+.076,z+.034],[x+.014,z+.085],[x-.067,z+.051]],co.cloth[0]);
        rect(x+.016,z,.025,.115,co.selvage);
        c.strokeStyle=wood;c.lineWidth=.027;c.beginPath();c.moveTo(x,z+.02);c.lineTo(x+.021,z+.047);c.lineTo(x+.063,z+.037);c.stroke();
      }
      if(i<2)rect(x+.125,0,.028,.292,k.frame);
    }
    c.restore();
  }
  window.BayRainCanopies=Object.freeze({world,map,worldRack,mapRack});
})();
