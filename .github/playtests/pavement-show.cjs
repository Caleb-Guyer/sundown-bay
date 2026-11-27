module.exports=async function playProjection({js,tap,key,waitFor,snap,mode,route,selected,loadFootAt}){
  const v=await js("BayPavementShow.venues.find(v=>v.route==="+JSON.stringify(route)+")");
  const stored="JSON.parse(localStorage.getItem(BayPavementShow.key)||'{}')["+JSON.stringify(route)+"]";
  const assert=require("node:assert/strict");
  await tap("KeyH");
  await waitFor("document.querySelector('#speech strong').textContent==="+JSON.stringify(v.host));
  const sidewalk=route==="print"?[{x:5.15,z:50.15},{x:5.15,z:41.05},v.stand]:[{x:151.5,z:133.15},v.stand];
  await js(`window.boothQA={held:new Set(),legs:${JSON.stringify(sidewalk)}};
    const follow=BayCamera.prototype.update;
    BayCamera.prototype.update=function(...args){
      const out=follow.apply(this,args),q=boothQA,p=args[1];
      if(!q.legs.length)return out;
      if(Math.hypot(p.x-q.legs[0].x,p.z-q.legs[0].z)<.23)q.legs.shift();
      const close=!q.legs.length,leg=q.legs[0]||p;
      const dx=leg.x-p.x,dz=leg.z-p.z,c=Math.cos(this.yaw),s=Math.sin(this.yaw);
      const forward=dx*s+dz*c,side=dx*c-dz*s,threshold=Math.max(Math.abs(forward),Math.abs(side))*.42,want=new Set();
      if(!close){if(Math.abs(forward)>threshold)want.add(forward>0?'KeyW':'KeyS');if(Math.abs(side)>threshold)want.add(side>0?'KeyD':'KeyA');}
      for(const code of q.held)if(!want.has(code))dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}));
      for(const code of want)if(!q.held.has(code))dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}));
      q.held=want;return out;
    };`);
  await waitFor("boothQA.legs.length===0&&document.querySelector('#context').innerText.includes('slide projector')",35000);
  await tap("KeyF");await waitFor("document.querySelector('#mode').textContent==='At the projector'");
  await tap("Space");assert.equal(await js(stored+"||null"),null);
  await snap("slide-focus");await tap("KeyE");await waitFor("document.querySelector('#context').innerText.includes('slide projector')");
  await tap("KeyF");await waitFor("document.querySelector('#mode').textContent==='At the projector'");
  const pan=v.dir>0?"KeyD":"KeyA",focus=v.dir>0?"KeyS":"KeyW";
  await js(`const adjust=BayPavementShow.Operator.prototype.adjust;
    BayPavementShow.Operator.prototype.adjust=function(...a){
      const out=adjust.apply(this,a);boothQA.op=this;
      if(!boothQA.panReleased&&Math.abs(this.pan)<.025){boothQA.panReleased=true;dispatchEvent(new KeyboardEvent('keyup',{code:${JSON.stringify(pan)},bubbles:true}));}
      if(!boothQA.focusReleased&&Math.abs(this.focus)<.025){boothQA.focusReleased=true;dispatchEvent(new KeyboardEvent('keyup',{code:${JSON.stringify(focus)},bubbles:true}));}
      return out;
    };`);
  await key("keyDown",pan);await key("keyDown",focus);
  try{await waitFor("document.querySelector('#roadTurn').textContent.includes('In focus')",12000);}
  finally{await key("keyUp",pan);await key("keyUp",focus);}
  if(mode==="street")await js("const showLight=BayView.prototype.drawPrint;BayView.prototype.drawPrint=function(name,plate,...args){if(name==='slide/light')boothQA.screen=plate;return showLight.call(this,name,plate,...args);};");
  else await js("const drawShow=BayPavementShow.map;BayPavementShow.map=function(ctx,x,y,scale,v,p){if(p)boothQA.screen=p.canvas;return drawShow.apply(this,arguments);};");
  await tap("Space");await waitFor(stored+"?.frame==="+JSON.stringify(selected.frame));
  const print=await js(stored);assert.deepEqual(print,{...selected,zoom:1.8,cx:.74,cy:.28});
  try{await waitFor("document.querySelector('#speech strong').textContent==="+JSON.stringify(v.neighbors[0]),18000);}
  catch(error){throw Error("Audience reply at "+JSON.stringify(await js("({age:boothQA.op.age,reply:boothQA.op.reply,speech:document.querySelector('#speech').innerText,mode:document.querySelector('#mode').innerText})"))+". "+error.message);}
  await waitFor("!!boothQA.screen");
  await js("boothQA.slide=new Image();boothQA.slide.src="+stored+".image");
  await waitFor("boothQA.slide.naturalWidth>0");
  assert.equal(await js(`(()=>{
    const img=boothQA.slide,canvas=document.createElement('canvas');canvas.width=472;canvas.height=252;
    const ctx=canvas.getContext('2d'),w=Math.min(img.width,img.height*16/9)/1.8,h=w*9/16;
    ctx.drawImage(img,(img.width-w)*.74,(img.height-h)*.28,w,h,0,0,472,252);
    const a=ctx.getImageData(0,0,472,252).data,b=boothQA.screen.getContext('2d').getImageData(20,16,472,252).data;
    for(let i=0;i<a.length;i+=97)if(Math.abs(a[i]-b[i])>2)return false;
    return true;
  })()`),true,"the projected photograph matches the mounted crop");
  await snap("slide-show");
  await waitFor("document.querySelector('#context').innerText.includes('slide projector')",18000);
  const back=await js("new BayPavementShow.Shows().crowd("+JSON.stringify(v)+",20)[1]");
  await loadFootAt(back);await waitFor("document.querySelector('#context').innerText.includes("+JSON.stringify(v.neighbors[1])+")");
  await tap("KeyF");await waitFor("document.querySelector('#speech span').textContent===BayPavementShow.backRow("+stored+")");
  assert.deepEqual(await js(stored),print);
  await tap("KeyH");await waitFor("!document.querySelector('#voiceMeter').hidden");
  await tap("KeyE");await waitFor("document.querySelector('#voiceMeter').hidden");
  assert.equal(await js("localStorage.getItem(BaySecondVoice.key)"),null);
  await tap("KeyH");await waitFor("document.querySelector('#mode').textContent==='Field recorder'");
  // Read the deck's meter and send normal controls, including lifting the record key between lines.
  await js(`window.deckQA={};const turnDeck=BaySecondVoice.Take.prototype.step;
    BaySecondVoice.Take.prototype.step=function(...args){
      const out=turnDeck.apply(this,args);deckQA.take=this;
      if(deckQA.trim&&Math.abs(this.level()-.565)<.025){
        dispatchEvent(new KeyboardEvent('keyup',{code:deckQA.trim,bubbles:true}));deckQA.trim='';
      }return out;
    };
    const title=BaySecondVoice.Credits.prototype.atScreen;
    BaySecondVoice.Credits.prototype.atScreen=function(...a){const plate=title.apply(this,a);if(plate)deckQA.title=plate.canvas;return plate;};`);
  if(mode==="street")await js("const light=BayView.prototype.drawPrint;BayView.prototype.drawPrint=function(n,p,...a){if(n==='slide/light'&&p===deckQA.title)deckQA.shown=true;return light.call(this,n,p,...a);};");
  else await js("const light=BayPavementShow.map;BayPavementShow.map=function(g,x,y,s,v,p){if(p&&p.canvas===deckQA.title)deckQA.shown=true;return light.apply(this,arguments);};");
  await waitFor("!!deckQA.take");
  for(let line=0;line<2;line++){
    const trim=await js("deckQA.trim=deckQA.take.level()<.565?'KeyD':'KeyA'");
    await key("keyDown",trim);await waitFor("deckQA.trim===''",10000);await key("keyUp",trim);
    if(!line)await snap("second-voice-meter");
    await key("keyDown","Space");
    try{await waitFor("deckQA.take.beat>"+line,12000);}finally{await key("keyUp","Space");}
  }
  const words=await js("deckQA.take.words.join(' ')");await tap("KeyF");
  await waitFor("!!deckQA.shown&&document.querySelector('#voiceMeter').hidden",12000);
  await snap("second-voice-slide");
  const streetCase=await js("BayOutsideCopy.sites.find(s=>s.route==="+JSON.stringify(route)+")");
  await loadFootAt({x:streetCase.x-1.2,z:streetCase.z});
  await waitFor("document.querySelector('#context').innerText.includes('outside copy')");await tap("KeyF");
  await waitFor("document.querySelector('#panelBody').innerText.includes("+JSON.stringify(words)+")");
  assert.equal(await js("new BaySecondVoice.Credits().at["+JSON.stringify(route)+"].witness"),1);
  console.log("PASS The Second Voice",mode,v.name,"recorded two lines, projected the signed card and found the whole account at the window after reload");
  console.log("PASS walked from the case to the projector, focused and screened "+selected.frame+", heard both neighbors and reloaded the exact captioned crop at "+v.name);
};
