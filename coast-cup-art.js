/* A chalked stripe, folding pit board and two numbered local cars. */
(() => {
  "use strict";
  const cream="#f1e4bd",ink="#243b3d",red="#a84936",silver="#a6b7b2";
  const turns=[{x:150.7,z:137,yaw:0},{x:79,z:150.7,yaw:-Math.PI/2},{x:65.3,z:7,yaw:Math.PI},{x:137,z:-6.7,yaw:Math.PI/2}];
  function panel(g,x,y,z,w,h,color){g.box(x,y,z,w,h,.028,color);}
  function figure(g,n,x,y,z,size){
    const bars=n===2?[0,1,3,4,6]:[1,2];
    const shapes=[[0,.42,.46,.085],[.21,.22,.08,.4],[.21,-.22,.08,.4],[0,0,.46,.085],[-.21,-.22,.08,.4],[-.21,.22,.08,.4],[0,-.42,.46,.085]];
    for(const i of bars){const [dx,dy,w,h]=shapes[i];panel(g,x+dx*size,y+dy*size,z,w*size,h*size,cream);}
  }
  function stand(g,lap){
    for(const x of [-.48,.48]){
      g.box(x,.05,0,.22,.08,.75,ink);g.box(x,.84,0,.07,1.62,.08,silver);
    }
    g.box(0,1.29,0,1.18,.87,.10,cream);
    for(const face of [-1,1]){
      panel(g,0,1.3,.071*face,1.10,.80,ink);
      if(lap)figure(g,lap,0,1.30,.096*face,.75);
      else for(let x=0;x<6;x++)for(let y=0;y<4;y++)if((x+y)%2===0)
        panel(g,(x-2.5)*.152,1.30+(y-1.5)*.152,.096*face,.153,.153,cream);
    }
    g.box(0,1.79,0,1.20,.08,.17,red);
  }
  const bars={4:[[0,.50,1,.15],[.66,0,.17,1],[0,.50,.16,.5]],7:[[0,.85,1,.15],[.70,0,.17,.88]]};
  function livery(g,v){
    const s=bayCarLayout(v.kind),roof=s.glass[5]+.015;
    const flat=(x,z,w,h,y,color)=>g.quad([x,y,z],[x+w,y,z],[x+w,y,z+h],[x,y,z+h],color);
    flat(-.40,-.45,.80,.83,roof,cream);
    for(const [x,z,w,h] of bars[v.cupNumber])flat(-.225+x*.45,-.35+z*.58,w*.45,h*.58,roof+.004,ink);
    const sections=s.sections;
    for(let j=1;j<sections.length;j++){
      const a=sections[j-1],b=sections[j];if(a[0]<s.glass[1])continue;
      for(const [x,w] of [[-.44,.14],[-.23,.045]]){
        g.quad([x,a[2]+.012,a[0]],[x+w,a[2]+.012,a[0]],[x+w,b[2]+.012,b[0]],[x,b[2]+.012,b[0]],cream);
      }
    }
  }
  function road(g){
    for(let i=0;i<18;i++)for(let j=0;j<2;j++)if((i+j)%2===0)g.box((i-8.5)*.64,.012,(j-.5)*.29,.62,.009,.27,cream);
    for(const side of [-1,1]){g.box(6.4*side,.12,0,.46,.22,.53,ink);g.box(6.4*side,.45,0,.15,.55,.15,red);g.box(6.4*side,.66,0,.15,.09,.15,cream);}
  }
  function corner(g){
    for(const x of [-.82,.82]){
      g.box(x,.06,0,.34,.10,.72,ink);g.box(x,.64,0,.075,1.12,.075,silver);
    }
    g.box(0,1.12,0,2.14,.79,.10,ink);
    for(const x of [-.63,0,.63]){
      const poly=(pts)=>g.quad(...pts.map(([dx,y])=>[x+dx,1.12+y,-.06]),cream);
      poly([[-.25,0],[.05,.29],[.29,.29],[-.02,0]]);poly([[-.25,0],[-.02,0],[.29,-.29],[.05,-.29]]);
    }
  }
  function fabric(g,kind){
    g.box(0,.43,0,.025,.96,.025,"#947755");
    for(let i=0;i<6;i++)for(let j=0;j<4;j++){
      const corner=(a,b)=>[a*.097,.89-b*.10-a*.014,.055*Math.sin(a*1.32)+b*.007];
      const color=kind==="finish"?((i+j)%2?ink:cream):kind==="white"?cream:"#318956";
      g.quad(corner(i,j),corner(i+1,j),corner(i+1,j+1),corner(i,j+1),color);
    }
  }
  const marshal={x:151.65,z:38.65,yaw:-1.85};
  function flag(cup){
    if(cup.phase==="count")return {kind:"green",lift:.96,wave:0};
    if(cup.phase==="race"&&cup.clock<2.3)return {kind:"green",lift:.78,wave:Math.sin(cup.clock*7)};
    if(cup.phase==="race"&&cup.completed&&cup.clock-cup.lastLap<4)return {kind:"white",lift:.85,wave:Math.sin((cup.clock-cup.lastLap)*6)};
    if(cup.phase==="return"&&cup.finish&&cup.clock-cup.finish<5)return {kind:"finish",lift:.93,wave:Math.sin((cup.clock-cup.finish)*7)};
    return {kind:"finish",lift:0,wave:0};
  }
  function handFlag(list,model,cup,mesh,motion,y){
    const f=flag(cup),h=motion.handTarget??={};
    Object.assign(h,{x:.31+f.wave*.12,y:1.04+f.lift*.49,z:.18+f.lift*.09,weight:1});
    const moved=mesh.update(motion),limb=mesh.sides[1],hand=limb.forearm.map(limb.handPivot,[]);
    const c=Math.cos(marshal.yaw),s=Math.sin(marshal.yaw),k="cup/flag/"+f.kind;
    model(k,g=>fabric(g,f.kind));list.push([k,marshal.x+c*hand[0]+s*hand[2],y+hand[1],marshal.z-s*hand[0]+c*hand[2],marshal.yaw,.08,-1.98+f.lift*2.3+f.wave*.85]);
    return moved;
  }
  function world(list,model,cup,see,ground){
    const {desk,stripe,grid}=BayCoastCup;
    if(see(stripe,100)){
      const lap=cup.phase==="race"?2-cup.completed:0,k="cup/lap/"+lap;
      model(k,g=>stand(g,lap));list.push([k,desk.x,ground(desk.x,desk.z),desk.z,-.59]);
      model("cup/stripe",road);list.push(["cup/stripe",stripe.x,.04,stripe.z,0]);
      model("cup/grid",g=>{for(const x of [-1.21,1.21])g.box(x,.01,-.68,.10,.012,1.44,cream);g.box(0,.01,0,2.52,.012,.10,cream);});
      list.push(["cup/grid",grid.x,.052,grid.z+1.96,0]);
    }
    if(cup.phase==="count"||cup.phase==="race"){
      model("cup/turn",corner);
      for(const t of turns)if(see(t,110))list.push(["cup/turn",t.x,ground(t.x,t.z),t.z,t.yaw]);
    }
    for(const {v} of cup.runners){
      if(!see(v,85))continue;const k="cup/car/"+v.cupNumber;model(k,g=>livery(g,v));
      list.push([k,v.x,ground(v.x,v.z)+.009,v.z,v.yaw,v.pitch||0,v.lean||0]);
    }
  }
  function mapCar(c,v,x,y,s){
    c.save();c.translate(x,y);c.rotate(v.yaw);
    c.fillStyle=cream;c.fillRect(-.45*s,-.49*s,.9*s,.98*s);c.fillStyle=ink;c.textAlign="center";c.textBaseline="middle";
    c.font="bold "+Math.max(2,.88*s)+"px sans-serif";c.fillText(String(v.cupNumber),0,0);c.restore();
  }
  function map(c,opt,px,py,s,visible){
    const cup=opt.coastCup,{stripe,desk,grid}=BayCoastCup;
    if(opt.mode==="street"&&visible(px(stripe.x),py(stripe.z),12*s)){
      const x=px(stripe.x),y=py(stripe.z);c.save();c.fillStyle=cream;
      for(let i=0;i<18;i++)for(let j=0;j<2;j++)if((i+j)%2===0)c.fillRect(x+(i-9)*.64*s,y+(j-1)*.28*s,.63*s,.27*s);
      c.strokeStyle=cream;c.lineWidth=Math.max(.7,.09*s);c.beginPath();
      for(const n of [-1,1]){c.moveTo(px(grid.x+n*1.2),py(grid.z+.55));c.lineTo(px(grid.x+n*1.2),py(grid.z+2));c.lineTo(px(grid.x),py(grid.z+2));}c.stroke();
      c.fillStyle=ink;c.fillRect(px(desk.x)-.64*s,py(desk.z)-.33*s,1.28*s,.70*s);
      c.fillStyle=cream;c.textAlign="center";c.textBaseline="middle";c.font="bold "+Math.max(3,.68*s)+"px sans-serif";c.fillText(cup.phase==="race"?String(2-cup.completed):"SC",px(desk.x),py(desk.z));c.restore();
      const f=flag(cup),mx=px(marshal.x),my=py(marshal.z);c.save();c.translate(mx,my);c.rotate(-.9+f.wave*.61);c.strokeStyle=ink;c.lineWidth=Math.max(.6,s*.08);c.beginPath();c.moveTo(0,0);c.lineTo(0,-1.15*s);c.stroke();
      for(let i=0;i<4;i++)for(let j=0;j<3;j++){c.fillStyle=f.kind==="green"?"#318956":f.kind==="white"||(i+j)%2?cream:ink;c.fillRect(i*s*.14,-1.16*s+j*s*.13,s*.145,s*.135);}c.restore();
    }
    if(opt.mode==="street"&&cup.phase==="race")for(const t of turns)if(visible(px(t.x),py(t.z),4*s)){
      c.save();c.translate(px(t.x),py(t.z));c.rotate(t.yaw);c.fillStyle=ink;c.fillRect(-1.15*s,-.44*s,2.30*s,.88*s);
      c.lineWidth=.12*s;c.strokeStyle=cream;c.beginPath();
      for(const x of [-.56,.06,.68]){c.moveTo((x+.12)*s,-.26*s);c.lineTo((x-.19)*s,0);c.lineTo((x+.12)*s,.26*s);}c.stroke();c.restore();
    }
    if(opt.mode!=="street"&&["race","count"].includes(cup.phase)){
      c.save();for(const {v} of cup.runners){const x=px(v.x),y=py(v.z);if(!visible(x,y,6))continue;
        c.fillStyle=v.color;c.strokeStyle=cream;c.lineWidth=1.5;c.beginPath();c.arc(x,y,3.5,0,Math.PI*2);c.fill();c.stroke();}
      c.restore();
    }
  }
  window.BayCoastCupArt={world,map,mapCar,marshal,handFlag};
})();
