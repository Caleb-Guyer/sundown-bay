/* Rosario's carbon order pad and the regulars who take their supper on shift. */
(() => {
  "use strict";
  const job={id:"plates",by:"Rosario León",name:"An Extra Plate"};
  const regulars=[
    {id:"davi",name:"Davi",place:"Cine Luna stage door",x:8.7,z:56.7,yaw:-1.4,style:3,role:"courier",dish:"Two Cuban sandwiches",base:68,care:"hot",
      ticket:"Projection booth. One with mustard, one without. Davi always forgets which is his.",
      waiting:"I put a reel on so I could come down for these.",again:"Left you two aisle seats. Back row, right under the fan."},
    {id:"bel",name:"Bel",place:"Marlin Motel breezeway",x:132.5,z:-40.7,yaw:1.2,style:4,role:"local",dish:"Caldo in the blue thermos",base:88,care:"steady",
      ticket:"Night clerk at the Marlin. Her thermos leaks if you knock it around.",
      waiting:"Oh good, the blue one. Last time she sent me home with a whole pot.",again:"Room fourteen's bulb came in. I left the spare in your desk."},
    {id:"lenny",name:"Lenny",place:"Port Sol time clock",x:-151.8,z:-87.8,yaw:1.7,style:5,role:"dockhand",dish:"Picadillo and sweet plantains",base:70,care:"hot",
      ticket:"Find the orange work shirt by the port time clock. His break is short.",
      waiting:"My kid says the raisins don't belong. I keep his half separate.",again:"Rosario asked if I washed the tin. Tell her twice."},
    {id:"alma",name:"Alma",place:"North Boardwalk rail",x:156.8,z:132.6,yaw:-1.1,style:2,role:"tourist",dish:"Three cups of flan",base:104,care:"steady",
      ticket:"The boardwalk photographer is buying dessert. Keep the caramel in the cups.",
      waiting:"Three spoons, too? Good. You saved a family argument.",again:"The gulls remember that yellow bag. Keep it under your arm."},
    {id:"ivo",name:"Ivo",place:"Palm Diner side door",x:132.8,z:22.0,yaw:1.6,style:1,role:"local",dish:"Croquetas in a paper bag",base:84,care:"hot",
      ticket:"The cook at the Palm eats standing up. Give them to him while the paper's still warm.",
      waiting:"A cook who orders out. That's between you and me.",again:"Next time you see her, tell Rosario I want the recipe."}
  ];
  const byId=new Map(regulars.map(p=>[p.id,p]));
  function read(raw){
    const result={served:0,visits:{},last:""};
    if(!raw||typeof raw!=="object")return result;
    for(const person of regulars){
      const count=raw.visits?.[person.id];if(!Number.isSafeInteger(count)||count<=0)continue;
      result.visits[person.id]=Math.min(1000000,count);result.served+=result.visits[person.id];
    }
    if(byId.has(raw.last)&&result.visits[raw.last])result.last=raw.last;
    return result;
  }
  function orders(clock,progress){
    const index=((Math.max(0,clock.shift)*2+progress.served*2)%regulars.length);
    return [regulars[index],regulars[(index+1)%regulars.length]];
  }
  class Run {
    constructor(customer){this.customer=customer;this.age=0;this.spilled=0;this.closed=false;}
    step(dt){this.age+=dt;}
    jolt(force){if(force>5)this.spilled=Math.min(1,this.spilled+Math.min(.52,(force-4)/24));}
    tip(){
      const quick=this.customer.care==="hot";
      const hot=Math.max(0,Math.min(1,1-(this.age-(quick?35:65))/(quick?100:160)));
      return Math.round((quick?48:55)*hot*(1-this.spilled*(quick?.50:1)));
    }
    condition(){
      if(this.spilled>.65)return this.customer.care==="steady"?"Lid's leaking":"Bag crushed";
      if(this.spilled>.20)return "Bag jostled";
      if(this.customer.care==="steady")return "Packed upright";
      return this.age<48?"Still piping hot":this.age<95?"Still warm":"Cooling off";
    }
    deliver(progress){
      if(this.closed)return null;
      this.closed=true;
      const who=this.customer,tip=this.tip(),returning=!!progress.visits[who.id];
      progress.served++;progress.visits[who.id]=(progress.visits[who.id]||0)+1;progress.last=who.id;
      return {customer:who,amount:who.base+tip,tip,line:returning?who.again:who.waiting};
    }
  }
  window.BayPlates={job,regulars,byId,orders,read,Run};
})();
