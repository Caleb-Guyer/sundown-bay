/* The two-ended Luz carries the restored public crossing. Both views use the same deck. */
(() => {
  const docks=BayMarina.docks.slice(0,2),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
  const mix=(a,b,t)=>a+(b-a)*t,smooth=t=>t*t*(3-2*t),tau=Math.PI*2;
  const stop=i=>({x:docks[i].x+docks[i].headW/2-.72,z:docks[i].z+3.25,y:docks[i].level,
    kind:"crossing",name:docks[i].name+" · Luz landing"});
  const berth=i=>{const p=stop(i);return {x:p.x+7.35,z:p.z};};
  const a=berth(0),b=berth(1);
  function track(u){
    const arch=Math.sin(u*Math.PI),side=22*arch*arch;
    return {x:mix(a.x,b.x,smooth(u))+side,z:mix(a.z,b.z,u),
      yaw:Math.atan2((b.x-a.x)*6*u*(1-u)+22*Math.PI*Math.sin(tau*u),b.z-a.z)};
  }
  const channel={...track(.50)};channel.x+=7;
  const cleat=i=>({...stop(i),x:stop(i).x+.48,z:stop(i).z+1.52});
  const point=(v,x,z,y)=>({...BayDriving.world(v,x,z),y:v.y+y});
  const span=34;
  class Service {
    constructor(book){
      this.book=book;this.at=book.berth;this.phase="berth";this.clock=0;this.rider=null;this.wake=[];
      this.halfWidth=1.65;this.halfLength=4.35;this.replied=0;this.prompted=false;this.departure=0;
      this.u=this.at;Object.assign(this,track(this.u));this.y=.12;this.speed=0;
    }
    grant(){this.book.pass=true;this.at=this.book.berth=this.book.credit==="crew"?1:0;
      this.u=this.at;Object.assign(this,track(this.u));this.phase="berth";this.clock=0;}
    near(p){for(let i=0;i<2;i++)if(Math.hypot(p.x-stop(i).x,p.z-stop(i).z)<3.1)return i;return -1;}
    board(i,hero){
      if(!this.book.pass||this.rider||this.phase!=="berth"||i!==this.at)return false;
      this.rider={phase:"board",age:0,from:{...hero},x:-.8,z:0,tries:0,bell:false,clean:false,charge:null,rope:null};
      this.clock=0;return true;
    }
    release(){
      const r=this.rider;if(r?.phase!=="line"||r.charge==null||r.rope)return;
      const power=r.charge,goal=this.goal();r.charge=null;r.tries++;
      r.rope={age:0,power,hit:Math.abs(power-goal)<=.14};return true;
    }
    goal(){return this.at ? .65 : .54;}
    bell(){
      const r=this.rider;
      if(r?.phase!=="sail"||r.bell||Math.abs(this.u-.5)>.17)return false;
      r.bell=true;this.replied=2.2;return true;
    }
    assist(){const r=this.rider;if(r?.phase!=="line")return;r.charge=null;r.rope=null;r.phase="off";r.age=0;r.from=this.onDeck();return true;}
    onDeck(){const r=this.rider;return point(this,r?.x??-.8,r?.z??0,.83);}
    depart(){this.phase="sail";this.clock=0;this.departure=this.at;this.prompted=false;}
    step(dt,t,hero,input){
      if(!this.book.pass)return;
      let event=null;const r=this.rider;
      this.y=.12+.034*Math.sin(t*1.31+this.z*.05);this.replied=Math.max(0,this.replied-dt);
      if(this.phase==="sail"){
        this.clock=Math.min(span,this.clock+dt);
        const f=this.clock/span;this.u=mix(this.departure,1-this.departure,smooth(f));
        Object.assign(this,track(this.u));this.speed=6*f*(1-f)*Math.abs(b.z-a.z)/span;
        if(this.speed>2&&(!this.wake.length||t-this.wake.at(-1).t>.23)){
          this.wake.push({...BayDriving.world(this,0,this.departure?3.9:-3.9),t});
        }
        if(r&&Math.abs(this.u-.5)<.15&&!this.prompted){this.prompted=true;event="channel";}
        if(this.clock===span){
          this.at=1-this.departure;this.phase="berth";this.clock=0;this.speed=0;
          if(r){r.phase="line";r.age=0;event="line";}
        }
      }else if(!r&&this.book.trips){this.clock+=dt;if(this.clock>=16)this.depart();}
      while(this.wake.length&&t-this.wake[0].t>2.8)this.wake.shift();
      if(!r)return event;
      r.age+=dt;const shore=stop(this.at);
      if(r.phase==="board"||r.phase==="off"){
        const boarding=r.phase==="board",end=boarding?this.onDeck():shore,f=smooth(Math.min(1,r.age/2.3));
        const via=point(this,-1.52,.05,.83),first=f<.5;
        const s=first?r.from:via,e=first?via:end,k=first?f*2:(f-.5)*2;
        Object.assign(hero,{x:mix(s.x,e.x,k),z:mix(s.z,e.z,k),y:mix(s.y,e.y,k),yaw:Math.atan2(e.x-s.x,e.z-s.z)});
        if(f===1){
          if(boarding){r.phase="sail";r.age=0;this.depart();return "cast";}
          this.book.trips++;if(r.clean)this.book.clean++;this.book.berth=this.at;this.rider=null;return "land";
        }
      }else{
        const ax=input?.x||0,az=input?.z||0,yaw=(input?.yaw||0)-this.yaw;
        const l=Math.max(1,Math.hypot(ax,az)),dx=(ax*Math.cos(yaw)+az*Math.sin(yaw))/l,dz=(az*Math.cos(yaw)-ax*Math.sin(yaw))/l;
        r.x=clamp(r.x+dx*dt*1.8,-1.14,.98);r.z=clamp(r.z+dz*dt*1.8,-1.75,1.4);
        Object.assign(hero,this.onDeck());if(ax||az)hero.yaw=this.yaw+Math.atan2(dx,dz);
        if(r.phase==="line"){
          if(r.charge!=null)r.charge=Math.min(1,r.charge+dt*.68);
          if(r.rope){r.rope.age+=dt;if(r.rope.age>.9){
            if(r.rope.hit){r.clean=r.tries===1;r.phase="off";r.age=0;r.from=this.onDeck();event="tied";}
            else event="miss";r.rope=null;
          }}
        }
      }
      return event;
    }
  }
  const cream="#eee3c4",teal="#2a645e",red="#b75b48",wood="#b38b60",ink="#374e4f";
  function hull(g){
    const edges=[[-4.38,.68],[-3.48,1.47],[-2.5,1.62],[2.5,1.62],[3.48,1.47],[4.38,.68]];
    for(let i=1;i<edges.length;i++){
      const [z,w]=edges[i-1],[v,n]=edges[i];
      g.quad([-w,.81,z],[w,.81,z],[n,.81,v],[-n,.81,v],wood);
      for(const k of [-1,1]){
        g.quad([k*w*.77,-.18,z],[k*w,.69,z],[k*n,.69,v],[k*n*.77,-.18,v],teal);
        g.quad([k*w,.69,z],[k*w,.82,z],[k*n,.82,v],[k*n,.69,v],cream);
      }
    }
    for(const end of [-1,1]){
      const z=end*4.38;g.quad([-.52,-.18,z],[-.68,.8,z],[.68,.8,z],[.52,-.18,z],teal);
      for(const k of [-1,1])for(const z of [1.73,2.94])g.pole([k*1.33,.82,end*z],[k*1.33,2.78,end*z],.042,cream,5);
      g.box(0,2.81,end*2.34,3.14,.10,1.47,red);
      g.box(0,2.81,end*2.95,3.15,.12,.21,cream);
      g.box(.49,.99,end*2.61,.98,.20,.42,cream);g.box(.49,1.14,end*2.61,1.08,.07,.46,wood);
    }
    g.box(.58,1.18,1.90,1.05,.73,.37,teal);g.box(.58,1.59,1.90,1.12,.08,.42,cream);
    for(const z of [-3.45,-1.7,1.7,3.45]){g.cyl(1.39,1.12,z,.029,.029,.59,5,ink);}
    g.pole([1.39,1.40,-3.45],[1.39,1.40,3.45],.025,cream,5);
    for(const side of [-1,1]){
      // The nameboards hang between the red awning's forward stanchions.
      g.box(side*1.35,2.33,2.31,.08,.43,1.30,teal);
      const letter=(z,y)=>[side*1.401,2.33+y,2.31+side*z];
      for(const [u,v,x,y] of [[-.46,.12,-.46,-.12],[-.46,-.12,-.25,-.12],
        [-.10,.12,-.10,-.12],[-.10,-.12,.10,-.12],[.10,-.12,.10,.12],
        [.25,.12,.46,.12],[.46,.12,.25,-.12],[.25,-.12,.46,-.12]]){
        g.pole(letter(u,v),letter(x,y),.023,cream,5);
      }
      const ring=a=>[side*1.38,1.91+.30*Math.sin(a),-2.33+.30*Math.cos(a)];
      g.box(side*1.33,1.91,-2.33,.07,.07,1.21,wood);
      for(let i=0;i<12;i++)g.pole(ring(i*tau/12),ring((i+1)*tau/12),.069,i%3===0?cream:"#c46540",6);
    }
    for(let i=-6;i<=6;i++)g.box(i*.19,.822,0,.014,.014,6.88,"#947858");
    g.box(-1.50,1.09,-1.76,.13,.32,.61,"#33444a");
  }
  function world(view,model,visible,see,s,t,person){
    if(!s.book.pass)return;
    for(let i=0;i<2;i++){
      const p=stop(i);if(!see(p,75))continue;
      model("luz/post",g=>{g.box(0,.77,0,.13,1.55,.13,ink);g.box(0,1.30,0,.12,.50,.82,teal);
        g.box(.072,1.42,0,.02,.062,.62,cream);g.box(.074,1.25,-.06,.022,.039,.45,cream);});
      visible.push(["luz/post",p.x-.74,p.y,p.z+.77,0]);
      model("luz/cleat",g=>{g.box(0,.12,0,.21,.24,.21,ink);g.box(0,.25,0,.22,.08,.49,ink);});
      const k=cleat(i);visible.push(["luz/cleat",k.x,p.y,k.z,0]);
    }
    if(see(channel,100)){
      model("luz/channel",g=>{g.cyl(0,.24,0,.31,.56,.77,9,teal);g.cyl(0,1.0,0,.09,.15,1.05,7,cream);
        g.cyl(0,1.68,0,.23,.29,.34,8,red);});
      visible.push(["luz/channel",channel.x,.03*Math.sin(t*1.5),channel.z,0]);
      if(s.replied>0){model("luz/flash",g=>g.cyl(0,1.91,0,.12,.13,.18,7,"#ffdb86"));visible.push(["luz/flash",channel.x,0,channel.z,0,0,0,1]);}
    }
    if(!see(s,145))return;
    model("luz/hull",hull);visible.push(["luz/hull",s.x,s.y,s.z,s.yaw]);
    if(s.wake.length){model("luz/wake",g=>{for(const k of [-1,1])g.quad([k*.4,0,0],[k*1.3,0,1.1],[k*1.37,0,1.12],[k*.52,0,0],"#a4cbc1");});
      for(const w of s.wake)visible.push(["luz/wake",w.x,.074,w.z,s.yaw+(s.departure?0:Math.PI)]);}
    const captain=point(s,.61,2.31,.82),mate=point(s,-.96,-2.43,.82);
    visible.push([person(2,"local",0,1),captain.x,captain.y,captain.z,s.yaw+(s.departure?Math.PI:0)],
      [person(s.book.credit==="crew"?4:1,"local",0,s.rider?.phase==="line"?1:0),mate.x,mate.y,mate.z,s.yaw-.6]);
    if(s.phase==="berth"){
      const p=stop(s.at);model("luz/plank",g=>{g.box(0,0,0,5.30,.10,.85,wood);
        for(let i=-5;i<=5;i++)g.box(i*.46,.057,0,.041,.025,.82,cream);});
      visible.push(["luz/plank",p.x+3.22,(p.y+s.y+.80)*.5,p.z,0,0,Math.atan2(s.y+.80-p.y,5.3)]);
    }
    const rope=s.rider?.rope;
    if(rope){const p=s.onDeck(),k=cleat(s.at),f=Math.min(1,rope.age/.69),reach=rope.hit?1:.55+rope.power*.78;
      const x=mix(p.x,k.x,reach*f),z=mix(p.z,k.z,reach*f),y=mix(p.y+1,k.y+.28,f)+1.8*Math.sin(f*Math.PI);
      model("luz/coil",g=>{for(let i=0;i<10;i++){const a=i*tau/10,b=(i+1)*tau/10;
        g.pole([.27*Math.sin(a),0,.32*Math.cos(a)],[.27*Math.sin(b),0,.32*Math.cos(b)],.03,cream,4);}});
      visible.push(["luz/coil",x,y,z,s.yaw]);
      model("luz/line",g=>g.box(0,0,0,.031,.031,.24,cream));
      const dx=x-p.x,dz=z-p.z,dy=y-p.y-.97,flat=Math.hypot(dx,dz),n=Math.ceil(Math.hypot(flat,dy)/.21);
      for(let i=0;i<n;i++){const u=(i+.5)/n;
        visible.push(["luz/line",p.x+dx*u,p.y+.97+dy*u-.13*Math.sin(Math.PI*u),p.z+dz*u,Math.atan2(dx,dz),-Math.atan2(dy,flat)]);}
    }
  }
  function map(c,s,px,py,scale,visible,street){
    if(!s?.book.pass)return;
    for(let i=0;i<2;i++){const p=stop(i);if(!visible(px(p.x),py(p.z),12))continue;
      c.fillStyle=teal;c.fillRect(px(p.x)-2,py(p.z)-2,4,4);
      if(street){const k=cleat(i);c.fillStyle=ink;c.fillRect(px(k.x)-.13*scale,py(k.z)-.33*scale,.26*scale,.66*scale);}}
    if(visible(px(channel.x),py(channel.z),8)){c.fillStyle=s.replied>0?"#ffda86":red;c.beginPath();c.arc(px(channel.x),py(channel.z),Math.max(1.7,.42*scale),0,tau);c.fill();}
    if(!visible(px(s.x),py(s.z),8*scale+12))return;
    c.save();c.translate(px(s.x),py(s.z));c.rotate(s.yaw);const k=street?scale:Math.max(.8,scale);c.scale(k,-k);
    c.fillStyle=teal;c.beginPath();for(const [i,[x,z]] of [[-.67,-4.38],[-1.62,-2.65],[-1.62,2.65],[-.67,4.38],[.67,4.38],[1.62,2.65],[1.62,-2.65],[.67,-4.38]].entries())
      if(i)c.lineTo(x,z);else c.moveTo(x,z);c.closePath();c.fill();c.strokeStyle=cream;c.lineWidth=.12;c.stroke();
    c.fillStyle=wood;c.fillRect(-1.42,-2.92,2.84,5.84);c.fillStyle=red;c.fillRect(-1.42,1.64,2.84,1.41);c.fillRect(-1.42,-3.06,2.84,1.41);
    c.fillStyle=cream;c.fillRect(-1.42,2.73,2.84,.15);c.fillRect(-1.42,-2.87,2.84,.14);
    if(street){c.fillStyle="#c99a68";c.beginPath();c.arc(.61,2.31,.24,0,tau);c.fill();
      c.fillStyle=ink;c.beginPath();c.arc(-.96,-2.43,.25,0,tau);c.fill();
      if(s.phase==="berth"){c.fillStyle=wood;c.fillRect(-6.78,-.39,5.35,.78);}
      if(s.rider?.rope){const r=s.rider.rope,f=Math.min(1,r.age/.69),reach=r.hit?1:.55+r.power*.78;
        const dock=cleat(s.at),x=mix(s.rider.x,dock.x-s.x,f*reach),z=mix(s.rider.z,dock.z-s.z,f*reach);
        c.strokeStyle=cream;c.lineWidth=.095;c.beginPath();c.moveTo(s.rider.x,s.rider.z);c.lineTo(x,z);c.stroke();
        c.beginPath();c.ellipse(x,z,.29,.37,0,0,tau);c.stroke();}}
    c.restore();
  }
  window.BayFirstCrossing={Service,stop,channel,track,world,map};
})();
