(() => {
  const W=1000,H=500,ink="#263b3d",red="#a64534",paper="#decc9e";
  const plates=new Map();
  const movingInserts=new Set(["pass","key","driverPrint","notice","negative","timetable","rubbing"]);
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
    if(id==="pass"){
      stock(g,-291,-135,584,270);g.fillStyle="#296d64";g.fillRect(-291,-135,584,55);
      label(g,-264,-97,"PORT SOL   •   PUBLIC LANDING",22,"#f5e5bd","monospace","bold");
      label(g,-262,-21,"First Crossing",50);label(g,-260,20,"MARLIN PIER   /   NORTH FLOAT",19,red,"monospace");
      line(g,-261,42,258,42,"#9a896b",2);label(g,-256,83,"Good for passage both ways",21,ink,"Georgia","italic");
      for(let i=0;i<16;i++)line(g,191,-78+i*12,191,-71+i*12,"#a79776",2);
      g.save();g.translate(233,25);g.rotate(-Math.PI/2);label(g,-59,3,"Nº 0001",22,red,"monospace","bold");g.restore();
    }else if(id==="key"){
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
    }else if(id==="driverPrint"){
      stock(g,-304,-187,608,374);
      g.fillStyle="#343535";g.fillRect(-287,-173,574,322);
      label(g,-283,174,"13",18,red,"monospace","bold");label(g,187,174,"M. Vega",21,ink,"Georgia","italic");
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
  function show(canvas,id,age,table,frame){
    // Other chapters paint their own stills on entry. Leave that canvas in
    // place until the director advances, including between animation frames.
    if(!movingInserts.has(id))return;
    const g=canvas.getContext("2d",{alpha:false});
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
    const f=Math.min(1,age/5);g.setTransform(1,0,0,1,0,0);g.drawImage(plate(id),-4-5*f,-2-3*f,W+10+10*f,H+5+6*f);
    if(id==="driverPrint"&&frame){
      const img=BayLotNegative.photo(frame);
      if(img?.naturalWidth){
        g.save();g.translate(-4-5*f,-2-3*f);g.scale((W+10+10*f)/W,(H+5+6*f)/H);
        g.translate(500,254);g.rotate(-.031);g.drawImage(img,-286,-173,572,321.75);
        label(g,-243,174,BayLotNegative.locations[frame.place].caption,19,ink,"Georgia","italic");g.restore();
      }
    }else if(id==="negative"&&frame){
      const img=BayLotNegative.photo(frame);
      if(img?.naturalWidth){
        g.save();g.translate(-4-5*f,-2-3*f);g.scale((W+10+10*f)/W,(H+5+6*f)/H);
        g.translate(500,254);g.rotate(.045);g.fillStyle="#292522";g.fillRect(-333,-151,660,300);
        g.drawImage(img,-244,-151,488,274.5);
        label(g,-301,141,"MV   /   "+frame.frame+"   /   "+BayLotNegative.captions[frame.frame],13,"#fee8b4","monospace");
        g.restore();
      }
    }
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
  function tone(photo){
    const c=photo.getContext("2d"),image=c.getImageData(0,0,photo.width,photo.height),p=image.data;
    let grain=561;
    for(let i=0;i<p.length;i+=4){
      grain=(Math.imul(grain,1664525)+1013904223)>>>0;
      const grey=13+(p[i]*.29+p[i+1]*.57+p[i+2]*.14)*.89+(grain>>>26)*.16-5;
      p[i]=grey*1.05;p[i+1]=grey*.99;p[i+2]=grey*.86;
    }
    c.putImageData(image,0,0);
  }
  function sleeve(canvas,pull,photo){
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
    const g=canvas.getContext("2d"),travel=pull*pull*(3-2*pull);
    g.fillStyle="#3b4849";g.fillRect(0,0,W,H);
    for(let i=0;i<13;i++)line(g,0,5+i*43,W,28+i*43,i%3?"#404e4e":"#334344",2);
    g.save();g.translate(77,96);g.rotate(-.034);
    g.save();g.translate(34+travel*421,4-travel*14);g.rotate(travel*.061);
    g.fillStyle="#263334";g.fillRect(4,5,416,326);g.fillStyle="#ede6d2";g.fillRect(0,0,416,326);
    g.drawImage(photo,15,15,386,217);
    label(g,19,260,"Luis, first boat.",25,"#474441","Georgia","italic");
    label(g,19,295,"Third bolt. Keep the blue tin in.",22,"#474441","Georgia","italic");
    g.restore();
    g.fillStyle="#b3a47f";g.fillRect(5,6,429,325);g.fillStyle="#d9ccac";g.fillRect(0,0,426,324);
    for(let i=0;i<85;i++)line(g,(i*139)%412,(i*49)%321,(i*139)%412+6,(i*49)%321,"#c9bb99",.8);
    g.fillStyle="#326a70";g.fillRect(0,30,426,44);label(g,24,60,"COAST CAMERA",28,"#ecdfb9","Georgia","bold");
    label(g,25,105,"PRINT ENVELOPE   /   Nº 0187",17,red,"monospace","bold");
    line(g,24,126,395,126,"#96896d");label(g,27,171,"Vega",35,ink,"Georgia","italic");
    label(g,27,211,"Port Sol · early shift",26,ink,"Georgia","italic");
    line(g,25,231,395,231,"#a3987e");label(g,25,276,"ONE CONTACT PRINT",14,ink,"monospace");
    line(g,412,2,412,322,"#9c9075",2);g.restore();
  }
  function roadMap(canvas,table,streets){
    if(canvas.width!==W||canvas.height!==H){canvas.width=W;canvas.height=H;}
    const g=canvas.getContext("2d"),px=x=>301+x*1.28,py=z=>245-z*1.06;
    g.setTransform(1,0,0,1,0,0);g.fillStyle="#384448";g.fillRect(0,0,W,H);
    g.save();g.translate(23,16);g.rotate(-.009);stock(g,0,0,949,467);
    g.fillStyle="#e7d9b3";g.fillRect(14,14,596,433);
    g.fillStyle="#96b9ad";g.beginPath();g.moveTo(535,14);g.lineTo(543,138);g.lineTo(533,237);g.lineTo(547,369);g.lineTo(535,447);g.lineTo(610,447);g.lineTo(610,14);g.fill();
    const west=px(-173),east=px(149),north=py(163),south=py(-160);
    for(const n of streets){
      line(g,px(n),north,px(n),south,"#978e71",8);line(g,west,py(n),east,py(n),"#978e71",8);
    }
    for(const n of streets){
      line(g,px(n),north,px(n),south,"#f7e8c6",5.5);line(g,west,py(n),east,py(n),"#f7e8c6",5.5);
    }
    label(g,34,47,"SUNDOWN BAY",24,"#40625d","Georgia","bold");
    label(g,34,65,"MOTOR COURT STREET GUIDE",11,ink,"monospace");
    g.save();g.translate(574,311);g.rotate(-1.49);label(g,0,0,"Sundown Bay",19,"#537f76","Georgia","italic");g.restore();
    for(const x of [315,624]){line(g,x,5,x,461,"#b9a987",2);line(g,x+2,5,x+2,461,"#eddfbe",1.5);}
    g.strokeStyle="#a74736";g.lineWidth=3.4;g.lineJoin=g.lineCap="round";
    g.save();g.beginPath();g.rect(14,14,596,433);g.clip();g.beginPath();
    table.paths[table.pick].forEach((p,i)=>{const x=px(p.x),y=py(p.z);if(i)g.lineTo(x,y);else g.moveTo(x,y);});g.stroke();
    const driver=table.start;g.fillStyle="#304e55";g.beginPath();g.arc(px(driver.x),py(driver.z),4.5,0,Math.PI*2);g.fill();g.restore();
    for(const [id,name,at,dx,dy] of [
      ["wheel","Coast Wheel",BayExposure.photoRuns.wheel.frame,-94,-12],
      ["luna","Cine Luna",BayExposure.photoRuns.luna.frame,-82,-13],
      ["port","Lot 14",BayExposure.dock,13,19]]){
      const x=px(at.x),y=py(at.z);g.strokeStyle=table.pick===id?red:ink;g.lineWidth=table.pick===id?3:1.5;
      g.beginPath();g.ellipse(x,y,table.pick===id?11:5,table.pick===id?8:5,-.35,0,Math.PI*2);g.stroke();
      label(g,x+dx,y+dy,name,17,ink,"Georgia","italic");
    }
    const left=652;label(g,left,69,"Marlin Motor Court",27,ink,"Georgia","italic");
    line(g,left,87,920,87,ink,1.5);label(g,left,111,"OCEAN DRIVE  /  ROOM 14",14,red,"monospace");
    label(g,left,170,"Mara’s last roll",33,ink,"Georgia","bold");
    const details=table.pick==="wheel"?["The Coast Wheel","North on Ocean Drive.","Keep the wheel on my right."]:
      table.pick==="luna"?["The Luna marquee","North on Luna Boulevard.","My window faces the gold trim."]:
      ["Straight to the port","The red notice on the fence.","Leave the last frame for Luis."];
    label(g,left,220,details[0],24,red,"Georgia","italic");label(g,left,260,details[1],19);label(g,left,290,details[2],18);
    line(g,left,331,920,331,"#a89777");label(g,left,366,"14   /   LOT 14",16,ink,"monospace","bold");
    label(g,left,400,"Return map to glove box.",18,ink,"Georgia","italic");g.restore();
  }
  window.BayRecordArt={show,world,sleeve,tone,roadMap};
})();
