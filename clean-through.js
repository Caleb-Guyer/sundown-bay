/* Romy's overhead contact sheet is made from the cars that actually passed each other. */
(() => {
  "use strict";
  const key="sundownBay.cleanThrough.v1",tick=.1,hold=5,round=n=>Math.round(n*100)/100;
  const paint=/^#[a-f0-9]{6}$/i;
  const jpeg=s=>typeof s==="string"&&s.length<=96000&&/^data:image\/jpeg;base64,\/9j\/[a-zA-Z0-9+/]+={0,2}$/.test(s);
  function read(){
    let c;try{c=JSON.parse(localStorage.getItem(key));}catch{}
    if(!c||!Number.isSafeInteger(c.score)||c.score<1||!Number.isSafeInteger(c.passes)||c.passes<1||
        !Number.isSafeInteger(c.gaps)||c.gaps<0||typeof c.street!=="string"||typeof c.model!=="string"||
        !Array.isArray(c.frames)||c.frames.length<2||c.frames.length>36)return null;
    if(!c.frames.every(f=>Array.isArray(f)&&f.length&&f.length<=5&&f.every(a=>Array.isArray(a)&&a.length===7&&
        a.slice(0,6).every(Number.isFinite)&&a[4]>0&&a[4]<8&&a[5]>0&&a[5]<3&&paint.test(a[6]))))return null;
    if(!jpeg(c.cover))delete c.cover;
    return c;
  }
  function pose(v,id){
    const shape=v.footprint||bayCarLayout(v.kind);
    return [id,round(v.x),round(v.z),round(v.yaw),round(shape.halfLength),round(shape.track),paint.test(v.color)?v.color:"#879995"];
  }
  class Reel{
    constructor(buildings=[]){this.buildings=buildings;this.best=read();this.reset();}
    reset(){
      this.vehicle=null;this.run=null;this.near=new Map();this.lead=[];this.sampleIn=0;this.time=0;
    }
    pass(v,other,side,clearance,oncoming){
      const r=this.run??={score:0,passes:0,gaps:0,seen:new Set(),last:null,quality:-1,frames:[]};
      if(r.seen.has(other))return;
      r.seen.add(other);r.passes++;
      const last=r.last,paired=last&&!last.paired&&side!==last.side&&this.time-last.at<.85&&Math.hypot(v.x-last.x,v.z-last.z)<10;
      const points=100+(oncoming?40:0)+Math.round((1.8-clearance)*50);
      r.score+=points+(paired?250:0);if(paired)r.gaps++;
      r.last={side,x:v.x,z:v.z,at:this.time,paired};r.left=hold;
      const quality=points+(paired?250:0);
      if(quality>r.quality){
        r.quality=quality;r.frames=this.lead.slice(-22);r.after=10;r.spot={x:v.x,z:v.z,yaw:v.yaw};
        r.cover=null;r.exposeBy=this.time+.20;
      }
    }
    expose(source,sky){
      const r=this.run;if(!r||!(this.time<=r.exposeBy))return;
      r.exposeBy=-1;r.cover=BayMeetPhoto.capture(source,sky,.5,.5,16/9,true);
    }
    update(v,dt,cars,hit){
      if(!v&&!this.vehicle)return "";
      if(hit&&v===this.vehicle&&!this.run&&!this.near.size&&!this.lead.length)return "";
      if(v!==this.vehicle||hit){
        const lost=this.run;this.reset();this.vehicle=v;if(hit||!v)return lost?"lost":"";
      }
      this.time+=dt;const r=this.run;
      if(r)r.left-=dt;
      this.sampleIn-=dt;if(this.sampleIn>0)return "";
      this.sampleIn+=tick;
      if(!r&&v.speed<9&&!this.near.size){this.lead.length=0;return "";}
      const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw),shape=v.footprint||bayCarLayout(v.kind);
      const frame=[],forward=v.vx*sn+v.vz*cs;
      for(const o of cars){
        if(o===v||!o.path||o.serviceCar||o.meetCar||Math.abs(o.speed)<1.25)continue;
        const dx=o.x-v.x,dz=o.z-v.z;
        if(Math.abs(dx)>34||Math.abs(dz)>34)continue;
        const along=dx*sn+dz*cs,across=dx*cs-dz*sn;
        if(Math.abs(across)>8||Math.abs(along)>32)continue;
        frame.push(o);
        const old=this.near.get(o),align=Math.cos(o.yaw-v.yaw);
        // Only count a front-to-back pass. Cross traffic and parked cars are outside the take.
        if(forward<9||Math.abs(align)<.75){this.near.delete(o);continue;}
        const p=old||{armed:false};
        if(along>3)p.armed=true;
        if(p.armed&&p.z>0&&along<=0){
          const f=p.z/(p.z-along),side=p.x+(across-p.x)*f,size=o.footprint||bayCarLayout(o.kind);
          const gap=Math.abs(side)-shape.track-size.track*Math.abs(align)-size.halfLength*Math.abs(Math.sin(o.yaw-v.yaw));
          p.pass=gap>=-.05&&gap<=1.8?{side:Math.sign(side),gap:Math.max(0,gap),opposing:align<0}:null;
        }
        if(p.pass&&along<-(shape.halfLength+(o.footprint||bayCarLayout(o.kind)).halfLength)){
          this.pass(v,o,p.pass.side,p.pass.gap,p.pass.opposing);p.pass=null;p.armed=false;
        }
        p.x=across;p.z=along;p.t=this.time;if(!old)this.near.set(o,p);
      }
      for(const [o,p] of this.near)if(this.time-p.t>.15)this.near.delete(o);
      if(frame.length||this.lead.length||this.run){
        if(frame.length>4){
          const d=o=>(o.x-v.x)**2+(o.z-v.z)**2;frame.sort((a,b)=>d(a)-d(b));frame.length=4;
        }
        for(let i=0;i<frame.length;i++)frame[i]=pose(frame[i],frame[i].id);
        frame.unshift(pose(v,-1));this.lead.push(frame);if(this.lead.length>22)this.lead.shift();
        if(this.run?.after>0){this.run.frames.push(frame);this.run.after--;}
        if(!this.run&&!this.near.size&&this.lead.every(f=>f.length===1))this.lead.length=0;
      }
      if(!this.run||this.run.left>0)return "";
      const run=this.run;this.run=null;
      const card={score:run.score,passes:run.passes,gaps:run.gaps,model:BayDriving.cars[v.kind]?.name||"Street car",
        street:BayStreetNames.through(run.spot,run.spot.yaw)||"Sundown Bay",frames:run.frames};
      this.last=card;this.best=read()||this.best;
      if(card.frames.length>1&&(!this.best||card.score>this.best.score)){
        this.best=card;if(run.cover)card.cover=run.cover;
        try{localStorage.setItem(key,JSON.stringify(card));}catch{
          delete card.cover;try{localStorage.setItem(key,JSON.stringify(card));}catch{}
        }
        return "best";
      }
      return "bank";
    }
    print(time,near){
      const c=this.best;if(!c)return null;
      const pos=near?Math.floor(time*6)%(c.frames.length+8):Math.floor(c.frames.length*.55);
      const i=Math.min(pos,c.frames.length-1),p=this.printed??={canvas:document.createElement("canvas"),rev:0};
      if(p.card!==c||p.i!==i){
        if(p.canvas.width!==600){p.canvas.width=600;p.canvas.height=260;}
        draw(p.canvas,c,i/(c.frames.length-1),this.buildings);p.card=c;p.i=i;p.rev++;
      }
      return p;
    }
  }
  function draw(canvas,card,at,buildings=[]){
    const c=canvas.getContext("2d");if(!c)return;
    const w=canvas.width,h=canvas.height,f=at*(card.frames.length-1),i=Math.floor(f),u=f-i;
    const a=card.frames[i],b=card.frames[Math.min(i+1,card.frames.length-1)];
    const center=card.frames[Math.floor(card.frames.length*.52)][0],driver=a[0],next=b[0];
    const cx=center[1]*.18+(driver[1]+(next[1]-driver[1])*u)*.82,cz=center[2]*.18+(driver[2]+(next[2]-driver[2])*u)*.82;
    c.fillStyle="#253833";c.fillRect(0,0,w,h);
    const scale=9,x=n=>w*.5+(n-cx)*scale,y=n=>h*.50-(n-cz)*scale;
    c.save();c.beginPath();c.rect(9,9,w-18,h-18);c.clip();
    c.fillStyle=cz>223?"#819489":"#b7b19b";c.fillRect(0,0,w,h);
    if(cx>100){
      c.fillStyle="#658d91";c.beginPath();c.moveTo(w,0);
      for(let py=0;py<=h+12;py+=12){const z=cz+(h*.5-py)/scale;c.lineTo(x(z>180?BayCut.coast(z):213),py);}
      c.lineTo(w,h);c.closePath();c.fill();
    }
    for(const roof of buildings){
      if(Math.abs(roof.x-cx)>w/(2*scale)+roof.hw||Math.abs(roof.z-cz)>h/(2*scale)+roof.hd)continue;
      const l=x(roof.x-roof.hw),t=y(roof.z+roof.hd),rw=2*roof.hw*scale,rh=2*roof.hd*scale;
      c.fillStyle="#868879";c.fillRect(l+3,t+4,rw,rh);c.fillStyle="#c9bc9f";c.fillRect(l,t,rw,rh);
      c.strokeStyle="#9b9983";c.strokeRect(l+2,t+2,rw-4,rh-4);
    }
    for(let g=-144;g<=144;g+=72){
      c.fillStyle="#c6c1ab";c.fillRect(x(g-8),y(228),16*scale,456*scale);c.fillRect(x(-226),y(g+8),378*scale,16*scale);
    }
    for(let g=-144;g<=144;g+=72){
      c.fillStyle="#535957";c.fillRect(x(g-7),y(228),14*scale,456*scale);c.fillRect(x(-226),y(g+7),378*scale,14*scale);
    }
    c.strokeStyle="#ccbb84";c.lineWidth=1.25;c.setLineDash([12,10]);c.beginPath();
    for(let g=-144;g<=144;g+=72){c.moveTo(x(g),y(194));c.lineTo(x(g),y(-193));c.moveTo(x(-193),y(g));c.lineTo(x(145),y(g));}c.stroke();c.setLineDash([]);
    if(cz+h/(2*scale)>155&&cx+w/(2*scale)>80){
      c.lineJoin="round";c.lineCap="round";
      for(const r of BayCut.routes){
        c.beginPath();r.points.forEach((p,j)=>j?c.lineTo(x(p.x),y(p.z)):c.moveTo(x(p.x),y(p.z)));
        c.lineWidth=2*r.halfWidth*scale;c.strokeStyle=r.id==="shell"?"#9c9279":"#535957";c.stroke();
        if(r.id!=="shell"){c.setLineDash([12,10]);c.lineWidth=1.25;c.strokeStyle="#ccbb84";c.stroke();c.setLineDash([]);}
      }
    }
    c.strokeStyle="#efd38b";c.lineWidth=2;c.beginPath();
    for(let n=Math.max(0,i-6);n<=i;n++){const p=card.frames[n][0];if(n===Math.max(0,i-6))c.moveTo(x(p[1]),y(p[2]));else c.lineTo(x(p[1]),y(p[2]));}c.stroke();
    for(const p of a){
      const q=b.find(k=>k[0]===p[0])||p;
      const angle=p[3]+Math.atan2(Math.sin(q[3]-p[3]),Math.cos(q[3]-p[3]))*u;
      c.save();c.translate(x(p[1]+(q[1]-p[1])*u),y(p[2]+(q[2]-p[2])*u));c.rotate(angle);
      const hw=p[5]*scale,hl=p[4]*scale;
      c.fillStyle="#38413b";c.fillRect(-hw+1,-hl+2,2*hw,2*hl);
      c.fillStyle=p[6];c.strokeStyle=p[0]===-1?"#ffe0a0":"#34403e";c.lineWidth=p[0]===-1?2:1;
      c.beginPath();c.roundRect(-hw,-hl,2*hw,2*hl,2);c.fill();c.stroke();
      c.fillStyle="#354a4a";c.fillRect(-hw*.79,-hl*.44,hw*1.58,hl*.42);c.fillRect(-hw*.73,hl*.36,hw*1.46,hl*.23);
      c.fillStyle="#eecf86";c.fillRect(-hw*.82,-hl,hw*.45,2);c.fillRect(hw*.37,-hl,hw*.45,2);c.restore();
    }
    c.restore();c.fillStyle="#263b34";c.fillRect(9,h-37,w-18,28);c.fillStyle="#f4dfb3";c.font="bold 15px monospace";
    c.textAlign="left";c.fillText(card.street.toUpperCase(),21,h-18);c.textAlign="right";c.fillText((f/10).toFixed(1)+" s",w-21,h-18);
  }
  const editionKey="sundownBay.latePlate.v1";
  const goodPrint=p=>p&&jpeg(p.cover)&&typeof p.street==="string"&&p.street.length<=80&&
    typeof p.model==="string"&&p.model.length<=80&&Number.isSafeInteger(p.score)&&p.score>0;
  class PictureDesk{
    constructor(){
      this.packet=this.issue=null;this.images=new WeakMap();this.refresh();
    }
    refresh(){
      let data;try{data=JSON.parse(localStorage.getItem(editionKey));}catch{return;}
      this.packet=goodPrint(data?.packet)?data.packet:null;
      this.issue=goodPrint(data?.issue)&&["street","driver"].includes(data.issue.crop)?data.issue:null;
    }
    store(packet,issue){
      try{localStorage.setItem(editionKey,JSON.stringify({packet,issue}));}catch{return false;}
      this.packet=packet;this.issue=issue;return true;
    }
    collect(card){
      this.refresh();
      if(this.packet||!goodPrint(card)||this.issue?.cover===card.cover)return false;
      const {cover,street,model,score}=card;
      return this.store({cover,street,model,score},this.issue);
    }
    publish(crop,cover){
      this.refresh();
      if(!this.packet||this.packet.cover!==cover||!["street","driver"].includes(crop))return false;
      return this.store(null,{...this.packet,crop});
    }
    page(canvas,p,crop,ready){
      let image=this.images.get(p);
      if(!image){image=new Image();this.images.set(p,image);image.src=p.cover;}
      if(!image.complete||!image.naturalWidth){
        if(ready&&!image.complete)image.addEventListener("load",ready,{once:true});
        return false;
      }
      const c=canvas.getContext("2d"),w=600,h=384,tight=crop==="driver";
      const sw=image.naturalWidth*(tight?.57:1),sh=sw*201/560;
      c.save();c.scale(canvas.width/w,canvas.height/h);
      c.fillStyle="#f0e5c7";c.fillRect(0,0,w,h);c.fillStyle="#24413d";c.textAlign="left";
      c.font="bold 36px Georgia, serif";c.fillText("THE BAY WIRE",20,43);
      c.font="bold 13px monospace";c.textAlign="right";c.fillText("LATE CITY EDITION",580,31);
      c.fillStyle="#a84535";c.fillRect(20,54,560,4);c.textAlign="left";c.fillStyle="#2e3431";
      c.font="bold 30px Georgia, serif";c.fillText(tight?"Room for one more":"The street between shifts",20,94);
      c.drawImage(image,(image.naturalWidth-sw)/2,(image.naturalHeight-sh)/2,sw,sh,20,108,560,201);
      c.font="italic 17px Georgia, serif";c.fillText(tight?p.model+" slips through the traffic.":"Afternoon traffic on "+p.street+".",20,337,550);
      c.fillStyle="#7c5544";c.fillRect(20,349,560,1);c.font="bold 12px monospace";
      c.fillText("PICTURE DESK  /  ROMY VALE & JULES",20,370);c.textAlign="right";c.fillText(p.street.toUpperCase(),580,370,230);
      c.restore();return true;
    }
  }
  window.BayCleanThrough={Reel,draw,key,PictureDesk};
})();
