import assert from "node:assert";
import {
  createMatch, activeKind, benchKinds, onKO, awardRound, timeoutWinner,
  tagTarget, saveSlot, loadSlot, aliveOthers, fullHp,
  ROUND_TIME, ROUND_TARGET, TEAM_SIZES,
} from "../js/match.js";

let m = createMatch(["wesker", "wolverine"], ["homelander", "wolverine"]);
assert.strictEqual(activeKind(m.p1), "wesker");
assert.deepStrictEqual(benchKinds(m.p1), ["wolverine"]);
assert.strictEqual(onKO(m, "p1"), "tag");
assert.strictEqual(activeKind(m.p1), "wolverine");
assert.deepStrictEqual(benchKinds(m.p1), []);
assert.strictEqual(onKO(m, "p1"), "p2");

m = createMatch(["wesker"], ["homelander"]);
assert.strictEqual(ROUND_TARGET, 2);
assert.strictEqual(awardRound(m, "p1"), "next");
assert.strictEqual(m.round, 2);
assert.strictEqual(m.p1.wins, 1);
assert.strictEqual(m.p1.idx, 0, "tag index resets for the new round");
assert.strictEqual(awardRound(m, "p2"), "next");
assert.strictEqual(awardRound(m, "p1"), "match");
assert.ok(m.over && m.winner === "p1");

m = createMatch(["wesker"], ["homelander"]);
assert.strictEqual(awardRound(m, "draw"), "next");
assert.strictEqual(m.p1.wins + m.p2.wins, 0);

assert.strictEqual(timeoutWinner(0.5, 0.4, 0, 0), "p1");
assert.strictEqual(timeoutWinner(0.4, 0.5, 1, 0), "p2");
assert.strictEqual(timeoutWinner(0.5, 0.5, 1, 0), "p1");
assert.strictEqual(timeoutWinner(0.5, 0.5, 1, 1), "draw");

assert.strictEqual(ROUND_TIME, 99);
assert.deepStrictEqual([...TEAM_SIZES], [1, 2, 3]);

m = createMatch(["wesker", "homelander", "wolverine"], ["wesker"], 2);
assert.strictEqual(tagTarget(m.p1, "next"), 1);
assert.strictEqual(tagTarget(m.p1, "alt"), 2);
m.p1.idx = 1;
assert.strictEqual(tagTarget(m.p1, "next"), 2);
assert.strictEqual(tagTarget(m.p1, "alt"), 0);
m.p1.idx = 2;
assert.strictEqual(tagTarget(m.p1, "next"), 0, "wraps past the end");
assert.strictEqual(tagTarget(m.p2, "next"), -1, "solo cannot tag");
assert.strictEqual(tagTarget(m.p2, "alt"), -1);
m.p1.dead[0] = true;
m.p1.idx = 2;
assert.strictEqual(tagTarget(m.p1, "next"), 1);
assert.deepStrictEqual(aliveOthers(m.p1), [1]);

m = createMatch(["wesker", "wolverine"], ["homelander"]);
saveSlot(m.p1, 37, 120);
m.p1.idx = 1;
assert.deepStrictEqual(loadSlot(m.p1, 0), { hp: 37, rage: 120, vuln: false });
assert.deepStrictEqual(loadSlot(m.p1, 1), { hp: fullHp("wolverine"), rage: 0, vuln: false });
m.p1.idx = 0;
saveSlot(m.p1, 37, 120, true);
assert.deepStrictEqual(loadSlot(m.p1, 0), { hp: 37, rage: 120, vuln: true }, "vuln survives the tag");

console.log("match.test.mjs: all 7 groups pass");

