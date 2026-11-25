/* Keyboard-only race driver used on the hosted playtest. Reads the map's real
   positions and uses the same gas, brake and steering keys as a player. */
function coastKeys(map,driver){
  const v=map.streetCar,road=BayCoastCup,track=road.track;
  if(!v||map.coastCup.phase!=="race")return [];
  const at=track.closest(v).at,wrap=a=>Math.atan2(Math.sin(a),Math.cos(a));
  const speed=Math.abs(v.speed),ahead=Math.max(5.5,Math.min(10,4.5+speed*.24));
  const traffic=map.cars.concat(map.motos?.all||[],map.transit?.bus||[]);
  const nearby=traffic.filter(t=>t!==v&&Math.abs(t.x-v.x)<26&&Math.abs(t.z-v.z)<26);
  const lanes=[1.7,-1.5,3.7,-3.9,.1];
  let goal,highest=-Infinity,room=15;
  for(const lane of lanes){
    let free=18;
    for(const m of [3,6,9,13,18]){
      const p=road.sample(at+m,lane);
      if(nearby.some(t=>Math.abs(t.x-p.x)<4.9&&Math.abs(t.z-p.z)<4.9&&BayDriving.clearance(t,p)<1.22)){
        free=m-3;break;
      }
    }
    const score=free-.20*Math.abs(lane-1.7)-.17*Math.abs(lane-(driver.lane||0));
    if(score>highest){highest=score;goal=lane;room=free;}
  }
  driver.lane=goal;
  const aim=road.sample(at+ahead,goal),yaw=Math.atan2(aim.x-v.x,aim.z-v.z);
  const error=wrap(yaw-v.yaw),bend=Math.abs(wrap(road.sample(at+15).yaw-road.sample(at+1).yaw));
  const desired=Math.min(17,Math.max(6.2,17-bend*9.6-Math.abs(error)*5),room<4?6.2:room<9?10:20);
  const steer=error-(v.yawRate||0)*.13;
  return [speed<desired-.24?"KeyW":speed>desired+.9?"KeyS":"",steer>.038?"KeyD":steer<-.038?"KeyA":""].filter(Boolean);
}
module.exports=coastKeys;
