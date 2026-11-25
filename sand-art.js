(() => {
  const teal="#418883",cream="#f1d9a9",red="#c6533b",blue="#647c8c",ink="#384e51",wood="#aa7952";
  const marks=[],coast=z=>BaySwimming.coast(z);
  for(let i=0;i<490;i++){
    const z=((i*977)%3607)*.1-180,x=167.6+((i*353)%413)*.1;
    marks.push({x,z,l:.18+(i*19%71)*.018,angle:.84+(i%13)*.034,light:i%4===0});
  }
  function beachMesh(g){
    // Broad bands of packed, salt-darkened sand run parallel to the shoreline.
    const sections=z=>[166.5,180+Math.sin(z*.07),197+Math.cos(z*.05)*1.2,coast(z)-7.6+Math.sin(z*.11),coast(z)-4.7,coast(z)-1.7];
    const hues=[[.894,.771,.610],[.91,.797,.644],[.916,.812,.675],[.883,.780,.650],[.793,.705,.60],[.748,.681,.595]];
    const vertex=(x,z,k)=>{const c=hues[k],grain=.014*Math.sin(z*.27+k*1.8);g.vertices.push(x,.032,z,c[0]+grain,c[1]+grain,c[2]+grain);};
    for(let z=-180;z<180;z+=4){
      const a=sections(z),b=sections(z+4);
      for(let k=0;k<a.length-1;k++){
        for(const [h,j] of [[0,k],[1,k],[1,k+1],[0,k],[1,k+1],[0,k+1]])vertex((h?b:a)[j],z+h*4,j);
      }
    }
    for(const p of marks){
      const dx=Math.cos(p.angle)*p.l,dz=Math.sin(p.angle)*p.l;
      g.tri([p.x-dx,.036,p.z-dz],[p.x+.13,.036,p.z-.045],[p.x+dx,.036,p.z+dz],p.light?"#e9cfaa":"#d5b990");
    }
  }
  function board(g,x,y,z,shade,stripe){
    const outline=[[-1.36,.045],[-1.17,.19],[-.54,.295],[.36,.29],[.96,.224],[1.30,.089],[1.41,.014]];
    for(let i=1;i<outline.length;i++){
      const [a,aw]=outline[i-1],[b,bw]=outline[i],lift=d=>.045*Math.max(0,d-.72)**2;
      for(const sign of [-1,1]){
        g.quad([x,y+.06+lift(a),z+a],[x+sign*aw,y+.018+lift(a),z+a],[x+sign*bw,y+.018+lift(b),z+b],[x,y+.06+lift(b),z+b],shade);
      }
    }
    for(const f of [-.75,-.63])g.box(x,y+.054,z+f,.45,.016,.052,stripe);
    g.box(x,y+.064,z+.06,.019,.01,2.36,stripe);
  }
  function ladder(g,x,y,z){
    g.box(x,y+.046,z,.43,.066,1.65,red);
    for(const side of [-1,1])g.box(x+side*.197,y+.07,z,.038,.056,1.58,"#e18b51");
    for(let k=-5;k<=5;k++){
      const d=k*.127;g.box(x-.079,y+.089,z+d,.13,.031,.046,cream,.23);
      g.box(x+.079,y+.089,z+d,.13,.031,.046,cream,-.23);
    }
  }
  function rack(g){
    for(const z of [-.73,.60]){
      g.box(0,1.578,z,1.42,.08,.095,ink);
      for(const side of [-1,1])g.box(side*.59,1.495,z,.083,.16,.10,ink);
    }
    board(g,-.31,1.618,-.06,cream,red);board(g,.31,1.618,.06,teal,cream);
    for(const z of [-.64,.53])g.box(0,1.710,z,1.23,.025,.040,wood);
  }
  function world(view,model,see,b,t,hero,car){
    if(see({x:188,z:0},240)){model("sol-sand",beachMesh);view.draw("sol-sand");}
    if((b.ruts.length||b.feet.length)&&see({x:188,z:0},209))drawRuts(view,b);
    const v=b.v,ground=.046;
    if(see(v,108)){
      model("soft-sand/wagon",rack);view.draw("soft-sand/wagon",v.x,ground,v.z,v.yaw,v.pitch||0);
      if(b.phase==="stuck"){
        model("soft-sand/pockets",g=>{for(const side of [-1,1])for(const d of [-1,1]){
          const x=side*.83,z=d*1.13;g.box(x,.010,z,.39,.024,.86,"#9b8367");
          g.box(x+side*.22,.043,z-.21,.14,.075,.71,"#d1b289",side*.13);}});
        view.draw("soft-sand/pockets",BaySoftSand.home.x,ground,BaySoftSand.home.z,v.yaw);
        model("soft-sand/hand",g=>{g.pole([.18,.085,.07],[0,0,0],.06,"#d1976d",6);g.pole([0,0,0],[0,.16,.17],.043,"#b9805d",6);g.box(0,.17,.2,.07,.08,.104,"#c48b66");});
        const elbow=BayDriving.world(v,-.83,-.018);view.draw("soft-sand/hand",elbow.x,1.10,elbow.z,v.yaw,b.forward?-.38:-.04);
        if(b.signal){model("soft-sand/flash",g=>{for(const s of [-1,1])g.box(s*.65,.69,-1.78,.19,.118,.042,"#ffd396");});view.draw("soft-sand/flash",v.x,ground,v.z,v.yaw,0,0,1);}
      }
      if(b.phase==="stand"||b.phase==="unload"){
        model("soft-sand/rack",g=>{for(const z of [-.68,.68]){
          g.pole([-.42,0,z],[.20,.8,z],.055,wood);g.pole([.42,0,z],[-.20,.8,z],.055,wood);g.box(0,.73,z,.80,.075,.11,wood);}
          g.box(0,.32,0,.1,.10,1.5,wood);g.box(0,.78,0,.62,.095,1.60,"#b38862");});
        const r=b.rack();view.draw("soft-sand/rack",r.x,ground,r.z,v.yaw);
      }
    }
    model("soft-sand/mats",g=>{ladder(g,-.83,0,0);ladder(g,.83,0,0);});
    model("soft-sand/pair",g=>{ladder(g,0,0,0);ladder(g,0,.112,0);});
    const m=b.book.boards,r=b.rack();
    if(b.phase!=="stand"&&see(v,95)){
      const u=Math.max(0,Math.min(1,(b.unload-1.56)/1.54)),f=u*u*(3-2*u),a=BayDriving.world(v,0,-.13);
      view.draw("soft-sand/pair",a.x+(r.x-a.x)*f,1.75-.88*f+.22*Math.sin(f*Math.PI),a.z+(r.z-a.z)*f,v.yaw);
    }
    if(m&&see(m,85))view.draw("soft-sand/mats",m.x,.043,m.z,m.yaw);
    if(b.carry&&!car){const p=BayDriving.world(hero,.34,.02);view.draw("soft-sand/pair",p.x,hero.y+.81,p.z,hero.yaw,.075,1.35);}
    else if(b.phase==="stand"&&!m&&see(r,70))view.draw("soft-sand/pair",r.x,.87,r.z,v.yaw);
  }
  const rutBuffers=new WeakMap();
  function drawRuts(view,b){
    let buf=rutBuffers.get(view);
    if(!buf){buf={vertices:new Float32Array((380*2+110*2)*36),version:-1};rutBuffers.set(view,buf);}
    if(buf.version!==b.revision){
      let i=0;
      for(const {a,b:end,width,soft} of b.ruts){
        const dx=end.x-a.x,dz=end.z-a.z,d=Math.hypot(dx,dz),nx=dz/d,nz=-dx/d;
        for(const [lo,hi,r,g,bl] of [[-width,width,.675-.06*soft,.576-.06*soft,.46-.05*soft],[width,width+.065,.90,.79,.64]]){
          for(const [p,u] of [[a,lo],[end,lo],[end,hi],[a,lo],[end,hi],[a,hi]]){
            const data=buf.vertices;data[i++]=p.x+u*nx;data[i++]=.045;data[i++]=p.z+u*nz;data[i++]=r;data[i++]=g;data[i++]=bl;
          }
        }
      }
      for(const f of b.feet){
        const sn=Math.sin(f.yaw),cs=Math.cos(f.yaw);
        for(const [rear,front,width] of [[-.125,-.043,.051],[-.013,.143,.061]])for(const [x,z] of [[-1,rear],[1,rear],[1,front],[-1,rear],[1,front],[-1,front]]){
          const a=buf.vertices;a[i++]=f.x+x*width*cs+z*sn;a[i++]=.048;a[i++]=f.z-x*width*sn+z*cs;
          a[i++]=.716;a[i++]=.614;a[i++]=.50;
        }
      }
      buf.vertices.fill(0,i);if(buf.version<0)view.add("soft-sand/ruts",buf,true);else view.updateAnimated("soft-sand/ruts");buf.version=b.revision;
    }
    view.draw("soft-sand/ruts");
  }
  function mapGround(c,px,py,s,b,visible){
    if(!visible(px(188),py(0),185*s))return;
    c.save();c.lineCap="round";
    for(const p of marks){if(!visible(px(p.x),py(p.z),2*s))continue;c.lineWidth=.065*s;c.strokeStyle=p.light?"#edcfa8":"#d2b78f";
      c.beginPath();c.moveTo(px(p.x-p.l*.58),py(p.z-p.l*.68));c.lineTo(px(p.x+p.l*.58),py(p.z+p.l*.68));c.stroke();}
    for(const r of b.ruts){if(!visible(px(r.a.x),py(r.a.z),3*s))continue;
      c.lineWidth=r.width*2*s;c.strokeStyle=r.soft>.55?"#a18b70":"#b29b7e";c.beginPath();c.moveTo(px(r.a.x),py(r.a.z));c.lineTo(px(r.b.x),py(r.b.z));c.stroke();}
    c.fillStyle="#b59b7d";for(const p of b.feet){if(!visible(px(p.x),py(p.z),s))continue;
      c.beginPath();c.ellipse(px(p.x),py(p.z),.064*s,.14*s,p.yaw,0,2*Math.PI);c.fill();}
    c.restore();
  }
  function map(c,px,py,s,b,hero,visible){
    const v=b.v;
    const at=(p,yaw,fn)=>{if(!visible(px(p.x),py(p.z),4*s))return;c.save();c.translate(px(p.x),py(p.z));c.rotate(yaw);c.scale(s,-s);fn();c.restore();};
    const mat=x=>{c.fillStyle=red;c.fillRect(x-.215,-.82,.43,1.64);c.fillStyle=cream;for(let j=-5;j<=5;j++)c.fillRect(x-.16,j*.13,.32,.04);};
    at(v,v.yaw,()=>{
      for(const sign of [-1,1]){c.fillStyle=sign<0?cream:teal;c.beginPath();c.ellipse(sign*.31,0,.28,1.38,0,0,2*Math.PI);c.fill();
        c.fillStyle=sign<0?red:cream;c.fillRect(sign*.31-.22,-.77,.44,.08);}
      c.fillStyle=wood;for(const z of [-.64,.53])c.fillRect(-.62,z,1.24,.05);
      if(b.phase==="stuck"){c.fillStyle=b.signal?"#ffce71":"#8f543d";for(const side of [-1,1])c.fillRect(side*.68-.11,-1.81,.22,.13);}
    });
    if(b.phase==="stand"||b.phase==="unload")at(b.rack(),v.yaw,()=>{c.fillStyle=wood;c.fillRect(-.36,-.83,.72,1.66);if(b.phase==="stand"&&!b.carry&&!b.book.boards)mat(0);});
    if(b.phase!=="stand"){
      const u=Math.max(0,Math.min(1,(b.unload-1.56)/1.54)),f=u*u*(3-2*u),r=b.rack();
      at({x:v.x+(r.x-v.x)*f,z:v.z+(r.z-v.z)*f},v.yaw,()=>mat(0));
    }
    const m=b.book.boards;if(m)at(m,m.yaw,()=>{mat(-.83);mat(.83);});
    if(b.carry&&hero)at(BayDriving.world(hero,.34,.02),hero.yaw,()=>{mat(0);});
  }
  window.BaySandArt={world,mapGround,map};
})();
