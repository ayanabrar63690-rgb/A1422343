import { VIEW_W, ARENA_W } from "./config.js";
import { arena } from "./arena.js";

export class Camera {
  constructor() {
    this.x = (ARENA_W - VIEW_W) / 2;
    this.trauma = 0;
  }

  kick(a) {
    this.trauma = Math.min(1, this.trauma + a);
  }
  update(dt, a, b) {
    const mid = (a.x + b.x) / 2;
    const max = Math.max(0, arena.width - VIEW_W);
    const target = Math.max(0, Math.min(max, mid - VIEW_W / 2));

    const t = 1 - Math.pow(0.001, dt);
    this.x += (target - this.x) * t;
    this.x = Math.max(0, Math.min(max, this.x));
    this.trauma = Math.max(0, this.trauma - dt * 1.6);
  }

  shakeX(t) {
    const s = this.trauma * this.trauma;
    return Math.round(s * 14 * Math.sin(t * 70));
  }
  shakeY(t) {
    const s = this.trauma * this.trauma;
    return Math.round(s * 10 * Math.cos(t * 55));
  }
}

