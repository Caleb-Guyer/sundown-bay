const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");
module.exports=async({js,send,waitFor,key,tap,errors,mode})=>{
  async function snap(name){
    if(!process.argv.includes("--frames"))return;
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:90});
    fs.writeFileSync(path.join(dir,mode+"-needle-"+name+".jpg"),Buffer.from(data,"base64"));
  }
  const stored=await js(`(()=>{const u=new BaySecondUnit.Unit();u.met=true;u.remember({x:-28,z:5.72,yaw:0},null);u.save();return localStorage.getItem("sundownBay.secondUnit.v1");})()`);
  const seed=await send("Page.addScriptToEvaluateOnNewDocument",{source:`localStorage.setItem("sundownBay.secondUnit.v1",${JSON.stringify(stored)});`});
  async function walkIn(){
    await send("Page.reload");await waitFor("document.readyState==='complete'&&typeof BayNeedleArt==='object'");
    await js(`window.proof={frames:0,flips:[false,false],hits:new Set(),banks:0,launches:0};
      const advance=BayNeedle.Table.prototype.step;
      BayNeedle.Table.prototype.step=function(...args){
        const prior=this.phase,old=this.score;
        advance.apply(this,args);const p=proof;p.table=this;p.flips[0]||=this.flippers[0]<-.23;p.flips[1]||=this.flippers[1]<-.23;
        for(let i=0;i<3;i++)if(this.pulse[i]>.01)p.hits.add(i);
        if(prior==="ready"&&this.phase==="live")p.launches++;
        if(p.autoRelease&&this.phase==="ready"&&this.held){
          const ticks=Math.round(this.charge*180/1.12);
          // Short plunges rattle the top arch. Later balls get a longer stroke.
          const release=p.first?[10,22,24,25,31,34,35,46,79,81,85,91,92,93,99,100,138,153,156].includes(ticks)||ticks>=159:ticks>=119;
          if(release){dispatchEvent(new KeyboardEvent("keyup",{code:"Space",bubbles:true}));p.autoRelease=false;}
        }
      };
      const art=BayNeedleArt.${mode==="street"?"world":"map"};BayNeedleArt.${mode==="street"?"world":"map"}=function(...a){proof.frames++;return art(...a);};
      document.querySelector("#play").click();`);
    await key("keyDown","KeyW");
    try{await waitFor("document.querySelector('#context').textContent.includes('Needle Drop')",40000);}
    finally{await key("keyUp","KeyW");}
    await waitFor("proof.frames>0");await snap("arcade");await tap("KeyF");
    await waitFor("!document.querySelector('#pinCab').hidden&&!!proof.table");
  }
  async function launch(first){
    const count=await js("proof.launches");
    await js("proof.first="+first+";proof.autoRelease=true");await key("keyDown","Space");
    await waitFor("!proof.autoRelease",25000);await key("keyUp","Space");
    await waitFor("proof.launches>"+count);
  }
  try{
    await walkIn();
    await key("keyDown","KeyA");await key("keyDown","KeyD");await waitFor("proof.flips.every(Boolean)");
    await key("keyUp","KeyA");await key("keyUp","KeyD");await waitFor("proof.table.flippers.every(v=>v>.39)");
    let sideId="",credits=1;
    for(let event=0;event<40;event++){
      await waitFor("['ready','pick','over'].includes(proof.table.phase)",120000);
      const phase=await js("proof.table.phase");
      if(phase==="ready"){await launch(!sideId);continue;}
      if(phase==="over"){
        if(sideId)break;
        assert(++credits<=3,"No complete bumper bank in three credits");
        await tap("Enter");await waitFor("proof.table.phase==='ready'");continue;
      }
      assert.equal(await js("proof.hits.size"),3);
      await waitFor("document.querySelector('#pinLabel').textContent==='CHOOSE A SIDE'");
      const original=await js("document.querySelector('#pinSong').textContent");
      await tap("KeyD");await waitFor("document.querySelector('#pinSong').textContent!=="+JSON.stringify(original));
      const song=await js("document.querySelector('#pinSong').textContent");
      if(!sideId)await snap("select");
      await tap("KeyF");await waitFor("proof.table.phase!=='pick'&&!!proof.table.side");
      assert.equal(await js("proof.table.side.title"),song);
      sideId=await js("proof.table.side.id");assert.equal(await js("BayNeedle.lastSide().id"),sideId);
      await waitFor("document.querySelector('#pinSleeve').dataset.track===proof.table.side.id");
    }
    assert(sideId);assert.equal(await js("proof.table.phase"),"over");
    const score=await js("BayNeedle.book().best");assert(score>=await js("proof.table.score"));assert(score>=1200);
    await snap("score");await tap("KeyE");await waitFor("document.querySelector('#pinCab').hidden");
    await walkIn();assert((await js("document.querySelector('#pinBest').textContent")).includes(score.toLocaleString("en-US")));
    assert.equal(await js("BayNeedle.lastSide().id"),sideId);
    await tap("KeyE");assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    console.log("PASS",mode,"walked from Tideway to the cabinet, used both flippers and the plunger, lit three distinct physical bumpers, selected a record, drained three balls and found the high score after reloading.",score);
  }catch(e){
    console.log("Pinball state",await js("JSON.stringify({hint:document.querySelector('#context').textContent,phase:proof.table?.phase,ball:proof.table?.ball,score:proof.table?.score,hits:[...proof.hits],at:proof.table?.body,launches:proof.launches,frames:proof.frames,call:document.querySelector('#pinCall').textContent})"));
    await snap("failure");throw e;
  }finally{await send("Page.removeScriptToEvaluateOnNewDocument",{identifier:seed.identifier});}
};
