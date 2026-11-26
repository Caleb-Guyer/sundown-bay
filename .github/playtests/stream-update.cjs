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
