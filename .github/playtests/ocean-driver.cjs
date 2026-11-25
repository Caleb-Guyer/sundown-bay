// Follow the grid lane through the intersection, then pull onto the apron
// beyond the timing clock so the traffic and returning racer can get past.
module.exports = function oceanDriver(car, leg, endZ) {
  let heading, speed;
  if (leg === "race") {
    const lane = car.z < 5 ? 148.8 : 144.15;
    heading = Math.max(-.36, Math.min(.36, (lane - car.x) * .20));
    speed = 11.5;
  } else {
    const dx = 153 - car.x, dz = endZ - car.z;
    const distance = Math.hypot(dx, dz);
    if (distance < 1) return car.speed > .12 ? ["KeyS"] : [];
    heading = Math.atan2(dx, dz);
    speed = Math.min(3.6, Math.sqrt(4 * distance));
  }
  const angle = heading - car.yaw;
  const error = Math.atan2(Math.sin(angle), Math.cos(angle)) - (car.yawRate || 0) * .22;
  if (Math.abs(error) > .38) speed = Math.min(speed, 4.6);
  const keys = [];
  if (error > .035) keys.push("KeyD");
  if (error < -.035) keys.push("KeyA");
  if (car.speed < speed - .22) keys.push("KeyW");
  if (car.speed > speed + .28) keys.push("KeyS");
  return keys;
};
