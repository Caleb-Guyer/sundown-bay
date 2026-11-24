/* Buttonwood Pip 16. Local +Z runs from the transom towards the bow and the coupler. */
(() => {
  "use strict";
  const tau=2*Math.PI,sides=[-1,1],clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const salt="#e8e1c5",mint="#9dbeb0",foam="#c4d6c2",sea="#577e76",keel="#375a55";
  const red="#b9503c",lip="#303f40",deck="#a5b5a1",teak="#a87651",grain="#d19d6d";
  const iron="#47565a",tin="#a5afa9",edge="#d8d9c7",zinc="#778885",rust="#94654b",rubber="#343b3c";
  const gold="#d89b49",basket="#bb8050",cord="#d8b786";
  const layout=Object.freeze({
    length:4.7,beam:1.74,deckY:.105,wheelRadius:.31,axleTrack:2.02,
    loaded:{x:0,y:.75,z:.18},tongue:{x:0,y:.56,z:3.86},
    helm:{x:-.37,y:.54,z:-.47},passenger:{x:.36,y:.53,z:.48},
    haulStand:{x:.38,y:.105,z:.84,yaw:Math.PI/2},sheave:{x:1.075,y:1.31,z:.79},
    bushel:{x:.41,y:.11,z:-1.51},motor:{x:0,y:.38,z:-2.31}
  });
  // Actual station offsets: aft is a broad, closed transom, forward is a shallow spoon bow.
  // z, sheer half-width, sheer height, keel height
  const stations=[
    [-2.33,.645,.51,-.19],[-1.94,.771,.505,-.255],[-1.2,.844,.485,-.274],
    [-.43,.87,.482,-.28],[.51,.857,.507,-.264],[1.23,.743,.549,-.194],
    [1.74,.539,.60,-.052],[2.12,.293,.649,.15],[2.37,.025,.683,.46]
  ];
  function level(st,side,n){
    const [z,w,h,k]=st,ys=[k,k+.091,k+.146,h-.277,h-.145,h-.109,h-.052,h-.024,h];
    const widths=[0,.66,.81,.949,.986,.993,1,1,.995];
    return [side*w*widths[n],ys[n],z];
  }
  const plankColors=[keel,"#668879",mint,foam,red,"#c65f44",salt,lip];
  function point(st,side,f,y){return [st[1]*side*f,y,st[0]];}
  function plane(g,x0,x1,z0,z1,y,color){
    g.quad([x0,y,z0],[x1,y,z0],[x1,y,z1],[x0,y,z1],color);
  }
  function strut(g,a,b,w,h,color){
    const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],flat=Math.hypot(dx,dz),len=Math.hypot(flat,dy);
    if(flat<.0001){g.box(a[0],(a[1]+b[1])*.5,a[2],w,Math.abs(dy),h,color);return;}
    const nx=dz/flat*w*.5,nz=-dx/flat*w*.5;
    const ux=-dx*dy/(len*flat)*h*.5,uy=flat/len*h*.5,uz=-dz*dy/(len*flat)*h*.5;
    const corners=p=>[[-1,-1],[1,-1],[1,1],[-1,1]].map(([s,k])=>[p[0]+s*nx+k*ux,p[1]+k*uy,p[2]+s*nz+k*uz]);
    const m=corners(a),n=corners(b);
    for(let i=0;i<4;i++){const j=(i+1)%4;g.quad(m[i],n[i],n[j],m[j],color,[.68,.91,1.035,.81][i]);}
    g.quad(...m,color,.86);g.quad(...n,color,.94);
  }
  function tube(g,points,r,color,n=6){
    for(let j=1;j<points.length;j++)g.pole(points[j-1],points[j],r,color,n);
  }
  // A turned profile along the X axis, used for rims, rollers and the winch.
  function turned(g,x,y,z,profile,n,start=0){
    const point=(row,i)=>[x+row[0],y+row[1]*Math.sin(tau*i/n+start),z+row[1]*Math.cos(tau*i/n+start)];
    for(let j=1;j<profile.length;j++){
      const a=profile[j-1],b=profile[j];
      for(let i=0;i<n;i++)g.quad(point(a,i),point(b,i),point(b,i+1),point(a,i+1),b[2],.88+.10*Math.sin((i+.5)*tau/n));
    }
  }
  function hullSkin(g){
    for(let j=1;j<stations.length;j++){
      const a=stations[j-1],b=stations[j];
      for(const s of sides){
        for(let k=0;k<plankColors.length;k++)g.quad(level(a,s,k),level(b,s,k),level(b,s,k+1),level(a,s,k+1),plankColors[k],s<0?.91:1);
        const narrow=st=>Math.max(0,st[1]-.088);
        const top=st=>[s*narrow(st),st[2]+.012,st[0]];
        const lower=st=>[s*Math.max(0,st[1]*.78-.055),Math.max(.105,st[3]+.064),st[0]];
        g.quad(level(a,s,8),level(b,s,8),top(b),top(a),salt,s<0?.98:1.03);
        g.quad(top(a),top(b),lower(b),lower(a),mint,s<0?.92:1.01);
        const mid=st=>[0,Math.max(.105,st[3]+.064),st[0]];
        g.quad(lower(a),lower(b),mid(b),mid(a),deck,s<0?.98:1);
        if(j>=6){
          const hood=st=>[0,st[2]+.028,st[0]];
          g.quad(top(a),top(b),hood(b),hood(a),foam,s<0?.99:1.035);
        }
      }
    }
    for(const end of [stations[0],stations[stations.length-1]]){
      for(let k=0;k<plankColors.length;k++)g.quad(level(end,-1,k),level(end,1,k),level(end,1,k+1),level(end,-1,k+1),plankColors[k],.95);
    }
    g.quad([-.56,.105,-2.304],[.56,.105,-2.304],[.58,.5,-2.304],[-.58,.5,-2.304],mint);
    g.quad([-.56,.535,1.23],[.56,.535,1.23],[.51,.107,1.23],[-.51,.107,1.23],sea);
    g.box(0,.326,-2.307,.54,.363,.076,"#687976");
    for(const s of sides){
      g.tri([s*.39,.112,-1.94],[s*.39,.114,-2.29],[s*.39,.40,-2.29],sea);
      strut(g,[s*.56,.125,-1.80],[s*.57,.45,-2.26],.047,.04,foam);
      // Dented paint and old zinc rubs scatter along the working quarter.
      for(const [i,u,width] of [[1,.26,.09],[1,.66,.061],[2,.46,.135],[3,.72,.069],[4,.3,.095]]){
        const a=stations[i],b=stations[i+1],p=[s*(a[1]+(b[1]-a[1])*u)*.998,a[2]+(b[2]-a[2])*u-.081,a[0]+(b[0]-a[0])*u];
        g.tri([p[0],p[1],p[2]],[p[0],p[1]+.012,p[2]+width],[p[0],p[1]-.009,p[2]+width*.47],salt);
      }
      for(const z of [-1.10,-.05,.98])strut(g,[s*.617,.115,z],[s*.777,.423,z],.031,.042,foam);
    }
    for(const x of [-.43,-.30,-.17,.07,.20,.33,.46])plane(g,x,x+.015,-1.76,1.16,.109,"#849c8d");
    // Stencilled model name at the transom, registration on the flanks and a matching hatch number.
    const pips={P:["110","101","110","100","100"],I:["111","010","010","010","111"],"1":["010","110","010","010","111"],"6":["011","100","111","101","111"]};
    function stamp(word,sz,at,col){
      let colOffset=-word.length*2*sz;
      for(const letter of word){
        for(let row=0;row<5;row++)for(const run of pips[letter][row].matchAll(/1+/g)){
          const u=colOffset+run.index*sz,v=(2.5-row)*sz,w=run[0].length*sz;
          g.quad(at(u,v),at(u+w,v),at(u+w,v-sz),at(u,v-sz),col);
        }
        colOffset+=4*sz;
      }
    }
    stamp("PIP",.022,(u,v)=>[u-.39,.271+v,-2.335],lip);
    stamp("16",.029,(u,v)=>[u,.659,1.695+v],sea);
    for(const s of sides){
      const at=(u,v)=>{const z=.81+s*u,x=.857+(z-.51)/.72*(.743-.857),h=.507+(z-.51)/.72*.042;
        return [s*(x*(.968+v*.21)+.003),h-.210+v,z];};
      stamp("PIP16",.023,at,"#344d50");
    }
    // Ring bolt below the stem lines up with the trailer's winch strap.
    tube(g,[[-.049,.381,2.275],[-.035,.378,2.353],[.035,.378,2.353],[.049,.381,2.275]],.014,iron,5);
  }
  function cleat(g,x,y,z){
    g.box(x,y,z,.055,.048,.067,iron);
    strut(g,[x-.079,y+.035,z-.044],[x+.079,y+.035,z+.044],.04,.028,edge);
  }
  function seat(g,x,z,y,width){
    g.box(x,.294,z,width-.12,.367,.305,sea);
    g.box(x,y-.049,z,width+.025,.082,.36,"#685841");
    for(let j=-1;j<=1;j++){
      g.box(x,y-.014,z+j*.116,width,.026,.106,j===0?"#ba8b5d":teak);
      plane(g,x-width*.39,x+width*.31,z+j*.116-.009,z+j*.116+.002,y+.001,grain);
    }
    for(const s of sides)plane(g,x+s*width*.41-.016,x+s*width*.41+.016,z-.12,z+.12,y+.002,"#8b745c");
  }
  function bushel(g){
    const {x,z}=layout.bushel,n=12;
    g.cyl(x,.137,z,.205,.184,.04,n,basket);
    const at=(r,i,y)=>[x+r*Math.sin(tau*i/n),y,z+r*Math.cos(tau*i/n)];
    for(let i=0;i<n;i++){
      const a=tau*i/n;
      const strip=(r,y,k)=>[x+r*Math.sin(a+k),y,z+r*Math.cos(a+k)];
      g.quad(strip(.204,.145,-.157),strip(.204,.145,.157),strip(.267,.438,.157),strip(.267,.438,-.157),i%3===1?"#d39c65":basket,.92+.06*Math.sin(a));
      for(const [y,r] of [[.235,.231],[.354,.258],[.444,.273]]){
        const p=at(r,i,y),q=at(r,i+1,y);
        g.quad(p,q,[q[0],y+.022,q[2]],[p[0],y+.022,p[2]],y>.43?grain:rust);
      }
    }
    for(const s of sides)tube(g,[[x+s*.232,.419,z-.078],[x+s*.26,.506,z-.075],[x+s*.26,.506,z+.075],[x+s*.232,.419,z+.078]],.011,iron,5);
  }
  function workingDeck(g){
    seat(g,-.37,-.47,.54,.49);seat(g,.36,.48,.53,.47);
    // Steering cable from the little port console turns down inside the port gunwale.
    g.box(-.40,.359,.052,.365,.49,.257,foam);
    g.box(-.40,.612,.058,.416,.04,.30,teak);
    g.quad([-.59,.583,-.105],[-.213,.583,-.105],[-.213,.72,-.018],[-.59,.72,-.018],iron);
    const hub=[-.399,.648,-.156],circle=[];
    for(let j=0;j<=10;j++){
      const u=tau*j/10;
      circle.push([hub[0]+.132*Math.cos(u),hub[1]+.097*Math.sin(u),hub[2]+.081*Math.sin(u)]);
    }
    tube(g,circle,.012,lip,5);
    for(const i of [0,3,7])g.pole(hub,circle[i],.010,tin,4);
    g.pole([-.25,.61,.015],[-.225,.706,.06],.013,iron,5);
    g.box(-.224,.706,.06,.041,.03,.047,red);
    tube(g,[[-.61,.489,.09],[-.62,.79,.085],[-.595,.827,.085],[-.202,.827,.085],[-.185,.792,.085],[-.185,.619,.085]],.013,edge,5);
    plane(g,-.57,-.49,.013,.077,.635,"#e1d098");
    const bow=1.667,bowY=.61;
    g.box(0,bowY,bow,.529,.047,.41,sea,.018);
    g.box(0,bowY+.023,bow,.497,.045,.384,"#acc3ac",.018);
    for(const x of [-.17,.17])g.box(x,bowY+.05,bow+.147,.069,.019,.057,tin);
    g.box(0,bowY+.047,bow-.117,.111,.014,.047,iron);cleat(g,0,.669,2.015);
    cleat(g,-.636,.53,-1.996);cleat(g,.636,.53,-1.996);
    for(const s of sides){
      g.box(s*.697,.563,1.213,.079,.052,.128,lip);
      g.box(s*.697,.597,1.21,.065,.021,.103,s<0?"#b64b35":"#699a7a");
    }
    // The aft locker, open coconut-fibre basket and hook occupy separate work areas.
    g.box(-.405,.254,-1.54,.411,.284,.56,"#8c9e90");
    g.box(-.405,.413,-1.54,.447,.045,.592,foam);
    g.box(-.405,.44,-1.76,.096,.017,.057,iron);
    bushel(g);
    // Three nested turns of braided painter. Its loose tail falls off the locker.
    for(const r of [.076,.102,.131]){
      const path=[];
      for(let j=0;j<=9;j++){const a=tau*j/9;path.push([-.411+r*Math.cos(a),.444,-1.48+r*.78*Math.sin(a)]);}
      tube(g,path,.009,cord,4);
    }
    tube(g,[[-.288,.444,-1.493],[-.218,.444,-1.435],[-.175,.413,-1.409],[-.17,.13,-1.378],[-.06,.117,-1.28]],.008,cord,4);
    // The pot hauler cantilevers over starboard. The game attaches the working line at the sheave.
    g.box(.74,.522,.776,.198,.055,.25,iron);
    tube(g,[[.726,.523,.762],[.747,1.12,.778],[.822,1.22,.79],[1.063,1.295,.79]],.035,zinc,7);
    tube(g,[[.772,.541,.874],[.769,.97,.843],[.828,1.196,.807]],.019,edge);
    tube(g,[[.739,.669,.736],[.967,1.232,.79]],.02,iron);
    turned(g,1.075,1.31,.79,[[-.033,.008,iron],[-.033,.079,iron],[-.021,.079,edge],[0,.059,zinc],[.022,.079,edge],[.035,.078,tin],[.035,.008,rust]],9);
    tube(g,[[1.075,1.269,.753],[1.075,1.177,.753],[1.075,1.151,.770],[1.075,1.169,.80]],.012,iron,5);
    g.box(.70,.644,.713,.143,.147,.168,sea);
    tube(g,[[.743,.58,.717],[.729,.402,.613],[.633,.126,.477],[.624,.117,-.40]],.016,lip,5);
  }
  function winchDrum(g){
    turned(g,0,0,0,[[-.089,.028,iron],[-.084,.104,tin],[-.052,.104,edge],[-.044,.071,rust],[.04,.071,cord],[.05,.105,iron],[.074,.105,zinc],[.074,.018,iron]],10);
    g.pole([.083,0,0],[.083,.074,.061],.012,edge,4);
    g.pole([.073,.074,.061],[.123,.074,.061],.014,rubber,5);
  }
  function crab(g){
    // An olive-blue carapace and paired pale-tipped claws, visible over the rim.
    const outline=[[-.096,0],[-.073,.047],[-.028,.064],[.066,.048],[.102,.009],[.062,-.046],[-.05,-.051]];
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      g.tri([a[0],0,a[1]],[b[0],0,b[1]],[.002,.033,.004],i%3===1?"#637d74":"#759591");
    }
    for(const s of sides){
      tube(g,[[s*.054,.005,.018],[s*.105,.014,.08],[s*.139,.024,.075]],.012,"#749e9d",4);
      g.tri([s*.112,.011,.081],[s*.142,.027,.1],[s*.14,.026,.072],salt);
      for(const z of [-.031,-.006])g.tri([s*.054,.008,z],[s*.121,0,z-.015],[s*.072,.002,z-.021],"#869c8f");
    }
  }
  function outboard(g){
    // The outboard is mounted around a real steering swivel, separate from the transom.
    const contours=[[-.765,.024,.059,-.20],[-.447,.05,.13,-.188],[-.113,.071,.101,-.143],[.142,.077,.085,-.087]];
    function stack(rings,palette){
      const shape=[[-.66,-1],[.66,-1],[1,-.65],[1,.64],[.69,1],[-.69,1],[-1,.64],[-1,-.65]];
      const ring=([y,w,d,z])=>shape.map(([i,k])=>[i*w,y,z+k*d]);
      let prior=ring(rings[0]);
      for(let i=1;i<rings.length;i++){
        const now=ring(rings[i]);
        for(let j=0;j<now.length;j++){const k=(j+1)%now.length;g.quad(prior[j],prior[k],now[k],now[j],palette[i-1],.87+.11*(j===2||j===3?1:0));}
        prior=now;
      }
      for(let j=1;j<prior.length-1;j++)g.tri(prior[0],prior[j],prior[j+1],palette[palette.length-1]);
    }
    stack(contours,[iron,zinc,"#657d77"]);
    g.box(0,-.387,-.189,.235,.025,.31,iron);
    g.pole([0,-.589,-.219],[0,-.589,-.376],.037,zinc,7);
    for(let j=0;j<3;j++){
      const a=tau*j/3,at=(r,b,z)=>[r*Math.cos(a+b),-.589+r*Math.sin(a+b),z];
      g.quad(at(.027,0,-.348),at(.112,.28,-.341),at(.115,.65,-.319),at(.032,.87,-.348),tin);
    }
    stack([[.017,.136,.147,-.12],[.14,.188,.207,-.17],[.208,.182,.211,-.17],[.246,.194,.22,-.17],[.381,.198,.22,-.173],[.454,.145,.161,-.161]],[sea,lip,red,"#526660",foam]);
    g.box(0,.458,-.169,.154,.009,.151,"#a6b6a4");
    for(const j of [0,1,2])g.quad([-.077,.302+j*.017,-.393],[.079,.302+j*.017,-.393],[.079,.310+j*.017,-.393],[-.077,.310+j*.017,-.393],lip);
    tube(g,[[-.092,.18,.01],[-.172,.217,.132],[-.235,.237,.32]],.02,iron,5);
    g.pole([-.223,.233,.288],[-.25,.242,.377],.029,rubber,6);
  }
  function trailerFrame(g){
    for(const s of sides){
      strut(g,[s*.772,.402,-1.94],[s*.772,.456,.67],.083,.107,tin);
      strut(g,[s*.772,.456,.67],[s*.048,.504,2.725],.084,.108,tin);
      for(const z of [-1.34,.64]){
        strut(g,[s*.537,.452,z],[s*.454,.539,z],.05,.056,zinc);
        g.box(s*.513,.511,z,.257,.03,.063,iron);
      }
      strut(g,[s*.474,.534,-1.658],[s*.467,.555,1.10],.123,.071,"#536361");
      strut(g,[s*.47,.572,-1.657],[s*.466,.592,1.1],.132,.022,"#535b51");
      // Leaf springs bridge the axle from two hangers under each main rail.
      for(const z of [-.44,.44])g.box(s*.738,.344,z,.071,.164,.065,zinc);
      for(const [y,d] of [[.286,.44],[.274,.325],[.262,.22]]){
        strut(g,[s*.742,y+.047,-d],[s*.742,y,0],.071,.013,iron);
        strut(g,[s*.742,y,0],[s*.742,y+.047,d],.071,.013,iron);
      }
      const xs=[s*.86,s*1.158],az=[[-.508,.332],[-.403,.534],[-.247,.676],[-.13,.711],[.178,.711],[.29,.664],[.419,.535],[.493,.336]];
      for(let i=1;i<az.length;i++){
        const [z0,h0]=az[i-1],[z1,h1]=az[i];
        g.quad([xs[0],h0,z0],[xs[1],h0,z0],[xs[1],h1,z1],[xs[0],h1,z1],i===4?edge:tin,.97+(i%2)*.04);
        g.quad([xs[1],h0,z0],[xs[1],h0-.045,z0],[xs[1],h1-.045,z1],[xs[1],h1,z1],zinc);
        g.quad([xs[0],h0,z0],[xs[0],h0-.025,z0],[xs[0],h1-.025,z1],[xs[0],h1,z1],iron);
      }
      for(const z of [-.386,.38])strut(g,[s*.74,.462,z],[s*1.08,.473,z],.052,.041,zinc);
      for(const z of [-.105,-.052,0,.052,.105])g.box(s*1.002,.715,z,.15,.012,.015,zinc);
      g.box(s*.768,.425,-1.94,.235,.122,.08,lip);
      g.box(s*.768,.43,-1.982,.178,.08,.012,"#944d41");
      g.box(s*.926,.477,-1.845,.046,.09,.115,gold);
      g.box(s*.773,.461,.853,.099,.047,.135,gold);
      g.box(s*.778,.46,-1.44,.092,.026,.165,rust);
      // The guide-on has a removable pale PVC jacket. The red cap remains visible beside the loaded boat.
      strut(g,[s*.724,.407,-1.386],[s*.933,.415,-1.386],.048,.049,zinc);
      g.pole([s*.927,.422,-1.386],[s*.947,.945,-1.386],.025,tin,6);
      g.pole([s*.939,.685,-1.386],[s*.957,1.142,-1.386],.039,salt,7);
      g.pole([s*.955,1.059,-1.386],[s*.959,1.145,-1.386],.042,red,7);
    }
    for(const z of [-1.874,-1.31,.644]){
      strut(g,[-.784,.41,z],[-.283,.334,z],.079,.079,zinc);
      strut(g,[-.283,.334,z],[.283,.334,z],.079,.079,zinc);
      strut(g,[.283,.334,z],[.784,.41,z],.079,.079,zinc);
    }
    g.pole([-1.032,.311,0],[1.032,.311,0],.056,iron,9);
    strut(g,[0,.499,2.494],[0,.53,3.727],.122,.102,tin);
    for(const z of [1.08,2.18]){
      strut(g,[-.243,.422,z],[.243,.422,z],.071,.063,zinc);
      turned(g,0,.474,z,[[-.138,.023,iron],[-.126,.075,rubber],[-.087,.082,rubber],[0,.046,rubber],[.087,.082,rubber],[.128,.075,rubber],[.138,.023,iron]],8);
    }
    // Strap winder with crank, rubber V-stop and the short webbing tail.
    strut(g,[0,.558,2.84],[0,1.025,2.64],.075,.073,zinc);
    strut(g,[0,.537,2.475],[0,.89,2.683],.053,.056,tin);
    for(const s of sides){
      g.quad([s*.057,.916,2.65],[s*.057,1.015,2.538],[s*.057,1.101,2.614],[s*.057,1.052,2.728],tin);
      strut(g,[s*.02,1.03,2.641],[s*.113,1.139,2.641],.059,.056,rubber);
    }
    turned(g,0,.982,2.67,[[-.095,.022,iron],[-.083,.071,tin],[-.066,.069,iron],[.066,.062,cord],[.079,.073,zinc],[.091,.073,tin],[.091,.017,iron]],9);
    tube(g,[[.092,.982,2.67],[.14,.982,2.67],[.14,.914,2.726],[.203,.914,2.726]],.014,iron,5);
    strut(g,[0,1.015,2.65],[0,1.13,2.518],.037,.008,cord);
    // Coupler shell fitted over the tongue. The small lift handle latches above the ball socket.
    g.box(0,.556,3.695,.153,.095,.20,zinc);
    const ring=[[0,3.923],[.063,3.9],[.093,3.846],[.075,3.722],[-.075,3.722],[-.092,3.846],[-.062,3.9]];
    for(let j=0;j<ring.length;j++){
      const [a,b]=ring[j],[d,e]=ring[(j+1)%ring.length];
      g.quad([a,.504,b],[d,.504,e],[d,.56,e],[a,.56,b],tin);
      g.tri([a,.56,b],[d,.56,e],[0,.608,3.839],edge);
    }
    strut(g,[0,.595,3.826],[0,.649,3.718],.046,.024,iron);
    g.box(0,.651,3.696,.072,.024,.074,tin);
    for(const s of sides)tube(g,[[s*.055,.51,3.484],[s*.136,.36,3.52],[s*.182,.315,3.64],[s*.166,.375,3.728],[s*.091,.492,3.773]],.012,iron,5);
    tube(g,[[-.054,.52,3.39],[-.145,.44,3.47],[-.158,.428,3.65],[-.106,.49,3.81]],.012,lip,5);
    g.box(-.105,.487,3.818,.041,.036,.077,rubber);
    g.box(-.113,.52,2.934,.088,.112,.148,iron);
    g.box(.561,.369,-1.923,.226,.113,.023,"#ddc891");
    g.box(.561,.378,-1.938,.128,.03,.01,"#527571");
  }
  function wheel(g){
    turned(g,0,0,0,[[-.102,0,iron],[-.102,.152,iron],[-.095,.276,rubber],[-.068,.308,"#494d49"],[.064,.31,rubber],[.098,.278,"#4c504b"],[.102,.149,rubber]],14);
    turned(g,0,0,0,[[.102,.151,iron],[.108,.142,edge],[.111,.123,tin],[.127,.076,zinc],[.14,.051,edge],[.14,0,tin]],10);
    for(let j=0;j<5;j++){
      const a=tau*j/5,y=.086*Math.sin(a),z=.086*Math.cos(a);
      g.quad([.126,y-.013,z-.014],[.137,y-.013,z+.014],[.138,y+.013,z+.014],[.127,y+.013,z-.014],iron);
    }
    // Only the outboard face is exposed. The entire wheel is turned over on the port side.
    g.quad([.104,.244,-.024],[.104,.257,-.018],[.104,.256,.022],[.104,.244,.031],"#939389");
  }
  function jack(g){
    g.pole([0,.036,0],[0,-.273,0],.035,zinc,7);
    g.pole([0,-.27,0],[0,-.392,0],.025,edge,6);
    tube(g,[[0,.026,0],[0,.103,0],[.071,.103,0],[.08,.163,0]],.012,iron,5);
    for(const s of sides)strut(g,[s*.01,-.369,0],[s*.041,-.423,-.037],.02,.021,zinc);
    turned(g,0,-.432,-.031,[[-.04,.001,tin],[-.04,.069,rubber],[-.022,.081,rubber],[.023,.081,rubber],[.041,.069,rubber],[.041,.001,tin]],8);
  }
  function lamp(g,amber){
    g.box(0,0,0,amber?.045:.177,amber?.074:.079,amber?.078:.014,amber?"#f5b15b":"#f77558");
  }
  function distantHull(g){
    const rings=[[-2.32,.65,.50],[-1.1,.86,.49],[.72,.84,.52],[1.73,.53,.61],[2.35,.035,.66]];
    for(const side of sides)for(let i=1;i<rings.length;i++){
      const [z,w,h]=rings[i-1],[u,b,y]=rings[i],a=side*w,c=side*b;
      g.quad([a*.58,-.20,z],[c*.58,-.19,u],[c,y-.14,u],[a,h-.14,z],salt);
      g.quad([a,h-.14,z],[c,y-.14,u],[c,y-.055,u],[a,h-.055,z],red);
      g.quad([a,h-.055,z],[c,y-.055,u],[c,y,u],[a,h,z],foam);
      g.quad([a,h,z],[c,y,u],[0,.12,u],[0,.12,z],mint);
    }
    g.box(0,.31,-2.31,1.29,.40,.04,salt);g.box(0,.42,-2.49,.34,.64,.34,lip);
    g.box(0,.41,-.54,1.32,.095,.34,teak);g.box(.67,.89,.79,.07,.78,.095,tin);g.box(.86,1.28,.79,.43,.08,.09,tin);
  }
  function install(model){
    model("pip-skiff-distant",distantHull);
    model("pip-trailer-distant",g=>{
      for(const side of sides){
        g.box(side*.67,.42,.10,.11,.14,4.03,tin);g.box(side*1.01,.30,0,.19,.50,.58,rubber);
        g.box(side*.89,.56,0,.28,.10,1.23,tin);
      }
      g.box(0,.43,-1.91,1.92,.14,.12,iron);g.box(0,.52,2.83,.18,.13,2.08,tin);
    });
    model("pip-shell",g=>{hullSkin(g);workingDeck(g);});
    model("pip-outboard",outboard);model("pip-hauler",winchDrum);model("pip-catch",crab);
    model("pip-carriage",trailerFrame);model("pip-road-wheel",wheel);model("pip-jack",jack);
    model("pip-stop",g=>lamp(g,false));model("pip-turn",g=>lamp(g,true));
  }
  function pose(v){
    const yaw=v.yaw||0,p=v.pitch||0,l=v.lean||0;
    return {v,yaw,p,l,cy:Math.cos(yaw),sy:Math.sin(yaw),cp:Math.cos(p),sp:Math.sin(p),cl:Math.cos(l),sl:Math.sin(l)};
  }
  function place(list,key,f,x,y,z,turn=0,spin=0,glow=0){
    const h=y*f.cp-z*f.sp,n=y*f.sp+z*f.cp,u=x*f.cl-h*f.sl;
    let yaw=f.yaw,p=f.p,l=f.l;
    if(turn){
      // Compose steering about the local vertical even on the sloping launch ramp.
      const c=Math.cos(turn),s=Math.sin(turn),a=c*f.cl-s*f.sl*f.sp,b=-s*f.cp;
      yaw+=Math.atan2(-b,a);l=Math.asin(clamp(c*f.sl+s*f.cl*f.sp,-1,1));
      p=Math.atan2(c*f.cl*f.sp-s*f.sl,f.cl*f.cp);
    }
    list.push([key,(f.v.x||0)+u*f.cy+n*f.sy,(f.v.y||0)+x*f.sl+h*f.cl,(f.v.z||0)+n*f.cy-u*f.sy,yaw,p+spin,l,glow]);
  }
  const crabSpots=[[-.063,.353,.041,-.45],[.055,.374,-.055,1.26],[.045,.398,.065,.30]];
  function steer(v){return clamp(v.steer||0,-1,1)*.61;}
  function hull(list,v,t,far=false){
    if(far){list.push(["pip-skiff-distant",v.x,v.y,v.z,v.yaw,v.pitch,v.lean]);return;}
    const f=pose(v),m=layout.motor,b=layout.bushel;
    place(list,"pip-shell",f,0,0,0);
    place(list,"pip-outboard",f,m.x,m.y,m.z,steer(v));
    place(list,"pip-hauler",f,.789,.747,.718,0,clamp(v.haul||0,0,1)*tau*2.38);
    const count=clamp(Math.floor(v.catchCount||0),0,crabSpots.length);
    for(let i=0;i<count;i++){
      const [x,y,z,a]=crabSpots[i];place(list,"pip-catch",f,b.x+x,y,b.z+z,a);
    }
  }
  function indicator(tr,t){return tr.signal&&Math.floor((t||0)*2.8)%2===0?tr.signal:0;}
  function trailer(list,tr,t,view,far=false){
    if(far){list.push(["pip-trailer-distant",tr.x,tr.y,tr.z,tr.yaw,tr.pitch,tr.lean]);return;}
    const f=pose(tr),blink=indicator(tr,t);
    place(list,"pip-carriage",f,0,0,0);
    for(const s of sides){
      place(list,"pip-road-wheel",f,s*1.01,.31,0,s<0?Math.PI:0,s*(tr.wheelSpin||0));
      if(tr.brake)place(list,"pip-stop",f,s*.768,.431,-1.993,0,0,.58);
      if(blink===s||blink===2)place(list,"pip-turn",f,s*.947,.477,-1.847,0,0,.58);
    }
    place(list,"pip-jack",f,-.164,.517,2.927,0,tr.hitched?-1.45:0);
  }
  function poly(c,color,pts){
    c.fillStyle=color;c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
    c.closePath();c.fill();
  }
  function line(c,color,width,pts){
    c.strokeStyle=color;c.lineWidth=width;c.lineJoin="round";c.lineCap="round";
    c.beginPath();c.moveTo(pts[0][0],pts[0][1]);
    for(let i=1;i<pts.length;i++)c.lineTo(pts[i][0],pts[i][1]);
    c.stroke();
  }
  function oval(c,color,x,z,rx,rz,a=0){
    c.fillStyle=color;c.beginPath();c.ellipse(x,z,rx,rz,a,0,tau);c.fill();
  }
  function rect(c,color,x,z,w,d){c.fillStyle=color;c.fillRect(x,z,w,d);}
  function textAt(c,word,x,z,size,paint){
    c.save();c.translate(x,z);c.scale(1,-1);c.font="bold "+size+"px monospace";c.textAlign="center";
    c.textBaseline="middle";c.fillStyle=paint;c.fillText(word,0,0);c.restore();
  }
  const pages=new Map();
  function sprite(c,key,bounds,draw){
    let page=pages.get(key);
    const [x,z,w,d]=bounds;
    if(!page){
      const density=76;page=document.createElement("canvas");
      page.width=Math.ceil(w*density);page.height=Math.ceil(d*density);
      const layer=page.getContext("2d");
      layer.setTransform(page.width/w,0,0,-page.height/d,-x*page.width/w,(z+d)*page.height/d);
      draw(layer);pages.set(key,page);
    }
    c.save();c.scale(1,-1);c.drawImage(page,x,-z-d,w,d);c.restore();
  }
  const hullSheet=[-1.16,-2.41,2.34,4.86],trailerSheet=[-1.20,-2.03,2.40,6.02];
  function outline(f,trim=0){
    return stations.map(st=>[-st[1]*f,st[0]*(1-trim)]).concat(stations.slice().reverse().map(st=>[st[1]*f,st[0]*(1-trim)]));
  }
  const shape=outline(1),wetShape=outline(.977,.005),stripeShape=outline(.951,.012),inside=outline(.846,.032);
  function cover(c,x,z,w,d){
    rect(c,sea,x-w/2,z-d/2-.026,w,d);
    rect(c,lip,x-w/2,z-d/2,w,d);
    for(let i=-1;i<=1;i++){
      rect(c,i===0?"#bb895c":teak,x-w/2+.004,z+i*.116-.049,w-.008,.1);
      line(c,grain,.007,[[x-w*.41,z+i*.116],[x+w*.31,z+i*.116+.009]]);
    }
    for(const s of sides)line(c,"#8c765e",.021,[[x+s*w*.41,z-.121],[x+s*w*.41,z+.121]]);
  }
  function paintMapHull(c){
    poly(c,lip,shape);poly(c,red,wetShape);poly(c,salt,stripeShape);poly(c,sea,inside);
    const floor=[[-.52,-2.19],[-.667,-1.68],[-.69,-.5],[-.677,.65],[-.55,1.26],[.55,1.26],[.677,.65],[.69,-.5],[.667,-1.68],[.52,-2.19]];
    poly(c,deck,floor);
    for(const x of [-.54,-.42,-.3,-.18,.03,.15,.27,.39,.51])line(c,"#8ba290",.014,[[x,-1.9],[x,1.15]]);
    for(const z of [-1.10,-.05,.98])for(const s of sides)line(c,foam,.03,[[s*.627,z],[s*.772,z+.012]]);
    for(const s of sides){
      poly(c,foam,[[s*.389,-2.20],[s*.61,-2.20],[s*.63,-1.948]]);
      for(const [z,w] of [[-1.744,.06],[-.68,.10],[.07,.054]])line(c,salt,.015,[[s*.844,z],[s*.843,z+w]]);
    }
    poly(c,foam,[[-.666,1.244],[-.493,1.739],[-.267,2.085],[0,2.33],[.267,2.085],[.493,1.739],[.666,1.244]]);
    line(c,sea,.038,[[-.651,1.248],[.651,1.248]]);
    rect(c,sea,-.267,1.456,.534,.42);rect(c,"#b4c6ac",-.246,1.477,.492,.38);
    for(const x of [-.178,.151])rect(c,tin,x,1.805,.046,.043);
    textAt(c,"16",0,1.687,.144,sea);rect(c,iron,-.058,1.526,.116,.038);
    for(const [x,z] of [[0,2.014],[-.632,-1.996],[.632,-1.996]])line(c,iron,.034,[[x-.07,z-.037],[x+.07,z+.037]]);
    rect(c,iron,-.264,-2.34,.528,.112);
    cover(c,-.37,-.47,.515,.38);cover(c,.36,.48,.49,.38);
    rect(c,sea,-.611,-.142,.421,.318);rect(c,teak,-.612,-.095,.421,.299);
    rect(c,iron,-.599,-.125,.394,.10);
    oval(c,lip,-.401,-.140,.132,.074);oval(c,"#a09f87",-.401,-.14,.108,.048);
    for(const [x,z] of [[-.51,-.14],[-.3,-.137],[-.398,-.199]])line(c,iron,.012,[[-.401,-.142],[x,z]]);
    oval(c,iron,-.401,-.142,.027,.02);line(c,edge,.015,[[-.599,.071],[-.199,.071]]);
    rect(c,iron,-.248,.082,.029,.101);rect(c,red,-.253,.143,.038,.037);
    rect(c,sea,-.639,-1.86,.47,.618);rect(c,foam,-.621,-1.84,.437,.59);
    rect(c,iron,-.456,-1.79,.093,.04);
    for(const r of [.074,.103,.132]){
      c.strokeStyle=cord;c.lineWidth=.014;c.beginPath();c.ellipse(-.412,-1.48,r,r*.79,-.11,0,tau);c.stroke();
    }
    line(c,cord,.014,[[-.288,-1.491],[-.209,-1.423],[-.186,-1.354],[-.069,-1.274]]);
    const {x,z}=layout.bushel;
    oval(c,rust,x,z,.277,.27);oval(c,grain,x,z,.26,.252);oval(c,"#775f48",x,z,.224,.218);
    for(let i=0;i<12;i++){
      const a=tau*i/12,cs=Math.cos(a),sn=Math.sin(a);
      line(c,basket,.021,[[x+cs*.213,z+sn*.212],[x+cs*.257,z+sn*.245]]);
    }
    for(const s of sides)line(c,iron,.016,[[x+s*.228,z-.083],[x+s*.276,z-.055],[x+s*.276,z+.07],[x+s*.226,z+.088]]);
    for(const s of sides){
      rect(c,lip,s*.697-.044,1.153,.088,.126);rect(c,s<0?red:"#65997a",s*.697-.029,1.167,.058,.10);
    }
    line(c,lip,.035,[[.602,-.403],[.607,.475],[.692,.626]]);
    rect(c,iron,.65,.654,.184,.261);rect(c,sea,.669,.673,.159,.178);
    line(c,iron,.054,[[.731,.728],[.765,.799],[1.063,.838]]);
    line(c,edge,.024,[[.741,.755],[.773,.818],[1.067,.854]]);
    rect(c,iron,1.031,.783,.08,.121);rect(c,zinc,1.048,.793,.047,.112);
    line(c,iron,.013,[[1.071,.805],[1.096,.768],[1.079,.75]]);
  }
  function drawMapMotor(c,angle){
    c.save();c.translate(layout.motor.x,layout.motor.z);c.rotate(angle);
    poly(c,iron,[[-.049,-.489],[.044,-.489],[.069,-.281],[.052,-.08],[-.057,-.08]]);
    poly(c,lip,[[-.207,-.303],[-.151,-.392],[.158,-.392],[.204,-.296],[.183,-.015],[.126,.058],[-.129,.058],[-.185,-.037]]);
    poly(c,red,[[-.189,-.292],[-.141,-.368],[.149,-.368],[.19,-.286],[.164,-.051],[-.169,-.051]]);
    poly(c,sea,[[-.174,-.273],[-.124,-.335],[.128,-.335],[.166,-.257],[.151,-.033],[.11,.034],[-.106,.034],[-.159,-.024]]);
    poly(c,foam,[[-.131,-.238],[-.094,-.296],[.105,-.296],[.144,-.234],[.133,-.071],[.091,-.019],[-.099,-.019],[-.138,-.07]]);
    line(c,lip,.029,[[-.077,-.317],[.069,-.317]]);
    line(c,iron,.032,[[-.09,.012],[-.17,.135],[-.239,.35]]);line(c,rubber,.05,[[-.222,.283],[-.244,.364]]);c.restore();
  }
  function mapHull(c,v,x,y,scale,t){
    if(!(scale>0))return;
    c.save();c.translate(x,y);c.rotate(v.yaw||0);c.scale(scale,-scale);
    if(scale<3.5){
      poly(c,foam,shape);line(c,red,.20,[[-.68,-1.86],[-.80,-.1],[-.67,1.12]]);
      rect(c,teak,-.6,-.68,.49,.42);rect(c,iron,-.179,-2.64,.36,.38);c.restore();return;
    }
    drawMapMotor(c,-steer(v));
    sprite(c,"hull",hullSheet,paintMapHull);
    const phase=clamp(v.haul||0,0,1)*tau*2.38;
    line(c,cord,.054,[[.752,.72],[.829,.72]]);
    line(c,iron,.018,[[.83,.719],[.855,.718+.078*Math.sin(phase+.68)],[.91,.718+.078*Math.sin(phase+.68)]]);
    const count=clamp(v.catchCount||0,0,crabSpots.length),b=layout.bushel;
    for(let i=0;i<Math.floor(count);i++){
      const [u,,n,a]=crabSpots[i];c.save();c.translate(b.x+u,b.z+n);c.rotate(-a);
      oval(c,"#799b93",0,0,.09,.048);line(c,"#b4cbc0",.018,[[-.125,.071],[-.109,.081],[-.06,.018],[.058,.017],[.111,.078],[.139,.064]]);c.restore();
    }
    c.restore();
  }
  function paintTrailer(c){
    const beam=(a,b,w)=>{line(c,zinc,w,[a,b]);line(c,tin,w*.56,[a,b]);};
    for(const s of sides){
      beam([s*.771,-1.94],[s*.772,.67],.101);beam([s*.772,.67],[s*.046,2.726],.101);
      rect(c,rubber,s*1.01-.107,-.317,.215,.634);
    }
    beam([-1.024,0],[1.024,0],.102);
    for(const z of [-1.876,-1.31,.644])beam([-.799,z],[.799,z],.074);
    for(const z of [1.08,2.18]){
      beam([-.243,z],[.243,z],.063);rect(c,rubber,-.126,z-.063,.252,.131);rect(c,zinc,-.024,z-.061,.048,.122);
    }
    for(const s of sides){
      for(const z of [-1.34,.64])beam([s*.69,z],[s*.40,z],.061);
      line(c,iron,.153,[[s*.47,-1.656],[s*.466,1.10]]);line(c,"#61706a",.10,[[s*.47,-1.648],[s*.466,1.092]]);
      for(const z of [-.38,.38])beam([s*.742,z],[s*1.089,z],.047);
      const inner=s*.868,outer=s*1.163;
      poly(c,zinc,[[inner,-.506],[outer-s*.024,-.506],[outer,-.418],[outer,.42],[outer-s*.031,.494],[inner,.494]]);
      rect(c,edge,Math.min(inner,outer)+.024,-.239,.232,.485);
      for(const z of [-.398,-.335,.312,.38])line(c,tin,.024,[[inner,z],[outer-s*.009,z]]);
      for(const z of [-.107,-.054,0,.054,.107])line(c,zinc,.018,[[s*.928,z],[s*1.084,z]]);
      rect(c,lip,s*.768-.117,-1.98,.234,.104);rect(c,"#a9503d",s*.768-.09,-1.982,.18,.04);
      rect(c,gold,s*.905-.028,-1.888,.058,.093);rect(c,gold,s*.711-.043,.79,.086,.047);
      beam([s*.724,-1.386],[s*.947,-1.386],.044);oval(c,salt,s*.947,-1.386,.046,.043);
      oval(c,red,s*.949,-1.381,.032,.031);
    }
    beam([0,2.49],[0,3.763],.132);
    for(const s of sides)line(c,iron,.016,[[s*.052,3.49],[s*.14,3.513],[s*.183,3.641],[s*.085,3.78]]);
    line(c,rubber,.019,[[-.061,3.42],[-.147,3.47],[-.159,3.645],[-.102,3.8]]);
    beam([0,2.83],[0,2.65],.09);line(c,iron,.062,[[-.112,2.641],[0,2.692],[.11,2.641]]);
    rect(c,iron,-.096,2.614,.192,.096);rect(c,cord,-.047,2.62,.094,.097);
    line(c,iron,.025,[[.089,2.67],[.14,2.67],[.14,2.732],[.208,2.732]]);
    line(c,cord,.033,[[0,2.644],[0,2.513]]);
    poly(c,tin,[[-.074,3.69],[-.094,3.842],[-.063,3.904],[0,3.924],[.063,3.903],[.092,3.841],[.074,3.69]]);
    rect(c,edge,-.034,3.701,.068,.15);rect(c,iron,-.022,3.717,.044,.115);
    rect(c,iron,-.188,2.845,.135,.151);rect(c,"#dfcb8d",.446,-1.943,.222,.06);
  }
  function mapTrailer(c,tr,x,y,scale,t){
    if(!(scale>0))return;
    c.save();c.translate(x,y);c.rotate(tr.yaw||0);c.scale(scale,-scale);
    const submerge=clamp(tr.immersion??-(tr.y||0),0,1);
    c.globalAlpha*=1-submerge*.60;
    if(scale<3.5){
      line(c,tin,.20,[[-.79,-1.91],[-.79,.65],[0,2.73],[0,3.88]]);
      line(c,tin,.20,[[.79,-1.91],[.79,.65],[0,2.73]]);line(c,iron,.24,[[-1.01,0],[1.01,0]]);c.restore();return;
    }
    sprite(c,"trailer",trailerSheet,paintTrailer);
    const stowed=tr.hitched?1:0,z=2.926+stowed*.384,blink=indicator(tr,t);
    line(c,tin,.045,[[-.169,2.927],[-.172,z]]);rect(c,rubber,-.204,z-.055,.071,.11);oval(c,edge,-.164,2.924,.027,.027);
    for(const s of sides){
      const x=s*1.105;
      // A narrow strip of moving tread remains visible beyond the stamped mudguard.
      const tread=Math.sin(tr.wheelSpin||0);
      line(c,"#606761",.018,[[x,-.281+.046*tread],[x+s*.031,-.265+.046*tread]]);
      if(tr.brake)rect(c,"#ff8964",s*.767-.088,-1.996,.176,.059);
      if(blink===s||blink===2)rect(c,"#ffd087",s*.918-.032,-1.887,.064,.099);
    }
    c.restore();
  }
  window.BayButtonwoodRig=Object.freeze({install,trailer,hull,mapTrailer,mapHull,layout});
})();
