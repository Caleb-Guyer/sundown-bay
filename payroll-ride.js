/* The payroll tin travels from the motel curb to the person who receives it. */
(() => {
  "use strict";
  const pickup={x:153.7,z:-13.7,yaw:-1.46};
  const stops={
    luna:{x:9.55,z:61.65,yaw:-Math.PI/2,name:"Marisol Vale",colors:["#b58366","#bf7960","#51484a"]},
    port:{x:-129.55,z:-81.05,yaw:-Math.PI/2,name:"Vic at the scales",colors:["#85634f","#798f80","#454d55"]}
  };
  const heldStages=new Set(["approach","enter","exit","deliver","pass"]);
  const colors=["#ad7c60","#496c73","#4d5258"];
  const actor=p=>({...p,y:0,motion:new BayPlayerMotion(),shirt:(p.colors||colors)[1],skin:(p.colors||colors)[0]});
  function counterTop(route){
    const r=stops[route];return {x:r.x-.69,z:r.z,y:route==="port"?1.033:.925};
  }
  function counters(g,solids){
    for(const [route,r] of Object.entries(stops)){
      const p=counterTop(route),x=p.x,z=p.z,port=route==="port";
      if(solids)solids.push({x,z,w:.54,d:1.30,bottom:0,top:port?1.46:.93,streetProp:true});
      const leg=port?"#517077":"#775746";
      for(const a of [-.18,.18])for(const b of [-.54,.54])g.box(x+a,.47,z+b,.06,.79,.06,leg);
      g.box(x,.81,z,.54,.085,1.30,port?"#aab3a9":"#80756b");
      if(port){
        g.box(x,.9,z,.42,.096,.58,"#455e61");g.box(x,.951,z,.44,.032,.55,"#c6cfc2");
        g.box(x+.04,.98,z+.43,.12,.29,.11,leg);
        const face=x-.06,yc=1.19,zc=z+.43,radius=.22;
        for(let i=0;i<16;i++){
          const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
          g.tri([face,yc,zc],[face,yc+Math.sin(a)*radius,zc+Math.cos(a)*radius],[face,yc+Math.sin(b)*radius,zc+Math.cos(b)*radius],"#eadab4");
        }
        for(let i=0;i<9;i++){const a=.16+i*.35;
          g.box(face-.004,yc+Math.sin(a)*.18,zc+Math.cos(a)*.18,.01,.018,.015,"#415352");}
        g.pole([face-.018,yc,zc],[face-.018,yc+.14,zc-.063],.01,"#a13e32",4);
      }else{
        g.box(x,.88,z+.43,.32,.06,.39,"#334e54");
        for(let i=0;i<4;i++){g.box(x-.016+i*.009,.918+i*.007,z+.40+i*.009,.25,.012,.15,"#e2c998");}
        g.box(x,.87,z-.46,.25,.04,.16,"#ab5c50");
      }
    }
  }
  class Ride {
    constructor(start=pickup){this.pickup=start;this.jules=actor(start);this.stage="curb";this.seat=0;this.car=null;this.delay=0;this.pass=0;}
    get holding(){return heldStages.has(this.stage);}
    get aboard(){return this.stage==="ride";}
    spill(v,impact){
      if(!this.aboard||this.car!==v||this.envelopes||impact<7.5)return false;
      this.envelopes={count:0,reach:0};return true;
    }
    gather(dt,driver,holding){
      const e=this.envelopes;
      if(!e||e.count===3||!this.aboard||driver!==this.car)return;
      if(!holding||Math.abs(driver.speed)>5.4){e.reach=Math.max(0,e.reach-dt*2);return;}
      e.reach+=dt/1.05;
      if(e.reach>=1){e.reach=0;e.count++;return e.count===3?"packed":"found";}
    }
    seeClerk(route,ground){
      if(!route){this.waiting=null;return;}
      if(this.waiting?.route===route)return;
      const p=actor(stops[route]);p.route=route;p.y=ground(p.x,p.z);this.waiting=p;
    }
    cabin(dt,driver,offerPhoto){
      if(!this.aboard||driver!==this.car){this.lastX=undefined;return;}
      const distance=Number.isFinite(this.lastX)?Math.hypot(driver.x-this.lastX,driver.z-this.lastZ):0;
      this.lastX=driver.x;this.lastZ=driver.z;
      if(distance<50*dt+.04)this.travel=(this.travel||0)+distance;
      if(offerPhoto&&!this.photoOffered&&this.travel>=16){this.photoOffered=true;return "photo";}
      if(!this.call&&this.travel>=48){this.call={phase:"ring",age:0,said:""};return "ring";}
      const call=this.call;
      if(!call||call.phase==="done")return;
      call.age+=dt;
      if(call.age>=(call.phase==="reply"?5:call.phase==="ring"?16:22)){call.phase="done";return "hang";}
    }
    answer(){
      if(this.call?.phase!=="ring")return false;
      this.call.phase="ask";this.call.age=0;return true;
    }
    giveWord(route){
      if(this.call?.phase!=="ask"||!Object.hasOwn(stops,route))return false;
      this.call.said=route;this.call.phase="reply";this.call.age=0;return true;
    }
    stop(){if(this.car)this.car.passengerDoor=0;}
    step(dt,car,dest,plan,ground){
      const a=this.jules,m=a.motion,v=this.car;
      if(this.stage==="curb"||this.stage==="ride"){
        if(this.aboard)BayCarAccess.pose(v,1,1,a,m,ground,dt,true);
        else{a.y=ground(a.x,a.z);m.step(dt,0,0);}
        if(!car||Math.abs(car.speed)>1.4||this.aboard&&(!dest||car!==v))return;
        if(!this.aboard&&Math.hypot(car.x-this.pickup.x,car.z-this.pickup.z)>9)return;
        if((this.delay-=dt)>0)return;
        this.delay=.35;
        const stand=this.aboard?stops[dest]:a;
        const at=this.aboard?BayDriving.world(stand,0,1.42):stand;
        const approach=plan(car,false,at,1);
        if(!approach){this.blocked=true;return;}
        this.blocked=false;BayDriving.settle(car);
        if(this.aboard){
          this.route=dest;this.seeClerk(dest,ground);this.receiver=this.waiting;
          this.path=approach.points.slice(0,-1).reverse().concat(at);this.stage="exit";return "unloading";
        }
        this.car=car;this.path=approach.points;this.stage="approach";return "approaching";
      }
      if(this.stage==="approach"||this.stage==="deliver"){
        if(!BayCarAccess.walkPath(a,m,this.path,dt,ground,2.8))return;
        if(this.stage==="approach")this.stage="enter";
        else{this.stage="pass";this.receiver.yaw=Math.atan2(a.x-this.receiver.x,a.z-this.receiver.z);}
      }else if(this.stage==="enter"||this.stage==="exit"){
        const entering=this.stage==="enter";
        this.seat=Math.max(0,Math.min(1,this.seat+(entering?dt:-dt)/1.5));
        BayCarAccess.pose(v,1,this.seat,a,m,ground,dt,true);
        if(entering&&this.seat===1){this.stage="ride";this.delay=0;return "boarded";}
        if(!entering&&!this.seat){m.ride=null;m.reset();this.stage="deliver";}
      }else if(this.stage==="pass"){
        const r=this.receiver;
        this.pass=Math.min(1,this.pass+dt/1.05);
        const yaw=Math.atan2(r.x-a.x,r.z-a.z);
        a.yaw+=Math.atan2(Math.sin(yaw-a.yaw),Math.cos(yaw-a.yaw))*(-Math.expm1(-dt*10));
        m.handTarget={x:.16,y:1.05,z:.32,weight:1};r.motion.handTarget={x:-.12,y:1.04,z:.30,weight:1};
        m.step(dt,0,0);r.motion.step(dt,0,0);
        if(this.pass===1){this.stage="receipt";return "received";}
      }
    }
  }
  function tin(g){
    g.box(0,0,0,.31,.13,.22,"#578981");g.box(0,.072,0,.324,.027,.232,"#c39e65");
    g.box(0,.087,-.016,.25,.007,.13,"#8d4141");g.box(-.021,.092,-.016,.13,.006,.042,"#e7c88d");
    g.box(.08,-.009,.114,.053,.047,.011,"#c8ae83");
  }
  const rigs=new Map();
  function body(view,list,actor,key,palette){
    let mesh=rigs.get(key);
    if(!mesh){mesh=new BayPlayerMesh(palette,"local");rigs.set(key,mesh);view.add(key,mesh,true);}
    if(mesh.update(actor.motion))view.updateAnimated(key);
    list.push([key,actor.x,actor.y,actor.z,actor.yaw]);
    const limb=mesh.sides[1],hand=limb.forearm.map(limb.handPivot,[]);
    return {...BayDriving.world(actor,hand[0],hand[2]),y:actor.y+hand[1]-.076};
  }
  function world(view,model,list,see,run){
    const a=run.jules,r=run.receiver||run.waiting;
    if(!see(a,76)&&(!r||!see(r,76)))return;
    if(run.film&&a.motion.ride){
      const shot=run.aboard&&run.coverPose;
      a.motion.ride.coverArm=shot?{x:.52,y:1.13+.055*Math.exp(-shot.age*11),z:-.18,weight:Math.min(1,(.65-shot.age)*7)}:null;
    }
    const calling=run.aboard&&(run.call?.phase==="ask"||run.call?.phase==="reply");
    if(!run.film&&a.motion.ride)a.motion.ride.coverArm=calling?{x:.24,y:1.26,z:.09,weight:Math.min(1,run.call.phase==="ask"?run.call.age*5:1)}:null;
    const j=run.film?body(view,list,a,"print-romy",["#ba8167","#bc694c","#485460"]):body(view,list,a,"payroll-jules",colors);
    if(calling){
      model("jules-handset",g=>{
        g.box(0,0,0,.066,.141,.029,"#34413f");g.box(0,.018,.017,.048,.050,.005,"#abc68d");
        g.box(.022,.079,0,.012,.031,.015,"#535650");
      });
      list.push(["jules-handset",j.x,j.y+.045,j.z,a.yaw]);
    }
    if(r)body(view,list,r,"payroll-"+r.route,stops[r.route].colors);
    if(run.coverPose&&run.aboard){
      const yaw=run.coverPose.yaw,height=j.y+.12;
      list.push(["street-prop-1",j.x,height,j.z,yaw]);
      if(run.coverPose.age<.14)list.push(["street-flash",j.x+.23*Math.sin(yaw),height,j.z+.23*Math.cos(yaw),yaw]);
    }
    if(run.empty)return;
    const to=run.receiver?counterTop(run.route):j;
    const seat=a.motion.ride?.seat||0;
    if(seat){const lap=BayDriving.world(a,0,.22);j.x+=(lap.x-j.x)*seat;j.z+=(lap.z-j.z)*seat;
      j.y+=(a.y+a.motion.ride.seatY+.23-j.y)*seat;}
    if(run.aboard&&run.envelopes&&run.envelopes.count<3){
      model("loose-wages",g=>{g.box(0,0,0,.21,.012,.105,"#dec497");g.box(.062,.008,.018,.03,.007,.031,"#a85446");});
      for(let i=run.envelopes.count;i<3;i++){
        const n=i===run.envelopes.count?Math.max(0,(run.envelopes.reach-.45)/.55):0;
        const p=BayDriving.world(a,(i-1)*.13*(1-n),.39-n*.17);
        list.push(["loose-wages",p.x,j.y-.36+n*.46,p.z,a.yaw+.28*i]);
      }
    }
    if(run.photoOffered&&run.aboard&&!run.photoTaken){
      const p=BayDriving.world(a,-.12,.33);
      model("night-shift-print",g=>{g.box(0,0,0,.158,.006,.118,"#efe3ca");g.box(0,.0035,-.004,.142,.004,.091,"#886955");});
      list.push(["night-shift-print",p.x,j.y+.13,p.z,a.yaw,-.39]);
    }
    const t=Math.min(1,Math.max(0,(run.pass-.25)*2.5));
    const prop=run.film?"starlite-reel-can":"payroll-tin";
    model(prop,run.film?g=>{g.cyl(0,0,0,.19,.19,.105,16,"#748484");g.cyl(0,.061,0,.195,.195,.02,16,"#b2b9a6");g.box(0,.074,0,.16,.006,.055,"#e0ba77");}:tin);
    if(run.flight){
      const p=BayFeaturePrint.airborne(run.flight);list.push([prop,p.x,p.y,p.z,run.flight.age*8,run.flight.age*3]);
    }else list.push([prop,j.x+(to.x-j.x)*t,j.y+(to.y-j.y)*t,j.z+(to.z-j.z)*t,a.yaw]);
  }
  function counter(route,ground){
    const s=stops[route],r=actor(s);
    r.y=ground(r.x,r.z);r.motion.handTarget={x:.16,y:1.1,z:.28,weight:1};r.motion.step(.1,0,0);
    return {route,receiver:r,pass:1};
  }
  function clerkWorld(view,model,list,see,run){
    const r=run.receiver;if(!see(r,58))return;
    body(view,list,r,"payroll-"+run.route,stops[run.route].colors);const hand=counterTop(run.route);
    model("payroll-tin",tin);list.push(["payroll-tin",hand.x,hand.y,hand.z,r.yaw]);
  }
  function mapCounters(ctx,px,py,s,visible){
    for(const [route,r] of Object.entries(stops)){
      const p=counterTop(route);if(!visible(px(p.x),py(p.z),2*s))continue;
      const x=px(p.x),z=py(p.z);
      ctx.fillStyle=route==="port"?"#779291":"#8f7157";ctx.fillRect(x-.27*s,z-.65*s,.54*s,1.3*s);
      ctx.fillStyle=route==="port"?"#c6cabe":"#e8cc9e";ctx.fillRect(x-.18*s,z-.30*s,.36*s,.56*s);
      ctx.fillStyle=route==="port"?"#f0deaf":"#9b5a4e";ctx.fillRect(x-.16*s,z-.52*s,.32*s,.12*s);
    }
  }
  function map(ctx,run,px,py,s,visible,personSprite){
    const j=run.jules,r=run.receiver||run.waiting;
    function person(a,palette){
      if(!visible(px(a.x),py(a.z),2*s))return;
      if(a===j&&(a.motion.ride?.seat||0)>.65){
        ctx.fillStyle=palette[0];ctx.beginPath();ctx.arc(px(a.x),py(a.z),Math.max(.9,.15*s),0,Math.PI*2);ctx.fill();
      }else personSprite(ctx,a,px(a.x),py(a.z),s,false);
    }
    if(run.coverPose&&run.aboard){
      const v=run.car,p=BayDriving.world(v,bayCarLayout(v.kind).track+.14,-.15),yaw=run.coverPose.yaw;
      ctx.strokeStyle=run.coverPose.age<.14?"#ffe4a3":"#39474b";ctx.lineWidth=Math.max(1,.12*s);
      ctx.beginPath();ctx.moveTo(px(p.x),py(p.z));ctx.lineTo(px(p.x+.45*Math.sin(yaw)),py(p.z+.45*Math.cos(yaw)));ctx.stroke();
    }
    if(j)person(j,run.film?["#ba8167"]:colors);if(r)person(r,stops[run.route||r.route].colors);
    if(run.empty)return;
    const p=run.flight?BayFeaturePrint.airborne(run.flight):run.pass>.55?counterTop(run.route):BayDriving.world(j,.22,.18);
    if(run.film){ctx.fillStyle="#b2b9a6";ctx.beginPath();ctx.arc(px(p.x),py(p.z),Math.max(1,s*.19),0,Math.PI*2);ctx.fill();}
    else{ctx.fillStyle="#c39e65";ctx.fillRect(px(p.x)-s*.13,py(p.z)-s*.08,Math.max(1,s*.26),Math.max(1,s*.16));}
    if(run.photoOffered&&run.aboard&&!run.photoTaken){
      const at=BayDriving.world(j,-.12,.33);ctx.save();ctx.translate(px(at.x),py(at.z));ctx.rotate(j.yaw);
      ctx.fillStyle="#efe3ca";ctx.fillRect(-s*.09,-s*.06,s*.18,s*.12);ctx.restore();
    }
  }
  let shiftPortrait=null;
  const wageNames=["T. Ramos","N. Armas","M. Vale"];
  function footwell(canvas,e){
    const c=canvas.getContext("2d");if(!c)return;
    const block=(x,y,w,h,color)=>{c.fillStyle=color;c.fillRect(x,y,w,h);};
    const stroke=(points,color,width)=>{c.strokeStyle=color;c.lineWidth=width;c.beginPath();for(let i=0;i<points.length;i++){const [x,y]=points[i];if(i)c.lineTo(x,y);else c.moveTo(x,y);}c.stroke();};
    block(0,0,278,105,"#554b42");block(0,0,278,12,"#2d3635");
    for(let i=0;i<35;i++)stroke([[i*11-38,105],[i*11-4,12]],"#64594d",2);
    block(174,25,95,76,"#333d39");block(173,19,94,75,"#60918a");block(179,24,83,64,"#aaba9b");block(183,28,75,55,"#425954");
    block(174,9,92,8,"#c0a35f");block(198,11,42,4,"#974c43");
    const positions=[[43,71,-.24],[99,34,.13],[125,80,-.12]],target=positions[Math.min(e.count,2)];
    const reach=Math.min(1,e.reach/.45),lift=Math.max(0,(e.reach-.45)/.55);
    const mix=(a,b,t)=>a+(b-a)*t;
    for(const [i,[x,y,a]] of positions.entries()){
      const t=i<e.count?1:i===e.count?lift:0;
      c.save();c.translate(mix(x,219+i*2,t),mix(y,48+i*7,t));c.rotate(a*(1-t)+.025*t);
      block(-29,-14,60,32,"#796b53");block(-30,-16,60,32,"#ead0a0");
      stroke([[-30,-16],[0,-2],[30,-16]],"#ab865d",1.3);block(17,1,6,6,"#b66754");
      c.fillStyle="#53483a";c.font="italic 10px Georgia";c.fillText(wageNames[i],-25,10);c.restore();
    }
    if(e.count<3){
      const hx=mix(mix(232,target[0],reach),219,lift),hy=mix(mix(-9,target[1],reach),53,lift);
      c.save();c.lineCap="round";stroke([[246,-8],[hx+14,hy-9],[hx,hy]],"#865e49",10);
      stroke([[hx+14,hy-9],[hx,hy],[hx-4,hy+4]],"#c38e69",6);
      stroke([[hx+8,hy-7],[hx-2,hy-5]],"#cd9771",4);
      stroke([[246,-8],[hx+20,hy-13]],"#507178",15);c.restore();
    }
  }
  function deliveryLine(route,count){
    if(!Number.isInteger(count))return null;
    if(route==="port")return count===3?"Even put the lid back on for me. Doesn’t change the weight.":"There’s one under your seat. Keep it. I already weighed the tin.";
    return count===3?"Tino, Neve, and there’s mine. He even tucked the flap back in. Who’s got a pen?":
      count===0?"Three of us short. Wait. There’s my name under the passenger seat. Jules, lend me your torch.":
      "I’ve got "+(count===1?"one of the three":"two of the three")+". Leave the car here, Jules. I can read the names with the door light on.";
  }
  function nightShiftPhoto(canvas,reverse,signed){
    canvas.width=600;canvas.height=360;
    const c=canvas.getContext("2d");if(!c)return;
    c.fillStyle=reverse?"#daceaf":"#e9dec3";c.fillRect(0,0,600,360);
    c.fillStyle="#776951";c.font="14px monospace";
    if(reverse){
      c.fillText("MARLIN  /  NIGHT LAUNDRY",30,45);c.fillText("09  •  98",467,45);
      c.strokeStyle="#b7ac95";c.lineWidth=1;
      for(let y=104;y<=251;y+=49){c.beginPath();c.moveTo(34,y);c.lineTo(562,y);c.stroke();}
      c.save();c.translate(42,94);c.rotate(-.024);c.fillStyle="#46596a";c.font="italic 24px Georgia";
      c.fillText("For B.  One for your locker.",0,0);
      if(signed){
        c.fillText("Left to right: Tino, Marisol, Neve.",2,54);
        c.fillText("I was behind the lens, standing on",3,102);
        c.fillText("the soap box to get us all level.",3,149);
        c.font="italic 27px Georgia";c.fillText("Bea Serrano",333,205);
      }
      c.restore();return;
    }
    if(!shiftPortrait){
      // Photograph the same character meshes the player meets in the street.
      // A single exposure is kept for subsequent flips and visits to Room 14.
      const film=document.createElement("canvas");film.width=552;film.height=281;
      const g=film.getContext("2d");
      const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(x,y,w,h);};
      rect(0,0,552,281,"#9d9c81");rect(0,204,552,77,"#826f5d");
      rect(0,0,113,210,"#a28676");rect(273,10,167,197,"#626e69");
      for(let y=15;y<201;y+=8){rect(278,y,156,3,"#838577");}
      rect(0,17,244,3,"#a99d85");rect(18,40,172,46,"#c8b79a");
      g.fillStyle="#775b50";g.font="bold 17px Georgia";g.fillText("MARLIN MOTOR INN",22,62);
      g.font="10px monospace";g.fillText("HOUSE LAUNDRY   •   REAR",31,77);
      for(const x of [15,464]){
        rect(x,125,66,82,"#b4afa0");rect(x+3,129,60,13,"#847e71");
        for(const r of [22,18,13]){g.beginPath();g.arc(x+33,170,r,0,7);g.fillStyle=r===22?"#918779":r===18?"#bfb2a0":"#5b635c";g.fill();}
      }
      const faces=[];
      for(const [x,z,yaw,skin,shirt,pants,role,gesture] of [
        [-1.05,.10,.18,"#966a50","#668581","#555859","dockhand",0],
        [0,0,-.12,"#b58366","#bd7962","#53505a","local",0],
        [1.05,.03,-.22,"#865e4c","#dfcc9d","#566e72","local",1]
      ]){
        const mesh=new BayMesh();buildBayPerson(mesh,skin,shirt,pants,0,role,gesture);
        const v=mesh.vertices,sn=Math.sin(yaw),cs=Math.cos(yaw);
        const shadowX=276+x*110;g.fillStyle="#706554";g.beginPath();g.ellipse(shadowX+5,243,25,5,-.05,0,7);g.fill();
        for(let i=0;i<v.length;i+=18){
          const points=[];let depth=0;
          for(let j=i;j<i+18;j+=6){
            const u=x+v[j]*cs+v[j+2]*sn,w=z-v[j]*sn+v[j+2]*cs;
            const size=465/(4.24-w);points.push([276+u*size,117+(1.14-v[j+1])*size]);depth+=w;
          }
          const rgb=[0,1,2].map(k=>Math.min(255,Math.round(32+v[i+3+k]*[191,178,154][k])));
          faces.push({depth,points,ink:"rgb("+rgb.join(",")+")"});
        }
      }
      faces.sort((a,b)=>a.depth-b.depth);
      for(const f of faces){g.fillStyle=f.ink;g.beginPath();g.moveTo(...f.points[0]);g.lineTo(...f.points[1]);g.lineTo(...f.points[2]);g.closePath();g.fill();}
      const edge=g.createRadialGradient(268,138,75,268,138,325);edge.addColorStop(0,"rgba(91,59,40,0)");edge.addColorStop(1,"rgba(82,45,38,.27)");g.fillStyle=edge;g.fillRect(0,0,552,281);
      shiftPortrait=film;
    }
    c.drawImage(shiftPortrait,24,20);
    c.fillStyle="#624e43";c.font="italic 22px Georgia";c.fillText("Last load before breakfast",29,337);
    c.font="13px monospace";c.fillText("SEP  1998",497,335);
  }
  function readCall(raw){
    return raw&&Number.isSafeInteger(raw.seq)&&raw.seq>0&&typeof raw.said==="string"&&Object.hasOwn(stops,raw.said)&&typeof raw.to==="string"&&Object.hasOwn(stops,raw.to)?
      {seq:raw.seq,said:raw.said,to:raw.to}:null;
  }
  function lastWords({said,to}){
    if(to==="luna")return said==="luna"?"I kept the side door open with my shoe. Mum kept telling me to let it shut. I told her you'd be here.":
      "I told Mum you'd gone to the scales. Then she saw that tin under Jules's arm. You should've seen her get out of that seat.";
    return said==="luna"?"I counted twenty-one people through that side door. I told every one of them you were coming.":
      "I went up to the booth and turned the trailers back on. Thought I'd give Mum another ten minutes before I told her.";
  }
  function handsetInsert(canvas,record){
    const port=record.to==="port",place=record.said==="port"?"PORT SOL":"CINE LUNA";
    canvas.width=720;canvas.height=384;
    canvas.setAttribute("aria-label","Jules’s phone beside the "+(port?"scale ticket":"wage receipt")+". Romy heard you say "+place+".");
    const c=canvas.getContext("2d");if(!c)return;
    const rect=(x,y,w,h,ink)=>{c.fillStyle=ink;c.fillRect(x,y,w,h);};
    const type=(s,x,y,font,ink)=>{c.fillStyle=ink;c.font=font;c.fillText(s,x,y);};
    const pill=(x,y,w,h,r,ink)=>{c.beginPath();c.roundRect(x,y,w,h,r);c.fillStyle=ink;c.fill();};
    rect(0,0,720,384,port?"#555f59":"#664c3a");
    for(let i=0;i<92;i++){const y=(i*89)%383;rect((i*43)%719,y,22+i%7*14,1,port?"#626d64":"#795c46");}
    const ticket=document.createElement("canvas");BayStreetAction.paper(ticket,port?"portReceipt":"payReceipt");
    c.save();c.translate(375,192);c.rotate(.087);rect(-24,-116,338,243,"#302d28");
    c.drawImage(ticket,107,50,545,322,-30,-122,338,243);c.restore();
    c.save();c.translate(248,184);c.rotate(-.105);
    pill(-88,-156,186,348,27,"#2f302b");pill(47,-178,19,37,7,"#343d38");
    pill(-89,-163,181,345,25,"#8a8c77");pill(-85,-159,171,337,22,"#323b38");
    pill(-75,-149,150,161,18,"#58625b");pill(-57,-111,115,88,5,"#26342e");rect(-52,-106,105,78,"#a9b987");
    for(let i=0;i<4;i++)rect(-44+i*6,-91-i*3,4,i*3+3,"#44533c");
    rect(29,-97,14,6,"#44533c");rect(43,-96,2,4,"#44533c");
    type("CALL ENDED",-44,-64,"bold 14px monospace","#344633");type("Romy Vale",-44,-44,"14px monospace","#344633");
    for(let i=0;i<7;i++)rect(-18+i*6,-132,3,4,"#303a35");
    pill(-64,8,129,11,5,"#788076");pill(-48,32,29,12,6,"#718c72");pill(20,32,29,12,6,"#906b60");
    for(let i=0;i<12;i++){const x=-53+i%3*38,y=55+Math.floor(i/3)*23;
      pill(x,y,30,17,6,"#626b60");type("123456789*0#"[i],x+11,y+13,"bold 12px monospace","#e0e0c5");}
    rect(-51,154,101,10,"#a79b72");type("JULES",-19,163,"bold 9px monospace","#423d33");c.restore();
  }
  const wages=[
    {name:"Tino Ramos",shift:"Boiler room",amount:126},
    {name:"Neve Armas",shift:"Linen van",amount:148},
    {name:"Marisol Vale",shift:"Laundry",amount:186}
  ];
  function readCarbon(record){
    if(!Number.isSafeInteger(record?.sale)||record.sale<1||!Number.isInteger(record.mask)||record.mask<1||record.mask>7)return null;
    return {sale:record.sale,mask:record.mask};
  }
  function carbonPaper(canvas,sale,mask,age=Infinity){
    if(canvas.width!==640)canvas.width=640;if(canvas.height!==340)canvas.height=340;
    canvas.setAttribute("aria-label","Marlin night shift carbon "+sale+". "+wages.map((w,i)=>w.name+", $"+w.amount+", "+(mask&(1<<i)?"in envelope":"outstanding")).join(". ")+(mask===7&&age>=.86?". Stamped CASH HELD.":""));
    const c=canvas.getContext("2d");if(!c)return;
    const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    const label=(t,x,y,font,ink)=>{c.font=font;c.fillStyle=ink;c.fillText(t,x,y);};
    rect(0,0,640,340,"#4b584f");
    for(let x=7;x<640;x+=34)rect(x,0,1,340,"#536056");
    c.save();c.translate(317,171);c.rotate(-.027);
    rect(-282,-143,568,295,"#303e39");rect(-286,-149,568,295,"#ddd2ae");rect(-280,-153,565,295,"#aec9cc");
    for(let j=0;j<18;j++)rect(-271,-141+j*15,6,4,"#657e7e");
    rect(-250,-137,1,263,"#ab7979");rect(-245,-137,1,263,"#ab7979");
    label("MARLIN MOTOR INN",-227,-103,"bold 23px Georgia","#294b57");
    label("CASH ENVELOPES  /  NIGHT SHIFT",-227,-79,"14px monospace","#385866");
    label("No. "+String(sale).padStart(4,"0"),164,-103,"15px monospace","#865d56");
    let total=0;
    for(const [i,w] of wages.entries()){
      const y=-35+i*46,paid=!!(mask&(1<<i));
      rect(-228,y+10,472,1,"#72949b");
      label(w.name,-225,y,"bold 17px Georgia","#274557");
      label(w.shift,-78,y,"14px monospace","#45626b");label("$"+w.amount,43,y,"16px monospace","#2d495a");
      if(paid){total+=w.amount;c.save();c.translate(128,y);c.rotate([-.03,.018,-.055][i]);
        label("R. Vale",0,1,"italic 22px Georgia","#303f73");c.restore();}
    }
    label("IN ENVELOPES   $"+total+" / $460",-225,108,"bold 15px monospace","#385765");
    label("office copy",145,113,"italic 16px Georgia","#46656a");
    if(mask===7){
      c.save();c.translate(66,101);c.rotate(-.085);
      if(age>=.86){
        c.strokeStyle="#885052";c.lineWidth=2;c.strokeRect(-52,-16,104,30);
        label("CASH HELD",-46,5,"bold 17px monospace","#885052");
        rect(-28,-17,3,2,"#aec9cc");rect(27,13,5,2,"#aec9cc");
      }
      if(age<1.85){
        const travel=Math.max(0,Math.min(1,age<.86?(age-.16)/.7:1-(age-1.04)/.81));
        const lift=1-travel*travel*(3-2*travel);
        // The shadow closes under the stamp before its rubber face meets the paper.
        c.translate(lift*112,lift*101);c.rotate(lift*.23);
        rect(-54+lift*12,-14+lift*11,109,33,"rgba(48,60,58,.29)");
        rect(-55,-18,110,35,"#434643");rect(-55,-19,110,29,"#886747");rect(-51,-16,101,3,"#b3976b");
        c.fillStyle="#413f35";c.beginPath();c.ellipse(0,-5,18,13,0,0,Math.PI*2);c.fill();
        c.lineJoin=c.lineCap="round";
        function stroke(ink,width,points){c.beginPath();c.strokeStyle=ink;c.lineWidth=width;c.moveTo(...points[0]);
          for(const p of points.slice(1))c.lineTo(...p);c.stroke();}
        stroke("#a16d54",34,[[109,84],[61,44],[21,7]]);
        stroke("#c98c67",21,[[44,25],[17,0],[3,-8],[-6,-4]]);
        stroke("#d49b76",10,[[19,13],[7,6],[-9,3]]);
        stroke("#b1644b",43,[[119,91],[78,58]]);
      }
      c.restore();
    }
    c.restore();
  }
  window.BayPayroll={Ride,world,map,mapCounters,counters,counter,clerkWorld,stops,nightShiftPhoto,footwell,deliveryLine,readCall,lastWords,handsetInsert,wages,readCarbon,carbonPaper};
})();
