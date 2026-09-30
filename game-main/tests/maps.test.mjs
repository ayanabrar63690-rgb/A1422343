import assert from "node:assert";

globalThis.window = globalThis.window ?? {};

function stubCtx(painted) {
  return {
    fillStyle: "#000",
    globalAlpha: 1,
    imageSmoothingEnabled: false,
    save() {},
    restore() {},
    beginPath() {},
    moveTo() {},
    lineTo() {},
    closePath() {},
    fill() {},
    fillRect(x, y, w, h) {
      x = Math.round(x); y = Math.round(y); w = Math.round(w); h = Math.round(h);
      for (let py = y; py < y + h; py += 8) {
        for (let px = x; px < w + x; px += 8) {
          if (px >= 0 && px < 960 && py >= 0 && py < 540) painted.add(py * 960 + px);
        }
      }
    },
    createLinearGradient() {
      return { addColorStop() {} };
    },
    createRadialGradient() {
      return { addColorStop() {} };
    },
  };
}

const maps = await import("../js/maps/index.js");

for (const [id, m] of Object.entries(maps.MAPS)) {
  assert.ok(m.id === id, `${id} self-identifies`);
  assert.ok(typeof m.name === "string" && m.name.length > 0, `${id} named`);
  assert.ok(Number.isFinite(m.width) && m.width >= 1400, `${id} wide stage`);
  assert.ok(typeof m.desc === "string" && m.desc.length > 0, `${id} described`);
  assert.ok(m.particles && typeof m.particles.kind === "string" && m.particles.count > 0, `${id} particles`);
  assert.strictEqual(typeof m.draw, "function", `${id} drawable`);
}

for (const camX of [0, 320, 640]) {
  for (const [id, m] of Object.entries(maps.MAPS)) {
    const painted = new Set();
    m.draw(stubCtx(painted), camX, 7.3);
    let uncovered = 0;
    for (let y = 0; y < 540; y += 8) {
      for (let x = 0; x < 960; x += 8) {
        if (!painted.has(y * 960 + x)) uncovered++;
      }
    }
    assert.strictEqual(uncovered, 0, `${id} full-frame at camX ${camX} (${uncovered} voids)`);
  }
}

const a = new Set();
maps.MAPS.forest.draw(stubCtx(a), 123, 4.2);
const b = new Set();
maps.MAPS.forest.draw(stubCtx(b), 123, 4.2);
assert.deepStrictEqual([...a].sort((x, y) => x - y), [...b].sort((x, y) => x - y), "deterministic at fixed t");

const seen = new Set();
for (let i = 0; i < 60; i++) seen.add(maps.pickMap("random").id);
assert.deepStrictEqual(seen, new Set(["forest", "lab", "city"]), "random covers all stages");
assert.strictEqual(maps.pickMap("nope").id, "forest", "unknown falls back");

console.log("maps.test.mjs: all 5 groups pass");
