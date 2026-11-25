// Compare the same city, water, and opaque props at the current camera pose.
module.exports=function compareCover(view,items,pixels){
  const gl=view.gl,draw=view.drawOpaque,read=new Uint8Array(4),times=[[],[]];
  const pass=(enabled,record)=>()=>{
    gl.finish();const start=performance.now();
    if(enabled)view.coverCity();
    view.draw("city");
    gl.depthFunc(gl.LESS);view.drawWater(16);gl.depthFunc(gl.LEQUAL);
    draw.call(view,items);
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,read);
    if(record)times[+enabled].push(performance.now()-start);
  };
  let image;
  for(let i=0;i<8;i++){
    const first=i%2===1;
    image=pixels(view,[],pass(first,i>=2),pass(!first,i>=2),true);
  }
  return {indices:view.models.get("city").coverCount,ms:times.map(a=>a.sort((x,y)=>x-y)[a.length>>1]),pixels:image};
};
