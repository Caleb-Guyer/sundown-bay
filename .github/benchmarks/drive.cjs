const assert=require("node:assert/strict");
module.exports=async({js,tap,waitFor,mode})=>{
  await js(`const driveKeys=(${require("../playtests/coast-driver.cjs").toString()});window.pair={};
    const draw=drawBayMap;window.drawBayMap=function(c,s){if(s.mode==='radar')pair.map=s;return draw(c,s);};
    const step=BayRescue.Service.prototype.step;BayRescue.Service.prototype.step=function(dt,e){pair.hero=e.hero;return step.apply(this,arguments);};true`);
  await waitFor("Boolean(pair.hero&&pair.map)");
  await js("Object.assign(pair.hero,BayExposure.pickup);true");await waitFor("document.querySelector('#context').innerText.includes('Last Exposure')");await tap("KeyF");
  await waitFor("pair.map.story?.phase==='pickup'");await js("Object.assign(pair.hero,{x:147.6,z:-22.6});true");await tap("KeyE");
  await waitFor("pair.map.story?.progress===1&&!document.getElementById('chapterFilm').hidden",35000);await tap("Enter");
  await waitFor("document.getElementById('chapterFilm').hidden&&Boolean(pair.map.streetCar)");
  await js(`const v=pair.map.streetCar;
    const place=BayCoastCup.sample(38,1.7);Object.assign(v,{x:place.x,z:place.z,yaw:0});BayDriving.settle(v);
    pair.start=[v.x,v.z];true`);
  await tap("Escape");
  await js("Array.from(document.querySelectorAll('#panelBody button')).find(b=>b.innerText.includes('One-minute frame check')).click()");
  await waitFor("document.getElementById('panel').hidden");
  await js(`const memory={cruise:true},held=new Set();pair.blocks=new Set();
    function driver(t){const map=pair.map;
      if(!map.streetCar){pair.lost=true;return;}
      pair.blocks.add(Math.floor(v.x/36)+','+Math.floor(v.z/36));
      const want=new Set(pair.stop?[]:driveKeys({...map,coastCup:{phase:'race',clock:t/1000}},memory));
      for(const k of held)if(!want.has(k)){dispatchEvent(new KeyboardEvent('keyup',{code:k}));held.delete(k);}
      for(const k of want)if(!held.has(k)){dispatchEvent(new KeyboardEvent('keydown',{code:k}));held.add(k);}
      if(!pair.stop)requestAnimationFrame(driver);
    }requestAnimationFrame(driver);true`);
  const row="JSON.parse(localStorage.getItem('sundownBay.frameCheck.v1')||'{}')["+JSON.stringify(mode==="street"?"Street drive":"Overhead drive")+"]";
  try{await waitFor("pair.lost||Boolean("+row+")",100000);}finally{await js("pair.stop=true");}
  assert(!await js("pair.lost"));const sample=await js(row),blocks=await js("pair.blocks.size");
  assert(sample.seconds>=60&&sample.metres>120&&blocks>=4);return {...sample,blocks};
};
