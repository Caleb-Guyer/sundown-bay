/* The city shares one shadow map. Reuse its GPU storage as the sun crosses the bay. */
(() => {
  "use strict";
  const rgbCache = new Map();
  function rgb(hex) {
    if (!rgbCache.has(hex)) {
      const n = parseInt(hex.slice(1), 16);
      rgbCache.set(hex, [(n >> 16) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]);
    }
    return rgbCache.get(hex);
  }
  const builtMaterials=new Map([
    [0x46515b,1],[0xe7b784,2],[0x5c8790,2],[0x83b8b5,3],
    [0xffd589,4],[0xfc9390,4],[0xffdfab,4],[0xffe1a4,4],[0xffc487,4],[0xff986f,4]
  ]);
  const lampShade=rgb("#e9c99a");
  for(const shade of [1.07,.91,.85,.8,.98,.71]){
    const [r,g,b]=lampShade.map(c=>Math.round(c*shade*255));
    builtMaterials.set((r<<16)|(g<<8)|b,4);
  }
  const carMaterials=new Map([[0xffefbd,5],[0xa53a47,6]]);
  function tagMaterials(data,parts){
    // Use spare range in the static vertex colour so street lights need no additional draw calls.
    for(let i=0;i<data.length;i+=6){
      const key=(Math.round(data[i+3]*255)<<16)|(Math.round(data[i+4]*255)<<8)|Math.round(data[i+5]*255);
      const kind=parts.get(key);
      if(kind&&(kind!==1||data[i+1]<.09)&&(kind!==2&&kind!==3||data[i+1]>2.4))data[i+3]+=2*kind;
    }
  }
  class Mesh {
    constructor() { this.vertices = []; }
    face(points, color, light = 1) {
      const c = rgb(color);
      for (const p of points) this.vertices.push(p[0], p[1], p[2], c[0]*light, c[1]*light, c[2]*light);
    }
    tri(a,b,c,color) { this.face([a,b,c],color); }
    quad(a,b,c,d,color,light=1) { this.face([a,b,c,a,c,d],color,light); }
    box(x,y,z,w,h,d,color,yaw=0) {
      const s=Math.sin(yaw), c=Math.cos(yaw);
      const pt=(i,j,k)=>[x+i*w*.5*c+k*d*.5*s,y+j*h*.5,z-i*w*.5*s+k*d*.5*c];
      const a=pt(-1,-1,-1), b=pt(1,-1,-1), e=pt(-1,-1,1), f=pt(1,-1,1);
      const A=pt(-1,1,-1), B=pt(1,1,-1), E=pt(-1,1,1), F=pt(1,1,1);
      this.quad(A,B,F,E,color,1.07); this.quad(a,b,B,A,color,.91);
      this.quad(e,E,F,f,color,.85); this.quad(a,A,E,e,color,.80);
      this.quad(b,f,F,B,color,.98); this.quad(a,e,f,b,color,.71);
    }
    cyl(x,y,z,rTop,rBottom,h,sides,color) {
      const t=[x,y+h/2,z], b=[x,y-h/2,z];
      for(let i=0;i<sides;i++){
        const u=i/sides*2*Math.PI, v=(i+1)/sides*2*Math.PI;
        const p=[x+Math.cos(u)*rTop,t[1],z+Math.sin(u)*rTop], q=[x+Math.cos(v)*rTop,t[1],z+Math.sin(v)*rTop];
        const r=[x+Math.cos(u)*rBottom,b[1],z+Math.sin(u)*rBottom], e=[x+Math.cos(v)*rBottom,b[1],z+Math.sin(v)*rBottom];
        this.quad(r,e,q,p,color,.87+.1*Math.cos(u+.4)); this.face([t,p,q],color,1.05); this.face([b,r,e],color,.77);
      }
    }
    pole(a,b,r,color,sides=5) {
      const dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],len=Math.hypot(dx,dy,dz)||1;
      const nx=dx/len,ny=dy/len,nz=dz/len,flat=Math.hypot(nx,nz);
      const ux=flat?nz/flat:1, uz=flat?-nx/flat:0;
      const vx=ny*uz, vy=nz*ux-nx*uz, vz=-ny*ux;
      const rim=(p,i)=>{const t=i*Math.PI*2/sides, c=r*Math.cos(t),s=r*Math.sin(t);return [p[0]+ux*c+vx*s,p[1]+vy*s,p[2]+uz*c+vz*s];};
      for(let i=0;i<sides;i++) this.quad(rim(a,i),rim(a,i+1),rim(b,i+1),rim(b,i),color,.88+.1*Math.cos(i));
    }
  }
  const trafficBounds={x:0,y:0,z:0,r:5.8};
  function meshBounds(vertices,start,end){
    let x0=Infinity,y0=Infinity,z0=Infinity,x1=-Infinity,y1=-Infinity,z1=-Infinity;
    for(let i=start*6;i<end*6;i+=6){
      const x=vertices[i],y=vertices[i+1],z=vertices[i+2];
      x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);z0=Math.min(z0,z);z1=Math.max(z1,z);
    }
    return {x:(x0+x1)*.5,y:(y0+y1)*.5,z:(z0+z1)*.5,
      hw:(x1-x0)*.5+.035,hh:(y1-y0)*.5+.035,hd:(z1-z0)*.5+.035,r:Math.hypot(x1-x0,y1-y0,z1-z0)*.5+.035};
  }
  // Keep long edges (kerbs, cables and road paint). Their narrow triangles
  // still carry a visible silhouette after individual sign letters disappear.
  function distantTriangles(data,start,end,indices){
    for(let i=start;i<end;i+=3){
      const p=i*6,ax=data[p+6]-data[p],ay=data[p+7]-data[p+1],az=data[p+8]-data[p+2];
      const bx=data[p+12]-data[p],by=data[p+13]-data[p+1],bz=data[p+14]-data[p+2];
      const nx=ay*bz-az*by,ny=az*bx-ax*bz,nz=ax*by-ay*bx;
      if(nx*nx+ny*ny+nz*nz>.09||ax*ax+ay*ay+az*az>4||bx*bx+by*by+bz*bz>4||
        (bx-ax)**2+(by-ay)**2+(bz-az)**2>4)indices.push(i,i+1,i+2);
    }
  }
  // Share vertices only when all six Float32 words match. Painted seams and
  // layered signs keep their colours and the original triangle ordering.
  function indexGeometry(data,largeIndices,groups=null,frames=null){
    const count=data.length/6;
    if(count<192||count>65535&&!largeIndices)return null;
    const words=new Uint32Array(data.buffer,data.byteOffset,data.length);
    let size=1;while(size<count*2)size*=2;
    const slots=new Uint32Array(size),remap=count>65535?new Uint32Array(count):new Uint16Array(count);
    const packed=new Float32Array(data.length);let used=0;
    for(let i=0;i<count;i++){
      const p=i*6;let hash=groups?Math.imul(2166136261^groups[i],16777619):2166136261;
      for(let n=0;n<6;n++)hash=Math.imul(hash^words[p+n],16777619);
      let slot=(hash^(hash>>>16))&(size-1);
      while(slots[slot]){
        const q=(slots[slot]-1)*6;
        if((!groups||groups[slots[slot]-1]===groups[i])&&words[q]===words[p]&&words[q+1]===words[p+1]&&words[q+2]===words[p+2]&&
          words[q+3]===words[p+3]&&words[q+4]===words[p+4]&&words[q+5]===words[p+5]&&
          (!frames||frames.every(f=>f[p]===f[q]&&f[p+1]===f[q+1]&&f[p+2]===f[q+2])))break;
        slot=(slot+1)&(size-1);
      }
      if(slots[slot])remap[i]=remap[slots[slot]-1];
      else{
        slots[slot]=i+1;remap[i]=used;
        for(let n=0;n<6;n++)packed[used*6+n]=data[p+n];
        used++;
      }
    }
    if(used>count*.85)return null;
    const indices=used<=65535&&remap.BYTES_PER_ELEMENT===4?new Uint16Array(remap):remap;
    return {vertices:packed.subarray(0,used*6),indices};
  }
  Mesh.indexWalk=function(rest,poses){
    // Two corners can touch at rest and part when the knee bends. Compare
    // their positions across the full stride before sharing interpolation.
    const frames=poses.map(p=>new Uint32Array(p.buffer,p.byteOffset,p.length));
    return indexGeometry(rest,false,null,frames);
  };
  function indexActor(data,rig,largeIndices){
    // Coincident points on a sleeve and on the hand can separate. Share only
    // corners that the rigger bound to the very same rest point and joints.
    const plan=rig.skinPlan(),groups=new Uint32Array(plan.count);
    if(groups.length*6!==data.length)return null;
    for(const i of plan.unique)groups[i]=i;
    for(let p=0;p<plan.copies.length;p+=2)groups[plan.copies[p]/6]=plan.copies[p+1]/6;
    const packed=indexGeometry(data,largeIndices,groups);if(!packed)return null;
    const sources=new Uint32Array(packed.vertices.length/6),copies=[];
    for(let i=0;i<packed.indices.length;i++){
      const id=packed.indices[i];
      if(sources[id])copies.push(i*6,sources[id]-1);
      else sources[id]=i*6+1;
    }
    for(let i=0;i<sources.length;i++)sources[i]--;
    return {...packed,sources,copies:new Uint32Array(copies)};
  }
  // Collapse details within small model-space cells. All paint at a shared
  // position moves together, including the two sides of a material seam.
  function streetDetail(data,b,cell){
    const x0=b.x-b.hw,y0=b.y-b.hh,z0=b.z-b.hd;
    const nx=Math.ceil(2*b.hw/cell)+1,ny=Math.ceil(2*b.hh/cell)+1;
    const bins=new Map(),corners=new Array(data.length/6);
    for(let j=0,p=0;p<data.length;j++,p+=6){
      const x=(data[p]-x0)/cell,y=(data[p+1]-y0)/cell,z=(data[p+2]-z0)/cell;
      const u=Math.floor(x),v=Math.floor(y),w=Math.floor(z),key=u+nx*(v+ny*w);
      const d=(x-u-.5)**2+(y-v-.5)**2+(z-w-.5)**2;
      let bin=bins.get(key);
      if(!bin){bin={at:p,d,locked:false};bins.set(key,bin);}
      else if(d<bin.d){bin.d=d;bin.at=p;}
      corners[j]=bin;
    }
    // A distant aerial, wheel spoke or painted stripe is still visible along
    // its length. Keep its narrow edge, including that edge's adjacent faces.
    for(let i=0;i<corners.length;i+=3){
      for(let k=0;k<3;k++){
        const a=i+k,b=i+(k+1)%3,c=i+(k+2)%3;
        if(corners[a]!==corners[b]||corners[a]===corners[c]||corners[a].locked)continue;
        const p=a*6,q=c*6;
        if((data[p]-data[q])**2+(data[p+1]-data[q+1])**2+(data[p+2]-data[q+2])**2>9*cell*cell)corners[a].locked=true;
      }
    }
    const out=new Float32Array(data.length);let used=0;
    for(let i=0;i<corners.length;i+=3){
      const a=corners[i].locked?i*6:corners[i].at,b=corners[i+1].locked?(i+1)*6:corners[i+1].at,c=corners[i+2].locked?(i+2)*6:corners[i+2].at;
      if(a===b||b===c||a===c)continue;
      for(let k=0;k<3;k++){
        const p=k===0?a:k===1?b:c,q=(i+k)*6;
        out[used++]=data[p];out[used++]=data[p+1];out[used++]=data[p+2];
        out[used++]=data[q+3];out[used++]=data[q+4];out[used++]=data[q+5];
      }
    }
    if(!used||used>=data.length*.78)return null;
    const stream=out.subarray(0,used),packed=indexGeometry(stream,false);
    return {data:packed?packed.vertices.slice():stream.slice(),indices:packed?.indices||null,count:used/6};
  }
  function drawRange(gl,model,first,count){
    if(!model.elements){gl.drawArrays(gl.TRIANGLES,first,count);return;}
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.elements);
    gl.drawElements(gl.TRIANGLES,count,model.elementType,first*model.indices.BYTES_PER_ELEMENT);
  }
  // Each visible wall bounds a cone of sight lines from the camera. To hide a
  // model, its entire padded box must be beyond the wall and inside all four
  // sides of that cone. Test the least favourable corner for each inequality.
  function wallFace(faces,axis,d,halfD,u,halfU,v,halfV,near){
    const sign=d<0?-1:1,front=Math.abs(d)-halfD;
    if(front<=near)return;
    const left=(u-halfU)/front,right=(u+halfU)/front,bottom=(v-halfV)/front,top=(v+halfV)/front;
    faces.push({axis,sign,front,left,right,bottom,top});
  }
  function behindWall(f,d,hd,u,hu,v,hv){
    d*=f.sign;
    return d-hd>f.front&&u-hu>f.left*d+Math.abs(f.left)*hd&&u+hu<f.right*d-Math.abs(f.right)*hd&&
      v-hv>f.bottom*d+Math.abs(f.bottom)*hd&&v+hv<f.top*d-Math.abs(f.top)*hd;
  }
  // A wall can hide an object only if it covers the ray through its centre.
  // Bins at the image edges also contain offscreen rays: a long shop sign can
  // still enter the picture even when its centre lies beyond the viewport.
  const wallColumns=8,wallRows=6;
  function wallBin(n,size){return Math.max(0,Math.min(size-1,Math.floor(n)));}
  class WallGrid {
    constructor(){this.cells=Array.from({length:wallColumns*wallRows},()=>[]);}
    build(walls,basis){
      this.walls=walls;this.basis=basis;
      this.sx=wallColumns/(2*basis.horizontal);this.sy=wallRows/(2*basis.vertical);
      for(const cell of this.cells)cell.length=0;
      const {cs,sn,cp,sp}=basis;
      for(const f of walls){
        let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity,front=0;
        const d=f.sign*f.front;
        for(let i=0;i<4;i++){
          const u=(i&1?f.right:f.left)*f.front,v=(i&2?f.top:f.bottom)*f.front;
          const x=f.axis===0?d:u,y=f.axis===1?d:v,z=f.axis===2?d:f.axis===0?u:v;
          const along=x*sn+z*cs,depth=along*cp+y*sp;
          if(depth<=0)continue;
          front++;
          const px=(x*cs-z*sn)/depth*this.sx+wallColumns*.5,py=(y*cp-along*sp)/depth*this.sy+wallRows*.5;
          x0=Math.min(x0,px);x1=Math.max(x1,px);y0=Math.min(y0,py);y1=Math.max(y1,py);
        }
        if(!front)continue;
        // A face crossing the eye plane can project arbitrarily far along an
        // edge. Keep it everywhere. Walls wholly in front have finite bounds.
        const left=front===4?wallBin(x0-1e-7,wallColumns):0,right=front===4?wallBin(x1+1e-7,wallColumns):wallColumns-1;
        const bottom=front===4?wallBin(y0-1e-7,wallRows):0,top=front===4?wallBin(y1+1e-7,wallRows):wallRows-1;
        for(let row=bottom;row<=top;row++)for(let col=left;col<=right;col++)this.cells[row*wallColumns+col].push(f);
      }
    }
    candidates(depth,side,up){
      return this.cells[wallBin(up/depth*this.sy+wallRows*.5,wallRows)*wallColumns+
        wallBin(side/depth*this.sx+wallColumns*.5,wallColumns)];
    }
  }
  // Recognize the six complete faces emitted by Mesh.box in the final vertex
  // stream. Cut-out doors, cloth, lettering and open meshes remain double-sided.
  const boxCorners=[2,3,7,2,7,6,0,1,3,0,3,2,4,6,7,4,7,5,0,2,6,0,6,4,1,5,7,1,7,3,0,4,5,0,5,1];
  const boxFaces=[8,16,32,1,2,4];
  function closedBoxFaces(data,accept){
    let sides=null;
    for(let p=0;p+216<=data.length;p+=18){
      const x=data[p],y=data[p+37],z=data[p+2],X=data[p+6],Y=data[p+1],Z=data[p+14];
      if(X<=x||Y<=y||Z<=z||data[p+7]!==Y||data[p+8]!==z||data[p+12]!==X)continue;
      let i=0;
      for(;i<36;i++){
        const c=boxCorners[i],v=p+i*6;
        if(data[v]!==((c&1)?X:x)||data[v+1]!==((c&2)?Y:y)||data[v+2]!==((c&4)?Z:z))break;
      }
      if(i!==36)continue;
      if(!accept||accept(p/18)){
        sides??=new Uint8Array(data.length/18);
        for(let f=0;f<6;f++)sides[p/18+f*2]=sides[p/18+f*2+1]=boxFaces[f];
      }
      p+=216-18;
    }
    return sides;
  }
  function cameraSides(model,basis,x,y,z,yaw,tiltX,tiltZ){
    const eye=basis.camera,b=model.bounds;
    const dx=eye.x-x,dy=eye.y-y,dz=eye.z-z,c=Math.cos(yaw),s=Math.sin(yaw);
    let u=dx*c-dz*s,v=dy,w=dx*s+dz*c;
    if(tiltZ){const c=Math.cos(tiltZ),s=Math.sin(tiltZ),a=u;u=a*c+v*s;v=v*c-a*s;}
    if(tiltX){const c=Math.cos(tiltX),s=Math.sin(tiltX),a=v;v=a*c+w*s;w=w*c-a*s;}
    // Keeping the entire near clip rectangle outside the slab also covers
    // close cockpit shots, where the camera can be inside a closed body.
    const near=.13*Math.hypot(1,basis.horizontal,basis.vertical)+.01;
    const side=(value,half,lo,hi)=>value>half+near?lo:value< -half-near?hi:0;
    return side(u-b.x,b.hw,1,2)|side(v-b.y,b.hh,4,8)|side(w-b.z,b.hd,16,32);
  }
  function exteriorMesh(model,mask,batch){
    const old=model.exterior;
    if(old?.mask===mask)return old;
    // Multiple instances can use the same model in one frame. Rebuild only
    // when a camera side repeats; a spinning wheel can keep its original mesh.
    if(model.wantedSide!==mask){model.wantedSide=mask;return null;}
    const recent=model.recentSides?.get(mask);
    if(recent)return model.exterior=recent;
    const sources=[],indices=[],lookup=new Uint16Array(model.vertexCount);
    for(let i=0;i<model.count;i+=3){
      if(model.closedSides[i/3]&mask)continue;
      for(let j=i;j<i+3;j++){
        const id=model.indices?model.indices[j]:j;
        if(!lookup[id]){sources.push(j*6);lookup[id]=sources.length;}
        indices.push(lookup[id]-1);
      }
    }
    const mesh={mask,indices:new Uint16Array(indices),sources:new Uint32Array(sources)};
    const bytes=mesh.indices.byteLength+mesh.sources.byteLength;
    while(batch.sideBytes+bytes>2*1024*1024){
      const [first,owner]=batch.sideHistory.entries().next().value;
      owner.recentSides.delete(first.mask);batch.sideHistory.delete(first);
      batch.sideBytes-=first.indices.byteLength+first.sources.byteLength;
    }
    (model.recentSides??=new Map()).set(mask,mesh);
    batch.sideHistory.set(mesh,model);batch.sideBytes+=bytes;return model.exterior=mesh;
  }
  // Keep the city in its static vertex buffer. A street camera draws one
  // ordered index list, including near and distant streets. The same list is
  // valid until a section changes visibility, detail level or camera side.
  class CityIndexList {
    constructor(view,model,data){
      const gl=view.gl,triangles=model.count/3,perSection=model.sections[0].end/3;
      this.farFaces=new Uint8Array(triangles);
      this.faces=closedBoxFaces(data,first=>{
        // A box split between sections may lose its front when the adjoining
        // section uses distant detail. Only intact boxes can hide their backs.
        if(Math.floor(first/perSection)!==Math.floor((first+11)/perSection))return false;
        if(model.farKeep){
          let complete=true;
          for(let t=first;t<first+12;t++)if(!model.farKeep[t]){complete=false;break;}
          if(complete)for(let f=0;f<6;f++)this.farFaces[first+2*f]=this.farFaces[first+2*f+1]=boxFaces[f];
        }
        return true;
      })||new Uint8Array(triangles);
      // The original sections can span several addresses. Give each intact
      // box its own bounds while retaining the parent section's detail level.
      this.parts=[];this.ends=[];
      for(const section of model.sections){
        let first=section.first;
        while(first<section.end){
          let end=first;
          if(this.faces[first/3]===8)end+=36;
          else do{end+=3;}while(end<section.end&&this.faces[end/3]!==8);
          const bounds=first===section.first&&end===section.end?section.bounds:meshBounds(data,first,end);
          this.parts.push({first,end,bounds});first=end;
        }
        this.ends.push(this.parts.length);
      }
      this.states=new Int8Array(this.parts.length).fill(-2);
      this.offsets=new Uint32Array(this.parts.length+1);
      this.indices=new model.indices.constructor(model.count);
      this.buffer=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.buffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.indices.byteLength,gl.DYNAMIC_DRAW);
      this.count=0;
    }
    draw(view,model){
      const gl=view.gl,{camera:eye,horizontal,vertical}=view.basis;
      const near=.13*Math.hypot(1,horizontal,vertical)+.01;
      let firstChange=this.parts.length,lastChange=-1;
      for(let s=0,i=0;s<model.sections.length;s++){
        const parent=model.sections[s].bounds,visible=view.inFrame(parent,0,0,0,0,0,0);
        const far=visible&&model.farKeep&&view.farFromCamera(parent);
        for(;i<this.ends[s];i++){
          const part=this.parts[i],b=part.bounds;
          let state=-1;
          if(visible&&(b===parent||view.inFrame(b,0,0,0,0,0,0))){
            state=far?64:0;
            if((far?this.farFaces:this.faces)[part.first/3]){
              const dx=eye.x-b.x,dy=eye.y-b.y,dz=eye.z-b.z;
              state|=(dx>b.hw+near?1:dx< -b.hw-near?2:0)|
                (dy>b.hh+near?4:dy< -b.hh-near?8:0)|(dz>b.hd+near?16:dz< -b.hd-near?32:0);
            }
          }
          if(state!==this.states[i]){this.states[i]=state;firstChange=Math.min(firstChange,i);lastChange=i;}
        }
      }
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.buffer);
      if(lastChange>=0){
        // The prefix is already on the GPU. Keep the suffix too whenever the
        // changed range still ends at the same index in the packed city.
        const start=this.offsets[firstChange];let n=start,i=firstChange;
        for(;i<this.parts.length;i++){
          if(i>lastChange&&this.offsets[i]===n)break;
          this.offsets[i]=n;
          const state=this.states[i];if(state<0)continue;
          const part=this.parts[i],far=(state&64)!==0,faces=far?this.farFaces:this.faces;
          for(let j=part.first,t=j/3;j<part.end;j+=3,t++){
            if((faces[t]&state)||(far&&!model.farKeep[t]))continue;
            this.indices[n++]=model.indices[j];this.indices[n++]=model.indices[j+1];this.indices[n++]=model.indices[j+2];
          }
        }
        if(i===this.parts.length)this.count=this.offsets[i]=n;
        if(n>start)gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER,start*this.indices.BYTES_PER_ELEMENT,this.indices.subarray(start,n));
      }
      if(this.count)gl.drawElements(gl.TRIANGLES,this.count,model.elementType,0);
    }
  }
  // Pack the visible street props in submission order. Their vertices share a
  // world coordinate system, so changing from a shop to a car needs no GL call.
  // A batch is bounded and uses 16-bit indices even on WebGL 1 devices.
  class StreetBatch {
    constructor(view){
      this.view=view;
      const gl=view.gl;
      this.vertices=new Float32Array(24576*6);
      // Compare the original float bits, including signed zero, on their way to WebGL.
      this.vertexWords=new Uint32Array(this.vertices.buffer);
      this.indices=new Uint16Array(65532);
      this.linearIndices=Uint16Array.from({length:this.vertices.length/6},(_,i)=>i);
      this.indexBases=new WeakMap();this.indexCopies=new Set();this.indexBytes=0;
      this.savedPoses=new Set();this.poseBytes=0;
      this.sourceIds=new WeakMap();this.nextSource=1;
      this.sideHistory=new Map();this.sideBytes=0;
      this.details=new Map();this.detailBytes=0;this.buildDetail=true;
      // Give the GPU time to consume a submitted street batch before the
      // next upload writes to the same storage. All three pairs total 2.1 MiB.
      this.buffers=Array.from({length:3},()=>{
        const vertex=gl.createBuffer(),index=gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER,vertex);gl.bufferData(gl.ARRAY_BUFFER,this.vertices.byteLength,gl.STREAM_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,index);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.indices.byteLength,gl.STREAM_DRAW);
        return {vertex,index,positions:{words:new Uint32Array(this.vertexWords.length),known:0},
          topology:{words:new Uint16Array(this.indices.length),known:0}};
      });
      this.nextBuffer=0;
      view.bound=null;this.count=0;this.used=0;this.glow=0;
    }
    writeIndices(source,base,at,count,fixed){
      const dest=this.indices;
      if(!source&&count>=64){dest.set(this.linearIndices.subarray(base,base+count),at);return;}
      if(source&&base===0&&count===source.length){dest.set(source,at);return;}
      let entry;
      if(source&&fixed&&count>=384&&count===source.length){
        entry=this.indexBases.get(source);
        if(entry?.base===base&&entry.copy){dest.set(entry.copy,at);return;}
        if(!entry){entry={base,copy:null};this.indexBases.set(source,entry);entry=null;}
        else if(entry.base!==base){
          if(entry.copy){this.indexBytes-=entry.copy.byteLength;this.indexCopies.delete(entry);entry.copy=null;}
          entry.base=base;entry=null;
        }
      }
      if(source){for(let i=0;i<count;i++)dest[at+i]=base+source[i];}
      else for(let i=0;i<count;i++)dest[at+i]=base+i;
      if(entry){
        // Only retain a repeated placement. Changing traffic and lens cuts often move it.
        while(this.indexBytes+count*2>512*1024){
          const oldest=this.indexCopies.values().next().value;
          this.indexBytes-=oldest.copy.byteLength;oldest.copy=null;this.indexCopies.delete(oldest);
        }
        entry.copy=dest.slice(at,at+count);this.indexBytes+=entry.copy.byteLength;this.indexCopies.add(entry);
      }
    }
    uploadStream(target,source,length,history){
      const prior=history.words,known=Math.min(length,history.known);
      let first=0,end=length;
      while(first<known&&source[first]===prior[first])first++;
      if(first===length)return 0;
      if(end<=history.known)while(end>first&&source[end-1]===prior[end-1])end--;
      const changed=source.subarray(first,end);
      this.view.gl.bufferSubData(target,first*source.BYTES_PER_ELEMENT,changed);
      prior.set(changed,first);history.known=Math.max(history.known,end);
      return changed.byteLength;
    }
    flush(){
      if(!this.count)return;
      const view=this.view,gl=view.gl;
      const slot=this.buffers[this.nextBuffer];
      this.nextBuffer=(this.nextBuffer+1)%this.buffers.length;
      gl.bindBuffer(gl.ARRAY_BUFFER,slot.vertex);
      this.uploadStream(gl.ARRAY_BUFFER,this.vertexWords,this.used*6,slot.positions);
      gl.vertexAttribPointer(view.pos,3,gl.FLOAT,false,24,0);
      gl.vertexAttribPointer(view.col,3,gl.FLOAT,false,24,12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,slot.index);
      this.uploadStream(gl.ELEMENT_ARRAY_BUFFER,this.indices,this.count,slot.topology);
      const solid=view.beginStreetSurface(this.glow);
      if(!solid){
        gl.uniform3f(view.u.origin,0,0,0);gl.uniform2f(view.u.turn,1,0);
        gl.uniform4f(view.u.tilt,1,0,1,0);view.tiltX=view.tiltZ=0;
        if(view.glow!==this.glow){gl.uniform1f(view.u.glow,this.glow);view.glow=this.glow;}
      }
      gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
      if(solid)gl.useProgram(view.program);
      view.bound=null;this.count=0;this.used=0;
    }
    forgetPose(p){
      if(!p.vertices)return;
      this.poseBytes-=p.vertices.byteLength;this.savedPoses.delete(p);p.vertices=null;
    }
    repeatedPose(model,sources,x,y,z,yaw,tiltX,tiltZ){
      // Street furniture can share a mesh at several addresses. Give repeated
      // placements a chance to reuse their transform as the car passes them.
      const slots=model.batchPoses??=[];
      let sourceId=this.sourceIds.get(sources);
      if(!sourceId){sourceId=this.nextSource++;this.sourceIds.set(sources,sourceId);}
      for(let i=0;i<slots.length;i++){
        const p=slots[i];
        if(p.x===x&&p.y===y&&p.z===z&&p.yaw===yaw&&p.tiltX===tiltX&&p.tiltZ===tiltZ&&p.sourceId===sourceId){
          if(i){slots.splice(i,1);slots.unshift(p);}return p;
        }
      }
      const p=slots.length<12?{}:slots.pop();slots.unshift(p);
      this.forgetPose(p);
      p.x=x;p.y=y;p.z=z;p.yaw=yaw;p.tiltX=tiltX;p.tiltZ=tiltZ;p.sourceId=sourceId;return null;
    }
    rememberPose(p,vertices){
      while(this.poseBytes+vertices.byteLength>3*1024*1024)this.forgetPose(this.savedPoses.values().next().value);
      p.vertices=vertices.slice();this.poseBytes+=p.vertices.byteLength;this.savedPoses.add(p);
    }
    distanceDetail(model,data,x,y,z){
      const view=this.view,v=view.basis,b=model.bounds;
      if(!v?.f||!b||b.r>15||model.count<480||model.count>12000||view.scale>.65)return null;
      // Use a sphere about the model origin to include off-centre and tilted
      // geometry. The nearest visible surface sets the allowed pixel error.
      const depth=((x-v.camera.x)*v.sn+(z-v.camera.z)*v.cs)*v.cp+(y-v.camera.y)*v.sp;
      const near=depth-b.r-Math.hypot(b.x,b.y,b.z);
      const pitch=near/(view.canvas.height*.5*v.f*1.733*Math.max(v.xMargin,v.yMargin));
      const cell=pitch>=.24?.24:pitch>=.12?.12:pitch>=.055?.055:0;
      if(!cell)return null;
      const tiers=model.detailLevels??={};
      if(Object.hasOwn(tiers,cell))return tiers[cell];
      if(!this.buildDetail)return null;
      this.buildDetail=false;
      const detail=tiers[cell]=streetDetail(data,b,cell);if(!detail)return null;
      const bytes=detail.data.byteLength+(detail.indices?.byteLength||0);
      while(this.detailBytes+bytes>4*1024*1024){
        const [old,entry]=this.details.entries().next().value;
        delete entry.model.detailLevels[entry.cell];this.detailBytes-=entry.bytes;this.details.delete(old);
        const sourceId=this.sourceIds.get(old.data);
        for(const p of entry.model.batchPoses||[])if(p.sourceId===sourceId)this.forgetPose(p);
      }
      this.details.set(detail,{model,cell,bytes});this.detailBytes+=bytes;return detail;
    }
    append(item){
      const view=this.view;
      const [name,x=0,y=0,z=0,yaw=0,tiltX=0,tiltZ=0,glow=0,car,,vapor]=item;
      const model=view.models.get(name);
      if(!model?.count)return;
      let data=view.cpu.get(name);
      if(model.poseChanged){model.bounds=meshBounds(data,0,model.count);model.poseChanged=false;}
      if(!view.inFrame(model.bounds,x,y,z,yaw,tiltX,tiltZ,car?.damage?1.4:0))return;
      if(model.checkCopies)view.checkActorCopies(model,data);
      if(model.sections||car?.damage||vapor||model.count>this.indices.length){
        this.flush();view.draw(...item);return;
      }
      let indices=model.indices,sources=model.batchSources,count=model.count,n=model.vertexCount;
      if(view.scale<=.65&&!model.actor&&!model.crowdDetail&&model.bounds&&model.count>330&&!tiltX&&!tiltZ&&view.farFromCamera(model.bounds,x,y,z,yaw)){
        if(!model.distanceReady)view.prepareDistanceMesh(model,data);
        if(model.batchDistant){
          indices=model.batchDistant.indices;sources=model.batchDistant.sources;count=indices.length;n=sources.length;
        }
      }
      if(!model.dynamic&&model.bounds&&model.count>=192&&(!model.batchDistant||sources!==model.batchDistant.sources)){
        if(model.closedSides===undefined)model.closedSides=closedBoxFaces(data);
        if(model.closedSides){
          const mask=cameraSides(model,view.basis,x,y,z,yaw,tiltX,tiltZ);
          const exterior=mask&&exteriorMesh(model,mask,this);
          if(exterior){indices=exterior.indices;sources=exterior.sources;count=indices.length;n=sources.length;}
        }
      }
      if(n>this.vertices.length/6){this.flush();view.draw(...item);return;}
      if(indices&&!sources&&!model.packedPose){
        sources=model.batchSources=new Uint32Array(n);
        for(let i=0;i<model.count;i++)sources[indices[i]]=i*6;
      }
      if(!model.dynamic&&!model.crowdDetail&&!vapor&&!car?.damage){
        const small=this.distanceDetail(model,data,x,y,z);
        if(small&&small.count<count*.82){
          data=small.data;indices=small.indices;sources=null;count=small.count;n=data.length/6;
        }
      }
      if(this.glow!==glow||this.count+count>this.indices.length||(this.used+n)*6>this.vertices.length)this.flush();
      this.glow=glow;
      const dest=this.vertices;
      const start=this.used*6;
      // The source list changes with distance and the visible sides of a closed
      // model. Only a repeated static placement can admit a pose.
      const pose=!model.dynamic&&!car&&n>=48?this.repeatedPose(model,sources||data,x,y,z,yaw,tiltX,tiltZ):null;
      if(pose?.vertices)dest.set(pose.vertices,start);
      else{
        const co=Math.cos(yaw),si=Math.sin(yaw),cx=Math.cos(tiltX),sx=Math.sin(tiltX),cz=Math.cos(tiltZ),sz=Math.sin(tiltZ);
        for(let i=0,j=start;i<n;i++,j+=6){
          const p=sources?sources[i]:i*6;
          let u=data[p],v=data[p+1],w=data[p+2];
          if(tiltX){const h=v;v=h*cx-w*sx;w=h*sx+w*cx;}
          if(tiltZ){const side=u;u=side*cz-v*sz;v=side*sz+v*cz;}
          dest[j]=x+u*co+w*si;dest[j+1]=y+v;dest[j+2]=z-u*si+w*co;
          dest[j+3]=data[p+3];dest[j+4]=data[p+4];dest[j+5]=data[p+5];
        }
        if(pose)this.rememberPose(pose,dest.subarray(start,start+n*6));
      }
      this.writeIndices(indices,this.used,this.count,count,!model.dynamic);
      this.used+=n;this.count+=count;
    }
  }
  const LIGHT = `
    uniform vec3 sunDir,sunAcross,sunUp;
    vec3 lightClip(vec3 world){
      vec3 p=world-vec3(10.,6.,0.);
      return vec3(dot(p,sunAcross)/310.,dot(p,sunUp)/300.,-dot(p,sunDir)/365.);
    }`;
  // Opaque paint is affine in dye and in the sampled shadow strength. Compose
  // the frame-wide terms once. Wet asphalt, headlights and haze stay per pixel.
  const daylight=[1.055,1.018,.957],shadeLight=[.63,.72,.88],evening=[.57,.62,.77],eveningShade=[.43,.52,.68];
  const nightFloor=[.020,.026,.036],noonTint=[.932,1.015,1.054],rainTint=[.81,.88,.94];
  function paintCoefficients(out,p,glow){
    const night=p.night,dark=night*(1-glow),lit=night*glow,day=1-night;
    for(let k=0;k<3;k++){
      const gain=p.timed?(1+(noonTint[k]-1)*p.noon*day)*(1+(rainTint[k]-1)*p.rain):1;
      const sky=k===0?p.skyR:k===1?p.skyG:p.skyB;
      out[k]=(daylight[k]*day+evening[k]*dark)*gain;
      out[k+3]=((shadeLight[k]-daylight[k])*day+(eveningShade[k]-evening[k])*dark)*gain;
      out[k+6]=1.07*lit*gain;out[k+9]=nightFloor[k]*dark*gain+(p.timed?sky*.036*p.rain:0);
    }
  }
  const VERTEX = LIGHT+`
    attribute vec3 pos; attribute vec3 col;
    uniform vec3 origin,eye,rightV,upV,forwardV; uniform vec2 turn,focal; uniform vec2 depth;
    uniform vec4 tilt,waterParams; uniform float castOnly; uniform vec2 castSlope;
    varying vec3 vColor,lightCoord; varying vec2 surface; varying vec4 street; varying float haze;
    void main(){
      #if defined(STREET_SURFACE) && !defined(MODEL_SPACE)
      vec3 world=pos;
      #else
      vec3 q=vec3(pos.x,pos.y*tilt.x-pos.z*tilt.y,pos.y*tilt.y+pos.z*tilt.x);
      q=vec3(q.x*tilt.z-q.y*tilt.w,q.x*tilt.w+q.y*tilt.z,q.z);
      vec3 world=origin+vec3(q.x*turn.x+q.z*turn.y,q.y,-q.x*turn.y+q.z*turn.x);
      #ifndef STREET_SURFACE
      if(castOnly>.5){world.xz+=castSlope*(world.y-.15);world.y=.153;}
      #endif
      #endif
      vec3 rel=world-eye; float z=dot(rel,forwardV);
      gl_Position=vec4(dot(rel,rightV)*focal.x,dot(rel,upV)*focal.y,depth.x*z+depth.y,z);
      lightCoord=lightClip(world)*.5+.5;
      #ifndef STREET_SURFACE
      surface=waterParams.w>.5?world.xz:vec2(world.x+world.z*.68,world.y+world.z*.44-world.x*.17);
      #endif
      float material=floor((col.r+.25)*.5);
      street=vec4(world.xz,world.y,material);
      vColor=vec3(col.r-2.*material,col.gb); haze=smoothstep(62.,390.,z)*.68;
    }`;
  const PRECISION=`#ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif
  `;
  const FRAGMENT = PRECISION+`
    varying vec3 vColor,lightCoord; varying vec2 surface; varying vec4 street; varying float haze;
    #ifdef FRAME_PAINT
    uniform vec3 paint[4];
    #endif
    uniform vec4 waterParams,airState,driverLamp; uniform vec3 eye,skyTone; uniform vec2 immersion;
    uniform vec3 seaSun;
    uniform sampler2D vehicleLight; uniform vec3 lightArea;
    uniform sampler2D sunDepth,paper,lobbyPrint,streetLight; uniform float texel,hasShadow,castOnly,ghost,beam,dusk,glow,showPrint,lowDetail;
    float shadeAt(vec2 uv){
      vec2 rg=texture2D(sunDepth,uv).rg;
      return step(dot(rg,vec2(1.,1./255.))+.00047,lightCoord.z);
    }
    void main(){
      #ifndef STREET_SURFACE
      if(castOnly>.5){gl_FragColor=vec4(.12,.15,.24,.28*seaSun.z*(1.-haze));return;}
      if(showPrint>.5){
        vec3 dye=texture2D(lobbyPrint,vColor.rg).rgb*(1.-.14*dusk);
        gl_FragColor=vec4(mix(dye,vec3(.65,.54,.53),haze*.6),1.);return;
      }
      if(beam>.5){
        if(beam<1.5)gl_FragColor=vec4(1.,.946,.736,vColor.r*(1.-haze));
        else gl_FragColor=vec4(mix(vec3(.87,.87,.80),vec3(.63,.67,.71),dusk),vColor.r*(beam-2.)*(1.-haze));
        return;
      }
      if(ghost>.5){
        if(mod(floor(gl_FragCoord.x)+2.*floor(gl_FragCoord.y),4.)<2.)discard;
        gl_FragColor=vec4(mix(vec3(.31,.80,.78),vec3(.87,1.,.92),vColor.g),1.);return;
      }
      if(immersion.x>.5){
        vec3 point=street.xzy;
        float t=immersion.y,depth=max(0.,-point.y),distanceToEye=length(point-eye);
        vec3 water=vec3(.095,.365,.386)*(1.-.42*dusk);
        vec2 bed=point.xz;
        float rays=abs(sin(.94*bed.x+.38*bed.y+.83*t+.72*sin(.45*bed.y-.41*t))
                    +.70*sin(.59*bed.x-.86*bed.y+.53*t));
        float light=(1.-smoothstep(.025,.165,rays))*exp(-.14*depth);
        vec3 dye=vColor*vec3(.81,.99,.91)*(1.-.34*dusk)*(1.-.015*min(depth,12.));
        dye+=vec3(.14,.19,.12)*light;
        if(point.y>.20) dye=mix(vec3(.27,.59,.55),vec3(.56,.78,.65),light)*(1.-.43*dusk);
        gl_FragColor=vec4(mix(water,dye,exp(-.043*distanceToEye)),1.);return;
      }
      if(waterParams.w>.5){
        vec2 offset=surface-waterParams.xy;float d=length(offset),t=waterParams.z;
        float local=1.-smoothstep(30.,145.,d);
        float swell=sin(dot(surface,vec2(.16,.22))+1.35*t+.85*sin(surface.y*.075-t*.43));
        float ripple=sin(dot(surface,vec2(.56,-.79))+2.05*t+1.7*swell);
        float grain=lowDetail>.5?.5:texture2D(paper,surface*vec2(.008,.022)+vec2(t*.0017,-t*.0021)).r;
        float crest=smoothstep(.59,.93,.54*swell+.34*ripple+.30*grain);
        float bearing=dot(offset/max(d,.01),seaSun.xy);
        float sunset=smoothstep(.59,.99,bearing)*smoothstep(12.,95.,d)*seaSun.z;
        vec3 sea=vColor*(.94+.085*swell*local+.045*ripple*local);
        sea=mix(sea,vec3(.58,.80,.75),(.11+.32*local)*crest);
        sea=mix(sea,vec3(1.,.77,.57),sunset*(.065+.40*crest)*(1.-haze*.65));
        vec3 seaMist=vec3(.84,.69,.68);
        if(dusk>0.){
          vec3 evening=sea*vec3(.39,.48,.65)+vec3(.035,.037,.058);
          evening+=vec3(.15,.064,.062)*sunset*crest;
          sea=mix(sea,evening,dusk);seaMist=mix(seaMist,vec3(.54,.39,.46),dusk);
        }
        if(airState.w>.5){
          seaMist=mix(skyTone,seaMist,.18);
          sea=mix(sea,skyTone*.71+.085*crest,airState.x*.47);
          sea+=vec3(.09,.13,.14)*airState.z*crest*(1.-dusk);
        }
        gl_FragColor=vec4(mix(sea,seaMist,haze*.83),1.);return;
      }
      #endif
      float shade=0.;
      if(hasShadow>.005&&all(greaterThan(lightCoord.xy,vec2(.001)))&&all(lessThan(lightCoord.xy,vec2(.999)))){
        #ifdef STREET_SURFACE
        shade=shadeAt(lightCoord.xy)*hasShadow;
        #else
        if(lowDetail>.5)shade=shadeAt(lightCoord.xy)*hasShadow;
        else{
        vec2 cell=lightCoord.xy/texel-.5;
        vec2 uv=(floor(cell)+.5)*texel,weight=fract(cell);
        float a=mix(shadeAt(uv),shadeAt(uv+vec2(texel,0.)),weight.x);
        float b=mix(shadeAt(uv+vec2(0.,texel)),shadeAt(uv+vec2(texel)),weight.x);
        shade=mix(a,b,weight.y)*hasShadow;}
        #endif
      }
      #ifdef STREET_SURFACE
      const float fleck=0.,wash=0.;
      #else
      float fleck=lowDetail>.5?0.:texture2D(paper,surface*.115).r-.5;
      float wash=lowDetail>.5?0.:texture2D(paper,surface*.011).r-.5;
      #endif
      #ifdef FRAME_PAINT
      // Start both programs from the same interpolated dye. Prelighting each
      // vertex amplifies interpolation error on thin, distant street triangles.
      vec3 ink=mix(vec3(dot(vColor,vec3(.25,.58,.17))),vColor,1.08);
      vec3 color=ink*(paint[0]+paint[1]*shade)+vColor*paint[2]+paint[3];
      vec3 mist=mix(vec3(.87,.691,.651),vec3(.56,.405,.465),dusk);
      #else
      vec3 ink=mix(vec3(dot(vColor,vec3(.25,.58,.17))),vColor,1.08);
      vec3 light=mix(vec3(1.055,1.018,.957),vec3(.63,.72,.88),shade);
      vec3 color=ink*light*(1.+fleck*.056+wash*.030);
      vec3 mist=vec3(.87,.691,.651);
      if(dusk>0.){
        // Cool skylight keeps lane paint legible. The last sunlight still has a direction.
        vec3 evening=mix(vec3(.57,.62,.77),vec3(.43,.52,.68),shade);
        vec3 night=ink*evening*(1.+fleck*.044+wash*.022)+vec3(.020,.026,.036);
        color=mix(color,mix(night,vColor*1.07,glow),dusk);
        mist=mix(mist,vec3(.56,.405,.465),dusk);
      }
      #endif
      if(airState.w>.5){
        float lampTime=max(dusk,.53*airState.x);
        float lowSurface=1.-smoothstep(.27,4.4,street.z);
        #ifndef FRAME_PAINT
        color*=mix(vec3(1.),vec3(.932,1.015,1.054),airState.z*(1.-dusk));
        color=mix(color,color*vec3(.81,.88,.94)+skyTone*.036,airState.x);
        #endif
        mist=skyTone;
        if(street.w>.5&&street.w<1.5&&airState.y>.012){
          vec2 road=street.xy;
          vec2 axis=abs(mod(road+36.,72.)-36.);
          vec2 asphalt=axis.x<axis.y?road:road.yx;
          // Most standing water collects toward the kerb. The crown keeps a continuous dull sheen.
          float shoulder=smoothstep(1.35,5.6,min(axis.x,axis.y));
          float depression=smoothstep(.42,.71,texture2D(paper,asphalt*vec2(.024,.006)).r+.13*wash);
          float grazing=1.-clamp((eye.y-street.z)/max(2.,length(road-eye.xz)),0.,1.);
          color=mix(color,color*vec3(.54,.66,.77),airState.y*.86);
          float surfaceFilm=.12+.11*grazing+depression*(.055+.23*shoulder)*grazing;
          color=mix(color,skyTone*(.51+.22*grazing),airState.y*surfaceFilm);
        }
        if(lampTime>.02&&lowSurface>.001){
          vec3 pool=texture2D(streetLight,street.xy/464.+.5).rgb;
          color+=pool*lowSurface*lampTime*(.25+.155*airState.y);
          if(dot(driverLamp.zw,driverLamp.zw)>.5){
            vec2 gap=street.xy-driverLamp.xy;
            float ahead=dot(gap,driverLamp.zw),side=abs(dot(gap,vec2(driverLamp.w,-driverLamp.z)));
            float fan=smoothstep(1.3,3.,ahead)*(1.-smoothstep(12.,29.,ahead));
            float width=max(.49,.48+.19*ahead),fromLens=abs(side-(.62+.025*ahead));
            fan*=1.-smoothstep(width*.2,width,fromLens);
            color+=vec3(.32,.27,.164)*fan*lowSurface*lampTime*(1.+.27*airState.y);
          }
        }
        if(lightArea.z>0.&&street.z<5.4){
          vec2 uv=(street.xy-lightArea.xy)*vec2(lightArea.z,-lightArea.z);
          if(all(greaterThanEqual(uv,vec2(0.)))&&all(lessThan(uv,vec2(1.)))){
            vec3 lights=texture2D(vehicleLight,uv).rgb;
            color+=lights*(1.-smoothstep(1.,5.4,street.z))*(.56+.13*airState.y);
            if(street.w>6.5)color=mix(color,min(vec3(1.),vColor*1.4),smoothstep(.015,.23,max(lights.g,lights.b)));
          }
        }
        if(lampTime>.01&&street.w>1.5&&street.w<6.5){
          if(street.w<2.5)color=mix(color,vec3(.96,.745,.47),dusk*.81);
          else if(street.w<3.5)color=mix(color,vec3(.60,.79,.78),dusk*.65);
          else if(street.w<4.5)color=mix(color,min(vec3(1.),vColor*1.18+vec3(.035)),dusk*.96);
          else if(street.w<5.5)color=mix(color,vec3(1.,.976,.825),lampTime);
          else color=mix(color,vec3(.91,.27,.245),lampTime*.88);
        }
      }
      gl_FragColor=vec4(mix(color,mist,haze),1.);
    }`;
  const SUNVERT=LIGHT+`attribute vec3 pos;void main(){gl_Position=vec4(lightClip(pos),1.);}`;
  const SUNFRAG=PRECISION+`void main(){vec2 rg=fract(gl_FragCoord.z*vec2(1.,255.));rg.x-=rg.y/255.;gl_FragColor=vec4(rg,0.,1.);}`;
  class View {
    constructor(canvas) {
      this.canvas=canvas; this.gl=null; this.models=new Map(); this.cpu=new Map(); this.animated=new Set();this.actors=new Map();
      this.scale=1; this.maxWidth=1180; this.maxHeight=760; this.lost=false;
      try {
        this.gl=canvas.getContext("webgl",{alpha:true,depth:true,stencil:true,antialias:false,powerPreference:"low-power",preserveDrawingBuffer:false});
        if(this.gl) this.setup();
      } catch { this.gl=null; }
      canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();this.lost=true;});
      canvas.addEventListener("webglcontextrestored",()=>{this.lost=false;this.models.clear();try{this.setup();for(const [name,data] of this.cpu)this.upload(name,data);}catch{this.gl=null;}});
    }
    setup(){
      const gl=this.gl;
      this.streetBatch=null;
      const compile=(kind,src)=>{const sh=gl.createShader(kind);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
      const program=(vs,fs,attributes)=>{const p=gl.createProgram(),v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs);
        gl.attachShader(p,v);gl.attachShader(p,f);
        if(attributes)for(const [name,location] of Object.entries(attributes))gl.bindAttribLocation(p,location,name);
        gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);
        if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;};
      const p=this.program=program(VERTEX,FRAGMENT);this.sunProgram=program(SUNVERT,SUNFRAG);gl.useProgram(p);
      this.largeIndices=!!gl.getExtension("OES_element_index_uint");
      this.multiDraw=gl.getExtension("WEBGL_multi_draw");
      this.u={};for(const key of ["origin","eye","rightV","upV","forwardV","turn","focal","depth","tilt","castOnly","ghost","beam","waterParams","sunDepth","paper","texel","hasShadow","dusk","glow","lobbyPrint","showPrint","streetLight","airState","skyTone","driverLamp","immersion"])this.u[key]=gl.getUniformLocation(p,key);
      this.u.lowDetail=gl.getUniformLocation(p,"lowDetail");this.glow=0;
      this.sunKey=null;this.sunTarget=null;this.sunStrength=0;
      for(const key of ["castSlope","seaSun","sunDir","sunAcross","sunUp"])this.u[key]=gl.getUniformLocation(p,key);
      this.sunUniforms={};
      for(const key of ["sunDir","sunAcross","sunUp"])this.sunUniforms[key]=gl.getUniformLocation(this.sunProgram,key);
      this.pos=gl.getAttribLocation(p,"pos");this.col=gl.getAttribLocation(p,"col");
      // The city and streamed props already use world coordinates. Individual
      // solid models keep their chassis or joint transform in the vertex shader.
      const n=.13,f=1100;
      this.createStreetSurface=(modelSpace,framePaint)=>{
        const define="#define STREET_SURFACE\n"+(framePaint?"#define FRAME_PAINT\n":"");
        const prefix=modelSpace?"#define MODEL_SPACE\n":"";
        const solid=program(prefix+define+VERTEX,define+FRAGMENT,{pos:this.pos,col:this.col}),u={};
        for(const name of ["origin","turn","tilt","eye","rightV","upV","forwardV","focal","depth","sunDir","sunAcross","sunUp","sunDepth","paper","vehicleLight","streetLight","hasShadow","airState","dusk","skyTone","lightArea","driverLamp","glow"])
          u[name]=gl.getUniformLocation(solid,name);
        gl.useProgram(solid);
        for(const [name,unit] of [["sunDepth",0],["paper",1],["streetLight",3],["vehicleLight",4]])gl.uniform1i(u[name],unit);
        gl.uniform2f(u.depth,(f+n)/(f-n),-2*f*n/(f-n));
        u.paint=framePaint?gl.getUniformLocation(solid,"paint[0]"):null;
        return {program:solid,u,frame:null,glow:NaN,paint:framePaint?new Float32Array(12):null};
      };
      const surface=modelSpace=>{
        try{return this.createStreetSurface(modelSpace,true);}
        catch{return this.createStreetSurface(modelSpace,false);}
      };
      this.streetSurface=surface(false);this.modelSurface=surface(true);
      gl.useProgram(p);this.streetFrame=null;this.shadowAxes=null;
      gl.enableVertexAttribArray(this.pos);gl.enableVertexAttribArray(this.col);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
      gl.clearColor(0,0,0,0);gl.uniform2f(this.u.depth,(f+n)/(f-n),-2*f*n/(f-n));
      this.stencil=gl.getContextAttributes().stencil;this.shadowTexture=gl.createTexture();this.paper=gl.createTexture();
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.NEAREST);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
      gl.activeTexture(gl.TEXTURE1);gl.bindTexture(gl.TEXTURE_2D,this.paper);
      const grain=new Uint8Array(64*64);let seed=32187;
      for(let i=0;i<grain.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;grain[i]=seed>>>24;}
      gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,64,64,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,grain);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.generateMipmap(gl.TEXTURE_2D);
      gl.activeTexture(gl.TEXTURE2);
      this.printSlots=[{texture:gl.createTexture(),source:null,used:0}];this.printTick=0;this.boundPrint=this.printSlots[0];
      gl.bindTexture(gl.TEXTURE_2D,this.boundPrint.texture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
      gl.activeTexture(gl.TEXTURE3);this.streetTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.streetTexture);
      const lamps=window.BayCoastArt?.lightTexture()||{pixels:new Uint8Array(4),size:1};
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,lamps.size,lamps.size,0,gl.RGBA,gl.UNSIGNED_BYTE,lamps.pixels);
      gl.activeTexture(gl.TEXTURE4);this.vehicleLight=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.vehicleLight);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array(4));
      this.lightVersion=-1;this.lightSize=1;this.u.lightArea=gl.getUniformLocation(p,"lightArea");
      gl.uniform1i(gl.getUniformLocation(p,"vehicleLight"),4);
      gl.uniform1i(this.u.sunDepth,0);gl.uniform1i(this.u.paper,1);gl.uniform1i(this.u.lobbyPrint,2);gl.uniform1i(this.u.streetLight,3);
      gl.uniform4f(this.u.tilt,1,0,1,0);gl.activeTexture(gl.TEXTURE0);
    }
    add(name,mesh,animated=false){
      if(!this.gl)return;
      const data=mesh.vertices instanceof Float32Array?mesh.vertices:new Float32Array(mesh.vertices);
      if(name==="city")tagMaterials(data,builtMaterials);
      else if(name==="cut-guides")tagMaterials(data,new Map([[0xe7e0bf,7],[0xc8965a,7]]));
      else if(name.startsWith("traffic-shell/")||/^(coupe|van|cab|hatch|cruiser|wrecker|ambulance|cayo|marea|solena|estate|stepside|caleta|pumper)#/.test(name))tagMaterials(data,carMaterials);
      if(mesh.poseIndices)(this.poseIndices??=new Map()).set(name,mesh.poseIndices);else this.poseIndices?.delete(name);
      if(animated)this.animated.add(name);
      if(animated&&window.BayPlayerMesh&&mesh instanceof BayPlayerMesh)this.actors.set(name,mesh);
      else this.actors.delete(name);
      this.cpu.set(name,data);if(!this.lost)this.upload(name,data);
    }
    upload(name,data){
      const gl=this.gl,buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      const dynamic=this.animated.has(name),rig=this.actors.get(name);
      const poseIndices=this.poseIndices?.get(name);
      const packed=poseIndices?{vertices:data,indices:poseIndices}:rig?indexActor(data,rig,this.largeIndices):dynamic?null:indexGeometry(data,this.largeIndices);
      gl.bufferData(gl.ARRAY_BUFFER,packed?.vertices||data,dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
      const count=poseIndices?.length||data.length/6,model={buf,count,dynamic,packedPose:!!poseIndices,vertexCount:packed?packed.vertices.length/6:count};
      if(packed){
        model.indices=packed.indices;model.elementType=model.indices.BYTES_PER_ELEMENT===2?gl.UNSIGNED_SHORT:gl.UNSIGNED_INT;
        model.elements=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,model.indices,gl.STATIC_DRAW);
      }
      model.actor=!!rig;model.crowdDetail=name.startsWith("sidewalk/far/");
      if(rig&&packed){
        model.actorStream=packed.vertices.slice();model.copies=packed.copies;model.batchSources=packed.sources;
      }
      if(count&&(!dynamic||model.actor))model.bounds=meshBounds(data,0,count);
      if(name==="city"||!dynamic&&count>2400&&model.bounds.r>17){
        // Keep the original order of windows, paint and coplanar signs. Nearby
        // shop details can share a draw even when the next shop is behind us.
        model.sections=[];
        const step=this.multiDraw?96:288;
        for(let first=0;first<count;first+=step){
          const end=Math.min(count,first+step);
          model.sections.push({first,end,bounds:meshBounds(data,first,end)});
        }
        if(this.multiDraw){
          model.starts=new Int32Array(model.sections.length);
          model.counts=new Int32Array(model.sections.length);
        }
        if(name==="city"){model.city=true;this.sunKey=null;}
        else if(model.indices)model.worldSections=true;
      }
      this.models.set(name,model);
    }
    prepareDistanceMesh(model,data){
      model.distanceReady=true;
      if(model.count>65535&&!this.largeIndices)return;
      const sections=model.sections||[{first:0,end:model.count,bounds:model.bounds}],indices=[];
      for(const part of sections){
        part.indexStart=indices.length;
        distantTriangles(data,part.first,part.end,indices);
        part.indexCount=indices.length-part.indexStart;
      }
      // A distant car or person must still have an outline.
      if(indices.length<18||indices.length>model.count*.8)return;
      if((model.city||model.worldSections)&&model.indices){
        model.farKeep=new Uint8Array(model.count/3);
        for(let i=0;i<indices.length;i+=3)model.farKeep[indices[i]/3]=1;
      }
      if(!model.sections&&model.count<=65532){
        const sources=[],local=new Uint16Array(indices.length),byVertex=new Map();
        for(let i=0;i<indices.length;i++){
          const corner=indices[i],id=model.indices?model.indices[corner]:corner;
          if(!byVertex.has(id)){byVertex.set(id,sources.length);sources.push(corner*6);}
          local[i]=byVertex.get(id);
        }
        model.batchDistant={indices:local,sources:new Uint32Array(sources)};
      }
      if(model.indices)for(let i=0;i<indices.length;i++)indices[i]=model.indices[indices[i]];
      const gl=this.gl,large=model.indices?model.indices.BYTES_PER_ELEMENT===4:model.count>65535;
      model.distant=gl.createBuffer();model.indexSize=large?4:2;model.indexType=large?gl.UNSIGNED_INT:gl.UNSIGNED_SHORT;
      model.indexCount=indices.length;
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.distant);
      const Index=large?Uint32Array:Uint16Array;
      if(this.multiDraw&&model.sections){
        // Near and far sections share a buffer so one ordered command can mix both.
        const joined=new Index(model.count+indices.length);
        if(model.indices)joined.set(model.indices);
        else for(let i=0;i<model.count;i++)joined[i]=i;
        joined.set(indices,model.count);gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,joined,gl.STATIC_DRAW);
      }else gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,new Index(indices),gl.STATIC_DRAW);
    }
    drawSections(model,reduced,x,y,z,yaw,tiltX,tiltZ,pad){
      const gl=this.gl,packed=reduced&&model.distant;
      const elements=packed||model.elements;
      const bytes=packed?model.indexSize:elements?model.indices.BYTES_PER_ELEMENT:1;
      let runs=0,lastEnd=-1;
      for(const part of model.sections){
        if(!this.inFrame(part.bounds,x,y,z,yaw,tiltX,tiltZ,pad))continue;
        const far=packed&&!tiltX&&!tiltZ&&this.farFromCamera(part.bounds,x,y,z,yaw);
        const start=far?model.count+part.indexStart:part.first,count=far?part.indexCount:part.end-part.first;
        if(!count)continue;
        if(lastEnd===start)model.counts[runs-1]+=count;
        else{model.starts[runs]=start*bytes;model.counts[runs++]=count;}
        lastEnd=start+count;
      }
      if(!runs)return;
      if(elements){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,elements);
        this.multiDraw.multiDrawElementsWEBGL(gl.TRIANGLES,model.counts,0,packed?model.indexType:model.elementType,model.starts,0,runs);
      }else this.multiDraw.multiDrawArraysWEBGL(gl.TRIANGLES,model.starts,0,model.counts,0,runs);
    }
    farFromCamera(b,x=0,y=0,z=0,yaw=0){
      const eye=this.basis.camera,c=Math.cos(yaw),s=Math.sin(yaw);
      const dx=x+c*b.x+s*b.z-eye.x,dy=y+b.y-eye.y,dz=z+c*b.z-s*b.x-eye.z;
      return dx*dx+dy*dy+dz*dz>(55+b.r)*(55+b.r);
    }
    updateAnimated(name,deferUpload=false){
      const model=this.models.get(name);if(!model||this.lost)return;
      // A crowd pose enters the low-resolution street batch directly from CPU memory.
      // Its own GPU buffer is needed only if a shadow or individual draw uses it.
      if(deferUpload){model.needsUpload=true;return;}
      if(model.actor){model.poseChanged=true;model.needsUpload=true;model.checkCopies=!!model.copies;return;}
      const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,model.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,this.cpu.get(name));this.bound=null;
    }
    checkActorCopies(model,data){
      // Props and custom costumes can edit an individual corner after skinning.
      // Restore the original stream for that actor as soon as a painted seam opens.
      model.checkCopies=false;
      const pairs=model.copies;
      for(let i=0;i<pairs.length;i+=2){
        const p=pairs[i],q=pairs[i+1];
        if(data[p]===data[q]&&data[p+1]===data[q+1]&&data[p+2]===data[q+2]&&
          data[p+3]===data[q+3]&&data[p+4]===data[q+4]&&data[p+5]===data[q+5])continue;
        this.gl.deleteBuffer(model.elements);
        model.indices=model.elements=model.batchSources=model.actorStream=model.copies=null;
        model.vertexCount=model.count;model.resizePose=true;break;
      }
    }
    prepareSun(){
      const gl=this.gl,sz=Math.min(1024,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,sz,sz,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      const fbo=gl.createFramebuffer(),rb=gl.createRenderbuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.bindRenderbuffer(gl.RENDERBUFFER,rb);
      gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,sz,sz);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.shadowTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
      const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindRenderbuffer(gl.RENDERBUFFER,null);
      gl.uniform1f(this.u.texel,1/sz);
      return {fbo,rb,sz,ok};
    }
    sunAxes(u){
      const {x,y,z,h}=this.shadowAxes,gl=this.gl;
      gl.uniform3f(u.sunDir,x,y,z);gl.uniform3f(u.sunAcross,z/h,0,-x/h);gl.uniform3f(u.sunUp,-x*y/h,h,-z*y/h);
    }
    updateSun(weather,dusk){
      const gl=this.gl,city=this.models.get("city");
      const ray=weather?.sun||BayHours.sunlight(weather?.minute??990);
      this.sunStrength=ray.strength*(1-.88*(weather?.rain||0))*(1-dusk);
      this.castX=ray.dx;this.castZ=ray.dz;
      const flat=Math.hypot(ray.x,ray.z);
      gl.uniform3f(this.u.seaSun,ray.x/flat,ray.z/flat,this.sunStrength);
      gl.uniform2f(this.u.castSlope,this.castX,this.castZ);
      if(!city||this.sunStrength<.006){gl.uniform1f(this.u.hasShadow,0);return;}
      const key=Math.round((weather?.minute??990)/10);
      const target=this.sunTarget??=this.prepareSun();
      if(target.ok&&this.sunKey!==key){
        const {sz,fbo}=target;
        const sun=BayHours.sunlight(key*10),len=Math.hypot(sun.dx,1,sun.dz);
        const x=-sun.dx/len,y=1/len,z=-sun.dz/len,h=Math.hypot(x,z);
        this.shadowAxes={x,y,z,h};
        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.disable(gl.SCISSOR_TEST);
        gl.useProgram(this.sunProgram);gl.viewport(0,0,sz,sz);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        this.sunAxes(this.sunUniforms);
        gl.disableVertexAttribArray(this.pos);gl.disableVertexAttribArray(this.col);
        const p=gl.getAttribLocation(this.sunProgram,"pos");gl.enableVertexAttribArray(p);gl.bindBuffer(gl.ARRAY_BUFFER,city.buf);gl.vertexAttribPointer(p,3,gl.FLOAT,false,24,0);
        gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.1,1.8);drawRange(gl,city,0,city.count);gl.disable(gl.POLYGON_OFFSET_FILL);gl.disableVertexAttribArray(p);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(this.program);this.sunAxes(this.u);
        gl.enableVertexAttribArray(this.pos);gl.enableVertexAttribArray(this.col);
        this.sunKey=key;this.bound=null;
      }
      gl.uniform1f(this.u.hasShadow,target.ok?this.sunStrength:0);
    }
    begin(camera,dusk=0,weather=null,headlights=null,seaTime=null,inset=null){
      if(!this.gl||this.lost)return;
      this.streetWalls=null;
      const gl=this.gl,c=this.canvas, factor=Math.min(this.maxWidth/innerWidth,this.maxHeight/innerHeight,devicePixelRatio||1)*this.scale;
      gl.uniform1f(this.u.lowDetail,this.scale<=.65?1:0);
      if(weather)this.updateSun(weather,dusk);
      else gl.uniform1f(this.u.hasShadow,0);
      const fullWidth=inset?inset.w:Math.max(2,Math.round(innerWidth*factor)),h=inset?inset.h:Math.max(2,Math.round(innerHeight*factor));
      const w=inset?fullWidth:Math.min(fullWidth,Math.max(320,Math.round(fullWidth*(this.widthScale??1))));
      // The display and photo gate keep their shape as the number of samples
      // across a scanline changes. Rear-view mirrors use their own viewport.
      const aspect=fullWidth/h;
      if(inset){gl.enable(gl.SCISSOR_TEST);gl.scissor(0,0,w,h);}
      else{
        gl.disable(gl.SCISSOR_TEST);
        if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
        c.bayFrameAspect=aspect;
      }
      if(seaTime===null)gl.clearColor(0,0,0,0);
      else{const light=1-.42*dusk;gl.clearColor(.095*light,.365*light,.386*light,1);}
      gl.uniform2f(this.u.immersion,seaTime===null?0:1,(seaTime||0)%2048);
      gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
      const sn=Math.sin(camera.yaw),cs=Math.cos(camera.yaw),sp=Math.sin(camera.pitch),cp=Math.cos(camera.pitch);
      const focal=camera.focal||1.5;this.basis={sn,cs,sp,cp,camera,f:focal,aspect};this.bound=null;this.tiltX=NaN;this.tiltZ=NaN;
      const horizontal=aspect/focal,vertical=1/focal;
      Object.assign(this.basis,{horizontal,vertical,xMargin:Math.hypot(1,horizontal),yMargin:Math.hypot(1,vertical)});
      const fx=sn*cp,fy=sp,fz=cs*cp,ux=-sn*sp,uz=-cs*sp;
      this.basis.planes=[[fx*horizontal+cs,fy*horizontal,fz*horizontal-sn],
        [fx*horizontal-cs,fy*horizontal,fz*horizontal+sn],[fx*vertical+ux,fy*vertical+cp,fz*vertical+uz],
        [fx*vertical-ux,fy*vertical-cp,fz*vertical-uz]];
      const timed=weather&&Number.isFinite(weather.minute),night=Math.max(0,Math.min(1,Math.max(dusk||0,timed?weather.night||0:0)));
      const rain=timed?weather.rain||0:0,wet=timed?weather.wet||0:0;
      const noon=timed?Math.max(0,1-Math.abs(weather.minute-730)/325):0;
      const dawn=timed?Math.max(0,1-Math.abs(weather.minute-395)/123):0;
      const dark=1-night,clear=1-rain*.68;
      const skyR=(.895-.14*noon-.08*dawn)*dark*clear+.30*night*clear+(.58-.30*night)*(1-clear),
        skyG=(.681+.17*noon+.13*dawn)*dark*clear+.345*night*clear+(.63-.31*night)*(1-clear),
        skyB=(.626+.19*noon+.13*dawn)*dark*clear+.41*night*clear+(.66-.29*night)*(1-clear);
      const field=timed&&seaTime===null&&this.roadLights;
      if(field?.enabled){
        if(this.lightVersion!==field.version){
          gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,this.vehicleLight);
          if(this.lightSize!==field.size){
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,field.size,field.size,0,gl.RGBA,gl.UNSIGNED_BYTE,field.pixels);this.lightSize=field.size;
          }else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,field.size,field.size,gl.RGBA,gl.UNSIGNED_BYTE,field.pixels);
          gl.activeTexture(gl.TEXTURE0);this.lightVersion=field.version;
        }
      }
      const frame={night,rain,wet,noon,timed,skyR,skyG,skyB,field:field?.enabled?field:null,lamp:timed&&!field?headlights:null,
        x:camera.x,y:camera.y,z:camera.z,cs,sn,ux,uz,cp,fx,fy,fz,focal,fxScreen:focal/aspect,underwater:seaTime!==null,
        shadow:weather&&this.sunTarget?.ok&&this.sunStrength>=.006?this.sunStrength:0};
      this.streetFrame=frame;this.setFrameUniforms(this.u,frame);
    }
    setFrameUniforms(u,p){
      const gl=this.gl,l=p.lamp,f=p.field;
      gl.uniform1f(u.dusk,p.night);gl.uniform4f(u.airState,p.rain,p.wet,p.noon,p.timed?1:0);gl.uniform3f(u.skyTone,p.skyR,p.skyG,p.skyB);
      gl.uniform3f(u.lightArea,f?f.left:0,f?f.north:0,f?1/f.span:0);
      gl.uniform4f(u.driverLamp,l?l.x:0,l?l.z:0,l?Math.sin(l.yaw):0,l?Math.cos(l.yaw):0);
      gl.uniform3f(u.eye,p.x,p.y,p.z);gl.uniform3f(u.rightV,p.cs,0,-p.sn);
      gl.uniform3f(u.upV,p.ux,p.cp,p.uz);gl.uniform3f(u.forwardV,p.fx,p.fy,p.fz);gl.uniform2f(u.focal,p.fxScreen,p.focal);
    }
    beginStreetSurface(glow,modelSpace=false){
      const frame=this.streetFrame,surface=modelSpace?this.modelSurface:this.streetSurface;
      if(!frame||this.scale>.65||frame.underwater||this.casting||!surface||modelSpace&&!frame.timed)return false;
      const gl=this.gl,u=surface.u;gl.useProgram(surface.program);
      const newFrame=surface.frame!==frame;
      if(newFrame){
        this.setFrameUniforms(u,frame);gl.uniform1f(u.hasShadow,frame.shadow);
        if(frame.shadow&&this.shadowAxes)this.sunAxes(u);surface.frame=frame;
      }
      if(newFrame||surface.glow!==glow){
        if(surface.paint){paintCoefficients(surface.paint,frame,glow);gl.uniform3fv(u.paint,surface.paint);}
        gl.uniform1f(u.glow,glow);surface.glow=glow;
      }
      return true;
    }
    trafficVisible(x,y,z){
      // A closed road car, lamps, mirrors and plate rotate about the same origin.
      // The loose sphere covers the longest van in any pitch or roll.
      return this.inFrame(trafficBounds,x,y,z,0,0,0);
    }
    inFrame(b,x,y,z,yaw,tiltX,tiltZ,pad=0){
      const v=this.basis;if(!v||!b)return true;
      let u=b.x,h=b.y,n=b.z,r=b.r+pad;
      if(tiltX){const c=Math.cos(tiltX),s=Math.sin(tiltX),old=h;h=h*c-n*s;n=old*s+n*c;}
      if(tiltZ){const c=Math.cos(tiltZ),s=Math.sin(tiltZ),old=u;u=u*c-h*s;h=old*s+h*c;}
      if(yaw){const c=Math.cos(yaw),s=Math.sin(yaw),old=u;u=u*c+n*s;n=n*c-old*s;}
      x+=u;y+=h;z+=n;
      if(this.casting){x+=this.castX*(y-.15);z+=this.castZ*(y-.15);y=.153;r*=Math.hypot(1,this.castX,this.castZ);}
      x-=v.camera.x;y-=v.camera.y;z-=v.camera.z;
      const along=x*v.sn+z*v.cs,depth=along*v.cp+y*v.sp;
      const side=x*v.cs-z*v.sn,up=y*v.cp-along*v.sp;
      if(depth+r<.13||depth-r>1100||Math.abs(side)>depth*v.horizontal+r*v.xMargin||
        Math.abs(up)>depth*v.vertical+r*v.yMargin)return false;
      let hw=r,hh=r,hd=r;
      if(b.hw!==undefined&&!this.casting&&!tiltX&&!tiltZ){
        hw=b.hw+pad;hh=b.hh+pad;hd=b.hd+pad;
        if(yaw){const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw)),w=hw;hw=c*w+s*hd;hd=s*w+c*hd;}
      }
      if(b.hw!==undefined&&v.planes&&!this.casting&&!tiltX&&!tiltZ&&b.r>2){
        for(const [nx,ny,nz] of v.planes){
          if(nx*x+ny*y+nz*z+Math.abs(nx)*hw+Math.abs(ny)*hh+Math.abs(nz)*hd<0)return false;
        }
      }
      return !(this.streetWalls&&depth>2&&this.streetHidden(x,y,z,hw,hh,hd,r,depth,side,up));
    }
    streetHidden(x,y,z,hw,hh,hd,r,depth,side,up){
      const grid=this.wallGrid,walls=grid&&grid.walls===this.streetWalls&&grid.basis===this.basis&&depth>2
        ?grid.candidates(depth,side,up):this.streetWalls;
      for(const f of walls){
        if(f.axis===0?behindWall(f,x,hw,z,hd,y,hh):f.axis===2?behindWall(f,z,hd,x,hw,y,hh):behindWall(f,y,hh,x,hw,z,hd))return true;
      }
      return false;
    }
    project(x,y,z){
      if(!this.basis)return null;
      const {sn,cs,sp,cp,camera,f,aspect}=this.basis,dx=x-camera.x,dy=y-camera.y,dz=z-camera.z;
      const along=dx*sn+dz*cs,depth=along*cp+dy*sp;if(depth<=.2)return null;
      return {x:(.5+(dx*cs-dz*sn)*f/(aspect*depth)*.5)*innerWidth,y:(.5-(dy*cp-along*sp)*f/depth*.5)*innerHeight,depth};
    }
    beginShadow(){
      if(!this.stencil||this.sunStrength<.025)return false;this.casting=true;const gl=this.gl;gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);
      gl.enable(gl.STENCIL_TEST);gl.stencilFunc(gl.EQUAL,0,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);gl.uniform1f(this.u.castOnly,1);return true;
    }
    endShadow(){this.casting=false;const gl=this.gl;gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.STENCIL_TEST);gl.uniform1f(this.u.castOnly,0);}
    drawEffect(name,x=0,y=0,z=0,yaw=0,pitch=0){
      this.effectPass=true;
      try{this.draw(name,x,y,z,yaw,pitch);}finally{this.effectPass=false;}
    }
    drawGhost(name,x,y,z,yaw){
      this.gl.uniform1f(this.u.ghost,1);this.drawEffect(name,x,y,z,yaw);this.gl.uniform1f(this.u.ghost,0);
    }
    drawOpaque(list){this.drawStreetList(list);}
    drawStreetList(list){
      if(this.scale>.75){for(const item of list)this.draw(...item);return;}
      const batch=this.streetBatch??=new StreetBatch(this);
      batch.buildDetail=true;
      for(const item of list)batch.append(item);
      batch.flush();
    }
    collectStreetWalls(){
      this.streetWalls=null;
      if(this.scale<=.75&&this.buildings){
        const v=this.basis,c=v.camera,walls=[],near=.13*Math.hypot(1,v.horizontal,v.vertical)+.01;
        for(const b of this.buildings){
          const x=b.x-c.x,y=b.y-c.y,z=b.z-c.z;
          if(Math.abs(x)>145||Math.abs(z)>145||!this.inFrame(b,0,0,0,0,0,0))continue;
          wallFace(walls,0,x,b.hw,z,b.hd,y,b.hh,near);
          wallFace(walls,2,z,b.hd,x,b.hw,y,b.hh,near);
          wallFace(walls,1,y,b.hh,x,b.hw,z,b.hd,near);
        }
        walls.sort((a,b)=>a.front-b.front);
        this.streetWalls=walls;
        if(walls.length>=12)(this.wallGrid??=new WallGrid()).build(walls,v);
      }
    }
    drawCityAndWater(t){
      this.collectStreetWalls();
      this.draw("city");
      // Opaque land masks the water shader. Keep city surfaces on equal-depth shore pixels.
      const gl=this.gl;gl.depthFunc(gl.LESS);this.drawWater(t);gl.depthFunc(gl.LEQUAL);
    }
    drawWater(t){
      const gl=this.gl,eye=this.basis.camera;gl.uniform4f(this.u.waterParams,eye.x,eye.z,t,1);
      this.drawEffect("bay-water");gl.uniform4f(this.u.waterParams,0,0,0,0);
    }
    drawPrint(name,canvas,revision,x,y,z,yaw,tiltX=0){
      if(!this.gl||this.lost||!this.models.has(name))return;
      const gl=this.gl;
      // A window print and the moving curb television can share one street view.
      // Retain a few surfaces so changing which one is drawn only changes a binding.
      let slot=this.printSlots.find(s=>s.source===canvas);
      if(!slot){
        slot=this.printSlots.find(s=>!s.source);
        if(!slot&&this.printSlots.length<4){slot={texture:gl.createTexture()};this.printSlots.push(slot);}
        if(!slot)slot=this.printSlots.reduce((a,b)=>a.used<b.used?a:b);
      }
      slot.used=++this.printTick;
      const changed=slot.source!==canvas||slot.revision!==revision;
      if(this.boundPrint!==slot||changed){
        gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,slot.texture);this.boundPrint=slot;
        if(changed){
          gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
          const mip=canvas.width>0&&!(canvas.width&(canvas.width-1))&&canvas.height>0&&!(canvas.height&(canvas.height-1));
          if(mip)gl.generateMipmap(gl.TEXTURE_2D);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
          gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,mip?gl.LINEAR_MIPMAP_LINEAR:gl.LINEAR);
          slot.source=canvas;slot.revision=revision;
        }
        gl.activeTexture(gl.TEXTURE0);
      }
      gl.uniform1f(this.u.showPrint,1);this.drawEffect(name,x,y,z,yaw,tiltX);gl.uniform1f(this.u.showPrint,0);
    }
    drawSearchlight(name){
      const gl=this.gl;gl.depthMask(false);gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(this.u.beam,1);this.drawEffect(name);gl.uniform1f(this.u.beam,0);
      gl.disable(gl.BLEND);gl.depthMask(true);
    }
    draw(name,x=0,y=0,z=0,yaw=0,tiltX=0,tiltZ=0,glow=0,vehicle=null,doorSide=0,vapor=0){
      if(vapor&&this.casting)return;
      const base=this.models.get(name);
      if(!base?.count)return;
      if(base.poseChanged){base.bounds=meshBounds(this.cpu.get(name),0,base.count);base.poseChanged=false;}
      if(!this.inFrame(base.bounds,x,y,z,yaw,tiltX,tiltZ,vehicle?.damage?1.4:0))return;
      if(base.checkCopies)this.checkActorCopies(base,this.cpu.get(name));
      const model=vehicle?.damage?BayBodyworkArt.buffer(this,name,vehicle,doorSide):base,gl=this.gl;
      if(!model)return;
      if(base.needsUpload){
        const data=this.cpu.get(name),stream=base.actorStream;
        if(stream)for(let i=0,j=0;i<base.batchSources.length;i++){
          const p=base.batchSources[i];for(let k=0;k<6;k++)stream[j++]=data[p+k];
        }
        gl.bindBuffer(gl.ARRAY_BUFFER,base.buf);
        if(base.resizePose){gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);base.resizePose=false;}
        else gl.bufferSubData(gl.ARRAY_BUFFER,0,stream||data);
        this.bound=null;base.needsUpload=false;
      }
      const reduced=this.scale<=.65&&base===model&&!base.actor&&!base.crowdDetail&&base.bounds&&base.count>330&&
        (model.sections||!tiltX&&!tiltZ&&this.farFromCamera(base.bounds,x,y,z,yaw));
      if(reduced&&!model.distanceReady)this.prepareDistanceMesh(model,this.cpu.get(name));
      if(this.bound!==model.buf){gl.bindBuffer(gl.ARRAY_BUFFER,model.buf);gl.vertexAttribPointer(this.pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(this.col,3,gl.FLOAT,false,24,12);this.bound=model.buf;}
      // Static buildings assembled in world coordinates can share the city's
      // visible-face indexer. Vehicle-local, transparent and effect draws use
      // their ordinary transforms and section ranges.
      const worldList=reduced&&model.indices&&!this.casting&&!x&&!y&&!z&&!yaw&&!tiltX&&!tiltZ&&
        (model.city||model.worldSections&&!this.effectPass&&!vehicle&&!vapor);
      const solid=!this.effectPass&&!vapor&&this.beginStreetSurface(glow,!worldList);
      if(!solid&&this.glow!==glow){gl.uniform1f(this.u.glow,glow);this.glow=glow;}
      if(!solid||!worldList){
        const uniforms=solid?this.modelSurface.u:this.u,state=solid?this.modelSurface:this;
        if(tiltX!==state.tiltX||tiltZ!==state.tiltZ){
          gl.uniform4f(uniforms.tilt,Math.cos(tiltX),Math.sin(tiltX),Math.cos(tiltZ),Math.sin(tiltZ));
          state.tiltX=tiltX;state.tiltZ=tiltZ;
        }
        gl.uniform3f(uniforms.origin,x,y,z);gl.uniform2f(uniforms.turn,Math.cos(yaw),Math.sin(yaw));
      }
      if(vapor){gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(this.u.beam,2+vapor);}
      if(worldList){
        const list=model.cityList??=new CityIndexList(this,model,this.cpu.get(name));list.draw(this,model);
      }else if(model.starts&&this.multiDraw){
        this.drawSections(model,reduced,x,y,z,yaw,tiltX,tiltZ,vehicle?.damage?1.4:0);
      }else if(model.sections){
        let first=0,end=0,far=false;
        const flush=()=>{
          if(first===end)return;
          if(far){gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.distant);gl.drawElements(gl.TRIANGLES,end-first,model.indexType,first*model.indexSize);}
          else drawRange(gl,model,first,end-first);
        };
        for(const section of model.sections){
          if(!this.inFrame(section.bounds,x,y,z,yaw,tiltX,tiltZ,vehicle?.damage?1.4:0))continue;
          const distant=!!(reduced&&model.distant&&!tiltX&&!tiltZ&&this.farFromCamera(section.bounds,x,y,z,yaw));
          const start=distant?section.indexStart:section.first,next=distant?start+section.indexCount:section.end;
          if(next===start)continue;
          if(far!==distant||end!==start){flush();first=start;far=distant;}
          end=next;
        }
        flush();
      }else if(reduced&&model.distant){
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.distant);gl.drawElements(gl.TRIANGLES,model.indexCount,model.indexType,0);
      }else drawRange(gl,model,0,model.count);
      if(solid)gl.useProgram(this.program);
      if(vapor){gl.uniform1f(this.u.beam,0);gl.disable(gl.BLEND);gl.depthMask(true);}
    }
  }
  // Cover a painted glyph with disjoint rectangles. A vertical stem can be
  // one quad across several rows, just as a crossbar can span columns.
  const glyphPaint=new WeakMap();
  function coverGlyph(glyph,vertical){
    const spans=[],across=vertical?glyph.length:glyph[0].length,lines=vertical?glyph[0].length:glyph.length;
    let previous=new Map();
    for(let line=0;line<lines;line++){
      const next=new Map();
      for(let i=0;i<across;){
        const ink=j=>(vertical?glyph[j][line]:glyph[line][j])==="1";
        if(!ink(i)){i++;continue;}
        const start=i++;while(i<across&&ink(i))i++;
        const key=start*(across+1)+i,old=previous.get(key);
        if(old){if(vertical)old.w++;else old.h++;next.set(key,old);}
        else{
          const rect=vertical?{x:line,y:start,w:1,h:i-start}:{x:start,y:line,w:i-start,h:1};
          spans.push(rect);next.set(key,rect);
        }
      }
      previous=next;
    }
    return spans;
  }
  Mesh.glyphRects=glyph=>{
    let paint=glyphPaint.get(glyph);
    if(!paint){
      const rows=coverGlyph(glyph,false),columns=coverGlyph(glyph,true);
      paint=columns.length<rows.length?columns:rows;glyphPaint.set(glyph,paint);
    }
    return paint;
  };
  window.BayMesh=Mesh;window.BayView=View;
})();
