/* The front and back of Palma's wash pad stay open to Ocean Drive. Units are metres. */
(() => {
  "use strict";
  const tau=2*Math.PI,clamp=(n,lo=0,hi=1)=>Math.max(lo,Math.min(hi,n));
  const site={x:161.6,z:-92.5,y:0,yaw:0,name:"Palma Hand Wash"};
  function at(x,z,y=0,turn=0){
    const c=Math.cos(site.yaw),s=Math.sin(site.yaw);
    return {x:site.x+x*c+z*s,y:site.y+y,z:site.z-x*s+z*c,yaw:site.yaw+turn};
  }
  Object.assign(site,{at,bay:at(0,0),publicBay:at(7.7,0),entry:at(0,-6),exit:at(0,6),
    till:{...at(-4.3,-2.12),name:site.name,kind:"hand-wash"},keeper:at(-4.5,-.70,0,Math.PI),rack:at(-2.90,1.80,0,Math.PI/2)});
  const blocks=[],cameraBlocks=[];
  function boxBlock(list,x,z,w,d,top,bottom=0){
    const p=at(x,z),c=Math.abs(Math.cos(site.yaw)),s=Math.abs(Math.sin(site.yaw));
    list.push({x:p.x,z:p.z,w:w*c+d*s,d:d*c+w*s,bottom,top,streetProp:true});
  }
  boxBlock(blocks,-5.51,3.07,1.08,3.79,2.69);
  boxBlock(blocks,-4.51,-1.43,1.62,.34,1.00);
  boxBlock(blocks,-3.69,2.98,.23,3.92,2.13);
  boxBlock(blocks,-3.58,2.09,.48,.70,1.56,.45);
  boxBlock(blocks,-6.10,1.97,.19,5.69,1.47);
  boxBlock(blocks,-5.98,-.25,.13,.15,2.94);
  boxBlock(blocks,-3.50,-.25,.13,.15,2.94);
  for(const [x,z,h] of [[-3.52,-3.72,4.12],[-3.58,4.62,4.22]])boxBlock(blocks,x,z,.15,.15,h);
  boxBlock(blocks,-5.80,-4.59,.21,.20,3.87);
  boxBlock(blocks,-3.71,-4.71,.49,.54,.84);
  boxBlock(blocks,-4.36,-4.63,.58,.38,.47);
  boxBlock(cameraBlocks,-4.81,-.12,3.38,2.88,3.27,2.70);
  boxBlock(cameraBlocks,-5.80,-4.59,1.64,.95,4.76,3.35);
  boxBlock(cameraBlocks,-.48,-1.64,5.78,3.96,4.02,3.40);
  boxBlock(cameraBlocks,-.42,2.26,5.83,3.86,4.16,3.52);
  const bottle="#376b64",green="#57897c",mint="#a1be9e",deep="#354c50",cream="#f0d9ad",sand="#d8c59e";
  const coral="#ce7960",terra="#a85d51",brass="#cba96b",silver="#aeb7a3",metal="#6c8078",rubber="#394c4c";
  const plane=y=>(x,z)=>[x,y,z],front=z=>(x,y)=>[x,y,z],side=x=>(z,y)=>[x,y,z];
  function poly(g,p,pts,col){const a=p(...pts[0]);for(let i=1;i<pts.length-1;i++)g.tri(a,p(...pts[i]),p(...pts[i+1]),col);}
  function rect(g,p,x,y,w,h,col){g.quad(p(x-w/2,y-h/2),p(x+w/2,y-h/2),p(x+w/2,y+h/2),p(x-w/2,y+h/2),col);}
  function line(g,p,a,b,w,col){
    const x=b[0]-a[0],y=b[1]-a[1],f=w/(2*(Math.hypot(x,y)||1)),u=-y*f,v=x*f;
    g.quad(p(a[0]+u,a[1]+v),p(b[0]+u,b[1]+v),p(b[0]-u,b[1]-v),p(a[0]-u,a[1]-v),col);
  }
  function stroke(g,p,pts,w,col){for(let i=1;i<pts.length;i++)line(g,p,pts[i-1],pts[i],w,col);}
  function ellipse(g,p,u,v,w,h,col,n=16){
    for(let i=0;i<n;i++){
      const a=tau*i/n,b=tau*(i+1)/n;g.tri(p(u,v),p(u+w*Math.cos(a),v+h*Math.sin(a)),p(u+w*Math.cos(b),v+h*Math.sin(b)),col);
    }
  }
  function tube(g,pts,r,col,n=5){for(let i=1;i<pts.length;i++)g.pole(pts[i-1],pts[i],r,col,n);}
  const outlines={
    A:"00 14 34 40|12 32",C:"43 34 14 03 01 10 30 41",D:"00 04 24 43 41 30 00",E:"44 04 00 40|02 32",F:"44 04 00|02 32",
    H:"04 00|02 42|40 44",I:"04 44|24 20|00 40",L:"04 00 40",M:"00 04 22 44 40",
    N:"00 04 40 44",O:"01 03 14 34 43 41 30 10 01",P:"00 04 34 43 32 02",
    R:"00 04 34 43 32 02|22 40",S:"43 34 14 03 12 32 41 30 10 01",
    U:"04 01 10 30 41 44",W:"04 10 22 30 44",Y:"04 22 44|22 20"
  };
  const glyph={};
  for(const [id,runs] of Object.entries(outlines))glyph[id]=runs.split("|").map(s=>s.split(" ").map(q=>[+q[0]/4,+q[1]/4]));
  function text(g,p,word,u,v,h,col,width=.62,space=.23,weight=.11,slant=0){
    const step=h*(width+space),left=u-(word.length*step-h*space)/2;
    for(let i=0;i<word.length;i++)for(const run of glyph[word[i]]||[]){
      const points=run.map(([x,y])=>[left+i*step+(x*width+y*slant)*h,v+y*h]);
      stroke(g,p,points,h*weight,col);
    }
  }
  function palm(g,p,u,v,k,leaves,wood){
    const q=(x,y)=>p(u+k*x,v+k*y);
    poly(g,q,[[-.25,-.96],[-.11,-.98],[-.010,-.28],[.16,.34],[.18,.51],[.09,.48],[-.08,.12]],wood);
    for(const [x,y,d] of [[-.81,.13,-.15],[-.74,.52,.06],[-.40,.79,.12],[-.06,.91,.09],[.51,.82,.08],[.83,.56,.01],[.76,.19,-.1],[.47,-.01,-.12]]){
      const a=[.13,.46],b=[(a[0]+x)/2,.5+(y-.46)*.74+.116+d];
      poly(g,q,[a,[b[0],b[1]+.036],[x,y],[(a[0]+3*x)/4,(b[1]+y)/2+.014],[b[0]-.018,b[1]-.05]],leaves);
      for(let i=1;i<5;i++){
        const t=i*.15,xx=a[0]+(x-a[0])*t,yy=a[1]+(y-a[1])*t+.10*Math.sin(t*Math.PI);
        poly(g,q,[[xx,yy],[xx+(x-a[0])*.13,yy+.046],[xx+(x-a[0])*.20,yy-.095+.055*t]],leaves);
      }
    }
  }
  function floor(g){
    const base=plane(.082),p=plane(.088);
    poly(g,base,[[-6.36,-5.52],[-5.93,-5.80],[3.79,-5.72],[4.02,-5.45],[4.02,5.02],
      [3.69,5.37],[-6.08,5.35],[-6.33,5.03]],"#aeaa97");
    rect(g,p,-.07,0,6.98,10.68,"#9da396");
    for(const [x,w,z,d,col] of [[0,5.09,.09,9.80,"#9ca89c"],[-.66,2.9,-.35,7.65,"#9aa79b"],
      [2.94,.13,.3,9.6,"#b8b8a1"],[-2.94,.13,.26,9.66,"#bebaa3"]])rect(g,plane(.091),x,z,w,d,col);
    for(const z of [-4.67,-2.74,2.60,4.58])line(g,plane(.093),[-3.47,z],[3.38,z+.018],.024,"#859389");
    for(const sign of [-1,1])for(const z of [-3.04,3.04]){
      const x=sign*1.78,paint="#e6c38b";
      stroke(g,plane(.103),[[x-sign*.43,z],[x,z],[x,z-Math.sign(z)*.73]],.093,paint);
      rect(g,plane(.105),x,z-Math.sign(z)*.37,.10,.052,"#a6a891");
    }
    const tracks=[[-.86,-4.78,-.12],[-.71,1.87,.09],[.78,-2.59,.17],[.92,3.96,-.08]];
    for(const [x,z,turn] of tracks){
      stroke(g,plane(.098),[[x,z-.86],[x+.04,z-.25],[x+turn,z+.58]],.064,"#8f9c91");
      stroke(g,plane(.100),[[x+.103,z-.79],[x+.136,z-.27],[x+.101+turn,z+.42]],.024,"#889a91");
    }
    for(const [x,z,rx,rz] of [[-1.25,.82,1.0,.21],[.56,.55,.85,.09],[2.09,-.73,.43,.17],[-2.59,2.3,.32,.19],
      [-1.99,-2.4,.25,.073],[.42,3.21,.87,.15],[2.16,3.02,.26,.24],[-2.25,-.86,.28,.09]]){
      const pts=[];for(let i=0;i<10;i++){const a=i*tau/10,r=.88+.12*Math.sin(7.46*i+x);pts.push([x+Math.cos(a)*rx*r,z+Math.sin(a)*rz*r]);}
      poly(g,plane(.101),pts,"#8daba1");stroke(g,plane(.103),pts.slice(2,5),.017,"#b9c5aa");
    }
    for(const [x,z] of [[0,-1.31],[0,2.54]]){
      rect(g,plane(.104),x,z,4.08,.283,"#bcbba3");rect(g,plane(.106),x,z,3.98,.215,"#536965");
      for(let i=0;i<25;i++)line(g,plane(.109),[-1.925+i*.158,z-.091],[-1.87+i*.158,z+.092],.033,"#a2aaa0");
    }
    const edge=plane(.108);stroke(g,edge,[[-6.00,-3.13],[-4.32,-3.14],[-4.05,-3.29],[-3.80,-3.26]],.04,"#959484");
    stroke(g,edge,[[2.90,.43],[3.22,.45],[3.48,.27],[3.83,.29]],.025,"#889286");
    for(const [x,z] of [[-5.98,-.25],[-3.5,-.25],[-5.80,-4.59]])rect(g,plane(.10),x,z,.37,.36,"#949888");
  }
  function tiles(g){
    const x=-6.10,z0=1.32;
    g.box(x,.76,z0+.65,.18,1.38,5.69,"#9da99c");
    const brush=(z,y)=>[x-.097,y,z+z0],tints=["#a4beb2","#a0bcb0","#aac2b3","#9db9ae","#a6c1b2"];
    for(let j=0;j<5;j++)for(let i=0;i<18;i++){
      const z=-2.15+(i+.5)*.311,y=.128+(j+.5)*.229;
      rect(g,brush,z,y,.301,.215,j===3?(i%4===2?"#6b9b89":"#709c8b"):tints[(3*i+j)%5]);
    }
    g.box(x,1.458,.65+z0,.24,.078,5.77,"#dad3b4");
    g.box(x,.365,.65+z0,.206,.160,5.71,green);
    g.box(x,1.22,.65+z0,.208,.087,5.73,"#cc9a79");
    for(const z of [-2.17,3.48])g.box(x,.767,z+z0,.28,1.44,.18,"#92aa98");
  }
  function ticket(g){
    // Open counter. Elia can stand behind the drawer and leave on either side.
    g.box(-4.51,.51,-1.43,1.58,.80,.31,green);
    g.box(-4.51,.94,-1.43,1.72,.09,.46,"#d6c8ab");g.box(-4.51,.995,-1.43,1.78,.04,.49,"#a99a82");
    g.box(-4.51,.24,-1.596,1.42,.11,.024,bottle);
    const counter=front(-1.608);rect(g,counter,-4.51,.631,1.26,.38,cream);
    text(g,front(-1.61),"PALMA",-4.51,.533,.19,bottle,.66,.24,.11,.1);
    g.box(-4.89,1.08,-1.39,.32,.13,.21,"#496362");
    g.box(-4.89,1.17,-1.345,.23,.086,.083,"#9ba89a");
    for(let i=0;i<3;i++)rect(g,front(-1.499),-4.98+i*.079,1.073,.042,.034,cream);
    g.box(-4.22,1.025,-1.45,.32,.022,.24,"#c8946e",-.11);
    g.box(-4.22,1.039,-1.45,.289,.01,.202,cream,-.11);
    for(let i=0;i<4;i++)rect(g,plane(1.046),-4.22,-1.506+i*.034,.19,.006,"#889387");
    g.pole([-4.12,1.051,-1.52],[-4.30,1.053,-1.38],.007,bottle,4);
    for(const x of [-5.98,-3.50]){
      g.box(x,1.48,-.25,.114,2.81,.12,"#87998b");
      g.box(x,2.81,-.32,.15,.18,2.5,bottle);
    }
  }
  function awning(g){
    for(const z of [-1.43,.97])g.box(-4.74,2.83,z,3.23,.10,.093,"#899e8c");
    // Pieced cotton duck, faded on the outer four stripes. Each valance has a rolled hem.
    for(let i=0;i<13;i++){
      const x=-6.33+i*.247,c=i%2?"#dbb593":i%4?"#608e82":"#699689";
      g.quad([x,2.91,-1.62],[x+.25,2.91,-1.62],[x+.25,3.23,1.08],[x,3.23,1.08],c);
      g.quad([x,2.91,-1.62],[x+.249,2.91,-1.62],[x+.245,2.74,-1.625],[x+.006,2.735,-1.625],c,.93);
      line(g,front(-1.628),[x+.025,2.768],[x+.224,2.768],.011,"#dfc69f");
    }
    g.pole([-6.34,2.91,-1.624],[-3.11,2.91,-1.624],.032,cream,6);
    g.pole([-6.34,3.23,1.08],[-3.10,3.23,1.08],.034,metal,6);
    for(const x of [-6.23,-3.24])g.pole([x,2.84,-.58],[x,2.99,.63],.024,metal,5);
  }
  function rack(g){
    g.box(-5.51,1.38,3.07,1.09,2.60,3.79,"#b8b6a0");
    g.box(-5.51,2.72,3.07,1.26,.14,3.98,green);
    for(let i=0;i<10;i++)g.box(-5.50,2.808,1.24+i*.401,1.25,.031,.040,"#97ac98");
    const face=side(-4.958);
    rect(g,face,3.12,1.37,3.63,2.36,"#c6c6ac");
    for(let j=0;j<8;j++)for(let i=0;i<5;i++){
      const begin=1.305+i*.73-(j%2)*.365,lo=Math.max(1.20,begin),hi=Math.min(4.95,begin+.71);
      if(hi>lo)rect(g,side(-4.955),(lo+hi)/2,.18+j*.271+.132,hi-lo,.254,["#bec1aa","#bfbea6","#c4c4ac"][(i+2*j)%3]);
    }
    rect(g,side(-4.951),3.07,.54,3.76,.26,green);rect(g,side(-4.948),3.07,.79,3.76,.069,coral);
    rect(g,side(-4.945),4.43,1.22,.81,1.99,metal);rect(g,side(-4.942),4.43,1.22,.72,1.91,"#8eab9c");
    for(let i=0;i<7;i++)rect(g,side(-4.938),4.45,1.48+i*.072,.49,.044,"#6c8d81");
    g.box(-4.922,1.09,4.70,.04,.13,.037,brass);
    g.box(-3.69,1.085,2.98,.19,2.09,3.91,"#b3b49e");
    g.box(-3.69,2.15,2.98,.25,.094,4.02,bottle);
    g.box(-3.69,.51,2.98,.207,.26,3.91,"#769f8d");g.box(-3.69,.73,2.98,.213,.067,3.91,coral);
    const east=side(-3.583);rect(g,east,3.62,1.50,1.54,.66,cream);
    text(g,side(-3.581),"RINSE",3.62,1.44,.197,bottle,.60,.22,.12);
    stroke(g,side(-3.579),[[3.05,1.35],[4.14,1.35]],.022,coral);
    // Domestic-looking plumbing in the service wall, with an enamel gauge and two wheel handles.
    for(const [z,c,h] of [[3.55,"#a88665",1.21],[3.90,metal,1.08]]){
      tube(g,[[-3.533,.14,z],[-3.533,h,z],[-3.489,h+.04,z+.04],[-3.485,h+.04,z+.27]],.037,c,6);
      for(const y of [.38,.82])g.box(-3.54,y,z,.115,.048,.076,brass);
      g.pole([-3.54,.90,z],[-3.42,.90,z],.024,c,6);
      for(let i=0;i<8;i++){const a=i*tau/8,b=(i+1)*tau/8;
        g.pole([-3.414,.9+.072*Math.sin(a),z+.072*Math.cos(a)],[-3.414,.9+.072*Math.sin(b),z+.072*Math.cos(b)],.013,c===metal?bottle:terra,4);}
    }
    const gauge=side(-3.431);
    ellipse(g,side(-3.442),3.52,1.25,.118,.118,metal);ellipse(g,gauge,3.52,1.25,.093,.093,cream);
    line(g,side(-3.428),[3.52,1.25],[3.57,1.30],.011,terra);
    for(let i=0;i<5;i++){const a=(i*.22+.065)*Math.PI;line(g,gauge,[3.52+.065*Math.cos(a),1.25+.065*Math.sin(a)],[3.52+.081*Math.cos(a),1.25+.081*Math.sin(a)],.007,deep);}
    // The heavy hose nests between the iron cheeks, behind the dispensing handle.
    for(const x of [-3.57,-3.376])ellipse(g,side(x),2.08,1.242,.308,.307,metal,16);
    for(let i=0;i<5;i++){
      const x=-3.544+i*.032;
      for(let j=0;j<14;j++){const a=j*tau/14,b=(j+1)*tau/14;
        g.pole([x,1.242+.26*Math.sin(a),2.08+.26*Math.cos(a)],[x+.003,1.242+.26*Math.sin(b),2.08+.26*Math.cos(b)],.023,["#415c58","#46605a"][i%2],5);}
    }
    const covers=side(-3.371);ellipse(g,covers,2.08,1.242,.32,.32,"#8da395");
    for(let i=0;i<4;i++){const a=i*tau/4+.35;ellipse(g,side(-3.367),2.08+.19*Math.cos(a),1.242+.19*Math.sin(a),.057,.056,green,10);}
    ellipse(g,side(-3.366),2.08,1.242,.066,.066,brass,10);
    tube(g,[[-3.43,1.00,2.24],[-3.41,.73,2.23],[-3.42,.48,2.13],[-3.45,.407,1.98],[-3.47,.49,1.88],[-3.47,.89,1.83]],.021,rubber,5);
    g.box(-3.44,1.22,1.55,.17,.065,.13,brass);
  }
  function floorLevel(x,z){
    const dx=x-site.x,dz=z-site.z,c=Math.cos(site.yaw),s=Math.sin(site.yaw);
    const u=dx*c-dz*s,v=dx*s+dz*c;
    if(u< -6.32||u>11.38||v< -5.72||v>5.35)return null;
    if(u<=4.65)return .116;
    const edge=Math.min(11.38-u,5.35-v,v+5.72);
    return .007+.109*clamp(edge/.43);
  }
  function publicFloor(g){
    const left=3.59,right=10.94,frontZ=-5.29,back=4.92,top=.084;
    rect(g,plane(top),(left+right)/2,(frontZ+back)/2,right-left,back-frontZ,"#a6ab98");
    const corners=[[left,frontZ],[right,frontZ],[right,back],[left,back]];
    const outside=[[left,-5.72],[11.38,-5.72],[11.38,5.35],[left,5.35]];
    for(let i=0;i<3;i++){const j=(i+1)%4,a=corners[i],b=corners[j],d=outside[i],e=outside[j];
      g.quad([a[0],top,a[1]],[b[0],top,b[1]],[e[0],.009,e[1]],[d[0],.009,d[1]],i===1?"#a3a797":"#a9ad99");}
    const p=plane(.090),c=7.7;
    rect(g,p,4.92,-.22,2.03,9.45,"#acaf9c");
    rect(g,p,c,-.21,4.09,9.36,"#9ba99b");
    for(const z of [-4.5,-2.7,2.57,4.54])line(g,plane(.096),[3.96,z],[10.9,z+.03],.029,"#8c9b8d");
    for(const k of [-1,1]){
      for(const z of [-3.19,3.07]){
        const x=c+k*1.73,sign=Math.sign(z);
        stroke(g,plane(.102),[[x-k*.52,z],[x,z],[x,z-sign*.83]],.082,"#e0d1a9");
        for(const d of [.27,.54])rect(g,plane(.104),x,z-d*sign,.094,.05,"#a5af99");
      }
      stroke(g,plane(.099),[[c+k*.78,-3.69],[c+k*.79,-1.84],[c+k*.82,-1.29]],.057,"#8b9d91");
    }
    rect(g,plane(.100),c+1.18,.32,.28,3.42,"#b8bda4");
    rect(g,plane(.102),c+1.18,.32,.207,3.37,"#526c66");
    for(let i=0;i<22;i++)line(g,plane(.105),[c+1.085,-1.31+i*.152],[c+1.27,-1.26+i*.152],.031,"#9eafa1");
    for(const [x,z,rx,rz] of [[6.54,-.76,.57,.23],[7.32,-.81,.53,.15],[8.38,1.15,.44,.11],[9.07,-1.1,.14,.34],[5.3,2.19,.13,.34]]){
      ellipse(g,plane(.098),x,z,rx,rz,"#91ab9c",11);
      line(g,plane(.099),[x-rx*.55,z+rz*.65],[x+rx*.22,z+rz*.59],.019,"#bec4a7");
    }
    const paint=(x,z)=>[c+x,.105,-4.17+z];
    text(g,paint,"RINSE",0,-.21,.37,"#d6ca9f",.65,.24,.11,.04);
  }
  function pylon(g){
    const cx=-5.80,cz=-4.59,angle=.97,cs=Math.cos(angle),sn=Math.sin(angle);
    const p=(k,d)=>(u,y)=>[cx+k*u*cs+d*sn,y,cz-k*u*sn+d*cs];
    g.box(cx,.192,cz,.43,.23,.42,"#a29d88",angle);
    g.box(cx,1.90,cz,.146,3.48,.135,green,angle);
    g.box(cx+.075*cs,1.91,cz-.075*sn,.026,3.38,.141,cream,angle);
    for(const k of [-1,1]){
      const field=p(k,-k*.071),rim=p(k,-k*.080),copy=p(k,-k*.086);
      const board=[[-1.57,3.91],[-1.40,4.47],[-.86,4.64],[1.41,4.62],[1.57,4.47],[1.49,3.92],
        [1.28,3.74],[-.97,3.72],[-1.31,3.75]];
      poly(g,field,board,deep);
      poly(g,rim,board.map(([x,y])=>[x*.974,4.18+(y-4.18)*.90]),cream);
      poly(g,copy,board.map(([x,y])=>[x*.942,4.18+(y-4.18)*.81]),bottle);
      const print=p(k,-k*.091);
      ellipse(g,print,-.93,4.16,.41,.34,"#d6a76c",16);
      palm(g,p(k,-k*.096),-.96,4.15,.365,cream,bottle);
      text(g,print,"PALMA",.38,3.96,.444,cream,.64,.205,.118,.095);
      rect(g,p(k,-k*.094),.46,3.878,1.31,.024,"#a2baa3");
      const tab=p(k,-k*.079);
      poly(g,tab,[[-1.15,3.69],[1.33,3.69],[1.19,3.26],[-1.27,3.26]],terra);
      poly(g,p(k,-k*.084),[[-1.11,3.65],[1.26,3.65],[1.16,3.30],[-1.21,3.30]],coral);
      text(g,p(k,-k*.09),"HAND WASH",.01,3.388,.208,"#f4e1b6",.67,.27,.114);
      for(const [u,y] of [[-1.32,3.93],[1.38,4.4],[-1.05,3.46],[1.10,3.46]])ellipse(g,p(k,-k*.099),u,y,.012,.012,silver,6);
    }
    for(const [x,y] of [[-.98,4.47],[.98,4.44]])g.pole([cx,2.96,cz],[cx+x*cs,y,cz-x*sn],.034,metal,5);
    g.box(cx,2.91,cz,.161,.412,2.09,metal);
    for(const k of [-1,1]){
      const sign=(u,y)=>[cx+k*.084,y,cz+k*u],ink=(u,y)=>[cx+k*.088,y,cz+k*u];
      rect(g,sign,0,2.91,2.065,.373,cream);
      text(g,ink,"RINSE",.12,2.814,.182,bottle,.62,.22,.12);
      poly(g,ink,[[-.66,3.041],[-.53,2.88],[-.55,2.816],[-.61,2.784],[-.694,2.798],[-.735,2.86],[-.726,2.928]],bottle);
    }
  }
  const poles=[[-3.52,4.07,-3.72],[-3.58,4.19,4.62]];
  const arms=[[2.44,3.68,-3.69],[2.70,4.00,4.61]];
  function skeleton(g){
    // Both cantilevers spring from the service side. No post separates the public rinse lane from Elia.
    poles.forEach(([x,h,z],i)=>{
      const a=arms[i];
      g.box(x,.179,z,.33,.19,.35,"#a59d85");
      g.cyl(x,h/2+.05,z,.067,.083,h-.08,7,green);
      g.cyl(x,.62,z,.085,.087,.86,8,bottle);g.cyl(x,1.03,z,.09,.09,.071,8,coral);
      g.pole([x,h-.06,z],a,.062,metal,7);
      g.pole([x,2.59,z],[x+1.53,h-.16,z],.038,green,6);
      g.pole([x+1.43,h-.16,z],[x+2.29,h-.50,z],.029,metal,6);
      g.pole([x+2.29,h-.50,z],[a[0]-.66,a[1]+.01,a[2]],.030,metal,6);
      g.cyl(x,h+.026,z,.09,.074,.078,7,brass);
      for(const k of [-1,1])g.box(x+k*.11,.287,z+.087,.036,.044,.034,metal);
    });
    tube(g,[[2.43,3.70,-3.67],[2.50,3.70,-1.4],[2.57,3.76,1.2],[2.68,4.0,4.59]],.014,rubber,4);
    tube(g,[[-3.51,3.99,-3.70],[-3.57,3.78,-1.02],[-3.61,3.70,1.51],[-3.57,4.13,4.62]],.023,rubber,5);
    g.box(-3.69,2.815,2.26,.119,1.47,.131,green);
    g.box(-3.66,3.58,2.26,.22,.14,.20,bottle);
    g.pole([-3.69,3.60,2.26],[-3.53,3.60,2.26],.049,brass,7);
    g.cyl(-3.53,3.69,2.26,.070,.068,.154,8,metal);
    g.cyl(-3.53,3.78,2.26,.064,.075,.053,8,brass);
    for(const h of [2.35,2.89,3.42])g.box(-3.62,h,2.32,.065,.040,.069,brass);
    tube(g,[[-3.58,1.33,2.30],[-3.60,1.55,2.34],[-3.59,3.46,2.34],[-3.53,3.52,2.31],[-3.53,3.60,2.27]],.018,rubber,5);
    // The enamel industrial fan hangs from the far cantilever, looking toward the wash pad.
    g.pole([-.62,4.12,4.61],[-.62,3.62,4.60],.041,metal,6);
    g.box(-.62,3.49,4.62,.18,.22,.28,bottle);
    for(const z of [4.46,4.67]){
      for(let i=0;i<15;i++){const a=tau*i/15,b=tau*(i+1)/15;
        g.pole([-.62+.313*Math.cos(a),3.45+.313*Math.sin(a),z],[-.62+.313*Math.cos(b),3.45+.313*Math.sin(b),z],.014,metal,5);}
    }
    for(let i=0;i<8;i++){
      const a=tau*i/8,x=-.62+.306*Math.cos(a),h=3.45+.306*Math.sin(a);
      g.pole([x,h,4.46],[x,h,4.67],.010,silver,4);
      g.pole([x,h,4.454],[-.62,3.45,4.40],.008,metal,4);
    }
    // Tube fixtures sit inside long folded-aluminium hoods.
    for(const [x,y,z] of [[-.51,3.73,-3.70],[.38,3.93,4.58],[-4.74,2.91,.33]]){
      g.box(x,y,z,1.27,.107,.22,metal);
      for(const k of [-1,1])g.box(x+k*.615,y-.064,z,.039,.124,.216,green);
    }
    const sign=front(-1.637);rect(g,sign,-4.38,2.54,1.75,.33,bottle);
    text(g,front(-1.64),"OFFICE",-4.38,2.451,.173,cream,.62,.23,.10);
  }
  function blades(g){
    for(let i=0;i<4;i++){
      const a=i*tau/4,cs=Math.cos(a),sn=Math.sin(a),q=(u,h,d)=>[u*cs-h*sn,u*sn+h*cs,d];
      g.quad(q(.048,-.026,0),q(.25,-.082,.032),q(.264,.016,-.016),q(.091,.066,-.032),"#a4b3a1");
    }
    ellipse(g,front(-.038),0,0,.052,.052,bottle,10);
  }
  function sail(g){
    function triangle(a,b,c,tone,tint,edge){
      const q=(u,v)=>{
        const w=1-u-v,sag=.55*(u*v+v*w+w*u);
        return [a[0]*w+b[0]*u+c[0]*v,a[1]*w+b[1]*u+c[1]*v-sag,a[2]*w+b[2]*u+c[2]*v];
      };
      const steps=6;
      for(let row=0;row<steps;row++)for(let i=0;i<steps-row;i++){
        const u=i/steps,v=row/steps,du=1/steps;
        g.tri(q(u,v),q(u+du,v),q(u,v+du),(i+2*row)%5?tone:tint);
        if(i+row<steps-1)g.tri(q(u+du,v),q(u+du,v+du),q(u,v+du),(i+2*row)%6?tone:tint);
      }
      for(const [p,h] of [[a,b],[b,c],[c,a]])g.pole(p,h,.019,edge,4);
      // Hems and reinforced corners show where each panel has been sewn to the old booms.
      for(const [u,v,x,y] of [[0,0,.063,.063],[1,0,-.10,.043],[0,1,.045,-.1]]){
        const p=q(u,v),r=q(u+x,v+y);
        g.pole(p,r,.041,edge,5);
      }
      for(const f of [.30,.62]){const a=q(f,.012),b=q(f,.98-f);g.pole(a,b,.009,edge,4);}
    }
    triangle([-3.42,3.93,-3.54],[2.32,3.57,-3.43],[-3.41,3.96,4.35],"#bdd0ad","#bfceaa","#95aa90");
    triangle([2.51,3.83,4.41],[-3.18,3.99,4.39],[2.36,3.60,-3.17],"#d9b29a","#dab79e","#bd9b86");
  }
  function lamps(g){
    for(const [x,y,z] of [[-.51,3.66,-3.70],[.38,3.86,4.58],[-4.74,2.84,.33]]){
      for(const d of [-.053,.053])g.pole([x-.55,y,z+d],[x+.55,y,z+d],.024,"#f8dfad",6);
    }
    ellipse(g,front(-1.643),-3.73,2.541,.052,.052,"#f6d79c",10);
  }
  function notice(g){
    // Attendant annunciator, visible from the rinse lane and the street.
    g.box(-3.55,2.15,-.23,.17,.96,.92,green);
    const plate=(z,y)=>[-3.451,y,z-.23];
    rect(g,plate,0,2.13,.81,.79,cream);text(g,(z,y)=>[-3.443,y,z-.23],"RINSE",.0,2.19,.132,bottle,.63,.19,.135);
    text(g,(z,y)=>[-3.442,y,z-.23],"HERE",.0,1.952,.14,terra,.65,.19,.125);
    for(const v of [-.35,.35])for(const h of [1.815,2.473])ellipse(g,plate,v,h,.011,.011,metal,6);
    g.box(-3.55,2.674,-.23,.21,.123,.28,deep);
  }
  function waitingChair(g){
    const x=-3.71,z=-4.71;
    for(const dx of [-.24,.24]){
      tube(g,[[x+dx,.109,z+.21],[x+dx,.47,z-.16],[x+dx,.89,z+.005]],.019,silver,5);
      g.pole([x+dx,.104,z-.29],[x+dx,.477,z+.245],.020,metal,5);
      g.cyl(x+dx,.119,z+.195,.027,.028,.05,6,rubber);
    }
    for(let i=0;i<5;i++){
      const u=x-.201+i*.1;
      g.quad([u-.034,.46,z+.23],[u+.034,.46,z+.23],[u+.034,.46,z-.163],[u-.034,.46,z-.163],i%2?cream:green);
      g.quad([u-.034,.47,z-.164],[u+.034,.47,z-.164],[u+.034,.84,z-.014],[u-.034,.84,z-.014],i%2?green:cream);
    }
    for(const y of [.59,.72,.83])g.box(x,y,z-.125+(y-.59)*.42,.462,.041,.015,green);
    g.box(-4.36,.265,-4.63,.57,.31,.36,"#b7735e");g.box(-4.36,.435,-4.63,.59,.071,.38,cream);
    for(const k of [-1,1])g.pole([-4.36+k*.235,.31,-4.84],[-4.36+k*.235,.409,-4.84],.013,silver,5);
  }
  function signal(g,lit){
    g.cyl(0,.104,0,.083,.108,.18,8,lit?"#ffc36d":"#ab8260");
    g.cyl(0,.208,0,.058,.084,.043,8,lit?"#ffe3a1":"#bf9a76");
  }
  function lance(g){
    // Origin at the trigger palm, +Z along the jet. The second hand holds the fluted foregrip.
    tube(g,[[0,-.064,-.034],[0,.029,.006],[0,.066,.046],[0,.064,.146]],.037,rubber,7);
    tube(g,[[0,-.051,-.023],[0,-.055,.053],[0,.037,.10]],.012,deep,5);
    g.box(0,.055,.103,.067,.069,.145,"#5b7970");
    for(const z of [.114,.15])g.box(0,.061,z,.081,.079,.009,brass);
    g.pole([0,.063,.17],[0,.064,.327],.032,bottle,8);
    for(let i=0;i<5;i++)g.pole([0,.064,.184+i*.024],[0,.064,.193+i*.024],.036,rubber,6);
    g.pole([0,.064,.327],[0,.064,.736],.016,silver,7);
    g.pole([0,.064,.698],[0,.064,.741],.023,brass,6);
    g.pole([0,.064,.741],[0,.064,.782],.028,"#bd7b50",6);
    g.pole([0,-.077,-.033],[0,-.130,-.069],.020,brass,6);
  }
  function parkedBoom(g){
    g.pole([-3.53,3.76,2.26],[-3.40,3.64,-.46],.040,metal,6);
    g.pole([-3.52,3.75,2.02],[-3.49,3.71,1.22],.048,bottle,6);
    const dock=mount({origin:[-3.394,1.35,1.51],yaw:.40,pitch:-1.07},0,-.130,-.069);
    tube(g,[[-3.40,3.64,-.46],[-3.37,3.39,-.43],[-3.34,2.91,-.19],[-3.32,2.35,.16],[-3.30,1.88,.56],
      [-3.32,1.49,.97],[-3.35,1.25,1.29],dock],.018,rubber,5);
  }
  const models={
    "palma-floor":g=>{
      floor(g);publicFloor(g);
      // The old promenade slats stand at .104. A thin bonded slab covers them without a step at the sand edge.
      for(let i=1;i<g.vertices.length;i+=6)if(g.vertices[i]>.02)g.vertices[i]+=.034;
    },"palma-office":g=>{tiles(g);rack(g);ticket(g);notice(g);waitingChair(g);},"palma-awning":awning,
    "palma-pylon":pylon,"palma-frames":skeleton,"palma-sails":sail,"palma-lamps":lamps,"palma-fan":blades,
    "palma-lance":lance,"palma-boom-rest":parkedBoom,"palma-bell-lit":g=>signal(g,true),"palma-bell":g=>signal(g,false)
  };
  function install(model){for(const [key,build] of Object.entries(models))model(key,build);}
  const ownerColors=["#ae7859","#ce826a","#486864"];
  const hair="#473b36",visor="#e7c795",edge="#7d6653",apron="#447a6d",thread="#b8bea1";
  function uniform(g,part){
    part("body");const bib=front(.128);
    poly(g,bib,[[-.118,1.328],[.105,1.328],[.151,1.07],[.141,.882],[-.143,.882],[-.154,1.055]],apron);
    for(const k of [-1,1]){
      stroke(g,front(.131),[[k*.086,1.307],[k*.130,1.407],[k*.116,1.442]],.038,bottle);
      g.box(k*.105,1.321,.132,.044,.020,.008,brass);
      stroke(g,front(-.113),[[k*.119,1.414],[k*.094,1.340],[-k*.134,1.073]],.040,apron);
      stroke(g,front(.133),[[k*.12,1.242],[k*.131,1.053],[k*.127,.917]],.006,thread);
    }
    const pocket=front(.135);rect(g,pocket,0,1.11,.173,.107,"#528474");
    stroke(g,front(.136),[[-.084,1.147],[-.080,1.074],[.0,1.056],[.083,1.079],[.082,1.147]],.006,thread);
    palm(g,front(.139),-.037,1.257,.042,cream,"#c4c4a0");
    rect(g,front(.136),.055,1.288,.063,.022,"#e7cfaa");
    for(const k of [-1,1])g.box(k*.125,1.005,-.094,.064,.043,.071,apron,k*.45);
    // A terry towel hangs from the side tie, with two apricot welts.
    g.box(-.145,.904,.045,.054,.190,.118,cream,-.16);
    for(const y of [.847,.862])g.box(-.176,y,.046,.006,.009,.112,terra,-.16);
    part("head");
    g.cyl(0,1.711,-.009,.108,.116,.054,10,visor);
    g.cyl(0,1.738,-.010,.105,.109,.014,10,"#8eac93");
    const bill=[[-.108,.031],[-.115,.086],[-.087,.165],[-.042,.195],[.063,.189],[.109,.15],[.117,.067],[.104,.030]];
    poly(g,(x,z)=>[x,1.704-.092*z,z],bill,visor);
    stroke(g,(x,z)=>[x,1.705-.092*z,z],bill.slice(1,7),.008,brass);
    for(const k of [-1,1]){
      g.cyl(k*.086,1.627,-.043,.035,.029,.097,7,hair);
      ellipse(g,front(.021),k*.101,1.573,.013,.018,brass,7);
    }
    g.cyl(.005,1.697,-.111,.069,.052,.094,9,hair);
    g.cyl(.009,1.673,-.149,.043,.039,.053,7,edge);
    for(const x of [-.032,0,.026])g.pole([x,1.727,-.091],[x+.017,1.671,-.164],.008,edge,4);
    const smile=front(.103);
    stroke(g,smile,[[-.036,1.566],[-.018,1.555],[.004,1.553],[.025,1.558],[.036,1.566]],.007,"#754c3f");
    stroke(g,front(.105),[[-.019,1.561],[.006,1.558],[.028,1.564]],.005,"#e2b38e");
    // Elia's sea-green rubber cuffs and the seams of her cut-down work boots.
    for(const k of [-1,1]){
      part("arm",k);g.cyl(k*.244,1.265,.000,.077,.069,.020,8,"#e2b78d");
      g.cyl(k*.240,1.061,.028,.044,.041,.031,7,"#648e79");
      part("leg",k);g.cyl(k*.110,.238,-.012,.062,.065,.118,7,"#4d625b");
      g.cyl(k*.110,.303,-.011,.068,.066,.020,7,metal);
    }
  }
  function dressOwner(mesh){
    if(!mesh||mesh.palmaApron)return;
    const g=new BayMesh(),ranges=[];
    uniform(g,(kind,side)=>ranges.push({kind,side,first:g.vertices.length/6}));
    for(let i=0;i<ranges.length;i++){
      const a=ranges[i],end=ranges[i+1]?.first??g.vertices.length/6,limb=mesh.sides[a.side===1?1:0];
      for(let j=a.first;j<end;j++)mesh.bindings.push(mesh.binding(a.kind,limb,g.vertices[j*6+1]));
    }
    const next=new Float32Array(mesh.rest.length+g.vertices.length);next.set(mesh.rest);next.set(g.vertices,mesh.rest.length);
    mesh.rest=next;mesh.vertices=next.slice();mesh.palmaApron=true;mesh.lastRevision=-1;
  }
  function worldPoint(a,p){
    const yaw=a.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw);
    return [a.x+c*p[0]+s*p[2],(a.y||0)+(a.motion?.lift||0)+p[1],a.z-s*p[0]+c*p[2]];
  }
  function localPoint(a,p){
    const yaw=a.yaw||0,c=Math.cos(yaw),s=Math.sin(yaw),x=p[0]-a.x,z=p[2]-a.z;
    return [c*x-s*z,p[1]-(a.y||0)-(a.motion?.lift||0),s*x+c*z];
  }
  function toward(origin,dest){
    const x=dest[0]-origin[0],y=dest[1]-origin[1],z=dest[2]-origin[2],d=Math.hypot(x,y,z);
    // Orient the barrel above the trigger so its centreline goes through the impact.
    return {origin,yaw:Math.atan2(x,z),pitch:Math.asin(clamp(.064/Math.max(.065,d),-1,1))-Math.atan2(y,Math.hypot(x,z))};
  }
  function mount(f,x,y,z){
    const cc=Math.cos(f.pitch),ss=Math.sin(f.pitch),c=Math.cos(f.yaw),s=Math.sin(f.yaw),v=ss*y+cc*z;
    return [f.origin[0]+c*x+s*v,f.origin[1]+cc*y-ss*z,f.origin[2]-s*x+c*v];
  }
  const history=new WeakMap();
  function wandState(a,target,t,firing){
    const weight=a.motion?.weight||0,phase=(a.motion?.phase||0)*tau;
    const palm=[-.048+(firing?.009*Math.sin(t*3.2):.014*Math.sin(t*1.1)),
      1.240+.012*weight*Math.cos(phase)+.005*Math.sin(t*2.1),.111+.018*Math.cos(phase)*weight];
    const fresh=history.get(a);
    const origin=worldPoint(a,fresh&&fresh.t===t?fresh.palm:palm);
    const goal=target&&Number.isFinite(target.x)&&Number.isFinite(target.z)?[target.x,target.y??.88,target.z]:
      worldPoint(a,[.026,.76,2.8]);
    const f=toward(origin,goal);f.goal=goal;
    return f;
  }
  function solveArm(l,goal){
    const a=l.shoulder,k=l.elbow,b=l.hand,upper=l.arm.length,lower=l.forearm.length;
    const dx=goal[0]-a[0],dy=goal[1]-a[1],dz=goal[2]-a[2],n=Math.hypot(dx,dy,dz)||.001;
    const x=dx/n,y=dy/n,z=dz/n,d=clamp(n,.035,upper+lower-.0001);
    const along=(upper*upper-lower*lower+d*d)/(2*d),height=Math.sqrt(Math.max(0,upper*upper-along*along));
    const pole=[l.side*.71,-.66,-.37],dot=pole[0]*x+pole[1]*y+pole[2]*z;
    const ux=pole[0]-dot*x,uy=pole[1]-dot*y,uz=pole[2]-dot*z,f=height/(Math.hypot(ux,uy,uz)||1);
    k[0]=a[0]+along*x+ux*f;k[1]=a[1]+along*y+uy*f;k[2]=a[2]+along*z+uz*f;
    b[0]=a[0]+d*x;b[1]=a[1]+d*y;b[2]=a[2]+d*z;l.arm.aim(a,k);l.forearm.aim(k,b);
  }
  const grip=l=>l.forearm.map([l.side*.238,.977,.052],[]);
  function placePalm(l,goal){
    // Correct for the centimetres between the wrist joint and curled fingers.
    for(let pass=0;pass<3;pass++){
      const p=grip(l),w=l.forearm.map(l.handPivot,[]);
      solveArm(l,w.map((value,i)=>value+goal[i]-p[i]));
    }
  }
  function pose(mesh,motion,actor,target,t=0,spraying=false){
    if(!mesh||!motion||!actor)return false;
    mesh.update(motion);
    const f=wandState(actor,target,t,spraying),right=mesh.sides[1],left=mesh.sides[0];
    placePalm(right,localPoint(actor,f.origin));const palm=grip(right),g=toward(worldPoint(actor,palm),f.goal);
    placePalm(left,localPoint(actor,mount(g,0,.062,.235)));
    history.set(actor,{t,palm,mesh});mesh.skin();return true;
  }
  const owners=new WeakMap();
  function actors(view,w,t){
    const o=w?.owner;if(!o?.motion||!view.gl||view.lost)return;
    const eye=view.basis?.camera;if(eye&&Math.hypot(o.x-eye.x,o.z-eye.z)>95)return;
    let a=owners.get(view);
    if(!a){
      const mesh=new BayPlayerMesh(ownerColors,"local");dressOwner(mesh);
      a={mesh};owners.set(view,a);view.add("palma-elia",mesh,true);
    }
    const m=a.mesh,walk=m.update(o.motion);
    if(o===w.operator){pose(m,o.motion,o,w.target,t,w.spraying);view.updateAnimated("palma-elia");return;}
    // A little roll of the wrist dries Elia's hands between cars at the till.
    const cycle=(t+3)%15;
    if((o.motion.weight||0)<.13&&cycle>6.2&&cycle<8.9){
      const mix=Math.min(1,(cycle-6.2)*3,(8.9-cycle)*3),r=m.sides[1],l=m.sides[0];
      for(const limb of [r,l]){
        const p=grip(limb),k=limb.side,q=[k*.039,1.157+.023*k*Math.sin(cycle*7),.223+.025*Math.cos(cycle*7.0)];
        placePalm(limb,p.map((v,i)=>v+(q[i]-v)*mix));
      }
      m.skin();view.updateAnimated("palma-elia");
    }else if(walk)view.updateAnimated("palma-elia");
  }
  function ground(view,see,hours){if(see(site,123))view.draw("palma-floor",site.x,site.y,site.z,site.yaw,0,0,.12*(hours?.night||0));}
  function world(list,see,t,hours,w){
    if(!see(site,135))return;
    const n=hours?.night||0;
    for(const [id,glow] of [["palma-office",.20*n],["palma-awning",.19*n],["palma-sails",.20*n],["palma-frames",.17*n],["palma-pylon",.51*n],["palma-lamps",.26+.64*n]])
      list.push([id,site.x,site.y,site.z,site.yaw,0,0,glow]);
    const f=at(-.62,4.53,3.45),lamp=at(-3.55,-.23,2.72);
    list.push(["palma-fan",f.x,f.y,f.z,f.yaw,0,t*11.7,.19*n]);
    const active=!!w?.spraying||!!w?.personal;
    list.push([active?"palma-bell-lit":"palma-bell",lamp.x,lamp.y,lamp.z,site.yaw,0,0,active?.59+.11*Math.sin(5*t):.19*n]);
    if(w?.owner){const o=w.owner;list.push(["palma-elia",o.x,(o.y||0)+(o.motion?.lift||0),o.z,o.yaw||0]);}
    if(w?.operator){
      const wand=wandState(w.operator,w.target,t,w.spraying);
      list.push(["palma-lance",...wand.origin,wand.yaw,wand.pitch,0,.19*n]);
    }else{
      const hook=at(-3.394,1.51,1.35,.40);
      list.push(["palma-boom-rest",site.x,site.y,site.z,site.yaw,0,0,.15*n],["palma-lance",hook.x,hook.y,hook.z,hook.yaw,-1.07,0,.22*n]);
    }
  }
  const middle=(a,b,f)=>a.map((v,i)=>v+(b[i]-v)*f);
  function hoseCurve(f,t){
    const end=mount(f,0,-.131,-.071),left=at(-3.53,2.26,3.76);
    const anchor=[left.x,left.y,left.z],dx=end[0]-anchor[0],dz=end[2]-anchor[2],dist=Math.hypot(dx,dz)||1;
    const arm=Math.min(3.65,dist*.65),drop=[anchor[0]+dx/dist*arm,anchor[1]-.11,anchor[2]+dz/dist*arm],pts=[];
    const hang=Math.max(.27,Math.min(.71,.87-dist*.034)),sway=.02*Math.sin(t*2.2);
    for(let i=0;i<=12;i++){
      const k=i/12,p=middle(drop,end,k),s=Math.sin(k*Math.PI);
      p[0]+=s*(dz/dist)*(.09+sway);p[2]-=s*(dx/dist)*(.09+sway);p[1]=Math.max(.16,p[1]-hang*s);pts.push(p);
    }
    return {anchor,drop,pts};
  }
  function waterMarks(f,t,visit){
    const from=mount(f,0,.064,.785),target=f.goal,dx=target[0]-from[0],dy=target[1]-from[1],dz=target[2]-from[2];
    const length=Math.hypot(dx,dy,dz),flat=Math.hypot(dx,dz)||.001;
    if(length<.035||length>13||dx*Math.sin(f.yaw)+dz*Math.cos(f.yaw)<0)return;
    const u=[dz/flat,0,-dx/flat],v=[-dx*dy/(flat*length),flat/length,-dz*dy/(flat*length)];
    const fan=Math.min(.32,.036+length*.079);
    const q=(k,off,y)=>[from[0]+dx*k+u[0]*off+v[0]*y,from[1]+dy*k+v[1]*y,from[2]+dz*k+u[2]*off+v[2]*y];
    // The jet is a fan of droplets, broken into moving strands. Almost all of the car remains visible through it.
    for(let i=0;i<11;i++){
      const lane=(i-5)/5,shift=(i*.231+t*(2.41+.03*i))%1,lean=.011*Math.sin(t*19+i*2);
      const a=shift*.75,b=Math.min(1,a+.12+(i%3)*.062);
      visit(q(a,lane*fan*a,a*lean),q(b,lane*fan*b,b*lean),.008+.0018*(i%4),i%3?"#dde9d5":"#9ed2cd",false);
      if(i%2===0)visit(q(.006,i*.00013,0),q(.17+.11*(1-Math.abs(lane)),lane*fan*.20,.003),.0045,"#d1ede3",false);
    }
    for(let i=0;i<19;i++){
      const a=i*2.39996,p=(t*(2.84+(i%4)*.19)+i*.193)%1;
      const dist=(.024+p*(.14+fan*.45)),x=Math.cos(a)*dist,y=Math.sin(a)*dist;
      const k=1-p*(.031+(i%3)*.016)/Math.max(.3,length);
      const a0=q(k,x,y+.046*Math.sin(p*Math.PI)-.044*p*p),a1=[a0[0]+u[0]*.01*Math.cos(a),a0[1]+.012+.014*(1-p),a0[2]+u[2]*.01*Math.cos(a)];
      visit(a0,a1,.009+.008*(1-p),i%3?"#e0e5db":"#b6d3cb",true);
    }
  }
  const streams=new WeakMap();
  function buffer(view,key,capacity){
    const scratch=new BayMesh(),data=new Float32Array(capacity*6);
    view.add(key,{vertices:data},true);
    return {scratch,data,key};
  }
  function flush(view,s){
    const v=s.scratch.vertices;
    if(v.length>s.data.length)throw Error("Palma spray mesh capacity");
    s.data.set(v);
    const m=view.models.get(s.key);
    if(m)m.count=v.length/6;
    view.updateAnimated(s.key);
  }
  function water(view,w,t){
    if(!w?.operator||!view.gl||view.lost)return;
    const eye=view.basis?.camera,a=w.operator;
    if(eye&&Math.hypot(a.x-eye.x,a.z-eye.z)>69)return;
    let buffers=streams.get(view);
    if(!buffers){buffers={hose:buffer(view,"palma-hose",775),water:buffer(view,"palma-water",1120)};streams.set(view,buffers);}
    const f=wandState(a,w.target,t,w.spraying),h=hoseCurve(f,t),hose=buffers.hose.scratch,jet=buffers.water.scratch;
    hose.vertices.length=0;jet.vertices.length=0;
    hose.pole(h.anchor,h.drop,.040,metal,6);
    hose.pole(middle(h.anchor,h.drop,.11),middle(h.anchor,h.drop,.43),.050,bottle,6);
    hose.pole(h.drop,h.pts[1],.044,brass,5);
    tube(hose,h.pts,.017,rubber,5);
    const end=h.pts.at(-1),back=h.pts.at(-2);
    for(let i=0;i<3;i++)hose.pole(middle(end,back,.09+i*.13),middle(end,back,.14+i*.13),.027,bottle,5);
    flush(view,buffers.hose);view.draw("palma-hose");
    if(!w.spraying)return;
    waterMarks(f,t,(a,b,r,col,spot)=>jet.pole(a,b,spot?r:r*.76,col,4));
    flush(view,buffers.water);view.draw("palma-water",0,0,0,0,0,0,.39,null,0,.79);
  }
  // A single orthographic print of each static piece uses the same paintwork and roof profile as the road view.
  const prints=new Map();
  function stamp(c,key,density,px,py,s){
    let p=prints.get(key);
    if(!p){
      const g=new BayMesh();models[key](g);const v=g.vertices,pts=new Float32Array(v.length/2);
      const cs=Math.cos(site.yaw),sn=Math.sin(site.yaw);
      let x0=Infinity,x1=-Infinity,y0=Infinity,y1=-Infinity;
      for(let i=0,j=0;i<v.length;i+=6,j+=3){
        const x=cs*v[i]+sn*v[i+2],z=-sn*v[i]+cs*v[i+2],h=v[i+1];
        const u=x+.22*h,b=-z-.27*h;pts[j]=u;pts[j+1]=b;pts[j+2]=h-.22*x-.27*z;
        x0=Math.min(x0,u);x1=Math.max(x1,u);y0=Math.min(y0,b);y1=Math.max(y1,b);
      }
      x0=Math.floor(x0*density-1)/density;y0=Math.floor(y0*density-1)/density;
      const canvas=document.createElement("canvas"),w=canvas.width=Math.ceil((x1-x0)*density)+2,h=canvas.height=Math.ceil((y1-y0)*density)+2;
      const ctx=canvas.getContext("2d"),im=ctx.createImageData(w,h),depth=new Float32Array(w*h);depth.fill(-Infinity);
      for(let i=0;i<pts.length;i+=9){
        const x=(pts[i]-x0)*density,y=(pts[i+1]-y0)*density,ux=(pts[i+3]-pts[i])*density,uy=(pts[i+4]-pts[i+1])*density;
        const vx=(pts[i+6]-pts[i])*density,vy=(pts[i+7]-pts[i+1])*density,area=ux*vy-uy*vx;
        if(Math.abs(area)<1e-7)continue;
        const lo=Math.max(0,Math.floor(x+Math.min(0,ux,vx))),hi=Math.min(w-1,Math.ceil(x+Math.max(0,ux,vx)));
        const top=Math.max(0,Math.floor(y+Math.min(0,uy,vy))),bot=Math.min(h-1,Math.ceil(y+Math.max(0,uy,vy)));
        const dz=pts[i+5]-pts[i+2],ez=pts[i+8]-pts[i+2],r=v[2*i+3]*255,gr=v[2*i+4]*255,b=v[2*i+5]*255;
        for(let py=top;py<=bot;py++)for(let px=lo;px<=hi;px++){
          const dx=px+.5-x,dy=py+.5-y,u=(dx*vy-dy*vx)/area,k=(ux*dy-uy*dx)/area;
          if(u<0||k<0||u+k>1)continue;
          const pos=py*w+px,z=pts[i+2]+u*dz+k*ez;if(z<depth[pos]-.00002)continue;
          depth[pos]=z;const j=pos*4;im.data[j]=r;im.data[j+1]=gr;im.data[j+2]=b;im.data[j+3]=255;
        }
      }
      ctx.putImageData(im,0,0);p={canvas,x:x0,y:y0,w:w/density,h:h/density};prints.set(key,p);
    }
    c.drawImage(p.canvas,px(site.x)+p.x*s,py(site.z)+p.y*s,p.w*s,p.h*s);
  }
  function chart(c,x,y,size){
    c.save();c.translate(x,y);c.scale(size,size);
    c.fillStyle="#37665e";c.beginPath();c.arc(0,0,5.8,0,tau);c.fill();
    c.fillStyle="#e7c99a";c.beginPath();c.arc(0,0,4.7,0,tau);c.fill();
    c.fillStyle="#438879";c.beginPath();c.moveTo(.12,-3.89);c.bezierCurveTo(.37,-2.75,2.75,-.84,2.75,.90);
    c.bezierCurveTo(2.75,3.98,-2.57,4.18,-2.57,1);c.bezierCurveTo(-2.57,-.68,-.45,-2.66,.12,-3.89);c.fill();
    c.strokeStyle="#f0dcb5";c.lineWidth=.62;c.lineCap="round";c.beginPath();c.moveTo(-1.45,.72);c.quadraticCurveTo(-1.98,1.91,-.89,2.28);c.stroke();c.restore();
  }
  function map(c,opt,px,py,s,visible){
    if(opt.mode!=="street"){
      if(opt.mode==="atlas"&&(opt.countyChart||opt.marina?.bayChart))return;
      const x=px(site.till.x),y=py(site.till.z),scale=Math.min(c.canvas.width,c.canvas.height)/(opt.mode==="radar"?165:370);
      if(visible(x,y,8*scale))chart(c,x,y,scale);
      return;
    }
    if(!visible(px(site.x),py(site.z),17*s))return;
    const near=opt.player?Math.hypot(opt.player.x-site.x,opt.player.z-site.z):27;
    stamp(c,"palma-floor",32,px,py,s);stamp(c,"palma-office",48,px,py,s);stamp(c,"palma-frames",34,px,py,s);
    c.save();c.globalAlpha=.08+.92*clamp((near-6)/15);stamp(c,"palma-awning",48,px,py,s);c.restore();
    if(!opt.wash?.operator)stamp(c,"palma-boom-rest",48,px,py,s);
    c.save();c.globalAlpha=.08+.84*clamp((near-12)/22);stamp(c,"palma-sails",32,px,py,s);c.restore();
    stamp(c,"palma-pylon",78,px,py,s);
    if((opt.weather?.night||0)>.12){
      stamp(c,"palma-lamps",40,px,py,s);
      const p=site.at(.1,1.96),x=px(p.x),y=py(p.z);c.save();c.globalAlpha=opt.weather.night*.26;
      const grad=c.createRadialGradient(x,y,.01,x,y,s*3.45);grad.addColorStop(0,"#ffe0a7");grad.addColorStop(1,"rgba(255,219,143,0)");
      c.fillStyle=grad;c.fillRect(x-s*3.5,y-s*3.5,s*7,s*7);c.restore();
    }
  }
  const drawings=new WeakMap();
  const screen=(v,px,py)=>[px(v[0]+.22*v[1]),py(v[2]+.27*v[1])];
  function mapPerson(c,a,motion,t,w,px,py,s,isOwner,kit){
    if(!motion)return;
    let m=drawings.get(a);
    if(!m){m=new BayPlayerMesh(isOwner?ownerColors:["#af7353","#398e86","#556d80"],"local");
      // Canvas needs joint positions only.
      m.bindings.length=0;m.rest=m.vertices=new Float32Array(0);drawings.set(a,m);}
    m.update(motion);
    if(a===w.operator)pose(m,motion,a,w.target,t,w.spraying);
    const col=isOwner?ownerColors:["#af7353",window.BayCourtPlayers?.kitColors?.[kit]||"#398e86","#536977"];
    const P=q=>screen(worldPoint(a,q),px,py);
    const path=(qs,paint,width)=>{const [x,y]=P(qs[0]);c.beginPath();c.moveTo(x,y);
      for(const q of qs.slice(1))c.lineTo(...P(q));if(width){c.strokeStyle=paint;c.lineWidth=Math.max(.56,width*s);c.stroke();}else{c.fillStyle=paint;c.closePath();c.fill();}};
    const node=(q,x,y,paint,rot=0)=>{c.beginPath();c.ellipse(...P(q),Math.max(.4,x*s),Math.max(.4,y*s),rot,0,tau);c.fillStyle=paint;c.fill();};
    const ch=(x,y,z)=>m.chest.map([x,y,z],[]),hd=(x,y,z)=>m.head.map([x,y,z],[]);
    c.lineJoin=c.lineCap="round";
    if(isOwner){
      node([.09,.017,-.065],.30,.17,"rgba(44,62,57,.26)",.39);
      for(const l of m.sides){
        const to=l.shoe.map([l.side*.111,.049,.136],[]);
        path([l.hip,l.knee],col[2],.153);path([l.knee,l.ankle],col[2],.123);
        path([l.ankle,to],"#53665b",.131);
      }
    }
    for(const l of m.sides){
      const hand=grip(l);
      path([l.shoulder,l.elbow],col[0],.106);
      path([l.shoulder,middle(l.shoulder,l.elbow,.63)],col[1],.141);
      if(isOwner)path([middle(l.shoulder,l.elbow,.57),middle(l.shoulder,l.elbow,.64)],cream,.138);
      path([l.elbow,hand],col[0],.083);node(hand,.043,.046,col[0]);
    }
    path([ch(-.185,1.395,-.083),ch(.183,1.398,-.083),ch(.198,1.372,.069),ch(.140,.963,.109),ch(-.143,.968,.110),ch(-.196,1.375,.064)],col[1]);
    if(isOwner){
      path([ch(-.106,1.315,.119),ch(.115,1.318,.119),ch(.137,.925,.113),ch(-.132,.923,.120)],apron);
      for(const k of [-1,1])path([ch(k*.092,1.31,.129),ch(k*.13,1.409,.039),ch(k*.118,1.403,-.10)],bottle,.031);
    }
    node(hd(0,1.658,.012),.107,.106,col[0],a.yaw);node(hd(0,1.735,-.004),.111,.103,isOwner?hair:"#38343b",a.yaw);
    if(isOwner){
      node(hd(0,1.684,-.119),.073,.063,hair,a.yaw);
      node(hd(0,1.721,.033),.127,.157,visor,a.yaw);node(hd(0,1.755,-.018),.101,.099,"#4d4238",a.yaw);
      path([hd(-.103,1.704,.051),hd(-.048,1.713,.094),hd(.046,1.713,.096),hd(.112,1.704,.055)],"#8eac93",.022);
    }
  }
  function mapActivity(c,opt,px,py,s,visible){
    const w=opt.wash;if(!w||opt.mode!=="street"||!visible(px(site.x),py(site.z),21*s))return;
    const t=Number.isFinite(opt.time)?opt.time:opt.elapsed||0,o=w.owner,operator=w.operator;
    c.save();c.lineCap=c.lineJoin="round";
    const draw=(a,b,col,width)=>{c.beginPath();c.moveTo(...screen(a,px,py));c.lineTo(...screen(b,px,py));c.strokeStyle=col;c.lineWidth=Math.max(.52,width*s);c.stroke();};
    let f;
    if(operator){
      f=wandState(operator,w.target,t,w.spraying);const h=hoseCurve(f,t);
      draw(h.anchor,h.drop,metal,.062);
      for(let i=1;i<h.pts.length;i++)draw(h.pts[i-1],h.pts[i],rubber,.042);
    }
    if(o){
      const behindTill=Math.hypot(o.x-site.keeper.x,o.z-site.keeper.z)<1.1;
      c.save();if(behindTill&&opt.player)c.globalAlpha=1-.92*clamp((Math.hypot(opt.player.x-site.x,opt.player.z-site.z)-6)/15);
      mapPerson(c,o,o.motion,t,w,px,py,s,true);c.restore();
    }
    if(operator&&operator!==o)mapPerson(c,operator,operator.motion||opt.player?.motion,t,w,px,py,s,false,opt.player?.kit);
    if(operator){
      f=wandState(operator,w.target,t,w.spraying);
      draw(mount(f,0,-.093,-.036),mount(f,0,.061,.069),rubber,.068);
      draw(mount(f,0,.061,.046),mount(f,0,.064,.316),bottle,.071);
      draw(mount(f,0,.064,.298),mount(f,0,.064,.750),silver,.038);
      draw(mount(f,0,.064,.735),mount(f,0,.064,.783),brass,.059);
      if(w.spraying)waterMarks(f,t,(a,b,r,col,spot)=>{
        c.globalAlpha=spot?.85:.76;draw(a,b,col,r*1.8);
      });
    }else{
      const q=at(-3.394,1.51,1.35,.40),rest={origin:[q.x,q.y,q.z],yaw:q.yaw,pitch:-1.07};
      draw(mount(rest,0,-.083,-.037),mount(rest,0,.063,.29),rubber,.068);
      draw(mount(rest,0,.064,.29),mount(rest,0,.064,.76),silver,.037);
    }
    c.restore();
  }
  window.BayPalmaWash={site,blocks,cameraBlocks,ownerColors,at,floorLevel,install,ground,world,actors,water,
    pose,dressOwner,map,mapActivity};
})();
