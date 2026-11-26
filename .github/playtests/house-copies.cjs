const assert=require("node:assert/strict");
module.exports=async({js,send,tap,waitFor,shot,mode} )=>{
  const file="JSON.parse(localStorage.getItem('sundownBay.v1')).houseCopies";
  const button=label=>"Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.textContent.includes("+JSON.stringify(label)+"))";
  async function observe(){
    await js(`window.deliveryQA={};const d=deliveryQA;
      const rescue=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){d.h=e.hero;return rescue.apply(this,arguments);};
      const crowd=BayLocals.animatePeople;BayLocals.animatePeople=function(w,t,v,cars){d.car=v;d.cars=cars;return crowd.apply(this,arguments);};
      for(const [id,i] of [['draw',2],['map',1]]){const f=BayMarlinRoom[id];BayMarlinRoom[id]=function(){d.room=arguments[i];return f.apply(this,arguments);};}
      const toss=BayHouseCopies.step;BayHouseCopies.step=function(p){d.paper=p;return toss.apply(this,arguments);};
      const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(){d.cam=this;return cam.apply(this,arguments);};
      true`);
  }
  async function watch(condition,timeout=22000){
    try{await waitFor(condition,timeout);}catch(e){
      console.log("Playtest state",await js(`JSON.stringify({mode:document.querySelector('#mode').textContent,hint:document.querySelector('#context').textContent,
        hero:d.h&&[d.h.x,d.h.z],car:d.car&&[d.car.x,d.car.z,d.car.speed],paper:d.paper&&[d.paper.endX,d.paper.endZ,d.paper.rev],record:(${file})})`));throw e;
    }
  }
  await observe();await watch("d.h&&d.room");await js("Object.assign(d.room,BayMarlinRoom.points.door);true");await tap("KeyF");
  await js("Object.assign(d.h,BayCurbWire.desk.stand);true");await watch("document.querySelector('#context').textContent.includes('curb desk')");
  await tap("KeyF");await watch("!!("+button("House Copies")+")");await js(button("House Copies")+".click();true");await watch(file+".run?.mask===0");
  await watch("d.cars?.length");await js("BayDriving.settle(d.cars[0]);Object.assign(d.cars[0],{x:149,z:-22.8,yaw:-.015});Object.assign(d.h,{x:151,z:-27});true");
  await tap("KeyE");await watch("d.car===d.cars[0]");
  await js(`BayDriving.settle(d.car);Object.assign(d.car,{x:144,z:12,yaw:0,speed:7,vz:7});
    const event=(type,code)=>dispatchEvent(new KeyboardEvent(type,{code,bubbles:true}));
    event('keydown','KeyW');requestAnimationFrame(function pace(){
      if(!d.car){event('keyup','KeyW');return;}
      if(d.car.z+d.car.vz*.76*.76<25.65){requestAnimationFrame(pace);return;}
      event('keydown','KeyB');event('keyup','KeyB');event('keyup','KeyW');
    });true`);
  await watch(file+".run?.mask===1");assert((await js(file+".run.points"))>=80);
  await shot("paper-route");
  await js("window.deliveryReload=true");await send("Page.reload");
  await waitFor("!window.deliveryReload&&document.readyState==='complete'&&typeof BayHouseCopies==='object'");
  await js("document.querySelector('#play').click();true");await observe();await watch("d.h&&d.cars?.length");
  assert.equal(await js(file+".run.mask"),1);
  if(await js("!!d.car")){await tap("KeyE");await watch("document.querySelector('#mode').textContent==='On foot'&&!d.car");}
  await js("Object.assign(d.h,{x:136.6,z:-45.5,yaw:-Math.PI/2});d.cam?.reset(d.h);true");
  await tap("KeyB");await watch(file+".last&&"+file+".runs===1");
  const end=await js(file+".last");assert(end.edition&&end.pay>=110&&end.score>=145);
  await watch("d.paper&&d.paper.age>=.56");
  await js("Object.assign(d.h,{x:138.1,z:-45.7,yaw:-Math.PI/2});d.cam?.reset(d.h);true");await shot("lobby-copies");
  assert.equal(await js("audioStarts+cursorRequests"),0);
  console.log("PASS House Copies",mode,"Meli's edition collected on foot, rolling delivery at the Palm, saved satchel after reload, Marlin handoff and pay",end);
};
