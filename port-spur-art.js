/* No. 9, a short ice car and two working street crossings. Local +Z is the hood end. */
(() => {
  "use strict";
  const R=BayPortSpur,green="#416d65",deep="#264b49",gold="#d9aa58",cream="#e6debd",iron="#43494a",rubber="#343c3c",rust="#8d654f",red="#b45243";
  const mapTracks=[-.74,0,.74].map(offset=>Array.from({length:140},(_,i)=>BayDriving.world(R.pose(i-181),offset,0)));
  function movingLoad(r){
    const h=r.handling,raw=Math.min(1,h.time/3.8),u=h.station===R.east?raw:1-raw;
    const f=Math.max(0,Math.min(1,(u-.25)*2)),k=f*f*(3-2*f),lift=Math.min(1,u*4,(1-u)*4);
    return {x:r.van.x+(h.station.berth.x-r.van.x)*k,z:r.van.z+(h.station.berth.z+.42-r.van.z)*k,y:.07-1.03*k+lift*(.93+k)};
  }
  function truck(g,length,ends){
    g.box(0,.58,0,1.90,.25,length,iron);
    for(const side of [-1,1])for(const axle of ends){
      g.box(side*.96,.42,axle,.115,.26,.69,iron);g.box(side*1.015,.43,axle,.10,.19,.25,rust);
    }
    for(const dir of [-1,1]){g.box(0,.61,dir*(length*.5+.17),.25,.18,.44,rubber);g.box(0,.63,dir*(length*.5+.38),.36,.14,.17,iron);}
  }
  function engine(g){
    truck(g,5.94,[-1.83,1.83]);
    g.box(0,.81,0,2.22,.23,6.09,gold);g.box(0,.96,0,2.23,.08,6.16,deep);
    g.box(0,1.54,1.04,1.39,1.12,3.25,green);g.box(0,2.135,1.01,1.47,.10,3.34,deep);
    g.box(0,1.40,-1.36,2.02,.86,1.81,green);
    for(const x of [-.96,.96])for(const z of [-2.19,-.53])g.box(x,2.24,z,.096,.88,.11,deep);
    g.box(0,2.67,-1.36,2.02,.15,1.84,green);g.box(0,2.80,-1.37,2.27,.13,2.07,cream);
    g.box(0,1.78,-2.19,1.96,.10,.08,gold);g.box(0,1.78,-.54,1.96,.10,.08,gold);
    g.box(.43,1.22,-1.52,.55,.42,.50,rubber);g.box(-.43,1.22,-1.52,.55,.42,.50,rubber);
    g.box(0,1.60,-.69,1.75,.23,.32,deep);g.cyl(-.45,1.74,-.76,.085,.085,.07,8,cream);
    for(let i=0;i<4;i++)g.box(.20+i*.15,1.735,-.74,.07,.034,.11,i%2?gold:red);
    for(const side of [-1,1]){
      g.box(side*.704,1.82,1.12,.025,.12,3.08,gold);
      for(let j=0;j<10;j++)g.box(side*.710,1.47,.10+j*.22,.026,.38,.072,deep);
      for(const z of [-2.74,.00,1.41,2.74])g.box(side*1.035,1.29,z,.05,.66,.05,cream);
      g.pole([side*1.035,1.60,-.04],[side*1.035,1.60,2.75],.030,cream);
      for(const z of [-2.66,-2.37])g.box(side*.96,.74,z,.32,.12,.14,iron);
      // Cream number nine on both sides of the cab.
      for(const [y,z,h,d] of [[1.65,-1.32,.04,.22],[1.47,-1.32,.04,.22],[1.33,-1.32,.04,.22],[1.48,-1.20,.36,.04],[1.56,-1.44,.18,.04]])g.box(side*1.018,y,z,.025,h,d,cream);
    }
    g.cyl(.24,2.43,1.38,.105,.12,.55,8,rubber);g.cyl(.24,2.73,1.38,.14,.14,.055,8,iron);
    g.cyl(0,2.22,.25,.33,.36,.08,12,iron);
    for(const d of [-1,1]){
      const z=d<0?-2.26:2.69;g.box(0,d<0?2.49:1.92,z,.42,.19,.13,iron);
      for(const side of [-1,1])g.box(side*.102,d<0?2.49:1.92,z+d*.08,.14,.12,.04,"#ffdf95");
      for(let i=-2;i<=2;i++)g.box(i*.35,.78,d*3.052,.14,.14,.03,rubber);
    }
  }
  function van(g){
    truck(g,5.71,[-1.72,1.72]);
    g.box(0,.86,0,2.06,.30,5.69,"#8b6251");
    for(let i=0;i<21;i++)g.box(0,1.033,-2.67+i*.268,2.04,.058,.25,i%3?"#a68965":"#96795c");
    for(const z of [-2.76,2.76]){g.box(0,1.34,z,2.03,.60,.10,deep);g.box(0,1.65,z,2.10,.08,.12,gold);}
    for(const side of [-1,1])for(const z of [-2.36,-.82,.82,2.36])g.box(side*.99,1.23,z,.075,.46,.089,iron);
  }
  function load(g,ice){
    for(let j=0;j<3;j++)for(const side of [-1,1]){
      const x=side*.47,z=(j-1)*1.59;
      if(ice){
        g.box(x-.075,1.81,z+.04,.49,.33,1.12,"#c7dcda");g.box(x+.18,1.779,z-.12,.23,.28,.90,"#94bfc2");
        g.box(x+.01,1.985,z-.12,.58,.025,.09,"#e0e9d9");continue;
      }
      g.box(x,1.34,z,.83,.54,1.37,"#9d8160");g.box(x,1.63,z,.88,.06,1.40,cream);
      g.box(x,1.676,z,.75,.035,1.25,"#594e42");
      for(const end of [-1,1])g.box(x,1.36,z+end*.55,.845,.57,.066,iron);
    }
  }
  function wheel(g){
    g.pole([-.095,0,0],[.095,0,0],.345,rubber,12);g.pole([-.105,0,0],[.105,0,0],.258,"#636664",10);
    g.box(0,0,.095,.226,.062,.21,rust);
  }
  function groundTrack(g,start,end){
    for(let x=start;x<end-.001;x+=1.15){
      const b=Math.min(x+1.15,end),p=R.pose((x+b)*.5),length=(b-x)/Math.sin(p.yaw);
      if(R.crosses.every(v=>Math.abs(p.x-v)>7.0))g.box(p.x,.123,p.z,2.01,.060,.20,"#896d56",p.yaw);
      else g.box(p.x,.094,p.z,2.44,.10,length+.015,"#7c7666",p.yaw);
      for(const q of [-.74,.74]){
        const offX=Math.cos(p.yaw)*q,offZ=-Math.sin(p.yaw)*q;
        g.box(p.x+offX,.169,p.z+offZ,.088,.076,length+.035,"#87908a",p.yaw);
      }
    }
  }
  function pole(g){
    g.cyl(0,.09,0,.23,.34,.18,8,"#8a8c7e");g.cyl(0,1.63,0,.075,.102,3.1,8,"#969e96");
    for(const side of [-1,1]){
      g.pole([-.55,2.70+side*.31,0],[.55,2.70-side*.31,0],.083,cream,4);
      g.box(side*.266,2.13,0,.43,.41,.23,rubber);g.box(side*.266,2.13,.143,.27,.24,.040,"#692e2d");
      g.box(side*.266,2.324,.09,.43,.06,.36,iron);
    }
    g.box(0,1.01,0,.39,.47,.39,green);
  }
  function arm(g){
    g.box(2.84,0,0,5.72,.135,.10,cream);for(let i=0;i<5;i++)g.box(.65+i*1.05,0,0,.43,.142,.111,red);
  }
  function board(g){
    for(const x of [-.38,.38]){g.box(x,.65,0,.07,1.30,.09,green);g.box(x,.07,0,.23,.08,.32,iron);}
    g.box(0,1.30,0,1.08,.68,.105,green);g.box(0,1.31,.059,.86,.47,.028,cream);
    for(let i=0;i<4;i++)g.box(-.052,1.44-i*.089,.081,.57-i*.065,.024,.017,deep);
    g.box(0,.80,.10,.86,.07,.28,woodColor);
  }
  const woodColor="#997953";
  function world(list,model,r,see,t){
    if(!see({x:-109,z:-132},175))return;
    for(let i=0;i<4;i++){const x=-181+i*35;if(!see({x:x+17.5,z:R.track(x)},142))continue;
      const k="belt/track"+i;model(k,g=>groundTrack(g,x,Math.min(-42,x+35)));list.push([k,0,0,0]);}
    for(const s of [R.west,R.east])if(see(s.desk,100)){
      model("belt/board",board);list.push(["belt/board",s.desk.x,.13,s.desk.z+.64,Math.PI]);
      model("belt/dock",g=>{g.box(0,.36,0,5.22,.48,1.12,"#856e56");for(let i=0;i<13;i++)g.box(-2.39+i*.40,.628,0,.375,.075,1.18,i%2?"#ac926c":"#a18a68");
        g.box(0,.57,-.59,5.2,.10,.04,gold);});
      list.push(["belt/dock",s.berth.x,0,s.berth.z+.48,0]);
      model("belt/gantry",g=>{
        for(const side of [-1,1]){
          g.box(side*2.81,1.99,.71,.14,3.86,.17,green);
          g.pole([side*2.81,2.53,.71],[side*2.81,3.80,-.88],.084,deep,4);
          g.box(side*2.81,3.92,-.70,.18,.19,3.15,green);g.box(side*2.81,3.805,-.70,.25,.055,3.16,gold);
        }g.box(0,3.97,.71,5.77,.15,.14,deep);
      });list.push(["belt/gantry",s.berth.x,0,s.berth.z+.10,0]);
      if(r.handling?.station!==s&&(s===R.west||r.marketIce)){
        model("belt/ice",m=>load(m,true));list.push(["belt/ice",s.berth.x,-.96,s.berth.z+.42,Math.PI/2]);
      }
    }
    for(const g of r.gates)if(see(g,115))for(const side of [-1,1]){
      const x=g.x+side*6.45,z=g.z-side*5.05,yaw=side>0?Math.PI:0;
      model("belt/pole",pole);model("belt/arm",arm);list.push(["belt/pole",x,.12,z,yaw]);
      list.push(["belt/arm",x,1.14,z,yaw,0,(1-g.angle)*1.44]);
      if(g.warning){const sign=Math.floor(t*2.4)%2?1:-1;model("belt/red",m=>m.box(0,0,0,.28,.24,.05,"#ff5a3f"));
        list.push(["belt/red",x-side*sign*.266,2.25,z-side*.177,yaw]);}
    }
    if(!see(r.engine,145)&&!see(r.van,145))return;
    model("belt/nine",engine);model("belt/van",van);model("belt/wheel",wheel);
    if(see(r.engine,60)){
      // Len has the far seat while the visiting engineer works the controls.
      model("belt/len",g=>{g.box(0,.44,0,.39,.49,.25,"#56757a");g.box(0,.83,.018,.206,.27,.204,"#a97b5c");
        g.box(0,.99,.018,.242,.077,.235,deep);g.box(0,.957,.145,.235,.033,.117,deep);
        for(const side of [-1,1]){g.pole([side*.20,.55,.02],[side*.23,.34,.15],.073,"#56757a");g.pole([side*.23,.34,.15],[side*.15,.42,.34],.055,"#a97b5c");}});
      const p=BayDriving.world(r.engine,r.aboard ? .44 : -.44,-1.39);list.push(["belt/len",p.x,1.25,p.z,r.engine.yaw]);
    }
    for(const [p,key,axle] of [[r.engine,"belt/nine",1.83],[r.van,"belt/van",1.72]]){
      list.push([key,p.x,.07,p.z,p.yaw]);if(!see(p,58))continue;
      for(const d of [-axle,axle])for(const side of [-.76,.76]){
        const q=BayDriving.world(p,side,d);list.push(["belt/wheel",q.x,.50,q.z,p.yaw,r.wheels]);}
    }
    model("belt/empty",m=>load(m,false));list.push(["belt/empty",r.van.x,.07,r.van.z,r.van.yaw]);
    model("belt/ice",m=>load(m,true));
    if(r.handling){
      const {x,y,z}=movingLoad(r);
      model("belt/spreader",g=>{g.box(0,2.34,0,.10,.10,4.17,gold);for(const v of [-1.61,1.61]){g.box(0,2.28,v,1.66,.09,.09,gold);
        for(const side of [-.66,.66])g.pole([side,2.25,v],[side,1.90,v],.024,iron);}});
      list.push(["belt/ice",x,y,z,r.van.yaw],["belt/spreader",x,y,z,r.van.yaw]);
    }else if(r.cargo===R.west.freight)list.push(["belt/ice",r.van.x,.07,r.van.z,r.van.yaw]);
  }
  function map(c,opt,px,py,s,visible){
    const r=opt.portSpur;if(!r||!visible(px(-111),py(-132),80*s))return;
    const detailed=opt.mode==="street";c.save();
    for(const index of detailed?[0,2]:[1]){
      c.strokeStyle=detailed?"#626f6b":"#b99769";c.lineWidth=detailed?Math.max(.8,.11*s):1.7;
      c.beginPath();const points=mapTracks[index];c.moveTo(px(points[0].x),py(points[0].z));for(let i=1;i<points.length;i++)c.lineTo(px(points[i].x),py(points[i].z));c.stroke();
    }
    if(detailed){
      for(const st of [R.west,R.east]){c.fillStyle="#a48a63";c.fillRect(px(st.berth.x-2.6),py(st.berth.z+1.07),5.22*s,1.18*s);c.fillStyle=deep;c.fillRect(px(st.desk.x-.50),py(st.desk.z+.74),s,.20*s);}
      for(const g of r.gates)for(const sign of [-1,1]){
        const x=px(g.x+sign*6.45),y=py(g.z-sign*5.05),span=Math.cos((1-g.angle)*1.44)*5.72*s;
        c.strokeStyle=cream;c.lineWidth=Math.max(1,.16*s);c.beginPath();c.moveTo(x,y);c.lineTo(x-sign*span,y);c.stroke();
        c.fillStyle=g.warning?"#e25b45":green;c.beginPath();c.arc(x,y,Math.max(2,.23*s),0,Math.PI*2);c.fill();
      }
    }
    for(const [p,onEngine] of [[r.van,false],[r.engine,true]]){
      c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw);
      const n=detailed?s:Math.max(s,1.25);c.scale(n,n);c.fillStyle=onEngine?gold:rust;c.fillRect(-1.08,-3,2.16,6);
      if(onEngine){c.fillStyle=green;c.fillRect(-.76,-2.64,1.52,3.22);c.fillStyle=cream;c.fillRect(-1.08,.55,2.16,1.88);}
      else for(const x of [-.86,.04])for(const z of [-2.36,-.73,.91]){c.fillStyle=!r.handling&&r.cargo===R.west.freight?"#bdd2cd":"#725d47";c.fillRect(x,z,.82,1.43);}
      c.restore();
    }
    if(detailed&&r.handling){
      const p=movingLoad(r);c.save();c.translate(px(p.x),py(p.z));c.rotate(r.van.yaw);c.scale(s,s);
      for(const x of [-.82,.05])for(const z of [-2.33,-.71,.90]){c.fillStyle="#c4dddb";c.fillRect(x,z,.77,1.36);}
      c.fillStyle=gold;c.fillRect(-.075,-2.14,.15,4.28);for(const z of [-1.61,1.61])c.fillRect(-.88,z,1.76,.11);c.restore();
    }
    c.restore();
  }
  window.BayPortSpurArt={world,map};
})();
