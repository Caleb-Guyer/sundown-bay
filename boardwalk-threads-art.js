/* Clothes cut for the existing two street rigs. The shop mirror uses the same vertices. */
(() => {
  "use strict";
  const tau=2*Math.PI;
  const fabrics={
    roadcrew:{shirt:"#df8348",edge:"#576f70",pants:"#485968",thread:"#e8e2bb",light:"#ebe9cd",shoe:"#635546"},
    tideline:{shirt:"#ead8ad",edge:"#cbbb96",pants:"#68837f",thread:"#2c7776",light:"#ead6a5",shoe:"#ded4b7"},
    pitlane:{shirt:"#984b49",edge:"#713c40",pants:"#424e64",thread:"#f0dbb2",light:"#d2a877",shoe:"#635151"},
    marquee:{shirt:"#514e79",edge:"#3c3b61",pants:"#514e79",thread:"#e9b76d",light:"#dc8f79",shoe:"#483e4d"},
    netter:{shirt:"#c99a4d",edge:"#987539",pants:"#456c79",thread:"#e4cca3",light:"#8aafad",shoe:"#73624b"}
  };
  const colors=Object.fromEntries(Object.entries(fabrics).map(([id,f])=>[id,f.shirt]));
  const shaded=new Map();
  function tint(hex,value){
    const key=hex+value;if(shaded.has(key))return shaded.get(key);
    const col="#"+[1,3,5].map(i=>Math.min(255,Math.round(parseInt(hex.slice(i,i+2),16)*value)).toString(16).padStart(2,"0")).join("");
    shaded.set(key,col);return col;
  }
  // Flatten the front and back panels so printed and sewn details lie on the cloth.
  const around=[[-.67,1],[.67,1],[1,.49],[1,-.52],[.68,-1],[-.68,-1],[-1,-.52],[-1,.49]];
  const ring=(y,w,d,x=0,z=0)=>around.map(([u,v])=>[x+w*u,y,z+d*v]);
  function facets(g,bottom,top,col){
    for(let i=0;i<8;i++){const n=(i+1)%8;
      g.quad(bottom[i],bottom[n],top[n],top[i],typeof col==="string"?col:col(i),[1,.96,.84,.87,1,.93,.85,.97][i]);}
  }
  function cap(g,row,col){for(let i=1;i<row.length-1;i++)g.tri(row[0],row[i],row[i+1],col);}
  const shirtDepth=.133;
  function panelPoint(face,x,y,layer){return [face*x,y,face*(shirtDepth+layer)];}
  function panel(g,face,pts,col,layer=.002){
    const row=pts.map(([x,y])=>panelPoint(face,x,y,layer));cap(g,row,col);
  }
  function stitch(g,face,pts,width,col,layer=.004){
    for(let i=1;i<pts.length;i++){
      const [x,y]=pts[i-1],[u,v]=pts[i],k=width*.5/(Math.hypot(u-x,v-y)||1),dx=(y-v)*k,dy=(u-x)*k;
      panel(g,face,[[x+dx,y+dy],[u+dx,v+dy],[u-dx,v-dy],[x-dx,y-dy]],col,layer);
    }
  }
  function label(g,face,x,y,w,h,col,layer=.003){panel(g,face,[[x,y],[x+w,y],[x+w,y+h],[x,y+h]],col,layer);}
  function thirteen(g,face,x,y,k,col){
    for(const path of [[[0,.77],[.29,1],[.29,0]],[[.03,0],[.52,0]],[[.70,.96],[1.18,.96],[1.26,.81],[1.14,.57],[.89,.50],[1.17,.48],[1.29,.32],[1.25,.13],[1.14,.04],[.68,.04]]]){
      stitch(g,face,path.map(([u,v])=>[x-u*k,y+v*k]),k*.125,col,.009);
    }
  }
  function sunburst(g,face,x,y,k,f){
    for(let i=0;i<9;i++){
      const a=i*Math.PI/8,dx=Math.cos(a),dy=Math.sin(a),len=i%2?.89:1;
      stitch(g,face,[[x+k*.32*dx,y+k*.32*dy],[x+k*len*dx,y+k*len*dy]],k*.048,i%2?f.light:f.thread,.007);
    }
    const arc=[[x-k*.21,y]];for(let i=0;i<=10;i++)arc.push([x+k*.22*Math.cos(Math.PI-i*Math.PI/10),y+k*.22*Math.sin(i*Math.PI/10)]);
    panel(g,face,arc,f.thread,.006);
    for(let i=0;i<3;i++)label(g,face,x-k*(.63-.11*i),y-k*(.075+i*.085),k*(1.26-.22*i),k*.033,i===1?f.light:f.thread,.006);
  }
  function pocket(g,face,side,y,f,flap){
    const q=(x,h)=>[side*x,y+h];
    panel(g,face,[q(.047,.016),q(.125,.019),q(.119,-.047),q(.082,-.063),q(.048,-.048)],f.edge,.003);
    stitch(g,face,[q(.052,-.042),q(.083,-.055),q(.112,-.042)],.0033,f.light,.006);
    if(flap){panel(g,face,[q(.042,.022),q(.130,.024),q(.124,.002),q(.083,-.014),q(.042,.002)],tint(f.shirt,1.07),.006);
      label(g,face,side*.084-.004,y-.003,.008,.008,f.thread,.008);}
  }
  function torso(g,id,f){
    const jacket=id==="pitlane"||id==="netter",hem=id==="netter"?.914:id==="pitlane"?.967:.977;
    const width=y=>y<1.05?(id==="pitlane"?.164:id==="netter"?.185:.166):y<1.24?.180:.202;
    const rows=[hem,hem+.033,1.076,1.112,1.143,1.161,1.181,1.210,1.229,1.253,1.312,1.395,1.421];
    const rings=rows.map(y=>ring(y,width(y),shirtDepth));
    for(let i=1;i<rows.length;i++){
      let col=f.shirt;
      if(id==="tideline"){if([5,7,9].includes(i))col=i===7?f.thread:"#7aa398";else if(i===1)col=f.edge;}
      if(id==="pitlane"&&(i===1||i===11))col=i===1?f.edge:"#be7363";
      if(id==="marquee"&&i===2)col=f.edge;
      if(id==="roadcrew"&&(i===3||i===7))col=f.thread;
      facets(g,rings[i-1],rings[i],col);
    }
    const collar=ring(1.448,.097,.086);facets(g,rings.at(-1),collar,f.shirt);cap(g,collar,f.edge);
    if(id!=="marquee"){
      for(const side of [-1,1]){
        const a=side;
        panel(g,1,[[a*.025,1.426],[a*.095,1.418],[a*.117,1.382],[a*.063,1.344],[a*.042,1.388]],jacket?f.edge:f.thread,.005);
        stitch(g,1,[[a*.117,1.379],[a*.064,1.344],[a*.045,1.385]],.0035,jacket?f.light:"#b7cdc0",.007);
      }
    }
    if(id==="tideline"){
      label(g,1,-.011,1.323,.022,.101,"#d0bd91");
      for(const y of [1.341,1.380])label(g,1,-.003,y,.006,.006,"#876e56",.005);
      pocket(g,1,1,1.291,f,false);
      // Hand-stitched gull over the breast pocket and a tiny laundry tab at the side seam.
      stitch(g,1,[[.063,1.278],[.082,1.267],[.107,1.284]],.0045,f.thread,.006);
      label(g,-1,.088,1.003,.032,.015,"#b7775b");
    }else if(id==="pitlane"){
      stitch(g,1,[[0,.999],[.008,1.372],[.028,1.416]],.011,"#d2b38c");
      label(g,1,.008,1.336,.010,.030,"#dfbf83",.007);
      for(const s of [-1,1]){stitch(g,1,[[s*.089,1.093],[s*.132,1.137]],.010,f.edge);stitch(g,-1,[[s*.130,1.366],[s*.070,1.330],[0,1.330]],.005,f.thread);}
      thirteen(g,1,.108,1.249,.055,f.thread);thirteen(g,-1,.094,1.106,.140,f.thread);
      label(g,-1,-.065,1.078,.131,.007,f.light);label(g,1,-.121,1.273,.059,.020,f.thread);label(g,1,-.113,1.279,.043,.005,f.edge,.006);
    }else if(id==="marquee"){
      for(const s of [-1,1]){stitch(g,1,[[s*.094,1.422],[s*.057,1.377],[0,1.311]],.008,f.light);stitch(g,-1,[[s*.115,1.414],[s*.086,1.385],[0,1.359]],.0045,f.thread);}
      stitch(g,1,[[.005,1.308],[.015,1.124],[.013,1.065]],.0039,"#a693a5");
      sunburst(g,1,.079,1.271,.047,f);sunburst(g,-1,0,1.176,.115,f);
      const band0=ring(1.018,.175,.137),band1=ring(1.049,.175,.137);
      facets(g,band0,band1,"#aa7069");label(g,1,-.025,1.019,.050,.032,f.thread,.008);
      label(g,1,-.016,1.026,.032,.017,f.edge,.010);
    }else if(id==="roadcrew"){
      for(const face of [-1,1])for(const side of [-1,1])
        stitch(g,face,[[side*.132,1.397],[side*.102,1.294],[side*.083,1.18]],.025,f.thread,.008);
      label(g,1,-.15,1.245,.066,.04,f.edge,.009);
      label(g,1,-.144,1.26,.05,.008,f.thread,.011);
    }else{
      // The bib and its straps sit over an open, rolled-sleeve fishing shirt.
      panel(g,1,[[-.119,.918],[.119,.918],[.111,1.095],[.089,1.276],[-.089,1.276],[-.111,1.095]],f.pants,.004);
      panel(g,-1,[[-.12,.921],[.12,.921],[.101,1.12],[0,1.202],[-.101,1.12]],f.pants,.004);
      for(const s of [-1,1]){
        stitch(g,1,[[s*.071,1.267],[s*.115,1.42]],.033,f.pants,.006);
        stitch(g,-1,[[s*.060,1.133],[-s*.106,1.422]],.030,f.pants,.006);
        label(g,1,s*.079-.011,1.257,.022,.014,f.thread,.008);
        stitch(g,1,[[s*.104,1.029],[s*.091,1.176]],.0034,f.light,.007);
      }
      panel(g,1,[[-.058,1.232],[.058,1.232],[.051,1.159],[0,1.149],[-.054,1.159]],"#537986",.007);
      stitch(g,1,[[-.052,1.219],[.050,1.219]],.0036,f.thread,.009);
      label(g,1,.021,1.195,.024,.017,"#cb7f57",.010);
      panel(g,-1,[[-.06,1.308],[.044,1.308],[.048,1.281],[.010,1.268],[-.061,1.279]],f.edge,.008);
    }
  }
  function sleeve(g,s,id,f){
    const low={tideline:1.249,pitlane:1.045,marquee:1.088,netter:1.177,roadcrew:1.20}[id],radius={tideline:.080,pitlane:.086,marquee:.068,netter:.084,roadcrew:.083}[id];
    const x=y=>s*(y<1.185?.245:(.25-.045*(y-1.185)/.23));
    const at=(y,r)=>ring(y,r,r*.99,x(y),y<1.185?(1.185-y)*.215:0);
    let cuff=id==="marquee"?f.light:id==="tideline"?f.thread:f.edge;
    const layers=[[low,radius*.72],[low+.016,radius*.84],[low+.045,radius*.91],[1.295,radius*.98],[1.347,radius],[1.404,radius*.95]];
    for(let i=1;i<layers.length;i++){
      const [y,r]=layers[i],[below,br]=layers[i-1];facets(g,at(below,br),at(y,r),id==="roadcrew"?f.edge:i===1?cuff:i===2&&id==="netter"?"#deb374":f.shirt);
    }
    cap(g,at(1.404,radius*.95),f.shirt);
    if(id==="pitlane"){
      const band=ring(1.325,radius*1.03,radius*1.03,x(1.325),0);
      for(let j=0;j<2;j++){
        const aa=j?band:at(1.301,radius*1.03),bb=j?at(1.348,radius*1.035):band;
        facets(g,aa,bb,i=>(i+j)%2?"#624144":f.thread);
      }
    }
    if(id==="netter"&&s===-1){
      g.box(-.292,1.302,0,.014,.083,.081,"#586f66");g.box(-.301,1.305,0,.007,.054,.055,f.thread);
      g.box(-.306,1.310,.001,.005,.012,.042,"#65908b");
    }
  }
  function footwear(g,s,id,f){
    const x=s*.111,dress=id==="marquee",boot=id==="netter",trainer=id==="pitlane";
    const outline=[[-.052,-.087],[.051,-.087],[.065,-.055],[.067,.070],[.048,.149],
      [.022,.166],[-.028,.167],[-.052,.148],[-.068,.070],[-.064,-.055]];
    const foot=(u,v,y)=>[x+u*(dress?.92:boot?1.06:1),y,v];
    const row=(h,w,d)=>outline.map(([u,v])=>foot(u*w,v*d,typeof h==="number"?h:h(v)));
    const low=row(.016,1,1),sole=row(dress?.033:boot?.049:.044,1,1),welt=row(dress?.037:boot?.054:.050,.985,.993);
    const top=row(v=>.151-.062*Math.max(0,(v+.014)/.179),.88,.96);
    const edge=boot?"#52483f":trainer?"#c19368":dress?"#a88165":"#baab89";
    for(let i=0;i<outline.length;i++){
      const n=(i+1)%outline.length;g.quad(low[i],low[n],sole[n],sole[i],edge);
      g.quad(sole[i],sole[n],welt[n],welt[i],dress?edge:boot?"#9f815f":"#d7cdad");
      g.quad(welt[i],welt[n],top[n],top[i],i===0?tint(f.shoe,.76):f.shoe,i<4?.91:1);
    }
    cap(g,top,f.shoe);
    const spot=(u,v)=>foot(u,v,.155-.063*Math.max(0,(v+.014)/.179));
    if(dress){g.quad(spot(-.048,.025),spot(.045,.025),spot(.042,.045),spot(-.044,.045),"#a68167");}
    else if(boot||trainer){
      for(const z of [.008,.031,.053])g.quad(spot(-.039,z+.006),spot(.040,z),spot(.040,z+.008),spot(-.039,z+.014),boot?"#c9b38b":"#dfc9a6");
      if(boot)g.quad(spot(-.052,.070),spot(-.044,.125),spot(.043,.125),spot(.051,.068),"#886e50");
      if(trainer)g.quad(foot(s*.064,.015,.119),foot(s*.065,.032,.109),foot(s*.066,.084,.072),foot(s*.066,.061,.073),f.shirt);
    }else{
      for(let i=0;i<5;i++){const z=.061+i*.011;g.quad(spot(-.045,z),spot(.042,z+.003),spot(.043,z+.005),spot(-.045,z+.002),"#c6bb98");}
    }
  }
  function trousers(g,s,id,f){
    const cut=id==="marquee"?[.069,.086,.084,.090]:id==="netter"?[.074,.085,.088,.102]:[.060,.071,.082,.095];
    const form=[[.168,cut[0],.068],[.204,cut[0]+.004,.070],[.235,cut[0],.071],[.547,cut[1],.083],[.695,cut[2],.090],[.962,cut[3],.100]];
    const rows=form.map(([y,w,d])=>ring(y,w,d,s*(y>.69?.101:.109),y<.24?.001:.008));
    for(let i=1;i<rows.length;i++)facets(g,rows[i-1],rows[i],i===1?tint(f.pants,1.09):f.pants);
    if(id==="marquee"||id==="pitlane"){
      for(let i=1;i<rows.length;i++){
        const p=rows[i-1],q=rows[i],k=s===1?2:6;
        const strip=v=>[v[k][0]+s*.0007,v[k][1],v[k][2]],a=strip(p),b=strip(q);
        g.quad(a,b,[b[0],b[1],b[2]-.005],[a[0],a[1],a[2]-.005],id==="marquee"?f.light:"#927c6b");
      }
    }else if(id==="netter"){
      const xx=s*.109;g.quad([xx-.059,.481,.097],[xx+.061,.481,.097],[xx+.064,.603,.099],[xx-.064,.603,.099],"#527985");
      g.box(xx,.594,.100,.110,.005,.002,"#8ba4a0");
    }
    footwear(g,s,id,f);
  }
  function dress(mesh,id,lead="guest"){
    if(!mesh||!fabrics[id]||mesh.threadOutfit===id&&mesh.threadLead===lead)return mesh;
    const frank=lead==="frankie",f=fabrics[id],skin=frank?BayScoutArt.colors[0]:"#af7353";
    if(frank&&!mesh.scoutDressed)BayScoutArt.dress(mesh);
    const base=new BayMesh(),parts=[];
    buildBayPerson(base,skin,f.shirt,f.pants,0,"runner",0,(part,side)=>parts.push({part,side,at:base.vertices.length}));
    const all=new BayMesh(),groups=[],mark=(part,side=1)=>groups.push({part,side,at:all.vertices.length/6});
    for(let n=0;n<parts.length;n++){
      const {part,side,at}=parts[n];if(part!=="leg"&&part!=="arm")continue;
      mark(part,side);const end=parts[n+1]?.at??base.vertices.length,src=base.vertices;
      if(part==="arm")for(let i=at;i<end;i+=18){
        if(Math.min(src[i+1],src[i+7],src[i+13])>1.255)continue;
        for(let k=i;k<i+18;k++)all.vertices.push(src[k]);
      }
      if(part==="arm")sleeve(all,side,id,f);else trousers(all,side,id,f);
    }
    mark("body");torso(all,id,f);all.cyl(0,1.487,0,.053,.059,.139,9,skin);
    mark("head");
    const original=mesh.rest;
    for(let i=0;i<mesh.bindings.length;i+=3){
      if(![i,i+1,i+2].every(k=>mesh.bindings[k].a===mesh.head.m&&mesh.bindings[k].b===mesh.head.m))continue;
      for(let j=i*6;j<(i+3)*6;j++)all.vertices.push(original[j]);
    }
    const bindings=[];
    for(let i=0;i<groups.length;i++){
      const p=groups[i],end=groups[i+1]?.at??all.vertices.length/6;
      for(let v=p.at;v<end;v++)bindings.push(mesh.binding(p.part,mesh.sides[p.side===1?1:0],all.vertices[v*6+1]));
    }
    mesh.rest=new Float32Array(all.vertices);mesh.vertices=mesh.rest.slice();mesh.bindings=bindings;
    mesh.threadOutfit=id;mesh.threadLead=lead;mesh.lastRevision=-1;return mesh;
  }

  const mirrors=new Map();
  function mirrorModel(id,lead){
    const key=lead+"/"+id;if(mirrors.has(key))return mirrors.get(key);
    const frank=lead==="frankie",mesh=new BayPlayerMesh(frank?BayScoutArt.colors:["#af7353","#30a292","#eff1d1"],frank?"local":"driver");
    if(fabrics[id])dress(mesh,id,lead);
    else{if(frank)BayScoutArt.dress(mesh);if(id==="sol"||id==="mercado")BayCourtPlayers.kit(mesh,id);}
    const motion=new BayPlayerMotion();motion.step(.1,0,0);motion.feet[0].z=.106;motion.feet[1].z=-.063;
    motion.handTarget={x:.172,y:1.034,z:.114,weight:.87};mesh.update(motion);
    const verts=mesh.vertices;mirrors.set(key,verts);return verts;
  }
  // Depth-tested orthographic reflection. Fabric seams can sit less than a millimetre
  // above the base cloth, which a face-centre painter's sort cannot reliably resolve.
  function reflect(ctx,verts,box,yaw,zoom,focus){
    const {x,y,w,h}=box,frame=ctx.getImageData(x,y,w,h),pixels=frame.data;
    const depth=new Float32Array(w*h);depth.fill(-Infinity);
    const co=Math.cos(yaw),si=Math.sin(yaw),pitch=.037,scale=Math.min(h*zoom,w*(zoom>.7?1.50:1.24));
    const v=new Float32Array(9);
    for(let n=0;n<verts.length;n+=18){
      for(let i=0;i<3;i++){
        const k=n+i*6,vx=verts[k],vy=verts[k+1],vz=verts[k+2],z=co*vz-si*vx;
        v[i*3]=w*.5-(co*vx+si*vz)*scale;
        v[i*3+1]=h*.5-(vy-focus-pitch*z)*scale;
        v[i*3+2]=z+pitch*vy;
      }
      const ax=v[0],ay=v[1],bx=v[3],by=v[4],cx=v[6],cy=v[7],dx=bx-ax,dy=by-ay,ex=cx-ax,ey=cy-ay,area=dx*ey-dy*ex;
      if(Math.abs(area)<.012)continue;
      const loX=Math.max(0,Math.ceil(Math.min(ax,bx,cx)-.5)),hiX=Math.min(w-1,Math.floor(Math.max(ax,bx,cx)-.5));
      const loY=Math.max(0,Math.ceil(Math.min(ay,by,cy)-.5)),hiY=Math.min(h-1,Math.floor(Math.max(ay,by,cy)-.5));
      if(hiX<loX||hiY<loY)continue;
      // Light from the high shop windows stays fixed as the customer turns.
      const dz=v[5]-v[2],ez=v[8]-v[2],nx=(dy*ez-ey*dz)*scale,ny=(dz*ex-ez*dx)*scale;
      const sign=area>=0?1:-1,lambert=Math.max(0,(nx*-.34+ny*.56+area*.75)*sign/(Math.hypot(nx,ny,area)||1));
      const light=.82+.22*lambert,r=verts[n+3]*255*light+2,g=verts[n+4]*255*light+2,b=verts[n+5]*255*light+3;
      for(let py=loY;py<=hiY;py++)for(let px=loX;px<=hiX;px++){
        const X=px+.5-ax,Y=py+.5-ay,u=(X*ey-Y*ex)/area,t=(dx*Y-dy*X)/area;
        if(u<0||t<0||u+t>1)continue;
        const z=v[2]+u*dz+t*ez,i=py*w+px;if(z<depth[i])continue;depth[i]=z;
        const j=i*4;pixels[j]=r;pixels[j+1]=g;pixels[j+2]=b;pixels[j+3]=255;
      }
    }
    ctx.putImageData(frame,x,y);
  }
  function glass(ctx,box,detail){
    const {x,y,w,h}=box;
    const gradient=ctx.createLinearGradient(x,y,x+w,y+h);
    gradient.addColorStop(0,"#a7c1b6");gradient.addColorStop(.64,"#d6d9bc");gradient.addColorStop(1,"#cfb48f");
    ctx.fillStyle=gradient;ctx.fillRect(x,y,w,h);
    ctx.save();ctx.beginPath();ctx.rect(x,y,w,h);ctx.clip();
    ctx.fillStyle="#e0d7b8";ctx.fillRect(x,y+h*.75,w,h*.25);
    ctx.strokeStyle="#b8a98d";ctx.lineWidth=Math.max(1,h/190);
    for(let q=-2;q<5;q++){ctx.beginPath();ctx.moveTo(x+w*(.48+q*.17),y+h*.75);ctx.lineTo(x+w*(.46+q*.48),y+h);ctx.stroke();}
    for(const v of [.773,.826,.920]){ctx.beginPath();ctx.moveTo(x,y+h*v);ctx.lineTo(x+w,y+h*v);ctx.stroke();}
    ctx.fillStyle="#77938b";ctx.fillRect(x,y+h*.735,w,Math.max(2,h*.018));
    // Canvas curtain in the mirror's left jamb, with stitched red selvedge and a brass tie.
    const edge=detail?.12:.19;
    for(let i=0;i<6;i++){
      const a=i/6,b=(i+1)/6;ctx.fillStyle=["#b47666","#cb8c78","#bd7a69","#d4997e","#b87768","#dda184"][i];
      ctx.beginPath();ctx.moveTo(x+w*edge*a,y);ctx.lineTo(x+w*edge*b,y);
      ctx.lineTo(x+w*edge*b*.43,y+h*.52);ctx.lineTo(x+w*edge*b*.78,y+h*.79);
      ctx.lineTo(x+w*edge*a*.78,y+h*.78);ctx.lineTo(x+w*edge*a*.43,y+h*.52);ctx.fill();
    }
    ctx.fillStyle="#bba16f";ctx.fillRect(x,y+h*.522,w*edge*.51,h*.014);
    if(!detail){ctx.fillStyle="rgba(85,94,82,.24)";ctx.beginPath();ctx.ellipse(x+w*.515,y+h*.915,w*.118,h*.024,-.07,0,tau);ctx.fill();}
    ctx.restore();
  }
  function preview(canvas,id,lead="guest",yaw=0){
    const ctx=canvas?.getContext?.("2d");if(!ctx||canvas.width<8||canvas.height<8)return;
    const w=canvas.width,h=canvas.height,pad=Math.max(2,Math.round(Math.min(w,h)*.023)),split=w/h>1.12;
    const middle=split?Math.round(w*.53):w,boxes=[{x:pad,y:pad,w:middle-2*pad,h:h-2*pad}];
    if(split)boxes.push({x:middle,y:pad,w:w-middle-pad,h:h-2*pad});
    const verts=mirrorModel(id,lead);
    ctx.save();ctx.fillStyle="#615d4d";ctx.fillRect(0,0,w,h);
    for(let i=0;i<boxes.length;i++){
      const q=boxes[i];ctx.fillStyle="#d7b783";ctx.fillRect(q.x-2,q.y-2,q.w+4,q.h+4);
      glass(ctx,q,i);reflect(ctx,verts,q,yaw+(i?Math.PI+.35:0),i?1.51:.50,i?1.217:.918);
    }
    ctx.restore();
  }
  function map(ctx,x,y,scale,p,id,bearing=0){
    const f=fabrics[id];if(!f)return;
    const m=p.motion||{},run=m.run||0,w=m.weight||0,lift=m.lift||0,swing=Math.cos((m.phase||0)*tau)*w;
    const frank=(p.threadsLead||p.lead)==="frankie",skin=frank?"#af7659":"#af7353";
    const ellipse=(x,y,a,b,col)=>{ctx.fillStyle=col;ctx.beginPath();ctx.ellipse(x,y,a,b,0,0,tau);ctx.fill();};
    const stroke=(x,y,u,v,col,size)=>{ctx.strokeStyle=col;ctx.lineWidth=size;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(u,v);ctx.stroke();};
    ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);
    ellipse(.12,.17,.34-lift*.06,.27-lift*.06,"rgba(80,84,72,.38)");
    ctx.translate(Math.sin(bearing)*lift*.83,-Math.cos(bearing)*lift*.83);ctx.rotate(p.yaw||0);ctx.lineCap="round";
    for(const s of [-1,1]){
      const dz=m.feet?.[s===1?1:0]?.z||0;stroke(s*.12,.07,s*.13,-dz,f.pants,.133);ellipse(s*.13,-dz-.052,.061,.105,f.shoe);
      const a=s*(.249+run*.041),z=-s*swing*(.19+.19*run);
      stroke(s*.19,0,a,z,f.shirt,.124);ellipse(a,z,.049,.054,skin);
    }
    ctx.rotate(-.13*swing);ellipse(0,.015,.259,.152,f.shirt);
    if(id==="tideline"){stroke(-.210,.074,.210,.074,f.thread,.032);stroke(-.167,.105,.167,.105,"#80a59b",.016);}
    if(id==="pitlane"){stroke(-.216,.045,-.135,.093,f.thread,.020);stroke(.216,.045,.135,.093,f.thread,.020);ctx.fillStyle=f.thread;ctx.fillRect(.179,-.055,.037,.034);}
    if(id==="marquee")for(let i=0;i<5;i++){const a=(i+1)*Math.PI/6;stroke(.032*Math.cos(a),.067+.018*Math.sin(a),.133*Math.cos(a),.058+.071*Math.sin(a),f.thread,.016);}
    if(id==="roadcrew")for(const side of [-1,1])stroke(side*.18,-.04,side*.09,.11,f.thread,.037);
    if(id==="netter"){stroke(-.103,-.052,.083,.114,f.pants,.045);stroke(.103,-.052,-.083,.114,f.pants,.045);}
    ellipse(0,-.064-.031*run,.104,.108,skin);ellipse(0,-.047-.031*run,.096,.094,frank?"#483b40":"#37343c");
    if(frank)ellipse(-.019,.031-.031*run,.063,.055,"#44363a");ctx.restore();
  }
  window.BayThreadsArt=Object.freeze({colors,dress,preview,map});
})();
