/* Cleo's temporary relay has one channel and two possible rooftops. */
(() => {
  const sites={
    luna:{x:3.2,z:68.5,name:"Cine Luna marquee"},
    motel:{x:146.2,z:-14,name:"Marlin Motel"},
    market:{x:-141.7,z:-94,name:"Port Sol fish market"}
  };
  const line=id=>id==="market"?"Vic left the scale on while he climbed. I could hear it ticking all the way across town.":"Romy came through from the laundry. First time I've heard the dryer without asking her to say it again.";
  const read=raw=>({
    next:["luna","market","motel"].includes(raw?.next)?raw.next:"",
    cover:["market","motel"].includes(raw?.cover)?raw.cover:"",
    rev:Number.isSafeInteger(raw?.rev)&&raw.rev>0?raw.rev:0
  });
  function card(canvas,site){
    const c=canvas.getContext("2d");if(!c)return;
    canvas.width=720;canvas.height=400;c.fillStyle="#273732";c.fillRect(0,0,720,400);
    c.save();c.translate(360,200);c.rotate(-.028);c.fillStyle="#c29a7d";c.fillRect(-277,-151,560,315);
    c.fillStyle="#eee3bd";c.fillRect(-284,-158,560,315);
    c.fillStyle="#34534b";c.font="bold 14px monospace";c.fillText("PALM COUNTY   /   RADIO SERVICE", -258,-123);
    c.fillStyle="#503e35";c.font="bold 31px Georgia";c.fillText("Repeater loan ticket", -258,-76);
    c.strokeStyle="#b2a989";c.lineWidth=1;
    for(const y of [-53,1,52,106]){c.beginPath();c.moveTo(-258,y);c.lineTo(248,y);c.stroke();}
    c.fillStyle="#535748";c.font="15px monospace";c.fillText("SERIAL   04-113      FIELD SPARES   1", -258,-21);
    c.fillText("DEAD SPOT", -258,36);c.fillText("ASSIGNED TO", -258,88);
    c.fillStyle="#264c63";c.font="italic 25px Georgia";c.fillText("Luna marquee", -117,34);
    c.fillText(sites[site]?.name||"Driver to confirm", -117,85);
    c.font="italic 19px Georgia";c.fillText("C. Moss, receiving", 69,138);
    c.fillStyle="#ae493b";c.font="bold 12px monospace";c.fillText(site?"RETURN CARBON TO RECEIVING":"DRIVER'S COPY",-258,135);c.restore();
  }
  window.BayCountyRelay={sites,line,read,card};
})();
