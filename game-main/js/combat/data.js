import { CHARACTERS } from "../characters/data.js";
import { isCustomKind } from "../characters/custom.js";

export const BASE_HP = 100;



const base = (o) => Object.freeze({
  startup: 0.10,
  active: 0.08,
  recovery: 0.16,
  damage: 5,
  hitstun: 0.35,
  hitstop: 0.05,
  knockback: 260,
  lunge: 26,
  chainTo: null,
  level: "mid",

  blockstun: 0.25,
  blockPush: 320,
  chip: 0,
  hit: Object.freeze({ w: 78, top: 120, h: 70 }),
  ...o,
});

// Custom-fighter normals: heavier, slower jab chains than Wesker's
// speedster boxing. Tier stat multipliers are applied on top in movesFor.
const CUSTOM_BASE = Object.freeze({
  light1: base({
    startup: 0.16, active: 0.09, recovery: 0.28, damage: 6,
    hitstun: 0.34, hitstop: 0.06, knockback: 300, lunge: 26, chainTo: "light2",
    blockstun: 0.22, blockPush: 340,
  }),
  light2: base({
    startup: 0.15, active: 0.09, recovery: 0.26, damage: 7,
    hitstun: 0.38, hitstop: 0.06, knockback: 330, lunge: 30, chainTo: "light3",
    blockstun: 0.24, blockPush: 370,
  }),
  light3: base({
    startup: 0.20, active: 0.10, recovery: 0.34, damage: 11,
    hitstun: 0.52, hitstop: 0.09, knockback: 520, lunge: 36,
    level: "high", blockstun: 0.30, blockPush: 440,
  }),
  heavy: base({
    startup: 0.26, active: 0.10, recovery: 0.48, damage: 18,
    hitstun: 0.66, hitstop: 0.12, knockback: 700, lunge: 62,
    level: "mid", blockstun: 0.50, blockPush: 620,
  }),
  crouchLight: base({
    startup: 0.15, active: 0.09, recovery: 0.26, damage: 6,
    hitstun: 0.36, hitstop: 0.05, knockback: 320, lunge: 20,
    level: "low", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 80, top: 64, h: 52 }),
  }),
  airLight: base({
    startup: 0.14, active: 0.10, recovery: 0.24, damage: 7,
    hitstun: 0.36, hitstop: 0.05, knockback: 340, lunge: 30,
    level: "mid", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 80, top: 125, h: 75 }),
  }),
  airHeavy: base({
    startup: 0.24, active: 0.10, recovery: 0.40, damage: 13,
    hitstun: 0.58, hitstop: 0.10, knockback: 560, lunge: 44,
    level: "mid", blockstun: 0.36, blockPush: 520,
    hit: Object.freeze({ w: 88, top: 135, h: 85 }),
  }),
});

export const WESKER_BASE = Object.freeze({
  // Jab is deliberate and punishable so the rest of the chain can be fast:
  // L1 winds up, then L2 and L3 snap out far quicker than anything else in the
  // game. L3's recovery is the shortest in the roster.
  light1: base({
    startup: 0.13, active: 0.075, recovery: 0.20, damage: 5,
    hitstun: 0.32, hitstop: 0.05, knockback: 240, lunge: 24, chainTo: "light2",
    blockstun: 0.20, blockPush: 280,
  }),
  light2: base({
    startup: 0.075, active: 0.055, recovery: 0.085, damage: 6,
    hitstun: 0.38, hitstop: 0.06, knockback: 280, lunge: 28, chainTo: "light3",
    blockstun: 0.24, blockPush: 320,
  }),
  light3: base({
    startup: 0.05, active: 0.05, recovery: 0.045, damage: 8,
    hitstun: 0.48, hitstop: 0.07, knockback: 400, lunge: 32,
    level: "high", blockstun: 0.32, blockPush: 420,
  }),
  heavy: base({
    startup: 0.18, active: 0.08, recovery: 0.36, damage: 15,
    hitstun: 0.62, hitstop: 0.11, knockback: 640, lunge: 55,
    level: "mid", blockstun: 0.50, blockPush: 600,
    hit: Object.freeze({ w: 88, top: 120, h: 70 }),
  }),

  crouchLight: base({
    startup: 0.11, active: 0.08, recovery: 0.22, damage: 5,
    hitstun: 0.36, hitstop: 0.05, knockback: 300, lunge: 20,
    level: "low", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 80, top: 64, h: 52 }),
  }),

  airLight: base({
    startup: 0.10, active: 0.10, recovery: 0.20, damage: 6,
    hitstun: 0.36, hitstop: 0.05, knockback: 320, lunge: 30,
    level: "mid", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 80, top: 125, h: 75 }),
  }),
  airHeavy: base({
    startup: 0.16, active: 0.10, recovery: 0.30, damage: 10,
    hitstun: 0.55, hitstop: 0.09, knockback: 520, lunge: 40,
    level: "mid", blockstun: 0.34, blockPush: 480,
    hit: Object.freeze({ w: 88, top: 135, h: 85 }),
  }),

  gun: base({
    startup: 0.14, active: 0.08, recovery: 0.40, damage: 0.5,
    hitstun: 0.45, hitstop: 0.07, knockback: 380, lunge: 0,
    level: "mid", blockstun: 0.30, blockPush: 420, chip: 0,
    gamble: Object.freeze({ chance: 0.02 }),
    noRage: true,
    ray: Object.freeze({ len: 550, top: 140, h: 40 }),
  }),
});

export const HOMELANDER_BASE = Object.freeze({
  light1: base({
    startup: 0.10, active: 0.08, recovery: 0.18, damage: 6,
    hitstun: 0.38, hitstop: 0.06, knockback: 300, lunge: 26, chainTo: "light2",
    blockstun: 0.24, blockPush: 340,
  }),
  light2: base({
    startup: 0.14, active: 0.08, recovery: 0.22, damage: 7,
    hitstun: 0.44, hitstop: 0.07, knockback: 360, lunge: 30, chainTo: "light3",
    blockstun: 0.28, blockPush: 400,
  }),
  light3: base({
    startup: 0.16, active: 0.10, recovery: 0.30, damage: 9,
    hitstun: 0.52, hitstop: 0.08, knockback: 460, lunge: 32,
    level: "low", blockstun: 0.30, blockPush: 440,
  }),

  crouchLight: base({
    startup: 0.12, active: 0.08, recovery: 0.22, damage: 6,
    hitstun: 0.38, hitstop: 0.05, knockback: 320, lunge: 20,
    level: "low", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 80, top: 64, h: 52 }),
  }),
  crouchSweep: base({
    startup: 0.17, active: 0.10, recovery: 0.32, damage: 9,
    hitstun: 0.52, hitstop: 0.08, knockback: 480, lunge: 26,
    level: "low", blockstun: 0.30, blockPush: 440,
    hit: Object.freeze({ w: 88, top: 64, h: 52 }),
  }),

  airLight: base({
    startup: 0.11, active: 0.10, recovery: 0.22, damage: 7,
    hitstun: 0.40, hitstop: 0.06, knockback: 340, lunge: 30,
    level: "mid", blockstun: 0.26, blockPush: 360,
    hit: Object.freeze({ w: 80, top: 125, h: 75 }),
  }),
  airHeavy: base({
    startup: 0.18, active: 0.10, recovery: 0.32, damage: 11,
    hitstun: 0.58, hitstop: 0.09, knockback: 540, lunge: 40,
    level: "mid", blockstun: 0.36, blockPush: 500,
    hit: Object.freeze({ w: 88, top: 135, h: 85 }),
  }),

});

export const WOLVERINE_BASE = Object.freeze({
  light1: base({
    startup: 0.08, active: 0.06, recovery: 0.12, damage: 5,
    hitstun: 0.30, hitstop: 0.05, knockback: 220, lunge: 22, chainTo: "light2",
    blockstun: 0.18, blockPush: 260, chip: 1, bleed: 1,
    hit: Object.freeze({ w: 64, top: 120, h: 68 }),
  }),
  light2: base({
    startup: 0.10, active: 0.06, recovery: 0.16, damage: 6,
    hitstun: 0.36, hitstop: 0.06, knockback: 260, lunge: 24, chainTo: "light3",
    blockstun: 0.20, blockPush: 300, chip: 1, bleed: 1,
    hit: Object.freeze({ w: 66, top: 120, h: 68 }),
  }),
  light3: base({
    startup: 0.14, active: 0.08, recovery: 0.28, damage: 9,
    hitstun: 0.50, hitstop: 0.08, knockback: 440, lunge: 28,
    level: "low", blockstun: 0.28, blockPush: 420, chip: 2, bleed: 1,
    hit: Object.freeze({ w: 70, top: 64, h: 52 }),
  }),
  heavy: base({
    startup: 0.16, active: 0.08, recovery: 0.34, damage: 14,
    hitstun: 0.60, hitstop: 0.10, knockback: 600, lunge: 48,
    level: "mid", blockstun: 0.44, blockPush: 560, chip: 3, bleed: 1,
    hit: Object.freeze({ w: 72, top: 120, h: 70 }),
  }),
  crouchLight: base({
    startup: 0.10, active: 0.08, recovery: 0.20, damage: 5,
    hitstun: 0.34, hitstop: 0.05, knockback: 280, lunge: 20,
    level: "low", blockstun: 0.22, blockPush: 320, chip: 1, bleed: 1,
    hit: Object.freeze({ w: 70, top: 64, h: 52 }),
  }),
  airLight: base({
    startup: 0.09, active: 0.10, recovery: 0.20, damage: 6,
    hitstun: 0.36, hitstop: 0.05, knockback: 300, lunge: 30,
    level: "mid", blockstun: 0.22, blockPush: 320, chip: 1, bleed: 1,
    hit: Object.freeze({ w: 68, top: 125, h: 75 }),
  }),
  airHeavy: base({
    startup: 0.15, active: 0.10, recovery: 0.30, damage: 10,
    hitstun: 0.54, hitstop: 0.09, knockback: 500, lunge: 40,
    level: "mid", blockstun: 0.32, blockPush: 460, chip: 2, bleed: 1,
    hit: Object.freeze({ w: 74, top: 135, h: 85 }),
  }),
});

export const HULK_BASE = Object.freeze({
  light1: base({
    startup: 0.14, active: 0.08, recovery: 0.22, damage: 6,
    hitstun: 0.44, hitstop: 0.07, knockback: 340, lunge: 26, chainTo: "light2",
    blockstun: 0.28, blockPush: 380,
    hit: Object.freeze({ w: 84, top: 130, h: 80 }),
  }),
  light2: base({
    startup: 0.16, active: 0.08, recovery: 0.26, damage: 7,
    hitstun: 0.50, hitstop: 0.08, knockback: 400, lunge: 28, chainTo: "light3",
    blockstun: 0.32, blockPush: 440,
    hit: Object.freeze({ w: 86, top: 130, h: 80 }),
  }),
  light3: base({
    startup: 0.18, active: 0.10, recovery: 0.32, damage: 9,
    hitstun: 0.56, hitstop: 0.09, knockback: 500, lunge: 28,
    level: "low", blockstun: 0.34, blockPush: 480,
    hit: Object.freeze({ w: 86, top: 70, h: 56 }),
  }),
  heavy: base({
    startup: 0.26, active: 0.10, recovery: 0.42, damage: 15,
    hitstun: 0.70, hitstop: 0.12, knockback: 700, lunge: 45,
    level: "mid", blockstun: 0.55, blockPush: 640,
    hit: Object.freeze({ w: 92, top: 140, h: 90 }),
  }),
  crouchLight: base({
    startup: 0.14, active: 0.08, recovery: 0.24, damage: 6,
    hitstun: 0.44, hitstop: 0.06, knockback: 360, lunge: 20,
    level: "low", blockstun: 0.28, blockPush: 380,
    hit: Object.freeze({ w: 86, top: 70, h: 56 }),
  }),
  airLight: base({
    startup: 0.13, active: 0.10, recovery: 0.24, damage: 7,
    hitstun: 0.44, hitstop: 0.06, knockback: 360, lunge: 30,
    level: "mid", blockstun: 0.28, blockPush: 380,
    hit: Object.freeze({ w: 86, top: 135, h: 85 }),
  }),
  airHeavy: base({
    startup: 0.20, active: 0.10, recovery: 0.34, damage: 11,
    hitstun: 0.60, hitstop: 0.10, knockback: 580, lunge: 40,
    level: "mid", blockstun: 0.38, blockPush: 520,
    hit: Object.freeze({ w: 92, top: 145, h: 95 }),
  }),
});

export const IRONMAN_BASE = Object.freeze({
  light1: base({
    startup: 0.11, active: 0.07, recovery: 0.16, damage: 5,
    hitstun: 0.34, hitstop: 0.05, knockback: 260, lunge: 24, chainTo: "light2",
    blockstun: 0.22, blockPush: 300,
    hit: Object.freeze({ w: 76, top: 120, h: 70 }),
  }),
  light2: base({
    startup: 0.13, active: 0.07, recovery: 0.20, damage: 6,
    hitstun: 0.38, hitstop: 0.06, knockback: 300, lunge: 26, chainTo: "light3",
    blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 78, top: 120, h: 70 }),
  }),
  light3: base({
    startup: 0.15, active: 0.09, recovery: 0.28, damage: 8,
    hitstun: 0.48, hitstop: 0.07, knockback: 420, lunge: 28,
    level: "low", blockstun: 0.30, blockPush: 420,
    hit: Object.freeze({ w: 80, top: 64, h: 52 }),
  }),
  heavy: base({
    startup: 0.22, active: 0.08, recovery: 0.38, damage: 12,
    hitstun: 0.58, hitstop: 0.10, knockback: 620, lunge: 40,
    level: "mid", blockstun: 0.45, blockPush: 560,
    hit: Object.freeze({ w: 84, top: 130, h: 80 }),
  }),
  crouchLight: base({
    startup: 0.12, active: 0.08, recovery: 0.22, damage: 5,
    hitstun: 0.34, hitstop: 0.05, knockback: 300, lunge: 20,
    level: "low", blockstun: 0.22, blockPush: 320,
    hit: Object.freeze({ w: 78, top: 64, h: 52 }),
  }),
  airLight: base({
    startup: 0.12, active: 0.10, recovery: 0.22, damage: 6,
    hitstun: 0.36, hitstop: 0.05, knockback: 320, lunge: 30,
    level: "mid", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 78, top: 125, h: 75 }),
  }),
  airHeavy: base({
    startup: 0.18, active: 0.10, recovery: 0.32, damage: 10,
    hitstun: 0.55, hitstop: 0.09, knockback: 520, lunge: 40,
    level: "mid", blockstun: 0.34, blockPush: 480,
    hit: Object.freeze({ w: 84, top: 135, h: 85 }),
  }),

  repulsor: base({
    startup: 0.12, active: 0.06, recovery: 0.75, damage: 5,
    hitstun: 0.35, hitstop: 0.05, knockback: 300, lunge: 0,
    level: "mid", blockstun: 0.22, blockPush: 320, chip: 1, heat: true,
    ray: Object.freeze({ len: 500, top: 122, h: 44 }),
  }),
});

export const THOR_BASE = Object.freeze({
  light1: base({
    startup: 0.11, active: 0.08, recovery: 0.18, damage: 6,
    hitstun: 0.38, hitstop: 0.06, knockback: 300, lunge: 26, chainTo: "light2",
    blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 80, top: 120, h: 72 }),
  }),
  light2: base({
    startup: 0.13, active: 0.08, recovery: 0.20, damage: 6,
    hitstun: 0.40, hitstop: 0.06, knockback: 320, lunge: 28, chainTo: "light3",
    blockstun: 0.26, blockPush: 360,
    hit: Object.freeze({ w: 80, top: 120, h: 72 }),
  }),
  light3: base({
    startup: 0.15, active: 0.09, recovery: 0.28, damage: 8,
    hitstun: 0.48, hitstop: 0.07, knockback: 440, lunge: 28,
    level: "low", blockstun: 0.30, blockPush: 420,
    hit: Object.freeze({ w: 82, top: 64, h: 52 }),
  }),
  heavy: base({
    startup: 0.24, active: 0.08, recovery: 0.40, damage: 14,
    hitstun: 0.62, hitstop: 0.11, knockback: 680, lunge: 42,
    level: "high", blockstun: 0.50, blockPush: 600,
    hit: Object.freeze({ w: 88, top: 130, h: 82 }),
  }),
  crouchLight: base({
    startup: 0.12, active: 0.08, recovery: 0.22, damage: 6,
    hitstun: 0.38, hitstop: 0.06, knockback: 320, lunge: 20,
    level: "low", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 80, top: 64, h: 52 }),
  }),
  airLight: base({
    startup: 0.12, active: 0.10, recovery: 0.22, damage: 7,
    hitstun: 0.40, hitstop: 0.06, knockback: 340, lunge: 30,
    level: "mid", blockstun: 0.26, blockPush: 360,
    hit: Object.freeze({ w: 80, top: 125, h: 75 }),
  }),
  airHeavy: base({
    startup: 0.18, active: 0.10, recovery: 0.32, damage: 11,
    hitstun: 0.58, hitstop: 0.10, knockback: 560, lunge: 40,
    level: "mid", blockstun: 0.36, blockPush: 500,
    hit: Object.freeze({ w: 88, top: 135, h: 85 }),
  }),

  hammer: base({
    startup: 0.14, active: 0.06, recovery: 0.75, damage: 6,
    hitstun: 0.40, hitstop: 0.06, knockback: 340, lunge: 0,
    level: "mid", blockstun: 0.26, blockPush: 360, chip: 1,
    ray: Object.freeze({ len: 450, top: 100, h: 60 }),
  }),
});

export const UROBOROS_BASE = Object.freeze({
  light1: base({
    startup: 0.12, active: 0.08, recovery: 0.20, damage: 8,
    hitstun: 0.42, hitstop: 0.07, knockback: 320, lunge: 34, chainTo: "light2",
    blockstun: 0.26, blockPush: 360,
    hit: Object.freeze({ w: 112, top: 120, h: 74 }),
  }),
  light2: base({
    startup: 0.14, active: 0.08, recovery: 0.22, damage: 9,
    hitstun: 0.46, hitstop: 0.07, knockback: 360, lunge: 36, chainTo: "light3",
    blockstun: 0.28, blockPush: 380,
    hit: Object.freeze({ w: 114, top: 120, h: 74 }),
  }),
  light3: base({
    startup: 0.16, active: 0.09, recovery: 0.30, damage: 11,
    hitstun: 0.52, hitstop: 0.08, knockback: 460, lunge: 36,
    level: "low", blockstun: 0.32, blockPush: 440,
    hit: Object.freeze({ w: 116, top: 64, h: 54 }),
  }),
  heavy: base({
    startup: 0.26, active: 0.09, recovery: 0.42, damage: 16,
    hitstun: 0.66, hitstop: 0.12, knockback: 720, lunge: 54,
    level: "high", blockstun: 0.55, blockPush: 640,
    hit: Object.freeze({ w: 126, top: 130, h: 84 }),
  }),
  crouchLight: base({
    startup: 0.13, active: 0.08, recovery: 0.24, damage: 8,
    hitstun: 0.42, hitstop: 0.06, knockback: 340, lunge: 28,
    level: "low", blockstun: 0.26, blockPush: 360,
    hit: Object.freeze({ w: 110, top: 64, h: 54 }),
  }),
  airLight: base({
    startup: 0.13, active: 0.10, recovery: 0.24, damage: 8,
    hitstun: 0.42, hitstop: 0.06, knockback: 340, lunge: 36,
    level: "mid", blockstun: 0.26, blockPush: 360,
    hit: Object.freeze({ w: 108, top: 125, h: 76 }),
  }),
  airHeavy: base({
    startup: 0.20, active: 0.10, recovery: 0.34, damage: 13,
    hitstun: 0.62, hitstop: 0.10, knockback: 600, lunge: 48,
    level: "mid", blockstun: 0.38, blockPush: 520,
    hit: Object.freeze({ w: 118, top: 135, h: 86 }),
  }),
});

export const SPIDERMAN_BASE = Object.freeze({
  light1: base({
    startup: 0.09, active: 0.07, recovery: 0.14, damage: 5,
    hitstun: 0.32, hitstop: 0.05, knockback: 240, lunge: 24, chainTo: "light2",
    blockstun: 0.20, blockPush: 280,
    hit: Object.freeze({ w: 68, top: 120, h: 68 }),
  }),
  light2: base({
    startup: 0.11, active: 0.07, recovery: 0.16, damage: 6,
    hitstun: 0.36, hitstop: 0.06, knockback: 280, lunge: 26, chainTo: "light3",
    blockstun: 0.22, blockPush: 320,
    hit: Object.freeze({ w: 70, top: 120, h: 68 }),
  }),
  light3: base({
    startup: 0.14, active: 0.09, recovery: 0.26, damage: 8,
    hitstun: 0.46, hitstop: 0.07, knockback: 420, lunge: 28,
    level: "low", blockstun: 0.28, blockPush: 400,
    hit: Object.freeze({ w: 72, top: 64, h: 52 }),
  }),
  heavy: base({
    startup: 0.20, active: 0.08, recovery: 0.36, damage: 12,
    hitstun: 0.58, hitstop: 0.10, knockback: 620, lunge: 42,
    level: "high", blockstun: 0.45, blockPush: 560,
    hit: Object.freeze({ w: 80, top: 130, h: 80 }),
  }),
  crouchLight: base({
    startup: 0.11, active: 0.08, recovery: 0.20, damage: 5,
    hitstun: 0.34, hitstop: 0.05, knockback: 280, lunge: 20,
    level: "low", blockstun: 0.22, blockPush: 320,
    hit: Object.freeze({ w: 70, top: 64, h: 52 }),
  }),
  airLight: base({
    startup: 0.09, active: 0.10, recovery: 0.18, damage: 6,
    hitstun: 0.36, hitstop: 0.05, knockback: 300, lunge: 34,
    level: "mid", blockstun: 0.22, blockPush: 320,
    hit: Object.freeze({ w: 70, top: 125, h: 75 }),
  }),
  airHeavy: base({
    startup: 0.15, active: 0.10, recovery: 0.28, damage: 10,
    hitstun: 0.54, hitstop: 0.09, knockback: 520, lunge: 44,
    level: "mid", blockstun: 0.32, blockPush: 460,
    hit: Object.freeze({ w: 78, top: 135, h: 85 }),
  }),
});

export const DOOM_BASE = Object.freeze({
  light1: base({
    startup: 0.10, active: 0.07, recovery: 0.16, damage: 5,
    hitstun: 0.34, hitstop: 0.05, knockback: 260, lunge: 24, chainTo: "light2",
    blockstun: 0.22, blockPush: 300,
    hit: Object.freeze({ w: 76, top: 120, h: 70 }),
  }),
  light2: base({
    startup: 0.12, active: 0.07, recovery: 0.18, damage: 6,
    hitstun: 0.38, hitstop: 0.06, knockback: 300, lunge: 26, chainTo: "light3",
    blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 78, top: 120, h: 70 }),
  }),
  light3: base({
    startup: 0.14, active: 0.09, recovery: 0.28, damage: 8,
    hitstun: 0.48, hitstop: 0.07, knockback: 420, lunge: 28,
    level: "low", blockstun: 0.30, blockPush: 420,
    hit: Object.freeze({ w: 80, top: 64, h: 52 }),
  }),
  heavy: base({
    startup: 0.22, active: 0.08, recovery: 0.38, damage: 13,
    hitstun: 0.60, hitstop: 0.10, knockback: 640, lunge: 40,
    level: "high", blockstun: 0.48, blockPush: 580,
    hit: Object.freeze({ w: 84, top: 130, h: 80 }),
  }),
  crouchLight: base({
    startup: 0.11, active: 0.08, recovery: 0.20, damage: 5,
    hitstun: 0.34, hitstop: 0.05, knockback: 280, lunge: 20,
    level: "low", blockstun: 0.22, blockPush: 320,
    hit: Object.freeze({ w: 76, top: 64, h: 52 }),
  }),
  airLight: base({
    startup: 0.10, active: 0.10, recovery: 0.20, damage: 6,
    hitstun: 0.36, hitstop: 0.05, knockback: 320, lunge: 32,
    level: "mid", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 76, top: 125, h: 75 }),
  }),
  airHeavy: base({
    startup: 0.16, active: 0.12, recovery: 0.30, damage: 11,
    hitstun: 0.56, hitstop: 0.09, knockback: 560, lunge: 44,
    level: "mid", blockstun: 0.40, blockPush: 540,
    hit: Object.freeze({ w: 84, top: 135, h: 85 }),
  }),
  photon: base({
    startup: 0.14, active: 0.06, recovery: 0.55, damage: 6,
    hitstun: 0.40, hitstop: 0.06, knockback: 340, lunge: 0,
    level: "mid", blockstun: 0.26, blockPush: 360, chip: 1, heat: true,
    ray: Object.freeze({ len: 450, top: 122, h: 44 }),
  }),
  snap: base({
    startup: 0.14, active: 0.06, recovery: 0.30, damage: 2.75,
    hitstun: 0.40, hitstop: 0.06, knockback: 380, lunge: 0,
    level: "mid", blockstun: 0.22, blockPush: 360, chip: 1, heat: true,
    hit: Object.freeze({ w: 0, top: 0, h: 0 }),
  }),
});

export const DOOM_SPECIALS = Object.freeze({
  // Free: no rage cost. Five orbs ring Doom and home in. Damage scales with how
  // long each orb was in flight, so a point-blank barrage hits like a truck and
  // a long-range one barely ticks.
  barrage: Object.freeze({
    cost: 0, maxRange: 900,
    startup: 0.22, orbs: 5, orbGap: 0.07, recover: 0.36,
    nearDmg: 14, farDmg: 4, fuseDmg: 2,
    nearDist: 220, farDist: 900,
    chip: 2, hitstun: 0.30, hitstop: 0.05, knockback: 260,
    blockstun: 0.18, blockPush: 220,
    orbLife: 1.6, orbSpeed: 470,
    ringR: 52, ringY: 118,
  }),
  // Doom blinks into a portal and a weakened Doom Bot rises in his place. The
  // bot has no specials and trades 10% hp and damage; killing it brings Doom
  // back through the portal.
  bot: Object.freeze({
    cost: 2, maxRange: 700,
    openPortal: 0.45, rise: 0.55, recover: 0.40,
    hpMult: 0.90, dmgMult: 0.90,
    botLife: 14.0,
  }),
  throne: Object.freeze({
    cost: 3, maxRange: 700,
    summon: 0.60, barrage: 2.00, meteorFall: 0.50, recover: 0.45,
    beamTicks: 5, beamDmg: 3, meteorDmg: 20, downTime: 1.00,
  }),
});

export function movesFor(kind) {
  const table = kind === "homelander" ? HOMELANDER_BASE
    : kind === "wolverine" ? WOLVERINE_BASE
    : kind === "hulk" ? HULK_BASE
    : kind === "ironman" ? IRONMAN_BASE
    : kind === "thor" ? THOR_BASE
    : kind === "spiderman" ? SPIDERMAN_BASE
    : kind === "doom" ? DOOM_BASE
    : kind === "uroboros" ? UROBOROS_BASE : kind === "cheatwesker" ? Object.freeze({
        ...WESKER_BASE,
        light2: Object.freeze({ ...WESKER_BASE.light2, chainTo: "heavy", chainWith: "heavy" }),
      }) : (isCustomKind(kind) ? CUSTOM_BASE : WESKER_BASE);
  const st = CHARACTERS[kind].stats;
  const out = {};
  for (const [k, v] of Object.entries(table)) {
    out[k] = {
      ...v,
      hit: { ...v.hit },
      startup: v.startup / st.attackSpeed,
      active: v.active / st.attackSpeed,
      recovery: v.recovery / st.attackSpeed,

      damage: k === "gun" ? v.damage : v.damage * st.damage,
    };
  }
  return out;
}

export const FRAME_FOR = Object.freeze({
  custom: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 6, recovery: 6 }),
    light2: Object.freeze({ startup: 4, active: 7, recovery: 7 }),
    light3: Object.freeze({ startup: 4, active: 8, recovery: 8 }),
    heavy: Object.freeze({ startup: 4, active: 9, recovery: 9 }),
    gun: Object.freeze({ startup: 4, active: 12, recovery: 12 }),
    crouchLight: Object.freeze({ startup: 4, active: 13, recovery: 13 }),
    airLight: Object.freeze({ startup: 4, active: 16, recovery: 16 }),
    airHeavy: Object.freeze({ startup: 4, active: 17, recovery: 17 }),
  }),
  wesker: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 6, recovery: 6 }),
    light2: Object.freeze({ startup: 4, active: 7, recovery: 7 }),
    light3: Object.freeze({ startup: 4, active: 8, recovery: 8 }),
    heavy: Object.freeze({ startup: 4, active: 9, recovery: 9 }),
    gun: Object.freeze({ startup: 4, active: 12, recovery: 12 }),
    crouchLight: Object.freeze({ startup: 4, active: 13, recovery: 13 }),
    airLight: Object.freeze({ startup: 4, active: 16, recovery: 16 }),
    airHeavy: Object.freeze({ startup: 4, active: 17, recovery: 17 }),
  }),
  homelander: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 0, recovery: 0 }),
    light2: Object.freeze({ startup: 4, active: 10, recovery: 10 }),
    light3: Object.freeze({ startup: 4, active: 11, recovery: 11 }),
    crouchLight: Object.freeze({ startup: 4, active: 14, recovery: 14 }),
    crouchSweep: Object.freeze({ startup: 4, active: 15, recovery: 15 }),
    airLight: Object.freeze({ startup: 4, active: 16, recovery: 16 }),
    airHeavy: Object.freeze({ startup: 4, active: 17, recovery: 17 }),
  }),
  wolverine: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 18, recovery: 18 }),
    light2: Object.freeze({ startup: 4, active: 19, recovery: 19 }),
    light3: Object.freeze({ startup: 4, active: 20, recovery: 20 }),
    heavy: Object.freeze({ startup: 4, active: 21, recovery: 21 }),
    crouchLight: Object.freeze({ startup: 4, active: 20, recovery: 20 }),
    airLight: Object.freeze({ startup: 4, active: 22, recovery: 22 }),
    airHeavy: Object.freeze({ startup: 4, active: 23, recovery: 23 }),
  }),

  hulk: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 24, recovery: 24 }),
    light2: Object.freeze({ startup: 4, active: 25, recovery: 25 }),
    light3: Object.freeze({ startup: 4, active: 26, recovery: 26 }),
    heavy: Object.freeze({ startup: 4, active: 27, recovery: 27 }),
    crouchLight: Object.freeze({ startup: 4, active: 28, recovery: 28 }),
    airLight: Object.freeze({ startup: 4, active: 29, recovery: 29 }),
    airHeavy: Object.freeze({ startup: 4, active: 30, recovery: 30 }),
  }),

  ironman: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 0, recovery: 0 }),
    light2: Object.freeze({ startup: 4, active: 2, recovery: 2 }),
    light3: Object.freeze({ startup: 4, active: 11, recovery: 11 }),
    heavy: Object.freeze({ startup: 4, active: 5, recovery: 5 }),
    repulsor: Object.freeze({ startup: 4, active: 31, recovery: 31 }),
    crouchLight: Object.freeze({ startup: 4, active: 14, recovery: 14 }),
    airLight: Object.freeze({ startup: 4, active: 16, recovery: 16 }),
    airHeavy: Object.freeze({ startup: 4, active: 17, recovery: 17 }),
  }),

  thor: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 35, recovery: 35 }),
    light2: Object.freeze({ startup: 4, active: 36, recovery: 36 }),
    light3: Object.freeze({ startup: 4, active: 37, recovery: 37 }),
    heavy: Object.freeze({ startup: 4, active: 38, recovery: 38 }),
    hammer: Object.freeze({ startup: 4, active: 39, recovery: 39 }),
    crouchLight: Object.freeze({ startup: 4, active: 37, recovery: 37 }),
    airLight: Object.freeze({ startup: 4, active: 16, recovery: 16 }),
    airHeavy: Object.freeze({ startup: 4, active: 38, recovery: 38 }),
  }),

  uroboros: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 44, recovery: 44 }),
    light2: Object.freeze({ startup: 4, active: 45, recovery: 45 }),
    light3: Object.freeze({ startup: 4, active: 46, recovery: 46 }),
    heavy: Object.freeze({ startup: 4, active: 47, recovery: 47 }),
    crouchLight: Object.freeze({ startup: 4, active: 46, recovery: 46 }),
    airLight: Object.freeze({ startup: 4, active: 44, recovery: 44 }),
    airHeavy: Object.freeze({ startup: 4, active: 47, recovery: 47 }),
  }),

  spiderman: Object.freeze({
    light1: Object.freeze({ startup: 54, active: 55, recovery: 55 }),
    light2: Object.freeze({ startup: 54, active: 56, recovery: 55 }),
    light3: Object.freeze({ startup: 54, active: 57, recovery: 57 }),
    heavy: Object.freeze({ startup: 54, active: 58, recovery: 55 }),
    crouchLight: Object.freeze({ startup: 54, active: 57, recovery: 57 }),
    airLight: Object.freeze({ startup: 59, active: 59, recovery: 56 }),
    airHeavy: Object.freeze({ startup: 60, active: 60, recovery: 58 }),
  }),

  doom: Object.freeze({
    light1: Object.freeze({ startup: 62, active: 63, recovery: 63 }),
    light2: Object.freeze({ startup: 62, active: 64, recovery: 63 }),
    light3: Object.freeze({ startup: 62, active: 64, recovery: 64 }),
    heavy: Object.freeze({ startup: 62, active: 65, recovery: 63 }),
    photon: Object.freeze({ startup: 62, active: 67, recovery: 67 }),
    snap: Object.freeze({ startup: 62, active: 68, recovery: 68 }),
    crouchLight: Object.freeze({ startup: 62, active: 64, recovery: 64 }),
    airLight: Object.freeze({ startup: 69, active: 69, recovery: 63 }),
    airHeavy: Object.freeze({ startup: 69, active: 66, recovery: 63 }),
  }),
});

export const RAGE = Object.freeze({
  MAX: 300,
  PER_LEVEL: 100,
  onDealHit: 14,
  onTakeHit: 10,
  onDealBlock: 8,
  onTakeBlock: 12,
});

export const GRAB = Object.freeze({
  startup: 0.12,
  active: 0.08,
  recover: 0.35,
  carry: 0.28,
  toss: 0.18,
  range: 95,
  lunge: 14,
  damage: 12,
  knockback: 520,
  tossUp: 300,
  stun: 0.55,
});

export const WESKER_SPECIALS = Object.freeze({
  jaguar: Object.freeze({
    cost: 1, maxRange: 500,
    startup: 0.25, dashTime: 0.25, dashSpeed: 1050, recover: 0.35,
    damage: 18.9, chip: 3, hitstun: 0.50, hitstop: 0.08, knockback: 650,
    blockstun: 0.40, blockPush: 550,
    hit: Object.freeze({ w: 80, top: 120, h: 72 }),
  }),
  phantom: Object.freeze({
    cost: 2, maxRange: 420,
    openTime: 0.12, strikeTime: 0.10, gapTime: 0.14, recover: 0.35,
    frames: Object.freeze([6, 7, 8, 9, 5]),
    sides: Object.freeze([1, -1, 1, -1, 1]),
    hit: Object.freeze({ w: 76, top: 125, h: 75 }),
    hits: Object.freeze([
      Object.freeze({ damage: 3, stun: 0.35, knock: 150, stop: 0.05, chip: 1 }),
      Object.freeze({ damage: 3, stun: 0.35, knock: 150, stop: 0.05, chip: 1 }),
      Object.freeze({ damage: 3, stun: 0.35, knock: 150, stop: 0.05, chip: 1 }),
      Object.freeze({ damage: 4, stun: 0.40, knock: 250, stop: 0.06, chip: 1 }),
      Object.freeze({ damage: 7, stun: 0.70, knock: 600, stop: 0.12, chip: 2, launch: 350 }),
    ]),
  }),
  ragemode: Object.freeze({
    cost: 3, maxRange: 500,

    transform: 1.10, strikeTime: 0.10, gapTime: 0.12, recoverAbort: 0.35,
    frames: Object.freeze([6, 7, 8, 9, 6, 7]),
    sides: Object.freeze([1, -1, 1, -1, 1, -1]),
    hit: Object.freeze({ w: 76, top: 125, h: 75 }),
    // Six blink strikes then the warhead: 5x3 + 5 = 20, plus 20 from the missile.
    frenzy: Object.freeze({ damage: 3, finisher: 5, stun: 0.32, knock: 120, stop: 0.04, chip: 1 }),
    rise: 0.50, aim: 0.35, drop: 0.50, recover: 0.45,
    missile: 20, missileChip: 4, missileStun: 0.60, missileStop: 0.18,
    missileKnock: 500, missileDown: 700,
  }),

  shadow: Object.freeze({
    cost: 0, maxRange: 9999,
    vanish: 0.10, shift: 0.06, reform: 0.16, dist: 320,
  }),
});

export const HOMELANDER_SPECIALS = Object.freeze({

  laser: Object.freeze({
    cost: 1, maxRange: 900,
    startup: 0.18, fire: 0.12, recover: 0.28,
    damage: 14, chip: 4, hitstun: 0.50, hitstop: 0.08, knockback: 400,
    blockstun: 0.35, blockPush: 450, level: "high",
    beamTop: 140, beamH: 14, beamLen: 700,
  }),

  scream: Object.freeze({
    cost: 2, maxRange: 300,
    startup: 0.35, active: 0.25, recover: 0.40,
    damage: 20, chip: 5, hitstun: 0.60, hitstop: 0.10, knockback: 700,
    blockstun: 0.45, blockPush: 600, level: "mid",
    radius: 170, top: 160,
  }),

  ragemode: Object.freeze({
    cost: 3, maxRange: 400,
    ascend: 0.65, carry: 0.50, lase: 0.80, recover: 0.40,
    tick: 5, ticks: 4, finale: 10, launchDown: 900,
  }),
});

export const WOLVERINE_SPECIALS = Object.freeze({
  rush: Object.freeze({
    cost: 1, maxRange: 450,
    startup: 0.20, dashTime: 0.22, dashSpeed: 1100, recover: 0.35,
    damage: 16, chip: 4, hitstun: 0.50, hitstop: 0.08, knockback: 600,
    blockstun: 0.38, blockPush: 520, bleed: 1, lowProfile: true,
    hit: Object.freeze({ w: 72, top: 110, h: 70 }),
  }),
  barrage: Object.freeze({
    cost: 2, maxRange: 400,
    openTime: 0.12, strikeTime: 0.09, gapTime: 0.12, recover: 0.35,
    frames: Object.freeze([18, 19, 18, 19, 21]),
    hit: Object.freeze({ w: 70, top: 125, h: 75 }),
    hits: Object.freeze([
      Object.freeze({ damage: 4, stun: 0.32, knock: 140, stop: 0.05, chip: 1, bleed: 1 }),
      Object.freeze({ damage: 4, stun: 0.32, knock: 140, stop: 0.05, chip: 1, bleed: 1 }),
      Object.freeze({ damage: 5, stun: 0.34, knock: 160, stop: 0.05, chip: 1, bleed: 1 }),
      Object.freeze({ damage: 6, stun: 0.38, knock: 240, stop: 0.06, chip: 1, bleed: 1 }),
      Object.freeze({ damage: 13, stun: 0.70, knock: 600, stop: 0.12, chip: 2, bleed: 1, launch: 350 }),
    ]),
  }),
  ragemode: Object.freeze({
    cost: 3, maxRange: 450,
    transform: 0.80, heal: 15, strikeTime: 0.10, gapTime: 0.12,
    recoverAbort: 0.35, recover: 0.45,
    frames: Object.freeze([18, 19, 20, 18, 19, 20]),
    sides: Object.freeze([1, -1, 1, -1, 1, -1]),
    hit: Object.freeze({ w: 70, top: 125, h: 75 }),
    frenzy: Object.freeze({ damage: 5, stun: 0.32, knock: 120, stop: 0.04, chip: 1, bleed: 1 }),
    shredTicks: 5, shred: 3, finale: 10, launchDown: 800,
  }),
});

export const HULK_SPECIALS = Object.freeze({
  gamma: Object.freeze({
    cost: 1, maxRange: 450,
    startup: 0.30, dashTime: 0.28, dashSpeed: 1000, recover: 0.40,
    damage: 22, chip: 4, hitstun: 0.60, hitstop: 0.10, knockback: 700,
    blockstun: 0.45, blockPush: 600,
    hit: Object.freeze({ w: 88, top: 130, h: 80 }),
  }),
  clap: Object.freeze({
    cost: 2, maxRange: 320,
    startup: 0.35, active: 0.25, recover: 0.45,
    damage: 24, chip: 6, hitstun: 0.65, hitstop: 0.11, knockback: 750,
    blockstun: 0.50, blockPush: 650, level: "mid",
    radius: 200, top: 180,
  }),
  breaker: Object.freeze({
    cost: 3, maxRange: 420,
    ascend: 0.50, shake: 0.60, recover: 0.45,
    tick: 5, ticks: 3, finale: 15, launchDown: 900,
  }),
});

export const IRONMAN_SPECIALS = Object.freeze({
  burst: Object.freeze({
    cost: 1, maxRange: 550,
    volleys: 3, volleyTime: 0.09, gapTime: 0.10, recover: 0.35,
    damage: 5, chip: 1, hitstun: 0.35, hitstop: 0.05, knockback: 300,
    blockstun: 0.22, blockPush: 320,
    rayTop: 122, rayH: 44, rayLen: 500,
  }),
  unibeam: Object.freeze({
    cost: 2, maxRange: 650,
    startup: 0.30, fire: 0.14, recover: 0.40,
    damage: 22, chip: 6, hitstun: 0.60, hitstop: 0.10, knockback: 500,
    blockstun: 0.45, blockPush: 550, level: "high",
    beamTop: 130, beamH: 44, beamLen: 650,
  }),
  shelling: Object.freeze({
    cost: 3, maxRange: 700,
    ascend: 0.50, volleys: 3, volleyGap: 0.35, fallTime: 0.50,
    volleyDmg: 8, volleyChip: 3, recover: 0.45,
  }),
});

export const THOR_SPECIALS = Object.freeze({
  storm: Object.freeze({
    cost: 1, maxRange: 480,
    startup: 0.22, outTime: 0.30, backTime: 0.32, recover: 0.35,
    speed: 900, backSpeed: 1100,
    damage: 8, chip: 2, hitstun: 0.45, hitstop: 0.07, knockback: 450,
    blockstun: 0.32, blockPush: 420, level: "mid",
    box: Object.freeze({ w: 60, h: 56, top: 110 }),
  }),
  lightning: Object.freeze({
    cost: 2, maxRange: 380,
    startup: 0.32, active: 0.22, recover: 0.42,
    damage: 22, chip: 6, hitstun: 0.62, hitstop: 0.10, knockback: 650,
    blockstun: 0.48, blockPush: 600, level: "mid",
    radius: 170, top: 220,
  }),
  godblast: Object.freeze({
    cost: 3, maxRange: 600,
    startup: 0.35, slamTime: 0.15, barrageTime: 4.0, ticks: 8, recover: 0.50,
    tickDmg: 5, tickChip: 2, tickStun: 0.45, tickStop: 0.06, tickKnock: 200,
    tickBlockstun: 0.35, tickPush: 300,
    radius: 150, top: 220,
  }),
});

export const UROBOROS_SPECIALS = Object.freeze({
  wrap: Object.freeze({
    cost: 1, maxRange: 220,
    startup: 0.20, carry: 0.30, raise: 0.35, tossTime: 0.15, recover: 0.40,
    range: 130, lunge: 30,
    damage: 18, chip: 0, hitstun: 0.60, hitstop: 0.10, knockback: 600,
    blockstun: 0, blockPush: 0,
  }),
  rock: Object.freeze({
    cost: 2, maxRange: 420,
    startup: 0.35, slamTime: 0.15, recover: 0.45,
    damage: 26, chip: 6, hitstun: 0.65, hitstop: 0.12, knockback: 750,
    blockstun: 0.50, blockPush: 650, level: "mid",
    zone: Object.freeze({ w: 170, h: 200, reach: 150 }),
  }),
  impale: Object.freeze({
    cost: 3, maxRange: 650,
    startup: 0.55, pullTime: 0.40, pierceTime: 1.25, slamTime: 0.25, recover: 0.60,
    range: 220, pullRange: 520, lunge: 0,
    pierce: 10, pierceStun: 0.60, pierceStop: 0.14, pierceKnock: 200,
    tickDmg: 5, ticks: 5, finale: 18, finaleStun: 0.80, finaleKnock: 750,
  }),
});

export const SPIDERMAN_SPECIALS = Object.freeze({
  webshot: Object.freeze({
    cost: 1, maxRange: 550,
    startup: 0.18, fire: 0.12, recover: 0.28,
    damage: 8, chip: 2, hitstun: 0.35, hitstop: 0.06, knockback: 300,
    blockstun: 0.22, blockPush: 320, level: "mid",
    webRoot: 0.7,
    rayTop: 122, rayH: 44, rayLen: 500,
  }),
  yank: Object.freeze({
    cost: 2, maxRange: 420,
    startup: 0.20, carry: 0.22, tossTime: 0.15, recover: 0.40,
    range: 220, lunge: 30,
    damage: 14, chip: 0, hitstun: 0.55, hitstop: 0.09, knockback: 550,
    blockstun: 0, blockPush: 0,
  }),
  maelstrom: Object.freeze({
    cost: 3, maxRange: 450,
    transform: 0.80, strikeTime: 0.10, gapTime: 0.12,
    recoverAbort: 0.35, recover: 0.45,
    frames: Object.freeze([55, 56, 59, 57, 60, 58]),
    sides: Object.freeze([1, -1, 1, -1, 1, -1]),
    hit: Object.freeze({ w: 72, top: 125, h: 75 }),
    frenzy: Object.freeze({ damage: 5, stun: 0.32, knock: 120, stop: 0.04, chip: 1 }),
    finale: 12, finaleStun: 0.70, finaleKnock: 600, finaleLaunch: 350,
  }),
  zip: Object.freeze({
    costPts: 50, maxRange: 9999,
    crouch: 0.06, swing: 0.22, reform: 0.12, dist: 280, cooldown: 0.60,
  }),
  swing: Object.freeze({
    cooldown: 0.90, shoot: 0.08, swing: 0.45, travel: 220, dip: 70,
  }),
});

export const REGEN = Object.freeze({ delay: 2.5, rate: 2.0 });

// Half Wolverine's rate, but with a short enough delay to matter in a round:
// ~9 HP back after ten seconds off, versus none at all before.
export const WESKER_REGEN = Object.freeze({ delay: 3.0, rate: 1.0 });

export const UROBOROS_REGEN = Object.freeze({ delay: 3.5, rate: 1.0 });

export const BLEED = Object.freeze({ ticks: 3, per: 1, interval: 0.65 });

export const DECAY = Object.freeze({ ticks: 6, per: 5, interval: 0.7 });

