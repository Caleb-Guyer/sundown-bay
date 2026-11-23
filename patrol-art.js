/* The air unit, folding traffic boards and cones use the city's existing mesh renderer. */
(() => {
  "use strict";
  const navy="#304a58",ivory="#efe7ca",glass="#375e6b",gold="#e6b15e",metal="#657475";
  const mast=1.76,tail=[.22,.83,-6.05],segments=20;
  const circle=Array.from({length:segments+1},(_,i)=>[Math.cos(i*Math.PI*2/segments),Math.sin(i*Math.PI*2/segments)]);

  function aircraft(g){
    const sections=[[-2.68,.39,-.40,.60],[-1.68,.92,-.63,.99],[-.72,1.10,-.69,1.04],
      [.55,1.15,-.70,1.08],[1.39,1.06,-.62,.91],[2.16,.83,-.48,.49],[2.56,.37,-.29,.07]];
    const rings=sections.map(([z,w,low,top])=>[[-w*.57,top,z],[w*.57,top,z],[w,top*.54,z],
      [w,low*.50,z],[w*.65,low,z],[-w*.65,low,z],[-w,low*.50,z],[-w,top*.54,z]]);
    for(let i=1;i<rings.length;i++)for(let j=0;j<8;j++){
      const q=(j+1)%8,canopy=i>=4&&(j===0||j===1||j===7);
      const paint=canopy?(j===0?"#67919a":glass):j>=3&&j<=5?navy:ivory;
      g.quad(rings[i-1][j],rings[i-1][q],rings[i][q],rings[i][j],paint,j===2?.96:1);
    }
    for(const end of [0,rings.length-1])for(let j=1;j<7;j++)g.tri(rings[end][0],rings[end][j],rings[end][j+1],navy);
    for(const side of [-1,1]){
      const panel=(u,v,z)=>[side*u,v,z];
      for(const [back,front] of [[-1.29,-.58],[-.48,.49],[.57,1.18]]){
        const w=front<-.5?1.064:1.158;
        g.quad(panel(w,.06,back),panel(w,.09,front-.03),panel(w,.52,front-.04),panel(w,.55,back+.06),glass);
      }
      g.quad(panel(1.116,-.12,-1.47),panel(1.16,-.16,.63),panel(1.16,-.07,.63),panel(1.12,-.01,-1.47),"#568e94");
      g.quad(panel(1.167,.02,-.39),panel(1.167,.18,-.17),panel(1.167,.34,-.39),panel(1.167,.18,-.61),gold);
      g.pole(panel(.82,1,1.13),panel(.68,.47,2.09),.029,ivory);
      g.pole(panel(.66,-.51,-1.25),panel(.98,-1.02,-1.08),.052,metal);
      g.pole(panel(.69,-.46,.96),panel(.98,-1.02,1.00),.052,metal);
      g.pole(panel(.98,-1.03,-1.75),panel(.98,-1.03,1.57),.078,navy);
      g.pole(panel(.98,-1.03,1.57),panel(.98,-.87,1.96),.077,navy);
      g.box(side*1.13,.32,-.67,.095,.095,.17,side<0?"#e86c5c":"#91d9b8");
    }
    g.pole([0,1.03,1.21],[0,.42,2.22],.034,ivory);
    g.box(0,1.12,-.58,1.02,.43,1.56,navy);g.box(0,1.34,-.63,.85,.09,1.16,metal);
    for(const side of [-1,1])g.pole([side*.32,1.17,-1.17],[side*.37,1.17,-1.65],.16,"#4d5a58",7);
    g.cyl(0,1.53,-.22,.11,.12,.39,8,metal);
    const boom=[[-2.2,.48,.42],[-3.2,.40,.37],[-5.75,.75,.16],[-6.15,.83,.14]];
    for(let i=1;i<boom.length;i++){
      const ring=([z,y,r],j)=>[r*Math.cos(j*Math.PI/3),y+r*Math.sin(j*Math.PI/3),z];
      for(let j=0;j<6;j++)g.quad(ring(boom[i-1],j),ring(boom[i-1],j+1),ring(boom[i],j+1),ring(boom[i],j),j<3?ivory:navy);
    }
    g.quad([0,.65,-5.65],[0,.65,-6.27],[0,2.24,-6.67],[0,2.15,-6.19],navy);
    g.quad([0,1.82,-6.04],[0,1.83,-6.56],[0,2.24,-6.67],[0,2.15,-6.19],ivory);
    g.box(0,.72,-4.94,2.35,.075,.41,navy);
    g.box(0,2.25,-6.47,.095,.085,.12,"#ff7b63");
    g.cyl(0,-.55,1.71,.27,.33,.31,8,metal);g.cyl(0,-.73,1.71,.26,.24,.08,8,"#fff5ba");
  }
  function rotor(g){
    g.cyl(0,0,0,.29,.28,.095,8,metal);
    for(let i=0;i<4;i++){
      const ca=Math.cos(i*Math.PI/2),sn=Math.sin(i*Math.PI/2);
      const p=(r,w)=>[r*ca-w*sn,-r*.014,r*sn+w*ca];
      g.quad(p(.18,-.08),p(.45,.145),p(4.77,.04),p(4.80,-.23),"#4a5655");
      g.quad(p(4.77,.04),p(5.11,-.055),p(5.14,-.23),p(4.80,-.23),"#ddcb98");
    }
  }
  function tailRotor(g){
    for(let i=0;i<4;i++){
      const a=i*Math.PI/2,y=Math.cos(a),z=Math.sin(a);
      g.pole([0,y*.05,z*.05],[0,y*.83,z*.83],.055,navy,4);
      g.pole([0,y*.65,z*.65],[0,y*.82,z*.82],.057,ivory,4);
    }
  }
  function board(g){
    for(const side of [-1,1]){
      for(const foot of [-1,1])g.pole([side*1.19,.05,foot*.49],[side*1.19,1,-foot*.11],.071,metal,5);
      g.box(side*1.19,.10,0,.23,.11,1.06,navy);
    }
    for(const y of [.56,.98]){
      g.box(0,y,0,3.1,.26,.16,ivory);
      for(const face of [-1,1])for(let i=0;i<5;i++){
        const x=-1.53+i*.62,z=face*.084;
        g.quad([x,y-.13,z],[x+.27,y-.13,z],[x+.51,y+.13,z],[x+.24,y+.13,z],"#e26436");
      }
    }
    for(const side of [-1,1]){
      g.box(side*1.31,1.19,0,.15,.16,.14,navy);
      g.cyl(side*1.31,1.32,0,.104,.12,.17,8,"#eea03d");
    }
  }
  function cone(g){
    g.box(0,.051,0,.54,.10,.54,"#535856");
    g.cyl(0,.22,0,.125,.206,.27,8,"#e96f35");
    g.cyl(0,.405,0,.092,.131,.12,8,"#fff1cc");g.cyl(0,.54,0,.035,.097,.17,8,"#f47b3a");
  }
  function spikeStrip(g){
    g.box(0,.053,0,3.36,.10,.52,"#303d40");
    for(let i=-3;i<=3;i++){
      const x=i*.42;
      g.box(x,.115,0,.33,.055,.42,"#768580");
      const top=[x,.32,-.045],a=[x-.12,.14,-.15],b=[x+.12,.14,-.15],c=[x,.14,.14];
      g.tri(a,b,top,"#f5f2d8");g.tri(b,c,top,"#a4b8b5");g.tri(c,a,top,"#677e84");
    }
    for(const end of [-1.56,1.56]){
      g.box(end,.095,0,.24,.17,.63,"#f5b244");
      g.box(end,.19,-.12,.17,.04,.15,"#fff1ab");
    }
  }
  function install(model){
    model("patrol-air",aircraft);model("patrol-rotor",rotor);model("patrol-tail",tailRotor);
    model("patrol-board",board);model("patrol-cone",cone);model("patrol-spikes",spikeStrip);
    model("patrol-amber",g=>{for(const side of [-1,1])g.cyl(side*1.31,1.345,0,.107,.125,.15,8,"#fff2a5");});
  }
  // Positions and light intensities occupy the ordinary interleaved vertex buffer.
  class Searchlight {
    constructor(){this.vertices=new Float32Array(segments*12*6);}
    update(a,lamp){
      const f=a.beamFraction,r=a.radius*f,light=a.light,pool=f>.993?light:0;
      const x=lamp.x+(a.spotX-lamp.x)*f,z=lamp.z+(a.spotZ-lamp.z)*f,y=lamp.y+(.20-lamp.y)*f;
      let cursor=0;
      const put=(px,py,pz,alpha)=>{
        this.vertices[cursor]=px;this.vertices[cursor+1]=py;this.vertices[cursor+2]=pz;
        this.vertices[cursor+3]=alpha;cursor+=6;
      };
      for(let i=0;i<segments;i++){
        const [cx,cz]=circle[i],[nx,nz]=circle[i+1];
        const rim=(u,v,size,alpha)=>put(x+u*r*size,y,z+v*r*size,alpha);
        put(lamp.x,lamp.y,lamp.z,.11*light);rim(cx,cz,1,.042*light);rim(nx,nz,1,.042*light);
        put(x,y,z,.50*pool);rim(cx,cz,.56,.27*pool);rim(nx,nz,.56,.27*pool);
        rim(cx,cz,.56,.27*pool);rim(cx,cz,1,0);rim(nx,nz,1,0);
        rim(cx,cz,.56,.27*pool);rim(nx,nz,1,0);rim(nx,nz,.56,.27*pool);
      }
    }
  }
  window.BayPatrolArt={install,mast,tail,Searchlight};
})();
