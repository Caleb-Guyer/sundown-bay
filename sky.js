/* Painted cloud banks. A handful of cached sprites are projected onto the sky dome. */
(() => {
  "use strict";
  const banks=[
    [-2.72,.135,.62,3],[-1.94,.07,.91,1],[-1.19,.24,.60,2],[-.75,.105,.66,0],
    [-.16,.19,.54,2],[.19,.066,.81,1],[.78,.102,.77,0],[1.62,.21,.65,3],[2.35,.11,.67,1]
  ];
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
  function cloud(variant){
    const c=document.createElement("canvas");c.width=380;c.height=112;
    const g=c.getContext("2d"),[body,edge]=silhouettes[variant];
    const wash=g.createLinearGradient(0,18,0,98);
    wash.addColorStop(0,"#ffe0b7");wash.addColorStop(.46,"#f4ccbd");
    wash.addColorStop(.8,"#dcc0c1");wash.addColorStop(1,"#c6adbb");
    g.fillStyle=wash;g.fill(new Path2D(body));
    g.fillStyle=variant===2?"#f6d5c1":"#ffe3bc";g.fill(new Path2D(edge));
    return c;
  }
  class Sky {
    constructor(canvas){this.c=canvas;this.g=null;this.sprites=null;this.last=null;}
    draw(view,cam,t){
      const {c}=this;if(!this.g){this.g=c.getContext("2d",{alpha:false});this.sprites=[0,1,2,3].map(cloud);}
      const g=this.g,w=Math.max(2,Math.round(innerWidth*.66)),h=Math.max(2,Math.round(innerHeight*.66)),f=cam.focal||1.5;
      if(this.last&&w===c.width&&h===c.height&&Math.abs(this.last.yaw-cam.yaw)<.0008&&Math.abs(this.last.pitch-cam.pitch)<.0008&&Math.abs(this.last.f-f)<.003&&t-this.last.t<.20)return;
      if(w!==c.width||h!==c.height){c.width=w;c.height=h;}
      this.last={t,yaw:cam.yaw,pitch:cam.pitch,f};
      const sy=h/innerHeight,sx=w/innerWidth,horizon=h*(.5+Math.tan(cam.pitch)*f*.5);
      const air=g.createLinearGradient(0,horizon-h*1.08,0,horizon+h*.12);
      air.addColorStop(0,"#39637f");air.addColorStop(.39,"#739eb1");air.addColorStop(.64,"#adabbb");
      air.addColorStop(.81,"#e4a99c");air.addColorStop(.93,"#ffd19d");air.addColorStop(1,"#f4d2af");
      g.fillStyle=air;g.fillRect(0,0,w,h);
      const sun=view.project(cam.x+510,cam.y+430,cam.z+746);
      if(sun){
        const x=sun.x*sx,y=sun.y*sy,r=h*.041;
        const glow=g.createRadialGradient(x,y,r*.4,x,y,r*5.2);glow.addColorStop(0,"rgba(255,230,170,.72)");
        glow.addColorStop(.32,"rgba(255,208,140,.36)");glow.addColorStop(1,"rgba(255,200,145,0)");
        g.fillStyle=glow;g.fillRect(x-r*5.2,y-r*5.2,r*10.4,r*10.4);
        g.fillStyle="#fff0bd";g.beginPath();g.arc(x,y,r,0,Math.PI*2);g.fill();
      }
      for(const [yaw,elev,size,variant] of banks){
        const a=yaw+Math.sin(t*.0026+variant)*.019,delta=Math.cos(a-cam.yaw);
        if(delta<.19)continue;
        const p=view.project(cam.x+Math.sin(a)*750,cam.y+Math.tan(elev)*750,cam.z+Math.cos(a)*750);
        if(!p)continue;
        const width=Math.min(w*1.6,h*f*.5*size/Math.max(delta,.32)),height=width*[.24,.17,.19,.21][variant];
        const left=p.x*sx-width*.5,top=p.y*sy-height*.66;
        if(left>w||left+width<0||top>h||top+height<0)continue;
        g.globalAlpha=variant===2 ? .47 : .73;g.drawImage(this.sprites[variant],left,top,width,height);
      }
      g.globalAlpha=1;
    }
  }
  window.BaySky=Sky;
})();
