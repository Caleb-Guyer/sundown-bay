/* Salt Creek Drawbridge in Pelican Cut. Original Sundown Bay bridge, signage and tender house artwork. */
(() => {
  "use strict";
  const span=BayCutArt.span,{half,yaw}=span,deck=2.168,angle=72*Math.PI/180;
  const steel="#48716c",green="#6c9789",light="#a4b6a1",dark="#374e4f",rubber="#424d4a";
  const ochre="#d5ae72",cream="#e5d8b1",silver="#9fa99d",concrete="#a39f8d";
  const pi=Math.PI,tau=2*pi,clamp=n=>Math.max(0,Math.min(1,n)),mix=(a,b,t)=>a+(b-a)*t;
  const ease=v=>{const t=clamp(v);return t*t*(3-2*t);};

  function platformY(x,z){
    if(x<151||x>191||z<232||z>263)return null;
    const {u,s}=span.local(x,z);
    if(s< -20.01||s> -11.99||u<4.59||u>13.21)return null;
    // The inside apron follows the existing south approach; the console and house have a level floor.
    const original=.16+1.98*ease((z-238)/15);
    return mix(original,1.83,ease((u-4.6)/2.45));
  }
  const ground=(u,s)=>{
    const p=span.at(u,s);
    return platformY(p.x,p.z)??BayCut.height(p.x,p.z);
  };
  const blocks=[],camera=[];
  function block(list,u,s,w,d,bottom,top){
    const p=span.at(u,s);
    list.push({x:p.x,z:p.z,w,d,top,bottom,streetProp:true});
  }
  // Small interior boxes preserve the clear outside walkway around the rotated watch house.
  for(const s of [-17.84,-16.3,-14.74])block(blocks,11.12,s,2.45,2.45,0,5.28);
  block(camera,11.2,-16.27,5.82,6.15,4.54,5.66);
  for(const sign of [-1,1])for(const s of [-13,13])block(blocks,sign*5.82,s,.34,.38,0,4.15);
  blocks.push({x:155.25,z:222.6,w:.16,d:.16,bottom:0,top:3.33,streetProp:true});

  const floorPlane=y=>(x,z)=>[x,y,z],sidePlane=u=>(s,y)=>[u,y,s],front=s=>(u,y)=>[u,y,s];
  const marks=[[-28,8.7],[25,8.32],[61,9.4]];
  function rect(g,plane,x0,y0,x1,y1,color){g.quad(plane(x0,y0),plane(x1,y0),plane(x1,y1),plane(x0,y1),color);}
  function disc(g,plane,x,y,r,color,steps=10){
    const c=plane(x,y);
    for(let i=0;i<steps;i++){const a=tau*i/steps,b=tau*(i+1)/steps;
      g.tri(c,plane(x+Math.cos(a)*r,y+Math.sin(a)*r),plane(x+Math.cos(b)*r,y+Math.sin(b)*r),color);}
  }
  function plate(g,plane,t,x,y,k,col){BayCutArt.signText(g,t,k,col,(a,b)=>plane(x+a,y+b));}
  function pipe(g,pts,r,c,n=5){for(let i=1;i<pts.length;i++)g.pole(pts[i-1],pts[i],r,c,n);}

  function leaf(g){
    const length=half-.032;
    // Each model starts at its own trunnion. The underside, paint and handrails travel with it.
    g.box(0,-.11,length*.5,11.58,.22,length,"#6d7770");
    rect(g,floorPlane(.007),-5.61,.03,5.61,length,"#818982");
    for(const x of [-4.08,-1.57,1.57,4.08]){
      rect(g,floorPlane(.010),x-.38,.11,x+.38,length-.18,"#777f78");
      rect(g,floorPlane(.013),x-.12,.12,x+.15,length-.40,"#788079");
    }
    // Narrow section lines across steel floor panels; expansion fingers meet at the centre.
    for(let z=.64;z<length-.1;z+=.77)rect(g,floorPlane(.016),-5.38,z,5.38,z+.035,"#627069");
    for(const sign of [-1,1]){
      const u=sign*5.78;
      rect(g,floorPlane(.022),sign*.11-.047,.05,sign*.11+.047,length-.10,"#d7b476");
      rect(g,floorPlane(.023),sign*5.04-.063,.08,sign*5.04+.063,length-.14,"#d8d5b8");
      // A riveted plate girder below the carriageway tapers toward the meeting joint.
      const a=u-.14,b=u+.14,end=length-.03;
      for(const x of [a,b])g.quad([x,-.10,.10],[x,-.93,.10],[x,-.46,end],[x,-.10,end],steel);
      g.quad([a,-.93,.10],[b,-.93,.10],[b,-.46,end],[a,-.46,end],dark);
      g.box(u,.082,length*.5,.31,.17,length,"#9c9f86");
      const posts=[.22,2.30,4.38,6.46,length-.16];
      for(let i=0;i<posts.length;i++){
        const z=posts[i],h=i===0?1.03:i===posts.length-1?.91:1.15;
        g.box(u,h*.46+.10,z,.124,h*.92,.142,green);
        if(i+1<posts.length){
          const next=posts[i+1],y2=i+1===posts.length-1?1.00:1.25;
          g.pole([u,h+.10,z],[u,y2,next],.080,green,5);
          g.pole([u,.47,z],[u,.47,next],.042,light,4);
          g.pole([u,.22,z],[u,y2-.10,next],.043,steel,4);
        }
        g.box(u,-.40,z,.34,.38,.10,steel);
        const face=sidePlane(u+sign*.152);
        for(const h2 of [-.19,-.43])disc(g,face,z,h2,.043,light,6);
      }
      g.box(u,.37,.30,.21,.23,.105,ochre);
    }
    for(const z of [.36,2.42,4.52,6.63,length-.25]){
      g.box(0,-.34,z,11.41,.24,.14,steel);
      g.pole([-5.32,-.34,z],[5.31,-.34,Math.min(length-.10,z+1.92)],.051,green,4);
    }
    g.box(0,-.015,length-.06,11.52,.087,.11,rubber);
    for(let x=-5.24;x<5.4;x+=.57)rect(g,floorPlane(.033),x,length-.23,x+.25,length-.064,"#abb0a0");
  }

  function landing(g){
    // Cast-in-place pier boxes flank the opening. Timber rubbing strips guide vessels below.
    for(const bank of [-1,1]){
      const s=bank*(half+.27);
      g.box(0,.79,s,11.95,2.39,.65,"#8d9588");
      g.box(0,1.72,s,12.14,.32,.81,concrete);
      g.box(0,deck-.13,s+bank*.21,11.93,.24,.47,"#979a8d");
      for(const hand of [-1,1]){
        const u=hand*5.86;
        g.box(u,1.98,s,.74,.58,.60,steel);
        g.pole([u-hand*.24,deck-.024,bank*half],[u+hand*.31,deck-.024,bank*half],.213,green,10);
        disc(g,sidePlane(u+hand*.315),bank*half,deck-.024,.12,ochre,9);
      }
      const us=[-11.45,-7.82,-4.1,0,4.1,7.82,11.45];
      for(let i=0;i<us.length;i++){
        const u=us[i],f=bank*(7.55+Math.max(0,Math.abs(u)-6)*.21),top=1.10+((i*7)%3)*.10;
        g.pole([u,-.36,f],[u+.065,top,f],.20,"#79765e",7);
        g.cyl(u+.062,top,f,.212,.212,.075,7,"#a59676");
        if(i+1<us.length){
          const f2=bank*(7.55+Math.max(0,Math.abs(us[i+1])-6)*.21);
          for(const y of [.21,.60])g.pole([u,y,f-bank*.10],[us[i+1],y,f2-bank*.10],.115,"#796b55",5);
        }
      }
      // Staff gauges can be read from either approach by water.
      for(const approach of [-1,1]){
        const u=approach*10.95,f=bank*8.55;
        g.box(u,.86,f,.13,1.90,.34,cream);
        const face=sidePlane(u+approach*.069);
        for(let i=0;i<8;i++)rect(g,face,f-.16,-.015+i*.225,f+(i%2?.01:.09),.052+i*.225,dark);
        if(bank===approach){
          g.box(u,1.90,f,.28,.43,.44,dark);
          disc(g,sidePlane(u+approach*.147),f,1.91,.15,"#404e47",10);
        }
      }
    }
    for(const [u,width] of marks)for(const side of [-1,1]){
      const s=side*width,p=sidePlane(u+.01);
      g.pole([u-.12,-.33,s],[u-.07,1.52,s],.095,"#837a60",6);
      if(side===1)g.tri(p(s-.43,1.13),p(s+.43,1.13),p(s,1.99),"#b96452");
      else rect(g,p,s-.34,1.19,s+.34,1.87,"#55846e");
      g.box(u+.010,1.50,s,.04,.065,.34,cream);
    }
  }

  function keeperHouse(g){
    const rows=[-20,-18,-16,-14,-12],columns=[4.6,5.25,5.95,6.6,7.05,10.1,13.2];
    for(let j=1;j<rows.length;j++)for(let i=1;i<columns.length;i++){
      const a=columns[i-1],b=columns[i],c=rows[j-1],d=rows[j];
      const p=(u,s)=>[u,ground(u,s)+.030,s];
      g.quad(p(a,c),p(b,c),p(b,d),p(a,d),i<5?"#a2a494":"#b4ad96");
    }
    for(const s of [-20,-12])for(let i=1;i<columns.length;i++){
      const a=columns[i-1],b=columns[i],h=ground(a,s)+.029,k=ground(b,s)+.029;
      g.quad([a,h,s],[b,k,s],[b,k-.32,s],[a,h-.32,s],"#929480");
    }
    g.box(13.10,1.67,-16,.20,.36,8.02,concrete);
    for(const s of [-19.52,-12.48])for(const u of [7.66,12.82]){
      g.box(u,.66,s,.37,2.14,.39,"#858875");
      g.box(u,1.50,s,.59,.29,.55,concrete);
    }
    for(const s of [-19.85,-12.15]){
      for(const u of [7.05,9.29,12.95])g.box(u,2.38,s,.084,1.06,.10,green);
      for(const y of [2.27,2.87])g.pole([7.05,y,s],[12.95,y,s],.051,green);
    }
    const x=11.12,s=-16.27,h=1.86;
    g.box(x,h+.17,s,3.64,.34,5.25,"#8c8471");
    g.box(x,h+.835,s,3.58,1.01,5.23,"#a7735d");
    const wall=sidePlane(9.323);
    for(let j=0;j<6;j++)rect(g,wall,s-2.54,h+.40+j*.14,s+2.55,h+.417+j*.14,"#bf9174");
    g.box(x,h+1.85,s,3.55,1.13,5.18,"#455e5a");
    for(const a of [-1,1]){
      const sideX=x+a*1.795,f=sidePlane(sideX);
      for(let i=0;i<4;i++){
        const l=s-2.42+i*1.24;
        rect(g,f,l,h+1.37,l+1.12,h+2.31,i===1?"#728f85":"#839f8e");
        g.quad(f(l+.018,h+2.29),f(l+.47,h+2.29),f(l+.82,h+1.92),f(l+.34,h+1.92),"#92a89a");
      }
      for(const y of [h+1.28,h+2.40])g.box(sideX,y,s,.13,.091,5.43,cream);
    }
    for(const end of [-1,1]){
      const endS=s+end*2.621,f=front(endS);
      for(const u of [x-1.61,x-.52,x+.58])rect(g,f,u,h+1.38,u+.98,h+2.29,"#829a8c");
      g.box(x,h+1.30,endS,3.71,.110,.12,cream);
    }
    // A faded county enamel sign below the bank of lookout windows.
    rect(g,sidePlane(9.312),s-1.01,h+.53,s+1.24,h+1.15,"#416865");
    const signFace=(a,b)=>[9.30,b,2*(s+.11)-a];
    plate(g,signFace,"SALT CREEK",s+.11,h+.963,.040,cream);
    plate(g,signFace,"BRIDGE 17",s+.11,h+.679,.029,"#c0c9aa");
    const rs=s-3.02,rn=s+3.02,r0=8.97,r1=13.29,roof=4.40,ridge=5.06;
    for(const [edge,shade] of [[r0,"#648278"],[r1,"#829185"]]){
      g.quad([edge,roof,rs],[edge,roof,rn],[x,ridge,rn],[x,ridge,rs],shade);
      g.box(edge,roof-.052,s,.13,.13,rn-rs,cream);
      for(let z=rs+.31;z<rn;z+=.65)g.pole([edge,roof+.012,z],[x,ridge+.012,z],.021,"#98a494",4);
    }
    for(const z of [rs,rn]){
      g.tri([r0,roof,z],[x,ridge,z],[r1,roof,z],"#b9b29a");
      g.box(x,roof-.052,z,r1-r0,.13,.10,cream);
    }
    g.pole([x,ridge,rs],[x,ridge,rn],.063,"#91a194",5);
    g.pole([12.41,4.71,-14.03],[12.41,6.55,-14.03],.038,silver);
    g.pole([12.01,6.17,-14.03],[12.81,6.17,-14.03],.028,silver,4);
    g.pole([12.22,6.45,-14.03],[12.60,6.45,-14.03],.025,silver,4);
    // The bell faces traffic; the old storm shutter stays pinned to the south wall.
    const f=front(s-2.631);
    rect(g,f,11.43,2.39,12.55,3.00,"#927e67");
    for(let i=0;i<6;i++)rect(g,front(s-2.642),11.50,2.45+i*.079,12.46,2.478+i*.079,"#b49a77");
    g.pole([9.52,4.12,-17.62],[8.94,4.15,-17.62],.055,dark,5);
    g.cyl(8.91,3.96,-17.62,.12,.29,.31,10,"#b49a70");
    g.cyl(8.91,3.77,-17.62,.06,.06,.11,7,dark);
  }

  function mast(g,side){
    const s=-side*13,u=side*5.82,y=ground(u,s)+.030;
    g.box(u,y+.12,s,.66,.24,.75,concrete);
    g.box(u,y+.76,s,.49,1.14,.51,"#8e9d93");
    g.box(u,y+1.32,s,.58,.11,.58,light);
    const other=ground(-u,s)+.030;
    g.box(-u,other+.11,s,.59,.22,.65,concrete);
    g.box(-u,other+.72,s,.42,1.09,.46,"#8e9d93");
    g.box(-u,other+1.27,s,.49,.10,.52,light);
    g.cyl(u,y+2.09,s,.086,.10,1.58,7,"#769187");
    const face=(x,h,offset=0)=>[u+side*x,y+h,s-side*offset],p=(x,h)=>face(x,h,.26);
    g.box(u,y+2.71,s,1.04,.66,.33,dark);
    for(const x of [-.286,.286]){
      disc(g,p,x,2.73,.204,"#2d403e",12);
      disc(g,p,x,2.73,.154,"#824f47",12);
      g.quad(face(x-.196,2.84,.17),face(x+.196,2.84,.17),face(x+.196,2.91,.47),face(x-.196,2.91,.47),dark);
    }
    g.box(u,y+2.28,s,.36,.29,.31,dark);
    disc(g,p,0,2.28,.109,"#4f7267",9);
    g.box(u,y+1.76,s,.72,.34,.11,cream);
    plate(g,(x,h)=>face(x,h,.064),"STOP",0,1.76,.032,"#794d46");
    const stop=-side*16;
    const stripe=(x,z)=>[x,ground(x,z)+.057,z];
    g.quad(stripe(side*.28,stop-.16),stripe(side*4.94,stop-.16),stripe(side*4.94,stop+.16),stripe(side*.28,stop+.16),cream);
  }
  function signal(g,id){
    for(const side of [-1,1]){
      const s=-side*13,u=side*5.82,y=ground(u,s)+.030,greenLight=id==="green";
      const p=(x,h)=>[u+side*x,y+h,s-side*.274];
      disc(g,p,greenLight?0:id==="a"?-.286:.286,greenLight?2.28:2.73,greenLight?.106:.157,greenLight?"#a8e1a4":"#ff7c63",12);
    }
  }
  function barrier(g){
    // The paired booms span the carriageway once the last road user clears.
    const start=.10,end=5.68;
    g.box((end+start)*.5,0,0,end-start,.17,.115,"#d8cbb0");
    g.box(-.32,0,0,.67,.28,.21,"#647f74");
    g.box(.015,0,0,.20,.27,.22,steel);
    for(let x=.48;x<end-.31;x+=.74){
      for(const z of [-.059,.059]){
        const f=front(z);
        g.quad(f(x,-.086),f(x+.27,-.086),f(x+.45,.086),f(x+.18,.086),"#b95f50");
      }
    }
    for(const x of [1.0,3.1,5.44])g.box(x,.12,0,.10,.095,.105,"#cb7c58");
  }
  function install(model){
    model("cut-lift-bank",g=>{landing(g);keeperHouse(g);mast(g,-1);mast(g,1);});
    model("cut-lift-leaf",leaf);model("cut-lift-barrier",barrier);
    model("cut-lift-distant",g=>{
      for(const bank of [-1,1])g.box(0,.92,bank*(half+.27),12.10,2.18,.73,"#8d9588");
      g.box(9.06,1.69,-16,8.24,.34,8.00,concrete);
      g.box(11.12,2.60,-16.27,3.58,1.48,5.23,"#a97b61");
      g.box(11.12,3.83,-16.27,3.61,1.01,5.26,"#85a090");
      g.box(11.12,4.39,-16.27,4.32,.14,6.04,cream);
      for(const x of [8.96,13.28])g.quad([x,4.46,-19.29],[x,4.46,-13.25],[11.12,5.06,-13.25],[11.12,5.06,-19.29],green);
    });
    model("cut-lift-distant-leaf",g=>{
      const k=half-.03;g.box(0,-.16,k*.5,11.58,.32,k,"#818982");
      for(const edge of [-1,1]){
        const x=edge*5.77;
        g.box(x,1.05,k*.5,.17,.11,k,green);
        for(const s of [.21,k*.5,k-.15])g.box(x,.51,s,.12,1.04,.13,steel);
        rect(g,floorPlane(.013),edge*.10-.050,.04,edge*.10+.050,k-.024,ochre);
      }
    });
    for(const id of ["a","b","green"])model("cut-lift-light-"+id,g=>signal(g,id));
    for(const color of ["open","held"])model("cut-lift-water-"+color,g=>{
      for(const approach of [-1,1])disc(g,sidePlane(approach*11.101),approach*8.55,1.91,.136,color==="open"?"#9de0aa":"#f18b72",10);
    });
  }
  function roadSignal(bridge){return bridge.phase==="road"||bridge.phase==="release"&&bridge.gates<.015;}
  function world(view,see,bridge,t=0){
    if(!bridge||!see(span,168))return;
    const lift=clamp(bridge.lift||0),gates=clamp(bridge.gates||0),near=see(span,81);
    view.draw(near?"cut-lift-bank":"cut-lift-distant",span.x,0,span.z,yaw);
    for(const side of [-1,1]){
      const pin=span.at(0,-side*half),toward=yaw+(side<0?pi:0);
      view.draw(near?"cut-lift-leaf":"cut-lift-distant-leaf",pin.x,deck,pin.z,toward,-lift*angle);
      if(near)for(const shoulder of [-1,1]){
        const u=shoulder*5.82,s=-side*13,p=span.at(u,s);
        view.draw("cut-lift-barrier",p.x,ground(u,s)+1.24,p.z,yaw+(shoulder>0?pi:0),0,(1-gates)*1.43);
      }
    }
    if(!near)return;
    const id=roadSignal(bridge)?"green":Math.floor(t*2.7)%2?"a":"b";
    view.draw("cut-lift-light-"+id,span.x,0,span.z,yaw,0,0,.91);
    view.draw("cut-lift-water-"+(bridge.phase==="water"&&lift>.97?"open":"held"),span.x,0,span.z,yaw,0,0,.80);
  }
  function map(c,px,py,scale,bridge,t=0,street=false,visible){
    if(!bridge||!scale||visible&&!visible(px(span.x),py(span.z),65*scale))return;
    const lift=clamp(bridge.lift||0),gates=clamp(bridge.gates||0),tilt=angle*lift;
    c.save();c.translate(px(span.x),py(span.z));c.scale(scale,-scale);c.rotate(-yaw);
    c.lineCap="butt";c.lineJoin="round";
    function rect(x,z,w,d,color){c.fillStyle=color;c.fillRect(x,z,w,d);}
    function line(pts,w,color){
      c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);
      c.lineWidth=w;c.strokeStyle=color;c.stroke();
    }
    function poly(pts,color){
      c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);
      c.closePath();c.fillStyle=color;c.fill();
    }
    for(const [u,width] of marks)for(const side of [-1,1]){
      const s=side*width;
      if(side>0)poly([[u-.34,s-.32],[u+.33,s-.32],[u,s+.47]],"#b96f59");
      else rect(u-.32,s-.32,.64,.64,"#638a71");
    }
    rect(4.60,-20,8.60,8.00,street?"#afa990":"#9ba18c");
    if(street){
      for(const s of [-18.65,-16.3,-14.02])line([[5.04,s],[9.30,s]],.053,"#8f937e");
      for(const s of [-19.85,-12.15])line([[7.05,s],[12.95,s]],.10,green);
      rect(9.45,-18.89,3.80,5.55,"#8f816d");
    }
    rect(8.97,-19.29,4.32,6.04,street?"#728b7e":"#8ba192");
    rect(8.97,-19.29,2.15,6.04,street?"#8c9c89":"#9fae99");
    line([[11.1,-19.3],[11.1,-13.25]],street?.10:.18,"#bac0a6");
    if(street)for(let s=-18.98;s< -13.23;s+=.65)line([[9.00,s],[13.25,s]],.032,"#92a38e");
    for(const bank of [-1,1]){
      rect(-6.08,bank*half-.33,12.16,.66,street?"#a8a791":"#939e8c");
      const f=u=>bank*(7.55+Math.max(0,Math.abs(u)-6)*.21);
      line([[-11.45,f(-11.45)],[-6,f(-6)],[6,f(6)],[11.45,f(11.45)]],street?.28:.38,"#857963");
      for(const u of [-11.45,-7.82,-4.1,0,4.1,7.82,11.45])rect(u-.15,f(u)-.16,.30,.32,"#9a8a6e");
    }
    for(const side of [-1,1]){
      const hinge=-side*half,end=hinge+side*(half-.035)*Math.cos(tilt),rise=half*Math.sin(tilt);
      const s=Math.min(hinge,end),len=Math.abs(end-hinge);
      if(street&&rise>.1)poly([[-5.69,hinge],[5.69,hinge],[5.69+rise*.46,end-rise*.34],[-5.69+rise*.46,end-rise*.34]],"rgba(39,61,56,.24)");
      rect(-5.76,s,11.52,len,street?"#818982":"#85968a");
      if(street){
        for(const u of [-4.08,-1.57,1.57,4.08])rect(u-.34,s,.68,len,"#787f78");
        for(let z=.64;z<half-.13;z+=.77){
          const p=hinge+side*z*Math.cos(tilt);
          line([[-5.42,p],[5.42,p]],.039,"#64716b");
        }
      }
      for(const edge of [-1,1]){
        const x=edge*5.78;
        line([[x,hinge],[x,end]],street?.23:.32,green);
        line([[edge*5.04,hinge],[edge*5.04,end]],street?.13:.21,"#d3d3ae");
        line([[edge*.11,hinge],[edge*.11,end]],street?.081:.13,"#d0b176");
      }
      line([[-5.79,end],[5.79,end]],street?.17:.28,lift>.20?"#4e746b":"#63736d");
    }
    const go=roadSignal(bridge);
    for(const side of [-1,1]){
      const s=-side*13,u=side*5.82;
      line([[side*.28,-side*16],[side*4.94,-side*16]],.30,cream);
      for(const shoulder of [-1,1]){
        const base=shoulder*5.82,f=k=>base-shoulder*k*Math.cos((1-gates)*1.43);
        line([[base,s],[f(5.68),s]],street?.17:.32,"#e0d1af");
        if(street)for(let x=.46;x<5.33;x+=.74)line([[f(x),s],[f(x+.31),s]],.18,"#a85c4e");
        rect(base-.31,s-.31,.62,.62,steel);
      }
      c.beginPath();c.arc(u+side*.045,s-side*.25,street?.21:.36,0,tau);
      c.fillStyle=go?"#a7dba0":Math.floor(t*2.7)%2?"#fa987a":"#d87764";c.fill();
    }
    c.restore();
  }
  window.BayDrawbridgeArt={install,world,map,blocks,camera,platformY};
})();
