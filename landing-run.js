/* One of the witnesses now makes the crossing they argued for. */
(() => {
  "use strict";
  const stories={
    clinic:{name:"Alma Reyes",colors:["#986b53","#557c91","#4c5146"],parcel:"appointment cards",
      offer:["Take the Thursday cards? I need both hands to get this timetable up straight.","These are the signed stubs. Keep the elastic on till we get back."],
      aboard:"See the pencil marks? Those are people's bus stops. I put the riverside ones first.",
      receipt:["Thursday, eight ten. First time I’ve been able to write the time in ink.","Count the torn edges. Everybody who came over went home."]},
    shift:{name:"Luis Vega",colors:["#926349","#a59569","#414f54"],parcel:"blue lunch tin",
      offer:["Take the blue one for me? The handle on the green one slips through my glove.","Bring the blue tin back across? My brother washed it out with the good soap."],
      aboard:"Hold it up to the light. See the little crescent? Mara was eight. Dropped it right here.",
      receipt:["Beans still warm. You can smell the bay leaf through the lid.","He left a quarter under the napkin. He thinks he’s paying for the boat."]}
  };
  const dock=i=>BayFirstCrossing.stop(i);
  function counter(i){const s=dock(i);return {x:s.x-3.45,y:s.y,z:s.z-2.78};}
  function waiting(i){const p=counter(i);return {...p,x:p.x+.64,z:p.z+.42};}
  function read(raw){
    const origin=raw?.origin;
    return {origin:origin===0||origin===1?origin:null,landed:(origin===0||origin===1)&&raw?.landed===true,
      received:[0,1].map(i=>Number.isSafeInteger(raw?.received?.[i])?Math.max(0,Math.min(9999,raw.received[i])):0)};
  }
  function position(s,p){return {...BayDriving.world(s,p.x,p.z),y:s.y+.83};}
  const rail={x:.73,z:.68};
  class Regular {
    constructor(s,route){
      this.route=route;this.story=stories[route];this.log=s.book.hearing.run;
      this.from=this.log.origin??s.at;const arrived=this.log.landed;
      this.phase=arrived?"receive":"wait";this.elapsed=0;this.distance=0;this.dirty=false;
      this.motion=new BayPlayerMotion();this.yaw=arrived?-.9:1.24;
      Object.assign(this,waiting(arrived?1-this.from:this.from));
    }
    get carrying(){return this.log.origin!==null;}
    get gangway(){return this.phase==="board"||this.phase==="ashore";}
    get destination(){return 1-this.from;}
    marker(){const i=this.carrying||["ashore","rest","receive"].includes(this.phase)?this.destination:this.from;
      return {...waiting(i),kind:"chapter",name:BayMarina.docks[i].name+" · "+this.story.name};}
    action(p){
      if(Math.hypot(p.x-this.x,p.z-this.z)>1.65||Math.abs(p.y-this.y)>1.2)return "";
      if(this.phase==="receive"&&this.carrying)return "deliver";
      if(!this.carrying&&["wait","board","ride"].includes(this.phase))return "take";
      if(this.phase==="ride")return "talk";
      return "";
    }
    interact(action,morning,player){
      if(action==="take"&&!this.carrying){
        this.exchange={action,age:0,player};this.log.origin=this.from;this.log.landed=false;return this.story.offer[this.from];
      }
      if(action==="deliver"&&this.carrying&&this.phase==="receive"){
        this.exchange={action,age:0,player};const line=this.story.receipt[this.from];this.log.received[this.destination]=Math.min(9999,this.log.received[this.destination]+1);
        this.log.origin=null;this.log.landed=false;this.phase="rest";this.elapsed=0;return line;
      }
      if(this.route==="shift"&&morning)return morning.luis==="aboard"?"That morning Dalia held the gate, my brother got his lunch hot. He still asks after her.":"The day I missed the six, my brother ate glove-box crackers. He still won’t let me pack him any.";
      return this.story.aboard;
    }
    walk(dt,q){
      const dx=q.x-this.x,dz=q.z-this.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*1.48);
      if(d>.005){const yaw=Math.atan2(dx,dz);this.yaw+=Math.atan2(Math.sin(yaw-this.yaw),Math.cos(yaw-this.yaw))*-Math.expm1(-12*dt);}
      const f=d?step/d:1;this.x+=dx*f;this.z+=dz*f;this.y+=(q.y-this.y)*f;this.distance+=step;return step>=d;
    }
    path(s,shore){
      const p=dock(shore),deck=position(s,rail),edge=position(s,{x:-1.40,z:.35});
      return [{...p,x:p.x-.34,z:p.z+.36},{x:p.x+.60,z:p.z+.36,y:p.y+.05},edge,deck];
    }
    step(dt,s,viewer){
      this.elapsed+=dt;this.distance=0;
      if(this.exchange){this.exchange.age+=dt;if(this.exchange.age>=1)this.exchange=null;}
      if(this.phase==="wait"){
        if(this.elapsed>=(this.route==="clinic"?2.5:16)||this.carrying||s.rider&&s.at===this.from){
          if(s.phase==="berth"&&s.at===this.from&&(!s.rider||["board","wait"].includes(s.rider.phase))){
            this.phase="board";this.pathTo=this.path(s,this.from);
          }else if(s.phase==="berth"&&!s.rider)s.call(this.from);
        }
      }else if(this.phase==="ride"){
        Object.assign(this,position(s,rail));this.yaw=s.yaw-.95;
        if(s.phase==="berth"&&s.at===this.destination){
          this.phase="ashore";this.pathTo=this.path(s,this.destination).reverse().slice(1);this.pathTo.push(waiting(this.destination));
        }else if(s.phase==="berth"&&this.route==="shift"&&!s.rider)s.depart();
      }else if(this.phase==="rest"&&this.elapsed>=24){
        this.from=this.destination;this.phase="wait";this.elapsed=0;
      }
      if(this.gangway&&this.walk(dt,this.pathTo[0])){
        this.pathTo.shift();
        if(!this.pathTo.length){
          if(this.phase==="board")this.phase="ride";
          else{this.phase=this.carrying?"receive":"rest";if(this.carrying){this.log.landed=true;this.dirty=true;}}
          this.elapsed=0;
        }
      }
      if(Math.abs(viewer.x-this.x)<82&&Math.abs(viewer.z-this.z)<82){
        if(this.exchange&&!this.gangway){
          const q=this.exchange.action==="deliver"?counter(this.destination):this.exchange.player,angle=Math.atan2(q.x-this.x,q.z-this.z)-this.yaw;
          this.yaw+=Math.atan2(Math.sin(angle),Math.cos(angle))*-Math.expm1(-8*dt);
        }
        this.motion.handTarget=this.exchange?{x:.24,y:.93,z:.43,weight:Math.sin(Math.PI*this.exchange.age)}:
          this.carrying||this.phase==="rest"?null:{x:.29,y:.83,z:.17,weight:.9};
        this.motion.step(dt,this.distance,0);
      }
    }
    blocks(x,z){return this.phase==="ride"&&Math.hypot(x-rail.x,z-rail.z)<.48;}
  }
  function parcel(g,route){
    if(route==="shift"){
      g.box(0,.112,0,.32,.19,.22,"#416b81");g.box(0,.21,0,.335,.029,.23,"#c2bda8");
      g.box(0,.019,0,.32,.027,.22,"#8e9b99");g.box(0,.17,.117,.055,.06,.015,"#c9b179");
      for(const side of [-1,1])g.pole([side*.085,.223,0],[side*.07,.30,0],.012,"#565753",5);
      g.pole([-.07,.30,0],[.07,.30,0],.016,"#7d654e",6);
    }else{
      g.box(0,.034,0,.24,.064,.33,"#e5c999");g.box(0,.073,0,.25,.018,.335,"#bb805f");
      g.box(.03,.085,0,.025,.014,.34,"#584b3e");g.box(-.069,.087,-.09,.084,.008,.06,"#f1dfb5");
    }
  }
  function table(g){
    for(const x of [-.41,.41])for(const z of [-.23,.23])g.box(x,.37,z,.06,.74,.06,"#5e716d");
    g.box(0,.76,0,.98,.075,.61,"#9e8461");g.box(0,.83,-.27,.98,.085,.038,"#796347");
  }
  function inHand(model,list,r,p,mesh,lift){
    const limb=mesh.sides[1],hand=limb.forearm.map(limb.handPivot,[]),at=BayDriving.world(p,hand[0],hand[2]),key="luz/parcel/"+r.route;
    model(key,g=>parcel(g,r.route));list.push([key,at.x,p.y+lift+hand[1]-(r.route==="shift"?.29:.05),at.z,p.yaw]);
  }
  function world(view,model,list,see,s){
    const r=s.regular,item="luz/parcel/"+r.route;
    for(let i=0;i<2;i++){
      const p=counter(i);if(!see(p,48))continue;
      model("luz/receiving-table",table);list.push(["luz/receiving-table",p.x,p.y,p.z,0]);
      if(r.log.received[i]&&!(r.exchange?.action==="deliver"&&r.destination===i&&r.log.received[i]===1)){
        model(item,g=>parcel(g,r.route));list.push([item,p.x-.24,p.y+.80,p.z+.025,.18]);
      }
    }
    if(see(r,70)){
      const key="luz/commuter/"+r.route;
      if(!r.mesh){r.mesh=new BayPlayerMesh(r.story.colors,"local");view.add(key,r.mesh,true);}
      if(r.mesh.update(r.motion))view.updateAnimated(key);list.push([key,r.x,r.y+r.motion.lift,r.z,r.yaw]);
      if(!r.carrying&&r.phase!=="rest"&&see(r,45))inHand(model,list,r,r,r.mesh,r.motion.lift);
    }
    if(r.exchange&&see(r,45)){
      const e=r.exchange,p=e.player,receive=e.action==="deliver",table=counter(r.destination);
      const hand=a=>({...BayDriving.world(a,.29,.22),y:a.y+(r.route==="shift"?.64:.92)});
      const a=hand(receive?p:r),b=receive?{x:table.x-.24,y:table.y+.80,z:table.z+.025}:hand(p);
      const t=e.age*e.age*(3-2*e.age);model(item,g=>parcel(g,r.route));
      list.push([item,a.x+(b.x-a.x)*t,a.y+(b.y-a.y)*t+.17*Math.sin(Math.PI*t),a.z+(b.z-a.z)*t,receive?.18:p.yaw]);
    }
  }
  function map(c,s,px,py,k,visible){
    const r=s.regular;
    for(let i=0;i<2;i++){const p=counter(i),x=px(p.x),y=py(p.z);if(!visible(x,y,8))continue;
      c.fillStyle="#957a57";c.fillRect(x-k*.49,y-k*.305,.98*k,.61*k);
      if(r.log.received[i]){c.fillStyle=r.route==="shift"?"#446c80":"#d9976e";c.fillRect(x-k*.34,y-k*.12,.26*k,.23*k);}}
    if(!visible(px(r.x),py(r.z),8))return;
    c.save();c.translate(px(r.x),py(r.z));c.rotate(r.yaw);c.fillStyle=r.story.colors[1];
    c.beginPath();c.ellipse(0,0,.31*k,.21*k,0,0,Math.PI*2);c.fill();c.fillStyle=r.story.colors[0];
    c.beginPath();c.arc(0,-.03*k,Math.max(.8,.15*k),0,Math.PI*2);c.fill();
    if(!r.carrying){c.fillStyle=r.route==="shift"?"#466f84":"#cf986d";c.fillRect(.22*k,-.22*k,.23*k,.25*k);}c.restore();
  }
  window.BayLandingRun={read,Regular,waiting,counter,world,map,inHand};
})();
