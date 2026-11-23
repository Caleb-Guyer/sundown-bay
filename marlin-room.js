/* The Marlin's pool-court room. The overhead cutaway uses the same furniture as the street view. */
(() => {
  "use strict";
  const outside={x:131.05,z:-29.02,name:"Marlin Motel · Room 14"};
  const spawn={x:0,z:-3.04,yaw:0};
  const points={door:{x:0,z:-3.38},bed:{x:-.26,z:1.60},desk:{x:1.09,z:-.11}};
  const furniture={
    bed:{x:-1.64,z:1.92,w:1.82,d:2.72},
    nightstand:{x:-.25,z:3.24,w:.61,d:.60},
    desk:{x:2.63,z:.06,w:.79,d:2.08},
    chair:{x:1.83,z:.57,w:.56,d:.53},
    case:{x:-2.52,z:-2.16,w:.82,d:1.13},
    chest:{x:2.66,z:-2.78,w:.70,d:1.56},
    fern:{x:-2.58,z:-.26,w:.43,d:.43}
  };
  const ink="#434b4b",wood="#945f49",walnut="#774e40",brass="#d3a75f",cream="#f0deba";
  const jade="#588f86",quilt="#4e8c88",rose="#c87f6c",linen="#eedbbd",tile="#d3ba9b";
  const windowSpan={left:-.12,right:2.69,low:.92,high:2.55};
  const blockers=Object.values(furniture);

  function clear(x,z,r=.27){
    if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>3.10-r||Math.abs(z)>4-r)return false;
    for(const p of blockers){
      const dx=Math.max(0,Math.abs(x-p.x)-p.w/2),dz=Math.max(0,Math.abs(z-p.z)-p.d/2);
      if((dx===0&&dz===0)||Math.hypot(dx,dz)<r)return false;
    }
    return true;
  }
  function flat(g,x,z,w,d,y,col){g.quad([x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],col);}
  function back(g,x,y,z,w,h,col){g.quad([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],col);}
  function side(g,x,y,z,w,h,col){g.quad([x,y-h/2,z-w/2],[x,y-h/2,z+w/2],[x,y+h/2,z+w/2],[x,y+h/2,z-w/2],col);}
  function disc(g,x,y,z,rx,ry,col){
    for(let n=0;n<24;n++){const a=n*Math.PI/12,b=(n+1)*Math.PI/12;
      g.tri([x,y,z],[x+rx*Math.cos(a),y+ry*Math.sin(a),z],[x+rx*Math.cos(b),y+ry*Math.sin(b),z],col);}
  }
  function strip(g,a,b,w,col){
    const dx=b[0]-a[0],dy=b[1]-a[1],s=w/(2*Math.hypot(dx,dy));
    g.quad([a[0]-dy*s,a[1]+dx*s,a[2]],[a[0]+dy*s,a[1]-dx*s,a[2]],
      [b[0]+dy*s,b[1]-dx*s,b[2]],[b[0]-dy*s,b[1]+dx*s,b[2]],col);
  }
  function floor(g){
    flat(g,0,0,6.24,8.04,0,tile);
    for(let i=-3;i<=3;i++)flat(g,i*.85,0,.012,8,.001,"#bda58c");
    for(let i=-4;i<=4;i++)flat(g,0,i*.85,6.2,.012,.001,"#bda58c");
    for(let i=0;i<83;i++){
      const x=-2.99+(i*97%211)/35,z=-3.78+(i*71%227)/30;
      g.tri([x,.002,z],[x+.021+(i%3)*.008,.002,z+.006],[x-.012,.002,z+.018],i%2?"#b5a592":"#e6d0af");
    }
    flat(g,.03,-1.51,1.25,2.27,.008,"#b37561");
    flat(g,.03,-1.51,1.14,2.19,.009,"#dba37e");
    for(const z of [-2.45,-2.38,-2.19,-.83,-.64,-.57]){
      flat(g,.03,z,1.14,.052,.011,Math.abs(z+1.51)>.82?"#865d51":"#eed4a4");
    }
    for(let i=0;i<13;i++)for(const end of [-1,1])flat(g,-.52+i*.09,-1.51+end*1.16,.04,.09,.005,"#caaa89");
  }
  function gable(g){
    const win=windowSpan,left=-3.15,right=3.15,height=3.05,z=4.04;
    const wall=(a,b,low,high,col)=>g.box((a+b)/2,(low+high)/2,z,b-a,high-low,.12,col);
    wall(left,win.left,0,height,"#a5b6a5");wall(win.right,right,0,height,"#a5b6a5");
    wall(win.left,win.right,0,win.low,"#a5b6a5");wall(win.left,win.right,win.high,height,"#bdd0b5");
    g.box(0,.11,3.965,6.20,.22,.072,walnut);
    g.box(0,.231,3.963,6.19,.025,.077,"#c69f72");
    const center=(win.left+win.right)/2,width=win.right-win.left;
    for(const x of [win.left,win.right])g.box(x,1.75,3.966,.082,1.72,.18,"#80765c");
    for(const y of [win.low,win.high])g.box(center,y,3.955,width+.14,.084,.20,"#ddc5a2");
    g.box(center,win.low-.065,3.87,width+.26,.085,.36,cream);
    g.box(center,1.74,3.985,.055,1.56,.07,"#b8b59b");g.box(center,1.57,3.989,width,.045,.07,"#c1c1a9");
    g.pole([win.left-.19,2.69,3.77],[win.right+.18,2.69,3.77],.026,brass,6);
    // The panels gather against the jambs; the lower hems still billow out from the wall.
    for(const s of [-1,1]){
      const edge=s<0?win.left-.11:win.right+.11;
      for(let i=0;i<5;i++){
        const at=(j,y,spread,deep)=>[edge-s*j*spread,y,3.75-deep-(j%2)*.069];
        const col=["#d7ab88","#dfbd9c","#edcba4","#c59a7d","#e6bd96"][i];
        g.quad(at(i,2.66,.108,0),at(i+1,2.66,.108,0),at(i+1,1.39,.038,.025),at(i,1.39,.038,.025),col);
        g.quad(at(i,1.39,.038,.025),at(i+1,1.39,.038,.025),at(i+1,.74,.064,.046),at(i,.74,.064,.046),col);
      }
      g.box(edge-s*.093,1.38,3.67,.25,.055,.06,brass);
    }
  }
  function walls(g){
    g.box(0,1.52,-4.055,6.35,3.09,.11,"#e0c8ab");
    for(const s of [-1,1]){
      g.box(s*3.15,1.52,0,.10,3.09,8.14,s===1?"#dac4a1":"#dfbd9f");
      g.box(s*3.081,.102,0,.058,.20,8.01,walnut);
      g.box(s*3.078,.227,0,.065,.034,8.01,"#c39c71");
      g.box(s*3.07,2.85,0,.083,.058,8.03,"#d7ab81");
    }
    g.box(0,3.079,0,6.35,.092,8.16,"#ebd9b6");
    for(const [z,w] of [[-2.12,.9],[1.28,.55]]){g.cyl(0,2.99,z,w*.34,w*.32,.05,12,"#baab8e");g.cyl(0,2.955,z,w*.255,w*.188,.062,12,"#f0d9a3");}
    g.box(0,1.16,-3.978,1.44,2.32,.1,walnut);
    g.box(0,1.14,-3.914,1.28,2.22,.048,"#648f80");
    for(const y of [.43,1.18,1.84])back(g,0,y,-3.885,1.03,.042,"#92b0a0");
    g.box(-.45,1.01,-3.873,.106,.27,.058,brass);g.box(-.39,1.05,-3.825,.18,.046,.043,"#e1c183");
    g.cyl(0,.023,-3.61,.04,.04,.02,5,"#b7a083");
    // Packed weekender and the Marlin luggage rack, visible when turning back toward the door.
    const p=furniture.case;
    for(const x of [p.x-.32,p.x+.32]){
      g.pole([x,.035,p.z-.52],[x,.57,p.z+.52],.026,brass,5);
      g.pole([x,.035,p.z+.52],[x,.57,p.z-.52],.026,brass,5);
    }
    for(const z of [-.43,0,.43])g.box(p.x,.56,p.z+z,.69,.047,.11,"#815444");
    g.box(p.x,.73,p.z,.72,.30,.88,"#9d644c",.055);g.box(p.x,.91,p.z+.025,.67,.05,.84,"#b47c55",.055);
    for(const z of [-.28,.27])g.box(p.x,.945,p.z+z,.67,.018,.063,"#634c40",.055);
    side(g,-3.085,1.63,p.z,1.19,1.10,walnut);side(g,-3.073,1.63,p.z,1.06,.96,"#7d9f9b");
    side(g,-3.064,1.94,p.z+.16,.62,.055,"#bbcbc0");
    const ch=furniture.chest;
    g.box(ch.x,.54,ch.z,ch.w,.92,ch.d,"#9a7054");g.box(ch.x,.995,ch.z,ch.w+.04,.085,ch.d+.035,wood);
    for(const y of [.32,.67]){side(g,ch.x-.356,y,ch.z,1.36,.27,"#aa7e61");g.box(ch.x-.391,y+.03,ch.z,.064,.04,.31,brass);}
    // A paper key envelope beside a small striped transistor radio.
    g.box(ch.x,1.232,ch.z+.26,.33,.38,.55,"#506c67");
    for(let i=0;i<6;i++)side(g,ch.x-.17,1.11+i*.039,ch.z+.27,.40,.016,"#a1aa89");
    g.pole([ch.x,1.41,ch.z+.47],[ch.x+.13,1.84,ch.z+.54],.009,"#b6b6a5",4);
    flat(g,ch.x-.10,ch.z-.36,.26,.34,1.041,"#eee0b5");
    gable(g);
  }
  function fishPrint(g){
    const cx=-1.52,cy=2.11,z=3.857;
    back(g,cx,cy,z+.10,1.65,.97,walnut);back(g,cx,cy,z+.07,1.58,.90,cream);
    back(g,cx,cy,z+.04,1.44,.76,"#649492");disc(g,cx+.24,cy+.03,z+.034,.284,.284,"#d6a170");
    for(const offset of [-.24,-.16,-.095])back(g,cx+.24,cy+offset,z+.032,.56,.02,"#72a09a");
    const p=(x,y)=>[cx+x,cy+y,z];
    const strokes=[
      [[-.59,-.10],[-.43,-.06],[-.18,-.06],[-.41,-.14]], [[-.50,.14],[-.30,.017],[-.39,-.10]],
      [[-.40,-.082],[-.14,.087],[.07,.12],[.30,.093]], [[-.40,-.082],[.30,.093],[.14,-.028],[-.18,-.086]],
      [[-.21,.045],[-.18,.213],[-.086,.177],[.03,.10]], [[-.061,.005],[.016,-.121],[.10,.036]],
      [[.23,.093],[.62,.235],[.31,.055]]
    ];
    for(const shape of strokes)for(let i=1;i<shape.length-1;i++)g.tri(p(...shape[0]),p(...shape[i]),p(...shape[i+1]),"#31595e");
    strip(g,p(-.27,-.06),p(.24,.063),.012,"#e7c99b");
    for(const [x,y,w] of [[-.43,-.21,.28],[-.16,-.255,.38],[.32,-.19,.21]])back(g,cx+x,cy+y,z-.002,w,.013,"#c9c2a0");
  }
  function bed(g){
    const p=furniture.bed;
    for(const x of [p.x-.72,p.x+.72])for(const z of [p.z-1.17,p.z+1.17])g.box(x,.147,z,.14,.294,.14,walnut);
    g.box(p.x,.327,p.z,1.79,.20,2.73,wood);g.box(p.x,.552,p.z,1.85,.29,2.68,linen);
    g.box(p.x,.78,3.35,2,.91,.14,"#815a49");
    for(const [w,y] of [[1.77,1.21],[1.50,1.28],[1.22,1.34]])g.box(p.x,y,3.34,w,.071,.13,"#977451");
    for(const x of [p.x-.42,p.x+.39]){
      g.box(x,.746,2.94,.72,.14,.41,"#e8d5b3",x<p.x?.055:-.045);
      g.box(x,.807,2.95,.60,.077,.32,"#f1ddbd",x<p.x?.055:-.045);
    }
    g.box(p.x,.638,1.54,1.90,.14,1.97,quilt);
    const top=.712;
    for(const [z,w,c] of [[.74,.062,"#c39472"],[.82,.027,linen],[.91,.027,linen],[1.03,.105,"#89aa96"],[2.34,.065,"#b3b9a0"]]){
      flat(g,p.x,z,1.89,w,top,c);
      for(const s of [-1,1])side(g,p.x+s*.952,.641,z,w,.138,c);
    }
    for(let i=0;i<8;i++){
      const x=p.x-.83+i*.224;
      g.tri([x-.055,top,1.09],[x+.055,top,1.09],[x,top,1.17],"#c6c9a2");
    }
    g.quad([p.x-.94,.71,2.39],[p.x+.94,.71,2.30],[p.x+.94,.728,2.53],[p.x-.94,.728,2.58],"#dec9a7");
    const n=furniture.nightstand;
    g.box(n.x,.365,n.z,n.w,.56,n.d,wood);g.box(n.x,.674,n.z,n.w+.05,.071,n.d+.05,"#b79063");
    g.box(n.x,.45,n.z-.307,.47,.21,.025,"#ae7e59");g.box(n.x,.45,n.z-.334,.14,.028,.035,brass);
    g.cyl(n.x, .748,n.z,.134,.152,.06,9,walnut);g.cyl(n.x,.91,n.z,.07,.10,.29,9,jade);
    g.cyl(n.x,1.127,n.z,.14,.226,.27,10,"#e8bc86");g.cyl(n.x,1.268,n.z,.13,.146,.022,10,brass);
    flat(g,n.x+.19,n.z-.16,.13,.19,.714,"#b76150");
    fishPrint(g);
  }
  function desk(g){
    const p=furniture.desk,c=furniture.chair;
    for(const x of [p.x-.304,p.x+.298])for(const z of [p.z-.91,p.z+.89])g.box(x,.405,z,.078,.81,.088,walnut);
    g.box(p.x,.82,p.z,p.w,.094,p.d,wood);g.box(p.x,.665,p.z+.61,p.w-.07,.25,.65,"#aa7856");
    g.box(p.x-.37,.68,p.z+.61,.034,.044,.21,brass);
    for(const x of [c.x-.21,c.x+.21])for(const z of [c.z-.20,c.z+.20])g.box(x,.24,z,.053,.48,.061,walnut);
    g.box(c.x,.475,c.z,c.w,.08,c.d,wood);g.box(c.x,.535,c.z,c.w-.035,.089,c.d-.035,"#68998d");
    for(const z of [c.z-.20,c.z+.20])g.pole([c.x-.22,.45,z],[c.x-.30,.94,z],.031,walnut,5);
    g.box(c.x-.275,.83,c.z,.055,.22,.50,"#a57555");
    // The same orange order slip appears on the desk blotter and the little pegboard above it.
    flat(g,p.x-.015,-.07,.65,.85,.87,"#546e65");
    g.box(p.x-.075,.88,-.15,.45,.016,.32,"#dc996a",.12);
    for(let i=0;i<3;i++)g.box(p.x-.11,.891,-.204+i*.051,.22-i*.032,.004,.011,walnut,.12);
    g.box(p.x-.276,.894,.195,.028,.02,.28,"#dec47f",-.38);
    g.cyl(p.x+.11,.928,-.67,.14,.16,.095,12,"#ac8657");
    g.pole([p.x+.11,.94,-.67],[p.x+.12,1.27,-.67],.029,brass,7);
    g.pole([p.x+.12,1.27,-.67],[p.x-.05,1.34,-.65],.033,brass,7);
    g.cyl(p.x-.069,1.316,-.65,.075,.188,.108,9,"#477968");g.cyl(p.x-.069,1.255,-.65,.159,.16,.017,9,"#ffe3ac");
    g.cyl(p.x+.13,.965,.81,.069,.06,.193,9,"#ece0b4");g.cyl(p.x+.13,1.063,.81,.053,.053,.008,9,walnut);
    side(g,3.09,1.69,.16,1.47,.75,walnut);side(g,3.083,1.69,.16,1.405,.69,"#bc936b");
    for(const [z,y,w,h,col] of [[-.19,1.71,.33,.34,"#ecd5aa"],[.39,1.65,.49,.29,"#dd9f76"],[.26,1.86,.30,.12,"#799a86"]]){
      side(g,3.07,y,z,w,h,col);side(g,3.062,y+h*.35,z,.025,.028,ink);
      for(let i=0;i<2;i++)side(g,3.061,y-.012-i*.05,z-.012,w*.54,.012,"#9d826c");
    }
    // The desk fan's rotor turns behind the fixed wire guard.
    const fx=p.x+.10,fz=.39;
    g.cyl(fx,.90,fz,.10,.13,.057,9,ink);g.pole([fx,.92,fz],[fx,1.11,fz],.025,ink,5);
    for(let n=0;n<12;n++){
      const a=n*Math.PI/6,b=(n+1)*Math.PI/6,at=(r,t)=>[fx-.036,1.17+r*Math.sin(t),fz+r*Math.cos(t)];
      g.pole(at(.19,a),at(.19,b),.009,"#89988d",4);
    }
  }
  function rotor(g){
    const at=(r,t)=>[0,r*Math.sin(t),r*Math.cos(t)];
    for(let i=0;i<3;i++){
      const a=i*Math.PI*2/3;g.quad(at(.024,a),at(.153,a+.12),at(.157,a+.79),at(.049,a+.52),"#608b7c");
    }
  }
  function personalEffects(g){
    const p=furniture.fern;
    g.cyl(p.x,.065,p.z,.25,.213,.075,11,"#9d714f");
    g.cyl(p.x,.264,p.z,.236,.165,.38,12,"#bc7e61");
    g.cyl(p.x,.452,p.z,.252,.252,.058,12,"#d19771");g.cyl(p.x,.482,p.z,.210,.210,.015,12,"#6b5645");
    for(let i=0;i<11;i++){
      const a=i*2.40,dx=Math.cos(a),dz=Math.sin(a),length=.32+(i%4)*.071,height=.27+(i%3)*.118;
      const at=(dist,h,spread)=>[p.x+dx*dist-dz*spread,.47+h,p.z+dz*dist+dx*spread];
      const start=at(.042,0,0),top=at(length*.56,height,0),tip=at(length,height-.10,0);
      const left=at(length*.57,height-.029,-.068),right=at(length*.57,height-.023,.069);
      g.quad(start,left,tip,top,["#64826d","#526f62","#6f8e73"][i%3]);
      g.quad(start,top,tip,right,["#789577","#698773","#829572"][i%3]);
    }
    // Old citrus-crate art, a thumbtacked photograph and two pairs of pin holes left by earlier guests.
    const wall=-3.082,cz=-.17,cy=1.80;
    side(g,wall,cy,cz,.93,1.14,walnut);side(g,wall+.010,cy,cz,.86,1.07,"#e3c59a");
    side(g,wall+.018,cy+.056,cz,.733,.86,"#769d92");
    for(const [dz,dy,r] of [[-.09,-.035,.19],[.12,.080,.14]]){
      const x=wall+.025;
      for(let j=0;j<18;j++){
        const angle=j*Math.PI/9,next=(j+1)*Math.PI/9;
        g.tri([x,cy+dy,cz+dz],[x,cy+dy+Math.sin(angle)*r,cz+dz+Math.cos(angle)*r],[x,cy+dy+Math.sin(next)*r,cz+dz+Math.cos(next)*r],"#df9a58");
      }
    }
    const leafX=wall+.032;
    g.tri([leafX,cy+.20,cz+.11],[leafX,cy+.29,cz+.18],[leafX,cy+.28,cz+.30],"#4d7364");
    for(let j=0;j<3;j++)side(g,wall+.026,cy-.256-j*.036,cz-.038,.46-j*.072,.016,"#c7d0a8");
    side(g,wall,1.54,cz+.68,.27,.25,cream);side(g,wall+.006,1.553,cz+.68,.23,.18,"#ad8674");
    side(g,wall+.013,1.54,cz+.68,.22,.04,"#83948a");side(g,wall+.019,1.67,cz+.68,.036,.028,brass);
    for(const z of [cz-.64,cz+.87])side(g,wall,1.78,z,.016,.017,"#8d7a65");
    for(const [x,z,a] of [[-1.13,.28,.17],[-1.52,.22,-.21]]){
      g.box(x,.041,z,.148,.043,.28,"#9a7d59",a);g.box(x,.074,z+.009,.151,.059,.11,"#638b80",a);
    }
  }
  function litLamps(g){
    const p=furniture.nightstand,d=furniture.desk;
    g.cyl(p.x,1.127,p.z,.141,.228,.264,10,"#ffd79e");
    g.cyl(d.x-.069,1.249,-.65,.157,.157,.011,9,"#fff1c7");
    side(g,d.x-.170,1.11,d.z+.33,.022,.022,"#e39a68");
  }
  function windowScene(g,period){
    const palette={
      day:["#82b4c0","#d9d8b9","#8ea8a0","#5a8682","#81b9af","#597c70"],
      twilight:["#9e9db5","#f2bb94","#bb9b91","#8d7d87","#94ada3","#646f72"],
      night:["#344457","#766979","#465967","#334b52","#537d7f","#354e4e"],
      rain:["#818f9d","#afafb0","#85949b","#677e80","#7f9e98","#526a64"],
      "night-rain":["#374452","#59646c","#47545d","#354a50","#456368","#34494a"]
    }[period];
    const [sky,haze,far,close,water,palm]=palette;
    const rainy=period==="rain"||period==="night-rain",dark=period==="night"||period==="night-rain";
    for(const [v,col] of [[[ -16,-4,12],haze],[[16,-4,12],haze],[[16,8,12],sky],[[-16,-4,12],haze],[[16,8,12],sky],[[-16,8,12],sky]])g.face([v],col);
    if(!rainy){
      disc(g,dark?2.89:3.82,dark?3.07:period==="day"?4.24:2.67,11.91,.22,.22,dark?"#eee0b9":"#f8d49d");
    }
    for(const [x,w,h] of [[-5.7,.8,1.97],[-3.8,1.5,2.76],[-2.36,.88,2.52],[-.64,1.07,2.16],[.45,.62,2.75],[1.19,1.10,2.23],[3.62,1.05,2.52],[4.29,.54,2.06],[5.88,1.50,2.72],[7.92,.91,2.24]]){
      back(g,x,h/2,10.2,w,h,far);
      if(dark)for(let j=0;j<4;j++)back(g,x-w*.27+(j%2)*w*.37,h-.21-Math.floor(j/2)*.28,10.15,.063,.058,j%3?"#c7a483":"#879391");
    }
    back(g,0,.60,8.1,20,1.20,close);back(g,0,1.20,8.07,20,.07,"#a5af9e");
    flat(g,0,7.1,18,3.9,.10,water);
    const x=2.92,z=7.60;
    g.pole([x+.31,.12,z],[x+.08,1.48,z],.061,palm,6);
    g.pole([x+.08,1.48,z],[x-.07,2.49,z],.058,palm,6);
    const base=[x-.07,2.49,z];
    for(let i=0;i<8;i++){
      const a=i*.86,dx=Math.cos(a),dz=Math.sin(a),end=1.23+(i%3)*.15;
      const mid=[base[0]+dx*.51,2.77+(i%2)*.12,z+dz*.51];
      const tip=[base[0]+dx*end,2.3+(i%3)*.16,z+dz*end];
      const side=[mid[0]-.08*dz,mid[1]-.08,mid[2]+.08*dx];
      g.tri(base,mid,side,palm);g.tri(mid,tip,side,palm);
    }
    if(rainy)for(let i=0;i<9;i++){
      const xx=.09+(i*29%73)/31,y=1.02+(i*19%47)/35;
      strip(g,[xx,y,3.998],[xx+.023,y+.073+(i%3)*.03,3.998],.011,"#b3c2ba");
    }
  }
  function timeBand(weather={}){
    if(weather.rain>.44)return weather.night>.78?"night-rain":"rain";
    if(weather.night>.78)return "night";
    const minute=weather.minute??1030;
    return minute<480||minute>960?"twilight":"day";
  }
  function porch(g){
    g.box(.50,.088,0,1.01,.019,1.19,"#92785a");
    for(let j=0;j<5;j++)g.box(.22+j*.14,.102,0,.018,.009,1.07,"#b99a73");
    g.box(.03,2.43,.97,.066,.42,.30,"#375f60");
    g.box(.074,2.43,.97,.042,.32,.20,"#ffe0a0");
    for(const y of [2.26,2.43,2.61])g.box(.10,y,.97,.05,.024,.27,brass);
    // A brass room key hangs beside the original painted number.
    g.box(.059,1.58,.90,.065,.26,.20,brass);
    g.box(.096,1.59,.90,.027,.14,.08,jade);
  }
  function install(model){
    model("marlin14-floor",floor);model("marlin14-walls",walls);model("marlin14-bed",bed);model("marlin14-desk",desk);
    model("marlin14-effects",personalEffects);model("marlin14-fan",rotor);model("marlin14-lamps",litLamps);
    model("marlin14-porch",porch);
    for(const p of ["day","twilight","night","rain","night-rain"])model("marlin14-window-"+p,g=>windowScene(g,p));
  }
  function draw(view,weather={}){
    view.draw("marlin14-window-"+timeBand(weather),0,0,0,0,0,0,.56);
    for(const model of ["marlin14-floor","marlin14-walls","marlin14-bed","marlin14-desk","marlin14-effects"])view.draw(model,0,0,0,0,0,0,.52);
    view.draw("marlin14-fan",furniture.desk.x+.073,1.17,.39,0,performance.now()*.006,0,.52);
    if(weather.night>.38)view.draw("marlin14-lamps",0,0,0,0,0,0,.97);
  }
  function outsideWorld(list,see){
    if(see(outside,62))list.push(["marlin14-porch",129.718,0,-29.02,0,0,0,.8]);
  }

  // Paint a high-angle cutaway once on entering the room or changing the light. Only the actor moves.
  let cutaway=null,plate=null;
  function mapWalls(g){
    // The real back wall and drapes remain, with the nearer walls cut down to their skirting.
    gable(g);
    for(const s of [-1,1])g.box(s*3.12,.14,0,.13,.28,8.1,walnut);
    for(const x of [-1,1])g.box(x*1.88,.14,-4.01,2.44,.28,.13,walnut);
    flat(g,0,-3.92,1.30,.17,.028,jade);
    const p=furniture.case,c=furniture.chest;
    g.box(p.x,.67,p.z,p.w,.47,p.d,"#ac7957",.055);
    for(const z of [-.32,.28])g.box(p.x,.912,p.z+z,.80,.015,.079,walnut,.055);
    g.box(c.x,.54,c.z,c.w,.96,c.d,wood);g.box(c.x,1.19,c.z+.31,.31,.31,.5,"#667e72");
    flat(g,c.x-.085,c.z-.34,.24,.32,1.023,cream);
  }
  function mapTriangles(){
    if(cutaway)return cutaway;
    const mesh=new BayMesh();
    for(const make of [floor,mapWalls,bed,desk,personalEffects])make(mesh);
    const out=[],v=mesh.vertices;
    const rgb=(n)=>Math.min(255,Math.max(0,Math.round(n*252)));
    for(let i=0;i<v.length;i+=18){
      const a=[],depth=[];
      for(let n=0;n<3;n++){
        const k=i+n*6,x=v[k],y=v[k+1],z=v[k+2];
        a.push(x,-z*.94-y*.34);depth.push(y*.94-z*.34);
      }
      if(Math.abs((a[2]-a[0])*(a[5]-a[1])-(a[3]-a[1])*(a[4]-a[0]))<.000005)continue;
      out.push({a,depth,color:[rgb(v[i+3]),rgb(v[i+4]),rgb(v[i+5])]});
    }
    cutaway=out;return cutaway;
  }
  function paintCutaway(c,scale,ox,oy){
    // Bedclothes and terrazzo share long triangles. Keep per-pixel depth when baking the 2D plate.
    const left=Math.max(0,Math.floor(ox-scale*3.23)),top=Math.max(0,Math.floor(oy-scale*5));
    const w=Math.min(c.canvas.width-left,Math.ceil(6.46*scale)+2),h=Math.min(c.canvas.height-top,Math.ceil(8.86*scale)+2);
    if(w<=0||h<=0)return;
    const output=c.getImageData(left,top,w,h),pixels=output.data,depth=new Float32Array(w*h);depth.fill(-Infinity);
    for(const {a,depth:d,color} of mapTriangles()){
      const x0=ox-left+a[0]*scale,y0=oy-top+a[1]*scale,x1=ox-left+a[2]*scale,y1=oy-top+a[3]*scale,x2=ox-left+a[4]*scale,y2=oy-top+a[5]*scale;
      const vx=x1-x0,vy=y1-y0,wx=x2-x0,wy=y2-y0,inv=1/(vx*wy-wx*vy);
      const xmin=Math.max(0,Math.floor(Math.min(x0,x1,x2))),xmax=Math.min(w-1,Math.ceil(Math.max(x0,x1,x2)));
      const ymin=Math.max(0,Math.floor(Math.min(y0,y1,y2))),ymax=Math.min(h-1,Math.ceil(Math.max(y0,y1,y2)));
      for(let y=ymin;y<=ymax;y++)for(let x=xmin;x<=xmax;x++){
        const dx=x+.5-x0,dy=y+.5-y0,b=(dx*wy-wx*dy)*inv,e=(vx*dy-dx*vy)*inv;
        if(b<0||e<0||b+e>1)continue;
        const height=d[0]+b*(d[1]-d[0])+e*(d[2]-d[0]),i=y*w+x;
        if(height<depth[i]-.00001)continue;
        depth[i]=height;pixels[i*4]=color[0];pixels[i*4+1]=color[1];pixels[i*4+2]=color[2];pixels[i*4+3]=255;
      }
    }
    c.putImageData(output,left,top);
  }
  function drawPlate(c,w,h,scale,ox,oy,period){
    const dark=period==="night"||period==="night-rain",border=c.createRadialGradient(ox,oy,scale,ox,oy,Math.max(w,h)*.76);
    border.addColorStop(0,dark?"#495d5c":"#798b83");border.addColorStop(1,dark?"#223538":"#3d5351");
    c.fillStyle=border;c.fillRect(0,0,w,h);
    c.save();c.translate(ox,oy);c.scale(scale,scale);
    c.fillStyle=dark?"#394e50":"#657d75";c.fillRect(-11,-6.12,22,1.08);
    c.fillStyle=dark?"#566d69":"#91a398";c.fillRect(-11,-5.56,22,.035);
    c.fillStyle=dark?"#586562":"#94a094";c.fillRect(-9,3.68,18,1.12);
    for(const side of [-1,1]){
      c.save();c.scale(side,1);
      c.fillStyle=dark?"#3a4a49":"#596d64";c.fillRect(3.2,-4.70,6.28,8.48);
      c.fillStyle=dark?"#425553":"#687b71";c.fillRect(3.27,-4.53,6.12,8.14);
      c.fillStyle=dark?"#526560":"#7b8980";c.fillRect(6.92,-3.50,1.81,2.70);
      c.fillStyle=dark?"#5b6a62":"#87948a";c.fillRect(7.01,-3.43,.71,.40);c.fillRect(7.84,-3.43,.73,.40);
      c.fillStyle=dark?"#415753":"#647d73";c.fillRect(6.92,-2.76,1.81,1.96);
      c.fillStyle=dark?"#58645d":"#7d877a";c.fillRect(5.83,-3.47,.60,.55);c.fillRect(3.45,-.81,.72,2.07);
      c.fillStyle=dark?"#495a53":"#728073";c.fillRect(5.62,1.0,1.22,2.10);
      c.fillStyle=dark?"#70817a":"#a5afa1";c.fillRect(5.60,3.68,1.29,.065);
      c.fillStyle=dark?"#4a5b58":"#788d83";
      for(let i=0;i<5;i++)c.fillRect(1.22+i*1.82,3.78,.018,1.01);
      for(const x of [2.21,7.89]){
        c.fillStyle=dark?"#475854":"#76867a";c.fillRect(x+.08,4.38,.39,.09);
        c.fillStyle=dark?"#738178":"#a9b0a2";c.fillRect(x,4.28,.18,.22);
      }
      c.restore();
    }
    c.fillStyle="#395a5b";c.fillRect(-.12,-4.65,2.81,.9);
    c.fillStyle=dark?"#7c8d88":period==="twilight"?"#e4b49a":period==="rain"?"#acb7b0":"#b5d1c0";
    c.fillRect(-.10,-4.61,2.76,.18);
    c.restore();
    paintCutaway(c,scale,ox,oy);
    c.save();c.translate(ox,oy);c.scale(scale,scale);
    // Pools of tungsten on the floor survive the night in a low-power, unlit renderer.
    if(dark||period==="rain"){
      c.fillStyle=dark?"rgba(37,56,67,.18)":"rgba(63,80,84,.09)";c.fillRect(-3.03,-3.71,6.06,7.42);
      for(const [x,y] of [[-.25,-2.92],[2.49,.48]]){
        const glow=c.createRadialGradient(x,y,.02,x,y,.87);
        glow.addColorStop(0,"rgba(255,207,127,.35)");glow.addColorStop(1,"rgba(255,207,127,0)");
        c.fillStyle=glow;c.fillRect(x-.87,y-.87,1.74,1.74);
      }
    }
    c.restore();
  }
  function map(ctx,person,weather={}){
    if(!ctx||!person)return;
    const {width:w,height:h}=ctx.canvas;
    const scale=Math.min(w*.87/6.65,h*.90/9.22),ox=w/2,oy=h*.538,period=timeBand(weather);
    if(!plate||plate.width!==w||plate.height!==h||plate.period!==period){
      const buffer=document.createElement("canvas");buffer.width=w;buffer.height=h;
      drawPlate(buffer.getContext("2d"),w,h,scale,ox,oy,period);
      plate={width:w,height:h,period,buffer};
    }
    ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(plate.buffer,0,0);
    ctx.translate(ox+person.x*scale,oy-person.z*.94*scale);ctx.scale(scale,scale);
    const shadow=ctx.createRadialGradient(.035,-.018,.008,.035,-.018,.35);shadow.addColorStop(0,"rgba(54,48,45,.48)");shadow.addColorStop(1,"rgba(54,48,45,0)");
    ctx.fillStyle=shadow;ctx.fillRect(-.33,-.38,.73,.72);
    ctx.rotate(person.yaw||0);
    ctx.fillStyle="#f3dd9f";ctx.beginPath();ctx.moveTo(0,-.55);ctx.lineTo(.10,-.36);ctx.lineTo(-.10,-.36);ctx.closePath();ctx.fill();
    ctx.fillStyle="#3e514d";ctx.fillRect(-.145,-.018,.095,.17);ctx.fillRect(.05,-.018,.095,.17);
    ctx.fillStyle="#357e73";ctx.beginPath();ctx.ellipse(0,-.085,.238,.145,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#ad7757";ctx.beginPath();ctx.ellipse(0,-.17,.125,.138,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle="#443e39";ctx.beginPath();ctx.ellipse(0,-.134,.125,.108,0,0,Math.PI*2);ctx.fill();
    ctx.restore();
  }
  window.BayMarlinRoom={outside,spawn,points,clear,install,draw,map,outsideWorld};
})();
