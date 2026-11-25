/* Time the frames actually presented during an uninterrupted stretch of gameplay. */
(() => {
  const key="sundownBay.frameCheck.v1";
  class FrameCheck {
    constructor(){
      this.run=null;this.records={};
      try{const rows=JSON.parse(localStorage.getItem(key)||"{}");
        for(const id of ["Street drive","Street walk","Overhead drive","Overhead walk"]){
          const r=rows?.[id];if(r&&[r.median,r.p95,r.fps,r.metres,r.width,r.height,r.frames].every(Number.isFinite)&&r.frames>0)this.records[id]=r;
        }
      }catch{}
    }
    start(id){this.run={id,samples:[],ms:0,metres:0,last:null,x:0,z:0};}
    suspend(){if(this.run)this.run.last=null;}
    frame(now,p,width,height){
      const r=this.run;if(!r)return;
      if(r.last!==null&&now>r.last){
        const dt=now-r.last;r.samples.push(dt);r.ms+=dt;r.metres+=Math.hypot(p.x-r.x,p.z-r.z);
      }
      r.last=now;r.x=p.x;r.z=p.z;
      if(r.ms<60000)return;
      const values=r.samples.sort((a,b)=>a-b),at=q=>values[Math.ceil(values.length*q)-1];
      const result={fps:Math.round(values.length*10000/r.ms)/10,median:at(.5),p95:at(.95),
        frames:values.length,seconds:r.ms/1000,metres:Math.round(r.metres),width,height};
      this.records[r.id]=result;this.run=null;
      try{localStorage.setItem(key,JSON.stringify(this.records));}catch{}
      return result;
    }
    describe(r){return r.fps+" FPS average · "+r.median.toFixed(1)+" ms median · "+r.p95.toFixed(1)+" ms at the 95th percentile · "+
      r.metres+" m · "+r.width+" × "+r.height;}
  }
  window.BayFrameCheck=FrameCheck;
})();
