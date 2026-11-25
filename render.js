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
  function indexGeometry(data,largeIndices){
    const count=data.length/6;
    if(count<192||count>65535&&!largeIndices)return null;
    const words=new Uint32Array(data.buffer,data.byteOffset,data.length);
    let size=1;while(size<count*2)size*=2;
    const slots=new Uint32Array(size),remap=count>65535?new Uint32Array(count):new Uint16Array(count);
    const packed=new Float32Array(data.length);let used=0;
    for(let i=0;i<count;i++){
      const p=i*6;let hash=2166136261;
      for(let n=0;n<6;n++)hash=Math.imul(hash^words[p+n],16777619);
      let slot=(hash^(hash>>>16))&(size-1);
      while(slots[slot]){
        const q=(slots[slot]-1)*6;
        if(words[q]===words[p]&&words[q+1]===words[p+1]&&words[q+2]===words[p+2]&&
          words[q+3]===words[p+3]&&words[q+4]===words[p+4]&&words[q+5]===words[p+5])break;
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
  // Recognize the six complete faces emitted by Mesh.box in the final vertex
  // stream. Cut-out doors, cloth, lettering and open meshes remain double-sided.
  const boxCorners=[2,3,7,2,7,6,0,1,3,0,3,2,4,6,7,4,7,5,0,2,6,0,6,4,1,5,7,1,7,3,0,4,5,0,5,1];
  const boxFaces=[8,16,32,1,2,4];
  function closedBoxFaces(data){
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
      sides??=new Uint8Array(data.length/18);
      for(let f=0;f<6;f++)sides[p/18+f*2]=sides[p/18+f*2+1]=boxFaces[f];
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
  function exteriorMesh(model,mask){
    const old=model.exterior;
    if(old?.mask===mask)return old;
    // Multiple instances can use the same model in one frame. Rebuild only
    // when a camera side repeats; a spinning wheel can keep its original mesh.
    if(model.wantedSide!==mask){model.wantedSide=mask;return null;}
    const sources=[],indices=[],lookup=new Uint16Array(model.vertexCount);
    for(let i=0;i<model.count;i+=3){
      if(model.closedSides[i/3]&mask)continue;
      for(let j=i;j<i+3;j++){
        const id=model.indices?model.indices[j]:j;
        if(!lookup[id]){sources.push(j*6);lookup[id]=sources.length;}
        indices.push(lookup[id]-1);
      }
    }
    return model.exterior={mask,indices:new Uint16Array(indices),sources:new Uint32Array(sources)};
  }
  // Pack the visible street props in submission order. Their vertices share a
  // world coordinate system, so changing from a shop to a car needs no GL call.
  // A batch is bounded and uses 16-bit indices even on WebGL 1 devices.
  class StreetBatch {
    constructor(view){
      this.view=view;
      const gl=view.gl;
      this.vertexBuffer=gl.createBuffer();this.indexBuffer=gl.createBuffer();
      this.vertices=new Float32Array(24576*6);
      this.indices=new Uint16Array(65532);
      this.savedPoses=new Set();this.poseBytes=0;
      this.details=new Map();this.detailBytes=0;this.buildDetail=true;
      gl.bindBuffer(gl.ARRAY_BUFFER,this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER,this.vertices.byteLength,gl.STREAM_DRAW);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,this.indices.byteLength,gl.STREAM_DRAW);
      view.bound=null;this.count=0;this.used=0;this.glow=0;
    }
    flush(){
      if(!this.count)return;
      const view=this.view,gl=view.gl;
      gl.bindBuffer(gl.ARRAY_BUFFER,this.vertexBuffer);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,this.vertices.subarray(0,this.used*6));
      gl.vertexAttribPointer(view.pos,3,gl.FLOAT,false,24,0);
      gl.vertexAttribPointer(view.col,3,gl.FLOAT,false,24,12);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,this.indexBuffer);
      gl.bufferSubData(gl.ELEMENT_ARRAY_BUFFER,0,this.indices.subarray(0,this.count));
      gl.uniform3f(view.u.origin,0,0,0);gl.uniform2f(view.u.turn,1,0);
      gl.uniform4f(view.u.tilt,1,0,1,0);view.tiltX=view.tiltZ=0;
      if(view.glow!==this.glow){gl.uniform1f(view.u.glow,this.glow);view.glow=this.glow;}
      gl.drawElements(gl.TRIANGLES,this.count,gl.UNSIGNED_SHORT,0);
      view.bound=null;this.count=0;this.used=0;
    }
    forgetPose(p){
      if(!p.vertices)return;
      this.poseBytes-=p.vertices.byteLength;this.savedPoses.delete(p);p.vertices=null;
    }
    repeatedPose(model,sources,x,y,z,yaw,tiltX,tiltZ){
      const p=model.batchPose??={x:NaN,vertices:null};
      if(p.x===x&&p.y===y&&p.z===z&&p.yaw===yaw&&p.tiltX===tiltX&&p.tiltZ===tiltZ&&p.sources===sources)return p;
      this.forgetPose(p);
      p.x=x;p.y=y;p.z=z;p.yaw=yaw;p.tiltX=tiltX;p.tiltZ=tiltZ;p.sources=sources;return null;
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
        if(entry.model.batchPose?.sources===old.data){this.forgetPose(entry.model.batchPose);entry.model.batchPose.sources=null;}
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
      if(model.sections||car?.damage||vapor||model.count>this.indices.length){
        this.flush();view.draw(...item);return;
      }
      let indices=model.indices,sources=model.batchSources,count=model.count,n=model.vertexCount;
      if(view.scale<=.65&&!model.actor&&model.bounds&&model.count>330&&!tiltX&&!tiltZ&&view.farFromCamera(model.bounds,x,y,z,yaw)){
        if(!model.distanceReady)view.prepareDistanceMesh(model,data);
        if(model.batchDistant){
          indices=model.batchDistant.indices;sources=model.batchDistant.sources;count=indices.length;n=sources.length;
        }
      }
      if(!model.dynamic&&model.bounds&&model.count>=192&&(!model.batchDistant||sources!==model.batchDistant.sources)){
        if(model.closedSides===undefined)model.closedSides=closedBoxFaces(data);
        if(model.closedSides){
          const mask=cameraSides(model,view.basis,x,y,z,yaw,tiltX,tiltZ);
          const exterior=mask&&exteriorMesh(model,mask);
          if(exterior){indices=exterior.indices;sources=exterior.sources;count=indices.length;n=sources.length;}
        }
      }
      if(n>this.vertices.length/6){this.flush();view.draw(...item);return;}
      if(indices&&!sources){
        sources=model.batchSources=new Uint32Array(n);
        for(let i=0;i<model.count;i++)sources[indices[i]]=i*6;
      }
      if(!model.dynamic&&!vapor&&!car?.damage){
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
      // model. Only two identical consecutive static draws can admit a pose.
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
      for(let i=0;i<count;i++)this.indices[this.count+i]=this.used+(indices?indices[i]:i);
      this.used+=n;this.count+=count;
    }
  }
  const LIGHT = `
    uniform vec3 sunDir,sunAcross,sunUp;
    vec3 lightClip(vec3 world){
      vec3 p=world-vec3(10.,6.,0.);
      return vec3(dot(p,sunAcross)/310.,dot(p,sunUp)/300.,-dot(p,sunDir)/365.);
    }`;
  const VERTEX = LIGHT+`
    attribute vec3 pos; attribute vec3 col;
    uniform vec3 origin,eye,rightV,upV,forwardV; uniform vec2 turn,focal; uniform vec2 depth;
    uniform vec4 tilt,waterParams; uniform float castOnly; uniform vec2 castSlope;
    varying vec3 vColor,lightCoord; varying vec2 surface; varying vec4 street; varying float haze;
    void main(){
      vec3 q=vec3(pos.x,pos.y*tilt.x-pos.z*tilt.y,pos.y*tilt.y+pos.z*tilt.x);
      q=vec3(q.x*tilt.z-q.y*tilt.w,q.x*tilt.w+q.y*tilt.z,q.z);
      vec3 world=origin+vec3(q.x*turn.x+q.z*turn.y,q.y,-q.x*turn.y+q.z*turn.x);
      if(castOnly>.5){world.xz+=castSlope*(world.y-.15);world.y=.153;}
      vec3 rel=world-eye; float z=dot(rel,forwardV);
      gl_Position=vec4(dot(rel,rightV)*focal.x,dot(rel,upV)*focal.y,depth.x*z+depth.y,z);
      lightCoord=lightClip(world)*.5+.5;
      surface=waterParams.w>.5?world.xz:vec2(world.x+world.z*.68,world.y+world.z*.44-world.x*.17);
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
    uniform vec4 waterParams,airState,driverLamp; uniform vec3 eye,skyTone; uniform vec2 immersion;
    uniform vec3 seaSun;
    uniform sampler2D vehicleLight; uniform vec3 lightArea;
    uniform sampler2D sunDepth,paper,lobbyPrint,streetLight; uniform float texel,hasShadow,castOnly,ghost,beam,dusk,glow,showPrint,lowDetail;
    float shadeAt(vec2 uv){
      vec2 rg=texture2D(sunDepth,uv).rg;
      return step(dot(rg,vec2(1.,1./255.))+.00047,lightCoord.z);
    }
    void main(){
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
      float shade=0.;
      if(hasShadow>.005&&all(greaterThan(lightCoord.xy,vec2(.001)))&&all(lessThan(lightCoord.xy,vec2(.999)))){
        if(lowDetail>.5)shade=shadeAt(lightCoord.xy)*hasShadow;
        else{
        vec2 cell=lightCoord.xy/texel-.5;
        vec2 uv=(floor(cell)+.5)*texel,weight=fract(cell);
        float a=mix(shadeAt(uv),shadeAt(uv+vec2(texel,0.)),weight.x);
        float b=mix(shadeAt(uv+vec2(0.,texel)),shadeAt(uv+vec2(texel)),weight.x);
        shade=mix(a,b,weight.y)*hasShadow;}
      }
      float fleck=lowDetail>.5?0.:texture2D(paper,surface*.115).r-.5;
      float wash=lowDetail>.5?0.:texture2D(paper,surface*.011).r-.5;
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
      if(airState.w>.5){
        float lampTime=max(dusk,.53*airState.x);
        float lowSurface=1.-smoothstep(.27,4.4,street.z);
        color*=mix(vec3(1.),vec3(.932,1.015,1.054),airState.z*(1.-dusk));
        color=mix(color,color*vec3(.81,.88,.94)+skyTone*.036,airState.x);
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
      this.canvas=canvas; this.gl=null; this.models=new Map(); this.cpu=new Map(); this.animated=new Set();this.actors=new Set();
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
      const program=(vs,fs)=>{const p=gl.createProgram(),v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs);
        gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);
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
      gl.enableVertexAttribArray(this.pos);gl.enableVertexAttribArray(this.col);gl.enable(gl.DEPTH_TEST);gl.depthFunc(gl.LEQUAL);
      gl.clearColor(0,0,0,0); const n=.13,f=1100;gl.uniform2f(this.u.depth,(f+n)/(f-n),-2*f*n/(f-n));
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
      if(animated)this.animated.add(name);
      if(animated&&window.BayPlayerMesh&&mesh instanceof BayPlayerMesh)this.actors.add(name);
      this.cpu.set(name,data);if(!this.lost)this.upload(name,data);
    }
    upload(name,data){
      const gl=this.gl,buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      const dynamic=this.animated.has(name),packed=dynamic?null:indexGeometry(data,this.largeIndices);
      gl.bufferData(gl.ARRAY_BUFFER,packed?.vertices||data,dynamic?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
      const count=data.length/6,model={buf,count,dynamic,vertexCount:packed?packed.vertices.length/6:count};
      if(packed){
        model.indices=packed.indices;model.elementType=model.indices.BYTES_PER_ELEMENT===2?gl.UNSIGNED_SHORT:gl.UNSIGNED_INT;
        model.elements=gl.createBuffer();gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER,model.elements);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER,model.indices,gl.STATIC_DRAW);
      }
      model.actor=!!this.actors?.has(name);
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
        if(name==="city")this.sunKey=null;
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
    updateAnimated(name){
      const model=this.models.get(name);if(!model||this.lost)return;
      if(model.actor){model.poseChanged=true;model.needsUpload=true;return;}
      const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,model.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,this.cpu.get(name));this.bound=null;
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
        const basis=u=>{
          gl.uniform3f(u.sunDir,x,y,z);gl.uniform3f(u.sunAcross,z/h,0,-x/h);gl.uniform3f(u.sunUp,-x*y/h,h,-z*y/h);
        };
        gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.disable(gl.SCISSOR_TEST);
        gl.useProgram(this.sunProgram);gl.viewport(0,0,sz,sz);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        basis(this.sunUniforms);
        gl.disableVertexAttribArray(this.pos);gl.disableVertexAttribArray(this.col);
        const p=gl.getAttribLocation(this.sunProgram,"pos");gl.enableVertexAttribArray(p);gl.bindBuffer(gl.ARRAY_BUFFER,city.buf);gl.vertexAttribPointer(p,3,gl.FLOAT,false,24,0);
        gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.1,1.8);drawRange(gl,city,0,city.count);gl.disable(gl.POLYGON_OFFSET_FILL);gl.disableVertexAttribArray(p);
        gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.useProgram(this.program);basis(this.u);
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
      const w=inset?inset.w:Math.max(2,Math.round(innerWidth*factor)),h=inset?inset.h:Math.max(2,Math.round(innerHeight*factor));
      if(inset){gl.enable(gl.SCISSOR_TEST);gl.scissor(0,0,w,h);}
      else{
        gl.disable(gl.SCISSOR_TEST);
        if(c.width!==w||c.height!==h){c.width=w;c.height=h;}
      }
      if(seaTime===null)gl.clearColor(0,0,0,0);
      else{const light=1-.42*dusk;gl.clearColor(.095*light,.365*light,.386*light,1);}
      gl.uniform2f(this.u.immersion,seaTime===null?0:1,(seaTime||0)%2048);
      gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
      const sn=Math.sin(camera.yaw),cs=Math.cos(camera.yaw),sp=Math.sin(camera.pitch),cp=Math.cos(camera.pitch);
      const focal=camera.focal||1.5;this.basis={sn,cs,sp,cp,camera,f:focal,aspect:w/h};this.bound=null;this.tiltX=NaN;this.tiltZ=NaN;
      const horizontal=w/(h*focal),vertical=1/focal;
      Object.assign(this.basis,{horizontal,vertical,xMargin:Math.hypot(1,horizontal),yMargin:Math.hypot(1,vertical)});
      const fx=sn*cp,fy=sp,fz=cs*cp,ux=-sn*sp,uz=-cs*sp;
      this.basis.planes=[[fx*horizontal+cs,fy*horizontal,fz*horizontal-sn],
        [fx*horizontal-cs,fy*horizontal,fz*horizontal+sn],[fx*vertical+ux,fy*vertical+cp,fz*vertical+uz],
        [fx*vertical-ux,fy*vertical-cp,fz*vertical-uz]];
      const timed=weather&&Number.isFinite(weather.minute),night=Math.max(0,Math.min(1,Math.max(dusk||0,timed?weather.night||0:0)));
      const rain=timed?weather.rain||0:0,wet=timed?weather.wet||0:0;
      const noon=timed?Math.max(0,1-Math.abs(weather.minute-730)/325):0;
      const dawn=timed?Math.max(0,1-Math.abs(weather.minute-395)/123):0;
      gl.uniform1f(this.u.dusk,night);gl.uniform4f(this.u.airState,rain,wet,noon,timed?1:0);
      const dark=1-night,clear=1-rain*.68;
      gl.uniform3f(this.u.skyTone,
        (.895-.14*noon-.08*dawn)*dark*clear+.30*night*clear+(.58-.30*night)*(1-clear),
        (.681+.17*noon+.13*dawn)*dark*clear+.345*night*clear+(.63-.31*night)*(1-clear),
        (.626+.19*noon+.13*dawn)*dark*clear+.41*night*clear+(.66-.29*night)*(1-clear));
      const field=timed&&seaTime===null&&this.roadLights;
      if(field?.enabled){
        if(this.lightVersion!==field.version){
          gl.activeTexture(gl.TEXTURE4);gl.bindTexture(gl.TEXTURE_2D,this.vehicleLight);
          if(this.lightSize!==field.size){
            gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,field.size,field.size,0,gl.RGBA,gl.UNSIGNED_BYTE,field.pixels);this.lightSize=field.size;
          }else gl.texSubImage2D(gl.TEXTURE_2D,0,0,0,field.size,field.size,gl.RGBA,gl.UNSIGNED_BYTE,field.pixels);
          gl.activeTexture(gl.TEXTURE0);this.lightVersion=field.version;
        }
        gl.uniform3f(this.u.lightArea,field.left,field.north,1/field.span);
      }else gl.uniform3f(this.u.lightArea,0,0,0);
      if(timed&&headlights&&!field)gl.uniform4f(this.u.driverLamp,headlights.x,headlights.z,Math.sin(headlights.yaw),Math.cos(headlights.yaw));
      else gl.uniform4f(this.u.driverLamp,0,0,0,0);
      gl.uniform3f(this.u.eye,camera.x,camera.y,camera.z);gl.uniform3f(this.u.rightV,cs,0,-sn);
      gl.uniform3f(this.u.upV,-sn*sp,cp,-cs*sp);gl.uniform3f(this.u.forwardV,sn*cp,sp,cs*cp);gl.uniform2f(this.u.focal,focal/(w/h),focal);
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
      if(depth+r<.13||depth-r>1100||Math.abs(x*v.cs-z*v.sn)>depth*v.horizontal+r*v.xMargin||
        Math.abs(y*v.cp-along*v.sp)>depth*v.vertical+r*v.yMargin)return false;
      if(b.hw!==undefined&&v.planes&&!this.casting&&!tiltX&&!tiltZ&&b.r>2){
        let hw=b.hw+pad,hd=b.hd+pad;
        if(yaw){const c=Math.abs(Math.cos(yaw)),s=Math.abs(Math.sin(yaw)),w=hw;hw=c*w+s*hd;hd=s*w+c*hd;}
        for(const [nx,ny,nz] of v.planes){
          if(nx*x+ny*y+nz*z+Math.abs(nx)*hw+Math.abs(ny)*(b.hh+pad)+Math.abs(nz)*hd<0)return false;
        }
      }
      // At the same fraction along every sight line to the sphere its radius
      // is r*t. Cull only when that whole cross-section fits inside a solid.
      if(this.streetWalls&&depth>12)for(const b of this.streetWalls){
        const t=b.across?b.x/x:b.z/z;
        if(!(t>0&&t<1))continue;
        const span=r*t;
        if(Math.abs(y*t-b.y)+span<b.hh&&Math.abs(x*t-b.x)+span<b.hw&&Math.abs(z*t-b.z)+span<b.hd)return false;
      }
      return true;
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
    drawGhost(name,x,y,z,yaw){
      this.gl.uniform1f(this.u.ghost,1);this.draw(name,x,y,z,yaw);this.gl.uniform1f(this.u.ghost,0);
    }
    drawOpaque(list){
      if(this.scale>.75){for(const item of list)this.draw(...item);return;}
      const batch=this.streetBatch??=new StreetBatch(this);
      batch.buildDetail=true;
      for(const item of list)batch.append(item);
      batch.flush();
    }
    drawCityAndWater(t){
      if(this.scale<=.75&&this.buildings){
        const v=this.basis,c=v.camera,walls=[];
        for(const b of this.buildings){
          const x=b.x-c.x,y=b.y-c.y,z=b.z-c.z;
          if(Math.abs(x)>100||Math.abs(z)>100||Math.abs(x)<b.hw&&Math.abs(z)<b.hd||
            (x*v.sn+z*v.cs)*v.cp+y*v.sp+Math.hypot(b.hw,b.hh,b.hd)<0)continue;
          walls.push({x,y,z,hw:b.hw,hh:b.hh,hd:b.hd,across:Math.abs(x)*b.hd>Math.abs(z)*b.hw});
        }
        this.streetWalls=walls;
      }
      this.draw("city");
      // Opaque land masks the water shader. Keep city surfaces on equal-depth shore pixels.
      const gl=this.gl;gl.depthFunc(gl.LESS);this.drawWater(t);gl.depthFunc(gl.LEQUAL);
    }
    drawWater(t){
      const gl=this.gl,eye=this.basis.camera;gl.uniform4f(this.u.waterParams,eye.x,eye.z,t,1);
      this.draw("bay-water");gl.uniform4f(this.u.waterParams,0,0,0,0);
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
      gl.uniform1f(this.u.showPrint,1);this.draw(name,x,y,z,yaw,tiltX);gl.uniform1f(this.u.showPrint,0);
    }
    drawSearchlight(name){
      const gl=this.gl;gl.depthMask(false);gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(this.u.beam,1);this.draw(name);gl.uniform1f(this.u.beam,0);
      gl.disable(gl.BLEND);gl.depthMask(true);
    }
    draw(name,x=0,y=0,z=0,yaw=0,tiltX=0,tiltZ=0,glow=0,vehicle=null,doorSide=0,vapor=0){
      if(vapor&&this.casting)return;
      const base=this.models.get(name);
      if(!base?.count)return;
      if(base.poseChanged){base.bounds=meshBounds(this.cpu.get(name),0,base.count);base.poseChanged=false;}
      if(!this.inFrame(base.bounds,x,y,z,yaw,tiltX,tiltZ,vehicle?.damage?1.4:0))return;
      const model=vehicle?.damage?BayBodyworkArt.buffer(this,name,vehicle,doorSide):base,gl=this.gl;
      if(!model)return;
      if(base.needsUpload){
        gl.bindBuffer(gl.ARRAY_BUFFER,base.buf);gl.bufferSubData(gl.ARRAY_BUFFER,0,this.cpu.get(name));this.bound=null;base.needsUpload=false;
      }
      const reduced=this.scale<=.65&&base===model&&!base.actor&&base.bounds&&base.count>330&&
        (model.sections||!tiltX&&!tiltZ&&this.farFromCamera(base.bounds,x,y,z,yaw));
      if(reduced&&!model.distanceReady)this.prepareDistanceMesh(model,this.cpu.get(name));
      if(this.glow!==glow){gl.uniform1f(this.u.glow,glow);this.glow=glow;}
      if(this.bound!==model.buf){gl.bindBuffer(gl.ARRAY_BUFFER,model.buf);gl.vertexAttribPointer(this.pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(this.col,3,gl.FLOAT,false,24,12);this.bound=model.buf;}
      if(tiltX!==this.tiltX||tiltZ!==this.tiltZ){gl.uniform4f(this.u.tilt,Math.cos(tiltX),Math.sin(tiltX),Math.cos(tiltZ),Math.sin(tiltZ));this.tiltX=tiltX;this.tiltZ=tiltZ;}
      if(vapor){gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);gl.uniform1f(this.u.beam,2+vapor);}
      gl.uniform3f(this.u.origin,x,y,z);gl.uniform2f(this.u.turn,Math.cos(yaw),Math.sin(yaw));
      if(model.starts&&this.multiDraw){
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
      if(vapor){gl.uniform1f(this.u.beam,0);gl.disable(gl.BLEND);gl.depthMask(true);}
    }
  }
  window.BayMesh=Mesh;window.BayView=View;
})();
