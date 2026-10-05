// Hulk regression checks (headless, no DOM).
// Run: node tests/hulk.test.mjs
import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const chars = await import("../js/characters/data.js");
const data = await import("../js/combat/data.js");
const combat = await import("../js/combat/combat.js");

// 1. Roster + stats (slowest, strongest, LARGE wall)
assert.ok(chars.CHARACTERS.hulk, "hulk in CHARACTERS");
assert.deepStrictEqual({ ...chars.CHARACTERS.hulk.stats },
  { attackSpeed: 0.95, moveSpeed: 0.85, damage: 1.35, health: 1.35 });
assert.strictEqual(Math.round(100 * chars.CHARACTERS.hulk.stats.health), 135);

// 2. Normals: chain routing, low ender, long arms, slam lunge
for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.HULK_BASE[k], `HULK_BASE.${k}`);
}
assert.strictEqual(data.HULK_BASE.light1.chainTo, "light2");
assert.strictEqual(data.HULK_BASE.light2.chainTo, "light3");
assert.strictEqual(data.HULK_BASE.light3.level, "low"); // cracks stand-guard
assert.ok(data.HULK_BASE.light1.hit.w >= 84, "long reach vs Wesker 78-88");
assert.strictEqual(data.HULK_BASE.heavy.lunge, 45, "slam steps in");

// 3. Tempo scaling: slowest jab on the roster, biggest chain
const mv = data.movesFor("hulk");
assert.ok(Math.abs(mv.light1.startup - 0.14 / 0.95) < 1e-9, "startup scaled");
assert.ok(Math.abs(mv.light1.damage - 6 * 1.35) < 1e-9, "damage scaled");
const chain = mv.light1.damage + mv.light2.damage + mv.light3.damage;
assert.ok(Math.abs(chain - 29.7) < 1e-9, `chain ~29.7 (got ${chain})`);
assert.ok(mv.light1.startup > data.movesFor("wesker").light1.startup, "slower than Wesker");

// 4. FRAME_FOR covers all 7 hulk moves, painter exists with gamma kit
for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.FRAME_FOR.hulk[k], `FRAME_FOR.hulk.${k}`);
}
const spritesSrc = readFileSync(new URL("../js/render/sprites.js", import.meta.url), "utf8");
assert.ok(spritesSrc.includes("paintHulk"), "paintHulk exists");
assert.ok(spritesSrc.includes("LY_U"), "gamma knockdown palette present");
for (const flag of ["smash", "backhand", "stomp", "quake", "inhale", "ascend"]) {
  assert.ok(spritesSrc.includes(flag), `hulk pose flag ${flag}`);
}
assert.ok(spritesSrc.includes("5a2a8f"), "purple pants present");
assert.ok(spritesSrc.includes("3e9c3e"), "green mass present");

// 5. Specials data: costs 1/2/3, ranges, ticks total 30
const sp = data.HULK_SPECIALS;
assert.deepStrictEqual([sp.gamma.cost, sp.clap.cost, sp.breaker.cost], [1, 2, 3]);
assert.deepStrictEqual([sp.gamma.maxRange, sp.clap.maxRange, sp.breaker.maxRange], [450, 320, 420]);
assert.strictEqual(sp.gamma.damage, 22, "charge hits like a truck");
assert.strictEqual(sp.clap.radius, 200, "clap wider than scream 170");
assert.strictEqual(sp.breaker.ticks, 3, "breaker shake ticks");
assert.strictEqual(sp.breaker.tick * sp.breaker.ticks + sp.breaker.finale, 30, "breaker ~30 total");

// 6. LARGE frame: size-aware boxes — easier to hit standing, ducks lows low.
// Hulk body: 36*3*1.32 x 52*3*1.32.
const HW = 36 * 3 * 1.32, HH = 52 * 3 * 1.32;
const GY = 452;
const hulkStand = { x: 800, y: GY, isLow: false, w: HW, h: HH };
const hulkLow = { x: 800, y: GY, isLow: true, w: HW, h: HH };
const hbStand = combat.hurtboxOf(hulkStand);
const hbLow = combat.hurtboxOf(hulkLow);
assert.ok(hbStand.h > 148, `taller than standard (got ${hbStand.h})`);
assert.ok(hbStand.w > 52, `wider than standard (got ${hbStand.w})`);
// Homelander laser band at head height must miss the crouching Hulk.
const beam = { x: 100, y: GY - 137, w: 700, h: 14 };
assert.ok(!combat.overlap(beam, hbLow), "crouched Hulk ducks the laser");
assert.ok(combat.overlap(beam, hbStand), "standing Hulk eats the laser");
// Standard fighters reproduce the classic boxes exactly.
const std = combat.hurtboxOf({ x: 0, y: GY, isLow: false, w: 108, h: 156 });
assert.ok(Math.abs(std.h - 148) < 0.5 && Math.abs(std.w - 52) < 0.5, "classic stand box");
const stdLow = combat.hurtboxOf({ x: 0, y: GY, isLow: true, w: 108, h: 156 });
assert.ok(Math.abs(stdLow.h - 92) < 0.5 && Math.abs(stdLow.w - 56) < 0.5, "classic low box");

// 7. Wiring: slot map, specials entry, grab bonus, AI, select UI
const fighterSrc = readFileSync(new URL("../js/characters/fighter.js", import.meta.url), "utf8");
for (const s of ["tryHulkSpecial", 'jaguar: "gamma"', 'phantom: "clap"', "GRAB.damage + 4"]) {
  assert.ok(fighterSrc.includes(s), `fighter.js has ${s}`);
}
const specialsSrc = readFileSync(new URL("../js/combat/specials.js", import.meta.url), "utf8");
for (const s of ["tryHulkSpecial", "updateGamma", "updateClap", "updateBreaker"]) {
  assert.ok(specialsSrc.includes(s), `specials.js has ${s}`);
}
const aiSrc = readFileSync(new URL("../js/ai.js", import.meta.url), "utf8");
assert.ok(aiSrc.includes('me.kind === "hulk"'), "AI hulk branch");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(html.includes('data-c="hulk"'), "select-screen buttons");

console.log("hulk.test.mjs: all 7 groups pass");
