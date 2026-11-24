/* Neighbors remember introductions by face and bad passes by the particular car. */
(() => {
  "use strict";
  const locals=[
    {id:"meli",name:"Meli Funes",place:"Low Tide Exchange",hello:"You're in the corner of about six of my shots. I'm Meli.",again:"There you are. Come round the other side if you want to stay out of frame.",tip:"Cora's on the sand side. See the striped awning? She'll give you a polo if you'll sit for a picture.",back:"Cora showed you the rack? That number thirteen jacket used to belong to my cousin."},
    {id:"marisol",name:"Marisol",place:"Coast Camera & Cycle",hello:"Keep walking with me a second. If I stop, my watch thinks the lap's over.",again:"I know that face. You caught me on the easy lap.",tip:"Inés keeps two bikes by the film counter. Look for the yellow scooter on Ocean.",back:"You found Inés. Ask her who put the very first scratch on that scooter. Actually, don't."},
    {id:"eli",name:"Eli",place:"Coast Wheel ticket window",hello:"Come stand here. You can see clear through the wheel when the cars line up.",again:"Back again? I've still got the same sandwich.",tip:"Mags works the little window under the wheel. One trip up and you can see where the two currents meet.",back:"You saw Mags. She tell you the wheel squeaks in the same spot every turn?"},
    {id:"nell",name:"Nell Soto",place:"Salt Creek Ice Landing",hello:"Wave with your empty hand. Folks here see a raised box and think you need a lift.",again:"Good, a familiar face. My arms are too short for all this ice.",tip:"Leda's ice counter is down at the bridge. The old brass bell still rings when a boat calls.",back:"That brass bell's louder up close, isn't it? I used to hear it through my bedroom screen."},
    {id:"ren",name:"Ren",place:"El Mercado film ledge",hello:"If anybody asks where the boxes went, I'm on my break.",again:"Hey. Walk on this side. The casters on that cart pull left.",tip:"Teo films skaters by the loading ledge. His spare board's there if you fancy a run.",back:"You found the ledge. Teo owes me for a crate of oranges. Best shot he ever took, he says."},
    {id:"ada",name:"Ada Pike",place:"Sol FM fish camp",hello:"Ada. Keep your voice low a second. That last pink bird's about to lift.",again:"I've saved you the dry end of the rail.",tip:"Kit keeps a field recorder at the fish camp. Bring her a good bird call and she'll put it on the air.",back:"Kit let you see the recorder? I remember when she did the whole show on one microphone."}
  ];
  const stories=[
    {id:"bib",from:"meli",to:"marisol",name:"The missing race number",ask:"Marisol's old finish photo is on my desk, but the bib folded over. Ask what number she wore so I can run the right caption.",reply:"Forty-one. Forty was my sister. We swapped shoes at the bus stop, not bibs. Tell Meli she can print that.",thanks:"Forty-one. I've had that caption wrong since high school. Let's get it on Sol FM before my sister calls.",news:"Photo correction from Meli Funes. Marisol ran the boardwalk mile in number forty-one. Her sister wore forty. They shared a pair of shoes."},
    {id:"bell",from:"eli",to:"nell",name:"Little Dot's bell",ask:"My dad swore Little Dot used to have a school bell on deck. Nell works that boat. Ask if it's still there?",reply:"It's under the ice box. Granddad took the clapper out after it rang through a whole squall. Tell Eli I'll bring it round.",thanks:"Under the ice box! I knew it. I'll tell Ivo to put the old boat story back on the radio.",news:"From the pier, Eli and Nell have located Little Dot's old school bell. The deck crew would like the clapper to stay ashore."},
    {id:"pink",from:"ren",to:"ada",name:"The pink visitors",ask:"Pink birds slept on the market roof last night. Ada keeps the count out at the hide. Ask if they're hers?",reply:"Roseate spoonbills. Six of them. Tell Ren to look for the one white feather on the last bird's wing.",thanks:"Six! I thought the last one was a plastic bag. Leave the roof light off tonight. I'll get word to Ivo.",news:"El Mercado is leaving its roof light off for six roosting spoonbills. Ada Pike says to watch for one white wing feather."}
  ];
  const key="sundownBay.neighbors.",gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  class Block{
    constructor(walkers,places){
      this.people=[];this.places=places;this.cache=new Map();this.nextScan=0;
      for(const local of locals){
        const p=walkers.find(w=>w.name===local.name);if(!p)continue;
        p.neighbor=local;this.people.push(p);
      }
    }
    get(id){return this.cache.get(id);}
    refresh(){
      const ids=[];
      for(const lead of ["guest","frankie"]){
        for(const l of locals)for(const field of ["met","tip","visited"])ids.push([lead,l.id,field].join("."));
        for(const s of stories)ids.push(lead+"."+s.id);
      }
      for(const l of locals)ids.push(l.id+".car");
      try{for(const id of ids){const raw=localStorage.getItem(key+id);if(typeof raw==="string"&&raw.length<=180)this.cache.set(id,raw);else this.cache.delete(id);}}catch{}
    }
    put(id,value){
      if(this.cache.get(id)===value)return;
      this.cache.set(id,value);try{localStorage.setItem(key+id,value);}catch{}
    }
    known(lead,p,field){return this.get(lead+"."+p.neighbor.id+"."+field)==="1";}
    mark(lead,p,field){this.put(lead+"."+p.neighbor.id+"."+field,"1");}
    stage(lead,s){return ["1","2","3"].includes(this.get(lead+"."+s.id))?Number(this.get(lead+"."+s.id)):0;}
    byId(id){return this.people.find(p=>p.neighbor.id===id);}
    target(lead,s){const n=this.stage(lead,s);return n===1?this.byId(s.to):n===2?this.byId(s.from):null;}
    message(lead,p){
      for(const s of stories){
        const n=this.stage(lead,s),id=p.neighbor.id;
        if(n===0&&s.from===id||n===1&&s.to===id||n===2&&s.from===id)return s;
      }
      return null;
    }
    incident(p,v,type,lead){
      if(!p.neighbor||!v?.garageKey)return;
      this.put(p.neighbor.id+".car",JSON.stringify([v.garageKey,type,lead]));
    }
    slight(p,car,lead){
      const raw=this.get(p.neighbor.id+".car");if(!raw)return null;
      try{const [id,type,who]=JSON.parse(raw);return (car?id===car.garageKey:lead===who)&&["spray","pass"].includes(type)?type:null;}catch{return null;}
    }
    pose(p,kind,t,bearing,to){
      p.neighborPose={kind,age:0,at:t,bearing,duration:BayNeighborGestures.duration(kind)};
      if(p.canopy>.12||p.fieldSource==="trawler")p.neighborPose.side=-1;
      p.neighborFace=to?Math.atan2(to.x-p.x,to.z-p.z):bearing;
    }
    available(p){return !p.palmManaged&&!p.onTour&&!p.crossing?.entered&&!p.curbAim&&!p.startle&&!p.sprayPose&&!p.porch&&!p.coffeePause;}
    closest(at,r,visible){
      let pick=null,best=r;
      for(const p of this.people){const d=gap(p,at);if(d>=best||!this.available(p)||!visible(p))continue;pick=p;best=d;}
      return pick;
    }
    greet(p,lead,at,car,t){
      const l=p.neighbor,bad=this.slight(p,car,lead),known=this.known(lead,p,"met");
      this.chat={p,lead,until:t+12,bad};
      this.mark(lead,p,"met");this.pose(p,bad?"guard":"wave",t,undefined,at);
      return bad?(bad==="spray"?"I remember that gutter. Wringing salt out of a shirt isn't my idea of an afternoon.":"I remember that car. I had to jump back onto the curb."):this.known(lead,p,"visited")?l.back:known?l.again:l.hello;
    }
    answer(lead,number,t){
      const c=this.chat;if(!c||c.lead!==lead)return null;
      const p=c.p,l=p.neighbor,place=this.places[l.id];
      if(c.bad){
        if(number!==1)return null;
        this.put(l.id+".car","");c.bad=null;c.until=t+10;this.pose(p,"wave",t,p.yaw);
        return {line:"All right. Thanks for coming back to say it. Give us a little room next time."};
      }
      if(number===1){
        this.mark(lead,p,"tip");this.pose(p,"point",t,Math.atan2(place.x-p.x,place.z-p.z),place);
        this.chat=null;return {line:l.tip,pin:{...place,name:l.place,kind:"neighbor-place",id:l.id}};
      }
      const s=this.message(lead,p);if(number!==2||!s)return null;
      const n=this.stage(lead,s)+1;this.put(lead+"."+s.id,String(n));this.chat=null;
      const target=this.target(lead,s);
      this.pose(p,target?"point":"wave",t,target?Math.atan2(target.x-p.x,target.z-p.z):p.yaw,target);
      return {line:[s.ask,s.reply,s.thanks][n-1],story:s,target,news:n===3?s.news:""};
    }
    step(t,at,lead,car,free,visible){
      for(const p of this.people){
        const g=p.neighborPose;if(g){g.age=t-g.at;if(g.age>=g.duration||!this.available(p))p.neighborPose=null;}
      }
      if(this.chat&&(!free||this.chat.lead!==lead||t>this.chat.until||gap(this.chat.p,at)>(car?10:7)||!this.available(this.chat.p)))this.chat=null;
      if(t<this.nextScan)return null;this.nextScan=t+.32;
      let visited=null;
      for(const p of this.people){
        const d=gap(p,at),id=p.neighbor.id;
        if(d>27)p.neighborAway=true;
        if(free&&!car&&this.known(lead,p,"tip")&&!this.known(lead,p,"visited")&&gap(at,this.places[id])<2.55){
          this.mark(lead,p,"visited");visited=p;
        }
        if(free&&!this.chat&&p.neighborAway&&d<(car?9:5.8)&&this.known(lead,p,"met")&&this.available(p)&&visible(p)){
          p.neighborAway=false;this.pose(p,this.slight(p,car,lead)?"guard":"wave",t,undefined,at);
        }
      }
      return visited;
    }
  }
  window.BayNeighbors={Block,locals,stories,key};
})();
