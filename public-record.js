/* Public Record, the Lot 14 campaign. Camera coordinates are relative to each set. */
(() => {
  const key="sundownBay.publicRecord.v1";
  const spots={port:{x:-149.5,z:-91},motel:{x:151,z:-25},mara:{x:153,z:-21.5},
    gate:{x:-152.55,z:-88.1},live:{x:153,z:118},print:{x:8,z:54.8}};
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
  };
  // Each insert is a physical thing in this story. All other shots use the live city.
  const scenes={
    passDalia:[
      {dur:4,shot:"fence",who:"Dalia Cruz",line:"Used to sign the ticket books right here. First leaf’s yours. They gave me the south run back."},
      {dur:4.5,art:"pass",slug:"MARLIN PIER",title:"First Crossing",who:"Dalia Cruz",line:"Look for the red awning at Marlin Pier. My sister takes the helm. I’m putting you on the line."}
    ],
    passShift:[
      {dur:4,shot:"fence",who:"Dalia Cruz",line:"You put the whole shift down. Forty of us signed this first ticket. There wasn’t room on the front."},
      {dur:4.5,art:"pass",slug:"NORTH FLOAT",title:"First Crossing",who:"Dalia Cruz",line:"Luis has the little double-ender at North Float. He saved you the line. Mind your knuckles."}
    ],
    opening:[
      {dur:4.3,shot:"portWide",slug:"PORT SOL",line:"",title:"Sundown Bay"},
      {dur:4.7,shot:"fence",who:"Dock recording · 6:12 AM",line:"First boat’s at six. Been that way since my mother ran the gate."},
      {dur:4.8,art:"notice",who:"Mara Vega",line:"Somebody put up a sale notice before breakfast. They used the back of the old timetable."},
      {dur:4.6,shot:"ocean",slug:"OCEAN DRIVE",who:"Mara Vega",line:"I rang every driver I know. You’re the only one who picked up."},
      {dur:4.8,art:"key",who:"Marlin night clerk",line:"Fourteen’s your room. The coral coupe is outside. Bring that key back on Monday."},
      {dur:4.7,shot:"mara",slug:"MARLIN MOTEL",who:"Mara Vega",line:"I’m by the curb with the camera. Come find me before somebody takes it down."}
    ],
    boarded:[
      {dur:3.8,shot:"cab",who:"Mara Vega",line:"Glove box still sticks. Here, give it a knock."},
      {dur:4.3,art:"timetable",who:"Mara Vega",line:"My dad pencilled in the extra crossing. Look at the bottom. That one was for the night shift."},
      {dur:3.6,shot:"portWide",slug:"CHAPTER ONE",title:"Last Exposure",line:""}
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
    berth:raw?.berth===1?1:0});
  class Story {
    constructor(){try{this.book=read(JSON.parse(localStorage.getItem(key)));}catch{this.book=read();}this.scene=null;this.table=null;}
    write(){try{localStorage.setItem(key,JSON.stringify(this.book));}catch{}}
    advance(stage){if(stages.indexOf(stage)>stages.indexOf(this.book.stage)){this.book.stage=stage;this.write();}}
    start(id){if(!scenes[id])return;this.scene={id,index:0,age:0};return this.beat();}
    beat(){const s=this.scene;return s?scenes[s.id][s.index]:null;}
    step(dt){if(!this.scene)return false;this.scene.age+=dt;
      if(this.scene.age<this.beat().dur)return false;
      this.scene.age-=this.beat().dur;this.scene.index++;if(!this.beat())this.scene=null;return true;}
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
