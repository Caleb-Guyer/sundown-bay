(() => {
  "use strict";
  const n=BayNeedle,tau=Math.PI*2,ink="#213b3d",cream="#f2ddac",brass="#e2b16b",coral="#d37362";
  function circle(c,x,y,r,color){c.beginPath();c.arc(x,y,r,0,tau);c.fillStyle=color;c.fill();}
  function path(c,pts,color){c.beginPath();c.moveTo(...pts[0]);for(const p of pts.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=color;c.fill();}
  function line(c,a,b,w,color){c.beginPath();c.moveTo(...a);c.lineTo(...b);c.strokeStyle=color;c.lineWidth=w;c.lineCap="round";c.stroke();}
  function type(c,str,x,y,font,color){c.textAlign="center";c.fillStyle=color;c.font=font;c.fillText(str,x,y);}
  function vinyl(c,x,y,r,col){
    circle(c,x,y,r,"#182b2e");
    for(let i=1;i<=4;i++){
      c.beginPath();c.arc(x,y,r*(.46+.107*i),.2,5.92);c.strokeStyle=i%2?"#47524d":"#354847";c.lineWidth=.72;c.stroke();
    }
    circle(c,x,y,r*.40,col);circle(c,x,y,r*.08,cream);
  }
  let inked;
  function print(){
    if(inked)return inked;
    const canvas=document.createElement("canvas");canvas.width=600;canvas.height=840;const c=canvas.getContext("2d");c.scale(2,2);
    c.fillStyle=ink;c.fillRect(0,0,300,420);
    const field=c.createLinearGradient(0,0,0,420);field.addColorStop(0,"#bb715c");field.addColorStop(.37,"#dbab76");field.addColorStop(.71,"#93ae96");field.addColorStop(1,"#518989");
    c.fillStyle=field;c.fillRect(8,8,284,409);
    c.save();c.beginPath();c.rect(12,17,250,376);c.clip();
    circle(c,210,115,77,"#e5ba83");
    for(let i=0;i<7;i++)line(c,[37,137+i*5],[260,137+i*5],i%2?1.7:1,"#cd9274");
    // A white ibis lifting off the mangroves, screen-printed in three passes.
    path(c,[[42,211],[85,196],[125,200],[168,180],[215,138],[203,169],[225,157],[201,181],[165,201],[140,216],[102,216],[69,226]],"#62877f");
    path(c,[[53,213],[87,190],[112,177],[126,146],[135,123],[136,165],[148,127],[146,169],[162,144],[148,184],[132,204],[112,215],[85,220]],"#f4dfaf");
    path(c,[[76,216],[93,197],[113,187],[107,201],[137,180],[127,201],[147,190],[129,211],[96,222]],"#c9ba93");
    path(c,[[88,213],[76,214],[59,202],[50,205],[47,213],[54,217],[62,211],[76,225],[94,222]],cream);
    path(c,[[51,209],[40,211],[31,219],[27,230],[35,220],[50,215]],"#9f514c");circle(c,53,208,1.4,ink);
    for(let i=0;i<9;i++){
      const x=18+i*27;c.beginPath();c.moveTo(x,237);c.quadraticCurveTo(x+10,230,x+21,236);c.strokeStyle="#588781";c.lineWidth=1.5;c.stroke();
    }
    c.restore();
    c.fillStyle="#344f4e";c.fillRect(268,87,17,318);
    for(let y=111;y<380;y+=20){line(c,[273,y+3],[277,y-1],1,brass);line(c,[277,y-1],[281,y+3],1,brass);}
    for(let i=0;i<n.walls.length;i++){
      const w=n.walls[i],a=w.slice(0,2),b=w.slice(2);
      line(c,a,b,i<10?5:4,ink);line(c,a,b,i<10?2.2:1.3,i<10?"#d3ccae":cream);
    }
    for(const p of n.posts){circle(c,p[0]+1,p[1]+2,p[2]+1,"#516963");circle(c,...p,brass);circle(c,p[0],p[1],2,"#6c6557");}
    for(const i of [0,1]){
      const x=i?224:54;c.save();c.translate(x,263);c.rotate(i?.54:-.54);
      path(c,[[-7,-22],[7,-22],[4,23],[-4,23]],"#be6857");line(c,[0,-19],[0,18],1,cream);c.restore();
    }
    type(c,"NEEDLE DROP",137,258,"italic bold 23px Georgia",ink);
    type(c,"T I D E W A Y    /    4 5   R P M",137,273,"bold 7px monospace",ink);
    for(const [x,y,name,color] of n.stops){
      circle(c,x+1.5,y+3,22,"#776b58");circle(c,x,y,21,cream);vinyl(c,x,y,18,color);
      type(c,name,x,y+31,"bold 8px monospace",ink);
    }
    path(c,[[0,388],[70,369],[110,397],[165,397],[211,369],[264,384],[264,420],[0,420]],ink);
    type(c,"B A Y   C O I N   M A C H I N E   C O .",133,408,"7px monospace",cream);
    inked=canvas;return canvas;
  }
  function glass(canvas,g){
    if(!canvas.width)return;
    const c=canvas.getContext("2d");c.save();c.scale(canvas.width/300,canvas.height/420);c.drawImage(print(),0,0,300,420);
    for(let i=0;i<3;i++){
      const [x,y,,color]=n.stops[i],lit=g.lit&(1<<i);
      c.beginPath();c.arc(x,y,20,0,tau);c.strokeStyle=g.pulse[i]>0?"#fff2ca":lit?color:"#705f4f";c.lineWidth=lit||g.pulse[i]>0?4:1.2;c.stroke();
      circle(c,114+i*23,307,7.3,ink);circle(c,114+i*23,307,5.4,lit||g.flash>0?color:"#647975");
    }
    for(let i=0;i<2;i++){
      const a=[n.origin[i],354],b=n.tip(i,g.flippers[i]);line(c,a,b,11,ink);line(c,a,b,8.5,coral);line(c,[a[0],a[1]-1],[b[0],b[1]-1],3.3,cream);circle(c,...a,2,ink);
    }
    if(g.gate)line(c,[264,84],[289,62],2.2,"#d3ccae");
    const b=g.body,end=g.phase==="ready"?b.y+6:398;
    for(let y=end;y<416;y+=3)line(c,[271,y],[283,Math.min(416,y+2)],1.3,brass);
    if(g.phase==="live"||g.phase==="ready"||g.phase==="pick"){
      circle(c,b.x+1.6,b.y+2.8,5.6,"#34423f");
      const metal=c.createRadialGradient(b.x-1.8,b.y-2,0,b.x+.7,b.y+.8,6);
      metal.addColorStop(0,"#fff8dd");metal.addColorStop(.24,"#f3efdb");metal.addColorStop(.46,"#a9beba");metal.addColorStop(.58,"#586c70");metal.addColorStop(1,"#243e43");circle(c,b.x,b.y,5,metal);
    }
    c.restore();
  }
  let resting,reels,reelKey="";
  const covers=new Map();
  function cover(r){
    if(covers.has(r.id))return covers.get(r.id);
    const shell=document.createElement("canvas");shell.width=shell.height=256;const c=shell.getContext("2d");
    const palettes={"mango-wire":["#e1a472","#a24442"],"late-ferry":["#80a99b","#305568"],"side-door":["#d4aaa1","#593e58"],
      "after-hours":["#88a7a8","#344558"],"salt-chrome":["#c8ba90","#486f6c"],"dry-county":["#dfb47d","#7c5544"]};
    const [paper,press]=palettes[r.id];c.fillStyle=paper;c.fillRect(0,0,256,256);
    c.save();c.beginPath();c.rect(8,8,240,167);c.clip();
    if(r.id==="late-ferry"){
      circle(c,190,49,24,cream);path(c,[[-8,114],[75,104],[130,115],[193,92],[265,103],[265,181],[-8,181]],press);
      path(c,[[37,119],[169,115],[152,134],[61,137]],cream);path(c,[[64,113],[73,96],[121,96],[136,115]],ink);
      for(let i=0;i<6;i++)line(c,[56+15*i,145+i%2*5],[110+12*i,145+i%2*5],1.5,paper);
    }else if(r.id==="mango-wire"){
      for(let i=0;i<6;i++)line(c,[-10,27+i*12],[262,84+i*8],2,ink);
      for(const [x,y,k] of [[72,82,.94],[148,106,.76],[192,62,.60]]){
        c.save();c.translate(x,y);c.rotate(.42);c.scale(k,k);
        c.fillStyle=press;c.beginPath();c.ellipse(0,13,28,41,0,0,tau);c.fill();
        path(c,[[0,-23],[15,-44],[38,-45],[26,-31]],ink);line(c,[0,-22],[4,-38],3,ink);c.restore();
      }
    }else if(r.id==="dry-county"){
      circle(c,191,77,39,cream);path(c,[[0,106],[49,94],[98,116],[147,110],[202,129],[256,114],[256,178],[0,178]],press);
      for(const [x,y,h] of [[43,150,123],[105,132,71],[146,125,45]]){
        line(c,[x,y],[x,y-h],3,ink);line(c,[x-h*.14,y-h+9],[x+h*.14,y-h+9],3,ink);
      }
      c.strokeStyle=ink;c.lineWidth=1.6;c.beginPath();c.moveTo(-10,8);c.quadraticCurveTo(14,32,43,36);c.quadraticCurveTo(76,70,105,70);c.quadraticCurveTo(130,91,146,89);c.stroke();
    }else if(r.id==="salt-chrome"){
      for(let i=0;i<4;i++){c.save();c.translate(38+i*62,97-i%2*13);c.rotate(-.40);
        for(let j=0;j<3;j++){c.beginPath();c.ellipse(0,0,26-j*7,73-j*9,0,0,tau);c.strokeStyle=[press,cream,ink][j];c.lineWidth=5;c.stroke();}c.restore();}
    }else if(r.id==="side-door"){
      path(c,[[30,165],[30,37],[122,17],[122,164]],press);path(c,[[42,156],[42,46],[100,33],[100,156]],cream);
      path(c,[[62,158],[62,52],[107,33],[107,158]],ink);circle(c,97,99,3,cream);
      for(let i=0;i<5;i++)line(c,[112,157-i*3],[242,124-i*5],2,press);
    }else{
      circle(c,197,47,24,cream);
      for(let i=0;i<8;i++){const x=i*35,y=73+(i*47)%68;c.fillStyle=press;c.fillRect(x,y,32,180-y);
        for(let j=0;j<3;j++)line(c,[x+5,y+7+j*8],[x+21,y+7+j*8],2,cream);}
    }
    c.restore();c.textAlign="left";c.fillStyle=ink;c.font="italic bold 31px Georgia";c.fillText(r.title,12,204,233);
    c.font="bold 15px Georgia";c.fillText(r.artist,13,226,230);line(c,[13,235],[243,235],1,press);
    c.font="9px monospace";c.fillText("SUNDOWN BAY    ·    SEVEN INCH / 45",14,248);
    covers.set(r.id,shell);return shell;
  }
  function restingGlass(){
    if(resting)return resting;
    resting=document.createElement("canvas");resting.width=256;resting.height=512;
    glass(resting,{body:{x:277,y:393},flippers:[.4,.4],phase:"ready",lit:0,pulse:[0,0,0]});
    return resting;
  }
  function backglass(record){
    const key=record.by+"/"+record.best;
    if(reels&&key===reelKey)return reels;
    reelKey=key;reels??=document.createElement("canvas");reels.width=256;reels.height=128;
    const c=reels.getContext("2d");c.fillStyle=ink;c.fillRect(0,0,256,128);
    for(let i=0;i<6;i++)line(c,[0,6+i*3],[256,6+i*3],1,i%2?brass:"#a96156");
    type(c,"Needle Drop",128,53,"bold italic 36px Georgia",cream);
    const score=String(Math.max(2400,record.best)).padStart(6,"0");
    for(let i=0;i<6;i++){c.fillStyle="#ebcfa0";c.fillRect(52+i*26,61,23,35);type(c,score[i],63+i*26,88,"bold 28px monospace",ink);}
    type(c,record.best>2400?record.by.toUpperCase():"RAE CORDERO",128,117,"bold 14px monospace",cream);
    return reels;
  }
  function map(c,px,py,s,song){
    const x=px(n.site.x),y=py(n.site.z);
    c.save();c.translate(x,y);c.scale(s,s);
    c.fillStyle="#c2ad91";c.fillRect(-14.3,-.94,28.6,3.10);
    for(let i=0;i<16;i++){c.fillStyle=i%2?"#e3bc90":"#9b5a50";c.fillRect(-14.3+i*1.786,-.94,1.788,.52);}
    c.fillStyle=ink;c.fillRect(-.50,-.78,1,1.55);c.drawImage(restingGlass(),-.40,-.55,.8,1.18);
    for(const u of [-1.16,1.16]){c.fillStyle=ink;c.fillRect(u-.25,-.57,.50,.57);c.fillStyle="#9d9275";c.fillRect(u-.22,-.53,.44,.14);}
    if(song){c.fillStyle=ink;c.fillRect(-3.73,-.80,1.42,1.36);c.drawImage(cover(song),-3.66,-.73,1.28,1.22);}
    c.restore();
  }
  function world(view,model,record,song){
    model("arcade-table-print",g=>{
      const pts=[[-.4,1.092,.67,0,0],[.4,1.092,.67,1,0],[.4,1.092,-.67,1,1],[-.4,1.092,-.67,0,1]];
      for(const i of [0,1,2,0,2,3])g.vertices.push(...pts[i],0);
    });
    model("arcade-score-reels",g=>{
      const pts=[[-.462,1.78,.545,0,0],[.462,1.78,.545,1,0],[.462,1.15,.545,1,1],[-.462,1.15,.545,0,1]];
      for(const i of [0,1,2,0,2,3])g.vertices.push(...pts[i],0);
    });
    view.drawPrint("arcade-table-print",restingGlass(),1,n.site.x,0,n.site.z,0);
    view.drawPrint("arcade-score-reels",backglass(record),record.best,n.site.x,0,n.site.z,0);
    model("arcade-window-sleeve",g=>{
      const pts=[[-3.66,2.42,.70,0,0],[-2.38,2.42,.70,1,0],[-2.38,1.14,.70,1,1],[-3.66,1.14,.70,0,1]];
      for(const i of [0,1,2,0,2,3])g.vertices.push(...pts[i],0);
    });
    view.drawPrint("arcade-window-sleeve",cover(song),1,n.site.x,0,n.site.z,0);
  }
  window.BayNeedleArt={glass,map,world,cover};
})();
