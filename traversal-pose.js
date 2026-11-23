/* The street rig and the overhead figure share the same planted palms, knees and soles. */
(() => {
  "use strict";
  const pi=Math.PI,tau=2*pi,clip=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
  const mix=(a,b,t)=>a+(b-a)*t,mid=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
  const ease=(lo,hi,x)=>{const t=clip((x-lo)/(hi-lo));return t*t*(3-2*t);};
  const pulse=(a,b,c,d,t)=>ease(a,b,t)*(1-ease(c,d,t));
  const palmBind=[[-.238,.977,.052],[.238,.977,.052]],zero=[0,0,0];
  const mapRigs=new WeakMap(),previous=new WeakMap(),traversalRevision=-2;
  const sideIndex=side=>side>0?1:0;
  function grip(action,i,fallback){
    const g=action.grips?.[i];
    return g&&Number.isFinite(g.x)&&Number.isFinite(g.y)&&Number.isFinite(g.z)?[g.x,g.y,g.z]:fallback;
  }
  function rung(a,offset,parity){
    const gap=clip(a.rungSpacing||.30,.15,.48),base=a.rungBase??gap,height=a.travel||0;
    const count=(height+offset-base-parity*gap)/(2*gap),whole=Math.floor(count),phase=count-whole;
    const move=ease(.53,.98,phase);
    let abs=base+gap*(parity+2*(whole+move));
    if(Number.isFinite(a.rungTop))abs=Math.min(abs,a.rungTop);
    return {y:abs-height,arc:Math.sin(pi*move)};
  }
  function ladder(a){
    const gap=clip(a.rungSpacing||.30,.15,.48),depth=a.rungDepth??.30;
    const cycle=pi*(a.travel||0)/gap,weight=Math.sin(cycle),roll=.065*weight,feet=[],hands=[];
    for(const side of [-1,1]){
      const i=sideIndex(side),foot=rung(a,.22+gap*.55,i),hand=rung(a,1.49+gap*.47,1-i);
      const pitch=-.11-.21*foot.arc,s=Math.sin(pitch),c=Math.cos(pitch);
      // Use the boot's actual ball of the sole. During stance its world position is a rung center.
      feet.push({at:[side*.128,foot.y+.153*c+.066*s+.022,depth-.066*c+.153*s-.105*foot.arc],pitch});
      hands.push({at:[side*(.225+.035*hand.arc),hand.y+.026,depth-.062*hand.arc],pole:[side,.11,-.72]});
    }
    return {hip:[-.036*weight,.91-.018*Math.cos(cycle*2),-.006],lean:.205+.029*Math.cos(cycle*2),
      yaw:-.065*weight,roll,head:-.16+.045*clip(-(a.stride||0),-1,1),headYaw:.077*weight,
      feet,hands};
  }
  function vault(a,t){
    const h=a.height??.82,flight=Math.sin(pi*t),tuck=pulse(.04,.34,.62,.94,t);
    const near=pulse(.06,.22,.35,.54,t),swing=pulse(.025,.25,.67,.90,t);
    const right=grip(a,1,[.24,h-.48*flight,(.47-t)*2.65]);
    const left=grip(a,0,[-.20,h-.48*flight,(.39-t)*2.65]);
    const plant=pulse(.085,.26,.59,.79,t)*pulse(-.60,-.19,.50,.91,right[2]);
    const compression=pulse(.01,.085,.105,.24,t)+.9*pulse(.78,.9,.93,1,t);
    const hips=.95-.385*tuck-.10*compression;
    const height=mix(hips,Math.min(hips,Math.max(.33,right[1]+.20)),plant);
    const feet=[],hands=[];
    for(const side of [-1,1]){
      const lead=side<0,fold=lead?pulse(.045,.25,.73,.90,t):pulse(.10,.30,.76,.94,t);
      const toeForward=lead ? .21 : .075;
      const sole=Math.max(.169+.38*fold,(right[1]+.215)*fold);
      feet.push({at:[side*.12-(lead ? .51 : .43)*swing,sole,.04+toeForward*fold-(lead ? .24 : .43)*flight*(1-ease(.41,.73,t))+.20*pulse(.64,.77,.85,1,t)],
        pitch:(lead ? .20 : .40)*fold-.16*pulse(.72,.83,.91,1,t),yaw:-.2*swing,
        pole:[-.30*fold,.10+.80*fold,1]});
      const arm=[side*(.236+.22*tuck),lead ? height+.09+.15*flight+.09*swing : height+.04-.16*tuck,lead ? .06+.26*flight : .04-.14*flight];
      hands.push({at:mid(arm,lead?left:right,lead?near:plant),pole:[side*.86,-.18,-.75]});
    }
    return {hip:[-.13*swing,height,mix(-.038*compression,clip(right[2]-.22,-.18,.20),plant)],lean:.12+.91*tuck+.19*compression,
      yaw:.39*swing,roll:-.62*swing,head:.05+.17*tuck,headYaw:-.23*swing,feet,hands};
  }
  function mantle(a,t){
    const height=a.height??1.5,rise=ease(.14,.87,t)*height,plant=pulse(.05,.24,.63,.87,t);
    const top=grip(a,1,[.22,height-rise,.42-.77*ease(.20,.87,t)]);
    const press=pulse(.31,.53,.72,.90,t),knee=pulse(.30,.57,.68,.92,t);
    const hips=.95-.29*press-.12*pulse(.67,.81,.85,.995,t);
    const low=plant*(1-ease(.75,1.15,top[1]));
    const bodyY=mix(hips,Math.min(hips,Math.max(.29,top[1]+.10+.14*ease(.61,.77,t))),Math.max(press,low));
    const feet=[],hands=[];
    for(const side of [-1,1]){
      const lead=side>0,hop=lead?knee:pulse(.49,.74,.81,.98,t);
      const lip=grip(a,sideIndex(side),[side*.209,top[1],top[2]]);
      const onto=lead?pulse(.37,.57,.74,.95,t):pulse(.61,.78,.82,.98,t);
      const climb=[side*(.113+.07*hop),.167+.18*hop,lead ? .04+.28*hop : -.04-.18*hop];
      const over=lead?ease(.56,.76,t):ease(.68,.86,t);
      const shoe=mid(climb,[side*(lead ? .154 : .14),clip(top[1]+.169+.10*Math.sin(pi*over),.169,1.08),clip(lip[2]+(lead ? .24 : .19),-.26,.51)],onto);
      // Slide the shoe up the near face first. Its toe can move over the edge once the sole clears.
      shoe[1]=Math.min(shoe[1],bodyY-.145);
      shoe[2]=Math.min(shoe[2],lip[2]-.165+.55*over);
      feet.push({at:shoe,pitch:(lead ? .09 : .40)*hop-.11*onto,yaw:side*.06*hop,
        hinge:[1,.15*hop,side*.30*hop]});
      const track=lead?plant:pulse(.025,.20,.57,.82,t);
      hands.push({at:mid([side*(.235+.14*press),bodyY+.05+.09*hop,.04+.19*hop],lip,track),
        pole:[side*.82,-.30+.44*press,-.75]});
    }
    const ahead=-.018+.049*press+clip((top[2]-.16)*.78,-.23,.38)*plant;
    return {hip:[-.046*knee,bodyY,mix(Math.min(ahead,top[2]-.18),ahead,ease(-.08,.18,bodyY-top[1]))],lean:.06+.83*press+.10*knee+.42*low*(1-press),
      yaw:.15*knee,roll:-.085*knee,head:-.14+.27*press,headYaw:-.10*knee,feet,hands};
  }
  function drop(a,t){
    const severity=clip(a.impact??(a.height??2)/3,.26,1),fall=pulse(0,.2,.58,.80,t);
    const landing=pulse(.735,.85,.875,1,t),feet=[],hands=[];
    for(const side of [-1,1]){
      const lead=side>0;
      feet.push({at:[side*(.112+.073*landing),.169+(lead?.135:.225)*fall,.025+side*.058+(lead?.125:-.13)*fall],
        pitch:(lead?.14:.38)*fall-.09*landing,yaw:side*.09*landing});
      hands.push({at:[side*(.23+.26*fall+.09*landing),1.02+.55*fall-.20*landing,.03+.08*fall+.31*landing],pole:[side,-.45,-.55]});
    }
    return {hip:[.021*fall,.95-.07*fall-(.23+.16*severity)*landing,-.125*landing],
      lean:.05+.10*fall+(.39+.21*severity)*landing,yaw:.09*fall,roll:.04*fall,head:-.02+.17*landing,headYaw:0,feet,hands};
  }

  // Preserve original bone lengths when limbs fold around the rung or ledge.
  function joint(l,arm,goal,pole){
    const from=arm?l.shoulder:l.hip,bend=arm?l.elbow:l.knee,tip=arm?l.hand:l.ankle;
    const first=arm?l.arm:l.thigh,second=arm?l.forearm:l.shin;
    const dx=goal[0]-from[0],dy=goal[1]-from[1],dz=goal[2]-from[2],n=Math.hypot(dx,dy,dz);
    const x=n>1e-7?dx/n:0,y=n>1e-7?dy/n:-1,z=n>1e-7?dz/n:0;
    const span=first.length+second.length-.0002,slack=.012;
    let len=clip(n,Math.abs(first.length-second.length)+.003,span);
    if(n>span-slack)len=span-slack*Math.exp(-(n-span+slack)/slack);
    const along=(first.length**2-second.length**2+len**2)/(2*len);
    const perpendicular=Math.sqrt(Math.max(0,first.length**2-along**2));
    let dot=x*pole[0]+y*pole[1]+z*pole[2],bx=pole[0]-dot*x,by=pole[1]-dot*y,bz=pole[2]-dot*z;
    if(Math.hypot(bx,by,bz)<.005){bx=.97-x*x*.97;by=-x*y*.97;bz=-x*z*.97;}
    const factor=perpendicular/(Math.hypot(bx,by,bz)||1);
    tip[0]=from[0]+x*len;tip[1]=from[1]+y*len;tip[2]=from[2]+z*len;
    bend[0]=from[0]+x*along+bx*factor;bend[1]=from[1]+y*along+by*factor;bend[2]=from[2]+z*along+bz*factor;
    first.aim(from,bend);second.aim(bend,tip);
  }
  function palm(l,to,pole){
    const bind=palmBind[sideIndex(l.side)],wrist=to.slice(),p=[];
    for(let i=0;i<3;i++){
      joint(l,true,wrist,pole);l.forearm.map(bind,p);
      for(let j=0;j<3;j++)wrist[j]=l.hand[j]+to[j]-p[j];
    }
  }
  function angles(b){
    const m=b.m;return [Math.atan2(-m[6],m[5]),Math.atan2(-m[8],m[0]),Math.asin(clip(m[4],-1,1))];
  }
  const pivot=b=>b.map(b.pivot,[]);
  function restFrame(r){
    return {hip:pivot(r.pelvis),pelvis:angles(r.pelvis),chest:angles(r.chest),head:angles(r.head),
      feet:r.sides.map(l=>({at:pivot(l.shoe),angles:angles(l.shoe),knee:pivot(l.shin)})),
      hands:r.sides.map((l,i)=>({at:l.forearm.map(palmBind[i],[]),elbow:pivot(l.forearm)}))};
  }
  function poleFrom(midpoint,a,b,pole,w){
    const center=mid(a,b,.5),v=midpoint.map((n,i)=>n-center[i]),len=Math.hypot(...v);
    return mid(len>.001?v.map(n=>n/len):pole,pole,w);
  }
  function apply(r,base,f,w){
    const from=base&&w<1,draw=(b,at,turn,old)=>b.place(at,...(from?mid(old,turn,w):turn));
    const hip=from?mid(base.hip,f.hip,w):f.hip;
    draw(r.pelvis,hip,[f.lean*.24,.38*f.yaw,f.roll*.60],base?.pelvis);
    r.pelvis.map(r.chest.pivot,r.pivot);draw(r.chest,r.pivot,[f.lean,f.yaw,f.roll],base?.chest);
    r.chest.map(r.head.pivot,r.pivot);draw(r.head,r.pivot,[f.head,f.headYaw,f.roll*.40],base?.head);
    for(let i=0;i<r.sides.length;i++){
      const l=r.sides[i],foot=f.feet[i],hand=f.hands[i];
      r.pelvis.map(l.thigh.pivot,l.hip);r.chest.map(l.arm.pivot,l.shoulder);
      const ankle=from?mid(base.feet[i].at,foot.at,w):foot.at,knuckle=from?mid(base.hands[i].at,hand.at,w):hand.at;
      let knee=foot.pole||[l.side*.13,.07,1];
      if(foot.hinge){
        // A folded knee rotates around its hinge even as the boot swings past the hips.
        const x=ankle[0]-l.hip[0],y=ankle[1]-l.hip[1],z=ankle[2]-l.hip[2],[hx,hy,hz]=foot.hinge;
        knee=[y*hz-z*hy,z*hx-x*hz,x*hy-y*hx];
        const n=Math.hypot(...knee)||1;knee=knee.map(v=>v/n);
      }
      joint(l,false,ankle,from?poleFrom(base.feet[i].knee,l.hip,ankle,knee,w):knee);
      draw(l.shoe,l.ankle,[foot.pitch,foot.yaw||0,0],base?.feet[i].angles);
      palm(l,knuckle,from?poleFrom(base.hands[i].elbow,l.shoulder,knuckle,hand.pole,w):hand.pole);
    }
    r.skin();
  }
  function pose(r,m,a){
    if(!r||!m)return false;
    if(!a){if(r.lastRevision!==traversalRevision)return false;previous.delete(r);return r.update(m);}
    const t=clip(a.t||0),kind=a.kind;
    if(!["ladder","mantle","vault","drop"].includes(kind))return false;
    const w=clip(a.blend??1)*(kind==="ladder"?1:pulse(0,.075,.955,1,t));
    if(w<.001){previous.delete(r);return r.update(m);}
    const last=previous.get(r),g=a.grips;
    // The detached overhead skeleton can be sampled repeatedly at a frozen rung.
    if(r.lastRevision===traversalRevision&&last?.revision===m.revision&&last.action===a&&last.t===t&&last.weight===w&&last.travel===a.travel&&last.stride===a.stride&&!g)return false;
    let rest=null;
    if(w<1){r.update(m);rest=restFrame(r);}
    const f=kind==="ladder"?ladder(a):kind==="mantle"?mantle(a,t):kind==="vault"?vault(a,t):drop(a,t);
    apply(r,rest,f,w);
    // An ordinary update must restore walking even when the action ends between gait revisions.
    r.lastRevision=traversalRevision;previous.set(r,{action:a,t,weight:w,travel:a.travel,stride:a.stride,revision:m.revision});return true;
  }

  const street={body:"#398e86",short:"#556d80",trim:"#a4b698",shoe:"#8da39a",heel:"#ce9077"};
  function map(c,px,py,s,actor,a){
    if(!actor||!a||s<=0)return;
    const key=actor.motion||actor;
    let local=mapRigs.get(key);
    if(!local){
      const r=new BayPlayerMesh(["#af7353",street.body,street.short]);
      r.bindings.length=0;r.rest=r.vertices=new Float32Array(0);
      local={r,m:actor.motion||new BayPlayerMotion()};mapRigs.set(key,local);
    }
    const {r,m}=local;pose(r,m,a);
    if(r.lastRevision!==traversalRevision)r.update(m);
    const yaw=actor.yaw||0,cs=Math.cos(yaw),sn=Math.sin(yaw);
    const kit=window.BayCourtPlayers?.kits?.[actor.kit],cloth=kit||street,skin="#b68160";
    // A slight side view makes the two hands and the raised knee readable from above.
    const P=p=>[1.15*(cs*p[0]+sn*p[2])+.14*p[1],1.15*(sn*p[0]-cs*p[2])-.28*p[1]];
    c.save();c.translate(px(actor.x),py(actor.z));c.scale(s,s);c.lineCap="round";c.lineJoin="round";
    const line=(a,b,color,w)=>{const x=P(a),y=P(b);c.strokeStyle=color;c.lineWidth=w;c.beginPath();c.moveTo(...x);c.lineTo(...y);c.stroke();};
    const blob=(p,x,z,color,turn=yaw)=>{const q=P(p);c.fillStyle=color;c.beginPath();c.ellipse(q[0],q[1],x,z,turn,0,tau);c.fill();};
    const at=(b,x,y,z)=>b.map([x,y,z],[]);
    const spine=pivot(r.chest),head=at(r.head,0,1.68,0),hip=pivot(r.pelvis);
    blob(zero,.40,.22,"rgba(61,56,57,.24)",.22);
    for(const l of r.sides){
      const heel=at(l.shoe,l.side*.111,.065,-.082),toe=at(l.shoe,l.side*.111,.060,.15);
      line(l.hip,l.knee,cloth.short,.163);line(l.knee,l.ankle,kit?skin:cloth.short,.13);
      if(kit)line(l.ankle,mid(l.ankle,l.knee,.29),cloth.trim,.107);
      line(heel,toe,cloth.shoe,.129);blob(heel,.054,.047,cloth.heel||street.heel);
    }
    line(hip,spine,cloth.short,.255);
    const high=at(r.chest,0,1.38,-.006),hips=[at(r.pelvis,-.134,.971,-.005),at(r.pelvis,.134,.971,-.005)];
    const sh=r.sides.map(l=>l.shoulder),torso=[...hips,sh[1],sh[0]];
    c.beginPath();torso.forEach((p,i)=>{const q=P(p);if(i)c.lineTo(...q);else c.moveTo(...q);});c.closePath();c.fillStyle=cloth.body;c.fill();
    line(sh[0],sh[1],cloth.body,.125);line(mid(hip,spine,.35),high,cloth.body,.20);
    for(let i=0;i<2;i++){
      const l=r.sides[i],p=l.forearm.map(palmBind[i],[]),sleeve=mid(l.shoulder,l.elbow,kit ? .27 : .57);
      line(l.shoulder,l.elbow,skin,.102);line(l.shoulder,sleeve,cloth.body,.126);line(l.elbow,p,skin,.084);
      blob(p,.049,.056,"#c69470");
    }
    blob(head,.115,.12,skin);blob(at(r.head,0,1.73,-.015),.121,.111,"#37343a");
    line(at(r.head,-.074,1.745,.028),at(r.head,.022,1.77,.051),"#5c5051",.036);
    c.restore();
  }
  window.BayTraversalPose={pose,map};
})();
