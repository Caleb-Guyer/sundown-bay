/* A conductor's lost punch. The crossing log fixes its last known pier when Marta posts the notice. */
(() => {
  "use strict";
  const key="sundownBay.halfMoon.v1";
  const piers={
    south:{name:"Marlin Pier",x:248,z:-129,sign:1},
    north:{name:"North Float",x:241,z:83,sign:-1}
  };
  const labels=["red tally cord","leather pouch","nickel ticket punch"];
  const prompts=["Untie the tally cord","Turn the pouch over","Lift the ticket punch"];
  const notes=[
    "A leather keeper is still on the cord. Follow the red line across the sand.",
    "The pouch has split along one seam. Something bright lies past the torn flap.",
    "One jaw still moves. Take the punch to the lost-property drawer at any Route 6 stop."
  ];
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  class Search{
    constructor(){
      let data;
      try{data=JSON.parse(localStorage.getItem(key));}catch{}
      const valid=data&&Object.hasOwn(piers,data.pier)&&Number.isInteger(data.stage)&&data.stage>=1&&data.stage<=5;
      this.stage=valid?data.stage:0;this.pier=valid?data.pier:"south";
      this.stamps=valid&&this.stage===5?BayTransit.stops.map(s=>s.id).filter(id=>Array.isArray(data.stamps)&&data.stamps.includes(id)):[];
      this.take=this.stage===5&&BayLastBoat.valid(this.pier,data.take)?data.take:null;
    }
    save(){try{localStorage.setItem(key,JSON.stringify({stage:this.stage,pier:this.pier,stamps:this.stamps,take:this.take}));}catch{}}
    keepDub(dub){
      if(this.stage!==5||dub.pier!==this.pier||!dub.done||dub.score<60)return false;
      if(!this.take||dub.score>BayLastBoat.sync(this.pier,this.take)){this.take=dub.marks.slice();this.save();}
      return true;
    }
    accept(morning){
      if(this.stage)return;
      this.pier=morning?.luis==="aboard"?"north":"south";this.stage=1;this.save();
    }
    site(i=this.stage-1){
      const p=piers[this.pier],x=p.x+[0,3.9,7.1][i],z=p.z+[0,2.8,6.2][i]*p.sign;
      return {x,z,y:BaySwimming.floor(x,z)+.32,name:labels[i]};
    }
    target(p){
      if(this.stage===4)return BayTransit.stops.reduce((best,s)=>gap(p,s)<gap(p,best)?s:best);
      if(this.stage>=1&&this.stage<=3)return {...this.site(),name:piers[this.pier].name+" · "+labels[this.stage-1]};
      return null;
    }
    action(hero,swim){
      if(this.stage<1||this.stage>3||!swim?.underwater||swim.exit)return "";
      const q=this.site();
      return gap(hero,q)<2.5&&Math.abs(hero.y-q.y)<1.65?prompts[this.stage-1]:"";
    }
    lift(hero,swim){
      if(!this.action(hero,swim))return "";
      const line=notes[this.stage-1];this.stage++;this.save();return line;
    }
    handOver(stop){
      if(this.stage!==4||!BayTransit.stops.includes(stop))return false;
      this.stage=5;this.stamps=[stop.id];this.save();return true;
    }
    arrive(stop){
      if(this.stage!==5||!BayTransit.stops.includes(stop)||this.stamps.includes(stop.id))return false;
      this.stamps.push(stop.id);this.save();return true;
    }
  }
  function letter(morning){
    if(morning?.luis==="aboard")return "Dalia held the gate for Luis. He remembers my punch riding north on top of his two tins. Saw the red cord go over when he unloaded at North Float.";
    if(morning?.luis==="ashore")return "Dalia rang the bell. Luis was still standing at Marlin Pier with his two tins. He saw my red tally cord slide off the empty loading step.";
    return "Last seen on the loading step at Marlin Pier. A deckhand found red thread caught on the ladder.";
  }
  function world(model,list,see,search,t,under){
    if(search.stage<1||search.stage>3)return;
    const buoy=search.site(0);if(!see(buoy,under?33:76))return;
    model("moon-float",g=>{
      g.box(0,0,0,.57,.29,.40,"#ed7954");g.box(0,.02,0,.14,.32,.42,"#fff0bc");
      g.pole([-.18,-.03,0],[-.18,.70,0],.032,"#463d32",5);
      g.quad([-.18,.70,0],[.28,.58,0],[.17,.43,0],[-.18,.48,0],"#d95242");
    });
    list.push(["moon-float",buoy.x,.14+.045*Math.sin(t*2),buoy.z,.43]);
    if(!under)return;
    const a=search.site(0),b=search.site(1),c=search.site(2);
    const trail="moon-cord-"+search.pier;
    model(trail,g=>{
      const mid=[(a.x+b.x)*.5+.26,(a.y+b.y)*.5-.16,(a.z+b.z)*.5];
      g.pole([a.x,-.04,a.z],[a.x,a.y,a.z],.048,"#dc7255",5);
      g.pole([a.x,a.y,a.z],mid,.078,"#df6345",5);g.pole(mid,[b.x,b.y,b.z],.075,"#d26c4d",5);
    });
    model("moon-pouch",g=>{
      g.box(0,0,0,.86,.17,.53,"#87482f");g.box(0,.096,-.14,.78,.045,.16,"#cc9364");
      g.pole([-.28,.11,.14],[-.06,.19,.34],.045,"#eed4a2",5);g.pole([.04,.12,.12],[.34,.15,.27],.04,"#eed4a2",5);
    });
    model("moon-tool",g=>{
      g.pole([-.37,.10,-.09],[.16,.10,.02],.065,"#efc676",6);
      g.pole([-.36,.10,.18],[.16,.10,.02],.063,"#d5dbce",6);
      g.pole([.16,.10,.02],[.33,.12,-.07],.063,"#e9e5c7",6);g.box(.32,.14,.055,.14,.10,.09,"#fff1bd");
    });
    list.push([trail,0,0,0,0],["moon-pouch",b.x,b.y,b.z,.55],["moon-tool",c.x,c.y,c.z,.72]);
  }
  function chart(g,search,px,py,s,visible,under){
    if(search.stage<1||search.stage>3)return;
    for(let i=0;i<(under?3:1);i++){
      const a=search.site(i),x=px(a.x),y=py(a.z);if(!visible(x,y,12*s))continue;
      g.save();g.translate(x,y);
      if(i===0&&under){const b=search.site(1);g.lineWidth=Math.max(1,.12*s);g.strokeStyle="#ec825a";g.beginPath();g.moveTo(0,0);g.lineTo(px(b.x)-x,py(b.z)-y);g.stroke();}
      g.rotate(i===2?-.52:.35);const n=Math.max(1.65,s*.42);
      g.fillStyle=["#ea7251","#aa7051","#eed296"][i];g.fillRect(-n,-n*.55,2*n,1.1*n);
      if(i===0){g.fillStyle="#fff1c9";g.fillRect(-n*.20,-n*.55,.4*n,1.1*n);}
      if(i===2){g.fillStyle="#284f50";g.fillRect(-n*.99,-n*.18,n,.36*n);}
      g.restore();
    }
  }
  function ticket(body,search){
    const paper=document.createElement("article");paper.className="moon-transfer";
    const head=document.createElement("small");head.textContent="BAY TRANSIT     /     COACH 608";
    const title=document.createElement("strong");title.textContent="Half Moon Transfer";
    const line=document.createElement("p");line.textContent="Tool recovered at "+piers[search.pier].name+" · Issued by Marta Leal";
    paper.append(head,title,line);
    for(const s of BayTransit.stops){
      const cell=document.createElement("span"),punched=search.stamps.includes(s.id);
      cell.textContent=s.short;cell.className=punched?"punched":"";cell.setAttribute("aria-label",s.short+(punched?", punched":", unpunched"));paper.append(cell);
    }
    body.append(paper);
  }
  window.BayHalfMoon={Search,piers,world,chart,ticket,letter,labels};
})();
