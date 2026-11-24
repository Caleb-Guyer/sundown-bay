/* An umbrella from the Marlin follows its borrower between the four Route 6 shelters. */
(() => {
  "use strict";
  const key="sundownBay.rainWalk.v1",gap=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
  const trips={
    alba:{name:"Alba Font",offer:"Hold that a little to your right? These tickets still smell like ink.",signed:"The red ink stayed on the tickets for once. Dad says keep the guava-print umbrella."},
    inezabel:{name:"Belén Sierra",offer:"Mind walking with me? I lined this basket with yesterday’s paper.",signed:"The bottom held. I put the softest guava aside for you."},
    lon:{name:"Lon Bell",offer:"Room for my lunch pail? My girl drew me something on the lid.",signed:"She drew us both fishing. You can still see her name in the corner."},
    miki:{name:"Miki Sáenz",offer:"Could you cover the tin? The splice is fresh.",signed:"The splice held through the late show. You’ve got a seat in the booth."},
    noor:{name:"Noor Vale",offer:"I just ironed these. Walk with me a minute?",signed:"All six pillowcases went upstairs with their creases in."},
    ruben:{name:"Rubén Díaz",offer:"Got room on that side? I’m taking the bread home in a paper bag.",signed:"We ate it on the steps. The paper even made it back to the bakery."}
  };
  const racks=[{id:"room14",name:"Marlin Motel",x:130.85,z:-32.85,y:.076,yaw:Math.PI/2},
    ...BayTransit.stops.map(s=>({...BayDriving.world(s,1.96,s.id==="marlin"?4.30:-4.30),id:s.id,name:s.short,y:s.y,yaw:s.yaw-Math.PI/2}))];
  const block=r=>({x:r.x,z:r.z,w:Math.abs(Math.cos(r.yaw))*.86+Math.abs(Math.sin(r.yaw))*.44,
    d:Math.abs(Math.cos(r.yaw))*.44+Math.abs(Math.sin(r.yaw))*.86,bottom:0,top:1.25,streetProp:true});
  function read(){
    let raw;try{raw=JSON.parse(localStorage.getItem(key));}catch{}
    const notes={};
    for(const id of Object.keys(trips)){const value=raw?.notes?.[id];if(Number.isInteger(value)&&value>=65&&value<=100)notes[id]=value;}
    return {borrowed:racks.some(r=>r.id===raw?.borrowed)?raw.borrowed:"",style:raw?.style===1&&Object.keys(notes).length?1:0,notes};
  }
  function nearRack(p){return racks.find(r=>gap(r,p)<2.25);}
  function eligible(p){
    if(!Object.hasOwn(trips,p.id))return false;
    if(p.stage==="work")return true;
    if(p.stage!=="back"&&p.stage!=="street")return false;
    return p.path.length&&gap(p,p.path.at(-1))>=4;
  }
  class Walk {
    constructor(){this.book=read();this.open=false;this.amount=0;this.trip=null;}
    write(edit){
      const disk=read(),book=this.book;
      for(const [id,n] of Object.entries(disk.notes))book.notes[id]=Math.max(n,book.notes[id]||0);
      edit(book);try{localStorage.setItem(key,JSON.stringify(book));}catch{}
    }
    borrow(r,style){this.write(b=>{b.borrowed=r.id;b.style=style===1&&Object.keys(b.notes).length?1:0;});this.open=true;}
    returnLoan(){this.open=false;this.write(b=>{b.borrowed="";});}
    nearby(hero,line){
      if(this.trip||!this.book.borrowed||!this.open)return null;
      let best=null,d=2.8;for(const p of line.people)if(eligible(p)&&gap(p,hero)<d){best=p;d=gap(p,hero);}
      return best;
    }
    offer(hero,line,ground){
      const p=this.nearby(hero,line);if(!p)return null;
      if(p.stage==="work")line.returnToStop(p,ground);
      this.trip={p,stage:p.stage,place:p.stage==="back"?BayTransit.stops[p.from].short+" bus stop":line.workName(p.from),
        covered:0,distance:0,idle:0,lastX:p.x,lastZ:p.z};
      return trips[p.id].offer;
    }
    cover(hero,p){
      const center=BayDriving.world(hero,.12,.12);
      return this.amount*Math.min(1,Math.max(0,(1.09-gap(center,p))/.23));
    }
    pace(p,hero){return this.trip?.p===p?Math.min(1,Math.max(0,(2.1-gap(p,hero))/.85)):1;}
    stride(hero,clear){
      const p=this.trip?.p;if(!p||!p.path.length)return null;
      // Follow the same pavement as the passenger. At a narrow corner fall in behind them.
      const q=p.path[0],dx=q.x-p.x,dz=q.z-p.z,len=Math.hypot(dx,dz)||1,ux=dx/len,uz=dz/len;
      for(const [side,along] of [[-.57,-.12],[0,-.62],[.54,-.10],[0,0]]){
        const x=p.x+uz*side+ux*along,z=p.z-ux*side+uz*along;
        if(!clear(x,z,.32))continue;
        const vx=x-hero.x,vz=z-hero.z,d=Math.hypot(vx,vz),speed=1.42*this.pace(p,hero);
        return {x:ux*speed+vx*Math.min(4.8,3.1/Math.max(.001,d)),z:uz*speed+vz*Math.min(4.8,3.1/Math.max(.001,d))};
      }
      return null;
    }
    step(dt,hero,free,rain){
      if(!free)this.open=false;
      this.amount=free?Math.max(0,Math.min(1,this.amount+(this.open&&this.book.borrowed?2.65:-3.3)*dt)):0;
      const t=this.trip;if(!t)return null;
      const p=t.p,d=Math.hypot(p.x-t.lastX,p.z-t.lastZ);
      t.lastX=p.x;t.lastZ=p.z;t.distance+=d;t.covered+=d*this.cover(hero,p);
      t.idle=gap(p,hero)>2.1?t.idle+dt:0;
      if(!free||!this.open||!this.book.borrowed||gap(p,hero)>8||t.idle>9){this.trip=null;return {p,line:"I can take it from here. See you on the six."};}
      if(p.stage===t.stage){
        if(!t.warned&&t.idle>2.2){t.warned=true;return {p,line:"Wait a second. Let me get back under there."};}
        if(!t.spoke&&t.distance>7&&rain>.30&&t.covered/t.distance>.70){
          t.spoke=true;const lines={alba:"Hear it on the canvas? We used to count the drops till the bus came.",
            inezabel:"I can smell the guavas every time a drop hits that lid.",lon:"She drew a sun on the lid, too. Wishful thinking.",
            miki:"A dry tin makes no noise. If it starts to rattle, tell me.",noor:"Six pillowcases down here. Feel how heavy that bag is?",
            ruben:"I can still feel the heat coming through the paper."};
          return {p,line:lines[p.id]};
        }
        return null;
      }
      this.trip=null;
      const score=Math.round(100*t.covered/Math.max(.01,t.distance));
      if(score<65||t.distance<3)return {p,line:"Thanks for the company. There’s the door."};
      this.write(b=>{b.notes[p.id]=Math.max(b.notes[p.id]||0,score);});
      return {p,score,line:trips[p.id].signed};
    }
  }
  const porches=[...[-45,-37,-26,-20,-15.4].map(z=>({x:130.70,z})),
    ...BayTransit.stops.flatMap(s=>[-2.92,-1.24].map(z=>BayDriving.world(s,1.38,z)))];
  function sameSide(a,b){
    for(const axis of [-144,-72,0,72,144]){
      if((a.x-axis)*(b.x-axis)<0||(a.z-axis)*(b.z-axis)<0)return false;
    }
    return true;
  }
  function clearLine(a,b,valid){
    const n=Math.ceil(gap(a,b)/.32);
    for(let i=1;i<=n;i++)if(!valid(a.x+(b.x-a.x)*i/n,a.z+(b.z-a.z)*i/n,.27))return false;
    return true;
  }
  function porchStep(p,dt,rain,now,people,cars,valid){
    if(p.name||p.canopyStyle!=null||p.role==="runner")return false;
    let cover=p.porch;
    if(!cover){
      if(rain<.35||now<(p.porchCheck||0))return false;
      p.porchCheck=now+1.8+p.reactionBeat;
      let nearest=Infinity;
      for(const end of porches){
        const d=gap(p,end);
        if(d>9||d>=nearest||!sameSide(p,end)||people.some(q=>q!==p&&q.porch?.end===end))continue;
        const bends=[null,{x:p.x,z:end.z},{x:end.x,z:p.z}];
        for(const bend of bends){
          if(bend&&!clearLine(p,bend,valid)||!clearLine(bend||p,end,valid))continue;
          cover={origin:{x:p.x,z:p.z},end,bend,path:bend?[bend,end]:[end],back:false};nearest=d;break;
        }
      }
      if(!cover)return false;
      p.porch=cover;
    }
    if(!cover.back&&rain<.12){
      cover.back=true;cover.path=cover.bend&&clearLine(p,cover.bend,valid)?[cover.bend,cover.origin]:[cover.origin];
    }
    p.moving=false;p.gesture=0;
    const q=cover.path[0];
    if(!q){if(cover.back){p.porch=null;return false;}p.gesture=2;return true;}
    const dx=q.x-p.x,dz=q.z-p.z,d=Math.hypot(dx,dz);
    if(d<.05){cover.path.shift();return true;}
    const step=Math.min(d,dt*(cover.back?p.pace:1.65)),x=p.x+dx*step/d,z=p.z+dz*step/d;
    if(!valid(x,z,.24)||cars.some(v=>Math.abs(x-v.x)<4&&Math.abs(z-v.z)<4&&BayDriving.clearance(v,{x,z})<.38)){
      if((cover.stuck=(cover.stuck||0)+dt)>1.7){p.porch=null;p.porchCheck=now+4;}return true;
    }
    p.x=x;p.z=z;p.phase+=step*4.8;p.moving=true;cover.stuck=0;
    const turn=Math.atan2(dx,dz)-p.yaw;p.yaw+=Math.atan2(Math.sin(turn),Math.cos(turn))*Math.min(1,dt*8);
    return true;
  }
  function weather(w,rain,dt){
    if(w.canopyStyle==null)return;
    const wet=rain>(w.canopy>.01?.13:.31)+(w.reactionBeat||0)*.14;
    w.canopy=Math.max(0,Math.min(1,(w.canopy||0)+(wet&&!w.startle&&!w.onTour?2.1:-2.8)*dt));
  }
  window.BayRainWalk={Walk,trips,racks,blocks:racks.map(block),nearRack,weather,porchStep,key,read};
})();
