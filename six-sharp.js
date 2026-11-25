/* Dalia's departure book. The morning watch uses its own boat and clock. */
(() => {
  "use strict";
  const tau=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const smooth=t=>t*t*(3-2*t),mix=(a,b,t)=>a+(b-a)*t;
  function read(r){
    return r&&["aboard","ashore"].includes(r.luis)&&Number.isSafeInteger(r.second)&&r.second>=0&&r.second<86400?
      {luis:r.luis,second:r.second}:null;
  }
  function time(second){return [Math.floor(second/3600),Math.floor(second/60)%60,second%60].map(n=>String(n).padStart(2,"0")).join(":");}
  class Watch{
    constructor(){
      this.dock=BayFirstCrossing.stop(0);
      this.boat=new BayFirstCrossing.Service({pass:true,trips:0,berth:0,credit:"signed"});
      this.start={x:this.boat.x,z:this.boat.z};
      this.sun=new BayHours.Clock(360);this.age=0;this.gate=0;this.travel=0;this.crossing=false;
      this.luisMotion=new BayPlayerMotion();this.daliaMotion=new BayPlayerMotion();
      this.departure=null;this.away=0;this.lastCall="";
    }
    second(){return (21596+Math.floor(this.age))%86400;}
    ring(){
      if(this.departure)return false;
      if(this.gate>.035||this.crossing){this.lastCall="Let the gate come down before you ring.";return false;}
      this.departure={second:this.second(),luis:this.travel>=1?"aboard":"ashore"};return true;
    }
    tick(dt,hold){
      this.age+=dt;
      const before=this.luis(),aboard=this.travel>=1,oldGate=this.gate,oldAway=this.away;
      this.gate=clamp(this.gate+dt*((!this.departure&&(hold||this.crossing))?1.45:-1.65),0,1);
      if(!this.departure&&this.age>=5.3&&this.gate>=.95&&!aboard)this.crossing=true;
      if(this.crossing){
        this.travel=Math.min(1,this.travel+dt/3.9);
        if(this.travel===1)this.crossing=false;
      }
      if(this.departure){
        this.away+=dt;const u=clamp((this.away-1.25)/5,0,1);
        this.boat.x=this.start.x+2.7*u*u;this.boat.z=this.start.z+6.8*u*u;
        this.boat.yaw=.27*u;
        this.boat.phase="sail";
      }
      this.boat.y=.12+.036*Math.sin(this.age*1.7);
      const after=this.luis(),step=aboard?0:Math.hypot(after.x-before.x,after.z-before.z);
      this.luisMotion.step(dt,step,0);
      this.daliaMotion.handTarget={x:.31,y:1.16+.20*this.gate,z:.33-.24*this.gate,weight:1};
      this.daliaMotion.step(dt,0,0);
      const heel=Math.floor(this.age*(this.crossing?2.1:2.7));
      this.gateSound=oldGate<.12&&this.gate>=.12?"watch-latch":oldGate>0&&this.gate===0?"watch-close":null;
      this.tinSound=step>.008&&heel!==this.heel&&!aboard;this.heel=heel;
      this.horn=oldAway<1.25&&this.away>=1.25;
    }
    luis(){
      const p=this.dock,v=this.boat;
      if(this.travel>=1){const q=BayDriving.world(v,-.75,.09);return {...q,y:v.y+.82,yaw:-1.30};}
      const run=clamp(this.age/5.3,0,1),walk=this.travel;
      return {x:mix(mix(p.x-9,p.x-.57,run),this.start.x-.75,walk),z:p.z-3.20+3.2*smooth(run)+.09*walk,
        y:p.y+(v.y+.82-p.y)*walk,yaw:Math.atan2(1,run<1?.40:0)};
    }
    eye(beat){
      const p=this.dock,v=this.boat;
      let eye,to,focal;
      if(beat==="wide"){
        const u=smooth(Math.min(1,this.age/4));eye=[p.x-8+u*1.4,4.2-u*.7,p.z+9];to=[p.x+2,1.24,p.z];focal=1.52;
      }else if(beat==="away"){
        const u=clamp(this.away/6,0,1);eye=[p.x-.4,2.0+u*1.2,p.z+5.6+u*2];to=[v.x-.95,1.43,v.z+.22];focal=1.55;
      }else{eye=[p.x-.70,2.25,p.z+5.5];to=[p.x+1.9,1.3,p.z-.18];focal=1.49;}
      return {x:eye[0],y:eye[1],z:eye[2],focal,yaw:Math.atan2(to[0]-eye[0],to[2]-eye[2]),pitch:Math.atan2(to[1]-eye[1],Math.hypot(to[0]-eye[0],to[2]-eye[2]))};
    }
    caption(){
      if(this.crossing)return "He’s on the gangway. Let him get both feet aboard.";
      if(this.travel>=1)return this.gate>.035?"Luis is aboard. Release Space to lower the gate.":"Luis is aboard. Press H to ring Luz out.";
      if(this.lastCall&&this.gate>.035)return this.lastCall;
      if(this.gate>.58)return "Hold the gate. Luis is coming down the pier.";
      return "H rings Luz out now. Hold Space to let Luis bring his tins aboard.";
    }
  }
  const brass="#b58a48",teal="#325d58",cream="#f0dbad",red="#a45740",casts=new WeakMap();
  function street(w,view,model,person){
    const p=w.dock,l=w.luis(),v=w.boat,list=[];
    BayFirstCrossing.world(view,model,list,q=>Math.abs(q.x-p.x)<24&&Math.abs(q.z-p.z)<22,v,w.age,person);
    model("watch/posts",g=>{
      for(const z of [-.69,.69]){
        g.box(0,.51,z,.12,1.03,.14,teal);g.cyl(0,1.05,z,.104,.10,.11,8,brass);
        g.box(0,.08,z,.23,.09,.23,"#626456");
      }
      g.cyl(0,1.26,.69,.017,.028,.23,8,brass);g.cyl(0,1.22,.69,.10,.17,.18,10,brass);
      g.cyl(0,1.14,.69,.175,.177,.033,10,"#d1ab67");
    });
    model("watch/bar",g=>{g.box(0,0,-.66,.085,.103,1.36,cream);for(let i=0;i<3;i++)g.box(0,0,-.24-i*.41,.087,.106,.20,red);});
    list.push(["watch/posts",p.x,p.y,p.z],["watch/bar",p.x,p.y+.94,p.z+.69,0,w.gate*1.39]);
    if(w.away>0&&w.away<1.25){
      const u=smooth(w.away/1.25),a=u*1.36;
      const x=v.x-1.54-2.65*Math.cos(a);
      list.push(["luz/plank",x,v.y+.78+2.65*Math.sin(a),p.z,0,0,-a]);
    }
    model("watch/tin",g=>{g.box(0,0,0,.27,.20,.19,"#5c6963");g.box(0,.11,0,.281,.045,.201,"#c1bdaa");
      g.box(0,.126,.097,.056,.066,.021,brass);for(const x of [-.071,.071])g.box(x,.16,0,.017,.096,.022,"#4a4840");g.box(0,.207,0,.16,.019,.024,"#4a4840");});
    function rig(id,colors,motion,x,y,z,yaw){
      const key="watch/"+id;
      let cast=casts.get(view);if(!cast){cast={};casts.set(view,cast);}
      if(!cast[id]){cast[id]=new BayPlayerMesh(colors,"local");view.add(key,cast[id],true);}
      const mesh=cast[id];if(mesh.watchMotion!==motion){mesh.lastRevision=-1;mesh.watchMotion=motion;}
      if(mesh.update(motion))view.updateAnimated(key);list.push([key,x,y,z,yaw]);return mesh;
    }
    const mesh=rig("porter",["#926349","#a59569","#414f54"],w.luisMotion,l.x,l.y,l.z,l.yaw);
    rig("dispatcher",["#9b6b51","#547d78","#544e49"],w.daliaMotion,p.x-.33,p.y,p.z+1.00,2.46);
    for(let i=0;i<2;i++){
      const hand=[0,0,0];
      mesh.sides[i].forearm.map(mesh.sides[i].handPivot,hand);
      const at=BayDriving.world(l,hand[0],hand[2]);list.push(["watch/tin",at.x,l.y+hand[1]-.21,at.z,l.yaw]);
    }
    for(const a of list)view.draw(...a);
  }
  window.BaySixSharp={Watch,read,time,street};
})();
