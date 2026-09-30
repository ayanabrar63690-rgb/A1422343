import { px } from "../render/pixel.js";

export const wrap = (v, span) => ((v % span) + span) % span;

export function band(ctx, colors, h) {
  colors.forEach((c, i) => px(ctx, 0, i * h, 960, h, c));
}

export function skyGlow(ctx, x, y, r, c) {
  const g = ctx.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, c);
  g.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = g;
  ctx.fillRect(x - r, y - r, r * 2, r * 2);
}

export function godrays(ctx, x, y, w, count, len, c, t) {
  ctx.save();
  ctx.globalAlpha = 0.14;
  for (let i = 0; i < count; i++) {
    const drift = Math.sin(t * 0.35 + i * 1.7) * 6;
    const rx = x + i * (w / count) - w / 2 + drift;
    ctx.fillStyle = c;
    ctx.beginPath();
    ctx.moveTo(rx, y);
    ctx.lineTo(rx + w / count * 0.45, y);
    ctx.lineTo(rx + w / count * 1.5, y + len);
    ctx.lineTo(rx + w / count * 0.2, y + len);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
}

export function grade(ctx, h, stops) {
  const g = ctx.createLinearGradient(0, 0, 0, h);
  for (const [at, c] of stops) g.addColorStop(at, c);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 960, h);
}

export function haze(ctx, y, h, c) {
  ctx.fillStyle = c;
  ctx.fillRect(0, y, 960, h);
}

export function vignette(ctx, w, h, strength) {
  const g = ctx.createRadialGradient(w / 2, h / 2, h * 0.35, w / 2, h / 2, h * 0.95);
  g.addColorStop(0, "rgba(0,0,0,0)");
  g.addColorStop(1, "rgba(0,0,0," + strength + ")");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, w, h);
}

export function floorDecal(ctx, camX, i, step, y, w, h, c) {
  const x = i * step - camX;
  if (x < -30 || x > 990) return;
  px(ctx, x, y, w, h, c);
}

export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

export function layer(ctx, camX, parallax, span, count, place) {
  for (let i = 0; i < count; i++) {
    const x = wrap(i * span * 0.6180339 - camX * parallax, span) - span * 0.2;
    place(i, x);
  }
}
