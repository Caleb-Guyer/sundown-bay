/* Mara's quarter-inch field reel. Edit positions are seconds on the original tape. */
(() => {
  const voice=BayRoomVoices;
  const site={x:156.64,z:116.60,kind:"radio-booth",name:"Room Tone · Mara at Sol FM"};
  const mara={x:156.20,z:117.64,yaw:2.69},deck={x:155.66,z:116.03};
  const lines={
    dalia:["Dalia Cruz","Six sharp. I wrote it on the back because the front was full."],
    luis:["Luis · night shift","You knew who’d missed the boat. Their lunch tins were still on the rail."],
    signed:["Ivo Vidal","This is Sol. Dalia Cruz has her six o’clock crossing back."],
    crew:["Ivo Vidal","This is Sol. The night shift has its six o’clock crossing back."],
    signoff:["Mara Vega","Aboard the Luz. Mara Vega, for Sol FM."],
    bell:["Channel watch","Two bells from the channel buoy."],punch:["Ticket window","The punch clicks twice."]
  };
  const make=(id,start,duration)=>({id,start,end:start+duration});
  const first=make("dalia",1.45,voice.length("dalia"));
  const second=make("luis",first.end+2.60,voice.length("luis"));
  const tape=[make("punch",.20,.69),first,make("bell",first.end+.66,1.10),second];
  const length=second.end+1.38,speakers=[first,second],clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function valid(cut){
    if(!cut||![cut.start,cut.end].every(Number.isFinite)||cut.start<0||cut.end>length||cut.end<=cut.start)return null;
    const who=speakers.find(s=>cut.start<=s.start+.055&&cut.end>=s.end-.055);
    if(!who||speakers.some(s=>s!==who&&cut.start<s.end&&cut.end>s.start))return null;
    return {start:cut.start,end:cut.end,who:who.id};
  }
  function position(parts,time){return parts.find(s=>s.start<=time&&time<s.end);}
  class Edit{
    constructor(){this.kind="splice";this.head=0;this.start=null;this.cut=null;this.playing=false;this.note="";}
    move(dt,dir){
      if(dir){this.playing=false;this.head=clamp(this.head+dir*dt*2.6,0,length);}
      else if(this.playing){this.head=Math.min(this.cut?.end??length,this.head+dt);if(this.head>=(this.cut?.end??length))this.playing=false;}
    }
    mark(){
      this.playing=false;
      if(this.cut){this.reset();return;}
      if(this.start===null){this.start=this.head;this.note="In point marked. Wind past the last word.";return;}
      this.cut=valid({start:this.start,end:this.head});
      if(!this.cut){this.start=null;this.note="Take one whole voice between the chalk lines. Mark a new in point.";return;}
      this.head=this.cut.start;this.note="Splice holds. H plays it back. Enter sends it to Ivo.";
    }
    listen(){if(this.playing){this.playing=false;return;}
      if(this.cut)this.head=this.cut.start;else if(this.head>=length)this.head=0;
      this.playing=true;
    }
    reset(){this.start=null;this.cut=null;this.playing=false;this.note="Leader cleared. Mark another take.";}
  }
  function program(cut,credit){
    const intro=credit==="crew"?"crew":"signed",parts=[make(intro,0,voice.length(intro))],at=parts[0].end+.26;
    for(const s of tape){const a=Math.max(cut.start,s.start),b=Math.min(cut.end,s.end);
      if(b>a)parts.push({...make(s.id,at+a-cut.start,b-a),offset:a-s.start});}
    parts.push(make("signoff",at+cut.end-cut.start+.24,voice.length("signoff")));
    return parts;
  }
  class Relay{
    constructor(){this.show=null;this.at=0;this.wait=2;this.station=false;this.clip=null;}
    step(dt,tuned,book){
      if(!tuned||!book.cut){
        if(this.station){this.show=null;this.clip=null;this.wait=2;}this.station=false;return;
      }
      this.station=true;
      if(!this.show){
        this.wait-=dt;if(this.wait>0)return;
        this.show=program(book.cut,book.credit);this.at=0;
      }else this.at+=dt;
      if(this.at>=this.show.at(-1).end){
        this.show=null;this.clip=null;this.wait=100;return true;
      }
      this.clip=position(this.show,this.at);
    }
  }
  function world(model,list){
    model("room-tone/nagra",g=>{
      g.box(0,.08,0,.64,.16,.46,"#374d4e");g.box(0,.17,0,.62,.035,.45,"#a3ac97");
      for(const x of [-.17,.17]){g.cyl(x,.20,-.035,.117,.117,.038,12,"#4d5350");g.cyl(x,.222,-.035,.043,.043,.012,8,"#b8b7a2");}
      g.box(0,.20,.148,.19,.06,.055,"#465454");g.box(.23,.205,.145,.09,.03,.066,"#b76545");
    });
    list.push(["room-tone/nagra",deck.x,1.15,deck.z,Math.PI/2]);
  }
  window.BayRoomTone={site,mara,deck,tape,lines,speakers,length,valid,position,Edit,Relay,program,world};
})();
