module.exports=function sidewalkPrints(draw){
  const canvas=document.createElement("canvas");canvas.width=360;canvas.height=224;
  const c=canvas.getContext("2d",{willReadFrequently:true}),shapes=[0,0],times=[[],[]];
  const fill=c.fill.bind(c);let which=0,count=false;
  c.fill=function(){if(count)shapes[which]++;return fill();};
  function paint(low,moving,gesture=0){
    c.clearRect(0,0,canvas.width,canvas.height);which=Number(low);
    for(let i=0;i<80;i++){
      const p={yaw:i*.54,skin:i%2?"#a66f55":"#b58265",shirt:i%3?"#67847e":"#ab785e",stride:moving?Math.sin(i+.1):0,gesture};
      draw(c,p,16+(i%12)*29,14+Math.floor(i/12)*30,[5.8,8,11,15][i%4],false,.43,false,low);
    }
  }
  function pixels(low,moving,gesture){paint(low,moving,gesture);return c.getImageData(0,0,canvas.width,canvas.height).data;}
  function compare(a,b){
    let ink=0,error=0,overlap=0,changed=0;
    for(let i=0;i<a.length;i+=4){
      if(a[i+3]<64&&b[i+3]<64)continue;ink++;if(a[i+3]>=64&&b[i+3]>=64)overlap++;
      for(let k=0;k<4;k++)if(a[i+k]!==b[i+k])changed++;
      for(let k=0;k<3;k++)error+=Math.abs(a[i+k]*a[i+3]/255-b[i+k]*b[i+3]/255);
    }
    return {ink,overlap:overlap/ink,meanError:error/(3*ink),changed};
  }
  const poses=[];
  for(const moving of [false,true]){
    pixels(true,moving);shapes.fill(0);count=true;
    const match=compare(pixels(false,moving),pixels(true,moving));
    count=false;poses.push({...match,fills:shapes.slice()});
  }
  const walking=compare(pixels(true,false),pixels(true,true)).changed;
  const gestures=compare(pixels(false,true,4),pixels(true,true,4)).changed;
  for(let i=0;i<16;i++){const low=[0,3].includes(i%4),start=performance.now();
    for(let j=0;j<5;j++){paint(low,true);c.getImageData(0,0,1,1);}
    if(i>=4)times[Number(low)].push((performance.now()-start)/5);
  }
  return {poses,walking,gestures,medianMs:times.map(r=>r.sort((a,b)=>a-b)[r.length>>1])};
};
