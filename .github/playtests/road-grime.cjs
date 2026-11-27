module.exports=function roadGrime(){
  const canvas=document.createElement("canvas");canvas.width=canvas.height=130;
  const g=canvas.getContext("2d",{willReadFrequently:true}),paint=g.fill,blit=g.drawImage;
  let fills=0,images=0;
  g.fill=function(...a){fills++;return paint.apply(this,a);};
  g.drawImage=function(...a){images++;return blit.apply(this,a);};
  function draw(v,scale,low,offset=0){
    fills=images=0;g.clearRect(0,0,130,130);g.fillStyle=v.color;g.fillRect(0,0,130,130);
    BayRoadGlass.map(g,v,65.2+offset,64.8,scale,1,low);
    return {pixels:g.getImageData(0,0,130,130).data,fills,images};
  }
  let compared=0,removed=0,worst=0,changed=0;
  for(const kind of ["cab","hatch","van","wrecker","solena"]){
    const v={kind,yaw:0,color:"#ae6948",soil:[.9,.8,.65,1],rinse:[.3,.7,.4,.5]};
    for(const [stage,scale] of [[0,5],[1,11],[2,8],[3,13],[4,16],[5,9],[6,18]]){
      if(stage===1)v.yaw=1.38;
      if(stage===2)v.color="#417e8d";
      if(stage===3){v.damage={left:1,rear:.6};v.yaw=-.7;}
      if(stage===4){v.washCells=[[1,0,.5],[.3,0,1],[.8,.7,.3],[1,1,.4]];v.soil[0]=.5;v.rinse[2]=.9;}
      if(stage===5){v.doorSide=-1;v.doorAngle=.7;v.passengerDoor=.55;}
      const vector=draw(v,scale,false),first=draw(v,scale,true),second=draw(v,scale,true);
      if(stage!==1&&stage<5){if(!first.fills||first.images)throw Error("Stale car wash sheet at "+kind+"/"+stage);changed++;}
      if(stage<5){if(second.images!==1||second.fills)throw Error("Uncached closed panels");removed+=vector.fills;}
      else if(second.fills!==vector.fills||second.images)throw Error("Door or close-up flattened");
      let energy=0,difference=0;
      const bg=vector.pixels.slice(0,3);
      for(let i=0;i<vector.pixels.length;i+=4)for(let j=0;j<3;j++){
        energy+=Math.abs(vector.pixels[i+j]-bg[j]);
        difference+=Math.abs(vector.pixels[i+j]-second.pixels[i+j]);
      }
      if(!energy||stage>=5&&difference)throw Error("Missing or changed live dirt on "+kind);
      if(difference/energy>.34)throw Error("Road grime pixels on "+kind+"/"+stage+" differ by "+(difference/energy).toFixed(3));
      if(stage<5){
        const translated=draw(v,scale,true,2);
        if(translated.images!==1)throw Error("An integer camera translation repainted the panels");
        for(let i=0;i<second.pixels.length-8;i++)if(translated.pixels[i+8]!==second.pixels[i])throw Error("Misregistered moving panel on "+kind+"/"+stage);
        if(draw(v,scale,true,.48).images)throw Error("Reused a sheet at another subpixel position");
      }
      worst=Math.max(worst,difference/energy);compared++;
    }
  }
  return {compared,changed,removed,worst};
};
