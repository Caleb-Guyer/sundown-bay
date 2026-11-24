(() => {
  "use strict";
  const mix=(a,b,f)=>a+(b-a)*f,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const dist=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),wrap=BaySlipTrailer.wrap;
  const approach=(a,b,amount)=>a+clamp(b-a,-amount,amount);
  function worker(id,name,p){return {...p,id,name,y:0,action:"idle",seat:0,motion:new BayPlayerMotion()};}
  function crew(w){
    w.alda=worker("alda","Alda Santana",w.site.alda);w.benji=worker("benji","Benji Moss",w.site.benji);
    w.actors=[w.alda,w.benji];
  }
  function walkTo(a,p,dt,floor,pace=1.58){
    const d=dist(a,p),step=Math.min(d,dt*pace),yaw=d>.06?Math.atan2(p.x-a.x,p.z-a.z):p.yaw??a.yaw;
    if(step&&d){a.x+=(p.x-a.x)*step/d;a.z+=(p.z-a.z)*step/d;}
    a.yaw+=wrap(yaw-a.yaw)*-Math.expm1(-8*dt);a.y=floor(a.x,a.z);
    a.motion.step(dt,step,0);a.action=d>.12?"walk":"idle";return d<.13;
  }
  function crossing(a,p,f,start){
    const s=f*f*(3-2*f);a.x=mix(start.x,p.x,s);a.z=mix(start.z,p.z,s);
    a.y=mix(start.y,p.y,s)+.18*Math.sin(Math.PI*f);a.yaw=start.yaw+wrap(p.yaw-start.yaw)*s;
  }
  function stepCrew(w,dt,t,env){
    const a=w.alda,b=w.benji,d=w.site.dock,v=w.skiff,deck=d.skiffFoot;
    const pass=env.deck(.36,.105,.48),work=env.deck(.38,.105,.84);pass.yaw=v.yaw;work.yaw=v.yaw+Math.PI*.5;
    if(a.cross){
      const c=a.cross;c.f=Math.min(1,c.f+dt/1.12);
      crossing(a,c.out?{...deck,yaw:Math.PI}:pass,c.f,c.start);a.seat=c.out?1-c.f:c.f;
      a.action="cast";a.motion.step(dt,.72*dt,0);
      if(c.f===1){a.ride=c.out?null:v;a.cross=null;a.seat=c.out?0:1;}
    }else if(a.ride){
      a.working=approach(a.working||0,w.line?1:0,dt*1.75);
      crossing(a,work,a.working,pass);a.seat=1-a.working;a.seatY=.425;
      a.action=a.working>.26?"haul":"ride";a.motion.step(dt,0,0);
      if(w.slip&&!w.slip.out){a.cross={out:true,f:0,start:{x:a.x,y:a.y,z:a.z,yaw:a.yaw}};}
    }else{
      const boarding=w.floating&&!w.slip&&v.dock===d,nearRig=dist(w.trailer,w.site.wet)<24;
      const checking=!nearRig&&!w.slip&&!boarding&&t%52>27;
      const next=boarding?deck:checking?{x:d.x-1.2,z:d.z,yaw:-Math.PI/2}:w.site.alda;
      // Stay on the centerline of the catwalk until abreast of the boarding step.
      const p=Math.abs(a.x-next.x)>.45?{x:next.x,z:d.z,yaw:0}:next;
      if(walkTo(a,p,dt,env.floor)&&dist(a,next)<.20&&boarding){
        a.cross={out:false,f:0,start:{x:a.x,y:a.y,z:a.z,yaw:a.yaw}};
      }else if(checking&&a.action==="idle")a.action="check";
      else if(a.action==="idle"&&(nearRig||w.slip)){a.action=w.slip?"cast":"guide";a.target=w.trailer;}
    }
    const route=w.site.benchWalk||[w.site.benji],cycle=(t+5)%32;
    b.mark??=-1;const stop=cycle<14?route.length-1:-1;
    const target=b.mark===stop?stop:b.mark+Math.sign(stop-b.mark);
    const point=target<0?w.site.benji:route[target];
    if(walkTo(b,point,dt,env.floor,1.1)){b.mark=target;
      b.action=dist(w.trailer,w.site.parking)<9&&cycle<18?"guide":"check";b.target=w.trailer;
      if(b.action==="guide")b.yaw+=wrap(Math.atan2(b.target.x-b.x,b.target.z-b.z)-b.yaw)*Math.min(1,dt*2.4);
    }
  }
  function backSteer(v,t,site){
    const desired=site.wet.yaw+clamp((t.z-site.wet.z)*.095,-.26,.26);
    const cab=t.yaw+clamp(wrap(t.yaw-desired)*1.75,-.40,.40);
    return clamp(wrap(v.yaw-cab)*3.3,-1,1);
  }
  function rigCamera(cam,w){
    const t=w.trailer,v=t.hitched,p=BayDriving.world(v,2.18,2.45),q=BayDriving.world(t,0,-1.98);
    Object.assign(cam,{x:p.x,y:Math.max(t.y+.5,(v.y||0)+2.55),z:p.z,
      yaw:Math.atan2(q.x-p.x,q.z-p.z),pitch:-.19,focal:1.28});
  }
  function deckCamera(cam,w,zoom){
    const l=w.line,v=w.skiff,q=BayDriving.world(v,.32,.15),r=4.1*zoom,flat=r*Math.cos(l.elevation);
    const x=q.x+Math.sin(l.look)*flat,z=q.z+Math.cos(l.look)*flat;
    Object.assign(cam,{x,z,y:Math.max(.53,v.y+.61+r*Math.sin(l.elevation)),yaw:l.look+Math.PI,pitch:-l.elevation,focal:1.46});
  }
  function readout(w,car,boat,visible){
    const $=id=>document.getElementById(id),r=$("potReadout"),l=w.line,t=w.trailer;
    const parking=car&&t.hitched===car&&dist(t,w.site.wet)<37&&Math.abs(wrap(t.yaw-w.site.wet.yaw))<.92;
    r.hidden=!visible||!(l||w.slip||parking||boat===w.skiff&&w.saved.catchCount);if(r.hidden)return;
    const gauge=$("potLoad"),caption=$("potGaugeLabel"),stat=$("potStatus"),label=$("potName"),status=w.saved;
    let fill=0;gauge.hidden=!l&&!w.slip&&!parking;
    if(l){
      label.textContent=l.pot.name;stat.textContent=l.phase==="haul"?(l.cool?"Snagged · ease off":l.tension>.72?"Ease off the hauler":"Hauling · "+Math.round(l.lift*100)+"%"):l.phase==="empty"?"Alda is emptying the pot":"Paying the line back out";
      caption.textContent="Line tension";fill=l.tension;
    }else if(w.slip){
      label.textContent="Buttonwood Public Slip";stat.textContent=w.slip.out?"Paying out the painter":"Winding onto the bunks";
      caption.textContent="Winch";fill=w.slip.time/(w.slip.out?3.65:4.1);
    }else if(parking){
      const left=w.site.wet.x-t.x;label.textContent="Launch lane";
      stat.textContent=t.wet(w.site)?"At the wet stripe":left< -2?"Pull forward":"Back "+Math.max(0,Math.round(left))+" m to the wet stripe";
      caption.textContent="Trailer depth";fill=clamp(1-left/28,0,1);
    }else{label.textContent="Pip 16 · Live box";stat.textContent=status.catchCount+" keepers aboard";caption.textContent="";}
    const pct=clamp(Math.round(fill*100),0,100);gauge.style.setProperty("--pull",pct+"%");gauge.className=l&&l.tension>.72?"ease":"";gauge.setAttribute("aria-valuenow",String(pct));
  }
  window.BayButtonwoodStreet={crew,stepCrew,backSteer,rigCamera,deckCamera,readout,crossing};
})();
