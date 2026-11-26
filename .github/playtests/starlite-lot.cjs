module.exports=function lotInk(){
  const out=[];
  for(const [scale,angle,lit] of [[6.6,.42,false],[13,-.31,true]]){
    const w=310,h=280,site=BayStarlite.site;
    function shot(low){
      const canvas=new OffscreenCanvas(w,h),c=canvas.getContext("2d"),counts={paths:0,images:0};
      for(const op of ["fill","stroke","fillRect","drawImage"]){
        const f=c[op];c[op]=function(...args){counts[op==="drawImage"?"images":"paths"]++;return f.apply(this,args);};
      }
      c.translate(w/2,h/2);c.rotate(angle);
      BayStarliteArt.overhead(c,()=>0,()=>0,scale,site,0,lit,null,null,false,low);
      return {data:c.getImageData(0,0,w,h).data,counts};
    }
    const a=shot(false),b=shot(true);let pixels=0,overlap=0,error=0;
    for(let i=0;i<a.data.length;i+=4){
      const l=a.data[i+3],r=b.data[i+3];if(l>127||r>127)pixels++;if(l>127&&r>127)overlap++;
      for(let j=0;j<3;j++)error+=Math.abs(a.data[i+j]*l-b.data[i+j]*r)/255;
    }
    out.push({scale,overlap:overlap/pixels,error:error/(3*pixels),original:a.counts,cached:b.counts});
  }
  return out;
};
