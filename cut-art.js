/* Pelican Cut. The road centre lines, deck elevations and boat landing belong to BayCut. */
(() => {
  "use strict";
  const tau=Math.PI*2, lerp=(a,b,t)=>a+(b-a)*t, clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const bounds={left:-114,right:257,south:165,north:474};
  const site=()=>window.BayCut;
  const floor=(x,z)=>site().height(x,z);
  const sea="#52837c", deep="#416f6b", silt="#82906b", cordgrass="#a4ab70";
  const pale="#efdeb0", rust="#a36649", pine="#6e634b", rail="#beb9a0";
  const asphalt="#58605f", concrete="#979b8d", shell="#c4ad7d";
  const huts=[
    {x:194,z:339,w:9.9,d:6.1,h:3.05,rise:1.13,wall:"#76a49a",roof:"#b6b8a4",trim:"#e0d4ac",sign:"SOL FM"},
    {x:209,z:311.6,w:8.3,d:5.4,h:2.65,rise:.95,wall:"#a96d52",roof:"#829592",trim:"#dec8a0",sign:"BAIT"},
    {x:176.6,z:329.6,w:6.1,d:4.7,h:2.55,rise:.82,wall:"#c7bb99",roof:"#9b7463",trim:"#817d62",sign:"ICE"}
  ];
  const tower={x:201.4,z:338.8,h:16.7};
  const gate={x:154.5,z:199.5};
  const crossing=BayDrawbridge,length=site().routes[1].segments[2].length;
  const alongX=Math.sin(crossing.heading),alongZ=Math.cos(crossing.heading);
  const span={
    ...crossing.center,yaw:crossing.heading,half:length/2,local:crossing.local,
    at(u,s){return crossing.at(s,u);}
  };
  function inChannel(x,z,margin){
    const {u,s}=span.local(x,z);
    return u>-41-margin&&u<63+margin&&Math.abs(s)<6.6+margin;
  }
  const cache=new Map();
  let land=null;
  function random(seed){
    return ()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
  }
  function face(g,points,col,y){
    const center=points.reduce((p,v)=>[p[0]+v[0]/points.length,p[1]+v[1]/points.length],[0,0]);
    const at=typeof y==="function"?(p=>[p[0],y(...p),p[1]]):(p=>[p[0],y,p[1]]);
    for(let i=0;i<points.length;i++)g.tri(at(center),at(points[i]),at(points[(i+1)%points.length]),col);
  }
  function ellipse(x,z,rx,rz,a=0,n=16,seed=0,noise=0){
    const points=[],r=random(seed),cs=Math.cos(a),sn=Math.sin(a);
    for(let i=0;i<n;i++){
      const angle=tau*i/n,f=1+(r()-.5)*noise,dx=Math.cos(angle)*rx*f,dz=Math.sin(angle)*rz*f;
      points.push([x+dx*cs-dz*sn,z+dx*sn+dz*cs]);
    }
    return points;
  }
  function roadSamples(route){
    const nodes=route.points,unit=[];
    for(let i=1;i<nodes.length;i++){
      const a=nodes[i-1],b=nodes[i],d=Math.hypot(b.x-a.x,b.z-a.z);
      unit.push({x:(b.z-a.z)/d,z:(a.x-b.x)/d,d});
    }
    const joins=nodes.map((_,i)=>{
      if(route.id==="causeway"&&(nodes[i].z===258||nodes[i].z===272))return {x:alongZ,z:-alongX};
      const a=unit[Math.max(0,i-1)],b=unit[Math.min(i,unit.length-1)];
      const dot=1+a.x*b.x+a.z*b.z;
      return {x:(a.x+b.x)/dot,z:(a.z+b.z)/dot};
    });
    let distance=0;const out=[];
    for(let i=0;i<unit.length;i++){
      const a=nodes[i],b=nodes[i+1],steps=Math.ceil(unit[i].d/2);
      for(let j=0;j<steps;j++){
        const t=j/steps;out.push({x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),nx:lerp(joins[i].x,joins[i+1].x,t),
          nz:lerp(joins[i].z,joins[i+1].z,t),s:distance+unit[i].d*t});
      }
      distance+=unit[i].d;
    }
    out.push({x:nodes.at(-1).x,z:nodes.at(-1).z,nx:joins.at(-1).x,nz:joins.at(-1).z,s:distance});
    return {...route,samples:out};
  }
  const side=(p,n)=>[p.x+p.nx*n,p.z+p.nz*n];
  function atStation(points,s){
    const i=points.findIndex(p=>p.s>=s);
    if(i<=0)return i===0?points[0]:points.at(-1);
    const a=points[i-1],b=points[i],t=(s-a.s)/(b.s-a.s);
    return {s,x:lerp(a.x,b.x,t),z:lerp(a.z,b.z,t),nx:lerp(a.nx,b.nx,t),nz:lerp(a.nz,b.nz,t)};
  }
  // The delta shoals taper in the direction of the ebb. Their thin outer mud
  // shelves are visible between the saltgrass and the green tidal channels.
  const shoals=[
    [123,217,11,3.3,-.31],[159,228,8,2.9,.99],[175,238,8,2,.92],
    [134,253,9.6,3.9,.59],[146,264,11.6,4,.72],[123,276,10.6,4.4,.87],
    [153,283,10,3.8,.33],[169,300,10,3.2,.42],[116,307,14,5.1,.12],
    [85,253,10,3.2,-.38],[81,279,16,5.2,.57],[164,232,10,3,.35],
    [185,245,9.2,3,.78],[201,259,10,4.5,.80],[211,277,11.4,3.8,.56],
    [212,296,8.5,3.1,.52],[216,345,12,4.5,.70],[180,351,17,6,.19],
    [135,327,21,6.2,-.28],[102,336,18,7,.2],[67,313,17,5.6,.34],
    [62,233,17,6,-.5],[33,253,28,6,.61],[9,291,22,7.5,.28],[-19,322,29,7,.44],
    [43,359,23,7,.19],[99,365,27,8,.22],[147,376,24,7,.3],[197,377,17,5,-.75],
    [37,389,22,8,.13],[-26,367,21,7,-.41],[90,412,28,7,.31],[154,414,19,7,-.5],
    [191,409,22,6,.32],[164,444,26,7,.2],[67,454,30,9,-.32],[21,430,36,11,.24],
    [-52,258,32,8,-.42],[-73,306,26,12,-.07],[-76,398,28,12,.18]
  ];
  const creeks=[
    {w:4.8,path:[[119,210],[132,228],[145,236],[152,244],[156,256],[151,265],[142,272],[142,279],[148,287],[162,291],[179,294],[194,299],[207,302],[219,302]]},
    {w:3.7,path:[[44,281],[59,271],[72,266],[83,265],[94,270],[107,277],[117,280],[129,278],[142,272]]},
    {w:5.9,path:[[47,346],[67,340],[86,343],[107,349],[127,348],[144,339],[153,327],[169,319],[190,313],[205,307],[217,303]]},
    {w:5.2,path:[[137,416],[140,398],[149,388],[163,379],[172,366],[187,356],[202,352],[214,343],[221,336]]}
  ];
  const yardPaths=[
    [[190,324],[191,327.5],[193,330.5],[194,333.2]],
    [[193,317.4],[196,318.3],[201,319.6],[211,320]],
    [[190,325],[185.5,325.2],[180.2,326.6]]
  ];
  function safePlant(x,z,margin){
    const cut=site(),n=cut.nearest(x,z),camp=cut.camp;
    if(n.d<n.route.halfWidth+margin)return false;
    if(((x-camp.x)/(camp.rx+margin))**2+((z-camp.z)/(camp.rz+margin))**2<1)return false;
    for(const p of cut.pads)if(((x-p.x)/(p.rx+margin))**2+((z-p.z)/(p.rz+margin))**2<1)return false;
    return x<cut.coast(z)-margin;
  }
  // Keep each island's irregular outline where it meets the dredged channel.
  function cutShore(points){
    if(points.every(([x,z])=>!inChannel(x,z,15)))return [points];
    function plane(poly,key,edge,sign){
      const out=[];
      for(let i=0;i<poly.length;i++){
        const a=poly[i],b=poly[(i+1)%poly.length];
        const da=(span.local(...a)[key]-edge)*sign,db=(span.local(...b)[key]-edge)*sign;
        if(da>=0)out.push(a);
        if((da<0)!==(db<0)){const t=da/(da-db);out.push([lerp(a[0],b[0],t),lerp(a[1],b[1],t)]);}
      }return out;
    }
    const ends=plane(plane(points,"s",-6.6,1),"s",6.6,-1);
    return [plane(points,"s",6.6,1),plane(points,"s",-6.6,-1),plane(ends,"u",-41,-1),plane(ends,"u",63,1)].filter(p=>p.length>2);
  }
  const dredge=[[-43,1.3],[-40,4.9],[-35,6.5],[-27,6.1],[-13,6.3],[0,6.4],[15,6.35],[25,6.5],[31,6.7],[35,5.5],[39,1.8]];
  function channelSurface(paint,street){
    for(const [k,color] of [[1,street?"#527e77":"#4d7972"],[.64,street?"#497870":"#49736e"]]){
      const bank=sign=>dredge.map(([u,w])=>{const p=span.at(u,w*k*sign);return [p.x,p.z];});
      paint(bank(1).concat(bank(-1).reverse()),color,k===1?.007:.008);
    }
  }
  function landscape(){
    if(land)return land;
    const r=random(10443),islands=[],trees=[],grass=[],ripples=[],routes=site().routes.map(roadSamples);
    const creases=creeks.map(c=>({...c,samples:roadSamples({points:c.path.map(([x,z])=>({x,z}))}).samples}));
    const floorSections=[];
    // The crooked southern edge leaves the last city blocks and beach in place.
    const latitudes=[199,201.5,204,206.5,208];
    for(let z=213;z<=bounds.north;z+=5)latitudes.push(z);
    for(const z of latitudes){
      const left=z<214?lerp(137,100,(z-199)/15):z<232?lerp(100,bounds.left,(z-214)/18):bounds.left;
      const coast=site().coast(z);
      floorSections.push({z,left,right:z<208?lerp(153,coast,(z-199)/9):coast});
    }
    for(let i=0;i<shoals.length;i++){
      const [x,z,rx,rz,ang]=shoals[i],seed=705+i*337,n=14;
      islands.push({x,z,outer:cutShore(ellipse(x,z,rx+2.4,rz+1,ang,n,seed,.30)),
        shore:cutShore(ellipse(x,z,rx+.85,rz+.4,ang,n,seed,.28)),top:cutShore(ellipse(x,z,rx,rz,ang,n,seed,.26)),
        inner:cutShore(ellipse(x-.6,z+.25,rx*.77,rz*.65,ang,11,seed+1,.34)),shade:i%3});
      const desired=rx>16?4:2;
      for(let j=0;j<desired;j++){
        const u=(r()-.5)*rx*1.3,v=(r()-.5)*rz*.65,tx=x+u*Math.cos(ang)-v*Math.sin(ang),tz=z+u*Math.sin(ang)+v*Math.cos(ang);
        const willow=(i*3+j)%7===0,scale=.72+r()*.60;
        if(safePlant(tx,tz,willow?3.6:3.2))trees.push({x:tx,z:tz,scale,seed:Math.floor(r()*65000),willow});
      }
      for(let j=0;j<(rx>16?5:11);j++){
        const ang2=r()*tau,d=.40+r()*.61,u=Math.cos(ang2)*rx*d,v=Math.sin(ang2)*rz*d;
        const gx=x+u*Math.cos(ang)-v*Math.sin(ang),gz=z+u*Math.sin(ang)+v*Math.cos(ang);
        if(safePlant(gx,gz,1.5))grass.push({x:gx,z:gz,size:.65+r()*.65,seed:Math.floor(r()*100000)});
      }
    }
    // Finger marshes fill the inside of bends with stands of cordgrass.
    for(const [x,z,rx,rz,angle] of [[130,236,5.2,1.1,.4],[137,259,8,1.3,1.1],[152,279,5.6,.9,.2],
      [175,298,6,1.1,.45],[197,255,5,.85,.91],[114,301,7,1.1,.3],[82,271,12,1,.87],[173,346,11,.9,-.12]]){
      for(let k=0;k<20;k++){
        const u=(r()-.5)*2*rx,v=(r()-.5)*2*rz,px=x+u*Math.cos(angle)-v*Math.sin(angle),pz=z+u*Math.sin(angle)+v*Math.cos(angle);
        if(safePlant(px,pz,.9))grass.push({x:px,z:pz,size:.74+r()*.73,seed:Math.floor(r()*65000)});
      }
    }
    for(let i=0;i<215;i++){
      const x=50+r()*179,z=216+r()*150;
      if(safePlant(x,z,2)&&x<site().coast(z)-1)ripples.push({x,z,w:.45+r()*2.5,tilt:(r()-.5)*.21});
    }
    land={floorSections,islands,trees:trees.filter(p=>!inChannel(p.x,p.z,p.willow?3.6:3.2)),
      grass:grass.filter(p=>!inChannel(p.x,p.z,1.5)),ripples,routes,creases};
    return land;
  }
  const waterY=z=>.025+.101*clamp((240-z)/12,0,1);
  // The timber landing ramps up on top of the dirt; its height belongs only to its boards.
  const yardY=(x,z)=>floor(Math.min(x,206.5),z);
  function clearing(g,p,ratio,col,lift,roadEdge){
    const rx=p.rx*ratio,rz=p.rz*ratio,steps=Math.ceil(2*rz/1.15);
    const slice=i=>{
      const t=2*i/steps-1,z=p.z+t*rz,dx=rx*Math.sqrt(Math.max(0,1-t*t));
      let left=p.x-dx;
      if(roadEdge){
        const j=roadEdge.findIndex(v=>v[1]>=z);
        if(j>0){const a=roadEdge[j-1],b=roadEdge[j];
          left=Math.min(p.x+dx,Math.max(left,lerp(a[0],b[0],(z-a[1])/(b[1]-a[1]))));}
      }
      return [[left,yardY(left,z)+lift,z],[p.x+dx,yardY(p.x+dx,z)+lift,z]];
    };
    let prev=slice(0);
    for(let i=1;i<=steps;i++){const next=slice(i);g.quad(prev[0],prev[1],next[1],next[0],col);prev=next;}
  }
  function wetChannel(g,points,w,col,y){
    const pt=(p,l)=>{const [x,z]=side(p,l*w*(1+.16*Math.sin(p.s*.071)));return [x,waterY(z)+y,z];};
    for(let j=1;j<points.length;j++){const a=points[j-1],b=points[j];g.quad(pt(a,-1),pt(a,1),pt(b,1),pt(b,-1),col);}
  }
  function waterMesh(g){
    const {floorSections,islands,ripples,creases,routes}=landscape();
    for(let i=1;i<floorSections.length;i++){
      const a=floorSections[i-1],b=floorSections[i],v=(p,x,offset=0)=>[x,waterY(p.z)+offset,p.z];
      g.quad(v(a,a.left),v(a,a.right),v(b,b.right),v(b,b.left),sea);
      g.quad(v(a,a.right-2.3,.005),v(a,a.right+.25,.005),v(b,b.right+.25,.005),v(b,b.right-2.3,.005),"#527c73");
    }
    for(const c of creases){wetChannel(g,c.samples,c.w,"#517e77",.004);wetChannel(g,c.samples,c.w*.62,"#497971",.006);}
    channelSurface((points,color,lift)=>face(g,points,color,(_,z)=>waterY(z)+lift),true);
    for(const i of islands){
      for(const p of i.outer)face(g,p,"#68867b",(_,z)=>waterY(z)+.009);
      for(const p of i.shore)face(g,p,"#8c947a",(_,z)=>waterY(z)+.026);
      for(const p of i.top)face(g,p,[silt,"#8f9971","#96a071"][i.shade],(_,z)=>waterY(z)+.051);
      for(const p of i.inner)face(g,p,["#959d6e",cordgrass,"#929c69"][i.shade],(_,z)=>waterY(z)+.066);
    }
    for(const p of ripples){
      const y=waterY(p.z)+.012;
      g.tri([p.x-p.w,y,p.z-p.tilt],[p.x+p.w,y,p.z+p.tilt],[p.x+.26*p.w,y,p.z+p.tilt+.095],deep);
    }
    const clearings=[site().camp,...site().pads];
    for(const [j,p] of clearings.entries()){
      const joins=routes[j===1?2:1],edge=j?joins.samples.map(s=>side(s,joins.halfWidth-.08)):null;
      clearing(g,p,1,"#869269",-.019,edge);
      clearing(g,p,.94,j===0?"#b9a783":"#b7aa83",-.012,edge);
    }
    for(const path of yardPaths){
      const {samples}=roadSamples({points:path.map(([x,z])=>({x,z}))});
      for(let i=1;i<samples.length;i++)for(const n of [-1.14,1.14]){
        const pt=(p,d)=>{const [x,z]=side(p,d);return [x,yardY(x,z)+.002,z];};
        g.quad(pt(samples[i-1],n-.32),pt(samples[i-1],n+.32),pt(samples[i],n+.32),pt(samples[i],n-.32),"#ab9876");
      }
    }
  }
  function strip(g,a,b,lo,hi,paint,level=0){
    const lift=p=>[p[0],roadY(p[0],p[1])+level,p[1]];
    // Each lateral point sits at a different elevation where a curved lane
    // crosses the bridge ramp. The lane ink and road need the same grade.
    const n=a.x>143&&a.z>232&&a.z<296?Math.ceil((hi-lo)/1.05):1;
    let startA=lift(side(a,lo)),startB=lift(side(b,lo));
    for(let i=1;i<=n;i++){
      const next=lerp(lo,hi,i/n),endA=lift(side(a,next)),endB=lift(side(b,next));
      g.quad(startA,endA,endB,startB,paint);startA=endA;startB=endB;
    }
  }
  function roadY(x,z){
    // Clear Ocean Drive's old lane paint until the approach itself rises past it.
    const y=floor(x,z)+.014;
    return z<228?Math.max(y,.108):y;
  }
  function pointOn(p,n,h=0){
    const [x,z]=side(p,n);return [x,roadY(x,z)+h,z];
  }
  function roadMesh(g){
    const routes=landscape().routes,r=random(4001);
    for(const route of routes){
      const unpaved=route.id==="shell",w=route.halfWidth,arr=route.samples;
      for(let i=1;i<arr.length;i++){
        const a=arr[i-1],b=arr[i],z=(a.z+b.z)*.5;
        if(route.id==="approach"&&z<181)continue;
        if(route.id==="causeway"&&z>258&&z<272)continue;
        const bridge=route.id==="causeway"&&z>=247&&z<=282;
        const feather=bridge?.44:unpaved?1.25:1.55;
        const verge=bridge?"#797e72":unpaved?"#a59771":"#a59b7e";
        strip(g,a,b,-w-feather,-w,verge,.002);strip(g,a,b,w,w+feather,verge,.002);
        if(!bridge){
          const apron=unpaved?.9:clamp((roadY(a.x,a.z)-waterY(a.z))*1.30+.48,.55,3.25);
          for(const l of [-1,1]){
            const inA=pointOn(a,l*(w+feather)),inB=pointOn(b,l*(w+feather));
            const sa=side(a,l*(w+feather+apron)),sb=side(b,l*(w+feather+apron));
            const outA=[sa[0],waterY(sa[1])+.009,sa[1]],outB=[sb[0],waterY(sb[1])+.009,sb[1]];
            g.quad(inA,inB,outB,outA,unpaved?"#908e66":"#969479");
          }
        }
        strip(g,a,b,-w,w,unpaved?shell:bridge?concrete:asphalt,.014);
        if(unpaved){
          for(const l of [-1,1]){
            strip(g,a,b,l*1.26-.38,l*1.26+.37,"#b3a076",.020);
            strip(g,a,b,l*1.26-.11,l*1.26+.09,"#bea980",.023);
          }
          if(i%2===0){
            const n=(r()-.5)*w*1.8,p=pointOn(a,n,.030),s=.13+r()*.18;
            g.tri(p,[p[0]+s,p[1],p[2]+.09],[p[0]+.1,p[1],p[2]+.02],pale);
          }
        }else{
          if(route.id!=="causeway"||a.s<arr.at(-1).s-6.6)
            for(const l of [-1,1]){
              strip(g,a,b,l*(w-.59)-.075,l*(w-.59)+.075,bridge?"#d9d6bd":"#c9c6ad",.024);
              strip(g,a,b,l*.10-.045,l*.10+.045,bridge?"#c8ab6f":"#dec18a",.026);
            }
          if(bridge&&i%3===1){
            const seam=atStation(arr,a.s+.08);
            strip(g,a,seam,-w+.13,w-.13,"#707a72",.029);
          }
        }
        if(bridge){
          for(const l of [-1,1]){
            const n=l*(w+.41),p=pointOn(a,n),q=pointOn(b,n);
            g.quad(p,q,[q[0],q[1]-.52,q[2]],[p[0],p[1]-.52,p[2]],"#857f6e");
            const inner=pointOn(a,-n,-.51),innerB=pointOn(b,-n,-.51);
            if(l===1)g.quad([p[0],p[1]-.51,p[2]],[q[0],q[1]-.51,q[2]],innerB,inner,"#777e73");
          }
        }
      }
      if(route.id==="causeway"){
        const start=arr.find(p=>p.z>=245).s,end=arr.find(p=>p.z>=282).s,total=end-start,bays=Math.ceil(total/3.35);
        const stops=Array.from({length:bays+1},(_,i)=>start+total*i/bays);
        const south=arr.find(p=>p.z===258).s,north=arr.find(p=>p.z===272).s;
        const gaps=[[south,north]],eastGaps=[...gaps];
        function stationFor(localS){
          const longitudinal=p=>span.local(...side(p,w+.16)).s;
          const i=arr.findIndex(p=>longitudinal(p)>=localS),a=arr[i-1],b=arr[i];
          return lerp(a.s,b.s,(localS-longitudinal(a))/(longitudinal(b)-longitudinal(a)));
        }
        eastGaps.push([stationFor(-20.2),stationFor(-11.95)],[arr.find(p=>p.z>=280).s,end]);
        for(const l of [-1,1]){
          const cuts=l===1?eastGaps:gaps,n=l*(w+.16);
          const absent=s=>cuts.some(([a,b])=>s>a+1e-5&&s<b-1e-5);
          const edges=cuts.flat(),placed=stops.filter(s=>!absent(s)&&edges.every(e=>Math.abs(s-e)>.54)).concat(edges).sort((a,b)=>a-b);
          for(let j=0;j<placed.length;j++){
            const p=atStation(arr,placed[j]),[x,y,z]=pointOn(p,n);
            if(l===1&&p.s===end)continue;
            g.box(x,y+.48,z,.37,.96,.37,"#b3ad96");
            g.box(x,y+.99,z,.45,.10,.45,rail);
            if(j%4===0||j===placed.length-1){
              const label=pointOn(p,n-l*.19,.67);
              g.box(label[0],label[1],label[2],.12,.14,.13,l===1?"#cf934f":"#e9cf91");
            }
            if(j+1<placed.length&&!absent((placed[j]+placed[j+1])/2)){
              const next=atStation(arr,placed[j+1]);
              const u=pointOn(next,n,.83),v=pointOn(p,n,.83),u2=pointOn(next,n,.39),v2=pointOn(p,n,.39);
              g.pole(v,u,.105,rail,4);g.pole(v2,u2,.064,"#818477",4);
            }
          }
        }
        for(let j=1;j<stops.length;j+=3){
          const p=atStation(arr,stops[j]);
          if(p.z>=256.8&&p.z<=273.2)continue;
          const a=pointOn(p,-w+.95,-.43),b=pointOn(p,w-.95,-.43);
          g.pole(a,b,.32,"#838879",4);
          for(const e of [a,b])g.box(e[0],(e[1]-.22)*.5,e[2],.62,e[1]+.22,.78,"#858773");
        }
      }
      if(route.id!=="approach"){
        for(let s=6;s<arr.at(-1).s-9;s+=16){
          const a=atStation(arr,s);
          if(route.id==="causeway"&&a.z>239&&a.z<293)continue;
          const l=Math.round(s)%3===0?-1:1,[x,y,z]=pointOn(a,l*(w+1.12));
          g.box(x,y+.39,z,.18,.88,.18,pine);g.box(x,y+.73,z,.19,.18,.19,pale);
        }
      }
    }
    // Open fan at the Y junction leaves the short paved spur and shell track joined.
    const j=site().routes[1].points[0];
    face(g,ellipse(j.x,j.z,5.3,4.5,0,18),"#656860",(x,z)=>roadY(x,z)+.018);
    const end=site().routes[1].points.at(-1);
    face(g,ellipse(end.x,end.z,5.64,4.44,-.18,22),asphalt,(x,z)=>roadY(x,z)+.039);
  }

  function crown(g,x,y,z,rx,rz,h,angle,colors,seed){
    const ring=ellipse(x,z,rx,rz,angle,8,seed,.31);
    const mid=ring.map(([px,pz],i)=>[px,y+h*(.27+.09*Math.sin(i+seed)),pz]);
    const upper=ring.map(([px,pz],i)=>[lerp(x,px,.70),y+h*(.70+.14*Math.sin(i*2+seed)),lerp(z,pz,.72)]);
    const top=[x-.12*rx,y+h,z+.08*rz];
    for(let i=0;i<8;i++){
      const j=(i+1)%8;
      g.tri([x,y-.055*h,z],mid[i],mid[j],colors[0]);
      g.quad(mid[i],upper[i],upper[j],mid[j],colors[(i+seed)%4===0?2:1],.94+.04*Math.cos(i));
      g.tri(upper[i],top,upper[j],colors[(i+seed)%3===1?1:2]);
    }
  }
  function tree(g,t){
    const r=random(t.seed),x=t.x,z=t.z,s=t.scale,y=waterY(z)+.075;
    face(g,ellipse(x+.5*s,z-.45*s,(t.willow?1.7:2.8)*s,1.14*s,.18,8,t.seed,.26),"#788660",y+.009);
    if(z>347||x<68){
      const h=t.willow?5.3*s:2.3*s;
      g.pole([x,y,z],[x+.23*s,y+h,z+.09*s],.16*s,pine,4);
      crown(g,x+.22*s,y+h*.6,z,t.willow?1.85*s:3*s,1.50*s,1.78*s,.28,["#586d5c","#738866","#879877"],t.seed);
      if(t.willow)crown(g,x+.06*s,y+h*.94,z,1.18*s,.98*s,1.46*s,.12,["#5e745e","#788a6a","#8b9775"],t.seed+16);
      return;
    }
    if(t.willow){
      // Bald cypress: the uneven crown, bare tip and skirted base read across the channel.
      const h=(5.0+r()*2.7)*s;
      g.cyl(x,y+.49*s,z,.18*s,.53*s,1.00*s,6,"#817762");
      const tip=[x+.43*s,y+h,z+.12*s];g.pole([x,y+.67*s,z],tip,.14*s,"#786d57",5);
      for(let i=0;i<3;i++){
        const dx=(i%2?-.67:.59)*s,dz=(r()-.5)*s,level=h*(.43+.16*i);
        g.pole([x+.22*s,y+level-.50*s,z],[x+dx,y+level+.22*s,z+dz],.07*s,pine,4);
        crown(g,x+dx,y+level,z+dz,(1.75-i*.31)*s,(1.20-i*.17)*s,(1.31-i*.15)*s,.4,
          ["#526a53","#6d8059","#879167"],t.seed+i*22);
      }
      for(let i=0;i<3;i++){
        const a=r()*tau,d=(.8+r()*.74)*s,hk=(.29+r()*.37)*s;
        g.cyl(x+Math.cos(a)*d,y+hk*.5,z+Math.sin(a)*d,.025,.15*s,hk,4,"#85795f");
      }
      return;
    }
    const lean=(.35+r()*.30)*s,stem=[x+lean,y+1.67*s,z+.26*s];
    for(let i=0;i<5;i++){
      const a=i*tau/5+r()*.38,d=(.57+r()*.49)*s;
      const knee=[x+Math.cos(a)*d*.69,y+.76*s,z+Math.sin(a)*d*.69];
      const foot=[x+Math.cos(a)*d,y-.07,z+Math.sin(a)*d];
      g.pole(foot,knee,.068*s,"#826e56",4);g.pole(knee,stem,.086*s,"#76634c",4);
    }
    for(let i=0;i<3;i++){
      const a=i*tau/3+r()*.5,d=i?1.08*s:.37*s;
      const bx=stem[0]+Math.cos(a)*d,bz=stem[2]+Math.sin(a)*d,by=stem[1]+(.27+r()*.22)*s;
      g.pole(stem,[bx,by+.17*s,bz],.10*s,"#71654d",4);
      crown(g,bx,by-.14*s,bz,(i===0?2.28:1.87)*s,(i===0?1.65:1.29)*s,(.86+r()*.39)*s,a*.35,
        i===1?["#405f50","#5b7656","#748658"]:["#476451","#607b58","#839063"],t.seed+i*20);
    }
  }
  function reedClump(g,p){
    const r=random(p.seed),y=waterY(p.z)+.07;
    for(let i=0;i<6;i++){
      const x=p.x+(r()-.5)*1.28*p.size,z=p.z+(r()-.5)*.81*p.size;
      const h=(.41+r()*.66)*p.size,dx=(r()-.39)*.6*p.size,dz=(r()-.5)*.56*p.size;
      g.tri([x-.14*p.size,y,z],[x+.13*p.size,y,z+.07],[x+dx,y+h,z+dz],
        ["#77865b","#a7a976","#bac08a","#999b65"][i%4]);
      if(i<2)g.tri([x,y,z-.12],[x+.07,y,z+.12],[x+dx+.14,y+h*.88,z+dz],cordgrass);
    }
  }
  // A lower, warmer tree line continues around the view without the cost of full trees.
  function distantTreeLine(g){
    const r=random(5682),edge=(x,z,stepX,stepZ,count)=>{
      for(let i=0;i<count;i++){
        const rx=4+r()*7,h=2.0+r()*5.2;
        const tx=x+i*stepX+(r()-.5)*7,tz=z+i*stepZ+(r()-.5)*8;
        crown(g,tx,.10,tz,rx,2+r()*3,h,r()*.25,["#6b806b","#7a8d74","#899981"],i*11+173);
        if(i%4===0){
          const v=h+2+r()*3;
          g.tri([tx-.72,h*.54,tz],[tx+.34,v,tz],[tx+1.2,h*.54,tz],"#74856b");
        }
      }
    };
    edge(-88,287,.2,7.7,24);edge(-88,460,8.5,.13,34);
  }
  function paintFoliage(g,which){
    const test=p=>((p.x<148?0:1)+(p.z>310?2:0))===which,{trees,grass}=landscape();
    for(const p of trees)if(test(p))tree(g,p);
    for(const p of grass)if(test(p))reedClump(g,p);
  }
  const letters={
    A:["0110","1001","1111","1001","1001"],B:["1110","1001","1110","1001","1110"],
    C:["0111","1000","1000","1000","0111"],D:["1110","1001","1001","1001","1110"],
    E:["111","100","110","100","111"],F:["111","100","110","100","100"],
    G:["0111","1000","1011","1001","0111"],H:["1001","1001","1111","1001","1001"],
    K:["1001","1010","1100","1010","1001"],
    I:["111","010","010","010","111"],L:["100","100","100","100","111"],
    M:["10001","11011","10101","10001","10001"],N:["1001","1101","1011","1001","1001"],
    O:["0110","1001","1001","1001","0110"],P:["1110","1001","1110","1000","1000"],
    R:["1110","1001","1110","1010","1001"],S:["0111","1000","0110","0001","1110"],
    T:["11111","00100","00100","00100","00100"],U:["1001","1001","1001","1001","0110"],
    V:["10001","10001","01010","01010","00100"],W:["10001","10001","10101","10101","01010"],
    "1":["010","110","010","010","111"],"7":["1111","0001","0010","0100","0100"],
    " ":["0","0","0","0","0"]
  };
  // Signs face arriving players. The text and the bird are physical paint with no network fonts.
  function signText(g,text,unit,col,plane){
    const glyphs=Array.from(text,c=>letters[c]),len=glyphs.reduce((s,rows)=>s+rows[0].length+1,-1);
    let x=-len*unit*.5;
    for(const rows of glyphs){
      for(let j=0;j<5;j++)for(const run of rows[j].matchAll(/1+/g)){
        const l=x+run.index*unit,r=l+run[0].length*unit,t=(2.5-j)*unit,b=t-unit;
        g.quad(plane(l,t),plane(r,t),plane(r,b),plane(l,b),col);
      }
      x+=(rows[0].length+1)*unit;
    }
  }
  function gateSign(g){
    const {x,z}=gate,y=floor(x,z),ang=-.22,cs=Math.cos(ang),sn=Math.sin(ang);
    const p=(u,v,d=0)=>[x+u*cs+d*sn,y+v,z-u*sn+d*cs];
    face(g,ellipse(x-.71,z-.35,4.0,2.44,-.27,13,423,.18),"#aeaa7e",y+.010);
    for(const dx of [-2.25,2.25]){
      const a=p(dx,.0,.16),b=p(dx,3.22,.16);g.pole(a,b,.15,pine,5);
      g.pole(p(dx,.17,.90),p(dx,1.55,.13),.08,"#8e8066",4);
    }
    g.box(x,y+2.35,z,5.86,2.24,.20,"#887a60",ang);
    const board=(x1,x2,y1,y2,col,d)=>g.quad(p(x1,y1,d),p(x1,y2,d),p(x2,y2,d),p(x2,y1,d),col);
    board(-2.84,2.84,1.30,3.37,"#4c6a5d",-.105);
    board(-2.72,2.72,1.39,1.44,"#d3c195",-.112);board(-2.72,2.72,3.22,3.27,"#d3c195",-.112);
    // Painted pelican: long horizontal bill, round white neck and swept wing.
    const bird=(v,c)=>g.tri(...v.map(([u,h])=>p(u,h,-.123)),c);
    bird([[-2.49,2.21],[-2.10,2.65],[-1.46,2.25]],pale);
    bird([[-2.24,2.31],[-2.53,2.55],[-1.79,2.39]],"#91a99a");
    bird([[-1.87,2.28],[-1.57,2.84],[-1.46,2.25]],pale);
    bird([[-1.59,2.71],[-1.66,2.91],[-1.39,2.83]],pale);
    bird([[-1.46,2.84],[-.92,2.70],[-1.49,2.66]],"#deb27a");
    board(-2.45,-1.40,2.11,2.15,"#98afa1",-.123);
    signText(g,"PELICAN",.097,pale,(u,v)=>p(.98+u,2.68+v,-.127));
    signText(g,"CUT",.118,pale,(u,v)=>p(.98+u,1.95+v,-.127));
    for(const [a,b,c] of [[-2.8,-2.5,1.69],[-1.11,-.89,3.12],[2.12,2.60,1.59],[-2.7,-2.58,2.88]])
      board(a,b,c,c+.023,"#acaa85",-.129);
  }
  function forkMarker(g){
    const x=141,z=225.5,y=floor(x,z);
    g.box(x,y+1.11,z,.19,2.22,.19,pine);g.box(x,y+1.76,z,2.26,.55,.13,"#7c7661");
    const p=(u,v)=>[x+u,y+1.76+v,z-.071];
    signText(g,"LEVEE",.067,pale,(u,v)=>p(u+.16,v));
    g.tri(p(-.99,0),p(-.77,.14),p(-.77,-.14),pale);
    // County maintenance sign at the approach. The drawing of raised leaves
    // reads at driving speed; the detour plate points toward Shell Levee.
    const sx=155.25,sz=222.6,base=floor(sx,sz),front=(a,b)=>[sx+a,base+b,sz-.09];
    g.cyl(sx,base+1.58,sz,.068,.071,3.16,5,"#86968a");
    const diamond=[front(0,3.51),front(1.00,2.51),front(0,1.51),front(-1.00,2.51)];
    g.quad(...diamond,"#374e4d");
    const p2=(u,h)=>[sx+u,base+h,sz-.098];
    g.quad(p2(0,3.43),p2(.92,2.51),p2(0,1.59),p2(-.92,2.51),"#d7aa61");
    const p3=(u,h)=>[sx+u,base+h,sz-.106];
    for(const d of [-1,1]){
      g.quad(p3(d*.54,2.24),p3(d*.54,2.35),p3(d*.18,2.83),p3(d*.11,2.76),"#394a46");
      g.quad(p3(d*.56,2.18),p3(d*.42,2.18),p3(d*.42,2.38),p3(d*.56,2.38),"#394a46");
    }
    g.box(sx,base+1.20,sz,2.22,.48,.13,"#c28f53");
    signText(g,"DETOUR",.047,"#394c46",(u,v)=>[sx+u+.18,base+1.20+v,sz-.074]);
    g.tri([sx-.96,base+1.2,sz-.075],[sx-.70,base+1.34,sz-.075],[sx-.70,base+1.06,sz-.075],"#394c46");
  }
  function hut(g,h){
    const {x,z,w,d}=h,y=floor(x,z),front=z-d*.5,back=z+d*.5,left=x-w*.5,right=x+w*.5;
    const base=.18,eave=y+h.h,ridge=eave+h.rise,over=.46;
    face(g,ellipse(x+.8,z-.85,w*.65,d*.64,.02,12),"#978c70",y+.027);
    for(const xx of [left+.40,right-.40])for(const zz of [front+.40,back-.40])
      g.box(xx,y+.16,zz,.36,.34,.36,"#948872");
    g.box(x,(y+base+eave)*.5,z,w,h.h-base,d,h.wall);
    // Board courses and several sun-bleached repairs vary by facade.
    for(let k=0;k<8;k++){
      const yy=y+base+.15+k*.32;
      g.quad([left,yy,front-.007],[right,yy,front-.007],[right,yy+.025,front-.007],[left,yy+.025,front-.007],"#8e9380");
    }
    for(const xx of [left+.11,right-.11])g.box(xx,y+base+(h.h-base)*.5,front-.028,.14,h.h-base,.075,h.trim);
    for(const xx of [left,right]){
      g.tri([xx,eave,front],[xx,ridge,z],[xx,eave,back],h.wall);
      g.box(xx,y+.34,z,.09,.11,d,"#838572");
    }
    function roofZ(zz){return ridge-Math.abs(zz-z)*h.rise/(d*.5);}
    const frontR=front-over,backR=back+over,l=left-over,r=right+over;
    for(const zz of [frontR,backR]){
      const end=roofZ(zz);
      g.quad([l,end,zz],[r,end,zz],[r,ridge,z],[l,ridge,z],h.roof,zz<z?1.03:.86);
      g.box(x,end-.04,zz,r-l,.11,.10,h.trim);
      for(let xx=l+.24;xx<r-.1;xx+=.46){
        g.quad([xx,end+.012,zz],[xx+.03,end+.012,zz],[xx+.03,ridge+.012,z],[xx,ridge+.012,z],"#8f988b");
      }
    }
    g.box(x,ridge+.043,z,r-l,.095,.13,h.trim);
    const doorX=h.sign==="SOL FM"?x+.03:x+w*.20;
    g.box(doorX,y+1.28,front-.06,1.22,2.19,.12,h.trim);
    g.box(doorX,y+1.24,front-.13,1.00,2.05,.079,h.sign==="BAIT"?"#627e76":"#637967");
    g.box(doorX+.32,y+1.19,front-.182,.12,.07,.052,"#d7bd83");
    const glazed=(xx,zz)=>{
      g.box(xx,y+1.57,zz,1.42,1.00,.12,h.trim);g.box(xx,y+1.57,zz-.067,1.23,.83,.062,"#4d6562");
      g.box(xx,y+1.57,zz-.11,.054,.83,.05,h.trim);g.box(xx,y+1.54,zz-.11,1.22,.059,.05,h.trim);
      g.box(xx,y+1.04,zz-.10,1.57,.095,.25,h.trim);
    };
    glazed(x-w*.31,front-.052);
    if(h.sign==="SOL FM")glazed(x+w*.32,front-.052);
    const sy=eave-.27,sz=front-.51,signW=h.sign==="SOL FM"?3.79:2.34;
    for(const side of [-1,1])g.box(x+side*signW*.40,sy+.20,sz+.17,.07,.33,.38,pine);
    g.box(x,sy,sz,signW,.69,.09,h.sign==="BAIT"?"#5a7367":"#4d6359");
    signText(g,h.sign,h.sign==="SOL FM"?.108:.106,pale,(u,v)=>[x+u,sy+v,sz-.058]);
    if(h.sign==="SOL FM"){
      // The on-air lamp and mic shelf face the public yard; both are part of the front wall.
      g.box(x-.88,y+1.43,front-.14,.28,.50,.16,"#c6ba91");
      g.box(x-.88,y+1.48,front-.24,.15,.19,.06,"#5b685b");
      g.box(x,y+.11,front-.40,2.05,.14,.76,"#ad9d7f");
      for(const dx of [-.99,.99])g.box(x+dx,y+.88,front-.54,.11,.10,.36,pine);
      g.box(x+2.17,y+2.43,front-.22,.39,.18,.23,"#875e48");
      g.box(left+.40,y+2.01,back+.15,.29,.66,.24,"#7d857b");
      const bx=x-w*.31,beige="#cfbd93";
      // Oyster-sack sunblind over the tape-room window, its broken corner tied back.
      g.quad([bx-1.11,y+2.26,front-.10],[bx+1.11,y+2.26,front-.10],[bx+1.01,y+2.01,front-.85],[bx-1.13,y+1.98,front-.93],beige);
      g.quad([bx-1.13,y+1.98,front-.93],[bx+1.01,y+2.01,front-.85],[bx+.94,y+1.89,front-.85],[bx-1.12,y+1.85,front-.93],"#b5a47e");
      for(const dx of [-.91,.87])g.pole([bx+dx,y+1.72,front-.11],[bx+dx,y+1.99,front-.84],.037,pine,4);
      const leftFace=(u,v)=>[left-.014,y+v,z+u],circle=(u,v,rx,ry,col)=>{
        for(let i=0;i<18;i++){const a=tau*i/18,b=tau*(i+1)/18;
          g.tri(leftFace(u,v),leftFace(u+rx*Math.cos(a),v+ry*Math.sin(a)),leftFace(u+rx*Math.cos(b),v+ry*Math.sin(b)),col);}
      };
      // A hand-painted sun and its tide lines face the old levee.
      circle(-.7,1.73,.88,.85,"#446e66");circle(-.7,1.73,.65,.62,"#d8b273");
      for(let k=0;k<3;k++){
        const p=(u,v)=>[left-.019,y+v,z+u],v=1.29+k*.16,ww=1.00+.20*k;
        g.quad(p(-.7-ww/2,v),p(-.7-ww/2,v+.08),p(-.7+ww/2,v+.08),p(-.7+ww/2,v),"#759789");
      }
      const ventZ=z+1.73;g.box(left-.22,y+1.71,ventZ,.44,.72,1.03,"#a9afa1");
      for(let i=0;i<4;i++)g.box(left-.46,y+1.47+i*.13,ventZ,.04,.055,.79,"#718579");
      for(const [dx,dz] of [[1.0,1.7],[1.6,1.65],[-.4,.7]]){
        const c=dx<0?"#acbba2":"#9eb49d";
        g.quad([x+dx,y+dz,front-.012],[x+dx+.28,y+dz,front-.012],
          [x+dx+.38,y+dz+.027,front-.012],[x+dx-.06,y+dz+.038,front-.012],c);
      }
      for(const zz of [z-1.20,z+.80])g.box(right+.15,y+.50,zz,.30,.62,.56,"#8b9382");
      g.pole([right-.16,eave+.08,back],[right+.66,eave-.34,back+.34],.024,"#5e6658",4);
      g.pole([right+.66,eave-.34,back+.34],[tower.x,y+4.19,tower.z],.024,"#5e6658",4);
    }else if(h.sign==="BAIT"){
      // Front fish crate below a sunblind striped with repaired panels.
      const ax=x-w*.27;
      for(let j=0;j<5;j++){
        const xx=ax-1.04+j*.415;
        g.quad([xx,y+2.26,front-.09],[xx+.417,y+2.26,front-.09],
          [xx+.417,y+1.92,front-.91],[xx,y+1.92,front-.91],j%2?"#d1c39f":"#799284");
      }
    }
  }
  function antenna(g){
    const {x,z,h}=tower,y=floor(x,z),ends=[[-1,-.61],[1,-.61],[0,1.10]];
    const at=(i,k)=>{
      const width=lerp(.91,.17,k);
      return [x+ends[i][0]*width,y+.10+h*.88*k,z+ends[i][1]*width];
    };
    for(let k=0;k<7;k++){
      const a=k/7,b=(k+1)/7,c=(a+b)/2;
      for(let i=0;i<3;i++){
        const j=(i+1)%3,color=k>=4&&k%2===0?rust:"#95a196";
        g.pole(at(i,a),at(i,b),.061,color,4);g.pole(at(i,a),at(j,a),.041,color,4);
        g.pole(at(i,a),at(j,c),.029,color,3);g.pole(at(j,c),at(i,b),.029,color,3);
      }
    }
    g.pole([x,y+h*.87,z],[x,y+h+.54,z],.045,"#abab93",5);
    for(const hh of [h*.62,h*.70,h*.78]){
      g.pole([x-.5,y+hh,z],[x+1.13,y+hh,z],.046,"#bec0a8",4);
      g.pole([x+1.13,y+hh-.45,z],[x+1.13,y+hh+.46,z],.029,"#c3c3ac",4);
    }
    for(let i=0;i<3;i++){
      const point=at(i,0);
      g.box(point[0],y+.11,point[2],.54,.23,.54,"#acaa91");
    }
  }
  function crate(g,x,y,z,w,d,h,col){
    g.box(x,y+h*.5,z,w,h,d,col);
    for(const zz of [z-d*.5-.012,z+d*.5+.012]){
      g.box(x,y+.11,zz,w+.04,.095,.045,pine);
      g.box(x,y+h-.09,zz,w+.04,.085,.045,"#a9946e");
      g.box(x,y+h-.14,zz,.29,.072,.057,"#5b6254");
    }
  }
  function workYard(g){
    for(const h of huts)hut(g,h);
    antenna(g);
    const y=floor(214,312);
    for(const [x,z,w,d,h,up] of [[213.9,311.8,1.15,.85,.54,0],[213.8,313.0,1.18,.79,.52,0],[214.0,311.8,.85,.64,.41,.54]])
      crate(g,x,y+up,z,w,d,h,"#af8966");
    // Hung cast net, float corks and a sagging head rope outside the bait shed.
    const ax=210.8,bx=215.4,nz=316.30,gy=floor(ax,nz);
    g.pole([ax,gy,nz],[ax,gy+1.83,nz],.074,pine,5);
    g.pole([bx,gy,nz],[bx,gy+1.87,nz+.13],.08,pine,5);
    const knot=(i,bottom)=>{
      const t=i/9,a=Math.sin(Math.PI*t);
      return [lerp(ax,bx,t),gy+(bottom?.81-.51*a:1.67-.27*a),nz+.13*t+(bottom?.12:0)];
    };
    for(let i=0;i<9;i++){
      const a=knot(i,false),b=knot(i+1,false),d=knot(i,true),c=knot(i+1,true);
      g.pole(a,b,.024,"#b9af83",4);g.pole(a,c,.014,"#969b7b",3);g.pole(d,b,.014,"#879375",3);
      g.pole(d,c,.020,"#8d9476",4);
      if(i%2===0)g.box(a[0]+.12,a[1]-.044,a[2],.16,.12,.12,"#cba36b");
    }
    // Ice landing and a gear chest tucked against the west wall.
    const ice=huts[2],sx=ice.x+ice.w*.5+.55,sz=ice.z;
    g.box(sx,gy+.55,sz,1.02,1.04,1.50,"#9aada1");g.box(sx,gy+1.13,sz,1.11,.13,1.61,"#d4d1b7");
    g.box(sx+.51,gy+.66,sz,.09,.11,.36,"#596e64");
    // Coiled hose, spalled wheel stops and a wooden cable spool leave the centre
    // of the yard free for the radio van to turn around.
    const spoolX=185.1,spoolZ=336.4;
    for(const up of [.11,.78])g.cyl(spoolX,gy+up,spoolZ,.64,.64,.12,10,"#ac9170");
    g.cyl(spoolX,gy+.44,spoolZ,.38,.38,.62,9,"#777869");
    for(let i=0;i<5;i++)g.cyl(spoolX,gy+.25+i*.084,spoolZ,.40,.40,.038,9,"#676e60");
    for(const [x,z,w,a] of [[181.6,323.6,1.7,-.10],[204.7,314.7,1.58,.10]]){
      g.box(x,gy+.09,z,w,.20,.35,"#9e9c85",a);g.box(x-.43,gy+.20,z,.18,.023,.32,"#cdb880",a);
    }
    const rim=random(331);
    for(let i=0;i<46;i++){
      const a=rim()*tau,rx=27+rim()*2.7,rz=19+rim()*2.1;
      const px=site().camp.x+rx*Math.cos(a),pz=site().camp.z+rz*Math.sin(a);
      if(site().nearest(px,pz).d>8.2&&Math.abs(pz-site().dock.z)>3.0&&Math.hypot(px-194,pz-334)>8.8)
        for(let k=0;k<5;k++){
          const xx=px+(rim()-.5)*.85,zz=pz+(rim()-.5)*.69,h=.16+rim()*.40,yy=yardY(xx,zz);
          g.tri([xx-.082,yy,zz],[xx+.089,yy,zz+.06],[xx+.16,yy+h,zz+.08],k%2?"#939365":"#b4b17d");
        }
    }
    // Viewing rail on the outside of the western shell-bank turnout. The recorder
    // and vehicle pad remain open on its road side.
    const lx=110.4,lz=268.8,ly=floor(lx,lz);
    for(const dx of [-1.4,1.4]){
      g.box(lx+dx,ly+.52,lz,.15,1.04,.16,pine);
      g.box(lx+dx,ly+.40,lz+1.31,.13,.80,.14,pine);
    }
    g.box(lx,ly+.46,lz+1.31,3.04,.12,.46,"#a58a68");
    g.box(lx,ly+.96,lz,3.06,.14,.14,"#a68c68");
    g.box(lx,ly+.59,lz,3.06,.10,.11,"#938467");
  }
  function pierMesh(g){
    const p=site().dock,y=p.level,left=p.footX,right=p.x+p.headW*.5,head=p.x-p.headW*.5,half=p.walkW*.5;
    // The first eight metres of planking follow the approach from dry ground.
    const level=x=>Math.min(y,Math.max(.246,floor(x,p.z)));
    const plank=(a,b,lo,hi,color)=>{
      const ya=level(a),yb=level(b);
      g.quad([a,ya,lo],[b,yb,lo],[b,yb,hi],[a,ya,hi],color);
      g.quad([a,ya,lo],[b,yb,lo],[b,yb-.16,lo],[a,ya-.16,lo],"#88775c");
      g.quad([a,ya,hi],[a,ya-.16,hi],[b,yb-.16,hi],[b,yb,hi],"#82745c");
    };
    const r=random(547),colors=["#bb9a72","#b69a73","#b29a79","#bca27b","#af926e"];
    const n=Math.ceil((head-left)/.49);
    for(let i=0;i<n;i++){
      const a=lerp(left,head,i/n),b=lerp(left,head,(i+1)/n);
      plank(a,b,p.z-half,p.z+half,colors[Math.floor(r()*colors.length)]);
      const xx=a+.014;g.quad([a,level(a)+.002,p.z-half],[xx,level(xx)+.002,p.z-half],[xx,level(xx)+.002,p.z+half],[a,level(a)+.002,p.z+half],"#8d7d61");
    }
    const low=p.z-p.headD*.5,high=p.z+p.headD*.5;
    for(let i=0;i<25;i++){
      const lo=lerp(low,high,i/25),hi=lerp(low,high,(i+1)/25);
      plank(head,right,lo,hi,colors[Math.floor(r()*colors.length)]);
    }
    const pile=(x,z,cap)=>{
      const h=y+.28+cap;
      g.cyl(x,(h-.50)*.5,z,.14,.16,h+.50,6,"#807057");
      g.cyl(x,h,z,.16,.16,.065,6,"#a89873");
    };
    for(let x=left+2;x<head-1;x+=5.15)for(const sign of [-1,1])pile(x,p.z+sign*(half-.15),.06);
    for(const x of [head+.22,right-.24])for(const z of [low+.25,high-.25])pile(x,z,.18);
    // Two steel cleats and a short ladder are inside the pier footprint.
    for(const z of [low+.46,high-.46]){
      g.box(p.x+.5,y+.09,z,.17,.17,.26,"#697c73");g.box(p.x+.5,y+.18,z,.49,.10,.16,"#8b988a");
      g.box(p.x-1.48,y-.17,z,.91,.23,.22,"#595e51");
    }
    for(const z of [p.z-.38,p.z+.38]){
      g.pole([right-.01,y-.47,z],[right-.01,y+.36,z],.044,"#929f91",5);
      g.pole([right-.01,y+.36,z],[right-.36,y+.36,z],.044,"#929f91",5);
    }
    for(const dy of [-.33,-.08,.16])g.pole([right-.01,y+dy,p.z-.38],[right-.01,y+dy,p.z+.38],.038,"#88978b",4);
    const x=head-4.5,z=p.z+half-.22;
    g.box(x,y+1.33,z,.17,2.66,.17,pine);g.box(x,y+2.62,z,.43,.13,.43,"#617069");
    g.box(x,y+2.46,z,.27,.19,.27,"#dfc998");
  }
  function signalLights(g){
    const y=floor(huts[0].x,huts[0].z);
    g.box(196.17,y+2.45,huts[0].z-huts[0].d*.5-.351,.25,.102,.046,"#ff986f");
    const p=site().dock;g.box(p.x-p.headW*.5-4.5,p.level+2.462,p.z+p.walkW*.5-.22,.276,.18,.277,"#ffdfab");
    for(const h of [huts[0],huts[1]]){
      const x=h.x-h.w*.31,z=h.z-h.d*.5-.16,cy=floor(h.x,h.z)+1.57;
      for(const dx of [-.30,.30])for(const dy of [-.22,.22])
        g.quad([x+dx-.265,cy+dy-.15,z],[x+dx+.265,cy+dy-.15,z],[x+dx+.265,cy+dy+.15,z],[x+dx-.265,cy+dy+.15,z],"#e5b279");
    }
  }
  function lampPools(g){
    const pools=[[191.1,334.9,1.65,2.39,.11],[194,334.8,1.12,2.1,.12],[206.4,307.9,1.43,1.90,.10]];
    for(const [x,z,rx,rz,alpha] of pools){
      const vertex=(a,r,shade)=>{const px=x+Math.cos(a)*rx*r,pz=z+Math.sin(a)*rz*r;
        g.vertices.push(px,yardY(px,pz)+.024,pz,shade,0,0);};
      for(let i=0;i<14;i++){
        const a=tau*i/14,b=tau*(i+1)/14;
        vertex(a,0,alpha);vertex(a,1.0,0);vertex(b,1.0,0);
      }
    }
  }
  const foliageAreas=[[88,263,136],[181,268,134],[62,382,155],[179,386,145]].map(([x,z,range])=>({x,z,range}));
  const landCenter={x:132,z:331},roadsCenter={x:151,z:257},campCenter={x:205,z:326};
  function install(model){
    model("cut-wetland",waterMesh);model("cut-roads",roadMesh);model("cut-horizon",distantTreeLine);
    for(let i=0;i<foliageAreas.length;i++)model("cut-growth-"+i,g=>paintFoliage(g,i));
    model("cut-entry",g=>{gateSign(g);forkMarker(g);});model("cut-camp",workYard);model("cut-pier",pierMesh);
    model("cut-lamps",signalLights);model("cut-lamp-pools",lampPools);
    model("cut-mast-light",g=>g.cyl(tower.x,floor(tower.x,tower.z)+tower.h+.53,tower.z,.13,.13,.21,7,"#ff986f"));
  }
  function world(view,see,weather,t=0){
    if(!see(landCenter,236))return;
    view.draw("cut-wetland");view.draw("cut-horizon");
    if(see(roadsCenter,149)){view.draw("cut-roads");view.draw("cut-entry");}
    for(let i=0;i<foliageAreas.length;i++)if(see(foliageAreas[i],foliageAreas[i].range))view.draw("cut-growth-"+i);
    if(!see(campCenter,147))return;
    view.draw("cut-camp");view.draw("cut-pier");
    if((weather?.night||0)>.22){
      view.draw("cut-lamps",0,0,0,0,0,0,.88);
      if(see(campCenter,66))view.drawSearchlight("cut-lamp-pools");
      if(t%2.9<.48)view.draw("cut-mast-light",0,0,0,0,0,0,1);
    }
  }
  function paintMap(c,street){
    const {islands,trees,grass,routes,floorSections,ripples,creases}=landscape();
    const poly=(points,col)=>{
      c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
      c.closePath();c.fillStyle=col;c.fill();
    };
    const line=(points,col,w)=>{
      c.beginPath();c.moveTo(...points[0]);for(let i=1;i<points.length;i++)c.lineTo(...points[i]);
      c.strokeStyle=col;c.lineWidth=w;c.stroke();
    };
    const rect=(x,z,w,d,col)=>{c.fillStyle=col;c.fillRect(x,z,w,d);};
    c.lineJoin="round";c.lineCap="butt";
    const east=floorSections.map(p=>[p.right,p.z]),west=floorSections.map(p=>[p.left,p.z]);
    poly(east.concat(west.reverse()),street?"#598980":"#497874");
    line(east,street?"#648e83":"#62877b",1.6);
    for(const c of creases){
      const shape=mul=>c.samples.map(p=>side(p,mul*c.w*(1+.16*Math.sin(p.s*.071))));
      poly(shape(1).concat(shape(-1).reverse()),street?"#558278":"#4b7770");
      poly(shape(.62).concat(shape(-.62).reverse()),street?"#4b7e75":"#47726c");
    }
    channelSurface(poly,street);
    if(street)for(const p of ripples)line([[p.x-p.w,p.z-p.tilt],[p.x+p.w,p.z+p.tilt]],"#518178",.15);
    for(const i of islands){
      for(const p of i.outer)poly(p,street?"#748f7d":"#638675");
      for(const p of i.shore)poly(p,street?"#939b78":"#849679");
      for(const p of i.top)poly(p,street?["#9ba174","#a2a779","#98a174"][i.shade]:"#8c9c78");
      if(street)for(const p of i.inner)poly(p,["#929c6f","#a8aa77","#969f71"][i.shade]);
    }
    for(const p of [site().camp,...site().pads]){
      poly(ellipse(p.x,p.z,p.rx,p.rz,0,44),street?"#929a73":"#849577");
      poly(ellipse(p.x,p.z,p.rx*.94,p.rz*.94,0,44),street?"#c0ae88":"#a1a481");
    }
    if(street)for(const path of yardPaths){
      const samples=roadSamples({points:path.map(([x,z])=>({x,z}))}).samples;
      for(const n of [-1.14,1.14])line(samples.map(p=>side(p,n)),"#af9d7b",.65);
    }
    for(const route of routes){
      const paved=route.id!=="shell",w=route.halfWidth;
      const runs=route.id==="causeway"?[route.samples.filter(p=>p.z<=258),route.samples.filter(p=>p.z>=272)]:
        [route.id==="approach"?route.samples.filter(p=>p.z>=181):route.samples];
      for(const arr of runs){
        const ink=arr.map(p=>[p.x,p.z]);
        line(ink,street?(paved?"#aa9e7f":"#a09572"):"#8c977d",w*2+(paved?2.4:2.1));
        line(ink,paved?street?"#535d5b":"#3b5553":street?"#c8b286":"#aeaa82",w*2);
        if(paved&&street){
          for(const k of [-1,1])line(arr.map(p=>side(p,k*(w-.57))),"#cec9a9",.16);
          line(ink,"#dac28c",.22);
        }
        if(!paved&&street)for(const k of [-1.26,1.26])line(arr.map(p=>side(p,k)),"#b8a781",.65);
        if(route.id==="causeway"){
          const deck=arr.filter(p=>p.z>246&&p.z<282),road=deck.map(p=>[p.x,p.z]);
          line(road,street?"#828677":"#6f8176",w*2+.93);line(road,street?"#a0a395":"#85978b",w*2);
          for(const k of [-1,1])line(deck.map(p=>side(p,k*(w+.12))),street?"#d9cfad":"#b1b79b",street?.31:.62);
          if(street){
            for(const k of [-1,1])line(deck.map(p=>side(p,k*(w-.63))),"#d6d0b4",.17);
            for(const [i,p] of deck.entries())if(i%3===1)line([side(p,-w+.2),side(p,w-.2)],"#838b7e",.12);
          }
          line(road,street?"#cfb77f":"#b4b08c",street?.24:.49);
        }
      }
    }
    const end=site().routes[1].points.at(-1);
    poly(ellipse(end.x,end.z,5.64,4.44,-.18,22),street?"#535d5b":"#3b5553");
    for(const t of trees){
      const rad=t.scale*(t.willow?1.67:2.30),x=t.x,z=t.z;
      poly(ellipse(x+.73,z-.76,rad*1.18,rad*.83,-.12,8,t.seed,.26),street?"#788767":"#71876e");
      poly(ellipse(x,z,rad*1.25,rad*.93,-.10,8,t.seed,.31),street?"#5e795c":"#66806a");
      if(street)poly(ellipse(x-.39,z+.28,rad*.88,rad*.59,.09,7,t.seed+20,.29),"#7f915f");
    }
    if(street)for(const p of grass){
      line([[p.x-.33,p.z-.17],[p.x+.2,p.z+.36]],"#8a996a",.26);
      line([[p.x-.47,p.z+.07],[p.x+.14,p.z+.16]],"#aeb781",.23);
    }
    for(const h of huts){
      const l=h.x-h.w/2-.40,b=h.z-h.d/2-.39,w=h.w+.80,d=h.d+.78;
      rect(l+.80,b-1.0,w,d,street?"#928b70":"#809077");
      rect(l,b,w,d,street?h.roof:"#959f8b");
      rect(l,b,w,d*.5,street?h.trim:"#a9ad94");
      line([[l,h.z],[l+w,h.z]],street?"#848e80":"#7d8f7d",.23);
      if(street){
        for(let x=l+.3;x<l+w-.1;x+=.47)line([[x,b],[x,b+d]],"#939c8d",.060);
        rect(h.x-.7,b-.49,1.4,.49,"#b19974");
        if(h.sign==="SOL FM")rect(h.x-h.w*.31-1.06,b-.56,2.15,.53,"#d1bd91");
      }
    }
    const mast=tower;
    line([[mast.x+.1,mast.z],[mast.x+3.4,mast.z-5.2]],"#938e73",.37);
    poly([[mast.x-1.05,mast.z-.69],[mast.x+1.05,mast.z-.69],[mast.x,mast.z+1.12]],"#718776");
    if(street){
      rect(213.25,311.3,1.07,2.08,"#a38a6c");rect(179.76,328.87,1.07,1.52,"#b9bd9e");
      line([[210.8,316.3],[215.4,316.43]],"#8a9378",.23);
      line([[109,268.8],[111.8,268.8]],"#a38e6b",.26);rect(108.9,269.93,3.04,.46,"#aa9572");
      line([[gate.x-2.7,gate.z-.6],[gate.x+2.7,gate.z+.6]],"#637b67",.55);
    }
    const dock=site().dock,head=dock.x-dock.headW*.5,right=dock.x+dock.headW*.5;
    rect(dock.footX,dock.z-dock.walkW*.5,head-dock.footX,dock.walkW,street?"#b89b77":"#a79e7d");
    rect(head,dock.z-dock.headD*.5,dock.headW,dock.headD,street?"#b89b77":"#a79e7d");
    if(street){
      for(let x=dock.footX+.41;x<head;x+=.52)line([[x,dock.z-dock.walkW*.5],[x,dock.z+dock.walkW*.5]],"#968367",.075);
      for(let z=dock.z-dock.headD*.5;z<dock.z+dock.headD*.5;z+=.49)line([[head,z],[right,z]],"#99866a",.090);
      for(const x of [head+.22,right-.22])for(const z of [dock.z-dock.headD/2+.25,dock.z+dock.headD/2-.25])rect(x-.12,z-.12,.25,.25,"#766e58");
    }
  }
  function map(ctx,px,py,scale,street=false){
    const {left,right,south,north}=bounds,w=right-left,h=north-south;
    if(!ctx||!scale)return;
    const cx=ctx.canvas.width/2,cy=ctx.canvas.height/2,reach=Math.hypot(cx,cy);
    if(px(right)<cx-reach||px(left)>cx+reach||py(south)<cy-reach||py(north)>cy+reach)return;
    const key=!!street;
    if(!cache.has(key)){
      const res=street?3.3:1.72,width=Math.ceil(w*res),height=Math.ceil(h*res);
      const canvas=typeof OffscreenCanvas==="function"?new OffscreenCanvas(width,height):document.createElement("canvas");
      canvas.width=width;canvas.height=height;
      const c=canvas.getContext("2d");
      if(!c)return;
      c.setTransform(width/w,0,0,-height/h,-left*width/w,north*height/h);
      paintMap(c,street);cache.set(key,canvas);
    }
    ctx.drawImage(cache.get(key),px(left),py(north),w*scale,h*scale);
  }
  const box=(x,z,w,d,top,bottom=0)=>({x,z,w,d,top,bottom,streetProp:true});
  const blocks=huts.map(h=>box(h.x,h.z,h.w,h.d,.24+h.h+h.rise));
  blocks.push(box(tower.x,tower.z,1.64,1.55,4.45),box(214.0,312.1,1.28,2.05,1.35),
    box(180.20,329.6,1.07,1.52,1.48),box(185.1,336.4,1.14,1.14,1.17),box(110.4,270.11,3.05,.44,.89),
    box(210.8,316.3,.20,.22,2.10),box(215.4,316.43,.20,.22,2.10));
  for(const l of [-1,1])blocks.push(box(gate.x+l*2.25*.976,gate.z+l*2.25*.218,.34,.37,3.53));
  const camera=[box(tower.x,tower.z,.55,.55,tower.h+.8,4.4),
    box(gate.x,gate.z,5.75,.77,3.66,1.54),box(213.1,316.36,4.52,.24,1.94,1.04)];
  window.BayCutArt={install,world,map,blocks,camera,span,signText};
})();
