const assert=require("node:assert/strict");

module.exports=async function interview({js,waitFor,tap,send,snap,book,aboard}){
  // Start from Mara's real map. Keep the temporary city fixtures inside the remote browser.
  await js(`{
    const draw=window.drawBayMap;
    window.drawBayMap=function(ctx,state){
      if(state.streetCar){recQA.coachCity=state;window.drawBayMap=draw;}
      return draw(ctx,state);
    };
  }`);
  await tap("Digit4");await waitFor("!!recQA.coachCity?.story?.coachTape");
  await js(`{
    const city=recQA.coachCity,t=city.story.coachTape,line=t.line,b=line.bus,v=city.streetCar;
    recQA.coachHome={x:v.x,z:v.z,yaw:v.yaw};recQA.coachRide=v;
    // Start both vehicles on a clear stretch south of the next berth. The chase uses the production car physics.
    for(const q of city.cars)if(q!==b&&q!==v&&Math.abs(q.x+141.5)<7&&q.z<-30&&q.z>-140)q.x+=24;
    Object.assign(v,{x:-141.5,z:-128,yaw:0});BayDriving.settle(v);
    Object.assign(line,{phase:'road',current:1,next:2,at:BayTransit.track.closest({x:-141.5,z:-111}),scan:0,space:100,offset:0,returning:null});
    Object.assign(b,BayTransit.track.sample(line.at));BayDriving.settle(b);b.door=0;
    line.autoDrive=function(dt,env){BayTransit.Line.prototype.autoDrive.call(this,dt,{...env,gap:()=>({space:1000}),safe:()=>true});};
    let down='';
    const input=code=>{
      if(code===down)return;
      if(down)dispatchEvent(new KeyboardEvent('keyup',{code:down,bubbles:true}));
      if(code)dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
      down=code;
    };
    function drive(){
      if(t.ready||line.phase!=='road'){input('');BayDriving.settle(v);return;}
      const speed=Math.max(0,b.speed+(b.z-v.z-12)*.72);
      input(v.speed<speed-.1?'KeyW':v.speed>speed+.4?'KeyS':'');requestAnimationFrame(drive);
    }
    drive();
  }`);
  await waitFor(book+".coachLead==='stop'",45000);
  const metres=await js("Math.round(recQA.coachRide.z+128)");
  assert(metres>12);await snap("six-road");
  await waitFor("recQA.coachCity.transit.docked(recQA.coachCity.transit.stop)",35000);
  await js(`{const l=recQA.coachCity.transit;delete l.autoDrive;
    Object.assign(recQA.coachRide,BayDriving.world(l.stop.berth,-3.8,1));BayDriving.settle(recQA.coachRide);}`);
  await waitFor("document.querySelector('#context').innerText.includes('Interview Marta')");
  await tap("KeyN");await waitFor("document.querySelector('#panelBody').innerText.includes('How many came off')");
  await snap("six-interview");await tap(aboard?"Digit1":"Digit2");
  await waitFor(book+".coachPending?.stop==='port'");
  const quote=await js(book+".coachPending");
  assert.equal(quote.morning,aboard?"aboard":"ashore");assert.equal(quote.bed.length,8);assert(!await js(book+".coachEdition"));
  console.log("PASS drove behind Coach 608 for",metres,"m, taped",quote.bed,"and interviewed Marta at Port Sol:",quote.question,quote.morning);
  await js("void Object.assign(recQA.coachRide,recQA.coachHome);BayDriving.settle(recQA.coachRide);");
  for(const type of ["keyDown","keyUp"])await send("Input.dispatchKeyEvent",{type,code:"KeyN",key:"N",modifiers:8,windowsVirtualKeyCode:78});
  await waitFor("!document.querySelector('#roadChoices').hidden");return quote;
};
