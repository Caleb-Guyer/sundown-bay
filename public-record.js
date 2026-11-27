/* Public Record, the Lot 14 campaign. Camera coordinates are relative to each set. */
(() => {
  const key="sundownBay.publicRecord.v1";
  const spots={starlite:{x:84.17,z:-60.77},get palmClock(){return BayOnGreen.routes[0].post;},get receiving(){return BayPalmClinic.site.desk;},port:{x:-149.5,z:-91},motel:{x:151,z:-25},mara:{x:153,z:-21.5},
    gate:{x:-152.55,z:-88.1},live:{x:153,z:118},print:{x:8,z:54.8},reel:BayRoomTone.mara};
  const stages=["arrival","meet","ride","negative","return","filed"];
  const camera={
    cameraCounter:["ride",[-4.5,1.58,-2.45],[-3.30,1.65,-1.76],[.2,1.56,0],1.44,13],
    boothDoor:["starlite",[3.3,1.70,-4.2],[2.0,1.55,-3.5],[-.6,1.38,.1],1.52,12],
    palmBeam:["palmClock",[-3.9,1.20,-3.7],[-2.4,1.12,-2.1],[0,1.34,0],1.47,15],
    clinicDoor:["receiving",[.55,1.68,3.72],[.32,1.62,2.8],[0,1.30,-.65],1.42,13],
    portWide:["port",[-12,14,-22],[2,10,-19],[-5,3,4],1.4,76],
    fence:["gate",[6.7,2.1,4],[4.8,1.85,3.5],[-1,1.2,-1.6],1.62,23],
    laundry:["motel",[7,2,-8.8],[5.6,1.65,-8.1],[2.8,1.32,-5.6],1.49,15],
    ocean:["motel",[34,12,17],[27,8,12],[-9,4,-2],1.46,57],
    motel:["motel",[4.6,2.1,-6.3],[3.3,1.7,-5.8],[1.3,1.25,3.2],1.48,20],
    mara:["mara",[2.9,1.68,-2.8],[2.2,1.59,-2.6],[0,1.37,0],1.50,12],
    cab:["ride",[3.8,1.50,4.2],[2.9,1.43,3.6],[0,.94,0],1.58,18],
    doubleSeat:["ride",[2.75,1.53,2.90],[1.85,1.42,2.54],[.19,1.02,.07],1.56,9],
    flowerSeat:["ride",[-2.48,1.45,-.69],[-1.95,1.19,-.54],[.07,.82,.20],1.38,5.8],
    coneStack:["ride",[-1.75,1.13,-2.45],[-1.45,1.07,-1.94],[0,.79,-.16],1.48,5.3],
    countyForeman:["ride",[-2.1,1.56,2.5],[-1.64,1.52,2.08],[0,1.41,0],1.35,6.5],
    rearPlate:["ride",[2.6,1.14,-4.7],[1.05,.89,-3.7],[0,.62,-1.55],1.54,10],
    cabWindow:["ride",[3.2,1.49,-2.35],[2.05,1.32,-1.82],[.52,1.05,-.53],1.38,7],
    sugarBowl:["motel",[.10,1.72,-10.8],[1.54,1.48,-10.34],[3.60,1.00,-9.55],1.53,6.4],
    payrollDesk:["ride",[-2.65,1.62,2.8],[-1.85,1.45,2.3],[0,1.04,.64],1.54,7.8],
    pullOut:["ride",[2.1,1.7,-3.7],[.7,3.1,-6.4],[0,.94,2.1],1.48,23],
    van:["live",[-6,2.1,2],[-4.9,1.7,1.3],[1.3,1.58,.45],1.6,22],
    cinema:["print",[-8,3.7,-7],[-6.5,2.8,-6.2],[1,2,.1],1.58,29],
    lunaCurb:["print",[-11,3.8,4],[-9.7,3.4,4.6],[2.3,2.7,-7.1],1.40,32],
    recorder:["reel",[3.5,1.95,-3.0],[2.75,1.67,-2.35],[-.02,1.17,-.18],1.55,14],
    spool:["reel",[1.60,2.15,-.72],[1.34,1.99,-.84],[-.50,1.32,-1.50],1.65,7],
    luis:["gate",[-.35,1.71,-1.56],[-.41,1.66,-1.37],[-1.50,1.37,-.77],1.28,8],
    posted:["gate",[2.7,1.90,-1.62],[1.51,1.76,-2.18],[-1.75,1.63,-2.9],1.40,10],
  };
  // Each insert is a physical thing in this story. All other shots use the live city.
  const scenes={
    twoPockets:[
      {dur:4.6,shot:"cameraCounter",slug:"COAST CAMERA & CYCLE   /   OCEAN DRIVE",title:"Two Pockets",who:"Inés Vidal",line:"Remy came in to check the board. Stood here a full minute with his helmet on. I could see him doing the sums."},
      {dur:5.4,art:"twoPockets",who:"Inés Vidal",line:"He took my chalk. I said, what do you want the chalk for? He said, you’ve still got the other side of the window."}
    ],
    dashInsert:[
      {dur:8,art:"glovebox",slug:"MARA’S CAMERA NOTES   /   MARLIN MOTEL",title:"The Sticking Latch",who:"Mara Vega",line:"I left the close-up long. Watch the string when the door drops. That’s how I spotted the tag."}
    ],
    countyAlone:[
      {dur:3.8,shot:"coneStack",title:"Both Lanes Open",slug:"PALM COUNTY   /   ROADS DEPARTMENT",who:"Inez Pardo",line:"The radio said the road was open ten minutes ago. Funny. I still had three cones on the asphalt."},
      {dur:4.2,shot:"countyForeman",who:"Inez Pardo",line:"You can take the inside lane now. If you see the orange cart out here again, give me a hand with the last one."}
    ],
    lastCone:[
      {dur:3.5,shot:"coneStack",title:"The Last Cone",slug:"PALM COUNTY   /   ROADS DEPARTMENT",who:"Inez Pardo",line:"Hear that? Four bases make a different sound from three. I used to count them. Now I can hear a missing one from the cab."},
      {dur:4.7,shot:"countyForeman",who:"Inez Pardo",line:"That vest on the handle is yours. Keep it. Next time I see you in the middle of the road, I'd like to see you a little sooner."}
    ],
    unclaimedFare:[
      {dur:3.3,shot:"rearPlate",slug:"BAY CAB CO.   /   OFF THE CLOCK",title:"Keep the Meter Running",who:"Bay Cab driver",line:"She paid me in quarters. Said if the meter hit four dollars I should let her out wherever we were."},
      {dur:4.8,shot:"cabWindow",who:"Neve Armas",line:"Thirty-eight forty? That's the extra for nights. I can sign right here. Or leave it with Bea. She keeps our envelopes under the sugar bowl."}
    ],
    fareWindow:[
      {dur:3.6,shot:"cabWindow",who:"Neve Armas",line:"Leave the meter on. I'm going all the way to my door tonight."},
      {dur:4.2,art:"fareCarbon",who:"Bay Cab driver",line:"She took her quarters back. I gave her the good pen."}
    ],
    fareDesk:[
      {dur:3.2,shot:"sugarBowl",slug:"MARLIN MOTOR INN   /   NIGHT LAUNDRY",who:"Bea Serrano · note on the night desk",line:"She'll be in at eleven. First thing she does is put two sugars in her coffee."},
      {dur:4.2,art:"fareCarbon",who:"Bea Serrano",line:"There. She'll find it before I even have to tell her."}
    ],
    lunaThroughTheWall:[
      {dur:4.1,shot:"lunaCurb",title:"The Cheap Seats",slug:"CINE LUNA   /   SIDE WALL",who:"Frankie Prado",line:"First picture I can remember, I never even got inside."},
      {dur:5.9,shot:"cab",who:"Frankie Prado",line:"See that wall? The fan carried every word out to the street. My little brother did the pictures with his hands."},
      {dur:5.2,shot:"doubleSeat",who:"Frankie Prado",line:"Only shape he knew was a rabbit. When the cowboy got on his horse, it was two rabbits, one on top of the other."}
    ],
    marlinLastInning:[
      {dur:4.8,shot:"ocean",title:"The Cheap Seats",slug:"MARLIN MOTEL   /   OCEAN DRIVE",who:"Marlin driver",line:"Dad used to park right here for the last inning. Crack the window. Stretch his legs out under the dash."},
      {dur:5.7,shot:"cab",who:"Marlin driver",line:"One night the radio quit with the bases loaded. Dad called the rest himself. Three wild pitches. We won."},
      {dur:5.3,shot:"doubleSeat",who:"Marlin driver",line:"Next morning the paper said four to nothing. He folded it over and asked how I wanted my eggs."}
    ],
    visorSleeve:[
      {dur:3.2,shot:"cab",slug:"MARISOL’S STAFF WAGON",title:"Rabbit Ears",who:"Romy Vale · note under the visor",line:"Careful with the flap. Mum sealed it with the last of my school glue."},
      {dur:6.2,art:"rabbitSleeve",who:"Marisol Vale · in pencil",line:"Ada kept the little reel. Pull into our old spot at the Starlite, second speaker from the left. She’ll know the wagon."}
    ],
    lastTransfer:[
      {dur:4.5,pilot:"cast",title:"The Last Transfer",slug:"MARLIN PIER   /   FROM INEZ’S LOG",who:"Inez · captain of Luz"},
      {dur:0,pilot:"helm",who:"Inez · at the wheel"},
      {dur:14.2,pilot:"land",slug:"NORTH FLOAT",who:"Alma Reyes"},
      {dur:8,art:"transferStub",who:"Dalia Cruz"}
    ],
    printCan:[
      {dur:3.6,shot:"boothDoor",slug:"STARLITE MOTOR THEATRE   /   GANTRY STREET",title:"Before the Feature",who:"Ada Soler",line:"They ran the fire story for a week. Every paper said Dad locked that gate."},
      {dur:5.4,art:"gatePrint",who:"Romy Vale",line:"There. His hand on the key. Twelve frames and you can see the gate swing out."},
      {dur:4.6,shot:"boothDoor",who:"Ada Soler",line:"County wants their evidence can back. The Luna's got a full house. Romy, take it. I'll keep the booth light on."}
    ],
    printFirst:[
      {dur:3.5,shot:"cinema",slug:"CINE LUNA   /   FIRST SHOW",title:"Before the trailers",who:"Marisol Vale",line:"Leave the house lights down. Nobody gets up till that gate opens."},
      {dur:5.0,art:"gatePrint",who:"Ada Soler · telephone",line:"I could hear the whole room go quiet through this little phone."},
      {dur:3.7,shot:"cinema",who:"Marisol Vale",line:"Ada’s coming over. Ask for her at the program case. She wants a still for the paper."}
    ],
    printLate:[
      {dur:3.5,shot:"cinema",slug:"CINE LUNA   /   AFTER THE CREDITS",title:"Hold the house",who:"Marisol Vale",line:"The feature's over. I'll catch them before somebody turns on the cleaning lights."},
      {dur:5.0,art:"gatePrint",who:"Romy Vale",line:"Six people stayed. That woman by the aisle asked if she could bring her brother tomorrow."},
      {dur:3.7,shot:"cinema",who:"Marisol Vale",line:"We’ll leave a lamp on for Ada. Tell the booth you’re here to make her newspaper print."}
    ],
    printArchive:[
      {dur:2.8,shot:"boothDoor",slug:"ADA SOLER'S PRINT   /   STARLITE",title:"The laundry gate",who:"Ada Soler",line:"Watch his other hand. All those keys and he knew the right one by touch."},
      {dur:6.0,art:"gatePrint",who:"",line:"Marlin Steam Laundry · Soler family print, frames 183–194"}
    ],
    fridgeDoor:[
      {dur:3.8,shot:"palmBeam",slug:"OCEAN DRIVE   /   THE PALM CLOCK",title:"Room on the Fridge",who:"Lena Ríos",line:"I left your original under the glass. Here, look what Nico did with the carbon."},
      {dur:4.5,art:"timingCarbon",who:"Nico Ríos",line:"I had to move the milk list. That magnet won't hold three things."},
      {dur:5.6,art:"timingCarbon",who:"Lena Ríos",line:""},
      {dur:3.8,art:"timingCarbon",who:"Nico Ríos",line:"I know. I was the kid on the milk crate with the watch."}
    ],
    laundryOrder:[
      {dur:4.3,shot:"clinicDoor",slug:"PALM COUNTY CLINIC   /   RECEIVING",title:"The Laundry Line",who:"Ora Bell",line:"Look at the little bag people come in with. Wallet, keys, one shoe sometimes. Nobody ever packs a clean shirt."},
      {dur:6.4,art:"linenSlip",who:"Ora Bell",line:"The cab phone outside the Marlin goes straight to laundry. Two rings, hang up. That's how Romy knows it's us."},
      {dur:4.8,art:"linenSlip",who:"",line:"A shirt with a pocket, if there's one left. I've still got my house key."}
    ],
    laundryReceipt:[
      {dur:4.1,shot:"clinicDoor",slug:"PALM COUNTY CLINIC   /   NORTH WINDOW",title:"One shirt, one comb",who:"Ora Bell",line:"You can tell it's hers by the way she ties the string. Pull the little ear and it comes right off."},
      {dur:5.4,art:"linenSlip",who:"Ora Bell",line:""}
    ],
    countyLoan:[
      {dur:6.8,voice:"loanTicket",art:"relayCard",slug:"PORTSIDE TIRE   /   COUNTY BAND",title:"Say Again, Four",who:"Cleo Moss",line:"Somebody sent me one spare repeater and two work orders. That's county arithmetic."},
      {dur:7.1,voice:"lunaCheck",shot:"cab",who:"Cleo Moss",line:"Take the receiver under the Luna sign. Key it there and listen to what comes back. The market and the Marlin both want the spare."}
    ],
    countySigned:[
      {dur:6.0,voice:"covered",shot:"pullOut",slug:"PALM COUNTY   /   SIGNAL CHECK",title:"Reading you five",who:"Cleo Moss",line:""},
      {dur:5.0,voice:"driverCarbon",art:"relayCard",who:"Cleo Moss",line:"Keep the carbon. If anybody says they got there first, that's my signature."}
    ],
    flowersMotel:[
      {dur:4.4,shot:"flowerSeat",slug:"MARLIN MOTEL   /   FRONT WALK",title:"The Extra Chair",who:"Bea Salas",line:"She always sits out here to do the crossword. I'll turn the chair so she can have the morning light."},
      {dur:4.0,art:"flowerTag",who:"Bea Salas",line:"If she asks, the tin was a vase when I bought it."}
    ],
    flowersWheel:[
      {dur:4.4,shot:"flowerSeat",slug:"NORTH BOARDWALK   /   BANDSTAND",title:"The Extra Chair",who:"Bea Salas",line:"Dad always sat this close. Said from the back you could hear people asking when the music stopped."},
      {dur:4.0,art:"flowerTag",who:"Bea Salas",line:"There. Otis will know whose chair it is."}
    ],
    flowerReply:[
      {dur:2.6,shot:"flowerSeat",slug:"OLD PALMS FLOWERS",title:"The other side",who:"",line:"Somebody has turned the card over."},
      {dur:6.3,art:"flowerTag",who:"",line:""}
    ],
    lastMeter:[
      {dur:3.9,shot:"rearPlate",slug:"BAY CAB   /   DRIVER'S COPY",title:"Last Fare on the Meter",who:"Mina Ortiz",line:"I was the cab behind you. You kept looking in the mirror. You never looked as far back as me."},
      {dur:5.2,art:"meterCopy",who:"Mina Ortiz",line:"I wrote down where they left it."},
      {dur:3.6,shot:"ocean",slug:"OCEAN DRIVE   /   MARLIN MOTOR COURT",who:"Mina Ortiz",line:"Come down to the cab stand. I owe this meter one good deed."}
    ],
    carbonMorning:[
      {dur:3.8,shot:"laundry",slug:"MARLIN MOTEL   /   LAUNDRY ENTRANCE",title:"The Carbon Drawer",who:"Romy Vale",line:"Empty your pockets before I put that shirt in. Last time the whole wash came out yellow."},
      {dur:4.5,art:"releaseCopy",who:"Romy Vale",line:"Let me see what they wrote."}
    ],
    walkHomeDoor:[
      {dur:4.1,shot:"laundry",slug:"MARLIN MOTEL   /   LAUNDRY STEPS",title:"The Long Way Home",who:"Romy Vale",line:"Come under the awning a minute."},
      {dur:6.1,art:"staffKey",who:"Romy Vale",line:"My mother always carried two keys."}
    ],
    blueCarbon:[
      {dur:4,shot:"laundry",slug:"MARLIN MOTEL   /   END OF SHIFT",title:"The Blue Carbon",who:"Romy Vale",line:"Three envelopes. I borrowed Mum’s good pen. It goes through both sheets if you lean on it."},
      {dur:5.5,art:"blueCarbon",who:"Marisol Vale · through the door",line:"Tino’s downstairs fixing the dryer. Slide his under the boiler-room door. Neve can take mine upstairs."},
      {dur:4.1,shot:"laundry",who:"Romy Vale",line:"Keep the blue one. Mum kept a copy of everything. I used to give her hell about those drawers."}
    ],
    collectionOpen:[
      {dur:3.1,shot:"laundry",slug:"OCEAN DRIVE   /   LAUNDRY ENTRANCE",title:"Last Collection",who:"Romy Vale",line:"My mother folded sheets upstairs for twenty years. They paid her last Friday with a key to a room she already cleans."},
      {dur:4.5,art:"payEnvelope",who:"Romy Vale",line:"That's the pay office stamp. Jules has the missing envelopes at the motel curb. Pull up slow. He'll find the passenger door."}
    ],
    collectionRide:[
      {dur:3.4,shot:"cab",slug:"MARLIN MOTEL   /   CURBSIDE",who:"Jules",line:"I told the man I was picking up a cake. He put that whole tin in my lap and hit the alarm."},
      {dur:3.9,art:"payEnvelope",who:"Jules",line:"Port Sol will buy the tin, no questions. Or take it to the Luna. The night shift's watching a double feature. Your turn to decide."}
    ],
    collectionLuna:[
      {dur:3.7,shot:"payrollDesk",slug:"CINE LUNA   /   SIDE DOOR",title:"The Late Show",who:"Marisol Vale",line:"See the little sun over the i? That's how I signed every timesheet. Give me the stack. I know who's still owed."},
      {dur:3.6,art:"payReceipt",who:"Jules",line:"Everybody chipped in for petrol. Even the guy who only got three dollars back."}
    ],
    collectionPort:[
      {dur:3.7,shot:"payrollDesk",slug:"PORT SOL   /   LOADING BAY",title:"Cash in Hand",who:"Jules",line:"He weighed it with the lid on. Guess the names inside didn't weigh much."},
      {dur:3.6,art:"portReceipt",who:"Romy Vale · phone",line:"Tell my mum yourself. I'm walking home."}
    ],
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
      {dur:6.5,art:"glovebox",who:"Mara Vega",line:"There’s a sweet spot right under the catch. Dad could find it in the dark."},
      {dur:4.3,art:"timetable",who:"Mara Vega",line:"My dad pencilled in the extra crossing. Look at the bottom. That one was for the night shift."},
      {dur:4.5,shot:"pullOut",slug:"CHAPTER ONE",title:"Last Exposure",who:"Mara Vega",line:"Here, turn the timetable over. Dad drew the way to the wheel. I added the Luna. Where do you want to go?"}
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
    berth:raw?.berth===1?1:0,cut:BayRoomTone.valid(raw?.cut),morning:BaySixSharp.read(raw?.morning),sleeve:raw?.sleeve===true,repairTag:raw?.repairTag===true,
    transfer:BayLastTransfer.read(raw?.transfer),photoRoad:Object.hasOwn(BayExposure.photoRuns,raw?.photoRoad)?raw.photoRoad:"",
    hearing:BayLandingOrder.read(raw?.hearing),airings:Number.isSafeInteger(raw?.airings)&&raw.airings>0?raw.airings:0});
  class Story {
    constructor(){try{this.book=read(JSON.parse(localStorage.getItem(key)));}catch{this.book=read();}this.scene=null;this.table=null;}
    write(){try{localStorage.setItem(key,JSON.stringify(this.book));}catch{}}
    advance(stage){if(stages.indexOf(stage)>stages.indexOf(this.book.stage)){this.book.stage=stage;this.write();}}
    start(id,replay=false){
      if(!scenes[id])return;this.watch=id==="opening"?new BaySixSharp.Watch():null;
      this.pilot=id==="lastTransfer"?new BayLastTransfer.Run(this.book.morning):null;this.scene={id,index:0,age:0};
      if(this.watch&&!replay&&this.book.morning){this.watch.departure={...this.book.morning};this.scene.index=scenes.opening.findIndex(b=>b.art==="watchCopy");}
      return this.beat();
    }
    beat(){
      const s=this.scene;if(!s)return null;
      if(s.id==="lastTransfer"){
        const b=scenes.lastTransfer[s.index];if(!b)return null;
        const p=this.pilot;
        if(b.pilot==="cast")return {...b,line:p.luis==="aboard"?"Luis, put those tins under the seat. We held for you. Now see if you can spot Alma’s bus from the bow.":"Luis missed our gate. I can still see him waving. Seventeen aboard for Alma’s clinic bus."};
        if(b.pilot==="helm")return {...b,line:p.instruction()};
        if(b.pilot==="land"){
          if(p.landingAge>8.5)return {...b,who:"Estela Paz",line:p.result.caught?
            "Two copies, Alma? I’ll take the top one. Clip the spare up for the next person.":
            "She tucked the afternoon ones under here. There’s even a spare for Marta’s bus."};
          if(p.landingAge>3.6)return {...b,who:"Estela Paz",line:"Give me an arm’s length. If my stick finds the boards, my shoes usually follow."};
          return {...b,line:p.result.caught?(p.held?"Heard you at the buoy. I told the driver, you close that door and you answer to me.":"There’s my last fare. Come on, love. Mind the step."):"I left the afternoon transfers under the clip. Make sure everybody gets one."};
        }
        return {...b,line:"I stapled Alma’s stub to the engine-room copy. You can read it in my book at Lot 14."};
      }
      const delivery=s.id==="live"||s.id==="print";
      if(delivery&&this.windowPrint&&s.index===1){
        const place=BayLotNegative.locations[this.windowPrint.place];
        return {dur:5.7,art:"driverPrint",who:"Mara Vega",line:place.inscription,slug:"ON THE BACK OF FRAME 13"};
      }
      const index=delivery&&this.windowPrint&&s.index>1?s.index-1:s.index,b=scenes[s.id][index];if(!b)return null;
      if(s.call&&index===1)return {art:"julesHandset",dur:7,who:"Romy Vale · phone",line:BayPayroll.lastWords(s.call)};
      if(b.watch==="away")return {...b,line:this.watch.departure.luis==="aboard"?"One’s mine. The other’s my brother’s. He’d have had crackers for supper.":"Tell my brother I’ve got his lunch. I’ll catch the next one."};
      const recorded=this.book.morning;
      if(s.id==="firstCopy"&&s.index===0&&this.negativeNumber==="14B")return {...b,line:"Look at him. My brother kept that tin so clean you could check your shave in it. Here, turn it over."};
      if(this.negativeNumber==="14B"&&s.index===0){
        if(s.id==="negative")return {...b,line:"There’s the dent. Dad dropped that tin on the gangway when I was eight."};
        if(s.id==="print")return {...b,line:"Somebody in the back row says, “Luis, you still got that thing?” His laugh carries all the way up to the booth."};
        if(s.id==="live")return {...b,line:"That’s Luis Vega on the Bay Wire cover. He packed two lunches for that crossing for twenty-three years. He’s on line one."};
      }
      if(b.art==="glovebox"&&s.tagAt!=null)return {...b,dur:Math.max(b.dur,s.tagAt+3.8),line:"Eight dollars to fix a lunch pail. Uncle Luis said a new one wouldn’t know the way to work."};
      if(recorded&&s.id==="boarded"&&b.art==="timetable")return {...b,line:recorded.luis==="aboard"?
        "Dad was on the far side. The morning Dalia held the gate, Uncle Luis brought his lunch across in that blue tin.":
        "Dad worked the far side. He kept crackers in the glove box for mornings Uncle Luis missed the six."};
      if(recorded&&(s.id==="passDalia"||s.id==="passShift")&&s.index===0)return {...b,line:recorded.luis==="aboard"?
        "Eighteen that last morning. Luis counted the tins twice. I still have the carbon. Here’s the first ticket back.":
        "Seventeen that last morning. Luis was my eighteenth today. I made him come in early. Here’s your ticket."};
      return b;
    }
    step(dt,hold=false){if(!this.scene)return false;const b=this.beat();
      if(b.pilot==="helm"&&!this.pilot.result)return false;
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
