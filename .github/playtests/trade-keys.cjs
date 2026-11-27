const assert=require("node:assert/strict");

// Continue the real Ocean Drive race after its save has reloaded. Fixtures position the
// returning player at the bay and light. The car, handover, clock and ghosts use the game.
module.exports=async function tradeKeys({js,send,waitFor,tap,key,snap,mode}){
  const record="JSON.parse(localStorage.getItem('sundownBay.v1')).green.cards.ocean";
  const card=await js(record);
  assert(card.pace.frames.length>12);assert.equal(card.pace.frames.at(-1)[0],Math.round(card.best*1000));
  await js(`window.loanQA={draws:0};
    const streetGhost=BayView.prototype.drawGhost;
    BayView.prototype.drawGhost=function(model,...args){if(club.trade?.ghost)loanQA.draws++;return streetGhost.call(this,model,...args);};
    const overheadMap=window.drawBayMap;window.drawBayMap=function(ctx,o){
      const ghost=o.green?.trade?.ghost;
      if(o.mode==='street'&&ghost){const previous=ctx.fill;ctx.fill=function(){if(this.globalAlpha>.45&&this.globalAlpha<.47)loanQA.draws++;return previous.apply(this,arguments);};
        try{return overheadMap(ctx,o);}finally{ctx.fill=previous;}}
      return overheadMap(ctx,o);
    };
    const actor=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){loanQA.hero=e.hero;return actor.call(this,dt,e);};
    BayDriving.settle(ride);true`);
  await waitFor("!!loanQA.hero");
  await tap("KeyE");await waitFor("!window.ride",22000);
  await js("void Object.assign(loanQA.hero,BayDriving.world(site.v,-1.65,-.2))");
  await waitFor("document.querySelector('#context').innerText.includes('Borrow SURF 13')");
  await tap("KeyE");await waitFor("ride===site.v&&!!ride.owner.loan",35000);
  assert.equal(await js("document.querySelector('#stars').getAttribute('aria-label')"),"No heat");
  await snap("trade-keys");
  await js(`{
    const r=site.route;
    for(const q of traffic)if(q!==ride&&Math.abs(q.x-r.grid.x)<7.5&&q.z>=r.grid.z-5&&q.z<68)q.x-=25;
    Object.assign(ride,r.grid);BayDriving.settle(ride);
  }`);
  await waitFor("document.querySelector('#context').innerText.includes('Race your')");
  await tap("KeyH");await waitFor("club.trade?.phase==='armed'");
  await waitFor("club.trade?.phase==='running'",85000);
  await key("keyDown","KeyW");
  try{
    await waitFor("loanQA.draws>0&&club.trade?.index>1",18000);
    await snap("trade-pace");
    await waitFor(record+".trade?.laps===1",25000);
  }finally{await key("keyUp","KeyW");}
  const timed=await js(record);assert.equal(timed.best,card.best);assert.equal(timed.trade.pending.plate,card.slip.plate);
  assert(timed.trade.last>1&&timed.trade.last<40);assert.equal(timed.runs,card.runs);
  await js("Object.assign(ride,site.route.home);BayDriving.settle(ride);true");
  await tap("KeyE");await waitFor("!ride",22000);
  await js("void Object.assign(loanQA.hero,BayDriving.world(site.v,0,8))");
  await waitFor("document.querySelector('#chapterTitle').textContent==='Both Sides of the Slip'",35000);
  await snap("trade-handback");
  await waitFor("document.querySelector('#chapterInsert').getAttribute('aria-label')?.startsWith('Lena Ríos’s visor')&&!document.querySelector('#chapterInsert').hidden");
  await snap("trade-visor");await tap("Enter");
  await waitFor("document.querySelector('#chapterFilm').hidden&&site.v.owner.phase==='drive'");
  await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayOnGreen==='object'");
  const restored=await js("BayOnGreen.read(("+record.replace(".cards.ocean","")+")).cards.ocean");
  assert.deepEqual(restored.trade.returned,timed.trade.pending);assert(!restored.trade.pending);
  assert.deepEqual(restored.pace,card.pace);
  console.log("PASS",mode,"Trade Keys returned SURF 13 in",timed.trade.last.toFixed(2),"s against",card.best.toFixed(2),"s. Real pace car painted, owner back in the seat, signed pair saved.");
};
