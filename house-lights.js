/* Two negatives on one camera mark, commissioned by the cinema projectionist. */
(() => {
  "use strict";
  const key="sundownBay.houseLights.v1",title="House Lights",fee=140;
  const period=minute=>minute>=420&&minute<1110?"day":minute>=1170||minute<330?"night":"";
  const label={day:"Daylight",night:"House lights"};
  const valid=r=>r&&BaySecondUnit.record(r)&&r.subject==="marquee"&&r.score>=55&&
    [r.x,r.z,r.yaw,r.pitch,r.zoom].every(Number.isFinite)&&r.zoom>=1&&r.zoom<=3&&
    typeof r.overhead==="boolean"&&!!period(r.minute);
  const blank=()=>({opened:false,shooting:false,day:null,night:null,release:null,revision:0});
  function read(){
    let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch{}
    const s=blank();if(!raw)return s;
    s.opened=raw.opened===true;s.shooting=s.opened&&raw.shooting===true;
    for(const side of ["day","night"])if(valid(raw[side])&&period(raw[side].minute)===side)s[side]=raw[side];
    if(valid(raw.release?.day)&&valid(raw.release?.night)&&period(raw.release.day.minute)==="day"&&period(raw.release.night.minute)==="night")s.release=raw.release;
    s.revision=Number.isSafeInteger(raw.revision)?raw.revision:0;return s;
  }
  class Book{
    constructor(){this.s=read();this.stored=true;}
    refresh(){const next=read();if(next.revision>this.s.revision)this.s=next;}
    write(){this.s.revision++;try{localStorage.setItem(key,JSON.stringify(this.s));this.stored=true;}catch{this.stored=false;}}
    start(){this.refresh();if(this.s.shooting)return;Object.assign(this.s,{opened:true,shooting:true,day:null,night:null});this.write();}
    get mark(){return this.s.day||this.s.night;}
    mismatch(p){
      const m=this.mark;if(!m)return "";
      if(m.overhead!==p.overhead)return "Use the "+(m.overhead?"overhead":"street")+" view for the match";
      const gap=Math.hypot(p.x-m.x,p.z-m.z);
      if(gap>1.8)return "First camera mark · "+Math.ceil(gap)+" m away";
      if(p.zoom!==m.zoom)return "Match the first lens · "+m.zoom+"×";
      const turn=Math.atan2(Math.sin(m.yaw-p.yaw),Math.cos(m.yaw-p.yaw));
      if(Math.abs(turn)>.095)return turn>0?"Pan right to match":"Pan left to match";
      if(Math.abs(m.pitch-p.pitch)>.085)return m.pitch>p.pitch?"Tilt up to match":"Tilt down to match";
      if(m.overhead&&Number.isFinite(m.reach)&&Math.abs(m.reach-p.reach)>1.8)return m.reach>p.reach?"Tilt up to match":"Tilt down to match";
      return "";
    }
    guide(p,minute){
      const side=period(minute),s=this.s;
      if(s.day&&s.night)return "Both frames in the sleeve · Return to the desk";
      if(!side)return "Between shows · Wait for daylight or the house lights";
      if(s[side])return side==="day"?"Daylight filed · Come back after 7:30 PM":"Night filed · Come back after 7 AM";
      return this.mismatch(p)||(this.mark?"Camera marks match":"Frame the Cine Luna marquee");
    }
    file(r,p,subject){
      this.refresh();
      if(!this.s.shooting||this.s.day&&this.s.night)return "";
      const side=period(r.minute),hint=this.guide(p,r.minute);
      if(!side||this.s[side])return hint;
      if(subject!=="marquee"||r.score<55)return "Put the marquee inside the frame";
      const mismatch=this.mismatch(p);if(mismatch)return mismatch;
      const frame={...r,...p,subject};
      if(!valid(frame))return "";
      this.s[side]=frame;this.write();
      return this.s.day&&this.s.night?"Both frames filed · Bring them to the desk":label[side]+" filed · Keep this camera mark";
    }
    deliver(){
      this.refresh();const s=this.s;
      if(!s.shooting||!s.day||!s.night)return false;
      s.release={day:s.day,night:s.night};s.day=s.night=null;s.shooting=false;this.write();return true;
    }
  }
  let loaded=null,frames=[],revision=0;
  function paint(g,pair,w,h,night){
    if(loaded!==pair){
      loaded=pair;frames=[pair.day,pair.night].map(r=>{const im=new Image();im.onload=()=>revision++;im.src=r.image;return im;});
    }
    g.save();g.fillStyle="#152322";g.fillRect(0,0,w,h);
    const margin=h*.046,labelY=h*.948,photoH=h*.82,photoW=Math.min(w-margin*2,photoH*1.5),x=(w-photoW)/2;
    for(let i=0;i<2;i++)if(frames[i].naturalWidth){g.globalAlpha=i?night:1;g.drawImage(frames[i],x,margin,photoW,photoW/1.5);}
    g.globalAlpha=1;g.fillStyle="#f1e0ba";g.font="italic bold "+Math.round(h*.073)+"px Georgia";g.textAlign="left";g.fillText(title,x,labelY);
    g.textAlign="right";g.font="bold "+Math.round(h*.045)+"px monospace";g.fillStyle="#e1c491";
    const frame=night>=.5?pair.night:pair.day;g.fillText("CINE LUNA  /  "+BayHours.time(frame.minute),w-x,labelY);g.restore();
  }
  const front={x:11.8,z:44},lit=minute=>minute>=1140||minute<360;
  function world(list,model,clock,t,mark){
    if(mark){
      model("luna-camera-mark",g=>{for(const side of [-1,1]){g.box(side*.27,0,0,.045,.015,.40,"#ecd49f");g.box(side*.20,0,.18,.18,.016,.045,"#ecd49f");}});
      list.push(["luna-camera-mark",mark.x,.166,mark.z,mark.yaw]);
    }
    const on=lit(clock.minute),step=Math.floor(t*3)%3;
    for(let bank=0;bank<3;bank++){
      const bright=on&&step!==bank,name="luna-bulbs-"+bank+"-"+(bright?"glow":"glass");
      model(name,g=>{for(let i=bank;i<43;i+=3){
        const z=(i-21)*.39;
        for(const y of [3.32,3.82])g.box(0,y,z,.08,.10,.11,bright?"#ffe8a0":"#ac8f6f");
      }});
      list.push([name,front.x,0,front.z,0,0,0,bright?1:0]);
    }
  }
  function overhead(c,px,py,s,clock,t,mark){
    c.save();
    c.fillStyle="#97766a";c.fillRect(px(front.x),py(52.75),2.7*s,17.5*s);
    c.fillStyle="#e0bc87";c.fillRect(px(front.x)+.15*s,py(52.55),2.38*s,17.1*s);
    c.save();c.translate(px(13.18),py(44));c.rotate(Math.PI/2);
    c.fillStyle="#956d59";c.fillRect(-7.9*s,-.93*s,15.8*s,.075*s);c.fillRect(-7.9*s,.87*s,15.8*s,.075*s);
    c.fillStyle="#5f5154";c.textAlign="center";c.textBaseline="middle";c.font="bold "+1.12*s+"px Georgia, serif";c.fillText("C I N E   L U N A",0,0,14.5*s);c.restore();
    if(lit(clock.minute)){
      const x=px(front.x),y=py(front.z),spill=c.createLinearGradient(x-4.5*s,y,x,y);
      spill.addColorStop(0,"rgba(255,204,104,0)");spill.addColorStop(1,"rgba(255,215,133,.47)");
      c.fillStyle=spill;c.fillRect(x-4.5*s,py(52.5),4.5*s,17*s);
    }
    for(let i=0;i<43;i++){
      c.fillStyle=lit(clock.minute)&&i%3!==Math.floor(t*3)%3?"#fff1a9":"#9d8266";
      c.fillRect(px(front.x)-.08*s,py(front.z+(i-21)*.39),Math.max(1,.16*s),Math.max(1,.16*s));
    }
    if(mark){c.translate(px(mark.x),py(mark.z));c.rotate(mark.yaw);c.strokeStyle="#f3d59c";c.lineWidth=Math.max(1,s*.045);
      for(const side of [-1,1]){c.beginPath();c.moveTo(side*.27*s,.2*s);c.lineTo(side*.27*s,-.2*s);c.lineTo(side*.12*s,-.2*s);c.stroke();}}
    c.restore();
  }
  window.BayHouseLights={key,title,fee,period,label,Book,paint,world,overhead,front,get revision(){return revision;}};
})();
