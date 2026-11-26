// Place two of the city's existing motorists on a straight stretch of Biscayne.
// From this point the normal traffic, collision and driving systems own all three cars.
module.exports=function stagePass(driver,cars){
  const pair=cars.filter(v=>v!==driver&&v.path&&!v.serviceCar&&!v.meetCar&&["coupe","hatch","cab"].includes(v.kind)).slice(0,2);
  for(const [i,v] of pair.entries()){
    const x=72+(i?2.85:-2.85),z=-109;
    Object.assign(v,{x,z,yaw:0,wait:0,corner:1,speed:3.4,pace:3.4,cityLanes:false,
      path:[{x,z:-144},{x,z:0}],finiteRoute:true,finiteYaw:0,reaction:null,lanes:null,findLane:false});
  }
  Object.assign(driver,{x:72,z:-133,yaw:0});BayDriving.settle(driver);
  return pair;
};
