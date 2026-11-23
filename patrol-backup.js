/* Higher wanted levels share the same last radio sighting as the ground pursuit. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const ease=(v,end,rate,dt)=>v+(end-v)*-Math.expm1(-rate*dt);
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));

  class BayBackup {
    constructor(chase,overhangs){
      this.chase=chase;
      this.cover=chase.cover.concat(overhangs.filter(o=>o.w>1.2&&o.d>1.2&&o.top>2));
      this.reset();
    }
    reset(){this.roadblock=null;this.blockIn=0;this.air=null;this.nextSpikes=true;}
    layout(x,z,dx,dz,side,heat){
      const yaw=Math.atan2(dx,dz);
      const at=(across,along)=>({x:x+dz*across*side+dx*along,z:z-dx*across*side+dz*along,yaw});
      const car=(across,along,slant)=>({...at(across,along),yaw:yaw+side*slant,kind:"cruiser",
        role:"roadblock",speed:0,lean:0,brakes:.65,sees:false});
      const inner=car(heat>=4?-.3:.45,0,-1.37),outer=car(4.75,3.30,1.76);
      inner.post={x:inner.x,z:inner.z};inner.remaining=2.65;
      inner.x-=Math.sin(inner.yaw)*inner.remaining;inner.z-=Math.cos(inner.yaw)*inner.remaining;
      return {x,z,dx,dz,yaw,side,age:0,open:at(-4.85,0),units:[inner,outer],
        rail:{...at(2.45,-3.1),fall:0},cones:[at(-1.7,-3.6),at(-.65,-7.1),at(1.25,-10.8),at(5.65,-4.1)]};
    }
    chooseBlock(k,heat,clear){
      const grid=this.chase,road=grid.road(k);
      const heading=grid.direction(k);
      const junction=Math.abs(k.x-grid.nearest(k.x))<8&&Math.abs(k.z-grid.nearest(k.z))<8;
      const dir=junction?heading:road.vertical?{x:0,z:heading.z||(Math.cos(k.yaw)>=0?1:-1)}:
        {x:heading.x||(Math.sin(k.yaw)>=0?1:-1),z:0};
      const line=grid.nearest(dir.z?road.x:road.z),coord=dir.z?road.z:road.x,sign=dir.z||dir.x;
      const warning=clamp(44+Math.hypot(k.vx,k.vz)*.85,48,78);
      const candidates=[];
      for(const n of grid.roads){
        const j=dir.z?{x:line,z:n}:{x:n,z:line};
        for(const offset of [14,21,-15]){
          const lead=(n-coord)*sign+offset;
          if(lead>=warning&&lead<=145)candidates.push({x:j.x+dir.x*offset,z:j.z+dir.z*offset,dx:dir.x,dz:dir.z,score:Math.abs(lead-warning-9)});
        }
        // At the end of an avenue the next traffic call can cover a branching street.
        const ahead=(n-coord)*sign;
        if(ahead>=-9&&ahead<85)for(const side of [-1,1]){
          const dx=dir.z*side,dz=dir.x*side;
          candidates.push({x:j.x+dx*42,z:j.z+dz*42,dx,dz,score:130+Math.abs(ahead-32)});
        }
      }
      candidates.sort((a,b)=>a.score-b.score);
      for(const c of candidates){
        if(c.x< -175||c.x>146||c.z< -174||c.z>174||distance(c,k)<warning-2)continue;
        const lane=(k.x-c.x)*c.dz-(k.z-c.z)*c.dx,first=lane<-.5?-1:1;
        for(const side of [first,-first]){
          const b=this.layout(c.x,c.z,c.dx,c.dz,side,heat);
          if(clear(b))return b;
        }
      }
      return null;
    }
    equipBlock(b,heat,p){
      if(heat<4||b.equipmentSet)return;
      b.equipmentSet=true;
      if(!this.nextSpikes){this.nextSpikes=true;return;}
      // A crew already close to the player stays an ordinary roadblock on promotion.
      const lead=(b.x-p.x)*b.dx+(b.z-p.z)*b.dz;
      if(lead<39||b.clearedAt!==undefined)return;
      b.strip={x:b.x-b.dz*b.side*2.85-b.dx*10.8,z:b.z+b.dx*b.side*2.85-b.dz*10.8,
        yaw:b.yaw,halfWidth:1.68};
      this.nextSpikes=false;
    }
    updateBlock(heat,dt,p,clear,units,onRoad=true){
      const old=this.roadblock;
      if(old){
        old.age+=dt;
        if(old.clearedAt===undefined){
          const x=p.x-old.x,z=p.z-old.z,along=x*old.dx+z*old.dz,across=x*old.dz-z*old.dx;
          if(along>5&&along<12&&Math.abs(across)<9)old.clearedAt=old.age;
        }
        if(heat<3||(old.age>13&&distance(old,p)>112)){
          for(const u of old.units){const i=units.indexOf(u);if(i>=0)units.splice(i,1);}
          this.roadblock=null;this.blockIn=heat>=4?2.4:5;
        }
      }
      this.blockIn=Math.max(0,this.blockIn-dt);
      if(this.roadblock){this.equipBlock(this.roadblock,heat,p);return;}
      if(!onRoad||heat<3||this.blockIn>0||this.chase.searching||this.chase.unseen>.42)return;
      this.roadblock=this.chooseBlock(this.chase.lastSeen,heat,clear);
      this.blockIn=1.3;
      if(this.roadblock){units.push(...this.roadblock.units);this.equipBlock(this.roadblock,heat,p);}
    }
    park(unit,dt,clear){
      if(!unit.remaining)return;
      const pace=Math.min(2.1,Math.sqrt(3.4*unit.remaining)),step=Math.min(unit.remaining,pace*dt);
      const x=unit.x+Math.sin(unit.yaw)*step,z=unit.z+Math.cos(unit.yaw)*step;
      if(clear(unit,x,z,unit.yaw)){unit.x=x;unit.z=z;unit.remaining-=step;unit.speed=unit.remaining?pace:0;}
      else unit.speed=0;
      unit.brakes=unit.speed<1.2?1:.18;
    }
    driveThrough(car,dt,oldX=car.x,oldZ=car.z,oldYaw=car.yaw){
      const b=this.roadblock;
      if(!b||distance(car,b)>22)return false;
      let punctured=false;
      if(b.strip&&!car.flatSide&&distance(car,b.strip)<5.8){
        const hit=BayDriving.tireOnStrip(car,oldX,oldZ,oldYaw,b.strip);
        if(hit){car.flatSide=hit.side;car.flatAxle=hit.axle;car.flatLoad=0;punctured=true;}
      }
      for(const cone of b.cones){
        if(!cone.hit&&BayDriving.clearance(car,cone)<.21){cone.hit=true;cone.yaw=car.yaw;}
        if(cone.hit)cone.fall=Math.min(1,(cone.fall||0)+dt*5.8);
      }
      const rail=b.rail;
      if(!rail.hit){
        const s=Math.sin(b.yaw),c=Math.cos(b.yaw);
        for(const side of [-1,0,1]){
          if(BayDriving.clearance(car,{x:rail.x+c*side*1.35,z:rail.z-s*side*1.35})<.22){
            rail.hit=true;car.vx*=.92;car.vz*=.92;break;
          }
        }
      }
      if(rail.hit)rail.fall=Math.min(1,rail.fall+dt*3.8);
      return punctured;
    }
    floorForAircraft(x,z){
      let floor=0;
      for(const o of this.cover){
        if(Math.abs(o.x-x)<o.w*.5+5.6&&Math.abs(o.z-z)<o.d*.5+5.6)floor=Math.max(floor,o.top);
      }
      return floor+4.1;
    }
    flightDirection(k){
      if(!k.afloat)return this.chase.direction(k);
      const pace=Math.hypot(k.vx,k.vz);
      return pace>2?{x:k.vx/pace,z:k.vz/pace}:{x:Math.sin(k.yaw),z:Math.cos(k.yaw)};
    }
    dispatchAir(k){
      const dir=this.flightDirection(k),x=k.x+dir.x*71+dir.z*24,z=k.z+dir.z*71-dir.x*24;
      const altitude=Math.max(20,this.floorForAircraft(x,z));
      this.air={x,z,y:altitude,yaw:Math.atan2(k.x-x,k.z-z),vx:0,vz:0,lean:0,pitch:0,
        age:0,scanIn:0,ceiling:altitude,beamFraction:1,spotX:k.x+dir.x*28,spotZ:k.z+dir.z*28,
        radius:7.2,lit:0,sees:false,light:0,rotor:0};
      return this.air;
    }
    fly(heat,dt,p){
      if(heat<5){this.air=null;return;}
      const chase=this.chase,k=chase.lastSeen,a=this.air||this.dispatchAir(k);
      a.age+=dt;a.rotor=(a.rotor+dt*23)%(Math.PI*2);
      const lost=chase.unseen,searching=chase.searching,dir=this.flightDirection(k);
      const t=a.age,lead=Math.min(.7,.33+lost),cx=k.x+k.vx*lead,cz=k.z+k.vz*lead;
      const ahead=searching?27*Math.cos(t*.24):41+6*Math.cos(t*.32);
      const side=searching?23*Math.sin(t*.24):12+11*Math.sin(t*.36);
      const goalX=cx+dir.x*ahead+dir.z*side,goalZ=cz+dir.z*ahead-dir.x*side;
      const ox=goalX-a.x,oz=goalZ-a.z,gap=Math.hypot(ox,oz);
      const speed=Math.min(searching?16:k.afloat?41:37,gap*1.45),scale=gap>.01?speed/gap:0;
      a.vx=ease(a.vx,ox*scale,2.5,dt);a.vz=ease(a.vz,oz*scale,2.5,dt);
      a.x+=a.vx*dt;a.z+=a.vz*dt;
      const sweep=clamp((lost-.35)/1.6,0,1);
      const targetX=cx+Math.sin(t*1.03)*16*sweep,targetZ=cz+Math.sin(t*.73)*12*sweep;
      a.spotX=ease(a.spotX,targetX,3.1,dt);a.spotZ=ease(a.spotZ,targetZ,3.1,dt);
      a.radius=ease(a.radius,k.afloat?8.3:7.2,2,dt);
      const desiredYaw=Math.atan2(a.spotX-a.x,a.spotZ-a.z),yawError=turn(a.yaw,desiredYaw);
      a.yaw+=clamp(yawError,-1.6*dt,1.6*dt);
      const lateral=a.vx*Math.cos(a.yaw)-a.vz*Math.sin(a.yaw);
      a.lean=ease(a.lean,clamp(lateral*.009-yawError*.15,-.24,.24),3,dt);
      a.pitch=ease(a.pitch,-clamp((a.vx*Math.sin(a.yaw)+a.vz*Math.cos(a.yaw))*.005,-.10,.14),3,dt);
      a.scanIn-=dt;
      if(a.scanIn<=0){
        a.scanIn+=.10;
        const floor=this.floorForAircraft(a.x,a.z);
        const nextFloor=this.floorForAircraft(a.x+a.vx*.95,a.z+a.vz*.95);
        a.ceiling=Math.max(floor,nextFloor,15.9+Math.sin(t*.63)*1.2);
        a.y=Math.max(a.y,floor);
        const lamp=this.lamp(a);
        a.beamFraction=BayCamera.safeFraction(lamp,{x:a.spotX,y:.24,z:a.spotZ},this.cover);
        const inLight=a.light>.64&&Math.hypot(p.x-a.spotX,p.z-a.spotZ)<a.radius&&distance(a,p)<79;
        const visible=inLight&&BayCamera.safeFraction(lamp,{x:p.x,y:1.15,z:p.z},this.cover)>=1;
        a.lit=visible?Math.min(.6,a.lit+.10):0;
        a.sees=a.lit>=(searching?.39:.19);
      }
      a.y=ease(a.y,a.ceiling,a.y<a.ceiling?3.4:.85,dt);
      a.light=clamp((t-.45)/1.05,0,1);
    }
    lamp(a){
      return {x:a.x+Math.sin(a.yaw)*1.73,y:a.y-.62,z:a.z+Math.cos(a.yaw)*1.73};
    }
  }
  window.BayBackup=BayBackup;
})();
