/* Car body panels share a rest mesh. Only a changed impact builds another shape. */
(() => {
  "use strict";
  const kinds=new Set(["coupe","hatch","cab","van","cruiser","wrecker"]);
  const profiles=new Map(),views=new WeakMap(),installed=new WeakMap(),mapPlans=new WeakMap(),effects=new WeakMap();
  const clamp=x=>Math.max(0,Math.min(1,x)),mix=(a,b,f)=>a+(b-a)*f;
  const band=x=>Number.isFinite(x)?Math.round(clamp(x)*15):0;
  function code(d){return d?band(d.front)|(band(d.rear)<<4)|(band(d.left)<<8)|(band(d.right)<<12):0;}
  function levels(n){return {front:(n&15)/15,rear:((n>>4)&15)/15,left:((n>>8)&15)/15,right:(n>>12)/15};}
  function profile(kind){
    let p=profiles.get(kind);if(p)return p;
    const s=bayCarLayout(kind),first=s.sections[0],last=s.sections.at(-1);
    p={s,front:last[0],rear:first[0],nose:last[2],tail:first[2],frontW:last[1],rearW:first[1],
      noseStart:s.glass[3]*.78,tailStart:s.glass[0]*.65,
      sideCenter:mix(s.back,s.hingeZ,.44),track:s.track,sill:s.glass[4],roof:s.glass[5]};
    profiles.set(kind,p);return p;
  }
  // All positions here are relative to the chassis, including open door parts.
  function bend(x,y,z,p,d,out,i=0){
    const across=x/p.track,upper=clamp((y-p.sill+.035)/(p.roof-p.sill));
    const crush=1-.76*upper,deck=clamp((y-.44)/.22);
    const nose=clamp((z-p.noseStart)/(p.front-p.noseStart)),tail=clamp((p.tailStart-z)/(p.tailStart-p.rear));
    const front=d.front*crush*(.80+.16*across),rear=d.rear*crush*(.77-.16*across);
    const hoodFold=Math.max(0,1-Math.abs(nose-(.55+.17*across))*2.5);
    const trunkFold=Math.max(0,1-Math.abs(tail-(.59-.17*across))*2.65);
    const longitudinal=clamp(1-Math.abs(z-p.sideCenter)/(p.front*.79));
    const doorWidth=clamp((Math.abs(x)/p.track-.54)/.35);
    const doorHeight=Math.max(0,1-Math.abs((y-(p.sill-.19))/.55));
    const side=(x<0?d.left:d.right)*doorWidth*longitudinal;
    const sideFold=Math.max(0,1-Math.abs(z-p.sideCenter+.44*(y-p.sill))/.42);
    // The glass and its painted surround sit just millimetres apart. Let the
    // crumple zones give way around that rigid frame and keep both panes flush.
    let give=1,frameShift=0;
    if(y>p.sill-.055){
      const glass=p.s.glass,rise=clamp((y-p.sill)/(p.roof-p.sill));
      const noseGap=Math.abs(z-mix(glass[3],glass[2],rise)),tailGap=Math.abs(z-mix(glass[0],glass[1],rise));
      const lock=clamp((.22-Math.min(noseGap,tailGap))/.16)*clamp((y-p.sill+.055)/.035);
      const nosePane=noseGap<tailGap,endDeck=nosePane?p.front-glass[3]:glass[0]-p.rear;
      give-=lock;frameShift=lock*clamp(1-endDeck/.72)*(nosePane?-d.front:d.rear)*.32;
    }
    out[i]=x+give*(-Math.sign(x)*side*(.116+.225*doorHeight+.065*sideFold)+nose*front*.050-tail*rear*.04);
    out[i+1]=y+give*(front*(.37*hoodFold*deck-.16*nose)+rear*(.26*trunkFold*deck-.14*tail)
      +side*((p.sill-.17-y)*.24-.044*sideFold));
    out[i+2]=z+frameShift+give*(-front*(.50+.105*clamp(across+.45))*nose+rear*.51*tail);
  }
  function isWheel(a,b,c,p){
    const s=p.s,r=s.wheel;
    function onRim(q){
      const x=Math.abs(q[0]);
      if(Math.min(Math.abs(x-s.track),Math.abs(x-s.track+.17),Math.abs(x-s.track-.005))>.002)return false;
      const dz=Math.min(Math.abs(q[2]-s.axles[0]),Math.abs(q[2]-s.axles[1]));
      return dz*dz+(q[1]-r)**2<r*r+.0004;
    }
    return onRim(a)&&onRim(b)&&onRim(c);
  }
  const edge=(a,b)=>(a[0]-b[0])**2+(a[1]-b[1])**2+(a[2]-b[2])**2;
  function mid(a,b){return a.map((v,i)=>(v+b[i])*.5);}
  function prepare(source,p,whole,side){
    const vertices=[],fixed=[];
    function divide(a,b,c,depth,wheel){
      // Split the longest shared edge at its midpoint. Broad panels acquire
      // a crease through the middle without adding any detail to the tires.
      if(!wheel&&depth<7){
        const ab=edge(a,b),bc=edge(b,c),ca=edge(c,a),largest=Math.max(ab,bc,ca);
        if(largest>.68*.68){
          if(largest===ab){const m=mid(a,b);divide(a,m,c,depth+1,false);divide(m,b,c,depth+1,false);}
          else if(largest===bc){const m=mid(b,c);divide(a,b,m,depth+1,false);divide(a,m,c,depth+1,false);}
          else{const m=mid(c,a);divide(a,b,m,depth+1,false);divide(m,b,c,depth+1,false);}
          return;
        }
      }
      fixed.push(wheel?1:0);vertices.push(...a,...b,...c);
    }
    for(let i=0;i<source.length;i+=18){
      const a=source.subarray(i,i+6),b=source.subarray(i+6,i+12),c=source.subarray(i+12,i+18);
      divide(a,b,c,0,whole&&isWheel(a,b,c,p));
    }
    return {rest:new Float32Array(vertices),fixed:new Uint8Array(fixed),px:side*p.s.hingeX,pz:side?p.s.hingeZ:0,variants:new Map()};
  }
  function normalLight(data,i){
    const ax=data[i+6]-data[i],ay=data[i+7]-data[i+1],az=data[i+8]-data[i+2];
    const bx=data[i+12]-data[i],by=data[i+13]-data[i+1],bz=data[i+14]-data[i+2];
    const x=ay*bz-az*by,y=az*bx-ax*bz,z=ax*by-ay*bx;
    const len=Math.sqrt(x*x+y*y+z*z);return len>.000001?(.15*x+.33*y+.19*z)/len:0;
  }
  function bake(part,p,d){
    const {rest,px,pz}=part,data=new Float32Array(rest);
    for(let i=0,j=0;i<rest.length;i+=18,j++){
      if(part.fixed[j])continue;
      for(let k=i;k<i+18;k+=6){bend(rest[k]+px,rest[k+1],rest[k+2]+pz,p,d,data,k);data[k]-=px;data[k+2]-=pz;}
      const shade=Math.max(.64,Math.min(1.24,1+(normalLight(data,i)-normalLight(rest,i))*.94));
      const x=rest[i]+px,z=rest[i+2]+pz,head=d.front>(x<0?.89:.53)&&z>p.front-.055;
      const back=d.rear>(x>0?.92:.53)&&z<p.rear+.055&&Math.abs(x)>.26;
      for(let k=i;k<i+18;k+=6){
        const material=Math.floor((rest[k+3]+.25)*.5);
        const brokenHead=head&&material===5;
        const brokenTail=back&&(material===6||rest[k+3]>.92&&rest[k+4]<.47&&rest[k+5]<.43);
        if(brokenHead||brokenTail){
          data[k+3]=(brokenHead?.26:.32)*shade;data[k+4]=(brokenHead?.27:.16)*shade;data[k+5]=(brokenHead?.25:.18)*shade;
        }else{
          data[k+3]=(rest[k+3]-2*material)*shade+2*material;data[k+4]=rest[k+4]*shade;data[k+5]=rest[k+5]*shade;
        }
      }
    }
    return data;
  }
  // Damaged buffers are disposable. The city's normal CPU buffer remains the
  // source after paint changes, repairs and WebGL context restoration.
  function buffer(view,name,car,side){
    const n=code(car.damage),original=view.models.get(name);
    if(!n||!original||!kinds.has(car.kind))return original;
    let cache=views.get(view);
    if(!cache||cache.program!==view.program){
      cache={program:view.program,sources:new WeakMap(),entries:new Set(),bytes:0,clock:0};views.set(view,cache);
    }
    const source=view.cpu.get(name),p=profile(car.kind);
    let part=cache.sources.get(source);
    if(!part){
      part=prepare(source,p,name===car.model||name===car.visual,side);
      cache.sources.set(source,part);
    }
    let model=part.variants.get(n);
    if(model){model.used=++cache.clock;return model;}
    const data=bake(part,p,levels(n)),gl=view.gl;
    while(cache.entries.size&&(cache.entries.size>=144||cache.bytes+data.byteLength>10*1024*1024)){
      let oldest=null;for(const e of cache.entries)if(!oldest||e.used<oldest.used)oldest=e;
      oldest.part.variants.delete(oldest.code);cache.entries.delete(oldest);cache.bytes-=oldest.bytes;gl.deleteBuffer(oldest.buf);
    }
    const buf=gl.createBuffer();if(!buf)return original;
    gl.bindBuffer(gl.ARRAY_BUFFER,buf);gl.bufferData(gl.ARRAY_BUFFER,data,gl.STATIC_DRAW);view.bound=null;
    model={buf,count:data.length/6,bytes:data.byteLength,used:++cache.clock,code:n,part};
    cache.entries.add(model);cache.bytes+=model.bytes;part.variants.set(n,model);return model;
  }

  // Restrained, hand-drawn fractures on the actual lens and glass surfaces.
  const cracks=[
    [[.31,.30],[.20,.38],[.10,.40],[-.03,.56],[-.25,.61]],
    [[.31,.30],[.40,.45],[.39,.53],[.52,.67],[.54,.81]],
    [[.31,.30],[.45,.28],[.53,.36],[.68,.32]],
    [[.31,.30],[.26,.23],[.31,.13],[.25,.06]],
    [[.10,.40],[.07,.50],[.01,.54]],
    [[.39,.53],[.29,.54],[.23,.63]]
  ];
  function strokes(g,point,coords,width,color){
    for(let i=1;i<coords.length;i++){
      const a=coords[i-1],b=coords[i],dx=b[0]-a[0],dy=b[1]-a[1],m=width*.5/(Math.hypot(dx,dy)||1);
      g.quad(point(a[0]-dy*m,a[1]+dx*m),point(b[0]-dy*m,b[1]+dx*m),
        point(b[0]+dy*m,b[1]-dx*m),point(a[0]+dy*m,a[1]-dx*m),color);
    }
  }
  function glassLines(g,p,front){
    const [rear,roofRear,roofFront,nose,sill,roof,baseW,roofW]=p.s.glass;
    const pos=(u,v)=>[(front?u:-u)*mix(baseW,roofW,v),mix(sill,roof,v),front?mix(nose,roofFront,v)+.027:mix(rear,roofRear,v)-.021];
    for(const line of cracks)strokes(g,pos,line,.012,"#a9c0b7");
    strokes(g,pos,[[.38,.22],[.42,.27],[.36,.37],[.26,.37],[.22,.29],[.26,.23],[.38,.22]],.014,"#789798");
  }
  function endWear(g,p,front,severe){
    const end=front?p.front:p.rear,side=front?1:-1,h=front?p.nose:p.tail,w=front?p.frontW:p.rearW;
    const plane=(x,y)=>[side*x,y,end+side*.029];
    if(severe){
      glassLines(g,p,front);
      const lens=(u,v)=>plane(w-.24+u,h-.116+v);
      g.quad(lens(-.126,-.030),lens(.122,-.030),lens(.122,.028),lens(-.126,.028),front?"#4c4d44":"#603d3f");
      g.tri(lens(-.116,-.021),lens(-.033,.019),lens(-.096,.029),front?"#c1bda1":"#ae625b");
      g.tri(lens(.018,.018),lens(.094,-.020),lens(.117,.018),front?"#a29d81":"#a55952");
      const chrome=front?"#929794":"#9a8d83";
      strokes(g,plane,[[-.21,.389],[.07,.383],[.21,.359],[.42,.352],[w-.12,.316]],.052,"#414648");
      strokes(g,plane,[[.07,.394],[.22,.37],[.44,.365],[w-.11,.323]],.019,chrome);
    }
    strokes(g,plane,[[.08,h-.080],[.17,h-.067],[.25,h-.088],[.36,h-.082]],.012,"#a59f90");
    strokes(g,plane,[[.29,h-.101],[.43,h-.102],[.49,h-.114]],.013,"#817e76");
    const sections=p.s.sections;
    function deck(x,z){
      let i=1;while(i<sections.length-1&&sections[i][0]<z)i++;
      const a=sections[i-1],b=sections[i];return [x,mix(a[2],b[2],(z-a[0])/(b[0]-a[0]))+.009,z];
    }
    const corners=front?[[-.60,end-.24],[-.28,end-.43],[-.12,end-.39],[.22,end-.58],[.49,end-.55]]:
      [[-.64,end+.32],[-.39,end+.45],[-.06,end+.39],[.28,end+.59],[.54,end+.49]];
    if(severe){
      strokes(g,deck,corners,.015,"#72766d");
      strokes(g,deck,corners.slice(1,4).map(([x,z])=>[x,z+side*.019]),.010,"#b4aa92");
    }
  }
  function sideWear(g,p,side,severe){
    const s=p.s,mid=p.sideCenter,span=(s.hingeZ-s.back)*.44;
    function skin(u,v){
      const z=mid+u*span;let i=1;while(i<s.sections.length-1&&s.sections[i][0]<z)i++;
      const a=s.sections[i-1],b=s.sections[i],f=(z-a[0])/(b[0]-a[0]),w=mix(a[1],b[1],f),h=mix(a[2],b[2],f);
      const y=s.sill||p.sill,height=y-.245+v*.35,x=w-.08+.08*clamp((height-.34)/(h-.46));
      return [side*(x+.018-s.hingeX),height,z-s.hingeZ];
    }
    strokes(g,skin,[[-.93,.06],[-.56,.11],[-.31,.10],[-.06,.15],[.51,.11],[.83,.16]],.035,"#716e68");
    strokes(g,skin,[[-.68,.05],[-.37,.07],[-.12,.047],[.28,.09]],.028,"#c9bca3");
    strokes(g,skin,[[.51,.25],[.67,.27],[.91,.25]],.023,"#a7a19a");
    if(severe){
      g.tri(skin(-.51,-.05),skin(-.20,-.14),skin(.47,-.04),"#84867e");
      strokes(g,skin,[[-.76,-.16],[-.32,-.18],[-.20,-.245],[.17,-.185],[.56,-.20]],.023,"#bdafa1");
      strokes(g,skin,[[.17,.33],[.29,.32],[.42,.37]],.021,"#c4b69e");
    }
  }
  function vaporMesh(g){
    // The centre of each fold has density; its edges and the top dissolve.
    const strip=(turn,phase)=>{
      const c=Math.cos(turn),s=Math.sin(turn);
      function v(i,r){
        const t=i/8,w=.027+.094*t,shift=.086*Math.sin(1.08+t*5.2+phase);
        const across=shift+r*w,x=across*c+.042*Math.sin(t*4.8)*s,z=across*s-.042*Math.sin(t*4.8)*c;
        return [x,.49*t,z,r===0?Math.sin(Math.PI*t)*.92:0,0,0];
      }
      for(let i=0;i<8;i++)for(const r of [-1,0]){
        const a=v(i,r),b=v(i,r+1),c=v(i+1,r+1),d=v(i+1,r);
        g.vertices.push(...a,...b,...c,...a,...c,...d);
      }
    };strip(.42,0);strip(2.04,.9);
  }
  function installPart(model,key,p,zone,severe){
    let keys=installed.get(model);if(!keys){keys=new Set();installed.set(model,keys);}
    if(keys.has(key))return;
    model(key,g=>{
      if(zone==="vapor")vaporMesh(g);
      else if(zone==="front"||zone==="rear")endWear(g,p,zone==="front",severe);
      else sideWear(g,p,zone==="left"?-1:1,severe);
    });keys.add(key);
  }
  function place(tuple,v,ground,x,y,z){
    const cp=Math.cos(v.pitch||0),sp=Math.sin(v.pitch||0),cr=Math.cos(v.lean||0),sr=Math.sin(v.lean||0);
    const h=y*cp-z*sp,along=y*sp+z*cp,across=x*cr-h*sr;
    const sn=Math.sin(v.yaw),cs=Math.cos(v.yaw);
    tuple[1]=v.x+across*cs+along*sn;tuple[2]=ground+x*sr+h*cr;tuple[3]=v.z-across*sn+along*cs;
  }
  const zones=["front","rear","left","right"];
  function world(list,model,v,ground,t){
    const d=v.damage,n=code(d);if(!n||!kinds.has(v.kind))return;
    let byId=effects.get(d);if(!byId){byId=new Map();effects.set(d,byId);}
    const id=v.garageKey||v.id||v,kind=v.kind,p=profile(kind);let fx=byId.get(id);
    if(!fx){fx={code:-1,parts:[],steam:[[],[]],seed:((v.id||0)*.618)%1,at:[0,0,0]};byId.set(id,fx);}
    if(fx.code!==n){
      fx.code=n;fx.level=levels(n);fx.parts.length=0;
      for(const zone of zones){
        const a=fx.level[zone];if(a<.20)continue;
        const severe=a>=.53,key="bodywork/"+kind+"/"+zone+(severe?"/crush":"/scuff");
        installPart(model,key,p,zone,severe);
        const side=zone==="left"?-1:zone==="right"?1:0;
        fx.parts.push([key,0,0,0,0,0,0,0,v,side]);
      }
      if(fx.level.front>=.60){
        installPart(model,"bodywork/vapor",p,"vapor",false);
        bend(p.track*.42,p.nose+.11,p.front*.76,p,fx.level,fx.at);
      }
    }
    for(const draw of fx.parts){
      const side=draw[9];draw[8]=v;draw[4]=v.yaw;draw[5]=v.pitch||0;draw[6]=v.lean||0;
      if(side){
        const open=Math.max(side===v.doorSide?v.doorAngle||0:0,side===1?v.passengerDoor||0:0);
        place(draw,v,ground,side*p.s.hingeX,0,p.s.hingeZ);draw[4]-=side*open;
      }else{draw[1]=v.x;draw[2]=ground;draw[3]=v.z;}
      list.push(draw);
    }
    if(fx.level.front<.60)return;
    const [x,y,z]=fx.at,pace=Math.abs(v.speed||0),cycle=fx.level.front>.82?1.45:2.10;
    for(let i=0;i<2;i++){
      const a=((t/cycle+fx.seed+i*.5)%1+1)%1;if(a>.80)continue;
      const opacity=Math.sin(Math.PI*a/.8)*(.27+.31*fx.level.front);
      if(opacity<.025)continue;
      const draw=fx.steam[i];draw[0]="bodywork/vapor";place(draw,v,ground,x+.025*i,y,z);
      const behind=pace*.055*a;draw[1]+=.17*a+.035*Math.sin(t*1.8+i)-Math.sin(v.yaw)*behind;
      draw[2]+=.71*a;draw[3]+=.12*a-Math.cos(v.yaw)*behind;draw[4]=v.yaw+i*1.9+.71*a;
      draw[5]=draw[6]=draw[7]=0;draw[8]=null;draw[9]=0;draw[10]=opacity;
      list.push(draw);
    }
  }

  function plan(car,l,b){
    const d=car.damage,n=code(d);if(!n||!kinds.has(car.kind))return null;
    let item=mapPlans.get(d);if(item?.n===n&&item.kind===car.kind&&item.l===l&&item.b===b)return item;
    const p=profile(car.kind),damage=levels(n),scratch=[0,0,0];
    function at(x,y,h){
      const longitudinal=y<0?p.front:-p.rear;
      bend(x*p.track/b,h,-y*longitudinal/l,p,damage,scratch);
      return [scratch[0]*b/p.track,-scratch[2]*l/longitudinal];
    }
    function shape(raw,h,closed=false){
      const dst=[],len=raw.length,segments=closed?len:len-1;
      for(let i=0;i<segments;i++){
        const a=raw[i],q=raw[(i+1)%len];
        const count=Math.max(1,Math.ceil(Math.hypot(q[0]-a[0],q[1]-a[1])/.32));
        for(let k=0;k<count;k++){const u=k/count;dst.push(...at(mix(a[0],q[0],u),mix(a[1],q[1],u),h));}
      }
      if(!closed)dst.push(...at(...raw.at(-1),h));
      return dst;
    }
    const hull=shape([[-b+.21,-l],[b-.21,-l],[b,-l+.28],[b,l-.24],[b-.19,l],[-b+.19,l],[-b,l-.24],[-b,-l+.28]],p.sill-.16,true);
    const shadow=hull.map((coord,i)=>coord+(i%2?.195:.14));
    const ends=[],glass=[],folds=[],rub=[];
    const van=car.kind==="van",windshield=van?-1.59:-1.10;
    function light(x,y,w,h,height){return shape([[x,y],[x+w,y],[x+w,y+h],[x,y+h]],height,true);}
    for(const side of [-1,1]){
      ends.push({
        head:light(side*(b-.34)-.18,-l+.08,.36,.12,p.nose-.105),
        back:light(side*(b-.325)-.185,l-.15,.37,.12,p.tail-.12),
        reverse:light(side*(b-.56)-.055,l-.15,.11,.11,p.tail-.12),
        badHead:damage.front>(side<0?.89:.53),badBack:damage.rear>(side>0?.92:.53)});
      const cut=side<0?damage.left:damage.right;
      if(cut>=.20){
        const sidePoints=(coords)=>shape(coords.map(([x,y])=>[side*(b+x),y]),p.sill-.14);
        rub.push({side,strong:cut>=.53,
          chip:sidePoints([[-.046,-.76],[-.119,-.49],[-.094,-.20],[-.137,.02],[-.082,.29]]),
          trim:sidePoints([[-.081,-.54],[-.133,-.34],[-.138,-.15],[-.171,-.04]])});
      }
    }
    function pane(front){
      const offset=front?windshield:.72,span=front?.51:.60;
      for(const stroke of cracks){
        const line=[];for(const [u,v] of stroke)line.push((front?u:-u)*(b-.16),offset+span*(front?v:1-v));glass.push(line);
      }
    }
    if(damage.front>=.20){
      const y=-l;
      folds.push({strong:damage.front>=.53,
        line:shape([[-.64,y+.34],[-.32,y+.55],[-.12,y+.48],[.13,y+.66],[.46,y+.56]],p.nose),
        glint:shape([[-.31,y+.59],[-.12,y+.52],[.13,y+.70]],p.nose)});
      if(damage.front>=.53)pane(true);
    }
    if(damage.rear>=.20){
      const y=l;
      folds.push({strong:damage.rear>=.53,
        line:shape([[-.57,y-.22],[-.35,y-.44],[-.05,y-.35],[.34,y-.47]],p.tail),
        glint:shape([[-.33,y-.48],[-.05,y-.39],[.12,y-.43]],p.tail)});
      if(damage.rear>=.53&&!van)pane(false);
    }
    item={n,kind:car.kind,l,b,damage,hull,shadow,ends,folds,glass,rub,vent:at(.36,-l+.57,p.nose)};
    mapPlans.set(d,item);return item;
  }
  function trace(c,points,closed){
    c.beginPath();c.moveTo(points[0],points[1]);
    for(let i=2;i<points.length;i+=2)c.lineTo(points[i],points[i+1]);
    if(closed)c.closePath();
  }
  function fill(c,points,color){trace(c,points,true);c.fillStyle=color;c.fill();}
  function line(c,points,color,width){trace(c,points,false);c.strokeStyle=color;c.lineWidth=width;c.stroke();}
  function mapBody(c,a,body){
    fill(c,a.hull,body);c.strokeStyle="#435054";c.lineWidth=.065;c.stroke();
    for(const end of a.ends)fill(c,end.head,end.badHead?"#5e655f":"#ffe9b7");
  }
  function mapTrim(c,a,car,t){
    const lit=car.brakes>.18||car.handbrake>.48;
    for(const end of a.ends){
      fill(c,end.back,end.badBack?"#633f45":lit?"#ff5344":"#a7464b");
      if(car.reversing)fill(c,end.reverse,"#fff5c9");
    }
    for(const crease of a.folds){
      line(c,crease.line,crease.strong?"rgba(59,69,68,.74)":"rgba(85,89,79,.46)",crease.strong?.064:.039);
      if(crease.strong)line(c,crease.glint,"rgba(211,204,174,.85)",.042);
    }
    for(const coords of a.glass)line(c,coords,"#bad0c6",.030);
    for(const scrape of a.rub){
      const side=scrape.side;
      const open=Math.max(side===car.doorSide?car.doorAngle||0:0,side===1?car.passengerDoor||0:0);
      if(open>.08)continue;
      line(c,scrape.chip,"#74776a",scrape.strong?.09:.066);
      line(c,scrape.trim,"#d4c7a6",.040);
    }
    if(a.damage.front<.60)return;
    const opacity=c.globalAlpha,cycle=a.damage.front>.82?1.45:2.1;
    const [vx,vy]=a.vent,lag=Math.min(1.25,Math.abs(car.speed||0)*.048);
    for(let i=0;i<2;i++){
      const age=((t/cycle+i*.5)%1+1)%1;if(age>.80)continue;
      const density=Math.sin(Math.PI*age/.8),r=.097+.15*age,x=vx+.27*age+.061*Math.sin(t*1.5+i*2),y=vy+(lag-.35)*age;
      c.globalAlpha=opacity*(.36+.23*a.damage.front)*density;c.strokeStyle="#e2e2d2";c.lineCap="round";c.lineWidth=r*.71;
      c.beginPath();c.moveTo(x-r*.72,y+r*.72);c.quadraticCurveTo(x+r*.43,y+r*.66,x+r*.64,y-r*.20);
      c.quadraticCurveTo(x+r*.72,y-r*.75,x+r*.22,y-r);c.stroke();
    }
    c.globalAlpha=opacity;
  }
  window.BayBodyworkArt={buffer,world,plan,mapShadow:(c,a)=>fill(c,a.shadow,"#62645b"),mapBody,mapTrim};
})();
