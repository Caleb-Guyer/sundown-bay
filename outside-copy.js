/* The spare enlargement at Mara's two delivery stops. The negative stays intact. */
(() => {
  "use strict";
  const key="sundownBay.outsideCopies.v1",yaw=-Math.PI/2;
  const sites=[
    {route:"print",name:"Cine Luna",x:8.1,z:50.8,yaw,style:1,reader:"Celia Paz",trim:"#92533d",ink:"#532e35",paper:"#f5e5bf"},
    {route:"live",name:"Sol FM",x:152.9,z:122.8,yaw,style:4,reader:"Beto Mora",trim:"#427b78",ink:"#164e54",paper:"#e2e6cc"}
  ];
  const limit=(n,lo,hi,fallback)=>Number.isFinite(n)?Math.max(lo,Math.min(hi,n)):fallback;
  function readCopy(raw){
    const f=BayLotNegative.readFrame(raw);
    return f&&{...f,zoom:limit(raw.zoom,1,2.5,1),cx:limit(raw.cx,0,1,.5),cy:limit(raw.cy,0,1,.5)};
  }
  function read(){
    let data;try{data=JSON.parse(localStorage.getItem(key));}catch{}
    return {print:readCopy(data?.print),live:readCopy(data?.live)};
  }
  class Cases{
    constructor(){this.mounted=read();}
    source(site,edition,negative){
      const old=this.mounted[site.route];
      if(edition!==site.route||!negative||old?.image===negative.image&&old.frame===negative.frame&&old.quote===negative.quote)return old;
      return negative;
    }
    hang(site,edit){
      const copy=readCopy(edit);if(!copy)return false;
      try{const data=read();data[site.route]=copy;localStorage.setItem(key,JSON.stringify(data));}
      catch{return false;}
      this.mounted[site.route]=copy;return true;
    }
  }
  function crop(width,height,copy){
    const w=Math.min(width,height*16/9)/copy.zoom,h=w*9/16;
    return [(width-w)*copy.cx,(height-h)*copy.cy,w,h];
  }
  function paint(canvas,site,copy,img){
    const ctx=canvas.getContext("2d"),print=site.route==="print";
    ctx.fillStyle=site.paper;ctx.fillRect(0,0,640,448);ctx.fillStyle=site.ink;
    ctx.textAlign="left";ctx.font=print?"bold 28px Georgia, serif":"bold 27px sans-serif";
    ctx.fillText(print?"CINE LUNA":"SOL FM   88.3",16,35);
    ctx.textAlign="right";ctx.font="bold 14px monospace";ctx.fillText(print?"FROM THE PROJECTION BOOTH":"FIELD DESK  /  PORT SOL",624,30);
    ctx.fillRect(16,43,608,2);ctx.fillStyle="#312e2a";ctx.fillRect(16,52,608,342);
    ctx.drawImage(img,...crop(img.naturalWidth,img.naturalHeight,copy),16,52,608,342);
    ctx.textAlign="left";ctx.fillStyle=site.ink;ctx.font=print?"bold 20px Georgia, serif":"bold 18px sans-serif";
    const subject=copy.frame==="14A"?"The notice at Lot 14":"Luis Vega at the public landing";
    ctx.fillText(copy.quote?"“"+BayLotNegative.quotes[copy.quote]+"”":subject,16,418,608);
    ctx.font="bold 13px monospace";ctx.fillText(copy.quote?"LUIS VEGA   /   PHOTOGRAPH BY MARA VEGA":"PHOTOGRAPH BY MARA VEGA",17,439);
    ctx.textAlign="right";ctx.fillText("LOT 14  /  "+copy.frame,624,439);
    ctx.textAlign="left";
  }
  // The image and the canvas survive between draws. A new hanging gets a new texture.
  const plates=new WeakMap();
  function plate(site,copy){
    if(!copy)return null;
    let canvas=plates.get(copy);if(canvas)return canvas;
    const img=BayLotNegative.photo(copy);if(!img?.naturalWidth)return null;
    canvas=document.createElement("canvas");canvas.width=640;canvas.height=448;
    paint(canvas,site,copy,img);plates.set(copy,canvas);return canvas;
  }
  function edit(body,site,source,finish){
    const draft=readCopy(source),img=BayLotNegative.photo(source);
    body.append(document.getElementById("outsideCopyDesk").content.cloneNode(true));
    const canvas=body.querySelector("canvas"),button=body.querySelector(".hang-copy"),status=body.querySelector("[role=status]");
    canvas.setAttribute("aria-label",BayLotNegative.captions[source.frame]+", the outside copy for "+site.name+
      (source.quote?". Luis Vega: "+BayLotNegative.quotes[source.quote]:""));
    const inputs=[...body.querySelectorAll("input")];
    const refresh=()=>{
      if(!canvas.isConnected)return;
      button.disabled=!img?.naturalWidth;
      if(!button.disabled)paint(canvas,site,draft,img);
      for(const input of inputs){
        const name=input.name;
        input.nextElementSibling.textContent=name==="zoom"?draft.zoom.toFixed(2)+"×":Math.round(100*draft[name])+"%";
        input.disabled=name!=="zoom"&&draft.zoom===1;
      }
    };
    for(const input of inputs){input.value=draft[input.name];input.oninput=()=>{draft[input.name]=Number(input.value);refresh();};}
    if(img&&!img.complete){
      img.addEventListener("load",refresh,{once:true});
      img.addEventListener("error",()=>{status.textContent="The photograph could not be opened.";},{once:true});
    }
    refresh();inputs[0].focus({preventScroll:true});
    button.onclick=()=>{if(!finish(draft))status.textContent="The case is still as you found it. Your browser could not save the print.";};
  }
  function cabinet(g,site){
    for(const side of [-1,1]){
      g.box(side*.76,.35,-.04,.078,.70,.10,"#484d49");
      g.box(side*.76,.035,-.04,.26,.07,.35,"#606461");
    }
    g.box(0,1.37,0,2.08,1.48,.16,site.trim);g.box(0,1.37,.088,1.97,1.37,.023,"#373e3e");
    g.box(0,1.37,.105,1.91,1.32,.018,site.paper);
    g.box(0,2.123,0,2.16,.055,.30,site.route==="print"?"#bb9564":"#849c99");
    for(const side of [-1,1])g.box(side*.94,.69,.12,.045,.045,.025,"#bead90");
  }
  function face(g){
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])
      g.vertices.push(u?-.94:.94,v?.712:2.028,.119,u,v,0);
  }
  function map(ctx,x,y,s,site,mounted){
    ctx.save();ctx.translate(x,y);
    ctx.fillStyle="#3a4240";ctx.fillRect(-.28*s,-1.04*s,.56*s,2.08*s);
    ctx.fillStyle=site.trim;ctx.fillRect(-.18*s,-1.09*s,.27*s,2.18*s);
    ctx.fillStyle=mounted?site.paper:"#858975";ctx.fillRect(-.27*s,-.91*s,.12*s,1.82*s);
    ctx.restore();
  }
  // A reader walks up the pavement, looks into the glass, and retraces their steps.
  function reader(site,time){
    const t=(time+(site.route==="live"?8:0))%28;
    const ease=f=>f*f*(3-2*f);
    const offset=t<6?4.2*(1-ease(t/6)):t<16?0:t<22?4.2*ease((t-16)/6):4.2;
    const heading=t<6?Math.PI:t<7?Math.PI-ease(t-6)*Math.PI/2:t<15?Math.PI/2:t<16?(1-ease(t-15))*Math.PI/2:
      t<26?0:ease((t-26)/2)*Math.PI;
    const moving=t>.25&&t<5.75||t>16.25&&t<21.75;
    return {x:site.x-1.3,z:site.z+offset,yaw:heading,pose:moving?1+Math.floor(time*4)%4:0,reading:t>=7&&t<15};
  }
  function line(site,copy){
    if(copy.frame==="14B")return site.route==="print"?
      (copy.zoom>=1.55?"See the handle? His brother wrapped that with bicycle tape.":"I went to school with Luis. Never saw him let anybody take his picture."):
      (copy.zoom>=1.55?"I heard those tins knock together on the air. There they are.":"I know that face. He takes the first boat every morning.");
    return site.route==="print"?(copy.zoom>=1.55?"That's our slip number. My mother still has the key.":"I walked past that notice all week. Look how little space they gave it."):
      (copy.zoom>=1.55?"They read that date twice on the radio. Now I can copy it down.":"So that's where they pinned it. From the broadcast I pictured the other gate.");
  }
  window.BayOutsideCopy={key,sites,Cases,crop,plate,edit,cabinet,face,map,reader,line};
})();
