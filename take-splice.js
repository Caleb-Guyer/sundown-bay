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
    const eye=tz+5.4,ground=83,focus=199;
    const sky=c.createLinearGradient(0,9,0,ground);sky.addColorStop(0,"#93aca9");sky.addColorStop(1,"#f1c6a4");
    box(c,0,0,416,ground,sky);box(c,0,ground,416,234-ground,"#827c71");
    const project=(x,y,z)=>{
      const dx=x-tx,dz=eye-z,depth=Math.max(.8,dz*Math.cos(truckYaw)-dx*Math.sin(truckYaw));
      return [208-(dx*Math.cos(truckYaw)+dz*Math.sin(truckYaw))*focus/depth,ground+(3.05-y)*focus/depth];
    };
    const face=(vertices,col)=>poly(c,vertices.map(v=>project(...v)),col);
    const facade=["#d4987f","#b3ac94","#d8b38c","#93aaa1"];
    for(const side of [-1,1]){
      const outer=72+side*18,curb=72+side*5.9;
      face([[outer,0,-95],[curb,.12,-95],[curb,.12,eye-2],[outer,0,eye-2]],"#cdbca0");
      for(let i=0;i<8;i++){
        const z=-35+i*12;if(z+7>eye-2)continue;
        const wx=72+side*(8+i%3),height=3+i%4;
        const wall=(a,b,l,r,color)=>face([[wx,a,z+l],[wx,b,z+l],[wx,b,z+r],[wx,a,z+r]],color);
        wall(0,height,0,7,facade[(i+(side>0?1:0))%4]);
        face([[wx,0,z+7],[wx,height,z+7],[wx+side*6,height,z+7],[wx+side*6,0,z+7]],"#b29781");
        wall(height-.27,height,0,7,"#f3d8ae");
        for(let k=0;k<3;k++){
          const a=.65+k*2.1;
          wall(.56,2.17,a,a+1.45,"#546c6a");wall(1.89,2.1,a,a+1.45,"#93a6a0");
          if(height>4)wall(3.1,4.05,a,a+1.15,"#708480");
        }
        face([[wx,2.65,z+.25],[wx,2.65,z+6.8],[wx-side*.85,2.30,z+6.8],[wx-side*.85,2.30,z+.25]],i%2?"#657f78":"#a75f50");
      }
      for(let z=-50;z<eye-5;z+=9){
        const stripe=72+side*2.9;
        face([[stripe,0,z],[stripe+.11,0,z],[stripe+.11,0,z+3],[stripe,0,z+3]],"#bfb69b");
      }
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
    const fascia=(x0,x1,y0,y1,z,col)=>panel([[x0,y0,z],[x1,y0,z],[x1,y1,z],[x0,y1,z]],col);
    for(const side of [-1,1]){
      fascia(side*.95,side*.69,.03,.47,1.57,"#343938");
      fascia(side*1.10,side*.92,.85,.92,.79,"#984b3d");
      fascia(side*1.20,side*1.03,.89,1.00,.77,"#c86a53");
    }
    panel([[-.86,1.27,-.76],[.86,1.27,-.76],[.87,1.35,.51],[-.87,1.35,.51]],"#b84f3d");
    panel([[-.86,1.35,.51],[.86,1.35,.51],[.96,.87,1.07],[-.96,.87,1.07]],"#40585a");
    panel([[-.75,1.30,.54],[.75,1.30,.54],[.86,.91,1.03],[-.86,.91,1.03]],"#526c6c");
    panel([[-.51,1.17,.75],[-.37,1.19,.74],[-.30,1.13,.80],[-.32,1.00,.95],[-.46,.98,.96],[-.53,1.06,.86]],"#bb825f");
    panel([[-.55,1.10,.83],[-.52,1.21,.69],[-.36,1.23,.67],[-.29,1.15,.77],[-.39,1.17,.75],[-.49,1.11,.82]],"#493d38");
    panel([[-.68,.90,1.04],[-.60,1.00,.95],[-.45,1.02,.93],[-.33,1.00,.95],[-.26,.90,1.04]],"#334846");
    panel([[.02,1.30,.55],[.72,1.30,.55],[.82,1.15,.73],[.10,1.04,.88]],"#92aaa4");
    panel([[-.96,.87,1.07],[.96,.87,1.07],[1,.70,2.09],[-1,.70,2.09]],"#cb614b");
    for(const side of [-1,1]){
      panel([[side*.76,.86,1.10],[side*.80,.86,1.10],[side*.88,.71,2.04],[side*.83,.71,2.04]],"#e38968");
      panel([[side*.55,.86,1.10],[side*.58,.86,1.10],[side*.69,.73,1.90]],"#ae5344");
    }
    panel([[-1,.70,2.09],[1,.70,2.09],[.96,.27,2.11],[-.96,.27,2.11]],"#8f4439");
    fascia(-.97,.97,.31,.39,2.12,"#494e49");fascia(-.92,.92,.385,.41,2.12,"#c9b99e");
    fascia(-.51,.51,.48,.62,2.13,"#383f3b");fascia(-.49,.49,.54,.555,2.14,"#84918a");
    fascia(-.17,.17,.285,.38,2.14,"#e7d4a7");fascia(-.11,.10,.32,.337,2.15,"#5b7168");
    for(const side of [-1,1]){
      fascia(side*.96,side*.54,.455,.647,2.13,"#543f36");
      fascia(side*.92,side*.55,.49,.61,2.14,"#f2daaa");
      fascia(side*.93,side*.98,.48,.60,2.14,"#d9964f");
      fascia(side*.74,side*.76,.49,.61,2.15,"#b6a388");
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
