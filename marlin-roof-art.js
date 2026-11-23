/* The Marlin's upstairs gallery, west linen yard and the little garden above the rooms. */
(() => {
  "use strict";
  const gallery=3.465,roof=12.07,pent=13.835,linen=2.60,ground=.076,tau=2*Math.PI;
  const wing={x:116,z:-35};
  const sea="#527f7b",shade="#3f5f63",sage="#94b39e",foam="#c6ceb2",cream="#ebd8ae",iron="#6c7872";
  const coral="#ae7061",sand="#bf9f7d",sun="#efc88f",timber="#9b8061",wood="#b59a73";
  const chairs=[{x:117.68,z:-18.03,a:1.34,c:"#85ada0"},{x:117.28,z:-16.55,a:1.77,c:"#d9aa80"}];
  const planters=[{x:105.04,z:-49.45,w:1.64,d:.69},{x:107.02,z:-49.46,w:1.40,d:.65},
    {x:106.11,z:-16.14,w:1.32,d:.66}];
  const vents=[{x:104.40,z:-46.72,r:.29,h:.68},{x:105.04,z:-46.76,r:.15,h:.47}];
  const doors=[{z:-48.10,num:21},{z:-42.05,num:22},{z:-24.3,num:23},{z:-16.7,num:24}];
  const towelPlaces=[{x:107.23,z:-48.45,a:0,phase:1},{x:108.40,z:-48.45,a:0,phase:4}];
  const box=(x,z,w,d,bottom,top)=>({x,z,w,d,bottom,top,streetProp:true});
  const annex=box(98.3,-36,4.2,12,0,linen);
  const groundBlocks=[annex,box(130.25,-54.95,1.90,8.30,0,gallery),box(98.3,-43.825,2.40,3.65,0,.8)];
  const blade=box(129.10,-45,2.20,3.70,11.9,18.79);
  const blocks=[annex,blade,box(129.85,-45,.70,3.70,.20,11.91)];
  const camera=[blade,annex,box(131.75,-32,.97,12.30,3.23,gallery)];
  const railing=[[131.285,-50.74,131.285,-38.15],[131.285,-38.15,132.275,-38.15],
    [132.275,-38.15,132.275,-25.85],[132.275,-25.85,131.285,-25.85],
    [131.285,-25.85,131.285,-13.28],[131.285,-13.28,129.60,-13.28]];
  for(const [x,z,xx,zz] of railing)blocks.push(box((x+xx)/2,(z+zz)/2,Math.abs(xx-x)+.052,Math.abs(zz-z)+.052,gallery,gallery+1.02));
  for(const x of [129.345,131.155])for(let i=0;i<5;i++){
    const z=-59.1+(i+.5)*8.3/5,y0=ground+(gallery-ground)*i/5,y1=ground+(gallery-ground)*(i+1)/5;
    blocks.push(box(x,z,.062,8.3/5,y0+.025,y1+1.00));
  }
  for(const z of [-37.765,-36.235])blocks.push(box(100.96,z,1.06,.06,linen+.02,linen+.80));
  const viewRail=[[115.42,-15.03,119.78,-15.03],[119.78,-15.03,119.78,-18.87]];
  for(const [x,z,xx,zz] of viewRail)blocks.push(box((x+xx)/2,(z+zz)/2,Math.abs(xx-x)+.12,Math.abs(zz-z)+.12,pent,pent+.87));
  for(const p of planters)blocks.push(box(p.x,p.z,p.w,p.d,p.z> -25?pent:roof,(p.z> -25?pent:roof)+.52));
  for(const c of chairs)blocks.push(box(c.x,c.z,.84,.67,pent,pent+.84));
  for(const v of vents)blocks.push(box(v.x,v.z,v.r*2,v.r*2,roof,roof+v.h));
  blocks.push(box(97.16,-31.24,.77,.71,linen,linen+.64),box(108.07,-48.45,3.50,.067,roof+1.39,roof+1.62));
  // The access strip beside the original projecting MARLIN name narrows to the outside.
  blocks.push(box(130.01,-32,1.00,10.22,3.15,4.89));
  camera.push(...blocks.filter(b=>b!==blade&&b!==annex&&b.bottom>=roof),box(130.02,-32,1.01,10.22,3.14,4.89));
  const stepAt=z=>ground+(gallery-ground)*Math.max(0,Math.min(1,(z+59.1)/8.3));
  const treadCount=19;
  const top=(g,x,z,w,d,y,c)=>g.quad([x-w/2,y,z-d/2],[x+w/2,y,z-d/2],[x+w/2,y,z+d/2],[x-w/2,y,z+d/2],c);
  function stepRail(g,x,z0,z1,height0,height1){
    const count=Math.ceil((z1-z0)/2.13);
    for(let j=0;j<=count;j++){
      const f=j/count,z=z0+(z1-z0)*f,y=height0+(height1-height0)*f;
      g.box(x,y+.49,z,.059,1.0,.059,sea);
      g.box(x,y+.047,z,.15,.052,.15,iron);
    }
    for(const [h,r,c] of [[1.0,.038,foam],[.49,.023,sea]])
      g.pole([x,height0+h,z0],[x,height1+h,z1],r,c,5);
  }
  function stair(g){
    const x=130.25,left=x-.95,right=x+.95,near=-59.1,far=-50.8,rise=gallery-ground,run=(far-near)/treadCount;
    for(const side of [left+.11,right-.11]){
      g.quad([side-.044,ground-.15,near],[side+.044,ground-.15,near],
        [side+.044,gallery-.15,far],[side-.044,gallery-.15,far],shade);
      g.quad([side+.045,ground-.36,near],[side+.045,ground-.15,near],
        [side+.045,gallery-.15,far],[side+.045,gallery-.36,far],sea);
    }
    for(let i=0;i<treadCount;i++){
      const front=near+i*run,elevation=ground+rise*(i+.72)/treadCount;
      g.box(x,elevation-.039,front+run*.48,1.90,.078,run+.004,i%5===1?"#a1a99c":"#aab0a2");
      g.quad([left,elevation+.003,front],[right,elevation+.003,front],
        [right,elevation+.003,front+.047],[left,elevation+.003,front+.047],i%5===1?"#c8b184":cream);
      if(i%3===1)for(const edge of [-1,1])top(g,x+edge*.70,front+.17,.034,.034,elevation+.005,iron);
    }
    for(const zz of [-56.40,-53.58,-51.12]){
      const h=stepAt(zz)-.28;
      for(const xx of [left+.12,right-.12])g.box(xx,ground+h/2,zz,.112,h,.112,iron);
      g.pole([left+.12,ground+.17,zz],[right-.12,h+.01,zz],.027,shade,4);
    }
    stepRail(g,left+.045,near+.026,far,ground+.045,gallery);
    stepRail(g,right-.045,near+.026,far,ground+.045,gallery);
    // The enamel plate sits on the street side of the first handrail.
    g.box(right,.87,-57.59,.059,.42,1.11,cream);
    g.box(right+.034,.87,-57.59,.014,.33,.99,sea);
    BayCutArt.signText(g,"STAIRS",.035,cream,(u,v)=>[right+.045,.873+v,-57.59+u]);
  }
  function galleryRail(g){
    g.box(131.775,gallery-.102,-32,1.15,.204,12.30,"#88a99a");
    g.box(132.315,gallery-.122,-32,.069,.254,12.30,cream);
    for(const z of [-37.74,-34.95,-31.99,-28.98,-26.23]){
      g.pole([131.16,gallery-.68,z],[132.20,gallery-.13,z],.039,sea,4);
      top(g,131.80,z,.87,.022,gallery+.004,"#908f80");
    }
    for(const [x,z,xx,zz] of railing){
      const length=Math.hypot(xx-x,zz-z),n=Math.ceil(length/2.18);
      for(let i=0;i<n;i++){
        const f=i/n,gx=x+(xx-x)*f,gz=z+(zz-z)*f;
        g.box(gx,gallery+.48,gz,.064,.99,.064,sea);
        g.box(gx,gallery+.058,gz,.12,.088,.12,iron);
      }
      g.pole([x,gallery+1.0,z],[xx,gallery+1.0,zz],.040,foam,5);
      g.pole([x,gallery+.54,z],[xx,gallery+.54,zz],.024,sage,4);
    }
    for(const z of [-47.17,-42.8,-23.5,-15.45])top(g,130.58,z,.64,.40,gallery+.008,"#879d8d");
    for(const z of [-46.5,-44.9,-43.5])top(g,130.735,z,.23,.57,gallery+.009,"#afb49f");
  }
  const digits=["111101101101111","010110010010111","111001111100111","111001111001111","101101111001001"];
  function number(g,n,x,y,z){
    const k=.031,text=String(n);
    for(let i=0;i<text.length;i++){
      const font=digits[Number(text[i])];
      for(let row=0;row<5;row++)for(let col=0;col<3;col++)if(font[row*3+col]==="1"){
        const cy=y+(2-row)*k,cz=z+(-3.0+i*4+col)*k;
        g.quad([x,cy-k*.50,cz-k*.50],[x,cy-k*.50,cz+k*.50],[x,cy+k*.50,cz+k*.50],[x,cy+k*.50,cz-k*.50],cream);
      }
    }
  }
  function galleryDoors(g){
    for(const [i,door] of doors.entries()){
      const z=door.z,x=129.575,base=gallery+.008;
      g.box(x,base+1.05,z,.10,2.10,1.06,cream);
      g.box(x+.057,base+1.035,z,.026,2.05,.939,i&1?"#6f9690":"#739b8d");
      g.box(x+.075,base+1.55,z,.024,.62,.49,shade);
      for(let j=0;j<4;j++)g.box(x+.098,base+1.35+j*.117,z,.037,.036,.431,sage);
      g.box(x+.097,base+.96,z+.346,.040,.218,.055,wood);
      g.box(x+.130,base+.99,z+.323,.079,.049,.077,sun);
      g.box(x+.049,base+1.63,z+.746,.081,.272,.386,sea);
      number(g,door.num,x+.094,base+1.63,z+.747);
      const wz=z-1.27;
      g.box(x+.015,base+1.32,wz,.074,.91,.77,cream);
      g.box(x+.058,base+1.33,wz,.037,.78,.65,"#657c80");
      g.box(x+.086,base+1.51,wz-.155,.024,.40,.29,i===2?"#dbac91":"#d8c9a9");
      g.box(x+.087,base+1.47,wz+.214,.025,.47,.19,"#b3b9a4");
      g.box(x+.105,base+1.33,wz,.026,.83,.031,foam);
      g.box(x+.094,base+1.81,wz,.33,.069,.88,sage);
      if(i<2)g.box(x+.039,base+.018,z,.69,.032,.79,i?"#817e66":"#a58b6e");
      g.box(x+.13,base+2.14,z+.78,.26,.29,.18,iron);
      g.box(x+.205,base+2.12,z+.78,.17,.19,.11,"#d9c397");
    }
  }
  function ladder(g,x,z,base,high,direction){
    const wall=direction<0?129.51:102.49,slip=direction*.10;
    for(const side of [-1,1]){
      const rz=z+side*.335;
      g.box(x,(base+high)/2+.01,rz,.047,high-base+.02,.059,shade);
      g.pole([x,high-.021,rz],[x,high+.72,rz],.033,sea,6);
      g.pole([x,high+.72,rz],[x+direction*.13,high+.865,rz],.033,sea,5);
      g.pole([x+direction*.13,high+.865,rz],[x+direction*.34,high+.865,rz],.033,sage,5);
      g.pole([x+direction*.34,high+.865,rz],[x+direction*.44,high+.749,rz],.033,sea,5);
      g.pole([x+direction*.44,high+.749,rz],[x+direction*.44,high-.10,rz],.033,sea,5);
      g.box(x+direction*.44,high-.089,rz,.114,.068,.118,iron);
      for(let y=base+.48;y<high-.05;y+=1.80){
        g.box((x+wall)/2,y,rz,Math.abs(x-wall),.041,.057,iron);
        g.box(wall-direction*.007,y,rz,.041,.18,.115,"#978d76");
      }
      g.box(x+.012,direction<0?base+1.44:base+1.13,rz,.054,.32,.063,cream);
    }
    for(let i=1;base+i*.30<=high+.006;i++){
      const y=base+i*.30;
      g.pole([x,y,z-.333],[x,y,z+.333],.029,i%7===0?"#aab0a0":iron,5);
      if(i===1||i%10===0)g.pole([x,y+.004,z-.158],[x,y+.004,z+.158],.030,cream,5);
    }
    // Short soles polish the roof edge where the climber changes direction.
    for(const s of [-1,1])top(g,wall+direction*.34, z+s*.175,.32,.078,high+.017,"#b3ada0");
    g.box(x+slip,base+.038,z,.20,.054,.68,"#788d83");
  }
  function annexShell(g){
    g.box(98.30,1.27,-36,4.17,2.52,11.97,"#acb2a0");
    g.box(98.30,.26,-36,4.20,.29,12,"#8e9787");
    g.box(98.30,2.533,-36,4.21,.134,12.01,sage);
    top(g,98.30,-36,4.12,11.91,linen+.003,"#b9b39e");
    for(let i=0;i<7;i++)top(g,96.42+i*.61,-36,.025,11.89,linen+.008,"#a4a38f");
    g.box(96.204,1.03,-39,.04,2.08,.98,cream);
    g.box(96.169,.995,-39,.044,1.985,.855,"#668b80");
    for(let i=0;i<4;i++)g.box(96.144,1.49+i*.096,-39,.044,.035,.49,foam);
    for(const z of [-32.10,-35.05]){
      g.box(96.19,1.49,z,.059,.62,1.55,cream);g.box(96.158,1.49,z,.015,.53,1.44,shade);
      for(let i=0;i<4;i++)g.box(96.143,1.31+i*.113,z,.031,.045,1.41,sage);
    }
    g.box(96.135,1.84,-40.66,.048,.352,1.12,sea);
    BayCutArt.signText(g,"LINEN",.032,cream,(u,v)=>[96.107,1.84+v,-40.66-u]);
    const x=98.3;
    g.box(x,.725,-43.025,2.40,.150,2.05,wood);
    for(const xx of [97.22,99.38])for(const z of [-43.89,-42.17])g.box(xx,.35,z,.13,.70,.13,timber);
    for(let i=0;i<8;i++)top(g,x,-43.91+i*.246,2.36,.017,.802,"#887963");
    for(let i=0;i<4;i++){
      const front=-45.65+i*.40,h=ground+(.8-ground)*(i+.78)/4;
      g.box(x,h*.5,front+.2,2.39,h,.4,i%2?"#aa9271":"#b39a77");
      top(g,x,front+.041,2.39,.047,h+.004,"#cbb790");
    }
    for(const side of [-1,1])g.box(x+side*.41,2.40,-42.013,.42,.046,.028,"#c7ad86");
    g.box(101.475,2.542,-37,2.15,.116,1.60,"#8b9c91");
    for(let i=0;i<9;i++)top(g,100.48+i*.240,-37,.033,1.49,linen+.008,foam);
    for(const s of [-1,1]){
      const z=-37+s*.765;
      g.box(101.02,2.98,z,.052,.76,.052,sea);
      g.pole([100.43,3.37,z],[101.49,3.37,z],.029,sea,5);
      g.pole([100.54,1.95,z],[101.90,2.49,z],.047,iron,4);
    }
    g.box(97.16,2.88,-31.24,.73,.54,.67,"#8e957e");
    for(const y of [2.68,2.93,3.13])g.box(97.16,y,-31.24,.77,.059,.70,foam);
    for(let i=0;i<3;i++)g.box(97.16,3.17+i*.055,-31.20,.64-i*.057,.055,.44+i*.01,i===1?"#d0a78f":"#e1d8b9");
  }
  function foldingChair(g,c){
    const co=Math.cos(c.a),si=Math.sin(c.a);
    const p=(x,y,z)=>[c.x+co*x+si*z,pent+y,c.z-si*x+co*z];
    for(const side of [-1,1]){
      const x=side*.302;
      g.pole(p(x,.035,-.37),p(x,.46,.28),.026,cream,5);
      g.pole(p(x,.035,.39),p(x,.56,-.29),.026,iron,5);
      g.pole(p(x,.36,-.17),p(x,.86,-.39),.026,cream,5);
      g.pole(p(x,.58,-.27),p(x,.58,.21),.029,cream,5);
      g.pole(p(x,.47,.15),p(x,.58,.15),.021,iron,4);
    }
    const cloth=(zA,yA,zB,yB,xL,xR,color)=>g.quad(p(xL,yA,zA),p(xR,yA,zA),p(xR,yB,zB),p(xL,yB,zB),color);
    for(let i=0;i<7;i++){
      const x=-.28+i*.08,k=i%3===1?cream:c.c;
      cloth(-.198,.336,.28,.413,x,x+.081,k);
      cloth(-.196,.345,-.39,.855,x,x+.081,k);
    }
    g.pole(p(-.31,.86,-.385),p(.31,.86,-.385),.025,cream,5);
  }
  function planter(g,p,y){
    g.box(p.x,y+.19,p.z,p.w,.38,p.d,p.x>106.5?"#a78364":"#917c65");
    g.box(p.x,y+.36,p.z,p.w+.041,.076,p.d+.035,wood);
    top(g,p.x,p.z,p.w-.14,p.d-.12,y+.403,"#746653");
    for(const side of [-1,1])g.box(p.x+side*(p.w/2-.14),y+.19,p.z,.065,.35,p.d+.018,iron);
    for(let j=0;j<3;j++){
      const x=p.x+(j-1)*p.w*.265,z=p.z+.075*Math.sin(j+p.x),h=.68+.13*Math.sin(5*j+p.z);
      g.pole([x,y+.40,z],[x+.02,y+h,z-.025],.016,"#688166",4);
      for(let k=0;k<6;k++){
        const a=k*tau/6+j*1.77,dx=.25*Math.sin(a),dz=.25*Math.cos(a);
        const mid=[x+dx*.62,y+h+(k%2?.08:.14),z+dz*.62],tip=[x+dx,y+h-.07,z+dz];
        g.tri([x,y+h-.07,z],[mid[0]+dz*.17,mid[1],mid[2]-dx*.17],tip,k&1?"#739677":"#67896b");
        g.tri([x,y+h-.07,z],tip,[mid[0]-dz*.17,mid[1]-.013,mid[2]+dx*.17],"#839c70");
      }
    }
  }
  function roofDress(g){
    // Old bitumen seams and an actual rubbed approach to the higher deco roof.
    for(const x of [106.05,110.72,115.52,120.19,125.05])
      top(g,x,-41.18,.024,18.85,roof+.008,"#7b898a");
    for(const z of [-48.32,-41.23,-34.75])top(g,115.74,z,24.80,.032,roof+.011,"#7e898a");
    for(const [x,z,w,d] of [[111.73,-28.58,.21,.34],[112.18,-28.65,.18,.22],[111.80,-27.77,.22,.30],[112.18,-27.83,.18,.23]]){
      top(g,x,z,w,d,z< -28.1?roof+.013:pent+.012,"#b1a898");
    }
    for(const [x,y] of [[111.77,12.69],[112.18,12.86]]){
      g.quad([x-.14,y-.025,-27.721],[x+.13,y-.025,-27.721],[x+.11,y+.095,-27.721],[x-.07,y+.068,-27.721],"#c6a298");
      g.box(x,13.69,-28.119,.241,.031,.026,"#ddc5a2");
    }
    for(const p of planters)planter(g,p,p.z> -25?pent:roof);
    for(const v of vents){
      g.box(v.x,roof+.034,v.z,v.r*2.2,.065,v.r*2.2,"#717e7e");
      g.cyl(v.x,roof+v.h*.47,v.z,v.r*.58,v.r*.66,v.h*.86,8,iron);
      g.cyl(v.x,roof+v.h*.91,v.z,v.r*.86,v.r,.13,9,sage);
    }
    for(const c of chairs)foldingChair(g,c);
    for(const [x,z,xx,zz] of viewRail){
      const n=Math.ceil(Math.hypot(xx-x,zz-z)/1.50);
      g.pole([x,pent+.87,z],[xx,pent+.87,zz],.044,foam,6);
      g.pole([x,pent+.43,z],[xx,pent+.43,zz],.023,sage,5);
      for(let i=0;i<=n;i++){
        const qx=x+(xx-x)*i/n,qz=z+(zz-z)*i/n;
        g.box(qx,pent+.43,qz,.06,.84,.06,sea);
        g.box(qx,pent+.048,qz,.18,.092,.18,"#b6b29c");
      }
    }
    // A worn aluminium side table, a chipped cup and a folded racing paper.
    const x=118.22,z=-17.16;
    g.cyl(x,pent+.418,z,.27,.265,.052,12,foam);
    g.cyl(x,pent+.216,z,.035,.035,.40,5,iron);
    g.cyl(x,pent+.027,z,.139,.158,.045,8,iron);
    g.cyl(x+.093,pent+.506,z-.060,.055,.043,.114,8,coral);
    top(g,x-.060,z+.059,.18,.108,pent+.447,cream);
    for(let k=0;k<3;k++)top(g,x-.063,z+.039+k*.021,.102,.005,pent+.451,iron);
    for(const x of [106.34,109.80]){
      g.box(x,roof+.78,-48.45,.068,1.56,.068,iron);
      g.box(x,roof+.052,-48.45,.25,.10,.25,shade);
    }
    g.pole([106.34,roof+1.55,-48.45],[108.09,roof+1.47,-48.45],.014,cream,4);
    g.pole([108.09,roof+1.47,-48.45],[109.80,roof+1.55,-48.45],.014,cream,4);
    const grate=[[122.53,-48.49],[121.48,-49.40]];
    for(const [xx,zz] of grate){
      top(g,xx,zz,.28,.36,roof+.012,"#697775");for(let i=0;i<4;i++)top(g,xx,zz-.12+i*.075,.22,.018,roof+.018,iron);
    }
  }
  function towel(g,col){
    const widths=[-.407,-.23,-.079,.085,.247,.407],depths=[0,.035,-.026,.027,-.015,.017];
    for(let i=1;i<widths.length;i++){
      const point=(k,y)=>[widths[k],y+.02*Math.sin(k+1)*Math.max(0,-y),.036+depths[k]*(-y+.13)-y*.061];
      for(const [upper,lower,ink] of [[0,-.50,col],[-.50,-.55,cream],[-.55,-.59,col],[-.59,-.62,cream],[-.62,-.69,col]])
        g.quad(point(i-1,upper),point(i,upper),point(i,lower),point(i-1,lower),ink);
    }
    for(const x of [-.32,.31])g.box(x,-.004,.023,.041,.073,.051,timber);
  }
  function silhouettes(g){
    g.box(98.3,1.30,-36,4.20,2.60,12,"#a9ae9a");
    g.box(98.3,.398,-43.04,2.40,.796,2.08,wood);
    g.quad([97.1,ground,-45.65],[99.5,ground,-45.65],[99.5,.81,-44.04],[97.1,.81,-44.04],wood);
    g.box(101.475,2.54,-37,2.15,.12,1.60,iron);
    g.quad([129.3,ground,-59.1],[131.2,ground,-59.1],[131.2,gallery,-50.8],[129.3,gallery,-50.8],"#a5ab9b");
    for(const x of [129.36,131.14])g.pole([x,ground+1,-59.1],[x,gallery+1,-50.8],.05,foam,4);
    g.box(131.775,gallery-.10,-32,1.15,.20,12.30,sage);
    for(const [x,z,xx,zz] of railing)g.pole([x,gallery+1,z],[xx,gallery+1,zz],.046,foam,4);
    for(const [x,z,b] of [[130.01,-39.8,gallery],[101.99,-37,linen]]){
      for(const side of [-1,1])g.box(x,(b+roof+.80)/2,z+side*.33,.060,roof+.80-b,.064,iron);
      for(let h=b+.30;h<roof;h+=.6)g.box(x,h,z,.045,.047,.67,iron);
    }
    for(const p of planters){const y=p.z> -25?pent:roof;g.box(p.x,y+.19,p.z,p.w,.38,p.d,wood);}
  }
  // A pair of mourning doves move between the laundry line and the high coping.
  const rails=[
    [[106.34,roof+1.565,-48.45],[106.32,pent+.034,-15.07]],
    [[108.86,roof+1.529,-48.45],[107.23,pent+.034,-15.08]]
  ];
  function dovePose(id,t){
    const time=(t+id*18.1)%61,s=rails[id],out=time>=18&&time<43,returning=time>=43;
    const start=returning?s[1]:s[0],end=returning?s[0]:s[1];
    const f=Math.max(0,Math.min(1,returning?(time-43)/4.03:(time-18)/4.03));
    const flight=f>0&&f<1,arc=flight?Math.sin(Math.PI*f):0;
    const x=start[0]+(end[0]-start[0])*f+(id?-2.7:2.6)*arc;
    const z=start[2]+(end[2]-start[2])*f;
    const y=start[1]+(end[1]-start[1])*f+3.7*arc;
    const yaw=flight?Math.atan2(end[0]-start[0]+Math.cos(Math.PI*f)*Math.PI*(id?-2.7:2.6),end[2]-start[2]):
      (out?.92:-1.04)+id*.39+.13*Math.sin(time*.73+id);
    return {x,z,y,yaw,flight,pitch:flight?-.13*Math.cos(Math.PI*f):0,flap:flight?.54*Math.sin(t*17.7+id):0};
  }
  function birdBody(g,fold){
    const rings=[[0,.092,-.143,.028,.026],[0,.113,-.074,.059,.052],[0,.138,.023,.054,.061],
      [0,.193,.071,.038,.040],[0,.196,.097,.018,.026]];
    const pt=(r,a)=>[r[0]+r[3]*Math.cos(a),r[1]+r[4]*Math.sin(a),r[2]];
    for(let j=1;j<rings.length;j++)for(let k=0;k<7;k++){
      const a=k*tau/7,b=(k+1)*tau/7;
      g.quad(pt(rings[j-1],a),pt(rings[j],a),pt(rings[j],b),pt(rings[j-1],b),k<3?"#a59b84":"#c2ae92");
    }
    g.tri([-.035,.101,-.099],[.038,.097,-.102],[.021,.071,-.232],"#726f68");
    g.tri([-.035,.101,-.099],[.021,.071,-.232],[-.014,.069,-.238],"#a69c89");
    g.tri([0,.207,.091],[.016,.183,.092],[0,.181,.143],"#665e57");
    g.tri([0,.207,.091],[0,.181,.143],[-.016,.183,.092],"#797261");
    for(const s of [-1,1]){
      g.tri([s*.035,.205,.068],[s*.033,.197,.085],[s*.038,.195,.069],"#403e3a");
      if(fold){
        g.tri([s*.037,.154,.040],[s*.061,.125,-.039],[s*.035,.078,-.163],"#908d80");
        g.tri([s*.040,.144,.02],[s*.043,.115,-.090],[s*.035,.081,-.162],"#aaa58e");
        g.pole([s*.019,.077,-.003],[s*.022,.011,-.017],.004,"#aa8371",4);
        g.pole([s*.022,.011,-.017],[s*.028,.006,.015],.003,"#9d7c68",4);
      }
    }
  }
  function wingFeathers(g,s){
    const a=[s*.026,0,.044],b=[s*.071,-.015,-.065],elbow=[s*.155,.030,.027],tip=[s*.316,.018,-.089];
    g.tri(a,elbow,b,"#a19883");g.tri(elbow,tip,[s*.202,.006,-.088],"#928d7f");
    g.tri(b,elbow,[s*.202,.006,-.088],"#b0a38b");g.tri(b,[s*.201,.006,-.087],[s*.145,-.008,-.102],"#9a9282");
    g.tri(elbow,[s*.305,.018,-.082],[s*.237,.012,-.074],"#bfb59e");
  }
  function install(model){
    model("marlin-upper-stair",g=>{stair(g);galleryRail(g);galleryDoors(g);ladder(g,130.01,-39.8,gallery,roof,-1);});
    model("marlin-linen-yard",g=>{annexShell(g);ladder(g,101.99,-37,linen,roof,1);});
    model("marlin-upper-garden",roofDress);model("marlin-upper-distant",silhouettes);
    model("marlin-linen-striped",g=>towel(g,"#a6bcad"));model("marlin-linen-coral",g=>towel(g,"#c28777"));
    model("marlin-dove",g=>birdBody(g,true));model("marlin-dove-air",g=>birdBody(g,false));
    model("marlin-dove-left",g=>wingFeathers(g,-1));model("marlin-dove-right",g=>wingFeathers(g,1));
    model("marlin-gallery-lamps",g=>{
      for(const {z} of doors)g.box(129.79,gallery+2.125,z+.78,.168,.166,.094,"#ffe5a1");
      g.box(129.716,gallery+1.371,-25.57,.018,.63,.43,"#e7ba83");
    });
  }
  function world(view,see,t,hours){
    if(!see(wing,115))return;
    if(!see(wing,62)){view.draw("marlin-upper-distant");return;}
    view.draw("marlin-upper-stair");view.draw("marlin-linen-yard");view.draw("marlin-upper-garden");
    if(hours?.night>.17)view.draw("marlin-gallery-lamps");
    if(see(wing,45))for(const [i,p] of towelPlaces.entries()){
      const wind=.069*Math.sin(t*(1.16+.07*i)+p.phase)+.036*Math.cos(t*2.03+p.phase*2);
      view.draw(i?"marlin-linen-coral":"marlin-linen-striped",p.x,roof+1.505,p.z,p.a,wind*(1+(hours?.wet||0)*.31),.013*Math.sin(t*.83+p.phase));
    }
    for(let i=0;i<rails.length;i++){
      const b=dovePose(i,t);if(!see(b,36))continue;
      view.draw(b.flight?"marlin-dove-air":"marlin-dove",b.x,b.y,b.z,b.yaw,b.pitch);
      if(b.flight)for(const side of [-1,1])
        view.draw(side<0?"marlin-dove-left":"marlin-dove-right",b.x,b.y+.132,b.z,b.yaw,b.pitch,side*b.flap);
    }
  }
  function map(c,opt,px,py,scale,visible){
    if(!visible(px(wing.x),py(wing.z),33*scale))return;
    const street=opt.mode==="street",fine=street&&scale>3;
    c.save();c.translate(px(wing.x),py(wing.z));c.scale(scale,-scale);c.translate(-wing.x,-wing.z);
    c.lineJoin="round";c.lineCap="round";
    const rect=(x,z,w,d,ink)=>{c.fillStyle=ink;c.fillRect(x,z,w,d);};
    const line=(points,w,ink)=>{c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.lineWidth=w;c.strokeStyle=ink;c.stroke();};
    const polygon=(points,ink)=>{c.beginPath();c.moveTo(...points[0]);for(const p of points.slice(1))c.lineTo(...p);c.closePath();c.fillStyle=ink;c.fill();};
    rect(102.24,-51.76,27.52,39.52,street?"#a8a99a":"#a3aa90");
    rect(102.85,-51.15,26.30,38.30,street?"#99a3a0":"#8d9a8c");
    rect(104.93,-28.1,15.12,13.26,street?"#bdbaa5":"#afb298");
    if(street){
      line([[104.99,-28.05],[104.99,-14.91],[119.97,-14.91]],.19,"#d4ceb2");
      line([[104.99,-28.05],[120.02,-28.05],[120.02,-14.91]],.17,"#889689");
    }
    rect(96.18,-42.0,4.23,12.0,street?sage:"#a7ac90");
    rect(96.28,-41.88,4.01,11.77,street?"#b4ae98":"#939e87");
    rect(97.10,-45.65,2.40,3.65,wood);rect(100.4,-37.8,2.15,1.60,iron);
    rect(129.30,-59.10,1.90,8.34,street?"#a8aea1":"#b6b496");
    rect(129.08,-50.80,2.28,37.6,"#9bac98");rect(131.20,-38.15,1.15,12.30,"#9bac98");
    for(const [x,z,xx,zz] of railing)line([[x,z],[xx,zz]],fine?.12:.19,cream);
    for(const x of [129.33,131.16])line([[x,-59.06],[x,-50.82]],.12,foam);
    const every=fine?1:3;
    for(let i=0;i<treadCount;i+=every)line([[129.38,-59.1+i*8.3/treadCount],[131.1,-59.1+i*8.3/treadCount]],fine?.064:.19,cream);
    for(let k=0;k<4;k++)line([[97.12,-45.61+k*.4],[99.47,-45.61+k*.4]],fine?.052:.16,cream);
    for(const [x,z,x2] of [[130.0,-39.80,128.64],[101.99,-37.00,103.43]]){
      const nearX=x2>x?x-.18:x+.18;
      for(const side of [-1,1])line([[nearX,z+side*.33],[x2,z+side*.33]],.097,shade);
      for(let i=1;i<=3;i++){const xx=nearX+(x2-nearX)*i/3.5;line([[xx,z-.32],[xx,z+.32]],.083,cream);}
    }
    if(street){
      // The Marlin's actual roof outline replaces the atlas's generic rooftop grille.
      for(const x of [106.05,110.72,115.52,120.19,125.05])line([[x,-50.50],[x,-31.23]],.043,"#8a9693");
      for(const z of [-48.32,-41.23,-34.75])line([[103.28,z],[128.17,z]],.045,"#8a9693");
      for(const z of [-48.1,-42.05,-24.3,-16.70])rect(129.60,z-.51,.72,.93,"#838e7d");
      for(const p of planters){
        rect(p.x-p.w/2,p.z-p.d/2,p.w,p.d,wood);rect(p.x-p.w/2+.11,p.z-p.d/2+.11,p.w-.22,p.d-.22,"#819978");
        if(fine)for(let i=0;i<3;i++){const xx=p.x+(i-1)*p.w*.26;polygon([[xx-.22,p.z-.08],[xx+.08,p.z-.25],[xx+.22,p.z+.14],[xx-.08,p.z+.19]],i===1?"#779074":"#a3ab80");}
      }
      for(const v of vents){
        rect(v.x-v.r,v.z-v.r,v.r*2,v.r*2,"#7c8882");c.beginPath();c.arc(v.x,v.z,v.r*.8,0,tau);c.fillStyle=sage;c.fill();
      }
      line([[106.34,-48.45],[109.8,-48.45]],.051,cream);
      for(const [i,p] of towelPlaces.entries())rect(p.x-.39,p.z-.13,.78,.19,i?"#cb9d88":"#b7c5ac");
      rect(96.78,-31.59,.76,.70,"#e1d5b5");
      for(const ch of chairs){
        c.save();c.translate(ch.x,ch.z);c.rotate(-ch.a);rect(-.33,-.42,.66,.83,cream);
        for(let j=0;j<3;j++)rect(-.25+j*.196,-.37,.109,.71,ch.c);
        line([[-.34,-.25],[.34,-.25]],.045,"#877b67");c.restore();
      }
      for(const [x,z,xx,zz] of viewRail)line([[x,z],[xx,zz]],.105,foam);
      c.beginPath();c.arc(118.22,-17.16,.27,0,tau);c.fillStyle=cream;c.fill();
      if(fine){
        for(let i=0;i<7;i++)line([[96.42+i*.61,-41.86],[96.42+i*.61,-30.12]],.029,"#999e87");
        for(let k=0;k<9;k++)line([[100.48+k*.24,-37.73],[100.48+k*.24,-36.27]],.04,foam);
        for(const z of [-28.47,-27.80])rect(111.70,z-.11,.65,.20,"#c6b19a");
        for(let i=0;i<rails.length;i++){
          const bird=dovePose(i,opt.time??opt.elapsed??0);
          c.save();c.translate(bird.x,bird.z);c.rotate(-bird.yaw);
          polygon([[-.051,-.071],[-.019,-.205],[.039,-.15],[.061,.055],[.018,.11],[-.025,.093]],"#968e7c");
          if(bird.flight)polygon([[-.29,-.09],[-.14,.038],[.13,.035],[.29,-.09],[0,-.04]],"#b2a894");
          c.restore();
        }
      }
    }
    c.restore();
  }
  window.BayMarlinRoofArt={install,world,map,blocks,camera,groundBlocks};
})();
