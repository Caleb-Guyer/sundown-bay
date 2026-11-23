/* Metres, world axes and a fixed-radius ball. Both courts use the same rim and glass. */
(() => {
  "use strict";
  const art=BayCourtPlaces,r=.12,wire=.012,rim=.2286+wire,gravity=11.7;
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function velocity(site,u,v){
    const c=Math.cos(site.yaw),s=Math.sin(site.yaw);return {x:u*c+v*s,z:-u*s+v*c};
  }
  function loose(ball){
    ball.holder=null;ball.state="loose";ball.shot=null;ball.to=null;
  }
  function hold(ball,p){
    ball.catchFrom=ball.state?{x:ball.x,y:ball.y,z:ball.z}:null;ball.catchAge=0;
    ball.state="held";ball.holder=p;ball.to=null;ball.shot=null;ball.vx=ball.vy=ball.vz=0;
    if(!ball.catchFrom)Object.assign(ball,BayCourtPlayers.hand(p));
  }
  function heldPose(ball,dt){
    const p=ball.holder,h=BayCourtPlayers.hand(p);
    if(p.action==="dribble"){
      // Downstroke and rebound meet at the floor. The hand contacts the ball at the top of each stroke.
      const u=Math.abs(p.beat*2-1);h.y=p.y+r+(h.y-p.y-r)*(2*u-u*u);
      ball.spin+=dt*4;
    }
    if(ball.catchFrom){
      ball.catchAge+=dt;const u=clamp(ball.catchAge/.145,0,1),w=u*u*(3-2*u);
      for(const k of ["x","y","z"])h[k]=ball.catchFrom[k]+(h[k]-ball.catchFrom[k])*w;
      if(u>=1)ball.catchFrom=null;
    }
    ball.vx=(h.x-ball.x)/dt;ball.vy=(h.y-ball.y)/dt;ball.vz=(h.z-ball.z)/dt;Object.assign(ball,h);
  }
  function pass(ball,p,to){
    const h=BayCourtPlayers.hand(p),t=clamp(Math.hypot(to.x-h.x,to.z-h.z)/8.5,.36,.93);
    Object.assign(ball,h,{state:"pass",shot:null,holder:null,to,age:0,vx:(to.x-h.x)/t,vz:(to.z-h.z)/t,
      vy:(to.y+1.18-h.y)/t+gravity*t*.5});
  }
  function shoot(b,site,p,aim,glass){
    const h=BayCourtPlayers.hand(p),start=art.local(site,h.x,h.z);
    const planar=Math.hypot(aim.u-start.u,aim.v-start.v),time=.79+Math.min(10,planar)*.048;
    const plane=-.38+r,reflect=.74;
    const offGlass=glass&&start.v>1.1,virtual=offGlass?plane-(aim.v-plane)/reflect:aim.v;
    const vv=(virtual-start.v)/time,touch=offGlass?(plane-start.v)/vv:time,left=time-touch;
    const vu=(aim.u-start.u)/(time-.04*left),world=velocity(site,vu,vv);
    const vy=(site.y+3.05-h.y+gravity*time*time*.5-.02*gravity*touch*left)/(time-.02*left);
    const range=Math.hypot(p.x-site.x,p.z-site.z);
    Object.assign(b,h,{vx:world.x,vy,vz:world.z,state:"flight",holder:null,age:0,to:null,
      shot:{shooter:p,range,value:range>=6.25?2:1,
        board:false,rim:false,made:false,glass:offGlass}});
  }
  function rimContact(b,site,q){
    const d=Math.hypot(q.u,q.v);if(d<.0001)return false;
    const lip=velocity(site,q.u/d*rim,q.v/d*rim);
    const dx=b.x-(site.x+lip.x),dy=b.y-(site.y+3.05),dz=b.z-(site.z+lip.z);
    const l=Math.hypot(dx,dy,dz),over=r+wire-l;if(over<=0||l<1e-7)return false;
    const nx=dx/l,ny=dy/l,nz=dz/l,speed=b.vx*nx+b.vy*ny+b.vz*nz;
    b.x+=nx*over;b.y+=ny*over;b.z+=nz*over;
    if(speed>=0)return false;
    b.vx=(b.vx-1.62*speed*nx)*.91;b.vy=(b.vy-1.62*speed*ny)*.91;b.vz=(b.vz-1.62*speed*nz)*.91;return true;
  }
  function step(b,site,dt,event){
    if(b.state==="held"){heldPose(b,dt);return;}
    const pieces=Math.ceil(dt/(1/150)),d=dt/pieces,c=Math.cos(site.yaw),s=Math.sin(site.yaw);
    for(let i=0;i<pieces;i++){
      const oldY=b.y,oldX=b.x,oldZ=b.z;b.age+=d;
      b.x+=b.vx*d;b.z+=b.vz*d;b.y+=b.vy*d-gravity*d*d*.5;b.vy-=gravity*d;
      b.spin+=(1.4+Math.hypot(b.vx,b.vz)*1.28)*d;
      let q=art.local(site,b.x,b.z),h=b.y-site.y;
      if(Math.abs(q.u)<1.02&&h>2.74-r&&h<3.80+r){
        const lastV=(oldX-site.x)*s+(oldZ-site.z)*c,vv=b.vx*s+b.vz*c;
        const front=-.38+r,back=-.45-r;
        if(vv<0&&lastV>=front&&q.v<=front||vv>0&&lastV<=back&&q.v>=back){
          const hit=vv<0?front:back,vu=(b.vx*c-b.vz*s)*.96,delta=hit-q.v;
          b.x+=s*delta;b.z+=c*delta;const out=velocity(site,vu,-vv*.74);b.vx=out.x;b.vz=out.z;b.vy*=.98;
          if(b.shot)b.shot.board=true;event("glass",b.shot);q=art.local(site,b.x,b.z);
        }
      }
      if(Math.abs(h-3.05)<r+wire+.015&&Math.hypot(q.u,q.v)<rim+r+wire&&rimContact(b,site,q)){
        if(b.shot)b.shot.rim=true;event("rim",b.shot);
      }
      const hoop=site.y+3.05;
      if(b.shot&&!b.shot.made&&oldY>=hoop&&b.y<hoop){
        const u=(oldY-hoop)/(oldY-b.y),x=oldX+(b.x-oldX)*u,z=oldZ+(b.z-oldZ)*u;
        if(Math.hypot(x-site.x,z-site.z)<.2286-r+.013){
          b.shot.made=true;b.vx*=.48;b.vz*=.48;b.vy*=.74;event("basket",b.shot);
        }
      }
      if(b.y<=site.y+r){
        b.y=site.y+r;
        if(b.vy<-.80){b.vy=-b.vy*.68;b.vx*=.83;b.vz*=.83;event("bounce",b.shot);}
        else{b.vy=0;const f=Math.exp(-1.94*d);b.vx*=f;b.vz*=f;}
        if(b.state==="flight"&&!b.shot?.made){b.state="loose";event("miss",b.shot);}
        else if(b.state==="pass"&&b.age>1.3){b.state="loose";b.to=null;}
      }
      // Fences keep a loose ball available even when it takes a hard carom behind the backboard.
      q=art.local(site,b.x,b.z);
      const u=clamp(q.u,-8.90,7.48-r),v=clamp(q.v,-2.25+r,12.15);
      if(u!==q.u||v!==q.v){
        const at=art.worldPoint(site,u,v),vu=b.vx*c-b.vz*s,vv=b.vx*s+b.vz*c;
        const rebound=velocity(site,u===q.u?vu:-vu*.49,v===q.v?vv:-vv*.49);
        b.x=at.x;b.z=at.z;b.vx=rebound.x;b.vz=rebound.z;
        event("line",b.shot);
      }
    }
  }
  function landing(b,site){
    const t=clamp((b.vy+Math.sqrt(Math.max(0,b.vy*b.vy+2*gravity*(b.y-site.y-.85))))/gravity,0,1.3);
    const q=art.local(site,b.x+b.vx*t,b.z+b.vz*t);return art.worldPoint(site,clamp(q.u,-8.4,7.15),clamp(q.v,-1.75,11.7));
  }
  window.BayCourtBall={radius:r,hold,loose,pass,shoot,step,landing};
})();
