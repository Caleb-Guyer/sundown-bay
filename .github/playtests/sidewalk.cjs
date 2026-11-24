// Plan short sidewalk legs around the street geometry returned by the map. Only
// keyboard input moves the player. A moving runner can change our target each leg.
function nextStep(at,target,r,map){
  const {solids,cars}=map,scale=.8;
  const blockers=solids.filter(o=>Math.abs(o.x-at.x)<65+o.w/2&&Math.abs(o.z-at.z)<90+o.d/2);
  const vehicles=cars.filter(o=>Math.abs(o.x-at.x)<65&&Math.abs(o.z-at.z)<90);
  const clear=(x,z)=>!blockers.some(o=>Math.abs(x-o.x)<o.w/2+.51&&Math.abs(z-o.z)<o.d/2+.51)
    &&!vehicles.some(o=>Math.abs(x-o.x)<5&&Math.abs(z-o.z)<5&&BayDriving.clearance(o,{x,z})<.43);
  const dist=(x,z)=>Math.hypot(target.x-x,target.z-z);
  const open=[{i:0,j:0,x:at.x,z:at.z,cost:0,score:dist(at.x,at.z),prev:null}],best=new Map([["0:0",0]]);
  for(let n=0;n<2100&&open.length;n++){
    let idx=0;for(let i=1;i<open.length;i++)if(open[i].score<open[idx].score)idx=i;
    const node=open[idx];open[idx]=open.at(-1);open.pop();
    if(node.prev&&dist(node.x,node.z)<r){
      let q=node;while(q.prev?.prev&&Math.hypot(q.x-at.x,q.z-at.z)>2.55)q=q.prev;
      // Tight corners require keeping the first bend rather than cutting the diagonal.
      while(q.prev?.prev&&(!clear(at.x+(q.x-at.x)/2,at.z+(q.z-at.z)/2)||!clear(at.x+(q.x-at.x)*.75,at.z+(q.z-at.z)*.75)))q=q.prev;
      return q;
    }
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
      const i=node.i+di,j=node.j+dj,x=at.x+i*scale,z=at.z+j*scale,id=i+":"+j,cost=node.cost+Math.hypot(di,dj)*scale;
      if(cost>=(best.get(id)??Infinity)||!clear(x,z)||di&&dj&&(!clear(node.x,z)||!clear(x,node.z)))continue;
      best.set(id,cost);open.push({i,j,x,z,cost,score:cost+dist(x,z)*1.14,prev:node});
    }
  }
  return target;
}
module.exports=nextStep;
