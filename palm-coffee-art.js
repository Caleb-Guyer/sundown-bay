/* The Palm's sidewalk coffee shelf. Drinkers face one another across local X. */
(() => {
  "use strict";
  const cream="#eee4c5",ivory="#fcf0d7",jade="#45766b",mint="#97b7a1",cherry="#b36555";
  const dark="#3d504e",steel="#7b928b",chrome="#b1c2b6",glint="#e3e5ce",coffee="#503a30";
  const tau=2*Math.PI,top=1.02;
  const limit=x=>Math.max(0,Math.min(1,x));
  function ease(value){const t=limit(value);return t*t*(3-2*t);}

  function tube(g,points,r,color){
    for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,color,6);
  }
  function edge(w,d,y,r){
    return [[w/2-r,y,d/2],[w/2,y,d/2-r],[w/2,y,-d/2+r],[w/2-r,y,-d/2],
      [-w/2+r,y,-d/2],[-w/2,y,-d/2+r],[-w/2,y,d/2-r],[-w/2+r,y,d/2]];
  }
  function slab(g,w,d,y0,y1,color,edgeColor,r=.035){
    const lo=edge(w,d,y0,r),hi=edge(w,d,y1,r);
    for(let i=0;i<hi.length;i++){
      const j=(i+1)%hi.length;
      g.quad(lo[i],lo[j],hi[j],hi[i],edgeColor,.88+.10*(i%3)*.5);
      g.tri([0,y1,0],hi[i],hi[j],color);
    }
  }
  // Short tapered brush marks form the palm drawn on the painted drawer front.
  const brush=[
    [[-.043,-.041],[-.028,-.037],[-.014,-.002],[.001,.024],[-.006,.029],[-.026,.003]],
    [[-.004,.027],[-.025,.040],[-.057,.040],[-.078,.023],[-.046,.030],[-.021,.030]],
    [[-.003,.028],[-.042,.024],[-.064,.003],[-.067,-.010],[-.049,.007],[-.021,.020]],
    [[-.004,.028],[-.001,.047],[.021,.060],[.038,.056],[.016,.046],[.005,.030]],
    [[-.002,.028],[.022,.040],[.053,.034],[.071,.016],[.048,.024],[.018,.030]],
    [[-.003,.027],[.018,.025],[.033,.009],[.040,-.010],[.024,.008],[.011,.018]],
    [[-.078,-.047],[-.035,-.040],[.004,-.043],[.046,-.049],[.022,-.050],[-.040,-.046]]
  ];
  function palm(g,face){
    for(const stroke of brush){
      const p=stroke.map(([x,y])=>[face*x,.924+y,face*.2625]);
      for(let i=1;i<p.length-1;i++)g.tri(p[0],p[i],p[i+1],jade);
    }
  }
  function shelf(g){
    // Tubular trestles leave the ends clear for the two guests.
    for(const z of [-.179,.179]){
      tube(g,[[-.365,.023,z],[-.31,.78,z],[-.27,.951,z],[.27,.951,z],[.31,.78,z],[.365,.023,z]],.020,steel);
      for(const x of [-.365,.365])g.cyl(x,.014,z,.026,.030,.027,8,dark);
      g.pole([-.352,.189,z],[.352,.189,z],.013,chrome,7);
    }
    for(const x of [-.313,.313])g.pole([x,.773,-.179],[x,.773,.179],.018,steel,7);
    slab(g,.825,.522,.859,.976,mint,mint);
    for(const face of [-1,1])palm(g,face);
    // Cream laminate and the double chrome binding show up at curb distance.
    slab(g,.858,.562,.966,.999,chrome,chrome);
    slab(g,.859,.563,.980,.988,jade,jade);
    slab(g,.85,.555,.998,top,cream,glint);

    // The squat vacuum pot still has its Bakelite screw top and swing handle.
    const x=-.04,z=-.145,base=top;
    const ring=(dy,h,r1,r2,color)=>g.cyl(x,base+dy,z,r1,r2,h,10,color);
    ring(.011,.022,.064,.058,dark);ring(.128,.225,.066,.063,chrome);
    ring(.202,.026,.067,.067,jade);ring(.243,.031,.044,.066,chrome);
    ring(.269,.034,.048,.043,dark);ring(.288,.014,.049,.048,jade);
    for(const dx of [-.033,.022])g.box(x+dx,base+.118,z+.056,.008,.166,.006,glint);
    tube(g,[[x+.054,base+.216,z],[x+.090,base+.210,z],[x+.100,base+.187,z],[x+.098,base+.098,z],[x+.060,base+.084,z]],.009,dark);
    // A diner napkin dispenser has a folded lip projecting from a dark spring slot.
    const tx=.083,tz=.139;
    g.box(tx,top+.061,tz,.129,.121,.096,steel);
    g.box(tx,top+.124,tz,.134,.012,.098,chrome);
    g.box(tx,top+.132,tz,.090,.006,.026,dark);
    g.quad([tx-.034,top+.136,tz-.004],[tx+.031,top+.136,tz-.004],
      [tx+.025,top+.178,tz+.018],[tx-.018,top+.190,tz+.020],ivory);
    g.tri([tx-.018,top+.190,tz+.020],[tx+.002,top+.173,tz+.031],[tx+.025,top+.178,tz+.018],cream);
    for(const side of [-1,1]){
      g.cyl(side*.27,top+.006,0,.085,.054,.012,12,ivory);
      g.cyl(side*.27,top+.0125,0,.074,.072,.003,12,side<0?jade:cherry);
      g.cyl(side*.27,top+.015,0,.068,.068,.004,12,cream);
    }
  }
  function mug(g,band){
    g.cyl(0,.008,0,.043,.040,.016,10,cream);
    g.cyl(0,.055,0,.058,.042,.079,10,ivory);
    g.cyl(0,.078,0,.056,.055,.008,10,band);
    g.cyl(0,.097,0,.059,.058,.006,10,cream);
    g.cyl(0,.1006,0,.050,.050,.001,10,coffee);
    const h=(r,y)=>[r*.77,y,r*.64];
    tube(g,[h(.052,.080),h(.079,.088),h(.094,.079),h(.096,.056),h(.085,.035),h(.048,.033)],.009,ivory);
  }
  const firstMug=g=>mug(g,jade),secondMug=g=>mug(g,cherry);
  function cup(index,lift){
    const side=index?1:-1,v=limit(lift||0),travel=ease((v-.12)/.88);
    return {x:side*(.27+.364*travel),y:top+.017+.445*travel+.043*Math.sin(travel*Math.PI),
      z:side*.039*Math.sin(travel*Math.PI*.85),roll:-.32*ease((travel-.63)/.37),side};
  }
  function world(list,model,site,lifts=[]){
    model("palm-side-shelf",shelf);model("palm-side-jade",firstMug);model("palm-side-rose",secondMug);
    const yaw=site.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw),y=site.y??.076;
    list.push(["palm-side-shelf",site.x,y,site.z,yaw]);
    for(let i=0;i<2;i++){
      const q=cup(i,lifts[i]);
      list.push([i?"palm-side-rose":"palm-side-jade",site.x+q.x*c+q.z*s,y+q.y,site.z-q.x*s+q.z*c,
        yaw+(i?0:Math.PI),0,q.roll]);
    }
  }
  function map(c,px,py,s,site,lifts=[]){
    c.save();c.translate(px(site.x),py(site.z));c.rotate(site.yaw||0);c.scale(s,-s);
    function rect(x,z,w,d,col){c.fillStyle=col;c.fillRect(x,z,w,d);}
    function disk(x,z,r,col){c.fillStyle=col;c.beginPath();c.arc(x,z,r,0,tau);c.fill();}
    function line(a,b,w,col){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(...a);c.lineTo(...b);c.stroke();}
    rect(-.398,-.305,.875,.578,"rgba(47,57,51,.27)");
    rect(-.429,-.281,.858,.562,steel);rect(-.415,-.267,.83,.534,cream);
    rect(-.400,.233,.80,.021,jade);
    disk(-.04,-.145,.068,chrome);line([.013,-.145],[.062,-.145],.027,dark);disk(-.04,-.145,.050,jade);
    rect(.016,.088,.134,.099,steel);rect(.022,.094,.122,.086,chrome);rect(.041,.124,.081,.025,ivory);
    for(let i=0;i<2;i++){
      const q=cup(i,lifts[i]),x=q.x-q.side*.095*Math.sin(q.roll),z=q.z;
      disk(q.side*.27,0,.085,ivory);disk(q.side*.27,0,.073,i?cherry:jade);disk(q.side*.27,0,.066,cream);
      line([x+.034*q.side,z+.03*q.side],[x+.071*q.side,z+.062*q.side],.023,ivory);
      disk(x,z,.06,ivory);disk(x,z,.046,coffee);
    }
    c.restore();
  }
  // Keep the palm on the handle with a two-link right arm. The other hand stays in the base pose.
  const overlays=new WeakMap(),palmCenter=[.238,.978,.053];
  function grip(limb,wrist){
    const a=limb.shoulder,dx=wrist[0]-a[0],dy=wrist[1]-a[1],dz=wrist[2]-a[2],d=Math.max(.001,Math.hypot(dx,dy,dz));
    const x=dx/d,y=dy/d,z=dz/d,upper=limb.arm.length,lower=limb.forearm.length;
    const mid=(upper*upper-lower*lower+d*d)/(2*d),bend=Math.sqrt(Math.max(0,upper*upper-mid*mid));
    const dot=.84*x-.62*y-.22*z,hx=.84-x*dot,hy=-.62-y*dot,hz=-.22-z*dot,amount=bend/(Math.hypot(hx,hy,hz)||1);
    const elbow=[a[0]+x*mid+hx*amount,a[1]+y*mid+hy*amount,a[2]+z*mid+hz*amount];
    limb.arm.aim(a,elbow);limb.forearm.aim(elbow,wrist);
  }
  function pose(mesh,index,lift){
    if(!mesh)return false;
    const arm=mesh.sides[1],revision=mesh.lastRevision,old=overlays.get(mesh);
    if(lift==null||lift<=0){
      overlays.delete(mesh);
      if(old?.revision!==revision)return false;
      arm.arm.m.set(old.upper);arm.forearm.m.set(old.lower);mesh.skin();return true;
    }
    const amount=limit(lift),same=old?.revision===revision;
    if(same&&old.lift===amount&&old.index===index)return false;
    const state=same?old:{revision,upper:arm.arm.m.slice(),lower:arm.forearm.m.slice()};
    if(same){arm.arm.m.set(state.upper);arm.forearm.m.set(state.lower);}
    const q=cup(index,amount),c=Math.cos(q.roll),s=Math.sin(q.roll),forward=.78-Math.abs(q.x);
    // The handle's middle is at (+.072,.06,+.06) in mug space. In either guest's frame
    // their own +Z points into the table and their +X follows the handle.
    const hand=[q.side*q.z+.060,q.y+.072*s+.060*c,forward-.072*c+.060*s];
    const base=arm.forearm.map(palmCenter,[]),weight=ease(amount/.15);
    const target=base.map((n,i)=>n+(hand[i]-n)*weight),wrist=target.slice();
    for(let j=0;j<5;j++){
      grip(arm,wrist);const actual=arm.forearm.map(palmCenter,[]);
      for(let k=0;k<3;k++)wrist[k]+=target[k]-actual[k];
    }
    state.lift=amount;state.index=index;overlays.set(mesh,state);mesh.skin();return true;
  }
  window.BayPalmCoffeeArt=Object.freeze({world,map,pose});
})();
