/* Romy's way home follows Marquee to the protected south crosswalk on Ocean. */
(() => {
  "use strict";
  const key="sundownBay.walkHome.v1";
  const route=[[12.35,64.15],[24.3,64.15],[55,64.15],[63.85,64.15],[80.3,64.15],[120.5,64.15],
    [135.8,64.15],[135.8,8.25],[135.8,-8.35],[152.1,-8.35],[152.1,-27.8],[153.7,-30.6]];
  const curb=i=>({x:route[i][0],z:route[i][1]});
  const home={...curb(route.length-1),name:"Marlin laundry door"};
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  function read(){
    let s;try{s=JSON.parse(localStorage.getItem(key));}catch{}
    if(!s||!["luna","port"].includes(s.route)||!Number.isSafeInteger(s.trip)||s.trip<0)return null;
    return {route:s.route,trip:s.trip,layout:s.layout===2?2:1,at:Number.isInteger(s.at)?Math.max(0,Math.min(route.length-1,s.at)):0,
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
      const oldCorner=(at===7||at===8)&&this.book.layout===1;
      if(!oldCorner)this.book.layout=2;
      const path=oldCorner?route.map((point,i)=>i===7?[152.85,64.15]:i===8?[152.85,8.25]:point):route;
      this.jules={x:path[at][0],z:path[at][1],y:0,yaw:at===route.length-1?-1.48:Math.PI/2,style:1,role:"local",skin:"#ba8167",shirt:"#bc694c",phase:.42,offset:0,
        path,index:at+1,motion:new BayPlayerMotion()};
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
      const distance=gap(a,e.player),crossing=a.crossing?.entered;
      if(!crossing&&(b.at>=1&&!b.joined||e.heat||distance>(b.joined?12:38))){
        if(this.moving||distance<20)m.step(dt,0,0);this.moving=false;return;
      }
      a.index=b.at+1;
      if(!BayCrosswalk.ready(a,e.time,e.signals,e.traffic,e.driver,dt)){m.step(dt,0,0);return;}
      if(!this.path?.length)this.path=[{x:a.path[a.index][0],z:a.path[a.index][1]}];
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
  const reel={id:"rabbit",title:"Rabbit Ears",credit:"Marisol Vale · Super 8, kitchen test",seconds:16};
  const reelKey="sundownBay.valeReel.v1",stages=["","sleeve","screened","family","luna"];
  function reelState(){
    try{const s=localStorage.getItem(reelKey);return stages.includes(s)?s:"";}catch{return "";}
  }
  function keepReel(next){
    const old=reelState();
    if(!stages.includes(next)||stages.indexOf(old)>=3||stages.indexOf(next)<=stages.indexOf(old))return old;
    try{localStorage.setItem(reelKey,next);}catch{}
    return next;
  }
  function sleeve(canvas){
    canvas.width=600;canvas.height=348;const c=canvas.getContext("2d");if(!c)return;
    c.fillStyle="#465756";c.fillRect(0,0,600,348);
    for(let i=0;i<17;i++){c.fillStyle=i%3?"#40514f":"#4b5a54";c.fillRect(0,i*22,600,2);}
    c.save();c.translate(73,52);c.rotate(-.045);
    c.fillStyle="#263d3c";c.fillRect(9,10,453,258);c.fillStyle="#dcc49a";c.fillRect(0,0,453,256);
    c.strokeStyle="#ad9775";c.lineWidth=2;c.beginPath();c.moveTo(0,250);c.lineTo(220,89);c.lineTo(453,250);c.stroke();
    c.fillStyle="#efe2b9";c.fillRect(28,25,395,147);c.fillStyle="#904a38";c.fillRect(28,25,395,6);
    c.font="bold 15px monospace";c.fillText("STARLITE   /   CUSTOMER PRINT",47,59);
    c.fillStyle="#34494a";c.font="italic bold 32px Georgia";c.fillText("Ada, this is the rabbit.",48,111);
    c.font="italic 21px Georgia";c.fillText("Bay two. Bring the wagon.   M.",48,148);
    c.font="12px monospace";c.fillStyle="#635844";c.fillText("50 FT.   •   SUPER 8   •   SILENT",48,219);
    c.restore();
  }
  // Three cuts from one kitchen test. The close-up hides the hands until the
  // wide shot reveals whose fingers make the rabbit's second ear.
  function movie(c,t){
    const oval=(x,y,rx,ry,color,angle=0)=>{c.fillStyle=color;c.beginPath();c.ellipse(x,y,rx,ry,angle,0,Math.PI*2);c.fill();};
    const stroke=(points,w,color)=>{c.strokeStyle=color;c.lineWidth=w;c.lineCap="round";c.beginPath();
      c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.stroke();};
    const shape=(points,color)=>{c.fillStyle=color;c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fill();};
    c.save();c.fillStyle="#302d2b";c.fillRect(0,0,416,234);
    const ending=t>=12.5,wide=t>=6.5&&!ending,ear=Math.sin(Math.max(0,t-2.1)*3.2)*.22;
    c.translate(208+Math.sin(Math.floor(t*10)*1.9)*.55,117);c.scale(wide?.78:1.36,wide?.78:1.36);c.translate(-211,-102);
    c.fillStyle="#956e4e";c.fillRect(-70,-75,560,390);
    shape([[-4,-36],[398,-30],[415,213],[18,221]],"#e5c991");
    stroke([[18,221],[160,207],[269,209],[415,213]],3,"#b59b70");
    stroke([[59,-34],[67,43],[58,148],[70,216]],2,"#dac191");
    for(const x of [55,327]){stroke([[x,-42],[x-3,-20]],7,"#6a4f3c");stroke([[x+2,-41],[x,-22]],2,"#b2855d");}
    const hop=ending?Math.max(0,Math.sin((t-12.5)*5))*8:Math.sin(t*2.5)*1.3;
    c.save();c.translate(201+(ending?(t-12.5)*18:0),105-hop);c.rotate(Math.sin(t*1.7)*.025);
    const umbra="#514b45";
    shape([[-94,62],[-48,25],[-27,2],[0,3],[16,21],[-42,58],[-90,81]],umbra);
    oval(-2,6,28,20,umbra,-.28);oval(20,8,16,11,umbra,.15);oval(29,5,6,4,umbra);
    stroke([[-7,-5],[-13,-32],[-15,-48]],12,umbra);
    stroke([[5,-7],[9,-33],[20+ear*35,-46+Math.abs(ear)*20]],10,umbra);
    oval(15,1,2,2,"#dec491");
    c.restore();
    if(wide){
      // Marisol's sleeve, bent wrist and forefinger in the projector beam.
      shape([[-66,217],[35,149],[64,182],[-2,259],[-66,271]],"#3a514e");
      shape([[26,159],[48,137],[87,121],[106,100],[113,102],[105,121],[123,109],[130,113],[114,136],[90,149],[52,178]],"#b67d58");
      stroke([[54,164],[85,143],[99,137]],2,"#895c48");
      // The smaller hand reaches in from the other side to fold one ear.
      const reach=Math.min(1,(t-6.5)/2.1),lift=Math.sin(t*3.2)*2;
      c.save();c.translate((1-reach)*90,lift);
      shape([[469,237],[414,194],[319,116],[267,92],[242,77],[224,65],[222,61],[227,59],[249,71],[238,57],[240,53],[246,54],[265,69],[286,78],[324,88],[429,173],[472,186]],"#cb966f");
      shape([[432,167],[483,191],[482,257],[401,202]],"#964f45");c.restore();
    }
    c.restore();
    if(t<2.5||ending){
      c.fillStyle="#292b28";c.fillRect(0,201,416,33);c.textAlign="center";c.fillStyle="#f1dfb6";c.font="italic bold 16px Georgia";
      c.fillText(ending?"“Leave that ear. That’s how you know it’s ours.”":"Vale kitchen test  /  Romy, age six",208,223);c.textAlign="start";
    }
  }
  window.BayWalkHome={Walk,home,route,key,read,keys,reel,reelState,keepReel,sleeve,movie};
})();
