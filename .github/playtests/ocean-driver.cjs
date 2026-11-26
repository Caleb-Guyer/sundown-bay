// Follow the grid lane through the intersection, then pull onto the apron
// beyond the timing clock so the traffic and returning racer can get past.
module.exports = function oceanDriver(car, leg, endZ, traffic = [], memory = {}) {
  let heading, speed;
  if (leg === "race") {
    const pace = memory.raceSpeed ?? 11.5;
    const width = bayCarLayout(car.kind).track;
    const nose = bayCarLayout(car.kind).halfLength;
    function clearSpeed(lane) {
      let allowed = pace;
      for (const other of traffic) {
        if (other === car || other.z < car.z || other.z > car.z + 30) continue;
        const body = other.footprint || bayCarLayout(other.kind);
        const side = Math.abs(Math.sin(other.yaw)), facing = Math.cos(other.yaw);
        const across = side * body.halfLength + Math.abs(facing) * body.track;
        if (Math.abs(other.x - lane) > across + width + .32) continue;
        const gap = other.z - car.z - nose - Math.abs(facing) * body.halfLength - side * body.track;
        const ahead = Math.max(0, facing * (other.speed || 0));
        allowed = Math.min(allowed, Math.sqrt(ahead * ahead + 12 * Math.max(0, gap - 2.2)));
      }
      return allowed;
    }
    // Keep one line through the junction. Only move across once a stationary queue
    // actually closes this lane, and hold the new line until past its first car.
    let lane = car.z < -8 ? 148.8 : 143.9;
    if (memory.bypass && car.z >= memory.bypass.until) memory.bypass = null;
    if (memory.bypass) lane = memory.bypass.x;
    speed = car.z < -5 ? pace : clearSpeed(lane);
    // Look ahead while accelerating for the manual run. Waiting until the
    // bumper is stationary behind the queue uses up the second-gear straight.
    if (pace >= 16 && car.z >= -8 && speed < pace - 1.5) {
      for (const x of [143.9, 141.2, 139.5, 146.7]) {
        const room = clearSpeed(x);
        if (room > speed + 2.0) { lane = x; speed = room; }
      }
      if (lane !== 143.9) memory.bypass = { x: lane, until: car.z + 15 };
    }
    memory.still = speed < 1 && Math.abs(car.speed) < 1.2 ? (memory.still || 0) + 1 : 0;
    if (memory.still > 30) {
      for (const x of [146.8, 144, 141.3, 148.8]) {
        const available = clearSpeed(x);
        if (available > speed + 3) { lane = x; speed = available; }
      }
      if (speed > 3) { memory.bypass = { x: lane, until: car.z + 16 }; memory.still = 0; }
    }
    // Ease over while the wheels keep pulling, as a driver would at the grid.
    const limit=pace>=16?.34:.57;
    heading = Math.max(-limit, Math.min(limit, (lane - car.x) * .19));
  } else {
    const dx = 155.4 - car.x, dz = endZ - car.z;
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
