// Procedural pixel-art sprites for Wesker + Homelander.
// No external assets: every frame is drawn 1px at a time on a tiny canvas
// (36x52) then upscaled with smoothing OFF => crisp pixel look.
// Frames: idle[4], walk[4], attack[18] (jab, kick, cross, overhead-raise,
// windup, slam, palm, elbow, backfist, cobra, hook, sweep, SAMURAI EDGE,
// crouch palm, crouch jab, crouch sweep, air kick, air slam), crouch[2],
// sneak[4], jump[5] (anticip/rise/hang/fall/fast-fall, cloth vy-read), dash[2],
// block[2] (stand guard, crouch guard), grab[1] (seize reach),
// special[11] (tackle, unmasked, lase gaze, shout, unmaskMid, leap, hover,
// charge, inhale, ascend, carry), kdown[12] (full knockdown: flat-out + getup),
// strain[1] (Homelander throw grimace).
// Attacks animate per phase: windup on startup, strike on active,
// follow-through on recovery (mapped in combat/data.js FRAME_FOR).
// JS concept vs Python: a `class`-free factory pattern — `buildSprites(kind)`
// returns a plain object of canvases. No inheritance needed yet.

import { makeCanvas, px } from "./pixel.js";
import { SPRITE_W, SPRITE_H } from "../config.js";

const OUT = "#06060c";

// Knockdown palettes: full-body-down art is shared code, per-kind colors.
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

// 12-frame knockdown: 0-1 stagger/tip, 2 collapse, 3 slam, 4-7 flat-out
// (head on the floor, twitch/breathe variants), 8 push-up, 9 kneel,
// 10 crouch, 11 rise. Local +x = facing (flip handles the rest); the floor
// is row 48, head lands at -x (knocked backward).
function paintLying(ctx, lk, P) {
  const flatHead = (hx, hy) => {
    box(ctx, hx, hy, 8, 7, P.skin);
    px(ctx, hx, hy, 8, 2, P.hair);            // hair pressed to the floor
    px(ctx, hx, hy + 3, 8, 2, P.eye);         // shut feat: eye band
    px(ctx, hx + 2, hy + 3, 2, 1, P.eyeHi);
  };
  const flatLegs = (x0, y0) => {
    px(ctx, x0 - 1, y0 - 1, 14, 6, OUT);
    px(ctx, x0, y0, 12, 4, P.pants);          // legs extended flat
    px(ctx, x0, y0, 12, 1, P.rim);
    px(ctx, x0 + 12, y0 - 1, 5, 6, P.boot);   // boots
    px(ctx, x0 + 12, y0 - 1, 5, 1, P.bootHi);
  };
  const flatTorso = (x0, y0) => {
    px(ctx, x0 - 1, y0 - 1, 13, 8, OUT);
    px(ctx, x0, y0, 11, 6, P.torso);
    px(ctx, x0, y0, 11, 1, P.rim);
    if (P.belt) px(ctx, x0 + 8, y0 + 1, 3, 4, P.belt);
  };
  if (P.cape) {
    px(ctx, 5, 45, 22, 3, P.cape);            // cape pooled under the body
    px(ctx, 8, 46, 14, 1, "#6e0d0d");
  }
  if (lk === 0) {
    // Stagger: upright, reeling back, arms flung up.
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
    // Tipping: knees buckled, torso sinking back, one arm windmilling.
    leg(ctx, 10, 38, 8, P.pants, P.shade, P.boot, P.bootHi);
    leg(ctx, 21, 38, 8, P.pants, P.shade, P.boot, P.bootHi);
    box(ctx, 11, 23, 12, 16, P.torso);
    px(ctx, 11, 23, 2, 16, P.rim);
    box(ctx, 11, 13, 10, 9, P.skin);
    px(ctx, 11, 13, 10, 3, P.hair);
    px(ctx, 11, 17, 10, 2, P.eye);
    px(ctx, 24, 8, 8, 3, OUT); px(ctx, 25, 9, 6, 1, P.skin);   // flung arm
    arm(ctx, 6, 24, 5, 9, P.torso, P.shade, P.skin);
  } else if (lk === 2) {
    // Collapse: body diagonal, head dropping toward the floor.
    px(ctx, 14, 30, 11, 6, OUT); px(ctx, 15, 31, 9, 4, P.torso);
    px(ctx, 11, 35, 11, 6, OUT); px(ctx, 12, 36, 9, 4, P.torso);
    px(ctx, 8, 39, 12, 6, OUT); px(ctx, 9, 40, 10, 4, P.torso);
    px(ctx, 9, 40, 10, 1, P.rim);
    box(ctx, 1, 38, 8, 7, P.skin);
    px(ctx, 1, 38, 8, 2, P.hair);
    px(ctx, 1, 41, 8, 2, P.eye);
    flatLegs(20, 42);
    px(ctx, 16, 32, 8, 3, OUT); px(ctx, 17, 33, 6, 1, P.skin); // trailing arm
  } else if (lk <= 7) {
    // Flat-out: full body down, head on the floor.
    const breathe = lk === 6 ? -1 : 0;
    flatLegs(18, 44);
    flatTorso(9, 42 + breathe);
    flatHead(1, 41);
    if (lk === 3) {
      // Slam frame: arm still in the air, stars of impact.
      px(ctx, 11, 33, 5, 9, OUT); px(ctx, 12, 34, 3, 7, P.torso);
      px(ctx, 11, 30, 5, 4, P.skin);
      px(ctx, 26, 38, 2, 2, "#ffffff");
      px(ctx, 29, 41, 2, 2, "#ffffff");
    } else if (lk === 5 || lk === 7) {
      // Twitch: head lifts a pixel, fist clenches.
      px(ctx, 1, 40, 8, 1, P.skin);
      px(ctx, 10, 43, 8, 3, OUT); px(ctx, 11, 44, 6, 1, P.torso);
      px(ctx, 15, 43, 3, 3, P.skin);
    } else {
      // Still: arm resting across the chest.
      px(ctx, 10, 44, 9, 3, OUT); px(ctx, 11, 45, 7, 1, P.torso);
      px(ctx, 16, 44, 3, 3, P.skin);
    }
  } else if (lk === 8) {
    // Push-up: head up, one arm driving into the floor.
    flatLegs(20, 43);
    px(ctx, 10, 35, 10, 5, OUT); px(ctx, 11, 36, 8, 3, P.torso);
    px(ctx, 15, 38, 8, 5, OUT); px(ctx, 16, 39, 6, 3, P.torso);
    box(ctx, 2, 33, 8, 7, P.skin);
    px(ctx, 2, 33, 8, 2, P.hair);
    px(ctx, 2, 36, 8, 2, P.eye);
    px(ctx, 12, 40, 4, 8, OUT); px(ctx, 13, 41, 2, 6, P.torso); px(ctx, 13, 45, 2, 3, P.skin);
  } else if (lk === 9) {
    // Kneel: back knee down, torso up, hand braced on thigh.
    px(ctx, 8, 43, 8, 4, OUT); px(ctx, 9, 44, 6, 2, P.pants);   // grounded knee
    px(ctx, 18, 38, 9, 5, OUT); px(ctx, 19, 39, 7, 3, P.pants); // forward thigh
    leg(ctx, 24, 36, 10, P.pants, P.shade, P.boot, P.bootHi);  // planted shin
    box(ctx, 12, 24, 11, 15, P.torso);
    px(ctx, 12, 24, 2, 15, P.rim);
    if (P.belt) px(ctx, 12, 33, 11, 3, P.belt);
    box(ctx, 13, 14, 10, 9, P.skin);
    px(ctx, 13, 14, 10, 3, P.hair);
    px(ctx, 13, 18, 10, 2, P.eye);
    px(ctx, 14, 30, 8, 3, OUT); px(ctx, 15, 31, 6, 1, P.torso); // braced arm
  } else if (lk === 10) {
    // Crouch gather: folded low, about to stand.
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
    // Rise: near-standing, last hand leaving the knee.
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

// Box with 1px outline: draws outline rect, then fill inset by 1 on left/right
// (keeps silhouette readable against any background — M1 requirement).
function box(ctx, x, y, w, h, fill, outline = OUT) {
  px(ctx, x - 1, y - 1, w + 2, h + 2, outline);
  px(ctx, x, y, w, h, fill);
}

function leg(ctx, x, yTop, h, main, dark, boot, bootHi) {
  const w = 5;
  px(ctx, x - 1, yTop - 1, w + 2, h + 3, OUT); // outline incl. boot
  px(ctx, x, yTop, w, h, main);                // leg
  px(ctx, x + 3, yTop, 2, h, dark);            // shade on inner side
  px(ctx, x, yTop + h - 2, w, 4, boot);        // boot
  px(ctx, x, yTop + h - 2, w, 1, bootHi);      // boot shine
}

function arm(ctx, x, y, w, h, sleeve, sleeveDark, fist) {
  px(ctx, x - 1, y - 1, w + 2, h + 2, OUT);
  px(ctx, x, y, w, h, sleeve);
  px(ctx, x, y, w, 1, sleeveDark); // top shade line (simple shading)
  px(ctx, x + (w > 6 ? w - 3 : 0), y + h - 3, 3, 3, fist); // fist at end
}

// ---- per-character painters ---------------------------------------------
function paintWesker(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_W); return; } // 12-frame knockdown
  const bob = p.bob;
  const drop = (p.crouch ? 8 : 0) + (p.dip || 0); // crouch sink + slam fold-over
  const lean = (p.dash ? 2 : 0) + (p.wind || 0);   // dash drive + windup coil / slam drive
  // Back coat tails (behind legs) — long coat = Wesker silhouette.
  const sway = p.coatSway;
  px(ctx, cx - 8 + sway, 30 + bob + drop, 6, 14, "#101018");
  px(ctx, cx + 2 - sway, 30 + bob + drop, 6, 14, "#101018");
  px(ctx, cx - 8 + sway, 30 + bob + drop, 1, 14, "#33334d"); // rim light
  px(ctx, cx + 7 - sway, 30 + bob + drop, 1, 14, "#33334d");

  // Stance legs: stand / crouch-fold / air-tuck / dash-lunge.
  // Boot bottoms stay on row 48 in every grounded stance (see FEET_PAD).
  const LM = "#14141c", LD = "#08080d", BT = "#000000", BH = "#3a3a4d";
  if (p.crouch) {
    leg(ctx, cx - 9 + p.legL, 40 + bob, 6, LM, LD, BT, BH); // folded, wide base
    leg(ctx, cx + 4 + p.legR, 40 + bob, 6, LM, LD, BT, BH);
  } else if (p.air === 1) {
    leg(ctx, cx - 6 + p.legL, 37 + bob, 7, LM, LD, BT, BH); // knees tucked (rise)
    leg(ctx, cx + 1 + p.legR, 39 + bob, 5, LM, LD, BT, BH);
  } else if (p.air === 2) {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 11, LM, LD, BT, BH); // reaching down (fall)
    leg(ctx, cx + 1 + p.legR, 35 + bob, 10, LM, LD, BT, BH);
  } else if (p.dash) {
    leg(ctx, cx - 10, 36 + bob, 10, LM, LD, BT, BH); // lunge stance
    leg(ctx, cx + 4, 36 + bob, 10, LM, LD, BT, BH);
  } else if (p.guardWalk) {
    // Block-retreat: narrow walk-cycle legs (not the wide brace base).
    leg(ctx, cx - 6 + (p.legL || 0), 34 + bob, 12, LM, LD, BT, BH);
    leg(ctx, cx + 1 + (p.legR || 0), 34 + bob, 12, LM, LD, BT, BH);
  } else if (p.brace) {
    leg(ctx, cx - 9 + (p.legL || 0), 38 + bob, 8, LM, LD, BT, BH); // braced wide base for the slam
    leg(ctx, cx + 4 + (p.legR || 0), 38 + bob, 8, LM, LD, BT, BH);
  } else {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 12, LM, LD, BT, BH);
    leg(ctx, cx + 1 + p.legR, 34 + bob, 12, LM, LD, BT, BH);
  }
  ctx.save();
  ctx.translate(lean, drop); // shift torso + head + arms together

  // Torso: dark coat, V shirt, buttons, high collar.
  box(ctx, cx - 6, 19 + bob, 12, 16, "#1b1b26");
  px(ctx, cx - 6, 19 + bob, 2, 16, "#33334d");   // left rim light
  px(ctx, cx + 4, 19 + bob, 2, 16, "#0c0c12");   // right shade
  px(ctx, cx - 2, 20 + bob, 4, 9, "#0a0a10");    // black shirt V
  px(ctx, cx - 1, 22 + bob, 2, 6, "#23232f");    // shirt fold
  px(ctx, cx - 6, 16 + bob, 12, 4, "#101018");   // high collar
  px(ctx, cx - 6, 16 + bob, 12, 1, "#3d3d5c");   // collar highlight
  // Coat front edges
  px(ctx, cx - 5, 24 + bob, 1, 11, "#3a3a55");
  px(ctx, cx + 4, 24 + bob, 1, 11, "#000000");

  // Head: skin + blond crop + sunglasses (signature).
  // NOTE: hy rides `bob` (body motion) PLUS headBob (relative nod). An old
  // revision used headBob alone, which opened a 1px neck gap on every
  // bob=1 frame (idle/walk bobbing) — the "floating head" bug.
  const hy = 7 + bob + (p.headBob || 0);
  box(ctx, cx - 5, hy, 10, 9, "#e6b48c");
  px(ctx, cx + 3, hy, 2, 9, "#b98a63");          // face shade (light from left)
  px(ctx, cx - 5, hy, 10, 3, "#c8a45e");        // short blond hair
  px(ctx, cx - 5, hy + 2, 2, 3, "#c8a45e");     // sideburns
  px(ctx, cx + 3, hy + 2, 2, 3, "#c8a45e");
  // Sunglasses bar + red glint (Wesker signature)
  if (p.unmasked) {
    // RAGE MODE: sunglasses torn away, Uroboros infection burning red.
    px(ctx, cx - 5, hy + 4, 10, 2, "#7a1010");     // inflamed eye band
    px(ctx, cx - 4, hy + 4, 3, 2, "#ff2a2a");      // burning eyes
    px(ctx, cx + 1, hy + 4, 3, 2, "#ff2a2a");
    px(ctx, cx - 4, hy + 4, 3, 1, "#ffd0d0");      // hot glints
    px(ctx, cx + 1, hy + 4, 3, 1, "#ffd0d0");
    px(ctx, cx - 5, hy + 7, 10, 1, "#5a0d0d");     // dark veins below
  } else {
    px(ctx, cx - 5, hy + 4, 10, 3, "#0b0b10");
    px(ctx, cx - 5, hy + 4, 10, 1, "#3a3a4d");
    px(ctx, cx + 1, hy + 5, 2, 1, "#ff3030");     // glint
  }
  px(ctx, cx - 3, hy + 8, 4, 1, "#a87c58");     // mouth shadow

  // Arms depend on pose.
  if (p.tackle) {
    // Jaguar Charge: shoulder dropped low, lead arm swept back for speed.
    px(ctx, cx + 0, 24 + bob, 12, 7, OUT);
    px(ctx, cx + 1, 25 + bob, 10, 5, "#1b1b26");
    px(ctx, cx + 1, 25 + bob, 10, 1, "#33334d");
    px(ctx, cx + 8, 25 + bob, 4, 5, "#4a3320");      // tucked fist
    px(ctx, cx - 8, 22 + bob, 8, 2, "#9fd4ff");      // back-swept speed lines
    px(ctx, cx - 10, 25 + bob, 10, 2, "#3a6a9f");
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.unmaskMid) {
    // RAGE transform beat 2: hand tearing glasses away, head snapped back.
    px(ctx, cx + 3, 10 + bob, 6, 12, OUT);
    px(ctx, cx + 4, 11 + bob, 4, 10, "#1b1b26");
    px(ctx, cx + 4, 17 + bob, 4, 4, "#4a3320");      // ripping fist at face
    px(ctx, cx + 4, 11 + bob, 4, 1, "#ff3030");      // torn-glasses glint
    px(ctx, cx - 8, 22 + bob, 2, 8, "#ff3b1a");      // first ember streaks
    px(ctx, cx - 5, 24 + bob, 2, 6, "#ffb13e");
    arm(ctx, cx - 9, 22 + bob, 5, 9, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.leap) {
    // RAGE rise: skyward leap, both fists punched down, coat flared wide.
    px(ctx, cx - 8, 26 + bob, 6, 10, OUT);
    px(ctx, cx - 7, 27 + bob, 4, 8, "#1b1b26");
    px(ctx, cx - 7, 33 + bob, 4, 3, "#4a3320");
    px(ctx, cx + 3, 26 + bob, 6, 10, OUT);
    px(ctx, cx + 4, 27 + bob, 4, 8, "#1b1b26");
    px(ctx, cx + 4, 33 + bob, 4, 3, "#4a3320");
    px(ctx, cx - 11, 18 + bob, 3, 12, "#9fd4ff");    // liftoff speed lines
    px(ctx, cx + 8, 18 + bob, 3, 12, "#3a6a9f");
  } else if (p.hover) {
    // RAGE aim: hanging at apex, arms spread wide calling the missile down.
    px(ctx, cx - 13, 14 + bob, 6, 10, OUT);
    px(ctx, cx - 12, 15 + bob, 4, 8, "#1b1b26");
    px(ctx, cx - 12, 15 + bob, 4, 2, "#4a3320");
    px(ctx, cx + 8, 14 + bob, 6, 10, OUT);
    px(ctx, cx + 9, 15 + bob, 4, 8, "#1b1b26");
    px(ctx, cx + 9, 15 + bob, 4, 2, "#4a3320");
    px(ctx, cx - 2, 8 + bob, 4, 4, "#ff3b1a");       // signal glint overhead
  } else if (p.carry) {
    // RAGE drop: missile gripped overhead in both fists, body stretched.
    px(ctx, cx - 10, 8 + bob, 6, 14, OUT);
    px(ctx, cx - 9, 9 + bob, 4, 12, "#1b1b26");
    px(ctx, cx - 9, 9 + bob, 4, 3, "#4a3320");       // left fist overhead
    px(ctx, cx + 5, 8 + bob, 6, 14, OUT);
    px(ctx, cx + 6, 9 + bob, 4, 12, "#1b1b26");
    px(ctx, cx + 6, 9 + bob, 4, 3, "#4a3320");       // right fist overhead
    px(ctx, cx - 5, 4 + bob, 10, 3, "#1a1a20");      // missile tail between fists
    px(ctx, cx - 5, 4 + bob, 10, 1, "#ff7a1a");      // hot grip glint
  } else if (p.seize) {
    // Grab reach: both arms shot forward at chest height, deep lean-in.
    px(ctx, cx - 2, 21 + bob, 12, 4, OUT);
    px(ctx, cx - 1, 22 + bob, 10, 2, "#1b1b26");
    px(ctx, cx + 7, 21 + bob, 4, 4, "#4a3320");    // open hands
    px(ctx, cx - 6, 23 + bob, 6, 8, "#1b1b26");    // rear guard arm
    px(ctx, cx - 6, 28 + bob, 5, 3, "#4a3320");
  } else if (p.guard === 1) {
    // MVC3 one-hand stand guard: lead forearm snapped vertical in front of
    // the face, fist up; rear hand chambered low at the hip, elbow in.
    px(ctx, cx + 2, 17 + bob, 6, 14, OUT);
    px(ctx, cx + 3, 18 + bob, 4, 12, "#1b1b26");
    px(ctx, cx + 3, 18 + bob, 4, 1, "#33334d");      // forearm rim light
    px(ctx, cx + 3, 16 + bob, 4, 4, "#4a3320");      // raised lead fist
    px(ctx, cx + 3, 16 + bob, 4, 1, "#8a6540");      // knuckle light
    arm(ctx, cx - 9, 24 + bob, 5, 7, "#1b1b26", "#0c0c12", "#4a3320"); // rear fist at hip
  } else if (p.guard === 2) {
    // Crouch guard: low cross over the knees (body already dropped).
    px(ctx, cx - 8, 22 + bob, 14, 8, OUT);
    px(ctx, cx - 7, 23 + bob, 12, 2, "#1b1b26");
    px(ctx, cx - 7, 27 + bob, 12, 2, "#23232f");
    px(ctx, cx - 7, 23 + bob, 3, 6, "#4a3320");
    px(ctx, cx + 4, 23 + bob, 3, 6, "#4a3320");
    px(ctx, cx - 7, 23 + bob, 12, 1, "#33334d");
  } else if (p.windup) {
    // Anticipation: fists chambered at the chest, weight shifted back.
    px(ctx, cx - 9, 19 + bob, 7, 11, OUT);
    px(ctx, cx - 8, 20 + bob, 5, 9, "#1b1b26");
    px(ctx, cx - 8, 20 + bob, 5, 4, "#4a3320");    // chambered fist
    px(ctx, cx + 2, 21 + bob, 7, 11, OUT);
    px(ctx, cx + 3, 22 + bob, 5, 9, "#1b1b26");
    px(ctx, cx + 3, 22 + bob, 5, 4, "#8a6540");
  } else if (p.slam) {
    // Heavy payoff: both arms crashed down-forward, torso folded over.
    px(ctx, cx - 2, 24 + bob, 14, 6, OUT);
    px(ctx, cx - 1, 25 + bob, 12, 4, "#1b1b26");
    px(ctx, cx + 7, 25 + bob, 5, 5, "#4a3320");    // joined fists, low
    px(ctx, cx + 7, 25 + bob, 5, 1, "#8a6540");
    px(ctx, cx + 2, 12 + bob, 2, 10, "#9fd4ff");   // downward speed lines
    px(ctx, cx + 6, 14 + bob, 2, 8, "#3a6a9f");
  } else if (p.overhead) {
    // Heavy overhead smash: both fists raised high, body coiled.
    px(ctx, cx - 9, 8 + bob, 7, 14, OUT);
    px(ctx, cx - 8, 9 + bob, 5, 12, "#1b1b26");
    px(ctx, cx - 8, 9 + bob, 5, 3, "#4a3320");    // raised fists
    px(ctx, cx + 2, 10 + bob, 7, 14, OUT);
    px(ctx, cx + 3, 11 + bob, 5, 12, "#1b1b26");
    px(ctx, cx + 3, 11 + bob, 5, 1, "#8a6540");   // knuckle light
  } else if (p.punch > 0) {
    // Punching arm extended toward +x (flip handles facing).
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    const ex = cx + 6, ey = 22 + bob - p.punch;
    px(ctx, ex - 1, ey - 1, 12, 5, OUT);
    px(ctx, ex, ey, 11, 3, "#1b1b26");
    px(ctx, ex + 8, ey - 1, 4, 5, "#4a3320");   // fist
    px(ctx, ex + 8, ey - 1, 4, 1, "#8a6540");   // knuckle light
    // Speed streak pixels (impact readability, animated later in M14)
    px(ctx, ex - 4, ey + 1, 3, 1, "#9fd4ff");
  } else if (p.kick > 0) {
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    arm(ctx, cx + 4, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    // Extended kick leg drawn over base legs
    px(ctx, cx + 2, 36 + bob, 13, 5, "#14141c");
    px(ctx, cx + 2, 36 + bob, 13, 1, "#33334d");
    px(ctx, cx + 11, 35 + bob, 4, 6, "#000000");
  } else if (p.palm) {
    // Open-hand thrust: arm extended, flat blade-hand, short snap streak.
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    px(ctx, cx + 6, 21 + bob - 1, 10, 4, OUT);
    px(ctx, cx + 7, 22 + bob - 1, 8, 2, "#1b1b26");
    px(ctx, cx + 13, 22 + bob - 1, 3, 2, "#e6b48c");   // edge of the hand
    px(ctx, cx + 3, 22 + bob, 3, 1, "#9fd4ff");
  } else if (p.elbow) {
    // Close elbow: arm folded tight, body sunk over it for the smash.
    px(ctx, cx - 4, 22 + bob, 10, 6, OUT);
    px(ctx, cx - 3, 23 + bob, 8, 4, "#1b1b26");
    px(ctx, cx + 3, 23 + bob, 3, 4, "#4a3320");        // elbow point forward
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.backfist) {
    // High backfist: arm whipped up-across, fist at full height.
    px(ctx, cx + 1, 8 + bob, 6, 15, OUT);
    px(ctx, cx + 2, 9 + bob, 4, 13, "#1b1b26");
    px(ctx, cx + 2, 9 + bob, 4, 4, "#4a3320");         // fist at apex
    arm(ctx, cx - 9, 22 + bob, 5, 9, "#1b1b26", "#0c0c12", "#4a3320");
    px(ctx, cx - 2, 12 + bob, 2, 6, "#9fd4ff");        // upward arc streak
  } else if (p.cobra) {
    // COBRA STRIKE: knife-hand speared dead level, whole body behind it.
    px(ctx, cx + 2, 20 + bob, 16, 5, OUT);
    px(ctx, cx + 3, 21 + bob, 14, 3, "#1b1b26");
    px(ctx, cx + 3, 21 + bob, 14, 1, "#33334d");
    px(ctx, cx + 15, 21 + bob, 3, 3, "#e6b48c");       // blade-hand tip
    px(ctx, cx + 15, 22 + bob, 3, 1, "#ff3030");       // Wesker red glint
    px(ctx, cx - 3, 22 + bob, 5, 1, "#9fd4ff");        // drive streaks
    px(ctx, cx - 5, 24 + bob, 7, 1, "#3a6a9f");
    arm(ctx, cx - 9, 22 + bob, 5, 9, "#1b1b26", "#0c0c12", "#4a3320");
  } else if (p.gun) {
    // SAMURAI EDGE: both arms punched forward, pistol leveled at chest
    // height. Canvas is 36px wide (cx=18) — muzzle glint sits at cx+16..17
    // so the tip stays inside the frame before the 3x upscale.
    arm(ctx, cx - 9, 21 + bob, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    px(ctx, cx + 2, 20 + bob, 16, 7, OUT);             // arms+gun outline block
    px(ctx, cx + 3, 21 + bob, 9, 5, "#1b1b26");        // extended sleeves
    px(ctx, cx + 3, 21 + bob, 9, 1, "#33334d");        // rim light
    px(ctx, cx + 11, 21 + bob, 7, 4, OUT);             // slide outline
    px(ctx, cx + 12, 22 + bob, 5, 2, "#9a9ab0");       // steel slide
    px(ctx, cx + 12, 24 + bob, 3, 2, "#3a2a1a");       // grip under slide
    px(ctx, cx + 16, 22 + bob, 2, 1, "#ffd23e");       // muzzle glint
    px(ctx, cx - 4, 24 + bob, 6, 4, "#4a3320");        // support hand
  } else {
    arm(ctx, cx - 9, 21 + bob + p.armSwing, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    arm(ctx, cx + 4, 21 + bob - p.armSwing, 5, 10, "#1b1b26", "#0c0c12", "#4a3320");
    if (p.dash) {
      // Motion streaks trailing behind the dash (local -x = behind).
      px(ctx, cx - 13, 24 + bob, 4, 1, "#9fd4ff");
      px(ctx, cx - 15, 27 + bob, 6, 1, "#3a6a9f");
    }
  }
  ctx.restore();
}

function paintHomelander(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_H); return; } // 12-frame knockdown
  const bob = p.bob;
  const drop = (p.crouch ? 8 : 0) + (p.dip || 0);
  const lean = (p.dash ? 2 : 0) + (p.wind || 0);
  // Cape behind everything — big red shape = Homelander silhouette.
  const wv = p.capeWave;
  px(ctx, cx - 10 + wv, 16 + bob + drop, 5, 28, "#6e0d0d");   // inner shade
  px(ctx, cx - 5 + wv, 16 + bob + drop, 12, 28, "#a01313");   // main cape
  px(ctx, cx + 7 + wv, 16 + bob + drop, 1, 28, "#e05050");    // rim light edge
  for (let i = 0; i < 5; i++) {
    px(ctx, cx - 5 + wv + (i % 2), 20 + bob + drop + i * 5, 10 - i, 1, "#6e0d0d"); // folds
  }

  // Stance legs: blue suit + red boots (same stance logic as Wesker).
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
    // Block-retreat: narrow walk-cycle legs (not the wide brace base).
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

  // Torso: bright blue suit, muscle shading, gold belt + eagle.
  box(ctx, cx - 7, 19 + bob, 14, 16, "#2043e0");       // broader shoulders
  px(ctx, cx - 7, 19 + bob, 3, 16, "#6f86ff");         // left highlight
  px(ctx, cx + 4, 19 + bob, 3, 16, "#152c96");         // right shade
  px(ctx, cx - 2, 21 + bob, 4, 5, "#6f86ff");          // chest light
  // Chest eagle (gold) + white wing accents
  px(ctx, cx - 2, 23 + bob, 4, 2, "#ffd23e");
  px(ctx, cx - 4, 23 + bob, 2, 1, "#ffffff");
  px(ctx, cx + 2, 23 + bob, 2, 1, "#ffffff");
  // Belt
  px(ctx, cx - 7, 31 + bob, 14, 3, "#ffd23e");
  px(ctx, cx - 1, 31 + bob, 3, 3, "#fff2a8");
  // Shoulder stars (white details)
  px(ctx, cx - 6, 20 + bob, 2, 2, "#ffffff");
  px(ctx, cx + 4, 20 + bob, 2, 2, "#ffffff");

  // Head: skin + swept blond hair. (Same bob-riding hy as Wesker — see note
  // there. headBob is only the extra nod on top of body motion.)
  const hy = 7 + bob + (p.headBob || 0);
  box(ctx, cx - 5, hy, 10, 9, "#f2c9a0");
  px(ctx, cx + 3, hy, 2, 9, "#c89868");
  px(ctx, cx - 5, hy - 1, 10, 3, "#d9b45f");           // hair cap
  px(ctx, cx + 1, hy - 1, 5, 1, "#f4dd9a");            // shine
  px(ctx, cx - 5, hy + 2, 1, 4, "#d9b45f");            // side fringe
  px(ctx, cx - 3, hy + 4, 2, 2, "#ffffff");            // eyes
  px(ctx, cx + 1, hy + 4, 2, 2, "#ffffff");
  px(ctx, cx - 3, hy + 5, 1, 1, "#1a3fd4");
  px(ctx, cx + 1, hy + 5, 1, 1, "#1a3fd4");
  if (p.lase) {
    // Searing heat-vision pupils over the base eyes.
    px(ctx, cx - 3, hy + 4, 2, 2, "#ffffff");
    px(ctx, cx + 1, hy + 4, 2, 2, "#ffffff");
    px(ctx, cx - 3, hy + 5, 2, 1, "#ff3b1a");
    px(ctx, cx + 1, hy + 5, 2, 1, "#ff3b1a");
  }
  px(ctx, cx - 2, hy + 8, 4, 1, "#a8764e");            // confident smirk
  if (p.strain) {
    // Herculean effort (throw): brows down, teeth bared.
    px(ctx, cx - 4, hy + 3, 4, 1, "#8a6a2a");
    px(ctx, cx + 0, hy + 3, 4, 1, "#8a6a2a");
    px(ctx, cx - 3, hy + 8, 6, 2, "#ffffff");
    px(ctx, cx - 3, hy + 8, 1, 2, "#a8764e");
    px(ctx, cx + 0, hy + 8, 1, 2, "#a8764e");
    px(ctx, cx + 2, hy + 8, 1, 2, "#a8764e");
  } else if (p.shout) {
    // Head thrown back: brow high, throat dropped wide open.
    px(ctx, cx - 3, hy + 1, 6, 1, "#d9b45f");
    px(ctx, cx - 3, hy + 7, 6, 4, "#3a0d0d");
    px(ctx, cx - 3, hy + 7, 6, 1, "#ffffff");
    px(ctx, cx - 2, hy + 9, 4, 2, "#7a1a1a");
  }

  if (p.strain) {
    // Both arms driving down-forward for the toss.
    px(ctx, cx - 9, 23 + bob, 6, 11, OUT);
    px(ctx, cx - 8, 24 + bob, 4, 9, "#2043e0");
    px(ctx, cx - 8, 30 + bob, 4, 3, "#f2c9a0");
    px(ctx, cx + 3, 23 + bob, 6, 11, OUT);
    px(ctx, cx + 4, 24 + bob, 4, 9, "#2043e0");
    px(ctx, cx + 4, 30 + bob, 4, 3, "#f2c9a0");
  } else if (p.charge) {
    // LASER charge: head ducked, eyes dim kindling, arms braced back.
    px(ctx, cx - 2, 22 + bob, 10, 5, OUT);
    px(ctx, cx - 1, 23 + bob, 8, 3, "#152c96");
    px(ctx, cx + 5, 23 + bob, 3, 3, "#7a1a1a");       // dim pre-glow
    px(ctx, cx - 6, 25 + bob, 5, 8, "#2043e0");
    px(ctx, cx - 6, 31 + bob, 4, 2, "#f2c9a0");
    px(ctx, cx - 4, 14 + bob, 2, 6, "#ffb13e");       // gathering sparks
  } else if (p.inhale) {
    // SCREAM inhale: chest swelled, arms cocked back, head tipped up.
    px(ctx, cx - 12, 22 + bob, 6, 10, OUT);
    px(ctx, cx - 11, 23 + bob, 4, 8, "#152c96");
    px(ctx, cx + 6, 22 + bob, 6, 10, OUT);
    px(ctx, cx + 7, 23 + bob, 4, 8, "#152c96");
    px(ctx, cx - 2, 20 + bob, 8, 4, OUT);
    px(ctx, cx - 1, 21 + bob, 6, 2, "#6f86ff");       // swelled chest light
    px(ctx, cx - 2, 22 + bob, 8, 2, "#ffd23e");
  } else if (p.ascend) {
    // H-RAGE ascend: cape flared full-spread, eyes ignited, fists clenched.
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
    // HEAT VISION: head thrust forward, eyes white-hot with red halo.
    // (M11 — the glow reserved for his specials starts here.)
    px(ctx, cx - 2, 20 + bob, 10, 5, OUT);
    px(ctx, cx - 1, 21 + bob, 8, 3, "#2043e0");
    px(ctx, cx + 5, 21 + bob, 4, 3, "#ff3b1a");        // halo
    px(ctx, cx + 6, 22 + bob, 3, 2, "#ffffff");        // burning pupils
    px(ctx, cx - 6, 23 + bob, 5, 8, "#2043e0");        // braced arm back
    px(ctx, cx - 6, 29 + bob, 4, 2, "#f2c9a0");
  } else if (p.shout) {
    // SONIC SCREAM: head thrown back, jaw wide, arms flung open.
    px(ctx, cx - 12, 20 + bob, 6, 10, OUT);
    px(ctx, cx - 11, 21 + bob, 4, 8, "#2043e0");
    px(ctx, cx - 11, 27 + bob, 4, 2, "#f2c9a0");
    px(ctx, cx + 6, 20 + bob, 6, 10, OUT);
    px(ctx, cx + 7, 21 + bob, 4, 8, "#2043e0");
    px(ctx, cx + 7, 27 + bob, 4, 2, "#f2c9a0");
    px(ctx, cx - 2, 22 + bob, 8, 2, "#ffd23e");        // chest eagle lit
  } else if (p.seize) {
    px(ctx, cx - 3, 21 + bob, 12, 4, OUT);
    px(ctx, cx - 2, 22 + bob, 10, 2, "#2043e0");
    px(ctx, cx + 6, 21 + bob, 4, 4, "#f2c9a0");    // open hands
    px(ctx, cx - 7, 23 + bob, 6, 8, "#2043e0");    // rear guard arm
    px(ctx, cx - 7, 28 + bob, 5, 3, "#2043e0");
  } else if (p.guard === 1) {
    // MVC3 one-hand stand guard: lead forearm vertical before the face.
    px(ctx, cx + 1, 17 + bob, 6, 14, OUT);
    px(ctx, cx + 2, 18 + bob, 4, 12, "#2043e0");
    px(ctx, cx + 2, 18 + bob, 4, 1, "#6f86ff");      // suit highlight
    px(ctx, cx + 2, 16 + bob, 4, 4, "#f2c9a0");      // raised lead fist
    arm(ctx, cx - 10, 24 + bob, 5, 7, "#2043e0", "#152c96", "#2043e0"); // rear fist at hip
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
    px(ctx, cx - 9, 20 + bob, 5, 4, "#f2c9a0");    // chambered fist
    px(ctx, cx + 3, 21 + bob, 7, 11, OUT);
    px(ctx, cx + 4, 22 + bob, 5, 9, "#2043e0");
    px(ctx, cx + 4, 22 + bob, 5, 4, "#6f86ff");
  } else if (p.slam) {
    px(ctx, cx - 3, 24 + bob, 14, 6, OUT);
    px(ctx, cx - 2, 25 + bob, 12, 4, "#2043e0");
    px(ctx, cx + 6, 25 + bob, 5, 5, "#f2c9a0");    // joined fists, low
    px(ctx, cx + 6, 25 + bob, 5, 1, "#ffffff");
    px(ctx, cx + 1, 12 + bob, 2, 10, "#ffffff");   // downward speed lines
    px(ctx, cx + 5, 14 + bob, 2, 8, "#6f86ff");
  } else if (p.overhead) {
    px(ctx, cx - 10, 8 + bob, 7, 14, OUT);
    px(ctx, cx - 9, 9 + bob, 5, 12, "#2043e0");
    px(ctx, cx - 9, 9 + bob, 5, 3, "#f2c9a0");    // raised fists
    px(ctx, cx + 3, 10 + bob, 7, 14, OUT);
    px(ctx, cx + 4, 11 + bob, 5, 12, "#2043e0");
    px(ctx, cx + 4, 11 + bob, 5, 1, "#6f86ff");
  } else if (p.punch > 0) {
    arm(ctx, cx - 10, 21 + bob, 5, 10, "#2043e0", "#152c96", "#2043e0");
    const ex = cx + 7, ey = 22 + bob - p.punch;
    px(ctx, ex - 1, ey - 1, 12, 5, OUT);
    px(ctx, ex, ey, 11, 3, "#2043e0");
    px(ctx, ex, ey, 11, 1, "#6f86ff");
    px(ctx, ex + 8, ey - 1, 4, 5, "#f2c9a0");          // fist (skin)
    px(ctx, ex - 4, ey + 1, 3, 1, "#ffffff");          // streak
  } else if (p.kick > 0) {
    arm(ctx, cx - 10, 21 + bob, 5, 10, "#2043e0", "#152c96", "#2043e0");
    arm(ctx, cx + 5, 21 + bob, 5, 10, "#2043e0", "#152c96", "#2043e0");
    px(ctx, cx + 2, 36 + bob, 13, 5, "#2043e0");
    px(ctx, cx + 2, 36 + bob, 13, 1, "#6f86ff");
    px(ctx, cx + 11, 35 + bob, 4, 6, "#a01313");
    px(ctx, cx + 11, 35 + bob, 4, 1, "#e05050");
  } else if (p.hook) {
    // Wide hook: arm looped out and up, heavy fist riding the arc.
    px(ctx, cx + 3, 12 + bob, 9, 14, OUT);
    px(ctx, cx + 4, 13 + bob, 7, 12, "#2043e0");
    px(ctx, cx + 4, 13 + bob, 7, 2, "#6f86ff");
    px(ctx, cx + 6, 21 + bob, 5, 5, "#f2c9a0");        // fist low in the arc
    px(ctx, cx - 1, 16 + bob, 3, 8, "#ffffff");        // arc streak
    arm(ctx, cx - 10, 22 + bob, 5, 9, "#2043e0", "#152c96", "#2043e0");
  } else if (p.sweep) {
    // Low sweep: leg scythed forward along the ground, dust kicked up.
    px(ctx, cx - 2, 37 + bob, 16, 4, OUT);
    px(ctx, cx - 1, 38 + bob, 14, 2, "#2043e0");
    px(ctx, cx - 1, 38 + bob, 14, 1, "#6f86ff");
    px(ctx, cx + 11, 36 + bob, 5, 5, "#a01313");       // sweeping boot
    px(ctx, cx + 11, 36 + bob, 5, 1, "#e05050");
    px(ctx, cx + 17, 40 + bob, 3, 2, "#8a7a5a");       // dust
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

// Wolverine painter: animalistic comic mask (yellow upper face, skin jaw,
// small feral eyes, blue horns), yellow/blue suit, claws on BOTH fists
// yellow/blue suit, claws on BOTH fists in every pose. Base stance is a
// hunched brawler crouch (knees bent, torso pitched forward, head low,
// both claw-fists up front) — never an upright Wesker copy. p.crouch is a
// normal deeper sink like every other fighter (shared drop variable).
function paintWolverine(ctx, p) {
  const cx = 18;
  if (p.lying) { paintLying(ctx, p.lk || 0, LY_X); return; }
  const bob = p.bob;
  const YB = "#e8a81c", YD = "#9a6a0a", BL = "#1c3faa", BD = "#10246a";
  const MSK = "#0b0b10", CLW = "#e8ecf4";
  // Triple adamantium claw: 3 parallel blades + white tip glint.
  const claw = (x, y, len, dx = 1) => {
    for (let i = 0; i < 3; i++) px(ctx, x, y + i * 2, len, 1, CLW);
    px(ctx, x, y, 1, 6, "#8a93a8"); // root shadow
    px(ctx, x + (dx > 0 ? len : -1), y, 1, 6, "#ffffff"); // tip glint
  };
  // Claw-fist: blue glove + knuckle ridge, claws jutting forward.
  const clawFist = (x, y, len, dx = 1) => {
    px(ctx, x - 1, y - 1, 6, 6, OUT);
    px(ctx, x, y, 4, 4, BL);
    px(ctx, x, y, 4, 1, "#6f86ff");
    claw(x + (dx > 0 ? 4 : -len), y - 1, len, dx);
  };
  // Hunch: bent knees + torso pitched forward. Applied to every grounded
  // neutral pose (idle/walk/guard) so the silhouette reads feral standing.
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
    // Block-retreat: bent knees but narrow walk-cycle feet (no wide sprawl).
    leg(ctx, cx - 6 + (p.legL || 0), 37 + bob, 9, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 1 + (p.legR || 0), 37 + bob, 9, BL, BD, "#0b0b10", "#3a3a4d");
  } else if (p.brace || hunch) {
    // Wide bent-knee base (brace for strikes, hunch for stance).
    leg(ctx, cx - 9 + (p.legL || 0), 37 + bob, 9, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 4 + (p.legR || 0), 37 + bob, 9, BL, BD, "#0b0b10", "#3a3a4d");
  } else {
    leg(ctx, cx - 6 + p.legL, 34 + bob, 12, BL, BD, "#0b0b10", "#3a3a4d");
    leg(ctx, cx + 1 + p.legR, 34 + bob, 12, BL, BD, "#0b0b10", "#3a3a4d");
  }
  ctx.save();
  ctx.translate(lean, drop);
  // Torso: yellow, pitched forward, slim tiger stripes on the shoulders.
  box(ctx, cx - 6, 20 + bob, 12, 15, YB);
  px(ctx, cx - 6, 20 + bob, 2, 15, "#f4dd9a"); // left rim light
  px(ctx, cx + 4, 20 + bob, 2, 15, YD);        // right shade
  px(ctx, cx - 6, 21 + bob, 1, 5, BD);         // slim shoulder stripes
  px(ctx, cx + 5, 21 + bob, 1, 5, BD);
  px(ctx, cx - 2, 24 + bob, 4, 3, BD);         // chest V
  px(ctx, cx - 7, 31 + bob, 14, 3, BD);        // belt
  px(ctx, cx - 1, 31 + bob, 3, 3, YB);
  // Head: ANIMALISTIC mask — yellow upper face, skin jaw, small feral
  // white eyes, blue horn fins. Hunched low-forward: sits 3px lower + 2px
  // ahead of an upright head (hunch kept).
  const hy = 10 + bob + (p.headBob || 0);
  const hx = cx - 3 + (hunch ? 2 : 0);
  box(ctx, hx - 5, hy, 10, 9, "#e6b48c");
  px(ctx, hx + 3, hy, 2, 9, "#b98a63");          // face shade (light from left)
  px(ctx, hx - 5, hy, 10, 5, YB);                // yellow mask: upper face covered
  px(ctx, hx - 5, hy, 10, 1, "#f4dd9a");         // mask rim light
  px(ctx, hx - 5, hy + 4, 10, 1, MSK);           // mask lower edge (snarl line)
  px(ctx, hx - 5, hy + 1, 1, 3, MSK);             // black ear lines
  px(ctx, hx + 4, hy + 1, 1, 3, MSK);
  // Blue horns: thick fins jutting out-up from the mask sides.
  px(ctx, hx - 10, hy - 3, 6, 3, OUT);
  px(ctx, hx - 10, hy - 3, 5, 2, BL);
  px(ctx, hx - 10, hy - 3, 5, 1, "#6f86ff");
  px(ctx, hx + 4, hy - 3, 6, 3, OUT);
  px(ctx, hx + 5, hy - 3, 5, 2, BL);
  px(ctx, hx + 5, hy - 3, 5, 1, "#6f86ff");
  px(ctx, hx - 3, hy + 2, 2, 1, "#ffffff");      // small animalistic eyes, pure white
  px(ctx, hx + 1, hy + 2, 2, 1, "#ffffff");
  if (p.rageGlow) {
    px(ctx, hx - 3, hy + 2, 2, 1, "#ff3b1a");
    px(ctx, hx + 1, hy + 2, 2, 1, "#ff3b1a");
  }
  px(ctx, hx - 2, hy + 7, 4, 1, "#a87c58");    // mouth shadow (skin jaw)
  if (p.seize) {
    // Grab: both claw-fists shot forward at chest height.
    px(ctx, cx - 2, 22 + bob, 12, 4, OUT);
    px(ctx, cx - 1, 23 + bob, 10, 2, YB);
    clawFist(cx + 9, 21 + bob, 6, 1);
    clawFist(cx - 9, 23 + bob, 5, -1);
  } else if (p.guard === 1) {
    // Stand guard: crossed claws before the face (X-block).
    px(ctx, cx + 0, 16 + bob, 8, 14, OUT);
    px(ctx, cx + 1, 17 + bob, 6, 12, BL);
    claw(cx + 1, 18 + bob, 7, 1);
    claw(cx + 1, 24 + bob, 7, 1);
    claw(cx - 6, 20 + bob, 6, -1);
  } else if (p.guard === 2) {
    // Crouch guard: low X over the knees.
    px(ctx, cx - 8, 23 + bob, 15, 8, OUT);
    px(ctx, cx - 7, 24 + bob, 13, 2, BL);
    px(ctx, cx - 7, 28 + bob, 13, 2, BD);
    claw(cx - 7, 24 + bob, 6, 1);
    claw(cx + 5, 26 + bob, 6, 1);
  } else if (p.windup) {
    // Coiled: rear fist chambered low, lead claws raised high.
    px(ctx, cx - 9, 24 + bob, 7, 10, OUT);
    px(ctx, cx - 8, 25 + bob, 5, 8, BL);
    clawFist(cx - 8, 29 + bob, 5, -1);
    px(ctx, cx + 2, 14 + bob, 7, 12, OUT);
    px(ctx, cx + 3, 15 + bob, 5, 10, YB);
    clawFist(cx + 3, 12 + bob, 7, 1);
  } else if (p.slash) {
    // RIGHT-HAND forehand slash: lead arm fully extended toward +x, triple
    // arc streaks trailing behind on -x in purple/red (spin trails).
    px(ctx, cx + 4, 20 + bob, 12, 5, OUT);
    px(ctx, cx + 5, 21 + bob, 10, 3, YB);
    clawFist(cx + 15, 20 + bob, 9, 1);
    px(ctx, cx - 8, 18 + bob, 10, 2, "#8a3aff"); // purple arc streaks
    px(ctx, cx - 6, 21 + bob, 12, 1, "#ff3b1a"); // red arc streaks
    px(ctx, cx - 6, 24 + bob, 10, 1, "#8a3aff");
    // Rear (left) fist chambered low at the hip, claws tucked in.
    px(ctx, cx - 10, 24 + bob, 6, 8, OUT);
    px(ctx, cx - 9, 25 + bob, 4, 6, BL);
    px(ctx, cx - 9, 28 + bob, 4, 3, BL);
  } else if (p.cross) {
    // RIGHT-HAND backhand return: same arm ripped back across toward +x
    // (never a left-hand lead) — mirrored purple/red arcs mark the return.
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
    // Rising upper / diving double-claw: RIGHT fist overhead leading, LEFT
    // fist tucked at the chest — claws fanned, purple/red rise streaks.
    px(ctx, cx - 3, 8 + bob, 9, 13, OUT);
    px(ctx, cx - 2, 9 + bob, 7, 11, YB);
    clawFist(cx + 3, 5 + bob, 9, 1);   // right fist overhead, leading
    px(ctx, cx - 6, 22 + bob, 6, 8, OUT);
    px(ctx, cx - 5, 23 + bob, 4, 6, BL); // left fist chambered at chest
    px(ctx, cx - 8, 10 + bob, 3, 8, "#8a3aff"); // purple rise streaks
    px(ctx, cx + 9, 10 + bob, 3, 8, "#ff3b1a"); // red rise streaks
  } else if (p.tackle) {
    // Rush: shoulder dropped, RIGHT claws speared level, left claws back.
    px(ctx, cx + 0, 24 + bob, 13, 7, OUT);
    px(ctx, cx + 1, 25 + bob, 11, 5, YB);
    clawFist(cx + 12, 24 + bob, 9, 1);
    px(ctx, cx - 10, 24 + bob, 6, 9, OUT);
    px(ctx, cx - 9, 25 + bob, 4, 7, BL);
    clawFist(cx - 13, 24 + bob, 6, -1);
    px(ctx, cx - 8, 22 + bob, 8, 2, "#8a3aff"); // purple speed lines
    px(ctx, cx - 10, 26 + bob, 10, 1, "#ff3b1a"); // red speed lines
  } else {
    // Hunched neutral: BOTH claw-fists up front, elbows tucked, claws out.
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

// Gamma knockdown palette (green skin, purple pants).
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
  // Big bare feet (green = barefoot, no boots on this wall).
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
    // Stomp: one leg raised high, other planted wide.
    leg(ctx, cx - 10, 36 + bob, 10, PN, PD, feet[0], feet[1]);
    box(ctx, cx + 1, 28 + bob, 11, 6, PN); // raised thigh
    px(ctx, cx + 10, 29 + bob, 4, 5, GR);  // bare stomping foot
  } else {
    leg(ctx, cx - 10 + (p.legL || 0), 36 + bob, 10, PN, PD, feet[0], feet[1]);
    leg(ctx, cx + 4 + (p.legR || 0), 36 + bob, 10, PN, PD, feet[0], feet[1]);
  }
  ctx.save();
  ctx.translate(p.wind || 0, (p.crouch ? 7 : 0) + (p.dip || 0));
  // Torso: huge green mass, wide shoulders, torn purple waist.
  box(ctx, cx - 10, 18 + bob, 20, 16, GR);
  px(ctx, cx - 10, 18 + bob, 2, 16, LITE);  // left rim light
  px(ctx, cx + 8, 18 + bob, 2, 16, GD);     // right shade
  px(ctx, cx - 4, 21 + bob, 8, 2, GD);      // pec line
  px(ctx, cx - 1, 23 + bob, 2, 6, GD);      // ab line
  px(ctx, cx - 10, 31 + bob, 20, 3, PN);    // torn pants waist
  px(ctx, cx - 10, 31 + bob, 20, 1, "#7c4dc0");
  // Head: small, low between the traps. Flat-top black hair, heavy brow.
  const hy = 8 + bob + (p.headBob || 0);
  const hx = cx - 1;
  box(ctx, hx - 5, hy, 10, 8, GR);
  px(ctx, hx - 5, hy, 10, 2, "#0b0b10");    // flat-top hair
  px(ctx, hx - 5, hy + 4, 10, 1, GD);       // brow ridge shadow
  px(ctx, hx - 3, hy + 5, 2, 2, "#ffffff"); // angry eyes
  px(ctx, hx + 1, hy + 5, 2, 2, "#ffffff");
  if (p.rageGlow) {
    px(ctx, hx - 3, hy + 5, 2, 2, "#ff3b1a");
    px(ctx, hx + 1, hy + 5, 2, 2, "#ff3b1a");
  }
  px(ctx, hx - 2, hy + 7, 5, 1, "#144014"); // snarl mouth
  // Fist helper: big 6x6 green knuckle block.
  const fist = (x, y) => {
    px(ctx, x - 1, y - 1, 8, 8, OUT);
    px(ctx, x, y, 6, 6, GR);
    px(ctx, x, y, 6, 2, LITE);
    px(ctx, x, y + 4, 3, 2, GD);
  };
  if (p.seize) {
    // Grab: both arms shot forward wide at chest height.
    px(ctx, cx - 4, 22 + bob, 16, 5, OUT);
    px(ctx, cx - 3, 23 + bob, 14, 3, GR);
    fist(cx + 10, 21 + bob);
    fist(cx - 16, 21 + bob);
  } else if (p.guard === 1) {
    // Stand guard: massive forearms crossed into an X-wall.
    px(ctx, cx - 10, 16 + bob, 20, 14, OUT);
    px(ctx, cx - 9, 17 + bob, 18, 5, GR);
    px(ctx, cx - 9, 24 + bob, 18, 5, GD);
    fist(cx + 8, 16 + bob);
    fist(cx - 14, 23 + bob);
  } else if (p.guard === 2) {
    // Crouch guard: low X over the knees.
    px(ctx, cx - 11, 26 + bob, 22, 10, OUT);
    px(ctx, cx - 10, 27 + bob, 20, 3, GR);
    px(ctx, cx - 10, 32 + bob, 20, 3, GD);
    fist(cx - 14, 26 + bob);
    fist(cx + 8, 31 + bob);
  } else if (p.windup) {
    // Coiled: right fist dragged back low, left arm high guard.
    px(ctx, cx - 12, 26 + bob, 7, 10, OUT);
    px(ctx, cx - 11, 27 + bob, 5, 8, GD);
    fist(cx - 14, 30 + bob);
    px(ctx, cx + 5, 14 + bob, 7, 10, OUT);
    px(ctx, cx + 6, 15 + bob, 5, 8, GR);
    fist(cx + 5, 12 + bob);
  } else if (p.smash) {
    // Overhead forehand smash: right arm fully extended up-forward.
    px(ctx, cx + 2, 4 + bob, 8, 16, OUT);
    px(ctx, cx + 3, 5 + bob, 6, 14, GR);
    fist(cx + 2, 2 + bob);
    px(ctx, cx - 12, 24 + bob, 7, 10, OUT); // left arm back low
    px(ctx, cx - 11, 25 + bob, 5, 8, GD);
    fist(cx - 13, 28 + bob);
  } else if (p.backhand) {
    // Backhand return: left arm ripped across the chest toward +x.
    px(ctx, cx - 12, 20 + bob, 24, 6, OUT);
    px(ctx, cx - 11, 21 + bob, 22, 4, GR);
    fist(cx + 10, 19 + bob);
    px(ctx, cx + 2, 10 + bob, 7, 10, OUT); // right arm raised for the next smash
    px(ctx, cx + 3, 11 + bob, 5, 8, GD);
  } else if (p.quake) {
    // Seismic slam: BOTH fists overhead, coming down as one wall.
    px(ctx, cx - 8, 2 + bob, 7, 17, OUT);
    px(ctx, cx - 7, 3 + bob, 5, 15, GD);
    fist(cx - 8, 0 + bob);
    px(ctx, cx + 1, 2 + bob, 7, 17, OUT);
    px(ctx, cx + 2, 3 + bob, 5, 15, GR);
    fist(cx + 0, 0 + bob);
  } else if (p.stomp) {
    // Stomp balance: arms flung wide while the leg comes down.
    px(ctx, cx - 16, 20 + bob, 7, 6, OUT);
    px(ctx, cx - 15, 21 + bob, 5, 4, GD);
    fist(cx - 17, 19 + bob);
    px(ctx, cx + 9, 20 + bob, 7, 6, OUT);
    px(ctx, cx + 10, 21 + bob, 5, 4, GR);
    fist(cx + 10, 19 + bob);
  } else if (p.tackle) {
    // Gamma Charge: shoulder first, head tucked, arms swept back.
    px(ctx, cx + 2, 20 + bob, 14, 10, OUT);
    px(ctx, cx + 3, 21 + bob, 12, 8, GR);
    px(ctx, cx + 12, 22 + bob, 5, 6, LITE); // lead shoulder cap
    px(ctx, cx - 12, 24 + bob, 8, 6, OUT);
    px(ctx, cx - 11, 25 + bob, 6, 4, GD);
    fist(cx - 15, 24 + bob);
    px(ctx, cx - 9, 20 + bob, 12, 3, GD);   // speed creases
  } else if (p.inhale) {
    // Thunder Clap windup: chest swelled, arms spread wide back.
    px(ctx, cx - 16, 20 + bob, 8, 8, OUT);
    px(ctx, cx - 15, 21 + bob, 6, 6, GD);
    fist(cx - 17, 20 + bob);
    px(ctx, cx + 8, 20 + bob, 8, 8, OUT);
    px(ctx, cx + 9, 21 + bob, 6, 6, GR);
    fist(cx + 9, 20 + bob);
    px(ctx, cx - 4, 22 + bob, 8, 4, LITE); // swelled chest glint
  } else if (p.shout) {
    // Thunder Clap: both palms smashed together dead center.
    px(ctx, cx - 6, 20 + bob, 20, 8, OUT);
    px(ctx, cx - 5, 21 + bob, 8, 6, GD);
    px(ctx, cx + 3, 21 + bob, 8, 6, GR);
    fist(cx - 2, 20 + bob);
    fist(cx + 0, 20 + bob);
    px(ctx, cx - 4, 22 + bob, 2, 2, "#ffffff"); // clap flash core
    px(ctx, cx + 6, 22 + bob, 2, 2, "#ffffff");
  } else if (p.ascend) {
    // Worldbreaker lift: both arms straight up, victim overhead.
    px(ctx, cx - 8, 2 + bob, 6, 16, OUT);
    px(ctx, cx - 7, 3 + bob, 4, 14, GD);
    fist(cx - 8, 0 + bob);
    px(ctx, cx + 2, 2 + bob, 6, 16, OUT);
    px(ctx, cx + 3, 3 + bob, 4, 14, GR);
    fist(cx + 1, 0 + bob);
  } else {
    // Neutral: two hanging wrecking balls, knuckles nearly scraping.
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

// Feral knockdown palette (yellow/blue suit).
const LY_X = Object.freeze({
  torso: "#e8a81c", rim: "#f4dd9a", pants: "#1c3faa", shade: "#10246a",
  skin: "#e6b48c", hair: "#0b0b10", eye: "#ffffff", eyeHi: "#ff3b1a",
  boot: "#0b0b10", bootHi: "#3a3a4d", cape: null, belt: "#10246a",
});

// Pose table: subtle numbers => smooth idle/walk without extra assets.
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
      // M8 normals: palm(6) elbow(7) backfist(8) cobra(9) hook(10) sweep(11).
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, palm: 1, wind: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 1, punch: 0, kick: 0, elbow: 1, wind: 2, dip: 2 },
      { bob: 0, headBob: 1, legL: -1, legR: 2, armSwing: 0, capeWave: 2, coatSway: 1, punch: 0, kick: 0, backfist: 1, wind: 2 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, cobra: 1, wind: 5, dip: 2, brace: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 2, armSwing: 0, capeWave: -2, coatSway: -1, punch: 0, kick: 0, hook: 1, wind: 2, brace: 1 },
      { bob: 0, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, sweep: 1, crouch: 1 },
      // 12: SAMURAI EDGE — leveled pistol, both hands extended (post-M14.5).
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, gun: 1, wind: 1, brace: 1 },
      // Crouch + air kit: folded legs under low strikes, tucked legs airborne.
      // Cloth streams with the motion (coat/cape physics read from these).
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: -1, punch: 0, kick: 0, palm: 1, crouch: 1, dip: 1 }, // 13 crouch palm
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 1, kick: 0, crouch: 1 }, // 14 crouch jab
      { bob: 0, headBob: 1, legL: -2, legR: 2, armSwing: 0, capeWave: 1, coatSway: 0, punch: 0, kick: 0, sweep: 1, crouch: 1, brace: 1 }, // 15 crouch sweep
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: -2, capeWave: 4, coatSway: 3, punch: 0, kick: 2, air: 1 }, // 16 air kick, cloth up
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 3, coatSway: 2, punch: 0, kick: 0, slam: 1, wind: 2, air: 1 }, // 17 air slam
      // 18-23 Wolverine claw kit: slash / cross / low rake / dive / air slash / air dive.
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, slash: 1, wind: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, cross: 1, wind: 2, dip: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, slash: 1, crouch: 1, crouchSlash: 1 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, dive: 1, wind: 4, dip: 2, brace: 1 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: -2, capeWave: 0, coatSway: 0, punch: 0, kick: 0, slash: 1, air: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, dive: 1, wind: 2, air: 1 },
      // 24-30 Hulk gamma kit: smash / backhand / low stomp / quake slam /
      // crouch stomp / air smash / air quake.
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, smash: 1, wind: 2, dip: 2, brace: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, backhand: 1, wind: 2, brace: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, stomp: 1, crouch: 1, brace: 1 },
      { bob: 1, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, quake: 1, wind: 4, dip: 3, brace: 1 },
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, stomp: 1, crouch: 1, dip: 1 },
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: -2, capeWave: 0, coatSway: 0, punch: 0, kick: 0, smash: 1, air: 1 },
      { bob: 0, headBob: 1, legL: -1, legR: 1, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, quake: 1, wind: 2, air: 1 },
    ],
    // M2 poses. Every entry carries the full field set (missing fields read
    // as `undefined`, which is falsy — safe for the stance branches above).
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
    // Jump lifecycle: 0 anticipation crouch, 1 rise (cloth billowing up),
    // 2 apex hang, 3 fall, 4 fast-fall flutter (cloth streams behind).
    // currentFrame picks by vy (see fighter.js) — that IS the cloth physics
    // read: rise/fall speed selects the cloth variant every frame.
    jump: [
      { bob: 0, headBob: 1, legL: 0, legR: 0, armSwing: -2, capeWave: 1, coatSway: 1, punch: 0, kick: 0, crouch: 1, air: 0, dash: 0 }, // anticip
      { bob: 0, headBob: -1, legL: 0, legR: 0, armSwing: -2, capeWave: 4, coatSway: 3, punch: 0, kick: 0, crouch: 0, air: 1, dash: 0 }, // rise
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: 2, coatSway: 2, punch: 0, kick: 0, crouch: 0, air: 1, dash: 0 },  // hang
      { bob: 0, headBob: 1, legL: 0, legR: 0, armSwing: 1, capeWave: -2, coatSway: -1, punch: 0, kick: 0, crouch: 0, air: 2, dash: 0 },  // fall
      { bob: 1, headBob: 1, legL: 0, legR: 0, armSwing: 2, capeWave: -4, coatSway: -3, punch: 0, kick: 0, crouch: 0, air: 2, dash: 0 },  // fast fall
    ],
    dash: [
      { bob: 0, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: -3, coatSway: -2, punch: 0, kick: 0, crouch: 0, air: 0, dash: 1 },
      { bob: 1, headBob: 0, legL: 0, legR: 0, armSwing: 0, capeWave: -2, coatSway: -1, punch: 0, kick: 0, crouch: 0, air: 0, dash: 1 },
    ],
    // M4 guard stances: stand guard (braced, leaned back) + crouch guard
    // + stand-guard retreat (walk-cycle legs, played slow + reversed).
    block: [
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, guard: 1, brace: 1, wind: -1 },
      { bob: 0, headBob: 1, legL: 0, legR: 0, armSwing: 0, capeWave: 0, coatSway: 0, punch: 0, kick: 0, guard: 2, crouch: 1 },
      { bob: 0, headBob: 0, legL: -2, legR: 2, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, guard: 1, guardWalk: 1, brace: 0, wind: -1 },
      { bob: 0, headBob: 0, legL: 2, legR: -2, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, guard: 1, guardWalk: 1, brace: 0, wind: -1 },
    ],
    // M6 grab reach: driven forward onto braced legs, arms extended.
    grab: [
      { bob: 0, headBob: 0, legL: -1, legR: 1, armSwing: 0, capeWave: -3, coatSway: -2, punch: 0, kick: 0, seize: 1, brace: 1, wind: 3 },
    ],
    // M10 Wesker specials: jaguar tackle + unmasked rage stand. (Homelander
    // builds the same table but never displays it — unknown flags fall
    // through to neutral arms, so the shared builder stays total.)
    // M11 Homelander specials: heat-vision gaze (2) + sonic scream (3).
    // (Wesker builds them too; never displayed — same fallthrough deal.)
    // 4-9: new super beats — unmaskMid / leap / hover (Wesker O),
    // charge / inhale / ascend (Homelander). Shared table, fallthrough-safe.
    // 10: Wesker O carry — missile gripped overhead on the way down.
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
    // Effort: strain (Homelander's throw-toss grimace).
    strain: [
      { bob: 0, headBob: 1, legL: -1, legR: 2, armSwing: 0, capeWave: -1, coatSway: -1, punch: 0, kick: 0, strain: 1, brace: 1, wind: 1, dip: 2 },
    ],
    // Knockdown: 12 frames — 0 stagger, 1 tip, 2 collapse, 3 slam, 4-7
    // flat-out (head on the floor), 8 push-up, 9 kneel, 10 crouch, 11 rise.
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
  const paint = kind === "wesker" ? paintWesker : kind === "wolverine" ? paintWolverine : kind === "hulk" ? paintHulk : paintHomelander;
  const out = {}; // keys follow the pose table, so new states need no extra code
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

// Empty pixel rows below the boot bottoms in grounded stances (boots end on
// row 48 of the 52-tall canvas). Fighter.draw offsets by this so feet sit
// exactly on the ground plane instead of floating above it.
export const FEET_PAD = 4;

// Big readable portrait for character-select cards (head zoom, still pixelated).
export function buildPortrait(kind) {
  const sprites = buildSprites(kind);
  const src = sprites.idle[0];
  const [c, ctx] = makeCanvas(32, 32);
  // Crop head area (x 10..26, y 4..20) and scale up 2x with smoothing off.
  ctx.drawImage(src, 10, 4, 16, 16, 0, 0, 32, 32);
  return c;
}
