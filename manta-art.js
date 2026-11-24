/* Manta 90, its saddle and the plywood practice kicker. Local +Z is forward. */
(() => {
  "use strict";
  const sides=[-1,1],tau=Math.PI*2;
  const enamel="#f1e9c8",aqua="#71bdb2",darkAqua="#367c78",rubber="#293f47",tread="#45615f";
  const orange="#e66b40",claret="#8d4742",sun="#f5b355",metal="#a9b9b2",vinyl="#423f46";
  const people={
    driver:{skin:"#af7353",shirt:"#30a292",legs:"#eff1d1",hair:"#483e3b",jacket:"#bc633f"},
    frankie:{skin:"#af7659",shirt:"#4a586e",legs:"#a8997c",hair:"#39333a",jacket:"#ba7449"}
  };
  // [station, beam/2, rub rail height, keel height]
  const ribs=[[-1.57,.40,.10,-.11],[-1.35,.53,.13,-.18],[-.95,.575,.16,-.23],
    [-.26,.60,.20,-.25],[.36,.59,.24,-.23],[.75,.54,.28,-.17],
    [1.10,.43,.32,-.06],[1.37,.26,.35,.09],[1.60,.045,.36,.25]];
  const saddle=[[-.98,.11,.51],[-.82,.202,.568],[-.57,.214,.548],[-.26,.185,.503],
    [-.07,.151,.483],[.18,.127,.551],[.30,.096,.598]];
  const hood=[[.13,.18,.41],[.32,.28,.65],[.53,.36,.635],[.78,.374,.548],
    [1.08,.32,.457],[1.31,.218,.411],[1.51,.080,.377]];
  const hoodTop=(r,side,f)=>[side*r[1]*f,r[2]-f*.047,r[0]];
  function hull(g){
    const levels=(r,s)=>{
      const [z,w,rail,keel]=r;
      return [[0,keel,z],[s*w*.70,keel+.057,z],[s*w*(.90),rail-.095,z],
        [s*w*.98,rail-.054,z],[s*w,rail-.033,z],[s*w,rail+.005,z],[s*w*.91,rail+.022,z],[0,rail+.03,z]];
    };
    const colors=[rubber,darkAqua,aqua,enamel,rubber,aqua,enamel];
    for(const s of sides){
      for(let i=1;i<ribs.length;i++){
        const a=levels(ribs[i-1],s),b=levels(ribs[i],s);
        for(let k=0;k<colors.length;k++)g.quad(a[k],b[k],b[k+1],a[k+1],colors[k],s<0?.91:1);
      }
    }
    for(const r of [ribs[0],ribs[ribs.length-1]]){
      const left=levels(r,-1),right=levels(r,1);
      for(let i=1;i<7;i++)g.quad(left[i-1],right[i-1],right[i],left[i],colors[i-1],.85);
    }
    // Molded footwells slope down to the reboarding deck on either side of the saddle.
    for(const s of sides){
      for(let i=1;i<=5;i++){
        const a=ribs[i-1],b=ribs[i];
        const at=(r,f,lift)=>[s*f*r[1],r[2]+lift,r[0]];
        g.quad(at(a,.29,.038),at(b,.29,.038),at(b,.87,.028),at(a,.87,.028),tread);
        g.quad(at(a,.80,.035),at(b,.80,.035),at(b,.832,.034),at(a,.832,.034),metal);
      }
      for(let i=0;i<8;i++){
        const z=-1.17+i*.151,y=.17+(z+1.17)*.075;
        g.quad([s*.275,y,z],[s*.481,y,z+.032],[s*.481,y+.001,z+.055],[s*.275,y+.001,z+.023],rubber);
      }
    }
    g.box(0,.115,-1.405,.735,.052,.245,tread);
    for(const x of [-.237,-.118,0,.118,.237])g.box(x,.143,-1.406,.029,.009,.179,rubber);
    g.pole([0,-.025,-1.51],[0,-.054,-1.674],.107,rubber,10);
    g.pole([0,-.052,-1.663],[0,-.057,-1.681],.088,metal,10);
    g.pole([0,-.057,-1.68],[0,-.06,-1.692],.073,rubber,10);
    for(const s of sides){
      // Two lobes of the saddle share a narrow waist at the rider's thighs.
      for(let i=1;i<saddle.length;i++){
        const a=saddle[i-1],b=saddle[i];
        const strip=(r,lane)=>{
          const [z,w,h]=r;
          return [[s*(w+.035),.19,z],[s*(w+.014),h-.11,z],[s*w,h-.052,z],[s*.82*w,h-.025,z],[0,h,z]][lane];
        };
        for(const [j,paint] of [[0,aqua],[1,claret],[2,vinyl],[3,"#55535a"]])
          g.quad(strip(a,j),strip(b,j),strip(b,j+1),strip(a,j+1),paint,s<0?.93:1);
      }
      for(let i=1;i<hood.length;i++){
        const a=hood[i-1],b=hood[i];
        const flank=(r,low)=>[s*r[1]*(low?1.18:1),low?.19+.095*(r[0]+.03):r[2]-.047,r[0]];
        g.quad(flank(a,true),flank(b,true),flank(b,false),flank(a,false),s<0?darkAqua:aqua);
        g.quad(hoodTop(a,s,0),hoodTop(b,s,0),hoodTop(b,s,1),hoodTop(a,s,1),enamel,s<0?.96:1);
        // The orange arrow follows the raised engine hatch all the way to the nose.
        const stripe=(r,f)=>{const p=hoodTop(r,s,f);p[1]+=.004;return p;};
        g.quad(stripe(a,.79),stripe(b,.79),stripe(b,.96),stripe(a,.96),orange);
        g.quad(stripe(a,.69),stripe(b,.69),stripe(b,.73),stripe(a,.73),sun);
      }
      g.pole([s*.137,.496,-.846],[s*.202,.508,-1.022],.021,rubber,6);
      g.pole([s*.202,.508,-1.022],[s*.145,.47,-1.100],.021,rubber,6);
      g.pole([s*.145,.47,-1.100],[0,.473,-1.12],.021,rubber,6);
      g.pole([0,.70,.327],[s*.254,.78,.225],.022,metal,7);
      g.pole([s*.252,.78,.227],[s*.347,.768,.186],.032,rubber,7);
      g.pole([s*.316,.746,.216],[s*.316,.734,.269],.010,metal,5);
    }
    g.pole([0,.567,.40],[0,.718,.30],.070,rubber,8);
    g.box(0,.714,.356,.153,.052,.102,rubber);
    g.box(0,.744,.355,.114,.010,.065,"#a3c3a8");
    const pad=saddle[0];g.box(0,.375,pad[0],.22,.26,.058,aqua);
    // An italic 90 on the nose and the little striped tow eye on the stem.
    const markZ=.81;
    const upper=z=>.548-(z-.78)*.305;
    const line=(x,z)=>[x,upper(z)-Math.abs(x)*.13+.008,z];
    const digits=["111101111001111","111101101101111"];
    digits.forEach((bits,digit)=>{
      for(let i=0;i<bits.length;i++)if(bits[i]==="1"){
        const z=markZ+(2-Math.floor(i/3))*.037,x=(digit*4+i%3-3.5)*.038+(z-markZ)*.17;
        g.quad(line(x,z),line(x+.039,z),line(x+.039,z+.038),line(x,z+.038),darkAqua);
      }
    });
    g.pole([0,.304,1.585],[0,.296,1.638],.020,metal,6);
  }
  // Coordinates are shared with the overhead view. Hands stay on the grips in all three poses.
  const poses={
    cruise:{hip:[.564,-.17],shoulder:[1.035,.01],head:[1.235,.078],elbow:[.849,.023],knee:[.464,.168],width:.242},
    carve:{hip:[.626,-.173],shoulder:[.986,.068],head:[1.18,.151],elbow:[.823,.045],knee:[.483,.200],width:.264},
    air:{hip:[.701,-.24],shoulder:[1.037,.039],head:[1.22,.134],elbow:[.864,-.045],knee:[.523,.156],width:.267}
  };
  function shell(g,rows,color){
    const rings=rows.map(([x,y,z,w,d])=>Array.from({length:10},(_,i)=>{
      const a=tau*i/10;return [x+w*Math.sin(a),y,z+d*Math.cos(a)];
    }));
    for(let k=1;k<rings.length;k++)for(let i=0;i<10;i++){
      const j=(i+1)%10;
      g.quad(rings[k-1][i],rings[k-1][j],rings[k][j],rings[k][i],color,.90+.10*Math.cos(i*tau/10-.8));
    }
    const end=rings[rings.length-1];for(let i=1;i<9;i++)g.tri(end[0],end[i],end[i+1],color);
  }
  const keyedRole=role=>role==="frankie"?"frankie":"driver";
  const riderModel=(role,pose)=>"manta-rider-"+keyedRole(role)+"-"+(Object.hasOwn(poses,pose)?pose:"cruise");
  function rider(g,role,pose){
    const p=poses[pose],palette=people[role];
    const [hy,hz]=p.hip,[sy,sz]=p.shoulder,[cy,cz]=p.head;
    const middle=(a,b,t)=>a+(b-a)*t;
    const body=(t,w,d)=>[0,middle(hy,sy,t),middle(hz,sz,t),w,d];
    shell(g,[body(-.08,.128,.095),body(.08,.158,.125),body(.27,.154,.12)],palette.legs);
    shell(g,[body(.19,.163,.123),body(.68,.193,.137),body(.93,.183,.127),body(1,.122,.084)],palette.shirt);
    shell(g,[body(.29,.172,.139),body(.63,.180,.149),body(.81,.181,.148),body(.98,.112,.105)],palette.jacket);
    for(const [t,t2] of [[.415,.47],[.64,.68]])shell(g,[body(t,.183,.154),body(t2,.186,.155)],rubber);
    const front=(t,x,d)=>[x,middle(hy,sy,t),middle(hz,sz,t)+d];
    g.quad(front(.34,-.012,.144),front(.34,.012,.144),front(.88,.012,.144),front(.88,-.012,.144),rubber);
    for(const side of sides){
      g.quad(front(.81,side*.069,-.144),front(.81,side*.136,-.129),front(.86,side*.128,-.124),front(.86,side*.064,-.142),enamel);
      const shoulder=[side*.177,sy-.020,sz],elbow=[side*(p.width+.012),...p.elbow],hand=[side*.293,.78,.205];
      g.pole(shoulder,elbow,.065,palette.shirt,7);g.pole(elbow,hand,.041,palette.skin,7);
      g.box(...hand,.079,.075,.085,palette.skin);
      const thigh=[side*.108,hy,hz],knee=[side*p.width,...p.knee],ankle=[side*.338,.258,-.15];
      g.pole(thigh,knee,.084,palette.legs,7);g.pole(knee,ankle,.060,palette.legs,7);
      g.box(ankle[0],.218,-.103,.119,.066,.235,rubber);
      g.box(ankle[0],.194,-.099,.123,.023,.243,enamel);
    }
    g.pole([0,sy-.012,sz],[0,cy-.062,cz],.070,palette.skin,8);
    shell(g,[[0,cy-.11,cz+.006,.064,.078],[0,cy-.049,cz,.091,.096],[0,cy+.039,cz-.006,.099,.103],[0,cy+.099,cz-.016,.077,.08]],palette.skin);
    shell(g,[[0,cy+.036,cz-.026,.102,.09],[0,cy+.075,cz-.022,.104,.104],[0,cy+.123,cz-.031,.065,.074],[0,cy+.13,cz-.035,.034,.041]],palette.hair);
    if(role==="frankie"){
      shell(g,[[-.021,cy-.097,cz-.099,.039,.035],[-.024,cy-.046,cz-.110,.059,.051],[-.014,cy+.038,cz-.095,.070,.071]],palette.hair);
      g.box(-.023,cy-.064,cz-.109,.090,.015,.072,orange);
    }
    for(const side of sides){
      g.box(side*.042,cy+.018,cz+.085,.050,.009,.008,"#513f39");
      g.box(side*.043,cy+.004,cz+.094,.026,.009,.006,rubber);
    }
  }
  const rampY=z=>.05+(z+3)/6;
  const stripeSets=[[-1.7,orange],[-.62,orange],[.46,enamel],[1.54,enamel]];
  function chevron(z,s){
    return [[0,z+.25],[s*.81,z-.125],[s*.81,z-.28],[0,z+.09]];
  }
  function kicker(g){
    const at=(x,z,lift=0)=>[x,rampY(z)+lift,z];
    for(const s of sides){
      g.pole([s*1.22,-.015,-2.8],[s*1.22,-.015,2.8],.19,darkAqua,9);
      g.quad(at(s*1.50,-3),at(s*1.50,3),[s*1.50,.02,3],[s*1.50,-.07,-3],"#8d654d",s<0?.87:1);
      for(const z of [-1.72,-.61,.50,1.61,2.72]){
        g.quad(at(s*1.506,z,-.052),at(s*1.506,z+.17,-.052),[s*1.506,.083,z+.17],[s*1.506,.083,z],rubber);
      }
      g.quad(at(s*1.50,-3,.007),at(s*1.50,3,.007),at(s*1.35,3,.007),at(s*1.35,-3,.007),orange);
    }
    g.quad([-1.5,.02,3],[1.5,.02,3],at(1.5,3),at(-1.5,3),"#93735a");
    for(let i=0;i<12;i++){
      const z=-3+.5*i;
      g.quad(at(-1.495,z),at(1.495,z),at(1.495,z+.5),at(-1.495,z+.5),i%2?"#b5aa87":"#beb18d");
      g.quad(at(-1.35,z,.005),at(1.35,z,.005),at(1.35,z+.021,.005),at(-1.35,z+.021,.005),"#8b836a");
    }
    for(const [z,color] of stripeSets)for(const s of sides)g.quad(...chevron(z,s).map(([x,z])=>at(x,z,.010)),color);
    g.quad(at(-1.5,2.885,.012),at(1.5,2.885,.012),at(1.5,3,.012),at(-1.5,3,.012),rubber);
    for(let i=0;i<7;i++)g.quad(at(-1.39+i*.43,2.89,.016),at(-1.19+i*.43,2.89,.016),at(-1.16+i*.43,3,.016),at(-1.36+i*.43,3,.016),sun);
  }
  function install(model){
    model("marina-manta",hull);model("manta-kicker",kicker);
    for(const role of Object.keys(people))for(const pose of Object.keys(poses))model(riderModel(role,pose),g=>rider(g,role,pose));
  }
  function paint(c,color,points){
    c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fill();
  }
  function oval(c,color,x,z,w,d){
    c.fillStyle=color;c.beginPath();c.ellipse(x,z,w,d,0,0,tau);c.fill();
  }
  function mark(c,color,points,width){
    c.strokeStyle=color;c.lineWidth=width;c.lineCap="round";c.beginPath();c.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke();
  }
  const footprint=rows=>rows.map(([z,w])=>[w,z]).concat(rows.slice().reverse().map(([z,w])=>[-w,z]));
  const outline=footprint(ribs),hoodPrint=footprint(hood),padPrint=footprint(saddle);
  function drawMap(c,x,y,s,yaw,rider=null,pose="cruise",height=0){
    if(!(s>0))return;
    const lift=Math.max(0,height||0);
    c.save();c.translate(x,y);c.rotate(yaw);c.scale(s,-s);
    if(lift>.08){c.save();c.translate(lift*.35,-lift*.25);paint(c,"rgba(22,69,76,.30)",outline);c.restore();}
    paint(c,rubber,outline);c.save();c.scale(.96,.978);paint(c,aqua,outline);c.restore();
    for(const side of sides){
      paint(c,tread,[[side*.23,-1.36],[side*.465,-1.22],[side*.53,.34],[side*.34,.55],[side*.19,-.31]]);
      if(s>=4)for(let i=0;i<6;i++)mark(c,metal,[[side*.29,-1+i*.164],[side*.454,-.97+i*.164]],.013);
      mark(c,rubber,[[side*.14,-.866],[side*.195,-1.041],[side*.13,-1.112],[0,-1.133]],.043);
    }
    paint(c,vinyl,padPrint);paint(c,enamel,hoodPrint);
    for(const side of sides){
      const stripe=hood.map(([z,w])=>[side*w*.95,z]).concat(hood.slice().reverse().map(([z,w])=>[side*w*.67,z]));
      paint(c,orange,stripe);
    }
    mark(c,rubber,[[-.348,.186],[-.22,.255],[0,.32],[.22,.255],[.348,.186]],.059);
    if(rider){
      const col=people[keyedRole(rider)],p=poses[pose]||poses.cruise;
      for(const side of sides){
        mark(c,col.legs,[[side*.13,p.hip[1]],[side*p.width,p.knee[1]],[side*.33,-.12]],.12);
        mark(c,col.shirt,[[side*.13,p.shoulder[1]],[side*p.width,p.elbow[1]]],.113);
        mark(c,col.skin,[[side*p.width,p.elbow[1]],[side*.293,.205]],.079);
      }
      oval(c,col.jacket,0,(p.hip[1]+p.shoulder[1])/2,.195,.14);
      mark(c,enamel,[[-.14,p.hip[1]+.015],[0,p.hip[1]],[.14,p.hip[1]+.015]],.027);
      oval(c,col.skin,0,p.head[1],.099,.108);oval(c,col.hair,0,p.head[1]-.021,.101,.098);
      if(rider==="frankie")oval(c,col.hair,-.018,p.head[1]-.109,.055,.058);
    }
    c.restore();
  }
  function drawKicker(c,x,y,s,yaw=0){
    if(!(s>0))return;
    c.save();c.translate(x,y);c.rotate(yaw);c.scale(s,-s);
    c.fillStyle=orange;c.fillRect(-1.5,-3,3,6);
    for(let i=0;i<12;i++){c.fillStyle=i%2?"#b5aa87":"#beb18d";c.fillRect(-1.35,-3+i*.5,2.7,.5);}
    for(const [z,color] of stripeSets)for(const side of sides)paint(c,color,chevron(z,side));
    c.fillStyle=rubber;c.fillRect(-1.5,2.87,3,.13);
    c.fillStyle=sun;for(let i=0;i<7;i++)c.fillRect(-1.39+i*.43,2.89,.20,.11);
    c.restore();
  }
  window.BayMantaArt=Object.freeze({install,riderModel,drawMap,drawKicker});
})();
