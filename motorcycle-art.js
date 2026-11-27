/* Paloma 90 and Heron 500. The wheel hubs, steering yoke and saddle contacts are used by both renderers. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,sides=[-1,1];
  const clamp=(n,lo,hi)=>Math.max(lo,Math.min(hi,n)),mix=(a,b,u)=>a+(b-a)*u;
  const metal="#a4aaa1",chrome="#d7d6bc",darkMetal="#586366",ink="#303c40",rubber="#363d3e",tread="#434748",
    leather="#815439",seam="#be9870",ivory="#eadfbd",red="#ad4944",stop="#ff715c",amber="#d18a45",turnLamp="#ffe09a",lamp="#f6dfac";
  const specs={
    paloma:{name:"Paloma 90",paint:"#d6a34e",paints:["#d6a34e","#76a186"],axles:[-.64,.65],radii:[.257,.257],wheelbase:1.29,
      footprint:{track:.322,halfLength:.966},pivot:[0,.906,.423],rake:.245,hubWidth:[.064,.061],
      seats:{pilot:[0,.782,.005],pillion:[0,.842,-.520]},grip:[.318,1.041,.289],sole:{pilot:[.168,.247,.135],pillion:[.220,.326,-.452]},
      grab:[.170,.828,-.647],approach:.68,eyes:{pilot:[0,1.524,.166],pillion:[0,1.638,-.381]},standPivot:[-.136,.236,-.248]},
    heron:{name:"Heron 500",paint:"#366778",paints:["#366778"],axles:[-.74,.71],radii:[.319,.326],wheelbase:1.45,
      footprint:{track:.346,halfLength:1.092},pivot:[0,.885,.400],rake:.307,hubWidth:[.074,.062],
      seats:{pilot:[0,.790,-.062],pillion:[0,.865,-.609]},grip:[.339,1.013,.252],sole:{pilot:[.215,.347,-.111],pillion:[.230,.384,-.558]},
      grab:[.172,.867,-.743],approach:.72,eyes:{pilot:[0,1.492,.146],pillion:[0,1.659,-.471]},standPivot:[-.137,.304,-.201]}
  };
  const spec=b=>specs[b.kind]||specs.heron;
  const paint=b=>spec(b).paints.includes(b.color)?b.color:spec(b).paint;
  const style=(b)=>"moto/"+(b.kind==="paloma"?"paloma":"heron")+"/"+paint(b).slice(1);
  const kindKey=b=>"moto/"+(b.kind==="paloma"?"paloma":"heron");
  const scooter=b=>b.kind==="paloma";
  const shade=(a,b,f)=>{
    const pick=(s,i)=>parseInt(s.slice(i,i+2),16);
    return "#"+[1,3,5].map(i=>Math.round(mix(pick(a,i),pick(b,i),f)).toString(16).padStart(2,"0")).join("");
  };
  const sub=(a,b)=>a.map((v,i)=>v-b[i]),add=(a,b)=>a.map((v,i)=>v+b[i]);
  const worldGround=(b,value,x=b.x,z=b.z)=>typeof value==="function"?value(x,z):value??b.y??0;
  function foundation(b,ground){
    const f={x:b.x,y:worldGround(b,ground)+(b.air||0),z:b.z,yaw:b.yaw||0,
      tilt:-(b.pitch||0),lean:-(b.lean||0)+.095*clamp(b.stand||0,0,1)};
    if(b.wheelLift){
      // Rotate around the rear hub so the tyre stays planted on the same patch of road.
      const s=spec(b),z=s.axles[0],r=s.radii[0],a=f.tilt,next=a-b.wheelLift;
      const dc=Math.cos(a)-Math.cos(next),ds=Math.sin(a)-Math.sin(next);
      const dy=r*dc-z*ds,dz=r*ds+z*dc,dx=-Math.sin(f.lean)*dy;
      f.x+=Math.cos(f.yaw)*dx+Math.sin(f.yaw)*dz;f.z+=Math.cos(f.yaw)*dz-Math.sin(f.yaw)*dx;
      f.y+=Math.cos(f.lean)*dy;f.tilt=next;
    }
    return f;
  }
  function basis(yaw,tilt,lean){
    const cy=Math.cos(yaw),sy=Math.sin(yaw),cp=Math.cos(tilt),sp=Math.sin(tilt),cr=Math.cos(lean),sr=Math.sin(lean);
    return [[cy*cr,sr,-sy*cr],[-cy*sr*cp+sy*sp,cr*cp,sy*sr*cp+cy*sp],[cy*sr*sp+sy*cp,-cr*sp,-sy*sr*sp+cy*cp]];
  }
  function rotated(mat,p){return [0,1,2].map(i=>mat[0][i]*p[0]+mat[1][i]*p[1]+mat[2][i]*p[2]);}
  function angles(mat){return [Math.atan2(-mat[0][2],mat[0][0]),Math.atan2(-mat[2][1],mat[1][1]),Math.asin(clamp(mat[0][1],-1,1))];}
  function axisRotation(axis,ang){
    const c=Math.cos(ang),s=Math.sin(ang),d=1-c,[x,y,z]=axis;
    return [[c+x*x*d,y*x*d+z*s,z*x*d-y*s],[x*y*d-z*s,c+y*y*d,z*y*d+x*s],[x*z*d+y*s,y*z*d-x*s,c+z*z*d]];
  }
  function pose(b,ground){
    const f=foundation(b,ground),base=basis(f.yaw,f.tilt,f.lean),sp=spec(b);
    const stem=axisRotation([0,Math.cos(sp.rake),-Math.sin(sp.rake)],b.steer||0);
    const fork=stem.map(p=>rotated(base,p));
    return {f,sp,base,stem,fork};
  }
  function at(M,p){
    const v=rotated(M.base,p);return {x:M.f.x+v[0],y:M.f.y+v[1],z:M.f.z+v[2]};
  }
  const steered=(M,p)=>add(M.sp.pivot,rotated(M.stem,sub(p,M.sp.pivot)));
  function point(b,x,y,z,ground){return at(pose(b,ground),[x,y,z]);}
  const frame=(b,ground)=>foundation(b,ground);
  const seat=(b,pos="pilot",ground)=>at(pose(b,ground),spec(b).seats[pos]||spec(b).seats.pilot);
  function paired(b,v,turning,ground){
    const M=pose(b,ground);
    return sides.map(k=>{const p=[k*v[0],v[1],v[2]];return at(M,turning?steered(M,p):p);});
  }
  const grips=(b,g)=>paired(b,spec(b).grip,true,g);
  const pegs=(b,pos="pilot",g)=>paired(b,spec(b).sole[pos]||spec(b).sole.pilot,false,g);
  const grabs=(b,g)=>paired(b,spec(b).grab,false,g);
  function approach(b,pos="pilot",side=-1,ground){
    const sp=spec(b),yaw=b.yaw||0,s=Math.sign(side)||-1,x=s*sp.approach,z=(sp.seats[pos]||sp.seats.pilot)[2]-.055;
    const X=b.x+Math.cos(yaw)*x+Math.sin(yaw)*z,Z=b.z-Math.sin(yaw)*x+Math.cos(yaw)*z;
    return {x:X,z:Z,y:worldGround(b,ground,X,Z),yaw:yaw-s*.30};
  }
  function eye(b,ground,pos="pilot"){
    const M=pose(b,ground),p=at(M,M.sp.eyes[pos]||M.sp.eyes.pilot);
    return {...p,y:p.y-(b.touchFlex||0)*.062,yaw:M.f.yaw,pitch:-M.f.tilt-.072-(b.touchFlex||0)*.042,roll:-M.f.lean};
  }
  const pipe=(g,a,b,r,col,n=7)=>g.pole(a,b,r,col,n);
  function tube(g,p,r,col,n=7){for(let i=1;i<p.length;i++)pipe(g,p[i-1],p[i],r,col,n);}
  // A turned cross-section about a wheel axle. Spokes, hub and brake drum share the wheel origin.
  function turned(g,stations,n,center=[0,0,0]){
    const p=(k,i)=>[center[0]+k[0],center[1]+Math.cos(i*tau/n)*k[1],center[2]+Math.sin(i*tau/n)*k[1]];
    for(let j=0;j<stations.length-1;j++){
      const a=stations[j],b=stations[j+1];
      for(let i=0;i<n;i++)g.quad(p(a,i),p(a,i+1),p(b,i+1),p(b,i),a[2],.92+.07*Math.cos(i*tau/n-.37));
    }
  }
  function cap(g,center,axis,r,col,n=10){
    const [x,y,z]=center;
    const p=i=>axis==="x"?[x,y+r*Math.cos(i*tau/n),z+r*Math.sin(i*tau/n)]:
      axis==="z"?[x+r*Math.cos(i*tau/n),y+r*Math.sin(i*tau/n),z]:[x+r*Math.cos(i*tau/n),y,z+r*Math.sin(i*tau/n)];
    for(let i=0;i<n;i++)g.tri(center,p(i),p(i+1),col);
  }
  function turnedCap(g,x0,x1,y,z,r,col,n=10){
    const side=x0*x1>0;
    if(r>.0095||!side)pipe(g,[x0,y,z],[x1,y,z],r,col,n);
    if(!side||Math.abs(x0)>Math.abs(x1))cap(g,[x0,y,z],"x",r,col,n);
    if(!side||Math.abs(x1)>=Math.abs(x0))cap(g,[x1,y,z],"x",r,col,n);
  }
  function ellipseEnd(g,p,rx,ry,tint,n=10){
    const q=i=>[p[0]+Math.cos(i*tau/n)*rx,p[1]+Math.sin(i*tau/n)*ry,p[2]];
    for(let i=0;i<n;i++)g.tri(p,q(i),q(i+1),tint);
  }
  function wheel(g,b,idx,near){
    const sp=spec(b),r=sp.radii[idx],w=sp.hubWidth[idx],n=near?20:8,isScoot=scooter(b);
    if(!near){
      turned(g,[[-w*.8,r*.63,rubber],[-w*.64,r,tread],[w*.64,r,rubber],[w*.8,r*.63,rubber]],n);
      for(const side of sides)cap(g,[side*.051,0,0],"x",r*.53,isScoot?"#bcc6ad":metal,6);
      return;
    }
    const tyreDepth=isScoot?.069:.075,rim=r-tyreDepth;
    turned(g,[[-w*.68,rim-.010,metal],[-w,rim+.012,isScoot?"#c8c8ad":"#666d65"],[-w*.97,rim+.024,rubber],
      [-w*.75,r-.010,tread],[0,r,tread],[w*.75,r-.010,rubber],[w*.97,rim+.024,isScoot?"#c8c8ad":"#666d65"],
      [w,rim+.012,metal],[w*.68,rim-.010,metal]],n);
    turned(g,[[-w*.70,rim+.002,chrome],[-w*.78,rim-.010,darkMetal],[-w*.52,rim-.024,metal],[w*.52,rim-.024,darkMetal],[w*.78,rim-.010,chrome],[w*.70,rim+.002,chrome]],n);
    const radial=(x,rad,a)=>[x,Math.cos(a)*rad,Math.sin(a)*rad];
    if(isScoot){
      turnedCap(g,-w*.8,w*.82,0,0,.076,"#9da299",12);
      for(const side of sides)for(let j=0;j<6;j++){
        const a=j*tau/6,h=rim-.017;
        const points=[radial(side*.045,.061,a-.33),radial(side*.056,h,a-.3),radial(side*.054,h,a+.025),radial(side*.064,.067,a+.32)];
        g.quad(...points,"#b3b5a4",side>0?1:.91);
        if(j%2===0)cap(g,radial(side*.063,.045,a),"x",.008,ink,5);
      }
    }else{
      turnedCap(g,-.065,.065,0,0,.055,metal,10);
      for(let j=0;j<18;j++){
        const a=j*tau/18,h=.85*(j%2?1:-1),side=j%2?1:-1,inner=radial(side*.046,.047,a+h),outer=radial(side*.031,rim-.024,a);
        const dy=.0036*Math.sin(a+h*.38),dz=.0036*Math.cos(a+h*.38);
        g.quad([inner[0],inner[1]-dy,inner[2]+dz],[outer[0],outer[1]-dy,outer[2]+dz],[outer[0],outer[1]+dy,outer[2]-dz],[inner[0],inner[1]+dy,inner[2]-dz],j%3?chrome:metal);
      }
    }
    if(!idx&&isScoot)return;
    const side=idx?-1:1,br=idx?r*.49:r*.43,bx=side*(w+.008),brIn=br*.72;
    turned(g,[[bx-.004,br,metal],[bx+.004,br,chrome],[bx+.004,brIn,darkMetal]],16);
    for(let i=0;i<6;i++){
      const a=tau*i/6,bend=a+.25;
      g.quad(radial(bx,.043,a-.22),radial(bx,brIn+.004,bend-.17),radial(bx,brIn+.004,bend+.12),radial(bx,.043,a+.24),darkMetal);
      cap(g,radial(bx+side*.006,br*.86,a),"x",.0062,ink,5);
    }
  }
  // Elliptical stations in z make pressed sheet metal, tanks and hand-sewn seats.
  function loftPoint(st,a){const [z,y,w,down,up]=st,n=Math.sin(a);return [w*Math.cos(a),y+n*(n>=0?up:down),z];}
  function loft(g,stations,n,col,lower=col,face=col){
    for(let j=0;j<stations.length-1;j++)for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n,m=(a+b)/2;
      g.quad(loftPoint(stations[j],a),loftPoint(stations[j+1],a),loftPoint(stations[j+1],b),loftPoint(stations[j],b),Math.sin(m)<-.20?lower:col,1+.095*Math.sin(m)-.035*Math.cos(m));
    }
    for(const st of [stations[0],stations.at(-1)])for(let i=0;i<n;i++)g.tri([0,st[1],st[0]],loftPoint(st,i*tau/n),loftPoint(st,(i+1)*tau/n),face);
  }
  function stripe(g,st,side,a,b,col,raise=.002){
    const at=(s,t)=>{const p=loftPoint(s,side>0?t:pi-t);p[0]+=side*raise;return p;};
    for(let i=1;i<st.length;i++)g.quad(at(st[i-1],a),at(st[i],a),at(st[i],b),at(st[i-1],b),col);
  }
  function mudguard(g,z,y,r,w,a0,a1,col,near){
    const N=near?12:5;
    const profile=near?[[-w*.99,r-.018],[-w,r+.014],[-w*.73,r+.040],[0,r+.053],[w*.73,r+.040],[w,r+.014],[w*.99,r-.018]]:
      [[-w,r+.007],[0,r+.044],[w,r+.007]];
    const p=(i,j)=>[profile[j][0],y+Math.cos(mix(a0,a1,i/N))*profile[j][1],z+Math.sin(mix(a0,a1,i/N))*profile[j][1]];
    for(let i=0;i<N;i++)for(let j=0;j<profile.length-1;j++)g.quad(p(i,j),p(i+1,j),p(i+1,j+1),p(i,j+1),col,.86+.15*Math.sin((j+.55)/(profile.length-1)*pi));
  }
  function seatShell(g,b,near){
    const s=scooter(b),st=s?[
      [-.774,.788,.087,.031,.022],[-.711,.798,.154,.041,.030],[-.574,.805,.173,.057,.038],[-.42,.791,.159,.058,.052],[-.32,.763,.151,.044,.048],[-.207,.748,.147,.039,.036],[-.038,.747,.13,.047,.035],[.085,.758,.084,.046,.026],[.128,.763,.046,.032,.017]]:
      [[-.860,.806,.066,.039,.024],[-.796,.817,.12,.049,.040],[-.648,.822,.151,.052,.044],[-.493,.811,.155,.057,.048],[-.375,.779,.147,.052,.055],[-.263,.758,.15,.05,.040],[-.095,.752,.126,.050,.038],[.007,.758,.110,.045,.034],[.064,.776,.081,.035,.02]];
    const col=s?leather:"#4a4640";loft(g,st,near?12:6,col,s?"#654936":"#393b38");
    if(!near)return;
    for(const k of sides)stripe(g,st,k,-.04,.055,s?"#c3a276":"#a2977e");
    for(let j=1;j<st.length-1;j++){const p=st[j];
      if(j%2===0||s&&j>4)continue;
      const front=[p[0]+.009,...p.slice(1)];
      for(let i=0;i<7;i++){
        const a=.22+i*(pi-.44)/7,b=.22+(i+1)*(pi-.44)/7,q=(s,v)=>{const v0=loftPoint(s,v);v0[1]+=.0025;return v0;};
        g.quad(q(p,a),q(p,b),q(front,b),q(front,a),s?"#846349":"#61594a");
      }
    }
    const band=st[4];for(let i=0;i<10;i++){
      const a=-.045+i*(pi+.09)/10,c=a+(pi+.09)/10;
      const p=(t,d)=>{const o=loftPoint(band,t);return [o[0]*1.012,o[1]+.004,o[2]+d];};
      g.quad(p(a,-.014),p(c,-.014),p(c,.014),p(a,.014),s?"#5d4839":"#333c3c");
    }
  }
  function rack(g,b,near){
    const sp=spec(b),s=scooter(b),[w,y,z]=sp.grab,rear=s?-.820:-.902;
    for(const k of sides){
      tube(g,[[k*.141,y-.14,z+.15],[k*w,y-.006,z+.079],[k*w,y,z],[k*(w-.014),y-.006,rear],[k*.082,y-.01,rear-.025]],near?.012:.015,chrome,near?7:4);
      if(near){pipe(g,[k*.155,y-.115,rear+.035],[k*(w-.014),y-.006,rear],.008,metal,5);
        pipe(g,[k*w,y,z-.044],[k*w,y,z+.047],.017,s?"#aa8566":"#676c61",7);}
    }
    pipe(g,[-.084,y-.01,rear-.025],[.084,y-.01,rear-.025],.012,chrome,near?7:4);
    if(near&&s)for(const x of [-.079,0,.079])pipe(g,[x,y-.012,rear-.018],[x,y-.012,rear+.132],.007,chrome,6);
  }
  function peg(g,s,center,near){
    for(const k of sides){
      const [x,y,z]=center;
      if(s){g.box(k*x,y-.017,z,.071,.031,.169,"#515956");if(near)for(let j=0;j<4;j++)g.box(k*x,y+.001,z-.06+j*.04,.072,.003,.009,metal);}
      else{pipe(g,[k*(x-.082),y-.020,z],[k*(x+.042),y-.020,z],.021,rubber,near?8:5);
        if(near)for(let j=0;j<4;j++)pipe(g,[k*(x-.03+j*.014),y-.019,z],[k*(x-.026+j*.014),y-.019,z],.022,"#59625b",6);}
    }
  }
  function tail(g,b,near){
    const s=scooter(b),y=s?.694:.728,z=s?-.900:-.978;
    g.box(0,y,z,.168,.088,.060,s?ivory:ink);
    g.box(0,y+.010,z-.032,.140,.049,.015,red);
    g.box(0,y-.087,z-.028,.140,.085,.011,"#d9cbae");
    if(near){
      for(const k of sides){g.box(k*.043,y-.073,z-.035,.038,.012,.003,"#58686a");g.box(k*.054,y+.031,z-.041,.014,.004,.003,"#dbc0a5");
        const x=s?.201:.218;pipe(g,[k*.068,y+.008,z+.036],[k*x,y+.008,z+.034],.013,ink,6);
        g.box(k*x,y+.008,z+.036,.054,.040,.052,darkMetal);g.box(k*x,y+.011,z+.006,.043,.032,.012,amber);
      }g.box(-.013,y-.103,z-.035,.078,.009,.003,"#818d78");
    }
  }
  function frontLamp(g,b,near){
    if(scooter(b)){
      const p=paint(b);
      loft(g,[[.368,1.029,.091,.064,.073],[.419,1.033,.130,.076,.072],[.481,1.037,.107,.057,.046]],near?12:6,p,ivory);
      g.box(0,1.035,.485,.192,.093,.011,chrome);g.box(0,1.036,.494,.173,.073,.012,lamp);
      if(near)for(const x of [-.059,-.031,0,.031,.059])g.box(x,1.038,.502,.004,.056,.003,"#eee6c4");
    }else{
      const y=.927;
      loft(g,[[.435,y,.042,.044,.050],[.481,y,.093,.091,.091],[.550,y,.098,.098,.098],[.574,y,.094,.091,.091]],near?14:8,ink,ink);
      pipe(g,[0,y,.551],[0,y,.576],.096,chrome,near?16:8);
      ellipseEnd(g,[0,y,.579],.087,.085,lamp,near?16:8);
      if(near)for(const off of [-.057,-.034,-.012,.012,.034,.057]){
        const h=Math.sqrt(.075*.075-off*off);g.box(off,y,.580,.003,2*h,.002,"#e5dcb4");
      }
    }
  }
  function bar(g,b,near){
    const sp=spec(b),s=scooter(b),[w,h,z]=sp.grip,hy=s?1.001:.978,hz=s?.425:.373;
    for(const k of sides){
      tube(g,[[0,hy,hz],[k*.13,hy+.008,hz-.004],[k*.182,h+.009,z+.066],[k*(w-.05),h+.003,z+.016],[k*(w+.051),h-.003,z-.017]],near?.012:.016,chrome,near?8:4);
      pipe(g,[k*(w-.061),h+.003,z+.020],[k*(w+.046),h-.002,z-.016],.021,rubber,near?8:5);
      if(!near)continue;
      for(let n=-2;n<=2;n++){const f=n*.014;pipe(g,[k*(w+f),h,z-f*.345],[k*(w+f+.003),h,z-(f+.003)*.345],.022,"#4d5652",7);}
      g.box(k*(w-.078),h,z+.027,.033,.047,.044,ink,.1*k);g.box(k*(w-.079),h+.023,z+.015,.017,.006,.013,k===1?red:"#789887");
      tube(g,[[k*(w-.102),h-.003,z+.037],[k*(w-.076),h+.002,z+.072],[k*(w+.014),h-.010,z+.058],[k*(w+.043),h-.013,z+.039]],.0062,chrome,6);
      const top=s?1.240:1.227,mirror=s?.365:.391;
      tube(g,[[k*(w-.096),h+.014,z+.044],[k*(w-.081),top-.105,z+.05],[k*(mirror-.020),top-.025,z+.067]],.008,metal,7);
      const center=[k*mirror,top,z+.071],rx=s?.048:.062,ry=s?.047:.037;
      ellipseEnd(g,[center[0],top,center[2]+.010],rx,ry,s?ivory:ink,12);
      ellipseEnd(g,[center[0],top,center[2]-.006],rx,ry,chrome,12);
      ellipseEnd(g,[center[0],top,center[2]-.008],rx-.005,ry-.004,"#8aa6a3",12);
      const yy=s?.836:.889,zz=s?.535:.525,xx=s?.139:.196;
      if(!s)pipe(g,[k*.063,yy,zz-.020],[k*(xx-.016),yy,zz-.012],.009,metal,6);
      g.box(k*xx,yy,zz,.046,.036,.038,amber);
    }
    if(!near)return;
    const y=s?1.113:1.045,p=s?.390:.435;
    if(s){
      g.box(0,y-.024,p,.106,.047,.069,ivory);g.box(0,y+.001,p,.089,.004,.054,ink);
      g.box(-.006,y+.004,p,.064,.003,.033,"#c7c6a7");pipe(g,[-.019,y+.009,p-.01],[-.004,y+.009,p+.009],.0025,red,4);
    }else for(const k of sides){
      const x=k*.052;g.cyl(x,y-.032,p,.051,.047,.061,10,ink);g.cyl(x,y,p,.050,.050,.005,12,chrome);g.cyl(x,y+.004,p,.044,.044,.003,12,"#424d4b");
      for(let j=0;j<6;j++){
        const a=(-.76+j*.304)*pi,z=p+Math.cos(a)*.034,X=x+Math.sin(a)*.034,d=.0022;
        g.quad([X-d,y+.007,z-.002],[X+d,y+.007,z-.002],[X+d,y+.007,z+.003],[X-d,y+.007,z+.003],ivory);
      }
      pipe(g,[x,y+.01,p],[x-.019,y+.01,p-.013],.0025,red,4);
    }
  }
  function brake(g,b,idx,near){
    if(!near)return;
    const sp=spec(b),z=sp.axles[idx],y=sp.radii[idx],k=idx?-1:1,r=sp.hubWidth[idx];
    if(idx||!scooter(b)){
      g.box(k*(r+.021),y+.057,z-.082,.032,.089,.061,darkMetal);
      for(const dy of [.032,.077])turnedCap(g,k*(r+.031),k*(r+.041),y+dy,z-.076,.009,chrome,6);
    }
  }
  function fork(g,b,near){
    const s=scooter(b),sp=spec(b),y=sp.radii[1],z=sp.axles[1],fcol=s?paint(b):metal;
    mudguard(g,z,y,y+.020,sp.hubWidth[1]+.017,s?-1.72:-1.52,s?1.40:1.30,fcol,near);
    for(const k of sides){
      if(s&&k>0){if(near)pipe(g,[k*.072,y+.054,z-.11],[k*.067,y+.207,z-.134],.009,metal,6);continue;}
      const x=k*(s?.083:.095),ax=[x,y,z];
      if(s){
        tube(g,[ax,[x,y+.035,z-.103],[x,.586,.475],[k*.055,.790,.473],[k*.038,.925,.432]],.037,"#8a9690",near?8:5);
        if(near){pipe(g,[x*1.03,.322,.555],[x*1.03,.562,.509],.019,ink,8);
          for(let i=0;i<5;i++)g.cyl(x*1.03,.342+i*.037,.552-i*.009,.025,.025,.010,7,metal);}
      }else{
        tube(g,[ax,[x,.480,.636],[x,.668,.557],[x,.862,.475],[x,.978,.418]],.024,chrome,near?10:6);
        pipe(g,ax,[x,.591,.589],.031,"#646f6c",near?9:5);
        pipe(g,[x,.572,.598],[x,.732,.53],.034,ink,near?9:5);
        if(near){
          for(let i=0;i<6;i++)pipe(g,[x,.580+i*.025,.596-i*.0106],[x,.589+i*.025,.592-i*.0106],.038,"#56605e",8);
          pipe(g,[x,.797,.502],[k*.072,.900,.511],.011,metal,6);
          pipe(g,[x,y,z],[k*.071,y+.049,z+.261],.0065,metal,5);
          pipe(g,[x,y,z],[k*.071,y+.121,z-.232],.0065,metal,5);
          turnedCap(g,x-.012,x+.012,y,z,.028,chrome,8);
        }
      }
    }
    if(!s){g.box(0,.864,.472,.235,.026,.047,darkMetal);g.box(0,.967,.424,.217,.025,.055,metal);}
    frontLamp(g,b,near);bar(g,b,near);brake(g,b,1,near);
    if(near){
      const yy=s?1.038:.990,top=s?.298:.267;
      tube(g,[[-.221,yy,top],[-.155,yy-.078,top+.135],[-.075,.853,.514],[-.036,.683,.538]],.0057,ink,5);
      if(!s)tube(g,[[-.036,.683,.538],[-.087,.604,.567],[-.102,.427,.616],[-.095,.389,.651]],.006,ink,5);
    }
  }
  function stand(g,b,near){
    const s=scooter(b),reach=s?.22745:.29677;
    pipe(g,[0,0,0],[-.070,-reach,.014],.013,ink,near?8:4);
    g.box(-.075,-reach,.024,.077,.014,.065,darkMetal,-.24);
    if(near){
      pipe(g,[-.039,-reach*.56,.02],[-.108,-reach*.73,.051],.006,metal,7);
      pipe(g,[-.108,-reach*.73,.051],[-.115,-reach*.73,.092],.009,rubber,6);
      turnedCap(g,-.022,.022,0,0,.021,metal,7);
    }
  }
  function standAngles(b,M){
    // The foot swings from behind the crank to the left of both contact patches.
    const u=clamp(b.stand||0,0,1),fold=1-u;
    const local=basis(0,1.40*fold,-.318*u-.030*fold);
    return angles(local.map(axis=>rotated(M.base,axis)));
  }
  function shield(g,b,near){
    const color=paint(b),ribs=[
      [.233,.318,.290,.198,.030],[.282,.343,.302,.214,.028],[.412,.369,.309,.231,.026],
      [.631,.422,.362,.235,.024],[.821,.471,.426,.220,.024],[.913,.456,.423,.190,.025],[.947,.435,.411,.152,.024]];
    const slicing=near?[-1,-.83,-.50,0,.50,.83,1]:[-1,0,1];
    const part=(r,x,back=false)=>{
      const [h,c,e,w,d]=r;return [x*w,h-(Math.abs(x)**1.8)*.033,mix(c,e,x*x)-(back?d:0)];
    };
    for(let j=0;j<ribs.length-1;j++){
      const a=ribs[j],c=ribs[j+1];
      for(let i=0;i<slicing.length-1;i++){
        const l=slicing[i],r=slicing[i+1];
        g.quad(part(a,l),part(a,r),part(c,r),part(c,l),ivory,.99-.065*Math.abs(l+r)*.5);
        if(near)g.quad(part(a,r,true),part(a,l,true),part(c,l,true),part(c,r,true),"#d0c6a6",.89+.04*r);
      }
      for(const s of sides){
        g.quad(part(a,s),part(c,s),part(c,s,true),part(a,s,true),color);
        if(near)pipe(g,part(a,s),part(c,s),.0075,chrome,6);
      }
    }
    if(!near)return;
    const p=(x,y,z)=>[x,y,z];
    g.quad(p(-.036,.704,.451),p(.036,.704,.451),p(.034,.886,.478),p(-.034,.886,.478),color);
    for(let j=0;j<4;j++){const y=.724+j*.026,z=.453+j*.0038;g.box(0,y,z,.045-.002*j,.006,.009,ink);}
    g.box(0,.873,.479,.041,.029,.005,metal);
    g.tri([-.014,.872,.484],[0,.883,.484],[.014,.872,.484],color);
    for(const k of sides){
      pipe(g,[k*.120,.621,.391],[k*.122,.684,.397],.007,chrome,6);
      g.box(k*.117,.712,.371,.037,.027,.018,ivory);
    }
    // Painted glovebox just inside the leg shield with a separate latch and piano hinge.
    g.box(0,.684,.354,.245,.162,.047,"#c6bda2");
    g.box(0,.685,.327,.226,.145,.012,ivory);
    g.box(0,.724,.318,.037,.014,.008,metal);
    pipe(g,[-.073,.625,.320],[.073,.625,.320],.005,darkMetal,6);
    tube(g,[[.213,.628,.369],[.213,.683,.393],[.210,.720,.403]],.010,chrome,6);
  }
  function palomaFrame(g,b,near){
    const col=paint(b),shadow=shade(col,ink,.20),upper=shade(col,ivory,.28);
    const st=[[-.929,.565,.047,.045,.072],[-.862,.590,.130,.101,.104],[-.737,.584,.196,.144,.160],[-.532,.560,.212,.157,.182],
      [-.352,.535,.207,.158,.182],[-.164,.502,.172,.144,.196],[-.067,.461,.149,.125,.213],[.032,.431,.141,.116,.210],[.089,.365,.124,.107,.146],[.082,.274,.100,.054,.098]];
    loft(g,st,near?14:8,col,shadow);
    // Clamshell side cowlings have a horizontal pressed bead above the access flap.
    for(const k of sides){
      const side=st.slice(1,7);stripe(g,side,k,.234,.279,upper);if(near)stripe(g,side,k,.146,.172,ivory,.003);
      if(!near)continue;
      const q=(x,y,z)=>[k*x,y,z];
      const major=k===-1?.017:.021;
      for(let row=0;row<5;row++){
        const x=.216-row*.002,z=-.54-row*.053;
        g.quad(q(x,.527,z-.018),q(x+major*.1,.530,z-.041),q(x,.591,z+.003),q(x,.588,z+.021),shadow);
        pipe(g,q(x,.533,z-.035),q(x,.583,z+.012),.0028,upper,4);
      }
      const y=.659;
      tube(g,[q(.196,y,-.375),q(.195,y+.012,-.343),q(.192,y+.006,-.313),q(.19,y+.015,-.281)],.0054,ivory,5);
      turnedCap(g,k*.166,k*.176,.490,-.154,.012,chrome,8);
      tube(g,[q(.185,.490,-.770),q(.176,.442,-.780),q(.163,.416,-.718),q(.153,.403,-.587)],.0075,chrome,6);
    }
    loft(g,[[-.654,.366,.077,.054,.071],[-.613,.351,.133,.069,.085],[-.386,.354,.135,.073,.088],[-.255,.373,.082,.067,.064]],near?10:6,metal,darkMetal);
    if(near){
      turnedCap(g,.104,.184,.362,-.501,.080,darkMetal,14);turnedCap(g,.184,.193,.362,-.501,.069,metal,12);
      for(let i=0;i<8;i++){const a=tau*i/8;pipe(g,[.196,.362+Math.cos(a)*.025,-.501+Math.sin(a)*.025],[.195,.362+Math.cos(a+.31)*.056,-.501+Math.sin(a+.31)*.056],.005,ink,4);}
      for(const k of sides)pipe(g,[k*.083,.259,-.641],[k*.082,.483,-.288],.023,darkMetal,6);
      tube(g,[[.139,.321,-.311],[.161,.247,-.415],[.167,.235,-.597],[.166,.270,-.730]],.020,darkMetal,7);
      pipe(g,[.166,.245,-.59],[.165,.285,-.827],.046,ink,9);
      pipe(g,[.166,.253,-.63],[.168,.283,-.787],.049,metal,9);
      pipe(g,[.165,.283,-.81],[.165,.294,-.861],.025,darkMetal,7);
      turnedCap(g,-.121,-.082,.257,-.64,.035,chrome,8);
      for(let j=0;j<4;j++)g.box(-.104,.343+j*.035,-.570+j*.004,.035,.009,.067,ink,-.07);
    }
    // The low waist stays open between saddle and glovebox.
    loft(g,[[-.125,.249,.11,.055,.028],[-.056,.239,.167,.045,.019],[.122,.233,.200,.036,.014],[.286,.243,.193,.046,.013],[.337,.264,.168,.041,.030]],near?10:6,col,shadow);
    for(const k of sides){
      pipe(g,[k*.185,.248,.015],[k*.190,.249,.286],near?.008:.012,chrome,near?7:4);
      if(near)for(const x of [.099,.124,.149])pipe(g,[k*x,.249,-.013],[k*x,.250,.270],.0048,rubber,5);
    }
    shield(g,b,near);seatShell(g,b,near);rack(g,b,near);tail(g,b,near);peg(g,true,spec(b).sole.pillion,near);
    if(near){for(const k of sides){
      pipe(g,[k*.125,.397,-.381],[k*.207,.313,-.456],.016,darkMetal,6);
      pipe(g,[k*.148,.402,-.508],[k*.205,.316,-.465],.011,metal,6);
    }}
  }
  function finnedTwin(g,near){
    const centers=[-.071,.071];
    for(const x of centers){
      pipe(g,[x,.441,.085],[x,.681,.125],.062,darkMetal,near?9:5);
      if(near){
        for(let i=0;i<6;i++){
          const h=.465+.033*i,z=.088+.0054*i;
          g.cyl(x,h,z,.076,.078,.013,8,i%2?metal:"#99a295");
        }
        g.cyl(x,.694,.132,.073,.066,.046,8,metal);
        g.box(x,.720,.126,.114,.020,.101,chrome,.035);
        for(const off of [-.024,.024])g.cyl(x+off,.732,.135,.008,.008,.007,5,ink);
        tube(g,[[x,.713,.157],[x,.746,.164],[x*.79,.766,.075]],.0075,ink,6);
        pipe(g,[x,.576,.041],[x,.598,-.072],.026,metal,7);
        pipe(g,[x,.598,-.057],[x,.616,-.119],.033,darkMetal,8);
      }
      tube(g,[[x,.606,.183],[x*1.19,.595,.254],[x*1.42,.535,.286],[x*1.78,.410,.287],[x*1.94,.308,.223],
        [x*2.19,.269,.097],[x*2.26,.264,-.238],[x*2.26,.286,-.498]],near?.021:.025,near?chrome:metal,near?8:5);
      const k=Math.sign(x);
      pipe(g,[k*.161,.274,-.242],[k*.163,.312,-.583],.030,metal,near?9:5);
      pipe(g,[k*.163,.301,-.495],[k*.170,.355,-.852],.042,chrome,near?10:6);
      if(near){pipe(g,[k*.170,.349,-.816],[k*.171,.359,-.87],.033,darkMetal,8);
        pipe(g,[k*.170,.356,-.853],[k*.171,.360,-.875],.023,ink,8);}
    }
    loft(g,[[-.255,.416,.066,.052,.059],[-.200,.406,.122,.086,.104],[-.029,.411,.139,.097,.104],[.084,.428,.117,.083,.090],[.131,.437,.073,.062,.075]],near?12:6,darkMetal,ink);
    turnedCap(g,-.161,-.112,.417,-.057,.087,metal,near?13:6);
    turnedCap(g,.119,.154,.421,-.060,.073,"#87908a",near?12:6);
    if(near){
      for(const side of sides)for(let i=0;i<5;i++){const a=tau*i/5;turnedCap(g,side*.150,side*.166,.416+Math.cos(a)*.06,-.056+Math.sin(a)*.06,.0075,chrome,6);}
      for(let i=0;i<3;i++)g.box(-.165,.405+i*.009,-.058,.003,.003,.062-i*.009,darkMetal);
      pipe(g,[.101,.480,-.152],[.143,.481,-.154],.018,ink,8);
    }
  }
  function heronFrame(g,b,near){
    const col=paint(b),low=shade(col,ink,.30),accent="#d6b979";
    const tank=[[-.056,.795,.079,.055,.031],[-.014,.811,.118,.074,.054],[.102,.835,.157,.092,.078],
      [.228,.849,.169,.111,.084],[.322,.863,.147,.094,.075],[.394,.874,.096,.072,.046],[.429,.872,.047,.049,.026]];
    loft(g,tank,near?14:8,col,low);
    for(const k of sides){stripe(g,tank,k,.173,.226,accent);if(near){
      stripe(g,tank,k,.107,.135,ivory);
      const q=(x,y,z)=>[k*x,y,z];
      g.quad(q(.163,.864,.155),q(.169,.873,.220),q(.166,.886,.252),q(.165,.883,.184),ivory);
      g.tri(q(.168,.884,.225),q(.161,.901,.269),q(.164,.882,.245),accent);
      g.quad(q(.159,.842,.113),q(.161,.847,.151),q(.165,.852,.195),q(.162,.845,.161),accent);
      const pad=(y,z,x)=>q(x,y,z);
      g.quad(pad(.806,.023,.116),pad(.829,.045,.132),pad(.844,.104,.155),pad(.815,.109,.150),ink);
    }}
    if(near){g.cyl(0,.937,.251,.026,.032,.011,12,metal);g.box(0,.943,.252,.033,.008,.011,chrome);
      g.box(0,.938,.249,.009,.005,.022,ink);}
    seatShell(g,b,near);rack(g,b,near);
    for(const k of sides){
      const P=(x,y,z)=>[k*x,y,z];
      tube(g,[P(.062,.879,.395),P(.073,.719,.309),P(.116,.434,.273),P(.131,.307,.139),P(.137,.297,-.226),P(.132,.384,-.303),P(.111,.655,-.271),P(.104,.738,-.079)],near?.020:.024,ink,near?8:5);
      tube(g,[P(.065,.846,.365),P(.095,.779,.147),P(.102,.729,-.115),P(.119,.694,-.375),P(.136,.735,-.636),P(.104,.749,-.829)],near?.018:.024,ink,near?7:4);
      tube(g,[P(.084,.745,-.068),P(.139,.395,-.294),P(.13,.738,-.625)],near?.016:.020,darkMetal,near?7:4);
      pipe(g,P(.121,.416,-.260),P(.097,.319,-.74),.024,metal,near?8:5);
      const shockA=P(.144,.352,-.68),shockB=P(.147,.721,-.48);
      pipe(g,shockA,shockB,.023,chrome,near?8:5);
      if(near){
        const q=t=>shockA.map((v,i)=>mix(v,shockB[i],t)),steps=28;let last=null;
        for(let j=0;j<=steps;j++){const u=j/steps,a=tau*u*5,v=q(.17+u*.61),pt=[v[0]+.028*Math.cos(a),v[1]-.012*Math.sin(a),v[2]+.025*Math.sin(a)];if(last)pipe(g,last,pt,.0052,ink,4);last=pt;}
        pipe(g,q(.03),q(.19),.032,darkMetal,9);pipe(g,q(.80),q(.96),.034,metal,9);
        turnedCap(g,k*.125,k*.158,.703,-.49,.022,chrome,7);
      }
      const cov=[P(.132,.712,-.147),P(.151,.727,-.362),P(.145,.689,-.424),P(.132,.523,-.317),P(.126,.538,-.212)];
      for(let i=1;i<cov.length-1;i++)g.tri(cov[0],cov[i],cov[i+1],col);
      if(near){
        g.quad(P(.142,.691,-.179),P(.152,.704,-.375),P(.151,.693,-.384),P(.143,.682,-.185),accent);
        for(let j=0;j<3;j++)pipe(g,P(.144,.641-j*.003,-.264-j*.019),P(.145,.662-j*.003,-.269-j*.019),.0036,ivory,5);
        pipe(g,P(.126,.521,-.274),P(.210,.345,-.137),.012,darkMetal,7);
        pipe(g,P(.130,.626,-.504),P(.221,.380,-.561),.012,metal,7);
        pipe(g,P(.135,.462,-.303),P(.221,.380,-.561),.011,darkMetal,7);
      }
    }
    if(near){
      for(const h of [.266,.373])pipe(g,[-.099,h,-.743],[-.098,h+.050,-.297],.009,"#665f51",6);
      g.box(-.102,.401,-.526,.038,.026,.47,ink,.005);
      tube(g,[[.152,.440,-.254],[.188,.376,-.190],[.212,.366,.064]],.008,metal,6);
      pipe(g,[.196,.366,.065],[.247,.366,.063],.014,rubber,7);
      tube(g,[[-.151,.407,-.112],[-.181,.359,-.046],[-.216,.359,.025]],.007,chrome,6);
    }
    mudguard(g,-.74,.319,.319,.094,-1.25,1.30,col,near);finnedTwin(g,near);brake(g,b,0,near);
    peg(g,false,spec(b).sole.pilot,near);peg(g,false,spec(b).sole.pillion,near);tail(g,b,near);
  }
  function transformAdded(g,make,transform){
    const start=g.vertices.length;make(g);
    for(let i=start;i<g.vertices.length;i+=6){
      const a=transform([g.vertices[i],g.vertices[i+1],g.vertices[i+2]]);
      g.vertices[i]=a[0];g.vertices[i+1]=a[1];g.vertices[i+2]=a[2];
    }
  }
  function distanceModel(g,b){
    const s=scooter(b),sp=spec(b),col=paint(b);
    for(let j=0;j<2;j++)transformAdded(g,m=>wheel(m,b,j,false),p=>[p[0],p[1]+sp.radii[j],p[2]+sp.axles[j]]);
    if(s){
      loft(g,[[-.920,.58,.071,.065,.083],[-.70,.576,.193,.137,.154],[-.38,.540,.201,.161,.176],[-.115,.467,.153,.135,.211],[.064,.339,.115,.083,.116]],6,col,shade(col,ink,.20));
      g.box(0,.241,.121,.363,.055,.447,col);shield(g,b,false);
      pipe(g,[-.068,.257,.65],[-.039,.875,.427],.037,metal,5);
    }else{
      loft(g,[[-.045,.802,.093,.061,.042],[.103,.837,.158,.092,.076],[.254,.853,.167,.106,.080],[.405,.871,.079,.063,.038]],7,col);
      g.box(0,.421,-.056,.233,.145,.302,darkMetal);
      for(const k of sides){
        pipe(g,[k*.072,.515,.086],[k*.072,.690,.126],.057,metal,5);pipe(g,[k*.13,.33,.22],[k*.097,.80,.33],.017,ink,4);
        pipe(g,[k*.11,.386,-.289],[k*.13,.704,-.538],.02,ink,4);
        pipe(g,[k*.09,.316,-.742],[k*.114,.402,-.272],.02,metal,4);pipe(g,[k*.111,.36,-.673],[k*.122,.73,-.485],.02,metal,4);
        pipe(g,[k*.155,.271,.18],[k*.156,.345,-.803],.032,metal,5);pipe(g,[k*.095,.326,.71],[k*.095,.976,.421],.024,metal,5);
        g.tri([k*.133,.702,-.145],[k*.145,.726,-.399],[k*.132,.526,-.306],col);
      }
      mudguard(g,-.74,.319,.325,.089,-1.25,1.2,col,false);
    }
    mudguard(g,sp.axles[1],sp.radii[1],sp.radii[1]+.018,sp.hubWidth[1]+.014,-1.48,1.36,s?col:metal,false);
    const seats=s?[[-.758,.783,.098,.036,.040],[-.538,.805,.163,.053,.038],[-.340,.772,.146,.049,.052],[-.04,.746,.127,.041,.036],[.105,.756,.061,.035,.025]]:
      [[-.846,.815,.086,.043,.030],[-.627,.822,.146,.055,.044],[-.35,.771,.141,.049,.053],[-.09,.751,.121,.044,.039],[.049,.771,.072,.033,.023]];
    loft(g,seats,6,s?leather:"#454442");tail(g,b,false);
    if(s){
      g.box(0,1.032,.421,.207,.111,.117,col);g.box(0,1.034,.484,.169,.072,.012,lamp);
    }else{
      pipe(g,[0,.927,.467],[0,.927,.574],.092,ink,8);ellipseEnd(g,[0,.927,.577],.087,.085,lamp,8);
    }
    const [w,h,z]=sp.grip;
    for(const side of sides){
      pipe(g,[0,s?1.01:.980,s?.422:.386],[side*(w-.045),h,z+.018],.013,chrome,4);
      pipe(g,[side*(w-.05),h,z+.018],[side*(w+.044),h-.003,z-.016],.022,rubber,4);
    }
  }
  function signalPart(g,b,end,k){
    const s=scooter(b);
    if(end==="back")g.box(k*(s?.201:.218),s?.702:.736,(s?-.9:-.978)+.002,.043,.032,.010,turnLamp);
    else{const y=s?.836:.889,z=s?.535:.525,x=s?.139:.196;g.box(k*x,y,z+.023,.043,.033,.011,turnLamp);}
  }
  function headLight(g,b){
    if(scooter(b))g.box(0,1.036,.505,.150,.051,.003,"#fff1c6");
    else ellipseEnd(g,[0,.927,.584],.076,.074,"#ffefc2",14);
  }
  function brakeLight(g,b){const s=scooter(b);g.box(0,s?.704:.738,s?-.944:-1.022,.135,.040,.008,stop);}
  function install(model){
    for(const [kind,sp] of Object.entries(specs)){
      const b={kind},key=kindKey(b),relative=(g,make)=>transformAdded(g,make,p=>sub(p,sp.pivot));
      for(const color of sp.paints){
        const variant={kind,color},id=style(variant);
        model(id+"/frame",g=>scooter(b)?palomaFrame(g,variant,true):heronFrame(g,variant,true));
        model(id+"/fork",g=>relative(g,m=>fork(m,variant,true)));
        model(id+"/distance",g=>distanceModel(g,variant));
      }
      model(key+"/rear-wheel",g=>wheel(g,b,0,true));model(key+"/front-wheel",g=>wheel(g,b,1,true));
      model(key+"/stand",g=>stand(g,b,true));model(key+"/head",g=>relative(g,m=>headLight(m,b)));
      model(key+"/stop",g=>brakeLight(g,b));
      for(const k of sides){
        model(key+"/tail-turn"+k,g=>signalPart(g,b,"back",k));
        model(key+"/fork-turn"+k,g=>relative(g,m=>signalPart(m,b,"front",k)));
      }
    }
  }
  const flashing=(b,t)=>b.indicator&&((t*.99+(b.signalOffset||0))%1)<.48?Math.sign(b.indicator):0;
  const running=b=>b.lights??(b.running||b.rider||b.engine||b.mount>.55||Math.abs(b.speed||0)>.45);
  function world(list,b,ground,t=0,near=true){
    if(!b)return;
    const M=pose(b,ground),sp=M.sp,id=style(b),key=kindKey(b),f=M.f,base=[f.yaw,f.tilt,f.lean],origin={x:f.x,y:f.y,z:f.z};
    const put=(name,p,rot,glow=0)=>list.push([name,p.x,p.y,p.z,rot[0],rot[1],rot[2],glow]);
    put(id+(near?"/frame":"/distance"),origin,base);
    const stem=near?angles(M.fork):base,pivot=at(M,sp.pivot);
    if(near){
      put(id+"/fork",pivot,stem);
      const spin=b.wheelSpin||0;
      for(let j=0;j<2;j++){
        const rear=j===0,hub=[0,sp.radii[j],sp.axles[j]];
        const rot=rear?base:stem;put(key+(rear?"/rear-wheel":"/front-wheel"),at(M,rear?hub:steered(M,hub)),[rot[0],rot[1]+(rear?spin:b.frontSpin??spin),rot[2]]);
      }
      put(key+"/stand",at(M,sp.standPivot),standAngles(b,M));
    }
    if(running(b))put(key+"/head",pivot,stem,.58);
    if((b.brakes||0)>.18&&running(b))put(key+"/stop",origin,base,.86);
    const blink=flashing(b,t);
    if(blink){put(key+"/tail-turn"+blink,origin,base,.89);put(key+"/fork-turn"+blink,pivot,stem,.89);}
  }
  function mapPoint(opt,px,py,scale,p,ground=0){
    const h=opt?.mode==="street"?(p.y-ground)*scale*.35:0,r=opt?.rotation||0;
    return [px(p.x)+Math.sin(r)*h,py(p.z)-Math.cos(r)*h];
  }
  function map(c,opt,px,py,scale,b,t=0){
    if(!b)return;
    const street=opt.mode==="street",isScoot=scooter(b),col=paint(b);
    if(!street){
      const s=opt.mode==="radar"?3.65:4,x=px(b.x),y=py(b.z);
      c.save();c.translate(x,y);c.rotate(b.yaw||0);c.lineCap="round";
      c.strokeStyle="#374d4a";c.lineWidth=3.3;c.beginPath();c.moveTo(0,s);c.lineTo(0,-s);c.stroke();
      c.fillStyle=col;c.fillRect(-s*.46,-s*.58,s*.92,s*1.30);c.strokeStyle="#ecdab0";c.lineWidth=1;
      c.beginPath();c.moveTo(-s*.73,-s*.48);c.lineTo(0,-s*.65);c.lineTo(s*.73,-s*.48);c.stroke();
      c.fillStyle=ivory;c.fillRect(-.65,-s-1,1.3,1.75);c.restore();return;
    }
    const ground=worldGround(b,undefined),M=pose(b,ground),sp=M.sp;
    const to=(p,front=false)=>mapPoint(opt,px,py,scale,at(M,front?steered(M,p):p),ground);
    function poly(pts,fill,front=false){
      c.beginPath();for(let i=0;i<pts.length;i++){const p=to(pts[i],front);if(i)c.lineTo(...p);else c.moveTo(...p);}c.closePath();c.fillStyle=fill;c.fill();
    }
    function line(a,b,w,fill,front=false){
      const p=to(a,front),q=to(b,front);c.strokeStyle=fill;c.lineWidth=Math.max(.43,w*scale);c.beginPath();c.moveTo(...p);c.lineTo(...q);c.stroke();
    }
    function strip(points,w,col,front=false){for(let i=1;i<points.length;i++)line(points[i-1],points[i],w,col,front);}
    function oval(x,y,z,w,d,col,front=false){
      const pts=[];for(let i=0;i<12;i++){const a=tau*i/12;pts.push([x+w*Math.cos(a),y,z+d*Math.sin(a)]);}poly(pts,col,front);
    }
    function station(points,color){
      const outline=points.map(([z,w,h])=>[-w,h,z]);for(const [z,w,h] of points.slice().reverse())outline.push([w,h,z]);poly(outline,color);
    }
    c.save();c.lineJoin="round";c.lineCap="round";
    c.save();c.globalAlpha*=.20;
    if(b.wheelLift){
      const back=at(M,[0,sp.radii[0],sp.axles[0]]),nose=at(M,[0,sp.radii[1],sp.axles[1]]);
      c.save();c.translate(px((back.x+nose.x)*.5),py((back.z+nose.z)*.5));c.rotate(b.yaw||0);
      c.beginPath();c.ellipse(0,0,.23*scale,(Math.hypot(nose.x-back.x,nose.z-back.z)*.5+sp.radii[0])*scale,0,0,tau);c.fillStyle="#30423e";c.fill();c.restore();
    }else oval(.05,.005,0,.221,sp.footprint.halfLength+.043,"#30423e");
    c.restore();
    if(scale<10.5){
      // At city-driving scale the tyres are a single pixel wide; preserve their bearings and the two silhouettes.
      for(let j=0;j<2;j++){
        const z=sp.axles[j],r=sp.radii[j];
        line([0,r,z-r+.018],[0,r,z+r-.018],.125,rubber,!!j);
        if(j)line([0,2*r,z-.18],[0,2*r,z+.15],.127,isScoot?col:metal,true);
      }
      if(isScoot){
        station([[-.91,.078,.59],[-.68,.198,.65],[-.36,.197,.58],[-.07,.15,.47],[.032,.14,.36]],col);
        line([0,.244,.017],[0,.246,.281],.31,col);line([-.17,.81,.41],[.17,.81,.41],.092,ivory);
      }else{
        line([0,.437,-.19],[0,.512,.16],.230,metal);
        for(const k of sides)line([k*.162,.29,-.29],[k*.17,.35,-.82],.068,chrome);
        station([[-.051,.075,.81],[.105,.159,.88],[.234,.17,.89],[.401,.08,.88]],col);
      }
      const z=scooter(b)?-.774:-.859,sy=sp.seats.pillion[1];
      station([[z,.071,sy-.035],[z+.13,.145,sy],[z+.29,.143,sy],[z+.50,.136,sp.seats.pilot[1]],[sp.seats.pilot[2]+.091,.077,sp.seats.pilot[1]]],isScoot?leather:"#4a4842");
      const [gw,gy,gz]=sp.grip;
      for(const k of sides){line([0,1,.421],[k*gw,gy,gz],.035,metal,true);line([k*gw,gy,gz],[k*(gw+.042),gy,gz-.012],.050,ink,true);}
      line([-.060,1.004,.510],[.060,1.004,.510],.043,running(b)?lamp:ivory,true);
      line([-.067,.723,z-.097],[.067,.723,z-.097],.042,b.brakes>.18&&running(b)?stop:red);
      const blink=flashing(b,t);if(blink){oval(blink*.207,.722,z-.085,.033,.028,turnLamp);oval(blink*.166,.863,.541,.030,.028,turnLamp,true);}
      c.restore();return;
    }
    for(let j=0;j<2;j++){
      const front=j===1,r=sp.radii[j],z=sp.axles[j],w=sp.hubWidth[j],center=[0,r,z];
      line([0,r,z-r+ .019],[0,r,z+r-.019],w*1.88,rubber,front);
      line([-.013,r+.028,z-r+.023],[-.013,r+.028,z+r-.024],w*.76,tread,front);
      for(const k of sides){const tt=(front?b.frontSpin??b.wheelSpin??0:b.wheelSpin||0)+k*2.13;
        const off=Math.sin(tt)*r*.82;line([-.028,r+.014,z+off],[.030,r+.018,z+off+.016],.009,k===-1?"#787b6c":"#969a87",front);}
      if(front){const y=r*1.94+.03;
        poly([[-w*.70,y,z-r*.81],[-w*1.20,y+.015,z-r*.46],[-w*1.08,y,z+r*.57],[-w*.68,y-.027,z+r*.90],[w*.68,y-.027,z+r*.90],[w*1.08,y,z+r*.57],[w*1.20,y+.015,z-r*.46],[w*.70,y,z-r*.81]],isScoot?col:metal,true);
        line([-.018,y+.013,z-r*.68],[-.018,y+.025,z+r*.73],.018,isScoot?shade(col,ivory,.47):chrome,true);
        for(const k of sides)line([k*.083,r+.020,z],[k*.075,.833,.474],.030,metal,true);
      }
    }
    if((b.stand||0)>.2){
      const p=sp.standPivot;line(p,[-.304,.014,p[2]-.05],.022,darkMetal);
      line([-.307,.016,p[2]-.095],[-.31,.016,p[2]-.03],.051,ink);
    }
    if(isScoot){
      station([[-.922,.068,.635],[-.84,.160,.678],[-.704,.205,.662],[-.473,.215,.616],[-.283,.205,.598],[-.113,.166,.559],[.073,.131,.437]],col);
      for(const k of sides){
        strip([[k*.168,.644,-.792],[k*.198,.638,-.619],[k*.199,.619,-.415],[k*.172,.600,-.226]],.013,ivory);
        for(let i=0;i<4;i++)line([k*(.185-i*.002),.603,-.537-i*.044],[k*(.206-i*.004),.578,-.583-i*.044],.009,"#847a5f");
      }
      station([[-.058,.153,.242],[.084,.195,.246],[.24,.196,.245],[.318,.168,.266]],col);
      for(const k of sides)for(const v of [.115,.151,.186])line([k*v,.248,-.02],[k*v,.251,.264],.010,v===.186?chrome:ink);
      line([.171,.271,-.473],[.175,.278,-.817],.075,metal);
      poly([[-.151,.917,.406],[-.224,.771,.425],[-.229,.441,.345],[-.180,.281,.316],[.180,.281,.316],[.229,.441,.345],[.224,.771,.425],[.151,.917,.406]],ivory);
      for(const k of sides)strip([[k*.171,.271,.317],[k*.219,.450,.349],[k*.219,.776,.424],[k*.151,.918,.405]],.015,chrome);
      line([0,.675,.437],[0,.89,.477],.056,col);
      for(let i=0;i<4;i++)line([-.019,.720+i*.028,.450],[.019,.720+i*.028,.450],.007,ink);
    }else{
      for(const k of sides){
        strip([[k*.115,.630,.195],[k*.151,.306,.233],[k*.164,.27,.083],[k*.169,.325,-.619]],.040,chrome);
        line([k*.164,.293,-.363],[k*.17,.350,-.855],.079,metal);
        line([k*.160,.308,-.401],[k*.168,.359,-.804],.020,chrome);
        line([k*.116,.392,-.28],[k*.089,.319,-.735],.038,darkMetal);
        line([k*.145,.366,-.665],[k*.147,.706,-.492],.046,metal);
        for(let j=0;j<4;j++){const y=.46+.045*j,z=-.614+.024*j;
          line([k*.126,y,z],[k*.163,y+.012,z-.006],.014,ink);}
      }
      station([[-.258,.086,.469],[-.089,.158,.498],[.116,.129,.506],[.16,.060,.525]],darkMetal);
      for(const k of sides){oval(k*.070,.689,.132,.070,.066,metal);for(let j=0;j<4;j++)line([k*.10,.489+j*.04,.063],[k*.14,.489+j*.04,.134],.011,chrome);}
      const profile=[[-.045,.075,.817],[-.008,.115,.844],[.111,.160,.876],[.237,.171,.890],[.314,.146,.900],[.408,.080,.886]];
      station(profile,col);
      for(const k of sides)strip(profile.slice(1).map(([z,w,y])=>[k*w*.90,y+.014,z]),.015,"#dbbd80");
      oval(0,.939,.248,.029,.031,chrome);
    }
    for(const k of sides){
      const [xp,yp,zp]=sp.sole.pillion;line([k*(xp-.071),yp-.010,zp],[k*(xp+.032),yp,zp],.032,rubber);
      if(!isScoot){const [x,y,z]=sp.sole.pilot;line([k*(x-.079),y,z],[k*(x+.041),y,z],.040,rubber);}
    }
    const saddles=isScoot?[[-.775,.089,.794],[-.69,.160,.819],[-.55,.166,.839],[-.39,.151,.822],[-.27,.145,.787],[-.049,.13,.777],[.108,.063,.777]]:
      [[-.851,.087,.829],[-.723,.137,.850],[-.59,.149,.862],[-.478,.147,.850],[-.332,.145,.816],[-.089,.125,.788],[.050,.063,.789]];
    station(saddles,isScoot?leather:"#4a4842");
    for(const k of sides)strip(saddles.map(([z,w,y])=>[k*w*.95,y+.007,z]),.009,isScoot?seam:"#aa9a7e");
    const band=isScoot?-.335:-.374;line([-.140,isScoot?.803:.82,band],[.140,isScoot?.803:.82,band],.023,isScoot?"#5c4436":rubber);
    const [rw,ry,rz]=sp.grab,back=isScoot?-.825:-.904;
    for(const k of sides)strip([[k*rw,ry-.009,rz+.096],[k*rw,ry,rz-.01],[k*(rw-.016),ry,back],[k*.079,ry-.008,back-.024]],.018,chrome);
    line([-.08,ry-.008,back-.024],[.08,ry-.008,back-.024],.021,chrome);
    const tailZ=isScoot?-.906:-.984,tailY=isScoot?.70:.738;
    line([-.066,tailY,tailZ],[.066,tailY,tailZ],.042,b.brakes>.18&&running(b)?stop:red);
    const blink=flashing(b,t);
    for(const k of sides){
      const x=isScoot?.201:.218,y=isScoot?.836:.889,z=isScoot?.535:.525;
      line([k*.060,tailY,tailZ+.03],[k*x,tailY,tailZ+.03],.016,ink);
      line([k*(x-.017),tailY,tailZ+.024],[k*(x+.017),tailY,tailZ+.024],.034,k===blink?turnLamp:amber);
      if(!isScoot)line([k*.066,y,z-.02],[k*.19,y,z-.012],.014,metal,true);
      line([k*(isScoot?.126:.18),y,z],[k*(isScoot?.151:.208),y,z],.032,k===blink?turnLamp:amber,true);
    }
    const [gw,gy,gz]=sp.grip,hy=isScoot?1.001:.978,hz=isScoot?.425:.373;
    for(const k of sides){
      strip([[0,hy,hz],[k*.13,hy+.008,hz-.004],[k*.182,gy+.009,gz+.066],[k*(gw+.05),gy,gz-.016]],.024,chrome,true);
      line([k*(gw-.060),gy,gz+.021],[k*(gw+.046),gy,gz-.016],.043,rubber,true);
      strip([[k*(gw-.10),gy-.002,gz+.037],[k*(gw-.07),gy+.005,gz+.071],[k*(gw+.026),gy-.006,gz+.053]],.011,chrome,true);
      const mx=k*(isScoot?.365:.391),my=isScoot?1.24:1.227,mz=gz+.071;
      strip([[k*(gw-.096),gy+.014,gz+.044],[k*(gw-.081),my-.105,gz+.05],[mx,my,mz]],.013,metal,true);
      oval(mx,my,mz,isScoot?.048:.062,.025,isScoot?ivory:ink,true);oval(mx,my+.008,mz-.009,isScoot?.037:.052,.015,"#93b0af",true);
    }
    const c1=running(b)?"#fff1c4":lamp;
    if(isScoot){
      oval(0,1.042,.419,.118,.071,col,true);line([-.080,1.036,.497],[.080,1.036,.497],.029,c1,true);
      poly([[-.047,1.113,.361],[.047,1.113,.361],[.047,1.113,.412],[-.047,1.113,.412]],ivory,true);
      line([-.03,1.117,.386],[.03,1.117,.386],.030,ink,true);
    }else{
      oval(0,.933,.500,.089,.070,ink,true);line([-.069,.935,.575],[.069,.935,.575],.020,c1,true);
      for(const k of sides){oval(k*.051,1.048,.435,.045,.044,chrome,true);oval(k*.051,1.051,.435,.036,.036,ink,true);
        line([k*.052,1.055,.435],[k*.065,1.055,.455],.006,ivory,true);}
    }
    c.restore();
  }
  // Rider's seat overlay. Mirrors accept real rear-facing canvas images from the camera.
  function cockpit(c,b,width,height,t=0,options={}){
    if(!c||!b||width<=0||height<=0)return;
    const s=scooter(b),f=Math.min(width/860,height/480),mph=Math.abs(b.speed||0)*2.237,blink=flashing(b,t);
    const move=clamp(b.steer||0,-.75,.75)*27,roll=clamp(b.lean||0,-.9,.9),pitch=clamp(b.pitch||0,-.18,.37);
    c.save();c.translate(width*.5-move*f,height+(7+26*pitch)*f);c.scale(f,f);c.rotate(-roll*.11);c.lineCap="round";c.lineJoin="round";
    const stroke=(coords,w,col)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(...coords[0]);for(let i=1;i<coords.length;i++)c.lineTo(...coords[i]);c.stroke();};
    const oval=(x,y,rx,ry,col,a=0)=>{c.fillStyle=col;c.beginPath();c.ellipse(x,y,rx,ry,a,0,tau);c.fill();};
    function shape(points,col){
      c.fillStyle=col;c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.closePath();c.fill();
    }
    function mirror(k,source){
      const cx=k*(s?238:268),cy=s?-153:-145,rx=s?36:49,ry=s?29:23;
      const bar=[[k*173,-55],[k*187,-97],[k*198,-137],[cx-k*17,cy+15]];
      stroke(bar,3.9,"#384945");stroke(bar.map(([x,y])=>[x-.65,y-1]),1.15,"#c1c1a9");
      c.save();c.translate(cx,cy);c.rotate(k*(s?-.09:.16));oval(0,0,rx+2.8,ry+2.8,ink);oval(-.4,-.6,rx+1.1,ry+1.1,chrome);
      c.beginPath();c.ellipse(0,0,rx,ry,0,0,tau);c.clip();
      if(source&&source.width&&source.height){
        const crop=Math.min(source.width/(rx*2),source.height/(ry*2)),w=rx*2*crop,h=ry*2*crop;
        c.save();c.scale(-1,1);c.drawImage(source,(source.width-w)/2,(source.height-h)/2,w,h,-rx,-ry,rx*2,ry*2);c.restore();
        c.fillStyle="rgba(111,153,148,.13)";c.fillRect(-rx,-ry,rx*2,ry*2);
      }else{
        const g=c.createLinearGradient(-rx*.6,-ry,rx*.45,ry);
        g.addColorStop(0,"#a5bab4");g.addColorStop(.44,"#799397");g.addColorStop(.73,"#66848b");g.addColorStop(1,"#a2b4a8");
        c.fillStyle=g;c.fillRect(-rx,-ry,2*rx,2*ry);
        stroke([[-rx*.92,ry*.07],[rx*.6,-ry*1.14]],1.0,"rgba(231,233,201,.17)");
      }c.restore();
    }
    for(const k of sides)mirror(k,options.mirrors?.[k===-1?0:1]);
    for(const k of sides){
      const gy=s?-34:-44;
      const bar=[[k*7,-51],[k*59,-53],[k*97,-77],[k*139,-66],[k*190,gy],[k*225,gy+12]];
      stroke(bar,11,darkMetal);stroke(bar.map(([x,y])=>[x,y-1.8]),6,metal);stroke(bar.map(([x,y])=>[x-.7,y-3.1]),1.5,chrome);
      const sleeve=[[k*159,gy-12],[k*194,gy+2],[k*232,gy+16]];
      stroke(sleeve,16,"#283735");stroke(sleeve.map(([x,y])=>[x,y-1.8]),12,"#46534e");
      for(let j=0;j<11;j++){const u=j*.091,x=mix(k*163,k*227,u),y=mix(gy-11,gy+15,u);stroke([[x-2*k,y+5],[x+2*k,y-6]],1.8,"#303a39");}
      stroke([[k*135,gy-15],[k*145,gy-32],[k*185,gy-23],[k*218,gy-11]],4.0,chrome);
      stroke([[k*135,gy-17],[k*134,gy-27],[k*148,gy-26]],3.0,metal);
      shape([[k*142,gy-23],[k*155,gy-20],[k*162,gy-8],[k*155,gy+4],[k*136,gy-2]],ink);
      stroke([[k*146,gy-16],[k*152,gy-14]],3.7,k===1?red:"#6c8c79");
      stroke([[k*137,gy-7],[k*96,-65],[k*55,-10]],3.5,"#37413f");
    }
    const faceText=(str,x,y,px,color,weight=550)=>{c.fillStyle=color;c.font=weight+" "+px+"px Arial, sans-serif";c.textAlign="center";c.textBaseline="middle";c.fillText(str,x,y);};
    function dial(x,y,r,max,val,unit,step,label,lightFace=false){
      const edge=lightFace?"#687770":"#bcbcab",bg=lightFace?"#d9d2b0":"#303e3e",numbers=lightFace?"#455550":"#e2d9ba";
      oval(x,y+4,r+3,r+3,"#35443f");oval(x,y,r+2,r+2,edge);oval(x,y,r-1,r-1,ink);oval(x,y,r-3,r-3,bg);
      const a=n=>(-.76+1.52*n/max)*pi,P=(v,rad)=>[x+Math.sin(a(v))*rad,y-Math.cos(a(v))*rad];
      for(let n=0,i=0;n<=max+.01;n+=step/2,i++){
        const major=i%2===0;stroke([P(n,r-5),P(n,r-(major?11:8))],major?1.55:.8,unit==="RPM ×1000"&&n>=max*.82?red:numbers);
        if(major){const q=P(n,r-17);faceText(String(Math.round(n)),q[0],q[1],r*.15,numbers,600);}
      }
      faceText(label,x,y-r*.30,r*.16,numbers,650);faceText(unit,x,y+r*.38,r*.13,numbers,600);
      const needle=clamp(val,0,max),d=a(needle),X=Math.sin(d),Y=-Math.cos(d);
      shape([[x-Y*1.8-X*4,y+X*1.8-Y*4],P(needle,r-10),[x+Y*1.8-X*4,y-X*1.8-Y*4]],lightFace?"#a24f39":"#dc8254");
      oval(x,y,3.4,3.4,ink);oval(x,y,1.8,1.8,metal);
      c.beginPath();c.arc(x,y,r-4,-2.49,-1.20);c.lineWidth=1.5;c.strokeStyle="rgba(249,237,205,.25)";c.stroke();
    }
    if(s){
      const col=paint(b),shell=c.createLinearGradient(0,-104,0,14);
      shell.addColorStop(0,shade(col,ivory,.34));shell.addColorStop(.28,col);shell.addColorStop(1,shade(col,ink,.46));
      shape([[-129,17],[-147,-14],[-129,-43],[-102,-63],[-86,-82],[-46,-99],[0,-103],[52,-97],[88,-81],[104,-62],[134,-40],[146,-14],[125,17]],shell);
      stroke([[-132,-29],[-100,-62],[-81,-81],[-42,-97],[0,-100],[48,-95],[84,-79],[104,-60],[136,-28]],2,ivory);
      oval(0,-50,53,43,"#7c8071");oval(0,-53,51,43,ivory);dial(0,-57,35,60,mph,"MPH",10,"PALOMA",true);
      for(const k of sides){oval(k*65,-47,6.0,4.1,ink);oval(k*65,-47,4.4,2.8,blink===k?turnLamp:"#798b6a");}
      stroke([[-21,-9],[21,-9]],2.2,chrome);
    }else{
      const r=39;
      for(const k of sides){pipeDialBracket(k);}
      dial(-43,-67,r,100,mph,"MPH",20,"HERON");
      const rpm=options.rpm??(Number.isFinite(b.rpm)?8.85*clamp(b.rpm,0,1):running(b)?.99+Math.min(6.1,Math.abs(b.speed||0)*.175):0);
      dial(43,-67,r,9,rpm,"RPM ×1000",1,"500");
      for(const k of sides){oval(k*97,-50,4.8,3.9,ink);oval(k*97,-50,3.1,2.4,blink===k?turnLamp:"#798b6a");}
      const y=-19;oval(0,y,11,9,darkMetal);oval(0,y,7.6,5.8,chrome);
      stroke([[-1.3,y-3],[1.3,y+3]],2.0,ink);
      const tank=c.createLinearGradient(0,-8,0,57);tank.addColorStop(0,shade(paint(b),ivory,.28));tank.addColorStop(.32,paint(b));tank.addColorStop(1,shade(paint(b),ink,.30));
      shape([[-57,14],[-35,1],[-13,-5],[13,-5],[34,-1],[65,14],[88,59],[-89,59]],tank);
      for(const k of sides)stroke([[k*53,7],[k*67,27],[k*81,58]],1.6,"#c7af76");oval(0,14,12.8,6.3,chrome);oval(0,14,9.6,4.6,metal);
    }
    function pipeDialBracket(k){
      stroke([[k*18,-15],[k*40,-42],[k*47,-55]],8,darkMetal);oval(k*27,-20,6.4,5.3,metal);oval(k*27,-20,2.7,2.4,ink);
    }
    c.restore();
  }
  window.BayMotorcyclesArt={specs,install,world,map,mapPoint,point,seat,grips,pegs,grabs,approach,frame,eye,cockpit};
})();
