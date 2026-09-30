import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const { AIController, AI_PROFILE } = await import("../js/ai.js");
const chars = await import("../js/characters/data.js");
const match = await import("../js/match.js");
const combat = await import("../js/combat/combat.js");
const cdata = await import("../js/combat/data.js");

const mockFighter = (o) => ({
  kind: "homelander", state: "IDLE", phase: null, grounded: true,
  x: 0, y: 452, hp: 100, maxHp: 100, rage: 0, rageLevel: 0,
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
const rng = (v) => () => v;

for (const kind of Object.keys(chars.CHARACTERS)) {
  const p = AI_PROFILE[kind];
  assert.ok(p, `AI_PROFILE.${kind}`);
  for (const f of ["retreatGap", "poke", "reach", "heavyMix", "approach"]) {
    assert.ok(f in p, `${kind}.${f}`);
  }
  if (p.poke) for (const f of ["min", "max", "move", "p", "easyP"]) assert.ok(f in p.poke, `${kind}.poke.${f}`);
  if (p.approach) for (const f of ["tool", "min", "max"]) assert.ok(f in p.approach, `${kind}.approach.${f}`);
}

const aiSrc = readFileSync(new URL("../js/ai.js", import.meta.url), "utf8")
  .replace(/\/\/.*$/gm, "");
for (const hidden of ["chainQueued", "lungeLeft", "victim", "heldBy", "hasHit",
  "rayFired", "holdT", "knockVX", "stateT", "phaseT", "animTime", "dashDir",
  "blockRetreating", "rageFlash", "sinceDamageT", "bleedN", "camKick"]) {
  assert.ok(!aiSrc.includes(hidden), `never reads .${hidden}`);
}

let ai = new AIController("extreme", rng(0.4));
let me = mockFighter({ kind: "homelander", x: 500 });
let foe = mockFighter({ kind: "ironman", x: 800, state: "ATTACK", phase: "startup", attackMove: { ray: { len: 500 }, level: "mid" } });
ai.think(me, foe, null);
assert.deepStrictEqual(ai.order, { move: 1, crouch: true, guard: false }, "sneak under the ray");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "homelander", x: 800, state: "ATTACK", phase: "startup", attackMove: { level: "mid" } });
ai.think(me, foe, null);
assert.ok(ai.order.guard && !ai.order.crouch, "mid guarded standing");

ai = new AIController("medium", rng(0.1));
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "homelander", x: 800, state: "SPECIAL", specialId: "laser", special: { phase: "startup" } });
ai.think(me, foe, null);
assert.deepStrictEqual(ai.order, { move: 1, crouch: true, guard: false }, "medium ducks the slow ray");
ai = new AIController("medium", rng(0.1));
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "ironman", x: 800, state: "ATTACK", phase: "startup", attackMove: { ray: { len: 500 }, level: "mid" } });
ai.think(me, foe, null);
assert.ok(ai.order.guard, "medium guards the fast poke (can't duck it)");

ai = new AIController("extreme", rng(0.4));
ai.blitzCD = 0;
me = mockFighter({ kind: "wesker", x: 500 });
foe = mockFighter({ kind: "hulk", x: 800, state: "KDOWN" });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "shadow" && c[1] === 1), "blitz through the downed foe");
assert.ok(ai.blitzCD > 0, "blitz timer armed");

ai = new AIController("extreme", rng(0.4));
ai.blitzCD = 0;
me = mockFighter({ kind: "wesker", x: 500 });
foe = mockFighter({ kind: "hulk", x: 1100, state: "IDLE" });
ai.think(me, foe, null);
assert.ok(!me.calls.some((c) => c[0] === "shadow"), "no neutral teleport");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "hulk", x: 650, state: "ATTACK", phase: "startup" });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "dash" && c[1] === -1), "backdash the wall");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "wesker", x: 500 });
foe = mockFighter({ kind: "ironman", x: 800, state: "ATTACK", phase: "recovery", attackId: "repulsor", attackMove: { ray: { len: 500 }, level: "mid" } });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "dash" && c[1] === 1), "dash in on repulsor recovery");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "wesker", x: 500 });
foe = mockFighter({ kind: "homelander", x: 800, state: "SPECIAL", specialId: "laser", special: { phase: "recover" } });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "dash" && c[1] === 1), "dash in on laser recovery");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "wesker", x: 650, state: "SPECIAL", specialId: "shadow", special: { phase: "vanish" } });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "light"), "stuff the vanish");

assert.deepStrictEqual(match.draftCounterTeam(["hulk"], 1), ["ironman"], "ironman zones the wall");
assert.deepStrictEqual(match.draftCounterTeam(["ironman"], 1), ["wesker"], "wesker blitzes the zoner");
assert.deepStrictEqual(match.draftCounterTeam(["wolverine"], 1), ["hulk"], "hulk eats the rush");
const duo = match.draftCounterTeam(["wesker", "hulk"], 2);
assert.strictEqual(duo.length, 2, "size respected");
assert.strictEqual(new Set(duo).size, 2, "no duplicate members");
assert.ok(duo.every((k) => k in chars.CHARACTERS), "legal members only");
assert.deepStrictEqual(match.draftCounterTeam(["goku"], 1).length, 1, "unknown foes draft neutrally");

ai = new AIController("extreme", rng(0.4));
ai.foeRayStreak = 0.6;
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "ironman", x: 1100, state: "ATTACK", phase: "recovery", attackMove: { ray: { len: 500 }, level: "mid" } });
ai.think(me, foe, null);
assert.deepStrictEqual(ai.order, { move: 1, crouch: true, guard: false }, "sneak commits through the string");

ai = new AIController("extreme", rng(0.4));
ai.foeRayStreak = 0.9;
ai.blitzCD = 0;
me = mockFighter({ kind: "wesker", x: 500 });
foe = mockFighter({ kind: "ironman", x: 800, state: "IDLE" });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "shadow" && c[1] === 1), "hard read on the spammer");
assert.deepStrictEqual(ai.order, { move: 0, crouch: false, guard: false }, "teleport is the whole plan");

ai = new AIController("extreme", rng(0.4));
ai.blitzCD = 0;
me = mockFighter({ kind: "wesker", x: 500, state: "SNEAK" });
foe = mockFighter({ kind: "hulk", x: 800, state: "KDOWN" });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "shadow"), "blitz from sneak");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "wesker", x: 800, state: "ATTACK", phase: "recovery", attackMove: { ray: { len: 550 }, level: "mid" } });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "dash" && c[1] === 1), "dash in on gun recovery");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "homelander", x: 650, state: "GRAB", phase: "startup" });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "light"), "stuff the grab");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "homelander", x: 500, y: 452 });
foe = mockFighter({ kind: "wesker", x: 560, y: 300, grounded: false, state: "FALL" });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "dash" && c[1] === 1), "dash under the dive");

ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "homelander", x: 170 });
foe = mockFighter({ kind: "wesker", x: 100, state: "IDLE" });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "grab"), "cornered foe gets thrown");
ai = new AIController("extreme", rng(0.4));
me = mockFighter({ kind: "homelander", x: 570 });
foe = mockFighter({ kind: "wesker", x: 500, state: "IDLE" });
ai.think(me, foe, null);
assert.ok(!me.calls.some((c) => c[0] === "grab"), "mid-stage foe gets jabbed instead");

ai = new AIController("medium", rng(0.3));
ai.foeRayStreak = 1.2;
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "ironman", x: 1100, state: "ATTACK", phase: "recovery", attackMove: { ray: { len: 500 }, level: "mid" } });
ai.think(me, foe, null);
assert.deepStrictEqual(ai.order, { move: 1, crouch: true, guard: false }, "medium commits off the pattern");

ai = new AIController("medium", rng(0.2));
ai.blitzCD = 0;
me = mockFighter({ kind: "wesker", x: 500 });
foe = mockFighter({ kind: "hulk", x: 800, state: "KDOWN" });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "shadow"), "medium punishes with teleport too");
ai = new AIController("medium", rng(0.2));
me = mockFighter({ kind: "homelander", x: 500 });
foe = mockFighter({ kind: "wesker", x: 800, state: "ATTACK", phase: "recovery", attackMove: { ray: { len: 550 }, level: "mid" } });
ai.think(me, foe, null);
assert.ok(me.calls.some((c) => c[0] === "dash"), "medium dashes ray recoveries");

let attRage = 0, defRage = 0;
const gunAtt = { x: 300, y: 452, attackDir: 1, w: 108, addRage(n) { attRage += n; }, lastContact: null };
const gunDef = () => ({
  x: 500, y: 452, isLow: false, hp: 100, state: "IDLE", grounded: true, facing: -1,
  takeHit(m) { this.hp -= m.damage; this.state = "HITSTUN"; },
  takeBlocked(m) { this.hp -= (m.chip || 0); },
  applyBleed() {},
  addRage(n) { defRage += n; },
});
const realRandom = Math.random;
Math.random = () => 0.99;
let d = gunDef();
combat.resolveStrike(gunAtt, d, cdata.WESKER_BASE.gun);
assert.strictEqual(d.hp, 100, "graze deals 0");
assert.strictEqual(d.state, "HITSTUN", "stun still lands on a graze");
Math.random = () => 0.01;
d = gunDef();
combat.resolveStrike(gunAtt, d, cdata.WESKER_BASE.gun);
assert.strictEqual(d.hp, 99.5, "lottery deals 0.5");
Math.random = realRandom;
assert.strictEqual(attRage + defRage, 0, "Edge builds no meter either way");

gunAtt.x = 450;
combat.resolveStrike(gunAtt, gunDef(), cdata.WESKER_BASE.light1);
assert.ok(attRage > 0, "normals still build meter");

console.log("ai.test.mjs: all 19 groups pass");
