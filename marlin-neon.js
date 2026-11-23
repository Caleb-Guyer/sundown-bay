/* Vera's five-contact sign sequencer drives both of the motel's actual signs. */
(() => {
  "use strict";
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
  const bench={x:133.0,z:-55.6,y:.076,yaw:0,id:"marlin-neon",kind:"sign-shop",name:"Vera’s sign bench"};
  const desk={x:126.65,z:-45,y:12.07,yaw:Math.PI/2,kind:"roof-console",name:"Marlin rooftop sequencer"};
  const home={x:134.38,z:-55.76},corner={x:135.83,z:-48.4},service={...desk,x:127.58,z:-44.98};
  const designs=[
    {id:"tide",name:"Sea Glass Sweep",color:"#65f6d5",accent:"#ffd786",order:[0,1,2,3,4],line:"Five green letters from the top down, like the old postcard."},
    {id:"coral",name:"Coral Double",color:"#ff786c",accent:"#ffe48d",order:[2,1,3,0,4],line:"Start in the middle. I want the coral to spread out like a pair of wings."},
    {id:"midnight",name:"Midnight Vacancy",color:"#c895ff",accent:"#69ddff",order:[4,3,2,1,0],line:"Violet from the bottom up. Let the last letter linger."}
  ];
  const find=id=>designs.find(d=>d.id===id);
  function read(raw){
    const best={};for(const d of designs){const n=raw?.best?.[d.id];if(Number.isInteger(n)&&n>=0&&n<=100)best[d.id]=n;}
    return {best,orders:Number.isSafeInteger(raw?.orders)?clamp(raw.orders,0,1000000):0,
      program:find(raw?.program)&&Object.hasOwn(best,raw.program)?raw.program:""};
  }
  const rooms=[
    {x:131.6,z:-60.2,y:.076,rest:10},{x:130.25,z:-59.05,y:.076},
    {x:130.25,z:-50.80,y:3.465},{x:130.77,z:-48.4,y:3.465},{x:130.77,z:-39.1,y:3.465},
    {x:131.05,z:-36.7,y:3.465},{x:131.05,z:-25.8,y:3.465},{x:130.59,z:-23.7,y:3.465,rest:16}
  ];
  class Service{
    constructor(saved){
      this.saved=saved;this.bench=bench;this.console=desk;this.service=service;
      this.vera={...home,y:.076,yaw:-1.65,phase:"bench",stride:0,moving:false};
      this.guest={...rooms[0],name:"Nellie Park",yaw:-.18,phase:0,moving:false,at:1,dir:1,wait:4,style:2};
      this.shift=null;this.testing=false;this.program=saved.program||"tide";
      const initial=find(this.program);this.color=initial.color;this.accent=initial.accent;
      this.lights=[.6,.7,.8,.7,.8];this.ambient=12;this.view=0;
    }
    begin(id){
      if(this.shift||!find(id))return false;
      this.shift={id,stage:"climb",shoe:.35,velocity:0,index:0,charge:0,aim:0,marks:[],misses:0,wrong:false,flash:0,fitted:[false,false,false,false,false]};
      this.vera.phase="walk";return true;
    }
    operate(){
      const w=this.shift;if(!w||w.stage!=="climb")return false;
      w.stage="test";w.velocity=0;this.testing=true;this.view=0;return true;
    }
    pocket(){
      const w=this.shift;if(!w||w.stage!=="test")return;
      this.testing=false;w.stage="climb";w.charge=w.aim=w.velocity=0;w.wrong=false;
    }
    cancel(){this.shift=null;this.testing=false;this.program=this.saved.program||"tide";this.vera.phase="return";}
    apply(id){
      if(this.shift||!find(id)||!Object.hasOwn(this.saved.best,id))return false;
      this.saved.program=this.program=id;return true;
    }
    finish(){
      const w=this.shift;if(!w||w.stage!=="proof")return null;
      const receipt={id:w.id,score:w.score,pay:105+Math.round(w.score*.60)};
      this.saved.orders++;this.saved.best[w.id]=Math.max(this.saved.best[w.id]??0,w.score);this.saved.program=this.program=w.id;
      this.shift=null;this.testing=false;this.vera.phase="return";return receipt;
    }
    tune(dt,input){
      const w=this.shift,d=find(w.id),target=d.order[w.index];
      const steer=Number(input.right)-Number(input.left);
      w.velocity+=(steer*2.55-w.velocity)*-Math.expm1(-(steer?9:18)*dt);
      w.shoe=clamp(w.shoe+w.velocity*dt,0,4);w.flash=Math.max(0,w.flash-dt);
      const error=Math.abs(target-w.shoe);
      if(!input.press){w.release=false;w.wrong=false;w.charge=Math.max(0,w.charge-dt*.8);w.aim=Math.min(w.aim,w.charge);return;}
      if(w.release)return;
      if(error>.31){
        if(!w.wrong){w.misses++;w.flash=.48;w.wrong=true;}w.charge=w.aim=0;return;
      }
      w.wrong=false;const seconds=.38+.058*((target+w.index)%3);
      w.charge+=dt/seconds;w.aim+=(1-error/.65)*dt/seconds;
      if(w.charge<1)return;
      w.marks.push(clamp(w.aim/w.charge,0,1));w.fitted[target]=true;w.index++;w.charge=w.aim=0;w.release=true;
      if(w.index===5){
        w.score=clamp(Math.round(100*w.marks.reduce((a,b)=>a+b,0)/5-3*w.misses),0,100);
        this.program=w.id;this.testing=false;w.stage="proof";
      }
    }
    status(){
      const w=this.shift;if(!w)return "";
      if(w.stage==="climb")return w.index?"Return to the roof board to finish the sweep":"Reach the sequencer beside the rooftop MOTEL sign";
      if(w.stage==="proof")return "Meet Vera at the curb to sign off the lights";
      return "Set contact "+(w.index+1)+" of 5  ·  "+"MOTEL"[find(w.id).order[w.index]];
    }
    people(dt,blocked){
      const v=this.vera;this.ambient-=dt;
      if(!this.shift&&this.ambient<=0&&(v.phase==="bench"||v.phase==="watch")){
        v.phase=v.phase==="bench"?"walk":"return";this.ambient=v.phase==="walk"?14:23;
      }
      const dest=v.phase==="walk"||v.phase==="watch"?corner:home,dx=dest.x-v.x,dz=dest.z-v.z,d=Math.hypot(dx,dz);
      v.moving=false;
      if(d>.03){
        const step=Math.min(dt*1.35,d),x=v.x+dx/d*step,z=v.z+dz/d*step;
        if(!blocked(x,z)){v.x=x;v.z=z;v.stride+=step*3.95;v.moving=true;v.yaw=Math.atan2(dx,dz);}
      }else{v.phase=dest===corner?"watch":"bench";v.yaw=dest===corner?Math.atan2(129-v.x,-45-v.z):-1.65;}
      const g=this.guest,p=rooms[g.at];g.moving=false;
      if(g.wait>0){g.wait-=dt;return;}
      const dxg=p.x-g.x,dzg=p.z-g.z,n=Math.hypot(dxg,dzg);
      if(n<.025){
        if(g.at===rooms.length-1||g.at===0){g.dir*=-1;g.wait=p.rest;g.yaw=g.at===0?1.1:1.75;}
        g.at+=g.dir;return;
      }
      const step=Math.min(dt*1.22,n),f=step/n,x=g.x+dxg*f,z=g.z+dzg*f;
      if(g.y<1.75&&blocked(x,z))return;
      g.x=x;g.z=z;g.y+=(p.y-g.y)*f;g.yaw=Math.atan2(dxg,dzg);g.phase+=step*3.7;g.moving=true;
    }
    step(dt,t,hours,input,blocked){
      this.people(dt,blocked);
      if(this.testing)this.tune(dt,input);
      const w=this.shift,d=find(this.testing?w.id:this.program),time=t*(d.id==="midnight"?.95:d.id==="coral"?1.43:1.18);
      this.color=d.color;this.accent=d.accent;
      for(let i=0;i<5;i++){
        let light;
        if(this.testing){const target=d.order[w.index];light=w.fitted[i]?1:i===target?.14+.55*w.charge+.12*(1+Math.sin(t*5)):.08;}
        else{
          const travel=(time-d.order.indexOf(i)*.35)%2.8,wrapped=(travel+2.8)%2.8;
          light=.22+.78*Math.max(0,1-wrapped/(d.id==="midnight"?1.62:1.03));
          if(d.id==="coral"&&wrapped>.49&&wrapped<.80)light=.93;
          if(!this.saved.program&&w?.stage!=="proof"&&i===3)light=.10+.30*(Math.sin(t*8.5)>0&&Math.sin(t*3.7)>.63);
        }
        this.lights[i]+=(light-this.lights[i])*-Math.expm1(-14*dt);
      }
    }
  }
  window.BayMarlinNeon={bench,desk,service,home,corner,designs,find,read,Service};
})();
