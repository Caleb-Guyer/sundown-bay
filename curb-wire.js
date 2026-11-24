/* Bay Wire keeps the motion a sidewalk witness could actually see. */
(() => {
  "use strict";
  const key="sundownBay.curbWire.v1",interval=.125;
  const desk={x:155.35,z:-17.1,y:.076,yaw:-Math.PI/2,name:"Bay Wire · Curb desk"};
  desk.stand=BayDriving.world(desk,0,1.1);desk.block={x:desk.x,z:desk.z,w:.84,d:1.43,bottom:0,top:1.45,streetProp:true};
  const assignments=["pass","slide","hop"];
  const titles={pass:"Street pass",slide:"Sliding corner",hop:"Off the springs",chase:"Sirens in frame",impact:"Fender bender"};
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n)),round=n=>Math.round(n*100)/100;
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const cleanName=s=>typeof s==="string"&&s.length>0&&s.length<=70;
  const placeOK=(x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<=500&&Math.abs(z)<=480;
  function valid(c){
    if(!c||!Number.isSafeInteger(c.id)||c.id<1||!Object.hasOwn(titles,c.type)||!cleanName(c.by)||!cleanName(c.street)||
      !Number.isInteger(c.score)||c.score<1||c.score>100||!Number.isInteger(c.day)||c.day<1||!Number.isFinite(c.minute)||c.minute<0||c.minute>=1440||
      ![c.rain,c.night].every(n=>Number.isFinite(n)&&n>=0&&n<=1)||!c.eye||!placeOK(c.eye.x,c.eye.z)||!Number.isFinite(c.eye.y)||Math.abs(c.eye.y)>60||
      !Array.isArray(c.cast)||c.cast.length<1||c.cast.length>4||!c.cast.every(v=>v&&Object.hasOwn(BayDriving.cars,v.kind)&&/^#[a-f\d]{6}$/i.test(v.color))||
      !Array.isArray(c.frames)||c.frames.length<7||c.frames.length>48)return false;
    let last=-1;
    for(const f of c.frames){
      if(!Array.isArray(f)||f.length<2||f.length>1+c.cast.length||!f[1]||!Number.isFinite(f[0])||f[0]<=last||f[0]>8)return false;
      last=f[0];for(const p of f.slice(1))if(p!==null&&(!Array.isArray(p)||p.length!==6||!p.every(Number.isFinite)||!placeOK(p[0],p[2])||Math.abs(p[1])>60))return false;
    }
    return c.frames[0][0]===0;
  }
  class Book{
    constructor(){this.clips=[];this.pin=0;this.met=false;this.cover=null;this.list=false;this.edits={};this.refresh();}
    refresh(){
      let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch{}if(!raw)return;
      if(raw.met===true)this.met=true;if(raw.list===true)this.list=true;
      for(const id of assignments){const c=raw.edits?.[id];if(c?.called&&c.type===id&&valid(c)&&(!this.edits[id]||this.edits[id].score<=c.score))this.edits[id]=c;}
      const clips=new Map(this.clips.map(c=>[c.id,c]));
      if(Array.isArray(raw.clips))for(const c of raw.clips.slice(0,6))if(valid(c))clips.set(c.id,c);
      this.clips=[...clips.values()].sort((a,b)=>b.id-a.id).slice(0,6);
      if(valid(raw.cover)){this.cover=raw.cover;this.pin=raw.cover.id;}
    }
    save(){try{localStorage.setItem(key,JSON.stringify({met:this.met,list:this.list,edits:this.edits,clips:this.clips,cover:this.cover}));}catch{}}
    meet(){this.refresh();if(!this.met){this.met=true;this.save();}}
    takeList(){this.refresh();this.met=true;this.list=true;this.save();}
    get complete(){return assignments.every(id=>this.edits[id]);}
    keep(c){
      this.refresh();c.id=Math.max(Date.now(),(this.clips[0]?.id||0)+1);if(!valid(c))return false;
      if(this.list&&c.called&&assignments.includes(c.type)&&(!this.edits[c.type]||c.score>this.edits[c.type].score))this.edits[c.type]=c;
      this.clips=[c,...this.clips].slice(0,6);if(!this.cover){this.cover=c;this.pin=c.id;}this.save();return true;
    }
    mount(c){this.refresh();if(!valid(c))return;this.cover=c;this.pin=c.id;this.save();}
  }
  function body(v,ground){
    const h=v.hydraulic;
    return [round(v.x),round(ground(v.x,v.z)+.012+(h?.bodyLift||0)),round(v.z),round(v.yaw),round((v.pitch||0)+(h?.pitch||0)),round((v.lean||0)+(h?.roll||0))];
  }
  const castMember=v=>({kind:v.kind,color:/^#[a-f\d]{6}$/i.test(v.color)?v.color:v.kind==="cruiser"?"#e1e1ce":"#898e85"});
  function track(clip,time){
    const frames=clip.frames;
    let right=frames.findIndex(f=>f[0]>=time);if(right<0)right=frames.length-1;
    const a=frames[Math.max(0,right-1)],b=frames[right],p=clamp((time-a[0])/(b[0]-a[0]||1),0,1),cars=[];
    for(let i=0;i<clip.cast.length;i++){
      const x=a[i+1],y=b[i+1];if(!x&&!y||!x&&p<.5||!y&&p>=.5)continue;
      const l=x||y,r=y||x,at=k=>l[k]+(r[k]-l[k])*p,turn=r[3]-l[3];
      cars.push({...clip.cast[i],x:at(0),y:at(1),z:at(2),yaw:l[3]+Math.atan2(Math.sin(turn),Math.cos(turn))*p,pitch:at(4),lean:at(5)});
    }
    const car=cars[0],d=gap(car,clip.eye);
    return {cars,eye:{...clip.eye,yaw:Math.atan2(car.x-clip.eye.x,car.z-clip.eye.z),
      pitch:Math.atan2(car.y+.83-clip.eye.y,d),focal:clamp(1.07+d*.075,1.4,3.2)}};
  }
  function paint(canvas,clip,time,scenery){
    const duration=clip.frames.at(-1)[0],t=clamp(time,0,duration),frame=track(clip,t);
    scenery.paint(canvas,frame.eye,{id:"curb-"+clip.id},t,{curb:true,hours:{rain:clip.rain,night:clip.night},cars:frame.cars},true);
  }
  class Column{
    constructor(){this.book=new Book();this.shot=null;this.scan=0;this.cool=0;this.author=null;}
    cancel(){if(this.shot)this.shot.w.curbAim=null;this.shot=null;}
    begin(v,w,env,called){
      const eye={x:round(w.x),y:round(env.floor(w.x,w.z)+1.54),z:round(w.z)};
      this.shot={v,w,called,eye,age:0,rolling:0,sample:0,frames:[],moving:false,extra:[],path:0,
        near:Infinity,far:0,after:0,maxSpeed:0,slide:0,hop:0,police:0,impact:0,prev:null,by:w.curbName||w.name,
        minute:Math.floor(env.hours.minute),day:env.hours.day+1,night:env.hours.night,rain:env.hours.rain,street:env.street(v)};
      w.curbAim={x:v.x,z:v.z,lift:0};this.author=w;
    }
    choose(v,env,called){
      let who=null,best=called?29:37;
      for(const w of env.people){
        if(!(w.curbName||w.name)||w.onTour||w.startle||w.palmManaged||w.sprayPose||w.palmPassenger||w.fieldSource||!env.free(w))continue;
        const d=gap(w,v);if(d<4||d>=best)continue;
        const arrival=(w.x-v.x)*v.vx+(w.z-v.z)*v.vz;
        if(!called&&arrival<0&&!v.hydraulic?.bodyLift)continue;
        if(!env.sees(w,v))continue;best=d;who=w;
      }return who;
    }
    hail(v,env){
      if(!v)return null;
      if(this.shot&&this.shot.v===v&&!this.shot.moving){this.shot.called=true;return this.shot.w;}
      if(this.shot)return null;
      const w=this.choose(v,env,true);if(!w)return null;
      this.begin(v,w,env,true);return w;
    }
    bump(v,force){if(this.shot?.v===v)this.shot.impact=Math.max(this.shot.impact,force);}
    step(dt,v,env){
      this.scan-=dt;this.cool=Math.max(0,this.cool-dt);
      if(this.shot&&v!==this.shot.v)return this.finish();
      if(!v)return;
      const speed=Math.hypot(v.vx,v.vz);
      if(!this.shot){
        if(this.cool>0||this.scan>0||speed<9&&!(v.hydraulic?.bodyLift>.10))return;
        this.scan=.24;const w=this.choose(v,env,false);if(!w)return;this.begin(v,w,env,false);
      }
      const s=this.shot,w=s.w;s.age+=dt;s.sample-=dt;
      if(w.startle||w.sprayPose||w.palmPassenger||w.onTour)return this.finish();
      w.curbAim.x=v.x;w.curbAim.z=v.z;w.curbAim.lift=Math.min(1,s.age*3.5);
      if(s.sample>0)return;
      s.sample+=interval;
      const d=gap(w,v);if(d>47||d<2.3||!env.sees(w,v))return this.finish();
      if(!s.moving&&speed<3&&!(v.hydraulic?.bodyLift>.06)){
        if(s.age>9)this.cancel();return;
      }
      if(s.age<.23)return;
      if(!s.moving){s.moving=true;s.start=s.age;}
      s.rolling=s.age-s.start;
      if(s.prev)s.path+=gap(v,s.prev);s.prev={x:v.x,z:v.z};
      s.far=Math.max(s.far,d);s.near=Math.min(s.near,d);s.after=Math.max(s.after,d-s.near);
      s.maxSpeed=Math.max(s.maxSpeed,speed);
      const sideways=Math.abs(v.vx*Math.cos(v.yaw)-v.vz*Math.sin(v.yaw));
      if(speed>5&&v.slip>.32&&Math.abs(v.yawRate)>.2&&sideways>1.0)s.slide+=interval;
      if(v.hydraulic&&v.hydraulic.contacts!==15)s.hop=Math.max(s.hop,v.hydraulic.bodyLift||0);
      for(const q of env.nearby(v))if(q!==v&&s.extra.length<3&&!s.extra.includes(q)&&Object.hasOwn(BayDriving.cars,q.kind)&&gap(q,w)<40)s.extra.push(q);
      const frame=[round(s.rolling),body(v,env.floor)];
      for(const q of s.extra){
        const nearby=gap(q,w)<52&&env.present(q);
        const visible=nearby&&env.sees(w,q);frame.push(visible?body(q,env.floor):null);
        if(visible&&q.kind==="cruiser"&&env.wanted&&gap(q,v)<28)s.police+=interval;
      }
      s.frames.push(frame);
      if(s.rolling>=4.4||s.after>12&&s.rolling>1.35)return this.finish();
    }
    finish(){
      const s=this.shot;if(!s)return;this.cancel();
      const type=s.impact>=4?"impact":s.hop>.21?"hop":s.slide>=.36?"slide":s.police>=.32?"chase":"pass";
      if(s.frames.length<7||s.near>33||type!=="hop"&&s.path<7||
        type==="pass"&&(s.maxSpeed<(s.called?10.5:15)||s.path<10||s.after<1.5)){this.cool=1.1;return;}
      const action=type==="slide"?s.slide*12:type==="hop"?s.hop*28:type==="chase"?s.police*9:type==="impact"?s.impact:s.maxSpeed*.75;
      const score=Math.round(clamp(38+Math.min(27,action)+Math.min(18,s.rolling*6)+Math.max(0,17-Math.abs(s.near-9)*.95),1,100));
      const clip={id:1,type,by:s.by,street:s.street,called:s.called===true,score,day:s.day,minute:s.minute,
        rain:round(s.rain),night:round(s.night),eye:s.eye,cast:[s.v,...s.extra].map(castMember),frames:s.frames};
      this.cool=12;if(this.book.keep(clip))return clip;
    }
  }
  window.BayCurbWire={Column,Book,key,desk,titles,assignments,track,paint,valid};
})();
