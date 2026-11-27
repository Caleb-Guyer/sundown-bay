// Replay overlapping street batches on three GPU buffers, including short draws
// followed by longer draws that must still see the old tail of that slot.
const fs=require("node:fs"),vm=require("node:vm"),path=require("node:path"),assert=require("node:assert/strict");
const api={window:{}},source=fs.readFileSync(path.resolve(__dirname,"../../render.js"),"utf8");
vm.runInNewContext(source.replace("window.BayView=View;","window.BayView=View;window.StreetBatch=StreetBatch;"),api);
for(const Type of [Uint16Array,Uint32Array]){
  const length=231,slots=Array.from({length:3},()=>({gpu:new Type(length),mirror:{words:new Type(length),known:0}}));
  let slot,sent=0,full=0,writes=0,seed=729;
  const gl={bufferSubData(target,offset,data){assert.equal(offset%Type.BYTES_PER_ELEMENT,0);
    slot.gpu.set(data,offset/Type.BYTES_PER_ELEMENT);writes++;}};
  const batch=Object.assign(Object.create(api.window.StreetBatch.prototype),{view:{gl}});
  const words=Type.from({length},(_,i)=>i%5?i*i:0);
  for(let f=0;f<450;f++){
    slot=slots[f%3];seed=(Math.imul(seed,1664525)+1013904223)>>>0;
    const n=f%17===0?0:f%11<3?length:Math.floor(length/2)+seed%90;
    if(f%4===0)words[seed%length]=seed;
    if(f%19===0){words[0]=0x80000000;words[length-1]=0xffffffff;}
    if(f%47===0)slot.mirror.known=0;
    const bytes=batch.uploadStream(0,words,n,slot.mirror);sent+=bytes;full+=n*Type.BYTES_PER_ELEMENT;
    assert.deepEqual(slot.gpu.subarray(0,n),words.subarray(0,n));
  }
  assert(writes>10&&sent<.6*full);
  console.log("PASS",Type.name,"450 exact batches in three GPU slots,",sent,"of",full,"bytes sent");
}
let builds=0;
const view={basis:{},scale:.55,streetBatch:{append(){if(this.buildDetail){builds++;this.buildDetail=false;}},flush(){}}};
const draw=()=>api.window.BayView.prototype.drawStreetList.call(view,[{},{}]);
draw();draw();assert.equal(builds,1);
view.basis={};draw();assert.equal(builds,2);
console.log("PASS repeated passes of one camera frame share a single mesh-detail build");

// Resolve every submitted index against the actual bytes of its bound vertex
// buffer. A stale placement in a recycled slot can otherwise look valid.
function streetDrive(retain,capacity){
  const bound=[],pictures=[],writes={vertices:0,indices:0};
  const gl={ARRAY_BUFFER:0,ELEMENT_ARRAY_BUFFER:1,createBuffer:()=>({}),
    bindBuffer(target,buffer){bound[target]=buffer;},
    bufferData(target,bytes){bound[target].bytes=new Uint8Array(bytes);},
    bufferSubData(target,offset,values){
      bound[target].bytes.set(new Uint8Array(values.buffer,values.byteOffset,values.byteLength),offset);
      writes[target===0?"vertices":"indices"]+=values.byteLength;
    },
    vertexAttribPointer(){},
    drawElements(type,count){
      const vertices=new Uint32Array(bound[0].bytes.buffer),indices=new Uint16Array(bound[1].bytes.buffer);
      for(let j=0;j<count;j++)for(let k=0;k<6;k++)pictures.push(vertices[indices[j]*6+k]);
    }};
  const view={gl,models:new Map(),cpu:new Map(),basis:{},scale:.55,inFrame:()=>true,
    inStreetList:true,beginStreetSurface:()=>true};
  const batch=new api.window.StreetBatch(view);batch.residentCapacity=capacity;
  if(!retain)batch.residentBase=()=>-1;
  for(let i=0;i<6;i++){
    const count=96+i*9,name="prop"+i;
    const positions=Float32Array.from({length:count*6},(_,j)=>j%31===0?-0:((j*13+i*51)%83)/17);
    const indices=i%2?Uint16Array.from({length:count},(_,j)=>j%48):null;
    view.models.set(name,{count,indices,vertexCount:indices?48:count});
    view.cpu.set(name,positions);
  }
  const frames=[];
  for(let f=0;f<42;f++){
    pictures.length=0;
    for(let i=0;i<6;i++){
      const j=f%8<5?i:5-i;
      const moving=j===4&&f>14;
      batch.append(["prop"+j,moving?f*.27:j*3,j===2?.7:0,j, j*.07,j===2?.14:0,j===3?-.23:0,
        j===5?.1:0,j>=4?{speed:moving?8:0}:null]);
    }
    batch.flush();frames.push(Uint32Array.from(pictures));
  }
  return {frames,writes};
}
const streamed=streetDrive(false,16384);
for(const capacity of [16384,234]){
  const kept=streetDrive(true,capacity);
  assert.deepEqual(kept.frames,streamed.frames);
  if(capacity===16384)assert(kept.writes.vertices<streamed.writes.vertices*.70);
  console.log("PASS slot-local placements, "+capacity+" resident vertices, exact indices and painted positions for 42 frames; vertex bytes",kept.writes.vertices,"vs",streamed.writes.vertices);
}

// Geometry generation changes its choice on a second visit. Compare the
// uploaded words for a single visit, including its standalone draw in order.
const trace=[],batch={buffers:[{},{},{}],vertexWords:new Uint32Array(12),indices:new Uint16Array(6),
  uploadStream(){},flush(){trace.push([this.vertexWords[0],this.indices[0],this.glow]);this.count=this.used=0;}};
const frame={streetBatch:batch,draw(name){trace.push(name);}};
let visits=0;
function scene(){
  visits++;
  for(let i=0;i<2;i++){
    batch.vertexWords[0]=visits+i;batch.indices[0]=i;batch.glow=i;batch.used=1;batch.count=3;batch.flush();
    if(!i)this.draw("car");
  }
}
function compare(v,list,a,b){
  trace.length=0;b();const first=trace.slice();trace.length=0;a();
  assert.deepEqual(first,[[1,0,0],"car",[2,1,1]]);assert.deepEqual(trace,first);return true;
}
const uploads=require("./street-uploads.cjs");
const captured=uploads(frame,[],scene,compare,uploads.freeze);
assert(captured.reference&&captured.image&&captured.batches===2&&visits===1);
console.log("PASS both GPU upload comparisons replay the same ordered geometry from one scene traversal.");
