// Wolverine regression checks (headless, no DOM).
// Run: node tests/wolverine.test.mjs
import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const chars = await import("../js/characters/data.js");
const data = await import("../js/combat/data.js");
const combat = await import("../js/combat/combat.js");

// 1. Roster + stats
assert.ok(chars.CHARACTERS.wolverine, "wolverine in CHARACTERS");
assert.deepStrictEqual({ ...chars.CHARACTERS.wolverine.stats },
  { attackSpeed: 1.25, moveSpeed: 1.10, damage: 1.08, health: 0.95 });
assert.strictEqual(Math.round(100 * chars.CHARACTERS.wolverine.stats.health), 95);

// 2. Normals: chip + bleed on every slash, short boxes, chain routing
for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy"]) {
  const m = data.WOLVERINE_BASE[k];
  assert.ok(m, `WOLVERINE_BASE.${k}`);
  assert.ok(m.chip >= 1, `${k} chips guard (got ${m.chip})`);
  assert.strictEqual(m.bleed, 1, `${k} applies bleed`);
}
assert.strictEqual(data.WOLVERINE_BASE.light1.chainTo, "light2");
assert.strictEqual(data.WOLVERINE_BASE.light2.chainTo, "light3");
assert.strictEqual(data.WOLVERINE_BASE.light3.level, "low"); // cracks stand-guard
assert.ok(data.WOLVERINE_BASE.light1.hit.w <= 72, "short reach vs Wesker 78-88");
assert.ok(data.WOLVERINE_BASE.heavy.lunge === 48, "heavy lunges to compensate");

// 3. Tempo scaling (M7 precedent): attackSpeed divides startup, multiplies damage
const mv = data.movesFor("wolverine");
assert.ok(Math.abs(mv.light1.startup - 0.08 / 1.25) < 1e-9, "startup scaled");
assert.ok(Math.abs(mv.light1.damage - 5 * 1.08) < 1e-9, "damage scaled");

// 4. FRAME_FOR covers all 7 wolverine moves, indices 18-23 exist in poses table
for (const k of ["light1", "light2", "light3", "heavy", "crouchLight", "airLight", "airHeavy"]) {
  assert.ok(data.FRAME_FOR.wolverine[k], `FRAME_FOR.wolverine.${k}`);
}
const spritesSrc = readFileSync(new URL("../js/render/sprites.js", import.meta.url), "utf8");
assert.ok(spritesSrc.includes("paintWolverine"), "paintWolverine exists");
assert.ok(spritesSrc.includes("HUNCH") || spritesSrc.includes("Hunch") || spritesSrc.includes("hunch"), "hunched stance present");
assert.ok(spritesSrc.includes("ANIMALISTIC mask") || spritesSrc.includes("yellow mask") || spritesSrc.includes("Blue horns"), "animalistic mask present");
assert.ok(spritesSrc.includes("clawFist"), "dual claw-fists present");
assert.ok(spritesSrc.includes("LY_X"), "feral knockdown palette present");
for (const flag of ["slash: 1", "cross: 1", "dive: 1"]) {
  assert.ok(spritesSrc.includes(flag), `attack pose flag ${flag}`);
}

// 5. Specials data: costs 1/2/3, ranges, chip+bleed, heal + shred ticks
const sp = data.WOLVERINE_SPECIALS;
assert.deepStrictEqual([sp.rush.cost, sp.barrage.cost, sp.ragemode.cost], [1, 2, 3]);
assert.deepStrictEqual([sp.rush.maxRange, sp.barrage.maxRange, sp.ragemode.maxRange], [450, 400, 450]);
assert.ok(sp.rush.chip === 4 && sp.rush.bleed === 1, "rush pierces guard");
assert.strictEqual(sp.barrage.hits.length, 5, "barrage 5 hits");
assert.strictEqual(sp.barrage.hits.reduce((a, h) => a + h.damage, 0), 32, "barrage ~32 direct");
assert.strictEqual(sp.ragemode.heal, 15, "surge burst heal");
assert.strictEqual(sp.ragemode.shredTicks, 5, "surge shred ticks");
assert.deepStrictEqual({ ...data.REGEN }, { delay: 2.5, rate: 2.0 });
assert.deepStrictEqual({ ...data.BLEED }, { ticks: 3, per: 1, interval: 0.65 });

// 6. Guard-pierce resolution: blocked claws chip + light bleed; clean hits full bleed
const mk = (state, blockLow) => ({
  x: 0, y: 452, facing: 1, attackDir: 1, blockLow, isLow: false, hp: 100,
  state, grounded: true, invulnT: 0, addRage() {},
  takeHit(m, d) { this.hp -= m.damage; },
  takeBlocked(m, d) { this.hp -= (m.chip || 0); },
  applyBleed(n) { this._bleed = n; },
});
const claw = { damage: 5, hitstun: 0.3, knockback: 200, hitstop: 0.05, level: "mid", blockstun: 0.2, blockPush: 200, chip: 3, bleed: 1, hit: { w: 64, top: 120, h: 68 } };
const att = mk("IDLE"); att.x = 0;
const blk = mk("BLOCK", false); blk.x = 60; blk.facing = -1;
const c1 = combat.resolveStrike(att, blk, claw);
assert.strictEqual(c1.type, "block");
assert.strictEqual(blk.hp, 97, "chip through guard");
assert.strictEqual(blk._bleed, 1, "blocked bleed tick");
const opn = mk("IDLE"); opn.x = 60; opn.facing = -1;
const c2 = combat.resolveStrike(att, opn, claw);
assert.strictEqual(c2.type, "hit");
assert.strictEqual(opn.hp, 95);
assert.strictEqual(opn._bleed, 3, "clean full bleed");

// 7. Wiring: fighter regen/bleed fields + slot map, specials entry, AI, audio, select UI
const fighterSrc = readFileSync(new URL("../js/characters/fighter.js", import.meta.url), "utf8");
for (const s of ["sinceDamageT", "bleedN", "rushLowT", "applyBleed", "tryWolverineSpecial", 'jaguar: "rush"', 'phantom: "barrage"']) {
  assert.ok(fighterSrc.includes(s), `fighter.js has ${s}`);
}
const specialsSrc = readFileSync(new URL("../js/combat/specials.js", import.meta.url), "utf8");
for (const s of ["tryWolverineSpecial", "updateRush", "updateBarrage", "updateXRage", "f.hp = Math.min(f.maxHp, f.hp + spec.heal)"]) {
  assert.ok(specialsSrc.includes(s), `specials.js has ${s}`);
}
const aiSrc = readFileSync(new URL("../js/ai.js", import.meta.url), "utf8");
assert.ok(aiSrc.includes('me.kind === "wolverine"'), "AI wolverine branch");
const audioSrc = readFileSync(new URL("../js/audio.js", import.meta.url), "utf8");
assert.ok(audioSrc.includes("snikt"), "snikt SFX");
assert.ok(audioSrc.includes("slash()"), "slash SFX");
const fxSrc = readFileSync(new URL("../js/effects.js", import.meta.url), "utf8");
assert.ok(fxSrc.includes("slash(x, y"), "slash FX");
const mainSrc = readFileSync(new URL("../js/main.js", import.meta.url), "utf8");
assert.ok(mainSrc.includes("Sparks.slash"), "slash arcs on contact");
const configSrc = readFileSync(new URL("../js/config.js", import.meta.url), "utf8");
assert.ok(configSrc.includes("wolvieSpin"), "spin toggle setting");
assert.ok(fighterSrc.includes("SETTINGS.wolvieSpin"), "spin turnaround in draw");
// Right-hand strikes: no strike extends toward -x; all claws lead on +x.
const wolvieSrc = spritesSrc.slice(spritesSrc.indexOf("function paintWolverine"), spritesSrc.indexOf("const LY_X"));
assert.ok(!wolvieSrc.includes("clawFist(cx - 14") && !wolvieSrc.includes("clawFist(cx - 13, 20"), "no left-hand claw leads");
assert.ok(wolvieSrc.includes("#8a3aff") && wolvieSrc.includes("#ff3b1a"), "purple-red spin trails");
assert.ok(fxSrc.includes("#8a3aff"), "slash FX purple-red");
const screensSrc = readFileSync(new URL("../js/ui/screens.js", import.meta.url), "utf8");
assert.ok(screensSrc.includes("btn-spin"), "menu toggle wiring");
const html = readFileSync(new URL("../index.html", import.meta.url), "utf8");
assert.ok(html.includes("btn-spin"), "menu toggle button");
assert.ok(html.includes('data-c="wolverine"'), "select-screen buttons");

console.log("wolverine.test.mjs: all 7 groups pass");
