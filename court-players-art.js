/* Sol Beach and Mercado Yard. The shot and its skinned hands share the ball's release point. */
(() => {
  "use strict";
  const tau=Math.PI*2,R=.12;
  const clamp=(v,lo=0,hi=1)=>Math.max(lo,Math.min(hi,v)),mix=(a,b,u)=>a+(b-a)*u;
  const smooth=(a,b,n)=>{const u=clamp((n-a)/(b-a));return u*u*(3-2*u);};
  const between=(a,b,u)=>[mix(a[0],b[0],u),mix(a[1],b[1],u),mix(a[2],b[2],u)];
  const darken=(s,f)=>"#"+[1,3,5].map(i=>Math.round(parseInt(s.slice(i,i+2),16)*f).toString(16).padStart(2,"0")).join("");
  const sol={home:"sol",body:"#247a76",short:"#344f5a",trim:"#f3dfac",ink:"#354e57",side:"#d57965",pale:"#f3dfac",shoe:"#d6d1b4",heel:"#6a897e"};
  const mercado={home:"mercado",body:"#854757",short:"#473e4c",trim:"#ebbc73",ink:"#433d4a",side:"#58867c",pale:"#f2deb0",shoe:"#d9bf98",heel:"#586f69"};
  const jerseys={
    sol:{...sol,number:"14",name:"MARLIN"},mercado:{...mercado,number:"14",name:"MARLIN"},
    nikki:{...sol,number:"07",name:"GRANT",skin:"#815540",hair:"#342c32",shoe:"#b87866",heel:"#485962"},
    teo:{...sol,body:"#e2ce9e",short:"#507873",trim:"#407571",ink:"#704e4d",pale:"#d38a69",side:"#719e90",number:"32",name:"CRUZ",skin:"#c18d69",hair:"#49372f",shoe:"#c6c2a2",heel:"#66837c"},
    sola:{...mercado,body:"#d8cbb0",short:"#85505c",trim:"#824555",ink:"#5d5453",pale:"#d4a357",side:"#a75660",number:"11",name:"VELEZ",skin:"#a97453",hair:"#382e35",shoe:"#a6b5a1",heel:"#7b5462"},
    luis:{...mercado,number:"34",name:"OCHOA",skin:"#91674f",hair:"#433532",shoe:"#e0c89b",heel:"#81515c"}
  };
  const street={body:"#398e86",short:"#556d80",trim:"#a4b698",skin:"#af7353",hair:"#302e37",shoe:"#99a39b",heel:"#ce9077"};
  const colors={},roles={};
  for(const id of ["nikki","teo","sola","luis"]){const j=jerseys[id];colors[id]=[j.skin,j.body,j.short];roles[id]="local";}

  function textStroke(g,plane,a,b,w,color){
    const dx=b[0]-a[0],dy=b[1]-a[1],k=w*.5/(Math.hypot(dx,dy)||1),x=-dy*k,y=dx*k;
    g.quad(plane(a[0]+x,a[1]+y),plane(b[0]+x,b[1]+y),plane(b[0]-x,b[1]-y),plane(a[0]-x,a[1]-y),color);
  }
  const letters={A:["04 10 20 34","13 23"],B:["04 00 20 31 22 02","22 33 24 04"],C:["30 10 01 03 14 34"],D:["04 00 20 31 33 24 04"],
    E:["30 00 04 34","02 22"],G:["30 10 01 03 14 34 32 22"],H:["00 04","30 34","02 32"],I:["00 20","10 14","04 24"],L:["00 04 34"],
    M:["04 00 12 20 24"],N:["04 00 34 30"],O:["10 20 31 33 24 14 03 01 10"],R:["04 00 20 31 22 02","12 34"],
    S:["30 10 01 12 22 33 24 04"],T:["00 30","20 24"],U:["00 03 14 24 33 30"],V:["00 02 14 23 30"],Z:["00 30 04 34"],
    0:["10 20 31 33 24 14 03 01 10"],1:["01 10 14","04 24"],2:["00 20 31 22 12 03 04 34"],3:["00 20 31 22 12","22 33 24 04"],
    4:["20 02 32","20 24"],7:["00 30 14"]};
  function legend(g,word,at,y,span,h,width,color){
    const pitch=span/(4*word.length-1),left=-span/2;
    for(let i=0;i<word.length;i++)for(const path of letters[word[i]]||[]){
      let prev;
      for(const code of path.split(" ")){
        const p=[left+(4*i+Number(code[0]))*pitch,y+h*.5-Number(code[1])*h/4];
        if(prev)textStroke(g,at,prev,p,width,color);prev=p;
      }
    }
  }
  function oct(y,w,f,b){
    return [[-.70*w,y,f],[.70*w,y,f],[w,y,.49*f],[w,y,-.52*b],[.70*w,y,-b],[-.70*w,y,-b],[-w,y,-.52*b],[-w,y,.49*f]];
  }
  function band(g,a,b,c,alt=c){
    for(let i=0;i<a.length;i++){const k=(i+1)%a.length;g.quad(a[i],a[k],b[k],b[i],i===2||i===5||i===6?alt:c);}
  }
  function pipe(g,p,q,w,col){g.pole(p,q,w,col,5);}
  function shirt(g,j,skin){
    const shade=darken(skin,.82),hem=.951,underarm=1.268,shoulder=1.435;
    const waist=oct(hem,.173,.108,.112),chest=oct(1.19,.184,.116,.117),edge=oct(underarm,.186,.121,.118);
    band(g,waist,chest,j.body,darken(j.body,.83));band(g,chest,edge,j.body,darken(j.body,.83));
    band(g,oct(hem,.173,.107,.112),oct(hem+.012,.173,.110,.113),darken(j.body,.70));
    // The skin section shows through both armholes and the scoop under the collar.
    band(g,oct(underarm-.015,.178,.106,.101),oct(1.413,.182,.100,.096),skin,shade);
    const neck=oct(1.445,.069,.054,.054),top=oct(1.414,.101,.087,.083);
    band(g,oct(1.409,.180,.100,.098),top,skin,shade);band(g,top,neck,skin,shade);
    const shoulderFace=(s,x,y,f)=>[s*x,y,f];
    for(const s of [-1,1]){
      const front=[[0,1.346,.125],[.035,1.366,.124],[.075,1.421,.098],[.139,shoulder,.080],
        [.144,1.384,.109],[.150,1.310,.117],[.182,underarm,.070],[.130,underarm,.121],[0,underarm,.122]];
      const back=[[0,1.409,-.113],[.044,1.411,-.111],[.079,1.427,-.089],[.139,shoulder,-.071],
        [.146,1.384,-.104],[.154,1.309,-.112],[.182,underarm,-.067],[.130,underarm,-.118],[0,underarm,-.119]];
      for(const outline of [front,back]){
        const ps=outline.map(([x,y,z])=>shoulderFace(s,x,y,z)),hub=shoulderFace(s,.098,1.309,outline===front?.124:-.120);
        for(let n=0;n<ps.length;n++)g.tri(hub,ps[n],ps[(n+1)%ps.length],j.body);
        for(const [a,b] of [[0,1],[1,2],[3,4],[4,5],[5,6]]){
          pipe(g,ps[a],ps[b],.0080,j.trim);
          const forward=outline===front?1:-1;
          const p=ps[a].slice(),q=ps[b].slice();
          const offset=a<2?s*.008:-s*.008;p[0]+=offset;q[0]+=offset;p[2]+=.001*forward;q[2]+=.001*forward;
          pipe(g,p,q,.0025,j.side);
        }
      }
      const p=(x,y,z)=>[s*x,y,z];
      g.quad(p(.075,1.421,.098),p(.139,shoulder,.080),p(.139,shoulder,-.071),p(.079,1.427,-.089),j.body);
      pipe(g,p(.139,shoulder,.080),p(.139,shoulder,-.071),.008,j.trim);
      pipe(g,p(.075,1.421,.098),p(.079,1.427,-.089),.007,j.trim);
      const slash=(z,lo,mid,hi,col)=>g.quad(p(.174,hem+.012,z*lo),p(.185,1.139,z*mid),p(.187,underarm,z*hi),p(.176,hem+.012,z*.014),col);
      for(const z of [-1,1]){
        slash(z,.027,.031,.052,j.side);
        if(j.home==="mercado")for(const y of [1.070,1.108])g.quad(p(.185,y,-.033),p(.185,y+.012,.039),p(.185,y+.021,.038),p(.185,y+.009,-.033),j.trim);
      }
    }
    const front=(x,y,d=0)=>[x,y,.124+(y-1.16)*.014+d],back=(x,y,d=0)=>[-x,y,-.121-(y-1.16)*.015-d];
    const chestPrint=(x,y,d)=>front(-x,y,d),backPrint=(x,y,d)=>back(-x,y,d);
    const number=(at,y,span,height)=>{
      const face=(x,h)=>at(x,h,.0015);
      legend(g,j.number,at,y,span,height,.023,j.ink);legend(g,j.number,face,y,span,height,.0136,j.pale);
    };
    const solTeam=j.home==="sol";
    legend(g,solTeam?"SOL":"MERCADO",chestPrint,1.288,solTeam?.122:.202,.042,.0054,j.pale);
    number(chestPrint,1.146,.138,.136);number(backPrint,1.190,.176,.180);
    legend(g,j.name,backPrint,1.343,.167,.039,.0045,j.trim);
    // Sewn laundry patch. The two gyms share a supplier but stamp their own tiny mark.
    const tab=(x,y)=>front(x,y,.005);
    g.quad(tab(.066,.978),tab(.116,.978),tab(.116,1.006),tab(.066,1.006),j.trim);
    if(solTeam){
      for(let i=0;i<6;i++)g.tri(tab(.091,.987),tab(.091+.011*Math.cos(i*Math.PI/6),.987+.010*Math.sin(i*Math.PI/6)),
        tab(.091+.011*Math.cos((i+1)*Math.PI/6),.987+.010*Math.sin((i+1)*Math.PI/6)),j.ink);
    }else for(const x of [.077,.091,.105])g.quad(tab(x-.005,.991),tab(x,.996),tab(x+.005,.991),tab(x,.986),j.ink);
  }
  function legDetails(g,j,s){
    const x=s*.109,p=(dx,y,z)=>[x+dx,y,z],out=s*.083;
    // Split shorts with hem binding over bare knees, striped crew socks and a rubber-toed high-top.
    g.quad(p(out,.765,-.065),p(out*1.08,.944,-.049),p(out*1.08,.944,.020),p(out,.765,-.016),j.side);
    g.quad(p(-.076,.766,.086),p(.076,.766,.086),p(.076,.780,.086),p(-.076,.780,.086),j.trim);
    g.quad(p(out,.766,-.073),p(out,.766,.080),p(out,.778,.080),p(out,.778,-.073),j.trim);
    const h=j.name==="OCHOA"?.365:j.name==="VELEZ"?.262:.300,shin=darken(j.pale,.84);
    g.cyl(x,.169+(h-.169)/2,.001,.063,.058,h-.169,8,j.pale);
    for(const y of [h-.025,h-.044])g.cyl(x,y,.001,.064,.064,.009,8,j.body);
    g.box(x,.146,-.020,.119,.060,.140,j.heel);
    g.quad(p(-.041,.165,-.020),p(.041,.165,-.020),p(.046,.106,.095),p(-.046,.106,.095),j.shoe);
    for(const z of [.008,.031,.053])g.quad(p(-.038,.158-z*.40,z),p(.033,.152-z*.40,z+.012),
      p(.035,.149-z*.40,z+.019),p(-.037,.156-z*.40,z+.006),shin);
    g.quad(p(s*.064,.101,-.054),p(s*.062,.119,-.032),p(s*.069,.066,.087),p(s*.068,.057,.062),j.trim);
    g.box(x,.134,-.080,.061,.050,.013,j.body);
  }
  function hairAndTape(g,id,mark){
    const j=jerseys[id],hair=j.hair;
    mark("head");
    if(id==="nikki"){
      g.cyl(0,1.725,-.019,.096,.111,.082,11,hair);
      for(const [x,y,z,r] of [[-.068,1.752,-.045,.066],[.056,1.757,-.054,.072],[.001,1.802,-.075,.075],
        [-.055,1.802,-.105,.056],[.043,1.811,-.102,.058],[0,1.766,.012,.073]]){
        g.cyl(x,y,z,r*.82,r,.061,8,hair);g.cyl(x,y+.039,z,r*.39,r*.84,.020,8,"#42363a");
      }
      g.cyl(0,1.701,-.012,.108,.107,.028,12,j.side);
      g.box(-.010,1.701,-.117,.071,.019,.015,j.trim);
    }else if(id==="teo"){
      for(const x of [-.064,-.026,.012,.048])pipe(g,[x,1.723,.060],[x-.017,1.768,-.059],.022,"#45382f");
      g.cyl(0,1.699,-.002,.107,.106,.035,12,"#eadbb8");
      g.box(.013,1.701,.105,.048,.011,.008,j.body);
      for(const s of [-1,1])g.box(s*.086,1.670,-.032,.034,.052,.065,hair);
    }else if(id==="sola"){
      for(let i=0;i<5;i++){
        const angle=(i-2)*.44,x=.085*Math.sin(angle),z=-.071-.039*Math.cos(angle);
        for(let k=0;k<3;k++)g.cyl(x+k*.003,1.686-.050*k,z-.009*k,.024-k*.002,.026-k*.002,.061,8,hair);
        g.cyl(x+.007,1.557,z-.021,.020,.021,.017,8,j.trim);
      }
      for(const s of [-1,1])pipe(g,[s*.084,1.713,.050],[s*.058,1.760,-.079],.020,hair);
      g.cyl(0,1.706,-.010,.109,.106,.020,12,j.side);
    }else{
      g.cyl(.0,1.744,-.010,.071,.101,.052,10,hair);
      g.box(.058,1.727,.034,.086,.037,.101,"#56443c",-.20);
      for(const s of [-1,1])g.box(s*.078,1.594,.011,.025,.053,.117,"#5b4940");
      g.quad([-.056,1.557,.087],[.055,1.557,.087],[.041,1.528,.078],[-.037,1.528,.078],hair);
    }
    const side=id==="sola"||id==="nikki"?-1:1,x=side*.24;
    mark("arm",side);
    if(id==="luis")g.cyl(x,1.181,.004,.061,.053,.216,8,"#536467");
    const y=id==="teo"?1.061:1.103;
    g.cyl(x,y,.015,.054,.052,.041,8,j.trim);
    g.cyl(x,y+.010,.015,.055,.053,.010,8,j.side);
  }
  function uniform(rig,j,id){
    if(!rig||!j||rig.courtUniform===id)return;
    const skin=j.skin||street.skin,raw=new BayMesh(),parts=[],original=rig.rest,originalBindings=rig.bindings;
    buildBayPerson(raw,skin,j.body,j.short,0,"runner",0,(part,side)=>parts.push({part,side,first:raw.vertices.length}));
    const g=new BayMesh(),groups=[],mark=(part,side)=>groups.push({part,side,first:g.vertices.length/6});
    // Retain the native knees, bare upper arms and hands so every street action uses the same skeleton.
    for(let i=0;i<parts.length;i++){
      const p=parts[i],end=parts[i+1]?.first??raw.vertices.length;
      if(p.part!=="leg"&&p.part!=="arm")continue;
      mark(p.part,p.side);
      for(let k=p.first;k<end;k++)g.vertices.push(raw.vertices[k]);
      if(p.part==="leg")legDetails(g,j,p.side);
    }
    mark("body");shirt(g,j,skin);
    g.cyl(0,1.482,0,.051,.057,.151,9,skin);
    // Preserve the owner's face, haircut and expression when changing clothes at the motel.
    mark("head");
    for(let i=0;i<originalBindings.length;i+=3)if(originalBindings[i].a===rig.head.m&&originalBindings[i+1].a===rig.head.m&&originalBindings[i+2].a===rig.head.m){
      for(let k=i*6;k<i*6+18;k++)g.vertices.push(original[k]);
    }
    if(j.skin)hairAndTape(g,id,mark);
    const bindings=[];
    for(let i=0;i<groups.length;i++){
      const p=groups[i],end=groups[i+1]?.first??g.vertices.length/6,limb=rig.sides[p.side===1?1:0];
      for(let k=p.first;k<end;k++)bindings.push(rig.binding(p.part,limb,g.vertices[k*6+1]));
    }
    rig.bindings=bindings;rig.rest=new Float32Array(g.vertices);rig.vertices=rig.rest.slice();rig.courtUniform=id;rig.lastRevision=-1;
    handRanges.delete(rig);poseMemo.delete(rig);
  }
  function dress(mesh,id){if(colors[id])uniform(mesh,jerseys[id],id);}
  function kit(mesh,id){if(id==="sol"||id==="mercado")uniform(mesh,jerseys[id],id);}

  function form(a,t){
    const action=a.action||"idle",s=a.side<0?-1:1,u=clamp(a.phase||0),beat=((a.beat||0)%1+1)%1;
    const handed=Number.isFinite(a.handSide)?clamp(a.handSide,-1,1):Number.isFinite(a.cross)?s*(2*smooth(0,1,a.cross)-1):s;
    const m=a.motion||{},pace=clamp(m.weight||0),run=clamp(m.run||0),stride=(m.phase||0)*tau;
    const turn=clamp(m.turn||0,-1,1),bob=Math.sin(beat*Math.PI),air=clamp((a.lift||0)/.39),breath=Math.sin((m.time??t??0)*1.85);
    const charge=action==="shoot"&&a.shot?.window?.ideal>0&&Number.isFinite(a.wind)?clamp(a.wind/a.shot.window.ideal):1;
    const f={u,s,handed,beat,action,pace,run,stride,air,breath,bob,charge,drop:.028,lean:.062,twist:0,weight:0,wide:.012,look:0};
    if(action==="dribble"){
      f.drop=.101+.040*bob+.038*run;f.lean=.195+.080*run+.050*bob;
      f.twist=handed*(.077+.115*Math.sin(tau*beat));f.weight=handed*(.022+.014*bob);f.wide=.045;
    }else if(action==="gather"){
      const curl=smooth(.04,.52,u);f.drop=mix(.105,.155,curl)+.029*Math.sin(Math.PI*u);
      f.lean=mix(.21,.105,curl);f.twist=s*mix(.11,-.084,curl);f.wide=mix(.04,.072,curl);f.look=-.13*curl;
    }else if(action==="shoot"){
      const extend=smooth(.02,.55,u),land=smooth(.69,1,u);
      f.drop=.155*(1-extend)+.066*land;f.lean=.105*(1-extend)-.048*extend+.081*land;
      f.twist=-s*.084*(1-land);f.wide=.072-.041*extend;f.look=-.13-.12*extend;
      if(charge<1&&u<.25){
        const start=form({...a,action:"gather",phase:charge},t),into=smooth(0,.25,u);
        for(const key of ["drop","lean","twist","wide","look"])f[key]=mix(start[key],f[key],into);
      }
      if(u>.76){
        const settle=smooth(.76,1,u);f.drop=mix(f.drop,.028,settle);f.lean=mix(f.lean,.062,settle);
        f.look=mix(f.look,0,settle);f.wide=mix(f.wide,.012,settle);
      }
    }else if(action==="defend"||action==="reach"){
      const stab=action==="reach"?Math.sin(Math.PI*u):0;
      f.drop=.159+.026*Math.cos(stride*2)*pace+.037*stab;f.lean=.132+.17*stab;f.twist=s*(.10+.30*stab);
      f.weight=turn*.056+s*.053*stab;f.wide=.098;f.look=-.056;
    }else if(action==="block"||action==="catch"){
      const up=Math.sin(Math.PI*u);f.drop=mix(.109,.019,up)+.026*(1-air);f.lean=.068*(1-up)-.016*up;
      f.twist=s*(.050+.07*up);f.wide=.057;f.look=-.063-.19*up;
    }else if(action==="cheer"){
      f.drop=.029+.034*Math.cos(tau*u);f.twist=-s*.16*Math.sin(tau*u);f.wide=.063;f.look=-.056;
    }
    return f;
  }
  function control(f){
    const {s,u,action,handed,beat,run,bob}=f,low=[s*.337,.989,.200],set=[s*.105,1.510,.290],release=[s*.160,1.850,.290];
    if(action==="dribble")return [handed*(.344+.026*bob)+s*.014*Math.sin(tau*beat),1.018-.17*bob-.042*run,.191+.053*run+.082*bob];
    if(action==="gather"){
      const waist=[s*.155,1.087,.329];
      return u<.37?between(low,waist,smooth(0,.37,u)):between(waist,set,smooth(.37,1,u));
    }
    if(action==="shoot"){
      const forehead=[s*.139,1.659,.253],finish=[s*.153,1.76,.330];
      const start=f.charge<1&&u<.25?control({...f,action:"gather",u:f.charge}):set;
      return u<.25?between(start,forehead,smooth(0,.25,u)):u<.56?between(forehead,release,smooth(.25,.56,u)):between(release,finish,smooth(.62,1,u));
    }
    if(action==="catch"){
      const target=[s*.056,1.495+.23*f.air,.335-.100*f.air],chest=[s*.070,1.217,.234];
      const cradle=between(target,chest,smooth(.22,.67,u));
      return u>.67?between(cradle,[s*.344,1.018-.042*run,.191+.053*run],smooth(.67,1,u)):cradle;
    }
    if(action==="block")return [s*.22,1.801,.25];
    if(action==="reach"){
      const jab=Math.sin(Math.PI*u);
      return [s*(.413-.110*jab),1.322-.19*jab,.247+.32*jab];
    }
    const swing=Math.cos(f.stride+(s<0?0:Math.PI))*f.pace;
    return [s*(.267+.027*f.pace),1.101+.084*Math.max(0,swing),.135+swing*(.15+.055*run)];
  }
  function hand(a){
    const v=control(form(a)),sn=Math.sin(a.yaw||0),cs=Math.cos(a.yaw||0);
    return {x:a.x+cs*v[0]+sn*v[2],y:(a.y||0)+(a.lift||0)+v[1],z:a.z-sn*v[0]+cs*v[2]};
  }
  function unit(q){
    const d=Math.hypot(q[0],q[1],q[2])||1;return [q[0]/d,q[1]/d,q[2]/d];
  }
  const cross=(p,q)=>[p[1]*q[2]-p[2]*q[1],p[2]*q[0]-p[0]*q[2],p[0]*q[1]-p[1]*q[0]];
  // The middle of the palm is on the leather, with the wrist set back along the finger line.
  function onBall(center,n,fingers){
    const axis=unit(n),dir=unit(fingers);
    return {p:center.map((value,i)=>value+(R+.002)*axis[i]),dir};
  }
  function armMark(f,k,ball){
    const {action,u,s,bob,handed}=f;
    if(action==="dribble"){
      const q=onBall(ball,[k*.26,.94,-.15],[-k*.13,-.10,1]),into=smooth(-.47,.58,k*handed);
      q.p[1]-=.103*bob;q.p[2]+=.023*Math.sin(f.beat*tau);
      const guard=[k*(.361+.060*bob),1.108+.092*(1-bob),.128+.088*f.pace];
      return {p:between(guard,q.p,into),dir:unit(between([k*.39,.38,1],q.dir,into))};
    }
    if(action==="gather"||action==="shoot"){
      const launch=action==="shoot",up=launch?smooth(.16,.56,u):0,reach=launch?smooth(.44,.94,u):0,late=launch?smooth(.65,1,u):0;
      const ready=q=>{
        if(launch&&u>.75){
          const rest={...f,action:"idle"},g=armMark(rest,k,control(rest)),e=smooth(.75,1,u);
          return {p:between(q.p,g.p,e),dir:unit(between(q.dir,g.dir,e))};
        }
        if(launch&&f.charge<1&&u<.25){
          const g=armMark({...f,action:"gather",u:f.charge},k,ball),e=smooth(0,.25,u);
          return {p:between(g.p,q.p,e),dir:unit(between(g.dir,q.dir,e))};
        }
        return q;
      };
      if(k===s){
        const normal=launch?[s*.10,-.80+up*.12,-.61-up*.06]:between([s*.35,.65,-.60],[s*.10,-.80,-.61],smooth(0,.87,u));
        const dir=launch?between([s*.014,.83,.54],[s*.02,.21,1],up):between([-s*.19,-.33,1],[s*.014,.83,.54],smooth(.10,.90,u));
        const q=onBall(ball,normal,dir);
        if(reach>0){q.p[2]+=.037*reach;q.dir=unit(between(q.dir,[s*.04,-.68,.73],reach));}
        q.p[1]-=.025*late;return ready(q);
      }
      const q=onBall(ball,[k*.83,-.16,-.52],[k*.16,.82,.54]);
      const curl=launch?1:smooth(.00,.47,u),heave=launch?smooth(.38,.57,u):0;
      q.p=between([k*.315,1.129,.236],q.p,curl);
      q.p[0]+=k*.146*heave;q.p[1]-=.127*heave+.155*late;q.p[2]-=.057*heave;
      q.dir=unit(between(q.dir,[k*.5,.67,.55],heave));return ready(q);
    }
    if(action==="catch"){
      const e=smooth(.67,1,u),normal=[k*.85,-.12,-.45],dir=[k*.13,.71,.69];
      if(k===s){
        const q=onBall(ball,between(normal,[k*.26,.94,-.15],e),between(dir,[-k*.13,-.10,1],e));
        q.p[0]+=k*.079*(1-smooth(.02,.39,u));return q;
      }
      const q=onBall(ball,normal,dir);q.p[0]+=k*.079*(1-smooth(.02,.39,u));
      const guard=armMark({...f,action:"dribble",handed:s,beat:0,bob:0},k,ball);
      return {p:between(q.p,guard.p,e),dir:unit(between(q.dir,guard.dir,e))};
    }
    if(action==="block"){
      const up=smooth(.02,.43,u)*(1-smooth(.65,1,u)),best=k===s;
      return {p:between([k*.365,1.284,.239],[k*(best?.213:.358),best?1.841:1.728,best?.181:.128],up),dir:unit([k*.27,.81,.41])};
    }
    if(action==="defend"||action==="reach"){
      const stab=action==="reach"?Math.sin(Math.PI*u):0;
      const q=k===s?[k*(.408-.110*stab),1.295-.19*stab,.130+.32*stab]:[k*.471,1.143+.048*Math.cos(f.stride),.093];
      return {p:q,dir:unit(k===s?between([k*.70,.41,.55],[k*.15,-.42,.92],stab):[k*.83,-.17,.58])};
    }
    if(action==="cheer"){
      const up=smooth(.01,.35,u)*(1-smooth(.80,1,u));
      return {p:between([k*.292,1.104,.097],[k*.303,1.802+.028*k*Math.sin(u*tau),.101],up),dir:unit([k*.44,.80,.22])};
    }
    if(action==="idle"&&k===s)return onBall(ball,[k*.14,-.89,-.43],[k*.061,-.17,.98]);
    const gait=Math.cos(f.stride+(k<0?0:Math.PI))*f.pace;
    return {p:[k*(.249+.042*f.pace),.989+.103*Math.max(0,gait),.026+gait*(.17+.062*f.run)],dir:unit([k*.08,-.93,.24])};
  }
  function footAt(a,f,k){
    const z0=k<0?.055:-.042,step=a.motion?.feet?.[k===1?1:0]||{y:.169,z:z0,pitch:0};
    const air=.103*f.air;
    const u=f.action==="gather"?smooth(0,.7,f.u):f.action==="shoot"?1-smooth(.68,1,f.u):0;
    return {p:[k*(.111+f.wide),step.y+air*(k===f.s?1.0:1.55),step.z+(k===f.s?.070:-.057)*u-.105*f.air],
      pitch:step.pitch+.44*f.air-.016*u};
  }
  function hips(f){
    const w=f.pace,breathe=.004*f.breath*(1-w),rhythm=.012*Math.sin(2*f.stride-.61)*w;
    return [f.weight+.022*Math.sin(f.stride)*w,.952-f.drop-.073*w+breathe+rhythm,.012*w-.025*f.drop/.155];
  }
  function chain(a,k,b,first,second,target,guide){
    const dx=target[0]-a[0],dy=target[1]-a[1],dz=target[2]-a[2],n=Math.max(.0001,Math.hypot(dx,dy,dz));
    const ux=dx/n,uy=dy/n,uz=dz/n,l=first.length,r=second.length,d=clamp(n,Math.max(.040,Math.abs(l-r)+.001),(l+r)*1.025);
    b[0]=a[0]+ux*d;b[1]=a[1]+uy*d;b[2]=a[2]+uz*d;
    const mid=(l*l-r*r+d*d)/(2*d),bend=Math.sqrt(Math.max(.000001,l*l-mid*mid)),dot=guide[0]*ux+guide[1]*uy+guide[2]*uz;
    const ex=guide[0]-dot*ux,ey=guide[1]-dot*uy,ez=guide[2]-dot*uz,g=bend/Math.max(.0001,Math.hypot(ex,ey,ez));
    k[0]=a[0]+ux*mid+ex*g;k[1]=a[1]+uy*mid+ey*g;k[2]=a[2]+uz*mid+ez*g;
    first.aim(a,k);second.aim(k,b);
  }
  const handRanges=new WeakMap(),poseMemo=new WeakMap();
  function fingersOf(mesh){
    let groups=handRanges.get(mesh);if(groups)return groups;
    groups=[[],[]];const src=mesh.rest;
    for(let k=0;k<mesh.bindings.length;k+=3){
      const i=k*6,side=src[i]<0?0:1,limb=mesh.sides[side],b=mesh.bindings[k];
      if(b.a!==limb.forearm.m||Math.max(src[i+1],src[i+7],src[i+13])>1.005)continue;
      groups[side].push(i,i+6,i+12);
    }
    handRanges.set(mesh,groups);return groups;
  }
  function fingerFrame(dir,side){
    // Finger direction follows the snap of the wrist; the signed thumb lies toward the ball.
    const y=dir.map(n=>-n),across=[1,.07*side,.07*side],z=unit(cross(across,y)),x=unit(cross(y,z));
    return [x,y,z];
  }
  function handOffset(basis,dx,dy,dz){
    return [0,1,2].map(i=>basis[0][i]*dx+basis[1][i]*dy+basis[2][i]*dz);
  }
  function pose(mesh,a,t=0){
    if(!mesh||!a)return false;
    const revision=a.motion?.revision??Math.floor(t*30);
    let last=poseMemo.get(mesh);
    if(last&&last.a===a&&last.revision===revision&&last.action===a.action&&last.side===a.side&&last.handSide===a.handSide&&
      last.cross===a.cross&&last.beat===a.beat&&last.phase===a.phase&&last.lift===a.lift&&last.wind===a.wind)return false;
    if(!last){last={};poseMemo.set(mesh,last);}
    Object.assign(last,{a,revision,action:a.action,side:a.side,handSide:a.handSide,cross:a.cross,beat:a.beat,phase:a.phase,lift:a.lift,wind:a.wind});
    const f=form(a,t),hipsAt=hips(f),at=mesh.pivot,roll=Math.sin(f.stride-.44)*f.pace,lean=f.lean+.074*f.run*f.pace,ball=control(f);
    mesh.pelvis.place(hipsAt,.04*f.pace,f.twist*.46+.065*Math.cos(f.stride)*f.pace,.031*roll+.45*f.weight);
    mesh.pelvis.map(mesh.chest.pivot,at);mesh.chest.place(at,lean,f.twist-.072*Math.cos(f.stride)*f.pace,-.33*f.weight-.031*roll);
    mesh.chest.map(mesh.head.pivot,at);mesh.head.place(at,f.look+lean*.15,f.twist*.20+.032*Math.sin(.74*(a.motion?.time??t)),-.17*f.weight);
    const bases=[],groups=fingersOf(mesh);
    for(let i=0;i<2;i++){
      const limb=mesh.sides[i],k=limb.side,foot=footAt(a,f,k);
      mesh.pelvis.map(limb.thigh.pivot,limb.hip);
      chain(limb.hip,limb.knee,limb.ankle,limb.thigh,limb.shin,foot.p,[k*.16,.022,1]);
      limb.shoe.place(limb.ankle,foot.pitch,k*(.061+f.wide*.81));
      mesh.chest.map(limb.arm.pivot,limb.shoulder);
      const mark=armMark(f,k,ball),basis=fingerFrame(mark.dir,k);bases.push(basis);
      const offset=handOffset(basis,k*.003,-.030,.016),wrist=mark.p.map((v,j)=>v-offset[j]);
      const gather=f.action==="gather"||f.action==="shoot";
      const elbow=gather&&k===f.s?[k*.50,-.88,-.13]:[k*.83,-.63,-.37];
      chain(limb.shoulder,limb.elbow,limb.hand,limb.arm,limb.forearm,wrist,elbow);
    }
    mesh.skin();
    const dst=mesh.vertices,src=mesh.rest;
    for(let j=0;j<2;j++){
      const limb=mesh.sides[j],root=limb.handPivot,at=limb.hand,b=bases[j];
      for(const k of groups[j]){
        const x=src[k]-root[0],y=src[k+1]-root[1],z=src[k+2]-root[2];
        for(let n=0;n<3;n++)dst[k+n]=at[n]+x*b[0][n]+y*b[1][n]+z*b[2][n];
      }
    }
    return true;
  }

  const ballKey="court/players/ball",channel="#604239";
  const scaled=(p,n)=>p.map(value=>value*n);
  function makeBall(g){
    const lon=20,lat=12,rings=[];
    for(let j=0;j<=lat;j++){
      const b=-Math.PI/2+Math.PI*j/lat,r=Math.cos(b)*R;
      rings.push(Array.from({length:lon},(_,i)=>[r*Math.cos(tau*i/lon),R*Math.sin(b),r*Math.sin(tau*i/lon)]));
    }
    for(let j=0;j<lat;j++)for(let i=0;i<lon;i++){
      const k=(i+1)%lon,normal=unit(between(rings[j][i],rings[j+1][k],.5)),[x,y,z]=normal;
      const shade=.94-.083*x+.11*y+.047*z;
      const c=(z>0)===(x+y*.52>0)?"#cd7949":"#d58350";
      g.quad(rings[j][i],rings[j][k],rings[j+1][k],rings[j+1][i],c,shade);
    }
    // Four moulded channels wrap the hide. The curved side panels meet the equator at their ends.
    function seam(path){
      const vertices=[],steps=42,delta=.009;
      for(let i=0;i<steps;i++){
        const a=tau*i/steps,p=path(a),before=path(a-delta),after=path(a+delta);
        const tangent=unit(after.map((v,k)=>v-before[k])),normal=unit(cross(p,tangent));
        const edge=s=>scaled(unit(p.map((v,k)=>v+normal[k]*s*.027)),R+.00065);
        vertices.push([edge(-1),edge(1)]);
      }
      for(let i=0;i<steps;i++){const next=(i+1)%steps;g.quad(vertices[i][0],vertices[next][0],vertices[next][1],vertices[i][1],channel);}
    }
    seam(a=>[Math.cos(a),0,Math.sin(a)]);
    seam(a=>[0,Math.cos(a),Math.sin(a)]);
    for(const sign of [-1,1])seam(a=>unit([Math.cos(a),Math.sin(a),sign*(.33+.57*Math.cos(a)**2)]));
    const stamp=(x,y)=>scaled(unit([x/R,y/R,1]),R+.0010);
    textStroke(g,stamp,[-.013,.034],[.017,.034],.0028,"#8d573a");
    textStroke(g,stamp,[-.009,.039],[.013,.039],.0022,"#8d573a");
    for(let i=0;i<7;i++){
      const mini=a=>stamp(.032+.0045*Math.cos(a),-.041+.0045*Math.sin(a));
      g.tri(stamp(.032,-.041),mini(i*tau/7),mini((i+1)*tau/7),channel);
    }
  }
  function worldBall(list,ball,site,t){
    if(!ball)return;
    const heading=ball.yaw??Math.atan2(ball.vx||0,ball.vz||0);
    list.push([ballKey,ball.x,ball.y,ball.z,heading,ball.spin||0,.28]);
  }
  function install(model){model(ballKey,makeBall);}

  const kitColors={street:street.body,sol:sol.body,mercado:mercado.body};
  function swatch(a){return jerseys[a.id]||jerseys[a.kit]||street;}
  function mapActor(c,a,x,y,s,t=0){
    if(!a||!(s>0))return;
    const j=swatch(a),f=form(a,t),h=hips(f),ball=control(f),yaw=a.yaw||0,cy=Math.cos(yaw),sn=Math.sin(yaw);
    const skin=j.skin||street.skin,hair=j.hair||street.hair,uniform=j!==street;
    // Paint with the same oblique height offset as the board, net and ball, including rotated courts.
    const P=q=>[q[0]*cy+q[2]*sn+.22*q[1],-q[0]*sn+q[2]*cy+.27*q[1]];
    const depth=q=>q[1]-.22*(q[0]*cy+q[2]*sn)-.27*(-q[0]*sn+q[2]*cy);
    const oval=(p,rx,rz,col,angle=0)=>{
      c.beginPath();c.ellipse(p[0],p[1],rx,rz,angle,0,tau);c.fillStyle=col;c.fill();
    };
    const stroke=(ps,w,col)=>{
      c.beginPath();c.moveTo(...ps[0]);for(let n=1;n<ps.length;n++)c.lineTo(...ps[n]);c.lineWidth=w;c.strokeStyle=col;c.stroke();
    };
    const patch=(points,col)=>{
      const ps=points.map(P);c.beginPath();c.moveTo(...ps[0]);for(let n=1;n<ps.length;n++)c.lineTo(...ps[n]);c.closePath();c.fillStyle=col;c.fill();
    };
    const offset=(p,dx,dy,dz)=>[p[0]+dx,p[1]+dy,p[2]+dz];
    const torsoCenter=[h[0],h[1]+.34,h[2]+.26*f.lean];
    const chest=(dx,dy,dz)=>offset(torsoCenter,dx+.035*f.twist*dz,dy,dz);
    c.save();c.translate(x,y);c.scale(s,-s);c.lineCap="round";c.lineJoin="round";
    const lift=a.lift||0;
    oval([-.22*lift-.068,-.27*lift-.084],.224,.154,"rgba(46,54,53,"+(.23-.085*clamp(lift/.42))+")",-yaw);
    const parts=[];
    for(const k of [-1,1]){
      const ankle=footAt(a,f,k).p,hip=offset(h,k*.105,0,0),knee=between(hip,ankle,.52);
      knee[0]+=k*(.024+f.wide*.22);knee[2]+=.065+f.drop*.73+(a.lift||0)*.12;
      parts.push([depth(ankle),()=>{
        const heel=offset(ankle,0,-.098,-.055),toe=offset(ankle,k*.010,-.12,.132);
        stroke([P(heel),P(toe)],.128,"#535d58");stroke([P(heel),P(toe)],.109,j.shoe);
        stroke([P(heel),P(between(heel,toe,.34))],.111,j.heel);
        stroke([P(offset(ankle,-.035,-.077,.077)),P(offset(ankle,.032,-.077,.066))],.013,j.trim);
        stroke([P(knee),P(ankle)],.099,uniform?skin:j.short);
        if(uniform){
          const cuff=between(ankle,knee,a.id==="luis"?.52:.33);
          stroke([P(ankle),P(cuff)],.102,j.pale);stroke([P(cuff),P(between(cuff,ankle,.11))],.103,j.body);
        }
        stroke([P(hip),P(knee)],.132,uniform?skin:j.short);
        const hem=between(hip,knee,uniform?.55:.92);
        stroke([P(hip),P(hem)],.174,j.short);if(uniform)stroke([P(offset(hip,k*.066,0,.009)),P(offset(hem,k*.065,0,.008))],.023,j.side);
      }]);
      const shoulder=chest(k*.196,.113,-.010),mark=armMark(f,k,ball),palm=mark.p,elbow=between(shoulder,palm,.52);
      elbow[0]+=k*(.037+(f.action==="gather"||f.action==="shoot"?.014:.066));elbow[1]-=.074;elbow[2]-=.041;
      // A shooting hand, rebound and steal all read above the shoulder along the corresponding arc.
      parts.push([depth(shoulder)*.33+depth(palm)*.67,()=>{
        stroke([P(shoulder),P(elbow),P(palm)],.105,darken(skin,.76));
        stroke([P(shoulder),P(elbow)],.101,skin);stroke([P(elbow),P(palm)],.081,skin);
        if(!uniform)stroke([P(shoulder),P(between(shoulder,elbow,.53))],.137,j.body);
        if(uniform&&k===(a.id==="nikki"||a.id==="sola"?-1:1)){
          stroke([P(between(elbow,palm,.65)),P(between(elbow,palm,.79))],.088,j.trim);
        }
        const tip=palm.map((v,n)=>v+.029*mark.dir[n]);stroke([P(palm),P(tip)],.069,skin);
      }]);
    }
    parts.push([depth(torsoCenter),()=>{
      const width=uniform?.183:.207;
      const shirtShape=[
        chest(-width,-.231,-.046),chest(-width*.86,-.245,.088),chest(width*.86,-.245,.088),chest(width,-.231,-.046),
        chest(width+.014,.081,-.097),chest(width*.78,.117,-.113),chest(-width*.78,.117,-.113),chest(-width-.014,.081,-.097)
      ];
      patch(shirtShape,darken(j.body,.73));
      patch([chest(-width,-.221,.05),chest(width,-.221,.05),chest(width+.006,.085,.043),chest(width*.69,.115,.112),
        chest(-width*.69,.115,.112),chest(-width-.006,.085,.043)],j.body);
      patch([chest(-width-.013,.066,-.084),chest(-width*.67,.113,-.104),chest(width*.67,.113,-.104),chest(width+.013,.066,-.084),
        chest(width+.010,.077,.055),chest(width*.68,.108,.108),chest(-width*.68,.108,.108),chest(-width-.010,.077,.055)],j.body);
      if(uniform){
        const facing=.22*sn+.27*cy<0?1:-1,r=width*.73;
        patch([chest(-r,-.204,facing*.082),chest(r,-.204,facing*.082),chest(r,.058,facing*.102),chest(-r,.058,facing*.102)],j.body);
        const at=(dx,dy)=>P(chest(-facing*dx,dy,facing*(.086+.065*(dy+.15))));
        for(let n=0;n<j.number.length;n++)for(const line of letters[j.number[n]]||[]){
          const digits=line.split(" ").map(code=>at(-.063+(n*4+Number(code[0]))*.018,.010-Number(code[1])*.040));
          stroke(digits,.015,j.ink);stroke(digits,.0072,j.pale);
        }
      }
      for(const k of [-1,1]){
        stroke([P(chest(k*width,-.181,.038)),P(chest(k*(width+.006),.075,.029))],uniform?.024:.013,uniform?j.side:j.trim);
        if(uniform){
          stroke([P(chest(k*.154,.095,-.071)),P(chest(k*.159,.095,.073))],.018,j.trim);
          stroke([P(chest(k*.079,.110,-.072)),P(chest(k*.079,.106,.073)),P(chest(k*.035,.062,.100))],.013,j.trim);
        }
      }
    }]);
    const head=chest(-f.weight*.20,.372,.076*f.lean);
    parts.push([depth(head),()=>{
      const center=P(head),ahead=q=>P(offset(head,0,0,q)),hTop=P(offset(head,0,.078,-.006));
      const base=P(offset(head,0,-.053,0));
      stroke([P(offset(head,0,-.13,-.014)),base],.108,skin);
      for(const k of [-1,1])oval(P(offset(head,k*.091,0,-.002)),.026,.026,skin);
      oval(center,.107,.103,skin,-yaw);oval(P(offset(head,0,.025,.012)),.091,.081,darken(skin,1.05),-yaw);
      oval(ahead(.077),.059,.044,skin,-yaw);oval(hTop,.100,.086,hair,-yaw);
      if(a.id==="nikki"){
        for(const [dx,dz,rad] of [[-.045,-.060,.063],[.035,-.068,.069],[.011,-.122,.067],[-.046,-.113,.049]])
          oval(P(offset(head,dx,.093,dz)),rad,rad*.90,hair);
        stroke([P(offset(head,-.081,.058,.037)),P(offset(head,-.010,.043,.066)),P(offset(head,.082,.057,.039))],.018,j.side);
      }else if(a.id==="sola"){
        for(const dx of [-.063,-.032,0,.032,.063]){
          const from=offset(head,dx,.061,-.050),end=offset(head,dx*1.15,-.096,-.123);
          stroke([P(from),P(end)],.028,hair);oval(P(end),.013,.012,j.trim);
        }
        stroke([P(offset(head,-.083,.058,.032)),P(offset(head,.001,.042,.069)),P(offset(head,.082,.058,.032))],.014,j.side);
      }else if(a.id==="teo"){
        stroke([P(offset(head,-.077,.051,.034)),P(offset(head,-.014,.036,.078)),P(offset(head,.078,.052,.042))],.024,"#e6d6af");
      }else{
        stroke([P(offset(head,-.041,.080,-.008)),P(offset(head,.040,.074,.043))],.021,a.id==="luis"?"#675148":"#4c4140");
      }
    }]);
    parts.sort((u,v)=>u[0]-v[0]);for(const entry of parts)entry[1]();c.restore();
  }
  function mapBall(c,b,site,px,py,s,t=0){
    if(!b||!(s>0))return;
    const floor=site?.y||0,h=Math.max(0,b.y-floor),p=site&&window.BayCourtPlaces?BayCourtPlaces.mapPoint(b,site):{x:b.x+.22*h,z:b.z+.27*h};
    const x=typeof px==="function"?px(p.x):px,y=typeof py==="function"?py(p.z):py,r=Math.max(2.5,s*R);
    c.save();
    c.beginPath();c.ellipse(x-.22*h*s+.018*s,y+.27*h*s+.025*s,r*(1.04+.12*clamp(h/4)),r*.65,-.25,0,tau);
    c.fillStyle="rgba(49,53,47,"+(.33-.17*clamp(h/3))+")";c.fill();
    c.translate(x,y);c.scale(r,r);
    c.beginPath();c.arc(0,0,1,0,tau);c.fillStyle="#cd7845";c.fill();
    c.save();c.clip();
    c.beginPath();c.ellipse(-.12,-.15,.96,.86,-.45,0,tau);c.fillStyle="#e19454";c.fill();
    const spin=b.spin||0,heading=b.yaw??Math.atan2(b.vx||0,b.vz||0);
    c.rotate(-.35+.20*Math.sin(heading)+.43*Math.sin(spin*.55));c.strokeStyle="#664438";
    c.lineWidth=Math.max(.085,.66/r);c.lineCap="round";
    const sweep=Math.sin(spin);
    c.beginPath();c.moveTo(-1.08,-.06);c.bezierCurveTo(-.54,.11+.38*sweep,.50,.11+.38*sweep,1.08,-.06);c.stroke();
    c.beginPath();c.moveTo(.06,-1.05);c.bezierCurveTo(-.22+.55*sweep,-.6,-.22+.55*sweep,.53,-.06,1.05);c.stroke();
    for(const sign of [-1,1]){
      c.beginPath();c.moveTo(-.87,sign*.59);c.bezierCurveTo(-.27,sign*.35,.26,sign*.38,.84,sign*.63);c.stroke();
    }
    c.restore();c.beginPath();c.arc(0,0,.985,0,tau);c.lineWidth=Math.max(.049,.42/r);c.strokeStyle="#985b3b";c.stroke();c.restore();
  }
  window.BayCourtPlayers={colors,roles,kitColors,kits:jerseys,dress,kit,pose,hand,worldBall,mapActor,mapBall,install};
})();
