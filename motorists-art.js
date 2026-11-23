/* The Marlin's curb crew. Every sleeve, hand socket and door grip uses the street skeleton. */
(() => {
  "use strict";
  const people={
    ruth:{skin:"#b78768",shirt:"#344766",pants:"#525759",hair:"#2d2934",edge:"#86745f",tag:"#e5aa43",trim:"#b29477"},
    des:{skin:"#84573f",shirt:"#798261",pants:"#4b4849",hair:"#3b302c",edge:"#594b43",tag:"#4bb7ac",trim:"#c9bb8f"},
    viv:{skin:"#ba8269",shirt:"#c87762",pants:"#3c5659",hair:"#b9b9b0",edge:"#7e807b",tag:"#e18270",trim:"#e1a78b"},
    tess:{skin:"#a77459",shirt:"#6f9992",pants:"#324d52",hair:"#49372f",edge:"#534138",tag:"#e7be77",trim:"#eed6a3"},
    road0:{skin:"#9a6a50",shirt:"#aa745c",pants:"#465763",hair:"#493730",edge:"#755242",trim:"#d7b58c"},
    road1:{skin:"#d3a27a",shirt:"#6d8c99",pants:"#665b50",hair:"#7d6150",edge:"#a78868",trim:"#b0bdaf"},
    road2:{skin:"#745041",shirt:"#9d936f",pants:"#444a50",hair:"#302d31",edge:"#60504b",trim:"#79754f"},
    road3:{skin:"#bb8261",shirt:"#926b7f",pants:"#58656a",hair:"#503c39",edge:"#83635c",trim:"#c7a3a0"}
  };
  const ids=Object.keys(people),colors={},roles={};
  for(const id of ids){const p=people[id];colors[id]=[p.skin,p.shirt,p.pants];roles[id]="local";}
  const brass="#d6b577",ink="#354648",paper="#ecdcb0",tau=2*Math.PI;
  const mix=(a,b,f)=>a+(b-a)*f;
  function smooth(a,b,x){const v=Math.max(0,Math.min(1,(x-a)/(b-a)));return v*v*(3-2*v);}
  const between=(a,b,f)=>a.map((x,i)=>mix(x,b[i],f));
  const shift=(p,x,y,z)=>[p[0]+x,p[1]+y,p[2]+z];
  const oval=(g,a,b,r,col)=>g.pole(a,b,r,col,5);
  function line(g,pts,r,col){for(let i=1;i<pts.length;i++)oval(g,pts[i-1],pts[i],r,col);}
  function stitch(g,x,y,X,Y,width,color,z=.128){
    const dx=X-x,dy=Y-y,r=width*.5/(Math.hypot(dx,dy)||1),a=-r*dy,b=r*dx;
    g.quad([x+a,y+b,z],[X+a,Y+b,z],[X-a,Y-b,z],[x-a,y-b,z],color);
  }
  function cloth(g,outline,color,z=.125){
    const pt=q=>[q[0],q[1],z];
    for(let i=2;i<outline.length;i++)g.tri(pt(outline[0]),pt(outline[i-1]),pt(outline[i]),color);
  }
  function lapels(g,p,open,edge){
    cloth(g,[[-.071,1.428],[.074,1.428],[.021,open-.012],[-.015,open]],p.skin,.125);
    for(const k of [-1,1]){
      cloth(g,[[k*.071,1.431],[k*.124,1.405],[k*.078,open-.016],[k*.018,open+.032]],edge,.129);
      stitch(g,k*.116,1.401,k*.079,open-.008,.005,p.trim,.131);
    }
    for(const y of [1.025,1.107,1.190,1.267])if(y<open-.025)
      cloth(g,[[-.006,y+.005],[.005,y+.006],[.007,y-.005],[-.005,y-.006]],p.trim,.131);
  }
  function patchPocket(g,x,y,w,h,clothColor,edge){
    const half=w*.5;
    cloth(g,[[x-half,y],[x+half,y],[x+half-.004,y-h+.011],[x,y-h],[x-half+.004,y-h+.008]],clothColor,.129);
    stitch(g,x-half,y-.012,x+half,y-.012,.006,edge,.132);
  }
  function glasses(g,round){
    const col=round?"#614c3f":"#343b45";
    for(const k of [-1,1]){
      const pts=round?[[.011,1.66],[.019,1.677],[.052,1.684],[.078,1.675],[.084,1.655],[.068,1.637],[.037,1.634],[.018,1.644]]:
        [[.010,1.671],[.082,1.675],[.080,1.649],[.068,1.638],[.024,1.640],[.012,1.648]];
      const rim=pts.map(([x,y])=>[k*x,y,.114-(x-.025)*.104]);
      line(g,[...rim,rim[0]],round?.0042:.0049,col);
      line(g,[[k*.081,1.668,.109],[k*.102,1.658,.048],[k*.106,1.650,-.010]],.0038,col);
      oval(g,[k*.018,1.665,.111],[0,1.667,.119],.0039,col);
    }
  }
  // Eight-sided, asymmetrical bands leave the native eyes and ears exposed below the hair.
  function hairRing(y,w,f,b,front=0,flare=0){
    return [[-.69*w,y+front,f],[.63*w,y+front,f],[w,y+flare,f*.35],[w*.99,y,-b*.54],
      [.65*w,y,-b],[-.66*w,y,-b],[-w,y,-b*.51],[-w,y+flare,f*.43]];
  }
  function rim(g,a,b,col,accent){
    for(let i=0;i<a.length;i++){
      const k=(i+1)%a.length;g.quad(a[i],a[k],b[k],b[i],i===5||i===7?accent:col,.92+.06*Math.cos(i));
    }
  }
  function hairstyle(g,id,p){
    const bob=id==="ruth",wave=id==="viv",crop=id==="des",knot=id==="tess"||id==="road3";
    const base=hairRing(bob?1.553:wave?1.601:1.622,bob?.117:.107,.099,.107,bob?.143:wave?.093:.069,bob?.008:.021);
    const brow=hairRing(1.706,bob?.117:.110,.108,.111),crown=hairRing(1.754,bob?.104:.097,.088,.104);
    rim(g,base,brow,p.hair,p.edge);rim(g,brow,crown,p.hair,p.hair);
    const high=[bob?-.028:wave?.024:-.008,1.793,-.008];
    for(let n=0;n<crown.length;n++)g.tri(crown[n],crown[(n+1)%8],high,n%4===0?p.edge:p.hair);
    if(bob){
      g.tri([-.088,1.714,.103],[.051,1.727,.107],[-.063,1.672,.113],p.hair);
      g.tri([-.065,1.706,.109],[.051,1.727,.107],[-.044,1.693,.113],"#49404b");
      for(const k of [-1,1]){
        g.quad([k*.103,1.691,.047],[k*.112,1.692,.070],[k*.108,1.548,.080],[k*.098,1.539,.049],p.hair);
        oval(g,[k*.112,1.666,-.028],[k*.113,1.568,-.043],.003,"#59505a");
      }
    }else if(wave){
      for(let i=0;i<4;i++){
        const x=-.066+i*.036;
        line(g,[[x,1.701,.093],[x-.016,1.742,.089],[x-.009,1.777,.021],[x+.017,1.772,-.043]],.011,
          i%2?"#c8c8ba":"#d8d3bd");
      }
      for(const k of [-1,1])g.tri([k*.081,1.674,.074],[k*.105,1.680,.035],[k*.098,1.611,.039],p.edge);
    }else if(crop){
      for(const k of [-1,1])g.box(k*.098,1.650,.017,.018,.062,.053,p.hair);
      g.quad([-.054,1.600,.104],[.050,1.600,.104],[.030,1.588,.106],[-.032,1.588,.106],p.hair);
      line(g,[[-.068,1.743,.072],[-.036,1.764,.049],[.016,1.776,-.013],[.052,1.756,-.066]],.006,p.edge);
    }else if(knot){
      g.cyl(.006,1.651,-.118,.060,.055,.087,8,p.hair);
      g.cyl(.006,1.632,-.133,.055,.049,.028,8,id==="tess"?p.trim:"#b68373");
      g.cyl(.003,1.607,-.137,.048,.028,.037,7,p.hair);
    }
  }
  function valetCap(g,p){
    const band=hairRing(1.709,.113,.101,.101),top=hairRing(1.756,.119,.11,.104);
    rim(g,band,top,"#355b59","#476c65");
    const fold=hairRing(1.796,.099,.093,.092,-.012,-.012);
    rim(g,top,fold,"#cfccb1","#aab8a0");
    for(let i=0;i<fold.length;i++)g.tri(fold[i],fold[(i+1)%8],[.032,1.813,-.013],"#d9d3b9");
    g.quad([-.095,1.732,.079],[.094,1.732,.079],[.074,1.716,.168],[-.064,1.717,.167],"#506b60");
    stitch(g,-.065,1.728,.069,1.730,.007,p.trim,.110);
    g.tri([-.017,1.744,.114],[.018,1.740,.114],[.008,1.753,.114],p.trim);
  }
  function driverWear(g,id,p,mark){
    mark("head");hairstyle(g,id,p);
    if(id==="ruth"||id==="des")glasses(g,id==="des");
    if(id==="tess")valetCap(g,p);
    if(id==="road1"){
      const brim=hairRing(1.716,.119,.135,.1),band=hairRing(1.747,.108,.108,.099),top=hairRing(1.788,.087,.070,.08);
      rim(g,brim,band,p.edge,p.hair);rim(g,band,top,p.edge,p.edge);
      for(let i=0;i<8;i++)g.tri(top[i],top[(i+1)%8],[0,1.805,-.008],p.edge);
    }
    mark("body");
    if(id==="ruth"){
      lapels(g,p,1.305,"#486079");
      for(const k of [-1,1])patchPocket(g,k*.092,1.115,.10,.105,"#4c5e70","#83908c");
      patchPocket(g,-.101,1.310,.074,.090,"#4b5f75","#8c8e83");
      // A yellow cloth tape hangs over one shoulder, with inch ticks woven into the fold.
      const seam=[[.074,1.406,.129],[.116,1.364,.136],[.093,1.294,.136],[.082,1.181,.132]];
      for(let i=1;i<seam.length;i++)stitch(g,seam[i-1][0],seam[i-1][1],seam[i][0],seam[i][1],.019,"#c9a66a",.134);
      for(let i=0;i<6;i++)stitch(g,.082+i*.0017,1.191+.017*i,.089+i*.0017,1.192+.017*i,.003,"#70634f",.136);
      stitch(g,-.124,1.322,.127,1.322,.006,"#536a7b",-.117);
      for(const k of [-1,1]){
        mark("arm",k);
        g.pole([k*.237,1.280,0],[k*.248,1.174,.004],.069,p.shirt,8);
        g.pole([k*.248,1.171,.004],[k*.243,1.102,.023],.063,"#53637a",8);
        g.pole([k*.244,1.119,.020],[k*.243,1.098,.024],.064,"#6b7788",8);
      }
    }else if(id==="des"){
      lapels(g,p,1.318,"#99a184");patchPocket(g,-.096,1.304,.087,.085,"#8a9172","#b6b390");
      // A bandleader's double bar and three notes stitched on the chest pocket.
      for(const x of [-.120,-.103,-.086]){
        stitch(g,x,1.254,x,1.280,.0039,"#e6d5a2",.135);
        stitch(g,x,1.254,x-.009,1.250,.0056,"#e6d5a2",.135);
      }
      stitch(g,-.12,1.279,-.086,1.290,.004,"#e6d5a2",.135);
      for(const y of [1.280,1.295])stitch(g,.05,y,.130,y+.010,.004,"#869177",.126);
      mark("arm",-1);g.cyl(-.240,1.052,.030,.048,.047,.023,8,"#8e6349");
      g.box(-.274,1.052,.054,.023,.035,.030,brass);
    }else if(id==="viv"){
      lapels(g,p,1.315,"#d78c74");patchPocket(g,-.098,1.306,.087,.088,"#af6a5d","#e2ac88");
      patchPocket(g,.091,1.300,.077,.066,"#b76d5e","#e3ab89");
      for(const k of [-1,1])stitch(g,k*.067,1.388,k*.023,1.268,.005,"#747d77",.134);
      cloth(g,[[-.022,1.265],[.006,1.271],[.025,1.252],[.004,1.227],[-.018,1.233]],"#aeb3a1",.136);
      for(const k of [-1,1]){
        mark("arm",k);g.cyl(k*.238,1.266,-.001,.077,.073,.037,8,"#dd9275");
        if(k<0){g.cyl(-.240,1.056,.029,.049,.048,.037,8,"#394b4a");
          g.box(-.275,1.056,.052,.028,.036,.034,"#86998a");}
      }
    }else if(id==="tess"){
      lapels(g,p,1.340,"#e0d2ae");
      for(const k of [-1,1]){
        stitch(g,k*.085,1.412,k*.159,1.397,.022,"#385e5b",.127);
        stitch(g,k*.091,1.413,k*.143,1.402,.005,p.trim,.129);
      }
      cloth(g,[[-.138,1.318],[-.066,1.318],[-.066,1.287],[-.138,1.287]],p.trim,.132);
      stitch(g,-.124,1.303,-.078,1.303,.004,"#5b6b61",.135);
      stitch(g,-.104,1.000,.112,.999,.023,"#43605b",.122);
      // A marlin in two strokes on the back yoke of the lodge uniform.
      stitch(g,-.095,1.339,.084,1.368,.009,p.trim,-.119);
      cloth(g,[[-.079,1.340],[-.115,1.322],[-.110,1.358]],p.trim,-.120);
      cloth(g,[[-.04,1.349],[.067,1.371],[.014,1.340]],p.trim,-.121);
      for(const k of [-1,1]){mark("arm",k);g.cyl(k*.237,1.278,0,.077,.074,.018,8,p.trim);}
    }else{
      if(id==="road0"||id==="road3")lapels(g,p,1.355,p.edge);
      if(id==="road1")for(const y of [1.210,1.249,1.287])stitch(g,-.128,y,.129,y,.012,p.trim,.125);
      if(id==="road2"){
        stitch(g,-.107,1.407,-.117,1.231,.022,p.edge,.126);
        stitch(g,.107,1.407,.117,1.231,.022,p.edge,.126);
        cloth(g,[[-.126,1.248],[.129,1.248],[.123,.983],[-.117,.983]],"#6b7368");
      }
    }
  }
  function dress(rig,id){
    const p=people[id];if(!rig||!p||rig.motoristId===id)return;
    const g=new BayMesh(),groups=[],first=rig.rest.length;
    driverWear(g,id,p,(part,side)=>groups.push({part,side,start:g.vertices.length/6}));
    const next=new Float32Array(first+g.vertices.length);
    next.set(rig.rest);next.set(g.vertices,first);
    for(let n=0;n<groups.length;n++){
      const a=groups[n],end=groups[n+1]?.start??g.vertices.length/6,limb=rig.sides[a.side===1?1:0];
      for(let k=a.start;k<end;k++)rig.bindings.push(rig.binding(a.part,limb,g.vertices[k*6+1]));
    }
    rig.rest=next;rig.vertices=next.slice();rig.lastRevision=-1;rig.motoristId=id;
  }

  // Use a detached door record. An occupied car can open its other door for a second actor.
  const cabinCars=new WeakMap();
  function seated(actor,vehicle,ground,dt=0){
    if(!vehicle||!actor?.motion)return;
    let v=cabinCars.get(actor);if(!v){v={};cabinCars.set(actor,v);}
    v.x=vehicle.x;v.z=vehicle.z;v.yaw=vehicle.yaw;v.kind=vehicle.kind;v.steer=vehicle.steer||0;v.source=vehicle;
    const floor=typeof ground==="function"?ground:()=>ground||0;
    BayCarAccess.pose(v,actor.side===1?1:-1,1,actor,actor.motion,floor,dt);
  }

  const toeIn=new Set(["in","out","arrive","drive"]);
  const states=new WeakMap(),bodyRigs=new WeakMap(),mapRigs=new WeakMap();
  function palm(rig,k){return rig.sides[k<0?0:1].forearm.map([k*.238,.977,.052],[]);}
  function localToWorld(a,p){const yaw=a.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
    return [a.x+p[0]*c+p[2]*s,(a.y||0)+p[1],a.z-p[0]*s+p[2]*c];}
  function hand(a,side=1){
    const r=bodyRigs.get(a)||mapRigs.get(a.motion)||a.mesh;
    if(!r)return null;const p=localToWorld(a,palm(r,side));return {x:p[0],y:p[1],z:p[2]};
  }
  function solve(limb,target,amount){
    if(amount<=0)return;
    const a=limb.shoulder,k=limb.elbow,b=limb.hand,rest=limb.forearm.map(limb.handPivot,b);
    const goal=between(rest,target,amount),dx=goal[0]-a[0],dy=goal[1]-a[1],dz=goal[2]-a[2],n=Math.hypot(dx,dy,dz)||.001;
    const ux=dx/n,uy=dy/n,uz=dz/n,l=limb.arm.length,r=limb.forearm.length,d=Math.max(.057,Math.min(l+r-.001,n));
    b[0]=a[0]+d*ux;b[1]=a[1]+d*uy;b[2]=a[2]+d*uz;
    const m=(l*l-r*r+d*d)/(2*d),bend=Math.sqrt(Math.max(0,l*l-m*m));
    const px=limb.side*.67,py=-.71,pz=-.42,dot=px*ux+py*uy+pz*uz;
    const vx=px-dot*ux,vy=py-dot*uy,vz=pz-dot*uz,f=bend/Math.max(.001,Math.hypot(vx,vy,vz));
    k[0]=a[0]+m*ux+f*vx;k[1]=a[1]+m*uy+f*vy;k[2]=a[2]+m*uz+f*vz;
    limb.arm.aim(a,k);limb.forearm.aim(k,b);
  }
  function look(rig,pitch,yaw,roll){
    const at=rig.head.map(rig.head.pivot,[]),m=rig.head.m;
    const basePitch=Math.atan2(-m[6],m[5]),baseYaw=Math.atan2(-m[8],m[0]),baseRoll=Math.asin(Math.max(-1,Math.min(1,m[4])));
    rig.head.place(at,basePitch+pitch,baseYaw+yaw,baseRoll+roll);
  }
  function remember(rig,frame){
    const p=rig.pivot;rig.chest.map(rig.chest.pivot,p);frame.set(p,0);
    for(const [i,bone] of [[3,rig.chest],[6,rig.head]]){
      const m=bone.m;frame[i]=Math.atan2(-m[6],m[5]);frame[i+1]=Math.atan2(-m[8],m[0]);
      frame[i+2]=Math.asin(Math.max(-1,Math.min(1,m[4])));
    }
    for(let i=0;i<2;i++){const l=rig.sides[i];frame.set(l.forearm.map(l.handPivot,p),9+i*3);}
  }
  function easePosture(rig,old,now,f){
    for(let n=0;n<now.length;n++)now[n]=mix(old[n],now[n],f);
    const p=rig.pivot;p[0]=now[0];p[1]=now[1];p[2]=now[2];
    rig.chest.place(p,now[3],now[4],now[5]);rig.chest.map(rig.head.pivot,p);
    rig.head.place(p,now[6],now[7],now[8]);
    for(let i=0;i<2;i++){
      const limb=rig.sides[i];rig.chest.map(limb.arm.pivot,limb.shoulder);
      const off=9+3*i;p[0]=now[off];p[1]=now[off+1];p[2]=now[off+2];solve(limb,p,1);
    }
  }
  function gestures(rig,a,t){
    const phase=a.phase,age=a.age||0,enter=smooth(0,.32,age),id=a.id;
    if(toeIn.has(phase)||a.motion.ride)return false;
    const right=rig.sides[1],left=rig.sides[0],beat=t*.92+(id==="viv"?2.72:id==="tess"?1.72:id==="ruth"?.58:0);
    if(phase==="give"||phase==="receive"){
      const u=Math.max(0,Math.min(1,a.exchange||0)),reach=smooth(0,.37,u)*(1-smooth(.64,1,u)),e=smooth(0,.25,u)*(1-smooth(.80,1,u));
      const slips=phase==="give"?1:-1;
      solve(right,[.138,1.247+.011*slips,.403],reach);
      solve(left,[-.160,1.230-.011*slips,.364],reach);
      look(rig,.165*e,.062*Math.sin(u*Math.PI*2)*e,0);
      return e>0;
    }
    if(phase==="phone"){
      const lift=smooth(0,.57,age);
      solve(right,[.174,1.534,.036],lift);
      solve(left,[-.160,1.125,.133],lift*(.60+.15*Math.cos(beat*1.1)));
      look(rig,.066*lift,.045*Math.sin(beat*1.35)*lift,-.095*lift);
    }else if(phase==="inspect"){
      const crouch=enter*(.82+.15*Math.sin(beat));
      rig.pelvis.map(rig.chest.pivot,rig.pivot);
      rig.chest.place(rig.pivot,.40*crouch,.15*crouch,-.055*crouch);
      rig.chest.map(rig.head.pivot,rig.pivot);rig.head.place(rig.pivot,.53*crouch,.14*crouch,-.05*crouch);
      for(const l of rig.sides)rig.chest.map(l.arm.pivot,l.shoulder);
      solve(right,[.207,1.046,.308+.061*Math.sin(beat*1.7)],enter);solve(left,[-.198,1.075,.108],enter);
    }else if(phase==="upset"){
      const lift=.5+.5*Math.sin(beat*3.35),breadth=.5+.5*Math.cos(beat*3.35);
      solve(right,[.342,1.284+.094*lift,.207+.068*breadth],enter);
      solve(left,[-.343,1.268+.047*breadth,.149+.047*lift],.84*enter);
      look(rig,-.04*enter,.115*Math.sin(beat*2.55)*enter,-.021*enter);
    }else if(phase==="curb"||phase==="ask"||phase==="watch"){
      const cycle=(age+(phase==="watch"?1.95:0))%(phase==="watch"?8.1:5.4);
      const wave=smooth(.10,.55,cycle)*(1-smooth(1.32,1.85,cycle));
      const target=phase==="ask"?[.290,1.349+.035*Math.sin(beat*3.8),.274]:
        [.329+.041*Math.sin(cycle*10.6),1.612+.033*Math.cos(cycle*10.6),.138];
      solve(right,target,wave);look(rig,.024*enter,.10*Math.sin(beat+.35)*enter,.025*wave);
    }else if(phase==="wait"||phase==="visit"){
      const cycle=(age+(id==="des"?2.1:id==="viv"?3.3:0))%7.8,glance=smooth(1.4,2.0,cycle)*(1-smooth(3.2,3.8,cycle));
      if(id==="des"||id==="viv")solve(left,[-.094,1.211,.188],glance*.88*enter);
      if(id==="ruth")solve(left,[-.101,1.333,.146],glance*.81*enter);
      look(rig,(.026+.18*glance)*enter,.16*Math.sin(beat*.68)*enter,-.035*glance);
    }else return false;
    return enter>0;
  }
  function animate(r,a,t){
    const m=a.motion;if(!m)return false;
    let was=states.get(r);
    if(was&&was.motion!==m){r.lastRevision=-1;r.update(m);}
    if(was?.revision===m.revision&&was.motion===m){
      if(was.phase===a.phase&&was.age===a.age&&was.exchange===a.exchange&&was.t===t)return false;
      if(was.layered){r.lastRevision=-1;r.update(m);}
    }
    if(!was){was={last:new Float32Array(15),from:new Float32Array(15)};states.set(r,was);}
    if(was.phase!==a.phase){
      was.blending=was.motion===m&&was.layered&&!m.ride&&!toeIn.has(a.phase);
      if(was.blending)was.from.set(was.last);
    }
    let layered=gestures(r,a,t);
    if(was.blending){
      const f=smooth(0,.28,a.age||0);
      if(f<1&&!m.ride){remember(r,was.last);easePosture(r,was.from,was.last,f);layered=true;}
      else was.blending=false;
    }
    if(layered)r.skin();
    if(layered)remember(r,was.last);
    const changed=layered||!!was.layered;
    Object.assign(was,{motion:m,revision:m.revision,phase:a.phase,age:a.age,exchange:a.exchange,t,layered});
    return changed;
  }
  function pose(rig,actor,t=0){
    if(!rig||!actor)return false;
    bodyRigs.set(actor,rig);return animate(rig,actor,t);
  }

  function fob(g,id){
    const k=people[id],ring=[];
    for(let n=0;n<=12;n++){let a=n*tau/12;ring.push([.019*Math.sin(a),-.017+.019*Math.cos(a),0]);}
    line(g,ring,.0028,brass);
    const poly=[[.012,-.028],[.032,-.035],[.054,-.089],[.042,-.119],[.014,-.130],[-.006,-.103],[-.009,-.055]];
    function tag(z){
      const at=q=>[q[0],q[1],z];for(let i=2;i<poly.length;i++)g.tri(at(poly[0]),at(poly[i-1]),at(poly[i]),k.tag);
      for(let i=0;i<poly.length;i++){const j=(i+1)%poly.length;g.quad(at(poly[i]),at(poly[j]),[...poly[j],0],[...poly[i],0],k.edge);}
      // Debossed Marlin M in the familiar long diamond fob.
      for(const [x,y,X,Y] of [[.005,-.096,.002,-.066],[.002,-.066,.018,-.083],[.018,-.083,.026,-.067],[.026,-.067,.036,-.096]])
        stitch(g,x,y,X,Y,.0042,ink,z*1.09);
    }
    tag(.004);tag(-.004);
    const key=[[-.008,-.020],[-.021,-.028],[-.031,-.052],[-.050,-.075],[-.046,-.079],[-.038,-.078],[-.035,-.069],[-.029,-.069],[-.027,-.062],[-.019,-.063],[-.011,-.050],[-.001,-.044]];
    cloth(g,key,"#ddd3ae",-.006);cloth(g,key,brass,-.008);
    oval(g,[-.010,-.026,-.007],[-.022,-.038,-.007],.006,"#927d58");
  }
  function claimStub(g,id){
    const tag=people[id]?.tag||"#bc9e72";
    const shape=[[-.009,.011],[.083,.026],[.090,.012],[.084,.007],[.091,.001],[.086,-.005],[.094,-.011],
      [.087,-.020],[.094,-.026],[.001,-.042]];
    cloth(g,shape,paper,.002);cloth(g,shape,"#d1c39e",-.002);
    for(const z of [-.003,.003]){
      stitch(g,.009,.006,.078,.018,.005,tag,z);
      stitch(g,.028,-.024,.073,-.016,.0025,ink,z);
      stitch(g,.025,-.016,.058,-.010,.0025,ink,z);
      for(let n=0;n<4;n++)stitch(g,.067+n*.0015,-.020+n*.008,.0675+n*.0015,-.016+n*.008,.002,tag,z);
    }
  }
  function handset(g){
    g.box(-.024,.050,-.015,.016,.150,.075,"#323f44");
    g.box(-.033,.048,-.015,.004,.130,.063,"#809993");
    g.box(-.015,.101,.004,.007,.033,.024,"#687b76");
    g.box(-.010,.106,.003,.004,.013,.013,"#263336");
    g.box(-.010,.093,.003,.004,.010,.010,"#29373b");
    g.box(-.036,.115,-.015,.003,.003,.020,"#3e5453");
  }
  const guests=["ruth","des","viv"];
  function install(model){
    for(const id of guests){model("marlin-fob-"+id,g=>fob(g,id));model("marlin-stub-"+id,g=>claimStub(g,id));}
    model("marlin-motorist-phone",handset);
  }
  function propSet(a){
    if(a.motion?.ride)return [];
    if(a.phase==="phone")return [[1,"marlin-motorist-phone"]];
    if(!guests.includes(a.id))return [];
    const key="marlin-fob-"+a.id,stub="marlin-stub-"+a.id,before=(a.exchange||0)<.5;
    if(a.phase==="give")return before?[[1,key]]:[[-1,stub]];
    if(a.phase==="receive")return before?[[-1,stub]]:[[1,key]];
    if(a.phase==="curb"||a.phase==="return"||a.phase==="walk"&&a.destination==="arrive")return [[1,key]];
    if(a.phase==="ask"||a.phase==="wait"||a.phase==="visit"||a.phase==="walk"&&["visit","claim"].includes(a.destination))return [[-1,stub]];
    return [];
  }
  function held(a,rig,t,props){
    return props.map(([k,name])=>{
      const p=palm(rig,k),cell=name.endsWith("phone"),stub=name.includes("stub");
      const phase=(a.motion?.phase||0)*tau,weight=a.motion?.weight||0;
      const sw=weight*.22*Math.sin(phase)+.067*Math.sin(t*2.7);
      return {k,name,p,yaw:(a.yaw||0)+(cell?.14:stub?(k<0?Math.PI-.24:.24):.08),pitch:cell?.03:stub?.61:sw,roll:cell?-.11:stub?.19*k:-.08+sw};
    });
  }
  function worldProps(list,actor,t=0){
    const r=bodyRigs.get(actor)||actor?.mesh;if(!r)return;
    addHeld(list,actor,r,t,propSet(actor));
  }
  function addHeld(list,actor,rig,t,props){
    for(const h of held(actor,rig,t,props)){
      const p=localToWorld(actor,h.p);
      list.push([h.name,p[0],p[1],p[2],h.yaw,h.pitch,h.roll]);
    }
  }
  function skeleton(a,t){
    if(!a.motion)return null;
    const full=bodyRigs.get(a),at=full&&states.get(full);
    if(at&&at.motion===a.motion&&at.revision===a.motion.revision&&at.phase===a.phase&&at.age===a.age&&at.t===t&&at.exchange===a.exchange)return full;
    let rig=mapRigs.get(a.motion);
    if(!rig){
      rig=new BayPlayerMesh(colors[a.id]||colors.road0,"local");
      // Canvas uses the animated joints; it never skins or retains the clothing triangles.
      rig.bindings.length=0;rig.vertices=rig.rest=new Float32Array(0);mapRigs.set(a.motion,rig);
    }
    rig.update(a.motion);animate(rig,a,t);return rig;
  }
  const partners=new WeakMap(),partnerFrames=new WeakMap();
  function partnerPose(rig,hero,guest,t=0){
    if(!rig||!hero||!guest||guest.phase!=="give"&&guest.phase!=="receive")return false;
    const peer=skeleton(guest,t);if(!peer)return false;
    const u=guest.exchange||0,reach=smooth(0,.37,u)*(1-smooth(.64,1,u));
    partners.set(hero,rig);
    let frame=partnerFrames.get(rig);
    if(!frame){frame={base:new Float32Array(60),bones:[rig.head,...rig.sides.flatMap(l=>[l.arm,l.forearm])]};partnerFrames.set(rig,frame);}
    if(frame.revision===rig.lastRevision){
      if(frame.time===t&&frame.guest===guest&&frame.u===u)return false;
      for(let i=0;i<5;i++)frame.bones[i].m.set(frame.base.subarray(i*12,i*12+12));
    }else{
      for(let i=0;i<5;i++)frame.base.set(frame.bones[i].m,i*12);
    }
    frame.revision=rig.lastRevision;frame.time=t;frame.guest=guest;frame.u=u;
    if(reach<=0)return false;
    const cy=Math.cos(hero.yaw||0),sn=Math.sin(hero.yaw||0),ground=Number.isFinite(hero.y)?hero.y:guest.y||0;
    for(const side of [-1,1]){
      const other=localToWorld(guest,palm(peer,-side)),X=other[0]-hero.x,Z=other[2]-hero.z;
      const target=[X*cy-Z*sn,other[1]-ground,X*sn+Z*cy];
      const l=rig.sides[side<0?0:1],start=palm(rig,side),want=between(start,target,reach);
      const wrist=l.forearm.map(l.handPivot,[]);
      // The two bone passes align the pad of the fingers, including its offset from the wrist.
      for(let i=0;i<2;i++){
        const tip=palm(rig,side),wristNow=l.forearm.map(l.handPivot,[]);
        for(let j=0;j<3;j++)wrist[j]=want[j]-(tip[j]-wristNow[j]);
        solve(l,wrist,1);
      }
    }
    look(rig,.11*reach,0,0);rig.skin();return true;
  }
  function partnerProps(list,hero,guest,t=0){
    if(!guest||!guests.includes(guest.id)||guest.phase!=="give"&&guest.phase!=="receive")return;
    const rig=partners.get(hero);if(!rig)return;
    addHeld(list,hero,rig,t,partnerItems(guest));
  }
  function partnerItems(guest){
    const before=(guest.exchange||0)<.5,hasKey=guest.phase==="give"?!before:before;
    return hasKey?[[-1,"marlin-fob-"+guest.id]]:[[1,"marlin-stub-"+guest.id]];
  }
  function mapCabin(c,a,vehicle,s){
    const v=vehicle,van=v.kind==="van",front=van?-1.59:-1.10,b=van?.97:.91;
    const d=people[a.id],seat=bayCarLayout(v.kind),x=-seat.seatX,glass=front+.45,steer=a.motion?.ride?.steer||0;
    c.save();c.translate(v.x-a.x,a.z-v.z);c.rotate(v.yaw||0);
    c.beginPath();c.moveTo(-b+.14,front);c.lineTo(b-.14,front);c.lineTo(b-.24,front+.51);c.lineTo(-b+.24,front+.51);c.closePath();c.clip();
    const ellipse=(x,y,w,h,col)=>{c.beginPath();c.ellipse(x,y,w,h,0,0,tau);c.fillStyle=col;c.fill();};
    ellipse(x,glass+.04,.208,.110,d.shirt);ellipse(x,glass+.075,.109,.123,d.hair);
    ellipse(x,glass+.024,.089,.089,d.skin);ellipse(x,glass+.065,.101,.105,a.id==="tess"?"#c7c7ad":d.hair);
    c.strokeStyle="#425657";c.lineWidth=.029;c.beginPath();c.ellipse(x,glass-.10,.150,.058,steer*.23,0,tau);c.stroke();
    for(const k of [-1,1])ellipse(x+k*.119,glass-.099+k*.038*Math.sin(steer),.031,.029,d.skin);
    c.fillStyle="rgba(99,144,148,.23)";c.fillRect(-b,front,2*b,.51);
    c.restore();
  }
  function maskCar(c,a,v){
    const first=c.getTransform();
    c.translate(v.x-a.x,a.z-v.z);c.rotate(v.yaw||0);
    c.beginPath();c.rect(-20,-20,40,40);
    // The roof and body hide the portion of a boarding actor already in the cabin.
    const s=bayCarLayout(v.kind),b=s.track*.93,front=v.kind==="van"?1.59:1.10;
    c.moveTo(-b,-front);c.lineTo(b,-front);c.lineTo(b,s.halfLength-.17);c.lineTo(-b,s.halfLength-.17);c.closePath();
    c.clip("evenodd");c.setTransform(first);
  }
  const jerseyPrints=new Map();
  function jerseyPrint(id){
    if(jerseyPrints.has(id))return jerseyPrints.get(id);
    const kit=BayCourtPlayers.kits[id],rig=new BayPlayerMesh(["#af7353","#398e86","#556d80"],"driver");
    BayCourtPlayers.kit(rig,id);
    const dyes=new Set([kit.trim,kit.ink,kit.pale,kit.side].map(color=>parseInt(color.slice(1),16)));
    const result={},src=rig.rest,w=176,h=232;
    for(const side of [-1,1]){
      const stamp=document.createElement("canvas");stamp.width=w;stamp.height=h;
      const c=stamp.getContext("2d");
      for(let i=0;i<src.length;i+=18){
        const z=src[i+2]*side;
        if(z<.119||z>.133||src[i+1]<.95||src[i+1]>1.42)continue;
        const color=(Math.round(src[i+3]*255)<<16)|(Math.round(src[i+4]*255)<<8)|Math.round(src[i+5]*255);
        if(!dyes.has(color)||src[i+8]*side<.116||src[i+14]*side<.116)continue;
        c.fillStyle="#"+color.toString(16).padStart(6,"0");c.beginPath();
        c.moveTo(w*(.5-side*src[i]/.33),h*(1.429-src[i+1])/.476);
        c.lineTo(w*(.5-side*src[i+6]/.33),h*(1.429-src[i+7])/.476);
        c.lineTo(w*(.5-side*src[i+12]/.33),h*(1.429-src[i+13])/.476);c.closePath();c.fill();
      }
      result[side]=stamp;
    }
    jerseyPrints.set(id,result);return result;
  }
  const player={skin:"#af7353",shirt:"#398e86",pants:"#556d80",hair:"#302e37",edge:"#51414a",trim:"#a4b698"};
  function mapActor(c,a,x,y,s,t=0,partner=null){
    if(!a||!(s>0))return;
    const exchange=partner&&(partner.phase==="give"||partner.phase==="receive");
    let p=people[a.id];
    if(!p){
      if(!exchange)return;
      const kit=window.BayCourtPlayers?.kits[a.kit];
      p=kit?{...player,shirt:kit.body,pants:kit.short,trim:kit.trim,kit}:player;
    }
    const seated=a.motion?.ride?.seat||0,car=[a.vehicle,a.v,a.car,a.ride,cabinCars.get(a)?.source].find(v=>v?.kind);
    c.save();c.translate(x,y);c.scale(s,s);
    if(seated>=.93){
      if(car){c.globalAlpha*=smooth(.93,.99,seated);mapCabin(c,a,car,s);}
      c.restore();return;
    }
    if(seated>.82)c.globalAlpha*=1-smooth(.82,.93,seated);
    const rig=skeleton(a,t);if(!rig){c.restore();return;}
    if(exchange)partnerPose(rig,a,partner,t);
    if(a.motion.ride&&car)maskCar(c,a,car);
    const yaw=a.yaw||0,cy=Math.cos(yaw),sn=Math.sin(yaw),id=a.id;
    const P=q=>[q[0]*cy+q[2]*sn+.22*q[1],q[0]*sn-q[2]*cy-.27*q[1]];
    const depth=q=>q[1]-.22*(q[0]*cy+q[2]*sn)-.27*(-q[0]*sn+q[2]*cy);
    const ellipse=(q,rx,ry,col,angle=0)=>{
      const pt=P(q);c.beginPath();c.ellipse(pt[0],pt[1],rx,ry,angle,0,tau);c.fillStyle=col;c.fill();
    };
    const path=(qs,col,w)=>{
      const v=P(qs[0]);c.beginPath();c.moveTo(...v);for(let i=1;i<qs.length;i++)c.lineTo(...P(qs[i]));
      if(w){c.lineWidth=w;c.strokeStyle=col;c.stroke();}else{c.closePath();c.fillStyle=col;c.fill();}
    };
    const on=(bone,x,y,z)=>bone.map([x,y,z],[]);
    const chest=(x,y,z)=>on(rig.chest,x,y,z),head=(x,y,z)=>on(rig.head,x,y,z);
    const items=held(a,rig,t,exchange?partnerItems(partner):propSet(a));
    function drawItem(h){
      const turn=h.yaw-yaw,co=Math.cos(turn),si=Math.sin(turn),cp=Math.cos(h.pitch),sp=Math.sin(h.pitch),cr=Math.cos(h.roll),sr=Math.sin(h.roll);
      const at=(dx,dy,dz)=>{
        const up=dy*cp-dz*sp,Z=dy*sp+dz*cp,X=dx*cr-up*sr,Y=dx*sr+up*cr;
        return shift(h.p,X*co+Z*si,Y,-X*si+Z*co);
      };
      const tag=exchange?people[partner.id].tag:p.tag||p.trim;
      if(h.name.endsWith("phone")){
        path([at(-.024,-.025,-.052),at(-.024,-.025,.023),at(-.024,.125,.023),at(-.024,.125,-.052)],ink);
        path([at(-.014,.108,.008),at(-.014,.108,-.009)],"#8eac9d",.010);
      }else if(h.name.includes("fob")){
        path([at(0,0,0),at(.002,-.024,0),at(.014,-.033,.002)],brass,.008);
        path([at(.012,-.029,.004),at(.052,-.083,.004),at(.032,-.124,.004),at(-.008,-.080,.004)],tag);
        path([at(-.014,-.029,-.006),at(-.048,-.072,-.006)],"#ccb98e",.012);
      }else{
        path([at(-.010,.011,0),at(.084,.024,.002),at(.094,-.028,.002),at(.001,-.039,0)],paper);
        path([at(.012,.004,.006),at(.078,.014,.006)],tag,.006);
      }
    }
    const parts=[];
    const draw=(point,fn)=>parts.push([depth(point),fn]);c.lineCap="round";c.lineJoin="round";
    ellipse([-.07,.006,-.07],.219,.145,"rgba(47,54,53,.23)",-.27-yaw);
    for(const l of rig.sides){
      const k=l.side,shoe=(dx,y,z)=>on(l.shoe,k*.111+dx,y,z),f=palm(rig,k);
      const toe=shoe(.008*k,.055,.128),heel=shoe(0,.066,-.06);
      draw(l.knee,()=>{
        path([heel,toe],"#565751",.127);path([heel,toe],id==="ruth"||id==="tess"?"#766553":"#a99679",.102);
        if(p.kit){
          path([l.hip,l.knee,l.ankle],p.skin,.114);path([l.hip,between(l.hip,l.knee,.51)],p.pants,.173);
          path([l.ankle,between(l.ankle,l.knee,.39)],p.kit.pale,.106);
        }else{path([l.hip,l.knee],p.pants,.160);path([l.knee,l.ankle],p.pants,.118);}
      });
      draw(between(l.shoulder,f,.58),()=>{
        path([l.shoulder,l.elbow],p.skin,.107);path([l.elbow,f],p.skin,.086);
        if(!p.kit)path([l.shoulder,between(l.shoulder,l.elbow,id==="ruth"?1:.65)],p.shirt,.142);
        if(id==="ruth")path([l.elbow,between(l.elbow,f,.38)],"#596982",.108);
        if(id==="tess"||id==="viv")path([between(l.shoulder,l.elbow,.58),between(l.shoulder,l.elbow,.67)],p.trim,.139);
        ellipse(f,.044,.039,p.skin,-yaw);
        if(k<0&&id==="viv")path([between(l.elbow,f,.70),between(l.elbow,f,.81)],ink,.085);
        for(const item of items)if(item.k===k)drawItem(item);
      });
    }
    draw(chest(0,1.250,-.005),()=>{
      const torso=(y,w,h)=>[chest(-w,y,.25*h),chest(-w*.72,y,h),chest(w*.72,y,h),
        chest(w,y,.25*h),chest(w,y,-.62*h),chest(w*.60,y,-h),chest(-w*.64,y,-h),chest(-w,y,-.62*h)];
      const low=torso(1.002,.163,.103),top=torso(1.411,p.kit ? .184 : .216,.112);
      for(let n=0;n<8;n++)if(depth(between(top[n],top[(n+1)%8],.5))>depth(chest(0,1.40,0)))
        path([low[n],low[(n+1)%8],top[(n+1)%8],top[n]],p.shirt);
      path(top,p.shirt);
      if(p.kit){
        const side=depth(chest(0,1.21,.124))>depth(chest(0,1.21,-.122))?1:-1;
        const bake=jerseyPrint(a.kit)[side],O=P(chest(side*.165,1.429,side*.123)),U=P(chest(-side*.165,1.429,side*.123)),V=P(chest(side*.165,.953,side*.114));
        c.save();c.transform((U[0]-O[0])/bake.width,(U[1]-O[1])/bake.width,(V[0]-O[0])/bake.height,(V[1]-O[1])/bake.height,O[0],O[1]);
        c.drawImage(bake,0,0);c.restore();
        for(const k of [-1,1]){
          path([chest(k*.136,1.419,-.070),chest(k*.137,1.427,.014),chest(k*.139,1.417,.075)],p.trim,.014);
          path([chest(k*.076,1.420,-.059),chest(k*.07,1.420,.064),chest(k*.017,1.353,.118)],p.trim,.014);
        }
        return;
      }
      for(const k of [-1,1]){
        const col=id==="tess"?p.trim:id==="ruth"?"#657284":p.trim;
        path([chest(k*.066,1.429,-.01),chest(k*.119,1.408,.061),chest(k*.049,1.355,.115)],col,id==="tess"?.034:.016);
      }
      if(id==="ruth")path([chest(.071,1.431,-.026),chest(.099,1.407,.066),chest(.091,1.252,.118)],"#d8ab61",.019);
      if(id==="tess")path([chest(-.119,1.321,.128),chest(-.064,1.321,.128)],p.trim,.015);
    });
    draw(head(0,1.695,0),()=>{
      ellipse(head(0,1.597,.010),.104,.098,p.skin,yaw);
      for(const k of [-1,1])ellipse(head(k*.098,1.627,.023),.021,.019,p.skin);
      ellipse(head(0,1.642,.066),.071,.061,p.skin,yaw);
      if(id==="ruth")ellipse(head(0,1.680,-.022),.120,.116,p.hair,yaw);
      if(id==="tess"||id==="road3")ellipse(head(0,1.667,-.109),.062,.059,p.hair);
      ellipse(head(0,1.740,-.017),id==="ruth"?.116:.106,.105,p.hair,yaw);
      if(id==="ruth"||id==="des")
        path([head(-.081,1.662,.078),head(-.044,1.672,.110),head(.008,1.670,.113),head(.076,1.670,.087)],ink,.010);
      if(id==="tess"||id==="road1"){
        ellipse(head(0,1.737,.085),.096,.068,id==="tess"?"#5c7569":p.edge,yaw);
        ellipse(head(0,1.781,-.005),.116,.105,id==="tess"?"#d4ceb3":p.edge,yaw);
        if(id==="tess")path([head(-.063,1.779,-.064),head(.039,1.801,-.022),head(.084,1.770,.046)],"#a8b6a0",.010);
      }else if(id==="viv"||id==="ruth"||id==="des"){
        for(const k of (id==="viv"?[-.057,-.012,.035]:[-.024]))
          path([head(k,1.729,.058),head(k-.013,1.755,.041),head(k+.014,1.772,-.006),head(k+.031,1.744,-.059)],
            id==="viv"?"#d9d5c3":id==="ruth"?"#514953":"#594b43",id==="viv"?.014:.009);
      }
    });
    parts.sort((a,b)=>a[0]-b[0]);for(const [,paint] of parts)paint();c.restore();
  }
  window.BayMotorists={colors,roles,dress,pose,seated,worldProps,mapActor,install,hand,partnerPose,partnerProps};
})();
