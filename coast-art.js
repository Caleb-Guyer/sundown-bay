/* Street lamps share their positions between the flat overhead painting and the 3D light map. */
(() => {
  "use strict";
  const axes=[-144,-72,0,72,144],lights=[];
  function pool(x,z,rx,rz,r,g,b){
    lights.push({x,z,rx,rz,r,g,b});
  }
  for(const x of axes)for(const z of axes){
    if((x+z)%144===0)pool(x-6.98,z+8.8,6.4,7.7,238,179,97);
  }
  for(const [x,z] of [[8.7,-33],[8.7,28],[8.7,109],[134.8,88],[-61.6,-113],[-63,38],[-134.5,-106]]){
    pool(x-1.52,z,6.4,7.7,203,204,151);
  }
  // Storefront spill falls under the actual eaves facing the sidewalk.
  pool(8.1,44,5.6,10.9,244,125,82);
  pool(133.7,-29.1,6.7,10,68,194,169);
  pool(134,29.8,6.3,12.4,236,124,104);
  pool(-109,-7.3,7.2,4.9,94,210,180);
  pool(-35.9,-134,12.3,5.2,248,157,91);
  const extent=464,textureSize=256;
  let pixels=null;
  function lightTexture(){
    if(pixels)return {pixels,size:textureSize};
    pixels=new Uint8Array(textureSize*textureSize*4);
    const scale=textureSize/extent;
    for(const lamp of lights.concat(window.BayCourtPlaces?.lightPools||[])){
      const cx=(lamp.x+extent/2)*scale-.5,cy=(lamp.z+extent/2)*scale-.5;
      const rx=lamp.rx*scale,ry=lamp.rz*scale;
      for(let iy=Math.max(0,Math.floor(cy-ry));iy<=Math.min(textureSize-1,Math.ceil(cy+ry));iy++){
        for(let ix=Math.max(0,Math.floor(cx-rx));ix<=Math.min(textureSize-1,Math.ceil(cx+rx));ix++){
          const dx=(ix-cx)/rx,dy=(iy-cy)/ry,d=dx*dx+dy*dy;
          if(d>=1)continue;
          const fall=(1-d)**2,i=(iy*textureSize+ix)*4;
          pixels[i]=Math.min(255,pixels[i]+lamp.r*fall);
          pixels[i+1]=Math.min(255,pixels[i+1]+lamp.g*fall);
          pixels[i+2]=Math.min(255,pixels[i+2]+lamp.b*fall);
          pixels[i+3]=255;
        }
      }
    }
    return {pixels,size:textureSize};
  }

  // Drainage depressions run along the edges of the existing asphalt strips.
  const drains=[];
  for(let road=0;road<axes.length;road++)for(let block=0;block<5;block++){
    const bend=(road*17+block*31)%13,along=axes[block]+(block===4?-1:1)*(16+bend);
    const side=(road+block)%2?1:-1;
    drains.push({x:axes[road]+side*(4.3+bend*.06),z:along,across:false,length:5+bend*.36});
    if(along<143)drains.push({x:along,z:axes[road]-side*4.9,across:true,length:6+bend*.28});
  }
  let poolSprite=null;
  function lightSprite(){
    if(poolSprite)return poolSprite;
    const c=document.createElement("canvas");c.width=c.height=64;
    const g=c.getContext("2d"),a=g.createRadialGradient(32,32,0,32,32,32);
    a.addColorStop(0,"rgba(251,214,144,.74)");a.addColorStop(.4,"rgba(242,194,118,.42)");
    a.addColorStop(.76,"rgba(224,170,107,.12)");a.addColorStop(1,"rgba(218,169,124,0)");
    g.fillStyle=a;g.fillRect(0,0,64,64);poolSprite=c;return c;
  }
  function mapSurface(ctx,opt,px,py,visible){
    const weather=opt.weather;if(!weather)return;
    const s=opt.scale,night=Math.max(opt.dusk||0,weather.night||0),wet=weather.wet||0,rain=weather.rain||0;
    const minute=weather.minute,morning=Math.max(0,1-Math.abs(minute-385)/120);
    const sunset=Math.max(0,1-Math.abs(minute-1080)/115);
    ctx.save();
    if(rain>.015||morning>.02||sunset>.02){
      ctx.save();ctx.setTransform(1,0,0,1,0,0);
      if(morning>.02||sunset>.02){
        ctx.fillStyle=sunset>morning?"#ed975c":"#9be3cf";
        ctx.globalAlpha=Math.max(sunset*.115,morning*.085);ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);
      }
      if(rain>.015){ctx.fillStyle="#364e5b";ctx.globalAlpha=rain*.20;ctx.fillRect(0,0,ctx.canvas.width,ctx.canvas.height);}
      ctx.restore();
    }
    if(wet>.025){
      ctx.lineWidth=Math.max(.6,s*.075);
      for(const drain of drains){
        const x=px(drain.x),y=py(drain.z);
        if(!visible(x,y,drain.length*s))continue;
        ctx.save();ctx.translate(x,y);if(drain.across)ctx.rotate(Math.PI/2);ctx.scale(s,s);
        const len=drain.length;
        ctx.fillStyle=night>.55?"#9cb5b8":"#adc5ca";ctx.globalAlpha=wet*(.2+night*.08);
        ctx.beginPath();ctx.moveTo(-.42,-len*.5);ctx.bezierCurveTo(.16,-len*.68,.62,-len*.24,.65,-len*.08);
        ctx.bezierCurveTo(.24,.77,.45,len*.27,.02,len*.53);ctx.bezierCurveTo(-.34,len*.55,-.7,len*.21,-.49,.4);
        ctx.bezierCurveTo(-.34,-.68,-.76,-len*.27,-.42,-len*.5);ctx.fill();
        ctx.globalAlpha=wet*.35;ctx.fillRect(-.20,-len*.24,.085,len*.29);ctx.restore();
      }
    }
    if(night>.025){
      const sprite=lightSprite();ctx.globalAlpha=night*(.41+.26*wet);
      for(const lamp of lights){
        const x=px(lamp.x),y=py(lamp.z);
        if(visible(x,y,lamp.rz*s))ctx.drawImage(sprite,x-lamp.rx*s,y-lamp.rz*s,lamp.rx*s*2,lamp.rz*s*2);
      }
    }
    opt.roadLights?.drawMap(ctx,px,py,s);
    ctx.restore();
  }

  let lastCanvas=null,lastPaint=-1,lastYaw=0,rainX=0,hidden=true;
  const streaks=Array.from({length:132},(_,i)=>({
    x:((i*73+13)%139)/139,y:((i*47+7)%137)/137,depth:.52+((i*17)%23)/20
  }));
  function rain(canvas,weather,t,overhead=false,yaw=0){
    if(!canvas)return;
    const amount=weather?.rain||0;
    if(amount<.025){
      if(!hidden||!canvas.hidden)canvas.hidden=true;
      hidden=true;return;
    }
    if(lastCanvas!==canvas){lastCanvas=canvas;lastPaint=-1;hidden=true;}
    const w=Math.max(2,Math.round(innerWidth*.68)),h=Math.max(2,Math.round(innerHeight*.68));
    if(!hidden&&Math.abs(t-lastPaint)<.033&&w===canvas.width&&h===canvas.height)return;
    if(hidden){lastYaw=yaw;rainX=0;canvas.hidden=false;hidden=false;}
    const drift=yaw-lastYaw;rainX-=Math.atan2(Math.sin(drift),Math.cos(drift))*.22;lastYaw=yaw;
    lastPaint=t;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const g=canvas.getContext("2d");if(!g)return;
    g.clearRect(0,0,w,h);const unit=h/510,worldWind=Math.sin(yaw+.7),slant=(overhead?-.31:-.34)+worldWind*.15;
    const count=Math.min(streaks.length,Math.ceil((14+110*amount)*Math.max(.7,Math.min(1.28,w/h*.55))));
    for(let layer=0;layer<3;layer++){
      g.lineWidth=Math.max(.65,(.64+layer*.28)*unit);g.strokeStyle=layer===2?"#e5efeb":"#c1dfeb";
      g.globalAlpha=amount*(.18+layer*.10);g.beginPath();
      for(let i=layer;i<count;i+=3){
        const drop=streaks[i],rate=drop.depth*(overhead?.54:.79);
        const ix=drop.x+rainX*drop.depth+t*slant*.21*drop.depth,iy=drop.y+t*rate;
        const x=(ix-Math.floor(ix))*w,y=(iy-Math.floor(iy))*(h+20)-10;
        const len=(overhead?5:8)*unit*drop.depth*(1+layer*.29);
        g.moveTo(x,y);g.lineTo(x+slant*len,y+len);
      }
      g.stroke();
    }
    g.globalAlpha=1;
  }
  window.BayCoastArt={lightTexture,mapSurface,rain};
})();
