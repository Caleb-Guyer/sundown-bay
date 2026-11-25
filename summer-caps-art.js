/* Cast-iron posts, enamel splash buttons and looping parcels of airborne water. */
(() => {
  "use strict";
  const blue="#498baf",steel="#556965",brass="#c7a96d",ivory="#f2e4bf",aqua="#a9dfdc",white="#e2f4e9";
  const tau=Math.PI*2;
  function post(g,s){
    g.cyl(0,.055,0,.38,.40,.11,10,"#6e7569");
    g.cyl(0,.14,0,.26,.30,.14,10,steel);g.cyl(0,.47,0,.205,.255,.55,12,s.ink);
    g.cyl(0,.78,0,.247,.207,.12,12,s.ink);g.cyl(0,.855,0,.24,.25,.050,12,brass);
    g.cyl(0,.882,0,.16,.16,.018,10,"#334748");
    for(const side of [-1,1]){
      g.pole([side*.14,.51,0],[side*.315,.51,0],.116,s.ink,8);
      g.pole([side*.30,.51,0],[side*.33,.51,0],.127,steel,8);
      g.pole([side*.327,.51,0],[side*.36,.51,0],.054,brass,6);
    }
    for(let i=0;i<6;i++){const a=i*tau/6;g.cyl(Math.cos(a)*.256,.15,Math.sin(a)*.256,.027,.028,.039,6,brass);}
    g.box(0,.58,.221,.165,.135,.019,ivory);g.box(0,.58,.234,.077,.037,.012,steel);
  }
  function lid(g){
    g.cyl(0,.018,0,.247,.245,.057,12,blue);g.cyl(0,.097,0,.106,.242,.115,12,blue);
    g.cyl(0,.172,0,.06,.08,.043,6,brass);
    for(let i=-2;i<=2;i++)g.box(i*.059,.060,.188-.014*i*i,.021,.032,.023,steel);
  }
  function panel(g){
    g.cyl(0,.078,0,.22,.24,.145,8,steel);g.box(0,.58,0,.115,.95,.125,"#638883");
    g.box(0,1.10,0,.52,.51,.11,steel);g.box(0,1.10,.062,.46,.445,.023,ivory);
    for(let i=-1;i<=1;i++)g.pole([0,1.13,.081],[i*.086,1.242-.034*Math.abs(i),.081],.011,blue,4);
    g.box(0,1.28,.079,.25,.023,.014,steel);
  }
  // The same trajectories drive the 3D jets and their overhead splashes.
  function parcel(burst,i,u,p){
    if(burst){
      const a=i*2.39996,r=(.35+(i%4)*.31)*u*u;
      return [Math.sin(a)*r*p,.88+p*(4*(3.0+(i%4)*.31)*u*(1-u)-.8*u),p*(.20+Math.cos(a)*r+.65*u)];
    }
    return [(i-3)*.42*u*p,.91+p*(4*(.67+.19*(1-Math.abs(i-3)/3))*u*(1-u)-.82*u),.16+u*(2.58+.24*(3-Math.abs(i-3)))*p];
  }
  function stream(g,burst,frame,pressure){
    const count=burst?11:7;
    for(let i=0;i<count;i++){
      const width=(burst?.045:.021)*pressure;
      const point=u=>parcel(burst,i,u,pressure);
      for(let j=0;j<8;j++){
        const u=(j+(frame/12+i*.319)%1)/8;
        const a=point(u),b=point(Math.min(1,u+.057+(j<3?.035:0)));
        g.pole(a,b,width*(1-u*.30),((i+j)%4? aqua:white),4);
      }
      const a=point(1),u=(frame/12+i*.267)%1,r=.07+u*.25;
      for(let j=0;j<3;j++){const ang=i+j*tau/3;g.pole([a[0]+Math.sin(ang)*r,.065,a[2]+Math.cos(ang)*r],
        [a[0]+Math.sin(ang)*(r+.06),.09+.05*(1-u),a[2]+Math.cos(ang)*(r+.06)],width,white,4);}
    }
  }
  function world(list,model,network,see,time,ground){
    for(const s of network.posts){
      if(!see(s,88))continue;
      const base=ground(s.x,s.z),name="summer/post/"+s.id;
      model(name,g=>post(g,s));list.push([name,s.x,base,s.z,s.yaw]);
      model("summer/panel",panel);list.push(["summer/panel",s.button.x,ground(s.button.x,s.button.z),s.button.z,s.yaw]);
      const q=BayDriving.world({...s.button,yaw:s.yaw},0,s.buttonDip?.087:.105);
      model("summer/button",g=>g.pole([0,1.002,0],[0,1.002,.038],.068,blue,10));
      list.push(["summer/button",q.x,ground(q.x,q.z),q.z,s.yaw]);
      model("summer/lid",lid);
      const c=s.cap;if(c)list.push(["summer/lid",c.x,ground(c.x,c.z)+c.y,c.z,c.yaw,c.spin]);
      else list.push(["summer/lid",s.x,base+.89,s.z,s.yaw]);
      if(s.pressure<.13||!see(s,64))continue;
      const p=Math.max(1,Math.round(s.pressure*4)),frame=p===4?Math.floor(time*12)%12:Math.floor(time*4)%3*4,burst=s.flow==="burst",jet="summer/"+s.flow+"/"+p+"/"+frame;
      model(jet,g=>stream(g,burst,frame,p*.25));list.push([jet,s.x,base,s.z,s.yaw]);
    }
  }
  function map(c,o,px,py,s,visible){
    if(o.mode!=="street")return;
    for(const post of o.summerCaps.posts){
      if(!visible(px(post.x),py(post.z),7*s))continue;
      const dot=(x,z,r,color)=>{c.fillStyle=color;c.beginPath();c.arc(px(x),py(z),Math.max(.8,r*s),0,tau);c.fill();};
      dot(post.button.x,post.button.z,.28,ivory);dot(post.button.x,post.button.z,.11,blue);
      dot(post.x,post.z,.34,steel);dot(post.x,post.z,.26,post.ink);if(!post.cap)dot(post.x,post.z,.18,blue);
      if(post.cap){dot(post.cap.x,post.cap.z,.23,blue);dot(post.cap.x,post.cap.z,.08,brass);}
      if(post.pressure<.13)continue;
      const burst=post.flow==="burst",frame=Math.floor((o.time||0)*12)%12;
      for(let i=0;i<(burst?11:7);i++)for(let j=0;j<6;j++){
        const u=(j+(frame/12+i*.319)%1)/6,p=parcel(burst,i,u,post.pressure),q=parcel(burst,i,Math.min(1,u+.105),post.pressure);
        const a=BayDriving.world(post,p[0],p[2]),b=BayDriving.world(post,q[0],q[2]);
        c.strokeStyle=i%3?aqua:white;c.lineWidth=Math.max(1,(burst?.06:.03)*s);
        c.beginPath();c.moveTo(px(a.x),py(a.z));c.lineTo(px(b.x),py(b.z));c.stroke();
      }
    }
  }
  window.BaySummerCapsArt={world,map};
})();
