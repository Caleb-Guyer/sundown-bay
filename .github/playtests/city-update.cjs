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
const mesh=new BayMesh();buildBayCity(mesh,new BayMesh());const data=new Float32Array(mesh.vertices);
view.upload("city",data);const model=view.models.get("city");view.prepareDistanceMesh(model,data);
const list=new CityIndicesForTest(view,model,data),ref=new model.indices.constructor(model.count);
let facesSeen=0,facesFiltered=0;
// Maintain separate buffers and compare ordered index triples, including after a held view.
view.cpu=new Map([["city",data]]);
view.drawStreetDepth=(large)=>{
  const words=new model.indices.constructor(large.buffer.data.buffer,0,large.count);
  assert(words.length>0);let n=0,seen=0;
  for(const g of large.groups){
    const state=list.states[g.part];if(state<0)continue;
    for(const j of g.triangles){const t=j/3;seen++;
      if((state&64?list.farFaces:list.faces)[t]&state||(state&64)&&!model.farKeep[t])continue;
      for(let k=0;k<3;k++)assert.equal(words[n++],model.indices[j+k]);
    }
  }
  assert.equal(n,words.length);facesSeen+=n/3;facesFiltered+=seen-n/3;
};
let frames=0,partial=0;
for(let step=0;step<260;step++){
  const t=Math.min(step,249),yaw=(t<120?.018*t:2.16-.033*(t-120)),old=actual;
  view.basis={camera:{x:146-.55*t,y:2.2,z:-36+.28*t},sn:Math.sin(yaw),cs:Math.cos(yaw),sp:0,cp:1,
    horizontal:1.15,vertical:.65,xMargin:Math.hypot(1,1.15),yMargin:Math.hypot(1,.65)};
  drawn=0;list.draw(view,model,step%4!==2);
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
assert(facesSeen>10000&&facesFiltered>100);
console.log("PASS exact depth triangles across moving and held city cameras",facesSeen,facesFiltered);
assert(frames>100&&partial>100&&actual<full*.98);
console.log("PASS identical city geometry over 260 moving and held views, "+partial+" partial uploads, "+actual+" bytes submitted versus "+full+" for whole lists");
