/* The brass face in Dalia's cabin and the entry she keeps on carbon paper. */
(() => {
  "use strict";
  const tau=Math.PI*2,ink="#263e3b",paper="#e6d6ad",rust="#994c36";
  function line(c,x,y,xx,yy,colour,width){
    c.strokeStyle=colour;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);c.stroke();
  }
  function text(c,words,x,y,font,colour,align="left"){
    c.font=font;c.textAlign=align;c.fillStyle=colour;c.fillText(words,x,y);
  }
  function circle(c,x,y,r,colour){c.fillStyle=colour;c.beginPath();c.arc(x,y,r,0,tau);c.fill();}
  let dial=null;
  function face(){
    if(dial)return dial;
    dial=document.createElement("canvas");dial.width=dial.height=160;
    const c=dial.getContext("2d");
    circle(c,81,83,75,"#273735");circle(c,79,79,75,"#a38956");circle(c,79,79,72,"#e0c391");
    circle(c,79,79,69,"#5d583f");circle(c,79,79,66,"#ddcfac");
    for(let i=0;i<60;i++){
      const a=i*tau/60,s=Math.sin(a),k=Math.cos(a),r=i%5?60:55;
      line(c,79+r*s,79-r*k,79+63*s,79-63*k,ink,i%5?1:2.3);
      if(i%5===0)text(c,String(i===0?12:i/5),79+47*s,84-47*k,"bold 15px Georgia",ink,"center");
    }
    text(c,"PORT SOL",79,62,"bold 7px monospace","#645d4c","center");
    text(c,"MARINE CLOCK",79,104,"6px monospace","#645d4c","center");return dial;
  }
  function clock(canvas,second){
    if(canvas._second===second)return;canvas._second=second;
    const c=canvas.getContext("2d");c.clearRect(0,0,160,160);c.drawImage(face(),0,0);
    for(const [angle,len,width,col,tail] of [[second/43200,31,4,ink,5],[second/3600,48,2.7,ink,6],[second/60,58,1.5,rust,11]]){
      const s=Math.sin(angle*tau),k=Math.cos(angle*tau);
      line(c,79-tail*s,79+tail*k,79+len*s,79-len*k,col,width);
    }
    circle(c,79,79,3.3,"#866b40");
  }
  function docket(canvas,r,credit,transfer){
    const w=900,h=458;if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}
    const c=canvas.getContext("2d",{alpha:false}),bed=c.createLinearGradient(0,0,w,h);
    bed.addColorStop(0,"#253d39");bed.addColorStop(1,"#645846");c.fillStyle=bed;c.fillRect(0,0,w,h);
    c.save();c.translate(447,221);c.rotate(-.027);c.fillStyle="#272f29";c.fillRect(-320,-168,666,356);
    c.fillStyle="#abab95";c.fillRect(-326,-172,664,355);c.fillStyle=paper;c.fillRect(-332,-177,665,355);
    for(let y=-162;y<173;y+=19){circle(c,-314,y,3.2,"#6d705a");line(c,-299,y-5,-299,y+3,"#b3a98a",1);}
    text(c,"PORT SOL FERRY CO.",-276,-127,"bold 32px Georgia",ink);
    text(c,"ENGINE ROOM COPY",302,-147,"bold 12px monospace",rust,"right");
    text(c,"SERIES B  /  0414",302,-125,"13px monospace",ink,"right");
    line(c,-276,-108,302,-108,ink,2);text(c,"DEPARTURE BOOK    •    M/V LUZ", -275,-83,"bold 15px monospace",ink);
    text(c,"FROM", -274,-40,"12px monospace",rust);text(c,"MARLIN PIER",-274,-15,"bold 20px monospace",ink);
    text(c,"TO",-58,-40,"12px monospace",rust);text(c,"NORTH FLOAT",-58,-15,"bold 20px monospace",ink);
    line(c,-276,2,302,2,"#a99e7d",1);
    text(c,"Bell rung", -275,37,"italic 20px Georgia",ink);
    text(c,BaySixSharp.time(r.second),-124,40,"bold 32px monospace",rust);
    text(c,"ON BOARD",224,22,"12px monospace",rust,"center");text(c,r.luis==="aboard"?"18":"17",224,48,"bold 26px monospace",ink,"center");
    text(c,r.luis==="aboard"?"Luis made the gate. Two tins under his seat.":"Luis still on the pier. Two tins for the next boat.",-276,79,"italic 19px Georgia",ink);
    line(c,-276,100,302,100,"#a99e7d",1);text(c,"DISPATCHER", -274,132,"12px monospace",rust);
    text(c,"D. Cruz",-154,137,"italic 28px Georgia",ink);
    if(credit)text(c,credit==="signed"?"Filed under Dalia Cruz":"Filed under Port Sol night shift",301,133,"italic 16px Georgia",ink,"right");
    if(transfer){const f=transfer.first;text(c,"Alma’s first stub   ·   "+(f.caught?"Connection made":"Afternoon transfer")+"   ·   "+(f.tenths/10).toFixed(1)+" s",-275,162,"italic 15px Georgia",ink);}
    c.restore();
  }
  function stub(canvas,r,book){
    canvas.width=900;canvas.height=458;const c=canvas.getContext("2d");
    c.fillStyle="#304745";c.fillRect(0,0,900,458);c.save();c.translate(449,226);c.rotate(-.033);
    c.fillStyle="#203533";c.fillRect(-326,-157,660,332);c.fillStyle=r.caught?"#e5bb83":"#c5c6ad";c.fillRect(-333,-164,660,332);
    for(let y=-144;y<162;y+=20){circle(c,229,y,2.5,"#786f58");}
    text(c,"BAY TRANSIT    /    CLINIC CONNECTION",-302,-121,"bold 15px monospace",ink);
    text(c,r.caught?"Good for one transfer":"Good on the afternoon bus",-302,-65,"bold 34px Georgia",ink);
    line(c,-302,-39,203,-39,ink,2);
    text(c,"NORTH FLOAT   ·   M/V LUZ",-302,-7,"bold 18px monospace",ink);
    text(c,(r.luis==="aboard"?"18 passengers":"17 passengers")+"    /    "+(r.tenths/10).toFixed(1)+" seconds",-302,27,"19px monospace",ink);
    text(c,r.held?"Two bells at the amber buoy.":"No hold called from the water.",-302,65,"italic 21px Georgia",ink);
    text(c,"Alma Reyes",-300,130,"italic 30px Georgia",rust);
    text(c,"Best crossing   "+(book.best.tenths/10).toFixed(1)+" s",198,130,"15px monospace",ink,"right");
    text(c,"STUB",277,-107,"bold 15px monospace",ink,"center");
    for(let i=0;i<3;i++)circle(c,277,-53+i*62,12,i===(r.caught?0:2)?"#304745":"#b09570");
    c.restore();
  }
  const replies={marlin:"There’s the motel. My sister used to leave the porch lamp on till my last run.",
    mercado:"Mercado. If Rosario asks, tell her the soup made it across upright this time.",
    port:"Port Sol. Luis always folds his ticket twice so it fits under the latch of his tin.",
    luna:"The Luna. There used to be a balcony seat for whoever brought the last bus in."};
  function through(canvas,book,table){
    canvas.width=900;canvas.height=458;const c=canvas.getContext("2d"),stops=BayTransit.stops;
    c.fillStyle="#293d3b";c.fillRect(0,0,900,458);c.save();c.translate(450,228);c.rotate(-.018);
    c.fillStyle="#172d2a";c.fillRect(-328,-168,679,351);
    c.fillStyle=book.first.caught?"#ecd6a1":"#d0d4bc";c.fillRect(-337,-176,680,352);
    for(let i=0;i<16;i++){circle(c,-337,-153+i*20,3.4,"#293d3b");circle(c,343,-153+i*20,3.4,"#293d3b");}
    text(c,"PORT SOL FERRY CO.    /    BAY TRANSIT",-304,-138,"bold 15px monospace",ink);
    text(c,"North Float through ticket",-306,-90,"bold 38px Georgia",ink);
    text(c,(book.first.caught?"MORNING":"AFTERNOON")+" CONNECTION    ·    COACH 608",-303,-58,"bold 15px monospace",rust);
    line(c,-304,-40,308,-40,ink,2);
    for(const [i,stop] of stops.entries()){
      const x=-301+i*154,marked=book.punches.includes(stop.id),selected=(table.onBus||table.arrival)&&i===table.index;
      if(selected){c.fillStyle="#d4b77f";c.fillRect(x-3,-28,141,111);}
      text(c,String(i+1).padStart(2,"0"),x+4,-3,"13px monospace",rust);
      text(c,["Marlin","Mercado","Port Sol","Cine Luna"][i],x+4,23,"bold 22px Georgia",ink);
      c.strokeStyle="#9d987a";c.lineWidth=1.4;c.beginPath();c.arc(x+62,56,13,0,tau);c.stroke();
      if(marked){circle(c,x+62,56,10,"#304745");line(c,x+58,48,x+67,48,"#a38b66",1.7);}
      if(i<3)line(c,x+144,-23,x+144,80,"#b0a17c",1);
    }
    line(c,-304,93,308,93,ink,1);
    text(c,table.arrival?"Rear door   /   "+stops[table.index].short:table.onBus?"Window seat   /   "+stops[table.index].short:"Issued at North Float",-301,123,"italic 22px Georgia",ink);
    text(c,book.punches.length+" OF 4 PUNCHED",307,149,"bold 13px monospace",rust,"right");
    if(table.onBus){const x=-239+table.index*154;
      c.fillStyle="#62685a";c.beginPath();c.moveTo(x-13,62);c.lineTo(x-9,49);c.lineTo(x+23,74);c.lineTo(x+56,130);c.lineTo(x+44,136);c.closePath();c.fill();
      circle(c,x+17,80,5,"#c8b07f");}
    c.restore();
  }
  function overhead(canvas,w,beat){
    const width=Math.max(320,Math.round(Math.min(innerWidth,960))),h=Math.round(width*innerHeight/innerWidth);
    if(canvas.width!==width||canvas.height!==h){canvas.width=width;canvas.height=h;}
    const c=canvas.getContext("2d"),p=w.dock,v=w.boat,span=beat==="wide"?27:beat==="away"?24:19;
    const s=Math.min(width/span,h/12),cx=p.x+(beat==="wide"?.35:2.0)+w.away*.19,cz=p.z+.3+w.away*.32;
    const px=x=>width/2+(x-cx)*s,py=z=>h/2-(z-cz)*s;
    const water=c.createLinearGradient(0,h,width,0);water.addColorStop(0,"#527b80");water.addColorStop(.74,"#779895");water.addColorStop(1,"#b8b6a0");
    c.fillStyle=water;c.fillRect(0,0,width,h);
    for(let i=0;i<105;i++){
      const x=(i*89%257)/257*width+3*Math.sin(w.age*.56+i),y=(i*53%113)/113*h;
      line(c,x,y,x+s*(.18+(i%5)*.10),y-.03*s,"rgba(231,222,184,.39)",1.4);
    }
    function rect(x,z,dx,dz,col){c.fillStyle=col;c.fillRect(px(x),py(z+dz),dx*s,dz*s);}
    const d=BayMarina.docks[0];
    function planks(x,z,width,depth){
      rect(x+.26,z-.29,width,depth,"#4e6660");rect(x,z,width,depth,"#bc9e7d");
      for(let k=0;k<width;k+=.42){rect(x+k,z,Math.min(.39,width-k),depth,Math.floor(k/.42)%3?"#bca183":"#c3aa8a");
        for(const end of [.16,depth-.16])circle(c,px(x+k+.18),py(z+end),Math.max(.45,.015*s),"#736b55");}
    }
    planks(d.footX,d.z-d.walkW/2,d.x-d.footX,d.walkW);planks(d.x-d.headW/2,d.z-d.headD/2,d.headW,d.headD);
    BayFirstCrossing.map(c,v,px,py,s,()=>true,true);
    if(w.away>0&&w.away<1.25)rect(v.x-1.5-5.3*Math.cos(1.36*w.away/1.25),p.z-.38,5.3*Math.cos(1.36*w.away/1.25),.76,"#a98965");
    const person=(x,z,yaw,skin,shirt,phase,moving,tins)=>personAt(c,px(x),py(z),s,yaw,skin,shirt,phase,moving,tins);
    for(const [i,[x,z]] of BaySixSharp.crewSeats.entries()){
      const q=BayDriving.world(v,x,z);person(q.x,q.z,v.yaw+i*2.38-.9,BaySixSharp.faces[i%4],BaySixSharp.clothes[i%6],0,0,false);
    }
    const l=w.luis();person(l.x,l.z,l.yaw,"#9b7557","#a89467",w.luisMotion.phase,w.luisMotion.weight,true);
    person(p.x-.33,p.z+1,2.46,"#997053","#537a72",0,0,false);
    for(const z of [-.69,.69])circle(c,px(p.x),py(p.z+z),.095*s,"#786c4b");
    const dz=Math.cos(w.gate*1.39)*1.34;
    line(c,px(p.x),py(p.z+.69),px(p.x),py(p.z+.69-dz),"#eee0b8",.12*s);
    for(let i=0;i<3;i++)line(c,px(p.x),py(p.z+.69-dz*(i+.3)/3),px(p.x),py(p.z+.69-dz*(i+.7)/3),rust,.13*s);
  }
  function personAt(c,x,y,s,yaw,skin,shirt,phase,moving,tins){
      c.save();c.translate(x,y);c.rotate(yaw);c.scale(s,s);
      const swing=Math.sin(phase*tau)*moving;
      for(const sign of [-1,1]){
        c.fillStyle="#414942";c.fillRect(sign*.11-.06,-.12+sign*swing*.16,.12,.32);
        circle(c,sign*.24,-sign*swing*.20,.084,skin);
        if(tins){c.fillStyle=sign>0?"#426e83":"#637a60";c.fillRect(sign*.34-.084,-.12-sign*swing*.20,.168,.26);
          line(c,sign*.34-.06,-sign*swing*.20,sign*.34+.06,-sign*swing*.20,"#d2c7a6",.028);}
      }
      c.fillStyle=shirt;c.beginPath();c.ellipse(0,0,.245,.14,0,0,tau);c.fill();circle(c,0,-.03,.117,skin);
      circle(c,0,.011,.105,"#4c4238");c.restore();
    }
  window.BaySixSharpArt={clock,docket,overhead,stub,personAt,through,replies};
})();
