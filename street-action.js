/* Short-lived street action. Only nearby people and recent marks need simulation. */
(() => {
  "use strict";
  const weapons=[null,{name:"Sidearm",size:8,range:38,cycle:.25,reload:1.1,angles:[0]},
    {name:"Scattergun",size:3,range:19,cycle:.68,reload:1.55,angles:[0,-.085,.085]}];
  const eligible=p=>!p.onTour&&!p.palmManaged&&!p.palmPassenger&&!p.down;
  class Action {
    constructor(){this.slot=0;this.rounds=[0,8,3];this.cool=0;this.loading=0;this.flash=0;
      this.traces=[];this.marks=[];this.count=0;this.lastFalls=[];this.report=0;this.witness=0;}
    equip(slot){if(this.slot===slot)return;this.slot=slot;this.loading=slot&&!this.rounds[slot]?weapons[slot].reload:0;this.flash=0;}
    tick(dt){
      this.cool=Math.max(0,this.cool-dt);this.flash=Math.max(0,this.flash-dt);
      this.report=Math.max(0,this.report-dt);this.witness=Math.max(0,this.witness-dt);
      if(this.loading){this.loading=Math.max(0,this.loading-dt);if(!this.loading&&this.slot)this.rounds[this.slot]=weapons[this.slot].size;}
      for(const list of [this.traces,this.marks]){
        for(let i=list.length-1;i>=0;i--)if((list[i].life-=dt)<=0)list.splice(i,1);
      }
    }
    fall(p,yaw){
      if(!eligible(p))return false;
      p.down={age:0,duration:12,slide:1.9};p.yaw=yaw;p.moving=false;p.startle=p.sprayPose=null;p.flee=null;
      this.lastFalls.push(p);this.count++;if(this.marks.length>=20)this.marks.shift();
      this.marks.push({x:p.x+.36*Math.sin(yaw),z:p.z+.36*Math.cos(yaw),yaw,life:19});
      return true;
    }
    scatter(people,origin){
      for(const p of people){
        if(!eligible(p)||Math.hypot(p.x-origin.x,p.z-origin.z)>16)continue;
        p.flee={yaw:Math.atan2(p.x-origin.x,p.z-origin.z),left:1.8};
      }
    }
    fire(hero,yaw,people,cars,obstacles,ground){
      const w=weapons[this.slot];if(!w||this.cool||this.loading)return null;
      this.lastFalls.length=0;
      this.cool=w.cycle;this.flash=.16;this.rounds[this.slot]--;
      if(!this.rounds[this.slot])this.loading=w.reload;
      let hits=0;
      for(const offset of w.angles){
        const a=yaw+offset,s=Math.sin(a),c=Math.cos(a),eye={x:hero.x,y:hero.y+1.2,z:hero.z};
        const end={x:eye.x+s*w.range,y:eye.y,z:eye.z+c*w.range};
        let limit=w.range*BayCamera.safeFraction(eye,end,obstacles),hit=null;
        for(const v of cars){
          const dx=v.x-eye.x,dz=v.z-eye.z,d=dx*s+dz*c;
          if(d<=0||d-2.8>limit||Math.abs(dx*c-dz*s)>3||Math.abs(ground(v.x,v.z)+.85-eye.y)>1.25)continue;
          // Clip against the vehicle silhouette using its own heading.
          const q=BayDriving.local(v,eye.x,eye.z),b=a-v.yaw,body=bayCarLayout(v.kind);
          let near=0,far=limit;
          for(const [pos,dir,half] of [[q.x,Math.sin(b),body.track+.12],[q.z,Math.cos(b),body.halfLength]]){
            if(Math.abs(dir)<.00001){if(Math.abs(pos)>half){far=-1;break;}}
            else{const t=(-half-pos)/dir,u=(half-pos)/dir;near=Math.max(near,Math.min(t,u));far=Math.min(far,Math.max(t,u));}
          }
          if(near<=far)limit=near;
        }
        for(const p of people){
          if(!eligible(p))continue;
          const dx=p.x-eye.x,dz=p.z-eye.z,d=dx*s+dz*c;
          if(d<.35||d>=limit||Math.abs(dx*c-dz*s)>.46+.021*d||Math.abs(ground(p.x,p.z)+1.13-eye.y)>1)continue;
          hit=p;limit=d;
        }
        if(hit&&this.fall(hit,a))hits++;
        this.traces.push({x:eye.x+s*.55,z:eye.z+c*.55,y:eye.y,ex:eye.x+s*limit,ez:eye.z+c*limit,yaw:a,life:.15});
      }
      this.scatter(people,hero);return {hits};
    }
    bumper(v,people,ground){
      if(!v||v.jumpFlight||Math.abs(v.speed)<5.6)return 0;
      this.lastFalls.length=0;
      const body=bayCarLayout(v.kind),reach=body.halfLength+1;let hits=0;
      for(const p of people){
        if(!eligible(p)||Math.abs(v.x-p.x)>reach||Math.abs(v.z-p.z)>reach)continue;
        const q=BayDriving.local(v,p.x,p.z);
        if(Math.abs(q.x)>body.track+.27||Math.abs(q.z)>body.halfLength+.18||Math.abs(ground(p.x,p.z)-ground(v.x,v.z))>1.15)continue;
        if(this.fall(p,v.yaw+(v.speed<0?Math.PI:0)))hits++;
      }
      if(hits)this.scatter(people,v);return hits;
    }
  }
  function stepPerson(p,dt,valid){
    if(p.down){
      const v=p.down;if(v.inCare)return true;
      v.age=v.assigned?Math.min(v.duration-1,v.age+dt):v.age+dt;const step=v.slide*dt*Math.exp(-v.age*4);
      const x=p.x+Math.sin(p.yaw)*step,z=p.z+Math.cos(p.yaw)*step;
      if(step>.001&&valid(x,z,.24)){p.x=x;p.z=z;}
      if(v.age>=v.duration){p.down=null;p.wait=.9;}return true;
    }
    if(!p.flee)return false;
    const f=p.flee,step=dt*3.8,x=p.x+Math.sin(f.yaw)*step,z=p.z+Math.cos(f.yaw)*step;
    if(valid(x,z,.28)){p.x=x;p.z=z;}else f.yaw+=p.side*Math.PI*.43;
    p.yaw=f.yaw;p.phase+=dt*9;p.moving=true;p.gesture=1;
    if((f.left-=dt)<=0)p.flee=null;return true;
  }
  function tilt(p){return Math.min(1,p.down.age/.31,(p.down.duration-p.down.age)/.85)*1.49;}
  function install(model,disc){
    disc("street-stain",.50,.31,"#92363b");
    model("street-spots",g=>{for(const [x,z,r] of [[.38,.19,.13],[-.27,.31,.11],[.12,.47,.075],[.57,.32,.07]]){
      g.cyl(x,.01,z,r,r,.012,7,"#a33b42");
    }});
    model("street-flash",g=>g.box(0,0,0,.12,.12,.29,"#fff2a2"));
    model("street-streak",g=>g.box(0,0,0,.034,.04,.72,"#ffd69a"));
    for(const [i,length] of [[1,.29],[2,.57]])model("street-prop-"+i,g=>{
      g.box(0,.015,length*.28,.078,.095,length,"#43515a");g.box(0,-.065,-.034,.078,.13,.092,"#614839");
      g.box(0,.071,length*.67,.055,.022,.044,"#bcc8b9");
      if(i===2)g.box(0,-.036,.17,.096,.057,.18,"#91664a");
    });
  }
  function world(a,list,ground,see){
    for(const p of a.marks)if(see(p,50)){
      const y=ground(p.x,p.z)+.082;
      list.push(["street-stain",p.x,y,p.z,p.yaw],["street-spots",p.x,y,p.z,p.yaw]);
    }
    for(const p of a.traces){
      const t=.22+.68*(1-p.life/.15);
      list.push(["street-streak",p.x+(p.ex-p.x)*t,p.y,p.z+(p.ez-p.z)*t,p.yaw]);
    }
  }
  function gun(list,a,h){
    const q=BayDriving.world(h,.22,.44),y=h.y+1.22+a.flash*.26;
    list.push(["street-prop-"+a.slot,q.x,y,q.z,h.yaw]);
    if(a.flash){const m=BayDriving.world(h,.22,a.slot===2?.99:.76);list.push(["street-flash",m.x,y,m.z,h.yaw]);}
  }
  function map(c,a,px,py,s){
    for(const p of a.marks){
      const x=px(p.x),y=py(p.z);c.fillStyle="#983b40";c.beginPath();c.ellipse(x,y,.59*s,.32*s,p.yaw,0,Math.PI*2);c.fill();
      for(const [dx,dz,r] of [[.42,.21,.14],[-.31,.31,.105],[.12,.47,.07]]){c.beginPath();c.arc(x+dx*s,y+dz*s,r*s,0,Math.PI*2);c.fill();}
    }
    c.strokeStyle="#ffe19e";c.lineWidth=Math.max(1,.064*s);
    for(const p of a.traces){c.beginPath();c.moveTo(px(p.x),py(p.z));c.lineTo(px(p.ex),py(p.ez));c.stroke();}
  }
  function paper(canvas,id){
    canvas.width=760;canvas.height=420;
    const c=canvas.getContext("2d"),port=id==="portReceipt",receipt=id!=="payEnvelope";
    c.fillStyle=port?"#25353a":"#414f4c";c.fillRect(0,0,760,420);c.save();
    c.translate(380,210);c.rotate(port?.037:-.043);
    c.shadowColor="#13292a";c.shadowBlur=18;c.shadowOffsetY=9;c.fillStyle=port?"#c1c9b9":"#ebcf9c";c.fillRect(-263,-147,526,294);c.shadowBlur=0;c.shadowOffsetY=0;
    c.strokeStyle="#a09478";c.lineWidth=1;for(let y=-37;y<110;y+=32){c.beginPath();c.moveTo(-236,y);c.lineTo(237,y);c.stroke();}
    c.fillStyle="#283c3a";c.font="bold 17px monospace";c.fillText(port?"PORT SOL   /   SCALE HOUSE":"MARLIN MOTOR COURT     PAY OFFICE",-230,-106);
    c.font="bold 32px Georgia";c.fillText(port?"Mixed metal":receipt?"Wages collected":"Night shift payroll",-230,-62);
    c.font="18px monospace";const lines=port?["One biscuit tin, sealed","Contents sold as received","Bearer paid in cash"]:receipt?["Marisol Vale       received","Ella Cruz          received","T. Robles          received"]:["M. Vale     laundry      42 hrs","E. Cruz     desk         38 hrs","T. Robles   kitchen      46 hrs"];
    lines.forEach((line,i)=>c.fillText(line,-227,-13+i*32));
    c.translate(155,100);c.rotate(-.14);c.strokeStyle=c.fillStyle=port?"#5c5850":"#a64d3c";c.lineWidth=2;c.strokeRect(-68,-22,136,35);
    c.textAlign="center";c.font="bold 18px monospace";c.fillText(port?"WEIGHED":receipt?"RECEIVED":"FRIDAY",0,1);c.restore();
  }
  window.BayStreetAction={paper,Action,weapons,stepPerson,tilt,install,world,gun,map};
})();
