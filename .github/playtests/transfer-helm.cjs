// The test pilot uses the same helm keys and bell as a player.
module.exports=function helm(run,outside){
  const v=run.boat,dock=BayLastTransfer.landing;
  const keys=[];
  if(run.result)return keys;
  const target=v.z<-45?(outside?260:242):v.z<-5?(outside?269:238):dock.x;
  const error=target-v.x-Math.sin(v.yaw)*run.speed*.43;
  if(Math.abs(error)>.65)keys.push(error>0?"KeyD":"KeyA");
  if(outside&&!run.held&&run.nearSignal())keys.push("KeyH");
  const left=dock.z-v.z;
  if(left>Math.max(3.8,run.speed*.68))keys.push("KeyW");
  else if(run.speed>2.2||left< -1)keys.push("KeyS");
  if(run.toPier()<6&&Math.abs(run.speed)<3.2)keys.push("KeyF");
  return keys;
};
