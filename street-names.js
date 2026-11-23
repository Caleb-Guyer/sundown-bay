/* Driving directions and the printed atlas share the same ten street names. */
(() => {
  "use strict";
  const avenues=["Foundry Road","Palms Avenue","Luna Boulevard","Biscayne Street","Ocean Drive"];
  const streets=["Mercado Street","Gantry Street","Tideway","Marquee Street","Pier Road"];
  function grid(v){const i=Math.max(0,Math.min(4,Math.round((v+144)/72)));return {i,offset:Math.abs(v-(i*72-144))};}
  function through(p,yaw){
    if(!p||p.x< -158||p.x>156||p.z< -157||p.z>157)return "";
    const x=grid(p.x),z=grid(p.z);if(Math.min(x.offset,z.offset)>10.5)return "";
    const ns=x.offset<z.offset;
    if(x.offset<8.4&&z.offset<8.4)return Math.abs(Math.cos(yaw??0))>=Math.abs(Math.sin(yaw??0))?avenues[x.i]:streets[z.i];
    return ns?avenues[x.i]:streets[z.i];
  }
  function segment(a,b){
    return Math.abs(b.x-a.x)>Math.abs(b.z-a.z)?streets[grid((a.z+b.z)*.5).i]:avenues[grid((a.x+b.x)*.5).i];
  }
  function atlas(ctx,px,py,scale){
    const print=(text,x,z,vertical)=>{
      ctx.save();ctx.translate(px(x),py(z));if(vertical)ctx.rotate(-Math.PI/2);
      ctx.strokeText(text,0,0);ctx.fillText(text,0,0);ctx.restore();
    };
    ctx.save();ctx.textAlign="center";ctx.textBaseline="middle";ctx.font="600 "+Math.max(10,Math.min(13,scale*6.8))+"px sans-serif";
    ctx.strokeStyle="#26373d";ctx.fillStyle="#d2d8c9";ctx.lineWidth=2.2;ctx.lineJoin="round";
    [97,-38,-107,36,-108].forEach((z,i)=>print(avenues[i],i*72-144,z,true));
    [32,-106,39,-37,102].forEach((x,i)=>print(streets[i],x,i*72-144,false));
    ctx.restore();
  }
  window.BayStreetNames={through,segment,atlas};
})();
