// Follow the receiving driveways with ordinary steering, gas and brake inputs.
module.exports=function freightKeys(v,run,traffic){
  if(v.canalTicket?.berth>=0)return [];
  const road=run.stop?run.drive:[{x:BayCanalTraffic.dispatch.x,z:-133},BayCanalTraffic.bays[0]];
  const goal=road.at(-1),look=Math.min(goal.z, v.z+3.6+Math.abs(v.speed)*.3);
  let i=1;while(i<road.length-1&&road[i].z<look)i++;
  const a=road[i-1],b=road[i],u=Math.min(1,Math.max(0,(look-a.z)/(b.z-a.z)));
  const yaw=Math.atan2(a.x+(b.x-a.x)*u-v.x,Math.max(.5,look-v.z));
  const error=Math.atan2(Math.sin(yaw-v.yaw),Math.cos(yaw-v.yaw))-(v.yawRate||0)*.18;
  let desired=Math.min(6.5,Math.sqrt(5*Math.max(0,goal.z-v.z-.5)));
  for(const o of traffic){
    if(o===v||!o.path||Math.abs(o.x-v.x)>12||Math.abs(o.z-v.z)>16)continue;
    const p=BayDriving.local(v,o.x,o.z);
    if(p.z>0&&Math.abs(p.x)<2.3)desired=Math.min(desired,Math.sqrt(5*Math.max(0,p.z-6.8)));
  }
  const keys=[];
  if(desired<.4&&Math.abs(v.speed)<1)keys.push("Space");
  else if(v.speed<desired-.13)keys.push("KeyW");
  else if(v.speed>desired+.13)keys.push("KeyS");
  if(error>.035)keys.push("KeyD");else if(error<-.035)keys.push("KeyA");
  return keys;
};
