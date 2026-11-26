/* Driving directions and the printed atlas share the same ten street names. */
(() => {
  "use strict";
  const avenues=["Foundry Road","Palms Avenue","Luna Boulevard","Biscayne Street","Ocean Drive"];
  const streets=["Mercado Street","Gantry Street","Tideway","Marquee Street","Pier Road"];
  function grid(v){const i=Math.max(0,Math.min(4,Math.round((v+144)/72)));return {i,offset:Math.abs(v-(i*72-144))};}
  function through(p,yaw){
    if(p&&p.z>155&&p.x>68){const n=BayCut.nearest(p.x,p.z);if(n.d<n.route.halfWidth+2)return n.route.name;}
    if(!p||p.x< -158||p.x>156||p.z< -157||p.z>157)return "";
    const x=grid(p.x),z=grid(p.z);if(Math.min(x.offset,z.offset)>10.5)return "";
    const ns=x.offset<z.offset;
    if(x.offset<8.4&&z.offset<8.4)return Math.abs(Math.cos(yaw??0))>=Math.abs(Math.sin(yaw??0))?avenues[x.i]:streets[z.i];
    return ns?avenues[x.i]:streets[z.i];
  }
  function segment(a,b){
    if(Math.max(a.z,b.z)>165)return BayCut.nearest((a.x+b.x)*.5,(a.z+b.z)*.5).route.name;
    return Math.abs(b.x-a.x)>Math.abs(b.z-a.z)?streets[grid((a.z+b.z)*.5).i]:avenues[grid((a.x+b.x)*.5).i];
  }
  function maneuver(car,road,target){
    const [a,b,c]=road;
    if(!b)return null;
    const heading=Math.atan2(b.x-a.x,b.z-a.z),street=segment(a,b);
    const range=Math.round(Math.hypot(b.x-a.x,b.z-a.z));
    const off=Math.hypot(car.x-a.x,car.z-a.z);
    if(off>9)return {kind:"join",point:a,range:Math.round(off),street,text:"Join "+street};
    if(range>6&&Math.cos(car.yaw-heading)<-.67)
      return {kind:"back",point:a,range:0,street,text:"Turn around on "+street};
    if(c){
      const exit=Math.atan2(c.x-b.x,c.z-b.z),bend=Math.sin(exit-heading);
      if(Math.abs(bend)>.5){
        const kind=bend>0?"right":"left",next=segment(b,c);
        return {kind,point:b,exit,range,street:next,text:(bend>0?"↱ Right":"↰ Left")+" on "+next+" in "+range+" m"};
      }
    }
    const side=(target.x-b.x)*Math.cos(heading)-(target.z-b.z)*Math.sin(heading);
    const curb=Math.abs(side)>2?(side>0?"right":"left"):"";
    const text=range>32?"Continue on "+street:"Destination "+(curb?"on the "+curb:"ahead");
    return {kind:"arrive",point:b,range,street,curb,text};
  }
  // The same planned leg holds while the car travels within its carriageway.
  function alongLeg(car,road){
    const [a,b]=road;if(!b)return null;
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    if(length<3)return null;
    const x=car.x-a.x,z=car.z-a.z,at=(dx*x+dz*z)/length;
    if(at<0||at>length-2||Math.abs(dx*z-dz*x)>6.5*length)return null;
    return {x:a.x+dx*at/length,z:a.z+dz*at/length};
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
  window.BayStreetNames={through,segment,atlas,maneuver,alongLeg};
})();
