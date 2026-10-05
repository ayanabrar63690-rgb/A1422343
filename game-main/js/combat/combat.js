import { AudioFX } from "../audio.js";
import { RAGE, BLEED } from "./data.js";

export const Hitstop = { t: 0 };

export function vulnMult(def, heat) {
  if (!def.vuln) return 1;
  return heat ? 1.25 : 1.10;
}

export function hurtboxOf(f) {

  const fw = f.w ?? 108, fh = f.h ?? 156;
  const h = f.isLow ? fh * 0.59 : fh * 0.95;
  const w = f.isLow ? fw * 0.52 : fw * 0.48;
  return { x: f.x - w / 2, y: f.y - h, w, h };
}

export function hitboxOf(att, move) {
  if (move.ray) {
    const { len, top, h } = move.ray;
    const x = att.attackDir === 1 ? att.x : att.x - len;
    return { x, y: att.y - top - h / 2, w: len, h };
  }
  const { w, top, h } = move.hit;

  const aw = att.w ?? 108;
  const cx = att.x + att.attackDir * (aw * 0.24 + w / 2 - 8);
  return { x: cx - w / 2, y: att.y - top, w, h };
}

export function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

export function grabCheck(att, def, range) {
  if (att === def || def.hp <= 0 || !def.grounded || def.invulnT > 0) return false;
  if (def.state === "THROWN" || def.state === "KO") return false;
  const dx = def.x - att.x;
  if (Math.abs(dx) > range) return false;
  if (dx !== 0 && Math.sign(dx) !== att.attackDir) return false;
  return true;
}

function isGuarding(def, att, move) {
  if (def.state !== "BLOCK" || !def.grounded) return false;
  const toward = att.x >= def.x ? 1 : -1;
  if (def.facing !== toward) return false;
  if (move.level === "low") return def.blockLow === true;
  if (move.level === "high") return def.blockLow === false;
  return true;
}

export function resolveStrike(att, def, move, boxOverride = null) {
  if (att === def || def.hp <= 0 || def.invulnT > 0) return null;
  // Enraged Wesker hits 15% harder, and rage abilities are flagged so a
  // raged Wesker can't turtle against them with his melee reduction.
  const RAGE_SPECIALS = new Set(["ragemode", "breaker", "shelling", "godblast", "impale", "maelstrom", "throne"]);
  if (att.state === "SPECIAL" && RAGE_SPECIALS.has(att.specialId)) move = { ...move, rageAbility: true };
  if ((att.kind === "wesker" || att.kind === "cheatwesker") && att.weskerRaged && typeof move.damage === "number") {
    move = { ...move, damage: move.damage * 1.15 };
  }
  // Sky blasts (lobbed missiles, orbital beams) are slipped by dashing in
  // any direction — the dash carries through the impact frame.
  if (move.sky && (def.state === "DASH" || def.state === "BACKDASH")) return null;
  const box = boxOverride || hitboxOf(att, move);
  if (!overlap(box, hurtboxOf(def))) return null;

  const landed = move.gamble && Math.random() >= move.gamble.chance
    ? { ...move, damage: 0 }
    : move;

  const contact = { x: def.x - att.attackDir * ((att.w ?? 108) * 0.24), y: def.y - 110, weight: landed.damage ?? 5 };
  if (move.hitstop > Hitstop.t) Hitstop.t = move.hitstop;
  if (isGuarding(def, att, move)) {
    def.takeBlocked(landed, att.attackDir);
    if (move.bleed && typeof def.applyBleed === "function") def.applyBleed(1);
    if (!move.noRage) {
      att.addRage(RAGE.onDealBlock);
      def.addRage(RAGE.onTakeBlock);
    }
    AudioFX.block();
    att.lastContact = { type: "block", ...contact };
  } else {
    def.takeHit(landed, att.attackDir);
    if (move.bleed && typeof def.applyBleed === "function") def.applyBleed(BLEED.ticks);
    if (!move.noRage) {
      att.addRage(RAGE.onDealHit);
      def.addRage(RAGE.onTakeHit);
    }
    AudioFX.hit();
    att.lastContact = { type: "hit", ...contact };
  }
  return att.lastContact;
}

