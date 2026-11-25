// Both paths draw the same city and live prop list into an RGBA8 target at
// gameplay resolution. Finish each pass before recording its elapsed time.
module.exports=function compareSurface(view,items,pixels){
  const gl=view.gl,original=view.beginStreetSurface,batch=view.streetBatch,detail=batch.distanceDetail;
  const times=[[],[]],pixel=new Uint8Array(4),oldScale=view.scale,low=gl.getUniform(view.program,view.u.lowDetail);
  const frame=view.streetFrame,draw=view.drawOpaque,median=a=>a.sort((x,y)=>x-y)[a.length>>1];
  let comparisons=[],litCalls=0,modelCalls=0;
  const pass=(fast,record)=>function(){
    view.beginStreetSurface=fast?function(...args){const used=original.apply(this,args);if(used)litCalls++;return used;}:()=>false;
    gl.finish();const start=performance.now();view.draw("city");draw.call(view,items);
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
    if(record)times[+fast].push(performance.now()-start);
  };
  try{
    view.scale=.64;gl.uniform1f(view.u.lowDetail,1);
    batch.distanceDetail=function(...args){this.buildDetail=false;return detail.apply(this,args);};
    for(let i=0;i<8;i++){
      const fast=i%2===0;const image=pixels(view,[],pass(fast,i>1),pass(!fast,i>1),true);
      if(i===7)comparisons.push(image);
    }
    // Dawn shadows, wet asphalt and the fallback player's lamps all use the
    // same frame inputs as the test camera. Exercise rain even on a dry run.
    view.streetFrame={...frame,night:.76,rain:.64,wet:.92,noon:0,timed:true,
      lamp:{x:frame.x,z:frame.z,yaw:view.basis.camera.yaw},skyR:.43,skyG:.48,skyB:.53};
    view.setFrameUniforms(view.u,view.streetFrame);
    comparisons.push(pixels(view,[],pass(true,false),pass(false,false),true));
    const directTimes=[[],[]];
    const direct=(fast,record)=>function(){
      view.beginStreetSurface=function(glow,modelSpace){
        if(modelSpace&&!fast)return false;
        const used=original.call(this,glow,modelSpace);if(used&&modelSpace)modelCalls++;return used;
      };
      gl.finish();const start=performance.now();
      for(const item of items)view.draw(...item);
      gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
      if(record)directTimes[+fast].push(performance.now()-start);
    };
    let directPixels;
    for(let i=0;i<6;i++){
      const fast=i%2===0,pair=pixels(view,[],direct(fast,i>1),direct(!fast,i>1),true);
      if(i===5)directPixels=pair;
    }
    // Change only the target resolution. Both sizes render the same geometry,
    // textures, camera and time of day with the production opaque shaders.
    view.beginStreetSurface=original;
    const widths=[.64,.46].map(scale=>Math.round(view.canvas.width*scale/oldScale)),sizeTimes=[[],[]];
    function timedSize(tier,record){return function(){
      gl.finish();const start=performance.now();
      view.draw("city");draw.call(view,items);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,pixel);
      if(record)sizeTimes[tier].push(performance.now()-start);
    };}
    for(let i=0;i<6;i++)for(const tier of (i%2?[1,0]:[0,1])){
      const render=timedSize(tier,i>0);pixels(view,[],render,render,widths[tier]);
    }
    return {timedMs:times.map(median),directMs:directTimes.map(median),directPixels,litCalls,modelCalls,
      widths,sizeMs:sizeTimes.map(median),width:view.canvas.width,height:view.canvas.height,comparisons};
  }finally{
    view.beginStreetSurface=original;batch.distanceDetail=detail;view.streetFrame=frame;
    view.scale=oldScale;gl.useProgram(view.program);gl.uniform1f(view.u.lowDetail,low);view.setFrameUniforms(view.u,frame);view.bound=null;
  }
};
