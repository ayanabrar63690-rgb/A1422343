import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const chars = await import("../js/characters/data.js");
const data = await import("../js/combat/data.js");
const combat = await import("../js/combat/combat.js");

assert.ok(chars.CHARACTERS.ironman, "ironman in CHARACTERS");
assert.deepStrictEqual({ ...chars.CHARACTERS.ironman.stats },
  { attackSpeed: 1.00, moveSpeed: 0.95, damage: 0.95, health: 1.00 });
assert.strictEqual(Math.round(100 * chars.CHARACTERS.ironman.stats.health), 100);

for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy", "repulsor"]) {
  assert.ok(data.IRONMAN_BASE[k], `IRONMAN_BASE.${k}`);
}
assert.strictEqual(data.IRONMAN_BASE.light1.chainTo, "light2");
assert.strictEqual(data.IRONMAN_BASE.light2.chainTo, "light3");
assert.strictEqual(data.IRONMAN_BASE.light3.level, "low");
assert.deepStrictEqual({ ...data.IRONMAN_BASE.repulsor.ray }, { len: 500, top: 122, h: 44 });
assert.strictEqual(data.IRONMAN_BASE.repulsor.chip, 1, "poke chips, not melts");

const mv = data.movesFor("ironman");
assert.ok(Math.abs(mv.light1.startup - 0.11) < 1e-9, "startup unscaled at 1.00");
assert.ok(Math.abs(mv.light1.damage - 5 * 0.95) < 1e-9, "damage scaled");
const chain = mv.light1.damage + mv.light2.damage + mv.light3.damage;
assert.ok(Math.abs(chain - 18.05) < 1e-9, `chain ~18.05 (got ${chain})`);
assert.strictEqual(mv.repulsor.damage, 5 * 0.95, "repulsor shares the weak fists");

for (const k of ["light1", "light2", "light3", "heavy", "repulsor", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.FRAME_FOR.ironman[k], `FRAME_FOR.ironman.${k}`);
}
assert.strictEqual(data.FRAME_FOR.ironman.repulsor.active, 31, "repulsor palm pose");
const spritesSrc = readFileSync(new URL("../js/render/sprites.js", import.meta.url), "utf8");
assert.ok(spritesSrc.includes("paintIronman"), "paintIronman exists");
assert.ok(spritesSrc.includes("LY_I"), "arc-reactor knockdown palette present");
for (const flag of ["repulsor: 1", "burst: 1", "beam: 1", "hover: 1"]) {
  assert.ok(spritesSrc.includes(flag), `suit pose flag ${flag}`);
}
assert.ok(spritesSrc.includes("c02828"), "red plating present");
assert.ok(spritesSrc.includes("e8b81c"), "gold faceplate present");

const sp = data.IRONMAN_SPECIALS;
assert.deepStrictEqual([sp.burst.cost, sp.unibeam.cost, sp.shelling.cost], [1, 2, 3]);
assert.deepStrictEqual([sp.burst.maxRange, sp.unibeam.maxRange, sp.shelling.maxRange], [550, 650, 700]);
assert.strictEqual(sp.burst.volleys, 3, "burst triple-tap");
assert.strictEqual(sp.burst.damage * sp.burst.volleys, 15, "burst ~15 total");
assert.strictEqual(sp.unibeam.damage, 22, "uni-beam heavy");
assert.strictEqual(sp.shelling.volleys * sp.shelling.volleyDmg, 24, "shelling ~24 total");

const GY = 452;
const ray = { x: 300, y: GY - 122 - 22, w: 500, h: 44 };
const stander = combat.hurtboxOf({ x: 500, y: GY, isLow: false, w: 108, h: 156 });
const croucher = combat.hurtboxOf({ x: 500, y: GY, isLow: true, w: 108, h: 156 });
assert.ok(combat.overlap(ray, stander), "standing foe eats the repulsor");
assert.ok(!combat.overlap(ray, croucher), "croucher ducks clean under it");

const fighterSrc = readFileSync(new URL("../js/characters/fighter.js", import.meta.url), "utf8");
for (const s of ["tryIronmanSpecial", 'jaguar: "burst"', 'phantom: "unibeam"', "tryRepulsor", "AudioFX.repulsor"]) {
  assert.ok(fighterSrc.includes(s), `fighter.js has ${s}`);
}
const specialsSrc = readFileSync(new URL("../js/combat/specials.js", import.meta.url), "utf8");
for (const s of ["tryIronmanSpecial", "updateBurst", "updateUnibeam", "updateShelling"]) {
  assert.ok(specialsSrc.includes(s), `specials.js has ${s}`);
}
const aiSrc = readFileSync(new URL("../js/ai.js", import.meta.url), "utf8");
assert.ok(aiSrc.includes("retreatGap: 170"), "AI keep-away profile");
const fxSrc = readFileSync(new URL("../js/effects.js", import.meta.url), "utf8");
assert.ok(fxSrc.includes("b.color"), "beams accept per-shot colors");
assert.ok(specialsSrc.includes("35c8ff"), "repulsor-blue beam color");
const audioSrc = readFileSync(new URL("../js/audio.js", import.meta.url), "utf8");
assert.ok(audioSrc.includes("repulsor()"), "repulsor SFX");
const screensSrc = readFileSync(new URL("../js/ui/screens.js", import.meta.url), "utf8");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(html.includes('id="roster"'), "shared roster grid container");
assert.ok(screensSrc.includes("ROSTER_ORDER"), "JS-generated draft roster");
assert.ok(screensSrc.includes('"ironman"'), "ironman on the draft roster");

const att = { x: 300, y: GY, attackDir: 1, w: 108 };
const low = { x: 500, y: GY, isLow: true, w: 108, h: 156 };
const tall = { x: 500, y: GY, isLow: false, w: 108, h: 156 };
for (const [name, move] of [["gun", data.WESKER_BASE.gun], ["repulsor", data.IRONMAN_BASE.repulsor]]) {
  const box = combat.hitboxOf(att, move);
  assert.ok(Math.abs((box.y + box.h / 2) - (GY - move.ray.top)) < 1e-9, `${name} centered`);
  assert.ok(combat.overlap(box, combat.hurtboxOf(tall)), `${name} hits standers`);
  assert.ok(!combat.overlap(box, combat.hurtboxOf(low)), `${name} ducks lows`);
}

console.log("ironman.test.mjs: all 8 groups pass");

