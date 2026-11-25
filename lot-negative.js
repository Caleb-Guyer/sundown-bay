/* Mara's 35 mm camera at the public landing. Coordinates are in the street scene. */
(() => {
  "use strict";
  const key="sundownBay.maraFilm.v1";
  const subject={x:-154.05,z:-88.87,yaw:1.72};
  const notice=BayExposure.props.find(p=>p.kind==="notice");
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const captions={"14A":"Notice of sale, Port Sol public landing","14B":"Luis Vega with his brother’s lunch tin"};
  function readFrame(f){
    return f&&Object.hasOwn(captions,f.frame)&&typeof f.image==="string"&&f.image.length<=96000&&
      /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]+={0,2}$/.test(f.image)?{frame:f.frame,image:f.image}:null;
  }
  class Archive {
    constructor(){let s;try{s=JSON.parse(localStorage.getItem(key));}catch{}
      this.pending=readFrame(s?.pending);this.published=readFrame(s?.published);}
    write(){try{localStorage.setItem(key,JSON.stringify({pending:this.pending,published:this.published}));}catch{}}
    file(f){this.pending=readFrame(f);this.write();}
    deliver(){this.published=this.pending;this.pending=null;this.write();}
  }
  const decoded=new WeakMap();
  function photo(f){
    if(!f||typeof Image==="undefined")return null;
    let img=decoded.get(f);
    if(!img){img=new Image();decoded.set(f,img);img.src=f.image;}
    return img;
  }
  class Roll {
    constructor(){this.pan=.045;this.tilt=.035;this.focal=1.97;this.raise=0;this.asked=false;this.frames={};}
    eye(ground){return {x:-150.90,z:-91.18,y:ground+1.55,yaw:-Math.PI/2+this.pan,pitch:this.tilt,focal:this.focal};}
    turn(dx,dy){this.pan=clamp(this.pan+dx,-.36,.97);this.tilt=clamp(this.tilt+dy,-.34,.28);}
    aim(u,v){this.turn(Math.atan((u-.5)*32/(9*this.focal)),Math.atan((.5-v)*2/this.focal));}
    zoom(delta){this.focal=clamp(this.focal+delta,1.48,3.9);}
    ask(){if(!this.frames["14A"]||this.asked)return false;this.asked=true;this.focal=3.2;this.tilt=-.064;return true;}
    ready(project,ground){
      const inside=(p,dx,dy)=>p&&Math.abs(p.x-.5)<dx&&Math.abs(p.y-.5)<dy;
      if(!this.frames["14A"]){
        const y=ground(notice.x,notice.z);
        return inside(project(notice.x,y+1.68,notice.z),.18,.2)&&[-1.10,1.10].every(d=>inside(project(notice.x,y+1.68,notice.z+d),.48,.49));
      }
      if(!this.asked||this.raise<.99||this.frames["14B"])return false;
      const y=ground(subject.x,subject.z);
      return inside(project(subject.x,y+1.62,subject.z),.19,.34)&&inside(project(subject.x+.28,y+1.06,subject.z-.22),.45,.44);
    }
    expose(canvas,project,ground){
      if(!this.ready(project,ground))return false;
      const image=BayMeetPhoto.capture(canvas,null,.5,.5,16/9,true);if(!image)return false;
      const frame=this.frames["14A"]?"14B":"14A";this.frames[frame]={frame,image};return true;
    }
  }
  // Use the same actor rig, clothes and metal lunch tins as Dalia's departure.
  // Bake the poses on first sight. Nothing animates or allocates during a city drive.
  function porter(g,step){
    const mesh=new BayPlayerMesh(["#926349","#a59569","#414f54"],"local"),motion=new BayPlayerMotion(),f=step/6;
    motion.handTarget={x:.24,y:1.29,z:.30,weight:f};motion.step(1/60,0,0);mesh.update(motion);
    for(const v of mesh.vertices)g.vertices.push(v);
    for(let i=0;i<2;i++){
      const hand=[0,0,0];mesh.sides[i].forearm.map(mesh.sides[i].handPivot,hand);
      const [x,y,z]=hand,col=i?"#426e83":"#637a60";
      g.box(x,y-.213,z,.27,.20,.19,col);g.box(x,y-.106,z,.282,.036,.20,"#c8c2aa");
      g.box(x,y-.258,z,.272,.018,.193,"#e1cc9a");g.box(x,y-.099,z+.106,.052,.065,.018,"#b48d52");
      for(const side of [-1,1])g.box(x+side*.071,y-.052,z,.017,.096,.022,"#504d41");
      g.box(x,y-.006,z,.16,.019,.024,"#504d41");
    }
  }
  function actor(list,model,ground,raise=0){
    const step=Math.round(clamp(raise,0,1)*6),name="lot-porter/"+step;
    model(name,g=>porter(g,step));list.push([name,subject.x,ground(subject.x,subject.z),subject.z,subject.yaw]);
  }
  window.BayLotNegative={key,Archive,Roll,actor,subject,notice,photo,captions};
})();
