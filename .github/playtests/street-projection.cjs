// Read the actual WebGL screen face, including texture filtering and an oblique approach.
module.exports=function streetProjection(view){
  const gl=view.gl,site=BayStarlite.site,art=BayStarliteArt,projector=new BayStarlite.Theatre();
  const saved=view.basis.camera,scale=view.scale,shots=[];
  const model=(name,build)=>{if(!view.models.has(name)){const g=new BayMesh();build(g);view.add(name,g);}};
  art.world([],model,site,0,false,null);
  const origin={x:site.x,y:site.y+3.60,z:site.z+9.89};
  function eye(dx,dz,away=false){
    return {x:origin.x+dx,y:origin.y,z:origin.z+dz,yaw:Math.atan2(-dx,-dz)+(away?Math.PI:0),pitch:0,focal:1.5};
  }
  const screen=()=>{const c=view.canvas,pixels=new Uint8Array(c.width*c.height*4);
    gl.readPixels(0,0,c.width,c.height,gl.RGBA,gl.UNSIGNED_BYTE,pixels);return pixels;};
  try{
    view.scale=.55;
    for(const angle of [[0,-56],[14,-31],[0,-8]]){
      const camera=eye(...angle);view.begin(camera);const width=art.projectedWidth(view,site),images=[],widths=[];
      for(const sample of [undefined,width]){
        view.begin(camera);const source=projector.frame({},"coast",sample);widths.push(source.width);
        art.screen(view,site,source,projector.version);images.push(screen());
      }
      let painted=0,error=0,coverage=0;
      for(let j=0;j<images[0].length;j+=4){
        const a=images[0],b=images[1];if(a[j+3]!==b[j+3])coverage++;
        if(a[j+3]){painted++;for(let k=j;k<j+3;k++)error+=Math.abs(a[k]-b[k]);}
      }
      shots.push({width,widths,painted,coverage,error:error/(3*painted)});
    }
    view.begin(eye(0,-48,true));const away=art.projectedWidth(view,site);
    const slot=view.printSlots.find(s=>s.source===projector.canvas),old=slot.revision;
    art.screen(view,site,projector.canvas,old+1);const noUpload=slot.revision===old;
    view.begin(eye(0,-48));art.screen(view,site,projector.canvas,old+1);const uploaded=slot.revision===old+1;
    view.begin(eye(0,25));const rear=art.projectedWidth(view,site);
    return {shots,away,rear,noUpload,uploaded};
  }finally{view.scale=scale;view.begin(saved);}
};
