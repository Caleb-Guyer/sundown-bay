// Compare the two painters at the same wheel angle, with occupied cars and a moving gate.
module.exports=function compareWheel(){
  const w=400,h=400,results=[];
  for(const [scale,angle,open,night] of [[3.8,.15,0,0],[6,.86,1,.92],[13,1.3,.55,.64],[17,2.1,.2,.9]]){
    function render(lowDetail){
      const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
      const c=canvas.getContext("2d",{willReadFrequently:true}),calls={drawImage:0,fill:0,stroke:0};
      for(const name of Object.keys(calls)){
        const original=c[name];c[name]=function(...args){calls[name]++;return original.apply(this,args);};
      }
      const wheel={angle,loading:2,gateOpen:open,seats:[[null,"player"],null,["mags"],null,["visitor"]]};
      const draw=()=>BayCoastWheelArt.map(c,{mode:"street",wheel,time:3,weather:{night},lowDetail},
        x=>w/2+(x-183)*scale,z=>h/2-(z-113)*scale,scale,()=>true);
      draw();const counts={...calls},buffer=c.getImageData(0,0,w,h).data;
      const start=performance.now();
      for(let n=0;n<12;n++){wheel.angle+=.02;c.clearRect(0,0,w,h);draw();}
      c.getImageData(w/2,h/2,1,1);
      return {counts,buffer,ms:performance.now()-start};
    }
    const a=render(false),b=render(true);
    let shared=0,union=0,error=0;
    for(let i=0;i<a.buffer.length;i+=4){
      const aa=a.buffer[i+3],ba=b.buffer[i+3];
      if(aa>127||ba>127)union++;if(aa>127&&ba>127)shared++;
      for(let k=0;k<3;k++)error+=Math.abs(a.buffer[i+k]*aa-b.buffer[i+k]*ba)/255;
    }
    results.push({scale,overlap:shared/union,error:error/(3*union),original:a.counts,cached:b.counts,directMs:a.ms,cachedMs:b.ms});
  }
  return results;
};
