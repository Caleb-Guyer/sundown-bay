// Compare the retained block against a fresh paint at the identical world pose.
module.exports=function groundWindow(groundPatch){
  function layer(roofs){
    const density=roofs?2.25:3.5,canvas=new OffscreenCanvas(Math.ceil(524*density),Math.ceil(458*density));
    const c=canvas.getContext("2d");
    if(!roofs){c.fillStyle="#b29e80";c.fillRect(0,0,canvas.width,canvas.height);}
    c.fillStyle=roofs?"#68847a":"#677383";
    for(let i=0;i<canvas.width;i+=41)c.fillRect(i,i%7,roofs?2:4,canvas.height-8);
    return canvas.transferToImageBitmap();
  }
  function pixels(p){
    const c=new OffscreenCanvas(p.image.width,p.image.height).getContext("2d");
    c.drawImage(p.image,0,0);return c.getImageData(0,0,p.image.width,p.image.height).data;
  }
  const base=layer(false),roofs=layer(true),results=[];
  const solids=[{x:60,z:40,w:12,d:14,top:35},{x:95,z:65,w:10,d:6,top:20}];
  const signals=[{x:90,z:59},{x:32,z:64}];
  for(const dusk of [0,1]){
    const opt={scale:7.4,solids:[...solids],signals,dusk,weather:{sun:{dx:.65,dz:.4,strength:.8},rain:0},cx:0,cz:0};
    const first=groundPatch(opt,base,roofs,48,29);
    opt.cx=73;opt.cz=60;
    const warm=groundPatch(opt,base,roofs,48,29);
    const cold=groundPatch({...opt,solids:[...solids]},base,roofs,48,29);
    if(warm===first||warm.left!==cold.left||warm.top!==cold.top)throw Error("Missing block transition");
    const a=pixels(warm),b=pixels(cold);let changed=0,total=0;
    for(let i=0;i<a.length;i+=4){
      let worst=0;for(let k=0;k<4;k++)worst=Math.max(worst,Math.abs(a[i+k]-b[i+k]));
      total+=worst;if(worst>8)changed++;
    }
    results.push({dusk,pixels:a.length/4,changed,meanError:total/(a.length/4)});
    warm.image.close();cold.image.close();
  }
  base.close();roofs.close();return results;
};
