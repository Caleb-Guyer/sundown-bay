/* A retired sail, a cast iron sewing machine and an old dressing mirror on Ocean Drive. */
(() => {
  "use strict";
  const turn=-Math.PI/2;
  const P={
    pine:"#997950",edge:"#705d48",warm:"#b89b72",frame:"#42655e",dark:"#334a47",brass:"#b79b65",zinc:"#a7b1a4",
    canvas:"#e4d5ab",flax:"#cbba94",teal:"#427d7a",sea:"#76a9a0",red:"#a85042",coral:"#cd7960",navy:"#394960",
    blue:"#647b96",ochre:"#c59b57",grey:"#788986",chalk:"#f3e5c5",glass:"#8db4ad",silver:"#c8d9c8"
  };
  // Local +Z is the customer side; the road is west of the stall.
  function cable(g,pts,r,color,n=5){for(let i=1;i<pts.length;i++)g.pole(pts[i-1],pts[i],r,color,n);}
  function fill(g,face,points,col){for(let i=1;i<points.length-1;i++)g.tri(face(...points[0]),face(...points[i]),face(...points[i+1]),col);}
  function stroke(g,face,a,b,width,col){
    const dx=b[0]-a[0],dy=b[1]-a[1],r=width*.5/(Math.hypot(dx,dy)||1),u=-dy*r,v=dx*r;
    g.quad(face(a[0]+u,a[1]+v),face(b[0]+u,b[1]+v),face(b[0]-u,b[1]-v),face(a[0]-u,a[1]-v),col);
  }
  const letters={
    A:"04 20 44|13 33",C:"40 10 01 03 14 44",D:"04 00 20 41 43 24 04",E:"40 00 04 44|02 32",
    G:"40 10 01 03 14 44 42 22",H:"00 04|40 44|02 42",I:"10 30|20 24|14 34",
    L:"00 04 44",N:"04 00 44 40",O:"10 30 41 43 34 14 03 01 10",T:"00 40|20 24",
    W:"00 14 22 34 40",X:"00 44|40 04"
  };
  const script={};
  for(const [k,word] of Object.entries(letters))
    script[k]=word.split("|").map(path=>path.split(" ").map(d=>[+d[0]/4,1-(+d[1])/4]));
  function paint(g,face,text,cx,base,size,col){
    const widths=Array.from(text,k=>k===" "?.41:k==="I"?.43:.66);
    let x=cx-size*(widths.reduce((a,b)=>a+b,0)+.24*(text.length-1))*.5;
    for(let i=0;i<text.length;i++){
      const w=widths[i],lift=Math.sin(i*3.8)*.018;
      const pt=([u,v])=>[x+size*(u*w+v*.07),base+(v+lift)*size];
      for(const line of script[text[i]]||[])for(let j=1;j<line.length;j++)
        stroke(g,face,pt(line[j-1]),pt(line[j]),.124*size,col);
      x+=size*(w+.24);
    }
  }
  const front=z=>(u,y)=>[-u,y,z];
  const panels=[-1.55,-.92,-.25,.44,1.05,1.55],depths=[-.78,-.24,.20,.56];
  const cloth=[
    [P.flax,P.canvas,P.canvas,"#e1d0a2","#c9b692"],
    ["#e4d2a8","#f0dfb7",P.canvas,P.sea,"#ded1ac"],
    [P.canvas,"#e1cca3",P.canvas,P.teal,P.sea]
  ];
  const roofY=(x,z)=>2.38-.17*z-.052*Math.cos(x*2.12)+.052*Math.cos(z*3.4);
  function roof(g){
    for(let i=0;i<panels.length-1;i++)for(let j=0;j<depths.length-1;j++){
      const a=panels[i],b=panels[i+1],c=depths[j],d=depths[j+1];
      const v=(x,z)=>[x,roofY(x,z),z];
      g.quad(v(a,c),v(b,c),v(b,d),v(a,d),cloth[j][i]);
    }
    // The former sail's reef stripe runs at an angle across the cloth panels.
    const reef=(x,z)=>[x,roofY(x,z)+.009,z];
    for(let i=1;i<panels.length;i++){
      const a=panels[i-1],b=panels[i],za=-.21+.125*a,zb=-.21+.125*b;
      g.quad(reef(a,za),reef(b,zb),reef(b,zb+.068),reef(a,za+.068),P.red);
      g.quad(reef(a,za-.042),reef(b,zb-.042),reef(b,zb-.026),reef(a,za-.026),P.red);
    }
    // A dark square of denim has been cross-stitched over a rip.
    g.quad(reef(-1.46,-.67),reef(-1.05,-.65),reef(-1.08,-.41),reef(-1.45,-.44),P.navy);
    for(let i=0;i<4;i++)stroke(g,reef,[-1.425+i*.091,-.61],[-1.385+i*.091,-.515],.013,P.flax);
    for(let i=1;i<panels.length;i++){
      const a=panels[i-1],b=panels[i],mid=(a+b)*.5,ya=roofY(a,.56),yb=roofY(b,.56);
      const color=i&1?P.teal:P.sea;
      g.quad([a,ya,.56],[b,yb,.56],[b,yb-.075,.574],[a,ya-.075,.574],color);
      for(const [l,r] of [[a,mid],[mid,b]])g.tri([l,roofY(l,.56)-.072,.574],[r,roofY(r,.56)-.072,.574],[(l+r)*.5,roofY((l+r)*.5,.56)-.151,.568],color);
    }
  }
  function board(g){
    const z=.594;
    for(const x of [-.64,.65])g.pole([x,2.248,.54],[x,2.050,z],.006,P.edge,4);
    g.box(0,1.984,z,1.70,.286,.032,P.edge);
    g.box(0,1.987,z+.017,1.65,.251,.011,P.dark);
    const face=front(z+.024);
    paint(g,face,"LOW TIDE",-.054,1.982,.122,P.chalk);
    paint(g,face,"EXCHANGE",-.049,1.887,.063,P.canvas);
    stroke(g,face,[-.72,1.918],[-.36,1.918],.008,P.coral);
    stroke(g,face,[.312,1.918],[.68,1.918],.008,P.coral);
    for(const x of [-.79,.79])g.pole([x,2.087,z+.017],[x,2.087,z+.030],.015,P.brass,7);
    // South end blade: a pair of scissors visible to drivers arriving from the motel.
    const blade=(u,y)=>[-1.459,y,u];
    g.box(-1.435,1.798,-.014,.033,.37,.435,P.teal);
    for(const [u,y] of [[-.093,1.864],[-.107,1.739]]){
      for(let i=0;i<8;i++){
        const a=i*Math.PI/4,b=a+Math.PI/4;
        stroke(g,blade,[u+.05*Math.cos(a),y+.036*Math.sin(a)],[u+.05*Math.cos(b),y+.036*Math.sin(b)],.011,P.chalk);
      }
    }
    stroke(g,blade,[-.059,1.85],[.146,1.719],.014,P.chalk);
    stroke(g,blade,[-.070,1.75],[.152,1.878],.014,P.chalk);
    for(const z of [-.18,.15])g.pole([-1.427,1.984,z],[-1.427,2.24,z],.008,P.edge,4);
  }
  function frame(g){
    for(const x of [-1.42,1.42]){
      const a=[x,.10,-.61],b=[x,2.48,-.61];
      g.pole(a,b,.031,P.frame,6);
      g.box(x,.055,-.58,.235,.11,.33,P.grey);
      g.box(x,.118,-.61,.113,.023,.111,P.zinc);
      g.pole([x,1.93,-.60],[x,2.271,.46],.019,P.zinc,5);
      g.pole([x,2.48,-.70],[x,2.279,.54],.025,P.edge,6);
      g.pole([x-.044,1.59,-.61],[x+.044,1.59,-.61],.021,P.brass,6);
    }
    g.pole([-1.44,2.47,-.62],[1.44,2.47,-.62],.021,P.frame,6);
    g.pole([-1.46,2.258,.53],[1.46,2.258,.53],.021,P.edge,5);
    const left=-.773,right=.812,z=.38;
    for(const x of [left,right]){
      g.box(x,.105,z,.090,.097,.53,P.frame);
      for(const offset of [-.20,.20])g.pole([x-.031,.064,z+offset],[x+.031,.064,z+offset],.054,P.dark,7);
      g.pole([x,.147,z],[x,1.704,z],.023,P.zinc,6);
      g.cyl(x,1.107,z,.031,.031,.081,7,P.frame);
      g.pole([x,.204,z],[x,.204,z-.20],.017,P.frame,5);
    }
    g.pole([left-.031,1.713,z],[right+.063,1.713,z],.027,P.zinc,6);
    g.pole([left,.310,z],[right,.310,z],.014,P.zinc,5);
    cable(g,[[.318,1.700,z],[.318,1.723,.49],[.318,1.723,.65]],.019,P.frame,6);
    g.box(.318,1.740,.65,.046,.042,.046,P.brass);
  }
  function mirror(g){
    const x=1.119,front=(u,y,d=0)=>[x+u,y,.26-.107*y+d];
    const slab=(w,lo,hi,d,col)=>g.quad(front(-w/2,lo,d),front(w/2,lo,d),front(w/2,hi,d),front(-w/2,hi,d),col);
    slab(.505,.122,1.85,0,P.pine);slab(.457,.160,1.801,.005,P.edge);slab(.426,.181,1.778,.009,P.glass);
    const pane=(u,y)=>front(u,y,.012);
    fill(g,pane,[[-.210,1.756],[-.118,1.756],[.208,1.381],[.208,1.281]],P.silver);
    fill(g,pane,[[-.209,.702],[-.209,.616],[.208,.213],[.208,.264]],"#a7c5b9");
    for(const side of [-1,1]){
      const xx=x+side*.217;
      cable(g,[[xx,.018,.35],[xx,1.32,.135],[xx,.036,-.341]],.020,P.edge,5);
      g.pole([xx,.322,-.26],[xx,.320,.29],.008,P.brass,4);
      g.pole([xx,1.279,.11],[xx,1.279,.15],.025,P.brass,6);
    }
    fill(g,pane,[[-.212,1.749],[-.060,1.749],[-.212,1.621]],P.coral);
    stroke(g,pane,[-.188,1.718],[-.134,1.715],.008,P.chalk);
  }
  function sewingBench(g){
    const x=-1.11;
    for(const dx of [-.232,.233]){
      cable(g,[[x+dx,.006,-.23],[x+dx,.824,.23]],.021,P.frame,5);
      cable(g,[[x+dx,.006,.32],[x+dx,.824,-.16]],.021,P.frame,5);
    }
    g.box(x,.827,.088,.631,.067,.68,P.pine);
    g.box(x,.865,.088,.632,.010,.68,P.warm);
    // Portable cast iron sewing machine: open throat, spool pin, needle bar and flywheel.
    g.box(x,.896,.081,.405,.048,.20,P.dark);
    g.box(x-.125,1.016,.064,.093,.217,.121,P.frame);
    g.box(x-.005,1.120,.066,.300,.063,.117,P.frame);
    g.box(x+.120,1.067,.066,.061,.123,.079,P.frame);
    g.pole([x+.123,1.013,.083],[x+.123,.920,.083],.006,P.zinc,5);
    g.box(x+.122,.920,.086,.022,.007,.033,P.zinc);
    g.pole([x-.215,1.106,.064],[x-.171,1.106,.064],.076,P.edge,10);
    g.pole([x-.222,1.106,.064],[x-.214,1.106,.064],.043,P.zinc,8);
    g.pole([x-.031,1.138,.058],[x-.031,1.219,.058],.005,P.zinc,5);
    g.cyl(x-.031,1.185,.058,.023,.022,.046,8,P.coral);
    g.box(x,.927,.151,.034,.01,.006,P.brass);
    // Measuring tape trails off the wood lip. A chalked pattern waits under the foot.
    const paper=(u,v)=>[x+u,.875,.083+v];
    fill(g,paper,[[.074,.016],[.187,.037],[.205,.138],[.151,.145],[.120,.102],[.067,.09]],P.canvas);
    g.box(x,.875,.356,.556,.009,.038,P.ochre);
    for(let j=0;j<10;j++)g.box(x-.245+j*.053,.881,.348,.005,.005,j%2?.012:.020,P.edge);
    const bale=(x,y,z,w,d,c)=>{g.box(x,y,z,w,.067,d,c);g.box(x,y+.024,z+.008,w-.013,.031,d-.006,c);};
    g.box(x,.241,.075,.531,.038,.498,P.edge);
    bale(x,.296,.058,.379,.321,P.blue);bale(x-.015,.364,.067,.363,.303,P.coral);
  }
  // The photo card leans against the front of Cora's table. On the inclined
  // plane the physical image has exactly the same proportions as the portrait strip.
  const printW=.3375,printH=printW*704/320,tilt=.31;
  const plate=(u,v,d=0)=>[-1.11-u,.49+v*Math.cos(tilt)+d*Math.sin(tilt),.559-v*Math.sin(tilt)+d*Math.cos(tilt)];
  function cardBoard(g){
    const panel=(w,h,d,col)=>g.quad(plate(-w/2,-h/2,d),plate(w/2,-h/2,d),plate(w/2,h/2,d),plate(-w/2,h/2,d),col);
    panel(.438,.852,0,P.edge);panel(.421,.833,.003,P.pine);panel(.374,.788,.006,P.dark);
    panel(printW,printH,.009,P.canvas);
    const paper=(u,v)=>plate(u,v,.012);
    // Before the first customer portrait, three cuttings from the rack serve as a swatch book.
    for(const [n,y,col] of [[0,.174,P.teal],[1,-.009,P.red],[2,-.192,P.ochre]]){
      fill(g,paper,[[-.113,y+.055],[.098,y+.066],[.126,y-.045],[-.105,y-.065]],col);
      for(let j=0;j<3;j++){
        const dx=j*.046-.065;
        stroke(g,paper,[dx,y-.047],[dx+.062,y+.049],.008,n===1?P.flax:P.chalk);
      }
    }
    paint(g,paper,"LOW TIDE",0,.272,.034,P.dark);
    stroke(g,paper,[-.110,-.301],[.074,-.301],.008,P.edge);
    stroke(g,paper,[-.110,-.325],[-.010,-.325],.005,P.edge);
    for(const x of [-1.26,-.96]){
      const a=plate(-1.11-x,.397,.030);
      g.box(x,a[1],a[2],.030,.068,.029,P.warm);
      g.pole([x-.018,a[1],a[2]+.006],[x+.018,a[1],a[2]+.006],.005,P.zinc,4);
    }
  }
  function photoFace(g){
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]]){
      g.vertices.push(...plate((u-.5)*printW,(.5-v)*printH,.022),u,v,0);
    }
  }
  const textures=new WeakMap();
  function print(view,site,canvas,revision){
    if(!canvas?.width||!view.gl||view.lost)return;
    let copy=textures.get(view);
    if(!copy){const image=document.createElement("canvas");image.width=256;image.height=512;
      copy={image,ctx:image.getContext("2d"),serial:0};textures.set(view,copy);}
    if(copy.source!==canvas||copy.revision!==revision){
      copy.ctx.drawImage(canvas,0,0,256,512);copy.source=canvas;copy.revision=revision;copy.serial++;
    }
    view.drawPrint("low-tide-customer-proof",copy.image,copy.serial,site.x,site.y??.075,site.z,turn);
  }
  const styles={
    polo:{body:P.canvas,shade:P.flax,trim:P.teal},jacket:{body:P.red,shade:"#85473e",trim:P.chalk},
    suit:{body:P.navy,shade:"#303f55",trim:P.ochre},overshirt:{body:P.ochre,shade:"#ab804c",trim:P.blue}
  };
  // A sheet hanging from a shoulder is broad across the hanger but thin and folded at the hem.
  function garment(g,x,z,yaw,kind){
    const p=styles[kind],sn=Math.sin(yaw),cs=Math.cos(yaw);
    const at=(u,y,v=0)=>[x+u*cs+v*sn,y,z-u*sn+v*cs];
    cable(g,[[0,1.704,.001],[.015,1.740,.008],[.037,1.727,.011],[.034,1.692,.007],[0,1.655,0]].map(v=>at(...v)),.005,P.zinc,4);
    cable(g,[[-.203,1.543,.001],[-.031,1.635,0],[0,1.65,0],[.204,1.539,.008],[-.203,1.543,.001]].map(v=>at(...v)),.009,P.warm,5);
    const top=1.591,hem=kind==="suit"?1.093:.966,half=kind==="jacket"?.185:.168;
    const rows=[[top,.122,.033],[1.517,.188,.045],[1.351,half+.006,.050],[hem,half,.041]];
    const widths=[-1,-.44,.18,.68,1];
    function surface(y,w,d,u,side){return at(w*u,y+(u===1?-.016:0),side*d*(1-.25*Math.abs(u))+.012*Math.sin(7*u));}
    for(let row=1;row<rows.length;row++){
      const a=rows[row-1],b=rows[row];
      for(let i=1;i<widths.length;i++)for(const side of [-1,1]){
        const l=widths[i-1],r=widths[i];
        g.quad(surface(...a,l,side),surface(...a,r,side),surface(...b,r,side),surface(...b,l,side),i===3?p.shade:p.body,side<0?.86:1);
      }
      for(const u of [-1,1])g.quad(surface(...a,u,1),surface(...a,u,-1),surface(...b,u,-1),surface(...b,u,1),p.shade);
    }
    const face=(u,y)=>at(u,y,.065);
    for(const side of [-1,1]){
      const a=side,short=kind==="polo";
      const sleeve=(u,y,d)=>at(a*u,y,d);
      for(const d of [-.023,.025])g.quad(sleeve(.123,1.589,d),sleeve(.216,1.532,d),sleeve(short?.252:.235,short?1.377:1.119,d),sleeve(short?.180:.175,short?1.391:1.121,d),p.body,d<0?.84:.96);
      g.quad(sleeve(.216,1.532,-.023),sleeve(.216,1.532,.025),sleeve(short?.252:.235,short?1.377:1.119,.025),sleeve(short?.252:.235,short?1.377:1.119,-.023),p.shade);
      fill(g,face,[[a*.020,1.576],[a*.120,1.591],[a*.115,1.535],[a*.062,1.489]],kind==="overshirt"?P.canvas:p.shade);
    }
    if(kind==="polo"){
      for(const y of [1.288,1.234,1.051]){
        stroke(g,face,[-.169,y],[.166,y-.011],y===1.288?.036:.017,p.trim);
      }
    }else if(kind==="jacket"){
      stroke(g,face,[0,1.556],[.008,.973],.010,P.brass);
      for(const side of [-1,1]){
        stroke(g,face,[side*.167,1.386],[side*.035,1.401],.026,P.canvas);
        stroke(g,face,[side*.137,1.068],[side*.095,1.129],.009,p.trim);
      }
      // Lena's race number is sewn over the breast. The check band wraps the left sleeve.
      for(const line of [[[.150,1.480],[.142,1.492],[.142,1.435]],[[.122,1.486],[.096,1.493],[.085,1.481],[.104,1.467]],
        [[.104,1.467],[.088,1.466],[.085,1.448],[.099,1.435],[.124,1.441]]]){
        for(let i=1;i<line.length;i++)stroke(g,face,line[i-1],line[i],.009,P.canvas);
      }
      for(let row=0;row<2;row++)for(let col=0;col<4;col++){
        const u=-.226+.012*col,y=1.434-.015*row;
        g.quad(at(u,y,.029),at(u+.012,y,.029),at(u+.012,y+.015,.029),at(u,y+.015,.029),(row+col)%2?P.navy:P.chalk);
      }
    }else if(kind==="suit"){
      for(const a of [-1,1]){
        g.quad(at(.004*a,1.108,.046),at(.161*a,1.104,.044),at(.151*a,.566,.044),at(.025*a,.557,.034),p.body);
        g.quad(at(.004*a,1.108,-.031),at(.161*a,1.104,-.031),at(.151*a,.566,-.033),at(.025*a,.557,-.033),p.shade);
      }
      stroke(g,face,[-.164,1.198],[.166,1.179],.029,p.trim);
      for(let n=-2;n<=2;n++){const a=n*.42;stroke(g,face,[.081,1.407],[.081+.092*Math.sin(a),1.407+.084*Math.cos(a)],.008,p.trim);}
    }else{
      fill(g,face,[[-.146,1.419],[-.026,1.419],[-.023,1.308],[-.086,1.272],[-.143,1.300]],P.blue);
      for(const y of [1.45,1.31,1.17,1.04])g.quad(face(.003,y),face(.013,y),face(.013,y+.010),face(.003,y+.010),P.chalk);
    }
    g.quad(at(.123,1.522,.069),at(.161,1.514,.069),at(.153,1.457,.070),at(.119,1.464,.070),P.chalk);
  }
  const hanging=[[-.658,.38,-1.07,"overshirt"],[-.492,.38,-1.16,"jacket"],[-.304,.38,-1.10,"polo"],[-.095,.38,-1.10,"suit"],[.113,.38,-1.18,"overshirt"],[.564,.38,-1.38,"polo"],[.733,.38,-1.37,"suit"]];
  function kiosk(g){
    frame(g);roof(g);board(g);mirror(g);sewingBench(g);cardBoard(g);
    for(const row of hanging)garment(g,...row);
  }
  function windowJacket(g){garment(g,0,0,-.105,"jacket");}
  function world(list,model,site,t=0){
    const y=site.y??.075;
    model("low-tide-sewing-stall",kiosk);
    model("low-tide-face-out",windowJacket);
    model("low-tide-customer-proof",photoFace);
    list.push(["low-tide-sewing-stall",site.x,y,site.z,turn]);
    list.push(["low-tide-face-out",site.x-.649,y,site.z+.318,turn+.036*Math.sin(t*.82)+.013*Math.sin(t*2.15)]);
  }
  function blockers(site){
    const b=(along,depth,width,reach,top)=>({x:site.x-depth,z:site.z+along,w:reach,d:width,bottom:0,top,streetProp:true});
    return [b(.012,.394,1.66,.64,1.72),b(-1.11,.088,.64,.69,1.24),b(1.119,.015,.52,.68,1.85),
      b(0,-.608,3.02,.16,2.48)];
  }
  function fillMap(c,pts,color){
    c.fillStyle=color;c.beginPath();c.moveTo(...pts[0]);
    for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);c.closePath();c.fill();
  }
  function rectMap(c,x,z,w,d,col){c.fillStyle=col;c.fillRect(x,z,w,d);}
  function map(c,px,py,s,site,t=0,canvas=null){
    c.save();c.translate(px(site.x),py(site.z));c.scale(s,-s);c.rotate(-turn);
    // Cut the cover away over the face-out rail, much like the interiors in the street atlas.
    rectMap(c,-1.51,-.816,3.09,1.57,"rgba(39,57,52,.27)");
    rectMap(c,-1.443,-.264,.664,.698,P.edge);rectMap(c,-1.418,-.242,.619,.642,P.warm);
    rectMap(c,-1.295,.032,.397,.197,P.frame);rectMap(c,-1.303,.067,.307,.083,P.dark);
    rectMap(c,-1.336,.018,.038,.123,P.grey);rectMap(c,-1.397,.337,.572,.035,P.ochre);
    rectMap(c,.863,-.31,.515,.62,P.edge);rectMap(c,.897,-.272,.444,.514,P.glass);
    fillMap(c,[[.925,-.25],[1.001,-.25],[1.301,.024],[1.301,.099]],P.silver);
    rectMap(c,-.812,.34,1.71,.055,P.zinc);
    const swatch=(x,z,angle,kind)=>{
      c.save();c.translate(x,z);c.rotate(-angle);
      fillMap(c,[[-.232,-.010],[-.141,-.065],[-.094,-.083],[.078,-.079],[.211,-.025],[.236,.018],[.189,.058],[-.163,.061]],styles[kind].body);
      fillMap(c,[[-.132,-.015],[-.020,.028],[.042,-.006],[.092,-.033],[.027,.050],[-.028,.056]],styles[kind].shade);
      rectMap(c,-.18,.025,.044,.021,P.canvas);c.restore();
    };
    for(const row of hanging)swatch(...row);
    swatch(.318,.649,-.105+.036*Math.sin(t*.82),"jacket");
    for(let j=0;j<2;j++)for(let i=0;i<panels.length-1;i++){
      const a=panels[i],b=panels[i+1],z=depths[j],h=j===1?.23:depths[j+1]-z;
      rectMap(c,a,z,b-a,h,cloth[j][i]);
    }
    fillMap(c,[[-1.55,-.414],[1.55,-.026],[1.55,-.089],[-1.55,-.477]],P.red);
    fillMap(c,[[-1.46,-.67],[-1.05,-.65],[-1.08,-.41],[-1.45,-.44]],P.navy);
    for(let i=0;i<4;i++)rectMap(c,-1.41+i*.088,-.599,.021,.062,P.flax);
    rectMap(c,-.837,.016,1.674,.095,P.dark);
    rectMap(c,-.397,.049,.705,.017,P.canvas);rectMap(c,.355,.049,.113,.017,P.coral);
    rectMap(c,-1.33,.417,.44,.292,P.pine);
    if(canvas?.width){
      c.save();c.translate(-.940,.442);c.scale(-1,1);c.drawImage(canvas,0,0,printW,.234);c.restore();
    }else{
      rectMap(c,-1.278,.442,printW,.234,P.canvas);
      for(const [j,col] of [P.teal,P.red,P.ochre].entries())rectMap(c,-1.21,.472+j*.061,.193,.037,col);
    }
    c.restore();
  }
  window.BayThreadsStall=Object.freeze({world,map,print,blockers});
})();
