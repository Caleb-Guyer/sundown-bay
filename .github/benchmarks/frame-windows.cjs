// Count frame completions in (start, start + 1000] for every full second.
// The count can only decrease when a completion moves past the left edge.
module.exports = function frameWindows(intervals) {
  let elapsed = 0;
  const ends = [0];
  for (const dt of intervals) {
    if (!Number.isFinite(dt) || dt <= 0) throw Error("Expected a positive frame interval");
    ends.push(elapsed += dt);
  }
  if (elapsed < 1000) return null;
  let right = 0;
  let minimum = Infinity;
  let worstStartMs = 0;
  for (let left = 0; left < ends.length && ends[left] + 1000 <= elapsed; left++) {
    const limit = ends[left] + 1000;
    while (right + 1 < ends.length && ends[right + 1] <= limit) right++;
    if (right - left < minimum) {
      minimum = right - left;
      worstStartMs = ends[left];
    }
  }
  const sorted = [...intervals].sort((a, b) => a - b);
  return {rollingLow: minimum, worstStartMs, p99: sorted[Math.ceil(sorted.length * .99) - 1], longestMs: sorted.at(-1)};
};
