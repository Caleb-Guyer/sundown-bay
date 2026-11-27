/* Station Seven. Local +Z opens onto the street. The watch office adjoins the engine shed. */
(() => {
  "use strict";
  const lime="#d9cba6",ivory="#f0dfb3",buff="#bba887",shadow="#645e50",wood="#956f49";
  const tile="#658c80",green="#426f67",dark="#354f4d",blue="#809b95",rust="#a45e43",brass="#b99556";
  const sheet="#a49578",seam="#bdac89",iron="#505d57",ink="#314a46",paper="#e6d3aa";
  const letters={
    A:"04 10 20 34|13 23",C:"30 10 01 03 14 34",E:"30 00 04 34|02 22",
    G:"30 10 01 03 14 34 32 22",I:"00 20|10 14|04 24",N:"04 00 34 30",
    O:"10 20 31 33 24 14 03 01 10",S:"30 10 01 02 22 33 24 04",T:"00 30|10 14",
    U:"00 03 14 24 33 30",V:"00 14 24 30",W:"00 04 12 24 30","7":"00 30 14|12 32"
  };
  const strokes=Object.fromEntries(Object.entries(letters).map(([letter,rows])=>[letter,rows.split("|").map(row=>row.split(" ").map(s=>[Number(s[0])/3,1-Number(s[1])/4]))]));
  const face=(x,y,z)=>(u,v)=>[x-u,y+v,z];
  function line(g,f,x,y,X,Y,w,c){
    const d=Math.hypot(X-x,Y-y)||1,dx=(Y-y)*w/(2*d),dy=(x-X)*w/(2*d);
    g.quad(f(x+dx,y+dy),f(X+dx,Y+dy),f(X-dx,Y-dy),f(x-dx,y-dy),c);
  }
  function text(g,f,s,x,y,h,c){
    const w=h*.61,advance=w+h*.24;
    let u=x-(s.length*advance-(advance-w))*.5;
    for(const ch of s){
      for(const path of strokes[ch]||[])for(let i=1;i<path.length;i++)
        line(g,f,u+w*path[i-1][0],y+h*path[i-1][1],u+w*path[i][0],y+h*path[i][1],h*.116,c);
      u+=advance;
    }
  }
  function plate(g,f,x,y,w,h,c){
    g.quad(f(x,y),f(x+w,y),f(x+w,y+h),f(x,y+h),c);
  }
  const floor=(x,z)=>[x,.018,z];
  const crown=[[-1.98,3.33],[-1.98,3.67],[-1.45,3.67],[-1.45,3.88],[-.79,3.88],[-.79,4.23],[-.43,4.23],[-.33,4.44],[.33,4.44],[.43,4.23],[.79,4.23],[.79,3.88],[1.45,3.88],[1.45,3.67],[1.98,3.67],[1.98,3.33]];
  function scallop(g,f,u,y,size){
    const hinge=f(u,y);
    for(let i=0;i<9;i++){
      const edge=(i,bump)=>{const a=(-65+i*130/9)*Math.PI/180,r=size*(bump?1:.90);return f(u+Math.sin(a)*r,y+Math.cos(a)*r);};
      const peak=edge(i+.5,true);
      g.tri(hinge,edge(i,false),peak,i%2?buff:ivory);
      g.tri(hinge,peak,edge(i+1,false),i%2?ivory:lime);
    }
    plate(g,f,u-size*.20,y-size*.10,size*.40,size*.12,ivory);
  }
  function watchOffice(g){
    const cx=-4.27,z=1.12;
    g.box(cx,1.64,-2.06,3.76,3.28,6.36,lime);
    g.box(cx,.43,-2.052,3.785,.79,6.38,green);
    g.box(cx,.85,-2.055,3.805,.09,6.40,tile);
    g.box(cx,3.30,-2.09,3.97,.16,6.49,ivory);
    g.box(cx,3.39,-2.09,3.88,.048,6.45,rust);
    // Glazed wainscot. Unequal tile shades and the buff bullnose survive under the hatch.
    const shades=[tile,"#749488","#699084","#76998b","#63877e"];
    const tiles=face(cx,0,z+.026);
    for(let j=0;j<3;j++)for(let i=0;i<12;i++)
      plate(g,tiles,-1.872+i*.312,.09+j*.23,.302,.213,shades[(i*7+j*3)%shades.length]);
    const front=face(cx,0,z+.07),back=face(cx,0,z-.21);
    for(let i=0;i<crown.length-1;i++){
      const [u,y]=crown[i],[v,h]=crown[i+1];
      if(v>u){
        g.quad(front(u,3.32),front(v,3.32),front(v,h),front(u,y),lime);
        g.quad(back(u,3.32),back(v,3.32),back(v,h),back(u,y),buff);
      }
      g.quad(front(u,y),front(v,h),back(v,h),back(u,y),ivory);
      line(g,face(cx,0,z+.074),u,y-.044,v,h-.044,.065,rust);
    }
    const crest=face(cx,0,z+.082);
    scallop(g,crest,0,3.84,.44);
    plate(g,crest,-1.65,3.33,3.3,.32,green);
    text(g,face(cx,0,z+.092),"STATION SEVEN",0,3.395,.20,ivory);
    // The recessed sash contains a pigeonhole rack, a pending call card and a bent reading light.
    const hatchX=-3.76,windowZ=z+.044;
    g.box(hatchX,1.73,windowZ,2.28,1.53,.14,wood);
    g.box(hatchX,1.73,windowZ+.075,2.14,1.39,.025,dark);
    const hatch=face(hatchX,0,windowZ+.093);
    for(let i=0;i<4;i++){plate(g,hatch,-1.028+.52*i,2.105,.495,.22,i%2?blue:"#92a99c");}
    plate(g,hatch,-1.047,2.045,2.094,.040,wood);
    for(const x of [-.90,-.57,-.24]){plate(g,hatch,x,1.40,.28,.35,"#766f56");plate(g,hatch,x+.026,1.42,.226,.137,paper);}
    plate(g,hatch,-.942,1.373,1.05,.032,wood);plate(g,hatch,-.942,1.754,1.05,.037,wood);
    plate(g,hatch,.23,1.57,.46,.35,buff);plate(g,hatch,.265,1.59,.40,.30,paper);
    for(let k=0;k<3;k++)plate(g,hatch,.286,1.64+k*.045,.24-.042*(k%2),.009,shadow);
    g.box(hatchX,1.027,1.43,2.39,.125,.61,wood);
    g.box(hatchX,1.084,1.46,2.39,.025,.55,"#b39163");
    for(const x of [-4.64,-2.90])g.pole([x,.59,1.17],[x,.982,1.66],.035,green,5);
    g.box(-3.47,1.116,1.51,.34,.036,.23,green,.11);
    g.box(-3.47,1.14,1.51,.31,.011,.20,paper,.11);
    g.cyl(-3.77,1.177,1.61,.043,.055,.15,ink,8);
    g.pole([-3.77,1.23,1.61],[-3.70,1.44,1.60],.012,brass,5);
    // A small bronze exterior bell, anchored outside the public standing space.
    g.box(-5.60,1.93,1.21,.42,.59,.15,wood);
    g.pole([-5.60,2.16,1.26],[-5.60,2.16,1.50],.038,iron,6);
    for(const [y,rt,rb,h,col] of [[2.02,.042,.11,.21,brass],[1.875,.11,.15,.09,brass],[1.80,.15,.19,.06,"#c4a366"]])g.cyl(-5.60,y,1.49,rt,rb,h,12,col);
    g.cyl(-5.60,1.76,1.49,.037,.051,.065,8,iron);
    g.pole([-5.48,1.92,1.49],[-5.40,1.32,1.45],.011,wood,4);
    g.cyl(-5.40,1.30,1.45,.026,.036,.095,6,brass);
    // The street corner has three glazed hopper windows along the outside wall.
    for(const z0 of [-3.93,-2.20,-.48]){
      g.box(-6.17,1.97,z0,.049,1.00,1.10,buff);
      g.box(-6.206,1.985,z0,.031,.80,.95,dark);
      g.box(-6.225,2.11,z0,.014,.49,.78,blue);
      g.box(-6.235,1.97,z0,.018,.04,.91,ivory);
    }
    const pipeX=-5.75,pipeZ=-3.93;
    g.box(pipeX,3.46,pipeZ,.56,.11,.52,shadow);
    g.cyl(pipeX,3.65,pipeZ,.13,.13,.36,9,green);
    g.cyl(pipeX,3.88,pipeZ,.08,.27,.15,9,green);
  }
  const posts=[[-2.27,-4.94],[-2.25,2.57],[3.16,-4.94],[3.16,2.57]];
  function shed(g){
    // Rolled zinc, an open diagonal truss and tile footings leave the pumper's roof clear.
    for(const [x,z] of posts){
      g.box(x,.11,z,.48,.22,.48,buff);g.box(x,.48,z,.40,.55,.40,green);
      g.box(x,.79,z,.43,.065,.43,tile);g.box(x,2.35,z,.20,3.11,.20,iron);
      g.box(x,3.84,z,.27,.16,.27,green);
    }
    const x0=-2.50,x1=.46,x2=3.55,z0=-5.41,z1=3.18;
    const peak=4.67,eave=4.03;
    for(const [x,y,X,Y,color] of [[x0,eave,x1,peak,"#baac8e"],[x1,peak,x2,eave,sheet]]){
      g.quad([x,y,z0],[X,Y,z0],[X,Y,z1],[x,y,z1],color);
      g.quad([x,y-.088,z0],[X,Y-.088,z0],[X,Y-.088,z1],[x,y-.088,z1],"#796f5b");
      for(let i=0;i<=6;i++){
        const f=i/6,xx=x+(X-x)*f,yy=y+(Y-y)*f;
        g.box(xx,yy+.017,-1.115,.033,.055,8.59,seam);
      }
      for(const z of [z0,z1])g.quad([x,y,z],[X,Y,z],[X,Y-.11,z],[x,y-.11,z],green);
    }
    for(const z of [-4.94,2.57]){
      g.box(.45,3.85,z,5.65,.21,.16,green);
      for(const [x,X] of [[-2.25,-.93],[-.93,.46],[.46,1.80],[1.80,3.16]]){
        const toY=p=>peak-.13-Math.abs(p-.46)*.211;
        g.pole([x,3.94,z],[X,toY(X),z],.036,iron,5);
        g.pole([X,toY(X),z],[X,3.94,z],.031,iron,5);
      }
    }
    g.box(.53,4.085,3.172,3.74,.52,.12,green);
    g.box(.53,4.085,3.238,3.59,.414,.024,ivory);
    const inkFace=face(.53,0,3.257);
    text(g,inkFace,"ENGINE 7",0,3.967,.246,rust);
    for(const side of [-1,1])line(g,inkFace,side*.94,4.085,side*1.61,4.085,.021,green);
    // Individual drying hooks and the old timber ladder live outboard of the driving lane.
    const x=3.13;
    for(const y of [1.33,1.80])g.pole([x,y,-4.75],[x,y,-1.26],.041,wood,6);
    for(let i=0;i<9;i++)g.pole([x,1.33,-4.65+i*.40],[x,1.80,-4.65+i*.40],.029,"#b29766",5);
    for(const z of [-4.30,-1.62]){
      g.box(x,1.47,z,.16,.61,.16,iron);
      g.pole([x,1.43,z],[x-.12,1.27,z],.034,green,5);
    }
    g.pole([-2.27,3.94,-4.9],[-2.27,3.94,2.55],.044,brass,6);
  }
  function house(g){
    g.quad([-6.38,.012,-5.49],[3.63,.012,-5.49],[3.63,.012,3.63],[-6.38,.012,3.63],"#a69a84");
    g.quad([-2.04,.016,-5.40],[2.46,.016,-5.40],[2.46,.016,3.55],[-2.04,.016,3.55],"#a99f88");
    for(const z of [-2.94,.07,3.39])line(g,floor,-2.04,z,2.68,z+.04,.026,"#938d7b");
    for(const x of [-1.69,1.69])for(const z of [-4.08,-.88,2.27])line(g,floor,x,z-.42,x,z+.42,.073,"#d2be8e");
    // Cast-iron apron drain. The grated channel stops short of the pedestrian approach.
    g.box(.44,.024,3.39,5.04,.014,.155,shadow);
    for(let i=0;i<24;i++)g.box(-1.97+i*.206,.036,3.39,.045,.012,.16,"#989684");
    watchOffice(g);shed(g);
  }
  function board(g,away){
    const x=-5.49,y=1.40,z=1.235;
    g.box(x,y,z,.68,.267,.053,ivory);
    g.box(x,y,z+.04,.609,.205,.024,away?rust:green);
    text(g,face(x,0,z+.055),away?"OUT":"IN",0,y-.065,.133,paper);
    // The pull handle on the status board turns with the painted flap.
    g.pole([x-.28,y,z+.043],[x-(away?.32:.40),y+(away?.18:-.02),z+.075],.019,brass,6);
  }
  const inBoard=g=>board(g,false),outBoard=g=>board(g,true);
  // Two hooded lenses face the east entrance beside the watch office post.
  const lampX=-2.28,lampZ=2.52,amber="#ffd16c",go="#a6edaf";
  function lenses(g,state){
    g.box(lampX,2.48,lampZ-.20,.48,.94,.19,iron);
    g.box(lampX,2.48,lampZ-.308,.407,.835,.03,"#373e37");
    for(const [y,col] of [[2.69,state===1?amber:"#7c6647"],[2.29,state===2?go:"#4c6759"]]){
      g.pole([lampX,y,lampZ-.31],[lampX,y,lampZ-.36],.16,brass,10);
      const rim=i=>[lampX+.143*Math.cos(i*Math.PI/5),y+.143*Math.sin(i*Math.PI/5),lampZ-.376];
      for(let i=0;i<10;i++)g.tri([lampX,y,lampZ-.397],rim(i+1),rim(i),col,col===go||col===amber?1.26:.80);
      g.box(lampX,y+.166,lampZ-.43,.39,.04,.25,green);
    }
  }
  const lampModels=[g=>lenses(g,0),g=>lenses(g,1),g=>lenses(g,2)];
  function world(list,model,site,t,away,lamp=0){
    model("station-seven-house",house);
    const name=away?"station-seven-out":"station-seven-in";
    model(name,away?outBoard:inBoard);
    const lampId="station-seven-lamp-"+lamp;model(lampId,lampModels[lamp]);
    for(const id of ["station-seven-house",name,lampId])list.push([id,site.x,site.y??.09,site.z,site.yaw||0]);
  }
  function blocks(site){
    const yaw=site.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
    const block=(x,z,w,d,h)=>({x:site.x+c*x+s*z,z:site.z-s*x+c*z,w:Math.abs(c)*w+Math.abs(s)*d,d:Math.abs(c)*d+Math.abs(s)*w,bottom:0,top:(site.y??.09)+h,streetProp:true});
    return [block(-4.27,-2.06,3.82,6.40,3.42),block(-3.76,1.44,2.39,.61,1.12),
      block(3.13,-3,.22,3.56,1.87),...posts.map(([x,z])=>block(x,z,.48,.48,4.02))];
  }
  function paintHouse(c){
    const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    const path=(p,col,w)=>{c.beginPath();c.moveTo(...p[0]);for(let i=1;i<p.length;i++)c.lineTo(...p[i]);c.strokeStyle=col;c.lineWidth=w;c.stroke();};
    rect(-6.38,-3.63,10.01,9.12,"#ac9f87");
    rect(-2.04,-3.55,4.50,8.95,"#a29a84");
    for(const x of [-1.69,1.69])for(const y of [-2.27,.88,4.08])rect(x-.037,y-.42,.074,.84,"#ded1a1");
    rect(-2.08,-3.46,5.04,.157,shadow);for(let i=0;i<17;i++)rect(-2.01+i*.296,-3.46,.058,.157,"#a4a38c");
    // In plan the open engine shed is cut away to the eaves. An engine underneath stays visible.
    rect(-2.4,-3.13,.22,8.53,green);rect(3.08,-3.13,.26,8.53,green);
    rect(-2.39,4.96,5.75,.38,sheet);rect(-2.50,5.28,6.02,.13,seam);
    for(const [x,z] of posts){rect(x-.24,-z-.24,.48,.48,buff);rect(x-.145,-z-.15,.29,.30,green);}
    rect(2.98,1.23,.29,3.56,wood);for(let i=0;i<8;i++)rect(2.99,1.45+i*.44,.27,.048,ivory);
    rect(-6.25,-1.18,4.00,6.55,green);rect(-6.22,-1.16,3.91,6.43,ivory);
    rect(-6.08,-.99,3.60,6.07,"#a88d71");rect(-5.96,-.83,3.35,5.74,"#b39b7e");
    for(const z of [.33,-1.01,-2.36,-3.70])path([[-5.88,-z],[-2.72,-z-.03]],"#bba88a",.036);
    rect(-6.02,3.65,.54,.51,shadow);c.fillStyle=green;c.beginPath();c.arc(-5.75,3.93,.24,0,Math.PI*2);c.fill();
    rect(-6.25,-1.37,3.98,.29,rust);rect(-5.73,-1.49,2.93,.18,ivory);rect(-5.06,-1.57,1.59,.13,green);
    rect(-4.98,-1.81,2.43,.40,wood);rect(-3.66,-1.62,.32,.20,paper);
    rect(-5.79,-1.57,.39,.40,brass);
    c.save();c.translate(-4.2,1.57);c.rotate(-.027);c.strokeStyle="#d2ae85";c.lineWidth=.105;
    for(let i=0;i<=6;i++){const a=(i-3)*.285;c.beginPath();c.moveTo(0,.28);c.lineTo(.63*Math.sin(a),.28-.64*Math.cos(a));c.stroke();}
    c.restore();
    rect(-2.33,-2.90,5.70,.20,green);rect(-1.26,-3.22,3.57,.39,ivory);
    rect(lampX-.28,-lampZ+.15,.56,.80,iron);
  }
  let houseSheet=null;
  function overhead(c,px,py,scale,site,t,away,lamp=0,lowDetail=false){
    c.save();c.translate(px(site.x),py(site.z));c.rotate(site.yaw||0);c.scale(scale,scale);
    if(lowDetail&&scale<=16){
      houseSheet??=BayMapSheet(-6.6,-3.9,10.5,9.7,24,paintHouse);
      houseSheet(c);
    }else paintHouse(c);
    c.fillStyle=away?rust:green;c.fillRect(-5.85,-1.85,.72,.18);
    if(scale>3){c.fillStyle=rust;c.textAlign="center";c.textBaseline="middle";c.font="bold .27px sans-serif";c.fillText("ENGINE 7",.53,-3.015);}
    for(const [offset,col] of [[.37,lamp===1?amber:"#7c6647"],[.74,lamp===2?go:"#4c6759"]]){
      c.fillStyle=col;c.beginPath();c.arc(lampX,-lampZ+offset,.154,0,Math.PI*2);c.fill();
    }
    c.restore();
  }
  function docket(canvas,record){
    if(!canvas||!record)return false;
    if(canvas.width!==640)canvas.width=640;if(canvas.height!==350)canvas.height=350;
    const c=canvas.getContext("2d");if(!c)return false;
    const ruled="#b9aa87",red="#9e5344",teal="#3f645a";
    const say=(str,x,y,font,color=ink,align="left",maxWidth)=>{c.fillStyle=color;c.font=font;c.textAlign=align;if(maxWidth)c.fillText(str,x,y,maxWidth);else c.fillText(str,x,y);};
    const stroke=(x,y,X,Y,col,w=1)=>{c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x,y);c.lineTo(X,Y);c.stroke();};
    c.save();c.setTransform(1,0,0,1,0,0);c.clearRect(0,0,640,350);c.textBaseline="alphabetic";
    c.fillStyle="#eddfbb";c.fillRect(2,6,636,340);c.fillStyle="#d9cba6";c.fillRect(2,6,22,340);
    for(const y of [37,174,312]){
      c.beginPath();c.arc(13,y,4.8,0,Math.PI*2);c.fillStyle="#736f61";c.fill();
      c.beginPath();c.arc(13,y+1,3.5,0,Math.PI*2);c.fillStyle="#344641";c.fill();
    }
    // Two-colour woodcut of the watch house and open shed at the top of the duplicate.
    const x=47,y=77;
    c.fillStyle=teal;c.beginPath();c.moveTo(x,y);for(const [xx,yy] of [[0,-26],[9,-26],[9,-31],[16,-31],[16,-35],[20,-35],[22,-39],[29,-39],[31,-35],[36,-35],[36,-31],[42,-31],[42,-26],[48,-26],[48,0]])c.lineTo(x+xx,y+yy);c.closePath();c.fill();
    c.fillStyle="#e3cea0";c.fillRect(x+7,y-18,8,11);c.fillRect(x+21,y-21,19,14);c.fillStyle=red;c.fillRect(x+19,y-7,23,2);
    for(const [a,b,A,B,w] of [[47,-25,77,-33,3],[77,-33,108,-25,3],[49,-23,106,-23,2],[53,-22,53,0,2],[104,-22,104,0,2],[0,1,110,1,2]])stroke(x+a,y+b,x+A,y+B,teal,w);
    say("SUNDOWN BAY FIRE SERVICE",174,39,"bold 12px monospace",teal);
    say("Company daybook",173,74,"italic bold 36px Georgia, serif");
    say("ENGINE 7",609,40,"bold 18px Georgia, serif",red,"right");
    say("DAY "+String(Math.max(1,Math.floor(Number(record.day)||1))).padStart(2,"0"),608,66,"bold 14px monospace",teal,"right");
    stroke(41,95,612,95,teal,2.3);stroke(41,99,612,99,teal,.9);
    say("CALL",43,122,"bold 11px monospace",teal);
    say(String(record.title||"Engine return"),43,155,"bold 26px Georgia, serif",ink,"left",561);
    stroke(41,169,612,169,ruled);stroke(41,219,612,219,ruled);stroke(41,270,612,270,ruled);
    const total=Math.max(0,Math.round(Number(record.seconds)||0)),seconds=String(total%60).padStart(2,"0");
    const values=[["TIME ON CALL",Math.floor(total/60)+":"+seconds],["WATER",Math.max(0,Math.round(Number(record.gallons)||0))+" gal"],["RETURN RATING",Math.round(Number(record.score)||0)+"/100"]];
    for(const [i,[label,value]] of values.entries()){
      const left=43+i*191;say(label,left,187,"bold 10px monospace",teal);say(value,left,211,"bold 21px monospace",ink);
      if(i)stroke(left-10,170,left-10,218,ruled);
    }
    say("CREW",43,238,"bold 10px monospace",teal);
    say((Array.isArray(record.crew)?record.crew.join(" & "):String(record.crew||"Station Seven")),43,259,"italic 18px Georgia, serif",ink,"left",369);
    stroke(428,219,428,270,ruled);say("CALL FEE",445,238,"bold 10px monospace",teal);
    say("$"+Math.round(Number(record.fee)||0),445,259,"bold 20px monospace",ink);
    if(record.homeDriver){
      say("APPARATUS RECEIVED",44,291,"bold 10px monospace",teal);
      say(record.homeDriver+"   /   $40 driver’s fee",44,315,"italic 17px Georgia, serif",ink,"left",414);
    }else say("Watch office / Company copy",44,312,"italic 16px Georgia, serif",teal);
    c.save();c.translate(540,303);c.rotate(-.09);c.strokeStyle=red;c.lineWidth=2;c.strokeRect(-62,-16,124,32);
    say(record.homeDriver?"IN QUARTERS":"RETURNED",0,7,"bold 17px monospace",red,"center");c.restore();c.restore();return true;
  }
  window.BayEngineHouseArt=Object.freeze({world,overhead,blocks,docket});
})();
