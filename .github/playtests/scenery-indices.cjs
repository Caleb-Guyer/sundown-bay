module.exports=function sceneryIndexProof(view,draws,q,compare){
  const gl=view.gl,oldScale=view.scale,sampling=q.samples,one=new Uint8Array(4);
  const times=[[],[]],counts=[],runs=[],models=draws.map(([name])=>view.models.get(name));
  const toggle=enabled=>{for(const model of models)model.worldSections=!!enabled;};
  const submit=(enabled,pass)=>()=>{
    toggle(enabled);q.samples=true;
    const v=q.vertices||0,r=(q.ranges||0)+(q.calls||0);
    gl.finish();const t=performance.now();
    for(const args of draws)view.draw(...args);
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,one);
    if(pass)times[enabled].push(performance.now()-t);
    counts[enabled]=q.vertices-v;runs[enabled]=(q.ranges||0)+(q.calls||0)-r;
    q.samples=false;
  };
  try{
    view.scale=.64;
    for(let i=0;i<models.length;i++)if(!models[i].distanceReady)view.prepareDistanceMesh(models[i],view.cpu.get(draws[i][0]));
    let pixels;
    for(let i=0;i<7;i++)pixels=compare(view,[],submit(i%2,i),submit(1-i%2,i),true);
    return {draws:draws.map(a=>a[0]),counts,runs,timedMs:times.map(a=>a.sort((x,y)=>x-y)[a.length>>1]),pixels};
  }finally{toggle(true);view.scale=oldScale;q.samples=sampling;view.bound=null;}
};
