/* Sidewalk routes follow specific storefronts and crossings. The final value is a pause in seconds. */
(() => {
  "use strict";
  const routes={
    wire:[[153.8,-19.75,18],[153.8,-30,3],[153.6,-10.1,7],[151.8,-11,2]],
    motel:[[153.8,-25.4,13],[153.5,-9,2],[134.6,-9,1],[134.3,-22,5],[134.8,-8.8,1],[153.8,-8.8,0]],
    pier:[[169,124,3],[170,103,1],[167.8,80,2],[167.7,103,0]],
    run:[[158.8,-57,1],[159.2,-5,0],[159.7,48,1],[158.8,-5,0]],
    diner:[[133.3,25,5],[134.6,10,1],[135,8.4,0],[153.5,8.6,2],[153.7,44,0],[153.5,8.6,1],[135,8.4,2]],
    cinema:[[8.9,50,4],[8.8,63,1],[8.8,80.3,1],[30,80.5,4],[8.8,80.3,0],[8.8,63,1]],
    dock:[[-135,-94,2],[-135.4,-80.8,0],[-122,-81.1,5],[-135.4,-80.8,1]],
    mercado:[[-62.6,-119,2],[-62.8,-134.8,0],[-45,-135,4],[-62.8,-134.8,0]],
    esplanade:[[167,-88,3],[167,-45,0],[169,-19,5],[168,-48,0]],
    downtown:[[-8.8,60,2],[-8.6,28,0],[-8.6,9,0],[-23,9.3,4],[-8.6,9,0]],
    beach:[[176,47,5],[171,60,2],[170,83,0],[171.5,62,1]],
    west:[[-81,112,2],[-81,83,1],[-94,81.4,5],[-81,83,0]],
    north:[[81,110,2],[81,133,0],[105,135,3],[81,133,1]],
    iceRun:[[181.8,330.6,7],[184.7,326.7,0],[200,325.5,0],[206.6,322,0],[209.7,319.9,0],[224,319.9,0],
      [238.5,320,7],[224,320.35,0],[209.7,320.35,0],[200,325.7,0],[185.2,326.8,0]],
    birdHide:[[105,268.5,10],[107.4,268.6,3],[105.3,265.4,5],[102.4,266.1,4]]
  };
  const cast=[
    ["June","tourist","motel",2,["Lost my demo on the beach side of the Marlin. Try the south end. Blue dot on the label.","Room twelve has the good shower. Don't tell the other guests."]],
    ["Eli","fisher","pier",1,["See that little skiff? My brother's been bringing me a sandwich for forty minutes.","Best spot on the pier is the board that doesn't creak."]],
    ["Marisol","runner","run",4,["Lap three. If anybody asks, it's lap four.","There's a straight run all the way to the wheel. Watch for the bike."]],
    ["Val","local","cinema",3,["The late show starts when I get this reel upstairs.","Nia's always here ten minutes before the radio show. Never eleven."]],
    ["Boone","dockhand","dock",5,["If the crane squeals in C, it's quitting time.","Port office is the blue door. Other blue door."]],
    ["Ren","courier","mercado",1,["Three bags went to the pier. Guess which one's still on my shoulder.","The oranges with the black stamp are for the juice stand."]],
    ["Luz","local","diner",2,["Sit on the end stool. The one by the window spins all by itself.","The boardwalk's quicker on foot when the light's against you.","Those striped hurdles by the surf shack? My kid put a dent in the second one."]]
  ];
  const shopkeeper={name:"Beto",role:"local",x:132.10,z:29.19,yaw:1.43,style:2,spoken:0,external:true,
    lines:["One cup takes three oranges. That's two for you and one for the shirt.","My sister painted the heron. She says the beak's too short. I like the beak."]};
  function makeWalkers(){
    const people=[];
    function add(routeName,style,role,start,offset,name,lines){
      const path=routes[routeName],a=path[start%path.length],b=path[(start+1)%path.length];
      const person={x:a[0]+offset,z:a[1]+offset,index:(start+1)%path.length,path,offset,style,role,name,lines,spoken:0,
        yaw:Math.atan2(b[0]-a[0],b[1]-a[1]),phase:people.length*1.42,pace:role==="runner"?2.65:.93+style*.077,
        wait:a[2]||0,alert:0,stuck:0,moving:false,gesture:0,side:people.length%2?1:-1,reactionBeat:(people.length*7%11)/10};
      if(!name&&role!=="runner"&&people.length%4!==1)person.canopyStyle=people.length%4;
      people.push(person);
    }
    for(const [name,role,route,style,lines] of cast)add(route,style,role,0,0,name,lines);
    const busy=[["motel","courier",1,2,.24],["motel","local",4,4,-.23],["diner","tourist",5,3,.32],["diner","local",1,0,-.36],
      ["run","runner",2,2,.41],["esplanade","tourist",5,0,0],["esplanade","courier",1,2,.4],
      ["beach","local",4,0,0],["beach","tourist",2,2,.41],["pier","tourist",3,1,-.41],["pier","runner",5,3,.2],
      ["cinema","local",1,2,.30],["cinema","courier",4,3,-.4],["downtown","courier",3,1,0],["downtown","local",2,3,.3],
      ["dock","dockhand",1,2,-.35],["dock","courier",2,1,.4],["mercado","local",3,2,.28],["mercado","tourist",2,3,-.4],
      ["west","local",1,0,0],["west","runner",4,2,.35],["north","tourist",3,2,0],["north","local",5,1,.27]];
    for(const [rt,role,style,start,offset] of busy)add(rt,style,role,start,offset,null,null);
    add("iceRun",1,"dockhand",0,0,"Nell Soto",["If Dot asks, this is the second box of ice. First one went in my iced tea.",
      "Granddad named that boat after my mother. Even the bill collector calls her Little Dot."]);
    people.at(-1).fieldSource="trawler";
    add("birdHide",5,"fisher",0,0,"Ada Pike",["Watch the pink one on the end. She always takes three steps before she lifts.",
      "I used to count this flock from my kitchen window. The knees still get me out here."]);
    people.at(-1).fieldSource="spoonbills";
    add("wire",4,"local",0,0,"Meli Funes",["I cut On the Curb for Bay Wire. Tap your horn before you make a pass and I’ll get the whole thing.","That set used to show the numbers at the dog track. It still has the clearest picture on Ocean Drive."]);
    for(const [route,name] of [["west","Vic Bell"],["north","Cora Ledesma"],["downtown","Emi Brea"],["esplanade","Dani Silva"]]){
      const w=people.find(p=>!p.name&&p.path===routes[route]);if(w)w.curbName=name;
    }
    return people;
  }
  const wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  function animatePeople(people,dt,driver,cars,signals,time,valid,rain=0){
    for(const p of people){
      if(p.onTour)continue;
      if(p.sprayWait>0){
        p.sprayWait=Math.max(0,p.sprayWait-dt);p.sprayAge+=dt;
        const age=p.sprayAge;
        if(age<1.35&&!p.startle){
          const guard=Math.min(1,age/.16,(1.35-age)/.56);
          p.sprayPose={lift:0,air:0,guard,bend:.33*guard,lead:p.side};
          p.moving=false;p.yaw+=wrap(p.sprayFace-p.yaw)*-Math.expm1(-7*dt);
        }else p.sprayPose=null;
      }
      if(BayStreetReactions.startlePerson(p,dt,driver,cars,people,valid,time))continue;
      if(p.sprayPose)continue;
      if(p.curbAim){p.moving=false;p.yaw+=wrap(Math.atan2(p.curbAim.x-p.x,p.curbAim.z-p.z)-p.yaw)*-Math.expm1(-12*dt);continue;}
      if((rain>.12||p.porch)&&BayRainWalk.porchStep(p,dt,rain,time,people,cars,valid))continue;
      p.moving=false;
      const target=p.path[p.index],dx=target[0]+p.offset-p.x,dz=target[1]+p.offset-p.z,d=Math.hypot(dx,dz);
      if(p.alert>0){p.alert-=dt;p.gesture=1;continue;}
      if(p.wait>0){p.wait-=dt;p.gesture=p.name?2:(Math.floor(time*.32+p.phase)%3===0?1:0);continue;}
      if(d<.3||p.stuck>2.4){p.wait=target[2];p.index=(p.index+1)%p.path.length;p.stuck=0;continue;}
      const ux=dx/d,uz=dz/d;let hold=false;
      for(const s of signals){
        const ew=Math.abs(ux)>.92,ns=Math.abs(uz)>.92;
        const edge=ew?Math.abs(p.x-s.x):Math.abs(p.z-s.z);
        const across=ew?Math.abs(p.z-s.z):Math.abs(p.x-s.x);
        const ahead=ew?(s.x-p.x)*ux:(s.z-p.z)*uz;
        if((ew||ns)&&edge>6.4&&edge<9.9&&across<10.5&&ahead>0&&d>edge){
          const trafficNS=(time+s.offset)%14<7;
          if(ew===trafficNS)hold=true;
          if(!hold)for(const c of cars){
            if(Math.abs(c.speed)<1.5)continue;
            const rx=p.x-c.x,rz=p.z-c.z,front=rx*Math.sin(c.yaw)+rz*Math.cos(c.yaw);
            if(front>-1&&front<7&&Math.hypot(rx,rz)<8){hold=true;break;}
          }
        }
      }
      if(hold){p.gesture=0;continue;}
      const step=Math.min(d,p.pace*dt),nx=p.x+ux*step,nz=p.z+uz*step;
      let clear=valid(nx,nz,.24);
      if(clear&&driver&&Math.abs(driver.x-nx)<4&&Math.abs(driver.z-nz)<4){
        const gap=BayDriving.clearance(driver,{x:nx,z:nz});
        clear=gap>.48||gap>BayDriving.clearance(driver,p);
      }
      if(clear){p.x=nx;p.z=nz;p.stuck=0;p.moving=true;p.phase+=step*4.8;}
      else{p.stuck+=dt;}
      p.gesture=0;p.yaw+=wrap(Math.atan2(ux,uz)-p.yaw)*Math.min(1,dt*6.8);
    }
  }
  function closestSpeaker(people,hero){
    let found=null,best=3.65;
    for(const p of [shopkeeper,...people]){if(!p.name||p.palmManaged)continue;const d=Math.hypot(hero.x-p.x,hero.z-p.z);if(d<best){best=d;found=p;}}
    return found;
  }
  window.BayLocals={makeWalkers,animatePeople,closestSpeaker};
})();
