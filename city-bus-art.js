/* Coach 608 of Bay Transit. Local +Z faces the windshield and +X opens onto the curb. */
(() => {
  "use strict";
  const tau=2*Math.PI,clip=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,f)=>a+(b-a)*f;
  const cream="#e9dcb6",white="#f1e8cf",sea="#347e79",seaLight="#6eaaa0",darkSea="#2d5858";
  const coral="#cf7852",marigold="#edaf56",lamp="#ffda83",ink="#263c3f",steel="#777f76",rubber="#333b3c";
  const floorInk="#5f7069",floorEdge="#c9aa69",cloth="#477975",thread="#84a99c",pole="#d4ab56";
  const width=1.18,halfLength=4.15,floor=.49,roof=2.76,track=1.03,radius=.45;
  const axles=[-2.27,2.31],doors={front:{x:width,z:3.30,y:floor},rear:{x:width,z:-1.09,y:floor}};
  const driver={x:-.66,y:1.03,z:3.16,yaw:0};
  const steeringHub={x:-.645,y:1.305,z:3.655},wheelPitch=Math.atan2(.77,.64);
  const stopBoard={z:3.634,y:2.302};
  const seats=[
    {x:.73,y:.965,z:.97},{x:-.73,y:.965,z:1.02},{x:-.73,y:.965,z:-.14},
    {x:.73,y:.965,z:-.07},{x:-.73,y:.965,z:-1.29},
    {x:-.72,y:1.15,z:-3.29},{x:0,y:1.15,z:-3.29},{x:.72,y:1.15,z:-3.29}
  ];
  const doorZ=[doors.front.z,doors.rear.z],leafWidth=.28,doorX=1.158;
  const font={
    A:["01110","10001","10001","11111","10001","10001","10001"],
    B:["11110","10001","10001","11110","10001","10001","11110"],
    C:["01111","10000","10000","10000","10000","10000","01111"],
    D:["11110","10001","10001","10001","10001","10001","11110"],
    E:["11111","10000","10000","11110","10000","10000","11111"],
    I:["111","010","010","010","010","010","111"],
    L:["1000","1000","1000","1000","1000","1000","1111"],
    M:["10001","11011","10101","10101","10001","10001","10001"],
    N:["10001","11001","11001","10101","10011","10011","10001"],
    O:["01110","10001","10001","10001","10001","10001","01110"],
    P:["11110","10001","10001","11110","10000","10000","10000"],
    R:["11110","10001","10001","11110","10100","10010","10001"],
    S:["01111","10000","10000","01110","00001","00001","11110"],
    T:["11111","00100","00100","00100","00100","00100","00100"],
    U:["10001","10001","10001","10001","10001","10001","01110"],
    Y:["10001","10001","01010","00100","00100","00100","00100"],
    0:["01110","10001","10011","10101","11001","10001","01110"],
    6:["01110","10000","10000","11110","10001","10001","01110"],
    8:["01110","10001","10001","01110","10001","10001","01110"],
    " ":["00","00","00","00","00","00","00"]
  };
  const sideFace=(side,x)=>(u,y)=>[side*x,y,side*u];
  const endFace=(front,z)=>(u,y)=>[front?-u:u,y,z];
  function panel(g,at,x0,y0,x1,y1,color){
    g.quad(at(x0,y0),at(x1,y0),at(x1,y1),at(x0,y1),color);
  }
  function stripe(g,at,x,y,u,v,w,color){
    const scale=w*.5/(Math.hypot(u-x,v-y)||1),dx=-(v-y)*scale,dy=(u-x)*scale;
    g.quad(at(x+dx,y+dy),at(u+dx,v+dy),at(u-dx,v-dy),at(x-dx,y-dy),color);
  }
  // Rows of the amber blind share contiguous runs. No texture or per-frame text upload.
  function letters(g,at,word,x,y,w,h,color){
    const glyphs=Array.from(word,c=>font[c]||font[" "]),count=glyphs.reduce((n,a)=>n+a[0].length+1,-1);
    const step=w/count,high=h/7;let cursor=x-w/2;
    for(const a of glyphs){
      for(let row=0;row<7;row++)for(let col=0;col<a[row].length;col++){
        if(a[row][col]!=="1")continue;
        const start=col;while(col+1<a[row].length&&a[row][col+1]==="1")col++;
        panel(g,at,cursor+(start+.04)*step,y+(6-row+.09)*high,cursor+(col+.96)*step,y+(7-row-.09)*high,color);
      }
      cursor+=(a[0].length+1)*step;
    }
  }
  function wing(g,at,x,y,scale){
    // The old Bay Transit insignia is a pelican passing over two painted breakers.
    const p=(u,v)=>at(x+u*scale,y+v*scale);
    g.tri(p(-.44,.07),p(-.05,.005),p(.28,.17),cream);
    g.tri(p(-.12,.055),p(.12,.045),p(.44,.105),cream);
    for(const d of [0,.060]){
      g.quad(p(-.40,-.068-d),p(-.05,-.106-d),p(.04,-.084-d),p(-.30,-.050-d),marigold);
      g.quad(p(-.05,-.106-d),p(.36,-.045-d),p(.31,-.031-d),p(.04,-.084-d),marigold);
    }
  }
  function tireLine(z){
    const d=Math.min(Math.abs(z-axles[0]),Math.abs(z-axles[1]));
    return d<.52?radius+Math.sqrt(.52*.52-d*d):.395;
  }
  function sideIntervals(side){
    return side<0?[[-3.915,3.88]]:[[-3.915,doors.rear.z-.56],[doors.rear.z+.56,doors.front.z-.56],[doors.front.z+.56,3.88]];
  }
  function sides(g){
    for(const side of [-1,1]){
      const p=(x,y,z)=>[side*x,y,z];
      for(const [from,to] of sideIntervals(side)){
        if(to<=from)continue;
        const stripeY=z=>1.073+.165*clip((-z-2.40)/.96);
        const cuts=[from,...[-3.36,-2.40].filter(z=>z>from&&z<to),to];
        for(const axle of axles)for(let j=0;j<=12;j++){
          const z=axle+.52001*Math.cos(j*Math.PI/12);
          if(z>from&&z<to)cuts.push(z);
        }
        cuts.sort((a,b)=>a-b);
        for(let i=1;i<cuts.length;i++){
          const a=cuts[i-1],b=cuts[i],lo=tireLine(a),hi=tireLine(b);
          const ya=stripeY(a),yb=stripeY(b);
          const strip=(al,bl,at,bt,x,col)=>g.quad(p(x,al,a),p(x,bl,b),p(x,bt,b),p(x,at,a),col);
          strip(lo,hi,lo+.038,hi+.038,1.151,darkSea);
          strip(lo+.038,hi+.038,ya-.056,yb-.056,1.164,sea);
          g.quad(p(1.151,lo,a),p(1.151,hi,b),p(.976,hi,b),p(.976,lo,a),rubber);
        }
        const paintCuts=[from,...[-3.36,-2.40].filter(z=>z>from&&z<to),to];
        for(let i=1;i<paintCuts.length;i++){
          const a=paintCuts[i-1],b=paintCuts[i],ya=stripeY(a),yb=stripeY(b);
          const paint=(al,bl,at,bt,x,color)=>g.quad(p(x,al,a),p(x,bl,b),p(x,bt,b),p(x,at,a),color);
          paint(ya-.056,yb-.056,ya-.019,yb-.019,1.167,marigold);
          paint(ya-.019,yb-.019,ya+.017,yb+.017,1.168,coral);
          paint(ya+.017,yb+.017,1.316,1.316,1.169,cream);
        }
        g.box(side*1.120,1.191,(from+to)/2,.071,.205,to-from,"#bcbca4");
        g.box(side*1.141,1.315,(from+to)/2,.079,.052,to-from,ink);
        g.box(side*1.086,1.337,(from+to)/2,.065,.046,to-from,"#9aab9a");
      }
      g.box(side*1.11,2.566,-.02,.130,.255,7.82,white);
      g.box(side*1.142,2.422,-.023,.079,.092,7.83,ink);
      const posts=side<0?[-3.85,-2.70,-1.55,-.38,.77,1.89,2.80,3.86]:
        [-3.85,-2.66,doors.rear.z-.575,doors.rear.z+.575,.67,1.86,doors.front.z-.575,doors.front.z+.575];
      for(const z of posts){
        g.box(side*1.128,1.878,z,.088,1.16,.070,ink);
        g.box(side*1.079,1.88,z,.027,1.17,.033,"#a4afa3");
      }
      const at=sideFace(side,1.172),position=side>0?.85:-.62;
      wing(g,at,position,.806,1.18);
      letters(g,at,"BAY TRANSIT",position,.577,1.14,.117,"#e7d8ac");
      if(side<0)letters(g,at,"608",-2.99,1.128,.32,.120,darkSea);
      for(let i=0;i<8;i++){
        const z=-3.75+i*.10,y=.60+.018*(i%3);
        stripe(g,at,side*z,y,side*(z+.06),y+.008,.012,i%3===0?"#a39775":"#548780");
      }
    }
    for(const z of doorZ){
      g.box(1.034,.457,z,.273,.066,1.117,rubber);
      g.box(1.132,.495,z,.095,.014,1.10,floorEdge);
      g.box(1.132,2.354,z,.100,.110,1.17,ink);
      g.box(1.161,2.461,z,.032,.106,1.11,sea);
      for(const edge of [-1,1])g.box(1.126,1.41,z+edge*.575,.087,1.89,.056,ink);
    }
  }
  function chamfer(g,z,front){
    const end=front?4.075:-4.07,trim=front?.935:1.11,sg=front?1:-1;
    for(const side of [-1,1]){
      const at=(x,y,v)=>[side*x,y,v],fy=front?1.13:1.35;
      function strip(lo,hi,color){
        g.quad(at(1.165,lo,z),at(1.04,lo,end),at(1.04,hi,end),at(1.165,hi,z),color);
      }
      strip(.39,trim-.042,sea);strip(trim-.042,trim+.015,marigold);strip(trim+.015,fy+.032,cream);
      g.pole(at(1.143,fy,z),at(1.105,2.43,z-sg*.045),.048,ink,5);
      g.pole(at(1.05,fy,end-.025*sg),at(1.034,2.44,end-.115*sg),.054,cream,5);
      g.quad(at(1.145,2.365,z),at(1.035,2.39,end-.12*sg),at(1.001,2.655,end-.24*sg),at(1.126,2.69,z-.16*sg),white);
    }
    g.box(0,.630,end-sg*.012,2.065,.430,.068,sea);
    g.box(0,.417,end+sg*.017,2.105,.109,.113,ink);
    g.box(0,.465,end+sg*.065,1.66,.027,.025,"#afb29e");
    g.box(0,trim-.014,end,2.07,.052,.088,marigold);
    g.box(0,(trim+(front?1.118:1.34))/2,end-sg*.019,2.055,(front?1.118:1.34)-trim,.107,cream);
  }
  function stern(g){
    chamfer(g,-3.915,false);
    const face=endFace(false,-4.116);
    g.box(0,1.060,-4.049,2.045,.605,.094,cream);
    g.box(0,1.399,-4.055,2.05,.109,.088,ink);
    g.box(0,2.421,-3.986,2.045,.115,.102,ink);
    for(const x of [-.922,-.32,.32,.922])g.pole([x,1.43,-4.045],[x*.979,2.40,-3.976],.023,ink,5);
    panel(g,face,-.68,.64,.68,1.058,"#4b6d68");
    for(let i=0;i<7;i++)panel(g,face,-.635,.666+.055*i,.635,.685+.055*i,"#9ba396");
    g.box(0,.521,-4.107,.434,.152,.023,"#425250");
    panel(g,endFace(false,-4.126),-.185,.469,.185,.576,cream);letters(g,endFace(false,-4.132),"608",0,.487,.231,.076,ink);
    for(const side of [-1,1]){
      g.box(side*.904,.793,-4.10,.172,.460,.047,ink);
      g.box(side*.904,.915,-4.126,.128,.121,.022,"#b6534e");
      g.box(side*.904,.761,-4.126,.127,.113,.022,"#c89054");
      g.box(side*.904,.626,-4.126,.123,.091,.020,"#bdc3b3");
      for(let j=0;j<5;j++)g.box(side*1.169,.548+j*.068,-3.4,.011,.022,.67,"#263f40");
    }
    g.box(0,2.558,-3.980,2.026,.167,.080,sea);
    g.box(.70,2.500,-4.017,.48,.245,.045,ink);
    letters(g,endFace(false,-4.048),"6",.70,2.415,.145,.170,marigold);
  }
  function nose(g){
    chamfer(g,3.88,true);
    g.box(0,.870,4.034,2.047,.389,.129,sea);
    g.box(0,1.097,4.004,2.025,.075,.175,"#50635f");
    g.box(0,1.17,3.967,2.01,.089,.193,ink);
    for(const side of [-1,1]){
      g.box(side*.814,.75,4.092,.372,.222,.034,darkSea);
      g.box(side*.800,.761,4.115,.239,.132,.027,"#d5d7bc");
      g.box(side*.804,.803,4.129,.221,.028,.012,white);
      g.box(side*.952,.761,4.111,.063,.132,.024,"#cd944f");
      g.pole([side*1.062,1.155,4.028],[side*1.039,2.384,3.809],.041,ink,5);
      g.pole([side*1.121,2.25,3.61],[side*1.325,2.18,3.72],.022,ink,5);
      g.box(side*1.331,2.077,3.726,.132,.240,.092,ink);
      g.box(side*1.331,2.077,3.675,.101,.193,.017,"#a1bab1");
    }
    for(const x of [-.52,.39]){
      g.pole([x,1.232,4.028],[x-.26,1.445,3.987],.012,ink,4);
      g.pole([x-.53,1.419,3.991],[x+.103,1.475,3.977],.011,ink,4);
    }
    g.pole([.045,1.195,4.018],[.045,2.372,3.805],.020,ink,4);
    g.box(0,2.475,3.859,2.096,.351,.144,cream);
    g.box(0,2.467,3.941,1.733,.257,.050,ink);
    g.box(0,2.591,3.974,1.742,.020,.069,darkSea);
    for(const s of [-1,1])g.box(s*.959,2.526,3.916,.112,.046,.045,"#d39552");
    const face=endFace(true,4.111);
    wing(g,face,-.006,.924,.62);
    panel(g,face,-.190,.451,.190,.566,cream);letters(g,endFace(true,4.132),"608",0,.473,.225,.069,ink);
    const blind=sideFace(1,1.177);
    panel(g,blind,1.23,2.457,2.635,2.672,ink);
  }
  function roofCap(g){
    const ring=[[-.93,3.996],[-1.111,3.824],[-1.147,3.598],[-1.147,-3.738],[-1.097,-3.893],[-.954,-3.999],
      [.954,-3.999],[1.097,-3.893],[1.147,-3.738],[1.147,3.598],[1.111,3.824],[.93,3.996]];
    for(let i=0;i<ring.length;i++){
      const a=ring[i],b=ring[(i+1)%ring.length],point=(p,y,s)=>[p[0]*s,y,p[1]*s];
      g.quad(point(a,2.632,1),point(b,2.632,1),point(b,2.697,1.007),point(a,2.697,1.007),cream);
      g.quad(point(a,2.697,1.007),point(b,2.697,1.007),point(b,roof,.974),point(a,roof,.974),white);
      g.tri(point(a,roof,.974),point(b,roof,.974),[0,roof,0],"#d0cbae");
      g.tri(point(b,2.632,1),point(a,2.632,1),[0,2.632,0],"#d9d6bb");
    }
    g.box(0,2.811,-1.98,1.48,.103,1.98,"#abafa4");
    g.box(0,2.891,-2.09,1.38,.069,1.66,"#c2c3ad");
    for(const x of [-.338,.338]){
      g.cyl(x,2.936,-2.10,.25,.275,.022,11,"#657370");
      g.cyl(x,2.952,-2.10,.101,.084,.019,8,"#aeb3a0");
      for(const k of [-1,0,1])g.box(x,2.953,-2.10+k*.081,.423,.012,.020,"#a3ad9b");
    }
    g.box(.04,2.794,.874,.76,.056,.60,"#85968e");g.box(.04,2.830,.882,.663,.036,.515,"#daccaa");
    for(const side of [-1,1])for(const z of [-3.53,.42,3.39]){
      g.box(side*1.172,2.501,z,.024,.051,.150,steel);
      g.box(side*1.187,2.506,z,.014,.031,.114,z< -3?"#ba6453":"#d7a65e");
    }
  }
  function deck(g){
    g.box(0,.404,-.025,.951,.171,7.94,"#515c59");
    g.box(0,.477,-.04,1.33,.024,7.91,floorInk);
    for(const side of [-1,1]){
      const x=side*.865;
      for(const [a,b] of [[-3.92,-2.79],[-1.74,1.79],[2.84,3.91]])g.box(x,.446,(a+b)*.5,.453,.088,b-a,floorInk);
      for(const z of axles){
        g.box(side*.90,.659,z,.409,.355,1.074,"#677571");
        g.box(side*.912,.859,z,.397,.067,1.019,"#87918a");
        for(const k of [-1,1])g.box(side*.91,.797,z+k*.50,.392,.136,.072,"#78837c");
      }
      g.box(side*.578,.495,.065,.029,.011,5.36,"#a59f80");
    }
    g.box(0,.690,-3.45,2.127,.396,1.10,"#64736c");
    g.box(0,.907,-3.45,2.102,.043,1.092,"#8e978a");
    g.box(0,.584,-2.797,.98,.185,.235,floorInk);
    g.box(0,.685,-2.696,1.02,.025,.044,marigold);
    for(const y of [.501,.705])for(let i=0;i<8;i++)g.box(-.36+i*.102,y,-2.682,.050,.008,.032,ink);
    // Textured anti-slip vestibules under each folding doorway.
    for(const z of doorZ)for(let i=0;i<8;i++){
      g.box(.875,.501,z-.40+i*.111,.427,.010,.020,"#566862");
    }
    for(const [x,z] of [[-.32,2.58],[.49,.19],[.39,-.99],[-.16,-2.42],[-.33,-1.54],[.14,2.07]]){
      const plane=(u,v)=>[u,.503,v];
      stripe(g,plane,x-.12,z-.06,x+.07,z+.05,.018,"#7c8780");
    }
  }
  function upholstered(g,p,isDriver=false){
    const {x,y,z}=p,w=isDriver?.52:.565;
    g.box(x,y-.130,z,w-.14,.186,.375,steel);
    g.box(x,y-.079,z,w,.110,.508,"#415b59");
    g.box(x,y-.025,z+.008,w-.038,.052,.472,isDriver?"#5f7370":cloth);
    g.box(x,y+.211,z-.230,w+.018,.448,.074,isDriver?ink:"#587e75");
    g.box(x,y+.223,z-.179,w-.060,.392,.057,isDriver?"#576563":cloth);
    g.box(x,y+.452,z-.233,w+.018,.039,.097,isDriver?"#788780":"#c3b99a");
    if(isDriver)return;
    for(const k of [-1,0,1]){
      const xx=x+k*.135;
      g.quad([xx-.060,y+.128,z-.147],[xx+.013,y+.126,z-.147],[xx+.070,y+.177,z-.147],[xx+.020,y+.177,z-.147],thread);
      g.quad([xx-.038,y+.002,z+.047],[xx+.022,y+.002,z+.047],[xx+.059,y+.002,z+.115],[xx+.020,y+.002,z+.115],"#72978a");
    }
    const end=x<0?1:-1;
    g.pole([x+end*(w*.5-.018),y+.385,z-.231],[x+end*(w*.5-.018),y+.531,z-.188],.019,pole,5);
    g.pole([x+end*(w*.5-.018),y+.531,z-.188],[x+end*(w*.5-.131),y+.536,z-.198],.019,pole,5);
  }
  function steeringWheel(g){
    const at=(a,r,z)=>[r*Math.cos(a),r*Math.sin(a),z];
    for(let i=0;i<16;i++){
      const a=i*tau/16,b=(i+1)*tau/16;
      g.quad(at(a,.184,-.013),at(b,.184,-.013),at(b,.209,-.013),at(a,.209,-.013),"#394646");
      g.quad(at(a,.209,-.013),at(b,.209,-.013),at(b,.202,.012),at(a,.202,.012),rubber);
    }
    for(const a of [-.12,Math.PI+.12,Math.PI*1.5])g.pole([0,0,-.008],at(a,.189,-.008),.012,rubber,5);
    g.box(0,0,-.016,.101,.078,.033,ink);
    g.box(0,0,-.036,.056,.018,.007,steel);
  }
  function driverBay(g){
    upholstered(g,driver,true);
    g.box(-.647,.649,3.20,.577,.303,.752,darkSea);
    g.box(-.604,1.109,3.808,.873,.195,.347,ink);
    g.box(-.648,1.226,3.804,.695,.097,.290,"#4e6865");
    g.box(-.624,1.263,3.727,.584,.041,.149,"#596e63");
    const panelFace=(x,y)=>[x,y,3.624+(y-1.17)*.28];
    panel(g,panelFace,-.861,1.154,-.389,1.237,ink);
    for(const x of [-.769,-.591,-.432])panel(g,panelFace,x,1.18,x+.054,1.206,"#a0c4a0");
    g.pole([-.646,1.106,3.789],[steeringHub.x,steeringHub.y,steeringHub.z],.045,rubber,6);
    g.box(-.431,1.296,3.817,.238,.106,.047,ink);
    for(const side of [-1,1]){
      const x=-.431+side*.052;
      for(let j=0;j<8;j++){
        const a=tau*j/8,b=tau*(j+1)/8,p=(u,h)=>[x+Math.cos(u)*h,1.299+Math.sin(u)*h,3.788];
        g.quad(p(a,.039),p(b,.039),p(b,.033),p(a,.033),"#bac6ab");
      }
      stripe(g,(u,v)=>[u,v,3.783],x,1.297,x+side*.019,1.313,.005,marigold);
    }
    g.box(.202,1.046,3.072,.248,.655,.258,darkSea);
    g.box(.201,1.392,3.038,.282,.111,.310,"#b8b9a1");
    g.box(.201,1.454,3.020,.198,.022,.185,ink);
    g.box(.201,1.471,3.022,.134,.011,.074,"#86b09c");
    g.box(.201,1.399,2.891,.132,.036,.018,marigold);
    g.pole([.12,.512,2.651],[.12,1.57,2.651],.023,pole,6);
    g.pole([.12,1.57,2.651],[.47,1.64,2.756],.023,pole,6);
    g.pole([.47,1.64,2.756],[.47,.542,2.756],.023,pole,6);
    g.box(-.267,2.288,3.381,.395,.174,.051,ink);
    g.box(-.267,2.288,3.350,.356,.132,.010,"#91a8a0");
    g.pole([-.27,2.385,3.38],[-.28,2.63,3.477],.013,steel,5);
    // The windshield is an actual opening. Glass tint lives at the visor and outside edges.
    g.box(0,2.295,3.788,1.993,.106,.054,"#748a83");
  }
  function cabin(g){
    deck(g);driverBay(g);
    for(const p of seats)upholstered(g,p);
    for(const side of [-1,1]){
      g.pole([side*.541,2.326,-3.02],[side*.541,2.326,2.53],.026,pole,6);
      for(const z of [-2.89,-.47,2.06]){
        g.pole([side*.541,2.326,z],[side*.633,2.62,z+.02],.017,steel,5);
      }
      for(const z of (side<0?[-2.43,-.82,.77,2.13]:[-2.08,.13,1.60])){
        const x=side*.54;
        g.pole([x,2.328,z],[x,2.193,z+.003],.010,"#686e61",5);
        g.pole([x,2.191,z],[x,2.073,z-.074],.015,pole,5);
        g.pole([x,2.073,z-.074],[x,2.073,z+.077],.015,pole,5);
        g.pole([x,2.073,z+.077],[x,2.191,z],.015,pole,5);
      }
      for(const [a,b] of (side<0?[[-3.57,2.58]]:[[-3.65,-1.71],[-.48,2.63]])){
        g.pole([side*1.085,1.73,a],[side*1.085,1.73,b],.008,"#cf9956",4);
      }
      for(const z of (side>0?[2.64,-.455]:[1.90,-1.56])){
        const x=side*.95;
        g.pole([x,.524,z],[x,2.56,z],.026,pole,6);
        g.box(x,1.42,z,.076,.118,.060,ink);
        g.box(x-side*.041,1.426,z,.020,.063,.038,"#bb785a");
      }
      g.box(side*.91,2.558,-.20,.174,.074,5.75,"#a4ad9e");
    }
    g.box(-1.079,2.451,.10,.017,.252,2.57,cream);
    const rail=(u,y)=>[-1.065,y,u];
    stripe(g,rail,-.833,2.410,1.033,2.410,.019,sea);
    for(let i=0;i<4;i++){
      const z=-.833+i*.622;
      panel(g,rail,z-.024,2.389,z+.024,2.434,i===0?coral:darkSea);
    }
    g.box(0,stopBoard.y,stopBoard.z,.652,.165,.071,darkSea);
    g.box(0,stopBoard.y,stopBoard.z-.042,.60,.129,.015,ink);
    for(const x of [-.214,.214])g.pole([x,2.38,3.65],[x,2.626,3.68],.013,steel,5);
  }
  function glassEdges(g){
    for(const side of [-1,1]){
      const at=(u,y)=>[side*1.142,y,u];
      const panels=side<0?[[-3.79,-2.76],[-2.63,-1.62],[-1.49,-.45],[-.315,.70],[.84,1.82],[1.96,2.73],[2.87,3.79]]:
        [[-3.79,-2.72],[-2.60,-1.73],[-.443,.603],[.739,1.80],[1.93,2.66]];
      for(const [a,b] of panels){
        const stagger=(b-a)*.18;
        panel(g,at,a,2.310,b,2.398,"#688d8e");
        g.quad(at(a,2.310),at(a+stagger*.55,2.310),at(a+.030,2.153),at(a,2.153),"#93b0a5");
        g.quad(at(b-.10,1.344),at(b,1.344),at(b,1.384),at(b-.076,1.384),"#89a89c");
      }
    }
    const wind=(u,y)=>[-u,y,4.032-(y-1.20)*.181];
    g.quad(wind(-.99,2.294),wind(.99,2.294),wind(.99,2.372),wind(-.99,2.372),"#789a98");
    g.quad(wind(.74,2.296),wind(.812,2.296),wind(.949,2.056),wind(.914,2.056),"#a6bdb0");
    const rear=(x,y)=>[x,y,-4.057+(y-1.43)*.076];
    panel(g,rear,-.938,2.286,.938,2.361,"#71938e");
  }
  function leaf(g){
    const L=leafWidth;
    const face=(z,y)=>[.022,y,z];
    g.box(0,.597,L/2,.044,.205,L-.005,darkSea);
    panel(g,face,.007,.532,L-.007,.592,sea);
    for(const z of [.010,L-.012])g.box(0,1.477,z,.041,1.750,.021,ink);
    g.box(0,2.278,L/2,.041,.074,L,ink);
    g.box(0,1.263,L/2,.043,.109,L,ink);
    g.box(0,1.343,L/2,.041,.044,L,marigold);
    g.box(0,.743,L/2,.042,.063,L,ink);
    // A narrow reflection leaves an honest line of sight through the two door lites.
    panel(g,face,.025,2.164,L-.022,2.243,"#799c98");
    g.quad(face(.026,1.088),face(.055,1.088),face(.122,1.194),face(.073,1.194),"#8bad9d");
  }
  function leaves(z,openness,add){
    // Each pair folds in on itself. The inner moving edge remains on the sill throughout.
    const fold=clip(openness)*1.47,s=Math.sin(fold),c=Math.cos(fold);
    for(const direction of [-1,1]){
      const mount=z-direction*leafWidth*2;
      const first=direction===1?-fold:fold-Math.PI,second=direction===1?fold:Math.PI-fold;
      add(doorX,mount,first);add(doorX-leafWidth*s,mount+direction*leafWidth*c,second);
    }
  }
  function copyPart(g,mesh,x,z,yaw){
    const c=Math.cos(yaw),s=Math.sin(yaw),v=mesh.vertices;
    for(let i=0;i<v.length;i+=6){
      g.vertices.push(x+v[i]*c+v[i+2]*s,v[i+1],z-v[i]*s+v[i+2]*c,v[i+3],v[i+4],v[i+5]);
    }
  }
  function tire(g){
    const rim=(x,r,a)=>[x,Math.cos(a)*r,Math.sin(a)*r],sides=12;
    function band(x1,r1,x2,r2,color){
      for(let i=0;i<sides;i++){
        const a=tau*i/sides,b=tau*(i+1)/sides;
        g.quad(rim(x1,r1,a),rim(x1,r1,b),rim(x2,r2,b),rim(x2,r2,a),color,.91+.05*Math.cos(a));
      }
    }
    band(-.103,.397,-.086,radius,rubber);band(-.086,radius,.10,radius,"#303638");band(.10,radius,.126,.410,"#384342");
    band(.126,.410,.129,.255,rubber);band(.129,.255,.143,.236,"#c0bca4");band(.143,.236,.113,.211,steel);
    band(.113,.211,.118,.103,"#abb09f");band(.118,.103,.151,.086,"#b6baa7");
    for(let i=0;i<sides;i++)g.tri([.151,0,0],rim(.151,.086,tau*i/sides),rim(.151,.086,tau*(i+1)/sides),"#8c9990");
    for(let i=0;i<8;i++){
      const a=i*tau/8,x=.126;
      g.quad(rim(x,.157,a-.12),rim(x,.189,a-.10),rim(x,.186,a+.13),rim(x,.156,a+.12),ink);
    }
    g.quad(rim(.132,.286,.14),rim(.132,.291,.14),rim(.132,.320,.36),rim(.132,.313,.36),"#9a9b89");
  }
  function runningLamps(g){
    letters(g,endFace(true,3.974),"6 OCEAN LOOP",0,2.377,1.565,.185,lamp);
    letters(g,sideFace(1,1.181),"6 OCEAN LOOP",1.933,2.499,1.20,.125,"#f3c76c");
    for(const x of [-.91,.91]){
      for(const z of [-2.14,-.16,1.80]){
        g.box(x,2.513,z,.102,.021,1.37,"#f5e1a8");
      }
    }
  }
  function routeCard(g){
    // Read it from across the aisle; the four stops are in the order the coach actually runs.
    const at=(u,y)=>[-1.064,y,u];
    ["MARLIN","EL MERCADO","PORT SOL","CINE LUNA"].forEach((name,i)=>{
      letters(g,at,name,-.833+i*.622,2.462,.057*name.length,.082,darkSea);
    });
  }
  function stopLamp(g){
    const {z,y}=stopBoard;
    panel(g,endFace(false,z-.053),-.276,y-.050,.276,y+.052,"#8b5340");
    letters(g,endFace(false,z-.057),"STOP",0,y-.039,.349,.082,"#ffe1a2");
    g.box(-.277,1.263,3.771,.055,.040,.019,"#ffc06d");
  }
  function lighting(g,kind,side){
    for(const s of side?[side]:[-1,1]){
      if(kind==="head")g.box(s*.801,.762,4.134,.212,.085,.016,"#fff0bd");
      if(kind==="stop")g.box(s*.904,.916,-4.142,.119,.105,.013,"#ff7859");
      if(kind==="turn"){
        g.box(s*.952,.762,4.132,.052,.106,.014,"#ffc16b");
        g.box(s*.904,.758,-4.142,.118,.090,.011,"#ffbb62");
        for(const z of [-3.56,.42,3.42])g.box(s*1.194,2.505,z,.010,.034,.133,"#ffce79");
      }
    }
  }
  function lowDetail(g){
    g.box(0,.921,-.02,2.26,1.02,8.06,sea);
    g.box(0,1.177,-.02,2.30,.251,8.11,cream);
    g.box(0,1.058,-.02,2.31,.037,8.12,marigold);
    g.box(0,1.887,-.04,2.25,1.10,7.99,"#557b7e");
    g.box(0,2.548,-.06,2.30,.247,7.93,white);
    g.box(0,2.714,-.08,2.22,.093,7.79,cream);
    g.box(0,2.839,-2.02,1.42,.174,1.82,"#b9bbad");
    for(const side of [-1,1]){
      for(const z of [-3.82,-2.65,-1.59,-.48,.74,1.82,2.75,3.82])g.box(side*1.13,1.878,z,.046,1.14,.068,ink);
      for(const z of axles){
        const x=side*1.173,at=(r,a)=>[x,radius+r*Math.cos(a),z+r*Math.sin(a)];
        for(let i=0;i<12;i++){
          const a=tau*i/12,b=tau*(i+1)/12;
          g.quad(at(radius,a),at(radius,b),at(.222,b),at(.222,a),rubber);
          g.tri([x,radius,z],at(.22,a),at(.22,b),steel);
        }
      }
      g.box(side*.85,.77,4.047,.244,.136,.026,"#e8dfb3");
      g.box(side*.89,.81,-4.059,.149,.232,.025,"#b76751");
    }
    for(const z of doorZ){
      g.box(1.156,1.531,z,.035,1.70,1.04,"#4f7373");
      for(const dir of [-1,0,1])g.box(1.178,1.507,z+dir*.515,.024,1.85,.045,ink);
      g.box(1.174,1.33,z,.018,.045,1.04,marigold);
    }
    g.box(0,2.485,3.968,1.75,.245,.069,ink);
    const sign=endFace(true,4.010);
    letters(g,sign,"6",-.637,2.400,.141,.168,"#efc47a");
    panel(g,sign,-.482,2.463,.002,2.493,marigold);panel(g,sign,.089,2.463,.549,2.493,marigold);
    wing(g,sideFace(1,1.177),.85,.808,1.20);
  }
  const key=id=>"bay-transit/"+id;
  function install(model){
    model(key("coach"),g=>{sides(g);stern(g);nose(g);roofCap(g);});
    model(key("saloon"),cabin);model(key("driver-wheel"),steeringWheel);model(key("route-card"),routeCard);
    model(key("glazing"),glassEdges);model(key("curtain"),runningLamps);
    model(key("stop-requested"),stopLamp);model(key("wheel"),tire);model(key("leaf"),leaf);
    const part=new BayMesh();leaf(part);
    for(const open of [false,true])model(key(open?"doors-folded":"doors-shut"),g=>{
      for(const z of doorZ)leaves(z,open?1:0,(x,zz,yaw)=>copyPart(g,part,x,zz,yaw));
    });
    model(key("headlamps"),g=>lighting(g,"head",0));model(key("brakes"),g=>lighting(g,"stop",0));
    for(const side of [-1,1])model(key("signal"+side),g=>lighting(g,"turn",side));
    model(key("distant"),lowDetail);
  }
  function bodyPoint(bus,x,y,z){
    const pitch=bus.pitch||0,roll=bus.lean||0,cs=Math.cos(bus.yaw||0),sn=Math.sin(bus.yaw||0);
    const py=y*Math.cos(pitch)-z*Math.sin(pitch),pz=y*Math.sin(pitch)+z*Math.cos(pitch);
    const px=x*Math.cos(roll)-py*Math.sin(roll);
    return {x:bus.x+px*cs+pz*sn,y:(bus.y||0)+x*Math.sin(roll)+py*Math.cos(roll),z:bus.z-px*sn+pz*cs};
  }
  const turning=(bus,t)=>(bus.signal===-1||bus.signal===1||bus.signal===2)&&(t%.82)<.43;
  function world(list,bus,t=0,options={}){
    if(!bus)return;
    const yaw=bus.yaw||0,pitch=bus.pitch||0,roll=bus.lean||0,openness=clip(bus.door||0);
    const add=(id,glow=0)=>list.push([key(id),bus.x,bus.y||0,bus.z,yaw,pitch,roll,glow]);
    if(options.near===false&&!options.inside){add("distant",.09);return;}
    add("coach");add("saloon",.32);
    const hub=bodyPoint(bus,steeringHub.x,steeringHub.y,steeringHub.z);
    const angle=clip((bus.steer||0)*4.2,-1.78,1.78),s=Math.sin(angle),c=Math.cos(angle);
    const ca=Math.cos(wheelPitch+pitch),sa=Math.sin(wheelPitch+pitch),sr=Math.sin(roll),cr=Math.cos(roll);
    // Project steering rotation onto the sloping column before rotating the bus body.
    list.push([key("driver-wheel"),hub.x,hub.y,hub.z,yaw+Math.atan2(-sa*s,c*cr-ca*s*sr),
      Math.atan2(sa*cr,ca*c*cr-s*sr),Math.asin(clip(c*sr+ca*s*cr,-1,1))]);
    if(options.inside)add("route-card",.29);else add("glazing");
    add("curtain",.96);
    if(bus.request)add("stop-requested",.95);
    if(options.night>.15)add("headlamps",1);
    if(bus.brake>.14)add("brakes",.92);
    if(turning(bus,t)){
      if(bus.signal!==1)add("signal-1",.90);
      if(bus.signal!==-1)add("signal1",.90);
    }
    if(openness<.005||openness>.995)add(openness<.5?"doors-shut":"doors-folded");
    else for(const z of doorZ)leaves(z,openness,(x,zz,angle)=>{
      const p=bodyPoint(bus,x,0,zz);list.push([key("leaf"),p.x,p.y,p.z,yaw+angle,pitch,roll]);
    });
    if(!options.inside)for(const side of [-1,1])for(const axle of axles){
      const p=bodyPoint(bus,side*track,radius,axle);
      list.push([key("wheel"),p.x,p.y,p.z,yaw+(side<0?Math.PI:0)+(axle>0?(bus.steer||0):0),side*(bus.wheel||0)]);
    }
  }
  function map(c,px,py,s,bus,opt={},t=0){
    if(!bus||s<=0)return;
    c.save();c.translate(px(bus.x),py(bus.z));c.rotate(bus.yaw||0);c.scale(s,-s);
    const rect=(x,z,w,d,col)=>{c.fillStyle=col;c.fillRect(x,z,w,d);};
    function poly(points,color,outline){
      c.beginPath();for(let i=0;i<points.length;i++)(i?c.lineTo(...points[i]):c.moveTo(...points[i]));
      c.closePath();c.fillStyle=color;c.fill();
      if(outline){c.strokeStyle=outline;c.lineWidth=.070;c.stroke();}
    }
    function line(points,color,weight){
      c.beginPath();for(let i=0;i<points.length;i++)(i?c.lineTo(...points[i]):c.moveTo(...points[i]));
      c.strokeStyle=color;c.lineWidth=weight;c.stroke();
    }
    const outline=[[-1.06,4.055],[1.06,4.055],[1.17,3.86],[1.17,-3.92],[1.05,-4.10],[-1.05,-4.10],[-1.17,-3.92],[-1.17,3.86]];
    c.save();c.translate(.19,-.26);poly(outline,"#686c60");c.restore();
    poly(outline,sea,ink);
    if(s<2.5&&opt.mode!=="street"){
      rect(-.88,-3.65,1.76,6.9,cream);rect(-.84,3.07,1.68,.46,ink);
      rect(-.47,-2.75,.94,1.20,steel);c.restore();return;
    }
    for(const side of [-1,1]){
      for(const axle of axles){
        c.save();c.translate(side*1.10,axle);c.rotate(axle>0?-(bus.steer||0):0);
        rect(-.110,-.419,.22,.838,rubber);c.restore();
      }
      rect(side*1.255-.08,3.61,.16,.25,ink);
      rect(side*.986-.075,3.98,.15,.093,opt.night?"#ffedaa":"#d6d5ae");
      rect(side*.894-.081,-4.11,.162,.135,bus.brake>.14?"#ff8466":"#a75950");
      if(turning(bus,t)&&(bus.signal===side||bus.signal===2)){
        rect(side*.977-.092,-4.07,.184,.169,"#ffd772");rect(side*.977-.095,3.88,.19,.18,"#ffd772");
      }
    }
    line([[-1.06,3.91],[-1.13,3.78],[-1.13,-3.78]],marigold,.079);
    const inside=!!opt.inside||!!opt.cutaway;
    if(inside){
      rect(-1.077,-3.87,2.154,7.70,floorInk);rect(-.39,-2.81,.78,5.95,"#889285");
      for(const side of [-1,1])for(const z of axles)rect(side*.93-.172,z-.475,.344,.950,"#9ca596");
      rect(-1.05,-3.88,2.10,1.02,"#a4a890");
      for(const p of [driver,...seats]){
        rect(p.x-.293,p.z-.27,.586,.486,p===driver?ink:cloth);
        rect(p.x-.305,p.z-.285,.61,.088,p===driver?steel:thread);
        rect(p.x-.205,p.z+.115,.410,.032,p===driver?"#708179":"#aab398");
      }
      rect(-1.012,3.666,.936,.313,ink);rect(.08,2.929,.260,.274,steel);
      rect(.109,2.989,.174,.119,marigold);
      for(const z of doorZ){
        rect(.665,z-.548,.475,1.095,"#8f9a8b");rect(1.108,z-.545,.052,1.09,marigold);
        leaves(z,clip(bus.door||0),(x,zz,yaw)=>line([[x,zz],[x+Math.sin(yaw)*leafWidth,zz+Math.cos(yaw)*leafWidth]],ink,.054));
      }
      if(bus.request)rect(-.221,2.357,.442,.086,"#ffd87c");
    }else{
      poly([[-1.122,3.846],[-.980,3.980],[.980,3.980],[1.122,3.846],[1.122,-3.88],[.973,-3.993],[-.973,-3.993],[-1.122,-3.88]],cream);
      poly([[-1.055,3.835],[1.055,3.835],[.950,3.395],[-.950,3.395]],"#65878a");
      line([[-.965,3.442],[.950,3.442]],"#a0b9ab",.047);
      rect(-.715,-3.08,1.43,1.95,"#999f91");rect(-.659,-2.99,1.318,1.73,"#bdc0a6");
      for(const x of [-.327,.327]){
        c.beginPath();c.arc(x,-2.10,.245,0,tau);c.fillStyle="#74847e";c.fill();
        for(const k of [-1,0,1])rect(x-.156,-2.11+k*.092,.312,.030,"#a5ae97");
      }
      rect(-.323,.565,.725,.583,"#929d8e");rect(-.271,.623,.622,.462,"#d6cba9");
      for(const z of [doors.front.z,doors.rear.z]){
        const gap=clip(bus.door||0);
        if(gap>.04){
          rect(.81,z-.53,.353,1.06,floorInk);
          for(const side of [-1,1])line([[1.14,z+side*.54],[1.14-.24*gap,z+side*(.54-.23*(1-gap))]],ink,.061);
        }else line([[1.139,z-.517],[1.139,z+.517]],darkSea,.057);
      }
    }
    c.restore();
  }
  window.BayCityBusArt={install,world,map,bodyPoint,doors,seats,driver,floor,roof,halfWidth:width,halfLength,axles,track,radius};
})();
