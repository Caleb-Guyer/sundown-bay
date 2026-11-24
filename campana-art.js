/* Nina's converted Pelican. The cargo panel ends just behind the front door. */
(() => {
  "use strict";
  const cream="#f4deaf",shell="#fff1c9",coral="#c95647",cherry="#963c39",mango="#e8a342",
    mint="#39867d",pine="#265957",enamel="#f8e8bf",metal="#a6aaa0",brass="#bc8b47";
  const flavors={
    guava:{ice:"#e97982",edge:"#bb4e63",shine:"#ffc2ab",band:"#5d8b60"},
    coconut:{ice:"#f6e6bc",edge:"#c9af82",shine:"#fff7d8",band:"#568f87"},
    tamarind:{ice:"#a8683f",edge:"#784731",shine:"#de9c63",band:"#edb14e"}
  };
  const limit=n=>Math.max(0,Math.min(1,n||0));
  const letter={
    A:["04 20 44","13 33"],C:["40 10 01 03 14 44"],E:["40 00 04 44","02 32"],
    L:["00 04 44"],M:["04 00 22 40 44"],N:["04 00 44 40"],P:["04 00 30 41 32 02"],
    S:["40 10 01 12 32 43 34 04"],T:["00 40","20 24"]
  };
  function stroke(g,pt,a,b,w,ink){
    const dx=b[0]-a[0],dy=b[1]-a[1],f=w*.5/(Math.hypot(dx,dy)||1),x=-dy*f,y=dx*f;
    g.quad(pt(a[0]+x,a[1]+y),pt(b[0]+x,b[1]+y),pt(b[0]-x,b[1]-y),pt(a[0]-x,a[1]-y),ink);
  }
  function legend(g,pt,text,center,base,h,ink,w=.105){
    const cell=h*.60,gap=h*.18;let left=center-(text.length*(cell+gap)-gap)*.5;
    for(const l of text){
      for(const path of letter[l]){
        let prev=null;for(const xy of path.split(" ")){
          const y=1-Number(xy[1])*.25,p=[left+cell*Number(xy[0])*.25+h*.13*y,base+h*y];
          if(prev)stroke(g,pt,prev,p,h*w,ink);prev=p;
        }
      }
      left+=cell+gap;
    }
  }
  function rect(g,pt,x0,y0,x1,y1,ink){
    g.quad(pt(x0,y0),pt(x1,y0),pt(x1,y1),pt(x0,y1),ink);
  }
  function oval(g,pt,x,y,w,h,ink,count=12){
    let before=pt(x+w,y);for(let i=1;i<=count;i++){
      const a=i*Math.PI*2/count,next=pt(x+w*Math.cos(a),y+h*Math.sin(a));g.tri(pt(x,y),before,next,ink);before=next;
    }
  }
  // Each painted elevation follows the Pelican's narrowing upper body.
  const flank=(side,push)=>(u,y)=>[side*(.92-.07*(y-.97)/1.23+push),y,side*u];
  function popsicle(g,pt,x,y,h,id,wrapped){
    const pal=flavors[id],w=h*.29,top=y+h;
    rect(g,pt,x-w*.22,y-h*.31,x+w*.22,y+h*.16,"#c39057");
    g.quad(pt(x-w,y+.08*h),pt(x-w,top-.13*h),pt(x+w,top-.13*h),pt(x+w,y+.08*h),pal.ice);
    g.quad(pt(x-w,y+.08*h),pt(x+w,y+.08*h),pt(x+w*.76,y),pt(x-w*.72,y),pal.edge);
    g.quad(pt(x-w,top-.13*h),pt(x-w*.61,top),pt(x+w*.55,top),pt(x+w,top-.13*h),pal.ice);
    stroke(g,pt,[x-w*.67,y+.28*h],[x-w*.67,y+.80*h],.055*h,pal.shine);
    if(wrapped){
      g.quad(pt(x-w*1.13,y+.43*h),pt(x+w*1.1,y+.35*h),pt(x+w,y-.03*h),pt(x-w*.90,y-.04*h),shell);
      g.quad(pt(x-w*1.11,y+.40*h),pt(x+w*1.11,y+.32*h),pt(x+w*1.10,y+.23*h),pt(x-w*1.09,y+.31*h),pal.band);
    }
  }
  function sign(g){
    const left=flank(-1,.019),print=flank(-1,.024);
    rect(g,left,.36,1.08,2.08,1.98,cream);
    oval(g,print,1.23,1.57,.82,.339,coral,20);
    legend(g,flank(-1,.029),"LA",1.20,1.68,.104,shell,.10);
    legend(g,flank(-1,.031),"CAMPANA",1.205,1.42,.212,shell,.157);
    legend(g,print,"PALETAS",1.22,1.13,.095,pine,.13);
    const right=flank(1,.015);rect(g,right,-2.13,1.03,-.08,2.087,cream);
    for(const side of [-1,1]){
      const sidewall=flank(side,.019),a=side<0?.28:-2.12,b=side<0?2.12:-.28;
      rect(g,sidewall,a,2.046,b,2.096,coral);rect(g,sidewall,a,2.015,b,2.034,mango);
      const lower=(u,y)=>[side*.973,y,side*u];
      rect(g,lower,a,.79,b,.90,coral);rect(g,lower,a,.75,b,.776,mango);
    }
    rect(g,flank(1,.024),-1.97,2.00,-.20,2.176,coral);
    legend(g,flank(1,.027),"LA",-1.62,2.026,.105,shell,.14);
    legend(g,flank(1,.027),"CAMPANA",-1.018,2.023,.127,shell,.14);
    const back=(x,y)=>[-x,y,-2.308+.071*(y-1)];
    rect(g,back,-.36,1.096,.36,1.46,cream);
    legend(g,(x,y)=>[x,y,-2.313+.071*(y-1)],"PALETAS",0,1.18,.099,cherry,.125);
    // The cast supports stand either side of the bell. It can swing crosswise inside the yoke.
    g.box(0,2.225,-.49,.73,.048,.38,mint);
    for(const z of [-.66,-.32]){
      g.pole([0,2.27,z],[0,2.72,z],.028,pine,6);
      g.pole([-.19,2.25,z],[0,2.63,z],.018,metal,5);
    }
    g.pole([0,2.70,-.69],[0,2.70,-.29],.026,brass,7);
    // Condenser grille, skids and a pair of latches left behind by the conversion.
    g.box(0,2.245,-1.64,.86,.09,.60,"#a0b2a0");g.box(0,2.305,-1.64,.83,.065,.58,cream);
    for(let i=0;i<7;i++)g.box(-.305+.101*i,2.343,-1.64,.038,.013,.42,"#667b72");
    for(const z of [-1.96,-.22])g.box(.93,1.956,z,.058,.052,.114,metal);
  }
  function hatch(g){
    // The local origin is the forward-running piano hinge, and local -Y swings out over the curb.
    const start=-2.02,end=-.16,n=13,step=(end-start)/n,colors=[coral,cream,mango,cream];
    for(let i=0;i<n;i++){
      const z=start+i*step,ink=colors[i%4];
      g.quad([.02,0,z],[.02,0,z+step],[.048,-.82,z+step],[.048,-.82,z],ink);
      g.quad([0,-.004,z],[.030,-.82,z],[.030,-.82,z+step],[0,-.004,z+step],i%2?"#e2cfa4":"#b87e63");
      g.quad([.048,-.812,z],[.048,-.812,z+step],[.049,-.861,z+step*.84],[.049,-.864,z+step*.15],ink);
    }
    g.box(.024,-.018,-1.09,.048,.041,1.91,brass);
    g.box(.039,-.807,-1.09,.041,.034,1.89,cream);
  }
  function counter(g){
    g.box(.955,1.495,-1.09,.056,.78,1.84,"#4c5952");
    g.box(.991,1.47,-1.10,.018,.67,1.68,"#364e4f");
    for(const z of [-1.86,-1.68])g.box(1.003,1.59,z,.017,.42,.115,"#d6b36d");
    for(const y of [1.41,1.48,1.62])for(const z of [-1.86,-1.68])g.box(1.018,y,z,.01,.02,.074,cherry);
    // Nina in the service hatch, framed by a green apron, a checked kerchief and the freezer lip.
    g.box(1.022,1.316,-.76,.094,.315,.34,mint);
    g.quad([1.076,1.48,-.91],[1.077,1.405,-.78],[1.076,1.47,-.63],[1.076,1.32,-.77],shell);
    g.box(1.083,1.34,-.76,.055,.077,.29,"#e0bd85");
    g.box(1.03,1.508,-.76,.11,.106,.109,"#986246");
    g.box(1.02,1.647,-.75,.128,.238,.214,"#a66e4b");
    g.box(1.089,1.627,-.735,.019,.050,.059,"#b9825a");
    for(const z of [-.802,-.70])g.box(1.089,1.676,z,.018,.012,.027,"#4a413a");
    g.box(1.012,1.756,-.756,.164,.073,.234,"#4b3c34");
    g.box(1.035,1.755,-.756,.137,.032,.25,coral);
    g.box(.997,1.775,-.896,.122,.080,.088,"#534139");
    for(const z of [-.847,-.771,-.703])g.box(1.107,1.754,z,.009,.016,.017,cream);
    g.pole([1.044,1.42,-.89],[1.107,1.26,-.965],.049,cream,6);
    g.pole([1.107,1.26,-.965],[1.132,1.206,-1.14],.033,"#ad7855",7);
    g.box(1.066,1.13,-1.09,.293,.060,1.90,metal);
    g.box(1.072,1.166,-1.09,.308,.023,1.95,enamel);
    const display=(x,y)=>[1.17,y,x];
    g.box(1.144,1.205,-1.49,.074,.064,.53,mint);
    for(const [i,id] of ["tamarind","coconut","guava"].entries())popsicle(g,display,-1.677+i*.18,1.235,.183,id,true);
    g.box(1.11,1.218,-.35,.14,.084,.17,"#889f93");
    g.box(1.117,1.263,-.352,.11,.013,.135,cream);
  }
  function bell(g){
    g.cyl(0,-.105,0,.060,.077,.17,10,brass);
    g.cyl(0,-.222,0,.074,.113,.09,12,"#c79750");
    g.cyl(0,-.295,0,.110,.171,.065,12,"#d7ad60");
    g.cyl(0,-.340,0,.172,.176,.029,12,brass);
    g.cyl(0,-.373,0,.029,.041,.072,7,"#685641");
  }
  function cabNina(g){
    g.box(-.41,1.21,.41,.29,.52,.21,mint);g.box(-.41,1.59,.42,.191,.23,.175,"#a66e4b");
    g.box(-.41,1.714,.405,.21,.072,.20,"#46392f");g.box(-.41,1.705,.42,.215,.031,.206,coral);
    for(const x of [-.54,-.28])g.pole([x,1.39,.49],[x,1.235,.805],.037,"#aa7552",6);
  }
  function basePoint(v,u,y,z,ground){
    const pitch=v.pitch||0,lean=v.lean||0,cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(lean),sr=Math.sin(lean);
    const py=y*cp-z*sp,pz=y*sp+z*cp,px=u*cr-py*sr,sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
    return [v.x+px*cs+pz*sn,ground+u*sr+py*cr,v.z-px*sn+pz*cs];
  }
  function world(view,list,model,v,open=0,ring=0,t=0,ground=.085){
    if(!v)return;
    const u=limit(open),swing=.47*limit(ring)*Math.sin(t*19.5),tilt=1.47*u;
    model("campana/trim",sign);model("campana/hatch",hatch);model("campana/bell",bell);
    const body=(id)=>list.push([id,v.x,ground,v.z,v.yaw,v.pitch||0,v.lean||0]);
    body("campana/trim");
    if(u>.065){model("campana/counter",counter);body("campana/counter");}
    if(v.campanaDriver&&u<.18){model("campana/nina-at-wheel",cabNina);body("campana/nina-at-wheel");}
    list.push(["campana/hatch",...basePoint(v,.946,1.975,0,ground),v.yaw,v.pitch||0,(v.lean||0)+tilt]);
    list.push(["campana/bell",...basePoint(v,0,2.685,-.49,ground),v.yaw,v.pitch||0,(v.lean||0)+swing]);
  }
  function overhead(c,px,py,s,v,open=0,ring=0,t=0){
    if(!v||s<=0)return;
    const u=limit(open),w=.045+.82*Math.sin(u*1.47),swing=.47*limit(ring)*Math.sin(t*19.5);
    c.save();c.translate(px(v.x),py(v.z));c.rotate(v.yaw);c.scale(s,s);
    const box=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    const disc=(x,y,r,col)=>{c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fillStyle=col;c.fill();};
    box(-.84,-.50,1.68,2.69,cream);box(-.85,-.49,.08,2.67,coral);box(.76,-.49,.09,2.67,coral);
    box(-.445,1.30,.89,.65,"#bca984");box(-.41,1.35,.82,.55,enamel);
    for(let i=0;i<7;i++)box(-.314+i*.098,1.395,.036,.444,"#748778");
    box(-.37,.31,.74,.38,mint);box(-.03,.26,.06,.47,pine);
    disc(.18*Math.sin(swing),.49,.171,brass);disc(.16*Math.sin(swing),.49,.118,"#ddbc78");
    for(let i=0;i<13;i++)box(.91,.16+i*1.86/13,w,1.86/13+.003,[coral,cream,mango,cream][i%4]);
    box(.91+w-.027,.16,.027,1.86,coral);
    if(ring>.05){
      c.strokeStyle="#ffdf8c";c.globalAlpha*=limit(ring);c.lineWidth=.049;
      const radius=.25+.15*(.5+.5*Math.sin(t*12));
      for(const a of [-.58,Math.PI-.58]){c.beginPath();c.arc(0,.49,radius,a,a+1.12);c.stroke();}
    }
    c.restore();
  }
  function heldPop(g,id,bites=3){
    const p=flavors[id],lo=-.049,hi=.120-(3-bites)*.038,w=.043,front=.024,back=-.022;
    const corners=[[-w,lo],[-w,hi-.024],[-w*.53,hi],[w*.52,hi],[w,hi-.023],[w,lo]];
    for(let i=0;i<corners.length;i++){const a=corners[i],b=corners[(i+1)%corners.length];
      g.quad([a[0],a[1],back],[b[0],b[1],back],[b[0],b[1],front],[a[0],a[1],front],p.edge);}
    for(const z of [front+.001,back-.001])popsicle(g,(x,y)=>[x,y,z],0,lo,hi-lo,id,true);
    g.box(0,-.073,0,.018,.067,.011,"#b78d57");
  }
  function treatWorld(list,model,a,id,ground,t=0,pose=null){
    if(!a||!Object.hasOwn(flavors,id))return;
    const bites=pose?.bites||3,key="campana/pop/"+id+"/"+bites;
    model(key,g=>heldPop(g,id,bites));
    const q=pose?.world?[a.x,ground,a.z]:basePoint(a,pose?.x??.335,pose?.y??(.98+.017*Math.sin(t*2.6)),pose?.z??.20,ground??a.y??.08);
    list.push([key,...q,a.yaw||0,-.16,.09]);
  }
  function treatMap(c,px,py,s,a,id,t=0,world=false){
    if(!a||!Object.hasOwn(flavors,id))return;
    const q=world?[a.x,0,a.z]:basePoint(a,.34,0,.20,0),p=flavors[id];
    c.save();c.translate(px(q[0]),py(q[2]));c.rotate((a.yaw||0)+.12);c.fillStyle=shell;
    c.fillRect(-.06*s,-.115*s,.12*s,.22*s);c.fillStyle=p.ice;c.fillRect(-.06*s,-.13*s,.12*s,.144*s);c.restore();
  }
  function freezerCard(canvas,book){
    if(!canvas?.getContext)return false;
    let c;try{c=canvas.getContext("2d");}catch{return false;}
    if(!c||typeof c.fillText!=="function")return false;
    const stamps=(book?.stamps||0)&7,ids=["guava","coconut","tamarind"];
    canvas.width=880;canvas.height=244;
    if(canvas.style){canvas.style.width="100%";canvas.style.maxWidth="440px";canvas.style.height="auto";canvas.style.display="block";}
    canvas.setAttribute?.("role","img");
    const tried=ids.filter((id,i)=>stamps&(1<<i));
    canvas.setAttribute?.("aria-label","La Campana paletas. Guava, coconut and tamarind. "+(tried.length?"Punched for "+tried.join(", ")+".":"Fresh punch card."));
    c.save();c.setTransform(2,0,0,2,0,0);
    const fill=(x,y,w,h,ink)=>{c.fillStyle=ink;c.fillRect(x,y,w,h);};
    const dot=(x,y,rx,ry,rot,ink)=>{
      c.beginPath();c.ellipse(x,y,rx,ry,rot,0,Math.PI*2);c.fillStyle=ink;c.fill();
    };
    const label=(txt,x,y,font,ink)=>{
      c.font=font;c.textAlign="center";c.textBaseline="middle";c.fillStyle=ink;c.fillText(txt,x,y);
    };
    function bar(id){
      const col=flavors[id],width=id==="coconut"?14.6:id==="tamarind"?11.2:13.3;
      c.beginPath();c.moveTo(-2.4,14);c.lineTo(-2.5,34.1);c.quadraticCurveTo(-1.6,37.4,1.7,35.6);
      c.lineTo(2.55,32.8);c.lineTo(2.2,12);c.fillStyle="#bf8b55";c.fill();
      fill(-.8,21,1,12,"#d7ae71");
      const shape=()=>{
        c.beginPath();c.moveTo(-width,15.4);c.lineTo(-width,-16.2);
        c.bezierCurveTo(-width,-25.9,-width*.51,-29.7,.5,-29.2);
        c.bezierCurveTo(width*.72,-29.1,width,-25.4,width,-17.2);
        c.lineTo(width-.4,15.9);c.quadraticCurveTo(width-1.1,19.2,width-4.5,19);
        c.lineTo(-width+3.8,18.9);c.quadraticCurveTo(-width,18.5,-width,15.4);c.closePath();
      };
      shape();c.fillStyle=col.ice;c.fill();c.lineWidth=1.25;c.strokeStyle=col.edge;c.stroke();
      c.save();c.clip();
      c.beginPath();c.moveTo(width-3.1,-29);c.lineTo(width+1,-28);c.lineTo(width+1,20);
      c.lineTo(-width,20);c.lineTo(-width,16.6);c.lineTo(width-3.2,15);c.closePath();c.fillStyle=col.edge;c.fill();
      c.lineCap="round";
      if(id==="guava"){
        c.beginPath();c.moveTo(-17,3);c.bezierCurveTo(-6,4,5,-7,19,-3);c.moveTo(-17,7);c.bezierCurveTo(-7,9,8,-2,17,0);
        c.strokeStyle="#cd5065";c.lineWidth=2.1;c.stroke();
        for(const [x,y] of [[-4,9],[1,7],[6,4],[-7,12]])dot(x,y,.84,.48,-.4,"#f5bf8d");
      }else if(id==="coconut"){
        for(const [x,y,a] of [[-8,-15,-.7],[4,-21,.6],[7,-9,-.5],[-5,-4,.7],[3,7,-.8],[-9,12,.25]]){
          c.beginPath();c.moveTo(x-1.75,y-a);c.quadraticCurveTo(x,y+1.3,x+1.15,y+a);c.strokeStyle="#b08555";c.lineWidth=1.05;c.stroke();
        }
      }else{
        c.beginPath();c.moveTo(-1,-29);c.bezierCurveTo(7,-20,-8,-9,-1,0);
        c.bezierCurveTo(2,8,6,11,-1,20);c.strokeStyle="#92572f";c.lineWidth=5;c.stroke();
        for(const [x,y] of [[4,-21],[-5,-13],[3,-6],[-3,5],[5,11]])dot(x,y,.75,.60,.2,"#d89a5e");
      }
      c.beginPath();c.moveTo(-width+3.7,-13);c.quadraticCurveTo(-width+3.2,-21,-width+7,-24);
      c.strokeStyle=col.shine;c.lineWidth=2;c.stroke();c.restore();
    }
    function fruit(id,x,y){
      c.save();c.translate(x,y);c.rotate(-.15);
      if(id==="guava"){
        dot(2,-5.4,2.9,6,.88,"#527853");dot(0,0,10,8.5,-.1,"#83a269");dot(-.3,.8,8.5,7.1,-.1,"#efa292");
        for(const [x,y] of [[-2,1],[0,3],[2,-.2],[3.5,1.8]])dot(x,y,.7,.45,.2,"#f8dc96");
      }else if(id==="coconut"){
        c.beginPath();c.moveTo(-12,-1);c.quadraticCurveTo(-8,19,8,11);c.quadraticCurveTo(13,8,13,-1);c.fillStyle="#846345";c.fill();
        dot(.5,-.8,12.4,5.1,-.02,"#754d38");dot(.3,-1.3,10.1,4,-.02,enamel);dot(.5,-.75,6.6,2.25,-.05,"#c9b68d");
        for(const x of [-6,-.4,5]){c.beginPath();c.moveTo(x,5);c.lineTo(x+2,9);c.strokeStyle="#ad8459";c.lineWidth=.8;c.stroke();}
      }else{
        c.beginPath();c.moveTo(-13,4);c.bezierCurveTo(-18,-5,-11,-10,-7,-7);c.bezierCurveTo(-2,-9,0,-4,2,-3);
        c.bezierCurveTo(9,-5,13,2,9,6);c.bezierCurveTo(6,9,2,8,-1,5);c.bezierCurveTo(-5,7,-11,8,-13,4);
        c.fillStyle="#ad7149";c.fill();c.strokeStyle="#80563b";c.lineWidth=1;c.stroke();
        for(const [x,y] of [[-8,-4],[-2,-2],[5,.1]]){c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+3,y+1,x+1.3,y+4);c.strokeStyle="#ce915b";c.stroke();}
        c.beginPath();c.moveTo(-13,-3);c.quadraticCurveTo(-17,-6,-16,-10);c.strokeStyle="#665c3d";c.stroke();
      }
      c.restore();
    }
    fill(0,0,440,122,"#efdcb5");fill(2,2,436,118,"#f7e8c9");
    fill(6,6,428,1.3,coral);fill(6,114.7,428,1.3,coral);
    // A one-ink bell printed on the book's bound end; the fruit impressions have their own plates.
    fill(5,9,97,103,pine);fill(8,12,91,1,"#4c8074");fill(8,108,91,1,"#4c8074");
    c.beginPath();c.moveTo(40,50);c.bezierCurveTo(45,45,44,40,46,34);c.bezierCurveTo(48,26,58,26,61,33);
    c.bezierCurveTo(64,40,60,43,66,47);c.lineTo(67,49);c.quadraticCurveTo(51,55,40,52);c.closePath();c.fillStyle=mango;c.fill();
    dot(54.5,52.7,2.8,2.4,-.2,"#cc8a48");dot(52,27.5,1.7,2.4,-.1,mango);
    c.font="italic bold 15px Georgia, serif";c.fillStyle=shell;c.textAlign="center";c.textBaseline="middle";
    c.fillText("La Campana",53.5,72,84);
    label("PALETAS",53.5,91,"bold 10px Georgia, serif","#e5b16b");
    for(const [i,id] of ids.entries()){
      const left=106+i*109,cx=left+51,cy=49;
      if(i)for(let y=14;y<108;y+=8)fill(left-1,y,.8,3.5,"#c3ae8d");
      dot(cx-1,cy+10,29,24.5,0,["#edc3a0","#e6d6aa","#e9c49e"][i]);
      c.save();c.translate(cx-3,cy);c.rotate([-.22,.13,-.13][i]);bar(id);c.restore();
      fruit(id,cx+18,cy+18);
      label(id.toUpperCase(),cx,92,"bold 12px Georgia, serif",pine);
      if(stamps&(1<<i)){
        dot(cx,105,3.5,3.6,.2,"#cfac78");dot(cx-.25,104.1,3.4,3.5,.2,"#55584c");
        dot(cx+.05,103.7,2.65,2.65,.2,"#313f3c");
      }
    }
    c.restore();return true;
  }
  function curbWorld(view,model,stop,marked){
    const id=marked?"campana/next-bay":"campana/loading-bay";
    model(id,g=>{
      const paint=marked?"#f4c987":"#ab9b83",cream=marked?"#f9e8be":"#c8bda1";
      for(const end of [-1,1]){
        g.box(.70,.005,end*3.45,.68,.012,.094,paint);
        g.box(1.01,.005,end*3.15,.080,.012,.64,paint);
      }
      for(let i=0;i<3;i++)g.box(1.69,.008,-1.1+i*.26,.39,.012,.10,i===1?"#bc6a50":cream);
      if(marked){g.box(.04,.008,2.05,.10,.012,.58,cream);
        g.tri([-.18,.016,2.17],[0,.016,2.53],[.18,.016,2.17],cream);}
    });
    view.draw(id,stop.x,.054,stop.z);
  }
  function curbMap(c,px,py,s,stop,marked){
    c.save();c.translate(px(stop.x),py(stop.z));c.scale(s,s);
    c.strokeStyle=marked?"#f4c987":"#ab9b83";c.lineWidth=.11;
    for(const end of [-1,1]){c.beginPath();c.moveTo(.36,end*3.45);c.lineTo(1.01,end*3.45);c.lineTo(1.01,end*2.82);c.stroke();}
    for(let i=0;i<3;i++){c.fillStyle=i===1?"#bc6a50":"#e7cda2";c.fillRect(1.5,.96-i*.26,.39,.10);}
    if(marked){c.fillStyle="#f9e8be";c.fillRect(-.05,-2.2,.10,.45);c.beginPath();c.moveTo(-.22,-2.13);c.lineTo(0,-2.55);c.lineTo(.22,-2.13);c.fill();}
    c.restore();
  }
  window.BayCampanaArt={world,overhead,treatWorld,treatMap,freezerCard,curbWorld,curbMap};
})();
