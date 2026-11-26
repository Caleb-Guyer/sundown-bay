/* The north window keeps a standing laundry order for people admitted from the street. */
(() => {
  const stages=["call","collect","return","filed"];
  const desk={...BayPalmClinic.site.desk,name:"Palm County receiving"};
  const laundry={x:153.8,z:-30.6,name:"Romy at the laundry door"};
  const phone={...BayCabArt.rankLocation(BayCab.stops.marlin),id:"marlin",name:"Marlin cab phone"};
  const targets={call:phone,collect:laundry,return:desk};
  function read(raw){
    if(!stages.includes(raw?.stage)||typeof raw.patient!=="string"||!raw.patient.trim())return null;
    return {stage:raw.stage,patient:raw.patient.slice(0,56)};
  }
  function count(seconds){return seconds<.35?0:Math.min(3,1+Math.floor((seconds-.35)/1.18));}
  function slip(canvas,order,reverse=false){
    canvas.width=720;canvas.height=400;canvas.setAttribute("aria-label","Marlin laundry claim for "+order.patient+", "+(reverse?"pencilled message":order.stage));
    const c=canvas.getContext?.("2d");if(!c)return;
    c.fillStyle="#474940";c.fillRect(0,0,720,400);c.save();c.translate(360,200);c.rotate(-.028);
    c.fillStyle="#2e3934";c.fillRect(-255,-143,532,301);c.fillStyle="#ebd7a6";c.fillRect(-263,-151,532,301);
    c.strokeStyle="#a18c64";c.lineWidth=1;c.setLineDash([3,5]);c.beginPath();c.moveTo(175,-151);c.lineTo(175,150);c.stroke();c.setLineDash([]);
    if(reverse){
      c.strokeStyle="#c2ab79";c.lineWidth=1;c.beginPath();c.moveTo(-87,-150);c.lineTo(-83,148);c.stroke();
      c.fillStyle="#706547";c.font="12px monospace";c.fillText("P.C. LINEN  /  REVERSE",-232,-114);
      c.rotate(-.015);c.fillStyle="#4c5148";c.font="italic 25px Georgia";
      c.fillText("A shirt with a pocket,",-196,-44);c.fillText("if there's one left.",-202,-4);
      c.fillText("I've still got my house key.",-194,39);c.font="italic 21px Georgia";c.fillText(order.patient,7,108,215);
      c.restore();return;
    }
    c.fillStyle="#293e42";c.font="bold 15px monospace";c.fillText("MARLIN     •     NIGHT LAUNDRY",-238,-115);
    c.font="italic 32px Georgia";c.fillText("County linen order",-238,-61);
    c.strokeStyle="#bbaa83";for(const y of [-37,20,76]){c.beginPath();c.moveTo(-239,y);c.lineTo(153,y);c.stroke();}
    c.font="13px monospace";c.fillText("FOR",-238,0);c.fillText("ISSUE",-238,56);c.font="italic 25px Georgia";
    c.fillText(order.patient,-182,1,326);c.fillText("One shirt. One comb.",-177,57);
    c.font="16px monospace";c.fillText("Two rings. Hang up.",-238,112);
    c.save();c.translate(227,94);c.rotate(-Math.PI/2);c.font="bold 16px monospace";c.fillText(order.stage==="filed"?"RECEIVED · O. BELL":"NORTH WINDOW",0,0);c.restore();c.restore();
  }
  function parcel(g){
    g.box(0,.095,0,.42,.19,.32,"#b2966b");g.box(-.016,.177,-.01,.39,.051,.295,"#cbb78a");
    g.box(.045,.118,0,.022,.19,.326,"#806952");g.box(0,.205,.048,.408,.011,.022,"#806952");
    g.box(-.092,.209,-.052,.129,.012,.083,"#e5d7ae");g.box(-.093,.217,-.048,.075,.006,.012,"#60614f");
  }
  function map(c,p,px,py,s){
    c.save();c.translate(px(p.x),py(p.z));c.rotate(p.yaw||0);c.scale(s,s);
    c.fillStyle="#746752";c.fillRect(-.22,-.16,.44,.34);c.fillStyle="#cbb78a";c.fillRect(-.208,-.155,.416,.3);
    c.fillStyle="#846e52";c.fillRect(.035,-.16,.024,.31);c.fillRect(-.205,.037,.42,.02);
    c.fillStyle="#eee1be";c.fillRect(-.158,-.093,.131,.08);c.restore();
  }
  window.BayClinicLaundry={stages,targets,read,count,slip,parcel,map};
})();
