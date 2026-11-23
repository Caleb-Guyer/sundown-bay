/* Swimmers use the same articulated driver as the street. Water poses are solved in metres. */
(() => {
  "use strict";
  const tau=Math.PI*2,clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
  const colors={
    player:["#af7353","#30a292","#eff1d1"],tali:["#ad7252","#d55e4c","#3f6267"],
    ink:["#77513e","#a887b0","#465768"],des:["#9b6b49","#4c7f8b","#d7af68"],
    lark:["#ce9774","#ecc474","#517e78"]
  };
  const apparel={
    player:{top:"#398e86",shorts:"#556d80",hair:"#302e37",trim:"#dac6a0"},
    tali:{top:"#d55e4c",shorts:"#3f6267",hair:"#e8d5ae",trim:"#ffedc3"},
    ink:{top:"#a887b0",shorts:"#465768",hair:"#746682",trim:"#e9bda5"},
    des:{top:"#4c7f8b",shorts:"#d7af68",hair:"#393438",trim:"#dfb965"},
    lark:{top:"#ecc474",shorts:"#517e78",hair:"#a16c53",trim:"#698e83"}
  };
  const point=()=>[0,0,0];
  function set(out,x,y,z){out[0]=x;out[1]=y;out[2]=z;return out;}
  function smooth(t){t=clamp(t,0,1);return t*t*(3-2*t);}

  function rescueTube(g){
    // Rounded foam ends, stitched white end bands, two webbing grips and the short leash eye.
    const rings=[[-.435,.023,.024],[-.403,.064,.080],[-.335,.080,.096],
      [-.260,.083,.098],[-.229,.083,.098],[.229,.083,.098],[.260,.083,.098],[.335,.080,.096],[.404,.064,.080],[.435,.023,.024]];
    const shades=["#cb5942","#dc6548","#e68155"],steps=8;
    const corner=(r,i)=>[r[0],r[1]*Math.cos(tau*i/steps),r[2]*Math.sin(tau*i/steps)];
    for(let j=1;j<rings.length;j++)for(let i=0;i<steps;i++){
      const band=j===4||j===6,side=(i+1)%steps;
      g.quad(corner(rings[j-1],i),corner(rings[j],i),corner(rings[j],side),corner(rings[j-1],side),
        band?"#f4ddac":shades[i<2?2:i<5?0:1]);
    }
    for(const end of [rings[0],rings.at(-1)])for(let i=0;i<steps;i++)g.tri([end[0],0,0],corner(end,i),corner(end,i+1),"#c15540");
    for(const x of [-.157,.157]){
      g.pole([x-.047,.045,.069],[x-.045,.107,.086],.011,"#4b5750",4);
      g.pole([x-.045,.107,.086],[x+.047,.11,.083],.011,"#4b5750",4);
      g.pole([x+.047,.11,.083],[x+.050,.044,.069],.011,"#4b5750",4);
    }
    g.pole([.42,0,0],[.46,.006,.014],.012,"#745840",4);
  }
  function wake(g,stroke){
    for(const side of [-1,1]){
      const rx=stroke?.53:.43,rz=stroke?.99:.39,count=stroke?11:15;
      for(let i=0;i<count;i++){
        if(i===2||i===6||i===12)continue;
        const a=i/count,b=(i+.82)/count,thick=.018+.006*Math.sin(i);
        const rim=(t,w)=>{
          const angle=t*(stroke?2.06:2.72)+.17;
          return [side*(rx+w)*Math.sin(angle),.002*Math.sin(2*i),(rz+w)*Math.cos(angle)-(stroke?.63:.015)];
        };
        g.quad(rim(a,0),rim(b,0),rim(b,thick),rim(a,thick),i%3?"#9acbc1":"#c3d9bf");
      }
    }
  }
  let renderer=null;
  function install(model,view){
    renderer=view||renderer;
    model("swim-rescue-tube",rescueTube);
    model("swim-tread-ripples",g=>wake(g,false));model("swim-stroke-wake",g=>wake(g,true));
    model("swim-wrist-splash",g=>{
      g.tri([-.06,.005,-.088],[.017,.103,-.021],[.034,.007,.061],"#daebd5");
      g.tri([.042,.009,-.027],[.087,.072,-.054],[.072,.011,.031],"#adcfc1");
    });
  }

  function addCostume(rig,style){
    if(style==="player")return;
    const extra=new BayMesh(),parts=[];
    const mark=(part,side)=>parts.push({part,side,start:extra.vertices.length/6});
    const skin=colors[style][0],cloth=apparel[style],hat=cloth.hair;
    // The general-purpose runner has trainers. Use bare feet and short toes for the beach regulars.
    for(let i=0;i<rig.rest.length;i+=6){
      const y=rig.rest[i+1];if(y>.236)continue;
      const k=.80+.18*clamp((y-.015)/.18,0,1),rgb=Number.parseInt(skin.slice(1),16);
      rig.rest[i+2]*=.82;
      rig.rest[i+3]=((rgb>>16)&255)/255*k;rig.rest[i+4]=((rgb>>8)&255)/255*k;rig.rest[i+5]=(rgb&255)/255*k;
    }
    mark("body");
    if(style==="tali"){
      // A sun-bleached patch on both sides of the guard singlet.
      for(const face of [-1,1]){
        const z=face*.121;extra.box(0,1.290,z,.142,.111,.019,"#a44c43");
        extra.box(0,1.290,z+face*.014,.030,.083,.007,"#f7ddaa");
        extra.box(0,1.290,z+face*.015,.085,.026,.007,"#f7ddaa");
      }
      mark("head");extra.cyl(0,1.745,-.012,.086,.110,.083,10,hat);
      extra.box(0,1.704,.104,.184,.014,.130,hat);extra.box(.003,1.718,.099,.049,.023,.012,"#be5847");
      extra.cyl(0,1.616,-.1,.053,.041,.090,7,"#42362e");extra.cyl(0,1.598,-.105,.046,.044,.018,7,"#cb6a51");
    }else if(style==="ink"){
      mark("head");extra.cyl(0,1.710,-.009,.101,.105,.085,10,hat);
      extra.cyl(0,1.761,-.009,.056,.102,.053,10,hat);extra.cyl(0,1.683,-.006,.106,.107,.015,10,cloth.trim);
      extra.box(0,1.669,.096,.166,.020,.018,"#45515b");
      for(const side of [-1,1])extra.box(side*.046,1.669,.105,.062,.032,.019,"#849da6");
    }else if(style==="des"){
      mark("head");extra.cyl(0,1.707,0,.103,.104,.033,10,"#e2c77d");
      for(const [x,y,z] of [[-.044,1.77,-.052],[.038,1.77,-.051],[-.060,1.751,.042],[.046,1.753,.034],[.006,1.789,-.01]])
        extra.cyl(x,y,z,.035,.048,.054,7,"#443a36");
      mark("arm",1);extra.box(.239,1.038,.034,.091,.037,.09,"#dabf77");
    }else{
      mark("head");extra.cyl(0,1.709,-.002,.104,.102,.040,10,"#a6684e");
      extra.cyl(-.054,1.750,-.066,.057,.069,.065,8,"#664438");
      extra.pole([-.064,1.702,-.077],[-.103,1.656,-.108],.017,"#d29166",4);
      mark("body");extra.box(0,1.019,-.107,.272,.028,.016,"#709388");
    }
    const start=rig.rest.length,next=new Float32Array(start+extra.vertices.length);next.set(rig.rest);next.set(extra.vertices,start);
    for(let j=0;j<parts.length;j++){
      const {part,side,start:first}=parts[j],limb=rig.sides[side===1?1:0],end=parts[j+1]?.start??extra.vertices.length/6;
      for(let i=first;i<end;i++)rig.bindings.push(rig.binding(part,limb,extra.vertices[i*6+1]));
    }
    rig.rest=next;rig.vertices=next.slice();
  }

  function makeFrame(){
    const f={hip:point(),pelvis:point(),chest:point(),head:point(),limbs:[]};
    f.parts=[f.hip,f.pelvis,f.chest,f.head];
    for(let i=0;i<2;i++){
      const l={hand:point(),elbow:point(),ankle:point(),knee:point(),shoe:point()};
      f.limbs.push(l);f.parts.push(l.hand,l.elbow,l.ankle,l.knee,l.shoe);
    }
    return f;
  }
  // Hand positions are relative to the moving shoulder. The bent-elbow recovery clears the surface.
  const crawl=[[.025,.018,.412],[.027,-.062,.392],[.104,-.210,.279],[.138,-.279,.036],
    [.082,-.145,-.343],[.104,.083,-.336],[.218,.180,-.013],[.076,.159,.271]];
  const underwater=[[.004,-.016,.410],[.093,-.024,.368],[.255,-.060,.248],[.337,-.101,.045],
    [.232,-.123,-.147],[.034,-.125,.010],[-.053,-.097,.220],[-.025,-.044,.377]];
  function handPath(out,path,angle,side){
    const q=(angle/tau-Math.floor(angle/tau))*path.length,i=Math.floor(q),t=q-i;
    const a=path[(i+path.length-1)%path.length],b=path[i],c=path[(i+1)%path.length],d=path[(i+2)%path.length];
    for(let k=0;k<3;k++){
      const v=.5*t,c1=c[k]-a[k],c2=2*a[k]-5*b[k]+4*c[k]-d[k],c3=3*(b[k]-c[k])+d[k]-a[k];
      out[k]=(b[k]+v*(c1+t*(c2+t*c3)))*(k?1:side);
    }
  }
  function frame(f,p,t){
    const pose=p.pose,phase=Number.isFinite(p.phase)?p.phase:t*3.4,pace=clamp(p.pace||0,0,1);
    const wave=pose==="wave",climb=pose==="climb",tow=pose==="tow",dive=pose==="dive",stroke=pose==="stroke";
    const bodyTurn=Math.sin(phase+.32),swim=stroke||dive,step=clamp(p.climb||0,0,1);
    let pitch,roll,yaw,height,headPitch,headYaw,headRoll;
    if(climb){
      const load=Math.sin(step*Math.PI);height=.917-.146*load;pitch=.10+.23*load;roll=.043*Math.sin(step*tau*1.8);yaw=0;
      headPitch=-.095+.19*smooth((step-.7)/.3);headYaw=.035*bodyTurn;headRoll=roll*.25;
    }else if(tow){
      height=-.091+.012*Math.cos(phase);pitch=1.93;roll=Math.PI+.037*bodyTurn;yaw=.015*bodyTurn;
      headPitch=1.70;headYaw=-.045;headRoll=roll;
    }else if(swim){
      const breath=stroke?smooth((Math.cos(phase-1.33)-.05)/.91):0;
      pitch=dive?1.49-.24*clamp((p.vy||0)/2,-1,1):1.21+.14*pace;
      roll=bodyTurn*(dive?.088:.30+.11*pace);
      yaw=(dive?.026:.046)*Math.sin(phase+.62);height=(dive?-.031:-.042)+.020*Math.sin(2*phase-.44);
      headPitch=dive?pitch-.42:.81-.51*breath;headYaw=dive?.043*bodyTurn:.94*breath-.11;headRoll=roll*(dive?.63:.92);
    }else{
      height=-.359+.019*Math.sin(phase*2+.22);pitch=.13+.025*Math.cos(phase-.21);yaw=.066*bodyTurn;
      roll=(wave?-.073:0)+.032*Math.sin(phase+.58);headPitch=-.025+.03*Math.sin(phase+.3);
      headYaw=(wave?.12:.095)*Math.sin(phase-.34);headRoll=.014*bodyTurn;
    }
    set(f.hip,climb?.025*Math.sin(step*tau):0,height,climb?-.078:swim?-.17:0);
    set(f.pelvis,pitch*.98,-yaw*.47,tow?roll:roll*.66);
    set(f.chest,pitch,yaw,roll);set(f.head,headPitch,headYaw,headRoll);
    for(let i=0;i<2;i++){
      const l=f.limbs[i],side=i?1:-1,opposite=phase+i*Math.PI;
      if(climb){
        const cycle=step*tau*1.75+i*Math.PI,wave=Math.sin(cycle);
        set(l.hand,side*(.022+.019*Math.cos(cycle)),.09+.185*wave,.244+.027*Math.cos(cycle));
        set(l.elbow,side*.82,-.54,-.38);
        set(l.ankle,side*.026,-.721+.22*(.5-.5*wave),.107+.139*(.5-.5*wave));
        set(l.knee,side*.14,.11,.95);set(l.shoe,.11+.24*(.5-.5*wave),side*.05,0);
      }else if(tow){
        set(l.hand,-side*.017,.077+.009*Math.sin(opposite),-.052);
        set(l.elbow,-side*.85,-.59,-.15);
        set(l.ankle,-side*(.032+.037*Math.cos(opposite)),-.157+.032*Math.cos(opposite),-.746);
        set(l.knee,-side*.22,.78,.22);set(l.shoe,2.26+.13*Math.sin(opposite),-side*.09,Math.PI);
      }else if(swim){
        handPath(l.hand,dive?underwater:crawl,dive?phase:opposite,side);
        if(dive)set(l.elbow,side*.83,.02,-.39);
        else{
          // Lead the wrist around the shoulder. A tangent keeps the elbow plane defined through the recovery.
          const radius=Math.hypot(l.hand[1],l.hand[2]);
          set(l.elbow,side*.9,.22-l.hand[2]/radius,l.hand[1]/radius);
        }
        const kick=dive?phase*2+i*Math.PI:phase*3+i*Math.PI,rise=Math.sin(kick),fold=.5+.5*Math.sin(kick-.49);
        set(l.ankle,side*(.022+.012*Math.cos(kick)),.126*rise-.047,-.77+.105*fold);
        set(l.knee,side*.10,-.94,.28);set(l.shoe,2.26+.24*rise,side*.065,roll*.50);
      }else{
        const scull=phase*2+i*Math.PI,raised=wave&&side===1;
        if(raised){
          set(l.hand,.071+.102*Math.sin(phase*1.42),.355+.020*Math.cos(phase*2.84),.050+.023*Math.cos(phase));
          set(l.elbow,.81,.16,-.46);
        }else{
          set(l.hand,side*(.24+.043*Math.cos(scull)),-.119+.033*Math.sin(scull),.161+.094*Math.sin(scull));
          set(l.elbow,side*.81,-.55,-.30);
        }
        set(l.ankle,side*(.114+.082*Math.cos(opposite)),-.557+.091*Math.sin(opposite),-.13+.155*Math.cos(opposite-.39));
        set(l.knee,side*.39,.08,.87);set(l.shoe,.55+.43*Math.cos(opposite),side*(.28+.20*Math.sin(opposite)),side*.14);
      }
    }
  }
  function solve(a,b,c,offset,pole,upper,lower){
    let dx=offset[0],dy=offset[1],dz=offset[2];const n=Math.hypot(dx,dy,dz)||1;
    dx/=n;dy/=n;dz/=n;
    const d=clamp(n,Math.abs(upper.length-lower.length)+.004,upper.length+lower.length-.0008);
    set(c,a[0]+d*dx,a[1]+d*dy,a[2]+d*dz);
    const mid=(upper.length**2-lower.length**2+d*d)/(2*d),bend=Math.sqrt(Math.max(0,upper.length**2-mid*mid));
    const dot=pole[0]*dx+pole[1]*dy+pole[2]*dz;
    const ex=pole[0]-dot*dx,ey=pole[1]-dot*dy,ez=pole[2]-dot*dz;
    const f=bend/(Math.hypot(ex,ey,ez)||1);
    set(b,a[0]+dx*mid+ex*f,a[1]+dy*mid+ey*f,a[2]+dz*mid+ez*f);
    if(upper.swimBasis){
      // Both segments share the bend plane. This keeps the palm from twisting as the wrist passes overhead.
      const nx=dy*ez-dz*ey,ny=dz*ex-dx*ez,nz=dx*ey-dy*ex,inverse=1/(Math.hypot(nx,ny,nz)||1);
      aimArm(upper,a,b,nx*inverse,ny*inverse,nz*inverse);aimArm(lower,b,c,nx*inverse,ny*inverse,nz*inverse);
    }else{upper.aim(a,b);lower.aim(b,c);}
  }
  function armBasis(bone){
    const [x,y,z]=bone.axis,s=Math.sqrt(1-x*x);
    return [s,-x*y/s,-x*z/s,0,z/s,-y/s];
  }
  function aimArm(bone,from,to,nx,ny,nz){
    const x=(to[0]-from[0])/bone.length,y=(to[1]-from[1])/bone.length,z=(to[2]-from[2])/bone.length;
    const tx=y*nz-z*ny,ty=z*nx-x*nz,tz=x*ny-y*nx,b=bone.swimBasis,axis=bone.axis,m=bone.m;
    for(let i=0;i<3;i++){
      m[i]=x*axis[i]+nx*b[i]+tx*b[i+3];
      m[i+4]=y*axis[i]+ny*b[i]+ty*b[i+3];
      m[i+8]=z*axis[i]+nz*b[i]+tz*b[i+3];
    }
    bone.anchor(from);
  }
  const casts=new Map();
  function actor(p,t){
    const style=Object.hasOwn(colors,p.style)?p.style:"player",key=style+"/"+(p.id??style);
    let a=casts.get(key);
    if(!a){
      const rig=new BayPlayerMesh(colors[style],style==="player"?"driver":"runner");addCostume(rig,style);
      for(const side of rig.sides){side.arm.swimBasis=armBasis(side.arm);side.forearm.swimBasis=armBasis(side.forearm);}
      a={rig,key:"swimmer/"+key,style,current:makeFrame(),target:makeFrame(),previous:makeFrame(),pose:"",stamp:-1,lastDepth:0,brokeAt:-Infinity,
        head:point(),hips:point(),shoulders:point(),crown:point(),grip:point(),visor:point(),toes:[point(),point()],localGPU:null};
      casts.set(key,a);
    }
    const depth=p.depth||0;
    if(a.lastDepth>=.19&&depth<.19&&t>=a.stamp&&t-a.stamp<.45)a.brokeAt=t;
    a.lastDepth=depth;
    const worldY=p.y||0;
    if(a.stamp===t&&a.pose===p.pose&&a.phase===p.phase&&a.climb===p.climb&&a.pace===p.pace&&a.vy===p.vy&&a.worldY===worldY)return a;
    const first=a.stamp<0||t<a.stamp||t-a.stamp>.45;
    if(first||a.pose!==p.pose){
      a.changed=first?t-1:t;
      a.transfer=!first&&(a.pose==="climb")!==(p.pose==="climb");a.sourceY=a.worldY;
      for(let i=0;i<a.current.parts.length;i++)Object.assign(a.previous.parts[i],a.current.parts[i]);
    }
    a.stamp=t;a.pose=p.pose;a.phase=p.phase;a.climb=p.climb;a.pace=p.pace;a.vy=p.vy;a.worldY=worldY;a.dirty=true;
    frame(a.target,p,t);
    const f=a.current,weight=smooth((t-a.changed)/.27);
    for(let i=0;i<f.parts.length;i++){
      const from=a.previous.parts[i],to=a.target.parts[i],out=f.parts[i];
      for(let k=0;k<3;k++)out[k]=weight===1?to[k]:mix(from[k],to[k],weight);
    }
    // The dock transition changes the origin from the water surface to the soles of the shoes.
    if(a.transfer&&weight<1)f.hip[1]+=(a.sourceY-worldY)*(1-weight);
    const r=a.rig;
    r.pelvis.place(f.hip,...f.pelvis);r.pelvis.map(r.chest.pivot,r.pivot);r.chest.place(r.pivot,...f.chest);
    r.chest.map(r.head.pivot,r.pivot);r.head.place(r.pivot,...f.head);
    for(let i=0;i<2;i++){
      const l=r.sides[i],target=f.limbs[i];
      r.pelvis.map(l.thigh.pivot,l.hip);solve(l.hip,l.knee,l.ankle,target.ankle,target.knee,l.thigh,l.shin);
      l.shoe.place(l.ankle,...target.shoe);
      r.chest.map(l.arm.pivot,l.shoulder);solve(l.shoulder,l.elbow,l.hand,target.hand,target.elbow,l.arm,l.forearm);
    }
    r.head.map([0,1.657,0],a.head);r.head.map([0,1.758,.013],a.crown);r.head.map([0,1.664,.104],a.visor);
    r.pelvis.map([0,.964,0],a.hips);r.chest.map([0,1.39,0],a.shoulders);
    for(let k=0;k<3;k++)a.grip[k]=(r.sides[0].hand[k]+r.sides[1].hand[k])*.5;
    return a;
  }
  function near(p,local){
    const c=Math.cos(p.yaw||0),s=Math.sin(p.yaw||0);
    return [p.x+c*local[0]+s*local[2],p.y+local[1],p.z-s*local[0]+c*local[2]];
  }
  function tubeAt(p,a,t){
    if(p.pose==="tow")return [a.grip[0],.058+.010*Math.cos(t*2.4),a.grip[2]];
    if(p.style==="tali"&&!p.towing&&p.pose!=="dive"&&p.pose!=="climb")
      return [-.25-.055*Math.sin(t*1.08),.062+.017*Math.cos(t*2.7),-.72-.087*Math.cos(t*.84)];
    return null;
  }
  function linePoints(patrol,player,t){
    const passenger=patrol.call?.swimmer,lead=patrol.towing?player:patrol.tali;
    if(!lead||!passenger?.wet||passenger.pose!=="tow"||Math.hypot(lead.x-passenger.x,lead.z-passenger.z)>4.8)return null;
    const tube=tubeAt(passenger,actor(passenger,t),t);
    const end=near(passenger,[tube[0]-.27,tube[1],tube[2]]);
    const start=near(lead,[-.20,.105,-.30]),mid=[(start[0]+end[0])*.5+.04*Math.cos(t*2),
      Math.max(.075,(start[1]+end[1])*.5-.055),(start[2]+end[2])*.5];
    return [start,mid,end];
  }
  let lineView=null,lineVertices;
  function worldLine(list,patrol,player,t){
    const points=linePoints(patrol,player,t);if(!points||!renderer)return;
    if(!lineVertices)lineVertices=new Float32Array(12*6);
    let i=0;
    for(let j=0;j<2;j++){
      const a=points[j],b=points[j+1],dx=b[0]-a[0],dz=b[2]-a[2],width=.018/(Math.hypot(dx,dz)||1);
      for(const [p,side] of [[a,-1],[a,1],[b,1],[a,-1],[b,1],[b,-1]]){
        lineVertices[i++]=p[0]+dz*width*side;lineVertices[i++]=p[1];lineVertices[i++]=p[2]-dx*width*side;
        lineVertices[i++]=.96;lineVertices[i++]=.76;lineVertices[i++]=.48;
      }
    }
    if(renderer!==lineView){renderer.add("swim-float-line",{vertices:lineVertices},true);lineView=renderer;}
    else renderer.updateAnimated("swim-float-line");
    list.push(["swim-float-line",0,0,0]);
  }
  function mapLine(c,patrol,player,t,px,py,scale){
    const points=linePoints(patrol,player,t);if(!points)return;
    c.save();c.beginPath();c.moveTo(px(points[0][0]),py(points[0][2]));
    for(const p of points.slice(1))c.lineTo(px(p[0]),py(p[2]));
    c.lineWidth=Math.max(1.1,scale*.055);c.strokeStyle="#e6c491";c.stroke();c.restore();
  }
  function world(list,p,t,weather){
    if(!p||!renderer)return;
    const a=actor(p,t),yaw=p.yaw||0,depth=Math.max(0,p.depth||0);
    if(a.dirty||a.localGPU!==renderer){
      a.rig.skin();
      if(a.localGPU!==renderer){renderer.add(a.key,a.rig,true);a.localGPU=renderer;}
      else renderer.updateAnimated(a.key);
      a.dirty=false;
    }
    list.push([a.key,p.x,p.y,p.z,yaw]);
    const tube=tubeAt(p,a,t);
    if(tube){const spot=near(p,tube);list.push(["swim-rescue-tube",...spot,yaw+(p.pose==="tow"?0:-.66),.055*Math.cos(t*1.9),.025*Math.sin(t*2.31)]);}
    if(depth>.19||p.pose==="climb"||p.pose==="dive")return;
    const surface=Math.max(.079,p.y+depth+.036),stroke=p.pose==="stroke"||p.pose==="tow";
    list.push([stroke?"swim-stroke-wake":"swim-tread-ripples",p.x,surface,p.z,yaw+.033*Math.sin(1.9*t)]);
    const breath=(t-a.brokeAt)/.40;
    if(breath>=0&&breath<1){
      for(const side of [-1,1]){
        const h=near(p,[a.head[0]+side*(.13+.21*breath),0,a.head[2]+.05]);
        list.push(["swim-wrist-splash",h[0],surface+.05*Math.sin(tau*.5*breath)-.08*breath,h[2],yaw+side*.65]);
      }
    }
    if(p.pose==="stroke"&&(p.pace||0)>.25){
      const phase=Number.isFinite(p.phase)?p.phase:t*3.4;
      for(const l of a.rig.sides){
        const f=phase+(l.side===1?Math.PI:0);
        if(Math.cos(f-.19)>.94){
          const h=near(p,l.hand);list.push(["swim-wrist-splash",h[0],surface+.004,h[2],yaw+l.side*.21]);
        }
      }
    }
  }

  // The overhead view projects the solved wrists, ankles and head onto the same water surface.
  function map(ctx,x,y,scale,p,t){
    if(!p)return;
    const a=actor(p,t),r=a.rig,outfit=apparel[a.style],skin=colors[a.style][0],depth=Math.max(0,p.depth||0);
    const surface=depth<.19&&p.pose!=="dive"&&p.pose!=="climb",wet=surface?.60:.92;
    const toes=a.toes,tube=tubeAt(p,a,t);
    const rise=p.pose==="wave"?.42:p.pose==="climb"?.32:.10,datum=p.pose==="climb"?.83:0;
    const py=u=>-u[2]-rise*(u[1]-datum);
    ctx.save();ctx.translate(x,y);ctx.rotate(p.yaw||0);const s=Math.max(3.3,scale*1.32);ctx.scale(s,s);
    ctx.lineCap="round";ctx.lineJoin="round";
    function line(u,v,width,color,alpha=1){
      ctx.globalAlpha=alpha;ctx.strokeStyle=color;ctx.lineWidth=width;ctx.beginPath();ctx.moveTo(u[0],py(u));ctx.lineTo(v[0],py(v));ctx.stroke();
    }
    function oval(u,w,h,color,alpha=1){
      ctx.globalAlpha=alpha;ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(u[0],py(u),w,h,0,0,tau);ctx.fill();
    }
    if(surface){
      const forward=p.pose==="stroke"||p.pose==="tow",beat=.5+.5*Math.cos(2*t);
      ctx.globalAlpha=.80;ctx.strokeStyle="#c4dbca";ctx.lineWidth=.030;
      for(const side of [-1,1]){
        ctx.save();ctx.scale(side,1);ctx.beginPath();ctx.ellipse(0,forward?.57:.015,.46+beat*.032,forward?.91:.36+beat*.025,0,-1.29,.09);ctx.stroke();
        ctx.beginPath();ctx.ellipse(0,forward?.57:.015,.45+beat*.032,forward?.91:.36+beat*.025,0,.20,.65);ctx.stroke();ctx.restore();
      }
      const breath=(t-a.brokeAt)/.40;
      if(breath>=0&&breath<1){
        ctx.globalAlpha=.90*(1-breath);ctx.lineWidth=.043;ctx.beginPath();
        ctx.ellipse(a.head[0],py(a.head),.22+.19*breath,.12+.15*breath,.04,-2.8,-.33);ctx.stroke();
      }
    }
    for(let i=0;i<2;i++){
      const l=r.sides[i];l.shoe.map([l.side*.111,.029,.126],toes[i]);
      line(l.hip,l.knee,.167,"#365a63",wet);line(l.knee,l.ankle,.123,"#365a63",wet);
      line(l.hip,l.knee,.152,outfit.shorts,wet);line(l.knee,l.ankle,.109,a.style==="player"?outfit.shorts:skin,wet);
      line(l.ankle,toes[i],.095,a.style==="player"?"#b2a58d":skin,wet);
    }
    line(a.shoulders,a.head,.131,skin);
    line(r.sides[0].hip,r.sides[1].hip,.134,outfit.shorts,wet);
    ctx.globalAlpha=surface&&a.shoulders[1]<-.02?.84:1;ctx.fillStyle=outfit.top;ctx.beginPath();
    for(const [i,v] of [r.sides[0].shoulder,r.sides[1].shoulder,r.sides[1].hip,r.sides[0].hip].entries())i?ctx.lineTo(v[0],py(v)):ctx.moveTo(v[0],py(v));
    ctx.closePath();ctx.strokeStyle="#395b60";ctx.lineWidth=.025;ctx.stroke();ctx.fill();
    line(r.sides[0].shoulder,r.sides[1].shoulder,.142,outfit.top);
    if(a.style==="player"&&p.pose!=="tow"){
      const u=r.sides[0].shoulder,v=r.sides[1].hip;
      line([u[0]*.45,0,mix(u[2],v[2],.32)],[.028,0,mix(u[2],v[2],.46)],.033,"#c9ba9a");
      line([.039,0,mix(u[2],v[2],.69)],[.095,0,mix(u[2],v[2],.57)],.026,"#ce9d84");
    }else if(a.style==="tali"){
      const z=mix(a.shoulders[2],a.hips[2],.32);line([-.063,0,z],[.063,0,z],.034,outfit.trim);line([0,0,z-.064],[0,0,z+.064],.034,outfit.trim);
    }
    if(tube){
      const angle=p.pose==="tow"?0:-.66;ctx.save();ctx.translate(tube[0],py(tube));ctx.rotate(angle);
      line([-.35,0,0],[.35,0,0],.158,"#d96a4a");
      for(const side of [-1,1])line([side*.253,0,-.060],[side*.253,0,.060],.048,"#f3d7a1");
      ctx.restore();
    }
    for(const l of r.sides){
      const alpha=surface&&l.hand[1]<-.08?.70:1;
      line(l.shoulder,l.elbow,.127,"#545b5a",alpha);line(l.elbow,l.hand,.096,"#545b5a",alpha);
      line(l.shoulder,l.elbow,.111,skin,alpha);line(l.elbow,l.hand,.080,skin,alpha);
      if(a.style==="player"){
        const q=[mix(l.shoulder[0],l.elbow[0],.53),0,mix(l.shoulder[2],l.elbow[2],.53)];
        line(l.shoulder,q,.146,outfit.top,alpha);
      }oval(l.hand,.044,.049,skin,alpha);
    }
    oval(a.head,.122,.127,skin);oval(a.crown,.112,.116,outfit.hair);
    if(a.style==="tali")line(a.crown,a.visor,.113,"#e7d3ae");
    else if(a.style==="ink"||a.style==="des"){
      const q=a.style==="ink"?a.visor:a.crown,z=q[2]+.036;
      line([q[0]-.083,q[1],z],[q[0]+.083,q[1],z],.024,a.style==="ink"?"#9cabb3":"#dcc27e");
    }else if(a.style==="lark")oval([a.crown[0]-.071,a.crown[1],a.crown[2]-.051],.057,.060,"#80523f");
    if(p.pose==="tow")oval(a.visor,.084,.088,skin);
    ctx.restore();
  }
  window.BaySwimmerArt={colors,install,world,map,worldLine,mapLine};
})();
