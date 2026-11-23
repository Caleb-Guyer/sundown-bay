/* Three bicycles from the promenade racks. The fork, pedals and rider use the same contact points. */
(() => {
  "use strict";
  const tau=Math.PI*2,clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)),mix=(a,b,f)=>a+(b-a)*f;
  const smooth=(a,b,t)=>{const u=clamp((t-a)/(b-a));return u*u*(3-2*u);};
  const paint={marlin:"#b86451",north:"#50978c",javi:"#497784"};
  const colors={javi:["#a67153","#d4a05c","#405460"]},roles={javi:"local"};
  const ink="#293c40",rubber="#333e40",trim="#b7c2ae",silver="#dde0ca",cream="#e8d9ae",ochre="#d2a35f",
    brass="#e1b267",hide="#825a48",leather="#bc8768",red="#aa523d",wax="#d7bf8d";
  const radius=.345,rear=-.56,front=.57,crankY=.322,crankZ=-.036,throwR=.148,headY=.91,headZ=.319;
  const axisY=.96620,axisZ=-.25780;
  const idOf=b=>Object.hasOwn(paint,b.id)?b.id:"marlin";
  const tube=(g,a,b,r,col,n=7)=>g.pole(a,b,r,col,n);
  function tubing(g,points,r,col,n=7){
    for(let i=1;i<points.length;i++)tube(g,points[i-1],points[i],r,col,n);
  }
  function moveMesh(g,x,y,z){
    const a=g.vertices;for(let i=0;i<a.length;i+=6){a[i]+=x;a[i+1]+=y;a[i+2]+=z;}
  }
  function fender(g,z,a,b,clr){
    const n=14;
    const p=(u,x,rad)=>[x,radius+Math.cos(u)*rad,z+Math.sin(u)*rad];
    for(let i=0;i<n;i++){
      const l=mix(a,b,i/n),r=mix(a,b,(i+1)/n);
      for(const side of [-1,1]){
        g.quad(p(l,side*.051,.372),p(r,side*.051,.372),p(r,side*.030,.389),p(l,side*.030,.389),clr,.93);
        g.quad(p(l,side*.030,.389),p(r,side*.030,.389),p(r,0,.393),p(l,0,.393),clr);
      }
      g.quad(p(l,-.009,.394),p(r,-.009,.394),p(r,.009,.394),p(l,.009,.394),cream);
    }
  }
  function wheel(g,courier){
    const n=22,width=courier?.030:.038;
    const profile=[[-width*.76,radius-.068],[-width*.96,radius-.057],[-width,radius-.030],
      [-width*.74,radius-.008],[-width*.39,radius],[width*.39,radius],[width*.74,radius-.008],
      [width,radius-.030],[width*.96,radius-.057],[width*.76,radius-.068]];
    const p=(j,a)=>[profile[j][0],Math.sin(a)*profile[j][1],Math.cos(a)*profile[j][1]];
    for(let i=0;i<n;i++){
      const a=tau*i/n,b=tau*(i+1)/n;
      for(let j=0;j<profile.length-1;j++){
        const face=j<=0||j>=8?trim:j===1||j===7?courier?"#8c8779":"#ddcfaa":j===4?"#384345":rubber;
        g.quad(p(j,a),p(j,b),p(j+1,b),p(j+1,a),face);
      }
      const rim=radius-.064;
      for(const side of [-1,1]){
        const bead=(u,r)=>[side*width*.74,Math.sin(u)*r,Math.cos(u)*r];
        g.quad(bead(a,rim),bead(b,rim),bead(b,rim-.013),bead(a,rim-.013),silver);
      }
    }
    const rim=radius-.073;
    tube(g,[-.073,0,0],[.073,0,0],.035,trim,8);
    for(let i=0;i<14;i++){
      const a=tau*i/14,side=i%2?1:-1,b=a+side*.92;
      const at=(u,r,x)=>[x,Math.sin(u)*r,Math.cos(u)*r];
      const inner=at(b,.030,side*.057),outer=at(a,rim,side*.014);
      const dy=.0043*Math.cos(a),dz=-.0043*Math.sin(a);
      g.quad([inner[0],inner[1]+dy,inner[2]+dz],[outer[0],outer[1]+dy,outer[2]+dz],
        [outer[0],outer[1]-dy,outer[2]-dz],[inner[0],inner[1]-dy,inner[2]-dz],i%3?silver:trim);
    }
    for(const side of [-1,1]){
      g.box(side*.009,.171,.041,.018,.086,.035,ochre,.04);
      g.box(side*.027,-.254,.077,.020,.028,.040,"#b58a52");
    }
  }
  function saddle(g,courier){
    const outline=courier?[[-.109,-.329],[.109,-.329],[.12,-.255],[.074,-.183],[.035,-.035],[-.035,-.035],[-.074,-.183],[-.12,-.255]]:
      [[-.124,-.336],[.124,-.336],[.139,-.254],[.080,-.163],[.039,-.043],[-.039,-.043],[-.080,-.163],[-.139,-.254]];
    for(let i=0;i<outline.length;i++){
      const [x,z]=outline[i],[X,Z]=outline[(i+1)%outline.length],y=.917-Math.max(0,z+.19)*.07,h=.917-Math.max(0,Z+.19)*.07;
      g.tri([0,.927,-.235],[x,y,z],[X,h,Z],courier?"#514a40":hide);
      g.quad([x,y,z],[X,h,Z],[X,h-.028,Z],[x,y-.028,z],courier?"#8a8069":leather);
    }
    for(const x of [-.093,.093])g.cyl(x,.919,-.300,.011,.011,.009,6,brass);
    tube(g,[-.068,.863,-.307],[.068,.863,-.307],.014,trim);
    for(const x of [-.062,.062])tubing(g,[[x,.862,-.304],[x,.829,-.207],[x*.40,.879,-.112]],.011,silver,6);
  }
  function headBadge(g,courier){
    const pt=(x,y,depth)=>[x,y,headZ+(headY-y)*.268+depth];
    const c=courier?ochre:cream;
    for(const side of [-1,1]){
      g.quad(pt(0,.823,.035),pt(side*.025,.847,.026),pt(side*.027,.880,.025),pt(0,.898,.035),c);
      g.tri(pt(0,.839,.036),pt(side*.016,.874,.032),pt(0,.868,.037),courier?ink:"#98634f");
    }
  }
  function chain(g){
    const frontY=crankY,backY=radius,backR=.045,ringR=.088;
    for(const x of [.072,.091]){
      const oval=(a,z,y,r)=>[x,y+Math.cos(a)*r,z+Math.sin(a)*r];
      for(let i=0;i<15;i++){
        const a=tau*i/15,b=tau*(i+1)/15;
        for(const [z,y,r] of [[crankZ,frontY,ringR],[rear,backY,backR]]){
          g.quad(oval(a,z,y,r),oval(b,z,y,r),oval(b,z,y,r-.012),oval(a,z,y,r-.012),trim);
        }
      }
    }
    for(const sign of [-1,1])tube(g,[.083,backY+sign*backR,rear],[.083,frontY+sign*ringR,crankZ],.009,ink,5);
    for(let i=0;i<4;i++){
      const a=tau*i/4+.32;
      tube(g,[.083,crankY,crankZ],[.083,crankY+.079*Math.sin(a),crankZ+.079*Math.cos(a)],.009,trim,5);
    }
  }
  function rearRack(g,id){
    const taxi=id==="javi",frame=paint[id];
    const top=.763;
    for(const x of [-.102,.102]){
      tubing(g,[[x,.354,rear],[x*1.14,top-.024,-.786],[x*1.12,top,-.365]],.016,trim);
      tube(g,[x,.366,rear+.035],[x*1.12,top-.004,-.375],.010,trim,6);
    }
    for(const x of [-.075,0,.075])g.box(x,top+.012,-.581,.054,.023,.461,taxi?"#929d8d":"#b08a66");
    for(const z of [-.742,-.434]){
      g.box(0,top-.012,z,.247,.029,.036,trim);
      for(const x of [-.073,.073])g.cyl(x,top+.025,z,.009,.009,.005,6,"#776658");
    }
    g.box(0,top-.065,-.822,.125,.095,.027,frame);
    g.box(0,top-.056,-.840,.090,.045,.012,"#ce6854");
    g.box(0,top-.071,-.848,.069,.009,.003,"#eb9a6e");
  }
  function badge(g,id){
    const x=-.065,c=id==="north"?"#34615e":"#77483d",code=id==="marlin"?"14":"02";
    const glyph={"0":["111","101","101","101","111"],"1":["010","110","010","010","111"],
      "2":["111","001","111","100","111"],"4":["101","101","111","001","001"]};
    g.box(x,.680,-.584,.018,.100,.183,cream);
    for(const side of [-1,1])for(let i=0;i<2;i++)for(let j=0;j<5;j++){
      const row=glyph[code[i]][j];
      for(let k=0;k<3;k++)if(row[k]==="1"){
        const z=-.584+side*(.055-i*.062-k*.014);
        g.box(x+side*.010,.712-j*.015,z,.001,.011,.011,c);
      }
    }
  }
  function frame(g,id){
    const col=paint[id],courier=id==="javi";
    const bb=[0,crankY,crankZ],st=[0,.831,-.169],head=[0,headY,headZ],lo=[0,.722,.370];
    tube(g,[0,.870,-.184],bb,.029,col,8);tube(g,bb,lo,.039,col,8);
    tube(g,lo,head,.042,col,8);headBadge(g,courier);
    tube(g,[0,.814,-.165],[0,.908,-.196],.022,trim);
    for(const side of [-1,1]){
      const dropout=[side*.073,radius,rear];
      tubing(g,[[side*.028,crankY,crankZ], [side*.077,.328,-.341],dropout],.020,col);
      tubing(g,[dropout,[side*.062,.565,-.409],[side*.025,.796,-.169]],.021,col);
      tube(g,[side*.066,.503,-.448],[side*.060,.582,-.397],.023,courier?ochre:cream);
      tube(g,[side*.048,.331,-.157],[side*.072,.329,-.276],.021,courier?ochre:cream);
    }
    if(courier){
      tube(g,st,[0,.900,.318],.028,col);
      tube(g,[0,.854,-.015],[0,.866,.079],.029,ochre);
      tube(g,[0,.664,.265],[0,.717,.352],.039,"#c6ad77");
    }else{
      tubing(g,[st,[0,.669,-.105],[0,.541,-.036],[0,.492,.048],[0,.501,.110],[0,.549,.177],[0,.813,.341]],.026,col);
      for(const side of [-1,1]){
        tubing(g,[[side*.017,.735,-.134],[side*.029,.557,-.042],[side*.027,.500,.067],[side*.018,.539,.163]],.008,cream,5);
        const outside=side*.025;
        g.tri([outside,.657,.234],[outside,.617,.189],[outside,.602,.175],cream);
        g.quad([outside,.620,.183],[outside,.671,.252],[outside,.681,.257],[outside,.629,.185],ochre);
      }
      fender(g,rear,-1.78,.93,col);
      for(const side of [-1,1])tube(g,[side*.074,radius,rear],[side*.047,.405,-.922],.007,trim,5);
      badge(g,id);
    }
    for(const [y,z] of [[.725,.369],[.903,.321]])g.cyl(0,y,z,.045,.045,.014,8,trim);
    saddle(g,courier);rearRack(g,id);chain(g);
    tube(g,[-.105,crankY,crankZ],[.105,crankY,crankZ],.032,ink,8);
    if(!courier){
      const outer=.105;
      g.quad([outer,crankY+.063,crankZ+.030],[outer,.402,-.446],[outer,.374,-.527],[outer,crankY-.024,crankZ+.044],col);
      g.quad([outer+.002,.372,-.428],[outer+.002,.379,-.414],[outer+.002,.367,-.061],[outer+.002,.358,-.026],cream);
    }
  }
  function grip(courier,side){return [side*(courier?.247:.288),courier?1.075:1.098,courier?.169:.144];}
  function fork(g,id){
    const courier=id==="javi",col=paint[id];
    const shoulder=[0,.703,.376];
    for(const side of [-1,1]){
      tubing(g,[[side*.025,shoulder[1],shoulder[2]],[side*.068,.57,.415],[side*.072,.411,.501],[side*.071,radius,front]],.020,col);
      tube(g,[side*.061,.598,.407],[side*.069,.556,.424],.022,cream,6);
    }
    tube(g,[-.085,radius,front],[.085,radius,front],.018,trim,8);
    tube(g,[0,.700,.375],[0,.961,.305],.021,trim);
    tubing(g,[[0,.957,.308],[0,.995,.351],[0,1.042,.340]],.022,silver);
    for(const side of [-1,1]){
      const palm=grip(courier,side),bend=[side*.190,palm[1]-.009,palm[2]+.107];
      tubing(g,[[0,1.041,.340],[side*.104,1.049,.334],bend,palm],.013,silver);
      const start=[palm[0]*.88,palm[1]-.004,palm[2]+.047];
      const end=[palm[0]*1.075,palm[1]+.003,palm[2]-.031];tube(g,start,end,.022,courier?ink:hide);
      tubing(g,[[side*.201,1.063,.259],[side*.224,palm[1]-.039,palm[2]+.042],[side*.256,palm[1]-.044,palm[2]+.011]],.007,trim,5);
      tubing(g,[[side*.194,1.055,.271],[side*.186,.944,.452],[side*.101,.833,.464],[side*.038,.733,.379]],.004,ink,5);
    }
    g.cyl(-.127,1.079,.308,.018,.041,.030,9,brass);g.cyl(-.127,1.069,.308,.041,.033,.021,9,ochre);
    g.box(-.157,1.069,.299,.04,.010,.013,ink);
    fender(g,front,-1.25,1.15,courier?"#658181":col);
    for(const x of [-.068,.068])tube(g,[x,radius,front],[x*.68,.515,.899],.007,trim,5);
    const base=courier?.735:.783,top=courier?.874:.992,ez=courier?.737:.739;
    const width=courier?.245:.231,depth=.305,back=ez-depth+.006;
    for(const side of [-1,1]){
      tube(g,[side*.068,.358,front],[side*(width-.025),base,ez-.045],.012,trim,6);
      const rim=[[side*width,top,back],[side*width,top,ez],[side*(width-.03),base,ez-.016],[side*(width-.03),base,back+.015]];
      for(let i=0;i<4;i++)tube(g,rim[i],rim[(i+1)%4],.009,courier?silver:leather,5);
      for(let j=1;j<=4;j++){const f=j/5;const z=mix(back,ez,f);tube(g,[side*(width-.029),base,z],[side*width,top,z],.005,courier?trim:leather,5);}
      for(const f of [.31,.56,.79])tube(g,[side*(width-.03*(1-f)),mix(base,top,f),back],[side*(width-.03*(1-f)),mix(base,top,f),ez-.013*(1-f)],.007,courier?trim:"#bc986a",5);
    }
    for(const z of [back,ez]){
      tube(g,[-width,top,z],[width,top,z],.010,courier?silver:leather);
      for(const f of [.17,.39,.61,.82]){
        const w=width-.031*(1-f);tube(g,[-w,mix(base,top,f),z],[w,mix(base,top,f),z],.006,courier?trim:"#c2a176",5);
      }
      for(let i=-2;i<=2;i++)tube(g,[i*.076,base,z],[i*.083,top,z],.007,courier?silver:"#a47d56",5);
    }
    for(const x of [-.114,0,.114])g.box(x,base,(ez+back)/2,.097,.019,depth,courier?"#a17b59":"#b99770");
    const lens=[0,base-.069,ez-.041];
    tube(g,[0,lens[1],lens[2]-.059],[0,lens[1],lens[2]+.039],.059,trim,9);
    tube(g,[0,lens[1],lens[2]+.039],[0,lens[1],lens[2]+.052],.048,"#ede1aa",9);
    g.cyl(0,lens[1],lens[2]+.050,.037,.037,.041,6,"#ecddb0");
    moveMesh(g,0,-headY,-headZ);
  }
  function crank(g){
    for(const side of [-1,1]){
      tubing(g,[[side*.094,0,0],[side*.110,0,side*.048],[side*.132,0,side*throwR]],.015,trim,6);
      tube(g,[side*.126,0,side*throwR],[side*.200,0,side*throwR],.011,ink,6);
    }
  }
  function pedal(g){
    g.box(0,0,0,.097,.025,.075,ink);
    for(const z of [-.040,.040]){
      g.box(0,.001,z,.112,.020,.012,trim);
      g.box(0,.001,z+Math.sign(z)*.006,.061,.010,.003,ochre);
      for(const x of [-.038,0,.038])g.box(x,.014,z,.010,.010,.013,ink);
    }
  }
  function stand(g){
    tubing(g,[[0,0,0],[-.028,-.048,.020],[-.158,-.319,-.122]],.012,trim);
    g.box(-.159,-.317,-.126,.048,.022,.069,ink);
  }
  function pouch(g){
    const left=-.149,right=.149,front=.054,back=-.055,top=.213;
    const pocket=(x,y,z)=>[x*(1-.08*y/top),y,z+.010*Math.cos(x*7)];
    g.quad(pocket(left,0,front),pocket(right,0,front),pocket(right,top,front),pocket(left,top,front),red);
    g.quad(pocket(left,0,back),pocket(left,top,back),pocket(right,top,back),pocket(right,0,back),"#873f35");
    for(const side of [-1,1]){
      const x=side*right;
      g.quad(pocket(x,0,back),pocket(x,0,front),pocket(x,top,front),pocket(x,top,back),"#9a4a3a");
    }
    g.quad(pocket(left,top,back),pocket(left,top,front),pocket(right,top,front),pocket(right,top,back),"#c97452");
    g.quad([-.135,.211,.070],[.135,.211,.070],[.114,.125,.077],[-.098,.119,.076],"#c88157");
    for(const x of [-.097,.088])g.box(x,.103,.075,.018,.169,.011,hide);
    g.box(.087,.118,.083,.032,.033,.012,brass);g.box(.087,.118,.09,.018,.019,.003,"#7c634a");
    g.box(-.037,.151,.082,.055,.053,.014,brass);g.box(-.037,.155,.090,.028,.011,.003,"#866d4d");
    for(const side of [-1,1])tubing(g,[[side*.067,.213,0],[side*.055,.260,-.004],[side*.029,.273,-.006],[0,.273,-.006]],.009,hide,5);
    for(let i=0;i<2;i++){
      g.box(.004+i*.033,.212+i*.006,-.034,.054,.042,.009,i?wax:"#ead296",i*.1);
    }
  }
  function install(model){
    for(const id of Object.keys(paint)){
      model("pedal/frame/"+id,g=>frame(g,id));model("pedal/fork/"+id,g=>fork(g,id));
    }
    model("pedal/wheel",g=>wheel(g,false));model("pedal/wheel/courier",g=>wheel(g,true));
    model("pedal/crank",crank);model("pedal/tread",pedal);model("pedal/stand",stand);model("pedal/pouch",pouch);
  }

  // Basis follows BayView's yaw, roll, pitch order. Steering rotates about the raked head tube.
  const elevations=new WeakMap();
  function motion(b){
    const mount=b.rider?clamp(b.mount??1):0;
    const tilt=-(b.pitch||0),lean=-(b.lean||0)+.073*(1-mount);
    const yaw=b.yaw||0,cp=Math.cos(tilt),sp=Math.sin(tilt),cr=Math.cos(lean),sr=Math.sin(lean),cy=Math.cos(yaw),sy=Math.sin(yaw);
    return {tilt,lean,yaw,
      x:[cy*cr,sr,-sy*cr],y:[-cy*sr*cp+sy*sp,cr*cp,sy*sr*cp+cy*sp],
      z:[cy*sr*sp+sy*cp,-cr*sp,-sy*sr*sp+cy*cp]};
  }
  function rotate(m,p){
    return [0,1,2].map(i=>m.x[i]*p[0]+m.y[i]*p[1]+m.z[i]*p[2]);
  }
  function localToWorld(b,m,ground,p){
    const q=rotate(m,p);
    return [b.x+q[0],ground+(b.air||0)+q[1],b.z+q[2]];
  }
  function steerVector(p,angle){
    const c=Math.cos(angle),s=Math.sin(angle),d=(1-c)*(axisY*p[1]+axisZ*p[2]);
    return [p[0]*c+(axisY*p[2]-axisZ*p[1])*s,p[1]*c+axisZ*p[0]*s+axisY*d,p[2]*c-axisY*p[0]*s+axisZ*d];
  }
  function steered(p,b){
    const q=steerVector([p[0],p[1]-headY,p[2]-headZ],b.steer||0);
    return [q[0],q[1]+headY,q[2]+headZ];
  }
  function forkAngles(m,b){
    const a=b.steer||0,x=rotate(m,steerVector([1,0,0],a)),y=rotate(m,steerVector([0,1,0],a)),z=rotate(m,steerVector([0,0,1],a));
    return [Math.atan2(-x[2],x[0]),Math.atan2(-z[1],y[1]),Math.asin(clamp(x[1],-1,1))];
  }
  function rootOffset(u,side){
    const outside=1-smooth(.21,.93,u);
    return [side*.55*outside,0,-.15*outside];
  }
  function point(b,u,side,ground=0){
    elevations.set(b,ground);
    const m=motion(b),p=localToWorld(b,m,ground,rootOffset(clamp(u),side<0?-1:1));
    return {x:p[0],y:p[1],z:p[2],yaw:m.yaw,tilt:m.tilt,lean:m.lean};
  }
  function pedalAt(b,side){
    const a=b.crank||0;
    return [side*.177,crankY-side*throwR*Math.sin(a),crankZ+side*throwR*Math.cos(a)];
  }
  function basketRest(b){
    return [0,(idOf(b)==="javi"?.735:.783)+.014,.501];
  }
  function pickup(b){
    if(!b.pouch)return 0;
    const r=Math.abs(b.reach||0);return smooth(.04,.34,r)*(1-smooth(.34,.88,r));
  }
  function reachPalm(b,side,m){
    const gripAt=steered(grip(idOf(b)==="javi",side),b),reach=Math.max(0,(b.reach||0)*side);
    if(!reach)return gripAt;
    let target=[side*.582,1.287,.050];
    if(b.passPoint){
      const p=b.passPoint,g=elevations.get(b)??0,dx=p.x-b.x,dy=p.y-g-(b.air||0),dz=p.z-b.z;
      const dot=a=>a[0]*dx+a[1]*dy+a[2]*dz;
      target=[dot(m.x),dot(m.y),dot(m.z)];
    }
    let from=gripAt,t=smooth(.04,.96,reach);
    if(b.pouch){
      const rest=basketRest(b),handle=steered([rest[0],rest[1]+.273,rest[2]-.006],b);
      if(reach<=.34){
        t=smooth(.02,.34,reach);
        return [mix(gripAt[0],handle[0],t),mix(gripAt[1],handle[1],t)+.064*Math.sin(Math.PI*t),mix(gripAt[2],handle[2],t)];
      }
      from=handle;t=smooth(.34,.96,reach);
    }
    const arc=Math.sin(Math.PI*t);
    return [mix(from[0],target[0],t),mix(from[1],target[1],t)+(b.pouch?.132:.061)*arc,mix(from[2],target[2],t)+.031*arc];
  }
  function pouchAt(b,m){
    const r=Math.abs(b.reach||0),seat=steered(basketRest(b),b);
    if(r<=.34)return seat;
    const hand=reachPalm(b,b.reach<0?-1:1,m),w=smooth(.34,.80,r),offset=steerVector([0,.273,-.006],(b.steer||0)*(1-w));
    return [hand[0]-offset[0],hand[1]-offset[1],hand[2]-offset[2]];
  }
  function world(list,b,ground=0,t=0){
    elevations.set(b,ground);
    const id=idOf(b),m=motion(b),forkPose=forkAngles(m,b),base=[m.yaw,m.tilt,m.lean],wheelName=id==="javi"?"pedal/wheel/courier":"pedal/wheel";
    const put=(name,p,angles=base,spin=0)=>{
      const q=localToWorld(b,m,ground,p);
      list.push([name,q[0],q[1],q[2],angles[0],angles[1]+spin,angles[2]]);
    };
    put("pedal/frame/"+id,[0,0,0]);
    put("pedal/fork/"+id,[0,headY,headZ],forkPose);
    put(wheelName,[0,radius,rear],base,b.wheelSpin||0);
    put(wheelName,steered([0,radius,front],b),forkPose,b.wheelSpin||0);
    put("pedal/crank",[0,crankY,crankZ],base,b.crank||0);
    for(const side of [-1,1])put("pedal/tread",pedalAt(b,side));
    put("pedal/stand",[-.066,.312,-.202],base,1.66*smooth(.10,.72,b.rider?(b.mount??1):0));
    if(b.pouch){
      const f=smooth(.34,.80,Math.abs(b.reach||0)),a=(b.steer||0)*(1-f);
      put("pedal/pouch",pouchAt(b,m),a===0?base:a===b.steer?forkPose:forkAngles(m,{steer:a}));
    }
  }

  function groundAnkle(m,x,z){return (.169-m.x[1]*x-m.z[1]*z)/Math.max(.75,m.y[1]);}
  function ridingWeight(b){return Math.max(smooth(.10,1.3,Math.abs(b.speed||0)),smooth(.015,.12,b.air||0));}
  function footAt(b,u,side,leg,m){
    const near=side===leg,w=near?smooth(.46,.95,u):smooth(.12,.80,u),rolling=ridingWeight(b);
    const step=Math.sin(Math.PI*w),startX=side*.55+leg*.111,startZ=-.15+(leg<0?.055:-.042);
    const peg=pedalAt(b,leg),rock=leg*Math.cos(b.crank||0),angle=.14*rock-.045;
    // The ball of the sole is .153 below, .040 ahead of the ankle in the native player mesh.
    const cy=Math.cos(angle),sy=Math.sin(angle);
    let x=peg[0],y=peg[1]+.017+.153*cy+.040*sy,z=peg[2]+.153*sy-.040*cy;
    if(near){
      const footX=side*.333,footZ=-.205;
      x=mix(footX,x,rolling);y=mix(groundAnkle(m,footX,footZ),y,rolling);z=mix(footZ,z,rolling);
    }
    return {x:mix(startX,x,w)+leg*.025*step,y:mix(groundAnkle(m,startX,startZ),y,w)+step*(near?.105:idOf(b)==="javi"?.83:.52),
      z:mix(startZ,z,w)+step*(near?.025:.12),pitch:w*angle*(near?rolling:1)+step*(near?.04:-.24)};
  }
  // Two-bone IK preserves upper and lower segment lengths while choosing the anatomical bend plane.
  function chainPose(a,k,b,first,second,target,guide,limit){
    const dx=target[0]-a[0],dy=target[1]-a[1],dz=target[2]-a[2];
    const n=Math.max(.0001,Math.hypot(dx,dy,dz)),ux=dx/n,uy=dy/n,uz=dz/n,l=first.length,r=second.length,d=clamp(n,.055,(l+r)*limit);
    b[0]=a[0]+ux*d;b[1]=a[1]+uy*d;b[2]=a[2]+uz*d;
    const mid=(l*l-r*r+d*d)/(2*d),bend=Math.sqrt(Math.max(0,l*l-mid*mid));
    const dot=guide[0]*ux+guide[1]*uy+guide[2]*uz,px=guide[0]-dot*ux,py=guide[1]-dot*uy,pz=guide[2]-dot*uz;
    const f=bend/Math.max(.0001,Math.hypot(px,py,pz));
    k[0]=a[0]+ux*mid+px*f;k[1]=a[1]+uy*mid+py*f;k[2]=a[2]+uz*mid+pz*f;
    first.aim(a,k);second.aim(k,b);
  }
  const nativePalms=[[-.238,.981,.047],[.238,.981,.047]];
  function rider(mesh,b,u=1,side=-1,t=0){
    if(!mesh)return false;
    u=clamp(u);side=side<0?-1:1;
    const m=motion(b),off=rootOffset(u,side),seat=smooth(.20,.94,u),step=Math.sin(Math.PI*smooth(.08,.94,u));
    const effort=clamp(b.effort||0),a=b.crank||0,sprint=effort*ridingWeight(b),still=1-ridingWeight(b),lift=smooth(0,.55,b.air||0);
    const reach=clamp(b.reach||0,-1,1)*seat,tuck=lift+Math.min(.45,Math.abs(b.pitch||0)*1.55),getBag=pickup(b)*seat;
    const at=mesh.pivot,courier=idOf(b)==="javi",rest=seat*(1-sprint)*Math.sin(t*1.63+(courier?1.2:0));
    at[0]=seat*(side*.062*still+.021*sprint*Math.cos(a)+.039*reach)-side*.041*step+.006*rest;
    at[1]=mix(.956,.989+.041*sprint-.070*still,seat)-.053*step+seat*(.011*sprint*Math.sin(a*2)-.073*tuck)-.030*getBag;
    at[2]=seat*(-.209+.045*sprint-.026*tuck)-.025*step+.091*getBag;
    const hipRoll=-.034*sprint*Math.cos(a)*seat-.039*reach;
    mesh.pelvis.place(at,.06*seat,.048*reach+.036*sprint*Math.sin(a)*seat,hipRoll);
    mesh.pelvis.map(mesh.chest.pivot,at);at[1]+=.003*rest;
    const lean=(courier?.29:.223)+.28*sprint+.223*tuck;
    mesh.chest.place(at,.016+seat*lean+.175*step+.51*getBag,.23*reach+(b.steer||0)*.15*seat,
      -side*.15*step-.14*reach-.077*sprint*Math.cos(a)*seat);
    mesh.chest.map(mesh.head.pivot,at);
    mesh.head.place(at,.016+seat*(.063+.068*sprint+.10*tuck)+.064*step+.34*getBag,
      .55*reach+(b.steer||0)*.50*seat+.030*rest,-.065*reach-.028*sprint*Math.cos(a)*seat);
    for(const limb of mesh.sides){
      const leg=limb.side,foot=footAt(b,u,side,leg,m);
      mesh.pelvis.map(limb.thigh.pivot,limb.hip);
      chainPose(limb.hip,limb.knee,limb.ankle,limb.thigh,limb.shin,[foot.x-off[0],foot.y,foot.z-off[2]],[leg*.17,0,1],1.018);
      limb.shoe.place(limb.ankle,foot.pitch,leg*.045*(1-seat),0);
      mesh.chest.map(limb.arm.pivot,limb.shoulder);
      const palms=reachPalm(b,leg,m),armMix=leg===side?smooth(.03,.55,u):smooth(.16,.90,u);
      const wrist=[mix(leg*.235,palms[0]-off[0],armMix),mix(1.004,palms[1]+.026,armMix),mix(.039,palms[2]-.019-off[2],armMix)],bend=[leg*.64,-.68,-.59];
      chainPose(limb.shoulder,limb.elbow,limb.hand,limb.arm,limb.forearm,wrist,bend,1.024);
      // The palm turns with the forearm as it crosses the basket. Settle it around the actual grip.
      if(armMix>0){
        limb.forearm.map(nativePalms[leg<0?0:1],at);
        wrist[0]+=armMix*(palms[0]-off[0]-at[0]);wrist[1]+=armMix*(palms[1]-at[1]);wrist[2]+=armMix*(palms[2]-off[2]-at[2]);
        chainPose(limb.shoulder,limb.elbow,limb.hand,limb.arm,limb.forearm,wrist,bend,1.024);
      }
    }
    mesh.skin();return true;
  }
  function dress(mesh,id){
    if(!mesh||id!=="javi"||mesh.pedalCostume===id)return;
    const g=new BayMesh(),parts=[],mark=part=>parts.push([part,g.vertices.length/6]);
    mark("body");
    // Sun-faded ferry club jersey, cream sleeve piping and the two horizontal signal flags.
    for(const face of [-1,1]){
      const p=(x,y,d=0)=>[x,y,face*(.119+d+.015*(y-1.12))];
      g.quad(p(-.145,1.314),p(.146,1.245),p(.145,1.296),p(-.145,1.367),"#526b69");
      g.quad(p(-.143,1.328,.002),p(.145,1.261,.002),p(.144,1.273,.002),p(-.143,1.340,.002),cream);
      g.quad(p(.038,1.219,.002),p(.115,1.202,.002),p(.115,1.226,.002),p(.038,1.244,.002),face>0?red:cream);
    }
    mark("head");
    g.cyl(0,1.746,-.012,.104,.116,.056,12,"#c8b184");
    g.cyl(.002,1.780,-.021,.057,.106,.039,12,cream);
    g.cyl(0,1.723,-.012,.116,.113,.014,12,"#697c71");
    g.box(0,1.723,.090,.173,.017,.118,"#6c8074");
    g.box(-.005,1.720,.126,.143,.007,.047,"#a59d79");
    const rest=new Float32Array(mesh.rest.length+g.vertices.length);
    rest.set(mesh.rest);rest.set(g.vertices,mesh.rest.length);
    for(let j=0;j<parts.length;j++)for(let i=parts[j][1];i<(parts[j+1]?.[1]??g.vertices.length/6);i++){
      mesh.bindings.push(mesh.binding(parts[j][0],mesh.sides[0],g.vertices[i*6+1]));
    }
    mesh.rest=rest;mesh.vertices=rest.slice();mesh.pedalCostume=id;
  }

  function mapBike(c,b,x,y,scale,t=0){
    const id=idOf(b),courier=id==="javi",color=paint[id],m=motion(b),s=scale;
    const line=(p,q,width,shade)=>{c.beginPath();c.moveTo(p[0],p[1]);c.lineTo(q[0],q[1]);c.strokeStyle=shade;c.lineWidth=width;c.stroke();};
    const shape=(points,shade)=>{c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fillStyle=shade;c.fill();};
    const ellipse=(x,z,rx,rz,c1,angle=0)=>{c.fillStyle=c1;c.beginPath();c.ellipse(x,z,rx,rz,angle,0,tau);c.fill();};
    const proj=p=>[p[0]-m.lean*p[1]*.44,p[2]+p[1]*.09];
    const steering=(x,z,h)=>proj(steered([x,h,z],b));
    const sta=b.rider?clamp(b.mount??1):0,side=b.side<0?-1:1,showRider=b.rider&&(b.rider!=="player"||sta>0);
    c.save();c.translate(x,y);c.rotate(m.yaw);c.scale(s,-s);c.lineCap="round";c.lineJoin="round";
    c.save();c.globalAlpha*=.24;ellipse(.085,-.10,.22,.90,"#394643",.065);
    if(showRider)ellipse(.08+rootOffset(sta,side)[0],-.20,.275,.39,"#394643");
    c.restore();
    c.translate(0,(b.air||0)*.27);
    const wheel=(a,z0,steer)=>{
      const end=d=>steer?steering(0,z0+d,radius):proj([0,radius,z0+d]),p=end(-radius),q=end(radius);
      line(p,q,.106,rubber);line(p,q,.066,courier?"#8b9184":"#d0c5a3");line(p,q,.031,rubber);
      for(const f of [-1,1]){
        const tick=radius*.75*Math.sin((b.wheelSpin||0)+a+f*1.5);
        line(end(tick),end(tick+.030),.073,f<0?ochre:trim);
      }
    };
    wheel(0,rear,false);wheel(0,front,true);
    line(proj([0,.737,-.784]),proj([0,.735,-.404]),.122,color);
    for(const k of [-1,1])line([k*.085,-.45],[k*.086,-.75],.024,trim);
    line([-.101,-.72],[.101,-.72],.025,trim);line([-.102,-.46],[.102,-.46],.025,trim);
    line([0,-.69],[0,-.49],.100,"#aa8b67");line([-.069,-.76],[.071,-.76],.043,"#bd6950");
    for(const k of [-1,1])line([k*.023,-.02],[k*.047,-.45],.030,color);
    line(proj([.083,.33,-.54]),proj([.083,.33,crankZ]),.017,ink);
    line(proj([0,.53,-.16]),proj([0,.73,.36]),.069,color);
    line(proj([0,.69,.23]),proj([0,.735,.34]),.029,cream);
    for(const k of [-1,1]){
      const p=pedalAt(b,k),foot=proj(p);
      line(proj([0,crankY,crankZ]),foot,.018,trim);
      line([foot[0]-.045,foot[1]],[foot[0]+.045,foot[1]],.073,ink);
    }
    shape([[-.122,-.206],[-.126,-.271],[-.085,-.30],[.085,-.30],[.127,-.262],[.119,-.203],[.040,-.013],[-.040,-.013]],courier?"#544b43":hide);
    for(const v of [-.080,.080])ellipse(v,-.25,.012,.011,brass);
    const hub=steering(0,.340,1.042),bend=k=>steering(k*.18,.267,1.07);
    for(const k of [-1,1]){
      const p=proj(steered(grip(courier,k),b));line(hub,bend(k),.030,silver);line(bend(k),p,.029,trim);
      line([p[0]*.95,p[1]+.024],[p[0]*1.04,p[1]-.030],.044,courier?ink:hide);
    }
    const basketH=courier?.87:.99,bottom=[[.203,.456],[.203,.720],[-.203,.720],[-.203,.456]];
    shape(bottom.map(p=>steering(p[0],p[1],basketH-.15)),courier?"#9e8665":"#b68b60");
    for(const v of [-.225,.225])line(steering(v,.439,basketH),steering(v,.739,basketH),.023,courier?trim:leather);
    for(const z of [.439,.490,.54,.59,.64,.69,.739])line(steering(-.225,z,basketH),steering(.225,z,basketH),.018,courier?silver:"#d0ae7e");
    for(const v of [-.147,-.06,.028,.113])line(steering(v,.439,basketH),steering(v+.012,.739,basketH),.012,courier?trim:"#bfa071");
    function satchel(){
      const p=proj(pouchAt(b,m));c.save();c.translate(p[0],p[1]);
      c.rotate(-(b.steer||0)*(1-smooth(.34,.80,Math.abs(b.reach||0))));
      shape([[-.160,-.075],[.143,-.071],[.160,.067],[.122,.093],[-.145,.087]],"#994f40");
      shape([[-.153,-.025],[.143,-.030],[.125,.088],[-.128,.085]],"#c47350");
      line([.089,-.063],[.075,.070],.023,hide);line([-.037,.004],[-.031,.050],.046,brass);c.restore();
    }
    if(b.pouch&&Math.abs(b.reach||0)<.10)satchel();
    if(showRider){
      const isJavi=b.rider==="javi",shirt=isJavi?colors.javi[1]:"#398e86",pants=isJavi?colors.javi[2]:"#556d80",skin=isJavi?colors.javi[0]:"#b77f62";
      const o=rootOffset(sta,side),seat=smooth(.20,.94,sta),r=clamp(b.reach||0,-1,1);
      const torso=[o[0]+.035*r*seat,o[2]-.183*seat+.131*(b.effort||0)*seat+.118+.19*pickup(b)*seat],head=[torso[0]+.035*r,torso[1]+.075+.054*seat];
      for(const k of [-1,1]){
        const f=footAt(b,sta,side,k,m),sole=proj([f.x,f.y,f.z]),hip=[torso[0]+k*.105,torso[1]-.086],knee=[mix(hip[0],sole[0],.53)+k*.052,mix(hip[1],sole[1],.53)+.133*seat];
        line(hip,knee,.155,pants);line(knee,sole,.099,pants);
        ellipse(sole[0],sole[1]+.035,.061,.107,isJavi?"#a1987a":"#bdc4ae");
        line([sole[0]-.040,sole[1]],[sole[0]+.040,sole[1]],.019,"#768c88");
      }
      for(const k of [-1,1]){
        const hand=proj(reachPalm(b,k,m)),w=smooth(k===side?.03:.16,k===side?.55:.9,sta);
        const p=[mix(o[0]+k*.235,hand[0],w),mix(o[2]+.102,hand[1],w)],should=[torso[0]+k*.163,torso[1]+.033];
        const elbow=[mix(should[0],p[0],.48)+k*.045,mix(should[1],p[1],.46)-.046];
        line(elbow,p,.085,skin);line(should,elbow,.133,shirt);ellipse(p[0],p[1],.040,.047,skin);
      }
      c.save();c.translate(...torso);c.rotate(-r*.19);ellipse(0,0,.220,.140,shirt);
      if(isJavi){line([-.155,-.051],[.119,.028],.032,"#546d6b");line([-.136,-.059],[.100,.009],.012,cream);}
      else{
        for(const k of [-1,1])shape([[k*.142,-.042],[k*.070,-.066],[k*.093,-.018],[k*.062,.015]],"#ccb58b");
        line([-.044,-.044],[.021,-.075],.018,"#a1b798");
      }
      c.restore();ellipse(head[0],head[1],.103,.108,isJavi?cream:"#3b363b");
      if(isJavi){ellipse(head[0]+r*.025,head[1]+.076,.086,.054,"#728274");ellipse(head[0],head[1]-.014,.092,.077,"#d3be91");}
      else ellipse(head[0]-.034,head[1]+.022,.039,.055,"#514544",-.35);
    }
    if(b.pouch&&Math.abs(b.reach||0)>=.10)satchel();
    c.restore();
  }

  window.BayPedalArt={install,world,point,rider,mapBike,dress,paint,colors,roles};
})();
