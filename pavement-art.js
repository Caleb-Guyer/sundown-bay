/* Used news boxes, Luna's folding bill and the Mercado fruit flats. Local +Z faces the reader. */
(() => {
  "use strict";
  const ink="#243e48",iron="#33494c",sheet="#e9dfbc",blue="#346b83",rim="#72949b";
  const wine="#773e3d",red="#b65042",sun="#edbb62",wood="#a47650",edge="#d4aa75";
  const fruit=["#e99536","#e5a039","#da832e","#f4a949","#e68f39"];
  const oranges=[[-.245,.275,.098],[-.045,.265,-.118],[.185,.27,.114],[.237,.285,-.119],[-.062,.435,.05]];
  const meshes=new Map();
  const type={
    A:"04 20 44|13 33",B:"04 00 30 41 32 02|32 43 34 04",C:"40 10 01 03 14 44",D:"04 00 20 41 43 24 04",
    E:"40 00 04 44|02 32",G:"40 10 01 03 14 44 42 22",H:"00 04|40 44|02 42",I:"00 40|20 24|04 44",
    L:"00 04 44",M:"04 00 22 40 44",N:"04 00 44 40",O:"10 30 41 43 34 14 03 01 10",
    R:"04 00 30 41 32 02|22 44",S:"40 10 01 02 32 43 34 04",T:"00 40|20 24",U:"00 03 14 34 43 40",
    W:"00 14 22 34 40",Y:"00 22 40|22 24"
  };
  const strokes=Object.fromEntries(Object.entries(type).map(([key,form])=>[key,form.split("|").map(path=>
    path.split(" ").map(p=>[Number(p[0])*.25,1-Number(p[1])*.25]))]));
  const vertical=(side,z)=>(x,y,d=0)=>[-side*x,y,side*(z+d)];
  const flat=(x,y,d=0)=>[x,1.131+d,y];
  function patch(g,f,x,y,w,h,c,d=0){g.quad(f(x,y,d),f(x+w,y,d),f(x+w,y+h,d),f(x,y+h,d),c);}
  function poly(g,f,points,c,d=0){
    for(let i=2;i<points.length;i++)g.tri(f(...points[0],d),f(...points[i-1],d),f(...points[i],d),c);
  }
  function line(g,f,x,y,X,Y,w,c,d=0){
    const dx=X-x,dy=Y-y,s=w*.5/(Math.hypot(dx,dy)||1),u=-dy*s,v=dx*s;
    g.quad(f(x+u,y+v,d),f(X+u,Y+v,d),f(X-u,Y-v,d),f(x-u,y-v,d),c);
  }
  function word(g,f,text,cx,y,h,c,d=0){
    const w=h*.62,advance=h*.84;let x=cx-(advance*(text.length-1)+w)*.5;
    for(const ch of text){
      for(const path of strokes[ch]||[])for(let i=1;i<path.length;i++)
        line(g,f,x+w*path[i-1][0],y+h*path[i-1][1],x+w*path[i][0],y+h*path[i][1],h*.133,c,d);
      x+=advance;
    }
  }
  function circle(g,f,x,y,r,c,d=0){
    for(let i=0;i<16;i++){const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
      g.tri(f(x,y,d),f(x+r*Math.cos(a),y+r*Math.sin(a),d),f(x+r*Math.cos(b),y+r*Math.sin(b),d),c);}
  }
  function box(g,count){
    // The pedestal's corners are rubbed down to bare steel, especially at the newspaper carrier's foot.
    g.box(0,.026,-.007,.53,.052,.405,iron);
    g.box(0,.23,-.021,.266,.385,.251,blue);
    g.box(-.126,.108,.104,.015,.089,.009,rim);
    g.box(0,.405,0,.60,.09,.422,iron);
    g.box(0,.757,-.012,.651,.649,.459,blue);
    g.box(0,1.096,.003,.70,.067,.520,rim);
    g.box(0,1.113,.008,.679,.027,.521,blue);
    word(g,flat,"WIRE",0,-.066,.137,sheet);
    const front=vertical(1,.22),back=vertical(-1,.244);
    patch(g,front,-.293,.492,.586,.474,iron,.003);
    patch(g,front,-.270,.515,.47,.421,"#415861",.006);
    if(count){
      patch(g,front,-.25,.544,.432,.373,sheet,.009);
      patch(g,front,-.234,.823,.402,.014,ink,.012);
      word(g,front,"BAY WIRE",-.035,.851,.051,ink,.013);
      // The lead picture is the pier silhouetted across the coast, with a pulp-orange sun.
      patch(g,front,-.228,.617,.233,.185,"#83a9a5",.011);
      circle(g,front,-.165,.757,.028,sun,.013);
      patch(g,front,-.228,.617,.233,.046,"#51777d",.013);
      line(g,front,-.228,.68,.005,.687,.013,ink,.014);
      for(let k=0;k<5;k++)line(g,front,-.207+k*.048,.663,-.206+k*.048,.688,.008,ink,.014);
      poly(g,front,[[-.114,.693],[-.087,.723],[-.057,.694]],wine,.013);
      for(let k=0;k<7;k++)patch(g,front,.029,.789-k*.024,k===5?.094:.129,.008,ink,.012);
      for(let k=0;k<2;k++)patch(g,front,-.229,.59-k*.018,.37-k*.105,.006,"#7e8179",.014);
    }
    patch(g,front,-.246,.91,.24,.009,"#b0c6bc",.016);
    patch(g,front,.22,.71,.051,.182,rim,.015);patch(g,front,.229,.828,.033,.007,iron,.017);
    g.pole([-.277,.68,.23],[-.277,.68,.271],.012,iron);
    g.pole([-.277,.84,.23],[-.277,.84,.271],.012,iron);
    g.pole([-.277,.68,.271],[-.277,.84,.271],.012,rim,6);
    patch(g,front,-.246,1.004,.491,.042,"#7e9d9f",.004);
    word(g,back,"WIRE",0,.779,.113,sheet,.003);
    patch(g,back,-.253,.742,.506,.014,"#d79266",.004);
    for(let i=0;i<4;i++)patch(g,back,-.146,.534+i*.025,.295,.008,iron,.003);
    for(const side of [-1,1])for(let i=0;i<3;i++)
      g.box(side*.328,.505+i*.028,-.03,.006,.010,.202,iron);
  }
  function board(g){
    const face=(side)=>(x,y,d=0)=>[-side*x,y,side*(.277-.239*y+d)];
    for(const side of [-1,1]){
      const f=face(side);
      for(const x of [-.338,.338]){
        g.pole(f(x,.021),f(x,1.015),.023,wine,4);
        g.box(f(x,0)[0],.021,side*.277,.057,.042,.045,iron);
      }
      patch(g,f,-.36,.167,.72,.831,wine,.003);
      patch(g,f,-.327,.208,.654,.744,side>0?red:"#43595d",.007);
      patch(g,f,-.29,.817,.58,.105,sun,.009);
      word(g,f,"CINE LUNA",0,.835,.066,wine,.011);
      if(side>0){
        circle(g,f,.073,.601,.149,sun,.010);
        circle(g,f,.132,.642,.112,red,.012);
        for(const [x,y,r] of [[-.218,.698,.014],[-.149,.567,.009],[.202,.747,.011]]){
          poly(g,f,[[x-r,y],[x,y+r*2],[x+r,y],[x,y-r*2]],sheet,.013);
        }
        word(g,f,"LATE SHOW",0,.281,.072,sheet,.014);
      }else{
        circle(g,f,-.076,.566,.137,sun,.011);
        poly(g,f,[[-.298,.432],[-.16,.597],[-.115,.526],[.046,.696],[.283,.431]],wine,.013);
        word(g,f,"TONIGHT",0,.278,.071,sheet,.014);
      }
      patch(g,f,-.22,.245,.44,.012,sun,.014);
      for(const x of [-.304,.304])for(const y of [.192,.965])
        patch(g,f,x-.008,y-.007,.016,.014,rim,.010);
    }
    g.pole([-.364,1.023,0],[.364,1.023,0],.022,iron,7);
    for(const x of [-.345,.345]){
      g.pole([x,.356,-.191],[x,.334,.008],.008,iron,4);
      g.pole([x,.334,.008],[x,.355,.192],.008,iron,4);
    }
  }
  function orange(g,x,y,z,r,index){
    const col=fruit[index%fruit.length],shadow="#c9792e";
    g.cyl(x,y-r*.56,z,r,r*.69,r*.52,8,shadow);
    g.cyl(x,y+r*.044,z,r*.87,r,r*.69,8,col);
    g.cyl(x,y+r*.603,z,r*.43,r*.87,r*.43,8,col);
    g.cyl(x,y+r*.824,z,r*.13,r*.16,r*.023,6,"#775a3c");
    g.tri([x,y+r*.842,z],[x+r*.22,y+r*.98,z-r*.19],[x+r*.58,y+r*.85,z-r*.32],"#63764a");
  }
  function crate(g,count){
    g.box(0,.046,0,.815,.083,.530,"#926c4d");
    for(const x of [-.377,.377])for(const z of [-.235,.235])g.box(x,.255,z,.075,.497,.079,edge);
    const boards=["#a67a55","#c19465","#b38357"];
    for(let i=0;i<3;i++){
      const y=.112+i*.142;
      for(const side of [-1,1]){
        g.box(0,y,side*.274,.851,.109,.043,boards[(i+(side<0?1:0))%3]);
        g.box(side*.404,y,0,.047,.105,.51,boards[(i+1)%3]);
      }
    }
    for(const side of [-1,1]){
      const f=vertical(side,.298);
      patch(g,f,-.18,.071,.354,.084,sheet,.002);
      circle(g,f,-.121,.115,.027,red,.003);
      word(g,f,"SOL",.04,.091,.049,"#476d56",.004);
      for(const x of [-.377,.377])for(const y of [.11,.249,.397])patch(g,f,x-.009,y-.009,.018,.018,iron,.004);
    }
    for(let i=0;i<count;i++){const [x,y,z]=oranges[i];orange(g,x,y,z,.11,i);}
  }
  function paper(g){
    // The folded lip makes loose copies catch the light as they flip over.
    const f=(x,z,d=0)=>[x,.002+Math.max(0,x)*.13+d,z];
    patch(g,f,-.145,-.176,.29,.352,sheet);
    g.quad([-.145,.001,-.176],[-.145,.001,.176],[-.129,-.010,.168],[-.129,-.010,-.174],"#c2bba5");
    const reverse=(x,z,d=0)=>[x,-.004-d,z];patch(g,reverse,-.143,-.172,.282,.344,"#d3ceb7");
    for(let i=0;i<7;i++)patch(g,reverse,-.117,-.143+i*.039,i===3?.147:.225,.009,"#82877b",.001);
    patch(g,f,-.123,.109,.243,.035,ink,.003);
    patch(g,f,-.121,-.057,.12,.126,"#628783",.003);
    for(let i=0;i<5;i++)patch(g,f,.019,.064-i*.023,.095-i%3*.013,.006,iron,.003);
  }
  function stockOf(p){return Math.max(0,Math.min(5,Math.round(p.stock||0)));}
  function asset(p){
    const count=stockOf(p),key="pavement/"+p.kind+(p.kind==="crate"?"/"+count:p.kind==="box"?(count?"/full":"/empty"):"");
    let entry=meshes.get(key);
    if(!entry){
      const mesh=new BayMesh();
      if(p.kind==="box")box(mesh,count);
      else if(p.kind==="board")board(mesh);
      else if(p.kind==="crate")crate(mesh,count);
      else if(p.kind==="orange")orange(mesh,0,0,0,.104,2);
      else paper(mesh);
      entry={key,mesh};meshes.set(key,entry);
    }
    return entry;
  }
  function world(view,visible,see,state){
    if(!view?.gl||view.lost||!state)return;
    const push=(p,range)=>{
      if(!see(p,range))return;
      const {key,mesh}=asset(p);if(!view.models.has(key))view.add(key,mesh);
      visible.push([key,p.x,p.y,p.z,p.yaw||0,p.tilt||0]);
    };
    for(const p of state.props)push(p,87);
    for(const b of state.bits)push(b,54);
  }

  function mapRect(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function spot(c,x,y,rx,ry,col){c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,Math.max(.002,ry),0,0,2*Math.PI);c.fill();}
  function overhead(ctx,px,py,scale,state,t,visible){
    if(!state||!(scale>0))return;
    function draw(p){
      const x=px(p.x),y=py(p.z);
      if(visible&&!visible(x,y,scale*2+1))return;
      const kind=p.kind,tilt=p.tilt||0,sin=Math.sin(tilt),cos=Math.cos(tilt),count=stockOf(p);
      ctx.save();ctx.translate(x,y);ctx.rotate(p.yaw||0);ctx.scale(scale,scale);
      // The same local hinge gives each face its actual overhead projection.
      const front=sin<0?1:-1;
      function side(sign,z,paint,slope=0){
        const depth=sign*z*cos,dy=sign*slope*cos-sin;
        if(Math.abs(dy)<.0001)return;
        ctx.save();ctx.transform(-sign,0,0,dy,0,-depth);paint();ctx.restore();
      }
      function roof(h,paint){
        if(Math.abs(cos)<.0001)return;
        ctx.save();ctx.transform(1,0,0,-cos,0,-h*sin);paint();ctx.restore();
      }
      if(kind==="paper"){
        roof(.003,()=>{mapRect(ctx,-.145,-.176,.29,.352,sheet);mapRect(ctx,-.119,.105,.24,.035,ink);
          mapRect(ctx,-.116,-.047,.11,.12,"#628783");mapRect(ctx,.019,-.057,.095,.13,"#a3a395");});
      }else if(kind==="orange"){
        spot(ctx,.012,-.002,.11,.09,"#9e6f3e");spot(ctx,0,-.009,.104,.099,fruit[2]);
        spot(ctx,-.029,-.042,.032,.017,"#f6b559");mapRect(ctx,.003,-.019,.039,.022,"#647546");
      }else if(kind==="board"){
        for(const sign of [front*-1,front])side(sign,.277,()=>{
          mapRect(ctx,-.361,.16,.722,.85,wine);
          for(const u of [-.338,.338])mapRect(ctx,u-.022,.008,.044,.99,wine);
          mapRect(ctx,-.327,.205,.654,.749,sign>0?red:"#43595d");
          mapRect(ctx,-.28,.818,.56,.099,sun);spot(ctx,.034,.61,.142,.142,sun);
          if(sign>0)spot(ctx,.103,.657,.113,.113,red);
          mapRect(ctx,-.219,.29,.434,.055,sheet);
        },.239);
        roof(1.023,()=>mapRect(ctx,-.364,-.022,.728,.044,iron));
      }else if(kind==="box"){
        side(front,.25,()=>{
          mapRect(ctx,-.135,.025,.27,.43,blue);mapRect(ctx,-.324,.418,.648,.68,blue);
          if(front>0){mapRect(ctx,-.278,.495,.555,.466,iron);
            if(count){mapRect(ctx,-.247,.542,.43,.375,sheet);mapRect(ctx,-.225,.837,.38,.032,ink);mapRect(ctx,-.227,.622,.23,.164,"#719398");}
          }else{mapRect(ctx,-.178,.793,.356,.058,sheet);mapRect(ctx,-.246,.743,.494,.012,"#d79266");}
        });
        roof(1.129,()=>{mapRect(ctx,-.35,-.26,.70,.52,rim);mapRect(ctx,-.334,-.242,.668,.478,blue);
          ctx.scale(1,-1);ctx.fillStyle=sheet;ctx.font="bold .145px sans-serif";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("WIRE",0,0);});
      }else if(kind==="crate"){
        roof(.046,()=>mapRect(ctx,-.405,-.264,.81,.528,"#976d4c"));
        const wall=sign=>side(sign,.296,()=>{for(let i=0;i<3;i++)mapRect(ctx,-.426,.059+i*.142,.852,.109,wood);
          for(const u of [-.375,.375])mapRect(ctx,u-.025,.025,.05,.47,edge);
          mapRect(ctx,-.18,.071,.354,.084,sheet);spot(ctx,-.123,.115,.027,.027,red);});
        wall(-front);
        for(let i=0;i<count;i++){
          const [u,h,z]=oranges[i],v=-(h*sin+z*cos);
          spot(ctx,u,v,.111,.106,fruit[i]);spot(ctx,u-.025,v-.024,.031,.019,"#f6b559");
        }
        wall(front);
        roof(.45,()=>{for(const u of [-.403,.403])mapRect(ctx,u-.024,-.261,.048,.522,edge);
          for(const v of [-.274,.274])mapRect(ctx,-.425,v-.022,.85,.044,edge);});
      }
      ctx.restore();
    }
    for(const p of state.props)draw(p);
    for(const b of state.bits)draw(b);
  }
  window.BayPavementArt={world,overhead};
})();
