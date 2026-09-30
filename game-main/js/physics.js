import { GROUND_Y, MOVE } from "./config.js";
import { arena } from "./arena.js";

export function integrateAir(f, dt) {
  f.y += f.vy * dt;
  f.vy += MOVE.GRAVITY * dt;
  if (f.y >= GROUND_Y) {
    f.y = GROUND_Y;
    f.vy = 0;
    f.grounded = true;
  }
}

export function clampArena(f) {
  f.x = Math.max(MOVE.ARENA_MARGIN, Math.min(arena.width - MOVE.ARENA_MARGIN, f.x));
}

export function separate(a, b) {
  const dx = b.x - a.x;
  const overlap = MOVE.BODY_DIST - Math.abs(dx);
  if (overlap <= 0) return;
  const push = overlap / 2;

  const dir = dx >= 0 ? 1 : -1;
  a.x -= push * dir;
  b.x += push * dir;
  clampArena(a);
  clampArena(b);
}

