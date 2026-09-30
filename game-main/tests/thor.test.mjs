import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const chars = await import("../js/characters/data.js");
const data = await import("../js/combat/data.js");
const combat = await import("../js/combat/combat.js");

assert.ok(chars.CHARACTERS.thor, "thor in CHARACTERS");
assert.deepStrictEqual({ ...chars.CHARACTERS.thor.stats },
  { attackSpeed: 1.05, moveSpeed: 0.95, damage: 1.10, health: 1.15 });
assert.strictEqual(Math.round(100 * chars.CHARACTERS.thor.stats.health), 115);

for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy", "hammer"]) {
  assert.ok(data.THOR_BASE[k], `THOR_BASE.${k}`);
}
assert.strictEqual(data.THOR_BASE.light1.chainTo, "light2");
assert.strictEqual(data.THOR_BASE.light2.chainTo, "light3");
assert.strictEqual(data.THOR_BASE.light3.level, "low");
assert.strictEqual(data.THOR_BASE.heavy.level, "high", "overhead cracks crouchers");
assert.deepStrictEqual({ ...data.THOR_BASE.hammer.ray }, { len: 450, top: 100, h: 60 });
assert.strictEqual(data.THOR_BASE.hammer.level, "mid", "hammer must be guarded, not ducked");

const mv = data.movesFor("thor");
assert.ok(Math.abs(mv.light1.startup - 0.11 / 1.05) < 1e-9, "startup scaled");
assert.ok(Math.abs(mv.light1.damage - 6 * 1.10) < 1e-9, "damage scaled");
const chain = mv.light1.damage + mv.light2.damage + mv.light3.damage;
assert.ok(Math.abs(chain - 22.0) < 1e-9, `chain ~22.0 (got ${chain})`);

for (const k of ["light1", "light2", "light3", "heavy", "hammer", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.FRAME_FOR.thor[k], `FRAME_FOR.thor.${k}`);
}
const spritesSrc = readFileSync(new URL("../js/render/sprites.js", import.meta.url), "utf8");
assert.ok(spritesSrc.includes("paintThor"), "paintThor exists");
assert.ok(spritesSrc.includes("LY_T"), "classic palette present");
for (const flag of ["hammerSpin: 1", "charge: 1", "beam: 1", "stormcall: 1"]) {
  assert.ok(spritesSrc.includes(flag), `thor pose flag ${flag}`);
}

const sp = data.THOR_SPECIALS;
assert.deepStrictEqual([sp.storm.cost, sp.lightning.cost, sp.godblast.cost], [1, 2, 3]);
assert.deepStrictEqual([sp.storm.maxRange, sp.lightning.maxRange, sp.godblast.maxRange], [480, 380, 600]);
assert.strictEqual(sp.lightning.radius, 170, "leq hulk clap");
assert.strictEqual(sp.storm.damage * 2, 16, "boomerang hits both ways: 8 out + 8 back");
assert.strictEqual(sp.godblast.ticks * sp.godblast.tickDmg, 40, "godblast barrage totals 40");
assert.strictEqual(sp.godblast.barrageTime, 4.0, "barrage plays 4 seconds");

// hammer hits crouchers (mid-level ray, unlike repulsor)
const GY = 452;
const att = { x: 300, y: GY, attackDir: 1, w: 108 };
const low = { x: 400, y: GY, isLow: true, w: 108, h: 156 };
const tall = { x: 400, y: GY, isLow: false, w: 108, h: 156 };
const box = combat.hitboxOf(att, data.THOR_BASE.hammer);
assert.ok(combat.overlap(box, combat.hurtboxOf(tall)), "hammer hits standers");
assert.ok(combat.overlap(box, combat.hurtboxOf(low)), "hammer hits crouchers (must guard)");

const fighterSrc = readFileSync(new URL("../js/characters/fighter.js", import.meta.url), "utf8");
for (const s of ["tryThorSpecial", 'jaguar: "storm"', 'phantom: "lightning"', "tryHammer", "AudioFX.thunder"]) {
  assert.ok(fighterSrc.includes(s), `fighter.js has ${s}`);
}
const specialsSrc = readFileSync(new URL("../js/combat/specials.js", import.meta.url), "utf8");
for (const s of ["tryThorSpecial", "updateStorm", "updateLightning", "updateGodblast", "FlyingHammer", "Bolts.strike"]) {
  assert.ok(specialsSrc.includes(s), `specials.js has ${s}`);
}
const fxSrc = readFileSync(new URL("../js/effects.js", import.meta.url), "utf8");
assert.ok(fxSrc.includes("export const Bolts"), "Bolts FX system");
assert.ok(fxSrc.includes("export const FlyingHammer"), "FlyingHammer FX");
const aiSrc = readFileSync(new URL("../js/ai.js", import.meta.url), "utf8");
assert.ok(aiSrc.includes("thor:"), "AI profile row");
const screensSrc = readFileSync(new URL("../js/ui/screens.js", import.meta.url), "utf8");
assert.ok(screensSrc.includes('"thor"'), "thor on the draft roster");

console.log("thor.test.mjs: all groups pass");
