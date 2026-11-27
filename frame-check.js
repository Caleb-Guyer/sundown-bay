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
    static device(gl,agent){
      const platform=/CrOS/.test(agent)?"ChromeOS":/Android/.test(agent)?"Android":/iPhone|iPad/.test(agent)?"iOS":
        /Windows/.test(agent)?"Windows":/Mac OS/.test(agent)?"macOS":/Linux/.test(agent)?"Linux":"Browser";
      let renderer=gl?"WebGL":"Canvas 2D";
      if(gl)try{
        const info=gl.getExtension("WEBGL_debug_renderer_info");
        const driver=info&&gl.getParameter(info.UNMASKED_RENDERER_WEBGL);
        if(driver){
          const name=driver.match(/SwiftShader|llvmpipe|softpipe/i)?.[0]||driver.match(/^ANGLE \([^,]+, ([^,]+)/)?.[1]||driver;
          renderer+=" · "+name.slice(0,100);
        }
      }catch{}
      return platform+" · "+renderer;
    }
    start(id,device=""){this.run={id,device,samples:[],ms:0,metres:0,last:null,x:0,z:0};}
    suspend(){if(this.run)this.run.last=null;}
    frame(now,p,width,height){
      const r=this.run;if(!r)return;
      if(r.last!==null&&now>r.last){
        const dt=now-r.last;r.samples.push(dt);r.ms+=dt;r.metres+=Math.hypot(p.x-r.x,p.z-r.z);
      }
      r.last=now;r.x=p.x;r.z=p.z;
      if(r.ms<60000)return;
      const seconds=new Uint32Array(60);let elapsed=0;
      for(const dt of r.samples){
        elapsed+=dt;const second=Math.ceil(elapsed/1000)-1;
        if(second<60)seconds[second]++;
      }
      const values=r.samples.sort((a,b)=>a-b),at=q=>values[Math.ceil(values.length*q)-1];
      const result={fps:Math.round(values.length*10000/r.ms)/10,median:at(.5),p95:at(.95),
        worstMs:values[values.length-1],longFrames:values.filter(dt=>dt>50).length,
        slowestSecond:Math.min(...seconds),device:r.device,frames:values.length,seconds:r.ms/1000,metres:Math.round(r.metres),width,height};
      this.records[r.id]=result;this.run=null;
      try{localStorage.setItem(key,JSON.stringify(this.records));}catch{}
      return result;
    }
    describe(r){return r.fps+" FPS average · "+r.median.toFixed(1)+" ms median · "+r.p95.toFixed(1)+" ms at the 95th percentile · "+
      (Number.isFinite(r.slowestSecond)?r.slowestSecond+" frames in the slowest second · ":"")+
      (Number.isFinite(r.worstMs)?r.worstMs.toFixed(1)+" ms longest frame · "+r.longFrames+" frames over 50 ms · ":"")+
      r.metres+" m · "+r.width+" × "+r.height+(r.device?" · "+r.device:"");}
  }
  window.BayFrameCheck=FrameCheck;
})();
