/* Inez's last morning run. The old engine telegraph at Marlin recalls the crossing. */
(() => {
  "use strict";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const south=BayMarina.docks[0],north=BayMarina.docks[1];
  const stand={x:south.x-11,z:south.z-1.5,y:south.level};
  const landing=BayFirstCrossing.track(1),barge={x:253,z:-17},signal={x:271,z:-15};
  const resultValid=r=>r&&Number.isSafeInteger(r.tenths)&&r.tenths>0&&r.tenths<=864000&&
    ["aboard","ashore"].includes(r.luis)&&typeof r.held==="boolean"&&typeof r.caught==="boolean";
  function read(r){
    if(!resultValid(r?.first)||!resultValid(r.best))return null;
    return {first:r.first,best:r.best,trips:Number.isSafeInteger(r.trips)?clamp(r.trips,1,9999):1};
  }
  function file(old,r){
    if(!old)return {first:r,best:r,trips:1};
    return {first:old.first,best:r.tenths<old.best.tenths?r:old.best,trips:Math.min(9999,old.trips+1)};
  }
  function clear(x,z,yaw){
    for(const d of [-3.8,0,3.8]){
      const px=x+d*Math.sin(yaw),pz=z+d*Math.cos(yaw);
      if(px<222||px>302||pz< -123||pz>111||!BayMarina.navigable(px,pz)||
        Math.abs(px-barge.x)<9.2&&Math.abs(pz-barge.z)<5.4)return false;
    }
    return true;
  }
  class Run {
    constructor(morning){
      this.luis=morning.luis;this.deadline=morning.luis==="aboard"?29:33;
      this.boat=new BayFirstCrossing.Service({pass:true,berth:0,trips:0,credit:"signed"});
      this.boat.phase="sail";this.sun=new BayHours.Clock(360);this.elapsed=0;this.age=0;
      this.speed=0;this.started=false;this.held=false;this.bump=0;this.result=null;
    }
    nearSignal(){return Math.hypot(this.boat.x-signal.x,this.boat.z-signal.z)<14;}
    ring(){
      if(this.held||!this.nearSignal()||this.elapsed>this.deadline)return false;
      this.held=true;this.deadline+=8;this.boat.replied=2;return true;
    }
    toPier(){return Math.hypot(this.boat.x-landing.x,this.boat.z-landing.z);}
    tie(){
      if(this.result||!this.started||this.toPier()>6||Math.abs(this.speed)>3.2)return false;
      this.result={tenths:clamp(Math.round(this.elapsed*10),1,864000),held:this.held,caught:this.elapsed<=this.deadline,luis:this.luis};
      Object.assign(this.boat,landing,{phase:"berth",at:1,speed:0});this.speed=0;return true;
    }
    move(dt,gas,back,rudder){
      this.age+=dt;const v=this.boat;
      if(this.result)return;
      this.started||=gas||back;
      if(this.started)this.elapsed+=dt;
      this.bump=Math.max(0,this.bump-dt);v.replied=Math.max(0,v.replied-dt);
      const throttle=back?-3.4:gas?13.5:0;
      this.speed+=(throttle-this.speed)*-Math.expm1(-dt*(back?.82:gas?.57:.26));
      const turn=rudder*1.13,grip=clamp(Math.abs(this.speed)*.26,0,1);
      const yaw=v.yaw+(turn-v.yaw)*-Math.expm1(-dt*2.3*grip);
      if(clear(v.x,v.z,yaw))v.yaw=yaw;
      const x=v.x+Math.sin(v.yaw)*this.speed*dt,z=v.z+Math.cos(v.yaw)*this.speed*dt;
      if(clear(x,z,v.yaw)){v.x=x;v.z=z;}
      else {if(Math.abs(this.speed)>2)this.bump=1.6;this.speed=0;}
      v.y=.12+.045*Math.sin(this.age*1.5+v.z*.03);v.speed=this.speed;
      if(this.speed>3&&(!v.wake.length||this.age-v.wake.at(-1).t>.22))v.wake.push({...BayDriving.world(v,0,-3.9),t:this.age});
      while(v.wake.length&&this.age-v.wake[0].t>2.8)v.wake.shift();
    }
    instruction(){
      if(!this.started)return "W opens the throttle. A / D steer. Bring Luz to the striped fenders at North Float.";
      if(this.bump)return "Against a fender. Hold S to back clear, then steer around it.";
      if(this.toPier()<6)return Math.abs(this.speed)>3.2?"Hold S to slow alongside the fenders.":"F throws the line. Tie Luz up here.";
      if(this.boat.z>landing.z+3)return "North Float is astern. Use S to reverse and steer back to the fenders.";
      if(this.toPier()<36)return "Line up with the striped fenders. S slows the boat. F ties up within six metres.";
      if(!this.held&&this.nearSignal()&&this.elapsed<=this.deadline)return "H rings the amber buoy. Alma can hold the bus eight more seconds.";
      if(this.held&&this.boat.replied)return "Two bells back. Alma has her foot in the door.";
      if(this.boat.z<barge.z+7)return "Split around the dredge. The amber buoy is on your right. Ring H beside it to ask Alma to wait.";
      return this.elapsed>this.deadline?"The bus has gone. Bring everyone alongside and collect Alma’s late slip.":"North Float ahead on the left. Look for the striped fenders.";
    }
    eye(beat){
      if(beat==="land")return {x:landing.x-11,y:2.9,z:landing.z+6.5,yaw:2.12,pitch:-.13,focal:1.50};
      if(beat==="cast")return {x:this.boat.x+6.6,y:3.55,z:this.boat.z+6.5,yaw:-2.30,pitch:-.19,focal:1.5};
      const v=this.boat,q=BayDriving.world(v,0,-10.1),yaw=v.yaw;
      return {x:q.x,y:5.65,z:q.z,yaw,pitch:-.24,focal:1.30};
    }
    get landingAgent(){
      const walk=clamp((this.elapsed-this.deadline)*1.6,0,28);
      return {x:north.x-1-walk,z:north.z+.52,y:north.level,yaw:walk?-Math.PI/2:1.25};
    }
  }
  function telegraph(g){
    g.cyl(0,.08,0,.33,.37,.16,10,"#415b56");g.cyl(0,.71,0,.105,.19,1.23,9,"#50736d");
    g.box(0,1.26,0,.62,.54,.17,"#b39a61");g.box(0,1.28,.092,.52,.41,.023,"#e7d7aa");
    for(let i=-2;i<=2;i++){const a=i*.46;g.pole([.19*Math.sin(a),1.25+.19*Math.cos(a),.112],[.24*Math.sin(a),1.25+.24*Math.cos(a),.112],.013,"#704d36",5);}
    g.pole([0,1.23,.14],[-.21,1.52,.14],.031,"#755e40",6);g.box(-.22,1.54,.14,.105,.09,.09,"#422f28");
  }
  function set(g){
    g.box(0,.33,0,16.1,.88,8,"#554c41");g.box(0,.85,0,16.2,.15,8.12,"#99765c");
    for(const side of [-1,1]){g.box(side*7.8,1.10,0,.33,.39,8.0,"#e2c68e");g.box(side*7.8,1.10,0,.35,.40,1.25,"#ab563c");}
    g.box(-2,1.79,-.9,3.6,1.69,2.5,"#747b6a");g.box(-2,2.68,-.9,3.8,.13,2.64,"#cab685");
    for(const i of [-1,1])g.pole([i*1.05,.94,.4],[4,6.6,.4+i*.54],.105,"#bc8a45",6);
    g.pole([4,6.62,.4],[4,1.52,.4],.046,"#3c4540",5);g.box(4,1.48,.4,1.13,.79,.84,"#7e7260");
  }
  function fender(g){
    g.cyl(0,.79,0,.22,.27,1.72,8,"#493f38");
    for(let i=0;i<4;i++)g.cyl(0,1.13+i*.19,0,.238,.238,.18,8,i%2?"#373c36":"#f3d28b");
  }
  function street(run,view,model,person,passengers){
    const v=run.boat,list=[],see=p=>Math.abs(p.z-v.z)<165&&Math.abs(p.x-v.x)<140;
    BayFirstCrossing.world(view,model,list,see,v,run.age,person);
    model("watch/passengers",passengers);list.push(["watch/passengers",v.x,v.y,v.z,v.yaw]);
    if(run.luis==="aboard"){const q=BayDriving.world(v,-.75,.09);list.push([person(4,"local",0),q.x,v.y+.82,q.z,v.yaw-1.3]);}
    model("transfer/dredge",set);model("transfer/fender",fender);
    model("transfer/amber",g=>{g.cyl(0,.34,0,.38,.65,.87,10,"#c08237");g.cyl(0,1.07,0,.11,.15,.96,7,"#f0dbac");g.cyl(0,1.73,0,.21,.29,.47,8,"#e7ab4c");});
    if(see(barge))list.push(["transfer/dredge",barge.x,0,barge.z],["transfer/amber",signal.x,.09*Math.sin(run.age),signal.z]);
    if(see(north)){
      if(!run.marinaInstalled){BayMarinaArt.install(model);run.marinaInstalled=true;}
      list.push(["marina-gangway",215,0,north.z,0],["marina-dock",north.x,0,north.z,0]);
      for(const dz of [-4.7,4.7])list.push(["transfer/fender",landing.x-4,0,landing.z+dz]);
      const a=run.landingAgent;list.push([person(2,"local",run.elapsed>run.deadline&&a.x>north.x-28?Math.floor(run.age*6)%6:0,1),a.x,a.y,a.z,a.yaw]);
    }
    for(const a of list)view.draw(...a);
  }
  function overhead(canvas,r){
    const width=Math.round(Math.min(innerWidth,960)),h=Math.max(1,Math.round(width*innerHeight/innerWidth));
    if(canvas.width!==width||canvas.height!==h){canvas.width=width;canvas.height=h;}
    const c=canvas.getContext("2d"),v=r.boat,s=Math.min(width/94,h/68),cx=v.x,cz=v.z+13;
    const px=x=>width/2+(x-cx)*s,py=z=>h/2-(z-cz)*s;
    const rect=(x,z,w,d,color)=>{c.fillStyle=color;c.fillRect(px(x-w/2),py(z+d/2),w*s,d*s);};
    const grad=c.createLinearGradient(0,0,width,h);grad.addColorStop(0,"#558986");grad.addColorStop(1,"#427482");c.fillStyle=grad;c.fillRect(0,0,width,h);
    for(let i=0;i<100;i++){const x=cx-57+(i*97%113),z=Math.floor(cz/80)*80-80+(i*47%173);
      rect(x+Math.sin(i+r.age*.65)*.3,z,1.3,.11,"#82aaa5");}
    for(const d of [south,north]){rect((d.footX+d.x)/2,d.z,d.x-d.footX,d.walkW,"#b69a76");rect(d.x,d.z,d.headW,d.headD,"#b9a17d");}
    for(const [x,z,k,yaw] of BayMarina.sails){if(Math.abs(z-cz)>h/s/2+5)continue;
      c.save();c.translate(px(x),py(z));c.rotate(yaw);c.fillStyle="#efe0ba";c.beginPath();c.ellipse(0,0,k*s,2.68*k*s,0,0,2*Math.PI);c.fill();
      c.fillStyle="#b06756";c.fillRect(-.17*k*s,-1.7*k*s,.34*k*s,3.4*k*s);c.restore();}
    rect(barge.x,barge.z,16.2,8.1,"#a07856");rect(barge.x-2,barge.z-.9,3.8,2.64,"#cec09c");
    rect(signal.x,signal.z,1.3,1.3,"#f8c668");rect(landing.x-4,landing.z-4.7,.58,.65,"#f5d493");rect(landing.x-4,landing.z+4.7,.58,.65,"#f5d493");
    const a=r.landingAgent;rect(a.x,a.z,.48,.48,"#efc188");
    for(const w of v.wake){const t=r.age-w.t;rect(w.x-.5-t*.38,w.z,.32,1.1,"#a4c0b4");rect(w.x+.5+t*.38,w.z,.32,1.1,"#a4c0b4");}
    BayFirstCrossing.map(c,v,px,py,s,()=>true,true);
    for(const [i,[x,z]] of BaySixSharp.crewSeats.entries()){const q=BayDriving.world(v,x,z);rect(q.x,q.z,.29,.30,BaySixSharp.clothes[i%6]);}
  }
  function dial(canvas,r){
    const c=canvas.getContext("2d"),v=r.boat;
    c.clearRect(0,0,160,160);c.fillStyle="#ede0bc";c.fillRect(5,5,150,150);c.fillStyle="#294c49";c.fillRect(9,9,142,142);
    const x=p=>25+(p-220)*1.5,y=p=>115-(p+119)*.41;
    c.fillStyle="#937e61";c.fillRect(x(barge.x-8),y(barge.z+4),24,4);c.fillStyle="#f5c66b";c.fillRect(x(signal.x)-2,y(signal.z)-2,4,4);
    c.strokeStyle="#e0d6af";c.strokeRect(x(landing.x)-4,y(landing.z)-3,8,6);
    c.save();c.translate(x(v.x),y(v.z));c.rotate(v.yaw);c.fillStyle="#f5f1dc";c.beginPath();c.moveTo(0,-5);c.lineTo(3,4);c.lineTo(-3,4);c.closePath();c.fill();c.restore();
    c.textAlign="center";c.fillStyle="#efdbac";c.font="bold 11px monospace";c.fillText("NORTH FLOAT",80,22);
    c.fillText(r.elapsed>r.deadline?"BUS DEPARTED":"BUS   "+Math.ceil(r.deadline-r.elapsed)+" s",80,138);
    canvas._second=null;
  }
  window.BayLastTransfer={stand,landing,barge,signal,read,file,Run,telegraph,street,overhead,dial};
})();
