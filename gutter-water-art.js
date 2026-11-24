/* Street water sits below the lane paint. The same pool edges, leaves and wheel spray appear in plan view. */
(() => {
  "use strict";
  const tau=2*Math.PI,clamp=x=>Math.max(0,Math.min(1,x));
  const waterY=.072,castY=.134,views=new WeakMap(),shapes=new WeakMap(),hardware=new Map();
  const leaves=[
    [-.26,-.38,.47,.19],[-.14,-.26,2.3,.13],[.11,-.32,1.74,.18],[.24,-.22,-.86,.14],
    [-.21,-.04,1.8,.16],[.04,-.12,-.54,.21],[.27,.05,1.30,.18],[-.30,.15,.24,.17],
    [-.04,.17,2.75,.17],[.20,.29,-1.25,.16],[-.15,.37,-.94,.15],[.05,.37,1.64,.18],
    [-.06,-.43,-.81,.19],[.12,.08,.26,.18],[-.14,.00,-.73,.16],[.01,-.22,-1.18,.16]
  ];
  const leafInk=[["#8f522e","#b87941"],["#b87b3e","#d49c56"],["#81553a","#ad7650"],
    ["#9a6740","#c38b52"],["#a35b35","#cc8250"],["#747046","#90804b"]];
  function meshFor(view,key,faces){
    let installed=views.get(view);
    if(!installed){installed=new Set();views.set(view,installed);}
    if(!installed.has(key)){
      const g=new BayMesh();
      for(const [color,points] of faces)for(let i=2;i<points.length;i++)g.tri(points[0],points[i-1],points[i],color);
      view.add(key,g);installed.add(key);
    }
  }
  function plan(ctx,faces){
    for(const [color,points] of faces){
      ctx.beginPath();ctx.moveTo(points[0][0],-points[0][2]);
      for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],-points[i][2]);
      ctx.closePath();ctx.fillStyle=color;ctx.fill();
    }
  }
  const stamps=new WeakMap();
  function mapPrint(ctx,faces,detail){
    let image=stamps.get(faces);
    if(!image){
      const canvas=document.createElement("canvas"),ink=canvas.getContext?.("2d");
      if(!ink){plan(ctx,faces);return;}
      let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
      for(const [,points] of faces)for(const [x,,z] of points){
        x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,-z);y1=Math.max(y1,-z);
      }
      const x=x0-2/detail,y=y0-2/detail;
      canvas.width=Math.ceil((x1-x0)*detail)+4;canvas.height=Math.ceil((y1-y0)*detail)+4;
      ink.setTransform(detail,0,0,detail,-x*detail,-y*detail);plan(ink,faces);
      image={canvas,x,y,w:canvas.width/detail,h:canvas.height/detail};stamps.set(faces,image);
    }
    ctx.drawImage(image.canvas,image.x,image.y,image.w,image.h);
  }
  function grate(count,variant){
    const id=count+"/"+variant;if(hardware.has(id))return hardware.get(id);
    const faces=[],p=(x,z,h=0)=>[x,castY+h,z];
    const plate=(x,z,w,l,h,col)=>faces.push([col,[p(x-w/2,z-l/2,h),p(x+w/2,z-l/2,h),p(x+w/2,z+l/2,h),p(x-w/2,z+l/2,h)]]);
    plate(0,0,.86,1.30,0,"#6b6d60");plate(0,0,.79,1.23,.002,"#303a3d");plate(0,0,.67,1.09,.003,"#222b2d");
    for(const x of [-.35,.35])plate(x,0,.041,1.13,.007,"#59605a");
    for(const z of [-.564,.564])plate(0,z,.742,.043,.008,"#75766a");
    for(let i=-4;i<=4;i++){
      const z=i*.117;
      faces.push(["#56605d",[p(-.321,z-.050,.006),p(.321,z-.008,.006),p(.321,z+.048,.006),p(-.321,z+.006,.006)]],
        ["#808478",[p(-.321,z-.050,.008),p(.321,z-.008,.008),p(.321,z+.005,.008),p(-.321,z-.037,.008)]]);
    }
    plate(.075,0,.037,1.04,.010,"#646d65");
    for(const x of [-.361,.361])for(const z of [-.531,.531])plate(x,z,.033,.035,.011,"#ab9a76");
    for(let i=0;i<count;i++){
      const k=(i*7+variant)%leaves.length,[x,z,base,l]=leaves[k],a=base+.24*variant;
      const sn=Math.sin(a),cs=Math.cos(a),w=l*.66,h=.020+.0024*i,ink=leafInk[(i+variant)%leafInk.length];
      const at=(u,v,y=0)=>p(x+cs*u+sn*v,z-sn*u+cs*v,h+y);
      const tip=at(0,l,.012),heel=at(0,-l*.74,.004),rib=at(0,l*.05,.036);
      faces.push([ink[0],[heel,at(-w*.86,-l*.38),at(-w,l*.24,.015),at(-w*.60,l*.65),tip,rib]],
        [ink[1],[heel,rib,tip,at(w*.75,l*.60,.012),at(w,l*.09),at(w*.76,-l*.46,.008)]],
        ["#ceaa6b",[at(-.008,-l*.96,.008),at(.008,-l*.96,.008),at(.008,-l*.69,.010),rib]]);
    }
    hardware.set(id,faces);return faces;
  }
  function leafCount(p){return p.cleared?0:Math.round(leaves.length*(1-clamp(p.work||0)));}
  function variant(p){return Math.abs(Math.round((p.seed||0)*17))%4;}
  function poolFaces(p,level){
    let levels=shapes.get(p);if(!levels){levels=new Map();shapes.set(p,levels);}if(levels.has(level))return levels.get(level);
    const faces=[],d=level/16,a=p.seed||0,v=variant(p);
    const length=p.halfLength*(.48+.52*Math.sqrt(d)),width=p.halfWidth*(.31+.69*Math.sqrt(d));
    function shore(q){
      const edge=BayGutters.shore(q,a);
      return {l:edge.left*width,r:edge.right*width,z:q*length};
    }
    const point=(s,u,h=0)=>[s.l+u*(s.r-s.l),waterY+h,s.z];
    // The far curb reflects as a dark ragged margin. A cooler strip of sky breaks over the wheel track.
    const rows=[0,.047,.17,.43,.73,.94,1],tones=["#505a60","#56676c","#65797d","#6f8387","#677b80","#505e64"];
    let previous=shore(-1);
    for(let i=1;i<=18;i++){
      const next=shore(i/9-1);
      for(let j=0;j<tones.length;j++)faces.push([tones[j],[point(previous,rows[j]),point(previous,rows[j+1]),point(next,rows[j+1]),point(next,rows[j])]]);
      previous=next;
    }
    const warm=["#a09289","#969c98","#9b9992","#a1978a"][v];
    for(let i=0;i<8;i++){
      const q=-.76+i*.216+.035*Math.sin(i*8+a),from=.16+.25*(.5+.5*Math.sin(2.9*i+a)),span=.10+.13*(.5+.5*Math.sin(i*3.8+a*.7));
      const s=shore(q),g=shore(q+.024),tip=point(s,from,.003),middle=point(g,from+span*.55,.003),end=point(s,from+span,.003);
      faces.push([i%3?"#919e9d":warm,[tip,middle,end]]);
    }
    levels.set(level,faces);return faces;
  }
  const depth=p=>p.depth>.018?Math.max(1,Math.min(16,Math.round(p.depth*16))):0;
  function markWater(state,t,visitPool,visitFan,triangle){
    // Marks carry opacity in their red channel, which is the renderer's water-vapour material.
    for(const p of state.pools){
      if(p.depth<.16||!(state.rain>.06)||!visitPool(p))continue;
      const sn=Math.sin(p.yaw),cs=Math.cos(p.yaw);
      for(let k=0;k<(state.rain>.57?3:1);k++){
        const clock=t*(1.1+.09*k)+.37*k+(p.seed||0),u=clock-Math.floor(clock);
        if(u>.78)continue;
        const wave=Math.floor(clock)*1.67+(p.seed||0)+k*3.64;
        const dx=Math.sin(wave*3.4)*p.halfWidth*.39,dz=Math.cos(wave*.94)*p.halfLength*.58;
        const x=p.x+cs*dx+sn*dz,z=p.z-sn*dx+cs*dz,r=.065+u*.35,w=.014+.012*(1-u),intensity=.38*(1-u/.78);
        let lastA=null,lastB=null;
        for(let i=0;i<=7;i++){
          const a=wave+i*.63,ca=Math.cos(a),sa=Math.sin(a);
          const A=[x+ca*r,waterY+.010,z+sa*r],B=[x+ca*(r+w),waterY+.010,z+sa*(r+w)];
          if(i){triangle(lastA,lastB,B,intensity);triangle(lastA,B,A,intensity);}
          lastA=A;lastB=B;
        }
      }
    }
    for(const f of state.fans){
      if(!visitFan(f)||!(f.life>0))continue;
      const u=clamp(f.age/f.life);if(u>=1)continue;
      const sn=Math.sin(f.yaw),cs=Math.cos(f.yaw),power=clamp(f.strength);
      const side=f.side<0?-1:1,travel=f.speed<0?-1:1,speed=clamp(Math.abs(f.speed)/19),seed=f.seed||0;
      const at=(across,up,along)=>[f.x+cs*across*side+sn*along*travel,waterY+up,f.z-sn*across*side+cs*along*travel];
      // A short curling sheet peels off the wheel. Its edge separates into fingers and then drops.
      for(let k=0;k<9;k++){
        const phase=k*.73+seed,scatter=.5+.5*Math.sin(phase*4.73),v=u*(.87+.13*scatter);
        const fan=k/8-.5,reach=.9+3.6*power;
        const x=(.12+(1-(1-v)*(1-v))*reach)*(.89+.12*scatter-.08*fan*fan);
        const z=-(.5+Math.abs(f.speed)*.10)*v+fan*(.18+v*(1.0+.68*power));
        const peak=(.15+power*.67+speed*.23)*(.70+.30*scatter);
        const y=4*v*(1-v)*peak,opacity=(1-u*u)*(.49+.27*scatter)*(.36+.64*power);
        if(k<8&&u<.57){
          const width=(.18+v*1.38)*.15;
          triangle(at(x*.51,y*.58,z*.53),at(x,y,z),at(x*.99,y*.96,z+width),opacity*.55);
        }
        const length=(.05+.09*scatter)*(1-.49*u),w=(.016+.019*power)*(1-.45*u);
        triangle(at(x-length,y-length*(1-2*v),z+w),at(x+w,y+w,z-w),at(x+length,y+length*(1-2*v),z-w),opacity);
        if(k%2===0)triangle(at(x*.90,y*.77,z+w),at(x*.90+w,y*.77+w,z),at(x*.90+w*2,y*.77-w,z-w),opacity*.66);
      }
    }
  }
  const batches=new WeakMap(),batchKey="gutter/water-in-motion";
  const reflections=new WeakMap(),lightKey="gutter/reflected-lamps";
  const lampInk={lamp:[.94,.81,.55],reverse:[.85,.90,.88],brake:[.96,.25,.14],tail:[.67,.31,.26]};
  function reflectedMarks(state,visible,mark){
    for(const r of state.lights||[]){
      if(!visible(r))continue;
      const sn=Math.sin(r.yaw),cs=Math.cos(r.yaw),ink=lampInk[r.tone],f=r.fade;
      const tint=[.40+(ink[0]-.40)*f,.47+(ink[1]-.47)*f,.49+(ink[2]-.49)*f];
      const at=(x,z)=>[r.x+cs*x+sn*z,waterY+.008,r.z-sn*x+cs*z];
      mark(at(-r.width*.5,-r.length*.42),at(r.width*.39,-r.length*.53),
        at(r.width*.5,r.length*.19),at(-r.width*.29,r.length*.50),tint);
    }
  }
  function reflectedWorld(view,see,state){
    if(!state.lights?.length)return;
    let b=reflections.get(view);
    if(!b){b={vertices:new Float32Array(96*6*6)};reflections.set(view,b);view.add(lightKey,b,true);}
    let n=0;
    reflectedMarks(state,r=>see(r,56),(a,c,d,e,tint)=>{
      if(n+36>b.vertices.length)return;
      for(const vertex of [a,c,d,a,d,e]){b.vertices.set(vertex,n);b.vertices.set(tint,n+3);n+=6;}
    });
    if(n){view.models.get(lightKey).count=n/6;view.updateAnimated(lightKey);view.draw(lightKey,0,0,0,0,0,0,.34);}
  }
  function world(view,list,see,state,t=0){
    if(!state||!view?.gl||view.lost)return;
    for(let i=0;i<state.pools.length;i++){
      const p=state.pools[i],v=variant(p),level=depth(p);
      if(p.grate&&see(p.grate,61)){
        const n=leafCount(p),key="gutter/casting/"+v+"/"+n;meshFor(view,key,grate(n,v));
        view.draw(key,p.grate.x,0,p.grate.z,p.yaw);
      }
      if(!level||!see(p,83))continue;
      const key="gutter/pool/"+i+"/"+level;
      meshFor(view,key,poolFaces(p,level));view.draw(key,p.x,0,p.z,p.yaw);
    }
    reflectedWorld(view,see,state);
    if(!(state.rain>.06)&&!state.fans.length)return;
    let b=batches.get(view);
    if(!b){b={vertices:new Float32Array(1320*3*6)};batches.set(view,b);view.add(batchKey,b,true);}
    const data=b.vertices;let end=0;
    function tri(a,b,c,alpha){
      if(end+18>data.length)return;
      for(const p of [a,b,c]){data[end++]=p[0];data[end++]=p[1];data[end++]=p[2];data[end++]=alpha;data[end++]=alpha;data[end++]=alpha;}
    }
    markWater(state,t,p=>see(p,37),f=>see(f,52),tri);
    if(!end)return;
    const entry=view.models.get(batchKey);if(entry)entry.count=end/6;
    view.updateAnimated(batchKey);list.push([batchKey,0,0,0,0,0,0,0,null,0,.9]);
  }
  function overhead(ctx,px,py,scale,state,t=0){
    if(!state||scale<=0)return;
    const w=ctx.canvas.width,h=ctx.canvas.height,diagonal=Math.hypot(w,h)*.5;
    const visible=p=>Math.hypot(px(p.x)-w*.5,py(p.z)-h*.5)<diagonal+(p.halfLength||4)*scale;
    const draw=(p,yaw,faces,detail)=>{ctx.save();ctx.translate(px(p.x),py(p.z));ctx.rotate(yaw);ctx.scale(scale,scale);mapPrint(ctx,faces,detail);ctx.restore();};
    for(const p of state.pools){
      if(!visible(p))continue;
      const level=depth(p);if(level)draw(p,p.yaw,poolFaces(p,level),16);
      if(p.grate)draw(p.grate,p.yaw,grate(leafCount(p),variant(p)),62);
    }
    reflectedMarks(state,visible,(a,b,c,d,tint)=>{
      ctx.fillStyle="rgb("+tint.map(n=>Math.round(n*255)).join(",")+")";
      ctx.beginPath();ctx.moveTo(px(a[0]),py(a[2]));for(const q of [b,c,d])ctx.lineTo(px(q[0]),py(q[2]));
      ctx.closePath();ctx.fill();
    });
    if(!(state.rain>.06)&&!state.fans.length)return;
    ctx.save();const incoming=ctx.globalAlpha;ctx.fillStyle="#d3deda";
    markWater(state,t,visible,visible,(a,b,c,alpha)=>{
      ctx.globalAlpha=incoming*alpha;ctx.beginPath();ctx.moveTo(px(a[0]),py(a[2]));
      ctx.lineTo(px(b[0]),py(b[2]));ctx.lineTo(px(c[0]),py(c[2]));ctx.closePath();ctx.fill();
    });
    ctx.restore();
  }
  window.BayGutterArt={world,overhead};
})();
