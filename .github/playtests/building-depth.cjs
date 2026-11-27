// Draw exactly the same city, water and frozen car/pedestrian list through both paths.
module.exports=function buildingDepth(view,items,pixels,freeze){
  const gl=view.gl,times=[[],[]],read=new Uint8Array(4);
  const {replay}=freeze(view,items,view.drawOpaque);
  let faces=0,image;
  function pass(enabled,measure){return ()=>{
    gl.finish();const start=performance.now();
    if(enabled)faces=view.primeBuildingDepth();
    view.draw("city");
    gl.depthFunc(gl.LESS);view.drawWater(12);gl.depthFunc(gl.LEQUAL);
    replay();gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,read);
    if(measure)times[+enabled].push(performance.now()-start);
  };}
  for(let i=0;i<10;i++){
    const first=i%2===0;
    image=pixels(view,[],pass(first,i>=2),pass(!first,i>=2),true);
  }
  return {faces,ms:times.map(a=>a.sort((x,y)=>x-y)[a.length>>1]),pixels:image};
};
