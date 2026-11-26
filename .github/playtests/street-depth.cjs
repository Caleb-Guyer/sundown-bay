// Time the same city and water from the same camera. Both passes use the original paint program.
module.exports=function compareStreetDepth(view,pixels){
  const gl=view.gl,read=new Uint8Array(4),times=[[],[]],scale=view.scale;
  const original=view.prepaintCity,low=gl.getUniform(view.program,view.u.lowDetail);
  let indices=0,comparison;
  function render(enabled,measure){
    return ()=>{
      view.prepaintCity=enabled?function(list,model){indices=list.depthCount;original.call(this,list,model);}:()=>{};
      gl.finish();const before=performance.now();
      view.drawCityAndWater(17);
      gl.readPixels(0,0,1,1,gl.RGBA,gl.UNSIGNED_BYTE,read);
      if(measure)times[Number(enabled)].push(performance.now()-before);
    };
  }
  try{
    view.scale=.64;gl.uniform1f(view.u.lowDetail,1);
    for(let i=0;i<9;i++){
      const fast=i%2===1;
      comparison=pixels(view,[],render(fast,i>=2),render(!fast,i>=2),true);
      if(comparison.changed)break;
    }
    return {indices,ms:times.map(a=>a.sort((x,y)=>x-y)[a.length>>1]),pixels:comparison};
  }finally{view.prepaintCity=original;view.scale=scale;view.bound=null;gl.uniform1f(view.u.lowDetail,low);}
};
