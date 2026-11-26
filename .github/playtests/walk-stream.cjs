// Compare the same moving walker in the batched and individual WebGL paths.
module.exports=function walkStream(view,row,pixels,drawList){
  const name=row[0],mesh=view.models.get(name),data=view.cpu.get(name);
  if(!mesh?.packedPose)return null;
  const expanded=new Float32Array(mesh.count*6);
  for(let i=0;i<mesh.indices.length;i++){
    const p=mesh.indices[i]*6;expanded.set(data.subarray(p,p+6),i*6);
  }
  const probe="comparison/unpacked-walker",ref=[probe,...row.slice(1)];
  view.add(probe,{vertices:expanded},true);
  try{
    const batch=pixels(view,[row],()=>drawList.call(view,[row]),()=>drawList.call(view,[ref]),true);
    const single=pixels(view,[row],()=>view.draw(...row),()=>view.draw(...ref),true);
    return {corners:mesh.count,vertices:mesh.vertexCount,batch,single};
  }finally{
    view.gl.deleteBuffer(view.models.get(probe).buf);view.animated.delete(probe);
    view.cpu.delete(probe);view.models.delete(probe);view.bound=null;
  }
};
