const assert=require("node:assert/strict");
module.exports=async function mouseLook({js,send,waitFor,tap,mode,errors}){
  const selector=mode==="street"?"#world":"#overhead";
  const locked="document.pointerLockElement===document.querySelector('"+selector+"')";
  async function clickGame(){
    const p=await js(`(()=>{const surface=document.querySelector('${selector}');
      for(const y of [.42,.5,.6])for(const x of [.46,.36,.66]){
        const point={x:Math.round(innerWidth*x),y:Math.round(innerHeight*y)};
        if(document.elementFromPoint(point.x,point.y)===surface)return point;
      }throw Error("Play surface is covered");})()`);
    await send("Input.dispatchMouseEvent",{type:"mousePressed",...p,button:"left",buttons:1,clickCount:1});
    await send("Input.dispatchMouseEvent",{type:"mouseReleased",...p,button:"left",buttons:0,clickCount:1});
    await waitFor(locked);
  }
  assert.equal(await js("cursorRequests"),0);await clickGame();
  const orbit=await js(`(()=>{const turn=BayCamera.prototype.orbit,angles=[];
    BayCamera.prototype.orbit=function(x,y,t){const before=this.wantedYaw;turn.call(this,x,y,t);angles.push(this.wantedYaw-before);};
    try{for(let i=0;i<80;i++)document.pointerLockElement.dispatchEvent(new MouseEvent('mousemove',{
      bubbles:true,clientX:0,clientY:0,movementX:40,movementY:i%2?5:-5}));}
    finally{BayCamera.prototype.orbit=turn;}
    return angles.reduce((sum,angle)=>sum+Math.atan2(Math.sin(angle),Math.cos(angle)),0);})()`);
  assert(orbit>Math.PI*2,"Continuous turn from stationary screen coordinates");
  await tap("KeyM");await waitFor("!document.pointerLockElement&&!document.querySelector('#panel').hidden");
  await tap("Escape");await waitFor("document.querySelector('#panel').hidden");
  assert.equal(await js("cursorRequests"),1);await clickGame();await tap("Escape");
  await waitFor("document.pointerLockElement===null");assert.equal(await js("cursorRequests"),2);
  assert.equal(await js("audioStarts"),0);assert.deepEqual(errors,[]);
  console.log("PASS native click-to-capture",mode,"turned",Math.round(orbit*180/Math.PI),"degrees, map releases, resume stays free, second click captures and Escape releases");
};
