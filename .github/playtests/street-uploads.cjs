// Capture one real submission list. Mesh selection can change between two
// traversals of the same objects when a repeated camera side becomes eligible.
function freezeStreet(view,items,drawBatch){
  const b=view.streetBatch,commands=[],draw=view.draw,flush=b.flush;
  const hadDraw=Object.hasOwn(view,"draw");
  try{
    b.flush=function(){
      if(!this.count)return;
      commands.push({positions:this.vertexWords.slice(0,this.used*6),indices:this.indices.slice(0,this.count),glow:this.glow});
      this.used=this.count=0;
    };
    view.draw=(...args)=>commands.push({args});
    drawBatch.call(view,items);
  }finally{
    b.flush=flush;if(hadDraw)view.draw=draw;else delete view.draw;
  }
  function replay(){
    for(const cmd of commands){
      if(cmd.args){draw.apply(view,cmd.args);continue;}
      b.vertexWords.set(cmd.positions);b.indices.set(cmd.indices);
      b.used=cmd.positions.length/6;b.count=cmd.indices.length;b.glow=cmd.glow;
      flush.call(b);
    }
  }
  return {replay,batches:commands.filter(c=>c.indices).length};
}
module.exports=function streetUploads(view,items,drawBatch,pixels,freeze){
  const {replay,batches}=freeze(view,items,drawBatch);
  const b=view.streetBatch,upload=b.uploadStream,buffers=b.buffers,single=[buffers[0]];
  function fullUpload(target,source,length,history){
    view.gl.bufferSubData(target,0,source.subarray(0,length));history.known=0;
  }
  try{
    // streetPixels renders its reference first. Exercise retained dirty ranges
    // on the warmed ring before the full replacement invalidates each slot.
    const reference=pixels(view,items,()=>{b.uploadStream=fullUpload;try{replay();}finally{b.uploadStream=upload;}},replay,true);
    const ring=pixels(view,items,replay,()=>{b.buffers=single;b.nextBuffer=0;try{replay();}finally{b.buffers=buffers;b.nextBuffer=0;}});
    return {reference,image:ring,batches};
  }finally{b.buffers=buffers;b.nextBuffer=0;b.uploadStream=upload;}
};
module.exports.freeze=freezeStreet;
