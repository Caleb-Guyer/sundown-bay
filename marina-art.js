/* Salt-worn runabouts and channel marks. Boat and dock coordinates are in metres. */
(() => {
  "use strict";
  const tau=Math.PI*2;
  const ink="#253e48",steel="#9aa9a4",rail="#d5d5bd",deckWood="#b58d68",sand="#f0dfb5";
  const boats={
    needle:{length:5.80,beam:2.04,body:"#f0dfba",stripe:"#bf5b4d",shade:"#984c46",deck:"#d7af84",seat:"#aa564a",trim:"#fff1cd",name:"NEEDLE",number:"19"},
    mako:{length:6.68,beam:2.19,body:"#529e9b",stripe:"#253f55",shade:"#2d5263",deck:"#91c2ae",seat:"#385b68",trim:"#ead9a9",name:"MAKO",number:"22"},
    rival:{length:6.16,beam:2.05,body:"#e2a743",stripe:"#444351",shade:"#61505a",deck:"#e7b75e",seat:"#504956",trim:"#fff1c8",name:"SOL",number:"07"}
  };
  const marks={
    "0":["111","101","101","101","111"],"1":["010","110","010","010","111"],
    "2":["111","001","111","100","111"],"7":["111","001","010","010","010"],
    "9":["111","101","111","001","111"],A:["010","101","111","101","101"],
    D:["110","101","101","101","110"],E:["111","100","110","100","111"],
    K:["101","101","110","101","101"],L:["100","100","100","100","111"],
    M:["10001","11011","10101","10101","10001"],N:["1001","1101","1011","1001","1001"],
    O:["111","101","101","101","111"],S:["111","100","111","001","111"]
  };
  function stamp(text,unit,paint){
    const rows=Array.from(text,c=>marks[c]),width=rows.reduce((sum,r)=>sum+r[0].length+1,-1);
    let x=-width*unit*.5;
    for(const letter of rows){
      for(let j=0;j<5;j++)for(const run of letter[j].matchAll(/1+/g))
        paint(x+run.index*unit,(2.5-j)*unit,run[0].length*unit,unit);
      x+=(letter[0].length+1)*unit;
    }
  }
  function inkWord(g,text,unit,plane,color){
    stamp(text,unit,(x,y,w,h)=>g.quad(plane(x,y),plane(x+w,y),plane(x+w,y-h),plane(x,y-h),color));
  }
  const mix=(a,b,t)=>a+(b-a)*t;

  // Loft sections from the flat transom to the upturned stem. The cockpit opening
  // cuts through the deck instead of covering the driver's knees with a flat lid.
  function hull(g,b,kind){
    const half=b.length*.5,beam=b.beam*.5;
    const ribs=[[-1,.77,.62,-.25],[-.87,.91,.72,-.33],[-.61,.98,.80,-.39],
      [-.25,1,.81,-.40],[.10,1,.83,-.40],[.25,.98,.85,-.37],
      [.46,.85,.88,-.28],[.68,.60,.92,-.12],[.87,.32,.96,.18],[1,.018,.996,.63]];
    const rings=ribs.map(([station,w,h,keel])=>({z:station*half,w:w*beam,h,keel}));
    function side(r,s,tier){
      const levels=[[0,r.keel],[.71,r.keel+.22],[.90,r.h-.37],[.986,r.h-.20],[1,r.h-.11],[1,r.h]];
      const [f,y]=levels[tier];return [s*r.w*f,y,r.z];
    }
    const slopeColor=[ink,b.shade,b.body,b.stripe,b.body];
    for(let i=1;i<rings.length;i++){
      const a=rings[i-1],c=rings[i];
      for(const s of [-1,1]){
        for(let j=0;j<5;j++)g.quad(side(a,s,j),side(c,s,j),side(c,s,j+1),side(a,s,j+1),slopeColor[j],s===-1?.89:1);
        const w1=a.w-.12,w2=c.w-.12;
        // Clamp the narrow nose cap so its gunwales meet at the stem.
        g.quad(side(a,s,5),side(c,s,5),[s*Math.max(0,w2),c.h+.012,c.z],[s*Math.max(0,w1),a.h+.012,a.z],b.trim,s===-1?.96:1);
        g.quad([s*a.w,a.h-.052,a.z],[s*c.w,c.h-.052,c.z],[s*c.w,c.h-.077,c.z],[s*a.w,a.h-.077,a.z],ink);
        if(i>=3&&i<=5){
          g.quad([s*w1,a.h,a.z],[s*w2,c.h,c.z],[s*(w2-.06),.25,c.z],[s*(w1-.06),.25,a.z],b.stripe,.75);
        }else{
          g.quad([0,a.h+.034,a.z],[0,c.h+.034,c.z],[s*Math.max(0,w2),c.h+.012,c.z],[s*Math.max(0,w1),a.h+.012,a.z],b.deck,s===-1?.97:1.03);
        }
      }
    }
    const stern=rings[0],z=stern.z-.004;
    for(let j=0;j<5;j++)g.quad(side(stern,-1,j),side(stern,1,j),side(stern,1,j+1),side(stern,-1,j+1),slopeColor[j],.94);
    // The transom name is readable from a following boat.
    inkWord(g,b.name,.038,(u,v)=>[u,.475+v,z],ink);
    const bow=rings[5],aft=rings[2],floor=.245;
    g.quad([-.78,floor,aft.z],[.78,floor,aft.z],[.78,floor,bow.z],[-.78,floor,bow.z],"#697574");
    for(const r of [aft,bow]){
      const w=r.w-.12;
      g.quad([-w,.25,r.z],[w,.25,r.z],[w,r.h,r.z],[-w,r.h,r.z],r===bow?ink:b.seat);
    }
    function hoodY(worldZ,x){
      let i=1;while(i<rings.length-1&&worldZ>rings[i].z)i++;
      const a=rings[i-1],c=rings[i],f=(worldZ-a.z)/(c.z-a.z),w=mix(a.w,c.w,f);
      return mix(a.h,c.h,f)+.038-.021*Math.abs(x)/Math.max(.05,w-.12);
    }
    const hood=(x,z)=>[x,hoodY(z,x)+.005,z];
    const hatch=(x,z,w,d,color,lift)=>{
      const at=(u,v)=>[u,hoodY(v,u)+lift,v];
      g.quad(at(x-w*.5,z-d*.5),at(x+w*.5,z-d*.5),at(x+w*.5,z+d*.5),at(x-w*.5,z+d*.5),color);
    };
    const hatchZ=-half*.80;
    hatch(0,hatchZ,1.31,.66,kind==="needle"?"#855740":b.stripe,.020);
    hatch(0,hatchZ,1.26,.61,kind==="needle"?"#be8967":b.deck,.032);
    for(let j=0;j<5;j++){
      const p=hatchZ+(j-2)*.10;
      if(kind==="needle")hatch(0,p,1.22,.014,"#d9aa80",.044);
      else for(const side of [-1,1])hatch(side*.35,p,.39,.044,ink,.044);
    }
    hatch(0,hatchZ-.18,.175,.083,rail,.052);
    for(const sign of [-1,1])hatch(sign*.49,hatchZ+.31,.14,.06,rail,.057);
    const cuts=kind==="needle"?[[-.044,.044]]:kind==="mako"?[[-.46,-.35],[-.32,-.29]]:[[-.13,-.015],[.03,.145]];
    for(const [left,right] of cuts)for(let i=6;i<rings.length;i++){
      const a=rings[i-1],c=rings[i],w1=Math.max(0,a.w-.17),w2=Math.max(0,c.w-.17);
      g.quad(hood(left*w1,a.z),hood(right*w1,a.z),hood(right*w2,c.z),hood(left*w2,c.z),kind==="needle"?rail:b.stripe);
    }
    if(kind==="needle"){
      // Two bookmatched mahogany panels, with a cream pinstripe in their join.
      for(const sign of [-1,1])for(let i=6;i<rings.length-1;i++){
        const a=rings[i-1],c=rings[i];
        g.quad(hood(sign*.08*a.w,a.z),hood(sign*.73*a.w,a.z),hood(sign*.73*c.w,c.z),hood(sign*.08*c.w,c.z),"#ad7157");
        for(const f of [.28,.52]){
          const za=a.z+.007,zc=c.z-.007;
          g.quad(hood(sign*f*a.w,za),hood(sign*(f+.017)*a.w,za),hood(sign*(f+.017)*c.w,zc),hood(sign*f*c.w,zc),"#d59e76");
        }
      }
    }
    if(kind!=="needle"){
      const u0=kind==="mako"?.72:.92;
      for(const sign of [-1,1]){
        const z1=half*.41,z2=half*.52,z3=half*.76,w=.57*beam*u0;
        g.quad(hood(sign*w,z1),hood(sign*(w+.14),z1+.05),hood(sign*(w*.40),z3),hood(sign*(w*.62),z2),b.stripe);
      }
    }
    const numberZ=half*.46;
    // A little varnished race roundel inset in the foredeck.
    const oval=(cx,cz,rx,rz,color,level)=>{
      const p=(x,z)=>[x,hoodY(z,x)+level,z];
      for(let i=0;i<12;i++)g.tri(p(cx,cz),p(cx+rx*Math.cos(i*tau/12),cz+rz*Math.sin(i*tau/12)),p(cx+rx*Math.cos((i+1)*tau/12),cz+rz*Math.sin((i+1)*tau/12)),color);
    };
    oval(0,numberZ,.337,.33,b.stripe,.022);oval(0,numberZ,.299,.288,b.trim,.027);
    inkWord(g,b.number,.065,(x,y)=>[x+.14*y,hoodY(numberZ+y,x)+.034,numberZ+y],ink);
    // Bow fairlead and side-mounted navigation lights.
    g.box(0,.976,half*.87,.078,.065,.15,rail);
    for(const s of [-1,1]){
      const x=s*(rings[6].w-.12),y=rings[6].h+.046;
      g.box(x,y,rings[6].z,.12,.081,.19,ink);
      g.box(x,y+.048,rings[6].z+.009,.10,.041,.144,s<0?"#d76654":"#71bd9a");
    }
  }
  function seat(g,x,z,pad,trim){
    g.box(x,.437,z,.24,.34,.26,ink);
    g.box(x,.563,z,.435,.115,.42,pad);
    g.box(x,.587,z+.154,.437,.065,.06,trim);
    const a=z-.23,b=z-.285,low=.57,high=1.006;
    g.quad([x-.22,low,a],[x+.22,low,a],[x+.199,high,b],[x-.199,high,b],pad);
    g.quad([x-.199,high,b],[x+.199,high,b],[x+.199,high-.02,b-.055],[x-.199,high-.02,b-.055],trim);
    g.quad([x-.199,high-.02,b-.055],[x+.199,high-.02,b-.055],[x+.21,low,a-.06],[x-.21,low,a-.06],pad,.83);
    for(const side of [-1,1])
      g.quad([x+side*.22,low,a],[x+side*.199,high,b],[x+side*.199,high-.02,b-.055],[x+side*.21,low,a-.06],trim);
    g.quad([x-.2,.84,mix(a,b,.62)+.006],[x+.2,.84,mix(a,b,.62)+.006],[x+.195,.877,mix(a,b,.70)+.006],[x-.195,.877,mix(a,b,.70)+.006],trim);
  }
  function cockpit(g,b,kind){
    const w=b.beam*.5-.14;
    seat(g,-.38,-.35,b.seat,b.trim);seat(g,.38,-.35,b.seat,b.trim);
    g.box(0,.488,-1.29,w*1.72,.26,.42,b.seat);
    g.box(0,.64,-1.53,w*1.80,.35,.13,b.seat);
    g.box(0,.814,-1.53,w*1.82,.055,.14,b.trim);
    for(const x of [-.45,.45])g.box(x,.63,-1.25,.041,.017,.35,b.trim);
    g.box(0,.772,.323,w*1.82,.19,.22,kind==="needle"?"#985e49":b.stripe);
    g.box(-.37,.845,.203,.56,.136,.03,ink);
    for(const [x,r] of [[-.52,.037],[-.393,.052],[-.254,.042]]){
      g.pole([x,.848,.177],[x,.848,.193],r,rail,8);
      g.pole([x,.848,.171],[x,.848,.182],r*.72,"#42616b",8);
      g.pole([x-.012,.84,.169],[x+.014,.874,.169],.004,sand,4);
    }
    // Tilted wood-rim helm. Center is in the player's articulated steering pose.
    const hub=[-.38,1.03,-.03],radius=.152;
    const rim=t=>[hub[0]+Math.cos(t)*radius,hub[1]+Math.sin(t)*radius*.83,hub[2]+Math.sin(t)*radius*.55];
    g.pole([-.38,.801,.22],hub,.031,ink,6);
    for(let i=0;i<12;i++)g.pole(rim(i*tau/12),rim((i+1)*tau/12),.013,kind==="needle"?"#835544":ink,5);
    for(const t of [.16,2.98,4.72])g.pole(hub,rim(t),.01,rail,4);
    g.pole([-.38,1.03,-.028],[-.38,1.041,-.045],.031,steel,6);
    g.pole([-.03,.78,.20],[-.03,.90,.13],.014,ink,5);
    g.box(-.03,.903,.13,.058,.049,.052,b.trim);
    // The sides of the windscreen taper down to the coamings at the seats.
    const profile=kind==="needle"?1.15:1.25;
    const panes=[[-w+.012,.815,-.28],[-w+.028,.835,.35],[-.59,.842,.50],[0,.848,.54],[.59,.842,.50],[w-.028,.835,.35],[w-.012,.815,-.28]];
    const crest=panes.map(([x,y,z],i)=>[x*.975,i===0||i===6?.857:i===1||i===5?profile-.11:profile,z-(i===0||i===6?0:.12)]);
    for(let i=0;i<panes.length-1;i++){
      g.quad(panes[i],panes[i+1],crest[i+1],crest[i],i===0||i===5?"#547c81":i===2?"#7faaaa":"#6b949b");
      g.pole(crest[i],crest[i+1],.018,rail,4);
    }
    for(const i of [1,3,5])g.pole(panes[i],crest[i],.018,kind==="needle"?rail:ink,4);
  }
  function outboard(g,x,z,small,accent){
    const w=small?.40:.53,h=small?.41:.48;
    g.box(x,.28,z+.095,w*.67,.13,.30,ink);
    const ring=(y,width,depth,shift)=>[[-.37,-.5],[.37,-.5],[.5,-.32],[.5,.28],[.36,.5],[-.36,.5],[-.5,.28],[-.5,-.32]].map(([a,b])=>[x+a*width,y,z+shift+b*depth]);
    const bottom=ring(.23,w*.79,.42,0),mid=ring(.23+h*.74,w,.55,0),cap=ring(.23+h,w*.78,.48,.014);
    for(let i=0;i<8;i++){
      const j=(i+1)%8;g.quad(bottom[i],bottom[j],mid[j],mid[i],i<2?"#334953":"#263b49");
      g.quad(mid[i],mid[j],cap[j],cap[i],i>3?"#546570":"#3d5866");g.tri([x,.23+h,z+.014],cap[i],cap[j],"#526a74");
    }
    for(let i=0;i<3;i++)g.box(x,.43+i*.037,z-.252-i*.003,w*.51,.017,.023,i===0?accent:"#152c33");
    g.pole([x,.265,z],[x,-.24,z+.021],w*.15,ink,6);
    g.box(x,-.149,z+.02,w*.57,.035,.22,steel);
  }
  function boat(g,kind){
    const b=boats[kind];hull(g,b,kind);cockpit(g,b,kind);
    const stern=-b.length*.5;
    g.box(0,.327,stern-.21,b.beam*.78,.105,.42,kind==="needle"?deckWood:steel);
    for(const x of [-.52,.52])g.box(x,.382,stern-.21,.31,.014,.26,kind==="needle"?"#8e6a51":"#546d72");
    if(kind==="mako"){outboard(g,-.27,stern-.52,true,b.deck);outboard(g,.27,stern-.52,true,b.deck);}
    else outboard(g,0,stern-.50,false,b.stripe);
  }

  function rivalPilot(g){
    const x=-.38,z=-.35,skin="#ac7456",sleeve="#ecce8b",vest="#d7734d",cap="#3d6570";
    const frame=(y,w,d,front)=>[[-.35,.5],[.35,.5],[.5,.23],[.49,-.30],[.30,-.5],[-.30,-.5],[-.49,-.30],[-.5,.23]].map(([a,b])=>[x+a*w,y,z+b*d+front]);
    const join=(a,b,color)=>{for(let i=0;i<8;i++)g.quad(a[i],a[(i+1)%8],b[(i+1)%8],b[i],color,.90+.10*Math.sin(i*.8));};
    join(frame(.61,.31,.23,-.012),frame(.71,.30,.24,.005),ink);
    join(frame(.68,.30,.25,.012),frame(1.045,.39,.236,.034),sleeve);
    join(frame(.71,.319,.265,.02),frame(.993,.392,.259,.031),vest);
    g.box(x,.824,z-.107,.319,.031,.018,ink);
    g.quad([x-.108,.935,z-.104],[x-.025,.91,z-.11],[x-.017,.966,z-.109],[x-.111,.99,z-.105],sand);
    g.quad([x+.108,.935,z-.104],[x+.025,.91,z-.11],[x+.017,.966,z-.109],[x+.111,.99,z-.105],sand);
    join(frame(1.009,.38,.24,.034),frame(1.067,.22,.17,.056),sleeve);
    g.cyl(x,1.09,z+.055,.064,.083,.1,7,skin);
    join(frame(1.11,.13,.138,.06),frame(1.205,.176,.184,.055),skin);
    join(frame(1.205,.176,.184,.055),frame(1.282,.157,.173,.054),skin);
    join(frame(1.23,.183,.192,.049),frame(1.30,.155,.177,.042),cap);
    g.cyl(x,1.299,z+.04,.045,.077,.032,8,cap);
    g.box(x,1.242,z+.138,.177,.018,.09,cap);
    for(const side of [-1,1]){
      const shoulder=[x+side*.175,1.023,z+.047],elbow=[x+side*.226,.871,z+.165],hand=[x+side*.12,1.008,z+.322];
      g.pole(shoulder,elbow,.058,sleeve,6);g.pole(elbow,hand,.039,skin,6);
      g.box(hand[0],hand[1],hand[2],.073,.078,.058,skin);
      g.pole([x+side*.085,.635,z+.045],[x+side*.127,.655,z+.32],.088,"#465661",6);
      g.pole([x+side*.127,.655,z+.32],[x+side*.125,.32,z+.43],.062,"#465661",6);
    }
  }
  function buoy(g,kind){
    const start=kind==="start-buoy",red=kind.endsWith("red"),active=kind.startsWith("check");
    const band=start?"#ecd796":red?"#cd644d":"#4a9381",shadow=start?"#65665b":red?"#944a40":"#356d68";
    g.cyl(0,.055,0,.60,.49,.28,10,ink);
    g.cyl(0,.279,0,.52,.59,.22,10,shadow);
    g.cyl(0,.45,0,.46,.52,.14,10,band);
    g.cyl(0,.54,0,.45,.46,.085,10,sand);
    g.cyl(0,.69,0,.31,.45,.23,10,band);
    g.cyl(0,.87,0,.25,.31,.13,8,shadow);
    for(const [x,z] of [[-.19,-.13],[.19,-.13],[0,.19]])
      g.pole([x,.88,z],[x*.82,1.47,z*.82],.027,band,5);
    g.cyl(0,1.48,0,.232,.237,.074,8,ink);
    if(red)g.cyl(0,1.68,0,.035,.216,.34,8,band);
    else g.cyl(0,1.64,0,.19,.19,.25,8,band);
    g.cyl(0,red?1.89:1.79,0,.073,.082,.125,8,"#f1d798");
    if(!active&&!start)return;
    const h=start?3.52:4.28;
    g.pole([0,1.51,0],[0,h+.07,0],.034,ink,6);
    const bottom=h-(start?.65:1.28);
    const pt=(t,y)=>{const w=(start?1.18:.67)*t;return [w,y-.13*t,.21*Math.sin(t*Math.PI*1.32)*t];};
    for(let i=0;i<4;i++)for(let j=0;j<(start?2:1);j++){
      const u=i/4,v=(i+1)/4,y=h-(h-bottom)*j/(start?2:1),y2=h-(h-bottom)*(j+1)/(start?2:1);
      const color=start?((i+j)%2?sand:ink):band;
      g.quad(pt(u,y),pt(v,y),pt(v,y2),pt(u,y2),color);
    }
    if(active){
      // Two reflective bands stay luminous against a shadowed shoreline.
      for(const face of [-.009,.009])for(const offset of [.29,.53])for(let i=0;i<4;i++){
        const raise=p=>[p[0],p[1],p[2]+face];
        const u=i/4,v=(i+1)/4,slant=t=>bottom+offset+.34*t;
        g.quad(raise(pt(u,slant(u))),raise(pt(v,slant(v))),raise(pt(v,slant(v)+.12)),raise(pt(u,slant(u)+.12)),sand);
      }
    }
  }
  function cleat(g,x,z){
    g.box(x,.516,z,.19,.070,.097,steel);
    g.box(x,.560,z,.32,.043,.071,rail);
  }
  function dock(g){
    g.box(0,.13,0,6.94,.39,9.95,"#536364");
    g.box(0,.38,0,7,.147,10,deckWood);
    for(let i=0;i<23;i++){
      const z=-4.77+i*.434;
      g.quad([-3.47,.456,z-.206],[3.47,.456,z-.206],[3.47,.456,z+.206],[-3.47,.456,z+.206],["#bc9775","#b4916d","#c3a17c","#ba9670"][i%4]);
      if(i%3===0)for(const x of [-2.91,2.91])
        g.quad([x-.025,.46,z-.031],[x+.034,.46,z-.031],[x+.034,.46,z+.032],[x-.025,.46,z+.032],"#766a59");
    }
    for(const x of [-3.48,3.48]){
      g.box(x,.228,0,.15,.12,9.97,ink);
      for(const z of [-4.68,4.68]){
        g.cyl(x*.95,.49,z,.129,.18,1.53,8,"#786b5b");
        g.cyl(x*.95,1.21,z,.14,.14,.135,8,sand);
        g.cyl(x*.95,.93,z,.135,.14,.082,8,"#4d7773");
        cleat(g,x*.8,z*.86);
      }
    }
    for(const z of [-4.94,4.94])g.box(0,.214,z,6.92,.117,.16,ink);
    // Ring on a short upright near the end, clear of the landing path.
    const x=1.98,z=4.47;
    g.box(x,.88,z,.12,.85,.12,deckWood);
    const ctr=[x,1.08,z-.10],r=.298;
    const loop=i=>[ctr[0]+r*Math.cos(tau*i/12),ctr[1]+r*Math.sin(tau*i/12),ctr[2]];
    for(let i=0;i<12;i++)g.pole(loop(i),loop(i+1),.052,i%3===0?"#f3e4b9":"#cf7651",5);
    // A swimmer's ladder hangs on the short end and a doubled line sits by a cleat.
    for(const sx of [-1.8,-1.24]){
      g.pole([sx,.48,-4.70],[sx,.76,-4.78],.028,rail,5);
      g.pole([sx,.76,-4.78],[sx,.77,-5.12],.028,rail,5);
      g.pole([sx,.77,-5.12],[sx,-.34,-5.15],.028,rail,5);
    }
    for(const y of [.12,-.19])g.pole([-1.8,y,-5.14],[-1.24,y,-5.14],.027,steel,5);
    const turns=21,coil=(i,y)=>{const t=i*tau/8,r=.16+.007*i;return [-2.59+r*Math.cos(t),y,3.51+r*.66*Math.sin(t)];};
    for(let i=0;i<turns;i++)g.pole(coil(i,.488),coil(i+1,.488),.022,"#d2af75",4);
  }
  function gangway(g){
    g.box(0,.23,0,30,.34,2.98,"#746c60");
    g.box(0,.421,0,30,.07,3,deckWood);
    for(let i=0;i<42;i++){
      const x=-14.65+i*.713;
      g.quad([x-.34,.459,-1.475],[x+.34,.459,-1.475],[x+.34,.459,1.475],[x-.34,.459,1.475],["#c39c75","#b79371","#b18a68","#bd9873"][i%4]);
    }
    for(const s of [-1,1]){
      for(const x of [-13.86,-9.32,-4.66,0,4.66,9.32,13.86]){
        g.box(x,.76,s*1.42,.100,1.02,.096,"#967c63");
        g.box(x,1.265,s*1.42,.112,.056,.117,sand);
      }
      g.box(0,1.209,s*1.42,27.85,.067,.095,"#b8a07e");
      g.box(0,.813,s*1.42,27.79,.029,.023,steel);
    }
  }
  function rock(g,x,z,rx,rz,h,angle,color){
    const pt=(theta,inner,y)=>[x+rx*inner*Math.cos(theta+angle),y,z+rz*inner*Math.sin(theta+angle)];
    const n=7,top=[x-rx*.12,h,z+rz*.08];
    for(let i=0;i<n;i++){
      const a=i*tau/n,b=(i+1)*tau/n,hi=j=>h*(.62+.12*Math.cos(j*2.31+angle));
      const p=pt(a,.66,hi(i)),q=pt(b,.66,hi((i+1)%n));
      g.quad(pt(a,1,-.23),pt(b,1,-.23),q,p,color,.77+.18*Math.cos(a));
      g.tri(p,q,top,color);
    }
  }
  function beacon(g){
    const rocks=[[-2.4,1.2,2.1,1.55,1.04,.8,"#776d67"],[1.8,1.8,2.44,1.77,1.76,.3,"#9b8a75"],
      [-1.4,-2.1,2.36,1.74,1.30,.72,"#7e8077"],[2.7,-1.4,2.16,1.6,1.01,-.52,"#737873"],
      [-3.76,-.53,1.39,1.18,.48,.39,"#92928a"],[.4,3.80,1.69,1.14,.43,-.7,"#b2a48b"],
      [-.55,.32,2.62,2.38,1.96,.48,"#938b7c"]];
    for(const args of rocks)rock(g,...args);
    g.cyl(0,1.70,0,1.73,2.00,.81,10,"#807e72");
    g.cyl(0,2.14,0,1.60,1.76,.17,10,sand);
    g.cyl(0,3.01,0,1.33,1.49,1.60,10,"#ded0a9");
    g.cyl(0,4.28,0,1.25,1.33,.95,10,"#ac5549");
    g.cyl(0,5.54,0,1.13,1.25,1.57,10,"#e9d6af");
    g.cyl(0,6.87,0,1.045,1.13,1.11,10,"#ac5549");
    g.cyl(0,8.08,0,.955,1.045,1.31,10,"#e9d6af");
    g.cyl(0,8.80,0,1.38,.94,.20,10,ink);
    g.cyl(0,8.94,0,1.42,1.40,.12,10,"#a9b4a1");
    const pt=(i,r,y)=>[Math.cos(tau*i/10)*r,y,Math.sin(tau*i/10)*r];
    for(let i=0;i<10;i++){
      g.pole(pt(i,1.31,9.0),pt(i,1.31,9.62),.031,ink,4);
      g.pole(pt(i,1.31,9.59),pt(i+1,1.31,9.59),.036,rail,4);
      g.pole(pt(i,1.31,9.29),pt(i+1,1.31,9.29),.016,ink,4);
    }
    g.cyl(0,9.22,0,.865,.86,.45,8,"#486069");
    g.cyl(0,9.94,0,.72,.73,1.07,8,"#c3dfce");
    for(const y of [9.73,9.87,10.04,10.17])g.cyl(0,y,0,.742,.742,.038,8,"#f8e8ae");
    for(let i=0;i<8;i++){
      const x=.80*Math.cos(tau*i/8),z=.80*Math.sin(tau*i/8);
      g.pole([x,9.40,z],[x,10.47,z],.045,ink,5);
    }
    g.cyl(0,10.49,0,1.024,1.02,.135,10,ink);
    g.cyl(0,10.79,0,.29,1.01,.52,10,"#984e43");
    g.cyl(0,11.11,0,.12,.31,.15,8,ink);
    g.pole([0,11.17,0],[0,11.64,0],.023,rail,5);
    g.box(0,2.94,-1.37,.63,1.43,.092,ink);
    g.box(-.007,2.94,-1.427,.49,1.30,.045,"#59736d");
    g.box(.129,2.91,-1.456,.071,.04,.019,rail);
    g.box(0,5.76,-1.13,.349,.42,.14,ink);
    g.box(0,5.77,-1.214,.243,.31,.033,"#85ada5");
  }
  function foam(g){
    g.quad([.008,0,1.03],[-.112,0,.32],[-.072,0,-.33],[.057,0,.27],"#d2ebe0");
    g.tri([-.071,0,-.33],[-.174,0,-1.0],[.012,0,-.25],"#a8d6ce");
    g.tri([.12,0,.65],[.074,0,.24],[.145,0,.35],"#eef0d9");
  }
  function swell(g){
    g.quad([-2.85,0,-.32],[-1.27,0,.15],[-.48,0,.16],[-1.58,0,.04],"#75bcb9");
    g.tri([-.8,0,.16],[.93,0,.19],[.39,0,.30],"#9accc1");
    g.tri([.95,0,.15],[2.62,0,-.15],[1.25,0,.23],"#75b8b5");
  }
  function install(model){
    for(const kind of Object.keys(boats))model("marina-"+kind,g=>boat(g,kind));
    model("marina-rival-pilot",rivalPilot);
    for(const kind of ["start-buoy","red","green","check-red","check-green"])model("marina-"+kind,g=>buoy(g,kind));
    model("marina-dock",dock);model("marina-gangway",gangway);model("marina-beacon",beacon);
    model("marina-foam",foam);model("marina-swell",swell);
  }

  function drawMap(c,kind,x,y,scale,yaw=0){
    if(!(scale>0))return;
    c.save();c.translate(x,y);c.rotate(yaw);c.scale(scale,-scale);
    function rect(color,x,z,w,d){c.fillStyle=color;c.fillRect(x,z,w,d);}
    function poly(color,p){
      c.fillStyle=color;c.beginPath();c.moveTo(p[0][0],p[0][1]);
      for(let i=1;i<p.length;i++)c.lineTo(p[i][0],p[i][1]);
      c.closePath();c.fill();
    }
    function ellipse(color,x,z,rx,rz,angle=0){c.fillStyle=color;c.beginPath();c.ellipse(x,z,rx,rz,angle,0,tau);c.fill();}
    const b=boats[kind];
    if(b){
      const l=b.length*.5,w=b.beam*.5;
      const outline=[[0,l],[.30*w,l*.87],[.60*w,l*.68],[.85*w,l*.46],[w,l*.14],[w,-l*.31],[.94*w,-l*.82],[.77*w,-l]];
      const shell=outline.concat(outline.slice(1).reverse().map(([x,z])=>[-x,z]));
      poly(ink,shell);
      poly(b.body,shell.map(([x,z])=>[x*.96,z*.975]));
      poly(b.deck,shell.map(([x,z])=>[x*.82,z*.94]));
      if(kind==="needle"){
        for(const s of [-1,1])poly("#a86d53",[[s*.04,l*.26],[s*.69*w,l*.26],[s*.46*w,l*.58],[s*.04,l*.85]]);
        rect(rail,-.021,l*.25,.042,l*.61);
      }else{
        for(const s of [-1,1])poly(b.stripe,[[s*.43*w,l*.27],[s*.64*w,l*.38],[s*.22*w,l*.85],[s*.28*w,l*.55]]);
      }
      ellipse(b.stripe,0,l*.47,.32,.30);ellipse(b.trim,0,l*.47,.278,.254);
      if(scale>=4)stamp(b.number,.057,(u,v,w,h)=>rect(ink,u,v+l*.47-h,w,h));
      const cockpitW=w-.16;
      poly(b.stripe,[[-cockpitW,.54],[0,.65],[cockpitW,.54],[cockpitW*.93,-l*.60],[-cockpitW*.93,-l*.60]]);
      poly("#718079",[[-cockpitW+.075,.49],[cockpitW-.075,.49],[cockpitW*.87,-l*.55],[-cockpitW*.87,-l*.55]]);
      for(const side of [-1,1]){
        rect(b.seat,side*.38-.21,-.53,.42,.37);
        rect(b.trim,side*.38-.21,-.62,.42,.082);
      }
      rect(b.seat,-cockpitW*.84,-1.52,cockpitW*1.68,.41);rect(b.trim,-cockpitW*.86,-1.57,cockpitW*1.72,.074);
      const hatchZ=-l*.80;
      rect(kind==="needle"?"#9b7155":b.stripe,-.65,hatchZ-.33,1.3,.66);
      rect(kind==="needle"?"#c19671":b.deck,-.62,hatchZ-.30,1.24,.60);
      for(let i=-2;i<=2;i++){
        if(kind==="needle")rect("#ddae82",-.60,hatchZ+i*.10,1.2,.018);
        else for(const side of [-1,1])rect(ink,side*.35-.19,hatchZ+i*.10,.38,.044);
      }
      poly(ink,[[-cockpitW,-.19],[-cockpitW+.015,.4],[0,.61],[cockpitW-.015,.4],[cockpitW,-.19],[cockpitW-.10,.26],[0,.42],[-cockpitW+.10,.26]]);
      poly("#90b4af",[[-cockpitW+.032,.31],[0,.574],[cockpitW-.032,.31],[0,.437]]);
      rect(ink,-.67,-l-.30,1.34,.30);
      for(const motor of kind==="mako"?[-.27,.27]:[0]){
        const width=kind==="mako"?.36:.47;
        ellipse(ink,motor,-l-.49,width*.55,.26);rect("#526876",motor-width*.4,-l-.61,width*.80,.21);
        rect(kind==="mako"?b.deck:b.stripe,motor-width*.34,-l-.65,width*.68,.045);
      }
    }else if(kind==="rival-pilot"||kind==="pilot"){
      const helmX=-.38,helmZ=-.35;
      ellipse(kind==="rival-pilot"?"#bc7951":"#368b88",helmX,helmZ,.215,.127);
      ellipse(kind==="rival-pilot"?"#3b626a":"#684b43",helmX,helmZ+.035,.096,.108);
      if(kind==="rival-pilot")rect("#3b626a",helmX-.085,helmZ+.087,.17,.078);
    }else if(kind==="dock"||kind==="gangway"){
      if(kind==="dock"){
        rect(ink,-3.54,-5.03,7.08,10.06);rect(deckWood,-3.45,-4.96,6.9,9.92);
        for(let i=0;i<23;i++)rect(i%2?"#ba9979":"#c1a07b",-3.43,-4.93+i*.432,6.86,.394);
        for(const sx of [-3.3,3.3])for(const sz of [-4.68,4.68]){ellipse(ink,sx,sz,.18,.18);ellipse(sand,sx,sz,.113,.113);}
        ellipse("#a75542",1.98,4.39,.34,.14);ellipse(sand,1.98,4.39,.20,.064);
        for(const sx of [-2.8,2.8])for(const sz of [-4.02,4.02])rect(steel,sx-.16,sz-.04,.32,.08);
      }else{
        rect("#7f715f",-15,-1.50,30,3);rect(deckWood,-15,-1.43,30,2.86);
        for(let i=0;i<42;i++)rect(i%2?"#ba9875":"#c4a17c",-14.98+i*.713,-1.40,.68,2.80);
        for(const sz of [-1.42,1.42]){rect(rail,-13.98,sz-.043,27.96,.086);for(const sx of [-13.86,-9.32,-4.66,0,4.66,9.32,13.86])rect(sand,sx-.085,sz-.076,.17,.152);}
      }
    }else if(kind==="beacon"){
      for(const [cx,cz,rx,rz,angle,color] of [[-2,1.3,2.1,1.6,.8,"#81796c"],[1.8,1.8,2.42,1.73,.3,"#a28d74"],[-1.4,-2.1,2.35,1.73,.72,"#7d8175"],[2.7,-1.4,2.13,1.56,-.5,"#7d8278"],[-3.75,-.5,1.38,1.16,.4,"#969082"],[.4,3.8,1.67,1.14,-.7,"#a6a08c"]])
        ellipse(color,cx,cz,rx,rz,angle);
      ellipse("#b2ad92",0,0,1.94,1.94);ellipse(sand,0,0,1.66,1.65);ellipse(ink,0,0,1.41,1.41);
      ellipse("#c79d76",0,0,1.23,1.23);ellipse("#914e45",0,0,1.02,1.02);ellipse(sand,0,0,.28,.28);
    }else if(kind==="foam"||kind==="swell"){
      const points=kind==="foam"?[[.01,1.03],[-.12,.3],[-.17,-1.0],[.02,-.35],[.057,.27]]:
        [[-2.84,-.32],[-1.28,.15],[.50,.31],[2.61,-.16],[.96,.13],[-1.49,.03]];
      poly(kind==="foam"?"#d0e6d8":"#81bab6",points);
    }else if(["red","green","check-red","check-green","start-buoy"].includes(kind)){
      const start=kind==="start-buoy",color=start?"#f0cf79":kind.endsWith("red")?"#d3644d":"#478d77";
      ellipse(ink,0,0,.61,.61);ellipse(color,0,.019,.48,.48);ellipse(sand,0,.025,.27,.27);
      if(start||kind.startsWith("check")){
        poly(start?sand:color,[[0,.08],[start?1.17:.66,.17],[start?1.13:.64,.57],[0,.40]]);
        if(start){rect(ink,.25,.18,.26,.17);rect(ink,.77,.33,.25,.16);}
        else poly(sand,[[.09,.28],[.16,.19],[.56,.32],[.48,.40]]);
      }
    }
    c.restore();
  }
  window.BayMarinaArt=Object.freeze({install,drawMap});
})();
