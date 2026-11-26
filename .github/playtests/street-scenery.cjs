// Compare two renderings of the same live artwork, including oblique camera angles.
module.exports=function compareStreetScenery(){
  const results=[],size=300,mid=size/2;
  function compare(name,scale,bearing,draw){
    function render(lowDetail){
      const canvas=document.createElement("canvas");canvas.width=canvas.height=size;
      const c=canvas.getContext("2d",{willReadFrequently:true});let calls=0;
      for(const k of ["drawImage","fill","stroke","fillRect","strokeRect","fillText"]){
        const fn=c[k];c[k]=function(...args){calls++;return fn.apply(this,args);};
      }
      c.translate(mid+.21,mid-.34);c.rotate(bearing);c.lineJoin="round";
      draw(c,lowDetail);return {image:c.getImageData(0,0,size,size).data,calls};
    }
    const old=render(false),now=render(true);let shared=0,union=0,ink=0,error=0;
    for(let i=0;i<old.image.length;i+=4){
      const a=old.image[i+3]/255,b=now.image[i+3]/255;
      if(a>.5||b>.5)union++;if(a>.5&&b>.5)shared++;ink+=a;
      for(let k=0;k<3;k++)error+=Math.abs(old.image[i+k]*a-now.image[i+k]*b);
    }
    results.push({name,scale,bearing,ink:Math.round(ink),overlap:shared/union,error:error/(3*ink),from:old.calls,to:now.calls});
  }
  for(const [scale,bearing,open] of [[4,.35,false],[9,-1.1,true]]){
    const station={mode:"street",player:open?BayBrisas.site.nico:{x:100,z:15},brisas:{lights:open?[1,0,1]:[]}};
    compare("Brisas",scale,bearing,(c,lowDetail)=>BayBrisas.map(c,{...station,lowDetail},x=>(x-120)*scale,z=>(57-z)*scale,scale,()=>true));
    const service={completed:open?3:0,mags:{id:"mags",x:173.8,z:106.07,yaw:0,phase:"punch",phaseAge:open?1.44:.07},people:[]};
    compare("ticket booth",scale,bearing,(c,lowDetail)=>BayBoardwalkArt.map(c,{mode:"street",boardwalk:service,lowDetail,weather:{night:open?1:0}},x=>(x-172)*scale,z=>(106-z)*scale,scale,(x,y)=>Math.hypot(x,y)<size/2));
    const wheel={angle:open?Math.PI/4:0,stopped:true,loading:open?7:0,gateOpen:1,seats:[]};
    compare("stopped wheel",scale,bearing,(c,lowDetail)=>BayCoastWheelArt.map(c,{mode:"street",wheel,lowDetail,weather:{night:open?.8:0}},x=>(x-183)*scale,z=>(112-z)*scale,scale,()=>true));
    const v={kind:"solena",color:open?"#805980":"#c59c5b",yaw:open?-1.57:.27,hydraulic:{rest:true},brakes:open?1:0};
    compare("parked Solena",scale,bearing,(c,lowDetail)=>BayMapTraffic.draw(c,v,0,0,scale,0,lowDetail));
    const cab={kind:"cab",color:"#cb973a",yaw:.85,brakes:open?1:0};
    compare("cab",scale,bearing,(c,lowDetail)=>BayMapTraffic.draw(c,cab,0,0,scale,0,lowDetail));
  }
  return results;
};
