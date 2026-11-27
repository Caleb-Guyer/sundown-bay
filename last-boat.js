/* Ada's silent home movie and the two sounds the projectionist plays into it. */
(() => {
  "use strict";
  const reel={id:"last-boat",title:"The Last Boat at Six",seconds:13,credit:"Ada Soler · Marlin Pier, one week earlier"};
  const beats=pier=>pier==="north"?[3.4,9.8]:[2.8,9.0];
  const clamp=x=>Math.max(0,Math.min(1,x));
  function sync(pier,marks){const cue=beats(pier);return Math.round(100*Math.max(0,1-(Math.abs(cue[0]-marks[0]/100)+Math.abs(cue[1]-marks[1]/100))/1.8));}
  function valid(pier,marks){return Array.isArray(marks)&&marks.length===2&&marks.every((n,i)=>Number.isInteger(n)&&Math.abs(n/100-beats(pier)[i])<=.90);}
  class Dub{
    constructor(pier){this.pier=pier;this.beats=beats(pier);this.marks=[null,null];this.age=0;this.done=false;this.feedback="";this.feedbackTill=0;}
    input(code){
      if(this.done)return;
      const i=code==="KeyH"?0:code==="Space"?1:-1;if(i<0||this.marks[i]!==null)return;
      const error=this.age-this.beats[i];
      if(Math.abs(error)<=.90)this.marks[i]=Math.round(this.age*100);
      this.feedback=(i?"Punch":"Bell")+" · "+(Math.abs(error)<.12?"in sync":Math.abs(error).toFixed(1)+" s "+(error<0?"early":"late"));
      this.feedbackTill=this.age+.75;return i?"ticket-punch":"watch-bell";
    }
    step(dt){if(this.done)return false;this.age=Math.min(reel.seconds,this.age+dt);if(this.age<reel.seconds)return false;this.done=true;return true;}
    get score(){return valid(this.pier,this.marks)?sync(this.pier,this.marks):0;}
    hint(){
      if(this.done)return ["F","Run another take · E leave the booth"];
      if(this.age<this.feedbackTill)return ["",this.feedback];
      if(this.age<this.beats[0]+.90&&this.marks[0]===null)return ["H","Ring when the brass tongue strikes"];
      if(this.age<this.beats[1]+.90&&this.marks[1]===null)return ["Space","Punch when the two jaws meet"];
      return ["","Listen to the last few feet of film · E leave"];
    }
  }
  function film(c,pier,t,marks){
    const north=pier==="north",cue=beats(pier);
    const ink="#303c3d",sea="#507c76",light="#ead7a4",rust="#a65441",brass="#d99b56";
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    const path=(pts,color,width=0)=>{
      c.beginPath();c.moveTo(pts[0],pts[1]);for(let i=2;i<pts.length;i+=2)c.lineTo(pts[i],pts[i+1]);
      if(width){c.lineWidth=width;c.strokeStyle=color;c.stroke();}else{c.closePath();c.fillStyle=color;c.fill();}
    };
    const oval=(x,y,rx,ry,color)=>{c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=color;c.fill();};
    const type=(s,x,y,font,color)=>{c.font=font;c.fillStyle=color;c.fillText(s,x,y);};
    c.save();c.lineCap="round";c.lineJoin="round";rect(0,0,416,234,light);
    rect(0,83,416,151,sea);
    for(let i=0;i<12;i++){const x=((i*79+Math.sin(t*.8+i)*5)%420);rect(x,89+(i*17)%83,12+i%5,1,"#a0ad90");}
    if(t<4.8){
      // The pivot stays on the canopy bolt as the skirt swings into the clapper.
      rect(0,0,416,19,ink);rect(76,13,23,144,"#6e6251");rect(69,24,37,6,brass);
      path([96,37,181,37,213,53,211,60,173,49,96,49],ink);
      const swing=clamp((t-cue[0]+1.8)/1.8),ring=t>=cue[0];
      const a=ring?Math.sin((t-cue[0])*8+.64)*.38*Math.exp(-(t-cue[0])*1.5):-.44+.67*swing*swing;
      c.save();c.translate(208,56);c.rotate(a);
      path([-4,0,5,0,9,14,21,20,26,46,35,59,35,66,-34,66,-35,58,-26,47,-20,21,-7,13],brass);
      path([-20,25,-12,18,-13,48,-25,59,-29,59],"#efc986");
      oval(0,64,35,6,"#5b5142");const clapper=ring?24*Math.cos((t-cue[0])*8)*Math.exp(-(t-cue[0])):-13+37*swing*swing;
      path([0,28,clapper,68],ink,4);oval(clapper,70,5,5,"#443b33");c.restore();
      type("MARLIN PIER",15,191,"bold 11px monospace",light);
    }else if(t<8){
      const travel=clamp((t-4.8)/3.2),x=180+travel*108,y=104+Math.sin(t*3);
      path([0,120,102,110,178,117,160,130,0,143],"#775943");
      for(const p of [9,83,147])rect(p,126,8,49,ink);
      c.save();c.translate(x,y);
      path([-68,18,75,18,61,36,-52,36],ink);path([-63,17,70,17,63,23,-58,23],rust);
      rect(-40,-3,65,19,light);for(let i=0;i<5;i++)rect(-35+i*12,0,8,9,sea);
      rect(-48,-9,85,6,ink);rect(32,-18,5,35,ink);path([37,-18,56,-12,37,-7],rust);
      function luis(px,py){oval(px,py-18,4,5,"#966244");rect(px-5,py-14,10,12,"#b06548");path([px-3,py-2,px-4,py+9,px+1,py+9,px+3,py-1],ink);
        for(const d of [-10,7]){rect(px+d,py-2,6,6,"#658c9b");path([px+d+1,py-2,px+d+2,py-5,px+d+5,py-4],ink,1);}}
      if(north)luis(-55,6);c.restore();if(!north)luis(131,107);
      type(north?"EIGHTEEN ABOARD":"SEVENTEEN ABOARD",16,191,"bold 11px monospace",light);
    }else{
      rect(0,0,416,234,"#47564d");c.save();c.translate(59,38);c.rotate(-.06);
      rect(3,4,247,130,ink);rect(0,0,247,130,"#eadbb3");rect(0,9,247,5,sea);
      type("OCEAN LOOP",13,38,"bold 17px Georgia",ink);type("GOOD FOR ONE TRANSFER",13,55,"11px monospace",ink);
      for(let i=0;i<5;i++){rect(13+i*45,71,1,40,"#a4997c");type(String(6+i),23+i*45,94,"13px monospace",ink);}
      if(t>=cue[1])oval(246,68,9,7,"#47564d");c.restore();
      const jaw=Math.min(1,Math.abs(t-cue[1])/.85),h=19*jaw;
      path([277,97,316,100,382,67,390,76,322,114,275,111],ink);
      path([278,98-h,313,99,376,133+h*.55,368,141+h*.55,308,111,277,107-h],"#bbbba2");
      oval(314,105,5,5,brass);type("MARTA LEAL   /   COACH 608",16,191,"bold 11px monospace",light);
    }
    rect(0,200,416,34,ink);
    const active=marks?.findIndex(n=>Number.isInteger(n)&&t>=n/100&&t<n/100+.6)??-1;
    type(active===0?"[bell rings]":active===1?"[ticket punch clicks]":t<4.8?"THE LAST BOAT AT SIX":t<8?(north?"Luis made it with both tins.":"Luis watched from the step."):"Half a moon. Good all the way home.",15,221,"italic 15px Georgia",light);
    c.restore();
  }
  function leader(c,dub,t){
    const next=t<dub.beats[0]+.9?0:1,remaining=dub.beats[next]-t;
    if(remaining>2.2||remaining<-.8||dub.marks[next]!==null)return;
    // Two grease-pencil slashes meet at the edge of the projected frame.
    const x=360+remaining*19;
    c.save();c.strokeStyle="#f6e9c2";c.lineWidth=2;c.beginPath();
    c.moveTo(360,15);c.lineTo(354,27);c.moveTo(x,15);c.lineTo(x-6,27);c.stroke();c.restore();
  }
  window.BayLastBoat={reel,Dub,valid,sync,film,leader};
})();
