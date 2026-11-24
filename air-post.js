/* The beach station, island post office and Fern 3 share their physical berths. */
(() => {
  "use strict";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const angle=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const actorSeat=(line,seat)=>{
    const p=BayFloatplaneArt.seats[seat];
    return BayFloatplaneArt.point(line.plane,p.x,p.y-.62,p.z);
  };
  function seatActor(line,actor,dt){
    const p=line.plane,seat=line.seatRole();
    Object.assign(actor,actorSeat(line,seat),{yaw:p.yaw});
    pose(actor,1,dt,line.manual,p.steer);
  }
  function pose(actor,f,dt,manual,steer){
    const m=actor.motion,r=m.ride||(m.ride={handle:[.48,.92,.14]});
    Object.assign(r,{side:1,seat:f,seatY:.62,floor:.12,steer,inner:f,outer:f,
      duck:Math.sin(f*Math.PI)*.46,latchDip:0,reach:Math.sin(f*Math.PI)*.52,pull:0,passenger:!manual});
    m.vx=m.vz=0;m.step(dt,0,0);
  }
  function crossFloat(line,a,actor,dt){
    const p=line.plane,entry=BayFloatplaneArt.entry;
    const path=[a.from||line.dock.exit,...[entry.float,entry.step,entry.door].map(q=>BayFloatplaneArt.point(p,q.x,q.y,q.z)),actorSeat(line,a.seat)];
    const times=[0,.30,.52,.71,1];
    let i=0;while(i<3&&a.t>times[i+1])i++;
    const f=clamp((a.t-times[i])/(times[i+1]-times[i]),0,1),u=f*f*(3-2*f);
    const b=path[i],c=path[i+1],seat=clamp((a.t-.57)/.43,0,1),facing=p.yaw-Math.PI/2;
    actor.x=b.x+(c.x-b.x)*u;actor.z=b.z+(c.z-b.z)*u;
    actor.y=b.y+(c.y-b.y)*u+Math.sin(Math.PI*f)*(i===3?.065:.12);
    const start=path[0].yaw??facing;
    actor.yaw=start+angle(start,facing)*clamp(a.t*3,0,1)+angle(facing,p.yaw)*seat;
    pose(actor,seat,dt,a.seat==="pilot",0);
  }
  // Bin roofs once. A distant aircraft never scans the city's whole collision list.
  function obstacles(blocks){
    const bins=new Map(),key=(x,z)=>Math.floor(x/24)+","+Math.floor(z/24);
    for(const o of blocks){
      const width=o.w/2+4,depth=o.d/2+4;
      for(let i=Math.floor((o.x-width)/24);i<=Math.floor((o.x+width)/24);i++)
        for(let j=Math.floor((o.z-depth)/24);j<=Math.floor((o.z+depth)/24);j++){
          const k=i+","+j;if(!bins.has(k))bins.set(k,[]);bins.get(k).push(o);
        }
    }
    return (x,z,y,yaw)=>{
      if(y<.10&&!BaySwimming.water(x,z))return true;
      const list=bins.get(key(x,z));if(!list)return false;
      const dx=2.65*Math.cos(yaw),dz=-2.65*Math.sin(yaw);
      for(const o of list){
        if(y>o.top+.10||y+2.25<(o.bottom||0))continue;
        for(const q of [-1,0,1])if(Math.abs(x+q*dx-o.x)<o.w/2+.20&&Math.abs(z+q*dz-o.z)<o.d/2+.20)return true;
      }
      return false;
    };
  }
  function water(x,z,yaw){
    if(!BayMarina.navigable(x,z))return false;
    const c=Math.cos(yaw),s=Math.sin(yaw);
    for(const sign of [-1,1])for(const end of [-1,1]){
      const px=x+c*sign*.96+s*end*1.42,pz=z-s*sign*.96+c*end*1.42;
      if(BayGullKey.waterBlocked(px,pz,.13))return false;
    }
    return true;
  }
  const modeName={pilot:"Flown by you",passenger:"Flown by Nani",shared:"Shared controls with Nani",skiff:"By skiff",shore:"By hand"};
  // The tide reader rides the unsold seat. He walks between the register and the float at each end.
  const tideWalk={
    marlin:[[206.34,-13.08],[209.3,-13.26],[223.8,-13.26],[227.13,-12.22]],
    key:[[348.55,-29.43],[347.35,-30.25],[347.35,-35.25],[347.32,-36.45],[344.87,-37.42]]
  };
  class TideReader{
    constructor(){
      this.name="Oren Vale";this.id="marlin";this.stage="office";this.trips=0;
      this.motion=new BayPlayerMotion();this.yaw=-Math.PI/2;
      [this.x,this.z]=tideWalk.marlin[0];this.y=BayGullKey.floor(this.x,this.z);
    }
    go(out){
      this.stage=out?"toFloat":"toDesk";const path=tideWalk[this.id];
      this.stop=path.reduce((i,q,j)=>Math.hypot(q[0]-this.x,q[1]-this.z)<Math.hypot(path[i][0]-this.x,path[i][1]-this.z)?j:i,0);
    }
    step(line,dt,giveWay){
      const p=line.plane,s=BayPelicanAir.site(this.id),docked=line.listen(s);
      if(this.stage==="ride"){
        this.yaw=p.yaw;Object.assign(this,actorSeat(line,"guest"));
        if(line.phase==="dock"&&(this.id!==line.at||giveWay)){
          if(this.id!==line.at)this.trips++;
          this.id=line.at;this.stage="off";this.f=1;
        }
        return;
      }
      if(this.stage==="on"||this.stage==="off"){
        if(this.stage==="on"&&giveWay)this.stage="off";
        this.f=clamp(this.f+(this.stage==="on"?1:-1)*dt/1.45,0,1);
        crossFloat(line,{t:this.f,seat:"guest",from:s.exit},this,dt);
        if(this.f===1&&this.stage==="on")this.stage="ride";
        if(this.f===0&&this.stage==="off"){this.motion.reset();this.go(false);}
        return;
      }
      if(this.stage==="office"){
        this.motion.step(dt,0,0);
        if(docked&&!giveWay&&line.clock>26&&line.clock<34)this.go(true);
        return;
      }
      if(this.stage==="toFloat"&&(giveWay||!docked))this.go(false);
      const path=tideWalk[this.id],q=path[this.stop],dx=q[0]-this.x,dz=q[1]-this.z,range=Math.hypot(dx,dz);
      const m=Math.min(range,dt*1.56);
      if(range>.002){
        const old=this.yaw;this.yaw+=angle(this.yaw,Math.atan2(dx,dz))*(-Math.expm1(-8*dt));
        this.x+=dx*m/range;this.z+=dz*m/range;this.y=BayGullKey.floor(this.x,this.z)??s.level;this.motion.step(dt,m,angle(old,this.yaw)/dt);
      }
      if(range>=.09)return;
      if(this.stage==="toFloat"&&this.stop===path.length-1){this.stage="on";this.f=0;}
      else if(this.stage==="toDesk"&&this.stop===0){this.stage="office";this.yaw=this.id==="key"?Math.PI:Math.PI*.57;}
      else this.stop+=this.stage==="toFloat"?1:-1;
    }
  }
  function flags(line,inside,near){
    const seat=line.player&&!line.transfer?line.seatRole():null;
    const pilotSide=seat||line.transfer?.seat;
    return {near,inside,onWater:line.plane.onWater,pilot:seat==="pilot"?"player":pilotSide==="pilot"?false:true,
      guest:seat==="guest"?"player":pilotSide==="pilot"?true:line.reader?.stage==="ride"?"reader":false};
  }
  const tagFor=id=>id==="key"?"key":"dock";
  const counterPoint=s=>s.id==="key"?{x:346.84,y:2.405,z:-28.23}:{x:204.97,y:1.18,z:-14.05};
  const exchange=(line,s)=>line.pending?.site===s?clamp(line.pending.time/1.24,0,1):0;
  function deskBag(line,s){
    const f=exchange(line,s);
    return line.pending?.site===s?(line.pending.kind==="load"?f<.82:f>.48):line.saved.bag!==s.id;
  }
  function world(list,line,crew,see,t,hours,model,view,inside){
    BayGullKey.world(list,see,t,hours);
    const p=line.plane;
    if(see(p,285)||inside){
      BayFloatplaneArt.world(list,p,t,{...flags(line,inside,see(p,59)),night:hours.night>.42});
    }
    const reader=line.reader;
    if(reader&&reader.stage!=="ride"&&see(reader,57)){
      const name="pelican-tide-reader";
      if(!reader.mesh){reader.mesh=new BayPlayerMesh(["#a37857","#d1ae74","#56645f"],"local");view.add(name,reader.mesh,true);}
      const changed=reader.mesh.update(reader.motion);
      if(reader.stage==="office")BayAirmailArt.deskPose(reader.mesh,reader,t,"pilot");
      if(changed||reader.stage==="office")view.updateAnimated(name);
      list.push([name,reader.x,reader.y,reader.z,reader.yaw]);
      if(reader.stage==="office")BayAirmailArt.deskProps(list,reader,t,"pilot",0,reader.mesh);
    }
    for(const a of crew){
      const s=a.site;
      if(!see(s.center,95))continue;
      BayGullKey.mailWorld(list,s,line.saved.count[BayPelicanAir.other(s.id)]);
      if(!see(a,50))continue;
      const name="pelican-clerk/"+s.id;
      if(!a.mesh){a.mesh=new BayPlayerMesh(BayAirmailArt.colors[a.role],"local");BayAirmailArt.dress(a.mesh,a.role);view.add(name,a.mesh,true);}
      const f=exchange(line,s);
      if(a.lastPose==null||t-a.lastPose>(see(a,12)?1/28:1/8)||f){
        BayAirmailArt.deskPose(a.mesh,a,t,a.role,f);view.updateAnimated(name);a.lastPose=t;
      }
      list.push([name,a.x,a.y,a.z,a.yaw]);
      BayAirmailArt.deskProps(list,a,t,a.role,f,a.mesh);
      if(deskBag(line,s))BayAirmailArt.bag(list,counterPoint(s),s.clerk.yaw+.20,t,tagFor(s.id));
    }
  }
  function mapPlaces(c,opt,px,py,s,visible,t){
    const line=opt.airLine;if(!line)return;
    BayGullKey.map(c,opt,px,py,s,visible,t);
    if(opt.mode!=="street")return;
    for(const a of opt.airCrew){
      if(!visible(px(a.x),py(a.z),15*s))continue;
      BayGullKey.mailMap(c,opt,px,py,s,a.site,line.saved.count[BayPelicanAir.other(a.site.id)]);
      BayAirmailArt.localMap(c,opt,px,py,s,a,t,a.role,exchange(line,a.site));
      if(deskBag(line,a.site))BayAirmailArt.bagMap(c,opt,px,py,s,counterPoint(a.site),a.yaw+.20,tagFor(a.site.id));
    }
  }
  function ledger(body,mem){
    for(const source of BayGullKey.sites){
      const id=source.id,r=mem.logs[id];if(!r)continue;
      const dest=BayPelicanAir.site(BayPelicanAir.other(id)),card=document.createElement("article");card.className="air-receipt";
      const title=document.createElement("strong");title.textContent=BayPelicanAir.letters[id][r.number][0];
      const address=document.createElement("p");address.textContent=source.name+" → "+dest.name;
      const route=document.createElement("canvas");route.width=450;route.height=112;route.setAttribute("aria-label","Route of your signed delivery");
      const ctx=route.getContext("2d"),points=r.trail;
      const xs=[source.desk.x,dest.desk.x,...points.map(p=>p[0])],zs=[source.desk.z,dest.desk.z,...points.map(p=>p[1])];
      const xmin=Math.min(...xs),xmax=Math.max(...xs),zmin=Math.min(...zs),zmax=Math.max(...zs);
      const scale=Math.min(396/Math.max(1,xmax-xmin),76/Math.max(1,zmax-zmin));
      const x=v=>225+(v-(xmin+xmax)/2)*scale,y=v=>56-(v-(zmin+zmax)/2)*scale;
      ctx.fillStyle="#cfdbcd";ctx.fillRect(0,0,450,112);ctx.strokeStyle="#adc4b6";ctx.lineWidth=1;
      for(let k=0;k<450;k+=25){ctx.beginPath();ctx.moveTo(k,0);ctx.lineTo(k,112);ctx.stroke();}
      for(let k=0;k<112;k+=25){ctx.beginPath();ctx.moveTo(0,k);ctx.lineTo(450,k);ctx.stroke();}
      // Trace the same shoreline and shell key used by the walking and water physics.
      const top=zmax+60/scale,bottom=zmin-60/scale;
      ctx.fillStyle="#b1c1a8";ctx.strokeStyle="#8ea895";ctx.beginPath();ctx.moveTo(-2,-2);
      for(let z=top;z>=bottom;z-=Math.max(2,(top-bottom)/50))ctx.lineTo(x(BaySwimming.coast(z)),y(z));
      ctx.lineTo(-2,114);ctx.closePath();ctx.fill();ctx.stroke();
      const island=BayGullKey.sites[1];ctx.beginPath();
      for(let i=0;i<=30;i++){
        const a=i*Math.PI/15,dx=Math.cos(a),dz=Math.sin(a);let radius=6;
        while(radius<12&&BayGullKey.landFloor(island.x+dx*radius,island.z+dz*radius)!=null)radius+=.4;
        const px=x(island.x+dx*radius),py=y(island.z+dz*radius);if(!i)ctx.moveTo(px,py);else ctx.lineTo(px,py);
      }
      ctx.closePath();ctx.fill();ctx.stroke();
      ctx.beginPath();ctx.moveTo(x(source.desk.x),y(source.desk.z));
      for(const q of points)ctx.lineTo(x(q[0]),y(q[1]));
      ctx.lineTo(x(dest.desk.x),y(dest.desk.z));ctx.strokeStyle="#385e5a";ctx.lineWidth=2.8;ctx.stroke();
      for(const s of [source,dest]){ctx.fillStyle=s===dest?"#a3513c":"#375953";ctx.beginPath();ctx.arc(x(s.desk.x),y(s.desk.z),4,0,Math.PI*2);ctx.fill();}
      ctx.font="bold 10px Consolas, monospace";ctx.fillStyle="#294b44";
      for(const s of [source,dest])ctx.fillText(s.id==="key"?"GULL KEY":"MARLIN",clamp(x(s.desk.x)+5,3,392),clamp(y(s.desk.z)+(s===source?13:-7),11,107));
      const totals=document.createElement("small");totals.textContent=modeName[r.mode]+(r.grade?" · Landing "+r.grade+"/100":"")+" · $"+r.pay+" received · "+mem.count[id]+" signed from this office";
      card.append(title,address,route,totals);body.append(card);
    }
  }
  window.BayAirPost={TideReader,seatActor,crossFloat,obstacles,water,flags,tagFor,world,mapPlaces,ledger};
})();
