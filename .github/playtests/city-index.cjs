// Compare both submissions with the same live camera and lighting. This runs
// outside the timed drive. readPixels waits for the software GPU to finish.
module.exports=function cityIndexProof(view,q,pixels){
  const gl=view.gl,model=view.models.get("city"),savedScale=view.scale,wasSampling=q.samples;
  const times=[[],[]],counts=[],ranges=[];let comparison;
  const submit=(enabled,pass)=>function(){
    model.city=!!enabled;q.samples=true;
    const indices=q.vertices,runs=(q.ranges||0)+(q.calls||0);
    gl.finish();const start=performance.now();view.draw("city");
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    if(pass)times[enabled].push(performance.now()-start);
    counts[enabled]=q.vertices-indices;ranges[enabled]=(q.ranges||0)+(q.calls||0)-runs;
    q.samples=false;
  };
  const pixel=new Uint8Array(4);
  try{
    view.scale=.64;
    if(!model.distanceReady)view.prepareDistanceMesh(model,view.cpu.get("city"));
    for(let pass=0;pass<7;pass++){
      const first=pass%2;comparison=pixels(view,[],submit(1-first,pass),submit(first,pass));
    }
    return {counts,ranges,timedMs:times.map(a=>a.sort((x,y)=>x-y)[a.length>>1]),pixels:comparison};
  }finally{model.city=true;view.scale=savedScale;q.samples=wasSampling;view.bound=null;}
};
