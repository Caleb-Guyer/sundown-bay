/* Table space is measured in playfield units. Positive Y runs down the glass. */
(() => {
  "use strict";
  const site={x:-28,z:9.95,name:"Needle Drop · Tideway Arcade",kind:"pinball"};
  const stops=[[76,115,"SOL","#f3b253"],[184,100,"MAREA","#75c4c1"],[137,176,"BREAKER","#ec8280"]];
  const walls=[[10,63,29,33],[29,33,69,14],[69,14,214,14],[214,14,253,29],[253,29,289,70],
    [289,70,289,420],[265,85,265,422],[10,63,10,275],[10,275,24,300],[24,300,66,346],
    [265,265,248,303],[248,303,212,346],[37,236,52,268],[52,268,83,294],[83,294,37,236],
    [233,228,222,266],[222,266,195,292],[195,292,233,228]];
  const posts=[[35,202,6],[242,185,6],[95,52,4],[154,48,4]];
  const origin=[69,211],arm=57,rest=.40,raised=-.57,ballRadius=5;
  const key="sundownBay.needleDrop.v1";
  function book(){
    let r;try{r=JSON.parse(localStorage.getItem(key));}catch{}
    return {best:Number.isSafeInteger(r?.best)&&r.best>0?r.best:0,by:r?.by==="Frankie Prado"?"Frankie Prado":"Marlin driver"};
  }
  function store(score,by){
    const r=book();if(score<=r.best)return r;
    const record={best:score,by};try{localStorage.setItem(key,JSON.stringify(record));}catch{}return record;
  }
  function tip(i,a){const dir=i?-1:1;return [origin[i]+dir*arm*Math.cos(a),354+arm*Math.sin(a)];}
  // A moving flipper transfers the normal component of the surface velocity to the ball.
  function contact(b,ax,ay,bx,by,r,bounce,speed=0,side=1){
    const dx=bx-ax,dy=by-ay,len=dx*dx+dy*dy;
    const u=len?Math.max(0,Math.min(1,((b.x-ax)*dx+(b.y-ay)*dy)/len)):0;
    const x=ax+u*dx,y=ay+u*dy,nx=b.x-x,ny=b.y-y,d=Math.hypot(nx,ny);
    if(d>=r+ballRadius)return false;
    const ux=d?nx/d:0,uy=d?ny/d:-1;
    b.x=x+ux*(r+ballRadius+.035);b.y=y+uy*(r+ballRadius+.035);
    const approach=(b.vx+speed*(y-ay)*side)*ux+(b.vy-speed*(x-ax)*side)*uy;
    if(approach>=0)return false;
    b.vx-=(1+bounce)*approach*ux;b.vy-=(1+bounce)*approach*uy;return true;
  }
  class Table{
    constructor(by,playSide){
      this.by=by;this.playSide=playSide;this.record=book();this.flippers=[rest,rest];this.pulse=[0,0,0];
      this.score=0;this.ball=1;this.banks=0;this.lit=0;this.time=0;this.flash=0;this.side=null;this.remainder=0;this.serve();
    }
    serve(){this.phase="ready";this.charge=0;this.held=false;this.gate=false;this.tilt=false;this.bumps=[];this.body={x:277,y:393,vx:0,vy:0};}
    nudge(){
      if(this.phase!=="live"||this.tilt)return;
      this.bumps=this.bumps.filter(t=>this.time-t<4);this.bumps.push(this.time);
      if(this.bumps.length===3){this.tilt=true;return;}
      this.body.vx+=this.body.x<140?76:-76;this.body.vy-=66;
    }
    strike(i){
      this.pulse[i]=.18;this.score+=this.lit&(1<<i)?65:150;this.lit|=1<<i;
      if(this.lit===7){
        this.banks++;this.score+=750;this.lit=0;this.flash=1.4;
        this.phase="pick";
      }
    }
    step(delta,left,right,plunge){
      this.remainder+=Math.min(.10,Math.max(0,delta));
      while(this.remainder+1e-9>=1/180){this.advance(1/180,left,right,plunge);this.remainder-=1/180;}
    }
    advance(dt,left,right,plunge){
      this.time+=dt;this.flash=Math.max(0,this.flash-dt);
      for(let i=0;i<3;i++)this.pulse[i]=Math.max(0,this.pulse[i]-dt);
      const b=this.body;
      if(this.phase==="drain"){
        if((this.wait-=dt)<=0){
          if(this.ball===3){this.phase="over";this.record=store(this.score,this.by);}
          else{this.ball++;this.serve();}
        }
        return;
      }
      if(this.phase==="over"||this.phase==="pick")return;
      if(this.phase==="ready"){
        if(plunge){this.held=true;this.charge=Math.min(1,this.charge+dt*1.12);b.y=393+this.charge*10;}
        else if(this.held){this.phase="live";b.vy=-(510+this.charge*225);this.held=false;}
      }
      if(this.phase==="live"){
        b.vx*=Math.exp(-.075*dt);b.vy+=338*dt;b.x+=b.vx*dt;b.y+=b.vy*dt;
        for(const w of walls)contact(b,...w,1.6,.78);
        if(b.x<261&&b.y<82)this.gate=true;
        if(this.gate)contact(b,264,84,289,62,1.4,.51);
        for(const [x,y,r] of posts)contact(b,x,y,x,y,r,.96);
        for(let i=0;i<stops.length;i++){
          const [x,y]=stops[i];
          if(!contact(b,x,y,x,y,17,.91))continue;
          const dx=b.x-x,dy=b.y-y,len=Math.hypot(dx,dy);
          b.vx+=dx/len*155+dy/len*(i%2?19:-19);b.vy+=dy/len*155;
          if(!this.tilt&&this.pulse[i]===0)this.strike(i);
        }
      }
      for(let i=0;i<2;i++){
        const down=!this.tilt&&(i?right:left),a=this.flippers[i],target=down?raised:rest;
        const q=a+Math.max(-12*dt,Math.min(8*dt,target-a));this.flippers[i]=q;
        if(this.phase!=="live")continue;
        const [x,y]=tip(i,q);
        if(contact(b,origin[i],354,x,y,4.8,.72,(q-a)/dt,i?-1:1)&&down&&q<a)this.score+=10;
      }
      if(this.phase!=="live")return;
      const speed=Math.hypot(b.vx,b.vy);
      if(speed>810){b.vx*=810/speed;b.vy*=810/speed;}
      if(b.x>265&&b.y>395&&b.vy>0){this.serve();return;}
      if(b.y>416||b.x<0||b.x>302){this.phase="drain";this.wait=.85;}
    }
    cueSide(){
      if(this.phase!=="pick")return false;
      this.side=this.playSide();this.phase="live";this.flash=1.4;return true;
    }
  }
  const sideKey="sundownBay.needleSide.v1";
  function lastSide(){
    try{const s=JSON.parse(localStorage.getItem(sideKey));if(s&&Object.hasOwn(BayAirwaves.records,s.id)&&Number.isFinite(s.at)&&s.at>=0)return {id:s.id,at:s.at};}catch{}
    return null;
  }
  function playSide(id,at){
    const side={id,at};try{localStorage.setItem(sideKey,JSON.stringify(side));}catch{}return side;
  }
  window.BayNeedle={site,stops,walls,posts,origin,tip,book,sideKey,scoreKey:key,lastSide,playSide,Table};
})();
