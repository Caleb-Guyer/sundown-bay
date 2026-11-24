/* Working the switch box and walking Celia back to her car both use the same
   street-space measurements in the hardware and overhead views. */
(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),inches=m=>Math.round(m/.0254);
  const clamp=(v,lo,hi)=>Math.min(hi,Math.max(lo,v));
  function path(club,v,dest,home){
    const s=club.site,leaving=club.mode==="demo",pts=[{x:v.x,z:v.z}];
    const add=q=>{if(gap(q,pts.at(-1))>.045)pts.push({x:q.x,z:q.z});};
    if(leaving)s.fromSecond.slice(1).forEach(add);
    const start=leaving?s.goldExit:{x:v.x,z:v.z,dir:(Math.round(v.yaw/(Math.PI/2))%4+4)%4};
    BayCab.route(start,home?s.returnStreet:dest).pts.forEach(add);
    if(home)s.toSecond.forEach(add);
    return pts;
  }
  function crew(c,dt,e){
    const a=c.celia,v=c.lead,mode=c.mode;
    if(mode!==a.lastMode){a.footPath=null;a.retry=0;a.lastMode=mode;a.approached=false;a.doorClear=false;}
    const drivePose=()=>{a.ride=v;a.seat=c.seat;BayCarAccess.pose(v,-1,c.seat,a,a.motion,e.ground,dt);};
    if(mode==="alight"){
      if(!a.doorClear){if(!e.door(v,true,a,-1))return false;a.doorClear=true;}
      c.seat=Math.max(0,c.seat-dt/1.36);drivePose();
      if(c.seat)return false;
      a.ride=a.motion.ride=null;a.action="walk";return true;
    }
    if(mode!=="home"&&mode!=="boarding"){drivePose();return true;}
    const target=mode==="home"?c.site.celia:e.stand(v,-1);
    if(!target)return false;
    if(!a.approached&&gap(a,target)>.045){
      if(!a.footPath?.length){
        a.retry-=dt;if(a.retry>0)return false;a.retry=.8;
        a.footPath=e.walk(a,target,v);
        if(!a.footPath?.length)return false;
      }
      a.action="walk";a.ride=a.motion.ride=null;
      if(!BayCarAccess.walkPath(a,a.motion,a.footPath,dt,e.ground,1.58))return false;
    }
    a.approached=true;
    if(mode==="home"){a.action=c.cheer>.4?"cheer":"guide";a.yaw+=Math.atan2(Math.sin(target.yaw-a.yaw),Math.cos(target.yaw-a.yaw))*Math.min(1,dt*4);a.motion.step(dt,0,0);return true;}
    if(!a.doorClear){if(!e.door(v,false,a,-1))return false;a.doorClear=true;}
    c.seat=Math.min(1,c.seat+dt/1.48);drivePose();return c.seat===1;
  }
  function poses(c,dt){
    const show=c.show,focus=show?.v||(c.mode==="demo"?c.lead:c.site.pad);
    for(const a of c.actors){
      if(a===c.celia)continue;
      const role=a.role,at=show?.stage;
      a.action=role==="photographer"?"photo":role==="chalker"?"chalk":role==="nico"?at==="live"?"flag":at==="count"?"guide":"wave":
        role==="judge"?at==="live"||at==="card"?"judge":"idle":c.cheer>.3?"cheer":"idle";
      const look=Math.atan2(focus.x-a.x,focus.z-a.z)-a.yaw;
      a.yaw+=Math.atan2(Math.sin(look),Math.cos(look))*Math.min(1,dt*2.5);
      a.motion?.step(dt,0,0);
    }
  }
  function routeHint(c){
    const j=c.trip;if(!j)return "";
    if(j.stamps===3)return "Return to Nico’s stripe and press F";
    if(j.stage==="queued")return "Meet Celia at the yard after her current lap";
    if(j.stage==="keys")return "Bring the plum Solena or a car with a switch kit";
    if(j.stage==="join")return "Pull up alongside Celia’s gold Solena";
    if(c.mode==="curb")return "Celia’s salute · "+BayBrisasClub.moves[c.stopAt.move].name+" · "+BayBrisasClub.names(c.stopAt.move);
    return "Follow the gold Solena · "+((j.stamps&1)+((j.stamps>>1)&1))+" / 2 corners";
  }
  function camera(cam,v,ground){
    const eye=BayDriving.world(v,-5.65,-2.06),at=BayDriving.world(v,0,.1);
    const y=ground(v.x,v.z),height=.88+(v.hydraulic?.bodyLift||0)*.36;
    Object.assign(cam,{x:eye.x,y:y+1.46,z:eye.z,yaw:Math.atan2(at.x-eye.x,at.z-eye.z),
      pitch:Math.atan2(height-1.46,gap(eye,at)),focal:1.68});
  }
  function instrument(canvas,v){
    const g=canvas.getContext("2d"),r=v.hydraulic,shape=bayCarLayout(v.kind);
    const project=(x,y,z)=>[53+z*12+x*7,48-y*25+x*3.8-z*1.8];
    const line=(a,b,color,w)=>{g.strokeStyle=color;g.lineWidth=w;g.beginPath();g.moveTo(...a);g.lineTo(...b);g.stroke();};
    g.clearRect(0,0,104,65);g.fillStyle="#203f3b";g.fillRect(1,1,102,63);
    g.strokeStyle="#769286";g.strokeRect(2.5,2.5,99,59);
    for(const side of [-1,1]){
      const rail=[];for(let j=0;j<2;j++){
        const z=shape.axles[j],i=2*j+(side>0?1:0),x=side*(shape.track-.085),h=r.wheelLift[i],point=project(x,h+.22,z);
        const corner=r.bodyLift+(j?1:-1)*r.fore+side*r.side,body=project(x,.64+corner,z);
        line(project(x,0,z-.56),project(x,0,z+.54),"#849383",1.5);
        line(body,point,"#f0c894",1.75);rail.push(body);
        g.fillStyle=h>.055?"#f4cb7f":"#b7c6a3";g.beginPath();g.ellipse(point[0],point[1],3,5,-.22,0,2*Math.PI);g.fill();
      }
      line(rail[0],rail[1],side<0?"#b79d7c":"#f6dfb6",3.5);
    }
    g.fillStyle="#e4bd80";g.fillRect(8,7,clamp(r.pressure,0,1)*31,2);
  }
  function hud(c,v,allowed){
    const box=document.getElementById("brisasReadout"),s=c.show,j=c.trip;
    box.hidden=!allowed||!v?.hydraulic;
    if(box.hidden)return;
    let label="LAS BRISAS  /  HYDRAULICS",main="1 front · 2 rear",value="3 left · 4 right";
    if(s){
      const move=s.calls[Math.min(s.cue,s.calls.length-1)];
      label=BayBrisasClub.classes[s.kind].name+"  /  "+Math.min(3,s.cue+1)+" OF 3";
      if(s.stage==="count"){main="On the stripe";value="Watch Nico’s flag";}
      else if(s.stage==="result"){main=s.total+" / 100";value=s.newTitle?"Plum Solena · Keys earned":s.win?"Card signed · F to run again":"Another pass? Press F";}
      else if(s.stage==="card"){main=s.points.at(-1)+" points";value=inches(s.peak)+" in measured";}
      else{main=BayBrisasClub.moves[move].name;value="Press "+BayBrisasClub.names(move)+" · "+inches(s.peak)+" in"+(BayBrisasClub.moves[move].double?" · "+Math.min(2,s.hops)+"/2":"");}
    }else if(j){label="CELIA REYES  /  BOULEVARD ROLL";main=BayBrisasClub.courses[j.route].name;value=routeHint(c);}
    const set=(id,v)=>{const node=document.getElementById(id);if(node.textContent!==v)node.textContent=v;};
    set("brisasLabel",label);set("brisasCall",main);set("brisasValue",value);instrument(document.getElementById("brisasMeter"),v);
  }
  window.BayBrisasStreet={path,crew,poses,camera,hud,routeHint};
})();
