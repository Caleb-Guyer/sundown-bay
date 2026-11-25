// Reproduce the previous centre-plane sphere test on the same camera and
// opaque draw list. The finished colour target includes the blocking buildings.
module.exports=function compareStreetWalls(view,items,pixels,q){
  const gl=view.gl,v=view.basis,eye=v.camera,old=[],current=view.streetWalls,hidden=view.streetHidden;
  for(const b of view.buildings){
    const x=b.x-eye.x,y=b.y-eye.y,z=b.z-eye.z;
    if(Math.abs(x)>100||Math.abs(z)>100||Math.abs(x)<b.hw&&Math.abs(z)<b.hd||
      (x*v.sn+z*v.cs)*v.cp+y*v.sp+Math.hypot(b.hw,b.hh,b.hd)<0)continue;
    old.push({x,y,z,hw:b.hw,hh:b.hh,hd:b.hd,across:Math.abs(x)*b.hd>Math.abs(z)*b.hw});
  }
  function prior(x,y,z,hw,hh,hd,r,depth){
    if(depth<=12)return false;
    for(const b of old){
      const t=b.across?b.x/x:b.z/z;if(!(t>0&&t<1))continue;
      const span=r*t;
      if(Math.abs(y*t-b.y)+span<b.hh&&Math.abs(x*t-b.x)+span<b.hw&&Math.abs(z*t-b.z)+span<b.hd)return true;
    }
    return false;
  }
  const detail=view.streetBatch.distanceDetail,sampling=q.samples,read=new Uint8Array(4);
  const counts=[0,0],times=[[],[]];let image;
  function pass(enabled,record){return function(){
    view.streetHidden=enabled?hidden:prior;view.streetWalls=enabled?current:old;
    q.samples=true;const before=q.vertices;
    gl.finish();const start=performance.now();view.draw("city");view.drawOpaque(items);
    gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,read);
    if(record)times[enabled].push(performance.now()-start);
    counts[enabled]=q.vertices-before;q.samples=sampling;
  };}
  try{
    view.streetBatch.distanceDetail=function(...args){this.buildDetail=false;return detail.apply(this,args);};
    for(let i=0;i<8;i++){const first=i%2;image=pixels(view,[],pass(first,i>=2),pass(1-first,i>=2),true);}
    return {counts,ms:times.map(t=>t.sort((a,b)=>a-b)[t.length>>1]),pixels:image};
  }finally{
    view.streetBatch.distanceDetail=detail;view.streetHidden=hidden;view.streetWalls=current;q.samples=sampling;view.bound=null;
  }
};
