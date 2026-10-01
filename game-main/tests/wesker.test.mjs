import assert from "node:assert";
import { readFileSync } from "node:fs";

globalThis.window = globalThis.window ?? {};

const data = await import("../js/combat/data.js");

// Wesker trickle regen: same mechanic as Wolverine, much slower.
assert.deepStrictEqual({ ...data.WESKER_REGEN }, { delay: 4.0, rate: 0.5 });
assert.ok(data.WESKER_REGEN.rate < data.REGEN.rate, "slower than wolverine");
assert.ok(data.WESKER_REGEN.delay > data.REGEN.delay, "kicks in later than wolverine");

const fighterSrc = readFileSync(new URL("../js/characters/fighter.js", import.meta.url), "utf8");
for (const s of ["WESKER_REGEN", 'this.kind === "wesker"']) {
  assert.ok(fighterSrc.includes(s), `fighter.js has ${s}`);
}

console.log("wesker.test.mjs: all groups pass");
