/* Pelican Air's Fern 3. Local +Z points through the spinner and +X to the boarding float. */
(() => {
  "use strict";
  const tau=2*Math.PI, clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
  const mix=(a,b,u)=>a+(b-a)*u;
  const salt="#ebdfbf",linen="#d9cdb0",warm="#f2e9cf",fern="#307166",pine="#315c55",deep="#2d4c49";
  const tangerine="#d97849",ochre="#e6b263",navy="#344749",steel="#8e9c94",silver="#b8c3b3";
  const rub="#444e4c",glass="#739b9b",cloth="#637d72",thread="#adba9d",lamp="#ffdf9d";
  const dimensions=Object.freeze({span:11.16,nose:3.07,tail:-4.53,height:3.02,floatX:1.02,floatHalfWidth:.32});
  const seats=Object.freeze({pilot:{x:-.295,y:1.61,z:.28},guest:{x:.295,y:1.61,z:.28}});
  const entry=Object.freeze({float:{x:1.02,y:.55,z:.13},step:{x:.81,y:.97,z:.16},door:{x:.64,y:1.26,z:.20}});
  const propAt=[0,1.89,2.905],doorAt=[.642,1.26,.72],tailHinge=[0,1.86,-4.18];
  const key=id=>"fern3/"+id;

  // The painter's square-ended stencil is mesh ink, so markings survive a lost graphics context.
  const glyph={
    " ":[1,""],"-":[2,"02 22"],"3":[3,"04 24 34 33 22 12 22 31 30 20 00"],
    "7":[3,"04 34 10"],A:[3,"00 14 24 30|12 22"],B:[3,"00 04 24 33 22 02|22 31 20 00"],
    C:[3,"34 14 03 01 10 30"],E:[3,"34 04 00 30|02 22"],F:[3,"00 04 34|02 22"],I:[1,"04 00"],L:[3,"04 00 30"],
    N:[3,"00 04 30 34"],P:[3,"00 04 24 33 22 02"],R:[3,"00 04 24 33 22 02|12 30"],
    S:[3,"34 14 03 12 22 31 20 00"]
  };
  function stroke(g,project,a,b,width,color){
    const x=b[0]-a[0],y=b[1]-a[1],m=width*.5/(Math.hypot(x,y)||1),dx=-y*m,dy=x*m;
    g.quad(project(a[0]+dx,a[1]+dy),project(b[0]+dx,b[1]+dy),
      project(b[0]-dx,b[1]-dy),project(a[0]-dx,a[1]-dy),color);
  }
  function stencil(g,project,word,mid,base,width,height,ink){
    const chars=Array.from(word,k=>glyph[k]),units=chars.reduce((n,item)=>n+item[0]+1.14,-1.14);
    const step=width/units;let origin=mid-width*.5;
    for(const [wide,runs] of chars){
      for(const run of runs.split("|")){
        const knots=run.trim().split(" ").filter(Boolean).map(p=>[origin+Number(p[0])*step,base+Number(p[1])*height/4]);
        for(let i=1;i<knots.length;i++)stroke(g,project,knots[i-1],knots[i],Math.min(step*.68,height*.13),ink);
      }
      origin+=step*(wide+1.14);
    }
  }
  function cap(g,ring,color){
    for(let j=1;j<ring.length-1;j++)g.tri(ring[0],ring[j],ring[j+1],color);
  }
  function skin(g,rings,colors,lights){
    for(let k=1;k<rings.length;k++)for(let j=0;j<rings[k].length;j++){
      const n=(j+1)%rings[k].length;
      g.quad(rings[k-1][j],rings[k-1][n],rings[k][n],rings[k][j],colors[j],lights?lights[j]:1);
    }
  }
  function section([z,w,base,cap]){
    const h=cap-base;
    return [[-.60*w,cap,z],[.60*w,cap,z],[.94*w,cap-.08*h,z],[w,base+.62*h,z],
      [w,base+.33*h,z],[.72*w,base+.09*h,z],[.33*w,base,z],[-.33*w,base,z],
      [-.72*w,base+.09*h,z],[-w,base+.33*h,z],[-w,base+.62*h,z],[-.94*w,cap-.08*h,z]];
  }
  const tailSections=[[-4.17,.086,1.80,2.00],[-3.56,.15,1.68,2.03],[-2.44,.296,1.49,2.10],
    [-1.59,.443,1.32,2.20],[-1.10,.545,1.22,2.28],[-.93,.58,1.20,2.29]];
  const cowls=[[1.29,.583,1.21,1.99],[1.53,.565,1.24,1.98],[2.09,.495,1.38,1.96],
    [2.46,.435,1.49,1.94],[2.68,.363,1.57,1.95],[2.80,.245,1.69,1.96]];
  function stripeHeight(z){return 1.69+clamp((-z-.59)/3.57)*.222;}
  function fuselage(g,near){
    const colors=[warm,salt,salt,salt,fern,fern,deep,pine,fern,salt,salt,salt];
    const levels=[1.04,1.00,.98,.96,.97,.86,.8,.82,.87,.93,.97,1.02];
    for(const sections of [tailSections,cowls]){
      const rings=sections.map(section);skin(g,rings,colors,levels);
      cap(g,rings[0],sections===cowls?deep:fern);cap(g,rings.at(-1),sections===cowls?pine:linen);
      for(const side of [-1,1]){
        for(let i=1;i<sections.length;i++){
          const [za,wa,ba,ta]=sections[i-1],[zb,wb,bb,tb]=sections[i];
          const sidePoint=(z,w,base,top,h)=>[side*(w+.003),clamp(h,base+.25*(top-base),top-.14*(top-base)),z];
          const a=(h)=>sidePoint(za,wa,ba,ta,h),b=(h)=>sidePoint(zb,wb,bb,tb,h);
          const ha=stripeHeight(za),hb=stripeHeight(zb),thick=z=>clamp(.077+(z+1)*.013,.026,.09);
          g.quad(a(ha),b(hb),b(hb+thick(zb)),a(ha+thick(za)),tangerine);
          g.quad(a(ha+thick(za)),b(hb+thick(zb)),b(hb+thick(zb)+.019),a(ha+thick(za)+.019),ochre);
        }
      }
    }
    // Clockwise seat-side view reads nose to tail on starboard and tail to nose on port.
    if(near)for(const side of [-1,1]){
      const pilotMark=(u,h)=>[side*(.444+(.545-.444)*(u*side+1.59)/.49+.008),h,u*side];
      stencil(g,pilotMark,"3",-1.37*side,1.80,.13,.20,fern);
      for(let j=0;j<3;j++){
        const z=1.55+j*.11,x=.567-(z-1.53)*.125;
        g.quad([side*x,1.82,z-.018],[side*(x+.004),1.82,z+.04],
          [side*(x+.009),1.91,z+.082],[side*(x+.007),1.91,z+.022],deep);
      }
      g.pole([side*.296,1.455,1.84],[side*.36,1.369,1.66],.068,rub,7);
      g.pole([side*.36,1.369,1.66],[side*.38,1.359,1.59],.061,"#514a40",7);
    }
    const nose=z=>[0,1.885,z];
    g.pole(nose(2.72),nose(2.90),.13,steel,near?10:6);
    const cone=[];
    for(const [z,r] of [[2.872,.154],[2.943,.151],[3.025,.105],[3.07,.022]]){
      const ring=[];for(let j=0;j<10;j++){const a=j*tau/10;ring.push([r*Math.cos(a),1.89+r*Math.sin(a),z]);}
      cone.push(ring);
    }
    skin(g,cone,Array(10).fill(tangerine),[.98,1.03,1.04,1.06,1.01,.95,.88,.84,.85,.93]);
    cap(g,cone.at(-1),ochre);
  }
  function pontoons(g,near){
    const sections=[[-2.59,.075,.29,.445],[-2.43,.227,.215,.51],[-1.74,.288,.164,.55],
      [-.45,.307,.11,.55],[-.425,.312,0,.55],[.07,.320,0,.55],[1.00,.309,.026,.545],
      [1.64,.279,.087,.545],[2.16,.204,.20,.553],[2.53,.069,.366,.55],[2.62,.014,.464,.521]];
    const metalTones=[linen,steel,"#73938d",deep,pine,"#79958c",silver,salt];
    for(const side of [-1,1]){
      const center=side*dimensions.floatX;
      const rings=sections.map(([z,w,low,high])=>[[center-w*.76,high,z],[center+w*.76,high,z],[center+w,high-.055,z],
        [center+w,low+(high-low)*.33,z],[center,low,z],[center-w*.77,low+(high-low)*.24,z],
        [center-w,low+(high-low)*.33,z],[center-w,high-.055,z]]);
      skin(g,rings,metalTones,[1.04,.97,.91,.91,.82,.84,.90,.98]);cap(g,rings[0],pine);cap(g,rings.at(-1),silver);
      for(const sign of [-1,1]){
        for(let j=1;j<sections.length;j++){
          const [za,wa,la,ha]=sections[j-1],[zb,wb,lb,hb]=sections[j];
          const a=[center+sign*(wa+.003),ha-.092,za],b=[center+sign*(wb+.003),hb-.092,zb];
          g.quad(a,b,[b[0],Math.max(lb+.025,b[1]-.042),zb],[a[0],Math.max(la+.025,a[1]-.042),za],fern);
        }
      }
      if(near){
        for(const z of [-1.68,-.96,-.13,.76,1.49]){
          g.box(center,.553,z,.413,.008,.019,"#a0a99a");
          for(const x of [-.186,.186])g.box(center+x,.558,z,.027,.005,.025,steel);
        }
        for(const z of [-1.38,.16,1.18]){
          g.box(center,.558,z,.253,.011,.337,steel);g.box(center,.565,z,.218,.007,.292,"#c2c5ad");
          g.pole([center-.032,.568,z+.043],[center+.032,.568,z+.043],.009,deep,4);
        }
        for(const z of [-1.89,1.69]){
          g.box(center,.571,z,.068,.036,.11,steel);
          g.pole([center,.588,z-.092],[center,.588,z+.092],.016,deep,5);
        }
      }
    }
    for(const z of [-1.28,.98]){
      const rear=z<0;
      g.pole([-.98,.509,z],[.98,.509,z],.056,steel,near?6:4);
      for(const side of [-1,1]){
        g.pole([side*.98,.55,z],[side*.465,1.30,rear?-.70:.77],.050,linen,near?6:4);
        if(near){
          g.pole([side*1.04,.546,z],[side*.52,1.31,rear?.38:-.48],.029,steel,5);
          g.box(side*.98,.553,z,.208,.066,.18,pine);
        }
      }
    }
    g.box(.82,.968,.15,.329,.049,.293,navy);
    if(near)for(let j=0;j<5;j++)g.box(.82,.998,.036+j*.055,.268,.012,.017,silver);
    for(const z of [.038,.254])g.pole([.667,1.249,z],[.84,.968,z],.025,steel,5);
  }
  // Each half wing has a round nose, a fabric crown and an open hinge at the outboard trailing edge.
  const wingStations=[
    [0,1.18,-.26,-.75,2.685],[.63,1.18,-.26,-.75,2.69],[1.55,1.14,-.25,-.746,2.711],
    [2.33,1.107,-.24,-.725,2.731],[3.52,1.065,-.24,-.704,2.731],[4.76,1.018,-.24,-.674,2.731],
    [5.03,1.004,-.24,-.657,2.731],[5.24,.958,-.225,-.589,2.73],[5.44,.862,-.16,-.481,2.729],
    [5.55,.687,-.034,-.344,2.731],[5.58,.449,.156,-.165,2.747]
  ];
  const wingHingeX=2.33,wingEndX=5.03,wingHingeY=2.758,wingHingeZ=-.24;
  function wingSlice(side,[x,front,hinge,trailing,y]){
    const dz=front-hinge,p=(h,z)=>[side*x,h,z],tip=1-.69*clamp((x-5.18)/.4);
    return {spine:[p(y+.027,hinge),p(y+.125*tip,hinge+.36*dz),p(y+.159*tip,hinge+.70*dz),
      p(y+.145*tip,hinge+.89*dz),p(y+.095*tip,front),p(y+.052*tip,front+.015*tip),
      p(y+.010,hinge+.92*dz),p(y-.005,hinge+.43*dz),p(y+.011,hinge)],
      trailing:[p(y+.027,hinge),p(y+.012,trailing),p(y-.012,trailing+.013),p(y+.011,hinge)]};
  }
  function wingTop(x,z){
    let i=1;while(i<wingStations.length-1&&wingStations[i][0]<Math.abs(x))i++;
    const a=wingStations[i-1],b=wingStations[i],u=clamp((Math.abs(x)-a[0])/(b[0]-a[0]));
    const wing=wingSlice(1,a.map((v,j)=>mix(v,b[j],u))).spine;
    let k=1;while(k<4&&wing[k][2]<z)k++;
    return mix(wing[k-1][1],wing[k][1],clamp((z-wing[k-1][2])/(wing[k][2]-wing[k-1][2])));
  }
  function wing(g,near){
    for(const side of [-1,1]){
      const rings=wingStations.map(s=>wingSlice(side,s));
      for(let i=1;i<rings.length;i++){
        const x=wingStations[i-1][0],out=x>=5.03,paint=out?tangerine:salt;
        skin(g,[rings[i-1].spine,rings[i].spine],[paint,paint,paint,out?ochre:warm,out?tangerine:linen,out?tangerine:linen,out?ochre:linen,out?ochre:linen,deep],
          [.99,1.04,1.04,1.02,1,.95,.9,.85,.85]);
        if(x<wingHingeX||x>=wingEndX||!near)
          skin(g,[rings[i-1].trailing,rings[i].trailing],[out?tangerine:linen,out?tangerine:linen,out?ochre:linen,steel],[1,.89,.86,.91]);
      }
      cap(g,rings.at(-1).spine,tangerine);cap(g,rings.at(-1).trailing,tangerine);
      const strutEnd=[side*3.70,2.715,.40];
      g.pole([side*.526,1.31,.32],strutEnd,.048,silver,near?6:4);
      if(near){
        g.pole([side*.526,1.33,-.53],[side*3.70,2.717,-.162],.040,steel,5);
        g.pole([side*2.15,2.04,.37],[side*2.15,2.73,.35],.021,steel,4);
        g.pole([side*2.15,2.01,-.347],[side*2.15,2.73,-.16],.021,steel,4);
        const upper=(u,z)=>[side*u,wingTop(u,z)+.004,z];
        for(const x of [2.62,2.98,3.36,3.74,4.12,4.50,4.88]){
          g.quad(upper(x-.006,.78),upper(x+.006,.78),upper(x+.006,.12),upper(x-.006,.12),"#c9c5a9");
        }
        for(const x of [4.81,4.92]){
          g.quad(upper(x,.92),upper(x+.048,.916),upper(x+.048,.03),upper(x,.034),fern);
          g.quad([side*x,2.729,.89],[side*(x+.05),2.729,.89],[side*(x+.05),2.728,-.17],[side*x,2.728,-.17],fern);
        }
        if(side===1){
          // The registration sits on the crown of the outer wing, with the individual letters following its fabric.
          const face=(x,z)=>[x,wingTop(x,z)+.006,z];
          stencil(g,face,"SB-73F",3.00,.18,2.75,.52,fern);
        }else{
          const patch=(u,z)=>[-u,wingTop(u,z)+.006,z];
          g.quad(patch(3.76,.78),patch(4.11,.73),patch(4.45,.17),patch(4.24,.23),tangerine);
          g.quad(patch(3.42,.74),patch(3.62,.71),patch(4.05,.16),patch(3.94,.20),ochre);
        }
        g.box(side*5.51,2.801,.507,.115,.070,.137,side<0?"#aa514c":"#639c79");
        g.pole([side*1.42,2.722,.96],[side*1.42,2.717,1.31],.014,steel,5);
      }
    }
    if(near){
      for(const x of [-.92,.92])g.cyl(x,2.856,.47,.072,.079,.037,8,steel);
      g.pole([0,2.84,-.28],[0,3.004,-.374],.014,deep,4);
    }
  }
  function aileron(g,side){
    const cuts=[[0,-.725],[1.19,-.704],[2.43,-.674],[2.70,-.657]];
    const profiles=cuts.map(([u,z])=>[[side*u,-.002,0],[side*u,-.015,z-wingHingeZ],
      [side*u,-.042,z-wingHingeZ+.012],[side*u,-.025,.003]]);
    skin(g,profiles,[linen,steel,linen,deep],[1,.88,.87,.87]);cap(g,profiles[0],steel);cap(g,profiles.at(-1),steel);
    for(let i=0;i<8;i++){
      const u=.17+i*.345,z=-.431+u*.024;
      g.quad([side*u,.001,-.022],[side*(u+.012),.001,-.022],[side*(u+.012),-.011,z],[side*u,-.011,z],"#c6bea3");
    }
    for(const u of [2.47,2.58])g.quad([side*u,.002,-.01],[side*(u+.053),.002,-.01],
      [side*(u+.053),-.011,-.412],[side*u,-.011,-.412],fern);
  }
  const tailWidth=1.74,elevatorY=1.972,elevatorZ=-3.92;
  function tailPlane(g,near){
    const sections=[[0,-3.025,-4.37],[.50,-3.14,-4.37],[1.34,-3.47,-4.34],[1.60,-3.62,-4.27],[tailWidth,-3.80,-4.07]];
    for(const side of [-1,1]){
      const rings=sections.map(([x,u,v])=>[[x*side,1.955,elevatorZ],[x*side,1.998,mix(elevatorZ,u,.72)],
        [x*side,1.970,u],[x*side,1.939,u-.019],[x*side,1.936,elevatorZ]]);
      skin(g,rings,[salt,warm,linen,linen,pine],[1.02,1.04,.96,.89,.86]);cap(g,rings.at(-1),linen);
      if(!near){
        g.quad([side*.09,1.961,elevatorZ],[side*tailWidth,1.961,elevatorZ],[side*1.60,1.952,-4.27],[side*.09,1.952,-4.37],fern);
      }else{
        g.pole([side*.12,1.713,-3.39],[side*1.27,1.944,-3.73],.021,steel,4);
        for(let i=0;i<2;i++){
          const x=1.29+i*.105;g.quad([side*x,1.985,-3.61],[side*(x+.058),1.985,-3.61],
            [side*(x+.058),1.976,-3.90],[side*x,1.976,-3.90],tangerine);
        }
      }
    }
    const fin=[[0,1.91,-3.03],[0,2.19,-3.31],[0,2.84,-3.64],[0,2.99,-3.79],[0,3.02,-4.03],[0,3.004,-4.174],[0,1.91,-4.174]];
    const shifted=(p,x)=>[x,p[1],p[2]];
    for(const side of [-1,1]){
      const ring=fin.map(p=>shifted(p,side*.041));cap(g,ring,fern);
      const face=(z,y)=>[side*.044,y,side*z];
      g.quad(shifted([0,2.64,-3.55],side*.045),shifted([0,2.80,-3.63],side*.045),
        shifted([0,2.86,-4.174],side*.045),shifted([0,2.71,-4.174],side*.045),tangerine);
      g.quad(shifted([0,2.60,-3.53],side*.046),shifted([0,2.64,-3.55],side*.046),
        shifted([0,2.71,-4.174],side*.046),shifted([0,2.67,-4.174],side*.046),ochre);
      if(near)stencil(g,face,"3",side*-3.865,2.14,.25,.37,salt);
    }
    for(let i=0;i<fin.length;i++){const a=fin[i],b=fin[(i+1)%fin.length];g.quad(shifted(a,-.041),shifted(a,.041),shifted(b,.041),shifted(b,-.041),i<4?salt:pine);}
    if(!near)g.quad([0,1.91,-4.178],[0,3.004,-4.178],[0,2.972,-4.41],[0,2.00,-4.53],fern);
  }
  function elevator(g){
    for(const side of [-1,1]){
      const profiles=[[.10,-4.37],[.50,-4.37],[1.34,-4.34],[1.60,-4.27],[tailWidth,-4.07]].map(([x,z])=>[
        [side*x,-.014,.001],[side*x,-.023,z-elevatorZ],[side*x,-.044,z-elevatorZ+.015],[side*x,-.035,.002]]);
      skin(g,profiles,[fern,deep,pine,linen],[1.04,.88,.9,.92]);cap(g,profiles[0],pine);cap(g,profiles.at(-1),fern);
      for(const x of [1.29,1.395])g.quad([side*x,-.011,-.016],[side*(x+.058),-.011,-.016],
        [side*(x+.058),-.018,-.387],[side*x,-.018,-.387],tangerine);
    }
  }
  function rudder(g){
    const profile=[[.037,.05,0],[.037,1.145,0],[.022,1.117,-.19],[.021,1.04,-.262],[.020,.185,-.35],[.028,.093,-.328]];
    for(const s of [-1,1]){
      const points=profile.map(([x,y,z])=>[s*x,y,z]);cap(g,points,fern);
      g.quad([s*.039,.853,-.001],[s*.039,1.005,-.001],[s*.029,1.03,-.24],[s*.029,.88,-.26],tangerine);
      g.quad([s*.040,.815,-.001],[s*.040,.85,-.001],[s*.030,.876,-.26],[s*.030,.839,-.266],ochre);
    }
    for(let i=0;i<profile.length;i++){
      const a=profile[i],b=profile[(i+1)%profile.length];
      g.quad(a,b,[-b[0],b[1],b[2]],[-a[0],a[1],a[2]],pine);
    }
  }
  function sideDoor(g,side,at){
    const p=(out,y,z)=>at(side*(.643+out),y,z);
    function strip(lo,hi,col){
      g.quad(p(0,lo,-.37),p(0,lo,.71),p(0,hi,.71),p(0,hi,-.37),col);
      g.quad(p(-.031,lo,-.37),p(-.031,lo,.71),p(-.031,hi,.71),p(-.031,hi,-.37),lo>1.7?linen:cloth);
    }
    strip(1.259,1.525,fern);strip(1.525,1.694,salt);strip(1.694,1.777,tangerine);
    strip(1.777,1.797,ochre);strip(1.797,1.993,salt);
    const points=[p(0,1.998,-.37),p(-.076,2.623,-.33),p(-.095,2.66,.547),
      p(-.025,2.23,.71),p(0,1.998,.71)];
    for(let i=0;i<points.length;i++)g.pole(points[i],points[(i+1)%points.length],i===4?.031:.027,i===4?navy:salt,5);
    g.pole(p(.007,1.951,-.276),p(.007,1.941,-.129),.017,deep,6);
    for(const z of [-.368,.711])g.pole(p(.002,1.277,z),p(.002,1.989,z),.011,deep,4);
    // Two fine reflections leave the open window area visible across both sides of the cabin.
    g.quad(p(-.069,2.491,-.306),p(-.080,2.592,-.307),p(-.076,2.59,-.14),p(-.067,2.524,-.169),glass);
    const paint=(u,y)=>p(.004,y,side*u);
    stencil(g,paint,"FERN 3",.178*side,1.814,.80,.122,deep);
    stencil(g,paint,"AIR",.250*side,1.413,.30,.076,salt);
    g.pole(p(-.036,1.778,-.21),p(-.041,1.778,.22),.023,deep,6);
    g.pole(p(-.04,1.78,.23),p(-.031,1.824,.30),.019,deep,5);
  }
  function cabin(g,near){
    const rows=[[-.95,.585,1.20],[-.37,.639,1.137],[.71,.639,1.13],[1.29,.584,1.21]];
    for(let i=1;i<rows.length;i++){
      const [a,wa,ha]=rows[i-1],[b,wb,hb]=rows[i];
      for(const side of [-1,1]){
        const ap=(q,y)=>[side*(wa+q),y,a],bp=(q,y)=>[side*(wb+q),y,b];
        g.quad(ap(-wa*.55,ha),bp(-wb*.55,hb),bp(-.084,1.184),ap(-.084,1.188),pine,.87);
        g.quad(ap(-.084,1.188),bp(-.084,1.184),bp(0,1.259),ap(0,1.259),fern,.93);
        if(i!==2||!near){
          for(const [lo,hi,col] of [[1.259,1.525,fern],[1.525,1.694,salt],[1.694,1.777,tangerine],
            [1.777,1.797,ochre],[1.797,1.993,salt]])
            g.quad(ap(0,lo),bp(0,lo),bp(0,hi),ap(0,hi),col);
        }
      }
      g.quad([-.45*wa,ha,a],[.45*wa,ha,a],[.45*wb,hb,b],[-.45*wb,hb,b],pine,.81);
    }
    const roof=[[-.53,2.643,-.80],[.53,2.643,-.80],[.503,2.654,.79],[-.503,2.654,.79]];
    cap(g,roof,near?cloth:fern);
    g.quad([-.55,2.677,-.84],[.55,2.677,-.84],[.53,2.684,.823],[-.53,2.684,.823],warm);
    for(const side of [-1,1]){
      const p=(x,y,z)=>[side*x,y,z];
      // Windows wrap behind the bench. Only their posts and narrow gaskets are opaque in the near model.
      g.quad(p(.579,1.99,-.951),p(.64,1.995,-.37),p(.565,2.627,-.33),p(.523,2.454,-.907),linen);
      const rearScreen=[p(.583,2.048,-.846),p(.617,2.051,-.444),p(.560,2.544,-.407),p(.533,2.399,-.815)];
      cap(g,rearScreen,near?"#536f70":glass);
      g.quad(p(.61,2.105,-.65),p(.624,2.063,-.47),p(.569,2.481,-.428),p(.562,2.453,-.516),"#839e98");
      g.pole(p(.59,2.004,1.304),p(.503,2.654,.797),.039,deep,near?6:4);
      g.pole(p(.599,2.006,1.302),p(.517,2.653,.792),.026,salt,near?6:4);
      g.pole(p(.637,1.981,.72),p(.59,2.004,1.304),.035,salt,near?6:4);
      g.pole(p(.545,2.66,.54),p(.504,2.66,.797),.033,salt,5);
      g.pole(p(.547,2.651,.548),p(.625,2.230,.717),.024,linen,5);
      g.pole(p(.626,2.23,.72),p(.635,1.984,.72),.024,salt,5);
      g.quad(p(.57,1.99,-.961),p(.512,2.48,-.906),p(.50,2.663,-.797),p(.41,2.223,-1.06),salt);
      if(near){
        g.pole(p(.54,2.668,-.798),p(.50,2.67,.788),.033,salt,6);
        g.pole(p(.523,2.443,-.909),p(.54,2.668,-.798),.030,deep,5);
        g.box(side*.636,1.31,.178,.038,.063,1.06,pine);
        for(const h of [1.398,1.897])g.box(side*.646,h,.711,.061,.068,.047,steel);
      }else{
        g.quad(p(.64,1.99,-.37),p(.632,1.99,.72),p(.544,2.646,.55),p(.565,2.626,-.33),glass);
        g.quad(p(.632,1.99,.72),p(.59,2.005,1.304),p(.503,2.654,.797),p(.544,2.646,.55),glass);
      }
    }
    if(near){
      sideDoor(g,-1,(x,y,z)=>[x,y,z]);
      g.box(0,1.244,.205,1.223,.033,2.13,deep);
      g.box(0,1.274,-.70,1.07,.033,.47,linen);
      g.box(0,1.774,-.889,1.060,.892,.063,cloth);
      g.quad([-.59,2.004,1.304],[.59,2.004,1.304],[.57,2.039,1.272],[-.57,2.039,1.272],steel);
      g.pole([0,2.01,1.313],[0,2.663,.783],.021,navy,6);
      g.pole([-.467,2.016,1.30],[-.177,2.058,1.266],.010,rub,4);
      g.pole([-.177,2.058,1.266],[.024,2.089,1.240],.009,rub,4);
      g.quad([-.491,2.539,.881],[-.482,2.595,.835],[-.256,2.594,.836],[-.351,2.570,.857],"#a8bbb0");
      g.quad([.402,2.588,.844],[.368,2.621,.817],[.477,2.623,.815],[.486,2.596,.837],glass);
      for(const x of [-.295,.295]){
        g.box(x,1.447,.278,.227,.34,.237,steel);g.box(x,1.550,.282,.456,.112,.456,navy);
        g.box(x,1.587,.297,.428,.046,.421,cloth);
        g.quad([x-.215,1.61,.066],[x+.215,1.61,.066],[x+.209,1.993,-.038],[x-.209,1.993,-.038],cloth);
        g.quad([x-.209,1.993,-.038],[x+.209,1.993,-.038],[x+.209,1.979,-.100],[x-.209,1.979,-.100],navy);
        for(const s of [-1,1])g.pole([x+s*.212,1.604,.075],[x+s*.208,1.983,-.033],.012,thread,5);
      }
      // The two actual seat silhouettes can be omitted independently while somebody is boarding.
      g.box(0,1.675,.975,1.03,.289,.17,navy);g.box(0,1.837,.990,1.09,.037,.213,deep);
    }else{
      g.quad([-.59,2.004,1.304],[.59,2.004,1.304],[.503,2.654,.797],[-.503,2.654,.797],glass);
      g.pole([0,2.013,1.308],[0,2.65,.798],.021,linen,4);
    }
  }
  function person(g,side,player=false,reader=false){
    const x=side*.295,skin=reader?"#a37857":player?"#ac7252":"#ae7755",shirt=reader?"#d1ae74":player?"#368a81":"#426579";
    const hair=player?"#473e37":"#4e4c46",pants=player?"#4c6267":"#565950",headset=player?deep:"#465f53";
    const p=(u,v,w)=>[x+u,1.61+(v-1.61)*(player?1:.80),w+(player?0:.052)];
    const shoulder=y=>[p(-.152,y,-.067),p(.152,y,-.067),p(.184,y,.010),p(.150,y,.165),p(-.15,y,.165),p(-.184,y,.010)];
    const waist=[p(-.13,1.674,-.025),p(.13,1.674,-.025),p(.143,1.674,.051),p(.134,1.674,.200),p(-.132,1.674,.200),p(-.143,1.674,.051)];
    const upper=shoulder(2.116);skinTorso(g,waist,upper,shirt);
    g.box(...p(0,1.659,.218),.303,.100,.243,pants);
    g.pole(p(0,2.095,.035),p(0,2.203,.037),.068,skin,6);
    const head=[
      [2.166,.076,.077,.067],[2.221,.119,.103,.054],[2.352,.132,.117,.039],[2.411,.122,.109,.024],[2.454,.083,.073,.016]
    ].map(([h,w,d,z])=>[p(-w*.62,h,z+d),p(w*.62,h,z+d),p(w,h,z+.026),p(w*.84,h,z-d*.77),
      p(w*.45,h,z-d),p(-w*.53,h,z-d),p(-w*.89,h,z-d*.73),p(-w,h,z+.031)]);
    for(let i=1;i<head.length;i++)skinTorso(g,head[i-1],head[i],i>2?hair:skin);
    cap(g,head.at(-1),hair);
    if(!player&&!reader){
      g.pole(p(-.026,2.348,-.065),p(-.038,2.203,-.114),.046,hair,8);
      g.pole(p(-.03,2.318,-.076),p(-.032,2.300,-.083),.045,"#74725d",7);
      g.quad(p(.066,1.955,.180),p(.129,1.955,.180),p(.129,2.034,.175),p(.066,2.034,.175),"#526f79");
      g.box(...p(-.079,2.049,.171),.050,.018,.006,ochre);
    }
    g.tri(p(-.024,2.307,.146),p(.028,2.307,.146),p(.005,2.259,.186),skin);
    g.pole(p(-.121,2.34,.092),p(.122,2.34,.092),.012,deep,6);
    for(const d of [-1,1]){
      g.box(...p(d*.055,2.331,.154),.083,.038,.018,player?navy:"#59685d");
      g.box(...p(d*.127,2.32,.036),.046,.091,.085,headset);
      g.pole(p(d*.12,2.358,.032),p(d*.086,2.455,.022),.012,headset,5);
      const driving=side<0,elbow=p(d*.164,1.886,driving?.222:.093),hand=p(d*(driving?.14:.083),driving?1.920:1.776,driving?.586:.326);
      g.pole(p(d*.155,2.071,.042),elbow,.063,shirt,7);g.pole(elbow,hand,.043,skin,6);
      g.box(...hand,.074,.065,.095,skin);
      const knee=p(d*.105,1.59,.418),ankle=p(d*.114,1.307,.494);
      g.pole(p(d*.089,1.651,.182),knee,.067,pants,7);g.pole(knee,ankle,.044,pants,6);
      g.box(...ankle,.112,.068,.185,rub);
    }
    g.pole(p(-.085,2.457,.022),p(.085,2.457,.022),.015,rub,5);
    g.pole(p(.143,2.296,.045),p(.064,2.224,.158),.007,navy,4);
    g.quad(p(-.125,2.10,.146),p(-.077,2.11,.147),p(.119,1.737,.201),p(.071,1.732,.202),navy);
  }
  function skinTorso(g,a,b,color){
    for(let i=0;i<a.length;i++){const j=(i+1)%a.length;g.quad(a[i],a[j],b[j],b[i],color,.91+.085*Math.cos(i*.8));}
    cap(g,b,color);
  }
  function propeller(g){
    for(const sign of [-1,1]){
      const p=(x,y,z)=>[x*sign,y*sign,z];
      const blade=[[.008,.074,-.023],[-.052,.198,-.039],[-.063,.350,-.029],[-.013,.783,-.012],
        [.043,.987,.001],[.097,1.015,.005],[.135,.975,.006],[.120,.795,.008],[.092,.363,.030],[.066,.138,.048]];
      cap(g,blade.map(([x,y,z])=>p(x,y,z)),navy);
      g.quad(p(-.006,.810,-.009),p(.119,.823,.011),p(.128,.898,.012),p(.012,.899,-.005),ochre);
      g.quad(p(.020,.927,-.003),p(.130,.927,.009),p(.135,.972,.009),p(.043,.985,.005),warm);
      g.pole(p(.005,.081,0),p(.008,.326,-.008),.027,steel,6);
    }
  }
  function propWash(g){
    for(const sign of [-1,1]){
      const p=(a,r,z=0)=>[sign*r*Math.cos(a),sign*r*Math.sin(a),z];
      for(let i=0;i<7;i++){
        const a=.55+i*.139,b=a+.139,ink=i<2?"#343b3b":i<4?"#65706a":"#969e91";
        const start=.74-i*.033,end=start-.033;
        g.quad(p(a,start),p(a,.981),p(b,.981),p(b,end),ink);
        g.quad(p(a,.949,.003),p(a,1.009,.003),p(b,1.009,.003),p(b,.949,.003),i<3?"#5b665d":"#b0b69f");
      }
    }
  }
  function waterRudder(g){
    const p=[[.014,.03,.026],[.014,.02,-.174],[.014,-.154,-.375],[.014,-.420,-.349],[.014,-.388,-.145],[.014,-.128,.023]];
    for(const side of [-1,1])cap(g,p.map(([x,y,z])=>[side*x,y,z]),steel);
    for(let i=0;i<p.length;i++){
      const a=p[i],b=p[(i+1)%p.length];
      g.quad(a,b,[-b[0],b[1],b[2]],[-a[0],a[1],a[2]],i<2?silver:deep);
    }
    g.pole([0,.023,.028],[0,-.167,.021],.032,deep,5);
  }
  function lampGlass(g){
    for(const side of [-1,1])g.box(side*5.538,2.813,.507,.088,.053,.096,side<0?"#ff8b77":"#b3edb7");
    g.box(0,2.862,-4.388,.058,.038,.051,"#ffdfab");
  }
  function buildWake(fast,phase){
    const patches=[];
    const add=(v,color)=>patches.push({v,top:v.map(([x,y,z])=>[x,z]),color});
    for(const side of [-1,1])for(const out of [-1,1]){
      const outer=side===out,start=side*1.02+out*.245;
      const length=fast?(outer?9.2:5.55):(outer?4.65:3.05),spread=outer?(fast?2.09:.94):.57;
      const at=(t,offset)=>{
        const flutter=Math.sin(16*t+phase*.78+side*1.4+out)*t*.060;
        const x=start+out*spread*t*(1.62-.62*t)+flutter;
        return [x+out*offset,.052+.012*Math.sin(8*t+side+phase),.71-t*length];
      };
      // Water rolls away from each bow. The two inboard washes dissolve before crossing.
      for(let i=0;i<14;i++){
        if(i>8&&(i+phase+side+out+4)%4===0)continue;
        const a=i/14,b=(i+.98-(i<4?0:.15+.28*Math.sin(i+phase)**2))/14;
        const peak=mix(a,b,.61),w=(fast?.154:.098)*(outer?1:.78)*(.17+.83*Math.sin(Math.PI*(.12+.84*a)));
        const tint=i<5?"#d5ded1":i<9?"#aec3b9":"#8ea9a2";
        if(i<6)add([at(a,-w*.12),at(a,w*.30),at((i+1)/14,w*.26),at((i+1)/14,-w*.08)],"#6c8e8c");
        add([at(a,0),at(a,w*.23),at(peak,w),at(peak,w*.46)],tint);
        add([at(peak,w*.46),at(peak,w),at(b,w*.74),at(b,w*.55)],tint);
        if(i<9&&i%2===(phase+1)%2)add([at(peak,-w*.2),at(peak+.012,-w*.45),at(b+.023,-w*.22)],"#b9cec2");
      }
      if(fast&&outer)for(let i=0;i<8;i++){
        const z=.70-i*.31+.10*Math.cos(i+phase),x=side*(1.22+.054*i),h=.14+.18*Math.sin(.76*i+1.8*phase)**2;
        add([[x,.067,z+.12],[x+side*(.16+.032*i),h,z-.22],[x+side*.08,.068,z-.29]],"#d1dfd5");
      }
      if(fast&&!outer)for(let i=0;i<5;i++){
        const x=side*(.70-i*.08),z=-2.48-i*.38-.24*Math.cos(i+phase);
        add([[x,.052,z],[x-side*.10,.054,z-.26],[x+side*.045,.055,z-.52]],"#bccdc2");
      }
    }
    return patches;
  }
  const wakes={taxi:[0,1,2].map(n=>buildWake(false,n)),step:[0,1,2].map(n=>buildWake(true,n))};
  function disturbance(g,patches){
    for(const {v,color} of patches){if(v.length===3)g.tri(...v,color);else g.quad(...v,color);}
  }
  function distant(g){
    const light=[1.04,.98,.94,.87,.8,.86,.95,1.01];
    const tones=[salt,salt,fern,pine,deep,pine,fern,linen];
    const hull=[tailSections[0],tailSections[2],tailSections[5],[-.45,.625,1.14,2.65],
      [.70,.625,1.14,2.65],[1.31,.575,1.22,1.99],cowls[3],cowls[5]].map(([z,w,b,t])=>{
        const h=t-b;return [[-.73*w,t,z],[.73*w,t,z],[w,b+.56*h,z],[.86*w,b+.20*h,z],
          [.45*w,b,z],[-.45*w,b,z],[-.86*w,b+.20*h,z],[-w,b+.56*h,z]];
      });
    skin(g,hull,tones,light);cap(g,hull[0],fern);cap(g,hull.at(-1),tangerine);
    g.quad([-.56,2.00,1.323],[.56,2.00,1.323],[.45,2.625,.741],[-.45,2.625,.741],glass);
    for(const s of [-1,1]){
      const p=(x,y,z)=>[s*x,y,z];
      g.quad(p(.627,2.02,-.55),p(.627,2.02,.727),p(.562,2.606,.558),p(.562,2.605,-.494),glass);
      g.quad(p(.627,2.02,.73),p(.575,2.015,1.303),p(.422,2.60,.762),p(.547,2.60,.64),glass);
      g.quad(p(.63,1.725,-.54),p(.63,1.725,.70),p(.63,1.81,.70),p(.63,1.81,-.54),tangerine);
      g.pole(p(.62,1.25,.17),p(3.78,2.715,.40),.055,silver,3);
      for(const z of [-1.27,.98])g.pole(p(.98,.53,z),p(.46,1.31,z*.64),.055,steel,3);
      const rings=[[-2.58,.063,.29,.46],[-.46,.30,.11,.55],[-.42,.31,0,.55],
        [1.38,.296,.055,.54],[2.22,.18,.21,.55],[2.61,.014,.45,.52]].map(([z,w,y,h])=>
          [p(1.02-w*.79,h,z),p(1.02+w*.79,h,z),p(1.02+w,h-.105,z),p(1.02,y,z),p(1.02-w,h-.105,z)]);
      skin(g,rings,[linen,silver,"#799188",pine,steel],[1.03,1,.88,.85,.96]);cap(g,rings[0],deep);
      const profile=[[0,1.17,-.75],[2.75,1.09,-.72],[5.01,1.00,-.65],[5.40,.9,-.52],[5.58,.46,-.16]];
      const wing=profile.map(([x,a,b])=>[p(x,2.72,b),p(x,2.865,mix(b,a,.70)),p(x,2.78,a),p(x,2.713,mix(b,a,.84))]);
      for(let i=1;i<wing.length;i++)skin(g,[wing[i-1],wing[i]],i>2?[tangerine,ochre,tangerine,tangerine]:[salt,warm,linen,linen],[1,1.02,.97,.90]);
      g.quad(p(0,1.97,-3.08),p(1.74,1.98,-3.82),p(1.67,1.968,-4.26),p(.09,1.95,-4.37),fern);
    }
    cap(g,[[0,1.94,-3.04],[0,2.28,-3.34],[0,2.96,-3.74],[0,3.01,-4.37],[0,2.00,-4.53]],fern);
    g.quad([0,2.66,-3.57],[0,2.78,-3.63],[0,2.86,-4.40],[0,2.75,-4.415],tangerine);
    g.pole([0,1.89,2.72],[0,1.89,3.035],.105,tangerine,6);
  }
  function install(model){
    model(key("airframe"),g=>{fuselage(g,true);pontoons(g,true);wing(g,true);tailPlane(g,true);});
    model(key("distant"),distant);model(key("cabin"),g=>cabin(g,true));
    model(key("door"),g=>sideDoor(g,1,(x,y,z)=>[x-doorAt[0],y-doorAt[1],z-doorAt[2]]));
    for(const [side,label] of [[-1,"left"],[1,"right"]]){
      model(key("aileron-"+label),g=>aileron(g,side));
      model(key("person-"+label),g=>person(g,side));
      model(key("player-"+label),g=>person(g,side,true));
    }
    model(key("reader-right"),g=>person(g,1,false,true));
    model(key("elevator"),elevator);model(key("rudder"),rudder);model(key("water-rudder"),waterRudder);
    model(key("blades"),propeller);model(key("blade-wash"),propWash);model(key("nav"),lampGlass);
    for(const speed of ["taxi","step"])for(let i=0;i<3;i++)model(key(speed+i),g=>disturbance(g,wakes[speed][i]));
  }
  // Renderer order is yaw, then Z tilt, then X tilt. A positive bank drops the right wing.
  function axes(yaw,pitch,roll){
    const a=Math.cos(yaw),b=Math.sin(yaw),c=Math.cos(pitch),d=Math.sin(pitch),e=Math.cos(roll),f=Math.sin(roll);
    return [[a*e,f,-b*e],[b*d-a*f*c,e*c,a*d+b*f*c],[b*c+a*f*d,-e*d,a*c-b*f*d]];
  }
  function rotate(m,v){
    return [m[0][0]*v[0]+m[1][0]*v[1]+m[2][0]*v[2],m[0][1]*v[0]+m[1][1]*v[1]+m[2][1]*v[2],
      m[0][2]*v[0]+m[1][2]*v[1]+m[2][2]*v[2]];
  }
  function point(p,x,y,z){
    const v=rotate(axes(p.yaw||0,p.pitch||0,-(p.bank??p.roll??0)),[x,y,z]);
    return {x:p.x+v[0],y:(p.y||0)+v[1],z:p.z+v[2]};
  }
  function combined(parent,yaw,pitch,roll){
    const q=axes(yaw,pitch,roll).map(v=>rotate(parent,v)),x=q[0],y=q[1],z=q[2],l=Math.hypot(x[0],x[2]);
    return l<.000001?[Math.atan2(z[0],z[2]),0,Math.asin(clamp(x[1],-1,1))]:
      [Math.atan2(-x[2],x[0]),Math.atan2(-z[1],y[1]),Math.atan2(x[1],l)];
  }
  function world(list,p,t=0,opt={}){
    if(!p)return;
    const yaw=p.yaw||0,pitch=p.pitch||0,roll=-(p.bank??p.roll??0),y=p.y||0,m=axes(yaw,pitch,roll);
    const near=opt.near!==false||opt.inside,water=opt.onWater??p.onWater??!p.airborne;
    const throttle=clamp(p.throttle||0),engine=clamp(p.engine??(p.speed>.4?1:0)),spin=p.prop??(t*(10+23*throttle)*engine);
    const steer=clamp(p.steer||0,-1,1),elev=clamp(p.elevator||0,-1,1),door=clamp(p.door||0);
    const base=(id,glow=0)=>list.push([key(id),p.x,y,p.z,yaw,pitch,roll,glow]);
    function part(id,local,twist=0,tilt=0,bank=0,alpha=0){
      const v=rotate(m,local),a=twist||bank?combined(m,twist,tilt,bank):[yaw,pitch+tilt,roll];
      const cmd=[key(id),p.x+v[0],y+v[1],p.z+v[2],...a];if(alpha)cmd.push(0,null,0,alpha);list.push(cmd);
    }
    if(near){
      base("airframe");
      if(!opt.inside){
        base("cabin");part("door",doorAt,-door*1.39);
        const pilot=opt.pilot??true,guest=opt.guest??false;
        if(pilot)part(pilot==="player"?"player-left":"person-left",[0,0,.14]);
        if(guest)part(guest==="player"?"player-right":guest==="reader"?"reader-right":"person-right",[0,0,.14]);
      }
      part("aileron-left",[-wingHingeX,wingHingeY,wingHingeZ],0,-steer*.37);
      part("aileron-right",[wingHingeX,wingHingeY,wingHingeZ],0,steer*.37);
      part("elevator",[0,elevatorY,elevatorZ],0,elev*.39);
      part("rudder",tailHinge,-steer*.32);
      for(const side of [-1,1])part("water-rudder",[side*1.02,.418,-2.47],-steer*(water?.43:.13),water?0:1.05);
      if(opt.night)base("nav",.94);
    }else base("distant");
    part("blades",propAt,0,0,spin);
    if(near&&engine>.38)part("blade-wash",propAt,0,0,spin,.18+.15*throttle);
    const wake=clamp(p.wake??(Math.abs(p.speed||0)/11));
    if(water&&wake>.035){
      const step=wake>.48,id=(step?"step":"taxi")+Math.floor((t*(step?8:4))%3);
      list.push([key(id),p.x,.004,p.z,yaw,0,0,0,null,0,clamp(wake*1.40,.11,.84)]);
    }
  }
  const silhouette=[[0,3.07],[.42,2.62],[.60,1.34],[2.76,1.08],[5.13,.986],[5.43,.859],[5.58,.45],
    [5.58,-.17],[5.43,-.49],[5.02,-.66],[.60,-.745],[.49,-1.55],[.21,-3.16],[1.34,-3.47],[1.74,-3.80],
    [1.67,-4.26],[.13,-4.37],[0,-4.53],[-.13,-4.37],[-1.67,-4.26],[-1.74,-3.80],[-1.34,-3.47],
    [-.21,-3.16],[-.49,-1.55],[-.60,-.745],[-5.02,-.66],[-5.43,-.49],[-5.58,-.17],[-5.58,.45],
    [-5.43,.859],[-5.13,.986],[-2.76,1.08],[-.60,1.34],[-.42,2.62]];
  function map(c,opt,px,py,scale,p,t=0,flags={}){
    if(!p||scale<=0)return;
    const small=opt.mode!=="street",s=small?Math.max(scale,1.54):scale;
    const x=px(p.x),y=py(p.z),w=c.canvas?.width,h=c.canvas?.height;
    if(w&&h&&Math.hypot(x-w*.5,y-h*.5)>Math.hypot(w,h)*.5+48*s)return;
    const yaw=p.yaw||0,roll=-(p.bank??p.roll??0),pitch=p.pitch||0,cs=Math.cos(roll),sn=Math.sin(roll),ct=Math.cos(pitch),st=Math.sin(pitch);
    const facing=yaw-(opt.rotation||0),upX=-Math.sin(facing)*.115,upZ=Math.cos(facing)*.115;
    const project=(x,h,z)=>{
      const hy=h*ct-z*st,hz=h*st+z*ct,y=x*sn+hy*cs;
      return [x*cs-hy*sn+upX*y,hz+upZ*y];
    };
    function poly(a,color,edge,line=.045){
      c.beginPath();c.moveTo(...a[0]);for(let j=1;j<a.length;j++)c.lineTo(...a[j]);c.closePath();c.fillStyle=color;c.fill();
      if(edge){c.strokeStyle=edge;c.lineWidth=line;c.stroke();}
    }
    function trace(a,color,weight){
      c.beginPath();c.moveTo(...a[0]);for(let i=1;i<a.length;i++)c.lineTo(...a[i]);c.strokeStyle=color;c.lineWidth=weight;c.stroke();
    }
    function dots(a,color,r){
      c.beginPath();c.arc(a[0],a[1],r,0,tau);c.fillStyle=color;c.fill();
    }
    const water=flags.onWater??p.onWater??!p.airborne,wake=clamp(p.wake??Math.abs(p.speed||0)/11);
    c.save();c.translate(x,y);c.rotate(yaw);c.scale(s,-s);c.lineJoin="round";c.lineCap="round";
    if(small){
      c.save();c.translate(.07,-.20);poly(silhouette,deep,navy,.52);c.restore();
      poly(silhouette,warm,deep,.34);
      poly([[-.42,1.23],[0,2.08],[.42,1.23],[.39,.38],[-.39,.38]],fern);
      for(const side of [-1,1])trace([[side*4.48,.58],[side*5.21,.36],[side*5.17,-.27]],tangerine,.45);
      c.restore();return;
    }
    if(water&&wake>.035){
      const fast=wake>.48,n=Math.floor(t*(fast?8:4))%3;c.save();c.globalAlpha*=clamp(wake*1.40,.11,.84);
      for(const patch of wakes[fast?"step":"taxi"][n])poly(patch.top,patch.color);
      c.restore();
    }
    // The moving ground shadow gives a height reference over featureless water.
    const drop=clamp(Math.max(0,p.y||0),0,48),dx=-(.28+.55*drop),dz=-(.17+.41*drop);
    c.save();c.translate(dx*Math.cos(yaw)-dz*Math.sin(yaw),dx*Math.sin(yaw)+dz*Math.cos(yaw));
    c.globalAlpha*=.22-clamp(drop/440,0,.11);c.scale(Math.max(.4,Math.abs(cs)),Math.max(.6,ct));
    poly(silhouette,"#263d43");c.restore();
    const surface=(arr,col,edge,width)=>poly(arr.map(v=>project(...v)),col,edge,width);
    const stroke3=(arr,col,width)=>trace(arr.map(v=>project(...v)),col,width);
    for(const side of [-1,1]){
      const k=side*1.02,section=[[-.08,2.57],[.08,2.57],[.22,2.09],[.30,1.34],[.32,.01],[.30,-1.42],[.22,-2.37],
        [.07,-2.59],[-.07,-2.59],[-.22,-2.37],[-.30,-1.42],[-.32,.01],[-.30,1.34],[-.22,2.09]];
      surface(section.map(([u,z])=>[k+u,.45,z]),"#879e98",deep,.044);
      surface(section.map(([u,z])=>[k+u*.82,.55,z*.992]),linen);
      for(const z of [-1.17,.14,1.23]){
        surface([[k-.105,.561,z-.115],[k+.105,.561,z-.115],[k+.105,.561,z+.115],[k-.105,.561,z+.115]],"#acb4a4");
      }
      stroke3([[k,.558,-1.77],[k,.558,-.47]],steel,.030);
      stroke3([[k,.51,-1.29],[side*.485,1.31,-.70]],steel,.080);
      stroke3([[k,.55,.98],[side*.48,1.31,.78]],steel,.081);
    }
    const fus=[[-.09,1.91,-4.16],[-.23,1.89,-2.93],[-.54,2.06,-1.13],[-.64,2.07,-.55],[-.64,2.07,.68],
      [-.58,1.98,1.38],[-.42,1.92,2.52],[-.24,1.89,2.79],[.24,1.89,2.79],[.42,1.92,2.52],
      [.58,1.98,1.38],[.64,2.07,.68],[.64,2.07,-.55],[.54,2.06,-1.13],[.23,1.89,-2.93],[.09,1.91,-4.16]];
    surface(fus,salt,deep,.045);
    for(const a of [-1,1]){
      surface([[a*.22,1.99,-2.89],[a*.53,2.13,-1.07],[a*.60,2.00,.91],[a*.47,1.98,1.58],
        [a*.48,1.88,2.20],[a*.59,1.89,1.39],[a*.625,1.90,.62],[a*.62,1.90,-.59],[a*.49,1.945,-1.50]],tangerine);
      surface([[a*.05,1.97,-3.03],[a*1.34,1.98,-3.47],[a*1.74,1.965,-3.80],[a*1.67,1.96,-4.26],[a*.12,1.96,-4.37]],linen,deep,.038);
      surface([[a*.12,1.975,elevatorZ],[a*1.70,1.975,elevatorZ],[a*1.67,1.965,-4.26],[a*.12,1.96,-4.37]],fern);
    }
    surface([[-.52,2.41,-.91],[-.535,2.65,-.79],[.535,2.65,-.79],[.52,2.41,-.91],[.44,2.23,-1.07],[-.44,2.23,-1.07]],glass);
    surface([[-.59,2.005,1.31],[-.504,2.66,.79],[.504,2.66,.79],[.59,2.005,1.31]],glass,deep,.031);
    stroke3([[0,2.005,1.31],[0,2.66,.79]],linen,.038);
    stroke3([[-.37,2.09,1.249],[-.13,2.09,1.249]],"#abc0b2",.025);
    for(const side of [-1,1]){
      stroke3([[side*.53,1.31,.32],[side*3.70,2.72,.40]],steel,.077);
      const wing=wingStations.map(([xx,a,b,k,h])=>[side*xx,h+.10,a]).concat(wingStations.slice().reverse().map(([xx,a,b,k,h])=>[side*xx,h+.014,k]));
      surface(wing,salt,deep,.044);
      const tip=wingStations.slice(6);
      surface(tip.map(([xx,a,b,k,h])=>[side*xx,h+.11,a]).concat(tip.slice().reverse().map(([xx,a,b,k,h])=>[side*xx,h+.015,k])),tangerine);
      for(const x of [4.82,4.93])stroke3([[side*x,2.817,.985],[side*x,2.748,-.65]],fern,.053);
      stroke3([[side*.68,2.720,-.731],[side*2.31,2.752,-.715]],steel,.026);
      const step=side*clamp(p.steer||0,-1,1)*.37;
      surface([[side*2.33,wingHingeY,wingHingeZ],[side*5.03,wingHingeY,wingHingeZ],
        [side*5.03,wingHingeY+.41*Math.sin(step),wingHingeZ-.415*Math.cos(step)],
        [side*2.33,wingHingeY+.48*Math.sin(step),wingHingeZ-.48*Math.cos(step)]],linen,steel,.024);
      if((s>9&&side<0)||s>18)for(const xx of [1.1,1.55,2.02,2.61,3.05,3.49,3.93,4.38]){
        stroke3([[side*xx,2.861,.82],[side*xx,2.832,.03]],"#cfc8ab",.022);
      }
    }
    if(s>6){
      // Four geometric pen strokes match the postage chevron on the port wing.
      for(const j of [0,1]){
        const x=3.54+j*.31;
        surface([[-x,2.89,.76],[-x-.25,2.89,.72],[-x-.66,2.83,.12],[-x-.47,2.83,.17]],j?tangerine:ochre);
      }
      const word="SB-73F",height=.48,width=2.6,chars=Array.from(word,ch=>glyph[ch]),count=chars.reduce((n,k)=>n+k[0]+1.14,-1.14),step=width/count;
      let left=3.02-width*.5;
      for(const [wide,runs] of chars){
        for(const path of runs.split("|")){
          const row=path.split(" ").map(p=>[left+Number(p[0])*step,2.88,.18+Number(p[1])*height/4]);stroke3(row,fern,.052);
        }left+=(wide+1.14)*step;
      }
    }
    const d=clamp(p.door||0);
    if(d>.08){
      const a=-d*1.39,tx=(x,z)=>[doorAt[0]+x*Math.cos(a)+z*Math.sin(a),doorAt[2]-x*Math.sin(a)+z*Math.cos(a)];
      const low=tx(0,-1.08),high=tx(-.073,-1.04);
      surface([[low[0],1.93,low[1]],[doorAt[0],1.94,doorAt[2]],[doorAt[0]-.05,2.61,doorAt[2]-.11],[high[0],2.61,high[1]]],glass,linen,.047);
    }
    surface([[-.04,2.0,-3.22],[.04,2.0,-3.22],[.04,2.99,-3.80],[.022,3.00,-4.17],[-.024,3.00,-4.17],[-.04,2.99,-3.80]],fern,deep,.032);
    stroke3([[0,2.99,-4.17],[.13*clamp(p.steer||0,-1,1),2.974,-4.46]],tangerine,.087);
    const spin=p.prop??(t*23*clamp(p.engine||0));
    const blade=(r)=>[-Math.sin(spin)*r,propAt[1]+Math.cos(spin)*r,propAt[2]];
    stroke3([blade(-1.014),blade(1.014)],navy,.090);
    stroke3([blade(.84),blade(.98)],ochre,.080);stroke3([blade(-.84),blade(-.98)],ochre,.080);
    surface([[-.15,1.89,2.872],[.15,1.89,2.872],[.085,1.89,3.028],[0,1.89,3.07],[-.085,1.89,3.028]],tangerine);
    if(flags.night){dots(project(-5.53,2.81,.51),"#fa9179",.092);dots(project(5.53,2.81,.51),"#ade5ab",.092);}
    c.restore();
  }
  window.BayFloatplaneArt=Object.freeze({install,world,map,point,seats,entry,dimensions});
})();
