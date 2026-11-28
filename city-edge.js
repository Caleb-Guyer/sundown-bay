// Canal Road follows the old drainage bank from the beach to the county approach.
// Tagged junctions are the places where the original grid meets the bank.
(() => {
  "use strict";
  const axes=[-144,-72,0,72,144],points=[],segments=[],links=new Map();
  const node=(x,z)=>({x,z});
  const distance=(a,b)=>Math.hypot(b.x-a.x,b.z-a.z);
  function link(a,b,canal=false){
    const dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
    const s={a,b,dx,dz,length,canal};
    segments.push(s);
    for(const [p,to] of [[a,b],[b,a]]){
      if(!links.has(p))links.set(p,[]);
      links.get(p).push({to,length});
    }
  }
  const grid=axes.map(x=>axes.map(z=>node(x,z)));
  for(let i=0;i<5;i++)for(let j=0;j<5;j++){
    if(i)link(grid[i-1][j],grid[i][j]);
    if(j)link(grid[i][j-1],grid[i][j]);
  }
  const south=[],west=[],north=[];
  function station(x,z,side,index){
    const p=node(x,z),prev=points.at(-1);
    if(prev)link(prev,p,true);
    p.at=prev?prev.at+distance(prev,p):0;
    points.push(p);
    if(!side)return;
    const sideRoads={south,west,north};
    sideRoads[side][index]=p;
    link(side==="west"?grid[0][index]:grid[index][side==="south"?0:4],p);
  }
  station(144,-162,"south",4);
  station(144,-174);station(142,-181);station(137,-187);station(129,-190);
  station(111,-191);station(72,-191,"south",3);station(40,-194);
  station(0,-195,"south",2);station(-38,-190);station(-72,-190,"south",1);
  station(-111,-193);station(-144,-193,"south",0);station(-170,-193);
  station(-181,-191);station(-189,-185);station(-194,-176);station(-196,-164);
  station(-196,-144,"west",0);station(-192,-108);station(-192,-72,"west",1);
  station(-198,-39);station(-198,0,"west",2);station(-193,40);
  station(-193,72,"west",3);station(-196,109);station(-196,144,"west",4);
  station(-196,163);station(-194,176);station(-187,185);station(-176,190);
  station(-162,192);station(-144,192,"north",0);station(-111,190);
  station(-72,190,"north",1);station(-38,195);station(0,195,"north",2);
  station(36,191);station(72,191,"north",3);station(110,187);
  station(144,187,"north",4);
  const length=points.at(-1).at;

  // One mitered strip supplies the pavement, shoulders, water and ink in both views.
  for(let i=0;i<points.length;i++){
    const a=points[Math.max(0,i-1)],p=points[i],b=points[Math.min(i+1,points.length-1)];
    const before=i?distance(a,p):distance(p,b),after=i+1<points.length?distance(p,b):before;
    const x1=i?-(p.z-a.z)/before:-(b.z-p.z)/after,z1=i?(p.x-a.x)/before:(b.x-p.x)/after;
    const x2=b===p?x1:-(b.z-p.z)/after,z2=b===p?z1:(b.x-p.x)/after;
    const div=1+x1*x2+z1*z2;
    p.nx=(x1+x2)/div;p.nz=(z1+z2)/div;
  }
  function along(at,offset=0){
    const i=points.findIndex(p=>p.at>=at),end=i<0?points.length-1:Math.max(1,i),b=points[end],a=points[end-1];
    const t=Math.max(0,Math.min(1,(at-a.at)/(b.at-a.at)));
    return {x:a.x+(b.x-a.x)*t+offset*(a.nx+(b.nx-a.nx)*t),
      z:a.z+(b.z-a.z)*t+offset*(a.nz+(b.nz-a.nz)*t)};
  }
  const faces=[],posts=[],trees=[],rail=[];
  function band(a,b,inner,outer,material,y,innerB=inner,outerB=outer){
    faces.push({points:[along(a,inner),along(b,innerB),along(b,outerB),along(a,outer)],material,y});
  }
  const junctions=[...south,...west,...north].map(p=>p.at);
  for(let i=1;i<points.length;i++){
    const a=points[i-1].at,b=points[i].at;
    const bankStart=Math.max(47,a),bankEnd=Math.min(length-26,b);
    if(bankStart<bankEnd){
      const width=d=>Math.min(1,(d-47)/23,(length-26-d)/21)*(10+2.7*Math.sin(d*.033)+1.8*Math.cos(d*.019));
      const bank=d=>11.7+.9*Math.sin(d*.05);
      const u=bank(bankStart),v=bank(bankEnd),w=width(bankStart),h=width(bankEnd);
      band(bankStart,bankEnd,6.4,u+w+8,"grass",.098,6.4,v+h+8);
      band(bankStart,bankEnd,u-1,u+w+1.5,"silt",.103,v-1,v+h+1.5);
      band(bankStart,bankEnd,u,u+w,"water",.107,v,v+h);
      band(bankStart,bankEnd,u+w*.18,u+w*.78,"channel",.109,v+h*.18,v+h*.78);
      rail.push([along(bankStart,8.3),along(bankEnd,8.3)]);
    }
    band(a,b,-7.25,7.55,"shoulder",.112);
    band(a,b,-5.75,5.75,"road",.121);
    if(a>=14&&b<=length-16)band(a,b,5.37,5.48,"edge",.131);
  }
  for(let d=3;d<length-5;d+=8){
    if(junctions.every(j=>Math.abs(j-d)>10))band(d,d+3,-.10,.10,"line",.135);
  }
  for(let d=47;d<length-25;d+=7.4)posts.push(along(d,8.3));
  for(let d=64;d<length-42;d+=10.9+4.8*Math.sin(d*.3)){
    if(Math.sin(d*.063)>.80)continue;
    trees.push(along(d,29+3.4*Math.cos(d*.37)));
  }
  for(const [side,nodes] of [["south",south],["west",west],["north",north]])for(const p of nodes){
    if(p===points[0]||p===points.at(-1))continue;
    // Flare the mouth through the gravel shoulder. The stop line faces the bank.
    const aim=(across,inward)=>side==="west"?{x:p.x+inward,z:p.z+across}:
      {x:p.x+across,z:p.z+(side==="south"?inward:-inward)};
    const polygon=(coords,material,y)=>faces.push({points:coords.map(([u,v])=>aim(u,v)),material,y});
    polygon([[-7.0,12],[-7.0,9],[-9.8,5],[9.8,5],[7.0,9],[7.0,12]],"road",.126);
    const lane=side==="south"?-1:1;
    polygon([[.32*lane,9.8],[6.43*lane,9.8],[6.43*lane,10.13],[.32*lane,10.13]],"edge",.136);
  }
  const colors={grass:"#859773",silt:"#9aa080",water:"#829e92",channel:"#567e78",
    shoulder:"#c4b89c",road:"#525c60",edge:"#d7d0b6",line:"#dfbe79"};
  // The pump house sits opposite the freight yards, with two intake bays facing the channel.
  const pump={x:-229,z:-103};
  function mesh(g){
    for(const f of faces){
      const v=f.points.map(p=>[p.x,f.y,p.z]);
      for(let i=1;i<v.length-1;i++)g.tri(v[0],v[i],v[i+1],colors[f.material]);
    }
    for(const [a,b] of rail){
      const dx=b.x-a.x,dz=b.z-a.z,l=Math.hypot(dx,dz),x=-dz*.09/l,z=dx*.09/l;
      g.quad([a.x-x,.48,a.z-z],[b.x-x,.48,b.z-z],[b.x-x,.68,b.z-z],[a.x-x,.68,a.z-z],"#a69e88");
      g.quad([a.x-x,.68,a.z-z],[b.x-x,.68,b.z-z],[b.x+x,.68,b.z+z],[a.x+x,.68,a.z+z],"#d2c5a6");
      g.quad([a.x+x,.68,a.z+z],[b.x+x,.68,b.z+z],[b.x+x,.48,b.z+z],[a.x+x,.48,a.z+z],"#978f79");
    }
    for(const p of posts){
      g.box(p.x,.52,p.z,.26,.93,.28,"#95856d");g.box(p.x,.88,p.z,.28,.13,.30,"#e1d1a6");
    }
    // Low mangroves on the far bank leave the port skyline visible across the water.
    for(const [i,p] of trees.entries()){
      if(Math.abs(p.x-pump.x)<7&&Math.abs(p.z-pump.z)<10)continue;
      const h=1.65+.65*Math.sin(i*2.4),r=2.5+.55*Math.sin(i*4.2);
      g.box(p.x,.6,p.z,.32,1,.34,"#7d7662");
      g.cyl(p.x,h,p.z,r,1.25,h,6,i%3?"#788a72":"#627c69");
      g.cyl(p.x+.8,h*1.45,p.z+.5,r*.75,.65,h*.57,5,"#8c9c78");
    }
    const {x,z}=pump;
    g.box(x,.34,z,9.6,.65,15.8,"#a9a28d");
    g.box(x,2.18,z,8.2,3.25,13.6,"#c8b695");
    g.box(x,3.93,z,8.8,.32,14.2,"#687d78");
    g.box(x-.8,4.57,z+3.5,2.3,1.05,3.1,"#91a49a");
    for(const dz of [-3.4,3.4]){
      g.box(x+4.12,1.94,z+dz,.09,2.32,3.55,"#53655e");
      for(let bar=0;bar<6;bar++)g.box(x+4.19,1.00+bar*.36,z+dz,.12,.10,3.49,"#92a197");
      g.pole([x+4.2,.63,z+dz],[x+10,.63,z+dz],.48,"#8c9284",8);
      g.pole([x+10,.63,z+dz],[x+11,.10,z+dz],.48,"#818a7d",8);
    }
  }
  function paint(ctx,street){
    for(const f of faces){
      const [a,...rest]=f.points;ctx.beginPath();ctx.moveTo(a.x,a.z);
      for(const p of rest)ctx.lineTo(p.x,p.z);
      ctx.closePath();ctx.fillStyle=!street&&f.material==="road"?"#364e51":colors[f.material];ctx.fill();
    }
    for(const [i,p] of trees.entries()){
      if(Math.abs(p.x-pump.x)<7&&Math.abs(p.z-pump.z)<10)continue;
      ctx.beginPath();ctx.ellipse(p.x,p.z,2.7,2.1,i,0,Math.PI*2);ctx.fillStyle=i%3?"#788a72":"#627c69";ctx.fill();
    }
    ctx.fillStyle="#a9a28d";ctx.fillRect(pump.x-4.8,pump.z-7.9,9.6,15.8);
    ctx.fillStyle="#687d78";ctx.fillRect(pump.x-4.4,pump.z-7.1,8.8,14.2);
    if(street){
      ctx.fillStyle="#91a49a";ctx.fillRect(pump.x-1.95,pump.z+1.95,2.3,3.1);
      for(const dz of [-3.4,3.4])ctx.fillRect(pump.x+4.4,pump.z+dz-.48,6.6,.96);
    }
    if(street){
      ctx.strokeStyle="#b2a78e";ctx.lineWidth=.24;ctx.beginPath();
      for(const [a,b] of rail){ctx.moveTo(a.x,a.z);ctx.lineTo(b.x,b.z);}ctx.stroke();
      for(const p of posts){ctx.fillStyle="#9b9077";ctx.fillRect(p.x-.19,p.z-.19,.38,.38);}
    }
  }
  // Avoid walking the graph for ordinary city play or for distant county traffic.
  const vicinity=(x,z)=>x>=-209&&x<=152&&z>=-206&&z<=205&&(x< -152||z< -152||z>152);
  // A sixty-metre halo covers both lanes and the entire bank at the grid edge.
  const cells=new Map(),cellKey=(x,z)=>x+z*128;
  for(const s of segments){
    const left=Math.floor((Math.min(s.a.x,s.b.x)-30)/32),right=Math.floor((Math.max(s.a.x,s.b.x)+30)/32);
    const bottom=Math.floor((Math.min(s.a.z,s.b.z)-30)/32),top=Math.floor((Math.max(s.a.z,s.b.z)+30)/32);
    for(let x=left;x<=right;x++)for(let z=bottom;z<=top;z++){
      const key=cellKey(x,z);if(!cells.has(key))cells.set(key,[]);cells.get(key).push(s);
    }
  }
  function closest(p,canalOnly=false){
    let best,least=Infinity;
    const local=cells.get(cellKey(Math.floor(p.x/32),Math.floor(p.z/32)));
    function scan(list){
      for(const s of list){
        if(canalOnly&&!s.canal)continue;
        const t=Math.max(0,Math.min(1,((p.x-s.a.x)*s.dx+(p.z-s.a.z)*s.dz)/(s.length*s.length)));
        const x=s.a.x+s.dx*t,z=s.a.z+s.dz*t,d2=(p.x-x)**2+(p.z-z)**2;
        if(d2<least){best={x,z,s,t};least=d2;}
      }
    }
    if(local)scan(local);
    if(least>900)scan(segments);
    best.d=Math.sqrt(least);return best;
  }
  function land(x,z,r=0){
    if(!vicinity(x,z))return false;
    const n=closest({x,z},true),s=n.s;
    const out=((z-n.z)*s.dx-(x-n.x)*s.dz)/s.length;
    return n.d<=25-r&&out<=8.7-r;
  }
  function route(from,to){
    const a=closest(from),b=closest(to);
    const start=node(a.x,a.z),finish=node(b.x,b.z);
    if(a.s===b.s)return [start,finish];
    const costs=new Map([[a.s.a,a.t*a.s.length],[a.s.b,(1-a.t)*a.s.length]]),prev=new Map(),done=new Set();
    for(;;){
      let p=null,cost=Infinity;
      for(const [v,c] of costs)if(!done.has(v)&&c<cost){p=v;cost=c;}
      if(!p||done.has(b.s.a)&&done.has(b.s.b))break;
      done.add(p);
      for(const e of links.get(p))if(cost+e.length<(costs.get(e.to)??Infinity)){
        costs.set(e.to,cost+e.length);prev.set(e.to,p);
      }
    }
    const end=costs.get(b.s.a)+b.t*b.s.length<=costs.get(b.s.b)+(1-b.t)*b.s.length?b.s.a:b.s.b;
    const chain=[];for(let p=end;p;p=prev.get(p))chain.push(p);
    const result=[start];
    for(const p of [...chain.reverse(),finish])if(distance(result.at(-1),p)>.02)result.push(node(p.x,p.z));
    return result;
  }
  window.BayCityEdge={south,west,north,points,along,length,mesh,paint,closest,vicinity,land,route};
})();
