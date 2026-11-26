/* Compare the simulated GPU index buffer with a fresh city list after each camera move. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
global.window=global;
for(const file of JSON.parse(fs.readFileSync(path.join(root,"index.html"),"utf8").match(/id="game-sources">([\s\S]+?)<\/script>/)[1])){
  if(file==="game.js")break;
  const code=fs.readFileSync(path.join(root,file),"utf8");
  vm.runInThisContext(file==="render.js"?code.replace("window.BayView=View;","window.BayView=View;window.CityIndicesForTest=CityIndexList;"):code,{filename:file});
}
let bound,actual=0,full=0,drawn=0;
const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,UNSIGNED_INT:4,UNSIGNED_SHORT:2,
  createBuffer:()=>({}),bindBuffer(target,b){bound=b;},
  bufferData(target,data){bound.data=typeof data==="number"?new Uint8Array(data):data;},
  bufferSubData(target,offset,data){bound.data.set(new Uint8Array(data.buffer,data.byteOffset,data.byteLength),offset);actual+=data.byteLength;},
  drawElements(type,count){drawn=count;}};
const view=Object.assign(Object.create(BayView.prototype),{gl,models:new Map(),actors:new Map(),animated:new Set(),largeIndices:true,scale:.60});
const mesh=new BayMesh(),city=buildBayCity(mesh,new BayMesh());const data=new Float32Array(mesh.vertices);
view.upload("city",data);const model=view.models.get("city");view.prepareDistanceMesh(model,data);
const list=new CityIndicesForTest(view,model,data),ref=new model.indices.constructor(model.count);
let frames=0,partial=0;
for(let step=0;step<260;step++){
  const t=Math.min(step,249),yaw=(t<120?.018*t:2.16-.033*(t-120)),old=actual;
  view.basis={camera:{x:146-.55*t,y:2.2,z:-36+.28*t},sn:Math.sin(yaw),cs:Math.cos(yaw),sp:0,cp:1,
    horizontal:1.15,vertical:.65,xMargin:Math.hypot(1,1.15),yMargin:Math.hypot(1,.65)};
  drawn=0;list.draw(view,model);
  let n=0;
  for(let i=0;i<list.parts.length;i++){
    const state=list.states[i];if(state<0)continue;
    const part=list.parts[i],far=!!(state&64),faces=far?list.farFaces:list.faces;
    for(let j=part.first;j<part.end;j+=3){const tri=j/3;
      if((faces[tri]&state)||(far&&!model.farKeep[tri]))continue;
      for(let k=0;k<3;k++)ref[n++]=model.indices[j+k];
    }
  }
  assert.equal(drawn,n);const bytes=n*ref.BYTES_PER_ELEMENT;
  assert(Buffer.from(ref.buffer,0,bytes).equals(Buffer.from(list.buffer.data.buffer,0,bytes)),"GPU geometry on frame "+step);
  if(actual!==old){frames++;full+=bytes;if(actual-old<bytes)partial++;}
}
assert(frames>100&&partial>100&&actual<full*.98);
console.log("PASS identical city geometry over 260 moving and held views, "+partial+" partial uploads, "+actual+" bytes submitted versus "+full+" for whole lists");

// Check each occlusion decision against the full list, including wall faces
// crossing the lens, offscreen object centres and cameras above the roofs.
view.buildings=city.opaqueBuildings;
let queries=0,hidden=0,allCandidates=0,gridCandidates=0;
for(let i=0;i<72;i++){
  const yaw=i*.49,pitch=Math.sin(i*.31)*.7;
  view.basis={camera:{x:145-i*3.65,y:i%8===0?27:2.4,z:96*Math.sin(i*.12)},sn:Math.sin(yaw),cs:Math.cos(yaw),
    sp:Math.sin(pitch),cp:Math.cos(pitch),horizontal:1.1,vertical:.65,xMargin:Math.hypot(1,1.1),yMargin:Math.hypot(1,.65)};
  view.collectStreetWalls();
  const grid=view.wallGrid,walls=view.streetWalls;
  if(!grid||grid.walls!==walls)continue;
  const eye=view.basis.camera;
  for(const {bounds:b} of list.parts){
    const x=b.x-eye.x,y=b.y-eye.y,z=b.z-eye.z;
    const along=x*view.basis.sn+z*view.basis.cs,depth=along*view.basis.cp+y*view.basis.sp;
    if(depth<=2)continue;
    const side=x*view.basis.cs-z*view.basis.sn,up=y*view.basis.cp-along*view.basis.sp;
    const linear=view.streetHidden(x,y,z,b.hw,b.hh,b.hd);
    assert.equal(view.streetHidden(x,y,z,b.hw,b.hh,b.hd,b.r,depth,side,up),linear);
    queries++;hidden+=linear;allCandidates+=walls.length;gridCandidates+=grid.candidates(depth,side,up).length;
  }
}
assert(queries>10000&&hidden>100&&gridCandidates<allCandidates*.8);
console.log("PASS",queries,"wall decisions across 72 city cameras;",allCandidates,"->",gridCandidates,"candidate walls");
