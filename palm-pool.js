/* Palm house eight-ball. Positions and speeds on the cloth are in metres and metres/second. */
(() => {
  "use strict";
  const X=.635,Z=1.27,R=.028575,D=R*2,corner=.097,side=.071;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n)),pt=(x,z)=>({x,z}),gap=(a,b)=>Math.hypot(a.x-b.x,a.z-b.z);
  const pockets=[pt(-X,-Z),pt(X,-Z),pt(X,0),pt(X,Z),pt(-X,Z),pt(-X,0)];
  const rails=[];
  function segment(ax,az,bx,bz){
    const dx=bx-ax,dz=bz-az;rails.push({ax,az,bx,bz,dx,dz,len:dx*dx+dz*dz});
  }
  for(const a of [-1,1]){
    segment(-X+corner,a*Z,X-corner,a*Z);
    for(const b of [-1,1]){
      segment(a*X,b*side,a*X,b*(Z-corner));
      segment(a*X,b*side,a*(X+.033),b*(side-.017));
      segment(a*X,b*(Z-corner),a*(X+.033),b*(Z-corner+.030));
      segment(a*(X-corner),b*Z,a*(X-corner+.030),b*(Z+.033));
    }
  }
  const group=id=>id===0||id===8?"":id<8?"solids":"stripes";
  const other=g=>g==="solids"?"stripes":"solids";
  const makeBall=(id,x,z)=>({id,x,z,vx:0,vz:0,rollX:0,rollZ:0,down:false,drop:0,pocket:-1});
  function seeded(seed){
    let value=(seed>>>0)||1;
    return ()=>{value=(Math.imul(value,1664525)+1013904223)>>>0;return value/4294967296;};
  }
  function rack(style,random,variant){
    const balls=[makeBall(0,style==="full"?0:.09,-.82)];
    if(style!=="full"){
      const mirror=variant%2?-1:1,rev=variant%4>1?-1:1;
      const pts=[[0,.09,-.82],[1,-.245,.22],[9,.30,-.13],[8,.065,.60]];
      return pts.map(([id,x,z])=>makeBall(id,x*mirror,z*rev));
    }
    const ids=[1,2,3,4,5,6,7,9,10,11,12,13,14,15];
    for(let i=ids.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[ids[i],ids[j]]=[ids[j],ids[i]];}
    const solid=ids.splice(ids.findIndex(n=>n<8),1)[0],stripe=ids.splice(ids.findIndex(n=>n>8),1)[0];
    const corners=random()>.5?[solid,stripe]:[stripe,solid];
    for(let row=0;row<5;row++)for(let col=0;col<=row;col++){
      const id=row===2&&col===1?8:row===4&&col===0?corners[0]:row===4&&col===4?corners[1]:ids.pop();
      balls.push(makeBall(id,(col-row*.5)*(D+.00020),.34+row*(Math.sqrt(3)*R+.00018)));
    }return balls;
  }
  const pocketName=["near left corner","near right corner","right side","far right corner","far left corner","left side"];
  function validSpot(balls,x,z,except=0){
    return Math.abs(x)<X-R-.001&&Math.abs(z)<Z-R-.001&&pockets.every(p=>Math.hypot(x-p.x,z-p.z)>.067)&&
      balls.every(b=>b.id===except||b.down||b.pocket>=0||Math.hypot(x-b.x,z-b.z)>D+.0003);
  }
  function openSpot(balls,origin,id){
    if(validSpot(balls,origin.x,origin.z,id))return origin;
    for(let ring=1;ring<30;ring++)for(let j=0;j<ring*8;j++){
      const a=j*Math.PI*2/(ring*8),x=origin.x+Math.sin(a)*ring*D,z=origin.z+Math.cos(a)*ring*D;
      if(validSpot(balls,x,z,id))return pt(x,z);
    }
    return null;
  }
  function rayCircle(from,ux,uz,x,z,r){
    const dx=x-from.x,dz=z-from.z,along=dx*ux+dz*uz,cross=dx*uz-dz*ux;
    if(Math.abs(cross)>=r||along<0)return Infinity;
    const at=along-Math.sqrt(Math.max(0,r*r-cross*cross));return at>=-.001?Math.max(0,at):Infinity;
  }
  function firstContact(balls,from,angle,omit=0){
    const dx=Math.sin(angle),dz=Math.cos(angle);let at=3.2,hit=null,rail=false;
    for(const s of rails){
      const len=Math.sqrt(s.len),nx=-s.dz/len,nz=s.dx/len,div=dx*nx+dz*nz;
      if(Math.abs(div)>.00001)for(const sign of [-1,1]){
        const t=((s.ax-from.x)*nx+(s.az-from.z)*nz+sign*R)/div;
        if(t<.001||t>=at)continue;
        const f=((from.x+dx*t-s.ax)*s.dx+(from.z+dz*t-s.az)*s.dz)/s.len;
        if(f>=0&&f<=1){at=t;rail=true;}
      }
      for(const [x,z] of [[s.ax,s.az],[s.bx,s.bz]]){const t=rayCircle(from,dx,dz,x,z,R);if(t<at){at=t;rail=true;}}
    }
    for(const b of balls){
      if(b.id===omit||b.down||b.pocket>=0)continue;
      const t=rayCircle(from,dx,dz,b.x,b.z,D);if(t<at){at=t;hit=b;rail=false;}
    }
    return {x:from.x+dx*at,z:from.z+dz*at,hit,rail,distance:at};
  }
  function clearLine(balls,a,b,omit1,omit2){
    const dx=b.x-a.x,dz=b.z-a.z,len=Math.hypot(dx,dz);if(len<.001)return true;
    return balls.every(o=>o.down||o.pocket>=0||o.id===omit1||o.id===omit2||rayCircle(a,dx/len,dz/len,o.x,o.z,D+.002)>len);
  }
  class Rack{
    constructor(style="full",seed=1,breaker=0){
      this.style=style;this.random=seeded(seed);this.balls=rack(style,this.random,seed-1);
      this.turn=breaker;this.breaking=style==="full";this.groups=["",""];this.phase="aim";this.shots=0;this.fouls=[0,0];
      this.run=0;this.bestRun=[0,0];this.winner=null;this.result="";this.called=-1;this.accumulator=0;this.loud=0;
      this.notice=this.breaking?"Break from behind the head string.":"Open table. Choose a solid or a stripe.";
    }
    get cue(){return this.balls[0];}
    left(g){return this.balls.filter(b=>!b.down&&b.pocket<0&&group(b.id)===g).length;}
    onBlack(who=this.turn){const g=this.groups[who];return !!g&&!this.left(g);}
    legal(id,who=this.turn){return id>0&&(this.onBlack(who)?id===8:id!==8&&(!this.groups[who]||group(id)===this.groups[who]));}
    canPlace(x,z){return validSpot(this.balls,x,z);}
    place(x,z){if(this.phase!=="hand"||!this.canPlace(x,z))return false;Object.assign(this.cue,{x,z});this.phase="aim";return true;}
    call(n){if(this.phase!=="aim"||!this.onBlack()||!Number.isInteger(n)||!pockets[n])return false;this.called=n;return true;}
    strike(angle,power){
      if(this.phase!=="aim"||!Number.isFinite(angle)||!Number.isFinite(power)||this.onBlack()&&this.called<0)return false;
      const speed=.26+4.4*clamp(power,.015,1)**1.35;
      this.shot={first:0,rails:new Set(),railAfter:false,pots:[],target:this.groups[this.turn],black:this.onBlack(),called:this.called,break:this.breaking};
      this.cue.vx=Math.sin(angle)*speed;this.cue.vz=Math.cos(angle)*speed;this.phase="roll";this.shots++;this.accumulator=0;return true;
    }
    respot(id,where){
      const b=this.balls.find(v=>v.id===id),p=openSpot(this.balls,where,id);
      if(b&&p)Object.assign(b,makeBall(id,p.x,p.z));
    }
    sink(b,i,events){b.pocket=i;b.drop=.001;b.vx=b.vz=0;this.shot.pots.push({id:b.id,i});events?.("pocket",1,b);}
    pushRail(b,s,events){
      const u=clamp(((b.x-s.ax)*s.dx+(b.z-s.az)*s.dz)/s.len,0,1),cx=s.ax+s.dx*u,cz=s.az+s.dz*u;
      const dx=b.x-cx,dz=b.z-cz,d2=dx*dx+dz*dz;if(d2>=R*R||d2<1e-14)return;
      const d=Math.sqrt(d2),nx=dx/d,nz=dz/d,speed=b.vx*nx+b.vz*nz;
      b.x+=nx*(R-d+.000005);b.z+=nz*(R-d+.000005);
      if(speed>=0)return;
      b.vx=(b.vx-1.83*speed*nx)*.985;b.vz=(b.vz-1.83*speed*nz)*.985;
      if(this.shot.first){this.shot.railAfter=true;if(b.id)this.shot.rails.add(b.id);}
      if(speed<-.16)events?.("rail",-speed,b);
    }
    collide(a,b,events){
      const dx=b.x-a.x,dz=b.z-a.z,d2=dx*dx+dz*dz;if(d2>=D*D||d2<1e-16)return;
      const d=Math.sqrt(d2),nx=dx/d,nz=dz/d,over=(D-d)*.501;
      a.x-=nx*over;a.z-=nz*over;b.x+=nx*over;b.z+=nz*over;
      const approach=(a.vx-b.vx)*nx+(a.vz-b.vz)*nz;if(approach<=0)return;
      const impulse=.976*approach;a.vx-=impulse*nx;a.vz-=impulse*nz;b.vx+=impulse*nx;b.vz+=impulse*nz;
      if(!this.shot.first&&(!a.id||!b.id))this.shot.first=a.id||b.id;
      if(approach>.12)events?.("ball",approach,b);
    }
    substep(dt,events){
      let motion=false;const balls=this.balls;
      for(let i=0;i<balls.length;i++){
        const b=balls[i];if(b.down)continue;
        if(b.pocket>=0){const p=pockets[b.pocket];b.drop=Math.min(1,b.drop+dt*3.7);b.x+=(p.x-b.x)*Math.min(1,dt*12);b.z+=(p.z-b.z)*Math.min(1,dt*12);
          if(b.drop===1)b.down=true;else motion=true;continue;}
        const speed=Math.hypot(b.vx,b.vz);if(speed<.009){b.vx=b.vz=0;continue;}
        motion=true;const e=Math.max(0,1-dt*(.38+.14*speed)/speed);b.vx*=e;b.vz*=e;
        const dx=b.vx*dt,dz=b.vz*dt;b.x+=dx;b.z+=dz;b.rollX+=dz/R;b.rollZ-=dx/R;
        if(Math.abs(b.x)>X-.13||Math.abs(b.z)>Z-.13){
          let capture=-1;
          for(let j=0;j<6;j++){
            const p=pockets[j],h=Math.hypot(b.x-p.x,b.z-p.z);
            if(h<(p.z===0?.047:.057)||h<.12&&(Math.abs(b.x)>X+.034||Math.abs(b.z)>Z+.034)){capture=j;break;}
          }
          if(capture>=0){this.sink(b,capture,events);continue;}
          for(const rail of rails)this.pushRail(b,rail,events);
        }
      }
      for(let i=0;i<balls.length;i++){const a=balls[i];if(a.down||a.pocket>=0)continue;
        for(let j=i+1;j<balls.length;j++){const b=balls[j];if(!b.down&&b.pocket<0)this.collide(a,b,events);}}
      return motion;
    }
    step(dt,events){
      if(this.phase!=="roll")return false;
      this.accumulator+=Math.min(.20,Math.max(0,dt));const slice=1/240;
      while(this.accumulator>=slice-1e-10){
        this.accumulator-=slice;
        if(!this.substep(slice,events)){this.finish();return true;}
      }return false;
    }
    finish(){
      const s=this.shot,who=this.turn,opp=1-who,first=s.first,pots=s.pots.map(p=>p.id),eight=s.pots.find(p=>p.id===8);
      const wrong=s.black?first!==8:first===8||s.target&&group(first)!==s.target;
      let foul=pots.includes(0)?"Scratch":!first?"No object ball hit":wrong?"Wrong first ball":
        s.break&&!pots.length&&s.rails.size<4?"Four balls must reach a rail on the break":
        !s.railAfter&&!pots.length?"No rail after contact":"";
      if(this.style==="practice"){
        if(eight)this.respot(8,pt(.015,.56));
        if(pots.includes(0))this.respot(0,pt(0,-.74));
        if(this.balls.every(b=>b.id===0||b.id===8||b.down)){this.balls=rack("practice",this.random,this.shots);this.notice="Fresh practice layout.";}
        else this.notice=pots.filter(Boolean).length?"Pocketed. Line up another.":"Take another shot.";
        this.phase="aim";return;
      }
      if(eight&&s.break)this.respot(8,pt(0,.34));
      else if(eight){
        this.winner=!foul&&s.black&&eight.i===s.called?who:opp;this.phase="result";
        this.result=this.winner===who?"Called eight in the "+pocketName[eight.i]+".":foul?foul+" on the eight.":s.black?"Eight in the wrong pocket.":"The eight went early.";
        this.notice=this.result;return;
      }
      this.breaking=false;this.called=-1;
      if(!s.break&&!foul&&!s.target){const made=pots.find(id=>group(id));if(made){this.groups[who]=group(made);this.groups[opp]=other(this.groups[who]);}}
      const own=pots.filter(id=>s.break?id!==0&&id!==8:group(id)&&group(id)===this.groups[who]).length;
      if(!foul&&own){this.run+=own;this.bestRun[who]=Math.max(this.bestRun[who],this.run);}
      else{this.turn=opp;this.run=0;}
      if(foul){
        this.fouls[who]++;this.respot(0,pt(0,-.69));this.phase="hand";this.notice=foul+". Ball in hand.";
      }else{this.phase="aim";this.notice=s.break?"Table open after the break.":own?"Made "+own+". Same shooter.":"Change of turn.";}
      if(this.phase==="aim"&&this.onBlack())this.notice="Call a pocket for the eight.";
    }
    guide(angle){return firstContact(this.balls,this.cue,angle);}
    plan(skill=1,from=this.cue){
      if(this.breaking)return {angle:Math.atan2(-from.x+.008,.34-from.z),power:.93,pocket:-1};
      let best=null,backup=null;
      for(const b of this.balls){
        if(b.down||b.pocket>=0||!this.legal(b.id))continue;
        const direct=Math.atan2(b.x-from.x,b.z-from.z),clear=clearLine(this.balls,from,b,0,b.id);
        const safety=(clear?2:0)-gap(from,b);
        if(!backup||safety>backup.value)backup={angle:direct,power:.36,pocket:0,value:safety,id:b.id};
        for(let j=0;j<6;j++){
          const p=pockets[j],dist=gap(b,p);if(dist<.001)continue;
          const nx=(p.x-b.x)/dist,nz=(p.z-b.z)/dist,ghost=pt(b.x-D*nx,b.z-D*nz),cueDist=gap(from,ghost);
          if(cueDist<.015||Math.abs(ghost.x)>X-R+.004||Math.abs(ghost.z)>Z-R+.004)continue;
          const dx=(ghost.x-from.x)/cueDist,dz=(ghost.z-from.z)/cueDist,dot=dx*nx+dz*nz;
          if(dot<.17||!clearLine(this.balls,from,ghost,0,b.id)||!clearLine(this.balls,b,p,b.id,0))continue;
          const cost=cueDist*.48+dist*.93+(1-dot)*2.1;
          if(!best||cost<best.value){
            const speed=Math.sqrt(.28+1.18*dist)/(Math.max(.2,dot)*.965);
            const launch=Math.sqrt(speed*speed+1.16*cueDist);
            best={id:b.id,pocket:j,angle:Math.atan2(dx,dz),power:clamp(((launch-.26)/4.4)**(1/1.35)+.045,.22,.96),value:cost};
          }
        }
      }
      const p=best||backup||{angle:0,power:.46,pocket:0};if(skill<1)p.angle+=(this.random()-.5)*(.014+.13*(1-skill));return p;
    }
    handPlan(skill){
      let option=null;
      for(const b of this.balls)if(!b.down&&this.legal(b.id))for(const p of pockets){
        const d=gap(b,p)||1,q=pt(b.x+.27*(b.x-p.x)/d,b.z+.27*(b.z-p.z)/d);
        if(!this.canPlace(q.x,q.z))continue;
        const s=this.plan(1,q),value=s.value??10;if(!option||value<option.value)option={q,value};
      }
      const q=option?.q||openSpot(this.balls,pt(0,-.71),0);if(q)this.place(q.x,q.z);
      return this.plan(skill);
    }
  }
  window.BayPalmPool={Rack,X,Z,R,pockets,pocketName,group,validSpot};
})();
