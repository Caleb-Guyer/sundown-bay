// A test driver reads the road sheet and produces the same digital inputs as the keyboard.
function gullPilot(v,line,goal,stop,traffic,garage=false,previous){
  const turn=(a,b)=>Math.atan2(Math.sin(b-a),Math.cos(b-a));
  const at=line.closest(v,previous).at,finish=line.closest(goal).at,left=finish-at;
  const speed=Math.abs(v.speed),distance=Math.hypot(v.x-goal.x,v.z-goal.z);
  if(stop&&distance<(garage?1.12:1.50)&&speed<.80)return ["park"];
  const look=Math.min(6.4,2.55+speed*.45),base=line.sample(at),q=line.sample(at+look),p=line.sample(at+1.62*look);
  let offset=0;
  for(const o of traffic||[]){
    if(o===v||!o.kind||Math.abs(o.x-v.x)>16||Math.abs(o.z-v.z)>16)continue;
    const rel=BayDriving.local(base,o.x,o.z);
    if(rel.z< -2||rel.z>13||Math.abs(rel.x)>2.6)continue;
    if(!garage&&(!stop||left>19)&&!(v.x<64&&v.x>54&&v.z>23&&v.z<55))offset=Math.min(offset,Math.max(-3.3,rel.x-3.1));
  }
  q.x+=Math.cos(q.yaw)*offset;q.z-=Math.sin(q.yaw)*offset;
  const err=turn(v.yaw,Math.atan2(q.x-v.x,q.z-v.z))-v.yawRate*.22,bend=Math.abs(turn(base.yaw,p.yaw));
  let cruise=Math.min(garage?3.85:9.7,10.3/(1+2.3*bend));
  if(Math.abs(err)>.42)cruise=Math.min(cruise,3.6);
  if(stop)cruise=Math.min(cruise,Math.sqrt(4.0*Math.max(0,Math.max(left,distance)-.53)));
  if(stop&&distance<(garage?1.12:1.50))cruise=0;
  const keys=[];if(err>.038)keys.push("KeyD");else if(err<-.038)keys.push("KeyA");
  if(v.speed<cruise-.14)keys.push("KeyW");else if(v.speed>cruise+.12)keys.push("KeyS");
  return keys;
}
if(typeof module!=="undefined")module.exports=gullPilot;
