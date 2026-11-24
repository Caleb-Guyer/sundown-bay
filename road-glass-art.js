/* Salt dries in tide marks above the sills. The wash works on each actual body panel. */
(() => {
  "use strict";
  const clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n)),mix=(a,b,t)=>a+(b-a)*t;
  const tau=Math.PI*2,byView=new WeakMap(),plans=new Map(),sprites=new WeakMap(),panes=new WeakMap();
  const colors=new Map();
  function pigment(hex){
    if(!colors.has(hex)){
      const c=parseInt(hex.slice(1),16);
      colors.set(hex,[((c>>16)&255)/255,((c>>8)&255)/255,(c&255)/255]);
    }
    return colors.get(hex);
  }
  const sand=pigment("#beab89"),silt=pigment("#817561"),earth=pigment("#675d4e"),
    salt=pigment("#d9cbb0"),water=pigment("#90a9a1"),shade=pigment("#373d3a");
  const tone=(a,b,f)=>[mix(a[0],b[0],f),mix(a[1],b[1],f),mix(a[2],b[2],f)];
  const css=a=>"rgb("+a.map(c=>Math.round(c*255)).join(",")+")";
  function random(seed){
    let state=seed>>>0;
    return ()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296;};
  }
  function stamp(values){
    let n=0;
    if(values)for(let i=0;i<4;i++)n+=Math.round(clamp(Number(values[i])||0)*15)*(1<<(4*i));
    return n;
  }
  const level=(code,i)=>((code>>>(4*i))&15)/15;
  const dentStamp=d=>d?Math.round(clamp(d.front||0)*15)+16*Math.round(clamp(d.rear||0)*15)+256*Math.round(clamp(d.left||0)*15)+4096*Math.round(clamp(d.right||0)*15):0;
  function cellStamp(cells){
    if(!cells)return -1;
    let code=0;for(const row of cells)for(const q of row)code=code*16+Math.round(clamp(q)*15);
    return code;
  }
  // The three lengths belong to the nozzle simulation, measured from the car's centre.
  function depositAt(row,u,average){
    if(!row)return average;
    const place=clamp(u/.64+1,0,2),i=Math.min(1,Math.floor(place));
    return mix(row[i],row[i+1],place-i);
  }
  const dampAt=(row,level,wet)=>row?wet*(.31+.69*(1-level)):wet;
  function section(rows,z){
    let i=1;
    while(i<rows.length-1&&rows[i][0]<z)i++;
    const a=rows[i-1],b=rows[i],f=clamp((z-a[0])/(b[0]-a[0]));
    return [mix(a[1],b[1],f),mix(a[2],b[2],f)];
  }
  function profile(kind){
    if(plans.has(kind))return plans.get(kind);
    const s=bayCarLayout(kind),truck=kind==="wrecker"||kind==="ambulance",rear=s.sections[0],front=s.sections.at(-1);
    const p={kind,s,truck,rear:rear[0],front:front[0],rW:rear[1],fW:front[1],tail:rear[2],nose:front[2]};
    p.grit=Array.from({length:4},(_,zone)=>{
      const rng=random(490211+zone*87169+kind.charCodeAt(0)*763);
      return Array.from({length:zone<2?66:55},()=>({
        u:rng(),v:rng(),size:.38+rng()*.89,rank:Math.pow(rng(),.8),skew:rng()-.5,light:rng()
      }));
    });
    plans.set(kind,p);return p;
  }
  function sideInfo(p,z){
    const [width,deck]=section(p.s.sections,z),r=p.truck?.478:p.s.wheel+.035;
    const d=Math.min(Math.abs(z-p.s.axles[0]),Math.abs(z-p.s.axles[1]));
    const arch=d<r?(p.truck?.394:p.s.wheel)+Math.sqrt(r*r-d*d):0;
    return {width,deck,low:Math.max(p.truck?.418:.354,arch+.022),high:deck-(p.truck?.034:.091)};
  }
  function sidePoint(p,side,z,y,lift=.008){
    const [w,h]=section(p.s.sections,z);
    // The service truck has vertical utility lockers; the other sills lean into the body.
    let x=p.truck?w:y>h-.12?w-.065*clamp((y-h+.12)/.12):w-.08+.08*clamp((y-.34)/(h-.46));
    if(p.truck&&z>p.s.back&&z<p.s.hingeZ&&y>.66)x=Math.max(.998,x);
    return [side*(x+lift),y,z];
  }
  const bonnet=[[1.397,.927,1.146],[1.64,.944,1.198],[2.29,.921,1.175],[2.64,.87,1.148],[2.796,.804,1.10]];
  function deckPoint(p,front,x,z,offset=.007){
    if(p.truck){
      if(!front){
        const [w,h]=section(p.s.sections,z);return [x,h+.013+offset,z];
      }
      const [w,h]=section(bonnet,z),r=Math.abs(x)/w;
      return [x,h+mix(.028,0,clamp((r-.67)/.33))+offset,z];
    }
    const [,h]=section(p.s.sections,z);return [x,h+offset,z];
  }
  const triangle=(a,p,q,r,c,d=c,e=c)=>a.push(...p,...c,...q,...d,...r,...e);
  function quad(a,p,q,r,s,c,d=c,e=c,f=c){triangle(a,p,q,r,c,d,e);triangle(a,p,r,s,c,e,f);}
  function fleck(a,pt,u,v,w,h,skew,col){
    const p=pt(u-w,v-.42*h),q=pt(u+w*.12,v-h),r=pt(u+w,v+.12*h),s=pt(u+w*skew,v+h);
    quad(a,p,q,r,s,col);
  }
  function wave(z,k){
    return .49+.19*Math.sin(z*4.2+k)+.13*Math.sin(z*11.3+k*1.9)+.08*Math.sin(z*24.6-k);
  }
  function splash(p,z){
    let n=0;
    for(const axle of p.s.axles){
      const d=(z-axle+.35)/.63;n=Math.max(n,Math.exp(-d*d));
    }
    return n;
  }
  function sideDeposit(parts,p,zone,dirt,wet,paint,row){
    const left=zone===0,side=left?-1:1,s=p.s;
    const base=p.truck?paint:tone(paint,pigment("#273242"),.27);
    const mud=tone(base,earth,.18+.67*dirt),dust=tone(base,sand,.26+.45*dirt),rim=tone(base,salt,.26+.41*dirt);
    const damp=tone(paint,water,.32),drip=tone(paint,shade,.35);
    const ranges=[[p.rear+.045,s.back-.012],[s.back+.012,s.hingeZ-.012],[s.hingeZ+.012,p.front-.045]];
    for(let part=0;part<ranges.length;part++){
      const [a,b]=ranges[part],onDoor=part===1,dst=onDoor?parts[zone+1]:parts[0];
      const local=(z,y,lift)=>{
        const q=sidePoint(p,side,z,y,lift);
        if(onDoor){q[0]-=side*s.hingeX;q[2]-=s.hingeZ;}
        return q;
      };
      if(dirt){
        const cuts=[a,b,...s.sections.map(v=>v[0]).filter(z=>z>a&&z<b)];
        for(let z=a+.107;z<b;z+=.107)cuts.push(z);
        cuts.sort((v,w)=>v-w);
        const stripe=z=>{
          const f=sideInfo(p,z),span=f.high-f.low,n=wave(z,zone?9:4),fan=splash(p,z),localDirt=depositAt(row,z/s.halfLength,dirt);
          const h=Math.min(Math.max(.010,span-.009),.37*localDirt*(.42+n*.65+fan*.57));
          // The pale drying margin splits and rejoins behind each wheel.
          const lo=f.low,base=dirt>.54?mud:tone(mud,dust,.41);
          return {v:[local(z,lo),local(z,lo+h*.49,.010),local(z,lo+h*(.72+.06*n),.011),local(z,lo+h,.009)],
            c:[base,tone(mud,dust,.20+.27*n),tone(dust,rim,n*.88),tone(dust,paint,.38+.18*n)]};
        };
        let last=stripe(cuts[0]);
        for(let i=1;i<cuts.length;i++){
          const now=stripe(cuts[i]);
          for(let j=0;j<3;j++)quad(dst,last.v[j],now.v[j],now.v[j+1],last.v[j+1],last.c[j],now.c[j],now.c[j+1],last.c[j+1]);
          last=now;
        }
      }
      for(let i=0;i<p.grit[zone].length;i++){
        const n=p.grit[zone][i],z=mix(p.rear+.06,p.front-.06,n.u);
        if(z<a+.036||z>b-.04)continue;
        const f=sideInfo(p,z),span=f.high-f.low;if(span<.05)continue;
        const localDirt=depositAt(row,z/s.halfLength,dirt),localWet=dampAt(row,localDirt,wet);
        if(n.rank<localDirt){
          const h=span*(.15+.79*n.v),y=f.low+h;
          const w=(.010+.040*localDirt)*n.size+.023*splash(p,z),dy=(.006+.014*localDirt)*n.size;
          const baked=n.light>.48?rim:mud;
          fleck(dst,(u,v)=>local(u,v,.017),z,y,w,dy,n.skew,baked);
          if(n.light>.81)fleck(dst,(u,v)=>local(u,v,.018),z-w*.65,y+dy*1.55,w*.26,dy*.65,n.skew,rim);
        }
        if(i%3===0&&n.rank<localWet){
          const y=f.low+span*clamp(.18+.62*n.v),w=.004+.005*n.size,h=(.022+.073*localWet)*n.size;
          fleck(dst,(u,v)=>local(u,v,.020),z,y,w,h,-.32,drip);
          fleck(dst,(u,v)=>local(u,v,.021),z+w*.45,y-h*.28,w*.65,h*.62,.21,damp);
        }
      }
    }
  }
  function endDeposit(dst,p,zone,dirt,wet,paint,row,cabinSurface=null){
    const front=zone===2,dir=front?1:-1,end=front?p.front:p.rear,wide=front?p.fW:p.rW;
    const base=tone(paint,sand,.10),mud=tone(base,silt,.34+.50*dirt),saltEdge=tone(base,salt,.27+.42*dirt);
    const spray=tone(paint,water,.33),drip=tone(paint,shade,.33);
    const glassEnd=front?p.s.glass[3]:p.s.glass[0],runway=Math.max(0,Math.abs(end-glassEnd)-.065);
    const deckAt=(x,depth)=>{
      const z=end-dir*depth;return cabinSurface?[x,cabinSurface(x,z)+.005,z]:deckPoint(p,front,x,z,.012);
    };
    const faceH=p.truck?(front?.404:.58):.343;
    const faceTop=p.truck?(front?.556:.663):Math.min(front?p.nose-.20:p.tail-.23,.54);
    const plane=(x,y)=>[x,y,p.truck?(front?2.914:-2.803):end+dir*.017];
    if(!cabinSurface&&dirt&&faceTop>faceH+.025){
      for(let i=0;i<20;i++){
        const col=k=>{
          const x=(k/20*2-1)*(wide-.084),f=wave(x*1.6,zone);
          const localDirt=depositAt(row,x/p.s.track,dirt),h=(faceTop-faceH)*.93*localDirt*(.52+.60*f);
          return {x,b:faceH+.005,mid:faceH+.005+h*.66,top:faceH+.005+h,f};
        };
        const a=col(i),b=col(i+1);
        // On the truck's rear the lift and hitch occupy the middle of the apron.
        if(p.truck&&!front&&(Math.abs(a.x)<.57||Math.abs(b.x)<.57))continue;
        quad(dst,plane(a.x,a.b),plane(b.x,b.b),plane(b.x,b.mid),plane(a.x,a.mid),mud,mud,saltEdge,saltEdge);
        quad(dst,plane(a.x,a.mid),plane(b.x,b.mid),plane(b.x,b.top),plane(a.x,a.top),saltEdge,saltEdge,tone(saltEdge,paint,.53),tone(saltEdge,paint,.53));
      }
    }
    if(runway<.10)return;
    const depthMax=Math.min(runway,p.truck&&!front?1.9:1.26),narrow=p.truck&&!front;
    if(dirt)for(const side of [-1,1]){
      const n=14;
      const position=i=>{
        const u=i/n,x=(narrow?(.60+.30*u):(.03+.88*u)*wide)*side,z=.055+.080*(1-u);
        const broken=clamp(wave(x*2.4,zone*1.3));
        const localDirt=depositAt(row,x/p.s.track,dirt),h=Math.max(0,Math.min(depthMax-z-.022,.60*localDirt*(.14+u*u*.90)*(.53+broken)));
        return [deckAt(x,z),deckAt(x,z+h*.58),deckAt(x,z+h)];
      };
      let a=position(0);
      for(let i=1;i<=n;i++){
        const b=position(i);
        quad(dst,a[0],b[0],b[1],a[1],mud,mud,tone(saltEdge,mud,.49),tone(saltEdge,mud,.49));
        quad(dst,a[1],b[1],b[2],a[2],tone(saltEdge,mud,.49),tone(saltEdge,mud,.49),tone(base,sand,.29),tone(base,sand,.29));a=b;
      }
    }
    for(let i=0;i<p.grit[zone].length;i++){
      const n=p.grit[zone][i],sign=i%2?1:-1;
      const x=sign*(narrow?.60+.26*n.u:(wide-.11)*Math.pow(n.u,.63));
      const d=.074+Math.max(0,depthMax-.16)*n.v,edge=Math.abs(x)/wide;
      const localDirt=depositAt(row,x/p.s.track,dirt),localWet=dampAt(row,localDirt,wet);
      if(n.rank<localDirt*(.52+.48*edge)){
        const w=(.011+.025*localDirt)*n.size,h=(.014+.046*edge)*n.size;
        fleck(dst,deckAt,x,d,w,h,n.skew,n.light>.45?saltEdge:mud);
      }
      if(i%3===1&&n.rank<localWet){
        const h=.015+.061*n.size;
        fleck(dst,deckAt,x,d,.007,h,n.skew,drip);
        fleck(dst,(u,v)=>{const q=deckAt(u,v);q[1]+=.0018;return q;},x+.004,d-.014,.004,h*.55,0,spray);
      }
    }
  }
  function cacheFor(view){
    let cache=byView.get(view);
    if(!cache){cache={cars:new Map(),clock:0,next:0};byView.set(view,cache);}
    return cache;
  }
  function upload(view,key,vertices){
    if(!vertices.length)return;
    const data=new Float32Array(vertices),model=view.models.get(key);
    if(!model){view.add(key,{vertices:data},true);view.bound=null;return;}
    view.cpu.set(key,data);
    const gl=view.gl;gl.bindBuffer(gl.ARRAY_BUFFER,model.buf);
    gl.bufferData(gl.ARRAY_BUFFER,data,gl.DYNAMIC_DRAW);model.count=data.length/6;view.bound=null;
  }
  function surfaceRecord(view,v,soil,rinse){
    const cache=cacheFor(view),id=v.id??v.garageKey??v;
    let rec=cache.cars.get(id);
    if(!rec){
      if(cache.cars.size<40)rec={slot:cache.next++};
      else{
        let old;
        for(const item of cache.cars.values())if(!old||item.last<old.last)old=item;
        cache.cars.delete(old.id);rec=old;
      }
      rec.id=id;rec.soil=-1;rec.keys=Array.from({length:3},(_,n)=>"road-grit/"+rec.slot+"/"+n);
      cache.cars.set(id,rec);
    }
    rec.last=++cache.clock;
    const p=profile(v.kind),color=v.color||p.s.paint;
    const cells=cellStamp(v.washCells);
    if(rec.soil===soil&&rec.rinse===rinse&&rec.color===color&&rec.kind===v.kind&&rec.cells===cells)return rec;
    const parts=[[],[],[]],paint=pigment(color);
    for(let i=0;i<4;i++){
      const d=level(soil,i),w=level(rinse,i);
      if(!d&&!w)continue;
      const row=v.washCells?.[i];
      if(i<2)sideDeposit(parts,p,i,d,w,paint,row);else endDeposit(parts[0],p,i,d,w,paint,row);
    }
    for(let i=0;i<3;i++)upload(view,rec.keys[i],parts[i]);
    Object.assign(rec,{soil,rinse,cells,kind:v.kind,color,used:parts.map(a=>a.length>0)});return rec;
  }
  function world(list,view,v,ground,t,distance=0){
    if(distance>58||!view?.gl||view.lost||!v.soil&&!v.rinse)return;
    const soil=stamp(v.soil),rinse=stamp(v.rinse);if(!soil&&!rinse)return;
    const rec=surfaceRecord(view,v,soil,rinse),s=bayCarLayout(v.kind),pitch=v.pitch||0,roll=v.lean||0;
    if(rec.used[0])list.push([rec.keys[0],v.x,ground,v.z,v.yaw,pitch,roll,0,v]);
    const cp=Math.cos(pitch),sp=Math.sin(pitch),cr=Math.cos(roll),sr=Math.sin(roll),cs=Math.cos(v.yaw),sn=Math.sin(v.yaw);
    for(let i=1;i<=2;i++)if(rec.used[i]){
      const side=i===1?-1:1,x=side*s.hingeX,z=s.hingeZ,h=-z*sp,across=x*cr-h*sr,along=z*cp;
      const open=Math.max(side===v.doorSide?v.doorAngle||0:0,side===1?v.passengerDoor||0:0);
      list.push([rec.keys[i],v.x+across*cs+along*sn,ground+x*sr+h*cr,v.z-across*sn+along*cs,v.yaw-side*open,pitch,roll,0,v,side]);
    }
  }
  function hood(view,v,ground){
    if(!view?.gl||view.lost||!window.BayDriversSeat?.hood||!v.soil)return;
    const dirt=Math.round(clamp(v.soil[2])*15),wet=Math.round(clamp(v.rinse?.[2]||0)*15);
    if(!dirt&&!wet)return;
    const cache=cacheFor(view),row=v.washCells?.[2],cells=row?row.map(q=>Math.round(clamp(q)*15)).join("/"):"";
    const key="road-grit/inside-hood",color=v.color||bayCarLayout(v.kind).paint,last=cache.hood;
    if(!last||last.dirt!==dirt||last.wet!==wet||last.color!==color||last.kind!==v.kind||last.cells!==cells){
      const vertices=[];
      endDeposit(vertices,profile(v.kind),2,dirt/15,wet/15,pigment(color),row,(x,z)=>BayDriversSeat.hood(v,x,z));
      upload(view,key,vertices);cache.hood={dirt,wet,color,kind:v.kind,cells,draw:!!vertices.length};
    }
    if(cache.hood.draw)view.draw(key,v.x,ground,v.z,v.yaw,v.pitch||0,v.lean||0);
  }
  function path(points,target=new Path2D()){
    target.moveTo(points[0][0],points[0][1]);
    for(let i=1;i<points.length;i++)target.lineTo(points[i][0],points[i][1]);
    target.closePath();return target;
  }
  function mapBody(v,soil,rinse){
    const key=v.soil||v.rinse,prior=sprites.get(key),p=profile(v.kind),color=v.color||p.s.paint;
    const cells=cellStamp(v.washCells);
    if(prior&&prior.soil===soil&&prior.rinse===rinse&&prior.color===color&&prior.kind===v.kind&&prior.cells===cells)return prior;
    const truck=p.truck,van=v.kind==="van",l=truck?2.78:van?2.32:v.kind==="hatch"?1.82:2.16,b=truck?1:van?.97:.91;
    const paint=pigment(color),parts=Array.from({length:3},()=>[]),damage=v.damage||{};
    const sideHull=(z,d)=>{
      const taper=clamp((Math.abs(z)-l+.28)/.28)*.20;
      return b-taper-.025-d*.09*Math.exp(-((z-.02)**2)/.75);
    };
    const add=(i,col,polygons)=>{if(polygons.length){const a=new Path2D();for(const pts of polygons)path(pts,a);parts[i].push([a,css(col)]);}};
    const spot=(x,z,w,h,k)=>[[x-w,z-h*.24],[x-w*.21,z-h],[x+w,z+h*.12],[x+w*k,z+h]];
    for(let zone=0;zone<4;zone++){
      const d=level(soil,zone),w=level(rinse,zone),row=v.washCells?.[zone];if(!d&&!w)continue;
      const muck=tone(paint,earth,.28+.49*d),pale=tone(paint,salt,.22+.49*d),rim=tone(paint,sand,.27+.37*d);
      if(zone<2){
        const side=zone?1:-1,hurt=(zone?damage.right:damage.left)||0;
        for(const [a,bz,part] of [[-l+.075,p.s.back-.014,0],[p.s.back+.014,p.s.hingeZ-.014,zone+1],[p.s.hingeZ+.014,l-.075,0]]){
          if(a>=bz)continue;
          const outer=[],inner=[],saltline=[],spots=[],spots2=[],rivulets=[];
          for(let i=0;i<=12;i++){
            const z=mix(a,bz,i/12),x=sideHull(z,hurt),fraction=wave(z,zone?9:4);
            const thick=.138*depositAt(row,z/p.s.halfLength,d)*(.49+.73*fraction+.41*splash(p,z));
            outer.push([side*x,z]);inner.push([side*(x-thick),z]);saltline.push([side*(x-thick*(.66+.15*fraction)),z]);
          }
          if(d){
            add(part,muck,[[...outer,...saltline.slice().reverse()]]);
            add(part,rim,[[...saltline,...inner.reverse()]]);
          }
          for(let i=0;i<p.grit[zone].length;i++){
            const n=p.grit[zone][i],z=mix(-l+.10,l-.10,n.u);
            if(z<a+.045||z>bz-.045)continue;
            let widest=truck?.31:.19;
            if(!truck&&z>-(van?1.9:1.29)&&z<(van?1.60:1.12))widest=.105;
            const x=(sideHull(z,hurt)-.018-n.v*widest)*side;
            const localDirt=depositAt(row,z/p.s.halfLength,d);
            if(n.rank<localDirt)(n.light>.48?spots:spots2).push(spot(x,z,.009+.027*n.size,.018+.040*n.size,n.skew));
            if(i%3===1&&n.rank<dampAt(row,localDirt,w))rivulets.push(spot(x,z,.006,.028+.073*n.size,-.32));
          }
          add(part,pale,spots);add(part,muck,spots2);add(part,tone(paint,water,.48),rivulets);
        }
      }else{
        const front=zone===2,sign=front?1:-1,hurt=(front?damage.front:damage.rear)||0;
        const apron=front?(van?.66:truck?1.19:.86):(van?.28:truck?1.95:.67),end=sign*(l-clamp(hurt)*.39-.085);
        const at=(x,h)=>[x,end-sign*h],deposits=[],crust=[],splashDots=[],sandDots=[],rivulets=[];
        for(const s of [-1,1]){
          const near=[],middle=[],far=[];
          for(let i=0;i<=9;i++){
            const u=i/9,r=truck&&!front?.60+.29*u:.025+u*(b-.20);
            const first=.018+.065*(1-u),localDirt=depositAt(row,r*s/p.s.track,d);
            const last=first+.362*localDirt*(.17+.9*u*u)*(.62+wave(r*2.4,zone));
            near.push(at(r*s,first));middle.push(at(r*s,mix(first,last,.57)));far.push(at(r*s,last));
          }
          deposits.push([...near,...middle.slice().reverse()]);crust.push([...middle,...far.reverse()]);
        }
        for(let i=0;i<p.grit[zone].length;i++){
          const n=p.grit[zone][i],s=i%2?1:-1,x=s*(truck&&!front?.6+.26*n.u:(b-.17)*n.u**.63);
          const h=.055+(apron-.12)*n.v,z=end-sign*h;
          const localDirt=depositAt(row,x/p.s.track,d);
          if(n.rank<localDirt*.89)(n.light>.45?splashDots:sandDots).push(spot(x,z,.012+.028*n.size,.019+.041*n.size,n.skew));
          if(i%3===1&&n.rank<dampAt(row,localDirt,w))rivulets.push(spot(x,z,.007,.024+.052*n.size,0));
        }
        if(d){add(0,muck,deposits);add(0,rim,crust);}
        add(0,pale,splashDots);add(0,muck,sandDots);add(0,tone(paint,water,.5),rivulets);
      }
    }
    const result={soil,rinse,cells,color,kind:v.kind,parts,damage:dentStamp(damage)};
    sprites.set(key,result);return result;
  }
  function map(ctx,v,x,y,scale,t){
    if(scale<2.2||!v.soil&&!v.rinse||typeof Path2D==="undefined")return;
    const soil=stamp(v.soil),rinse=stamp(v.rinse);if(!soil&&!rinse)return;
    const cached=sprites.get(v.soil||v.rinse);
    if(cached&&cached.damage!==dentStamp(v.damage))sprites.delete(v.soil||v.rinse);
    const rec=mapBody(v,soil,rinse),s=bayCarLayout(v.kind);
    ctx.save();ctx.translate(x,y);ctx.rotate(v.yaw||0);ctx.scale(scale,-scale);
    for(let i=0;i<3;i++){
      if(!rec.parts[i].length)continue;
      ctx.save();
      if(i){
        const side=i===1?-1:1,open=Math.max(side===v.doorSide?v.doorAngle||0:0,side===1?v.passengerDoor||0:0);
        if(open>.008){ctx.translate(side*s.hingeX,s.hingeZ);ctx.rotate(side*open);ctx.translate(-side*s.hingeX,-s.hingeZ);}
      }
      for(const [shape,color] of rec.parts[i]){ctx.fillStyle=color;ctx.fill(shape);}
      ctx.restore();
    }
    ctx.restore();
  }

  function paneShape(v){
    const [,,roofFront,nose,sill,roof,base,cap]=bayCarLayout(v.kind).glass;
    const width=base+cap,height=Math.hypot(roof-sill,nose-roofFront);
    return {width,height,base,cap,arms:[
      {u:.12,h:.030,length:Math.min(.55*width,.94*height),park:.11,throw:1.86},
      {u:.53,h:.040,length:Math.min(.44*width,.91*height),park:.15,throw:1.74}
    ]};
  }
  const glassX=(shape,u,h)=>(2*u-1)*mix(shape.base,shape.cap,h);
  function wiperAt(shape,arm,c,s,r,offset=0){
    const h=arm.h+(r*s+offset*c)*arm.length/shape.height;
    const x=glassX(shape,arm.u,arm.h)+(r*c-offset*s)*arm.length;
    return [.5+x/(2*mix(shape.base,shape.cap,h)),h];
  }
  const swing=c=>(1-Math.cos(tau*(c%1)))*.5;
  function swept(from,to){
    if(from===to)return null;
    if(to<from)to+=Math.ceil(from-to);
    const a=swing(from),b=swing(to);
    return [Math.floor(to)>Math.floor(from)?0:Math.min(a,b),
      Math.floor(to+.5)>Math.floor(from+.5)?1:Math.max(a,b)];
  }
  function touched(drop,shape,range){
    if(!range)return false;
    for(const blade of shape.arms){
      const x=glassX(shape,drop.u,drop.h)-glassX(shape,blade.u,blade.h),y=(drop.h-blade.h)*shape.height;
      const distance=Math.hypot(x,y)/blade.length;
      if(distance<.18||distance>1.026)continue;
      const angle=Math.atan2(y,x);
      if(angle>=blade.park+blade.throw*range[0]-.022&&angle<=blade.park+blade.throw*range[1]+.022)return true;
    }
    return false;
  }
  function drop(w,randomAge=false,foam=false){
    const f=w.rng,q=f(),r=.0013+.0048*q*q+(foam?.0013:0),mobile=q>.75||foam&&q>.47;
    return {u:.02+.96*f(),h:.02+.97*f(),size:r,mobile,foam,phase:f()*tau,
      age:randomAge?f()*6:0,life:(mobile?2.9:7)+f()*8,weight:.29+.67*f(),runner:mobile&&q>.88};
  }
  function updatePane(v,time,rain,spray,wiper){
    const key=v.soil||v;
    let w=panes.get(key);
    if(!w||w.kind!==v.kind||time-w.time>18||time<w.time){
      const seed=(Number(v.id)||v.kind.charCodeAt(0))*1153+Math.floor(time*4)+191;
      w={kind:v.kind,shape:paneShape(v),time,wiper,rng:random(seed),drops:[],spawn:0,wind:0};
      for(let i=0;i<Math.round(73*rain+43*spray);i++)w.drops.push(drop(w,true,spray>.5&&i%3===0));
      panes.set(key,w);return w;
    }
    const dt=clamp(time-w.time,0,.16),range=swept(w.wiper,wiper),speed=Math.abs(v.speed||0);
    const wind=clamp(speed/26),cross=Math.sin((v.yaw||0)+.69)*.016+clamp(v.yawRate||0,-1.4,1.4)*.11;
    w.spawn+=dt*(rain*(5.6+8.7*wind)+spray*34);
    while(w.spawn>=1){w.spawn--;if(w.drops.length<110)w.drops.push(drop(w,false,spray>.20&&w.rng()<spray*.77));}
    let kept=0;
    for(const p of w.drops){
      p.age+=dt;
      if(p.mobile){
        const r=p.size/.003,vv=(wind*.155-.046)*r*r;
        p.h+=dt*vv;p.u+=dt*(cross*.35+wind*(p.u-.50)*.074+Math.sin(p.age*4+p.phase)*.002);
      }
      if(p.age>=p.life||p.u<=.008||p.u>=.992||p.h<=.005||p.h>=.998||touched(p,w.shape,range))continue;
      w.drops[kept++]=p;
    }
    w.drops.length=kept;w.time=time;w.wiper=wiper;w.wind=wind;return w;
  }
  // A windshield is a plane with a tapered top. Interpolating in camera space
  // keeps beads on that surface as the driver's head turns past either pillar.
  function paneProjection(o,w,h){
    const focal=h*o.view.basis.f*.5,near=.137;
    const corner=(u,v)=>{
      const local=BayDriversSeat.glass(o.car,u,v);
      return BayDriversSeat.project(o.view,o.car,o.ground||0,local);
    };
    const bl=corner(0,0),br=corner(1,0),tl=corner(0,1),tr=corner(1,1);
    if(!bl||!br||!tl||!tr)return null;
    function cam(u,v){
      return [mix(mix(bl.rx,br.rx,u),mix(tl.rx,tr.rx,u),v),mix(mix(bl.uy,br.uy,u),mix(tl.uy,tr.uy,u),v),
        mix(mix(bl.depth,br.depth,u),mix(tl.depth,tr.depth,u),v)];
    }
    const pixel=p=>[w*.5+p[0]*focal/p[2],h*.5-p[1]*focal/p[2]];
    const cut=(a,b)=>{
      const f=(near-a[2])/(b[2]-a[2]);return [mix(a[0],b[0],f),mix(a[1],b[1],f),near];
    };
    const bounds=[cam(.025,.03),cam(.975,.03),cam(.975,.965),cam(.025,.965)],polygon=[];
    for(let i=0;i<4;i++){
      const a=bounds[(i+3)%4],b=bounds[i],ai=a[2]>=near,bi=b[2]>=near;
      if(ai!==bi)polygon.push(pixel(cut(a,b)));
      if(bi)polygon.push(pixel(b));
    }
    if(polygon.length<3)return null;
    return {focal,near,cam,pixel,cut,polygon};
  }
  function wiperLine(ctx,lens,a,b,width,ink){
    let start=lens.cam(a[0],a[1]),end=lens.cam(b[0],b[1]);
    if(start[2]<lens.near&&end[2]<lens.near)return;
    if(start[2]<lens.near)start=lens.cut(start,end);
    else if(end[2]<lens.near)end=lens.cut(end,start);
    const p=lens.pixel(start),q=lens.pixel(end);
    ctx.beginPath();ctx.moveTo(p[0],p[1]);ctx.lineTo(q[0],q[1]);
    ctx.lineWidth=clamp(lens.focal*width/((start[2]+end[2])*.5),.6,17);
    ctx.strokeStyle=ink;ctx.stroke();
  }
  function wipers(ctx,lens,w,wet){
    ctx.lineCap="round";ctx.lineJoin="round";
    for(let i=w.shape.arms.length-1;i>=0;i--){
      const arm=w.shape.arms[i];
      const angle=arm.park+arm.throw*swing(w.wiper),c=Math.cos(angle),s=Math.sin(angle);
      const at=(r,offset=0)=>wiperAt(w.shape,arm,c,s,r,offset);
      const foot=at(0),elbow=at(.24,-.029),clampAt=at(.59,.003),heel=at(.18,-.007),tip=at(1,-.003);
      wiperLine(ctx,lens,foot,elbow,.016,"#303b3c");
      wiperLine(ctx,lens,elbow,clampAt,.014,"#303b3c");
      wiperLine(ctx,lens,at(.021,.004),at(.239,-.023),.0037,wet?"#a3b5ab":"#748581");
      wiperLine(ctx,lens,heel,at(.56,.014),.0095,"#273334");
      wiperLine(ctx,lens,at(.56,.014),tip,.0095,"#273334");
      // The sprung saddle bears against the two points along the squeegee.
      wiperLine(ctx,lens,at(.365,.010),at(.57,.035),.0061,"#586764");
      wiperLine(ctx,lens,at(.57,.035),at(.80,.007),.0061,"#586764");
      if(wet&&w.wiper%1>.04)wiperLine(ctx,lens,at(.37,.020),at(.56,.038),.0023,"#c2cec0");
    }
  }
  // The native film shares the street depth buffer. A bead behind a pillar,
  // hand or mirror never reaches the screen. One small, reused buffer covers
  // both blades and the entire pane; a dry parked blade needs no new upload.
  function glassProgram(view){
    const cache=cacheFor(view),gl=view.gl;
    if(cache.film?.source===view.program)return cache.film.program?cache.film:null;
    const gpu={source:view.program};cache.film=gpu;
    if(!gl?.createShader)return null;
    const shaders=[];
    function compile(type,source){
      const shader=gl.createShader(type);gl.shaderSource(shader,source);gl.compileShader(shader);
      shaders.push(shader);return shader;
    }
    const program=gl.createProgram();
    const vert=compile(gl.VERTEX_SHADER,`attribute vec2 uv;attribute vec4 dye;
      uniform vec3 bottomL,bottomR,topL,topR;uniform vec2 focal,clipZ;
      varying vec2 pane;varying vec4 ink;
      void main(){vec3 p=mix(mix(bottomL,bottomR,uv.x),mix(topL,topR,uv.x),uv.y);
        gl_Position=vec4(p.xy*focal,clipZ.x*p.z+clipZ.y,p.z);pane=uv;ink=dye;}`);
    const frag=compile(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 pane;varying vec4 ink;
      void main(){if(any(lessThan(pane,vec2(.024,.012)))||any(greaterThan(pane,vec2(.976,.966))))discard;
        gl_FragColor=ink;}`);
    gl.attachShader(program,vert);gl.attachShader(program,frag);gl.bindAttribLocation(program,view.pos,"uv");
    gl.bindAttribLocation(program,view.col,"dye");gl.linkProgram(program);
    for(const s of shaders)gl.deleteShader(s);
    if(!gl.getProgramParameter(program,gl.LINK_STATUS)){gl.deleteProgram(program);return null;}
    gpu.program=program;gpu.data=new Float32Array(8192*6);gpu.buf=gl.createBuffer();gpu.u={};
    for(const name of ["bottomL","bottomR","topL","topR","focal","clipZ"])gpu.u[name]=gl.getUniformLocation(program,name);
    const clip=gl.getUniform(view.program,view.u.depth);
    gl.useProgram(program);gl.uniform2fv(gpu.u.clipZ,clip);
    gl.bindBuffer(gl.ARRAY_BUFFER,gpu.buf);gl.bufferData(gl.ARRAY_BUFFER,gpu.data.byteLength,gl.DYNAMIC_DRAW);
    gl.useProgram(view.program);view.bound=null;return gpu;
  }
  const rimInk=[.19,.28,.31],skyInk=[.86,.93,.91],glintInk=[.95,.98,.90];
  const rubberInk=[.117,.153,.157],armInk=[.22,.27,.28],steelInk=[.49,.57,.55];
  const beadRing=[[-.89,-.05],[-.64,-.66],[-.05,-.84],[.63,-.62],[.91,-.04],[.64,.53],[.055,1],[-.58,.59]];
  function filmVertices(g,w,wet){
    const shape=w.shape,data=g.data;let at=0;
    function vertex(p,color,alpha){
      data[at++]=p[0];data[at++]=p[1];data[at++]=color[0];data[at++]=color[1];data[at++]=color[2];data[at++]=alpha;
    }
    function strip(a,b,startWidth,endWidth,color,from,to){
      const x=glassX(shape,a[0],a[1]),y=a[1]*shape.height,xx=glassX(shape,b[0],b[1]),yy=b[1]*shape.height;
      const dx=xx-x,dy=yy-y,len=Math.hypot(dx,dy);
      if(len<.000001)return;
      const nx=-dy/(2*len),ny=dx/(2*len);
      const point=(cx,cy,offset)=>{
        const h=(cy+ny*offset)/shape.height;return [.5+(cx+nx*offset)/(2*mix(shape.base,shape.cap,h)),h];
      };
      const aa=point(x,y,-startWidth),bb=point(x,y,startWidth),cc=point(xx,yy,endWidth),dd=point(xx,yy,-endWidth);
      vertex(aa,color,from);vertex(bb,color,from);vertex(cc,color,to);
      vertex(aa,color,from);vertex(cc,color,to);vertex(dd,color,to);
    }
    for(const p of w.drops){
      const fade=.65+.35*clamp((p.life-p.age)*1.8),r=p.size*fade;
      const du=r/(2*mix(shape.base,shape.cap,p.h)),dh=r/shape.height,stretch=p.mobile?1.23:1;
      const pos=(x,y)=>[p.u+du*x,p.h+dh*y*(y>0?stretch:1)];
      if(p.runner){
        const end=pos(-.16,.03),tail=[p.u+.006*Math.sin(p.phase),p.h+(w.wind>.37?-.064:.042)*p.weight];
        strip(tail,end,r*.12,r*.50,skyInk,0,.38);strip(tail,pos(.17,.08),r*.07,r*.27,rimInk,0,.29);
      }
      const centre=pos(.065,.10),rim=beadRing.map(q=>pos(q[0],q[1]));
      for(let i=0;i<rim.length;i++){
        vertex(centre,rimInk,.035);vertex(rim[i],rimInk,.41);vertex(rim[(i+1)%rim.length],rimInk,.41);
      }
      strip(pos(-.77,-.05),pos(-.42,-.61),r*.19,r*.34,skyInk,.48,.86);
      strip(pos(-.42,-.61),pos(.48,-.47),r*.34,r*.13,skyInk,.86,.54);
      if(p.weight>.67||p.foam)strip(pos(.21,.60),pos(.60,.27),r*.22,r*.11,glintInk,.88,.61);
    }
    for(let i=shape.arms.length-1;i>=0;i--){
      const arm=shape.arms[i],angle=arm.park+arm.throw*swing(w.wiper),c=Math.cos(angle),s=Math.sin(angle);
      const pt=(r,offset=0)=>wiperAt(shape,arm,c,s,r,offset);
      strip(pt(0),pt(.24,-.028),.017,.014,armInk,1,1);
      strip(pt(.24,-.028),pt(.59,.003),.014,.011,armInk,1,1);
      strip(pt(.017,.004),pt(.242,-.023),.0034,.0027,steelInk,.97,.93);
      strip(pt(.178,-.006),pt(.56,.014),.0092,.010,rubberInk,1,1);
      strip(pt(.56,.014),pt(1,-.003),.010,.0078,rubberInk,1,1);
      strip(pt(.365,.010),pt(.57,.035),.0064,.0053,armInk,1,1);
      strip(pt(.57,.035),pt(.80,.007),.0053,.0043,armInk,1,1);
      if(wet)strip(pt(.37,.018),pt(.56,.037),.0025,.0018,skyInk,.64,.54);
    }
    return at;
  }
  function nativeGlass(o,w,wet){
    const view=o.view,g=glassProgram(view);
    if(!g)return false;
    const gl=view.gl;
    gl.useProgram(g.program);gl.bindBuffer(gl.ARRAY_BUFFER,g.buf);
    if(g.state!==w||g.wiper!==w.wiper||g.wet!==wet||g.length!==w.drops.length||(w.drops.length&&g.time!==w.time)){
      const end=filmVertices(g,w,wet);gl.bufferSubData(gl.ARRAY_BUFFER,0,g.data.subarray(0,end));
      g.count=end/6;g.state=w;g.wiper=w.wiper;g.wet=wet;g.length=w.drops.length;g.time=w.time;
    }
    const u=g.u;
    function corner(location,x,h){
      const p=BayDriversSeat.project(view,o.car,o.ground||0,BayDriversSeat.glass(o.car,x,h));
      gl.uniform3f(location,p.rx,p.uy,p.depth);
    }
    corner(u.bottomL,0,0);corner(u.bottomR,1,0);corner(u.topL,0,1);corner(u.topR,1,1);
    gl.uniform2f(u.focal,view.basis.f/view.basis.aspect,view.basis.f);
    gl.vertexAttribPointer(view.pos,2,gl.FLOAT,false,24,0);gl.vertexAttribPointer(view.col,4,gl.FLOAT,false,24,8);
    gl.depthMask(false);gl.enable(gl.BLEND);gl.blendFuncSeparate(gl.SRC_ALPHA,gl.ONE_MINUS_SRC_ALPHA,gl.ONE,gl.ONE_MINUS_SRC_ALPHA);
    gl.drawArrays(gl.TRIANGLES,0,g.count);gl.disable(gl.BLEND);gl.depthMask(true);
    gl.useProgram(view.program);view.bound=null;return true;
  }
  function glass(ctx,width,height,o){
    if(!ctx||!o?.car||!o.view?.basis||!window.BayDriversSeat)return;
    const wet=clamp(Number(o.rain)||0),spray=clamp(Number(o.spray)||0),t=Number(o.time)||0;
    const w=updatePane(o.car,t,wet,spray,Number(o.wiper)||0);
    if(o.view.gl&&!o.view.lost&&nativeGlass(o,w,wet>.12||spray>.1))return;
    const lens=paneProjection(o,width,height);
    if(!lens)return;
    ctx.save();ctx.beginPath();const poly=lens.polygon;ctx.moveTo(poly[0][0],poly[0][1]);
    for(let i=1;i<poly.length;i++)ctx.lineTo(poly[i][0],poly[i][1]);ctx.closePath();ctx.clip();
    // The rear-view mirror and its rim are mounted on the dry side of the pane.
    if(BayDriversSeat.mirror){
      const corners=BayDriversSeat.mirror(o.car).map(p=>BayDriversSeat.project(o.view,o.car,o.ground||0,p));
      if(corners.every(p=>p&&p.depth>=lens.near)){
        const pts=corners.map(p=>lens.pixel([p.rx,p.uy,p.depth]));
        const cx=(pts[0][0]+pts[1][0]+pts[2][0]+pts[3][0])*.25,cy=(pts[0][1]+pts[1][1]+pts[2][1]+pts[3][1])*.25;
        ctx.beginPath();ctx.rect(-1,-1,width+2,height+2);
        pts.forEach(([x,y],i)=>{const a=cx+(x-cx)*1.075,b=cy+(y-cy)*1.10;if(i)ctx.lineTo(a,b);else ctx.moveTo(a,b);});
        ctx.closePath();ctx.clip("evenodd");
      }
    }
    const drops=w.drops,wind=w.wind;
    for(const p of drops){
      const c=lens.cam(p.u,p.h);p.visible=c[2]>=lens.near;if(!p.visible)continue;
      const xy=lens.pixel(c);p.sx=xy[0];p.sy=xy[1];
      p.visible=p.sx>=-8&&p.sx<=width+8&&p.sy>=-8&&p.sy<=height+8;
      p.r=clamp(p.size*lens.focal/c[2],.56,6.8)*(.67+.33*clamp((p.life-p.age)*1.8));
    }
    // Beads have a dark refractive rim, a clear middle and one sky reflection.
    // Draw each optical layer in a batch so a shower does not add GPU passes.
    ctx.lineCap="round";ctx.beginPath();
    for(const p of drops)if(p.visible&&p.runner){
      const a=lens.cam(p.u+.006*Math.sin(p.phase),p.h+(wind>.37?-.064:.042)*p.weight);
      if(a[2]<lens.near)continue;
      const q=lens.pixel(a);ctx.moveTo(q[0],q[1]);ctx.quadraticCurveTo((q[0]+p.sx)*.5+p.r*.25,(q[1]+p.sy)*.5,p.sx,p.sy);
    }
    ctx.lineWidth=clamp(height/640,.8,2);ctx.strokeStyle="rgba(207,224,219,.38)";ctx.stroke();
    ctx.beginPath();
    for(const p of drops)if(p.visible){
      const {sx:x,sy:y,r}=p,s=p.mobile?1.27:1;
      ctx.moveTo(x-r*.84,y-r*.05);ctx.bezierCurveTo(x-r*.92,y+r*.86,x+r*.54,y+r*1.14,x+r*.83,y+r*.18);
      ctx.bezierCurveTo(x+r*.77,y-r*.34,x+r*.26,y-r*s,x-r*.10,y-r*.91*s);
      ctx.bezierCurveTo(x-r*.48,y-r*.53,x-r*.78,y-r*.42,x-r*.84,y-r*.05);
    }
    ctx.fillStyle="rgba(60,80,84,.38)";ctx.fill();
    ctx.beginPath();
    for(const p of drops)if(p.visible){
      const {sx:x,sy:y,r}=p;
      ctx.moveTo(x-r*.72,y+r*.06);ctx.quadraticCurveTo(x-r*.36,y+r*.76,x+r*.42,y+r*.44);
    }
    ctx.strokeStyle="rgba(222,235,223,.77)";ctx.lineWidth=clamp(height/920,.62,1.35);ctx.stroke();
    ctx.beginPath();
    for(const p of drops)if(p.visible&&(p.weight>.67||p.foam)){
      const {sx:x,sy:y,r}=p;ctx.moveTo(x+r*.23,y-r*.53);ctx.lineTo(x+r*.55,y-r*.25);
    }
    ctx.lineWidth=clamp(height/700,.73,1.53);ctx.strokeStyle="rgba(242,243,224,.88)";ctx.stroke();
    wipers(ctx,lens,w,wet>.12||spray>.1);ctx.restore();
  }
  window.BayRoadGlass={world,map,glass,hood};
})();
