import { VIEW_W, VIEW_H, GROUND_Y } from "../config.js";
import { px } from "../render/pixel.js";
import { band, skyGlow, grade, haze, vignette, rng, layer } from "./draw.js";

function towerBlock(ctx, x, h, seed, t) {
  const r = rng(seed);
  px(ctx, x, 300 - h, 70, h, "#2a2138");
  px(ctx, x, 292 - h, 70, 8, "#1c1626");
  if (seed % 3 === 0) px(ctx, x + 10, 300 - h - 12, 30, 14, "#2a2138");
  for (let wy = 0; wy < 6; wy++) {
    for (let wx = 0; wx < 3; wx++) {
      if (r() < 0.55) continue;
      const warm = r() < 0.6;
      px(ctx, x + 8 + wx * 20, 300 - h + 16 + wy * 20, 10, 12,
        warm ? (r() < 0.5 ? "#ffd23e" : "#ff9a3e") : "#9fd4ff");
    }
  }
  if (r() < 0.4) {
    px(ctx, x + 50, 296, 4, 40, "#14101c");
    px(ctx, x + 48, 288, 8, 8, r() < 0.5 ? "#ff3030" : "#14101c");
  }
}

function facade(ctx, x, seed, t) {
  const r = rng(seed);
  px(ctx, x, 230, 110, 170, "#3d3348");
  px(ctx, x, 230, 110, 8, "#241d2e");
  px(ctx, x, 300, 110, 4, "#241d2e");
  for (let wy = 0; wy < 4; wy++) {
    for (let wx = 0; wx < 3; wx++) {
      if (r() < 0.5) {
        px(ctx, x + 14 + wx * 30, 248 + wy * 32, 22, 24, "#14101c");
      } else if (r() < 0.3) {
        px(ctx, x + 14 + wx * 30, 248 + wy * 32, 22, 24, "#ffd23e");
      }
    }
  }
  px(ctx, x + 60, 300, 30, 60, "#241d2e");
  for (let b = 0; b < 5; b++) px(ctx, x + 62 + b * 5, 300 + ((seed + b * 17) % 50), 3, 10, "#4a4258");
  px(ctx, x - 20, 380, 60, 20, "#4a4258");
  px(ctx, x + 90, 386, 44, 14, "#4a4258");
  if (r() < 0.5) {
    px(ctx, x + 20, 236, 50, 16, "#12101a");
    px(ctx, x + 24, 240, 42, 8, (Math.sin(t * 5 + seed) > 0) ? "#ff3b9a" : "#5a1d3a");
  }
}

function streetFire(ctx, x, seed, t) {
  const fl = Math.sin(t * 9 + seed * 3) * 2 + Math.sin(t * 23 + seed) * 1.5;
  px(ctx, x - 8, GROUND_Y - 6, 30, 6, "#1c1c22");
  px(ctx, x, GROUND_Y - 26 + fl, 14, 20, "#ff7a1a");
  px(ctx, x + 3, GROUND_Y - 20 + fl, 8, 14, "#ffd23e");
  px(ctx, x + 5, GROUND_Y - 14 + fl, 4, 8, "#ffffff");
  skyGlow(ctx, x + 7, GROUND_Y - 20, 70, "rgba(255,122,26,0.30)");
  if (seed % 2 === 0) {
    px(ctx, x + 22, GROUND_Y - 12, 8, 12, "#2e2e36");
    px(ctx, x + 22, GROUND_Y - 12, 8, 2, "#ff7a1a");
  }
}

export const city = {
  id: "city",
  name: "OVERRUN CITY",
  width: 1700,
  desc: "A wide broken boulevard — roomiest stage, embers on the wind.",
  particles: { kind: "embers", count: 65 },
  draw(ctx, camX, t) {
    band(ctx, ["#241d3e", "#3a2a55", "#6e3a55", "#c96a3e", "#e8a04e"], 58);
    px(ctx, 480 - camX * 0.02, 190, 56, 56, "#ffe2a8");
    skyGlow(ctx, 508 - camX * 0.02, 218, 120, "rgba(255,226,168,0.35)");

    const sweep = ((t * 40) % 1400) - 200;
    ctx.globalAlpha = 0.12;
    px(ctx, sweep, 60, 90, 180, "#ff3b3b");
    px(ctx, sweep + 90, 60, 60, 180, "#3b6bff");
    ctx.globalAlpha = 1;

    layer(ctx, camX, 0.08, 760, 9, (i, x) => {
      const h = 130 + ((i * 53) % 110);
      px(ctx, x, 300 - h, 80, h, "#1c1626");
      if (i % 2 === 0) {
        px(ctx, x + 14, 300 - h + 24, 8, 8, "#ffd23e");
        px(ctx, x + 44, 300 - h + 60, 8, 8, "#ff9a3e");
      }
      if (i % 4 === 0) {
        ctx.globalAlpha = 0.5;
        px(ctx, x + 30, 300 - h - 40, 3, 40, "#3a3a4a");
        ctx.globalAlpha = 1;
      }
    });

    haze(ctx, 270, 40, "rgba(201,106,62,0.30)");

    px(ctx, 0, 280, VIEW_W, GROUND_Y - 280, "#503a4a");
    px(ctx, 0, 280, VIEW_W, 18, "#6e4a58");
    layer(ctx, camX, 0.3, 860, 8, (i, x) => {
      const h = 70 + ((i * 71) % 60);
      px(ctx, x, 420 - h, 120, h, "#453348");
      px(ctx, x, 412 - h, 120, 8, "#372a3a");
      if (i % 2 === 0) {
        px(ctx, x + 16, 420 - h + 18, 9, 9, "#e8a04e");
        px(ctx, x + 70, 420 - h + 40, 9, 9, "#c96a3e");
      }
      if (i % 3 === 0) px(ctx, x + 40, 408 - h, 26, 12, "#372a3a");
    });

    layer(ctx, camX, 0.2, 1200, 7, (i, x) => {
      towerBlock(ctx, x, 90 + ((i * 53) % 110), i, t);
    });
    const seg = Math.floor(t / 6) % 4;
    layer(ctx, camX, 0.2, 1200, 7, (i, x) => {
      if (i % 3 !== 1) return;
      px(ctx, x - 120, 130, 90, 40, "#12101a");
      px(ctx, x - 112, 138, 74, 10, seg === i % 4 ? "#ff3b9a" : "#3a2a4a");
      px(ctx, x - 112, 152, 74, 10, seg === (i + 2) % 4 ? "#35c8ff" : "#3a2a4a");
    });

    layer(ctx, camX, 0.35, 1000, 6, (i, x) => {
      const tilt = (i % 2 === 0 ? 1 : -1) * 10;
      px(ctx, x, 120, 16, 200, "#3d3348");
      px(ctx, x + tilt, 300, 60, 14, "#3d3348");
      for (let w = 0; w < 5; w++) px(ctx, x + 4 + w * 3, 140 + w * 30, 8, 4, "#241d2e");
    });

    layer(ctx, camX, 0.5, 1400, 7, (i, x) => {
      facade(ctx, x, i, t);
    });

    layer(ctx, camX, 0.6, 1100, 6, (i, x) => {
      if (i % 2 === 0) {
        px(ctx, x, 360, 60, 40, "#23232c");
        px(ctx, x + 8, 330, 44, 30, "#2e2e36");
        px(ctx, x + 14, 336, 32, 18, "#14101c");
        px(ctx, x, 398, 60, 6, "#101016");
      } else {
        px(ctx, x, 380, 10, 60, "#3a3a45");
        px(ctx, x - 14, 372, 38, 10, "#23232c");
        const go = Math.sin(t * 1.2 + i) > 0;
        px(ctx, x - 4, 384, 8, 8, go ? "#3ecf5a" : "#ff3b3b");
        px(ctx, x + 16, 340, 30, 44, "#1a1a20");
        px(ctx, x + 20, 344, 22, 10, go ? "#ffd23e" : "#4a4a55");
        px(ctx, x + 20, 366, 22, 14, "#101016");
      }
    });

    px(ctx, 0, GROUND_Y, VIEW_W, VIEW_H - GROUND_Y, "#2e2e36");
    px(ctx, 0, GROUND_Y, VIEW_W, 5, "#6a6a7a");
    px(ctx, 0, GROUND_Y + 34, VIEW_W, 4, "#8a7a3a");
    layer(ctx, camX, 1.0, 139, 30, (i, x) => {
      if (x < -30 || x > VIEW_W + 30) return;
      px(ctx, x, GROUND_Y + 12 + ((i * 29) % 40), 10, 2, "#1c1c22");
      if (i % 4 === 0) px(ctx, x, GROUND_Y + 50, 12, 6, "#4a4258");
      if (i % 6 === 1) {
        px(ctx, x + 40, GROUND_Y + 46, 26, 4, "#c9b13e");
        px(ctx, x + 72, GROUND_Y + 46, 26, 4, "#c9b13e");
      }
      if (i % 9 === 2) {
        px(ctx, x - 30, GROUND_Y + 20, 18, 4, "#23232c");
        px(ctx, x - 30, GROUND_Y + 24, 18, 8, "#141419");
      }
    });

    layer(ctx, camX, 1.0, 700, 5, (i, x) => {
      if (x < -100 || x > VIEW_W + 100) return;
      streetFire(ctx, x, i, t);
    });
    layer(ctx, camX, 1.0, 900, 4, (i, x) => {
      if (x < -80 || x > VIEW_W + 80) return;
      const rise = (t * 30 + i * 170) % 120;
      ctx.globalAlpha = 0.22 * (1 - rise / 120);
      px(ctx, x, GROUND_Y - 10 - rise, 16, 10, "#9aa0b0");
      ctx.globalAlpha = 1;
      px(ctx, x - 8, GROUND_Y - 4, 32, 4, "#1c1c22");
    });

    layer(ctx, camX, 1.3, 1300, 5, (i, x) => {
      px(ctx, x, VIEW_H - 70, 90, 70, "#12101a");
      px(ctx, x + 10, VIEW_H - 90, 40, 24, "#12101a");
      px(ctx, x + 60, VIEW_H - 110, 12, 110, "#0c0a12");
      px(ctx, x + 60, VIEW_H - 110, 12, 6, "#ff7a1a");
      px(ctx, x + 60, VIEW_H - 96, 12, 4, "#ffd23e");
      skyGlow(ctx, x + 66, VIEW_H - 100, 60, "rgba(255,122,26,0.25)");
      if (i % 2 === 0) {
        px(ctx, x - 40, VIEW_H - 60, 8, 60, "#0c0a12");
        px(ctx, x - 44, VIEW_H - 76, 16, 16, "#14101c");
        px(ctx, x - 40, VIEW_H - 72, 8, 4, (Math.sin(t * 2 + i) > 0) ? "#ffd23e" : "#4a4a55");
      }
    });

    grade(ctx, VIEW_H, [[0, "rgba(255,160,60,0.10)"], [0.6, "rgba(0,0,0,0)"], [1, "rgba(10,0,20,0.35)"]]);
    vignette(ctx, VIEW_W, VIEW_H, 0.34);
  },
};
