/* What the regulars carry on Route 6. Garments follow the same bones as their street clothes. */
(() => {
  "use strict";
  const tau=Math.PI*2,clamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v)),mix=(a,b,f)=>a+(b-a)*f;
  const ink="#394e51",linen="#ddcca5",ochre="#dba856",aluminum="#aeb7ae";
  const light="#e0dfc8",deep="#586665",cane="#b7804f",straw="#d2a269";
  const capAt=[0,1.70,0],chestAt=[0,1.32,0],eyesAt=[0,1.65,0];
  const specs={
    basket:{piece:"produce-basket",wear:"market-kerchief",bone:"head",at:capAt,side:1},
    tin:{piece:"lunch-pail",wear:"work-braces",bone:"chest",at:chestAt,side:-1},
    film:{piece:"film-carrier",wear:"cinema-pass",bone:"chest",at:chestAt,side:1},
    blueBag:{piece:"indigo-shopper",wear:"round-frames",bone:"head",at:eyesAt,side:-1},
    stripeBag:{piece:"striped-shopper",wear:"knit-shirt",bone:"chest",at:chestAt,side:1},
    driver:{wear:"operator-cap",bone:"head",at:capAt}
  };
  function rider(p){
    if(p.id==="marta"||p.id==="driver"||p.name?.startsWith("Marta"))return "driver";
    if(p.prop==="bag")return p.id==="ruben"||p.name?.startsWith("Rub")?"stripeBag":"blueBag";
    return Object.hasOwn(specs,p.prop)?p.prop:null;
  }
  function ring(x,y,z,rx,rz,n=8){
    return Array.from({length:n},(_,i)=>{const a=tau*i/n;return [x+rx*Math.cos(a),y,z+rz*Math.sin(a)];});
  }
  function join(g,a,b,colors){
    for(let i=0;i<a.length;i++){const j=(i+1)%a.length;g.quad(a[i],a[j],b[j],b[i],colors[i%colors.length]);}
  }
  function face(g,points,col){
    for(let i=1;i+1<points.length;i++)g.tri(points[0],points[i],points[i+1],col);
  }
  function line(g,points,r,col,sides=4){
    for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,col,sides);
  }
  function guava(g,x,y,z,r,color,leaf){
    const a=ring(x,y-r*.80,z,r*.51,r*.54,7),b=ring(x,y+r*.02,z,r,r*.93,7),c=ring(x,y+r*.68,z,r*.67,r*.65,7);
    join(g,a,b,[color,color,"#97a15d",color]);join(g,b,c,[color,color,"#c5c16b",color]);face(g,c,color);
    g.box(x+.002,y+r*.72,z,.008,.01,.005,"#735c3b");
    if(leaf)g.tri([x,y+r*.75,z],[x+.032,y+r*.86,z+.009],[x+.046,y+r*.71,z-.010],"#688456");
  }
  function basket(g){
    const colors=[cane,"#ae794c",straw,cane,"#bc8c58"],floor=ring(0,-.332,0,.100,.129),lip=ring(0,-.183,0,.127,.162);
    join(g,floor,lip,colors);face(g,floor,"#896a46");
    for(const [y,rx,rz,w] of [[-.326,.102,.131,.007],[-.294,.108,.140,.005],[-.259,.117,.148,.006],[-.217,.123,.156,.006],[-.184,.129,.163,.011]]){
      join(g,ring(0,y-w,0,rx,rz),ring(0,y+w,0,rx,rz),[w>.008?"#b68b51":straw,"#bf935f"]);
    }
    for(let i=0;i<8;i++){
      const a=tau*(i+.30)/8;
      g.pole([.103*Math.cos(a),-.324,.133*Math.sin(a)],[.127*Math.cos(a),-.181,.163*Math.sin(a)],.0055,"#996f48");
    }
    face(g,ring(0,-.195,0,.123,.156),"#87704c");
    for(const [x,y,z,r,c,l] of [[-.049,-.185,-.069,.052,"#a5ac65",0],[.037,-.175,-.094,.046,"#c5b366",1],
      [.047,-.179,.009,.057,"#b0ae64",0],[-.051,-.176,.030,.050,"#b5b963",0],[.001,-.174,.102,.050,"#bbad60",1],
      [-.013,-.130,-.031,.051,"#bdbe6d",1]])guava(g,x,y,z,r,c,l);
    const arc=[[-.014,-.189,-.140],[-.014,-.066,-.115],[-.008,-.001,-.055],[.003,.006,.045],[.012,-.060,.113],[.012,-.188,.143]];
    line(g,arc,.012,"#a27c4b",5);line(g,arc.slice(2,4),.0155,"#6d6652",5);
  }
  function lunchPail(g){
    // A pressed-steel lunch pail, with a domed roll-top, two brass latches and a paper name strip.
    const zProfile=[[-.138,-.170],[-.120,-.116],[-.083,-.084],[.074,-.084],[.119,-.113],[.142,-.169]];
    const end=x=>[...zProfile.map(([z,y])=>[x,y,z]),[x,-.285,.136],[x,-.285,-.130]];
    const left=end(-.094),right=end(.094);join(g,left,right,["#487270","#6f9390","#7c9d94","#6c8e84","#456c67","#4d7571","#537774","#597d72"]);
    face(g,left,"#527a72");face(g,right,"#63867a");
    g.box(0,-.174,0,.198,.014,.283,aluminum);g.box(0,-.283,.003,.194,.013,.273,"#99a397");
    for(const z of [-.084,.084]){
      g.box(-.099,-.179,z,.013,.039,.026,"#b69c69");g.box(-.105,-.175,z,.008,.009,.018,"#cfbd8c");
    }
    g.box(-.096,-.233,.012,.004,.034,.116,"#d1c398");
    for(const [z,w] of [[-.015,.031],[.015,.017],[.033,.008]])g.box(-.099,-.233,z,.005,.003,w,"#766e55");
    const h=[[0,-.086,-.082],[0,-.027,-.069],[0,-.006,-.046],[0,-.006,.053],[0,-.026,.072],[0,-.086,.087]];
    line(g,h,.009,"#78908a");line(g,h.slice(2,4),.014,"#574d41",6);
  }
  function filmCarrier(g){
    // The embossed lid faces sideways while Miki walks; the red transit seal crosses its rim.
    const loop=(x,r)=>Array.from({length:14},(_,i)=>[x,-.193+r*Math.cos(i*tau/14),r*Math.sin(i*tau/14)]);
    const a=loop(-.040,.123),b=loop(.040,.123);
    join(g,a,b,["#8b9690","#a6afa7","#929c94"]);face(g,a,"#a8b1a6");face(g,b,"#bec3b4");
    for(const side of [-1,1]){
      const at=side*.043;join(g,loop(at,.128),loop(side*.035,.126),[light,aluminum]);join(g,loop(at+side*.001,.114),loop(at,.106),[aluminum]);
      join(g,loop(at,.085),loop(at+side*.002,.081),["#8b9b94"]);
    }
    g.box(.045,-.194,-.001,.004,.072,.142,"#d7c99e");g.box(.049,-.173,-.006,.003,.012,.128,"#8b5850");
    for(const [y,len] of [[-.193,.082],[-.204,.055],[-.216,.068]])g.box(.048,y,-.014,.003,.004,len,deep);
    for(const z of [-.124,.124])g.box(0,-.196,z,.087,.028,.015,"#ae6953");
    const strap=[[0,-.183,-.123],[0,-.073,-.085],[0,-.008,-.033],[0,-.008,.034],[0,-.074,.089],[0,-.185,.126]];
    line(g,strap,.009,"#6a5548");line(g,strap.slice(2,4),.013,"#9a7f60");
  }
  function tote(g,striped){
    const width=striped?.112:.097,half=striped?.134:.147,body=striped?"#b57555":"#536780",side=striped?"#9c614b":"#405870",seam=striped?"#d6ad79":"#9d9f8b";
    const contour=(y,w,d)=>[[-w,y,-d*.76],[-w*.70,y,-d],[w*.73,y,-d*.96],[w,y,-d*.66],
      [w,y,d*.63],[w*.69,y,d],[-w*.70,y,d*.94],[-w,y,d*.72]];
    const base=contour(-.345,width*.81,half*.84),belt=contour(-.292,width,half),rim=contour(-.145,width*.84,half*.95);
    join(g,base,belt,[side,body,body,side,body,body,side,body]);join(g,belt,rim,[body,side,body,body,side,body,body,side]);
    face(g,base,side);join(g,rim,contour(-.158,width*.86,half*.96),[seam]);
    face(g,contour(-.159,width*.81,half*.91),striped?"#736454":"#43485b");
    if(striped){
      for(const [y,col,h] of [[-.275,"#e2c390",.019],[-.246,"#7d9690",.013],[-.226,"#e9cfa1",.008]]){
        const f=(y+.292)/.147;join(g,contour(y-h*.5,width*(1-.16*f)+.002,half*(1-.05*f)+.002),contour(y+h*.5,width*(1-.16*f)+.002,half*(1-.05*f)+.002),[col]);
      }
      const rollBottom=ring(.006,-.142,-.016,.054,.080,8),rollTop=ring(.006,-.113,-.016,.038,.060,8);
      join(g,rollBottom,rollTop,["#b88854","#c69b5e"]);face(g,rollTop,"#d0a86e");
      g.box(.006,-.111,-.029,.049,.003,.007,linen,.24);g.box(.007,-.111,-.002,.041,.003,.007,linen,.24);
    }else{
      const x=width*.98+.003;
      g.quad([-x,-.275,-.055],[-x,-.280,.067],[-x,-.183,.061],[-x,-.177,-.047],"#9da49f");
      g.tri([-x-.002,-.259,-.039],[-x-.002,-.259,.046],[-x-.002,-.206,-.001],"#657e85");
      g.tri([-x-.003,-.259,-.038],[-x-.003,-.259,.004],[-x-.003,-.221,-.020],"#dae0c9");
      g.box(-.012,-.142,-.019,.084,.049,.151,"#bbccc4",.09);g.box(-.016,-.112,-.018,.078,.015,.145,"#dfdecc",.09);
      g.box(-.017,-.101,-.016,.068,.009,.138,"#d1d3bf",.09);g.box(-.018,-.095,-.060,.062,.003,.013,"#90a8a1",.09);
    }
    for(const k of [-1,1]){
      const xx=k*width*.77;const h=[[xx,-.146,-.087],[xx*.75,-.050,-.064],[k*.009,-.006,-.042],[k*.009,-.006,.039],
        [xx*.75,-.055,.061],[xx,-.147,.082]];
      line(g,h,striped?.008:.010,striped?"#bca883":"#7f8f95");
    }
  }
  function operatorCap(g){
    const lower=ring(0,.014,.001,.113,.105,10),upper=ring(0,.054,-.006,.124,.117,10),crown=ring(.002,.107,-.023,.105,.096,10);
    join(g,lower,upper,[ink,"#375e5e"]);join(g,upper,crown,["#537a74","#50716a","#5b7e75","#477674"]);face(g,crown,"#61867a");
    join(g,ring(0,.029,.001,.118,.113,10),ring(0,.037,0,.119,.113,10),[ochre]);
    const brim=[[-.103,.030,.062],[-.095,.021,.139],[-.066,.014,.178],[.010,.012,.187],[.070,.015,.174],[.098,.022,.133],[.102,.030,.061]];
    face(g,brim,"#334850");const bottom=brim.map(p=>[p[0],p[1]-.007,p[2]]);join(g,bottom,brim,["#53615a"]);
    g.quad([-.024,.054,.114],[0,.043,.120],[.024,.055,.115],[0,.080,.111],"#dfb66d");
    g.box(0,.059,.118,.026,.007,.004,ink);
  }
  function kerchief(g){
    const a=ring(0,-.006,-.002,.104,.103),b=ring(0,.031,-.005,.113,.110),c=ring(0,.063,-.013,.108,.112);
    join(g,a,b,["#ad6955","#a85f53","#ba7758"]);join(g,b,c,["#af6b50","#b1745e"]);join(g,ring(0,.022,-.005,.115,.111),ring(0,.032,-.006,.116,.111),[linen]);
    for(const [x,y,z] of [[.078,.048,.071],[-.088,.046,.060],[.075,.044,-.089],[-.106,.050,.007]])
      g.box(x,y,z,.014,.012,.012,"#e0ba79",.37);
    g.box(-.081,.022,-.087,.047,.038,.043,"#ab6752",.4);
    g.tri([-.082,.021,-.094],[-.117,-.079,-.097],[-.059,-.018,-.122],"#b57a5f");
    g.tri([-.085,.018,-.085],[-.128,-.035,-.104],[-.125,-.004,-.072],linen);
  }
  function strap(g,x,y,xx,yy,w,z,col){
    const n=Math.hypot(xx-x,yy-y),a=(yy-y)/n*w*.5,b=(x-xx)/n*w*.5;
    g.quad([x+a,y+b,z],[xx+a,yy+b,z],[xx-a,yy-b,z],[x-a,y-b,z],col);
  }
  function braces(g){
    for(const k of [-1,1]){
      strap(g,k*.143,.104,k*.106,-.196,.025,.123,"#ae865f");
      strap(g,k*.143,.102,k*.108,-.150,.008,.125,"#d6b67d");
      strap(g,k*.143,.102,k*.035,-.150,.027,-.122,"#b18a61");
      g.box(k*.124,-.048,.125,.032,.033,.009,"#8b8e7e");g.box(k*.124,-.045,.131,.019,.017,.004,"#74634a");
    }
  }
  function filmPass(g){
    for(const k of [-1,1])strap(g,k*.071,.103,.021,-.038,.010,.125,"#9e5a55");
    g.box(.021,-.038,.126,.013,.025,.008,aluminum);g.box(.025,-.091,.130,.069,.094,.01,"#b4b8a5",-.04);
    g.box(.024,-.091,.136,.059,.081,.005,linen);g.box(.024,-.068,.14,.058,.016,.004,"#a2655b");
    g.box(.012,-.104,.140,.016,.022,.003,"#5e7979");g.box(.037,-.099,.140,.016,.005,.003,deep);
  }
  function glasses(g){
    for(const side of [-1,1]){
      const cx=side*.048,z=.108;
      const outline=Array.from({length:10},(_,i)=>[cx+.034*Math.cos(i*tau/10),.012+.027*Math.sin(i*tau/10),z]);
      line(g,[...outline,outline[0]],.0042,"#54504d");
      line(g,[[side*.079,.018,.107],[side*.099,.023,.062],[side*.106,.006,-.012]],.0036,"#705e50");
    }
    line(g,[[-.016,.015,.109],[0,.020,.112],[.016,.015,.109]],.0035,"#75614c");
  }
  function knitShirt(g){
    for(const side of [-1,1]){
      strap(g,side*.111,.093,side*.089,-.122,.024,.122,"#d9bf8b");
      strap(g,side*.129,.092,side*.108,-.119,.008,.123,"#79968c");
    }
    g.quad([-.094,-.003,.129],[-.041,-.003,.129],[-.042,-.043,.129],[-.080,-.052,.129],"#b5a77e");
    g.box(-.066,-.002,.131,.055,.007,.007,linen);
  }
  function badge(g){
    g.box(-.091,-.001,.125,.081,.022,.013,"#bb995d");g.box(-.091,-.001,.133,.065,.015,.005,linen);
    g.box(-.094,-.001,.137,.041,.003,.004,ink);g.box(.087,-.019,.122,.078,.049,.008,"#426560");
    g.box(.095,.007,.126,.010,.036,.011,"#c1c0a7");g.box(.084,.005,.127,.004,.023,.006,"#6a7f80");
    for(const side of [-1,1]){g.box(side*.155,.105,-.015,.064,.014,.082,ink);g.box(side*.143,.114,.004,.036,.006,.018,ochre);}
  }
  function install(model){
    const meshes={"produce-basket":basket,"lunch-pail":lunchPail,"film-carrier":filmCarrier,"indigo-shopper":g=>tote(g,false),
      "striped-shopper":g=>tote(g,true),"operator-cap":operatorCap,"operator-badge":badge,"market-kerchief":kerchief,
      "work-braces":braces,"cinema-pass":filmPass,"round-frames":glasses,"knit-shirt":knitShirt};
    for(const [key,build] of Object.entries(meshes))model("route6-"+key,build);
  }
  function seated(p){
    return clamp(Number.isFinite(p.sit)?p.sit:p.motion?.ride?.seat??(p.stage==="ride"||p.stage==="seated"?1:0));
  }
  function hipShift(p,bus,sit){
    const assigned=Number.isInteger(p.seat)?window.BayCityBusArt?.seats[p.seat]:p.seat;
    const seat=p.motion?.ride?.seatY??((assigned?.top??assigned?.y??(rider(p)==="driver"?1.03:.965))-(window.BayCityBusArt?.floor??.49));
    return (seat-.94)*sit;
  }
  function transform(list,key,p,loc,yaw=0,tilt=0,roll=0){
    const sn=Math.sin(p.yaw||0),cs=Math.cos(p.yaw||0);
    list.push(["route6-"+key,p.x+cs*loc[0]+sn*loc[2],(p.y||0)+loc[1]+(p.motion?.lift||0),p.z-sn*loc[0]+cs*loc[2],
      (p.yaw||0)+yaw,tilt,roll]);
  }
  function garment(list,p,bus,key,bone,anchor,sit){
    const joint=p.mesh?.[bone];
    if(joint&&p.mesh.lastRevision===p.motion?.revision){
      const m=joint.m,at=joint.map(anchor,[]);
      transform(list,key,p,at,Math.atan2(-m[8],m[0]),Math.atan2(-m[6],m[5]),Math.asin(clamp(m[4],-1,1)));return;
    }
    const h=hipShift(p,bus,sit),phase=(p.motion?.phase||0)*tau,w=p.motion?.weight||0;
    transform(list,key,p,[anchor[0],anchor[1]+h+.022*w*Math.sin(phase*2),anchor[2]+sit*.018],0,sit*.035,0);
  }
  function palm(p,bus,side,sit){
    const m=p.motion,phase=(m?.phase||0)*tau,w=m?.weight||0,limb=p.mesh?.sides?.[side>0?1:0];
    if(limb&&p.mesh.lastRevision===p.motion?.revision)return limb.forearm.map([side*.238,.977,.052],[]);
    const shift=hipShift(p,bus,sit);
    return [side*mix(.254,.12,sit),mix(.968+.025*w*Math.cos(phase*2),.968+shift-.27,sit),
      mix(.068+side*.168*w*Math.cos(phase+.12),.22,sit)];
  }
  function grip(p,bus,spec,sit){
    const side=spec.side,hand=palm(p,bus,side,sit),phase=(p.motion?.phase||0)*tau,w=p.motion?.weight||0;
    // On the bus the fingers support the rim or the side of the parcel on the knees.
    const flat=spec.piece==="film-carrier"?1:0,high=spec.piece==="produce-basket"?.19:.16;
    return {at:[hand[0]+side*mix(.027,-.040,sit),hand[1]-.009+high*sit,hand[2]+.018+sit*.118],
      yaw:side*(.035+.055*w*Math.cos(phase-.34))*(1-sit)+side*.12*sit,
      tilt:side*.094*w*Math.cos(phase-.25)*(1-sit)-.17*sit,
      roll:side*.055*(1-sit)+(flat?-side*1.15:side*.055)*sit};
  }
  function world(list,p,bus,t){
    if(!p)return;const id=rider(p),spec=specs[id];if(!spec)return;
    const sit=seated(p);garment(list,p,bus,spec.wear,spec.bone,spec.at,sit);
    if(id==="driver"){garment(list,p,bus,"operator-badge","chest",chestAt,sit);return;}
    const item=grip(p,bus,spec,sit);
    transform(list,spec.piece,p,item.at,item.yaw,item.tilt,item.roll);
  }
  function disc(c,x,z,rx,rz,color){
    c.fillStyle=color;c.beginPath();c.ellipse(x,z,rx,rz,0,0,tau);c.fill();
  }
  function rect(c,x,z,w,d,color){c.fillStyle=color;c.fillRect(x-w/2,z-d/2,w,d);}
  function map(c,opt,px,py,s,p,bus,t){
    if(!p||opt?.mode!=="street"||s<3)return;
    const id=rider(p),spec=specs[id];if(!spec)return;
    const sit=seated(p),size=s*mix(1.48,1,sit);
    c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw||0);c.scale(size,-size);
    if(id==="driver"){
      disc(c,0,.102,.106,.083,ink);disc(c,0,.016,.113,.108,"#4a716d");rect(c,0,.092,.040,.014,ochre);
    }else{
      const item=grip(p,bus,spec,sit),side=spec.side;
      // Street-scale symbol can be read beside the figure and remains inside its own seat.
      c.save();c.translate(item.at[0]+side*.080*(1-sit),item.at[2]);c.rotate(-item.yaw);
      if(id==="basket"){
        disc(c,0,0,.132,.163,cane);disc(c,0,.004,.117,.143,straw);
        for(const [x,z,col] of [[-.057,-.064,"#97a761"],[.026,-.082,"#b9af62"],[.063,.025,"#a0aa63"],[-.044,.038,"#b9ba65"],[.004,.095,"#a4a963"]])disc(c,x,z,.046,.047,col);
        rect(c,0,0,.019,.277,"#9f8157");
      }else if(id==="tin"){
        rect(c,0,0,.191,.273,"#547b74");rect(c,0,0,.171,.235,"#83a097");rect(c,0,0,.025,.158,"#675c4c");
      }else if(id==="film"){
        disc(c,0,0,mix(.060,.121,sit),.128,aluminum);rect(c,.003,.003,mix(.037,.089,sit),.081,linen);rect(c,0,-.048,mix(.112,.23,sit),.018,"#a96c58");
      }else{
        const stripe=id==="stripeBag";disc(c,0,0,.095,.144,stripe?"#bb865e":"#586e85");
        rect(c,0,0,.129,.108,stripe?"#749288":"#c7bda1");rect(c,0,0,.019,.16,stripe?linen:"#788b8c");
      }
      c.restore();
      if(id==="basket"){disc(c,-.038,-.008,.095,.062,"#b37359");rect(c,-.056,-.069,.123,.025,linen);}
      if(id==="tin"||id==="stripeBag")for(const side of [-1,1])rect(c,side*.128,.044,.018,.065,id==="tin"?"#bc995f":"#ddc494");
      if(id==="film")rect(c,.056,.112,.038,.036,linen);
      if(id==="blueBag")rect(c,0,.090,.161,.013,"#5b5751");
    }
    c.restore();
  }
  window.BayBusRidersArt={install,world,map};
})();
