/* A pair of cast-iron projectors on the Starlite bench and a two-ink parking check. */
(() => {
  "use strict";
  const tau=2*Math.PI,deskW=616,deskH=235;
  const dark="#18282b",iron="#34484a",enamel="#506764",metal="#a3a68e",cream="#e6d6ac",orange="#ca7447";
  const serif='Georgia, "Times New Roman", serif',sans='Arial, sans-serif',mono='"Courier New", monospace';
  const rotation=new WeakMap();
  let boothPlate=null;

  function box(c,x,y,w,h,paint){c.fillStyle=paint;c.fillRect(x,y,w,h);}
  function disk(c,x,y,r,paint){c.fillStyle=paint;c.beginPath();c.arc(x,y,r,0,tau);c.fill();}
  function stroke(c,points,color,width){
    c.strokeStyle=color;c.lineWidth=width;c.beginPath();c.moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
    c.stroke();
  }
  function poly(c,points,color){
    c.fillStyle=color;c.beginPath();c.moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
    c.closePath();c.fill();
  }
  function label(c,s,x,y,font,color,align="left"){
    c.font=font;c.fillStyle=color;c.textAlign=align;c.fillText(s,x,y);
  }
  function screw(c,x,y){
    disk(c,x,y,2.6,"#1e2b2b");disk(c,x-.4,y-.5,1.9,metal);
    stroke(c,[x-1.1,y+.5,x+1,y-.9],"#4d5550",.75);
  }
  function machine(c,x,letter){
    c.save();c.translate(x,0);
    // The long fork supports the supply reel. The short fork runs to the take-up clutch.
    stroke(c,[58,67,96,108,125,131],dark,12);
    stroke(c,[59,67,97,109,125,131],"#67746c",6);
    stroke(c,[118,127,138,102,165,78],dark,11);
    stroke(c,[118,125,139,103,165,78],"#748177",5);
    poly(c,[28,112,39,102,107,102,117,111,117,167,110,174,29,174],dark);
    poly(c,[28,112,39,102,102,102,92,112],"#879189");
    poly(c,[29,113,97,113,97,166,90,170,30,170],enamel);
    poly(c,[97,113,108,103,112,109,112,160,97,166],"#41534f");
    for(let j=0;j<6;j++)stroke(c,[37,119+j*6,66,119+j*6,73,116+j*6],j%2?dark:"#263837",2.6);
    screw(c,34,164);screw(c,89,118);
    box(c,113,108,48,58,"#293839");
    poly(c,[111,111,118,101,151,101,160,107,154,115,113,115],metal);
    box(c,115,115,37,46,"#8e8e77");box(c,119,119,27,38,"#334747");
    box(c,153,114,5,44,cream);box(c,158,111,8,49,"#35423f");
    // Lens barrel, focussing ring and upper glass edge.
    box(c,165,121,18,27,"#232e2e");
    box(c,179,124,25,21,"#8a8b78");
    for(let j=0;j<5;j++)box(c,181+j*4,124,1.7,21,"#46524c");
    box(c,202,118,10,32,"#333e39");box(c,209,120,4.6,28,"#91a79b");
    box(c,213,123,2.1,22,"#c9bf94");
    box(c,36,171,120,10,"#263636");box(c,43,172,101,3,"#717b6f");
    poly(c,[54,180,73,180,70,199,48,199],"#394847");
    poly(c,[114,180,136,180,146,199,123,199],"#45504a");
    box(c,39,197,114,7,"#253332");box(c,39,196,114,2,"#889083");
    box(c,78,131,15,23,"#d5bd8d");label(c,letter,85.5,148,"bold 15px "+sans,"#2c3838","center");
    // Thread path on the mechanism plate. The two open slack loops are outside the gate.
    c.lineWidth=2.4;c.strokeStyle="#c1986e";c.beginPath();c.moveTo(79,80);
    c.quadraticCurveTo(99,90,120,107);c.quadraticCurveTo(142,130,148,108);
    c.bezierCurveTo(151,97,163,99,161,110);c.lineTo(153,127);c.lineTo(153,149);
    c.bezierCurveTo(154,163,162,169,168,157);c.quadraticCurveTo(176,137,163,122);
    c.quadraticCurveTo(158,112,171,95);c.stroke();
    for(const [u,v] of [[121,108],[148,107],[153,127],[153,149],[167,156]]){
      disk(c,u,v,3.8,dark);disk(c,u-.4,v-.5,2.2,metal);
    }
    c.restore();
  }
  function backdrop(canvas){
    if(boothPlate)return boothPlate;
    const plate=(canvas.ownerDocument||document).createElement("canvas");plate.width=deskW;plate.height=deskH;
    const c=plate.getContext("2d");if(!c)return null;
    box(c,0,0,deskW,deskH,"#1a2427");
    // A closed metal venetian shade catches the narrow light from the projector port.
    box(c,7,6,602,135,"#2d3536");
    for(let j=0;j<8;j++){
      const y=9+j*15;box(c,10,y,596,8,j>4?"#34403f":"#394242");
      stroke(c,[10,y+.5,606,y+.5],j>4?"#5b6055":"#5e6054",1);
      poly(c,[11,y+8,606,y+8,603,y+12,14,y+12],"#273235");
    }
    for(const x of [19,307,595])box(c,x,7,2,123,"#444d48");
    poly(c,[10,133,605,129,609,191,7,191],"#323936");
    for(const x of [14,191,425])stroke(c,[x,187,x+73,157],"#49504a",1);
    box(c,5,190,606,16,"#715547");box(c,5,190,606,2,"#a18466");
    box(c,5,205,606,23,"#3b3e39");box(c,5,226,606,3,"#88775f");
    stroke(c,[13,209,262,209,289,207,564,207],"#54544a",1);
    machine(c,18,"A");machine(c,302,"B");
    // A common shutter handle with short mechanical stops and a ceramic escutcheon.
    box(c,242,138,64,37,"#242f2e");box(c,245,140,57,31,"#b5a57d");
    box(c,250,144,47,21,"#565a4f");box(c,254,146,39,11,dark);
    label(c,"A",253,165,"bold 8px "+sans,cream);
    label(c,"B",290,165,"bold 8px "+sans,cream);
    screw(c,247,167);screw(c,299,143);
    for(const x of [9,607])for(const y of [6,229])screw(c,x,y);
    boothPlate=plate;return plate;
  }
  function reel(c,x,y,r,angle,bronze){
    c.save();c.translate(x,y);c.scale(1,.94);
    disk(c,2,2,r+2,dark);
    disk(c,0,0,r,bronze?"#ab9270":"#a2a598");disk(c,0,0,r-2,"#384543");
    for(let i=0;i<5;i++){
      c.strokeStyle=i%2?"#615950":"#7b7366";c.lineWidth=1.1;
      c.beginPath();c.arc(0,0,r-4-i*2.7,0,tau);c.stroke();
    }
    c.rotate(angle);const face=bronze?"#a98c66":"#929b90";
    for(let i=0;i<5;i++){
      c.save();c.rotate(i*tau/5);
      poly(c,[-4.5,-1,-6,-r*.66,-11,-r*.87,-4,-r*.96,3,-r*.65,5,0],face);
      stroke(c,[-4.6,-r*.15,-5.5,-r*.65,-10,-r*.86],bronze?"#c5ad80":"#bdc0a8",1);
      c.restore();
    }
    c.strokeStyle=face;c.lineWidth=3;c.beginPath();c.arc(0,0,r-2.1,0,tau);c.stroke();
    disk(c,0,0,r*.30,face);disk(c,0,0,3.8,dark);
    box(c,-1.5,-3,3,6,"#b6b6a1");c.restore();
  }
  function gauges(c,motor,switched,started){
    const x=568,y=165,r=27;
    box(c,x-34,y-37,68,40,dark);box(c,x-31,y-34,62,34,"#c8bd98");
    for(let i=0;i<=8;i++){
      const a=-Math.PI*.82+i*Math.PI*.65/8,s=Math.sin(a),q=Math.cos(a);
      stroke(c,[x+q*(r-3),y+s*(r-3),x+q*r,y+s*r],i===8?"#9d4830":"#4b4f43",i%2?1:1.7);
    }
    const a=-Math.PI*.82+motor*Math.PI*.65;stroke(c,[x,y,x+Math.cos(a)*(r-1),y+Math.sin(a)*(r-1)],"#9b4d36",1.9);
    disk(c,x,y,2.6,dark);label(c,"B MOTOR",x,y+15,"bold 10px "+mono,cream,"center");
    box(c,541,187,53,6,dark);box(c,544,188,47,3,started?"#d2a464":"#5d6150");
    const end=switched?293:254;stroke(c,[273,156,end,134],dark,6);
    stroke(c,[273,155,end,134],"#a7ab98",2);disk(c,end,134,5.7,orange);disk(c,end-1.5,132.5,1.7,"#f0b278");
  }
  function draw(canvas,run,t){
    if(!canvas||!run)return false;
    if(canvas.width!==deskW)canvas.width=deskW;if(canvas.height!==deskH)canvas.height=deskH;
    const c=canvas.getContext("2d");if(!c)return false;
    const age=Number.isFinite(run.age)?run.age:(Number.isFinite(t)?t:0),motor=Math.max(0,Math.min(1,Number(run.motor)||0));
    let s=rotation.get(canvas);
    if(!s||s.id!==run.id||age<s.age){s={id:run.id,age,a:run.switched?0:age*3.4,b:0,load:motor};rotation.set(canvas,s);}
    const dt=age-s.age;s.age=age;if(!run.switched)s.a+=dt*3.4;
    s.b+=dt*(s.load+motor)*1.7;s.load=motor;
    const plate=backdrop(canvas);if(!plate)return false;
    c.save();c.setTransform(1,0,0,1,0,0);c.drawImage(plate,0,0);
    for(const [x,spin,lit] of [[18,s.a,!run.switched],[302,s.b,!!run.switched]]){
      reel(c,x+58,57,31,spin*.79,x===302);reel(c,x+165,76,25,-spin*1.24+.45,x===302);
      box(c,x+119,123,25,6,lit?"#e0b267":"#5d5e4d");
      for(let i=0;i<4;i++)box(c,x+121+i*6,123,2,6,dark);
      box(c,x+126,138,16,14,lit?"#c58a51":"#4d5d55");
      stroke(c,[x+126,145,x+141,144],dark,1);
    }
    gauges(c,motor,run.switched,run.started);
    c.restore();return true;
  }
  function checkOutline(c){
    const left=4,right=572,top=5,bottom=243,fold=418;
    c.beginPath();c.moveTo(left+7,top);c.lineTo(fold-5,top);c.lineTo(fold,top+6);c.lineTo(fold+5,top);
    c.lineTo(right-6,top);c.lineTo(right,top+7);c.lineTo(right,110);
    c.arc(right,124,14,-Math.PI/2,Math.PI/2,true);
    c.lineTo(right,bottom-7);c.lineTo(right-6,bottom);c.lineTo(fold+5,bottom);c.lineTo(fold,bottom-6);
    c.lineTo(fold-5,bottom);c.lineTo(left+6,bottom);c.lineTo(left,bottom-6);c.lineTo(left,137);
    c.arc(left,124,13,Math.PI/2,-Math.PI/2,true);
    c.lineTo(left,top+7);c.closePath();
  }
  function star(c,x,y,r,paint){
    poly(c,[x,y-r,x+r*.18,y-r*.17,x+r,y,x+r*.19,y+r*.16,x,y+r,x-r*.15,y+r*.18,x-r,y,x-r*.16,y-r*.18],paint);
  }
  function fit(c,text,x,y,maxW,size,font,color,min=11){
    const s=String(text??"");let px=size;
    while(px>min){c.font=font.replace("SIZE",px);if(c.measureText(s).width<=maxW)break;px--;}
    c.textAlign="left";c.font=font.replace("SIZE",px);c.fillStyle=color;c.fillText(s,x,y,maxW);
  }
  function ticket(canvas,record){
    if(!canvas||!record)return false;
    if(canvas.width!==576)canvas.width=576;if(canvas.height!==248)canvas.height=248;
    const c=canvas.getContext("2d");if(!c)return false;
    const green="#285449",brick="#a34e36",ink="#354339",paper="#eedcb5",fold=418;
    const day=Math.max(1,Number(record.day)||1),bay=Math.max(1,Math.min(3,Number(record.bay)||1));
    const plate=String(record.plate||"").toUpperCase(),film=String(record.title||""),name=String(record.companion||"");
    c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,576,248);
    checkOutline(c);c.fillStyle=paper;c.fill();c.clip();
    box(c,fold+.5,5,154,238,"#e5cfa5");
    let seed=77;
    for(let i=0;i<550;i++){
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;const x=seed%568;
      seed=(Math.imul(seed,1664525)+1013904223)>>>0;
      box(c,4+x,5+seed%238,i%4===0?2:.9,.8,i%3===0?"#e4d0a8":"#dfcba6");
    }
    for(const y of [14,233])stroke(c,[11,y,565,y],green,1.2);
    for(let y=16;y<235;y+=8)stroke(c,[fold,y,fold-.4,y+3],"#9a896a",1);
    stroke(c,[18,21,18,105,14,110],green,1);stroke(c,[18,138,18,225],green,1);
    stroke(c,[559,21,559,98],green,1);stroke(c,[559,149,559,225],green,1);
    // Screen-printed shooting star over a low, fluted motor-theatre marquee.
    const x=32,y=43;
    for(let i=0;i<4;i++)stroke(c,[x,y+17+i*5,x+53+i*3,y+9+i*3,x+71,y+9],i<2?brick:green,i%2?1.2:2.3);
    star(c,x+68,y+4,20,brick);star(c,x+55,y-7,6,green);
    label(c,"Starlite",123,68,"italic bold 43px "+serif,green);
    label(c,"M O T O R   T H E A T R E",125,86,"bold 11px "+sans,ink);
    stroke(c,[33,98,396,98],green,2);stroke(c,[33,102,396,102],green,.9);
    label(c,"NOW SHOWING",33,122,"bold 12px "+mono,brick);
    fit(c,film,32,153,364,27,"bold SIZEpx "+serif,ink,15);
    stroke(c,[33,164,396,164],"#af9e7c",1);
    label(c,"CAR PLATE",33,183,"bold 11px "+mono,brick);
    label(c,name?"PASSENGER":"ADMISSION",222,183,"bold 11px "+mono,brick);
    fit(c,plate,33.8,209.2,175,23,"bold SIZEpx "+mono,"#fff0cb");
    fit(c,plate,33,208,175,23,"bold SIZEpx "+mono,green);
    fit(c,name||"Single seat",222,207,174,20,"italic SIZEpx "+serif,ink,14);
    label(c,"GANTRY STREET",492,39,"bold 12px "+mono,green,"center");
    stroke(c,[440,48,546,48],brick,1);label(c,"PARKING BAY",493,79,"bold 13px "+sans,ink,"center");
    label(c,String(bay).padStart(2,"0"),491,144,"bold 65px "+serif,brick,"center");
    stroke(c,[452,155,536,155],green,1);stroke(c,[455,158,533,158],green,.7);
    label(c,"DAY "+String(day).padStart(2,"0"),493,185,"bold 18px "+mono,green,"center");
    label(c,"ADMIT ONE CAR",493,212,"12px "+mono,ink,"center");
    c.restore();return true;
  }
  window.BayStarliteBooth=Object.freeze({draw,ticket});
})();
