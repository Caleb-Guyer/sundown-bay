/* Dalia's two shore clocks time the same crossing as the public ferry. */
(() => {
  const clocks=BayMarina.docks.slice(0,2).map(d=>({
    name:d.name, line:{x:144,z:d.z,name:d.name+" · Ocean Drive stripe"},
    post:{x:150.1,z:d.z,name:d.name+" · road clock"},
    punch:{x:d.footX+1.6,z:d.z,name:d.name+" · pier time punch"}
  }));
  const key="sundownBay.wakeClock.v1";
  const distance=(p,q)=>Math.hypot(p.x-q.x,p.z-q.z);
  const time=cc=>(cc/100).toFixed(2)+" s";
  const valid=cc=>Number.isSafeInteger(cc)&&cc>0;
  function read(){
    let data;
    try{data=JSON.parse(localStorage.getItem(key));}catch{}
    const best=[0,1].map(i=>valid(data?.best?.[i])?data.best[i]:null);
    const badges=new Map();
    for(const [plate,cc] of Object.entries(data?.badges||{}))if(valid(cc))badges.set(plate,cc);
    return {best,badges};
  }
  let book=read();
  window.addEventListener?.("storage",e=>{if(e.key===key||e.key===null)book=read();});
  const unlocked=b=>b.pass&&b.trips>0;
  const near=(p,part,r)=>clocks.findIndex(c=>distance(p,c[part])<=r);
  function save(run){
    if(run.road===null||run.water===null)return;
    const latest=read(),i=run.from,plate=run.car.garageKey;
    for(const [id,cc] of book.badges)latest.badges.set(id,Math.min(cc,latest.badges.get(id)??Infinity));
    for(let j=0;j<2;j++)if(book.best[j])latest.best[j]=Math.min(book.best[j],latest.best[j]??Infinity);
    latest.best[i]=Math.min(run.road,latest.best[i]??Infinity);
    if(run.road<run.water)latest.badges.set(plate,Math.min(run.road,latest.badges.get(plate)??Infinity));
    book=latest;
    try{localStorage.setItem(key,JSON.stringify({best:book.best,badges:Object.fromEntries(book.badges)}));}catch{}
  }
  class Run{
    constructor(from,car,boat){
      this.from=from;this.to=1-from;this.car=car;this.phase="line";
      this.seenBerth=boat.phase==="berth"&&boat.at===from;
      this.elapsed=0;this.water=this.road=null;
    }
    get target(){return this.phase==="line"?clocks[this.from].line:this.phase==="road"?clocks[this.to].line:clocks[this.to].punch;}
    step(dt,boat,driver){
      if(this.phase==="line"){
        if(driver!==this.car||distance(driver,clocks[this.from].line)>12)return "scratch";
        if(boat.phase==="berth"){
          if(boat.at===this.from)this.seenBerth=true;
          // Request a crossing through the timetable, including the passenger gangway.
          boat.call(boat.at===this.from?this.to:this.from);
        }else if(this.seenBerth&&boat.departure===this.from){
          this.phase="road";this.elapsed=boat.clock;return "start";
        }
        return;
      }
      this.elapsed+=dt;
      if(this.water===null){
        if(boat.phase==="sail"&&boat.departure===this.from)this.elapsed=boat.clock;
        else if(boat.phase==="berth"&&boat.at===this.to)this.water=Math.round(100*boat.crossingTime);
      }
      if(this.phase==="road"&&driver===this.car&&Math.abs(driver.z-clocks[this.to].line.z)<13&&driver.x>=133&&driver.x<clocks[this.to].punch.x+3){
        this.phase="pier";return "park";
      }
      if(this.road!==null&&this.water!==null)return "result";
    }
    stamp(hero){
      if(this.phase!=="pier"||distance(hero,clocks[this.to].punch)>2.5)return false;
      this.road=Math.max(1,Math.round(100*this.elapsed));this.phase="punched";return true;
    }
    result(){
      const delta=this.water-this.road;
      return delta>0?"Road wins by "+time(delta):delta<0?"Luz wins by "+time(-delta):"Dead heat";
    }
  }
  function world(model,list,see,ground){
    for(const dock of clocks){
      if(see(dock.line,48)){
        model("wake-clock/stripe",g=>{
          for(let j=-5;j<=5;j++)g.box(j*.82,0,j%2?.10:-.10,.74,.012,.20,"#d2c5a5");
        });
        list.push(["wake-clock/stripe",dock.line.x,.036,dock.line.z,0]);
      }
      for(const [site,p] of [["road",dock.post],["pier",dock.punch]]){
      if(!see(p,65))continue;
      const mesh="wake-clock/"+site;
      model(mesh,g=>{
        const teal="#38685e",ink="#302e2c",cream="#f4e0b2",brass="#c49453";
        g.box(0,.78,0,.14,1.56,.16,teal);g.box(0,1.55,0,.29,.91,.85,ink);g.box(0,1.56,0,.32,.79,.73,brass);
        g.box(0,1.62,0,.34,.54,.58,cream);g.box(0,1.72,0,.36,.20,.035,ink);
        g.box(0,1.62,.078,.36,.034,.18,ink);g.box(0,1.28,0,.35,.092,.54,teal);
        if(site==="pier"){g.box(-.16,1.04,0,.51,.08,.66,teal);g.box(-.27,1.095,0,.25,.027,.35,cream);}
        else for(let j=0;j<4;j++)g.box(0,2.1,(j-1.5)*.21,.18,.14,.21,j%2?cream:ink);
      });
      list.push([mesh,p.x,ground(p.x,p.z),p.z,0]);
      }
    }
  }
  function map(c,px,py,scale,visible,street){
    for(const d of clocks){
      if(street&&visible(px(d.line.x),py(d.line.z),6*scale)){
        c.fillStyle="#d2c5a5";for(let j=-5;j<=5;j++)c.fillRect(px(d.line.x+j*.82),py(d.line.z+(j%2?.10:-.10)),.70*scale,Math.max(1,.2*scale));
      }
      for(const p of [d.post,d.punch]){
      const x=px(p.x),y=py(p.z);if(!visible(x,y,9))continue;
      const r=Math.max(2.3,Math.min(6,.65*scale));c.fillStyle="#393831";c.beginPath();c.arc(x,y,r+1,0,Math.PI*2);c.fill();
      c.fillStyle="#e8c788";c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();
      c.strokeStyle="#343f37";c.lineWidth=1;c.beginPath();c.moveTo(x,y-r*.72);c.lineTo(x,y);c.lineTo(x+r*.68,y);c.stroke();
      }
    }
  }
  window.BayWakeClock={clocks,unlocked,near,time,save,Run,world,map,badge:plate=>book.badges.get(plate),best:i=>book.best[i]};
})();
