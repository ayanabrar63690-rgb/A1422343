import assert from "node:assert";

function makeEl(tag) {
  const el = {
    tag, children: [], dataset: {}, style: {}, title: "",
    _text: "", _html: "", onclick: null, onmouseenter: null,
    classList: {
      _s: new Set(),
      toggle: (c, f) => { f ?? true ? el.classList._s.add(c) : el.classList._s.delete(c); },
      add: (c) => el.classList._s.add(c),
      remove: (c) => el.classList._s.delete(c),
      contains: (c) => el.classList._s.has(c),
    },
    appendChild(c) { el.children.push(c); return c; },
    append(...cs) { for (const c of cs) el.children.push(c); },
    set innerHTML(v) { el.children = []; el._html = v; },
    get innerHTML() { return el._html; },
    set textContent(v) { el._text = v; },
    get textContent() { return el._text; },
  };
  created.push(el);
  return el;
}
const created = [];
const byId = {};
const noopCtx = () => new Proxy({}, {
  get: (t, p) => (...a) => {},
  set: () => true,
});
globalThis.window = globalThis.window ?? {};
globalThis.document = {
  createElement: (tag) => {
    if (tag === "canvas") return { width: 0, height: 0, style: {}, getContext: () => noopCtx() };
    return makeEl(tag);
  },
  getElementById: (id) => (byId[id] ??= makeEl("#" + id)),
  querySelectorAll: (sel) => {
    if (sel === "[data-side]") {
      return [1, 2].map((n) => {
        const b = makeEl("button");
        b.dataset.side = String(n);
        return b;
      });
    }
    if (sel === "[data-team]") {
      return [1, 2, 3].map((n) => {
        const b = makeEl("button");
        b.dataset.team = String(n);
        return b;
      });
    }
    if (sel === "[data-diff]") {
      return ["easy", "medium", "extreme", "2p"].map((d) => {
        const b = makeEl("button");
        b.dataset.diff = d;
        return b;
      });
    }
    if (sel === "[data-cpu-draft]") {
      const b = makeEl("button");
      b.dataset.cpuDraft = "1";
      return [b];
    }
    return [];
  },
};

const { initScreens } = await import("../js/ui/screens.js");
const { CHARACTERS } = await import("../js/characters/data.js");

const sel = { p1: ["wesker", "wolverine"], p2: ["homelander", "wolverine"], teamSize: 2, diff: "medium" };
initScreens(sel, { onState() {}, onPickMap() {}, onQuit() {}, onSwapMap() {} });
const cards = created.filter((e) => e.tag === "button" && e.children.length === 4 &&
  e.children.some((c) => c._text && CHARACTERS[c._text.toLowerCase().replace(" ", "")]));
assert.strictEqual(new Set(cards.map((c) => c.children[1]._text)).size, 6, "one card per fighter");
const findCard = (name) => cards.find((c) => c.children[1]._text === name);
assert.ok(findCard("HULK") && findCard("IRON MAN") && findCard("THOR"), "new fighters on the grid");

findCard("HULK").onclick();
assert.deepStrictEqual(sel.p1, ["hulk"]);
findCard("WESKER").onclick();
assert.deepStrictEqual(sel.p1, ["hulk", "wesker"]);

const wired = (ds) => created.filter((e) => e.tag === "button" && e.dataset[ds] && e.onclick);
const cpuBtn = created.find((e) => e.tag === "button" && e.dataset.cpuDraft && e.onclick);
assert.ok(cpuBtn, "CPU DRAFT button wired");
cpuBtn.onclick();

assert.deepStrictEqual(sel.p2, ["ironman", "hulk"], "CPU answers the current P1 team");
const sideBtns = wired("side");
sideBtns.find((b) => b.dataset.side === "2").onclick();
findCard("HOMELANDER").onclick();
assert.deepStrictEqual(sel.p2, ["homelander"]);
sideBtns.find((b) => b.dataset.side === "1").onclick();
const freshFrom = created.length;
findCard("HULK").onclick();
sideBtns.find((b) => b.dataset.side === "1").onclick();
findCard("WESKER").onclick();
assert.deepStrictEqual(sel.p1, ["hulk", "wesker"]);

const stripBtns = () =>
  created.slice(freshFrom).filter((e) => e.tag === "button" && e.children.some((c) => c.tag === "span"));
const weskerBtn = stripBtns().find((b) => b.children.some((c) => c._text === "WESKER"));
weskerBtn.onclick();
assert.deepStrictEqual(sel.p1, ["hulk"], "non-lead removed");
const leadBtn = stripBtns().find((b) => b.children.some((c) => c._text === "HULK"));
leadBtn.onclick();
assert.deepStrictEqual(sel.p1, ["hulk"], "lead refuses removal");

const teamBtns = wired("team");
teamBtns.find((b) => b.dataset.team === "3").onclick();
assert.strictEqual(sel.teamSize, 3);
assert.strictEqual(sel.p1.length, 3, "short team padded with the lead");
teamBtns.find((b) => b.dataset.team === "1").onclick();
assert.ok(sel.p1.length === 1 && sel.p2.length === 1, "over-full teams trimmed");

console.log("ui.test.mjs: all 5 groups pass");

