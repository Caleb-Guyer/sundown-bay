/* County Roads collects the cones left at a real patrol closure. */
(() => {
  "use strict";
  const key="sundownBay.countyRoads.v1";
  const distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const point=p=>Number.isFinite(p?.x)&&Number.isFinite(p?.z)&&Math.abs(p.x)<255&&Math.abs(p.z)<255;
  const validSite=s=>point(s?.rack)&&Number.isFinite(s.rack.yaw)&&typeof s.street==="string"&&s.street.length<=90&&
    Array.isArray(s.cones)&&s.cones.length===4&&s.cones.every(c=>point(c)&&distance(c,s.rack)<42&&Number.isFinite(c.yaw)&&["ground","player","county"].includes(c.by));
  const done=s=>s.cones.every(c=>c.by!=="ground");
  function read(){
    let r;try{r=JSON.parse(localStorage.getItem(key));}catch{}
    return {site:validSite(r?.site)?r.site:null,best:Number.isFinite(r?.best)&&r.best>=0&&r.best<=9?r.best:0};
  }
  class Crew {
    constructor(book=read()){
      this.book=book;this.site=book.site;this.reset();
    }
    reset(){
      this.hand=-1;this.assigned=-1;this.loaded=false;this.charge=null;this.flight=null;this.delay=6;this.greeted=false;
      this.worker=this.site?{...BayDriving.world(this.site.rack,-.85,-.45),yaw:this.site.rack.yaw,phase:0,moving:false}:null;
    }
    write(){try{localStorage.setItem(key,JSON.stringify(this.book));}catch{}}
    open(b,street,clear){
      if(!b||this.site&&!done(this.site))return false;
      let rack;
      for(const side of [b.side,-b.side])for(const along of [-7,-11,-3]){
        const q=BayDriving.world(b,side*8.5,along);
        if(!rack&&clear(q.x,q.z,.9))rack={...q,yaw:b.yaw};
      }
      if(!rack)return false;
      const cones=b.cones.map(c=>({x:c.x,z:c.z,yaw:c.yaw,fallen:!!c.hit,by:"ground"}));
      this.book.site=this.site={rack,street,cones};this.reset();this.write();return true;
    }
    nearest(p,limit){
      let index=-1;
      this.site.cones.forEach((c,i)=>{
        if(c.by!=="ground"||i===this.assigned||i===this.hand||i===this.flight?.id)return;
        const d=distance(c,p);if(d<limit){limit=d;index=i;}
      });
      return index;
    }
    hint(p){
      if(!this.site||done(this.site)||distance(p,this.site.rack)>30)return "";
      if(this.hand>=0){
        const d=distance(p,this.site.rack);
        if(d<1.85)return "Stack the cone on Inez’s cart";
        if(d>8)return "Carry the cone closer to the orange cart";
        if(this.charge===null)return "Hold L to toss to the cart";
        const miss=this.range()-d;
        return Math.abs(miss)<.85?"Release L now · on the stack":miss<0?"Hold L · short":"Release L · long";
      }
      return this.flight?"":this.nearest(p,1.85)>=0?"Pick up the cone":"";
    }
    press(p){
      if(!this.hint(p))return "";
      if(this.hand<0){
        this.hand=this.nearest(p,1.85);this.lastFoot={x:p.x,z:p.z};
        return "take";
      }
      if(distance(p,this.site.rack)<1.85)return this.stack(this.hand,true);
      if(distance(p,this.site.rack)<=8)this.charge=0;
      return "aim";
    }
    range(){return 1.1+Math.min(1,this.charge/1.12)*7.7;}
    release(p){
      if(this.charge===null||this.hand<0)return false;
      const r=this.site.rack,d=distance(r,p),reach=this.range();
      this.charge=null;
      if(d<.01||d>8.25)return false;
      this.flight={id:this.hand,start:{x:p.x,z:p.z},end:{x:p.x+(r.x-p.x)*reach/d,z:p.z+(r.z-p.z)*reach/d},
        caught:Math.abs(reach-d)<=.85,distance:d,age:0,time:.42+.038*reach};
      if(this.flight.caught)this.flight.end={x:r.x,z:r.z};
      this.hand=-1;return true;
    }
    stack(id,player){
      const c=this.site.cones[id];if(!c||c.by!=="ground")return "";
      c.by=player?"player":"county";
      if(player){this.hand=-1;this.charge=null;}else{this.assigned=-1;this.loaded=false;this.delay=1.2;}
      this.write();return done(this.site)?"clear":player?"stack":"";
    }
    drop(id,p,clear){
      if(p&&clear(p.x,p.z,.38)&&distance(p,this.site.rack)<29)
        Object.assign(this.site.cones[id],{x:p.x,z:p.z,fallen:true});
      this.write();
    }
    step(dt,p,canCarry,clear,trafficClear){
      const s=this.site;if(!s||done(s))return "";
      if(this.hand>=0){
        if(!canCarry||distance(p,s.rack)>28){this.drop(this.hand,this.lastFoot,clear);this.hand=-1;this.charge=null;}
        else{this.lastFoot.x=p.x;this.lastFoot.z=p.z;if(this.charge!==null)this.charge+=dt;}
      }
      const f=this.flight;
      if(f&&(f.age+=dt)>=f.time){
        this.flight=null;
        if(f.caught){this.book.best=Math.max(this.book.best,Math.round(f.distance*10)/10);return this.stack(f.id,true);}
        this.drop(f.id,f.end,clear);return "miss";
      }
      if(distance(s.rack,p)>65)return "";
      const w=this.worker;w.moving=false;
      if((this.delay-=dt)>0)return "";
      if(this.assigned<0)this.assigned=this.nearest(w,40);
      if(this.assigned<0)return "";
      const dest=this.loaded?BayDriving.world(s.rack,-.77,-.22):s.cones[this.assigned],d=distance(w,dest);
      if(d<(this.loaded?.55:1.04)){
        if(this.loaded)return this.stack(this.assigned,false);
        this.loaded=true;this.delay=.55;return "";
      }
      const travel=Math.min(d,1.75*dt),x=w.x+(dest.x-w.x)*travel/d,z=w.z+(dest.z-w.z)*travel/d;
      if(!trafficClear(x,z)||!clear(x,z,.24)){
        // Walk around a parked bumper. Moving traffic yields before reaching the worker.
        const heading=Math.atan2(dest.x-w.x,dest.z-w.z);
        for(const bend of [.65,-.65,1.15,-1.15,1.55,-1.55]){
          const yaw=heading+bend,dx=Math.sin(yaw),dz=Math.cos(yaw);
          const lookX=w.x+.55*dx,lookZ=w.z+.55*dz;
          if(!trafficClear(lookX,lookZ)||!clear(lookX,lookZ,.24))continue;
          w.yaw=yaw;w.x+=dx*travel;w.z+=dz*travel;w.moving=true;w.phase+=travel*3.9;break;
        }
        return "";
      }
      w.yaw=Math.atan2(dest.x-w.x,dest.z-w.z);w.x=x;w.z=z;w.moving=true;w.phase+=travel*3.9;
      return "";
    }
    cones(player,draw){
      const s=this.site,r=s.rack,w=this.worker;let stack=0;
      s.cones.forEach((c,i)=>{
        if(c.by!=="ground"){draw(r,.30+stack++*.11,r.yaw,0);return;}
        if(i===this.hand||i===this.assigned&&this.loaded){
          const a=i===this.hand?player:w;draw(BayDriving.world(a,.33,.27),.67,a.yaw,.5);return;
        }
        const f=this.flight;
        if(i===f?.id){
          const t=Math.min(1,f.age/f.time);
          draw({x:f.start.x+(f.end.x-f.start.x)*t,z:f.start.z+(f.end.z-f.start.z)*t},
            .73*(1-t)+.55*t+4*t*(1-t)*1.0,t*4.3,(1-t)*.72);return;
        }
        draw(c,.025,c.yaw,c.fallen?1.5:0);
      });
    }
  }
  function rack(g){
    const steel="#799293",grip="#424e50",orange="#ed864d";
    g.box(0,.235,0,.80,.13,1.12,steel);g.box(0,.31,0,.70,.035,1.02,"#53696a");
    for(const side of [-1,1]){
      for(const end of [-.36,.36])g.pole([side*.34,.137,end],[side*.455,.137,end],.14,grip,9);
      g.pole([side*.34,.28,-.49],[side*.34,1.14,-.61],.032,steel,6);
      g.box(side*.405,.254,0,.025,.075,.47,orange);
    }
    g.pole([-.35,1.14,-.61],[.35,1.14,-.61],.043,grip,7);
    g.box(0,.70,-.545,.59,.23,.035,"#edc992");g.box(-.17,.70,-.567,.10,.14,.012,orange);
    for(const y of [.66,.72])g.box(.06,y,-.568,.25,.02,.012,grip);
  }
  function world(crew,list,model,see,ground,hero){
    const s=crew.site;if(!s||!see(s.rack,97))return;
    const r=s.rack,w=crew.worker;model("county/rack",rack);
    list.push(["county/rack",r.x,ground(r.x,r.z),r.z,r.yaw]);
    const pose=w.moving?1+Math.floor(w.phase)%8:0,token="county/inez/"+pose+"/"+Number(crew.loaded);
    model(token,g=>{buildBayPerson(g,"#9b674f","#e2874c","#485966",pose?(pose-1)*Math.PI/4:0,"dockhand",crew.loaded?4:0);
      g.box(0,1.16,0,.36,.044,.246,"#e6dbab");g.cyl(0,1.83,.02,.13,.12,.09,9,"#c29b64");});
    list.push([token,w.x,ground(w.x,w.z),w.z,w.yaw]);
    crew.cones(hero,(p,y,yaw,tilt)=>list.push(["patrol-cone",p.x,ground(p.x,p.z)+y,p.z,yaw,tilt]));
  }
  function map(c,crew,player,street,px,py,s,visible,person,bearing){
    const site=crew?.site;if(!site)return;
    const r=site.rack,x=px(r.x),y=py(r.z);if(!visible(x,y,32*s))return;
    if(!street){if(done(site))return;c.fillStyle="#f2a061";c.beginPath();c.moveTo(x,y-5);c.lineTo(x+4,y+4);c.lineTo(x-4,y+4);c.fill();return;}
    c.save();c.translate(x,y);c.rotate(r.yaw);c.scale(s,s);
    c.fillStyle="#44565a";c.fillRect(-.46,-.55,.92,1.10);c.fillStyle="#89a09c";c.fillRect(-.34,-.49,.68,.98);
    c.fillStyle="#eed19c";c.fillRect(-.36,.47,.72,.13);c.restore();
    const w=crew.worker;person(c,{...w,skin:"#9b674f",shirt:"#e2874c"},px(w.x),py(w.z),Math.max(2.3,s*1.42),false,bearing);
    crew.cones(player,(p,h,yaw,tilt)=>{
      c.save();c.translate(px(p.x),py(p.z));c.rotate(yaw);c.scale(s,s);c.fillStyle="#515856";c.fillRect(-.25,-.25,.50,.50);
      c.translate(0,-.15*h);c.fillStyle="#ed8143";c.beginPath();c.moveTo(-.215,.16);c.lineTo(.215,.16);c.lineTo(.045,-.19-tilt*.22);c.lineTo(-.045,-.19-tilt*.22);c.fill();
      c.fillStyle="#f2e6bd";c.fillRect(-.105,-.08-tilt*.11,.21,.075);c.restore();
    });
  }
  window.BayLastCone={Crew,done,world,map,key};
})();
