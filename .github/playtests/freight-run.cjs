const assert=require("node:assert/strict");
const freightKeys=require("./freight-driver.cjs");

module.exports=async({js,send,tap,waitFor,snap})=>{
  await send("Page.reload");
  await waitFor("document.readyState==='complete'&&!!window.BayCanalTraffic?.Delivery");
  await js(`window.haulQA={held:new Set(),keys:${freightKeys.toString()}};
    const qa=haulQA,move=BayRescue.Service.prototype.step;
    BayRescue.Service.prototype.step=function(dt,env){qa.hero=env.hero;return move.call(this,dt,env);};
    const rebuild=BayLaneSpace.prototype.rebuild;
    BayLaneSpace.prototype.rebuild=function(cars,...args){
      if(!qa.spare){qa.traffic=cars;qa.spare=cars.find(v=>v.plate==='SOL 04');}
      return rebuild.call(this,cars,...args);
    };
    const step=BayCanalTraffic.Delivery.prototype.step;
    BayCanalTraffic.Delivery.prototype.step=function(dt,car,busy){
      qa.run=this;qa.driver=car;
      const result=step.call(this,dt,car,busy);
      if(result==='delivered')qa.paid=true;
      return result;
    };
    qa.write=keys=>{
      for(const k of new Set([...keys,...qa.held])){
        const down=keys.includes(k);
        if(down!==qa.held.has(k))dispatchEvent(new KeyboardEvent(down?'keydown':'keyup',{code:k,bubbles:true,cancelable:true}));
      }
      qa.held=new Set(keys);
    };
    qa.wallet=()=>JSON.parse(localStorage.getItem('sundownBay.v1')).wallet;
    document.querySelector('#play').click();`);
  await waitFor("qa.spare&&qa.hero");
  await js("Object.assign(qa.hero,BayDriving.world(qa.spare,-1.55,0));qa.start=qa.wallet()");
  await waitFor("document.querySelector('#context').textContent.includes('freight run')");
  await tap("KeyF");
  await waitFor("qa.run&&document.querySelector('#objectiveText').textContent.includes('Stepside')");
  await tap("KeyE");
  await waitFor("qa.driver===qa.spare");
  await js(`qa.timer=setInterval(()=>qa.write(qa.driver&&!qa.paid?qa.keys(qa.driver,qa.run,qa.traffic):[]),35)`);
  try{
    for(const [i,label] of ["pickup","receiving"].entries()){
      await waitFor(`qa.run.handling.berth===${i}&&BayCanalTraffic.lift(qa.spare)?.moving`,85000);
      assert.equal(await js("qa.wallet()===qa.start"),true);
      await snap("canal-player-"+label);
      if(i===0){
        await waitFor("qa.run.stop===1&&qa.spare.canalTicket.loaded");
        await waitFor("qa.spare.z>-93&&qa.spare.z<-62",20000);await snap("canal-player-loaded");
      }
    }
    await waitFor("qa.paid&&!qa.spare.canalTicket&&qa.wallet()===qa.start+125",18000);
    await waitFor("document.querySelector('#toast').textContent.includes('Delivery signed')");
    await snap("canal-player-paid");
  }catch(err){
    await snap("canal-player-stopped");
    throw Error(err.message+" "+await js("JSON.stringify({x:qa.spare.x,z:qa.spare.z,yaw:qa.spare.yaw,v:qa.spare.speed,phase:qa.run?.stop,state:qa.run?.handling,context:document.querySelector('#context').innerText})"));
  }finally{await js("clearInterval(qa.timer);qa.write([])");}
  assert.equal(await js("audioStarts+cursorRequests"),0);
  console.log("PASS accepted freight in the yard, entered the spare Stepside, drove both bays in live traffic, saw both hoists and received the saved $125 delivery fee.");
};
