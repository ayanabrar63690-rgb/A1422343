// M3 frame data: every attack's startup / active / recovery, damage, stun,
// hitstop, knockback, reach, and combo routing live HERE — never scattered
// as magic numbers in fighter logic. M7 adds per-character damage/speed
// multipliers on top; M8 re-maps animations and adds specials.
import { CHARACTERS } from "../characters/data.js";

export const BASE_HP = 100;

const base = (o) => Object.freeze({
  startup: 0.10,   // sec before the hitbox turns on (whiffable, punishable)
  active: 0.08,    // sec the hitbox is live (one hit per attack, first touch)
  recovery: 0.16,  // sec cooldown after active (whiff recovery / chain window)
  damage: 5,
  hitstun: 0.35,   // sec defender is stunned
  hitstop: 0.05,   // sec both fighters freeze on connect (impact feel)
  knockback: 260,  // px/sec initial push given to the defender
  lunge: 26,       // px attacker travels forward across startup + active
  chainTo: null,   // light-combo routing: attack id buffered into next, or null
  level: "mid",    // high | mid | low — decides which guard height stops it:
                   // stand guard stops high+mid, crouch guard stops mid+low
  blockstun: 0.25, // sec the defender is locked in BLOCKSTUN on a block
  blockPush: 320,  // px/sec shove on block (space gained, no damage)
  chip: 0,         // normals never deal chip (specials may, M10/M11)
  hit: Object.freeze({ w: 78, top: 120, h: 70 }), // hitbox size (px, above feet)
  ...o,
});

// M8 per-character normals. Wesker is a rushdown kit: quicker hands, a high
// backfist ender (cracks crouch-block), and Cobra Strike — a long lunging
// knife-hand thrust — on RMB. Homelander is a brawler: slower, heavier hits
// with a low sweep ender (cracks stand-block); his RMB is a command throw
// (the M6 grab system), so he has no heavy strike at all.
export const WESKER_BASE = Object.freeze({
  light1: base({
    startup: 0.09, active: 0.07, recovery: 0.14, damage: 5,
    hitstun: 0.32, hitstop: 0.05, knockback: 240, lunge: 24, chainTo: "light2",
    blockstun: 0.20, blockPush: 280,
  }),
  light2: base({
    startup: 0.11, active: 0.07, recovery: 0.18, damage: 6,
    hitstun: 0.38, hitstop: 0.06, knockback: 280, lunge: 28, chainTo: "light3",
    blockstun: 0.24, blockPush: 320,
  }),
  light3: base({
    startup: 0.13, active: 0.09, recovery: 0.26, damage: 8,
    hitstun: 0.48, hitstop: 0.07, knockback: 400, lunge: 32,
    level: "high", blockstun: 0.32, blockPush: 420, // backfist: stand-guard it
  }),
  heavy: base({
    startup: 0.18, active: 0.08, recovery: 0.36, damage: 15,
    hitstun: 0.62, hitstop: 0.11, knockback: 640, lunge: 55,
    level: "mid", blockstun: 0.50, blockPush: 600, // COBRA STRIKE: speed+reach
    hit: Object.freeze({ w: 88, top: 120, h: 70 }),
  }),
  // Crouch poke (CROUCH/SNEAK + light): fast low jab. Stand-guard it and
  // eat it — only crouch guard stops lows.
  crouchLight: base({
    startup: 0.11, active: 0.08, recovery: 0.22, damage: 5,
    hitstun: 0.36, hitstop: 0.05, knockback: 300, lunge: 20,
    level: "low", blockstun: 0.24, blockPush: 340,
    hit: Object.freeze({ w: 80, top: 64, h: 52 }),
  }),
  // Air kit (JUMP/FALL + light/heavy): gravity keeps pulling, landing
  // cancels the swing into landing lag. No chains up here.
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
  // SAMURAI EDGE (E key, single press — Wesker-only): instant guard-cancel
  // / combo-burst pistol shot. Free (no rage) with i-frames through the
  // 0.14 draw, paid for with 0.40 whiff recovery. The bullet band rides HIGH
  // (ray top 150, h 40): standing foes eat it, but SNEAKERS and crouchers
  // duck clean under it — same duck-under rule as Homelander's laser, so
  // holding S beats the gun and the gun beats approaches. `ray` makes
  // hitboxOf build a hitscan band instead of a melee box (see combat.js).
  gun: base({
    startup: 0.14, active: 0.08, recovery: 0.40, damage: 7,
    hitstun: 0.45, hitstop: 0.07, knockback: 380, lunge: 0,
    level: "mid", blockstun: 0.30, blockPush: 420, chip: 2,
    ray: Object.freeze({ len: 550, top: 150, h: 40 }),
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
    level: "low", blockstun: 0.30, blockPush: 440, // sweep: crouch-guard it
  }),
  // Crouch kit (CROUCH/SNEAK + light/heavy): low pokes that only crouch
  // guard stops. His RMB stays a command throw standing; crouched it sweeps.
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
  // Air kit: same rules as Wesker's (gravity pulls, landing cancels).
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
  // No heavy strike: RMB routes to the M6 grab/throw (see pressHeavy).
});

// Wolverine (feral rushdown): fastest chain, short claw boxes, light chip
// on every slash + bleed DoT. Heavy is a diving double-claw lunge.
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

// Hulk (super-heavy grappler): slowest chain on the roster, huge damage +
// stun, long arms. Chain 6/7/9 × 1.35 ≈ 29.7 — the punish king.
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

// Per-character moveset. M7 applies each fighter's tempo + power here, so
// fighter logic only ever reads finished numbers — never stat ratios.
// Stun, knockback, hitstop, reach, chain routing, and levels are identical
// for both (fairness); only the owner's frame durations and damage scale.
// Returns fresh copies so later rage/mode effects can't mutate shared data.
// JS concept vs Python: `{ ...v }` is dict unpacking (`{**v}`) — a shallow
// copy. We re-copy the nested `hit` dict too so it's fully independent.
export function movesFor(kind) {
  // M8: each fighter brings its own base table; M7 stat scaling applies over
  // whichever table the kind selects (tempo/power ratios are untouched).
  const table = kind === "homelander" ? HOMELANDER_BASE
    : kind === "wolverine" ? WOLVERINE_BASE
    : kind === "hulk" ? HULK_BASE : WESKER_BASE;
  const st = CHARACTERS[kind].stats;
  const out = {};
  for (const [k, v] of Object.entries(table)) {
    out[k] = {
      ...v,
      hit: { ...v.hit },
      startup: v.startup / st.attackSpeed,
      active: v.active / st.attackSpeed,
      recovery: v.recovery / st.attackSpeed,
      // Wesker's Samurai Edge is a firearm, not a fist: stats.damage sizes
      // MELEE only, so the gun (rage supers never pass through here) keeps
      // its authored numbers.
      damage: k === "gun" ? v.damage : v.damage * st.damage,
    };
  }
  return out;
}

// Which sprite frame each attack shows per phase (windup / strike /
// follow-through). Per fighter now: indices into the painter's attack[]
// table (0 jab, 1 kick, 2 cross, 3 overhead-raise, 4 windup, 5 slam,
// 6 palm, 7 elbow, 8 backfist, 9 cobra, 10 hook, 11 sweep, 12 SAMURAI EDGE,
// 13 crouch palm, 14 crouch jab, 15 crouch sweep, 16 air kick, 17 air slam).
export const FRAME_FOR = Object.freeze({
  wesker: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 6, recovery: 6 }),
    light2: Object.freeze({ startup: 4, active: 7, recovery: 7 }),
    light3: Object.freeze({ startup: 4, active: 8, recovery: 8 }),
    heavy: Object.freeze({ startup: 4, active: 9, recovery: 9 }),
    gun: Object.freeze({ startup: 4, active: 12, recovery: 12 }), // draw -> level
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
  // Hulk attack indices 24-30: smash / smash-side / stomp / quake-slam /
  // crouch stomp / air smash / air quake.
  hulk: Object.freeze({
    light1: Object.freeze({ startup: 4, active: 24, recovery: 24 }),
    light2: Object.freeze({ startup: 4, active: 25, recovery: 25 }),
    light3: Object.freeze({ startup: 4, active: 26, recovery: 26 }),
    heavy: Object.freeze({ startup: 4, active: 27, recovery: 27 }),
    crouchLight: Object.freeze({ startup: 4, active: 28, recovery: 28 }),
    airLight: Object.freeze({ startup: 4, active: 29, recovery: 29 }),
    airHeavy: Object.freeze({ startup: 4, active: 30, recovery: 30 }),
  }),
});

// M9 rage economy. Three levels (0-3), 100 points each. Gains are tuned so
// roughly seven landed strikes fill a level; blocking pays the defender a
// little extra (defense stays viable); whiffs pay nothing. M10/M11 abilities
// spend levels through fighter.spendRage() — costs live with each ability.
export const RAGE = Object.freeze({
  MAX: 300,
  PER_LEVEL: 100,
  onDealHit: 14,   // attacker lands a strike
  onTakeHit: 10,   // defender eats a strike
  onDealBlock: 8,  // attacker gets guarded
  onTakeBlock: 12, // defender guards successfully
});
// M6 grab/throw data. Timing IS the triangle: grab startup (0.12) is slower
// than jab startup (0.10), so a strike started together lands first and
// stuffs the grab (attack beats grab). The grab itself never consults guard
// (grab beats block). Homelander's RMB throw (M8) will reuse this system.
export const GRAB = Object.freeze({
  startup: 0.12,  // hittable wind-up (no armor — strikes interrupt it)
  active: 0.08,   // seizure window (checks every frame, forgiving)
  recover: 0.35,  // whiff recovery (long — punish the empty grab)
  carry: 0.28,    // victim held at arm's length before the toss
  toss: 0.18,     // follow-through after launch
  range: 95,      // px from attacker center (body gap is 70 — must exceed it)
  lunge: 14,      // small step-in across startup + active
  damage: 12,     // dealt at the toss, not the catch
  knockback: 520, // launch slide
  tossUp: 300,    // launch pop (victim goes airborne, lands in LAND)
  stun: 0.55,     // hitstun applied on launch
});

// M10 Wesker specials (Jaguar Charge / Phantom Combo / Rage Mode). Costs are
// rage LEVELS (paid through spendRage). maxRange gates the fire — no
// cross-screen supers; out-of-range presses fizzle without spending.
export const WESKER_SPECIALS = Object.freeze({
  jaguar: Object.freeze({
    cost: 1, maxRange: 500,
    startup: 0.25, dashTime: 0.25, dashSpeed: 1050, recover: 0.35,
    damage: 18, chip: 3, hitstun: 0.50, hitstop: 0.08, knockback: 650,
    blockstun: 0.40, blockPush: 550,
    hit: Object.freeze({ w: 80, top: 120, h: 72 }),
  }),
  phantom: Object.freeze({
    cost: 2, maxRange: 420,
    openTime: 0.12, strikeTime: 0.10, gapTime: 0.14, recover: 0.35,
    frames: Object.freeze([6, 7, 8, 9, 5]), // palm, elbow, backfist, cobra, slam
    sides: Object.freeze([1, -1, 1, -1, 1]), // teleport side per hit (vs foe)
    hit: Object.freeze({ w: 76, top: 125, h: 75 }),
    hits: Object.freeze([
      Object.freeze({ damage: 5, stun: 0.35, knock: 150, stop: 0.05, chip: 1 }),
      Object.freeze({ damage: 5, stun: 0.35, knock: 150, stop: 0.05, chip: 1 }),
      Object.freeze({ damage: 5, stun: 0.35, knock: 150, stop: 0.05, chip: 1 }),
      Object.freeze({ damage: 7, stun: 0.40, knock: 250, stop: 0.06, chip: 1 }),
      Object.freeze({ damage: 12, stun: 0.70, knock: 600, stop: 0.12, chip: 3, launch: 350 }),
    ]),
  }),
  ragemode: Object.freeze({
    cost: 3, maxRange: 500,
    // Rework: longer apotheosis. 1s unmasking, six black-afterimage frenzy
    // passes (5 each, guardable mids), then Wesker leaps skyward and calls
    // a 30-ton missile onto the victim's position (35, blockable for 8,
    // dashable while it falls). Total ~65 — the whole lifebar trembles.
    transform: 1.10, strikeTime: 0.10, gapTime: 0.12, recoverAbort: 0.35,
    frames: Object.freeze([6, 7, 8, 9, 6, 7]),
    sides: Object.freeze([1, -1, 1, -1, 1, -1]),
    hit: Object.freeze({ w: 76, top: 125, h: 75 }),
    frenzy: Object.freeze({ damage: 5, stun: 0.32, knock: 120, stop: 0.04, chip: 1 }),
    rise: 0.50, aim: 0.35, drop: 0.50, recover: 0.45,
    missile: 35, missileChip: 8, missileStun: 0.60, missileStop: 0.18,
    missileKnock: 500, missileDown: 700,
  }),
  // Shadow Step (meterless, spammable): manual teleport — S + double-tap A/D.
  // Fixed 190px in the TAPPED screen direction (never auto-tracks the foe,
  // so beginners cross themselves up). Vanish is hittable, shift is brief
  // invuln, reform is punishable — spam is allowed, reads are rewarded.
  shadow: Object.freeze({
    cost: 0, maxRange: 9999,
    vanish: 0.10, shift: 0.06, reform: 0.16, dist: 320,
  }),
});

// M11 Homelander specials (Quick Laser / Sonic Scream / Rage Mode).
export const HOMELANDER_SPECIALS = Object.freeze({
  // Hitscan eye beam at head height: thin + high, so crouchers (even
  // crouch-guarding) duck clean under it — stand guard to stop it.
  laser: Object.freeze({
    cost: 1, maxRange: 900,
    startup: 0.18, fire: 0.12, recover: 0.28,
    damage: 14, chip: 4, hitstun: 0.50, hitstop: 0.08, knockback: 400,
    blockstun: 0.35, blockPush: 450, level: "high",
    beamTop: 140, beamH: 14, beamLen: 700,
  }),
  // Point-blank scream: hits BOTH sides, huge shove, tall enough to catch
  // jumpers — but a dash clears the 150px radius.
  scream: Object.freeze({
    cost: 2, maxRange: 300,
    startup: 0.35, active: 0.25, recover: 0.40,
    damage: 20, chip: 5, hitstun: 0.60, hitstop: 0.10, knockback: 700,
    blockstun: 0.45, blockPush: 600, level: "mid",
    radius: 170, top: 160,
  }),
  // Flying execution: unblockable cinematic seize (a 3-bar grab), lift,
  // four laser ticks (5 each) with bleeding, then a 10-dmg ground slam.
  ragemode: Object.freeze({
    cost: 3, maxRange: 400,
    ascend: 0.65, carry: 0.50, lase: 0.80, recover: 0.40,
    tick: 5, ticks: 4, finale: 10, launchDown: 900,
  }),
});

// Wolverine specials: Adamantium Rush / Berserker Barrage / Weapon X Surge.
// Pierce tax: slightly lower direct damage, high chip + bleed on all hits.
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

// Hulk specials: Gamma Charge / Thunder Clap / Worldbreaker.
// Slowest windups on the roster, biggest payoffs. Fake-armor-first: standard
// burst invuln windows (no new armor mechanic yet).
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
// Healing factor tuning (fighter.js reads this). Post-rebalance: slower
// regen (2.0/s) so anchors can't stall the 99s clock for free.
export const REGEN = Object.freeze({ delay: 2.5, rate: 2.0 });
// Bleed tuning: N ticks of `per` damage, one tick per `interval` sec.
export const BLEED = Object.freeze({ ticks: 3, per: 1, interval: 0.65 });
