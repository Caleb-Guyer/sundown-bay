/* The shell faces Ocean Drive. U runs across its proscenium and V runs upstage. */
(() => {
  "use strict";
  const tau=Math.PI*2,quarter=Math.PI/2,deckY=.57;
  const deck={x:187.5,y:deckY,z:83,yaw:quarter};
  const mark=(x,z,y=deckY,yaw=-quarter)=>({x,y,z,yaw});
  const kit=mark(188.35,83.1);
  kit.pads=[
    {id:"kick",x:187.98,y:.617,z:83.27},{id:"snare",x:187.89,y:1.39,z:83.02},
    {id:"hat",x:187.89,y:1.585,z:82.61}
  ];
  const site={
    x:deck.x,z:deck.z,name:"Sol Sound Shell",deck,kit,front:mark(183,83),
    ramp:mark(179.4,83,.007),kitEntry:mark(189.17,83.80),
    board:{...mark(181,77.75,.007),kind:"sound-shell",name:"Sol Sound Shell"},
    june:mark(185.6,80.2),lena:mark(186.85,86.15),ben:mark(188.6,79.55),
    call:mark(182.5,82.1,.007+(deckY-.007)*3.1/3.6)
  };
  site.kitRoute=[site.ramp,site.front,mark(185.8,84.7),mark(188.95,84.7),site.kitEntry];
  const mixerAt=mark(181,76.62,.007,0);
  const demoAt=mark(186,83,deckY,quarter-.15);
  function floor(x,z){
    if(z>=77.5&&z<=88.5&&x>=183&&x<=191.8)return deckY;
    if(x>=179.4&&x<183&&z>=80.25&&z<=85.75)return .007+(deckY-.007)*(x-179.4)/3.6;
    return null;
  }
  const shellPoint=(u,v)=>({x:deck.x+v,z:deck.z-u});
  const wall=(u,v,w,d,bottom,top)=>({...shellPoint(u,v),w:d,d:w,bottom,top,streetProp:true});
  const blocks=[
    wall(0,4.24,10.8,.16,.50,3.67),
    ...[-1,1].flatMap(k=>[wall(k*5.30,1.65,.25,5.24,.35,2.12),wall(k*5.30,-1.09,.41,.47,.35,3.05)]),
    wall(-3.93,2.74,.86,.60,deckY,1.94),wall(4.24,2.12,.92,.51,deckY,1.32),
    wall(-3.56,-3.29,.84,.49,deckY,.96),wall(3.16,-3.49,.78,.43,deckY,.93),
    {x:187.35,z:83.27,w:.57,d:.63,bottom:deckY,top:1.285,streetProp:true},
    {x:mixerAt.x,z:mixerAt.z,w:1.48,d:.77,bottom:0,top:.99,streetProp:true}
  ];
  // The taller arch boxes affect the camera boom independently of the clear walkable deck.
  const cameraBlocks=[wall(0,1.59,5.6,5.59,5.04,6.75),
    ...[-1,1].flatMap(k=>[wall(k*3.40,1.59,1.19,5.59,4.00,5.86),wall(k*4.63,1.59,.94,5.59,2.93,4.96)])];
  const ink="#334442",iron="#43504c",steel="#7f9189",silver="#c2c5af",chalk="#eddbb2",paper="#dfcda3";
  const coral="#c8816e",coralShade="#a46359",buff="#d7aa88",teal="#537d76",sage="#92aa96",gold="#d0a367";
  const flat=y=>(x,z)=>[x,y,z],front=v=>(x,y)=>[x,y,v],clamp=(n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  function polygon(g,plane,pts,color){
    const a=plane(...pts[0]);for(let i=2;i<pts.length;i++)g.tri(a,plane(...pts[i-1]),plane(...pts[i]),color);
  }
  function rect(g,p,x,y,w,h,c){g.quad(p(x-w/2,y-h/2),p(x+w/2,y-h/2),p(x+w/2,y+h/2),p(x-w/2,y+h/2),c);}
  function stroke(g,p,pts,w,c){
    for(let i=1;i<pts.length;i++){
      const a=pts[i-1],b=pts[i],dx=b[0]-a[0],dy=b[1]-a[1],r=w/(2*(Math.hypot(dx,dy)||1)),h=-dy*r,k=dx*r;
      g.quad(p(a[0]+h,a[1]+k),p(b[0]+h,b[1]+k),p(b[0]-h,b[1]-k),p(a[0]-h,a[1]-k),c);
    }
  }
  function ellipse(g,p,x,y,rx,ry,c,n=16){
    for(let i=0;i<n;i++){
      const a=tau*i/n,b=tau*(i+1)/n;g.tri(p(x,y),p(x+rx*Math.cos(a),y+ry*Math.sin(a)),p(x+rx*Math.cos(b),y+ry*Math.sin(b)),c);
    }
  }
  const glyph={
    A:"00 24 40|11 31",B:"00 04 34 43 32 02|32 41 30 00",C:"43 34 14 03 01 10 30 41",
    D:"00 04 24 43 41 20 00",E:"44 04 00 40|02 32",F:"44 04 00|02 32",G:"43 34 14 03 01 10 30 41 42 22",
    H:"00 04|40 44|02 42",I:"04 44|24 20|00 40",K:"00 04|02 44|12 40",L:"04 00 40",
    M:"00 04 22 44 40",N:"00 04 40 44",O:"14 34 43 41 30 10 01 03 14",P:"00 04 34 43 32 02",
    R:"00 04 34 43 32 02|22 40",S:"44 14 03 12 32 41 30 00",T:"04 44|24 20",
    U:"04 01 10 30 41 44",V:"04 20 44",W:"04 10 22 30 44",Y:"04 22 44|22 20",
    0:"14 34 43 41 30 10 01 03 14",1:"13 24 20|10 30",2:"03 14 34 43 00 40",
    5:"44 04 02 32 41 30 00",8:"14 34 43 32 12 03 14|12 01 10 30 41 32",9:"42 12 03 14 34 43 41 30 10"
  };
  const type={};
  for(const [letter,paths] of Object.entries(glyph))type[letter]=paths.split("|").map(s=>s.split(" ").map(q=>[+q[0]/4,+q[1]/4]));
  function legend(g,p,word,u,y,h,color,width=.65,spacing=.20,weight=.105){
    const step=h*(width+spacing),start=u-(word.length*step-h*spacing)*.5;
    for(let i=0;i<word.length;i++)for(const path of type[word[i]]||[]){
      stroke(g,p,path.map(([x,z])=>[start+step*i+x*width*h,y+z*h]),weight*h,color);
    }
  }
  function shellMark(g,p,cx,cy,k,field,edge){
    const q=(x,y)=>p(cx+k*x,cy+k*y);
    const disc=[[-.22,-.51],[-.60,-.28],[-.86,.07],[-.80,.25],[-.67,.28],[-.65,.47],[-.47,.55],
      [-.34,.50],[-.23,.68],[-.07,.72],[0,.63],[.13,.73],[.30,.68],[.37,.48],[.55,.54],[.70,.43],
      [.72,.27],[.86,.17],[.87,.01],[.57,-.31],[.21,-.51]];
    for(let i=1;i<disc.length;i++)g.tri(q(0,-.37),q(...disc[i-1]),q(...disc[i]),field);
    polygon(g,q,[[-.24,-.46],[.22,-.46],[.34,-.62],[-.36,-.62]],field);
    for(const [i,x] of [-.72,-.48,-.22,.02,.27,.50,.73].entries()){
      const h=[.18,.43,.57,.63,.55,.40,.16][i];stroke(g,q,[[x*.11,-.39],[x*.52,.02],[x,h]],.043,edge);
    }
  }
  function apron(g){
    const ground=flat(.017);
    polygon(g,ground,[[-6.16,-9.87],[6.08,-9.87],[6.1,-4.22],[5.5,-3.92],[-5.38,-3.92],[-6.16,-4.37]],"#c1ac8e");
    for(const x of [-4.33,-1.42,1.5,4.40])stroke(g,flat(.021),[[x,-9.84],[x+.035,-4.08]],.023,"#a29079");
    stroke(g,flat(.021),[[-6.09,-7.12],[6.08,-7.10]],.027,"#ac9b82");
    const deckPlane=flat(deckY+.001);
    g.box(0,deckY*.5,-.10,11,deckY,8.80,"#a48668");
    const boards=["#bfa282","#c2a78a","#b79a7f","#c5a98c","#b99e80","#c6af91"];
    for(let i=0;i<35;i++){
      const u=-5.5+(i+.5)*11/35;
      rect(g,deckPlane,u,-.1,.304,8.775,boards[(i*7+Math.floor(i/3))%boards.length]);
      const join=-2.8+(i*1.927)%5.4;
      rect(g,flat(deckY+.006),u,join,.302,.012,"#9b866e");
      if(i%4===0)stroke(g,flat(deckY+.007),[[u-.068,-2.3+join*.28],[u-.052,-2+join*.27],[u-.083,-1.73+join*.24]],.015,"#b1987e");
    }
    const lip=front(-4.509);
    for(let i=0;i<3;i++)rect(g,lip,0,.143+i*.139,10.96,.09,i%2?"#7f9690":"#8eaaa0");
    const slope=(u,v)=>[u,.014+(deckY-.007)*(v+8.10)/3.6,v];
    g.quad(slope(-2.75,-8.10),slope(2.75,-8.10),slope(2.75,-4.50),slope(-2.75,-4.50),"#a89477");
    for(let i=0;i<14;i++)rect(g,slope,0,-8.10+(i+.5)*3.6/14,5.47,.244,boards[(i+2)%6]);
    for(const side of [-1,1]){
      const x=side*2.75;
      g.tri([x,.008,-8.1],[x,deckY,-4.5],[x,.008,-4.5],"#8e7963");
      stroke(g,slope,[[x-side*.080,-8.00],[x-side*.080,-4.55]],.055,"#d9bd8d");
      for(const v of [-7.7,-6.5,-5.28])rect(g,slope,x-side*.20,v,.076,.12,iron);
    }
    // Cloth tape marks musicians' feet, two monitor positions and the lead cable's turns.
    for(const [x,v,c] of [[2.8,-1.9,"#a6685a"],[-3.15,-.65,teal],[-.10,.85,"#ba955c"]]){
      stroke(g,flat(.583),[[x-.28,v+.15],[x-.28,v-.10],[x-.05,v-.10]],.058,c);
      rect(g,flat(.582),x+.24,v+.06,.078,.37,c);
    }
    const cables=[
      [[2.45,-1.96],[2.16,-2.51],[2.36,-3.08],[3.12,-3.36]],
      [[-2.94,-.69],[-2.56,-.01],[-2.75,.61],[-3.87,1.05],[-3.91,2.35]],
      [[3.73,2.16],[3.09,2.44],[2.19,2.67],[.23,2.5],[-1.26,2.74],[-4.32,2.60]],
      [[-3.70,-3.22],[-4.20,-3.36],[-4.66,-2.66],[-4.59,.35],[-4.92,1.72]]
    ];
    for(const chain of cables)stroke(g,flat(.590),chain,.030,"#52514a");
    for(const [x,v,rot] of [[2.20,-2.58,.2],[-3.24,.84,-.61],[1.13,2.56,.24],[-4.62,-1.36,.28]])
      g.box(x,.598,v,.20,.015,.083,"#7d806f",rot);
    // Repaired planks and the scuffed rug under the kit.
    rect(g,flat(.585),-.08,.68,2.53,2.34,"#a28170");
    rect(g,flat(.588),-.08,.68,2.44,2.25,"#825f59");
    for(const k of [-1,1]){
      rect(g,flat(.590),-.08+k*1.10,.68,.034,2.13,"#b79c79");
      rect(g,flat(.590),-.08,.68+k*.98,2.24,.035,"#bb9f82");
      for(let i=0;i<10;i++)rect(g,flat(.588),-1.18+i*.24,.68+k*1.17,.056,.12,"#c0ab89");
    }
    for(const [x,v] of [[-.91,1.51],[.77,-.14],[.67,1.59]]){
      polygon(g,flat(.593),[[x-.13,v],[x,v+.10],[x+.13,v],[x,v-.10]],"#b29373");
    }
  }
  // The mouth is a ribbed vault in the old boardwalk's faded shell-pink plaster.
  const ribs=18;
  function archPoint(t,a,skin=0){
    const f=t/4.9,rad=5.28-.31*f+skin,cap=3.58-1.22*f+skin;
    return [rad*Math.cos(a),2.03+.13*f+cap*Math.sin(a),-1.0+t];
  }
  function archBand(g,t,r0,r1,colors){
    for(let i=0;i<ribs;i++){
      const a=i*Math.PI/ribs,b=(i+1)*Math.PI/ribs;
      g.quad(archPoint(t,a,r0),archPoint(t,b,r0),archPoint(t,b,r1),archPoint(t,a,r1),colors[i%colors.length]);
    }
  }
  function vault(g){
    const faceTone=["#d4a68e","#dbb499","#d9b096"],outer=["#bc8979","#c1907e","#c69985"];
    for(let band=0;band<4;band++){
      const a=band*1.225,b=(band+1)*1.225;
      for(let i=0;i<ribs;i++){
        const u=i*Math.PI/ribs,v=(i+1)*Math.PI/ribs;
        g.quad(archPoint(a,u),archPoint(b,u),archPoint(b,v),archPoint(a,v),faceTone[(Math.abs(i-8)+band)%3]);
        g.quad(archPoint(b,u,.20),archPoint(a,u,.20),archPoint(a,v,.20),archPoint(b,v,.20),outer[(i+band)%3]);
        if(band===0||band===3)g.quad(archPoint(a,u,-.015),archPoint(a,v,-.015),archPoint(a+.09,v,-.015),archPoint(a+.09,u,-.015),buff);
      }
    }
    archBand(g,0,-.08,.23,[chalk]);archBand(g,-.033,-.010,.040,[coralShade]);archBand(g,4.9,0,.21,[coralShade]);
    for(const side of [-1,1]){
      const a=side*5.27,b=side*4.97;
      g.quad([a,.49,-1],[b,.49,3.90],[b,2.18,3.9],[a,2.03,-1],coral);
      g.quad([a+side*.18,.49,-1],[b+side*.18,.49,3.90],[b+side*.18,2.18,3.9],[a+side*.18,2.03,-1],coralShade);
      g.box(side*5.29,1.38,-1.06,.41,1.74,.46,"#c38f76");
      for(const [u,h,w,d,c] of [[5.31,.76,.49,.55,buff],[5.31,1.07,.44,.49,teal],[5.28,1.98,.54,.54,chalk],[5.31,2.10,.46,.49,coralShade]])
        g.box(side*u,h,-1.06,w,.095,d,c);
    }
  }
  function backWall(g){
    const p=front(3.90),trim=front(3.884),art=front(3.87);
    rect(g,p,0,1.36,10.08,1.64,coral);
    for(let i=0;i<ribs;i++){
      const a=archPoint(4.9,i*Math.PI/ribs),b=archPoint(4.9,(i+1)*Math.PI/ribs);
      g.tri([0,2.15,3.90],a,b,"#c88c77");
    }
    rect(g,trim,0,.781,10.1,.36,"#876f65");rect(g,trim,0,.990,10.1,.058,brassColor());
    // A scallop and thin alternating sun rays were painted on the original sounding board.
    for(let i=0;i<11;i++){
      const a=.06+i*(Math.PI-.12)/10,u=3.71*Math.cos(a),h=2.28*Math.sin(a);
      stroke(g,trim,[[.92*Math.cos(a),1.54+.63*Math.sin(a)],[u,1.55+h]],i%2?.045:.078,i%2?"#d4a38a":"#dcb095");
    }
    shellMark(g,art,0,2.37,1.08,"#efd2a2","#c38f73");
    for(const k of [-1,1]){
      for(let i=0;i<3;i++){
        const half=2.06-i*.22;stroke(g,trim,[[k*1.37,1.99-i*.16],[k*half,1.99-i*.16],[k*(half+.55),2.05-i*.16],[k*(3.61-i*.13),2.05-i*.16]],.047,"#e4b998");
      }
      // Salt-line repairs expose two older coats below the downspouts.
      polygon(g,trim,[[k*4.64,1.15],[k*4.29,1.13],[k*4.15,1.29],[k*3.94,1.35],[k*4.50,1.39]],"#b78271");
    }
    for(const side of [-1,1])for(const v of [-.8,1.44,3.77]){
      g.box(side*5.21,1.23,v,.18,1.27,.22,"#a77967");
      g.box(side*5.10,1.65,v,.09,.42,.26,"#caa486");
    }
  }
  function brassColor(){return "#bb9a73";}
  function marquee(g){
    const silhouette=[[-3.47,4.91],[-3.47,5.20],[-2.89,5.20],[-2.89,5.50],[-1.97,5.50],[-1.97,6.08],
      [-1.55,6.08],[-1.55,6.33],[1.55,6.33],[1.55,6.08],[1.97,6.08],[1.97,5.50],[2.89,5.50],[2.89,5.20],[3.47,5.20],[3.47,4.91]];
    const toe=front(-1.26),back=front(-.96);
    for(let i=1;i<silhouette.length;i++){
      const a=silhouette[i-1],b=silhouette[i];if(Math.abs(a[0]-b[0])>.001&&a[1]>4.92)
        rect(g,toe,(a[0]+b[0])/2,(a[1]+4.88)/2,Math.abs(a[0]-b[0]),a[1]-4.88,teal);
      g.quad(toe(...a),toe(...b),back(...b),back(...a),i%2?sage:teal);
    }
    stroke(g,front(-1.277),silhouette,.056,paper);
    legend(g,front(-1.285),"SOL",0,5.55,.59,chalk,.82,.26,.12);
    legend(g,front(-1.287),"SOUND SHELL",0,5.035,.33,"#efd09c",.65,.22,.11);
    for(const k of [-1,1]){
      stroke(g,front(-1.282),[[k*1.83,5.38],[k*2.65,5.38]],.058,gold);
      stroke(g,front(-1.282),[[k*1.68,5.49],[k*2.25,5.49]],.042,gold);
      stroke(g,front(-1.282),[[k*1.48,5.73],[k*1.81,5.73]],.037,sage);
    }
    rect(g,front(-1.275),0,4.915,6.9,.066,coral);g.box(0,4.85,-1.11,7.02,.095,.43,buff);
  }
  function wedges(g){
    for(const [x,z,w,d] of [[3.16,-3.49,.78,.43],[-3.56,-3.29,.84,.49]]){
      const left=x-w/2,right=x+w/2,a=z-d/2,b=z+d/2,base=deckY+.018;
      const slope=(u,v)=>[u,base+.32-(v-a)*.23/d,v];
      g.quad(slope(left,a),slope(right,a),slope(right,b),slope(left,b),"#3f4744");
      for(const side of [left,right])g.quad([side,base,a],slope(side,a),slope(side,b),[side,base,b],ink);
      g.quad([left,base,a],[right,base,a],slope(right,a),slope(left,a),iron);
      for(let i=0;i<9;i++)stroke(g,slope,[[left+.08,a+.04+i*d*.092],[right-.08,a+.04+i*d*.092]],.011,"#737a6e");
      g.box(x+.19,base+.12,a-.01,.14,.052,.015,paper);
    }
  }
  function amp(g,x,z,w,h,d,tweed){
    const y=deckY+.05,face=front(z-d/2-.008),woven=tweed?"#bb9b6c":"#56625c";
    g.box(x,y+h/2,z,w,h,d,tweed?"#998363":"#454b48");
    rect(g,face,x,y+h*.46,w-.086,h*.75,woven);
    for(let i=0;i<12;i++)rect(g,front(z-d/2-.014),x+(i-5.5)*w*.073,y+h*.46,.014,h*.72,tweed?"#a88b67":"#677467");
    for(let i=0;i<7;i++)rect(g,front(z-d/2-.017),x,y+h*(.15+i*.1),w-.096,.012,tweed?"#c8ae86":"#70776a");
    rect(g,face,x,y+h*.92,w-.085,h*.09,tweed?"#544c42":ink);
    for(let i=0;i<5;i++)ellipse(g,front(z-d/2-.021),x+w*(.12-i*.093),y+h*.922,.021,.021,brassColor(),6);
    for(const k of [-1,1])for(const q of [-1,1]){
      g.box(x+k*(w*.5-.049),y+h*.50+q*(h*.5-.052),z-d/2-.02,.091,.09,.048,steel);
      if(q===-1)g.cyl(x+k*(w*.5-.095),y-.018,z,.035,.05,.043,6,iron);
    }
    g.box(x,y+h+.023,z,.25,.046,.065,ink);g.box(x+w*.25,y+h*.78,z-d/2-.023,.15,.064,.017,brassColor());
  }
  function micStand(g){
    const base=[3.07,.593,-2.43],top=[3.07,1.77,-2.43],mouth=[2.785,2.115,-2.09];
    for(let i=0;i<3;i++){
      const a=i*tau/3+.32,b=[base[0]+Math.cos(a)*.29,.609,base[2]+Math.sin(a)*.29];
      g.pole([base[0],.75,base[2]],b,.017,iron,5);g.box(b[0],.607,b[2],.06,.039,.072,ink,a);
    }
    g.pole(base,top,.017,steel,6);g.pole([base[0],1.22,base[2]],[base[0],1.32,base[2]],.027,ink,6);
    g.pole([3.17,1.67,-2.57],mouth,.014,silver,6);
    g.pole([3.10,1.72,-2.48],[3.18,1.66,-2.61],.032,ink,6);
    g.pole([2.92,2.025,-2.25],mouth,.031,"#494e49",7);g.pole([2.82,2.093,-2.13],mouth,.044,steel,8);
    const cable=[[2.92,2.045,-2.11],[2.96,1.89,-2.16],[3.005,1.82,-2.30],[3.08,1.69,-2.43],[3.08,.63,-2.44]];
    for(let i=1;i<cable.length;i++)g.pole(cable[i-1],cable[i],.008,ink,4);
    stroke(g,flat(.587),[[3.08,-2.44],[3.25,-2.74],[3.43,-2.89],[3.63,-2.83],[3.71,-2.62],[3.53,-2.49],[3.32,-2.57],[3.20,-2.77],[3.09,-3.18]],.022,ink);
  }
  function backline(g){
    amp(g,-3.93,2.74,.86,1.25,.60,false);amp(g,4.24,2.12,.92,.69,.51,true);
    wedges(g);micStand(g);
    // Folded music stand with two yellowed pages, behind June and off her guitar shoulder.
    const x=4.57,z=-.06,y=.57;
    g.pole([x,y+.04,z],[x,y+1.12,z],.012,iron,5);
    for(let i=0;i<3;i++){const a=i*tau/3;g.pole([x,y+.19,z],[x+Math.cos(a)*.23,y+.025,z+Math.sin(a)*.23],.012,iron,4);}
    const page=(u,h)=>[x+u,y+1.00+h,z+.32*h];
    rect(g,page,0,.13,.56,.36,iron);
    for(const k of [-1,1]){rect(g,page,k*.126,.135,.225,.31,paper);
      for(let i=0;i<5;i++){rect(g,(u,h)=>{const v=page(u,h);v[2]-=.005;return v;},k*.126,.047+i*.041,.177-i%2*.041,.008,"#746e5e");}}
    const plinth=front(-1.303);
    rect(g,plinth,5.28,1.42,.30,.49,"#6f725e");rect(g,front(-1.307),5.28,1.42,.258,.439,"#b8a476");
    legend(g,front(-1.310),"1958",5.28,1.474,.064,ink,.58,.18,.13);
    shellMark(g,front(-1.313),5.28,1.33,.095,teal,"#b7aa7f");
  }
  function lampY(i){return i===1?4.97:4.42;}
  function lanterns(g){
    for(let i=0;i<3;i++){
      const x=(i-1)*2.41,y=lampY(i);
      g.pole([x,y+.34,-.72],[x,y+.10,-.74],.042,iron,6);
      g.box(x,y+.06,-.74,.38,.06,.15,iron);g.box(x-.167,y-.07,-.74,.04,.22,.13,steel);
      g.box(x+.167,y-.07,-.74,.04,.22,.13,steel);
      g.pole([x,y-.08,-.74],[x,y-.29,-.50],.133,ink,10);
      g.pole([x,y-.227,-.58],[x,y-.306,-.49],.151,iron,10);
      g.pole([x,y-.300,-.492],[x,y-.312,-.477],.123,"#b7ab85",10);
    }
    for(const k of [-1,1]){
      for(let j=0;j<2;j++){
        g.box(k*4.98,1.40+j*.16,-1.30,.13,.11,.11,iron);
        g.box(k*4.98,1.40+j*.16,-1.367,.084,.074,.036,"#e7c789");
      }
    }
  }
  const gels=["#eabd86","#92bdac","#e7ac95"];
  function liveLens(g,i){
    const x=(i-1)*2.41,y=lampY(i);g.pole([x,y-.308,-.479],[x,y-.319,-.466],.114,gels[i],10);
    for(const k of [-1,1])g.pole([x+k*.11,y-.26,-.49],[x+k*.14,y-.39,-.365],.016,ink,5);
  }
  function legStand(g,x,z,height,spread){
    for(let i=0;i<3;i++){
      const a=.22+i*tau/3,q=[x+Math.cos(a)*spread,.025,z+Math.sin(a)*spread];
      g.pole([x,.22,z],q,.013,steel,4);g.box(q[0],.024,q[2],.057,.043,.062,iron,a);
    }
    g.pole([x,.07,z],[x,height,z],.0135,silver,6);
    g.cyl(x,height*.53,z,.026,.026,.049,7,iron);
  }
  function drum(g,x,z,h,r,depth,color){
    const middle=h-depth/2;
    g.cyl(x,middle,z,r,r,depth,15,color);
    for(const sign of [-1,1])g.cyl(x,middle+sign*(depth*.5-.019),z,r+.010,r+.010,.034,15,steel);
    for(let i=0;i<8;i++){
      const a=tau*(i+.25)/8,px=x+Math.cos(a)*r,pz=z+Math.sin(a)*r;
      g.box(px,middle,pz,.025,depth*.64,.030,silver,-a);
    }
    g.cyl(x,h-.005,z,r*.95,r*.95,.012,16,"#c6bfaa");g.cyl(x,h+.002,z,r*.88,r*.88,.005,16,"#d7d0b8");
  }
  function kitBody(g){
    // The drummer faces local +Z; every hardware coordinate is relative to the throne.
    legStand(g,0,0,.475,.23);
    g.cyl(0,.472,0,.214,.17,.051,13,"#544b42");g.cyl(0,.493,0,.21,.215,.014,13,"#746451");
    const kickX=.17,kickY=.37,back=.71,frontZ=1.29,r=.336;
    g.pole([kickX,kickY,back],[kickX,kickY,frontZ],r,"#9f6456",18);
    for(const z of [back,frontZ]){
      g.pole([kickX,kickY,z-.019],[kickX,kickY,z+.019],r+.016,"#6f827a",18);
      ellipse(g,front(z+(z===back?-.023:.023)),kickX,kickY,r-.016,r-.016,z===back?"#c7bca3":"#d6ccb0",19);
    }
    for(let i=0;i<10;i++){const a=tau*i/10,x=kickX+Math.cos(a)*r,h=kickY+Math.sin(a)*r;
      g.pole([x,h,back+.046],[x,h,frontZ-.046],.0125,silver,5);}
    for(const side of [-1,1])g.pole([kickX+side*.24,.26,1.13],[kickX+side*.38,.025,1.24],.025,steel,6);
    const label=(u,y)=>[kickX-u,y,frontZ+.028];
    shellMark(g,label,-.003,.448,.129,teal,"#d9cbb0");
    legend(g,label,"SOL",-.003,.267,.090,"#526a61",.60,.22,.14);
    ellipse(g,label,.17,.224,.048,.048,iron,11);
    g.box(.17,.025,.391,.120,.036,.246,iron);g.box(.17,.042,.37,.091,.010,.205,"#b0aea0");
    for(let i=0;i<4;i++)g.box(.17,.048,.32+i*.03,.069,.004,.009,steel);
    g.pole([.096,.058,.512],[.245,.058,.512],.020,silver,6);
    legStand(g,-.08,.46,.70,.188);drum(g,-.08,.46,.82,.181,.141,"#9aa79b");
    g.pole([.17,.58,.99],[.10,.735,.92],.026,silver,6);
    drum(g,.125,.96,.88,.171,.201,"#b67561");
    for(const x of [.38,.67])g.pole([x,.44,.45],[x+.014,.02,.49],.014,steel,5);
    g.pole([.51,.44,.76],[.53,.02,.79],.015,steel,5);
    drum(g,.51,.60,.644,.223,.308,"#ac705d");
    legStand(g,-.49,.46,1.045,.205);
    g.cyl(-.49,.975,.46,.167,.182,.018,17,"#ae905c");
    g.box(-.46,.039,.254,.074,.041,.194,steel);
    // A slightly bent boom keeps the ride over the lower tom.
    legStand(g,.62,.97,.98,.225);g.pole([.62,.90,.97],[.61,1.035,.83],.017,steel,6);
    g.cyl(.61,1.049,.83,.072,.236,.042,18,"#bd9c61");g.cyl(.61,1.073,.83,.024,.077,.018,12,"#d3ad68");
    g.cyl(.61,1.095,.83,.019,.021,.030,7,iron);
    // The stick bag hangs from the floor tom; the player sits on the existing throne.
    g.box(.719,.381,.634,.064,.31,.159,"#5f6254");
    for(const z of [.599,.653])g.pole([.728,.35,z],[.754,.62,z-.012],.009,"#bda682",5);
  }
  function hiHat(g){
    g.cyl(0,-.016,0,.060,.185,.023,20,"#c3a16a");
    g.cyl(0,-.002,0,.025,.065,.008,12,"#d4b77f");
    g.cyl(0,.016,0,.012,.012,.027,7,iron);
  }
  function kickBeater(g){
    g.pole([0,0,0],[0,.265,.155],.012,silver,6);
    g.pole([0,.26,.143],[0,.27,.188],.040,"#bfad96",8);
  }
  function snareSkin(g){
    ellipse(g,flat(.001),0,0,.154,.154,"#ddcfb2",18);
    ellipse(g,flat(.002),.017,.019,.090,.075,"#ccbea5",13);
    stroke(g,flat(.003),[[-.058,-.03],[-.012,.01],[.047,.045]],.005,"#b9aa94");
  }
  // The portable desk is built into a worn plywood flight case. The front lip faces +Z.
  const rackFace=z=>(u,h)=>[-u,h,z],controls=(u,v)=>[u,.968-v*.17,v];
  function consoleCase(g){
    for(const x of [-.59,.59])for(const z of [-.26,.27]){
      g.pole([x*.94,.74,z*.9],[x,.125,z],.029,iron,6);
      g.box(x,.096,z,.104,.064,.113,steel);g.pole([x-.042,.062,z],[x+.042,.062,z],.045,iron,8);
    }
    for(const x of [-.57,.57])g.pole([x,.18,-.24],[x,.70,.26],.018,steel,6);
    g.box(0,.724,0,1.46,.35,.75,"#91725d");
    g.box(0,.627,0,1.47,.045,.76,steel);g.box(0,.893,0,1.48,.045,.77,silver);
    const p=rackFace(.382);
    rect(g,p,-.36,.755,.56,.155,teal);
    legend(g,rackFace(.389),"TAPE",-.36,.723,.068,paper,.57,.23,.13);
    rect(g,p,.38,.753,.37,.122,"#bca483");
    legend(g,rackFace(.389),"A",.38,.716,.073,ink,.67,.20,.14);
    for(const x of [-.66,.66]){
      g.box(x,.757,.385,.064,.093,.035,steel);g.box(x,.756,.403,.042,.044,.018,ink);
      g.box(x,.569,-.295,.090,.088,.12,iron);
    }
    rect(g,controls,0,0,1.38,.68,"#485752");
    for(let i=0;i<5;i++){
      const x=-.59+i*.113;
      rect(g,controls,x,.048,.09,.49,i%2?"#62756a":"#597064");
      rect(g,controls,x,.127,.017,.16,"#343e3b");
      const f=.065+((i*7)%5)*.031;
      g.box(x,controls(x,f)[1]+.015,f,.057,.021,.029,i===2?"#d19073":"#cfbf98");
      for(const [z,c] of [[-.128,sage],[-.018,gold]])g.cyl(x,controls(x,z)[1]+.016,z,.022,.021,.025,8,c);
    }
    // Two needle meters and the cassette transport sit on their own dark brown panel.
    rect(g,controls,.35,0,.58,.63,"#515149");
    for(const x of [.23,.48]){
      rect(g,controls,x,-.216,.20,.089,"#d7bf93");
      stroke(g,controls,[[x-.06,-.235],[x+.040,-.193]],.009,coralShade);
    }
    rect(g,controls,.355,.042,.421,.256,"#393d38");
    for(let i=0;i<4;i++)rect(g,controls,.205+i*.092,.248,.069,.051,i===0?coral:"#b8b69a");
    g.pole([-.74,.60,-.25],[-.78,.12,-.17],.014,ink);
    stroke(g,flat(.019),[[-.77,-.17],[-.88,.20],[-1.14,.34],[-1.36,.16],[-1.32,-.14],[-1.10,-.16],[-.92,.12],[-.80,.63]],.026,ink);
  }
  function tape(g,live){
    rect(g,controls,.355,.043,.346,.210,live?"#b77762":"#bcb394");
    rect(g,controls,.355,.040,.279,.109,live?"#e1ad86":"#d6c49b");
    rect(g,controls,.355,.047,.125,.032,"#605e50");
    for(const x of [.271,.439]){
      ellipse(g,controls,x,.047,.028,.028,ink,9);
      ellipse(g,controls,x,.047,.014,.014,chalk,7);
    }
    for(const side of [-1,1])for(const end of [-1,1])
      ellipse(g,controls,.355+side*.15,.043+end*.079,.009,.009,steel,6);
    for(let i=0;i<3;i++)rect(g,controls,.272+i*.049,-.022,.031,.008,iron);
    if(live)ellipse(g,controls,.560,.246,.015,.015,"#ffc487",9);
  }
  function slider(g,x,level){
    const q=level/4;
    for(let i=0;i<level;i++)rect(g,(u,v)=>{const b=controls(u,v);b[1]+=.008;return b;},x,.161-i*.067,.038,.037,i>2?"#f1b67e":q>.6?"#d8c888":"#a3bca0");
  }
  function roadCase(g){
    g.box(0,.136,0,.56,.26,.405,"#5d7067");g.box(0,.211,0,.573,.026,.416,steel);
    g.box(0,.271,0,.568,.032,.408,"#939b85");g.box(0,.290,0,.523,.012,.367,"#728378");
    for(const x of [-.237,.237])for(const z of [-.164,.164]){
      g.box(x,.040,z,.070,.063,.067,steel);g.box(x,.252,z,.071,.068,.068,silver);
    }
    g.box(0,.146,-.212,.138,.037,.033,iron);
    legend(g,front(-.207),"SOL",.168,.104,.060,chalk,.58,.22,.14);
    rect(g,flat(.299),.144,.084,.100,.105,"#c4ab8d");rect(g,flat(.301),.144,.099,.076,.013,coralShade);
  }
  function sessionDemo(g){
    g.box(-.021,.316,-.010,.197,.035,.126,"#ba735b");
    for(const side of [-1,1])rect(g,flat(.335),-.021+side*.082,-.010,.014,.108,"#c8906d");
    const q=flat(.337);rect(g,q,-.021,-.017,.157,.075,"#e6c99c");
    rect(g,flat(.338),-.021,-.010,.064,.021,teal);
    for(const x of [-.070,.028]){
      ellipse(g,flat(.339),x,-.010,.015,.015,ink,9);ellipse(g,flat(.340),x,-.010,.006,.006,paper,7);
    }
    legend(g,flat(.340),"SALT",-.022,.008,.018,ink,.55,.23,.17);
  }
  function demo(view,at){view.draw("shell-session-demo",at.x,deckY,at.z,demoAt.yaw,0,0,.48);}
  const wood=["#bfa282","#c2a78a","#b79a7f","#c5a98c","#b99e80","#c6af91"];
  const colorRGB=h=>[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)/255);
  const stageGels=[["#e4c585",[-3.0,-.4]],["#abc9af",[-.1,.64]],["#e6b193",[2.7,-1.43]]].map(([color,at])=>[colorRGB(color),at]);
  function paintedQuad(g,points,colors){
    for(const i of [0,1,2,0,2,3])g.vertices.push(...points[i],...colors[i]);
  }
  function floorWash(g){
    // The pool of each Fresnel follows continuous wood grain across the plank seams.
    for(let i=1;i<34;i++){
      const u=-5.5+(i+.5)*11/35,base=colorRGB(wood[(i*7+Math.floor(i/3))%wood.length]);
      const sample=(x,z)=>{
        const shade=base.slice();let strength=0;
        for(const [color,q] of stageGels){
          const t=clamp(1-((x-q[0])/1.82)**2-((z-q[1])/2.10)**2)**2;
          strength+=t;
          for(let k=0;k<3;k++)shade[k]+=t*(color[k]*1.41-base[k]);
        }
        return {shade,strength};
      };
      for(let j=0;j<17;j++){
        const b=-4.02+j*.46,a=b+.46,pts=[[u-.152,.574,b],[u+.152,.574,b],[u+.152,.574,a],[u-.152,.574,a]];
        const cuts=pts.map(([x,,v])=>sample(x,v));
        if(cuts.some(c=>c.strength>.012))paintedQuad(g,pts,cuts.map(c=>c.shade));
      }
    }
  }
  function footLights(g,i){
    const x=(i-1)*2.48,p=v=>(u,h)=>[x+u,h,-3.70+v+.14*(h-.71)];
    for(let j=0;j<2;j++)ellipse(g,p(-.102-j*.002),-.050+.10*j,.684,.033,.031,gels[i],10);
  }
  function footHousings(g){
    for(const x of [-2.48,0,2.48]){
      g.box(x,.640,-3.68,.272,.113,.191,ink);
      g.box(x,.706,-3.69,.296,.025,.22,steel);
      g.box(x,.728,-3.75,.290,.024,.090,iron);
    }
  }
  const shapes={
    "shell-deck":apron,"shell-vault":vault,"shell-board":backWall,"shell-marquee":marquee,
    "shell-backline":backline,"shell-lanterns":lanterns,"shell-kit":kitBody,"shell-hat":hiHat,
    "shell-beater":kickBeater,"shell-snare":snareSkin,"shell-console":consoleCase,
    "shell-tape":g=>tape(g,false),"shell-live-tape":g=>tape(g,true),
    "shell-road-case":roadCase,"shell-session-demo":sessionDemo,"shell-night-floor":floorWash,"shell-footlights":footHousings
  };
  for(let i=0;i<3;i++)shapes["shell-lens-"+i]=g=>{liveLens(g,i);footLights(g,i);};
  for(let i=1;i<=4;i++)shapes["shell-vu-"+i]=g=>slider(g,-.019,i);
  function install(model){for(const [name,build] of Object.entries(shapes))model(name,build);}
  function ground(view,see,hours){
    if(see(deck,113)){
      const n=hours?.night||0;
      view.draw("shell-deck",deck.x,0,deck.z,deck.yaw,0,0,.10*n);
      if(n>.10)view.draw("shell-night-floor",deck.x,0,deck.z,deck.yaw,0,0,.16*n);
    }
  }
  function strength(band,index){
    const age=band?.strikes?.[index];
    return Number.isFinite(age)&&age>=0?clamp(1-age/(index===2?.19:.29)):0;
  }
  const position=(at,x,y,z)=>[at.x+Math.cos(at.yaw)*x+Math.sin(at.yaw)*z,at.y+y,at.z-Math.sin(at.yaw)*x+Math.cos(at.yaw)*z];
  function world(list,see,t,hours,band){
    if(!see(deck,137))return;
    const n=hours?.night||0,beat=band?.beat??0,energy=[0,1,2].map(i=>strength(band,i));
    for(const key of ["shell-vault","shell-board","shell-marquee","shell-backline","shell-lanterns","shell-footlights"])
      list.push([key,deck.x,0,deck.z,deck.yaw,0,0,key==="shell-marquee"?.58*n:.28*n]);
    for(let i=0;i<3;i++){
      if(n>.015||energy[i]>.05||band?.playing)
        list.push(["shell-lens-"+i,deck.x,0,deck.z,deck.yaw,0,0,.25+.40*n+.33*energy[i]]);
    }
    list.push(["shell-kit",kit.x,kit.y,kit.z,kit.yaw,0,0,.29*n],
      ["shell-road-case",demoAt.x,demoAt.y,demoAt.z,demoAt.yaw,0,0,.31*n],
      ["shell-console",mixerAt.x,mixerAt.y,mixerAt.z,0,0,0,.25*n]);
    if(!see(deck,74))return;
    const [kick,snare,hat]=energy;
    list.push(["shell-hat",...position(kit,-.49,1.015+.011*(1-hat),.46),kit.yaw,.07*hat,.035*hat,.42*n+.14*hat],
      ["shell-beater",...position(kit,.17,.058,.512),kit.yaw,-.38*(1-kick),0,.23*n],
      ["shell-snare",...position(kit,-.08,.821,.46),kit.yaw,0,0,.25*n+.14*snare],
      [band?.onAir||band?.playing?"shell-live-tape":"shell-tape",mixerAt.x,mixerAt.y+.008,mixerAt.z,0,0,0,.26*n]);
    const level=clamp(Math.round(1+.85*Math.cos(beat*Math.PI)+1.57*kick+1.14*snare+.53*hat),1,4);
    list.push(["shell-vu-"+level,mixerAt.x,mixerAt.y,mixerAt.z,0,0,0,.7]);
  }
  function cutaway(g){
    backWall(g);
    // The open section keeps musicians and drumheads visible from above. The outer three
    // bays, sprung ends and rear arch stay in their real positions.
    for(const end of [0,ribs-3]){
      for(let i=end;i<end+3;i++){
        const a=i*Math.PI/ribs,b=(i+1)*Math.PI/ribs;
        g.quad(archPoint(0,a),archPoint(4.90,a),archPoint(4.90,b),archPoint(0,b),"#bb917e");
        g.quad(archPoint(0,a,.19),archPoint(4.90,a,.19),archPoint(4.90,b,.19),archPoint(0,b,.19),"#c8a18a");
        g.quad(archPoint(0,a),archPoint(0,b),archPoint(0,b,.19),archPoint(0,a,.19),chalk);
      }
    }
    for(let i=0;i<ribs;i++){
      const a=i*Math.PI/ribs,b=(i+1)*Math.PI/ribs;
      g.quad(archPoint(4.71,a,.10),archPoint(4.90,a,.10),archPoint(4.90,b,.10),archPoint(4.71,b,.10),paper);
    }
    for(const k of [-1,1]){
      g.box(k*5.29,1.35,-1.05,.41,1.74,.46,coral);
      g.box(k*5.30,2.05,-1.04,.53,.095,.52,chalk);
    }
  }
  // Cache short orthographic prints of the real meshes. The depth buffer is temporary.
  const prints=new Map();
  function bake(name,build,yaw,density){
    if(prints.has(name))return prints.get(name);
    const mesh=new BayMesh();build(mesh);
    const verts=mesh.vertices,projection=new Float32Array(verts.length/2),cy=Math.cos(yaw),sy=Math.sin(yaw);
    let left=Infinity,right=-Infinity,top=Infinity,bottom=-Infinity;
    for(let i=0,j=0;i<verts.length;i+=6,j+=3){
      const x=cy*verts[i]+sy*verts[i+2],y=verts[i+1],z=-sy*verts[i]+cy*verts[i+2];
      const u=x+.22*y,v=-z-.27*y;projection[j]=u;projection[j+1]=v;projection[j+2]=y-.22*x-.27*z;
      left=Math.min(left,u);right=Math.max(right,u);top=Math.min(top,v);bottom=Math.max(bottom,v);
    }
    left=Math.floor(left*density-1)/density;top=Math.floor(top*density-1)/density;
    const w=Math.ceil((right-left)*density)+2,h=Math.ceil((bottom-top)*density)+2;
    const canvas=document.createElement("canvas");canvas.width=w;canvas.height=h;
    const ctx=canvas.getContext("2d"),im=ctx.createImageData(w,h),depth=new Float32Array(w*h);depth.fill(-Infinity);
    for(let i=0;i<projection.length;i+=9){
      const a=(projection[i]-left)*density,b=(projection[i+1]-top)*density;
      const dx=(projection[i+3]-projection[i])*density,dy=(projection[i+4]-projection[i+1])*density;
      const ex=(projection[i+6]-projection[i])*density,ey=(projection[i+7]-projection[i+1])*density;
      const det=dx*ey-dy*ex;if(Math.abs(det)<.00001)continue;
      const lx=Math.max(0,Math.floor(a+Math.min(0,dx,ex))),rx=Math.min(w-1,Math.ceil(a+Math.max(0,dx,ex)));
      const ty=Math.max(0,Math.floor(b+Math.min(0,dy,ey))),by=Math.min(h-1,Math.ceil(b+Math.max(0,dy,ey)));
      const red=verts[i*2+3]*255,grn=verts[i*2+4]*255,blue=verts[i*2+5]*255;
      const az=projection[i+2],bz=projection[i+5]-az,ez=projection[i+8]-az;
      for(let y=ty;y<=by;y++)for(let x=lx;x<=rx;x++){
        const ux=x+.5-a,uy=y+.5-b,t=(ux*ey-uy*ex)/det,s=(dx*uy-dy*ux)/det;
        if(t<0||s<0||s+t>1)continue;
        const idx=y*w+x,d=az+t*bz+s*ez;if(d<depth[idx]-.00001)continue;
        depth[idx]=d;const j=idx*4;im.data[j]=red;im.data[j+1]=grn;im.data[j+2]=blue;im.data[j+3]=255;
      }
    }
    ctx.putImageData(im,0,0);
    const record={canvas,left,top,w:w/density,h:h/density};prints.set(name,record);return record;
  }
  function stamp(c,name,at,px,py,s,res,build=shapes[name]){
    const record=bake(name,build,at.yaw,res);
    c.drawImage(record.canvas,px(at.x+.22*at.y)+record.left*s,py(at.z+.27*at.y)+record.top*s,record.w*s,record.h*s);
  }
  const planOrigin={...deck,y:0};
  const mapPart=(obj,x,y,z)=>{const p=position(obj,x,y,z);return {x:p[0],y:p[1],z:p[2],yaw:obj.yaw};};
  const hatAt=mapPart(kit,-.49,1.015,.46),skinAt=mapPart(kit,-.08,.821,.46),beaterAt=mapPart(kit,.17,.058,.512);
  const lensPlaces=[-2.41,0,2.41].map((u,i)=>mapPart(planOrigin,u,lampY(i)-.30,-.49));
  function nightLight(c,x,y,rx,ry,strength,tint){
    if(strength<.014)return;
    c.save();c.translate(x,y);c.scale(rx,ry);c.globalAlpha=strength;
    const grd=c.createRadialGradient(0,0,.01,0,0,1);
    grd.addColorStop(0,tint);grd.addColorStop(.5,tint.slice(0,7)+"86");grd.addColorStop(1,tint.slice(0,7)+"00");
    c.fillStyle=grd;c.fillRect(-1,-1,2,2);c.restore();
  }
  function chartIcon(ctx,x,y,unit,rotation,live){
    ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.scale(unit,unit);
    ctx.beginPath();ctx.arc(0,0,5.73,0,tau);ctx.fillStyle="#3c5553";ctx.fill();
    ctx.beginPath();ctx.arc(0,0,4.76,0,tau);ctx.fillStyle=live?"#d3a66f":"#c79680";ctx.fill();
    ctx.strokeStyle="#f0d8a6";ctx.lineWidth=.92;ctx.lineJoin="round";ctx.lineCap="round";
    for(const a of [-.86,-.48,0,.48,.86]){
      ctx.beginPath();ctx.moveTo(0,2.45);ctx.quadraticCurveTo(a*1.84,.70,a*3.35,-2.62+Math.abs(a)*1.96);ctx.stroke();
    }
    ctx.beginPath();ctx.moveTo(-2.95,-.87);ctx.quadraticCurveTo(0,-5.03,2.95,-.87);ctx.stroke();ctx.restore();
  }
  function map(c,opt,px,py,s,visible){
    const band=opt.band;
    if(opt.mode!=="street"){
      if(opt.mode==="atlas"&&(opt.countyChart||opt.marina?.bayChart))return;
      const x=px(site.board.x),y=py(site.board.z),unit=Math.min(c.canvas.width,c.canvas.height)/(opt.mode==="radar"?165:370);
      if(visible(x,y,8*unit))chartIcon(c,x,y,unit,0,band?.playing);return;
    }
    if(!visible(px(deck.x),py(deck.z),17*s))return;
    const n=opt.weather?.night||0,close=opt.player?Math.hypot(opt.player.x-deck.x,opt.player.z-deck.z):26;
    const roof=band?.playing?0:clamp((close-16)/19),beat=band?.beat||0;
    stamp(c,"shell-deck",planOrigin,px,py,s,36);
    for(let i=0;i<3;i++){
      const p=shellPoint((i-1)*2.37,-.45);
      nightLight(c,px(p.x+.13),py(p.z+.15),s*2.4,s*2.05,clamp(n*.26+strength(band,i)*.06),gels[i]);
    }
    stamp(c,"shell-plan-cut",planOrigin,px,py,s,47,cutaway);
    stamp(c,"shell-backline",planOrigin,px,py,s,70);
    stamp(c,"shell-footlights",planOrigin,px,py,s,50);
    if(roof>.025){c.save();c.globalAlpha=roof*.87;stamp(c,"shell-vault",planOrigin,px,py,s,42);c.restore();}
    c.save();c.globalAlpha=.075+.925*roof;stamp(c,"shell-marquee",planOrigin,px,py,s,70);c.restore();
    stamp(c,"shell-road-case",demoAt,px,py,s,120);
    if(opt.tapes?.some(t=>t.name==="Saltwater sessions"))stamp(c,"shell-session-demo",demoAt,px,py,s,210);
    stamp(c,"shell-kit",kit,px,py,s,120);stamp(c,"shell-hat",hatAt,px,py,s,125);
    stamp(c,"shell-snare",skinAt,px,py,s,118);stamp(c,"shell-beater",beaterAt,px,py,s,108);
    stamp(c,"shell-console",mixerAt,px,py,s,146);
    stamp(c,band?.playing||band?.onAir?"shell-live-tape":"shell-tape",{...mixerAt,y:mixerAt.y+.008},px,py,s,218);
    const level=clamp(Math.round(1.3+.73*Math.cos(beat*Math.PI)+1.6*strength(band,0)+strength(band,1)),1,4);
    stamp(c,"shell-vu-"+level,mixerAt,px,py,s,140);
    for(let i=0;i<3;i++){const p=lensPlaces[i],x=px(p.x+.22*p.y),y=py(p.z+.27*p.y);
      nightLight(c,x,y,.40*s,.33*s,clamp(.45*n+.32*strength(band,i)),gels[i]);
    }
  }
  window.BaySoundShell={site,kit,blocks,cameraBlocks,install,floor,ground,world,map,demo};
})();
