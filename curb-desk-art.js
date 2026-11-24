/* Bay Wire's curbside tape cart. The television's glass and its viewer face local +Z. */
(() => {
  "use strict";
  const ink="#263a40",blue="#385460",blueLight="#51717a",red="#ab4e3e",brick="#833f36",cream="#eeddb5";
  const wood="#9d7850",metal="#a7ac9d",steel="#697875",rubber="#333e41",glass="#34494b";
  const mark="#c09965",paper="#e9dabb",newsprint="#526060";
  const head={x:.178,y:1.006,w:.518,h:.327,z:.319};
  const zFace=z=>(u,y)=>[-u,y,z];
  const glyph={
    A:["0110","1001","1111","1001","1001"],B:["1110","1001","1110","1001","1110"],
    C:["0111","1000","1000","1000","0111"],E:["1111","1000","1110","1000","1111"],
    H:["1001","1001","1111","1001","1001"],I:["111","010","010","010","111"],
    N:["1001","1101","1011","1001","1001"],O:["0110","1001","1001","1001","0110"],
    R:["1110","1001","1110","1010","1001"],T:["11111","00100","00100","00100","00100"],
    U:["1001","1001","1001","1001","0110"],W:["10001","10001","10101","10101","01010"],
    Y:["10001","01010","00100","00100","00100"]
  };
  function caption(g,text,face,u,y,scale,color){
    const widths=[...text].map(ch=>glyph[ch]?.[0].length||2);
    let px=u-(widths.reduce((a,b)=>a+b,0)+widths.length-1)*scale*.5;
    for(let i=0;i<text.length;i++){
      const rows=glyph[text[i]];
      if(rows)rows.forEach((row,j)=>{
        for(const run of row.matchAll(/1+/g)){
          const a=px+run.index*scale,b=a+run[0].length*scale,top=y+(2.5-j)*scale;
          g.quad(face(a,top),face(b,top),face(b,top-scale),face(a,top-scale),color);
        }
      });
      px+=(widths[i]+1)*scale;
    }
  }
  function cable(g,points,r,col,n=5){
    for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,col,n);
  }
  function rectangle(x,y,w,h,r,z){
    const l=x-w/2,a=x+w/2,b=y-h/2,t=y+h/2;
    return [[l+r,b,z],[a-r,b,z],[a,b+r,z],[a,t-r,z],[a-r,t,z],[l+r,t,z],[l,t-r,z],[l,b+r,z]];
  }
  function skirt(g,a,b,color){
    for(let i=0;i<a.length;i++){const j=(i+1)%a.length;g.quad(a[i],a[j],b[j],b[i],color);}
  }
  function cap(g,points,col){for(let i=1;i<points.length-1;i++)g.tri(points[0],points[i],points[i+1],col);}
  function cart(g){
    // Two mismatched casters and a folding handle give the old equipment cart its silhouette.
    for(const x of [-.551,.551])for(const z of [-.278,.278]){
      g.pole([x-.036,.078,z],[x+.036,.078,z],.073,rubber,8);
      g.box(x,.152,z,.056,.096,.056,steel);
      g.pole([x-.039,.078,z],[x+.039,.078,z],.025,metal,8);
      g.box(x,.43,z,.041,.53,.041,blue);
    }
    g.box(0,.212,0,1.296,.054,.709,blue);
    g.box(0,.243,0,1.240,.013,.662,"#8c8066");
    g.box(0,.673,0,1.428,.061,.819,blueLight);
    g.box(0,.710,0,1.398,.027,.787,wood);
    for(const x of [-.650,.649])g.box(x,.729,0,.017,.012,.779,metal);
    cable(g,[[-.552,.247,-.276],[-.552,.803,-.298],[-.552,.866,-.368],[-.279,.866,-.368],[-.279,.813,-.301]],.017,steel,6);
    g.pole([-.502,.866,-.368],[-.33,.866,-.368],.025,rubber,8);
    // Travel battery in its open red return crate. A lead loops back up to the cabinet.
    g.box(.28,.367,-.053,.455,.235,.345,"#4a5450");g.box(.28,.491,-.053,.474,.019,.352,ink);
    g.box(.168,.51,-.041,.04,.018,.06,red);g.box(.398,.51,-.041,.04,.018,.06,metal);
    g.box(.28,.270,-.05,.536,.045,.40,red);
    for(const z of [-.252,.15]){
      for(const y of [.304,.402,.479])g.box(.28,y,z,.54,.026,.018,red);
      for(const x of [.022,.135,.39,.54])g.box(x,.39,z,.025,.184,.019,brick);
    }
    for(const x of [.018,.543])g.box(x,.483,-.05,.024,.034,.404,red);
    cable(g,[[.396,.52,-.05],[.542,.490,-.159],[.558,.325,-.219],[.615,.313,-.298],
      [.63,.455,-.332],[.606,.636,-.310],[.568,.728,-.328],[.427,.842,-.267]],.009,rubber,5);
    // Shallow sheet-metal toolbox strapped against the other side, with white grease-pencil tally marks.
    g.box(-.302,.348,0,.472,.196,.319,"#75695b");g.box(-.302,.451,0,.482,.029,.327,"#a09277");
    for(const x of [-.489,-.103])g.box(x,.361,.165,.029,.173,.012,"#5d5148");
    for(let i=0;i<4;i++)g.box(-.373+i*.028,.354,.163,.009,.052,.009,cream);
    // A laminated strip hung from the front lip, tilted lettering on a red ink slug.
    g.box(-.038,.591,.382,1.171,.139,.021,ink);
    g.box(-.038,.594,.395,1.128,.100,.006,red);
    caption(g,"ON THE CURB",zFace(.399),.038,.594,.016,cream);
    for(const x of [-.581,.503])g.box(x,.619,.399,.024,.015,.008,metal);
    // Tapered moulded casing, recessed pearl speaker, tuning wheel, and a slightly curved tube mask.
    for(const x of [-.025,.453])g.box(x,.738,-.022,.099,.031,.354,rubber);
    const back=rectangle(.201,.984,.511,.383,.052,-.30);
    const broad=rectangle(.202,1.005,.776,.506,.037,.118);
    const nose=rectangle(.202,1.005,.776,.498,.035,.282);
    cap(g,back,"#5f5d56");skirt(g,back,broad,"#79776b");skirt(g,broad,nose,"#898678");cap(g,nose,"#888677");
    const mask=rectangle(head.x,head.y,.60,.408,.035,.289);
    const ring=rectangle(head.x,head.y,.55,.361,.026,.306);
    const tube=rectangle(head.x,head.y,.529,.338,.021,.317);
    cap(g,mask,ink);skirt(g,mask,ring,"#4e5a58");skirt(g,ring,tube,"#263b40");cap(g,tube,glass);
    for(let i=0;i<6;i++)g.box(.542,1.089+i*.012,.288,.066,.005,.004,"#565a51");
    g.pole([.543,.996,.282],[.543,.996,.310],.038,rubber,12);
    g.pole([.543,.996,.308],[.543,.996,.312],.023,metal,9);
    cable(g,[[.545,.996,.314],[.552,1.010,.314]],.004,ink,4);
    g.box(.54,.907,.287,.069,.034,.008,ink);g.box(.555,.905,.294,.018,.012,.004,"#c5dc91");
    for(let i=0;i<6;i++)g.box(.545,1.141,-.131+i*.030,.03,.009,.016,"#5d605a");
    g.box(.192,.783,.287,.191,.020,.005,"#60625b");g.box(.188,.783,.291,.105,.004,.004,metal);
    // A bent antenna, red electrical tape at the break and the owner's repaint along one side.
    cable(g,[[.427,1.247,.060],[.448,1.337,-.003],[.600,1.524,-.157]],.006,metal,5);
    g.pole([.479,1.377,-.036],[.497,1.398,-.055],.009,red,6);
    for(const [x,z,w] of [[-.07,.205,.057],[.107,.115,.092],[.402,.237,.037]])g.box(x,1.259,z,w,.004,.012,"#aba594",.07);
    // Hand-painted paper masthead, clipped to two wire legs over the tube.
    for(const x of [-.116,.482])g.pole([x,1.247,-.083],[x,1.414,-.100],.012,steel,5);
    g.box(.182,1.402,-.084,.790,.164,.023,red);
    g.box(.182,1.408,-.069,.771,.136,.007,cream);
    caption(g,"BAY WIRE",zFace(-.062),-.182,1.414,.018,ink);
    g.box(.182,1.355,-.062,.655,.007,.004,red);
    for(const x of [-.143,.501])g.box(x,1.472,-.066,.045,.021,.016,steel);
    // The folded edition sits within arm's reach of the screen. Its exposed half has a photo, columns and a crease.
    const page=(x,z,w,d,y,col)=>g.box(x,y,z,w,.004,d,col);
    g.box(-.419,.744,.087,.435,.037,.337,"#a49e86",-.024);
    page(-.417,.082,.425,.328,.765,paper);page(-.418,.184,.414,.039,.768,blue);
    page(-.512,.054,.124,.108,.769,"#788b84");page(-.514,.062,.111,.053,.772,"#b5b8a0");
    for(let col=0;col<2;col++)for(let i=0;i<5;i++)page(-.390+col*.079,.130-i*.023,.063-(i%3)*.005,.005,.769,newsprint);
    page(-.419,-.037,.405,.006,.768,"#bdad8c");
  }
  function printFace(g){
    const {x,y,z,w,h}=head,rad=.016;
    const bounds=rectangle(x,y,w,h,rad,z);
    for(let i=1;i<bounds.length-1;i++)for(const v of [bounds[0],bounds[i],bounds[i+1]]){
      g.vertices.push(...v,.5-(v[0]-x)/w,.5-(v[1]-y)/h,0);
    }
  }
  function world(list,model,site,t){
    model("wire-curb-cart",cart);model("wire-crt-face",printFace);
    list.push(["wire-curb-cart",site.x,site.y??.075,site.z,site.yaw||0]);
  }
  const refresh=new WeakMap();
  function screen(view,site,canvas,version){
    if(!canvas?.width||!view.gl||view.lost)return;
    let cache=refresh.get(view);
    if(!cache){
      const texture=document.createElement("canvas");texture.width=256;texture.height=128;
      cache={texture,ctx:texture.getContext("2d"),revision:0};refresh.set(view,cache);
    }
    if(cache.source!==canvas||cache.version!==version){
      cache.ctx.drawImage(canvas,0,0,256,128);cache.source=canvas;cache.version=version;cache.revision++;
    }
    view.drawPrint("wire-crt-face",cache.texture,cache.revision,site.x,site.y??.075,site.z,site.yaw||0);
  }
  function rounded(g,points,depth,color){
    const back=points.map(([x,y])=>[x,y,-depth]),front=points.map(([x,y])=>[x,y,depth]);
    skirt(g,back,front,color);cap(g,front,color);cap(g,back,color);
  }
  function handset(g){
    const p=rectangle(0,0,.169,.085,.008,0).map(([x,y])=>[x,y]);
    rounded(g,p,.0075,"#374548");
    cap(g,rectangle(0,0,.160,.078,.006,.008),"#536d68");
    cap(g,rectangle(0,0,.150,.070,.006,-.008),"#8ca9a6");
    g.box(.052,.018,.014,.043,.040,.008,"#364745");
    for(const [x,y] of [[.060,.024],[.044,.012]]){
      g.pole([x,y,.017],[x,y,.020],.008,ink,8);g.pole([x,y,.020],[x,y,.021],.004,"#818f8d",6);
    }
    g.box(-.050,.027,-.009,.013,.006,.003,red);
  }
  const poses=new WeakMap(),palms=[[-.237,.978,.053],[.237,.978,.053]];
  const blend=(a,b,u)=>a.map((n,i)=>n+(b[i]-n)*u);
  function aimHand(limb,hand){
    const a=limb.shoulder,k=limb.elbow,dx=hand[0]-a[0],dy=hand[1]-a[1],dz=hand[2]-a[2];
    const dist=Math.max(.0001,Math.hypot(dx,dy,dz)),x=dx/dist,y=dy/dist,z=dz/dist;
    const l=limb.arm.length,m=limb.forearm.length,along=(l*l-m*m+dist*dist)/(2*dist);
    const hint=[limb.side*.76,-.78,-.18],dot=hint[0]*x+hint[1]*y+hint[2]*z;
    const hx=hint[0]-dot*x,hy=hint[1]-dot*y,hz=hint[2]-dot*z,h=Math.sqrt(Math.max(0,l*l-along*along))/(Math.hypot(hx,hy,hz)||1);
    k[0]=a[0]+x*along+hx*h;k[1]=a[1]+y*along+hy*h;k[2]=a[2]+z*along+hz*h;
    limb.arm.aim(a,k);limb.forearm.aim(k,hand);
  }
  function pose(mesh,lift,t=0){
    if(!mesh)return false;
    const amount=Math.max(0,Math.min(1,lift||0)),old=poses.get(mesh),revision=mesh.lastRevision;
    if(!amount&&!old)return false;
    if(old?.revision===revision){
      if(old.amount===amount&&old.t===t)return false;
      mesh.sides.forEach((l,i)=>{l.arm.m.set(old.base[2*i]);l.forearm.m.set(old.base[2*i+1]);});
    }
    if(!amount){poses.delete(mesh);if(old.revision===revision){mesh.skin();return true;}return false;}
    const base=old?.revision===revision?old.base:mesh.sides.flatMap(l=>[l.arm.m.slice(),l.forearm.m.slice()]);
    const u=amount*amount*(3-2*amount),rest=mesh.sides[1].forearm.map(palms[1],[]);
    const at=blend([rest[0]-.075,rest[1]+.005,rest[2]+.018],mesh.head.map([.012,1.536,.271],[]),u);
    at[1]+=.004*u*Math.sin(t*1.7);
    mesh.sides.forEach((l,i)=>{
      const target=blend(l.forearm.map(palms[i],[]),[at[0]+l.side*.076,at[1]-.004,at[2]-.003],i===1?1:u);
      const wrist=[target[0],target[1]+.019,target[2]-.010];
      for(let j=0;j<5;j++){aimHand(l,wrist);const actual=l.forearm.map(palms[i],[]);for(let k=0;k<3;k++)wrist[k]+=target[k]-actual[k];}
    });
    mesh.skin();poses.set(mesh,{base,revision,amount,t,at});return true;
  }
  function phone(list,model,p,ground,mesh,lift){
    if(!(lift>.01))return;
    const at=poses.get(mesh)?.at;if(!at)return;
    model("wire-press-phone",handset);
    const a=p.yaw||0,cs=Math.cos(a),sn=Math.sin(a);
    list.push(["wire-press-phone",p.x+at[0]*cs+at[2]*sn,ground+at[1],p.z-at[0]*sn+at[2]*cs,a]);
  }
  function begin(c,px,py,s,p){c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw||0);c.scale(s,-s);}
  function rect(c,x,z,w,d,col){c.fillStyle=col;c.fillRect(x,z,w,d);}
  function line(c,points,width,color){
    c.strokeStyle=color;c.lineWidth=width;c.lineJoin="round";c.lineCap="round";c.beginPath();c.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke();
  }
  function map(c,px,py,s,site,t){
    begin(c,px,py,s,site);
    rect(c,-.65,-.43,1.39,.84,"rgba(34,48,51,.30)");rect(c,-.714,-.409,1.428,.819,blue);
    rect(c,-.688,-.385,1.376,.77,wood);
    rect(c,-.637,-.085,.435,.337,"#a49e86");rect(c,-.629,-.08,.422,.328,paper);
    rect(c,-.621,.160,.409,.045,blue);rect(c,-.586,.005,.129,.112,"#75908d");
    for(let i=0;i<4;i++)rect(c,-.423,.006+i*.032,.165,.011,newsprint);
    rect(c,-.06,-.30,.518,.28,"#6f7064");rect(c,-.187,-.125,.776,.42,"#8f8b7a");
    rect(c,-.187,.20,.776,.145,ink);rect(c,head.x-.259,.221,.518,.108,glass);
    rect(c,.514,.219,.053,.043,metal);rect(c,.522,.294,.038,.014,"#b3c890");
    rect(c,-.205,-.104,.773,.067,cream);rect(c,-.158,-.087,.658,.014,red);
    line(c,[[.42,-.005],[.45,-.09],[.60,-.19]],.014,steel);c.restore();
  }
  function mapScreen(c,px,py,s,site,canvas){
    if(!canvas?.width)return;begin(c,px,py,s,site);
    c.translate(head.x+.259,.221);c.scale(-1,1);c.drawImage(canvas,0,0,.518,.108);c.restore();
  }
  function mapPhone(c,px,py,s,p,lift){
    if(!(lift>.015))return;
    const u=Math.min(1,lift),hue=p.skin||["#af7353","#754b39","#dbab87","#925c46","#c58166","#694737"][p.style%6]||"#aa7859";
    const x=.19-.18*u,z=.10+.22*u;
    begin(c,px,py,Math.max(3,s*1.8),p);
    for(const side of [-1,1])line(c,[[side*.19,.026],[side*.229,.097],[x+side*.078,z-.02]],.064,hue);
    rect(c,x-.093,z-.035,.186,.070,ink);rect(c,x-.079,z-.037,.147,.016,"#aed1c8");rect(c,x+.045,z+.011,.023,.017,metal);
    c.restore();
  }
  window.BayCurbDeskArt=Object.freeze({world,map,pose,phone,mapPhone,screen,mapScreen});
})();
