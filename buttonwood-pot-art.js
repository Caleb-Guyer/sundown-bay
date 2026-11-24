/* Alda's painted corks, blue-crab pots and the two people who work the Buttonwood rig. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,sides=[-1,1],name=id=>"buttonwood-pot/"+id;
  const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v));
  const mix=(a,b,u)=>a+(b-a)*u;
  const smooth=u=>{const v=clamp(u);return v*v*(3-2*v);};
  const colors={
    alda:["#aa7153","#376b68","#b78a46"],
    benji:["#77503e","#bd7758","#465667"]
  };
  const ink="#394d4c",wire="#597366",galvanized="#a1aea1",cream="#efe2bf",rope="#c8b784";
  const paint=[
    {id:"coral",top:"#e88361",dark:"#af5140",trim:"#f4d6a3"},
    {id:"jade",top:"#70b39c",dark:"#3d7166",trim:"#f4c886"},
    {id:"ochre",top:"#e5b552",dark:"#9a703b",trim:"#e9edcb"},
    {id:"blue",top:"#81a4c1",dark:"#50667b",trim:"#f5ce92"}
  ];
  const cap=(g,pts,col)=>{for(let i=1;i<pts.length-1;i++)g.tri(pts[0],pts[i],pts[i+1],col);};
  function path(g,pts,r,col,n=5){
    for(let i=1;i<pts.length;i++)g.pole(pts[i-1],pts[i],r,col,n);
  }
  function ring(g,pts,r,col,n=5){path(g,pts,r,col,n);g.pole(pts[pts.length-1],pts[0],r,col,n);}
  function hullRings(g,rings,col,n=12){
    const at=(row,i)=>[row[0]+row[3]*Math.cos(i*tau/n),row[1],row[2]+row[4]*Math.sin(i*tau/n)];
    for(let j=1;j<rings.length;j++)for(let i=0;i<n;i++){
      g.quad(at(rings[j-1],i),at(rings[j-1],i+1),at(rings[j],i+1),at(rings[j],i),col,.91+.07*Math.sin(i*tau/n+.4));
    }
    cap(g,Array.from({length:n},(_,i)=>at(rings[rings.length-1],i)),col);
  }
  function buoyModel(g,i,far){
    const c=paint[i],n=far?8:12;
    // A line of white cork separates the coloured shoulder and water-stained bottom.
    const profile=[[-.19,.095],[-.09,.205],[.11,.225],[.21,.226],[.30,.204],[.49,.146],[.55,.074]];
    for(let j=1;j<profile.length;j++){
      const [y0,r0]=profile[j-1],[y1,r1]=profile[j];
      const col=j<3?c.dark:j===3?cream:j===5?c.top:c.trim;
      g.cyl(0,(y0+y1)/2,0,r1,r0,y1-y0,n,col);
    }
    g.pole([0,.34,0],[.030,1.67,-.025],far?.019:.015,"#7b6d53",far?4:6);
    g.pole([.023,1.415,-.019],[.029,1.66,-.025],.017,c.trim,5);
    // The broad little burgee is cut differently for each string. It reads from a moving helm.
    const high=[.028,1.59,-.025],low=[.026,1.306,-.023],fold=[.20,1.46,.061];
    g.tri(high,low,fold,c.top);
    g.tri(high,fold,[.397,1.55,.09],c.trim);
    if(i===1||i===3){
      g.tri([.397,1.55,.09],fold,[.304,1.435,.078],c.top);
      g.tri(low,fold,[.40,1.32,.104],c.dark);
    }else{g.tri(low,fold,[.391,1.39,.091],c.dark);g.tri(fold,[.397,1.55,.09],[.391,1.39,.091],c.top);}
    if(far)return;
    for(const y of [.56,1.302,1.583])g.cyl(.013*y,y,-.015*y,.026,.025,.024,8,rope);
    for(let j=0;j<=i%3;j++)g.cyl(0,.331+j*.043,0,.198-j*.011,.200-j*.010,.014,12,c.dark);
    for(const az of [.41,1.92,3.57,5.12]){
      const x=Math.sin(az),z=Math.cos(az);
      path(g,[[x*.173,.400,z*.173],[x*.183,.377,z*.183],[x*.193,.349,z*.193]],.005,"#dfc49a",4);
    }
    g.pole([-.012,-.17,0],[-.053,-.294,.008],.018,rope,5);
  }
  function wakeRing(g){
    for(const [angle,rx,rz,len] of [[.2,.52,.37,1.53],[3.55,.63,.42,.98],[.85,.87,.63,.64]]){
      const pts=Array.from({length:7},(_,i)=>[Math.cos(angle+i*len/6)*rx,0,Math.sin(angle+i*len/6)*rz]);
      path(g,pts,.009,"#a2cabb",3);
    }
  }
  const cageX=.47,cageZ=.37,cageTop=.44;
  const corners=y=>[[-cageX,y,-cageZ],[cageX,y,-cageZ],[cageX,y,cageZ],[-cageX,y,cageZ]];
  function net(g,start,end,up,rows,cols,hole){
    // The broad reticule is actually open: both the crabs and the funnel can be seen through the sides.
    const pt=(u,v)=>start.map((p,i)=>p+(end[i]-p)*u+up[i]*v);
    for(let i=0;i<cols;i++)for(let j=0;j<rows;j++){
      const x=(i+.5)/cols,y=(j+.5)/rows;
      if(hole&&Math.abs(x-.5)<.22&&Math.abs(y-.58)<.27)continue;
      const a=pt(i/cols,(j+.5)/rows),b=pt((i+.50)/cols,(j+1)/rows),c=pt((i+1)/cols,(j+.5)/rows);
      // A single flat ribbon for the back of each V avoids overdraw from tubular chicken wire.
      const ab=b.map((p,k)=>p+up[k]*.014),aa=a.map((p,k)=>p+up[k]*.014),cc=c.map((p,k)=>p+up[k]*.014);
      g.quad(a,b,ab,aa,wire);g.quad(b,c,cc,ab,wire);
      if(j===0){
        const floor=pt((i+.5)/cols,0),bb=floor.map((p,k)=>p+up[k]*.016);
        g.quad(a,floor,bb,aa,wire);g.quad(floor,c,cc,bb,wire);
      }
    }
  }
  function trap(g){
    for(const y of [.023,.218,cageTop])ring(g,corners(y),y===cageTop?.013:.012,galvanized);
    for(const x of [-cageX,cageX])for(const z of [-cageZ,cageZ]){
      g.pole([x,.025,z],[x,cageTop,z],.014,galvanized,5);
      g.quad([x*.994,.035,z*.998],[x*.994,.111,z*.998],[x*.82,.034,z*.998],[x*.84,.034,z*.998],"#788e78");
    }
    for(const z of [-cageZ,cageZ])net(g,[-cageX,.029,z],[cageX,.029,z],[0,.409,0],4,11,false);
    for(const x of [-cageX,cageX]){
      net(g,[x,.029,-cageZ],[x,.029,cageZ],[0,.409,0],4,9,true);
      const side=Math.sign(x),eye=Array.from({length:10},(_,i)=>[x,.264+.114*Math.sin(i*tau/10),.157*Math.cos(i*tau/10)]);
      ring(g,eye,.011,wire);
      const inner=eye.map(p=>[side*.241,.237+(p[1]-.264)*.55,p[2]*.62]);
      ring(g,inner,.008,galvanized,4);
      for(let i=0;i<10;i+=2)g.pole(eye[i],inner[i],.007,wire,4);
    }
    net(g,[-cageX,.038,-cageZ],[cageX,.038,-cageZ],[0,0,.74],5,10,false);
    // A hinged centre door in the lid and a bait tube along the bottom right.
    for(const side of sides){
      net(g,[side*.185,.439,-cageZ],[side*cageX,.439,-cageZ],[0,0,.74],5,4,false);
      g.pole([side*.185,.441,-cageZ],[side*.185,.441,cageZ],.009,wire,5);
    }
    for(const x of [-.118,.118])g.pole([x-.022,.446,.325],[x+.022,.446,.325],.016,"#728a78",6);
    g.pole([.198,.108,-.235],[.212,.108,.124],.042,"#b6a48a",8);
    const junction=[-.014,.708,.018];
    for(const p of [[-cageX,cageTop,-cageZ],[cageX,cageTop,-cageZ],[0,cageTop,cageZ]])g.pole(p,junction,.009,rope,5);
    g.box(.22,.298,-.378,.147,.08,.014,"#be9060");
    g.box(.22,.30,-.388,.10,.012,.004,ink);
    for(const x of [-.345,.345])g.box(x,.021,0,.076,.038,.74,"#766951");
  }
  function trapLid(g){
    const lid=[[-.177,0,-.653],[.177,0,-.653],[.177,0,0],[-.177,0,0]];
    ring(g,lid,.009,galvanized,4);net(g,lid[0],lid[1],[0,0,.653],4,4,false);
    g.pole([-.053,.008,-.555],[.084,.008,-.56],.013,"#b48d52",6);
  }
  function lidPose(tr,l){
    const u=l?.phase==="empty"?clamp(l.empty??0):0;
    const lift=smooth(u/.20)*smooth((1-u)/.19)*1.18;
    return {...place(tr,[0,.444,.325]),yaw:tr.yaw,pitch:(tr.pitch||0)+lift,lean:tr.lean||0};
  }
  function crab(g){
    // Olive carapace, blue tips and swimming paddles of a live blue crab.
    const crest=[[-.121,.022,0],[-.066,.03,.061],[-.043,.032,.068],[-.025,.035,.059],[0,.035,.075],
      [.024,.035,.059],[.044,.033,.069],[.072,.031,.059],[.12,.021,.006],[.083,.023,-.012],[.060,.024,-.052],[-.058,.023,-.055],[-.083,.023,-.016]];
    for(let i=0;i<crest.length;i++)g.tri(crest[i],crest[(i+1)%crest.length],[-.006,.054,0],i%3?"#687852":"#82936c");
    for(const s of sides){
      for(let j=0;j<3;j++)path(g,[[s*.069,.018,-.038+j*.024],[s*(.119+j*.009),.021,-.057+j*.035],
        [s*(.140+j*.014),.003,-.094+j*.056]],.0058,"#569095",4);
      g.quad([s*.065,.013,-.044],[s*.098,.016,-.072],[s*.117,.013,-.109],[s*.099,.010,-.096],"#669b9b");
      path(g,[[s*.074,.023,.035],[s*.143,.036,.070],[s*.137,.051,.115]],.014,"#507f82",5);
      g.tri([s*.153,.049,.100],[s*.141,.054,.146],[s*.120,.048,.112],"#9e9878");
      g.tri([s*.127,.049,.104],[s*.104,.046,.138],[s*.114,.046,.100],"#ba9a70");
    }
  }
  // The canvas sorting slide hinges along the gunwale. Its low end rests over the aft bushel.
  const slidePivot=[.746,.554,-.349],slideAngle=f=>-.98*(1-smooth((f-.70)/.23));
  function slideSection(u){
    const s=Math.max(0,Math.sin(pi*u));
    return {x:mix(.706,.433,u)+.092*s,y:mix(.733,.462,u)-.030*s,z:mix(.785,-1.51,u),
      w:mix(.182,.102,u),rise:mix(.088,.053,u)};
  }
  function slideFrame(boat,progress){
    const tilt=slideAngle(progress);
    return {...place(boat,slidePivot),yaw:boat.yaw||0,pitch:(boat.pitch||0)*Math.cos(tilt),
      lean:(boat.lean||0)+tilt};
  }
  function slideEdge(u,k){
    const l=slideSection(u);
    return [l.x+k*l.w-slidePivot[0],l.y+(k?l.rise:0)-slidePivot[1],l.z-slidePivot[2]];
  }
  function sortingSlide(g){
    const n=6;
    for(let i=1;i<=n;i++)for(const d of sides){
      const a=(i-1)/n,b=i/n,one=slideEdge(a,d),two=slideEdge(b,d),last=slideEdge(a,0),next=slideEdge(b,0);
      g.quad(last,one,two,next,i%3===0?"#b4ad85":"#beb997",d>0?.94:1.04);
      g.pole(one,two,.0105,d>0?"#738474":"#899782",5);
    }
    for(const u of [0,.33,.67,1]){
      const a=slideEdge(u,-1),b=slideEdge(u,0),c=slideEdge(u,1);
      path(g,[a,b,c],.011,u===0||u===1?"#a58c64":"#999b7c",5);
    }
  }
  function category(p,i){
    if(Number.isInteger(p.color))return (p.color%paint.length+paint.length)%paint.length;
    const v=typeof p.color==="string"?p.color.toLowerCase():"",known=paint.findIndex(c=>[c.id,c.top.toLowerCase(),c.dark.toLowerCase()].includes(v));
    if(known>=0)return known;
    if(/^#[\da-f]{6}$/.test(v)){
      const rgb=h=>[1,3,5].map(j=>parseInt(h.slice(j,j+2),16)),wanted=rgb(v);
      let best=0,dist=Infinity;
      for(const [j,c] of paint.entries()){
        const d=rgb(c.top).reduce((sum,n,k)=>sum+(n-wanted[k])**2,0);if(d<dist){best=j;dist=d;}
      }
      return best;
    }
    return i%paint.length;
  }
  function rot(p,yaw=0,pitch=0,roll=0){
    const [x,y,z]=p,c=Math.cos(yaw),s=Math.sin(yaw),cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll);
    const h=y*cp-z*sp,f=y*sp+z*cp,u=x*cr-h*sr;
    return [u*c+f*s,x*sr+h*cr,-u*s+f*c];
  }
  function place(a,p){
    const q=rot(p,a.yaw||0,a.pitch||0,a.lean??a.roll??0);
    return {x:a.x+q[0],y:(a.y||0)+q[1],z:a.z+q[2]};
  }
  function floorAt(p){return Number.isFinite(p.bed)?-Math.abs(p.bed):(window.BaySwimming?.floor(p.x,p.z)??-5)+.024;}
  function match(p,line){return !!line&&(line.pot===p||p.id!=null&&(line.pot?.id??line.pot)===p.id);}
  function floatPose(p,i,t,line){
    const q=match(p,line)&&line.buoy?line.buoy:p,beat=t*1.46+i*1.37,lo=Math.sin(beat);
    return {x:q.x+(q===p ? .053*Math.sin(t*.73+i) : 0),y:q.y??(.080+.039*lo),z:q.z+(q===p ? .044*Math.cos(t*.83+i) : 0),
      yaw:i*1.97+.08*Math.sin(t*.61+i),pitch:.059*lo,lean:.083*Math.sin(t*1.02+i*.74)};
  }
  function trapPose(p,i,line){
    if(match(p,line)&&line.potPose)return {...line.potPose,yaw:line.potPose.yaw??line.yaw??line.v?.yaw??0,
      pitch:line.potPose.pitch??0,lean:line.potPose.lean??0};
    return {x:p.x,y:floorAt(p),z:p.z,yaw:.58+(p.index??i),pitch:0,lean:0};
  }
  function strand(a,b,sag,side,t){
    const dx=b.x-a.x,dz=b.z-a.z,h=Math.hypot(dx,dz),nx=h>1e-3?-dz/h:1,nz=h>1e-3?dx/h:0;
    return Array.from({length:7},(_,i)=>{
      const u=i/6,bow=4*u*(1-u),sweep=side*bow*(.81+.19*Math.cos(t+u*2.6));
      return {x:mix(a.x,b.x,u)+nx*sweep,y:mix(a.y,b.y,u)-sag*bow,z:mix(a.z,b.z,u)+nz*sweep};
    });
  }
  function strands(buoy,trap,line,t){
    const crown=place(trap,[-.014,.708,.018]),eye=place(buoy,[-.046,-.246,.008]);
    if(!line?.hook)return [strand(crown,eye,.07,.115*Math.sin(t*.53+trap.x),t)];
    const tension=clamp(line.tension??.4),slack=1-tension;
    return [strand(crown,line.hook,.031+.14*slack,.015+.06*slack,t),
      strand(line.hook,eye,.10+.25*slack,.04+.08*slack,t*.62)];
  }
  function aboveWater(points){
    const y=.048,ends=[];
    for(let i=0;i<points.length;i++){
      const a=points[i];
      if(i){
        const b=points[i-1];
        if((a.y<y)!==(b.y<y)){const u=(y-b.y)/(a.y-b.y);ends.push({x:mix(b.x,a.x,u),y,z:mix(b.z,a.z,u)});}
      }
      if(a.y>=y)ends.push(a);
    }
    if(ends.length<2)return null;
    // Retain the fixed GPU buffer while removing the portion hidden below the surface.
    return Array.from({length:7},(_,i)=>{
      const u=i*(ends.length-1)/6,j=Math.floor(u),a=ends[j],b=ends[Math.min(ends.length-1,j+1)];
      return {x:mix(a.x,b.x,u-j),y:mix(a.y,b.y,u-j),z:mix(a.z,b.z,u-j)};
    });
  }
  const ropeBuffer=new WeakMap();
  function lineWorld(list,view,key,lines,origin){
    if(!view)return;
    let stock=ropeBuffer.get(view);if(!stock){stock=new Map();ropeBuffer.set(view,stock);}
    // A six-segment, three-sided line fits in one fixed-size dynamic upload for each nearby trap.
    const id=name("warp-"+key),count=2*6*3*6*6;
    let data=stock.get(id);
    if(!data){
      data=new Float32Array(count);
      for(let i=0;i<count;i+=6){const d=1-.095*(Math.floor(i/36)%3);data[i+3]=.75*d;data[i+4]=.704*d;data[i+5]=.52*d;}
      stock.set(id,data);view.add(id,{vertices:data},true);
    }
    let cursor=0;
    function vertex(p,ox,oy,oz){
      data[cursor]=p.x-origin.x+ox;data[cursor+1]=p.y-origin.y+oy;data[cursor+2]=p.z-origin.z+oz;cursor+=6;
    }
    for(let k=0;k<2;k++){
      const seq=lines[k]||Array(7).fill(origin),radius=k?.011:.014;
      for(let i=1;i<seq.length;i++){
        const a=seq[i-1],b=seq[i],dx=b.x-a.x,dy=b.y-a.y,dz=b.z-a.z,n=Math.hypot(dx,dy,dz)||1,flat=Math.hypot(dx,dz);
        const ux=flat?dz/flat:1,uz=flat?-dx/flat:0,vx=dy*uz/n,vy=(dz*ux-dx*uz)/n,vz=-dy*ux/n;
        const rims=[[ux*radius,0,uz*radius],
          [(-.5*ux+.866*vx)*radius,.866*vy*radius,(-.5*uz+.866*vz)*radius],
          [(-.5*ux-.866*vx)*radius,-.866*vy*radius,(-.5*uz-.866*vz)*radius]];
        for(let j=0;j<3;j++){
          const r=rims[j],s=rims[(j+1)%3];
          vertex(a,...r);vertex(b,...r);vertex(b,...s);vertex(a,...r);vertex(b,...s);vertex(a,...s);
        }
      }
    }
    view.updateAnimated(id);list.push([id,origin.x,origin.y,origin.z]);
  }
  function bibPanel(g,sign,pts,col,extra=0){
    cap(g,pts.map(([x,y])=>[x,y,sign*(.108+.024*clamp((y-.95)/.48)+extra)]),col);
  }
  function crossStrip(g,a,b,w,sign,col){
    const dx=b[0]-a[0],dy=b[1]-a[1],r=w/(2*Math.hypot(dx,dy)),x=-dy*r,y=dx*r;
    bibPanel(g,sign,[[a[0]+x,a[1]+y],[b[0]+x,b[1]+y],[b[0]-x,b[1]-y],[a[0]-x,a[1]-y]],col,.009);
  }
  function aldaHead(g){
    hullRings(g,[[0,1.683,-.021,.113,.105],[0,1.741,-.022,.111,.115],[-.013,1.784,-.025,.075,.078]],"#584537");
    hullRings(g,[[-.014,1.588,-.110,.049,.056],[-.016,1.645,-.121,.068,.063],[-.013,1.696,-.108,.045,.055]],"#665244",10);
    const wrap="#b45e4a";
    hullRings(g,[[0,1.682,-.010,.117,.103],[.002,1.707,-.010,.119,.109],[.001,1.730,-.013,.112,.108]],wrap);
    path(g,[[-.096,1.714,.058],[-.062,1.721,.084],[-.027,1.724,.093]],.006,"#e8bd84",4);
    const root=[-.096,1.709,-.071];
    g.tri(root,[-.175,1.696,-.117],[-.139,1.737,-.124],"#cb7455");
    g.quad(root,[-.105,1.700,-.104],[-.150,1.619,-.135],[-.153,1.656,-.105],wrap);
    for(const s of sides){
      g.pole([s*.081,1.691,.062],[s*.106,1.665,-.028],.011,"#9d9381",5);
      g.pole([s*.077,1.675,.076],[s*.100,1.645,.026],.004,"#ddd2ab",4);
      g.box(s*.101,1.597,.012,.016,.027,.013,"#c9a064");
    }
    path(g,[[.008,1.559,.085],[.028,1.560,.087],[.043,1.566,.083]],.004,"#946e5b",4);
  }
  function benjiHead(g){
    hullRings(g,[[0,1.691,-.012,.115,.111],[0,1.741,-.013,.114,.113],[-.006,1.779,-.018,.093,.096],
      [-.008,1.801,-.020,.051,.060],[-.008,1.803,-.020,.012,.014]],"#4d6169",12);
    const brim=[[-.103,1.697,.052],[-.089,1.694,.125],[-.049,1.684,.167],[.049,1.685,.167],[.097,1.696,.128],[.105,1.695,.052]];
    cap(g,brim,"#7a8276");cap(g,brim.map(([x,y,z])=>[x,y-.008,z]),"#545d55");
    g.box(0,1.745,.101,.071,.038,.008,"#cbc3a0");
    g.quad([-.025,1.739,.107],[0,1.753,.108],[.025,1.742,.107],[.014,1.733,.107],"#426761");
    for(let k=0;k<8;k++){
      const u=pi*(.97+k/7);g.cyl(Math.cos(u)*.082,1.665+((k+2)%3)*.010,Math.sin(u)*.084-.018,.029,.022,.068,6,"#46372f");
    }
    for(const s of sides)path(g,[[s*.083,1.583,.039],[s*.073,1.567,.067],[s*.050,1.552,.071],[s*.028,1.547,.078]],.010,"#59443c",5);
    g.pole([-.042,1.592,.100],[.038,1.591,.099],.006,"#594139",5);
  }
  function workClothes(g,who,part){
    const alda=who==="alda",pants=colors[who][2],top=colors[who][1];
    part("head");if(alda)aldaHead(g);else benjiHead(g);
    part("body");
    if(alda){
      for(const s of sides){
        crossStrip(g,[s*.118,1.432],[s*.090,1.273],.034,1,"#c4a65f");
        crossStrip(g,[s*.115,1.430],[-s*.083,1.085],.033,-1,"#bc9a59");
        g.box(s*.090,1.300,.143,.041,.037,.008,"#724e36");
        g.box(s*.090,1.302,.149,.030,.023,.004,"#bfad7e");
      }
      bibPanel(g,1,[[-.154,.967],[-.159,1.091],[-.114,1.158],[-.111,1.277],[-.083,1.289],[.087,1.288],
        [.109,1.275],[.114,1.159],[.162,1.092],[.155,.967]],pants,.013);
      bibPanel(g,-1,[[-.154,.968],[-.154,1.097],[-.082,1.137],[.084,1.137],[.155,1.096],[.156,.968]],"#a58146",.013);
      bibPanel(g,1,[[-.091,1.219],[.092,1.219],[.092,1.144],[.048,1.123],[-.066,1.131],[-.092,1.145]],"#c89e57",.018);
      g.box(0,1.216,.153,.173,.008,.006,"#8c723f");g.box(-.039,1.197,.157,.060,.016,.005,"#e2c387");
    }else{
      for(const s of sides){
        bibPanel(g,1,[[s*.128,1.426],[s*.061,1.436],[s*.018,1.359],[s*.089,1.380]],"#cc9571",.011);
        crossStrip(g,[s*.150,1.352],[s*.051,1.347],.010,1,"#9a624e");
      }
      crossStrip(g,[0,1.367],[.007,.971],.018,1,"#a06750");
      for(const y of [1.291,1.20,1.109,1.032])g.box(.005,y,.145,.013,.013,.010,"#544c43");
      bibPanel(g,1,[[.057,1.318],[.152,1.318],[.150,1.247],[.109,1.229],[.059,1.251]],"#ad7055",.018);
      g.box(.103,1.326,.154,.071,.022,.005,"#ded2ae");
      g.box(-.085,1.321,.155,.015,.071,.009,"#526963");
      g.box(0,.982,0,.325,.048,.219,"#655748");g.box(.024,.982,.117,.049,.026,.010,"#b4ac85");
      // A creased piece of red shop rag hangs from the back pocket, clear of both hands.
      bibPanel(g,-1,[[.071,.981],[.128,.974],[.144,.790],[.109,.807],[.081,.789]],"#a75746",.019);
      path(g,[[.105,.958,-.131],[.118,.832,-.128],[.108,.807,-.129]],.005,"#cd8865",4);
    }
    for(const s of sides){
      part("arm",s);
      for(const j of [0,1])hullRings(g,[[s*.230,1.270+j*.031,-.004,.071,.076],[s*.228,1.277+j*.031,-.004,.074,.078],
        [s*.226,1.293+j*.031,-.004,.073,.079]],alda?(j?"#8da798":"#c0c5a6"):(j?"#a96450":"#ce9571"),9);
      if(!alda)g.box(s*.250,1.137,.009,.099,.031,.103,"#7a8274");
      part("held",s);
      hullRings(g,[[s*.239,.962,.051,.033,.043],[s*.238,.984,.049,.045,.046],[s*.236,1.038,.039,.045,.047]],
        alda?"#53685c":"#baa47a",8);
      g.box(s*.242,1.022,.043,.085,.020,.091,alda?"#9eaa8d":"#805c43");
      if(!alda)g.box(s*.239,.979,.086,.061,.029,.007,"#d9b47e");
      part("leg",s);
      hullRings(g,[[s*.111,.140,-.003,.066,.075],[s*.108,.235,0,.072,.079],[s*.108,.358,0,.081,.084]],
        alda?"#3e5e57":"#705946",9);
      hullRings(g,[[s*.108,.339,0,.081,.085],[s*.108,.357,0,.083,.086],[s*.108,.370,0,.081,.085]],
        alda?"#829682":"#a08766",9);
      g.box(s*.111,.104,.038,.13,.090,.231,alda?"#4c6457":"#745d47");
      g.box(s*.111,.062,.060,.138,.025,.222,alda?"#b8ae85":"#b59c74");
      if(alda){
        g.quad([s*.060,.525,.092],[s*.149,.524,.094],[s*.146,.611,.088],[s*.063,.616,.088],"#aa8246");
      }
    }
  }
  function dress(rig,role){
    if(!rig||!colors[role]||rig.buttonwoodWear===role)return;
    const g=new BayMesh(),groups=[];
    workClothes(g,role,(key,side=1)=>groups.push({key,side,offset:g.vertices.length/6}));
    const joined=new Float32Array(rig.rest.length+g.vertices.length);joined.set(rig.rest);joined.set(g.vertices,rig.rest.length);
    for(let i=0;i<groups.length;i++){
      const entry=groups[i],end=groups[i+1]?.offset??g.vertices.length/6,limb=rig.sides[entry.side<0?0:1];
      for(let j=entry.offset;j<end;j++)rig.bindings.push(rig.binding(entry.key,limb,g.vertices[j*6+1]));
    }
    rig.rest=joined;rig.vertices=joined.slice();rig.lastRevision=-1;rig.buttonwoodWear=role;
  }
  function farCrew(g,role,sitting){
    const alda=role==="alda",[skin,shirt,pants]=colors[role],drop=sitting?-.50:0;
    for(const s of sides){
      const hip=[s*.101,.952+drop,0],knee=[s*.111,sitting?.44:.55,sitting?.32:.01],ankle=[s*.111,.16,sitting?.34:0];
      g.pole(hip,knee,.085,pants,5);g.pole(knee,ankle,.064,pants,5);
      g.box(s*.111,.100,sitting?.38:.045,.135,.14,.230,"#536452");
      const elbow=[s*.253,1.187+drop,sitting?.09:0],hand=[s*.206,1.004+drop,sitting?.225:.050];
      g.pole([s*.181,1.386+drop,0],elbow,.072,shirt,5);g.pole(elbow,hand,.050,skin,5);
    }
    g.cyl(0,1.185+drop,0,.204,.165,.461,8,shirt);
    if(alda)g.box(0,1.113+drop,.098,.235,.257,.044,pants);
    g.cyl(0,1.602+drop,0,.098,.077,.21,8,skin);
    g.cyl(0,1.715+drop,-.013,.099,.111,.104,8,alda?"#9e5d4a":"#4d6169");
    if(alda)g.box(-.025,1.641+drop,-.110,.10,.093,.091,"#655444");
    else g.box(0,1.698+drop,.099,.188,.016,.119,"#758278");
  }
  const noop=()=>{};
  const rigs=new WeakMap(),sketches=new Map();
  function crewRig(view,a){
    let pool;
    if(view){pool=rigs.get(view);if(!pool){pool=new Map();rigs.set(view,pool);}}
    else pool=sketches;
    let mesh=pool.get(a.id);
    if(!mesh){
      mesh=new BayPlayerMesh(colors[a.id],"local");
      if(view){dress(mesh,a.id);view.add(name("actor-"+a.id),mesh,true);}
      else{mesh.bindings.length=0;mesh.rest=mesh.vertices=new Float32Array();mesh.skin=noop;}
      pool.set(a.id,mesh);
    }
    return mesh;
  }
  function chain(upper,lower,a,b,hint){
    const d=b.map((v,i)=>v-a[i]),length=Math.max(.001,Math.hypot(...d)),axis=d.map(v=>v/length);
    const u=upper.length,l=lower.length,n=clamp(length,Math.abs(u-l)+.002,u+l-.001);
    const along=(u*u-l*l+n*n)/(2*n),out=Math.sqrt(Math.max(0,u*u-along*along));
    const dot=hint.reduce((sum,v,i)=>sum+v*axis[i],0),normal=hint.map((v,i)=>v-dot*axis[i]),den=Math.hypot(...normal)||1;
    const joint=a.map((v,i)=>v+axis[i]*along+normal[i]*out/den),p=a.map((v,i)=>v+axis[i]*n);
    upper.aim(a,joint);lower.aim(joint,p);
  }
  function local(a,p){
    const dx=p.x-a.x,dz=p.z-a.z,y=p.y-(a.y||0),c=Math.cos(a.yaw||0),s=Math.sin(a.yaw||0);
    const x=dx*c-dz*s,z=dx*s+dz*c,cr=Math.cos(a.lean??a.roll??0),sr=Math.sin(a.lean??a.roll??0);
    const h=-x*sr+y*cr,cp=Math.cos(a.pitch||0),sp=Math.sin(a.pitch||0);
    return [x*cr+y*sr,h*cp+z*sp,-h*sp+z*cp];
  }
  function actionOf(a){
    if(a.action==="haul"||a.action==="cast")return a.action;
    if(a.motion?.ride||a.seat>.01||a.action==="passenger"||a.action==="pilot")return "ride";
    return a.action||"idle";
  }
  function targets(a,t,action,rest,state){
    const alda=a.id==="alda",beat=Math.sin(t*2.8+.62),idle=Math.sin(t*1.23+(alda?1:3));
    const boat=state?.line?.v||state?.skiff;
    const hands=rest.map(p=>p.slice());
    let shape=[0,0,0,0,0,0,0]; // hip drop and advance, chest pitch/yaw/roll, neck pitch/yaw.
    if(action==="guide"||action==="spot"){
      let bearing=0;
      if(a.target){const p=local(a,{...a.target,y:a.target.y??a.y??0});bearing=clamp(Math.atan2(p[0],p[2]),-.8,.8);}
      shape=[-.018,.022,.075,bearing*.28,-.025,.05,bearing*.64];
      const curl=.5+.5*Math.sin(t*3.06);
      hands[0]=[-.33+.060*curl,1.30+.20*curl,.155+.15*(1-curl)];
      hands[1]=[.31+.040*curl,1.31+.21*curl,.184+.14*(1-curl)];
    }else if(action==="hold"||action==="stop"){
      shape=[-.039,-.006,.02,-.04,0,-.09,.05*idle];
      hands[0]=[-.266,1.54+.018*beat,.296];hands[1]=[.296,1.56+.019*beat,.287];
    }else if(action==="haul"){
      const crank=Number.isFinite(boat?.haul)?boat.haul:state?.line?.lift??0,angle=crank*tau*2.38;
      const height=.074*Math.cos(angle)-.061*Math.sin(angle),forward=.074*Math.sin(angle)+.061*Math.cos(angle);
      shape=[-.395+.62*height,.149,.61-.24*height,-.11,.052,.42-.04*Math.cos(angle),.05];
      if(boat){
        hands[0]=local(a,place(boat,[.748,1.040,.774]));
        hands[1]=local(a,place(boat,[.900,.747+height,.718+forward]));
      }else{
        hands[0]=[.064,.935,.368];hands[1]=[.122-forward,.642+height,.520];
      }
    }else if(action==="cast"){
      // For the narrow step from pier to rail, both hands help balance and her eyes follow her footing.
      const board=Math.sin(pi*clamp(a.seat||0));
      shape=[-.060*board,.018,.13,.10,.056*board,.34,-.11];
      hands[0]=[-.32-.14*board,1.12+.16*board,.16];
      hands[1]=[.37+.095*board,1.20+.14*board,.17];
    }else if(action==="check"||action==="hitch"||action==="inspect"){
      shape=[-.22,.094,.51,.095,.08,.34,-.11];
      hands[0]=[-.112,.867+.034*idle,.276];hands[1]=[.093+.031*beat,.720+.034*idle,.397];
    }else if(action==="ride"){
      // Native board/ride targets retain the handle through entry and the seat through turns.
      shape=null;
    }else if(action==="walk"||action==="board"||action==="leave"){shape=null;}
    else if(alda){
      shape=[0,0,.018,.073*idle,.025,.07+.025*beat,.18*idle];
      hands[0]=[-.160,1.086,.147];hands[1]=[.188,1.090+.017*idle,.163];
    }else{
      shape=[0,0,.023+.012*idle,-.045,.025,-.008,.22*idle];
      hands[1]=[.179,1.016+.014*idle,.127];
    }
    return {shape,hands};
  }
  function pose(mesh,a,t=0,state={}){
    const action=actionOf(a),frame=Math.floor(t*(action==="haul"||action==="walk"||action==="ride"||action==="board"?48:24));
    const key=mesh.buttonwoodPose;
    if(key?.frame===frame&&key.action===action&&key.a===a&&key.seat===a.seat&&key.crank===state.line?.v?.haul)return false;
    const dt=key?clamp(t-key.t,0,.10):0,m=a.motion||(mesh.buttonwoodMotion??=new BayPlayerMotion());
    if(!a.motion)m.step(dt,0,0);
    let motion=m;
    if(!m.ride&&(action==="ride"||a.seat>.001)){
      const seat=clamp(a.seat??1);
      motion=Object.create(m);
      motion.ride={seat,inner:seat,outer:seat,side:1,seatY:a.seatY??.425,steer:0,floor:0,reach:0,pull:0,duck:0,latchDip:0,passenger:true};
    }
    const skin=mesh.skin;mesh.skin=noop;mesh.lastRevision=-1;
    try{mesh.update(motion);}finally{mesh.skin=skin;}
    const rest=mesh.sides.map(l=>l.forearm.map(l.handPivot,[]));
    const goal=targets(a,t,action,rest,state);
    let transition=key?.transition;
    if(key?.action!==action)transition=key?.a===a&&t>=key.t&&t-key.t<.32?{t,shape:key.shape,hands:key.hands}:null;
    const u=transition?smooth((t-transition.t)/.24):1,blend=(a,b)=>b.map((v,i)=>mix(a[i],v,u));
    let shape=goal.shape,hands=goal.hands;
    if(transition&&u<1){
      if(shape&&transition.shape)shape=blend(transition.shape,shape);
      hands=hands.map((p,i)=>blend(transition.hands[i],p));
    }else transition=null;
    if(shape){
      const [drop,advance,pitch,yaw,lean,nod,turn]=shape;
      if(Math.abs(drop)+Math.abs(advance)>.001){
        const hips=mesh.pelvis.map(mesh.pelvis.pivot,[]);
        hips[1]+=drop;hips[2]+=advance;mesh.pelvis.place(hips,-.02,yaw*.3,-lean*.6);
        for(const limb of mesh.sides){
          const ankle=limb.shoe.map(limb.shoe.pivot,[]);
          chain(limb.thigh,limb.shin,mesh.pelvis.map(limb.thigh.pivot,[]),ankle,[limb.side*.19,0,1]);
        }
      }
      mesh.chest.place(mesh.pelvis.map(mesh.chest.pivot,[]),pitch,yaw,lean);
      mesh.head.place(mesh.chest.map(mesh.head.pivot,[]),pitch*.41+nod,yaw*.53+turn,lean*.69);
    }
    mesh.sides.forEach((limb,i)=>{
      const target=hands[i],original=rest[i],shoulder=mesh.chest.map(limb.arm.pivot,limb.shoulder);
      if(!shape&&target.every((v,i)=>Math.abs(v-original[i])<.0001))return;
      chain(limb.arm,limb.forearm,shoulder,target,[limb.side*.78,-.71,-.35]);
    });
    mesh.skin();
    mesh.buttonwoodPose={a,t,frame,action,seat:a.seat,crank:state.line?.v?.haul,shape,
      hands:mesh.sides.map(l=>l.forearm.map(l.handPivot,[])),transition};
    return true;
  }
  function crabs(tr,l,t){
    if(!l)return [];
    const points=[[-.196,.050,-.142,.47],[.134,.056,-.058,-.59],[-.137,.056,.161,1.7],[.220,.054,.135,-.88],
      [-.320,.057,-.036,1.80],[.050,.053,-.199,-.74],[-.279,.097,.167,.31],[.270,.092,-.195,.66],
      [.015,.110,.066,-1.61],[-.195,.118,-.103,-.47],[.128,.125,.145,.34],[.205,.162,-.007,1.28]];
    const count=Number.isFinite(l.count)?clamp(l.count,0,points.length):clamp(3+(l.pot?.index??0)-Math.floor((l.shocks||0)/2),2,5);
    const tipped=l.phase==="empty"||l.phase==="lower",emptied=tipped?clamp(l.empty??(l.phase==="lower"?1:0)):0;
    const chute=l.v?slideFrame(l.v,1):null;
    const out=[];
    for(let i=0;i<count;i++){
      let [x,y,z,angle]=points[i];
      const dt=t+i*1.3;x+=.010*Math.sin(dt*2.8);z+=.012*Math.cos(dt*1.8);
      const u=clamp((emptied-.065-.29*i/Math.max(1,count-1))/.58),from=place(tr,[x,y,z]);
      let q=from,f=0;
      if(u>0&&chute){
        const sample=v=>{
          const base=slideEdge(v,0);base[0]+=(i%3-1)*.037;return place(chute,base);
        };
        const bridge=(a,b,n)=>({x:mix(a.x,b.x,n),y:mix(a.y,b.y,n*n),z:mix(a.z,b.z,n)});
        if(u<.25)q=bridge(from,sample(0),u/.25);
        else if(u<.89){
          const travel=(u-.25)/.64;f=travel*(.63+.37*travel);q=sample(f);
        }else{
          const n=(u-.89)/.11;
          if(n>=1-1e-6&&(i>=3||(l.v.catchCount||0)+i>=3))continue;
          const dest=place(l.v,[.410+(i%3-1)*.053,.344+(i%3)*.019,-1.511+.055*Math.sin(i*2.09)]);
          q=bridge(sample(1),dest,n);f=1;
        }
      }
      out.push({...q,yaw:tr.yaw+angle+.09*Math.sin(dt)+.68*f,pitch:u&&u<.25?Math.sin(pi*u/.25)*.35:tr.pitch});
    }
    return out;
  }
  function restingCatch(tr,p,state,t){
    const soak=clamp(1-(state.saved?.rests?.[p.id]??0)/115);
    return crabs(tr,{pot:p,phase:"rest"},t).slice(0,Math.floor(soak*3+.001));
  }
  function tipped(tr,l){
    if(!l||l.phase!=="empty"||!l.v)return tr;
    // The pot stays hung from its three-leg bridle while the bottom swings in over the boat.
    const a=Math.sin(pi*clamp(l.empty??0)),lean=-.68*a,angle=l.v.yaw??tr.yaw;
    const pivot=place(tr,[-.014,.708,.018]),yaw=tr.yaw+Math.atan2(Math.sin(angle-tr.yaw),Math.cos(angle-tr.yaw))*a;
    const offset=rot([-.014,.708,.018],yaw,tr.pitch,lean);
    return {...tr,x:pivot.x-offset[0],y:pivot.y-offset[1],z:pivot.z-offset[2],yaw,lean};
  }
  function install(model){
    for(const [i,c] of paint.entries())for(const far of [false,true])model(name(c.id+(far?"-far":"")),g=>buoyModel(g,i,far));
    model(name("ripple"),wakeRing);model(name("trap"),trap);model(name("lid"),trapLid);model(name("keeper"),crab);model(name("slide"),sortingSlide);
    for(const role of Object.keys(colors))for(const seat of [false,true])model(name("far-"+role+(seat?"-seat":"")),g=>farCrew(g,role,seat));
  }
  function world(list,see,t=0,state={},view){
    const line=state.line;
    const submerged=!view?.basis||view.basis.camera.y<-.07;
    const boat=state.skiff||line?.v;
    if(boat&&see(boat,29)){
      const slide=slideFrame(boat,line?.lift||0);list.push([name("slide"),slide.x,slide.y,slide.z,slide.yaw,slide.pitch,slide.lean]);
    }
    for(const [i,p] of (state.pots||[]).entries()){
      if(!see(p,126)&&!(match(p,line)&&see(line.hook||p,40)))continue;
      const active=match(p,line)?line:null,b=floatPose(p,i,t,active),near=!!active||see(p,28),c=paint[category(p,i)];
      list.push([name(c.id+(near?"":"-far")),b.x,b.y,b.z,b.yaw,b.pitch,b.lean]);
      if(!near)continue;
      if(b.y<.40)list.push([name("ripple"),b.x,.075,b.z,b.yaw]);
      if(!active&&!submerged)continue;
      const tr=tipped(trapPose(p,i,active),active),lid=lidPose(tr,active);
      if(submerged||tr.y+.75>.04){
        list.push([name("trap"),tr.x,tr.y,tr.z,tr.yaw,tr.pitch,tr.lean]);
        list.push([name("lid"),lid.x,lid.y,lid.z,lid.yaw,lid.pitch,lid.lean]);
      }
      const arcs=strands(b,tr,active,t),shown=submerged?arcs:arcs.map(aboveWater).filter(Boolean);
      if(shown.length)lineWorld(list,view,p.id??i,shown,b);
      const catchInView=active?crabs(tr,active,t):restingCatch(tr,p,state,t);
      for(const q of catchInView)if(submerged||q.y>-.025)list.push([name("keeper"),q.x,q.y,q.z,q.yaw,q.pitch]);
    }
    for(const a of state.actors||[]){
      if(!colors[a.id]||a.hidden||!see(a,72))continue;
      const y=(a.y||0)+(a.motion?.lift||0),yaw=a.yaw||0,bank=a.lean??a.roll??0;
      if(!view||!see(a,22)){
        list.push([name("far-"+a.id+(a.seat>.55?"-seat":"")),a.x,y,a.z,yaw,a.pitch||0,bank]);continue;
      }
      const rig=crewRig(view,a);
      if(pose(rig,a,t,state))view.updateAnimated(name("actor-"+a.id));
      list.push([name("actor-"+a.id),a.x,y,a.z,yaw,a.pitch||0,bank]);
    }
  }
  function plot(ctx,px,py,s,rot=0,ground=0){
    const dx=.46*Math.sin(rot),dz=.46*Math.cos(rot);
    function at(p){return [px(p.x)+(p.y-ground)*s*dx,py(p.z)-(p.y-ground)*s*dz];}
    function path(pts,w,col){
      ctx.strokeStyle=col;ctx.lineWidth=Math.max(.55,w*s);ctx.beginPath();
      for(const [i,p] of pts.entries()){const q=at(p);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);}
      ctx.stroke();
    }
    function fill(pts,col){
      ctx.fillStyle=col;ctx.beginPath();
      for(const [i,p] of pts.entries()){const q=at(p);if(i)ctx.lineTo(...q);else ctx.moveTo(...q);}
      ctx.closePath();ctx.fill();
    }
    function dot(p,x,z,col){
      const q=at(p);ctx.beginPath();ctx.fillStyle=col;ctx.ellipse(...q,Math.max(.54,s*x),Math.max(.50,s*z),0,0,tau);ctx.fill();
    }
    return {at,path,fill,dot};
  }
  function mapBuoy(I,b,c,i){
    const q=(x,y,z)=>place(b,[x,y,z]);
    I.dot({...b,y:0},.34,.24,"#789f94");
    I.dot(q(0,.08,0),.232,.215,c.dark);I.dot(q(0,.21,0),.222,.196,cream);
    I.dot(q(0,.31,0),.209,.182,c.top);I.dot(q(0,.46,0),.143,.121,c.trim);
    I.path([q(0,.38,0),q(.027,1.66,-.025)],.036,"#705f49");
    I.fill([q(.02,1.59,-.02),q(.397,1.55,.09),q(.32,1.439,.080),q(.027,1.30,-.02)],c.top);
    I.fill([q(.02,1.59,-.02),q(.397,1.55,.09),q(.205,1.462,.063)],c.trim);
    if(i===1||i===3)I.fill([q(.026,1.31,-.02),q(.205,1.46,.06),q(.40,1.32,.101)],c.dark);
  }
  function mapCrab(I,c){
    const q=(x,y,z)=>place(c,[x,y,z]);
    for(const s of sides){
      for(let i=0;i<2;i++)I.path([q(s*.062,.023,-.036+i*.04),q(s*.124,.023,-.068+i*.063),q(s*.161,.008,-.09+i*.07)],.013,"#518a91");
      I.path([q(s*.067,.03,.032),q(s*.145,.047,.073),q(s*.130,.055,.128)],.035,"#5d8a84");
    }
    I.fill([q(-.12,.021,0),q(-.064,.031,.059),q(0,.039,.068),q(.071,.030,.058),q(.12,.022,0),
      q(.073,.02,-.052),q(-.065,.020,-.053)],"#778765");
  }
  function mapSlide(I,boat,line){
    const frame=slideFrame(boat,line?.lift||0),at=(u,k)=>place(frame,slideEdge(u,k));
    for(let i=0;i<4;i++)for(const d of sides){
      const a=i*.25,b=a+.25;I.fill([at(a,0),at(a,d),at(b,d),at(b,0)],d>0?"#b3ac87":"#c2b997");
      I.path([at(a,d),at(b,d)],.020,"#83917c");
    }
    for(const u of [0,.33,.67,1])I.path([at(u,-1),at(u,0),at(u,1)],.018,"#a18e70");
  }
  function mapTrap(I,tr,keepers,l){
    const q=(x,y,z)=>place(tr,[x,y,z]),perimeter=y=>corners(y).map(p=>place(tr,p)),loop=p=>p.concat([p[0]]);
    I.fill(perimeter(.015),"rgba(79,103,87,.56)");I.path(loop(perimeter(.027)),.030,"#52665a");
    for(const x of [-cageX,cageX])for(const z of [-cageZ,cageZ])I.path([q(x,.03,z),q(x,.44,z)],.025,galvanized);
    for(const x of [-cageX,cageX]){
      const s=Math.sign(x),rim=Array.from({length:13},(_,i)=>q(x,.265+.123*Math.sin(i*tau/12),.157*Math.cos(i*tau/12)));
      const funnel=Array.from({length:13},(_,i)=>q(s*.241,.239+.064*Math.sin(i*tau/12),.096*Math.cos(i*tau/12)));
      I.path(rim,.017,"#8a9a87");I.path(funnel,.013,"#718674");
      for(const i of [1,4,7,10])I.path([rim[i],funnel[i]],.012,wire);
    }
    for(const c of keepers)mapCrab(I,c);
    for(const side of sides){
      for(const x of [.18,.30])I.path([q(side*x,.435,-cageZ),q(side*(x+.018),.435,0),q(side*x,.435,cageZ)],.013,wire);
      for(let i=1;i<5;i++){
        const z=-cageZ+i*(2*cageZ)/5;I.path([q(side*.18,.437,z+.021),q(side*cageX,.437,z)],.013,wire);
      }
    }
    I.path(loop(perimeter(.442)),.030,galvanized);
    const lid=lidPose(tr,l),d=(x,z)=>place(lid,[x,0,z]);
    I.path([d(-.177,0),d(.177,0),d(.177,-.65),d(-.177,-.65),d(-.177,0)],.020,galvanized);
    for(let j=1;j<4;j++)I.path([d(-.177,-.65*j/4),d(.177,-.65*j/4)],.013,wire);
    I.path([d(0,-.65),d(0,0)],.013,wire);
    I.path([d(-.053,-.555),d(.084,-.56)],.027,"#b69a69");
    for(const [x,z] of [[-.47,-.37],[.47,-.37],[0,.37]])I.path([q(x,.44,z),q(-.014,.708,.018)],.015,rope);
  }
  function mapActor(ctx,px,py,s,a,t,state,opt){
    const enclosed=a.enclosed||a.ride?.kind&&a.ride?.kind!=="pip"&&a.ride?.kind!=="skiff";
    if(a.seat>=.98&&enclosed)return;
    const rig=crewRig(null,a);pose(rig,a,t,state);
    const [skin,shirt,pants]=colors[a.id],alda=a.id==="alda",I=plot(ctx,px,py,s,opt.rotation||0,a.y||0);
    const joint=(bone,p)=>place(a,bone.map(p,[])),chest=(x,y,z)=>joint(rig.chest,[x,y,z]),head=(x,y,z)=>joint(rig.head,[x,y,z]);
    if(!(a.seat>.04)){ctx.save();ctx.globalAlpha*=.23;I.dot({x:a.x+.044,y:a.y||0,z:a.z-.040},.232,.132,"#344b46");ctx.restore();}
    for(const limb of rig.sides){
      const side=limb.side,hip=joint(limb.thigh,limb.thigh.pivot),knee=joint(limb.shin,limb.shin.pivot);
      const ankle=joint(limb.shoe,limb.shoe.pivot),toe=joint(limb.shoe,[side*.111,.080,.147]);
      I.path([hip,knee],.155,pants);I.path([knee,ankle],.121,pants);
      I.path([joint(limb.shin,[side*.11,.34,0]),ankle,toe],.129,alda?"#48685c":"#795f48");
    }
    const hip=(x,z)=>joint(rig.pelvis,[x,.975,z]);
    I.fill([hip(-.149,0),chest(-.202,1.382,0),chest(-.162,1.431,.008),chest(.163,1.432,.008),chest(.202,1.382,0),hip(.149,0)],shirt);
    if(alda){
      I.fill([hip(-.141,.070),chest(-.107,1.263,.111),chest(.104,1.263,.111),hip(.144,.07)],pants);
      for(const side of sides){
        I.path([chest(side*.120,1.427,-.026),chest(side*.089,1.267,.112)],.042,"#c9ad6a");
        I.path([chest(side*.120,1.427,-.026),chest(-side*.082,1.089,-.115)],.034,"#bf9b58");
      }
    }else{
      I.path([chest(-.138,1.402,-.033),chest(-.042,1.361,.102),chest(0,1.329,.116),
        chest(.072,1.380,.102),chest(.143,1.402,-.033)],.023,"#deaa7b");
    }
    for(const l of rig.sides){
      const side=l.side,shoulder=joint(l.arm,l.arm.pivot),elbow=joint(l.forearm,l.forearm.pivot);
      const wrist=joint(l.forearm,l.handPivot),sleeve=joint(l.arm,[side*.231,1.276,-.004]);
      I.path([shoulder,elbow],.105,skin);I.path([shoulder,sleeve],.15,shirt);
      I.path([joint(l.arm,[side*.230,1.30,-.004]),sleeve],.129,alda?"#a2b19c":"#cf9774");I.path([elbow,wrist],.077,skin);
      I.dot(wrist,.046,.042,alda?"#63796a":"#cdb183");
    }
    I.dot(head(0,1.640,.013),.107,.118,skin);
    if(alda){
      I.dot(head(-.021,1.641,-.113),.070,.064,"#665447");I.dot(head(0,1.699,-.009),.115,.114,"#b8644e");
      I.dot(head(-.004,1.735,-.026),.098,.089,"#5e4c40");
      I.fill([head(-.085,1.705,-.056),head(-.16,1.659,-.133),head(-.147,1.711,-.129)],"#cf7e5b");
    }else{
      I.fill([head(-.100,1.693,.047),head(-.087,1.687,.146),head(.069,1.687,.159),head(.104,1.694,.042)],"#839082");
      I.dot(head(0,1.740,-.016),.113,.111,"#536b72");I.path([head(-.030,1.746,.098),head(.035,1.743,.100)],.024,cream);
    }
  }
  function map(ctx,px,py,s,visible,t=0,state={},opt={}){
    const chart=opt.mode==="atlas"||opt.mode==="radar",submerged=!!opt.submerged;
    ctx.save();ctx.lineCap="round";ctx.lineJoin="round";
    try{
      const boat=state.skiff||state.line?.v;
      if(boat&&!chart&&!submerged&&visible(px(boat.x),py(boat.z),4*s))mapSlide(plot(ctx,px,py,s,opt.rotation||0),boat,state.line);
      for(const [i,p] of (state.pots||[]).entries()){
        if(!visible(px(p.x),py(p.z),6*s+4))continue;
        const l=match(p,state.line)?state.line:null,c=paint[category(p,i)];
        if(chart){
          if(!state.saved?.working&&!l)continue;
          ctx.fillStyle=ink;ctx.beginPath();ctx.arc(px(p.x),py(p.z),2.7,0,tau);ctx.fill();
          ctx.fillStyle=c.top;ctx.beginPath();ctx.arc(px(p.x),py(p.z),1.6,0,tau);ctx.fill();continue;
        }
        const b=floatPose(p,i,t,l),tr=tipped(trapPose(p,i,l),l),I=plot(ctx,px,py,s,opt.rotation||0,submerged?tr.y:0);
        if(submerged||l){
          if(!submerged&&tr.y<-.5){ctx.save();ctx.globalAlpha*=clamp(1.05+tr.y*.23,.10,.86);}
          mapTrap(I,tr,l?crabs(tr,l,t):restingCatch(tr,p,state,t),l);
          if(!submerged&&tr.y<-.5)ctx.restore();
          const lines=strands(b,tr,l,t);
          for(const p of lines)I.path(p,.026,rope);
        }
        if(!submerged)mapBuoy(I,b,c,category(p,i));
      }
      if(!chart&&!submerged)for(const a of state.actors||[]){
        if(!a.hidden&&colors[a.id]&&visible(px(a.x),py(a.z),3*s+3))mapActor(ctx,px,py,s,a,t,state,opt);
      }
    }finally{ctx.restore();}
  }
  window.BayButtonwoodPots=Object.freeze({install,world,map,colors,dress,pose,strands,trapPose,floatPose});
})();
