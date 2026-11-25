/* The clock runs only while playing. A shift belongs to the evening it opened, even after midnight. */
(() => {
  "use strict";
  const dayLength=1440,start=17*60+48,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const wrap=v=>(v%dayLength+dayLength)%dayLength;
  function smooth(value){const n=clamp(value,0,1);return n*n*(3-2*n);}
  function sunlight(minute){
    const sinceDawn=wrap(minute-360),angle=sinceDawn<=810?sinceDawn*Math.PI/810:Math.PI+(sinceDawn-810)*Math.PI/630,arc=Math.sin(angle);
    const x=Math.cos(angle)*760,y=arc*730-16,z=295+arc*103;
    const length=Math.hypot(x,y,z);
    // Cap the projection close to the horizon. Its strength fades as the sun sets.
    const projectionY=Math.max(y,Math.hypot(x,z)*.28);
    return {x:x/length,y:y/length,z:z/length,dx:-x/projectionY,dz:-z/projectionY,
      strength:smooth((y/length+.035)/.22)};
  }
  function shower(minute,center,length){
    const delta=wrap(minute-center+720)-720;
    return smooth((delta+length)/12)*smooth((length-delta)/12);
  }
  class Clock {
    constructor(total){
      this.total=Number.isFinite(total)&&total>=0&&total<1e8?total:start;
      this.refresh();
    }
    refresh(){
      this.minute=wrap(this.total);this.day=Math.floor(this.total/dayLength);
      const m=this.minute;
      this.sun=sunlight(m);
      this.night=1-smooth((m-300)/160)*smooth((1260-m)/195);
      const pattern=this.day%3;
      this.rain=Math.max(shower(m,1094+pattern*26,19),shower(m,469+pattern*71,24),shower(m,80+pattern*33,13));
      this.wet=Math.max(this.rain,shower(m,1111+pattern*26,29),shower(m,486+pattern*71,33),shower(m,94+pattern*33,23));
      this.market=m>=1080||m<120?"open":m>=990?"setup":"closed";
      this.shift=Math.floor((this.total-120)/dayLength);
    }
    step(seconds){if(seconds>0){this.total+=seconds;this.refresh();}}
    wake(minute){
      const next=this.day*dayLength+wrap(minute);
      this.total=next>this.total+.000001?next:next+dayLength;this.refresh();
    }
  }
  function time(minute){
    const m=Math.floor(wrap(minute)),h=Math.floor(m/60);
    return (h%12||12)+":"+String(m%60).padStart(2,"0")+(h>=12?" PM":" AM");
  }
  window.BayHours={Clock,time,sunlight};
})();
