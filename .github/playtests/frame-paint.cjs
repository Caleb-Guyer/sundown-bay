// Both programs use the same depth, surface textures and triangle stream.
module.exports=function framePaint(view,items,pixels){
  const gl=view.gl,world=view.streetSurface,model=view.modelSurface,frame=view.streetFrame;
  const batch=view.streetBatch,detail=batch.distanceDetail,scale=view.scale,read=new Uint8Array(4);
  if(!world.paint||!model.paint)throw Error("The hosted WebGL driver fell back to per-pixel paint");
  const previousWorld=view.createStreetSurface(false,false),previousModel=view.createStreetSurface(true,false);
  const tests=[
    ["street",frame],
    ["rain",{...frame,night:.43,rain:.68,wet:.93,noon:.28,timed:true,lamp:{x:frame.x,z:frame.z,yaw:view.basis.camera.yaw}}],
    ["night",{...frame,night:1,rain:0,wet:.36,noon:0,timed:true,shadow:0}]
  ];
  const reports=[];
  try{
    view.scale=.64;batch.distanceDetail=function(...args){this.buildDetail=false;return detail.apply(this,args);};
    for(const [weather,f] of tests){
      gl.useProgram(view.program);view.streetFrame=f;view.setFrameUniforms(view.u,f);
      const timings=[[],[]];let image;
      const draw=(current,measure)=>function(){
        view.streetSurface=current?world:previousWorld;view.modelSurface=current?model:previousModel;
        gl.finish();const start=performance.now();
        view.draw("city");view.drawOpaque(items);
        gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,read);
        if(measure)timings[+current].push(performance.now()-start);
      };
      for(let pass=0;pass<9;pass++){
        const first=pass%2===0;
        image=pixels(view,[],draw(first,pass>=2),draw(!first,pass>=2),true);
      }
      const median=times=>times.sort((a,b)=>a-b)[times.length>>1];
      reports.push({weather,ms:timings.map(median),pixels:image});
    }
    return reports;
  }finally{
    view.streetSurface=world;view.modelSurface=model;view.streetFrame=frame;view.scale=scale;batch.distanceDetail=detail;
    gl.useProgram(view.program);view.setFrameUniforms(view.u,frame);view.bound=null;
    gl.deleteProgram(previousWorld.program);gl.deleteProgram(previousModel.program);
  }
};
