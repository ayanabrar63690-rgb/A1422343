// Special-ability runtimes for player-created fighters. Slot ids map like
// every other fighter: jaguar -> slot 0 (1 rage), phantom -> slot 1 (2),
// ragemode -> slot 2 (3).
import { CHARACTERS } from "../characters/data.js";
import { customDef, getAbility, isCustomKind, specialRange } from "../characters/custom.js";
import { resolveStrike, overlap, hurtboxOf } from "./combat.js";
import { Sparks, Beams, Bolts, Flash, PlasmaOrbs } from "../effects.js";
import { AudioFX } from "../audio.js";
import { GROUND_Y, MOVE } from "../config.js";
import { arena } from "../arena.js";

const SLOT_OF = { jaguar: 0, phantom: 1, ragemode: 2 };

function endCustom(f) {
  f.state = "IDLE";
  f.specialId = null;
  f.special = null;
}

function dmult(f) {
  return CHARACTERS[f.kind]?.stats?.damage ?? 1;
}

function beamMove(f, dmg) {
  return {
    damage: dmg * dmult(f), hitstun: 0.42, knockback: 300, hitstop: 0.06,
    level: "mid", blockstun: 0.26, blockPush: 340, chip: 1, heat: true,
    hit: { w: 0, top: 0, h: 0 }, noRage: false,
  };
}

function meleeMove(f, dmg, hit) {
  return {
    damage: dmg * dmult(f), hitstun: 0.5, knockback: 420, hitstop: 0.08,
    level: "mid", blockstun: 0.34, blockPush: 460, chip: 0, heat: true, hit,
  };
}

// Hit test a horizontal beam fired from f toward f.attackDir.
function beamHits(f, foe, len, dmg) {
  const dir = f.attackDir;
  const x1 = dir === 1 ? f.x : f.x - len;
  const box = { x: x1, y: f.y - 115, w: len, h: 50 };
  if (!overlap(box, hurtboxOf(foe))) return null;
  return resolveStrike(f, foe, beamMove(f, dmg), box);
}

export function tryCustomSpecial(f, id, foe) {
  if (!isCustomKind(f.kind)) return false;
  if (f.noSpecials || f.away) return false;
  if (f.webT > 0 || f.hp <= 0 || f.freezeT > 0) return false;
  if (["SPECIAL", "KO", "GRAB", "THROWN", "ATTACK", "HITSTUN", "BLOCKSTUN", "KDOWN"].includes(f.state)) return false;
  const def = customDef(f.kind);
  if (!def) return false;
  const slot = SLOT_OF[id];
  if (slot === undefined) return false;
  const ability = getAbility(def.abilities[slot]);
  if (!ability) return false;
  const cost = slot + 1;
  if (f.rageLevel < cost) return false;
  if (Math.abs(foe.x - f.x) > 760) return false;
  if (!f.spendRage(cost)) return false;

  f.y = GROUND_Y; f.vy = 0; f.grounded = true;
  f.attackId = null; f.phase = null; f.chainQueued = false;
  f.knockVX = 0;
  f.facing = foe.x >= f.x ? 1 : -1;
  f.attackDir = f.facing;
  f.state = "SPECIAL";
  f.specialId = ability.id;
  f.special = { phase: "startup", t: 0.14, i: 0, fired: 0, struck: false, frame: null };
  f.invulnT = Math.max(f.invulnT, 0.25);

  switch (ability.id) {
    case "dash":
      f.special.phase = "lunge"; f.special.t = 0.22;
      f.special.frame = f.sprites.special[0];
      AudioFX.whoosh();
      break;
    case "combo":
      f.special.phase = "fire"; f.special.t = 0.08; f.special.fired = 0;
      f.special.frame = f.sprites.special[2];
      AudioFX.repulsor();
      break;
    case "beam":
      f.special.phase = "aim"; f.special.t = 0.16;
      f.special.frame = f.sprites.special[2];
      break;
    case "plasma":
      f.special.phase = "summon"; f.special.t = 0.2; f.special.fired = 0;
      f.special.frame = f.sprites.special[8];
      AudioFX.powerup();
      break;
    case "rush":
      f.special.phase = "blink"; f.special.t = 0.12; f.special.i = 0;
      f.special.frame = f.sprites.special[5];
      break;
    case "shock":
      f.special.phase = "charge"; f.special.t = 0.32;
      f.special.frame = f.sprites.special[7];
      AudioFX.whoosh();
      break;
    default:
      f.state = "IDLE"; f.specialId = null; f.special = null;
      return true;
  }
  return true;
}

export function updateCustomSpecial(f, foe, dt) {
  const s = f.special;
  if (!s) { f.state = "IDLE"; f.specialId = null; return; }
  s.t -= dt;
  const rangeMult = specialRange(f.kind);

  switch (f.specialId) {
    case "dash": {
      if (s.phase === "lunge") {
        s.frame = f.sprites.special[0];
        f.x += f.attackDir * 1250 * dt;
        const box = { x: f.x - 50, y: f.y - 130, w: 100, h: 110 };
        if (!s.struck && overlap(box, hurtboxOf(foe))) {
          s.struck = true;
          const hit = { ...meleeMove(f, 12, { w: 90, top: 120, h: 70 }) };
          const c = resolveStrike(f, foe, hit, box);
          if (c && c.type === "hit") { Sparks.hit(foe.x, f.y - 90, f.attackDir); AudioFX.hit(); }
        }
        if (s.t <= 0) { s.phase = "recover"; s.t = 0.26; }
      } else {
        s.frame = f.sprites.idle[0];
        if (s.t <= 0) endCustom(f);
      }
      break;
    }

    case "combo": {
      s.frame = f.sprites.special[2];
      if (s.phase === "fire") {
        if (s.fired < 3) {
          if (s.t <= 0) {
            s.fired += 1;
            s.t = s.fired >= 3 ? 0.3 : 0.15;
            const len = Math.min(arena.width, 420 * rangeMult);
            const x1 = f.x + f.attackDir * 14;
            const x2 = Math.max(0, Math.min(arena.width, f.x + f.attackDir * len));
            Beams.spawn(x1, f.y - 90, x2, f.y - 90, 0.14, CHARACTERS[f.kind]?.accent ?? null);
            AudioFX.zap();
            const c = beamHits(f, foe, len, s.fired === 3 ? 9 : 6);
            if (c && c.type === "hit") Sparks.blood(foe.x, f.y - 90);
          }
        } else if (s.t <= 0) {
          s.phase = "recover"; s.t = 0.28;
        }
      } else if (s.phase === "recover") {
        s.frame = f.sprites.idle[0];
        if (s.t <= 0) endCustom(f);
      }
      break;
    }

    case "beam": {
      if (s.phase === "aim") {
        s.frame = f.sprites.special[2];
        if (Math.random() < 0.6) Sparks.ember(f.x + f.attackDir * 20, f.y - 90);
        if (s.t <= 0) {
          s.phase = "fire"; s.t = 0.22;
          const len = Math.min(arena.width, 520 * rangeMult);
          const x1 = f.x + f.attackDir * 14;
          const x2 = f.x + f.attackDir * len;
          Beams.spawn(x1, f.y - 90, Math.max(0, Math.min(arena.width, x2)), f.y - 90, 0.24, CHARACTERS[f.kind]?.accent ?? null);
          AudioFX.repulsor();
          f.camKick = Math.max(f.camKick, 0.25);
          const c = beamHits(f, foe, len, 16);
          if (c && c.type === "hit") { Sparks.hit(foe.x, f.y - 90, f.attackDir); AudioFX.hit(); }
        }
      } else if (s.phase === "fire") {
        s.frame = f.sprites.special[2];
        if (s.t <= 0) { s.phase = "recover"; s.t = 0.34; }
      } else {
        s.frame = f.sprites.idle[0];
        if (s.t <= 0) endCustom(f);
      }
      break;
    }

    case "plasma": {
      if (s.phase === "summon") {
        s.frame = f.sprites.special[8];
        for (let i = 0; i < 3; i++) if (Math.random() < 0.6) Sparks.violet(f.x + (Math.random() - 0.5) * 40, f.y - 60 - Math.random() * 80);
        if (s.t <= 0) {
          s.phase = "launch"; s.t = 0.18;
          // one big, slow, straight, vibrant nebula aura traveling horizontally
          const wallX = f.attackDir === 1 ? arena.width + 200 : -200;
          const o = PlasmaOrbs.list.length;
          PlasmaOrbs.spawn(
            f.x + f.attackDir * 24, f.y - 90,
            wallX, f.y - 90,
            { life: 6.0, speed: 200, accel: 0, orbit: 0, r: 18, nebula: true, phase: 0 }
          );
          PlasmaOrbs.list[o].owner = f.kind;
          AudioFX.powerup();
          f.camKick = Math.max(f.camKick, 0.2);
        }
      } else if (s.phase === "launch") {
        s.frame = f.sprites.special[8];
        if (s.t <= 0) { s.phase = "recover"; s.t = 0.3; }
      } else {
        s.frame = f.sprites.idle[0];
        if (s.t <= 0) endCustom(f);
      }
      break;
    }

    case "rush": {
      s.frame = f.sprites.special[5];
      if (s.phase === "blink") {
        if (s.t <= 0 && s.i < 3) {
          s.i += 1;
          s.t = 0.14;
          const dir = foe.x >= f.x ? 1 : -1;
          f.x = Math.max(80, Math.min(arena.width - 80, foe.x - dir * 46));
          f.attackDir = dir;
          const box = { x: f.x + dir * 30 - 40, y: f.y - 130, w: 90, h: 110 };
          const c = resolveStrike(f, foe, meleeMove(f, 7, { w: 90, top: 120, h: 70 }), box);
          Sparks.slash(f.x + dir * 40, f.y - 90, dir);
          if (c && c.type === "hit") AudioFX.hit();
        }
        if (s.i >= 3 && s.t <= 0) { s.phase = "recover"; s.t = 0.3; }
      } else {
        s.frame = f.sprites.idle[0];
        if (s.t <= 0) endCustom(f);
      }
      break;
    }

    case "shock": {
      if (s.phase === "charge") {
        s.frame = f.sprites.special[7];
        f.x += f.attackDir * 950 * dt;
        if (Math.random() < 0.6) Sparks.ember(f.x - f.attackDir * 20, f.y - 60 - Math.random() * 60);
        if (s.t <= 0) {
          s.phase = "slam"; s.t = 0.26;
          Flash.boom(0.2, 0.5);
          Bolts.strike(f.x, GROUND_Y);
          Sparks.ring(f.x, GROUND_Y - 20, 90);
          const box = { x: f.x - 120, y: GROUND_Y - 150, w: 240, h: 150 };
          const c = resolveStrike(f, foe, meleeMove(f, 18, { w: 200, top: 60, h: 120 }), box);
          if (c && c.type === "hit") { foe.knockdown(f.attackDir, 520, 420); AudioFX.hit(); }
          f.camKick = Math.max(f.camKick, 0.35);
        }
      } else if (s.phase === "slam") {
        s.frame = f.sprites.attack[5];
        if (s.t <= 0) { s.phase = "recover"; s.t = 0.34; }
      } else {
        s.frame = f.sprites.idle[0];
        if (s.t <= 0) endCustom(f);
      }
      break;
    }

    default:
      endCustom(f);
  }
}

// Nebula auras travel long after the cast ends, so they resolve outside the
// special loop (same pattern as Doom's barrage orbs). Call once per tick for
// each custom-controlled fighter's aura owner.
export function updateCustomOrbs(f, foe) {
  for (const o of PlasmaOrbs.list) {
    if (!o.nebula || o.done || o.owner !== f.kind) continue;
    if (foe.hp <= 0 || foe.invulnT > 0 || foe.state === "KO") continue;
    if (o.x < -80 || o.x > arena.width + 80 || o.t >= o.life) { o.done = true; o.t = o.life; continue; }
    const box = { x: o.x - o.r, y: o.y - o.r, w: o.r * 2, h: o.r * 2 };
    if (!overlap(box, hurtboxOf(foe))) continue;
    o.done = true;
    o.t = o.life; // burst itself on contact
    const c = resolveStrike(f, foe, beamMove(f, 12), box);
    if (c) { Sparks.violet(o.x, o.y); f.camKick = Math.max(f.camKick, 0.25); AudioFX.hit(); }
  }
}
