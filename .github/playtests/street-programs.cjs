exports.street=function streetPrograms(view,items,draw,freeze,pixels){
  const gl=view.gl,use=gl.useProgram,frozen=freeze(view,items,draw),binds=[],restored=[];
  function replay(hold){
    return function(){
      let calls=0;
      gl.useProgram=function(program){calls++;use.call(this,program);};
      view.inStreetList=hold;
      try{frozen.replay();}
      finally{
        view.inStreetList=false;
        if(view.listProgram)view.restoreStreetProgram();
        gl.useProgram=use;
      }
      binds.push(calls);restored.push(gl.getParameter(gl.CURRENT_PROGRAM)===view.program);
    };
  }
  const image=pixels(view,items,replay(true),replay(false),true);
  return {binds,restored,image,batches:frozen.batches};
};

exports.sun=function sunPrograms(view,weather,dusk,update){
  const gl=view.gl,city=view.models.get("city"),mesh=city.sunMesh,target=view.sunTarget;
  const viewport=gl.getParameter(gl.VIEWPORT),clear=gl.getParameter(gl.COLOR_CLEAR_VALUE);
  function depth(shape){
    city.sunMesh=shape;view.sunKey=null;update.call(view,weather,dusk);
    gl.bindFramebuffer(gl.FRAMEBUFFER,target.fbo);
    const result=new Uint8Array(target.sz*target.sz*4);
    gl.readPixels(0,0,target.sz,target.sz,gl.RGBA,gl.UNSIGNED_BYTE,result);
    gl.bindFramebuffer(gl.FRAMEBUFFER,null);return result;
  }
  try{
    const before=depth(city),after=depth(mesh);
    let painted=0,changed=0;
    for(let i=0;i<before.length;i+=4){
      if(before[i]!==255||before[i+1]!==255)painted++;
      if(before[i]!==after[i]||before[i+1]!==after[i+1])changed++;
    }
    return {vertices:[city.vertexCount,mesh.vertexCount],vertexBytes:[city.vertexCount*24,mesh.vertexCount*12],painted,changed};
  }finally{
    city.sunMesh=mesh;gl.bindFramebuffer(gl.FRAMEBUFFER,null);
    gl.viewport(...viewport);gl.clearColor(...clear);view.bound=null;
  }
};
