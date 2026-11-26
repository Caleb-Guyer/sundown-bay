// Run after the uninterrupted one-minute benchmark. Alternate the full renderer
// along the same drive, and replay one live map state through both painters.
module.exports=function trafficDrive(q){
  const drawMap=window.drawBayMap,drawCar=BayMapTraffic.draw,intervals=[[],[]],submit=[[],[]],counts=[0,0];
  let frame=0,active=0,isStreet=false,previous=0,metres=0,last=null,match;
  const midpoint=a=>{const s=[...a].sort((x,y)=>x-y);return s[s.length>>1];};
  BayMapTraffic.draw=function(c,v,x,y,s,t,low){
    const painted=drawCar(c,v,x,y,s,t,isStreet&&active===0?false:low);
    if(isStreet&&painted)counts[active]++;
    return painted;
  };
  window.drawBayMap=function(c,opt){
    if(opt.mode!=="street")return drawMap.apply(this,arguments);
    const now=performance.now(),i=frame%8;
    if(frame>16&&i>1)intervals[active].push(now-previous);
    previous=now;
    active=[0,1,1,0][Math.floor(frame/8)%4];isStreet=true;
    const begin=performance.now();
    const result=drawMap(c,opt);
    if(frame>=16&&i>0)submit[active].push(performance.now()-begin);
    const car=opt.streetCar;
    if(car&&last)metres+=Math.hypot(car.x-last.x,car.z-last.z);
    if(car)last={x:car.x,z:car.z};
    if(++frame===160){
      // Force the GPU work to finish on a disposable target. Keep both the
      // render mode and the target identical across the paired exposures.
      const surface=new OffscreenCanvas(c.canvas.width,c.canvas.height),ink=surface.getContext("2d");
      const probe=new OffscreenCanvas(1,1).getContext("2d",{willReadFrequently:true}),ms=[[],[]];
      for(let n=0;n<10;n++){
        active=[0,1,1,0][n%4];const tick=performance.now();drawMap(ink,opt);
        const bitmap=surface.transferToImageBitmap();probe.drawImage(bitmap,0,0,1,1);probe.getImageData(0,0,1,1);
        bitmap.close();if(n>=2)ms[active].push(performance.now()-tick);
      }
      match=ms.map(midpoint);
      window.drawBayMap=drawMap;BayMapTraffic.draw=drawCar;q.driving=false;
      q.trafficDrive={frames:intervals.map(a=>a.length),frameMs:intervals.map(midpoint),submitMs:submit.map(midpoint),
        sameViewMs:match,cached:counts[1],metres:Math.round(metres)};
    }
    isStreet=false;return result;
  };
};
