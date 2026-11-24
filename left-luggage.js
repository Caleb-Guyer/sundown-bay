/* Marlin bell desk. A numbered claim belongs to exactly one rack, hand, trunk slot or receipt. */
(() => {
  "use strict";
  const site={x:134.30,y:.077,z:-27.2,yaw:Math.PI/2};
  const counter={x:135.36,z:site.z,kind:"luggage",name:"Marlin · Left luggage"};
  const porter={x:133.55,z:-27.42,yaw:1.28,style:5,role:"local",name:"Alma León"};
  const tags=[
    {id:"band",label:"Blue tambourine case",number:"17",person:"Pip Reyes",place:"Marlin shuttle curb",pay:45,
      x:153.55,z:-36.5,yaw:-1.3,style:3,role:"local",ask:"Pip's already at the shuttle curb. You'll know his case by the little crescent moon.",thanks:"There it is! Hear that rattle? That's half our rhythm section."},
    {id:"reel",label:"Oxblood film case",number:"28",person:"Nora Vale",place:"Cine Luna stage door",pay:130,
      x:11.75,z:44.8,yaw:1.4,style:2,role:"courier",ask:"Nora needs the film before the house lights go down. Go around to the stage door.",thanks:"Smell that leader? My dad shot this on the night the Marlin opened."},
    {id:"reef",label:"Seafoam specimen case",number:"41",person:"Des Bell",place:"North Boardwalk",pay:160,
      x:173.35,z:120.3,yaw:-1.2,style:4,role:"local",ask:"Des is waiting up on the boardwalk. Carry the green case by the handle. Those shells took years to find.",thanks:"The little pink one came from right under this pier. They never turn that color in deep water."}
  ];
  const ids=tags.map(t=>t.id);
  const claim=(id)=>tags.find(t=>t.id===id);
  const marker=t=>({x:t.x+.80*Math.sin(t.yaw),z:t.z+.80*Math.cos(t.yaw),name:t.person+" · "+t.place,kind:"claim"});
  const foot=t=>({...marker(t),yaw:t.yaw});
  const integer=n=>Number.isSafeInteger(n)&&n>=0?n:0;
  const carKey=k=>typeof k==="string"&&/^(coupe|cab)@-?\d{1,3}\.\d\d,-?\d{1,3}\.\d\d$/.test(k);
  function read(raw){
    const b={rev:integer(raw?.rev),round:integer(raw?.round),bags:{},parks:{}},slots=new Set();
    let carried=false;
    for(const id of ids){
      const s=raw?.bags?.[id];let bag={at:"rack"};
      if(s?.at==="done")bag={at:"done"};
      if(s?.at==="hand"&&!carried){bag={at:"hand"};carried=true;}
      if(s?.at==="boot"&&carKey(s.car)&&[0,1].includes(s.slot)&&!slots.has(s.car+"/"+s.slot)){
        bag={at:"boot",car:s.car,slot:s.slot};slots.add(s.car+"/"+s.slot);
        const p=raw?.parks?.[s.car];
        if(p&&[p.x,p.z,p.yaw].every(Number.isFinite)&&Math.abs(p.x)<600&&Math.abs(p.z)<650)b.parks[s.car]={x:p.x,z:p.z,yaw:p.yaw};
      }
      b.bags[id]=bag;
    }
    return b;
  }
  const hand=b=>ids.find(id=>b.bags[id].at==="hand");
  const slots=(b,key)=>{const items=[null,null];for(const id of ids){const v=b.bags[id];if(v.at==="boot"&&v.car===key)items[v.slot]=id;}return items;};
  const rack=b=>ids.filter(id=>b.bags[id].at==="rack");
  const complete=b=>ids.every(id=>b.bags[id].at==="done");
  function park(b,v){
    if(!v||!slots(b,v.garageKey).some(Boolean))return false;
    const prior=b.parks[v.garageKey];if(prior&&Math.hypot(v.x-prior.x,v.z-prior.z)<.04&&Math.abs(v.yaw-prior.yaw)<.01)return false;
    b.parks[v.garageKey]={x:v.x,z:v.z,yaw:v.yaw};return true;
  }
  function change(b,id,from,to){
    if(!claim(id))return false;
    const s=b.bags[id];
    if(s.at!==from.at||s.at==="boot"&&(s.car!==from.car||s.slot!==from.slot))return false;
    if(to.at==="hand"&&hand(b)||to.at==="boot"&&(!carKey(to.car)||![0,1].includes(to.slot)||slots(b,to.car)[to.slot]))return false;
    if(s.at==="done"||!["rack","hand","boot","done"].includes(to.at)||(s.at==="hand")===(to.at==="hand"))return false;
    b.bags[id]={...to};if(s.at==="boot"&&!slots(b,s.car).some(Boolean))delete b.parks[s.car];
    b.rev++;return true;
  }
  window.BayLeftLuggage={site,counter,porter,tags,claim,marker,foot,ids,read,hand,slots,rack,complete,change,park,
    block:{...site,w:.744,d:1.292,bottom:0,top:1.79,streetProp:true}};
})();
