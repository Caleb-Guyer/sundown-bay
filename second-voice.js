/* The second slide in the pavement show carries a witness's own words. */
(() => {
  "use strict";
  const key="sundownBay.secondVoice.v1";
  const accounts={
    print:[
      ["Celia and I sold tickets off the same roll.", "I punched the hole. She let the little ones through."],
      ["I painted the numbers on those slips.", "Fourteen took two coats. Look close. The one still leans."]
    ],
    live:[
      ["Beto read the tide times into a soup ladle first.", "Mum made me hold it steady while she stirred."],
      ["That bell came through our kitchen window.", "We had a perfectly good clock. Nobody looked at it."]
    ]
  };
  const endings={
    print:["He made the boat. Celia punched him a ticket out of habit.","We saw Luis on the step after the boat went. Celia put the kettle on."],
    live:["When Luis made the boat, the two tins rang all the way down the gangway.","After the bell there was just Luis, tapping that tin against his knee."]
  };
  function lines(v,credit){
    const pair=accounts[v.route][credit.witness];
    const remembersBell=credit.witness===(v.route==="print"?0:1);
    return [pair[0],remembersBell&&credit.departure!=="pier"?endings[v.route][credit.departure==="aboard"?0:1]:pair[1]];
  }
  function read(raw){
    if(!raw||![0,1].includes(raw.witness)||!["14A","14B"].includes(raw.frame))return null;
    return {witness:raw.witness,frame:raw.frame,departure:["aboard","ashore"].includes(raw.departure)?raw.departure:"pier"};
  }
  function entries(){
    let data;try{data=JSON.parse(localStorage.getItem(key));}catch{}
    return {print:read(data?.print),live:read(data?.live)};
  }
  class Credits{
    constructor(){this.at=entries();this.start={};}
    file(take,time){
      if(!take.done)return false;
      const v=take.venue,credit=read(take.credit);
      try{const all=entries();all[v.route]=credit;localStorage.setItem(key,JSON.stringify(all));this.at=all;}
      catch{return false;}
      this.start[v.route]=time;return true;
    }
    atScreen(v,copy,time){
      const c=this.at[v.route];
      if(!c||c.frame!==copy?.frame||(time-(this.start[v.route]??0))%19>=8)return null;
      return card(v,c);
    }
  }
  class Take{
    constructor(v,witness,frame,departure){
      this.venue=v;this.credit=read({witness,frame,departure});this.words=lines(v,this.credit);
      this.beat=0;this.gain=.5;this.tape=0;this.clock=0;this.needRelease=false;
    }
    get done(){return this.beat===2;}
    // A witness leans in for one line and turns to the sheet for the other.
    level(){return this.gain+((this.beat+this.credit.witness)%2?.32:-.28)+Math.sin(this.clock*5)*.035;}
    step(dt,trim,roll){
      if(this.done)return;
      this.clock+=dt;this.gain=Math.max(0,Math.min(1,this.gain+trim*dt*.6));
      if(!roll)this.needRelease=false;
      if(this.needRelease)return;
      const vu=this.level();
      if(roll&&vu>=.41&&vu<=.72)this.tape+=dt;
      else this.tape=Math.max(0,this.tape-dt*.6);
      if(this.tape>=1.65){this.beat++;this.tape=0;this.needRelease=true;}
    }
    hint(){
      if(this.done)return "F put their words on the wall  ·  E discard";
      if(this.needRelease)return "Release Space for the next line";
      return (this.level()<.41?"D raise gain":this.level()>.72?"A lower gain":"Hold Space to roll")+"  ·  E put the recorder away";
    }
  }
  const cards=new WeakMap();
  function card(v,credit){
    if(cards.has(credit))return cards.get(credit);
    const c=document.createElement("canvas");c.width=512;c.height=312;
    const g=c.getContext("2d"),print=v.route==="print";
    g.fillStyle=print?"#33272e":"#153d40";g.fillRect(0,0,512,312);
    g.fillStyle=print?"#f6dfb8":"#e8ebd0";g.fillRect(12,11,488,290);
    g.fillStyle=print?"#7f3736":"#28655f";g.font="bold 17px monospace";
    g.fillText((print?"CINE LUNA":"SOL FM  88.3")+"   /   FIELD TRANSCRIPT",31,43);
    g.fillRect(31,55,450,2);g.fillRect(31,252,450,2);
    g.fillStyle="#282d2b";g.font="italic 24px Georgia, serif";
    let y=91,line="";
    for(const word of ("“"+lines(v,credit).join(" ")+"”").split(" ")){
      const next=line?line+" "+word:word;
      if(line&&g.measureText(next).width>446){g.fillText(line,32,y);line=word;y+=31;}else line=next;
    }
    g.fillText(line,32,y);g.font="bold 20px Georgia, serif";g.fillText(v.neighbors[credit.witness],31,280);
    g.font="16px monospace";g.textAlign="right";g.fillText("LOT 14  /  "+credit.frame,480,279);
    const plate={canvas:c,revision:1};cards.set(credit,plate);return plate;
  }
  function meter(canvas,take){
    const g=canvas.getContext("2d"),w=canvas.width,h=canvas.height;
    g.fillStyle="#283735";g.fillRect(0,0,w,h);g.fillStyle="#d8cdb2";g.fillRect(5,5,w-10,h-10);
    g.fillStyle="#284d44";g.font="bold 13px monospace";g.fillText("FIELD RECORDER   /   INPUT",14,22);
    const x=14,y=33,span=w-28,vu=Math.max(0,Math.min(1,take.level()));
    g.fillStyle="#9e927b";g.fillRect(x,y,span,12);g.fillStyle="#387560";g.fillRect(x+.41*span,y,span*.31,12);
    g.fillStyle="#9f4634";g.fillRect(x+.83*span,y,span*.17,12);
    g.fillStyle="#262c29";g.fillRect(x+vu*(span-3),y-5,3,22);
    g.font="12px monospace";g.fillText("LOW",x,62);g.fillText("KEEP HERE",x+.42*span,62);g.fillText("HOT",w-39,62);
    g.fillRect(x,71,span,3);g.fillStyle="#c27a3c";g.fillRect(x,70,span*(take.done?1:take.tape/1.65),5);
  }
  function recorder(g){
    g.box(0,0,0,.13,.065,.22,"#38433f");g.box(0,.037,.018,.106,.012,.12,"#b6b193");
    g.box(0,.046,.01,.071,.01,.048,"#494b43");g.box(-.036,.046,-.066,.023,.012,.022,"#ae513a");
    g.box(.036,.038,.113,.037,.043,.08,"#90958c");
  }
  window.BaySecondVoice={key,Credits,Take,lines,meter,recorder};
})();
