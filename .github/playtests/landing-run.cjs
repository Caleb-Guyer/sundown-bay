const assert=require("node:assert/strict");

module.exports=async({js,waitFor,tap,snap,loadFootAt,book,service})=>{
  const origin=await js(book+".berth"),destination=1-origin;
  const table=async i=>js("BayLandingRun.waiting("+i+")");
  const start=await table(origin);
  await loadFootAt({...start,x:start.x+.66});
  await waitFor("document.querySelector('#context').innerText.includes('Carry the')");
  await tap("KeyF");await waitFor(book+".hearing.run.origin==="+origin);
  await snap("parcel");
  // Resume the saved errand at the boarding post. Let both characters board normally.
  await loadFootAt(await js("BayFirstCrossing.stop("+origin+")"));
  await js(`const serviceStep=BayFirstCrossing.Service.prototype.step;
    BayFirstCrossing.Service.prototype.step=function(...args){window.parcelBoat=this;return serviceStep.apply(this,args);};`);
  await waitFor("document.querySelector('#context').innerText.includes('Board Luz')");
  await tap("KeyF");
  await waitFor("window.parcelBoat?.rider?.phase==='sail'&&parcelBoat.regular.phase==='ride'",50000);
  assert.equal(await js("parcelBoat.regular.carrying"),true);await snap("commute");
  await waitFor("parcelBoat.rider.phase==='line'",95000);await tap("KeyF");
  await waitFor("!parcelBoat.rider&&"+book+".hearing.run.landed",35000);
  // Check a player who left the game after docking can finish at the receiving table.
  const end=await table(destination);await loadFootAt({...end,x:end.x+.73});
  await waitFor("document.querySelector('#context').innerText.includes('Hand back')");
  await tap("KeyF");await waitFor(book+".hearing.run.received["+destination+"]===1");
  assert.equal((await js(book)).hearing.run.origin,null);
  await snap("receipt");await tap("KeyF");assert.equal((await js(book)).hearing.run.received[destination],1);
  console.log("PASS On the Other Side",service,"parcel accepted, saved and reboarded, shared crossing, dockside handback and one receipt");
};
