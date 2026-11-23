/* Walkable levels at the Marlin, plus on-foot vaults over parked vehicles around town. */
(() => {
  "use strict";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),mix=(a,b,f)=>a+(b-a)*f;
  const ease=f=>{f=clamp(f,0,1);return f*f*(3-2*f);};
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const rect=(x,z,a,b,c,d)=>x>=a&&x<=b&&z>=c&&z<=d;
  const near=(x,z)=>x>92&&x<135&&z> -62&&z< -10;
  const ground=.076,roofY=12.07,pentY=13.835;
  const ladders=[
    {id:"east",name:"gallery ladder",x:130.33,z:-39.8,yaw:-Math.PI/2,base:3.465,platform:"gallery",lip:129.47,topX:128.65,rung:.32},
    {id:"west",name:"pool ladder",x:101.67,z:-37,yaw:Math.PI/2,base:2.60,platform:"annex",lip:102.52,topX:103.43,rung:.32}
  ];
  function height(layer,x,z){
    switch(layer){
      case "stairs":return mix(ground,3.465,clamp((z+59.1)/8.30,0,1));
      case "gallery":return 3.465;
      case "roof":return roofY;
      case "penthouse":return pentY;
      case "annex":return 2.60;
      case "loading":return mix(ground,.80,clamp((z+45.65)/1.60,0,1));
      default:return ground;
    }
  }
  function on(layer,x,z){
    switch(layer){
      case "stairs":return rect(x,z,129.44,131.06,-59.14,-50.76);
      case "gallery":return rect(x,z,129.88,131.23,-50.87,-13.38)||rect(x,z,130.62,132.18,-38.12,-25.88);
      case "roof":return rect(x,z,102.54,129.57,-51.51,-12.49);
      case "penthouse":return rect(x,z,104.94,120.04,-28.09,-14.85);
      case "annex":return rect(x,z,96.22,100.41,-42.02,-29.99)||rect(x,z,100.25,102.04,-37.65,-36.35);
      case "loading":return rect(x,z,97.15,99.45,-45.68,-41.97);
      default:return false;
    }
  }
  function lightFloor(x,z){
    if(near(x,z))for(const layer of ["penthouse","roof","gallery","annex","stairs","loading"]){
      if(on(layer,x,z))return height(layer,x,z);
    }
    return 0;
  }
  const deckNames={stairs:"Marlin stairs",gallery:"Guest gallery",roof:"Marlin roof",penthouse:"Penthouse terrace",annex:"Linen room roof",loading:"Pool service"};
  const ledges=[
    {from:"loading",to:"annex",name:"linen roof",z:-42.0,minX:97.2,maxX:99.4},
    {from:"roof",to:"penthouse",name:"penthouse terrace",z:-28.10,minX:105.35,maxX:119.6}
  ];
  function hit(x,z,y,r,boxes){
    return boxes.some(o=>(o.top??o.h??60)>y+.205&&(o.bottom||0)<y+1.60&&Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);
  }
  function localGrip(p,a){
    const dx=a.x-p.x,dz=a.z-p.z,cs=Math.cos(p.yaw),sn=Math.sin(p.yaw);
    return {x:dx*cs-dz*sn,y:a.y-p.y,z:dx*sn+dz*cs};
  }
  class Traversal{
    constructor(){this.reset();}
    reset(){this.level=null;this.action=null;this.cool=0;}
    get raised(){return !!(this.level||this.action);}
    get name(){return deckNames[this.level]||"";}
    floor(p){return height(this.level,p.x,p.z);}
    approach(x,z,y){
      if(!near(x,z))return true;
      for(const id of ["stairs","loading"])if(on(id,x,z)&&height(id,x,z)>y+.31)return false;
      return true;
    }
    enter(p){
      if(this.level||this.action||!near(p.x,p.z))return;
      for(const id of ["stairs","loading"])if(on(id,p.x,p.z)&&height(id,p.x,p.z)<p.y+.32){this.level=id;return;}
    }
    clear(level,x,z,env){
      if(!on(level,x,z))return false;
      const y=height(level,x,z);
      if(level==="roof"&&rect(x,z,104.72,120.26,-28.32,-14.62))return false;
      if(level==="gallery"&&rect(x,z,129.1,130.72,-37.3,-26.7))return false;
      return !hit(x,z,y,.22,env.roofBoxes);
    }
    along(p,dx,dz,env){
      if(this.action||(!dx&&!dz))return;
      const x=p.x+dx,z=p.z+dz,id=this.level;
      // Pick the connected landing first at the overlapping head of each flight.
      const next=id==="stairs"&&z>=-50.81?"gallery":id==="gallery"&&z< -50.8?"stairs":id;
      if(this.clear(next,x,z,env)){this.level=next;p.x=x;p.z=z;return;}
      if((id==="stairs"&&z< -59.1||id==="loading"&&z< -45.65)&&height(id,p.x,p.z)<.22&&env.groundClear(x,z,null,true)){
        this.level=null;p.x=x;p.z=z;return;
      }
      if(on(id,x,z)||id==="gallery"||id==="stairs"||id==="loading")return;
      if(id==="roof"&&ladders.some(l=>Math.hypot(l.topX-p.x,l.z-p.z)<1.14))return;
      const n=Math.hypot(dx,dz),ux=dx/n,uz=dz/n;
      for(const extra of [.88,1.35,1.85]){
        const end={x:x+ux*extra,z:z+uz*extra};
        const layer=["roof","annex","gallery","loading","stairs"].find(s=>height(s,end.x,end.z)<p.y-.55&&this.clear(s,end.x,end.z,env));
        if(layer||env.groundClear(end.x,end.z)){
          this.fall(p,end,layer||null,env);return;
        }
      }
    }
    fall(p,end,layer,env){
      const y=layer?height(layer,end.x,end.z):env.ground(end.x,end.z),h=p.y-y;
      if(h<=.35)return;
      this.action={kind:"drop",from:{...p},end:{...end,y},fromY:p.y,toY:y,height:h,impact:Math.min(1,h/6),
        to:layer,flight:Math.sqrt(2*h/16),age:0,t:0,blend:0,yaw:p.yaw};
      this.level=null;
    }
    ladderAt(p){
      if(this.action||this.cool>0||!this.level)return null;
      for(const l of ladders){
        if(this.level===l.platform&&gap(p,l)<1.46)return l;
        if(this.level==="roof"&&Math.hypot(p.x-l.topX,p.z-l.z)<1.56)return l;
      }
      return null;
    }
    grab(p,l){
      if(!l)return false;
      const down=this.level==="roof",top=roofY-l.base-.70;
      this.level=null;this.action={kind:"ladder",ladder:l,from:{...p},fromY:l.base,toY:roofY,height:roofY-l.base,travel:down?top:0,top,
        approach:0,t:down?1:0,dir:down?-1:1,blend:0,stride:0,rungSpacing:.30,rungBase:.30,rungDepth:l.rung,down};
      return true;
    }
    ledgeAt(p){
      if(this.cool>0||this.action)return null;
      for(const l of ledges)if(this.level===l.from&&p.z<l.z&&p.z>l.z-1.55&&p.x>=l.minX&&p.x<=l.maxX&&Math.cos(p.yaw)>.12)return l;
      return null;
    }
    mantle(p,l){
      const end={x:p.x,z:l.z+.59,y:height(l.to,p.x,l.z+.59)};
      this.pull(p,end,l.to,0,[-.23,.23].map(dx=>({x:p.x+dx,z:l.z+.045,y:end.y+.025})));
    }
    pull(p,end,to,yaw,hands){
      const h=end.y-p.y;
      const edge={x:(hands[0].x+hands[1].x)/2,z:(hands[0].z+hands[1].z)/2};
      const plant=clamp((gap(p,edge)-.40)/Math.max(.01,gap(p,end)),0,.76);
      this.action={kind:"mantle",from:{...p},end,fromY:p.y,toY:end.y,height:h,to,yaw,hands,t:0,age:0,
        duration:.64+.30*Math.min(2,h),plant,blend:0};this.level=null;
    }
    vaultAt(p,env){
      if(this.raised||this.cool>0)return null;
      let best=null,range=Infinity;
      for(const v of env.cars){
        if(v.onLift||v.serviceCar||v.meetCar||v.washGuest||v.guestId||v.recoveryOwner||v.towRig||Math.abs(v.speed)>.4||Math.abs(p.x-v.x)>4||Math.abs(p.z-v.z)>4)continue;
        const l=BayDriving.local(v,p.x,p.z),shape=bayCarLayout(v.kind),end=shape.sections.at(-1)[0],back=shape.sections[0][0];
        const front=end-shape.glass[3]>.32&&l.z>shape.glass[3]+.08&&l.z<end+.37;
        const rear=shape.glass[0]-back>.32&&l.z<shape.glass[0]-.08&&l.z>back-.37;
        if(!front&&!rear)continue;
        const side=Math.sign(l.x),across=Math.abs(l.x),distance=across-shape.track;
        const yaw=v.yaw-side*Math.PI/2;
        if(!side||distance<-.07||distance>.95||distance>=range||Math.cos(p.yaw-yaw)<.48)continue;
        const along=front?clamp(l.z,shape.glass[3]+.13,end-.14):clamp(l.z,back+.14,shape.glass[0]-.13);
        const dest=BayDriving.world(v,-side*(shape.track+.72),along);
        if(!env.groundClear(dest.x,dest.z,v))continue;
        const sections=shape.sections,i=sections.findIndex(q=>q[0]>=along),a=sections[Math.max(0,i-1)],b=sections[i<0?sections.length-1:i];
        const deck=mix(a[2],b[2],clamp((along-a[0])/(b[0]-a[0]||1),0,1));
        best={v,side,along,yaw,deck,dest};range=distance;
      }
      return best;
    }
    vault(p,v,env){
      const groundY=env.ground(v.v.x,v.v.z),end={...v.dest,y:env.ground(v.dest.x,v.dest.z)};
      const hands=[-1,1].map(s=>({...BayDriving.world(v.v,v.side*.16,v.along+s*v.side*.19),y:groundY+v.deck+.026}));
      this.action={kind:"vault",from:{...p},end,to:null,fromY:p.y,toY:end.y,height:v.deck,yaw:v.yaw,hands,t:0,age:0,
        duration:.89+.12*v.deck,blend:0,vehicle:v.v};
      v.v.wait=Math.max(v.v.wait||0,1.65);
    }
    release(p,env){
      const a=this.action;if(a?.kind!=="ladder")return false;
      const l=a.ladder;
      if(a.travel<.25){this.finish(p,l.platform,{x:l.x,z:l.z,y:l.base});return true;}
      this.fall(p,{x:l.x,z:l.z},l.platform,env);return true;
    }
    finish(p,level,end){
      p.x=end.x;p.z=end.z;p.y=end.y;this.level=level;this.action=null;this.cool=.24;
    }
    step(dt,p,m,controls,env){
      this.cool=Math.max(0,this.cool-dt);
      const a=this.action;if(!a)return false;
      m.vx=m.vz=m.lift=0;m.jumpTime=-1;m.jumpBuffer=0;
      if(a.kind==="ladder"){
        const l=a.ladder,d=a.down?.57:.34;
        if(a.approach<1){
          a.approach=Math.min(1,a.approach+dt/d);const f=ease(a.approach);
          p.x=mix(a.from.x,l.x,f);p.z=mix(a.from.z,l.z,f);p.y=mix(a.from.y,l.base+a.travel,f);
          p.yaw=a.from.yaw+turn(a.from.yaw,l.yaw)*f;a.blend=f;
        }else{
          const dir=controls.up-controls.down;a.stride=dir*(controls.fast?3.15:2.1);
          if(dir)a.dir=dir;a.travel=clamp(a.travel+a.stride*dt,0,a.top);a.t=a.travel/a.top;
          p.x=l.x;p.z=l.z;p.y=l.base+a.travel;p.yaw=l.yaw;
          if(dir<0&&a.travel<=0)this.finish(p,l.platform,{x:l.x,z:l.z,y:l.base});
          if(dir>0&&a.travel>=a.top){
            const end={x:l.topX,z:l.z,y:roofY},hands=[-1,1].map(s=>({x:l.lip,y:roofY+.045,z:l.z+s*(-Math.sin(l.yaw))*.22}));
            this.pull(p,end,"roof",l.yaw,hands);
          }
        }
      }else if(a.kind==="drop"){
        a.age+=dt;const f=clamp(a.age/a.flight,0,1),land=clamp((a.age-a.flight)/.24,0,1);
        a.t=.76*f+.24*land;a.blend=clamp(a.age/.13,0,1)*(1-ease(land));
        p.x=mix(a.from.x,a.end.x,ease(f));p.z=mix(a.from.z,a.end.z,ease(f));p.y=mix(a.fromY,a.toY,f*f);
        if(land>=1){this.finish(p,a.to,a.end);if(a.height>3)m.stumble=.31*Math.min(1,a.height/7);}
      }else{
        a.age+=dt;a.t=clamp(a.age/a.duration,0,1);const t=a.t,f=ease(t),vault=a.kind==="vault";
        const forward=vault?f:a.plant*ease(t/.27)+(1-a.plant)*ease((t-.35)/.65);
        p.x=mix(a.from.x,a.end.x,forward);p.z=mix(a.from.z,a.end.z,forward);
        p.y=vault?mix(a.fromY,a.toY,f)+(.37+.18*a.height)*Math.sin(Math.PI*t):mix(a.fromY,a.toY,ease((t-.10)/.74));
        p.yaw=a.from.yaw+turn(a.from.yaw,a.yaw)*ease(t/.27);
        a.blend=Math.min(1,t/.15,(1-t)/.14);a.grips=a.hands.map(h=>localGrip(p,h));
        if(t>=1)this.finish(p,a.to,a.end);
      }
      m.step(dt,0,0);return true;
    }
  }
  window.BayRooftops={Traversal,ladders,ledges,near,on,height,lightFloor,roofY,pentY};
})();
