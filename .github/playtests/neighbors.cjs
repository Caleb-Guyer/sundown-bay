const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path");

// Plan short sidewalk legs around the street geometry returned by the map. Only
// keyboard input moves the player. A moving runner can change our target each leg.
function nextStep(at,target,r,map){
  const {solids,cars}=map,scale=.8;
  const blockers=solids.filter(o=>Math.abs(o.x-at.x)<65+o.w/2&&Math.abs(o.z-at.z)<90+o.d/2);
  const vehicles=cars.filter(o=>Math.abs(o.x-at.x)<65&&Math.abs(o.z-at.z)<90);
  const clear=(x,z)=>!blockers.some(o=>Math.abs(x-o.x)<o.w/2+.51&&Math.abs(z-o.z)<o.d/2+.51)
    &&!vehicles.some(o=>Math.abs(x-o.x)<5&&Math.abs(z-o.z)<5&&BayDriving.clearance(o,{x,z})<.43);
  const dist=(x,z)=>Math.hypot(target.x-x,target.z-z);
  const open=[{i:0,j:0,x:at.x,z:at.z,cost:0,score:dist(at.x,at.z),prev:null}],best=new Map([["0:0",0]]);
  for(let n=0;n<2100&&open.length;n++){
    let idx=0;for(let i=1;i<open.length;i++)if(open[i].score<open[idx].score)idx=i;
    const node=open[idx];open[idx]=open.at(-1);open.pop();
    if(node.prev&&dist(node.x,node.z)<r){
      let q=node;while(q.prev?.prev&&Math.hypot(q.x-at.x,q.z-at.z)>2.55)q=q.prev;
      // Tight corners require keeping the first bend rather than cutting the diagonal.
      while(q.prev?.prev&&(!clear(at.x+(q.x-at.x)/2,at.z+(q.z-at.z)/2)||!clear(at.x+(q.x-at.x)*.75,at.z+(q.z-at.z)*.75)))q=q.prev;
      return q;
    }
    for(const [di,dj] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,-1],[1,-1],[-1,1]]){
      const i=node.i+di,j=node.j+dj,x=at.x+i*scale,z=at.z+j*scale,id=i+":"+j,cost=node.cost+Math.hypot(di,dj)*scale;
      if(cost>=(best.get(id)??Infinity)||!clear(x,z)||di&&dj&&(!clear(node.x,z)||!clear(x,node.z)))continue;
      best.set(id,cost);open.push({i,j,x,z,cost,score:cost+dist(x,z)*1.14,prev:node});
    }
  }
  return target;
}
module.exports=async({js,send,key,tap,waitFor,mode,errors})=>{
  const pause=ms=>new Promise(ok=>setTimeout(ok,ms)),held=new Set();
  const hooks=`
    window.nav=({nextStep:${nextStep.toString()}});window.seenGestures=[];
    window.photoOnTV=false;window.streetScreen=false;
    const photos=BayNeighborhoodEdition;window.BayNeighborhoodEdition={...photos,paint(c,id){
      if(c.width===128&&id==='bib')window.photoOnTV=true;return photos.paint(c,id);
    }};
    const screen=BayCurbDeskArt;window.BayCurbDeskArt={...screen,
      screen(...a){if(photoOnTV)window.streetScreen=true;return screen.screen(...a);},
      mapScreen(...a){if(photoOnTV)window.streetScreen=true;return screen.mapScreen(...a);}};
    const paint=window.drawBayMap;window.drawBayMap=function(ctx,o){if(o.mode==='radar')nav.map=o;return paint(ctx,o);};
    const advance=BayNeighbors.Block.prototype.step;BayNeighbors.Block.prototype.step=function(t,at,...rest){
      nav.block=this;nav.at={x:at.x,z:at.z};return advance.call(this,t,at,...rest);
    };
    const cam=BayCamera.prototype.update;BayCamera.prototype.update=function(...a){const r=cam.apply(this,a);nav.yaw=this.yaw;return r;};
    const art=BayNeighborGestures,watch=(kind,e)=>{if(e?.age>.13&&e.age<e.duration&&!seenGestures.includes(kind+':'+e.kind))seenGestures.push(kind+':'+e.kind);};
    window.BayNeighborGestures={...art,pose(m,p,a,e){watch('mesh',e);return art.pose(m,p,a,e);},
      map(c,x,y,k,a,e){watch('map',e);return art.map(c,x,y,k,a,e);},
      mapDriver(c,x,y,k,a,e,...rest){watch('window',e);return art.mapDriver(c,x,y,k,a,e,...rest);},
      cockpit(r,a,v,e){watch('cab',e);return art.cockpit(r,a,v,e);}};
  `;
  const storage="sundownBay.neighbors.guest.";
  async function keys(codes){
    for(const k of held)if(!codes.includes(k)){await key("keyUp",k);held.delete(k);}
    for(const k of codes)if(!held.has(k)){await key("keyDown",k);held.add(k);}
  }
  async function snapshot(label){
    if(!process.argv.includes("--frames"))return;
    const {data}=await send("Page.captureScreenshot",{format:"jpeg",quality:87});
    const dir=path.join(__dirname,"curb-wire-proof");fs.mkdirSync(dir,{recursive:true});
    fs.writeFileSync(path.join(dir,mode+"-"+label+".jpg"),Buffer.from(data,"base64"));
  }
  async function approach(id,r=3.45){
    const end=Date.now()+125000;let state;
    while(Date.now()<end){
      state=await js(`(()=>{const b=nav.block,to=${id==="stall"?"b.places.meli":"b.byId("+JSON.stringify(id)+")"},p=nav.at,h=nav.yaw;
        const remaining=Math.hypot(to.x-p.x,to.z-p.z);
        if(remaining<${r})return {done:true};
        const q=nav.nextStep(p,to,${r*.90},nav.map),dx=q.x-p.x,dz=q.z-p.z;
        return {f:dx*Math.sin(h)+dz*Math.cos(h),s:dx*Math.cos(h)-dz*Math.sin(h),d:Math.hypot(dx,dz),remaining,p,to:[to.x,to.z]};})()`);
      if(state.done){await keys([]);return;}
      const {s,f,d}=state,codes=[];if(Math.abs(f)>d*.33)codes.push(f>0?"KeyW":"KeyS");if(Math.abs(s)>d*.33)codes.push(s>0?"KeyD":"KeyA");
      if(state.remaining>14)codes.push("ShiftLeft");await keys(codes);await pause(65);
    }
    throw Error("Walk to "+id+" stalled "+JSON.stringify(state));
  }
  async function hello(id){
    await approach(id);await tap("KeyN");await waitFor("nav.block.chat?.p.neighbor.id==="+JSON.stringify(id),7000);
  }
  async function check(k,v){await waitFor("localStorage.getItem("+JSON.stringify(storage+k)+")==="+JSON.stringify(v),11000);}
  try{
    await js(hooks);await waitFor("nav.map&&nav.at&&Number.isFinite(nav.yaw)");
    await tap("KeyE");await waitFor("nav.map.player.driving&&document.querySelector('#context').innerText.includes('Meli')",45000);
    await tap("KeyN");await check("meli.met","1");await waitFor("seenGestures.includes('"+(mode==="street"?"mesh":"window")+":driver')",12000);
    if(mode==="street"){await tap("KeyZ");await tap("KeyN");await waitFor("seenGestures.includes('cab:driver')",20000);await tap("KeyZ");}
    await tap("KeyE");await waitFor("!nav.map.player.driving");await hello("meli");
    await tap("Digit1");await check("meli.tip","1");await waitFor("seenGestures.includes('"+(mode==="street"?"mesh":"map")+":point')",20000);
    await snapshot("point");await approach("stall",1.60);await check("meli.visited","1");
    await hello("meli");await tap("Digit2");await check("bib","1");
    await hello("marisol");await tap("Digit2");await check("bib","2");
    await hello("meli");await tap("Digit2");await check("bib","3");
    await waitFor("photoOnTV&&streetScreen",25000);await snapshot("reply");
    await tap("KeyJ");const card="[...document.querySelectorAll('#panel button')].find(b=>b.textContent.includes('Word of mouth'))";
    await waitFor(card);await js(card+".click()");await waitFor("document.querySelector('#panelBody').innerText.includes('forty-one')");
    const print="document.querySelector('.wire-archive canvas')",pixels="Array.from("+print+".getContext('2d').getImageData(0,0,576,384).data)";
    assert(await js("new Set("+pixels+".filter((_,i)=>i%4===0)).size>35"));
    const original=await js(print+".toDataURL()");await snapshot("contacts");assert.deepEqual(errors,[]);assert.equal(await js("audioStarts+cursorRequests"),0);
    await send("Page.reload");await check("bib","3");await check("meli.visited","1");await js("document.querySelector('#play').click()");await tap("KeyJ");
    await waitFor(card);await js(card+".click()");await waitFor("document.querySelector('#panelBody').innerText.includes('forty-one')");
    assert.equal(await js(print+".toDataURL()"),original);
    assert.equal(await js("audioStarts+cursorRequests"),0);assert.deepEqual(errors,[]);
    console.log("PASS live",mode,"greeted Meli from the starter coupe and on foot, saw her point, visited Cora, carried the runner’s answer back and found the corrected bulletin after reload.");
  }finally{await keys([]);}
};
