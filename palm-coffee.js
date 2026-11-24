/* Shift change at the Marlin. Bea has a regular route even when you don't join her. */
(() => {
  "use strict";
  const key="sundownBay.palmCoffee.v1",site={x:133.64,y:.14,z:23.9,yaw:0};
  const guest={x:site.x-.78,z:site.z},beaSpot={x:site.x+.78,z:site.z};
  const home={x:153.5,z:-8.85},gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const lift=t=>t<=0||t>=2.65?0:Math.sin(Math.PI*t/2.65)**1.6;
  const lines=[
    "The Marlin had one room key when I started. We tied it to a spoon so nobody would take it home.",
    "Luz tried putting a lid on this cup last week. I told her I didn’t walk two lights for takeout.",
    "See that west window? You can watch the motel desk from here. That’s how I get a whole break."
  ];
  class Break{
    constructor(bea){this.bea=bea;this.stage="";this.lifts=[0,0];this.approach=null;this.cups=0;this.lastDay=0;this.read();}
    read(){try{const r=JSON.parse(localStorage.getItem(key));if(Number.isSafeInteger(r?.cups)&&r.cups>=0&&Number.isSafeInteger(r.day)&&r.day>=1){this.cups=r.cups;this.lastDay=r.day;}}catch{}}
    file(day){this.read();this.cups++;this.lastDay=day;try{localStorage.setItem(key,JSON.stringify({cups:this.cups,day}));}catch{}}
    invited(hero){return !this.stage&&gap(this.bea,home)<2.25&&gap(hero,this.bea)<2.75;}
    nearCup(hero){return gap(hero,guest)<1.6;}
    join(){this.read();this.stage="walk";this.bea.wait=0;this.bea.index=1;this.bea.stuck=0;this.bea.crossing=null;this.crossed=0;this.bea.coffeePause=false;}
    leave(){
      if(this.stage==="table"||this.stage==="sip"&&this.together){this.bea.wait=22;this.bea.index=6;}
      this.stage="";this.together=false;this.approach=null;this.bea.coffeePause=false;this.bea.coffeeSip=false;this.lifts[0]=this.lifts[1]=0;
    }
    pour(path){if(!path||this.stage&&this.stage!=="table")return false;
      this.together=this.stage==="table";this.stage="sip";this.age=0;this.approach=path;this.spoke=false;return true;}
    step(dt,hero,env){
      const b=this.bea;if(!this.stage)return;
      if(!env.free()||gap(hero,b)>32&&this.stage!=="sip"){this.leave();return;}
      if(this.stage==="walk"){
        const d=gap(hero,b);
        b.coffeePause=d>4.8&&!b.crossing?.entered;
        if(b.coffeePause){b.yaw+=env.angle(b.yaw,Math.atan2(hero.x-b.x,hero.z-b.z))*(1-Math.exp(-5*dt));}
        if(this.crossed===0&&b.x<136&&hero.x<138){this.crossed=1;env.say("I left two cups at the window. That last light is ours if we catch it.");}
        if(this.crossed===1&&b.z>7.3&&hero.z>6.5)this.crossed=2;
        if(gap(b,beaSpot)<.35){
          b.coffeePause=true;this.stage="table";env.say("The little green one’s yours. Come round to the diner side of the pot.");
        }
        return;
      }
      if(this.stage==="table"){b.coffeePause=true;return;}
      if(this.approach.length){env.approach(this.approach,dt);return;}
      const face=Math.PI/2;hero.yaw+=env.angle(hero.yaw,face)*(1-Math.exp(-12*dt));
      if(this.together){
        const diff=gap(b,beaSpot),step=Math.min(1,dt*1.7/Math.max(.0001,diff));
        b.x+=(beaSpot.x-b.x)*step;b.z+=(beaSpot.z-b.z)*step;
        b.yaw+=env.angle(b.yaw,-face)*(1-Math.exp(-10*dt));b.coffeePause=true;
        if(diff>.025||Math.abs(env.angle(b.yaw,-face))>.08)return;
      }
      if(Math.abs(env.angle(hero.yaw,face))>.08)return;
      this.age+=dt;this.lifts[0]=lift(this.age-.25);this.lifts[1]=this.together?lift(this.age-.87):0;
      b.coffeeSip=this.together;
      if(this.age>2.35&&!this.spoke&&this.together){this.spoke=true;env.say(lines[this.cups%lines.length]);}
      if(this.age>4.35){if(this.together)this.file(env.day());this.leave();}
    }
  }
  window.BayPalmCoffee={Break,home,site,guest,beaSpot,key,block:{x:site.x,z:site.z,w:.86,d:.565,top:1.42,bottom:0,streetProp:true}};
})();
