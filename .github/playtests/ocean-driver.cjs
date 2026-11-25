// Follow the grid lane through the intersection, then pull onto the apron
// beyond the timing clock so the traffic and returning racer can get past.
module.exports = function oceanDriver(car, leg, endZ, traffic = [], memory = {}) {
  let heading, speed;
  if (leg === "race") {
    const preferred = car.z < 5 ? 148.8 : 144.15;
    let lane = preferred;
    if (car.z > 1) {
      let best = -Infinity;
      for (const x of [preferred, 146.5, 148.85, 141.65]) {
        let score = -.18 * Math.abs(x - preferred) - .14 * Math.abs(x - car.x);
        if (memory.lane === x) score += .55;
        for (const q of traffic) {
          if (q === car || q.z < car.z - 8 || q.z > car.z + 44 || Math.abs(q.x - x) > 12) continue;
          const facing = Math.cos(q.yaw), sideways = Math.sin(q.yaw), speed = q.speed || 0;
          const body = q.footprint || bayCarLayout(q.kind);
          const width = Math.abs(facing) * body.track + Math.abs(sideways) * body.halfLength + 1.4;
          const length = Math.abs(facing) * body.halfLength + Math.abs(sideways) * body.track + 2.8;
          for (const t of [.35, .7, 1.1, 1.55, 2.05]) {
            const lateral = Math.abs(q.x + sideways * speed * t - x);
            const front = Math.abs(q.z + facing * speed * t - (car.z + Math.max(6,car.speed) * t));
            if (lateral < width && front < length + 1.7) score -= (width - lateral) * (length + 1.7 - front) / (.6 + t);
          }
        }
        if (score > best) { best = score; lane = x; }
      }
      memory.lane = lane;
    }
    heading = Math.max(-.50, Math.min(.50, (lane - car.x) * .23));
    speed = 11.5;
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
