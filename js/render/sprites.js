import { makeCanvas, px } from "./pixel.js";
import { SPRITE_W, SPRITE_H } from "../config.js";

const OUT = "#06060c";

const LY_W = Object.freeze({
  torso: "#1b1b26", rim: "#33334d", pants: "#14141c", shade: "#08080d",
  skin: "#e6b48c", hair: "#c8a45e", eye: "#0b0b10", eyeHi: "#ff3030",
  boot: "#000000", bootHi: "#3a3a4d", cape: null, belt: null,
});
const LY_H = Object.freeze({
  torso: "#2043e0", rim: "#6f86ff", pants: "#2043e0", shade: "#152c96",
  skin: "#f2c9a0", hair: "#d9b45f", eye: "#ffffff", eyeHi: "#1a3fd4",
  boot: "#a01313", bootHi: "#e05050", cape: "#a01313", belt: "#ffd23e",
});

function paintLying(ctx, lk, P) {
  const flatHead = (hx, hy) => {
    box(ctx, hx, hy, 8, 7, P.skin);
    px(ctx, hx, hy, 8, 2, P.hair);
    px(ctx, hx, hy + 3, 8, 2, P.eye);
    px(ctx, hx + 2, hy + 3, 2, 1, P.eyeHi);
  };
  const flatLegs = (x0, y0) => {
    px(ctx, x0 - 1, y0 - 1, 14, 6, OUT);
    px(ctx, x0, y0, 12, 4, P.pants);
    px(ctx, x0, y0, 12, 1, P.rim);
    px(ctx, x0 + 12, y0 - 1, 5, 6, P.boot);
    px(ctx, x0 + 12, y0 - 1, 5, 1, P.bootHi);
  };
  const flatTorso = (x0, y0) => {
    px(ctx, x0 - 1, y0 - 1, 13, 8, OUT);
    px(ctx, x0, y0, 11, 6, P.torso);
    px(ctx, x0, y0, 11, 1, P.rim);
    if (P.belt) px(ctx, x0 + 8, y0 + 1, 3, 4, P.belt);
  };
  if (P.cape) {
    px(ctx, 5, 45, 22, 3, P.cape);
    px(ctx, 8, 46, 14, 1, "#6e0d0d");
  }
  if (lk === 0) {

    leg(ctx, 12, 34, 12, P.pants, P.shade, P.boot, P.bootHi);
    leg(ctx, 19, 34, 12, P.pants, P.shade, P.boot, P.bootHi);
    box(ctx, 12, 17, 12, 17, P.torso);
    px(ctx, 12, 17, 2, 17, P.rim);
    box(ctx, 13, 6, 10, 9, P.skin);
    px(ctx, 13, 6, 10, 3, P.hair);
    px(ctx, 13, 10, 10, 2, P.eye);
    px(ctx, 8, 4, 4, 12, OUT); px(ctx, 9, 5, 2, 10, P.torso); px(ctx, 9, 5, 2, 2, P.skin);
    px(ctx, 24, 4, 4, 12, OUT); px(ctx, 25, 5, 2, 10, P.torso); px(ctx, 25, 5, 2, 2, P.skin);
  } else if (lk === 1) {

    leg(ctx, 10, 38, 8, P.pants, P.shade, P.boot, P.bootHi);
    leg(ctx, 21, 38, 8, P.pants, P.shade, P.boot, P.bootHi);
    box(ctx, 11, 23, 12, 16, P.torso);
    px(ctx, 11, 23, 2, 16, P.rim);
    box(ctx, 11, 13, 10, 9, P.skin);
    px(ctx, 11, 13, 10, 3, P.hair);
    px(ctx, 11, 17, 10, 2, P.eye);
    px(ctx, 24, 8, 8, 3, OUT); px(ctx, 25, 9, 6, 1, P.skin);
    arm(ctx, 6, 24, 5, 9, P.torso, P.shade, P.skin);
  } else if (lk === 2) {

    px(ctx, 14, 30, 11, 6, OUT); px(ctx, 15, 31, 9, 4, P.torso);
    px(ctx, 11, 35, 11, 6, OUT); px(ctx, 12, 36, 9, 4, P.torso);
    px(ctx, 8, 39, 12, 6, OUT); px(ctx, 9, 40, 10, 4, P.torso);
    px(ctx, 9, 40, 10, 1, P.rim);
    box(ctx, 1, 38, 8, 7, P.skin);
    px(ctx, 1, 38, 8, 2, P.hair);
    px(ctx, 1, 41, 8, 2, P.eye);
    flatLegs(20, 42);
    px(ctx, 16, 32, 8, 3, OUT); px(ctx, 17, 33, 6, 1, P.skin);
  } else if (lk <= 7) {

    const breathe = lk === 6 ? -1 : 0;
    flatLegs(18, 44);
    flatTorso(9, 42 + breathe);
    flatHead(1, 41);
    if (lk === 3) {

      px(ctx, 11, 33, 5, 9, OUT); px(ctx, 12, 34, 3, 7, P.torso);
      px(ctx, 11, 30, 5, 4, P.skin);
      px(ctx, 26, 38, 2, 2, "#ffffff");
      px(ctx, 29, 41, 2, 2, "#ffffff");
    } else if (lk === 5 || lk === 7) {

      px(ctx, 1, 40, 8, 1, P.skin);
      px(ctx, 10, 43, 8, 3, OUT); px(ctx, 11, 44, 6, 1, P.torso);
      px(ctx, 15, 43, 3, 3, P.skin);
    } else {

      px(ctx, 10, 44, 9, 3, OUT); px(ctx, 11, 45, 7, 1, P.torso);
      px(ctx, 16, 44, 3, 3, P.skin);
    }
  } else if (lk === 8) {

    flatLegs(20, 43);
    px(ctx, 10, 35, 10, 5, OUT); px(ctx, 11, 36, 8, 3, P.torso);
    px(ctx, 15, 38, 8, 5, OUT); px(ctx, 16, 39, 6, 3, P.torso);
    box(ctx, 2, 33, 8, 7, P.skin);
    px(ctx, 2, 33, 8, 2, P.hair);
    px(ctx, 2, 36, 8, 2, P.eye);
    px(ctx, 12, 40, 4, 8, OUT); px(ctx, 13, 41, 2, 6, P.torso); px(ctx, 13, 45, 2, 3, P.skin);
  } else if (lk === 9) {

    px(ctx, 8, 43, 8, 4, OUT); px(ctx, 9, 44, 6, 2, P.pants);
    px(ctx, 18, 38, 9, 5, OUT); px(ctx, 19, 39, 7, 3, P.pants);
    leg(ctx, 24, 36, 10, P.pants, P.shade, P.boot, P.bootHi);
    box(ctx, 12, 24, 11, 15, P.torso);
    px(ctx, 12, 24, 2, 15, P.rim);
    if (P.belt) px(ctx, 12, 33, 11, 3, P.belt);
    box(ctx, 13, 14, 10, 9, P.skin);
    px(ctx, 13, 14, 10, 3, P.hair);
    px(ctx, 13, 18, 10, 2, P.eye);
    px(ctx, 14, 30, 8, 3, OUT); px(ctx, 15, 31, 6, 1, P.torso);
  } else if (lk === 10) {

    leg(ctx, 9, 40, 6, P.pants, P.shade, P.boot, P.bootHi);
    leg(ctx, 22, 40, 6, P.pants, P.shade, P.boot, P.bootHi);
    box(ctx, 12, 26, 12, 15, P.torso);
    px(ctx, 12, 26, 2, 15, P.rim);
    box(ctx, 13, 16, 10, 9, P.skin);
    px(ctx, 13, 16, 10, 3, P.hair);
    px(ctx, 13, 20, 10, 2, P.eye);
    arm(ctx, 7, 28, 5, 9, P.torso, P.shade, P.skin);
    arm(ctx, 24, 28, 5, 9, P.torso, P.shade, P.skin);
  } else {

    leg(ctx, 12, 35, 11, P.pants, P.shade, P.boot, P.bootHi);
    leg(ctx, 19, 35, 11, P.pants, P.shade, P.boot, P.bootHi);
    box(ctx, 12, 20, 12, 15, P.torso);
    px(ctx, 12, 20, 2, 15, P.rim);
    box(ctx, 13, 9, 10, 9, P.skin);
    px(ctx, 13, 9, 10, 3, P.hair);
    px(ctx, 13, 13, 10, 2, P.eye);
    px(ctx, 22, 26, 7, 9, OUT); px(ctx, 23, 27, 5, 7, P.torso); px(ctx, 23, 32, 5, 2, P.skin);
    arm(ctx, 7, 22, 5, 9, P.torso, P.shade, P.skin);
  }
}

function box(ctx, x, y, w, h, fill, outline = OUT) {
  px(ctx, x - 1, y - 1, w + 2, h + 2, outline);
  px(ctx, x, y, w, h, fill);
}

function leg(ctx, x, yTop, h, main, dark, boot, bootHi) {
  const w = 5;
  px(ctx, x - 1, yTop - 1, w + 2, h + 3, OUT);
  px(ctx, x, yTop, w, h, main);
  px(ctx, x + 3, yTop, 2, h, dark);
  px(ctx, x, yTop + h - 2, w, 4, boot);
  px(ctx, x, yTop + h - 2, w, 1, bootHi);
}

function arm(ctx, x, y, w, h, sleeve, sleeveDark, fist) {
  px(ctx, x - 1, y - 1, w + 2, h + 2, OUT);
  px(ctx, x, y, w, h, sleeve);
  px(ctx, x, y, w, 1, sleeveDark);
  px(ctx, x + (w > 6 ? w - 3 : 0), y + h - 3, 3, 3, fist);
}

function paintWesker(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_W); return; }
  const bob = p.bob;
  const drop = (p.crouch ? 8 : 0) + (p.dip || 0);
  const lean = (p.dash ? 2 : 0) + (p.wind || 0);

  const sway = p.coatSway;
  px(ctx, cx - 8 + sway, 30 + bob + drop, 6, 14, "#101018");
  px(ctx, cx + 2 - sway, 30 + bob + drop, 6, 14, "#101018");
  px(ctx, cx - 8 + sway, 30 + bob + drop, 1, 14, "#33334d");
  px(ctx, cx + 7 - sway, 30 + bob + drop, 1, 14, "#33334d");

  const LM = "#14141c", LD = "#08080d", BT = "#000000", BH = "#3a3a4d";
  if (p.crouch) {
    leg(ctx, cx - 9 + p.legL, 40 + bob, 6, LM, LD, BT, BH);
    leg(ctx, cx + 4 + p.legR, 40 + bob, 6, LM, LD, BT, BH);
  } else if (p.air === 1) {
    leg(ctx, cx - 6 + p.legL, 37 + bob, 7, LM, LD, BT, BH);
    leg(ctx, cx + 1 + p.legR, 39 + bob, 5, LM, LD, BT, BH);
  } else if (p.air === 2) {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 11, LM, LD, BT, BH);
    leg(ctx, cx + 1 + p.legR, 35 + bob, 10, LM, LD, BT, BH);
  } else if (p.dash) {
    leg(ctx, cx - 10, 36 + bob, 10, LM, LD, BT, BH);
    leg(ctx, cx + 4, 36 + bob, 10, LM, LD, BT, BH);
  } else if (p.guardWalk) {

    leg(ctx, cx - 6 + (p.legL || 0), 34 + bob, 12, LM, LD, BT, BH);
    leg(ctx, cx + 1 + (p.legR || 0), 34 + bob, 12, LM, LD, BT, BH);
  } else if (p.brace) {
    leg(ctx, cx - 9 + (p.legL || 0), 38 + bob, 8, LM, LD, BT, BH);
    leg(ctx, cx + 4 + (p.legR || 0), 38 + bob, 8, LM, LD, BT, BH);
  } else {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 12, LM, LD, BT, BH);
    leg(ctx, cx + 1 + p.legR, 34 + bob, 12, LM, LD, BT, BH);
  }
  ctx.save();
  ctx.translate(lean, drop);

  box(ctx, cx - 6, 19 + bob, 12, 16, "#1b1b26");
  px(ctx, cx - 6, 19 + bob, 2, 16, "#33334d");
  px(ctx, cx + 4, 19 + bob, 2, 16, "#0c0c12");
  px(ctx, cx - 2, 20 + bob, 4, 9, "#0a0a10");
  px(ctx, cx - 1, 22 + bob, 2, 6, "#23232f");
  px(ctx, cx - 6, 16 + bob, 12, 4, "#101018");
  px(ctx, cx - 6, 16 + bob, 12, 1, "#3d3d5c");

  px(ctx, cx - 5, 24 + bob, 1, 11, "#3a3a55");
  px(ctx, cx + 4, 24 + bob, 1, 11, "#000000");

  const hy = 7 + bob + (p.headBob || 0);
  box(ctx, cx - 5, hy, 10, 9, "#e6b48c");
  px(ctx, cx + 3, hy, 2, 9, "#b98a63");
  px(ctx, cx - 5, hy, 10, 3, "#c8a45e");
  px(ctx, cx - 5, hy + 2, 2, 3, "#c8a45e");
  px(ctx, cx + 3, hy + 2, 2, 3, "#c8a45e");

  if (p.unmasked) {

    px(ctx, cx - 5, hy + 4, 10, 2, "#7a1010");
    px(ctx, cx - 4, hy + 4, 3, 2, "#ff2a2a");
    px(ctx, cx + 1, hy + 4, 3, 2, "#ff2a2a");
    px(ctx, cx - 4, hy + 4, 3, 1, "#ffd0d0");
    px(ctx, cx + 1, hy + 4, 3, 1, "#ffd0d0");
    px(ctx, cx - 5, hy + 7, 10, 1, "#5a0d0d");
  } else {
    px(ctx, cx - 5, hy + 4, 10, 3, "#0b0b10");
    px(ctx, cx - 5, hy + 4, 10, 1, "#3a3a4d");
    px(ctx, cx + 1, hy + 5, 2, 1, "#ff3030");
  }
  px(ctx, cx - 3, hy + 8, 4, 1, "#a87c58");

  if (p.tackle) {

    px(ctx, cx + 0, 24 + bob, 12, 7, OUT);
    px(ctx, cx + 1, 25 + bob, 10, 5, "#1b1b26");
    px(ctx, cx + 1, 25 + bob, 10, 1, "#33334d");
    px(ctx, cx + 8, 25 + bob, 4, 5, "#4a3320");
    px(ctx, cx - 8, 22 + bob, 8, 2, "#9fd4ff");
    px(ctx, cx - 10, 25 + bob, 10, 2, "#3a6a9f");
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.unmaskMid) {

    px(ctx, cx + 3, 10 + bob, 6, 12, OUT);
    px(ctx, cx + 4, 11 + bob, 4, 10, "#1b1b26");
    px(ctx, cx + 4, 17 + bob, 4, 4, "#4a3320");
    px(ctx, cx + 4, 11 + bob, 4, 1, "#ff3030");
    px(ctx, cx - 8, 22 + bob, 2, 8, "#ff3b1a");
    px(ctx, cx - 5, 24 + bob, 2, 6, "#ffb13e");
    arm(ctx, cx - 9, 22 + bob, 5, 9, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.leap) {

    px(ctx, cx - 8, 26 + bob, 6, 10, OUT);
    px(ctx, cx - 7, 27 + bob, 4, 8, "#1b1b26");
    px(ctx, cx - 7, 33 + bob, 4, 3, "#4a3320");
    px(ctx, cx + 3, 26 + bob, 6, 10, OUT);
    px(ctx, cx + 4, 27 + bob, 4, 8, "#1b1b26");
    px(ctx, cx + 4, 33 + bob, 4, 3, "#4a3320");
    px(ctx, cx - 11, 18 + bob, 3, 12, "#9fd4ff");
    px(ctx, cx + 8, 18 + bob, 3, 12, "#3a6a9f");
  } else if (p.hover) {

    px(ctx, cx - 13, 14 + bob, 6, 10, OUT);
    px(ctx, cx - 12, 15 + bob, 4, 8, "#1b1b26");
    px(ctx, cx - 12, 15 + bob, 4, 2, "#4a3320");
    px(ctx, cx + 8, 14 + bob, 6, 10, OUT);
    px(ctx, cx + 9, 15 + bob, 4, 8, "#1b1b26");
    px(ctx, cx + 9, 15 + bob, 4, 2, "#4a3320");
    px(ctx, cx - 2, 8 + bob, 4, 4, "#ff3b1a");
  } else if (p.carry) {

    px(ctx, cx - 10, 8 + bob, 6, 14, OUT);
    px(ctx, cx - 9, 9 + bob, 4, 12, "#1b1b26");
    px(ctx, cx - 9, 9 + bob, 4, 3, "#4a3320");
    px(ctx, cx + 5, 8 + bob, 6, 14, OUT);
    px(ctx, cx + 6, 9 + bob, 4, 12, "#1b1b26");
    px(ctx, cx + 6, 9 + bob, 4, 3, "#4a3320");
    px(ctx, cx - 5, 4 + bob, 10, 3, "#1a1a20");
    px(ctx, cx - 5, 4 + bob, 10, 1, "#ff7a1a");
  } else if (p.seize) {

    px(ctx, cx - 2, 21 + bob, 12, 4, OUT);
    px(ctx, cx - 1, 22 + bob, 10, 2, "#1b1b26");
    px(ctx, cx + 7, 21 + bob, 4, 4, "#4a3320");
    px(ctx, cx - 6, 23 + bob, 6, 8, "#1b1b26");
    px(ctx, cx - 6, 28 + bob, 5, 3, "#4a3320");
  } else if (p.guard === 1) {

    px(ctx, cx + 2, 17 + bob, 6, 14, OUT);
    px(ctx, cx + 3, 18 + bob, 4, 12, "#1b1b26");
    px(ctx, cx + 3, 18 + bob, 4, 1, "#33334d");
    px(ctx, cx + 3, 16 + bob, 4, 4, "#4a3320");
    px(ctx, cx + 3, 16 + bob, 4, 1, "#8a6540");
    arm(ctx, cx - 9, 24 + bob, 5, 7, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.guard === 2) {

    px(ctx, cx - 8, 22 + bob, 14, 8, OUT);
    px(ctx, cx - 7, 23 + bob, 12, 2, "#1b1b26");
    px(ctx, cx - 7, 27 + bob, 12, 2, "#23232f");
    px(ctx, cx - 7, 23 + bob, 3, 6, "#4a3320");
    px(ctx, cx + 4, 23 + bob, 3, 6, "#4a3320");
    px(ctx, cx - 7, 23 + bob, 12, 1, "#33334d");
  } else if (p.windup) {

    px(ctx, cx - 9, 19 + bob, 7, 11, OUT);
    px(ctx, cx - 8, 20 + bob, 5, 9, "#1b1b26");
    px(ctx, cx - 8, 20 + bob, 5, 4, "#4a3320");
    px(ctx, cx + 2, 21 + bob, 7, 11, OUT);
    px(ctx, cx + 3, 22 + bob, 5, 9, "#1b1b26");
    px(ctx, cx + 3, 22 + bob, 5, 4, "#8a6540");
  } else if (p.slam) {

    px(ctx, cx - 2, 24 + bob, 14, 6, OUT);
    px(ctx, cx - 1, 25 + bob, 12, 4, "#1b1b26");
    px(ctx, cx + 7, 25 + bob, 5, 5, "#4a3320");
    px(ctx, cx + 7, 25 + bob, 5, 1, "#8a6540");
    px(ctx, cx + 2, 12 + bob, 2, 10, "#9fd4ff");
    px(ctx, cx + 6, 14 + bob, 2, 8, "#3a6a9f");
  } else if (p.overhead) {

    px(ctx, cx - 9, 8 + bob, 7, 14, OUT);
    px(ctx, cx - 8, 9 + bob, 5, 12, "#1b1b26");
    px(ctx, cx - 8, 9 + bob, 5, 3, "#4a3320");
    px(ctx, cx + 2, 10 + bob, 7, 14, OUT);
    px(ctx, cx + 3, 11 + bob, 5, 12, "#1b1b26");
    px(ctx, cx + 3, 11 + bob, 5, 1, "#8a6540");
  } else if (p.punch > 0) {

    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    const ex = cx + 6, ey = 22 + bob - p.punch;
    px(ctx, ex - 1, ey - 1, 12, 5, OUT);
    px(ctx, ex, ey, 11, 3, "#1b1b26");
    px(ctx, ex + 8, ey - 1, 4, 5, "#4a3320");
    px(ctx, ex + 8, ey - 1, 4, 1, "#8a6540");

    px(ctx, ex - 4, ey + 1, 3, 1, "#9fd4ff");
  } else if (p.kick > 0) {
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    arm(ctx, cx + 4, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");

    px(ctx, cx + 2, 36 + bob, 13, 5, "#14141c");
    px(ctx, cx + 2, 36 + bob, 13, 1, "#33334d");
    px(ctx, cx + 11, 35 + bob, 4, 6, "#000000");
  } else if (p.palm) {

    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    px(ctx, cx + 6, 21 + bob - 1, 10, 4, OUT);
    px(ctx, cx + 7, 22 + bob - 1, 8, 2, "#1b1b26");
    px(ctx, cx + 13, 22 + bob - 1, 3, 2, "#e6b48c");
    px(ctx, cx + 3, 22 + bob, 3, 1, "#9fd4ff");
  } else if (p.elbow) {

    px(ctx, cx - 4, 22 + bob, 10, 6, OUT);
    px(ctx, cx - 3, 23 + bob, 8, 4, "#1b1b26");
    px(ctx, cx + 3, 23 + bob, 3, 4, "#4a3320");
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.backfist) {

    px(ctx, cx + 1, 8 + bob, 6, 15, OUT);
    px(ctx, cx + 2, 9 + bob, 4, 13, "#1b1b26");
    px(ctx, cx + 2, 9 + bob, 4, 4, "#4a3320");
    arm(ctx, cx - 9, 22 + bob, 5, 9, "#1b1b26", "#0c0c12", "#4a3320");
    px(ctx, cx - 2, 12 + bob, 2, 6, "#9fd4ff");
  } else if (p.cobra) {

    px(ctx, cx + 2, 20 + bob, 16, 5, OUT);
    px(ctx, cx + 3, 21 + bob, 14, 3, "#1b1b26");
    px(ctx, cx + 3, 21 + bob, 14, 1, "#33334d");
    px(ctx, cx + 15, 21 + bob, 3, 3, "#e6b48c");
    px(ctx, cx + 15, 22 + bob, 3, 1, "#ff3030");
    px(ctx, cx - 3, 22 + bob, 5, 1, "#9fd4ff");
    px(ctx, cx - 5, 24 + bob, 7, 1, "#3a6a9f");
    arm(ctx, cx - 9, 22 + bob, 5, 9, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.gun) {

    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    px(ctx, cx + 2, 20 + bob, 16, 7, OUT);
    px(ctx, cx + 3, 21 + bob, 9, 5, "#1b1b26");
    px(ctx, cx + 3, 21 + bob, 9, 1, "#33334d");
    px(ctx, cx + 11, 21 + bob, 7, 4, OUT);
    px(ctx, cx + 12, 22 + bob, 5, 2, "#9a9ab0");
    px(ctx, cx + 12, 24 + bob, 3, 2, "#3a2a1a");
    px(ctx, cx + 16, 22 + bob, 2, 1, "#ffd23e");
    px(ctx, cx - 4, 24 + bob, 6, 4, "#4a3320");
  } else {
    arm(ctx, cx - 9, 21 + bob + p.armSwing, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    arm(ctx, cx + 4, 21 + bob - p.armSwing, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    if (p.dash) {

      px(ctx, cx - 13, 24 + bob, 4, 1, "#9fd4ff");
      px(ctx, cx - 15, 27 + bob, 6, 1, "#3a6a9f");
    }
  }
  ctx.restore();
}

function paintHomelander(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_H); return; }
  const bob = p.bob;
  const drop = (p.crouch ? 8 : 0) + (p.dip || 0);
  const lean = (p.dash ? 2 : 0) + (p.wind || 0);

  const wv = p.capeWave;
  px(ctx, cx - 10 + wv, 16 + bob + drop, 5, 28, "#6e0d0d");
  px(ctx, cx - 5 + wv, 16 + bob + drop, 12, 28, "#a01313");
  px(ctx, cx + 7 + wv, 16 + bob + drop, 1, 28, "#e05050");
  for (let i = 0; i < 5; i++) {
    px(ctx, cx - 5 + wv + (i % 2), 20 + bob + drop + i * 5, 10 - i, 1, "#6e0d0d");
  }

  const LM = "#2043e0", LD = "#152c96", BT = "#a01313", BH = "#e05050";
  if (p.crouch) {
    leg(ctx, cx - 9 + p.legL, 40 + bob, 6, LM, LD, BT, BH);
    leg(ctx, cx + 4 + p.legR, 40 + bob, 6, LM, LD, BT, BH);
  } else if (p.air === 1) {
    leg(ctx, cx - 6 + p.legL, 37 + bob, 7, LM, LD, BT, BH);
    leg(ctx, cx + 1 + p.legR, 39 + bob, 5, LM, LD, BT, BH);
  } else if (p.air === 2) {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 11, LM, LD, BT, BH);
    leg(ctx, cx + 1 + p.legR, 35 + bob, 10, LM, LD, BT, BH);
  } else if (p.dash) {
    leg(ctx, cx - 10, 36 + bob, 10, LM, LD, BT, BH);
    leg(ctx, cx + 4, 36 + bob, 10, LM, LD, BT, BH);
  } else if (p.guardWalk) {

    leg(ctx, cx - 6 + (p.legL || 0), 34 + bob, 12, LM, LD, BT, BH);
    leg(ctx, cx + 1 + (p.legR || 0), 34 + bob, 12, LM, LD, BT, BH);
  } else if (p.brace) {
    leg(ctx, cx - 9 + (p.legL || 0), 38 + bob, 8, LM, LD, BT, BH);
    leg(ctx, cx + 4 + (p.legR || 0), 38 + bob, 8, LM, LD, BT, BH);
  } else {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 12, LM, LD, BT, BH);
    leg(ctx, cx + 1 + p.legR, 34 + bob, 12, LM, LD, BT, BH);
  }
  ctx.save();
  ctx.translate(lean, drop);

  box(ctx, cx - 7, 19 + bob, 14, 16, "#2043e0");
  px(ctx, cx - 7, 19 + bob, 3, 16, "#6f86ff");
  px(ctx, cx + 4, 19 + bob, 3, 16, "#152c96");
  px(ctx, cx - 2, 21 + bob, 4, 5, "#6f86ff");

  px(ctx, cx - 2, 23 + bob, 4, 2, "#ffd23e");
  px(ctx, cx - 4, 23 + bob, 2, 1, "#ffffff");
  px(ctx, cx + 2, 23 + bob, 2, 1, "#ffffff");

  px(ctx, cx - 7, 31 + bob, 14, 3, "#ffd23e");
  px(ctx, cx - 1, 31 + bob, 3, 3, "#fff2a8");

  px(ctx, cx - 6, 20 + bob, 2, 2, "#ffffff");
  px(ctx, cx + 4, 20 + bob, 2, 2, "#ffffff");

  const hy = 7 + bob + (p.headBob || 0);
  box(ctx, cx - 5, hy, 10, 9, "#f2c9a0");
  px(ctx, cx + 3, hy, 2, 9, "#c89868");
  px(ctx, cx - 5, hy - 1, 10, 3, "#d9b45f");
  px(ctx, cx + 1, hy - 1, 5, 1, "#f4dd9a");
  px(ctx, cx - 5, hy + 2, 1, 4, "#d9b45f");
  px(ctx, cx - 3, hy + 4, 2, 2, "#ffffff");
  px(ctx, cx + 1, hy + 4, 2, 2, "#ffffff");
  px(ctx, cx - 3, hy + 5, 1, 1, "#1a3fd4");
  px(ctx, cx + 1, hy + 5, 1, 1, "#1a3fd4");
  if (p.lase) {

    px(ctx, cx - 3, hy + 4, 2, 2, "#ffffff");
    px(ctx, cx + 1, hy + 4, 2, 2, "#ffffff");
    px(ctx, cx - 3, hy + 5, 2, 1, "#ff3b1a");
    px(ctx, cx + 1, hy + 5, 2, 1, "#ff3b1a");
  }
  px(ctx, cx - 2, hy + 8, 4, 1, "#a8764e");
  if (p.strain) {

    px(ctx, cx - 4, hy + 3, 4, 1, "#8a6a2a");
    px(ctx, cx + 0, hy + 3, 4, 1, "#8a6a2a");
    px(ctx, cx - 3, hy + 8, 6, 2, "#ffffff");
    px(ctx, cx - 3, hy + 8, 1, 2, "#a8764e");
    px(ctx, cx + 0, hy + 8, 1, 2, "#a8764e");
    px(ctx, cx + 2, hy + 8, 1, 2, "#a8764e");
  } else if (p.shout) {

    px(ctx, cx - 3, hy + 1, 6, 1, "#d9b45f");
    px(ctx, cx - 3, hy + 7, 6, 4, "#3a0d0d");
    px(ctx, cx - 3, hy + 7, 6, 1, "#ffffff");
    px(ctx, cx - 2, hy + 9, 4, 2, "#7a1a1a");
  }

  if (p.strain) {

    px(ctx, cx - 9, 23 + bob, 6, 11, OUT);
    px(ctx, cx - 8, 24 + bob, 4, 9, "#2043e0");
    px(ctx, cx - 8, 30 + bob, 4, 3, "#f2c9a0");
    px(ctx, cx + 3, 23 + bob, 6, 11, OUT);
    px(ctx, cx + 4, 24 + bob, 4, 9, "#2043e0");
    px(ctx, cx + 4, 30 + bob, 4, 3, "#f2c9a0");
  } else if (p.charge) {

    px(ctx, cx - 2, 22 + bob, 10, 5, OUT);
    px(ctx, cx - 1, 23 + bob, 8, 3, "#152c96");
    px(ctx, cx + 5, 23 + bob, 3, 3, "#7a1a1a");
    px(ctx, cx - 6, 25 + bob, 5, 8, "#2043e0");
    px(ctx, cx - 6, 31 + bob, 4, 2, "#f2c9a0");
    px(ctx, cx - 4, 14 + bob, 2, 6, "#ffb13e");
  } else if (p.inhale) {

    px(ctx, cx - 12, 22 + bob, 6, 10, OUT);
    px(ctx, cx - 11, 23 + bob, 4, 8, "#152c96");
    px(ctx, cx + 6, 22 + bob, 6, 10, OUT);
    px(ctx, cx + 7, 23 + bob, 4, 8, "#152c96");
    px(ctx, cx - 2, 20 + bob, 8, 4, OUT);
    px(ctx, cx - 1, 21 + bob, 6, 2, "#6f86ff");
    px(ctx, cx - 2, 22 + bob, 8, 2, "#ffd23e");
  } else if (p.ascend) {

    px(ctx, cx - 13 + wv, 16 + bob + drop, 4, 26, "#6e0d0d");
    px(ctx, cx + 9 + wv, 16 + bob + drop, 4, 26, "#a01313");
    px(ctx, cx + 9 + wv, 16 + bob + drop, 1, 26, "#e05050");
    px(ctx, cx - 3, 7 + bob, 2, 2, "#ffffff");
    px(ctx, cx + 1, 7 + bob, 2, 2, "#ffffff");
    px(ctx, cx - 3, 8 + bob, 2, 1, "#ff3b1a");
    px(ctx, cx + 1, 8 + bob, 2, 1, "#ff3b1a");
    px(ctx, cx - 9, 23 + bob, 6, 10, OUT);
    px(ctx, cx - 8, 24 + bob, 4, 8, "#2043e0");
    px(ctx, cx - 8, 30 + bob, 4, 2, "#f2c9a0");
    px(ctx, cx + 3, 23 + bob, 6, 10, OUT);
    px(ctx, cx + 4, 24 + bob, 4, 8, "#2043e0");
    px(ctx, cx + 4, 30 + bob, 4, 2, "#f2c9a0");
  } else if (p.lase) {

    px(ctx, cx - 2, 20 + bob, 10, 5, OUT);
    px(ctx, cx - 1, 21 + bob, 8, 3, "#2043e0");
    px(ctx, cx + 5, 21 + bob, 4, 3, "#ff3b1a");
    px(ctx, cx + 6, 22 + bob, 3, 2, "#ffffff");
    px(ctx, cx - 6, 23 + bob, 5, 8, "#2043e0");
    px(ctx, cx - 6, 29 + bob, 4, 2, "#f2c9a0");
  } else if (p.shout) {

    px(ctx, cx - 12, 20 + bob, 6, 10, OUT);
    px(ctx, cx - 11, 21 + bob, 4, 8, "#2043e0");
    px(ctx, cx - 11, 27 + bob, 4, 2, "#f2c9a0");
    px(ctx, cx + 6, 20 + bob, 6, 10, OUT);
    px(ctx, cx + 7, 21 + bob, 4, 8, "#2043e0");
    px(ctx, cx + 7, 27 + bob, 4, 2, "#f2c9a0");
    px(ctx, cx - 2, 22 + bob, 8, 2, "#ffd23e");
  } else if (p.seize) {
    px(ctx, cx - 3, 21 + bob, 12, 4, OUT);
    px(ctx, cx - 2, 22 + bob, 10, 2, "#2043e0");
    px(ctx, cx + 6, 21 + bob, 4, 4, "#f2c9a0");
    px(ctx, cx - 7, 23 + bob, 6, 8, "#2043e0");
    px(ctx, cx - 7, 28 + bob, 5, 3, "#2043e0");
  } else if (p.guard === 1) {

    px(ctx, cx + 1, 17 + bob, 6, 14, OUT);
    px(ctx, cx + 2, 18 + bob, 4, 12, "#2043e0");
    px(ctx, cx + 2, 18 + bob, 4, 1, "#6f86ff");
    px(ctx, cx + 2, 16 + bob, 4, 4, "#f2c9a0");
    arm(ctx, cx - 10, 24 + bob, 5, 7, "#2043e0", "#152c96", "#2043e0");
  } else if (p.guard === 2) {
    px(ctx, cx - 9, 22 + bob, 14, 8, OUT);
    px(ctx, cx - 8, 23 + bob, 12, 2, "#2043e0");
    px(ctx, cx - 8, 27 + bob, 12, 2, "#152c96");
    px(ctx, cx - 8, 23 + bob, 3, 6, "#f2c9a0");
    px(ctx, cx + 3, 23 + bob, 3, 6, "#f2c9a0");
    px(ctx, cx - 8, 23 + bob, 12, 1, "#ffffff");
  } else if (p.windup) {
    px(ctx, cx - 10, 19 + bob, 7, 11, OUT);
    px(ctx, cx - 9, 20 + bob, 5, 9, "#2043e0");
    px(ctx, cx - 9, 20 + bob, 5, 4, "#f2c9a0");
    px(ctx, cx + 3, 21 + bob, 7, 11, OUT);
    px(ctx, cx + 4, 22 + bob, 5, 9, "#2043e0");
    px(ctx, cx + 4, 22 + bob, 5, 4, "#6f86ff");
  } else if (p.slam) {
    px(ctx, cx - 3, 24 + bob, 14, 6, OUT);
    px(ctx, cx - 2, 25 + bob, 12, 4, "#2043e0");
    px(ctx, cx + 6, 25 + bob, 5, 5, "#f2c9a0");
    px(ctx, cx + 6, 25 + bob, 5, 1, "#ffffff");
    px(ctx, cx + 1, 12 + bob, 2, 10, "#ffffff");
    px(ctx, cx + 5, 14 + bob, 2, 8, "#6f86ff");
  } else if (p.overhead) {
    px(ctx, cx - 10, 8 + bob, 7, 14, OUT);
    px(ctx, cx - 9, 9 + bob, 5, 12, "#2043e0");
    px(ctx, cx - 9, 9 + bob, 5, 3, "#f2c9a0");
    px(ctx, cx + 3, 10 + bob, 7, 14, OUT);
    px(ctx, cx + 4, 11 + bob, 5, 12, "#2043e0");
    px(ctx, cx + 4, 11 + bob, 5, 1, "#6f86ff");
  } else if (p.punch > 0) {
    arm(ctx, cx - 10, 21 + bob, 5, 10, "#2043e0", "#152c96", "#2043e0");
    const ex = cx + 7, ey = 22 + bob - p.punch;
    px(ctx, ex - 1, ey - 1, 12, 5, OUT);
    px(ctx, ex, ey, 11, 3, "#2043e0");
    px(ctx, ex, ey, 11, 1, "#6f86ff");
    px(ctx, ex + 8, ey - 1, 4, 5, "#f2c9a0");
    px(ctx, ex - 4, ey + 1, 3, 1, "#ffffff");
  } else if (p.kick > 0) {
    arm(ctx, cx - 10, 21 + bob, 5, 10, "#2043e0", "#152c96", "#2043e0");
    arm(ctx, cx + 5, 21 + bob, 5, 10, "#2043e0", "#152c96", "#2043e0");
    px(ctx, cx + 2, 36 + bob, 13, 5, "#2043e0");
    px(ctx, cx + 2, 36 + bob, 13, 1, "#6f86ff");
    px(ctx, cx + 11, 35 + bob, 4, 6, "#a01313");
    px(ctx, cx + 11, 35 + bob, 4, 1, "#e05050");
  } else if (p.hook) {

    px(ctx, cx + 3, 12 + bob, 9, 14, OUT);
    px(ctx, cx + 4, 13 + bob, 7, 12, "#2043e0");
    px(ctx, cx + 4, 13 + bob, 7, 2, "#6f86ff");
    px(ctx, cx + 6, 21 + bob, 5, 5, "#f2c9a0");
    px(ctx, cx - 1, 16 + bob, 3, 8, "#ffffff");
    arm(ctx, cx - 10, 22 + bob, 5, 9, "#2043e0", "#152c96", "#2043e0");
  } else if (p.sweep) {

    px(ctx, cx - 2, 37 + bob, 16, 4, OUT);
    px(ctx, cx - 1, 38 + bob, 14, 2, "#2043e0");
    px(ctx, cx - 1, 38 + bob, 14, 1, "#6f86ff");
    px(ctx, cx + 11, 36 + bob, 5, 5, "#a01313");
    px(ctx, cx + 11, 36 + bob, 5, 1, "#e05050");
    px(ctx, cx + 17, 40 + bob, 3, 2, "#8a7a5a");
    px(ctx, cx + 20, 38 + bob, 2, 2, "#8a7a5a");
    arm(ctx, cx - 10, 18 + bob + p.armSwing, 5, 9, "#2043e0", "#152c96", "#2043e0");
    arm(ctx, cx + 5, 22 + bob, 5, 9, "#2043e0", "#152c96", "#2043e0");
  } else {
    arm(ctx, cx - 10, 21 + bob + p.armSwing, 5, 10, "#2043e0", "#152c96", "#2043e0");
    arm(ctx, cx + 5, 21 + bob - p.armSwing, 5, 10, "#2043e0", "#152c96", "#2043e0");
    if (p.dash) {
      px(ctx, cx - 14, 24 + bob, 4, 1, "#ffffff");
      px(ctx, cx - 16, 27 + bob, 6, 1, "#6f86ff");
    }
  }
  ctx.restore();
}

function paintWolverine(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_X); return; }
  const bob = p.bob;
  const YB = "#e8a81c", YD = "#9a6a0a", BL = "#1c3faa", BD = "#10246a";
  const MSK = "#0b0b10", CLW = "#e8ecf4";

  const claw = (x, y, len, dx = 1) => {
    for (let i = 0; i < 3; i++) px(ctx, x, y + i * 2, len, 1, CLW);
    px(ctx, x, y, 1, 6, "#8a93a8");
    px(ctx, x + (dx > 0 ? len : -1), y, 1, 6, "#ffffff");
  };

  const clawFist = (x, y, len, dx = 1) => {
    px(ctx, x - 1, y - 1, 6, 6, OUT);
    px(ctx, x, y, 4, 4, BL);
    px(ctx, x, y, 4, 1, "#6f86ff");
    claw(x + (dx > 0 ? 4 : -len), y - 1, len, dx);
  };

  const hunch = p.crouch ? 0 : 1;
  const drop = (p.crouch ? 8 : 0) + (p.dip || 0);
  const lean = (p.crouch ? 1 : 3) + (p.dash ? 2 : 0) + (p.wind || 0);
  if (p.air === 1) {
    leg(ctx, cx - 6 + p.legL, 37 + bob, 7, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 1 + p.legR, 39 + bob, 5, BL, BD, "#0b0b10", "#3a3a4d");
  } else if (p.air === 2) {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 11, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 1 + p.legR, 35 + bob, 10, BL, BD, "#0b0b10", "#3a3a4d");
  } else if (p.dash) {
    leg(ctx, cx - 10, 36 + bob, 10, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 4, 36 + bob, 10, BL, BD, "#0b0b10", "#3a3a4d");
  } else if (p.guardWalk) {

    leg(ctx, cx - 6 + (p.legL || 0), 37 + bob, 9, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 1 + (p.legR || 0), 37 + bob, 9, BL, BD, "#0b0b10", "#3a3a4d");
  } else if (p.brace || hunch) {

    leg(ctx, cx - 9 + (p.legL || 0), 37 + bob, 9, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 4 + (p.legR || 0), 37 + bob, 9, BL, BD, "#0b0b10", "#3a3a4d");
  } else {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 12, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 1 + p.legR, 34 + bob, 12, BL, BD, "#0b0b10", "#3a3a4d");
  }
  ctx.save();
  ctx.translate(lean, drop);

  box(ctx, cx - 6, 20 + bob, 12, 15, YB);
  px(ctx, cx - 6, 20 + bob, 2, 15, "#f4dd9a");
  px(ctx, cx + 4, 20 + bob, 2, 15, YD);
  px(ctx, cx - 6, 21 + bob, 1, 5, BD);
  px(ctx, cx + 5, 21 + bob, 1, 5, BD);
  px(ctx, cx - 2, 24 + bob, 4, 3, BD);
  px(ctx, cx - 7, 31 + bob, 14, 3, BD);
  px(ctx, cx - 1, 31 + bob, 3, 3, YB);

  const hy = 10 + bob + (p.headBob || 0);
  const hx = cx - 3 + (hunch ? 2 : 0);
  box(ctx, hx - 5, hy, 10, 9, "#e6b48c");
  px(ctx, hx + 3, hy, 2, 9, "#b98a63");
  px(ctx, hx - 5, hy, 10, 5, YB);
  px(ctx, hx - 5, hy, 10, 1, "#f4dd9a");
  px(ctx, hx - 5, hy + 4, 10, 1, MSK);
  px(ctx, hx - 5, hy + 1, 1, 3, MSK);
  px(ctx, hx + 4, hy + 1, 1, 3, MSK);

  px(ctx, hx - 10, hy - 3, 6, 3, OUT);
  px(ctx, hx - 10, hy - 3, 5, 2, BL);
  px(ctx, hx - 10, hy - 3, 5, 1, "#6f86ff");
  px(ctx, hx + 4, hy - 3, 6, 3, OUT);
  px(ctx, hx + 5, hy - 3, 5, 2, BL);
  px(ctx, hx + 5, hy - 3, 5, 1, "#6f86ff");
  px(ctx, hx - 3, hy + 2, 2, 1, "#ffffff");
  px(ctx, hx + 1, hy + 2, 2, 1, "#ffffff");
  if (p.rageGlow) {
    px(ctx, hx - 3, hy + 2, 2, 1, "#ff3b1a");
    px(ctx, hx + 1, hy + 2, 2, 1, "#ff3b1a");
  }
  px(ctx, hx - 2, hy + 7, 4, 1, "#a87c58");
  if (p.seize) {

    px(ctx, cx - 2, 22 + bob, 12, 4, OUT);
    px(ctx, cx - 1, 23 + bob, 10, 2, YB);
    clawFist(cx + 9, 21 + bob, 6, 1);
    clawFist(cx - 9, 23 + bob, 5, -1);
  } else if (p.guard === 1) {

    px(ctx, cx + 0, 16 + bob, 8, 14, OUT);
    px(ctx, cx + 1, 17 + bob, 6, 12, BL);
    claw(cx + 1, 18 + bob, 7, 1);
    claw(cx + 1, 24 + bob, 7, 1);
    claw(cx - 6, 20 + bob, 6, -1);
  } else if (p.guard === 2) {

    px(ctx, cx - 8, 23 + bob, 15, 8, OUT);
    px(ctx, cx - 7, 24 + bob, 13, 2, BL);
    px(ctx, cx - 7, 28 + bob, 13, 2, BD);
    claw(cx - 7, 24 + bob, 6, 1);
    claw(cx + 5, 26 + bob, 6, 1);
  } else if (p.windup) {

    px(ctx, cx - 9, 24 + bob, 7, 10, OUT);
    px(ctx, cx - 8, 25 + bob, 5, 8, BL);
    clawFist(cx - 8, 29 + bob, 5, -1);
    px(ctx, cx + 2, 14 + bob, 7, 12, OUT);
    px(ctx, cx + 3, 15 + bob, 5, 10, YB);
    clawFist(cx + 3, 12 + bob, 7, 1);
  } else if (p.slash) {

    px(ctx, cx + 4, 20 + bob, 12, 5, OUT);
    px(ctx, cx + 5, 21 + bob, 10, 3, YB);
    clawFist(cx + 15, 20 + bob, 9, 1);
    px(ctx, cx - 8, 18 + bob, 10, 2, "#8a3aff");
    px(ctx, cx - 6, 21 + bob, 12, 1, "#ff3b1a");
    px(ctx, cx - 6, 24 + bob, 10, 1, "#8a3aff");

    px(ctx, cx - 10, 24 + bob, 6, 8, OUT);
    px(ctx, cx - 9, 25 + bob, 4, 6, BL);
    px(ctx, cx - 9, 28 + bob, 4, 3, BL);
  } else if (p.cross) {

    px(ctx, cx + 2, 16 + bob, 13, 6, OUT);
    px(ctx, cx + 3, 17 + bob, 11, 4, YB);
    clawFist(cx + 14, 16 + bob, 9, 1);
    px(ctx, cx - 8, 20 + bob, 10, 2, "#ff3b1a");
    px(ctx, cx - 6, 23 + bob, 12, 1, "#8a3aff");
    px(ctx, cx - 6, 26 + bob, 10, 1, "#ff3b1a");
    px(ctx, cx - 10, 24 + bob, 6, 8, OUT);
    px(ctx, cx - 9, 25 + bob, 4, 6, BL);
    px(ctx, cx - 9, 28 + bob, 4, 3, BL);
  } else if (p.upper || p.dive) {

    px(ctx, cx - 3, 8 + bob, 9, 13, OUT);
    px(ctx, cx - 2, 9 + bob, 7, 11, YB);
    clawFist(cx + 3, 5 + bob, 9, 1);
    px(ctx, cx - 6, 22 + bob, 6, 8, OUT);
    px(ctx, cx - 5, 23 + bob, 4, 6, BL);
    px(ctx, cx - 8, 10 + bob, 3, 8, "#8a3aff");
    px(ctx, cx + 9, 10 + bob, 3, 8, "#ff3b1a");
  } else if (p.tackle) {

    px(ctx, cx + 0, 24 + bob, 13, 7, OUT);
    px(ctx, cx + 1, 25 + bob, 11, 5, YB);
    clawFist(cx + 12, 24 + bob, 9, 1);
    px(ctx, cx - 10, 24 + bob, 6, 9, OUT);
    px(ctx, cx - 9, 25 + bob, 4, 7, BL);
    clawFist(cx - 13, 24 + bob, 6, -1);
    px(ctx, cx - 8, 22 + bob, 8, 2, "#8a3aff");
    px(ctx, cx - 10, 26 + bob, 10, 1, "#ff3b1a");
  } else {

    px(ctx, cx - 9, 22 + bob + p.armSwing, 6, 9, OUT);
    px(ctx, cx - 8, 23 + bob + p.armSwing, 4, 7, BL);
    clawFist(cx - 12, 22 + bob + p.armSwing, 5, -1);
    px(ctx, cx + 3, 22 + bob - p.armSwing, 6, 9, OUT);
    px(ctx, cx + 4, 23 + bob - p.armSwing, 4, 7, YB);
    clawFist(cx + 8, 22 + bob - p.armSwing, 6, 1);
    if (p.dash) {
      px(ctx, cx - 14, 24 + bob, 4, 1, "#ffffff");
      px(ctx, cx - 16, 27 + bob, 6, 1, "#9fd4ff");
    }
  }
  ctx.restore();
}

const LY_U = Object.freeze({
  torso: "#3e9c3e", rim: "#7ce07c", pants: "#5a2a8f", shade: "#3a1a5c",
  skin: "#3e9c3e", hair: "#0b0b10", eye: "#ffffff", eyeHi: "#ff3b1a",
  boot: "#2e7c2e", bootHi: "#206020", cape: null, belt: "#3a1a5c",
});

function paintHulk(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_U); return; }
  const bob = p.bob;
  const GR = "#3e9c3e", GD = "#206020", LITE = "#7ce07c";
  const PN = "#5a2a8f", PD = "#3a1a5c";

  const feet = [GR, GD];
  if (p.air === 1) {
    leg(ctx, cx - 8 + p.legL, 36 + bob, 8, PN, PD, feet[0], feet[1]);
    leg(ctx, cx + 2 + p.legR, 38 + bob, 6, PN, PD, feet[0], feet[1]);
  } else if (p.air === 2) {
    leg(ctx, cx - 8 + p.legL, 34 + bob, 12, PN, PD, feet[0], feet[1]);
    leg(ctx, cx + 2 + p.legR, 35 + bob, 11, PN, PD, feet[0], feet[1]);
  } else if (p.dash) {
    leg(ctx, cx - 12, 36 + bob, 10, PN, PD, feet[0], feet[1]);
    leg(ctx, cx + 5, 36 + bob, 10, PN, PD, feet[0], feet[1]);
  } else if (p.stomp) {

    leg(ctx, cx - 10, 36 + bob, 10, PN, PD, feet[0], feet[1]);
    box(ctx, cx + 1, 28 + bob, 11, 6, PN);
    px(ctx, cx + 10, 29 + bob, 4, 5, GR);
  } else {
    leg(ctx, cx - 10 + (p.legL || 0), 36 + bob, 10, PN, PD, feet[0], feet[1]);
    leg(ctx, cx + 4 + (p.legR || 0), 36 + bob, 10, PN, PD, feet[0], feet[1]);
  }
  ctx.save();
  ctx.translate(p.wind || 0, (p.crouch ? 7 : 0) + (p.dip || 0));

  box(ctx, cx - 10, 18 + bob, 20, 16, GR);
  px(ctx, cx - 10, 18 + bob, 2, 16, LITE);
  px(ctx, cx + 8, 18 + bob, 2, 16, GD);
  px(ctx, cx - 4, 21 + bob, 8, 2, GD);
  px(ctx, cx - 1, 23 + bob, 2, 6, GD);
  px(ctx, cx - 10, 31 + bob, 20, 3, PN);
  px(ctx, cx - 10, 31 + bob, 20, 1, "#7c4dc0");

  const hy = 8 + bob + (p.headBob || 0);
  const hx = cx - 1;
  box(ctx, hx - 5, hy, 10, 8, GR);
  px(ctx, hx - 5, hy, 10, 2, "#0b0b10");
  px(ctx, hx - 5, hy + 4, 10, 1, GD);
  px(ctx, hx - 3, hy + 5, 2, 2, "#ffffff");
  px(ctx, hx + 1, hy + 5, 2, 2, "#ffffff");
  if (p.rageGlow) {
    px(ctx, hx - 3, hy + 5, 2, 2, "#ff3b1a");
    px(ctx, hx + 1, hy + 5, 2, 2, "#ff3b1a");
  }
  px(ctx, hx - 2, hy + 7, 5, 1, "#144014");

  const fist = (x, y) => {
    px(ctx, x - 1, y - 1, 8, 8, OUT);
    px(ctx, x, y, 6, 6, GR);
    px(ctx, x, y, 6, 2, LITE);
    px(ctx, x, y + 4, 3, 2, GD);
  };
  if (p.seize) {

    px(ctx, cx - 4, 22 + bob, 16, 5, OUT);
    px(ctx, cx - 3, 23 + bob, 14, 3, GR);
    fist(cx + 10, 21 + bob);
    fist(cx - 16, 21 + bob);
  } else if (p.guard === 1) {

    px(ctx, cx - 10, 16 + bob, 20, 14, OUT);
    px(ctx, cx - 9, 17 + bob, 18, 5, GR);
    px(ctx, cx - 9, 24 + bob, 18, 5, GD);
    fist(cx + 8, 16 + bob);
    fist(cx - 14, 23 + bob);
  } else if (p.guard === 2) {

    px(ctx, cx - 11, 26 + bob, 22, 10, OUT);
    px(ctx, cx - 10, 27 + bob, 20, 3, GR);
    px(ctx, cx - 10, 32 + bob, 20, 3, GD);
    fist(cx - 14, 26 + bob);
    fist(cx + 8, 31 + bob);
  } else if (p.windup) {

    px(ctx, cx - 12, 26 + bob, 7, 10, OUT);
    px(ctx, cx - 11, 27 + bob, 5, 8, GD);
    fist(cx - 14, 30 + bob);
    px(ctx, cx + 5, 14 + bob, 7, 10, OUT);
    px(ctx, cx + 6, 15 + bob, 5, 8, GR);
    fist(cx + 5, 12 + bob);
  } else if (p.smash) {

    px(ctx, cx + 2, 4 + bob, 8, 16, OUT);
    px(ctx, cx + 3, 5 + bob, 6, 14, GR);
    fist(cx + 2, 2 + bob);
    px(ctx, cx - 12, 24 + bob, 7, 10, OUT);
    px(ctx, cx - 11, 25 + bob, 5, 8, GD);
    fist(cx - 13, 28 + bob);
  } else if (p.backhand) {

    px(ctx, cx - 12, 20 + bob, 24, 6, OUT);
    px(ctx, cx - 11, 21 + bob, 22, 4, GR);
    fist(cx + 10, 19 + bob);
    px(ctx, cx + 2, 10 + bob, 7, 10, OUT);
    px(ctx, cx + 3, 11 + bob, 5, 8, GD);
  } else if (p.quake) {

    px(ctx, cx - 8, 2 + bob, 7, 17, OUT);
    px(ctx, cx - 7, 3 + bob, 5, 15, GD);
    fist(cx - 8, 0 + bob);
    px(ctx, cx + 1, 2 + bob, 7, 17, OUT);
    px(ctx, cx + 2, 3 + bob, 5, 15, GR);
    fist(cx + 0, 0 + bob);
  } else if (p.stomp) {

    px(ctx, cx - 16, 20 + bob, 7, 6, OUT);
    px(ctx, cx - 15, 21 + bob, 5, 4, GD);
    fist(cx - 17, 19 + bob);
    px(ctx, cx + 9, 20 + bob, 7, 6, OUT);
    px(ctx, cx + 10, 21 + bob, 5, 4, GR);
    fist(cx + 10, 19 + bob);
  } else if (p.tackle) {

    px(ctx, cx + 2, 20 + bob, 14, 10, OUT);
    px(ctx, cx + 3, 21 + bob, 12, 8, GR);
    px(ctx, cx + 12, 22 + bob, 5, 6, LITE);
    px(ctx, cx - 12, 24 + bob, 8, 6, OUT);
    px(ctx, cx - 11, 25 + bob, 6, 4, GD);
    fist(cx - 15, 24 + bob);
    px(ctx, cx - 9, 20 + bob, 12, 3, GD);
  } else if (p.inhale) {

    px(ctx, cx - 16, 20 + bob, 8, 8, OUT);
    px(ctx, cx - 15, 21 + bob, 6, 6, GD);
    fist(cx - 17, 20 + bob);
    px(ctx, cx + 8, 20 + bob, 8, 8, OUT);
    px(ctx, cx + 9, 21 + bob, 6, 6, GR);
    fist(cx + 9, 20 + bob);
    px(ctx, cx - 4, 22 + bob, 8, 4, LITE);
  } else if (p.shout) {

    px(ctx, cx - 6, 20 + bob, 20, 8, OUT);
    px(ctx, cx - 5, 21 + bob, 8, 6, GD);
    px(ctx, cx + 3, 21 + bob, 8, 6, GR);
    fist(cx - 2, 20 + bob);
    fist(cx + 0, 20 + bob);
    px(ctx, cx - 4, 22 + bob, 2, 2, "#ffffff");
    px(ctx, cx + 6, 22 + bob, 2, 2, "#ffffff");
  } else if (p.ascend) {

    px(ctx, cx - 8, 2 + bob, 6, 16, OUT);
    px(ctx, cx - 7, 3 + bob, 4, 14, GD);
    fist(cx - 8, 0 + bob);
    px(ctx, cx + 2, 2 + bob, 6, 16, OUT);
    px(ctx, cx + 3, 3 + bob, 4, 14, GR);
    fist(cx + 1, 0 + bob);
  } else {

    px(ctx, cx - 14, 24 + bob + p.armSwing, 7, 12, OUT);
    px(ctx, cx - 13, 25 + bob + p.armSwing, 5, 10, GD);
    fist(cx - 14, 30 + bob + p.armSwing);
    px(ctx, cx + 7, 24 + bob - p.armSwing, 7, 12, OUT);
    px(ctx, cx + 8, 25 + bob - p.armSwing, 5, 10, GR);
    fist(cx + 7, 30 + bob - p.armSwing);
    if (p.dash) {
      px(ctx, cx - 16, 26 + bob, 4, 1, "#ffffff");
      px(ctx, cx - 18, 29 + bob, 6, 1, "#9fd4ff");
    }
  }
  ctx.restore();
}

const LY_I = Object.freeze({
  torso: "#c02828", rim: "#ff7a5c", pants: "#c02828", shade: "#701414",
  skin: "#e8b81c", hair: "#701414", eye: "#bff4ff", eyeHi: "#ff3b1a",
  boot: "#e8b81c", bootHi: "#9a6a0a", cape: null, belt: "#701414",
});

function paintIronman(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_I); return; }
  const bob = p.bob;
  const RD = "#c02828", DD = "#701414", GD = "#e8b81c", GD2 = "#9a6a0a";
  const LITE = "#ff7a5c", EYE = "#bff4ff";

  const flames = (x, y) => {
    px(ctx, x, y, 3, 2, "#ff7a1a");
    px(ctx, x, y + 2, 3, 3, "#ffd23e");
    px(ctx, x + 1, y + 5, 1, 2, "#ffffff");
  };

  const leg7 = (x, yTop, h) => {
    px(ctx, x - 1, yTop - 1, 10, h + 5, OUT);
    px(ctx, x, yTop, 8, h, RD);
    px(ctx, x + 6, yTop, 2, h, DD);
    px(ctx, x, yTop + 2, 8, 1, LITE);
    px(ctx, x + 1, yTop + 5, 6, 2, GD);
    px(ctx, x + 1, yTop + 5, 6, 1, "#f4dd9a");
    px(ctx, x, yTop + h, 8, 3, GD);
    px(ctx, x, yTop + h, 8, 1, "#f4dd9a");
  };
  if (p.hover) {

    leg7(cx - 6, 34, 12);
    leg7(cx + 1, 34, 12);
    flames(cx - 4, 46 + bob);
    flames(cx + 1, 46 + bob);
  } else if (p.air === 1) {
    leg7(cx - 8 + p.legL, 35 + bob, 9);
    leg7(cx + 1 + p.legR, 37 + bob, 7);
    flames(cx - 6 + p.legL, 44 + bob);
  } else if (p.air === 2) {
    leg7(cx - 8 + p.legL, 32 + bob, 12);
    leg7(cx + 1 + p.legR, 33 + bob, 11);
  } else if (p.dash) {
    leg7(cx - 12, 35 + bob, 12);
    leg7(cx + 5, 35 + bob, 12);
    flames(cx - 14, 44 + bob);
  } else {

    leg7(cx - 9 + (p.legL || 0), 33 + bob, 12);
    leg7(cx + 2 + (p.legR || 0), 33 + bob, 12);
  }
  ctx.save();
  ctx.translate(p.wind || 0, (p.crouch ? 6 : 0) + (p.dip || 0));

  box(ctx, cx - 10, 17 + bob, 20, 15, RD);
  px(ctx, cx - 10, 17 + bob, 2, 15, LITE);
  px(ctx, cx + 8, 17 + bob, 2, 15, DD);
  px(ctx, cx - 10, 17 + bob, 20, 2, GD);
  px(ctx, cx - 4, 19 + bob, 8, 1, GD2);
  px(ctx, cx - 1, 19 + bob, 2, 12, DD);
  px(ctx, cx - 7, 21 + bob, 5, 4, RD);
  px(ctx, cx + 2, 21 + bob, 5, 4, RD);
  px(ctx, cx - 7, 21 + bob, 5, 1, LITE);
  px(ctx, cx + 2, 21 + bob, 5, 1, LITE);
  px(ctx, cx - 7, 25 + bob, 14, 1, DD);
  px(ctx, cx - 5, 27 + bob, 10, 1, DD);
  px(ctx, cx - 5, 29 + bob, 10, 1, DD);
  px(ctx, cx - 5, 27 + bob, 2, 3, LITE);
  px(ctx, cx - 9, 19 + bob, 1, 11, DD);
  px(ctx, cx + 8, 19 + bob, 1, 11, DD);
  px(ctx, cx - 6, 30 + bob, 12, 2, GD);
  px(ctx, cx - 6, 30 + bob, 12, 1, "#f4dd9a");
  px(ctx, cx - 4, 24 + bob, 7, 7, OUT);
  px(ctx, cx - 3, 25 + bob, 5, 5, DD);
  px(ctx, cx - 2, 26 + bob, 3, 3, EYE);
  px(ctx, cx - 1, 26 + bob, 2, 2, "#ffffff");
  px(ctx, cx - 5, 26 + bob, 1, 3, EYE);
  px(ctx, cx + 4, 26 + bob, 1, 3, EYE);
  if (p.beam) {
    px(ctx, cx - 4, 24 + bob, 9, 7, "#ffffff");
  }

  const hy = 6 + bob + (p.headBob || 0) + (p.beam ? 4 : 0);
  const hx = cx - 1;
  box(ctx, hx - 6, hy, 12, 11, GD);
  px(ctx, hx - 6, hy, 12, 3, RD);
  px(ctx, hx - 6, hy, 2, 11, RD);
  px(ctx, hx + 4, hy, 2, 11, RD);
  px(ctx, hx - 6, hy + 3, 12, 1, DD);
  px(ctx, hx - 1, hy + 3, 2, 7, "#f4dd9a");
  px(ctx, hx - 4, hy + 6, 1, 3, GD2);
  px(ctx, hx + 3, hy + 6, 1, 3, GD2);
  px(ctx, hx - 4, hy + 5, 3, 2, EYE);
  px(ctx, hx + 1, hy + 5, 3, 2, EYE);
  px(ctx, hx - 4, hy + 5, 1, 1, "#ffffff");
  px(ctx, hx + 1, hy + 5, 1, 1, "#ffffff");
  if (p.rageGlow) {
    px(ctx, hx - 4, hy + 5, 3, 2, "#ff3b1a");
    px(ctx, hx + 1, hy + 5, 3, 2, "#ff3b1a");
  }
  px(ctx, hx - 3, hy + 9, 6, 1, GD2);
  px(ctx, hx - 2, hy + 9, 1, 1, DD);
  px(ctx, hx + 1, hy + 9, 1, 1, DD);
  px(ctx, hx - 3, hy + 10, 6, 1, DD);

  const pauldron = (x, y) => {
    px(ctx, x - 1, y - 1, 8, 7, OUT);
    px(ctx, x, y, 6, 5, GD);
    px(ctx, x, y, 6, 1, "#f4dd9a");
    px(ctx, x, y + 4, 6, 1, GD2);
    px(ctx, x, y + 2, 6, 1, "#d4a017");
  };

  const gaunt = (x, y) => {
    px(ctx, x - 1, y - 1, 8, 8, OUT);
    px(ctx, x, y, 6, 6, GD);
    px(ctx, x, y, 6, 2, "#f4dd9a");
    px(ctx, x, y + 3, 6, 1, GD2);
  };

  const palm = (x, y, big = false) => {
    const s = big ? 6 : 4;
    px(ctx, x - 1, y - 1, s + 2, s + 2, OUT);
    px(ctx, x, y, s, s, RD);
    px(ctx, x + 1, y + 1, s - 2, s - 2, EYE);
    px(ctx, x + 1, y + 1, 1, 1, "#ffffff");
  };

  const armSeg = (x, y, w, h) => {
    px(ctx, x - 1, y - 1, w + 2, h + 2, OUT);
    px(ctx, x, y, w, h, RD);
    px(ctx, x + w - 2, y, 2, h, DD);
    px(ctx, x, y + h - 2, w, 2, GD);
    px(ctx, x, y + h - 2, w, 1, "#f4dd9a");
  };
  if (p.seize) {

    armSeg(cx - 12, 20 + bob, 12, 5);
    armSeg(cx + 0, 20 + bob, 12, 5);
    gaunt(cx + 11, 19 + bob);
    gaunt(cx - 15, 19 + bob);
  } else if (p.guard === 1) {

    pauldron(cx - 14, 15 + bob);
    pauldron(cx + 8, 15 + bob);
    px(ctx, cx - 10, 17 + bob, 20, 12, OUT);
    px(ctx, cx - 9, 18 + bob, 18, 4, GD);
    px(ctx, cx - 9, 24 + bob, 18, 4, GD2);
    px(ctx, cx - 9, 22 + bob, 18, 2, RD);
    palm(cx + 9, 17 + bob);
    palm(cx - 13, 23 + bob);
  } else if (p.guard === 2) {

    px(ctx, cx - 11, 26 + bob, 22, 10, OUT);
    px(ctx, cx - 10, 27 + bob, 20, 3, GD);
    px(ctx, cx - 10, 32 + bob, 20, 3, GD2);
    palm(cx - 12, 26 + bob);
    palm(cx + 8, 31 + bob);
  } else if (p.windup) {

    pauldron(cx - 14, 15 + bob);
    pauldron(cx + 8, 15 + bob);
    armSeg(cx - 12, 26 + bob, 8, 7);
    palm(cx - 11, 27 + bob, true);
    px(ctx, cx - 12, 28 + bob, 10, 1, EYE);
    armSeg(cx + 4, 18 + bob, 7, 8);
    gaunt(cx + 4, 16 + bob);
  } else if (p.repulsor) {

    armSeg(cx + 2, 12 + bob, 12, 5);
    palm(cx + 11, 11 + bob, true);
    px(ctx, cx + 14, 12 + bob, 8, 1, EYE);
    px(ctx, cx + 12, 14 + bob, 10, 1, "#35c8ff");
    px(ctx, cx + 14, 16 + bob, 6, 1, EYE);
    armSeg(cx - 10, 26 + bob, 7, 8);
    gaunt(cx - 11, 29 + bob);
  } else if (p.burst) {

    armSeg(cx + 2, 10 + bob, 12, 4);
    palm(cx + 11, 8 + bob, true);
    armSeg(cx + 2, 18 + bob, 12, 4);
    palm(cx + 11, 16 + bob, true);
    px(ctx, cx + 14, 9 + bob, 8, 1, EYE);
    px(ctx, cx + 14, 17 + bob, 8, 1, "#35c8ff");
    px(ctx, cx - 6, 10 + bob, 8, 1, EYE);
    px(ctx, cx - 6, 18 + bob, 8, 1, "#35c8ff");
  } else if (p.beam) {

    px(ctx, cx - 4, 11 + bob, 15, 15, OUT);
    px(ctx, cx - 3, 12 + bob, 13, 13, RD);
    px(ctx, cx - 1, 8 + bob, 11, 12, "#ffffff");
    px(ctx, cx + 1, 10 + bob, 7, 8, EYE);
    px(ctx, cx + 2, 11 + bob, 3, 3, "#ffffff");
    px(ctx, cx - 11, 22 + bob, 6, 6, OUT);
    px(ctx, cx - 10, 23 + bob, 4, 4, DD);
    px(ctx, cx + 9, 22 + bob, 6, 6, OUT);
    px(ctx, cx + 10, 23 + bob, 4, 4, DD);
  } else if (p.slam) {

    armSeg(cx - 8, 2 + bob, 6, 13);
    armSeg(cx + 2, 2 + bob, 6, 13);
    gaunt(cx - 8, 0 + bob);
    gaunt(cx + 2, 0 + bob);
    px(ctx, cx - 2, 4 + bob, 4, 8, RD);
  } else if (p.sweep) {

    px(ctx, cx + 0, 32 + bob, 13, 6, OUT);
    px(ctx, cx + 1, 33 + bob, 11, 4, RD);
    px(ctx, cx + 9, 35 + bob, 3, 2, GD);
    px(ctx, cx + 12, 32 + bob, 5, 6, GD);
    px(ctx, cx + 12, 32 + bob, 5, 1, "#f4dd9a");
    flames(cx + 8, 36 + bob);
    armSeg(cx - 10, 22 + bob, 6, 8);
    gaunt(cx - 11, 26 + bob);
  } else if (p.punch) {

    const e = 6 + (p.punch || 0) * 2;
    armSeg(cx + 2, 20 + bob, e + 2, 5);
    palm(cx + 2 + e, 20 + bob);
    px(ctx, cx + 4 + e, 21 + bob, 6, 1, EYE);
    armSeg(cx - 10, 24 + bob, 6, 8);
    gaunt(cx - 11, 28 + bob);
  } else if (p.kick) {

    const e = 8 + (p.kick || 0) * 2;
    px(ctx, cx + 0, 32 + bob, e + 5, 6, OUT);
    px(ctx, cx + 1, 33 + bob, e + 3, 4, RD);
    px(ctx, cx + e - 1, 33 + bob, 5, 4, GD);
    px(ctx, cx + e - 1, 33 + bob, 5, 1, "#f4dd9a");
    flames(cx + e - 4, 37 + bob);
    armSeg(cx - 10, 20 + bob, 6, 8);
    gaunt(cx - 11, 24 + bob);
  } else if (p.hover) {

    armSeg(cx - 16, 22 + bob, 9, 5);
    palm(cx - 17, 22 + bob);
    armSeg(cx + 7, 22 + bob, 9, 5);
    palm(cx + 13, 22 + bob);
    pauldron(cx - 15, 15 + bob);
    pauldron(cx + 9, 15 + bob);
  } else {

    pauldron(cx - 15, 15 + bob + p.armSwing);
    pauldron(cx + 9, 15 + bob - p.armSwing);
    armSeg(cx - 10, 22 + bob + p.armSwing, 6, 9);
    gaunt(cx - 11, 28 + bob + p.armSwing);
    armSeg(cx + 4, 22 + bob - p.armSwing, 6, 9);
    gaunt(cx + 3, 28 + bob - p.armSwing);
    if (p.dash) {
      flames(cx - 10, 44 + bob);
      px(ctx, cx - 12, 24 + bob, 6, 1, "#ffffff");
    }
  }
  ctx.restore();
}

const LY_X = Object.freeze({
  torso: "#e8a81c", rim: "#f4dd9a", pants: "#1c3faa", shade: "#10246a",
  skin: "#e6b48c", hair: "#0b0b10", eye: "#ffffff", eyeHi: "#ff3b1a",
  boot: "#0b0b10", bootHi: "#3a3a4d", cape: null, belt: "#10246a",
});

const LY_T = Object.freeze({
  torso: "#2043e0", rim: "#6f86ff", pants: "#2043e0", shade: "#152c96",
  skin: "#e6b48c", hair: "#c8d0e0", eye: "#ffffff", eyeHi: "#1a3fd4",
  boot: "#3a3a4d", bootHi: "#ffd23e", cape: "#a01313", belt: "#ffd23e",
});

function paintThor(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_T); return; }
  const bob = p.bob;
  const BL = "#2043e0", BD = "#152c96", GD = "#ffd23e", HI = "#6f86ff";
  const SV = "#c8d0e0", CAPE = "#a01313", CAPED = "#6e0d0d", CAPEL = "#e05050";
  const SK = "#e6b48c", SKD = "#b98a63", IRON = "#9a9ab0", WOOD = "#4a3320";

  const wv = Math.max(-2, Math.min(2, p.capeWave || 0));
  px(ctx, cx - 10 + wv, 15 + bob, 17, 29, CAPED);
  px(ctx, cx - 9 + wv, 16 + bob, 14, 27, CAPE);
  px(ctx, cx - 10 + wv, 16 + bob, 1, 27, CAPEL);
  px(ctx, cx - 2 + wv, 20 + bob, 1, 18, CAPED);
  px(ctx, cx + 3 + wv, 24 + bob, 1, 14, CAPED);

  const drop = (p.crouch ? 8 : 0) + (p.dip || 0);
  const lean = (p.dash ? 2 : 0) + (p.wind || 0);
  if (p.crouch) {
    leg(ctx, cx - 9 + p.legL, 40 + bob, 6, BL, BD, "#3a3a4d", GD);
    leg(ctx, cx + 4 + p.legR, 40 + bob, 6, BL, BD, "#3a3a4d", GD);
  } else if (p.air === 1) {
    leg(ctx, cx - 6 + p.legL, 37 + bob, 7, BL, BD, "#3a3a4d", GD);
    leg(ctx, cx + 1 + p.legR, 39 + bob, 5, BL, BD, "#3a3a4d", GD);
  } else if (p.air === 2) {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 11, BL, BD, "#3a3a4d", GD);
    leg(ctx, cx + 1 + p.legR, 35 + bob, 10, BL, BD, "#3a3a4d", GD);
  } else if (p.dash) {
    leg(ctx, cx - 10, 36 + bob, 10, BL, BD, "#3a3a4d", GD);
    leg(ctx, cx + 4, 36 + bob, 10, BL, BD, "#3a3a4d", GD);
  } else if (p.brace) {
    leg(ctx, cx - 9 + (p.legL || 0), 38 + bob, 8, BL, BD, "#3a3a4d", GD);
    leg(ctx, cx + 4 + (p.legR || 0), 38 + bob, 8, BL, BD, "#3a3a4d", GD);
  } else {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 12, BL, BD, "#3a3a4d", GD);
    leg(ctx, cx + 1 + p.legR, 34 + bob, 12, BL, BD, "#3a3a4d", GD);
  }
  px(ctx, cx - 6 + p.legL, 38 + bob, 5, 2, GD);
  px(ctx, cx + 1 + p.legR, 38 + bob, 5, 2, GD);

  ctx.save();
  ctx.translate(lean, drop);

  box(ctx, cx - 7, 19 + bob, 14, 16, BL);
  px(ctx, cx - 7, 19 + bob, 2, 16, HI);
  px(ctx, cx + 5, 19 + bob, 2, 16, BD);
  for (let i = 0; i < 3; i++) px(ctx, cx - 4 + i * 3, 22 + bob, 2, 2, GD);
  px(ctx, cx - 7, 30 + bob, 14, 4, GD);
  px(ctx, cx - 7, 30 + bob, 14, 1, "#fff2a8");
  px(ctx, cx - 1, 31 + bob, 4, 2, BD);
  px(ctx, cx - 10, 17 + bob, 4, 4, OUT);
  px(ctx, cx - 9, 18 + bob, 2, 2, GD);
  px(ctx, cx + 6, 17 + bob, 4, 4, OUT);
  px(ctx, cx + 7, 18 + bob, 2, 2, GD);

  const hy = 7 + bob + (p.headBob || 0);
  box(ctx, cx - 5, hy, 10, 9, SK);
  px(ctx, cx + 3, hy, 2, 9, SKD);
  px(ctx, cx - 6, hy - 3 + 0, 12, 4, OUT);
  px(ctx, cx - 5, hy - 2, 10, 3, SV);
  px(ctx, cx - 2, hy - 2, 4, 1, "#ffffff");
  px(ctx, cx - 1, hy - 3, 2, 1, SV);
  px(ctx, cx - 13, hy - 5, 6, 5, OUT);
  px(ctx, cx - 13, hy - 5, 5, 2, "#ffffff");
  px(ctx, cx - 11, hy - 3, 5, 3, "#ffffff");
  px(ctx, cx + 8, hy - 5, 6, 5, OUT);
  px(ctx, cx + 9, hy - 5, 5, 2, "#ffffff");
  px(ctx, cx + 7, hy - 3, 5, 3, "#ffffff");
  px(ctx, cx - 4, hy + 3, 2, 2, "#ffffff");
  px(ctx, cx + 2, hy + 3, 2, 2, "#ffffff");
  if (p.beam || p.charge || p.stormcall) {
    px(ctx, cx - 4, hy + 3, 2, 2, "#bff4ff");
    px(ctx, cx + 2, hy + 3, 2, 2, "#bff4ff");
  }
  px(ctx, cx - 2, hy + 7, 4, 1, SKD);

  const bracer = (x, y) => {
    px(ctx, x - 1, y - 1, 7, 6, OUT);
    px(ctx, x, y, 5, 4, GD);
    px(ctx, x, y, 5, 1, "#fff2a8");
  };
  const armV = (x, y, h) => {
    px(ctx, x - 1, y - 1, 6, h + 2, OUT);
    px(ctx, x, y, 4, h, SK);
    px(ctx, x + 2, y, 2, h, SKD);
  };
  const armH = (x, y, w) => {
    px(ctx, x - 1, y - 1, w + 2, 5, OUT);
    px(ctx, x, y, w, 3, SK);
    px(ctx, x, y + 2, w, 1, SKD);
  };
  const fist = (x, y) => {
    px(ctx, x - 1, y - 1, 6, 6, OUT);
    px(ctx, x, y, 4, 4, SK);
    px(ctx, x, y + 3, 4, 1, SKD);
  };
  const hammerHead = (x, y) => {
    px(ctx, x - 1, y - 1, 11, 7, OUT);
    px(ctx, x, y, 9, 5, IRON);
    px(ctx, x, y, 9, 1, "#ffffff");
    px(ctx, x, y + 4, 9, 1, "#5a5a70");
  };
  const hammerGrip = (x, y, len) => {
    px(ctx, x - 1, y - 1, 5, len + 2, OUT);
    px(ctx, x, y, 3, len, WOOD);
    px(ctx, x, y + len - 2, 3, 2, GD);
  };

  if (p.seize) {
    armH(cx - 1, 21 + bob, 11);
    fist(cx + 9, 20 + bob);
    armV(cx - 9, 22 + bob, 5);
    bracer(cx - 9, 26 + bob);
  } else if (p.guard === 1) {
    hammerHead(cx - 12, 18 + bob);
    hammerGrip(cx - 9, 23 + bob, 6);
    fist(cx - 10, 25 + bob);
    armH(cx - 6, 24 + bob, 10);
    bracer(cx - 1, 23 + bob);
    armV(cx + 4, 20 + bob, 6);
    bracer(cx + 3, 25 + bob);
  } else if (p.guard === 2) {
    armH(cx - 8, 24 + bob, 9);
    armH(cx + 1, 26 + bob, 9);
    bracer(cx - 4, 23 + bob);
    bracer(cx + 5, 25 + bob);
    hammerHead(cx - 1, 29 + bob);
    hammerGrip(cx + 2, 34 + bob, 5);
  } else if (p.windup) {
    hammerHead(cx - 12, 20 + bob);
    hammerGrip(cx - 9, 25 + bob, 5);
    armH(cx - 7, 22 + bob, 8);
    bracer(cx - 1, 21 + bob);
    armV(cx + 4, 21 + bob, 5);
    bracer(cx + 3, 25 + bob);
  } else if (p.slam) {
    armH(cx - 7, 20 + bob, 8);
    bracer(cx - 2, 19 + bob);
    armH(cx + 3, 22 + bob, 7);
    bracer(cx + 6, 21 + bob);
    hammerHead(cx - 1, 22 + bob);
    hammerGrip(cx + 2, 27 + bob, 5);
    fist(cx + 1, 25 + bob);
    px(ctx, cx + 1, 32 + bob, 2, 5, "#bff4ff");
    px(ctx, cx + 5, 34 + bob, 2, 4, "#35c8ff");
    px(ctx, cx - 3, 33 + bob, 2, 4, "#35c8ff");
  } else if (p.overhead) {
    armV(cx + 4, 9 + bob, 11);
    bracer(cx + 3, 13 + bob);
    fist(cx + 6, 8 + bob);
    hammerHead(cx + 7, 1 + bob);
    hammerGrip(cx + 10, 6 + bob, 5);
    armV(cx - 9, 22 + bob, 5);
    bracer(cx - 9, 26 + bob);
  } else if (p.hammerSpin) {
    armH(cx + 3, 19 + bob, 10);
    bracer(cx + 8, 18 + bob);
    hammerHead(cx + 7, 13 + bob);
    hammerGrip(cx + 10, 18 + bob, 5);
    fist(cx + 9, 16 + bob);
    px(ctx, cx - 12, 11 + bob, 6, 1, "#bff4ff");
    px(ctx, cx - 14, 15 + bob, 6, 1, "#35c8ff");
    px(ctx, cx + 14, 12 + bob, 3, 1, "#bff4ff");
    armV(cx - 9, 22 + bob, 5);
    bracer(cx - 9, 26 + bob);
  } else if (p.charge) {
    armV(cx + 4, 9 + bob, 11);
    bracer(cx + 3, 13 + bob);
    fist(cx + 6, 8 + bob);
    hammerHead(cx + 7, 2 + bob);
    hammerGrip(cx + 10, 7 + bob, 5);
    px(ctx, cx + 8, 10 + bob, 2, 3, "#bff4ff");
    px(ctx, cx + 10, 14 + bob, 2, 3, "#35c8ff");
    armV(cx - 9, 22 + bob, 5);
    bracer(cx - 9, 26 + bob);
  } else if (p.beam) {
    armV(cx + 3, 12 + bob, 8);
    bracer(cx + 2, 17 + bob);
    hammerHead(cx + 0, 5 + bob);
    px(ctx, cx - 2, 2 + bob, 13, 12, "#ffffff");
    px(ctx, cx + 0, 4 + bob, 9, 8, "#bff4ff");
    armV(cx - 9, 22 + bob, 5);
    bracer(cx - 9, 26 + bob);
  } else if (p.stormcall) {
    armV(cx + 3, 24 + bob, 8);
    bracer(cx + 2, 29 + bob);
    hammerHead(cx + 0, 36 + bob);
    hammerGrip(cx + 3, 41 + bob, 4);
    fist(cx + 2, 33 + bob);
    px(ctx, cx + 1, 32 + bob, 5, 2, "#bff4ff");
    armV(cx - 9, 22 + bob, 5);
    bracer(cx - 9, 26 + bob);
  } else if (p.sweep) {
    armH(cx + 1, 27 + bob, 10);
    bracer(cx + 6, 26 + bob);
    hammerHead(cx + 5, 30 + bob);
    hammerGrip(cx + 8, 35 + bob, 5);
    fist(cx + 7, 33 + bob);
    armV(cx - 9, 22 + bob, 5);
    bracer(cx - 9, 26 + bob);
  } else if (p.punch > 0) {
    const ey = 21 + bob - p.punch;
    armH(cx + 3, ey, 10);
    bracer(cx + 8, ey - 1 + 0);
    hammerHead(cx + 6, ey + 2);
    hammerGrip(cx + 9, ey + 7, 5);
    fist(cx + 8, ey + 5);
    px(ctx, cx - 2, ey + 1, 4, 1, "#bff4ff");
    armV(cx - 9, 22 + bob, 5);
    bracer(cx - 9, 26 + bob);
  } else if (p.kick > 0) {
    px(ctx, cx + 2, 36 + bob, 13, 5, BL);
    px(ctx, cx + 2, 36 + bob, 13, 1, HI);
    px(ctx, cx + 11, 35 + bob, 4, 6, "#3a3a4d");
    armH(cx - 9, 20 + bob, 8);
    bracer(cx - 4, 19 + bob);
    armV(cx + 4, 20 + bob, 5);
    bracer(cx + 3, 24 + bob);
  } else {
    armV(cx - 9, 20 + bob - p.armSwing, 6);
    bracer(cx - 9, 25 + bob - p.armSwing);
    fist(cx - 9, 29 + bob - p.armSwing);
    armV(cx + 5, 20 + bob + p.armSwing, 6);
    bracer(cx + 5, 25 + bob + p.armSwing);
    hammerHead(cx + 6, 30 + bob);
    hammerGrip(cx + 9, 35 + bob, 5);
    fist(cx + 8, 36 + bob);
    if (p.dash) {
      px(ctx, cx - 14, 24 + bob, 4, 1, "#bff4ff");
      px(ctx, cx - 16, 27 + bob, 6, 1, "#35c8ff");
    }
  }
  ctx.restore();
}

const LY_U2 = Object.freeze({
  torso: "#e6b48c", rim: "#ff7a1a", pants: "#14141c", shade: "#5a0d12",
  skin: "#e6b48c", hair: "#c8a45e", eye: "#0b0b10", eyeHi: "#ff7a1a",
  boot: "#000000", bootHi: "#3a3a4d", cape: null, belt: null,
});

function paintUroboros(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_U2); return; }
  const bob = p.bob;
  const SK = "#e6b48c", SKD = "#b98a63", MASS = "#5a0d12", FLESH = "#c01414";
  const EYE = "#ff7a1a", PN = "#14141c", PD = "#08080d";

  const drop = (p.crouch ? 7 : 0) + (p.dip || 0);
  const lean = (p.dash ? 2 : 0) + (p.wind || 0);
  if (p.crouch) {
    leg(ctx, cx - 9 + p.legL, 40 + bob, 6, PN, PD, "#000000", "#3a3a4d");
    leg(ctx, cx + 4 + p.legR, 40 + bob, 6, PN, PD, "#000000", "#3a3a4d");
  } else if (p.air === 1) {
    leg(ctx, cx - 6 + p.legL, 37 + bob, 7, PN, PD, "#000000", "#3a3a4d");
    leg(ctx, cx + 1 + p.legR, 39 + bob, 5, PN, PD, "#000000", "#3a3a4d");
  } else if (p.air === 2) {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 11, PN, PD, "#000000", "#3a3a4d");
    leg(ctx, cx + 1 + p.legR, 35 + bob, 10, PN, PD, "#000000", "#3a3a4d");
  } else if (p.dash) {
    leg(ctx, cx - 10, 36 + bob, 10, PN, PD, "#000000", "#3a3a4d");
    leg(ctx, cx + 4, 36 + bob, 10, PN, PD, "#000000", "#3a3a4d");
  } else if (p.brace) {
    leg(ctx, cx - 8 + (p.legL || 0), 34 + bob, 12, PN, PD, "#000000", "#3a3a4d");
    leg(ctx, cx + 3 + (p.legR || 0), 34 + bob, 12, PN, PD, "#000000", "#3a3a4d");
  } else {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 12, PN, PD, "#000000", "#3a3a4d");
    leg(ctx, cx + 1 + p.legR, 34 + bob, 12, PN, PD, "#000000", "#3a3a4d");
  }
  ctx.save();
  ctx.translate(lean, drop);

  box(ctx, cx - 7, 19 + bob, 14, 16, SK);
  px(ctx, cx - 7, 19 + bob, 3, 16, "#f4d0a8");
  px(ctx, cx + 4, 19 + bob, 3, 16, SKD);
  px(ctx, cx - 3, 21 + bob, 1, 10, MASS);
  px(ctx, cx + 0, 24 + bob, 2, 6, MASS);
  px(ctx, cx - 4, 28 + bob, 1, 5, MASS);
  px(ctx, cx - 7, 31 + bob, 14, 3, PN);
  px(ctx, cx - 7, 31 + bob, 14, 1, "#3a3a4d");

  px(ctx, cx - 11, 14 + bob, 9, 8, OUT);
  px(ctx, cx - 10, 15 + bob, 7, 6, MASS);
  px(ctx, cx - 10, 15 + bob, 7, 2, FLESH);
  px(ctx, cx - 8, 17 + bob, 2, 2, EYE);
  px(ctx, cx - 4, 19 + bob, 2, 2, EYE);
  px(ctx, cx - 11, 12 + bob, 3, 3, OUT);
  px(ctx, cx - 11, 12 + bob, 2, 2, MASS);

  const hy = 7 + bob + (p.headBob || 0);
  box(ctx, cx - 5, hy, 10, 9, SK);
  px(ctx, cx + 3, hy, 2, 9, SKD);
  px(ctx, cx - 5, hy, 10, 3, "#c8a45e");
  px(ctx, cx - 5, hy + 2, 2, 3, "#c8a45e");
  px(ctx, cx + 3, hy + 2, 2, 3, "#c8a45e");
  px(ctx, cx - 5, hy + 4, 10, 3, "#0b0b10");
  px(ctx, cx - 5, hy + 4, 10, 1, "#3a3a4d");
  px(ctx, cx + 1, hy + 5, 2, 1, "#ff7a1a");
  px(ctx, cx - 3, hy + 8, 4, 1, SKD);
  px(ctx, cx + 3, hy + 5, 2, 3, MASS);

  const tendril = (x, y, len, dir, w) => {
    const n = 4, step = Math.max(2, Math.floor(len / n));
    for (let i = 0; i < n; i++) {
      const ww = Math.max(2, w - Math.floor((i * w) / n));
      const xx = dir > 0 ? x + i * step : x - i * step - ww;
      const yy = y + (i % 2);
      px(ctx, xx - 1, yy - 1, ww + 2, 5, OUT);
      px(ctx, xx, yy, ww, 3, MASS);
      px(ctx, xx, yy, ww, 1, FLESH);
    }
    const tx = dir > 0 ? x + len : x - len;
    px(ctx, tx - 1, y - 1, 3, 5, OUT);
    px(ctx, tx, y, 2, 3, FLESH);
    px(ctx, Math.round(x + dir * len * 0.45), y, 2, 2, EYE);
  };
  const spike = (x, y, len, dir) => {
    for (let i = 0; i < 5; i++) {
      const ww = Math.max(1, 5 - i);
      const xx = dir > 0 ? x + i * 3 : x - i * 3 - ww;
      px(ctx, xx - 1, y - 1 + Math.floor(i / 2), ww + 2, 4, OUT);
      px(ctx, xx, y + Math.floor(i / 2), ww, 2, MASS);
    }
    const tx = dir > 0 ? x + len : x - len;
    px(ctx, tx - 1, y + 1, 3, 3, OUT);
    px(ctx, tx, y + 2, 2, 1, "#ffffff");
  };
  const armT = (x, y) => {
    px(ctx, x - 1, y - 1, 6, 9, OUT);
    px(ctx, x, y, 4, 7, SK);
    px(ctx, x + 2, y, 2, 7, SKD);
  };

  if (p.seize) {
    tendril(cx - 2, 22 + bob, 14, 1, 5);
    tendril(cx - 4, 27 + bob, 11, 1, 4);
    armT(cx - 9, 22 + bob);
  } else if (p.guard === 1) {
    for (let i = 0; i < 3; i++) {
      const gx = cx + 2 + (i % 2) * 2;
      px(ctx, gx - 1, 14 + bob + i * 6, 5, 8, OUT);
      px(ctx, gx, 15 + bob + i * 6, 3, 6, MASS);
      px(ctx, gx, 15 + bob + i * 6, 3, 2, FLESH);
    }
    px(ctx, cx + 3, 16 + bob, 2, 2, EYE);
    armT(cx - 9, 22 + bob);
  } else if (p.guard === 2) {
    for (let i = 0; i < 3; i++) {
      const gx = cx - 8 + i * 5;
      px(ctx, gx - 1, 24 + bob, 6, 7, OUT);
      px(ctx, gx, 25 + bob, 4, 5, MASS);
      px(ctx, gx, 25 + bob, 4, 1, FLESH);
    }
    armT(cx - 9, 18 + bob);
  } else if (p.windup) {
    tendril(cx - 8, 20 + bob, 10, -1, 5);
    armT(cx + 3, 22 + bob);
    tendril(cx + 7, 24 + bob, 9, 1, 4);
  } else if (p.lash === 1) {
    tendril(cx + 5, 22 + bob, 16, 1, 6);
    px(ctx, cx + 8, 27 + bob, 8, 1, "#bff4ff");
    armT(cx - 9, 23 + bob);
  } else if (p.lash === 2) {
    tendril(cx + 5, 17 + bob, 17, 1, 5);
    px(ctx, cx + 0, 2 + bob, 9, 1, "#bff4ff");
    px(ctx, cx + 4, 4 + bob, 6, 1, "#35c8ff");
    armT(cx - 9, 23 + bob);
  } else if (p.lash === 3) {
    tendril(cx + 2, 33 + bob, 16, 1, 5);
    armT(cx - 9, 22 + bob);
    tendril(cx - 6, 18 + bob, 8, -1, 4);
  } else if (p.slam2) {
    tendril(cx + 1, 8 + bob, 6, 1, 4);
    armT(cx - 8, 12 + bob);
    armT(cx + 4, 12 + bob);
    spike(cx + 1, 22 + bob, 16, 1);
    px(ctx, cx + 3, 30 + bob, 2, 5, "#bff4ff");
    px(ctx, cx + 7, 32 + bob, 2, 4, "#35c8ff");
  } else if (p.coil) {
    tendril(cx - 4, 20 + bob, 13, 1, 6);
    tendril(cx - 4, 26 + bob, 13, 1, 6);
    tendril(cx - 2, 32 + bob, 10, 1, 5);
    px(ctx, cx + 2, 22 + bob, 2, 2, EYE);
    px(ctx, cx + 2, 28 + bob, 2, 2, EYE);
    armT(cx - 10, 20 + bob);
  } else if (p.rockhold) {
    armT(cx - 8, 12 + bob);
    armT(cx + 4, 12 + bob);
    tendril(cx - 6, 10 + bob, 8, -1, 4);
    tendril(cx + 8, 10 + bob, 8, 1, 4);
    px(ctx, cx - 6, 0 + bob, 16, 10, OUT);
    px(ctx, cx - 5, 1 + bob, 14, 8, "#5a5a70");
    px(ctx, cx - 5, 1 + bob, 14, 2, "#9a9ab0");
    px(ctx, cx - 2, 4 + bob, 3, 3, "#3a3a48");
  } else if (p.impale) {
    armT(cx - 9, 22 + bob);
    tendril(cx - 6, 16 + bob, 8, -1, 4);
    spike(cx + 4, 20 + bob, 19, 1);
    px(ctx, cx + 12, 21 + bob, 6, 1, "#ff3b1a");
    px(ctx, cx + 6, 24 + bob, 8, 1, "#bff4ff");
  } else {
    tendril(cx - 8, 22 + bob + p.armSwing, 10, -1, 4);
    armT(cx - 9, 22 + bob + p.armSwing);
    armT(cx + 5, 22 + bob - p.armSwing);
    tendril(cx + 8, 24 + bob - p.armSwing, 11, 1, 5);
    if (p.dash) {
      px(ctx, cx - 14, 24 + bob, 4, 1, "#c01414");
      px(ctx, cx - 16, 27 + bob, 6, 1, "#5a0d12");
    }
  }
  ctx.restore();
}

function poses(kind) {
  return {
    idle: [
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 1, coatSway: 1, punch: 0, kick: 0 },
      { bob: 0, headBob: 1, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0 },
    ],
    walk: [
      { bob: 0, headBob: 0, legL: -3, legR: 3, armSwing: 1, capeWave: -1, coatSway: -1, punch: 0, kick: 0 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0 },
      { bob: 0, headBob: 0, legL: 3, legR: -3, armSwing: -1, capeWave: 1, coatSway: 1, punch: 0, kick: 0 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0 },
    ],
    attack: [
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 1, coatSway: 0, punch: 2, kick: 0 },
      { bob: 0, headBob: 0, legL: 1, legR: -1, armSwing: 0, capeWave: -1, coatSway: 0, punch: 0, kick: 2 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 4, kick: 0 },
      { bob: 0, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 0, kick: 0, overhead: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, windup: 1, wind: -2, dip: 0, brace: 0, slam: 0 },
      { bob: 1, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 0, kick: 0, windup: 0, wind: 3, dip: 5, brace: 1, slam: 1 },

      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, palm: 1, wind: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 1, punch: 0, kick: 0, elbow: 1, wind: 2, dip: 2 },
      { bob: 0, headBob: 1, legL: -1, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 0, kick: 0, backfist: 1, wind: 2 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, cobra: 1, wind: 5, dip: 2, brace: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 2, armSwing: 0, capeWave: -2, coatSway: -1, punch: 0, kick: 0, hook: 1, wind: 2, brace: 1 },
      { bob: 0, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, sweep: 1, crouch: 1 },

      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, gun: 1, wind: 1, brace: 1 },

      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: -1, punch: 0, kick: 0, palm: 1, crouch: 1, dip: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 1, kick: 0, crouch: 1 },
      { bob: 0, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, sweep: 1, crouch: 1, brace: 1 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: -2, capeWave: 4, coatSway: 3, punch: 0, kick: 2, air: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, slam: 1, wind: 2, air: 1 },

      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, slash: 1, wind: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, cross: 1, wind: 2, dip: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, slash: 1, crouch: 1, crouchSlash: 1 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, dive: 1, wind: 4, dip: 2, brace: 1 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: -2, capeWave: 0, coatSway: 0, punch: 0, kick: 0, slash: 1, air: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, dive: 1, wind: 2, air: 1 },

      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, smash: 1, wind: 2, dip: 2, brace: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, backhand: 1, wind: 2, brace: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, stomp: 1, crouch: 1, brace: 1 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, quake: 1, wind: 4, dip: 3, brace: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, stomp: 1, crouch: 1, dip: 1 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: -2, capeWave: 0, coatSway: 0, punch: 0, kick: 0, smash: 1, air: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, quake: 1, wind: 2, air: 1 },

      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, repulsor: 1, wind: 1, brace: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, burst: 1, wind: 2, brace: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, beam: 1, wind: 2, brace: 1 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, hover: 1, air: 1 },

      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 1, coatSway: 0, punch: 2, kick: 0 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 4, kick: 0, hammerSpin: 1, wind: 2, brace: 1 },
      { bob: 0, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, sweep: 1, crouch: 1, brace: 1 },
      { bob: 0, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, slam: 1, wind: 3, dip: 5, brace: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 0, kick: 0, hammerSpin: 1, wind: 1, brace: 1 },
      { bob: 0, headBob: -1, legL: -2, legR: 2, armSwing: 0, capeWave: 4, coatSway: 3, punch: 0, kick: 0, charge: 1, brace: 1, wind: -1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 4, coatSway: 3, punch: 0, kick: 0, beam: 1, brace: 1, wind: 2 },
      { bob: 0, headBob: -1, legL: -2, legR: 2, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, overhead: 1, wind: 2, brace: 1 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 4, coatSway: 3, punch: 0, kick: 0, stormcall: 1, wind: 2, dip: 5, brace: 1 },

      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 1, coatSway: 0, punch: 2, kick: 0, wind: 2, brace: 1, lash: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 4, kick: 0, wind: 3, dip: 1, brace: 1, lash: 2 },
      { bob: 0, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, wind: 2, dip: 2, brace: 1, crouch: 1, lash: 3 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, wind: 4, dip: 3, brace: 1, slam2: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 0, kick: 0, wind: 2, brace: 1, coil: 1 },
      { bob: 0, headBob: -1, legL: -2, legR: 2, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, wind: -2, brace: 1, rockhold: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 2, coatSway: 1, punch: 0, kick: 0, wind: 4, dip: 2, brace: 1, impale: 1 },
    ],

    crouch: [
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, crouch: 1, air: 0, dash: 0 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 1, coatSway: 1, punch: 0, kick: 0, crouch: 1, air: 0, dash: 0 },
    ],
    sneak: [
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 1, capeWave: -1, coatSway: -1, punch: 0, kick: 0, crouch: 1, air: 0, dash: 0 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, crouch: 1, air: 0, dash: 0 },
      { bob: 0, headBob: 0, legL: 2, legR: -2, armSwing: -1, capeWave: 1, coatSway: 1, punch: 0, kick: 0, crouch: 1, air: 0, dash: 0 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, crouch: 1, air: 0, dash: 0 },
    ],

    jump: [
      { bob: 0, headBob: 1, legL: 0, legR: 0, armSwing: -2, capeWave: 1, coatSway: 1, punch: 0, kick: 0, crouch: 1, air: 0, dash: 0 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: -2, capeWave: 4, coatSway: 3, punch: 0, kick: 0, crouch: 0, air: 1, dash: 0 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 2, punch: 0, kick: 0, crouch: 0, air: 1, dash: 0 },
      { bob: 0, headBob: 1, legL: 0, legR: 0, armSwing: 1, capeWave: -2, coatSway: -1, punch: 0, kick: 0, crouch: 0, air: 2, dash: 0 },
      { bob: 1, headBob: 1, legL: 0, legR: 0, armSwing: 2, capeWave: -4, coatSway: -3, punch: 0, kick: 0, crouch: 0, air: 2, dash: 0 },
    ],
    dash: [
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: -3, coatSway: -2, punch: 0, kick: 0, crouch: 0, air: 0, dash: 1 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: -2, coatSway: -1, punch: 0, kick: 0, crouch: 0, air: 0, dash: 1 },
    ],

    block: [
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, guard: 1, brace: 1, wind: -1 },
      { bob: 0, headBob: 1, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, guard: 2, crouch: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, guard: 1, guardWalk: 1, brace: 0, wind: -1 },
      { bob: 0, headBob: 0, legL: 2, legR: -2, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, guard: 1, guardWalk: 1, brace: 0, wind: -1 },
    ],

    grab: [
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: -3, coatSway: -2, punch: 0, kick: 0, seize: 1, brace: 1, wind: 3 },
    ],

    special: [
      { bob: 0, headBob: 1, legL: -3, legR: 3, armSwing: 0, capeWave: -3, coatSway: -3, punch: 0, kick: 0, tackle: 1, brace: 1, wind: 4, dip: 3 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 2, coatSway: 1, punch: 0, kick: 0, unmasked: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: -1, coatSway: 0, punch: 0, kick: 0, lase: 1, brace: 1, wind: 2 },
      { bob: 0, headBob: -3, legL: -2, legR: 2, armSwing: 0, capeWave: -3, coatSway: -2, punch: 0, kick: 0, shout: 1, brace: 1, wind: -1 },
      { bob: 0, headBob: -2, legL: -2, legR: 2, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, unmaskMid: 1, brace: 1, wind: -2 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: 0, capeWave: 4, coatSway: 3, punch: 0, kick: 0, leap: 1, air: 1 },
      { bob: 0, headBob: -2, legL: 0, legR: 0, armSwing: 0, capeWave: 4, coatSway: 3, punch: 0, kick: 0, hover: 1, unmasked: 1, air: 1 },
      { bob: 1, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: -1, coatSway: 0, punch: 0, kick: 0, charge: 1, brace: 1, wind: -1, dip: 2 },
      { bob: 0, headBob: -2, legL: -2, legR: 2, armSwing: 0, capeWave: -3, coatSway: -2, punch: 0, kick: 0, inhale: 1, brace: 1, wind: -2, dip: 1 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: 0, capeWave: 4, coatSway: 0, punch: 0, kick: 0, ascend: 1, lase: 1, air: 1 },
      { bob: 0, headBob: -2, legL: 0, legR: 0, armSwing: 0, capeWave: 2, coatSway: 2, punch: 0, kick: 0, carry: 1, unmasked: 1, air: 1 },
    ],

    strain: [
      { bob: 0, headBob: 1, legL: -1, legR: 2, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, strain: 1, brace: 1, wind: 1, dip: 2 },
    ],

    kdown: [
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 0 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 1 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 2 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 3 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 4 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 5 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 6 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 7 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 8 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 9 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 10 },
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, lying: 1, lk: 11 },
    ],
  };
}

export function buildSprites(kind) {
  const table = poses(kind);
  const paint = kind === "wesker" ? paintWesker : kind === "wolverine" ? paintWolverine : kind === "hulk" ? paintHulk : kind === "ironman" ? paintIronman : kind === "thor" ? paintThor : kind === "uroboros" ? paintUroboros : paintHomelander;
  const out = {};
  for (const key of Object.keys(table)) {
    out[key] = [];
    for (const p of table[key]) {
      const [c, ctx] = makeCanvas(SPRITE_W, SPRITE_H);
      paint(ctx, p);
      out[key].push(c);
    }
  }
  return out;
}

export const FEET_PAD = 4;

export function buildPortrait(kind) {
  const sprites = buildSprites(kind);
  const src = sprites.idle[0];
  const [c, ctx] = makeCanvas(32, 32);

  ctx.drawImage(src, 10, 4, 16, 16, 0, 0, 32, 32);
  return c;
}

