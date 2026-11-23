/* Inez's engine-room uniform and the Paloma company boarding slip. */
(() => {
  "use strict";
  const palette=["#a16c4d","#ce9a4f","#3d575a"];
  const ink="#244c4d",oxide="#a24c39",paper="#eee0bd";
  function dress(g,markPart){
    markPart?.("body");
    const bib="#455e5c",seam="#859084";
    g.box(0,1.221,.116,.247,.232,.031,bib);
    for(const s of [-1,1]){
      g.quad([s*.085,1.30,.134],[s*.137,1.30,.130],[s*.165,1.444,.076],[s*.118,1.451,.087],bib);
      g.box(s*.111,1.318,.139,.039,.033,.010,"#c6a36b");
    }
    g.box(0,1.233,.136,.101,.067,.012,seam);
    g.box(0,1.240,.143,.095,.013,.005,"#e7c795");
    g.box(-.064,1.272,.137,.010,.064,.009,"#b9513d");
    markPart?.("head");
    g.cyl(0,1.708,-.011,.105,.113,.085,10,"#364c4c");
    g.cyl(0,1.747,-.024,.085,.105,.047,10,bib);
    g.box(0,1.69,.1,.168,.018,.112,bib);g.box(0,1.713,.099,.046,.026,.012,"#d9bd82");
    markPart?.("held",1);
    const red="#a44938",rim="#d7b38a",x=.246,z=.061;
    g.box(x,.839,z,.161,.159,.243,red);g.box(x,.919,z,.173,.03,.254,"#ba5c45");
    g.box(x,.767,z,.163,.014,.247,rim);
    for(const dz of [-.057,.057])g.pole([x,.925,z+dz],[x,.973,z+dz],.010,"#725652",5);
    g.pole([x,.973,z-.057],[x,.973,z+.057],.011,"#544a44",5);
    g.box(x+.082,.882,z,.009,.019,.125,"#e0c19a");
  }
  function ticket(canvas,routeName){
    const c=canvas.getContext("2d");if(!c)return;
    const w=canvas.width,h=canvas.height;
    c.save();c.scale(w/760,h/190);c.fillStyle=paper;c.fillRect(0,0,760,190);
    c.strokeStyle=ink;c.lineWidth=2;c.strokeRect(9,9,742,172);
    c.beginPath();c.moveTo(23,44);c.lineTo(565,44);c.moveTo(23,140);c.lineTo(565,140);c.stroke();
    c.fillStyle=ink;c.font='600 16px "Courier New",monospace';c.fillText("PORT SOL  /  FERRY COMPANY",25,33);
    c.font='bold 55px Georgia,serif';c.fillText("M/V Paloma",21,104);
    c.font='600 17px "Courier New",monospace';c.fillText(routeName.toUpperCase(),26,131);
    c.font='15px "Courier New",monospace';c.fillText("ENGINE ROOM   /   CREW PASSAGE",26,165);
    c.save();c.setLineDash([4,5]);c.lineWidth=1.5;c.beginPath();c.moveTo(583,9);c.lineTo(583,181);c.stroke();c.restore();
    c.save();c.translate(669,95);c.rotate(-.07);c.strokeStyle=oxide;c.fillStyle=oxide;
    c.beginPath();c.arc(0,0,60,0,Math.PI*2);c.stroke();c.beginPath();c.arc(0,0,55,0,Math.PI*2);c.stroke();
    c.textAlign="center";c.font='bold 16px Georgia,serif';c.fillText("PORT SOL",0,-27);
    c.beginPath();c.moveTo(-32,0);c.quadraticCurveTo(-12,-12,-2,0);c.quadraticCurveTo(11,-17,32,-18);
    c.quadraticCurveTo(12,-7,1,8);c.quadraticCurveTo(-10,0,-32,0);c.fill();
    c.font='bold 16px "Courier New",monospace';c.fillText("CREW",0,28);c.restore();c.restore();
  }
  window.BayFerryPassengerArt={palette,dress,ticket};
})();
