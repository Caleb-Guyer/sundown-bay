/* The mirror samples the same street geometry and vehicles as the forward view. */
(() => {
  "use strict";
  const clamp=(x,a,b)=>Math.max(a,Math.min(x,b));
  class DriversView{
    constructor(){
      this.enabled=false;this.pan=0;this.tilt=-.105;this.mode="auto";
      this.mirrorImage=null;this.mirrorAt=-Infinity;this.mirrorCar=null;
    }
    center(){this.pan=0;this.tilt=-.105;}
    look(dx,dy,sense){
      this.pan=clamp(this.pan+clamp(dx,-240,240)*.0033*sense,-2.15,2.15);
      this.tilt=clamp(this.tilt-clamp(dy,-160,160)*.00265*sense,-.70,.62);
    }
    wipers(v,dt,water){
      const before=v.wiper||0,rate=this.mode==="on"?1.15:this.mode==="auto"&&water>.028?.54+water*.76:0;
      v.wiper=rate?before+dt*rate:Math.min(Math.ceil(before),before+dt*1.1);
    }
    changeWipers(){
      const modes=["auto","on","off"];this.mode=modes[(modes.indexOf(this.mode)+1)%modes.length];return this.mode;
    }
    reflect(view,car,ground,t,dusk,hours,draw){
      if(this.mirrorCar===car&&t-this.mirrorAt<(view.scale<.8?.24:.14))return;
      this.mirrorCar=car;this.mirrorAt=t;
      const img=this.mirrorImage??=document.createElement("canvas");
      if(img.width!==192){img.width=192;img.height=69;}
      const w=Math.min(view.canvas.width,img.width),h=Math.min(view.canvas.height,img.height);
      const rear=BayDriving.world(car,0,-bayCarLayout(car.kind).halfLength+.02);
      Object.assign(rear,{y:ground+BayDriversSeat.eye(car).y,yaw:car.yaw+Math.PI,pitch:-.025-car.pitch*.34,focal:2.69});
      view.begin(rear,dusk,hours,null,null,{w,h});
      draw(rear);
      const g=img.getContext("2d");g.save();
      const sky=g.createLinearGradient(0,0,0,img.height*.7);
      if(hours.night>.7){sky.addColorStop(0,"#3c455b");sky.addColorStop(1,"#987f81");}
      else if(hours.rain>.4){sky.addColorStop(0,"#83969b");sky.addColorStop(1,"#c1c0af");}
      else{sky.addColorStop(0,"#9fabb4");sky.addColorStop(1,"#e8c3a5");}
      g.fillStyle=sky;g.fillRect(0,0,img.width,img.height);
      g.translate(img.width,0);g.scale(-1,1);
      g.drawImage(view.canvas,0,view.canvas.height-h,w,h,0,0,img.width,img.height);g.restore();
    }
    mirror(g,view,v,ground){
      if(!this.mirrorImage)return;
      const p=BayDriversSeat.mirror(v).map(q=>BayDriversSeat.project(view,v,ground,q));
      if(p.some(q=>!q||q.depth<.12))return;
      const [a,b,c,d]=p,im=this.mirrorImage;
      g.save();g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.lineTo(c.x,c.y);g.lineTo(d.x,d.y);g.closePath();g.clip();
      g.transform((b.x-a.x)/im.width,(b.y-a.y)/im.width,(d.x-a.x)/im.height,(d.y-a.y)/im.height,a.x,a.y);
      g.drawImage(im,-1,-1,im.width+2,im.height+2);g.restore();
    }
  }
  window.BayDriversView=DriversView;
})();
