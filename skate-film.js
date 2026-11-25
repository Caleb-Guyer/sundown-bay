/* A pocket camera records the whole skate pass and cuts it to a pocket-sized moving print. */
(() => {
  "use strict";
  const tileW=160,tileH=90,columns=6,printFrames=30,bufferFrames=48,rate=6;
  const sheetW=columns*tileW,sheetH=printFrames/columns*tileH,bufferH=bufferFrames/columns*tileH;
  const prefix="data:image/jpeg;base64,",imageLimit=124000;
  const alphabet="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
  const sites=Object.freeze({sol:"Sol Promenade",market:"El Mercado"});
  const stock=new WeakMap(),phoneFrames=new WeakMap();
  const paper="#f2e4bf",ink="#1c3030",tomato="#b54536",teal="#226764";
  let revision=0;

  // Check the JPEG's declared size before allowing a saved string into the image decoder.
  function validSheet(data){
    if(typeof data!=="string"||data.length>imageLimit||data.length<300||!data.startsWith(prefix))return false;
    const start=prefix.length,len=data.length-start;
    if(len%4||!/^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(data))return false;
    const bytes=len/4*3-(data.endsWith("==")?2:data.endsWith("=")?1:0);
    function byte(at){
      const p=start+Math.floor(at/3)*4+at%3;
      const a=alphabet.indexOf(data[p]),b=alphabet.indexOf(data[p+1]);
      if(at%3===0)return a*4+(b>>4);
      return at%3===1?(a&15)*16+(b>>2):(a&3)*64+b;
    }
    const word=at=>byte(at)*256+byte(at+1);
    if(word(0)!==0xffd8||word(bytes-2)!==0xffd9)return false;
    let sizeSeen=false;
    for(let at=2;at+4<bytes;){
      if(byte(at)!==255)return false;
      const mark=byte(at+1),size=word(at+2);
      if(size<2||at+2+size>=bytes)return false;
      if(mark===0xc0||mark===0xc2){
        if(size<11||sizeSeen||byte(at+4)!==8||word(at+5)!==sheetH||word(at+7)!==sheetW)return false;
        sizeSeen=true;
      }else if(mark===0xda)return sizeSeen&&at+2+size<bytes-32;
      at+=size+2;
    }
    return false;
  }
  const scoreOk=n=>Number.isSafeInteger(n)&&n>=0&&n<=9999999;
  const siteOk=key=>typeof key==="string"&&Object.hasOwn(sites,key);
  function valid(r){
    if(!r||typeof r!=="object"||r.v!==1||!siteOk(r.site)||!scoreOk(r.score)||!Number.isInteger(r.frames)||r.frames<3||r.frames>printFrames||
       !Number.isInteger(r.ms)||r.ms<300||r.ms>8000)return false;
    let e=stock.get(r);
    if(!e||e.data!==r.image){
      e={data:r.image,ok:validSheet(r.image),image:null,ready:false};stock.set(r,e);
    }
    return e.ok;
  }
  function decoded(r){
    const e=stock.get(r);
    if(!e.image&&typeof Image==="function"){
      const img=e.image=new Image();
      img.onload=()=>{
        e.ready=img.naturalWidth===sheetW&&img.naturalHeight===sheetH;e.ok=e.ready;revision++;
      };
      img.onerror=()=>{e.ok=false;revision++;};
      img.src=e.data;
    }
    return e.ready?e.image:null;
  }
  function title(site){return siteOk(site)?sites[site]:"";}
  function layer(c,source,x,y){
    const w=source.width,h=source.height,gate=BayMeetPhoto.frameCrop(source,.5,.5,tileW/tileH,true);
    c.drawImage(source,w*gate.x,h*gate.y,w*gate.w,h*gate.h,x,y,tileW,tileH);
  }
  function surface(height){
    const c=document.createElement("canvas");c.width=sheetW;c.height=height;return c;
  }

  function printQuality(c,print,scratch,frames){
    // Measure detail once per finished reel to choose its JPEG quality.
    const h=Math.ceil(frames/columns)*tileH,pixels=c.getImageData(0,0,sheetW,h).data;
    let change=0,channels=0;
    for(let y=2;y<h-1;y+=9)for(let x=2+y%7;x<sheetW-1;x+=7){
      const p=4*(y*sheetW+x);
      for(let k=p;k<p+3;k++)change+=Math.abs(pixels[k]-pixels[k+4])+Math.abs(pixels[k]-pixels[k+sheetW*4]);
      channels+=6;
    }
    const detail=change/channels;
    if(detail<=24)return Math.max(.31,.59-Math.max(0,detail-8)*.018);
    // Soften very busy textures to stay inside the save budget. The raw buffer is free after assembly.
    const w=sheetW/2,halfH=sheetH/2;
    scratch.drawImage(print,0,0,sheetW,sheetH,0,0,w,halfH);
    c.drawImage(scratch.canvas,0,0,w,halfH,0,0,sheetW,sheetH);
    return .29;
  }

  class Recorder{
    constructor(){
      this.sheet=null;this.ctx=null;this.print=null;
      this.order=new Uint8Array(bufferFrames);this.spare=new Uint8Array(bufferFrames);
      this.times=new Float64Array(bufferFrames);this.stop();
    }
    start(site){
      this.stop();if(site==="mercado")site="market";
      if(!siteOk(site))return false;
      this.site=site;this.active=true;
      for(let i=0;i<bufferFrames;i++)this.order[i]=i;
      if(this.ctx)this.ctx.clearRect(0,0,sheetW,bufferH);
      return true;
    }
    stop(){
      this.active=false;this.site=null;this.count=0;this.next=-Infinity;this.last=-Infinity;this.source=null;this.interval=1/rate;
    }
    makeRoom(){
      // Keep every second exposure, then reuse the freed tiles. No pixel copy is needed.
      const half=bufferFrames/2;
      for(let i=0;i<half;i++){this.spare[i]=this.order[2*i];this.spare[half+i]=this.order[2*i+1];}
      const old=this.order;this.order=this.spare;this.spare=old;
      this.count=half;this.interval*=2;this.next=this.times[this.order[half-1]]+this.interval;
    }
    sample(time,source,sky){
      if(!this.active||!Number.isFinite(time)||!source||source.width<2||source.height<2)return false;
      if(time<this.last)this.start(this.site);
      this.last=time;if(time+.00001<this.next)return false;
      if(this.count===bufferFrames)this.makeRoom();
      if(time+.00001<this.next)return false;
      this.next=this.count&&time<this.next+this.interval?this.next+this.interval:time+this.interval;
      try{
        if(!this.sheet){
          this.sheet=surface(bufferH);
          this.ctx=this.sheet.getContext("2d");if(!this.ctx){this.stop();this.sheet=null;return false;}
        }
        const slot=this.order[this.count],c=this.ctx,x=slot%columns*tileW,y=Math.floor(slot/columns)*tileH;
        c.clearRect(x,y,tileW,tileH);layer(c,source,x,y);
        if(this.source!==source){
          // The foreground must be present. A discarded WebGL buffer only contains transparent pixels.
          const scan=c.getImageData(x,y+Math.floor(tileH*.60),tileW,1).data;
          let visible=false;for(let i=3;i<scan.length;i+=4)if(scan[i]>16){visible=true;break;}
          if(!visible)return false;
          this.source=source;
        }
        c.globalCompositeOperation="destination-over";
        if(sky&&sky!==source&&sky.width&&sky.height)layer(c,sky,x,y);
        c.fillStyle="#64787b";c.fillRect(x,y,tileW,tileH);c.globalCompositeOperation="source-over";
        this.times[slot]=time;this.count++;return true;
      }catch{
        // A restricted or lost canvas must not replace the player's existing film.
        this.ctx=this.sheet=null;this.stop();return false;
      }
    }
    finish(score){
      let result=null;
      if(this.active&&this.count>=3&&scoreOk(score)){
        try{
          if(!this.print)this.print=surface(sheetH);
          const c=this.print.getContext("2d",{alpha:false}),frames=Math.min(this.count,printFrames);
          const start=this.times[this.order[0]],end=this.times[this.order[this.count-1]];
          // Pick distinct chronological frames around evenly spaced times, including both ends of the run.
          c.fillStyle=ink;c.fillRect(0,0,sheetW,sheetH);let previous=-1;
          for(let i=0;i<frames;i++){
            let j=previous+1;
            const t=start+(end-start)*i/(frames-1),limit=this.count-(frames-i);
            while(j<limit&&Math.abs(this.times[this.order[j+1]]-t)<Math.abs(this.times[this.order[j]]-t))j++;
            previous=j;const slot=this.order[j];
            c.drawImage(this.sheet,slot%columns*tileW,Math.floor(slot/columns)*tileH,tileW,tileH,
              i%columns*tileW,Math.floor(i/columns)*tileH,tileW,tileH);
          }
          const ms=Math.round(Math.min(8,Math.max(.3,end-start+1/rate))*1000);
          const quality=printQuality(c,this.print,this.ctx,frames);
          const image=this.print.toDataURL("image/jpeg",quality);
          const record=Object.freeze({v:1,site:this.site,score,frames,ms,image});
          if(valid(record))result=record;
        }catch{this.ctx=this.sheet=this.print=null;}
      }
      this.stop();return result;
    }
  }

  function box(c,x,y,w,h,color){c.fillStyle=color;c.fillRect(x,y,w,h);}
  function word(c,t,x,y,font,color,align="left"){
    c.textAlign=align;c.font=font;c.fillStyle=color;c.fillText(t,x,y);
  }
  // The leader is a hand-lettered curb rubbing and a pair of urethane wheel marks.
  function slate(c,r){
    const accent=r.site==="sol"?teal:tomato;
    box(c,0,0,416,234,paper);box(c,18,20,381,2,ink);
    word(c,"LUNA  /  LOCAL SHORTS",19,36,"bold 10px monospace",ink);
    word(c,title(r.site),398,36,"italic bold 13px Georgia,serif",accent,"right");
    c.save();c.translate(27,97);c.rotate(-.037);
    word(c,"Curb Cut",0,27,"italic bold 81px Georgia,serif",ink);
    c.restore();
    c.fillStyle=accent;c.beginPath();c.moveTo(0,184);c.lineTo(133,173);c.lineTo(229,142);c.lineTo(416,134);
    c.lineTo(416,146);c.lineTo(231,153);c.lineTo(135,184);c.lineTo(0,194);c.fill();
    c.strokeStyle=ink;c.lineWidth=1.6;c.beginPath();c.moveTo(0,181);c.lineTo(132,170);c.lineTo(228,139);c.lineTo(416,131);c.stroke();
    for(const x of [289,314]){
      c.beginPath();c.ellipse(x,140-(x-289)*.04,7.4,3.9,-.05,0,Math.PI*2);c.stroke();
    }
    box(c,18,201,381,1,"#ac9e82");
    word(c,"A SUNDOWN BAY STREET FILM",19,217,"bold 10px monospace",ink);
    word(c,r.score+" PTS",398,217,"bold 11px monospace",accent,"right");
  }
  const runningTime=r=>Math.ceil(1+r.ms/1000+1.2);
  function duration(r){return valid(r)?runningTime(r):0;}
  function draw(c,r,time,w=416,h=234,phone=null){
    if(!c||!valid(r))return false;
    const image=decoded(r),length=runningTime(r),clock=Number.isFinite(time)?((time%length)+length)%length:0;
    const action=clock-1,seconds=r.ms/1000;
    const exposure=!image||action<0?-1:Math.min(r.frames,Math.floor(action*r.frames/seconds));
    if(phone){
      if(phone.record===r&&phone.exposure===exposure&&phone.w===w&&phone.h===h)return true;
      phone.record=r;phone.exposure=exposure;phone.w=w;phone.h=h;
    }
    c.save();c.scale(w/416,h/234);c.textBaseline="alphabetic";
    if(exposure<0){slate(c,r);c.restore();return true;}
    const tile=Math.min(r.frames-1,exposure);
    // Hold the clean landing on the last frame, as on a skate shop's edit.
    c.drawImage(image,tile%columns*tileW,Math.floor(tile/columns)*tileH,tileW,tileH,0,0,416,234);
    if(exposure===r.frames){
      box(c,0,204,416,30,ink);box(c,0,204,5,30,r.site==="sol"?"#83c2b1":"#e9805f");
      word(c,title(r.site),13,224,"italic bold 16px Georgia,serif",paper);
      word(c,r.score+" PTS",404,224,"bold 13px monospace",paper,"right");
    }
    c.restore();return true;
  }
  function paint(canvas,r,time){
    if(!canvas||typeof canvas.getContext!=="function")return false;
    let phone=phoneFrames.get(canvas);
    if(!phone){phone={};phoneFrames.set(canvas,phone);}
    return draw(canvas.getContext("2d"),r,time,canvas.width,canvas.height,phone);
  }
  window.BaySkateFilm=Object.freeze({Recorder,valid,title,duration,draw,paint,get revision(){return revision;}});
})();
