/* Floating marks, wakes, and the outboard club's printed chart all use the live course coordinates. */
(() => {
  "use strict";
  const bay=BayMarina,ink="#153d42",cream="#f5e7c2",gold="#ffd36c";
  const lightPhase=(v,t)=>Math.floor(t*3.6+v.slot*.7)%2;
  function drawWorld(view,model,actors,boats,rival,patrol,race,see,t){
    const fleet=[...boats,rival,...patrol],north=bay.docks[1];
    if(!see(north,150)&&!see(bay.docks[0],150)&&!fleet.some(v=>see(v,150))&&!see(bay.beacon,175))return;
    if(!drawWorld.installed){BayMarinaArt.install(model);drawWorld.installed=true;}
    if(see(north,150)){
      actors.push(["marina-gangway",215,0,north.z,0],["marina-dock",north.x,0,north.z,0]);
    }
    if(see(bay.beacon,225))actors.push(["marina-beacon",bay.beacon.x,.02,bay.beacon.z,0]);
    const mark=(p,kind,i)=>{
      if(!see(p,150))return;
      const age=t-(race?.bobs.get(p)??-10),rock=age<1.8?Math.sin(age*13)*Math.exp(-age*2.1)*.61:0;
      actors.push(["marina-"+kind,p.x,.11+.06*Math.sin(t*1.4+i),p.z,i*.47,0,.016*Math.sin(t+i)+rock]);
    };
    bay.perimeter.forEach((p,i)=>mark(p,"start-buoy",i));
    if(race)race.course.gates.forEach((g,i)=>{
      const hot=i===race.index;mark(g.red,hot?"check-red":"red",i);mark(g.green,hot?"check-green":"green",i+9);
    });
    for(const v of fleet){
      if(see(v,160)){
        if(v.kind!=="pip")actors.push(["marina-"+v.kind,v.x,v.y,v.z,v.yaw,v.pitch,v.lean]);
        if(v===rival)actors.push(["marina-rival-pilot",v.x,v.y,v.z,v.yaw,v.pitch,v.lean]);
        if(v.kind==="patrol")actors.push([lightPhase(v,t)?"marina-patrol-blue":"marina-patrol-red",v.x,v.y,v.z,v.yaw,v.pitch,v.lean]);
      }
      for(const w of v.wake){
        if(t-w.at>3.25||!see(w,90))continue;
        const fade=t-w.at,spread=.66+fade*(1.32+w.pace*.66),c=Math.cos(w.yaw),s=Math.sin(w.yaw);
        for(const side of [-1,1])view.draw("marina-foam",w.x+c*spread*side,.077+.016*Math.sin(t*2),w.z-s*spread*side,w.yaw-side*.32);
      }
    }
    for(let ix=0;ix<7;ix++)for(let iz=0;iz<11;iz++){
      const x=231+ix*32+Math.sin(iz*2.9+ix)*8,z=-177+iz*35+Math.sin(t*.41+ix)*2;
      if(see({x,z},59))view.draw("marina-swell",x,.071,z,Math.sin(ix+iz*.6)*.7);
    }
  }
  function landingIcon(c,x,y,ui,label){
    c.save();c.translate(x,y);c.lineCap="round";c.lineJoin="round";
    const r=6.5*ui;c.fillStyle=ink;c.beginPath();c.arc(0,0,r*1.26,0,Math.PI*2);c.fill();
    c.strokeStyle="#abeee2";c.lineWidth=Math.max(1.1,1.2*ui);
    c.beginPath();c.moveTo(0,-r*.72);c.lineTo(0,r*.63);c.moveTo(-r*.37,-r*.2);c.lineTo(r*.37,-r*.2);
    c.moveTo(-r*.68,r*.12);c.quadraticCurveTo(-r*.51,r*.67,0,r*.63);c.quadraticCurveTo(r*.49,r*.67,r*.68,r*.12);c.stroke();
    if(label){c.font="bold "+9*ui+"px system-ui";c.textAlign="left";c.textBaseline="middle";c.lineWidth=2.8*ui;c.strokeStyle=ink;c.strokeText(label,r*1.55,0);c.fillStyle=cream;c.fillText(label,r*1.55,0);}
    c.restore();
  }
  function dot(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function patrolBlip(c,v,x,y,s,ui,t){
    c.save();c.translate(x,y);c.rotate(v.yaw);
    c.fillStyle=v.sees?"rgba(244,128,114,.26)":"rgba(128,196,238,.24)";
    c.beginPath();c.moveTo(0,0);c.arc(0,0,15*s,-2.22,-.92);c.closePath();c.fill();
    c.scale(ui,ui);c.beginPath();c.moveTo(0,-5.4);c.lineTo(3.1,-1);c.lineTo(2.6,4);c.lineTo(-2.6,4);c.lineTo(-3.1,-1);c.closePath();
    c.fillStyle="#243d51";c.fill();c.strokeStyle="#f1ead8";c.lineWidth=1;c.stroke();
    c.fillStyle=lightPhase(v,t)?"#8bd9ff":"#ff8473";c.fillRect(-2.8,-.9,5.6,1.8);c.restore();
  }
  function map(c,opt,px,py,s,ui,visible){
    const water=opt.marina;if(!water)return;
    const street=opt.mode==="street",chart=opt.mode==="atlas",race=water.race;
    const art=(k,p,yaw=0,flash=0)=>{if(visible(px(p.x),py(p.z),12*s))BayMarinaArt.drawMap(c,k,px(p.x),py(p.z),s,yaw,flash);};
    if(street){art("gangway",{x:215,z:92});art("dock",bay.docks[1]);art("beacon",bay.beacon);}
    else if(visible(px(bay.beacon.x),py(bay.beacon.z)))dot(c,px(bay.beacon.x),py(bay.beacon.z),3.5*ui,cream);
    for(const d of bay.docks){
      const x=chart&&!water.bayChart?d.footX+1.4:d.x;
      if(visible(px(x),py(d.z),12*ui)&&!street)landingIcon(c,px(x),py(d.z),ui*.87,chart?d.name:"");
    }
    if(street&&opt.cx>208){
      const range=Math.hypot(c.canvas.width,c.canvas.height)/s*.53;
      c.save();c.strokeStyle="#81b8b4";c.lineWidth=Math.max(.7,s*.14);c.beginPath();
      for(let x=Math.max(230,Math.floor((opt.cx-range)/13)*13);x<opt.cx+range;x+=13){
        for(let z=Math.floor((opt.cz-range)/16)*16;z<opt.cz+range;z+=16){
          const ox=x+4.2*Math.sin(z*.23+x*.67),oz=z+3*Math.cos(x*.38+z*.81)+Math.sin(opt.time*.76+z);
          if(!visible(px(ox),py(oz)))continue;
          c.moveTo(px(ox),py(oz));c.quadraticCurveTo(px(ox+1),py(oz+.35),px(ox+2.8),py(oz+.26));
        }
      }c.stroke();c.restore();
    }
    for(const p of bay.perimeter)if(visible(px(p.x),py(p.z))){
      if(street)art("start-buoy",p);else dot(c,px(p.x),py(p.z),1.25*ui,"#d5b288");
    }
    if(race){
      const gates=race.course.gates;
      if(!street){
        c.save();c.beginPath();c.moveTo(px(water.player.x),py(water.player.z));
        for(const g of gates.slice(race.index))c.lineTo(px(g.x),py(g.z));
        c.setLineDash([3.4*ui,2.6*ui]);c.strokeStyle="#fff1c7";c.lineWidth=1.45*ui;c.stroke();c.restore();
      }
      gates.forEach((g,i)=>{
        const hot=i===race.index;
        for(const [p,k] of [[g.red,"red"],[g.green,"green"]]){
          if(street)art((hot?"check-":"")+k,p);
          else if(visible(px(p.x),py(p.z)))dot(c,px(p.x),py(p.z),(hot?2.4:1.35)*ui,k==="red"?"#ed856f":"#9ce1bc");
        }
        if(hot){c.save();c.beginPath();c.setLineDash([3*ui,3*ui]);c.strokeStyle=gold;c.lineWidth=(street?2:1.2)*ui;c.moveTo(px(g.red.x),py(g.red.z));c.lineTo(px(g.green.x),py(g.green.z));c.stroke();c.restore();}
      });
    }
    if(street)for(const [x,z,k,yaw] of bay.sails){
      if(!visible(px(x),py(z),4*s))continue;
      c.save();c.translate(px(x),py(z));c.rotate(yaw);c.scale(k*s,k*s);c.fillStyle="#f4dbb8";c.beginPath();c.moveTo(0,-2.8);c.lineTo(.8,.7);c.lineTo(.7,2);c.lineTo(-.7,2);c.lineTo(-.8,.7);c.closePath();c.fill();c.fillStyle="#cc8c7d";c.fillRect(-.2,-1.6,.28,3);c.restore();
    }
    for(const v of [...water.boats,water.rival,...water.patrol]){
      if(street){
        c.save();c.lineWidth=Math.max(.9,.17*s);c.strokeStyle="#bce0d9";c.beginPath();
        for(const w of v.wake){const age=opt.time-w.at;if(age>3.25||!visible(px(w.x),py(w.z),7*s))continue;
          const span=.7+age*(1.3+w.pace*.66),cs=Math.cos(w.yaw),sn=Math.sin(w.yaw);
          for(const side of [-1,1]){const x=w.x+side*cs*span,z=w.z-side*sn*span;c.moveTo(px(x),py(z));c.lineTo(px(x-sn*1.1+side*.33*cs),py(z-cs*1.1-side*.33*sn));}}
        c.stroke();c.restore();if(v.kind!=="pip")art(v.kind,v,v.yaw,v.kind==="patrol"?lightPhase(v,opt.time):0);
      }else if(v!==water.player&&visible(px(v.x),py(v.z))){
        if(v.kind==="patrol")patrolBlip(c,v,px(v.x),py(v.z),s,ui,opt.time);
        else dot(c,px(v.x),py(v.z),v===water.rival&&race?3.6*ui:1.7*ui,v===water.rival?gold:cream);
      }
    }
  }
  function chart(canvas,course){
    const c=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
    const x=z=>(z+181)/367*w,y=e=>h-(e-183)/265*h;
    c.fillStyle="#244f55";c.fillRect(0,0,w,h);
    c.beginPath();c.moveTo(0,h);
    for(let z=-182;z<191;z+=6)c.lineTo(x(z),y(214+Math.sin(z/28)*1.7));
    c.lineTo(w,h);c.fillStyle="#c1b689";c.fill();
    c.lineWidth=1;c.strokeStyle="#477174";c.beginPath();
    for(let n=-150;n<180;n+=50){c.moveTo(x(n),0);c.lineTo(x(n),h);}
    for(let n=230;n<430;n+=40){c.moveTo(0,y(n));c.lineTo(w,y(n));}c.stroke();
    c.strokeStyle="#729590";c.setLineDash([2,5]);c.strokeRect(x(-180),y(430),x(180)-x(-180),y(220)-y(430));c.setLineDash([]);
    c.lineJoin="round";c.strokeStyle=gold;c.lineWidth=2.8;c.beginPath();c.moveTo(x(bay.start.z),y(bay.start.x));
    for(const g of course.gates)c.lineTo(x(g.z),y(g.x));c.stroke();
    for(const g of course.gates){dot(c,x(g.z),y(g.x),4.5,ink);dot(c,x(g.z),y(g.x),2.7,cream);}
    const finish=course.gates.at(-1),fx=x(finish.z),fy=y(finish.x),sx=x(bay.start.z),sy=y(bay.start.x);
    c.font="700 12px Consolas,monospace";c.fillStyle=cream;c.fillText("START",sx-14,sy+18);c.fillText("FINISH",fx-13,fy-10);
    const bx=x(bay.beacon.z),by=y(bay.beacon.x);c.fillStyle="#a9d2c7";c.beginPath();c.moveTo(bx,by-6);c.lineTo(bx+4,by+3);c.lineTo(bx-4,by+3);c.fill();
    c.font="italic 13px Georgia,serif";c.fillText("Gull Light",bx+6,by+2);
    c.font="700 12px Consolas,monospace";c.fillStyle=cream;c.fillText("N →",w-43,h-7);
  }
  window.BayMarinaView={drawWorld,map,chart};
})();
