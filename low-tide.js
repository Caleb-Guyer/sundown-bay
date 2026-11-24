/* Cora's exchange and the three Foto Bahía prints she buys for her window. */
(() => {
  "use strict";
  const site={x:156.8,z:-24,y:.076},counter={x:155.2,z:-24,kind:"threads",name:"Low Tide Exchange"};
  const cora={x:156.8,z:-26,yaw:-.73};
  const stock=[
    {id:"tideline",name:"Tideline polo",price:0,note:"Cream terry, sea-green stripes. Cora kept a box from the old bathhouse."},
    {id:"pitlane",name:"No. 13 pit jacket",price:55,note:"Oxblood twill, a checkered sleeve and the Ocean crew’s stitched number."},
    {id:"marquee",name:"Blue Hour jumpsuit",price:65,note:"Indigo cotton with a gold sunburst from the Cine Luna costume shop."},
    {id:"netter",name:"Netter’s work set",price:85,note:"Mustard overshirt and blue bibs, cut from the last roll at Port Sol."}
  ];
  const briefs=[
    {id:"marlin",name:"Postcard from the Marlin",pay:65,detail:"Wear the Tideline polo at the Marlin Motel booth. Give me three different poses."},
    {id:"luna",name:"After the early show",pay:110,detail:"Wear the Blue Hour jumpsuit at Cine Luna. Lean in for the middle exposure."},
    {id:"wheel",name:"Two at the wheel",pay:185,detail:"Bring your partner to North Boardwalk. One in the pit jacket, one in the Netter’s set. Finish with the peace sign."}
  ];
  const custom=id=>stock.some(s=>s.id===id);
  const available=(book,courts,id)=>id==="street"||book.owned.includes(id)||(["sol","mercado"].includes(id)&&courts[id].wins>0);
  const fits=(r,id)=>{
    if(!r||r.site!==id||!r.looks||!Array.isArray(r.poses)||r.poses.length!==3)return false;
    const looks=r.solo?[r.looks[r.lead]]:[r.looks.guest,r.looks.frankie];
    if(id==="marlin")return looks.includes("tideline")&&new Set(r.poses).size===3;
    if(id==="luna")return looks.includes("marquee")&&r.poses[1]===1;
    return id==="wheel"&&!r.solo&&looks.includes("pitlane")&&looks.includes("netter")&&r.poses[2]===2;
  };
  function read(raw,courts){
    const book={rev:Number.isSafeInteger(raw?.rev)&&raw.rev>=0?raw.rev:0,met:raw?.met===true,
      owned:stock.filter(s=>Array.isArray(raw?.owned)&&raw.owned.includes(s.id)).map(s=>s.id),wear:{},prints:{},featured:""};
    for(const lead of ["guest","frankie"]){
      const id=raw?.wear?.[lead]??courts.equipped;
      book.wear[lead]=available(book,courts,id)?id:"street";
    }
    for(const {id} of briefs){
      const r=raw?.prints?.[id];
      if(BayOffClock.valid(r,id)&&fits(r,id))book.prints[id]=r;
    }
    book.featured=Object.hasOwn(book.prints,raw?.featured)?raw.featured:Object.keys(book.prints).at(-1)||"";
    return book;
  }
  function outfit(save,lead,id,shop){
    const b=save.threads,s=stock.find(s=>s.id===id);
    if(!["guest","frankie"].includes(lead))return false;
    if(!available(b,save.courts,id)){
      if(!shop||!s||save.wallet<s.price)return false;
      save.wallet-=s.price;b.owned.push(id);
    }else if(b.wear[lead]===id)return false;
    b.wear[lead]=id;b.rev++;return true;
  }
  function hang(save,r){
    const b=save.threads,brief=briefs.find(q=>q.id===r?.site);
    if(!brief||!BayOffClock.valid(r,brief.id)||!fits(r,brief.id))return null;
    if(b.featured===brief.id&&b.prints[brief.id]?.stamp===r.stamp)return null;
    const pay=b.prints[brief.id]?0:brief.pay;
    b.prints[brief.id]=r;b.featured=brief.id;b.rev++;save.wallet+=pay;if(pay)save.paid++;
    return pay;
  }
  window.BayLowTide={site,counter,cora,stock,briefs,custom,available,fits,read,outfit,hang};
})();
