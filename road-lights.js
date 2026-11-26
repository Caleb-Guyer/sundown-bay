(() => {
  const size=192, metres=.75, span=size*metres, rays=32;
  const clamp=(x,lo,hi)=>Math.max(lo,Math.min(hi,x));
  const smooth=x=>{x=clamp(x,0,1);return x*x*(3-2*x);};
  const flashing=(v,t)=>BayBoulevardLanes.flash(v,t);
  const red=[142,23,20],blue=[24,68,152],amber=[155,79,18];
  function signalSide(v,t){
    if(v.kind==="cruiser"){
      if(v.beatCar)return BayOceanBeatArt.pulse(t,v.beatLights);
      return v.role?(Math.floor(t*2)%2?1:-1):0;
    }
    if(!v.responseLights)return 0;
    if(v.kind==="ambulance")return BayAmbulanceArt.pulse(t);
    return v.kind==="pumper"?BayEngineSevenArt.beaconPhase(t,v):0;
  }
  function box(x,z,w,d,s=0,c=1,car=null){
    return {x,z,w,d,s,c,car,r:Math.hypot(w,d)};
  }
  // Clip the beam to the near face of a wall or vehicle, in that object's own axes.
  function hit(b,x,z,dx,dz,limit){
    const ox=x-b.x,oz=z-b.z,u=ox*b.c-oz*b.s,v=ox*b.s+oz*b.c;
    const du=dx*b.c-dz*b.s,dv=dx*b.s+dz*b.c;
    let enter=0,leave=limit;
    if(Math.abs(du)<1e-6){if(Math.abs(u)>b.w)return limit;}
    else{const a=(-b.w-u)/du,y=(b.w-u)/du;enter=Math.max(enter,Math.min(a,y));leave=Math.min(leave,Math.max(a,y));}
    if(Math.abs(dv)<1e-6){if(Math.abs(v)>b.d)return limit;}
    else{const a=(-b.d-v)/dv,y=(b.d-v)/dv;enter=Math.max(enter,Math.min(a,y));leave=Math.min(leave,Math.max(a,y));}
    return leave>=enter?Math.min(limit,enter+.55):limit;
  }
  // Signed edge crossings bound the beam on each row of the light texture.
  // A half-texel guard keeps both edges under the original coverage test.
  function spanEdge(rows,ax,az,bx,bz,left,north){
    if(Math.abs(bz-az)<1e-9)return;
    const start=clamp(Math.ceil((north-Math.max(az,bz))/metres-.5),0,size);
    const end=clamp(Math.ceil((north-Math.min(az,bz))/metres-.5),0,size);
    const slope=(bx-ax)/(bz-az);
    let at=(ax-left+(north-(start+.5)*metres-az)*slope)/metres;
    const edge=bz>az?rows[0]:rows[1];
    for(let row=start;row<end;row++,at-=slope)edge[row]=at;
  }
  class Field {
    constructor(solids){
      this.buildings=solids.filter(b=>(b.top??b.h??4)>.65&&(b.bottom||0)<1.8&&b.w>.26&&b.d>.26)
        .map(b=>box(b.x,b.z,b.w*.5,b.d*.5));
      this.pixels=new Uint8ClampedArray(size*size*4);
      this.words=new Uint32Array(this.pixels.buffer);
      this.black=new Uint32Array(Uint8Array.of(0,0,0,255).buffer)[0];
      this.rows=[new Float64Array(size),new Float64Array(size)];
      this.size=size;this.span=span;this.version=0;this.last=-Infinity;this.enabled=false;
      this.canvasVersion=-1;this.stops=new Float32Array(rays+1);this.glare=new WeakMap();
    }
    update(t,focus,own,cars,patrol,light,wet,bus){
      if(t>=this.last&&t-this.last<(Math.abs(own?.speed||0)>8?.045:.075)&&own===this.driver&&!!own?.mainBeam===this.high)return;
      const dt=clamp(t-this.last,0,.16);
      this.last=t;this.driver=own;this.high=!!own?.mainBeam;
      const nearby=[];
      for(const group of [cars,patrol])for(const v of group){
        if(v===own||v.onDeck||v.stored||Math.abs(v.x-focus.x)>90||Math.abs(v.z-focus.z)>90)continue;
        nearby.push({v,d:(v.x-focus.x)**2+(v.z-focus.z)**2});
      }
      if(bus&&bus!==own&&Math.abs(bus.x-focus.x)<90&&Math.abs(bus.z-focus.z)<90)nearby.push({v:bus,d:(bus.x-focus.x)**2+(bus.z-focus.z)**2});
      const voluntary=this.high||own&&flashing(own,t)||nearby.some(({v})=>flashing(v,t));
      this.enabled=light>.045||!!voluntary;
      if(!this.enabled)return;
      nearby.sort((a,b)=>a.d-b.d);
      this.left=Math.round(focus.x/metres)*metres-span*.5;
      this.north=Math.round(focus.z/metres)*metres+span*.5;
      const blocks=this.buildings.filter(b=>Math.abs(b.x-focus.x)<92+b.w&&Math.abs(b.z-focus.z)<92+b.d);
      const sources=[];
      let lampCount=0;
      const add=(v,active)=>{
        const shape=v.footprint||bayCarLayout(v.kind||"cruiser"),s=Math.sin(v.yaw),c=Math.cos(v.yaw);
        const body=box(v.x,v.z,shape.track,shape.halfLength,s,c,v);
        blocks.push(body);
        body.signal=light>.045?signalSide(v,t):0;
        body.lamps=active;
        if(active)lampCount++;
        if(active||body.signal)sources.push(body);
      };
      if(own)add(own,true);
      for(const {v} of nearby)add(v,lampCount<14&&(v===bus||v.path||Math.abs(v.speed)>.45||v.owner?.phase==="drive"||flashing(v,t)));
      this.words.fill(this.black);
      for(const body of sources){
        const v=body.car,primary=v===own;
        const obstacles=blocks.filter(b=>b!==body&&Math.abs(b.x-body.x)<58+b.r&&Math.abs(b.z-body.z)<58+b.r);
        if(body.signal){
          const side=body.signal,dx=side*body.c,dz=-side*body.s;
          const hue=v.kind==="pumper"?amber:v.kind==="cruiser"&&side>0?blue:red;
          this.paint(v.x+dx*body.w,v.z+dz*body.w,dx,dz,8+6*wet,.73,hue,
            light*(.57+.36*wet),obstacles);
        }
        if(!body.lamps)continue;
        if(own&&!primary&&v.path&&this.high&&light>.16)this.askToDip(v,own,t,dt,obstacles);
        const flash=flashing(v,t),main=primary&&this.high?!flash:flash,level=Math.max(light,main?.37:0)*(primary?1:.84);
        if(level<.04)continue;
        const length=main?53:27,spread=main?.185:.255;
        for(const side of [-1,1]){
          const u=side*body.w*.76,n=body.d-.04;
          const x=v.x+n*body.s+u*body.c,z=v.z+n*body.c-u*body.s;
          // The dipped passenger lamp picks up a little more of the right shoulder.
          const yaw=v.yaw+side*(main?.019:.037)+(main?0:.027);
          this.paint(x,z,Math.sin(yaw),Math.cos(yaw),length*(side<0&&!main?.88:1),spread,
            main?[124,134,137]:[106,94,71],level,obstacles);
        }
        const reverse=v.reversing||v.speed<-.45,brake=clamp(Math.max(v.brakes||0,v.handbrake||0),0,1);
        const tailGain=(.24+.76*brake)*(1+.38*wet);
        for(const side of [-1,1]){
          const u=side*body.w*.8,n=-body.d+.03;
          const x=v.x+n*body.s+u*body.c,z=v.z+n*body.c-u*body.s;
          this.paint(x,z,-body.s,-body.c,(reverse?6:2+3*brake)*(1+.65*wet),.28,
            reverse?[120,128,122]:[145,22,13],level*(reverse?.91:tailGain),obstacles);
        }
      }
      this.version++;
    }
    intensity(x,z){
      const col=Math.floor((x-this.left)/metres),row=Math.floor((this.north-z)/metres);
      if(!this.enabled||col<0||col>=size||row<0||row>=size)return 0;
      const i=(row*size+col)*4;
      return Math.max(this.pixels[i+1],this.pixels[i+2])/255;
    }
    askToDip(v,own,t,dt,blocks){
      const x=v.x-own.x,z=v.z-own.z,s=Math.sin(own.yaw),c=Math.cos(own.yaw),f=x*s+z*c;
      if(f<8||f>52||Math.abs(x*c-z*s)>Math.min(7,1+.24*f)||Math.cos(own.yaw-v.yaw)>-.72||v.speed<.5)return;
      const range=Math.hypot(x,z);
      if(blocks.some(b=>b.car!==own&&hit(b,own.x,own.z,x/range,z/range,range)<range-1))return;
      const glare=this.glare.get(v)||{time:-Infinity,exposure:0,asked:-Infinity};
      glare.exposure=(t-glare.time<.24?glare.exposure:0)+dt;glare.time=t;
      if(glare.exposure>.48&&t-glare.asked>18){v.headlightFlash=t;glare.asked=t;}
      this.glare.set(v,glare);
    }
    paint(x,z,s,c,length,slope,rgb,gain,blocks){
      const half=length*slope+.45,tipX=x+s*length,tipZ=z+c*length;
      const minX=clamp(Math.floor((Math.min(x-.5,tipX-half*Math.abs(c))-this.left)/metres),0,size);
      const maxX=clamp(Math.ceil((Math.max(x+.5,tipX+half*Math.abs(c))-this.left)/metres),0,size);
      const minY=clamp(Math.floor((this.north-Math.max(z+.5,tipZ+half*Math.abs(s)))/metres),0,size);
      const maxY=clamp(Math.ceil((this.north-Math.min(z-.5,tipZ-half*Math.abs(s)))/metres),0,size);
      // Start the visibility fan a little behind the lens so it has width at the bumper.
      const offset=.45/slope,ox=x-s*offset,oz=z-c*offset,full=length+offset,stops=this.stops;
      if(minX>=maxX||minY>=maxY)return;
      stops.fill(full);
      for(const b of blocks){
        const bx=b.x-ox,bz=b.z-oz,along=bx*s+bz*c,side=bx*c-bz*s;
        if(along+b.r<=0||along-b.r>full||Math.abs(side)>Math.max(0,along)*slope+b.r*(1+slope))continue;
        // Any ray that can hit the box must pass its bounding circle. Along
        // that ray, |side - along * angle| <= radius * sqrt(1 + angle²).
        const reach=b.r*Math.sqrt(1+slope*slope),factor=rays*.5/slope;
        const first=along>0?Math.max(0,Math.ceil((side-reach)/along*factor+rays*.5-1e-7)):0;
        const last=along>0?Math.min(rays,Math.floor((side+reach)/along*factor+rays*.5+1e-7)):rays;
        for(let i=first;i<=last;i++){
          const angle=(2*i/rays-1)*slope;
          stops[i]=hit(b,ox,oz,s+c*angle,c-s*angle,stops[i]);
        }
      }
      const narrow=length>16&&Math.abs(s*c)>.12;
      if(narrow){
        const l=x-.45*c,r=x+.45*c,nearL=z+.45*s,nearR=z-.45*s;
        const farL=tipX-half*c,farR=tipX+half*c,zL=tipZ+half*s,zR=tipZ-half*s;
        this.rows[0].fill(minX,minY,maxY);this.rows[1].fill(maxX,minY,maxY);
        spanEdge(this.rows,l,nearL,farL,zL,this.left,this.north);
        spanEdge(this.rows,farL,zL,farR,zR,this.left,this.north);
        spanEdge(this.rows,farR,zR,r,nearR,this.left,this.north);
        spanEdge(this.rows,r,nearR,l,nearL,this.left,this.north);
      }
      for(let py=minY;py<maxY;py++){
        const first=narrow?Math.max(minX,Math.floor(this.rows[0][py]-.5)):minX;
        const endX=narrow?Math.min(maxX,Math.ceil(this.rows[1][py]+.5)):maxX;
        const dz=this.north-(py+.5)*metres-z;
        const dx=this.left+(first+.5)*metres-x;
        let f=dx*s+dz*c,u=dx*c-dz*s;
        for(let px=first;px<endX;px++,f+=metres*s,u+=metres*c){
          if(f<0||f>=length)continue;
          const ratio=u/((f+offset)*slope);
          if(Math.abs(ratio)>=1)continue;
          const pos=(ratio+1)*rays*.5,i=Math.floor(pos),end=stops[i]+(stops[i+1]-stops[i])*(pos-i);
          if(f+offset>=end)continue;
          const core=1-smooth((Math.abs(ratio)-.23)/.77),fade=1-smooth((f/length-.22)/.78);
          const amount=gain*core*fade*clamp((end-f-offset)/1.1,0,1);
          const p=(py*size+px)*4;
          this.pixels[p]+=rgb[0]*amount;this.pixels[p+1]+=rgb[1]*amount;this.pixels[p+2]+=rgb[2]*amount;
        }
      }
    }
    drawMap(ctx,px,py,scale){
      if(!this.enabled)return;
      if(!this.canvas){
        this.canvas=document.createElement("canvas");this.canvas.width=this.canvas.height=size;
        this.context=this.canvas.getContext("2d",{alpha:false});
        this.image=new ImageData(this.pixels,size,size);
      }
      if(this.canvasVersion!==this.version){
        this.context.putImageData(this.image,0,0);this.canvasVersion=this.version;
      }
      ctx.save();ctx.globalCompositeOperation="lighter";ctx.globalAlpha=.58;
      ctx.drawImage(this.canvas,px(this.left),py(this.north),span*scale,span*scale);ctx.restore();
    }
  }
  window.BayRoadLights={Field,signalSide};
})();
