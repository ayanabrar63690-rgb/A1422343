import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const chars = await import("../js/characters/data.js");
const data = await import("../js/combat/data.js");
const combat = await import("../js/combat/combat.js");

assert.ok(chars.CHARACTERS.doom, "doom in CHARACTERS");
assert.deepStrictEqual({ ...chars.CHARACTERS.doom.stats },
  { attackSpeed: 1.00, moveSpeed: 0.90, damage: 1.05, health: 1.15 });
assert.strictEqual(Math.round(100 * chars.CHARACTERS.doom.stats.health), 115);

for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy", "photon", "snap"]) {
  assert.ok(data.DOOM_BASE[k], `DOOM_BASE.${k}`);
}
assert.strictEqual(data.DOOM_BASE.light1.chainTo, "light2");
assert.strictEqual(data.DOOM_BASE.light2.chainTo, "light3");
assert.strictEqual(data.DOOM_BASE.light3.level, "low");
assert.strictEqual(data.DOOM_BASE.heavy.level, "high", "overhead cracks crouchers");
assert.deepStrictEqual({ ...data.DOOM_BASE.photon.ray }, { len: 450, top: 122, h: 44 });
// snap = 55% of light1 base
assert.ok(Math.abs(data.DOOM_BASE.snap.damage - 5 * 0.55) < 1e-9, `snap 55% light (got ${data.DOOM_BASE.snap.damage})`);

const mv = data.movesFor("doom");
assert.ok(Math.abs(mv.light1.damage - 5 * 1.05) < 1e-9, "damage scaled");
assert.ok(Math.abs(mv.snap.damage - mv.light1.damage * 0.55) < 1e-9, "live snap 55% of live light1");

for (const k of ["light1", "light2", "light3", "heavy", "photon", "snap", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.FRAME_FOR.doom[k], `FRAME_FOR.doom.${k}`);
}
const spritesSrc = readFileSync(new URL("../js/render/sprites.js", import.meta.url), "utf8");
assert.ok(spritesSrc.includes("paintDoom"), "paintDoom exists");
assert.ok(spritesSrc.includes("LY_D"), "classic palette present");
for (const flag of ["snap: 1", "throne: 1", "beam: 1"]) {
  assert.ok(spritesSrc.includes(flag), `doom pose flag ${flag}`);
}
assert.ok(spritesSrc.includes("Seated monarch"), "throne is a true seated pose, not standing");

const sp = data.DOOM_SPECIALS;
assert.strictEqual(sp.beam.cost, 1, "beam costs 1 bar");
assert.strictEqual(sp.beam.damage, 16, "thick beam hits hard");
assert.deepStrictEqual([sp.beam.rayH, sp.beam.rayLen], [90, 650], "thick long beam");
assert.strictEqual(sp.stack.costPts, 50, "stack costs half a bar");
assert.strictEqual(sp.stack.volleys, 4, "quad stack");
assert.strictEqual(sp.throne.cost, 3, "throne costs 3");
assert.strictEqual(sp.throne.maxRange, 700, "throne works from far away");
const throneTotal = sp.throne.beamTicks * sp.throne.beamDmg + sp.throne.meteorDmg;
assert.strictEqual(throneTotal, 35, `throne totals 35 (got ${throneTotal})`);
assert.strictEqual(sp.throne.downTime, 1.00, "throne pins foe for 1s");

const fighterSrc = readFileSync(new URL("../js/characters/fighter.js", import.meta.url), "utf8");
for (const s of ["tryDoomSpecial", "tryDoomPhoton", "tryDoomSnap", "tryPhoton", "trySnap", "snapCD", 'jaguar: "beam"', 'phantom: "stack"']) {
  assert.ok(fighterSrc.includes(s), `fighter.js has ${s}`);
}
const specialsSrc = readFileSync(new URL("../js/combat/specials.js", import.meta.url), "utf8");
for (const s of ["tryDoomSpecial", "tryDoomPhoton", "tryDoomSnap", "updateDoomBeam", "updateDoomStack", "updateDoomSnap", "updateDoomThrone", "Missiles.launch", "Beams.spawn", "Bolts.strike", "f.rage - spec.costPts"]) {
  assert.ok(specialsSrc.includes(s), `specials.js has ${s}`);
}
const beamNoRage = (specialsSrc.match(/noRage: true/g) || []).length;
assert.ok(beamNoRage >= 2, `beam + stack volleys build no meter (${beamNoRage} noRage flags)`);
const aiSrc = readFileSync(new URL("../js/ai.js", import.meta.url), "utf8");
assert.ok(aiSrc.includes("doom:"), "AI profile row");
assert.ok(aiSrc.includes("missileDodge"), "AI dodges missiles");
assert.ok(aiSrc.includes("MISSILE_DODGE"), "per-difficulty dodge rates");
const screensSrc = readFileSync(new URL("../js/ui/screens.js", import.meta.url), "utf8");
assert.ok(screensSrc.includes('"doom"'), "doom on the draft roster");

// --- missile dodge behavior ---
const { AIController } = await import("../js/ai.js");
const { Missiles } = await import("../js/effects.js");
const mockFighter = (o) => ({
  kind: "homelander", state: "IDLE", phase: null, grounded: true,
  x: 500, y: 452, hp: 100, maxHp: 100, rage: 0, rageLevel: 0,
  facing: 1, freezeT: 0, attackMove: null, attackId: null,
  specialId: null, special: null,
  moving: 0, crouchHeld: false, blockHeld: false,
  calls: [],
  queueTag(w) { this.calls.push(["tag", w]); },
  queueDash(d) { this.calls.push(["dash", d]); },
  queueJump() { this.calls.push(["jump"]); },
  pressLight() { this.calls.push(["light"]); },
  pressHeavy() { this.calls.push(["heavy"]); },
  pressGrab() { this.calls.push(["grab"]); },
  tryShadow(d) { this.calls.push(["shadow", d]); return true; },
  tryRepulsor() { this.calls.push(["repulsor"]); return true; },
  trySpecial(id) { this.calls.push(["special", id]); return true; },
  ...o,
});
const mkRng = (v) => () => v;
// downed foe at mid range: normal think never dashes here (presses instead),
// so any dash/shadow below is purely the missile response.
const downedFoe = () => mockFighter({ kind: "hulk", x: 800, state: "KDOWN" });

// fresh launch: nobody reacts on sight, not even extreme
Missiles.list = [{ tx: 500, t: 0.0, fall: 0.5 }];
let ai = new AIController("extreme", mkRng(0.0));
let me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(!me.calls.some((c) => c[0] === "dash"), "no psychic dash on launch frame");
assert.deepStrictEqual(ai.order, { move: 1, crouch: false, guard: false }, "normal fight until it registers");

// easy needs the missile to be 0.28s old before it even notices
Missiles.list = [{ tx: 600, t: 0.1, fall: 0.5 }];
ai = new AIController("easy", mkRng(0.0));
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(!me.calls.some((c) => c[0] === "dash"), "easy hasn't noticed yet");

// early missile (0.4s out): too soon to dash, just sprint for distance
Missiles.list = [{ tx: 600, t: 0.1, fall: 0.5 }];
ai = new AIController("extreme", mkRng(0.0));
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(!me.calls.some((c) => c[0] === "dash"), "no early dash into thin air");
assert.deepStrictEqual(ai.order, { move: -1, crouch: false, guard: false }, "sprints clear first");

// late missile (0.15s out): extreme dashes so the dash covers impact
Missiles.list = [{ tx: 600, t: 0.35, fall: 0.5 }];
ai = new AIController("extreme", mkRng(0.0));
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(me.calls.some((c) => c[0] === "dash" && c[1] === -1), "extreme dashes away from the blast");
assert.deepStrictEqual(ai.order, { move: -1, crouch: false, guard: false }, "dodge dashes out and keeps running");

// after dashing it keeps sprinting clear until impact (no second dash needed)
ai.dashCD = 1.0;
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(!me.calls.some((c) => c[0] === "dash"), "no second dash mid-flight");
assert.deepStrictEqual(ai.order, { move: -1, crouch: false, guard: false }, "keeps running out of the radius");

// mid-dash think must not overwrite the escape: foe swings (normally guards)
// while the dash is still carrying out, order must stay flee
Missiles.list = [{ tx: 600, t: 0.2, fall: 0.5 }];
ai = new AIController("extreme", mkRng(0.0));
ai.fleeCD = 0.5;
ai.dashCD = 1.0;
me = mockFighter({ kind: "homelander", x: 500, state: "DASH" });
const swingingFoe = mockFighter({ kind: "doom", x: 800, state: "ATTACK", phase: "startup", attackMove: { level: "mid" } });
ai.think(me, swingingFoe, null);
assert.deepStrictEqual(ai.order, { move: -1, crouch: false, guard: false }, "flee holds through dash frames");

// easy blows the read 80% of the time
Missiles.list = [{ tx: 600, t: 0.35, fall: 0.5 }];
ai = new AIController("easy", mkRng(0.9));
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(!me.calls.some((c) => c[0] === "dash"), "easy misses the dodge");

// medium splits: 0.5 reads it, 0.9 does not
Missiles.list = [{ tx: 600, t: 0.35, fall: 0.5 }];
ai = new AIController("medium", mkRng(0.5));
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(me.calls.some((c) => c[0] === "dash" && c[1] === -1), "medium reads the missile");
Missiles.list = [{ tx: 600, t: 0.35, fall: 0.5 }];
ai = new AIController("medium", mkRng(0.9));
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(!me.calls.some((c) => c[0] === "dash"), "medium misses it at 0.9");

// wesker teleports instead of dashing (away from the blast, not toward the foe)
Missiles.list = [{ tx: 600, t: 0.35, fall: 0.5 }];
ai = new AIController("extreme", mkRng(0.0));
ai.blitzCD = 0;
me = mockFighter({ kind: "wesker", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(me.calls.some((c) => c[0] === "shadow" && c[1] === -1), "wesker teleports clear");
assert.ok(!me.calls.some((c) => c[0] === "dash"), "no dash when teleporting");

// spent missiles and far blasts are ignored
Missiles.list = [{ tx: 500, t: 0.5, fall: 0.5 }];
ai = new AIController("extreme", mkRng(0.0));
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(!me.calls.some((c) => c[0] === "dash"), "landed missile ignored");
Missiles.list = [{ tx: 100, t: 0.1, fall: 0.5 }];
ai = new AIController("extreme", mkRng(0.0));
me = mockFighter({ kind: "homelander", x: 500 });
ai.think(me, downedFoe(), null);
assert.ok(!me.calls.some((c) => c[0] === "dash"), "distant blast ignored");
Missiles.list = [];
const combatSrc = readFileSync(new URL("../js/combat/combat.js", import.meta.url), "utf8");
assert.ok(combatSrc.includes("sky"), "sky-dodge rule lives in resolveStrike");

// --- sky blasts slip any dash ---
const skyAtt = { x: 300, y: 452, attackDir: 1, w: 108, addRage() {}, lastContact: null };
const mkDef = (state) => ({
  x: 400, y: 452, isLow: false, hp: 100, state, grounded: true, facing: -1,
  invulnT: 0, rage: 0, addRage() {},
  takeHit(m) { this.hp -= m.damage; },
  takeBlocked() {},
});
const skyMove = {
  damage: 10, hitstun: 0.4, knockback: 300, hitstop: 0.05, level: "mid",
  blockstun: 0.2, blockPush: 300, chip: 1, sky: true, hit: { w: 260, top: 150, h: 150 },
};
let dd = mkDef("DASH");
assert.strictEqual(combat.resolveStrike(skyAtt, dd, skyMove), null, "dash slips the sky blast");
assert.strictEqual(dd.hp, 100, "no damage mid-dash");
dd = mkDef("BACKDASH");
assert.strictEqual(combat.resolveStrike(skyAtt, dd, skyMove), null, "backdash slips it too");
dd = mkDef("IDLE");
assert.ok(combat.resolveStrike(skyAtt, dd, skyMove), "standing still eats it");
assert.ok(dd.hp < 100, "blast lands standing");
const fist = { ...skyMove };
delete fist.sky;
dd = mkDef("DASH");
assert.ok(combat.resolveStrike(skyAtt, dd, fist), "melee still tracks dashers");

console.log("doom.test.mjs: all groups pass");
