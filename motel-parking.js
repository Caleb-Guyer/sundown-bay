/* Room 14's guest permit belongs to one of the existing cars in the city fleet. */
(() => {
  "use strict";
  const bay={x:133.75,z:-36.4,yaw:0,kind:"parking",name:"Room 14 guest parking"};
  const key="sundownBay.guestParking.v1",halfWidth=1.68,halfLength=3.42;
  const stop={x:bay.x,z:bay.z+halfLength+.12,w:1.70,d:.21,top:.27,bottom:0,streetProp:true};
  function inside(v){
    if(!v||!v.garageKey)return false;
    const shape=bayCarLayout(v.kind),sn=Math.abs(Math.sin(v.yaw)),cs=Math.abs(Math.cos(v.yaw));
    return Math.abs(v.x-bay.x)+cs*(shape.track+.12)+sn*shape.halfLength<=halfWidth+.10&&
      Math.abs(v.z-bay.z)+cs*shape.halfLength+sn*(shape.track+.12)<=halfLength+.10;
  }
  function read(fleet){
    try{
      const raw=JSON.parse(localStorage.getItem(key)||"null"),v=fleet.find(v=>v.garageKey===raw?.id);
      if(!v||![raw.x,raw.z,raw.yaw].every(Number.isFinite)||
        (Math.abs(raw.x)>230||Math.abs(raw.z)>190)&&!BayCut.land(raw.x,raw.z))return null;
      const flatSide=[-1,1].includes(raw.flatSide)?raw.flatSide:0;
      const flatAxle=flatSide?bayCarLayout(v.kind).axles.find(axle=>(axle>0)===(raw.flatAxle>0)):null;
      return {v,x:raw.x,z:raw.z,yaw:Math.atan2(Math.sin(raw.yaw),Math.cos(raw.yaw)),flatSide,flatAxle};
    }catch{return null;}
  }
  function write(v,replace=false){
    if(!v?.garageKey)return;
    try{
      if(!replace&&JSON.parse(localStorage.getItem(key)||"null")?.id!==v.garageKey)return;
      localStorage.setItem(key,JSON.stringify({id:v.garageKey,x:v.x,z:v.z,yaw:v.yaw,flatSide:v.flatSide||0,flatAxle:v.flatAxle??null}));
    }catch{}
  }
  function release(v){
    try{if(JSON.parse(localStorage.getItem(key)||"null")?.id===v.garageKey)localStorage.setItem(key,"null");}catch{}
  }
  function install(model){
    model("marlin-parking",g=>{
      const stripe=(x,z,w,d,color)=>g.quad([x-w/2,.092,z-d/2],[x+w/2,.092,z-d/2],[x+w/2,.092,z+d/2],[x-w/2,.092,z+d/2],color);
      for(const side of [-1,1]){
        stripe(side*halfWidth,0,.078,2*halfLength,"#dbd1aa");
        stripe(side*(halfWidth-.31),-halfLength,.70,.085,"#d7cba5");
      }
      stripe(0,halfLength,2*halfWidth,.078,"#d7cba5");
      // Stencilled 14 at the head of the space. The gaps are the stencil bridges.
      const paint="#e7d5a7",z=2.54;
      stripe(-.34,z,.11,.70,paint);stripe(-.405,z+.28,.24,.092,paint);
      stripe(.16,z+.18,.093,.35,paint);stripe(.36,z,.10,.70,paint);stripe(.25,z-.032,.32,.083,paint);
      g.box(0,.18,halfLength+.12,1.70,.18,.21,"#beb79f");g.box(-.61,.282,halfLength+.12,.23,.03,.12,"#cf9d68");
      g.box(.61,.282,halfLength+.12,.23,.03,.12,"#cf9d68");
    });
  }
  function map(ctx,px,py,scale){
    ctx.save();ctx.translate(px(bay.x),py(bay.z));ctx.scale(scale,scale);
    ctx.strokeStyle="#e5d6aa";ctx.lineWidth=.095;ctx.strokeRect(-halfWidth,-halfLength,2*halfWidth,2*halfLength);
    ctx.fillStyle="#c1b497";ctx.fillRect(-.85,-halfLength-.23,1.70,.19);
    ctx.fillStyle="#f2dfa8";ctx.textAlign="center";ctx.font="bold .77px sans-serif";ctx.fillText("14",0,-2.25);ctx.restore();
  }
  window.BayMotelParking={bay,stop,inside,read,write,release,install,map};
})();
