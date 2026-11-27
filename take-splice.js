/* The Luna cutting bench keeps one camera negative and one independently released print. */
(() => {
  "use strict";
  const negativeKey="sundownBay.stuntNegative.v1",releaseKey="sundownBay.stuntCut.v1";
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const quant=n=>Math.round(n*100);
  class Roll{
    constructor(){this.frames=[];this.lip=null;}
    sample(run){
      if(!["rolling","air","landed"].includes(run.phase)||this.closed)return;
      const t=quant(run.clock),landing=run.phase==="landed",lift=run.phase==="air"&&this.lip===null;
      const c=run.coupe,v=run.truck,last=this.frames.at(-1);
      if(!lift&&!landing&&last&&t-last[0]<8)return;
      if(lift)this.lip=t;
      if(last?.[0]===t)this.frames.pop();
      this.frames.push([t,...[c.x,c.z,c.y,c.pitch,c.yaw,v.x,v.z,v.yaw].map(quant)]);
      while(this.frames.length>2&&t-this.frames[1][0]>420)this.frames.shift();
      if(landing)this.closed=true;
    }
    finish(run,morning){
      if(!this.closed||this.lip===null||this.frames.length<3)return null;
      const start=this.frames[0][0],frames=this.frames.map(([t,...pose])=>[t-start,...pose]);
      return {take:run.number,distance:run.distance,pier:morning?.luis||"",lip:this.lip-start,frames};
    }
  }
  function valid(f){
    if(!f||!Number.isSafeInteger(f.take)||f.take<1||!Number.isFinite(f.distance)||f.distance<=0||f.distance>100||
      !["","ashore","aboard"].includes(f.pier)||!Array.isArray(f.frames)||f.frames.length<3||f.frames.length>65)return false;
    let previous=-1;
    for(const row of f.frames){
      if(!Array.isArray(row)||row.length!==9||!row.every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=20000)||
        row[0]<=previous||row[0]>470||row[3]<0||row[3]>850)return false;
      previous=row[0];
    }
    return f.frames[0][0]===0&&Number.isInteger(f.lip)&&f.lip>0&&f.lip<previous;
  }
  const end=f=>f.frames.at(-1)[0];
  const target=f=>f.pier==="ashore"?f.lip:end(f);
  const matched=(f,at)=>Math.abs(at-target(f))<=18;
  const speed=65; // Hundredths of recorded time per second of projection.
  const duration=f=>Math.ceil(end(f)/speed+1.25);
  function pose(f,at){
    const rows=f.frames;let i=1;
    while(i<rows.length-1&&rows[i][0]<at)i++;
    const a=rows[i-1],b=rows[i],u=clamp((at-a[0])/(b[0]-a[0]),0,1);
    return a.slice(1).map((n,j)=>(n+(b[j+1]-n)*u)/100);
  }
  function get(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
  function put(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
  function negative(){const f=get(negativeKey);return valid(f)?f:null;}
  function release(){const r=get(releaseKey);return valid(r?.film)&&Number.isInteger(r.at)&&r.at>=0&&r.at<=end(r.film)?r:null;}
  function brief(f){return f.pier==="ashore"?
    "Dalia left Luis on the pier. “Hold on the pavement till the last tire leaves it. Then give me Jules’s camera.”":
    f.pier==="aboard"?"Dalia held the boat for Luis. “Stay wide till Romy lands. I want both of them on that deck when you cut.”":
    "Jules tapped the truck rail. “Stay wide until those tires touch the planks. Then come to my camera.”";}
  const box=(c,x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
  function poly(c,pts,ink){c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fillStyle=ink;c.fill();}
  function oval(c,x,y,rx,ry,ink){c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fillStyle=ink;c.fill();}
  const body={kind:"coupe",color:"#b94938",model:"coupe"};
  function pail(c,x,y,s){
    c.save();c.translate(x,y);c.scale(s,s);
    c.strokeStyle="#39494a";c.lineWidth=1.4;c.beginPath();c.arc(0,-8,4,Math.PI,2*Math.PI);c.stroke();
    box(c,-6,-8,12,8,"#386d7b");box(c,-7,-9,14,2,"#c5c3a5");box(c,-1,-7,2,3,"#dcca95");c.restore();
  }
  function profile(c,p,pier){
    const [x,z,h,pitch,yaw,tx,tz]=p,s=8.8,ground=183,pan=(z-37)*5.8;
    BayPictureJumpBook.promenadeShot(c,pan);
    const screen=n=>134+(n-37)*s-pan;
    box(c,0,ground,416,55,"#837d73");box(c,0,ground+12,416,1.5,"#a09a86");
    const ramp=BayTake.ramp;
    poly(c,[[screen(ramp.toe),ground],[screen(ramp.lip),ground-ramp.height*s],[screen(ramp.lip),ground]],"#937350");
    for(let i=0;i<5;i++){const d=(i+1)/5;box(c,screen(ramp.toe+10*d)-2,ground-ramp.height*s*d,2,ramp.height*s*d,"#5b5146");}
    if(pier==="ashore")pail(c,screen(39),ground+1,.75);
    c.save();c.translate(screen(tz),ground+(tx-72)*1.5);c.scale(s,s);
    box(c,-3.55,-1.20,7.1,.22,"#e0b374");box(c,-3.55,-.98,8.4,.26,"#514e49");
    for(let i=-3;i<4;i++)box(c,i,-1.17,.08,.15,"#8b6549");
    poly(c,[[3.1,-1.08],[3.22,-2.52],[4.35,-2.56],[5.03,-1.82],[5.64,-1.53],[5.60,-.65],[3.1,-.65]],"#366962");
    poly(c,[[3.4,-2.35],[4.24,-2.36],[4.82,-1.76],[3.4,-1.75]],"#94aca6");
    box(c,4.72,-1.48,.85,.11,"#eed5a6");box(c,3.33,-1.50,.20,.09,"#ddc79e");
    for(const ax of [-2.45,-1.35,4.3]){oval(c,ax,-.5,.51,.51,"#33383a");oval(c,ax,-.5,.27,.27,"#b9b7a4");}
    c.restore();
    if(pier==="aboard")pail(c,screen(tz+2.9),ground-1.24*s,.46);
    oval(c,screen(z),ground+(x-72)*1.5,18,2.2,"rgba(39,41,37,.32)");
    c.save();c.translate(screen(z),ground-h*s+(x-72)*1.5);c.rotate(pitch);c.scale(.82*Math.cos(yaw),.82);
    BayPictureJumpBook.filmCar(c,body,z);c.restore();
  }
  function deck(c,p,pier){
    const [cx,cz,h,pitch,yaw,tx,tz,truckYaw]=p;
    box(c,0,0,416,106,"#d5baab");box(c,0,94,416,140,"#807e76");
    const eye=tz+5.4,ground=83,focus=199;
    const project=(x,y,z)=>{
      const dx=x-tx,dz=eye-z,depth=Math.max(.8,dz*Math.cos(truckYaw)-dx*Math.sin(truckYaw));
      return [208-(dx*Math.cos(truckYaw)+dz*Math.sin(truckYaw))*focus/depth,ground+(3.05-y)*focus/depth];
    };
    const face=(vertices,col)=>poly(c,vertices.map(v=>project(...v)),col);
    for(const side of [-1,1]){
      for(let i=0;i<8;i++){
        const z=-35+i*12;if(z>eye-5)continue;
        const wx=72+side*(8+i%3),height=3+i%4;
        face([[wx,0,z],[wx,height,z],[wx,height,z+6],[wx,0,z+6]],i%2?"#a09682":"#9c8680");
        face([[wx,height-.6,z],[wx,height-.9,z],[wx,height-.9,z+6],[wx,height-.6,z+6]],"#e6bc94");
      }
      face([[72+side*5.5,0,-65],[72+side*5.42,0,-65],[tx+side*5.42,0,eye-3],[tx+side*5.5,0,eye-3]],"#d8c8a6");
    }
    const ramp=BayTake.ramp;
    face([[70,0,ramp.toe],[74,0,ramp.toe],[74,2.4,ramp.lip],[70,2.4,ramp.lip]],"#b29a72");
    face([[70,2.4,ramp.lip],[74,2.4,ramp.lip],[74,0,ramp.lip],[70,0,ramp.lip]],"#675b4b");
    const plank=(x,z)=>[tx+x*Math.cos(truckYaw)+z*Math.sin(truckYaw),1.2,tz-x*Math.sin(truckYaw)+z*Math.cos(truckYaw)];
    for(let i=0;i<8;i++){const x=-2+i*.5;
      face([plank(x,-3.55),plank(x+.49,-3.55),plank(x+.49,3.55),plank(x,3.55)],i%2?"#b39670":"#bfa37c");
    }
    for(const side of [-1,1]){face([plank(1.88*side,-3.55),plank(2*side,-3.55),plank(2*side,3.55),plank(1.88*side,3.55)],"#617b74");}
    const vehicle=(x,y,z)=>{
      const lift=y*Math.cos(pitch)-z*Math.sin(pitch),along=y*Math.sin(pitch)+z*Math.cos(pitch);
      return [cx+x*Math.cos(yaw)+along*Math.sin(yaw),h+lift,cz-x*Math.sin(yaw)+along*Math.cos(yaw)];
    };
    const panel=(pts,col)=>face(pts.map(v=>vehicle(...v)),col);
    panel([[-.86,1.27,-.76],[.86,1.27,-.76],[.87,1.35,.51],[-.87,1.35,.51]],"#b84f3d");
    panel([[-.86,1.35,.51],[.86,1.35,.51],[.96,.87,1.07],[-.96,.87,1.07]],"#40585a");
    panel([[0,1.29,.56],[.69,1.29,.56],[.83,.93,1.01],[.11,.93,1.01]],"#819d9a");
    panel([[-.96,.87,1.07],[.96,.87,1.07],[1,.70,2.09],[-1,.70,2.09]],"#cb614b");
    panel([[-1,.70,2.09],[1,.70,2.09],[.96,.27,2.11],[-.96,.27,2.11]],"#8f4439");
    for(const side of [-1,1]){
      const a=side*.95,b=side*.62;
      panel([[a,.63,2.12],[b,.63,2.12],[b,.49,2.12],[a,.49,2.12]],"#e5cc96");
      panel([[a,.27,1.70],[b,.27,1.70],[b,.04,1.70],[a,.04,1.70]],"#353938");
    }
    if(pier==="aboard")pail(c,54,220,2.0);
  }
  function paint(c,f,at,cut){
    c.save();c.beginPath();c.rect(0,0,416,234);c.clip();
    const p=pose(f,at);if(at<cut)profile(c,p,f.pier);else deck(c,p,f.pier);
    box(c,0,0,416,9,"#2e3333");box(c,0,225,416,9,"#2e3333");c.restore();
  }
  window.BayTakeSplice={Roll,valid,end,target,matched,duration,speed,pose,brief,paint,negative,release,
    keep:f=>put(negativeKey,f),print:(film,at)=>put(releaseKey,{film,at})};
})();
