/* Sol Beach Lifeguards' practice course. Gates face the runner's direction of travel. */
(() => {
  "use strict";
  const gates=[
    {x:162.3,z:-27, yaw:0,     type:"start", name:"Chalk line"},
    {x:162.4,z:-10, yaw:0,     type:"rail",  name:"Boardwalk hurdle"},
    {x:163.4,z:16,  yaw:.04,   type:"flag",  name:"Surf shack"},
    {x:180,  z:22,  yaw:1.24,  type:"flag",  name:"Sand flags"},
    {x:190,  z:4,   yaw:2.63,  type:"rail",  name:"Beach hurdle"},
    {x:190,  z:-22, yaw:Math.PI,type:"finish",name:"Lifeguard tower"}
  ];
  const halfWidth=2.45, barHeight=.49, traceLimit=1802;
  for(const g of gates){g.nx=Math.sin(g.yaw);g.nz=Math.cos(g.yaw);}
  function crossing(g,x,z,p){
    const from=(x-g.x)*g.nx+(z-g.z)*g.nz,to=(p.x-g.x)*g.nx+(p.z-g.z)*g.nz;
    if(from>0||to<=0)return null;
    const f=-from/(to-from), across=(x+(p.x-x)*f-g.x)*g.nz-(z+(p.z-z)*f-g.z)*g.nx;
    return Math.abs(across)<=halfWidth+.12?f:null;
  }
  function readRecord(value){
    const splits=value?.splits;
    if(!Array.isArray(splits)||splits.length!==gates.length-1||
       !splits.every((v,i)=>Number.isFinite(v)&&v>(i?splits[i-1]:0)&&Number.isSafeInteger(Math.round(v*100))))return null;
    const trace=value.trace;
    const valid=Array.isArray(trace)&&trace.length>=2&&trace.length<=traceLimit&&trace.every((s,i)=>
      Array.isArray(s)&&s.length===12&&s.every(Number.isInteger)&&
      (i?s[0]>trace[i-1][0]:s[0]===0)&&Number.isSafeInteger(s[0])&&
      Math.abs(s[1])<=21100&&Math.abs(s[2])<=18300&&s[3]>=0&&s[3]<=105&&Math.abs(s[4])<=315&&
      s.slice(5,11).every(n=>n>=0&&n<=255)&&Math.abs(s[11])===1)&&
      Math.abs(trace.at(-1)[0]/100-splits.at(-1))<.02;
    return {splits,trace:valid?trace:null};
  }
  function poseSample(t,x,z,yaw,m){
    const byte=v=>Math.round(v*255);
    return [Math.round(t*100),Math.round(x*100),Math.round(z*100),Math.round(m.lift*100),
      Math.round(Math.atan2(Math.sin(yaw),Math.cos(yaw))*100),byte(m.phase),byte(m.weight),byte(m.run),
      byte(m.airPose),byte(m.crouch),byte(m.stumblePose),m.lead];
  }
  class Run {
    constructor(p){
      this.index=0;this.clock=0;this.clean=0;this.splits=[];this.trace=[];this.clips=new Map();
      this.x=p.x;this.z=p.z;this.lift=0;this.samplePeriod=.1;this.nextSample=.1;this.lastSplit=null;
    }
    step(dt,p,m){
      const i=this.index,g=gates[i],x=this.x,z=this.z,lift=this.lift;
      this.x=p.x;this.z=p.z;this.lift=m.lift;
      if(!g)return null;
      const f=crossing(g,x,z,p);
      if(i===0){
        if(f===null)return null;
        this.record(0,x+(p.x-x)*f,z+(p.z-z)*f,p.yaw,m);
        this.clock=(1-f)*dt;this.index=1;return {type:"start"};
      }
      const gateTime=this.clock+(f===null?1:f)*dt;
      this.clock+=dt;
      if(this.clock>=this.nextSample&&!(f!==null&&i===gates.length-1)){
        if(this.trace.length>=traceLimit-1){
          this.trace=this.trace.filter((_,n)=>n%2===0);this.samplePeriod*=2;
        }
        this.record(this.clock,p.x,p.z,p.yaw,m);this.nextSample+=this.samplePeriod;
      }
      if(f===null)return null;
      this.splits.push(gateTime);
      let label=g.name;
      if(g.type==="rail"){
        if(lift+(m.lift-lift)*f>=barHeight-.07){this.clean++;label="Clean hurdle";}
        else {this.clips.set(i,gateTime);m.clipRail();label="Clipped the hurdle";}
      }
      this.lastSplit={label,time:gateTime,index:i-1};this.index++;
      if(i===gates.length-1){
        this.clock=gateTime;
        this.record(gateTime,x+(p.x-x)*f,z+(p.z-z)*f,p.yaw,m);
        return {type:"finish"};
      }
      return {type:"gate"};
    }
    record(time,x,z,yaw,m){
      const s=poseSample(time,x,z,yaw,m),last=this.trace.at(-1);
      if(last&&s[0]===last[0])this.trace[this.trace.length-1]=s;
      else this.trace.push(s);
    }
  }
  // Interpolate the recorded pose. The playback cursor only moves forward during a run.
  class Ghost {
    constructor(trace){
      this.trace=trace;this.cursor=0;this.motion=new BayPlayerMotion();
    }
    update(t){
      const q=t*100,track=this.trace;
      if(q>track.at(-1)[0])return false;
      while(this.cursor<track.length-2&&q>track[this.cursor+1][0])this.cursor++;
      const a=track[this.cursor],b=track[this.cursor+1],f=Math.min(1,Math.max(0,(q-a[0])/(b[0]-a[0])));
      const mix=i=>a[i]+(b[i]-a[i])*f;
      this.x=mix(1)/100;this.z=mix(2)/100;
      const dy=(b[4]-a[4])/100;this.yaw=a[4]/100+Math.atan2(Math.sin(dy),Math.cos(dy))*f;
      const m=this.motion;m.time=t;m.lift=mix(3)/100;
      let step=(b[5]-a[5])/255;if(step<-.5)step+=1;
      m.phase=(a[5]/255+step*f+1)%1;m.weight=mix(6)/255;m.run=mix(7)/255;
      m.airPose=mix(8)/255;m.crouch=mix(9)/255;m.stumblePose=mix(10)/255;m.lead=f<.5?a[11]:b[11];
      m.poseFeet();return true;
    }
  }
  function install(model){
    const salt="#fff0ce",orange="#eb6850",blue="#327f83",dark="#315255",wood="#bd9671";
    const base=(g,x)=>{g.box(x,.075,0,.50,.15,.60,dark);g.box(x,.16,0,.31,.12,.37,wood);};
    const pole=(g,x,h)=>{base(g,x);g.cyl(x,h*.5+.15,0,.055,.063,h,6,salt);};
    function flag(g,x,side,color){
      pole(g,x,2.1);
      const a=[x,2.22,0],b=[x+side*.71,2.08,-.06],c=[x+side*.65,1.59,-.11],d=[x,1.68,0];
      g.quad(a,b,c,d,color);g.quad([x,1.87,-.012],[x+side*.68,2.02,-.093],
        [x+side*.67,1.89,-.10],[x,1.74,-.012],salt);
    }
    for(const type of ["start","flag","rail","finish"])model("dash-"+type,g=>{
      const end=type==="finish",line=end||type==="start",h=end?2.75:2.2;
      for(const side of [-1,1]){
        const x=side*halfWidth;
        if(line)pole(g,x,h);else flag(g,x,side,type==="rail"?orange:blue);
        if(type==="rail"){
          g.box(x,.27,0,.12,.46,.13,dark);g.box(x,.10,0,.23,.12,.64,wood);
        }
      }
      if(line){
        for(let i=0;i<12;i++)for(let j=0;j<2;j++){
          const x=-halfWidth+(i+.5)*(halfWidth/6),c=(i+j)%2?(end?dark:blue):salt;
          g.box(x,.032,(j-.5)*.20,halfWidth/6,.020,.20,c);
          if(end)g.box(x,2.77-(j+.5)*.18,0,halfWidth/6,.18,.035,c);
        }
        if(!end)for(const s of [-1,1]){
          const x=s*halfWidth;g.quad([x,2.31,0],[x+s*.81,2.09,-.07],[x+s*.73,1.60,-.13],[x,1.80,0],orange);
          g.tri([x,2.21,-.018],[x+s*.44,2.01,-.084],[x,1.93,-.018],salt);
        }
      }
    });
    model("dash-bar",g=>{
      for(let i=0;i<9;i++)g.box(-halfWidth+(i+.5)*(2*halfWidth/9),0,0,2*halfWidth/9,.102,.12,i%2?orange:salt);
    });
    model("dash-guide",g=>{
      for(const z of [-1.55,-.87])for(const side of [-1,1])
        g.quad([0,.043,z+.29],[side*.55,.043,z-.02],[side*.55,.043,z-.18],[0,.043,z+.11],"#f7c276");
    });
  }
  window.BayBeachDash={gates,halfWidth,barHeight,Run,Ghost,install,readRecord};
})();
