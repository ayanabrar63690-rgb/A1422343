import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const chars = await import("../js/characters/data.js");
const data = await import("../js/combat/data.js");
const combat = await import("../js/combat/combat.js");

assert.ok(chars.CHARACTERS.spiderman, "spiderman in CHARACTERS");
assert.deepStrictEqual({ ...chars.CHARACTERS.spiderman.stats },
  { attackSpeed: 1.15, moveSpeed: 1.05, damage: 0.50, health: 0.95 });
assert.strictEqual(Math.round(100 * chars.CHARACTERS.spiderman.stats.health), 95);

for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.SPIDERMAN_BASE[k], `SPIDERMAN_BASE.${k}`);
}
assert.strictEqual(data.SPIDERMAN_BASE.light1.chainTo, "light2");
assert.strictEqual(data.SPIDERMAN_BASE.light2.chainTo, "light3");
assert.strictEqual(data.SPIDERMAN_BASE.light3.level, "low");
assert.strictEqual(data.SPIDERMAN_BASE.heavy.level, "high", "web hammer cracks crouchers");

const mv = data.movesFor("spiderman");
assert.ok(Math.abs(mv.light1.startup - 0.09 / 1.15) < 1e-9, "startup scaled");
assert.ok(Math.abs(mv.light1.damage - 5 * 0.50) < 1e-9, "damage scaled");
const chain = mv.light1.damage + mv.light2.damage + mv.light3.damage;
assert.ok(Math.abs(chain - 9.5) < 1e-9, `chain ~9.5 (got ${chain})`);

for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.FRAME_FOR.spiderman[k], `FRAME_FOR.spiderman.${k}`);
}
const spritesSrc = readFileSync(new URL("../js/render/sprites.js", import.meta.url), "utf8");
assert.ok(spritesSrc.includes("paintSpiderman"), "paintSpiderman exists");
assert.ok(spritesSrc.includes("LY_SP"), "spidey knockdown palette present");
for (const flag of ["webshoot: 1", "webyank: 1", "webstorm: 1", "spideySwing: 1"]) {
  assert.ok(spritesSrc.includes(flag), `spidey pose flag ${flag}`);
}

const sp = data.SPIDERMAN_SPECIALS;
assert.deepStrictEqual([sp.webshot.cost, sp.yank.cost, sp.maelstrom.cost], [1, 2, 3]);
assert.deepStrictEqual([sp.webshot.maxRange, sp.yank.maxRange, sp.maelstrom.maxRange], [550, 420, 450]);
assert.strictEqual(sp.webshot.webRoot, 0.7, "mummy root lasts 0.7s");
assert.strictEqual(sp.zip.costPts, 50, "zip costs half a bar");
assert.strictEqual(sp.zip.dist, 280, "zip distance");
assert.ok(sp.zip.swing > 0 && sp.zip.crouch > 0, "zip travels over time, no blink");
assert.ok(sp.swing, "air web-swing spec exists");
assert.strictEqual(sp.swing.cooldown, 0.90, "swing cooldown");
assert.strictEqual(sp.maelstrom.finale, 12, "cocoon finale");

// webshot ray ducks crouchers (mid-level web band)
const GY = 452;
const att = { x: 300, y: GY, attackDir: 1, w: 108 };
const mkRay = (top, h, len) => ({ ray: { len, top, h } });
const box = combat.hitboxOf(att, mkRay(sp.webshot.rayTop, sp.webshot.rayH, sp.webshot.rayLen));
const low = { x: 500, y: GY, isLow: true, w: 108, h: 156 };
const tall = { x: 500, y: GY, isLow: false, w: 108, h: 156 };
assert.ok(combat.overlap(box, combat.hurtboxOf(tall)), "web hits standers");
assert.ok(!combat.overlap(box, combat.hurtboxOf(low)), "crouchers duck the web");

const fighterSrc = readFileSync(new URL("../js/characters/fighter.js", import.meta.url), "utf8");
for (const s of ["trySpidermanSpecial", 'jaguar: "webshot"', 'phantom: "yank"', "tryWebZip", "trySwing", "webT", "zipCD", "swingCD", "drawWebs"]) {
  assert.ok(fighterSrc.includes(s), `fighter.js has ${s}`);
}
assert.ok(fighterSrc.includes("this.webT = 0"), "hits break the web");
const specialsSrc = readFileSync(new URL("../js/combat/specials.js", import.meta.url), "utf8");
for (const s of ["trySpidermanSpecial", "trySpidermanZip", "trySpidermanSwing", "updateWebshot", "updateYank", "updateMaelstrom", "updateZip", "updateSwing", "swingWebLine", "Math.sin(Math.PI", "foe.webT = spec.webRoot", "f.rage - spec.costPts"]) {
  assert.ok(specialsSrc.includes(s), `specials.js has ${s}`);
}
const fxSrc = readFileSync(new URL("../js/effects.js", import.meta.url), "utf8");
assert.ok(fxSrc.includes("web("), "web splat FX");
assert.ok(fxSrc.includes("webstrand"), "web strand particles");
assert.ok(fxSrc.includes("WebLines"), "white web-line FX system");
const aiSrc = readFileSync(new URL("../js/ai.js", import.meta.url), "utf8");
assert.ok(aiSrc.includes("spiderman:"), "AI profile row");
assert.ok(aiSrc.includes("tryWebZip"), "AI zips in");
const screensSrc = readFileSync(new URL("../js/ui/screens.js", import.meta.url), "utf8");
assert.ok(screensSrc.includes('"spiderman"'), "spiderman on the draft roster");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(html.includes("SPIDER-MAN"), "howto covers spidey");
const audioSrc = readFileSync(new URL("../js/audio.js", import.meta.url), "utf8");
assert.ok(audioSrc.includes("thwip()"), "thwip SFX");

console.log("spiderman.test.mjs: all groups pass");
