/* A shutter release copies the live game canvas. The same crop frames the HUD and the saved print. */
(() => {
  "use strict";
  const filmAspect=4/3,shotWidth=400,imageLimit=96000;
  const paper="#f1e5ca",ink="#233d3d",rule="#74796b",red="#984837";
  const prints=new WeakMap();
  const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
  const filmRatio=value=>Number.isFinite(value)&&value>=.5&&value<=2.5?value:filmAspect;

  function crop(width,height,aimX=.5,aimY=.5,aspect=filmAspect,fullFrame=false){
    const viewport=width>0&&height>0?width/height:filmAspect;
    const ratio=filmRatio(aspect);
    const w=fullFrame?Math.min(1,ratio/viewport):Math.min(.55,.73*ratio/viewport),h=w*viewport/ratio;
    const x=clamp(Number.isFinite(aimX)?aimX:.5,w/2,1-w/2)-w/2;
    const y=clamp(Number.isFinite(aimY)?aimY:.5,h/2,1-h/2)-h/2;
    return {x,y,w,h};
  }

  function score({crop:frame,rival,marquee,distance}={}){
    if(!frame||!(frame.w>0&&frame.h>0)||!rival||!marquee||
       !Number.isFinite(distance)||distance<0||distance>32)return 0;
    const u=(rival.x-frame.x)/frame.w,v=(rival.y-frame.y)/frame.h;
    const mx=(marquee.x-frame.x)/frame.w,my=(marquee.y-frame.y)/frame.h;
    if(![u,v,mx,my].every(value=>value>=0&&value<=1))return 0;
    const proximity=clamp(1-(distance-3)/29,0,1);
    const subject=clamp(1-Math.hypot((u-.5)*1.40,(v-.60)*1.35),0,1);
    const margin=clamp(Math.min(mx,1-mx,my,1-my)/.13,0,1);
    const separation=clamp(Math.hypot(mx-u,my-v)/.21,0,1);
    return Math.round(10+43*proximity+28*subject+12*margin+7*separation);
  }

  function frameCrop(source,...args){
    return crop(source.bayFrameAspect||source.width/source.height,1,...args);
  }
  function capture(source,sky,aimX=.5,aimY=.5,aspect=filmAspect,fullFrame=false){
    if(!source||source.width<2||source.height<2)return null;
    const f=frameCrop(source,aimX,aimY,aspect,fullFrame);
    try{
      const canvas=document.createElement("canvas");
      canvas.width=shotWidth;canvas.height=Math.round(shotWidth/filmRatio(aspect));
      const c=canvas.getContext("2d",{willReadFrequently:true});
      if(!c)return null;
      const drawLayer=layer=>c.drawImage(layer,f.x*layer.width,f.y*layer.height,
        f.w*layer.width,f.h*layer.height,0,0,canvas.width,canvas.height);
      drawLayer(source);
      // A discarded WebGL back buffer contains no scenery to photograph.
      const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;
      let exposed=false;
      for(let i=3;i<pixels.length;i+=4*53){if(pixels[i]>24){exposed=true;break;}}
      if(!exposed)return null;
      c.globalCompositeOperation="destination-over";
      if(sky&&sky!==source&&sky.width&&sky.height)drawLayer(sky);
      c.fillStyle="#68737b";c.fillRect(0,0,canvas.width,canvas.height);
      for(const quality of [.80,.62,.44]){
        const image=canvas.toDataURL("image/jpeg",quality);
        if(image.startsWith("data:image/jpeg;base64,/9j/")&&image.length<=imageLimit)return image;
      }
    }catch{/* Canvas readback can be disabled by the browser. */}
    return null;
  }

  const labelOk=value=>typeof value==="string"&&value.length>0&&value.length<=64&&
    value===value.trim()&&!/[\u0000-\u001f\u007f]/.test(value);
  function valid(record){
    return !!record&&Number.isInteger(record.score)&&record.score>=0&&record.score<=100&&
      labelOk(record.route)&&labelOk(record.rival)&&typeof record.image==="string"&&
      record.image.length<=imageLimit&&/^data:image\/jpeg;base64,\/9j\/[a-zA-Z0-9+/]+={0,2}$/.test(record.image);
  }

  function lines(c,words,x,y,width,leading){
    let line="";
    for(const word of words.split(/\s+/)){
      const next=line?line+" "+word:word;
      if(line&&c.measureText(next).width>width){
        c.fillText(line,x,y,width);line=word;y+=leading;
      }else line=next;
    }
    if(line)c.fillText(line,x,y,width);
    return y+leading;
  }

  function paint(canvas,record,image,failed=false){
    const c=canvas.getContext("2d");if(!c)return;
    const width=800,height=448;
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    c.save();c.setTransform(1,0,0,1,0,0);
    c.fillStyle=paper;c.fillRect(0,0,width,height);
    c.textAlign="left";c.textBaseline="alphabetic";
    c.fillStyle=ink;c.fillRect(20,13,760,2);
    c.font='bold 63px Georgia,serif';c.fillText("Bay Wire",19,72);
    c.textAlign="right";c.fillStyle=red;c.font='italic 26px Georgia,serif';c.fillText("Night edition",780,51);
    c.fillStyle=ink;c.font='600 13px "Courier New",monospace';c.fillText("SUNDOWN BAY  /  CITY DESK",780,72);
    c.fillRect(20,82,760,4);c.fillRect(20,89,760,1);
    const x=23,y=103,w=432,h=324;
    c.fillStyle=ink;c.fillRect(x-1,y-1,w+2,h+2);
    if(image){
      // Keep every part of the submitted negative, even for an optional nonstandard crop.
      const scale=Math.min(w/image.naturalWidth,h/image.naturalHeight);
      const iw=image.naturalWidth*scale,ih=image.naturalHeight*scale;
      c.drawImage(image,x+(w-iw)/2,y+(h-ih)/2,iw,ih);
    }else if(failed){
      c.fillStyle=paper;c.textAlign="center";c.font="20px Georgia,serif";
      c.fillText("Photograph unavailable",x+w/2,y+h/2);
    }
    const column=478,cw=300;
    c.textAlign="left";c.fillStyle=red;c.fillRect(column,105,26,3);
    c.font='bold 14px "Courier New",monospace';c.fillText("AFTER HOURS",column+36,112);
    c.fillStyle=ink;c.font="bold 43px Georgia,serif";c.fillText("Under the",column,169,cw);c.fillText("marquee",column,211,cw);
    c.font="21px Georgia,serif";lines(c,record.rival+" at Cine Luna, seen from Jules’s passenger seat.",column,250,cw,26);
    c.fillStyle=rule;c.fillRect(column,347,cw,1);c.fillStyle=ink;
    c.font='bold 13px "Courier New",monospace';c.fillText("COURSE",column,370);
    c.font="italic 20px Georgia,serif";c.fillText(record.route,column,398,cw-82);
    c.textAlign="right";c.font='bold 13px "Courier New",monospace';c.fillText("PHOTO SCORE",778,370);
    c.font="bold 21px Georgia,serif";c.fillText(record.score+" / 100",778,398);
    c.fillStyle=ink;c.fillRect(20,436,760,1);
    c.restore();
  }

  function cover(canvas,record){
    if(!canvas||!valid(record))return false;
    canvas.setAttribute("role","img");
    canvas.setAttribute("aria-label","Bay Wire night edition. "+record.rival+" at Cine Luna on "+record.route+". Photo score "+record.score+" out of 100.");
    const previous=prints.get(canvas);
    if(previous?.url===record.image){
      previous.record=record;paint(canvas,record,previous.ready?previous.image:null,previous.failed);return true;
    }
    const image=new Image(),print={image,record,url:record.image,ready:false,failed:false};
    prints.set(canvas,print);paint(canvas,record,null);
    image.onload=()=>{if(prints.get(canvas)===print){print.ready=true;paint(canvas,print.record,image);}};
    image.onerror=()=>{if(prints.get(canvas)===print){print.failed=true;paint(canvas,print.record,null,true);}};
    image.src=record.image;
    return true;
  }
  window.BayMeetPhoto={crop,frameCrop,score,capture,valid,cover};
})();
