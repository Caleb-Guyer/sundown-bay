/* Painted cloud banks. A handful of cached sprites are projected onto the sky dome. */
(() => {
  "use strict";
  const banks=[
    [-2.72,.135,.62,3],[-1.94,.07,.91,1],[-1.19,.24,.60,2],[-.75,.105,.66,0],
    [-.16,.19,.54,2],[.19,.066,.81,1],[.78,.102,.77,0],[1.62,.21,.65,3],[2.35,.11,.67,1]
  ];
  const horizonBands=[
    [0,"#39637f","#17273f"],[.39,"#739eb1","#2b3c59"],[.64,"#adabbb","#514e6c"],
    [.81,"#e4a99c","#766078"],[.93,"#ffd19d","#af7379"],[1,"#f4d2af","#997078"]
  ];
  // Fixed bearings keep the first evening stars behind the same rooflines as the player turns.
  const stars=[
    [-2.96,.49,.72],[-2.81,.41,.54],[-2.53,.33,1.06],[-2.31,.57,.65],[-2.16,.74,.78],
    [-1.97,.37,.62],[-1.72,.45,.74],[-1.66,.49,.54],[-1.49,.24,.89],[-1.32,.59,.65],
    [-.91,.78,.91],[-.81,.36,.67],[-.69,.27,.84],[-.55,.32,.58],[-.21,.46,.69],
    [.07,.71,.56],[.17,.38,.84],[.46,.61,.66],[.73,.29,.87],[.96,.40,.55],
    [1.12,.63,.75],[1.42,.34,.59],[1.47,.39,.70],[1.52,.44,.62],[1.90,.25,.81],
    [2.17,.71,.65],[2.40,.39,.81],[2.62,.62,.58],[2.89,.29,.72]
  ].map(([bearing,elevation,size])=>({x:750*Math.sin(bearing),y:750*Math.tan(elevation),z:750*Math.cos(bearing),size}));
  function skyColor(day,night,weight){
    if(weight<=0)return day;if(weight>=1)return night;
    const a=parseInt(day.slice(1),16),b=parseInt(night.slice(1),16);
    const channel=shift=>Math.round(((a>>shift)&255)*(1-weight)+((b>>shift)&255)*weight);
    return "rgb("+channel(16)+","+channel(8)+","+channel(0)+")";
  }
  const colour=hex=>[parseInt(hex.slice(1,3),16),parseInt(hex.slice(3,5),16),parseInt(hex.slice(5,7),16)];
  // The beach faces east. Dawn starts pale aqua above the water; sunset burns back over town.
  const skies=[
    [0,    ["#0a1930","#162a45","#283b56","#39495c","#485868","#435463"]],
    [265,  ["#111e39","#1c3250","#364968","#465777","#5b6980","#5c7080"]],
    [337,  ["#234561","#47697d","#80919b","#afaba4","#d8b597","#b6b7a6"]],
    [390,  ["#37637c","#6aa2ae","#a2c7c4","#e2c7ad","#ffcf9d","#e4ceb0"]],
    [500,  ["#32759c","#6aa6bd","#a2cbd0","#bcddd5","#d8e4cb","#c8ddd0"]],
    [753,  ["#24689b","#4d92bb","#80b6cb","#a9d0d1","#d2dfcd","#c5d7c9"]],
    [944,  ["#356c94","#699ab4","#a0bbc4","#c6c8be","#ecd8b7","#dfcdb5"]],
    [1053, ["#4a6387","#828eab","#bc9cad","#e9aa98","#ffcf9f","#edb99f"]],
    [1110, ["#344a71","#676888","#a17d92","#dd9392","#ffc288","#dda58c"]],
    [1160, ["#1e3659","#384e71","#625e7c","#8c7189","#b38a8c","#987b84"]],
    [1210, ["#112443","#213852","#384d66","#545b71","#71677b","#615e73"]],
    [1300, ["#0c1c34","#1c304a","#2c4058","#3d4c63","#4f5a6e","#495767"]],
    [1440, ["#0a1930","#162a45","#283b56","#39495c","#485868","#435463"]]
  ].map(([minute,bands])=>[minute,bands.map(colour)]);
  const stormLight=["#314751","#495e6a","#6b7d85","#8b9697","#acb0a8","#a0aba8"].map(colour);
  const stormDark=["#0c1929","#16283a","#26394a","#394858","#4d5965","#455562"].map(colour);
  function clockSky(minute,night,forced,rain){
    const end=skies.findIndex((row,i)=>i&&row[0]>=minute);
    const [startT,start]=skies[Math.max(0,end-1)],[endT,finish]=skies[end<1?1:end];
    let weight=(minute-startT)/(endT-startT);weight=weight*weight*(3-2*weight);
    return start.map((color,i)=>{
      const channels=color.map((v,j)=>{
        let base=v+(finish[i][j]-v)*weight;
        base+=(skies[9][1][i][j]-base)*forced;
        const overcast=stormLight[i][j]+(stormDark[i][j]-stormLight[i][j])*night;
        return Math.round(base+(overcast-base)*rain*.87);
      });
      return "rgb("+channels.join(",")+")";
    });
  }
  // Tower, low shelf, high wind streaks and a broken bank. Each has its own light-facing edge.
  const silhouettes=[
    ["M4 90 Q31 83 48 84 Q60 73 79 76 Q92 47 114 54 Q110 41 126 38 Q129 24 147 22 Q167 16 177 30 Q196 28 204 49 Q222 47 233 61 Q258 57 273 71 Q302 70 316 80 Q342 79 375 85 Q342 89 293 88 Q252 96 204 90 Q170 101 113 93 Q62 98 4 90Z",
      "M82 73 Q93 48 115 55 Q110 42 128 39 Q137 16 158 24 Q169 24 176 32 Q164 27 153 29 Q137 29 135 45 Q123 45 120 59 Q100 55 82 73Z"],
    ["M0 82 Q36 79 62 80 Q78 70 101 75 Q119 63 143 68 Q164 66 174 61 Q190 55 220 63 Q243 57 266 70 Q288 71 304 73 Q331 70 355 76 L380 78 Q347 80 332 83 Q292 86 242 82 Q195 88 145 83 Q72 88 0 82Z",
      "M109 73 Q127 62 147 69 Q163 67 177 61 Q189 56 205 61 Q190 60 179 65 Q161 74 144 72 Q127 69 109 73Z"],
    ["M4 74 Q43 69 69 62 Q104 48 149 47 Q177 48 197 39 Q174 53 149 54 Q110 54 81 65 Q52 74 4 74Z M96 80 Q150 72 182 60 Q206 50 245 48 Q223 52 200 64 Q157 80 96 80Z M233 50 Q279 41 300 29 Q322 17 359 15 Q332 20 310 32 Q276 48 233 50Z",
      "M14 71 Q44 68 70 61 Q107 46 147 47 Q116 48 83 60 Q54 71 14 71Z"],
    ["M1 88 Q22 83 37 82 Q49 69 65 74 Q75 57 96 60 Q104 44 122 48 Q139 44 150 63 Q171 60 185 74 Q209 71 222 81 Q246 81 266 86 Q225 92 191 88 Q149 96 100 90 Q47 96 1 88Z M273 76 Q288 68 304 70 Q317 57 331 63 Q342 61 352 71 Q365 70 378 75 Q329 81 273 76Z",
      "M66 72 Q75 56 96 60 Q103 44 123 48 Q136 45 145 59 Q134 51 124 53 Q108 47 100 65 Q79 61 66 72Z"]
  ];
  function cloud(variant,mood){
    const c=document.createElement("canvas");c.width=380;c.height=112;
    const g=c.getContext("2d"),[body,edge]=silhouettes[variant];
    const wash=g.createLinearGradient(0,18,0,98);
    const washes={
      day:["#ffe0b7","#f4ccbd","#dcc0c1","#c6adbb","#ffe3bc"],
      blue:["#fff9e4","#e8eddf","#c8d9d7","#a4bbc5","#fffced"],
      dusk:["#ba858a","#786079","#594d67","#49475f","#d39890"],
      dark:["#526071","#354454","#293b4c","#243545","#687485"],
      rain:["#a7b1ad","#74858b","#586b75","#465b68","#bdc3b8"]
    };
    const tones=washes[mood];wash.addColorStop(0,tones[0]);wash.addColorStop(.46,tones[1]);
    wash.addColorStop(.8,tones[2]);wash.addColorStop(1,tones[3]);
    g.fillStyle=wash;g.fill(new Path2D(body));
    g.fillStyle=tones[4];g.fill(new Path2D(edge));
    return c;
  }
  class Sky {
    constructor(canvas){this.c=canvas;this.g=null;this.sprites={};this.last=null;}
    banksFor(mood){
      if(!this.sprites[mood])this.sprites[mood]=[0,1,2,3].map(i=>cloud(i,mood));
      return this.sprites[mood];
    }
    draw(view,cam,t,dusk=0,weather=null){
      dusk=Math.max(0,Math.min(1,dusk||0));
      const timed=weather&&Number.isFinite(weather.minute);
      const minute=timed?((weather.minute%1440)+1440)%1440:0,rain=timed?weather.rain||0:0;
      const night=timed?weather.night||0:dusk,forced=timed?Math.max(0,(dusk-night)/Math.max(.001,1-night)):0;
      const sceneNight=Math.max(dusk,night);
      const {c}=this;if(!this.g)this.g=c.getContext("2d",{alpha:false});
      if(!this.g)return;
      const g=this.g,w=Math.max(2,Math.round(innerWidth*.66)),h=Math.max(2,Math.round(innerHeight*.66)),f=cam.focal||1.5;
      if(this.last&&w===c.width&&h===c.height&&Math.abs(this.last.yaw-cam.yaw)<.0008&&Math.abs(this.last.pitch-cam.pitch)<.0008&&Math.abs(this.last.f-f)<.003&&Math.abs(this.last.dusk-dusk)<.02&&Math.abs(this.last.minute-minute)<.7&&Math.abs(this.last.rain-rain)<.018&&this.last.t<=t&&t-this.last.t<.20)return;
      if(w!==c.width||h!==c.height){c.width=w;c.height=h;}
      this.last={t,yaw:cam.yaw,pitch:cam.pitch,f,dusk,minute,rain};
      const sy=h/innerHeight,sx=w/innerWidth,horizon=h*(.5+Math.tan(cam.pitch)*f*.5);
      const air=g.createLinearGradient(0,horizon-h*1.08,0,horizon+h*.12);
      const colors=timed?clockSky(minute,sceneNight,forced,rain):null;
      horizonBands.forEach(([stop,day,evening],i)=>air.addColorStop(stop,colors?colors[i]:skyColor(day,evening,dusk)));
      g.fillStyle=air;g.fillRect(0,0,w,h);
      if(sceneNight>.42){
        const fade=(sceneNight-.42)/.58*(1-rain*.98),unit=Math.max(.82,h/590);
        g.fillStyle="#ede7d4";
        for(const star of stars){
          const p=view.project(cam.x+star.x,cam.y+star.y,cam.z+star.z);
          if(!p||p.x<0||p.x>innerWidth||p.y<0||p.y>innerHeight)continue;
          const r=star.size*unit;g.globalAlpha=star.size*.84*fade;
          g.fillRect(p.x*sx-r*.5,p.y*sy-r*.5,r,r);
        }
        const moon=view.project(cam.x-625,cam.y+211,cam.z+405);
        if(moon){
          const x=moon.x*sx,y=moon.y*sy,r=h*.011;
          g.globalAlpha=.86*fade;g.fillStyle="#f1deb4";g.beginPath();
          g.arc(x,y,r,-1.23,1.91);
          g.quadraticCurveTo(x+r*.75,y+r*.22,x+r*.334,y-r*.942);g.fill();
        }
        g.globalAlpha=1;
      }
      const sweep=(minute-360)/1440*Math.PI*2,elevation=Math.sin(sweep);
      const sun=timed?view.project(cam.x+Math.cos(sweep)*760,cam.y+elevation*730-16,
        cam.z+295+elevation*103):view.project(cam.x+510,cam.y+430-502*dusk,cam.z+746);
      if(sun&&sceneNight<.94&&(!timed||elevation>-.06)){
        const x=sun.x*sx,y=sun.y*sy,r=h*.041;
        g.globalAlpha=Math.min(1,(.94-sceneNight)/.24)*(1-rain*.94)*(1-forced);
        const glow=g.createRadialGradient(x,y,r*.4,x,y,r*5.2);glow.addColorStop(0,"rgba(255,230,170,.72)");
        glow.addColorStop(.32,"rgba(255,208,140,.36)");glow.addColorStop(1,"rgba(255,200,145,0)");
        g.fillStyle=glow;g.fillRect(x-r*5.2,y-r*5.2,r*10.4,r*10.4);
        g.fillStyle=skyColor("#fff0bd","#ffa481",dusk);g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();g.globalAlpha=1;
      }
      const toast=timed?Math.max(0,1-Math.min(Math.abs(minute-360),Math.abs(minute-1095))/122):1;
      const nightCloud=timed?Math.min(1,Math.max(sceneNight,forced)):dusk;
      const bank=(yaw,elev,size,variant,shower)=>{
        const a=yaw+Math.sin(t*(shower ? .009 : .0026)+variant)*(shower ? .09 : .019),delta=Math.cos(a-cam.yaw);
        if(delta<.19)return;
        const p=view.project(cam.x+Math.sin(a)*750,cam.y+Math.tan(elev)*750,cam.z+Math.cos(a)*750);
        if(!p)return;
        const width=Math.min(w*1.6,h*f*.5*size/Math.max(delta,.32)),height=width*[.24,.17,.19,.21][variant];
        const left=p.x*sx-width*.5,top=p.y*sy-height*.66;
        if(left>w||left+width<0||top>h||top+height<0)return;
        const opacity=(variant===2?.47:.73)*(shower?rain:1);
        const paint=(mood,alpha)=>{if(alpha>.025){g.globalAlpha=alpha;g.drawImage(this.banksFor(mood)[variant],left,top,width,height);}};
        if(!timed){
          paint("day",opacity*(1-dusk)/(1-opacity*dusk));paint("dusk",opacity*dusk);return;
        }
        if(shower){
          const veil=g.createLinearGradient(0,top+height*.67,0,top+height*1.55);
          veil.addColorStop(0,"rgba(84,105,118,.64)");veil.addColorStop(1,"rgba(119,142,151,0)");
          g.globalAlpha=rain*(1-night*.65)*.58;g.fillStyle=veil;g.beginPath();
          g.moveTo(left+width*.12,top+height*.68);g.lineTo(left+width*.67,top+height*.68);
          g.lineTo(left+width*.59,top+height*1.57);g.lineTo(left,top+height*1.46);g.fill();
          paint(night>.68?"dark":"rain",opacity);return;
        }
        const dayMix=(1-nightCloud)*(1-rain*.68);
        paint("blue",opacity*dayMix*(1-toast));paint("day",opacity*dayMix*toast);
        paint(timed&&night>.73?"dark":"dusk",opacity*nightCloud*(1-rain*.58));
        paint(night>.68?"dark":"rain",opacity*rain*.72);
      };
      for(const [yaw,elev,size,variant] of banks)bank(yaw,elev,size,variant,false);
      if(rain>.05)for(const yaw of [-2.9,-1.55,-.3,1.05,2.36])bank(yaw,.16,1.62,3,true);
      g.globalAlpha=1;
    }
  }
  window.BaySky=Sky;
})();
