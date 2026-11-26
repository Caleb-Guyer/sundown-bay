/* Cine Luna. The foyer, center aisle and raked seating floor share the same plan in both views. */
(() => {
  "use strict";
  const tau=Math.PI*2,clamp=(v,lo,hi)=>Math.max(lo,Math.min(v,hi)),mix=(a,b,k)=>a+(b-a)*k;
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const screen={x:0,y:3.665,z:9.72,w:8.64,h:4.86};
  const points={exit:{x:0,z:-9.33},program:{x:-2.7,z:-5.12},aisle:{x:0,z:-2.3}};
  const rows=[-2.30,-.37,1.56,3.49,5.42],columns=[1.21,2.16,3.11,4.06,5.01];
  const chairs=rows.flatMap((z,row)=>[-1,1].flatMap(side=>columns.map((x,col)=>({x:x*side,z,row,col,side}))));
  const audience=[chairs[12],chairs[37]],adaChair=chairs[6];
  const blocks=[
    {x:-4.30,z:-4.12,w:5.64,d:.32},{x:4.30,z:-4.12,w:5.64,d:.32},
    {x:4.35,z:-5.98,w:4.38,d:1.02},{x:-5.85,z:-8.73,w:1.52,d:.61},
    ...rows.flatMap(z=>[-3.11,3.11].map(x=>({x,z,w:4.64,d:.86})))
  ];
  const colors={trim:"#bb945c",bright:"#e5c588",brass:"#8a7054",ink:"#27363d",teal:"#356864",
    foyer:"#dfbb97",paper:"#f4d9a6",floor:"#bfab94",velvet:"#803e4b",wood:"#62414a",night:"#28343c",
    red:"#9e5a59",shade:"#583340",piping:"#b57964",wall:"#344950",ivory:"#f6e2bb"};

  function floorAt(z){return .72*clamp((7.10-z)/11.22,0,1);}
  function clear(x,z,r=.235){
    if(!Number.isFinite(x+z)||Math.abs(x)>7.0-r||z< -10.03+r||z>7.87-r)return false;
    return !blocks.some(b=>{
      const dx=Math.max(0,Math.abs(x-b.x)-b.w/2),dz=Math.max(0,Math.abs(z-b.z)-b.d/2);
      return Math.hypot(dx,dz)<r;
    });
  }
  function create(){
    return {x:0,z:-9.15,yaw:0,pitch:.012,stride:0,bob:0,seatBlend:0,seated:false,transition:null,stand:null,chair:null};
  }
  function nearbySeat(p){
    let best=null,min=1.42;
    for(const chair of chairs){
      if(audience.includes(chair)||p.ada&&chair===adaChair)continue;
      const distance=Math.hypot(chair.x-p.x,chair.z-p.z);
      if(distance<min){best=chair;min=distance;}
    }
    return best;
  }
  function action(r){
    if(r.transition)return null;
    if(r.seated)return "rise";
    if(Math.hypot(r.x-points.exit.x,r.z-points.exit.z)<1.18)return "exit";
    if(Math.hypot(r.x-points.program.x,r.z-points.program.z)<1.24)return "program";
    return nearbySeat(r)?"seat":null;
  }
  function transition(r,to){r.transition={x:r.x,z:r.z,yaw:r.yaw,pitch:r.pitch,blend:r.seatBlend,to,at:0};}
  function seat(r){
    if(r.seated||r.transition)return false;
    const chair=nearbySeat(r);if(!chair)return false;
    r.stand={x:r.x,z:r.z,yaw:r.yaw,pitch:r.pitch,blend:0};r.chair=chair;r.seated=true;
    const x=chair.x,z=chair.z-.035,d=Math.hypot(screen.x-x,screen.z-z);
    transition(r,{x,z,blend:1,yaw:Math.atan2(screen.x-x,screen.z-z),pitch:Math.atan2(screen.y-floorAt(z)-1.22,d)});
    return true;
  }
  function rise(r){
    if(!r.seated||r.transition||!r.stand)return false;
    r.seated=false;transition(r,r.stand);return true;
  }
  function move(r,dt,forward=0,right=0,fast=false){
    if(r.transition){
      const a=r.transition;a.at=Math.min(1,a.at+dt/.57);const f=a.at*a.at*(3-2*a.at),to=a.to;
      r.x=mix(a.x,to.x,f);r.z=mix(a.z,to.z,f);r.yaw=a.yaw+wrap(to.yaw-a.yaw)*f;
      r.pitch=mix(a.pitch,to.pitch,f);r.seatBlend=mix(a.blend,to.blend,f);r.bob*=Math.exp(-12*dt);
      if(a.at===1){r.transition=null;if(!r.seated){r.stand=r.chair=null;}}
      return;
    }
    if(r.seated)return;
    const length=Math.hypot(forward,right),step=(fast?4.45:2.72)*Math.min(.1,dt)/Math.max(1,length);
    const sin=Math.sin(r.yaw),cos=Math.cos(r.yaw),oldX=r.x,oldZ=r.z;
    const x=r.x+(sin*forward+cos*right)*step,z=r.z+(cos*forward-sin*right)*step;
    if(clear(x,r.z))r.x=x;
    if(clear(r.x,z))r.z=z;
    const travel=Math.hypot(r.x-oldX,r.z-oldZ);
    r.stride+=travel*4.95;r.bob+=((travel>.0001?.021:0)-r.bob)*-Math.expm1(-10*dt);
  }
  function look(r,dx,dy){
    if(r.transition)return;
    r.yaw+=clamp(dx,-240,240)*.00325;r.pitch=clamp(r.pitch-clamp(dy,-180,180)*.00255,-.75,.79);
  }
  function camera(r,aspect=1.78){
    const y=floorAt(r.z)+mix(1.55,1.22,r.seatBlend)+Math.sin(r.stride)*r.bob;
    let focal=1.39;
    if(r.seatBlend>0){
      // The nearest corners of the print loom larger from a side seat. Fit the whole
      // aperture in a screen-facing lens, independently of a viewer turning their head.
      const yaw=Math.atan2(-r.x,screen.z-r.z),pitch=Math.atan2(screen.y-y,Math.hypot(r.x,screen.z-r.z));
      const sin=Math.sin(yaw),cos=Math.cos(yaw),sp=Math.sin(pitch),cp=Math.cos(pitch);let fit=4.1;
      for(const side of [-1,1])for(const top of [-1,1]){
        const dx=side*screen.w/2-r.x,dy=screen.y+top*screen.h/2-y,dz=screen.z-r.z,along=dx*sin+dz*cos;
        const depth=along*cp+dy*sp,across=dx*cos-dz*sin,up=dy*cp-along*sp;
        fit=Math.min(fit,.85*aspect*depth/Math.max(.0001,Math.abs(across)),.735*depth/Math.max(.0001,Math.abs(up)));
      }
      focal=mix(focal,fit,r.seatBlend);
    }
    return {x:r.x,z:r.z,y,yaw:r.yaw,pitch:r.pitch,focal};
  }

  function flat(g,x,z,w,d,y,c){
    g.quad([x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],c);
  }
  function front(g,x,y,z,w,h,c){
    g.quad([x-w/2,y-h/2,z],[x+w/2,y-h/2,z],[x+w/2,y+h/2,z],[x-w/2,y+h/2,z],c);
  }
  function sideFace(g,x,y,z,w,h,c){
    g.quad([x,y-h/2,z-w/2],[x,y-h/2,z+w/2],[x,y+h/2,z+w/2],[x,y+h/2,z-w/2],c);
  }
  function strokeXY(g,x1,y1,x2,y2,z,w,c){
    const d=Math.hypot(x2-x1,y2-y1);if(!d)return;
    const dx=-(y2-y1)*w/(2*d),dy=(x2-x1)*w/(2*d);
    g.quad([x1+dx,y1+dy,z],[x2+dx,y2+dy,z],[x2-dx,y2-dy,z],[x1-dx,y1-dy,z],c);
  }
  const letters={
    A:["03 10 23","02 22"],C:["20 10 01 02 13 23"],D:["03 00 10 21 22 13 03"],E:["20 00 03 23","02 12"],F:["03 00 20","02 12"],
    G:["20 10 01 02 13 23 22 12"],H:["00 03","20 23","02 22"],I:["00 20","10 13","03 23"],
    L:["00 03 23"],M:["03 00 12 20 23"],N:["03 00 23 20"],O:["10 20 21 22 13 03 02 01 10"],P:["03 00 10 21 12 02"],
    R:["03 00 10 21 12 02","12 23"],S:["20 10 01 02 12 23 03"],T:["00 20","10 13"],
    U:["00 02 13 23 20"],W:["00 03 12 23 20"],X:["00 23","20 03"],Y:["00 11 20","11 13"]
  };
  function word(g,text,x,y,z,height,color){
    const unit=height/3,advance=unit*3.55,left=x-(text.length*advance-unit*1.55)/2;
    for(let i=0;i<text.length;i++)for(const shape of letters[text[i]]||[]){
      const pts=shape.split(" ").map(s=>[left+i*advance+Number(s[0])*unit,y+height*.5-Number(s[1])*unit]);
      for(let n=1;n<pts.length;n++)strokeXY(g,...pts[n-1],...pts[n],z,unit*.32,color);
    }
  }
  function disk(g,x,y,z,rx,ry,c,n=18){
    for(let i=0;i<n;i++){const a=tau*i/n,b=tau*(i+1)/n;
      g.tri([x,y,z],[x+rx*Math.cos(a),y+ry*Math.sin(a),z],[x+rx*Math.cos(b),y+ry*Math.sin(b),z],c);}
  }
  function insetFrame(g,x,y,z,w,h,outer,inside){
    front(g,x,y,z,w,h,outer);front(g,x,y,z-.012,w-.095,h-.095,inside);
  }
  function fan(g,cx,cy,z,x,y,outline,color){
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      g.tri([cx+x,cy+y,z],[cx+a[0],cy+a[1],z],[cx+b[0],cy+b[1],z],color);
    }
  }
  function slope(g,left,right,near,far,lift,color){
    g.quad([left,floorAt(near)+lift,near],[right,floorAt(near)+lift,near],
      [right,floorAt(far)+lift,far],[left,floorAt(far)+lift,far],color);
  }
  function floors(g){
    const y=.72;
    flat(g,0,-7.19,14.19,6.24,y,colors.floor);
    for(const z of [-9.65,-8.45,-7.25,-6.05,-4.85])flat(g,0,z,14.1,.014,y+.002,"#a89987");
    for(let x=-6.48;x<7;x+=1.30)flat(g,x,-7.19,.014,6.15,y+.002,"#a89987");
    for(let i=0;i<240;i++){
      const x=-6.92+(i*101%263)/19.1,z=-9.95+(i*83%241)/40.8;
      const s=.022+.012*(i%4);
      g.tri([x,y+.003,z],[x+s,y+.003,z+s*.23],[x-s*.30,y+.003,z+s*.66],["#ebe0c3","#9c8c7d","#baa490"][i%3]);
    }
    // An inlaid tidal fan leads from the entrance doors to the aisle.
    const cz=-9.61,base=.725;
    for(let i=0;i<11;i++){
      const a=.14+(Math.PI-.28)*i/11,b=.14+(Math.PI-.28)*(i+1)/11;
      const at=(r,t)=>[r*Math.cos(t),base,cz+r*Math.sin(t)];
      g.quad(at(1.55,a),at(1.65,a),at(1.65,b),at(1.55,b),colors.trim);
      if(i%2===0)g.quad(at(.14,a),at(1.49,a),at(1.49,b),at(.14,b),i%4===0?"#56867e":"#bc826f");
    }
    for(const x of [-1.09,1.09])flat(g,x,-5.46,.038,2.64,y+.005,colors.trim);
    slope(g,-7.12,7.12,-4.13,7.10,0,"#4b4951");
    flat(g,0,8.65,14.23,3.1,0,"#40444a");
    for(const [a,b] of [[-6.78,-5.64],[-.70,.70],[5.64,6.78]]){
      slope(g,a,b,-4.12,7.10,.009,"#764451");
      for(const x of [a+.068,b-.068])slope(g,x-.014,x+.014,-4.12,7.10,.012,"#ad8266");
    }
    for(const z of rows)for(const x of [-3.11,3.11]){
      const h=floorAt(z);g.box(x,h+.013,z,4.83,.10,1.07,"#44424a");
      flat(g,x,z-.49,4.76,.052,h+.065,"#857464");
      for(const side of [-1,1])flat(g,x+side*2.30,z-.50,.13,.043,h+.069,"#e5b97f");
    }
    for(const x of [-6.79,6.79])slope(g,x-.075,x+.075,-4.12,7.1,.014,"#574954");
  }

  function foyer(g,cutaway=false){
    const y=.72;
    if(cutaway){
      for(const s of [-1,1]){
        g.box(s*4.30,.86,-4.12,5.68,.27,.34,colors.teal);
        g.box(s*7.10,.86,-7.12,.16,.29,6.17,"#927f70");
      }
      g.box(-2.7,1.95,-4.19,1.63,2.48,.26,colors.teal);
    }else for(const s of [-1,1]){
      const x=s*4.32;
      g.box(x,2.02,-4.12,5.68,4.04,.34,"#c39a7e");
      front(g,x,2.37,-4.31,5.60,2.95,colors.foyer);
      front(g,x,1.06,-4.324,5.61,.64,"#638780");
      for(const h of [1.32,1.39,3.80])front(g,x,h,-4.336,5.64,.034,colors.trim);
      g.box(s*1.42,2.12,-4.16,.17,2.82,.50,"#53726b");
      g.box(s*1.34,2.12,-4.32,.038,2.85,.20,colors.trim);
      g.box(s*1.58,3.45,-4.28,.26,.48,.30,colors.teal);
    }
    if(!cutaway){
      g.box(0,3.69,-4.13,3.02,.71,.39,colors.teal);
      front(g,0,3.70,-4.346,2.69,.49,"#2d524e");word(g,"LUNA",0,3.70,-4.362,.30,colors.paper);
      for(const s of [-1,1])for(let i=0;i<3;i++)front(g,s*(1.04-.05*i),3.59+i*.105,-4.36,.35+i*.09,.026,colors.bright);
    }
    // A screen-printed playbill after the theater's resident pelican.
    const px=points.program.x;
    insetFrame(g,px,2.29,-4.377,1.53,1.92,colors.trim,"#315a59");
    front(g,px,2.26,-4.401,1.34,1.32,colors.paper);front(g,px,2.38,-4.416,1.20,.89,"#779a8e");
    disk(g,px+.23,2.55,-4.424,.221,.221,"#f1c178",22);
    front(g,px,2.158,-4.428,1.20,.445,"#5d8b83");
    for(let i=0;i<8;i++){
      const x=px+(i%2===0?.28:-.37)+(i%3)*.034,y=1.98+i*.046;
      front(g,x,y,-4.434,i%2===0?.39:.20,.010,"#a2b4a0");
    }
    const bird="#344c50",throat="#e3cf95";
    strokeXY(g,px-.315,2.164,px-.313,2.032,-4.444,.023,bird);
    strokeXY(g,px-.231,2.154,px-.243,2.028,-4.444,.023,bird);
    front(g,px-.30,2.004,-4.447,.56,.041,"#6b6855");
    fan(g,px,2.34,-4.452,-.25,-.095,[[-.53,-.14],[-.36,-.10],[-.28,-.005],[-.17,.02],[-.10,-.055],[-.11,-.14],[-.18,-.188],[-.31,-.19]],bird);
    fan(g,px,2.34,-4.456,-.12,.06,[[-.20,-.08],[-.18,.10],[-.145,.19],[-.086,.24],[-.018,.226],[.003,.17],[-.046,.12],[-.066,.03],[-.096,-.09]],bird);
    disk(g,px-.076,2.534,-4.457,.080,.069,bird,12);
    fan(g,px,2.34,-4.460,.067,.134,[[-.038,.184],[.307,.144],[.335,.124],[.285,.100],[.072,.085],[-.034,.115]],throat);
    strokeXY(g,px-.041,2.533,px+.332,2.474,-4.465,.016,bird);
    disk(g,px-.042,2.551,-4.468,.012,.012,colors.paper,7);
    for(let i=0;i<3;i++)strokeXY(g,px-.39+i*.052,2.216,px-.23+i*.026,2.264+i*.016,-4.466,.012,"#789082");
    word(g,"TONIGHT",px,3.05,-4.404,.118,colors.paper);word(g,"PROGRAM",px,1.789,-4.433,.087,"#6b7768");
    for(const s of [-1,1])front(g,px+s*.48,1.785,-4.431,.136,.014,"#a59a7f");
    if(!cutaway)for(const s of [-1,1]){
      // A pair of stepped opal lamps flank the entrance like small shells.
      const sx=s*(s<0?4.34:1.95);
      insetFrame(g,sx,2.63,-4.354,.36,.73,"#977a59","#48736d");
      for(let j=-2;j<=2;j++){
        const h=.36-.056*Math.abs(j);g.box(sx+j*.092,2.64+h*.17,-4.46,.086,h,.13,"#ffe0a8");
      }
      front(g,sx,2.48,-4.55,.45,.055,"#a18560");
    }
    if(!cutaway)for(const s of [-1,1]){
      g.box(s*7.10,2.59,-7.12,.16,3.80,6.17,s<0?"#d6b494":"#cda88b");
      g.box(s*6.994,1.04,-7.12,.06,.63,6.14,"#668a7e");
      g.box(s*6.976,1.38,-7.12,.074,.06,6.13,colors.trim);
    }
    const x=4.35,z=-5.98;
    g.box(x,1.22,z,4.36,.98,.97,colors.teal);g.box(x,1.74,z,4.48,.105,1.10,"#e4c89a");
    for(let i=0;i<15;i++)front(g,x-1.95+i*.28,1.24,z-.492,.055,.70,"#73988a");
    for(const h of [.85,1.54,1.63])front(g,x,h,z-.51,4.32,.026,colors.trim);
    // The popcorn box is open glass with a suspended copper kettle and striped bags beside it.
    const cx=x-.78;
    g.box(cx,1.84,z,.91,.12,.64,colors.red);g.box(cx,2.48,z,.96,.12,.68,colors.red);
    for(const dx of [-.42,.42])for(const dz of [-.28,.28])g.box(cx+dx,2.15,z+dz,.038,.60,.038,colors.bright);
    front(g,cx,2.22,z+.285,.82,.44,"#94a393");
    g.cyl(cx,2.25,z,.19,.115,.16,9,"#ad815c");g.pole([cx+.06,2.27,z],[cx+.06,2.44,z],.02,colors.brass,5);
    for(let i=0;i<17;i++){
      const xx=cx-.33+(i*13%23)/35,zz=z-.20+(i*7%19)/48;
      g.cyl(xx,1.945+.035*Math.sin(i*2),zz,.076,.091,.08,5,i%3===1?"#d9aa6c":"#efd090");
    }
    for(let i=0;i<3;i++){
      const bx=x+.03+i*.21;g.box(bx,1.945,z-.16,.18,.31,.16,"#eac39b");
      for(const dx of [-.055,.018])front(g,bx+dx,1.95,z-.245,.033,.27,colors.red);
    }
    g.box(x+1.56,1.92,z,.51,.27,.39,"#496462");front(g,x+1.56,2.027,z-.209,.37,.085,"#dfcb9c");
    insetFrame(g,x+.04,2.72,-4.36,2.99,.76,"#64887d","#355e59");
    word(g,"CANDY",x+.04,2.72,-4.396,.28,colors.paper);
    const bench=blocks[3];for(const xx of [-.55,.55])g.box(bench.x+xx,.91,bench.z,.11,.38,.39,colors.brass);
    g.box(bench.x,1.11,bench.z,1.52,.14,.61,colors.wood);
    for(const dz of [-.22,-.07,.08,.23])g.box(bench.x,1.204,bench.z+dz,1.47,.06,.108,"#ba8267");
    // The ticket doors face the street: two ribbed brass handles catch the lobby light.
    if(cutaway){
      for(const s of [-1,1])g.box(s*4.18,.84,-10.18,5.83,.25,.14,"#a18c77");
      flat(g,0,-9.90,2.46,.16,y+.009,"#7d8171");
      return;
    }
    g.box(0,2.60,-10.18,14.35,3.83,.14,"#c39e85");
    g.box(0,2.04,-10.07,2.57,2.64,.12,colors.teal);
    for(const s of [-1,1]){
      const dx=s*.60;g.box(dx,2.10,-9.997,1.13,2.50,.06,"#926f54");
      g.box(dx,2.30,-9.951,.95,1.46,.025,"#799a96");g.box(dx,1.33,-9.95,.95,.36,.025,colors.teal);
      for(const h of [1.58,2.19,2.99])g.box(dx,h,-9.925,1.02,.047,.035,colors.trim);
      g.pole([s*.18,1.72,-9.89],[s*.18,2.0,-9.89],.029,colors.bright,6);
      // A fluted plaster surround and fanlight frame the street doors.
      for(let i=0;i<3;i++)g.box(s*(1.35+i*.10),2.04,-10.028,.056,2.62-i*.15,.20,i%2===0?colors.brass:colors.teal);
      for(let i=0;i<3;i++)g.box(s*(1.68+i*.35),3.30+i*.058,-10.058,.70,.041,.15,colors.brass);
    }
    g.box(0,4.44,-7.14,14.24,.11,6.28,"#c2ad91");
    for(const zL of [-8.63,-5.43])for(const dx of [-3.02,3.02]){
      g.cyl(dx,4.35,zL,.33,.37,.07,12,colors.brass);g.cyl(dx,4.29,zL,.28,.23,.083,12,"#ffe1a3");
    }
    flat(g,0,-9.90,2.46,.16,y+.009,"#7d8171");
  }

  function chairBack(g,x,y,z,fabric){
    // Rounded shoulders and a narrow wooden shell show from the foyer when every seat faces the stage.
    const outline=[[-.335,.46],[.335,.46],[.365,.82],[.34,.957],[.268,1.026],[.135,1.051],
      [-.135,1.051],[-.268,1.026],[-.34,.957],[-.365,.82]];
    const point=(p,s)=>[x+p[0],y+p[1],z-.22-.10*(p[1]-.46)+s];
    for(let i=0;i<outline.length;i++){
      const a=outline[i],b=outline[(i+1)%outline.length];
      g.tri([x,y+.78,z-.175],point(a,.080),point(b,.080),fabric);
      g.tri([x,y+.78,z-.278],point(b,-.015),point(a,-.015),"#6d434c");
      g.quad(point(a,-.015),point(b,-.015),point(b,.080),point(a,.080),i>2&&i<7?"#b07967":"#875854");
    }
    for(let i=3;i<7;i++)g.pole(point(outline[i],-.022),point(outline[i+1],-.022),.009,"#b88069",4);
    for(const p of [-1,1])g.box(x+p*.275,y+.772,z-.27,.021,.32,.023,"#91645c",0);
  }
  function seatBank(g,y=0,z=0){
    for(const side of [-1,1])for(let i=0;i<columns.length;i++){
      const x=columns[i]*side,c=i%3===0?"#a4585f":i%3===1?"#994e56":"#ae6264";
      g.box(x,y+.17,z,.40,.24,.31,"#3c3b42");g.box(x,y+.33,z,.65,.12,.51,"#4d4047");
      g.box(x,y+.445,z+.025,.65,.135,.55,c);chairBack(g,x,y,z,c);
      for(const s of [-1,1]){
        g.box(x+s*.395,y+.43,z+.015,.060,.48,.30,"#58424a");
        g.box(x+s*.395,y+.683,z+.015,.095,.093,.47,"#ac7661");
      }
    }
  }
  function moviegoer(g,chair,second=false,x=chair.x,y=floorAt(chair.z),z=chair.z){
    const skin=second?"#ad795d":"#bf9072",jacket=second?"#666c67":"#526c6c",hair=second?"#3a3437":"#49423d";
    g.cyl(x,y+.863,z-.055,.178,.236,.41,8,jacket);
    for(const s of [-1,1]){
      g.pole([x+s*.17,y+.98,z-.035],[x+s*.235,y+.73,z+.17],.071,jacket,6);
      g.pole([x+s*.235,y+.73,z+.17],[x+s*.11,y+.70,z+.22],.056,skin,6);
    }
    g.cyl(x,y+1.162,z-.085,.145,.109,.25,8,skin);
    g.cyl(x,y+1.282,z-.095,.105,.162,.145,8,hair);
    if(second){g.cyl(x+.023,y+1.29,z-.22,.077,.094,.12,7,hair);}
    else{g.box(x+.10,y+.75,z+.22,.16,.17,.15,"#d3b393");front(g,x+.10,y+.75,z+.142,.035,.145,"#a96559");}
  }

  function adaInHouse(g){
    const {x,z}=adaChair,y=floorAt(z);
    moviegoer(g,adaChair,true);
    g.cyl(x+.02,y+1.30,z-.19,.09,.105,.12,8,"#aa9e88");
    g.pole([x-.16,y+1.02,z-.03],[x+.15,y+.93,z+.08],.038,"#ab6653",6);
    g.box(x+.03,y+.72,z+.25,.35,.012,.22,"#d5c2a2");
    g.pole([x-.08,y+.73,z+.19],[x+.15,y+.73,z+.29],.012,"#966548",5);
  }
  function stage(g){
    g.box(0,3.51,10.31,14.38,7.07,.24,"#38404b");
    g.box(0,.24,9.07,14.02,.48,2.34,"#603f48");
    g.box(0,.50,9.16,14.11,.13,2.55,"#a27d64");
    front(g,0,.29,7.88,13.96,.24,"#6c484d");
    for(const h of [.15,.39])front(g,0,h,7.868,13.92,.024,"#a88368");
    for(let x=-6.6;x<6.8;x+=.67)front(g,x,.27,7.858,.027,.20,"#926953");
    for(const s of [-1,1]){
      g.box(s*5.93,3.70,9.86,2.81,6.26,.58,"#3c3342");
      // Each curtain is an accordion of velvet pleats, cinched slightly toward the wall at waist height.
      const shades=["#663c4a","#a45b60","#813f4d","#4f3442"];
      for(let i=0;i<14;i++){
        const x1=4.48+i*.175,x2=x1+.175,z1=9.37+(i%2)*.13,z2=9.37+((i+1)%2)*.13;
        const curtain=(x,h,zp)=>[s*(x+(1-(x-4.48)/2.46)*(.23*Math.sin((h-.59)/6*Math.PI))),h,zp];
        for(const [l,h] of [[.58,2.8],[2.8,4.3],[4.3,6.56]]){
          g.quad(curtain(x1,l,z1),curtain(x2,l,z2),curtain(x2,h,z2),curtain(x1,h,z1),shades[i%4]);
        }
      }
      for(let i=0;i<3;i++){
        const xx=s*(4.54+i*.21);
        g.box(xx,6.38+i*.135,9.32,.29,.25,.31,i===0?"#805155":"#92675c");
        front(g,xx,6.29+i*.14,9.15,.29,.023,"#c49a71");
      }
      g.box(s*6.81,3.71,9.26,.34,6.24,.45,"#5d4950");
      for(let j=0;j<3;j++)front(g,s*(6.72+j*.082),3.71,9.015,.018,6.12,"#ae8466");
      for(const [dx,yy] of [[.1,.79],[.7,.77],[1.3,.74]]){
        g.box(s*(4.65+dx),yy,8.06,.15,.14,.21,"#745b4d");
        front(g,s*(4.65+dx),yy,7.942,.087,.052,"#f2c58b");
      }
    }
    g.box(0,6.70,9.73,13.66,.40,.49,"#5a4850");
    front(g,0,6.68,9.46,13.30,.035,"#b28d70");front(g,0,6.81,9.46,12.92,.038,"#937660");
    // Screen masking is independent of the print, so the canvas always has a continuous dark surround.
    insetFrame(g,0,screen.y,9.82,9.01,5.22,"#8f7864","#292b36");
    front(g,0,screen.y,9.765,screen.w,screen.h,"#a4a49a");
    for(const s of [-1,1])for(let i=0;i<3;i++){
      const x=s*(5.66+i*.28);strokeXY(g,s*5.89,1.03,x,1.50+(.5-Math.abs(i-1)*.2),9.16,.035,"#a47560");
    }
  }
  function halls(g,cutaway=false){
    for(const s of [-1,1]){
      g.box(s*7.10,cutaway?.32:3.51,1.56,.18,cutaway?.64:7.04,15.2,colors.wall);
      if(cutaway)continue;
      g.box(s*6.989,.84,2.13,.073,1.64,12.15,"#45444e");
      for(const h of [1.43,1.57,5.62])g.box(s*6.93,h,2.8,.055,.035,13.76,"#ad866a");
      for(const z of [-2.14,1.96,6.03]){
        const side=s*6.982;
        sideFace(g,side,3.67,z,3.30,3.77,"#43565a");
        sideFace(g,s*6.96,3.67,z,3.01,3.55,"#385055");
        for(const d of [-1.61,1.61]){
          g.box(s*6.89,3.45,z+d,.13,4.05,.145,"#655865");
          g.box(s*6.80,3.47,z+d,.045,3.99,.039,"#ad8b71");
        }
        // Stepped opal sconces sit in a brass backplate and repeat the wings of the foyer sign.
        g.box(s*6.87,3.54,z,.18,.90,.52,"#8d7561");
        g.box(s*6.72,3.58,z,.23,.59,.35,"#ffda9b");
        for(const d of [-.22,.22])g.box(s*6.77,3.5,z+d,.16,.36,.086,"#d9ad77");
        for(const h of [3.38,3.71])g.box(s*6.59,h,z,.032,.025,.36,"#bc946a");
        sideFace(g,s*6.91,.62+floorAt(z),z,.22,.08,"#ecc28a");
      }
      for(const x of [s*5.60,s*3.20])g.box(x,6.89,2.87,.064,.059,14.24,"#61535b");
    }
    if(cutaway)return;
    g.box(0,7.04,3.04,14.29,.18,14.48,"#353944");
    for(const z of [-2.18,1.94,6.03])g.box(0,6.93,z,14.05,.11,.24,"#47414d");
    g.box(0,5.43,-4.09,14.24,3.18,.34,"#364950");
    for(const s of [-1,1]){
      front(g,s*4.32,2.13,-3.916,5.55,3.60,"#3a4d53");front(g,s*4.32,1.09,-3.89,5.55,.70,"#51454c");
      front(g,s*4.32,1.44,-3.87,5.54,.042,"#9e7960");
    }
    front(g,0,5.85,-3.891,14.02,.038,"#9a7d67");
    for(const x of [-.78,.78]){
      g.box(x,4.64,-3.835,1.18,.79,.14,"#826d59");
      g.box(x,4.64,-3.746,1.016,.642,.042,"#292f37");
      g.box(x,4.30,-3.71,1.29,.079,.32,"#886e58");
    }
    front(g,-.78,4.64,-3.714,.91,.56,"#a08c6c");
    front(g,-.78,4.63,-3.696,.86,.47,"#5d625a");
    disk(g,-.73,4.64,-3.678,.137,.137,"#373c41",12);
    disk(g,-.73,4.64,-3.660,.077,.077,"#f9e0ab",12);
    disk(g,-.73,4.64,-3.65,.04,.04,"#fff0c7",12);
    for(const x of [-2.17,2.17]){
      g.box(x,2.71,-3.862,.68,.30,.095,"#2d514d");
      // Seen from the house, the back of these EXIT signs faces in the reverse direction.
      const sign=new BayMesh();word(sign,"EXIT",0,0,0,.13,"#d1dcad");
      for(let i=0;i<sign.vertices.length;i+=6)g.vertices.push(x-sign.vertices[i],2.71+sign.vertices[i+1],-3.803,...sign.vertices.slice(i+3,i+6));
    }
  }
  function boothOperator(g){
    front(g,.78,4.64,-3.704,.92,.55,"#d7ae7b");
    g.box(.82,4.43,-3.66,.32,.20,.04,"#565651");
    disk(g,.86,4.62,-3.635,.125,.145,"#62594f",10);
    disk(g,.83,4.72,-3.624,.127,.079,"#4a4a47",10);
    for(const x of [.41,.55]){disk(g,x,4.74,-3.604,.072,.072,"#4a4e49",9);disk(g,x,4.74,-3.588,.025,.025,"#b39b72",7);}
  }
  function cutawayBooth(g){
    // The roof comes off in the high-angle view, exposing the projection table above the portal.
    for(const s of [-1,1]){
      g.box(s*1.44,2.11,-4.12,.15,2.78,.29,"#4f706b");
      g.box(s*1.44,3.54,-4.12,.26,.20,.39,colors.trim);
    }
    g.box(0,3.81,-4.12,3.05,.42,.72,colors.teal);
    front(g,0,3.79,-4.492,2.91,.20,"#355851");word(g,"LUNA",0,3.79,-4.502,.17,colors.paper);
    g.box(0,4.075,-4.12,3.05,.095,.84,"#ab8c70");
    for(const x of [-1.40,1.40])g.box(x,4.29,-4.09,.085,.42,.69,"#566865");
    g.box(-.71,4.34,-4.10,.41,.39,.39,"#425451");g.box(-.71,4.46,-3.82,.12,.11,.23,"#9b8969");
    for(const x of [-.84,-.58]){
      disk(g,x,4.66,-4.21,.12,.12,"#465753",12);disk(g,x,4.66,-4.225,.061,.061,"#bcaa83",9);
    }
    g.box(.80,4.26,-4.09,.77,.19,.42,"#766e60");
  }
  function printMesh(g){
    const left=-screen.w/2,right=screen.w/2,top=screen.y+screen.h/2,bottom=screen.y-screen.h/2,z=screen.z;
    for(const [x,y,u,v] of [[left,top,0,0],[right,top,1,0],[right,bottom,1,1],
      [left,top,0,0],[right,bottom,1,1],[left,bottom,0,1]])g.vertices.push(x,y,z,u,v,0);
  }
  function beamMesh(g){
    const lens=[-.73,4.64,-3.62],z=screen.z-.02,y=screen.y,h=screen.h/2,w=screen.w/2;
    const edges=[[-w,y+h,z],[w,y+h,z],[w,y-h,z],[-w,y-h,z]];
    for(let i=0;i<4;i++)g.tri(lens,edges[i],edges[(i+1)%4],"#030000");
  }
  function install(model){
    model("cine-luna-foyer",g=>{floors(g);foyer(g);});
    model("cine-luna-house",g=>{halls(g);stage(g);});
    model("cine-luna-seats",g=>seatBank(g));
    model("cine-luna-audience",g=>audience.forEach((c,i)=>moviegoer(g,c,i===1)));
    model("cine-luna-ada",adaInHouse);model("cine-luna-operator",boothOperator);model("cine-luna-screen",printMesh);model("cine-luna-light",beamMesh);
  }
  const cityLighting=new WeakMap();
  function streetShadow(view){
    if(!view.gl||!view.u?.hasShadow)return 0;
    const city=view.models?.get("city"),previous=cityLighting.get(view);
    if(previous&&previous.city===city&&previous.texture===view.shadowTexture)return previous.amount;
    const amount=view.gl.getUniform(view.program,view.u.hasShadow)||0;
    cityLighting.set(view,{city,texture:view.shadowTexture,amount});return amount;
  }
  function world(view,room,t,hours,filmCanvas,revision){
    if(view.lost)return;
    // The theater uses local coordinates. Its screen and lamps cast their own painted light,
    // while the city's baked outdoor sunlight belongs to the original street coordinates.
    const shadow=streetShadow(view);
    if(shadow)view.gl.uniform1f(view.u.hasShadow,0);
    try{
      view.draw("cine-luna-foyer",0,0,0,0,0,0,.73);view.draw("cine-luna-house",0,0,0,0,0,0,.65);
      for(const z of rows)view.draw("cine-luna-seats",0,floorAt(z),z,0,0,0,.60);
      view.draw("cine-luna-audience",0,0,0,0,0,0,.57);
      if(room.ada)view.draw("cine-luna-ada",0,0,0,0,0,0,.67);
      if(room.projectionist)view.draw("cine-luna-operator",0,0,0,0,0,0,.88);
      if(filmCanvas&&filmCanvas.width){
        view.drawPrint("cine-luna-screen",filmCanvas,revision,0,0,0,0);
        if(room.z> -4.65&&view.drawSearchlight)view.drawSearchlight("cine-luna-light");
      }
    }finally{
      if(shadow)view.gl.uniform1f(view.u.hasShadow,shadow);
    }
  }

  // Bake the roofless house at its display resolution. A depth buffer keeps long pieces of
  // terrazzo and the rows of seats in the right order without sorting every movie frame.
  const mapTilt=.69,stageTilt=.075,planSize={left:-7.30,right:7.30,top:-14.37,bottom:7.10};
  let cutawayTriangles,stageTriangles,planPlate,stagePlate,streetPlate;
  function triangles(frontView){
    if(frontView&&stageTriangles)return stageTriangles;
    if(!frontView&&cutawayTriangles)return cutawayTriangles;
    const mesh=new BayMesh(),tilt=frontView?stageTilt:mapTilt;
    if(!frontView){
      floors(mesh);foyer(mesh,true);halls(mesh,true);cutawayBooth(mesh);
      for(const z of rows)seatBank(mesh,floorAt(z),z);
      audience.forEach((chair,i)=>moviegoer(mesh,chair,i===1));
      for(const s of [-1,1]){
        mesh.box(s*4.25,.37,-10.24,5.78,.65,.34,"#7c8c81");
        mesh.box(s*4.25,.735,-10.24,5.80,.085,.37,"#d6b991");
      }
      flat(mesh,0,-10.44,2.94,.64,.47,"#ba9f84");
      flat(mesh,0,-10.77,3.26,.39,.29,"#b69b83");
    }
    stage(mesh);
    const vertices=mesh.vertices,out=[];
    for(let i=0;i<vertices.length;i+=18){
      const p=[];
      for(let n=0;n<3;n++){const j=i+n*6,x=vertices[j],y=vertices[j+1],z=vertices[j+2];p.push(x,-y-z*tilt,-z+y*tilt);}
      const area=(p[3]-p[0])*(p[7]-p[1])-(p[6]-p[0])*(p[4]-p[1]);
      if(Math.abs(area)<.000003)continue;
      const shade=vertices.slice(i+3,i+6).map(c=>clamp(Math.round(c*253),0,255));
      out.push({p,shade});
    }
    if(frontView)stageTriangles=out;else cutawayTriangles=out;
    return out;
  }
  function buffer(w,h){
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;return canvas;
  }
  function bake(frontView,scale,bounds){
    const width=Math.ceil((bounds.right-bounds.left)*scale)+2,height=Math.ceil((bounds.bottom-bounds.top)*scale)+2;
    const canvas=buffer(width,height),c=canvas.getContext("2d"),data=c.createImageData(width,height);
    const depths=new Float32Array(width*height);depths.fill(-Infinity);
    for(const {p,shade} of triangles(frontView)){
      const x=(p[0]-bounds.left)*scale+1,y=(p[1]-bounds.top)*scale+1;
      const vx=(p[3]-p[0])*scale,vy=(p[4]-p[1])*scale,wx=(p[6]-p[0])*scale,wy=(p[7]-p[1])*scale;
      const inv=1/(vx*wy-vy*wx);
      const xmin=Math.max(0,Math.floor(x+Math.min(0,vx,wx))),xmax=Math.min(width-1,Math.ceil(x+Math.max(0,vx,wx)));
      const ymin=Math.max(0,Math.floor(y+Math.min(0,vy,wy))),ymax=Math.min(height-1,Math.ceil(y+Math.max(0,vy,wy)));
      for(let iy=ymin;iy<=ymax;iy++)for(let ix=xmin;ix<=xmax;ix++){
        const dx=ix+.5-x,dy=iy+.5-y,a=(dx*wy-dy*wx)*inv,b=(vx*dy-vy*dx)*inv;
        if(a<0||b<0||a+b>1)continue;
        const index=iy*width+ix,depth=p[2]+(p[5]-p[2])*a+(p[8]-p[2])*b;
        if(depth<depths[index]-.00002)continue;
        depths[index]=depth;
        const pos=index*4;data.data[pos]=shade[0];data.data[pos+1]=shade[1];data.data[pos+2]=shade[2];data.data[pos+3]=255;
      }
    }
    c.putImageData(data,0,0);return {canvas,scale,bounds};
  }
  function drawStageImage(c,film,ox,oy,scale,tilt){
    if(!film||!film.width)return;
    c.drawImage(film,ox+(screen.x-screen.w/2)*scale,oy-(screen.y+screen.h/2+screen.z*tilt)*scale,screen.w*scale,screen.h*scale);
  }
  function paintStreet(w,h,ox,oy,scale){
    const out=buffer(w,h),c=out.getContext("2d"),bg=c.createRadialGradient(ox,oy-2.5*scale,scale,ox,oy-2.5*scale,Math.max(w,h)*.8);
    bg.addColorStop(0,"#546261");bg.addColorStop(1,"#293e44");c.fillStyle=bg;c.fillRect(0,0,w,h);
    c.translate(ox,oy);c.scale(scale,scale);
    c.fillStyle="#3f5154";c.fillRect(-w/scale,-16,w/scale*2,1.75);
    c.fillStyle="#758079";c.fillRect(-w/scale,-14.74,w/scale*2,.049);
    c.fillStyle="#394a4d";c.fillRect(-w/scale,7.06,w/scale*2,3.02);
    c.fillStyle="#839083";c.fillRect(-w/scale,8.34,w/scale*2,.065);
    for(const s of [-1,1]){
      c.save();c.scale(s,1);
      c.fillStyle="#3c4b4c";c.fillRect(7.2,-14.2,2.19,21.15);
      c.fillStyle="#718078";c.fillRect(7.43,-13.89,.080,20.78);
      c.fillStyle="#52635e";c.fillRect(9.40,-13.42,7.54,19.66);
      c.fillStyle="#839185";c.fillRect(9.46,-13.23,7.26,.09);
      c.fillStyle="#60716a";c.fillRect(9.56,-12.97,6.97,18.88);
      c.fillStyle="#566960";c.fillRect(10.72,-9.64,4.71,5.38);
      c.fillStyle="#7e8c7c";c.fillRect(10.81,-9.70,4.52,1.12);
      c.fillStyle="#839184";c.fillRect(9.61,1.13,6.86,.09);
      c.fillStyle="#52655e";c.fillRect(10.31,2.77,1.60,1.49);
      for(const y of [-7.15,-6.49,-5.83]){c.fillStyle="#68796e";c.fillRect(10.98,y,3.95,.14);}
      for(let i=0;i<6;i++){
        c.fillStyle="#56706c";c.fillRect(7.70,5.57-i*3.34,.22,.80);
        c.fillStyle="#819084";c.fillRect(7.73,5.65-i*3.34,.16,.19);
      }
      // Long leaf shadows from the palms outside fall on the adjacent roofs.
      c.save();c.translate(12.72,4.72);c.rotate(-.42);c.fillStyle="rgba(35,57,54,.23)";
      c.fillRect(-.085,-3.75,.17,3.86);
      for(let i=0;i<9;i++){
        c.save();c.translate(0,-3.58);c.rotate(i*tau/9);
        c.beginPath();c.moveTo(0,0);c.quadraticCurveTo(.84,-.40,2.03,.54);c.quadraticCurveTo(.81,-.10,0,0);c.fill();c.restore();
      }
      c.restore();c.restore();
    }
    return out;
  }
  function paintPlayer(c,r,ox,oy,scale){
    c.save();c.translate(ox+r.x*scale,oy-(r.z*mapTilt+floorAt(r.z))*scale);c.scale(scale,scale);
    c.fillStyle="rgba(39,38,40,.35)";c.beginPath();c.ellipse(.08,.035,.31,.115,0,0,tau);c.fill();
    for(const s of [-1,1]){
      const swing=Math.sin(r.stride)*r.bob*3*s;
      c.fillStyle="#343e45";c.fillRect(s*.105-.043,-.28+swing,.10,.29);
      c.fillStyle="#56494b";c.fillRect(s*.105-.060,-.02+swing,.12,.065);
    }
    c.fillStyle="#65918a";c.beginPath();c.moveTo(-.18,-.70);c.quadraticCurveTo(0,-.80,.18,-.70);
    c.lineTo(.22,-.52);c.lineTo(.14,-.29);c.lineTo(-.14,-.29);c.lineTo(-.22,-.53);c.closePath();c.fill();
    c.fillStyle="#c49676";c.beginPath();c.ellipse(0,-.80,.134,.167,0,0,tau);c.fill();
    c.fillStyle="#534740";c.beginPath();c.ellipse(-.018,-.875,.13,.103,0,0,tau);c.fill();
    c.translate(0,-.53);c.rotate(r.yaw);
    c.fillStyle="#f0d59f";c.beginPath();c.moveTo(0,-.79);c.lineTo(-.105,-.56);c.lineTo(.105,-.56);c.closePath();c.fill();c.restore();
  }
  function paintProjectionist(c,ox,oy,scale){
    const x=ox+.81*scale,y=oy-(4.24-4.27*mapTilt)*scale;
    c.save();c.translate(x,y);c.scale(scale,scale);
    const light=c.createRadialGradient(.1,-.24,.02,.1,-.24,.48);
    light.addColorStop(0,"rgba(251,206,132,.65)");light.addColorStop(1,"rgba(251,206,132,0)");
    c.fillStyle=light;c.fillRect(-.42,-.73,1,1);
    c.fillStyle="#485650";c.beginPath();c.moveTo(-.23,.01);c.lineTo(-.18,-.22);c.lineTo(.034,-.34);
    c.lineTo(.20,-.21);c.lineTo(.22,.01);c.fill();
    c.fillStyle="#ad8c69";c.beginPath();c.ellipse(.015,-.395,.139,.163,0,0,tau);c.fill();
    c.fillStyle="#514f48";c.beginPath();c.ellipse(.034,-.48,.139,.084,-.1,0,tau);c.fill();
    c.fillStyle="#e8c58b";c.fillRect(.30,-.30,.079,.12);c.restore();
  }
  function seatSilhouette(c,x,y,w,h,shade){
    c.fillStyle=shade;c.beginPath();c.moveTo(x,y+h);c.lineTo(x-w*.04,y+h*.27);
    c.quadraticCurveTo(x-w*.05,y,x+w*.25,y);c.quadraticCurveTo(x+w*.51,y-h*.07,x+w*.77,y);
    c.quadraticCurveTo(x+w*1.04,y,x+w*1.04,y+h*.28);c.lineTo(x+w,y+h);c.closePath();c.fill();
    c.strokeStyle="#7f5555";c.lineWidth=Math.max(1,h*.023);c.beginPath();c.moveTo(x+w*.05,y+h*.19);
    c.quadraticCurveTo(x+w*.13,y-h*.08,x+w*.72,y+h*.032);c.stroke();
  }
  function seatedMap(c,r,w,h,film){
    const scale=Math.min(w*.80/screen.w,h*.68/screen.h);
    const ox=w/2+Math.sin(r.yaw-Math.atan2(-r.x,screen.z-r.z))*scale*.19,oy=h*.463+(screen.y+screen.z*stageTilt)*scale;
    const glow=c.createRadialGradient(w*.5,h*.42,h*.20,w*.5,h*.43,w*.72);
    glow.addColorStop(0,"#57505a");glow.addColorStop(1,"#222630");c.fillStyle=glow;c.fillRect(0,0,w,h);
    const bounds={left:-7.26,right:7.26,top:-8.05,bottom:-.15};
    if(!stagePlate||Math.abs(stagePlate.scale-scale)>.01)stagePlate=bake(true,scale,bounds);
    c.drawImage(stagePlate.canvas,ox+bounds.left*scale-1,oy+bounds.top*scale-1);
    drawStageImage(c,film,ox,oy,scale,stageTilt);
    const lip=oy-.15*scale;
    c.fillStyle="#343139";c.fillRect(0,lip,w,Math.max(0,h-lip));
    const sh=h*.14,sw=sh*1.48;
    for(const s of [-1,1]){
      const x=s<0?w*.5-sw*2.32:w*.5+sw*1.35;
      seatSilhouette(c,x,h-sh*.54,sw,sh,"#533b45");
      seatSilhouette(c,x+s*sw*1.07,h-sh*.60,sw,sh,"#493943");
    }
  }
  function map(c,r,t,hours,film){
    if(!c||!r)return;
    const w=c.canvas.width,h=c.canvas.height,scale=Math.min(w*.91/14.60,h*.95/(planSize.bottom-planSize.top));
    const ox=w*.5,oy=(h-(planSize.bottom-planSize.top)*scale)*.46-planSize.top*scale;
    c.save();c.setTransform(1,0,0,1,0,0);
    if(r.seatBlend<.998){
      if(!streetPlate||streetPlate.width!==w||streetPlate.height!==h)streetPlate=paintStreet(w,h,ox,oy,scale);
      if(!planPlate||Math.abs(planPlate.scale-scale)>.01)planPlate=bake(false,scale,planSize);
      c.drawImage(streetPlate,0,0);
      c.drawImage(planPlate.canvas,ox+planSize.left*scale-1,oy+planSize.top*scale-1);
      drawStageImage(c,film,ox,oy,scale,mapTilt);
      if(r.ada){
        const {x,z}=adaChair;c.save();c.translate(ox+x*scale,oy-(z*mapTilt+floorAt(z))*scale);c.scale(scale,scale);
        c.fillStyle="#666c67";c.fillRect(-.19,-1.09,.38,.41);
        c.fillStyle="#af947a";c.beginPath();c.arc(0,-1.19,.14,0,tau);c.fill();
        c.fillStyle="#aa9e88";c.beginPath();c.arc(0,-1.24,.13,0,tau);c.fill();
        c.fillStyle="#b97964";c.fillRect(-.16,-1.06,.30,.054);
        c.fillStyle="#d5c2a2";c.fillRect(-.15,-.83,.33,.086);c.restore();
      }
      if(r.projectionist)paintProjectionist(c,ox,oy,scale);
      paintPlayer(c,r,ox,oy,scale);
    }
    if(r.seatBlend>.001){
      c.globalAlpha=r.seatBlend<.998?r.seatBlend:1;seatedMap(c,r,w,h,film);
    }
    c.restore();
  }
  window.BayCineRoom={install,create,clear,move,world,map,action,seat,rise,look,camera,points,screen,adaChair};
})();
