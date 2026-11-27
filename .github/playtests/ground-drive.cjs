// Both streets share the same full-resolution art, camera path, lighting and output canvas.
module.exports=function groundDrive(original,retained,map){
  const base=retained.image(map.solids,true),roofs=retained.image(map.solids,true,true);
  const canvas=new OffscreenCanvas(416,256),ctx=canvas.getContext("2d",{willReadFrequently:true});
  const options=[0,1].map(()=>({solids:map.solids,signals:map.signals,scale:5.1,dusk:.06}));
  const times=[[],[]],builds=[0,0],seen=[null,null];
  let maxError=0,painted=0;
  for(let i=0;i<68;i++){
    const sun=BayHours.sunlight(1022+i*.31);
    const x=i<34?144:144-(i-34)*4.05,z=i<34?-134+i*3.95:0;
    const frames=[];
    for(const v of (i%4===0||i%4===3?[0,1]:[1,0])){
      const o=options[v];Object.assign(o,{cx:x,cz:z,weather:{sun,rain:0}});
      const before=performance.now(),p=(v?retained:original).patch(o,base,roofs,42,27);
      const built=p!==seen[v];if(built)builds[v]++;seen[v]=p;
      const d=p.density;ctx.clearRect(0,0,416,256);
      ctx.drawImage(p.image,(x-p.left)*d-40*d,(p.top-z)*d-25*d,80*d,50*d,0,0,416,256);
      const data=ctx.getImageData(0,0,416,256).data;
      if(i>=4)times[v].push(performance.now()-before);
      frames[v]=data;
    }
    for(let j=0;j<frames[0].length;j++){
      maxError=Math.max(maxError,Math.abs(frames[0][j]-frames[1][j]));
      if(j%4===3&&frames[0][j])painted++;
    }
  }
  return {builds,painted,maxError,ms:times.map(a=>{a.sort((x,y)=>x-y);return [a[a.length>>1],a[Math.floor(a.length*.95)],a.reduce((x,y)=>x+y,0)/a.length];})};
};
