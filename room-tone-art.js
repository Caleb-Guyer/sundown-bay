/* The boardwalk van's portable deck and the field log taped under its lid. */
(() => {
  const rt=BayRoomTone,paper="#e3d8b9",ink="#243d3b",rust="#9a4939",cream="#f5e4bc";
  const x=t=>76+t*848/rt.length;
  let plate=null;
  function rect(g,x,y,w,h,color){g.fillStyle=color;g.fillRect(x,y,w,h);}
  function text(g,s,x,y,size,color=ink,font="monospace"){g.fillStyle=color;g.font=size+"px "+font;g.fillText(s,x,y);}
  function disc(g,x,y,r,color){g.beginPath();g.arc(x,y,r,0,2*Math.PI);g.fillStyle=color;g.fill();}
  function housing(){
    const c=document.createElement("canvas");c.width=1000;c.height=500;const g=c.getContext("2d");
    rect(g,0,0,1000,500,"#253e37");for(let i=0;i<44;i++)rect(g,0,i*12,1000,1,i%3?"#2b433b":"#32483d");
    rect(g,45,22,920,458,"#192d29");rect(g,37,15,920,458,"#7a8578");rect(g,50,26,895,235,"#a7ac95");
    for(const a of [61,931])for(const b of [37,245]){disc(g,a,b,5,"#596457");rect(g,a-2,b,5,1,"#b7bda6");}
    rect(g,383,67,228,61,"#243d38");text(g,"SOL  FM",405,109,35,cream,"Georgia");text(g,"UNIT  3",524,106,15,"#9bc2af");
    rect(g,418,165,165,35,"#69756a");rect(g,433,156,136,38,"#d4c7a9");rect(g,497,156,4,38,"#78392b");
    for(const u of [364,633]){disc(g,u,183,18,"#394c45");disc(g,u,183,11,"#959d8b");}
    rect(g,51,263,895,195,paper);text(g,"M. VEGA    /    FIELD REEL 14",73,290,16,rust);
    text(g,"M/V Luz, first sailing",612,290,24,ink,"Georgia");rect(g,76,317,848,81,"#d7caaa");
    for(let t=0;t<rt.length;t+=.25){const i=Math.round(t*4);rect(g,x(t),395,1,i%4?5:11,"#7f846e");
      if(i%4===0)text(g,String(i/4).padStart(2,"0"),x(t)-5,420,12,"#526257");}
    for(const s of rt.tape){
      const voice=s.id==="dalia"||s.id==="luis",col=voice?ink:rust;
      text(g,voice?rt.lines[s.id][0]:s.id==="bell"?"BELL":"PUNCH",x(s.start),313,12,col);
      for(let t=s.start;t<s.end;t+=.04){
        const f=t-s.start,amp=voice?BayRoomVoices.level(s.id,f):69*Math.exp(-9*(f<.32?f:f-.32));
        rect(g,x(t),358-amp*.33,Math.max(1,x(.037)-x(0)),Math.max(1,amp*.66),col);
      }
      if(voice)for(const t of [s.start,s.end])rect(g,x(t),323,2,67,"#fcf0c8");
    }
    return c;
  }
  function spool(g,x,y,angle,r){
    disc(g,x+2,y+4,79,"#69756c");disc(g,x,y,79,"#bfc4ac");disc(g,x,y,r,"#54463b");
    for(let n=0;n<3;n++){
      const a=angle+n*Math.PI*2/3;
      g.save();g.translate(x,y);g.rotate(a);rect(g,-8,-73,16,72,"#b6bca5");g.restore();
    }
    disc(g,x,y,21,"#a6ae98");disc(g,x,y,10,"#414c43");rect(g,x-4,y-2,8,4,"#d3d3b8");
  }
  function paint(canvas,e){
    const g=canvas.getContext("2d",{alpha:false});
    if(canvas.width!==1000||canvas.height!==500){canvas.width=1000;canvas.height=500;}
    g.drawImage(plate??=housing(),0,0);
    const f=e.head/rt.length;g.strokeStyle="#5b4838";g.lineWidth=3;g.beginPath();
    g.moveTo(211,79);g.lineTo(348,185);g.lineTo(417,186);g.lineTo(583,186);g.lineTo(650,186);g.lineTo(790,83);g.stroke();
    spool(g,220,141,e.head*1.7,63-12*f);spool(g,777,141,e.head*1.86,48+13*f);
    if(e.start!==null){const stop=e.cut?.end??e.head;g.fillStyle="#497c6033";g.fillRect(x(e.start),317,x(stop)-x(e.start),81);
      rect(g,x(e.start)-1,317,3,81,"#386446");if(e.cut)rect(g,x(e.cut.end)-1,317,3,81,"#386446");}
    const cursor=x(e.head);rect(g,cursor-1,310,3,94,rust);
    g.fillStyle=rust;g.beginPath();g.moveTo(cursor-6,305);g.lineTo(cursor+6,305);g.lineTo(cursor,315);g.fill();
    const actions=e.cut?"H  Hear splice     Enter  Send to air     Space  Cut again":"A / D  Wind     H  Listen     Space  Mark "+(e.start===null?"in":"out");
    text(g,actions,74,446,17,ink);text(g,"Esc  Leave",816,446,15,rust);
  }
  window.BayRoomToneArt={paint};
})();
