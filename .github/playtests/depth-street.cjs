// Timings include the additional draw and its index update, as well as lighting all visible geometry.
module.exports=function depthStreet(view,items,pixels){
  const gl=view.gl,batch=view.streetBatch,frame=view.streetFrame,savedScale=view.scale;
  const detail=batch.distanceDetail,wasPrimed=view.primeDepth,read=new Uint8Array(4),reports=[];
  const frames=[["outside",frame],["wet night",{...frame,night:.92,rain:.68,wet:.95,noon:0,timed:true}]];
  try{
    view.scale=.64;batch.distanceDetail=function(...args){this.buildDetail=false;return detail.apply(this,args);};
    for(const [weather,test] of frames){
      gl.useProgram(view.program);view.streetFrame=test;view.setFrameUniforms(view.u,test);
      const timings=[[],[]],draw=(prime,measure)=>function(){
        view.primeDepth=prime;gl.finish();const start=performance.now();
        view.draw("city");view.drawOpaque(items);gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,read);
        if(measure)timings[Number(prime)].push(performance.now()-start);
      };
      let comparison;
      for(let i=0;i<9;i++){
        const first=i%2===0;comparison=pixels(view,[],draw(first,i>1),draw(!first,i>1),true);
      }
      const city=view.models.get("city").cityList;
      reports.push({weather,triangles:city.largeFaces.count/3,visible:city.count/3,
        ms:timings.map(a=>a.sort((x,y)=>x-y)[a.length>>1]),pixels:comparison});
    }
    return reports;
  }finally{
    view.primeDepth=wasPrimed;batch.distanceDetail=detail;view.streetFrame=frame;view.scale=savedScale;
    gl.useProgram(view.program);view.setFrameUniforms(view.u,frame);view.bound=null;
  }
};
