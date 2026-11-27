/* The Marlin night shift. The original handoff stays on the receipt. */
(() => {
  "use strict";
  const pockets=[{x:103,y:127,angle:-.12},{x:277,y:95,angle:.14},{x:404,y:141,angle:-.22}];
  const owed=count=>7&~((1<<count)-1);
  function read(raw){
    if(!Number.isSafeInteger(raw?.trip)||raw.trip<1||!["luna","port"].includes(raw.route)||
      !Number.isSafeInteger(raw.sale)||raw.sale<0||typeof raw.key!=="string"||!raw.key.length||
      typeof raw.plate!=="string"||![0,1,2].includes(raw.count))return null;
    const found=(Number.isInteger(raw.found)?raw.found:0)&owed(raw.count);
    const filed=found===owed(raw.count)&&raw.filed===true;
    return {trip:raw.trip,sale:raw.sale,route:raw.route,key:raw.key,plate:raw.plate,count:raw.count,
      found,filed,advanced:filed&&Number.isInteger(raw.advanced)?raw.advanced&found:0};
  }
  function merge(into,records){
    if(!Array.isArray(records))return;
    for(const raw of records){
      const s=read(raw);if(!s)continue;
      const prev=into.find(r=>r.trip===s.trip);
      if(!prev)into.push(s);
      else if(prev.key===s.key&&prev.route===s.route&&prev.count===s.count){prev.found|=s.found;prev.filed||=s.filed;prev.advanced|=s.advanced;}
    }
  }
  function names(bits){return BayPayroll.wages.filter((_,i)=>bits&(1<<i)).map(w=>w.name).join(", ");}
  class Search{
    constructor(slip){this.slip=slip;this.aim=210;this.reach=0;this.target=-1;}
    light(){
      return pockets.findIndex((p,i)=>i>=this.slip.count&&!(this.slip.found&(1<<i))&&Math.abs(p.x-this.aim)<26);
    }
    step(dt,turn,pull){
      this.aim=Math.max(38,Math.min(480,this.aim+turn*dt*190));
      const target=this.light();if(this.target!==target)this.reach=0;this.target=target;
      this.reach=pull&&target>=0?Math.min(1,this.reach+dt/.68):Math.max(0,this.reach-dt*3);
      if(this.reach<1)return -1;
      this.slip.found|=1<<target;this.reach=0;return target;
    }
  }
  function paint(canvas,s){
    const c=canvas.getContext?.("2d");if(!c)return;
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    const line=(points,color,width)=>{
      c.strokeStyle=color;c.lineWidth=width;c.beginPath();points.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.stroke();
    };
    rect(0,0,520,208,"#252b29");rect(8,31,503,151,"#44423a");
    for(let i=-2;i<35;i++)line([[i*17,182],[i*17+46,58]],"#524e43",3);
    rect(46,48,25,112,"#292d2c");rect(453,38,22,122,"#232a28");
    for(const x of [57,464]){rect(x-4,55,9,91,"#716d59");rect(x-2,59,3,80,"#474a40");}
    for(const [i,p] of pockets.entries()){
      if(i<s.slip.count||s.slip.found&(1<<i))continue;
      const lift=s.target===i?s.reach:0;
      c.save();c.translate(p.x+lift*12,p.y+lift*26);c.rotate(p.angle+lift*.18);
      rect(-39,-17,78,36,"#6f614b");rect(-40,-19,78,35,"#dabd8c");
      line([[-40,-19],[-1,-2],[38,-19]],"#9a7c53",1.2);rect(24,1,7,7,"#aa5748");
      c.fillStyle="#423d32";c.font="italic 12px Georgia";c.fillText(BayPayroll.wages[i].name,-34,11);c.restore();
    }
    rect(0,0,520,46,"#3f514c");rect(0,39,520,12,"#263932");
    for(let x=-9;x<520;x+=22)line([[x,2],[x+10,31],[x+8,38]],"#50635a",2);
    line([[0,41],[115,39],[247,45],[370,40],[520,41]],"#9a9373",2);
    rect(7,178,506,12,"#8a8670");rect(5,190,510,14,"#475c55");
    const light=c.createRadialGradient(s.aim,122,12,s.aim,122,115);
    light.addColorStop(0,"rgba(255,224,152,.13)");light.addColorStop(.43,"rgba(20,23,23,.06)");
    light.addColorStop(.8,"rgba(13,19,19,.58)");light.addColorStop(1,"rgba(9,16,16,.86)");
    c.fillStyle=light;c.fillRect(0,0,520,208);
    if(s.target>=0&&s.reach>0){
      const p=pockets[s.target],x=p.x+13*s.reach,y=219-(205-p.y)*s.reach;
      line([[x+31,220],[x+10,y+9],[x,y+4]],"#be9274",13);
      line([[x+11,y+9],[x-3,y-2]],"#d7ac86",6);
      line([[x+36,224],[x+17,y+17]],"#56746b",17);
    }
  }
  window.BayUnderSeat={read,merge,owed,names,Search,paint};
})();
