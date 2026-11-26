// Replay one real draw list, including every flush and change of base vertex.
module.exports=function compareBatch(batch,calls){
  const baseline=new Uint16Array(batch.indices.length),times=[[],[]];
  function plain(source,base,at,count){
    for(let i=0;i<count;i++)baseline[at+i]=base+(source?source[i]:i);
  }
  let elements=0;
  for(const c of calls){
    plain(...c);batch.writeIndices(...c);
    const end=c[2]+c[3];
    for(let i=c[2];i<end;i++)if(baseline[i]!==batch.indices[i])throw Error("Street triangle order changed");
    elements+=c[3];
  }
  for(let pass=0;pass<28;pass++){
    const optimized=pass%4===1||pass%4===2,start=performance.now();
    for(let repeat=0;repeat<5;repeat++){
      if(optimized){for(const c of calls)batch.writeIndices(...c);}
      else for(const c of calls)plain(...c);
    }
    if(pass>=4)times[+optimized].push((performance.now()-start)/5);
  }
  return {meshes:calls.length,elements,copyBytes:batch.indexBytes,
    medianMs:times.map(values=>values.sort((a,b)=>a-b)[Math.floor(values.length/2)])};
};
