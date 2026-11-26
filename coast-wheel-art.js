/* Eight counterweighted cars on the North Boardwalk wheel. A car's +Y origin is its floor. */
(() => {
  "use strict";
  const tau=Math.PI*2,radius=10.15,seatY=.47;
  const centre={x:181.5,y:13.55,z:112.5},gate={x:177.8,y:1.32,z:112.5,yaw:Math.PI/2,kind:"coast-wheel",name:"Coast Wheel · Boarding gate"};
  const rampStart=172.25,rampEnd=176.1,platformEnd=179.62,rampWidth=1.28;
  const ink="#354c4d",iron="#52726b",blue="#537f79",mint="#8fae9b",rust="#a96a52",
    red="#c65d51",salmon="#dd8871",sun="#d7a260",ivory="#e8d9b7",pale="#f6e8ca";
  const paints=["#b55e51","#3d817a","#d09c59","#6c91a3","#b8715e","#7e9a78","#aa6b79","#618e91"];
  const stripes=["#eacb8e","#dcba7a","#588d80","#e3a168","#e1c89b","#d19f66","#e1b98e","#d49b6d"];
  const seatPlan=[[.20,-.43,0],[.96,-.43,0],[-.52,.43,Math.PI]];
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const blocks=[];
  function barrier(x,z,w,d,top){blocks.push({x,z,w,d,bottom:0,top,streetProp:true});}
  for(const side of [-1,1]){
    for(const end of [-1,1])barrier(centre.x+side*3.81,centre.z+end*6.98,1.50,1.65,.56);
    barrier(centre.x+.20,centre.z+side*11.80,8.57,.11,1.26);
    barrier(centre.x-3.77,centre.z+side*6.73,.11,10.15,1.26);
    barrier((rampStart+platformEnd)/2,centre.z+side*1.40,platformEnd-rampStart,.10,2.14);
  }
  barrier(centre.x+4.41,centre.z,.11,23.71,1.26);
  barrier(centre.x+3.61,centre.z-2.82,1.35,1.59,1.23);
  function floor(x,z){
    if(Math.abs(z-centre.z)>rampWidth+.17||x<rampStart||x>platformEnd+.04)return null;
    const u=clamp((x-rampStart)/(rampEnd-rampStart),0,1);
    return .036+(gate.y-.036)*u;
  }
  function cabin(ride,index){
    const angle=(ride?.angle||0)+(index&7)*tau/8,cs=Math.cos(angle),sn=Math.sin(angle);
    const y=centre.y-radius*cs,ground=y-2.08;
    return {index:index&7,x:centre.x,y,z:centre.z+radius*sn,floor:ground,floorY:ground,angle};
  }
  function seat(ride,index,number){
    const p=cabin(ride,index),s=seatPlan[number]||seatPlan[2];
    return {x:p.x+s[0],y:p.floor,z:p.z+s[1],yaw:s[2]};
  }
  const mix=(a,b,t)=>a+(b-a)*t;
  const onRim=(x,r,a)=>[x,-Math.cos(a)*r,Math.sin(a)*r];
  const pole=(g,a,b,r,c)=>g.pole(a,b,r,c,5);
  function panel(g,plane,coords,color){
    const first=plane(...coords[0]);
    for(let i=1;i+1<coords.length;i++)g.tri(first,plane(...coords[i]),plane(...coords[i+1]),color);
  }
  function rect(g,plane,x,y,w,h,c){
    g.quad(plane(x-w/2,y-h/2),plane(x+w/2,y-h/2),plane(x+w/2,y+h/2),plane(x-w/2,y+h/2),c);
  }
  function stroke(g,plane,a,b,w,c){
    const dx=b[0]-a[0],dy=b[1]-a[1],k=w*.5/(Math.hypot(dx,dy)||1),x=-dy*k,y=dx*k;
    g.quad(plane(a[0]+x,a[1]+y),plane(b[0]+x,b[1]+y),plane(b[0]-x,b[1]-y),plane(a[0]-x,a[1]-y),c);
  }
  function shape(g,plane,x,y,rx,ry,c,n=16){
    const mid=plane(x,y);
    for(let i=0;i<n;i++){const a=i*tau/n,b=(i+1)*tau/n;
      g.tri(mid,plane(x+rx*Math.cos(a),y+ry*Math.sin(a)),plane(x+rx*Math.cos(b),y+ry*Math.sin(b)),c);}
  }
  const paths={
    A:["04 20 44","13 33"],B:["04 00 30 41 32 02","32 43 34 04"],C:["40 10 01 03 14 44"],
    E:["40 00 04 44","02 32"],H:["00 04","40 44","02 42"],L:["00 04 44"],O:["10 30 41 43 34 14 03 01 10"],
    S:["40 10 01 02 32 43 34 04"],T:["00 40","20 24"],W:["00 14 22 34 40"],
    0:["10 30 41 43 34 14 03 01 10","13 31"],1:["11 20 24","04 44"],2:["01 10 30 41 32 04 44"],
    3:["00 30 41 32 12","32 43 34 04"],4:["30 02 42","30 34"],5:["40 00 02 32 43 34 04"],
    6:["30 10 01 03 14 34 43 32 02"],7:["00 40 14"],8:["10 30 41 32 12 01 10","12 03 14 34 43 32"],
    9:["34 41 30 10 01 12 32 41"]
  };
  const glyphs={};
  for(const [ch,strokes] of Object.entries(paths))
    glyphs[ch]=strokes.map(line=>line.split(" ").map(s=>[Number(s[0])*.25,1-Number(s[1])*.25]));
  function word(g,plane,text,x,y,h,c,width=.093,italic=0){
    const step=.78*h,start=x-(step*(text.length-1)+.59*h)/2;
    for(let i=0;i<text.length;i++){
      const at=p=>[start+i*step+(.59*p[0]+italic*p[1])*h,y+p[1]*h];
      for(const part of glyphs[text[i]]||[])for(let j=1;j<part.length;j++)
        stroke(g,plane,at(part[j-1]),at(part[j]),width*h,c);
    }
  }
  const sideFace=(sign,x)=>((u,y)=>[x,y,sign*u]);
  const endFace=(sign,z)=>((u,y)=>[-sign*u,y,z]);
  function ring(g,x,r,width,depth,color){
    const n=48;
    for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n,f=x+depth/2,k=x-depth/2;
      const A=onRim(f,r,a),B=onRim(f,r,b),C=onRim(f,r-width,b),D=onRim(f,r-width,a);
      g.quad(A,B,C,D,color,1.02);
      g.quad(onRim(k,r-width,a),onRim(k,r-width,b),onRim(k,r,b),onRim(k,r,a),color,.90);
      g.quad(onRim(k,r,a),onRim(k,r,b),B,A,color,.79);
      g.quad(D,C,onRim(k,r-width,b),onRim(k,r-width,a),color,.73);
    }
  }
  function wheelFrame(g){
    for(const sign of [-1,1]){
      const x=sign*2.12;
      ring(g,x,radius+.065,.205,.137,red);
      ring(g,x,9.50,.112,.12,salmon);
      ring(g,x,1.36,.21,.31,iron);
      for(let i=0;i<24;i++){
        const a=i*tau/24,b=(i+1)*tau/24;
        pole(g,onRim(x,9.42,a),onRim(x,10.04,(a+b)/2),.05,ivory);
        pole(g,onRim(x,10.04,(a+b)/2),onRim(x,9.42,b),.05,sun);
        const root=onRim(x,1.24,a+(i%2?.28:-.28)),tip=onRim(x,9.44,a);
        pole(g,root,tip,i%3===0?.068:.038,i%3===0?ivory:"#b4b79f");
        if(i%3===0){
          pole(g,onRim(x,1.22,a+.17),onRim(x,4.08,a),.068,"#d2b991");
          g.box(x,onRim(x,9.80,a)[1],onRim(x,9.80,a)[2],.225,.168,.17,iron);
        }
      }
    }
    for(let i=0;i<8;i++){
      const a=i*tau/8,b=(i+.5)*tau/8;
      pole(g,onRim(-2.25,radius,a),onRim(2.25,radius,a),.102,iron);
      pole(g,onRim(-2.07,9.49,b),onRim(2.07,9.49,b),.067,ivory);
      pole(g,onRim(-2.08,9.48,b),onRim(2.08,10.04,a),.038,ivory);
      for(const side of [-1,1])pole(g,onRim(side*2.12,.94,a),onRim(-side*2.12,1.08,a+.23),.064,iron);
    }
  }
  function lamps(g,group){
    for(const side of [-1,1])for(let i=0;i<48;i++){
      if(i%3!==group)continue;
      const a=i*tau/48,p=onRim(side*2.211,10.045,a),plane=sideFace(side,p[0]);
      shape(g,plane,side*p[2],p[1],.132,.132,group===0?"#ffe5a1":group===1?"#ffebc1":"#ffcf88",6);
    }
  }
  function signs(g){
    for(const side of [-1,1]){
      const x=side*2.96;
      const face=sideFace(side,x),rim=sideFace(side,x+side*.045),front=sideFace(side,x+side*.061);
      shape(g,face,0,13.55,1.39,1.36,ivory,24);
      shape(g,rim,0,13.55,1.24,1.21,red,24);
      const lozenge=[[-2.22,13.23],[-1.84,13.75],[-1.1,13.96],[1.83,14.02],[2.24,13.78],[1.76,13.19],[-1.32,13.08]];
      panel(g,rim,lozenge,ivory);
      panel(g,front,lozenge.map(([u,y])=>[u*.958,13.55+(y-13.55)*.85]),blue);
      const paint=sideFace(side,x+side*.073);
      word(g,paint,"COAST",-.025,13.27,.54,pale,.116,.10);
      word(g,paint,"WHEEL",0,12.80,.260,ivory,.110);
      for(let i=0;i<3;i++)stroke(g,paint,[-.29+i*.25,14.32],[-.21+i*.23,14.49],.053,ivory);
    }
  }
  function station(g){
    // Local coordinates around the axle put the ramp boards flush with the moving floor.
    const x0=rampStart-centre.x,x1=rampEnd-centre.x,x2=platformEnd-centre.x,h0=.036,h1=gate.y;
    const height=x=>mix(h0,h1,clamp((x-x0)/(x1-x0),0,1)),deck=(x,y,z)=>[x,height(x)+y,z];
    const widths=[rampWidth+.10,rampWidth+.11,rampWidth+.05];
    const boards=["#af9e7e","#b8a789","#ab997c","#b4a183","#c0ae8d"];
    let board=0;
    for(const [start,end,pieces] of [[x0,x1,20],[x1,x2,17]])for(let i=0;i<pieces;i++){
      const a=mix(start,end,i/pieces),b=mix(start,end,(i+1)/pieces)-.012,w=widths[Math.floor(board/11)%3];
      g.quad(deck(a,0,-w),deck(b,0,-w),deck(b,0,w),deck(a,0,w),boards[(board*7+Math.floor(board/6))%boards.length]);
      if(board%2===0)for(const side of [-1,1]){
        const x=(a+b)/2,z=side*(w-.120);
        g.quad(deck(x-.018,.004,z-.022),deck(x+.019,.004,z-.022),deck(x+.019,.004,z+.020),deck(x-.018,.004,z+.020),"#6c7469");
      }
      board++;
    }
    for(const side of [-1,1]){
      const z=side*1.40;
      for(const [u,v] of [[x0,x1],[x1,x2]]){
        g.quad(deck(u,-.15,z),deck(v,-.15,z),deck(v,0,z),deck(u,0,z),blue);
        pole(g,deck(u,.91,z),deck(v,.91,z),.047,"#b0b4a0");
        pole(g,deck(u,.46,z),deck(v,.46,z),.023,mint);
      }
      for(const x of [x0+.13,x0+1.45,x0+2.77,x1,x1+1.61,x2-.04]){
        const y=height(x),post=[x,y+.035,z];pole(g,post,[x,y+.924,z],.050,blue);
        g.box(x,y+.06,z,.151,.12,.159,iron);
        if(x>x1-.2){g.box(x,y*.50,z,.19,y,.21,iron);g.box(x,.145,z,.41,.14,.43,"#a69f87");}
      }
      for(let i=0;i<8;i++){
        const x=mix(x1+.04,x2-.04,i/8);const b=mix(x1+.04,x2-.04,(i+.5)/8);
        g.quad(deck(x,.007,z-side*.11),deck(b,.007,z-side*.11),deck(b-.06,.007,z-side*.22),deck(x-.06,.007,z-side*.22),sun);
      }
    }
    const cabinetX=gate.x-centre.x-.18;
    g.box(cabinetX,h1+.63,-1.51,.46,1.21,.34,blue);g.box(cabinetX,h1+1.25,-1.51,.49,.073,.375,ink);
    const plate=sideFace(-1,cabinetX-.235);rect(g,plate,1.51,h1+.93,.27,.33,ivory);rect(g,plate,1.51,h1+.93,.208,.20,"#50716a");
    for(const [a,b] of [[[-3.77,-11.8],[-3.77,-1.65]],[[-3.77,1.65],[-3.77,11.8]],[[-3.77,-11.8],[4.41,-11.8]],[[-3.77,11.8],[4.41,11.8]],[[4.41,-11.8],[4.41,11.8]]]){
      const pieces=Math.ceil(Math.hypot(a[0]-b[0],a[1]-b[1])/1.60);
      for(let i=0;i<=pieces;i++){
        const f=i/pieces,x=mix(a[0],b[0],f),z=mix(a[1],b[1],f);
        if(i===0||i===pieces||i%2===0){
          g.box(x,.68,z,.092,1.10,.092,blue);g.box(x,1.25,z,.129,.07,.129,mint);
        }else pole(g,[x,.16,z],[x,1.16,z],.025,iron);
      }
      for(const y of [.38,.78,1.18])pole(g,[a[0],y,a[1]],[b[0],y,b[1]],y===1.18?.044:.026,y===1.18?mint:blue);
    }
    g.box(3.61,.66,-2.82,1.35,1.10,1.59,iron);
    g.box(3.61,1.27,-2.82,1.39,.19,1.63,"#889c87");
    for(let i=0;i<6;i++)g.box(2.922,.77,-3.30+i*.17,.038,.38,.06,ink);
    for(const side of [-1,1]){
      pole(g,[side*2.43,12.93,-.39],[side*2.43,14.17,.39],.17,iron);
      pole(g,[side*3.25,4.00,-4.94],[side*3.25,4.00,4.94],.105,blue);
      pole(g,[side*3.35,3.53,-5.20],[side*3.04,6.56,3.78],.054,mint);
      pole(g,[side*3.35,3.53,5.20],[side*3.04,6.56,-3.78],.054,mint);
    }
    signs(g);
  }
  function stationGate(g,side){
    const z=-side*1.17;
    g.box(0,.56,0,.127,1.14,.119,iron);
    for(const y of [.24,.63,1.06])pole(g,[0,y,0],[0,y,z],y===1.06?.050:.033,y===1.06?ivory:mint);
    pole(g,[0,.23,z],[0,1.06,z],.044,blue);
    for(let i=1;i<=3;i++){const p=z*i/4;pole(g,[0,.22,p],[0,1.03,p],.020,blue);}
    g.box(0,.74,z*.46,.090,.20,.42,ivory);g.box(-.052,.74,z*.46,.018,.097,.195,red);
  }
  function carriage(g,index){
    const paint=paints[index],stripe=stripes[index],w=1.78,d=.83;
    const deck=[[-w+.16,-d],[w-.17,-d],[w,-d+.15],[w,d-.15],[w-.17,d],[-w+.16,d],[-w,d-.15],[-w,-d+.15]];
    function lower(u){return [u[0]*.94,-.19,u[1]*.87];}
    for(let i=0;i<8;i++){
      const a=deck[i],b=deck[(i+1)&7];
      g.quad(lower(a),lower(b),[b[0],-.028,b[1]],[a[0],-.028,a[1]],i%2?ink:iron);
      g.tri([0,.002,0],[a[0],.002,a[1]],[b[0],.002,b[1]],"#9e8c72");
    }
    for(let i=0;i<9;i++)g.box(-1.42+i*.355,.011,0,.027,.012,1.53,"#7d7869");
    g.box(0,.047,0,3.30,.065,.36,"#a4977c");
    const ends=[[-w+.15,-d],[w-.17,-d],[w,-d+.15],[w,d-.15],[w-.17,d],[-w+.15,d]];
    for(let i=1;i<ends.length;i++){
      const a=ends[i-1],b=ends[i];
      const edge=(p,h)=>[p[0]*(.958+.042*h/.89),h,p[1]*(.90+.10*h/.89)];
      g.quad(edge(a,.052),edge(b,.052),edge(b,.62),edge(a,.62),paint,.93);
      g.quad(edge(a,.62),edge(b,.62),edge(b,.70),edge(a,.70),stripe,1.02);
      g.quad(edge(a,.70),edge(b,.70),edge(b,.81),edge(a,.81),paint,1.03);
      g.quad(edge(a,.81),edge(b,.81),edge(b,.869),edge(a,.869),ivory,.98);
      pole(g,edge(a,.88),edge(b,.88),.030,"#acb3a2");
    }
    for(const side of [-1,1]){
      const z=side*(d-.04),innerZ=side*(d-.14);
      const wide=side<0?1.92:1.08,x=side<0?.49:-.52;
      g.box(x,.239,side*.525,wide-.19,.422,.285,"#786d5f");
      g.box(x,seatY-.050,side*.50,wide,.10,.42,stripe);
      g.box(x,.628,innerZ,wide,.28,.085,paint);
      g.box(x,.733,side*.745,wide,.079,.113,ivory);
      for(const end of [-1,1]){
        const edgeX=x+end*(wide/2-.075);
        pole(g,[edgeX,.267,side*.30],[edgeX,.575,side*.30],.027,iron);
        pole(g,[edgeX,.575,side*.30],[edgeX,.575,innerZ],.030,ivory);
      }
      const face=endFace(side,z+side*.035);
      const wave=[[-1.47,.51],[-1.24,.55],[-.90,.55],[-.63,.50],[-.31,.39],[.07,.34],[.49,.36],[1.43,.54]];
      const back=endFace(side,z+side*.041);
      for(let k=1;k<wave.length;k++){
        const a=wave[k-1],b=wave[k];
        const peak=p=>[p[0],p[1]+.072+.053*(1-Math.abs(p[0])*.60)];
        g.quad(face(...a),face(...b),face(...peak(b)),face(...peak(a)),stripe);
        stroke(g,back,[a[0],a[1]-.040],[b[0],b[1]-.040],.022,ivory);
      }
      const face2=endFace(side,z+side*.056);
      shape(g,face2,1.08,.44,.219,.223,paint,12);
      const label=endFace(side,z+side*.065);word(g,label,String(index+1),1.08,.311,.261,pale,.135,.04);
      for(const edgeX of [-w+.16,w-.16]){
        const top=side* .27;
        pole(g,[edgeX,.86,side*.71],[edgeX,1.71,side*.64],.047,ivory);
        pole(g,[edgeX,1.71,side*.64],[edgeX,2.056,top],.061,paint);
        pole(g,[edgeX,2.056,top],[edgeX,2.08,0],.059,paint);
      }
    }
    // Bracing stays on the east end, clear of the west boarding door.
    pole(g,[1.613,2.08,0],[1.613,.90,0],.055,iron);
    pole(g,[1.613,2.08,0],[1.75,.862,-.67],.035,ivory);
    g.box(1.608,1.74,0,.18,.21,.226,iron);
    const west=sideFace(-1,-w+.045);
    for(const end of [-1,1]){
      const postZ=end*.676;
      g.box(-w+.055,.47,postZ,.103,.82,.105,paint);
      pole(g,[-w+.05,.87,postZ],[-w+.15,.87,end*d],.052,ivory);
      const tab=sideFace(-1,-w+.008);rect(g,tab,-postZ,.637,.136,.088,stripe);
    }
    rect(g,west,-.675,.326,.107,.065,ivory);
    const east=sideFace(1,1.782);rect(g,east,0,.446,.375,.300,paint);
    word(g,sideFace(1,1.790),String(index+1),0,.329,.243,ivory,.12);
    for(const sign of [-1,1]){
      g.pole([sign*1.56,2.08,0],[sign*1.72,2.08,0],.132,"#96a391",8);
      g.pole([sign*1.66,2.08,0],[sign*1.73,2.08,0],.085,sun,8);
    }
  }
  function carGate(g){
    // Pivot at the south-facing edge of the west entrance, pointing along minus Z.
    const length=1.285;
    for(const y of [.185,.915])pole(g,[0,y,0],[0,y,-length],y>.8?.041:.031,y>.8?ivory:iron);
    pole(g,[0,.16,-length],[0,.91,-length],.036,iron);
    for(const z of [-.32,-.66,-.98])pole(g,[0,.18,z],[0,.90,z],.023,mint);
    g.box(0,.71,-length+.069,.076,.095,.153,rust);
  }
  function distantCar(g,index){
    const paint=paints[index];
    g.box(0,-.04,0,3.33,.23,1.51,ink);
    for(const sign of [-1,1]){
      g.box(0,.439,sign*.776,3.46,.79,.091,paint);
      g.box(0,.744,sign*.803,3.47,.123,.091,stripes[index]);
      for(const end of [-1,1])pole(g,[end*1.58,.818,sign*.67],[end*1.64,2.08,0],.064,ivory);
    }
    g.box(1.70,.44,0,.10,.77,1.53,paint);
  }
  function distantWheel(g){
    for(const side of [-1,1]){
      const x=side*2.12;
      for(let i=0;i<32;i++){
        const a=i*tau/32,b=(i+1)*tau/32;
        for(const [outer,inner,col] of [[10.21,9.97,red],[9.50,9.38,salmon]])
          g.quad(onRim(x,outer,a),onRim(x,outer,b),onRim(x,inner,b),onRim(x,inner,a),col);
        if(i%2===0){
          g.quad(onRim(x,.87,a-.05),onRim(x,9.49,a-.007),onRim(x,9.49,a+.007),onRim(x,.87,a+.05),ivory);
          if(side>0&&i%4===0)pole(g,onRim(-2.18,radius,a),onRim(2.18,radius,a),.095,iron);
        }
      }
    }
  }
  function distantStation(g){
    const a=rampStart-centre.x,b=rampEnd-centre.x,d=platformEnd-centre.x;
    for(const [u,v,y,h] of [[a,b,.036,gate.y],[b,d,gate.y,gate.y]]){
      g.quad([u,y,-1.38],[v,h,-1.38],[v,h,1.38],[u,y,1.38],"#b3a080");
      for(const side of [-1,1])pole(g,[u,y+.91,side*1.40],[v,h+.91,side*1.40],.069,iron);
    }
    for(const side of [-1,1]){
      const x=side*3.0;shape(g,sideFace(side,x),0,centre.y,1.36,1.32,red,12);
      panel(g,sideFace(side,x+side*.05),[[-2.24,13.22],[-1.65,13.90],[2.22,13.84],[1.66,13.19]],ivory);
      panel(g,sideFace(side,x+side*.06),[[-2.04,13.30],[-1.57,13.79],[2.03,13.76],[1.58,13.28]],blue);
    }
  }
  function install(model){
    model("coastwheel-station",station);model("coastwheel-rim",wheelFrame);
    model("coastwheel-distant-rim",distantWheel);model("coastwheel-distant-station",distantStation);
    for(let i=0;i<3;i++)model("coastwheel-lamps-"+i,g=>lamps(g,i));
    for(let i=0;i<8;i++){
      model("coastwheel-car-"+i,g=>carriage(g,i));
      model("coastwheel-far-"+i,g=>distantCar(g,i));
    }
    for(const side of [-1,1])model("coastwheel-platform-gate"+side,g=>stationGate(g,side));
    model("coastwheel-car-gate",carGate);
    model("coastwheel-cabin-light",g=>{
      g.box(1.507,1.74,0,.034,.152,.205,"#ffdf9d");
      for(const side of [-1,1]){
        // Bronze strips below the bench backs catch the reading light after dusk.
        g.box(side<0?.49:-.52,.702,side*.629,side<0?1.8:.99,.034,.026,"#d7a166");
      }
    });
  }
  function world(list,see,t,hours,ride){
    if(!ride||!see(centre,320))return;
    const angle=ride.angle||0,open=clamp(ride.gateOpen||0,0,1),night=hours?.night||0,nearby=see(centre,115);
    list.push([nearby?"coastwheel-station":"coastwheel-distant-station",centre.x,0,centre.z],
      [nearby?"coastwheel-rim":"coastwheel-distant-rim",centre.x,centre.y,centre.z,0,-angle]);
    for(let i=0;i<3;i++){
      const wave=.5+.5*Math.cos(t*1.47-i*tau/3);
      list.push(["coastwheel-lamps-"+i,centre.x,centre.y,centre.z,0,-angle,0,.06+night*(.54+.53*wave)]);
    }
    for(let i=0;i<8;i++){
      const p=cabin(ride,i);list.push([(nearby?"coastwheel-car-":"coastwheel-far-")+i,p.x,p.floor,p.z]);
      if(nearby)list.push(["coastwheel-car-gate",p.x-1.727,p.floor,p.z+.646,
        i===ride.loading?open*1.47:0]);
      if(nearby&&night>.13)list.push(["coastwheel-cabin-light",p.x,p.floor,p.z,0,0,0,.25+night*.65]);
    }
    if(nearby)for(const side of [-1,1])list.push(["coastwheel-platform-gate"+side,gate.x,gate.y,gate.z+side*1.26,-side*1.47*open]);
  }
  // An oblique projection separates the two rims and keeps each rider on their actual seat.
  function mapPoint(p){
    const height=p.y||0;
    return {x:p.x+.33*height,z:p.z+.13*height};
  }
  function chart(c,opt,px,py,s,visible){
    if(opt.mode==="atlas"&&opt.marina?.bayChart)return;
    const x=px(gate.x),y=py(gate.z),size=Math.max(.86,Math.min(c.canvas.width,c.canvas.height)/(opt.mode==="radar"?165:370));
    if(!visible(x,y,10*size))return;
    c.save();c.translate(x,y);c.scale(size,size);c.lineJoin="round";c.lineCap="round";
    c.fillStyle="#2f514c";c.beginPath();c.arc(0,0,5.9,0,tau);c.fill();
    c.strokeStyle="#f7dbab";c.lineWidth=.94;c.beginPath();c.arc(0,-.85,3.55,0,tau);c.stroke();
    for(let i=0;i<8;i++){const a=i*tau/8;c.beginPath();c.moveTo(0,-.85);c.lineTo(3.35*Math.sin(a),-.85+3.35*Math.cos(a));c.stroke();}
    c.strokeStyle="#e99a76";c.lineWidth=1.10;c.beginPath();c.moveTo(-2.5,4);c.lineTo(0,-.85);c.lineTo(2.5,4);c.stroke();c.restore();
  }
  function wheelLine(c,a,b,w,color){
    c.beginPath();c.moveTo(...a);c.lineTo(...b);c.lineWidth=w;c.strokeStyle=color;c.stroke();
  }
  function wheelPoly(c,a,color){
    c.beginPath();c.moveTo(...a[0]);for(let i=1;i<a.length;i++)c.lineTo(...a[i]);c.closePath();c.fillStyle=color;c.fill();
  }
  function wheelDot(c,p,r,color){c.beginPath();c.arc(p[0],p[1],r,0,tau);c.fillStyle=color;c.fill();}
  // Each cabin hangs level while the rim turns. Only its projected origin moves.
  const projectPart=(x,h,z)=>[x+.33*h,z+.13*h];
  const prints=new Map(),cabinSheet=[-3.1,-1.13,5.7,2.40],crestSheet=[-.62,-2.55,1.24,5.1];
  function partPrint(c,key,bounds,painter,id,gate){
    let image=prints.get(key);
    const [x,z,w,h]=bounds;
    if(!image){
      const density=32,width=Math.ceil(w*density),height=Math.ceil(h*density);
      if(typeof OffscreenCanvas==="function")image=new OffscreenCanvas(width,height);
      else {image=document.createElement("canvas");image.width=width;image.height=height;}
      const ink=image.getContext("2d");if(!ink){painter(c,id,gate);return;}
      ink.setTransform(width/w,0,0,height/h,-x*width/w,-z*height/h);
      ink.lineJoin="round";ink.lineCap="round";painter(ink,id,gate);prints.set(key,image);
    }
    c.drawImage(image,x,z,w,h);
  }
  function crestPrint(c,side){
    const P=(u,h)=>projectPart(0,h,side*u);
    for(const [r,col] of [[1.36,ivory],[1.22,red]]){
      const loop=[];for(let i=0;i<16;i++)loop.push(P(r*Math.sin(i*tau/16),r*Math.cos(i*tau/16)));
      wheelPoly(c,loop,col);
    }
    wheelPoly(c,[P(-2.23,-.31),P(-1.77,.47),P(2.20,.34),P(1.76,-.38)],ivory);
    wheelPoly(c,[P(-2.08,-.25),P(-1.68,.38),P(2.05,.29),P(1.66,-.28)],blue);
    for(let i=0;i<5;i++){
      const paths=glyphs["COAST"[i]],start=-.95+i*.41;
      for(const part of paths)for(let j=1;j<part.length;j++){
        const at=p=>P(start+.26*p[0]+.03*p[1],-.17+.39*p[1]);wheelLine(c,at(part[j-1]),at(part[j]),.039,ivory);
      }
    }
  }
  function cabinPrint(c,i,gate){
    const shell=paints[i],trim=stripes[i],top=.87,west=-1.72,back=.81;
    const P=projectPart;
    wheelPoly(c,[P(-1.60,-.12,-.77),P(1.60,-.12,-.77),P(1.76,-.12,-.59),P(1.76,-.12,.63),
      P(1.58,-.12,.79),P(-1.58,-.12,.79),P(-1.77,-.12,.62),P(-1.77,-.12,-.60)],shell);
    for(const side of [-1,1]){
      wheelPoly(c,[P(-1.61,.05,side*.75),P(1.61,.05,side*.75),P(1.61,top,side*back),P(-1.61,top,side*back)],shell);
      wheelLine(c,P(-1.57,.645,side*.784),P(1.56,.645,side*.784),.071,trim);
      wheelLine(c,P(-1.58,top,side*back),P(1.61,top,side*back),.11,ivory);
    }
    wheelLine(c,P(1.68,top,-.73),P(1.68,top,.73),.13,trim);
    wheelLine(c,P(-.43,seatY,-.50),P(1.44,seatY,-.50),.36,trim);
    wheelLine(c,P(-1.05,seatY,.50),P(.012,seatY,.50),.36,trim);
    const yaw=gate*1.47;
    wheelLine(c,P(west,.915,.646),P(west-1.285*Math.sin(yaw),.915,.646-1.285*Math.cos(yaw)),.10,ivory);
    for(const side of [-1,1]){
      for(const end of [-1,1])wheelLine(c,P(end*1.60,top,side*.68),P(end*1.64,2.08,0),.075,side>0?ivory:shell);
    }
    for(const part of glyphs[String(i+1)])for(let j=1;j<part.length;j++){
      const at=p=>P(.98+p[0]*.19,.30+p[1]*.28,-.86);
      wheelLine(c,at(part[j-1]),at(part[j]),.038,ivory);
    }
  }
  function streetMap(c,opt,px,py,s,visible,ride){
    if(!visible(px(centre.x),py(centre.z),19*s))return;
    const angle=ride.angle||0,open=clamp(ride.gateOpen||0,0,1),night=opt.weather?.night||opt.dusk||0;
    c.save();c.translate(px(centre.x),py(centre.z));c.scale(s,-s);c.lineCap="round";c.lineJoin="round";
    const point=(x,h,z)=>[x+.33*h,z+.13*h],volume=(x,h,z)=>h-.33*x-.13*z;
    const line=(a,b,w,col)=>wheelLine(c,a,b,w,col),poly=(a,col)=>wheelPoly(c,a,col),dot=(p,r,col)=>wheelDot(c,p,r,col);
    function box(x0,z0,x1,z1,h,col){poly([point(x0,h,z0),point(x1,h,z0),point(x1,h,z1),point(x0,h,z1)],col);}
    const rim=(x,r,a)=>[x,centre.y-r*Math.cos(a),r*Math.sin(a)];
    const shadeAt=p=>[p[0]-.21*p[1],p[2]-.17*p[1]];
    for(const side of [-1,1])for(let i=0;i<24;i++){
      const a=angle+i*tau/24;
      line(shadeAt(rim(side*2.12,radius,a)),shadeAt(rim(side*2.12,radius,a+tau/24)),.28,"rgba(64,66,63,.19)");
    }
    for(let i=0;i<8;i++){
      const p=cabin(ride,i),x=-.21*p.floor,z=p.z-centre.z-.17*p.floor;
      box(x-1.67,z-.75,x+1.67,z+.75,0,"rgba(63,64,56,.19)");
    }
    const x0=rampStart-centre.x,x1=rampEnd-centre.x,x2=platformEnd-centre.x;
    const h=x=>mix(.036,gate.y,clamp((x-x0)/(x1-x0),0,1));
    for(const [a,b] of [[x0,x1],[x1,x2]]){
      poly([point(a,h(a),-1.36),point(b,h(b),-1.36),point(b,h(b),1.36),point(a,h(a),1.36)],"#b6a083");
      for(let x=a+.1;x<b;x+=.36)line(point(x,h(x),-1.34),point(x,h(x),1.34),.046,"#897f6b");
      for(const side of [-1,1])line(point(a,h(a)+.91,side*1.40),point(b,h(b)+.91,side*1.40),.11,ivory);
    }
    for(const side of [-1,1]){
      line(point(-3.77,1.18,side*1.65),point(-3.77,1.18,side*11.8),.12,blue);
      line(point(-3.77,1.18,side*11.8),point(4.41,1.18,side*11.8),.12,blue);
      const gx=gate.x-centre.x,gy=gate.y+1.06,gz=side*1.26,yaw=-side*1.47*open;
      line(point(gx,gy,gz),point(gx-side*1.17*Math.sin(yaw),gy,gz-side*1.17*Math.cos(yaw)),.13,ivory);
      dot(point(gx,gy,gz),.103,iron);
    }
    line(point(4.41,1.18,-11.8),point(4.41,1.18,11.8),.13,blue);
    box(2.94,-3.62,4.28,-2.02,1.23,iron);box(-4.14,-1.67,-3.77,-1.34,2.50,blue);
    // Sort short sections also where the rim passes in front of the A-frames and the lower cars.
    const pieces=[];
    function beam(a,b,width,col,passes=1){
      for(let i=0;i<passes;i++){
        const u=i/passes,v=(i+1)/passes,aa=a.map((n,k)=>mix(n,b[k],u)),bb=a.map((n,k)=>mix(n,b[k],v));
        pieces.push({depth:(volume(...aa)+volume(...bb))*.5,a:point(...aa),b:point(...bb),width,col});
      }
    }
    function bulb(p,r,col){pieces.push({depth:volume(...p)+.07,p:point(...p),r,col});}
    for(const side of [-1,1]){
      for(const end of [-1,1]){
        box(side*3.81-.76,end*6.98-.87,side*3.81+.76,end*6.98+.87,.51,"#9d9d89");
        const base=[side*3.81,.53,end*6.98],top=[side*2.48,centre.y,0];
        beam(base,top,.48,blue,5);
      }
      const x=side*2.12;
      for(let i=0;i<24;i++){
        const a=angle+i*tau/24,b=a+tau/24;
        if(i%2===0)beam(rim(x,1.13,a+.14),rim(x,9.43,a),i%3===0?.105:.069,i%3===0?ivory:"#afaf96",3);
        beam(rim(x,radius,a),rim(x,radius,b),.205,red);
        beam(rim(x,9.46,a),rim(x,9.46,b),.098,salmon);
        if(i%2===0||night>.18)bulb(rim(side*2.22,10.045,a),night>.27?.115:.076,night>.27?"#ffe39f":ivory);
      }
    }
    for(let i=0;i<8;i++){
      const p=cabin(ride,i),z=p.z-centre.z,y=p.floor;
      beam([-2.20,p.y,z],[2.20,p.y,z],.16,iron);
      pieces.push({depth:volume(0,y+.82,z),car:i,z,y});
    }
    beam([-2.89,centre.y,0],[2.89,centre.y,0],.47,ink);
    for(const side of [-1,1])pieces.push({depth:volume(side*2.99,centre.y,0),crest:side});
    const usePrints=opt.lowDetail&&s<=16;
    function drawCrest(side){
      const at=point(side*2.99,centre.y,0);c.save();c.translate(...at);
      if(usePrints)partPrint(c,"crest"+side,crestSheet,crestPrint,side,0);else crestPrint(c,side);
      c.restore();
    }
    function drawCar(i,z,y){
      const gate=i===ride.loading?open:0,at=point(0,y,z);
      c.save();c.translate(...at);
      if(usePrints&&(gate===0||gate===1))partPrint(c,i+8*gate,cabinSheet,cabinPrint,i,gate);
      else cabinPrint(c,i,gate);
      c.restore();
      const P=(x,h,v)=>point(x,y+h,z+v);
      for(let j=0;j<3;j++){
        const occupant=ride.seats?.[i]?.[j];if(occupant===null||occupant===undefined)continue;
        const id=String(occupant.id??occupant),isPlayer=id==="player";
        if(isPlayer?opt.boardwalk?.player:opt.boardwalk?.people?.some(p=>p.id===id))continue;
        const a=seatPlan[j],direction=Math.cos(a[2]);
        const hue=id.split("").reduce((n,ch)=>n+ch.charCodeAt(0),0),coats=["#a57955","#83988a","#637f86","#a76a58"],skin=["#d4a57d","#ad8063","#ddae85"];
        line(P(a[0]-.17,seatY+.34,a[1]),P(a[0]+.17,seatY+.34,a[1]),.28,isPlayer?"#4b8583":coats[hue%coats.length]);
        const head=P(a[0],seatY+.67,a[1]+direction*.04);dot(head,isPlayer?.204:.164,isPlayer?"#e3c58a":skin[hue%skin.length]);
        dot([head[0]-.043,head[1]-.05*direction],.101,isPlayer?"#4f5149":"#685343");
      }
      if(night>.24)dot(P(1.55,1.74,0),.078,"#ffdc95");
    }
    pieces.sort((a,b)=>a.depth-b.depth);
    for(const e of pieces){
      if(e.car!==undefined)drawCar(e.car,e.z,e.y);
      else if(e.crest)drawCrest(e.crest);
      else if(e.p)dot(e.p,e.r,e.col);
      else line(e.a,e.b,e.width,e.col);
    }
    c.restore();
  }
  function map(c,opt,px,py,s,visible){
    if(opt.mode==="street"){
      if(opt.wheel)streetMap(c,opt,px,py,s,visible,opt.wheel);
    }else chart(c,opt,px,py,s,visible);
  }
  window.BayCoastWheelArt={install,world,map,mapPoint,floor,blocks,centre,gate,cabin,seat,seatY};
})();
