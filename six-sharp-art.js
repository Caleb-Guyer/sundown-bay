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
  function docket(canvas,r,credit){
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
    function person(x,z,yaw,skin,shirt,phase,moving,tins){
      c.save();c.translate(px(x),py(z));c.rotate(yaw);c.scale(s,s);
      const swing=Math.sin(phase*tau)*moving;
      for(const sign of [-1,1]){
        c.fillStyle="#414942";c.fillRect(sign*.11-.06,-.12+sign*swing*.16,.12,.32);
        circle(c,sign*.24,-sign*swing*.20,.084,skin);
        if(tins){c.fillStyle="#5c6963";c.fillRect(sign*.34-.084,-.12-sign*swing*.20,.168,.26);
          line(c,sign*.34-.06,-sign*swing*.20,sign*.34+.06,-sign*swing*.20,"#d2c7a6",.028);}
      }
      c.fillStyle=shirt;c.beginPath();c.ellipse(0,0,.245,.14,0,0,tau);c.fill();circle(c,0,-.03,.117,skin);
      circle(c,0,.011,.105,"#4c4238");c.restore();
    }
    const l=w.luis();person(l.x,l.z,l.yaw,"#9b7557","#a89467",w.luisMotion.phase,w.luisMotion.weight,true);
    person(p.x-.33,p.z+1,2.46,"#997053","#537a72",0,0,false);
    for(const z of [-.69,.69])circle(c,px(p.x),py(p.z+z),.095*s,"#786c4b");
    const dz=Math.cos(w.gate*1.39)*1.34;
    line(c,px(p.x),py(p.z+.69),px(p.x),py(p.z+.69-dz),"#eee0b8",.12*s);
    for(let i=0;i<3;i++)line(c,px(p.x),py(p.z+.69-dz*(i+.3)/3),px(p.x),py(p.z+.69-dz*(i+.7)/3),rust,.13*s);
  }
  window.BaySixSharpArt={clock,docket,overhead};
})();
