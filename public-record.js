/* Public Record, the Lot 14 campaign. Camera coordinates are relative to each set. */
(() => {
  const key="sundownBay.publicRecord.v1";
  const spots={port:{x:-149.5,z:-91},motel:{x:151,z:-25},mara:{x:153,z:-21.5},
    gate:{x:-152.55,z:-88.1},live:{x:153,z:118},print:{x:8,z:54.8},reel:BayRoomTone.mara};
  const stages=["arrival","meet","ride","negative","return","filed"];
  const camera={
    portWide:["port",[-12,14,-22],[2,10,-19],[-5,3,4],1.4,76],
    fence:["gate",[6.7,2.1,4],[4.8,1.85,3.5],[-1,1.2,-1.6],1.62,23],
    ocean:["motel",[34,12,17],[27,8,12],[-9,4,-2],1.46,57],
    motel:["motel",[4.6,2.1,-6.3],[3.3,1.7,-5.8],[1.3,1.25,3.2],1.48,20],
    mara:["mara",[2.9,1.68,-2.8],[2.2,1.59,-2.6],[0,1.37,0],1.50,12],
    cab:["ride",[3.8,1.50,4.2],[2.9,1.43,3.6],[0,.94,0],1.58,18],
    van:["live",[-6,2.1,2],[-4.9,1.7,1.3],[1.3,1.58,.45],1.6,22],
    cinema:["print",[-8,3.7,-7],[-6.5,2.8,-6.2],[1,2,.1],1.58,29],
    recorder:["reel",[3.5,1.95,-3.0],[2.75,1.67,-2.35],[-.02,1.17,-.18],1.55,14],
    spool:["reel",[1.60,2.15,-.72],[1.34,1.99,-.84],[-.50,1.32,-1.50],1.65,7],
    luis:["gate",[-.35,1.71,-1.56],[-.41,1.66,-1.37],[-1.50,1.37,-.77],1.28,8],
    posted:["gate",[2.7,1.90,-1.62],[1.51,1.76,-2.18],[-1.75,1.63,-2.9],1.40,10],
  };
  // Each insert is a physical thing in this story. All other shots use the live city.
  const scenes={
    landingClinic:[
      {dur:4.8,shot:"posted",slug:"PORT SOL   /   LOT 14",title:"The Public Slip",who:"Alma Reyes · clinic bus",line:"I can give the woman in the front seat a time now. She’s been asking every Thursday."},
      {dur:6.5,art:"landingOrder",who:"Nora Abreu · port clerk",line:"The shed can change hands. The landing stays public, and the clinic crossing goes on the timetable."}
    ],
    landingShift:[
      {dur:4.8,shot:"posted",slug:"PORT SOL   /   LOT 14",title:"The Public Slip",who:"Luis Vega · night shift",line:"Hear that bell? It used to hang outside the pay office. First time I’ve liked the sound of it."},
      {dur:6.5,art:"landingOrder",who:"Nora Abreu · port clerk",line:"The landing is out of the sale. Any shift that needs Luz can call her from either pier."}
    ],
    firstCopy:[
      {dur:4.2,shot:"luis",title:"The First Copy",slug:"LOT 14   /   PORT SOL",who:"Luis Vega",line:"Give me the paper a second. I can never find a flat place to write out here."},
      {dur:6.3,art:"inscription",who:"Luis Vega",line:"Keep that side folded in. The ink comes off on your fingers."}
    ],
    reelOpen:[
      {dur:5.4,shot:"recorder",title:"Room Tone",slug:"NORTH BOARDWALK",who:"Mara Vega",line:"There was a man with two lunch tins on the first boat. I left the tape running."},
      {dur:5.5,shot:"spool",who:"Mara Vega",line:"Ivo has room for one voice. Wind to the start of a sentence. Mark it in, then mark it out after the last word."}
    ],
    passDalia:[
      {dur:4,shot:"fence",title:"First Crossing",who:"Dalia Cruz",line:"Used to sign the ticket books right here. First leaf’s yours. They gave me the south run back."},
      {dur:4.5,art:"pass",who:"Dalia Cruz",line:"Look for the red awning at Marlin Pier. My sister’s working the deck. I’m putting you on the line."}
    ],
    passShift:[
      {dur:4,shot:"fence",title:"First Crossing",who:"Dalia Cruz",line:"You put the whole shift down. Forty of us signed this first ticket. There wasn’t room on the front."},
      {dur:4.5,art:"pass",who:"Dalia Cruz",line:"Luis has the little double-ender at North Float. He saved you the line. Mind your knuckles."}
    ],
    opening:[
      {dur:4.6,watch:"wide",slug:"MARLIN PIER    /    ONE WEEK AGO",title:"Six Sharp",who:"Inez · captain of Luz",line:"Seventeen aboard, Dalia. The clinic bus meets us at North Float. There’s Luis, still running."},
      {dur:0,watch:"work",who:"Dalia Cruz · dispatcher",line:""},
      {dur:5.4,watch:"away",who:"Luis · night shift",line:""},
      {dur:3.6,art:"watchCopy",who:"Dalia Cruz",line:"That was the last page I filled in before they put the chain across."},
      {dur:4.8,art:"notice",who:"Mara Vega",line:"Somebody put up a sale notice before breakfast. They used the back of the old timetable."},
      {dur:4.6,shot:"ocean",slug:"OCEAN DRIVE    /    TODAY",title:"Sundown Bay",who:"Mara Vega",line:"I rang every driver I know. You’re the only one who picked up."},
      {dur:4.8,art:"key",who:"Marlin night clerk",line:"Fourteen’s your room. The coral coupe is outside. Bring that key back on Monday."},
      {dur:4.7,shot:"mara",slug:"MARLIN MOTEL",who:"Mara Vega",line:"I’m by the curb with the camera. Come find me before somebody takes it down."}
    ],
    boarded:[
      {dur:3.8,shot:"cab",who:"Mara Vega",line:"Glove box still sticks. Here, give it a knock."},
      {dur:4.3,art:"timetable",who:"Mara Vega",line:"My dad pencilled in the extra crossing. Look at the bottom. That one was for the night shift."},
      {dur:5.1,shot:"portWide",slug:"CHAPTER ONE",title:"Last Exposure",who:"Mara Vega",line:"Thirteen’s for me. If we pass the Luna or the big wheel, put it on my side. Fourteen’s for the pier."}
    ],
    negative:[
      {dur:3.7,art:"negative",who:"Mara Vega",line:"Got the lot number and the signature in one frame."},
      {dur:4.7,shot:"fence",who:"Mara Vega",line:"Sol FM can get it on tonight. The Luna can put it up big enough for the whole pier to read."}
    ],
    live:[
      {dur:4.4,shot:"van",who:"Sol FM · evening bulletin",line:"The notice covers the landing as well as the shed. The port office has agreed to hear the ferry crew."},
      {dur:4.6,art:"timetable",who:"Mara Vega",line:"A listener called. Said there’s writing under the tape on the old timetable. Meet me back at the gate."}
    ],
    print:[
      {dur:4.4,shot:"cinema",who:"Cine Luna · before the late show",line:"Somebody in the back row stood up. “That’s our landing. Leave it up another minute.”"},
      {dur:4.6,art:"timetable",who:"Mara Vega",line:"The projectionist saw a second line under the tape. Meet me at the gate. Bring a pencil."}
    ],
    signed:[
      {dur:4.2,art:"rubbing",who:"Mara Vega",line:"Dalia Cruz. There’s the C she puts through every six when she changes the tide sheet."},
      {dur:4.5,shot:"fence",who:"Dalia Cruz · ferry dispatcher",line:"I wrote it. You can print my name. Just print the crossing time big."},
      {dur:3.6,shot:"portWide",title:"The Six O’Clock Boat",line:"The landing stays in public use while the sale goes before the town."}
    ],
    crew:[
      {dur:4.2,art:"rubbing",who:"Mara Vega",line:"One set of initials on the sheet. Forty hands kept that boat running."},
      {dur:4.5,shot:"fence",who:"Dalia Cruz · ferry dispatcher",line:"Put down ‘Port Sol night shift.’ Soon as that horn goes, they’ll know who you mean."},
      {dur:3.6,shot:"portWide",title:"The Six O’Clock Boat",line:"The landing stays in public use while the sale goes before the town."}
    ]
  };
  const read=(raw={})=>({stage:stages.includes(raw?.stage)?raw.stage:"arrival",route:["print","live"].includes(raw?.route)?raw.route:"",
    credit:["signed","crew"].includes(raw?.credit)?raw.credit:"",intro:raw?.intro===true,
    pass:raw?.pass===true,trips:Math.max(0,Math.floor(Number(raw?.trips)||0)),clean:Math.max(0,Math.floor(Number(raw?.clean)||0)),
    berth:raw?.berth===1?1:0,cut:BayRoomTone.valid(raw?.cut),morning:BaySixSharp.read(raw?.morning),sleeve:raw?.sleeve===true,
    hearing:BayLandingOrder.read(raw?.hearing),airings:Number.isSafeInteger(raw?.airings)&&raw.airings>0?raw.airings:0});
  class Story {
    constructor(){try{this.book=read(JSON.parse(localStorage.getItem(key)));}catch{this.book=read();}this.scene=null;this.table=null;}
    write(){try{localStorage.setItem(key,JSON.stringify(this.book));}catch{}}
    advance(stage){if(stages.indexOf(stage)>stages.indexOf(this.book.stage)){this.book.stage=stage;this.write();}}
    start(id,replay=false){
      if(!scenes[id])return;this.watch=id==="opening"?new BaySixSharp.Watch():null;this.scene={id,index:0,age:0};
      if(this.watch&&!replay&&this.book.morning){this.watch.departure={...this.book.morning};this.scene.index=scenes.opening.findIndex(b=>b.art==="watchCopy");}
      return this.beat();
    }
    beat(){
      const s=this.scene;if(!s)return null;
      const delivery=s.id==="live"||s.id==="print";
      if(delivery&&this.windowPrint&&s.index===1){
        const place=BayLotNegative.locations[this.windowPrint.place];
        return {dur:5.7,art:"driverPrint",who:"Mara Vega",line:place.inscription,slug:"ON THE BACK OF FRAME 13"};
      }
      const index=delivery&&this.windowPrint&&s.index>1?s.index-1:s.index,b=scenes[s.id][index];if(!b)return null;
      if(b.watch==="away")return {...b,line:this.watch.departure.luis==="aboard"?"One’s mine. The other’s my brother’s. He’d have had crackers for supper.":"Tell my brother I’ve got his lunch. I’ll catch the next one."};
      const recorded=this.book.morning;
      if(s.id==="firstCopy"&&s.index===0&&this.negativeNumber==="14B")return {...b,line:"Look at him. My brother kept that tin so clean you could check your shave in it. Here, turn it over."};
      if(this.negativeNumber==="14B"&&s.index===0){
        if(s.id==="negative")return {...b,line:"There’s the dent. Dad dropped that tin on the gangway when I was eight."};
        if(s.id==="print")return {...b,line:"Somebody in the back row says, “Luis, you still got that thing?” His laugh carries all the way up to the booth."};
        if(s.id==="live")return {...b,line:"That’s Luis Vega on the Bay Wire cover. He packed two lunches for that crossing for twenty-three years. He’s on line one."};
      }
      if(recorded&&s.id==="boarded"&&s.index===1)return {...b,line:recorded.luis==="aboard"?
        "Dad was on the far side. The morning Dalia held the gate, Uncle Luis brought his lunch across in that blue tin.":
        "Dad worked the far side. He kept crackers in the glove box for mornings Uncle Luis missed the six."};
      if(recorded&&(s.id==="passDalia"||s.id==="passShift")&&s.index===0)return {...b,line:recorded.luis==="aboard"?
        "Eighteen that last morning. Luis counted the tins twice. I still have the carbon. Here’s the first ticket back.":
        "Seventeen that last morning. Luis was my eighteenth today. I made him come in early. Here’s your ticket."};
      return b;
    }
    step(dt,hold=false){if(!this.scene)return false;const b=this.beat();
      if(b.watch)this.watch.tick(dt,hold&&b.watch==="work");
      if(b.watch==="work"){
        if(!this.watch.departure)return false;
        this.scene.age=0;
      }else{
        this.scene.age+=dt;if(this.scene.age<b.dur)return false;this.scene.age-=b.dur;
      }
      this.scene.index++;if(!this.beat())this.scene=null;return true;}
    frame(ride){
      const beat=this.beat(),cam=camera[beat?.shot];if(!cam)return null;
      const [set,a,b,target,focal,span]=cam,at=set==="ride"?(ride||spots.motel):spots[set];
      const t=Math.min(1,this.scene.age/beat.dur),f=t*t*(3-2*t),yaw=set==="ride"?(at.yaw||0):0,c=Math.cos(yaw),s=Math.sin(yaw);
      const point=p=>({x:at.x+c*p[0]+s*p[2],y:p[1],z:at.z-s*p[0]+c*p[2]});
      const eye=point(a.map((n,i)=>n+(b[i]-n)*f)),to=point(target),dx=to.x-eye.x,dz=to.z-eye.z;
      return {...eye,yaw:Math.atan2(dx,dz),pitch:Math.atan2(to.y-eye.y,Math.hypot(dx,dz)),focal,to,span};
    }
    beginTable(){this.table={cursor:.08,bins:new Uint8Array(32),cover:0};}
    rub(dt,dir,down){
      const t=this.table;if(!t||t.cover>=.92)return;
      const old=t.cursor;t.cursor=Math.max(.02,Math.min(.98,t.cursor+dir*dt*.49));
      if(!down||old===t.cursor)return;
      const from=Math.max(0,Math.floor(Math.min(old,t.cursor)*32)-1),to=Math.min(31,Math.ceil(Math.max(old,t.cursor)*32));
      for(let i=from;i<=to;i++)t.bins[i]=1;
      t.cover=t.bins.reduce((sum,v)=>sum+v,0)/32;
    }
  }
  window.BayPublicRecord={key,spots,stages,scenes,Story};
})();
