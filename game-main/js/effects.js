import { SPRITE_SCALE } from "./config.js";
import { FEET_PAD } from "./render/sprites.js";
export class Particles {
  constructor(kind, count, area) {
    this.kind = kind;
    this.area = area;
    this.list = [];
    for (let i = 0; i < count; i++) this.list.push(this.spawn(true));
  }
  spawn(anywhere = false) {
    const [w, h] = [this.area.w, this.area.h];
    return {
      x: Math.random() * w,

      y: anywhere ? Math.random() * h : this.kind === "embers" ? h - Math.random() * 80 : -10,
      vx: this.kind === "leaves" ? -30 - Math.random() * 40 : (Math.random() - 0.5) * 20,
      vy: this.kind === "leaves" ? 15 + Math.random() * 35
        : this.kind === "lab" ? 10 + Math.random() * 30
        : -(15 + Math.random() * 35),
      s: 1 + Math.floor(Math.random() * 3),
      ph: Math.random() * 10,
    };
  }
  update(dt) {
    for (const p of this.list) {
      p.ph += dt;
      p.x += (p.vx + Math.sin(p.ph * 2) * 12) * dt;
      p.y += p.vy * dt;
      const goneY = this.kind === "embers" ? p.y < -12 : p.y > this.area.h + 12;
      if (goneY || p.x < -12 || p.x > this.area.w + 12) Object.assign(p, this.spawn());
    }
  }
  draw(ctx, camX, parallax = 1) {
    for (const p of this.list) {
      const x = p.x - camX * parallax;
      if (x < -10 || x > 980) continue;
      if (this.kind === "leaves") ctx.fillStyle = (p.s > 2 ? "#6fae4e" : "#3f7030");
      else if (this.kind === "lab") ctx.fillStyle = (p.s > 2 ? "#9fd4ff" : "#3a6a9f");
      else ctx.fillStyle = (p.s > 2 ? "#ff9a3e" : "#7a3a1a");
      ctx.fillRect(Math.round(x), Math.round(p.y), p.s, p.s);
    }
  }
}

export function drawShadow(ctx, xWorld, yGround, camX, w = 84, alpha = 0.35) {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = "#000";
  ctx.beginPath();
  ctx.ellipse(Math.round(xWorld - camX), Math.round(yGround + 6), w / 2, 10, 0, 0, Math.PI * 2);

  ctx.fill();
  ctx.restore();
}

export const Clones = {
  list: [],

  spawn(img, xFeet, yFeet, facing, life = 0.4, style = "ghost") {
    let dark = null;
    if (style === "shadow") {
      dark = document.createElement("canvas");
      dark.width = img.width;
      dark.height = img.height;
      const dctx = dark.getContext("2d");
      dctx.imageSmoothingEnabled = false;
      dctx.drawImage(img, 0, 0);
      dctx.globalCompositeOperation = "source-in";
      dctx.fillStyle = "#050508";
      dctx.fillRect(0, 0, dark.width, dark.height);
    }
    this.list.push({ img, dark, style, x: xFeet, y: yFeet, facing, t: 0, life });
  },
  update(dt) {
    for (const c of this.list) c.t += dt;
    this.list = this.list.filter((c) => c.t < c.life);
  },
  draw(ctx, camX) {
    for (const c of this.list) {
      const pic = c.style === "shadow" && c.dark ? c.dark : c.img;
      const w = pic.width * SPRITE_SCALE;
      const h = pic.height * SPRITE_SCALE;
      const dx = Math.round(c.x - camX - w / 2);
      const dy = Math.round(c.y - h + FEET_PAD * SPRITE_SCALE);
      ctx.save();

      ctx.globalAlpha = c.style === "shadow" ? 0.8 * (1 - c.t / c.life) : 0.45 * (1 - c.t / c.life);
      if (c.facing === 1) {
        ctx.drawImage(pic, dx, dy, w, h);
      } else {
        ctx.translate(dx + w, dy);
        ctx.scale(-1, 1);
        ctx.drawImage(pic, 0, 0, w, h);
      }
      ctx.restore();
    }
  },
};

export const Sparks = {
  list: [],
  block(x, y) {
    this.list.push({ x, y, t: 0, life: 0.18, kind: "flash" });
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI / 2 + (Math.random() - 0.5) * 2.2;
      const sp = 120 + Math.random() * 220;
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        t: 0, life: 0.25 + Math.random() * 0.15, kind: "shard",
      });
    }
  },

  hit(x, y, dir = 1) {
    this.list.push({ x, y, t: 0, life: 0.16, kind: "hitflash" });
    for (let i = 0; i < 8; i++) {
      const spread = (Math.random() - 0.5) * 1.7;
      const a = (dir >= 0 ? 0 : Math.PI) + spread;
      const sp = 140 + Math.random() * 260;
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 70,
        t: 0, life: 0.22 + Math.random() * 0.18, kind: "hshard",
      });
    }
  },

  muzzle(x, y, dir) {
    this.list.push({ x, y, t: 0, life: 0.09, kind: "hitflash" });
    for (let i = 0; i < 5; i++) {
      this.list.push({
        x, y,
        vx: dir * (160 + Math.random() * 200),
        vy: (Math.random() - 0.5) * 120,
        t: 0, life: 0.1 + Math.random() * 0.1, kind: "hshard",
      });
    }
  },

  dust(x, y) {
    for (let i = 0; i < 5; i++) {
      this.list.push({
        x: x + (Math.random() - 0.5) * 36, y: y - 2,
        vx: (Math.random() - 0.5) * 130, vy: -40 - Math.random() * 70,
        t: 0, life: 0.24 + Math.random() * 0.16, kind: "dust",
      });
    }
  },

  ko(x, y) {
    this.list.push({ x, y, t: 0, life: 0.25, kind: "hitflash" });
    this.ring(x, y, 170);
    this.blood(x, y);
    this.blood(x, y);
    this.puff(x, y);
    for (const dir of [1, -1]) {
      for (let i = 0; i < 6; i++) {
        this.list.push({
          x, y,
          vx: dir * (120 + Math.random() * 260),
          vy: -80 - Math.random() * 170,
          t: 0, life: 0.30 + Math.random() * 0.2, kind: "hshard",
        });
      }
    }
  },
  update(dt) {
    for (const s of this.list) {
      s.t += dt;
      if (s.kind === "shard" || s.kind === "hshard") {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 900 * dt;
      } else if (s.kind === "dust") {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 320 * dt;
        s.vx *= Math.max(0, 1 - 3 * dt);
      } else if (s.kind === "mote" || s.kind === "vmote" || s.kind === "wisp" || s.kind === "smote" || s.kind === "webstrand") {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
      } else if (s.kind === "blood") {
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += 1400 * dt;
      }
    }
    this.list = this.list.filter((s) => s.t < s.life);
  },

  puff(x, y) {
    this.list.push({ x, y, t: 0, life: 0.22, kind: "poof" });
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 40 + Math.random() * 130;
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 30,
        t: 0, life: 0.35 + Math.random() * 0.2, kind: "wisp",
      });
    }
  },

  ember(x, y) {
    this.list.push({
      x, y,
      vx: (Math.random() - 0.5) * 40, vy: -120 - Math.random() * 80,
      t: 0, life: 0.3 + Math.random() * 0.15, kind: "mote",
    });
  },

  ring(x, y, maxR = 150) {
    this.list.push({ x, y, maxR, t: 0, life: 0.32, kind: "ring" });
  },

  blood(x, y) {
    for (let i = 0; i < 4; i++) {
      this.list.push({
        x: x + (Math.random() - 0.5) * 10, y,
        vx: (Math.random() - 0.5) * 260, vy: -80 - Math.random() * 160,
        t: 0, life: 0.4 + Math.random() * 0.15, kind: "blood",
      });
    }
  },

  gore(x, y) {
    // massacre burst: double blood + chunks that stick as a ground pool
    this.blood(x, y);
    this.blood(x, y);
    for (let i = 0; i < 5; i++) {
      this.list.push({
        x: x + (Math.random() - 0.5) * 16, y: y - Math.random() * 20,
        vx: (Math.random() - 0.5) * 340, vy: -60 - Math.random() * 220,
        t: 0, life: 0.5 + Math.random() * 0.2, kind: "blood",
      });
    }
    this.pool(x, y + 90);
  },

  pool(x, y) {
    this.list.push({ x, y, t: 0, life: 6.0, kind: "pool", seed: Math.random() * 10 });
    // cap pools so long gore sessions don't grow the list forever
    const pools = this.list.filter((s) => s.kind === "pool");
    if (pools.length > 24) {
      const drop = pools[0];
      this.list.splice(this.list.indexOf(drop), 1);
    }
  },

  violet(x, y) {
    this.list.push({
      x, y,
      vx: (Math.random() - 0.5) * 60, vy: -60 - Math.random() * 60,
      t: 0, life: 0.35 + Math.random() * 0.15, kind: "vmote",
    });
  },

  web(x, y) {
    this.list.push({ x, y, t: 0, life: 0.20, kind: "webflash" });
    for (let i = 0; i < 8; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 60 + Math.random() * 180;
      this.list.push({
        x, y,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 40,
        t: 0, life: 0.30 + Math.random() * 0.15, kind: "webstrand",
      });
    }
  },

  shadowburst(x, y) {
    for (let i = 0; i < 10; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 50 + Math.random() * 160;
      this.list.push({
        x: x + (Math.random() - 0.5) * 44, y: y - 20 - Math.random() * 110,
        vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 50,
        t: 0, life: 0.35 + Math.random() * 0.2, kind: "smote",
      });
    }
    for (let i = 0; i < 4; i++) this.violet(x + (Math.random() - 0.5) * 50, y - 30 - Math.random() * 90);
    this.dust(x, y);
  },

  slash(x, y, dir = 1) {
    for (let i = -1; i <= 1; i++) {
      this.list.push({ x, y: y + i * 5, t: 0, life: 0.16, kind: "slash", dir });
    }
    for (let i = 0; i < 5; i++) {
      const spread = (Math.random() - 0.5) * 1.2;
      const a = (dir >= 0 ? 0 : Math.PI) + spread;
      const sp = 160 + Math.random() * 240;
      this.list.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - 60,
        t: 0, life: 0.2 + Math.random() * 0.15, kind: "hshard",
      });
    }
  },
  draw(ctx, camX) {
    for (const s of this.list) {
      const x = Math.round(s.x - camX);
      const y = Math.round(s.y);
      if (s.kind === "flash") {

        const r = Math.round(3 + s.t * 70);
        ctx.fillStyle = "#35e0ff";
        ctx.fillRect(x - r - 2, y - 1, r * 2 + 4, 2);
        ctx.fillRect(x - 1, y - r - 2, 2, r * 2 + 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - r, y - 1, r * 2, 2);
        ctx.fillRect(x - 1, y - r, 2, r * 2);
      } else if (s.kind === "hitflash") {

        const r = Math.round(4 + s.t * 95);
        ctx.fillStyle = "#ff4a2a";
        ctx.fillRect(x - r - 2, y - 2, r * 2 + 4, 4);
        ctx.fillRect(x - 2, y - r - 2, 4, r * 2 + 4);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - r, y - 1, r * 2, 2);
        ctx.fillRect(x - 1, y - r, 2, r * 2);
        ctx.fillRect(x - 3, y - 3, 6, 6);
      } else if (s.kind === "webflash") {
        const r = Math.round(4 + s.t * 80);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - r - 2, y - 1, r * 2 + 4, 2);
        ctx.fillRect(x - 1, y - r - 2, 2, r * 2 + 4);
        ctx.fillStyle = "#bff4ff";
        ctx.fillRect(x - 3, y - 3, 6, 6);
      } else if (s.kind === "webstrand") {
        ctx.globalAlpha = Math.max(0, 1 - s.t / s.life);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x, y, 3, 1);
        ctx.fillStyle = "#9fd4ff";
        ctx.fillRect(x, y + 1, 2, 1);
        ctx.globalAlpha = 1;
      } else if (s.kind === "slash") {

        const k = 1 - s.t / s.life;
        const len = Math.round(26 * k + 8);
        const d = s.dir >= 0 ? 1 : -1;
        ctx.globalAlpha = Math.max(0, k);
        ctx.fillStyle = "#8a3aff";
        ctx.fillRect(d > 0 ? x - len : x, y, len, 2);
        ctx.fillStyle = "#ff3b1a";
        ctx.fillRect(d > 0 ? x - len : x, y + 2, len, 1);
        ctx.globalAlpha = 1;
      } else if (s.kind === "poof") {

        const r = Math.round(4 + s.t * 90);
        ctx.fillStyle = "#8a6bff";
        ctx.fillRect(x - r, y - 2, r * 2, 4);
        ctx.fillRect(x - 2, y - r, 4, r * 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 3, y - 3, 6, 6);
      } else if (s.kind === "ring") {

        const k = s.t / s.life;
        const r = Math.max(2, Math.round(s.maxR * k));
        ctx.globalAlpha = Math.max(0, 1 - k);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - r, y - 2, r * 2, 2);
        ctx.fillRect(x - r, y + 2, r * 2, 2);
        ctx.fillRect(x - r, y - r, 2, r * 2);
        ctx.fillRect(x + r - 2, y - r, 2, r * 2);
        ctx.fillStyle = "#9fd4ff";
        const r2 = Math.max(2, Math.round(s.maxR * Math.max(0, k - 0.15)));
        ctx.fillRect(x - r2, y - 1, r2 * 2, 1);
        ctx.fillRect(x - 1, y - r2, 1, r2 * 2);
        ctx.globalAlpha = 1;
      } else if (s.kind === "blood") {
        ctx.globalAlpha = Math.max(0, 1 - s.t / s.life);
        ctx.fillStyle = "#c01414";
        ctx.fillRect(x, y, 2, 2);
        ctx.globalAlpha = 1;
      } else if (s.kind === "pool") {
        // dried blood pool: dark crust + wet red core, seeps in then fades
        const k = s.t / s.life;
        const grow = Math.min(1, s.t / 0.4);
        const wob = Math.sin((s.seed || 0) * 7);
        const w = Math.round((16 + wob * 3) * grow);
        const a = k > 0.7 ? Math.max(0, 1 - (k - 0.7) / 0.3) : 1;
        ctx.globalAlpha = a;
        ctx.fillStyle = "#4a080c";
        ctx.fillRect(x - w, y - 2, w * 2, 4);
        ctx.fillRect(x - Math.round(w * 0.6), y - 3, Math.round(w * 1.2), 6);
        ctx.fillStyle = "#7a1016";
        ctx.fillRect(x - Math.round(w * 0.7), y - 1, Math.round(w * 1.4), 2);
        ctx.fillStyle = "#c01414";
        ctx.fillRect(x - Math.round(w * 0.35), y - 1, Math.round(w * 0.7), 2);
        ctx.globalAlpha = 1;
      } else if (s.kind === "mote" || s.kind === "vmote" || s.kind === "smote") {

        ctx.globalAlpha = Math.max(0, 1 - s.t / s.life);
        if (s.kind === "smote") ctx.fillStyle = s.t / s.life > 0.5 ? "#0a0a12" : "#8a3aff";
        else if (s.kind === "vmote") ctx.fillStyle = s.t / s.life > 0.5 ? "#8a3aff" : "#c9a8ff";
        else ctx.fillStyle = s.t / s.life > 0.5 ? "#ff3b1a" : "#ffb13e";
        ctx.fillRect(x, y, 3, 3);
        ctx.globalAlpha = 1;
      } else if (s.kind === "dust") {

        ctx.globalAlpha = Math.max(0, 1 - s.t / s.life);
        ctx.fillStyle = "#9a8f7a";
        ctx.fillRect(x, y, 2, 2);
        ctx.globalAlpha = 1;
      } else {

        ctx.globalAlpha = Math.max(0, 1 - s.t / s.life);
        ctx.fillStyle = s.kind === "wisp" ? "#c9b8ff"
          : s.kind === "hshard" ? (s.t / s.life > 0.5 ? "#ff4a2a" : "#ffffff")
          : "#bff4ff";
        ctx.fillRect(x, y, s.kind === "hshard" ? 3 : 2, 2);
        ctx.globalAlpha = 1;
      }
    }
  },
};

export const Missiles = {
  list: [],
  held: null,
  hold(x, y) { this.held = { x, y }; },
  clear() { this.held = null; },
  launch(targetX, targetY, fallTime = 0.55) {
    this.list.push({
      sx: targetX + 140, sy: -60, tx: targetX, ty: targetY,
      t: 0, fall: fallTime,
    });
  },
  arrived(m) {
    return m.t >= m.fall;
  },
  update(dt) {
    for (const m of this.list) m.t += dt;

    this.list = this.list.filter((m) => m.t < m.fall + 0.5);
  },
  draw(ctx, camX) {
    for (const m of this.list) {
      const k = Math.min(1, m.t / m.fall);
      const x = Math.round(m.sx + (m.tx - m.sx) * k - camX);
      const y = Math.round(m.sy + (m.ty - m.sy) * k);
      if (!this.arrived(m)) {

        ctx.fillStyle = "#ff7a1a";
        ctx.fillRect(x - 2, y - 26 - (m.t * 60 % 8), 5, 12);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 1, y - 20 - (m.t * 60 % 5), 3, 6);
        ctx.fillStyle = "#1a1a20";
        ctx.fillRect(x - 4, y - 16, 8, 16);
        ctx.fillStyle = "#3a3a48";
        ctx.fillRect(x - 6, y - 5, 2, 6);
        ctx.fillRect(x + 4, y - 5, 2, 6);
        ctx.fillStyle = "#7a1a1a";
        ctx.fillRect(x - 4, y - 3, 8, 3);
      } else {

        const e = Math.min(1, (m.t - m.fall) / 0.5);
        const ease = 1 - Math.pow(1 - e, 3);
        const r = Math.round(18 + ease * 130);
        ctx.globalAlpha = Math.max(0, 1 - e * e);
        ctx.fillStyle = "#2a1a12";
        ctx.fillRect(x - r - 10, y - 8, (r + 10) * 2, 14);
        ctx.fillStyle = "#ff7a1a";
        ctx.fillRect(x - r, y - 5, r * 2, 10);
        ctx.fillStyle = "#ffd23e";
        ctx.fillRect(x - Math.round(r * 0.7), y - 4, Math.round(r * 1.4), 8);
        const colH = Math.round(ease * 150);
        ctx.fillStyle = "#ff7a1a";
        ctx.fillRect(x - 14, y - 22 - colH, 28, colH);
        ctx.fillStyle = "#ffd23e";
        ctx.fillRect(x - 8, y - 22 - Math.round(colH * 0.7), 16, Math.round(colH * 0.7));
        const r2 = Math.round(30 + ease * 190);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - r2, y - 10, r2 * 2, 3);
        ctx.fillRect(x - r2, y + 4, r2 * 2, 2);
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 20, y - 16, 40, 14);
        ctx.fillRect(x - 12, y - 24, 24, 10);
        for (let d = 0; d < 10; d++) {
          const a = Math.PI + ((d * 97) % 100) / 100 * Math.PI;
          const dist = ease * (70 + ((d * 53) % 90));
          const dx = Math.round(Math.cos(a) * dist);
          const dy = Math.round(Math.sin(a) * dist * 0.55) - Math.round(e * 30 * (1 - e));
          ctx.fillStyle = d % 3 ? "#3a3a48" : "#ff7a1a";
          ctx.fillRect(x + dx, y - 30 + dy, 3, 3);
        }
        ctx.globalAlpha = 1;
      }
    }
    if (this.held) {

      const x = Math.round(this.held.x - camX);
      const y = Math.round(this.held.y);
      const fl = Math.round((performance.now() / 60) % 3);
      ctx.fillStyle = "#ff7a1a";
      ctx.fillRect(x - 2, y - 34 - fl, 5, 10);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x - 1, y - 28 - fl, 3, 5);
      ctx.fillStyle = "#1a1a20";
      ctx.fillRect(x - 4, y - 24, 8, 20);
      ctx.fillStyle = "#3a3a48";
      ctx.fillRect(x - 6, y - 12, 2, 6);
      ctx.fillRect(x + 4, y - 12, 2, 6);
      ctx.fillStyle = "#7a1a1a";
      ctx.fillRect(x - 4, y - 8, 8, 4);
    }
  },
};
export const Beams = {
  list: [],
  spawn(x1, y1, x2, y2, life = 0.12, color = null) {
    this.list.push({ x1, y1, x2, y2, t: 0, life, color });
  },
  update(dt) {
    for (const b of this.list) b.t += dt;
    this.list = this.list.filter((b) => b.t < b.life);
  },
  draw(ctx, camX) {
    for (const b of this.list) {
      const k = 1 - b.t / b.life;
      const x1 = Math.round(b.x1 - camX), y1 = Math.round(b.y1);
      const x2 = Math.round(b.x2 - camX), y2 = Math.round(b.y2);
      const w = Math.abs(x2 - x1);
      const x0 = Math.min(x1, x2);
      const halo = b.color ?? "#ff3b1a";
      ctx.globalAlpha = 0.55 * k + 0.25;
      ctx.fillStyle = halo;
      ctx.fillRect(x0, y1 - 3, w, 7);
      ctx.globalAlpha = 0.9 * k + 0.1;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(x0, y1 - 1, w, 3);
      ctx.fillStyle = "#ffd0d0";
      ctx.fillRect(x2 - 4, y2 - 5, 8, 11);
      ctx.globalAlpha = 1;
    }
  },
};

export const Bolts = {
  list: [],
  strike(x, yGround, yTop = 0, life = 0.22) {
    const segs = [];
    let jx = x;
    const n = 7;
    for (let i = 0; i <= n; i++) {
      segs.push(jx);
      jx += (Math.random() - 0.5) * 26;
    }
    this.list.push({ segs, yGround, yTop, t: 0, life });
  },
  update(dt) {
    for (const b of this.list) b.t += dt;
    this.list = this.list.filter((b) => b.t < b.life);
  },
  draw(ctx, camX) {
    for (const b of this.list) {
      const k = Math.max(0, 1 - b.t / b.life);
      const n = b.segs.length - 1;
      for (let i = 0; i < n; i++) {
        const y0 = Math.round(b.yTop + (b.yGround - b.yTop) * (i / n));
        const y1 = Math.round(b.yTop + (b.yGround - b.yTop) * ((i + 1) / n));
        const x = Math.round(b.segs[i] - camX);
        ctx.globalAlpha = 0.85 * k + 0.15;
        ctx.fillStyle = "#bff4ff";
        ctx.fillRect(x - 2, y0, 5, y1 - y0 + 1);
        ctx.globalAlpha = 0.9 * k + 0.1;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(x - 1, y0, 3, y1 - y0 + 1);
      }
      ctx.globalAlpha = 1;
      const ix = Math.round(b.segs[n] - camX);
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ix - 5, Math.round(b.yGround) - 3, 10, 4);
    }
  },
};

export const WebLines = {
  list: [],
  shoot(x1, y1, x2, y2, life = 0.08) {
    this.list.push({ x1, y1, x2, y2, t: 0, life });
  },
  update(dt) {
    for (const l of this.list) l.t += dt;
    this.list = this.list.filter((l) => l.t < l.life);
  },
  draw(ctx, camX) {
    for (const l of this.list) {
      const k = Math.max(0, 1 - l.t / l.life);
      const x1 = Math.round(l.x1 - camX), y1 = Math.round(l.y1);
      const x2 = Math.round(l.x2 - camX), y2 = Math.round(l.y2);
      ctx.globalAlpha = 0.5 * k + 0.3;
      ctx.fillStyle = "#9fd4ff";
      const dx = x2 - x1, dy = y2 - y1;
      const steps = Math.max(1, Math.round(Math.hypot(dx, dy) / 3));
      for (let i = 0; i <= steps; i++) {
        const px = Math.round(x1 + (dx * i) / steps);
        const py = Math.round(y1 + (dy * i) / steps);
        ctx.fillRect(px - 1, py - 1, 3, 3);
      }
      ctx.globalAlpha = 0.9 * k + 0.1;
      ctx.fillStyle = "#ffffff";
      for (let i = 0; i <= steps; i += 2) {
        const px = Math.round(x1 + (dx * i) / steps);
        const py = Math.round(y1 + (dy * i) / steps);
        ctx.fillRect(px, py, 2, 2);
      }
      ctx.globalAlpha = 1;
    }
  },
};

export const FlyingHammer = {  cur: null,
  show(x, y, dir) { this.cur = { x, y, dir }; },
  hide() { this.cur = null; },
  draw(ctx, camX) {
    const h = this.cur;
    if (!h) return;
    const x = Math.round(h.x - camX), y = Math.round(h.y);
    ctx.fillStyle = "#35c8ff";
    ctx.fillRect(x - h.dir * 26, y - 1, 24, 2);
    ctx.fillStyle = "#1a1a20";
    ctx.fillRect(x - 7, y - 4, 14, 9);
    ctx.fillStyle = "#9a9ab0";
    ctx.fillRect(x - 6, y - 3, 12, 7);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(x - 6, y - 3, 12, 2);
    ctx.fillStyle = "#4a3320";
    ctx.fillRect(x + (h.dir >= 0 ? 6 : -9), y - 1, 4, 4);
  },
};
