/* The Marlin's brass birdcage trolley, claim checks and overnight cases. */
(() => {
  "use strict";
  const tau=2*Math.PI, brass="#ad905c", gold="#ccb17b", bronze="#776046", cream="#f6dfb4", ink="#354a46";
  const jade="#426c5d", carpet="#416257", welt="#827350", gum="#453f3b", paper="#dcbf8c";
  const styles={
    reef:{body:"#78ad9e",dark:"#49796d",trim:cream,ticket:"#acc7aa",slot:[-.32,.153,-.04]},
    reel:{body:"#755141",dark:"#4f3d35",trim:"#b34f43",ticket:"#e8b099",slot:[.27,.150,.045]},
    band:{body:"#353d66",dark:"#293351",trim:"#8994b1",ticket:"#afbad5",slot:[-.01,-.159,-.05]}
  };
  const valid=style=>Object.hasOwn(styles,style);
  const key=style=>"marlin-case-"+style;
  const deck=.245, gripHeight=.266;
  function local(site,x,y,z,turn=0){
    const yaw=site.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
    return {x:site.x+x*c+z*s,y:(site.y??0)+y,z:site.z-x*s+z*c,yaw:yaw+turn};
  }
  function emit(list,id,at){
    list.push([id,at.x,at.y??0,at.z,at.yaw||0,at.pitch||0,at.lean||0]);
  }
  function pipe(g,path,r,col,sides=5){
    for(let i=1;i<path.length;i++)g.pole(path[i-1],path[i],r,col,sides);
  }
  // Clipped deck and lid corners catch the light without using a bevel texture.
  function ring(w,d,y,cut){
    const x=w/2,z=d/2;
    return [[-x+cut,y,-z],[x-cut,y,-z],[x,y,-z+cut],[x,y,z-cut],
      [x-cut,y,z],[-x+cut,y,z],[-x,y,z-cut],[-x,y,-z+cut]];
  }
  function layer(g,lo,hi,top,side=top){
    const center=[0,hi[0][1],0];
    for(let i=0;i<hi.length;i++){
      const j=(i+1)%hi.length;
      g.quad(lo[i],lo[j],hi[j],hi[i],side,.79+.17*(1+Math.cos(i*.79))*.5);
      g.tri(center,hi[i],hi[j],top);
    }
  }
  // Mark paths are reused on each owner's ticket and the corresponding receiving stand.
  const emblems={
    reef:[
      [[-.79,-.29],[-.62,.34],[-.37,.60],[-.10,.52],[.12,.72],[.37,.50],[.56,.54],[.83,.11],[.72,-.29],[.17,-.68],[-.19,-.68],[-.79,-.29]],
      [[-.13,-.50],[-.49,.22]],[[.01,-.50],[.10,.43]],[[.11,-.50],[.50,.23]]
    ],
    reel:[
      [[-.68,.12],[-.63,.45],[-.36,.60],[-.10,.47],[-.03,.19],[-.16,-.11],[-.47,-.15],[-.68,.12]],
      [[.00,.10],[.07,.43],[.36,.51],[.62,.30],[.59,-.04],[.39,-.19],[.13,-.12],[.00,.10]],
      [[-.57,-.25],[-.48,-.53],[.40,-.54],[.76,-.32]]
    ],
    band:[
      [[-.47,-.47],[-.28,-.53],[-.12,-.41],[-.12,.44],[.61,.60],[.61,-.16],[.40,-.29],[.24,-.17],[.38,-.03],[.61,.00]],
      [[-.10,.20],[.60,.35]]
    ]
  };
  function badge(g,style,x,y,z,size,col){
    for(const line of emblems[style])
      pipe(g,line.map(([u,v])=>[x+size*u,y+size*v,z]),size*.079,col,4);
  }
  function tag(g,style,x,y,z){
    const p=styles[style];
    g.box(x,y,z,.053,.065,.006,p.ticket);
    g.box(x,y-.023,z+.004,.039,.005,.003,p.dark);
    badge(g,style,x,y+.004,z+.005,.021,p.dark);
    g.box(x,y+.026,z+.005,.008,.006,.003,bronze);
  }
  function handle(g,base,color,foot=.064){
    pipe(g,[[-foot,base,0],[-foot,.245,0],[-.049,gripHeight,0],[.049,gripHeight,0],[foot,.245,0],[foot,base,0]],.009,color,6);
    g.pole([-.047,gripHeight,0],[.047,gripHeight,0],.012,color,7);
  }
  function reefCase(g){
    const p=styles.reef;
    layer(g,ring(.400,.207,0,.030),ring(.441,.241,.037,.036),p.body,p.dark);
    layer(g,ring(.441,.241,.037,.036),ring(.441,.241,.160,.035),p.body);
    layer(g,ring(.442,.243,.145,.035),ring(.442,.243,.156,.035),p.dark);
    layer(g,ring(.441,.241,.160,.035),ring(.409,.213,.203,.043),p.body);
    for(const x of [-.157,.157]){
      g.box(x,.147,.120,.037,.034,.008,brass);
      g.box(x,.155,.125,.024,.007,.004,cream);
    }
    badge(g,"reef",-.036,.087,.122,.056,cream);
    handle(g,.197,p.dark);tag(g,"reef",.098,.089,.123);
  }
  function reelCase(g){
    const p=styles.reel;
    layer(g,ring(.458,.210,0,.016),ring(.458,.210,.181,.016),p.body);
    layer(g,ring(.460,.212,.162,.017),ring(.460,.212,.170,.017),p.dark);
    for(const x of [-.202,.202]){
      g.box(x,.020,.100,.040,.035,.018,brass);
      g.box(x,.166,.100,.040,.029,.018,brass);
    }
    const beltX=-.080;
    g.box(beltX,.092,0,.040,.184,.215,p.trim);
    g.box(beltX,.105,.109,.044,.027,.006,brass);
    g.box(beltX,.106,.114,.029,.015,.005,p.trim);
    handle(g,.180,p.dark,.062);tag(g,"reel",.128,.103,.109);
    badge(g,"reel",.056,.085,.108,.030,p.ticket);
  }
  function bandCase(g){
    const p=styles.band;
    // Broad oval bottom, sloped canvas shoulders and two narrow webbing loops.
    const section=(x,wide,high)=>[[x,.014,wide*.70],[x,.036,wide],[x,high*.66,wide*.94],
      [x,high,wide*.38],[x,high,-wide*.38],[x,high*.66,-wide*.94],[x,.036,-wide],[x,.014,-wide*.70]];
    const sections=[section(-.234,.072,.113),section(-.203,.113,.166),section(-.130,.124,.190),
      section(.130,.124,.190),section(.203,.113,.166),section(.234,.072,.113)];
    for(let j=0;j<sections.length;j++){
      const a=sections[j];
      for(let i=0;i<a.length;i++){
        const k=(i+1)%a.length;
        if(j)g.quad(sections[j-1][i],a[i],a[k],sections[j-1][k],i===7?p.dark:p.body,.81+.13*(i%3)*.5);
        if(j===0||j===sections.length-1)g.tri([a[0][0],.061,0],a[i],a[k],p.dark);
      }
    }
    layer(g,ring(.397,.207,0,.045),ring(.425,.222,.019,.052),p.dark);
    for(const sign of [-1,1]){
      const z=sign*.121;
      pipe(g,[[-.100,.036,z],[-.099,.116,z],[-.066,.180,z*.45],[-.053,.250,z*.09],[-.042,gripHeight,0],
        [.042,gripHeight,0],[.053,.250,z*.09],[.066,.180,z*.45],[.10,.116,z],[.10,.036,z]],.008,p.trim,5);
    }
    g.pole([-.042,gripHeight,0],[.042,gripHeight,0],.012,p.dark,7);
    g.box(.013,.083,.120,.148,.071,.012,p.dark);
    g.box(.013,.108,.128,.134,.006,.005,p.trim);
    tag(g,"band",.155,.099,.120);
  }
  const builders={reef:reefCase,reel:reelCase,band:bandCase};
  function renderCase(list,model,style,at){
    if(!valid(style)||!at)return;
    model(key(style),builders[style]);emit(list,key(style),at);
  }
  function cart(g){
    const lower=ring(1.260,.70,.168,.072),rim=ring(1.292,.744,.212,.078);
    layer(g,lower,rim,brass,bronze);
    layer(g,rim,ring(1.292,.744,.226,.078),gold);
    layer(g,ring(1.265,.718,.226,.073),ring(1.249,.706,deck,.070),carpet,welt);
    for(const x of [-.535,.535])for(const z of [-.257,.257]){
      g.pole([x-.038,.076,z],[x+.038,.076,z],.075,gum,9);
      g.pole([x-.043,.076,z],[x+.043,.076,z],.029,brass,7);
      g.box(x,.136,z,.084,.053,.056,bronze);
    }
    // Matching pairs of tall arches spring from all four corners of the cart.
    for(const z of [-.295,.295]){
      const arch=[[-.561,deck,z],[-.561,.99,z],[-.531,1.173,z],[-.431,1.306,z],
        [-.228,1.397,z],[0,1.419,z],[.228,1.397,z],[.431,1.306,z],[.531,1.173,z],[.561,.99,z],[.561,deck,z]];
      pipe(g,arch,.022,brass,7);
      for(const x of [-.561,.561]){
        g.cyl(x,.269,z,.038,.043,.047,8,gold);
        g.cyl(x,.727,z,.026,.026,.181,7,bronze);
      }
    }
    pipe(g,[[0,1.419,-.295],[0,1.458,0],[0,1.419,.295]],.019,brass,6);
    g.cyl(0,1.478,0,.039,.035,.042,8,gold);
    g.cyl(0,1.513,0,.011,.038,.029,8,brass);
    // The bell captain's envelope hangs off the left end. Two punched checks peek over the lip.
    g.pole([-.562,.929,-.295],[-.562,.929,.295],.018,brass,6);
    g.box(-.566,.785,0,.031,.201,.262,bronze);
    g.box(-.567,.860,-.046,.030,.116,.080,paper);
    g.box(-.568,.857,.039,.030,.104,.076,cream);
    for(const z of [-.046,.039])g.box(-.584,.890,z,.005,.012,.014,ink);
    g.box(-.585,.777,0,.019,.123,.253,jade);
    g.tri([-.596,.834,-.122],[-.596,.834,.122],[-.596,.777,.008],carpet);
    g.box(-.597,.776,.009,.006,.014,.020,brass);
    // A punched brass room key fob marks the Marlin's cart without floating signage.
    g.box(0,1.267,-.299,.197,.081,.019,jade);
    pipe(g,[[-.065,1.247,-.312],[-.065,1.287,-.312],[-.032,1.258,-.312],[0,1.287,-.312],[0,1.247,-.312]],.005,gold,4);
    g.box(.040,1.267,-.312,.037,.006,.005,gold);
    for(const x of [-.077,.077])g.pole([x,1.305,-.296],[x,1.407,-.296],.005,bronze,4);
  }
  function rack(site,style){
    if(!valid(style))return null;
    const [x,z,turn]=styles[style].slot;return local(site,x,deck,z,turn);
  }
  function world(list,model,site,available=[]){
    model("marlin-bell-cart",cart);emit(list,"marlin-bell-cart",site);
    for(const style of available)renderCase(list,model,style,rack(site,style));
  }
  function stand(g,style){
    const p=styles[style];
    g.cyl(0,.034,0,.161,.186,.068,10,bronze);
    g.cyl(0,.088,0,.049,.117,.042,10,brass);
    g.cyl(0,.465,0,.022,.031,.739,8,brass);
    g.cyl(0,.803,0,.047,.032,.050,8,gold);
    g.box(0,.984,0,.294,.326,.031,jade);
    g.box(0,.987,.018,.257,.285,.012,p.ticket);
    // A clipped paper corner, punched hole and detachable perforated stub.
    g.tri([-.130,1.130,.026],[-.097,1.130,.026],[-.130,1.097,.026],jade);
    g.pole([-.088,1.085,.024],[-.088,1.085,.028],.012,jade,7);
    badge(g,style,.015,1.014,.029,.067,p.dark);
    for(let i=0;i<6;i++)g.box(-.102+i*.038,.919,.026,.017,.004,.003,p.dark);
    g.box(-.029,.886,.026,.125,.008,.003,p.dark);
    g.box(.075,.886,.026,.027,.015,.003,p.dark);
  }
  const stands=Object.fromEntries(Object.keys(styles).map(id=>[id,g=>stand(g,id)]));
  function receiver(list,model,site,style){
    if(!valid(style))return;
    const id="marlin-claim-"+style;model(id,stands[style]);emit(list,id,site);
  }
  function mapAt(c,px,py,s,at,draw){
    c.save();c.translate(px(at.x),py(at.z));c.rotate(at.yaw||0);c.scale(s,-s);draw();c.restore();
  }
  function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h);}
  function path(c,points,col,width){
    c.beginPath();c.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
    if(width){c.strokeStyle=col;c.lineWidth=width;c.stroke();}
    else{c.closePath();c.fillStyle=col;c.fill();}
  }
  function oval(c,x,y,rx,ry,col){
    c.beginPath();c.ellipse(x,y,rx,ry,0,0,tau);c.fillStyle=col;c.fill();
  }
  function caseSymbol(c,style){
    if(!valid(style))return;
    const p=styles[style];
    if(style==="band"){
      oval(c,0,0,.234,.121,p.dark);oval(c,0,.012,.211,.103,p.body);
      for(const x of [-.090,.090])rect(c,x-.009,-.093,.018,.196,p.trim);
    }else{
      const points=ring(style==="reef"?.440:.459,style==="reef"?.242:.211,0,style==="reef"?.035:.016);
      path(c,points.map(v=>[v[0],v[2]]),p.dark);
      path(c,points.map(v=>[v[0]*.95,v[2]*.88]),p.body);
      if(style==="reel")rect(c,-.102,-.107,.040,.214,p.trim);
      else for(const x of [-.157,.157])rect(c,x-.018,.074,.036,.035,brass);
    }
    rect(c,.095,.024,.050,.063,p.ticket);rect(c,-.06,-.012,.12,.022,p.dark);
  }
  function caseMap(c,px,py,s,style,at){
    if(at&&valid(style))mapAt(c,px,py,s,at,()=>caseSymbol(c,style));
  }
  function map(c,px,py,s,site,available=[]){
    mapAt(c,px,py,s,site,()=>{
      path(c,ring(1.292,.744,0,.078).map(v=>[v[0],v[2]]),brass);
      path(c,ring(1.249,.706,0,.073).map(v=>[v[0],v[2]]),carpet);
      rect(c,-.603,-.142,.043,.284,paper);
    });
    for(const style of available)caseMap(c,px,py,s,style,rack(site,style));
    mapAt(c,px,py,s,site,()=>{
      for(const z of [-.295,.295]){
        path(c,[[-.561,z],[.561,z]],brass,.025);
        for(const x of [-.561,.561])oval(c,x,z,.039,.039,gold);
      }
      path(c,[[0,-.295],[0,.295]],brass,.025);oval(c,0,0,.040,.040,gold);
    });
  }
  function receiverMap(c,px,py,s,site,style){
    if(!valid(style))return;
    mapAt(c,px,py,s,site,()=>{
      oval(c,0,0,.182,.182,bronze);oval(c,0,0,.116,.116,brass);
      rect(c,-.149,-.055,.298,.112,jade);rect(c,-.129,-.037,.258,.069,styles[style].ticket);
      for(const points of emblems[style])path(c,points.map(([x,y])=>[x*.047,y*.035]),styles[style].dark,.006);
    });
  }
  const palm=[.238,.978,.053],overlays=new WeakMap();
  // A loaded arm still follows the shoulder and part of the stride. The unladen arm is untouched.
  function pose(mesh,amount=0){
    if(!mesh?.sides?.[1])return false;
    const arm=mesh.sides[1],rev=mesh.lastRevision,old=overlays.get(mesh),same=old?.rev===rev;
    amount=Math.max(0,Math.min(1,amount));
    if(same&&amount===old.amount)return false;
    if(same){arm.arm.m.set(old.upper);arm.forearm.m.set(old.lower);}
    if(!amount){overlays.delete(mesh);if(same)mesh.skin();return same;}
    const state=same?old:{rev,upper:arm.arm.m.slice(),lower:arm.forearm.m.slice()};
    const shoulder=mesh.chest.map(arm.arm.pivot,[]),elbow=arm.arm.map(arm.forearm.pivot,[]),wrist=arm.forearm.map(arm.handPivot,[]);
    const mix=(a,b)=>a+(b-a)*amount;
    const lower=(y,length)=>shoulder[1]-length+.13*(y-shoulder[1]+length);
    const e=[mix(elbow[0],shoulder[0]+.089),mix(elbow[1],lower(elbow[1],.208)),mix(elbow[2],shoulder[2]-.022+.19*(elbow[2]-shoulder[2]))];
    const w=[mix(wrist[0],shoulder[0]+.151),mix(wrist[1],lower(wrist[1],.374)),mix(wrist[2],shoulder[2]+.035+.19*(wrist[2]-shoulder[2]))];
    arm.arm.aim(shoulder,e);arm.forearm.aim(e,w);mesh.skin();
    state.amount=amount;overlays.set(mesh,state);return true;
  }
  function hand(actor,feet,mesh){
    const m=actor.motion,phase=(m?.phase||0)*tau,weight=m?.weight||0;
    const grip=mesh?.sides?.[1]?.forearm.map(palm,[])||[.358,.995-.065*weight+.015*weight*Math.sin(2*phase),.043+.063*weight*Math.cos(phase)];
    return local({x:actor.x,y:feet??((actor.y||0)+(m?.lift||0)),z:actor.z,yaw:actor.yaw},grip[0],grip[1]-gripHeight,grip[2],-Math.PI/2);
  }
  function carry(list,model,actor,style,feet,mesh){
    renderCase(list,model,style,hand(actor,feet,mesh));
  }
  function carryMap(c,px,py,s,actor,style){caseMap(c,px,py,s,style,hand(actor));}
  window.BayLeftLuggageArt=Object.freeze({world,map,rack,case:renderCase,caseMap,caseSymbol,hand,carry,carryMap,pose,receiver,receiverMap});
})();
