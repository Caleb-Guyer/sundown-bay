module.exports=function driveInProjection(){
  const results=[];
  for(const displayed of [48,91]){
    const w=Math.ceil(displayed),h=Math.round(displayed*.37);
    const outputs=[0,1].map(()=>new OffscreenCanvas(w,h).getContext("2d",{willReadFrequently:true}));
    const projectors=[new BayStarlite.Theatre(),new BayStarlite.Theatre()],times=[[],[]];
    const paths=[0,0];
    projectors.forEach((p,i)=>{
      p.canvas=document.createElement("canvas");
      const c=p.canvas.getContext("2d");
      for(const method of ["fill","stroke"]){
        const draw=c[method];c[method]=function(...args){paths[i]++;return draw.apply(this,args);};
      }
    });
    let error=0,channels=0,distinct=0,previous=null;
    for(let i=0;i<36;i++){
      const frames=[];
      for(const v of (i%4===1||i%4===2?[1,0]:[0,1])){
        const p=projectors[v],c=outputs[v];p.clock=(i%3)*5.4+Math.floor(i/3)*.17+.31;
        const begin=performance.now(),film=p.frame({},"coast",v?displayed:undefined);
        c.drawImage(film,0,0,w,h);frames[v]=c.getImageData(0,0,w,h).data;
        if(i>=3)times[v].push(performance.now()-begin);
      }
      for(let j=0;j<frames[0].length;j+=4)for(let k=j;k<j+3;k++){error+=Math.abs(frames[0][k]-frames[1][k]);channels++;}
      if(previous&&previous.some((value,j)=>value!==frames[1][j]))distinct++;
      previous=frames[1];
    }
    const p=projectors[1],widths=projectors.map(t=>t.canvas.width),version=p.version;
    p.frame({},"coast",displayed);const reused=p.version===version;
    p.visit={bay:2};const seated=p.frame({},"coast",displayed).width;
    results.push({displayed,widths,seated,reused,distinct,paths,meanError:error/channels,ms:times.map(a=>{
      a.sort((x,y)=>x-y);return [a[a.length>>1],a[Math.floor(a.length*.95)]];})});
  }
  return results;
};
