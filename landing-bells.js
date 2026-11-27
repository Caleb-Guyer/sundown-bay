/* The after-watch bell on Luz. Timing advances with the crossing, including pauses. */
(() => {
  "use strict";
  const beat=(a,b)=>[0,a,a+b];
  const possible=n=>Number.isInteger(n)&&n>=18&&n<=180;
  function read(raw){
    if(!Array.isArray(raw?.gaps)||raw.gaps.length!==2||!raw.gaps.every(possible))return null;
    return {gaps:raw.gaps.slice(),best:[0,1].map(i=>{
      const n=raw.best?.[i];return Number.isInteger(n)&&n>=0&&n<=50?n:null;
    }),rounds:Math.max(1,Math.min(99999,Number.isSafeInteger(raw.rounds)?raw.rounds:1))};
  }
  class Watch{
    constructor(){this.round=null;this.reply=null;this.boatLamp=this.coachLamp=0;this.cool=0;}
    available(s){return !!s.book.credit&&s.rider?.phase==="sail"&&!s.hearing()&&s.clock<22;}
    start(s){
      if(!this.available(s)||this.round&&this.round.phase!=="done")return false;
      const crew=s.book.credit==="crew",home=s.departure===(crew?1:0);
      const waited=s.book.morning?.luis==="ashore";
      const first=crew ? (waited?1.08:.82) : .38;
      const second=crew ? .36 : (waited?1.14:.9);
      this.round={phase:"listen",age:-.55,index:0,hits:[],error:0,
        target:home?beat(first,second):beat(second,first),name:crew?"Night shift":"Dalia Cruz",retry:false};
      this.reply=null;return true;
    }
    ring(place,emit){if(place==="boat")this.boatLamp=.28;else this.coachLamp=.28;emit(place);}
    play(place,gaps,delay){this.reply={place,notes:beat(gaps[0]/100,gaps[1]/100),age:-delay,index:0};}
    hail(book,coach){
      if(!book.bells||this.reply||this.cool>0)return false;
      this.coach=coach;this.cool=10;this.play("coach",book.bells.gaps,.7);return true;
    }
    again(r){r.phase="listen";r.age=-.85;r.index=0;r.hits=[];r.retry=true;}
    tap(s,emit){
      const r=this.round;if(!r||!(r.phase==="echo"||r.phase==="own"))return;
      if(r.hits.length&&r.age-r.hits.at(-1)<.175)return;
      if(!r.hits.length)r.age=0;
      if(r.hits.length&&r.age-r.hits.at(-1)>1.805){r.hits=[];r.age=0;}
      r.hits.push(r.age);this.ring("boat",emit);
      if(r.hits.length!==3)return;
      const gaps=[1,2].map(i=>Math.round((r.hits[i]-r.hits[i-1])*100));
      if(r.phase==="echo"){
        const miss=gaps.map((v,i)=>Math.abs(v-Math.round((r.target[i+1]-r.target[i])*100)));
        if(Math.max(...miss)>22){this.again(r);return "miss";}
        r.error=miss[0]+miss[1];r.phase="own";r.age=0;r.hits=[];return "own";
      }
      if(!gaps.every(possible)){r.hits=[];return;}
      const old=s.book.bells,best=old?.best.slice()||[null,null],i=s.departure;
      best[i]=Math.min(best[i]??Infinity,r.error);
      s.book.bells={gaps,best,rounds:Math.min(99999,(old?.rounds||0)+1)};
      r.phase="done";this.play("boat",gaps,.7);return "saved";
    }
    step(dt,s,cast,emit){
      this.boatLamp=Math.max(0,this.boatLamp-dt);this.coachLamp=Math.max(0,this.coachLamp-dt);this.cool=Math.max(0,this.cool-dt);
      if(cast&&s.book.bells&&!this.reply)this.play("boat",s.book.bells.gaps,.85);
      const playback=this.reply;
      if(playback){
        playback.age+=dt;
        while(playback.index<3&&playback.age>=playback.notes[playback.index]){this.ring(playback.place,emit);playback.index++;}
        if(playback.index===3)this.reply=null;
      }
      const r=this.round;if(!r)return;
      if(s.rider?.phase!=="sail"){this.round=null;return;}
      r.age+=dt;
      if(r.phase==="listen"){
        while(r.index<3&&r.age>=r.target[r.index]){this.ring("boat",emit);r.index++;}
        if(r.age>=r.target[2]+.45){r.phase="echo";r.age=0;r.hits=[];}
      }else if(r.phase==="echo"&&r.hits.length&&r.age-r.hits.at(-1)>1.8)this.again(r);
      else if(r.phase==="own"&&r.hits.length&&r.age-r.hits.at(-1)>1.8){r.hits=[];r.age=0;}
    }
  }
  function label(r){
    if(r.phase==="listen")return (r.retry?"Listen again":"Listen")+ " · "+r.name;
    if(r.phase==="echo")return "H · Repeat the three strokes";
    if(r.phase==="own")return "H · Make up three strokes of your own";
    return "Call logged · "+(r.error/100).toFixed(2)+" s total error";
  }
  function strip(canvas,r,book){
    const g=canvas.getContext?.("2d");if(!g)return;
    const w=canvas.width,h=canvas.height;g.fillStyle="#244742";g.fillRect(0,0,w,h);
    const samples=r.phase==="done"?beat(...book.bells.gaps.map(n=>n/100)):r.target;
    const scale=(w-22)/(r.phase==="own"||r.phase==="done"?3.7:1.85);
    g.strokeStyle="#8b9c85";g.beginPath();g.moveTo(10,22);g.lineTo(w-10,22);g.stroke();
    if(r.phase!=="own")for(const t of samples){const x=9+t*scale;g.fillStyle="#d7caa0";g.fillRect(x,10,4,14);}
    for(const t of r.hits){g.fillStyle="#ffb561";g.fillRect(9+t*scale,22,4,10);}
    if(r.phase!=="done"&&(r.phase==="listen"||r.hits.length)){
      const x=Math.min(w-6,10+Math.max(0,r.age)*scale);g.fillStyle="#fcdd87";g.fillRect(x,3,2,h-6);
    }
  }
  function world(model,list,see,s){
    const w=s.bellWatch;if(!w)return;
    if(see(s,64)){
      const p=BayDriving.world(s,1.12,-1.76),lit=w.boatLamp>0;
      model("luz/watch-yoke",g=>{g.pole([0,0,0],[0,.69,0],.036,"#425d54",6);
        g.box(-.13,.66,0,.34,.06,.065,"#425d54");g.cyl(-.25,.46,0,.075,.19,.26,10,"#bd9870");});
      list.push(["luz/watch-yoke",p.x,s.y+1.25,p.z,s.yaw]);
      const lamp=lit?"luz/watch-lit":"luz/watch-dark";
      model(lamp,g=>g.cyl(0,.12,0,.11,.13,.24,9,lit?"#ffda74":"#a97547"));
      list.push([lamp,p.x,s.y+1.98,p.z,s.yaw]);
      const b=BayDriving.world(s,.87,-1.76);
      model("luz/watch-rope",g=>{g.pole([0,0,0],[0,-.39,0],.024,"#d7c59a",5);g.box(0,-.4,0,.15,.043,.045,"#694f3a");});
      list.push(["luz/watch-rope",b.x,s.y+1.63,b.z,s.yaw,0,-w.boatLamp*1.7]);
    }
    if(w.coachLamp>0&&w.coach&&see(w.coach,55)){
      model("six/answer-lamp",g=>g.box(0,0,0,.19,.11,.19,"#ffdb86"));
      for(const side of [-1,1]){const p=BayCityBusArt.bodyPoint(w.coach,side*.85,2.65,BayCityBusArt.halfLength-.02);
        list.push(["six/answer-lamp",p.x,p.y,p.z,w.coach.yaw,w.coach.pitch||0,w.coach.lean||0,1]);}
    }
  }
  function map(c,s,px,py,scale){
    const w=s.bellWatch;if(!w)return;
    const p=w.coachLamp>0?w.coach:w.boatLamp>0?s:null;if(!p)return;
    const f=(p===s?w.boatLamp:w.coachLamp)/.28;
    c.strokeStyle="#ffca6c";c.lineWidth=Math.max(1.4,scale*.13);c.beginPath();
    c.arc(px(p.x),py(p.z),Math.max(5,scale*(2.9+(1-f)*1.8)),0,Math.PI*2);c.stroke();
  }
  window.BayLandingBells={Watch,read,label,strip,world,map};
})();
