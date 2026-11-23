/* Pelican Cut. The field recorder and both renderers follow the same three sources. */
(() => {
  "use strict";
  const tau = Math.PI * 2;
  const sources = [
    {id:"spoonbills", name:"Roseate spoonbills", site:{x:104,z:267,name:"Shell Levee"}, range:36},
    {id:"windpump", name:"Tillman wind pump", site:{x:199,z:285,name:"Bridge turnout"}, range:30},
    {id:"trawler", name:"Little Dot", site:{x:243,z:320,name:"East pier"}, range:66}
  ];
  const pumpBase = {x:201,z:269};
  const kit = {x:194,z:334,yaw:-2.3};
  const pumpDatum = .03; // The feet stand on a shell bank at the waterline, below the road deck.
  const pumpFacing = -.91;
  const pumpHeight = 7.16;
  const pumpPeriod = 1.3;
  const fleet = [[0,0,0],[-2.25,-1.9,.36],[2.45,-1.45,.67],[-4.35,-3.9,.92],[4.0,-3.68,1.18]];
  const clamp = n => Math.min(1,Math.max(0,n));
  const smooth = n => { const v=clamp(n); return v*v*(3-2*v); };
  const wrap = (n,period) => n-Math.floor(n/period)*period;
  const rainAmount = weather => (weather && Number.isFinite(weather.rain)) ? clamp(weather.rain) : 0;
  const hum = (a,power) => Math.pow((1+Math.cos(a))*.5,power);
  const offset = (x,z,dx,dz,yaw) => ({
    x:x+Math.cos(yaw)*dx+Math.sin(yaw)*dz, z:z-Math.sin(yaw)*dx+Math.cos(yaw)*dz
  });

  function birdPose(t,weather,index=0) {
    const [side,behind,delay] = fleet[index];
    const elapsed = t-delay;
    const phase = wrap(elapsed,24);
    const circle = tau*smooth((phase-4)/15.8);
    const flight = smooth((phase-3.85)/3.45)*smooth((20.25-phase)/3.9);
    const yaw = Math.atan2(Math.cos(circle)*7.3,Math.sin(circle)*4.9) +
      (1-flight)*(.23*Math.sin(elapsed*1.13+index)-.28);
    const flock = offset(120.6+7.3*Math.sin(circle),267.1+4.9*(1-Math.cos(circle)),side,behind,yaw);
    const rain = rainAmount(weather);
    const beat = elapsed*(4.65+index*.035)+Math.sin(elapsed*.55+index)*.49;
    const y = .68 + flight*(4.2+.76*Math.sin(circle+.43)+.14*Math.sin(beat)-.54*rain);
    const wingLift = flight*(.21+.67*Math.sin(beat)) + (1-flight)*(-.02+.035*Math.cos(elapsed*2+index));
    const sweep = (1-flight)*1.42 + flight*(.12+.13*(1+Math.sin(beat))*.5);
    // A short bill sweep repeats while feeding. The flock also calls on the lift and homeward turn.
    const call = Math.max(hum(tau*(phase-2.35)/8,3), .86*hum(tau*(phase-6.15)/24,6));
    const strength = clamp(.46+.48*call+.055*Math.cos(phase*7.5)*call-.035*rain);
    return {x:flock.x,y,z:flock.z,yaw,strength,flight,wingLift,sweep,
      neck:(1-flight)*(.57+.46*Math.sin(elapsed*1.5+index))+flight*.76-.12*call,
      legs:flight*1.2+.035*Math.sin(elapsed*1.8+index)};
  }
  function windPose(t) {
    const crank = t*tau/pumpPeriod;
    const rocker = -.31*Math.sin(crank),cs=Math.cos(rocker),sn=Math.sin(rocker);
    const hub = offset(pumpBase.x,pumpBase.z,0,.72,pumpFacing);
    return {x:hub.x,y:pumpDatum+pumpHeight,z:hub.z,yaw:pumpFacing,
      turn:crank/4, crank, rocker, rodX:-.53*cs-.258*sn,rod:-.53*sn+.258*(cs-1),
      strength:.45+.51*hum(crank-1.5*Math.PI,1.45)};
  }
  function boatPose(t,weather) {
    const angle = tau*t/53+.19;
    const yaw = Math.atan2(7*Math.cos(angle),-22*Math.sin(angle));
    const rain = rainAmount(weather);
    const beat = tau*t*1.65;
    const load = hum(tau*(t-1.4)/11,1.5);
    return {x:284+7*Math.sin(angle),y:2.16+(.066+rain*.06)*Math.sin(t*1.47),
      z:323+22*Math.cos(angle),yaw,
      pitch:(.017+.010*rain)*Math.sin(t*1.47+.4), roll:(.024+.014*rain)*Math.sin(t*1.04),
      beat,load,strength:clamp(.52+.35*load+.09*hum(beat,2))};
  }
  function pose(id,t,weather) {
    if (id==="spoonbills") return birdPose(t,weather);
    if (id==="windpump") return windPose(t);
    if (id==="trawler") return boatPose(t,weather);
    return null;
  }
  function trawlerHull(t,weather) {
    const {x,z,yaw}=boatPose(t,weather);
    return {x,z,yaw,halfLength:7.2,halfWidth:2.15};
  }
  const blocks=[{x:pumpBase.x,z:pumpBase.z,w:2.64,d:2.64,bottom:0,top:pumpHeight,streetProp:true}];

  // Tapered cross sections give the birds bellies and feathered backs with very few faces.
  function skin(g,rings,shades,sides=8) {
    const pt=([z,mid,rx,ry],i) => [rx*Math.cos(i*tau/sides),mid+ry*Math.sin(i*tau/sides),z];
    for(let j=1;j<rings.length;j++) for(let i=0;i<sides;i++) {
      const a=rings[j-1],b=rings[j];
      g.quad(pt(a,i),pt(a,i+1),pt(b,i+1),pt(b,i),shades[i%shades.length]);
    }
  }
  function birdBody(g) {
    skin(g,[[-.49,.045,.02,.028],[-.24,.03,.18,.13],[.02,0,.225,.165],[.23,.035,.147,.13],[.28,.06,.038,.06]],
      ["#efa7ab","#f9c5c4","#ffdbce","#f0b1ae","#d7838d","#ce858b","#f0a1a5","#ef9d9f"]);
    for(const s of [-1,1])
      g.tri([0,.09,-.29],[s*.16,.03,-.32],[s*.08,-.01,-.57],"#e89892");
  }
  function birdNeck(g) {
    const white="#f5ddca";
    g.pole([0,0,0],[0,.18,.045],.095,white,6);
    g.pole([0,.17,.045],[0,.36,.16],.077,white,6);
    g.pole([0,.35,.155],[0,.405,.30],.074,"#ead8bd",6);
    const head = [[.19,.40,.045,.048],[.25,.418,.089,.082],[.34,.405,.082,.068],[.38,.383,.043,.04]];
    skin(g,head,["#d4c7a8","#e5d6b5","#f0dfc1","#d9d2ae","#c4c5a4","#bbbea1"],6);
    for(const s of [-1,1]) g.box(s*.078,.426,.302,.013,.025,.027,"#353337");
    // The bill narrows to a shaft and then opens into a flat, rounded spoon at its tip.
    const bill=[[.352,.389,.048,.031],[.50,.365,.028,.022],[.62,.343,.032,.015],[.70,.333,.066,.015],[.76,.331,.052,.012],[.785,.333,.01,.006]];
    skin(g,bill,["#64686b","#8e9591","#a7aaa0","#797f7e","#555e63","#61686d"],6);
  }
  function birdLegs(g) {
    for(const s of [-1,1]) {
      g.pole([s*.093,0,0],[s*.089,-.25,-.045],.021,"#9f675f");
      g.pole([s*.089,-.25,-.045],[s*.13,-.53,-.015],.016,"#9d665a");
      for(const dx of [-.044,.052])g.pole([s*.13,-.53,-.015],[s*.13+dx,-.546,.115],.009,"#82554c",4);
    }
  }
  function birdWing(g,s) {
    // The salmon coverts meet a row of separate carmine primary feathers.
    const p=(x,y,z)=>[s*x,y,z];
    const a=p(0,.055,.13),b=p(.51,.085,.19),c=p(.42,.006,-.15),d=p(0,.015,-.19);
    g.quad(a,b,c,d,"#f6a2ad"); g.tri(a,b,p(.29,.10,.24),"#fbd1c7");
    g.quad(b,p(.83,.028,.16),p(.71,-.015,-.10),c,"#e77d91");
    const feathers=[
      [.57,.81,-.14,-.37],[.66,.91,-.088,-.31],[.74,1.04,-.038,-.23],
      [.79,1.14,.028,-.13],[.77,1.20,.095,-.012],[.75,1.18,.149,.063]
    ];
    feathers.forEach(([root,end,fore,tip],i)=>{
      g.quad(p(root,.023,fore+.064),p(end,-.025,tip+.034),p(end-.018,-.032,tip),p(root-.055,0,fore),
        ["#c9657d","#df8293","#d66e87","#e68697","#df7b90","#f09aa8"][i]);
    });
  }
  function distantBird(g,flight,tip) {
    const reach=flight?.75:.45,neck=flight?.15:.25;
    birdBody(g);
    g.pole([0,.04,.16],[0,neck,reach],.072,"#f6dfc8",5);
    g.pole([0,neck,reach-.06],[0,neck+.015,reach+.10],.077,"#daceb3",5);
    g.quad([-.02,neck+.01,reach+.08],[.02,neck+.01,reach+.08],
      [.061,neck-.012,reach+.40],[-.061,neck-.012,reach+.40],"#76817e");
    for(const s of [-1,1]) {
      if(flight) {
        g.quad([s*.1,.08,.14],[s*.57,.11,.18],[s*.72,.07,-.12],[s*.14,.03,-.21],"#f6a2ad");
        g.quad([s*.57,.11,.18],[s*1.19,tip,.09],[s*.85,tip-.02,-.26],[s*.68,.06,-.13],"#dc8295");
      }else{
        g.tri([s*.21,.07,.19],[s*.23,.03,-.64],[s*.10,.11,-.29],"#df8797");
        g.pole([s*.093,-.08,-.03],[s*.13,-.60,.01],.018,"#9d665a",4);
      }
    }
  }

  const steel="#8b9b98", iron="#576c70", oldIron="#895e45", sunMetal="#c2c8b8";
  function pumpTower(g) {
    const foot=1.32,top=.365;
    const reach = y=>foot+(top-foot)*y/(pumpHeight-.24);
    const corner=(sx,sz,y)=>[sx*reach(y),y,sz*reach(y)];
    const bank=[[-1.72,-.91],[-1.24,-1.69],[.59,-1.79],[1.64,-1.30],[1.78,.69],[1.04,1.52],[-.49,1.74],[-1.72,1.17]];
    for(let i=0;i<bank.length;i++) {
      const [x,z]=bank[i],[nx,nz]=bank[(i+1)%bank.length];
      g.tri([0,.13,0],[x,.087,z],[nx,.087,nz],i%3?"#929780":"#9d9b83");
      g.quad([x,.087,z],[nx,.087,nz],[nx*1.24,-.055,nz*1.24],[x*1.24,-.055,z*1.24],"#727e6f");
    }
    for(const sx of [-1,1]) for(const sz of [-1,1]) {
      g.box(sx*foot,.12,sz*foot,.5,.24,.5,"#b3a384");
      g.pole(corner(sx,sz,.15),corner(sx,sz,pumpHeight-.24),.087,iron);
      for(const [a,b] of [[.56,2.55],[2.58,4.64],[4.67,6.61]]) {
        g.pole(corner(sx,sz,a),corner(-sx,sz,b),.031,steel,4);
        g.pole(corner(sx,sz,a),corner(sx,-sz,b),.031,steel,4);
        if (sx<0) g.pole(corner(sx,sz,b),corner(-sx,sz,b),.039,sunMetal,4);
        if (sz<0) g.pole(corner(sx,sz,b),corner(sx,-sz,b),.039,steel,4);
      }
    }
    for(const x of [-.24,.24]) g.pole([x,.4,-1.03],[x,6.22,-.50],.033,oldIron,4);
    for(let y=.57;y<6.2;y+=.43) {
      const z=-1.03+.53*(y-.4)/5.82;
      g.pole([-.24,y,z],[.24,y,z],.028,steel,4);
    }
    g.box(0,6.68,0,1.21,.10,1.18,oldIron);
    g.box(0,7.04,0,.56,.45,.82,iron);
    g.pole([0,pumpHeight,-.13],[0,pumpHeight,.85],.132,oldIron,7);
    g.pole([0,7.16,-.16],[0,7.43,-3.44],.064,iron);
    g.pole([0,7.08,-.22],[0,7.03,-3.25],.043,steel);
    const outline=[[-1.92,7.26],[-2.65,7.62],[-3.62,7.84],[-3.44,7.29],[-3.60,6.92],[-2.60,7.03]];
    const vane=(z,y)=>[0,y,z];
    for(let i=1;i+1<outline.length;i++)g.tri(vane(...outline[0]),vane(...outline[i]),vane(...outline[i+1]),"#d8cbb1");
    g.quad([-.008,7.48,-2.85],[-.008,7.63,-3.49],[-.008,7.43,-3.43],[-.008,7.31,-2.72],"#bc6855");
    g.quad([.008,7.48,-2.85],[.008,7.63,-3.49],[.008,7.43,-3.43],[.008,7.31,-2.72],"#bc6855");
    g.cyl(-.53,.49,.04,.20,.26,.79,8,"#587773");
    g.cyl(-.53,.98,.04,.14,.17,.22,8,oldIron);
    g.pole([-.53,.70,.04],[.52,.70,.12],.075,"#78938a",6);
    g.pole([.52,.70,.12],[.60,.49,.12],.075,"#78938a",6);
    g.box(.72,.19,.15,.60,.23,1.18,"#a39b7d");
    g.box(.72,.308,.15,.48,.014,1.04,"#72897c");
  }
  const wheelPoint=(r,a,z)=>[Math.cos(a)*r,Math.sin(a)*r,z];
  function pumpWheel(g) {
    for(let i=0;i<12;i++) {
      const a=i*tau/12;
      if(i%2===0)g.pole([0,0,0],wheelPoint(2.02,a+.12,0),.040,iron,4);
      g.pole(wheelPoint(1.85,a,.055),wheelPoint(1.85,a+tau/12,.055),.026,steel,4);
      g.pole(wheelPoint(.91,a,.045),wheelPoint(.91,a+tau/12,.045),.021,steel,4);
      const a0=wheelPoint(.79,a+.02,.095), a1=wheelPoint(1.43,a+.005,.16), a2=wheelPoint(2.10,a-.015,.22);
      const b0=wheelPoint(.82,a+.29,-.045), b1=wheelPoint(1.44,a+.34,-.055), b2=wheelPoint(2.08,a+.38,-.062);
      const paint=i===2||i===3?"#b96552":i%3===0?"#b9bda9":"#d8d3bb";
      g.quad(a0,a1,b1,b0,paint,.88);
      g.quad(a1,a2,b2,b1,paint,1.02);
    }
    g.pole([0,0,-.12],[0,0,.17],.22,oldIron,8);
    g.pole([0,0,.16],[0,0,.25],.112,sunMetal,8);
  }
  function pumpRocker(g) {
    g.pole([-.62,.28,0],[.70,-.05,0],.095,oldIron,6);
    g.pole([-.62,.28,0],[.21,-.14,0],.045,iron,4);
    g.pole([.21,-.14,0],[.70,-.05,0],.045,iron,4);
  }

  const boatBlue="#385764", boatStripe="#b8664e", boatCream="#e8d9b0", boatWood="#a78765";
  const stations=[[-7.2,1.42,.93],[-6.35,1.93,1.03],[-4.7,2.12,1.08],[-1.5,2.15,1.12],[1.9,2.08,1.21],[4.55,1.64,1.43],[6.26,.85,1.62],[7.2,.035,1.80]];
  function boatHull(g) {
    const bandWidth=[.25,.72,.94,.965,.995,1],palette=["#293d48",boatBlue,"#476c72",boatStripe,boatCream];
    function at(st,s,k) {
      const [z,w,h]=st;
      return [s*w*bandWidth[k],[-.54,-.22,.08,h-.37,h-.24,h][k],z];
    }
    for(let i=1;i<stations.length;i++) {
      const a=stations[i-1],b=stations[i];
      for(const s of [-1,1]) {
        for(let k=0;k<palette.length;k++)g.quad(at(a,s,k),at(b,s,k),at(b,s,k+1),at(a,s,k+1),palette[k],s<0?.93:1);
        g.quad([0,a[2],a[0]],[0,b[2],b[0]],at(b,s,5),at(a,s,5),boatWood);
        g.pole(at(a,s,5),at(b,s,5),.060,"#715b50",5);
      }
    }
    for(let k=0;k<palette.length;k++)
      g.quad(at(stations[0],-1,k),at(stations[0],1,k),at(stations[0],1,k+1),at(stations[0],-1,k+1),palette[k],.91);
  }
  function trawler(g) {
    boatHull(g);
    // The pilothouse sits forward so the winch can work the full afterdeck.
    const house=[
      [[-1.52,1.15,.2],[1.52,1.15,.2],[1.46,3.11,.27],[-1.46,3.11,.27]],
      [[-1.40,1.25,3.67],[1.40,1.25,3.67],[1.31,3.11,3.35],[-1.31,3.11,3.35]]
    ];
    g.quad(...house[0],boatCream,.91);g.quad(...house[1],boatCream);
    for(const [a,b] of [[0,3],[1,2]]) g.quad(house[0][a],house[1][a],house[1][b],house[0][b],boatCream,a===0?.92:1);
    g.box(0,3.16,1.84,3.29,.14,3.81,"#8b5145");
    g.box(0,3.25,1.84,3.12,.048,3.67,"#bb8265");
    for(const s of [-1,1]) {
      const front=(x,y)=>[x,y,3.68-(y-1.25)*.171+.012];
      g.quad(front(s*.10,2.16),front(s*1.17,2.16),front(s*1.13,2.91),front(s*.10,2.91),"#526f72");
      for(let j=0;j<3;j++) {
        const z=.40+j*.91, side=(zz,y)=>[s*(1.523-(zz-.2)*.045-(y-1.25)*.034+.014),y,zz];
        g.quad(side(z,2.20),side(z+.73,2.20),side(z+.73,2.91),side(z,2.91),j===1?"#405958":"#64827d");
      }
      for(const z of [-5.7,-3.3,-.95]) {
        g.pole([s*2.03,1.16,z],[s*2.13,.64,z-.10],.026,"#736551",4);
        g.pole([s*2.13,.97,z-.09],[s*2.16,.54,z-.16],.135,"#bda688",6);
      }
      g.pole([s*1.52,1.48,4.66],[s*.70,1.80,6.48],.040,"#948f76");
      g.pole([s*1.52,1.48,4.66],[s*1.54,1.95,4.66],.035,iron);
      g.pole([s*1.54,1.95,4.66],[s*.72,2.29,6.50],.043,steel);
      g.pole([s*.72,1.68,6.48],[s*.72,2.29,6.50],.035,iron);
    }
    g.box(0,3.50,2.10,.46,.51,.56,"#b6b09b");
    g.cyl(.81,3.94,.71,.15,.18,1.47,7,"#685f55");
    g.cyl(.81,4.68,.71,.22,.19,.16,7,"#414e50");
    g.pole([-.76,3.23,2.68],[-.78,4.56,2.55],.025,steel,4);
    g.pole([-.74,1.14,-1.18],[0,6.24,-1.10],.095,"#ae8052",6);
    g.pole([.74,1.14,-1.18],[0,6.24,-1.10],.095,"#b98b59",6);
    g.pole([-.69,2.46,-1.15],[.69,2.46,-1.15],.073,oldIron);
    g.pole([0,6.05,-1.10],[0,6.73,-1.10],.047,iron);
    g.cyl(0,6.68,-1.10,.127,.15,.19,6,"#f6d8a1");
    for(const s of [-1,1]) {
      const root=[s*1.09,2.19,-1.30],tip=[s*6.65,4.60,-3.72];
      g.pole(root,tip,.084,"#b88a5c",6);
      g.pole([0,6.09,-1.1],tip,.038,"#8a9180",4);
      g.pole(tip,[s*1.74,1.24,-6.06],.031,"#8c866f",4);
      // Open diamond netting slung below each spar, with an orange cork line and a gathered cod end.
      const net=(f,v)=>[s*(2.10+4.42*f-.31*v),2.52+1.82*f-v*(.42+1.10*f),-1.82-1.80*f-.27*v];
      for(let j=0;j<=7;j++) {
        const v=j/7;
        g.pole(net(v,0),net(v,1),.022,"#607769",4);
        if(j<7) {
          g.pole(net(v,0),net((j+1)/7,1),.021,"#647867",4);
          g.pole(net(v,1),net((j+1)/7,1),.038,"#76806a",4);
        }
        if(j%2===1) {
          const [x,y,z]=net(v,0);
          g.cyl(x,y,z,.11,.11,.15,6,"#c28b4e");
        }
      }
      const end=net(1,1);
      g.pole(end,[end[0]-s*.31,end[1]-.69,end[2]-.19],.16,"#67735c",5);
      g.pole([s*.92,1.12,-3.73],[s*.92,1.84,-3.73],.086,iron,5);
    }
    g.pole([-.95,1.76,-3.73],[.95,1.76,-3.73],.38,"#59655d",9);
    for(const x of [-.86,-.55,-.23,.10,.43,.75])g.pole([x-.044,1.76,-3.73],[x+.044,1.76,-3.73],.40,"#9f9473",8);
    for(const [x,z] of [[-.85,-5.33],[.13,-5.81],[.82,-5.26]]) {
      g.box(x,1.31,z,.74,.38,.61,"#947342");
      for(const dx of [-.23,.20])g.box(x+dx,1.52,z,.054,.034,.62,"#d6b17b");
    }
    g.box(0,1.39,5.41,.76,.22,.97,boatCream);
    g.box(0,1.51,5.41,.65,.034,.86,"#58716f");
    // Three squares and a bar form Dot's house mark on both cabin sides.
    for(const s of [-1,1]) {
      for(const z of [1.22,1.49,1.76])g.box(s*1.502,1.80,z,.037,.135,.135,boatStripe);
      g.box(s*1.486,1.64,1.49,.037,.050,.72,boatStripe);
    }
  }
  function wake(g) {
    for(const s of [-1,1]) {
      for(const [x,z,len] of [[1.73,-6.6,3.28],[2.74,-9.23,3.77],[4.13,-12.6,2.6]]) {
        g.quad([s*x,0,z],[s*(x+.17),0,z+.14],[s*(x+1.13),0,z-len],[s*(x+.96),0,z-len+.21],"#94b4a6");
      }
      g.tri([s*.23,0,-7.15],[s*1.04,0,-7.02],[s*.49,0,-9.49],"#b9c9af");
    }
  }

  const kitSkin="#94694f", canvas="#7c8060", canvasDark="#535f54", webbing="#a78f63";
  const enamel="#465d61", metal="#b4b5a3", windscreen="#81908e";
  let kitParts;
  function personPieces() {
    if(kitParts)return kitParts;
    // Keep the town's face and boot proportions. Kit's arms and field costume have their own pose.
    const base=new BayMesh(),spans=[];
    buildBayPerson(base,kitSkin,"#bd9b63","#53676a",0,"local",0,(part)=>spans.push({part,start:base.vertices.length}));
    const body=[],head=[];
    spans.forEach(({part,start},i)=>{
      if(part==="arm")return;
      const end=spans[i+1]?.start??base.vertices.length,target=part==="head"?head:body;
      for(let j=start;j<end;j+=6) {
        const v=base.vertices;target.push(v[j],v[j+1]-(part==="head"?1.515:0),v[j+2],v[j+3],v[j+4],v[j+5]);
      }
    });
    kitParts={body,head};
    return kitParts;
  }
  function arm(g,shoulder,elbow,wrist,hand) {
    const sleeve=shoulder.map((v,i)=>v+(elbow[i]-v)*.68);
    g.pole(shoulder,sleeve,.083,"#b39361",7);g.pole(sleeve,elbow,.055,kitSkin,7);
    g.pole(elbow,wrist,.048,kitSkin,7);g.pole(wrist,hand,.040,kitSkin,6);
  }
  function tapeDeck(g,x,y,z) {
    g.box(x,y,z,.33,.205,.17,canvasDark);
    g.box(x,y+.032,z+.075,.344,.17,.041,canvas);
    g.box(x,y-.045,z+.10,.315,.025,.014,webbing);
    g.box(x+.077,y+.119,z+.010,.137,.015,.109,"#435759");
    g.box(x+.077,y+.13,z+.010,.101,.008,.072,"#e4cd90");
    g.box(x+.079,y+.137,z+.011,.009,.006,.052,oldIron,-.38);
    for(const dx of [-.104,-.030]) {
      g.cyl(x+dx,y+.12,z+.025,.029,.029,.027,7,metal);
      g.box(x+dx,y+.136,z+.025,.008,.002,.026,"#515b55");
    }
    g.box(x-.028,y+.041,z+.100,.102,.057,.009,"#c0b082");
    for(const dx of [-.059,-.013])g.box(x+dx,y+.04,z+.106,.027,.028,.007,enamel);
  }
  function kitBody(g) {
    g.vertices.push(...personPieces().body);
    const top="#607d74",shade="#4d6964",edging="#beae80";
    for(const side of [-1,1]) {
      const p=(x,y,z)=>[x*side,y,z];
      g.quad(p(.037,1.421,.120),p(.143,1.400,.105),p(.160,1.136,.092),p(.038,1.197,.115),top);
      g.quad(p(.038,1.197,.115),p(.160,1.136,.092),p(.137,.961,.107),p(.034,.957,.115),shade);
      g.quad(p(.070,1.193,.120),p(.135,1.177,.113),p(.131,1.097,.113),p(.067,1.100,.120),"#778c79");
      g.quad(p(.062,1.195,.122),p(.135,1.189,.116),p(.131,1.169,.119),p(.060,1.170,.123),edging);
    }
    g.quad([-.143,1.410,-.116],[.144,1.411,-.116],[.11,.965,-.108],[-.12,.965,-.108],top);
    for(const z of [-.127,.130])
      g.quad([-.095,1.439,z],[-.051,1.439,z],[.141,1.009,z],[.097,1.009,z],webbing);
    g.quad([-.095,1.439,-.127],[-.051,1.439,-.127],[-.051,1.439,.130],[-.095,1.439,.130],webbing);
    g.box(-.107,1.313,.131,.068,.049,.009,"#ded1a3");
    g.box(-.112,1.315,.139,.039,.008,.006,"#486b68");
    tapeDeck(g,.030,1.036,.187);
    arm(g,[-.201,1.405,-.001],[-.339,1.311,.086],[-.155,1.590,.062],[-.132,1.624,.029]);
  }
  function kitHead(g) {
    g.vertices.push(...personPieces().head);
    const rim=(angle)=>[.124*Math.cos(angle),.150+.133*Math.sin(angle),-.002];
    for(let i=0;i<8;i++) {
      const a=Math.PI*i/8,b=Math.PI*(i+1)/8;
      g.pole(rim(a),rim(b),.013,"#414f51",5);
      if(i>=2&&i<=5)g.pole(rim(a),rim(b),.019,"#b08d64",5);
    }
    for(const side of [-1,1]) {
      g.pole([side*.097,.13,0],[side*.132,.13,0],.066,"#363f42",8);
      g.pole([side*.131,.13,0],[side*.150,.13,0],.056,enamel,8);
      g.pole([side*.150,.13,0],[side*.158,.13,0],.033,"#c18c5e",7);
    }
    g.pole([.14,.115,-.025],[.15,.035,-.070],.009,"#4f5650",4);
    g.pole([.15,.035,-.070],[.12,-.079,-.10],.008,"#4f5650",4);
  }
  const kitShoulder=[.201,1.405,-.001];
  function kitTuningArm(g) {
    arm(g,[0,0,0],[.087,-.204,.058],[-.015,-.239,.233],[-.056,-.254,.247]);
  }
  function kitPose(t) {
    const listen=hum(t*tau/9.4,2.3);
    return {tilt:.10+.19*(1-listen),look:.26*listen+.043*Math.sin(t*.88),knob:.035+.065*Math.sin(t*2.32)-.035*listen};
  }
  function producer(list,t) {
    const p=kitPose(t),y=window.BayCut?.height(kit.x,kit.z)??.24;
    const shoulder=offset(kit.x,kit.z,kitShoulder[0],kitShoulder[2],kit.yaw);
    list.push(["cut-kit-body",kit.x,y,kit.z,kit.yaw],
      ["cut-kit-head",kit.x,y+1.515,kit.z,kit.yaw+p.look,p.tilt],
      ["cut-kit-tuning-arm",shoulder.x,y+kitShoulder[1],shoulder.z,kit.yaw,p.knob]);
  }
  function carryBag(g) {
    for(const z of [-.134,.141])
      g.quad([-.118,1.429,z],[-.075,1.430,z],[.186,1.002,z],[.142,.992,z],webbing);
    g.quad([-.118,1.429,-.134],[-.075,1.430,-.134],[-.075,1.430,.141],[-.118,1.429,.141],webbing);
    tapeDeck(g,.197,.958,.070);
    g.pole([.251,1.054,.102],[.289,1.02,.145],.010,"#363e43",4);
    g.pole([.289,1.02,.145],[.301,.901,.105],.011,"#363e43",4);
  }
  function carryRecorder(list,actor,groundY,t) {
    list.push(["cut-jules-recorder",actor.x,groundY,actor.z,actor.yaw,0,.009*Math.sin(t*1.75)]);
  }
  function handheld(g) {
    // A grey blimp windshield rides on two red suspension hoops, above the grip and cable.
    const cover=[
      [-.181,.010,.009,.018],[-.156,.011,.063,.058],[-.111,.011,.081,.073],
      [.143,.011,.079,.074],[.202,.011,.063,.059],[.232,.011,.013,.023]
    ];
    skin(g,cover,["#8a9490","#a5aba1","#acb2a7","#9aa69c","#8d9990","#76837e","#73817d","#82918b"]);
    // Small uneven tips on the removable pile cover break the silhouette at recording distance.
    for(let i=0;i<27;i++) {
      const a=(i*.6180339%1)*tau,z=-.106+(.262*(i*.38257%1)),u=Math.cos(a),v=Math.sin(a);
      const p=(r,along,twist)=>[(.08+r)*u-twist*v,.011+(.073+r)*v+twist*u,z+along];
      g.tri(p(-.001,-.019,-.008),p(.005,.016,0),p(-.001,.002,.009),i%3?"#95a39a":"#818f89");
    }
    for(const z of [-.119,.150]) {
      const ring=(a)=>[.080*Math.cos(a),.011+.072*Math.sin(a),z];
      for(let j=0;j<8;j++)g.pole(ring(tau*j/8),ring(tau*(j+1)/8),.007,"#697a78",4);
    }
    for(const side of [-1,1])for(const z of [-.089,.075]) {
      g.pole([0,-.123,z],[side*.076,-.028,z+.021],.008,"#b36553",5);
      g.pole([side*.076,-.028,z+.021],[side*.064,.030,z+.026],.008,"#b36553",5);
    }
    g.box(0,-.112,-.010,.045,.035,.250,enamel);
    g.pole([0,-.095,-.045],[.016,-.235,-.074],.034,"#455457",7);
    g.pole([.016,-.235,-.074],[.026,-.275,-.113],.014,"#414d51",5);
    g.pole([.026,-.275,-.113],[.047,-.273,-.210],.011,"#444f50",5);
    const warm="#b98463",light="#c89572";
    g.pole([.05,-.202,-.065],[.103,-.234,-.103],.048,warm,7);
    for(let j=0;j<3;j++)g.pole([.047,-.155-j*.020,-.063],[.001,-.159-j*.021,-.083],.016,j===0?light:warm,6);
    g.pole([.05,-.181,-.026],[.008,-.153,-.039],.020,light,6);
    g.pole([.091,-.227,-.097],[.225,-.297,-.225],.057,warm,7);
    g.pole([.202,-.286,-.206],[.307,-.345,-.315],.072,"#448d83",7);
    g.pole([.198,-.288,-.205],[.211,-.297,-.219],.075,"#82aa95",7);
    g.box(-.051,.057,-.072,.042,.006,.047,"#dbbd78");
  }
  function micView(view,camera,t,recording=false) {
    const breath=recording?.0018:.0045,forward=.53;
    const x=.211+.0021*Math.sin(t*1.36),y=-.216+breath*Math.sin(t*1.67);
    const rise=Math.sin(camera.pitch),level=Math.cos(camera.pitch);
    const center=offset(camera.x,camera.z,x,forward*level-y*rise,camera.yaw);
    view.draw("cut-field-mic",center.x,camera.y+y*level+forward*rise,center.z,camera.yaw-.18,-camera.pitch+.045,-.078);
  }
  function install(model) {
    model("cut-spoonbill",birdBody);model("cut-spoonbill-neck",birdNeck);model("cut-spoonbill-legs",birdLegs);
    model("cut-spoonbill-port",g=>birdWing(g,-1));model("cut-spoonbill-starboard",g=>birdWing(g,1));
    model("cut-spoonbill-rest",g=>distantBird(g,false,0));
    for(const [name,tip] of [["low",-.45],["level",.05],["high",.56]])
      model("cut-spoonbill-"+name,g=>distantBird(g,true,tip));
    model("cut-pump-tower",pumpTower);model("cut-pump-wheel",pumpWheel);model("cut-pump-rocker",pumpRocker);
    model("cut-pump-rod",g=>g.pole([0,.91,0],[0,7.148,0],.056,"#bbab89",5));
    model("cut-little-dot",trawler);model("cut-little-dot-wake",wake);
    model("cut-kit-body",kitBody);model("cut-kit-head",kitHead);model("cut-kit-tuning-arm",kitTuningArm);
    kitParts=null;
    model("cut-jules-recorder",carryBag);model("cut-field-mic",handheld);
  }
  function world(list,see,weather,t) {
    if(see(sources[0].site,128)) {
      const detail=see(sources[0].site,52);
      for(let i=0;i<fleet.length;i++) {
        const p=birdPose(t,weather,i);
        if(!detail) {
          const name=p.flight<.32?"rest":p.wingLift<-.16?"low":p.wingLift>.29?"high":"level";
          list.push(["cut-spoonbill-"+name,p.x,p.y,p.z,p.yaw]);
          continue;
        }
        list.push(["cut-spoonbill",p.x,p.y,p.z,p.yaw]);
        const neck=offset(p.x,p.z,0,.163,p.yaw),legs=offset(p.x,p.z,0,-.055,p.yaw);
        list.push(["cut-spoonbill-neck",neck.x,p.y+.046,neck.z,p.yaw,p.neck],
          ["cut-spoonbill-legs",legs.x,p.y-.08,legs.z,p.yaw,p.legs]);
        for(const s of [-1,1]) {
          const wing=offset(p.x,p.z,s*.135,.0,p.yaw);
          list.push([s<0?"cut-spoonbill-port":"cut-spoonbill-starboard",wing.x,p.y+.052,wing.z,p.yaw+s*p.sweep,0,s*p.wingLift]);
        }
      }
    }
    if(see(pumpBase,194)) {
      const p=windPose(t),baseY=p.y-pumpHeight;
      list.push(["cut-pump-tower",pumpBase.x,baseY,pumpBase.z,p.yaw],["cut-pump-wheel",p.x,p.y,p.z,p.yaw,0,p.turn]);
      if(see(pumpBase,66)){
        const rod=offset(pumpBase.x,pumpBase.z,p.rodX,.04,p.yaw);
        list.push(["cut-pump-rocker",pumpBase.x,baseY+6.89,pumpBase.z,p.yaw,0,p.rocker],
          ["cut-pump-rod",rod.x,baseY+p.rod,rod.z,p.yaw]);
      }
    }
    if(see(sources[2].site,240)) {
      const p=boatPose(t,weather);
      list.push(["cut-little-dot-wake",p.x,.081,p.z,p.yaw+.018*Math.sin(t*1.62)],
        ["cut-little-dot",p.x,p.y-2.16,p.z,p.yaw,p.pitch,p.roll]);
    }
    if(see(kit,74))producer(list,t);
  }

  function fill(ctx,c,points) {
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.closePath();ctx.fillStyle=c;ctx.fill();
  }
  function stroke(ctx,c,width,points) {
    ctx.beginPath();ctx.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][1]);
    ctx.strokeStyle=c;ctx.lineWidth=width;ctx.stroke();
  }
  function ellipse(ctx,x,z,rx,rz,color) {
    ctx.beginPath();ctx.ellipse(x,z,rx,rz,0,0,tau);ctx.fillStyle=color;ctx.fill();
  }
  function local(ctx,px,py,s,x,z,yaw) {
    ctx.save();ctx.translate(px(x),py(z));ctx.rotate(yaw);ctx.scale(s,-s);
  }
  function mapBird(ctx,px,py,s,p) {
    local(ctx,px,py,s,p.x,p.z,p.yaw);
    ellipse(ctx,-p.flight*.28,-p.flight*.40,.26+p.flight*.48,.48,"rgba(48,62,65,.22)");
    for(const side of [-1,1]) {
      ctx.save();ctx.translate(side*.135,0);ctx.rotate(-side*p.sweep);ctx.scale(Math.cos(p.wingLift),1);
      fill(ctx,"#e7899c",[[0,.15],[side*.45,.21],[side*1.16,.10],[side*1.20,-.01],[side*1.04,-.16],[side*.80,-.31],[side*.52,-.22],[0,-.17]]);
      fill(ctx,"#f5b2b4",[[0,.15],[side*.45,.21],[side*.83,.145],[side*.55,-.085],[0,-.16]]);
      ctx.restore();
    }
    ellipse(ctx,0,-.028,.21,.45,"#f5bcc0");
    const reach=.36+.26*p.flight;
    stroke(ctx,"#f6dfc8",.128,[[0,.16],[0,.27],[0,reach]]);
    ellipse(ctx,0,reach,.093,.102,"#d9d3b9");
    stroke(ctx,"#727972",.055,[[0,reach+.04],[0,reach+.39]]);
    ellipse(ctx,0,reach+.39,.062,.079,"#858c83");
    ctx.restore();
  }
  function mapPump(ctx,px,py,s,p) {
    local(ctx,px,py,s,pumpBase.x,pumpBase.z,p.yaw);
    const feet=[[-1.32,-1.32],[-1.32,1.32],[1.32,1.32],[1.32,-1.32],[-1.32,-1.32]];
    stroke(ctx,"#7d7d68",.15,feet);
    for(const [x,z] of feet.slice(1)) {
      ctx.fillStyle="#c3af8a";ctx.fillRect(x-.22,z-.22,.44,.44);
      stroke(ctx,"#677a79",.11,[[x,z],[0,.12]]);
    }
    stroke(ctx,"#727d74",.105,[[0,-3.5],[0,.76]]);
    fill(ctx,"#c4a58b",[[-.13,-2.04],[-.27,-3.65],[.17,-3.45],[.12,-2.64]]);
    for(let i=0;i<12;i++) {
      const angle=p.turn+i*tau/12;
      const pt=(r,a,depth)=>[r*Math.cos(a),.72+depth+.24*r*Math.sin(a)];
      fill(ctx,i===2||i===3?"#bb715a":"#d7ccb0",[pt(.78,angle,.08),pt(2.1,angle,.19),pt(2.1,angle+.38,-.06),pt(.82,angle+.29,-.04)]);
    }
    ellipse(ctx,0,.72,.21,.16,oldIron);
    ctx.restore();
  }
  function mapBoat(ctx,px,py,s,p) {
    local(ctx,px,py,s,p.x,p.z,p.yaw);
    for(const side of [-1,1]) {
      stroke(ctx,"rgba(204,219,193,.69)",.17,[[side*1.62,-6.6],[side*2.86,-9.7],[side*4.93,-14.3]]);
      stroke(ctx,"rgba(230,228,202,.66)",.22,[[side*.46,-7],[side*.23,-8.1-.26*Math.sin(p.beat)]]);
    }
    const outline=stations.map(([z,w])=>[-w,z]).concat(stations.slice().reverse().map(([z,w])=>[w,z]));
    fill(ctx,boatBlue,outline);stroke(ctx,boatCream,.23,[...outline,outline[0]]);
    fill(ctx,boatWood,outline.map(([x,z])=>[x*.89,z*.972]));
    ctx.fillStyle="#8b5145";ctx.fillRect(-1.62,.0,3.24,3.72);
    ctx.fillStyle="#be896d";ctx.fillRect(-1.46,.13,2.92,3.45);
    ctx.fillStyle="#69837d";ctx.fillRect(-1.15,3.43,2.30,.30);
    ctx.fillStyle="#d7c29a";ctx.fillRect(-.28,1.81,.55,.60);
    ellipse(ctx,.81,.7,.24,.24,"#53615b");
    for(const side of [-1,1]) {
      fill(ctx,"#778575",[[side*2.05,-1.95],[side*6.66,-3.73],[side*6.08,-4.42],[side*2.15,-2.27]]);
      stroke(ctx,"#cdc4a2",.10,[[0,-1.11],[side*6.66,-3.73],[side*1.76,-6.06]]);
      stroke(ctx,"#cc9b69",.18,[[side*1.09,-1.30],[side*6.65,-3.72]]);
      for(let i=1;i<5;i++)ellipse(ctx,side*(2.1+i*.9),-1.82-i*.37,.11,.11,"#dfad72");
    }
    ctx.fillStyle="#6d776b";ctx.fillRect(-.89,-4.11,1.78,.76);
    for(const [x,z] of [[-.85,-5.33],[.13,-5.81],[.82,-5.26]]) {
      ctx.fillStyle="#c19c65";ctx.fillRect(x-.37,z-.30,.74,.60);
    }
    ctx.restore();
  }
  function mapKit(ctx,x,y,s,t) {
    const size=Math.max(2.3,s*1.42),p=kitPose(t);
    ctx.save();ctx.translate(x,y);ctx.rotate(kit.yaw);ctx.scale(size,-size);
    fill(ctx,"#627d73",[[-.20,-.11],[.22,-.11],[.205,.07],[.15,.15],[-.15,.14],[-.21,.07]]);
    stroke(ctx,webbing,.043,[[-.12,-.10],[.12,.14]]);
    ctx.fillStyle=canvas;ctx.fillRect(-.06,.155,.28,.15);
    ctx.fillStyle="#c3b98a";ctx.fillRect(.01,.18,.16,.082);
    const handX=.19+.032*Math.sin(t*2.32);
    stroke(ctx,kitSkin,.069,[[.24,-.004],[.28,.083],[handX,.18]]);
    stroke(ctx,kitSkin,.070,[[-.23,-.009],[-.27,.12],[-.14,.095]]);
    ctx.translate(0,.051);ctx.rotate(-p.look);
    ellipse(ctx,0,.039,.115,.116,kitSkin);ellipse(ctx,0,.011,.112,.112,"#413c39");
    stroke(ctx,webbing,.030,[[-.13,.036],[-.072,-.008],[.078,-.008],[.136,.036]]);
    for(const side of [-1,1]) {
      ellipse(ctx,side*.137,.035,.039,.067,enamel);
      ellipse(ctx,side*.154,.035,.022,.040,"#c68c64");
    }
    ctx.restore();
  }
  function mapMic(ctx,x,y,s,yaw,t,recording=false) {
    const size=Math.max(3,s*1.8);
    ctx.save();ctx.translate(x,y);ctx.rotate(yaw);ctx.scale(size,-size);
    const z=.25+(recording?.009:.021)*Math.sin(t*1.67);
    stroke(ctx,"#527e70",.100,[[.198,-.024],[.252,.071]]);
    stroke(ctx,"#b98463",.069,[[.252,.071],[.201,z]]);
    stroke(ctx,"#424f50",.043,[[.204,z-.038],[.183,z+.04]]);
    stroke(ctx,"#a36753",.060,[[.186,z+.012],[.173,z+.178]]);
    ctx.translate(.166,z+.155);ctx.rotate(.13);
    ellipse(ctx,0,0,.071,.211,"#b3b8a8");ellipse(ctx,-.008,0,.055,.196,windscreen);
    stroke(ctx,"#677b76",.012,[[-.065,-.113],[.065,-.113]]);
    ctx.restore();
  }
  function map(ctx,px,py,s,weather,t,visible) {
    if(visible(px(121),py(272),19*s))
      for(let i=0;i<fleet.length;i++)mapBird(ctx,px,py,s,birdPose(t,weather,i));
    if(visible(px(pumpBase.x),py(pumpBase.z),5*s))mapPump(ctx,px,py,s,windPose(t));
    const p=boatPose(t,weather);
    if(visible(px(p.x),py(p.z),16*s))mapBoat(ctx,px,py,s,p);
  }
  window.BayCutWildlife={sources,pose,trawlerHull,blocks,install,world,map,carryRecorder,micView,mapKit,mapMic};
})();
