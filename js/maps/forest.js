import { VIEW_W, VIEW_H, GROUND_Y } from "../config.js";
import { px } from "../render/pixel.js";
import { wrap, band, skyGlow, godrays, grade, haze, vignette, rng, layer } from "./draw.js";

function tree(ctx, x, baseY, s, dark, sway) {
  const trunk = dark ? "#2a1f18" : "#4a3423";
  const leaf = dark ? "#1d3120" : "#2e5233";
  px(ctx, x + sway, baseY - 90 * s, 10 * s, 90 * s, trunk);
  px(ctx, x - 14 * s + sway * 1.6, baseY - 150 * s, 38 * s, 60 * s, leaf);
  px(ctx, x - 14 * s + sway * 1.6, baseY - 150 * s, 38 * s, 6 * s, dark ? "#243d28" : "#3f7030");
  px(ctx, x + 10 * s + sway, baseY - 70 * s, 14 * s, 4 * s, trunk);
  if (!dark) {
    px(ctx, x - 10 * s + sway * 2, baseY - 140 * s, 8 * s, 12 * s, "#3f7030");
    px(ctx, x + 16 * s + sway * 2, baseY - 128 * s, 6 * s, 10 * s, "#3f7030");
  }
}

function ruin(ctx, x, baseY, w, h, c1, c2, seed) {
  const r = rng(seed);
  px(ctx, x, baseY - h, w, h, c1);
  for (let i = 0; i < 4; i++) px(ctx, x + 4 + i * (w / 4), baseY - h - 6 + (i % 2) * 4, w / 5, 8, c1);
  px(ctx, x, baseY - h, 3, h, c2);
  px(ctx, x + 3, baseY - 20, w - 6, 3, "#1a1a22");
  const rows = 3, cols = 4;
  for (let ry = 0; ry < rows; ry++) {
    for (let cx = 0; cx < cols; cx++) {
      if (r() < 0.45) continue;
      const lit = r() < 0.25;
      px(ctx, x + 8 + cx * ((w - 16) / cols), baseY - h + 12 + ry * ((h - 30) / rows),
        (w - 16) / cols - 6, (h - 30) / rows - 8, lit ? "#e8c87a" : "#14141c");
    }
  }
  px(ctx, x - 6, baseY + 2, w + 12, 5, "#232a1e");
  px(ctx, x - 14, baseY + 2, 6, 3, "#3a4a2e");
  px(ctx, x + w + 8, baseY + 2, 8, 4, "#3a4a2e");
}

function rubble(ctx, x, baseY, seed) {
  const r = rng(seed);
  for (let i = 0; i < 5; i++) {
    const w = 6 + r() * 14, h = 4 + r() * 8;
    px(ctx, x + r() * 40 - 10, baseY - h, w, h, r() < 0.5 ? "#4a4a58" : "#5a5a6e");
    px(ctx, x + r() * 40 - 10, baseY - h, w, 2, "#7a7a92");
  }
}

export const forest = {
  id: "forest",
  name: "RUINED FOREST",
  width: 1600,
  desc: "Dusk ruins over grown earth — a standard-size stage.",
  particles: { kind: "leaves", count: 70 },
  draw(ctx, camX, t) {
    band(ctx, ["#1d2547", "#2b3a67", "#3a4f7e", "#57709a", "#8fa3b8"], 52);
    skyGlow(ctx, 680 - camX * 0.02, 150, 130, "rgba(232,200,122,0.55)");
    px(ctx, 680 - camX * 0.02, 120, 60, 60, "#e8c87a");
    px(ctx, 690 - camX * 0.02, 130, 40, 40, "#f4e2a8");
    godrays(ctx, 480, 60, 500, 5, 300, "#f4e2a8", t);

    layer(ctx, camX, 0.08, 700, 8, (i, x) => {
      const h = 150 + ((i * 67) % 90);
      px(ctx, x, 265 - h, 170, h, "#1a2540");
      px(ctx, x + 20, 265 - h, 130, 14, "#232f52");
    });

    px(ctx, 0, 250, VIEW_W, GROUND_Y - 250, "#2e4033");
    px(ctx, 0, 250, VIEW_W, 26, "#3d5a44");
    layer(ctx, camX, 0.10, 480, 12, (i, x) => {
      const h = 60 + ((i * 37) % 50);
      px(ctx, x, 330 - h, 90, h, "#35493c");
      px(ctx, x + 10, 330 - h, 70, 10, "#47604f");
    });

    haze(ctx, 235, 45, "rgba(143,163,184,0.35)");

    layer(ctx, camX, 0.18, 620, 8, (i, x) => {
      ruin(ctx, x, 300, 64, 110 + ((i * 41) % 50), "#3d3d52", "#55556e", 1000 + i);
    });
    layer(ctx, camX, 0.2, 1100, 24, (i, x) => {
      px(ctx, x, 250, 60, 120, "#22331f");
      px(ctx, x + 10, 230, 40, 30, "#22331f");
    });

    haze(ctx, 330, 50, "rgba(60,80,60,0.30)");

    layer(ctx, camX, 0.28, 420, 16, (i, x) => {
      const sway = Math.sin(t * 0.8 + i * 2.1) * 2;
      px(ctx, x, 320, 9, 70, "#33291d");
      px(ctx, x - 26 + sway, 288, 60, 40, "#2c4a30");
      px(ctx, x - 26 + sway, 288, 60, 7, "#3d5a44");
      px(ctx, x - 18 + sway, 322, 44, 6, "#31463a");
      if (i % 3 === 0) {
        px(ctx, x + 28, 344, 22, 46, "#33291d");
        px(ctx, x + 20, 326, 38, 24, "#2c4a30");
      }
      if (i % 4 === 0) {
        const fl = 0.5 + 0.5 * Math.sin(t * 5 + i * 2);
        ctx.globalAlpha = 0.5 + 0.5 * fl;
        px(ctx, x + 6, 310, 3, 3, "#e8dd8a");
        ctx.globalAlpha = 1;
      }
    });

    layer(ctx, camX, 0.35, 700, 10, (i, x) => {
      const sway = Math.sin(t * 0.8 + i * 1.3) * 3;
      tree(ctx, x, 400, 1.3, true, sway);
    });
    layer(ctx, camX, 0.5, 1400, 8, (i, x) => {
      ruin(ctx, x, 380, 70, 90, "#5a5a6e", "#7a7a92", 2000 + i);
      tree(ctx, x + 120, 390, 1.1, true, Math.sin(t * 0.8 + i) * 2);
      if (i % 2 === 0) {
        px(ctx, x + 30, 372, 26, 8, "#3a3a4a");
        px(ctx, x + 34, 364, 18, 8, "#4a4a5c");
      }
    });

    haze(ctx, 240, GROUND_Y - 240, "rgba(20,20,60,0.18)");

    px(ctx, 0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, "#3a4a2e");
    px(ctx, 0, GROUND_Y, VIEW_W, 6, "#6fae4e");
    px(ctx, 0, GROUND_Y + 6, VIEW_W, 3, "#2a3822");

    layer(ctx, camX, 1.0, 97, 40, (i, x) => {
      if (x < -20 || x > VIEW_W + 20) return;
      const j = (i * 37) % 23;
      px(ctx, x, GROUND_Y + 14 + j, 6, 3, "#2a3822");
      px(ctx, x + 2, GROUND_Y - 4, 2, 4, "#6fae4e");
      if (i % 5 === 0) {
        px(ctx, x - 8, GROUND_Y + 4, 22, 4, "#4a4a58");
        px(ctx, x - 4, GROUND_Y + 1, 12, 3, "#5a5a6e");
      }
      if (i % 7 === 0) {
        px(ctx, x + 10, GROUND_Y + 8, 30, 2, "#31313d");
        px(ctx, x + 14, GROUND_Y + 10, 22, 2, "#31313d");
      }
    });

    layer(ctx, camX, 1.0, 400, 8, (i, x) => {
      if (x < -60 || x > VIEW_W + 60) return;
      rubble(ctx, x, GROUND_Y + 30, 3000 + i);
      if (i % 3 === 0) {
        px(ctx, x, GROUND_Y - 46, 8, 46, "#2a3423");
        px(ctx, x + 8, GROUND_Y - 30, 30, 3, "#2a3423");
        px(ctx, x + 12, GROUND_Y - 44, 22, 14, "#22331f");
      }
    });

    const flick = 0.6 + 0.4 * Math.sin(t * 7.3) * Math.sin(t * 3.1);
    layer(ctx, camX, 0.5, 1400, 8, (i, x) => {
      if (i % 3 !== 0) return;
      ctx.globalAlpha = 0.25 * flick;
      px(ctx, x + 20, 340, 30, 24, "#e8c87a");
      ctx.globalAlpha = 1;
    });

    layer(ctx, camX, 1.3, 1100, 12, (i, x) => {
      px(ctx, x, VIEW_H - 120, 26, 120, "#101a0c");
      px(ctx, x + 26, VIEW_H - 90, 14, 90, "#101a0c");
      px(ctx, x - 8, VIEW_H - 60, 42, 10, "#16240f");
      if (i % 2 === 0) {
        px(ctx, x + 40, VIEW_H - 40, 20, 40, "#101a0c");
        px(ctx, x + 44, VIEW_H - 52, 12, 12, "#1d3120");
      }
    });

    grade(ctx, VIEW_H, [[0, "rgba(20,20,60,0.25)"], [0.6, "rgba(0,0,0,0)"], [1, "rgba(232,150,60,0.12)"]]);
    vignette(ctx, VIEW_W, VIEW_H, 0.32);
  },
};
