/* Frankie uses a bright-line finder. The filed card holds the entire exposed frame. */
(() => {
  "use strict";
  const cream="#eee2c5",green="#31534f",ink="#303d39",ochre="#b47848",red="#985444";
  const mono='"Courier New", monospace',serif='Georgia, "Times New Roman", serif';
  const bound=(n,lo,hi)=>Math.max(lo,Math.min(hi,n));
  const text=value=>typeof value==="string"?value.trim():"";
  function ellipsis(c,value,width){
    if(c.measureText(value).width<=width)return value;
    let s=value;
    while(s.length&&c.measureText(s+"…").width>width)s=s.slice(0,-1);
    return s.trimEnd()+"…";
  }
  function cornerPath(c,x,y,w,h,len){
    c.beginPath();
    for(const [dx,dy] of [[1,1],[-1,1],[-1,-1],[1,-1]]){
      const cx=x+(dx<0?w:0),cy=y+(dy<0?h:0);
      c.moveTo(cx+dx*len,cy);c.lineTo(cx,cy);c.lineTo(cx,cy+dy*len);
    }
  }
  function finderLabel(c,value,x,y,size,maxWidth,right=false){
    if(!value||maxWidth<12)return;
    c.font='bold '+size+'px '+mono;
    const label=ellipsis(c,value,maxWidth-12),w=Math.ceil(c.measureText(label).width)+12;
    const left=right?x-w:x;
    c.fillStyle="rgba(28,38,34,.79)";c.fillRect(left,y-size-4,w,size+10);
    c.fillStyle="#f1ebd8";c.textAlign="left";c.fillText(label,left+6,y);
  }
  function frame(ctx,width,height,state={}){
    if(!ctx||width<1||height<1)return;
    ctx.save();ctx.clearRect(0,0,width,height);
    if(Number.isFinite(state.windowPan))BayWindowSlip.glass(ctx,width,height,state.windowPan,1,state.time);
    const ratio=Number.isFinite(state.aspect)?bound(state.aspect,.55,2.4):1.5;
    const w=Math.min(width,height*ratio),h=w/ratio,x=(width-w)*.5,y=(height-h)*.5;
    const unit=bound(Math.min(w/460,h/275),.70,1.7),inset=7*unit;
    if(x>0||y>0){
      ctx.fillStyle="rgba(15,22,22,.48)";
      ctx.fillRect(0,0,x,height);ctx.fillRect(x+w,0,x,height);
      ctx.fillRect(x,0,w,y);ctx.fillRect(x,y+h,w,y);
    }
    function keyline(color){
      ctx.lineWidth=3.1*unit;ctx.strokeStyle="rgba(23,32,29,.71)";ctx.stroke();
      ctx.lineWidth=1.15*unit;ctx.strokeStyle=color;ctx.stroke();
    }
    ctx.lineJoin="miter";ctx.lineCap="square";
    cornerPath(ctx,x+inset,y+inset,w-2*inset,h-2*inset,13*unit);keyline("#eee7cf");
    const focus=state.framed?"#b6e3a9":"#e4d6a8",cx=width*.5,cy=height*.5;
    cornerPath(ctx,cx-16*unit,cy-9*unit,32*unit,18*unit,4.2*unit);keyline(focus);
    ctx.beginPath();
    ctx.moveTo(cx-6*unit,cy);ctx.lineTo(cx-2*unit,cy);
    ctx.moveTo(cx+2*unit,cy);ctx.lineTo(cx+6*unit,cy);keyline(focus);
    const size=bound(Math.round(10.5*unit),10,16),pad=inset+8*unit;
    const title=text(state.title),subject=text(state.subject);
    ctx.textBaseline="alphabetic";
    if(title&&title!==subject)finderLabel(ctx,title,x+pad,y+pad+size,size,w-2*pad);
    const zoom=Number.isFinite(state.zoom)&&state.zoom>0?
      state.zoom>=8?Math.round(state.zoom)+" mm":(Math.round(state.zoom*10)/10)+"×":"";
    const left=Number.isFinite(state.remaining)?Math.max(0,Math.floor(state.remaining))+" left":"";
    const meter=[zoom,left].filter(Boolean).join("  ·  "),bottom=y+h-pad;
    ctx.font='bold '+size+'px '+mono;
    const meterWidth=meter?ctx.measureText(meter).width+20:0;
    finderLabel(ctx,subject,x+pad,bottom,size,w-2*pad-meterWidth-6);
    finderLabel(ctx,meter,x+w-pad,bottom,size,w-2*pad,true);
    if(state.flash>0){
      ctx.fillStyle="rgba(255,248,229,"+(.85*bound(state.flash,0,1)**1.5)+")";
      ctx.fillRect(x,y,w,h);
    }
    ctx.restore();
  }

  const width=720,height=610,stock="#eddfc4";
  const prints=new WeakMap(),images=new Map();
  function clock(minute){
    if(!Number.isFinite(minute))return "";
    const t=((Math.floor(minute)%1440)+1440)%1440,h=Math.floor(t/60);
    return (h%12||12)+":"+String(t%60).padStart(2,"0")+(h<12?" AM":" PM");
  }
  function description(r){
    return [r.title,r.district,r.by,Number.isFinite(r.score)?"Frame score "+r.score+" of 100":""].filter(Boolean).join(". ");
  }
  function stockMarks(c){
    let seed=5213;
    const rand=()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
    c.fillStyle=stock;c.fillRect(0,0,width,height);
    // Fibres and a thumb-worn lower edge stay outside the photographic emulsion.
    c.fillStyle="rgba(101,77,46,.12)";
    for(let i=0;i<170;i++){const x=rand()*width,y=rand()*height;c.fillRect(x,y,.5+rand()*2.1,.55+rand()*.7);}
    c.fillStyle="rgba(102,75,43,.16)";
    for(let i=0;i<34;i++){const x=rand()*width;c.fillRect(x,height-1-rand()*1.4,2+rand()*11,1);}
    c.strokeStyle="#ccba99";c.lineWidth=1;c.beginPath();c.moveTo(width-17,1);c.lineTo(width-1,16);c.stroke();
  }
  function stamp(c,no){
    c.textAlign="right";c.textBaseline="alphabetic";c.fillStyle=red;
    c.font='bold 21px '+mono;c.fillText("LOC. "+String(no).padStart(2,"0"),width-27,38);
  }
  function paint(canvas,r,entry){
    const c=canvas.getContext("2d");if(!c)return;
    if(canvas.width!==width)canvas.width=width;if(canvas.height!==height)canvas.height=height;
    c.save();c.setTransform(1,0,0,1,0,0);stockMarks(c);c.textBaseline="alphabetic";c.textAlign="left";
    c.fillStyle=green;c.font='bold italic 32px '+serif;c.fillText("Cine Luna",27,39);
    const subX=31+c.measureText("Cine Luna").width;
    c.fillStyle="#53665b";c.font='bold 17px '+mono;c.fillText("/  LOCATIONS",subX+9,37);stamp(c,r.number??1);
    c.strokeStyle=green;c.lineWidth=1.5;c.beginPath();c.moveTo(26,49);c.lineTo(694,49);c.stroke();
    const fx=29,fy=61,fw=662,fh=440;
    c.fillStyle="#2a2e29";c.fillRect(fx-3,fy-3,fw+6,fh+9);
    if(entry.ready){
      const im=entry.image,scale=Math.min(fw/im.naturalWidth,fh/im.naturalHeight);
      const iw=im.naturalWidth*scale,ih=im.naturalHeight*scale;
      c.drawImage(im,fx+(fw-iw)*.5,fy+(fh-ih)*.5,iw,ih);
    }else if(entry.failed){
      c.fillStyle=cream;c.textAlign="center";c.font='24px '+serif;c.fillText("Photograph unavailable",width*.5,fy+fh*.5);
    }
    c.fillStyle=ochre;
    for(const x of [35,675]){
      c.beginPath();c.moveTo(x,fy+fh+1);c.lineTo(x+6,fy+fh+1);c.lineTo(x+3,fy+fh+4.5);c.closePath();c.fill();
    }
    c.textAlign="left";c.fillStyle=ink;c.font='bold 35px '+serif;
    c.fillText(ellipsis(c,text(r.title)||"Location study",width-54),26,550);
    const byline=[text(r.by),text(r.district)].filter(Boolean).join("  /  ");
    c.fillStyle=green;c.font='bold 22px '+mono;
    const rated=Number.isFinite(r.score),score=rated?bound(Math.round(r.score),0,100)+" / 100":"";
    const right=694,scoreWidth=score?c.measureText(score).width+20:0;
    c.fillText(ellipsis(c,byline,right-27-scoreWidth),27,577);
    c.textAlign="right";c.fillStyle=red;c.fillText(score,right,577);
    const date=[Number.isFinite(r.day)?"Day "+r.day:"",clock(r.minute)].filter(Boolean).join("  ·  ");
    c.font='18px '+mono;c.fillStyle="#685e4f";c.textAlign="left";c.fillText(date,27,601);
    c.restore();
  }
  function imageFor(url){
    let entry=images.get(url);
    if(entry){images.delete(url);images.set(url,entry);return entry;}
    const im=new Image();entry={image:im,ready:false,failed:false,pending:new Set()};images.set(url,entry);
    function finish(ok){
      entry.ready=ok&&im.naturalWidth>0&&im.naturalHeight>0;entry.failed=!entry.ready;
      for(const canvas of entry.pending){const p=prints.get(canvas);if(p?.entry===entry)paint(canvas,p.record,entry);}
      entry.pending.clear();
    }
    im.onload=()=>finish(true);im.onerror=()=>finish(false);im.src=url;
    if(images.size>8)images.delete(images.keys().next().value);
    return entry;
  }
  function print(canvas,record){
    if(!canvas||typeof record?.image!=="string"||!record.image.startsWith("data:image/jpeg;base64,"))return false;
    const previous=prints.get(canvas),signature=JSON.stringify([record.title,record.district,record.by,record.minute,record.day,record.score,record.number]);
    if(previous?.url===record.image&&previous.signature===signature&&canvas.width===width&&canvas.height===height)return true;
    previous?.entry.pending.delete(canvas);
    const entry=previous?.url===record.image?previous.entry:imageFor(record.image);
    canvas.setAttribute?.("role","img");canvas.setAttribute?.("aria-label",description(record));
    prints.set(canvas,{entry,url:record.image,record,signature});
    if(!entry.ready&&!entry.failed)entry.pending.add(canvas);
    paint(canvas,record,entry);return true;
  }
  window.BayScoutPrints=Object.freeze({frame,print});
})();
