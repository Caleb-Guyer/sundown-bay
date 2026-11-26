/* The night shift's unclaimed envelope follows an ordinary cab through town. */
(() => {
  "use strict";
  const key="sundownBay.meterRunning.v1";
  const desk={x:153.65,z:-34.6,name:"Marlin laundry · night desk"};
  const table={x:154.6,z:-34.6,w:.7,d:1.2,bottom:0,top:.93,streetProp:true};
  const job={id:"meter-running",name:"Keep the Meter Running"};
  const steps=["search","offer","return","neve","desk"];
  function read(){
    try{
      const b=JSON.parse(localStorage.getItem(key));
      if(b&&steps.includes(b.stage)&&["port","luna"].includes(b.origin)&&typeof b.car==="string"&&b.car.length<64&&typeof b.plate==="string"&&b.plate.length<=8)
        return {stage:b.stage,origin:b.origin,car:b.car,plate:b.plate};
    }catch{}
    return null;
  }
  function write(b){
    const saved=read();
    if(finished(saved)||saved&&steps.indexOf(saved.stage)>steps.indexOf(b.stage))return saved;
    try{localStorage.setItem(key,JSON.stringify(b));}catch{}
    return b;
  }
  function finished(b){return b?.stage==="neve"||b?.stage==="desk";}
  function findCab(cars,p,prior){
    const available=cars.filter(v=>v.kind==="cab"&&v!==p&&!v.used&&!v.meetCar&&!v.guestId&&!v.serviceCar&&!v.onLift&&!v.recoveryOwner&&!v.roadside&&!v.pullOver&&!v.wantsCurb&&!v.impactSlide&&!v.finiteRoute&&(!v.owner||v.owner.phase==="drive"));
    const nearest=list=>list.sort((a,b)=>Math.hypot(a.x-p.x,a.z-p.z)-Math.hypot(b.x-p.x,b.z-p.z))[0];
    return available.find(v=>v.garageKey===prior)||nearest(available.filter(v=>v.path))||nearest(available);
  }
  function windowPoint(v){return BayDriving.world(v,bayCarLayout(v.kind).track+.64,-.53);}
  function target(r,b){
    if(r.deskBound)return desk;
    const p=r.hailed?windowPoint(r.cab):r.cab;
    return {x:p.x,z:p.z,name:"Neve’s cab · "+b.plate};
  }
  function furniture(g){
    const {x,z}=table;
    for(const dx of [-.25,.25])for(const dz of [-.5,.5])g.box(x+dx,.46,z+dz,.065,.78,.065,"#6f8885");
    g.box(x,.85,z,.70,.08,1.2,"#9a6554");g.box(x,.905,z,.68,.03,1.18,"#c4b89b");
    g.cyl(x+.04,1.016,z+.26,.115,.084,.16,10,"#efe0bd");g.cyl(x+.04,1.102,z+.26,.10,.115,.025,10,"#89a29c");
    g.cyl(x+.04,1.13,z+.26,.03,.035,.045,8,"#536c67");g.pole([x+.05,1.085,z+.31],[x+.15,1.21,z+.34],.011,"#a7af9b",5);
    g.cyl(x-.08,.98,z-.36,.072,.06,.12,9,"#b46c53");g.cyl(x-.08,1.044,z-.36,.059,.059,.002,9,"#483c38");
  }
  function passenger(g){
    const face="#996e53",hair="#3c3430",sleeve="#d5bd8b";
    g.cyl(0,.89,0,.184,.137,.26,8,sleeve);g.cyl(0,1.095,.025,.109,.078,.188,9,face);
    g.cyl(-.012,1.195,.018,.092,.119,.082,9,hair);g.cyl(-.071,1.225,-.075,.075,.06,.099,8,hair);
    g.box(.098,1.103,.059,.043,.054,.05,face);g.box(.096,1.149,.056,.013,.012,.019,hair);
    g.pole([.075,.964,.03],[.272,.894,.12],.063,sleeve,7);g.pole([.272,.894,.12],[.32,.963,.267],.043,face,7);
    g.box(.325,.97,.27,.073,.04,.077,face);
  }
  function world(list,model,see,r,b,ground){
    if(finished(b)&&see(table,40)){
      model("fare/docket",g=>{g.box(0,.012,0,.20,.019,.13,"#84a3a4");g.box(.016,.026,.01,.18,.008,.12,"#e7d6af");});
      list.push(["fare/docket",table.x-.08,.922,table.z+(b.stage==="desk"?.19:-.13),.12]);
    }
    if(!r?.cab||r.deskBound||!see(r.cab,43))return;
    const v=r.cab,p=BayDriving.world(v,bayCarLayout(v.kind).track-.21,-.53);
    model("fare/neve",passenger);
    list.push(["fare/neve",p.x,ground(v.x,v.z),p.z,v.yaw,v.pitch||0,v.lean||0]);
  }
  function map(c,px,py,s,visible,r,b){
    const x=px(table.x),y=py(table.z);
    if(visible(x,y,1.4*s)){
      c.fillStyle="#bfaa8c";c.fillRect(x-.35*s,y-.60*s,.7*s,1.2*s);c.fillStyle="#e8d4ae";
      c.beginPath();c.arc(x+.04*s,y-.26*s,.115*s,0,2*Math.PI);c.fill();
      if(finished(b)){c.fillStyle="#788e87";c.fillRect(x-.20*s,y+(b.stage==="desk"?-.26:.08)*s,.2*s,.13*s);}
    }
    if(!r?.cab||r.deskBound||s<5)return;
    const v=r.cab,p=BayDriving.world(v,bayCarLayout(v.kind).track-.13,-.53);
    if(!visible(px(p.x),py(p.z),s))return;
    c.fillStyle="#dfcba2";c.beginPath();c.arc(px(p.x),py(p.z),.155*s,0,2*Math.PI);c.fill();
    c.fillStyle="#644f41";c.beginPath();c.arc(px(p.x),py(p.z),.10*s,0,2*Math.PI);c.fill();
  }
  function paper(canvas,b){
    if(canvas.width!==720||canvas.height!==360){canvas.width=720;canvas.height=360;}
    const desc=b.stage==="neve"?"Signed by Neve Armas at the cab window":b.stage==="desk"?"Held for Neve at the Marlin night desk":"Neve Armas · night differential · $38.40";
    canvas.setAttribute("aria-label","Bay Cab trip sheet "+b.plate+". "+desc);
    const c=canvas.getContext?.("2d");if(!c)return;
    c.fillStyle="#213a3e";c.fillRect(0,0,720,360);
    c.save();c.translate(364,179);c.rotate(-.028);
    c.fillStyle="#122c31";c.fillRect(-282,-139,576,295);
    c.fillStyle="#73a0a0";c.fillRect(-287,-145,576,293);
    c.fillStyle="#e6ddbb";c.fillRect(-292,-150,576,292);
    for(let y=-133;y<137;y+=17){c.fillStyle="#51615a";c.beginPath();c.arc(-277,y,2.4,0,Math.PI*2);c.fill();}
    c.fillStyle="#334e50";c.font="bold 30px Georgia";c.fillText("Bay Cab Co.",-250,-101);
    c.font="14px monospace";c.fillText("DRIVER'S DUPLICATE",-250,-77);c.fillText(b.plate,143,-103);
    c.fillRect(-250,-63,499,2);c.font="13px monospace";c.fillText("PASSENGER",-246,-39);c.fillText("ENCLOSED",132,-39);
    c.font="italic 29px Georgia";c.fillStyle="#344968";c.fillText("Neve Armas",-244,-1);c.fillText("$38.40",139,-1);
    c.fillStyle="#7f8876";c.fillRect(-250,11,499,1);
    c.font="17px monospace";c.fillStyle="#374e4d";c.fillText(b.origin==="port"?"FOUND UNDER SCALE PAN  /  PORT SOL":"LEFT IN TIN LID  /  CINE LUNA",-245,42);
    c.save();c.translate(-250,81);c.rotate(-.022);c.fillStyle=b.stage==="desk"?"#8b453f":"#364d70";
    c.font="italic 23px Georgia";c.fillText(b.stage==="neve"?"Got it.  — N. Armas":b.stage==="desk"?"Night desk. I’ll sign when she collects.  — Bea":"Please keep the meter running.",5,7);c.restore();
    c.fillStyle="#67796f";c.font="11px monospace";c.fillText("MARLIN MOTOR INN  /  NIGHT LAUNDRY",-245,120);c.restore();
  }
  window.BayMeterRunning={job,desk,table,read,write,finished,findCab,windowPoint,target,paper,furniture,world,map};
})();
