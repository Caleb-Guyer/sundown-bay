/* Compare the simulated GPU index buffer with a fresh city list after each camera move. */
const assert=require("node:assert/strict"),fs=require("node:fs"),path=require("node:path"),vm=require("node:vm");
const root=path.resolve(__dirname,"../..");
global.window=global;
for(const file of JSON.parse(fs.readFileSync(path.join(root,"index.html"),"utf8").match(/id="game-sources">([\s\S]+?)<\/script>/)[1])){
  if(file==="game.js")break;
  const code=fs.readFileSync(path.join(root,file),"utf8");
  vm.runInThisContext(file==="render.js"?code.replace("window.BayView=View;","window.BayView=View;window.CityIndicesForTest=CityIndexList;"):code,{filename:file});
}
{
  const grid=new BayLaneSpace(),cars=[];
  for(let z=-120;z<=120;z+=22)for(let x=-120;x<=120;x+=19)cars.push({x,z});
  grid.rebuild(cars,[],null);
  let probes=0,candidates=0;
  for(const car of cars){
    const old=grid.key(car);
    car.x+=26;car.z-=25;grid.moved(car,old);
    for(const offset of [-11,0,11]){
      const x=car.x+offset,z=car.z-offset;
      const close=v=>Math.abs(v.x-x)<=11&&Math.abs(v.z-z)<=11;
      const nearby=grid.carsNear(x,z,11);
      assert.deepEqual(new Set(nearby.filter(close)),new Set(cars.filter(close)));
      candidates+=nearby.length;probes++;
    }
  }
  console.log("PASS traffic swerve candidates matched the fleet across cell edges",probes,"probes, average",Math.round(candidates/probes),"of",cars.length);
}
let bound,actual=0,full=0,drawn=0;
const gl={ARRAY_BUFFER:1,ELEMENT_ARRAY_BUFFER:2,UNSIGNED_INT:4,UNSIGNED_SHORT:2,
  createBuffer:()=>({}),bindBuffer(target,b){bound=b;},
  bufferData(target,data){bound.data=typeof data==="number"?new Uint8Array(data):data;},
  bufferSubData(target,offset,data){bound.data.set(new Uint8Array(data.buffer,data.byteOffset,data.byteLength),offset);actual+=data.byteLength;},
  drawElements(type,count){drawn=count;}};
const view=Object.assign(Object.create(BayView.prototype),{gl,models:new Map(),actors:new Map(),animated:new Set(),largeIndices:true,scale:.60});
// Compare every coordinate and paint channel after both the base motion and
// the gesture have run. Include an ordinary walk where the base pose is final.
{
  const rigs=[false,true].map(()=>new BayPlayerMesh(BayCourtPlayers.colors.nikki,"local"));
  const skins=[0,0],motion=new BayPlayerMotion();
  view.cpu=new Map();
  for(const [i,rig] of rigs.entries()){
    BayCourtPlayers.dress(rig,"nikki");view.add("athlete"+i,rig,true);
    const original=rig.skin;rig.skin=function(){skins[i]++;original.call(this);};
  }
  for(let frame=0;frame<84;frame++){
    motion.step(1/30,.07+(frame%8)*.01,.015);
    const player={motion,action:frame%2?"dribble":"gather",side:frame%3?1:-1,phase:(frame%30)/30,beat:(frame%12)/12};
    for(const [i,rig] of rigs.entries()){
      rig.update(motion,i===1);
      if(frame%4!==0)BayCourtPlayers.pose(rig,player,frame/30);
      view.updateAnimated("athlete"+i);
      assert(!rig.skinPending);
    }
    assert.deepEqual(rigs[0].vertices,rigs[1].vertices);
  }
  assert.deepEqual(skins,[147,84]);
  console.log("PASS one clothing transform per frame across 84 walking, dribbling and gathering poses; all corners match,",skins,"skin passes");
}
const mesh=new BayMesh(),city=buildBayCity(mesh,new BayMesh());const data=new Float32Array(mesh.vertices);
view.upload("city",data);const model=view.models.get("city");view.prepareDistanceMesh(model,data);
{
  view.cpu.set("city",data);
  for(const large of [false,true]){
    view.largeIndices=large;const sun=view.shadowMesh(model);
    assert.notEqual(sun,model);
    const xyz=new Uint32Array(sun.buf.data.buffer,sun.buf.data.byteOffset,sun.buf.data.length);
    const original=new Uint32Array(data.buffer),order=sun.elements.data;
    assert.equal(order.length,model.count);
    for(let i=0;i<order.length;i++)for(let k=0;k<3;k++)assert.equal(xyz[order[i]*3+k],original[i*6+k]);
    console.log("PASS every sun triangle retains its exact positions and draw order",order.length,
      "corners,",sun.vertexCount,"shadow vertices versus",model.vertexCount,"painted vertices");
  }
}
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

// A row of crates crosses every kind of section seam. Look at each actual
// triangle from outside, from inside, and with the near plane at a wall.
for(const multiDraw of [false,true]){
  view.multiDraw=multiDraw;view.streetWalls=null;
  const props=new BayMesh();
  for(let i=0;i<32;i++){
    props.tri([i,1,0],[i+1,2,0],[i,1,1],"#abcdef");
    props.box(i*4,1,3,2,2,3,"#cabdad",i%3===0?0:i*.39);
  }
  const vertices=new Float32Array(props.vertices);
  view.upload("city",vertices);const crates=view.models.get("city");
  const draw=new CityIndicesForTest(view,crates,vertices);
  assert.equal(draw.parts.filter(p=>p.box).length,32);
  const testEyes=[[0,0,0],[.01,.01,.01],[0,1.05,0],[0,7,0],[6,0,-8],[-7,-5,5],[1.05,.04,.31]];
  let hiddenCount=0;
  for(const [i,p] of draw.parts.entries()){
    if(!p.box)continue;
    const b=p.bounds;
    for(const [dx,dy,dz] of testEyes){
      const eye={x:b.x+dx,y:b.y+dy,z:b.z+dz};view.basis={camera:eye,horizontal:1,vertical:.65};
      view.inFrame=()=>true;draw.draw(view,crates);
      const mask=draw.states[i];
      if(!dx&&!dz&&Math.abs(dy)<1.2)assert.equal(mask,0,"camera inside or near the cap");
      for(let j=p.first;j<p.end;j+=3){
        if(!(mask&draw.faces[j/3]))continue;
        // Mesh.box winds inward. A removed face must face away from the eye.
        const a=j*6,ux=vertices[a+6]-vertices[a],uy=vertices[a+7]-vertices[a+1],uz=vertices[a+8]-vertices[a+2];
        const vx=vertices[a+12]-vertices[a],vy=vertices[a+13]-vertices[a+1],vz=vertices[a+14]-vertices[a+2];
        const dot=(uy*vz-uz*vy)*(eye.x-vertices[a])+(uz*vx-ux*vz)*(eye.y-vertices[a+1])+(ux*vy-uy*vx)*(eye.z-vertices[a+2]);
        assert(dot>0,"removed triangle faces away from the eye");hiddenCount++;
      }
    }
  }
  assert(hiddenCount>600);delete view.inFrame;
  console.log("PASS",hiddenCount,"hidden triangles face away; all 32 closed crates stay intact using",multiDraw?96:288,"vertex sections");
}
