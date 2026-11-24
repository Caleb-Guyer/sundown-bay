/* The film crew reuses a transporter, a mill loading wedge and a dock gangway. */
(() => {
  "use strict";
  const cream="#e8d6ad",iron="#475451",rubber="#424744",tape="#eac778";
  const plans=new WeakMap();
  const timber=["#aa8a65","#b89a74","#a48362","#b29571","#a98e6f","#bb9c74","#a58966"];
  function draft(site){
    const surfaces=[],fittings=[],w=site.width/2,l=site.length,h=site.rise;
    const slope=z=>h*(1+z/l);
    // Keep the baked city and the overhead renderer on the same deck, road paint and landing marks.
    const polygon=(points,color,level)=>surfaces.push({points:points.map(([x,z])=>[x,level(z),z]),color});
    const rectangle=(x0,z0,x1,z1,color,level)=>polygon([[x0,z0],[x1,z0],[x1,z1],[x0,z1]],color,level);
    const floor=()=>.015,deck=z=>slope(z),paint=z=>slope(z)+.008,stencil=z=>slope(z)+.016;
    const box=(x,y,z,width,height,depth,color)=>fittings.push({type:"box",x,y,z,width,height,depth,color});
    const rod=(a,b,r,color,sides=4)=>fittings.push({type:"rod",a,b,r,color,sides});
    const face=(points,color)=>fittings.push({type:"face",points,color});
    const sideFace=(x,points,color)=>face(points.map(([z,y])=>[x,y,z]),color);
    const toeMark=site.id==="port"?"#acc3ae":site.id==="marlin"?"#e6d6bb":"#dcc184";
    for(const side of [-1,1]){
      const edge=side*w*.82,inward=-side*Math.min(.78,w*.38);
      for(const [z,dir] of [[site.min,1],[site.max,-1]]){
        rectangle(edge,z,edge+inward,z+dir*.16,toeMark,floor);
        rectangle(edge,z+dir*.16,edge-side*.14,z+dir*1.50,toeMark,floor);
      }
      for(const [offset,len] of [[.64,.98],[2.84,.74]])
        rectangle(edge,-l-offset-len,edge-side*.12,-l-offset,toeMark,floor);
    }
    // A paired wheel scuff leads across the gap into the marked box. It stays on the road surface.
    const scuff="#696b61",scuffLen=Math.min(2.8,(site.max-site.min)*.38);
    for(const side of [-1,1]){
      const x=side*w*.39,z=site.min+(.75+(side+1)*.17);
      polygon([[x-.10,z],[x+.08,z+.22],[x+.16,z+scuffLen],[x+.04,z+scuffLen+.32]],scuff,floor);
    }
    function lip(color){
      const top=.007;
      rectangle(-w,-.13,w,0,color,stencil);
      face([[-w,h-top,0],[w,h-top,0],[w,h-.16,0],[-w,h-.16,0]],color);
    }
    function cheeks(sheet,edge){
      for(const side of [-1,1]){
        const x=side*w,p=-l*.80;
        sideFace(x,[[-l,0],[0,h],[0,Math.max(.04,h-.20)],[p,Math.max(.015,slope(p)-.15)]],sheet);
        rod([x*.97,.043,p],[x*.97,.05,-.14],.047,edge);
        for(const f of [.68,.40,.14]){
          const z=-l*f;
          rod([x*.975,.05,z],[x*.975,slope(z)-.085,z],.045,edge);
        }
      }
    }
    const gapCenter=site.min*.52;
    if(site.id==="marlin"){
      const coral="#b76d59",aqua="#729b8f",satin="#b7b7a7";
      rectangle(-w,-l,w,0,"#797d72",deck);
      // Two perforated aluminium runways flank the film crew's sun-faded plywood centre.
      for(let i=0;i<5;i++)rectangle((-1+i*.4)*w*.53,-l,(-.61+i*.4)*w*.53,0,timber[i],paint);
      for(const side of [-1,1]){
        rectangle(side*w*.51,-l,side*w*.95,0,satin,paint);
        rectangle(side*w*.955,-l,side*w,0,coral,paint);
        for(let i=1;i<15;i++){
          const z=-l+i*l/15;
          for(const a of [.61,.78])
            rectangle(side*w*a,z,side*w*(a+.092),z+.10,"#727c77",stencil);
        }
        for(const f of [.24,.67]){
          const x=side*(w-.10),z=-l*f,r=Math.min(.37,slope(z)*.38);
          rod([x-side*.24,r+.015,z],[x,r+.015,z],r,rubber,12);
          rod([x,r+.015,z],[x+side*.018,r+.015,z],r*.54,satin,10);
          rod([x+side*.018,r+.015,z],[x+side*.03,r+.015,z],r*.20,coral,6);
        }
      }
      cheeks(coral,iron);
      // A clapper stripe is the crew's identifying paint, visible from the driver's seat.
      rectangle(-w*.49,-l*.36,w*.49,-l*.36+.49,iron,stencil);
      for(let i=0;i<4;i++){
        const x=-w*.46+w*.226*i,z=-l*.36;
        polygon([[x,z],[x+w*.105,z],[x+w*.183,z+.49],[x+w*.078,z+.49]],cream,t=>slope(t)+.023);
      }
      lip(aqua);
      // High-density camera packing mats, strapped flat beneath the jump.
      for(const [side,offset] of [[-1,-.30],[1,.31]]){
        const x=w*.47*side,z=gapCenter+offset;
        box(x,.066,z,w*.72,.13,.82,"#736f63");
        rectangle(x-w*.36,z-.41,x+w*.36,z+.41,side<0?"#a49b82":"#b6a38a",()=>.138);
        for(const d of [-.22,.22])rectangle(x+w*d-.045,z-.41,x+w*d+.045,z+.41,coral,()=>.145);
      }
    }else if(site.id==="foundry"){
      const mill="#666f69",rib="#8d9080",oxide="#98674c",yellow="#d4af5d";
      rectangle(-w,-l,w,0,mill,deck);
      // Mill plate with short alternating raised treads, a welded patch and folded channel sides.
      for(let r=0;r<12;r++)for(let col=0;col<6;col++){
        const x=w*(-.80+.299*col),z=-l+(r+.5+(col%2)*.25)*l/12;
        const dx=((r+col)%2?1:-1)*.15;
        polygon([[x-.045,z-.12],[x+.045,z-.12],[x+dx+.045,z+.12],[x+dx-.045,z+.12]],rib,paint);
      }
      for(const side of [-1,1]){
        const x=side*w;
        sideFace(x,[[-l,0],[0,h],[0,.03]],oxide);
        for(const f of [.20,.50,.74]){
          const z=-l*f,depth=Math.min(l*.093,.92);
          sideFace(x+side*.004,[[z,.13],[z+depth,.13],[z+depth,slope(z)*.78]],"#685b4c");
        }
        rectangle(x,-l,x-side*.16,0,yellow,paint);
      }
      rectangle(w*.20,-l*.58,w*.84,-l*.42,"#7b8177",stencil);
      for(const side of [-1,1])for(const d of [.53,.76]){
        const x=side*w*d,z=-l*.205;
        polygon([[x,z],[x+side*.10,z],[x-side*.20,z+.41],[x-side*.31,z+.41]],yellow,stencil);
      }
      lip("#9f9d85");
      for(const z of [gapCenter-.40,gapCenter+.38]){
        box(0,.045,z,w*1.58,.082,.22,oxide);
        box(0,.104,z,w*1.58,.064,.075,iron);
        rectangle(-w*.79,z-.13,w*.79,z+.13,oxide,()=>.145);
        rectangle(-w*.58,z-.11,-w*.43,z+.11,yellow,()=>.151);
      }
    }else{
      const teak="#977452",sea="#62887f",tar="#5c655d",wash="#c7b897";
      rectangle(-w,-l,w,0,tar,deck);
      const count=Math.max(12,Math.round(l/.47)),step=l/count;
      for(let i=0;i<count;i++){
        const z=-l+i*step;
        rectangle(-w+.025,z+.016,w-.025,z+step-.013,timber[(i*3+Math.floor(i/4))%7],paint);
        if(i%3===1){
          const x=i%2?w*.37:-w*.65;
          polygon([[x,z+.17],[x+w*.24,z+.15],[x+w*.33,z+.19],[x+w*.12,z+.198]],teak,stencil);
        }
        if(i%2===0)for(const side of [-1,1]){
          const x=side*w*.84;
          rectangle(x-.030,z+step*.49,x+.030,z+step*.61,tar,stencil);
        }
      }
      cheeks(teak,"#847459");
      for(const side of [-1,1]){
        const x=side*(w-.08);
        for(const f of [.14,.46,.75]){
          const z=-l*f,y=Math.max(.06,slope(z)-.19);
          rod([x-side*.06,y-.015,z-.16],[x,y,z+.16],.085,"#657675",8);
        }
        for(const f of [.19,.59])rectangle(x-side*.08,-l*f,x,-l*f+step*1.65,sea,stencil);
      }
      lip(wash);
      // The gangway spans painted fenders laid out for repair. Both ends carry a tarred eye.
      for(const [i,x] of [[0,-w*.54],[1,w*.03],[2,w*.43]]){
        const z=gapCenter+(i%2?.24:-.18),d=i===1?.57:.41;
        rod([x,.105,z-d],[x,.105,z+d],.105,i===1?sea:tar,8);
        for(const side of [-1,1])rod([x,.105,z+side*d],[x,.105,z+side*(d+.08)],.067,wash,7);
        rectangle(x-.085,z-d,x+.085,z+d,i===1?sea:tar,()=>.212);
        rectangle(x-.075,z-d+.12,x+.075,z-d+.19,wash,()=>.218);
      }
    }
    return {surfaces,fittings};
  }
  function plan(site){
    if(!plans.has(site))plans.set(site,draft(site));
    return plans.get(site);
  }
  function build(mesh,sites){
    for(const site of sites){
      const base=site.base??.085;
      const world=([x,y,z])=>{const p=BayDriving.world(site,x,z);return [p.x,base+y,p.z];};
      const {surfaces,fittings}=plan(site);
      for(const item of fittings){
        if(item.type==="box"){
          const p=BayDriving.world(site,item.x,item.z);
          mesh.box(p.x,base+item.y,p.z,item.width,item.height,item.depth,item.color,site.yaw);
        }else if(item.type==="rod")mesh.pole(world(item.a),world(item.b),item.r,item.color,item.sides);
        else{
          const pts=item.points.map(world);
          if(pts.length===3)mesh.tri(...pts,item.color);else mesh.quad(...pts,item.color);
        }
      }
      for(const face of surfaces)mesh.quad(...face.points.map(world),face.color);
    }
  }
  function overhead(ctx,px,py,s,site){
    ctx.save();ctx.translate(px(site.x),py(site.z));ctx.rotate(site.yaw);ctx.scale(s,-s);
    for(const {points,color} of plan(site).surfaces){
      ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(points[0][0],points[0][2]);
      for(let i=1;i<points.length;i++)ctx.lineTo(points[i][0],points[i][2]);
      ctx.closePath();ctx.fill();
    }
    ctx.restore();
  }
  window.BayPictureJumpArt=Object.freeze({build,overhead});
})();
