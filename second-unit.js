/* Cine Luna's location crew. Each lead keeps a place in the same street scene. */
(() => {
  "use strict";
  const key="sundownBay.secondUnit.v1",filmKey="sundownBay.locationRoll.v1";
  const desk={x:9.92,z:35.2,y:.08,yaw:-Math.PI/2},phone={x:152.45,z:-42.5};
  const home={guest:{x:151,z:-27,yaw:-.18},frankie:{x:8.70,z:35.3,yaw:-1.36}};
  const names={guest:"Marlin driver",frankie:"Frankie Prado"};
  const briefs={marquee:"Cine Luna marquee",six:"Marta’s Route 6",partner:"The other driver",rain:"Under the canvas",span:"The opening span"};
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  function get(key){try{return JSON.parse(localStorage.getItem(key));}catch{return null;}}
  function put(key,value){try{localStorage.setItem(key,JSON.stringify(value));return true;}catch{return false;}}
  function place(p,id){
    if(!p||![p.x,p.z,p.yaw].every(Number.isFinite)||Math.abs(p.x)>380||p.z>420||
      p.z< -195&&!BayCityEdge.land(p.x,p.z,.3))return {...home[id],ride:""};
    return {x:p.x,z:p.z,yaw:Math.atan2(Math.sin(p.yaw),Math.cos(p.yaw)),ride:typeof p.ride==="string"?p.ride.slice(0,100):"",
      flat:p.flat===1||p.flat===-1?p.flat:0,axle:Number.isFinite(p.axle)?p.axle:0};
  }
  const record=r=>r&&typeof r.image==="string"&&r.image.length<97000&&/^data:image\/jpeg;base64,\/9j\//.test(r.image)&&Number.isSafeInteger(r.number)&&r.number>0&&
    [r.day,r.minute,r.score].every(Number.isFinite)&&r.score>=0&&r.score<=100&&typeof r.district==="string"&&typeof r.title==="string"&&typeof r.by==="string";
  function loadFilm(){
    const raw=get(filmKey),frames=Array.isArray(raw?.frames)?raw.frames.filter(record).slice(-6):[];
    const pinned=record(raw?.pinned)?raw.pinned:null;
    return {frames,pinned,number:Math.max(Number.isSafeInteger(raw?.number)?raw.number:0,pinned?.number||0,...frames.map(r=>r.number))};
  }
  class Unit {
    constructor(){
      const raw=get(key);this.met=raw?.met===true;this.solo=raw?.solo===true;this.lead=this.met&&raw.lead==="frankie"?"frankie":"guest";
      this.places={guest:place(raw?.guest,"guest"),frankie:place(raw?.frankie,"frankie")};
      this.motors={};for(const id of ["guest","frankie"]){const p=raw?.motors?.[id];if(p?.ride)this.motors[id]=place(p,id);}
      this.film=loadFilm();this.eye=null;this.transition=null;this.nextSave=0;this.lastSave="";
    }
    get other(){return this.lead==="guest"?"frankie":"guest";}
    save(){
      const s={met:this.met,solo:this.solo,lead:this.lead,motors:this.motors,...this.places},signature=JSON.stringify(s);
      if(signature===this.lastSave)return;
      // An older open tab can still be driving solo after another tab recruits Frankie.
      if(!this.met&&get(key)?.met===true)return;
      if(put(key,s))this.lastSave=signature;
    }
    remember(p,v,id=this.lead){
      const where=place({x:p.x,z:p.z,yaw:p.yaw,ride:v?.garageKey,flat:v?.flatSide,axle:v?.flatAxle},id);
      const other=id==="guest"?"frankie":"guest";this.places[id]=where;
      if(v){this.motors[id]={...where};if(this.motors[other]?.ride===where.ride)delete this.motors[other];}
    }
    expose(image,info){
      if(!image)return null;
      const disk=loadFilm();if(disk.number>this.film.number||disk.number===this.film.number&&this.filmStored!==false)this.film=disk;
      const frames=this.film.frames,r={by:names.frankie,...info,image,number:this.film.number+1};
      if(!record(r))return null;
      this.film={frames:[...frames.slice(-5),r],number:r.number,pinned:this.film.pinned};
      this.filmStored=put(filmKey,this.film);return r;
    }
    mount(number){
      const disk=loadFilm();if(disk.number>this.film.number||disk.number===this.film.number&&this.filmStored!==false)this.film=disk;
      const r=this.film.frames.find(f=>f.number===number);if(!r)return null;
      this.film.pinned=r;this.filmStored=put(filmKey,this.film);return r;
    }
  }
  // Score only what is actually inside the optical gate. Both dynamic subjects and their sizes are in world metres.
  function grade(subjects,project,frame,eye,clear){
    let best=null;
    for(const o of subjects){
      const d=Math.hypot(o.x-eye.x,o.z-eye.z);if(d>o.range||d<.75)continue;
      const q=project(o.x,o.y,o.z);if(!q)continue;
      const x=(q.x-frame.x)/frame.w,y=(q.y-frame.y)/frame.h;
      if(x<.05||x>.95||y<.07||y>.93||!clear(eye,o))continue;
      const composition=1-Math.min(1,Math.hypot((x-.5)*1.62,(y-.50)*1.45));
      const score=Math.round(46+36*composition+18*(1-Math.min(1,Math.abs(d-o.ideal)/o.range)));
      if(!best||score>best.score)best={id:o.id,title:o.title||briefs[o.id],score};
    }
    return best;
  }
  function travel(transition){
    const u=clamp(transition.age/1.65,0,1),slide=clamp((u-.18)/.62,0,1),s=slide*slide*(3-2*slide);
    const {a,b}=transition,distance=Math.hypot(a.x-b.x,a.z-b.z);
    return {x:a.x+(b.x-a.x)*s,z:a.z+(b.z-a.z)*s,high:Math.sin(Math.PI*u)**1.5*(17+Math.min(82,distance*.38)),s,u};
  }
  window.BaySecondUnit={Unit,key,filmKey,loadFilm,desk,phone,home,names,briefs,grade,travel,record};
})();
