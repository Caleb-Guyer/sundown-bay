(() => {
  const W=1000,H=500,ink="#263b3d",red="#a64534",paper="#decc9e";
  const plates=new Map();
  function label(g,x,y,text,size,color=ink,family="Georgia",weight="normal"){
    g.font=weight+" "+size+"px "+family;g.fillStyle=color;g.fillText(text,x,y);
  }
  function line(g,x,y,u,v,color,w=1){
    g.beginPath();g.moveTo(x,y);g.lineTo(u,v);g.strokeStyle=color;g.lineWidth=w;g.stroke();
  }
  function stock(g,x,y,w,h){
    g.fillStyle="#0d1e20";g.fillRect(x+6,y+10,w,h);g.fillStyle=paper;g.fillRect(x,y,w,h);
    for(let i=0;i<320;i++){const a=x+((i*851)%1009)/1009*w,b=y+((i*263)%503)/503*h;
      line(g,a,b,a+2+i%9,b+.2,i%4?"#d6c599":"#e8d8b0",.65);}
  }
  function print(g,id){
    const bg=g.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#192d31");bg.addColorStop(.63,"#57473b");bg.addColorStop(1,"#152426");
    g.fillStyle=bg;g.fillRect(0,0,W,H);
    for(let i=0;i<18;i++)line(g,0,30*i,1000,22+30*i,i%2?"#47443a":"#383d36",1+i%3);
    g.translate(500,254);g.rotate(id==="key"?-.087:id==="negative"?.045:-.031);
    if(id==="key"){
      stock(g,-335,-133,662,266);line(g,-335,-132,-4,42,"#b5a57f",2);line(g,-4,42,327,-132,"#b5a57f",2);
      label(g,-297,-83,"MARLIN MOTOR COURT",17,red,"monospace","bold");label(g,-299,-53,"Ocean Drive, Sundown Bay",15,ink);
      label(g,-290,97,"For the driver in fourteen.",31,ink,"Georgia","italic");
      g.translate(77,-2);g.rotate(.32);
      g.fillStyle="#1e5f61";g.beginPath();g.moveTo(-30,-89);g.lineTo(31,-89);g.lineTo(53,63);g.quadraticCurveTo(5,101,-51,65);g.closePath();g.fill();
      g.strokeStyle="#d8c98e";g.lineWidth=2;g.stroke();
      label(g,-29,10,"14",47,"#f0ddb0","Georgia","bold");label(g,-35,37,"MARLIN",15,"#e3cfa6","monospace","bold");
      g.strokeStyle="#b4a471";g.lineWidth=6;g.beginPath();g.ellipse(0,-89,21,16,0,0,Math.PI*2);g.stroke();
      g.fillStyle="#bfa367";g.beginPath();g.ellipse(24,-87,15,20,.55,0,Math.PI*2);g.fill();
      g.fillRect(27,-91,92,10);g.fillRect(95,-84,9,13);g.fillRect(111,-84,7,8);
    }else if(id==="notice"||id==="negative"){
      g.fillStyle=id==="negative"?"#28231f":"#e8d7ae";g.fillRect(-347,-165,688,331);
      g.save();g.translate(-333,-151);BayExposureArt.drawPhoto(g,660,293);g.restore();
      if(id==="negative"){
        for(let x=-334;x<330;x+=26){g.fillStyle="#c6a276";g.fillRect(x,-160,12,5);g.fillRect(x,153,12,5);}
        label(g,-301,139,"MV    35–14    PORT SOL",12,"#fee8b4","monospace","bold");
      }else label(g,-330,179,"PORT SOL   /   GATE FOURTEEN",13,"#e7cf9e","monospace");
    }else{
      stock(g,-329,-165,658,326);
      label(g,-296,-112,"PORT SOL FERRY CO.",32,ink,"Georgia","bold");
      label(g,-294,-83,"LANDING 14     •     DISPATCH COPY",16,red,"monospace","bold");
      line(g,-297,-67,293,-67,ink,2);
      const rows=[["05 30","East float","Stores"],["06 00","West landing","Night shift"],["06 35","East float","Passengers"]];
      rows.forEach(([a,b,c],i)=>{const y=-33+i*39;label(g,-291,y,a,21,ink,"monospace");label(g,-140,y,b,21);label(g,127,y,c,20);line(g,-294,y+10,294,y+10,"#ab9c7a");});
      if(id==="rubbing"){label(g,-290,113,"Public landing. Access retained.",27,ink,"Georgia","italic");label(g,183,143,"D. Cruz",20,red,"Georgia","italic");}
      else{g.fillStyle="#ad9d77";g.fillRect(-300,81,590,39);line(g,-299,83,285,83,"#c8b994",3);
        label(g,-276,108,"Amended across reverse",19,"#6e6b54","Georgia","italic");}
    }
  }
  function plate(id){
    let c=plates.get(id);if(c)return c;
    c=document.createElement("canvas");c.width=W;c.height=H;const g=c.getContext("2d",{alpha:false});
    print(g,id);plates.set(id,c);return c;
  }
  function show(canvas,id,age,table){
    if(!id)return;const g=canvas.getContext("2d",{alpha:false});
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
    const f=Math.min(1,age/5);g.setTransform(1,0,0,1,0,0);g.drawImage(plate(id),-4-5*f,-2-3*f,W+10+10*f,H+5+6*f);
    if(!table)return;
    g.save();g.translate(500,254);g.rotate(-.031);
    for(let i=0;i<32;i++)if(!table.bins[i]){g.fillStyle=i%3?"#c1b18c":"#bbab85";g.fillRect(-299+i*18.6,78,19.1,68);}
    const x=-299+table.cursor*596;g.translate(x,112);g.rotate(.68);
    g.fillStyle="#bf8c46";g.fillRect(-6,-147,12,130);g.fillStyle="#e8cca0";g.beginPath();g.moveTo(-6,-17);g.lineTo(0,0);g.lineTo(6,-17);g.fill();
    g.fillStyle=ink;g.beginPath();g.moveTo(-2,-5);g.lineTo(0,0);g.lineTo(2,-5);g.fill();g.restore();
  }
  function world(view,model,book){
    const p=BayPublicRecord.spots.gate;
    model("lot14/stand",g=>{for(const z of [-.71,.71]){g.box(0,.64,z,.082,1.24,.093,"#7e7760");g.box(0,.055,z,.42,.064,.22,"#655e51");}
      g.box(0,1.21,0,.12,.95,1.82,"#475b59");g.box(.073,1.22,0,.033,.80,1.64,"#d7c69b");});
    view.draw("lot14/stand",p.x,.06,p.z);
    const filed=book.stage==="filed",color=filed?"#54877d":"#a36045",name=filed?"lot14/posted":"lot14/taped";
    model(name,g=>{g.box(.097,1.44,.15,.018,.07,1.05,color);for(let i=0;i<4;i++)g.box(.099,1.31-i*.078,-.14,.018,.022,.91+i%2*.24,"#777a66");
      g.box(.102,1.01,.02,.019,.104,1.18,filed?"#8ca796":"#b5a47d");});view.draw(name,p.x,.06,p.z);
  }
  window.BayRecordArt={show,world};
})();
