/* Loose stock belongs to its stand. A second impact can spill only what was put back. */
(() => {
  "use strict";
  const gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z),clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  // The attendant's counter is on the sidewalk side of each stand.
  const sites=[
    ["ocean","box",150.02,-10.9,-1.57,153.30,-9.8,"Luz Mena",3],
    ["luna","board",6.75,49.1,-1.40,9.02,48.05,"Art Flores",1],
    ["mercado","crate",-45.2,-137.35,3.10,-43.8,-134.2,"Noé Parra",4],
    ["boardwalk","crate",150.6,92.1,-1.52,154.2,92.7,"Bibi Parra",5],
    ["palms","box",-77.95,-96.3,1.48,-81.5,-97.0,"Vic Ames",0],
    ["marquee","board",137.78,17.5,1.45,135.5,19.0,"Rafa Lobo",2]
  ];
  const kinds={
    box:{height:1.13,depth:.28,r:.42,mass:.29,threshold:3.3,stock:4,bit:"paper"},
    board:{height:1.05,depth:.30,r:.43,mass:.65,threshold:1.7,stock:0},
    crate:{height:.56,depth:.30,r:.47,mass:.49,threshold:2.3,stock:5,bit:"orange"}
  };
  const captions={bib:"Two sisters, two numbers, one finish",bell:"Little Dot’s missing bell turns up",pink:"Six spoonbills take the roof at El Mercado"};
  const frontPages=[
    ["Ocean Drive keeps the late shift","The last bus, the first supper rush and the people still on their feet when the beach chairs fold."],
    ["Five corners on the flower route","Before the lobby doors open, Bea Salas has already sent the first buckets down Palms Avenue."],
    ["A seat above the boardwalk","From her ticket window, Mags Duran can tell which Coast Wheel cabin is coming by the sound of its latch."]
  ];
  const archiveKey="sundownBay.pocketEditions.v1";
  const validIssue=q=>q&&Number.isSafeInteger(q.day)&&q.day>0&&["headline","deck","section","listing","local"].every(k=>typeof q[k]==="string"&&q[k].length<500)&&(!q.photo||Object.hasOwn(captions,q.photo));
  const issueId=q=>JSON.stringify([q.day,q.headline,q.deck,q.listing,q.local,q.pierPhoto?.image,q.gatePair?.start,q.gatePair?.end]);
  const pierLead=(day,stories,save,film)=>save.edition&&film?.published&&(film.day===day||!stories.length)?film.published:null;
  class Street{
    constructor(){
      this.props=sites.map(([id,kind,x,z,yaw,wx,wz,name,style])=>{
        const k=kinds[kind],motion=new BayPlayerMotion();
        const worker={x:wx,z:wz,yaw:yaw+.4,home:{x:wx,z:wz},name,style,motion,path:[],wait:0,pace:0,side:style%2?1:-1,role:"local"};
        return {id,kind,x,z,y:.07,yaw,tilt:0,home:{x,z,yaw},height:k.height,phase:"upright",stock:k.stock,worker,cool:0};
      });
      this.bits=[];this.hand=null;this.lift=null;this.serial=0;this.archive=[];this.readArchive();
      this.movingCells=new Set();
    }
    readArchive(){
      try{const raw=JSON.parse(localStorage.getItem(archiveKey));if(Array.isArray(raw))this.archive=raw.filter(validIssue).slice(-5).map(q=>{
        if(q.pierPhoto)q.pierPhoto=BayLotNegative.readFrame(q.pierPhoto);
        if(q.gatePair&&!BayFeaturePrint.validPair(q.gatePair))delete q.gatePair;
        return q;
      });}catch{}
    }
    indexOf(q){const id=issueId(q);return this.archive.findIndex(p=>issueId(p)===id);}
    forLuis(preferred){
      const chosen=preferred&&this.archive[this.indexOf(preferred)];
      if(chosen?.pierPhoto&&!chosen.signedByLuis)return chosen;
      return this.archive.findLast(q=>q.pierPhoto&&!q.signedByLuis);
    }
    forAda(){return this.archive.findLast(q=>q.gatePair&&!q.adaSigned);}
    sign(q,person="luis"){
      this.readArchive();
      const i=this.indexOf(q),issue=this.archive[i];
      const field=person==="ada"?"adaSigned":"signedByLuis";
      if(!issue||issue[field]||!(person==="ada"?issue.gatePair:issue.pierPhoto))return null;
      const next=this.archive.slice();next[i]={...issue,[field]:true};
      try{localStorage.setItem(archiveKey,JSON.stringify(next));}catch{return null;}
      this.archive=next;return next[i];
    }
    keep(q){
      this.readArchive();if(!validIssue(q)||this.indexOf(q)>=0)return false;
      const next=[...this.archive.slice(-4),q];try{localStorage.setItem(archiveKey,JSON.stringify(next));}catch{return false;}
      this.archive=next;return true;
    }
    edition(clock,stories,save,bill,film){
      const day=clock.day+1,pierPhoto=pierLead(day,stories,save,film);
      const story=!pierPhoto&&stories.length?stories[(day-1)%stories.length]:null,stunt=save.stunt,slot=frontPages[(day-1)%frontPages.length];
      let [headline,deck]=slot;
      if(pierPhoto){
        const portrait=pierPhoto.frame==="14B",print=save.edition==="print";
        headline=portrait?"Two lunches on the six o’clock boat":"Public landing goes up for sale";
        deck=portrait?(print?"The Luna audience knew Luis Vega before the lights came up. He is still carrying his brother’s blue tin.":"Luis Vega called Sol FM after the bulletin. For twenty-three years he packed two lunches for the crossing."):
          (print?"Mara Vega put the fine print on the big screen. The Port Sol ferry landing is listed with the shed.":"Dockhands heard the sale on Sol FM. The notice names the public landing as well as the shed.");
      }else if(story){headline=captions[story.id];deck=story.news;}
      else if(save.edition){headline="Lot 14 notice reaches the bay";deck=save.edition==="print"?"Mara Vega’s photograph of the Port Sol notice is on the bill at Cine Luna.":"Mara Vega took the Port Sol story to Sol FM. Dockhands heard the report before the end of their shift.";}
      else if(stunt){headline="Romy lands it on the flatbed";deck="The car meet’s "+stunt.distance.toFixed(1)+" m jump has earned a place on the Cine Luna poster.";}
      const local=clock.rain>.3?"A shower is moving through town. Route 6 regulars are sharing the awnings along Ocean.":clock.market==="open"?"El Mercado is open for the evening. Look for the striped awnings on Mercado Street.":"El Mercado’s evening stalls open at six. Port Sol is taking deliveries down on Gantry.";
      const run=save.engineSeven?.log.at(-1),watch=run?.day===day?"Station Seven filed an all-clear for "+run.title+". "+run.crew+" signed the return slip.":local;
      const pair=save.featurePrint?.pair;
      const supplement=BayFeaturePrint.validPair(pair)&&pair.day===day?{gatePair:{...pair}}:{};
      return {day,...supplement,headline,deck,photo:story?.id||null,...(pierPhoto?{pierPhoto}:{}),section:pierPhoto?"Port Sol":story?"Neighborhood edition":"City edition",local:watch,listing:bill.slice(0,3).map(f=>f.title).join("  /  ")};
    }
    impact(p,v,env){
      const k=kinds[p.kind],speed=Math.abs(v.speed),dir=v.speed<0?-1:1;
      let dx=v.vx||0,dz=v.vz||0;const mag=Math.hypot(dx,dz);
      if(mag>1){dx/=mag;dz/=mag;}else{dx=Math.sin(v.yaw)*dir;dz=Math.cos(v.yaw)*dir;}
      const local=BayDriving.local(v,p.x,p.z),side=clamp(local.x,-1,1),push=clamp(speed*k.mass,1.5,8);
      p.vx=dx*push+Math.cos(v.yaw)*side*.65;p.vz=dz*push-Math.sin(v.yaw)*side*.65;
      const heading=Math.atan2(p.vx,p.vz),sign=Math.cos(heading-p.yaw)>=0?1:-1;
      p.rollSide=sign;p.fallYaw=heading+(sign<0?Math.PI:0);p.spin=sign*(2.9+Math.min(4,push*.64));p.hop=.06+Math.min(.16,push*.018);p.vy=push*.18;
      p.phase="moving";p.contact=v;p.cool=1.05;p.worker.wait=9;p.worker.path=[];p.worker.target=null;
      if(this.lift===p)this.lift=null;
      const count=p.stock,issue=count&&p.kind==="box"?env.issue?.():null;p.stock=0;
      for(let i=0;i<count;i++){
        const n=++this.serial,a=n*2.39996,spread=.7+(n%5)*.36;
        this.bits.push({p,kind:k.bit,issue,x:p.x+Math.cos(a)*.24,z:p.z+Math.sin(a)*.20,y:p.y+k.height*.83,
          yaw:a,tilt:0,vx:p.vx*.63+Math.cos(a)*spread,vz:p.vz*.63+Math.sin(a)*spread,vy:1.4+(n%4)*.48,seed:n,age:0});
      }
      env.hit(p,v);
    }
    physics(dt,vehicles,env){
      // Most stands have no moving vehicle within striking distance. Use the
      // current positions, including vehicles that just changed lanes or slid.
      const cells=this.movingCells;cells.clear();
      for(const v of vehicles)if(Math.abs(v.speed)>=.28)cells.add(Math.floor(v.x/16)*65536+Math.floor(v.z/16));
      for(const p of this.props){
        const k=kinds[p.kind];p.cool=Math.max(0,p.cool-dt);
        if(p.contact&&(Math.abs(p.contact.x-p.x)>6||Math.abs(p.contact.z-p.z)>6||BayDriving.clearance(p.contact,p)>k.r+.45))p.contact=null;
        const left=Math.floor((p.x-5)/16),right=Math.floor((p.x+5)/16);
        const near=Math.floor((p.z-5)/16),far=Math.floor((p.z+5)/16);
        // A ten-metre window touches at most two cells on each axis. On
        // contact, keep the original vehicle order as a nudge can move the stand.
        if(!p.cool&&(cells.has(left*65536+near)||cells.has(left*65536+far)||
          cells.has(right*65536+near)||cells.has(right*65536+far)))for(const v of vehicles){
          if(v===p.contact||Math.abs(v.x-p.x)>5||Math.abs(v.z-p.z)>5||Math.abs(v.speed)<.28||BayDriving.clearance(v,p)>k.r)continue;
          if(Math.abs(v.speed)<k.threshold){
            const dx=Math.sin(v.yaw)*v.speed,dz=Math.cos(v.yaw)*v.speed;
            if(p.phase==="upright"&&(p.x-v.x)*dx+(p.z-v.z)*dz>0&&env.clear(p.x+dx*dt,p.z+dz*dt,k.r)){
              p.x+=dx*dt;p.z+=dz*dt;p.worker.wait=3;
            }
            continue;
          }
          this.impact(p,v,env);break;
        }
        if(p.phase==="moving"){
          const x=p.x+p.vx*dt,z=p.z+p.vz*dt;
          if(env.clear(x,p.z,k.r))p.x=x;else p.vx*=-.26;
          if(env.clear(p.x,z,k.r))p.z=z;else p.vz*=-.26;
          const drag=Math.exp(-2.05*dt);p.vx*=drag;p.vz*=drag;
          p.yaw+=turn(p.yaw,p.fallYaw)*(1-Math.exp(-5*dt));p.vy-=9*dt;p.hop=Math.max(0,p.hop+p.vy*dt);
          p.spin+=p.rollSide*6*dt;p.tilt+=p.spin*dt;
          if(Math.abs(p.tilt)>=Math.PI/2){p.tilt=p.rollSide*Math.PI/2;p.spin*=-.22;}
          if(Math.hypot(p.vx,p.vz)<.16&&Math.abs(p.tilt)>1.52){p.tilt=p.rollSide*Math.PI/2;p.phase="down";p.hop=0;}
        }
        // The sidewalk is fixed. Resample it as soon as the stand rolls or slides.
        if(p.x!==p.groundX||p.z!==p.groundZ){
          p.groundHeight=env.ground(p.x,p.z);p.groundX=p.x;p.groundZ=p.z;
        }
        p.y=p.groundHeight+k.depth*Math.abs(Math.sin(p.tilt))+(p.hop||0);
      }
      for(const b of this.bits){
        if(b.carrier){const a=b.carrier,q=BayDriving.world(a,.27,.32);b.x=q.x;b.z=q.z;b.y=env.ground(q.x,q.z)+.98+(a.startle?.lift||0);b.yaw=a.yaw;b.tilt=-.22;continue;}
        if(b.rest)continue;
        b.age+=dt;
        const paper=b.kind==="paper",floor=env.ground(b.x,b.z)+(paper?.018:.10),x=b.x+b.vx*dt,z=b.z+b.vz*dt;
        if(env.clear(x,b.z,.11))b.x=x;else b.vx*=-.35;
        if(env.clear(b.x,z,.11))b.z=z;else b.vz*=-.35;
        b.vy-=(paper?4.6:9.81)*dt;b.y+=b.vy*dt;b.yaw+=dt*(paper?1.6:Math.hypot(b.vx,b.vz)*4);
        b.tilt=paper?.56*Math.sin(b.age*6+b.seed):b.age*5;
        if(b.y<=floor){
          b.y=floor;b.vy=paper?0:Math.abs(b.vy)*.43;
          const drag=Math.exp(-(paper?8:3.5)*dt);b.vx*=drag;b.vz*=drag;
          if(b.vy<.24&&Math.hypot(b.vx,b.vz)<.14){b.rest=true;b.tilt=0;}
        }else if(paper){b.vx+=.78*Math.cos(b.age*5+b.seed)*dt;b.vz+=.66*Math.sin(b.age*6+b.seed)*dt;}
      }
    }
    near(hero){
      const nearBit=this.bits.filter(b=>b.rest&&!b.carrier&&gap(hero,b)<1.75).sort((a,b)=>gap(hero,a)-gap(hero,b))[0];
      const prop=this.props.find(p=>gap(hero,p)<2.32);
      if(this.hand)return {kind:prop===this.hand.p&&prop.phase==="upright"?"return":"carry",p:this.hand.p};
      if(prop?.phase==="down"||prop?.phase==="lifting"&&this.lift===prop)return {kind:"lift",p:prop};
      if(nearBit)return {kind:"pick",p:nearBit.p,b:nearBit};
      return prop?.phase==="upright"?{kind:prop.kind,p:prop}:null;
    }
    take(b,who){if(!b?.rest||b.carrier)return false;b.carrier=who;return true;}
    shelve(b){
      const i=this.bits.indexOf(b);if(i<0)return;
      this.bits.splice(i,1);b.p.stock++;if(this.hand===b)this.hand=null;
    }
    drop(){if(this.hand){const b=this.hand;b.carrier=null;b.rest=false;b.vx=b.vz=b.vy=0;this.hand=null;}}
    beginLift(p,player){
      if(p.phase!=="down")return false;p.phase="lifting";p.progress=0;
      if(player)this.lift=p;return true;
    }
    lifting(p,dt){
      p.progress=Math.min(1,p.progress+dt/(p.kind==="box"?1.65:1.05));
      const u=p.progress;p.tilt=p.rollSide*Math.PI*.5*(1-u*u*(3-2*u));
      if(u<1)return false;
      p.phase="upright";p.tilt=0;if(this.lift===p)this.lift=null;return true;
    }
    help(hero){
      const a=this.near(hero);if(!a)return false;
      if(a.kind==="pick"&&this.take(a.b,hero)){this.hand=a.b;return true;}
      if(a.kind==="return"){this.shelve(this.hand);return true;}
      if(a.kind==="lift")return this.beginLift(a.p,true);
      if(a.kind==="carry"){this.drop();return true;}
      return false;
    }
    stepLift(dt,hero,working){
      const p=this.lift;if(!p)return;
      if(!working||gap(hero,p)>2.5){p.phase="down";p.tilt=p.rollSide*Math.PI*.5;this.lift=null;return;}
      return this.lifting(p,dt);
    }
    walk(w,target,r,dt,env){
      if(gap(w,target)<r){w.path=[];return true;}
      if(w.target!==target||!w.path.length&&w.retry<=0){w.target=target;w.retry=.85;w.path=env.path(w,target,r)||[];}
      w.retry=(w.retry||0)-dt;const q=w.path[0];if(!q)return false;
      const dx=q.x-w.x,dz=q.z-w.z,d=Math.hypot(dx,dz),step=Math.min(d,1.75*dt);
      if(d<.035){w.path.shift();return false;}
      const x=w.x+dx/d*step,z=w.z+dz/d*step;
      if(!env.safe(x,z)){w.path=[];return false;}
      w.x=x;w.z=z;w.pace+=step;w.yaw+=turn(w.yaw,Math.atan2(dx,dz))*(1-Math.exp(-8*dt));
      if(d<=step+.002)w.path.shift();return false;
    }
    attendants(dt,focus,env){
      for(const p of this.props){
        const w=p.worker;if(gap(focus,p)>95&&!env.capNeedsService?.(p))continue;
        w.wait=Math.max(0,w.wait-dt);w.pace=0;let reaching=false;
        if(env.dodge?.(w,dt)){w.path=[];w.target=null;continue;}
        if(env.tendCap?.(p,w,dt)){
          w.motion.step(dt,w.pace,0);w.motion.crouch=w.atCap ? .34 : 0;
          w.motion.handTarget=w.atCap||w.carryCap?{x:.24,y:.92,z:.37,weight:1}:null;
          continue;
        }
        if(w.wait||p.phase==="moving"||this.lift===p){w.yaw+=turn(w.yaw,Math.atan2(p.x-w.x,p.z-w.z))*(1-Math.exp(-3*dt));}
        else if(p.phase==="lifting"){reaching=true;this.lifting(p,dt);}
        else if(p.phase==="down"){if(this.walk(w,p,1.04,dt,env))this.beginLift(p,false);}
        else if(w.bit){
          if(this.walk(w,p,1.0,dt,env)){this.shelve(w.bit);w.bit=null;w.wait=.35;}
        }else{
          const b=this.bits.find(b=>b.p===p&&b.rest&&!b.carrier);
          if(b){if(this.walk(w,b,.57,dt,env)&&this.take(b,w)){w.bit=b;w.wait=.3;}}
          else if(gap(p,p.home)>.08&&this.walk(w,p,1.04,dt,env)){
            const dx=p.home.x-p.x,dz=p.home.z-p.z,d=Math.hypot(dx,dz),f=Math.min(1,dt*.82/d);
            if(env.safe(p.x+dx*f,p.z+dz*f)&&env.safe(w.x+dx*f,w.z+dz*f)){
              p.x+=dx*f;p.z+=dz*f;w.x+=dx*f;w.z+=dz*f;w.pace=.82*dt;w.yaw=Math.atan2(dx,dz);reaching=true;
            }
          }else if(gap(p,p.home)<=.08){p.yaw+=turn(p.yaw,p.home.yaw)*(1-Math.exp(-3*dt));this.walk(w,w.home,.22,dt,env);}
        }
        w.motion.step(dt,w.pace,0);w.motion.crouch=reaching?.58:0;
        w.motion.handTarget=w.bit||reaching?{x:.27,y:reaching?.57:.99,z:.33,weight:1}:null;
      }
    }
  }
  window.BayPavement={Street,archiveKey,pierLead};
})();
