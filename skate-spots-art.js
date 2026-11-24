/* The city slab and the market loading court. Measurements are in metres along the skater's line. */
(() => {
  "use strict";
  function at(s,u,v,h=0){
    const c=Math.cos(s.yaw),n=Math.sin(s.yaw);
    return {x:s.x+c*u+n*v,y:s.y+h,z:s.z-n*u+c*v};
  }
  function local(s,x,z){
    const dx=x-s.x,dz=z-s.z,c=Math.cos(s.yaw),n=Math.sin(s.yaw);
    return {u:dx*c-dz*n,v:dx*n+dz*c};
  }
  const sites=[
    {id:"sol",name:"Sol Promenade",x:171.15,z:-41.60,y:.106,yaw:0,half:4.51,
      rail:{u:0,v0:6.15,v1:12.65,h:.48,w:.102},bank:{u:0,w:2.80,v0:16.45,v1:18.95,v2:19.55,v3:21.80,h:.62},
      pad:{u:2.65,v0:7.75,v1:12.85,w:.75,h:.31}},
    {id:"market",name:"El Mercado",x:-12.05,z:-129.00,y:.130,yaw:0,half:4.08,
      rail:{u:0,v0:6.65,v1:13.40,h:.45,w:.112},bank:{u:0,w:2.80,v0:16.55,v1:18.85,v2:19.55,v3:21.95,h:.58},
      pad:{u:2.57,v0:8.10,v1:13.65,w:.78,h:.36}}
  ];
  const minV=-3.80,maxV=27.15;
  for(const s of sites){
    s.start=at(s,0,0);s.stand=at(s,-2.15,-.25);s.finish=at(s,0,25.40);s.center=at(s,0,11.60);
    s.loan={...at(s,-2.18,-1.53),yaw:s.yaw+1.34,style:s.id,rider:false};
    s.loop=[[0,0],[0,5],[0,14.3],[0,22.7],[0,24.9],[-.56,25.85],[-1.63,26.04],[-2.68,25.40],
      [-3.07,24.16],[-3.07,3.78],[-2.82,2.25],[-2.07,1.45],[-1.10,1.36],[0,2.2]].map(([u,v])=>({u,v}));
  }
  function bankHeight(s,u,v){
    const b=s.bank;if(Math.abs(u-b.u)>b.w*.5||v<=b.v0||v>=b.v3)return 0;
    if(v<b.v1)return b.h*(v-b.v0)/(b.v1-b.v0);
    return v<=b.v2?b.h:b.h*(b.v3-v)/(b.v3-b.v2);
  }
  function floor(x,z,withBank=false){
    for(const s of sites){
      if(Math.abs(x-s.x)>6||z<s.z+minV-1||z>s.z+maxV+1)continue;
      const {u,v}=local(s,x,z);
      const left=s.half+u,right=s.half-u,front=v-minV,back=maxV-v;
      if(Math.min(left,right,front,back)<0||left+front<.58||right+front<.40||right+back<.62||left+back<.34)continue;
      return s.y+(withBank?bankHeight(s,u,v):0);
    }
    return null;
  }
  const solids=[],cameraBlocks=[];
  function blocker(s,u,v,w,d,h){
    const p=at(s,u,v);const b={x:p.x,z:p.z,w,d,bottom:0,top:s.y+h,streetProp:true};
    solids.push(b);cameraBlocks.push(b);
  }
  for(const s of sites){
    blocker(s,-2.43,-2.25,2.00,.50,.52);
    blocker(s,2.36,-2.40,1.26,.22,1.66);
  }
  const tau=2*Math.PI,ink="#364d4c",metal="#88948f",galv="#b0bbb0",cream="#f1e0ae";
  const tint={
    sol:{sand:"#c5bca5",rim:"#9d9c8d",pours:["#c5c3ad","#bfc0aa","#c7c4ae","#c3c2aa"],joint:"#999e8e",
      deep:"#376b6d",paint:"#71a297",rub:"#acb3a2",mark:"#d69773",edge:"#acc2b1",stripe:"#e0b58b"},
    market:{sand:"#a69a87",rim:"#8d9387",pours:["#afa994","#b4ad96","#b3aa95","#aca794"],joint:"#898c7e",
      deep:"#4c6157",paint:"#859180",rub:"#a4a795",mark:"#b77756",edge:"#aeb6a0",stripe:"#d2a26d"}
  };
  const horizontal=y=>(u,v)=>[u,y,v];
  function fill(g,plane,points,color){
    const first=plane(...points[0]);
    for(let k=2;k<points.length;k++)g.tri(first,plane(...points[k-1]),plane(...points[k]),color);
  }
  function rect(g,plane,u,v,w,h,color){
    const x=u-w/2,X=u+w/2,y=v-h/2,Y=v+h/2;
    g.quad(plane(x,y),plane(X,y),plane(X,Y),plane(x,Y),color);
  }
  function line(g,plane,points,w,color){
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],r=w/(2*Math.hypot(dx,dy)||1);
      const rx=-dy*r,ry=dx*r;
      g.quad(plane(a[0]+rx,a[1]+ry),plane(b[0]+rx,b[1]+ry),plane(b[0]-rx,b[1]-ry),plane(a[0]-rx,a[1]-ry),color);
    }
  }
  function disk(g,plane,x,y,rx,ry,color,n=12){
    const center=plane(x,y);
    for(let k=0;k<n;k++){const a=k*tau/n,b=(k+1)*tau/n;g.tri(center,plane(x+rx*Math.cos(a),y+ry*Math.sin(a)),plane(x+rx*Math.cos(b),y+ry*Math.sin(b)),color);}
  }
  // The enamel sign has individually cut letters, so its front still reads from the sidewalk.
  const cuts={
    A:["00 24 40","12 32"],C:["43 34 14 03 01 10 30 41"],D:["00 04 24 43 41 20 00"],
    E:["44 04 00 40","02 32"],L:["04 00 40"],M:["00 04 22 44 40"],N:["00 04 40 44"],
    O:["14 34 43 41 30 10 01 03 14"],P:["00 04 34 43 32 02"],
    R:["00 04 34 43 32 02","22 40"],S:["43 34 14 03 12 32 41 30 10 01"]
  };
  function letters(g,plane,word,cx,bottom,height,color,width=.085){
    const step=height*.82,start=cx-(step*(word.length-1)+.63*height)*.5;
    for(let i=0;i<word.length;i++)for(const path of cuts[word[i]]||[]){
      const points=path.split(" ").map(p=>[start+i*step+Number(p[0])*height*.158,bottom+Number(p[1])*height*.25]);
      line(g,plane,points,width*height,color);
    }
  }
  function insetOutline(s){
    const w=s.half,a=minV,b=maxV;
    return [[-w+.58,a],[w-.40,a],[w,a+.40],[w,b-.62],[w-.62,b],[-w+.34,b],[-w,b-.34],[-w,a+.58]];
  }
  function base(g,s,detail){
    const t=tint[s.id],sol=s.id==="sol",outline=insetOutline(s),top=horizontal(0);
    fill(g,top,outline,t.pours[0]);
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      g.quad([a[0],-.115,a[1]],[b[0],-.115,b[1]],[b[0],0,b[1]],[a[0],0,a[1]],t.rim);
    }
    const slabs=[-3.13,.95,5.43,10.16,14.96,19.91,24.52,26.57],w=s.half-.11;
    for(let i=1;i<slabs.length;i++){
      const v0=slabs[i-1],v1=slabs[i],u=sol?(i%2?.68:-1.12):(i%3?-1.42:1.29);
      rect(g,horizontal(.002),(u-w)/2,(v0+v1)/2,u+w-.022,v1-v0-.028,t.pours[i%4]);
      rect(g,horizontal(.002),(u+w)/2,(v0+v1)/2,w-u-.02,v1-v0-.028,t.pours[(i+(sol?1:3))%4]);
      rect(g,horizontal(.004),u,(v0+v1)/2,.018,v1-v0,t.joint);
      rect(g,horizontal(.004),0,v0,2*w,.020,t.joint);
    }
    // The gutter and its metal grates run beside the concrete, outside the approach.
    rect(g,horizontal(.005),s.half-.17,11.52,.18,28.47,t.rub);
    for(const v of [-.22,10.35,24.57]){
      rect(g,horizontal(.007),s.half-.20,v,.27,.74,ink);
      if(detail)for(let j=-2;j<=2;j++)rect(g,horizontal(.009),s.half-.2,v+j*.13,.23,.047,metal);
    }
    const p=horizontal(.014),pop=s.rail.v0-2.0;
    for(const side of [-1,1]){
      line(g,p,[[side*.53,-.08],[side*.81,-.08],[side*.81,.34]],.052,cream);
      line(g,p,[[side*.58,pop+.06],[side*.79,pop+.06],[side*.79,pop-.16]],.042,t.stripe);
      line(g,p,[[side*.68,25.71],[side*1.00,25.71],[side*1.00,25.22]],.055,cream);
    }
    const white="#ede4cf",finishV=local(s,s.finish.x,s.finish.z).v;
    // A roller left tiny skips in the stripe. The painted edge is also the filmer's finish.
    for(const [l,r] of [[-w+.09,-2.69],[-2.65,-1.35],[-1.33,.81],[.86,2.12],[2.16,w-.08]]){
      rect(g,p,(l+r)/2,finishV,r-l,.102,white);
    }
    if(!detail)return;
    const chips=sol?"#d7d3ba":"#c0b69f",scuff=sol?"#a2ab9a":"#9a9c8c";
    for(const [u,v] of [[-3.20,8.52],[2.24,2.56],[.36,14.98],[-1.82,23.11],[3.37,18.86]]){
      line(g,p,[[u-.42,v+.35],[u-.13,v+.18],[u+.05,v+.23],[u+.42,v-.21],[u+.76,v-.32]],.022,t.joint);
      line(g,p,[[u+.06,v+.22],[u+.17,v+.48],[u+.41,v+.60]],.014,scuff);
      fill(g,p,[[u+.38,v-.19],[u+.57,v-.18],[u+.48,v-.11]],chips);
    }
    for(const [u,v] of [[-1.35,2.74],[1.43,15.47],[-2.02,22.18],[.75,24.30]]){
      for(const delta of [-.11,.11])line(g,p,[[u+delta-.29,v-.22],[u+delta-.08,v-.10],[u+delta+.03,v+.12],[u+delta+.05,v+.43]],.024,scuff);
    }
    const shade=sol?"#a1aa98":"#989a87";
    const r=s.rail;
    rect(g,horizontal(.008),r.u-.12,(r.v0+r.v1)/2-.09,.088,r.v1-r.v0-.06,shade);
    for(const v of [r.v0+.18,(r.v0+r.v1)/2,r.v1-.18])
      line(g,horizontal(.008),[[r.u-.12,v-.09],[r.u,v]],.066,shade);
    rect(g,horizontal(.008),-2.51,-2.35,1.98,.49,shade);
    const b=s.bank;
    fill(g,horizontal(.009),[[b.u-b.w/2,b.v0],[b.u-b.w/2-.27,b.v1-.17],[b.u-b.w/2-.27,b.v2-.17],
      [b.u-b.w/2,b.v3],[b.u-b.w/2+.012,b.v1]],shade);
    letters(g,horizontal(.016),sol?"SOL":"MERCADO",-.02,26.08,sol?.53:.41,sol?t.paint:"#a17b5e",.10);
    const area=horizontal(.016);
    if(sol){
      const x=2.06,z=1.76;
      disk(g,area,x,z+.03,.62,.60,"#d6a47e",19);
      for(let j=0;j<3;j++){
        const v=z-.11-j*.17;
        line(g,horizontal(.019),[[x-.91,v],[x-.68,v-.01],[x-.39,v+.10],[x-.12,v+.10],[x+.16,v-.01],[x+.41,v+.015],[x+.72,v+.10],[x+.89,v+.095]],.048,t.deep);
      }
    }else{
      // A one-colour fruit-crate stamp runs across the two old loading-bay slabs.
      const x=2.13,z=1.69,p=horizontal(.016);
      line(g,p,[[x-.70,z-.59],[x+.66,z-.48],[x+.70,z+.54],[x-.74,z+.45],[x-.70,z-.59]],.063,t.mark);
      for(const [dx,dv] of [[-.27,-.03],[.02,-.19],[.28,.01]])disk(g,p,x+dx,z+dv,.23,.20,"#bc8b60",12);
      line(g,horizontal(.018),[[x-.19,z+.04],[x-.06,z+.17],[x-.08,z+.36]],.044,t.deep);
      fill(g,horizontal(.020),[[x-.06,z+.19],[x+.07,z+.39],[x+.24,z+.37],[x+.12,z+.23]],t.paint);
    }
  }
  function rail(g,s,detail){
    const r=s.rail,u=r.u,h=r.h,front=r.v0,back=r.v1,t=tint[s.id],radius=r.w*.5,sol=s.id==="sol";
    if(sol){
      g.pole([u,h-radius,front+radius],[u,h-radius,back-radius],radius,"#9ead9d",detail?9:5);
      g.box(u,h-.006,(front+back)/2,.023,.012,back-front-.16,"#d3d7bb");
    }else{
      g.box(u,h-.043,(front+back)/2,r.w,.086,back-front,"#a9ae99");
      g.box(u,h-.044,(front+back)/2+.03,r.w+.006,.032,back-front-.16,t.stripe);
    }
    for(const [i,v] of [front+.18,(front+back)/2,back-.18].entries()){
      g.box(u,.020,v,.29,.040,.34,"#888e7e");
      if(detail)for(const side of [-1,1])g.cyl(u+side*.094,.047,v+.087,.022,.023,.012,5,ink);
      if(sol){
        g.pole([u,.032,v],[u,h-.060,v],.043,t.deep,detail?7:4);
        if(detail)g.pole([u,.058,v],[u,.112,v],.054,t.paint,6);
      }else{
        g.box(u,h*.49,v,.072,h-.055,.078,t.deep);if(i!==1)g.box(u,h-.124,v,.088,.068,.28,t.paint);
      }
    }
    if(!detail)return;
    for(const [v,l] of [[front+.53,.38],[front+1.45,.55],[back-.65,.16]]){
      g.box(u,h+.0014,v,.026,.0028,l,sol?"#c9d0b5":"#d6cfac");
      g.box(u+radius*.98,h-.049,v+.068,.0025,.013,.12,"#817e69");
    }
    // Rubbed-in wax on the ground marks the metalwork even with the sound off.
    for(const v of [front+.4,back-.33])rect(g,horizontal(.013),u-.030,v,.31,.49,t.rub);
    for(const v of [front+.63,front+2.41,back-.42])rect(g,horizontal(.014),u+.22,v,.039,.34,t.mark);
  }
  function ledge(g,s,detail){
    const p=s.pad,t=tint[s.id],u=p.u,w=p.w,mid=u+w/2,a=p.v0,b=p.v1,d=b-a,h=p.h;
    g.box(mid,(h-.045)*.5,(a+b)/2,w,h-.045,d,s.id==="sol"?"#aaa899":"#8b8a77");
    g.box(mid,h-.03,(a+b)/2,w+.024,.056,d+.026,s.id==="sol"?"#a1b4a6":"#b9946d");
    g.box(u,h-.026,(a+b)/2,.054,.052,d+.022,"#bdc2ae");
    if(!detail)return;
    const face=(v,y)=>[u-.003,y,v],tess=s.id==="sol"?5:4;
    for(let i=0;i<tess;i++){
      const z=a+(i+.5)*d/tess;
      rect(g,face,z,h*.44,d/tess-.025,h*.61,s.id==="sol"?(i%2?"#78a499":"#68968c"):(i%2?"#a48064":"#a17c60"));
      if(s.id==="sol")line(g,face,[[z-.34,h*.31],[z-.06,h*.48],[z+.24,h*.35]],.024,"#d0c79f");
      else{
        line(g,face,[[z-.39,h*.26],[z+.35,h*.63]],.044,"#bf9a72");
        for(const j of [-.42,.42])rect(g,face,z+j,h*.43,.036,h*.48,"#8a7767");
      }
    }
    for(const [f,l] of [[.14,.44],[.46,.77],[.80,.33]])rect(g,horizontal(h+.003),u+.042,a+d*f,.061,l,t.rub);
    for(const f of [.27,.55,.83])rect(g,horizontal(h+.004),mid,a+d*f,w-.09,.019,t.rim);
  }
  function bank(g,s,detail){
    const b=s.bank,t=tint[s.id],l=b.u-b.w*.5,r=b.u+b.w*.5,h=b.h,sol=s.id==="sol";
    const profile=[[b.v0,.004],[b.v1,h],[b.v2,h],[b.v3,.004]];
    for(let i=1;i<profile.length;i++){
      const [a,y]=profile[i-1],[c,z]=profile[i];
      for(const u of [l,r])g.quad([u,.002,a],[u,.002,c],[u,z,c],[u,y,a],sol?t.paint:"#8d735a");
      g.quad([l,y,a],[r,y,a],[r,z,c],[l,z,c],sol?[t.pours[1],"#c0c4ae","#aeb8a4"][i-1]:["#c4a27b","#d2ae83","#b69b79"][i-1]);
    }
    for(const v of [b.v1,b.v2])g.box(b.u,h-.012,v,b.w+.032,.030,.045,sol?galv:"#a6a999");
    if(!detail)return;
    const surf=(u,v)=>[u,.004+bankHeight(s,Math.min(r-.001,Math.max(l+.001,u)),v),v];
    if(sol){
      fill(g,surf,[[.32,b.v0+.13],[1.28,b.v0+.13],[1.28,b.v1-.08],[1.10,b.v1-.08]],"#88aa9e");
      line(g,surf,[[.19,b.v0+.15],[.99,b.v1-.11]],.052,t.stripe);
      line(g,surf,[[-1.23,b.v0+.16],[-1.23,b.v1-.09]],.073,t.paint);
    }
    for(const v of [b.v0+.085,b.v3-.085])rect(g,surf,0,v,b.w-.045,.091,sol?t.stripe:"#9da397");
    for(const x of [-.68,.72])line(g,surf,[[x,b.v0+.14],[x,b.v1],[x,b.v2],[x,b.v3-.14]],.015,sol?t.joint:"#a48768");
    for(const u of [l+.09,r-.09])for(let i=0;i<9;i++){
      const v=b.v0+.24+(b.v3-b.v0-.48)*i/8;
      disk(g,surf,u,v,.021,.021,metal,6);
    }
    const side=u=>(v,y)=>[u,y,v];
    for(const u of [l-.003,r+.003]){
      if(sol)line(g,side(u),[[b.v0+.53,.05],[b.v1,.23],[b.v2,.23],[b.v3-.49,.049]],.037,t.stripe);
      else{
        for(const v of [b.v0+.96,(b.v1+b.v2)/2,b.v3-.94])rect(g,side(u),v,.095,.20,.094,"#685f50");
        line(g,side(u),[[b.v0+.23,.024],[b.v1,.46],[b.v2,.46],[b.v3-.23,.024]],.036,t.deep);
      }
    }
  }
  function bench(g,s,detail){
    const sol=s.id==="sol",t=tint[s.id],u=-2.43,v=-2.25,wood=sol?"#b89973":"#a48265";
    if(!detail){
      for(const dx of [-.73,.73])g.box(u+dx,.215,v,.082,.43,.35,t.deep);
      g.box(u,.460,v,1.98,.090,.46,wood);g.box(u-.44,.625,v,.53,.24,.30,sol?"#626e67":"#8b775d");return;
    }
    for(const dx of [-.73,.73]){
      g.box(u+dx,.042,v,.16,.084,.44,t.rim);
      for(const side of [-1,1])g.box(u+dx,.221,v+side*.153,.070,.37,.065,t.deep);
      g.box(u+dx,.378,v,.079,.066,.46,ink);
    }
    g.box(u,.40,v,1.94,.071,.28,sol?t.paint:t.deep);
    for(let i=-1;i<=1;i++)g.box(u+Math.abs(i)*.016,.461,v+i*.158,1.98-Math.abs(i)*.027,.086,.140,
      sol?[wood,"#b8a17a","#aa9471"][i+1]:["#97785b",wood,"#ac8967"][i+1]);
    for(const dx of [-.73,.73])for(let j=-1;j<=1;j++)disk(g,horizontal(.506),u+dx,v+j*.158,.018,.016,metal,7);
    // The filmer's field case is closed; a wax puck and labeled spare cassettes sit beside it.
    const caseU=u-.44,caseV=v+.014,bag=sol?"#566762":"#786c56";
    g.box(caseU,.598,caseV,.523,.194,.287,bag,-.09);
    g.box(caseU,.711,caseV,.541,.055,.302,sol?"#68766b":"#948166",-.09);
    for(const dx of [-.18,.18])g.box(caseU+dx,.743,caseV+dx*.09,.025,.014,.271,bag,-.09);
    g.box(caseU,.749,caseV-.015,.14,.024,.042,ink,-.09);
    for(const dx of [-.130,.130])g.box(caseU+dx,.675,caseV-.148+dx*.09,.047,.060,.02,galv);
    for(const [dx,dz,yaw] of [[.11,-.045,-.24],[.31,.070,.11]]){
      const x=u+dx,z=v+dz;
      g.box(x,.524,z,.170,.039,.107,ink,yaw);g.box(x,.548,z,.133,.009,.061,cream,yaw);
      g.box(x-.003,.554,z+.011,.098,.003,.011,sol?t.deep:t.mark,yaw);
    }
    g.cyl(u+.66,.537,v-.057,.066,.073,.065,8,sol?"#c9b899":"#d6b279");
    const wear=horizontal(.5055);
    for(const [a,z,l] of [[-.04,-.164,.20],[-.28,.166,.16],[.52,.003,.17],[.86,.158,.12]])
      line(g,wear,[[u+a,v+z],[u+a+l,v+z+.006]],.012,"#cfb48c");
  }
  function sign(g,s,detail){
    const sol=s.id==="sol",t=tint[s.id],u=2.36,v=-2.40;
    for(const dx of [-.426,.426]){
      g.box(u+dx,.032,v,.19,.064,.20,t.rim);
      g.box(u+dx,.784,v,.061,1.49,.066,sol?"#819b90":"#868873");
    }
    g.box(u,1.187,v,1.245,.852,.090,t.deep);
    const face=(x,y)=>[u+x,y,v-.046],back=(x,y)=>[u-x,y,v+.047];
    rect(g,face,0,1.188,1.188,.797,sol?"#eed7a3":"#e7c99b");
    const front=(x,y)=>[u+x,y,v-.050];
    rect(g,front,0,1.521,1.163,.098,sol?t.paint:"#b67e5b");
    // The city's tide stripe and the market crate mark came from different sign painters.
    if(detail){
      const lettering=(x,y)=>[u+x,y,v-.055];
      letters(g,lettering,sol?"SOL":"EL",-.19,1.118,.292,t.deep,.105);
      letters(g,lettering,sol?"PROMENADE":"MERCADO",-.005,.882,sol?.135:.151,t.deep,.087);
      const dx=.333,dy=1.267;
      disk(g,lettering,dx,dy,.129,.125,sol?"#cd895d":"#b57550",16);
      if(sol)for(let j=0;j<2;j++)line(g,(x,y)=>[u+x,y,v-.060],[[.156,dy-.039-j*.066],[.223,dy-.045-j*.066],[.321,dy+.003-j*.066],[.411,dy-.035-j*.066],[.501,dy-.025-j*.066]],.020,t.deep);
      else{
        line(g,(x,y)=>[u+x,y,v-.06],[[dx,dy+.112],[dx+.015,dy+.185],[dx+.056,dy+.201]],.021,t.deep);
        fill(g,lettering,[[dx+.019,dy+.151],[dx+.064,dy+.224],[dx+.141,dy+.225],[dx+.110,dy+.180]],t.paint);
      }
      for(const x of [-.53,.53])for(const y of [.834,1.553])disk(g,lettering,x,y,.017,.017,"#83877a",6);
      rect(g,back,0,1.184,1.120,.722,sol?"#849b8e":"#959784");
      const sticker=(x,y)=>[u-x,y,v+.052];
      fill(g,sticker,[[-.244,1.17],[-.248,1.21],[.235,1.25],[.269,1.22],[.208,1.182],[-.17,1.149]],cream);
      for(const x of [-.143,.153])disk(g,sticker,x,1.132+(x+.143)*.065,.031,.031,t.deep,8);
    }else{
      rect(g,front,-.17,1.245,.524,.196,t.deep);rect(g,front,.004,.961,.91,.048,t.deep);
    }
    g.box(u,1.622,v,.66,.065,.163,sol?"#7c9185":"#81846e");
    g.box(u,1.591,v-.047,.457,.021,.10,"#c3b38d");
  }
  function lamp(g){
    g.quad([2.135,1.583,-2.490],[2.585,1.583,-2.490],[2.585,1.594,-2.502],[2.135,1.594,-2.502],"#ffdfab");
  }
  function geometry(g,s,detail){
    base(g,s,detail);rail(g,s,detail);ledge(g,s,detail);bank(g,s,detail);bench(g,s,detail);sign(g,s,detail);
  }
  function install(model){
    for(const s of sites){
      model("skate-spot-"+s.id,g=>geometry(g,s,true));
      model("skate-spot-far-"+s.id,g=>geometry(g,s,false));
    }
    model("skate-spot-lamp",lamp);
  }
  function world(list,see,t,hours){
    const night=hours?.night||0;
    for(const s of sites){
      if(!see(s.center,124))continue;
      const near=see(s.center,48);
      list.push([(near?"skate-spot-":"skate-spot-far-")+s.id,s.x,s.y,s.z,s.yaw,0,0,.17*night]);
      if(near&&night>.075)list.push(["skate-spot-lamp",s.x,s.y,s.z,s.yaw,0,0,.86*night]);
    }
  }
  const plans=new Map();
  function plan(s){
    if(plans.has(s.id))return plans.get(s.id);
    const density=25,left=-s.half-.38,bottom=minV-.31,width=-2*left,depth=maxV-minV+.62;
    const w=Math.ceil(width*density),h=Math.ceil(depth*density);
    const page=typeof OffscreenCanvas==="function"?new OffscreenCanvas(w,h):typeof document!=="undefined"?document.createElement("canvas"):null;
    if(page){page.width=w;page.height=h;}
    const c=page?.getContext?.("2d");
    if(!c?.createImageData||!c?.putImageData){plans.set(s.id,null);return null;}
    const layer=c.createImageData(w,h),pixels=layer.data,depths=new Float32Array(w*h);depths.fill(-Infinity);
    // Paint the same mesh once. Sloped riding surfaces and their coping occlude in height order per pixel.
    const mesh=new BayMesh();geometry(mesh,s,true);
    const verts=mesh.vertices,sx=w/width,sy=h/depth,cx=Math.cos(s.yaw),sn=Math.sin(s.yaw);
    const liftU=.22*cx-.27*sn,liftV=.22*sn+.27*cx;
    const point=i=>[(verts[i]+liftU*verts[i+1]-left)*sx,(verts[i+2]+liftV*verts[i+1]-bottom)*sy,verts[i+1]];
    for(let i=0;i<verts.length;i+=18){
      const a=point(i),b=point(i+6),d=point(i+12);
      const bx=b[0]-a[0],by=b[1]-a[1],dx=d[0]-a[0],dy=d[1]-a[1],area=bx*dy-by*dx;
      if(Math.abs(area)<.00001)continue;
      const inv=1/area,loX=Math.max(0,Math.floor(Math.min(a[0],b[0],d[0]))),hiX=Math.min(w-1,Math.ceil(Math.max(a[0],b[0],d[0])));
      const loY=Math.max(0,Math.floor(Math.min(a[1],b[1],d[1]))),hiY=Math.min(h-1,Math.ceil(Math.max(a[1],b[1],d[1])));
      const red=Math.min(255,verts[i+3]*255),green=Math.min(255,verts[i+4]*255),blue=Math.min(255,verts[i+5]*255);
      for(let y=loY;y<=hiY;y++){
        const vy=y+.5-a[1];
        for(let x=loX;x<=hiX;x++){
          const vx=x+.5-a[0],p=(vx*dy-vy*dx)*inv,q=(bx*vy-by*vx)*inv;
          if(p<-.000001||q<-.000001||p+q>1.000001)continue;
          const index=y*w+x,lift=a[2]+p*(b[2]-a[2])+q*(d[2]-a[2]);
          if(lift<depths[index]-.00001)continue;
          depths[index]=lift;const j=index*4;pixels[j]=red;pixels[j+1]=green;pixels[j+2]=blue;pixels[j+3]=255;
        }
      }
    }
    c.putImageData(layer,0,0);
    const result={page,left,bottom,width,depth};plans.set(s.id,result);return result;
  }
  function outline(c,s,color){
    const points=insetOutline(s);c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fill();
  }
  function paperPlan(c,s){
    const t=tint[s.id];outline(c,s,t.pours[1]);
    const {rail:r,bank:b,pad:p}=s;
    c.fillStyle=galv;c.fillRect(r.u-r.w*.5,r.v0,r.w,r.v1-r.v0);
    c.fillStyle=t.paint;c.fillRect(p.u,p.v0,p.w,p.v1-p.v0);
    c.fillStyle=s.id==="sol"?t.edge:"#b39875";c.fillRect(b.u-b.w*.5,b.v0,b.w,b.v3-b.v0);
    c.fillStyle=t.rim;c.fillRect(b.u-b.w*.5,b.v1,b.w,b.v2-b.v1);
    c.fillStyle=t.deep;c.fillRect(-3.42,-2.48,1.98,.48);c.fillRect(1.74,-2.45,1.24,.35);
  }
  function icon(c,s){
    const t=tint[s.id];c.rotate(-.33);
    c.fillStyle=ink;c.beginPath();c.ellipse(0,0,7.06,4.53,0,0,tau);c.fill();
    c.fillStyle=cream;c.beginPath();c.moveTo(-5.15,-.98);c.lineTo(-3.21,-.58);c.lineTo(3.35,-.58);c.lineTo(4.73,-1.45);
    c.lineTo(5.07,-.81);c.lineTo(3.47,.62);c.lineTo(-3.50,.62);c.lineTo(-5.27,-.28);c.closePath();c.fill();
    c.fillStyle=s.id==="sol"?t.stripe:"#e4ac80";
    for(const x of [-2.52,2.55]){c.beginPath();c.arc(x,1.60,.86,0,tau);c.fill();}
  }
  function map(c,opt,px,py,scale,visible){
    if(opt.mode==="atlas"&&(opt.countyChart||opt.marina?.bayChart))return;
    const street=opt.mode==="street",size=c.canvas?Math.min(c.canvas.width,c.canvas.height):230;
    const ui=Math.max(.70,Math.min(1.65,size/(opt.mode==="radar"?165:370)));
    for(const s of sites){
      const p=street?s.center:s.stand;
      if(!visible(px(p.x),py(p.z),street?17*scale+4:9*ui))continue;
      c.save();
      if(street){
        c.translate(px(s.x),py(s.z));c.rotate(s.yaw);c.scale(scale,-scale);
        const plate=plan(s);
        if(plate)c.drawImage(plate.page,plate.left,plate.bottom,plate.width,plate.depth);else paperPlan(c,s);
        const night=opt.weather?.night||0;
        if(night>.04){
          c.globalAlpha*=night*.27;outline(c,s,"#384b63");
          c.globalAlpha=night*.76;c.fillStyle="#ffe1a4";c.fillRect(2.49,-2.09,.44,.049);
        }
      }else{
        c.translate(px(s.stand.x),py(s.stand.z));c.scale(ui,ui);icon(c,s);
      }
      c.restore();
    }
  }
  window.BaySkateSpots={sites,at,local,bankHeight,floor,blocks:solids,cameraBlocks,install,world,map};
})();
