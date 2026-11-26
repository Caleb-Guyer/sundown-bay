// Compare the actual two Canvas 2D traffic painters on the same headings and trim.
module.exports=function trafficPrints(){
  const sheet=document.createElement("canvas");sheet.width=552;sheet.height=368;
  const c=sheet.getContext("2d",{willReadFrequently:true}),rows=[],times=[[],[]];
  for(const kind of ["coupe","cab","van","hatch","cayo","marea","estate","stepside"]){
    for(let i=0;i<6;i++)rows.push({kind,color:i%2?"#5c8188":"#aa6357",brakes:i%3===0?1:0,yaw:i*.81});
  }
  function paint(cached){
    c.clearRect(0,0,sheet.width,sheet.height);c.lineJoin="round";
    let hits=0;
    for(let i=0;i<rows.length;i++){
      const v=rows[i],x=36+i%8*68,y=32+Math.floor(i/8)*60;
      if(BayMapTraffic.draw(c,v,x,y,[2.1,2.94,4.2,7.5,11,9][i%6],0,cached))hits++;
    }
    return hits;
  }
  paint(false);const a=c.getImageData(0,0,sheet.width,sheet.height).data;
  const hits=paint(true),b=c.getImageData(0,0,sheet.width,sheet.height).data;
  let intersection=0,union=0,err=0;
  for(let i=0;i<a.length;i+=4){
    if(a[i+3]<80&&b[i+3]<80)continue;
    union++;if(a[i+3]>=80&&b[i+3]>=80)intersection++;
    for(let k=0;k<3;k++)err+=Math.abs(a[i+k]*a[i+3]/255-b[i+k]*b[i+3]/255);
  }
  const poses=[{damage:{front:.7}},{flatSide:1},{doorAngle:.4},{passengerDoor:.7},{steer:.28},{reversing:true},{indicator:1},{hornAt:-.1}];
  const live=poses.map(p=>!BayMapTraffic.draw(c,{...rows[0],...p},24,24,7,0,true));
  for(let i=0;i<14;i++){
    const variant=i%4===0||i%4===3?1:0,start=performance.now();
    for(let j=0;j<4;j++){paint(!!variant);c.getImageData(0,0,1,1);}
    if(i>1)times[variant].push((performance.now()-start)/4);
  }
  return {cars:hits,overlap:intersection/union,error:err/(union*3),live:live.every(Boolean),
    milliseconds:times.map(row=>row.sort((a,b)=>a-b)[row.length>>1])};
};
