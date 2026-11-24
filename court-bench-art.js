/* Dee's folding rec-department scorer, Inés's market slate, and Room 14's clothes rail. */
(() => {
  "use strict";
  const pi=Math.PI,tau=pi*2,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,n)=>a+(b-a)*n;
  const ease=(a,b,n)=>{const t=clamp((n-a)/(b-a));return t*t*(3-2*t);};
  const colors={dee:["#955f47","#777d70","#3d5557"],ines:["#b98263","#bb947e","#5a5865"]};
  const roles={dee:"local",ines:"local"};
  const dark="#354d4e",iron="#465756",tube="#a4ada0",warm="#eddbb2",ochre="#d6a459",
    wood="#a98461",edge="#715a49",sea="#4e827b",red="#b86853",chalk="#f0deb9",cream="#e2cfa4";
  const roomPin={x:-1.74,z:-2.96,name:"Clothes rail"},roomBlock={x:-1.75,z:-3.67,w:1.54,d:.43};
  const spot=site=>atSpot(site,-7.52,3.62,-pi/2);
  const watchSpot=site=>atSpot(site,-8.43,7.10,pi/2);
  const keeperSpot=site=>({...atSpot(site,-9.02,4.65,pi/2),id:site.id==="sol"?"dee":"ines"});
  function atSpot(site,u,v,turn=0){
    const a=site.yaw,c=Math.cos(a),s=Math.sin(a);
    return {x:site.x+u*c+v*s,y:site.y,z:site.z-u*s+v*c,yaw:a+turn};
  }
  const origin=site=>atSpot(site,-8.42,4.65,pi/2);
  function worldAt(o,x,y,z){
    const c=Math.cos(o.yaw),s=Math.sin(o.yaw);
    return {x:o.x+c*x+s*z,y:o.y+y,z:o.z-s*x+c*z};
  }
  function bounds(site,u,v,w,d,top){
    const p=atSpot(site,u,v),c=Math.abs(Math.cos(site.yaw)),s=Math.abs(Math.sin(site.yaw));
    return {x:p.x,z:p.z,w:c*w+s*d,d:c*d+s*w,bottom:0,top:site.y+top,streetProp:true};
  }
  function courtBlocks(){
    return BayCourtPlaces.sites.flatMap(s=>[
      bounds(s,-8.42,4.65,.60,1.82,1.40),bounds(s,-9.04,7.22,.43,1.48,.83),
      bounds(s,-8.84,5.99,.38,.43,.49)
    ]);
  }
  function floor(x,z){
    for(const s of BayCourtPlaces.sites){
      if(Math.abs(x-s.x)>12||Math.abs(z-s.z)>12)continue;
      const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),n=Math.sin(s.yaw),u=c*dx-n*dz,v=n*dx+c*dz;
      if(u>=-9.55&&u<=-7.14&&v>=3.05&&v<=8.12)return s.y;
    }
    return null;
  }
  function line(g,p,x,y,X,Y,w,col){
    const dx=X-x,dy=Y-y,len=Math.hypot(dx,dy)||1,ox=-dy*w/(2*len),oy=dx*w/(2*len);
    g.quad(p(x+ox,y+oy),p(X+ox,Y+oy),p(X-ox,Y-oy),p(x-ox,y-oy),col);
  }
  function chain(g,points,r,c,n=5){
    for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,c,n);
  }
  function quad(g,p,x,y,X,Y,c){g.quad(p(x,y),p(X,y),p(X,Y),p(x,Y),c);}
  function oval(g,p,x,y,rx,ry,c,n=12){
    for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n;g.tri(p(x,y),p(x+rx*Math.cos(a),y+ry*Math.sin(a)),p(x+rx*Math.cos(b),y+ry*Math.sin(b)),c);
    }
  }
  const liftShapes={
    "0":"10 30 41 43 34 14 03 01 10","1":"02 20 24|04 44","2":"01 10 30 41 42 04 44",
    "3":"00 30 41 32 12|32 43 34 04","4":"30 02 42|30 34","5":"40 00 02 32 43 34 04",
    "6":"40 10 01 03 14 34 43 32 02","7":"00 40 14","8":"10 30 41 32 12 01 10|12 03 14 34 43 32",
    "9":"42 12 01 10 30 41 43 34 04",
    A:"04 10 30 44|13 33",B:"04 00 30 41 32 02|32 43 34 04",C:"40 10 01 03 14 44",
    D:"04 00 20 41 43 24 04",E:"40 00 04 44|02 32",F:"04 00 40|02 32",G:"40 10 01 03 14 44 42 22",
    H:"00 04|40 44|02 42",I:"00 40|20 24|04 44",K:"00 04|40 02 44",L:"00 04 44",M:"04 00 22 40 44",N:"04 00 44 40",
    O:"10 30 41 43 34 14 03 01 10",P:"04 00 30 41 32 02",R:"04 00 30 41 32 02|22 44",
    S:"40 10 01 02 32 43 34 04",T:"00 40|20 24",U:"00 03 14 34 43 40",V:"00 24 40",
    W:"00 14 22 34 40",Y:"00 22 40|22 24"
  };
  const paths={};
  for(const [ch,code] of Object.entries(liftShapes)){
    const segs=[];
    for(const path of code.split("|")){
      const pts=path.split(" ").map(v=>[Number(v[0])/4,1-Number(v[1])/4]);
      for(let i=1;i<pts.length;i++){
        const [x,y]=pts[i-1],[X,Y]=pts[i];segs.push({x,y,X,Y,len:Math.hypot(X-x,Y-y)});
      }
    }
    paths[ch]={segs,total:segs.reduce((n,s)=>n+s.len,0)};
  }
  function letter(g,p,ch,x,y,w,h,weight,col,progress=1){
    const path=paths[ch];if(!path)return;
    let left=progress*path.total;
    for(const s of path.segs){
      if(left<=0)break;const f=Math.min(1,left/s.len);
      line(g,p,x+w*s.x,y+h*s.y,x+w*mix(s.x,s.X,f),y+h*mix(s.y,s.Y,f),weight,col);left-=s.len;
    }
  }
  function word(g,p,str,x,y,h,col,weight=.105){
    const w=h*.63,advance=h*.86;
    for(let i=0;i<str.length;i++)letter(g,p,str[i],x+i*advance-(str.length*advance-advance+w)/2,y,w,h,h*weight,col);
  }
  const face=z=>(x,y)=>[-x,y,z],back=z=>(x,y)=>[x,y,z],flat=y=>(x,z)=>[x,y,z];
  const vinyl=["#426b6a","#925847"],print=["#f4dfad","#f3deaf"];
  const cardHeight=1.30,cardDepth=-.217,cardAngle=-.23,slots=[.157,-.157];
  function card(g,n,slot){
    const front=face(.0092),rear=back(-.0092);
    g.box(0,-.13,0,.277,.289,.013,vinyl[slot]);
    for(const p of [front,rear]){
      quad(g,p,-.124,-.258,.124,-.252,slot?"#c7876b":"#8fa79a");
      letter(g,p,String(n),-.056,-.231,.112,.167,.023,print[slot]);
      for(const x of [-.089,.089])oval(g,p,x,-.008,.009,.012,dark,7);
    }
    const side=slot?-1:1;
    g.box(side*.129,-.051,-.030,.034,.028,.080,"#bf9d70");
    g.box(side*.132,-.049,-.072,.041,.023,.020,"#e8bf80");
  }
  function solScore(g){
    g.box(.015,.836,.006,1.81,.074,.61,"#b99874");
    for(const z of [-.285,.288])g.box(0,.837,z,1.815,.047,.022,tube);
    for(const x of [-.785,.785]){
      chain(g,[[x,.03,-.235],[x,.06,-.237],[x,.785,.235]],.022,tube);
      chain(g,[[x,.03,.249],[x,.058,.249],[x,.787,-.221]],.022,tube);
      g.box(x,.387,.003,.062,.067,.049,dark);
      for(const z of [-.235,.249])g.box(x,.023,z,.078,.035,.087,iron);
    }
    g.pole([-.781,.161,-.172],[.781,.161,-.172],.019,iron,5);
    for(let i=0;i<3;i++)g.box(0,.88,-.209+i*.189,1.66,.014,.005,"#9b7d5f");
    // The sun-bleached recreation banner hangs by two grommets and curls back at the right corner.
    const banner=(x,y)=>[-x,y,.311-.023*Math.cos(x*6)-.017*(1.2-y)];
    const emblem=(x,y)=>{const q=banner(x,y);q[2]+=.005;return q;};
    for(let i=0;i<9;i++){
      const x=-.69+i*.14,X=x+.14;
      quad(g,banner,x,.375,X,.806,"#3a7573");
      quad(g,emblem,x,.778,X,.794,"#e4c491");quad(g,emblem,x,.39,X,.404,"#a8b3a0");
    }
    oval(g,emblem,-.422,.597,.111,.110,"#d99863",16);
    const wave=(x,y)=>{const q=emblem(x,y);q[2]+=.004;return q;};
    for(let i=0;i<3;i++)quad(g,wave,-.55,.523+i*.029,-.29,.532+i*.029,"#3a7573");
    word(g,emblem,"SOL REC",.13,.538,.097,warm);
    for(const x of [-.64,.527]){
      oval(g,emblem,x,.75,.019,.019,ochre,9);
      chain(g,[[-x,.751,.301],[-x,.856,.332],[-x,.869,.265]],.006,cream,4);
    }
    const z=cardDepth;
    for(const s of [-1,1]){
      const x=s*.364;
      g.tri([x,.888,z+.125],[x,.888,z-.052],[x,1.309,z],"#627771");
      g.pole([x,.894,z+.126],[x,1.307,z],.013,tube,5);
      g.pole([x,1.304,z],[x,.894,z-.052],.013,tube,5);
    }
    g.box(0,.902,z+.075,.735,.034,.121,dark);
    g.box(0,.962,z-.007,.675,.042,.040,"#728980");
    g.pole([-.383,cardHeight,z],[.383,cardHeight,z],.014,"#c0c4ac",7);
    for(const x of [-.36,.36])g.box(x,1.095,z+.011,.021,.384,.043,sea);
    for(const x of [-.248,-.071,.071,.248]){
      const arc=[];for(let j=0;j<=9;j++){const a=j*tau/9;arc.push([x,1.305+.022*Math.cos(a),z+.032*Math.sin(a)]);}
      chain(g,arc,.0056,iron,4);
    }
    const label=face(z+.088);
    quad(g,label,-.325,.906,.325,.986,dark);
    const labelInk=face(z+.090);
    word(g,labelInk,"HOME",-.154,.931,.036,cream);word(g,labelInk,"AWAY",.154,.931,.036,cream);
    g.box(.67,1.010,.046,.106,.274,.106,"#b77b57");
    g.cyl(.67,1.169,.046,.047,.051,.055,9,cream);g.box(.67,1.003,.046,.108,.113,.109,"#e2be85");
    // Folded clipboard and a tethered pen on the seaward end of the table.
    g.box(-.607,.890,.048,.293,.028,.358,dark,-.08);
    g.box(-.607,.909,.048,.254,.012,.321,"#e9d7b1",-.08);
    g.box(-.608,.922,-.084,.109,.016,.027,tube);
    for(let i=0;i<5;i++)g.box(-.635,.917,-.011+i*.033,.155-(i%2)*.034,.003,.006,"#90a197");
    g.pole([-.82,.90,.17],[-.72,.90,.012],.010,red,5);
  }
  const slateY=1.207,slateZ=-.211,slateCos=.817,slateSin=.577,slateSlots=[.155,-.155];
  function slatePoint(x,h,raise=0){return [x,slateY+h*slateCos+raise*slateSin,slateZ-h*slateSin+raise*slateCos];}
  function drawSlate(g,n,f){
    const p=(x,y)=>slatePoint(-x,y,.013);
    letter(g,p,String(n),-.063,-.099,.126,.183,.016,"#eeddb2",f);
    const grain=(x,y)=>slatePoint(-x+.003,y+.003,.0139);
    letter(g,grain,String(n),-.062,-.099,.125,.182,.0036,"#f6e9c9",f);
  }
  function chalkPosition(n,f){
    const path=paths[String(n)];let left=path.total*clamp(f);
    for(let i=0;i<path.segs.length;i++){
      const s=path.segs[i];
      if(left<=s.len||i===path.segs.length-1){
        const t=clamp(left/s.len);return slatePoint(.063-.126*mix(s.x,s.X,t),-.099+.183*mix(s.y,s.Y,t),.019);
      }left-=s.len;
    }
  }
  function mercadoScore(g){
    for(const x of [-.65,.65]){
      for(const z of [-.247,.247])g.box(x,.408,z,.080,.80,.075,"#7d7056");
      g.quad([x-.112,.062,-.23],[x-.076,.066,-.23],[x+.105,.741,-.23],[x+.068,.737,-.23],"#a58e6a");
      g.box(x,.16,0,.103,.091,.55,"#938766");
    }
    for(let i=0;i<4;i++)g.box(0,.825,-.237+i*.157,1.78,.086,.149,i%2?"#ab946f":"#b09a77");
    g.box(0,.713,.251,1.65,.12,.047,wood);
    // The awning stripe is a repurposed produce-crate panel; the painted orange marks its old packing house.
    const front=face(.291);quad(g,front,-.717,.433,.717,.711,"#587f70");
    quad(g,front,-.719,.434,.717,.456,"#d6b678");
    const pigment=face(.294);
    oval(g,pigment,-.452,.555,.073,.056,"#dc985a",11);
    g.tri(pigment(-.469,.605),pigment(-.470,.639),pigment(-.400,.640), "#c6ca99");
    word(g,pigment,"MERCADO",.129,.521,.065,cream);
    for(const x of [-.666,.65])for(const y of [.466,.669])oval(g,pigment,x,y,.006,.008,iron,6);
    // A shallow slate leans toward the court far enough for the scorekeeper to reach across its rim.
    const surface=(x,y)=>slatePoint(x,y),marks=(x,y)=>slatePoint(x,y,.0045);
    quad(g,surface,-.354,-.158,.354,.169,edge);
    quad(g,marks,-.338,-.142,.338,.153,"#394f49");
    const scuff=(x,y)=>slatePoint(x,y,.007);
    for(const [x,y,X,Y] of [[-.289,-.04,-.202,-.032],[-.23,.055,-.16,.06],[.087,.006,.169,.001],[.223,-.063,.264,-.066]]){
      line(g,scuff,x,y,X,Y,.003,"#687568");
    }
    line(g,scuff,0,-.119,0,.118,.004,"#acb5a0");
    const endpoints=[[-.356,-.160],[-.356,.174],[.356,.174],[.356,-.160],[-.356,-.160]];
    for(let i=1;i<endpoints.length;i++)g.pole(slatePoint(...endpoints[i-1]),slatePoint(...endpoints[i]),.016,wood,5);
    for(const x of [-.306,.306]){
      const top=slatePoint(x,.118);chain(g,[[x,.87,-.251],[x,top[1]-.009,-.278],top],.019,iron);
      g.pole([x,.874,.056],slatePoint(x,-.157),.018,wood,5);
    }
    const edgeLabel=(x,y)=>slatePoint(-x,y,.009);
    word(g,edgeLabel,"CASA",-.153,.114,.026,"#d9bd83");word(g,edgeLabel,"VISITA",.155,.113,.024,"#d9bd83");
    g.box(-.61,.928,.031,.285,.115,.211,"#b57d56");
    g.box(-.61,.989,.028,.257,.011,.182,"#826654");
    for(let i=0;i<3;i++)g.box(-.68+i*.067,1.001,.051,.023,.018,.115,["#e2bf96","#94ab9a","#d68a70"][i],.13*i-.12);
    g.box(.647,.887,.035,.239,.027,.291,"#796551",.11);
    g.box(.649,.905,.037,.211,.019,.260,"#e4cfa5",.11);
    for(let i=0;i<4;i++)g.box(.654,.916,-.021+i*.033,.145-i*.012,.003,.006,"#8d8d78");
    g.box(.489,.884,.161,.104,.032,.072,"#68766b",-.12);
  }
  function sideBench(g,id){
    // Coordinates use the scorer as origin; +Z faces the painted sideline.
    const warmSide=id==="mercado",seat=warmSide?"#ad865a":"#8ba39a",metal=warmSide?"#647b67":"#5c8582";
    const z=-.62,x=-2.57;
    for(const side of [-1,1]){
      const xp=x+side*.577;
      g.pole([xp,.031,z-.166],[xp,.457,z-.122],.028,metal,6);
      g.pole([xp,.034,z+.178],[xp,.474,z+.103],.028,metal,6);
      g.pole([xp,.422,z-.12],[xp,.863,z-.21],.024,metal,6);
      g.box(xp,.022,z,.107,.028,.427,"#737a6a");
    }
    for(let i=0;i<3;i++)g.box(x,.466,z-.153+i*.142,1.48,.056,.125,i%2?seat:(warmSide?"#bd996a":"#9db2a1"));
    for(let i=0;i<2;i++)g.box(x,.677+i*.128,z-.188-i*.019,1.48,.099,.044,seat);
    for(const side of [-1,1])for(const l of [0,1])g.box(x+side*.576,.678+l*.128,z-.158-l*.019,.016,.013,.009,"#849287");
    const cx=-1.34,cz=-.42;
    if(!warmSide){
      g.box(cx,.185,cz,.435,.335,.38,"#557d76");
      for(const s of [-1,1])g.box(cx+s*.203,.17,cz,.019,.28,.351,"#64958a");
      g.box(cx,.367,cz,.46,.060,.401,"#d6ceb0");g.box(cx,.398,cz,.411,.021,.35,cream);
      for(const s of [-1,1])g.box(cx+s*.128,.348,cz+.197,.058,.081,.021,"#b5ac83");
      chain(g,[[cx-.220,.22,cz],[cx-.219,.474,cz+.015],[cx-.159,.508,cz+.022],[cx+.161,.508,cz+.022],[cx+.218,.475,cz+.015],[cx+.219,.22,cz]],.014,tube);
      g.box(cx,.219,cz+.194,.137,.066,.007,"#d3bd90");
    }else{
      for(const s of [-1,1])g.box(cx+s*.178,.191,cz,.038,.377,.36,"#917c58");
      for(let i=0;i<3;i++)for(const s of [-1,1])g.box(cx,.08+i*.107,cz+s*.164,.384,.079,.031,i%2?"#a4946b":"#ae966a");
      g.box(cx,.042,cz,.359,.061,.306,wood);
      for(const [xx,zz,cc] of [[-.084,-.056,sea],[.095,.057,"#ad9d64"]]){
        g.cyl(cx+xx,.249,cz+zz,.064,.071,.323,9,cc);g.cyl(cx+xx,.428,cz+zz,.039,.060,.056,9,cc);
        g.cyl(cx+xx,.467,cz+zz,.040,.039,.028,8,cream);
      }
    }
    // A duffel on the end of the bench leaves the center free. Its handles, folded towel and zip sit above the slats.
    const bx=x-.42,bz=z+.012,hue=warmSide?"#758673":"#ac705d";
    g.box(bx,.573,bz,.348,.167,.25,hue,-.055);
    g.box(bx,.657,bz+.004,.292,.070,.207,hue,-.055);
    g.pole([bx-.133,.697,bz+.012],[bx+.127,.697,bz-.003],.006,cream,4);
    for(const s of [-1,1])chain(g,[[bx-.085,.654,bz+s*.080],[bx-.058,.741,bz+s*.046],[bx+.052,.749,bz+s*.046],[bx+.080,.655,bz+s*.080]],.011,edge);
    const tx=x+.475;
    g.box(tx,.518,z-.012,.302,.034,.30,"#d7caae",.10);
    g.quad([tx-.156,.534,z+.116],[tx+.145,.532,z+.145],[tx+.140,.297,z+.201],[tx-.172,.320,z+.188],cream);
    g.quad([tx-.168,.352,z+.183],[tx+.142,.335,z+.196],[tx+.142,.346,z+.195],[tx-.167,.365,z+.182],warmSide?red:sea);
  }
  function apron(g){
    g.box(-.935,-.056,.075,5.07,.112,2.41,"#c3b69a");
    for(const x of [-2.08,.38])g.box(x,.003,.085,.018,.007,2.394,"#a0987f");
    for(let i=0;i<13;i++){const x=-3.31+(i*47%111)/23,z=-1.02+(i*61%93)/43;
      g.tri([x,.005,z],[x+.028,.005,z+.010],[x+.009,.005,z+.034],"#aa9e86");}
  }
  function dress(rig,id){
    if(!rig||!colors[id]||rig.courtScorer===id)return;
    const g=new BayMesh(),front=back(.132),rear=face(-.122);
    if(id==="dee"){
      for(const p of [front,rear])for(const y of [1.09,1.12,1.31]){
        line(g,p,-.131,y,.132,y+.004,.009,y===1.12?"#ab9270":"#9fa795");
      }
      for(const s of [-1,1])g.tri(front(.008*s,1.399),front(s*.107,1.424),front(s*.066,1.329),"#c3bd99");
      quad(g,front,-.118,1.202,-.052,1.271,"#758377");
      line(g,front,-.118,1.263,-.052,1.264,.008,"#a8a88d");
      for(const s of [-1,1])line(g,front,s*.077,1.418,0,1.209,.009,dark);
      g.box(0,1.200,.145,.036,.025,.043,ochre);g.cyl(0,1.195,.158,.015,.015,.029,6,tube);
      // A narrow terry towel thrown over one shoulder, with a stitched end on each side.
      for(const [p,b,t] of [[back(.140),1.169,1.425],[back(-.131),1.230,1.423]]){
        quad(g,p,.078,b,.133,t,"#d2c8a7");quad(g,p,.078,b+.025,.133,b+.034,"#ad705e");
      }
      g.quad([.078,1.421,-.132],[.132,1.423,-.132],[.132,1.425,.14],[.079,1.427,.14],"#d2c8a7");
    }else{
      g.quad(front(-.111,1.348),front(.111,1.348),front(.148,1.013),front(-.148,1.013),"#667f74");
      for(const s of [-1,1]){
        line(g,front,s*.115,1.420,s*.084,1.337,.021,"#566b64");line(g,rear,s*.115,1.420,-s*.112,1.026,.017,sea);
      }
      const p=back(.138);quad(g,p,-.092,1.076,.091,1.172,"#839386");
      for(const x of [-.089,.007,.089])line(g,p,x,1.078,x,1.169,.006,"#c4b79a");
      line(g,p,-.068,1.150,-.079,1.204,.012,ochre);
      for(const [x,y,s] of [[-.092,1.287,1],[.085,1.241,-1]]){
        line(g,p,x-.02*s,y-.012,x+.012*s,y+.028,.004,"#99a189");
        g.tri(p(x,y),p(x-.033*s,y+.010),p(x-.006*s,y+.019),"#ddb888");
      }
    }
    const headStart=g.vertices.length/6;
    if(id==="dee"){
      g.cyl(0,1.742,-.011,.075,.112,.073,12,"#4b6664");
      g.cyl(0,1.719,-.007,.114,.114,.025,12,"#567a70");
      g.box(0,1.714,.103,.202,.018,.132,"#b38b61");
      g.box(0,1.740,.103,.072,.039,.009,"#c4b38f");
      g.box(0,1.744,.110,.038,.007,.004,"#5a7a6f");
      for(const s of [-1,1])g.box(s*.098,1.663,-.043,.022,.064,.079,"#756b59");
      g.box(0,1.604,.113,.094,.013,.012,"#786759");
    }else{
      g.cyl(0,1.741,-.026,.082,.112,.061,12,"#4c4445");g.cyl(0,1.683,-.105,.058,.070,.092,8,"#514647");
      for(const s of [-1,1]){
        chain(g,[[s*.009,1.655,.111],[s*.021,1.668,.116],[s*.075,1.67,.11],[s*.089,1.656,.107],[s*.08,1.637,.112],[s*.029,1.636,.12],[s*.009,1.655,.111]],.0048,"#63554b",4);
        chain(g,[[s*.082,1.659,.109],[s*.106,1.651,.033],[s*.111,1.63,-.019]],.004,"#695848",4);
        g.cyl(s*.110,1.591,.009,.010,.007,.024,6,ochre);
      }
      g.pole([-.011,1.657,.115],[.011,1.657,.115],.004,"#7c6c59",4);
      g.pole([.034,1.702,-.103],[.080,1.760,-.086],.006,red,4);
      g.cyl(-.013,1.697,-.132,.052,.055,.040,8,"#7d6860");
    }
    const rest=new Float32Array(rig.rest.length+g.vertices.length);rest.set(rig.rest);rest.set(g.vertices,rig.rest.length);
    for(let i=0;i<g.vertices.length/6;i++)rig.bindings.push(rig.binding(i<headStart?"body":"head",rig.sides[0],g.vertices[i*6+1]));
    rig.rest=rest;rig.vertices=rest.slice();rig.courtScorer=id;rig.lastRevision=-1;
  }
  const scoreMemory=new WeakMap();
  function display(g){
    const n=i=>Math.max(0,Math.min(9,Math.round(g.score?.[i]||0))),a=n(0),b=n(1);
    let m=scoreMemory.get(g);
    if(!m){m={now:[a,b],old:[a,b],changed:[false,false],attemptAt:null};scoreMemory.set(g,m);}
    else if(m.now[0]!==a||m.now[1]!==b){
      const [A,B]=m.now;m.old=m.now;m.now=[a,b];m.changed=[a>A,b>B];
      m.attemptAt=g.mode==="practice"&&b>B&&a===A&&Number.isFinite(g.time)?g.time:null;
    }
    m.phase=m.attemptAt===null?1-clamp(g.flash||0):clamp((g.time-m.attemptAt)*1.26);return m;
  }
  const pageAngle=p=>cardAngle-5.69*ease(.15,.77,p);
  function marks(m,i){
    if(!m.changed[i]||m.phase>=.89)return {n:m.now[i],ink:1};
    if(m.phase<.245)return {n:m.old[i],ink:1-ease(.07,.24,m.phase)};
    return {n:m.now[i],ink:ease(.27,.81,m.phase)};
  }
  function tab(i,a){
    const y=-.049,z=-.072;
    return [slots[i]+(i?-.132:.132),cardHeight+Math.cos(a)*y-Math.sin(a)*z,cardDepth+Math.sin(a)*y+Math.cos(a)*z];
  }
  function handAt(id,i,m,t){
    const s=i?-1:1,rest=[s*(.247+.010*Math.sin(t*.71+i)),1.075+.013*Math.sin(t*.91+i),-.386];
    if(!m.changed[i]||m.phase>=.94)return rest;
    const p=m.phase,f=ease(0,.12,p)*(1-ease(.79,.94,p));
    let target;
    if(id==="dee"){target=tab(i,pageAngle(p));target[1]+=.003;target[2]+=.013;}
    else{
      const ink=chalkPosition(m.now[i],ease(.27,.81,p)),rub=slatePoint(slateSlots[i]+.064*Math.cos(3*pi*ease(.04,.23,p)),.025-.087*ease(.07,.24,p),.022);
      ink[0]+=slateSlots[i];const lift=ease(.225,.27,p);
      target=rub.map((v,j)=>mix(v,ink[j],lift));target[1]+=.017;target[2]-=.018;
    }
    return rest.map((v,j)=>mix(v,target[j],f));
  }
  function reach(limb,target){
    const r=limb.shoulder,v=target.map((c,i)=>c-r[i]),d0=Math.max(.001,Math.hypot(...v)),[x,y,z]=v.map(c=>c/d0);
    const a=limb.arm.length,b=limb.forearm.length,d=Math.max(Math.abs(a-b)+.001,Math.min(a+b-.001,d0));
    const mid=(a*a-b*b+d*d)/(2*d),bend=Math.sqrt(Math.max(0,a*a-mid*mid)),side=limb.side;
    const dot=side*.72*x-.69*y-.23*z,el=[side*.72-dot*x,-.69-dot*y,-.23-dot*z],k=bend/(Math.hypot(...el)||1);
    const e=limb.elbow,h=limb.hand;for(let j=0;j<3;j++){e[j]=r[j]+mid*v[j]/d0+k*el[j];h[j]=r[j]+d*v[j]/d0;}
    limb.arm.aim(r,e);limb.forearm.aim(e,h);
  }
  function pose(p,game,t=0){
    const rig=p?.mesh;if(!rig||!game||!colors[p.id])return false;
    const m=display(game),handling=(m.changed[0]||m.changed[1])?ease(0,.13,m.phase)*(1-ease(.80,.97,m.phase)):0;
    const b=game.ball,look=b&&Number.isFinite(b.x)?Math.atan2(b.x-p.x,b.z-p.z)-p.yaw:.17*Math.sin(t*.39);
    const headYaw=Math.max(-.58,Math.min(.58,Math.atan2(Math.sin(look),Math.cos(look))))*(1-.86*handling);
    const pivot=rig.pelvis.map(rig.chest.pivot,rig.pivot);
    rig.chest.place(pivot,.099+.14*handling+.011*Math.sin(t*1.2),headYaw*.17);
    for(const limb of rig.sides){
      rig.chest.map(limb.arm.pivot,limb.shoulder);
      const h=handAt(p.id,limb.side===1?0:1,m,t);h[2]+=.60;reach(limb,h);
    }
    rig.chest.map(rig.head.pivot,pivot);rig.head.place(pivot,.092+.24*handling,headYaw);
    rig.skin();return true;
  }
  const rackX=roomBlock.x,rackZ=roomBlock.z,garments=["street","sol","mercado"],hooks=[-.477,0,.477];
  const clubCloth={
    sol:{fabric:"#247a76",fold:"#286e68",piping:"#f3dfac",band:"#d57965",digits:"#f3dfac",key:"#354e57",panel:"#d57965"},
    mercado:{fabric:"#854757",fold:"#743f50",piping:"#ebbc73",band:"#e4dbb3",digits:"#f2deb0",key:"#433d4a",panel:"#58867c"}
  };
  function hanger(g,x){
    const wire="#a08d6a";
    chain(g,[[x,1.750,0],[x,1.823,.005],[x+.013,1.859,.009],[x+.028,1.870,.006],[x+.027,1.892,-.006],
      [x+.011,1.914,-.012],[x-.015,1.914,-.007],[x-.026,1.898,.006],[x-.026,1.880,.014]],.006,wire,6);
    const p=(u,y)=>[x+u,y,.009];
    for(const s of [-1,1]){
      g.quad(p(s*.008,1.795),p(s*.222,1.690),p(s*.217,1.670),p(s*.005,1.761),"#ad845e");
      g.quad([x+s*.008,1.795,-.016],[x+s*.222,1.690,-.016],p(s*.222,1.690),p(s*.008,1.795),"#c49d75");
    }
    g.pole([x-.213,1.678,-.004],[x+.213,1.678,-.004],.007,"#96785b",5);
  }
  function clothesRail(g){
    for(const x of [-.731,.731]){
      for(const z of [-.155,.155]){g.cyl(x,.057,z,.034,.036,.060,7,"#655e51");g.box(x,.092,z,.071,.036,.068,wood);}
      g.box(x,.118,0,.075,.060,.415,"#a7805b");g.box(x,.975,-.026,.057,1.757,.064,"#946e50");
      g.box(x,1.817,-.026,.062,.037,.068,"#c6ab7e");
      g.box(x,1.883,-.023,.084,.116,.081,"#a7805b");
      g.cyl(x,1.948,-.023,.031,.043,.040,7,"#cbaf7d");
    }
    g.pole([-.744,1.885,-.002],[.746,1.885,-.002],.015,"#b49a6e",9);
    g.box(0,.218,-.033,1.485,.051,.391,"#9d795c");
    for(const z of [-.144,-.037,.070])g.box(0,.247,z,1.378,.018,.070,"#b38b63");
    // A folded spare pair of whites and a laundry bag keep the shelf in use when all three hooks are empty.
    g.box(-.436,.283,-.011,.389,.064,.264,"#adab91",-.041);
    g.box(-.421,.334,-.015,.411,.045,.274,"#d3c9a5",.025);
    g.box(-.429,.364,-.019,.359,.026,.241,"#e6d8b6",-.038);
    for(const z of [-.099,.067])g.box(-.414,.379,z,.310,.005,.006,"#bcb097",-.038);
    g.box(.361,.349,.005,.461,.196,.263,"#50766f",.042);
    g.box(.356,.460,.011,.39,.05,.227,"#62847a",.042);
    for(const x of [.217,.489])chain(g,[[x,.453,-.073],[x,.516,-.049],[x,.538,.015],[x,.506,.075],[x,.450,.111]],.010,"#b09a72");
    const patch=face(.147);quad(g,patch,-.491,.325,-.244,.390,"#dbca9f");
    word(g,face(.150),"MARLIN",-.368,.340,.032,"#5b756a",.14);
    hooks.forEach(x=>hanger(g,x));
  }
  function jersey(g,id){
    const c=clubCloth[id];
    const panels=[[-.175,1.090],[-.184,1.465],[-.135,1.540],[-.130,1.687],[-.067,1.728],[0,1.618],
      [.067,1.728],[.130,1.687],[.135,1.540],[.184,1.465],[.175,1.090]];
    // Two panels around a real neck opening and both armholes. A slight drape separates the front and back.
    const p=(n,sgn=1,extra=0)=>{const [x,y]=n;return [x,y,sgn*(.046+.012*(1-Math.abs(x)/.19)+.024*(1.727-y))+extra];};
    for(const side of [-1,1]){
      const q=(x,y)=>p([x,y],side),b=side===1?c.fabric:c.fold;
      const rib=[[-.175,1.090],[-.184,1.465],[-.135,1.54],[-.13,1.687],[-.067,1.728],[0,side===1?1.618:1.692],
        [.067,1.728],[.13,1.687],[.135,1.54],[.184,1.465],[.175,1.090]];
      for(let i=0;i<rib.length;i++)g.tri(q(0,1.408),q(...rib[i]),q(...rib[(i+1)%rib.length]),b);
      const mark=(x,y)=>p([x,y],side,side*.0035);
      for(const s of [-1,1]){
        g.quad(mark(s*.175,1.094),mark(s*.184,1.464),mark(s*.150,1.496),mark(s*.149,1.195),c.panel);
        for(const [from,to] of [[1,2],[2,3]]){
          const a=rib[from],b=rib[to];line(g,mark,s*-a[0],a[1],s*-b[0],b[1],.012,c.piping);
        }
        line(g,mark,s*.067,1.728,0,rib[5][1],.014,c.band);
        line(g,mark,s*.067,1.720,0,rib[5][1]-.009,.007,c.piping);
        if(id==="mercado")for(const y of [1.236,1.260])line(g,mark,s*.153,y,s*.173,y+.012,.006,c.piping);
      }
      line(g,mark,-.166,1.112,.167,1.112,.006,c.band);
      const print=(x,y)=>p([-side*x,y],side,side*.009),top=(x,y)=>p([-side*x,y],side,side*.012),letters=side===1?id.toUpperCase():"MARLIN";
      word(g,print,letters,0,1.486,letters.length>4?.029:.044,c.digits,.13);
      for(const [x,n] of [[-.069,"1"],[.016,"4"]]){
        letter(g,print,n,x,1.300,.059,.121,.020,c.key);letter(g,top,n,x,1.300,.059,.121,.010,c.digits);
      }
      if(side===1&&id==="sol"){
        oval(g,print,.081,1.148,.027,.018,c.band,10);quad(g,top,.050,1.120,.113,1.146,c.fabric);
        line(g,top,.052,1.148,.112,1.148,.004,c.piping);
      }else if(side===1)for(let i=0;i<3;i++){
        const x=.050+i*.018;
        g.quad(print(x-.007,1.147),print(x,1.158),print(x+.007,1.147),print(x,1.136),c.piping);
      }
    }
    for(const i of [0,3,6,9,10]){
      const a=panels[i],b=panels[(i+1)%panels.length];g.quad(p(a,1),p(b,1),p(b,-1),p(a,-1),c.fold);
    }
  }
  function streetShirt(g){
    const rim=[[-.169,1.114],[-.174,1.444],[-.218,1.440],[-.241,1.529],[-.151,1.676],[-.060,1.708],
      [0,1.660],[.060,1.708],[.151,1.676],[.241,1.529],[.218,1.440],[.174,1.444],[.165,1.115]];
    for(const side of [-1,1]){
      const p=(x,y)=>[x,y,side*(.052+.012*Math.cos(x*15)+.010*(1.70-y))];
      for(let i=0;i<rim.length;i++)g.tri(p(0,1.416),p(...rim[i]),p(...rim[(i+1)%rim.length]),side===1?"#409687":"#397f74");
    }
    for(let i=0;i<rim.length;i++){
      const a=rim[i],b=rim[(i+1)%rim.length],p=(n,s)=>[n[0],n[1],s*(.052+.012*Math.cos(n[0]*15)+.010*(1.70-n[1]))];
      g.quad(p(a,1),p(b,1),p(b,-1),p(a,-1),"#317b70");
    }
    const p=face(.075);
    for(const s of [-1,1])g.tri(p(0,1.651),p(s*.065,1.708),p(s*.103,1.590),"#78ad93");
    line(g,p,0,1.132,0,1.652,.010,"#347a6a");
    for(let n=0;n<5;n++)oval(g,p,0,1.173+n*.09,.006,.007,cream,6);
    for(const [x,y] of [[-.115,1.567],[.082,1.508],[-.094,1.361],[.096,1.264],[-.044,1.190]]){
      line(g,p,x-.018,y-.025,x+.019,y+.029,.004,"#82ae92");
      g.tri(p(x-.002,y),p(x-.033,y+.016),p(x-.004,y+.018),"#a8b292");
      g.tri(p(x+.009,y+.012),p(x+.036,y+.013),p(x+.026,y+.033),"#769e87");
    }
  }
  function hanging(state,id){
    const current=state?.equipped||"street";
    return current!==id&&(id==="street"||Number(state?.[id]?.wins)>0);
  }
  const roomKey=state=>garments.reduce((mask,id,k)=>mask+(hanging(state,id)?1<<k:0),0);
  const roomInstalled=new WeakSet();
  function roomArt(model){
    if(roomInstalled.has(model))return;
    model("court-room-rail",clothesRail);model("court-room-street",streetShirt);
    for(const id of ["sol","mercado"])model("court-room-"+id,g=>jersey(g,id));
    roomInstalled.add(model);
  }
  function roomWorld(view,state,model,t){
    roomArt(model);view.draw("court-room-rail",rackX,0,rackZ,0,0,0,.52);
    for(const [k,id] of garments.entries())if(hanging(state,id))view.draw("court-room-"+id,rackX+hooks[k],0,rackZ,0,0,0,.52);
    for(const [k,id] of (state.owned||[]).entries())if(id!==state.equipped){
      const name="low-tide-fold/"+id;
      model(name,g=>{const col=BayThreadsArt.colors[id];g.box(0,.035,0,.28,.07,.23,col);g.box(.023,.079,-.03,.17,.02,.15,col,.06);g.box(-.094,.072,.036,.040,.007,.055,"#e5d5ab");});
      view.draw(name,rackX+(k-1.5)*.32,.11,rackZ+.047,0);
    }
  }
  function append(out,make,x=0,y=0,z=0,pitch=0){
    const at=out.vertices.length;make(out);
    const v=out.vertices,c=Math.cos(pitch),s=Math.sin(pitch);
    for(let i=at;i<v.length;i+=6){const a=v[i+1],b=v[i+2];v[i]+=x;v[i+1]=y+c*a-s*b;v[i+2]=z+s*a+c*b;}
  }
  function rackMesh(out,state,x=0,z=0){
    append(out,clothesRail,x,0,z);
    for(const [i,id] of garments.entries())if(hanging(state,id))append(out,id==="street"?streetShirt:g=>jersey(g,id),x+hooks[i],0,z);
  }
  const roomMapMesh=(g,state)=>rackMesh(g,state,rackX,rackZ);
  const ledger=(x,y)=>[.662-x,1.019+y,.222-y*.23];
  function pickupSign(g,id){
    const c=id==="sol"?dark:"#647664";
    quad(g,ledger,-.175,-.104,.175,.101,"#876e52");
    const top=(x,y)=>{const p=ledger(x,y);p[2]+=.004;return p;};
    quad(g,top,-.163,-.095,.163,.087,"#e0cca0");
    const print=(x,y)=>{const p=ledger(x,y);p[2]+=.006;return p;};
    word(g,print,"PICK UP",0,.010,.045,c,.14);line(g,print,-.145,-.011,.145,-.011,.004,"#ad8b69");
    word(g,print,"WINS",-.093,-.061,.025,c,.12);
    g.pole([.663,.875,.105],[.663,1.093,.204],.012,edge,5);
    g.box(.662,.878,.196,.327,.026,.083,wood);g.box(.662,1.116,.197,.091,.020,.021,tube);
  }
  function tallies(g,count){
    const p=(x,y)=>{const a=ledger(x,y);a[2]+=.008;return a;};
    const groups=Math.min(10,count);for(let i=0;i<groups;i++){
      const group=Math.floor(i/5),n=i%5,x=-.025+group*.093;
      if(n===4)line(g,p,x-.007,-.064,x+.065,-.038,.005,dark);
      else line(g,p,x+n*.018,-.076,x+n*.018+.009,-.035,.0065,dark);
    }
  }
  function practiceLabel(g,id){
    if(id==="sol"){
      const p=face(cardDepth+.092),ink=face(cardDepth+.094);
      quad(g,p,-.325,.906,.325,.986,dark);
      word(g,ink,"MADE",-.154,.931,.036,cream);word(g,ink,"TAKEN",.154,.931,.036,cream);
    }else{
      const p=(x,y)=>slatePoint(-x,y,.010),ink=(x,y)=>slatePoint(-x,y,.011);
      for(const x of [-.155,.155])quad(g,p,x-.105,.110,x+.105,.144,"#394f49");
      word(g,ink,"METIDAS",-.155,.112,.024,"#d9bd83");word(g,ink,"TIROS",.155,.112,.024,"#d9bd83");
    }
  }
  function station(g,id){apron(g);if(id==="sol")solScore(g);else mercadoScore(g);sideBench(g,id);pickupSign(g,id);}
  let register=null;
  const made=new Set();
  function modelOnce(name,build){
    if(register&&!made.has(name)){register(name,build);made.add(name);}
  }
  function install(model){
    if(register!==model){register=model;made.clear();}
    for(const id of ["sol","mercado"])modelOnce("court-station-"+id,g=>station(g,id));
    modelOnce("court-hand-chalk",g=>g.pole([0,0,0],[0,.029,-.032],.0065,chalk,5));
  }
  function panels(id,m,draw,game){
    const wins=Math.max(0,Math.min(10,Math.floor(game?.history?.wins||0)));
    if(wins)draw("court-record-"+wins,g=>tallies(g,wins),0,0,0,0);
    if(game?.mode==="practice")draw("court-practice-label-"+id,g=>practiceLabel(g,id),0,0,0,0);
    for(let i=0;i<2;i++){
      if(id==="sol"){
        const make=(num,y,z,angle)=>draw("court-card-"+i+"-"+num,g=>card(g,num,i),slots[i],y,z,angle);
        make(m.now[i],cardHeight,cardDepth,cardAngle);
        if(m.changed[i]&&m.phase<.83)make(m.old[i],cardHeight+.003,cardDepth+.013,pageAngle(m.phase));
      }else{
        const {n,ink}=marks(m,i),step=Math.round(ink*12);
        if(step>0)draw("court-chalk-"+n+"-"+step,g=>drawSlate(g,n,step/12),slateSlots[i],0,0,0);
        if(m.changed[i]&&m.phase>.24&&m.phase<.86){
          const h=handAt("ines",i,m,0);
          draw("court-hand-chalk",g=>g.pole([0,0,0],[0,.029,-.032],.0065,chalk,5),h[0],h[1]-.017,h[2]+.018,0);
        }
      }
    }
  }
  function world(list,see,t,hours,games){
    for(const game of games||[]){
      const site=game.site,o=origin(site);if(!see(o,100))continue;
      list.push(["court-station-"+site.id,o.x,o.y,o.z,o.yaw]);
      if(!see(o,55))continue;
      panels(site.id,display(game),(key,make,x,y,z,pitch)=>{
        modelOnce(key,make);const at=worldAt(o,x,y,z);list.push([key,at.x,at.y,at.z,o.yaw,pitch]);
      },game);
    }
  }
  // The same sewn fabric, half-flipped cards and table belongings are baked at map scale.
  // A small depth buffer preserves chalk strokes and hides the coat hangers inside the shirts.
  function bake(mesh,project,res){
    const v=mesh.vertices,a=[],colors=[],unit=1/res;
    if(!v.length)return null;
    let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
    for(let i=0;i<v.length;i+=6){
      const p=project(v[i],v[i+1],v[i+2]);
      left=Math.min(left,p[0]);right=Math.max(right,p[0]);top=Math.min(top,p[1]);bottom=Math.max(bottom,p[1]);
      a.push(p);if(i%18===0)colors.push([0,1,2].map(j=>Math.min(255,Math.round(v[i+3+j]*253))));
    }
    left=Math.floor(left*res)*unit-unit;top=Math.floor(top*res)*unit-unit;
    const w=Math.ceil((right-left)*res)+2,h=Math.ceil((bottom-top)*res)+2;
    const img=document.createElement("canvas");img.width=w;img.height=h;
    const context=img.getContext("2d"),image=context.createImageData(w,h),data=image.data,
      depth=new Float32Array(w*h);depth.fill(-Infinity);
    for(let j=0;j<a.length;j+=3){
      const P=a[j],Q=a[j+1],R=a[j+2],col=colors[j/3],x0=(P[0]-left)*res,y0=(P[1]-top)*res;
      const dx=(Q[0]-P[0])*res,dy=(Q[1]-P[1])*res,ex=(R[0]-P[0])*res,ey=(R[1]-P[1])*res,det=dx*ey-dy*ex;
      if(Math.abs(det)<.000001)continue;
      const xmin=Math.max(0,Math.floor(x0+Math.min(0,dx,ex))),xmax=Math.min(w-1,Math.ceil(x0+Math.max(0,dx,ex)));
      const ymin=Math.max(0,Math.floor(y0+Math.min(0,dy,ey))),ymax=Math.min(h-1,Math.ceil(y0+Math.max(0,dy,ey)));
      const inv=1/det,dz=Q[2]-P[2],ez=R[2]-P[2];
      for(let y=ymin;y<=ymax;y++)for(let x=xmin;x<=xmax;x++){
        const xx=x+.5-x0,yy=y+.5-y0,b=(xx*ey-yy*ex)*inv,c=(yy*dx-xx*dy)*inv;
        if(b<0||c<0||b+c>1)continue;
        const z=P[2]+b*dz+c*ez,k=x+y*w;if(z<depth[k]-.00002)continue;
        depth[k]=z;const i=4*k;data[i]=col[0];data[i+1]=col[1];data[i+2]=col[2];data[i+3]=255;
      }
    }
    context.putImageData(image,0,0);return {img,left,top,w:w*unit,h:h*unit};
  }
  function drawStamp(ctx,stamp,x,y,s){
    if(stamp)ctx.drawImage(stamp.img,x+stamp.left*s,y+stamp.top*s,stamp.w*s,stamp.h*s);
  }
  const rackStamps=new Map();
  function roomMap(ctx,room,state,px,py,s,t){
    const key=roomKey(state);
    if(!rackStamps.has(key)){
      const g=new BayMesh();rackMesh(g,state);
      rackStamps.set(key,bake(g,(x,y,z)=>[x,-.94*z-.34*y,.94*y-.34*z],180));
    }
    drawStamp(ctx,rackStamps.get(key),px(rackX),py(rackZ),s);
    for(const [k,id] of (state.owned||[]).entries())if(id!==state.equipped){
      const x=px(rackX+(k-1.5)*.32),y=py(rackZ+.047)-.06*s;
      ctx.fillStyle=BayThreadsArt.colors[id];ctx.fillRect(x-.14*s,y-.09*s,.28*s,.18*s);
      ctx.fillStyle="#e5d5ab";ctx.fillRect(x-.10*s,y-.065*s,.045*s,.04*s);
    }
  }
  const stations=new Map(),lastPanels=new Map();
  function projectAt(o){
    const c=Math.cos(o.yaw),n=Math.sin(o.yaw);
    return (x,y,z)=>{const X=x*c+z*n,Z=-x*n+z*c;return [X+.22*y,-Z-.27*y,y-.22*X-.27*Z];};
  }
  function mapKeeper(ctx,g,m,t,px,py,s){
    const p=g.keeper||keeperSpot(g.site),o=origin(g.site),project=projectAt(o);
    const point=(x,y,z)=>{const q=project(x,y,z);return [q[0],q[1]];};
    const circle=(x,y,z,rx,rz,color)=>{
      const q=point(x,y,z),c=Math.cos(o.yaw),n=Math.sin(o.yaw);
      ctx.save();ctx.transform(c,n,n,-c,q[0],q[1]);ctx.beginPath();ctx.ellipse(0,0,rx,rz,0,0,tau);
      ctx.fillStyle=color;ctx.fill();ctx.restore();
    };
    const stroke=(pts,color,w)=>{
      ctx.beginPath();ctx.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)ctx.lineTo(...pts[i]);
      ctx.lineWidth=w;ctx.lineCap="round";ctx.lineJoin="round";ctx.strokeStyle=color;ctx.stroke();
    };
    ctx.save();ctx.translate(px(o.x),py(o.z));ctx.scale(s,s);
    circle(.03,.005,-.6,.238,.162,"rgba(50,65,59,.24)");
    for(const sign of [-1,1]){
      circle(sign*.106,.062,-.552,.066,.136,dark);
      stroke([point(sign*.106,.115,-.589),point(sign*.106,.537,-.576),point(sign*.102,.97,-.600)],colors[p.id][2],.113);
    }
    const skin=colors[p.id][0],shirt=colors[p.id][1];
    stroke([point(0,.95,-.601),point(0,1.31,-.601)],shirt,.260);
    for(const side of [-1,1]){
      const i=side===1?0:1,h=handAt(p.id,i,m,t),elbow=[side*.265,1.20,-.525];
      stroke([point(side*.187,1.39,-.6),point(...elbow)],shirt,.103);
      stroke([point(...elbow),point(...h)],skin,.071);circle(...h,.041,.047,skin);
    }
    circle(0,1.32,-.60,.229,.124,shirt);
    if(p.id==="dee")stroke([point(.14,1.36,-.65),point(.11,1.19,-.49)],"#d2c8a7",.064);
    else stroke([point(-.11,1.35,-.49),point(.11,1.35,-.49)],"#667f74",.103);
    circle(0,1.62,-.578,.095,.113,skin);
    if(p.id==="dee"){
      circle(0,1.709,-.479,.106,.079,"#b38b61");circle(0,1.747,-.606,.107,.111,"#4b6664");
      stroke([point(-.036,1.739,-.501),point(.036,1.739,-.501)],cream,.014);
    }else{
      circle(0,1.702,-.685,.066,.058,"#534749");circle(0,1.745,-.619,.103,.103,"#514647");
      stroke([point(.034,1.708,-.703),point(.079,1.757,-.681)],red,.012);
    }
    ctx.restore();
  }
  function map(ctx,opt,px,py,s,visible){
    if(opt.mode!=="street")return;
    for(const g of opt.courts||[]){
      const site=g.site,id=site.id,o=origin(site),x=px(o.x),y=py(o.z);
      if(!visible(x,y,5*s))continue;
      const m=display(g),proj=projectAt(o),time=opt.t??opt.time??g.time??0;
      if(!stations.has(id)){
        const base=new BayMesh();station(base,id);stations.set(id,bake(base,proj,72));
      }
      drawStamp(ctx,stations.get(id),x,y,s);
      const phase=(m.changed[0]||m.changed[1])?Math.min(14,Math.floor(m.phase*15)):14;
      const key=[m.now.join(""),m.old.join(""),m.changed.join(""),phase,g.history?.wins||0,g.mode==="practice"].join("-");
      if(lastPanels.get(id)?.key!==key){
        const mesh=new BayMesh(),frame={...m,phase:phase===14?1:phase/15};
        panels(id,frame,(_name,build,X,Y,Z,tilt)=>append(mesh,build,X,Y,Z,tilt),g);
        lastPanels.set(id,{key,stamp:bake(mesh,proj,118)});
      }
      drawStamp(ctx,lastPanels.get(id).stamp,x,y,s);
      mapKeeper(ctx,g,m,time,px,py,s);
    }
  }
  window.BayCourtBench={spot,watchSpot,keeperSpot,get blocks(){return courtBlocks();},floor,colors,roles,dress,pose,install,world,map,
    roomPin,roomBlock,roomKey,roomWorld,roomMap,roomMapMesh};
})();
