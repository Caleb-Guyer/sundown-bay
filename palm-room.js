/* Camera, cloth projection and pocket calls all use the same live table coordinates. */
(() => {
  "use strict";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),tau=2*Math.PI;
  const scale=(w,h,end=false)=>end?Math.min(w*.82/1.546,h*.76/2.816):Math.min(w*.84/2.816,h*.68/1.546);
  function camera(cam,h,w,height){
    const m=h.match,t=h.site.table,c=m.swing?.cue||m.rack.cue,angle=m.swing?.angle??m.angle;
    let eye,look;
    const watching=m.stage==="play"&&m.rack.turn===1&&m.camera===0;
    if(m.stage!=="play"){
      eye={x:t.x+2.9,y:2.31,z:t.z-4.8};look={x:t.x+1.74,y:1.03,z:t.z+.12};
    }else if(watching){
      const actor=m.a,sn=Math.sin(angle),cs=Math.cos(angle);
      look={x:t.x*.60+actor.x*.40,y:1.04,z:t.z*.60+actor.z*.40};
      eye={x:look.x+2.68*cs+1.1*sn,y:2.08,z:look.z-2.68*sn+1.1*cs};
    }else if(m.camera===1){
      const sn=Math.sin(angle),cs=Math.cos(angle);
      eye={x:t.x+c.x-sn*1.12+cs*.19,y:t.y+.73,z:t.z+c.z-cs*1.12-sn*.19};
      look={x:t.x+c.x+sn*.62,y:t.y+.005,z:t.z+c.z+cs*.62};
    }else{
      const wide=Math.max(1,1.48/(w/height));
      eye={x:t.x+1.06*wide,y:t.y+2.12*wide,z:t.z-.025};look={x:t.x-.045,y:t.y,z:t.z};
    }
    Object.assign(cam,eye,{yaw:Math.atan2(look.x-eye.x,look.z-eye.z),pitch:Math.atan2(look.y-eye.y,Math.hypot(look.x-eye.x,look.z-eye.z)),focal:m.stage!=="play"?1.43:watching?1.56:m.camera===1?1.55:1.82});
  }
  function overview(x,y,z,t,w,h,end=false){
    const s=scale(w,h,end),lift=(y-t.y)*s*.08;
    return end?{x:w*.5+(x-t.x)*s,y:h*.527-(z-t.z)*s-lift}:{x:w*.5+(z-t.z)*s,y:h*.527+(x-t.x)*s-lift};
  }
  function fromScreen(sx,sy,t,cam,top,w,h,end=false){
    if(top){const s=scale(w,h,end),u=(sx-w*.5)/s,v=(sy-h*.527)/s+BayPalmPool.R*.08;return end?{x:u,z:-v}:{x:v,z:u};}
    const f=cam.focal||1.5,nx=(2*sx/w-1)*(w/h)/f,ny=(1-2*sy/h)/f,sn=Math.sin(cam.yaw),cs=Math.cos(cam.yaw),sp=Math.sin(cam.pitch),cp=Math.cos(cam.pitch);
    const dy=sp+ny*cp;if(dy>=-.007)return null;
    const depth=(t.y+BayPalmPool.R-cam.y)/dy;if(depth<=0)return null;
    return {x:cam.x+(sn*(cp-ny*sp)+nx*cs)*depth-t.x,z:cam.z+(cs*(cp-ny*sp)-nx*sn)*depth-t.z};
  }
  function opts(h,far=false){
    const m=h.match,g=m?.rack;
    return {far,calledPocket:g?.called??-1,ghost:g?.phase==="hand"&&!g.turn?{...m.hand,valid:g.canPlace(m.hand.x,m.hand.z)}:null,
      racking:m?.stage==="gather"&&g.style==="full"&&g.shots===0?Math.min(.90,m.age*.42):undefined};
  }
  function frameState(h,player){return {player,score:h.saved.card,door:h.door,cutaway:!!h.match&&h.match.stage==="play"&&!h.match.camera&&!h.match.rack.turn};}
  function role(a){return a.role==="player"?"player":BayPalmLeague.ids.includes(a.id)?a.id:"guest";}
  function poseOptions(h,a,kit,colors){
    const who=role(a),rider=!!a.ride&&a.seat>0;
    return {role:who,kit:who==="player"?kit:null,colors:who==="guest"?colors[a.base.style]:null,
      carry:!!(h.match&&(h.match.a===a||who==="player"))||a===h.luz&&a.state==="house"&&BayPalmDiner.contains(a.x,a.z),
      houseCue:who==="player"&&h.saved.houseCue,car:rider?a.ride:null,passenger:true,ground:a.y,
      ...(rider?{seat:a.seat}:{}),...a.posture};
  }
  function nearPeople(h,player){const p=h.people.filter(a=>a.state!=="street");if(h.match||h.playerSeat)p.push(player);return p;}
  function furniture(ctx,o,px,py,s,visible,t){
    if(!o.palmHouse)return;const h=o.palmHouse,site=h.site;
    BayPalmDiner.map(ctx,o,px,py,s,visible,t);
    if(o.mode!=="street")return;
    const here=o.player,inside=BayPalmDiner.contains(here.x,here.z),nearTable=visible(px(site.table.x),py(site.table.z),s*3);
    if(inside&&nearTable)BayPalmTable.map(ctx,(x,z)=>({x:px(x),y:py(z)}),site.table,h.balls,opts(h,s<11));
  }
  function map(ctx,o,px,py,s,visible,t){
    const inside=BayPalmDiner.contains(o.player.x,o.player.z);
    for(const item of o.palmPeople||[]){const a=item.a;
      if(!visible(px(a.x),py(a.z),s*2.3)||!inside&&BayPalmDiner.contains(a.x,a.z))continue;
      BayPalmPlayers.map(ctx,o,px,py,s,a,t,a.action,item.opts);
    }
  }
  function closeMap(canvas,h,hero,kit,colors,time){
    const ctx=canvas.getContext("2d"),w=canvas.width,hh=canvas.height,t=h.site.table,m=h.match,end=!!m.camera,wide=m.stage!=="play"||m.rack.turn&&!end,s=scale(w,hh,end)*(wide ? .50 : 1);
    ctx.fillStyle="#7a6b53";ctx.fillRect(0,0,w,hh);
    ctx.save();ctx.translate(w*.5,hh*.527);if(!end)ctx.rotate(Math.PI*.5);
    BayPalmDiner.map(ctx,{mode:"street",player:hero,palmDiner:frameState(h,hero)},x=>(x-t.x)*s,z=>(t.z-z)*s,s,()=>true,time);
    ctx.restore();const proj=(x,y,z)=>{const p=overview(x,y,z,t,w,hh,end);return wide?{x:w*.5+(p.x-w*.5)*.50,y:hh*.527+(p.y-hh*.527)*.50}:p;},flat=(x,z)=>proj(x,t.y,z);
    BayPalmTable.map(ctx,flat,t,h.balls,opts(h));
    for(const a of nearPeople(h,hero)){if(Math.hypot(a.x-t.x,a.z-t.z)>5.5)continue;
      BayPalmPlayers.projected(ctx,proj,s,a,time,a.action,poseOptions(h,a,kit,colors));}
  }
  function guide(canvas,h,top,view,w,hh){
    const m=h.match;canvas.hidden=!m||m.stage!=="play"||!!m.rack.turn||!["aim","hand"].includes(m.rack.phase)||!!m.swing;
    if(canvas.hidden)return;
    if(canvas.width!==w||canvas.height!==hh){canvas.width=w;canvas.height=hh;}const c=canvas.getContext("2d");
    c.clearRect(0,0,w,hh);const t=h.site.table,g=m.rack;
    const p=(x,z,y=BayPalmPool.R)=>top?overview(t.x+x,t.y+y,t.z+z,t,w,hh,!!m.camera):view.project(t.x+x,t.y+y,t.z+z);
    const path=(u,v,color,dashed=false)=>{if(!u||!v)return;c.beginPath();c.setLineDash(dashed?[4,5]:[]);c.strokeStyle=color;c.lineWidth=dashed?1.6:2.0;c.moveTo(u.x,u.y);c.lineTo(v.x,v.y);c.stroke();};
    c.save();
    if(g.phase==="aim"){
      const a=m.queue?.angle??m.angle,dx=Math.sin(a),dz=Math.cos(a),from=g.cue,aim=g.guide(a);
      const dest=p(aim.x,aim.z);path(p(from.x+dx*.049,from.z+dz*.049),dest,"rgba(247,238,199,.68)",true);
      if(aim.hit&&dest){
        const b=aim.hit,u=(b.x-aim.x)/(2*BayPalmPool.R),v=(b.z-aim.z)/(2*BayPalmPool.R),ink=g.legal(b.id)?"#f3e4a8":"#ef8e76";
        path(p(b.x,b.z),p(b.x+u*.24,b.z+v*.24),ink);
        c.setLineDash([]);c.strokeStyle=ink;c.lineWidth=1.45;c.beginPath();
        for(let i=0;i<=24;i++){const a=i*tau/24,q=p(aim.x+BayPalmPool.R*Math.sin(a),aim.z+BayPalmPool.R*Math.cos(a));if(q)c[i?"lineTo":"moveTo"](q.x,q.y);}c.stroke();
      }
      if(g.onBlack())BayPalmPool.pockets.forEach((hole,i)=>{const q=p(hole.x,hole.z,.054);if(!q)return;
        const chosen=i===g.called;c.fillStyle=chosen?"#e8c677":"#233b35";c.beginPath();c.arc(q.x,q.y,chosen?11:8,0,tau);c.fill();
        c.fillStyle=chosen?"#1b322e":"#f0e4c9";c.textAlign="center";c.textBaseline="middle";c.font="bold 12px system-ui";c.fillText(String(i+1),q.x,q.y);});
    }
    c.restore();
  }
  function hud(h,shown){
    const m=h.match,box=document.getElementById("palmReadout");box.hidden=!m||!shown;
    if(!m||!shown)return;
    const g=m.rack,op=m.a?.name||"Practice",result=m.stage==="result",pending=m.queue||m.swing;
    const set=(id,text)=>{const node=document.getElementById(id);if(node.textContent!==text)node.textContent=text;};
    set("palmTurn",result?(g.winner?op+" wins":"You win"):m.stage==="gather"?"Racking up":m.style==="practice"?"Open practice":g.turn?op+" at the table":"Your shot");
    const side=who=>{const group=g.groups[who];return group?(g.left(group)?g.left(group)+" "+(g.left(group)===1?group.slice(0,-1):group):"On the eight"):"Open";};
    set("palmLine",result?g.result:m.style==="practice"?"Palm Diner":m.stage==="gather"?op+" · "+(g.style==="full"?"House eight-ball":"Last three"):
      "You · "+side(0)+"     "+op+" · "+side(1));
    set("palmStatus",result?(m.newCue?"Honey-maple house cue earned":m.paid?"House card signed · +$"+m.paid:"House card signed"):g.phase==="roll"?"":m.stage==="gather"?"Taking your places":g.phase==="hand"?g.notice:
      g.onBlack()&&!g.turn&&g.called>=0?"Called · "+BayPalmPool.pocketName[g.called]:g.notice);
    const meter=document.getElementById("palmPower");meter.hidden=result||m.stage!=="play"||g.phase!=="aim"||!!g.turn;
    if(!meter.hidden){const n=m.draw==null?m.power:h.strength(m.draw);meter.style.setProperty("--pull",Math.round(n*100)+"%");meter.setAttribute("aria-valuenow",String(Math.round(n*100)));}
    set("palmHelp",result?"F  Rematch     E  Step away":m.stage==="gather"?"E  Step away":g.turn?"V  Camera     E  Step away":
      g.phase==="hand"?"Mouse or WASD  Position cue ball     F  Place":g.phase==="roll"||pending?"V  Camera":
      (g.onBlack()?"1–6  Call pocket     ":"")+"Mouse / ← →  Aim     ↑ ↓  Power     Shift  Fine     Space  Shoot     V  View     E  Leave");
  }
  window.BayPalmRoom={camera,overview,fromScreen,opts,frameState,poseOptions,nearPeople,furniture,map,closeMap,guide,hud};
})();
