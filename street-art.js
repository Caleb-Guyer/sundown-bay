/* Small street scenes for Sundown Bay. Model space is +Z forward and +Y up. */
(() => {
  "use strict";
  const tau=Math.PI*2;
  const signals=[
    {x:144,z:0,offset:0},{x:72,z:72,offset:3},
    {x:0,z:0,offset:6},{x:-72,z:-72,offset:9},
  ];
  const mod=(n,m)=>((n%m)+m)%m;
  const mix=(a,b,r)=>a+(b-a)*r;
  const tube=(g,a,b,r,c)=>g.pole(a,b,r,c,5);
  function link(g,a,b,aw,ad,bw,bd,front,shade=front) {
    const ring=(p,w,d)=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([dx,dz])=>
      [p[0]+w*dx/2,p[1],p[2]+d*dz/2]);
    const ar=ring(a,aw,ad),br=ring(b,bw,bd);
    for(let i=0;i<4;i++)g.quad(ar[i],ar[(i+1)%4],br[(i+1)%4],br[i],i<2?shade:front);
  }
  function wheel(g,z) {
    const n=12,r=.35;
    const at=(a,rad,x)=>[x,.352+Math.sin(a)*rad,z+Math.cos(a)*rad];
    for(let i=0;i<n;i++){
      const a=tau*i/n,b=tau*(i+1)/n;
      g.quad(at(a,r,-.036),at(b,r,-.036),at(b,r,.036),at(a,r,.036),"#343a40");
      for(const x of [-.036,.036]){
        g.quad(at(a,r,x),at(b,r,x),at(b,r-.026,x),at(a,r-.026,x),"#454949");
        g.quad(at(a,r-.026,x),at(b,r-.026,x),at(b,r-.052,x),at(a,r-.052,x),"#d6c8a7");
      }
    }
    for(let i=0;i<5;i++) {
      const a=i*Math.PI/5,dy=Math.cos(a)*.007,dz=-Math.sin(a)*.007;
      const p=at(a,r-.045,0),q=at(a+Math.PI,r-.045,0);
      g.quad([0,p[1]+dy,p[2]+dz],[0,q[1]+dy,q[2]+dz],[0,q[1]-dy,q[2]-dz],[0,p[1]-dy,p[2]-dz],"#99a9a0");
    }
  }
  function cycleMesh(g,phase) {
    wheel(g,-.54);wheel(g,.55);
    const rear=[0,.352,-.54],front=[0,.352,.55],crank=[0,.38,-.05],
      seat=[0,.89,-.19],head=[0,.89,.32],steerer=[0,1.095,.38];
    const enamel="#52c6b3",trim="#d5d9bd",navy="#384651";
    for(const [a,b] of [[rear,seat],[rear,crank],[crank,seat],[seat,head],[head,crank]])tube(g,a,b,.033,enamel);
    for(const x of [-.07,.07]) tube(g,[x,front[1],front[2]],head,.022,enamel);
    tube(g,head,steerer,.023,trim);tube(g,seat,[0,1.035,-.218],.023,trim);
    tube(g,[-.25,1.105,.376],[.25,1.105,.376],.019,trim);
    g.box(0,1.035,-.205,.17,.064,.275,navy);
    g.box(0,.846,.56,.37,.065,.24,"#a88059");
    for(const x of [-.16,-.06,.06,.16]) tube(g,[x,.868,.67],[x*1.13,1.036,.70],.012,"#d5a875");
    for(const y of [.91,.976,1.04])g.box(0,y,.70,.404,.016,.027,"#e0b77a");
    for(const x of [-.20,.20])g.box(x,1.04,.56,.022,.024,.27,"#dbb682");
    g.box(0,.94,.54,.17,.18,.14,"#e4bd86");
    const bob=.009*Math.cos(phase*2),skin="#bc8666",shadowSkin="#a4735c";
    const bottom=[0,1.03+bob,-.17],shoulder=[0,1.43+bob,.006];
    link(g,shoulder,bottom,.378,.201,.302,.208,"#e87e70","#cc7067");
    link(g,[0,1.22+bob,-.093],[0,1.184+bob,-.106],.342,.224,.333,.219,"#f5c89d");
    g.box(0,1.46+bob,.025,.097,.113,.104,skin);
    link(g,[0,1.686+bob,.066],[0,1.502+bob,.094],.185,.183,.144,.143,skin,shadowSkin);
    g.cyl(0,1.729+bob,.067,.077,.126,.114,8,"#efc869");
    g.box(0,1.691+bob,.154,.163,.027,.10,"#e0a85f");
    for(const side of [-1,1]){
      const shoulderJoint=[side*.176,1.403+bob,.011],elbow=[side*.218,1.205+bob,.181],hand=[side*.211,1.10,.377];
      const cuff=[side*.20,1.303+bob,.10];
      link(g,shoulderJoint,cuff,.144,.153,.111,.125,"#e97c70","#cf7169");
      tube(g,cuff,elbow,.045,skin);tube(g,elbow,hand,.041,skin);
      g.box(hand[0],hand[1],hand[2],.082,.073,.093,skin);
      const a=phase+(side<0?Math.PI:0);
      const pedal=[side*.13,crank[1]+Math.sin(a)*.153,crank[2]+Math.cos(a)*.153];
      tube(g,[side*.076,crank[1],crank[2]],pedal,.014,trim);
      g.box(pedal[0],pedal[1],pedal[2],.13,.029,.076,navy);
      const hip=[side*.091,1.045+bob,-.148],ankle=[side*.122,pedal[1]+.105,pedal[2]-.04];
      const dy=ankle[1]-hip[1],dz=ankle[2]-hip[2],length=Math.hypot(dy,dz);
      const bend=Math.sqrt(Math.max(.002,.396*.396-length*length/4));
      const knee=[side*.112,(ankle[1]+hip[1])/2+bend*dz/length,(ankle[2]+hip[2])/2-bend*dy/length];
      const hem=[knee[0],mix(hip[1],knee[1],.69),mix(hip[2],knee[2],.69)];
      link(g,hip,hem,.163,.175,.142,.143,"#3c6770","#3c5866");
      link(g,hem,knee,.123,.125,.095,.105,skin,shadowSkin);
      link(g,knee,ankle,.109,.122,.079,.087,skin,shadowSkin);
      g.box(ankle[0],pedal[1]+.058,pedal[2]+.01,.11,.077,.209,"#f2e2c0");
    }
  }
  function cycleAt(t) {
    const r=1.23,lo=-72,hi=48,side=hi-lo,arc=Math.PI*r,x=162.8;
    let d=mod(t*3.48+55,(side+arc)*2);
    if(d<side)return {x:x-r,z:lo+d,yaw:0};
    d-=side;
    if(d<arc){const a=d/r;return {x:x-r*Math.cos(a),z:hi+r*Math.sin(a),yaw:a};}
    d-=arc;
    if(d<side)return {x:x+r,z:hi-d,yaw:Math.PI};
    const a=(d-side)/r;return {x:x+r*Math.cos(a),z:lo-r*Math.sin(a),yaw:Math.PI+a};
  }

  function juiceCart(g) {
    const mint="#73bdae",cream="#ffe2b3",dark="#4d7770",orange="#e99158";
    g.box(0,.53,0,1.52,.66,.63,mint);g.box(0,.87,0,1.62,.082,.71,cream);
    g.box(0,.695,.322,1.48,.069,.021,cream);
    g.box(0,.258,.325,1.49,.05,.03,dark);
    for(const x of [-.6,.6])for(const z of [-.219,.219])g.box(x,.133,z,.13,.261,.14,"#526568");
    for(const x of [-.68,.68])g.box(x,1.456,-.20,.038,1.16,.038,"#cbac83");
    for(let i=0;i<7;i++){
      const l=-.925+i*1.85/7,r=l+1.85/7,c=i%2?cream:"#e88c72";
      g.quad([l,1.917,.49],[r,1.917,.49],[r,2.133,0],[l,2.133,0],c);
      g.quad([l,2.133,0],[r,2.133,0],[r,1.929,-.47],[l,1.929,-.47],c);
      g.quad([l,1.918,.49],[r,1.918,.49],[r,1.834,.49],[l,1.834,.49],c);
      g.tri([l,1.836,.49],[r,1.836,.49],[(l+r)/2,1.797,.49],c);
    }
    g.box(-.39,.977,.058,.51,.133,.335,"#b79467");
    for(let i=0;i<6;i++)g.cyl(-.55+(i%3)*.15,1.075,.010+Math.floor(i/3)*.124,.066,.055,.112,7,i%3?"#f9b474":orange);
    g.cyl(.48,1.057,-.025,.102,.092,.31,7,"#f4c27d");g.cyl(.48,1.221,-.025,.103,.105,.044,7,cream);
    // A painted orange with one mint leaf doubles as the cart's sign.
    const center=[0,.505,.343];
    for(let i=0;i<10;i++){
      const a=tau*i/10,b=tau*(i+1)/10;
      g.tri(center,[Math.cos(a)*.15,.505+Math.sin(a)*.15,.343],[Math.cos(b)*.15,.505+Math.sin(b)*.15,.343],orange);
    }
    g.tri([0,.639,.345],[.037,.706,.345],[.153,.702,.345],dark);
  }
  function vendor(g,reach) {
    const skin="#ad765c",shade="#936759",shirt="#edd9b8",apron="#4b9388";
    for(const side of [-1,1]){
      link(g,[side*.096,.93,0],[side*.105,.175,.012],.163,.174,.113,.13,"#43545b");
      g.box(side*.105,.095,.042,.143,.138,.222,"#e2cea8");
    }
    link(g,[0,1.435,0],[0,.924,0],.419,.23,.316,.209,shirt,"#c1b49b");
    g.quad([-.084,1.374,.123],[.084,1.374,.123],[.156,1.005,.114],[-.161,1.005,.114],apron);
    g.quad([-.16,1.007,.113],[.156,1.007,.113],[.164,.843,.128],[-.166,.843,.128],apron);
    g.box(0,1.48,.004,.101,.122,.113,skin);
    link(g,[0,1.696,.001],[0,1.511,.013],.191,.174,.143,.159,skin,shade);
    g.cyl(0,1.733,0,.10,.138,.081,7,"#e8b98e");
    g.box(0,1.702,.105,.197,.029,.144,"#e8b98e");
    for(const side of [-1,1]){
      const a=[side*.194,1.407,0], upper=[side*.239,1.25,.025];
      const el=side<0?[side*.235,1.081,.136]:[side*.25,1.115+reach*.075,.111+reach*.057];
      const hand=side<0?[side*.125,1.036,.276]:[side*.155,1.083+reach*.129,.271+reach*.169];
      link(g,a,upper,.146,.147,.122,.124,shirt,"#c6bba4");
      tube(g,upper,el,.052,skin);tube(g,el,hand,.046,skin);
      g.box(hand[0],hand[1],hand[2],.09,.083,.093,skin);
      if(side>0){g.cyl(hand[0],hand[1]+.047,hand[2]+.051,.053,.041,.143,7,"#f0c28a");
        g.cyl(hand[0],hand[1]+.122,hand[2]+.051,.055,.055,.008,7,"#ffe6bc");}
    }
  }
  const stand={x:132.65,z:29,yaw:Math.PI/2};
  const seller={x:132.10,z:29.19,yaw:Math.PI/2-.14};

  function gullMesh(g,flap) {
    const white="#f7ebd7",pale="#d4d8c9",charcoal="#48575c";
    const nose=[0,.023,.38],tail=[0,.027,-.36],top=[0,.091,.055],belly=[0,-.077,.055],
      l=[-.106,0,.016],r=[.106,0,.016];
    for(const pt of [nose,tail]){
      g.tri(pt,l,top,white);g.tri(pt,top,r,white);g.tri(pt,l,belly,pale);g.tri(pt,belly,r,pale);
    }
    g.tri([-.044,.047,.29],[.045,.047,.29],[0,.019,.472],"#e5b370");
    g.tri([-.068,.039,-.18],[.065,.039,-.18],[-.063,.03,-.478],white);
    g.tri([0,.039,-.18],[.081,.039,-.18],[.106,.034,-.437],white);
    for(const side of [-1,1]){
      const root=[side*.045,.032,.119],rootBack=[side*.05,.024,-.154];
      const wrist=[side*.47,.16+flap*.27,.12],elbow=[side*.43,.134+flap*.25,-.081];
      const tipRoot=[side*.73,.109+flap*.44,-.002],tipBack=[side*.71,.091+flap*.43,-.126],tip=[side*.951,.031+flap*.51,-.173];
      g.quad(root,wrist,elbow,rootBack,white);g.quad(wrist,tipRoot,tipBack,elbow,"#d0d5c8");
      g.tri(tipRoot,tip,tipBack,charcoal);
    }
  }
  function gullAt(t,i) {
    const a=t*(.153-i*.018)+i*2.06+.85,rx=18+i*3.1,rz=21+i*2.7;
    return {x:182+i*5+rx*Math.cos(a),z:-19+i*9+rz*Math.sin(a),
      y:7.25+i*1.34+.65*Math.sin(a*2+.54*i),
      yaw:Math.atan2(-rx*Math.sin(a),rz*Math.cos(a)),
      bank:.13+.06*Math.sin(a*2+.7)};
  }
  function skiff(g) {
    const stations=[[-3.03,.72,.44],[-2.08,1.10,.58],[.91,1.12,.62],[2.49,.68,.77],[3.46,.055,.84]];
    for(let i=1;i<stations.length;i++){
      const [az,aw,ah]=stations[i-1],[bz,bw,bh]=stations[i];
      g.quad([-aw,ah,az],[aw,ah,az],[bw,bh,bz],[-bw,bh,bz],"#d8c7a3");
      for(const side of [-1,1]){
        g.quad([side*aw,ah,az],[side*bw,bh,bz],[side*bw*.90,bh-.17,bz],[side*aw*.90,ah-.17,az],"#f3ddbb");
        g.quad([side*aw*.90,ah-.17,az],[side*bw*.90,bh-.17,bz],[side*bw*.74,.055,bz],[side*aw*.74,.055,az],"#ca7b67");
      }
    }
    g.quad([-.72,.44,-3.03],[.72,.44,-3.03],[.54,.055,-3.03],[-.54,.055,-3.03],"#bb7765");
    g.box(0,.252,-3.12,.45,.45,.42,"#53666a");g.box(0,.55,-3.13,.48,.25,.43,"#82aaa3");
    const roof=[[-.82,2.29,-1.84],[.82,2.29,-1.84],[.78,2.38,.84],[-.78,2.38,.84]];
    for(const x of [-.77,.77])for(const z of [-1.76,.80])tube(g,[x,.63,z],[x,2.29+(z+1.76)*.029,z],.032,"#e4d7be");
    g.quad(...roof,"#66a99c");
    g.quad(roof[0],roof[1],[.82,2.205,-1.84],[-.82,2.205,-1.84],"#427f7d");
    g.box(0,.864,-.95,1.63,.22,.42,"#c99b79");
    g.box(0,1.074,-1.158,1.62,.30,.07,"#f4d2a0");
    g.box(.39,.903,.819,.63,.59,.42,"#86b2a7");
    g.quad([-.01,1.21,.99],[.80,1.21,.99],[.73,1.55,.86],[.05,1.55,.86],"#7faeb2");
    g.box(.38,1.345,.42,.31,.52,.23,"#edb579");
    g.cyl(.38,1.699,.42,.083,.083,.207,7,"#ad7b62");
    g.cyl(.38,1.802,.41,.082,.115,.071,7,"#ead7ac");
    for(const side of [-1,1]) {
      g.cyl(side*.94,.673,-.47,.077,.073,.321,7,"#e6b17e");
      g.cyl(side*.98,.721,.16,.077,.073,.321,7,"#e6b17e");
    }
  }
  function wake(g) {
    for(const side of [-1,1]){
      g.quad([side*.47,.00,-2.71],[side*.77,.002,-2.71],[side*1.41,.002,-5.27],[side*1.19,.001,-5.1],"#c5d7bd");
      g.quad([side*1.43,.001,-5.56],[side*1.57,.002,-5.61],[side*2.19,.001,-8.92],[side*2.13,.001,-8.41],"#93bab0");
    }
    g.tri([-.23,.002,-3.33],[.22,.002,-3.33],[.085,.001,-5.41],"#b7cdc0");
  }
  function boatAt(t) {
    const a=t*.043+.48;
    return {x:245+13*Math.cos(a),z:-15+87*Math.sin(a),
      yaw:Math.atan2(-13*Math.sin(a),87*Math.cos(a))};
  }

  function signalMesh(g,nsGreen) {
    // The junction origin stays at the road centre. Both approaches see the same pair of heads.
    const pole="#747f79",rail="#98a59c",black="#3a4b4b",housing="#d3af77";
    g.cyl(8,.265,8,.215,.275,.53,7,pole);
    g.cyl(8,2.91,8,.105,.151,5.48,7,rail);
    for(const [dx,dz] of [[-1,0],[0,-1]]){
      tube(g,[8,4.68,8],[8+dx*2.34,5.385,8+dz*2.34],.043,rail);
      tube(g,[8,5.45,8],[8+dx*5.81,5.45,8+dz*5.81],.087,pole);
    }
    function head(x,z,alongZ,green){
      const plane=(u,y,v)=>[x+(alongZ?u:v),y,z+(alongZ?v:u)];
      g.box(x,4.82,z,alongZ?.56:.40,1.235,alongZ?.40:.56,housing);
      for(const side of [-1,1]){
        g.quad(plane(-.239,4.233,side*.205),plane(.239,4.233,side*.205),
          plane(.239,5.403,side*.205),plane(-.239,5.403,side*.205),black);
        const lenses=[[5.161,green?"#7b5350":"#ff715b"],[4.811,"#927950"],[4.457,green?"#9afb99":"#456c5c"]];
        for(const [y,col] of lenses){
          const cen=plane(0,y,side*.213);
          for(let i=0;i<8;i++){
            const a=tau*i/8,b=tau*(i+1)/8;
            g.tri(cen,plane(Math.sin(a)*.151,y+Math.cos(a)*.151,side*.213),
              plane(Math.sin(b)*.151,y+Math.cos(b)*.151,side*.213),col);
          }
          g.quad(plane(-.163,y+.151,side*.205),plane(.163,y+.151,side*.205),
            plane(.146,y+.133,side*.326),plane(-.146,y+.133,side*.326),black);
        }
      }
    }
    head(2.45,8,true,nsGreen);head(8,2.45,false,!nsGreen);
  }

  function install(model) {
    for(let i=0;i<8;i++)model("street-cycle-"+i,g=>cycleMesh(g,tau*i/8));
    for(let i=0;i<4;i++)model("street-vendor-"+i,g=>vendor(g,i/3));
    for(let i=0;i<5;i++)model("street-gull-"+i,g=>gullMesh(g,(i-2)/2));
    model("street-juice-cart",juiceCart);model("street-skiff",skiff);model("street-wake",wake);
    model("signal-ns",g=>signalMesh(g,true));model("signal-ew",g=>signalMesh(g,false));
  }
  function near(c,x,z,distance) {
    return !c || (c.x-x)*(c.x-x)+(c.z-z)*(c.z-z)<distance*distance;
  }
  function draw(view,t,camera,shadowPass=false) {
    for(const sig of signals) {
      if(near(camera,sig.x,sig.z,136))view.draw(mod(t+sig.offset,14)<7?"signal-ns":"signal-ew",sig.x,.14,sig.z);
    }
    const cycle=cycleAt(t);
    if(near(camera,cycle.x,cycle.z,96)) {
      const pedal=Math.floor(mod(t*6.8,8));
      view.draw("street-cycle-"+pedal,cycle.x,.14,cycle.z,cycle.yaw);
    }
    if(near(camera,stand.x,stand.z,103)) {
      view.draw("street-juice-cart",stand.x,.14,stand.z,stand.yaw);
      const reach=Math.round(Math.max(0,Math.sin(t*.84-.6))*3);
      view.draw("street-vendor-"+reach,seller.x,.15,seller.z,seller.yaw);
    }
    if(near(camera,185,-12,132))for(let i=0;i<3;i++){
      const gull=gullAt(t,i),gliding=Math.sin(t*.48+i*1.46)>.04;
      const flap=gliding?2:Math.round(2+Math.sin(t*6.7+i*2.5)*2);
      view.draw("street-gull-"+flap,gull.x,gull.y,gull.z,gull.yaw,0,gull.bank);
    }
    if(shadowPass)return;
    const boat=boatAt(t);
    if(near(camera,boat.x,boat.z,181)) {
      view.draw("street-wake",boat.x,.082,boat.z,boat.yaw);
      view.draw("street-skiff",boat.x,.10+Math.sin(t*1.73)*.055,boat.z,boat.yaw,
        Math.sin(t*1.19)*.021,Math.cos(t*.86)*.032);
    }
  }
  function overview(t) {
    const actors=[
      {...cycleAt(t),type:"cyclist",color:"#e98672"},
      {...stand,type:"juice-cart",color:"#79c1b0"},
      {...seller,type:"vendor",color:"#efa874"},
      {...boatAt(t),type:"skiff",color:"#e78e76"},
    ];
    for(let i=0;i<3;i++){const {x,z,yaw}=gullAt(t,i);actors.push({x,z,yaw,type:"gull",color:"#f2e5cf"});}
    return actors;
  }
  window.BayStreetArt={install,draw,signals,overview};
})();
