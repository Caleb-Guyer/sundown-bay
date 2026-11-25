/* The town clerk takes testimony on the actual public crossing. Deck positions
   are shared by the interaction prompts, the passengers and both cameras. */
(() => {
  "use strict";
  const people={
    clinic:{x:.78,z:1.30,yaw:-1.8,name:"Alma Reyes",job:"clinic bus driver",shirt:"#557c91",skin:"#986b53",
      line:"I cut the motor at the float. My first passenger taps the bus door with her cane. Give her a time I can print on my visor."},
    shift:{x:.81,z:-1.40,yaw:-1.25,name:"Luis Vega",job:"night shift",shirt:"#a59569",skin:"#926349",
      line:"Some nights the last crate takes two minutes. Some nights it takes twenty. Leave us a bell on the pier and we can still get home."},
    clerk:{x:-1.12,z:.14,yaw:1.17,name:"Nora Abreu",job:"port clerk",shirt:"#ab7160",skin:"#ab775c"}
  };
  const terms={
    clinic:{title:"Clinic connection",term:"Meet the first clinic bus on a fixed timetable."},
    shift:{title:"Shift bell",term:"Keep a boat on call for the last shift."}
  };
  const witnesses=["clinic","shift","clerk"],regulars={clinic:["clinic"],shift:["shift"]},empty=[];
  function read(raw){
    if(!raw||typeof raw!=="object")return null;
    const clinic=raw.clinic===true,shift=raw.shift===true;
    const draft=clinic&&shift&&Object.hasOwn(terms,raw.draft)?raw.draft:"";
    const filed=!!draft&&raw.filed===true;
    return {clinic,shift,draft,voice:raw.voice==="luis"?"luis":"dalia",filed,run:filed?BayLandingRun.read(raw.run):null};
  }
  function nearby(r){
    if(!r)return null;
    for(const id of witnesses){const p=people[id];if(Math.hypot(r.x-p.x,r.z-p.z)<.84)return id;}
    return null;
  }
  function testimony(h,id){
    if(!h||h.filed||!["clinic","shift"].includes(id))return false;
    h[id]=true;return true;
  }
  function select(h,id){
    if(!h||!h.clinic||!h.shift||h.filed||!Object.hasOwn(terms,id))return false;
    h.draft=id;return true;
  }
  function charter(book){const h=book.hearing;return h?.filed?h.draft:"";}
  function hint(h,r){
    const id=nearby(r);
    if(id==="clerk")return ["F",h.clinic&&h.shift?"Review the landing order":"Talk to the port clerk"];
    if(id)return ["F",people[id].name+" · "+people[id].job];
    return ["",!h.clinic?"Walk to Alma at the bow":!h.shift?"Walk to Luis at the stern":"Take both statements to the clerk by the gangway"];
  }
  function aboard(book){
    const h=book.hearing;
    return !h?empty:h.filed?regulars[h.draft]:witnesses;
  }
  function deckClear(book,x,z){
    for(const id of aboard(book)){
      const p=people[id],dx=x-p.x,dz=z-p.z;
      if(dx*dx+dz*dz<.49*.49)return false;
    }
    return true;
  }
  function world(list,model,s){
    if(s.regular)return;
    for(const id of aboard(s.book)){
      const p=people[id],key="luz/deputy/"+id;
      model(key,g=>buildBayPerson(g,p.skin,p.shirt,id==="clinic"?"#4c5146":"#414f54",0,"local",0));
      const at=BayDriving.world(s,p.x,p.z);
      list.push([key,at.x,s.y+.83,at.z,s.yaw+p.yaw]);
      const prop="luz/exhibit/"+id;
      model(prop,g=>{
        if(id==="shift"){
          for(const side of [-1,1]){
            g.box(side*.29,.62,.07,.235,.18,.17,side===1?"#426e83":"#687e69");
            g.box(side*.29,.714,.07,.246,.026,.18,"#cabf9c");g.box(side*.29,.75,.07,.10,.064,.025,"#454d47");
          }
        }else if(id==="clinic"){
          g.box(-.28,.64,.07,.21,.27,.11,"#835c40");g.box(-.28,.76,.07,.23,.07,.12,"#a78351");
          g.box(.26,.80,.07,.084,.105,.021,"#dfbd64");
        }else{
          g.box(.25,.80,.10,.22,.035,.30,"#835943");g.box(.25,.823,.10,.20,.01,.28,"#ede1bd");
          g.box(.25,.83,.20,.09,.018,.042,"#55615d");
        }
      });
      list.push([prop,at.x,s.y+.83,at.z,s.yaw+p.yaw]);
    }
  }
  function map(c,s){
    if(s.regular)return;
    for(const id of aboard(s.book)){
      const p=people[id];c.save();c.translate(p.x,p.z);c.rotate(-p.yaw);
      c.fillStyle=p.shirt;c.beginPath();c.ellipse(0,0,.31,.20,0,0,Math.PI*2);c.fill();
      c.fillStyle=p.skin;c.beginPath();c.arc(0,.06,.145,0,Math.PI*2);c.fill();
      c.fillStyle=id==="clinic"?"#353d41":"#504439";c.fillRect(-.11,.025,.22,.13);
      c.fillStyle=id==="shift"?"#608394":id==="clerk"?"#f6e5c2":"#b99559";c.fillRect(.19,.03,.15,.17);c.restore();
    }
  }
  const boards=new Map();
  function notice(g){
    for(const x of [-.79,.79]){
      g.box(x,1.055,-.063,.079,2.11,.087,"#727d74");g.box(x,.045,-.063,.255,.09,.25,"#929187");
    }
    g.box(0,1.67,0,2.24,1.03,.094,"#26554f");
  }
  function face(g){
    for(const [u,v] of [[0,0],[1,0],[1,1],[0,0],[1,1],[0,1]])
      g.vertices.push(u?-1.12:1.12,v?1.155:2.185,.054,u,v,0);
  }
  function sign(id){
    if(boards.has(id))return boards.get(id);
    const surface=document.createElement("canvas");surface.width=512;surface.height=256;
    const c=surface.getContext("2d");c.scale(1,256/236);c.fillStyle="#26554f";c.fillRect(0,0,512,236);
    c.strokeStyle="#d5c68a";c.lineWidth=3;c.strokeRect(9,9,494,218);
    c.textAlign="center";c.fillStyle="#ede4bd";c.font="bold 19px monospace";c.fillText("PORT SOL   /   LANDING 14",256,45);
    c.font="bold 49px Georgia";c.fillText("PUBLIC LANDING",256,112);
    c.fillRect(38,134,436,2);c.font="bold 22px monospace";c.fillText(id==="clinic"?"CLINIC CONNECTION":"RING FOR THE SHIFT BOAT",256,178);
    c.font="15px Georgia";c.fillText("Public access in perpetuity",256,205);boards.set(id,surface);return surface;
  }
  function docket(canvas,book){
    const h=book.hearing;if(canvas.width!==900||canvas.height!==490){canvas.width=900;canvas.height=490;}
    const g=canvas.getContext("2d");g.fillStyle="#385353";g.fillRect(0,0,900,490);
    g.save();g.translate(65,34);g.rotate(-.012);g.fillStyle="#554837";g.fillRect(5,7,774,425);
    g.fillStyle="#e6dcc4";g.fillRect(0,0,774,425);g.fillStyle="#244943";
    g.font="bold 18px monospace";g.fillText("PORT SOL   /   CLERK OF THE LANDINGS",32,43);g.fillRect(32,56,710,2);
    g.font="bold 38px Georgia";g.fillText("Order for the public slip",32,107);
    g.font="20px Georgia";g.fillText("Lot 14 landing is withdrawn from sale. The shed is listed separately.",32,144);
    g.font="16px monospace";g.fillText("Exhibit A    "+(book.credit==="crew"?"Port Sol night shift":"Dalia Cruz")+" · departure book",32,182);
    g.fillText("Exhibit B    Sol FM · "+(h.voice==="dalia"?"dispatcher’s tape":"Luis Vega’s testimony"),32,210);
    if(book.morning)g.fillText("Last watch   "+(book.morning.luis==="aboard"?"18 passengers":"17 passengers")+" · Marlin Pier",32,238);
    for(const [i,id] of ["clinic","shift"].entries()){
      const y=277+i*47;g.strokeStyle="#597269";g.strokeRect(35,y-16,20,20);
      if(h?.draft===id){g.font="bold 24px Georgia";g.fillText("✓",36,y+1);}
      g.font="bold 18px Georgia";g.fillText(terms[id].title,69,y);g.font="17px Georgia";g.fillText(terms[id].term,238,y);
    }
    g.fillStyle=h?.filed?"#915344":"#596b61";g.font="bold 16px monospace";
    g.fillText(h?.filed?"FILED ABOARD M/V LUZ     ·     N. ABREU, PORT CLERK":"WITNESSES     A. REYES  /  L. VEGA",34,390);
    if(h?.filed&&h.run?.received.some(Boolean)){
      g.font="14px monospace";g.fillText((h.draft==="shift"?"LUNCH TINS":"CLINIC PACKETS")+" RECEIVED     MARLIN PIER  "+h.run.received[0]+"     NORTH FLOAT  "+h.run.received[1],34,414);
    }
    g.restore();
  }
  window.BayLandingOrder={people,terms,read,nearby,testimony,select,charter,hint,aboard,deckClear,world,map,notice,face,sign,docket};
})();
