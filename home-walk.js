/* Romy's way home follows the south pavement of Marquee, then the east side of Ocean. */
(() => {
  "use strict";
  const key="sundownBay.walkHome.v1";
  const route=[[12.35,64.15],[24.3,64.15],[55,64.15],[63.85,64.15],[80.3,64.15],[120.5,64.15],
    [135.8,64.15],[152.85,64.15],[152.85,8.25],[152.85,-8.35],[152.85,-27.8],[153.7,-30.6]];
  const curb=i=>({x:route[i][0],z:route[i][1]});
  const home={...curb(route.length-1),name:"Marlin laundry door"};
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function read(){
    let s;try{s=JSON.parse(localStorage.getItem(key));}catch{}
    if(!s||!["luna","port"].includes(s.route)||!Number.isSafeInteger(s.trip)||s.trip<0)return null;
    return {route:s.route,trip:s.trip,at:Number.isInteger(s.at)?Math.max(0,Math.min(route.length-1,s.at)):0,
      joined:s.joined===true,told:s.told===true,spare:s.spare===true,arrived:s.arrived==="ride"?"ride":"",
      ending:["walk","ride"].includes(s.ending)?s.ending:""};
  }
  class Walk {
    constructor(collection){
      if(!["luna","port"].includes(collection.last))return;
      const saved=read(),trip=(collection.luna||0)+(collection.port||0);
      this.book=saved&&(saved.trip>trip||saved.trip===trip&&saved.route===collection.last)?saved:
        {route:collection.last,trip,at:0,joined:false,told:false,spare:!!saved?.spare,ending:""};
      const at=this.book.ending?route.length-1:this.book.at;
      this.jules={...curb(at),y:0,yaw:at===route.length-1?-1.48:Math.PI/2,style:1,role:"local",skin:"#ba8167",shirt:"#bc694c",phase:.42,offset:0,
        path:route,index:at+1,motion:new BayPlayerMotion()};
      // The payroll and print rides use the same passenger skeleton and both camera views.
      this.film=true;this.empty=true;this.stage=this.book.ending?"done":at===route.length-1?"door":"walk";this.seat=0;
      this.method=this.book.arrived||"walk";
    }
    get aboard(){return this.stage==="ride";}
    get holding(){return ["approach","enter","exit"].includes(this.stage);}
    get accepts(){return this.book.route==="luna"||this.book.told;}
    write(){
      const b=this.book,s=read();
      if(s&&s.trip>b.trip)return;
      if(s&&s.trip===b.trip&&s.route===b.route){
        b.at=Math.max(b.at,s.at);b.told||=s.told;b.joined||=s.joined;b.ending||=s.ending;
      }
      b.spare||=!!s?.spare;
      try{localStorage.setItem(key,JSON.stringify(b));}catch{}
    }
    join(){this.book.joined=true;this.write();}
    answer(){this.book.told=true;this.write();}
    board(v,plan){
      if(this.stage!=="walk"||!this.accepts||Math.abs(v.speed)>1||gap(this.jules,v)>10)return false;
      const door=plan(v,false,this.jules,1);if(!door)return false;
      this.join();this.car=v;this.path=door.points;this.stage="approach";BayDriving.settle(v);return true;
    }
    arrive(method){
      this.method=method;this.stage="door";this.jules.yaw=-1.48;this.book.at=route.length-1;this.book.arrived=method==="ride"?"ride":"";this.write();
    }
    finish(){
      const b=this.book;b.ending=this.method||"walk";b.spare||=this.accepts;
      this.stage="done";this.write();
    }
    step(dt,e){
      const a=this.jules,b=this.book,v=this.car,m=a.motion;
      if(!b||this.stage==="done"||this.stage==="door")return;
      if(this.stage==="ride"){
        BayCarAccess.pose(v,1,1,a,m,e.ground,dt,true);
        if(e.driver!==v||Math.abs(v.speed)>1||e.heat||gap(v,home)>8.8)return;
        if((this.doorDelay=(this.doorDelay||0)-dt)>0)return;this.doorDelay=.5;
        const door=e.plan(v,false,home,1);if(!door)return;
        this.path=door.points.slice(0,-1).reverse().concat(home);this.stage="exit";BayDriving.settle(v);return;
      }
      if(this.stage==="enter"||this.stage==="exit"){
        const entering=this.stage==="enter";
        this.seat=Math.max(0,Math.min(1,this.seat+(entering?dt:-dt)/1.5));
        BayCarAccess.pose(v,1,this.seat,a,m,e.ground,dt,true);
        if(entering&&this.seat===1){this.stage="ride";return "seated";}
        if(!entering&&!this.seat){m.ride=null;m.reset();this.stage="toDoor";this.car=null;}
        return;
      }
      if(this.stage==="approach"||this.stage==="toDoor"){
        if(BayCarAccess.walkPath(a,m,this.path,dt,e.ground,2.15)){
          if(this.stage==="approach")this.stage="enter";else{this.arrive("ride");return "door";}
        }
        return;
      }
      if(b.at>=route.length-1){this.arrive("walk");return "door";}
      const distance=gap(a,e.player),crossing=a.crossing?.entered||b.at===6&&a.x>137;
      if(!crossing&&(b.at>=1&&!b.joined||e.heat||distance>(b.joined?12:38))){
        if(this.moving||distance<20)m.step(dt,0,0);this.moving=false;return;
      }
      a.index=b.at+1;
      if(!BayCrosswalk.ready(a,e.time,e.signals,e.traffic,e.driver,dt)){m.step(dt,0,0);return;}
      if(b.at===6&&!crossing&&e.traffic.some(v=>gap(a,v)<19&&Math.abs(v.x-144)<6&&Math.abs(v.speed)>.7))return;
      if(!this.path?.length)this.path=[curb(a.index)];
      this.moving=true;
      const reached=BayCarAccess.walkPath(a,m,this.path,dt,e.ground,distance>5&&!crossing?1.45:2.12);
      a.stride=Math.cos(m.phase*Math.PI*2)*m.weight;
      if(!reached)return;
      b.at++;a.crossing=null;this.write();
      if(b.at===route.length-1){this.arrive("walk");return "door";}
      if(b.joined&&b.at===4)return "corner";
    }
  }
  function keys(canvas,offered){
    canvas.width=600;canvas.height=348;const c=canvas.getContext("2d");if(!c)return;
    const rect=(x,y,w,h,ink)=>{c.fillStyle=ink;c.fillRect(x,y,w,h);};
    function shape(points,ink){c.fillStyle=ink;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();}
    function line(points,ink,w){c.strokeStyle=ink;c.lineWidth=w;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();}
    const oval=(x,y,rx,ry,ink)=>{c.fillStyle=ink;c.beginPath();c.ellipse(x,y,rx,ry,0,0,Math.PI*2);c.fill();};
    rect(0,0,600,348,"#556765");
    for(let n=0;n<8;n++){rect(0,11+n*47,600,5,"#404d49");rect(0,17+n*47,600,2,"#83908a");}
    shape([[240,0],[600,0],[600,348],[497,348]],"#3d4945");
    for(const [x,y] of [[39,33],[553,301]]){oval(x,y,6,6,"#344641");line([[x-3,y+2],[x+3,y-2]],"#93978a",2);}
    // Romy's thumb holds the ring against the counter. The spare lies outside her palm when she offers it.
    c.save();c.translate(offered?276:355,173);c.rotate(offered?-.26:-.71);
    shape([[-10,-10],[18,-20],[49,-10],[57,12],[44,37],[29,39],[24,104],[19,109],[19,123],[8,134],[2,130],[4,104],[-2,98],[5,93],[2,89],[9,80],[11,37],[-7,29]],"#293d3c");
    shape([[-13,-14],[16,-25],[47,-15],[54,8],[41,32],[26,34],[21,99],[16,104],[16,118],[5,129],[-1,125],[1,99],[-5,93],[2,88],[-1,84],[6,75],[8,32],[-10,24]],"#b3b8a8");
    shape([[-13,-14],[16,-25],[47,-15],[51,5],[34,22],[4,17]],"#56605c");
    for(let i=0;i<4;i++)line([[-2+i*7,2],[4+i*7,13]],"#7f877c",2);
    line([[17,40],[11,110]],"#e0d4aa",2);oval(14,-13,5,4,"#313b39");
    c.beginPath();c.ellipse(-8,-35,25,18,.46,0,Math.PI*2);c.strokeStyle="#383f39";c.lineWidth=6;c.stroke();c.strokeStyle="#c8ba92";c.lineWidth=2;c.stroke();
    c.save();c.translate(-50,-42);c.rotate(-.5);
    const tag=[[-55,0],[-39,-18],[26,-18],[46,-5],[46,6],[26,19],[-38,19]];
    shape(tag,"#314b50");c.scale(.95,.85);shape(tag,"#67949a");oval(37,0,3.8,4,"#393d37");
    c.fillStyle="#f1ddab";c.textAlign="center";c.font="bold 13px Georgia";c.fillText("MARLIN",-6,0);c.font="7px monospace";c.fillText("MOTOR POOL",-5,11);c.restore();c.restore();
    shape([[600,22],[473,35],[414,70],[365,91],[332,115],[315,142],[323,156],[338,152],[367,121],[388,116],[359,142],[354,159],[365,168],[382,159],[405,139],[420,137],[402,153],[397,168],[411,178],[428,165],[458,146],[488,142],[533,114],[600,104]],"#604d40");
    shape([[600,14],[469,29],[412,65],[362,87],[328,113],[313,138],[322,150],[335,145],[365,115],[390,110],[358,138],[354,152],[364,162],[378,153],[404,132],[424,128],[402,147],[398,160],[408,169],[426,157],[455,140],[486,135],[532,107],[600,97]],"#bf876a");
    line([[328,112],[342,105],[350,104]],"#dda887",3);line([[379,136],[396,119],[409,112]],"#9d6d55",2);
    shape([[478,24],[600,0],[600,104],[526,115],[509,106]],"#a4614f");line([[509,29],[532,104]],"#d99773",3);
  }
  window.BayWalkHome={Walk,home,route,key,read,keys};
})();
