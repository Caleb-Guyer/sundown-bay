// Invoked on the hosted WebGL context, with the exact same camera, poses and
// lighting for both draws. Leave the playtest's default framebuffer untouched.
module.exports=function streetPixels(view,items,drawBatch){
  const gl=view.gl,w=320,h=Math.round(w*view.canvas.height/view.canvas.width);
  const target=gl.getParameter(gl.FRAMEBUFFER_BINDING),rb=gl.getParameter(gl.RENDERBUFFER_BINDING);
  const viewport=gl.getParameter(gl.VIEWPORT),clear=gl.getParameter(gl.COLOR_CLEAR_VALUE);
  const fbo=gl.createFramebuffer(),color=gl.createRenderbuffer(),depth=gl.createRenderbuffer();
  try{
    gl.bindFramebuffer(gl.FRAMEBUFFER,fbo);
    for(const [buffer,type,slot] of [[color,gl.RGBA4,gl.COLOR_ATTACHMENT0],[depth,gl.DEPTH_COMPONENT16,gl.DEPTH_ATTACHMENT]]){
      gl.bindRenderbuffer(gl.RENDERBUFFER,buffer);gl.renderbufferStorage(gl.RENDERBUFFER,type,w,h);
      gl.framebufferRenderbuffer(gl.FRAMEBUFFER,slot,gl.RENDERBUFFER,buffer);
    }
    if(gl.checkFramebufferStatus(gl.FRAMEBUFFER)!==gl.FRAMEBUFFER_COMPLETE)throw Error("Incomplete comparison framebuffer");
    function render(batch){
      view.bound=null;gl.viewport(0,0,w,h);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT|gl.DEPTH_BUFFER_BIT);
      if(batch)drawBatch.call(view,items);else for(const a of items)view.draw(...a);
      const p=new Uint8Array(w*h*4);gl.readPixels(0,0,w,h,gl.RGBA,gl.UNSIGNED_BYTE,p);return p;
    }
    const a=render(false),b=render(true);let painted=0,silhouette=0,recolored=0;
    for(let i=0;i<a.length;i+=4){
      if(!(a[i+3]||b[i+3]))continue;
      painted++;
      if(a[i+3]!==b[i+3])silhouette++;
      if(Math.max(Math.abs(a[i]-b[i]),Math.abs(a[i+1]-b[i+1]),Math.abs(a[i+2]-b[i+2]))>22)recolored++;
    }
    return {painted,silhouette,recolored};
  }finally{
    gl.bindFramebuffer(gl.FRAMEBUFFER,target);gl.bindRenderbuffer(gl.RENDERBUFFER,rb);
    gl.viewport(...viewport);gl.clearColor(...clear);gl.deleteFramebuffer(fbo);
    gl.deleteRenderbuffer(color);gl.deleteRenderbuffer(depth);view.bound=null;
  }
};
