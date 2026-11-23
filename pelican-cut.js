/* The county approach, paved causeway and old shell levee form one connected road network. */
(() => {
  "use strict";
  const point=(x,z)=>({x,z}),distance=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const gate=point(144,144),camp={x:195,z:322,rx:31,rz:23};
  const pads=[{x:106,z:267,rx:8,rz:7},{x:198,z:285,rx:9,rz:7}];
  const station={id:"marsh-line",name:"Kit Bell · Pelican Cut field station",x:194,z:334};
  const dock={kind:"landing",id:"cut",name:"Pelican Cut Landing",x:249,z:320,footX:210,headW:7,headD:12,walkW:3.4,level:.46};
  const nodes=new Map(),links=new Map();
  function node(x,z){const key=x+","+z;if(!nodes.has(key)){const p=point(x,z);nodes.set(key,p);links.set(p,[]);}return nodes.get(key);}
  function road(id,name,width,coords){
    const points=coords.map(([x,z])=>node(x,z));
    const route={id,name,halfWidth:width,points,segments:[]};
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b.x-a.x,dz=b.z-a.z,length=Math.hypot(dx,dz);
      route.segments.push({a,b,dx,dz,length,inverseSquare:1/(length*length)});
      links.get(a).push({to:b,length});links.get(b).push({to:a,length});
    }return route;
  }
  const routes=[
    road("approach","Ocean Drive",6.1,[[144,144],[144,166],[144,205],[149,228]]),
    road("causeway","Pelican Causeway",5.6,[[149,228],[160,244],[173,258],[184,272],[194,291],[198,307],[190,325]]),
    road("shell","Shell Levee",3.6,[[149,228],[131,234],[110,249],[99,267],[108,286],[129,299],[146,306],[168,314],[190,325]])
  ];
  const coastPoints=[[180,213],[207,214],[232,206],[257,207],[279,216],[297,215],[307,221],[320,226.8],[337,220],[347,211],[359,200]];
  function coast(z){
    for(let i=1;i<coastPoints.length;i++){const [az,ax]=coastPoints[i-1],[bz,bx]=coastPoints[i];
      if(z<=bz)return ax+(bx-ax)*Math.max(0,(z-az)/(bz-az));}
    return 200;
  }
  function nearest(x,z){
    let best,smallest=Infinity;
    for(const route of routes)for(const segment of route.segments){
      const t=Math.max(0,Math.min(1,((x-segment.a.x)*segment.dx+(z-segment.a.z)*segment.dz)*segment.inverseSquare));
      const px=segment.a.x+segment.dx*t,pz=segment.a.z+segment.dz*t,sq=(x-px)**2+(z-pz)**2;
      if(sq<smallest){smallest=sq;best={x:px,z:pz,route,segment,t};}
    }
    best.d=Math.sqrt(smallest);return best;
  }
  const area=p=>p.z>177&&p.z<372&&p.x>67&&p.x<445;
  const ellipse=(p,x,z,r)=>((x-p.x)/(p.rx-r))**2+((z-p.z)/(p.rz-r))**2<=1;
  const smooth=v=>{const t=Math.max(0,Math.min(1,v));return t*t*(3-2*t);};
  function height(x,z){
    if(z<182)return .041;
    if(x>164&&x<187&&z>238&&z<259){
      const platform=window.BayDrawbridgeArt?.platformY(x,z);if(platform!=null)return platform;
    }
    let deck=.041+.119*smooth((z-182)/20)+.08*smooth((z-293)/18);
    if(z>236&&z<295&&x>143)deck+=1.98*smooth((z-238)/15)*(1-smooth((z-276)/18));
    if(z>313&&Math.abs(z-320)<3&&x>207)deck+=(.46-deck)*smooth((x-207)/4);
    return deck;
  }
  function land(x,z,r=0){
    if(z<176||z>347||x<86||x>227)return false;
    if(x>164&&x<187&&z>238&&z<259&&window.BayDrawbridgeArt?.platformY(x,z)!=null)return true;
    if(ellipse(camp,x,z,r)||pads.some(p=>ellipse(p,x,z,r)))return true;
    const n=nearest(x,z),raised=n.route.id==="causeway"&&z>250&&z<278;
    return n.d<n.route.halfWidth+(raised?.13:2.1)-r;
  }
  function grade(x,z){return z>181&&z<312?(height(x,z+.6)-height(x,z-.6))/1.2:0;}
  function surface(x,z){
    const n=nearest(x,z);
    if(n.d<=n.route.halfWidth)return n.route.id==="shell"?.73:1;
    return ellipse(camp,x,z,0)?.84:.62;
  }
  let closedSpan=()=>false;
  function route(from,to){
    const a=nearest(from.x,from.z),b=nearest(to.x,to.z);
    if(a.segment===b.segment)return [a,b];
    const costs=new Map(),back=new Map(),done=new Set();
    for(const p of [a.segment.a,a.segment.b])costs.set(p,distance(a,p));
    while(true){
      let current=null,cost=Infinity;
      for(const [p,value] of costs)if(!done.has(p)&&value<cost){current=p;cost=value;}
      if(!current)break;done.add(current);
      for(const edge of links.get(current)){
        if((current===routes[1].points[2]&&edge.to===routes[1].points[3]||current===routes[1].points[3]&&edge.to===routes[1].points[2])&&closedSpan())continue;
        const next=cost+edge.length;
        if(next<(costs.get(edge.to)??Infinity)){costs.set(edge.to,next);back.set(edge.to,current);}}
    }
    const left=b.segment.a,right=b.segment.b;
    let p=costs.get(left)+distance(left,b)<costs.get(right)+distance(right,b)?left:right;
    const chain=[];while(p){chain.unshift(p);p=back.get(p);}
    const result=[a];for(const v of [...chain,b])if(distance(result.at(-1),v)>.02)result.push(v);
    return result;
  }
  function circuit(reverse=false){
    const spine=routes[1].points.slice(0,-1).concat([...routes[2].points].reverse().slice(0,-1));
    if(reverse)spine.reverse();
    return spine.map((p,i)=>{
      const before=spine[(i+spine.length-1)%spine.length],after=spine[(i+1)%spine.length];
      const dx=after.x-before.x,dz=after.z-before.z,length=Math.hypot(dx,dz)||1;
      return point(p.x+1.20*dz/length,p.z-1.20*dx/length);
    });
  }
  window.BayCut={gate,camp,pads,station,dock,routes,coast,nearest,area,height,grade,land,surface,route,circuit,setSpanSignal(fn){closedSpan=fn;}};
})();
