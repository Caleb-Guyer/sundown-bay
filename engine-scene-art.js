/* Loose things left at the curb on Engine Seven's run. Forward faces local −Z. */
(() => {
  "use strict";
  const tau=2*Math.PI,clamp=v=>Math.max(0,Math.min(1,v));
  const tire="#3a4745",iron="#455a58",zinc="#a5b1a3",sage="#637e70",canvas="#ddd1ac",ivory="#f2e4c0";
  const teal="#4c8b87",coral="#c67258",honey="#d7a45e",wood="#a47d56",navy="#3d5960";
  const local=(site,x,y,z)=>{
    const c=Math.cos(site.yaw||0),s=Math.sin(site.yaw||0);
    return [site.x+c*x+s*z,(site.y||0)+y,site.z-s*x+c*z];
  };
  function face(g,z,points,col){
    const a=[points[0][0],points[0][1],z];
    for(let i=1;i+1<points.length;i++)g.tri(a,[points[i][0],points[i][1],z],[points[i+1][0],points[i+1][1],z],col);
  }
  function frontLine(g,z,x,y,xx,yy,w,col){
    const dx=xx-x,dy=yy-y,k=w/(Math.hypot(dx,dy)*2||1),a=dy*k,b=-dx*k;
    g.quad([x+a,y+b,z],[xx+a,yy+b,z],[xx-a,yy-b,z],[x-a,y-b,z],col);
  }
  function rail(g,points,r,col){
    for(let i=1;i<points.length;i++)g.pole(points[i-1],points[i],r,col,6);
  }
  function caster(g,x,z){
    const wheel=[x-.053,.135,z];
    g.pole(wheel,[x+.053,.135,z],.119,tire,9);
    g.pole([x-.061,.135,z],[x+.061,.135,z],.049,zinc,8);
    g.box(x,.252,z+.029,.13,.16,.073,iron);
  }
  function shield(g,x,y,z,color){
    face(g,z,[[x-.245,y+.11],[x+.245,y+.11],[x+.201,y-.08],[x,y-.155],[x-.201,y-.08]],color);
    face(g,z-.004,[[x-.151,y-.010],[x-.032,y+.036],[x+.047,y+.028],[x+.161,y+.083],[x+.069,y+.018],[x+.106,y+.008],[x-.006,y-.013],[x-.045,y-.045],[x-.116,y-.039]],ivory);
    face(g,z-.005,[[x-.10,y-.021],[x-.176,y+.008],[x-.153,y-.037],[x-.183,y-.075]],ivory);
  }
  function folded(g,x,top,z,w,d,color,band){
    g.box(x,top-.05,z,w,.1,d,color);
    for(const dx of [-w*.34,-w*.24]){
      g.box(x+dx,top+.001,z,.022,.007,d,band);
      g.box(x+dx,top-.044,z-d*.5-.002,.022,.085,.007,band);
    }
    g.box(x+.035,top-.071,z-d*.5-.004,w*.75,.012,.007,"#b9aa8b");
  }
  function linen(g){
    for(const x of [-1.10,1.10])for(const z of [-.419,.425])caster(g,x,z);
    g.box(0,.332,0,2.56,.092,1.04,sage);
    const a=[-1.19,.39,-.45],b=[1.19,.39,-.45],c=[1.19,.39,.445],d=[-1.19,.39,.445];
    const A=[-1.31,1.15,-.526],B=[1.31,1.15,-.526],C=[1.31,1.15,.52],D=[-1.31,1.15,.52];
    g.quad(a,b,B,A,canvas);g.quad(c,d,D,C,"#c8bc98");g.quad(b,c,C,B,"#c1b58f");g.quad(d,a,A,D,"#d3c49e");
    for(const [bottom,top] of [[a,A],[b,B],[c,C],[d,D]])g.pole(bottom,top,.039,zinc,6);
    rail(g,[A,B,C,D,A],.04,sage);
    for(const s of [-1,1]){
      const x=s*1.278,xx=s*1.419;
      rail(g,[[x,.38,-.405],[xx,1.337,-.415],[xx,1.389,-.349],[xx,1.389,.35],[xx,1.337,.413],[x,.38,.405]],.029,zinc);
      g.pole([xx,1.389,-.24],[xx,1.389,.235],.041,iron,7);
    }
    for(const x of [-.85,.005,.86]){
      const h=x<-.5?1.34:x>.5?1.29:1.41;
      folded(g,x,h-.20,.025,.70,.79,"#cfbd95",coral);
      folded(g,x-.037,h-.105,.013,.74,.75,ivory,teal);
      folded(g,x+.029,h,.037,.72,.70,x<0?"#c89375":ivory,x<0?ivory:teal);
    }
    // A striped bath sheet hangs over the basket lip. Its folded corner lifts away from the canvas.
    const cloth=(x,v)=>[x,1.177-.61*v,-.557-.021*Math.sin(Math.PI*v)-.035*Math.cos((x+.67)*10)*v];
    for(let i=0;i<6;i++){
      const x=-1.14+i*.147,xx=x+.147,tips=[1,.985,1.03,1.012,.973,.949,1.005];
      const u=tips[i],v=tips[i+1];g.quad(cloth(x,0),cloth(xx,0),cloth(xx,v),cloth(x,u),i%2?teal:"#559791");
      for(const k of [.77,.872]){const p=(xx,v)=>{const a=cloth(xx,v);a[2]-=.004;return a;};g.quad(p(x,k),p(xx,k),p(xx,k+.031),p(x,k+.031),ivory);}
    }
    shield(g,.63,.843,-.53,navy);
    for(const x of [.06,1.16])frontLine(g,-.526,x,.48,x+.04,1.076,.013,"#bdaf8e");
  }
  function coil(g,x,y,z,rx,rz,col){
    // Tight continuous spiral, with a short tail lying on the lid.
    const points=[];for(let i=0;i<=42;i++){
      const u=i/42,a=u*tau*2.55,k=1-.66*u;
      points.push([x+rx*k*Math.cos(a),y+.018*u,z+rz*k*Math.sin(a)]);
    }
    rail(g,points,.045,col);
  }
  function float(g,x,y,z,color){
    g.cyl(x,y+.144,z,.054,.135,.13,8,color);g.cyl(x,y+.044,z,.135,.143,.075,8,ivory);
    g.cyl(x,y-.046,z,.143,.115,.109,8,color);g.cyl(x,y-.112,z,.115,.046,.049,8,navy);
    g.cyl(x,y+.221,z,.031,.040,.041,6,iron);
  }
  function chest(g){
    for(const x of [-1.13,1.13])g.box(x,.117,0,.23,.188,1.13,wood);
    g.box(0,.244,0,2.85,.112,1.11,iron);g.box(0,.645,0,2.65,.718,1.01,navy);
    for(let i=0;i<4;i++){
      const h=.37+i*.162;g.box(0,h,-.516,2.64,.142,.075,i===2?"#647e79":"#6e8680");
      g.box(0,h,.511,2.61,.14,.052,"#788a7e");
    }
    for(const x of [-1.31,-.455,.46,1.31]){
      g.box(x,.624,-.554,.060,.74,.043,iron);
      for(const y of [.326,.929])g.box(x,y,-.581,.024,.021,.014,zinc);
    }
    for(const z of [-.488,.485])g.box(0,1.014,z,2.77,.094,.128,"#a99c73");
    g.box(0,.978,0,2.61,.044,.90,"#665e4b");
    const lid=(x,u)=>[x,1.025+.48*u,.39+.172*u];
    for(let i=0;i<3;i++){
      const a=i/3,b=(i+1)/3-.018;g.quad(lid(-1.328,a),lid(1.328,a),lid(1.328,b),lid(-1.328,b),i%2?"#9b8966":"#a99470");
    }
    for(const x of [-1.22,-.03,1.22])g.pole(lid(x,0),lid(x,1),.030,iron,5);
    coil(g,-.624,1.052,-.005,.46,.334,"#c9ad76");coil(g,.465,1.052,.031,.46,.28,"#be9964");
    rail(g,[[-1.06,1.07,-.015],[-1.23,1.075,-.37],[-1.12,.889,-.57],[-.96,.771,-.585]],.038,honey);
    float(g,.815,1.199,-.212,coral);float(g,.393,1.157,-.218,teal);
    g.box(-.84,.648,-.571,.49,.29,.025,navy);
    // Stamped harbor anchor on the weathered end of the bin.
    frontLine(g,-.59,-.84,.547,-.84,.750,.022,ivory);frontLine(g,-.59,-.914,.698,-.77,.698,.019,ivory);
    for(const s of [-1,1]){frontLine(g,-.59,-.84,.553,-.84+s*.104,.608,.024,ivory);frontLine(g,-.59,-.84+s*.104,.608,-.84+s*.113,.648,.021,ivory);}
  }
  function loaf(g,x,y,z,rx,rz){
    const rings=[];
    for(const [k,h] of [[.82,0],[1,.039],[.87,.101],[.40,.137]]){
      const ring=[];for(let i=0;i<8;i++){const a=i*tau/8;ring.push([x+rx*k*Math.cos(a),y+h,z+rz*k*Math.sin(a)]);}rings.push(ring);
    }
    for(let j=0;j<3;j++)for(let i=0;i<8;i++){const k=(i+1)%8;g.quad(rings[j][i],rings[j][k],rings[j+1][k],rings[j+1][i],[wood,"#cb9151","#e1af69"][j]);}
    for(let i=1;i<7;i++)g.tri(rings[3][0],rings[3][i],rings[3][i+1],"#e5b775");
    for(const j of [-1,0,1]){const cx=x+rx*j*.30;
      g.quad([cx-.036,y+.133,z-.038],[cx-.012,y+.14,z-.044],[cx+.039,y+.139,z+.033],[cx+.017,y+.142,z+.04],ivory);}
  }
  function oven(g){
    for(const x of [-1.21,1.21])for(const z of [-.425,.429])caster(g,x,z);
    for(const x of [-1.315,1.315]){
      rail(g,[[x,.276,-.485],[x,1.411,-.485],[x,1.49,-.40],[x,1.49,.414],[x,1.417,.49],[x,.276,.49]],.039,zinc);
      for(const h of [.37,.68,.98,1.24])g.pole([x,h,-.485],[x,h,.49],.022,iron,5);
    }
    for(const h of [.369,.677,1.036]){
      g.box(0,h,0,2.65,.048,.937,zinc);
      for(const z of [-.454,.454])g.box(0,h+.055,z,2.60,.071,.031,"#9ca99b");
    }
    // Baguette rack on top, covered proofing boxes living on the lower rails.
    for(const x of [-.86,-.01,.853])for(const z of [-.22,.19])loaf(g,x,1.063,z,.348,.147);
    for(const x of [-.81,.42]){g.box(x,.519,.035,.98,.239,.74,"#ca916e");g.box(x,.644,.032,1.03,.046,.764,canvas);}
    for(const x of [-.96,-.12,.598])loaf(g,x,.707,-.028,.324,.22);
    g.box(0,1.388,.475,2.67,.059,.047,sage);
    // Woven green tea towel at one corner, visible both in traffic and from above.
    g.box(-.94,1.071,-.414,.516,.024,.15,teal);
    g.box(-.94,.887,-.495,.518,.384,.023,teal);
    for(const dx of [-.19,-.15,.12,.16])g.box(-.94+dx,.889,-.51,.019,.383,.006,canvas);
    for(const h of [.735,.762])g.box(-.94,h,-.512,.52,.014,.008,canvas);
    g.box(.90,.88,-.497,.436,.255,.027,"#456252");
    frontLine(g,-.515,.769,.81,.996,.961,.014,ivory);
    for(let i=0;i<4;i++){const x=.815+i*.039,y=.841+i*.026;
      face(g,-.516,[[x,y],[x-.042,y+.047],[x-.045,y+.072],[x-.014,y+.048]],ivory);
      face(g,-.516,[[x+.009,y],[x+.054,y-.006],[x+.083,y+.005],[x+.051,y+.014]],ivory);
    }
  }
  const props={linen,rope:chest,oven};
  function blemish(g,x,y,z,w,d,col){
    const edge=[[-.89,-.20],[-.48,-.78],[-.27,-.91],[.11,-.62],[.49,-.70],[.74,-.29],[1,.02],[.64,.54],[.29,.47],[-.11,.89],[-.30,.51],[-.83,.33]];
    for(let i=0;i<edge.length;i++){const a=edge[i],b=edge[(i+1)%edge.length];g.tri([x,y,z],[x+a[0]*w,y,z+a[1]*d],[x+b[0]*w,y,z+b[1]*d],col);}
  }
  function soot(g,kind,i){
    const side=i-1,dx=-side*.139;
    if(kind==="linen"){
      const h=[1.34,1.41,1.29][i];
      blemish(g,dx,h+.006,-.09,.235,.166,"#958366");blemish(g,dx,h+.009,-.09,.168,.102,"#72614e");
      for(let j=0;j<5;j++){
        const x=dx+(j-2)*.086,h=.972+Math.sin(j*3.1+i)*.031,k=.094+.046*Math.sin(j*4+i);
        const p=(u,v)=>[x+u,v,i===0?-.601:-.45-.076*(v-.39)/.76-.006];
        g.quad(p(-.044,h+.052),p(.038,h+.062),p(.023,h-k),p(-.026,h-k*.83),"#958167");
      }
    }else if(kind==="rope"){
      for(const [j,h] of [.694,.856].entries()){
        const w=j?.263:.152;
        face(g,-.555,[[-w,h+.05],[w*.42,h+.058],[w,h+.034],[w*.61,h-.025],[-w*.31,h-.053],[-w*.82,h-.013]],j?"#736c5e":"#66685b");
      }
      g.box(dx,1.067,-.477,.276,.012,.089,"#746848");
    }else{
      // The open shelf has air between its uprights. Only the loaf, sheet pan and lip catch a scorch.
      const loafX=[-.86,-.01,.853][i]-side;
      blemish(g,loafX,1.205,-.219,.135,.044,"#785735");blemish(g,loafX+.021,1.208,-.216,.069,.031,"#5d4b37");
      blemish(g,loafX-.176,1.061,-.392,.175,.047,"#716858");
      g.box(dx,1.098,-.474,.291,.046,.009,"#817761");
      g.box(dx+.035,.738,-.474,.164,.038,.009,"#8e8672");
    }
  }
  function flame(g,size,pose){
    const k=[.42,.72,1.03][size],hash=pose*.99;
    const colors=["#c6573b","#ea7936","#f29d3f","#ffd171"];
    for(let n=0;n<4;n++){
      const a=n*2.12+hash*.40;
      const x=n===0?0:Math.cos(a)*.178*k,z=n===0?0:Math.sin(a)*.15*k;
      const h=(n===0?1:.60+.13*Math.cos(hash+n))*k,r=(n===0?.217:.127)*k;
      const rings=[],drift=.08*Math.sin(hash+n*.71)*k;
      for(const [level,width] of [[0,.70],[.19,1],[.55,.62],[.79,.29]]){
        const ring=[];for(let j=0;j<5;j++){const turn=j*tau/5+a;ring.push([x+r*width*Math.cos(turn)+level*drift,h*level,z+r*width*Math.sin(turn)+.075*k*level*level]);}rings.push(ring);
      }
      const top=[x+drift+.13*k*Math.sin(hash*1.5+n),h,z+.09*k];
      for(let i=0;i<5;i++){const j=(i+1)%5;for(let row=0;row<3;row++)g.quad(rings[row][i],rings[row][j],rings[row+1][j],rings[row+1][i],colors[row===0?(i%2?3:2):row===1?(i%3?2:1):1]);g.tri(rings[3][i],rings[3][j],top,colors[i%2]);}
    }
  }
  function puff(g,stage,steam){
    const k=steam?.52:.83+stage*.35,vertical=steam?k:k*1.46;
    const palette=steam?["#abb9ae","#f2e3c7","#cad2bf"]:["#555857","#686a61","#808177"];
    for(const [x,y,z,r,c] of [[0,.025,0,.47,0],[-.28,.09,-.047,.35,1],[.22,.20,.07,.38,2],[.02,.35,.04,.28,2]]){
      const a=[],b=[],cap=[x*k,(y+.65*r)*vertical,z*k],foot=[x*k,(y-.50*r)*vertical,z*k];
      for(let j=0;j<6;j++){const f=j*tau/6+.22; a.push([(x+.96*r*Math.cos(f))*k,(y-.24*r)*vertical,(z+.71*r*Math.sin(f))*k]);b.push([(x+.79*r*Math.cos(f+.23))*k,(y+.37*r)*vertical,(z+.69*r*Math.sin(f+.23))*k]);}
      for(let j=0;j<6;j++){const i=(j+1)%6;g.tri(foot,a[j],a[i],palette[c]);g.quad(a[j],a[i],b[i],b[j],palette[c],.91+.055*Math.cos(j));g.tri(b[j],b[i],cap,palette[c]);}
    }
  }
  const warmth=(levels,i)=>clamp(Number(levels?.[i])||0);
  function world(list,model,site,levels,t=0,phase="quiet"){
    if(!props[site.kind])return;
    const key="engine7/curb/"+site.kind;
    model(key,props[site.kind]);list.push([key,site.x,site.y||0,site.z,site.yaw||0]);
    if(phase==="quiet")return;
    let peak=0,source=0;
    for(let i=0;i<3;i++){
      const heat=warmth(levels,i),x=i-1;
      if(heat>=peak){peak=heat;source=x;}
      if(phase==="cool"||heat<.65){
        const mark="engine7/scorch/"+site.kind+"/"+i;model(mark,g=>soot(g,site.kind,i));list.push([mark,...local(site,x,0,0),site.yaw||0]);
      }
      if(phase==="call"&&heat>.035){
        const size=heat<.30?0:heat<.64?1:2,pose=(Math.floor(t*6.5+i*2)%5+5)%5;
        const name="engine7/flame/"+size+"/"+pose;
        model(name,g=>flame(g,size,pose));
        list.push([name,...local(site,x,.87+heat*.12,-.35),(site.yaw||0)+.27*Math.sin(t*4.35+i),.045*Math.sin(t*5.3+i),0,.84]);
      }
    }
    if(phase==="marked")return;
    const steam=phase==="cool"||peak<.035;
    const puffs=steam?3:7;
    for(let j=0;j<puffs;j++){
      const f=((t*(steam?.55:.34)+j/puffs)%1+1)%1;
      const stage=f<.36?0:f<.69?1:2;
      const name=steam?"engine7/steam":"engine7/smoke/"+stage;model(name,g=>puff(g,stage,steam));
      const high=steam?.52+f*1.85:1.46+f*(2.38+2.38*peak);
      const x=steam?(j-1)*.73+f*.31:source*.52+f*f*(1.29+.30*peak)+.20*Math.sin(8*f+j*.41);
      const p=local(site,x,high,-.20+f*.63+.09*Math.sin(5*f));
      const fade=Math.sin(Math.PI*f);
      if(steam||f>.80)list.push([name,...p,(site.yaw||0)+j*.94+f*.58,0,0,0,null,0,steam?.43*fade:.31*fade]);
      else list.push([name,...p,(site.yaw||0)+j*.94+f*.58]);
    }
  }
  function round(c,x,y,r,col){
    c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,tau);c.fill();
  }
  function stroke(c,points,width,col){
    c.strokeStyle=col;c.lineWidth=width;c.beginPath();c.moveTo(...points[0]);
    for(let i=1;i<points.length;i++)c.lineTo(...points[i]);c.stroke();
  }
  function overhead(c,px,py,scale,site,levels,t=0,phase="quiet"){
    if(!props[site.kind])return;
    c.save();c.translate(px(site.x),py(site.z));c.rotate(site.yaw||0);c.scale(scale,scale);c.lineJoin="round";
    const rect=(x,y,w,h,col)=>{c.fillStyle=col;c.fillRect(x,y,w,h);};
    rect(-1.39,-.48,2.83,1.12,"#575e53");
    if(site.kind==="linen"){
      rect(-1.36,-.55,2.72,1.10,sage);rect(-1.25,-.45,2.50,.89,canvas);
      for(const [i,x] of [-1.18,-.38,.44].entries()){
        rect(x,-.403,.737,.739,i===0?"#cd9d80":ivory);
        for(const dx of [.13,.20])rect(x+dx,-.402,.035,.738,i===0?ivory:teal);
        rect(x+.05,.303,.64,.025,"#bdac8a");
      }
      rect(-1.15,.318,.873,.28,teal);rect(-1.15,.514,.873,.032,ivory);
      for(const x of [-1.42,1.35])rect(x,-.38,.07,.78,zinc);
    }else if(site.kind==="rope"){
      rect(-1.40,-.55,2.80,1.11,navy);rect(-1.30,-.45,2.60,.89,"#83775a");
      rect(-1.32,-.58,2.64,.16,"#b19b71");rect(-1.37,.415,2.74,.083,"#a1926e");
      for(const x of [-.62,.49]){
        c.beginPath();for(let k=0;k<=38;k++){
          const u=k/38,a=tau*2.40*u,r=.42*(1-.67*u),xx=x+r*Math.cos(a),yy=.005+.70*r*Math.sin(a);
          if(k)c.lineTo(xx,yy);else c.moveTo(xx,yy);
        }c.strokeStyle=honey;c.lineWidth=.069;c.stroke();
      }
      for(const [x,col] of [[.40,teal],[.82,coral]]){round(c,x,.202,.15,ivory);round(c,x,.20,.108,col);round(c,x,.197,.030,navy);}
    }else{
      rect(-1.35,-.53,2.70,1.05,zinc);rect(-1.26,-.432,2.52,.861,"#778a7e");
      for(const x of [-.85,0,.85])for(const y of [-.20,.18]){
        c.beginPath();c.ellipse(x,y,.33,.146,.04,0,tau);c.fillStyle=honey;c.fill();
        for(const j of [-1,0,1])stroke(c,[[x+j*.089-.013,y-.048],[x+j*.089+.025,y+.044]],.024,ivory);
      }
      rect(-1.21,.34,.53,.202,teal);rect(-1.11,.34,.034,.202,canvas);rect(-.81,.34,.034,.202,canvas);
    }
    if(phase!=="quiet"){
      let peak=0,source=0;
      for(let i=0;i<3;i++){
        const v=warmth(levels,i),x=i-1;if(v>=peak){peak=v;source=x;}
        if(phase==="cool"||v<.65)rect(x-.22,.23,.38,.21,"#64594e");
        if(phase==="call"&&v>.035){
          const k=.15+.18*v;
          for(let j=0;j<3;j++){
            const turn=t*4+j*2.3+i;round(c,x+.096*Math.cos(turn),.26+.086*Math.sin(turn),k*(.83+.16*Math.sin(turn*1.31)),j===1?"#f4a344":"#d26c40");
          }
          round(c,x+.027*Math.sin(t*6+i),.26,k*.51,"#ffdb7b");
        }
      }
      const cool=phase==="cool"||peak<.035;
      for(let i=0;i<(phase==="marked"?0:cool?3:5);i++){
        const f=((t*(cool?.55:.34)+i*(cool?.333:.20))%1+1)%1;
        const x=cool?(i-1)*.74+f*.25:source*.55+f*f*1.6;
        const y=.14-f*(cool?.68:1.28)-.11*Math.sin(f*8);
        c.globalAlpha=(cool?.38:.61)*Math.sin(Math.PI*f);round(c,x,y,(cool?.11:.17)+f*(cool?.19:.39),cool?"#d8dfd2":"#626962");
      }
    }
    c.restore();
  }
  const readPoint=p=>Array.isArray(p)?p:[p.x,p.y??.12,p.z];
  function linePoints(from,to,t,jet){
    const a=readPoint(from),b=readPoint(to),dx=b[0]-a[0],dz=b[2]-a[2],flat=Math.hypot(dx,dz),d=Math.hypot(flat,b[1]-a[1]);
    if(!Number.isFinite(d)||d<.04)return [];
    const sideX=flat?dz/flat:0,sideZ=flat?-dx/flat:0,count=jet?4:8,points=[];
    for(let i=0;i<=count;i++){
      const u=i/count,w=Math.sin(Math.PI*u),arc=jet?Math.min(.29,d*.03):0;
      const shoulder=jet?.015*Math.sin(t*12+u*8):Math.sin(u*2.16*Math.PI+.44)*Math.min(1.1,flat*.11);
      let y=a[1]+(b[1]-a[1])*u+arc*w;
      if(!jet)y=Math.min(y,.14+Math.max(a[1]-.14,0)*(1-u)**9+Math.max(b[1]-.14,0)*u**7);
      points.push([a[0]+dx*u+sideX*shoulder*w,y,a[2]+dz*u+sideZ*shoulder*w]);
    }
    return points;
  }
  function strand(g,jet,length){
    if(!jet){g.pole([0,0,0],[0,0,length],.045,"#a78656",6);return;}
    const last=length-.025;g.pole([0,0,0],[0,0,length],.045,"#a4c8c1",6);
    g.pole([.013,.031,.009],[.015,.044,last],.018,"#e2ebcc",4);
    g.pole([-.022,.008,length*.32],[-.045,.019,length*.89],.020,"#badbd0",4);
  }
  function spray(g){
    for(let i=0;i<10;i++){
      const a=i*2.4,r=.13+.046*(i%4),h=.06+.073*((i+1)%4);
      const tip=[r*Math.cos(a),h,r*Math.sin(a)],end=[tip[0]*1.13,h-.054,tip[2]*1.13];
      g.pole([tip[0]*.22,.012,tip[2]*.22],tip,.014,"#c3dfd6",4);g.pole(tip,end,.017,ivory,4);
    }
  }
  function drawLine(list,model,from,to,t,jet){
    const points=linePoints(from,to,t,jet);if(!points.length)return;
    for(let i=1;i<points.length;i++){
      const a=points[i-1],b=points[i],dx=b[0]-a[0],dy=b[1]-a[1],dz=b[2]-a[2],size=Math.hypot(dx,dy,dz);
      if(size<.01)continue;
      // Share short straight sections by length. At most six centimetres sit inside the next joint.
      const repeats=Math.max(1,Math.ceil(size/5)),bin=Math.ceil(size/repeats*16);
      const name="engine7/"+(jet?"jet/":"hose/")+bin;
      model(name,g=>strand(g,jet,bin/16));
      const yaw=Math.atan2(dx,dz),pitch=-Math.atan2(dy,Math.hypot(dx,dz));
      for(let j=0;j<repeats;j++){const u=j/repeats;list.push([name,a[0]+dx*u,a[1]+dy*u,a[2]+dz*u,yaw,pitch,0,jet?.18:0]);}
      if(!jet&&i===4){
        model("engine7/hose-union",g=>g.pole([0,0,-.065],[0,0,.065],.060,"#9b9c79",8));
        list.push(["engine7/hose-union",...a,yaw,pitch]);
      }
    }
    if(jet){
      model("engine7/jet-break",spray);
      const end=points[points.length-1];list.push(["engine7/jet-break",...end,t*4.1,0,0,.27]);
    }
  }
  function lineMap(c,px,py,s,from,to,t,jet){
    const points=linePoints(from,to,t,jet);if(!points.length)return;
    const path=points.map(p=>[px(p[0]),py(p[2])]);
    c.save();c.lineCap="round";c.lineJoin="round";
    stroke(c,path,Math.max(1.15,s*(jet?.115:.105)),jet?"#82aaa9":"#70664e");
    stroke(c,path,Math.max(.65,s*(jet?.06:.051)),jet?"#d4e8dc":"#cbb282");
    if(jet){const p=path[path.length-1];
      for(let i=0;i<9;i++){const f=((t*2.5+i*.317)%1+1)%1,a=i*2.39;
        c.globalAlpha=.92-f*.60;round(c,p[0]+s*(.046+f*.27)*Math.cos(a),p[1]+s*(.046+f*.27)*Math.sin(a),Math.max(.52,s*.026),"#e3e8cc");}
    }
    c.restore();
  }
  window.BayEngineSceneArt=Object.freeze({
    world,overhead,
    water:(list,model,from,to,t=0)=>drawLine(list,model,from,to,t,true),
    waterMap:(c,px,py,s,from,to,t=0)=>lineMap(c,px,py,s,from,to,t,true),
    hose:(list,model,from,to,t=0)=>drawLine(list,model,from,to,t,false),
    hoseMap:(c,px,py,s,from,to,t=0)=>lineMap(c,px,py,s,from,to,t,false)
  });
})();
