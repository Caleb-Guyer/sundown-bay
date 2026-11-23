(() => {
  'use strict';

  const cream = '#f5d6a2', wine = '#642e37';
  const theater = {x:11.84, z:44};
  const glyphs = {
    C: [[[.86,.91],[.70,1],[.20,1],[.05,.83],[.05,.16],[.22,0],[.73,0],[.90,.13]]],
    I: [[[.14,1],[.82,1]],[[.48,1],[.48,0]],[[.14,0],[.82,0]]],
    N: [[[.08,0],[.08,1],[.86,0],[.86,1]]],
    E: [[[.84,1],[.08,1],[.08,0],[.84,0]],[[.08,.51],[.69,.51]]],
    L: [[[.08,1],[.08,0],[.84,0]]],
    U: [[[.07,1],[.07,.20],[.24,0],[.69,0],[.85,.20],[.85,1]]],
    A: [[[.03,0],[.37,1],[.57,1],[.92,0]],[[.20,.41],[.74,.41]]]
  };
  const digitStrokes = [
    [[-.20,.07],[-.18,.13],[-.08,.13],[-.05,.09],[-.05,.05],[-.19,-.10],[-.04,-.10]],
    [[.02,.13],[.19,.13],[.06,-.10]]
  ];

  // Give every stroke flush ends and a little overlap where its straight runs meet.
  function stroke(g, path, width, point, color) {
    for (let i=1; i<path.length; i++) {
      const [ax,ay]=path[i-1], [bx,by]=path[i];
      const length=Math.hypot(bx-ax,by-ay);
      if (!length) continue;
      const dx=(bx-ax)*width/(2*length), dy=(by-ay)*width/(2*length);
      g.quad(point(ax-dy-dx*.36,ay+dx-dy*.36),point(ax+dy-dx*.36,ay-dx-dy*.36),
        point(bx+dy+dx*.36,by-dx+dy*.36),point(bx-dy+dx*.36,by+dx+dy*.36),color,1);
    }
  }

  function workLights(g,lit) {
    const cord=[[-11.9,5.20,7.89],[-8.4,4.91,7.94],[-4.7,4.81,7.98],
      [0,4.68,7.99],[4.9,4.86,7.97],[8.6,4.98,7.93],[11.9,5.20,7.89]];
    if (!lit) {
      for (let i=1;i<cord.length;i++) g.pole(cord[i-1],cord[i],.027,'#3b3933',4);
      for (const x of [-11.9,11.9]) g.box(x,5.18,7.83,.19,.24,.14,'#77664d');
    }
    for (let i=1;i<cord.length-1;i++) {
      const [x,y,z]=cord[i], h=y-.27;
      if (lit) {
        g.cyl(x,h-.045,z,.078,.055,.13,7,i%2?'#ffd593':'#ffe6b5');
      } else {
        g.pole([x,y,z],[x,h+.03,z],.024,'#433e37',4);
        g.cyl(x,h+.075,z,.07,.18,.12,8,'#42746b');
        g.cyl(x,h+.01,z,.17,.16,.025,8,'#c2ab77');
      }
    }
    for (const side of [-1,1]) {
      const x=side*9.9, lens=side<0?'#f6d48e':'#d0e7d3';
      if (lit) {
        g.box(x,4.33,8.23,.70,.20,.06,lens);
        for (let i=0;i<4;i++) {
          const z=8.67+i*.60, offset=side*(.05+i*.18);
          g.quad([x+offset-.22,.085,z],[x+offset+.33,.085,z+.05],
            [x+offset+.62,.085,z+.14],[x+offset-.33,.085,z+.105],side<0?'#8b7759':'#76867b',1);
        }
      } else {
        g.box(x,4.67,7.20,.28,.28,.16,'#545749');
        g.pole([x,4.69,7.2],[x,4.74,7.84],.055,'#536259',5);
        g.pole([x,4.74,7.84],[x,4.45,8.13],.047,'#666d58',5);
        g.box(x,4.35,8.13,.92,.37,.18,'#555f54');
        g.box(x,4.50,8.20,1.02,.07,.32,'#bc9050');
        for (const d of [-.19,.19]) g.box(x+d,4.33,8.27,.023,.23,.025,'#756f57');
      }
    }
  }

  const board=(u,y,q)=>[-q,y,-u];
  function marqueeLetters(paint) {
    let offset=-4.47;
    for (const c of 'CINE LUNA') {
      if (c===' ') { offset+=.51; continue; }
      for (const line of glyphs[c]) paint(line,offset,offset<-.15?'#ffe1a0':'#ffb5a4');
      offset+=1.08;
    }
  }
  function theaterSign(g,lit) {
    if (!lit) {
      g.box(-.13,4.26,0,.21,1.48,15.58,'#453947');
      g.box(-.245,4.27,0,.04,1.26,15.26,'#603d47');
      for (const end of [-1,1]) {
        g.box(-.13,3.89,end*8.05,.19,.21,1.14,'#956254');
        g.box(-.09,4.16,end*7.93,.14,.19,.71,'#956254');
      }
      return;
    }
    g.box(-.28,4.94,0,.024,.046,15.23,'#efaf85');
    g.box(-.28,3.59,0,.024,.041,15.23,'#eab38a');
    marqueeLetters((line,offset,color)=>{
      const p=(u,y)=>board(offset+u*.94,3.77+y*.94,.285);
      stroke(g,line,.105,p,color);
    });
    for (const side of [-1,1]) {
      for (let i=0;i<3;i++) {
        const inner=5.02+i*.27, outer=7.30-i*.22, y=4.06+i*.16;
        stroke(g,[[side*inner,y],[side*outer,y]],.056,(u,v)=>board(u,v,.28),'#8ed1bf');
      }
    }
    for (let i=-13;i<=13;i++) {
      const u=i*.59;
      g.quad(board(u-.04,3.37,.29),board(u+.04,3.37,.29),board(u+.04,3.45,.29),board(u-.04,3.45,.29),'#f6d297');
    }
  }

  function section(layout,z) {
    const a=layout.sections;
    for (let i=1;i<a.length;i++) {
      if (a[i][0]>=z) {
        const p=a[i-1],q=a[i], f=Math.max(0,Math.min(1,(z-p[0])/(q[0]-p[0])));
        return [p[1]+(q[1]-p[1])*f,p[2]+(q[2]-p[2])*f];
      }
    }
    return a[a.length-1].slice(1);
  }
  function deckStripe(g,layout,x,w,lo,hi,color) {
    const cuts=[lo,...layout.sections.map(p=>p[0]).filter(z=>z>lo&&z<hi),hi];
    for (let i=1;i<cuts.length;i++) {
      const z0=cuts[i-1], z1=cuts[i], y0=section(layout,z0)[1]+.020, y1=section(layout,z1)[1]+.020;
      g.quad([x-w/2,y0,z0],[x-w/2,y1,z1],[x+w/2,y1,z1],[x+w/2,y0,z0],color,1);
    }
  }
  function roundel(g,layout,side) {
    const project=(u,y,extra=0)=>{
      // The rear quarter stays with the shell when a driver opens the door.
      const z=-.84+u*side, h=.654+y, [w,deck]=section(layout,z);
      const slope=Math.min(1,Math.max(0,(h-.34)/(deck-.46)));
      const shoulder=Math.max(0,Math.min(1,(h-deck+.12)/.12));
      return [side*(w-.08+.08*slope-.065*shoulder+.012+extra),h,z];
    };
    const ring=[];
    for (let i=0;i<16;i++) {
      const theta=i*Math.PI/8;
      ring.push(project(.29*Math.cos(theta),.175*Math.sin(theta)));
    }
    for (let i=0;i<ring.length;i++) g.tri(project(0,0),ring[i],ring[(i+1)%ring.length],'#ebc98e');
    for (const line of digitStrokes) stroke(g,line,.037,(u,v)=>project(u,v*.90,.010),wine);
  }

  function rivalTrim(g,layout) {
    deckStripe(g,layout,-.26,.25,.95,2.04,cream);
    deckStripe(g,layout,-.035,.040,.95,2.04,cream);
    deckStripe(g,layout,-.26,.25,-2.05,-1.37,cream);
    deckStripe(g,layout,-.035,.040,-2.05,-1.37,cream);
    for (const side of [-1,1]) roundel(g,layout,side);
  }
  function julesTrim(g,layout) {
    for (const x of [-.35,-.22]) {
      deckStripe(g,layout,x,.070,.96,2.03,'#efc486');
      deckStripe(g,layout,x,.070,-2.03,-1.37,'#efc486');
      g.box(x,layout.glass[5]+.018,-.22,.070,.015,.79,'#e6b67c');
    }
    for (const side of [-1,1]) {
      const p=(z,y,offset)=>[side*(section(layout,z)[0]+offset),y,z];
      g.tri(p(-1.66,.69,.005),p(-1.13,.75,.005),p(-1.13,.59,.005),'#dfb77e');
    }
  }
  function hatchTrim(g,layout) {
    const roof=layout.glass[5];
    for (const z of [-.94,-.20]) {
      for (const x of [-.48,.48]) g.box(x,roof+.049,z,.16,.10,.13,'#464a45');
      g.box(0,roof+.112,z,1.37,.075,.11,'#9eaa9b');
    }
    g.cyl(.08,roof+.238,-.56,.39,.38,.20,12,'#393d3b');
    g.cyl(.08,roof+.346,-.56,.215,.215,.022,12,'#a8a597');
    g.cyl(.08,roof+.363,-.56,.12,.12,.018,8,'#5c6661');
    for (const z of [-.74,-.38]) g.box(.08,roof+.38,z,.77,.026,.062,'#bb724b');
  }
  function flashLights(g,layout) {
    const front=layout.sections[layout.sections.length-1], z=front[0]+.026, h=front[2]-.095;
    for (const side of [-1,1]) {
      const x=side*(front[1]-.24);
      g.box(x,h,z,.29,.086,.038,'#fff1ba');
      g.box(x,h,z+.025,.40,.024,.009,'#ffe5a0');
      for (let i=0;i<3;i++) {
        const zz=2.5+i*.62, xx=x+side*i*.11;
        g.quad([xx-.11,.061,zz],[xx+.12,.061,zz-.06],[xx+.23,.061,zz+.24],[xx-.17,.061,zz+.30],i<2?'#c2ad78':'#9a8d6d',1);
      }
    }
  }
  function finishChalk(g) {
    for (const side of [-1,1]) for (let i=0;i<3;i++) {
      const x=side*(4.60+i*.54), z=i%2*.17;
      g.quad([x-.19,.060,z-.15],[x-.22,.060,z+.11],[x+.19,.060,z+.15],[x+.23,.060,z-.12],'#cebd9c',1);
    }
  }

  function install(model) {
    const coupe=window.bayCarLayout('coupe'), hatch=window.bayCarLayout('hatch');
    model('meet-shop',g=>workLights(g,false));
    model('meet-shop-lights',g=>workLights(g,true));
    model('meet-theater',g=>theaterSign(g,false));
    model('meet-theater-lights',g=>theaterSign(g,true));
    model('meet-rival',g=>rivalTrim(g,coupe));
    model('meet-jules',g=>julesTrim(g,coupe));
    model('meet-hatch',g=>hatchTrim(g,hatch));
    model('meet-flash',g=>flashLights(g,coupe));
    model('meet-chalk',finishChalk);
  }
  function flashing(meet,t) {
    if (typeof meet.flash==='function') return meet.flash(t);
    const beat=t%6;
    return meet.phase==='idle' && (beat<.15 || (beat>.34 && beat<.51));
  }
  function drawWorld(list,meet,t,see,groundAt) {
    if (!meet || meet.phase==='sleep') return;
    if (meet.shop && see(meet.shop,90)) {
      list.push(['meet-shop',meet.shop.x,0,meet.shop.z,0],['meet-shop-lights',meet.shop.x,0,meet.shop.z,0,0,0,.94]);
    }
    if (see(theater,105)) {
      list.push(['meet-theater',theater.x,0,theater.z,0],['meet-theater-lights',theater.x,0,theater.z,0,0,0,.99]);
    }
    if (meet.finish && meet.phase!=='idle' && see(meet.finish,74)) list.push(['meet-chalk',meet.finish.x,0,meet.finish.z,0]);
    const trim=(v,name,isRival)=>{
      if (!v || !see(v,78)) return;
      const y=(groundAt?groundAt(v.x,v.z):.040)+.008;
      const yaw=v.yaw||0, pitch=v.pitch||0, lean=v.lean||0;
      list.push([name,v.x,y,v.z,yaw,pitch,lean]);
      if (isRival && flashing(meet,t)) list.push(['meet-flash',v.x,y,v.z,yaw,pitch,lean,.99]);
    };
    trim(meet.rival,'meet-rival',true);
    trim(meet.jules,'meet-jules',false);
    trim(meet.third,'meet-hatch',false);
  }

  function pool(c,x,y,r,core,edge) {
    const fill=c.createRadialGradient(x,y,0,x,y,r);
    fill.addColorStop(0,core); fill.addColorStop(1,edge);
    c.fillStyle=fill; c.beginPath(); c.arc(x,y,r,0,Math.PI*2); c.fill();
  }
  function drawMap(c,opt,px,py,s,ui,visible) {
    const meet=opt.meet;
    if (!meet || meet.phase==='sleep' || opt.mode!=='street') return;
    const inView=(p,margin)=>p&&visible(px(p.x),py(p.z),margin*s);
    const local=(p,yaw,draw)=>{
      c.save(); c.translate(px(p.x),py(p.z)); c.rotate(yaw); c.scale(s,-s); draw(); c.restore();
    };
    if (inView(meet.shop,17)) local(meet.shop,0,()=>{
      for (const side of [-1,1]) {
        const x=side*9.9;
        pool(c,x,9.9,4.2,side<0?'rgba(255,203,127,.21)':'rgba(178,230,213,.19)','rgba(249,215,150,0)');
        c.fillStyle=side<0?'#ffdd9a':'#d7e9d2'; c.fillRect(x-.40,8.15,.80,.13);
      }
      c.strokeStyle='#655b49'; c.lineWidth=.06; c.beginPath(); c.moveTo(-11.9,7.88); c.quadraticCurveTo(0,8.32,11.9,7.88); c.stroke();
      for (const x of [-8.4,-4.7,0,4.9,8.6]) {c.fillStyle='#ffe0a7'; c.beginPath(); c.arc(x,8,.115,0,Math.PI*2); c.fill();}
    });
    if (inView(theater,12)) local(theater,0,()=>{
      pool(c,-.55,0,6.0,'rgba(236,161,131,.13)','rgba(236,161,131,0)');
      c.fillStyle='#694b53'; c.fillRect(-.46,-7.75,2.37,15.50);
      c.fillStyle='#ffd4a2'; c.fillRect(-.46,-7.65,.09,15.30);
      for (let i=-11;i<=11;i++) c.fillRect(-.55,i*.64,.10,.17);
      c.lineWidth=.15; c.lineCap='round'; c.lineJoin='round';
      marqueeLetters((path,offset,color)=>{
        c.strokeStyle=color; c.beginPath();
        const mapX=y=>.08+y*1.45, mapZ=u=>-(offset+u*.94)*1.38;
        c.moveTo(mapX(path[0][1]),mapZ(path[0][0]));
        for (let i=1;i<path.length;i++) c.lineTo(mapX(path[i][1]),mapZ(path[i][0]));
        c.stroke();
      });
    });
    if (meet.finish && meet.phase!=='idle' && inView(meet.finish,9)) local(meet.finish,0,()=>{
      c.fillStyle='#c7b897';
      for (const side of [-1,1]) for (let i=0;i<3;i++) c.fillRect(side*(4.6+i*.54)-.21,i%2*.17-.13,.42,.26);
    });
    const detail=(v,kind)=>{
      if (!inView(v,8)) return;
      local(v,v.yaw||0,()=>{
        if (kind==='hatch') {
          c.fillStyle='#a2aaa0'; for (const z of [-.94,-.20]) c.fillRect(-.69,z-.05,1.38,.10);
          c.fillStyle='#393e3a'; c.beginPath(); c.arc(.08,-.56,.39,0,Math.PI*2); c.fill();
          c.fillStyle='#b1a98e'; c.beginPath(); c.arc(.08,-.56,.20,0,Math.PI*2); c.fill();
          c.fillStyle='#c17f54'; for (const z of [-.74,-.38]) c.fillRect(-.29,z-.025,.74,.05);
        } else if (kind==='jules') {
          c.fillStyle='#f0c385';
          for (const x of [-.35,-.22]) for (const [z,l] of [[.96,1.05],[-.60,.80],[-2.02,.67]]) c.fillRect(x-.035,z,.07,l);
        } else {
          c.fillStyle=cream;
          for (const [z,h] of [[.96,1.07],[-2.03,.67]]) {c.fillRect(-.38,z,.24,h); c.fillRect(-.055,z,.042,h);}
          if (flashing(meet,opt.time||0)) for (const side of [-1,1]) {
            const x=side*.50, beam=c.createLinearGradient(0,2.1,0,8.1);
            beam.addColorStop(0,'rgba(255,232,166,.44)'); beam.addColorStop(1,'rgba(255,225,155,0)');
            c.fillStyle=beam; c.beginPath(); c.moveTo(x-.14,2.1); c.lineTo(x+.14,2.1); c.lineTo(x+1.0,8.1); c.lineTo(x-1.0,8.1); c.closePath(); c.fill();
            c.fillStyle='#fff0b6'; c.fillRect(x-.18,2.05,.36,.11);
          }
        }
      });
    };
    detail(meet.rival,'rival'); detail(meet.jules,'jules'); detail(meet.third,'hatch');
  }
  window.BayMeetArt={install,drawWorld,drawMap};
})();
