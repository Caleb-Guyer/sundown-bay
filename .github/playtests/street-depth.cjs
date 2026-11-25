// Alternate the original draw and the depth pass in one frozen street frame.
// Render into a full-resolution colour and depth target with the live driver.
module.exports=function streetDepth(view,items,pixels){
  const gl=view.gl,prime=view.primeStreetDepth,batch=view.streetBatch,detail=batch.distanceDetail;
  const times=[[],[]],read=new Uint8Array(4),scale=view.scale;
  let image,submitted=0,shaded=0;
  const draw=(useDepth,record)=>function(){
    view.primeStreetDepth=useDepth?function(list,model){
      submitted=list.depthCount;shaded=list.count;return prime.call(this,list,model);
    }:()=>{};
    gl.finish();const start=performance.now();
    view.draw("city");view.drawOpaque(items);
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,read);
    if(record)times[+useDepth].push(performance.now()-start);
  };
  try{
    if(!view.streetDepth)throw Error("Depth program failed to link");
    view.scale=.64;
    batch.distanceDetail=function(...args){this.buildDetail=false;return detail.apply(this,args);};
    for(let pass=0;pass<9;pass++){
      const first=pass%2===0;
      image=pixels(view,[],draw(first,pass>=2),draw(!first,pass>=2),true);
    }
    return {submitted,shaded,ms:times.map(a=>a.sort((l,r)=>l-r)[a.length>>1]),pixels:image};
  }finally{view.scale=scale;view.primeStreetDepth=prime;batch.distanceDetail=detail;view.bound=null;}
};
