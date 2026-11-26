/* Ada's twelve surviving frames. Distances are in city metres and the deadline uses play time. */
(() => {
  "use strict";
  const curb={x:89,z:-66.4,yaw:Math.PI,name:"Romy at the Starlite curb"};
  const deadline=75;
  const job={id:"feature-print",name:"Before the Feature",by:"Ada Soler"};
  function read(raw){
    const count=n=>Number.isSafeInteger(n)&&n>=0?n:0;
    return {first:count(raw?.first),late:count(raw?.late),best:Number.isFinite(raw?.best)&&raw.best>0?raw.best:0,
      last:["first","late"].includes(raw?.last)?raw.last:""};
  }
  class Run {
    constructor(){
      this.ride=new BayPayroll.Ride(curb);
      this.ride.film=true;this.ride.jules.shirt="#bc694c";this.ride.jules.skin="#ba8167";
      this.rounds=3;this.cool=0;this.clock=0;this.arrival=null;this.lastCall=false;
    }
    // Romy only responds when a moving patrol car is actually visible behind the passenger window.
    target(v,units,cars,people,solids,ground){
      const from=BayDriving.world(v,bayCarLayout(v.kind).track+.12,-.15);
      from.y=ground(v.x,v.z)+1.12;
      let best=null,range=37;
      for(const u of units){
        if(u.role==="roadblock"||u.footUnit||u.featureBrake>0)continue;
        const dx=u.x-from.x,dz=u.z-from.z,d=Math.hypot(dx,dz);
        if(d<2||d>=range||dx*Math.sin(v.yaw)+dz*Math.cos(v.yaw)>1)continue;
        const to={x:u.x,z:u.z,y:ground(u.x,u.z)+.93};
        if(BayCamera.safeFraction(from,to,solids)<.998)continue;
        const blocks=(p,r)=>{
          const x=p.x-from.x,z=p.z-from.z,t=(x*dx+z*dz)/(d*d);
          return t>.04&&t<.98&&Math.abs(x*dz-z*dx)<r*d;
        };
        if(cars.some(o=>o!==v&&blocks(o,2.4))||people.some(p=>!p.down&&blocks(p,.55)))continue;
        best={unit:u,from,to};range=d;
      }
      return best;
    }
    fire(v,units,cars,people,solids,ground,effects){
      if(!v||this.ride.car!==v||!this.ride.aboard||this.cool||!this.rounds)return false;
      const hit=this.target(v,units,cars,people,solids,ground);
      if(!hit)return false;
      const {unit,from,to}=hit;
      this.rounds--;this.cool=1.8;unit.featureBrake=3.4;
      this.ride.coverPose={age:0,yaw:Math.atan2(to.x-from.x,to.z-from.z)};
      effects.traces.push({x:from.x,y:from.y,z:from.z,ex:to.x,ez:to.z,yaw:Math.atan2(to.x-from.x,to.z-from.z),life:.15});
      return true;
    }
  }
  function brake(v,dt,clear){
    const speed=Math.max(0,v.speed-18*dt),step=(v.speed+speed)*.5*dt;
    const x=v.x+Math.sin(v.yaw)*step,z=v.z+Math.cos(v.yaw)*step;
    if(clear(v,x,z,v.yaw)){v.x=x;v.z=z;v.speed=speed;}else v.speed=0;
    v.brakes=1;v.featureBrake=Math.max(0,v.featureBrake-dt);
    if(!v.featureBrake){v.planIn=0;v.destination=null;}
  }
  // A scratched, fixed-camera print of the laundry gate, drawn at its native film resolution.
  function frame(canvas,index,slip=false){
    if(canvas.width!==480||canvas.height!==270){canvas.width=480;canvas.height=270;}
    const c=canvas.getContext("2d");if(!c)return;
    const rect=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    const poly=(points,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();};
    const line=(x,y,a,b,width,color)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(x,y);c.lineTo(a,b);c.stroke();};
    const f=Math.min(11,Math.max(0,index)),swing=f/11;
    rect(0,0,480,270,"#211e1b");rect(27,12,426,246,"#b99b74");
    c.save();c.beginPath();c.rect(27,12,426,246);c.clip();c.translate(0,f%5===1?1:0);
    rect(27,12,426,98,"#d4bf92");poly([[27,83],[89,61],[125,67],[169,42],[243,63],[453,47],[453,123],[27,131]],"#9e9276");
    rect(28,83,204,122,"#745f4c");poly([[27,82],[73,59],[226,68],[240,85]],"#4d4840");
    rect(45,92,85,28,"#b9a782");c.fillStyle="#493e35";c.font="bold 13px Georgia";c.fillText("MARLIN",53,105);c.font="8px monospace";c.fillText("STEAM LAUNDRY",51,115);
    for(let x=151;x<221;x+=24){rect(x,93,16,37,"#403e36");rect(x+2,95,12,14,"#b4a381");}
    poly([[27,179],[453,163],[453,258],[27,258]],"#aa9372");
    poly([[237,186],[372,180],[425,210],[292,223]],"#80725e");
    // The chained gate swings toward the lens. The key ring stays in the man's raised hand.
    const hinge=351,edge=234+swing*90,top=103-swing*8,bottom=186+swing*16;
    poly([[hinge,98],[edge,top],[edge,bottom],[hinge,180]],"#847762");
    for(let i=0;i<=10;i++){const t=i/10,x=hinge+(edge-hinge)*t;line(x,98+(top-98)*t,x,180+(bottom-180)*t,2,"#494b40");}
    line(edge,top,hinge,98,4,"#504b3c");line(edge,bottom,hinge,180,4,"#504b3c");line(edge,bottom,hinge,98,3,"#595342");
    rect(349,83,7,103,"#514a3e");const x=edge-15;
    line(x,162,x-7,195,7,"#3e4039");line(x,161,x+9,193,7,"#464639");
    poly([[x-8,133],[x+3,130],[x+10,158],[x-7,167]],"#d8c8a1");
    c.fillStyle="#645343";c.beginPath();c.arc(x-1,125,7,0,Math.PI*2);c.fill();rect(x-10,117,14,5,"#47463c");
    line(x+2,138,edge-2,132,4,"#614e3d");line(edge-2,132,edge+1,122,3,"#614e3d");
    c.strokeStyle="#d6bb7e";c.lineWidth=1.6;c.beginPath();c.arc(edge+1,124,3.4,0,Math.PI*2);c.stroke();line(edge+2,127,edge+5,134,2,"#d6bb7e");
    for(let i=0;i<22;i++){const dx=(i*83+f*17)%420,dy=(i*41+f*13)%225;rect(29+dx,14+dy,1,.8,"#c9b58d");}
    c.restore();for(const x of [8,460])for(let y=16;y<268;y+=29)rect(x,y,11,15,"#b09b73");
    c.fillStyle="#e8d6af";c.font="10px monospace";c.fillText("SOLER 16   /   "+String(183+f).padStart(4,"0"),30,268);
    if(slip){c.fillStyle="#ecdbaf";c.font="italic 13px Georgia";c.fillText("Gantry Street, before the fire",260,249);}
  }
  window.BayFeaturePrint={curb,deadline,job,read,Run,brake,frame};
})();
