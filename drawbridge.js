/* Salt Creek crossing. Road and water share the same gates, span and signals. */
(() => {
  "use strict";
  const length=Math.hypot(11,14),sn=11/length,cs=14/length,heading=Math.atan2(11,14);
  const center={x:178.5,z:265},clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const at=(s,u)=>({x:center.x+sn*s+cs*u,z:center.z+cs*s-sn*u});
  function local(x,z){const dx=x-center.x,dz=z-center.z;return {s:dx*sn+dz*cs,u:dx*cs-dz*sn};}
  const nearby=(x,z)=>x>136&&x<252&&z>208&&z<307;
  const site={...at(-16,7.3),id:"salt-creek",kind:"drawbridge",name:"Salt Creek Drawbridge"};
  const mouth={...at(0,61),kind:"bridge-channel",name:"Salt Creek channel marks"};
  const iceDock={...at(0,-39.6),id:"ice-landing",kind:"creek-landing",name:"Salt Creek Ice Landing",level:.54};
  const iceCounter={...at(-2.8,-39.4),name:"Leda Vale"};
  const iceBerth={...at(5.95,-39.4),yaw:heading+Math.PI/2},iceStep={...at(3.4,-39.4),y:.54,yaw:heading+Math.PI};
  const ladder={...at(4.7,-39.4),dock:iceDock,y:.54};
  const planks=[[0,-40],[2,-44],[12,-52]];
  const bankEnd=at(12,-52),bankHeight=BayCut.height(bankEnd.x,bankEnd.z);
  function landingLevel(x,z,r=0){
    if(x<139||x>162||z<281||z>312)return null;
    const {s,u}=local(x,z);
    if(Math.abs(s)<=4.7-r&&Math.abs(u+39.6)<=1.1-r)return .54;
    for(let i=1;i<planks.length;i++){
      const [a,b]=planks[i-1],[c,d]=planks[i],ds=c-a,du=d-b;
      const t=clamp(((s-a)*ds+(u-b)*du)/(ds*ds+du*du),0,1);
      if(Math.hypot(s-a-ds*t,u-b-du*t)<=1.12-r)return i===1?.54:.54+(bankHeight-.54)*t;
    }
    return null;
  }
  function scow(x,z,r=0){
    if(x<228||x>246||z<208||z>228)return false;
    const {s,u}=local(x,z);return Math.abs(s)<5+r&&Math.abs(u-74.3)<2.9+r;
  }
  function channel(x,z){
    if(!nearby(x,z))return false;
    const {s,u}=local(x,z);
    return u<72&&u>=-41&&Math.hypot(s,Math.max(0,-34.4-u))<=6.6||
      s>3.85&&s<7.9&&u> -44&&u< -30;
  }
  function read(raw){
    const count=Number.isSafeInteger(raw?.count)?clamp(raw.count,0,1000000):0;
    const log=(Array.isArray(raw?.log)?raw.log:[]).filter(p=>p&&["in","out"].includes(p.direction)&&
      Number.isFinite(p.delay)&&p.delay>=0&&p.delay<=86400&&Number.isInteger(p.pay)&&p.pay>=95&&p.pay<=125)
      .slice(-5).map(({direction,delay,pay})=>({direction,delay,pay}));
    return {count,best:Number.isFinite(raw?.best)&&raw.best>=0&&raw.best<=86400?raw.best:null,log};
  }
  class Packet{
    constructor(){
      this.u=62;this.direction=-1;this.s=-1.55;this.speed=2.9;this.wait=0;this.turn=null;
      this.halfWidth=1.3;this.halfLength=3.6;this.calls=false;this.ice=true;this.position();
    }
    position(){
      Object.assign(this,at(this.s,this.u));
      if(this.turn==null)this.yaw=heading+this.direction*Math.PI/2;
    }
    step(dt,open,env){
      if(this.wait>0){this.wait=Math.max(0,this.wait-dt);if(!this.wait){this.turn=0;this.ice=!this.ice;}return;}
      if(this.turn!=null){
        const a=Math.min(Math.PI,this.turn+dt*.75),d=this.direction,berth=d<0?-33.5:67;
        this.s=d*1.55*Math.cos(a);this.u=berth+d*1.55*Math.sin(a);
        this.yaw=Math.atan2(cs*d*Math.cos(a)-sn*d*Math.sin(a),-sn*d*Math.cos(a)-cs*d*Math.sin(a));
        this.speed=1.16;this.turn=a;
        if(a>=Math.PI){this.turn=null;this.direction=-d;this.calls=false;}
        this.position();return;
      }
      const d=this.direction,remaining=d*((d<0?-33.5:67)-this.u),before=-d*this.u;
      if(!this.calls&&before>0&&before<32){this.calls=true;env.signal("whistle");}
      const toStop=!open&&before>7.2?Math.max(0,before-13.1):Infinity;
      let waterAhead=Infinity,lane=d*1.55;
      const traffic=env.lookout?.(),near=traffic&&local(traffic.x,traffic.z);
      if(near&&Math.abs(this.u)<40){
        const front=(near.u-this.u)*d,side=near.s-lane;
        if(front>-3.8&&front<22&&Math.abs(side)<3.4){
          lane=clamp(near.s+(side>0?-3.5:3.5),-4.2,4.2);
          if(front>=0&&Math.abs(near.s-this.s)<2.85)waterAhead=Math.max(0,front-7);
        }
      }
      this.s+=clamp(lane-this.s,-.86*dt,.86*dt);
      const free=Math.min(remaining,toStop,waterAhead);
      const want=Math.min(3.4,free*1.12);
      this.speed+=(want-this.speed)*-Math.expm1(-(want<this.speed?2:1.15)*dt);
      const travel=Math.min(free,this.speed*dt);this.u+=d*travel;
      if(free<.035){this.speed=0;if(remaining<.035){this.u=d<0?-33.5:67;this.wait=d<0?13:24;}}
      this.position();
    }
    get inbound(){return !this.wait&&this.turn==null&&this.calls&&-this.direction*this.u>0;}
  }
  class Crossing{
    constructor(){
      this.packet=new Packet();this.phase="road";this.lift=0;this.gates=0;
      this.age=0;this.onWatch=false;this.owned=false;this.privateCall=0;this.delay=0;
      this.roadUser="";this.waterUser="";this.gateReady=false;this.sternClear=false;this.reopen=false;this.waterFor=0;
      this.tender={...site,y:1.83,yaw:heading};
      this.relief=0;
      this.walker={...at(26,-4.1),s:26,u:-4.1,dir:-1,wait:5,yaw:heading+Math.PI,phase:0,moving:false,style:4,role:"local",name:"Caro Díaz"};
    }
    setPhase(p){this.phase=p;this.age=0;}
    start(){if(this.onWatch)return false;this.onWatch=true;this.delay=0;return true;}
    handBack(){this.onWatch=false;this.owned=false;}
    get demand(){return this.packet.inbound||this.privateCall>0;}
    hail(p){
      if(!this.canHail(p))return false;
      this.privateCall=32;
      if(this.phase==="water")this.waterFor=Math.max(this.waterFor,this.age+10);
      return true;
    }
    canHail(p){
      if(!p||!nearby(p.x,p.z))return false;
      const {s,u}=local(p.x,p.z);return Math.abs(s)<6.8&&Math.abs(u)>7.3&&Math.abs(u)<34;
    }
    stopDistance(p,dx,dz,r=0){
      if(this.phase==="road"||!nearby(p.x,p.z))return Infinity;
      const {s,u}=local(p.x,p.z),forward=dx*sn+dz*cs,bound=16.2+r;
      if(Math.abs(u)>8||Math.abs(s)>49||s*forward>=0||Math.abs(forward)<.4||Math.abs(s)<bound-.09)return Infinity;
      return Math.max(0,(Math.abs(s)-bound)/Math.abs(forward));
    }
    roadOpenAt(x,z,r){
      if(this.phase==="road"||!nearby(x,z))return true;
      const {s,u}=local(x,z);
      if(Math.abs(u)>5.8+r)return true;
      return !(this.gates>.35&&Math.abs(Math.abs(s)-13)<.22+r||this.lift>.012&&Math.abs(s)<length/2+r);
    }
    waterOpenAt(x,z){
      return this.phase==="water"||!nearby(x,z)||Math.abs(local(x,z).u)>7.1;
    }
    onRoad(p,r=0){
      if(!p||!nearby(p.x,p.z))return false;
      const {s,u}=local(p.x,p.z);return Math.abs(s)<14+r&&Math.abs(u)<5.75+Math.min(r,.65);
    }
    inWaterGate(p,r=0){
      if(!p||!nearby(p.x,p.z))return false;
      const {s,u}=local(p.x,p.z);return Math.abs(s)<7.1&&Math.abs(u)<6.7+r;
    }
    walk(dt){
      const w=this.walker;w.moving=false;
      if(w.wait>0){w.wait=Math.max(0,w.wait-dt);return;}
      const stop=this.stopDistance(w,sn*w.dir,cs*w.dir);
      const step=Math.min(dt*1.43,stop);
      if(step<.0001)return;
      w.s=clamp(w.s+step*w.dir,-25,26);Object.assign(w,at(w.s,w.u));w.moving=true;w.phase+=step*3.9;
      if(w.s<=-25||w.s>=26){w.dir*=-1;w.yaw=heading+(w.dir<0?Math.PI:0);w.wait=w.s<0?10:7;w.moving=false;}
    }
    warn(manual){
      this.owned=manual;this.delay=0;this.gateReady=false;this.sternClear=false;this.reopen=false;
      this.waterFor=this.privateCall>0?13:5;this.direction=this.packet.direction<0?"in":"out";this.setPhase("warning");
    }
    action(){
      if(!this.onWatch)return false;
      if(this.phase==="road"&&this.demand){this.warn(true);return true;}
      if(this.phase==="release"&&this.owned&&!this.reopen){this.reopen=true;return true;}
      return false;
    }
    step(dt,env){
      this.age+=dt;this.walk(dt);
      const aside=this.onWatch&&(this.owned||this.phase==="road")||this.relief>.1&&env.atDesk?.();
      const previous=this.relief;this.relief=clamp(this.relief+(aside?dt:-dt)*1.12,0,1);
      if(this.relief!==previous){
        const f=this.relief*this.relief*(3-2*this.relief);
        Object.assign(this.tender,at(-16-.30*f,7.3+1.36*f));this.tender.yaw=heading-.55*f;
      }
      this.packet.step(dt,this.phase==="water",env);
      if(this.privateCall>0)this.privateCall=Math.max(0,this.privateCall-dt);
      const manual=this.owned&&this.onWatch,lever=manual&&env.lever();
      if(this.phase==="road"){
        if(!this.onWatch&&this.demand)this.warn(false);
        return;
      }
      if(this.phase==="warning"){
        this.roadUser=env.roadUser();
        if(this.age<1.8||this.roadUser)return;
        this.gates=Math.min(1,this.gates+dt/2.4);this.gateReady=this.gates===1;
        if(this.gateReady){
          if(!manual||lever)this.setPhase("raising");else this.delay+=dt;
        }
      }else if(this.phase==="raising"){
        if(!manual||lever)this.lift=Math.min(1,this.lift+dt/4.5);else this.delay+=dt;
        if(this.lift===1){this.privateCall=0;this.neutral=!manual;this.setPhase("water");}
      }else if(this.phase==="water"){
        if(!(env.holding?.()??lever))this.neutral=true;
        this.waterUser=env.waterUser();
        this.sternClear=!this.waterUser&&!this.packet.inbound&&this.age>this.waterFor;
        if(this.sternClear){
          if(!manual||this.neutral&&lever)this.setPhase("lowering");else this.delay+=dt;
        }
      }else if(this.phase==="lowering"){
        if(!manual||lever)this.lift=Math.max(0,this.lift-dt/4.5);else this.delay+=dt;
        if(this.lift===0)this.setPhase("release");
      }else if(this.phase==="release"){
        if(!manual||this.reopen)this.gates=Math.max(0,this.gates-dt/1.85);else this.delay+=dt;
        if(this.gates===0){
          const credit=manual,delay=Number(Math.min(86400,this.delay).toFixed(1));
          this.owned=false;this.setPhase("road");
          if(credit){this.onWatch=false;env.finish({direction:this.direction,delay,pay:95+Math.max(0,30-Math.round(delay*1.7))});}
        }
      }
    }
    instruction(){
      if(this.phase==="road")return this.demand?"June Bug is calling. Ring the warning bell.":"Watch for June Bug’s call at the channel marks.";
      if(!this.owned&&this.onWatch)return "Inez has this opening. You have the next passage.";
      if(this.phase==="warning")return this.roadUser?"Wait for "+this.roadUser+" to clear the gates.":this.gateReady?"Both approaches clear. Hold the lever to raise the span.":"Red on both roads. Wait for the gates to come down.";
      if(this.phase==="raising")return "Hold the lever until both leaves are fully raised.";
      if(this.phase==="water")return this.sternClear?this.neutral?"Channel clear. Hold the lever to lower the span.":"Let go of the lever, then hold to lower.":this.waterUser?"Wait for "+this.waterUser+" to clear the far fender.":"Watch the stern pass the far fender.";
      if(this.phase==="lowering")return "Hold the lever until the road seats.";
      return this.reopen?"The gates are rising.":"Road seated. Release the gates.";
    }
  }
  window.BayDrawbridge={center,site,mouth,iceDock,iceCounter,iceBerth,iceStep,ladder,landingLevel,scow,at,local,nearby,channel,heading,read,Crossing};
})();
