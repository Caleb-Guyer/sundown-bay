/* Inez's last morning run. The old engine telegraph at Marlin recalls the crossing. */
(() => {
  "use strict";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const south=BayMarina.docks[0],north=BayMarina.docks[1];
  const stand={x:south.x-11,z:south.z-1.5,y:south.level};
  const clip={x:north.x-5.05,z:north.z+.82,y:north.level};
  const landing=BayFirstCrossing.track(1),barge={x:253,z:-17},signal={x:271,z:-15};
  const estelaSeat=6,actors=new WeakMap();
  const resultValid=r=>r&&Number.isSafeInteger(r.tenths)&&r.tenths>0&&r.tenths<=864000&&
    ["aboard","ashore"].includes(r.luis)&&typeof r.held==="boolean"&&typeof r.caught==="boolean";
  function read(r){
    if(!resultValid(r?.first)||!resultValid(r.best))return null;
    const book={first:r.first,best:r.best,trips:Number.isSafeInteger(r.trips)?clamp(r.trips,1,9999):1};
    if(Array.isArray(r.punches))book.punches=[...new Set(r.punches.filter(id=>BayTransit.stops.some(s=>s.id===id)))];
    return book;
  }
  function file(old,r){
    if(!old)return {first:r,best:r,trips:1};
    return {...old,best:r.tenths<old.best.tenths?r:old.best,trips:Math.min(9999,old.trips+1)};
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
      this.landingAge=0;this.tieFrom=null;
      this.estelaMotion=new BayPlayerMotion();this.almaMotion=new BayPlayerMotion();
      this.estelaMotion.handTarget={x:.29,y:.91,z:.24,weight:1};
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
      this.tieFrom={x:this.boat.x,z:this.boat.z,yaw:this.boat.yaw};this.boat.speed=this.speed=0;return true;
    }
    scene(dt,land){
      const v=this.boat;this.age+=dt;v.y=.12+.045*Math.sin(this.age*1.5+v.z*.03);
      if(!land||!this.tieFrom)return;
      const old=this.passenger(),before=this.landingAgent;
      this.landingAge+=dt;const f=clamp(this.landingAge/2.2,0,1),u=f*f*(3-2*f),a=this.tieFrom;
      v.x=a.x+(landing.x-a.x)*u;v.z=a.z+(landing.z-a.z)*u;v.yaw=a.yaw*(1-u);
      if(f===1){v.phase="berth";v.at=1;}
      const p=this.passenger(),after=this.landingAgent;
      this.estelaMotion.step(dt,this.landingAge<2.2?0:Math.hypot(p.x-old.x,p.z-old.z),0);
      this.almaMotion.handTarget=this.result.caught?{x:.27,y:1.03,z:.36,weight:clamp((this.landingAge-7.2)*1.6,0,1)}:null;
      this.almaMotion.step(dt,Math.hypot(before.x-after.x,before.z-after.z),0);
      while(v.wake.length&&this.age-v.wake[0].t>2.8)v.wake.shift();
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
      if(beat==="land"){
        const p=this.passenger(),close=clamp((this.landingAge-6)/3,0,1),x=p.x-3.7+close*1.3,z=p.z+4.8-close*2.5;
        const y=2.95-close*.90,look=this.result.caught?p:{x:p.x+(clip.x-p.x)*close*.28,z:p.z+(clip.z-p.z)*close*.28};
        return {x,y,z,yaw:Math.atan2(look.x-x,look.z-z),pitch:Math.atan2(p.y+1.0-y,Math.hypot(look.x-x,look.z-z)),focal:1.47};
      }
      if(beat==="cast"){const t=clamp(this.age/4.5,0,1);
        return {x:this.boat.x+6.6-t*1.25,y:3.55-t*.47,z:this.boat.z+6.5,yaw:-2.26-t*.13,pitch:-.19,focal:1.5};}
      const v=this.boat,q=BayDriving.world(v,0,-10.1),yaw=v.yaw;
      return {x:q.x,y:5.65,z:q.z,yaw,pitch:-.24,focal:1.30};
    }
    get landingAgent(){
      const walk=clamp((this.elapsed-this.deadline+(this.result&&!this.result.caught?this.landingAge:0))*1.6,0,27);
      const receive=this.result?.caught?clamp(this.landingAge/5.4,0,1):0;
      return {x:clip.x+.38-walk+6.4*receive,z:clip.z-.40+2.3*receive,y:north.level,yaw:walk?-Math.PI/2:1.18};
    }
    passenger(){
      const v=this.boat,[sx,sz]=BaySixSharp.crewSeats[estelaSeat],t=this.landingAge;
      const onDeck=(x,z)=>({...BayDriving.world(v,x,z),y:v.y+.82});
      let a=onDeck(sx,sz),b=a,f=0,yaw=v.yaw;
      if(t>2.2&&t<4.15){b=onDeck(-1.51,0);f=(t-2.2)/1.95;}
      else if(t>=4.15){
        a=onDeck(-1.51,0);b=BayFirstCrossing.stop(1);f=clamp((t-4.15)/3.6,0,1);
        if(t>=7.75){a=b;b=this.result.caught?{...this.landingAgent,x:this.landingAgent.x+.57}:{...clip,z:clip.z-.40};
          f=clamp((t-7.75)/(this.result.caught?1.3:5.1),0,1);}
      }
      if(t>2.2)yaw=Math.atan2(b.x-a.x,b.z-a.z);
      return {x:a.x+(b.x-a.x)*f,z:a.z+(b.z-a.z)*f,y:a.y+(b.y-a.y)*f,yaw};
    }
    porter(){const v=this.boat;if(this.luis==="aboard")return {...BayDriving.world(v,-.75,.09),y:v.y+.82,yaw:v.yaw-1.30};
      const d=BayFirstCrossing.stop(0);return {x:d.x-.57,z:d.z,y:d.y,yaw:1.32};}
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
  function ticketClip(g){
    g.box(0,.66,0,.10,1.33,.10,"#68634f");g.box(0,1.16,0,.47,.55,.073,"#37655f");
    g.box(0,1.15,.047,.34,.37,.017,"#e5b782");
    for(let i=0;i<3;i++)g.box(-.025,1.23-i*.065,.06,.21-i*.026,.014,.011,"#796a50");
    g.box(0,1.35,.068,.13,.081,.033,"#b6a176");
  }
  function mapClip(c,x,y,s){
    c.save();c.translate(x,y);c.scale(s,s);
    c.fillStyle="#746d56";c.fillRect(-.17,.015,.47,.19);
    c.fillStyle="#365f59";c.fillRect(-.25,-.14,.51,.28);
    c.fillStyle="#edc996";c.fillRect(-.17,-.06,.34,.18);
    c.fillStyle="#966951";c.fillRect(-.105,.018,.18,.018);c.fillRect(-.105,.063,.15,.014);
    c.fillStyle="#aa996b";c.fillRect(-.065,-.085,.13,.068);c.restore();
  }
  function street(run,view,model,person,passengers){
    const v=run.boat,list=[],see=p=>Math.abs(p.z-v.z)<165&&Math.abs(p.x-v.x)<140;
    BayFirstCrossing.world(view,model,list,see,v,run.age,person);
    model("transfer/passengers",g=>passengers(g,estelaSeat));list.push(["transfer/passengers",v.x,v.y,v.z,v.yaw]);
    let cast=actors.get(view);if(!cast){cast={};actors.set(view,cast);}
    function actor(id,p,colors,motion){
      const key="transfer/"+id;if(!cast[id]){cast[id]=new BayPlayerMesh(colors,"local");view.add(key,cast[id],true);}
      const mesh=cast[id];if(mesh.sourceMotion!==motion){mesh.sourceMotion=motion;mesh.lastRevision=-1;}
      if(mesh.update(motion))view.updateAnimated(key);
      list.push([key,p.x,p.y+motion.lift,p.z,p.yaw]);return mesh;
    }
    const rider=run.passenger(),mesh=actor("estela",rider,["#ac7b5c","#a96956","#465754"],run.estelaMotion);
    const arm=mesh.sides[1],hand=arm.forearm.map(arm.handPivot,[]),at=BayDriving.world(rider,hand[0],hand[2]);
    model("transfer/cane",g=>{g.pole([0,0,0],[.035,-.83,-.06],.021,"#b78752",7);
      g.pole([0,0,0],[0,.012,-.105],.034,"#704f37",7);g.cyl(.035,-.84,-.06,.029,.037,.06,7,"#484a42");});
    list.push(["transfer/cane",at.x,rider.y+run.estelaMotion.lift+hand[1],at.z,rider.yaw]);
    const l=run.porter();if(see(l)){
      list.push([person(4,"local",0),l.x,l.y,l.z,l.yaw]);
      model("transfer/tins",g=>{for(const s of [-1,1]){g.box(s*.31,.70,0,.21,.20,.26,s>0?"#426e83":"#637a60");
        g.box(s*.31,.815,0,.22,.04,.27,"#cfbfa1");g.pole([s*.31,.83,-.06],[s*.31,.90,0],.014,"#544b40",5);g.pole([s*.31,.90,0],[s*.31,.83,.06],.014,"#544b40",5);}});
      list.push(["transfer/tins",l.x,l.y,l.z,l.yaw]);
    }
    model("transfer/dredge",set);model("transfer/fender",fender);
    model("transfer/amber",g=>{g.cyl(0,.34,0,.38,.65,.87,10,"#c08237");g.cyl(0,1.07,0,.11,.15,.96,7,"#f0dbac");g.cyl(0,1.73,0,.21,.29,.47,8,"#e7ab4c");});
    if(see(barge))list.push(["transfer/dredge",barge.x,0,barge.z],["transfer/amber",signal.x,.09*Math.sin(run.age),signal.z]);
    if(see(north)){
      if(!run.marinaInstalled){BayMarinaArt.install(model);run.marinaInstalled=true;}
      list.push(["marina-gangway",215,0,north.z,0],["marina-dock",north.x,0,north.z,0]);
      for(const dz of [-4.7,4.7])list.push(["transfer/fender",landing.x-4,0,landing.z+dz]);
      model("transfer/ticket-clip",ticketClip);list.push(["transfer/ticket-clip",clip.x,clip.y,clip.z,0]);
      const a=run.landingAgent,agent=actor("alma",a,["#986b53","#557c91","#4c5146"],run.almaMotion);
      if(run.result?.caught&&run.landingAge>6){
        const limb=agent.sides[1],h=limb.forearm.map(limb.handPivot,[]),q=BayDriving.world(a,h[0],h[2]);
        model("transfer/card",g=>{g.box(0,0,0,.19,.013,.102,"#edcd91");g.box(-.05,.010,0,.014,.008,.097,"#9a6751");});
        list.push(["transfer/card",q.x,a.y+run.almaMotion.lift+h[1],q.z,a.yaw]);
      }
      if(run.tieFrom&&run.landingAge<2.25){
        const bow=BayDriving.world(v,-1.28,2.92),end={x:landing.x-4,z:landing.z+4.7};
        model("transfer/heaving-line",g=>g.box(0,0,0,.041,.041,1,"#e4d3a4"));
        const dx=end.x-bow.x,dz=end.z-bow.z,length=Math.hypot(dx,dz),n=Math.ceil(length/.6);
        for(let i=0;i<n;i++){const t=(i+.5)/n;
          list.push(["transfer/heaving-line",bow.x+dx*t,.92-.26*(1-run.landingAge/2.25)*Math.sin(t*Math.PI),bow.z+dz*t,Math.atan2(dx,dz),0,0,length/n]);}
      }
    }
    view.drawOpaque(list);
  }
  function overhead(canvas,r,beat,quality=1){
    const width=Math.max(1,Math.round(Math.min(innerWidth,960)*quality)),h=Math.max(1,Math.round(width*innerHeight/innerWidth));
    if(canvas.width!==width||canvas.height!==h){canvas.width=width;canvas.height=h;}
    const c=canvas.getContext("2d"),v=r.boat,wide=beat==="helm",landingShot=beat==="land",rider=r.passenger();
    const s=wide?Math.min(width/94,h/68):landingShot?Math.min(width/12,h/7.2):Math.min(width/27,h/17);
    const focus=landingShot?rider:v,cx=wide?v.x:focus.x-(landingShot?.65:1.9),cz=wide?v.z+13:focus.z+.25;
    const px=x=>width/2+(x-cx)*s,py=z=>h/2-(z-cz)*s;
    const rect=(x,z,w,d,color)=>{c.fillStyle=color;c.fillRect(px(x-w/2),py(z+d/2),w*s,d*s);};
    const grad=c.createLinearGradient(0,0,width,h);grad.addColorStop(0,"#558986");grad.addColorStop(1,"#427482");c.fillStyle=grad;c.fillRect(0,0,width,h);
    for(let i=0;i<100;i++){const x=cx-57+(i*97%113),z=Math.floor(cz/80)*80-80+(i*47%173);
      rect(x+Math.sin(i+r.age*.65)*.3,z,1.3,.11,"#82aaa5");}
    function decking(x,z,w,d){
      rect(x+.11,z-.18,w,d,"#4c6f69");rect(x,z,w,d,"#bda581");
      const left=x-w/2,right=x+w/2;
      for(let k=Math.max(0,Math.floor((cx-width/(2*s)-left)/.46));left+k*.46<Math.min(right,cx+width/(2*s));k++){
        const at=left+k*.46;rect(at,z,.027,d,"#93826c");
        if(!wide)for(const edge of [-1,1])rect(at+.075,z+edge*(d/2-.15),.04,.042,"#766b58");
      }
    }
    for(const d of [south,north]){if(Math.abs(d.z-cz)>(h/s+d.headD)/2)continue;
      decking((d.footX+d.x)/2,d.z,d.x-d.footX,d.walkW);decking(d.x,d.z,d.headW,d.headD);}
    for(const [x,z,k,yaw] of BayMarina.sails){if(Math.abs(z-cz)>h/s/2+5)continue;
      c.save();c.translate(px(x),py(z));c.rotate(yaw);c.fillStyle="#efe0ba";c.beginPath();c.ellipse(0,0,k*s,2.68*k*s,0,0,2*Math.PI);c.fill();
      c.fillStyle="#b06756";c.fillRect(-.17*k*s,-1.7*k*s,.34*k*s,3.4*k*s);c.restore();}
    rect(barge.x,barge.z,16.2,8.1,"#a07856");rect(barge.x-2,barge.z-.9,3.8,2.64,"#cec09c");
    rect(signal.x,signal.z,1.3,1.3,"#f8c668");rect(landing.x-4,landing.z-4.7,.58,.65,"#f5d493");rect(landing.x-4,landing.z+4.7,.58,.65,"#f5d493");
    mapClip(c,px(clip.x),py(clip.z),s);
    const a=r.landingAgent;
    BaySixSharpArt.personAt(c,px(a.x),py(a.z),s,a.yaw,"#986b53","#557c91",r.almaMotion.phase,r.almaMotion.weight,false);
    if(r.result?.caught&&r.landingAge>6){const q=BayDriving.world(a,.24,.34);rect(q.x,q.z,.20,.11,"#f1cd89");}
    for(const w of v.wake){const t=r.age-w.t;rect(w.x-.5-t*.38,w.z,.32,1.1,"#a4c0b4");rect(w.x+.5+t*.38,w.z,.32,1.1,"#a4c0b4");}
    BayFirstCrossing.map(c,v,px,py,s,()=>true,true);
    for(const [i,[x,z]] of BaySixSharp.crewSeats.entries()){if(i===estelaSeat)continue;const q=BayDriving.world(v,x,z);
      BaySixSharpArt.personAt(c,px(q.x),py(q.z),s,v.yaw+i*2.38-.9,BaySixSharp.faces[i%4],BaySixSharp.clothes[i%6],0,0,false);}
    const l=r.porter();BaySixSharpArt.personAt(c,px(l.x),py(l.z),s,l.yaw,"#926349","#a59569",0,0,true);
    BaySixSharpArt.personAt(c,px(rider.x),py(rider.z),s,rider.yaw,"#ac7b5c","#a96956",r.estelaMotion.phase,r.estelaMotion.weight,false);
    const grip=BayDriving.world(rider,.24,.12),tip=BayDriving.world(rider,.34,.49);
    c.strokeStyle="#725439";c.lineWidth=Math.max(1,s*.047);c.beginPath();c.moveTo(px(grip.x),py(grip.z));c.lineTo(px(tip.x),py(tip.z));c.stroke();
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
  window.BayLastTransfer={stand,clip,landing,barge,signal,read,file,Run,telegraph,ticketClip,mapClip,street,overhead,dial};
})();
