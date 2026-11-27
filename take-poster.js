/* The print in the north lobby case and the one you inspect share a single negative. */
(() => {
  "use strict";
  const place={x:13,z:50.95,name:"Cine Luna poster"};
  const wall={x:14.265,y:1.76,z:50.3},width=512,height=640;
  const paper="#f4dfae",red="#ab4035",ink="#153e43",sea="#558d89",dark="#203335";
  const pending=new WeakMap();
  let current=null;

  function valid(r){
    return !!r&&Number.isFinite(r.distance)&&r.distance>=1&&r.distance<=100&&
      Number.isSafeInteger(r.take)&&r.take>=1&&typeof r.image==="string"&&r.image.length<=96000&&
      /^data:image\/jpeg;base64,\/9j\/[a-zA-Z0-9+/]+={0,2}$/.test(r.image);
  }
  function polygon(c,points,color){
    c.beginPath();c.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)c.lineTo(points[i][0],points[i][1]);
    c.closePath();c.fillStyle=color;c.fill();
  }
  function disk(c,x,y,r,color){c.fillStyle=color;c.beginPath();c.arc(x,y,r,0,Math.PI*2);c.fill();}
  function lettering(c,word,x,y,space){
    for(const ch of word){c.fillText(ch,x,y);x+=c.measureText(ch).width+space;}
  }
  // The advance card has its own screen-printed key art while the crew is still shooting.
  function advanceCard(c){
    c.fillStyle="#85af9e";c.fillRect(0,0,436,327);
    disk(c,309,83,58,"#efbc73");
    for(let i=0;i<5;i++){
      c.fillStyle="#85af9e";c.fillRect(248,83+i*8,122,1.5+i*.6);
    }
    polygon(c,[[0,175],[41,165],[44,140],[54,140],[55,161],[79,158],[83,131],[111,125],[112,154],[137,149],[137,119],[164,119],[165,145],[219,142],[220,125],[240,124],[241,142],[308,134],[313,113],[329,111],[332,127],[436,114],[436,327],[0,327]],"#648f84");
    polygon(c,[[0,241],[436,153],[436,327],[0,327]],ink);
    polygon(c,[[0,276],[436,168],[436,171],[0,281]],"#d5c38c");
    polygon(c,[[251,212],[388,182],[388,190],[252,222]],"#e0ad6f");
    polygon(c,[[344,192],[348,161],[376,153],[389,161],[397,178]],red);
    polygon(c,[[354,163],[372,159],[381,163],[354,170]],ink);
    disk(c,273,226,8,dark);disk(c,369,202,8,dark);
    c.save();c.translate(188,139);c.rotate(-.18);
    polygon(c,[[-77,4],[-61,-2],[-36,-5],[-19,-22],[17,-25],[41,-9],[67,-3],[76,4],[75,14],[-77,17]],red);
    polygon(c,[[-27,-6],[-16,-17],[1,-19],[2,-7]],ink);
    polygon(c,[[7,-20],[17,-20],[34,-10],[9,-7]],ink);
    polygon(c,[[-73,4],[-37,1],[-34,3],[-72,8]],paper);
    polygon(c,[[48,-4],[65,-1],[71,3],[52,1]],paper);
    for(const x of [-48,50]){disk(c,x,14,11,dark);disk(c,x,14,5,"#bcac83");}
    c.fillStyle=paper;c.font="italic bold 12px Georgia,serif";c.fillText("27",-10,8);c.restore();
    polygon(c,[[0,273],[84,237],[83,244],[0,284]],"#d99660");
    for(const x of [15,43,67]){
      c.fillStyle="#49645c";c.fillRect(x,274-x*.4,3,18+x*.32);
    }
  }
  function compose(print,image){
    const c=print.master.getContext("2d"),r=print.record;
    c.save();c.setTransform(1,0,0,1,0,0);c.textBaseline="alphabetic";c.textAlign="left";
    c.fillStyle=ink;c.fillRect(0,0,width,height);
    c.fillStyle=paper;c.fillRect(10,10,492,620);
    c.fillStyle=red;c.fillRect(20,20,472,3);
    // A crescent over the theater's name is the same accent as the lobby's deco lamps.
    disk(c,41,40,9,ink);disk(c,45,36,8,paper);
    c.fillStyle=ink;c.font='bold 15px Georgia,serif';lettering(c,"CINE LUNA",59,46,2.2);
    c.font='bold 11px Arial,sans-serif';c.textAlign="right";c.fillText("A SUNDOWN BAY PICTURE",480,44);c.textAlign="left";
    c.fillStyle=dark;c.font="italic bold 52px Georgia,serif";c.fillText("One Good",28,90);
    c.save();c.transform(1,0,-.15,1,0,0);
    c.font="900 84px Arial,sans-serif";c.fillStyle=ink;c.fillText("TAKE",153,155);
    c.fillStyle=red;c.fillText("TAKE",150,152);c.restore();
    for(let i=0;i<3;i++)polygon(c,[[31,117+10*i],[104-12*i,117+10*i],[99-12*i,121+10*i],[31,121+10*i]],sea);
    c.fillStyle=dark;c.fillRect(21,165,470,343);
    for(let y=174;y<499;y+=22){
      c.fillStyle=paper;c.fillRect(26,y,6,10);c.fillRect(480,y,6,10);
    }
    c.save();c.translate(38,173);
    if(image){
      c.fillStyle=dark;c.fillRect(0,0,436,327);
      const f=Math.min(436/image.naturalWidth,327/image.naturalHeight);
      const w=image.naturalWidth*f,h=image.naturalHeight*f;
      c.drawImage(image,(436-w)/2,(327-h)/2,w,h);
    }else advanceCard(c);
    c.restore();
    c.fillStyle=red;c.font='bold 13px Arial,sans-serif';
    lettering(c,r?"BEST JUMP":"ON LOCATION",31,537,1.5);
    c.fillStyle=ink;c.font=r?"italic bold 53px Georgia,serif":"italic bold 43px Georgia,serif";
    c.fillText(r?r.distance.toFixed(1)+" m":"Coming soon",27,582,310);
    c.textAlign="right";c.fillStyle=red;c.font='bold 13px Arial,sans-serif';c.fillText(r?"TAKE":"STARRING",479,537);
    c.fillStyle=ink;c.font=r?'bold 36px "Courier New",monospace':'italic bold 19px Georgia,serif';
    c.fillText(r?String(r.take).padStart(2,"0"):"Romy & Jules",479,576,136);
    c.fillStyle=red;c.fillRect(22,597,468,2);c.textAlign="center";
    c.fillStyle=ink;c.font='bold 12px Arial,sans-serif';
    c.fillText(r?"ROMY VALE   •   JULES":"FILMED ON THE STREETS OF SUNDOWN BAY",256,618);
    c.restore();
    // One power-of-two upload gives the tiny physical lobby print a clean mip chain.
    print.surface.getContext("2d").drawImage(print.master,0,0,512,512);
    print.revision++;
  }
  function copy(canvas,print){
    if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height;}
    const c=canvas.getContext("2d");if(c)c.drawImage(print.master,0,0);
  }
  function stock(record){
    if(current&&current.input===record)return current;
    const print={input:record,record:valid(record)?record:null,master:document.createElement("canvas"),
      surface:document.createElement("canvas"),revision:0,waiting:new Set(),loading:false};
    print.master.width=width;print.master.height=height;print.surface.width=print.surface.height=512;
    compose(print,null);current=print;
    if(print.record){
      print.loading=true;
      const negative=new Image();
      function finish(decoded){
        print.loading=false;if(decoded)compose(print,negative);
        for(const canvas of print.waiting)if(pending.get(canvas)===print)copy(canvas,print);
        print.waiting.clear();
      }
      negative.onload=()=>finish(negative.naturalWidth>0&&negative.naturalHeight>0);
      negative.onerror=()=>finish(false);negative.src=print.record.image;
    }
    return print;
  }
  function paint(canvas,record){
    if(!canvas?.getContext?.("2d"))return false;
    const print=stock(record),r=print.record;
    canvas.setAttribute("role","img");
    canvas.setAttribute("aria-label",r?"One Good Take. Romy's best jump, "+r.distance.toFixed(1)+" metres, take "+r.take+".":"One Good Take. Advance poster starring Romy Vale and Jules at Cine Luna.");
    copy(canvas,print);pending.set(canvas,print);if(print.loading)print.waiting.add(canvas);
    return true;
  }
  function filmMesh(g){
    // Local x points to the viewer's right and texture (0,0) marks the film's top left.
    for(const [x,y,u,v] of [[-.748,-.938,0,1],[.748,-.938,1,1],[.748,.938,1,0],
      [-.748,-.938,0,1],[.748,.938,1,0],[-.748,.938,0,0]]){
      g.vertices.push(x,y,0,u,v,0);
    }
  }
  function world(view,model,record,see){
    if(!view.drawPrint||!see(wall,69)||view.basis?.camera.x>wall.x+.03)return;
    model("take-lobby-print",filmMesh);
    const print=stock(record);view.drawPrint("take-lobby-print",print.surface,print.revision,wall.x,wall.y,wall.z,Math.PI/2);
  }
  function map(ctx,opt,px,py,s,ui,visible){
    if(opt.mode!=="street"||!visible(px(wall.x),py(wall.z),5*s))return;
    const print=stock(opt.stuntRecord||null);
    ctx.save();ctx.translate(px(wall.x),py(wall.z+1.10));ctx.rotate(Math.PI/2);
    ctx.fillStyle="#6b6657";ctx.fillRect(-.12*s,-.12*s,2.44*s,1.85*s);
    ctx.fillStyle="#d6ae72";ctx.fillRect(-.07*s,-.07*s,2.34*s,1.72*s);
    ctx.drawImage(print.master,0,0,2.2*s,1.54*s);ctx.restore();
  }
  window.BayTakePoster={place,valid,paint,world,map};
})();
