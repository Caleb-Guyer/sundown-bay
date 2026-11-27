module.exports=function crowdMotion(){
  const motion=new BayPlayerMotion(),meshes=["driver","photographer","local"].map(role=>new BayPlayerMesh(["#976948","#5f7773","#455865"],role));
  BayScoutArt.dress(meshes[1]);
  function previous(mesh,plan){
    const src=mesh.rest,dst=mesh.vertices;
    for(const i of plan.unique){
      const j=i*6,{a,b,t}=mesh.bindings[i],x=src[j],y=src[j+1],z=src[j+2];
      for(let n=0;n<3;n++){
        const k=n*4,first=a[k]*x+a[k+1]*y+a[k+2]*z+a[k+3];
        dst[j+n]=t?first+(b[k]*x+b[k+1]*y+b[k+2]*z+b[k+3]-first)*t:first;
      }
    }
    for(let k=0;k<plan.copies.length;k+=2){
      const to=plan.copies[k],from=plan.copies[k+1];
      dst[to]=dst[from];dst[to+1]=dst[from+1];dst[to+2]=dst[from+2];
    }
  }
  const plans=meshes.map(mesh=>{
    const plan=mesh.skinPlan();return {...plan,unique:plan.unique.slice().sort()};
  });
  let compared=0,worst=0;
  for(let frame=0;frame<84;frame++){
    motion.step(1/60,frame<24?0:frame<58?.055:.12,.2*Math.sin(frame*.09));
    motion.handTarget=frame>42?{x:.33,y:1.2+.4*Math.sin(frame*.19),z:.33,weight:.85}:null;
    meshes.forEach((mesh,i)=>{
      mesh.update(motion,true);previous(mesh,plans[i]);const reference=mesh.vertices.slice();
      mesh.skin();
      for(let k=0;k<reference.length;k++){
        worst=Math.max(worst,Math.abs(mesh.vertices[k]-reference[k]));compared++;
      }
    });
  }
  return {compared,worst,jointGroups:meshes.map(m=>m.skinPlan().runs.length),points:plans.map(p=>p.unique.length)};
};
