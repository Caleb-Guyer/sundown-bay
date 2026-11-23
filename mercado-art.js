/* Rosario's portable night counter on the south side of El Mercado. */
(() => {
  "use strict";
  const stand={x:-37.4,z:-132.2},ground=.103;
  const counter={x:-38,z:-134.5,name:"Rosario’s night counter"};
  const vendor={x:-37.65,z:-131.22,yaw:Math.PI,name:"Rosario"};
  const table={x:6.65,z:.52};
  const blocks=[
    {x:stand.x,z:stand.z,w:4.65,d:1.27,h:1.10},
    {x:stand.x+table.x,z:stand.z+table.z,w:1.26,d:1.26,h:1.10}
  ];
  const enamel="#3c7773",deep="#395753",butter="#f6dda3",red="#ae5145",tomato="#d87855";
  const loden="#6d8066",steel="#9eada2",iron="#494d48",paper="#efdbb6";
  const receiving={x:-36,z:-106},condensers=[[-15.35,-1.75],[-11.93,-1.78]];
  const phaseOf=weather=>weather?.market||"closed";
  const cartWidth=4.65;

  // A slanted brush sign on a double-hemmed piece of sheet metal.
  const strokes={
    R:[[[0,0],[0,1],[.50,1],[.75,.84],[.72,.65],[.50,.50],[.02,.50]],[[.38,.51],[.77,0]]],
    O:[[[.22,.02],[.04,.19],[.06,.80],[.27,.99],[.56,.98],[.75,.80],[.70,.21],[.50,.03],[.22,.02]]],
    S:[[[.78,.86],[.61,.99],[.27,.99],[.05,.81],[.09,.63],[.27,.53],[.57,.46],[.72,.32],[.65,.12],[.48,.01],[.19,.03],[.01,.18]]],
    A:[[[0,0],[.33,1],[.47,1],[.77,0]],[[.15,.42],[.61,.42]]],
    I:[[[.03,.98],[.59,.98]],[[.32,1],[.32,0]],[[.03,.02],[.60,.02]]],
    H:[[[.04,0],[.04,1]],[[.72,.02],[.72,.98]],[[.04,.49],[.72,.53]]],
    E:[[[.72,.98],[.04,.98],[.04,.02],[.73,.02]],[[.04,.50],[.60,.50]]],
    L:[[[.04,1],[.04,.03],[.73,.03]]]
  };
  function brush(g,points,width,project,color){
    for(let i=1;i<points.length;i++){
      const [x,y]=points[i-1],[u,v]=points[i],len=Math.hypot(u-x,v-y);
      if(!len)continue;
      const dx=(u-x)*width/(2*len),dy=(v-y)*width/(2*len);
      g.quad(project(x-dy-dx*.42,y+dx-dy*.42),project(x+dy-dx*.42,y-dx-dy*.42),
        project(u+dy+dx*.42,v-dx+dy*.42),project(u-dy+dx*.42,v+dx+dy*.42),color);
    }
  }
  function sign(g,x,y,z,height,color){
    const word="ROSARIO",start=x-3.16*height;
    for(let i=0;i<word.length;i++){
      const project=(u,v)=>[start+(i*.92+u+v*.12)*height,y+v*height,z];
      for(const path of strokes[word[i]])brush(g,path,.125,project,color);
    }
  }
  function plateMark(g){
    const z=-.619;
    brush(g,[[-.78,.56],[-.54,.48],[.48,.48],[.73,.56]],.04,(x,y)=>[x,y,z],butter);
    brush(g,[[-.87,.60],[-.49,.57],[.49,.57],[.84,.61]],.045,(x,y)=>[x,y,z],butter);
    for(const x of [-.17,.045,.26])
      brush(g,[[x,.635],[x-.057,.704],[x+.035,.77],[x+.008,.84]],.028,(u,y)=>[u,y,z],butter);
    for(const s of [-1,1])for(let i=0;i<2;i++)
      brush(g,[[s*.83,.66+i*.060],[s*(1.41-i*.27),.68+i*.068]],.022,(u,y)=>[u,y,z],butter);
  }
  function crate(g,x,y,z){
    g.box(x,y+.02,z,.63,.07,.44,"#ac8560");
    for(const side of [-1,1]){
      for(const row of [.115,.235])g.box(x,y+row,z+side*.203,.64,.094,.045,"#bc9266");
      g.box(x+side*.293,y+.15,z,.055,.265,.395,"#9e7755");
    }
  }
  function board(g){
    g.box(0,.55,0,cartWidth,.83,1.16,enamel);
    g.box(0,.235,-.59,4.55,.09,.04,deep);
    g.box(0,.97,0,4.83,.11,1.27,steel);
    g.box(0,.995,-.646,4.85,.058,.050,butter);
    g.box(0,.39,-.589,4.39,.038,.020,"#d3b885");
    for(const x of [-2.25,-.77,.76,2.25])g.box(x,.64,-.591,.028,.45,.022,"#65928a");
    for(const x of [-1.87,1.87])for(const s of [-1,1]){
      g.box(x,.125,s*.43,.23,.22,.20,"#4d534e");
      g.box(x,.234,s*.43,.24,.065,.215,steel);
    }
    // The paint has worn through where customers lean against the counter.
    for(const [x,w,y] of [[-1.92,.23,.88],[-1.60,.38,.895],[.87,.34,.893],[1.70,.11,.855]]){
      g.box(x,y,-.594,w,.023,.014,"#a9a18a");
    }
    plateMark(g);
    for(const x of [-2.35,2.35]){
      g.pole([x,.22,.43],[x,2.90,.43],.047,deep,5);
      g.box(x,1.07,.44,.145,.19,.155,steel);
      g.pole([x,2.74,.43],[x,2.76,-.58],.031,iron,4);
    }
    g.pole([-2.49,2.82,.55],[2.52,2.82,.55],.069,enamel,7);
    // A high standing table is always here. The proprietor stacks the stools after service.
    g.cyl(table.x,.075,table.z,.42,.45,.10,9,deep);
    g.cyl(table.x,.58,table.z,.069,.078,1.00,7,steel);
    g.cyl(table.x,1.12,table.z,.64,.62,.115,10,"#c18860");
    g.cyl(table.x,1.18,table.z,.62,.64,.036,10,"#e5c18a");
    crate(g,2.87,.02,.63);
  }

  function canopy(g,opening){
    const left=-2.57,right=2.57,n=11;
    const edge=opening?-.32:-1.14,frontY=opening?2.72:2.54;
    const hw=(right-left)/n;
    for(let i=0;i<n;i++){
      const a=left+i*hw,b=a+hw,mid=(a+b)*.5,c=i%2?"#f1cc91":tomato;
      g.quad([a,2.93,.78],[b,2.93,.78],[b,frontY,edge],[a,frontY,edge],c,i%3?.99:1.045);
      g.quad([a,frontY,edge],[b,frontY,edge],[b,frontY-.114,edge-.012],[a,frontY-.114,edge-.012],c,.94);
      g.tri([a,frontY-.111,edge-.012],[b,frontY-.111,edge-.012],[mid,frontY-.22,edge-.017],c);
    }
    for(const x of [left+.11,right-.11]){
      g.pole([x,2.65,.42],[x,frontY,edge],.042,deep,5);
      g.pole([x,2.2,.42],[x,frontY-.02,edge+.02],.026,steel,4);
    }
    // Counter sign sits ahead of the awning so it is legible from the driver's seat.
    g.box(-.36,frontY+.20,edge-.032,3.55,.59,.092,red);
    g.box(-.36,frontY+.463,edge-.084,3.48,.034,.010,"#e5a36d");
    g.box(-.36,frontY-.058,edge-.084,3.48,.035,.010,"#df9e6b");
    sign(g,-.33,frontY+.012,edge-.089,.375,butter);
    // Hanging orange-slice blade is visible from either direction down the street.
    const bx=2.45;
    g.pole([2.34,2.85,.43],[bx,3.32,.42],.034,deep,5);
    g.pole([bx,3.32,.42],[bx,3.32,-.49],.036,deep,5);
    g.pole([bx,3.32,-.41],[bx,3.02,-.41],.018,iron,4);
    const at=(side,r,a)=>[bx+side*.057,2.76+Math.sin(a)*r,-.41+Math.cos(a)*r];
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
      g.quad(at(-1,.32,a),at(-1,.32,b),at(1,.32,b),at(1,.32,a),"#b58c5a");
      for(const side of [-1,1]){
        g.tri(at(side,0,0),at(side,.32,a),at(side,.32,b),butter);
        if(i<6||i>7){
          const inset=(r,u)=>{const p=at(side,r,u);p[0]+=side*.005;return p;};
          g.tri(inset(.038,(a+b)*.5),inset(.25,a+.047),inset(.25,b-.047),"#ec914c");
        }
      }
    }
  }
  function bottle(g,x,y,z,col){
    g.cyl(x,y+.125,z,.081,.09,.25,7,col);
    g.cyl(x,y+.277,z,.037,.081,.055,7,col);
    g.cyl(x,y+.324,z,.038,.038,.048,7,butter);
  }
  function foodBox(g,x,y,z,closed){
    g.box(x,y+.048,z,.37,.096,.25,closed?paper:"#c8a374");
    if(closed)g.box(x,y+.111,z,.385,.034,.270,paper);
    else for(const dx of [-.093,.065])g.cyl(x+dx,y+.10,z,.060,.080,.095,6,"#cf8850");
    g.box(x+.032,y+.132,z,.06,.009,.254,closed?red:butter);
  }
  function prep(g,opening){
    canopy(g,opening);
    g.box(-.76,1.102,.055,1.59,.164,.87,iron);
    g.box(-.76,1.204,.04,1.49,.066,.77,"#696e64");
    g.box(-.77,1.245,.396,1.51,.16,.046,"#8f9689");
    g.cyl(-.96,1.28,.04,.265,.215,.07,12,"#393f3d");
    g.pole([-1.13,1.29,.16],[-1.42,1.406,.30],.045,"#9a7656",5);
    g.cyl(-.42,1.31,.17,.206,.17,.15,9,"#b57855");
    g.cyl(-.42,1.394,.17,.195,.198,.022,9,"#985742");
    for(const x of [-1.2,-.95,-.70]){
      g.box(x,1.113,-.396,.089,.077,.052,"#c49260");
    }
    if(opening){
      g.cyl(-.96,1.346,.04,.044,.254,.077,10,steel);
      g.cyl(-.96,1.40,.04,.042,.042,.06,6,iron);
      crate(g,1.14,1.025,.03);bottle(g,1.07,1.13,.04,loden);
      foodBox(g,.23,1.033,-.19,true);
    }else{
      for(const [x,z,col] of [[-1.08,-.03,"#e4aa65"],[-.89,.11,"#ce7e4e"],[-.88,-.055,"#daa259"]]){
        g.cyl(x,1.335,z,.083,.093,.055,7,col);
      }
      for(const [i,color] of [loden,tomato,"#d7a453"].entries())bottle(g,.28+i*.195,1.035,.32,color);
      g.box(.47,1.065,-.16,.74,.075,.43,"#c19d74");
      foodBox(g,.42,1.103,-.18,false);
      for(let i=0;i<3;i++)foodBox(g,1.20+i*.11,1.034+i*.124,.02,true);
      g.cyl(1.95,1.235,.18,.14,.09,.39,7,paper);
      for(const x of [1.91,1.98,2.00])g.pole([1.95,1.36,.18],[x,1.61,.18+(x-1.94)],.011,iron,4);
    }
    // The serving ticket is clipped to a nail. It flaps out below its two clips.
    g.quad([1.79,.94,-.61],[2.13,.94,-.61],[2.10,.57,-.69],[1.78,.55,-.70],paper);
    for(let i=0;i<3;i++)g.box(1.94,.84-i*.068,-.64-i*.013,.20-i*.029,.016,.012,"#947e64");
    g.box(1.95,.94,-.625,.14,.042,.03,iron);
  }
  function locked(g){
    g.box(0,1.37,.046,4.46,.66,1.03,"#809a8d");
    for(let i=0;i<7;i++)g.box(0,1.083+i*.09,-.48,4.42,.026,.021,i%3===0?"#718e84":"#9fb09a");
    g.box(0,1.73,.047,4.51,.082,1.07,"#adb8a1");
    g.box(-.15,1.27,-.509,1.04,.087,.052,iron);
    g.box(-.12,1.193,-.551,.121,.141,.08,"#c69259");
    g.box(1.225,1.49,-.503,1.76,.36,.029,enamel);
    sign(g,1.225,1.395,-.526,.198,butter);
    g.pole([-2.51,2.84,.60],[2.51,2.84,.60],.14,"#bb795b",8);
    for(const x of [-2,-.51,1.25])g.pole([x,2.84,.60],[x+.085,2.84,.60],.15,"#d2be92",8);
    for(let i=0;i<3;i++){
      g.box(table.x+.11,1.28+i*.095,table.z,.55,.09,.42,i%2?enamel:loden);
    }
    for(const s of [-1,1])g.box(table.x+.11+s*.20,1.72,table.z+.12,.077,.55,.072,deep);
  }

  function lamps(g){
    const start=-2.25,end=2.27,z=-.93;
    const hang=x=>2.53-.22*(1-(x/2.35)**2);
    for(let i=0;i<=6;i++){
      const x=start+(end-start)*i/6,h=hang(x);
      if(i<6){const right=start+(end-start)*(i+1)/6;g.pole([x,h,z],[right,hang(right),z],.015,iron,4);}
      g.cyl(x,h-.063,z,.040,.055,.12,5,"#85694b");
      g.cyl(x,h-.145,z,.060,.074,.093,7,i%3===1?"#ffe7a9":"#ffc17d");
      g.cyl(x,h-.208,z,.061,.032,.045,7,"#ffe3a4");
    }
    // A narrow warm rail catches the light on the polished customer ledge.
    g.box(0,.994,-.675,4.72,.024,.012,"#ffe4a5");
    sign(g,-.33,2.552,-1.234,.375,"#ffdda0");
  }
  function floorLight(g){
    // The existing alpha pass interpolates the red channel. Keep the soft pools in
    // world coordinates so they blend over the real pavement and its expansion joints.
    for(const [x,z,rx,rz,strength] of [[-.91,-.77,2.95,2.58,.30],[1.23,-.80,2.42,2.17,.16]]){
      const point=(angle,r,alpha)=>g.vertices.push(stand.x+x+rx*r*Math.cos(angle),.114,
        stand.z+z+rz*r*Math.sin(angle),alpha,0,0);
      for(let j=0;j<18;j++){
        const a=j*Math.PI/9,b=(j+1)*Math.PI/9;
        point(a,0,strength);point(a,.48,strength*.62);point(b,.48,strength*.62);
        point(a,.48,strength*.62);point(a,1,0);point(b,1,0);
        point(a,.48,strength*.62);point(b,1,0);point(b,.48,strength*.62);
      }
    }
  }
  function light(view,see,weather){
    if(phaseOf(weather)==="open"&&see(stand,82))view.drawSearchlight("mercado-light");
  }
  function steam(g){
    const outline=[[-.037,0],[.028,.095],[.049,.182],[.006,.288],[-.016,.352],[.052,.437]];
    for(let i=1;i<outline.length;i++){
      const [x,y]=outline[i-1],[a,b]=outline[i],w=.025-i*.002;
      g.quad([x-w,y,0],[x+w,y,.006],[a+w,b,.012],[a-w,b,.008],"#dbceba");
    }
  }
  function rosario(g){
    buildBayPerson(g,"#996445","#cd7a59","#56675e",0,"local",1);
    g.quad([-.107,1.368,.129],[.105,1.368,.129],[.158,.894,.132],[-.149,.894,.132],"#8ba991");
    g.box(.009,1.046,.143,.171,.091,.009,"#6d8f7c");
    for(const s of [-1,1])g.pole([s*.090,1.363,.126],[s*.082,1.434,.024],.018,butter,4);
    g.cyl(0,1.707,0,.110,.112,.044,9,red);
    g.cyl(-.04,1.708,-.105,.075,.064,.095,7,"#584741");
    g.pole([.313,1.335,.195],[.359,1.204,.53],.017,steel,4);
    g.quad([.326,1.206,.50],[.390,1.206,.50],[.421,1.179,.646],[.316,1.179,.650],steel);
  }
  // The north wall faces the pickup court. All protruding fittings sit above the rear curb.
  function receivingWall(g){
    const face=(x,y,z,w,h,c)=>g.quad([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],c);
    const sill="#acae97",blue="#6c8583";
    // Faded ice-house lettering is painted into the stucco west of the stockroom.
    face(-15.10,4.58,.034,6.25,1.97,"#ddbd91");
    for(const [i,letter] of [..."HIELO"].entries()){
      const project=(u,v)=>[-12.83-(i*.94+u+.055*v)*1.02,4.03+v*1.05,.049];
      for(const path of strokes[letter])brush(g,path,.105,project,"#738c7c");
    }
    for(const [x,y,w] of [[-15.19,4.29,.33],[-14.29,4.69,.18],[-13.19,4.33,.22],[-16.62,4.59,.48]])face(x,y,.056,w,.035,"#d6bb95");
    face(-14.97,3.72,.044,4.78,.049,"#b88766");
    // Old corrugated stock door, its half-round roller hood and rub strips.
    const door=-5.48;
    g.box(door,1.96,.082,5.86,3.83,.14,"#56695f");
    face(door,1.99,.159,5.54,3.53,"#91a49a");
    for(let row=0;row<14;row++)face(door,.38+row*.242,.173,5.50,row%3?.038:.056,"#778c84");
    for(const side of [-1,1]){
      g.box(door+side*2.86,1.98,.13,.16,3.79,.23,"#667973");
      g.box(door+side*3.17,.66,.20,.24,1.12,.34,"#b28e61");
    }
    g.box(door,3.97,.201,6.20,.36,.43,blue);face(door,3.90,.426,5.87,.042,"#b4b6a0");
    face(door,.32,.18,5.43,.105,"#5c6e65");
    // Clerestory panes share a lintel but have differently angled hopper windows.
    for(const [i,x] of [-10.22,-6.92,-3.62,-.32,3.0].entries()){
      g.box(x,5.70,.078,2.87,1.09,.13,"#6c796c");
      face(x,5.72,.151,2.62,.86,i%2?"#81958a":"#71918d");
      face(x,5.94,.159,2.61,.16,"#a3b5a3");
      g.box(x+.04,5.69,.171,.066,.89,.048,sill);
      g.box(x,5.14,.169,3.04,.10,.33,sill);
    }
    for(const x of [-18.25,.96]){
      g.pole([x,7.45,.135],[x,.43,.135],.070,blue,5);
      for(const y of [1.17,3.97,6.69])g.box(x,y,.15,.22,.074,.18,"#a2a38c");
      g.pole([x,.45,.135],[x,.32,.30],.075,blue,5);
    }
    // Low rooftop condensers have separate fan rotors, reusing the same two buffers.
    for(const [x,z] of condensers){
      g.box(x,7.94,z,2.23,.24,1.81,"#606c65");
      g.box(x,8.25,z,2.15,.59,1.73,"#aab1a2");
      g.box(x,8.57,z,2.25,.075,1.81,"#b9bba8");
      g.cyl(x,8.625,z,.615,.615,.04,12,"#485d5c");
      for(let j=0;j<5;j++)face(x,8.05+j*.085,z+.875,1.75,.036,"#708580");
    }
    // A galvanized return runs from the cold room to the units, clear of the parapet.
    g.pole([-15.35,8.14,-2.12],[-15.35,8.14,-3.77],.097,sill,6);
    g.pole([-15.35,8.14,-3.77],[-11.95,8.14,-3.77],.097,sill,6);
    g.pole([-11.95,8.14,-3.77],[-11.95,8.14,-2.12],.097,sill,6);
  }
  function fanBlades(g){
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,P=(r,angle,h)=>[r*Math.cos(a+angle),h,r*Math.sin(a+angle)];
      g.quad(P(.09,-.32,.006),P(.52,-.40,.011),P(.56,.17,.035),P(.18,.44,.024),"#80938b");
    }
    g.cyl(0,.032,0,.102,.117,.055,8,"#abb4a2");
  }
  function receivingLights(g){
    for(const x of [-10.22,-6.92,-3.62,-.32,3.0])for(const dx of [-.66,.69]){
      const l=x+dx-.58,r=x+dx+.58;
      g.quad([l,5.33,.177],[r,5.33,.177],[r,5.91,.177],[l,5.91,.177],dx<0?"#d2ae77":"#ba9e70");
    }
  }
  function receivingMap(c,px,py,s,t){
    c.save();c.translate(px(receiving.x),py(receiving.z));c.scale(s,-s);
    for(const [x,z] of condensers){
      c.fillStyle="#77847c";c.fillRect(x-1.05,z-.98,2.31,1.95);
      c.fillStyle="#b2b7a5";c.fillRect(x-1.125,z-.905,2.25,1.81);
      c.fillStyle="#536965";c.beginPath();c.arc(x,z,.615,0,Math.PI*2);c.fill();
      c.save();c.translate(x,z);c.rotate(-t*(x<-14?2.4:2.1));
      for(let j=0;j<4;j++){c.rotate(Math.PI/2);c.fillStyle="#92a397";c.beginPath();c.moveTo(.07,-.06);c.lineTo(.50,-.20);c.lineTo(.54,.11);c.lineTo(.14,.12);c.closePath();c.fill();}
      c.restore();
    }
    c.strokeStyle="#9ba797";c.lineWidth=.17;c.beginPath();c.moveTo(-15.35,-2.12);c.lineTo(-15.35,-3.77);c.lineTo(-11.95,-3.77);c.lineTo(-11.95,-2.12);c.stroke();
    c.fillStyle="#748b86";c.fillRect(-8.58,-.03,6.20,.45);c.restore();
  }
  function install(model){
    model("mercado-counter",board);model("mercado-closed",locked);
    model("mercado-setup",g=>prep(g,true));model("mercado-open",g=>prep(g,false));
    model("mercado-lamps",lamps);model("mercado-light",floorLight);
    model("mercado-receiving",receivingWall);model("mercado-condenser-fan",fanBlades);model("mercado-stockroom-lights",receivingLights);
    model("mercado-steam",steam);model("mercado-rosario",rosario);
  }

  // A short real loop brings people up to the ledge, away with a carton, then to the eating table.
  // Its waiting times are longer than its walking legs, so the line has pauses and space for the player.
  const route=[[7.65,-2.80,1.9],[4.25,-2.20,2.5],[2.47,-1.85,3.2],
    [1.02,-1.21,4.3],[1.99,-2.67,0],[5.70,-2.79,0],[6.47,-.55,5.0],[7.67,-.55,0],[7.72,.43,2.8],[8.04,-.95,0]];
  const schedule=[];let lap=0;
  for(let i=0;i<route.length;i++){
    const [x,z,wait]=route[i],[nx,nz]=route[(i+1)%route.length];
    const depart=lap+wait,end=depart+Math.hypot(nx-x,nz-z)/.87;
    schedule.push({x,z,nx,nz,depart,end,walkYaw:Math.atan2(nx-x,nz-z),waitYaw: i===6||i===8?
      Math.atan2(table.x-x,table.z-z):Math.atan2(-.25-x,.98-z)});
    lap=end;
  }
  const clients=[{style:2,role:"tourist",shirt:"#edca94",skin:"#d2a37e"},
    {style:5,role:"dockhand",shirt:"#a8ba91",skin:"#785240"},
    {style:4,role:"local",shirt:"#e49a88",skin:"#c48b65"}];
  function guest(i,t){
    const u=((t+lap*(.10+i/clients.length))%lap+lap)%lap;
    const leg=schedule.find(v=>u<v.end)||schedule[0],walk=u>=leg.depart;
    const s=walk?(u-leg.depart)/(leg.end-leg.depart):0;
    return {x:leg.x+(leg.nx-leg.x)*s,z:leg.z+(leg.nz-leg.z)*s,
      yaw:walk?leg.walkYaw:leg.waitYaw,moving:walk,phase:1+(Math.floor(s*8+(u-leg.depart)*3.3)%4)};
  }
  function world(list,see,weather,t,personSkin){
    if(!see(stand,120))return;
    const phase=phaseOf(weather);
    if(see(receiving,95)){
      list.push(["mercado-receiving",receiving.x,0,receiving.z]);
      if(phase!=="closed")list.push(["mercado-stockroom-lights",receiving.x,0,receiving.z,0,0,0,.77]);
      if(see(receiving,61))for(const [x,z] of condensers)list.push(["mercado-condenser-fan",receiving.x+x,8.651,receiving.z+z,t*(x<-14?2.4:2.1)]);
    }
    list.push(["mercado-counter",stand.x,ground,stand.z],["mercado-"+phase,stand.x,ground,stand.z]);
    if(phase==="closed")return;
    if(phase==="open")list.push(["mercado-lamps",stand.x,ground,stand.z,0,0,0,.94]);
    if(!see(stand,78))return;
    const turn=vendor.yaw+.11*Math.sin(t*.73);
    list.push(["mercado-rosario",vendor.x,ground,vendor.z,turn,0,0,phase==="open"?.29:0]);
    if(phase!=="open")return;
    for(let i=0;i<clients.length;i++){
      const p=guest(i,t),style=clients[i];
      list.push([personSkin(style.style,style.role,p.moving?p.phase:0,p.moving?0:i===1?2:1),
        stand.x+p.x,ground,stand.z+p.z,p.yaw,0,0,p.x<2.3?.21:0]);
    }
    if(see(stand,46))for(let i=0;i<3;i++){
      const age=(t*.64+i/3)%1;
      if(age>.77)continue;
      list.push(["mercado-steam",stand.x-1.06+i*.09+age*.08,ground+1.39+age*.41,
        stand.z+Math.sin(i+age*3)*.04,Math.sin(t*.40+i)*.8,0,Math.sin(age*3+i)*.15,.18]);
    }
  }

  // Local overhead coordinates use the front/road edge as positive canvas y.
  function map(ctx,px,py,scale,weather,t){
    const phase=phaseOf(weather),open=phase==="open",working=phase!=="closed";
    ctx.save();ctx.translate(px(stand.x),py(stand.z));ctx.scale(scale,scale);
    const rect=(x,y,w,h,color)=>{ctx.fillStyle=color;ctx.fillRect(x,y,w,h);};
    const disc=(x,y,r,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();};
    const poly=(points,color)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(...points[0]);
      for(let i=1;i<points.length;i++)ctx.lineTo(...points[i]);ctx.closePath();ctx.fill();};
    if(open){
      const spill=ctx.createRadialGradient(.4,1.2,.3,.4,1.2,4.12);
      spill.addColorStop(0,"rgba(255,207,120,.29)");spill.addColorStop(1,"rgba(255,196,100,0)");
      rect(-3.8,-3,8.6,8.4,spill);
    }
    rect(-2.18,-.33,4.82,1.58,"#707775");rect(-2.36,-.62,4.72,1.28,enamel);
    disc(table.x+.13,-table.z+.15,.65,"#808879");disc(table.x,-table.z,.65,"#dcaf7d");
    rect(2.54,-.85,.64,.42,"#bc9166");
    if(working){
      const front=open?1.14:.32,w=5.14/11;
      rect(-2.39,.04,4.80,.75,"#d3bb8b");
      disc(-.93,-.04,.29,iron);disc(-.42,-.17,.20,tomato);
      for(let i=0;i<11;i++){
        const x=-2.57+i*w,c=i%2?butter:tomato;
        rect(x,-.78,w+.004,front+.78,c);
        poly([[x,front],[x+w,front],[x+w*.5,front+.16]],i%2?"#e8b97e":"#ad604c");
      }
      rect(-1.98,front-.08,3.51,.16,red);
      if(open){
        for(let i=0;i<7;i++)disc(-2.25+i*.752,front+.15,.072,"#ffe7a8");
        const a=(t*.64)%1;
        disc(-1+a*.14,-.42-a*.47,.06+a*.024,"#dfcfb2");
      }
    }else{
      rect(-2.23,-.56,4.46,1.02,"#8eaa9b");
      for(let i=0;i<6;i++)rect(-2.19,-.49+i*.16,4.38,.032,"#76988b");
      rect(-2.52,-.79,5.04,.27,"#bc825f");
      for(const x of [-2,-.51,1.25])rect(x,-.79,.12,.27,"#d7c596");
      rect(table.x-.19,-table.z-.35,.64,.47,enamel);
    }
    function person(x,z,yaw,shirt,skin,headwear){
      ctx.save();ctx.translate(x,-z);ctx.rotate(yaw);ctx.scale(1.42,1.42);
      ctx.fillStyle="#827c6d";ctx.beginPath();ctx.ellipse(.085,.10,.22,.17,0,0,Math.PI*2);ctx.fill();
      ctx.fillStyle=shirt;ctx.beginPath();ctx.ellipse(0,.030,.245,.137,0,0,Math.PI*2);ctx.fill();
      disc(0,-.035,.126,skin);disc(0,-.002,.109,headwear);ctx.restore();
    }
    if(working)person(vendor.x-stand.x,vendor.z-stand.z,vendor.yaw,"#90ac93","#996445",red);
    if(open)for(let i=0;i<clients.length;i++){
      const p=guest(i,t),style=clients[i];person(p.x,p.z,p.yaw,style.shirt,style.skin,i===0?"#dbb87c":i===1?enamel:"#5d4541");
    }
    ctx.restore();
  }
  window.BayMercadoArt={counter,vendor,blocks,receiving,receivingMap,install,world,light,map};
})();
