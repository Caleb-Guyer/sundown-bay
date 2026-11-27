/* Palm County's old exposure lamp and the contact prints in the two windows. */
(() => {
  "use strict";
  const sites={
    clinic:{x:-94.6,z:57.74,name:"Palm County waiting room",kind:"clinic"},
    laundry:{x:153.45,z:-38.45,name:"Romy’s print rack · Marlin laundry",kind:"linen-print"}
  };
  const inks=["#b1c6bf","#7caaa9","#447c90","#235572","#193c58"];
  const wraps=["Left of the key","Over the bow","Right of the key"];
  const integer=(n,max)=>Number.isInteger(n)&&n>=0&&n<=max;
  function proof(p){
    if(!p||!integer(p.angle,7)||!integer(p.wrap,2)||!integer(p.tone,4)||!Number.isSafeInteger(p.id)||p.id<1)return null;
    return {angle:p.angle,wrap:p.wrap,tone:p.tone,id:p.id};
  }
  function read(raw){
    if(!Number.isSafeInteger(raw?.rev)||raw.rev<1)return null;
    const pocket=proof(raw.pocket),clinic=proof(raw.clinic),laundry=proof(raw.laundry);
    return pocket||clinic||laundry?{rev:raw.rev,pocket,clinic,laundry}:null;
  }
  function merge(local,incoming){
    const other=read(incoming);
    if(!other)return local;
    if(!local)return other;
    const recent=other.rev>local.rev?other:local;
    const later=(a,b)=>!a||b&&b.id>a.id?b:a;
    const clinic=later(local.clinic,other.clinic),laundry=later(local.laundry,other.laundry);
    const p=recent.pocket;
    return {rev:recent.rev,clinic,laundry,pocket:p&&p.id!==clinic?.id&&p.id!==laundry?.id?p:null};
  }
  class Press{
    constructor(){this.angle=1;this.wrap=2;this.phase="arrange";this.seconds=0;}
    turn(){if(this.phase==="arrange")this.angle=(this.angle+1)%8;}
    slide(){if(this.phase==="arrange")this.wrap=(this.wrap+1)%3;}
    shutter(now){
      if(this.phase==="arrange"){this.start=now;this.phase="exposing";}
      else if(this.phase==="exposing"){this.seconds=this.age(now);this.phase="washed";}
    }
    age(now){return this.phase==="exposing"?Math.min(8,Math.max(0,(now-this.start)/1000)):this.seconds;}
    tone(now){return Math.min(4,Math.floor(this.age(now)/1.30));}
    state(now){return {angle:this.angle,wrap:this.wrap,tone:this.tone(now)};}
    reset(){this.phase="arrange";this.seconds=0;}
  }
  function impression(c,p,objects=false){
    c.save();c.translate(311,174);c.rotate((p.angle-1)*Math.PI/4-.29);
    c.fillStyle=objects?"#827453":"#e6ead8";
    c.fillRect(-76,-9,147,18);c.fillRect(34,4,12,23);c.fillRect(57,4,13,18);
    c.beginPath();c.ellipse(-81,0,32,40,0,0,Math.PI*2);c.ellipse(-81,0,15,20,0,0,Math.PI*2);c.fill("evenodd");
    if(objects){c.fillStyle="#baa97b";c.fillRect(-51,-6,117,3);}
    c.restore();
    c.save();c.translate([160,251,423][p.wrap],[216,103,212][p.wrap]);c.rotate(.26);
    c.fillStyle=objects?"#ae5f52":"#b8d3d0";
    c.beginPath();c.moveTo(-37,-18);c.lineTo(-15,-8);c.quadraticCurveTo(0,-29,18,-8);c.lineTo(39,-20);c.lineTo(34,0);c.lineTo(41,16);c.lineTo(17,9);c.quadraticCurveTo(0,29,-15,9);c.lineTo(-39,18);c.closePath();c.fill();
    c.strokeStyle=objects?"#e7d2a7":"#e1e8d8";c.lineWidth=2;
    for(const x of [-10,-2,6]){c.beginPath();c.moveTo(x,-13);c.quadraticCurveTo(x+11,-3,x+3,13);c.stroke();}
    c.restore();
  }
  function paint(canvas,p,patient,phase="hung",age=0){
    if(canvas.width!==620)canvas.width=620;if(canvas.height!==340)canvas.height=340;
    const c=canvas.getContext?.("2d");if(!c)return;
    c.fillStyle="#363d39";c.fillRect(0,0,620,340);c.save();c.translate(4,-2);c.rotate(.009);
    c.fillStyle="#e2d6b7";c.fillRect(34,15,549,309);
    const objects=phase==="arrange"||phase==="exposing";
    c.fillStyle=phase==="arrange"?"#a5ad8a":inks[p.tone];
    // A flat brush leaves dry bristles at either end of each pass.
    for(let i=0;i<10;i++){
      const x=51+(i*7%11),end=566-(i*13%9),y=33+i*22.3;
      c.fillRect(x,y,end-x,25);
      for(let j=0;j<4;j++)c.fillRect(x-2-(i+j)%5,y+j*5.7,end-x+9-(i*j)%5,1.4);
    }
    c.fillStyle="rgba(239,232,200,.25)";
    for(let i=0;i<96;i++)c.fillRect(61+(i*139)%493,39+(i*71)%210,i%4+.7,.75);
    c.save();c.beginPath();c.rect(53,32,511,228);c.clip();impression(c,p,objects);c.restore();
    c.fillStyle="#455852";c.font="bold 12px monospace";c.fillText("PALM COUNTY   /   CONTACT PRINT",54,282);
    c.font="italic 21px Georgia,serif";c.fillText(patient,55,308,325);
    c.textAlign="right";c.font="12px monospace";
    c.fillText(phase==="exposing"?age.toFixed(1)+" s   •   LAMP ON":phase==="arrange"?"HOUSE KEY  /  MINT PAPER":"ONE SHIRT, ONE KEY",562,304);
    if(objects){
      for(let i=0;i<inks.length;i++){c.fillStyle=inks[i];c.fillRect(410+i*30,270,28,8);}
      if(phase==="exposing"){const x=410+Math.min(age/6.5,1)*146;c.fillStyle="#5b452d";c.beginPath();c.moveTo(x,279);c.lineTo(x-4,286);c.lineTo(x+4,286);c.fill();}
    }
    c.restore();
    canvas.setAttribute("aria-label",patient+"’s house key and peppermint wrapper · "+phase);
  }
  function stand(g){
    for(const x of [-.32,.32])g.box(x,.67,0,.044,1.34,.045,"#806d52");
    g.box(0,1.18,0,.82,.49,.05,"#5f695c");g.box(0,1.40,0,.87,.04,.07,"#a48c62");
  }
  function world(model,list,see,book){
    for(const place of ["clinic","laundry"]){
      const p=sites[place],x=p.x+(place==="clinic"?1.17:.73),z=p.z+(place==="clinic"?-.68:0);
      if(!see(p,48))continue;
      const yaw=place==="clinic"?0:-Math.PI/2;
      model("clinic-key-rack",stand);list.push(["clinic-key-rack",x,.14,z,yaw]);
      const print=book?.[place];if(!print)continue;
      const face=(name,dx,y,dz,rot,build)=>{
        model(name,build);list.push([name,x+dx*Math.cos(yaw)+dz*Math.sin(yaw),y+.14,z-dx*Math.sin(yaw)+dz*Math.cos(yaw),yaw,0,rot]);
      };
      face("clinic-key-card-"+print.tone,0,1.16,.035,0,g=>{
        g.box(0,0,0,.58,.33,.012,"#e2d6b7");g.box(0,.019,.008,.53,.246,.006,inks[print.tone]);
      });
      face("clinic-key-silhouette",0,1.17,.050,-((print.angle-1)*Math.PI/4-.29),g=>{
        g.box(.011,0,0,.15,.018,.005,"#e6ead8");g.box(.054,-.012,0,.014,.032,.006,"#e6ead8");
        g.box(.077,-.008,0,.014,.023,.006,"#e6ead8");
        for(let i=0;i<8;i++){
          const a=i*Math.PI/4,b=(i+1)*Math.PI/4;
          g.pole([-.074+.026*Math.cos(a),.030*Math.sin(a),0],[-.074+.026*Math.cos(b),.030*Math.sin(b),0],.009,"#e6ead8",4);
        }
      });
      face("clinic-mint-paper",[-.152,-.058,.117][print.wrap],print.wrap===1?1.24:1.13,.054,0,g=>{
        g.box(0,0,0,.047,.027,.004,"#d1e1d7");
        for(const s of [-1,1])g.tri([s*.015,0,.003],[s*.042,-.017,.003],[s*.04,.017,.003],"#b8d3d0");
      });
    }
  }
  function map(c,px,py,s,book){
    for(const [id,p] of Object.entries(sites)){
      const x=px(p.x+(id==="clinic"?1.17:.73)),y=py(p.z+(id==="clinic"?-.68:0));
      if(x< -12||y< -12||x>c.canvas.width+12||y>c.canvas.height+12)continue;
      c.save();c.translate(x,y);c.rotate(id==="clinic"?0:-Math.PI/2);c.scale(s,s);
      c.fillStyle="#806d52";c.fillRect(-.44,-.12,.88,.24);
      if(book?.[id]){c.fillStyle="#eadcbb";c.fillRect(-.3,-.24,.6,.32);c.fillStyle=inks[book[id].tone];c.fillRect(-.26,-.21,.52,.22);}
      c.restore();
    }
  }
  window.BayKeyPrint={sites,wraps,read,merge,Press,proof,paint,world,map};
})();
