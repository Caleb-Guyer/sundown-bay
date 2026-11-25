/* A Wall for Tonight. A borrowed slide projector and two neighbourhood audiences. */
(() => {
  "use strict";
  const key="sundownBay.pavementShows.v1";
  const venues=[
    {route:"print",x:10.15,z:41.9,dir:1,throw:5.35,name:"Cine Luna",host:"Celia Paz",neighbors:["Ofelia Paz","Tomas Gil"],styles:[3,0]},
    {route:"live",x:154.6,z:132.3,dir:-1,throw:5.45,name:"Sol FM",host:"Beto Mora",neighbors:["Nico Mora","Lola Reyes"],styles:[0,3]}
  ];
  for(const v of venues){
    v.yaw=v.dir>0?0:Math.PI;v.screen={x:v.x,z:v.z+v.dir*v.throw};
    v.stand={x:v.x-.65*v.dir,z:v.z-.85*v.dir};
  }
  function records(){let data;try{data=JSON.parse(localStorage.getItem(key));}catch{}
    return {print:BayOutsideCopy.readCopy(data?.print),live:BayOutsideCopy.readCopy(data?.live)};
  }
  class Shows{
    constructor(){this.prints=records();this.began={};}
    open(v,copy,time){
      const print=BayOutsideCopy.readCopy(copy);if(!print)return false;
      try{const all=records();all[v.route]=print;localStorage.setItem(key,JSON.stringify(all));this.prints=all;}
      catch{return false;}
      this.began[v.route]=time;return true;
    }
    crowd(v,time){
      if(!this.prints[v.route])return [];
      const age=Math.max(0,time-(this.began[v.route]??(time-12)));
      return v.styles.map((style,i)=>{
        const t=Math.min(1,Math.max(0,(age-i*1.2)/3.9)),f=t*t*(3-2*t);
        const side=i?1:-1,x=v.x+v.dir*side*(1.12+(1-f)*.44);
        return {x,z:v.z+v.dir*((i?2.6:1.65)-(1-f)*3.95),yaw:v.yaw-side*.27*f,
          pose:t>0&&t<1?1+Math.floor(t*19)%4:0,style,gesture:t===1&&i===0?1:0};
      });
    }
  }
  const clamp=n=>Math.max(-1,Math.min(1,n));
  class Operator{
    constructor(v,copy){this.venue=v;this.copy=copy;this.pan=-.68*v.dir;this.focus=.72*v.dir;this.showing=false;this.age=0;this.reply=false;}
    adjust(dt,pan,focus){if(!this.showing){this.pan=clamp(this.pan+pan*.72*dt);this.focus=clamp(this.focus+focus*.74*dt);}}
    ready(){return Math.abs(this.pan)<.10&&Math.abs(this.focus)<.10;}
    hint(){
      if(this.showing)return "E leave the projector running";
      const line=[];
      if(Math.abs(this.pan)>=.10)line.push(this.pan<0?"D aim right":"A aim left");
      if(Math.abs(this.focus)>=.10)line.push(this.focus<0?"W focus farther":"S focus nearer");
      return line.length?line.join("  ·  ")+"  ·  E step away":"Space open the show  ·  E step away";
    }
  }
  function response(v,copy){
    if(copy.frame==="14B")return v.route==="print"?"That’s my bicycle tape on the handle. Luis never told me he kept it.":"Blue tin was for lunch. Green one had his dominoes. You could hear him coming.";
    return v.route==="print"?"There. That number under the red paint. My mother still has the key to that slip.":"Hold it there. Fourteen. I told the listeners forty when the wind caught my page.";
  }
  function backRow(copy){
    return ({aboard:"She held the gate for him. You remember a thing like that longer than you remember the fare.",
      ashore:"You could hear that bell three streets back. My dad used to set his watch by it.",
      pier:"Blue one was his brother’s. Look at the paint left under the hinge."})[copy.quote]||
      (copy.frame==="14B"?"He always carried both. I used to wonder about that.":"Give me a pencil. I want the date off that notice.");
  }
  const cache=new WeakMap();
  function sheet(copy,pan=0,focus=0){
    if(!copy)return null;
    let p=cache.get(copy);
    if(!p){
      const img=BayLotNegative.photo(copy);if(!img?.naturalWidth)return null;
      const canvas=(w,h)=>{const c=document.createElement("canvas");c.width=w;c.height=h;return c;};
      const slide=canvas(480,288),g=slide.getContext("2d");
      g.fillStyle="#28242a";g.fillRect(0,0,480,288);
      g.drawImage(img,...BayOutsideCopy.crop(img.naturalWidth,img.naturalHeight,copy),4,4,472,252);
      g.fillStyle="#ffebbb";g.font="bold 14px monospace";g.fillText(copy.frame,9,278);
      g.font="16px Georgia";g.fillText(copy.quote?"“"+BayLotNegative.quotes[copy.quote]+"”":BayLotNegative.captions[copy.frame],50,278,421);
      p={slide,canvas:canvas(512,312),soft:canvas(1,1),stamp:"",revision:0};cache.set(copy,p);
    }
    const offset=Math.round(pan*45),blur=Math.min(7,Math.round(Math.abs(focus)*8)),stamp=offset+"/"+blur;
    if(p.stamp===stamp)return p;
    p.stamp=stamp;p.revision++;
    const g=p.canvas.getContext("2d");g.fillStyle="#988e76";g.fillRect(0,0,512,312);
    let plate=p.slide;
    if(blur){
      const w=[480,240,144,96,64,48,32,20][blur],h=Math.round(w*.6);
      if(p.soft.width!==w){p.soft.width=w;p.soft.height=h;}
      p.soft.getContext("2d").drawImage(p.slide,0,0,w,h);plate=p.soft;
    }
    g.drawImage(plate,16+offset*2,12,480,288);
    // Red tape marks where the corners of a correctly seated slide fall.
    g.strokeStyle="#9e3f30";g.lineWidth=3;
    for(const [x,dir] of [[15,-1],[497,1]])for(const [y,dy] of [[11,-1],[301,1]]){
      g.beginPath();g.moveTo(x+dir*9,y);g.lineTo(x,y);g.lineTo(x,y+dy*8);g.stroke();
    }
    return p;
  }
  function stand(g){
    g.box(0,2.05,0,3.80,2.36,.09,"#454844");g.box(0,2.05,-.054,3.66,2.23,.026,"#b2a992");
    for(const x of [-1.65,1.65]){
      g.box(x,.47,0,.065,.94,.071,"#697168");g.box(x,.04,0,.18,.08,.80,"#535850");
    }
    g.box(0,3.26,0,3.93,.09,.14,"#8c8876");
  }
  function face(g){
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])g.vertices.push(u?1.815:-1.815,v?.945:3.155,-.073,u,v,0);
  }
  function cart(g){
    g.box(0,.72,0,.72,.09,.79,"#8f674c");
    for(const x of [-.28,.28])for(const z of [-.31,.31]){
      g.box(x,.38,z,.055,.66,.055,"#64716b");g.box(x,.09,z,.105,.17,.12,"#454541");
    }
    g.box(0,.89,0,.50,.24,.48,"#6a837b");g.box(.06,1.05,.01,.37,.10,.39,"#d5c9aa");
    for(let i=0;i<5;i++)g.box(-.20,.94,-.16+i*.07,.055,.088,.025,"#424d49");
    g.box(.08,.95,.27,.21,.18,.16,"#393c3d");g.box(.08,.95,.355,.14,.11,.013,"#ffe1a0");
    g.cyl(-.09,1.12,-.03,.13,.13,.04,12,"#766c61");
    g.box(0,.30,.04,.51,.05,.53,"#a68561");g.box(.02,.39,.04,.39,.13,.33,"#8c513d");
  }
  function map(g,x,y,s,v,print){
    g.save();g.translate(x,y);g.rotate(v.yaw);g.scale(s,s);
    if(print){
      g.fillStyle="rgba(255,220,145,.18)";g.beginPath();g.moveTo(.08,-.35);
      g.lineTo(-1.81,-v.throw);g.lineTo(1.81,-v.throw);g.closePath();g.fill();
    }
    g.fillStyle="#694e3c";g.fillRect(-.40,-.42,.80,.84);g.fillStyle="#7e9385";g.fillRect(-.26,-.28,.53,.54);
    g.fillStyle="#4f524a";g.fillRect(-.22,-.21,.17,.22);g.fillStyle=print?"#ffe8a7":"#9d9781";g.fillRect(.02,-.38,.14,.15);
    g.translate(0,-v.throw);g.fillStyle="#58574c";g.fillRect(-1.92,-.99,3.84,1.18);
    g.fillStyle="#b3a98e";g.fillRect(-1.83,-.92,3.66,.99);
    if(print)g.drawImage(print.canvas,-1.83,-.92,3.66,.99);
    g.restore();
  }
  function monitor(canvas,slide){
    const g=canvas.getContext("2d"),h=canvas.height*.29,w=h*512/312,x=(canvas.width-w)/2,y=canvas.height*.03;
    g.fillStyle="#343832";g.fillRect(x-2,y-2,w+4,h+4);g.drawImage(slide,x,y,w,h);
  }
  window.BayPavementShow={key,venues,Shows,Operator,response,backRow,sheet,stand,face,cart,map,monitor};
})();
