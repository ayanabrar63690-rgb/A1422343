import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const chars = await import("../js/characters/data.js");
const data = await import("../js/combat/data.js");
const combat = await import("../js/combat/combat.js");
const unlock = await import("../js/ui/unlock.js");

// --- roster entry ---
assert.ok(chars.CHARACTERS.uroboros, "uroboros in CHARACTERS");
assert.strictEqual(chars.CHARACTERS.uroboros.hidden, true, "hidden until code entered");
assert.deepStrictEqual({ ...chars.CHARACTERS.uroboros.stats },
  { attackSpeed: 1.05, moveSpeed: 0.95, damage: 1.35, health: 1.45 });
assert.strictEqual(Math.round(100 * chars.CHARACTERS.uroboros.stats.health), 145);

// --- normals: highest chain in the game ---
for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.UROBOROS_BASE[k], `UROBOROS_BASE.${k}`);
}
assert.strictEqual(data.UROBOROS_BASE.light1.chainTo, "light2");
assert.strictEqual(data.UROBOROS_BASE.light2.chainTo, "light3");
assert.strictEqual(data.UROBOROS_BASE.light3.level, "low");
assert.strictEqual(data.UROBOROS_BASE.heavy.level, "high");
assert.ok(data.UROBOROS_BASE.light1.hit.w >= 90, "tentacle reach beats hulk 84+");

const mv = data.movesFor("uroboros");
const chain = mv.light1.damage + mv.light2.damage + mv.light3.damage;
assert.ok(Math.abs(chain - 37.80) < 1e-9, `chain ~37.80 (got ${chain})`);
for (const other of ["wesker", "homelander", "wolverine", "hulk", "ironman", "thor"]) {
  const om = data.movesFor(other);
  const oc = om.light1.damage + om.light2.damage + om.light3.damage;
  assert.ok(chain > oc, `uroboros chain ${chain.toFixed(2)} > ${other} ${oc.toFixed(2)}`);
}

// --- specials ---
const sp = data.UROBOROS_SPECIALS;
assert.deepStrictEqual([sp.wrap.cost, sp.rock.cost, sp.impale.cost], [1, 2, 3]);
assert.strictEqual(sp.wrap.damage, 18, "wrap+throw");
assert.strictEqual(sp.rock.damage, 26, "rock squash");
assert.strictEqual(sp.impale.pierce, 10, "pierce ten");
assert.strictEqual(data.DECAY.ticks * data.DECAY.per, 30, "decay thirty");
assert.deepStrictEqual({ ...data.UROBOROS_REGEN }, { delay: 3.5, rate: 1.0 }, "slower than wolverine");

// --- vuln math ---
assert.strictEqual(combat.vulnMult({ vuln: false }, false), 1, "no debuff, no mult");
assert.strictEqual(combat.vulnMult({ vuln: false }, true), 1, "heat needs the debuff");
assert.strictEqual(combat.vulnMult({ vuln: true }, false), 1.10, "kinetic +10%");
assert.strictEqual(combat.vulnMult({ vuln: true }, true), 1.25, "heat +25% total");

// --- heat flags: exact set ---
const hot = [];
if (data.IRONMAN_BASE.repulsor.heat) hot.push("repulsor");
const spSrc = readFileSync(new URL("../js/combat/specials.js", import.meta.url), "utf8");
for (const [name, probe] of [
  ["laser", "function laserMove"],
  ["burst", "function burstMove"],
  ["unibeam", "function unibeamMove"],
  ["shelling", "volleyChip, heat: true"],
  ["lightning-heat", "blockPush: spec.blockPush, chip: spec.chip, heat: true"],
  ["godblast-tick", "chip: spec.tickChip, heat: true"],
]) {
  const i = spSrc.indexOf(probe);
  assert.ok(i >= 0, `${name} builder present`);
  if (name !== "repulsor") {
    const seg = spSrc.slice(i, i + 420);
    assert.ok(seg.includes("heat: true"), `${name} flagged heat`);
  }
}
assert.deepStrictEqual(hot, ["repulsor"], "repulsor poke is heat");
// kinetic builders stay clean
for (const probe of ["function jaguarMove", "function gammaMove", "rushMove(spec)"]) {
  const i = spSrc.indexOf(probe);
  const seg = spSrc.slice(i, i + 420);
  assert.ok(!seg.includes("heat"), `${probe} stays kinetic`);
}

// --- painter ---
const spritesSrc = readFileSync(new URL("../js/render/sprites.js", import.meta.url), "utf8");
assert.ok(spritesSrc.includes("paintUroboros"), "paintUroboros exists");
assert.ok(spritesSrc.includes("LY_U2"), "knockdown palette present");
for (const flag of ["lash === 1", "slam2", "coil", "rockhold", "impale"]) {
  assert.ok(spritesSrc.includes(flag), `biomass pose flag ${flag}`);
}
for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.FRAME_FOR.uroboros[k], `FRAME_FOR.uroboros.${k}`);
}

// --- fighter wiring (source-level) ---
const fighterSrc = readFileSync(new URL("../js/characters/fighter.js", import.meta.url), "utf8");
for (const s of ["tryUroborosSpecial", 'jaguar: "wrap"', 'phantom: "rock"', "applyDecay", "UROBOROS_REGEN", "uroboros: 1.32", "this.vuln = false"]) {
  assert.ok(fighterSrc.includes(s), `fighter.js has ${s}`);
}
assert.ok(!/tryShadow[\s\S]{0,80}uroboros/.test(fighterSrc), "no shadow path for uroboros");
assert.ok(!/trySamuraiEdge[\s\S]{0,80}uroboros/.test(fighterSrc), "no samurai edge for uroboros");

// --- unlock code ---
assert.strictEqual(unlock.HIDDEN_CODE, "uroboros", "the code is uroboros");
let b = { buf: "", hit: false };
for (const ch of "xxuroboro") {
  const r = unlock.pushCode(b.buf, ch);
  b = r;
  assert.ok(!r.hit, "no early match");
}
b = unlock.pushCode(b.buf, "s");
assert.ok(b.hit && b.buf === "uroboros", "code matches at the end");
const r2 = unlock.pushCode("uroboros", "x");
assert.ok(!r2.hit && r2.buf === "uroborosx".slice(-8), "buffer slides");
const fakeStore = { _v: {}, getItem(k) { return this._v[k] ?? null; }, setItem(k, v) { this._v[k] = v; } };
assert.ok(!unlock.isUroborosUnlocked(fakeStore), "locked by default");
unlock.unlockUroboros(fakeStore);
assert.ok(unlock.isUroborosUnlocked(fakeStore), "unlocked after code");

// --- roster + match (source-level) ---
const screensSrc = readFileSync(new URL("../js/ui/screens.js", import.meta.url), "utf8");
assert.ok(screensSrc.includes('"uroboros"'), "uroboros on the draft roster");
assert.ok(screensSrc.includes("visibleRoster"), "roster hides the locked fighter");
const matchSrc = readFileSync(new URL("../js/match.js", import.meta.url), "utf8");
assert.ok(matchSrc.includes("vuln"), "slots persist vuln");
const mainSrc = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
assert.ok(mainSrc.includes("pollMenuCode"), "menu listens for the code");
const audioSrc = readFileSync(new URL("../js/audio.js", import.meta.url), "utf8");
assert.ok(audioSrc.includes("squelch()"), "tentacle SFX");

console.log("uroboros.test.mjs: all groups pass");
