// Replay the same overhead camera, light and moving birds through both roof render paths.
module.exports=function compareMotelRoof(){
  const w=400,h=320;
  const results=[];
  for(const [scale,angle,time] of [[6.5,.42,3],[10,-.73,9],[16,0,21]]){
    function render(lowDetail){
      const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
      const c=canvas.getContext("2d",{willReadFrequently:true});
      const calls={drawImage:0,fill:0,stroke:0,fillRect:0};
      for(const name of Object.keys(calls)){
        const orig=c[name];c[name]=function(...args){calls[name]++;return orig.apply(this,args);};
      }
      c.translate(w/2,h/2);c.rotate(angle);c.translate(-w/2,-h/2);
      const draw=()=>BayMarlinRoofArt.map(c,{mode:"street",lowDetail,time},x=>w/2+(x-115)*scale,z=>h/2-(z+35)*scale,scale,()=>true);
      draw();const counts={...calls};
      const buffer=c.getImageData(0,0,w,h).data;
      const start=performance.now();
      for(let i=0;i<12;i++){c.clearRect(-w,-h,3*w,3*h);draw();}
      c.getImageData(w/2,h/2,1,1);
      return {buffer,counts,ms:performance.now()-start};
    }
    const a=render(false),b=render(true);let union=0,shared=0,error=0;
    for(let i=0;i<a.buffer.length;i+=4){
      const aa=a.buffer[i+3],ba=b.buffer[i+3];
      if(aa>127||ba>127)union++;if(aa>127&&ba>127)shared++;
      for(let k=0;k<3;k++)error+=Math.abs(a.buffer[i+k]*aa-b.buffer[i+k]*ba)/255;
    }
    results.push({scale,overlap:shared/union,meanChannelError:error/(3*union),
      original:a.counts,cached:b.counts,directMs:a.ms,cachedMs:b.ms});
  }
  return results;
};
