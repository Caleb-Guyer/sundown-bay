/* Keyboard-only race driver used on the hosted playtest. Reads the map's real
   positions and uses the same gas, brake and steering keys as a player. */
function coastKeys(map,driver){
  const v=map.streetCar,road=BayCoastCup,track=road.track;
  if(!v||map.coastCup.phase!=="race")return [];
  const at=track.closest(v).at,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a)),clock=map.coastCup.clock;
  const speed=Math.abs(v.speed),ahead=Math.max(5.5,Math.min(10,4.5+speed*.24));
  const traffic=map.cars.concat(map.motos?.all||[],map.transit?.bus||[]);
  const nearby=traffic.filter(t=>t!==v&&Math.abs(t.x-v.x)<26&&Math.abs(t.z-v.z)<26);
  const side=BayDriving.local(road.sample(at),v.x,v.z).x;
  if(!driver.anchor||Math.hypot(v.x-driver.anchor.x,v.z-driver.anchor.z)>1.6){
    driver.anchor={x:v.x,z:v.z,clock};driver.attempts=0;
  }
  if(speed<1.4&&clock-driver.anchor.clock>1.15&&clock>(driver.escapeUntil||0)){
    driver.attempts=(driver.attempts||0)+1;
    driver.escapeLane=(side>0?-1:1)*(driver.attempts%2?4.9:-4.9);
    driver.reverseUntil=clock+1.12;driver.escapeUntil=clock+3.5;driver.anchor.clock=clock;
  }
  const escaping=clock<(driver.escapeUntil||0);
  if(clock<(driver.reverseUntil||0)){
    const behind=BayDriving.world(v,0,-3.6);
    if(speed<.5&&clock>driver.reverseUntil-.62&&nearby.some(t=>BayDriving.clearance(t,behind)<1.05))driver.reverseUntil=clock;
    else return ["KeyS",driver.escapeLane>0?"KeyA":"KeyD"];
  }
  const lanes=escaping?[driver.escapeLane,-driver.escapeLane,0]:[1.7,-1.5,3.7,-3.9,.1,5.0,-5.0];
  let goal,highest=-Infinity,room=15;
  for(const lane of lanes){
    let free=21;
    for(const m of [2,4,7,10,15,21]){
      const blend=Math.min(1,m/(5+speed*.18)),p=road.sample(at+m,side+(lane-side)*blend);
      const seconds=Math.min(.95,m/Math.max(speed,6));
      if(nearby.some(t=>{
        const x=t.x+Math.sin(t.yaw)*(t.speed||0)*seconds,z=t.z+Math.cos(t.yaw)*(t.speed||0)*seconds;
        if(Math.abs(x-p.x)>7||Math.abs(z-p.z)>7)return false;
        const future={kind:t.kind,footprint:t.footprint,x,z,yaw:t.yaw};
        return BayDriving.contact({kind:v.kind,...p},future)||BayDriving.clearance(future,p)<1.40;
      })){
        free=m-1.7;break;
      }
    }
    const score=free-.20*Math.abs(lane-1.7)-.17*Math.abs(lane-(driver.lane||0))+(escaping&&lane===driver.escapeLane?4:0);
    if(score>highest){highest=score;goal=lane;room=free;}
  }
  driver.lane=goal;
  const aim=road.sample(at+(escaping?4.4:ahead),goal),yaw=Math.atan2(aim.x-v.x,aim.z-v.z);
  const error=wrap(yaw-v.yaw),bend=Math.abs(wrap(road.sample(at+15).yaw-road.sample(at+1).yaw));
  const desired=Math.min(17,Math.max(6.2,17-bend*9.6-Math.abs(error)*5),room<1?1.65:Math.sqrt(2*7*room));
  const steer=error-(v.yawRate||0)*.13;
  return [speed<desired-.24?"KeyW":speed>desired+.9?"KeyS":"",steer>.038?"KeyD":steer<-.038?"KeyA":""].filter(Boolean);
}
module.exports=coastKeys;
