import { VIEW_W, VIEW_H, GROUND_Y } from "../config.js";
import { px } from "../render/pixel.js";
import { skyGlow, grade, vignette, rng, layer } from "./draw.js";

function tank(ctx, x, seed, t) {
  const r = rng(seed);
  px(ctx, x, 150, 90, 120, "#0a0c14");
  px(ctx, x + 8, 160, 74, 60, "#12324a");
  const flick = (Math.sin(t * 3 + seed) > -0.9) ? "#9fd4ff" : "#3a6a9f";
  px(ctx, x + 8, 160, 74, 8, flick);
  px(ctx, x + 8, 200, 10, 10, "#ff3030");
  px(ctx, x + 30, 230, 30, 8, r() < 0.5 ? "#1d5a3a" : "#5a3a1d");
  px(ctx, x + 62, 176, 4, 44, "#0c0e16");
  for (let b = 0; b < 4; b++) {
    const by = 168 + ((seed * 7 + b * 13 + Math.floor(t * 2)) % 40);
    px(ctx, x + 62, by, 4, 4, "#9fd4ff");
  }
}

function consoleBank(ctx, x, seed, t) {
  px(ctx, x, 250, 70, 60, "#232842");
  px(ctx, x, 250, 70, 6, "#9fd4ff");
  const blink = Math.sin(t * 4 + seed * 2) > 0 ? "#ff9a3e" : "#5a3a1d";
  px(ctx, x + 8, 270, 12, 10, blink);
  px(ctx, x + 26, 270, 6, 6, "#ff3030");
  px(ctx, x + 38, 270, 20, 6, "#12324a");
  px(ctx, x + 76, 270, 20, 14, "#ff9a3e");
  px(ctx, x + 76, 270, 20, 3, "#ffd23e");
}

export const lab = {
  id: "lab",
  name: "UNDERGROUND LAB",
  width: 1500,
  desc: "Tight metal corridors — smallest stage, the walls close in fast.",
  particles: { kind: "lab", count: 55 },
  draw(ctx, camX, t) {
    px(ctx, 0, 0, VIEW_W, GROUND_Y, "#181b28");
    px(ctx, 0, 290, VIEW_W, 10, "#232842");
    layer(ctx, camX, 0.6, 720, 24, (i, x) => {
      if (x < -20 || x > VIEW_W + 20) return;
      px(ctx, x, 110, 2, 280, "#20263c");
      if (i % 4 === 0) {
        px(ctx, x - 30, 180, 60, 3, "#2a3049");
        px(ctx, x + 40, 330, 30, 2, "#2a3049");
      }
      if (i % 6 === 0) {
        px(ctx, x + 10, 220, 40, 60, "#141828");
        px(ctx, x + 14, 226, 32, 8, (Math.sin(t * 2 + i) > 0) ? "#3a6a9f" : "#1d2f45");
      }
    });
    layer(ctx, camX, 1.0, 120, 24, (i, x) => {
      if (x < -20 || x > VIEW_W + 20) return;
      px(ctx, x, 110, 2, 280, "#1a1e2e");
      if (i % 4 === 0) {
        px(ctx, x - 30, 180, 60, 3, "#232842");
        px(ctx, x + 40, 330, 30, 2, "#232842");
      }
    });
    layer(ctx, camX, 1.0, 640, 4, (i, x) => {
      if (x < -100 || x > VIEW_W + 100) return;
      px(ctx, x, 132, 130, 5, "#232842");
      px(ctx, x + 8, 133, 40, 3, (Math.sin(t * 2 + i * 3) > 0.2) ? "#ff9a3e" : "#5a3a1d");
      px(ctx, x + 60, 133, 52, 3, "#3a6a9f");
    });

    layer(ctx, camX, 0.2, 1200, 6, (i, x) => {
      tank(ctx, x, i, t);
    });

    px(ctx, 0, 90, VIEW_W, 14, "#2a2f45");
    px(ctx, 0, 120, VIEW_W, 8, "#1a1e2e");
    layer(ctx, camX, 0.35, 900, 9, (i, x) => {
      const sag = Math.round(Math.sin(i * 2.3) * 4);
      px(ctx, x, 92 + sag, 200, 8, "#343a55");
      px(ctx, x, 92 + sag, 200, 2, "#4e587f");
      for (let c = 0; c < 4; c++) px(ctx, x + 20 + c * 48, 100 + sag, 6, 8, "#232842");
    });

    layer(ctx, camX, 0.5, 1300, 9, (i, x) => {
      px(ctx, x, 60, 22, 240, "#343a55");
      px(ctx, x, 60, 4, 240, "#4e587f");
      px(ctx, x - 6, 200, 34, 10, "#232842");
      px(ctx, x + 2, 208, 6, 30, "#ff9a3e");
      px(ctx, x + 2, 208, 6, 4, "#ffd23e");
      const sw = Math.round(Math.sin(t * 1.5 + i) * 4);
      px(ctx, x + 30 + sw, 128, 3, 90, "#0c0e16");
      px(ctx, x + 30 + sw, 128, 12, 3, "#1c2136");
      consoleBank(ctx, x + 60, i, t);
    });

    const stutter = (Math.sin(t * 13.7) > 0.86 || Math.sin(t * 3.1) > 0.985) ? 0.25 : 1.0;
    ctx.globalAlpha = 0.10 * stutter;
    px(ctx, 0, 90, VIEW_W, 120, "#9fd4ff");
    ctx.globalAlpha = 1;

    px(ctx, 0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, "#23262f");
    px(ctx, 0, GROUND_Y, VIEW_W, 5, "#4e587f");
    layer(ctx, camX, 1.0, 193, 20, (i, x) => {
      if (x < -60 || x > VIEW_W + 60) return;
      px(ctx, x, GROUND_Y + 20, 60, 3, "#16181f");
      if (i % 3 === 0) {
        for (let s = 0; s < 6; s++) px(ctx, x + s * 10, GROUND_Y + 40, 6, 8, s % 2 ? "#14141f" : "#8a6d00");
      }
      if (i % 4 === 1) {
        px(ctx, x + 10, GROUND_Y + 8, 14, 2, "#8a7a3a");
        px(ctx, x + 30, GROUND_Y + 30, 22, 2, "#3a3f55");
      }
      if (i % 5 === 2) {
        px(ctx, x + 44, GROUND_Y + 6, 5, 2, "#9fd4ff");
        px(ctx, x + 44, GROUND_Y + 10, 3, 6, "#3a6a9f");
      }
    });

    layer(ctx, camX, 1.0, 500, 5, (i, x) => {
      if (x < -80 || x > VIEW_W + 80) return;
      const puff = (t * 0.7 + i * 0.33) % 1;
      const vy = Math.round(puff * 46);
      ctx.globalAlpha = 0.35 * (1 - puff);
      px(ctx, x, GROUND_Y - 8 - vy, 14, 6, "#9fd4ff");
      ctx.globalAlpha = 1;
      px(ctx, x - 4, GROUND_Y - 6, 22, 6, "#343a55");
      px(ctx, x - 4, GROUND_Y - 6, 22, 2, "#4e587f");
    });

    layer(ctx, camX, 1.3, 1200, 6, (i, x) => {
      px(ctx, x, VIEW_H - 60, 40, 60, "#0b0d14");
      px(ctx, x, VIEW_H - 60, 6, 60, "#1c2136");
      px(ctx, x + 12, VIEW_H - 96, 4, 36, "#0b0d14");
      px(ctx, x + 20, VIEW_H - 70, 3, 70, "#141828");
    });

    const emerg = 0.5 + 0.5 * Math.sin(t * 2.2);
    ctx.globalAlpha = 0.10 + 0.08 * emerg;
    px(ctx, 0, 0, 120, VIEW_H, "#ff3030");
    px(ctx, VIEW_W - 120, 0, 120, VIEW_H, "#ff3030");
    ctx.globalAlpha = 1;

    grade(ctx, VIEW_H, [[0, "rgba(159,212,255,0.14)"], [0.5, "rgba(0,0,0,0)"], [1, "rgba(0,0,0,0.35)"]]);
    skyGlow(ctx, 180, 96, 90, "rgba(159,212,255,0.18)");
    vignette(ctx, VIEW_W, VIEW_H, 0.38);
  },
};
