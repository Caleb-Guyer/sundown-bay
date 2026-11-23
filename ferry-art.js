/* M/V Paloma. Hull axes follow the runabouts, with +Z forward and port to -X. */
(() => {
  "use strict";
  const tau=Math.PI*2;
  const hullGreen="#306a68",deep="#264b54",cream="#e9ddbe",light="#f3e7c9",amber="#dea04c",
    trim="#547d75",rubber="#35474a",deck="#a59176",wood="#aa7859",brass="#c5a264",
    enamel="#3e6f6e",glass="#507783",metal="#a4b1a5",canvas="#d7bb8c",ringOrange="#bf6449";
  // Quarter-breadths keep the afterdeck parallel through the boarding opening.
  // Each row is station, half beam, deck level and keel level in metres.
  const hull=[[-9,2.15,.94,-.24],[-8.46,2.75,.94,-.53],[-7.18,3.02,.94,-.73],
    [-5.4,3.12,.94,-.84],[-4.26,3.15,.94,-.86],[-1.76,3.15,.94,-.88],[1.7,3.18,.94,-.88],
    [3.7,3.12,.98,-.80],[5.3,2.96,1.085,-.66],[6.72,2.54,1.20,-.48],
    [7.8,1.8,1.32,-.22],[8.56,.92,1.43,.15],[9,.045,1.52,.62]];
  const letters={
    A:["0110","1001","1111","1001","1001"], L:["100","100","100","100","111"],
    M:["10001","11011","10101","10001","10001"], O:["0110","1001","1001","1001","0110"],
    P:["1110","1001","1110","1000","1000"], V:["10001","10001","01010","01010","00100"],
    "/":["001","001","010","100","100"]," ":["0","0","0","0","0"]
  };
  function lettering(text,size,paint){
    const glyphs=Array.from(text,k=>letters[k]);
    let x=-size*.5*glyphs.reduce((sum,g)=>sum+g[0].length+1,-1);
    for(const glyph of glyphs){
      for(let row=0;row<5;row++)for(const mark of glyph[row].matchAll(/1+/g))
        paint(x+mark.index*size,(2.5-row)*size,mark[0].length*size,size);
      x+=(glyph[0].length+1)*size;
    }
  }
  function putName(g,text,size,plane,color){
    lettering(text,size,(x,y,w,h)=>g.quad(plane(x,y),plane(x+w,y),plane(x+w,y-h),plane(x,y-h),color));
  }
  // The same profile is sewn into the awning and painted below the bridge.
  const wing=[[-.91,-.15],[-.24,.09],[-.61,.48],[-.08,.27],[.32,.04],[.57,.17],[.72,.145],[.89,.067],[.68,.059],[.49,-.11],[.03,-.24],[-.41,-.17],[-.77,-.28]];
  function wingBadge(g,plane,color){
    const root=plane(.05,-.04);
    for(let i=0;i<wing.length;i++)g.tri(root,plane(...wing[i]),plane(...wing[(i+1)%wing.length]),color);
  }
  function plankHull(g){
    const colors=["#3b5354",deep,hullGreen,amber,cream,rubber,trim];
    const point=(r,s,i)=>{
      const [z,w,h,k]=r;
      const widths=[0,.64,.83,.931,.942,.989,1,1];
      const heights=[k,k+.18,Math.max(.01,k+.26),h-.61,h-.53,h-.17,h-.068,h];
      return [s*w*widths[i],heights[i],z];
    };
    for(let i=1;i<hull.length;i++){
      const a=hull[i-1],b=hull[i];
      for(const s of [-1,1]){
        for(let k=0;k<colors.length;k++)g.quad(point(a,s,k),point(b,s,k),point(b,s,k+1),point(a,s,k+1),colors[k],s<0?.91:1);
        const edge=p=>[s*Math.max(0,p[1]-.11),p[2],p[0]];
        g.quad(point(a,s,7),point(b,s,7),edge(b),edge(a),cream);
        g.quad([0,a[2],a[0]],[0,b[2],b[0]],edge(b),edge(a),deck,i%2===0?.992:1);
      }
    }
    const stern=hull[0];
    for(let k=0;k<colors.length;k++)
      g.quad(point(stern,-1,k),point(stern,1,k),point(stern,1,k+1),point(stern,-1,k+1),colors[k],.89);
    // Protect the transom name at the level where the stern rides out of the wake.
    g.box(0,.61,-9.009,2.24,.30,.02,enamel);
    putName(g,"PALOMA",.047,(x,y)=>[x,.61+y,-9.025],light);
    for(const s of [-1,1])g.box(s*2.01,.717,-9.021,.15,.075,.025,amber);
    // The black/yellow sill is flush with the nonslip port deck.
    g.quad([-3.157,.945,-4.08],[-2.82,.945,-4.08],[-2.82,.945,-1.92],[-3.157,.945,-1.92],amber);
    for(let z=-4.03;z< -2.0;z+=.36)
      g.quad([-3.148,.95,z+.03],[-2.83,.95,z+.17],[-2.83,.95,z+.28],[-3.148,.95,z+.14],rubber);
    for(const z of [-3.55,-3.00,-2.45])
      g.quad([-2.72,.945,z-.019],[-2.12,.945,z-.019],[-2.12,.945,z+.019],[-2.72,.945,z+.019],"#cbc0a4");
  }
  function housing(g,x,w,back,front,bottom,top,topInset){
    // Flat jambs and a lightly raked windshield share the same panel coordinates.
    const plane=(face,u,v,n=0)=>{
      const half=w*.5-.078*v,z1=front-topInset*v,z0=back+.055*v;
      const y=bottom+(top-bottom)*v;
      if(face==="stern"||face==="bow")return [x+(2*u-1)*half,y,face==="stern"?z0-n:z1+n];
      return [x+(face==="port"?-1:1)*(half+n),y,z0+(z1-z0)*u];
    };
    function panel(face,l,b,r,t,color,n=.009){
      g.quad(plane(face,l,b,n),plane(face,r,b,n),plane(face,r,t,n),plane(face,l,t,n),color);
    }
    for(const face of ["port","starboard","bow","stern"]){
      panel(face,0,0,1,1,cream,0);
      panel(face,0,0,1,.18,enamel);
      panel(face,0,.18,1,.207,amber);
    }
    return {plane,panel};
  }
  function windowBay(g,h,face,l,r,b=.40,t=.89,bright=false){
    h.panel(face,l,b,r,t,deep);
    const dx=(r-l)*.054,dy=(t-b)*.066;
    h.panel(face,l+dx,b+dy,r-dx,t-dy,bright?"#6c9197":glass,.017);
    const pt=(x,y)=>h.plane(face,x,y,.024);
    const left=l+dx*1.2,width=r-l;
    g.quad(pt(left,b+(t-b)*.69),pt(left+width*.28,b+(t-b)*.69),pt(left+width*.51,t-dy*1.08),pt(left+width*.23,t-dy*1.08),"#84a3a4");
  }
  function railRun(g,s,posts){
    for(let i=0;i<posts.length;i++){
      const [x,z,y]=posts[i],base=[s*x,y,z],top=[s*x,y+.78,z];
      g.pole(base,top,.034,cream,5);
      if(i){
        const [px,pz,py]=posts[i-1];
        g.pole([s*px,py+.75,pz],top,.038,cream,5);
        g.pole([s*px,py+.39,pz],[s*x,y+.39,z],.017,metal,4);
      }
    }
  }
  function buoyRing(g,side,x,y,z){
    const at=i=>[x,y+.315*Math.sin(i*tau/12),z+.315*Math.cos(i*tau/12)];
    for(let i=0;i<12;i++)g.pole(at(i),at(i+1),.071,i%3===0?light:ringOrange,5);
    for(const dz of [-.24,.24])g.box(x-side*.07,y-.18,z+dz,.10,.075,.07,metal);
  }
  function cleat(g,x,y,z){
    g.box(x,y+.077,z,.19,.15,.20,deep);
    g.box(x,y+.182,z,.21,.068,.39,metal);
  }
  function landing(g){
    const stern=[[2.22,-8.73,.94],[2.72,-8.17,.94],[2.89,-6.65,.94],[3.0,-5.35,.94],[3.036,-4.16,.94]];
    const bow=[[3.036,-1.84,.94],[3.05,-.10,.94],[3.05,1.7,.94],[2.99,3.72,.98],[2.82,5.28,1.08],[2.4,6.65,1.20],[1.72,7.69,1.31],[.8,8.55,1.43],[.10,8.83,1.46]];
    railRun(g,-1,stern);railRun(g,-1,bow);
    railRun(g,1,stern.concat([[3.04,-3,.94]],bow));
    const across=[-2.17,-1.07,0,1.07,2.17];
    for(let i=0;i<across.length;i++){
      const x=across[i];
      g.pole([x,.94,-8.74],[x,1.72,-8.74],.032,cream,5);
      if(i)for(const h of [1.33,1.69])g.pole([across[i-1],h,-8.74],[x,h,-8.74],h>1.5?.035:.017,h>1.5?cream:metal,5);
    }
    for(const z of [-4.16,-1.84]){
      g.box(-3.049,1.68,z,.13,.28,.13,trim);
      g.box(-3.049,1.84,z,.146,.113,.146,amber);
      g.box(-3.049,1.91,z,.167,.044,.167,deep);
    }
    for(const [s,x,z] of [[-1,2.80,-7.90],[-1,3.09,-5.05],[-1,3.10,-.95],[-1,2.98,4.46],[1,2.80,-7.90],[1,3.1,-3.4],[1,2.99,4.46]]){
      g.pole([s*(x-.03),1.36,z-.08],[s*(x+.11),.763,z+.014],.023,"#997f61",4);
      const dx=s*(x+.11);g.cyl(dx,.48,z,.129,.139,.53,8,rubber);
      g.cyl(dx,.78,z,.075,.129,.073,8,metal);
      g.cyl(dx,.194,z,.137,.091,.075,8,rubber);
    }
    buoyRing(g,-1,-3.027,1.45,-5.67);buoyRing(g,1,3.08,1.46,-1.86);
    for(const [x,z,y] of [[-2.54,-8.05,.94],[2.54,-8.05,.94],[-1.74,6.75,1.21],[1.74,6.75,1.21]])cleat(g,x,y,z);
  }
  function capRoof(g,cx,w,back,front,y,h,color){
    const hw=w*.5;
    const corners=[[-hw+.21,back],[hw-.21,back],[hw,back+.18],[hw,front-.24],[hw-.25,front],[-hw+.25,front],[-hw,front-.24],[-hw,back+.18]];
    for(let i=0;i<corners.length;i++){
      const a=corners[i],b=corners[(i+1)%corners.length],A=[cx+a[0],y+h,a[1]],B=[cx+b[0],y+h,b[1]];
      g.quad([cx+a[0],y,a[1]],[cx+b[0],y,b[1]],B,A,enamel,i%3===0?.87:1);
      g.tri([cx,y+h,(front+back)*.5],A,B,color);
    }
  }
  function cabins(g){
    const salon=housing(g,0,4.17,-.79,4.58,.94,2.84,.27);
    for(const [face,dir] of [["port",-1],["starboard",1]]){
      for(let i=0;i<5;i++)windowBay(g,salon,face,.038+i*.19,.201+i*.19,.456,.90,i%2===1);
      salon.panel(face,.045,.226,.963,.414,enamel);
      putName(g,"PALOMA",.061,(x,y)=>salon.plane(face,.5+dir*x/5.18,.321+y/1.90,.017),light);
      wingBadge(g,(x,y)=>salon.plane(face,dir<0?.815+.062*x:.185-.062*x,.31+y*.11,.017),amber);
    }
    salon.panel("stern",.20,0,.47,.86,deep);
    salon.panel("stern",.218,.014,.451,.84,"#b9a489",.018);
    windowBay(g,salon,"stern",.236,.437,.42,.77,true);
    salon.panel("stern",.248,.13,.427,.31,trim,.021);
    salon.panel("stern",.402,.359,.437,.386,metal,.025);
    windowBay(g,salon,"stern",.56,.899,.43,.83);
    windowBay(g,salon,"bow",.08,.46,.439,.89);
    windowBay(g,salon,"bow",.54,.92,.439,.89,true);
    capRoof(g,0,4.50,-1.05,4.70,2.795,.154,light);

    const bridge=housing(g,0,3.24,1.25,4.71,2.93,4.18,.35);
    for(const face of ["port","starboard"]){
      windowBay(g,bridge,face,.05,.43,.30,.908,true);
      windowBay(g,bridge,face,.478,.95,.30,.908);
    }
    for(const face of ["bow","stern"]){
      for(let i=0;i<3;i++)windowBay(g,bridge,face,.048+i*.311,.335+i*.311,.299,.906,i===1);
    }
    // Bridge glass catches enough light to show the wheel and skipper in silhouette.
    const at=(u,v)=>bridge.plane("bow",u,v,.030);
    g.quad(at(.187,.51),at(.235,.51),at(.241,.60),at(.178,.60),"#405d65");
    g.quad(at(.177,.60),at(.241,.60),at(.238,.622),at(.163,.622),deep);
    g.quad(at(.119,.345),at(.286,.345),at(.245,.497),at(.169,.497),"#46636a");
    for(const u of [.10,.41,.72])g.pole(at(u,.337),at(u+.16,.572),.011,deep,4);
    capRoof(g,0,3.65,1.01,4.80,4.112,.161,light);
    g.box(0,4.157,4.799,2.10,.193,.046,enamel);
    putName(g,"M/V PALOMA",.028,(x,y)=>[-x,4.16+y,4.831],light);
    // A single raked working funnel, black cap, cream band and six louver slots.
    g.box(.61,3.53,.05,.62,1.17,.81,enamel);
    g.box(.61,3.91,.05,.625,.19,.814,amber);
    g.box(.61,4.104,.05,.633,.20,.818,deep);
    g.box(.61,4.222,.05,.695,.060,.86,rubber);
    for(let i=0;i<3;i++)for(const s of [-1,1])
      g.box(.61+s*.318,3.38+i*.108,.03,.014,.048,.51,deep);
    g.box(-.93,3.038,-.07,.74,.163,.98,trim);
    for(let z=-.45;z<.35;z+=.16)g.box(-.93,3.125,z,.57,.022,.057,metal);
    const mast=[-.39,4.28,2.14],cap=[-.39,5.67,2.11];
    g.pole(mast,cap,.042,enamel,6);g.cyl(cap[0],5.71,cap[2],.064,.085,.088,7,amber);
    g.pole([-.95,5.19,2.13],[.18,5.19,2.13],.029,cream,5);
    g.quad([-.39,5.56,2.13],[-.390,5.21,2.13],[-.303,5.247,1.47],[-.29,5.491,1.42],enamel);
    g.tri([-.393,5.56,2.128],[-.393,5.21,2.128],[-.338,5.378,1.79],cream);
    for(const side of [-1,1]){
      g.box(side*1.65,4.248,3.96,.23,.125,.32,deep);
      g.box(side*1.65,4.327,3.96,.204,.067,.27,side<0?"#d97660":"#7bb89d");
    }
  }
  function awning(g){
    // The port strip of deck is uncovered all the way from the hatch to the salon.
    const left=-1.48,ridge=.34,right=2.57,back=-7.46,front=-1.24;
    const crown=x=>x<=ridge?3.30+(x-left)/(ridge-left)*.235:3.535-(x-ridge)/(right-ridge)*.248;
    for(let i=0;i<8;i++){
      const a=back+(front-back)*i/8,b=back+(front-back)*(i+1)/8;
      const cloth=i%4===0?"#e1c99e":i%4===3?"#d5b985":canvas;
      for(const [x,q] of [[left,ridge],[ridge,right]]){
        g.quad([x,crown(x),a],[q,crown(q),a],[q,crown(q),b],[x,crown(x),b],cloth,x===left?1:.94);
        g.quad([x,crown(x)+.006,a],[q,crown(q)+.006,a],[q,crown(q)+.006,a+.023],[x,crown(x)+.006,a+.023],"#bb9e75");
      }
      for(const [x,y] of [[left,3.30],[right,3.287]]){
        g.quad([x,y,a],[x,y,b],[x,y-.12,b],[x,y-.12,a],enamel);
        g.tri([x,y-.11,a],[x,y-.11,b],[x,y-.20,(a+b)/2],enamel);
      }
    }
    wingBadge(g,(u,v)=>{const x=ridge+.15+u*.75;return [x,crown(x)+.017,-4.47+v*1.22];},cream);
    for(const x of [left+.048,right-.048])for(const z of [back+.084,front-.084]){
      g.pole([x,.94,z],[x,crown(x)-.025,z],.051,enamel,6);
      g.pole([x,2.85,z],[x,crown(x)-.028,z+(z< -4?.43:-.43)],.023,cream,5);
    }
    for(const z of [back+.03,front-.03])
      g.pole([left,3.25,z],[right,3.25,z],.031,metal,5);
    // Bow-facing aft bench and slatted starboard bench leave an open midship aisle.
    for(const x of [-1.03,.23])g.box(x,1.14,-7.0,.12,.40,.40,enamel);
    for(let i=0;i<3;i++)g.box(-.40,1.36,-7.20+i*.137,1.79,.071,.115,wood);
    g.box(-.40,1.59,-7.27,1.82,.14,.059,wood);
    for(const z of [-6.84,-4.73,-2.63])g.box(2.11,1.14,z,.39,.40,.12,enamel);
    for(let i=0;i<3;i++)g.box(1.91+i*.153,1.36,-4.76,.129,.07,4.64,wood);
    for(const y of [1.53,1.70])g.box(2.405,y,-4.76,.067,.105,4.67,wood);
    g.box(1.14,1.133,-6.93,.48,.38,.32,"#985d4d");
    g.pole([.99,1.337,-6.93],[1.28,1.337,-6.93],.026,"#c2a17c",5);
    for(const x of [1.01,1.27])g.box(x,1.15,-6.93,.039,.38,.326,deep);
  }
  function seatedLocal(g,x,z,shirt,skin,cap){
    const pt=(side,y,fwd)=>[x-fwd,y,z+side];
    const block=(side,y,fwd,w,h,d,color)=>g.box(...pt(side,y,fwd),d,h,w,color);
    block(0,1.42,0,.32,.16,.28,deep);
    block(0,1.67,-.004,.388,.40,.239,shirt);
    block(0,1.875,.01,.28,.059,.20,shirt);
    g.cyl(x-.033,1.924,z,.067,.073,.103,7,skin);
    g.cyl(x-.034,2.024,z,.094,.08,.182,8,skin);
    g.cyl(x-.027,2.12,z,.084,.102,.067,8,cap);
    block(0,2.104,.114,.178,.025,.11,cap);
    for(const s of [-1,1]){
      g.pole(pt(s*.158,1.82,0),pt(s*.195,1.61,.105),.067,shirt,5);
      g.pole(pt(s*.195,1.61,.105),pt(s*.125,1.53,.292),.044,skin,6);
      g.pole(pt(s*.087,1.425,.043),pt(s*.11,1.40,.331),.091,deep,6);
      g.pole(pt(s*.11,1.40,.331),pt(s*.109,1.04,.351),.064,"#536267",6);
      block(s*.11,1.026,.401,.132,.11,.253,deep);
    }
  }
  function bowDeck(g){
    g.box(0,1.346,6.70,1.48,.155,.97,enamel);
    g.box(0,1.441,6.70,1.54,.067,1.00,cream);
    for(const s of [-1,1])g.box(s*.52,1.483,6.43,.092,.027,.087,brass);
    // Brass bell and a coil by the bow keep the working deck legible at close range.
    g.pole([-.61,1.50,5.68],[-.61,2.05,5.68],.036,metal,5);
    g.pole([-.61,2.05,5.68],[-.61,2.05,5.96],.032,metal,5);
    g.cyl(-.61,1.943,5.92,.049,.145,.174,9,brass);
    const coil=i=>{const t=i*tau/8,r=.17+i*.008;return [1.12+r*Math.cos(t),1.194,5.74+r*.76*Math.sin(t)];};
    for(let i=0;i<19;i++)g.pole(coil(i),coil(i+1),.023,"#cbb592",4);
  }
  function gateLight(g){
    for(const z of [-4.16,-1.84]){
      g.box(-3.049,1.84,z,.158,.117,.158,"#ffe09b");
      g.box(-3.132,1.841,z,.014,.053,.112,"#fff3c0");
    }
  }
  function install(model){
    model("paloma-ferry",g=>{
      plankHull(g);landing(g);cabins(g);awning(g);bowDeck(g);
      seatedLocal(g,2.105,-6.16,"#be7657","#bb8b68","#648587");
      seatedLocal(g,2.105,-4.03,"#668e82","#895e4a","#d4b484");
    });
    model("paloma-gate",gateLight);
  }
  function drawMap(c,x,y,scale,yaw,t){
    c.save();c.translate(x,y);c.rotate(yaw);c.scale(scale,-scale);
    const box=(x,z,w,h,col)=>{c.fillStyle=col;c.fillRect(x,z,w,h);};
    c.beginPath();hull.forEach(([z,w],i)=>i?c.lineTo(-w,z):c.moveTo(-w,z));
    for(let i=hull.length-1;i>=0;i--)c.lineTo(hull[i][1],hull[i][0]);
    c.closePath();c.fillStyle=deck;c.fill();c.strokeStyle=deep;c.lineWidth=.25;c.stroke();
    box(-2.5,-.8,5,6.1,deep);box(-2.31,-.74,4.62,5.86,light);
    box(-2.06,3.72,4.12,.65,glass);box(-2.11,-.54,4.22,1.18,enamel);
    box(.27,-.32,.73,.91,deep);box(-.76,1.85,.74,.22,brass);
    for(let i=0;i<8;i++)box(-1.48,-7.46+i*.78,4.05,.78,i%4===0?"#e5cda2":i%4===3?"#c7a77c":canvas);
    c.fillStyle=cream;c.beginPath();wing.forEach(([a,b],i)=>i?c.lineTo(.42+a*.92,-4.45+b*1.18):c.moveTo(.42+a*.92,-4.45+b*1.18));c.closePath();c.fill();
    box(-.75,6.21,1.5,1.06,enamel);box(-.61,6.33,1.22,.82,cream);
    box(-3.13,-4.08,.41,2.16,amber);
    for(const z of [-4.16,-1.84]){
      c.fillStyle=t%1.4<.94?"#fff2af":amber;c.beginPath();c.arc(-3.04,z,.18,0,tau);c.fill();
    }
    c.restore();
  }
  window.BayFerryArt={install,drawMap};
})();
