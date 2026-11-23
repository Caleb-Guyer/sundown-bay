/* Static city geometry and its sun shadow are baked once. Moving actors share the same light. */
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
  const LIGHT = `
    const vec3 sunDir=vec3(.510,.430,.746);
    vec3 lightClip(vec3 world){
      vec3 p=world-vec3(10.,6.,0.);
      return vec3(dot(p,vec3(.826,0.,-.564))/294.,
                  dot(p,vec3(-.243,.903,-.355))/193.,-dot(p,sunDir)/365.);
    }`;
  const VERTEX = LIGHT+`
    attribute vec3 pos; attribute vec3 col;
    uniform vec3 origin,eye,rightV,upV,forwardV; uniform vec2 turn,focal; uniform vec2 depth;
    uniform vec4 tilt,waterParams; uniform float castOnly;
    varying vec3 vColor,lightCoord; varying vec2 surface; varying vec4 street; varying float haze;
    void main(){
      vec3 q=vec3(pos.x,pos.y*tilt.x-pos.z*tilt.y,pos.y*tilt.y+pos.z*tilt.x);
      q=vec3(q.x*tilt.z-q.y*tilt.w,q.x*tilt.w+q.y*tilt.z,q.z);
      vec3 world=origin+vec3(q.x*turn.x+q.z*turn.y,q.y,-q.x*turn.y+q.z*turn.x);
      if(castOnly>.5){world.xz-=sunDir.xz*((world.y-.15)/sunDir.y);world.y=.153;}
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
    uniform vec4 waterParams,airState,driverLamp; uniform vec3 eye,skyTone;
    uniform sampler2D sunDepth,paper,lobbyPrint,streetLight; uniform float texel,hasShadow,castOnly,ghost,beam,dusk,glow,showPrint;
    float shadeAt(vec2 uv){
      vec2 rg=texture2D(sunDepth,uv).rg;
      return step(dot(rg,vec2(1.,1./255.))+.00047,lightCoord.z);
    }
    void main(){
      if(castOnly>.5){gl_FragColor=vec4(.12,.15,.24,.28*(1.-.65*dusk)*(1.-.66*airState.x)*(1.-haze));return;}
      if(showPrint>.5){
        vec3 dye=texture2D(lobbyPrint,vColor.rg).rgb*(1.-.14*dusk);
        gl_FragColor=vec4(mix(dye,vec3(.65,.54,.53),haze*.6),1.);return;
      }
      if(beam>.5){gl_FragColor=vec4(1.,.946,.736,vColor.r*(1.-haze));return;}
      if(ghost>.5){
        if(mod(floor(gl_FragCoord.x)+2.*floor(gl_FragCoord.y),4.)<2.)discard;
        gl_FragColor=vec4(mix(vec3(.31,.80,.78),vec3(.87,1.,.92),vColor.g),1.);return;
      }
      if(waterParams.w>.5){
        vec2 offset=surface-waterParams.xy;float d=length(offset),t=waterParams.z;
        float local=1.-smoothstep(30.,145.,d);
        float swell=sin(dot(surface,vec2(.16,.22))+1.35*t+.85*sin(surface.y*.075-t*.43));
        float ripple=sin(dot(surface,vec2(.56,-.79))+2.05*t+1.7*swell);
        float grain=texture2D(paper,surface*vec2(.008,.022)+vec2(t*.0017,-t*.0021)).r;
        float crest=smoothstep(.59,.93,.54*swell+.34*ripple+.30*grain);
        float bearing=dot(offset/max(d,.01),vec2(.564,.826));
        float sunset=smoothstep(.59,.99,bearing)*smoothstep(12.,95.,d);
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
      if(hasShadow>.5&&all(greaterThan(lightCoord.xy,vec2(.001)))&&all(lessThan(lightCoord.xy,vec2(.999)))){
        vec2 cell=lightCoord.xy/texel-.5;
        vec2 uv=(floor(cell)+.5)*texel,weight=fract(cell);
        float a=mix(shadeAt(uv),shadeAt(uv+vec2(texel,0.)),weight.x);
        float b=mix(shadeAt(uv+vec2(0.,texel)),shadeAt(uv+vec2(texel)),weight.x);
        shade=mix(a,b,weight.y);
      }
      float fleck=texture2D(paper,surface*.115).r-.5;
      float wash=texture2D(paper,surface*.011).r-.5;
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
        if(lampTime>.01&&street.w>1.5){
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
      this.canvas=canvas; this.gl=null; this.models=new Map(); this.cpu=new Map(); this.animated=new Set();
      this.scale=1; this.maxWidth=1180; this.maxHeight=760; this.lost=false;
      try {
        this.gl=canvas.getContext("webgl",{alpha:true,depth:true,stencil:true,antialias:true,powerPreference:"low-power",preserveDrawingBuffer:false});
        if(this.gl) this.setup();
      } catch { this.gl=null; }
      canvas.addEventListener("webglcontextlost",e=>{e.preventDefault();this.lost=true;});
      canvas.addEventListener("webglcontextrestored",()=>{this.lost=false;this.models.clear();try{this.setup();for(const [name,data] of this.cpu)this.upload(name,data);}catch{this.gl=null;}});
    }
    setup(){
      const gl=this.gl;
      const compile=(kind,src)=>{const sh=gl.createShader(kind);gl.shaderSource(sh,src);gl.compileShader(sh);if(!gl.getShaderParameter(sh,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(sh));return sh;};
      const program=(vs,fs)=>{const p=gl.createProgram(),v=compile(gl.VERTEX_SHADER,vs),f=compile(gl.FRAGMENT_SHADER,fs);
        gl.attachShader(p,v);gl.attachShader(p,f);gl.linkProgram(p);gl.deleteShader(v);gl.deleteShader(f);
        if(!gl.getProgramParameter(p,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(p));return p;};
      const p=this.program=program(VERTEX,FRAGMENT);this.sunProgram=program(SUNVERT,SUNFRAG);gl.useProgram(p);
      this.u={};for(const key of ["origin","eye","rightV","upV","forwardV","turn","focal","depth","tilt","castOnly","ghost","beam","waterParams","sunDepth","paper","texel","hasShadow","dusk","glow","lobbyPrint","showPrint","streetLight","airState","skyTone","driverLamp"])this.u[key]=gl.getUniformLocation(p,key);
      this.glow=0;
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
      this.printTexture=gl.createTexture();this.printSource=null;this.printRevision=-1;
      gl.bindTexture(gl.TEXTURE_2D,this.printTexture);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([255,255,255,255]));
      gl.activeTexture(gl.TEXTURE3);this.streetTexture=gl.createTexture();gl.bindTexture(gl.TEXTURE_2D,this.streetTexture);
      const lamps=window.BayCoastArt?.lightTexture()||{pixels:new Uint8Array(4),size:1};
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,lamps.size,lamps.size,0,gl.RGBA,gl.UNSIGNED_BYTE,lamps.pixels);
      gl.uniform1i(this.u.sunDepth,0);gl.uniform1i(this.u.paper,1);gl.uniform1i(this.u.lobbyPrint,2);gl.uniform1i(this.u.streetLight,3);
      gl.uniform4f(this.u.tilt,1,0,1,0);gl.activeTexture(gl.TEXTURE0);
    }
    add(name,mesh,animated=false){
      if(!this.gl)return;
      const data=mesh.vertices instanceof Float32Array?mesh.vertices:new Float32Array(mesh.vertices);
      if(name==="city")tagMaterials(data,builtMaterials);
      else if(/^(coupe|van|cab|hatch|cruiser)#/.test(name))tagMaterials(data,carMaterials);
      if(animated)this.animated.add(name);
      this.cpu.set(name,data);if(!this.lost)this.upload(name,data);
    }
    upload(name,data){
      const gl=this.gl,buf=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buf);
      gl.bufferData(gl.ARRAY_BUFFER,data,this.animated.has(name)?gl.DYNAMIC_DRAW:gl.STATIC_DRAW);
      this.models.set(name,{buf,count:data.length/6});if(name==="city")this.bakeSun(buf,data.length/6);
    }
    updateAnimated(name){
      const model=this.models.get(name);if(!model||this.lost)return;
      const gl=this.gl;gl.bindBuffer(gl.ARRAY_BUFFER,model.buf);
      gl.bufferSubData(gl.ARRAY_BUFFER,0,this.cpu.get(name));this.bound=null;
    }
    bakeSun(buf,count){
      const gl=this.gl,sz=Math.min(1536,gl.getParameter(gl.MAX_TEXTURE_SIZE),gl.getParameter(gl.MAX_RENDERBUFFER_SIZE));
      gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,this.shadowTexture);
      gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,sz,sz,0,gl.RGBA,gl.UNSIGNED_BYTE,null);
      const fbo=gl.createFramebuffer(),rb=gl.createRenderbuffer();gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);gl.bindRenderbuffer(gl.RENDERBUFFER,rb);
      gl.renderbufferStorage(gl.RENDERBUFFER,gl.DEPTH_COMPONENT16,sz,sz);
      gl.framebufferTexture2D(gl.FRAMEBUFFER,gl.COLOR_ATTACHMENT0,gl.TEXTURE_2D,this.shadowTexture,0);gl.framebufferRenderbuffer(gl.FRAMEBUFFER,gl.DEPTH_ATTACHMENT,gl.RENDERBUFFER,rb);
      const ok=gl.checkFramebufferStatus(gl.FRAMEBUFFER)===gl.FRAMEBUFFER_COMPLETE;
      if(ok){
        gl.useProgram(this.sunProgram);gl.viewport(0,0,sz,sz);gl.clearColor(1,1,1,1);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
        gl.disableVertexAttribArray(this.pos);gl.disableVertexAttribArray(this.col);
        const p=gl.getAttribLocation(this.sunProgram,"pos");gl.enableVertexAttribArray(p);gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.vertexAttribPointer(p,3,gl.FLOAT,false,24,0);
        gl.enable(gl.POLYGON_OFFSET_FILL);gl.polygonOffset(1.1,1.8);gl.drawArrays(gl.TRIANGLES,0,count);gl.disable(gl.POLYGON_OFFSET_FILL);gl.disableVertexAttribArray(p);
      }
      gl.bindFramebuffer(gl.FRAMEBUFFER,null);gl.bindRenderbuffer(gl.RENDERBUFFER,null);gl.deleteFramebuffer(fbo);gl.deleteRenderbuffer(rb);
      gl.useProgram(this.program);gl.enableVertexAttribArray(this.pos);gl.enableVertexAttribArray(this.col);
      gl.uniform1f(this.u.hasShadow,ok?1:0);gl.uniform1f(this.u.texel,1/sz);gl.clearColor(0,0,0,0);this.bound=null;
    }
    begin(camera,dusk=0,weather=null,headlights=null){
      if(!this.gl||this.lost)return;
      const gl=this.gl,c=this.canvas, factor=Math.min(this.maxWidth/innerWidth,this.maxHeight/innerHeight,devicePixelRatio||1)*this.scale;
      const w=Math.max(2,Math.round(innerWidth*factor)), h=Math.max(2,Math.round(innerHeight*factor));
      if(c.width!==w||c.height!==h){c.width=w;c.height=h;}gl.viewport(0,0,w,h);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT|gl.STENCIL_BUFFER_BIT);
      const sn=Math.sin(camera.yaw),cs=Math.cos(camera.yaw),sp=Math.sin(camera.pitch),cp=Math.cos(camera.pitch);
      const focal=camera.focal||1.5;this.basis={sn,cs,sp,cp,camera,f:focal,aspect:w/h};this.bound=null;this.tiltX=NaN;this.tiltZ=NaN;
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
      if(timed&&headlights)gl.uniform4f(this.u.driverLamp,headlights.x,headlights.z,Math.sin(headlights.yaw),Math.cos(headlights.yaw));
      else gl.uniform4f(this.u.driverLamp,0,0,0,0);
      gl.uniform3f(this.u.eye,camera.x,camera.y,camera.z);gl.uniform3f(this.u.rightV,cs,0,-sn);
      gl.uniform3f(this.u.upV,-sn*sp,cp,-cs*sp);gl.uniform3f(this.u.forwardV,sn*cp,sp,cs*cp);gl.uniform2f(this.u.focal,focal/(w/h),focal);
    }
    project(x,y,z){
      if(!this.basis)return null;
      const {sn,cs,sp,cp,camera,f,aspect}=this.basis,dx=x-camera.x,dy=y-camera.y,dz=z-camera.z;
      const along=dx*sn+dz*cs,depth=along*cp+dy*sp;if(depth<=.2)return null;
      return {x:(.5+(dx*cs-dz*sn)*f/(aspect*depth)*.5)*innerWidth,y:(.5-(dy*cp-along*sp)*f/depth*.5)*innerHeight,depth};
    }
    beginShadow(){
      if(!this.stencil)return false;const gl=this.gl;gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ZERO,gl.ONE);
      gl.enable(gl.STENCIL_TEST);gl.stencilFunc(gl.EQUAL,0,255);gl.stencilOp(gl.KEEP,gl.KEEP,gl.INCR);gl.uniform1f(this.u.castOnly,1);return true;
    }
    endShadow(){const gl=this.gl;gl.depthMask(true);gl.disable(gl.BLEND);gl.disable(gl.STENCIL_TEST);gl.uniform1f(this.u.castOnly,0);}
    drawGhost(name,x,y,z,yaw){
      this.gl.uniform1f(this.u.ghost,1);this.draw(name,x,y,z,yaw);this.gl.uniform1f(this.u.ghost,0);
    }
    drawWater(t){
      const gl=this.gl,eye=this.basis.camera;gl.uniform4f(this.u.waterParams,eye.x,eye.z,t,1);
      this.draw("bay-water");gl.uniform4f(this.u.waterParams,0,0,0,0);
    }
    drawPrint(name,canvas,revision,x,y,z,yaw){
      if(!this.gl||this.lost||!this.models.has(name))return;
      const gl=this.gl;
      if(this.printSource!==canvas||this.printRevision!==revision){
        gl.activeTexture(gl.TEXTURE2);gl.bindTexture(gl.TEXTURE_2D,this.printTexture);
        gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,canvas);
        gl.generateMipmap(gl.TEXTURE_2D);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR_MIPMAP_LINEAR);
        gl.activeTexture(gl.TEXTURE0);this.printSource=canvas;this.printRevision=revision;
      }
      gl.uniform1f(this.u.showPrint,1);this.draw(name,x,y,z,yaw);gl.uniform1f(this.u.showPrint,0);
    }
    drawSearchlight(name){
      const gl=this.gl;gl.depthMask(false);gl.enable(gl.BLEND);
      gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
      gl.uniform1f(this.u.beam,1);this.draw(name);gl.uniform1f(this.u.beam,0);
      gl.disable(gl.BLEND);gl.depthMask(true);
    }
    draw(name,x=0,y=0,z=0,yaw=0,tiltX=0,tiltZ=0,glow=0){
      const model=this.models.get(name);if(!model)return;const gl=this.gl;
      if(this.glow!==glow){gl.uniform1f(this.u.glow,glow);this.glow=glow;}
      if(this.bound!==model.buf){gl.bindBuffer(gl.ARRAY_BUFFER,model.buf);gl.vertexAttribPointer(this.pos,3,gl.FLOAT,false,24,0);gl.vertexAttribPointer(this.col,3,gl.FLOAT,false,24,12);this.bound=model.buf;}
      if(tiltX!==this.tiltX||tiltZ!==this.tiltZ){gl.uniform4f(this.u.tilt,Math.cos(tiltX),Math.sin(tiltX),Math.cos(tiltZ),Math.sin(tiltZ));this.tiltX=tiltX;this.tiltZ=tiltZ;}
      gl.uniform3f(this.u.origin,x,y,z);gl.uniform2f(this.u.turn,Math.cos(yaw),Math.sin(yaw));gl.drawArrays(gl.TRIANGLES,0,model.count);
    }
  }
  window.BayMesh=Mesh;window.BayView=View;
})();
