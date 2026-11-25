/* Pier tackle, a cane rod with a live line, and the fish on Cal's measuring board. */
(() => {
  "use strict";
  const C=BayRedCork,cal={x:243.05,y:.37,z:-120.4,yaw:Math.PI/2+.38};
  const brass="#a87e46",wood="#8a6048",green="#647f70",ivory="#e0d9ac",red="#b94d38";
  function box(g){
    for(const x of [-.39,.39])for(const z of [-.22,.22])g.box(x,.255,z,.072,.51,.072,wood);
    g.box(0,.52,0,.97,.09,.58,green);
    g.box(0,.574,.06,.91,.025,.24,ivory);g.box(-.45,.61,.06,.035,.092,.24,wood);
    for(let n=0;n<18;n++)g.box(-.43+n*.05,.59,.15-(n%2?0:.026),.012,.009,n%2?.052:.105,"#374c44");
    g.box(.23,.68,-.17,.40,.20,.18,"#486b64");g.box(.23,.784,-.17,.41,.028,.19,green);
    g.box(.23,.824,-.17,.13,.045,.022,brass);
    for(const x of [.12,.33])g.box(x,.74,-.274,.04,.062,.015,brass);
    g.cyl(-.60,.19,.03,.157,.137,.38,12,"#7c9392");g.cyl(-.60,.39,.03,.16,.16,.035,12,ivory);
    g.cyl(-.60,.411,.03,.137,.137,.012,12,"#405b59");
    for(let i=0;i<3;i++){g.cyl(-.37+i*.09,.61,-.13,.026,.023,.10,7,ivory);g.cyl(-.37+i*.09,.664,-.13,.021,.027,.040,7,red);}
  }
  function fishMesh(g,id,cm){
    const f=C.fish[id],l=cm/100,r=l*(id==="jack"?.17:.13);
    const sections=[[-.34,.13],[-.24,.37],[-.09,.83],[.11,1],[.28,.81],[.39,.48],[.48,.12]];
    const ring=(section,i)=>{const a=i*Math.PI/4,k=section[1];return [Math.cos(a)*r*.53*k,Math.sin(a)*r*k,l*section[0]];};
    for(let j=1;j<sections.length;j++)for(let i=0;i<8;i++){
      const col=i<4?(i===1||i===2?f.stripe:f.color):(i===5||i===6?ivory:f.color);
      g.quad(ring(sections[j-1],i),ring(sections[j],i),ring(sections[j],i+1),ring(sections[j-1],i+1),col);
    }
    g.tri([0,.008,-l*.27],[0,r*.93,-l*.53],[0,0,-l*.45],f.stripe);
    g.tri([0,-.008,-l*.27],[0,0,-l*.45],[0,-r*.93,-l*.53],f.stripe);
    g.tri([0,r*.7,l*.16],[0,r*1.43,l*.02],[0,r*.70,-l*.18],f.stripe);
    for(const side of [-1,1]){
      g.tri([side*r*.50,0,l*.16],[side*r*.71,-r*.56,-l*.05],[side*r*.49,-r*.15,l*.06],f.stripe);
      g.box(side*r*.34,r*.22,l*.323,l*.027,l*.050,l*.057,"#38423b");
      if(id==="snook")for(let j=1;j<sections.length;j++){
        const a=sections[j-1],b=sections[j],p=(v,h)=>[side*r*.54*v[1],h*r*v[1],v[0]*l];
        g.quad(p(a,-.08),p(b,-.08),p(b,.07),p(a,.07),f.stripe);
      }
      if(id==="drum")g.box(side*r*.22,.012,-l*.23,.008,l*.04,l*.06,"#4c493e");
    }
  }
  const station=s=>({x:s.x-.44,z:s.z+1.10});
  function measure(r){
    if(r?.phase!=="landed"||r.clock>4.5)return null;
    const b=station(r.site),lift=Math.max(0,Math.min(1,(r.clock-2.85)/.85));
    const blend=Math.max(0,Math.min(1,r.clock/.28,(4.5-r.clock)/.54));
    return {x:b.x-.43+r.length*.0048+lift*3,y:r.site.y+.65*(1-lift)+Math.sin(lift*Math.PI)*.60,z:b.z+.06-lift*.6,blend,lift};
  }
  function ring(g){
    for(let i=0;i<26;i++)if(i%7!==0){
      const a=i*Math.PI/13,b=(i+1)*Math.PI/13,pt=(h,r)=>[Math.cos(h)*r,0,Math.sin(h)*r];
      g.quad(pt(a,.43),pt(b,.43),pt(b,.47),pt(a,.47),"#c6e4d7");
    }
  }
  function hand(r,t){
    const pull=r?.phase==="wind"?r.power:r?.phase==="fight"?r.tension:0;
    return {x:.26,y:1.11+.26*pull,z:.32-.12*pull,weight:1};
  }
  function grip(r,t,turning){
    const right=hand(r,t),angle=turning?t*10:0;
    return {right,left:{x:.045,y:right.y-.09+.051*Math.sin(angle),z:right.z+.045*Math.cos(angle),weight:1}};
  }
  function reel(list,model,root,yaw,h){
    model("cork/brass-reel",g=>{g.box(-.075,-.07,0,.17,.035,.04,brass);g.cyl(-.15,-.10,0,.061,.061,.059,10,"#9f865f");g.box(-.193,-.10,.024,.087,.021,.023,wood);});
    const c=Math.cos(yaw),s=Math.sin(yaw);
    list.push(["cork/brass-reel",root.x+c*h.x+s*h.z,root.y+h.y,root.z-s*h.x+c*h.z,yaw]);
  }
  const buffers=new WeakMap();
  function tackle(list,view,key,root,yaw,palm,end,lift,bend,slack){
    // Two narrow crossed ribbons per segment. Both rods reuse their fixed GPU buffers.
    const sn=Math.sin(yaw),cs=Math.cos(yaw);
    const base={x:root.x+cs*palm.x+sn*palm.z,y:root.y+palm.y,z:root.z-sn*palm.x+cs*palm.z};
    const rod=[];for(let i=0;i<=5;i++){
      const u=i/5,d=-.26+u*2.20;
      rod.push({x:base.x+sn*d*Math.cos(lift),z:base.z+cs*d*Math.cos(lift),y:base.y+d*Math.sin(lift)-bend*u*u});
    }
    const tip=rod[5],line=[];
    for(let i=0;i<=8;i++){const u=i/8;
      line.push({x:tip.x+(end.x-tip.x)*u,y:tip.y+(end.y-tip.y)*u-slack*Math.sin(Math.PI*u),z:tip.z+(end.z-tip.z)*u});}
    let all=buffers.get(view);if(!all){all=new Map();buffers.set(view,all);}
    let data=all.get(key);if(!data){data=new Float32Array(13*12*6);view.add(key,{vertices:data},true);all.set(key,data);}
    let n=0;
    function segment(a,b,r,col){
      for(const [dx,dy,dz] of [[cs*r,0,-sn*r],[0,r,0]])for(const [p,k] of [[a,-1],[a,1],[b,1],[a,-1],[b,1],[b,-1]]){
        data[n++]=p.x-root.x+k*dx;data[n++]=p.y-root.y+k*dy;data[n++]=p.z-root.z+k*dz;
        data[n++]=col[0];data[n++]=col[1];data[n++]=col[2];
      }
    }
    for(let i=1;i<rod.length;i++)segment(rod[i-1],rod[i],.045-i*.005,i===1?[.49,.31,.18]:i===4?[.32,.24,.18]:[.79,.62,.37]);
    for(let i=1;i<line.length;i++)segment(line[i-1],line[i],.015,[.77,.80,.70]);
    view.updateAnimated(key);list.push([key,root.x,root.y,root.z,0]);
  }
  function schoolPoint(s,t,i){
    const q=C.shoal(s,t),a=t*.94+i*2.34;
    return {x:q.x+Math.cos(a)*1.22,z:q.z+Math.sin(a)*.72,y:.095+Math.max(0,Math.sin(t*2.2+i*1.8)-.55)*.68,yaw:-a};
  }
  function world(list,model,view,see,r,hero,t){
    for(const s of C.sites){
      if(!see(s,69))continue;
      model("cork/bench",box);const b=station(s);list.push(["cork/bench",b.x,s.y,b.z,0]);
      if(!see(s,45))continue;
      model("cork/baitfish",g=>fishMesh(g,"pin",25));
      for(let i=0;i<5;i++){const p=schoolPoint(s,t,i);list.push(["cork/baitfish",p.x,p.y+BaySwimming.surfaceY(p,t),p.z,p.yaw,.19*Math.cos(t*2+i)]);}
    }
    if(!r&&!see(cal,50))return;
    model("cork/float",g=>{g.cyl(0,.03,0,.074,.105,.20,10,ivory);g.cyl(0,.19,0,.020,.074,.13,10,red);g.cyl(0,.27,0,.014,.014,.08,7,red);});
    if(see(cal,50)){
      const a=(t%19)/19,d=2.2+Math.min(1,a*16,Math.max(0,(1-a)*5))*8.8;
      const p=C.point(cal,d,0);p.y=BaySwimming.surfaceY(p,t)+.075;
      tackle(list,view,"cork/cal-rod",cal,cal.yaw,hand(null,t),p,.43+.26*Math.cos(a*Math.PI*2),.055,.10);
      reel(list,model,cal,cal.yaw,hand(null,t));
      model("cork/cal-hat",g=>{g.cyl(0,.0,0,.218,.222,.024,12,"#c1a17a");g.cyl(0,.067,-.012,.136,.153,.121,10,"#b29571");g.cyl(0,.029,-.012,.151,.154,.026,10,green);});
      list.push(["cork/cal-hat",cal.x,cal.y+1.73,cal.z,cal.yaw,.04]);
      list.push(["cork/float",p.x,p.y,p.z,0]);
    }
    if(!r)return;
    const h=hand(r,t),aim=hero.yaw,lift=r.phase==="wind"?.40+r.power*1.25:r.phase==="flight"?.87-r.clock*.8:r.phase==="fight"?.55+.44*r.tension:.53;
    const idle={x:hero.x+Math.sin(aim)*1.90,z:hero.z+Math.cos(aim)*1.90,y:hero.y+.87};
    const end=r.cork||idle;
    tackle(list,view,"cork/guest-rod",hero,aim,h,end,lift,r.phase==="fight"?.11+r.tension*.70:.065,r.cork?.y<.6?.11:.055);
    reel(list,model,hero,aim,h);
    list.push(["cork/float",end.x,end.y,end.z,0]);
    if(r.cedar){
      model("cork/cedar",g=>{g.box(0,0,0,.047,.054,.18,red);g.box(0,.017,.065,.046,.022,.042,ivory);g.box(0,-.035,-.055,.016,.042,.025,brass);});
      list.push(["cork/cedar",end.x,end.y-.21,end.z,aim,.22]);
    }
    model("cork/ripple",ring);
    if(r.phase==="wind"||r.phase==="ready"){
      const q=C.point(r.site,r.phase==="wind"?4.5+r.power*14.5:8,r.aim);
      list.push(["cork/ripple",q.x,BaySwimming.surfaceY(q,t)+.07,q.z,0]);
    }
    if(r.phase==="bite"||r.phase==="fight"){
      list.push(["cork/ripple",end.x,BaySwimming.surfaceY(end,t)+.07,end.z,t*.76]);
      if(r.phase==="fight"&&r.run){
        const k="cork/run/"+r.id;model(k,g=>fishMesh(g,r.id,C.fish[r.id].min+8));
        list.push([k,end.x+.22,end.y-.11+Math.max(0,Math.sin(r.clock*4))*.30,end.z,r.site.yaw+r.bearing,Math.cos(r.clock*4)*.43]);
      }
    }
    const m=measure(r);
    if(m&&m.lift<1){
      const cm=r.length,k="cork/catch/"+r.id+cm;
      model(k,g=>fishMesh(g,r.id,cm));
      list.push([k,m.x,m.y,m.z,-Math.PI/2+m.lift*Math.PI,.1,1.48*(1-m.lift)]);
    }
  }
  function map(c,opt,px,py,s,visible){
    const r=opt.angling,t=opt.streetTime||0;
    for(const site of C.sites){
      const b=station(site),x=px(b.x),y=py(b.z);if(!visible(x,y,30*s))continue;
      c.save();
      if(opt.mode==="street"){
        c.fillStyle=green;c.fillRect(x-.49*s,y-.30*s,.98*s,.60*s);c.fillStyle=ivory;c.fillRect(x-.46*s,y-.18*s,.90*s,.24*s);
        if(s>12){c.fillStyle="#46564c";for(let i=0;i<18;i++)c.fillRect(x+(-.43+i*.05)*s,y-.17*s,.009*s,(i%2?.042:.08)*s);
          c.fillStyle="#3f655d";c.fillRect(x+.02*s,y+.09*s,.41*s,.18*s);}
        for(let i=0;i<5;i++){const q=schoolPoint(site,t,i);c.fillStyle=i%2?ivory:"#8cbcb4";c.fillRect(px(q.x),py(q.z),Math.max(1,.24*s),Math.max(1,.068*s));}
        if(site===C.sites[0]){c.fillStyle=green;c.beginPath();c.arc(px(cal.x),py(cal.z),.28*s,0,Math.PI*2);c.fill();c.fillStyle=ivory;c.fillRect(px(cal.x),py(cal.z)-.06*s,1.58*s,.055*s);}
      }else{c.fillStyle=red;c.strokeStyle=ivory;c.lineWidth=1.3;c.beginPath();c.arc(x,y,3.7,0,Math.PI*2);c.fill();c.stroke();}
      c.restore();
    }
    if(!r||opt.mode!=="street")return;
    const site=r.site,q=r.cork||C.point(site,1.9,r.aim),rod=C.point(site,1.8,r.aim);
    c.save();c.lineWidth=Math.max(1,s*.07);c.strokeStyle="#ac8756";c.beginPath();c.moveTo(px(site.x),py(site.z));c.lineTo(px(rod.x),py(rod.z));c.stroke();
    c.strokeStyle=ivory;c.lineWidth=Math.max(1,s*.025);c.beginPath();c.moveTo(px(rod.x),py(rod.z));c.lineTo(px(q.x),py(q.z));c.stroke();
    c.fillStyle=r.phase==="bite"?"#783932":red;c.beginPath();c.arc(px(q.x),py(q.z),Math.max(2,s*.12),0,Math.PI*2);c.fill();c.stroke();
    if(r.phase==="wind"||r.phase==="ready"){const p=C.point(site,r.phase==="wind"?4.5+r.power*14.5:8,r.aim);c.setLineDash([3,4]);c.beginPath();c.arc(px(p.x),py(p.z),.52*s,0,Math.PI*2);c.stroke();}
    if(r.phase==="fight"&&r.run){c.fillStyle=C.fish[r.id].color;c.beginPath();c.ellipse(px(q.x+.25),py(q.z),s*.28,s*.095,-r.bearing,0,Math.PI*2);c.fill();}
    const m=measure(r);
    if(m&&m.lift<1){
      c.save();c.translate(px(m.x),py(m.z));c.rotate(m.lift*Math.PI);const size=s*r.length/100;c.scale(size,size);
      const f=C.fish[r.id],fat=r.id==="jack"?.15:.12;
      c.fillStyle=f.stripe;c.beginPath();c.moveTo(.25,-.02);c.lineTo(.52,-fat);c.lineTo(.46,0);c.lineTo(.52,fat);c.closePath();c.fill();
      c.fillStyle=f.color;c.strokeStyle=f.stripe;c.lineWidth=.018;c.beginPath();c.moveTo(-.48,0);
      c.bezierCurveTo(-.32,-fat*1.3,.05,-fat*1.4,.33,-.023);c.lineTo(.33,.03);c.bezierCurveTo(.03,fat*1.15,-.31,fat*1.32,-.48,0);c.fill();c.stroke();
      c.fillStyle="#34463e";c.beginPath();c.arc(-.32,-.027,.024,0,Math.PI*2);c.fill();c.restore();
    }
    c.restore();
  }
  function card(book,id){
    const f=C.fish[id],cm=book.best[id],canvas=document.createElement("canvas");
    canvas.width=560;canvas.height=108;canvas.className="cork-tag";canvas.setAttribute("role","img");canvas.setAttribute("aria-label",f.name+" · personal best "+cm+" centimetres");
    const c=canvas.getContext?.("2d");if(!c)return canvas;
    c.fillStyle="#e5d9b9";c.fillRect(0,0,560,108);c.fillStyle="#32665c";c.fillRect(0,0,7,108);
    c.strokeStyle="#b7ac8e";c.beginPath();c.moveTo(180,9);c.lineTo(180,99);c.stroke();
    const depth=id==="jack"?20:id==="pin"?16:12;
    c.save();c.translate(90,50);
    const shape=(pts,col)=>{c.fillStyle=col;c.beginPath();for(const [i,p] of pts.entries())i?c.lineTo(...p):c.moveTo(...p);c.closePath();c.fill();c.stroke();};
    c.strokeStyle="#526152";c.lineWidth=1.3;
    shape([[-40,-3],[-65,-depth+2],[-58,0],[-65,depth-2],[-40,4]],f.stripe);
    shape([[-45,-3],[-23,-depth*.63],[-6,-depth],[9,-depth*.82],[31,-depth*.68],[55,-2],[60,2],[48,6],[17,depth],[-11,depth*.81],[-46,4]],f.color);
    shape([[-18,-depth*.68],[-11,-depth*1.42],[12,-depth*.83]],f.stripe);
    c.beginPath();c.moveTo(25,-depth*.61);c.quadraticCurveTo(15,0,26,depth*.69);c.stroke();
    c.fillStyle="#273f3a";c.beginPath();c.arc(39,-3,2.7,0,Math.PI*2);c.fill();
    if(id==="snook"){c.fillRect(-40,-1,69,2.3);}else if(id==="drum"){c.beginPath();c.arc(-32,-2,2.5,0,Math.PI*2);c.fill();}
    else if(id==="pin"){for(let k=-24;k<15;k+=8)c.fillRect(k,-7,1.7,12);}
    c.restore();c.fillStyle="#435a51";
    for(let i=0;i<28;i++)c.fillRect(20+i*5.1,84,1,i%5===0?9:4);
    c.font="bold 24px Georgia,serif";c.fillText(f.name,200,52);c.font="13px monospace";c.fillText("TAG & RELEASE",201,77);
    c.textAlign="right";c.fillStyle="#a34c39";c.font="bold 33px Georgia,serif";c.fillText(cm+" cm",542,63);return canvas;
  }
  window.BayRedCorkArt={cal,grip,measure,world,map,card};
})();
