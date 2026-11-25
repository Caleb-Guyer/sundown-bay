/* The rangefinder uses the street camera. Canvas-only devices project the same local scenery. */
(() => {
  "use strict";
  const filmKey="sundownBay.coastCamera.v1",clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function valid(p){
    return !!p&&!!BaySecondSeat.find(p.id)&&Number.isInteger(p.score)&&p.score>0&&p.score<=100&&
      ["heron","paloma"].includes(p.bike)&&["player","ines"].includes(p.photographer)&&Number.isFinite(p.clock)&&
      typeof p.token==="string"&&/^[a-z0-9-]{4,55}$/.test(p.token)&&typeof p.image==="string"&&p.image.length<=96000&&/^data:image\/jpeg;base64,\/9j\/[a-zA-Z0-9+/]+={0,2}$/.test(p.image);
  }
  const tidy=p=>({...p,title:BaySecondSeat.find(p.id).title});
  class Book{
    constructor(last){
      this.prints={};this.pending=null;
      try{const r=JSON.parse(localStorage.getItem(filmKey)||"null");if(r){
        for(const c of BaySecondSeat.briefs){const p=r.prints?.[c.id];if(valid(p)&&p.id===c.id)this.prints[c.id]=tidy(p);}
        if(valid(r.pending))this.pending=tidy(r.pending);
      }}catch{}
      if(this.pending?.token===last)this.file();
    }
    write(){try{localStorage.setItem(filmKey,JSON.stringify({prints:this.prints,pending:this.pending}));return true;}catch{return false;}}
    expose(p){if(!valid(p))return false;this.pending=tidy(p);this.write();return true;}
    file(){
      const p=this.pending;if(!p)return;
      if(!this.prints[p.id]||p.score>this.prints[p.id].score)this.prints={...this.prints,[p.id]:p};
      this.pending=null;this.write();
    }
  }
  function frame(c,project,source,b,range,clock,wheel,cars=[],neon=null){
    const box=BayMeetPhoto.crop(source.width,source.height,.5,.5,4/3,true);
    const coord=p=>{const q=project(p.x,p.y,p.z);return q&&{u:(q.x-box.x)/box.w,v:(q.y-box.y)/box.h};};
    const center=coord(c.subject),left=coord(c.left),right=coord(c.right),lo=coord({...c.subject,y:c.lower}),hi=coord({...c.subject,y:c.upper});
    if(![center,left,right,lo,hi].every(q=>q&&q.u>.02&&q.u<.98&&q.v>.012&&q.v<.988)||range>58)return 0;
    const size=Math.max(Math.abs(left.u-right.u),Math.abs(hi.v-lo.v)),ideal=c.id==="marlin"?.43:.64;
    if(size<.09)return 0;
    const compose=1-clamp(Math.hypot((center.u-.49)*1.70,(center.v-.48)*1.55),0,1);
    const coverage=1-clamp(Math.abs(ideal-size)/ideal,0,1),steady=1-clamp(Math.abs(b.yawRate||0)*.55+Math.max(0,Math.abs(b.speed)-6)*.037,0,1);
    let light;
    if(c.id==="wheel")light=clamp((BayCoastWheelArt.cabin(wheel,0).floor-3)/19,0,1);
    else if(c.id==="marlin"){
      const lamps=neon?.lights,glow=lamps?.length?lamps.reduce((sum,n)=>sum+n,0)/lamps.length:1;
      light=(1-clamp(Math.abs(clock.minute-1140)/370,0,1))*.58+clamp(glow,0,1)*.42;
    }else{
      const passing=cars.some(v=>{if(Math.abs(v.speed)<1.5||Math.hypot(v.x-b.x,v.z-b.z)>range)return false;
        const p=coord({x:v.x,y:1.15,z:v.z});return p&&p.u>.10&&p.u<.90&&p.v>.48&&p.v<.94;});
      light=(passing?.67:0)+.33*(1-clamp(Math.abs(clock.minute-1020)/430,0,1));
    }
    return Math.round(17+34*compose+25*coverage+11*steady+13*light);
  }
  function negative(ride,score,src,sky,clock){
    const image=BayMeetPhoto.capture(src,sky,.5,.5,4/3,true);if(!image)return null;
    const j=ride.job;return {id:j.brief.id,title:j.brief.title,score,bike:j.b.kind,photographer:j.role==="pillion"?"player":"ines",clock:Math.round(clock.minute),
      token:ride.film.pending?.token||Date.now().toString(36)+"-"+Math.floor(Math.random()*0xfffffff).toString(36),image};
  }
  function basis(eye,w,h){
    const sn=Math.sin(eye.yaw),cs=Math.cos(eye.yaw),sp=Math.sin(eye.pitch),cp=Math.cos(eye.pitch),f=h*(eye.focal||1.5)*.5;
    return (x,y,z,out)=>{x-=eye.x;y-=eye.y;z-=eye.z;const a=x*sn+z*cs,d=a*cp+y*sp;
      out[0]=w*.5+(x*cs-z*sn)*f/d;out[1]=h*.5-(y*cp-a*sp)*f/d;out[2]=d;return out;};
  }
  function pack(source,selector){
    const out=[];for(let i=0;i<source.length;i+=18){
      if(selector&&!selector(source,i))continue;
      for(const k of [0,6,12])out.push(source[i+k],source[i+k+1],source[i+k+2]);out.push(source[i+3],source[i+4],source[i+5]);
    }return new Float32Array(out);
  }
  // Retain the street's larger painted surfaces in small geographic groups for bystander replays.
  function streetTiles(city){
    const bins=new Map();
    for(let i=0;i<city.length;i+=18){
      const x0=Math.min(city[i],city[i+6],city[i+12]),x1=Math.max(city[i],city[i+6],city[i+12]);
      const z0=Math.min(city[i+2],city[i+8],city[i+14]),z1=Math.max(city[i+2],city[i+8],city[i+14]);
      const dy=Math.max(city[i+1],city[i+7],city[i+13])-Math.min(city[i+1],city[i+7],city[i+13]);
      if(Math.max(x1-x0,z1-z0,dy)<.85)continue;
      const k=Math.max(x1-x0,z1-z0)>44?"wide":Math.floor((x0+x1)/64)+","+Math.floor((z0+z1)/64);
      let data=bins.get(k);if(!data){data=[];bins.set(k,data);}
      for(const j of [0,6,12])data.push(city[i+j],city[i+j+1],city[i+j+2]);
      data.push(city[i+3],city[i+4],city[i+5]);
    }
    for(const [key,data] of bins)bins.set(key,new Float32Array(data));return bins;
  }
  class Scenery{
    constructor(city){
      this.streetCars=new Map();this.models=new Map();this.sectors={};this.canvas=null;this.time=-50;this.collecting=false;
      if(typeof city==="function")this.source=city;else this.prepare(city);
    }
    prepare(city){
      this.cityTiles=streetTiles(city);
      for(const c of BaySecondSeat.briefs){const {x,z}=c.subject;
        this.sectors[c.id]=pack(city,(v,i)=>{
          const minX=Math.min(v[i],v[i+6],v[i+12]),maxX=Math.max(v[i],v[i+6],v[i+12]),minZ=Math.min(v[i+2],v[i+8],v[i+14]),maxZ=Math.max(v[i+2],v[i+8],v[i+14]);
          if(maxX<x-54||minX>x+54||maxZ<z-54||minZ>z+54)return false;
          return Math.max(maxX-minX,maxZ-minZ,Math.abs(v[i+1]-v[i+7]),Math.abs(v[i+1]-v[i+13]))>.095;
        });
      }
    }
    remember(name,make){
      if(!this.collecting||this.models.has(name)||!name.startsWith("coastwheel-")&&!name.startsWith("marlin-neon-")&&!name.startsWith("marlin-bent-glass/"))return;
      if(name.startsWith("coastwheel-")&&!/distant|lamps|far-/.test(name))return;
      const g=new BayMesh();make(g);this.models.set(name,pack(g.vertices));
    }
    paint(out,eye,c,t,env,force=false){
      if(this.source){this.prepare(this.source());this.source=null;}
      if(!this.canvas)this.canvas=document.createElement("canvas");
      const canvas=this.canvas,w=env.curb?Math.min(320,out.width):352,h=env.curb?Math.round(w*out.height/out.width):Math.max(136,Math.min(280,Math.round(w*out.height/out.width)));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;this.image=null;}
      const ctx=canvas.getContext("2d",{alpha:false});
      const project=basis(eye,w,h),q=[0,0,0];
      const dirty=force||this.id!==c.id||t-this.time>.080;
      if(dirty){
        this.id=c.id;this.time=t;
        if(!this.image){this.image=ctx.createImageData(w,h);this.depth=new Float32Array(w*h);}
        const pixels=this.image.data,depth=this.depth;depth.fill(0);
        const night=env.hours.night,ground=145-Math.floor(night*65),sky=env.hours.rain>.34?[111,133,143]:[129,171,188];
        for(let y=0;y<h;y++){const above=y/h<.49+eye.pitch*(eye.focal||1.5)*.5,f=clamp(y/h,0,1);
          const colors=above?sky.map((v,i)=>(v*(1-f)+[239,195,160][i]*f)*(1-night*.57)):[ground*.73,ground*.76,ground*.72];
          for(let i=y*w*4,end=i+w*4;i<end;i+=4){pixels[i]=colors[0];pixels[i+1]=colors[1];pixels[i+2]=colors[2];pixels[i+3]=255;}}
        const a=[0,0,0],b=[0,0,0],d=[0,0,0];
        const raster=(verts,part)=>{
          if(!verts)return;
          const [name,x=0,y=0,z=0,yaw=0,pitch=0,roll=0,glow=0]=part||[],sn=Math.sin(yaw),cs=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch),sr=Math.sin(roll),cr=Math.cos(roll);
          const vertex=(k,p)=>{let xx=verts[k],yy=verts[k+1],zz=verts[k+2];
            if(part){const py=yy*cp-zz*sp,pz=yy*sp+zz*cp,rx=xx*cr-py*sr;yy=xx*sr+py*cr;xx=x+rx*cs+pz*sn;zz=z-rx*sn+pz*cs;yy+=y;}
            return project(xx,yy,zz,p);};
          for(let i=0;i<verts.length;i+=12){
            vertex(i,a);vertex(i+3,b);vertex(i+6,d);
            if(a[2]<.22||b[2]<.22||d[2]<.22)continue;
            const x0=Math.max(0,Math.ceil(Math.min(a[0],b[0],d[0]))),x1=Math.min(w-1,Math.floor(Math.max(a[0],b[0],d[0]))),
              y0=Math.max(0,Math.ceil(Math.min(a[1],b[1],d[1]))),y1=Math.min(h-1,Math.floor(Math.max(a[1],b[1],d[1])));
            if(x1<x0||y1<y0)continue;
            const A=b[1]-d[1],B=d[0]-b[0],C=d[1]-a[1],D=a[0]-d[0],area=A*(a[0]-d[0])+B*(a[1]-d[1]);if(Math.abs(area)<.16)continue;
            const ax=A/area,ay=B/area,bx=C/area,by=D/area,iz=1/d[2],za=1/a[2]-iz,zb=1/b[2]-iz;
            const lum=1-night*.54+glow*.17,fog=clamp((a[2]+b[2]+d[2])/810,0,.29);
            const red=clamp(verts[i+9]*250*lum*(1-fog)+142*fog,0,255),green=clamp(verts[i+10]*249*lum*(1-fog)+155*fog,0,255),blue=clamp(verts[i+11]*244*lum*(1-fog)+155*fog,0,255);
            for(let row=y0;row<=y1;row++){
              let u=ax*(x0-d[0])+ay*(row-d[1]),v=bx*(x0-d[0])+by*(row-d[1]),j=row*w+x0;
              for(let col=x0;col<=x1;col++,j++,u+=ax,v+=bx){
                if(u<0||v<0||u+v>1)continue;const inv=iz+za*u+zb*v;if(inv<=depth[j])continue;
                depth[j]=inv;const at=j*4;pixels[at]=red;pixels[at+1]=green;pixels[at+2]=blue;
              }
            }
          }
        };
        if(env.curb){
          const cx=Math.floor(eye.x/32),cz=Math.floor(eye.z/32);
          raster(this.cityTiles.get("wide"),null);
          for(let x=cx-3;x<=cx+3;x++)for(let z=cz-3;z<=cz+3;z++)raster(this.cityTiles.get(x+","+z),null);
        }else raster(this.sectors[c.id],null);
        const list=[];this.collecting=true;
        if(c.id==="wheel"){if(!this.wheel){BayCoastWheelArt.install(env.model);this.wheel=true;}BayCoastWheelArt.world(list,(_p,range)=>range>120,t,env.hours,env.wheel);}
        if(c.id==="marlin"){if(!this.neon){BayMarlinNeonArt.install(env.model);this.neon=true;}BayMarlinNeonArt.world(list,(_p,range)=>range>100,env.neon,t,env.hours);}
        this.collecting=false;
        for(const command of list){
          const name=command[0];
          if(!this.models.has(name)){const uploaded=env.cpu?.get(name);if(uploaded)this.models.set(name,pack(uploaded));}
          raster(this.models.get(name),command);
        }
        for(const v of env.cars){
          if(env.curb){
            const key=v.kind+"#"+v.color;
            let mesh=this.streetCars.get(key);
            if(!mesh){const g=new BayMesh();buildBayCar(g,v.kind,v.color);mesh=pack(g.vertices);
              if(this.streetCars.size>=14)this.streetCars.delete(this.streetCars.keys().next().value);this.streetCars.set(key,mesh);}
            raster(mesh,[key,v.x,v.y,v.z,v.yaw,v.pitch,v.lean]);
            continue;
          }
          if(Math.abs(v.x-eye.x)>46||Math.abs(v.z-eye.z)>46)continue;
          const name="film-traffic/"+v.kind+v.color;
          if(!this.models.has(name)){const g=new BayMesh(),width=(v.footprint?.track||.9)*2,length=(v.footprint?.halfLength||2.1)*2;
            g.box(0,.56,0,width,.64,length,v.color||"#759a91");g.box(0,1.05,-.14,width*.79,.53,length*.54,"#638188");
            for(const side of [-1,1])for(const end of [-1,1])g.box(side*width*.465,.32,end*length*.30,.18,.50,.54,"#394349");this.models.set(name,pack(g.vertices));}
          raster(this.models.get(name),[name,v.x,.041,v.z,v.yaw]);
        }
        ctx.putImageData(this.image,0,0);this.lastProject=project;
      }
      const screen=out.getContext("2d");screen.drawImage(canvas,0,0,out.width,out.height);
      return (x,y,z)=>{(this.lastProject||project)(x,y,z,q);return q[2]>.2?{x:q[0]/w,y:q[1]/h}:null;};
    }
  }
  window.BayRideFilm={Book,Scenery,negative,frame,valid,key:filmKey};
})();
