import { VIEW_W, VIEW_H, STATE, GROUND_Y, MOVE } from "./config.js";
import { arena, setArena, arenaCenter } from "./arena.js";
import { initInput, keys } from "./input.js";
import { Camera } from "./camera.js";
import { Fighter, FState } from "./characters/fighter.js";
import { AIController } from "./ai.js";
import { pickMap, MAPS } from "./maps/index.js";
import { separate } from "./physics.js";
import { Hitstop, hurtboxOf, hitboxOf } from "./combat/combat.js";
import { RAGE } from "./combat/data.js";
import { Particles, drawShadow, Sparks, Clones, Beams, Missiles, Bolts, FlyingHammer } from "./effects.js";
import { initScreens } from "./ui/screens.js";
import { pushCode, isUroborosUnlocked, unlockUroboros } from "./ui/unlock.js";
import { buildPortrait } from "./render/sprites.js";
import { CHARACTERS } from "./characters/data.js";
import { AudioFX } from "./audio.js";
import { connectNet, relayURL, lastNetIP, saveNetIP } from "./net/client.js";
import { snapFighter, applyFighter, frameOf, frameFor, armSfxCapture } from "./net/sync.js";
import { createMatch, activeKind, benchKinds, onKO, awardRound, timeoutWinner, tagTarget, saveSlot, loadSlot, ROUND_TIME } from "./match.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
ctx.imageSmoothingEnabled = false;

const sel = { p1: ["wesker", "wolverine"], p2: ["homelander", "wolverine"], teamSize: 2, diff: "medium" };
let state = STATE.MENU;
let map = MAPS.forest;
let ai = null;
let match = createMatch(sel.p1, sel.p2);
const DIFF_LABEL = Object.freeze({ easy: "EASY", medium: "MEDIUM", extreme: "EXTREME", "2p": "2P VERSUS" });

let particles = new Particles(map.particles.kind, map.particles.count, { w: arena.width, h: VIEW_H });
let p1 = new Fighter(activeKind(match.p1), arenaCenter() - 120, GROUND_Y);
let p2 = new Fighter(activeKind(match.p2), arenaCenter() + 120, GROUND_Y);
const cam = new Camera();
let elapsed = 0;

let koSeen = false, koT = 0, pending = null;
let roundTime = ROUND_TIME;
let announce = null;

let hudPort = null;

let prevKeys = new Set();

let tap1 = { key: null, t: -9 };
let tap2 = { key: null, t: -9 };

// ---- LAN netplay (host sims, guest renders snapshots) ----
const net = {
  mode: "off", // off | host | guest
  api: null,
  guestOn: false,
  keys: new Set(), // latest guest P2 keys (host-side)
  prev: new Set(),
  snap: null, // latest snapshot (guest-side)
  sfx: [],
  disarmSfx: null,
  guestKinds: "",
  lastKeys: null, // last input payload sent (guest dedup)
  snapTimes: [], // recent snapshot arrival times (link-rate meter)
  linkTick: 0,
};

function netStatus(txt) {
  const el = document.getElementById("net-status");
  if (el) {
    el.textContent = txt;
    el.classList.toggle("hidden", !txt);
  }
}

function teardownNet() {
  if (net.disarmSfx) {
    net.disarmSfx();
    net.disarmSfx = null;
  }
  if (net.api) {
    net.api.close();
    net.api = null;
  }
  net.mode = "off";
  net.guestOn = false;
  net.snap = null;
  net.guestKinds = "";
  netStatus("");
  document.getElementById("net-drop")?.classList.add("hidden");
}

function hostLabel() {
  document.getElementById("fight-label").textContent =
    `${map.name} — HOSTING (P1 you) — guest ${net.guestOn ? "CONNECTED" : "waiting…"}`;
}

function onNetMsg(m) {
  if (m.t === "role") {
    if (m.role === "host" && netWanted === "host") {
      net.mode = "host";
      net.disarmSfx = armSfxCapture(AudioFX, net.sfx);
      netStatus("hosting — waiting for guest P2…");
    } else if (m.role === "guest" && netWanted === "guest") {
      net.mode = "guest";
      netStatus("connected! now START a fight on the host (START → fighters → map)");
    } else {
      netStatus(m.role === "host" ? "relay already has a host — reload to retry" : "relay already has a guest — reload to retry");
      net.api?.close();
      net.api = null;
    }
    return;
  }
  if (m.t === "peer" && net.mode === "host") {
    net.guestOn = !!m.on;
    if (!m.on) {
      ai = new AIController("medium");
      net.keys = new Set();
      net.prev = new Set();
    }
    if (state === STATE.FIGHT) hostLabel();
    else netStatus(m.on ? "guest connected! press START, pick fighters + map" : "hosting — waiting for guest P2…");
    return;
  }
  if (m.t === "in" && net.mode === "host") {
    net.keys = new Set(Array.isArray(m.keys) ? m.keys : []);
    net.guestOn = true;
    return;
  }
  if (m.t === "snap" && net.mode === "guest") {
    net.snap = m;
    net.snapTimes.push(performance.now());
    return;
  }
  if (m.t === "bye" && net.mode === "guest") {
    netDrop("host left — back to menu");
    return;
  }
  if (m.t === "drop") {
    if (net.mode === "guest") netDrop("connection lost — back to menu");
    else if (net.mode === "host") {
      net.guestOn = false;
      ai = new AIController("medium");
      if (state === STATE.FIGHT) hostLabel();
      else netStatus("guest left — hosting…");
    }
  }
}

let netWanted = null;

function netConnect(want, ip) {
  teardownNet();
  netWanted = want;
  saveNetIP(want === "guest" ? ip || "" : lastNetIP());
  const port = Number(document.getElementById("net-port")?.value || 8125) || 8125;
  const url = relayURL(ip || "localhost", port);
  const onLinkFail = () => {
    if (net.api) {
      net.api.close();
      net.api = null;
    }
    net.mode = "off";
    netWanted = null;
    netStatus(
      want === "host"
        ? "relay not found — run this first:  node net/relay.js 8125"
        : `can't reach ${url} — check IP, port, and that the host runs the relay`
    );
  };
  net.api = connectNet(url, onNetMsg, onLinkFail);
  netStatus(want === "host" ? "starting relay link…" : `connecting to ${ip || "localhost"}…`);
}

function netDrop(msg) {
  teardownNet();
  state = STATE.MENU;
  screens.show("screen-menu");
  netStatus(msg);
  const drop = document.getElementById("net-drop");
  if (drop) {
    drop.textContent = msg;
    drop.classList.remove("hidden");
    setTimeout(() => drop.classList.add("hidden"), 3000);
  }
  setTimeout(() => netStatus(""), 3000);
}

function buildSnap() {
  return {
    t: "snap",
    mapId: map.id,
    p1: snapFighter(p1, frameOf(p1)),
    p2: snapFighter(p2, frameOf(p2)),
    fx: {
      beams: Beams.list.map((b) => ({ x1: b.x1, y1: b.y1, x2: b.x2, y2: b.y2, t: b.t, life: b.life, color: b.color })),
      missiles: Missiles.list.map((m) => ({ sx: m.sx, sy: m.sy, tx: m.tx, ty: m.ty, t: m.t, fall: m.fall })),
      bolts: Bolts.list.map((b) => ({ segs: [...b.segs], yGround: b.yGround, yTop: b.yTop, t: b.t, life: b.life })),
      hammer: FlyingHammer.cur ? { ...FlyingHammer.cur } : null,
    },
    sfx: net.sfx.splice(0, net.sfx.length),
    m: JSON.parse(JSON.stringify({
      p1: match.p1, p2: match.p2, round: match.round, target: match.target,
      tagCD: match.tagCD, over: match.over, winner: match.winner,
    })),
    roundTime, koSeen, koT, hitstop: Hitstop.t,
    announce: announce ? { ...announce } : null,
    trauma: cam.trauma,
  };
}

function guestFrameIdx(f, idx) {
  f._netFrame = idx;
}

function applySnap(m) {
  if (!m || m.t !== "snap") return;
  if (!map || map.id !== m.mapId) {
    map = pickMap(m.mapId);
    setArena(map.width);
    particles = new Particles(map.particles.kind, map.particles.count, { w: arena.width, h: VIEW_H });
  }
  match = m.m;
  roundTime = m.roundTime;
  koSeen = !!m.koSeen;
  koT = m.koT || 0;
  pending = null;
  announce = m.announce;
  Hitstop.t = m.hitstop || 0;
  cam.trauma = m.trauma || 0;
  if (!p1 || p1.kind !== m.p1.kind) p1 = new Fighter(m.p1.kind, m.p1.x, GROUND_Y);
  if (!p2 || p2.kind !== m.p2.kind) p2 = new Fighter(m.p2.kind, m.p2.x, GROUND_Y);
  applyFighter(p1, m.p1);
  applyFighter(p2, m.p2);
  guestFrameIdx(p1, m.p1.frameIdx);
  guestFrameIdx(p2, m.p2.frameIdx);
  Beams.list = (m.fx.beams || []).map((b) => ({ ...b }));
  Missiles.list = (m.fx.missiles || []).map((x) => ({ ...x }));
  Bolts.list = (m.fx.bolts || []).map((b) => ({ ...b, segs: [...b.segs] }));
  if (m.fx.hammer) FlyingHammer.show(m.fx.hammer.x, m.fx.hammer.y, m.fx.hammer.dir);
  else FlyingHammer.hide();
  for (const name of m.sfx || []) {
    try {
      const fn = AudioFX[name];
      if (typeof fn === "function") fn.call(AudioFX);
    } catch { /* ignore */ }
  }
  const key = `${p1.kind}>${match.p1.idx}|${p2.kind}>${match.p2.idx}|${match.p1.team.length},${match.p2.team.length}`;
  if (key !== net.guestKinds) {
    net.guestKinds = key;
    refreshHudPortraits();
  }
  if (state !== STATE.FIGHT) {
    state = STATE.FIGHT;
    screens.show(null);
    document.getElementById("fight-bar").classList.remove("hidden");
    document.getElementById("fight-label").textContent = `${map.name} — GUEST (P2 you)`;
  }
}

function enterFight(mapId) {
  map = pickMap(mapId);
  setArena(map.width);
  particles = new Particles(map.particles.kind, map.particles.count, { w: arena.width, h: VIEW_H });
  resetMatch();
  state = STATE.FIGHT;
  screens.show(null);
  document.getElementById("fight-bar").classList.remove("hidden");
  if (net.mode === "host") hostLabel();
  else document.getElementById("fight-label").textContent =
    `${map.name} — CPU ${DIFF_LABEL[sel.diff] ?? sel.diff}`;
}

function buildHudPortraits() {
  return {
    p1: buildPortrait(activeKind(match.p1)),
    p2: buildPortrait(activeKind(match.p2)),
    p1bench: benchKinds(match.p1).map(buildPortrait),
    p2bench: benchKinds(match.p2).map(buildPortrait),
  };
}

function spawnActives() {
  p1 = new Fighter(activeKind(match.p1), arenaCenter() - 120, GROUND_Y);
  p2 = new Fighter(activeKind(match.p2), arenaCenter() + 120, GROUND_Y);
}

function spawnFighterFor(side, x) {
  const f = side === "p1" ? p1 : p2;
  const st = side === "p1" ? match.p1 : match.p2;
  const kind = activeKind(st);
  const slot = loadSlot(st, st.idx);
  const nf = new Fighter(kind, x ?? (side === "p1" ? arenaCenter() - 120 : arenaCenter() + 120), GROUND_Y);
  nf.hp = Math.min(nf.maxHp, slot.hp);
  nf.rage = slot.rage;
  nf.vuln = !!slot.vuln;
  if (side === "p1") p1 = nf; else p2 = nf;
  return nf;
}

function refreshHudPortraits() {
  hudPort.p1 = buildPortrait(p1.kind);
  hudPort.p2 = buildPortrait(p2.kind);
  hudPort.p1bench = benchKinds(match.p1).map(buildPortrait);
  hudPort.p2bench = benchKinds(match.p2).map(buildPortrait);
}

function spawnReserve(side) {
  spawnFighterFor(side);
  refreshHudPortraits();
}

const TAGABLE = new Set(["IDLE", "WALK", "CROUCH", "SNEAK", "BLOCK", "LAND"]);
const TAG_COST = RAGE.PER_LEVEL / 2;
function tryManualTag(side) {
  const f = side === "p1" ? p1 : p2;
  const req = f.tagRequest;
  f.tagRequest = null;
  if (!req || match.over || koSeen) return;
  if (match.tagCD[side] > 0) return;
  if (f.hp <= 0 || f.freezeT > 0 || !f.grounded || !TAGABLE.has(f.state)) return;
  if (f.rage < TAG_COST) return;
  const st = side === "p1" ? match.p1 : match.p2;
  const tgt = tagTarget(st, req);
  if (tgt < 0) return;
  const paid = Math.max(0, f.rage - TAG_COST);
  saveSlot(st, f.hp, paid, f.vuln);
  Sparks.shadowburst(f.x, f.y);
  AudioFX.whoosh();
  const x = f.x;
  st.idx = tgt;
  const nf = spawnFighterFor(side, x);
  nf.faceOpponent(side === "p1" ? p2 : p1);
  Sparks.shadowburst(nf.x, nf.y);
  refreshHudPortraits();
  match.tagCD[side] = 1.0;
}

function resetMatch() {
  match = createMatch(sel.p1, sel.p2);
  hudPort = buildHudPortraits();
  spawnActives();
  ai = sel.diff === "2p" ? null : new AIController(sel.diff);
  roundTime = ROUND_TIME;
  Hitstop.t = 0;
  cam.trauma = 0;
  Sparks.list.length = 0;
  Clones.list.length = 0;
  Beams.list.length = 0;
  Bolts.list.length = 0;
  FlyingHammer.hide();
  Missiles.list.length = 0;
  Missiles.clear();
  koSeen = false;
  koT = 0;
  pending = null;
  announce = { text: "ROUND 1 — FIGHT!", t: 1.6 };
}

function nextRound() {
  hudPort = buildHudPortraits();
  spawnActives();
  roundTime = ROUND_TIME;
  Hitstop.t = 0;
  cam.trauma = 0;
  Sparks.list.length = 0;
  Clones.list.length = 0;
  Beams.list.length = 0;
  Bolts.list.length = 0;
  FlyingHammer.hide();
  Missiles.list.length = 0;
  Missiles.clear();
  koSeen = false;
  koT = 0;
  pending = null;
  announce = { text: `ROUND ${match.round} — FIGHT!`, t: 1.6 };
}

function resetRound() {
  resetMatch();
}

const screens = initScreens(sel, {
  onState: (s) => { state = STATE[s]; },
  onPickMap: (id) => enterFight(id),
  onQuit: () => { state = STATE.MENU; },
  onSwapMap: () => {
    const ids = Object.keys(MAPS);
    const next = ids[(ids.indexOf(map.id) + 1) % ids.length];
    enterFight(next);
  },
});

const CONTROLS = {
  p1: { left: "a", right: "d", jump: "w", crouch: "s", light: "j", heavy: "k", grab: "l", edge: "e", tag: "x", tagAlt: "c", s1: " ", s2: "f", s3: "o" },
  p2: { left: "arrowleft", right: "arrowright", jump: "arrowup", crouch: "arrowdown", light: ",", heavy: ".", grab: "/", edge: "shift", tag: "n", tagAlt: "b", s1: ";", s2: "'", s3: "p" },
};

const SPECIALS = { s1: "jaguar", s2: "phantom", s3: "ragemode" };

let codeBuf = "";

function applyUnlock() {
  unlockUroboros();
  screens.paintDraft();
  document.getElementById("howto-uroboros")?.classList.remove("hidden");
  const flash = document.getElementById("unlock-flash");
  if (flash) {
    flash.textContent = "UROBOROS UNLOCKED — CHECK THE ROSTER";
    flash.classList.remove("hidden");
    setTimeout(() => flash.classList.add("hidden"), 2600);
  }
  AudioFX.levelUp();
}

function pollMenuCode() {
  for (const k of keys) {
    if (prevKeys.has(k) || k.length !== 1 || k < "a" || k > "z") continue;
    const r = pushCode(codeBuf, k);
    codeBuf = r.buf;
    if (r.hit && !isUroborosUnlocked()) applyUnlock();
  }
  if (isUroborosUnlocked()) {
    document.getElementById("howto-uroboros")?.classList.remove("hidden");
  }
}

let showBoxes = false;

function drive(fighter, map, tap, foe, keySet = keys, prevSet = prevKeys) {
  fighter.moving = (keySet.has(map.left) ? -1 : 0) + (keySet.has(map.right) ? 1 : 0);
  fighter.crouchHeld = keySet.has(map.crouch);
  const awayKey = foe.x >= fighter.x ? map.left : map.right;
  fighter.blockHeld = keySet.has(awayKey);
  if (!prevSet.has(map.jump) && keySet.has(map.jump)) fighter.queueJump();
  const lEdge = !prevSet.has(map.light) && keySet.has(map.light);
  const hEdge = !prevSet.has(map.heavy) && keySet.has(map.heavy);
  const eEdge = !prevSet.has(map.edge) && keySet.has(map.edge);

  if (eEdge) {
    if (!fighter.trySamuraiEdge() && !fighter.tryRepulsor() && !fighter.tryHammer()) fighter.pressHeavy();
  }
  if (lEdge) fighter.pressLight();
  if (hEdge) fighter.pressHeavy();
  if (!prevSet.has(map.grab) && keySet.has(map.grab)) fighter.pressGrab();

  if (!prevSet.has(map.tag) && keySet.has(map.tag)) fighter.queueTag("next");
  if (!prevSet.has(map.tagAlt) && keySet.has(map.tagAlt)) fighter.queueTag("alt");
  for (const slot of ["s1", "s2", "s3"]) {
    if (!prevSet.has(map[slot]) && keySet.has(map[slot])) fighter.trySpecial(SPECIALS[slot], foe);
  }
  for (const [key, dir] of [[map.left, -1], [map.right, 1]]) {
    if (!prevSet.has(key) && keySet.has(key)) {
      if (tap.key === key && elapsed - tap.t < MOVE.TAP_WINDOW) {
        fighter.queueDash(dir);
        tap.key = null;
      } else {
        tap.key = key;
        tap.t = elapsed;
      }
    }
  }
}

function pollMoveInput(dt) {
  drive(p1, CONTROLS.p1, tap1, p2);

  if (net.mode === "host" && net.guestOn) {
    drive(p2, CONTROLS.p2, tap2, p1, net.keys, net.prev);
  } else if (ai) ai.update(dt, p2, p1, { tagCD: match.tagCD.p2, side: match.p2, clock: roundTime, ahead: match.p2.wins > match.p1.wins });
  else drive(p2, CONTROLS.p2, tap2, p1);
  if (!prevKeys.has("m") && keys.has("m")) {
    document.getElementById("btn-swap-map").click();
  }
  if (!prevKeys.has("escape") && keys.has("escape")) {
    if (net.mode === "host") {
      try {
        net.api?.send({ t: "bye" });
      } catch { /* ignore */ }
      teardownNet();
    }
    state = STATE.MENU;
    screens.show("screen-menu");
  }
  if (!prevKeys.has("h") && keys.has("h")) showBoxes = !showBoxes;
  if (!prevKeys.has("r") && keys.has("r")) resetRound();
  prevKeys = new Set(keys);
  if (net.mode === "host") net.prev = new Set(net.keys);
}

function drawHUD() {

  const drawPort = (img, x) => {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x - 2, 2, 44, 44);
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(img, x, 4, 40, 40);
  };
  if (hudPort) {
    drawPort(hudPort.p1, 20);
    drawPort(hudPort.p2, VIEW_W - 60);
  }
  const drawBar = (x, label, color, frac) => {
    ctx.fillStyle = "rgba(0,0,0,0.55)";
    ctx.fillRect(x, 34, 300, 22);
    ctx.fillStyle = "#2a2a3a";
    ctx.fillRect(x + 2, 36, 296, 18);
    ctx.fillStyle = color;
    ctx.fillRect(x + 2, 36, Math.max(0, 296 * frac), 18);
    ctx.fillStyle = "#fff";
    ctx.font = "12px 'Courier New', monospace";
    ctx.fillText(label, x + 6, 49);
  };
  drawBar(70, `P1 ${CHARACTERS[p1.kind].name} ${Math.ceil(p1.hp)}/${p1.maxHp}`, "#3ecf5a", p1.hp / p1.maxHp);
  drawBar(VIEW_W - 370, `P2 ${CHARACTERS[p2.kind].name} ${Math.ceil(p2.hp)}/${p2.maxHp}`, "#ff4b4b", p2.hp / p2.maxHp);

  const drawRage = (x, f) => {
    const segW = 96, segH = 12, gap = 4, y = 60;
    const cols = ["#ffb13e", "#ff7a3e", "#ff3b3b"];
    for (let i = 0; i < 3; i++) {
      const bx = x + i * (segW + gap);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(bx, y, segW, segH);
      const fill = Math.max(0, Math.min(1, (f.rage - i * RAGE.PER_LEVEL) / RAGE.PER_LEVEL));
      if (fill > 0) {
        ctx.fillStyle = cols[i];
        ctx.fillRect(bx + 1, y + 1, (segW - 2) * fill, segH - 2);
      }
      ctx.strokeStyle = f.rageFlash > 0 ? "#ffffff" : "#3a3a4d";
      ctx.lineWidth = f.rageFlash > 0 ? 2 : 1;
      ctx.strokeRect(bx + 0.5, y + 0.5, segW - 1, segH - 1);
    }
    ctx.fillStyle = f.rageLevel > 0 ? "#ffd23e" : "#8a8a9a";
    ctx.font = "bold 11px 'Courier New', monospace";
    ctx.fillText(`RAGE ${f.rageLevel}/3`, x + 3 * (segW + gap) + 6, y + 11);
  };
  drawRage(70, p1);
  drawRage(VIEW_W - 370, p2);

  const timeTxt = `${Math.ceil(roundTime)}`;
  ctx.font = "bold 26px 'Courier New', monospace";
  ctx.textAlign = "center";
  ctx.fillStyle = roundTime <= 10 ? "#ff3b3b" : "#ffd23e";
  ctx.fillText(timeTxt, VIEW_W / 2, 50);

  ctx.font = "bold 12px 'Courier New', monospace";
  ctx.fillStyle = "#fff";
  const pip = (w) => "●".repeat(w) + "○".repeat(Math.max(0, match.target - w));
  ctx.fillText(`R${match.round}  P1 [${pip(match.p1.wins)}]  P2 [${pip(match.p2.wins)}]`, VIEW_W / 2, 68);

  ctx.textAlign = "left";
  const drawBench = (imgs, x) => {
    imgs.forEach((img, i) => {
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(x + i * 24 - 1, 75, 22, 22);
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, x + i * 24, 76, 20, 20);
    });
  };
  if (hudPort) {
    drawBench(hudPort.p1bench, 70);
    const bw = hudPort.p2bench.length * 24;
    drawBench(hudPort.p2bench, VIEW_W - 70 - bw);
  }

  if (announce) {
    ctx.textAlign = "center";
    ctx.font = "bold 28px 'Courier New', monospace";
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#101018";
    ctx.strokeText(announce.text, VIEW_W / 2, 140);

    ctx.fillStyle = "#ffd23e";
    ctx.fillText(announce.text, VIEW_W / 2, 140);

    ctx.textAlign = "left";
  }

  ctx.font = "12px 'Courier New', monospace";
  ctx.fillStyle = "#9fd4ff";
  const tag = (f, x) => {
    const air = f.grounded ? "GRND" : "AIR ";
    const extra = f.state === FState.SPECIAL && f.specialId ? `:${f.specialId}` : "";
    ctx.fillText(`${f.kind.toUpperCase()} ${f.state}${extra} ${air}${f.isLow ? " LOW" : ""}`, x, 88);
  };
  tag(p1, 20);
  const label2 = `${p2.kind.toUpperCase()} ${p2.state}${p2.state === FState.SPECIAL && p2.specialId ? `:${p2.specialId}` : ""} ${p2.grounded ? "GRND" : "AIR "}${p2.isLow ? " LOW" : ""}`;
  ctx.fillText(label2, VIEW_W - 20 - ctx.measureText(label2).width, 88);

  if (koSeen) {
    const cx = VIEW_W / 2;

    ctx.fillStyle = "rgba(8,4,12,0.45)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.save();
    ctx.translate(cx, VIEW_H / 2 - 70);

    const pop = Math.min(1, koT / 0.25);

    ctx.scale(0.55 + 0.45 * pop, 0.55 + 0.45 * pop);
    ctx.textAlign = "center";
    ctx.font = "bold 90px 'Courier New', monospace";
    ctx.lineWidth = 6;
    ctx.strokeStyle = "#2a0a0a";
    ctx.strokeText("K.O.", 0, 0);
    ctx.fillStyle = "#ff3b3b";
    ctx.fillText("K.O.", 0, 0);
    ctx.restore();
    ctx.textAlign = "left";
  }
  if (match.over) {
    const cx = VIEW_W / 2;

    ctx.fillStyle = "rgba(8,4,12,0.55)";
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.textAlign = "center";
    const f = match.winner === "p1" ? p1 : p2;
    const meta = CHARACTERS[f.kind];
    ctx.fillStyle = meta.accent;
    ctx.font = "bold 34px 'Courier New', monospace";
    ctx.fillText(`${match.winner === "p1" ? "P1" : "P2"} ${meta.name} TAKES THE MATCH`, cx, VIEW_H / 2 - 30);

    ctx.fillStyle = "#fff";
    ctx.font = "bold 22px 'Courier New', monospace";
    ctx.fillText(`${match.p1.wins} — ${match.p2.wins}`, cx, VIEW_H / 2 + 8);

    const img = hudPort?.[match.winner];
    if (img) {
      const S = 96;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(cx - S / 2 - 4, VIEW_H / 2 + 24, S + 8, S + 8);

      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(img, cx - S / 2, VIEW_H / 2 + 28, S, S);

    }
    ctx.fillStyle = "#fff";
    ctx.font = "16px 'Courier New', monospace";
    ctx.fillText("press R to rematch  •  ESC for menu", cx, VIEW_H / 2 + 150);

    ctx.textAlign = "left";
  }
}

function drawBoxes() {
  const rect = (r, color) => {
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.strokeRect(Math.round(r.x - cam.x), Math.round(r.y), Math.round(r.w), Math.round(r.h));
  };
  for (const f of [p1, p2]) rect(hurtboxOf(f), f.hp > 0 ? "#3ecf5a" : "#555555");
  for (const f of [p1, p2]) {
    if (f.state === FState.ATTACK && f.phase === "active" && !f.hasHit) {
      rect(hitboxOf(f, f.attackMove), "#ffd23e");
    }
  }
}

let last = performance.now();

function hostTick(dt) {
    if (!match.over && !koSeen && roundTime > 0 && (p1.hp <= 0 || p2.hp <= 0)) {
      koSeen = true;
      koT = 0;
      const p1dead = p1.hp <= 0, p2dead = p2.hp <= 0;
      Hitstop.t = Math.max(Hitstop.t, 0.30);
      cam.kick(0.75);
      AudioFX.ko();
      if (p1dead && p2dead) {
        Sparks.ko(p1.x, p1.y - 70);
        Sparks.ko(p2.x, p2.y - 70);
        pending = { type: "draw" };
      } else {
        const loser = p1dead ? "p1" : "p2";
        Sparks.ko(loser === "p1" ? p1.x : p2.x, (loser === "p1" ? p1 : p2).y - 70);
        const res = onKO(match, loser);
        pending = res === "tag" ? { type: "tag", side: loser } : { type: "round", winner: res };
      }
    }
    if (koSeen) {
      koT += dt;
      if (koT >= 1.4 && pending) {

        const p = pending;
        pending = null;
        koSeen = false;
        koT = 0;
        if (p.type === "tag") {
          spawnReserve(p.side);
          const kind = p.side === "p1" ? p1.kind : p2.kind;
          announce = { text: `${CHARACTERS[kind].name} ENTERS!`, t: 1.4 };
        } else if (p.type === "draw") {
          spawnActives();
          roundTime = ROUND_TIME;
          announce = { text: "DOUBLE KO — REPLAY!", t: 1.6 };
        } else if (p.type === "round") {
          const done = awardRound(match, p.winner);
          if (done === "match") {
            announce = null;
          } else {
            nextRound();
            const nm = p.winner === "p1" ? activeKind(match.p1) : activeKind(match.p2);
            announce = { text: `${CHARACTERS[nm].name} TAKES IT — ROUND ${match.round}!`, t: 1.8 };
          }
        }
      }
    } else if (!match.over) {

      roundTime -= dt;
      if (announce) {
        announce.t -= dt;
        if (announce.t <= 0) announce = null;
      }
      if (roundTime <= 0) {

        roundTime = 0;
        const w = timeoutWinner(
          p1.hp / p1.maxHp, p2.hp / p2.maxHp,
          benchKinds(match.p1).length, benchKinds(match.p2).length
        );
        AudioFX.ko();
        if (w === "draw") {
          spawnActives();
          roundTime = ROUND_TIME;
          announce = { text: "TIME — DEAD EVEN, REPLAY!", t: 1.8 };
        } else {
          const done = awardRound(match, w);
          if (done === "match") announce = null;
          else {
            nextRound();
            announce = { text: `TIME — ${w === "p1" ? "P1" : "P2"} TAKES ROUND ${match.round}!`, t: 1.8 };
          }
        }
      }
    }

    const simDt = koSeen && koT < 1.4 ? dt * 0.35 : dt;
    pollMoveInput(simDt);
    if (!match.over && !koSeen) {

      match.tagCD.p1 = Math.max(0, match.tagCD.p1 - simDt);
      match.tagCD.p2 = Math.max(0, match.tagCD.p2 - simDt);
      tryManualTag("p1");
      tryManualTag("p2");
    }
    if (match.over) {

    } else if (Hitstop.t > 0) {
      Hitstop.t -= dt;
    } else {
      p1.update(simDt, p2);
      p2.update(simDt, p1);

      const clinch =
        p1.state === FState.GRAB || p2.state === FState.GRAB ||
        p1.state === FState.THROWN || p2.state === FState.THROWN ||
        p1.state === FState.SPECIAL || p2.state === FState.SPECIAL;
      if (!clinch) separate(p1, p2);
      Sparks.update(simDt);
      Clones.update(simDt);
      Beams.update(simDt);
      Bolts.update(simDt);
      Missiles.update(simDt);

      for (const f of [p1, p2]) {
        const c = f.lastContact;
        f.lastContact = null;
        if (!c) continue;
        if (c.type === "block") {
          Sparks.block(c.x, c.y);
          if (f.kind === "wolverine") Sparks.slash(c.x, c.y, f.attackDir);
        } else {
          Sparks.hit(c.x, c.y, f.attackDir);
          if (f.kind === "wolverine") Sparks.slash(c.x, c.y, f.attackDir);
          cam.kick(Math.min(0.32, 0.07 + (c.weight || 5) * 0.012));
        }
      }

      for (const f of [p1, p2]) {
        if (f.camKick) {
          cam.kick(f.camKick);
          f.camKick = 0;
        }
      }
    }
    drawFight(simDt);
    if (net.mode === "host" && net.api) {
      try {
        net.api.send(buildSnap());
      } catch (err) {
        netStatus("net error: " + (err && err.message ? err.message : err));
      }
    }
}

function guestTick(dt) {
  try {
    if (net.api) {
      const keyStr = [...keys].sort().join(",");
      if (keyStr !== net.lastKeys) {
        net.lastKeys = keyStr;
        net.api.send({ t: "in", keys: [...keys] });
      }
    }
    if (net.snap) {
      applySnap(net.snap);
      net.snap = null;
    }
  } catch (err) {
    netStatus("net error: " + (err && err.message ? err.message : err));
    return;
  }
  if (state !== STATE.FIGHT) return;
  if (!prevKeys.has("escape") && keys.has("escape")) {
    netDrop("left the fight");
    return;
  }
  if (!prevKeys.has("h") && keys.has("h")) showBoxes = !showBoxes;
  if (++net.linkTick % 30 === 0) {
    const now = performance.now();
    net.snapTimes = net.snapTimes.filter((t) => now - t < 1000);
    document.getElementById("fight-label").textContent =
      `${map.name} — GUEST (P2 you) — LINK ${net.snapTimes.length}/s`;
  }
  const simDt = koSeen && koT < 1.4 ? dt * 0.35 : dt;
  drawFight(simDt);
}

function drawFight(simDt) {
    cam.update(simDt, p1, p2);
    particles.update(simDt);

    ctx.save();
    ctx.translate(cam.shakeX(elapsed), cam.shakeY(elapsed));

    map.draw(ctx, cam.x, elapsed);
    drawShadow(ctx, p1.x, GROUND_Y, cam.x, Math.round(p1.w * 0.78));
    drawShadow(ctx, p2.x, GROUND_Y, cam.x, Math.round(p2.w * 0.78));

    const [back, front] = p1.y <= p2.y ? [p1, p2] : [p2, p1];
    Clones.draw(ctx, cam.x);
    back.draw(ctx, cam.x);
    front.draw(ctx, cam.x);
    if (showBoxes) drawBoxes();
    Sparks.draw(ctx, cam.x);
    Beams.draw(ctx, cam.x);
    Bolts.draw(ctx, cam.x);
    FlyingHammer.draw(ctx, cam.x);
    Missiles.draw(ctx, cam.x);
    particles.draw(ctx, cam.x, 0.7);
    ctx.restore();
    drawHUD();
}

function loop(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  elapsed += dt;
  if (state === STATE.FIGHT) {
    if (net.mode === "guest") guestTick(dt);
    else hostTick(dt);
  } else {

    pollMenuCode();
    cam.x = (Math.sin(elapsed * 0.05) * 0.5 + 0.5) * Math.max(0, arena.width - VIEW_W);
    map.draw(ctx, cam.x, elapsed);
  }
  prevKeys = new Set(keys);
  requestAnimationFrame(loop);
}

initInput();

window.addEventListener("error", (e) => {
  if (net.mode === "off") return;
  const msg = (e && e.message) || "unknown error";
  netStatus("net error: " + msg);
});

let netPendingRole = null;
document.getElementById("btn-host").onclick = () => {
  AudioFX.blip(660);
  netPendingRole = "host";
  const row = document.getElementById("net-row");
  row?.classList.remove("hidden");
  const ip = document.getElementById("net-ip");
  if (ip && !ip.value) ip.value = "localhost";
  const port = document.getElementById("net-port");
  if (port && !port.value) port.value = "8125";
};
document.getElementById("btn-join").onclick = () => {
  AudioFX.blip(660);
  netPendingRole = "guest";
  const row = document.getElementById("net-row");
  row?.classList.remove("hidden");
  const ip = document.getElementById("net-ip");
  if (ip && !ip.value) ip.value = lastNetIP();
  const port = document.getElementById("net-port");
  if (port && !port.value) port.value = "8125";
};
document.getElementById("btn-connect").onclick = () => {
  AudioFX.blip(660);
  const ip = document.getElementById("net-ip")?.value || "localhost";
  netConnect(netPendingRole || "guest", ip);
};
document.getElementById("btn-netback").onclick = () => {
  AudioFX.blip(400);
  document.getElementById("net-row")?.classList.add("hidden");
  teardownNet();
  state = STATE.MENU;
  screens.show("screen-menu");
};

canvas.addEventListener("mousedown", (e) => {
  if (state !== STATE.FIGHT || net.mode === "guest") return;
  if (e.button === 0) { p1.pressLight(); return; }
  if (e.button !== 2) return;
  p1.pressHeavy();
});
canvas.addEventListener("contextmenu", (e) => e.preventDefault());
requestAnimationFrame(loop);

