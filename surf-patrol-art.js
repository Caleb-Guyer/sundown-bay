/* Sol Beach station 03. The cloth, line buoys and east-end ladders share their
   world positions with their overhead drawings. All geometry is built once. */
(() => {
  "use strict";
  const tower={x:183,z:-26},mast={x:184.82,z:-28.23},desk=BaySurfPatrol.tower;
  const calls=BaySurfPatrol.slips;
  const pegs=[{id:"keys",z:-.64},{id:"token",z:.03},{id:"lure",z:.70}];
  const tau=Math.PI*2, bone="#f1e3b9",rail="#c1cbc0",metal="#697d78",rust="#a46b50";
  const ochre="#eda74d",red="#d95443",blue="#477983",chalk="#d6d8bc",boardGreen="#385954";
  const wood="#9e8065",edgeWood="#c19c77",darkWood="#765e4f";
  const glyph={
    A:["010","101","111","101","101"],B:["110","101","110","101","110"],
    C:["011","100","100","100","011"],D:["110","101","101","101","110"],
    E:["111","100","110","100","111"],F:["111","100","110","100","100"],
    H:["101","101","111","101","101"],L:["100","100","100","100","111"],
    N:["1001","1101","1011","1001","1001"],O:["010","101","101","101","010"],
    R:["110","101","110","101","101"],S:["011","100","010","001","110"],
    T:["111","010","010","010","010"],U:["101","101","101","101","111"],
    0:["111","101","101","101","111"],3:["110","001","010","001","110"],
    "+":["000","010","111","010","000"]," ":["0","0","0","0","0"]
  };
  function panel(g,x,y,z,w,h,color){
    g.quad([x,y-h/2,z-w/2],[x,y-h/2,z+w/2],[x,y+h/2,z+w/2],[x,y+h/2,z-w/2],color);
  }
  function word(g,text,x,y,z,unit,color){
    const letters=Array.from(text,c=>glyph[c]);
    let left=z-unit*(letters.reduce((n,letter)=>n+letter[0].length+1,-1))*.5;
    for(const letter of letters){
      letter.forEach((row,r)=>{
        for(const hit of row.matchAll(/1+/g)){
          const width=hit[0].length*unit;
          panel(g,x,y+(2-r)*unit,left+hit.index*unit+width*.5,width,unit,color);
        }
      });
      left+=(letter[0].length+1)*unit;
    }
  }
  function ringFace(g,x,y,z,ry,rz,thickness,col){
    const point=(angle,ty,tz)=>[x,y+Math.sin(angle)*ty,z+Math.cos(angle)*tz];
    for(let i=0;i<12;i++){
      const a=i*tau/12,b=(i+1)*tau/12;
      g.quad(point(a,ry,rz),point(b,ry,rz),point(b,ry-thickness,rz-thickness),point(a,ry-thickness,rz-thickness),col);
    }
  }
  function watchHouse(g){
    // The original lookout has its counter to the street. These storm shutters
    // and the painted fascia face the water, directly above Tali's desk.
    g.box(1.928,3.83,-.45,.036,.91,2.51,"#e1c89e");
    for(const z of [-1.29,-.46,.37]){
      panel(g,1.956,3.85,z,.73,.69,"#496c72");
      panel(g,1.958,3.99,z,.73,.20,"#94b2a5");
      panel(g,1.959,3.63,z,.73,.20,"#62877f");
    }
    g.box(2.045,3.36,-.46,.29,.075,2.64,wood);
    g.box(1.938,3.96,1.55,.034,.85,.93,"#4e7976");
    panel(g,1.960,4.29,1.55,.84,.04,ochre);
    word(g,"03",1.965,3.93,1.55,.086,bone);
    g.box(1.954,4.65,.0,.065,.39,3.84,"#5d8481");
    word(g,"SOL BEACH",1.991,4.655,0,.060,bone);
    for(const z of [-1.76,1.75])panel(g,1.995,4.68,z,.033,.17,"#a9aa8b");
    g.quad([-1.25,5.317,-.18],[-1.25,5.317,.19],[.99,5.317,.19],[.99,5.317,-.18],bone);
    g.quad([-.32,5.319,-1.11],[-.32,5.319,1.13],[.07,5.319,1.13],[.07,5.319,-1.11],bone);
    const x=mast.x-tower.x,z=mast.z-tower.z;
    g.cyl(x,5.46,z,.052,.088,5.67,7,"#e2d5b1");
    g.cyl(x,8.34,z,.038,.091,.13,7,ochre);
    for(const y of [3.1,4.59,5.21])g.box(x-.034,y,z+.045,.18,.10,.20,"#827263");
    g.pole([x+.075,3.03,z+.035],[x+.052,8.19,z+.026],.011,darkWood,4);
    g.pole([x+.08,3.05,z+.04],[x+.13,3.33,z+.07],.030,rail,5);
    // A salt-faded square of blackboard paint, a chalk ledge and real wired hooks.
    g.box(2.38,1.52,.03,.14,1.37,2.39,darkWood);
    panel(g,2.454,1.52,.03,2.21,1.20,boardGreen);
    g.box(2.48,2.176,.03,.23,.115,2.44,edgeWood);
    g.box(2.56,.874,.03,.36,.102,2.43,wood);
    for(const dz of [-1.12,1.18])g.box(2.386,1.08,dz,.11,2.02,.085,wood);
    word(g,"LOST + FOUND",2.456,1.945,.03,.037, chalk);
    panel(g,2.46,1.79,.03,2.10,.018,"#859887");
    for(const p of pegs){
      g.pole([2.45,1.67,p.z],[2.53,1.69,p.z],.022,"#c8b597",5);
      g.pole([2.53,1.69,p.z],[2.55,1.74,p.z],.018,rail,5);
      panel(g,2.458,1.048,p.z,.36,.019,"#a3af99");
    }
    // The tide graph is redrawn on a narrow strip at the bottom of the board.
    for(let i=0;i<17;i++){
      const z0=-1.0+i*.089,z1=z0+.089,water=y=>.987+.031*Math.sin(y*5.7);
      g.pole([2.46,water(z0),z0],[2.46,water(z1),z1],.009,"#a9b9a2",3);
    }
    g.box(2.61,.939,.78,.051,.044,.27,"#e3dbc1");
    g.box(2.61,.942,-.81,.077,.058,.16,"#ae9172");
    // A recovery line reel on its own sand feet, facing the public side.
    const reelZ=-2.14;
    for(const sx of [1.96,2.52]){
      for(const sign of [-1,1]){
        g.pole([sx,.04,reelZ+sign*.48],[sx,.78,reelZ],.038,metal,5);
        g.box(sx,.046,reelZ+sign*.49,.19,.065,.16,rust);
      }
    }
    g.pole([1.91,.76,reelZ],[2.64,.76,reelZ],.044,metal,6);
    g.pole([2.015,.76,reelZ],[2.492,.76,reelZ],.235,"#b79b69",14);
    for(let i=0;i<8;i++){
      const rx=2.033+i*.062;g.pole([rx,.76,reelZ],[rx+.021,.76,reelZ],.247,"#d4b77c",14);
    }
    for(const sx of [1.99,2.50]){
      ringFace(g,sx,.76,reelZ,.325,.325,.045,red);
      for(let i=0;i<4;i++){
        const a=.5+i*Math.PI*.5;
        g.pole([sx,.76,reelZ],[sx,.76+.30*Math.sin(a),reelZ+.30*Math.cos(a)],.027,red,4);
      }
    }
    g.pole([2.62,.76,reelZ],[2.62,.89,reelZ+.12],.020,metal,5);
    g.pole([2.62,.89,reelZ+.12],[2.73,.89,reelZ+.12],.025,wood,5);
    for(const y of [.61,1.52])g.box(2.08,y,2.07,.24,.07,.35,metal);
  }
  function rescueCan(g){
    // Rotomoulded pear-shaped float, with open grab handles on both sides.
    const shape=[[-.55,.025,.03],[-.42,.104,.135],[-.25,.145,.195],[.28,.145,.195],[.46,.091,.15],[.55,.034,.047]];
    function point(i,j){const [y,x,z]=shape[i],a=j*tau/10;return [Math.cos(a)*x,y,Math.sin(a)*z];}
    for(let i=1;i<shape.length;i++)for(let j=0;j<10;j++)
      g.quad(point(i-1,j),point(i-1,j+1),point(i,j+1),point(i,j),j%3?"#e47448":"#f59559");
    for(const sign of [-1,1]){
      const a=[.025,.33,.14*sign],b=[.025,.25,.26*sign],c=[.025,-.20,.26*sign],d=[.025,-.31,.14*sign];
      g.pole(a,b,.032,red,5);g.pole(b,c,.034,"#f39860",5);g.pole(c,d,.032,red,5);
    }
    panel(g,.15,.10,0,.205,.066,bone);
    for(let i=0;i<9;i++){
      const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
      const p=k=>[.012,.55+.30*Math.sin(k),.042+.075*Math.cos(k)];
      g.pole(p(a),p(b),.018,"#8b634d",4);
    }
  }
  function pegItem(g,id){
    const brass="#d3ad65",shine="#eed998";
    ringFace(g,.006,-.06,0,.080,.052,.012,brass);
    if(id==="keys"){
      const p=(y,z)=>[.020,y,z],tip=p(-.45,-.058),top=p(-.10,-.021);
      g.quad(top,p(-.21,.10),tip,p(-.23,-.154),"#538fa4");
      g.quad(p(-.15,-.027),p(-.218,.056),p(-.38,-.059),p(-.232,-.11),"#72a4b0");
      panel(g,.025,-.24,-.031,.098,.031,bone);
      g.pole([-.011,-.12,.055],[.023,-.32,.12],.019,brass,5);
      g.pole([.023,-.30,.12],[.023,-.286,.16],.021,brass,4);
    }else if(id==="token"){
      const cy=-.28;
      for(let i=0;i<14;i++){
        const a=i*tau/14,b=(i+1)*tau/14;
        g.tri([.02,cy,.008],[.02,cy+.145*Math.sin(a),.008+.137*Math.cos(a)],[.02,cy+.145*Math.sin(b),.008+.137*Math.cos(b)],brass);
      }
      ringFace(g,.023,cy,.008,.135,.128,.012,shine);
      g.quad([.026,cy-.014,-.067],[.026,cy-.014,.091],[.026,cy-.043,.063],[.026,cy-.043,-.05],"#866b48");
      panel(g,.026,cy+.016,.005,.063,.054,"#866b48");
    }else{
      const p=(y,z)=>[.023,y,z];
      g.quad(p(-.11,-.015),p(-.15,.08),p(-.30,.026),p(-.26,-.052),red);
      g.quad(p(-.15,.08),p(-.18,.074),p(-.25,-.024),p(-.23,-.042),bone);
      g.tri(p(-.27,.012),p(-.39,.055),p(-.34,-.047),"#cf7b57");
      panel(g,.027,-.138,.010,.025,.024,"#314f51");
    }
  }
  function flagPiece(g,alert,i){
    const col=alert?["#e15b4b","#d94f43","#ef6951"]:["#f5c15f","#f1b454","#f5c76e"];
    const length=alert?.69:.79;
    const heights=alert?[.96,.92,.84,.76]:[.97,.70,.39,.09],a=heights[i],b=heights[i+1];
    const bend=i===1?-.038:.035;
    const pt=(z,y)=>[bend*z/length,y,z];
    g.quad(pt(0,0),pt(length,-.034),pt(length,-.034-b),pt(0,-a),col[i]);
    g.quad(pt(0,-.046),pt(length,-.076),pt(length,-.096),pt(0,-.069),alert?"#ef8970":"#f4d799");
    if(i===0){
      g.quad([.003,0,0],pt(.13,-.006),pt(.13,-a+.038),[.003,-a,0],"#e4d2a5");
      for(const y of [-.10,-a+.08])panel(g,.012,y,.057,.046,.041,metal);
    }
  }
  const floatCount=7,spacing=2.17;
  // North flags lie a little farther inshore to leave the Jetty Sprint gate clear.
  const floatLines=calls.map((spot,i)=>({x:spot.x-(i===1?13:10),z:spot.z}));
  function floatAt(i){const w=i/(floatCount-1);return {x:.85*Math.sin(w*Math.PI),z:(i-(floatCount-1)/2)*spacing};}
  function floatLine(g){
    for(let i=1;i<floatCount;i++){
      const a=floatAt(i-1),b=floatAt(i),middle=[(a.x+b.x)/2,.025,(a.z+b.z)/2];
      g.pole([a.x,.104,a.z],middle,.023,"#8b8566",4);
      g.pole(middle,[b.x,.104,b.z],.023,"#958d6d",4);
    }
    for(let i=0;i<floatCount;i++){
      const {x,z}=floatAt(i);
      if(i===0||i===floatCount-1){
        g.cyl(x,.19,z,.28,.17,.35,9,"#bd7050");
        g.cyl(x,.58,z,.165,.245,.48,9,"#e9dec1");
        g.cyl(x,.69,z,.183,.19,.112,9,"#bd6d4f");
        g.cyl(x,.845,z,.06,.165,.065,9,"#d9d1b4");
        g.pole([x,.83,z-.03],[x,1.04,z-.03],.027,metal,5);
      }else{
        g.pole([x,.105,z-.26],[x,.112,z+.26],.155,i%2?bone:ochre,8);
        g.pole([x,.111,z-.043],[x,.113,z+.049],.160,i%2?ochre:bone,8);
      }
    }
  }
  function ladder(g){
    const set=[[-.55,.018],[-.55,.46],[-.51,.65],[-.39,.79],[-.19,.855],[.01,.80],[.18,.62],[.22,.39],[.22,-1.69]];
    for(const side of [-.44,.44]){
      g.box(-.55,.016,side,.21,.03,.15,metal);
      for(let i=1;i<set.length;i++){
        const [px,py]=set[i-1],[x,y]=set[i];
        g.pole([px,py,side],[x,y,side],.053,i===3||i===4?bone:rail,7);
      }
      g.pole([.22,-.072,side],[.22,.28,side],.057,ochre,7);
      g.pole([.22,-1.69,side],[.22,-1.19,side],.055,"#718e82",7);
      for(const y of [-.35,-.99])g.pole([-.10,y,side],[.22,y,side],.035,metal,6);
    }
    for(const y of [.10,-.24,-.58,-.92,-1.26,-1.60]){
      g.box(.22,y,0,.15,.055,.86,y<-.6?"#82998b":"#b29d66");
      g.box(.295,y+.008,0,.017,.035,.83,y<-.6?"#88a69a":ochre);
    }
    // Painted ladder symbol on the pile cap sits above a swimmer's sightline.
    g.box(-.22,.44,1.10,.075,.88,.067,metal);
    g.box(-.185,.64,1.10,.043,.59,.51,"#344e53");
    panel(g,-.160,.652,1.10,.44,.51,"#e8d399");
    for(const dz of [-.095,.095])panel(g,-.156,.66,1.10+dz,.028,.34,"#365c61");
    for(const y of [.55,.66,.77])panel(g,-.155,y,1.10,.21,.022,"#365c61");
  }
  function install(model){
    model("surf-watchhouse",watchHouse);model("surf-watch-can",rescueCan);
    for(const p of pegs)model("surf-peg-"+p.id,g=>pegItem(g,p.id));
    for(const alert of [false,true])for(let i=0;i<3;i++)model(flagName(alert,i),g=>flagPiece(g,alert,i));
    model("surf-float-line",floatLine);model("surf-east-ladder",ladder);
  }
  const flagName=(alert,i)=>"surf-"+(alert?"red":"gold")+"-cloth-"+i;
  function cloth(alert,t,rain){
    const steps=[],length=alert?.69:.79;
    let x=mast.x,z=mast.z,y=8.24;
    for(let i=0;i<3;i++){
      const pulse=t*(2.6+rain*1.8)-i*.78;
      const yaw=.26+.38*Math.sin(t*.19)+(.10+.075*i+.08*rain)*Math.sin(pulse);
      const pitch=.056+(.018+.037*i)*Math.sin(pulse-1.2);
      steps.push({x,y,z,yaw,pitch});
      const down=-.034*Math.cos(pitch)-length*Math.sin(pitch),forward=length*Math.cos(pitch)-.034*Math.sin(pitch);
      const side=i===1?-.038:.035,c=Math.cos(yaw),s=Math.sin(yaw);
      x+=c*side+s*forward;y+=down;z+=-s*side+c*forward;
    }
    return steps;
  }
  function ladders(list,see){
    for(const d of BayMarina.docks)if(see(d,86))list.push(["surf-east-ladder",d.x+d.headW/2,d.level,d.z]);
  }
  function onRack(patrol){
    const p=patrol?.tali;
    return !patrol?.alert&&(!p||Math.hypot(p.x-desk.x,p.z-desk.z)<1.2);
  }
  function handCan(p){
    const yaw=p.yaw||0,swing=Math.sin(p.phase||0)*(p.pace||0),forward=-.045+.12*swing;
    return [p.x+.40*Math.cos(yaw)+forward*Math.sin(yaw),(p.y||0)+.80+.023*swing,
      p.z-.40*Math.sin(yaw)+forward*Math.cos(yaw),yaw+.21,-.25+.13*swing,.11];
  }
  function world(view,list,see,t,weather,patrol,returned=[]){
    const racked=onRack(patrol),guard=patrol?.tali;
    if(see(tower,138)){
      const alert=!!patrol?.alert;
      list.push(["surf-watchhouse",tower.x,0,tower.z]);
      const pieces=cloth(alert,t,weather?.rain||0);
      for(let i=0;i<pieces.length;i++){
        const p=pieces[i];list.push([flagName(alert,i),p.x,p.y,p.z,p.yaw,p.pitch]);
      }
      if(see(tower,57)){
        if(racked)list.push(["surf-watch-can",tower.x+2.23,1.12,tower.z+2.07,-.03,-.14,.085]);
        for(const p of pegs)if(returned.includes(p.id))list.push(["surf-peg-"+p.id,tower.x+2.549,1.72,tower.z+p.z]);
      }
    }
    if(!racked&&guard&&!guard.wet&&see(guard,47))list.push(["surf-watch-can",...handCan(guard)]);
    for(let i=0;i<floatLines.length;i++)if(see(floatLines[i],80)){
      const p=floatLines[i],phase=t*1.33+i*1.63;
      list.push(["surf-float-line",p.x,.029*Math.sin(phase),p.z,0,.006*Math.sin(phase+.8)]);
    }
    ladders(list,see);
  }
  const dot=(c,x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,tau);c.fill();};
  function mapLadders(c,opt,px,py,s,visible){
    const street=opt.mode==="street";if(!street&&!opt.swim)return;
    const ui=Math.min(c.canvas.width,c.canvas.height)/(opt.mode==="radar"?165:370);
    const zoom=opt.swim?Math.max(s,street?5.6:7.3*ui):s;
    for(const d of BayMarina.docks){
      const x=px(d.x+d.headW/2),y=py(d.z);
      if(!visible(x,y,Math.max(5*s,zoom)))continue;
      c.save();c.translate(x,y);
      c.scale(zoom,zoom);
      if(!street){c.fillStyle="#244e50";c.fillRect(-.76,-.60,1.35,1.20);}
      c.strokeStyle="#3a6466";c.lineWidth=.33;c.lineCap="round";c.beginPath();
      for(const side of [-.46,.46]){c.moveTo(-.68,side);c.lineTo(.47,side);}c.stroke();
      c.strokeStyle=rail;c.lineWidth=.17;c.stroke();c.strokeStyle="#eabd72";c.lineWidth=.16;c.beginPath();
      for(const across of [-.37,.04,.38]){c.moveTo(across,-.46);c.lineTo(across,.46);}c.stroke();
      c.restore();
    }
  }
  function map(c,opt,px,py,s,visible){
    if(opt.mode==="street"){
      const t=opt.time||0,alert=!!opt.patrol?.alert,racked=onRack(opt.patrol),guard=opt.patrol?.tali;
      if(visible(px(tower.x),py(tower.z),9*s)){
        c.save();c.translate(px(tower.x),py(tower.z));c.scale(s,-s);
        const rect=(x,z,w,d,col)=>{c.fillStyle=col;c.fillRect(x,z,w,d);};
        rect(-2.62,-3.12,5.27,6.24,"#d3ab82");
        for(let i=0;i<8;i++)rect(-2.55,-2.98+i*.77,5.14,.048,"#9f896b");
        for(let i=0;i<5;i++)rect(-5.25+i*.51,1.14,.50,1.42,i%2?edgeWood:"#ad906d");
        rect(-1.98,-2.89,4.37,5.78,"#ad7561");rect(-1.97,-2.74,4.23,5.49,"#d99074");
        for(let z=-2.5;z<2.68;z+=.60)rect(-1.95,z,4.17,.037,"#ae7965");
        rect(-1.98,-2.67,.12,5.36,"#ead3a4");rect(.0,-2.63,.085,5.27,"#e5ad82");
        // The white patrol cross can be picked out from the bike path.
        rect(-1.25,-.18,2.24,.37,bone);rect(-.32,-1.11,.39,2.24,bone);
        rect(2.31,-1.15,.37,2.41,darkWood);rect(2.50,-1.10,.16,2.30,"#c59d75");
        const returned=opt.returned||[];for(const p of pegs)if(returned.includes(p.id))dot(c,2.63,p.z,.11,p.id==="keys"?blue:p.id==="token"?ochre:red);
        dot(c,2.26,-2.14,.37,metal);dot(c,2.26,-2.14,.25,"#c8ac76");
        if(racked){rect(2.08,1.84,.29,.49,"#d76f47");rect(2.05,1.89,.35,.08,bone);}
        c.restore();
        c.save();const pcs=cloth(alert,t,opt.weather?.rain||0);
        c.lineWidth=Math.max(.9,.10*s);c.strokeStyle="#786b50";c.lineJoin="round";
        for(let i=0;i<pcs.length;i++){
          const p=pcs[i],l=alert?.69:.79,ex=p.x+Math.sin(p.yaw)*l,ez=p.z+Math.cos(p.yaw)*l;
          const width=alert?.49:.58-.13*i;
          c.beginPath();c.moveTo(px(p.x-width*.46),py(p.z));c.lineTo(px(ex-width*.36),py(ez));c.lineTo(px(ex+width*.52),py(ez));
          c.lineTo(px(p.x+width*.6),py(p.z));c.closePath();c.fillStyle=alert?red:ochre;c.stroke();c.fill();
        }
        dot(c,px(mast.x),py(mast.z),Math.max(.7,.095*s),bone);c.restore();
      }
      if(!racked&&guard&&!guard.wet&&visible(px(guard.x),py(guard.z),2*s)){
        const [x,,z,yaw]=handCan(guard);c.save();c.translate(px(x),py(z));c.rotate(yaw);
        c.fillStyle="#db794d";c.beginPath();c.ellipse(0,0,.18*s,.32*s,0,0,tau);c.fill();
        c.fillStyle=bone;c.fillRect(-.15*s,.063*s,.30*s,.045*s);c.restore();
      }
      for(const p of floatLines){
        if(!visible(px(p.x),py(p.z),9*s))continue;
        c.save();c.lineWidth=Math.max(.6,s*.053);c.strokeStyle="#7d8974";c.beginPath();
        for(let i=0;i<floatCount;i++){
          const b=floatAt(i),x=px(p.x+b.x),y=py(p.z+b.z);if(i)c.lineTo(x,y);else c.moveTo(x,y);
        }c.stroke();
        for(let i=0;i<floatCount;i++){
          const b=floatAt(i),x=px(p.x+b.x),y=py(p.z+b.z);
          const end=i===0||i===floatCount-1;
          dot(c,x,y,Math.max(.7,(end?.34:.18)*s),end?"#b47150":i%2?bone:ochre);
          if(end)dot(c,x-.35,y-.35,Math.max(.46,.18*s),bone);
        }c.restore();
      }
    }
    mapLadders(c,opt,px,py,s,visible);
  }
  window.BaySurfArt={install,world,map,ladders,mapLadders,desk,calls};
})();
