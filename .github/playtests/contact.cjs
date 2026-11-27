const assert=require("node:assert/strict");
global.window=global;
require("node:vm").runInThisContext(require("node:fs").readFileSync(require("node:path").join(__dirname,"../../driving.js"),"utf8"));
function reference(a,b){
  const dx=a.x-b.x,dz=a.z-b.z,fa=a.footprint,fb=b.footprint,reach=fa.halfLength+fb.halfLength+.85;
  if(Math.abs(dx)>reach||Math.abs(dz)>reach)return null;
  const ca=Math.cos(a.yaw),sa=Math.sin(a.yaw),cb=Math.cos(b.yaw),sb=Math.sin(b.yaw);
  let depth=Infinity,nx=0,nz=0;
  for(const [x,z] of [[ca,-sa],[sa,ca],[cb,-sb],[sb,cb]]){
    const ra=(fa.track-.08)*Math.abs(x*ca-z*sa)+(fa.halfLength-.11)*Math.abs(x*sa+z*ca);
    const rb=(fb.track-.08)*Math.abs(x*cb-z*sb)+(fb.halfLength-.11)*Math.abs(x*sb+z*cb);
    const dot=dx*x+dz*z,overlap=ra+rb-Math.abs(dot);
    if(overlap<=0)return null;
    if(overlap<depth){depth=overlap;nx=x*(dot<0?-1:1);nz=z*(dot<0?-1:1);}
  }
  return {nx,nz,depth};
}
let seed=12007;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const pairs=[];
for(let i=0;i<20000;i++){
  const a={x:0,z:0,yaw:random()*Math.PI*2,footprint:{track:.38+random(),halfLength:1+4*random()}};
  const b={x:9*random()-4.5,z:10*random()-5,yaw:random()*Math.PI*2,footprint:{track:.38+random(),halfLength:1+4*random()}};
  if(i%5===0)b.yaw=a.yaw;
  if(i%11===0)b.yaw=a.yaw+Math.PI/2;
  if(i%23===0){b.x=b.z=0;b.footprint=a.footprint;}
  if(i%29===0){
    a.yaw=b.yaw=0;b.z=0;b.x=(a.footprint.track-.08)+(b.footprint.track-.08)+[0,1e-10,-1e-10][i%3];
  }
  assert.deepEqual(BayDriving.contact(a,b),reference(a,b));pairs.push([a,b]);
}
const times=[[],[]];
for(let n=0;n<16;n++){
  const k=[0,1,1,0][n%4],fn=k?BayDriving.contact:reference,t=performance.now();let hits=0;
  for(const [a,b] of pairs)if(fn(a,b))hits++;
  assert(hits>3000);
  if(n>=4)times[k].push(performance.now()-t);
}
console.log("PASS 20000 identical contact decisions, normals and depths, median ms before/after",times.map(t=>t.sort((a,b)=>a-b)[t.length>>1]));
