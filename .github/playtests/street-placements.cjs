// Count the actual uploads, including first writes to the resident region,
// on two renders of the same street, camera and poses.
module.exports=function streetPlacements(view,items,draw,pixels){
  const batch=view.streetBatch,gl=view.gl,base=batch.residentBase,upload=gl.bufferSubData;
  const sides=[...new Set(items.map(item=>view.models.get(item[0])).filter(Boolean))].map(m=>[m,m.wantedSide,m.exterior]);
  const detail=batch.distanceDetail,build=batch.buildDetail,element=gl.drawElements;
  const stats=[{vertexBytes:0,indexBytes:0,indices:0},{vertexBytes:0,indexBytes:0,indices:0}];
  let collecting=null,comparison,hits=0;
  function pass(keep,sample){
    return function(){
      for(const [model,wanted,exterior] of sides){model.wantedSide=wanted;model.exterior=exterior;}
      batch.residentBase=keep?function(vertices){
        const known=this.buffers[this.nextBuffer].placements.has(vertices),address=base.call(this,vertices);
        if(sample&&known&&address>=0)hits++;return address;
      }:()=>-1;
      collecting=sample?stats[Number(keep)]:null;
      draw.call(view,items);collecting=null;
    };
  }
  try{
    batch.distanceDetail=function(...args){this.buildDetail=false;return detail.apply(this,args);};
    gl.bufferSubData=function(target,offset,data){
      if(collecting)collecting[target===gl.ARRAY_BUFFER?"vertexBytes":"indexBytes"]+=data.byteLength;
      return upload.call(this,target,offset,data);
    };
    gl.drawElements=function(...args){if(collecting)collecting.indices+=args[1];return element.apply(this,args);};
    for(let i=0;i<6;i++){
      const keep=i%2===0;
      comparison=pixels(view,items,pass(keep,i>=2),pass(!keep,i>=2),true);
      if(comparison.changed)break;
    }
    return {streamed:stats[0],retained:stats[1],hits,pixels:comparison};
  }finally{
    batch.residentBase=base;batch.distanceDetail=detail;batch.buildDetail=build;
    gl.bufferSubData=upload;gl.drawElements=element;view.bound=null;
  }
};
