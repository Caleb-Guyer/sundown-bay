const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
const delay=ms=>new Promise(ok=>setTimeout(ok,ms));
module.exports=async({js,send,waitFor,key,tap,errors,mode,local})=>{
  const hooks=`window.tvFrames=new Set();BayCurbWire.paint=(base=>function(canvas,clip,time,...rest){const result=base.call(this,canvas,clip,time,...rest);if(canvas.width===128)tvFrames.add(clip.id+"/"+Math.floor(time*6));return result;})(BayCurbWire.paint);
    window.drawBayMap=(base=>function(c,o){if(o.mode==="radar"){window.news=o.curbWire;window.me=o.player;window.v=o.streetCar;}return base(c,o);})(window.drawBayMap);
    BayCamera.prototype.update=(base=>function(...args){const r=base.apply(this,args);window.head=this.yaw;return r;})(BayCamera.prototype.update);
    window.decisions=[];BayCurbWire.Column.prototype.finish=(base=>function(){const s=this.shot,r=base.call(this);if(s)decisions.push([s.by,s.age,s.frames.length,s.path,s.near,s.far,s.after,s.maxSpeed,s.called,s.impact,s.minute,s.night,s.rain,s.street,!!r]);return r;})(BayCurbWire.Column.prototype.finish);window.pass=[];BayCurbWire.Column.prototype.step=(base=>function(dt,v,e){if(v&&this.shot&&this.shot.sample<=dt)pass.push([v.x,v.z,v.yaw]);return base.call(this,dt,v,e);})(BayCurbWire.Column.prototype.step);`;
  const held=new Set();
  async function controls(list){for(const k of held)if(!list.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of list)if(!held.has(k)){await key("keyDown",k);held.add(k);}}
  async function walk(x,z,radius=.55){
    const end=Date.now()+36000;while(Date.now()<end){const p=await js("({x:me.x,z:me.z,h:head})"),dx=x-p.x,dz=z-p.z,d=Math.hypot(dx,dz);
      if(d<radius){await controls([]);return;}const f=dx*Math.sin(p.h)+dz*Math.cos(p.h),s=dx*Math.cos(p.h)-dz*Math.sin(p.h),k=[];
      if(Math.abs(f)>.32*d)k.push(f>0?"KeyW":"KeyS");if(Math.abs(s)>.32*d)k.push(s>0?"KeyD":"KeyA");await controls(k);await delay(40);}
    throw Error("Walk from "+JSON.stringify(await js("[me.x,me.z]"))+" to "+[x,z]);
  }
  async function button(name){const q="[...document.querySelectorAll('#panelBody button')].find(b=>b.querySelector('strong')?.textContent==="+JSON.stringify(name)+")";
    await waitFor("!!"+q,7000);await js(q+".click()");}
  async function snap(name){if(!process.argv.includes("--frames"))return;const pic=await send("Page.captureScreenshot",{format:"jpeg",quality:90});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,(local?"local-":"live-")+mode+"-"+name+".jpg"),Buffer.from(pic.data,"base64"));}
  try{
    assert(await js("[...document.querySelectorAll('#panelBody option')].some(o=>o.textContent==='Bay Wire · Curb desk')"));
    await js(hooks+"document.querySelector('#closePanel').click()");await waitFor("window.news&&Number.isFinite(window.head)");
    await walk(154.2,-17.1,1.9);await tap("KeyF");await button("Take Meli’s shot list");await waitFor("news.book.list");await tap("Escape");
    await walk(151.6,-23.5);await tap("KeyE");await waitFor("v&&me.driving");await tap("KeyH");
    await waitFor("!!news.shot?.called");await snap("witness");await controls(["KeyW"]);await waitFor("news.book.clips.length>0||decisions.length>0",16000);assert(await js("news.book.clips.length>0"),JSON.stringify(await js("({decisions,x:v.x,z:v.z})")));
    await controls(["KeyS"]);await waitFor("Math.abs(v.speed)<2",10000);await controls([]);
    const captured=await js("news.book.clips[0]");assert.equal(captured.type,"pass");assert(captured.called);assert.equal(await js("news.book.edits.pass.id"),captured.id);
    assert(await js("news.book.clips[0].frames.every(f=>pass.some(p=>Math.hypot(p[0]-f[1][0],p[1]-f[1][2])<.06))"));
    await tap("KeyJ");await button("On the Curb · Bay Wire");await waitFor("!!document.querySelector('.curb-film')");
    await js("document.querySelector('.curb-transport button').click()");
    async function seek(f){
      return js("(()=>{const b=document.querySelector('.curb-transport input');b.value=Number(b.max)*"+f+";b.dispatchEvent(new Event('input'));const c=document.querySelector('.curb-film');return c.toDataURL('image/jpeg',.6);})()");
    }
    const a=await seek(.12),b=await seek(.77);assert(a.length>3000&&b.length>3000&&a!==b,"scrub paints different views of the recorded take");await snap("replay");
    await send("Page.reload");await waitFor("typeof BayCurbWire==='object'&&document.readyState==='complete'");
    await js(hooks+"document.querySelector('#play').click()");await waitFor("window.news?.book.cover?.id==="+captured.id);
    await walk(154.15,-17.1,1.9);await waitFor("tvFrames.size>=2",12000);await snap("television");await tap("KeyF");await waitFor("document.querySelector('#panelTitle').textContent==='On the Curb'");
    assert.equal(await js("news.book.edits.pass.by"),captured.by);await tap("Escape");
    assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
    console.log("PASS",local?"local":"live",mode,"walked to Meli, called a shot, recorded",captured.frames.length,"real car samples, scrubbed two different images and saw the take playing on the curbside TV after reload. Zero audio or cursor requests.");
  }finally{await controls([]);}
};
