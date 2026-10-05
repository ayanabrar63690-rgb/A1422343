import { ARENA_W, GROUND_Y } from "./config.js";

export const arena = { width: ARENA_W, groundY: GROUND_Y };

export function setArena(width = ARENA_W) {
  arena.width = width;
}

export function arenaCenter() {
  return arena.width / 2;
}

