const assert=require("node:assert/strict");
module.exports=async({js,send,tap,key,waitFor,shot,mode})=>{
  const file="JSON.parse(localStorage.getItem('sundownBay.marlinCalls.v1'))",hint="document.querySelector('#context').textContent";
  await js(`window.morningQA={};const call=morningQA,step=BayRescue.Service.prototype.step;
    BayRescue.Service.prototype.step=function(dt,e){call.hero=e.hero;return step.apply(this,arguments);};true`);
  await waitFor("morningQA.hero");await js("Object.assign(morningQA.hero,BayMarlinRoom.outside);true");
  await waitFor(hint+".includes('Room 14')");await tap("KeyF");
  await key("keyDown","KeyW");
  try{await waitFor(hint+".includes('Set the alarm')",14000);}finally{await key("keyUp","KeyW");}
  await tap("KeyF");
  const button=label=>"Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.textContent.includes("+JSON.stringify(label)+"))";
  await waitFor("!!("+button("Breakfast")+")");await js(button("Breakfast")+".click();true");
  await waitFor(hint+".includes('wake-up call')");assert.equal(await js(file+".message"),"issue");
  await js("window.beforeWakeReload=true");await send("Page.reload");
  await waitFor("!window.beforeWakeReload&&document.readyState==='complete'&&typeof BayMarlinRoom==='object'");
  await js("document.querySelector('#play').click();true");await waitFor(hint+".includes('wake-up call')");
  await tap("KeyF");await waitFor("document.querySelector('#speech').textContent.includes('little television')");
  await shot("receiver");
  if(mode==="overhead"){
    await tap("KeyE");await waitFor(file+".ring===false");assert.equal(await js(file+".message"),"issue");
    // Walk from the head of the bed to the writing desk, then collect Bea's slip.
    await js(`const map=BayMarlinRoom.map;BayMarlinRoom.map=function(ctx,r){window.phoneRoom=r;return map.apply(this,arguments);};true`);
    await waitFor("window.phoneRoom");await js("Object.assign(phoneRoom,BayMarlinRoom.points.desk);true");
    await waitFor(hint+".includes('desk')");await tap("KeyF");
    await waitFor("!!("+button("Bea’s telephone slip")+")");await js(button("Bea’s telephone slip")+".click();true");
  }else await tap("KeyF");
  await waitFor(file+".mark==='issue'");assert.equal(await js(file+".message"),null);
  assert.equal(await js("audioStarts+cursorRequests"),0);
  console.log("PASS Room 14",mode,"breakfast alarm, same-room reload, original call about the printed edition and a saved city address");
};
