// Replay the city's actual visibility queries from a frozen camera. Include
// rebuilding the index once per pass, as a moving camera must do each frame.
module.exports=function wallGridProof(view){
  const grid=view.wallGrid,walls=view.streetWalls,basis=view.basis;
  if(!grid||grid.walls!==walls||grid.basis!==basis)return {indexed:false,walls:walls?.length||0};
  const list=view.models.get("city").cityList,hidden=view.streetHidden,queries=[];
  try{
    view.streetHidden=(...args)=>{queries.push(args);return false;};
    for(const p of list.parts)view.inFrame(p.bounds,0,0,0,0,0,0);
  }finally{view.streetHidden=hidden;}
  const expected=new Uint8Array(queries.length),times=[[],[]];
  let hiddenCount=0,candidates=0;
  try{
    view.wallGrid=null;
    for(let i=0;i<queries.length;i++){
      const q=queries[i];expected[i]=+hidden.apply(view,q);hiddenCount+=expected[i];
      candidates+=grid.candidates(q[7],q[8],q[9]).length;
    }
    for(let pass=0;pass<20;pass++){
      const enabled=[0,3].includes(pass%4)?1:0;
      view.wallGrid=enabled?grid:null;
      const start=performance.now();
      if(enabled)grid.build(walls,basis);
      for(let i=0;i<queries.length;i++)
        if(+hidden.apply(view,queries[i])!==expected[i])throw Error("Wall grid changed visible city part "+i);
      if(pass>=4)times[enabled].push(performance.now()-start);
    }
  }finally{view.wallGrid=grid;}
  const median=a=>a.sort((x,y)=>x-y)[a.length>>1];
  return {indexed:true,walls:walls.length,queries:queries.length,hidden:hiddenCount,
    candidates:[queries.length*walls.length,candidates],medianMs:times.map(median)};
};
