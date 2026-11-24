/* The bell is the cue. Each customer steps up to the window and leaves with the flavor they asked for. */
(() => {
  "use strict";
  const flavors=["guava","coconut","tamarind"],names=["Guava","Coconut","Tamarind"];
  const stops=[
    {id:"marlin",name:"Marlin Motel",z:-32.7,locals:[["Noel","The pink one. Guava stains the uniform anyway.",2,0],["Belén","Coconut. I’m eating this one in the shade.",3,1]]},
    {id:"palm",name:"Sol Promenade",z:51.5,locals:[["Mila","Tamarind for me. Save the sour ones for the regulars.",4,2],["Tomas","Guava, please. Same color as my board.",1,0]]},
    {id:"wheel",name:"North Boardwalk",z:113.5,locals:[["Dory","Coconut. It’ll last me one turn of the wheel.",5,1],["Rafi","Tamarind, with the little bits in it.",3,2]]}
  ].map(s=>({...s,x:149.05,dir:0,yaw:0,stand:{x:152.4,z:s.z},kind:"paleta-stop"}));
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const count=n=>Number.isSafeInteger(n)&&n>=0?Math.min(n,1e8):0;
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function read(raw){
    const at=clamp(count(raw?.at),0,2),s=raw?.shift;
    const shift=s&&Number.isInteger(s.stops)&&s.stops>=0&&s.stops<2?{stops:s.stops,served:clamp(count(s.served),0,1),
      till:clamp(count(s.till),0,180),wrong:!!s.wrong,open:!!s.open}:null;
    const hand=flavors.includes(raw?.hand)&&count(raw?.bites)>0?raw.hand:"";
    return {met:!!raw?.met,at,shift,hand,bites:hand?clamp(count(raw.bites),1,3):0,stamps:clamp(count(raw?.stamps),0,7),
      bought:count(raw?.bought),rounds:count(raw?.rounds),best:clamp(count(raw?.best),0,180),rev:count(raw?.rev)};
  }
  class Truck extends BayCab.StreetDriver{
    constructor(v,book){
      super(v);this.book=book;this.stop=book.at;this.location=stops[this.stop];this.manual=!!book.shift;
      this.phase=book.shift&&!book.shift.open?"drive":"open";this.open=this.phase==="open"?1:0;
      this.bell=0;this.wait=0;this.clock=0;this.wrap=0;this.selected=-1;this.round=0;this.called=false;
      this.people=[];this.biteTime=0;this.exchange=null;
      for(const [si,s] of stops.entries())for(const [i,[name,line,style,order]] of s.locals.entries()){
        const home={x:s.x+4.9+i*.85,z:s.z+(i?5.9:-6.4)};
        this.people.push({...home,home,stop:si,number:i,name,line,style,order,flavor:order,stage:"home",phase:i*1.3,yaw:i?Math.PI:0,
          treat:"",linger:0,moving:false,motion:new BayPlayerMotion()});
      }
      if(this.phase==="open")this.call(this.book.shift?.served||0);
    }
    get next(){return (this.stop+1)%stops.length;}
    get counter(){return BayDriving.world(this.vehicle,2.08,-1.08);}
    get first(){return this.people.find(p=>p.stop===this.stop&&p.stage==="queue");}
    get station(){return stops[this.stop];}
    target(inTruck){
      if(this.phase==="open")return {...this.counter,name:"La Campana · Serving window"};
      if(!inTruck)return {x:this.vehicle.x,z:this.vehicle.z,name:"La Campana · Driver’s door"};
      return stops[this.next];
    }
    call(served){
      this.wait=0;this.selected=-1;
      for(const p of this.people)if(p.stop===this.stop&&p.number>=served){
        p.stage="queue";p.treat="";p.linger=0;p.asked=false;
        p.flavor=(p.order+this.book.rounds+this.round)%3;
      }
    }
    ring(env){this.bell=1;env.chime();}
    hail(env){
      if(this.manual||this.clock<(this.hailedAt??-20)+6)return false;
      this.hailedAt=this.clock;this.holdForPlayer=true;this.ring(env);return true;
    }
    take(env){
      if(this.manual||this.book.shift||this.phase!=="open")return false;
      this.manual=true;this.book.shift={stops:0,served:0,till:0,wrong:false,open:false};
      this.close();this.phase="drive";this.guide=null;this.book.at=this.stop;env.commit();return true;
    }
    close(){
      for(const p of this.people)if(p.stage==="queue")p.stage="return";
      this.selected=-1;this.wait=0;
    }
    runIn(from,end){
      // Move into the loading lane early, leaving a straight truck-length beside the counter.
      const startOfBay={...end,z:end.z-5.8};
      return BayCab.track(BayCab.route(from,startOfBay).pts.concat([end]));
    }
    canPark(){
      const v=this.vehicle,b=stops[this.next];
      return Math.abs(v.x-b.x)<1.35&&Math.abs(v.z-b.z)<4.1&&Math.cos(v.yaw-b.yaw)>.94&&BayCab.stopped(v);
    }
    park(env){
      if(!this.manual||this.phase!=="drive"||!this.canPark())return false;
      this.stop=this.next;this.location={...stops[this.stop],x:this.vehicle.x,z:this.vehicle.z};this.phase="open";
      this.book.at=this.stop;this.book.shift.open=true;this.call(0);this.ring(env);env.commit();return true;
    }
    nearWindow(actor){return this.phase==="open"&&this.open>.76&&gap(this.counter,actor)<2.74;}
    ready(){
      const p=this.first;
      return this.open>.9&&p&&gap(p,this.counter)<.95?p:null;
    }
    serve(env){
      const p=this.ready();if(!p||!this.manual||this.wrap>.01)return false;
      if(gap(env.hero,p)>2.3){env.say("Nina Rojas","Come round to the front of the line. "+p.name+" is waiting.");return false;}
      const s=this.book.shift;
      if(this.selected!==p.flavor){
        if(this.selected>=0){s.wrong=true;env.commit();}
        env.say(p.name,this.selected<0?"Which one did you grab? "+names[p.flavor]+", please.":"That’s the "+flavors[this.selected]+" one. I asked for "+flavors[p.flavor]+".");return false;
      }
      const pay=18+(s.wrong?0:7);s.till+=pay;s.served++;s.wrong=false;
      this.handoff(p,env.hero);this.selected=-1;
      if(s.served===2){
        s.stops++;s.served=0;s.open=false;
        if(s.stops===2){
          const total=50+s.till;this.book.best=Math.max(total,this.book.best);this.book.rounds++;
          this.book.shift=null;this.manual=false;this.wait=0;this.called=false;
          env.finish(total);return true;
        }
        this.phase="drive";this.guide=null;env.say("Nina Rojas","That’s this corner. Next stop, "+stops[this.next].name+".");
      }else env.say(p.name,"That’s mine. Thank you!");
      env.commit();return true;
    }
    handoff(p,server){
      p.stage="return";p.treat=flavors[p.flavor];p.linger=.74;this.wrap=.58;
      const v=this.vehicle,start=server?BayDriving.world(server,.30,.30):BayDriving.world(v,1.04,-1.08);
      this.exchange={p,start,end:BayDriving.world(p,.29,.19),flavor:p.treat,fromWindow:!server};
    }
    passing(){
      if(!this.exchange||this.wrap<=0)return null;
      const e=this.exchange,t=clamp(1-this.wrap/.58,0,1),f=t*t*(3-2*t);
      return {x:e.start.x+(e.end.x-e.start.x)*f,z:e.start.z+(e.end.z-e.start.z)*f,
        height:(e.fromWindow?1.38:1.07)*(1-f)+1.04*f+.13*Math.sin(t*Math.PI),yaw:e.p.yaw,flavor:e.flavor};
    }
    move(p,goal,dt){
      const dx=goal.x-p.x,dz=goal.z-p.z,d=Math.hypot(dx,dz),step=Math.min(d,dt*1.52);
      p.moving=d>.07;if(!p.moving)return true;
      p.x+=dx*step/d;p.z+=dz*step/d;p.phase+=step*4.7;
      const turn=Math.atan2(dx,dz)-p.yaw;p.yaw+=Math.atan2(Math.sin(turn),Math.cos(turn))*-Math.expm1(-8*dt);return false;
    }
    step(dt,env){
      this.biteTime=Math.max(0,this.biteTime-dt);if(this.wrap<=0)this.exchange=null;
      this.clock+=dt;this.bell=Math.max(0,this.bell-dt/.98);this.wrap=Math.max(0,this.wrap-dt);
      const serving=this.phase==="open";this.open+=clamp((serving?1:0)-this.open,-1.5*dt,1.5*dt);
      const q=this.counter,v=this.vehicle;
      let place=0;
      for(const p of this.people){
        const oldX=p.x,oldZ=p.z,oldYaw=p.yaw;p.moving=false;
        if(p.linger>0){p.linger-=dt;}
        else if(p.stage==="queue"){
          // Keep the line on the sidewalk even when the truck parks a little way out from the curb.
          const target=BayDriving.world(v,2.78+place*.83,-1.08-place*1.02);place++;
          if(this.move(p,target,dt))p.yaw=Math.atan2(v.x-p.x,v.z-p.z);
        }else if(p.stage==="return"&&this.move(p,p.home,dt)){p.stage="home";p.linger=5;}
        else if(p.stage==="home"&&p.treat)p.treat="";
        if(Math.abs(env.hero.x-p.x)<55&&Math.abs(env.hero.z-p.z)<55){
          p.motion.handTarget=p.treat?{x:.32,y:1.02,z:.19,weight:.9}:p===this.first&&this.open>.8?{x:.31,y:.98,z:.38,weight:.72}:null;
          p.motion.step(dt,Math.hypot(p.x-oldX,p.z-oldZ),Math.atan2(Math.sin(p.yaw-oldYaw),Math.cos(p.yaw-oldYaw))/Math.max(.001,dt));
        }
      }
      if(this.manual){
        const p=this.ready();
        if(p&&!p.asked&&gap(q,env.hero)<4.3){p.asked=true;env.say(p.name,p.flavor===p.order?p.line:names[p.flavor]+", please. I’m trying a different one today.");}
        return;
      }
      if(env.occupied())return;
      if(this.phase==="reclaim"){
        const road=env.street(v);
        if(road&&Math.cos(v.yaw-road.yaw)>.65){this.location=road;this.phase="close";}
        else if(gap(v,env.hero)>85&&gap(this.station,env.hero)>75){
          this.location=env.berth(this.station,null);Object.assign(v,{x:this.location.x,z:this.location.z,yaw:this.location.yaw});BayDriving.settle(v);
          this.phase="open";this.call(0);
        }
        return;
      }
      if(serving){
        this.wait+=dt;
        if(!this.called&&this.wait>1){this.ring(env);this.called=true;}
        const front=this.ready();
        if(front&&this.wait>7+front.number*3&&!this.wrap)this.handoff(front);
        if(this.wait<(this.holdForPlayer?44:this.round===0&&this.stop===0?34:18)||gap(q,env.hero)<3.25)return;
        this.holdForPlayer=false;
        this.close();this.phase="close";
      }else if(this.phase==="close"&&this.open<.01){
        const from=env.street(v)||this.location,end=env.berth(stops[this.next],null);
        this.leg=this.newLeg(this.runIn({...from,x:v.x,z:v.z},end),end);this.leg.pace=8.1;this.phase="route";
      }else if(this.phase==="route"&&(this.drive(dt,env)||env.settle(this))){
        this.stop=this.next;this.phase="open";this.round++;this.called=false;this.call(0);
      }
    }
    abandon(){
      this.book.shift=null;this.manual=false;this.close();this.phase="reclaim";this.called=false;this.vehicle.campanaDriver=true;
    }
  }
  window.BayCampana={Truck,read,stops,flavors,names};
})();
