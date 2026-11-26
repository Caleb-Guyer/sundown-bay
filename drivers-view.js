/* The mirror samples the same street geometry and vehicles as the forward view. */
(() => {
  "use strict";
  const clamp=(x,a,b)=>Math.max(a,Math.min(x,b));
  class DriversView{
    constructor(){
      this.enabled=false;this.pan=0;this.tilt=-.105;this.mode="auto";
      this.mirrorImage=null;this.mirrorAt=-Infinity;this.mirrorCar=null;this.wingImages=[];this.glance=0;this.lens=0;
    }
    center(){this.pan=0;this.tilt=-.105;this.glance=0;}
    glanceToward(side,dt){
      this.glance+=(side-this.glance)*-Math.expm1(-11*dt);
      if(Math.abs(this.glance-side)<.003)this.glance=side;
    }
    seatLook(v){
      const weight=Math.abs(this.glance),wing=BayDriversSeat.wing(v,this.glance);
      return {yaw:this.pan+(wing.pan-this.pan)*weight,pitch:this.tilt+(wing.tilt-this.tilt)*weight};
    }
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
      if(this.mirrorCar!==car){
        this.mirrorImage=null;this.wingImages=[];this.mirrorAt=-Infinity;this.mirrorCar=car;
      }
      const yaw=this.seatLook(car).yaw,side=yaw<0?-1:1,m=BayDriversSeat.wing(car,side);
      const door=Math.abs(yaw-m.pan)<.54&&(Math.abs(this.glance)>.15||Math.abs(yaw)>.48);
      const lens=door?side:0;
      if(!door&&Math.abs(yaw)>.99||t-this.mirrorAt<(view.scale<.8?.24:.14))return;
      this.lens=lens;this.mirrorAt=t;
      const img=door?(this.wingImages[side<0?0:1]??=document.createElement("canvas")):(this.mirrorImage??=document.createElement("canvas"));
      const w=door?160:192,h=door?92:69;
      if(img.width!==w||img.height!==h){img.width=w;img.height=h;}
      const rear=door?BayDriving.world(car,m.x+side*.035,m.z-.064):BayDriving.world(car,0,-bayCarLayout(car.kind).halfLength+.02);
      Object.assign(rear,{y:ground+(door?m.y:BayDriversSeat.eye(car).y),yaw:car.yaw+Math.PI-lens*.234,pitch:(door?-.072:-.025)-(car.pitch||0)*.34,focal:door?1.72:2.69});
      this.sampleRear(view,img,rear,dusk,hours,eye=>draw(eye,lens),true);
    }
    sampleRear(view,img,rear,dusk,hours,draw,flipped){
      const w=Math.min(view.canvas.width,img.width),h=Math.min(view.canvas.height,img.height);
      view.begin(rear,dusk,hours,null,null,{w,h});
      draw(rear);
      const g=img.getContext("2d");g.save();
      const sky=g.createLinearGradient(0,0,0,img.height*.7);
      if(hours.night>.7){sky.addColorStop(0,"#3c455b");sky.addColorStop(1,"#987f81");}
      else if(hours.rain>.4){sky.addColorStop(0,"#83969b");sky.addColorStop(1,"#c1c0af");}
      else{sky.addColorStop(0,"#9fabb4");sky.addColorStop(1,"#e8c3a5");}
      g.fillStyle=sky;g.fillRect(0,0,img.width,img.height);
      if(flipped){g.translate(img.width,0);g.scale(-1,1);}
      g.drawImage(view.canvas,0,view.canvas.height-h,w,h,0,0,img.width,img.height);g.restore();
    }
    mirror(g,view,v,ground){
      const im=this.lens?this.wingImages[this.lens<0?0:1]:this.mirrorImage;
      if(!im)return;
      const face=this.lens?BayDriversSeat.wing(v,this.lens).glass:BayDriversSeat.mirror(v);
      const p=face.map(q=>BayDriversSeat.project(view,v,ground,q));
      if(p.some(q=>!q||q.depth<.12))return;
      const [a,b,c,d]=p;
      // Each half meets the slanted passenger glass at its actual projected corners.
      function triangle(o,x,y,second){
        const sign=second?-1:1;
        const xx=sign*(x.x-o.x)/im.width,xy=sign*(x.y-o.y)/im.width;
        const yx=sign*(y.x-o.x)/im.height,yy=sign*(y.y-o.y)/im.height;
        g.save();g.beginPath();g.moveTo(o.x,o.y);g.lineTo(x.x,x.y);g.lineTo(y.x,y.y);g.closePath();g.clip();
        g.transform(xx,xy,yx,yy,second?x.x+y.x-o.x:o.x,second?x.y+y.y-o.y:o.y);
        g.drawImage(im,0,0);g.restore();
      }
      triangle(a,b,d,false);triangle(c,d,b,true);
    }
  }
  window.BayDriversView=DriversView;
})();
