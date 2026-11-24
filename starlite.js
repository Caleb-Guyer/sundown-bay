/* Gantry Street's open-air theatre. All timing is in simulated seconds. */
(() => {
  "use strict";
  const site={x:90,y:.096,z:-58,yaw:0},booth={x:84.17,z:-60.77,kind:"drive-in",name:"Starlite Motor Theatre"};
  const coast={id:"coast",title:"Coast Road, 1983",credit:"Soler family print · 16 mm",seconds:16};
  const ids=new Set(["coast","pelican","tram","windows","stunt","skate","edition","location"]);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function read(raw){
    const best={};
    for(const [id,n] of Object.entries(raw?.best||{}))if(ids.has(id)&&Number.isInteger(n)&&n>=1&&n<=100)best[id]=n;
    const tickets=(Array.isArray(raw?.tickets)?raw.tickets:[]).filter(t=>t&&ids.has(t.id)&&typeof t.title==="string"&&typeof t.plate==="string"&&typeof t.companion==="string"&&Number.isSafeInteger(t.day)&&t.day>0&&[1,2,3].includes(t.bay)).slice(-5);
    const p=raw?.park,park=p&&[p.x,p.z,p.yaw].every(Number.isFinite)&&Math.abs(p.x)<300&&Math.abs(p.z)<450?{x:p.x,z:p.z,yaw:p.yaw}:null;
    return {rev:Number.isSafeInteger(raw?.rev)&&raw.rev>=0?raw.rev:0,best,tickets,park,roof:raw?.roof===1?1:0,booked:ids.has(raw?.booked)?raw.booked:"coast"};
  }
  function bay(v){
    if(!v||Math.abs(v.speed)>.85||Math.cos(v.yaw)<.83||Math.abs(v.z-site.z)>2.15)return 0;
    return [-3.8,0,3.8].findIndex(x=>Math.abs(v.x-site.x-x)<.91)+1;
  }
  function fold(v,dt){
    if(Math.abs(v.speed)>3||v.softTop===v.roofTarget)return;
    v.softTop+=clamp(v.roofTarget-v.softTop,-dt/2.8,dt/2.8);
  }
  class Theatre {
    constructor(){this.clock=0;this.run=null;this.visit=null;this.playFrom=0;this.variation=0;this.version=0;this.frameKey="";}
    show(program,booked){
      const bill=[coast,...program],r=this.run;
      if(r&&!r.done&&!r.switched){
        const reel=r.id==="coast"?program.find(f=>f.id==="pelican"):coast;
        return {reel,time:Math.min(reel.seconds-.1,reel.seconds-r.changeAt-.45+r.age),cue:r.cue};
      }
      let i=Math.max(0,bill.findIndex(f=>f.id===(this.onScreen||booked)));
      let time=Math.max(0,this.clock-this.playFrom)%bill.reduce((n,f)=>n+f.seconds,0);
      while(time>=bill[i].seconds){time-=bill[i].seconds;i=(i+1)%bill.length;}
      return {reel:bill[i],time,cue:""};
    }
    start(reel){
      this.visit=null;
      this.variation=(this.variation+1)%7;
      const motorAt=2.7+.23*this.variation;
      this.run={id:reel.id,title:reel.title,age:0,motorAt,changeAt:motorAt+3.35+.17*(this.variation%3),motor:0,started:false,switched:false,done:false,cue:"",score:0,feedback:""};
    }
    finish(r,score,message){r.done=true;r.cue="";r.score=score;r.feedback=message;return r;}
    input(code){
      const r=this.run;if(!r||r.done)return;
      if(code==="Space"&&!r.started){r.started=true;r.motorError=r.age-r.motorAt;r.motorTime=r.age;return;}
      if(code!=="KeyF")return;
      if(!r.started)return this.finish(r,0,"The second projector was still.");
      if(r.age-r.motorTime<1.25)return this.finish(r,0,"The second reel was still coming up to speed.");
      const error=r.age-r.changeAt,score=clamp(Math.round(100-28*Math.abs(r.motorError)-49*Math.abs(error)),0,100);
      if(score>=70){r.switched=true;this.onScreen=r.id;this.playFrom=this.clock;}
      const timing=(n)=>Math.abs(n)<.10?"on cue":Math.abs(n).toFixed(1)+" s "+(n<0?"early":"late");
      return this.finish(r,score,"Motor "+timing(r.motorError)+" · shutter "+timing(error));
    }
    step(dt){
      this.clock+=dt;const r=this.run;if(!r||r.done)return;
      r.age+=dt;r.motor=r.started?clamp((r.age-r.motorTime)/1.25,0,1):0;
      r.cue=Math.abs(r.age-r.motorAt)<=.38?"motor":Math.abs(r.age-r.changeAt)<=.38?"change":"";
      if(r.age>r.changeAt+1.35)return this.finish(r,0,"The tail leader ran through the gate.");
    }
    frame(options,booked){
      const program=BayCineProgram.describe(options),{reel,time,cue}=this.show(program,booked);
      const tick=Math.max(0,Math.floor(time*10)),key=reel.id+"/"+tick+"/"+cue;
      if(this.frameKey===key)return this.canvas;
      if(!this.canvas){this.canvas=document.createElement("canvas");this.canvas.width=416;this.canvas.height=234;}
      const c=this.canvas.getContext("2d");
      if(reel.id==="coast")BayCoastRoadFilm.paint(this.canvas,tick/10);
      else{
        let offset=0;for(const f of program){if(f.id===reel.id)break;offset+=f.seconds;}
        const frame=BayCineProgram.frame(offset+tick/10,options);
        if(frame.canvas)c.drawImage(frame.canvas,0,0,416,234);
      }
      if(cue){c.save();c.beginPath();c.arc(387,22,8,0,Math.PI*2);c.lineWidth=4;c.strokeStyle="#3a2923";c.stroke();c.lineWidth=2;c.strokeStyle="#ffefc8";c.stroke();c.restore();}
      this.frameKey=key;this.version++;return this.canvas;
    }
  }
  window.BayStarlite={site,booth,coast,read,bay,fold,Theatre};
})();
