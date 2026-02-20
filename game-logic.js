export const WORLD = { width: 3600, height: 540 };

export function rectsOverlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function applyInput(player, input, speed = 260) {
  const left = !!(input.left);
  const right = !!(input.right);
  const dir = (right ? 1 : 0) - (left ? 1 : 0);
  return { ...player, vx: dir * speed };
}

export function stepPlayer(player, dt, gravity = 1850) {
  return {
    ...player,
    x: player.x + player.vx * dt,
    y: player.y + player.vy * dt,
    vy: player.vy + gravity * dt,
    onGround: false,
  };
}

export function clampToWorld(player, world = WORLD) {
  const next = { ...player };
  if (next.x < 0) next.x = 0;
  if (next.x + next.w > world.width) next.x = world.width - next.w;
  return next;
}

export function resolvePlatforms(player, platforms) {
  let p = { ...player };
  for (const pl of platforms) {
    if (!rectsOverlap(p, pl)) continue;

    const overlapLeft = p.x + p.w - pl.x;
    const overlapRight = pl.x + pl.w - p.x;
    const overlapTop = p.y + p.h - pl.y;
    const overlapBottom = pl.y + pl.h - p.y;

    const minX = Math.min(overlapLeft, overlapRight);
    const minY = Math.min(overlapTop, overlapBottom);

    if (minY <= minX) {
      if (overlapTop < overlapBottom) {
        p.y = pl.y - p.h;
        p.vy = 0;
        p.onGround = true;
      } else {
        p.y = pl.y + pl.h;
        p.vy = Math.max(0, p.vy);
      }
    } else {
      if (overlapLeft < overlapRight) p.x = pl.x - p.w;
      else p.x = pl.x + pl.w;
      p.vx = 0;
    }
  }
  return p;
}

export function canJump(player) {
  return !!player.onGround;
}

export function hitHazard(player, hazards) {
  return hazards.some((h) => rectsOverlap(player, h));
}

export function reachedGoal(player, goal) {
  return rectsOverlap(player, goal);
}
