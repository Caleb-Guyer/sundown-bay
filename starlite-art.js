/* The Starlite's portable speaker boxes are a little older than the projection booth. */
(() => {
  "use strict";
  const bays=[-3.8,0,3.8],ground=.07;
  const sand="#bdae91",cream="#ead6a6",turquoise="#5d928e",teal="#386a69",petrol="#304e53";
  const red="#b96354",coral="#dc8870",steel="#89978e",iron="#485d60",tar="#505b59",white="#e0d4b5";
  const screenWidth=8.96,screenHeight=5.04,screenY=3.60,screenZ=9.89;
  const globe="#ffdfab",tube="#fc9390",lamp="#ffe1a4";

  // The sign painter joined the small letters and brought the final stroke under the whole name.
  // Coordinates are in the enamel panel's local sign face, with the capitals a little taller.
  const signature=[
    [[-.83,.21],[-.97,.27],[-1.14,.22],[-1.21,.12],[-1.18,.04],[-1.09,.00],[-.99,-.04],[-.96,-.10],[-1.01,-.19],[-1.14,-.23],[-1.27,-.21],[-1.32,-.16]],
    [[-1.05,-.19],[-.92,-.10],[-.77,.22],[-.88,-.09],[-.87,-.15],[-.81,-.17],[-.71,-.10]],
    [[-.94,.03],[-.67,.06]],
    [[-.69,-.03],[-.75,-.02],[-.82,-.07],[-.83,-.14],[-.79,-.17],[-.73,-.15],[-.65,-.02],[-.70,-.12],[-.69,-.16],[-.65,-.16],[-.53,-.07]],
    [[-.55,-.14],[-.47,.02],[-.48,.04],[-.51,.02],[-.49,-.02],[-.40,.01],[-.37,-.01],[-.41,-.08],[-.40,-.12],[-.35,-.13],[-.26,-.06]],
    [[-.27,-.06],[-.20,.07],[-.12,.24],[-.13,.27],[-.18,.24],[-.26,.11],[-.32,-.06],[-.32,-.13],[-.27,-.15],[-.19,-.11],[-.10,-.03]],
    [[-.10,-.01],[-.15,-.11],[-.14,-.14],[-.10,-.14],[.03,-.05]],
    [[-.054,.10],[-.036,.13]],
    [[-.01,-.09],[.12,.20],[.01,-.07],[.01,-.13],[.05,-.14],[.13,-.11],[.20,-.04]],
    [[-.04,.035],[.18,.065]],
    [[.20,-.06],[.28,-.03],[.30,.01],[.27,.04],[.21,.02],[.15,-.05],[.16,-.11],[.22,-.14],[.31,-.12],[.40,-.07],[.50,.03]],
    [[.47,-.12],[.36,-.20],[.15,-.235],[-.28,-.24],[-.73,-.27],[-1.10,-.34]]
  ];
  const capitals={
    A:"04 20 44|13 33",E:"40 00 04 44|02 32",H:"00 04|40 44|02 42",M:"04 00 22 40 44",
    O:"10 30 41 43 34 14 03 01 10",R:"04 00 30 41 32 02|22 44",T:"00 40|20 24"
  };
  const strokes=Object.fromEntries(Object.entries(capitals).map(([k,s])=>[k,s.split("|").map(row=>row.split(" ").map(p=>[Number(p[0])*.25,1-Number(p[1])*.25]))]));
  function poly(g,points,color){
    for(let i=2;i<points.length;i++)g.tri(points[0],points[i-1],points[i],color);
  }
  function lineFace(g,f,x,y,xx,yy,width,color){
    const dx=xx-x,dy=yy-y,s=width/(Math.hypot(dx,dy)*2||1),u=-dy*s,v=dx*s;
    g.quad(f(x+u,y+v),f(xx+u,yy+v),f(xx-u,yy-v),f(x-u,y-v),color);
  }
  function type(g,f,word,cx,y,h,color){
    const w=h*.63,step=h*.85,start=cx-(step*(word.length-1)+w)*.5;
    for(let i=0;i<word.length;i++)for(const path of strokes[word[i]]||[])for(let j=1;j<path.length;j++){
      const [x,z]=path[j-1],[xx,zz]=path[j],off=start+step*i;
      lineFace(g,f,off+x*w,y+z*h,off+xx*w,y+zz*h,h*.11,color);
    }
  }
  function star(g,f,x,y,s,col){
    const a=f(x,y);
    for(let i=0;i<8;i++){
      const at=j=>{const angle=j*Math.PI/4,r=j%2?.14:j%4?.70:1;return f(x+s*r*Math.cos(angle),y+s*r*Math.sin(angle));};
      g.tri(a,at(i),at(i+1),col);
    }
  }
  const mastFace=(z)=>(x,y)=>[x,y,z];
  const signX=-8.06,signZ=-4.06;
  function nameboard(g,on){
    const sign=mastFace(signZ-.095),ink=mastFace(signZ-.105);
    if(!on){
      for(const x of [signX-.81,signX+.81]){
        g.box(x,3.22,signZ,.075,1.05,.10,iron);
        g.pole([x,3.49,signZ],[x,2.82,signZ+.51],.035,steel,5);
      }
      const silhouette=[[-1.62,-.34],[-1.63,.09],[-1.17,.39],[-.68,.47],[1.55,.27],[1.61,-.03],[1.23,-.37],[-.67,-.49]];
      const A=signZ-.065,B=signZ+.10;
      for(const z of [A,B])poly(g,silhouette.map(([x,y])=>[signX+x,3.96+y,z]),cream);
      for(let i=0;i<silhouette.length;i++){
        const [x,y]=silhouette[i],[xx,yy]=silhouette[(i+1)%silhouette.length];
        g.quad([signX+x,3.96+y,A],[signX+xx,3.96+yy,A],[signX+xx,3.96+yy,B],[signX+x,3.96+y,B],red);
      }
      poly(g,silhouette.map(([x,y])=>sign(signX+x*.965,3.96+y*.88)),teal);
      g.box(signX,3.27,signZ-.015,2.55,.37,.115,petrol);
      g.box(signX,3.27,signZ-.081,2.48,.31,.014,cream);
      type(g,mastFace(signZ-.091),"MOTOR THEATRE",signX,3.205,.142,petrol);
    }
    const signatureFace=(x,y)=>ink(signX+.33+x*1.42,3.96+y*1.28);
    for(const path of signature)for(let i=1;i<path.length;i++)lineFace(g,signatureFace,...path[i-1],...path[i],.027,on?globe:"#f4db9b");
    star(g,ink,signX+1.08,4.12,.204,on?tube:coral);
    star(g,ink,signX+1.30,3.96,.081,on?lamp:cream);
    if(on)for(let i=0;i<7;i++)g.box(signX-1.03+i*.34,3.455,signZ-.095,.039,.029,.024,lamp);
  }
  function booth(g){
    const x=-8,z=-3;
    g.box(x,.16,z,3.13,.32,2.63,"#aaa58f");
    g.box(x,1.41,z,3.03,2.44,2.49,"#a8bba8");
    g.box(x,.40,z,3.07,.43,2.53,teal);
    for(const h of [.61,.69,2.38])g.box(x,h,z,3.07,.029,2.53,h===.69?white:turquoise);
    g.box(x,2.68,z,3.39,.105,2.81,cream);
    g.box(x,2.74,z,3.36,.063,2.78,red);
    // Window into the running projector. The two reels and the lamp nose have distinct silhouettes.
    const front=z+1.249;
    g.box(x,1.78,front,1.76,1.03,.065,cream);
    g.box(x,1.79,front+.039,1.57,.84,.026,"#2c4042");
    const f=(u,h,dep)=>[x+u,h,front+dep];
    for(const [u,h] of [[-.27,1.96],[.17,1.98]]){
      g.pole(f(u,h,.060),f(u,h,.085),.187,"#b6ae83",14);
      g.pole(f(u,h,.086),f(u,h,.096),.144,iron,12);
      for(let j=0;j<3;j++){const a=j*Math.PI*2/3;g.pole(f(u,h,.105),f(u+.12*Math.cos(a),h+.12*Math.sin(a),.106),.017,"#c6b98c",4);}
    }
    g.box(x-.04,1.66,front+.084,.57,.32,.044,petrol);
    g.box(x+.28,1.64,front+.104,.16,.13,.052,steel);g.box(x-.07,1.48,front+.08,.70,.065,.08,iron);
    g.pole(f(.35,1.64,.11),f(.50,1.67,.17),.084,"#aabdc0",8);
    g.box(x,1.24,front+.076,1.93,.065,.19,"#968f7b");
    // A screen door, louvered motor vent and a counter hatch face the entrance.
    const back=z-1.25;
    g.box(x-.64,1.18,back-.01,.91,2.06,.05,cream);g.box(x-.64,1.18,back-.04,.79,1.94,.027,teal);
    g.box(x-.64,1.54,back-.06,.60,.80,.018,"#455e60");
    for(let k=0;k<9;k++)g.box(x-.64,1.19+k*.083,back-.072,.57,.012,.01,"#78918c");
    g.box(x-.36,1.06,back-.081,.06,.12,.031,cream);
    g.box(x+.72,1.02,back-.028,.60,.47,.055,petrol);
    for(let k=0;k<6;k++)g.box(x+.72,.85+k*.067,back-.064,.53,.033,.030,steel);
    const side=x+1.52;
    g.box(side,1.71,z, .065,1.04,1.44,cream);g.box(side+.037,1.71,z,.02,.86,1.28,"#455c60");
    g.box(side+.082,1.18,z,.19,.07,1.60,red);g.box(side+.08,2.26,z,.19,.07,1.62,red);
    g.box(side+.06,1.71,z+.10,.028,.88,.045,cream);
    g.box(x-.87,2.88,z+.49,.57,.22,.41,"#a4aa95");
    nameboard(g,false);
  }
  function screenBack(g){
    const faceZ=10.03;
    for(const u of [-3.63,0,3.63]){
      g.box(u,.135,10.26,.58,.27,.74,"#a4a18f");
      g.box(u,3.17,10.19,.13,6.12,.19,iron);
      g.pole([u,.22,10.57],[u,4.50,10.21],.047,steel,6);
    }
    g.box(0,3.60,faceZ,9.27,5.34,.23,iron);
    g.box(0,3.60,9.907,9.12,5.21,.015,"#d8d2b8");
    // Narrow seams and cross-braces make the blank metal roadside of the screen legible from town.
    g.box(0,3.60,10.16,9.06,5.06,.022,"#8b9c95");
    for(let u=-3.90;u<=4;u+=.65)g.box(u,3.60,10.185,.027,5.00,.036,"#a7b3a6");
    for(const h of [1.14,3.46,6.06])g.box(0,h,10.215,9.17,.082,.075,iron);
    for(const x of [-3.6,0]){
      g.pole([x,1.20,10.265],[x+3.60,5.99,10.265],.043,steel,5);
      g.pole([x,5.99,10.265],[x+3.60,1.20,10.265],.043,steel,5);
    }
    for(const side of [-1,1])g.box(side*4.588,3.63,faceZ,.061,5.33,.255,turquoise);
    g.box(0,6.24,faceZ,9.40,.086,.29,turquoise);
  }
  function printMesh(g){
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])
      g.vertices.push((u-.5)*screenWidth,screenY+(.5-v)*screenHeight,screenZ,u,v,0);
  }
  function speaker(g,x){
    const z=.20;
    g.box(x,.079,z,.30,.158,.28,"#ada58a");
    g.cyl(x,.609,z,.046,.059,1.06,7,steel);
    g.cyl(x,1.136,z,.064,.064,.041,8,cream);
    g.box(x+.071,1.069,z,.195,.052,.074,iron);
  }
  function handset(g,x){
    const z=.20;
    g.box(x+.126,.961,z,.169,.240,.173,petrol);
    g.box(x+.129,.957,z-.092,.151,.203,.016,"#a4aca0");
    for(let i=0;i<4;i++)g.box(x+.127,.905+i*.030,z-.104,.111,.011,.012,iron);
    g.box(x+.161,1.026,z-.105,.023,.018,.014,red);
    const cable=[[x+.135,.837,z+.012],[x+.14,.64,z+.095],[x+.098,.55,z+.11],[x+.047,.58,z+.076],[x+.042,.78,z+.008]];
    for(let i=1;i<cable.length;i++)g.pole(cable[i-1],cable[i],.009,iron,4);
  }
  function lot(g){
    const slab=(x,y,z,w,d,c)=>g.quad([x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],c);
    slab(-1.65,.012,2.36,16.35,16.60,tar);
    for(const x of [-5.70,-1.90,1.90,5.70]){
      for(const [z,d] of [[-2.50,1.03],[-.80,1.98],[1.42,2.30]])slab(x,.024,z,.067,d,"#b9ac83");
      slab(x,.022,2.66,.49,.074,"#c8bb94");
    }
    for(const [i,x] of bays.entries()){
      // Wheel stops leave the ends open for drivers to swing into the row.
      for(const off of [-.74,.74]){
        g.box(x+off,.078,2.60,.72,.134,.22,"#a49a80");
        g.box(x+off,.151,2.60,.65,.014,.17,"#d8bc80");
      }
      slab(x,.028,-3.28,.58,.52,"#69736a");
      for(let k=0;k<=i;k++)slab(x-.086*i+.172*k,.032,-3.28,.070,.255,cream);
      speaker(g,x-1.35);
    }
    // Repaired seams along the entry apron.
    for(const [x,z,xx,zz] of [[-4,-4.74,-1.6,-4.29],[-1.6,-4.29,.22,-4.43],[.22,-4.43,1.82,-4.08],[3.31,5.26,4.26,4.68]]){
      lineFace(g,(u,v)=>[u,.026,v],x,z,xx,zz,.029,"#414d4c");
    }
    booth(g);screenBack(g);
  }
  function liveLights(g){
    nameboard(g,true);
    g.box(-7.55,1.67,-1.577,.106,.086,.035,globe);
    for(const x of bays)g.box(x-1.35,1.16,.20,.073,.014,.054,lamp);
  }
  function world(list,model,site,t,lit,visit){
    model("starlite-lot",lot);model("starlite-film",printMesh);
    list.push(["starlite-lot",site.x,site.y??ground,site.z,site.yaw||0]);
    model("starlite-handset",g=>handset(g,0));
    for(const [i,x] of bays.entries()){
      if(visit?.bay===i+1)continue;
      const p=BayDriving.world(site,x-1.35,0);
      list.push(["starlite-handset",p.x,site.y??ground,p.z,site.yaw||0]);
    }
    if(lit){model("starlite-lamps",liveLights);list.push(["starlite-lamps",site.x,site.y??ground,site.z,site.yaw||0,0,0,.70]);}
  }
  function endpoints(site,visit){
    const v=visit.v,s=bayCarLayout(v.kind),a=BayDriving.world(site,bays[visit.bay-1]-1.35,.2),b=BayDriving.world(v,-s.track-.045,s.seatZ+.18);
    return {a,b,y:s.glass[4]-.07};
  }
  let lastVisit=null,lastPose=null;
  function clipped(view,list,site,visit){
    const {v}=visit;
    if(lastVisit!==visit||!lastPose||Math.hypot(v.x-lastPose.x,v.z-lastPose.z)>.03||Math.abs(v.yaw-lastPose.yaw)>.025){
      const {a,b,y}=endpoints(site,visit),g=new BayMesh(),from=[a.x,site.y+.99,a.z],to=[b.x,y,b.z];
      let prev=from;
      for(let i=1;i<=8;i++){const u=i/8,next=from.map((n,j)=>n+(to[j]-n)*u-(j===1?.35*Math.sin(u*Math.PI):0));g.pole(prev,next,.012,iron,5);prev=next;}
      g.box(b.x,y+.055,b.z,.13,.23,.17,petrol);
      for(let i=0;i<4;i++)g.box(b.x,y+i*.03,b.z-.088,.099,.011,.012,cream);
      const name="starlite-clipped-speaker",data=view.cpu.get(name);
      if(data){data.set(g.vertices);view.updateAnimated(name);}else view.add(name,g,true);
      lastVisit=visit;lastPose={x:v.x,z:v.z,yaw:v.yaw};
    }
    list.push(["starlite-clipped-speaker",0,0,0,0]);
  }
  function screen(view,site,canvas,revision){
    if(canvas?.width&&view.gl&&!view.lost)view.drawPrint("starlite-film",canvas,revision,site.x,site.y??ground,site.z,site.yaw||0);
  }
  function block(site,x,z,w,d,top){
    const a=site.yaw||0,c=Math.cos(a),s=Math.sin(a);
    return {x:site.x+x*c+z*s,z:site.z-x*s+z*c,w:Math.abs(c)*w+Math.abs(s)*d,d:Math.abs(s)*w+Math.abs(c)*d,bottom:0,top:top+(site.y??ground),streetProp:true};
  }
  function blocks(site){
    return [block(site,-8,-3,3.12,2.64,2.80),block(site,0,10.15,9.30,.43,6.29),
      ...[-3.63,0,3.63].map(x=>block(site,x,10.45,.58,.57,.70)),...bays.map(x=>block(site,x-1.35,.20,.29,.29,1.17))];
  }
  function paintLot(c,site,lit,visit){
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    const polygon=(points,color)=>{c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fillStyle=color;c.fill();};
    const line=(points,width,color)=>{c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.strokeStyle=color;c.lineWidth=width;c.stroke();};
    rect(-9.825,-10.66,16.35,16.60,tar);
    for(const x of [-5.70,-1.90,1.90,5.70]){
      for(const [y,d] of [[1.985,1.03],[-.19,1.98],[-2.57,2.30]])rect(x-.034,y,.068,d,"#bcaf8b");
      rect(x-.245,-2.70,.49,.08,"#cec19a");
    }
    for(const [i,x] of bays.entries()){
      for(const off of [-.74,.74]){rect(x+off-.36,-2.71,.72,.25,"#998c75");rect(x+off-.33,-2.70,.66,.14,"#d6b980");}
      rect(x-.29,3.02,.58,.52,"#687269");
      for(let j=0;j<=i;j++)rect(x-.086*i+j*.172-.035,3.15,.07,.255,cream);
      const post=x-1.35;
      rect(post-.15,-.34,.30,.28,"#b3a997");rect(post-.07,-.41,.15,.21,steel);
      if(visit?.bay!==i+1){rect(post+.01,-.42,.21,.21,petrol);rect(post+.032,-.23,.16,.030,lit?globe:white);}
      else{const {b}=endpoints(site,visit),q=BayDriving.local(site,b.x,b.z);line([[post,-.20],[(post+q.x)*.5,-q.z+.13],[q.x,-q.z]],.05,iron);rect(q.x-.07,-q.z-.11,.14,.22,petrol);}
    }
    rect(-9.47,1.76,3.28,2.86,"#444c49");rect(-9.70,1.54,3.40,2.86,red);
    rect(-9.63,1.61,3.25,2.70,"#d3c9a6");rect(-9.16,2.34,.64,.43,"#99a495");
    rect(-8.87,1.57,1.73,.13,petrol);rect(-8.69,1.58,1.32,.057,lit?globe:"#8ca79c");
    const sign=[[signX-1.65,3.68],[signX-.89,3.26],[signX+1.52,3.42],[signX+1.66,3.75],[signX+1.23,4.12],[signX-1.58,4.22]];
    polygon(sign,cream);c.save();c.translate(signX,3.75);c.scale(.96,.83);polygon(sign.map(([x,y])=>[x-signX,y-3.75]),teal);
    for(const path of signature)line(path.map(([x,y])=>[.31+1.40*x,-y*1.26]),.047,lit?globe:cream);
    line([[.78,-.17],[1.26,-.17]],.035,coral);line([[1.03,-.40],[1.03,.06]],.035,coral);c.restore();
    for(const x of [-3.63,0,3.63])rect(x-.28,-10.68,.56,.78,"#788981");
  }
  const lots=new Map();
  function overhead(c,px,py,scale,site,t,lit,canvas,visit,atProjector,lowDetail=false,deferScreen=false){
    c.save();c.translate(px(site.x),py(site.z));c.rotate(site.yaw||0);c.scale(scale,scale);
    if(lowDetail&&!visit&&scale<=16){
      let lot=lots.get(lit);
      if(!lot){lot=BayMapSheet(-10,-11,17,17.25,18,ink=>paintLot(ink,site,lit,null));lots.set(lit,lot);}
      lot(c);
    }else paintLot(c,site,lit,visit);
    if(!deferScreen)screenFace(c,canvas,visit||atProjector?5.08:2.85);
    c.restore();
  }
  function screenFace(c,canvas,height){
    // Tip the screen's top away from the row. The projected image stays upright from the car bays.
    const left=-4.52,top=-10.09;
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    c.beginPath();c.moveTo(left-.19,top-.16);c.lineTo(-left+.19,top-.16);c.lineTo(-left+.30,top+height+.17);
    c.lineTo(left-.09,top+height+.17);c.closePath();c.fillStyle=iron;c.fill();
    rect(left-.09,top-.08,9.20,height+.18,white);
    if(canvas?.width)c.drawImage(canvas,left,top,9.04,height);
    else rect(left,top,9.04,height,"#b4baaa");
    rect(left-.14,top-.125,9.30,.080,turquoise);
  }
  function focusedScreen(c,px,py,scale,site,canvas){
    c.save();c.translate(px(site.x),py(site.z));c.rotate(site.yaw||0);c.scale(scale,scale);
    screenFace(c,canvas,5.08);
    c.restore();
  }
  window.BayStarliteArt=Object.freeze({world,screen,overhead,focusedScreen,blocks,clipped});
})();
