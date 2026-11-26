/* The bundles on Meli's cart, and the two subscribers on Ocean Drive. */
(() => {
  "use strict";
  const stops=[
    {id:1,x:135.2,z:26,name:"Palm Diner · Sidewalk rack",who:"Teo · Palm Diner",color:"#a55647",style:3,response:"That one's staying by the coffee pot. People read the sports page standing up."},
    {id:2,x:135.2,z:-46,name:"Marlin Motel · Lobby rack",who:"Alba · Marlin desk",color:"#477f78",style:4,response:"Two for the lobby. I'll keep one clean for Bea."}
  ];
  const integer=(n,max)=>Number.isSafeInteger(n)&&n>=0?Math.min(n,max):0;
  const edition=v=>typeof v==="string"?v.slice(0,64):"";
  const front=v=>typeof v==="string"&&/^(?:aboard|ashore|city|print-[a-z0-9]+-(?:street|driver))$/.test(v)?v:"city";
  const archiveKey="sundownBay.subscriberPrints.v1";
  let sheets={};
  function photograph(p,previous){
    if(!p?.cover)return null;
    let hash=2166136261;for(let i=0;i<p.cover.length;i++)hash=Math.imul(hash^p.cover.charCodeAt(i),16777619);
    const id="print-"+(hash>>>0).toString(36)+"-"+p.crop;
    const keep=sheet(previous);sheets=keep&&previous!==id?{[previous]:keep,[id]:p}:{[id]:p};
    try{localStorage.setItem(archiveKey,JSON.stringify(sheets));}catch{}
    return id;
  }
  function sheet(id){
    if(!id?.startsWith("print-"))return null;
    let p=sheets[id];if(!p)try{p=JSON.parse(localStorage.getItem(archiveKey)||"{}")[id];}catch{}
    if(!p||typeof p.cover!=="string"||p.cover.length>96000||!p.cover.startsWith("data:image/jpeg;base64,")||!["driver","street"].includes(p.crop))return null;
    sheets[id]=p;return p;
  }
  function read(raw){
    const b={rev:integer(raw?.rev,1e9),runs:integer(raw?.runs,1e7),best:integer(raw?.best,200),last:null,run:null};
    if(b.runs&&raw?.last)b.last={score:integer(raw.last.score,200),pay:integer(raw.last.pay,145),edition:edition(raw.last.edition),front:front(raw.last.front)};
    const r=raw?.run;
    if(r&&[0,1,2].includes(r.mask))b.run={mask:r.mask,points:r.mask?integer(r.points,100):0,misses:integer(r.misses,99),edition:edition(r.edition),front:front(r.front)};
    return b;
  }
  function start(book,headline,print){if(book.run)return false;book.run={mask:0,points:0,misses:0,edition:edition(headline),front:front(print)};book.rev++;return true;}
  function pending(book){return stops.filter(s=>book.run&&!(book.run.mask&s.id));}
  function nearest(book,p){
    let target=null,distance=Infinity;
    for(const s of stops)if(book.run&&!(book.run.mask&s.id)){const d=Math.hypot(p.x-s.x,p.z-s.z);if(d<distance){distance=d;target=s;}}
    return target;
  }
  function launch(book,p,ground,walking){
    const stop=nearest(book,p);if(!stop||Math.hypot(stop.x-p.x,stop.z-p.z)>22)return null;
    const vx=walking?0:p.vx||0,vz=walking?0:p.vz||0,speed=Math.hypot(vx,vz);
    const dx=stop.x-p.x,dz=stop.z-p.z,side=Math.sign(dx)||1;
    const x=p.x+side*(walking?.25:.83),z=p.z,y=ground+1.26;
    const flight=walking?.56:.76;
    // A runner can place a copy in the rack. From the road it travels across
    // the car, keeping some of the car's velocity along the pavement.
    const endX=x+Math.sign(stop.x-x)*Math.min(Math.abs(stop.x-x),walking?2.6:14)+vx*flight*.32;
    const endZ=z+(walking?Math.max(-2.6,Math.min(2.6,dz)):vz*flight*.76);
    return {stop,x,y,z,startX:x,startY:y,startZ:z,endX,endZ,flight,speed,age:0,spin:0,rev:book.rev,walking};
  }
  function step(p,dt,height){
    p.age+=dt;const u=Math.min(1,p.age/p.flight),toss=p.walking?.52:1.24;
    p.x=p.startX+(p.endX-p.startX)*u;p.z=p.startZ+(p.endZ-p.startZ)*u;
    const gap=Math.hypot(p.endX-p.stop.x,p.endZ-p.stop.z),caught=gap<=1.42;
    p.y=p.startY*(1-u)+(height+(caught?.72:.10))*u+4*toss*u*(1-u);p.spin=u*Math.PI*(p.walking?1:3);
    return u===1?{caught,gap}:null;
  }
  function file(book,p,hit){
    const r=book.run;if(!r||book.rev!==p.rev||r.mask&p.stop.id)return null;
    book.rev++;
    if(!hit.caught){r.misses=Math.min(99,r.misses+1);return {miss:true};}
    const score=Math.max(35,Math.round(65+Math.min(22,p.speed*2.6)+13*(1-hit.gap/1.42)-Math.min(20,r.misses*4)));
    r.points+=score;r.mask|=p.stop.id;
    if(r.mask!==3)return {score};
    const receipt={edition:r.edition,front:r.front,score:r.points,pay:45+Math.round(r.points*.5)};
    book.runs++;book.best=Math.max(book.best,r.points);book.last=receipt;book.run=null;return {score,receipt};
  }
  function rack(g,s){
    const dark="#424c49",paper="#efe4c3";
    for(const x of [-.55,.55])for(const z of [-.33,.33])g.box(x,.31,z,.07,.62,.07,dark);
    g.box(0,.53,0,1.24,.10,.83,dark);
    for(const z of [-.40,.40])g.box(0,.65,z,1.28,.18,.065,s.color);
    for(const x of [-.61,.61])g.box(x,.65,0,.062,.18,.78,s.color);
    g.box(-.56,.97,0,.06,.56,.72,s.color);g.box(-.517,1.05,0,.025,.26,.62,paper);
    for(let j=0;j<3;j++)g.box(-.500,1.12-j*.06,.02,.016,.018,j===2?.30:.47,dark);
  }
  function rolled(g){
    g.box(0,0,0,.51,.13,.24,"#e8d8b8");g.box(.022,.073,.012,.36,.018,.16,"#fff1cc");
    g.box(-.092,.086,.018,.14,.012,.11,"#586c66");g.box(.062,.085,0,.034,.012,.23,"#ad5947");
  }
  function opened(g){
    for(const side of [-1,1]){
      const c=side*.158;g.box(c,0,0,.315,.013,.37,"#f2e5c7");
      g.box(c,.010,.124,.245,.006,.035,"#865443");
      for(let i=0;i<4;i++)g.box(c,.010,.064-i*.053,i===3?.16:.245,.006,.014,"#686862");
    }
  }
  function satchel(g){
    const teal="#42736a",edge="#704c38",light="#e2cba0";
    g.box(0,.12,0,.20,.30,.39,edge);g.box(-.012,.14,0,.22,.27,.37,teal);
    for(let i=0;i<3;i++)g.box(-.027+i*.021,.32+i*.020,(i-1)*.045,.045,.16,.26,light);
    g.box(.096,.235,0,.034,.12,.39,"#669182");g.box(.119,.174,-.045,.024,.09,.037,"#c79962");
    for(const z of [-.13,.13])g.pole([-.021,.3,z],[-.09,.61,z*.32],.014,edge,5);
  }
  function carry(list,model,p,level,inCar,onBike){
    if(!p)return;
    model("house-satchel",satchel);const yaw=p.yaw||0,side=inCar?.39:.32,forward=inCar?.10:onBike?-.26:0;
    list.push(["house-satchel",p.x+Math.cos(yaw)*side+Math.sin(yaw)*forward,level+(inCar?.69:onBike?.71:.69),
      p.z-Math.sin(yaw)*side+Math.cos(yaw)*forward,yaw]);
  }
  function frontPage(canvas,record,desk,ready){
    const photo=sheet(record.front);if(photo&&desk.page(canvas,photo,photo.crop,ready))return;
    const c=canvas.getContext("2d");c.save();c.scale(canvas.width/600,canvas.height/384);c.fillStyle="#ede2c5";c.fillRect(0,0,600,384);
    c.fillStyle="#29413b";c.font="bold 42px Georgia, serif";c.fillText("THE BAY WIRE",22,48);
    c.font="bold 13px monospace";c.fillText("SUBSCRIBER EDITION",435,35);c.fillStyle="#9f513f";c.fillRect(22,60,554,4);
    const aboard=record.front==="aboard",ashore=record.front==="ashore";
    c.fillStyle="#293a38";c.font="bold 34px Georgia, serif";c.fillText(aboard?"One more on the first crossing":ashore?"The six o’clock sails on time":"Before Ocean Drive wakes up",22,108);
    c.font="italic 17px Georgia, serif";c.fillText(aboard||ashore?"PORT SOL   /   First boat · Dispatch book":"OCEAN DRIVE   /   The early round",24,139);
    c.fillStyle="#b5c4af";c.fillRect(24,157,552,112);c.fillStyle="#688c84";c.fillRect(24,225,552,44);
    c.fillStyle="#e4cb96";c.beginPath();c.arc(469,191,19,0,7);c.fill();
    c.fillStyle="#485f5c";c.fillRect(95,211,262,12);c.fillRect(144,187,139,28);c.fillRect(180,178,49,11);
    c.fillStyle="#c7b38c";for(let i=0;i<7;i++)c.fillRect(151+i*18,191,11,11);
    c.fillStyle="#476e68";for(let i=0;i<5;i++)c.fillRect(65+i*58,231+(i%2)*11,42,2);
    c.fillStyle="#313f37";c.font="18px Georgia, serif";
    c.fillText(aboard?"The gate crew held for Luis. His name made the first sailing.":ashore?"Luis reached the slip as the ferry pulled away.":"The ferry crew is on the water before the coffee shops open.",24,304);
    c.fillText(aboard?"There was still a cup of coffee waiting on the other side.":ashore?"His next crossing is pencilled into the dispatch book.":"Two copies wait at the Marlin. Teo puts his by the coffee pot.",24,333);
    c.fillStyle="#95644a";c.fillRect(24,349,552,1);c.font="bold 12px monospace";c.fillText("OCEAN DRIVE   /   HOME DELIVERY",24,371);c.restore();
  }
  function reader(book,s,reaction,t){
    const delivered=!!(book.run?book.run.mask&s.id:book.last);
    const age=reaction?.id===s.id?Math.max(0,t-reaction.at):8;
    const walking=delivered&&age<.95,back=delivered&&age>1.5&&age<2.65;
    const near=!delivered?0:Math.min(1,age/.95,Math.max(0,(2.65-age)/1.15));
    return {x:s.x-2.35+near*1.48,z:s.z+.42-near*.28,yaw:back?-1.95:1.75,
      reading:delivered&&age>=1.32,pose:walking||back?1+(Math.floor(age*6)%4):0,dip:delivered&&age<1.55?Math.max(0,1-Math.abs(age-1.12)/.34)*.22:0};
  }
  function world(book,shot,list,model,see,level,personSkin,reaction,t){
    if(!book.run&&!book.last&&!shot)return;
    for(const s of stops)if(see(s,70)){
      const id="house-rack/"+s.id;model(id,g=>rack(g,s));const y=level(s.x,s.z);list.push([id,s.x,y,s.z,0]);
      if(book.run?book.run.mask&s.id:book.last){model("house-paper",rolled);for(const k of [-1,1])list.push(["house-paper",s.x+k*.23,y+.65,s.z+k*.11,k*.12]);}
      const r=reader(book,s,reaction,t),floor=level(r.x,r.z);
      list.push([personSkin(s.style,"local",r.pose,r.reading?1:0),r.x,floor-r.dip,r.z,r.yaw]);
      if(r.reading){model("house-open",opened);list.push(["house-open",r.x+.28*Math.sin(r.yaw),floor+1.16,r.z+.28*Math.cos(r.yaw),r.yaw,-.64]);}
    }
    if(shot&&see(shot,65)){model("house-paper",rolled);list.push(["house-paper",shot.x,shot.y,shot.z,.22,shot.spin]);}
  }
  function map(c,book,shot,px,py,s,visible,person,bearing,reaction,t){
    if(!book.run&&!book.last&&!shot)return;
    for(const p of stops){const x=px(p.x),y=py(p.z);if(!visible(x,y,3*s))continue;
      c.fillStyle="#4e5954";c.fillRect(x-.67*s,y-.46*s,1.34*s,.92*s);c.fillStyle=p.color;c.fillRect(x-.61*s,y-.40*s,1.22*s,.8*s);
      if(book.run?book.run.mask&p.id:book.last){c.fillStyle="#e9daba";c.fillRect(x-.43*s,y-.22*s,.86*s,.41*s);}
      else{c.strokeStyle="#f8db99";c.lineWidth=1;c.strokeRect(x-.64*s,y-.41*s,1.28*s,.82*s);}
      const r=reader(book,p,reaction,t);
      person(c,{...r,skin:p.id===1?"#a67c60":"#a7765e",shirt:p.id===1?"#88839f":"#ac705f",stride:r.pose?Math.sin(t*9):0},px(r.x),py(r.z),Math.max(2.3,s*1.42),false,bearing);
      if(r.reading){c.save();c.translate(px(r.x+.31*Math.sin(r.yaw)),py(r.z+.31*Math.cos(r.yaw)));c.rotate(r.yaw);
        c.fillStyle="#f1e4c5";c.fillRect(-.34*s,-.16*s,.68*s,.32*s);c.fillStyle="#945b49";c.fillRect(-.25*s,-.09*s,.51*s,.054*s);c.restore();}
    }
    if(shot){
      const x=px(shot.x),y=py(shot.z);if(!visible(x,y,4*s))return;
      c.fillStyle="rgba(44,49,43,.42)";c.fillRect(x-.28*s,y-.15*s,.56*s,.30*s);
      c.save();c.translate(x,y-shot.y*s*.58);c.rotate(shot.spin);c.fillStyle="#fff0cb";c.fillRect(-.32*s,-.14*s,.64*s,.28*s);
      c.fillStyle="#a25245";c.fillRect(.04*s,-.14*s,.07*s,.28*s);c.restore();
    }
  }
  window.BayHouseCopies={stops,read,start,pending,nearest,launch,step,file,reader,world,map,carry,opened,frontPage,photograph,sheet};
})();
